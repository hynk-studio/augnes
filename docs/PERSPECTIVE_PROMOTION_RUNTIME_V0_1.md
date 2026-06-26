# Perspective Promotion Runtime Contract v0.1

## 1. Purpose

Perspective Promotion Runtime Contract is contract-only.

It defines future human-reviewed promotion decision boundaries.

This contract defines how a reviewed candidate may later become eligible for a future promotion decision record. It does not execute promotion. It does not write promotion decisions. It does not create Formation Receipts. It does not apply durable Perspective state. It does not create proof/evidence. It does not write claim/evidence records. It does not product-write.

Product-write remains parked by #686.

## 2. Relationship to the integrated roadmap guide v0.2.1 FULL

This slice implements perspective_promotion_runtime_contract_v0_1 from docs/AUGNES_INTEGRATED_DEVELOPMENT_ROADMAP_V0_2_1_FULL.md.

The roadmap guide is not SSOT. It is an operational roadmap, PR sequencing guide, and authority-boundary checklist. Actual field/type/enum authority for this slice is types/perspective-promotion-runtime-contract.ts.

Older proposal documents are background inputs already integrated into the roadmap guide, not standalone ordering authority.

## 3. Relationship to PR #779, #780, and #781

This slice follows PR #779 Research Retrieval/RAG Runtime Contract, PR #780 Rebuildable Retrieval Index Runtime, and PR #781 RAG Context Preview.

Provider output cannot promote Perspective. Retrieval result cannot promote Perspective. RAG Context Preview cannot promote Perspective.

The retrieval and RAG-preview rail provides candidate-only review context and lineage refs. It does not create truth, proof, accepted evidence, promotion readiness, durable Perspective state, or product write authority.

## 4. Scope and non-goals

This slice adds a type contract, public-safe fixture, smoke, docs, package script, and index pointer.

It does not implement promotion runtime, promotion route, promotion store, DB read/write, DB migration, Formation Receipt write, durable Perspective state apply, claim/evidence writes, proof/evidence creation, source fetch, local file read, repository file read as source input, uploaded file read, provider/OpenAI calls, prompt sending, retrieval execution, RAG answer generation, embedding creation, vector search, Git Ledger export, Codex/GitHub automation, work mutation, product write, product ID allocation, UI, background jobs, package dependencies, GitHub Actions, raw source body storage, raw provider output storage, raw retrieval output storage, raw conversation storage, hidden reasoning storage, private URL persistence, or local private path persistence.

Explicit user action is required for any future promotion.

## 5. Promotion decision contract shape

Promotion decision contracts describe future operator-reviewed decisions only. They include a decision kind, decision status, operator actor ref, review record ref, gate report ref, basis refs, candidate refs, accepted evidence refs, unresolved tension policy, knowledge gap policy, Formation Receipt policy, reason codes, and authority boundary.

Every decision contract keeps promotion execution, decision-store write, Formation Receipt write, durable state apply, proof/evidence creation, claim/evidence writing, and product write false.

## 6. Basis refs and source refs

Basis refs are bounded public-safe lineage pointers and summaries. They may point to review records, claim candidates, evidence candidates, perspective delta candidates, source refs, RAG context previews, retrieval candidates, provider candidate output refs, Formation Receipt policy refs, unresolved tension refs, knowledge gap refs, feedback refs, manual operator note summaries, or unknown placeholders.

Source refs are lineage pointers, not proof. Source refs must be public-safe symbolic refs.

Candidate is not fact. Candidate is not proof. Candidate is not accepted evidence.

## 7. Review record and operator action rules

A future promotion decision requires an operator actor ref, review record ref, explicit user action, and a gate report.

Review memory is not durable Perspective state.

Provider output cannot promote Perspective. Retrieval result cannot promote Perspective. RAG Context Preview cannot promote Perspective. Feedback cannot promote Perspective. Codex result cannot promote Perspective.

CI pass is not proof. Smoke pass is not proof. PR body is not authority. Git ref is not authority.

## 8. Tension and knowledge gap policy rules

Unresolved tensions must be preserved or handled explicitly.

Knowledge gaps must be preserved, deferred, or closed explicitly.

The contract allows future policy labels for preserving, resolving, deferring, or blocking on unresolved tensions and knowledge gaps. It does not resolve the tension, close the gap, or apply durable state.

## 9. Formation Receipt policy rules

Formation Receipt is required before durable state apply.

Durable state apply is deferred.

This slice may describe a Formation Receipt policy, but it does not create Formation Receipts and it does not write durable Perspective state.

## 10. Gate report rules

Gate reports summarize future-readiness checks for operator review. They may report missing review records, missing source refs, missing basis candidates, unresolved tension policy gaps, knowledge gap policy gaps, private/raw payload blocks, or forbidden authority flags.

Gate reports are contract-only diagnostics. They do not store decisions, promote candidates, write receipts, write proof/evidence, mutate work, or write products.

## 11. Privacy and redaction rules

Fixtures and contract examples use public-safe symbolic refs and bounded summaries only.

Fixtures must not include real private URLs, local user paths, tokens, secrets, raw source text, raw provider output, raw retrieval output, hidden reasoning, raw conversation, browser dumps, raw DB rows, actual prompt text, or actual query text.

Blocked examples use bounded placeholder text only and do not include actual raw private payload.

## 12. Authority boundary

Authority is contract-only.

No promotion runtime, promotion route, promotion store, promotion decision record write, Formation Receipt write, durable Perspective state apply, proof/evidence record, claim/evidence write, product write, product ID allocation, work mutation, DB query/write, source fetch, local/repository/uploaded file read, provider/OpenAI call, prompt sending, retrieval execution, RAG answer generation, embedding creation, vector search, Git Ledger export, Codex execution authority, GitHub automation authority, source-of-truth authority, candidate fact authority, candidate proof authority, accepted-evidence authority, provider-output truth authority, retrieval-result evidence authority, RAG-context truth authority, feedback truth authority, CI proof authority, smoke proof authority, PR-body authority, or git-ref authority is added.

Product-write remains parked by #686.

## 13. Deferred work

Deferred work:

1. Promotion decision store
2. Promotion decision routes
3. Promotion decision UI
4. Formation Receipt durable write
5. Durable Perspective state apply
6. Perspective trajectory builder
7. Product write reentry
8. Git Ledger export
9. Dogfooding ingestion
10. Feedback aggregation runtime
11. Runtime audit panel
12. Release readiness matrix

## 14. Verification expectations

Verification should run scripts/smoke-perspective-promotion-runtime-contract-v0-1.mjs, the PR #781 RAG Context Preview smoke, the PR #780 retrieval index runtime smoke, the PR #779 research retrieval contract smoke, downstream source-intake/provider/review-memory/foundation smokes, npm run typecheck, git diff --check, and git diff --cached --check.

Existing MODULE_TYPELESS_PACKAGE_JSON warnings from direct TypeScript imports are acceptable only when the command exits 0.

## 15. Next recommended slices

1. promotion_decision_store_route_v0_1
2. formation_receipt_durable_write_v0_1
3. durable_perspective_state_apply_v0_1
4. perspective_trajectory_builder_v0_1
5. dogfooding_record_runtime_contract_v0_1
