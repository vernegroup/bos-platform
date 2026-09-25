import type { AnalyticsEventV1 } from "../contracts/event-v1";

type TechnicalData = {
  error_type?: string;
  fingerprint?: string;
  status?: number;
  method?: string;
  route?: string;
  duration_ms?: number;
  operation?: string;
};

export interface CountedTechnicalValue {
  value: string;
  count: number;
}

export interface LatencyMetric {
  operation: string;
  samples: number;
  average_ms: number;
  min_ms: number;
  max_ms: number;
  p50_ms: number;
  p95_ms: number;
}

export interface TechnicalSummary {
  frontend_errors: number;
  api_errors: number;
  http_status_events: number;
  latency_events: number;
  error_types: CountedTechnicalValue[];
  error_fingerprints: CountedTechnicalValue[];
  status_codes: CountedTechnicalValue[];
  routes: CountedTechnicalValue[];
  latency: LatencyMetric[];
}

function increment(map: Map<string, number>, value: string | undefined) {
  if (!value) return;
  map.set(value, (map.get(value) ?? 0) + 1);
}

function ranked(map: Map<string, number>): CountedTechnicalValue[] {
  return [...map.entries()]
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => b.count - a.count || a.value.localeCompare(b.value));
}

function percentile(sorted: readonly number[], p: number): number {
  if (!sorted.length) return 0;
  const index = Math.min(sorted.length - 1, Math.max(0, Math.ceil(p * sorted.length) - 1));
  return sorted[index];
}

export function buildTechnicalSummary(events: readonly AnalyticsEventV1[]): TechnicalSummary {
  let frontendErrors = 0;
  let apiErrors = 0;
  let httpStatusEvents = 0;
  let latencyEvents = 0;

  const errorTypes = new Map<string, number>();
  const fingerprints = new Map<string, number>();
  const statusCodes = new Map<string, number>();
  const routes = new Map<string, number>();
  const latencyByOperation = new Map<string, number[]>();

  for (const event of events) {
    if (!["frontend_error", "api_error", "http_status", "latency"].includes(event.event)) continue;
    const data = event.data as TechnicalData;

    if (event.event === "frontend_error" || event.event === "api_error") {
      if (event.event === "frontend_error") frontendErrors += 1;
      else apiErrors += 1;
      increment(errorTypes, data.error_type);
      increment(fingerprints, data.fingerprint);
      increment(routes, data.route);
      if (typeof data.status === "number") increment(statusCodes, String(data.status));
      continue;
    }

    if (event.event === "http_status") {
      httpStatusEvents += 1;
      if (typeof data.status === "number") increment(statusCodes, String(data.status));
      increment(routes, data.route);
      continue;
    }

    if (event.event === "latency" && typeof data.duration_ms === "number" && Number.isFinite(data.duration_ms) && data.duration_ms >= 0) {
      latencyEvents += 1;
      const operation = data.operation || "unknown";
      const samples = latencyByOperation.get(operation);
      if (samples) samples.push(data.duration_ms);
      else latencyByOperation.set(operation, [data.duration_ms]);
    }
  }

  const latency = [...latencyByOperation.entries()].map(([operation, samples]) => {
    const sorted = [...samples].sort((a, b) => a - b);
    const total = sorted.reduce((sum, value) => sum + value, 0);
    return {
      operation,
      samples: sorted.length,
      average_ms: Math.round(total / sorted.length),
      min_ms: sorted[0],
      max_ms: sorted[sorted.length - 1],
      p50_ms: percentile(sorted, 0.5),
      p95_ms: percentile(sorted, 0.95),
    };
  }).sort((a, b) => b.p95_ms - a.p95_ms || a.operation.localeCompare(b.operation));

  return {
    frontend_errors: frontendErrors,
    api_errors: apiErrors,
    http_status_events: httpStatusEvents,
    latency_events: latencyEvents,
    error_types: ranked(errorTypes),
    error_fingerprints: ranked(fingerprints),
    status_codes: ranked(statusCodes),
    routes: ranked(routes),
    latency,
  };
}
