import { NextResponse } from "next/server";
import { discoverAnalytics, parseDiscoveryQuery } from "@/analytics/discovery/dynamic-discovery";

export async function GET(request: Request) {
  try {
    const query = parseDiscoveryQuery(new URL(request.url).searchParams);
    return NextResponse.json(await discoverAnalytics(query));
  } catch (error) {
    const code = error instanceof Error ? error.message : "DISCOVERY_FAILED";
    const clientError = ["DOMAIN_REQUIRED","INVALID_ENVIRONMENT","INVALID_FROM","INVALID_TO","INVALID_PERIOD"].includes(code);
    return NextResponse.json({ error: clientError ? code : "DISCOVERY_FAILED" }, { status: clientError ? 400 : 500 });
  }
}
