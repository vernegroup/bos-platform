# Time Aggregator 1.0

Time Aggregator creates deterministic UTC buckets for:
- minute
- hour
- day
- ISO-style week starting Monday
- calendar month

Each bucket contains:
- inclusive start timestamp
- exclusive end timestamp
- total event count
- counts by event type

All boundaries are calculated in UTC. This avoids mixing browser locale, deployment region and daylight-saving changes inside the analytics engine. A later presentation layer may render bucket labels in a selected local timezone without changing stored/aggregated facts.

The aggregator does not fill empty periods with synthetic zero buckets. Query/UI layers may do that when a continuous chart axis is required.

Input should normally come from Data Normalizer after environment separation. Therefore production, preview and development are not implicitly mixed by this component.

The aggregator is domain-blind and performs no business interpretation.
