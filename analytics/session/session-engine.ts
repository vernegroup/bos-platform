import type { AnalyticsEventV1 } from "../contracts/event-v1";

export interface AnalyticsSession {
  session_id: string;
  domain: string;
  app_id: string;
  environment: AnalyticsEventV1["environment"];
  started_at: string;
  ended_at: string;
  duration_ms: number;
  event_count: number;
  page_view_count: number;
  entry_path: string;
  exit_path: string;
  paths: string[];
  explicit_start: boolean;
  explicit_end: boolean;
}

export interface SessionEngineOptions {
  inactivityTimeoutMs?: number;
}

const DEFAULT_INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000;

export function buildSessions(
  events: readonly AnalyticsEventV1[],
  options: SessionEngineOptions = {},
): AnalyticsSession[] {
  const inactivityTimeoutMs = options.inactivityTimeoutMs ?? DEFAULT_INACTIVITY_TIMEOUT_MS;
  const groups = new Map<string, AnalyticsEventV1[]>();

  for (const event of events) {
    if (!event.session_id) continue;
    const key = [event.domain, event.app_id, event.environment, event.session_id].join("\u001f");
    const group = groups.get(key);
    if (group) group.push(event);
    else groups.set(key, [event]);
  }

  const sessions: AnalyticsSession[] = [];

  for (const group of groups.values()) {
    const ordered = [...group].sort((a, b) => {
      const delta = Date.parse(a.timestamp) - Date.parse(b.timestamp);
      return delta || a.event_id.localeCompare(b.event_id);
    });

    let segment: AnalyticsEventV1[] = [];
    let previousTimestamp: number | null = null;

    const flush = () => {
      if (!segment.length) return;
      sessions.push(compileSession(segment));
      segment = [];
    };

    for (const event of ordered) {
      const timestamp = Date.parse(event.timestamp);
      const inactivityBreak =
        previousTimestamp !== null && timestamp - previousTimestamp > inactivityTimeoutMs;

      if (inactivityBreak || (event.event === "session_start" && segment.length > 0)) flush();

      segment.push(event);
      previousTimestamp = timestamp;

      if (event.event === "session_end") {
        flush();
        previousTimestamp = null;
      }
    }

    flush();
  }

  return sessions.sort((a, b) => Date.parse(a.started_at) - Date.parse(b.started_at));
}

function compileSession(events: readonly AnalyticsEventV1[]): AnalyticsSession {
  const first = events[0];
  const last = events[events.length - 1];
  const paths: string[] = [];

  for (const event of events) {
    if (paths[paths.length - 1] !== event.path) paths.push(event.path);
  }

  return {
    session_id: first.session_id!,
    domain: first.domain,
    app_id: first.app_id,
    environment: first.environment,
    started_at: first.timestamp,
    ended_at: last.timestamp,
    duration_ms: Math.max(0, Date.parse(last.timestamp) - Date.parse(first.timestamp)),
    event_count: events.length,
    page_view_count: events.filter((event) => event.event === "page_view").length,
    entry_path: first.path,
    exit_path: last.path,
    paths,
    explicit_start: events.some((event) => event.event === "session_start"),
    explicit_end: events.some((event) => event.event === "session_end"),
  };
}
