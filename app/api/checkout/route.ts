import { NextResponse } from "next/server";
import { createAnnualCheckout } from "@/lib/bos/annualCheckout";
export async function POST(){try{const result=await createAnnualCheckout("onboarding");if(result.alreadyLicensed)return NextResponse.json({error:"already_licensed"},{status:409});return NextResponse.json({url:result.url});}catch(error){console.error("[commerce2.checkout]",error);return NextResponse.json({error:"checkout_failed"},{status:500})}}
