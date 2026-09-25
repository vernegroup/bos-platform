# AI Feedback Engine 1.0

AI Feedback Engine aggregates only structured semantic telemetry emitted after a user voluntarily initiates an AI interaction.

Accepted analytical dimensions:
- intent
- reason
- result
- topic
- path

It does not receive or reconstruct:
- user prompts
- assistant responses
- conversation summaries
- names or account identity
- arbitrary extracted facts from conversation

The engine counts feedback globally and per path and exposes ranked distributions plus unresolved counts.

Example interpretation available to a later UI:
topic=standard_editor, intent=confusion, reason=unclear, result=unresolved

The engine itself does not conclude that a feature is bad, broken or should be changed. It reports structured observations only.

Only events with source=ai and event=user_feedback are included. Other AI-originated events are ignored by this engine.

This separation keeps AI as a semantic sensor, not an observer or autonomous product decision-maker.
