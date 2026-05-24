# Perspective Continuity Smoke Design v0.1

## Status

- smoke-design-only
- non-SSOT
- does not expand Active set
- no runtime behavior
- no schema authority
- no implementation authority
- no diagnostic authority
- no evaluation authority
- no evidence/proof authority
- no benchmark authority
- no scoring authority
- no production-readiness claim
- no autonomous-capability claim
- no smoke script implemented by PR #187

## Purpose

This document designs a future sequence-based Perspective continuity smoke.

The future smoke should check documentation/runtime boundaries before any
runtime fixture behavior is added. The design is
documentation-boundary-first.

This document is research/evaluation guidance only. It is not a smoke
implementation, benchmark, score system, proof, readiness signal, or runtime
behavior.

## Baseline

- `PerspectiveSnapshot` remains derived-view-only.
- `research_diagnostics` remains `log_only` and non-authoritative.
- `loopness_hint` remains the only bounded runtime computed `log_only`
  diagnostic object.
- `sidecar_e_t`, `meta_wm_hint`, `bsl_hint`, and `comp_index_hint` remain
  structured placeholders unless separately approved in future work.
- Dogfooding research docs, raw episode docs, handoff docs, episode logs,
  criteria, and casebook entries are review aids only.
- No Perspective continuity smoke was implemented by PR #187 or by this design
  document itself.
- PR #188 separately implements `npm run
  smoke:perspective-continuity-boundaries` as the first
  documentation-boundary-only smoke skeleton.
- That smoke checks static documentation boundaries only. It does not implement
  runtime sequence fixtures, add runtime behavior, change `PerspectiveSnapshot`
  shape, compute diagnostics, or change Sidecar e_t placeholder status.

## Future Smoke Goals

These are future smoke design goals only:

- ensure Perspective continuity vocabulary remains non-authoritative
- ensure sequence case labels do not become proof or evidence status
- ensure outcome labels do not become scores or benchmarks
- ensure missing anchors are recorded as gaps, not fabricated
- ensure summaries remain review aids over raw anchors
- ensure future sequence fixtures do not mutate Core records
- ensure no external calls occur
- ensure no Cockpit action controls are introduced
- ensure no `PerspectiveSnapshot` response-shape changes occur without
  separate approval
- ensure existing diagnostic placeholders are not promoted into runtime
  computation
- ensure Sidecar e_t remains placeholder unless separately approved

## Future Sequence Fixture Families

These are fixture family names for future smoke design only, not implemented
fixtures and not proof categories.

- stable continuity
- minor revision
- drift detected
- repair needed
- transition pressure
- transition accepted
- retirement
- boundary blocked
- source-ref temptation
- temporal grouping failure
- misleading summary
- over-preserved perspective
- premature transition
- missing raw anchors
- merged but review gaps remained

## t0 / t1 / t2 Review Shape

The future sequence shape is:

- t0 project view: prior committed context / prior casebook or episode anchors
- t1 update pressure: new PR, review, task change, stale context, missing
  anchor, or boundary pressure
- t2 review result: maintenance, revision, repair, transition, retirement,
  suspension, or boundary blocking

The future smoke should verify that these labels stay documentation/review aids
unless separately implemented.

## Boundary Assertions For Future Smoke

These assertions are future smoke design-only assertions:

- no runtime mutation
- no authority table mutation
- no state transition writes
- no proposal status changes
- no evidence/proof creation
- no work/action/mailbox/publication/delivery/temporal artifact mutation
- `fetch_calls=0` where a future smoke stubs fetch
- no OpenAI calls
- no GitHub calls
- no live external calls
- no Cockpit action buttons
- no `PerspectiveSnapshot` response-shape change
- no runtime Sidecar e_t computation
- no `sidecar_e_t.computed=true`
- no runtime `sidecar_e_t.source_refs` emission
- no QP evidence
- no z_t commit
- docs and smoke wording agree

## Documentation Boundary Assertions

Future static/documentation assertions should keep public-facing wording inside
these boundaries:

- no `protocol` naming for public-facing Perspective continuity docs unless
  separately approved
- no production-readiness claims
- no autonomous-capability claims
- no benchmark or KPI authority
- no score system
- no claim that Augnes currently improves workflows
- no claim that Augnes evaluates PR quality
- no claim that Augnes detects drift at runtime
- no claim that Augnes repairs context automatically
- no claim that Augnes selects next tasks autonomously
- summaries must remain review aids over raw anchors
- missing anchors must remain gaps

## Relationship To Existing Docs

This smoke-design-only note relates to:

- `AUGNES_DOGFOODING_RESEARCH_DIRECTION_V0_1.md`
- `AUGNES_PERSPECTIVE_CONTINUITY_RESEARCH_NOTE_V0_1.md`
- `RAW_EPISODE_CAPTURE_V0_1.md`
- `CODEX_HANDOFF_V0_1.md`
- `DOGFOODING_EPISODE_LOG_V0_1.md`
- `DOGFOODING_EVALUATION_CRITERIA_V0_1.md`
- `DOGFOODING_EVALUATION_CASEBOOK_V0_1.md`
- `PERSPECTIVE_SNAPSHOT_V0_1.md`
- `SIDECAR_ET_RUNTIME_IMPLEMENTATION_CHECKLIST_V0_1.md`

This document does not override those docs and does not create authority.

## Future Implementation Gate

A future implementation PR for `smoke:perspective-continuity-sequences`, if
approved, must:

- separately add a smoke script
- separately update `package.json`
- separately update verification evidence docs if needed
- prove no runtime mutation and no external calls
- keep all wording non-authoritative
- keep diagnostic placeholders as placeholders unless separately approved
- include explicit user/PM approval if it changes runtime behavior or
  `PerspectiveSnapshot` shape

## Non-Goals

- no runtime sequence fixture smoke implementation in this PR
- no runtime behavior beyond the documentation-boundary-only smoke script
- no additional package script beyond `smoke:perspective-continuity-boundaries`
- no runtime behavior
- no schema change
- no benchmark
- no KPI
- no score system
- no runtime evaluation
- no proof
- no evidence status
- no readiness claim
- no proposal scoring
- no commit/reject input
- no Gate/SRF input
- no source-of-truth claim
- no production-readiness claim
- no autonomous-agent claim
- no runtime Sidecar e_t computation
- no `PerspectiveSnapshot` response-shape change
- no Cockpit action controls
