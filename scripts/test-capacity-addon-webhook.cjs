// Stripe webhook route integration: real route module, simulated verified events and fulfillment.
// No Stripe network, no Neon writes, no real money.
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const vm=require("node:vm");
const ts=require("typescript");
const path=require("node:path");
function setup({eventType="checkout.session.completed",kind="standard_capacity_addon",mode="payment",paid=true,signature="valid",secret="whsec_test",fulfillError=false}={}){
 const calls={verify:0,addon:0,license:0,annual:0};
 const session={id:"cs_test_webhook",mode,payment_status:paid?"paid":"unpaid",metadata:{bos_kind:kind}};
 const event={id:"evt_test_webhook",type:eventType,data:{object:session}};
 const modules={
  "next/server":{NextResponse:{json:(body,opts={})=>({status:opts.status||200,body})}},
  "@/lib/stripe":{stripe:{webhooks:{constructEvent:(_body,_sig,_secret)=>{calls.verify++;if(signature!=="valid")throw new Error("bad signature");return event;}}}},
  "@/lib/bos/capacityAddon":{fulfillCapacityAddon:async(s,id)=>{calls.addon++;assert.equal(s,session);assert.equal(id,event.id);if(fulfillError)throw new Error("fulfillment failure");return {fulfilled:true,quantity:10};}},
  "@/lib/bos/purchaseRepository":{failCheckoutSession:async()=>({}),fulfillCheckoutSession:async()=>{calls.license++;return {};},refundCharge:async()=>({})},
  "@/lib/bos/subscriptionRepository":{fulfillAnnualCheckout:async()=>{calls.annual++;return {};},recordAnnualInvoice:async()=>({}),syncAnnualSubscription:async()=>({})}
 };
 const filename=path.resolve(__dirname,"../app/api/stripe/webhook/route.ts");
 const source=fs.readFileSync(filename,"utf8");
 const js=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;
 const exports={};
 vm.runInNewContext(js,{exports,require:(id)=>{if(!(id in modules))throw new Error("Unexpected module "+id);return modules[id];},process:{env:secret?{STRIPE_WEBHOOK_SECRET:secret}:{}},console:{error:()=>{},info:()=>{}}},{filename});
 const request={headers:{get:(key)=>key==="stripe-signature"?signature:null},text:async()=>JSON.stringify(event)};
 return {post:exports.POST,request,calls};
}
test("verified paid addon event routes to addon fulfillment only",async()=>{
 const h=setup();const r=await h.post(h.request);assert.equal(r.status,200);assert.equal(r.body.received,true);assert.equal(h.calls.addon,1);assert.equal(h.calls.license,0);assert.equal(h.calls.annual,0);
});
test("async payment succeeded routes to addon fulfillment",async()=>{
 const h=setup({eventType:"checkout.session.async_payment_succeeded"});const r=await h.post(h.request);assert.equal(r.status,200);assert.equal(h.calls.addon,1);
});
test("missing Stripe signature rejects without fulfillment",async()=>{
 const h=setup();h.request.headers.get=()=>null;const r=await h.post(h.request);assert.equal(r.status,400);assert.equal(r.body.error,"missing_signature");assert.equal(h.calls.addon,0);
});
test("invalid Stripe signature rejects without fulfillment",async()=>{
 const h=setup({signature:"invalid"});const r=await h.post(h.request);assert.equal(r.status,400);assert.equal(r.body.error,"invalid_signature");assert.equal(h.calls.addon,0);
});
test("missing webhook secret rejects without fulfillment",async()=>{
 const h=setup({secret:""});const r=await h.post(h.request);assert.equal(r.status,500);assert.equal(h.calls.addon,0);
});
test("addon fulfillment error returns 500 for Stripe retry",async()=>{
 const h=setup({fulfillError:true});const r=await h.post(h.request);assert.equal(r.status,500);assert.equal(r.body.error,"fulfillment_failed");assert.equal(h.calls.addon,1);
});
test("ordinary license checkout does not enter addon fulfillment",async()=>{
 const h=setup({kind:"license_purchase"});const r=await h.post(h.request);assert.equal(r.status,200);assert.equal(h.calls.addon,0);assert.equal(h.calls.license,1);
});
test("subscription checkout does not enter addon fulfillment",async()=>{
 const h=setup({kind:"annual",mode:"subscription"});const r=await h.post(h.request);assert.equal(r.status,200);assert.equal(h.calls.addon,0);assert.equal(h.calls.annual,1);
});
test("irrelevant event is acknowledged without fulfillment",async()=>{
 const h=setup({eventType:"customer.created"});const r=await h.post(h.request);assert.equal(r.status,200);assert.equal(h.calls.addon,0);
});
