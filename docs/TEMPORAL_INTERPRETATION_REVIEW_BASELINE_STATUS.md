# Temporal Interpretation Review Baseline Status

## Status and scope

- Type: Review baseline status summary
- Track: temporal interpretation / Rule-Governed Self-Graph Perspective
- Scope: current-state checkpoint for review artifacts only
- Accepted baseline: manual review baseline only
- Runtime authority: None
- Implementation status: Documentation-only

This document summarizes the current temporal interpretation review baseline
status for future ChatGPT, Codex, and user/PM sessions. It does not approve
JSON fixture design, executable tests, P4 `PerspectiveSnapshot`
implementation, runtime/schema/API/UI/App work, or P5 `RuleCandidate` /
`PromotedRule` work.

## Current one-line summary

The Markdown review fixture set is accepted as the manual review baseline, and
standalone review report documents are the default durable record for repeated
manual reviews; JSON fixture design, executable tests, P4 implementation,
runtime/schema/API/UI/App work, and P5 rule work remain unapproved.

## Current accepted baseline

The current accepted manual review baseline is:

- `docs/TEMPORAL_INTERPRETATION_MARKDOWN_REVIEW_FIXTURES.md`

This is a manual review baseline, not an implementation baseline. It is
accepted for manual review, not validated for runtime.

## Current durable review record policy

Repeated manual review results should use standalone review report documents
by default.

Current policy:

- use standalone review report documents by default
- do not append repeated review results to the accepted baseline fixture file
- treat PR comments as discussion aids, not canonical long-term record unless
  separately decided
- require a separate user/PM decision before creating a cumulative review log

Repeated review records should preserve reviewed artifact type, exact reviewed
answer text or precise answer summary, concrete source refs, missing evidence,
stale or unavailable refs, source authority profile, counterexamples,
residual tensions, non-authority boundary, allowed decision after review, and
what remains blocked.

## Current source documents

- `docs/TEMPORAL_INTERPRETATION_PERSPECTIVE_DEVELOPMENT_MEMO.md`
- `docs/TEMPORAL_INTERPRETATION_PERSPECTIVE_PROBES.md`
- `docs/TEMPORAL_INTERPRETATION_RAW_EPISODE_BUNDLE_DESIGN.md`
- `docs/TEMPORAL_INTERPRETATION_FIXTURE_TEST_DESIGN_NOTES.md`
- `docs/TEMPORAL_INTERPRETATION_PERSPECTIVE_SNAPSHOT_DESIGN.md`
- `docs/TEMPORAL_INTERPRETATION_MINIMUM_P4_FIXTURE_DRAFTS.md`
- `docs/TEMPORAL_INTERPRETATION_IMPLEMENTATION_READINESS_CHECKLIST.md`
- `docs/TEMPORAL_INTERPRETATION_DOC_INDEX.md`
- `docs/TEMPORAL_INTERPRETATION_MARKDOWN_REVIEW_FIXTURES.md`
- `docs/TEMPORAL_INTERPRETATION_FIXTURE_REVIEW_REPORT_TEMPLATE.md`
- `docs/TEMPORAL_INTERPRETATION_INITIAL_FIXTURE_REVIEW_REPORT.md`
- `docs/TEMPORAL_INTERPRETATION_MANUAL_FIXTURE_BASELINE_DECISION.md`
- `docs/TEMPORAL_INTERPRETATION_FIXTURE_REFINEMENT_NOTES.md`

## What is accepted

Accepted:

- the Markdown review fixture set as the current manual review baseline
- the fixture review report template as the format for future manual review
  reports
- standalone review report documents as the default durable record for
  repeated manual reviews
- reviewed artifact type guidance as reviewer guidance only
- optional refinement discussion, as long as it preserves the manual review
  boundary

## What remains blocked

Blocked unless separately approved:

- JSON fixture design
- JSON fixture creation
- executable temporal interpretation tests
- P4 `PerspectiveSnapshot` projection implementation
- runtime/schema/API/UI/App work
- Cockpit UI
- ChatGPT App tools
- Control Packet changes
- `raw_episode`, `PerspectiveSnapshot`, `RuleCandidate`, or `PromotedRule`
  tables
- automatic scoring thresholds
- rule promotion
- P5 `RuleCandidate` / `PromotedRule` runtime work

## What is optional

Optional:

- small wording refinements that improve manual review clarity
- future standalone review reports using the current template
- discussion of whether repeated reports eventually need a cumulative review
  log
- discussion of whether JSON fixture shape should be considered later

Optional refinements are not blockers to using the current manual review
baseline.

## What should not be inferred

Do not infer that:

- JSON fixture design is approved
- executable tests are approved
- P4 `PerspectiveSnapshot` implementation is approved
- runtime/schema/API/UI/App work is approved
- P5 `RuleCandidate` / `PromotedRule` work is approved
- any actual `PerspectiveSnapshot` behavior passed
- fixture-definition adequacy means runtime behavior pass
- PR comments are the canonical long-term review record
- the accepted baseline fixture file is a running review log
- a cumulative review log has been approved
- implementation readiness has been reached

## Current review artifact types

Current reviewer guidance recognizes these reviewed artifact types:

- `fixture-definition review`
- `hypothetical answer review`
- `actual PerspectiveSnapshot answer review`
- `implementation-readiness review`

These values are reviewer guidance only. They are not API fields, DB fields,
JSON keys, executable test outputs, automatic scoring outputs, or runtime
state.

`fixture-definition review` does not mean actual answer behavior passed.
`hypothetical answer review` does not inspect runtime behavior. `actual
PerspectiveSnapshot answer review` would still not approve implementation
readiness by itself. `implementation-readiness review` requires separate
user/PM scope and approval.

## Current fixture IDs

The current manual review baseline includes:

- `TIRF-P4-001-prior-staged-progression`
- `TIRF-P4-002-summary-drift-counterexample`
- `TIRF-P4-003-revision-after-objection`
- `TIRF-P4-004-user-preference-vs-factuality`
- `TIRF-P4-005-axis-proliferation`
- `TIRF-P4-006-explanation-fidelity`
- `TIRF-P4-007-tension-preservation`

## Current next decision point

The next decision point is whether to:

- stop here and use the accepted manual review baseline, or
- explicitly approve a separate JSON fixture shape discussion.

The default should be to stop refinement here and use the manual review
baseline unless user/PM explicitly approves JSON fixture shape discussion.

## Recommended stop point

Stop refinement here unless user/PM explicitly approves JSON fixture shape
discussion.

The current document set is sufficient to continue manual review using the
accepted Markdown fixture baseline and standalone review report documents. It
is not a reason to start JSON, executable tests, P4 implementation, runtime
work, or P5 work by implication.

## Relationship to JSON fixture design

JSON fixture design is not approved.

The current docs may inform a later JSON fixture shape discussion, but they do
not start one. Any future JSON discussion requires separate user/PM approval
and must preserve source authority profile, missing evidence, counterexamples,
residual tensions, blocked outcomes, `needs_judgment` outcomes, and
non-authority boundaries.

## Relationship to executable tests

Executable tests are not approved.

The current manual review baseline does not define deterministic test inputs,
outputs, assertions, harness behavior, scoring thresholds, or pass/fail
automation. Executable temporal interpretation tests require separate scope
and approval.

## Relationship to P4 read-only PerspectiveSnapshot implementation

P4 read-only `PerspectiveSnapshot` implementation is not approved.

The current docs define review concepts, fixture coverage, report templates,
and baseline status. They do not approve projection logic, schema, API, UI,
ChatGPT App tools, runtime code, or any implemented `PerspectiveSnapshot`
behavior.

Any future P4 implementation discussion requires separate user/PM scope and
approval.

## Relationship to P5 RuleCandidate / PromotedRule work

P5 `RuleCandidate` / `PromotedRule` work is not approved.

The current docs do not approve rule candidates, promoted rules, vector
providers, automatic scoring thresholds, promotion gates, or rule promotion.
P5 work requires separate fixture coverage, governance review, scope, and
approval.

## Guidance for future ChatGPT sessions

- Treat this status document as the current checkpoint.
- Do not recommend JSON fixtures automatically.
- Do not recommend P4 implementation automatically.
- If the user asks "what next," present the decision between using the manual
  baseline as-is or explicitly approving JSON fixture shape discussion.
- If asked to implement, state that implementation remains blocked pending
  separate scope and approval.
- Preserve the distinction between manual review baseline and implementation
  baseline.

## Guidance for future Codex tasks

- Default next Codex tasks should stay docs-only unless user/PM explicitly
  scopes otherwise.
- Do not touch schema/runtime/API/UI/App files.
- Do not create JSON fixtures or executable tests unless explicitly approved.
- Do not change `DEVELOPMENT_ONBOARDING.md` unless explicitly requested.
- Do not change the current repo-level next goal unless explicitly requested.
- Report local dirty files and keep unrelated files unstaged.
- Do not append repeated review results to the accepted baseline fixture file.
- Use standalone review report documents by default for repeated manual review
  results.

## Open questions

- Should refinement stop here and the current manual review baseline be used
  as-is?
- Does user/PM explicitly want to approve a separate JSON fixture shape
  discussion?
- If repeated standalone review reports accumulate, should a cumulative review
  log be proposed later?
- What user/PM signal would be required to move from manual review baseline to
  implementation-readiness review?
- Who should own future manual review reports?

## Final summary

The temporal interpretation Markdown review fixture set is accepted as the
manual review baseline. Standalone review report documents are the default
durable record for repeated manual reviews.

Optional refinements are not blockers to using the current baseline. JSON
fixture design, executable tests, P4 `PerspectiveSnapshot` implementation,
runtime/schema/API/UI/App work, and P5 `RuleCandidate` / `PromotedRule` work
remain unapproved.

The recommended stop point is to stop refinement here and use the accepted
manual review baseline unless user/PM explicitly approves a separate JSON
fixture shape discussion.
