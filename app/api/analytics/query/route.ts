import { NextResponse } from "next/server";
import { parseAnalyticsQuery, queryAnalytics } from "@/analytics/query/query-api";

export async function GET(request: Request) {
  try {
    const query = parseAnalyticsQuery(new URL(request.url).searchParams);
    return NextResponse.json(await queryAnalytics(query));
  } catch (error) {
    const code = error instanceof Error ? error.message : "QUERY_FAILED";
    const clientError = ["DOMAIN_REQUIRED","INVALID_ENVIRONMENT","INVALID_FROM","INVALID_TO","INVALID_PERIOD","LAYERS_REQUIRED"].includes(code) || code.startsWith("INVALID_LAYERS:");
    return NextResponse.json({ error: clientError ? code : "QUERY_FAILED" }, { status: clientError ? 400 : 500 });
  }
}
