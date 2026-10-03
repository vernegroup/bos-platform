import "server-only";
import type Stripe from "stripe";
import { db } from "@/lib/db";
import { stripe } from "@/lib/stripe";
import { issueAuthToken } from "@/lib/bos/authRepository";
import { sendPurchaseClaimEmail } from "@/lib/bos/email";
import type { BOSProductKey } from "@/lib/bos/licenseRepository";

function objectId(v:any){if(!v)return null;return typeof v==="string"?v:v.id}
function unix(v:any){return typeof v==="number"?new Date(v*1000):null}
function period(s:any){
  const items = Array.isArray(s?.items?.data) ? s.items.data : [];
  const starts = [s?.current_period_start, ...items.map((item:any) => item?.current_period_start)]
    .filter((v:any) => typeof v === "number");
  const ends = [s?.current_period_end, ...items.map((item:any) => item?.current_period_end)]
    .filter((v:any) => typeof v === "number");
  return {
    start: unix(starts.length ? Math.min(...starts) : null),
    end: unix(ends.length ? Math.max(...ends) : null),
  };
}
function slugPart(v:string){return v.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,36)||"firma"}

async function compensateRejectedAnnualCheckout(session:Stripe.Checkout.Session,subscription:Stripe.Subscription,reason:string){
 const invoiceId=objectId(subscription.latest_invoice);
 if(!invoiceId)throw new Error("Rejected annual purchase has no initial invoice");
 const invoice:any=await stripe.invoices.retrieve(invoiceId,{expand:["payments"]});
 const payment=invoice?.payments?.data?.find((item:any)=>item?.status==="paid"&&item?.payment?.type==="payment_intent");
 const paymentIntentId=objectId(payment?.payment?.payment_intent);
 if(!paymentIntentId)throw new Error("Rejected annual purchase has no refundable payment");
 await stripe.subscriptions.cancel(subscription.id,{invoice_now:false,prorate:false},{idempotencyKey:`bos-rejected-cancel:${session.id}`});
 await stripe.refunds.create({payment_intent:paymentIntentId,metadata:{reason,checkout_session_id:session.id}},{idempotencyKey:`bos-rejected-refund:${session.id}`});
}

export async function fulfillAnnualCheckout(session:Stripe.Checkout.Session,eventId:string){
 const productKey=session.metadata?.product as BOSProductKey|undefined;
 const offerKey=session.metadata?.offer;
 if(!productKey||!["onboarding","promotions"].includes(productKey)||!offerKey) throw new Error("Invalid annual checkout metadata");
 if(session.mode!=="subscription"||session.payment_status!=="paid") return {fulfilled:false,reason:"not_paid_subscription" as const};
 const subscriptionId=objectId(session.subscription);
 if(!subscriptionId) throw new Error("Paid annual checkout has no subscription");
 const subscription=await stripe.subscriptions.retrieve(subscriptionId);
 const p=period(subscription);
 if(!p.end) throw new Error("Stripe subscription has no current period end");
 const sql=db();
 const result=await sql.begin(async tx=>{
  const seen=await tx.unsafe("SELECT 1 FROM stripe_events WHERE id=$1 LIMIT 1",[eventId]);
  if(seen.length)return {fulfilled:false,reason:"duplicate_event" as const};
  const existing=await tx.unsafe("SELECT id,organization_id FROM purchases WHERE stripe_checkout_session_id=$1 LIMIT 1",[session.id]);
  if(existing.length){await tx.unsafe("INSERT INTO stripe_events(id,type) VALUES($1,$2) ON CONFLICT(id) DO NOTHING",[eventId,"checkout.session.subscription.paid"]);return {fulfilled:false,reason:"purchase_exists" as const,purchaseId:existing[0].id,organizationId:existing[0].organization_id}}
  const products=await tx.unsafe("SELECT id FROM products WHERE key=$1 AND status='ACTIVE' LIMIT 1",[productKey]);
  const offers=await tx.unsafe("SELECT id FROM commerce_offers WHERE key=$1 AND product_id=$2 AND status='ACTIVE' LIMIT 1",[offerKey,products[0]?.id]);
  if(!products.length||!offers.length)throw new Error("Annual BOS offer not found");
  const buyerEmail=session.customer_details?.email?.trim().toLowerCase()||session.customer_email?.trim().toLowerCase()||null;
  if(!buyerEmail)throw new Error("Paid annual purchase has no buyer email");
  const checkoutOrg=session.metadata?.organization_id||null, checkoutUser=session.metadata?.bos_user_id||null;
  let organizationId=checkoutOrg;
  if(checkoutOrg||checkoutUser){
   if(!checkoutOrg||!checkoutUser)throw new Error("Incomplete authenticated checkout metadata");
   const ok=await tx.unsafe("SELECT 1 FROM users u JOIN memberships m ON m.user_id=u.id JOIN organizations o ON o.id=m.organization_id WHERE u.id=$1 AND lower(u.email)=$2 AND m.organization_id=$3 AND m.status='ACTIVE' AND o.status='ACTIVE' LIMIT 1",[checkoutUser,buyerEmail,checkoutOrg]);
   if(!ok.length)throw new Error("Authenticated checkout metadata mismatch");
  }
  if(!organizationId){
   const existingOrg=await tx.unsafe("SELECT o.id FROM users u JOIN memberships m ON m.user_id=u.id AND m.status='ACTIVE' JOIN organizations o ON o.id=m.organization_id AND o.status='ACTIVE' WHERE lower(u.email)=$1 ORDER BY m.created_at LIMIT 1",[buyerEmail]);
   if(existingOrg.length)organizationId=existingOrg[0].id;
  }
  if(organizationId&&!checkoutOrg){
   const canonical=await tx.unsafe("SELECT stripe_customer_id FROM (SELECT stripe_customer_id,created_at FROM subscriptions WHERE organization_id=$1 AND stripe_customer_id IS NOT NULL UNION ALL SELECT stripe_customer_id,created_at FROM purchases WHERE organization_id=$1 AND stripe_customer_id IS NOT NULL) c ORDER BY created_at ASC LIMIT 1",[organizationId]);
   const checkoutCustomer=objectId(session.customer);
   if(canonical.length&&checkoutCustomer&&String(canonical[0].stripe_customer_id)!==checkoutCustomer)return {fulfilled:false,reason:"customer_mismatch" as const,organizationId,buyerEmail};
  }
  const perpetual=await tx.unsafe("SELECT 1 FROM licenses WHERE organization_id=$1 AND product_id=$2 AND status='ACTIVE' AND license_type='PERPETUAL' LIMIT 1",[organizationId,products[0].id]);
  if(perpetual.length)return {fulfilled:false,reason:"perpetual_duplicate" as const,organizationId,buyerEmail};
  let claimUserId:string|null=null,purchaseNeedsClaim=false;
  if(!organizationId){
   const label=buyerEmail.split("@")[0]||"Klient";
   const org=await tx.unsafe("INSERT INTO organizations(name,slug,status) VALUES($1,$2,'ACTIVE') RETURNING id",[`Organizacja ${label}`,`${slugPart(label)}-${session.id.slice(-10).toLowerCase()}`]);
   organizationId=org[0].id;
   const users=await tx.unsafe("INSERT INTO users(display_name,email,status) VALUES($1,$2,'INVITED') ON CONFLICT(email) DO UPDATE SET updated_at=now() RETURNING id",[label,buyerEmail]);
   claimUserId=users[0].id;purchaseNeedsClaim=true;
   await tx.unsafe("INSERT INTO memberships(organization_id,user_id,role,status,invited_at) VALUES($1,$2,'OWNER','INVITED',now()) ON CONFLICT(organization_id,user_id) DO UPDATE SET role='OWNER',status='INVITED',updated_at=now()",[organizationId,claimUserId]);
  }
  const purchase=await tx.unsafe("INSERT INTO purchases(organization_id,product_id,offer_id,buyer_email,stripe_checkout_session_id,stripe_payment_intent_id,stripe_customer_id,stripe_subscription_id,amount_total,currency,status,paid_at) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'PAID',now()) RETURNING id",[organizationId,products[0].id,offers[0].id,buyerEmail,session.id,objectId(session.payment_intent),objectId(session.customer),subscriptionId,session.amount_total,session.currency]);
  const sub=await tx.unsafe("INSERT INTO subscriptions(organization_id,product_id,offer_id,stripe_subscription_id,stripe_customer_id,status,current_period_start,current_period_end,cancel_at_period_end,latest_invoice_id) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) ON CONFLICT(organization_id,product_id) DO UPDATE SET offer_id=EXCLUDED.offer_id,stripe_subscription_id=EXCLUDED.stripe_subscription_id,stripe_customer_id=EXCLUDED.stripe_customer_id,status=EXCLUDED.status,current_period_start=EXCLUDED.current_period_start,current_period_end=EXCLUDED.current_period_end,cancel_at_period_end=EXCLUDED.cancel_at_period_end,latest_invoice_id=EXCLUDED.latest_invoice_id,updated_at=now() RETURNING id",[organizationId,products[0].id,offers[0].id,subscriptionId,objectId(subscription.customer),subscription.cancel_at_period_end?"CANCEL_AT_PERIOD_END":"ACTIVE",p.start,p.end,subscription.cancel_at_period_end,objectId(subscription.latest_invoice)]);
  const old=await tx.unsafe("SELECT license_type FROM licenses WHERE organization_id=$1 AND product_id=$2 LIMIT 1",[organizationId,products[0].id]);
  if(!old.length){
   await tx.unsafe("INSERT INTO licenses(organization_id,product_id,status,license_type,source_purchase_id,source_subscription_id,valid_from,valid_until) VALUES($1,$2,'ACTIVE','ANNUAL',$3,$4,$5,$6)",[organizationId,products[0].id,purchase[0].id,sub[0].id,p.start??new Date(),p.end]);
  }else if(old[0].license_type!=="PERPETUAL"){
   await tx.unsafe("UPDATE licenses SET status='ACTIVE',license_type='ANNUAL',source_purchase_id=$1,source_subscription_id=$2,valid_from=$3,valid_until=$4,revoked_at=NULL,updated_at=now() WHERE organization_id=$5 AND product_id=$6",[purchase[0].id,sub[0].id,p.start??new Date(),p.end,organizationId,products[0].id]);
  }
  await tx.unsafe("INSERT INTO stripe_events(id,type) VALUES($1,$2)",[eventId,"checkout.session.subscription.paid"]);
  return {fulfilled:true,purchaseId:purchase[0].id,organizationId,purchaseNeedsClaim,claimUserId,buyerEmail};
 });
 if(!result.fulfilled&&result.reason==="perpetual_duplicate"){
  await compensateRejectedAnnualCheckout(session,subscription,"bos_existing_perpetual_license");
  await sql.unsafe("INSERT INTO stripe_events(id,type) VALUES($1,$2) ON CONFLICT(id) DO NOTHING",[eventId,"checkout.session.subscription.perpetual_duplicate_refunded"]);
 }
 if(!result.fulfilled&&result.reason==="customer_mismatch"){
  await compensateRejectedAnnualCheckout(session,subscription,"bos_existing_customer_requires_login");
  await sql.unsafe("INSERT INTO stripe_events(id,type) VALUES($1,$2) ON CONFLICT(id) DO NOTHING",[eventId,"checkout.session.subscription.customer_mismatch_refunded"]);
 }
 if(result.reason!=="perpetual_duplicate"&&result.reason!=="customer_mismatch"){
  const bound=await sql.unsafe("SELECT 1 FROM subscriptions WHERE stripe_subscription_id=$1 LIMIT 1",[subscriptionId]);
  const invoiceId=objectId(subscription.latest_invoice);
  if(bound.length&&invoiceId){
   const invoice=await stripe.invoices.retrieve(invoiceId);
   await recordAnnualInvoice(invoice,`checkout.recovery.invoice:${session.id}:${invoiceId}`,true);
  }
 }
 if(result.fulfilled&&result.purchaseNeedsClaim&&result.claimUserId&&result.buyerEmail){
  const token=await issueAuthToken(result.claimUserId,"CLAIM_PURCHASE",60*24);
  await sendPurchaseClaimEmail({to:result.buyerEmail,displayName:result.buyerEmail.split("@")[0]||"Kliencie",token});
 }
 return result;
}

function invoiceSubscriptionId(invoice:any){return objectId(invoice.subscription)||objectId(invoice.parent?.subscription_details?.subscription)}

export async function recordAnnualInvoice(invoice:Stripe.Invoice,eventId:string,paid:boolean){
 const stripeSubscriptionId=invoiceSubscriptionId(invoice); if(!stripeSubscriptionId)return {handled:false,reason:"no_subscription" as const};
 const subscription=await stripe.subscriptions.retrieve(stripeSubscriptionId); const p=period(subscription); const sql=db();
 return sql.begin(async tx=>{
  const seen=await tx.unsafe("SELECT 1 FROM stripe_events WHERE id=$1 LIMIT 1",[eventId]);if(seen.length)return {handled:false,reason:"duplicate_event" as const};
  const rows=await tx.unsafe("SELECT id,organization_id,product_id FROM subscriptions WHERE stripe_subscription_id=$1 LIMIT 1",[stripeSubscriptionId]);
  if(!rows.length){await tx.unsafe("INSERT INTO stripe_events(id,type) VALUES($1,$2)",[eventId,paid?"invoice.paid.unbound":"invoice.payment_failed.unbound"]);return {handled:false,reason:"subscription_not_bound" as const}}
  const s=rows[0],status=paid?(subscription.cancel_at_period_end?"CANCEL_AT_PERIOD_END":"ACTIVE"):"PAST_DUE";
  await tx.unsafe("UPDATE subscriptions SET status=$1,current_period_start=$2,current_period_end=$3,cancel_at_period_end=$4,latest_invoice_id=$5,updated_at=now() WHERE id=$6",[status,p.start,p.end,subscription.cancel_at_period_end,invoice.id,s.id]);
  await tx.unsafe("INSERT INTO subscription_payments(subscription_id,stripe_invoice_id,stripe_payment_intent_id,amount_paid,currency,status,paid_at) VALUES($1,$2,$3,$4,$5,$6,$7) ON CONFLICT(stripe_invoice_id) DO UPDATE SET stripe_payment_intent_id=EXCLUDED.stripe_payment_intent_id,amount_paid=EXCLUDED.amount_paid,currency=EXCLUDED.currency,status=EXCLUDED.status,paid_at=EXCLUDED.paid_at,updated_at=now()",[s.id,invoice.id,objectId((invoice as any).payment_intent),(invoice as any).amount_paid??null,invoice.currency,paid?"PAID":"FAILED",paid?new Date():null]);
  if(paid&&p.end)await tx.unsafe("UPDATE licenses SET status='ACTIVE',valid_from=COALESCE($1,valid_from),valid_until=$2,revoked_at=NULL,updated_at=now() WHERE organization_id=$3 AND product_id=$4 AND license_type='ANNUAL'",[p.start,p.end,s.organization_id,s.product_id]);
  await tx.unsafe("INSERT INTO stripe_events(id,type) VALUES($1,$2)",[eventId,paid?"invoice.paid":"invoice.payment_failed"]);
  return {handled:true,status};
 });
}

export async function syncAnnualSubscription(subscription:Stripe.Subscription,eventId:string,deleted=false){
 const sql=db(),p=period(subscription);
 return sql.begin(async tx=>{
  const seen=await tx.unsafe("SELECT 1 FROM stripe_events WHERE id=$1 LIMIT 1",[eventId]);if(seen.length)return {handled:false,reason:"duplicate_event" as const};
  const rows=await tx.unsafe("SELECT id,organization_id,product_id FROM subscriptions WHERE stripe_subscription_id=$1 LIMIT 1",[subscription.id]);
  if(!rows.length){await tx.unsafe("INSERT INTO stripe_events(id,type) VALUES($1,$2)",[eventId,"customer.subscription.unbound"]);return {handled:false,reason:"subscription_not_bound" as const}}
  const s=rows[0];
  const stripeCancelAt=(subscription as any).cancel_at;
  const scheduledAtPeriodEnd=subscription.cancel_at_period_end===true||(
    typeof stripeCancelAt==="number"&&p.end!==null&&Math.abs(stripeCancelAt*1000-p.end.getTime())<1000
  );
  let status:string;
  if(deleted||subscription.status==="canceled")status="CANCELED";
  else if(subscription.status==="past_due"||subscription.status==="unpaid")status="PAST_DUE";
  else status=scheduledAtPeriodEnd?"CANCEL_AT_PERIOD_END":"ACTIVE";
  await tx.unsafe("UPDATE subscriptions SET status=$1,current_period_start=$2,current_period_end=$3,cancel_at_period_end=$4,canceled_at=$5,latest_invoice_id=$6,updated_at=now() WHERE id=$7",[status,p.start,p.end,scheduledAtPeriodEnd,status==="CANCELED"?new Date():null,objectId(subscription.latest_invoice),s.id]);
  if(status==="CANCELED"&&(!p.end||p.end<=new Date()))await tx.unsafe("UPDATE licenses SET status='REVOKED',revoked_at=COALESCE(revoked_at,now()),updated_at=now() WHERE organization_id=$1 AND product_id=$2 AND license_type='ANNUAL'",[s.organization_id,s.product_id]);
  await tx.unsafe("INSERT INTO stripe_events(id,type) VALUES($1,$2)",[eventId,deleted?"customer.subscription.deleted":"customer.subscription.updated"]);
  return {handled:true,status};
 });
}
