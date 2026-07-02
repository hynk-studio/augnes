# Conversation Handoff Packet Builder v0.2

## Slice

`conversation_handoff_packet_builder_v0_2` adds a deterministic helper for
building plain-text handoff packets from caller-provided public-safe summaries.

PR #868 is treated as the frozen web baseline. `/` is the public Augnes surface,
`/perspective` is Perspective detail, and `/workbench` is Cockpit/workbench.
The implemented behavior is deterministic public-safe handoff text generation.

PR #872 provides Codex result to dogfooding record binding context for handoff.
The builder can reference dogfooding record refs supplied by the caller, but it
does not read DB rows or write records.

## Output

The helper in `lib/handoff/build-conversation-handoff-packet.ts` accepts
`ConversationHandoffPacketInputV02` and returns a
`ConversationHandoffPacketBuildResultV02`. Successful builds include:

- `packet_version`
- `builder_version`
- `scope`
- `profile`
- `packet_id`
- `packet_fingerprint`
- `created_at`
- `sections`
- `plain_text`
- `authority_boundary`
- `forbidden_capabilities`
- `reason_codes`
- `deterministic_profile_notes`

Same input plus same profile produces the same packet fingerprint and
plain text. The helper does not include wall-clock time unless the caller
supplies `created_at`.

## Profiles

Supported profiles:

- `chatgpt_strategy`
- `codex_implementation`
- `codex_pr_review`
- `human_operator_review`
- `boundary_audit`
- `handoff_minimal`
- `release_readiness_review`

Profiles change section order and compression only. They do not remove the
authority boundary or forbidden capabilities. `handoff_minimal` remains compact
but still includes both.

## Sections

Available sections:

- Project context
- Current baseline
- Current task
- Expected files
- Observed files
- Expected checks
- Observed checks
- Expected/Observed Delta
- Known warnings
- Skipped checks and reason
- Not-done classification
- Source refs
- Dogfooding record refs
- Review Memory refs
- Promotion/Receipt/State refs if applicable
- Unresolved tensions
- Authority boundary
- Forbidden capabilities
- Stop conditions
- PR body requirements
- Validation commands
- Next recommended slice

## Authority Boundary

Handoff packets are candidate-only conversation/workflow guidance. They do not
grant execution approval, proof, accepted evidence, write authority, Review
Memory, promotion, Formation Receipt, durable state, product-write, Git/GitHub,
release, deploy, or publish authority.

Expected files, observed files, checks, PR bodies, Codex reports, dogfooding
records, Review Memory refs, Promotion/Receipt/State refs, Git refs, GitHub refs,
and historical next-slice cues remain review references only.

Forbidden positive authority string shortcuts are blocked without raw value echo.
The blocked shortcut coverage includes validation pass/failure, smoke
pass/failure, CI pass/failure, PR body, Codex report, handoff packet, expected
files, observed files, expected checks, observed checks, dogfooding record,
Review Memory refs, Promotion/Receipt/State refs, provider output, retrieval
result or score, feedback, layout coordinate, salience score, Git refs, and
GitHub refs.

## Privacy Boundary

Inputs are caller-provided summaries only. The builder applies the existing
Privacy Redaction Runtime Guard conventions. Private/raw/provider/runtime/local,
credential, and hidden-reasoning markers are blocked or redacted without unsafe
echo. The helper does not include raw source bodies, raw provider output, raw
retrieval output, raw DB rows, raw conversations, hidden reasoning, private
URLs, local private paths, credentials, tokens, secrets, cookies, or private
keys. Opaque connector IDs and uploaded-file IDs are not canonical labels.

## Forbidden Capabilities

This builder only produces deterministic public-safe handoff text from
caller-provided summaries. It does not add UI, route, storage, provider,
retrieval, Review Memory, product-write, Git/GitHub, release, deploy, or publish
behavior. Detailed actor authority remains in `docs/AUTHORITY_MATRIX.md`.

## Fixture And Smoke

`fixtures/conversation-handoff-packet.sample.v0.2.json` mirrors the supported
profiles, required sections, authority boundary, forbidden capabilities,
blocked privacy cases, blocked authority cases, allowed negated authority
phrases, and no-execution flags.

`scripts/smoke-conversation-handoff-packet-v0-2.mjs` verifies deterministic
output, profile behavior, unchanged authority strength across profiles,
privacy/authority blocking without unsafe echo, no execution flags, package and
index pointers, and exact changed-file scope for this slice.

## Historical Follow-Up Metadata

`conversation_handoff_packet_from_dogfooding_record_v0_1`.

This ID is retained as fixture compatibility metadata. Current PR sequencing
authority comes from `docs/ACTIVE_DEVELOPMENT_COMPLETION_POSTURE_V0_1.md`.
