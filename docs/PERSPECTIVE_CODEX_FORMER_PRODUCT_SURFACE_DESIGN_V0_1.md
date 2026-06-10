# Perspective Codex Former Product Surface Design v0.1

## Purpose

This design defines the first product-surface direction for Codex Former capture
review after the manual workflow closeout from PR #497. It follows the
separate-session provenance-clean path confirmed in PR #492, the manual workflow
docs from PR #493, the operator helper from PR #494, the parameterized source
input and extraction hardening from PR #495, the source-input validation and
template hardening from PR #496, and the product-surface entry criteria from
PR #497.

This PR is design-only. It does not create accepted Augnes state,
proof/evidence/readiness records, provider/model calls, Codex SDK calls, DB
writes, GitHub mutations, UI implementation, clipboard automation, approvals,
merges, deploys, or Core decisions.

## Product Thesis

Codex performs work, Augnes captures and validates the perspective candidate
produced by that work, and the constellation UI shows how the candidate relates
to work, source input, validation, warnings, and next actions.

The product surface should make formation inspectable without making review
material look accepted. A user should understand what Codex returned, why it is
or is not candidate-compatible, what warnings remain, and what future action is
safe to consider.

## User-Facing Surfaces

### A. Codex Session Perspective Panel

Purpose:

- let the user see perspective formation while working with Codex;
- show source input status, prepare status, returned candidate status,
  validation status, and next recommended action;
- keep the result visibly review-only and non-committed;
- avoid implying that Codex or Augnes has accepted the candidate as state.

This panel is a future UI concept only. It should not call Codex, call a
provider/model, write DB state, record proof/evidence/readiness, automate
clipboard use, or create accepted Augnes state.

### B. Capture Review Inbox

Purpose:

- collect validated, blocked, and needs_review perspective candidates for human
  review;
- let the user inspect source, provenance, validation result, warnings, and
  authority boundary;
- preserve review-only status until a separate future review decision layer is
  explicitly designed and implemented.

This inbox does not implement promote, accept, approve, publish, merge, deploy,
retry, replay, or Core decision actions in this PR.

### C. Constellation Preview

Purpose:

- map candidate-related objects into a node/edge graph;
- show work, source input, prompt/manual packet, Codex session, candidate
  draft, validation summary, warning, worker guidance, and next action
  relationships;
- keep authority boundaries visible without overwhelming the user.

The preview should help users understand relationships first, then inspect
authority and caveats through progressive disclosure.

## Node Model

Each node should carry:

- `id`
- `type`
- `title`
- `status`
- `authority`
- `primary_badges`
- `warning_count`
- `source_refs` or `provenance_refs` where relevant

First-pass node taxonomy:

| Type | Purpose | Typical Status | Typical Authority | Source Or Provenance Refs |
| --- | --- | --- | --- | --- |
| `work` | Bounded repo work or PR slice that produced source material. | `raw`, `prepared`, `review_only` | `pointer_only`, `review_only` | Work id, PR refs, changed files. |
| `source_input` | Bounded local source input supplied to prepare mode. | `raw`, `prepared`, `blocked` | `non_committed`, `blocked` | Source input path/hash and source scope. |
| `manual_copy_packet` | Manual Codex Former copy packet prepared for human paste. | `prepared` | `review_only`, `pointer_only` | Packet id, former input packet id, prompt hash. |
| `codex_session` | Separate user-started Codex session where the prompt is pasted by a human. | `returned`, `review_only` | `review_only`, `non_committed` | Surface label and capture metadata. |
| `candidate_draft` | Returned CodexPerspectiveCandidateDraft material. | `returned`, `needs_review`, `blocked` | `non_committed`, `blocked` | Returned envelope refs and candidate count. |
| `validation_summary` | Local validation, caveat, and normalization summary. | `validated`, `needs_review`, `blocked` | `review_only`, `blocked` | Summary output path/hash when available. |
| `review_candidate` | Candidate-compatible review object after validation allows review use. | `review_only`, `needs_review` | `review_only`, `non_committed` | Candidate id and validation refs. |
| `warning` | Pointer, provenance, unsafe-source, or basis-quality caveat. | `needs_review`, `blocked` | `advisory_only`, `blocked` | Warning ids and affected refs. |
| `worker_guidance` | Worker-Facing Guidance produced after direct validation allows it. | `review_only`, `needs_review` | `advisory_only` | Guidance refs and originating candidate refs. |
| `next_action` | Suggested safe next step for the operator or future implementation. | `review_only`, `needs_review`, `blocked` | `advisory_only`, `pointer_only` | Action label and related node refs. |

Suggested statuses:

- `raw`
- `prepared`
- `returned`
- `validated`
- `needs_review`
- `blocked`
- `review_only`
- `accepted` only as a future state, not used by the current workflow

Suggested authority values:

- `review_only`
- `non_committed`
- `advisory_only`
- `pointer_only`
- `blocked`
- `accepted` only as a future state, not used by the current workflow

## Edge Model

Each edge should carry:

- `from`
- `to`
- `relation`
- `status`
- `authority_boundary`
- `warning_count` when relevant

First-pass edge taxonomy:

| Relation | Meaning | Typical Status | Authority Boundary |
| --- | --- | --- | --- |
| `prepared` | Source input or work material was converted into a manual packet. | `prepared` | `review_only`, `non_committed` |
| `pasted_by_human` | Human moved the copyable prompt into a separate Codex session. | `review_only` | `pointer_only`, `non_committed` |
| `returned` | Codex returned bounded candidate material to the envelope. | `returned` | `review_only`, `non_committed` |
| `validated` | Local validation evaluated the returned candidate. | `validated`, `needs_review`, `blocked` | `review_only`, `blocked` |
| `informs` | One node provides context for another without committing it. | `review_only` | `pointer_only`, `advisory_only` |
| `suggests` | Guidance or next action is suggested, not decided. | `review_only`, `needs_review` | `advisory_only` |
| `pointer_only` | Relationship is a reference, not embedded source material. | `review_only`, `needs_review` | `pointer_only` |
| `blocked_by` | A validation, provenance, or unsafe-source problem blocks downstream review use. | `blocked` | `blocked` |

## Display Density Policy

The UI must not show every authority flag as full text on every node and edge by
default. That would scare users and create visual trash. The product surface
should use progressive disclosure so normal review work stays readable and
expert safety inspection remains available.

Three-level disclosure model:

- default view: compact node label, status, and at most two badges;
- hover/focus view: short validation and caveat summary;
- detail drawer: full provenance, hashes, authority flags, warnings, candidate
  count, and validation result.

Badge rules:

- show at most two badges by default;
- prefer `review-only`, `needs_review`, `blocked`, `pointer_warning`, and
  `provenance_mismatch`;
- do not show long negative authority strings in default view;
- reserve red for blocked states;
- use amber for needs_review and warning states;
- use neutral or blue treatment for review-only states.

## Authority Lens

Authority Lens is an optional expert mode.

Normal view emphasizes workflow and relationships: what source was prepared,
what was returned, what validation concluded, and what next action is safe to
consider.

Authority Lens emphasizes review-only, non_committed, blocked, provenance
mismatch, unsafe source input, pointer-only, and advisory-only boundaries. It
should make caveats easier to inspect without turning the default graph into a
dense warning wall.

Authority Lens must not hide critical caveats. It changes emphasis and detail
visibility only; it does not create approval, acceptance, proof/evidence,
readiness, publication, merge, deploy, provider/model, Codex SDK, DB, GitHub, or
Core authority.

## Constellation Mapping Examples

These examples use sanitized labels only. They do not include real private,
source, provider, account, browser-capture, GitHub mutation, or raw payloads.

### Example 1: PASS with follow-up

Graph path:

`source_input -> manual_copy_packet -> codex_session -> candidate_draft -> validation_summary -> review_candidate -> worker_guidance -> next_action`

Mapping notes:

- `source_input` has status `prepared` and authority `non_committed`.
- `manual_copy_packet` is linked by `prepared`.
- `codex_session` is linked by `pasted_by_human`.
- `candidate_draft` is linked by `returned`.
- `validation_summary` is linked by `validated`.
- `review_candidate` is created only as review-only candidate-compatible
  material.
- `worker_guidance` and `next_action` remain advisory-only.
- candidate material remains `non_committed`.
- pointer warning and needs_review badges are visible by default when present.
- full prompt hash, source input hash, provenance refs, warning details, and
  validation result live in the detail drawer.

### Example 2: BLOCKED

Graph path:

`source_input -> manual_copy_packet -> returned candidate -> validation_summary`

Mapping notes:

- validation blocks when provenance is missing, provenance is mismatched, unsafe
  source-input markers are present, or multiple candidate drafts are returned.
- the blocking condition is represented as a blocked node or `blocked_by` edge.
- no `review_candidate` node is created.
- no worker guidance or next action should imply the candidate is usable.
- the detail drawer should show the blocked reason, candidate count where
  relevant, provenance refs, and validation result.

## Current Data Sources

This design depends on the current workflow artifacts:

- `docs/PERSPECTIVE_CODEX_FORMER_WORKFLOW_CLOSEOUT_V0_1.md`
- `docs/PERSPECTIVE_CODEX_FORMER_MANUAL_WORKFLOW_V0_1.md`
- `docs/PERSPECTIVE_CODEX_FORMER_CAPTURE_SOURCE_INPUT_TEMPLATE_V0_1.md`
- `scripts/perspective-codex-former-capture-helper.mjs`
- `scripts/smoke-perspective-codex-former-capture-helper.mjs`
- `reports/2026-06-10-perspective-codex-former-workflow-closeout.md`
- `reports/2026-06-10-perspective-codex-former-source-input-hardening.md`
- `reports/2026-06-10-perspective-codex-former-capture-helper-parameterized-input.md`

## Product-Surface Entry Criteria

This adapts the PR #497 entry criteria for the product-surface design line:

- CLI/helper path is stable on `main`;
- source input template exists and has smoke coverage;
- validate helper handles the exactly-one-candidate invariant;
- missing or mismatched provenance blocks;
- unsafe source-input markers block;
- pointer warnings remain visible;
- authority boundary is represented in output;
- browser/computer-use validation plan exists for any UI;
- UI must not imply accepted state, proof/evidence/readiness creation,
  approval, merge, deploy, provider/model calls, Codex SDK calls, or Core
  decisions.

## Future Implementation Phases

Future work should proceed in explicit, reviewable phases:

- projection contract: define a read-only shape that maps validated review
  material into constellation nodes and edges;
- fixture preview: build sanitized fixtures for PASS with follow-up and BLOCKED
  states;
- read-only constellation preview: render or serve fixture-backed preview data
  without acceptance or persistence authority;
- Codex Session Perspective Panel prototype: show formation status while a user
  works with Codex;
- Codex integration adapter: design any Codex-surface connection without
  granting Codex SDK calls, provider/model calls, or accepted-state authority by
  default;
- review decision layer: separately design user/Core-gated decisions after
  review-only material is inspectable;
- product hardening / browser validation: verify density, accessibility,
  authority boundaries, and no false accepted-state affordance.

## Browser/Computer-Use Validation Plan

This PR adds no UI, route, browser-visible surface, clipboard automation, or
browser/computer-use capture, so browser/computer-use validation should be
skipped for this design-only change.

When actual UI work begins, browser/computer-use validation must verify:

- badge density;
- hover/focus summaries;
- detail drawer authority flags;
- blocked, needs_review, and PASS with follow-up visual states;
- no UI implies accepted state by default;
- keyboard navigation and readable warning states;
- Authority Lens does not hide critical caveats.

## Stop Condition For Further Dogfood

Do not keep running transcript dogfood just to reconfirm the same manual path.

Further transcript dogfood is useful only if prompt contract, candidate schema,
validation/normalization, source input packet shape, Worker-Facing Guidance
contract, provider/Codex surface behavior, or product capture/pasteback behavior
changes.

## Conclusion

Conclusion: PASS with follow-up

Meaning:

- product-surface design direction is defined;
- no UI has been implemented;
- the next PR may define a constellation projection contract;
- accepted-state automation remains out of scope.
