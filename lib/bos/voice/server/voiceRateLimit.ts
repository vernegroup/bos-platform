type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();
const WINDOW_MS = 60_000;
const MAX_REQUESTS = 8;

export type VoiceRateLimitResult = {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
  retryAfterSeconds: number;
};

export function checkVoiceSessionRateLimit(key: string, now = Date.now()): VoiceRateLimitResult {
  const existing = buckets.get(key);
  const bucket = !existing || existing.resetAt <= now ? { count: 0, resetAt: now + WINDOW_MS } : existing;
  bucket.count += 1;
  buckets.set(key, bucket);

  if (buckets.size > 1000) {
    for (const [id, value] of buckets) if (value.resetAt <= now) buckets.delete(id);
  }

  const allowed = bucket.count <= MAX_REQUESTS;
  return {
    allowed,
    limit: MAX_REQUESTS,
    remaining: Math.max(0, MAX_REQUESTS - bucket.count),
    resetAt: bucket.resetAt,
    retryAfterSeconds: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
  };
}

export function voiceRateLimitHeaders(result: VoiceRateLimitResult) {
  return {
    "X-RateLimit-Limit": String(result.limit),
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(Math.ceil(result.resetAt / 1000)),
  };
}
