# Layer Engine 1.0

Layer Engine is the common read-model boundary between analytical engines and future Query API/UI.

Available layers:
sessions, views, time, entries, exits, transitions, clicks, scroll, spatial, ai_feedback, errors, http_status, latency.

A caller requests only the layers it needs. The engine computes each underlying aggregate family at most once per request and projects the relevant data into stable layer-shaped results.

Layer Engine does not read the database, select environments, apply date filters or infer business meaning. Those responsibilities belong to Query API / Dynamic Discovery.

Time-series bucket granularity remains the responsibility of Time Aggregator; the "time" layer here exposes observed session/path duration metrics.

This keeps /insights independent from the internal implementation of Traffic, Interaction, AI and Technical engines.
