# Project Constellation Runtime UI Completion v0.1

## Purpose

This slice implements `constellation_runtime_ui_runtime_completion_v0_1` as a runtime completion for original Phase 5.3 constellation UI requirements.

This slice closes the original Phase 5.3 runtime UI gap by binding constellation UI to bounded runtime read/preview sources where available.

## Roadmap Relationship

This work follows `docs/AUGNES_INTEGRATED_DEVELOPMENT_ROADMAP_V0_2_1_FULL.md` for Phase 5.3 implementation guidance. The roadmap guide is not SSOT.

## Relationship To Earlier Constellation Runtime UI v0.1

The earlier Constellation Runtime UI remains compatible but was primarily caller-provided layout inspection. It rendered public-safe layout props without route reads. This completion preserves that props-only mode and adds a runtime data panel that reads bounded runtime sources.

## Relationship To Runtime Layout Contract And Seeded Layout Runtime

The Runtime Layout Contract defines the layout shape and boundary vocabulary. Seeded Layout Runtime still provides deterministic display-only layout results. This UI consumes layout results and runtime read responses as a view model. Layout coordinates are display hints, not truth.

## Relationship To Manual Anchors

Manual anchors are display hints, not truth. This UI may preview anchors through `GET /api/perspective/layout/manual-anchors`. This UI does not write manual anchors.

## Relationship To Durable Perspective State And Trajectory

This UI may read durable Perspective state through `GET /api/perspective/state/[perspective_id]` and trajectory through `GET /api/perspective/state/[perspective_id]/trajectory`. Foundation state is orientation for the graph. Trajectory is selected-node review context, not execution authority.

## Relationship To RAG Context Preview Runtime Completion

This UI may call `POST /api/research-retrieval/rag-context-preview` because that route is read-only preview over DB-backed retrieval search. RAG context is not truth, proof, accepted evidence, or promotion readiness.

## UI Surfaces

`components/perspective/constellation-runtime-data-panel.tsx` is mounted in `components/augnes-cockpit.tsx` for the Project Constellation cockpit surface. It wraps the existing `ConstellationRuntimeView` and `ConstellationInspector` with read-only runtime route controls, bounded route status display, and authority boundary display.

The mounted cockpit surface receives the existing public-safe seeded layout fixture so durable graph and candidate overlay layers are visible before route reads succeed. The view-model builder also supports a no-layout runtime-response fallback that derives display/read-model-only nodes, markers, source provenance refs, manual anchor previews, selected-node trajectory preview, and selected-node context preview from loaded bounded route responses.

## Runtime Data Source Policy

The runtime data panel uses only bounded same-origin runtime reads/previews:

- `GET /api/perspective/state/[perspective_id]`
- `GET /api/perspective/state/[perspective_id]/trajectory`
- `GET /api/perspective/layout/manual-anchors`
- `POST /api/research-retrieval/rag-context-preview`

The RAG context preview POST is allowed here because it creates a bounded read-only preview and does not write DB or generate an answer.

## View Model Shape

The runtime view model includes `view_model_version`, `scope`, `perspective_id`, `state_version_ref`, durable nodes, candidate overlay nodes, edges, source provenance refs, tension/gap/stale/bridge markers, manual anchor previews, layout diagnostics, selected node trajectory preview, selected node RAG context preview, bounded errors, authority boundary, and reason codes.

## Layer Separation Policy

Durable graph layer is read-only orientation. Candidate overlay layer is not durable state. Manual anchors are display hints. Layout diagnostics are advisory. Selected trajectory/context preview is review context only. Runtime-response fallback nodes are display/read-model nodes only; they are not truth, proof, accepted evidence, durable state mutation, promotion, or product-write.

## Source Provenance Policy

Source refs are lineage pointers, not proof. Source provenance inspector displays symbolic refs and bounded summaries only. It does not fetch sources or store raw source bodies.

## Marker Policy

Tension, gap, stale, and bridge markers must remain visible. The UI must not hide unresolved tension silently.

## Manual Anchor Preview Policy

Manual anchor preview is display-only. This UI does not edit coordinates, save coordinates, write anchors, or persist layout.

## Selected Node Preview Policy

Selected node trajectory preview and selected node context preview are bounded review aids. Retrieval result is not evidence. Retrieval score is not truth score or promotion readiness.

## Forbidden Controls

This UI must not expose edit coordinates, save coordinates, save anchor, promote, create proof, create evidence, delete evidence, hide tension, create work item, execute Codex, product-write, create product, allocate product ID, GitHub PR, or Git commit controls.

## Authority Boundary

Allowed true fields are:

- `constellation_runtime_ui_completion_now`
- `readonly_runtime_ui_now`
- `durable_graph_layer_visible`
- `candidate_overlay_layer_visible`
- `source_provenance_inspector_visible`
- `tension_gap_stale_bridge_markers_visible`
- `manual_anchor_preview_visible`
- `layout_diagnostics_visible`
- `selected_node_trajectory_preview_visible`
- `selected_node_context_preview_visible`
- `same_origin_runtime_reads_only`

Forbidden capabilities remain false. This UI is read-only. This UI does not edit coordinates. This UI does not write manual anchors. This UI does not directly write DB. This UI does not directly write files. This UI does not call providers. This UI does not send prompts. This UI does not fetch sources. This UI does not write retrieval indexes. This UI does not generate RAG answers. This UI does not create proof/evidence. This UI does not write claim/evidence records. This UI does not create work items. This UI does not promote Perspective. This UI does not write/apply durable Perspective state. This UI does not write Formation Receipts. This UI does not execute Git Ledger export runtime. This UI does not execute Git or call GitHub. This UI does not execute Codex. This UI does not export/import files. This UI does not product-write. This UI does not allocate product IDs.

Product-write remains parked by #686.

Layout coordinates are display hints, not truth. Manual anchors are display hints, not truth. Salience score is not truth. Candidate overlay is not durable state. RAG context is not truth. Retrieval result is not evidence. Source refs are lineage pointers, not proof. Smoke/CI pass is not truth.

## Fixture Policy

`fixtures/project-constellation-runtime-ui-completion.sample.v0.1.json` uses public-safe symbolic refs only. It includes mounted cockpit layout seed coverage and no-layout runtime-response fallback coverage. Safe blocked placeholders appear only inside bounded error examples.

## Verification Expectations

`scripts/smoke-project-constellation-runtime-ui-completion-v0-1.mjs` verifies docs, fixture, package script, index pointer, roadmap Phase 5.3 requirements, runtime source files, cockpit mount wiring with a non-empty layout seed, no-layout runtime-response fallback, component/view-model files, runtime route path binding, layer/marker/source/preview rendering, authority boundary, forbidden control absence, privacy markers, and compatibility with existing constellation, manual anchor, RAG context preview, durable state, and trajectory smokes.

## Deferred Work

Browser automation is deferred unless a mounted page harness is available for this surface. Layout persistence, manual anchor writing from this UI, coordinate editing, RAG answer generation, provider calls, retrieval index writes, proof/evidence creation, promotion, durable state apply, Formation Receipt writes, Git/GitHub/Codex execution, product-write, and product ID allocation remain out of scope.
