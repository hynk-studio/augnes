# Local Data Export Manifest Builder v0.1

## Slice

`local_data_export_manifest_builder_v0_1` builds a deterministic local data
export manifest candidate from caller-provided public-safe summaries.

PR #868 is treated as the frozen web baseline. `/` is the public Augnes surface,
`/perspective` is Perspective detail, and `/workbench` is Cockpit/workbench.
This slice adds no UI, components, route model changes, or API routes.

PR #875 provides dogfooding to Review Memory proposal context. This slice uses
that chain as source context only. It does not write Review Memory.

## Inputs

The helper accepts caller-provided public-safe summaries and refs for:

- dogfooding record summaries
- Review Memory record summaries
- Review Memory proposal candidates
- source refs and source summary refs
- candidate bundle refs
- promotion decision refs
- Formation Receipt refs
- durable Perspective state summaries
- trajectory refs
- feedback summaries
- runtime audit refs
- Git Ledger packet refs
- handoff packet refs
- validation refs
- skipped checks
- known warnings
- not-done items
- expected/observed deltas

The helper does not require DB access. It does not add a route. It does not
write files. It does not read files. It does not apply imports. It does not
write records. It does not fetch missing refs. It does not dereference GitHub,
provider, retrieval, uploaded-file, connector, or local file refs.

## Profiles

Supported export profiles:

- `operator_review_bundle`
- `dogfooding_memory_bundle`
- `handoff_context_bundle`
- `review_proposal_bundle`
- `audit_readiness_bundle`
- `release_readiness_bundle`
- `minimal_public_safe_bundle`

Profiles may change deterministic grouping and ordering. Profiles do not weaken
privacy or authority boundaries.

## Mapping

- dogfooding summaries remain candidate summaries, not truth
- Review Memory summaries remain references and summaries, not proof
- Review Memory proposals remain candidate proposals, not saved memory
- promotion decision refs remain refs, not promotion execution
- Formation Receipt refs remain refs, not new receipt writes
- durable state summaries remain summaries, not state apply
- validation refs remain diagnostic context, not approval
- skipped checks remain caveats and review context, not automatic failure
- known warnings remain review context, not automatic rejection
- not-done refs remain follow-up cues, not automatic task creation
- expected/observed deltas remain reconciliation context, not approval or rejection
- Git Ledger packet refs remain refs, not Git write authority

## Output

Successful output includes a `LocalDataExportManifestCandidateV01` with:

- manifest identity, version, scope, profile, and deterministic fingerprint
- categorized public-safe refs
- export item summaries
- redaction report and privacy report
- authority boundary and forbidden capabilities
- preview-only import preview
- `export_file_written: false`
- `import_apply_executed: false`

`redacted_with_warnings` is allowed only for reference-only/redacted privacy
guard findings that do not require blocking. Blocked statuses never include
unsafe raw values.

## Authority Boundary

Local data export manifest is candidate-only.
Local data export manifest is not an export file.
Local data export manifest is not file write approval.
Local data export manifest is not import approval.
Local data export manifest is not truth.
Local data export manifest is not proof.
Local data export manifest is not accepted evidence.
Export item summary is not raw data.
Export item summary is not canonical source body.
Import preview is not import apply.
Manifest fingerprint is not proof.
Manifest fingerprint is not approval.
Manifest status is not product/release readiness.
Review Memory summaries are references only.
Review Memory proposals are candidate-only.
Promotion decision refs are references only.
Formation Receipt refs are references only.
Durable state summaries are summaries only.
Git Ledger packet refs are references only.
Git refs and GitHub PR refs are references only.
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
keys. Opaque connector IDs and uploaded-file IDs are handled as reference-only,
not canonical labels. Public-safe refs may be preserved as references only.

## Forbidden Capabilities

This slice adds no UI, components, Cockpit changes, public-surface changes,
route model changes for `/`, `/perspective`, or `/workbench`, browser
validation-only work, new API route, DB migrations, DB writes, direct DB reads,
local file writes, local file reads, import apply, provider/OpenAI calls, prompt
sending, source fetch, retrieval execution, retrieval index writes,
proof/evidence creation, claim/evidence writes, Review Memory writes,
promotion execution, promotion decision creation from export manifest
automatically, Formation Receipt writes, durable Perspective state apply,
product-write, product ID allocation, Codex execution from Augnes runtime,
GitHub API calls from Augnes runtime, Git branch/commit/PR creation from Augnes
runtime, Git/GitHub actuation from Augnes runtime, release, deploy, or publish
behavior.

## Fixture And Smoke

`fixtures/local-data-export-manifest.sample.v0.1.json` covers minimal,
multi-category, all profile, redaction warning, private/raw marker, forbidden
authority, allowed negated boundary wording, and no-execution cases.

`scripts/smoke-local-data-export-manifest-builder-v0-1.mjs` verifies
determinism, profile ordering, privacy/redaction behavior, blocked unsafe
markers without unsafe echo, forbidden authority blocking, preview-only import
behavior, no file/export/import execution, and exact changed-file scope.

## Next

Next recommended slice:
`git_ledger_export_manifest_binding_v0_1`.
