# Query API 1.0

GET /api/analytics/query

Required: domain, environment, from, to, layers (comma-separated).
Optional: app_id, path.

The period is [from, to): start inclusive and end exclusive.

The API reads Raw Event Store, applies exact scope/time filters, runs Data Normalizer, compiles sessions and returns requested Layer Engine projections.

environment is mandatory, preventing accidental mixing of production, preview and development.

This is a read boundary. Owner authorization for private /insights consumption is added with the private route/auth stage and must be enforced before production exposure.
