import "server-only";
import { db } from "@/lib/db";
import { sendCapacityAddonConfirmationEmail } from "@/lib/bos/email";

/**
 * Durable at-least-once delivery with one outbox row per paid checkout.
 * Stripe and Resend retries are deduplicated by the checkout session ID.
 * Lease protects concurrent webhook deliveries. A failed send resets to PENDING.
 */
export async function deliverCapacityAddonConfirmation(checkoutSessionId: string) {
  const sql = db();
  const claimed = await sql.unsafe(
    `UPDATE standard_capacity_email_outbox
     SET status='SENDING', locked_until=now()+interval '3 minutes',
         attempt_count=attempt_count+1, updated_at=now()
     WHERE stripe_checkout_session_id=$1 AND
       (status='PENDING' OR (status='SENDING' AND locked_until<now()))
     RETURNING recipient_email,product_name,total_capacity`,
    [checkoutSessionId],
  );
  if (!claimed.length) return { delivered: false, reason: "already_sent_or_in_progress" as const };
  const row = claimed[0];
  try {
    const result = await sendCapacityAddonConfirmationEmail({
      to: row.recipient_email,
      productName: row.product_name,
      totalCapacity: Number(row.total_capacity),
      checkoutSessionId,
    });
    await sql.unsafe(
      `UPDATE standard_capacity_email_outbox
       SET status='SENT',sent_at=now(),locked_until=NULL,resend_email_id=$2,
           last_error=NULL,updated_at=now()
       WHERE stripe_checkout_session_id=$1 AND status='SENDING'`,
      [checkoutSessionId,result.messageId],
    );
    return { delivered: true };
  } catch (error) {
    await sql.unsafe(
      `UPDATE standard_capacity_email_outbox
       SET status='PENDING',locked_until=NULL,last_error=$2,updated_at=now()
       WHERE stripe_checkout_session_id=$1 AND status='SENDING'`,
      [checkoutSessionId,String(error).slice(0,500)],
    );
    throw error;
  }
}
