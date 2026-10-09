const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const ts=require("typescript");
function harness({status="PENDING",fail=false}={}){
 const calls={send:0,claim:0,sent:0,reset:0};
 const row={recipient_email:"buyer@example.invalid",product_name:"BOS Wdrożenia",total_capacity:20};
 const sql={unsafe:async(query)=>{
  if(query.includes("UPDATE standard_capacity_email_outbox")&&query.includes("RETURNING recipient_email")){
   calls.claim++;if(status==="SENT"||status==="SENDING")return [];status="SENDING";return [row];
  }
  if(query.includes("status='SENT'")){calls.sent++;status="SENT";return [];}
  if(query.includes("status='PENDING'")){calls.reset++;status="PENDING";return [];}
  throw Error("Unexpected SQL "+query);
 }};
 const filename=path.resolve(__dirname,"../lib/bos/capacityAddonEmail.ts");
 const js=ts.transpileModule(fs.readFileSync(filename,"utf8"),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;
 const exports={};const modules={"server-only":{},"@/lib/db":{db:()=>sql},"@/lib/bos/email":{sendCapacityAddonConfirmationEmail:async(input)=>{calls.send++;assert.equal(input.checkoutSessionId,"cs_test_email");if(fail)throw Error("Resend unavailable");return {messageId:"email_test"};}}};
 vm.runInNewContext(js,{exports,require:(name)=>{if(!(name in modules))throw Error("Unexpected dependency "+name);return modules[name];},console},{filename});
 return {deliver:()=>exports.deliverCapacityAddonConfirmation("cs_test_email"),calls,setFailure:v=>{fail=v;}};
}
test("paid addon sends one email and records SENT",async()=>{
 const h=harness();assert.equal((await h.deliver()).delivered,true);assert.equal(h.calls.send,1);assert.equal(h.calls.sent,1);
 assert.equal((await h.deliver()).reason,"already_sent_or_in_progress");assert.equal(h.calls.send,1);
});
test("concurrent delivery lease does not resend",async()=>{
 const h=harness({status:"SENDING"});assert.equal((await h.deliver()).reason,"already_sent_or_in_progress");assert.equal(h.calls.send,0);
});
test("Resend failure resets outbox and retry succeeds",async()=>{
 const h=harness({fail:true});await assert.rejects(h.deliver(),/Resend unavailable/);assert.equal(h.calls.reset,1);
 h.setFailure(false);assert.equal((await h.deliver()).delivered,true);assert.equal(h.calls.send,2);assert.equal(h.calls.sent,1);
});
