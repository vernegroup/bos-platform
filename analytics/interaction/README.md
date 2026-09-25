# Interaction Engine 1.0

Interaction Engine aggregates click and scroll telemetry without reconstructing user sessions visually.

Outputs per path:
- click count
- scroll event count
- average and maximum observed scroll depth
- interactions per anonymous session
- click counts by explicit analytics element identifier/type
- normalized spatial click buckets

Spatial aggregation uses a configurable normalized grid (20x20 by default). Raw coordinates remain in Raw Event Store; the engine emits bucket coordinates rather than screenshots or DOM reconstruction.

The engine does not collect:
- element text
- form values
- CSS selectors
- screenshots/session replay
- names/account identity

"Interactions per session" counts click + valid scroll events divided by anonymous sessions that generated interaction events on that path. It is not a measure of engagement quality.

The engine is domain-blind and assigns no business meaning to an element or path.
