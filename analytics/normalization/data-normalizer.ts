import type { AnalyticsEventV1 } from "../contracts/event-v1";

export type ViewportClass = "small" | "medium" | "large" | "unknown";

export interface NormalizedAnalyticsEvent {
  event: AnalyticsEventV1;
  viewport_class: ViewportClass;
}

export interface NormalizationReport {
  input: number;
  output: number;
  duplicates: number;
  bots: number;
  anomalies: number;
}

export interface NormalizationResult {
  events: NormalizedAnalyticsEvent[];
  report: NormalizationReport;
}

type EventData = {
  viewport?: { width?: number; height?: number };
  bot?: boolean;
  automation?: boolean;
};

const MAX_FUTURE_SKEW_MS = 5 * 60 * 1000;
const MAX_EVENT_AGE_MS = 366 * 24 * 60 * 60 * 1000;

function viewportClass(event: AnalyticsEventV1): ViewportClass {
  const width = (event.data as EventData).viewport?.width;
  if (typeof width !== "number" || !Number.isFinite(width) || width <= 0) return "unknown";
  if (width < 768) return "small";
  if (width < 1280) return "medium";
  return "large";
}

function isExplicitBot(event: AnalyticsEventV1): boolean {
  const data = event.data as EventData;
  return data.bot === true || data.automation === true;
}

function isAnomalous(event: AnalyticsEventV1, nowMs: number): boolean {
  const timestamp = Date.parse(event.timestamp);
  if (!Number.isFinite(timestamp)) return true;
  if (timestamp > nowMs + MAX_FUTURE_SKEW_MS) return true;
  if (timestamp < nowMs - MAX_EVENT_AGE_MS) return true;
  return false;
}

export function normalizeAnalyticsEvents(
  events: readonly AnalyticsEventV1[],
  now: Date = new Date(),
): NormalizationResult {
  const seen = new Set<string>();
  const output: NormalizedAnalyticsEvent[] = [];
  let duplicates = 0;
  let bots = 0;
  let anomalies = 0;

  for (const event of events) {
    if (seen.has(event.event_id)) {
      duplicates += 1;
      continue;
    }
    seen.add(event.event_id);

    if (isExplicitBot(event)) {
      bots += 1;
      continue;
    }

    if (isAnomalous(event, now.getTime())) {
      anomalies += 1;
      continue;
    }

    output.push({ event, viewport_class: viewportClass(event) });
  }

  return {
    events: output,
    report: {
      input: events.length,
      output: output.length,
      duplicates,
      bots,
      anomalies,
    },
  };
}

export function splitByEnvironment(events: readonly NormalizedAnalyticsEvent[]) {
  return {
    production: events.filter(({ event }) => event.environment === "production"),
    preview: events.filter(({ event }) => event.environment === "preview"),
    development: events.filter(({ event }) => event.environment === "development"),
  };
}
