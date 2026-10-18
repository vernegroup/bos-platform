import { NextResponse } from "next/server";
import { createCapacityAddonCheckout } from "@/lib/bos/capacityAddon";
export const runtime="nodejs";
export async function POST(request:Request){
  let body:unknown;
  try{body=await request.json();}catch{return NextResponse.json({error:"invalid_json"},{status:400});}
  const product=(body as {product?:unknown})?.product;
  if(product!=="onboarding"&&product!=="promotions")return NextResponse.json({error:"invalid_product"},{status:400});
  try{
    const result=await createCapacityAddonCheckout(product);
    if("error" in result)return NextResponse.json({error:result.error},{status:result.error==="auth_required"?401:result.error==="forbidden"?403:409});
    return NextResponse.json({url:result.url});
  }catch(error){console.error("[capacity-addon.checkout]",error);return NextResponse.json({error:"checkout_failed"},{status:500});}
}
