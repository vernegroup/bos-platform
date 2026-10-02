import { NextResponse } from "next/server";

/**
 * COMMERCE-12D
 * Legacy offline ZIP delivery is intentionally disabled.
 * BOS products are provisioned through organization licenses and the web application.
 */
export async function POST() {
  return NextResponse.json({ error: "legacy_download_disabled" }, { status: 410 });
}
