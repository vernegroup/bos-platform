import type { AnalyticsEventV1 } from "../contracts/event-v1";
import type { AnalyticsSession } from "../session/session-engine";
import { buildTrafficSummary } from "../traffic/traffic-engine";
import { buildInteractionSummary } from "../interaction/interaction-engine";
import { buildAiFeedbackSummary } from "../ai/ai-feedback-engine";
import { buildTechnicalSummary } from "../technical/technical-engine";

export type AnalyticsLayer =
  | "sessions"
  | "views"
  | "time"
  | "entries"
  | "exits"
  | "transitions"
  | "clicks"
  | "scroll"
  | "spatial"
  | "ai_feedback"
  | "errors"
  | "http_status"
  | "latency";

export interface LayerResult {
  layer: AnalyticsLayer;
  data: unknown;
}

export function buildAnalyticsLayers(
  events: readonly AnalyticsEventV1[],
  sessions: readonly AnalyticsSession[],
  requested: readonly AnalyticsLayer[],
): LayerResult[] {
  const unique = [...new Set(requested)];
  const trafficNeeded = unique.some((layer) =>
    ["sessions","views","time","entries","exits","transitions"].includes(layer),
  );
  const interactionNeeded = unique.some((layer) =>
    ["clicks","scroll","spatial"].includes(layer),
  );
  const technicalNeeded = unique.some((layer) =>
    ["errors","http_status","latency"].includes(layer),
  );

  const traffic = trafficNeeded ? buildTrafficSummary(events, sessions) : null;
  const interaction = interactionNeeded ? buildInteractionSummary(events) : null;
  const ai = unique.includes("ai_feedback") ? buildAiFeedbackSummary(events) : null;
  const technical = technicalNeeded ? buildTechnicalSummary(events) : null;

  return unique.map((layer): LayerResult => {
    switch (layer) {
      case "sessions": return { layer, data: { sessions: traffic!.sessions } };
      case "views": return { layer, data: { page_views: traffic!.page_views, paths: traffic!.paths.map(({ path, page_views }) => ({ path, page_views })) } };
      case "time": return { layer, data: { total_observed_session_time_ms: traffic!.total_observed_session_time_ms, average_observed_session_time_ms: traffic!.average_observed_session_time_ms, paths: traffic!.paths.map(({ path, observed_time_ms }) => ({ path, observed_time_ms })) } };
      case "entries": return { layer, data: traffic!.paths.map(({ path, entries }) => ({ path, entries })) };
      case "exits": return { layer, data: traffic!.paths.map(({ path, exits }) => ({ path, exits })) };
      case "transitions": return { layer, data: traffic!.transitions };
      case "clicks": return { layer, data: { clicks: interaction!.clicks, paths: interaction!.paths.map(({ path, clicks, elements }) => ({ path, clicks, elements })) } };
      case "scroll": return { layer, data: { scroll_events: interaction!.scroll_events, paths: interaction!.paths.map(({ path, scroll_events, average_scroll_depth, max_scroll_depth }) => ({ path, scroll_events, average_scroll_depth, max_scroll_depth })) } };
      case "spatial": return { layer, data: interaction!.paths.map(({ path, spatial }) => ({ path, spatial })) };
      case "ai_feedback": return { layer, data: ai };
      case "errors": return { layer, data: { frontend_errors: technical!.frontend_errors, api_errors: technical!.api_errors, error_types: technical!.error_types, error_fingerprints: technical!.error_fingerprints } };
      case "http_status": return { layer, data: { http_status_events: technical!.http_status_events, status_codes: technical!.status_codes, routes: technical!.routes } };
      case "latency": return { layer, data: technical!.latency };
    }
  });
}

export const ANALYTICS_LAYERS: readonly AnalyticsLayer[] = [
  "sessions","views","time","entries","exits","transitions",
  "clicks","scroll","spatial","ai_feedback","errors","http_status","latency",
];
