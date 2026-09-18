import { NextResponse } from "next/server";

import { stripe } from "@/lib/stripe";
import { fulfillCheckoutSession } from "@/lib/bos/purchaseRepository";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: "STRIPE_WEBHOOK_SECRET is not set" }, { status: 500 });

  const signature = request.headers.get("stripe-signature");
  if (!signature) return NextResponse.json({ error: "missing_signature" }, { status: 400 });

  let event;
  try {
    const payload = await request.text();
    event = stripe.webhooks.constructEvent(payload, signature, secret);
  } catch (error) {
    console.error("Stripe webhook signature verification failed", error);
    return NextResponse.json({ error: "invalid_signature" }, { status: 400 });
  }

  try {
    if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
      await fulfillCheckoutSession(event.data.object, event.id);
    }
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Stripe webhook fulfillment failed", error);
    return NextResponse.json({ error: "fulfillment_failed" }, { status: 500 });
  }
}
