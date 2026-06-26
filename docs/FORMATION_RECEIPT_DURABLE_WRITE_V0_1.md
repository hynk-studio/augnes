# Formation Receipt Durable Write v0.1

## 1. Purpose

Formation Receipt Durable Write records why context was selected, omitted, or deferred.

This slice adds a durable receipt builder, Formation Receipt store helper, same-origin route, DB schema additions, public-safe fixture, smoke, package script, and index pointer. It implements `formation_receipt_durable_write_v0_1` from `docs/AUGNES_INTEGRATED_DEVELOPMENT_ROADMAP_V0_2_1_FULL.md`.

Formation Receipt is required before durable state apply.

## 2. Relationship to the integrated roadmap guide v0.2.1 FULL

The roadmap guide is not SSOT. It is an operational roadmap, PR sequencing guide, and authority-boundary checklist.

Older proposal documents are background inputs already integrated into the roadmap guide, not standalone ordering authority.

## 3. Relationship to PR #782, #783, and #784

This slice follows PR #782 Perspective Promotion Runtime Contract and PR #783/#784 Promotion Decision Store/Routes.

PR #782 defined that Formation Receipt is required before durable state apply. PR #783 added explicit operator promotion decision records. PR #784 hardened those store/routes so read paths are read-only, blocked results are bounded errors, creates are atomic, and orphan activity is rejected.

This slice writes Formation Receipt records only after an explicit operator-reviewed promotion decision. It does not execute promotion and does not apply durable Perspective state.

Formation Receipt creation requires an existing promotion decision record.

The referenced promotion decision must not be discarded.

The referenced promotion decision must be an explicit operator-reviewed promote decision.

Formation Receipt creation rejects phantom promotion decision refs.

Formation Receipt creation rejects non-promote or non-eligible promotion decisions.

Formation Receipt creation does not mutate the promotion decision into durable Perspective state.

## 4. Scope and non-goals

This slice writes public-safe Formation Receipt records to a caller-injected/local test DB only.

It does not implement durable Perspective state apply, Perspective trajectory builder, product write, product ID allocation, proof/evidence creation, claim/evidence writes, provider/OpenAI calls, prompt sending, retrieval execution, RAG answer generation, source fetch, local/repository/uploaded file reads as source input, Git Ledger export, Codex/GitHub automation, work mutation, UI, background jobs, external network calls, package dependencies, GitHub Actions, raw source body storage, raw provider output storage, raw retrieval output storage, raw conversation storage, hidden reasoning storage, private URL persistence, local private path persistence, production DB path assumptions, or automatic receipt creation from provider/retrieval/RAG/Codex/CI/smoke/feedback/Git refs.

## 5. Formation Receipt record shape

Formation Receipt records include the promotion decision ref, review record ref, operator actor ref, selected candidates, omitted candidates, deferred candidates, selected source refs, geometry digest ref, agent substrate warning refs, context packet ref, feedback event refs, unresolved tensions, knowledge gaps, boundary acknowledgements, reason codes, boundary notes, lifecycle timestamps, and authority boundary.

Formation Receipt write is not durable Perspective state apply.

Formation Receipt is not proof of correctness.

Formation Receipt is not evidence by itself.

Formation Receipt does not create proof/evidence records.

Formation Receipt does not write claim/evidence records.

Formation Receipt does not product-write.

Product-write remains parked by #686.

## 6. Store shape

The store helper writes to a caller-injected DB handle. It does not assume a production DB path.

Create operations validate and build the receipt before DB write. Receipt row, selected/omitted/deferred candidate refs, selected source refs, and activity rows are written atomically.

Failed create operations must not leave partial receipt, candidate, source, or activity rows.

Read/list operations do not ensure schema. GET routes own read-only DB opening and schema existence checks.

## 7. Route shape

The route is:

1. `POST /api/perspective/formation-receipts`
2. `GET /api/perspective/formation-receipts`

POST requires same-origin requests, JSON object bodies, a safe allowlisted DB path, and caller-provided bounded input. POST may create local test DB directories and ensure schema for Formation Receipt writes only.

GET uses read-only DB open, must not create DB files, must not create directories, and must not ensure schema. Missing DB returns `db_missing`; existing DB without schema returns `schema_missing`.

Formation Receipt routes may use the same allowlisted local DB path as Promotion Decision Store/Routes so receipt creation can validate promotion-decision lineage in the same DB.

This shared local DB path policy is still bounded to allowlisted local test paths and does not imply production DB access.

Route responses include the authority boundary and explicit non-execution booleans. Blocked or not-found store results return bounded top-level error responses.

## 8. DB schema additions

`lib/db/schema.sql` adds:

1. `perspective_formation_receipts`
2. `perspective_formation_receipt_selected_candidates`
3. `perspective_formation_receipt_omitted_candidates`
4. `perspective_formation_receipt_deferred_candidates`
5. `perspective_formation_receipt_sources`
6. `perspective_formation_receipt_activity`

These tables store public-safe refs, bounded summaries, decision metadata, authority boundary, reason codes, and lifecycle/audit metadata only.

## 9. Validation and refusal rules

The builder and store reject missing promotion decision refs, phantom promotion decision refs, discarded promotion decisions, non-promote promotion decisions, non-eligible promotion decisions, promotion review-record mismatch, promotion operator mismatch, missing review record refs, missing selected candidates, missing selected source refs, duplicate candidate table IDs, duplicate source IDs, forbidden authority flags, private/raw markers, and invalid input shapes.

Explicit user action is required.

Provider output cannot create Formation Receipts automatically. Retrieval result cannot create Formation Receipts automatically. RAG Context Preview cannot create Formation Receipts automatically. Codex result cannot create Formation Receipts automatically. CI pass cannot create Formation Receipts automatically. Smoke pass cannot create Formation Receipts automatically. Feedback cannot create Formation Receipts automatically. Git refs cannot create Formation Receipts automatically.

## 10. Selected/omitted/deferred candidate preservation

Selected candidates are preserved.

Omitted candidates are preserved.

Deferred candidates are preserved.

Omitted and deferred candidates are not rejected by being omitted or deferred. Their disposition is preserved for audit and later review.

## 11. Tension and knowledge gap preservation

Unresolved tensions are preserved.

Knowledge gaps are preserved.

The receipt records the preservation boundary. It does not resolve tensions, close knowledge gaps, or apply durable Perspective state.

## 12. Discard/lifecycle rules

Discarding a Formation Receipt is lifecycle transition only.

Discarding a Formation Receipt is not hard deletion of proof/evidence.

Discard keeps the receipt readable for audit and follow-up review.

## 13. Activity/audit rules

Activity records capture bounded events such as receipt write, read, list, discard, and invalid-input rejection summaries. Activity records use public-safe actor refs, bounded summaries, and reason codes only.

Activity rows require an existing Formation Receipt. Orphan activity is rejected.

## 14. Authority boundary

The authority boundary is Formation Receipt record write only.

No durable Perspective state apply. No promotion execution. No proof/evidence write. No claim/evidence write. No product write. No product ID allocation. No provider/OpenAI call. No prompt sent. No retrieval execution. No RAG answer generation. No source fetch. No local/repository/uploaded file read as source input. No Git Ledger export. No Codex execution. No GitHub automation.

Durable Perspective state apply is deferred.

Promotion execution is deferred.

Proof/evidence creation is deferred.

Claim/evidence writes are deferred.

Product-write remains parked by #686.

## 15. Privacy and redaction rules

The store accepts public-safe symbolic refs and bounded summaries only.

Source refs are lineage pointers, not proof.

Source refs must be public-safe symbolic refs.

The store rejects real private URLs, local user paths, tokens, secrets, raw source text, raw provider output, raw retrieval output, raw formation receipt payload, hidden reasoning, raw conversation, browser dumps, raw DB rows, actual prompt text, and actual query text.

Blocked examples in fixtures use bounded placeholder text only and do not include actual raw private payload.

## 16. Deferred work

Deferred work:

1. Durable Perspective state apply
2. Perspective trajectory builder
3. Runtime audit panel integration
4. Git Ledger export
5. Product write reentry
6. Dogfooding ingestion
7. Release readiness matrix

## 17. Verification expectations

Verification should run `scripts/smoke-formation-receipt-durable-write-v0-1.mjs`, the PR #783/#784 promotion decision store smoke, PR #782 contract smoke, PR #781 RAG Context Preview smoke, PR #780 retrieval index runtime smoke, PR #779 retrieval contract smoke, downstream source-intake/provider/review-memory/foundation smokes, `npm run typecheck`, `git diff --check`, and `git diff --cached --check`.

Existing `MODULE_TYPELESS_PACKAGE_JSON` warnings from direct TypeScript imports are acceptable only when the command exits 0.

## 18. Next recommended slices

1. durable_perspective_state_apply_v0_1
2. perspective_trajectory_builder_v0_1
3. runtime_audit_panel_v0_1
4. dogfooding_record_runtime_contract_v0_1
5. git_ledger_export_contract_v0_1 only after durable state apply is reviewed
