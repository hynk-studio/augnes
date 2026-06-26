# Project Constellation Runtime UI v0.1

## 1. Purpose

Constellation Runtime UI is read-only.

Constellation Runtime UI is an interface, not source of truth.

This slice renders caller-provided Project Constellation layout results as a read-only inspection surface for durable graph, candidate overlay, source provenance, markers, diagnostics, and selected node or edge details.

## 2. Relationship to the integrated roadmap guide v0.2.1 FULL

This slice implements `constellation_runtime_ui_v0_1` from `docs/AUGNES_INTEGRATED_DEVELOPMENT_ROADMAP_V0_2_1_FULL.md`.

The roadmap guide is not SSOT. It is an operational roadmap, PR sequencing guide, and authority-boundary checklist.

Actual field, type, and enum authority remains with the Project Constellation Runtime Layout Contract and Seeded Constellation Layout Runtime.

## 3. Relationship to PR #788 and PR #789

This slice follows PR #788 Project Constellation Runtime Layout Contract and PR #789 Seeded Constellation Layout Runtime.

PR #788 defines public-safe layout shapes. PR #789 computes deterministic display-only layout candidates. This PR renders those caller-provided layout results without adding routes, fetch, persistence, DB writes, durable state mutation, or product-write.

## 4. Scope and non-goals

Constellation Runtime UI does not mutate durable Perspective state.

Constellation Runtime UI does not persist layout.

Constellation Runtime UI does not persist manual anchors.

Constellation Runtime UI does not add routes.

Constellation Runtime UI does not fetch data.

Constellation Runtime UI does not call providers.

Constellation Runtime UI does not execute retrieval or RAG.

Constellation Runtime UI does not write DB.

Constellation Runtime UI does not create proof/evidence.

Constellation Runtime UI does not write claim/evidence records.

Constellation Runtime UI does not product-write.

Product-write remains parked by #686.

This PR does not implement route, API call, fetch, server action, form POST, layout persistence, manual anchor persistence, drag-to-save, save button, rollback button, promote button, apply state button, create proof/evidence button, product write button, graph database, DB read/write, DB migration, durable Perspective state apply, Formation Receipt write, promotion execution, promotion decision write, proof/evidence creation, claim/evidence writes, product write, product ID allocation, provider/OpenAI calls, prompt sending, retrieval execution, RAG answer generation, source fetch, local/repository/uploaded file reads as source input, Git Ledger export, Codex/GitHub automation, work mutation, background jobs, external network calls, package dependencies, GitHub Actions, raw source body storage, raw provider output storage, raw retrieval output storage, raw layout payload storage, raw conversation storage, hidden reasoning storage, private URL persistence, local private path persistence, or automatic layout mutation from provider/retrieval/RAG/Codex/CI/smoke/feedback/Git refs.

## 5. Component shape

The component set is `ConstellationRuntimeView`, `ConstellationNode`, `ConstellationEdge`, `ConstellationInspector`, and `CandidateOverlayToggle`.

The view accepts caller-provided layout result or layout props. It renders nodes, edge routes, marker summaries, diagnostics, and a read-only inspector. Components use props and local display state only.

## 6. Read-only view rules

Coordinates are display hints.

Coordinates are not truth.

Coordinates are not proof.

Coordinates are not evidence strength.

Coordinates are not promotion readiness.

The UI must not expose save, rollback, promote, apply state, proof/evidence creation, product write, route, provider, retrieval, RAG, source fetch, DB, or persistence controls.

## 7. Candidate overlay toggle rules

Candidate overlay is not durable graph.

Toggle state is local display state only.

The candidate overlay toggle may hide or show candidate overlay nodes in local display. It does not persist layout, persist manual anchors, promote candidates, apply state, write DB, or product-write.

## 8. Inspector rules

The inspector is read-only. It renders source refs, candidate refs, review records, promotion decisions, Formation Receipts, apply events, feedback refs, reason codes, diagnostics, and authority boundary values.

Source refs are lineage pointers, not proof.

Source refs must be public-safe symbolic refs.

## 9. Marker display rules

Stale markers are display warnings only.

Tension markers are review aids only.

Gap markers are review aids only.

Bridge markers are review aids only.

Markers are review aids and do not create proof, evidence, durable state, promotion readiness, or product state.

Source balance is advisory.

## 10. Missing endpoint behavior

Missing edge endpoints render bounded warnings rather than crashing or inventing nodes.

The UI does not create placeholder graph nodes, durable graph nodes, candidate nodes, source nodes, or persisted layout records when an edge endpoint is absent from the visible node set.

## 11. Privacy and redaction rules

The UI renders bounded labels, bounded summaries, public-safe symbolic refs, reason codes, and authority boundary fields only.

Fixtures must not include real private URLs, local user paths, tokens, secrets, raw source text, raw provider output, raw retrieval output, raw layout payload, raw constellation UI payload, hidden reasoning, raw conversation, browser dumps, raw DB rows, actual prompt text, or actual query text.

## 12. Authority boundary

Read-only UI is the only active capability.

Route, fetch, layout persistence, manual anchor persistence, graph database, DB read/write, durable state mutation, Formation Receipt write, promotion execution, proof/evidence write, claim/evidence write, product write, product ID allocation, provider/OpenAI call, prompt sending, retrieval execution, RAG answer generation, source fetch, local/repository/uploaded file read as source input, Git Ledger export, Codex execution, GitHub automation, coordinate truth/proof/evidence-strength/promotion-readiness authority, and candidate overlay durable graph authority remain false.

## 13. Deferred work

Deferred work:

1. Layout persistence / manual anchors
2. Runtime layout route integration if later approved
3. Feedback event aggregation runtime
4. Feedback controls expansion
5. Feedback influenced surfacing preview
6. Runtime audit panel integration
7. Dogfooding ingestion
8. Git Ledger export
9. Product write reentry

## 14. Verification expectations

Verification should run the Constellation Runtime UI static smoke, browser/static validation, PR #789 Seeded Constellation Layout Runtime smoke, PR #788 Project Constellation Runtime Layout Contract smoke, PR #787 Perspective Trajectory Builder smoke, PR #786 Durable Perspective State Apply smoke, PR #785 Formation Receipt smoke, PR #783/#784 promotion decision store smoke, PR #782 promotion contract smoke, PR #781 RAG Context Preview smoke, PR #780 retrieval index runtime smoke, PR #779 retrieval contract smoke, downstream source-intake/provider/review-memory/foundation smokes, `npm run typecheck`, `git diff --check`, and `git diff --cached --check`.

Existing `MODULE_TYPELESS_PACKAGE_JSON` warnings from direct TypeScript imports are acceptable only when commands exit 0.

## 15. Next recommended slices

1. layout_persistence_manual_anchors_v0_1
2. feedback_event_aggregation_runtime_v0_1
3. dogfooding_record_runtime_contract_v0_1
4. runtime_audit_panel_v0_1
5. git_ledger_export_contract_v0_1 only after audit/readiness review
