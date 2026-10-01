import "server-only";
import { stripe } from "@/lib/stripe";
import { db } from "@/lib/db";

export async function verifyCheckout(sessionId:string,expectedProduct?:"onboarding"|"promotions"){
 if(!sessionId)return null;
 try{
  const session=await stripe.checkout.sessions.retrieve(sessionId,{expand:["customer","payment_intent"]});
  if(session.payment_status!=="paid")return null;
  if(expectedProduct&&session.metadata?.product!==expectedProduct)return null;
  const sql=db();
  const purchases=await sql.unsafe(
   "SELECT p.status,l.status AS license_status FROM purchases p LEFT JOIN licenses l ON l.organization_id=p.organization_id AND l.product_id=p.product_id AND l.status='ACTIVE' WHERE p.stripe_checkout_session_id=$1 LIMIT 1",
   [session.id],
  );
  return{session,customer:session.customer,paymentIntent:session.payment_intent,customerEmail:session.customer_details?.email??session.customer_email??null,amountTotal:session.amount_total,currency:session.currency,metadata:session.metadata,purchaseStatus:purchases[0]?.status??null,licenseStatus:purchases[0]?.license_status??null};
 }catch(error){console.error("[checkout.verify] failed",error);return null;}
}
