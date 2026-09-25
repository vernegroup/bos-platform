export type RealtimeEvent = {
  type: string;
  event_id?: string;
  [key: string]: unknown;
};

export type RealtimeEventDirection = "client" | "server";

export type RealtimeEventEnvelope = {
  direction: RealtimeEventDirection;
  event: RealtimeEvent;
  receivedAt: number;
};

export function parseRealtimeEvent(raw: string): RealtimeEvent | null {
  try {
    const value = JSON.parse(raw) as unknown;
    if (!value || typeof value !== "object" || Array.isArray(value)) return null;
    const event = value as Record<string, unknown>;
    if (typeof event.type !== "string" || !event.type) return null;
    return event as RealtimeEvent;
  } catch {
    return null;
  }
}
