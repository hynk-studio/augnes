# Selected Runtime Audit Event Store v0.1

## Slice

`selected_runtime_audit_event_store_v0_1` adds a selected runtime audit event
contract and store/helper for public-safe audit event summaries.

PR #868 is treated as the frozen web baseline. `/` is the public Augnes surface,
`/perspective` is Perspective detail, and `/workbench` is Cockpit/workbench.
This slice adds no UI, components, route model changes, or API routes.

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

This slice adds no route.

This slice adds no broad all-route instrumentation.

Existing runtime audit route-instrumentation files remain prior lineage and are
not expanded by this slice.

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

Audit event is not proof.

Audit event is not accepted evidence.

Audit event is not approval.

Audit event is not truth.

Audit event is not product readiness.

Audit event is not release readiness.

Audit event is not Review Memory write.

Audit event is not promotion.

Audit event is not Formation Receipt.

Audit event is not durable Perspective state.

Audit event is not product-write.

Audit event is not Git/GitHub actuation.

Audit event is not source fetch.

Audit event is not provider call.

Audit event is not retrieval execution.

Audit event is not raw log storage.

Audit event fingerprint is not proof.

Audit event fingerprint is not approval.

Linked refs are references only.

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

This slice adds no UI, components, Cockpit changes, public-surface changes,
route model changes for `/`, `/perspective`, or `/workbench`, browser
validation-only work, new API route, broad all-route instrumentation, DB
migrations, global DB config, local file writes, local file reads, import apply,
provider/OpenAI calls, prompt sending, source fetch, retrieval execution,
retrieval index writes, raw request body storage, raw response body storage,
raw terminal log storage, proof/evidence creation, claim/evidence writes,
Review Memory writes, promotion execution, promotion decisions from audit
events automatically, Formation Receipt writes, durable Perspective state
apply, product-write, product ID allocation, Codex execution from Augnes
runtime, GitHub API calls from Augnes runtime, Git/GitHub actuation from Augnes
runtime, tag creation, release, deploy, or publish behavior.

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

## Next

Next recommended slice:
`release_readiness_matrix_post_868_non_ui_v0_1`.
