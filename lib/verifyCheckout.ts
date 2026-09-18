import "server-only";
import { stripe } from "@/lib/stripe";
export async function verifyCheckout(sessionId:string,expectedProduct?:"onboarding"|"promotions"){
 if(!sessionId)return null;
 try{
  const session=await stripe.checkout.sessions.retrieve(sessionId,{expand:["customer","payment_intent"]});
  if(session.payment_status!=="paid")return null;
  if(expectedProduct&&session.metadata?.product!==expectedProduct)return null;
  return{session,customer:session.customer,paymentIntent:session.payment_intent,customerEmail:session.customer_details?.email??session.customer_email??null,amountTotal:session.amount_total,currency:session.currency,metadata:session.metadata};
 }catch(error){console.error(error);return null;}
}
