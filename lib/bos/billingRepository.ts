import "server-only";
import { db } from "@/lib/db";
import type { BOSAccess } from "@/lib/bos/access";

export async function resolveBillingCustomerId(access:BOSAccess){
 const rows=await db().unsafe(
  "SELECT stripe_customer_id FROM (SELECT stripe_customer_id,updated_at FROM subscriptions WHERE organization_id=$1 AND stripe_customer_id IS NOT NULL UNION ALL SELECT stripe_customer_id,updated_at FROM purchases WHERE organization_id=$1 AND stripe_customer_id IS NOT NULL) c ORDER BY created_at ASC LIMIT 1",
  [access.organization.id],
 );
 return rows.length?String(rows[0].stripe_customer_id):null;
}

export async function listBillingSubscriptions(access:BOSAccess){
 const rows=await db().unsafe("SELECT s.id,p.key,p.name,s.stripe_customer_id,s.status,s.current_period_end,s.cancel_at_period_end FROM subscriptions s JOIN products p ON p.id=s.product_id WHERE s.organization_id=$1 ORDER BY p.name",[access.organization.id]);
 return rows.map(r=>({id:String(r.id),key:r.key,name:r.name,customerId:r.stripe_customer_id?String(r.stripe_customer_id):null,status:String(r.status),currentPeriodEnd:r.current_period_end?(r.current_period_end instanceof Date?r.current_period_end.toISOString():String(r.current_period_end)):null,cancelAtPeriodEnd:Boolean(r.cancel_at_period_end)}));
}
