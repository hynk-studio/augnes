# Promotion Decision Store/Routes v0.1

## 1. Purpose

Promotion Decision Store/Routes records explicit operator decisions.

This slice adds a bounded store helper, same-origin API routes, DB schema additions, a public-safe fixture, smoke coverage, package script, and index pointer for promotion decision records. It follows the PR #782 Perspective Promotion Runtime Contract and implements `promotion_decision_store_route_v0_1` from `docs/AUGNES_INTEGRATED_DEVELOPMENT_ROADMAP_V0_2_1_FULL.md`.

Storing a promotion decision is not promotion execution.

## 2. Relationship to the integrated roadmap guide v0.2.1 FULL

The roadmap guide is not SSOT. It is an operational roadmap, PR sequencing guide, and authority-boundary checklist.

Actual promotion contract field/type/enum authority remains `types/perspective-promotion-runtime-contract.ts`.

Older proposal documents are background inputs already integrated into the roadmap guide, not standalone ordering authority.

## 3. Relationship to PR #782 Perspective Promotion Runtime Contract

PR #782 defined the future human-reviewed Perspective promotion decision boundary as contract-only. This slice is the first bounded runtime follow-up: it may store explicit operator promotion decision records, but it does not execute promotion and does not change durable Perspective state.

Explicit user action is required.

Provider output cannot create promotion decisions automatically. Retrieval result cannot create promotion decisions automatically. RAG Context Preview cannot create promotion decisions automatically. Codex result cannot create promotion decisions automatically. CI pass cannot create promotion decisions automatically. Smoke pass cannot create promotion decisions automatically. Feedback cannot create promotion decisions automatically. Git refs cannot create promotion decisions automatically.

## 4. Scope and non-goals

This slice records explicit operator decision records only. Supported decision kinds mirror the PR #782 contract: promote, reject, defer, request_more_evidence, supersede, split_delta, merge_with_existing, and unknown.

This slice does not add UI. This slice does not add product-write. This slice does not add Git Ledger export.

It does not add provider/OpenAI calls, prompt sending, retrieval execution, RAG answer generation, source fetch, local/repository/uploaded file reads as source input, proof/evidence creation, claim/evidence writes, Formation Receipt write, durable Perspective state apply, work mutation, Codex execution, GitHub automation, product ID allocation, background jobs, package dependencies, GitHub Actions, external network calls, raw source body storage, raw provider output storage, raw retrieval output storage, raw conversation storage, hidden reasoning storage, private URL persistence, or local private path persistence.

## 5. Store shape

The store helper writes promotion decision records to a caller-injected DB handle. It does not assume a production DB path.

Stored records include bounded public-safe refs, bounded summaries, decision metadata, tension and knowledge gap policies, Formation Receipt policy, reason codes, boundary notes, and an explicit authority boundary.

Valid stored records keep `promotion_executed`, `formation_receipt_written`, `durable_state_applied`, `proof_or_evidence_created`, `claim_or_evidence_written`, and `product_write_executed` false.

Storing a promote decision is not durable Perspective state apply. Storing a promote decision is not proof. Storing a promote decision is not accepted evidence by itself.

## 6. Route shape

The routes are:

1. `POST /api/perspective/promotion-decisions`
2. `GET /api/perspective/promotion-decisions`
3. `GET /api/perspective/promotion-decisions/[promotion_decision_id]`
4. `POST /api/perspective/promotion-decisions/[promotion_decision_id]` for bounded discard lifecycle action

Mutating routes require same-origin requests and JSON object bodies. Routes require an explicit caller-provided local DB path and do not silently use a production DB.

Route responses include the authority boundary and explicit non-execution booleans.

## 7. DB schema additions

`lib/db/schema.sql` adds:

1. `perspective_promotion_decisions`
2. `perspective_promotion_decision_basis_refs`
3. `perspective_promotion_decision_activity`

These tables are scoped to promotion decision records, basis refs, and activity/audit entries. They do not store Formation Receipts, durable Perspective state, proof/evidence records, claim/evidence records, product records, raw source bodies, raw provider outputs, or raw retrieval outputs.

## 8. Validation and refusal rules

The helper validates input shape before DB write.

It rejects missing review record refs, missing source refs through basis refs, missing basis refs, forbidden authority flags, private/raw markers, missing operator actor refs, missing explicit user action, and missing future-operator-only markers.

It rejects any request where promotion execution, Formation Receipt write, durable state apply, proof/evidence creation, claim/evidence write, or product write is marked true.

Source refs are lineage pointers, not proof. Source refs must be public-safe symbolic refs.

Review memory is not durable Perspective state.

## 9. Discard/lifecycle rules

Discarding a decision record is not hard deletion of proof/evidence.

Discard is a lifecycle transition on the decision record. Rejected, deferred, discarded, and request_more_evidence decision records remain readable for audit and follow-up review.

## 10. Activity/audit rules

Activity records capture bounded events such as record creation, read, list, discard, and invalid-input rejection summaries. Activity records use public-safe actor refs, bounded summaries, and reason codes only.

Activity is audit context for the decision record. It is not proof, accepted evidence, durable Perspective state, Formation Receipt, Git Ledger export, or product write.

## 11. Authority boundary

The authority boundary is explicit operator decision record storage only.

No promotion execution. No Formation Receipt write. No durable Perspective state apply. No proof/evidence write. No claim/evidence write. No product write. No product ID allocation. No provider/OpenAI call. No prompt sent. No retrieval execution. No RAG answer generation. No source fetch. No local/repository/uploaded file read as source input. No Git Ledger export. No Codex execution. No GitHub automation.

Formation Receipt is required before durable state apply.

Formation Receipt write is deferred. Durable Perspective state apply is deferred. Proof/evidence creation is deferred. Claim/evidence writes are deferred.

Product-write remains parked by #686.

## 12. Privacy and redaction rules

The store accepts public-safe symbolic refs and bounded summaries only.

It rejects real private URLs, local user paths, tokens, secrets, raw source text, raw provider output, raw retrieval output, raw promotion payload, hidden reasoning, raw conversation, browser dumps, raw DB rows, actual prompt text, and actual query text.

Blocked examples in fixtures use bounded placeholder text only and do not include actual raw private payload.

## 13. Deferred work

Deferred work:

1. Promotion decision UI
2. Formation Receipt durable write
3. Durable Perspective state apply
4. Perspective trajectory builder
5. Runtime audit panel integration
6. Git Ledger export
7. Product write reentry
8. Dogfooding ingestion
9. Release readiness matrix

## 14. Verification expectations

Verification should run `scripts/smoke-perspective-promotion-decision-store-v0-1.mjs`, PR #782 contract smoke, PR #781 RAG Context Preview smoke, PR #780 retrieval index runtime smoke, PR #779 retrieval contract smoke, downstream source-intake/provider/review-memory/foundation smokes, `npm run typecheck`, `git diff --check`, and `git diff --cached --check`.

Existing `MODULE_TYPELESS_PACKAGE_JSON` warnings from direct TypeScript imports are acceptable only when the command exits 0.

## 15. Next recommended slices

1. formation_receipt_durable_write_v0_1
2. durable_perspective_state_apply_v0_1
3. perspective_trajectory_builder_v0_1
4. promotion_decision_ui_v0_1 if needed
5. dogfooding_record_runtime_contract_v0_1
