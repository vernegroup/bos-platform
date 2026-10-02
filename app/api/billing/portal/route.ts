import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { requireBOSAccess } from "@/lib/bos/access";
import { listBillingSubscriptions } from "@/lib/bos/billingRepository";
import { bosAppUrl } from "@/lib/bos/app-url";
export async function GET(){
 const access=await requireBOSAccess();
 const subscriptions=await listBillingSubscriptions(access);
 const customerId=subscriptions.find(s=>s.customerId)?.customerId;
 if(!customerId)return NextResponse.redirect(bosAppUrl()+"/app/organization");
 const session=await stripe.billingPortal.sessions.create({customer:customerId,return_url:bosAppUrl()+"/app/organization"});
 return NextResponse.redirect(session.url);
}
