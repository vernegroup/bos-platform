import "server-only";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import type { BOSAccess } from "@/lib/bos/access";
import { bosProducts,type BOSProductKey } from "@/data/products";
export type { BOSProductKey };
export type LicensedProduct={key:BOSProductKey;name:string;currentVersion:string|null;licenseId:string;licenseType:"PERPETUAL"|"ANNUAL";grantedAt:string;validUntil:string|null};
const VALID="l.status='ACTIVE' AND (l.license_type='PERPETUAL' OR (l.license_type='ANNUAL' AND l.valid_until>now()))";
export async function listLicensedProducts(access:BOSAccess):Promise<LicensedProduct[]>{
 const rows=await db().unsafe(`SELECT p.key,p.name,p.current_version,l.id AS license_id,l.license_type,l.granted_at,l.valid_until FROM licenses l JOIN products p ON p.id=l.product_id WHERE l.organization_id=$1 AND ${VALID} AND p.status='ACTIVE' ORDER BY p.name`,[access.organization.id]);
 return rows.map(r=>({key:r.key as BOSProductKey,name:r.name,currentVersion:r.current_version,licenseId:r.license_id,licenseType:r.license_type,grantedAt:r.granted_at instanceof Date?r.granted_at.toISOString():String(r.granted_at),validUntil:r.valid_until?(r.valid_until instanceof Date?r.valid_until.toISOString():String(r.valid_until)):null}));
}
export type ProductEntitlement={key:BOSProductKey;licensed:boolean};
export async function listProductEntitlements(access:BOSAccess):Promise<ProductEntitlement[]>{const licensed=await listLicensedProducts(access),keys=new Set(licensed.map(p=>p.key));return bosProducts.map(p=>({key:p.id,licensed:keys.has(p.id)}))}
export async function hasProductLicense(access:BOSAccess,productKey:BOSProductKey){const rows=await db().unsafe(`SELECT 1 FROM licenses l JOIN products p ON p.id=l.product_id WHERE l.organization_id=$1 AND p.key=$2 AND ${VALID} AND p.status='ACTIVE' LIMIT 1`,[access.organization.id,productKey]);return rows.length>0}
export async function requireProductLicense(access:BOSAccess,productKey:BOSProductKey){if(!(await hasProductLicense(access,productKey)))redirect("/app/module-unavailable")}
