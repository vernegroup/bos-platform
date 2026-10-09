// Integration tests for capacity addon using simulated BOS sessions, SQL and Stripe.
// No network, real credentials or writes to Neon/Stripe.
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const ts = require("typescript");
const path = require("node:path");

function harness({access=null,licensed=false,eligible=licensed,paid=true,price="price_1UOb8W1ETGwirCfz2kz71m3W",existing=false}={}){
 const calls={stripe:0,queries:[],grants:0};
 const metadata={bos_kind:"standard_capacity_addon",organization_id:"org-test",product_id:"product-test",product:"onboarding",bos_user_id:"user-test",standards_added:"10"};
 const stripe={
  checkout:{sessions:{
   create:async()=>{calls.stripe++;return {url:"https://checkout.stripe.test/test"};},
   listLineItems:async()=>({data:[{price:{id:price},quantity:1}]})
  }}
 };
 const sql={unsafe:async(q,args)=>{
  calls.queries.push({q,args});
  if(q.includes("SELECT p.id FROM products"))return licensed?[{id:"product-test"}]:[];
  return [];
 },begin:async fn=>fn({unsafe:async(q,args)=>{
  calls.queries.push({q,args});
  if(q.includes("SELECT id FROM standard_capacity_grants"))return existing?[{id:"grant-test"}]:[];
  if(q.includes("SELECT 1 FROM licenses"))return eligible?[{ok:1}]:[];
  if(q.includes("INSERT INTO standard_capacity_grants"))calls.grants++;
  if(q.includes("SELECT email FROM users"))return [{email:"test@example.invalid"}];
  if(q.includes("SELECT COALESCE(SUM(quantity)"))return [{total:20}];
  return [];
 }})};
 const modules={
  "@/lib/db":{db:()=>sql},
  "@/lib/stripe":{stripe},
  "@/lib/bos/app-url":{bosAppUrl:()=>"https://bos.test"},
  "@/lib/bos/access":{resolveBOSAccess:async()=>access},
  "@/lib/bos/billingRepository":{resolveBillingCustomerId:async()=>null},
  "@/lib/bos/capacityAddonEmail":{deliverCapacityAddonConfirmation:async()=>({delivered:true})},
  "server-only":{}
 };
 const filename=path.resolve(__dirname,"../lib/bos/capacityAddon.ts");
 const source=fs.readFileSync(filename,"utf8");
 const compiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;
 const exports={};
 vm.runInNewContext(compiled,{exports,require:(id)=>{if(!(id in modules))throw new Error("Unexpected dependency: "+id);return modules[id];},console,process},{filename});
 return {api:exports,calls,session:{id:"cs_test_123",mode:"payment",payment_status:paid?"paid":"unpaid",client_reference_id:"org-test",metadata}};
}
const owner={user:{id:"user-test",email:"test@example.invalid"},organization:{id:"org-test"},membership:{role:"OWNER"}};
test("unauthenticated user cannot open checkout",async()=>{
 const h=harness();assert.equal((await h.api.createCapacityAddonCheckout("onboarding")).error,"auth_required");assert.equal(h.calls.stripe,0);
});
test("logged-in owner without license cannot open checkout or create Stripe session",async()=>{
 const h=harness({access:owner});assert.equal((await h.api.createCapacityAddonCheckout("onboarding")).error,"license_required");assert.equal(h.calls.stripe,0);
});
test("licensed owner may open checkout",async()=>{
 const h=harness({access:owner,licensed:true});assert.match((await h.api.createCapacityAddonCheckout("onboarding")).url,/checkout/);assert.equal(h.calls.stripe,1);
});
test("non-admin member cannot open checkout",async()=>{
 const h=harness({access:{...owner,membership:{role:"USER"}},licensed:true});assert.equal((await h.api.createCapacityAddonCheckout("onboarding")).error,"forbidden");assert.equal(h.calls.stripe,0);
});
test("unpaid webhook cannot grant capacity",async()=>{
 const h=harness({eligible:true,paid:false});assert.equal((await h.api.fulfillCapacityAddon(h.session,"evt1")).reason,"not_paid");assert.equal(h.calls.grants,0);
});
test("paid checkout without active license cannot grant capacity",async()=>{
 const h=harness({eligible:false});await assert.rejects(h.api.fulfillCapacityAddon(h.session,"evt1"),/No active product license/);assert.equal(h.calls.grants,0);
});
test("paid checkout with valid license grants exactly ten",async()=>{
 const h=harness({eligible:true});const result=await h.api.fulfillCapacityAddon(h.session,"evt1");assert.equal(result.quantity,10);assert.equal(h.calls.grants,1);
});
test("repeated checkout session does not grant again",async()=>{
 const h=harness({eligible:true,existing:true});assert.equal((await h.api.fulfillCapacityAddon(h.session,"evt2")).reason,"already_granted");assert.equal(h.calls.grants,0);
});
test("wrong Stripe price cannot grant capacity",async()=>{
 const h=harness({eligible:true,price:"price_wrong"});await assert.rejects(h.api.fulfillCapacityAddon(h.session,"evt1"),/price mismatch/);assert.equal(h.calls.grants,0);
});
test("tampered organization metadata cannot grant capacity",async()=>{
 const h=harness({eligible:true});h.session.client_reference_id="another-org";await assert.rejects(h.api.fulfillCapacityAddon(h.session,"evt1"),/Invalid capacity checkout metadata/);assert.equal(h.calls.grants,0);
});
