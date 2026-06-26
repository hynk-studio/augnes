# Project Constellation Seeded Layout Runtime v0.1

## 1. Purpose

Seeded Constellation Layout Runtime is deterministic.

Seeded Constellation Layout Runtime is display-only.

This slice builds deterministic display-only layout candidates from caller-provided public-safe nodes, edges, refs, markers, and layout seed metadata.

Same input and same seed produce the same output.

## 2. Relationship to the integrated roadmap guide v0.2.1 FULL

This slice implements `seeded_constellation_layout_runtime_v0_1` from `docs/AUGNES_INTEGRATED_DEVELOPMENT_ROADMAP_V0_2_1_FULL.md`.

The roadmap guide is not SSOT. It is an operational roadmap, PR sequencing guide, and authority-boundary checklist.

Actual field, type, and enum authority remains with the Project Constellation Runtime Layout Contract and existing SSOT layers.

## 3. Relationship to PR #788 Project Constellation Runtime Layout Contract

This runtime follows PR #788 Project Constellation Runtime Layout Contract.

PR #788 defines the public-safe layout contract. This PR consumes that contract shape and produces deterministic display-only layout candidates. It does not add persistence, route, UI, graph database, durable state mutation, proof/evidence writes, or product-write.

## 4. Scope and non-goals

This PR does not add route.

This PR does not add UI.

This PR does not persist layout.

This PR does not persist manual anchors.

This PR does not write DB.

This PR does not mutate durable Perspective state.

This PR does not apply deltas.

This PR does not write Formation Receipts.

This PR does not promote Perspective.

This PR does not create proof/evidence.

This PR does not write claim/evidence records.

This PR does not product-write.

Product-write remains parked by #686.

It does not implement layout persistence, manual anchor persistence, graph database, DB read/write, DB migration, durable Perspective state apply, Formation Receipt write, promotion execution, promotion decision write, proof/evidence creation, claim/evidence writes, product write, product ID allocation, provider/OpenAI calls, prompt sending, retrieval execution, RAG answer generation, source fetch, local/repository/uploaded file reads as source input, Git Ledger export, Codex/GitHub automation, work mutation, background jobs, external network calls, package dependencies, GitHub Actions, raw source body storage, raw provider output storage, raw retrieval output storage, raw layout payload storage, raw conversation storage, hidden reasoning storage, private URL persistence, local private path persistence, or automatic layout mutation from provider/retrieval/RAG/Codex/CI/smoke/feedback/Git refs.

## 5. Seeded layout input shape

The runtime accepts public-safe symbolic node refs, edge refs, source refs, candidate refs, review record refs, promotion decision refs, Formation Receipt refs, apply event refs, feedback refs, marker refs, layout seed metadata, requested marker kinds, and requested diagnostic kinds.

Edge routes require both endpoint node refs to exist in the same input node set. Orphan edge endpoints are rejected before layout build.

Source refs are lineage pointers, not proof.

Source refs must be public-safe symbolic refs.

All labels and summaries are bounded summaries only.

## 6. Deterministic seed and coordinate rules

Same input and same seed produce the same output.

Coordinates are display hints.

Coordinates are not truth.

Coordinates are not proof.

Coordinates are not evidence strength.

Coordinates are not promotion readiness.

Every position carries coordinate display-hint reason codes and finite numeric coordinates.

## 7. Cluster placement rules

The runtime assigns coarse cluster positions by layout layer and node kind. Durable graph, candidate overlay, review memory, source refs, feedback, and trajectory layers are separated deterministically.

Cluster placement is a display convention only and is not graph truth, proof, evidence strength, or promotion readiness.

## 8. Candidate overlay separation rules

Candidate overlay is visually distinct from durable graph.

Candidate overlay is not durable graph.

Candidate overlay positions are stable for the same input and seed, but they remain display/review aids only.

Candidate overlay offsets are display hints and do not use manual anchor authority. Manual anchor hints remain deferred to the manual anchor persistence slice.

## 9. Marker placement rules

Stale markers are display warnings only.

Tension markers are review aids only.

Gap markers are review aids only.

Bridge markers are review aids only.

Markers do not create proof, evidence, accepted evidence, promotion readiness, durable state, product state, or Git Ledger packets.

## 10. Source balance and diagnostics

Source balance is advisory.

Diagnostics summarize source balance, candidate overlay separation, durable/candidate boundary, tension visibility, and knowledge-gap visibility. Diagnostics are public-safe, deterministic, and non-authoritative.

The layout contract field `source_balance_diagnostics` contains source-balance diagnostics only. Broader runtime diagnostics remain result-level diagnostics.

## 11. Privacy and redaction rules

The runtime rejects private/raw markers and does not store real private URLs, local user paths, tokens, secrets, raw source text, raw provider output, raw retrieval output, raw layout payload, hidden reasoning, raw conversation, browser dumps, raw DB rows, actual prompt text, or actual query text.

Fixtures use bounded placeholder text only for blocked examples.

## 12. Authority boundary

The runtime authority boundary permits deterministic seeded layout runtime and deterministic layout algorithm only.

Route, UI, layout persistence, manual anchor persistence, graph rendering, graph database, DB query/write, durable state write, durable state apply, Formation Receipt write, promotion execution, promotion decision record write, proof/evidence record write, claim/evidence write, product write, product ID allocation, work mutation, source fetch, local/repository/uploaded file read, provider/OpenAI call, prompt sending, retrieval execution, RAG answer generation, embedding creation, vector search, Git Ledger export, Codex execution authority, GitHub automation authority, coordinate truth/proof/evidence-strength/promotion-readiness authority, manual anchor authority, candidate overlay durable graph authority, source balance truth authority, and product-write authority remain false.

## 13. Deferred work

Deferred work:

1. Constellation runtime UI
2. Layout persistence / manual anchors
3. Feedback event aggregation runtime
4. Feedback controls expansion
5. Feedback influenced surfacing preview
6. Runtime audit panel integration
7. Dogfooding ingestion
8. Git Ledger export
9. Product write reentry

## 14. Verification expectations

Verification should run `scripts/smoke-project-constellation-seeded-layout-v0-1.mjs`, PR #788 Project Constellation Runtime Layout Contract smoke, PR #787 Perspective Trajectory Builder smoke, PR #786 Durable Perspective State Apply smoke, PR #785 Formation Receipt smoke, PR #783/#784 promotion decision store smoke, PR #782 promotion contract smoke, PR #781 RAG Context Preview smoke, PR #780 retrieval index runtime smoke, PR #779 retrieval contract smoke, downstream source-intake/provider/review-memory/foundation smokes, `npm run typecheck`, `git diff --check`, and `git diff --cached --check`.

Existing `MODULE_TYPELESS_PACKAGE_JSON` warnings from direct TypeScript imports are acceptable only when commands exit 0.

## 15. Next recommended slices

1. constellation_runtime_ui_v0_1
2. layout_persistence_manual_anchors_v0_1
3. feedback_event_aggregation_runtime_v0_1
4. dogfooding_record_runtime_contract_v0_1
5. runtime_audit_panel_v0_1
