import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { db } from "@/lib/db";
import { issueAuthToken } from "@/lib/bos/authRepository";
import { sendPurchaseClaimEmail } from "@/lib/bos/email";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { sessionId?: string };
    const sessionId = body.sessionId?.trim();
    if (!sessionId) return NextResponse.json({ error: "missing_session" }, { status: 400 });

    // Possession of a session id alone is not trusted as proof of purchase.
    // Stripe is queried server-side and BOS requires the matching persisted PAID purchase.
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session.payment_status !== "paid") return NextResponse.json({ error: "not_paid" }, { status: 403 });

    const sql = db();
    const rows = await sql.unsafe(
      `SELECT p.id AS purchase_id,p.buyer_email,u.id AS user_id,u.display_name,u.status AS user_status,
              m.status AS membership_status
       FROM purchases p
       JOIN users u ON lower(u.email)=lower(p.buyer_email)
       JOIN memberships m ON m.user_id=u.id AND m.organization_id=p.organization_id AND m.role='OWNER'
       WHERE p.stripe_checkout_session_id=$1 AND p.status='PAID'
       LIMIT 1`,
      [session.id],
    );

    if (!rows.length) return NextResponse.json({ error: "claim_not_available" }, { status: 404 });
    const row = rows[0];
    if (row.user_status !== "INVITED" || row.membership_status !== "INVITED") {
      return NextResponse.json({ error: "already_activated" }, { status: 409 });
    }

    // No token-age cooldown: a failed provider send must never lock the buyer out.
    // issueAuthToken invalidates the previous unconsumed claim, so only the newest link remains valid.
    const token = await issueAuthToken(row.user_id as string, "CLAIM_PURCHASE", 60 * 24);
    await sendPurchaseClaimEmail({
      to: row.buyer_email as string,
      displayName: (row.display_name as string | null) || (row.buyer_email as string).split("@")[0] || "Kliencie",
      token,
    });

    console.info("[commerce.claim.resend] sent", { purchaseId: row.purchase_id, sessionId: session.id });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[commerce.claim.resend] failed", { error });
    return NextResponse.json({ error: "send_failed" }, { status: 500 });
  }
}
