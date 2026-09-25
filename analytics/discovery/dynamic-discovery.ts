import "server-only";

import { db } from "@/lib/db";
import { ANALYTICS_LAYERS, type AnalyticsLayer } from "../layers/layer-engine";
import type { AnalyticsEnvironment } from "../contracts/event-v1";

export interface DiscoveryQuery {
  domain: string;
  app_id?: string;
  environment?: AnalyticsEnvironment;
  from?: string;
  to?: string;
}

export interface AnalyticsDiscovery {
  domain: string;
  apps: string[];
  environments: AnalyticsEnvironment[];
  paths: string[];
  layers: AnalyticsLayer[];
}

export async function discoverAnalytics(input: DiscoveryQuery): Promise<AnalyticsDiscovery> {
  const sql = db();
  const rows = await sql<{ app_id: string; environment: AnalyticsEnvironment; path: string; event: string }[]>`
    SELECT DISTINCT app_id, environment, path, event
    FROM analytics_raw_events
    WHERE domain = ${input.domain}
      ${input.app_id ? sql`AND app_id = ${input.app_id}` : sql``}
      ${input.environment ? sql`AND environment = ${input.environment}` : sql``}
      ${input.from ? sql`AND occurred_at >= ${input.from}` : sql``}
      ${input.to ? sql`AND occurred_at < ${input.to}` : sql``}
    ORDER BY app_id, environment, path, event
  `;

  const apps = [...new Set(rows.map((row) => row.app_id))].sort();
  const environments = [...new Set(rows.map((row) => row.environment))].sort() as AnalyticsEnvironment[];
  const paths = [...new Set(rows.map((row) => row.path))].sort();
  const eventNames = new Set(rows.map((row) => row.event));
  const layers = ANALYTICS_LAYERS.filter((layer) => layerAvailable(layer, eventNames));
  return { domain: input.domain, apps, environments, paths, layers };
}

function layerAvailable(layer: AnalyticsLayer, events: Set<string>): boolean {
  switch (layer) {
    case "sessions": return events.size > 0;
    case "views": case "entries": case "exits": case "transitions": return events.has("page_view") || events.has("navigation");
    case "time": return events.size > 0;
    case "clicks": case "spatial": return events.has("click");
    case "scroll": return events.has("scroll");
    case "ai_feedback": return events.has("user_feedback");
    case "errors": return events.has("frontend_error") || events.has("api_error");
    case "http_status": return events.has("http_status") || events.has("api_error");
    case "latency": return events.has("latency");
  }
}

export function parseDiscoveryQuery(params: URLSearchParams): DiscoveryQuery {
  const domain = params.get("domain")?.trim();
  const environment = params.get("environment");
  const from = params.get("from");
  const to = params.get("to");
  if (!domain) throw new Error("DOMAIN_REQUIRED");
  if (environment && !["production","preview","development"].includes(environment)) throw new Error("INVALID_ENVIRONMENT");
  if (from && !Number.isFinite(Date.parse(from))) throw new Error("INVALID_FROM");
  if (to && !Number.isFinite(Date.parse(to))) throw new Error("INVALID_TO");
  if (from && to && Date.parse(from) >= Date.parse(to)) throw new Error("INVALID_PERIOD");
  return { domain, app_id: params.get("app_id")?.trim() || undefined, environment: environment as AnalyticsEnvironment | undefined, from: from || undefined, to: to || undefined };
}
