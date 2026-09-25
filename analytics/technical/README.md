# Technical Engine 1.0

Technical Engine aggregates technical telemetry without storing raw error messages.

Included events:
- frontend_error
- api_error
- http_status
- latency

Outputs:
- frontend/API error counts
- error type and privacy-safe fingerprint frequency
- HTTP status distribution
- route frequency
- latency samples grouped by operation
- average, min, max, p50 and p95 latency

Percentiles use nearest-rank over sorted observed samples. They describe the collected sample set only.

Raw stack traces, error messages, request/response bodies, authorization headers, query-string contents and user identity must never be introduced by this engine. Privacy enforcement remains upstream in the Privacy Layer.

The engine is domain-blind and does not decide whether a metric is acceptable. Thresholds, alerts and product interpretation belong to later layers.
