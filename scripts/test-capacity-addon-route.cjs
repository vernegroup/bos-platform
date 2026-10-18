// Route integration tests: execute the actual POST handler with simulated BOS session outcomes.
// No real Stripe sessions, auth tokens, or Neon writes.
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const ts=require("typescript");
function routeWith(result){
 const filename=path.resolve(__dirname,"../app/api/commerce/capacity/checkout/route.ts");
 const source=fs.readFileSync(filename,"utf8");
 const js=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;
 const exports={};let calls=0;
 const modules={
  "next/server":{NextResponse:{json:(body,opts={})=>({status:opts.status||200,body})}},
  "@/lib/bos/capacityAddon":{createCapacityAddonCheckout:async(product)=>{calls++;assert.equal(product,"onboarding");return result;}}
 };
 vm.runInNewContext(js,{exports,require:(name)=>{if(!(name in modules))throw new Error("Unexpected import: "+name);return modules[name];},console},{filename});
 return {post:exports.POST,calls:()=>calls};
}
const req=(value)=>({json:async()=>value});
for(const [name,result,status,error] of [
 ["unauthenticated",{error:"auth_required"},401,"auth_required"],
 ["member without permissions",{error:"forbidden"},403,"forbidden"],
 ["authenticated owner without license",{error:"license_required"},409,"license_required"]
]){
 test("POST /api/commerce/capacity/checkout "+name,async()=>{
  const h=routeWith(result);const response=await h.post(req({product:"onboarding"}));
  assert.equal(response.status,status);assert.equal(response.body.error,error);assert.equal(h.calls(),1);
 });
}
test("POST /api/commerce/capacity/checkout licensed owner",async()=>{
 const h=routeWith({url:"https://checkout.stripe.test/test"});const response=await h.post(req({product:"onboarding"}));
 assert.equal(response.status,200);assert.equal(response.body.url,"https://checkout.stripe.test/test");
});
test("invalid product rejected before calling commerce",async()=>{
 const h=routeWith({url:"unused"});const response=await h.post(req({product:"pricing"}));
 assert.equal(response.status,400);assert.equal(response.body.error,"invalid_product");assert.equal(h.calls(),0);
});
test("invalid JSON rejected before calling commerce",async()=>{
 const h=routeWith({url:"unused"});const response=await h.post({json:async()=>{throw new SyntaxError("bad json");}});
 assert.equal(response.status,400);assert.equal(response.body.error,"invalid_json");assert.equal(h.calls(),0);
});
