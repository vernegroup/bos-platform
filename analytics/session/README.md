# Session Engine 1.0

The Session Engine composes accepted raw events into analytical sessions. It never changes Raw Event Store.

## Identity boundary

A session is scoped by:
domain + app_id + environment + anonymous session_id

The engine does not use account, organization, email, IP address or browser fingerprint identity.

## Ordering and boundaries

Events are ordered by timestamp, then event_id for deterministic ties.

A session segment ends when:
1. an explicit session_end event occurs,
2. another session_start appears for the same session_id,
3. inactivity between consecutive events exceeds 30 minutes by default.

The inactivity threshold is configurable for tests and later engine tuning.

## Output

Each compiled session contains:
- start/end timestamps and duration
- event count
- page view count
- entry and exit path
- ordered unique path sequence
- whether explicit start/end signals were observed

Missing session_id events are intentionally ignored by this engine. They remain available to traffic/technical aggregation where appropriate.

No database materialization is introduced in AE-12. Session persistence/aggregation can be added after Raw Event Store and normalization are finalized.
