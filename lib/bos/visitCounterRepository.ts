import "server-only";

import { db } from "@/lib/db";

export type VisitCounts = {
  today: number;
  last7Days: number;
  last30Days: number;
  total: number;
};

export type DailyVisitCount = { day: string; visits: number };
export type AnalyticsSummary = {
  pageViews30Days: number;
  clicks30Days: number;
  activePaths30Days: number;
  maxScrollDepth30Days: number;
  topPaths: { path: string; views: number; sessions: number }[];
  eventMix: { event: string; count: number }[];
};

const browserSession = `source = 'browser' AND session_id IS NOT NULL AND btrim(session_id) <> ''`;

export async function getVisitCounts(): Promise<VisitCounts> {
  const rows = await db().unsafe(`
    SELECT
      COUNT(DISTINCT session_id) FILTER (
        WHERE occurred_at >= date_trunc('day', now() AT TIME ZONE 'Europe/Warsaw') AT TIME ZONE 'Europe/Warsaw'
      )::int AS today,
      COUNT(DISTINCT session_id) FILTER (WHERE occurred_at >= now() - interval '7 days')::int AS last_7_days,
      COUNT(DISTINCT session_id) FILTER (WHERE occurred_at >= now() - interval '30 days')::int AS last_30_days,
      COUNT(DISTINCT session_id)::int AS total
    FROM analytics_raw_events
    WHERE event = 'session_start' AND ${browserSession}
  `);

  return {
    today: Number(rows[0]?.today ?? 0),
    last7Days: Number(rows[0]?.last_7_days ?? 0),
    last30Days: Number(rows[0]?.last_30_days ?? 0),
    total: Number(rows[0]?.total ?? 0),
  };
}

export async function getDailyVisitCounts(days = 14): Promise<DailyVisitCount[]> {
  const safeDays = Math.min(Math.max(Math.trunc(days), 1), 90);
  const rows = await db().unsafe(`
    WITH calendar AS (
      SELECT generate_series(
        (now() AT TIME ZONE 'Europe/Warsaw')::date - ($1::int - 1),
        (now() AT TIME ZONE 'Europe/Warsaw')::date,
        interval '1 day'
      )::date AS day
    ),
    first_sessions AS (
      SELECT session_id, min(occurred_at) AS first_at
      FROM analytics_raw_events
      WHERE event = 'session_start' AND ${browserSession}
      GROUP BY session_id
    ),
    visits AS (
      SELECT (first_at AT TIME ZONE 'Europe/Warsaw')::date AS day, COUNT(*)::int AS visits
      FROM first_sessions
      WHERE first_at >= ((now() AT TIME ZONE 'Europe/Warsaw')::date - ($1::int - 1)) AT TIME ZONE 'Europe/Warsaw'
      GROUP BY 1
    )
    SELECT calendar.day, COALESCE(visits.visits, 0)::int AS visits
    FROM calendar LEFT JOIN visits USING(day)
    ORDER BY calendar.day
  `, [safeDays]);

  return rows.map((row) => ({
    day: row.day instanceof Date ? row.day.toISOString().slice(0, 10) : String(row.day).slice(0, 10),
    visits: Number(row.visits ?? 0),
  }));
}

export async function getAnalyticsSummary(): Promise<AnalyticsSummary> {
  const sql = db();
  const [totals, paths, events] = await Promise.all([
    sql.unsafe(`
      SELECT
        COUNT(*) FILTER (WHERE event='page_view')::int AS page_views,
        COUNT(*) FILTER (WHERE event='click')::int AS clicks,
        COUNT(DISTINCT path) FILTER (WHERE event='page_view')::int AS active_paths,
        COALESCE(MAX(CASE WHEN event='scroll' THEN (data->>'depth')::numeric END),0)::float AS max_scroll
      FROM analytics_raw_events
      WHERE source='browser' AND occurred_at >= now() - interval '30 days'
    `),
    sql.unsafe(`
      SELECT path, COUNT(*)::int AS views, COUNT(DISTINCT session_id)::int AS sessions
      FROM analytics_raw_events
      WHERE source='browser' AND event='page_view' AND occurred_at >= now() - interval '30 days'
      GROUP BY path ORDER BY views DESC, path ASC LIMIT 8
    `),
    sql.unsafe(`
      SELECT event, COUNT(*)::int AS count
      FROM analytics_raw_events
      WHERE source='browser' AND occurred_at >= now() - interval '30 days'
      GROUP BY event ORDER BY count DESC, event ASC
    `),
  ]);

  return {
    pageViews30Days: Number(totals[0]?.page_views ?? 0),
    clicks30Days: Number(totals[0]?.clicks ?? 0),
    activePaths30Days: Number(totals[0]?.active_paths ?? 0),
    maxScrollDepth30Days: Number(totals[0]?.max_scroll ?? 0),
    topPaths: paths.map((row) => ({ path: String(row.path), views: Number(row.views ?? 0), sessions: Number(row.sessions ?? 0) })),
    eventMix: events.map((row) => ({ event: String(row.event), count: Number(row.count ?? 0) })),
  };
}
