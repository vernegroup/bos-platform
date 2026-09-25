import "server-only";

import { db } from "@/lib/db";
import type { AnalyticsEventV1, AnalyticsEnvironment } from "../contracts/event-v1";
import { ANALYTICS_LAYERS, buildAnalyticsLayers, type AnalyticsLayer } from "../layers/layer-engine";
import { normalizeAnalyticsEvents } from "../normalization/data-normalizer";
import { buildSessions } from "../session/session-engine";

export interface AnalyticsQuery {
  domain: string;
  app_id?: string;
  environment: AnalyticsEnvironment;
  path?: string;
  from: string;
  to: string;
  layers: AnalyticsLayer[];
}

export async function queryAnalytics(input: AnalyticsQuery) {
  const sql = db();
  const rows = await sql<AnalyticsEventV1[]>`
    SELECT schema_version, event_id, occurred_at::text AS timestamp, source, domain, app_id, environment, path, session_id, event, data
    FROM analytics_raw_events
    WHERE domain = ${input.domain}
      AND environment = ${input.environment}
      AND occurred_at >= ${input.from}
      AND occurred_at < ${input.to}
      ${input.app_id ? sql`AND app_id = ${input.app_id}` : sql``}
      ${input.path ? sql`AND path = ${input.path}` : sql``}
    ORDER BY occurred_at ASC, event_id ASC
  `;

  const normalized = normalizeAnalyticsEvents(rows);
  const events = normalized.events.map(({ event }) => event);
  const sessions = buildSessions(events);
  return { query: input, normalization: normalized.report, layers: buildAnalyticsLayers(events, sessions, input.layers) };
}

export function parseAnalyticsQuery(params: URLSearchParams): AnalyticsQuery {
  const domain = params.get("domain")?.trim();
  const environment = params.get("environment");
  const from = params.get("from");
  const to = params.get("to");
  const layers = (params.get("layers") ?? "").split(",").map((value) => value.trim()).filter(Boolean);
  if (!domain) throw new Error("DOMAIN_REQUIRED");
  if (!["production", "preview", "development"].includes(environment ?? "")) throw new Error("INVALID_ENVIRONMENT");
  if (!from || !Number.isFinite(Date.parse(from))) throw new Error("INVALID_FROM");
  if (!to || !Number.isFinite(Date.parse(to))) throw new Error("INVALID_TO");
  if (Date.parse(from) >= Date.parse(to)) throw new Error("INVALID_PERIOD");
  if (!layers.length) throw new Error("LAYERS_REQUIRED");
  const invalid = layers.filter((layer) => !ANALYTICS_LAYERS.includes(layer as AnalyticsLayer));
  if (invalid.length) throw new Error("INVALID_LAYERS:" + invalid.join(","));
  return { domain, app_id: params.get("app_id")?.trim() || undefined, environment: environment as AnalyticsEnvironment, path: params.get("path")?.trim() || undefined, from, to, layers: [...new Set(layers)] as AnalyticsLayer[] };
}
