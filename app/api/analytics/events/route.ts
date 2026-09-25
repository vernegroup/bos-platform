import { NextResponse } from "next/server";
import { containsForbiddenAnalyticsData } from "@/analytics/privacy";
import { validateAnalyticsEvent } from "@/analytics/contracts/validator";

const MAX_EVENTS = 50;
const MAX_BODY_BYTES = 128 * 1024;

export async function POST(request: Request) {
  const length = Number(request.headers.get("content-length") || "0");
  if (length > MAX_BODY_BYTES) {
    return NextResponse.json({ accepted: 0, rejected: 0, error: "PAYLOAD_TOO_LARGE" }, { status: 413 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ accepted: 0, rejected: 0, error: "INVALID_JSON" }, { status: 400 });
  }

  const events = Array.isArray(body) ? body : [body];
  if (events.length > MAX_EVENTS) {
    return NextResponse.json({ accepted: 0, rejected: events.length, error: "BATCH_TOO_LARGE" }, { status: 413 });
  }

  let accepted = 0;
  const errors: Array<{ index: number; code: string; fields: string[] }> = [];

  events.forEach((event, index) => {
    if (containsForbiddenAnalyticsData(event)) {
      errors.push({ index, code: "PRIVACY_REJECTED", fields: ["data"] });
      return;
    }

    const validation = validateAnalyticsEvent(event);
    if (!validation.valid) {
      errors.push({
        index,
        code: "INVALID_EVENT",
        fields: [...new Set(validation.errors.map((error) => error.field))],
      });
      return;
    }

    // Persistence is introduced by AE-10. Until then accepted events are validated but not stored.
    accepted += 1;
  });

  return NextResponse.json({
    accepted,
    rejected: errors.length,
    ...(errors.length ? { errors } : {}),
  });
}
