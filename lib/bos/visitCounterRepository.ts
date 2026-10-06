import "server-only";

import { db } from "@/lib/db";

export type VisitCounts = {
  today: number;
  last7Days: number;
  last30Days: number;
  total: number;
};

export type DailyVisitCount = {
  day: string;
  visits: number;
};

export async function getVisitCounts(): Promise<VisitCounts> {
  const rows = await db().unsafe(`
    SELECT
      COUNT(DISTINCT session_id) FILTER (
        WHERE occurred_at >= date_trunc('day', now() AT TIME ZONE 'Europe/Warsaw') AT TIME ZONE 'Europe/Warsaw'
      )::int AS today,
      COUNT(DISTINCT session_id) FILTER (
        WHERE occurred_at >= now() - interval '7 days'
      )::int AS last_7_days,
      COUNT(DISTINCT session_id) FILTER (
        WHERE occurred_at >= now() - interval '30 days'
      )::int AS last_30_days,
      COUNT(DISTINCT session_id)::int AS total
    FROM analytics_raw_events
    WHERE event = 'session_start'
      AND source = 'browser'
      AND session_id IS NOT NULL
      AND btrim(session_id) <> ''
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
    visits AS (
      SELECT
        (occurred_at AT TIME ZONE 'Europe/Warsaw')::date AS day,
        COUNT(DISTINCT session_id)::int AS visits
      FROM analytics_raw_events
      WHERE event = 'session_start'
        AND source = 'browser'
        AND session_id IS NOT NULL
        AND btrim(session_id) <> ''
        AND occurred_at >= ((now() AT TIME ZONE 'Europe/Warsaw')::date - ($1::int - 1)) AT TIME ZONE 'Europe/Warsaw'
      GROUP BY 1
    )
    SELECT calendar.day, COALESCE(visits.visits, 0)::int AS visits
    FROM calendar
    LEFT JOIN visits USING(day)
    ORDER BY calendar.day
  `, [safeDays]);

  return rows.map((row) => ({
    day: row.day instanceof Date ? row.day.toISOString().slice(0, 10) : String(row.day).slice(0, 10),
    visits: Number(row.visits ?? 0),
  }));
}
