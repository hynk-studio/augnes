# Durable Perspective State Apply v0.1

## 1. Purpose

Durable Perspective State Apply writes durable Perspective state.

This slice applies an explicit operator-reviewed, Formation-Receipt-backed Perspective delta into durable Perspective state. It adds state apply helper, read model helper, state store helper, same-origin apply/read routes, DB schema additions, public-safe fixture, smoke, package script, and index pointer.

Durable Perspective State Apply requires a Formation Receipt.

Formation Receipt is required before durable state apply.

## 2. Relationship to the integrated roadmap guide v0.2.1 FULL

This slice implements `durable_perspective_state_apply_v0_1` from `docs/AUGNES_INTEGRATED_DEVELOPMENT_ROADMAP_V0_2_1_FULL.md`.

The roadmap guide is not SSOT. It is an operational roadmap, PR sequencing guide, and authority-boundary checklist.

Older proposal documents are background inputs already integrated into the roadmap guide, not standalone ordering authority.

## 3. Relationship to PR #782, #783/#784, and #785

This slice follows PR #782 Perspective Promotion Runtime Contract, PR #783/#784 Promotion Decision Store/Routes, and PR #785 Formation Receipt Durable Write.

PR #782 defined the future human-reviewed promotion decision boundary. PR #783/#784 added and hardened explicit operator promotion decision records. PR #785 added Formation Receipt durable write and made Formation Receipt a required gate before durable Perspective state apply.

This PR writes durable Perspective state only after a valid, non-discarded Formation Receipt that points to an explicit operator-reviewed promotion decision.

Durable Perspective State Apply requires an existing promotion decision record.

The referenced promotion decision must not be discarded.

The referenced promotion decision must be an explicit operator-reviewed promote decision.

The referenced promotion decision must be eligible for future operator decision.

Durable Perspective State Apply rejects phantom promotion decision refs.

Durable Perspective State Apply rejects non-promote or non-eligible promotion decisions.

Durable Perspective State Apply does not mutate promotion decision records.

Durable Perspective State Apply does not mutate Formation Receipt records.

## 4. Scope and non-goals

This slice applies durable Perspective state in a caller-injected/local test DB only.

Durable Perspective State Apply does not product-write.

Durable Perspective State Apply does not create proof/evidence records.

Durable Perspective State Apply does not write claim/evidence records outside durable Perspective state references.

It does not implement product write, product ID allocation, Git Ledger export, provider/OpenAI calls, prompt sending, retrieval execution, RAG answer generation, source fetch, local/repository/uploaded file reads as source input, proof/evidence creation, claim/evidence writes outside durable Perspective state references, work item creation, Codex/GitHub automation, UI, background jobs, external network calls, package dependencies, GitHub Actions, raw source body storage, raw provider output storage, raw retrieval output storage, raw conversation storage, hidden reasoning storage, private URL persistence, local private path persistence, production DB path assumptions, or automatic state apply from provider/retrieval/RAG/Codex/CI/smoke/feedback/Git refs.

Product-write remains parked by #686.

## 5. Durable Perspective state shape

Durable Perspective state stores `perspective_id`, current thesis, prior theses, active claims, retired claims, supporting evidence refs, contradicting evidence refs, open tensions, resolved tensions, knowledge gaps, promotion history, retirement history, Formation Receipt refs, salience state, reuse conditions, timestamps, state version, reason codes, and authority boundary.

Source refs are lineage pointers, not proof.

Source refs must be public-safe symbolic refs.

## 6. Apply input and event shape

Apply inputs include an apply event id, perspective id, promotion decision id, Formation Receipt id, review record ref, operator actor ref, apply operation, current thesis, selected/omitted/deferred candidate refs, evidence refs, open/resolved tensions, knowledge gaps, active/retired claims, salience state, reuse conditions, reason codes, boundary notes, and optional applied timestamp.

Allowed apply operations are add, refine, weaken, reverse, split, merge, retire, reweight, and reactivate.

Apply events preserve selected, omitted, and deferred candidate refs, unresolved tensions, knowledge gaps, Formation Receipt refs, and non-execution booleans.

## 7. Formation Receipt lineage gate

Apply requires an existing Formation Receipt in the same caller-provided DB.

The Formation Receipt must be scoped to `project:augnes`, non-discarded, written, not already applied, and must not indicate promotion execution, proof/evidence creation, claim/evidence writing, or product write.

The Formation Receipt promotion decision id, review record ref, and operator actor ref must match the apply input.

Apply also requires the referenced promotion decision row in `perspective_promotion_decisions` in the same caller-provided DB. The promotion decision row must be scoped to `project:augnes`, non-discarded, `decision_kind` promote, `decision_status` eligible for future operator decision, explicit-user-action-only, future-operator-decision-only, and must not indicate promotion execution, durable state apply, proof/evidence creation, claim/evidence writing, or product write.

Promotion decision review record and operator actor refs must match the Formation Receipt and apply input.

Durable Perspective State Apply rejects candidate refs not backed by the Formation Receipt.

Durable Perspective State Apply rejects unreviewed candidate refs.

Active and retired claim refs must be Formation-Receipt-backed or prior-state-backed.

Formation Receipt is required before durable state apply.

## 8. Prior thesis and retired claim preservation

Prior thesis must not be silently overwritten.

Retired claims must remain auditable.

Contradicted evidence must not be deleted.

The store preserves prior theses and retirement history in durable Perspective state.

## 9. Tension and knowledge gap preservation

Unresolved tensions must be preserved or explicitly resolved.

Knowledge gaps must be preserved, deferred, or explicitly closed.

Apply is blocked when unresolved tensions or knowledge gaps from the Formation Receipt disappear without an explicit preservation or resolution marker.

## 10. State read model

The read model reconstructs durable Perspective state from state rows, prior thesis rows, claim rows, evidence refs, tension rows, knowledge gap rows, promotion history, retirement history, Formation Receipt refs, salience state, reuse conditions, and authority boundary.

Read-state is read-only.

## 11. Route shape

The routes are:

1. `POST /api/perspective/state/apply-delta`
2. `GET /api/perspective/state/[perspective_id]`

POST requires same-origin requests, JSON object bodies, safe allowlisted local DB paths, and caller-provided bounded apply input. POST validates action and input shape before opening the write DB.

GET uses read-only DB open, must not create DB files, must not create directories, and must not ensure schema. Missing DB returns `db_missing`; existing DB without schema returns `schema_missing`.

The route path policy allows the same local DB prefixes used by Promotion Decision Store/Routes and Formation Receipt Durable Write so state apply can validate lineage in the same local DB.

## 12. DB schema additions

`lib/db/schema.sql` adds:

1. `perspective_states`
2. `perspective_state_prior_theses`
3. `perspective_state_claims`
4. `perspective_state_evidence_refs`
5. `perspective_state_tensions`
6. `perspective_state_knowledge_gaps`
7. `perspective_state_apply_events`
8. `perspective_state_activity`

These tables store public-safe refs, bounded summaries, lineage metadata, authority boundary, reason codes, and audit metadata only.

## 13. Validation and refusal rules

The helper and store reject missing promotion decision refs, missing Formation Receipt refs, discarded Formation Receipts, non-written Formation Receipts, already-applied Formation Receipts, missing source refs, missing selected candidates, unresolved tension loss, knowledge gap loss, forbidden authority flags, private/raw markers, unknown reason codes, and invalid input shapes.

A Formation Receipt can be applied at most once.

Duplicate apply attempts for the same Formation Receipt are blocked.

Provider output cannot apply durable Perspective state automatically.

Retrieval result cannot apply durable Perspective state automatically.

RAG Context Preview cannot apply durable Perspective state automatically.

Codex result cannot apply durable Perspective state automatically.

CI pass cannot apply durable Perspective state automatically.

Smoke pass cannot apply durable Perspective state automatically.

Feedback cannot apply durable Perspective state automatically.

Git refs cannot apply durable Perspective state automatically.

Explicit user action is required.

## 14. Atomicity and rollback rules

Apply is atomic: state row, prior thesis rows, claim rows, evidence refs, tension rows, knowledge gap rows, apply event rows, and activity rows commit or rollback together.

Failed apply must leave no partial state or apply rows.

The apply event table enforces one durable state apply per Formation Receipt.

The store must not silently overwrite prior state, delete contradicted evidence, delete retired claims, lose unresolved tensions, or lose knowledge gaps.

## 15. Authority boundary

The authority boundary is durable Perspective state apply only.

No product write. No product ID allocation. No proof/evidence row write. No claim/evidence row write outside durable Perspective state references. No provider/OpenAI call. No prompt sent. No retrieval execution. No RAG answer generation. No source fetch. No local/repository/uploaded file read as source input. No Git Ledger export. No Codex execution. No GitHub automation.

Product-write remains parked by #686.

## 16. Privacy and redaction rules

The store accepts public-safe symbolic refs and bounded summaries only.

It rejects real private URLs, local user paths, tokens, secrets, raw source text, raw provider output, raw retrieval output, raw durable perspective state payload, hidden reasoning, raw conversation, browser dumps, raw DB rows, actual prompt text, and actual query text.

Blocked examples in fixtures use bounded placeholder text only and do not include actual raw private payload.

## 17. Deferred work

Deferred work:

1. Perspective trajectory builder
2. Runtime audit panel integration
3. Git Ledger export
4. Product write reentry
5. Dogfooding ingestion
6. Release readiness matrix
7. Product-write target contract
8. Disabled product-write adapter reentry harness

Git Ledger export remains deferred.

Product write reentry remains deferred.

## 18. Verification expectations

Verification should run `scripts/smoke-durable-perspective-state-apply-v0-1.mjs`, PR #785 Formation Receipt smoke, PR #783/#784 promotion decision store smoke, PR #782 contract smoke, PR #781 RAG Context Preview smoke, PR #780 retrieval index runtime smoke, PR #779 retrieval contract smoke, downstream source-intake/provider/review-memory/foundation smokes, `npm run typecheck`, `git diff --check`, and `git diff --cached --check`.

Existing `MODULE_TYPELESS_PACKAGE_JSON` warnings from direct TypeScript imports are acceptable only when the command exits 0.

## 19. Next recommended slices

1. perspective_trajectory_builder_v0_1
2. project_constellation_runtime_layout_contract_v0_1
3. feedback_event_aggregation_runtime_v0_1
4. dogfooding_record_runtime_contract_v0_1
5. runtime_audit_panel_v0_1
