# Project Constellation Runtime Layout Contract v0.1

## 1. Purpose

Project Constellation Runtime Layout Contract is contract-only.

Layout is interface.

This slice defines public-safe layout, node position, edge route, manual anchor, temporal smoothing, marker, diagnostic, and authority boundary shapes for future Project Constellation runtime layout. It does not compute, persist, render, or serve a layout.

## 2. Relationship to the integrated roadmap guide v0.2.1 FULL

This slice implements `project_constellation_runtime_layout_contract_v0_1` from `docs/AUGNES_INTEGRATED_DEVELOPMENT_ROADMAP_V0_2_1_FULL.md`.

The roadmap guide is not SSOT. It is an operational roadmap, PR sequencing guide, and authority-boundary checklist.

Actual field, type, and enum authority for this slice is `types/project-constellation-runtime-layout-contract.ts`.

Older proposal documents are background inputs already integrated into the roadmap guide, not standalone ordering authority.

## 3. Relationship to PR #786 and PR #787

This slice follows PR #786 Durable Perspective State Apply and PR #787 Perspective Trajectory Builder.

PR #786 writes durable Perspective state after Formation Receipt. PR #787 builds a read-only derived trajectory over durable state and lifecycle lineage. This PR defines a future layout contract over those outputs without mutating durable Perspective state, applying deltas, writing Formation Receipts, promoting Perspective, or product-writing.

## 4. Scope and non-goals

This PR does not implement layout runtime.

This PR does not implement layout algorithm.

This PR does not persist layout.

This PR does not add route.

This PR does not add UI.

This PR does not mutate durable Perspective state.

This PR does not apply deltas.

This PR does not write Formation Receipts.

This PR does not promote Perspective.

This PR does not create proof/evidence.

This PR does not write claim/evidence records.

This PR does not product-write.

Product-write remains parked by #686.

It does not implement seeded layout runtime, layout persistence, manual anchor persistence, graph rendering, graph database, DB read/write, DB migration, durable Perspective state apply, Formation Receipt write, promotion execution, promotion decision write, proof/evidence creation, claim/evidence writes, product write, product ID allocation, provider/OpenAI calls, prompt sending, retrieval execution, RAG answer generation, source fetch, local/repository/uploaded file reads as source input, Git Ledger export, Codex/GitHub automation, work mutation, background jobs, external network calls, package dependencies, GitHub Actions, raw source body storage, raw provider output storage, raw retrieval output storage, raw conversation storage, hidden reasoning storage, private URL persistence, local private path persistence, or automatic layout mutation from provider/retrieval/RAG/Codex/CI/smoke/feedback/Git refs.

## 5. Layout contract shape

The contract defines layout records, layout nodes, layout edges, manual anchors, temporal smoothing state, stale markers, tension markers, gap markers, bridge node markers, source balance diagnostics, reason codes, fingerprints, and authority boundaries.

The contract accepts durable state refs, trajectory refs, candidate overlay refs, source refs, and lifecycle refs as symbolic lineage pointers only.

Provider output cannot create layout authority.

Retrieval result cannot create layout authority.

RAG Context Preview cannot create layout authority.

Codex result cannot create layout authority.

CI pass cannot create layout authority.

Smoke pass cannot create layout authority.

Feedback cannot create layout authority.

Git refs cannot create layout authority.

## 6. Node position rules

Coordinates are not truth.

Coordinates are not proof.

Coordinates are not evidence strength.

Coordinates are not promotion readiness.

Every position must state coordinate authority as a display hint, manual anchor hint, temporal smoothing hint, stale layout hint, or unknown.

Position reason codes must explicitly preserve that coordinates are display hints and not truth, proof, evidence strength, or promotion readiness.

## 7. Edge route rules

Edge routes describe public-safe symbolic relations such as support, contradiction, refinement, weakening, reversal, split, merge, retirement, reactivation, tension preservation, gap closure, receipt selection, promotion decision lineage, apply event lineage, feedback influence, source lineage, and bridge relations.

Edge routes are interface hints. They do not create graph database rows, proof records, evidence records, claim records, or product state.

Source refs are lineage pointers, not proof.

Source refs must be public-safe symbolic refs.

## 8. Manual anchor rules

Manual anchors are display hints.

Manual anchors are not authority.

Manual anchor persistence is deferred.

Manual anchors do not write layout persistence, durable Perspective state, Formation Receipts, promotion decisions, proof/evidence records, claim/evidence records, product state, or work items.

## 9. Temporal smoothing rules

Temporal smoothing is display continuity.

Temporal smoothing is not durable state.

Temporal smoothing persistence is deferred.

Temporal smoothing must not be used as source of truth, proof, evidence strength, promotion readiness, product-write authority, or durable graph authority.

## 10. Candidate overlay vs durable graph boundary

Candidate overlay is not durable graph.

Candidate overlay nodes and edges are display/review aids only. They do not mutate durable Perspective state, promote candidates, write Formation Receipts, create proof/evidence, write claim/evidence records, or product-write.

## 11. Marker rules

Stale markers are display warnings only.

Tension markers are review aids only.

Gap markers are review aids only.

Bridge markers are review aids only.

Markers do not create proof, evidence, accepted evidence, durable state, promotion readiness, product state, or Git Ledger packets.

## 12. Source balance diagnostics

Source balance is advisory.

Source balance diagnostics can point to symbolic source refs, affected node refs, and affected edge refs. They are review aids only and do not create source of truth, proof, evidence strength, promotion readiness, or product-write authority.

## 13. Privacy and redaction rules

The contract stores bounded labels, bounded summaries, symbolic refs, reason codes, and authority boundaries only.

Fixtures must not include real private URLs, local user paths, tokens, secrets, raw source text, raw provider output, raw retrieval output, raw layout payload, hidden reasoning, raw conversation, browser dumps, raw DB rows, actual prompt text, or actual query text.

Blocked examples use bounded placeholder text only.

## 14. Authority boundary

The authority boundary has `contract_only` true.

Layout runtime, layout algorithm, seeded layout, layout persistence, manual anchor persistence, route, UI, graph rendering, graph database, DB query/write, durable state write, durable state apply, Formation Receipt write, promotion execution, promotion decision record write, proof/evidence record write, claim/evidence write, product write, product ID allocation, work mutation, source fetch, local/repository/uploaded file read, provider/OpenAI call, prompt sending, retrieval execution, RAG answer generation, embedding creation, vector search, Git Ledger export, Codex execution authority, GitHub automation authority, layout truth authority, coordinate truth/proof/evidence-strength/promotion-readiness authority, manual anchor authority, temporal smoothing state authority, candidate overlay durable graph authority, source balance truth authority, and product-write authority are all false.

## 15. Deferred work

Deferred work:

1. Seeded constellation layout runtime
2. Constellation runtime UI
3. Layout persistence / manual anchors
4. Feedback event aggregation runtime
5. Feedback controls expansion
6. Feedback influenced surfacing preview
7. Runtime audit panel integration
8. Dogfooding ingestion
9. Git Ledger export
10. Product write reentry

## 16. Verification expectations

Verification should run `scripts/smoke-project-constellation-runtime-layout-contract-v0-1.mjs`, PR #787 Perspective Trajectory Builder smoke, PR #786 Durable Perspective State Apply smoke, PR #785 Formation Receipt smoke, PR #783/#784 promotion decision store smoke, PR #782 promotion contract smoke, PR #781 RAG Context Preview smoke, PR #780 retrieval index runtime smoke, PR #779 retrieval contract smoke, downstream source-intake/provider/review-memory/foundation smokes, `npm run typecheck`, `git diff --check`, and `git diff --cached --check`.

Existing `MODULE_TYPELESS_PACKAGE_JSON` warnings from direct TypeScript imports are acceptable only when commands exit 0.

## 17. Next recommended slices

1. seeded_constellation_layout_runtime_v0_1
2. constellation_runtime_ui_v0_1
3. layout_persistence_manual_anchors_v0_1
4. feedback_event_aggregation_runtime_v0_1
5. dogfooding_record_runtime_contract_v0_1
