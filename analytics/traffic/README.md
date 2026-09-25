# Traffic Engine 1.0

Traffic Engine converts validated events and Session Engine output into neutral traffic aggregates.

Metrics:
- page views
- session count
- total and average observed session duration
- entry/exit counts per path
- observed time per path
- path-to-path transitions

"Observed time" is deliberately named. It is the interval between consecutive events and must not be interpreted as verified human attention. Gaps above 30 minutes are excluded from per-path observed time.

Transitions are derived from the ordered path sequence of a session. Consecutive duplicate paths do not create transitions.

The engine is domain-blind. It does not know product names, funnels, onboarding stages, conversions or business meaning. Those interpretations belong to later layers/UI.

Traffic Engine does not write to Raw Event Store and does not identify users.
