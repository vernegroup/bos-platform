import { NextResponse } from "next/server";
export const runtime="nodejs";
// Oferta dodatkowych slotów została wycofana. Nie inicjuj płatności.
export async function POST(){
  return NextResponse.json({error:"capacity_addon_discontinued"},{status:410});
}
