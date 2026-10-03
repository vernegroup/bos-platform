import "server-only";

import { db } from "@/lib/db";

export type VisitCounts = {
  today: number;
  last7Days: number;
  total: number;
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
    total: Number(rows[0]?.total ?? 0),
  };
}
