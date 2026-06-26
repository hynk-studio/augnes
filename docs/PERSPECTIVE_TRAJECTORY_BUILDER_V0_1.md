# Perspective Trajectory Builder v0.1

## 1. Purpose

Perspective Trajectory Builder is read-only.

Perspective Trajectory Builder is a derived view, not source of truth.

This slice reconstructs how a Perspective changed over time from bounded, public-safe lifecycle refs and summaries. It helps an operator inspect why current thesis changed, which prior theses existed, which claims were added or retired, and how evidence, tensions, knowledge gaps, promotion decisions, Formation Receipts, and durable apply events formed the lineage.

## 2. Relationship to the integrated roadmap guide v0.2.1 FULL

This slice implements `perspective_trajectory_builder_v0_1` from `docs/AUGNES_INTEGRATED_DEVELOPMENT_ROADMAP_V0_2_1_FULL.md`.

The roadmap guide is not SSOT. It is an operational roadmap, PR sequencing guide, and authority-boundary checklist.

Older proposal documents are background inputs already integrated into the roadmap guide, not standalone ordering authority.

## 3. Relationship to PR #782 through PR #786

This slice follows PR #782 Perspective Promotion Runtime Contract, PR #783/#784 Promotion Decision Store/Routes, PR #785 Formation Receipt Durable Write, and PR #786 Durable Perspective State Apply.

PR #786 is the immediate durable state basis. Perspective Trajectory Builder reads the durable state read model and apply event lineage without applying another delta.

## 4. Scope and non-goals

Perspective Trajectory Builder does not mutate durable Perspective state.

Perspective Trajectory Builder does not apply deltas.

Perspective Trajectory Builder does not promote Perspective.

Perspective Trajectory Builder does not write Formation Receipts.

Perspective Trajectory Builder does not write promotion decisions.

Perspective Trajectory Builder does not create proof/evidence.

Perspective Trajectory Builder does not write claim/evidence records.

Perspective Trajectory Builder does not product-write.

Product-write remains parked by #686.

It does not implement durable state apply, Formation Receipt write, promotion decision write, proof/evidence creation, claim/evidence writes, product write, product ID allocation, provider/OpenAI calls, prompt sending, retrieval execution, RAG answer generation, source fetch, local/repository/uploaded file reads as source input, Git Ledger export, Codex/GitHub automation, work mutation, DB mutation, DB migration, background jobs, external network calls, package dependencies, GitHub Actions, raw source body storage, raw provider output storage, raw retrieval output storage, raw conversation storage, hidden reasoning storage, private URL persistence, local private path persistence, or automatic trajectory mutation from provider/retrieval/RAG/Codex/CI/smoke/feedback/Git refs.

## 5. Trajectory input shape

Trajectory input contains a builder version, scope, perspective id, `as_of`, durable state refs, apply events, promotion decision refs, Formation Receipt refs, review record refs, feedback refs, source refs, boundary notes, reason codes, and an optional authority boundary.

Inputs must use public-safe symbolic refs and bounded summaries only.

## 6. Trajectory event shape

Trajectory events include event id, perspective id, event kind, layer, timestamp, actor ref, subject ref, bounded summary, source refs, candidate refs, review record refs, promotion decision refs, Formation Receipt refs, apply event refs, feedback refs, prior thesis refs, active claim refs, retired claim refs, tension refs, knowledge gap refs, reason codes, and authority boundary.

Supported event kinds include candidate created, review record saved, promotion decision created, Formation Receipt created, durable delta applied, claim retired, tension resolved, knowledge gap deferred, knowledge gap closed, salience changed, and feedback influenced surface.

Events are sorted by `occurred_at`, event kind, and event id. Duplicate event ids are deduplicated deterministically.

## 7. Durable state read model relationship

The route reads existing durable state and durable apply events only.

It builds a derived trajectory from state/read-model outputs and does not write DB rows.

Route-derived trajectories preserve supporting and contradicting evidence refs from durable state.

Route-derived trajectories preserve open and resolved tension status from durable state.

## 8. Prior thesis and retired claim visibility

Prior thesis must remain visible.

Retired claims must remain auditable.

The trajectory preserves prior thesis refs, active claim refs, retired claim refs, apply event refs, and Formation Receipt refs so a later audit panel can explain how state changed without silently overwriting earlier state.

## 9. Evidence/tension/knowledge-gap handling visibility

Contradicted evidence must remain visible.

Unresolved tensions must remain visible.

Resolved tensions must remain visible.

Knowledge gaps must remain visible.

Source refs are lineage pointers, not proof.

Source refs must be public-safe symbolic refs.

## 10. Read-only route rules

The trajectory route is `GET /api/perspective/state/[perspective_id]/trajectory`.

It is read-only. It uses the same safe local DB path policy as Durable Perspective State read. It opens the DB in read-only `fileMustExist` mode, does not create DB files, does not create directories, and does not ensure schema.

Missing DB returns `db_missing`. Existing DB without durable state schema returns `schema_missing`.

## 11. Read-only UI panel rules

The UI panel is props-only and read-only.

It renders current state summary, trajectory events, prior thesis refs, active and retired claim refs, supporting and contradicting evidence refs, open and resolved tension refs, knowledge gap refs, promotion decision refs, Formation Receipt refs, apply event refs, feedback refs, source refs, and authority boundary.

It exposes no save, apply, promote, proof/evidence, or product-write controls.

## 12. Privacy and redaction rules

The builder rejects real private URLs, local user paths, tokens, secrets, raw source text, raw provider output, raw retrieval output, raw trajectory payload, hidden reasoning, raw conversation, browser dumps, raw DB rows, actual prompt text, and actual query text.

Blocked examples in fixtures use bounded placeholder text only and do not include actual raw private payload.

Blocked private/raw trajectory inputs do not echo unsafe perspective ids or timestamps.

## 13. Authority boundary

Trajectory read model now is true and derived view only is true.

Durable state write, durable state apply, Formation Receipt write, promotion execution, promotion decision record write, proof/evidence record write, claim/evidence write, product write, product ID allocation, work mutation, DB write, source fetch, local/repository/uploaded file read, provider/OpenAI call, prompt sending, retrieval execution, RAG answer generation, embedding creation, vector search, Git Ledger export, Codex execution authority, GitHub automation authority, source of truth, candidate fact/proof/evidence authority, Formation Receipt proof authority, durable state apply as product write, and product write authority are all false.

Git Ledger export remains deferred.

Runtime Audit Panel remains deferred.

## 14. Deferred work

Deferred work:

1. Runtime audit panel integration
2. Git Ledger export
3. Project constellation runtime layout contract
4. Seeded constellation layout runtime
5. Feedback event aggregation runtime
6. Dogfooding ingestion
7. Release readiness matrix
8. Product write reentry
9. Product-write target contract
10. Disabled product-write adapter reentry harness

## 15. Verification expectations

Verification should run `scripts/smoke-perspective-trajectory-v0-1.mjs`, PR #786 Durable Perspective State Apply smoke, PR #785 Formation Receipt smoke, PR #783/#784 promotion decision store smoke, PR #782 promotion contract smoke, PR #781 RAG Context Preview smoke, PR #780 retrieval index runtime smoke, PR #779 retrieval contract smoke, downstream source-intake/provider/review-memory/foundation smokes, `npm run typecheck`, `git diff --check`, and `git diff --cached --check`.

Existing `MODULE_TYPELESS_PACKAGE_JSON` warnings from direct TypeScript imports are acceptable only when the command exits 0.

## 16. Next recommended slices

1. project_constellation_runtime_layout_contract_v0_1
2. seeded_constellation_layout_runtime_v0_1
3. feedback_event_aggregation_runtime_v0_1
4. dogfooding_record_runtime_contract_v0_1
5. runtime_audit_panel_v0_1
