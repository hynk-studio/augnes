# Temporal Interpretation Persistence Design v0.1

## Executive summary

Current Temporal Preview is read-only and non-authoritative. It lets reviewers
inspect a bounded PerspectiveSnapshot-like interpretation, guardrail result,
source refs, counterexamples, residual tensions, active context admission
decisions, and safe next step language before any durable Temporal
Interpretation persistence exists.

This v0.1 persistence design is not implementation. It does not add DB schema,
API routes, runtime persistence, Cockpit code, ChatGPT App tools, OpenAI calls,
GitHub publication adapter calls, replay, publish, approval, migrations,
PerspectiveSnapshot runtime, or RawEpisodeBundle runtime.

The purpose of this design is to prevent preview output from becoming
accidental durable state. Future persistence must distinguish review artifacts
from state authority, generated interpretation from source identity, and
summary refs from evidence-bearing raw or near-raw episode refs.

## Persistence targets

### A. TemporalPreviewReviewArtifact

`TemporalPreviewReviewArtifact` is a possible future persisted review artifact
for captured Temporal Preview output. It can preserve:

- Captured preview output.
- Guardrail result.
- Source refs.
- Manual reviewer verdict.
- Review timestamp.
- Non-authority boundary.

This artifact is safe as a review artifact, not state authority. It can help
future reviewers compare route output, generator behavior, guardrail warnings,
manual verdicts, and evidence separation over time. It must remain
non-authoritative: storing the artifact must not admit memory, commit state,
approve work, publish proof, replay delivery, or create a durable
PerspectiveSnapshot.

### B. PerspectiveSnapshotCandidate

`PerspectiveSnapshotCandidate` is a possible future proposed durable
interpretation snapshot. It is not created by the preview route automatically.
It must require an explicit approval / commit workflow before it can become
durable state.

A candidate must include evidence refs, counterexample refs, residual tensions,
admission decisions, and validation status. It should also preserve unresolved
gaps so reviewers can distinguish a candidate that is ready to commit from one
that only records a generated interpretation for discussion.

### C. RawEpisodeBundleRef

`RawEpisodeBundleRef` is a possible future reference to raw or near-raw
episode/source material. It must preserve source identity and avoid
summary-only substitution.

RawEpisodeBundle refs are not the same as summary refs. Summary refs can orient
reviewers, but they cannot replace original source identity or become evidence
anchors by themselves. RawEpisodeBundle refs should be linked to generated
interpretation, not collapsed into that generated interpretation.

### D. TemporalAdmissionDecisionRecord

`TemporalAdmissionDecisionRecord` is an optional future record of admission
decisions. It can preserve how a candidate context item was categorized during
generation or review.

An admission decision must remain tied to source refs and generation context.
It is not proof by itself. A decision can say why a generator or reviewer
treated a ref as primary active, recallable, summary-only, boundary, tension,
stale, duplicate, or out of scope, but it cannot replace the underlying source
refs or manual review outcome.

## Non-persistence / forbidden persistence

The following must not be persisted yet:

- Raw full OpenAI response.
- Secret-bearing local data.
- Unreviewed `safe_next_step` as instruction.
- Summary-only refs as evidence.
- User preference as factual readiness.
- Preview output as committed state.
- Admission decision as automatic memory write.
- Cockpit UI state as durable truth.
- OpenAI output as source of truth.
- RawEpisodeBundle generated from summaries only.

This forbidden persistence boundary applies even if guardrails pass. Guardrail
success means the preview shape passed deterministic local checks; it does not
mean generated text is ready to become durable memory or proof.

## Authority boundaries

Persistence must not approve, publish, replay, or commit state. It must not
bypass manual review, create proof publication, or treat preview output as
durable memory.

Any future commit must go through explicit user/Core authority. Approval-gated
state transitions must be designed separately from Temporal Preview capture.
The preview route, Cockpit rendering, OpenAI-path validation, and smoke scripts
must remain read-only unless a later design explicitly grants a new authority
through reviewed implementation.

Future persistence must also preserve these boundaries:

- Persistence does not make a generated interpretation factual.
- Persistence does not upgrade summary refs into evidence refs.
- Persistence does not make `active_context_admission.decisions` proof.
- Persistence does not make Cockpit display state the source of truth.
- Persistence does not authorize ChatGPT App write tools.
- Persistence does not call the GitHub publication adapter.

## Candidate data model, conceptual only

This section is conceptual only. It is not schema implementation, API design,
migration code, runtime persistence, or a DB contract.

### TemporalPreviewReviewArtifact

- `artifact_id`
- `scope`
- `source_route`
- `generator`
- `model`
- `as_of`
- `preview_excerpt` / `bounded_preview_json`
- `source_refs`
- `evidence_anchor_refs`
- `summary_refs`
- `counterexample_refs`
- `residual_tension_refs`
- `active_context_admission_decisions`
- `guardrail_passed`
- `guardrail_warnings`
- `reviewer_verdict`
- `reviewer_notes`
- `linked_evidence_record_ids`
- `linked_session_id`
- `linked_work_id`
- `created_at`

`TemporalPreviewReviewArtifact` should be limited to bounded captured output
and review metadata. It should not include raw full model output, secrets,
unredacted local files, or durable state mutation fields.

### PerspectiveSnapshotCandidate

- `candidate_id`
- `source_review_artifact_id`
- `proposed_snapshot_summary`
- `evidence_refs`
- `counterexample_refs`
- `residual_tension_refs`
- `admission_decisions`
- `unresolved_gaps`
- `approval_status`
- `commit_status`
- `created_at`

`PerspectiveSnapshotCandidate` should remain a proposal until approval-gated
commit design exists. `approval_status` and `commit_status` are conceptual
future fields, not permission for current code to approve or commit anything.

### RawEpisodeBundleRef

- `bundle_ref_id`
- `source_surface`
- `source_type`
- `source_ref`
- `capture_time`
- `raw_availability`
- `redaction_status`
- `summary_refs_derived_from_bundle`
- `integrity_notes`

`RawEpisodeBundleRef` should preserve source identity and redaction state. It
should point to source material or a governed source handle; it should not be a
summary-only stand-in for evidence.

## Candidate future persistence fields

The following fields are candidates for future persistence after review:

- Stable artifact identity and scope.
- Route/generator metadata.
- Model name when present and safe to record.
- Bounded preview excerpt or bounded preview JSON.
- Evidence anchor refs.
- Summary refs clearly labeled as summary refs.
- Counterexample refs.
- Residual tension refs.
- Admission decisions tied to source refs.
- Guardrail pass/fail and warning list.
- Manual reviewer verdict and notes.
- Links to work IDs, session IDs, and evidence record IDs.
- Redaction status and integrity notes for raw or near-raw source refs.

These fields are candidates because they support audit, review, comparison, and
traceability without automatically becoming memory authority.

## Derived-only fields

The following must remain derived-only unless a later reviewed design changes
their authority:

- Readiness claims inferred from preview text.
- Safe next step instructions.
- Cockpit display grouping, ordering, expansion, or selection state.
- OpenAI-generated rationale treated as factual state.
- User preference interpreted as factual readiness.
- Summary-only ref implications.
- Guardrail verdict interpreted as approval.
- Admission category interpreted as automatic memory admission.
- Candidate snapshot status inferred only from preview output.
- RawEpisodeBundle availability inferred from summaries.

Derived-only fields may be recomputed or displayed for review. They must not be
used as durable truth, approval, commit instruction, or proof.

## Future migration/API design needs

Any later implementation PR must include a separate migration/API design that
answers:

- Which table or storage layer owns review artifacts.
- Which API can list/get review artifacts read-only.
- Which actor can create review artifacts, from which route or command.
- Which fields are redacted or bounded before persistence.
- How evidence refs, summary refs, counterexample refs, and residual tension
  refs are typed so they cannot be confused.
- How reviewer verdicts are recorded without becoming approval authority.
- How work item, session, and evidence record links are validated.
- How export and rollback work if a review artifact was captured incorrectly.
- How a later PerspectiveSnapshotCandidate is proposed without automatic
  commit.
- How an approval-gated commit flow is separated from preview capture.
- How RawEpisodeBundleRef ingestion preserves source identity and redaction.

The first migration/API implementation should target
`TemporalPreviewReviewArtifact` only after a dedicated Temporal Interpretation
work item/evidence binding exists. It should not implement
`PerspectiveSnapshotCandidate` commit or RawEpisodeBundle ingestion in the same
slice.

`docs/TEMPORAL_INTERPRETATION_WORK_AND_EVIDENCE_BINDING.md` defines the
required work/evidence/session/PR binding convention for that future
implementation path. It is a required gate before review artifact schema work.

## Required gates before implementation

Before any persistence implementation, these gates must pass:

- Route-captured review report exists.
- Cockpit validation exists.
- OpenAI path validation exists.
- Manual review template exists.
- No-secret policy.
- Source authority taxonomy.
- Explicit approval/commit design.
- Migration design reviewed.
- Rollback/export story.
- Test fixtures for forbidden persistence.
- Smoke tests for no automatic commit.
- `docs/TEMPORAL_INTERPRETATION_WORK_AND_EVIDENCE_BINDING.md` merged or an
  explicit reviewed decision to stay target_ref-only.

These gates should be evaluated against the current docs and any new work item
before writing migrations, API routes, runtime persistence, Cockpit code, or
ChatGPT App tools.

## Future implementation slices

1. Persistence design review.
2. Work item/evidence binding for Temporal Interpretation.
3. TemporalPreviewReviewArtifact table design.
4. Read-only list/get API for review artifacts.
5. Cockpit read-only review artifact browser.
6. PerspectiveSnapshotCandidate proposal design.
7. Approval-gated commit design.
8. RawEpisodeBundleRef design.
9. RawEpisodeBundle ingestion prototype.
10. Learned temporal routing policy research.

## Recommended next step

First create or merge a dedicated Temporal Interpretation work item/evidence
binding doc or seed record. Then implement review artifact persistence, not
PerspectiveSnapshot persistence.

If a schema design PR is opened after that work item exists, it should be a
TemporalPreviewReviewArtifact schema design PR only. It should preserve the
non-authoritative review-artifact boundary and leave durable
PerspectiveSnapshot persistence, RawEpisodeBundle runtime, approval-gated
commit, routing policy, and Cockpit write controls out of scope.

## Relation to existing artifacts

This design builds on the current Temporal Interpretation v0.2 validation chain
and authority boundary:

- `docs/TEMPORAL_INTERPRETATION_V0_2_STATUS_AND_ROADMAP.md`
- `docs/TEMPORAL_INTERPRETATION_MANUAL_REVIEW_REPORT_ROUTE_CAPTURE_V0_1.md`
- `docs/TEMPORAL_INTERPRETATION_COCKPIT_SCREENSHOT_VALIDATION.md`
- `docs/TEMPORAL_INTERPRETATION_OPENAI_PATH_VALIDATION.md`
- `docs/TEMPORAL_INTERPRETATION_MANUAL_REVIEW_REPORT_MOCK_PREVIEW_V0_1.md`
- `docs/TEMPORAL_INTERPRETATION_WORK_AND_EVIDENCE_BINDING.md`
- `lib/temporal-interpretation/admission.ts`
- `lib/temporal-interpretation/guardrails.ts`

Those artifacts validate preview generation, guardrails, manual review,
route-captured output, Cockpit read-only rendering, and OpenAI-path shape. They
do not create durable PerspectiveSnapshot persistence, RawEpisodeBundle
runtime, state authority, approval authority, publish authority, replay
authority, or evidence creation authority.
