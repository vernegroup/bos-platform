// COMMERCE-02: in-process sandbox connecting real fulfillment + outbox modules.
// In-memory SQL and Resend mocks; no credentials, external calls, or live payments.
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const vm=require("node:vm");
const path=require("node:path");
const ts=require("typescript");
function sandbox(){
 const state={grant:null,outbox:null,events:new Set(),sends:0,failEmail:false,commits:0};
 const metadata={bos_kind:"standard_capacity_addon",organization_id:"org-sandbox",product_id:"prod-sandbox",product:"onboarding",bos_user_id:"user-sandbox",standards_added:"10"};
 const session={id:"cs_test_sandbox_c02",mode:"payment",payment_status:"paid",client_reference_id:"org-sandbox",metadata};
 const txQuery=async(q,args=[])=>{
  if(q.includes("pg_advisory_xact_lock"))return [{}];
  if(q.includes("SELECT id FROM standard_capacity_grants"))return state.grant?[{id:"grant-1"}]:[];
  if(q.includes("SELECT 1 FROM licenses"))return [{ok:1}];
  if(q.includes("INSERT INTO standard_capacity_grants")){if(!state.grant)state.grant={session:args[2],quantity:10};return [];}
  if(q.includes("SELECT email FROM users"))return [{email:"sandbox@example.invalid"}];
  if(q.includes("SELECT COALESCE(SUM(quantity)"))return [{total:10+(state.grant?.quantity||0)}];
  if(q.includes("INSERT INTO standard_capacity_email_outbox")){if(!state.outbox)state.outbox={session:args[0],recipient_email:args[3],product_name:args[4],total_capacity:args[5],status:"PENDING",attempts:0};return [];}
  if(q.includes("INSERT INTO stripe_events")){state.events.add(args[0]);return [];}
  throw Error("Unexpected transaction query: "+q);
 };
 const sql={
  begin:async(fn)=>{const snapshot={grant:state.grant?{...state.grant}:null,outbox:state.outbox?{...state.outbox}:null,events:new Set(state.events)};try{const result=await fn({unsafe:txQuery});state.commits++;return result;}catch(e){state.grant=snapshot.grant;state.outbox=snapshot.outbox;state.events=snapshot.events;throw e;}},
  unsafe:async(q,args=[])=>{
   if(!q.includes("UPDATE standard_capacity_email_outbox"))throw Error("Unexpected outside transaction query: "+q);
   const o=state.outbox;
   if(!o||o.session!==args[0])return [];
   if(q.includes("RETURNING recipient_email")){if(o.status!=="PENDING")return [];o.status="SENDING";o.attempts++;return [{recipient_email:o.recipient_email,product_name:o.product_name,total_capacity:o.total_capacity}];}
   if(q.includes("SET status='SENT'")){if(o.status==="SENDING"){o.status="SENT";o.resend_email_id=args[1];}return [];}
   if(q.includes("SET status='PENDING'")){if(o.status==="SENDING")o.status="PENDING";return [];}
   throw Error("Unknown outbox SQL");
  }
 };
 const email=load("lib/bos/capacityAddonEmail.ts",{"server-only":{},"@/lib/db":{db:()=>sql},"@/lib/bos/email":{sendCapacityAddonConfirmationEmail:async(input)=>{state.sends++;assert.equal(input.checkoutSessionId,session.id);assert.equal(input.totalCapacity,20);if(state.failEmail)throw Error("sandbox resend failure");return {messageId:"email_sandbox_1"};}}});
 const addon=load("lib/bos/capacityAddon.ts",{"server-only":{},"@/lib/db":{db:()=>sql},"@/lib/stripe":{stripe:{checkout:{sessions:{listLineItems:async()=>({data:[{price:{id:"price_1UOb8W1ETGwirCfz2kz71m3W"},quantity:1}]})}}}},"@/lib/bos/app-url":{bosAppUrl:()=>"https://sandbox.invalid"},"@/lib/bos/access":{resolveBOSAccess:async()=>null},"@/lib/bos/billingRepository":{resolveBillingCustomerId:async()=>null},"@/lib/bos/capacityAddonEmail":email});
 return {state,session,fulfill:addon.fulfillCapacityAddon};
}
function load(file,modules){
 const filename=path.resolve(__dirname,"..",file);
 const js=ts.transpileModule(fs.readFileSync(filename,"utf8"),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;
 const exports={};
 vm.runInNewContext(js,{exports,require:(id)=>{if(!(id in modules))throw Error("Unexpected dependency: "+id);return modules[id];},console,process},{filename});
 return exports;
}
test("paid checkout commits +10 and outbox, sends once; duplicate event is idempotent",async()=>{
 const h=sandbox();const first=await h.fulfill(h.session,"evt_sandbox_1");
 assert.equal(first.fulfilled,true);assert.equal(first.quantity,10);assert.equal(h.state.grant.quantity,10);
 assert.equal(h.state.outbox.total_capacity,20);assert.equal(h.state.outbox.status,"SENT");
 assert.equal(h.state.outbox.attempts,1);assert.equal(h.state.sends,1);
 const duplicate=await h.fulfill(h.session,"evt_sandbox_2");
 assert.equal(duplicate.reason,"already_granted");assert.equal(h.state.sends,1);
 assert.equal(h.state.grant.quantity,10);assert.equal(h.state.events.size,2);
});
test("Resend failure preserves committed grant and retries only email",async()=>{
 const h=sandbox();h.state.failEmail=true;
 await assert.rejects(h.fulfill(h.session,"evt_sandbox_fail"),/sandbox resend failure/);
 assert.equal(h.state.grant.quantity,10);assert.equal(h.state.outbox.status,"PENDING");
 assert.equal(h.state.sends,1);assert.equal(h.state.commits,1);
 h.state.failEmail=false;
 const retry=await h.fulfill(h.session,"evt_sandbox_retry");
 assert.equal(retry.reason,"already_granted");assert.equal(h.state.outbox.status,"SENT");
 assert.equal(h.state.outbox.attempts,2);assert.equal(h.state.sends,2);
});
test("unpaid session does not grant or enqueue",async()=>{
 const h=sandbox();h.session.payment_status="unpaid";
 const result=await h.fulfill(h.session,"evt_sandbox_unpaid");
 assert.equal(result.reason,"not_paid");assert.equal(h.state.grant,null);assert.equal(h.state.outbox,null);assert.equal(h.state.sends,0);
});
