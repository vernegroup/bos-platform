// Verify real Stripe SDK webhook signature handling against the actual BOS route.
// Uses Stripe's test signature generator; no network, no charges, no production secrets.
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const ts=require("typescript");
const Stripe=require("stripe");
const secret="whsec_c02_local_test_only";
const stripe=new Stripe("sk_test_local_dummy",{apiVersion:"2025-02-24.acacia"});
function loadRoute(){
 const filename=path.resolve(__dirname,"../app/api/stripe/webhook/route.ts");
 const js=ts.transpileModule(fs.readFileSync(filename,"utf8"),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;
 const exports={};const calls={addon:0,license:0};
 const modules={
  "next/server":{NextResponse:{json:(body,opts={})=>({status:opts.status||200,body})}},
  "@/lib/stripe":{stripe},
  "@/lib/bos/capacityAddon":{fulfillCapacityAddon:async()=>{calls.addon++;return {fulfilled:true,quantity:10};}},
  "@/lib/bos/purchaseRepository":{failCheckoutSession:async()=>({}),fulfillCheckoutSession:async()=>{calls.license++;return {};},refundCharge:async()=>({})},
  "@/lib/bos/subscriptionRepository":{fulfillAnnualCheckout:async()=>({}),recordAnnualInvoice:async()=>({}),syncAnnualSubscription:async()=>({})}
 };
 vm.runInNewContext(js,{exports,require:(name)=>{if(!(name in modules))throw Error("Unexpected dependency "+name);return modules[name];},process:{env:{STRIPE_WEBHOOK_SECRET:secret}},console:{error:()=>{}}},{filename});
 return {POST:exports.POST,calls};
}
function eventRequest({tamper=false,invalidSignature=false,kind="standard_capacity_addon",type="checkout.session.completed"}={}){
 const payload=JSON.stringify({id:"evt_c02_local",object:"event",type,data:{object:{id:"cs_test_local",object:"checkout.session",mode:"payment",payment_status:"paid",metadata:{bos_kind:kind}}}});
 const signature=stripe.webhooks.generateTestHeaderString({payload,secret});
 return {headers:{get:(name)=>name==="stripe-signature"?(invalidSignature?"t=1,v1=bad":signature):null},text:async()=>tamper?payload.replace("cs_test_local","cs_tampered"):payload};
}
test("real Stripe SDK accepts signed paid addon event",async()=>{
 const h=loadRoute();const response=await h.POST(eventRequest());assert.equal(response.status,200);assert.equal(h.calls.addon,1);assert.equal(h.calls.license,0);
});
test("real Stripe SDK rejects modified payload",async()=>{
 const h=loadRoute();const response=await h.POST(eventRequest({tamper:true}));assert.equal(response.status,400);assert.equal(h.calls.addon,0);
});
test("real Stripe SDK rejects forged signature",async()=>{
 const h=loadRoute();const response=await h.POST(eventRequest({invalidSignature:true}));assert.equal(response.status,400);assert.equal(h.calls.addon,0);
});
test("real Stripe SDK routes ordinary checkout away from addon",async()=>{
 const h=loadRoute();const response=await h.POST(eventRequest({kind:"license_purchase"}));assert.equal(response.status,200);assert.equal(h.calls.addon,0);assert.equal(h.calls.license,1);
});
