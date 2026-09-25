import type { AnalyticsEventV1 } from "../contracts/event-v1";
import type { AnalyticsSession } from "../session/session-engine";

export interface PathTraffic {
  path: string;
  page_views: number;
  entries: number;
  exits: number;
  observed_time_ms: number;
}

export interface TrafficTransition {
  from: string;
  to: string;
  count: number;
}

export interface TrafficSummary {
  page_views: number;
  sessions: number;
  total_observed_session_time_ms: number;
  average_observed_session_time_ms: number;
  paths: PathTraffic[];
  transitions: TrafficTransition[];
}

export function buildTrafficSummary(
  events: readonly AnalyticsEventV1[],
  sessions: readonly AnalyticsSession[],
): TrafficSummary {
  const pageViews = events.filter((event) => event.event === "page_view");
  const pathMap = new Map<string, PathTraffic>();
  const transitionMap = new Map<string, TrafficTransition>();

  const pathRow = (path: string): PathTraffic => {
    let row = pathMap.get(path);
    if (!row) {
      row = { path, page_views: 0, entries: 0, exits: 0, observed_time_ms: 0 };
      pathMap.set(path, row);
    }
    return row;
  };

  for (const event of pageViews) pathRow(event.path).page_views += 1;

  for (const session of sessions) {
    pathRow(session.entry_path).entries += 1;
    pathRow(session.exit_path).exits += 1;

    for (let i = 0; i < session.paths.length - 1; i += 1) {
      const from = session.paths[i];
      const to = session.paths[i + 1];
      if (from === to) continue;
      const key = from + "\u001f" + to;
      const existing = transitionMap.get(key);
      if (existing) existing.count += 1;
      else transitionMap.set(key, { from, to, count: 1 });
    }
  }

  const scopedEvents = [...events]
    .filter((event) => event.session_id)
    .sort((a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp));

  const bySession = new Map<string, AnalyticsEventV1[]>();
  for (const event of scopedEvents) {
    const key = [event.domain, event.app_id, event.environment, event.session_id].join("\u001f");
    const group = bySession.get(key);
    if (group) group.push(event);
    else bySession.set(key, [event]);
  }

  for (const group of bySession.values()) {
    for (let i = 0; i < group.length - 1; i += 1) {
      const current = group[i];
      const next = group[i + 1];
      const delta = Date.parse(next.timestamp) - Date.parse(current.timestamp);
      if (delta >= 0 && delta <= 30 * 60 * 1000) pathRow(current.path).observed_time_ms += delta;
    }
  }

  const totalTime = sessions.reduce((sum, session) => sum + session.duration_ms, 0);

  return {
    page_views: pageViews.length,
    sessions: sessions.length,
    total_observed_session_time_ms: totalTime,
    average_observed_session_time_ms: sessions.length ? Math.round(totalTime / sessions.length) : 0,
    paths: [...pathMap.values()].sort((a, b) => b.page_views - a.page_views || a.path.localeCompare(b.path)),
    transitions: [...transitionMap.values()].sort((a, b) => b.count - a.count || a.from.localeCompare(b.from)),
  };
}
