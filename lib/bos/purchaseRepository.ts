import "server-only";

import type Stripe from "stripe";
import { db } from "@/lib/db";
import type { BOSProductKey } from "@/lib/bos/licenseRepository";
import { issueAuthToken } from "@/lib/bos/authRepository";
import { sendPurchaseClaimEmail } from "@/lib/bos/email";

function objectId(value: string | { id: string } | null | undefined) {
  if (!value) return null;
  return typeof value === "string" ? value : value.id;
}
function slugPart(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 36) || "firma";
}

export async function fulfillCheckoutSession(session: Stripe.Checkout.Session, eventId: string) {
  const productKey = session.metadata?.product as BOSProductKey | undefined;
  if (!productKey || !["onboarding", "promotions"].includes(productKey)) throw new Error("Stripe Checkout Session has no valid BOS product metadata.");
  if (session.payment_status !== "paid") return { fulfilled: false, reason: "not_paid" as const };

  const sql = db();
  const fulfillment = await sql.begin(async (tx) => {
    const seen = await tx.unsafe("SELECT 1 FROM stripe_events WHERE id=$1 LIMIT 1", [eventId]);
    if (seen.length) return { fulfilled: false, reason: "duplicate_event" as const };

    // Session-level idempotency is the primary fulfillment guard. Recovery and a later
    // Stripe webhook may have different event IDs but must resolve to the same purchase.
    const existingPurchase = await tx.unsafe(
      "SELECT p.id,p.organization_id,p.buyer_email,u.id AS user_id,u.status AS user_status,m.status AS membership_status FROM purchases p LEFT JOIN users u ON lower(u.email)=lower(p.buyer_email) LEFT JOIN memberships m ON m.user_id=u.id AND m.organization_id=p.organization_id AND m.role='OWNER' WHERE p.stripe_checkout_session_id=$1 AND p.status='PAID' LIMIT 1",
      [session.id],
    );
    if (existingPurchase.length) {
      await tx.unsafe("INSERT INTO stripe_events(id,type) VALUES($1,$2) ON CONFLICT(id) DO NOTHING", [eventId, "checkout.session.paid"]);
      const row = existingPurchase[0];
      const needsClaim = row.user_id && row.user_status === "INVITED" && row.membership_status === "INVITED";
      return {
        fulfilled: false,
        reason: "purchase_exists" as const,
        purchaseId: row.id,
        organizationId: row.organization_id,
        purchaseNeedsClaim: Boolean(needsClaim),
      };
    }

    const products = await tx.unsafe("SELECT id FROM products WHERE key=$1 AND status='ACTIVE' LIMIT 1", [productKey]);
    if (!products.length) throw new Error("BOS product not found.");

    const offerKey = session.metadata?.offer || null;
    if (!offerKey) throw new Error("Paid BOS purchase has no offer metadata.");
    const offers = await tx.unsafe(
      "SELECT id FROM commerce_offers WHERE key=$1 AND product_id=$2 AND status='ACTIVE' LIMIT 1",
      [offerKey, products[0].id],
    );
    if (!offers.length) throw new Error("Paid BOS purchase has no active annual offer.");

    const buyerEmail = session.customer_details?.email?.trim().toLowerCase() || session.customer_email?.trim().toLowerCase() || null;
    if (!buyerEmail) throw new Error("Paid BOS purchase has no buyer email.");

    const checkoutOrganizationId = session.metadata?.organization_id || null;
    const checkoutUserId = session.metadata?.bos_user_id || null;
    let organizationId = checkoutOrganizationId;

    if (checkoutOrganizationId || checkoutUserId) {
      if (!checkoutOrganizationId || !checkoutUserId) throw new Error("Authenticated BOS purchase has incomplete organization/user metadata.");
      const checkoutOwner = await tx.unsafe(
        "SELECT 1 FROM users u JOIN memberships m ON m.user_id=u.id JOIN organizations o ON o.id=m.organization_id WHERE u.id=$1 AND lower(u.email)=$2 AND m.organization_id=$3 AND m.status='ACTIVE' AND o.status='ACTIVE' LIMIT 1",
        [checkoutUserId, buyerEmail, checkoutOrganizationId],
      );
      if (!checkoutOwner.length) throw new Error("Authenticated BOS purchase metadata does not match an active organization membership.");
    }

    if (!organizationId) {
      const existing = await tx.unsafe(
        "SELECT o.id FROM users u JOIN memberships m ON m.user_id=u.id AND m.status='ACTIVE' JOIN organizations o ON o.id=m.organization_id AND o.status='ACTIVE' WHERE lower(u.email)=$1 ORDER BY m.created_at LIMIT 1",
        [buyerEmail],
      );
      if (existing.length) organizationId = existing[0].id;
    }

    let claimUserId: string | null = null;
    let purchaseNeedsClaim = false;

    if (!organizationId) {
      const label = buyerEmail.split("@")[0] || "Klient";
      const organizations = await tx.unsafe(
        "INSERT INTO organizations(name,slug,status) VALUES($1,$2,'ACTIVE') RETURNING id",
        [`Organizacja ${label}`, `${slugPart(label)}-${session.id.slice(-10).toLowerCase()}`],
      );
      organizationId = organizations[0].id;

      const users = await tx.unsafe(
        "INSERT INTO users(display_name,email,status) VALUES($1,$2,'INVITED') ON CONFLICT(email) DO UPDATE SET updated_at=now() RETURNING id",
        [label, buyerEmail],
      );
      claimUserId = users[0].id as string;
      purchaseNeedsClaim = true;
      await tx.unsafe(
        "INSERT INTO memberships(organization_id,user_id,role,status,invited_at) VALUES($1,$2,'OWNER','INVITED',now()) ON CONFLICT(organization_id,user_id) DO UPDATE SET role='OWNER',status='INVITED',updated_at=now()",
        [organizationId, claimUserId],
      );
    }

    const purchases = await tx.unsafe(
      "INSERT INTO purchases(organization_id,product_id,offer_id,buyer_email,stripe_checkout_session_id,stripe_payment_intent_id,stripe_customer_id,amount_total,currency,status,paid_at) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,'PAID',now()) ON CONFLICT(stripe_checkout_session_id) DO UPDATE SET organization_id=COALESCE(purchases.organization_id,EXCLUDED.organization_id),offer_id=EXCLUDED.offer_id,buyer_email=EXCLUDED.buyer_email,stripe_payment_intent_id=EXCLUDED.stripe_payment_intent_id,stripe_customer_id=EXCLUDED.stripe_customer_id,amount_total=EXCLUDED.amount_total,currency=EXCLUDED.currency,status='PAID',paid_at=COALESCE(purchases.paid_at,now()),updated_at=now() RETURNING id,organization_id",
      [organizationId, products[0].id, offers[0].id, buyerEmail, session.id, objectId(session.payment_intent), objectId(session.customer), session.amount_total, session.currency],
    );

    const existingLicense = await tx.unsafe(
      "SELECT license_type,valid_until FROM licenses WHERE organization_id=$1 AND product_id=$2 LIMIT 1 FOR UPDATE",
      [purchases[0].organization_id, products[0].id],
    );
    if (!existingLicense.length) {
      await tx.unsafe(
        "INSERT INTO licenses(organization_id,product_id,status,license_type,source_purchase_id,valid_from,valid_until) VALUES($1,$2,'ACTIVE','ANNUAL',$3,now(),now()+interval '1 year')",
        [purchases[0].organization_id, products[0].id, purchases[0].id],
      );
    } else if (existingLicense[0].license_type !== "PERPETUAL") {
      await tx.unsafe(
        "UPDATE licenses SET status='ACTIVE',license_type='ANNUAL',source_purchase_id=$1,source_subscription_id=NULL,valid_from=COALESCE(valid_from,now()),valid_until=(CASE WHEN valid_until>now() THEN valid_until ELSE now() END)+interval '1 year',revoked_at=NULL,updated_at=now() WHERE organization_id=$2 AND product_id=$3",
        [purchases[0].id, purchases[0].organization_id, products[0].id],
      );
    }
    await tx.unsafe("INSERT INTO stripe_events(id,type) VALUES($1,$2)", [eventId, "checkout.session.paid"]);
    return { fulfilled: true, purchaseId: purchases[0].id, organizationId: purchases[0].organization_id, purchaseNeedsClaim, claimUserId, buyerEmail };
  });

  if (fulfillment.fulfilled && fulfillment.purchaseNeedsClaim && fulfillment.claimUserId && fulfillment.buyerEmail) {
    const token = await issueAuthToken(fulfillment.claimUserId, "CLAIM_PURCHASE", 60 * 24);
    await sendPurchaseClaimEmail({
      to: fulfillment.buyerEmail,
      displayName: fulfillment.buyerEmail.split("@")[0] || "Kliencie",
      token,
    });
  }

  return fulfillment;
}

export async function failCheckoutSession(session: Stripe.Checkout.Session, eventId: string) {
  const sql = db();
  return sql.begin(async (tx) => {
    const seen = await tx.unsafe("SELECT 1 FROM stripe_events WHERE id=$1 LIMIT 1", [eventId]);
    if (seen.length) return { handled: false, reason: "duplicate_event" as const };
    await tx.unsafe("UPDATE purchases SET status='FAILED',updated_at=now() WHERE stripe_checkout_session_id=$1 AND status='PENDING'", [session.id]);
    await tx.unsafe("INSERT INTO stripe_events(id,type) VALUES($1,$2)", [eventId, "checkout.session.async_payment_failed"]);
    return { handled: true };
  });
}

export async function refundCharge(charge: Stripe.Charge, eventId: string) {
  const paymentIntentId = objectId(charge.payment_intent);
  if (!paymentIntentId) return { handled: false, reason: "missing_payment_intent" as const };

  const sql = db();
  return sql.begin(async (tx) => {
    const seen = await tx.unsafe("SELECT 1 FROM stripe_events WHERE id=$1 LIMIT 1", [eventId]);
    if (seen.length) return { handled: false, reason: "duplicate_event" as const };

    // Stripe emits charge.refunded for partial as well as full refunds.
    // A perpetual BOS license is revoked only when the charge is fully refunded.
    const fullyRefunded = charge.refunded === true || charge.amount_refunded >= charge.amount;
    if (!fullyRefunded) {
      await tx.unsafe("INSERT INTO stripe_events(id,type) VALUES($1,$2)", [eventId, "charge.partially_refunded"]);
      return { handled: true, partial: true, refundedPurchases: 0 };
    }

    const purchases = await tx.unsafe(
      "UPDATE purchases SET status='REFUNDED',updated_at=now() WHERE stripe_payment_intent_id=$1 AND status='PAID' RETURNING id,organization_id,product_id",
      [paymentIntentId],
    );

    for (const purchase of purchases) {
      const replacement = await tx.unsafe(
        "SELECT id FROM purchases WHERE organization_id=$1 AND product_id=$2 AND status='PAID' AND id<>$3 ORDER BY paid_at DESC NULLS LAST,created_at DESC LIMIT 1",
        [purchase.organization_id, purchase.product_id, purchase.id],
      );
      if (replacement.length) {
        const licenses = await tx.unsafe(
          "SELECT license_type FROM licenses WHERE organization_id=$1 AND product_id=$2 AND status='ACTIVE' LIMIT 1 FOR UPDATE",
          [purchase.organization_id, purchase.product_id],
        );
        if (licenses[0]?.license_type === "ANNUAL") {
          const remaining = await tx.unsafe(
            "SELECT id,paid_at FROM purchases WHERE organization_id=$1 AND product_id=$2 AND status='PAID' AND offer_id IS NOT NULL ORDER BY paid_at ASC NULLS LAST,created_at ASC",
            [purchase.organization_id, purchase.product_id],
          );
          if (remaining.length) {
            let validFrom = remaining[0].paid_at ?? new Date();
            let validUntil = validFrom;
            for (const item of remaining) {
              const rows = await tx.unsafe(
                "SELECT GREATEST($1::timestamptz,$2::timestamptz)+interval '1 year' AS valid_until",
                [validUntil, item.paid_at ?? validFrom],
              );
              validUntil = rows[0].valid_until;
            }
            await tx.unsafe(
              "UPDATE licenses SET source_purchase_id=$1,valid_from=$2,valid_until=$3,updated_at=now() WHERE organization_id=$4 AND product_id=$5 AND status='ACTIVE'",
              [remaining[remaining.length - 1].id, validFrom, validUntil, purchase.organization_id, purchase.product_id],
            );
          }
        } else {
          await tx.unsafe(
            "UPDATE licenses SET source_purchase_id=$1,updated_at=now() WHERE organization_id=$2 AND product_id=$3 AND status='ACTIVE' AND source_purchase_id=$4",
            [replacement[0].id, purchase.organization_id, purchase.product_id, purchase.id],
          );
        }
      } else {
        await tx.unsafe(
          "UPDATE licenses SET status='REVOKED',revoked_at=COALESCE(revoked_at,now()),updated_at=now() WHERE organization_id=$1 AND product_id=$2 AND status='ACTIVE'",
          [purchase.organization_id, purchase.product_id],
        );
      }
    }

    await tx.unsafe("INSERT INTO stripe_events(id,type) VALUES($1,$2)", [eventId, "charge.refunded"]);
    return { handled: true, partial: false, refundedPurchases: purchases.length };
  });
}

export async function recoverPaidCheckoutSession(session: Stripe.Checkout.Session) {
  if (session.payment_status !== "paid") return { fulfilled: false, reason: "not_paid" as const };
  console.info("[commerce.recovery] checking paid checkout", { sessionId: session.id });
  return fulfillCheckoutSession(session, `recovery:${session.id}`);
}
