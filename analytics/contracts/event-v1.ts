export const ANALYTICS_SCHEMA_VERSION = "1.0" as const;

export const ANALYTICS_SOURCES = ["browser", "backend", "ai", "system"] as const;
export const ANALYTICS_ENVIRONMENTS = ["production", "preview", "development"] as const;
export const ANALYTICS_EVENTS = [
  "page_view",
  "navigation",
  "click",
  "scroll",
  "session_start",
  "session_end",
  "user_feedback",
  "frontend_error",
  "api_error",
  "http_status",
  "latency",
] as const;

export const AI_INTENTS = [
  "help_request",
  "confusion",
  "complaint",
  "feature_request",
  "bug_report",
  "navigation_request",
  "other",
] as const;

export const AI_REASONS = [
  "unclear",
  "missing",
  "not_found",
  "unexpected_behavior",
  "error",
  "too_complex",
  "other",
] as const;

export const AI_RESULTS = ["resolved", "unresolved", "unknown"] as const;

export type AnalyticsSource = (typeof ANALYTICS_SOURCES)[number];
export type AnalyticsEnvironment = (typeof ANALYTICS_ENVIRONMENTS)[number];
export type AnalyticsEventName = (typeof ANALYTICS_EVENTS)[number];
export type AiIntent = (typeof AI_INTENTS)[number];
export type AiReason = (typeof AI_REASONS)[number];
export type AiResult = (typeof AI_RESULTS)[number];

export interface AnalyticsEventV1 {
  schema_version: typeof ANALYTICS_SCHEMA_VERSION;
  event_id: string;
  timestamp: string;
  source: AnalyticsSource;
  domain: string;
  app_id: string;
  environment: AnalyticsEnvironment;
  path: string;
  session_id?: string;
  event: AnalyticsEventName;
  data: Record<string, unknown>;
}

export interface AiFeedbackClassification {
  intent: AiIntent;
  reason: AiReason;
  result: AiResult;
  topic: string;
}

export interface InteractionCoordinates {
  viewport_x: number;
  viewport_y: number;
  document_x: number;
  document_y: number;
  normalized_x: number;
  normalized_y: number;
}

export interface ClickEventData {
  coordinates: InteractionCoordinates;
  viewport: { width: number; height: number };
  document: { width: number; height: number };
  element: { id?: string; type: string };
}
