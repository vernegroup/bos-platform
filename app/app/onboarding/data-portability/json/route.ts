import { NextResponse } from "next/server";
import { requireBOSAccess } from "@/lib/bos/access";
import { buildPortableDataset } from "@/lib/bos/core/dataPortability";
export const dynamic="force-dynamic";
export async function GET(){const access=await requireBOSAccess();const data=await buildPortableDataset(access.organization.id);return NextResponse.json(data,{headers:{"Content-Disposition":`attachment; filename="bos-export-${new Date().toISOString().slice(0,10)}.json"`,"Cache-Control":"no-store"}});}
