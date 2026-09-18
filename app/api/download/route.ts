import { NextResponse } from "next/server";
import { verifyCheckout } from "@/lib/verifyCheckout";
import fs from "fs/promises";
import path from "path";
export async function POST(request:Request){
 try{
  const {sessionId}=await request.json();
  if(!sessionId)return NextResponse.json({error:"missing_session"},{status:400});
  const checkout=await verifyCheckout(sessionId);
  if(!checkout)return NextResponse.json({error:"unauthorized"},{status:401});
  const files:Record<string,string>={onboarding:"BOS Onboarding.zip",promotions:"BOS Promotions.zip"};
  const fileName=checkout.metadata?.product?files[checkout.metadata.product]:undefined;
  if(!fileName)return NextResponse.json({error:"unknown_product"},{status:400});
  const fileBuffer=await fs.readFile(path.join(process.cwd(),"storage","products",fileName));
  return new NextResponse(fileBuffer,{headers:{"Content-Type":"application/zip","Content-Disposition":'attachment; filename="'+fileName+'"'}});
 }catch(error){console.error(error);return NextResponse.json({error:"download_failed"},{status:500});}
}
