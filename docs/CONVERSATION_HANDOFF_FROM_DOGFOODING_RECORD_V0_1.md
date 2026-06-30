# Conversation Handoff From Dogfooding Record v0.1

## Slice

`conversation_handoff_packet_from_dogfooding_record_v0_1` converts
caller-provided public-safe dogfooding research record material into
`ConversationHandoffPacketInputV02`, then uses the existing
Conversation Handoff Packet Builder v0.2 to produce a candidate-only handoff
packet.

PR #868 is treated as the frozen web baseline. `/` is the public Augnes surface,
`/perspective` is Perspective detail, and `/workbench` is Cockpit/workbench.
This slice adds no UI, components, route model changes, or API routes.

PR #873 provides the conversation handoff packet builder used by this slice.
This helper is a conversion/binding layer only.

## Inputs

The helper accepts caller-provided public-safe material in any of these forms:

- a single DogfoodingResearchRecord-like summary object
- a list of DogfoodingResearchRecord-like summary objects
- a public-safe summary object with dogfooding record refs and derived fields

The helper does not require DB access. It does not fetch missing refs. It does
not dereference GitHub, provider, retrieval, uploaded-file, connector, or local
file refs.

## Mapping

- dogfooding record refs map to `dogfooding_record_refs`
- source refs map to `source_refs`
- PR refs, branch refs, and commit refs map to `source_refs`
- changed file refs map to `observed_files`
- validation refs map to `observed_checks` and `validation_commands`
- skipped check refs map to `skipped_checks`
- known warning refs map to `known_warnings`
- not-done refs map to `not_done_items`
- expected/observed delta refs map to `expected_observed_delta`
- normalized summaries map to `current_task`
- review cues map to unresolved tension or not-done context
- privacy boundary notes map to public-safe unresolved context
- authority boundary fields remain non-authority context
- reason codes map to source or packet context only
- caller-provided public-safe `next_recommended_slice` or `next_slice` maps to
  `next_recommended_slice`

Expected/observed delta remains separate from validation approval or rejection.
Changed files and observed files remain review context, not proof. Validation
refs remain diagnostic context, not approval.
For v0.3 closeout material, the cue
`no_next_slice_v0_3_core_sequence_complete_pending_operator_decision` is
preserved as a cue only. It is not execution approval.

## Output

Successful output includes:

- `ok`
- `status`
- `error_code`
- `packet_input`
- `packet`
- `source_record_refs`
- `profile`
- `reason_codes`
- `privacy_report`
- `authority_boundary`
- no-execution flags set to false

`packet` is the `ConversationHandoffPacketV02` returned by the existing #873
builder.

## Profiles

The helper supports all #873 packet profiles:

- `chatgpt_strategy`
- `codex_implementation`
- `codex_pr_review`
- `human_operator_review`
- `boundary_audit`
- `handoff_minimal`
- `release_readiness_review`

When the caller does not provide a profile, the helper deterministically uses
`codex_implementation`.

## Authority Boundary

Dogfooding record to handoff packet is not execution approval.
Dogfooding record to handoff packet is not truth.
Dogfooding record to handoff packet is not proof.
Dogfooding record to handoff packet is not accepted evidence.
Dogfooding record to handoff packet is not Review Memory write.
Dogfooding record to handoff packet is not promotion.
Dogfooding record to handoff packet is not Formation Receipt.
Dogfooding record to handoff packet is not durable Perspective state.
Dogfooding record to handoff packet is not product-write.
Handoff packet is candidate-only conversation/workflow guidance.
Dogfooding record is candidate-only review material.
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
Next recommended slice is not execution approval.

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

`fixtures/conversation-handoff-from-dogfooding-record.sample.v0.1.json` covers
single-record, multi-record, summary-only, and v0.3 no-next closeout inputs,
profile pass-through, field mapping, authority boundaries, privacy blocking,
authority blocking, allowed negated boundary wording, and no-execution flags.

`scripts/smoke-conversation-handoff-from-dogfooding-record-v0-1.mjs` verifies
determinism, mapping, profile behavior, private/raw blocking without unsafe
echo, forbidden authority blocking, compatibility with the existing #873
builder, and exact changed-file scope.

## Next

Default fallback next recommended slice for older normal flows:
`dogfooding_record_to_review_memory_proposal_v0_1`.

Caller-provided v0.3 closeout cue:
`no_next_slice_v0_3_core_sequence_complete_pending_operator_decision`.
