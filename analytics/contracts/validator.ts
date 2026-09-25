import {
  AI_INTENTS,
  AI_REASONS,
  AI_RESULTS,
  ANALYTICS_ENVIRONMENTS,
  ANALYTICS_EVENTS,
  ANALYTICS_SCHEMA_VERSION,
  ANALYTICS_SOURCES,
  type AnalyticsEventV1,
} from "./event-v1";

export interface ValidationError {
  field: string;
  code: string;
  message: string;
}

export type ValidationResult =
  | { valid: true; event: AnalyticsEventV1 }
  | { valid: false; errors: ValidationError[] };

const has = (values: readonly string[], value: unknown): value is string =>
  typeof value === "string" && values.includes(value);

const finite = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

export function validateAnalyticsEvent(input: unknown): ValidationResult {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return { valid: false, errors: [{ field: "$", code: "INVALID_TYPE", message: "Event must be an object." }] };
  }

  const event = input as Record<string, unknown>;
  const errors: ValidationError[] = [];
  const requiredStrings = ["event_id", "timestamp", "domain", "app_id", "path"] as const;

  if (event.schema_version !== ANALYTICS_SCHEMA_VERSION) {
    errors.push({ field: "schema_version", code: "UNSUPPORTED_SCHEMA", message: "Expected schema version 1.0." });
  }

  for (const field of requiredStrings) {
    if (typeof event[field] !== "string" || !(event[field] as string).trim()) {
      errors.push({ field, code: "REQUIRED_STRING", message: field + " must be a non-empty string." });
    }
  }

  if (typeof event.timestamp === "string" && Number.isNaN(Date.parse(event.timestamp))) {
    errors.push({ field: "timestamp", code: "INVALID_TIMESTAMP", message: "timestamp must be ISO-8601 compatible." });
  }

  if (!has(ANALYTICS_SOURCES, event.source)) {
    errors.push({ field: "source", code: "INVALID_ENUM", message: "Unknown analytics source." });
  }
  if (!has(ANALYTICS_ENVIRONMENTS, event.environment)) {
    errors.push({ field: "environment", code: "INVALID_ENUM", message: "Unknown analytics environment." });
  }
  if (!has(ANALYTICS_EVENTS, event.event)) {
    errors.push({ field: "event", code: "INVALID_ENUM", message: "Unknown analytics event." });
  }
  if (!event.data || typeof event.data !== "object" || Array.isArray(event.data)) {
    errors.push({ field: "data", code: "INVALID_TYPE", message: "data must be an object." });
  }

  if (event.event === "click" && event.data && typeof event.data === "object") {
    const data = event.data as Record<string, any>;
    const coordinates = data.coordinates;
    const viewport = data.viewport;
    const document = data.document;
    if (!coordinates || !finite(coordinates.normalized_x) || !finite(coordinates.normalized_y) ||
        coordinates.normalized_x < 0 || coordinates.normalized_x > 1 ||
        coordinates.normalized_y < 0 || coordinates.normalized_y > 1) {
      errors.push({ field: "data.coordinates", code: "INVALID_COORDINATES", message: "Click coordinates must include normalized values in range 0..1." });
    }
    if (!viewport || !finite(viewport.width) || !finite(viewport.height) || viewport.width <= 0 || viewport.height <= 0) {
      errors.push({ field: "data.viewport", code: "INVALID_VIEWPORT", message: "Viewport dimensions must be positive." });
    }
    if (!document || !finite(document.width) || !finite(document.height) || document.width <= 0 || document.height <= 0) {
      errors.push({ field: "data.document", code: "INVALID_DOCUMENT", message: "Document dimensions must be positive." });
    }
  }

  if (event.event === "scroll" && event.data && typeof event.data === "object") {
    const depth = (event.data as Record<string, unknown>).depth;
    if (!finite(depth) || depth < 0 || depth > 1) {
      errors.push({ field: "data.depth", code: "INVALID_SCROLL_DEPTH", message: "Scroll depth must be in range 0..1." });
    }
  }

  if (event.event === "user_feedback" && event.data && typeof event.data === "object") {
    const classification = (event.data as Record<string, any>).classification;
    if (!classification || !has(AI_INTENTS, classification.intent) || !has(AI_REASONS, classification.reason) ||
        !has(AI_RESULTS, classification.result) || typeof classification.topic !== "string" || !classification.topic.trim()) {
      errors.push({ field: "data.classification", code: "INVALID_AI_CLASSIFICATION", message: "AI feedback classification is invalid." });
    }
  }

  return errors.length
    ? { valid: false, errors }
    : { valid: true, event: input as AnalyticsEventV1 };
}
