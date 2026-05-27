# Codex Operator Review Packet Result Enum Dogfood - 2026-05-27

## Summary
This report dogfoods the stricter `codex:operator-review-packet` schema after controlled `review_events.result` validation was added. The local fixtures represent two recent real review flows: PR #245, which added controlled result values, and PR #244, which added structured `resolution_links` output.

This is local dogfood review material. It is not benchmarking material, not scoring material, not proof, not evidence, not authority for readiness decisions, and not a PR evaluation tool.

The question under review is whether controlled result values, `event_id` / `resolves_event_id`, top-level `resolution_links`, linked summary labels, and perspective observations remain usable for real operator handoff without adding UI, sidecar `e_t`, actuation, provider calls, runtime mutation, or durable perspective state.

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
- no new `review_events.result` enum values
- no `resolution_links` shape change
- no durable perspective state

## Dogfood samples
### Sample A - PR #245 controlled result enum flow
Task summary: add controlled `review_events.result` validation to `codex:operator-review-packet`.

Actual review-flow shape: task opened, dogfood finding that `resolution_links` provide structure but free-form `review_events.result` remained ambiguous, implementation completed with result values now validated against the controlled enum, verification completed, and operator decision preserving manual/no-actuation handoff.

Event IDs used: `pr245-task-opened`, `pr245-result-enum-dogfood-finding`, `pr245-result-enum-implementation`, `pr245-verification-completed`, and `pr245-operator-decision`.

Controlled result values used: `opened`, `blocking`, `follow_up_resolved`, `verified`, and `manual_handoff_no_actuation`.

Linked resolution shape: `pr245-result-enum-implementation` sets `resolves_event_id` to `pr245-result-enum-dogfood-finding`. The expected structured link is `pr245-result-enum-implementation -> pr245-result-enum-dogfood-finding`.

Expected packet behavior: timeline order preserves all event IDs and enum result values; JSON output includes exactly one `resolution_links` entry for implementation -> dogfood finding; summary output exposes `event_id` and `resolves_event_id` labels; the compact `Resolution links` section appears; perspective observations mention the linked resolution; the manual/no-actuation decision is preserved because it is explicitly worded.

Packet output usefulness: useful. The packet shows the precise blocking finding, the exact follow-up resolution, and the local-only decision boundary without relying on free-form result strings.

Packet output friction: mixed. The packet remains verbose for short dogfood flows, and missing optional materials still appear as generic warnings even when expected for a local-only packet.

What the controlled result enum helped preserve: the exact blocking finding -> exact follow-up resolution arc, the `resolution_links` consistency check, and the manual/no-actuation boundary.

What the controlled result enum did not solve: it did not remove the need for stable event IDs, it did not make operator questions more specific, and it did not add richer material interpretation beyond presence-only summaries.

### Sample B - PR #244 resolution links flow under controlled result enum
Task summary: add structured `resolution_links` output to `codex:operator-review-packet`.

Actual review-flow shape: task opened, dogfood finding that linked-summary dogfood showed downstream consumers needed structured resolution links, implementation completed with operator packet output now including structured `resolution_links`, verification completed, and operator decision preserving manual/no-actuation handoff.

Event IDs used: `pr244-task-opened`, `pr244-resolution-links-finding`, `pr244-resolution-links-implementation`, `pr244-verification-completed`, and `pr244-operator-decision`.

Controlled result values used: `opened`, `blocking`, `follow_up_resolved`, `verified`, and `manual_handoff_no_actuation`.

Linked resolution shape: `pr244-resolution-links-implementation` sets `resolves_event_id` to `pr244-resolution-links-finding`. The expected structured link is `pr244-resolution-links-implementation -> pr244-resolution-links-finding`.

Expected packet behavior: controlled result values are accepted; JSON output includes a populated `resolution_links` array; summary output exposes the linked labels and compact resolution link; no legacy ad-hoc results are needed.

Packet output usefulness: useful. The older linked-output flow maps cleanly into the controlled enum without losing the finding-to-fix relationship.

Packet output friction: mixed. The enum reduced result ambiguity, but `material_summary` still does not distinguish expected-absent materials from surprising omissions.

What the controlled result enum helped preserve: the exact blocking finding -> exact implementation link, the local-only decision boundary, and next-session onboarding context.

What the controlled result enum did not solve: it did not decide whether missing optional materials matter, and it did not turn review material into execution authority.

Optional Sample C was skipped to keep this report bounded. PR #242 remains useful future material for linked-summary coverage, but Samples A and B cover the immediate post-#245 question: whether the new enum can represent the current and previous real operator-packet flows without adding new values.

## Cross-sample findings
Useful: controlled result values made blocking and resolution states easier to inspect than free-form result strings.

Useful: `resolution_links` and linked summary labels preserved exact finding-to-follow-up arcs across both samples.

Mixed: the packet remains readable for short timelines, but labels and warnings may become too verbose on larger handoffs.

Confusing: missing optional materials read as warnings even when their absence is expected for dogfood-only packets.

Missing key info: `material_summary` is still presence-only, so operators cannot tell whether material absence is expected or surprising from the packet alone.

Not useful: the packet does not replace operator judgment, code review, merge decisions, posting permission, or state transitions.

## Controlled-result usefulness observations
Exact blocking finding -> exact follow-up resolution: useful. `result=blocking` plus `resolves_event_id` and `result=follow_up_resolved` made the intended correction arc explicit.

`resolution_links` consistency: useful. The structured link and the summary link label matched across both samples.

Reduced ambiguity vs free-form result strings: useful. No sample needed legacy values such as `created`, `approved`, or `merged_manual_handoff`.

Local-only/no-actuation decision: useful when explicitly worded. The packet preserved the decision boundary without treating result labels as permission.

Next-session onboarding context: useful. Stable event IDs and compact resolution links give a future session a direct way to recover the review arc.

Distinction between review material and execution authority: useful when paired with boundary text. Enum labels are review-state labels, not permission or readiness labels.

## Development feedback
- Controlled result values reduce ambiguity in blocking and resolution interpretation.
- Producers must update legacy values such as `created`, `approved`, and `merged_manual_handoff`.
- The allowed enum may need future additions only if real dogfood reveals missing concepts.
- `event_id` author discipline still matters.
- `resolution_links` now provide downstream structure.
- `material_summary` remains presence-only and may be too shallow.
- `operator_questions` may still be generic.
- Missing optional materials may need `expected_absent` vs `surprising_absent`.

## UI/UX implications
This report does not design a UI.

Controlled result values may map to stable timeline badges later.

`resolution_links` may map to future timeline connectors.

Warning labels must not imply execution readiness.

Command preview and preflight material should remain review-only surfaces.

Enum labels should not be rendered as permission or readiness.

## Sidecar e_t / perspective research implications
This report does not implement sidecar `e_t`.

Controlled result values may be better perspective signals than free-form text.

`resolution_links` plus controlled result values may be candidate perspective observations.

Conservative false negatives remain preferable to false positives.

Durable perspective schema remains out of scope.

## Recommended next decision
Controlled results feel usable in these two real operator-packet flows. Pause schema tightening and dogfood the packet on a non-operator-packet feature PR before adding more local schema changes.

If producers struggle with enum values, add a small authoring guide or helper-side error hints before UI or research work.

If missing concepts appear, consider a narrow enum addition PR.

If packet output remains too noisy, tighten summary output before UI or sidecar `e_t`.
