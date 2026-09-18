import "server-only";

import { db } from "@/lib/db";
import type { BOSAccess } from "@/lib/bos/access";
import type { BOSProductKey } from "@/lib/bos/licenseRepository";

export type BOSProductUpdate={
 id:string; productKey:BOSProductKey; productName:string; version:string;
 title:string; description:string; publishedAt:string; isCurrent:boolean;
};

export async function listProductUpdates(access:BOSAccess):Promise<BOSProductUpdate[]>{
 const sql=db();
 const rows=await sql.unsafe(
  "SELECT pu.id,p.key,p.name,p.current_version,pu.version,pu.title,pu.description,pu.published_at FROM product_updates pu JOIN products p ON p.id=pu.product_id JOIN licenses l ON l.product_id=p.id WHERE l.organization_id=$1 AND l.status='ACTIVE' AND p.status='ACTIVE' ORDER BY pu.published_at DESC,pu.created_at DESC",
  [access.organization.id],
 );
 return rows.map(r=>({id:r.id,productKey:r.key as BOSProductKey,productName:r.name,version:r.version,title:r.title,description:r.description,publishedAt:r.published_at instanceof Date?r.published_at.toISOString():String(r.published_at),isCurrent:r.current_version===r.version}));
}

export async function getCurrentProductVersions(access:BOSAccess){
 const sql=db();
 const rows=await sql.unsafe(
  "SELECT p.key,p.current_version,(SELECT max(pu.published_at) FROM product_updates pu WHERE pu.product_id=p.id) latest_update_at FROM products p JOIN licenses l ON l.product_id=p.id WHERE l.organization_id=$1 AND l.status='ACTIVE' AND p.status='ACTIVE' ORDER BY p.name",
  [access.organization.id],
 );
 return rows.map(r=>({key:r.key as BOSProductKey,currentVersion:r.current_version as string|null,latestUpdateAt:r.latest_update_at instanceof Date?r.latest_update_at.toISOString():r.latest_update_at?String(r.latest_update_at):null}));
}
