import type { AnalyticsEventV1 } from "../contracts/event-v1";

export type TimeGranularity = "minute" | "hour" | "day" | "week" | "month";

export interface TimeBucket {
  granularity: TimeGranularity;
  start: string;
  end: string;
  events: number;
  event_counts: Record<string, number>;
}

export interface TimeAggregation {
  minute: TimeBucket[];
  hour: TimeBucket[];
  day: TimeBucket[];
  week: TimeBucket[];
  month: TimeBucket[];
}

function floorUtc(date: Date, granularity: TimeGranularity): Date {
  const d = new Date(date.getTime());

  if (granularity === "month") {
    d.setUTCDate(1);
    d.setUTCHours(0, 0, 0, 0);
    return d;
  }

  if (granularity === "week") {
    d.setUTCHours(0, 0, 0, 0);
    const day = d.getUTCDay();
    const distanceFromMonday = (day + 6) % 7;
    d.setUTCDate(d.getUTCDate() - distanceFromMonday);
    return d;
  }

  if (granularity === "day") {
    d.setUTCHours(0, 0, 0, 0);
    return d;
  }

  if (granularity === "hour") {
    d.setUTCMinutes(0, 0, 0);
    return d;
  }

  d.setUTCSeconds(0, 0);
  return d;
}

function nextUtc(start: Date, granularity: TimeGranularity): Date {
  const d = new Date(start.getTime());
  if (granularity === "minute") d.setUTCMinutes(d.getUTCMinutes() + 1);
  else if (granularity === "hour") d.setUTCHours(d.getUTCHours() + 1);
  else if (granularity === "day") d.setUTCDate(d.getUTCDate() + 1);
  else if (granularity === "week") d.setUTCDate(d.getUTCDate() + 7);
  else d.setUTCMonth(d.getUTCMonth() + 1);
  return d;
}

export function aggregateEventsByTime(
  events: readonly AnalyticsEventV1[],
  granularity: TimeGranularity,
): TimeBucket[] {
  const buckets = new Map<string, { start: Date; events: number; eventCounts: Record<string, number> }>();

  for (const event of events) {
    const timestamp = new Date(event.timestamp);
    if (!Number.isFinite(timestamp.getTime())) continue;

    const start = floorUtc(timestamp, granularity);
    const key = start.toISOString();
    let bucket = buckets.get(key);

    if (!bucket) {
      bucket = { start, events: 0, eventCounts: {} };
      buckets.set(key, bucket);
    }

    bucket.events += 1;
    bucket.eventCounts[event.event] = (bucket.eventCounts[event.event] ?? 0) + 1;
  }

  return [...buckets.values()]
    .sort((a, b) => a.start.getTime() - b.start.getTime())
    .map((bucket) => ({
      granularity,
      start: bucket.start.toISOString(),
      end: nextUtc(bucket.start, granularity).toISOString(),
      events: bucket.events,
      event_counts: bucket.eventCounts,
    }));
}

export function buildTimeAggregation(events: readonly AnalyticsEventV1[]): TimeAggregation {
  return {
    minute: aggregateEventsByTime(events, "minute"),
    hour: aggregateEventsByTime(events, "hour"),
    day: aggregateEventsByTime(events, "day"),
    week: aggregateEventsByTime(events, "week"),
    month: aggregateEventsByTime(events, "month"),
  };
}
