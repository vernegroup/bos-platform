# AI Telemetry Contract 1.0

The AI is a semantic sensor, not a behavioral observer.

Emit a user_feedback analytics event only after a user voluntarily initiates an AI interaction that can be classified.

Never include:
- user prompt or assistant response
- conversation summaries
- names, email addresses, organization data or other PII
- passwords, tokens or form values
- behavioral claims inferred from click/scroll telemetry

Required event:
- schema_version: 1.0
- source: ai
- event: user_feedback
- domain, app_id, environment, path
- event_id and timestamp
- optional anonymous session_id
- data.classification.intent
- data.classification.reason
- data.classification.result
- data.classification.topic

Use only contract enums for intent, reason and result.
topic must be a short technical category, never a quotation or summary of user text.
When uncertain use other/unknown rather than guessing.

The AI never writes directly to analytics storage. Output flows through the Collector API, Privacy Gate and Schema Validator.
