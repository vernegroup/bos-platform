import "server-only";

import type Stripe from "stripe";
import { db } from "@/lib/db";
import type { BOSProductKey } from "@/lib/bos/licenseRepository";

function objectId(value: string | { id: string } | null | undefined) {
  if (!value) return null;
  return typeof value === "string" ? value : value.id;
}

export async function fulfillCheckoutSession(session: Stripe.Checkout.Session, eventId: string) {
  const productKey = session.metadata?.product as BOSProductKey | undefined;
  if (!productKey || !["onboarding", "promotions"].includes(productKey)) {
    throw new Error("Stripe Checkout Session has no valid BOS product metadata.");
  }
  if (session.payment_status !== "paid") return { fulfilled: false, reason: "not_paid" as const };

  const sql = db();
  return sql.begin(async (tx) => {
    const seen = await tx.unsafe("SELECT 1 FROM stripe_events WHERE id=$1 LIMIT 1", [eventId]);
    if (seen.length) return { fulfilled: false, reason: "duplicate_event" as const };

    const products = await tx.unsafe("SELECT id FROM products WHERE key=$1 AND status='ACTIVE' LIMIT 1", [productKey]);
    if (!products.length) throw new Error("BOS product not found.");

    const organizationId = session.metadata?.organization_id || null;
    const buyerEmail = session.customer_details?.email?.trim().toLowerCase() || session.customer_email?.trim().toLowerCase() || null;

    const purchases = await tx.unsafe(
      "INSERT INTO purchases(organization_id,product_id,buyer_email,stripe_checkout_session_id,stripe_payment_intent_id,stripe_customer_id,amount_total,currency,status,paid_at) VALUES($1,$2,$3,$4,$5,$6,$7,$8,'PAID',now()) ON CONFLICT(stripe_checkout_session_id) DO UPDATE SET buyer_email=EXCLUDED.buyer_email,stripe_payment_intent_id=EXCLUDED.stripe_payment_intent_id,stripe_customer_id=EXCLUDED.stripe_customer_id,amount_total=EXCLUDED.amount_total,currency=EXCLUDED.currency,status='PAID',paid_at=COALESCE(purchases.paid_at,now()),updated_at=now() RETURNING id,organization_id",
      [organizationId, products[0].id, buyerEmail, session.id, objectId(session.payment_intent), objectId(session.customer), session.amount_total, session.currency],
    );

    if (purchases[0].organization_id) {
      await tx.unsafe(
        "INSERT INTO licenses(organization_id,product_id,status,license_type,source_purchase_id) VALUES($1,$2,'ACTIVE','PERPETUAL',$3) ON CONFLICT DO NOTHING",
        [purchases[0].organization_id, products[0].id, purchases[0].id],
      );
    }

    await tx.unsafe("INSERT INTO stripe_events(id,type) VALUES($1,$2)", [eventId, "checkout.session.completed"]);
    return { fulfilled: true, purchaseId: purchases[0].id, organizationId: purchases[0].organization_id };
  });
}
