import { NextResponse } from "next/server";
import type { AnalyticsEventV1 } from "@/analytics/contracts/event-v1";
import { containsForbiddenAnalyticsData } from "@/analytics/privacy";
import { validateAnalyticsEvent } from "@/analytics/contracts/validator";
import { storeRawAnalyticsEvent } from "@/analytics/storage/raw-event-store";

const MAX_EVENTS = 50;
const MAX_BODY_BYTES = 128 * 1024;

export async function POST(request: Request) {
  const length = Number(request.headers.get("content-length") || "0");
  if (length > MAX_BODY_BYTES) return NextResponse.json({ accepted: 0, rejected: 0, error: "PAYLOAD_TOO_LARGE" }, { status: 413 });

  let body: unknown;
  try { body = await request.json(); }
  catch { return NextResponse.json({ accepted: 0, rejected: 0, error: "INVALID_JSON" }, { status: 400 }); }

  const events = Array.isArray(body) ? body : [body];
  if (events.length > MAX_EVENTS) return NextResponse.json({ accepted: 0, rejected: events.length, error: "BATCH_TOO_LARGE" }, { status: 413 });

  const validEvents: Array<{ index: number; event: AnalyticsEventV1 }> = [];
  const errors: Array<{ index: number; code: string; fields: string[] }> = [];

  events.forEach((event, index) => {
    if (containsForbiddenAnalyticsData(event)) { errors.push({ index, code: "PRIVACY_REJECTED", fields: ["data"] }); return; }
    const validation = validateAnalyticsEvent(event);
    if (!validation.valid) {
      errors.push({ index, code: "INVALID_EVENT", fields: [...new Set(validation.errors.map((error) => error.field))] });
      return;
    }
    validEvents.push({ index, event: validation.event });
  });

  let accepted = 0;
  let stored = 0;
  try {
    for (const item of validEvents) {
      const result = await storeRawAnalyticsEvent(item.event);
      accepted += 1;
      if (result.inserted) stored += 1;
    }
  } catch {
    return NextResponse.json({ accepted, stored, rejected: errors.length, error: "STORAGE_UNAVAILABLE", ...(errors.length ? { errors } : {}) }, { status: 503 });
  }

  return NextResponse.json({ accepted, stored, duplicates: accepted - stored, rejected: errors.length, ...(errors.length ? { errors } : {}) });
}
