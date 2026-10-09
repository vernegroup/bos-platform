import "server-only";
import type Stripe from "stripe";
import { db } from "@/lib/db";
import { stripe } from "@/lib/stripe";
import { bosAppUrl } from "@/lib/bos/app-url";
import { resolveBOSAccess } from "@/lib/bos/access";
import { resolveBillingCustomerId } from "@/lib/bos/billingRepository";
import { deliverCapacityAddonConfirmation } from "@/lib/bos/capacityAddonEmail";

export const CAPACITY_ADDON_PRICE_ID = "price_1UOb8W1ETGwirCfz2kz71m3W";
const ADDON_KIND = "standard_capacity_addon";

export async function createCapacityAddonCheckout(productKey: "onboarding"|"promotions") {
  const access = await resolveBOSAccess();
  if (!access) return { error:"auth_required" as const };
  if (!["OWNER","ADMIN"].includes(access.membership.role)) return { error:"forbidden" as const };
  const sql=db();
  const rows=await sql.unsafe(
    "SELECT p.id FROM products p JOIN licenses l ON l.product_id=p.id AND l.organization_id=$1 WHERE p.key=$2 AND p.status='ACTIVE' AND l.status='ACTIVE' AND (l.license_type='PERPETUAL' OR (l.license_type='ANNUAL' AND l.valid_until>now())) LIMIT 1",
    [access.organization.id,productKey]
  );
  if (!rows.length) return { error:"license_required" as const };
  const customerId=await resolveBillingCustomerId(access);
  const origin=bosAppUrl();
  const session=await stripe.checkout.sessions.create({
    mode:"payment",
    line_items:[{price:CAPACITY_ADDON_PRICE_ID,quantity:1}],
    ...(customerId?{customer:customerId}:{customer_email:access.user.email}),
    client_reference_id:access.organization.id,
    metadata:{bos_kind:ADDON_KIND,organization_id:access.organization.id,product_id:rows[0].id,product:productKey,bos_user_id:access.user.id,standards_added:"10"},
    success_url:origin+"/app/standards?capacity=success",
    cancel_url:origin+"/app/standards?capacity=cancel",
  });
  if (!session.url) throw new Error("Stripe checkout URL missing");
  return {url:session.url};
}

export async function fulfillCapacityAddon(session:Stripe.Checkout.Session,eventId:string) {
  if(session.metadata?.bos_kind!==ADDON_KIND)throw new Error("Unexpected checkout kind");
  if(session.mode!=="payment"||session.payment_status!=="paid")return {fulfilled:false,reason:"not_paid" as const};
  const metadata=session.metadata;
  if(!metadata)throw new Error("Missing capacity checkout metadata");
  const organizationId=metadata.organization_id;
  const productId=metadata.product_id;
  const userId=metadata.bos_user_id;
  if(!organizationId||!productId||!userId||!["onboarding","promotions"].includes(metadata.product??"")||metadata.standards_added!=="10"||session.client_reference_id!==organizationId)
    throw new Error("Invalid capacity checkout metadata");
  // Validate the actual paid line item, not only customer-controlled session metadata.
  const lines=await stripe.checkout.sessions.listLineItems(session.id,{limit:10});
  if(lines.data.length!==1||lines.data[0].price?.id!==CAPACITY_ADDON_PRICE_ID||lines.data[0].quantity!==1)
    throw new Error("Capacity addon price mismatch");
  const sql=db();
  const fulfillment = await sql.begin(async tx=>{
    await tx.unsafe("SELECT pg_advisory_xact_lock(hashtextextended($1,0))",[`bos-capacity:${organizationId}:${productId}`]);
    const prior=await tx.unsafe("SELECT id FROM standard_capacity_grants WHERE stripe_checkout_session_id=$1 LIMIT 1",[session.id]);
    if(prior.length){
      await tx.unsafe("INSERT INTO stripe_events(id,type) VALUES($1,$2) ON CONFLICT DO NOTHING",[eventId,"capacity.addon.paid"]);
      return {fulfilled:false,reason:"already_granted" as const};
    }
    const eligible=await tx.unsafe(
      "SELECT 1 FROM licenses l JOIN products p ON p.id=l.product_id JOIN organizations o ON o.id=l.organization_id JOIN memberships m ON m.organization_id=o.id AND m.user_id=$3 JOIN users u ON u.id=m.user_id WHERE l.organization_id=$1 AND l.product_id=$2 AND l.status='ACTIVE' AND (l.license_type='PERPETUAL' OR (l.license_type='ANNUAL' AND l.valid_until>now())) AND p.status='ACTIVE' AND p.key=$4 AND o.status='ACTIVE' AND m.status='ACTIVE' AND m.role IN ('OWNER','ADMIN') AND u.status='ACTIVE' LIMIT 1",
      [organizationId,productId,userId,metadata.product]
    );
    if(!eligible.length)throw new Error("No active product license or authorized purchaser for capacity addon");
    await tx.unsafe(
      "INSERT INTO standard_capacity_grants(organization_id,product_id,quantity,source,stripe_checkout_session_id) VALUES($1,$2,10,'STRIPE',$3) ON CONFLICT(stripe_checkout_session_id) DO NOTHING",
      [organizationId,productId,session.id]
    );
    // Outbox row is committed atomically with the capacity grant.
    const buyer=await tx.unsafe("SELECT email FROM users WHERE id=$1 AND status='ACTIVE' LIMIT 1",[userId]);
    if(!buyer.length||!buyer[0].email)throw new Error("Capacity purchaser email unavailable");
    const capacity=await tx.unsafe(
      "SELECT COALESCE(SUM(quantity),0)::int AS total FROM standard_capacity_grants WHERE organization_id=$1 AND product_id=$2 AND status='ACTIVE'",
      [organizationId,productId]
    );
    await tx.unsafe(
      "INSERT INTO standard_capacity_email_outbox(stripe_checkout_session_id,organization_id,product_id,recipient_email,product_name,total_capacity) VALUES($1,$2,$3,$4,$5,$6) ON CONFLICT(stripe_checkout_session_id) DO NOTHING",
      [session.id,organizationId,productId,buyer[0].email,metadata.product==="onboarding"?"BOS Wdrożenia":"BOS Awanse",Number(capacity[0].total)]
    );
    await tx.unsafe("INSERT INTO stripe_events(id,type) VALUES($1,$2) ON CONFLICT DO NOTHING",[eventId,"capacity.addon.paid"]);
    return {fulfilled:true,organizationId,productId,quantity:10};
  });
  // On repeated events retry an unsent confirmation without regranting capacity.
  // A delivery failure returns 500 to Stripe; the committed grant is not rolled back.
  await deliverCapacityAddonConfirmation(session.id);
  return fulfillment;
}
