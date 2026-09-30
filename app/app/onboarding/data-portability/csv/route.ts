import { NextResponse } from "next/server";
import { requireBOSAccess } from "@/lib/bos/access";
import { buildPortableDataset,portableDatasetToCsvFiles } from "@/lib/bos/core/dataPortability";
export const dynamic="force-dynamic";
export async function GET(request:Request){const access=await requireBOSAccess();const data=await buildPortableDataset(access.organization.id);const files=portableDatasetToCsvFiles(data);const name=new URL(request.url).searchParams.get("file")||"employees.csv";if(!(name in files))return new NextResponse("Unknown export file",{status:404});return new NextResponse(files[name as keyof typeof files],{headers:{"Content-Type":"text/csv; charset=utf-8","Content-Disposition":`attachment; filename="${name}"`,"Cache-Control":"no-store"}});}
