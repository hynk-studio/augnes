# Selected Runtime Audit Event Store v0.1

## Slice

`selected_runtime_audit_event_store_v0_1` adds a selected runtime audit event
contract and store/helper for public-safe audit event summaries.

PR #868 is treated as the frozen web baseline. `/` is the public Augnes surface,
`/perspective` is Perspective detail, and `/workbench` is Cockpit/workbench.
The implemented behavior is selected public-safe audit event persistence through
caller-injected local test DB handles.

PR #877 provides Git Ledger packet candidate context. This slice can record
public-safe audit summaries from selected write-capable or candidate-generating
runtime surfaces, including Git Ledger packet candidates, local export manifest
candidates, dogfooding records, Review Memory proposal candidates, blocked
product-write attempts, blocked forbidden authority claims, and blocked private
or raw payloads.

## Scope

In scope:

- `types/runtime-audit-event.ts`
- `lib/runtime-audit/audit-event-store.ts`
- `fixtures/selected-runtime-audit-event-store.sample.v0.1.json`
- `scripts/smoke-selected-runtime-audit-event-store-v0-1.mjs`
- `docs/SELECTED_RUNTIME_AUDIT_EVENT_STORE_V0_1.md`
- `package.json`
- `docs/00_INDEX_LATEST.md`

The helper supports caller-injected local test DB handles only. It exports a
schema SQL string, an explicit schema ensure helper, a schema exists helper,
build/create/read/list helpers, and deterministic fingerprint/idempotency
helpers.

Route instrumentation remains outside this selected store. Existing runtime
audit route-instrumentation files remain prior lineage and are not expanded by
this slice.

## Event Kinds

Supported selected event kinds:

- `dogfooding_record_created`
- `review_memory_record_created`
- `review_memory_proposal_candidate_created`
- `promotion_decision_created`
- `formation_receipt_created`
- `durable_state_apply_executed`
- `local_export_manifest_candidate_created`
- `git_ledger_packet_candidate_created`
- `product_write_attempt_blocked`
- `forbidden_authority_claim_blocked`
- `private_raw_payload_blocked`
- `codex_result_bound_to_dogfooding_record`
- `handoff_packet_candidate_created`
- `local_export_manifest_blocked`
- `git_ledger_packet_blocked`

The blocked event kinds represent public-safe blocked context only. They do not
open the blocked capability.

## Store Behavior

The selected store uses the `selected_runtime_audit_events_v01` table only when
a caller injects a DB handle and explicitly calls
`ensureSelectedRuntimeAuditEventSchemaV01`.

`createSelectedRuntimeAuditEventV01` returns `schema_missing` if the schema has
not been ensured. Read and list helpers also return `schema_missing` without
creating tables.

Create behavior is deterministic:

- same input produces the same `event_fingerprint`
- the same `audit_event_id` and same fingerprint returns `duplicate_event`
- the same `audit_event_id` and different fingerprint returns
  `conflicting_event`
- read/list are read-only

No migration file or global DB config is added.

## Authority Boundary

Selected audit events are public-safe runtime summaries. They do not grant
proof, accepted evidence, approval, truth, product readiness, release readiness,
Review Memory, promotion, Formation Receipt, durable state, product-write,
Git/GitHub, source fetch, provider, retrieval, or raw log storage authority.

Event fingerprints, linked refs, validation/CI results, skipped checks, known
warnings, not-done items, and expected/observed deltas remain review references
only.

## Privacy Boundary

Inputs are caller-provided summaries only. Private, raw, provider, runtime,
local, credential, and hidden-reasoning markers are blocked or redacted without
unsafe echo.

The helper does not store raw request bodies, raw response bodies, raw terminal
logs, raw source bodies, raw provider output, raw retrieval output, raw DB rows,
raw conversations, hidden reasoning, private URLs, local private paths,
credentials, tokens, secrets, cookies, or private keys.

Opaque connector IDs and uploaded-file opaque IDs are reference-only and not
canonical labels.

## Forbidden Capabilities

This store records selected public-safe audit events through its caller-injected
local test DB handle. It does not add UI, route instrumentation, global DB
config, local file IO, provider, retrieval, Review Memory, product-write,
Git/GitHub, release, deploy, or publish behavior. Detailed actor authority
remains in `docs/AUTHORITY_MATRIX.md`.

DB writes and reads are limited to this audit event store with a caller-injected
local test DB handle.

## Fixture And Smoke

`fixtures/selected-runtime-audit-event-store.sample.v0.1.json` covers valid
event input, selected event kinds, statuses, blocked event representations,
private/raw marker cases, reference-only opaque markers, forbidden authority
claim parts, allowed negated boundary wording, and no-execution flags.

`scripts/smoke-selected-runtime-audit-event-store-v0-1.mjs` verifies valid
build/create/list/read, schema missing behavior, duplicate/idempotent replay,
conflicting event behavior, selected blocked event representation, private/raw
blocking without unsafe echo, forbidden authority blocking, read/list
boundaries, no-execution flags, and exact changed-file scope.

## Historical Follow-Up Metadata

`release_readiness_matrix_post_868_non_ui_v0_1`.

This ID is retained as fixture compatibility metadata. Current PR sequencing
authority comes from `docs/ACTIVE_DEVELOPMENT_COMPLETION_POSTURE_V0_1.md`.
