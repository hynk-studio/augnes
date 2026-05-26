# Codex Operator Review Packet Linked-Event Dogfood - 2026-05-26

## Summary
This report dogfoods structured `review_events` links in `codex:operator-review-packet`. The local fixtures represent two recent real review flows: PR #240, which added structured review-event links and hardened negated-resolution detection, and PR #238, which added the original operator review packet helper and tightened broad perspective predicates after review.

This is local dogfood review material. It is not a benchmark, not a score, not proof, not evidence, not authority for readiness decisions, and not a PR-quality evaluation tool.

The question under review is whether explicit `event_id` and `resolves_event_id` fields improve operator handoff and time-axis perspective preservation compared with order/text fallback.

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

## Dogfood samples
### Sample A - PR #240 linked-event schema hardening flow
Task summary: add structured review-event links to `codex:operator-review-packet`.

Actual review-flow shape: task opened, implementation completed, blocking review finding that negated resolution phrases like `not fixed` and `not addressed` could pass as resolved, follow-up commit tightening negated-resolution detection, verification completed, and operator decision to merge with a manual local-only follow-up.

Structured event IDs used: `pr240-task-opened`, `pr240-implementation-completed`, `pr240-negated-resolution-blocker`, `pr240-negated-resolution-fix`, `pr240-verification-completed`, and `pr240-operator-decision`.

Linked resolution shape: `pr240-negated-resolution-fix` sets `resolves_event_id` to `pr240-negated-resolution-blocker`.

Expected perspective observation: the linked follow-up resolved the referenced blocking finding, and the manual/no-actuation local-only decision remains visible because it is explicitly worded.

Packet output usefulness: useful. The packet preserved the exact correction without relying on the follow-up being the nearest event after the finding.

Packet output friction: mixed. The linked observation is precise, but authors must choose stable event IDs and avoid ambiguous result wording.

What linked events helped preserve: the exact blocking finding to exact follow-up resolution, the correction arc across review iterations, the verification step after the fix, and the manual local-only decision.

What linked events did not solve: they did not prove the code change, validate the review finding independently, or replace operator judgment about whether further dogfood is warranted.

### Sample B - PR #238 operator packet predicate hardening flow
Task summary: add `codex:operator-review-packet`.

Actual review-flow shape: task opened, implementation completed, blocking review finding that broad predicates overclaimed resolved follow-up/manual handoff, follow-up commit tightening predicates, verification completed, and operator decision to merge while dogfooding next with local-only review material.

Structured event IDs used: `pr238-task-opened`, `pr238-implementation-completed`, `pr238-predicate-blocker`, `pr238-predicate-fix`, `pr238-verification-completed`, and `pr238-operator-decision`.

Linked resolution shape: `pr238-predicate-fix` sets `resolves_event_id` to `pr238-predicate-blocker`.

Expected perspective observation: the linked follow-up resolved the referenced blocking finding, and the packet preserves the decision to dogfood before UI, sidecar, or actuation work.

Packet output usefulness: useful. The older review flow benefits from structured links, which suggests the value is not limited to PR #240.

Packet output friction: mixed. The packet still needs careful wording in the operator decision to keep dogfood-next material separate from execution authority.

What linked events helped preserve: predicate-hardening context, the reason dogfood stayed next, and the deferral of UI, sidecar, and actuation work.

What linked events did not solve: they did not make generic operator questions more specific, and they did not make `material_summary` more informative than presence-only.

Sample C was skipped to keep this report bounded. PR #215 remains a useful future fixture for command preview review flow coverage, but the two required samples already cover the new linked-event flow and a prior operator-packet flow.

## Cross-sample findings
Useful: structured links preserve the specific blocking finding and specific follow-up resolution more clearly than order/text fallback.

Mixed: event links improve precision, but they require author discipline around stable IDs, accurate `resolves_event_id` values, and unambiguous result text.

Confusing: missing optional materials still read as generic warnings even when absence is expected.

Too verbose: boundary language remains necessary but could become repetitive if many packets are viewed together.

Missing key info: the packet does not emit a separate structured resolution link list, so downstream consumers must parse timeline and observation text.

Not useful: the packet is not a code review substitute, posting permission, merge decision, or state transition.

## Linked-event usefulness observations
Exact blocking finding -> exact follow-up resolution: useful. `resolves_event_id` makes the intended correction explicit even when more than one blocking event appears in the timeline.

Correction arcs across review iterations: useful. The packet can show a blocking event, a later linked fix, verification, and operator decision as one review arc.

Local-only/no-actuation decision: mixed. The decision is preserved when explicitly worded, but event links do not infer that boundary by themselves.

Next-session onboarding context: useful. The linked observation gives a future operator a compact pointer to the review correction that mattered.

Distinction between review material and execution authority: useful when paired with explicit boundary language. Links alone do not grant authority or imply execution.

## Development feedback
- `event_id` on every event may be cleaner once links are adopted.
- `review_events.result` may need controlled enums.
- Output may need a structured `resolution_links` array.
- Linked observations are more precise than order fallback but require author discipline.
- `material_summary` still remains presence-only and may be too shallow.
- `operator_questions` may still be generic.
- Missing optional materials may need `expected_absent` vs `surprising_absent`.

## UI/UX implications
This report does not design a UI.

Structured links could become timeline connectors or relationship cards in a future review surface.

Linked events may reduce ambiguity in a future UI because the relationship between a blocking finding and its follow-up does not have to be inferred from nearby text.

Warning labels must not imply execution authority or readiness.

Command preview and preflight material should remain review-only surfaces.

## Sidecar e_t / perspective research implications
This report does not implement sidecar `e_t`.

Linked events may be better perspective signals than text predicates.

Structured resolution links could become candidate perspective observations.

Conservative false negatives may still be preferable to false positives.

Controlled enums may be needed before any durable perspective schema.

## Recommended next decision
Dogfood linked-event packets on one more real PR before schema/UI/research work.

If linked events remain clearly useful after that, consider a small v0.3 schema step such as a controlled `review_events.result` enum or structured `resolution_links` output.
