# Data Normalizer 1.0

The normalizer creates a clean analytical input set while leaving Raw Event Store untouched.

## Dedupe

event_id is the canonical duplicate key. Duplicate raw deliveries may exist conceptually, but only one event_id is admitted to normalized analytical input. The database unique constraint is a second storage-level guard.

## Bots / automation

The normalizer excludes only events explicitly marked bot=true or automation=true. It does not fingerprint users or guess bot identity from IP, User-Agent or behavioral profiling.

A future collector may set this technical marker using trusted infrastructure signals, but the engine must not infer identity.

## Anomalies

Events are excluded from normalized analytical input when their timestamp:
- is invalid,
- is more than 5 minutes in the future,
- is more than 366 days old.

These are data-quality rules, not fraud/user judgments.

## Viewports

Viewport width is classified into neutral analytical buckets:
- small: <768 px
- medium: 768-1279 px
- large: >=1280 px
- unknown: unavailable/invalid

The original dimensions remain unchanged in the accepted event.

## Environment isolation

production, preview and development are never merged implicitly. splitByEnvironment returns independent collections so later engines/query layers can keep customer traffic separate from internal testing.

Normalization does not mutate or delete Raw Event Store records.
