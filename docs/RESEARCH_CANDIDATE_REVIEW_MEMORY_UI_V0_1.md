# Research Candidate Review Memory UI v0.1

## 1. Purpose

Research Candidate Review Memory UI is ui-route-client-only. It adds a small
operator-facing page for inspecting a route-backed review-memory snapshot and
performing explicit review-memory actions through the existing #771 same-origin
routes.

The UI treats review memory as bounded review metadata only.
Review memory is not truth.
Candidate memory is not Perspective state.
Discard is not deletion.
Supersede preserves lineage.
Source refs are lineage pointers, not proof.
Source refs must be public-safe symbolic refs.
Product-write remains parked by #686.

## 2. Relationship To The Integrated Roadmap Guide v0.2

It implements Phase 2.4 from the integrated development roadmap guide v0.2. The
primary planning basis is
`AUGNES_INTEGRATED_DEVELOPMENT_ROADMAP_GUIDE_V0_2_2026-06-25.md`.

Older proposal documents are background inputs already integrated into the roadmap guide, not standalone ordering authority.

## 3. Relationship To #769 Review Memory Contract, #770 Store, And #771 Routes

It follows the #769 Review Memory Contract, #770 Review Memory Store, and #771
Review Memory Routes.

- #769 defines the bounded review-memory record contract and privacy boundary.
- #770 defines the local-store-only helper used behind the route boundary.
- #771 defines the same-origin review-memory route and store-path allowlist.
- This slice adds a UI page and client component that call the #771 route.

The UI does not import or call the store helper from UI components. The UI does
not add new API routes.

## 4. Scope And Non-Goals

This slice adds:

- `app/research-candidate/review-memory/page.tsx`
- `app/research-candidate/review-memory/review-memory-client.tsx`
- `lib/research-candidate-review/review-memory-ui-contract.ts`
- `fixtures/research-candidate-review.memory-ui.sample.v0.1.json`
- `scripts/smoke-research-candidate-review-memory-ui-v0-1.mjs`
- this documentation pointer
- package and index pointers

It does not add new API routes.
It does not directly write files.
It does not import or call the store helper from UI components.
It does not add DB migrations.
It does not query or write DB.
It does not call provider/OpenAI.
It does not fetch external URLs.
It does not execute retrieval/RAG.
It does not create proof/evidence.
It does not promote Perspective.
It does not mutate durable Perspective state.
It does not mutate work.
It does not execute Codex.
It does not call GitHub.
It does not export Git Ledger packets.
It does not write product records.
It does not allocate product IDs.

## 5. UI Route/Page Shape

The selected UI route is:

- `app/research-candidate/review-memory/page.tsx`

The client component is:

- `app/research-candidate/review-memory/review-memory-client.tsx`

The page renders a static heading and the route-backed client component. The
page does not read files, write files, import filesystem modules, import the
store helper, call provider/OpenAI, call GitHub, query DB, mutate work, or
execute Codex.

The client uses only same-origin relative fetch calls to:

- `/api/research-candidate/review-memory`

## 6. Route-Backed Action Rules

UI actions are explicit operator actions, not automatic background writes.

The supported operator actions are:

- Load snapshot
- Create empty snapshot
- Upsert record
- Discard record
- Supersede record

The UI does not automatically write on page load. It does not background-poll,
auto-retry, use localStorage, use sessionStorage, use cookies, or use browser
indexedDB.

GET load uses the #771 route with caller-visible `store_file_path`, `allow_empty`,
and `as_of` query fields. POST actions send the #771 route version, project
scope, action, caller-visible `store_file_path`, `as_of`, and the explicit
action payload. Route validation remains authoritative.

## 7. Store File Path UI Boundary

Store paths remain constrained by the #771 route allowlist.

The UI default is the safe synthetic/local path:

- `tmp/research-candidate-review-memory/ui-preview-store.json`

The UI labels that default as synthetic/local and requires operator review
before use. The visible allowlist is:

- `tmp/research-candidate-review-memory/*.json`
- `.tmp/research-candidate-review-memory/*.json`

The client may show advisory path guidance, but final validation comes from the
#771 route error code. The UI must not silently choose a private default path and
must not display private local paths or private URLs.

## 8. Display Safety Rules

The UI displays route status, public-safe error codes, snapshot summary,
boundary notes, and a record table limited to:

- `record_id`
- `record_kind`
- `lifecycle_state`
- `review_decision`
- `candidate_ref`
- source refs count
- related record refs count
- `privacy_class`
- `updated_at`
- bounded privacy flags

It does not display raw private payloads. It does not display raw source bodies.
It does not display raw provider outputs. It does not display raw conversations.
It does not display hidden reasoning. It does not display raw DB rows. It does
not display browser dumps. It does not display token-like or secret-like
strings.

The UI labels source refs as lineage pointers, not proof. Source refs must be
public-safe symbolic refs.

## 9. Record JSON Input Rules

Upsert and supersede controls accept bounded JSON text for explicit operator
actions. The UI parses JSON before sending it to the route. JSON parse failures
produce a public-safe UI error code or message.

The UI does not eval JSON. It does not execute arbitrary code. It does not
stringify raw stack traces into the UI. It does not persist JSON input outside
React state. It does not add localStorage, sessionStorage, cookies, indexedDB,
telemetry, background polling, or retry loops.

## 10. Authority Boundary

The UI authority boundary is:

- `ui_route_client_only` remains true.
- `route_backed_only` remains true.
- `automatic_write_on_load` remains false.
- `direct_file_write_now` remains false.
- `direct_store_helper_write_now` remains false.
- `new_api_route_added_now` remains false.
- `db_migration_added_now` remains false.
- `db_query_or_write_now` remains false.
- `provider_openai_call_now` remains false.
- `source_fetch_now` remains false.
- `retrieval_rag_execution_now` remains false.
- `source_of_truth` remains false.
- `proof_or_evidence_record` remains false.
- `perspective_promotion` remains false.
- `durable_perspective_state` remains false.
- `work_mutation` remains false.
- `codex_execution_authority` remains false.
- `github_automation_authority` remains false.
- `git_ledger_export_authority` remains false.
- `product_write_authority` remains false.
- `product_id_allocation_authority` remains false.

Product-write remains parked by #686.

## 11. Deferred Work

Deferred work:

- Foundation/Lifecycle/Memory read-only UI
- Source intake runtime
- Provider extraction runtime
- Retrieval/RAG runtime
- Dogfooding ingestion route
- Codex result report ingestion
- Feedback aggregation runtime
- Feedback controls expansion
- Human-reviewed promotion
- Formation Receipt durable write
- Durable Perspective state apply
- Git Ledger export
- Product write reentry

## 12. Verification Expectations

Verification should include:

- `node --check scripts/smoke-research-candidate-review-memory-ui-v0-1.mjs`
- `npm run smoke:research-candidate-review-memory-ui-v0-1`
- `npm run smoke:research-candidate-review-memory-routes-v0-1`
- `npm run smoke:research-candidate-review-memory-store-v0-1`
- `npm run smoke:research-candidate-review-memory-contract-v0-1`
- downstream Phase 1 and foundation smokes
- `npm run typecheck`
- `git diff --check`
- `git diff --cached --check`

## 13. Next Recommended Slices

Next recommended slices:

1. `foundation_lifecycle_review_memory_readonly_ui_v0_1`
2. `bounded_source_intake_runtime_contract_v0_1`
3. `bounded_source_intake_runtime_v0_1`
4. `provider_assisted_extraction_candidate_only_contract_v0_1`
5. `provider_assisted_extraction_runtime_v0_1`

Do not implement those next slices in this PR.
