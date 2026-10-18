import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { fulfillCapacityAddon } from "@/lib/bos/capacityAddon";
import { failCheckoutSession, fulfillCheckoutSession, refundCharge } from "@/lib/bos/purchaseRepository";
import { fulfillAnnualCheckout, recordAnnualInvoice, syncAnnualSubscription } from "@/lib/bos/subscriptionRepository";
export const runtime="nodejs";
export async function POST(request:Request){
 const secret=process.env.STRIPE_WEBHOOK_SECRET;if(!secret)return NextResponse.json({error:"STRIPE_WEBHOOK_SECRET is not set"},{status:500});
 const signature=request.headers.get("stripe-signature");if(!signature)return NextResponse.json({error:"missing_signature"},{status:400});
 let event;try{event=stripe.webhooks.constructEvent(await request.text(),signature,secret)}catch(error){console.error("[stripe.webhook] signature verification failed",error);return NextResponse.json({error:"invalid_signature"},{status:400})}
 try{
  let result:unknown={handled:false,reason:"ignored_event"};
  if(event.type==="checkout.session.completed"||event.type==="checkout.session.async_payment_succeeded"){
   const session=event.data.object;
   result=session.metadata?.bos_kind==="standard_capacity_addon"?await fulfillCapacityAddon(session,event.id):session.mode==="subscription"?await fulfillAnnualCheckout(session,event.id):await fulfillCheckoutSession(session,event.id);
  }else if(event.type==="checkout.session.async_payment_failed")result=await failCheckoutSession(event.data.object,event.id);
  else if(event.type==="invoice.paid")result=await recordAnnualInvoice(event.data.object,event.id,true);
  else if(event.type==="invoice.payment_failed")result=await recordAnnualInvoice(event.data.object,event.id,false);
  else if(event.type==="customer.subscription.updated")result=await syncAnnualSubscription(event.data.object,event.id,false);
  else if(event.type==="customer.subscription.deleted")result=await syncAnnualSubscription(event.data.object,event.id,true);
  else if(event.type==="charge.refunded")result=await refundCharge(event.data.object,event.id);
  console.info("[stripe.webhook] processed",{eventId:event.id,eventType:event.type,result});return NextResponse.json({received:true});
 }catch(error){console.error("[stripe.webhook] fulfillment failed",{eventId:event.id,eventType:event.type,error});return NextResponse.json({error:"fulfillment_failed"},{status:500})}
}
