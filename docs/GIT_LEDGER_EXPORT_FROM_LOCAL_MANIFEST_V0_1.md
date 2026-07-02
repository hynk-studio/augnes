# Git Ledger Export From Local Manifest v0.1

## Slice

`git_ledger_export_manifest_binding_v0_1` converts a caller-provided
public-safe `LocalDataExportManifestCandidateV01` into a Git Ledger export
packet candidate.

PR #868 is treated as the frozen web baseline. `/` is the public Augnes surface,
`/perspective` is Perspective detail, and `/workbench` is Cockpit/workbench.
The implemented behavior is deterministic Git Ledger export packet candidate
generation from caller-provided public-safe manifest material.

PR #876 provides local export manifest candidate context. This slice reuses that
candidate manifest boundary and the existing deterministic Git Ledger packet
builder. It does not add Git Ledger export runtime.

## Inputs

The helper accepts caller-provided public-safe manifest material only:

- a valid `LocalDataExportManifestCandidateV01`-like object
- a public-safe wrapper containing `manifest`, `local_data_export_manifest`, or
  `manifest_candidate`
- public-safe supplemental packet title, packet intent, suggested commit intent,
  generated-by ref, and created-at value

Caller supplies all manifest material and supplemental packet text. The helper
builds packet text without dereferencing or applying refs.

## Mapping

- `manifest_id` becomes `source_manifest_ref`
- `manifest_fingerprint` becomes `source_manifest_fingerprint` and
  deterministic idempotency input, not proof
- `manifest_status` becomes `source_manifest_status`, not product/release
  readiness
- `export_profile` becomes packet intent context
- `export_item_summaries` become `manifest_item_summaries`
- source refs and lineage refs remain references only
- redaction report and privacy report are preserved as public-safe context
- import preview remains preview-only and is not import apply
- suggested commit intent and message are text-only review aids

## Output

Successful output includes:

- packet identity, version, scope, and created-at value
- source manifest ref, fingerprint, status, and export profile
- packet title, packet intent, change summary, and reason summary
- suggested commit intent and suggested commit message text
- source summary refs, manifest item refs, manifest item summaries, and lineage
  refs
- privacy report and redaction report
- authority boundary and forbidden capabilities
- deterministic packet hash and idempotency key
- no-execution flags, all false

`candidate_only` and `redacted_with_warnings` are the only successful statuses.
Blocked manifest statuses return no packet candidate.

## Relationship To Existing Git Ledger Builder

`lib/git-ledger/build-export-packet.ts` remains the deterministic Git Ledger
packet builder. This slice creates the builder input from a local data export
manifest candidate and carries the existing builder packet inside
`git_ledger_packet`.

The existing builder renders suggested commit message text. Suggested commit
message is not approval. Suggested commit intent is not execution approval. The
rendered text does not create a commit, branch, PR, merge, tag, release, deploy,
publish, or GitHub API call.

## Authority Boundary

Git Ledger export packets are candidate-only text packets. They do not approve
or execute Git commits, GitHub actuation, PR creation, release, deploy, publish,
product readiness, product-write, or import behavior.

Suggested commit text, packet hashes, idempotency keys, local manifest refs,
Git refs, GitHub refs, validation/CI results, skipped checks, known warnings,
not-done items, expected/observed deltas, and historical next-slice cues remain
review references only.

## Privacy Boundary

Inputs are caller-provided summaries only. Private/raw/provider/runtime/local,
credential, and hidden-reasoning markers are blocked or redacted without unsafe
echo.

The helper does not include raw source bodies, raw provider output, raw
retrieval output, raw DB rows, raw conversations, hidden reasoning, private
URLs, local private paths, credentials, tokens, secrets, cookies, or private
keys. Opaque connector IDs and uploaded-file IDs are reference-only and not
canonical labels. Public-safe refs may be preserved as references only.

`redacted_with_warnings` preserves public-safe summaries and warning refs
without unsafe raw echo. Blocked statuses do not include unsafe raw values.

## Forbidden Capabilities

This helper only converts a local export manifest candidate into a Git Ledger
packet candidate. It does not write files, mutate Git/GitHub, apply imports, or
add UI, route, DB access, provider, retrieval, Review Memory, product-write,
release, deploy, or publish behavior. Detailed actor authority remains in
`docs/AUTHORITY_MATRIX.md`.

## Fixture And Smoke

`fixtures/git-ledger-export-from-local-manifest.sample.v0.1.json` covers valid
manifest binding, `redacted_with_warnings`, blocked manifest statuses,
private/raw marker blocking, opaque reference-only marker handling, forbidden
authority string blocking, allowed negated boundary text, and no-execution
flags.

`scripts/smoke-git-ledger-export-from-local-manifest-v0-1.mjs` verifies valid
binding, deterministic packet hash and idempotency key, redacted warning
behavior, blocked manifest behavior, no unsafe echo, no Git/GitHub/file/DB
execution, no release/deploy/publish execution, and exact changed-file scope.

## Historical Follow-Up Metadata

`selected_runtime_audit_event_store_v0_1`.

This ID is retained as fixture compatibility metadata. Current PR sequencing
authority comes from `docs/ACTIVE_DEVELOPMENT_COMPLETION_POSTURE_V0_1.md`.
