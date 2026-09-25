import "server-only";

import { db } from "@/lib/db";
import type { AnalyticsEventV1 } from "../contracts/event-v1";

export interface RawEventWriteResult {
  inserted: boolean;
}

export async function storeRawAnalyticsEvent(event: AnalyticsEventV1): Promise<RawEventWriteResult> {
  const sql = db();
  const rows = await sql<{ event_id: string }[]>`
    INSERT INTO analytics_raw_events (
      schema_version, event_id, occurred_at, source, domain, app_id, environment, path, session_id, event, data
    ) VALUES (
      ${event.schema_version}, ${event.event_id}, ${event.timestamp}, ${event.source}, ${event.domain},
      ${event.app_id}, ${event.environment}, ${event.path}, ${event.session_id ?? null}, ${event.event}, ${sql.json(event.data)}
    )
    ON CONFLICT (event_id) DO NOTHING
    RETURNING event_id
  `;
  return { inserted: rows.length === 1 };
}
