import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { resolveBOSAccess } from "@/lib/bos/access";
export async function POST(request: Request) {
 try {
  const priceId=process.env.STRIPE_PRICE_ID_PROMOTIONS;
  if(!priceId)return NextResponse.json({error:"STRIPE_PRICE_ID_PROMOTIONS is not set"},{status:500});
  const origin=request.headers.get("origin")??new URL(request.url).origin;
  const access=await resolveBOSAccess();
  const session=await stripe.checkout.sessions.create({
   mode:"payment",line_items:[{price:priceId,quantity:1}],
   customer_email:access?.user.email??undefined,
   client_reference_id:access?.organization.id??undefined,
   metadata:{product:"promotions",...(access?{organization_id:access.organization.id,bos_user_id:access.user.id}:{})},
   success_url:origin+"/success/promotions?session_id={CHECKOUT_SESSION_ID}",cancel_url:origin+"/",
  });
  if(!session.url)return NextResponse.json({error:"Missing checkout URL"},{status:500});
  return NextResponse.json({url:session.url});
 }catch(error){console.error(error);return NextResponse.json({error:"checkout_failed"},{status:500});}
}
