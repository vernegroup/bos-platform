# AE-22 Synthetic Data Test

Deterministic fixture: example.test / synthetic-app / preview.

Scenario:
- one 60-second session
- /a -> /b
- 2 page views
- 1 click with spatial coordinates
- 1 scroll at 50%
- 1 unresolved AI feedback event
- 1 frontend error
- HTTP 500
- one 240 ms latency sample

Assertions cover Normalizer, Session, Traffic, Interaction, AI Feedback, Technical, Time Aggregator and Layer Engine.

The fixture contains no production/customer data and performs no database writes.
