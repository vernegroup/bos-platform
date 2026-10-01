import { NextResponse } from "next/server";

import { stripe } from "@/lib/stripe";
import { failCheckoutSession, fulfillCheckoutSession, refundCharge } from "@/lib/bos/purchaseRepository";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    console.error("[stripe.webhook] configuration missing", { hasWebhookSecret: false });
    return NextResponse.json({ error: "STRIPE_WEBHOOK_SECRET is not set" }, { status: 500 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    console.warn("[stripe.webhook] missing signature");
    return NextResponse.json({ error: "missing_signature" }, { status: 400 });
  }

  let event;
  try {
    const payload = await request.text();
    event = stripe.webhooks.constructEvent(payload, signature, secret);
  } catch (error) {
    console.error("[stripe.webhook] signature verification failed", error);
    return NextResponse.json({ error: "invalid_signature" }, { status: 400 });
  }

  console.info("[stripe.webhook] accepted", { eventId: event.id, eventType: event.type });

  try {
    let result: unknown = { handled: false, reason: "ignored_event" };
    if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
      result = await fulfillCheckoutSession(event.data.object, event.id);
    } else if (event.type === "checkout.session.async_payment_failed") {
      result = await failCheckoutSession(event.data.object, event.id);
    } else if (event.type === "charge.refunded") {
      result = await refundCharge(event.data.object, event.id);
    }
    console.info("[stripe.webhook] processed", { eventId: event.id, eventType: event.type, result });
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[stripe.webhook] fulfillment failed", { eventId: event.id, eventType: event.type, error });
    return NextResponse.json({ error: "fulfillment_failed" }, { status: 500 });
  }
}
