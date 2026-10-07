import "server-only";
import { stripe } from "@/lib/stripe";
import { bosAppUrl } from "@/lib/bos/app-url";
import { resolveBOSAccess } from "@/lib/bos/access";
import { annualOffer } from "@/lib/bos/commerceCatalog";
import { listLicensedProducts, type BOSProductKey } from "@/lib/bos/licenseRepository";
import { resolveBillingCustomerId } from "@/lib/bos/billingRepository";

export async function createAnnualCheckout(product:BOSProductKey,options?:{requireAccess?:boolean}){
 const access=await resolveBOSAccess();
 if(options?.requireAccess&&!access)return {authRequired:true as const,alreadyLicensed:false as const,url:null};
 if(access){
  const current=(await listLicensedProducts(access)).find(item=>item.key===product);
  if(current?.licenseType==="PERPETUAL") return {alreadyLicensed:true as const,url:null};
 }
 const offer=annualOffer(product);
 const origin=bosAppUrl();
 const metadata={product,offer:offer.key,...(access?{organization_id:access.organization.id,bos_user_id:access.user.id}:{})};
 const customerId=access?await resolveBillingCustomerId(access):null;
 const session=await stripe.checkout.sessions.create({
  mode:"payment",
  line_items:[{price:offer.priceId,quantity:1}],
  ...(customerId?{customer:customerId}:{customer_email:access?.user.email??undefined}),
  client_reference_id:access?.organization.id??undefined,
  metadata,
  success_url:`${origin}/success/${product}?session_id={CHECKOUT_SESSION_ID}`,
  cancel_url:origin+"/",
 });
 if(!session.url) throw new Error("Missing checkout URL");
 return {authRequired:false as const,alreadyLicensed:false as const,url:session.url};
}
