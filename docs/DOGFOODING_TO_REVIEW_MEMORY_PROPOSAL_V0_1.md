# Dogfooding To Review Memory Proposal v0.1

## Slice

`dogfooding_record_to_review_memory_proposal_v0_1` converts caller-provided
public-safe dogfooding research record material into a Review Memory proposal
candidate.

PR #868 is treated as the frozen web baseline. `/` is the public Augnes surface,
`/perspective` is Perspective detail, and `/workbench` is Cockpit/workbench.
The implemented behavior is deterministic Review Memory proposal candidate
generation from caller-provided dogfooding material.

PR #874 provides dogfooding record to handoff packet binding context. This
helper is a proposal-builder layer only. It does not call the Review Memory
store or route.

## Inputs

The helper accepts caller-provided public-safe material in any of these forms:

- a single DogfoodingResearchRecord-like summary object
- a list of DogfoodingResearchRecord-like summary objects
- a public-safe summary object with dogfooding record refs and derived fields

The helper does not require DB access. It does not fetch missing refs. It does
not dereference GitHub, provider, retrieval, uploaded-file, connector, or local
file refs.

## Mapping

- normalized summaries map to `candidate_review_summary`
- dogfooding record refs map to `source_dogfooding_record_refs`
- source refs, PR refs, branch refs, and commit refs remain references only
- changed file refs remain candidate context, not proof
- validation refs remain diagnostic review context, not approval
- skipped check refs remain validation caveat and review context
- known warning refs remain warning review context
- not-done refs become follow-up proposal cues only
- expected/observed delta refs remain review context
- review cues may inform proposed review actions or rationale, not commands
- authority boundary fields remain non-authority context
- reason codes remain proposal rationale only, not proof

Expected/observed delta remains separate from validation approval or rejection.
Proposed review actions are candidate actions only and are never executed.

## Proposal Actions

Allowed proposal action candidates:

- `save_review_note`
- `request_more_evidence`
- `mark_needs_followup`
- `mark_validation_incomplete`
- `mark_superseded`
- `mark_duplicate`
- `prepare_handoff_later`

The helper may suggest one or more of these actions. It does not execute them.
`operator_confirmation_required` is always true.
`review_memory_write_executed` is always false.

## Output

Successful output includes:

- `ok`
- `status`
- `error_code`
- `proposal`
- `source_record_refs`
- `reason_codes`
- `privacy_report`
- `authority_boundary`
- no-execution flags set to false

`review_memory_write_preview` is a preview-only shape for operator review. It is
not saved Review Memory.

## Authority Boundary

Review Memory proposals are candidate-only. The helper does not save Review
Memory or grant execution approval, proof, accepted evidence, promotion,
Formation Receipt, durable state, product-write, Git/GitHub, release, deploy,
or publish authority.

Proposed review actions are suggestions for operator review, not executed
actions. PR bodies, changed/observed files, validation/CI results, skipped
checks, known warnings, not-done items, expected/observed deltas, Review Memory
refs, Promotion/Receipt/State refs, Git refs, and GitHub refs remain review
references only.

## Privacy Boundary

Inputs are caller-provided summaries only. Private/raw/provider/runtime/local,
credential, and hidden-reasoning markers are blocked without unsafe echo.

The helper does not include raw source bodies, raw provider output, raw
retrieval output, raw DB rows, raw conversations, hidden reasoning, private
URLs, local private paths, credentials, tokens, secrets, cookies, or private
keys. Opaque connector IDs and uploaded-file IDs are not canonical labels.
Public-safe refs may be preserved as references only.

## Forbidden Capabilities

This helper only builds Review Memory proposal candidates from caller-provided
public-safe dogfooding material. It does not save Review Memory or add UI,
route, DB access, provider, retrieval, product-write, Git/GitHub, release,
deploy, or publish behavior. Detailed actor authority remains in
`docs/AUTHORITY_MATRIX.md`.

## Fixture And Smoke

`fixtures/dogfooding-to-review-memory-proposal.sample.v0.1.json` covers
single-record, multi-record, and summary-only inputs, proposal action candidate
generation, operator confirmation, preview-only output, privacy blocking,
authority blocking, allowed negated boundary wording, and no-execution flags.

`scripts/smoke-dogfooding-to-review-memory-proposal-v0-1.mjs` verifies
determinism, mapping, proposed action boundaries, private/raw blocking without
unsafe echo, forbidden authority blocking, and exact changed-file scope.

## Historical Follow-Up Metadata

`local_data_export_manifest_builder_v0_1`.

This ID is retained as fixture compatibility metadata only.
`docs/ACTIVE_DEVELOPMENT_COMPLETION_POSTURE_V0_1.md` defines development
posture, not PR sequencing authority; new slice selection must come from
explicit operator task prompts.
