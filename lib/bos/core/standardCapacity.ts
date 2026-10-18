import "server-only";

/**
 * Call within the same SQL transaction that first publishes a Standard.
 * Caller must already hold the row lock on standards.id.
 * The migration commerce-02-standard-capacity.sql must be applied first.
 */
export async function consumeStandardCapacity(tx:any, input:{
  organizationId:string; standardId:string; productId:string|null;
}) {
  if(!input.productId) throw new Error("Przed publikacją przypisz Standard do produktu BOS.");
  // Serialize all publications for one tenant/product, including distinct Standard rows.
  await tx.unsafe("SELECT pg_advisory_xact_lock(hashtextextended($1,0))",[
    `bos-capacity:${input.organizationId}:${input.productId}`
  ]);
  const license=await tx.unsafe(
    "SELECT 1 FROM licenses l JOIN products p ON p.id=l.product_id WHERE l.organization_id=$1 AND l.product_id=$2 AND l.status='ACTIVE' AND p.status='ACTIVE' AND p.key IN ('onboarding','promotions') AND (l.license_type='PERPETUAL' OR (l.license_type='ANNUAL' AND l.valid_until>now())) LIMIT 1",
    [input.organizationId,input.productId]
  );
  if(!license.length) throw new Error("Brak aktywnej licencji produktu BOS.");
  const ownership=await tx.unsafe(
    "SELECT 1 FROM standards WHERE id=$1 AND organization_id=$2 AND product_id=$3 LIMIT 1",
    [input.standardId,input.organizationId,input.productId]
  );
  if(!ownership.length) throw new Error("Standard nie należy do wskazanego produktu i organizacji.");
  const existing=await tx.unsafe(
    "SELECT 1 FROM standard_capacity_consumptions WHERE standard_id=$1 AND organization_id=$2 AND product_id=$3",
    [input.standardId,input.organizationId,input.productId]
  );
  if(existing.length) return {newlyConsumed:false};
  const grants=await tx.unsafe(
    "SELECT COALESCE(SUM(quantity),0)::int AS capacity FROM standard_capacity_grants WHERE organization_id=$1 AND product_id=$2 AND status='ACTIVE'",
    [input.organizationId,input.productId]
  );
  const used=await tx.unsafe(
    "SELECT COUNT(*)::int AS used FROM standard_capacity_consumptions WHERE organization_id=$1 AND product_id=$2",
    [input.organizationId,input.productId]
  );
  const capacity=Number(grants[0]?.capacity??0);
  const consumed=Number(used[0]?.used??0);
  if(consumed>=capacity) throw new Error(
    "Wykorzystano limit opublikowanych Standardów. Dokup kolejne 10 miejsc."
  );
  await tx.unsafe(
    "INSERT INTO standard_capacity_consumptions(standard_id,organization_id,product_id) VALUES($1,$2,$3)",
    [input.standardId,input.organizationId,input.productId]
  );
  return {newlyConsumed:true};
}

export async function getStandardCapacity(sql:any, organizationId:string, productId:string) {
  const [grants,used]=await Promise.all([
    sql.unsafe("SELECT COALESCE(SUM(quantity),0)::int AS capacity FROM standard_capacity_grants WHERE organization_id=$1 AND product_id=$2 AND status='ACTIVE'",[organizationId,productId]),
    sql.unsafe("SELECT COUNT(*)::int AS used FROM standard_capacity_consumptions WHERE organization_id=$1 AND product_id=$2",[organizationId,productId])
  ]);
  const capacity=Number(grants[0]?.capacity??0);
  const consumed=Number(used[0]?.used??0);
  return {capacity,used:consumed,remaining:Math.max(0,capacity-consumed)};
}
