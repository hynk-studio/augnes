# Project Constellation Manual Anchors v0.1

## 1. Purpose

Manual anchors are display hints.

Layout Persistence / Manual Anchors v0.1 persists explicit operator-created manual anchor records for Project Constellation layout display only.

Manual anchors are not authority.

Manual anchors are not truth.

Manual anchors are not proof.

Manual anchors are not evidence strength.

Manual anchors are not promotion readiness.

## 2. Relationship to the integrated roadmap guide v0.2.1 FULL

This slice implements `layout_persistence_manual_anchors_v0_1` from `docs/AUGNES_INTEGRATED_DEVELOPMENT_ROADMAP_V0_2_1_FULL.md`.

The roadmap guide is not SSOT. It is an operational roadmap, PR sequencing guide, and authority-boundary checklist.

Actual field, type, and enum authority remains with the Project Constellation Runtime Layout Contract, Seeded Constellation Layout Runtime, and the manual anchor store contract in this slice.

## 3. Relationship to PR #788, #789, and #790

This slice follows PR #788, PR #789, and PR #790.

PR #788 defines the Project Constellation layout contract. PR #789 computes deterministic display-only layout candidates. PR #790 renders a read-only UI over caller-provided layout data. This PR adds explicit manual anchor persistence only and does not wire persistence into UI drag/save controls.

## 4. Scope and non-goals

Manual anchor persistence does not mutate durable Perspective state.

Manual anchor persistence does not apply deltas.

Manual anchor persistence does not write Formation Receipts.

Manual anchor persistence does not promote Perspective.

Manual anchor persistence does not create proof/evidence.

Manual anchor persistence does not write claim/evidence records.

Manual anchor persistence does not product-write.

Product-write remains parked by #686.

This PR does not implement layout algorithm changes, seeded layout changes, graph rendering changes, UI drag persistence, UI save controls, route integration into existing UI, durable state mutation, durable Perspective state apply, Formation Receipt write, promotion execution, promotion decision write, proof/evidence creation, claim/evidence writes, product write, product ID allocation, provider/OpenAI calls, prompt sending, retrieval execution, RAG answer generation, source fetch, local/repository/uploaded file reads as source input, Git Ledger export, Codex/GitHub automation, work mutation, background jobs, external network calls, package dependencies, GitHub Actions, raw source body storage, raw provider output storage, raw retrieval output storage, raw layout payload storage, raw manual anchor payload storage, raw conversation storage, hidden reasoning storage, private URL persistence, local private path persistence, or automatic anchor creation from provider/retrieval/RAG/Codex/CI/smoke/feedback/Git refs.

## 5. Manual anchor record shape

A manual anchor record stores a public-safe `anchor_id`, `layout_id`, `perspective_id`, `state_version_ref`, `node_ref`, `anchor_position`, `anchor_reason`, `created_by_ref`, `applies_to_layout_scope`, explicit operator action flags, reason codes, boundary notes, authority boundary, timestamps, and discard lifecycle fields.

Coordinates remain display hints.

Coordinates are not truth.

Coordinates are not proof.

Coordinates are not evidence strength.

Coordinates are not promotion readiness.

Manual anchor records must not store truth score, promotion readiness, evidence strength, source authority, raw/private payload, provider output, retrieval output, product IDs, or product-write authority.

## 6. Store shape

The store helper uses caller-injected DB handles only. Create validates before DB write. Create is atomic across anchor row and activity row.

Read and list return bounded records and authority boundaries. List supports `layout_id`, `perspective_id`, `node_ref`, and `include_discarded` filters.

## 7. Route shape

The route is `GET /api/perspective/layout/manual-anchors` and `POST /api/perspective/layout/manual-anchors`.

POST requires same-origin boundary, a JSON object body, a safe allowlisted local DB path, and valid action/input shape before opening a write DB. The write route may create schema only after same-origin and valid JSON shape.

GET is read-only. GET must not create DB files, create schema, or create directories. Missing DB returns `db_missing`. Missing schema returns `schema_missing`.

## 8. DB schema additions

This slice adds `project_constellation_manual_anchors` and `project_constellation_manual_anchor_activity`.

The anchor table stores public-safe bounded manual anchor records. The activity table stores public-safe lifecycle/audit rows for create, read/list if later recorded, discard, and bounded rejection events.

## 9. Validation and refusal rules

Explicit operator action is required.

Validation rejects missing node refs, private/raw payload markers, non-finite coordinate values, forbidden authority flags, malformed reason-code arrays, unknown reason codes, `explicit_operator_action_required` false, `display_hint_only` false, and `persistence_now` false.

Source refs are lineage pointers, not proof.

Source refs must be public-safe symbolic refs.

## 10. Discard/lifecycle rules

Discarding a manual anchor is lifecycle transition only.

Discarding a manual anchor is not deletion of proof/evidence.

Discard sets `discarded_at` and `discard_reason` and appends bounded activity. It does not hard delete anchor records or mutate durable Perspective state.

## 11. Activity/audit rules

Activity records are public-safe audit rows. Orphan activity writes are rejected and write no row.

Activity rows do not create truth, proof, evidence, promotion readiness, durable Perspective state, product IDs, or product state.

## 12. Authority boundary

Manual anchor persistence only is active.

Manual anchors are display hints only.

Durable state write, durable state apply, Formation Receipt write, promotion execution, promotion decision record write, proof/evidence record write, claim/evidence write, product write, product ID allocation, work mutation, source fetch, local/repository/uploaded file read, provider/OpenAI call, prompt sending, retrieval execution, RAG answer generation, embedding creation, vector search, Git Ledger export, Codex execution authority, GitHub automation authority, manual anchor truth/proof/evidence-strength/promotion-readiness authority, coordinate truth/proof/evidence-strength/promotion-readiness authority, and product-write authority remain false.

## 13. Privacy and redaction rules

The store and route persist bounded labels, symbolic refs, reason codes, authority boundaries, timestamps, and lifecycle summaries only.

Fixtures must not include real private URLs, local user paths, tokens, secrets, raw source text, raw provider output, raw retrieval output, raw layout payload, raw manual anchor payload, hidden reasoning, raw conversation, browser dumps, raw DB rows, actual prompt text, or actual query text.

Blocked examples use bounded placeholder text only.

## 14. Deferred work

Deferred work:

1. Feedback event aggregation runtime
2. Feedback controls expansion
3. Feedback influenced surfacing preview
4. Runtime audit panel integration
5. Dogfooding ingestion
6. Git Ledger export
7. Product write reentry

## 15. Verification expectations

Verification should run the manual anchors smoke, PR #790 Constellation Runtime UI smoke and browser/static validation, PR #789 Seeded Constellation Layout Runtime smoke, PR #788 Project Constellation Runtime Layout Contract smoke, PR #787 Perspective Trajectory Builder smoke, PR #786 Durable Perspective State Apply smoke, PR #785 Formation Receipt smoke, PR #783/#784 promotion decision store smoke, PR #782 promotion contract smoke, PR #781 RAG Context Preview smoke, PR #780 retrieval index runtime smoke, PR #779 retrieval contract smoke, downstream source-intake/provider/review-memory/foundation smokes, `npm run typecheck`, `git diff --check`, and `git diff --cached --check`.

Existing `MODULE_TYPELESS_PACKAGE_JSON` warnings from direct TypeScript imports are acceptable only when commands exit 0.

## 16. Next recommended slices

1. feedback_event_aggregation_runtime_v0_1
2. feedback_controls_expansion_v0_1
3. feedback_influenced_surfacing_preview_v0_1
4. dogfooding_record_runtime_contract_v0_1
5. runtime_audit_panel_v0_1
