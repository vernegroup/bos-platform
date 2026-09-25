# Dynamic Discovery 1.0

GET /api/analytics/discovery

Discovery derives filter options from events already present in Raw Event Store. No BOS application names or paths are hardcoded.

Required:
- domain

Optional scope:
- app_id
- environment
- from
- to

Returns:
- discovered app_id values
- discovered environments
- discovered paths
- layers for which relevant event families exist

A newly instrumented application or route therefore becomes discoverable without changing the analytics engine.

Layer availability is capability discovery, not a statement that a layer contains meaningful volume. Query API remains responsible for returning actual aggregates.

Owner authorization is added with the private /insights/auth stage before production exposure.
