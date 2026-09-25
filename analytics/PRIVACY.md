# Analytics Privacy Layer 1.0

Privacy is enforced before schema validation and before persistence.

## Never accepted

Analytics events must not contain:
- form field values or serialized form data
- passwords, passcodes, secrets, API/access/refresh/ID tokens
- Authorization or Cookie headers
- AI prompts, assistant responses, chat messages, transcripts or conversation content
- clipboard content
- names, email addresses, phone numbers, postal addresses, NIP or PESEL
- DOM innerText/textContent or arbitrary input values

The layer rejects the whole event instead of silently sanitizing it. This preserves the rule that Raw Event Store contains exactly the valid event received, not a modified approximation.

## Allowed identifiers

Only analytics-specific technical identifiers are allowed, such as event_id, anonymous session_id, app_id and explicit data-analytics-id element identifiers.

## Data minimization

Do not add account IDs, organization IDs, IP addresses, user-agent strings or fingerprinting identifiers merely because they are technically available. Device/viewport information must be limited to what is required by the analytics contract.

## Pipeline

source -> Collector API -> Privacy Layer -> Schema Validator -> Raw Event Store

A privacy rejection never reaches analytics_raw_events.
