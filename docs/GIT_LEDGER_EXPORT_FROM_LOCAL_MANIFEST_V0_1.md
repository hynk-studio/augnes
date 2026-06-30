# Git Ledger Export From Local Manifest v0.1

## Slice

`git_ledger_export_manifest_binding_v0_1` converts a caller-provided
public-safe `LocalDataExportManifestCandidateV01` into a Git Ledger export
packet candidate.

PR #868 is treated as the frozen web baseline. `/` is the public Augnes surface,
`/perspective` is Perspective detail, and `/workbench` is Cockpit/workbench.
This slice adds no UI, components, route model changes, or API routes.

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

The helper does not require DB access. It does not add a route. It does not
write files. It does not read files. It does not execute Git. It does not call
GitHub. It does not create a branch, commit, PR, tag, release, deploy, or
publish. It does not fetch missing refs or dereference provider, retrieval,
uploaded-file, connector, local file, GitHub, or Git refs.

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

Git Ledger export packet is candidate-only.
Git Ledger export packet is not Git commit.
Git Ledger export packet is not Git write approval.
Git Ledger export packet is not GitHub actuation.
Git Ledger export packet is not PR creation.
Git Ledger export packet is not release approval.
Git Ledger export packet is not deploy approval.
Git Ledger export packet is not publish approval.
Suggested commit message is not approval.
Suggested commit intent is not execution approval.
Packet hash is not truth.
Packet hash is not proof.
Packet hash is not approval.
Idempotency key is not approval.
Local data export manifest is candidate-only.
Local data export manifest is not an export file.
Local data export manifest is not import approval.
Manifest fingerprint is not proof.
Manifest status is not product/release readiness.
Export item summary is not raw data.
Import preview is not import apply.
Git refs are references only.
GitHub PR refs are references only.
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
Next recommended slice is not execution approval.

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

This slice adds no UI, components, Cockpit changes, public-surface changes,
route model changes for `/`, `/perspective`, or `/workbench`, browser
validation-only work, new API route, DB migrations, DB writes, direct DB reads,
local file writes, local file reads, import apply, provider/OpenAI calls, prompt
sending, source fetch, retrieval execution, retrieval index writes,
proof/evidence creation, claim/evidence writes, Review Memory writes,
promotion execution, promotion decision creation from Git Ledger packet
automatically, Formation Receipt writes, durable Perspective state apply,
product-write, product ID allocation, Codex execution from Augnes runtime,
GitHub API calls from Augnes runtime, Git branch/commit/PR creation from Augnes
runtime, Git/GitHub actuation from Augnes runtime, tag creation, release,
deploy, or publish behavior.

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

## Next

Next recommended slice:
`selected_runtime_audit_event_store_v0_1`.
