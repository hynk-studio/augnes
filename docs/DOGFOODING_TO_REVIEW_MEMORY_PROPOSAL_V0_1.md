# Dogfooding To Review Memory Proposal v0.1

## Slice

`dogfooding_record_to_review_memory_proposal_v0_1` converts caller-provided
public-safe dogfooding research record material into a Review Memory proposal
candidate.

PR #868 is treated as the frozen web baseline. `/` is the public Augnes surface,
`/perspective` is Perspective detail, and `/workbench` is Cockpit/workbench.
This slice adds no UI, components, route model changes, or API routes.

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
- expected/observed delta refs remain reconciliation review context
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

Dogfooding record to Review Memory proposal is not Review Memory write.
Dogfooding record to Review Memory proposal is not execution approval.
Dogfooding record to Review Memory proposal is not truth.
Dogfooding record to Review Memory proposal is not proof.
Dogfooding record to Review Memory proposal is not accepted evidence.
Review Memory proposal is candidate-only.
Review Memory proposal is not saved Review Memory.
Review Memory proposal is not promotion.
Review Memory proposal is not Formation Receipt.
Review Memory proposal is not durable Perspective state.
Review Memory proposal is not product-write.
Operator confirmation is required before any Review Memory write.
Proposed review action is not executed action.
Proposed save_review_note is not Review Memory write.
Proposed request_more_evidence is not source fetch.
Proposed mark_needs_followup is not automatic task creation.
Proposed mark_validation_incomplete is not validation failure.
Proposed mark_superseded is not deletion.
Proposed mark_duplicate is not deletion.
Proposed prepare_handoff_later is not execution approval.
PR body is not truth.
Changed files are not proof.
Observed files are not proof.
Validation pass is not approval.
Validation failure is not automatic rejection.
Smoke pass is not evidence.
Smoke failure is diagnostic, not automatic rejection.
CI pass is not authority.
CI failure is diagnostic, not automatic rejection.
Skipped checks are review context, not failure by themselves.
Known warnings are review context, not automatic rejection.
Not-done items are next-task cues, not automatic task creation.
Expected/observed delta is reconciliation context, not approval or rejection.
Review Memory refs are references only.
Promotion/Receipt/State refs are references only unless separately executed by
an approved existing runtime.
Git refs and GitHub PR refs are references only.

## Privacy Boundary

Inputs are caller-provided summaries only. Private/raw/provider/runtime/local,
credential, and hidden-reasoning markers are blocked without unsafe echo.

The helper does not include raw source bodies, raw provider output, raw
retrieval output, raw DB rows, raw conversations, hidden reasoning, private
URLs, local private paths, credentials, tokens, secrets, cookies, or private
keys. Opaque connector IDs and uploaded-file IDs are not canonical labels.
Public-safe refs may be preserved as references only.

## Forbidden Capabilities

This slice adds no UI, components, Cockpit changes, public-surface changes,
route model changes for `/`, `/perspective`, or `/workbench`, browser
validation-only work, new API route, DB migrations, DB writes, direct DB reads,
provider/OpenAI calls, prompt sending, source fetch, retrieval execution,
retrieval index writes, proof/evidence creation, claim/evidence writes, Review
Memory writes, promotion execution, promotion decisions from dogfooding/CI/smoke
automatically, Formation Receipt writes, durable Perspective state apply,
product-write, product ID allocation, Codex execution from Augnes runtime,
GitHub API calls from Augnes runtime, Git branch/commit/PR creation from Augnes
runtime, Git/GitHub actuation from Augnes runtime, release, deploy, or publish
behavior.

## Fixture And Smoke

`fixtures/dogfooding-to-review-memory-proposal.sample.v0.1.json` covers
single-record, multi-record, and summary-only inputs, proposal action candidate
generation, operator confirmation, preview-only output, privacy blocking,
authority blocking, allowed negated boundary wording, and no-execution flags.

`scripts/smoke-dogfooding-to-review-memory-proposal-v0-1.mjs` verifies
determinism, mapping, proposed action boundaries, private/raw blocking without
unsafe echo, forbidden authority blocking, and exact changed-file scope.

## Next

Next recommended slice:
`local_data_export_manifest_builder_v0_1`.
