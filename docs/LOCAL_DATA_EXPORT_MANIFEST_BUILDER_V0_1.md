# Local Data Export Manifest Builder v0.1

## Slice

`local_data_export_manifest_builder_v0_1` builds a deterministic local data
export manifest candidate from caller-provided public-safe summaries.

PR #868 is treated as the frozen web baseline. `/` is the public Augnes surface,
`/perspective` is Perspective detail, and `/workbench` is Cockpit/workbench.
The implemented behavior is deterministic local data export manifest candidate
generation from caller-provided public-safe summaries.

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

Caller supplies all summaries and refs. The helper builds a manifest candidate
without dereferencing or applying refs.

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
- expected/observed deltas remain review context, not approval or rejection
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

Local data export manifests are candidate-only public-safe summaries. They do
not approve export files, file writes, imports, proof, accepted evidence,
product readiness, release readiness, product-write, Git/GitHub, release,
deploy, or publish behavior.

Export item summaries, Review Memory summaries/proposals, promotion decision
refs, Formation Receipt refs, durable state summaries, Git Ledger packet refs,
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
keys. Opaque connector IDs and uploaded-file IDs are handled as reference-only,
not canonical labels. Public-safe refs may be preserved as references only.

## Forbidden Capabilities

This helper only builds a deterministic manifest candidate from caller-provided
public-safe summaries. It does not write export files, apply imports, read local
files, or add UI, route, DB access, provider, retrieval, Review Memory,
product-write, Git/GitHub, release, deploy, or publish behavior. Detailed actor
authority remains in `docs/AUTHORITY_MATRIX.md`.

## Fixture And Smoke

`fixtures/local-data-export-manifest.sample.v0.1.json` covers minimal,
multi-category, all profile, redaction warning, private/raw marker, forbidden
authority, allowed negated boundary wording, and no-execution cases.

`scripts/smoke-local-data-export-manifest-builder-v0-1.mjs` verifies
determinism, profile ordering, privacy/redaction behavior, blocked unsafe
markers without unsafe echo, forbidden authority blocking, preview-only import
behavior, no file/export/import execution, and exact changed-file scope.

## Historical Follow-Up Metadata

`git_ledger_export_manifest_binding_v0_1`.

This ID is retained as fixture compatibility metadata. Current PR sequencing
authority comes from `docs/ACTIVE_DEVELOPMENT_COMPLETION_POSTURE_V0_1.md`.
