import type { AnalyticsEnvironment, AnalyticsEventName, AnalyticsEventV1 } from "../contracts/event-v1";

export interface TechnicalContext {
  domain: string;
  appId: string;
  environment: AnalyticsEnvironment;
  path: string;
  sessionId?: string;
}

export function technicalEvent(
  context: TechnicalContext,
  event: Extract<AnalyticsEventName, "frontend_error" | "api_error" | "http_status" | "latency">,
  data: Record<string, unknown>,
): AnalyticsEventV1 {
  return {
    schema_version: "1.0",
    event_id: "evt_" + crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    source: "system",
    domain: context.domain,
    app_id: context.appId,
    environment: context.environment,
    path: context.path,
    session_id: context.sessionId,
    event,
    data,
  };
}

export function frontendErrorData(error: unknown): Record<string, unknown> {
  const value = error instanceof Error ? error : new Error("Unknown frontend error");
  return {
    error_type: value.name || "Error",
    fingerprint: stableFingerprint(value.name + ":" + sanitizeErrorMessage(value.message)),
  };
}

export function httpStatusData(status: number, method: string, route: string): Record<string, unknown> {
  return { status, method: method.toUpperCase(), route };
}

export function latencyData(durationMs: number, operation: string): Record<string, unknown> {
  return { duration_ms: Math.max(0, Math.round(durationMs)), operation };
}

function sanitizeErrorMessage(message: string): string {
  return message
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[email]")
    .replace(/https?:\/\/[^\s]+/gi, "[url]")
    .slice(0, 160);
}

function stableFingerprint(input: string): string {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}
