import "server-only";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import type { BOSAccess } from "@/lib/bos/access";

export type BOSProductKey = "onboarding" | "promotions";

export type LicensedProduct = {
  key: BOSProductKey;
  name: string;
  currentVersion: string | null;
  licenseId: string;
  licenseType: "PERPETUAL";
  grantedAt: string;
};

export async function listLicensedProducts(access: BOSAccess): Promise<LicensedProduct[]> {
  const sql = db();
  const rows = await sql.unsafe(
    "SELECT p.key,p.name,p.current_version,l.id AS license_id,l.license_type,l.granted_at FROM licenses l JOIN products p ON p.id=l.product_id WHERE l.organization_id=$1 AND l.status='ACTIVE' AND p.status='ACTIVE' ORDER BY p.name",
    [access.organization.id],
  );
  return rows.map((row) => ({
    key: row.key as BOSProductKey,
    name: row.name,
    currentVersion: row.current_version,
    licenseId: row.license_id,
    licenseType: row.license_type,
    grantedAt: row.granted_at instanceof Date ? row.granted_at.toISOString() : String(row.granted_at),
  }));
}

export async function hasProductLicense(access: BOSAccess, productKey: BOSProductKey) {
  const sql = db();
  const rows = await sql.unsafe(
    "SELECT 1 FROM licenses l JOIN products p ON p.id=l.product_id WHERE l.organization_id=$1 AND p.key=$2 AND l.status='ACTIVE' AND p.status='ACTIVE' LIMIT 1",
    [access.organization.id, productKey],
  );
  return rows.length > 0;
}

export async function requireProductLicense(access: BOSAccess, productKey: BOSProductKey) {
  if (!(await hasProductLicense(access, productKey))) {
    redirect("/app/module-unavailable");
  }
}
