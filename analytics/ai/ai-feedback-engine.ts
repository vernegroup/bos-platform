import type { AnalyticsEventV1 } from "../contracts/event-v1";

type AiFeedbackData = {
  intent?: string;
  reason?: string;
  result?: string;
  topic?: string;
};

export interface CountedValue {
  value: string;
  count: number;
}

export interface AiFeedbackPathSummary {
  path: string;
  feedback_events: number;
  intents: CountedValue[];
  reasons: CountedValue[];
  results: CountedValue[];
  topics: CountedValue[];
  unresolved: number;
}

export interface AiFeedbackSummary {
  feedback_events: number;
  unresolved: number;
  intents: CountedValue[];
  reasons: CountedValue[];
  results: CountedValue[];
  topics: CountedValue[];
  paths: AiFeedbackPathSummary[];
}

function increment(map: Map<string, number>, value: string | undefined) {
  if (!value) return;
  map.set(value, (map.get(value) ?? 0) + 1);
}

function ranked(map: Map<string, number>): CountedValue[] {
  return [...map.entries()]
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => b.count - a.count || a.value.localeCompare(b.value));
}

function createBucket() {
  return {
    feedback: 0,
    unresolved: 0,
    intents: new Map<string, number>(),
    reasons: new Map<string, number>(),
    results: new Map<string, number>(),
    topics: new Map<string, number>(),
  };
}

export function buildAiFeedbackSummary(events: readonly AnalyticsEventV1[]): AiFeedbackSummary {
  const total = createBucket();
  const paths = new Map<string, ReturnType<typeof createBucket>>();

  for (const event of events) {
    if (event.source !== "ai" || event.event !== "user_feedback") continue;

    const data = event.data as AiFeedbackData;
    total.feedback += 1;
    if (data.result === "unresolved") total.unresolved += 1;
    increment(total.intents, data.intent);
    increment(total.reasons, data.reason);
    increment(total.results, data.result);
    increment(total.topics, data.topic);

    let path = paths.get(event.path);
    if (!path) {
      path = createBucket();
      paths.set(event.path, path);
    }
    path.feedback += 1;
    if (data.result === "unresolved") path.unresolved += 1;
    increment(path.intents, data.intent);
    increment(path.reasons, data.reason);
    increment(path.results, data.result);
    increment(path.topics, data.topic);
  }

  return {
    feedback_events: total.feedback,
    unresolved: total.unresolved,
    intents: ranked(total.intents),
    reasons: ranked(total.reasons),
    results: ranked(total.results),
    topics: ranked(total.topics),
    paths: [...paths.entries()]
      .map(([path, bucket]) => ({
        path,
        feedback_events: bucket.feedback,
        intents: ranked(bucket.intents),
        reasons: ranked(bucket.reasons),
        results: ranked(bucket.results),
        topics: ranked(bucket.topics),
        unresolved: bucket.unresolved,
      }))
      .sort((a, b) => b.feedback_events - a.feedback_events || a.path.localeCompare(b.path)),
  };
}
