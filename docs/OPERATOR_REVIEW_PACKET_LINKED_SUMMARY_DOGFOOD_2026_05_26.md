# Codex Operator Review Packet Linked Summary Dogfood - 2026-05-26

## Summary
This report dogfoods the updated `codex:operator-review-packet` human-readable summary rendering for linked `review_events` IDs. The local fixtures represent two recent real review flows: PR #242, which made summary timeline rows show `event_id` and `resolves_event_id`, and PR #240, which added structured review-event links and hardened negated-resolution detection.

This is local dogfood review material. It is not a benchmark, not a score, not proof, not evidence, not authority for readiness decisions, and not a PR-quality evaluation tool.

The question under review is whether summary-visible `event_id` and `resolves_event_id` labels improve operator handoff and next-session review continuity without adding a new top-level `resolution_links` field or changing JSON output shape.

## Scope boundary
This dogfood report and smoke use explicit local JSON fixtures only.

Confirmed out of scope:
- no GitHub call
- no OpenAI/provider call
- no Augnes runtime route call
- no Cockpit UI change
- no sidecar `e_t` implementation
- no posting
- no review creation
- no approval
- no merge automation
- no publication
- no evidence/proof creation
- no Augnes mutation
- no state commit/reject
- no top-level `resolution_links` implementation
- no controlled `review_events.result` enum implementation

## Dogfood samples
### Sample A - PR #242 linked-summary readability flow
Task summary: render linked event IDs in operator packet summaries.

Actual review-flow shape: task opened, dogfood finding that linked IDs were useful but not visible in human-readable summary output, implementation completed with summary rendering now showing `event_id` and `resolves_event_id` when present, verification completed, and operator decision to merge with a manual local-only follow-up.

Structured event IDs used: `pr242-task-opened`, `pr242-linked-summary-finding`, `pr242-summary-rendering-implementation`, `pr242-verification-completed`, and `pr242-operator-decision`.

Linked resolution shape: `pr242-summary-rendering-implementation` sets `resolves_event_id` to `pr242-linked-summary-finding`.

Expected summary visibility: the timeline summary includes the finding `event_id`, and the implementation timeline row includes both its own `event_id` and `resolves_event_id`. The correction arc is visible in summary text without opening JSON.

Expected perspective observation: the linked implementation resolved the referenced dogfood finding, and the manual/no-actuation local-only decision remains preserved because it is explicitly worded.

Packet output usefulness: useful. The summary gives a future operator enough context to see which finding the implementation corrected before inspecting JSON.

Packet output friction: mixed. The summary still depends on stable author-chosen event IDs and clear wording in the resolving event.

What summary link labels helped preserve: the exact dogfood finding to exact implementation relationship, the correction arc across the review iteration, and the local-only decision boundary.

What summary link labels did not solve: they did not add downstream structure for consumers, validate the implementation independently, or make generic operator questions more specific.

### Sample B - PR #240 linked-event schema hardening flow using updated summary
Task summary: add structured review-event links to `codex:operator-review-packet`.

Actual review-flow shape: task opened, implementation completed, blocking review finding that negated resolution phrases like `not fixed` and `not addressed` could pass as resolved, follow-up commit tightening negated-resolution detection, verification completed, and operator decision to merge with a manual local-only follow-up.

Structured event IDs used: `pr240-task-opened`, `pr240-implementation-completed`, `pr240-negated-resolution-blocker`, `pr240-negated-resolution-fix`, `pr240-verification-completed`, and `pr240-operator-decision`.

Linked resolution shape: `pr240-negated-resolution-fix` sets `resolves_event_id` to `pr240-negated-resolution-blocker`.

Expected summary visibility: summary timeline labels expose `event_id` on every row and `resolves_event_id` on the linked follow-up row. The blocking finding to follow-up relationship can be scanned from summary output.

Expected perspective observation: the linked follow-up resolved the referenced blocking finding, and the manual/no-actuation local-only decision remains preserved because it is explicitly worded.

Packet output usefulness: useful. A prior correction flow benefits from the updated summary formatting, so the value is not limited to PR #242.

Packet output friction: mixed. The negated-resolution story remains easy to misread if the result wording is unconstrained.

What summary link labels helped preserve: the exact blocking finding to exact follow-up resolution, the reason the follow-up mattered, and the local review-only boundary.

What summary link labels did not solve: they did not remove ambiguity from free-form `result` strings, and they did not emit a separate structured relationship list.

Optional Sample C was skipped to keep this PR bounded. PR #238 remains useful future material for predicate-hardening coverage, but adding it here would make the report longer without changing the immediate decision between structured `resolution_links`, controlled result values, or tighter summary output.

## Cross-sample findings
Useful: summary-visible links preserve the specific finding and specific follow-up more clearly than summary text without labels.

Mixed: event links improve scanability, but they require author discipline around stable IDs, accurate `resolves_event_id` values, and unambiguous follow-up wording.

Confusing: missing optional materials still read as generic warnings even when absence is expected for a local-only dogfood packet.

Too verbose: labels are useful in short timelines, but repeated labels on every row could become noisy in larger packets.

Missing key info: the packet still does not emit a structured `resolution_links` array, so downstream consumers must inspect timeline entries and observations.

Not useful: the summary labels do not replace code review, operator judgment, posting permission, merge decisions, or state transitions.

## Linked-summary usefulness observations
Exact blocking finding -> exact follow-up resolution: useful. `resolves_event_id` in the summary makes the intended correction visible without relying on event proximity.

Correction arcs across review iterations: useful. A future operator can scan the finding, linked implementation or follow-up, verification, and operator decision as one review arc.

Local-only/no-actuation decision: mixed. The decision is preserved when explicitly worded, but summary-visible links do not infer this boundary by themselves.

Next-session onboarding context: useful. The linked summary labels give the next session a compact pointer to the review correction that mattered.

Distinction between review material and execution authority: useful when paired with explicit boundary language. Labels alone do not grant authority or imply execution.

Summary text may be enough for human handoff, but downstream consumers may still need a structured `resolution_links` output later if they should avoid parsing timeline text.

## Development feedback
- Summary-visible event labels make links easier to scan.
- `event_id` author discipline remains a friction point.
- `review_events.result` may need controlled enums.
- Output may still need a structured `resolution_links` array.
- `material_summary` remains presence-only and may be too shallow.
- `operator_questions` may still be generic.
- Missing optional materials may need `expected_absent` vs `surprising_absent`.

## UI/UX implications
This report does not design a UI.

Event ID and resolving-event summary labels may map to future timeline connectors.

Linked labels help humans scan relationships without opening JSON.

Too many labels could become noisy in a UI.

Warning labels must not imply authority to execute.

Command preview and preflight material should remain review-only surfaces.

## Sidecar e_t / perspective research implications
This report does not implement sidecar `e_t`.

Summary-visible linked events may be better candidate perspective signals than text predicates alone.

Structured resolution links may deserve durable representation later.

Controlled enums may be needed before any durable perspective schema.

Conservative false negatives remain preferable to false positives.

## Recommended next decision
If summary-visible links are useful but downstream consumers still need structure, consider a small v0.3 schema step for structured `resolution_links` output.

If ambiguity remains mostly in result wording, consider controlled `review_events.result` enums first.

If the packet is still noisy, tighten summary output before schema/UI/research work.
