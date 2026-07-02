# Conversation Handoff From Dogfooding Record v0.1

## Slice

`conversation_handoff_packet_from_dogfooding_record_v0_1` converts
caller-provided public-safe dogfooding research record material into
`ConversationHandoffPacketInputV02`, then uses the existing
Conversation Handoff Packet Builder v0.2 to produce a candidate-only handoff
packet.

PR #868 is treated as the frozen web baseline. `/` is the public Augnes surface,
`/perspective` is Perspective detail, and `/workbench` is Cockpit/workbench.
The implemented behavior is deterministic conversion from caller-provided
dogfooding material into handoff packet input.

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

Dogfooding-to-handoff conversion produces candidate-only conversation/workflow
guidance. It does not grant execution approval, proof, accepted evidence, Review
Memory, promotion, Formation Receipt, durable state, product-write, Git/GitHub,
release, deploy, or publish authority.

Dogfooding records, PR bodies, changed files, observed files, validation/CI
results, skipped checks, known warnings, not-done items, expected/observed
deltas, Review Memory refs, Promotion/Receipt/State refs, Git refs, GitHub refs,
and historical next-slice cues remain review references only.

## Privacy Boundary

Inputs are caller-provided summaries only. Private/raw/provider/runtime/local,
credential, and hidden-reasoning markers are blocked without unsafe echo.

The helper does not include raw source bodies, raw provider output, raw
retrieval output, raw DB rows, raw conversations, hidden reasoning, private
URLs, local private paths, credentials, tokens, secrets, cookies, or private
keys. Opaque connector IDs and uploaded-file IDs are not canonical labels.
Public-safe refs may be preserved as references only.

## Forbidden Capabilities

This helper only maps caller-provided public-safe dogfooding material into
conversation handoff packet input. It does not add UI, route, DB access,
provider, retrieval, Review Memory, product-write, Git/GitHub, release, deploy,
or publish behavior. Detailed actor authority remains in
`docs/AUTHORITY_MATRIX.md`.

## Fixture And Smoke

`fixtures/conversation-handoff-from-dogfooding-record.sample.v0.1.json` covers
single-record, multi-record, summary-only, and v0.3 no-next closeout inputs,
profile pass-through, field mapping, authority boundaries, privacy blocking,
authority blocking, allowed negated boundary wording, and no-execution flags.

`scripts/smoke-conversation-handoff-from-dogfooding-record-v0-1.mjs` verifies
determinism, mapping, profile behavior, private/raw blocking without unsafe
echo, forbidden authority blocking, compatibility with the existing #873
builder, and exact changed-file scope.

## Historical Follow-Up Metadata

`dogfooding_record_to_review_memory_proposal_v0_1`.

Caller-provided v0.3 closeout cue:
`no_next_slice_v0_3_core_sequence_complete_pending_operator_decision`.

These IDs are retained as fixture compatibility metadata. Current PR sequencing
authority comes from `docs/ACTIVE_DEVELOPMENT_COMPLETION_POSTURE_V0_1.md`.
