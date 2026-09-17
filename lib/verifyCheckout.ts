import "server-only";

import { stripe } from "@/lib/stripe";

export async function verifyCheckout(sessionId: string) {
  if (!sessionId) {
    return null;
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: [
        "customer",
        "payment_intent",
      ],
    });

    if (session.payment_status !== "paid") {
      return null;
    }

    return {
      session,

      customer: session.customer,

      paymentIntent: session.payment_intent,

      customerEmail: session.customer_details?.email ?? null,

      amountTotal: session.amount_total,

      currency: session.currency,

      metadata: session.metadata,
    };
  } catch (error) {
    console.error(error);

    return null;
  }
}