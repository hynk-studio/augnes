import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { pathToFileURL } from "node:url";

const roadmapPath = "docs/AUGNES_INTEGRATED_DEVELOPMENT_ROADMAP_V0_2_1_FULL.md";
const docsPath = "docs/PROJECT_CONSTELLATION_RUNTIME_UI_COMPLETION_V0_1.md";
const legacyDocsPath = "docs/PROJECT_CONSTELLATION_RUNTIME_UI_V0_1.md";
const fixturePath = "fixtures/project-constellation-runtime-ui-completion.sample.v0.1.json";
const legacyFixturePath = "fixtures/project-constellation-runtime-ui.sample.v0.1.json";
const packagePath = "package.json";
const indexPath = "docs/00_INDEX_LATEST.md";
const viewPath = "components/perspective/constellation-runtime-view.tsx";
const nodePath = "components/perspective/constellation-node.tsx";
const edgePath = "components/perspective/constellation-edge.tsx";
const inspectorPath = "components/perspective/constellation-inspector.tsx";
const togglePath = "components/perspective/candidate-overlay-toggle.tsx";
const dataPanelPath = "components/perspective/constellation-runtime-data-panel.tsx";
const cockpitPath = "components/augnes-cockpit.tsx";
const viewModelPath = "lib/perspective/layout/build-runtime-constellation-view-model.ts";
const stateRoutePath = "app/api/perspective/state/[perspective_id]/route.ts";
const trajectoryRoutePath = "app/api/perspective/state/[perspective_id]/trajectory/route.ts";
const manualAnchorRoutePath = "app/api/perspective/layout/manual-anchors/route.ts";
const ragPreviewRoutePath = "app/api/research-retrieval/rag-context-preview/route.ts";
const globalsPath = "app/globals.css";

const uiVersion = "constellation_runtime_ui_runtime_completion.v0.1";
const viewModelVersion = "constellation_runtime_ui_view_model.v0.1";
const scope = "project:augnes";
const packageScriptName = "smoke:project-constellation-runtime-ui-completion-v0-1";
const packageScriptValue =
  "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json scripts/smoke-project-constellation-runtime-ui-completion-v0-1.mjs";

const requiredFixtureKeys = [
  "fixture_version",
  "ui_version",
  "view_model_version",
  "scope",
  "runtime_data_source_examples",
  "view_model_example",
  "durable_graph_layer_example",
  "candidate_overlay_layer_example",
  "source_provenance_inspector_example",
  "tension_gap_stale_bridge_marker_examples",
  "manual_anchor_preview_example",
  "layout_diagnostics_example",
  "selected_node_trajectory_preview_example",
  "selected_node_rag_context_preview_example",
  "mounted_cockpit_layout_seed_example",
  "no_layout_runtime_response_fallback_example",
  "bounded_error_examples",
  "forbidden_control_examples",
  "authority_boundary_sample",
];

const allowedTrueBoundaryFields = [
  "constellation_runtime_ui_completion_now",
  "readonly_runtime_ui_now",
  "durable_graph_layer_visible",
  "candidate_overlay_layer_visible",
  "source_provenance_inspector_visible",
  "tension_gap_stale_bridge_markers_visible",
  "manual_anchor_preview_visible",
  "layout_diagnostics_visible",
  "selected_node_trajectory_preview_visible",
  "selected_node_context_preview_visible",
  "same_origin_runtime_reads_only",
];

const forbiddenFalseBoundaryFields = [
  "coordinate_edit_write_now",
  "manual_anchor_write_now",
  "direct_db_access_from_ui_now",
  "direct_file_write_from_ui_now",
  "provider_openai_call_now",
  "prompt_sent_now",
  "source_fetch_now",
  "retrieval_index_write_now",
  "rag_answer_generation_now",
  "proof_or_evidence_record_now",
  "claim_or_evidence_write_now",
  "work_item_write_now",
  "promotion_execution_now",
  "durable_state_write_now",
  "durable_state_apply_now",
  "formation_receipt_write_now",
  "product_write_now",
  "product_write_runtime_now",
  "product_write_adapter_enabled_now",
  "product_id_allocation_now",
  "product_persistence_now",
  "git_ledger_export_runtime_now",
  "git_write_now",
  "github_api_call_now",
  "github_pr_create_now",
  "github_merge_now",
  "repository_file_write_now",
  "local_file_export_now",
  "local_file_import_now",
  "codex_execution_now",
  "codex_execution_authority",
  "github_automation_authority",
  "product_write_authority",
  "layout_coordinate_is_truth",
  "manual_anchor_is_truth",
  "salience_score_is_truth",
  "layout_view_is_promotion",
  "candidate_overlay_is_durable_state",
  "rag_context_is_truth",
  "retrieval_result_is_evidence",
  "source_ref_is_proof",
  "smoke_pass_is_truth",
  "ci_pass_is_truth",
];

const forbiddenControlTexts = [
  "Edit coordinates",
  "Save coordinates",
  "Save anchor",
  "Promote",
  "Create proof",
  "Create evidence",
  "Delete evidence",
  "Hide tension",
  "Create work item",
  "Execute Codex",
  "Product write",
  "Create product",
  "Allocate product ID",
  "GitHub PR",
  "Git commit",
];

const runtimeComponentPaths = new Set([viewPath, nodePath, edgePath, inspectorPath, togglePath, dataPanelPath]);

for (const filePath of [
  roadmapPath,
  docsPath,
  legacyDocsPath,
  fixturePath,
  legacyFixturePath,
  packagePath,
  indexPath,
  viewPath,
  nodePath,
  edgePath,
  inspectorPath,
  togglePath,
  dataPanelPath,
  cockpitPath,
  viewModelPath,
  stateRoutePath,
  trajectoryRoutePath,
  manualAnchorRoutePath,
  ragPreviewRoutePath,
  globalsPath,
]) {
  assert.ok(existsSync(filePath), `${filePath} must exist`);
}

const roadmapText = normalize(readText(roadmapPath));
const docsText = normalize(readText(docsPath));
const legacyDocsText = normalize(readText(legacyDocsPath));
const fixtureText = readText(fixturePath);
const fixture = JSON.parse(fixtureText);
const legacyFixture = JSON.parse(readText(legacyFixturePath));
const packageJson = JSON.parse(readText(packagePath));
const indexText = normalize(readText(indexPath));
const sourceByPath = new Map(
  [viewPath, nodePath, edgePath, inspectorPath, togglePath, dataPanelPath, cockpitPath, viewModelPath, globalsPath].map((filePath) => [
    filePath,
    readText(filePath),
  ]),
);
const componentSource = [viewPath, nodePath, edgePath, inspectorPath, togglePath, dataPanelPath]
  .map((filePath) => sourceByPath.get(filePath))
  .join("\n");
const completionSource = [dataPanelPath, viewModelPath, viewPath, inspectorPath]
  .map((filePath) => sourceByPath.get(filePath))
  .join("\n");
const cockpitSource = sourceByPath.get(cockpitPath);

const viewModelLib = await import(pathToFileURL(viewModelPath).href);

assertRoadmapAndDocs();
assertFixture();
assertPackageAndIndex();
assertRuntimeSourceFiles();
assertViewModelBuilder();
assertComponentSource();
assertChangedFileScope();
runExistingSmokes();

console.log(
  JSON.stringify(
    {
      smoke: "project-constellation-runtime-ui-completion-v0-1",
      final_status: "pass",
      ui_version: uiVersion,
      view_model_version: viewModelVersion,
      scope,
      runtime_routes_bound: 4,
    },
    null,
    2,
  ),
);

function assertRoadmapAndDocs() {
  for (const phrase of [
    "## PR 5.3: `constellation_runtime_ui_v0_1`",
    "durable graph layer",
    "candidate overlay layer",
    "source provenance inspector",
    "tension/gap/stale/bridge markers",
    "manual anchor preview",
    "read-only layout diagnostics",
    "selected node trajectory/context preview",
    "coordinate edit as truth",
    "promote from layout without review gate",
    "delete evidence from graph",
    "hide unresolved tension silently",
    "product write",
  ]) {
    assertIncludes(roadmapText, phrase, `roadmap contains ${phrase}`);
  }
  assertIncludes(legacyDocsText, "caller-provided Project Constellation layout results", "legacy docs identify caller-provided UI");
  for (const phrase of [
    "This slice closes the original Phase 5.3 runtime UI gap by binding constellation UI to bounded runtime read/preview sources where available.",
    "The earlier Constellation Runtime UI remains compatible but was primarily caller-provided layout inspection.",
    "This UI is read-only.",
    "This UI does not edit coordinates.",
    "This UI does not write manual anchors.",
    "This UI does not directly write DB.",
    "This UI does not directly write files.",
    "This UI does not call providers.",
    "This UI does not send prompts.",
    "This UI does not fetch sources.",
    "This UI does not write retrieval indexes.",
    "This UI does not generate RAG answers.",
    "This UI does not create proof/evidence.",
    "This UI does not write claim/evidence records.",
    "This UI does not create work items.",
    "This UI does not promote Perspective.",
    "This UI does not write/apply durable Perspective state.",
    "This UI does not write Formation Receipts.",
    "This UI does not execute Git Ledger export runtime.",
    "This UI does not execute Git or call GitHub.",
    "This UI does not execute Codex.",
    "This UI does not export/import files.",
    "This UI does not product-write.",
    "This UI does not allocate product IDs.",
    "Product-write remains parked by #686.",
    "Layout coordinates are display hints, not truth.",
    "Manual anchors are display hints, not truth.",
    "Salience score is not truth.",
    "Candidate overlay is not durable state.",
    "RAG context is not truth.",
    "Retrieval result is not evidence.",
    "Source refs are lineage pointers, not proof.",
    "Smoke/CI pass is not truth.",
    "The roadmap guide is not SSOT.",
  ]) {
    assertIncludes(docsText, phrase, `docs contain ${phrase}`);
  }
}

function assertFixture() {
  for (const key of requiredFixtureKeys) {
    assert.ok(Object.hasOwn(fixture, key), `fixture includes ${key}`);
  }
  assert.equal(fixture.fixture_version, "project_constellation_runtime_ui_completion.sample.v0.1");
  assert.equal(fixture.ui_version, uiVersion);
  assert.equal(fixture.view_model_version, viewModelVersion);
  assert.equal(fixture.scope, scope);
  assert.deepEqual(fixture.forbidden_control_examples, forbiddenControlTexts);
  for (const field of allowedTrueBoundaryFields) {
    assert.equal(fixture.authority_boundary_sample[field], true, `${field} true in fixture authority`);
    assert.equal(fixture.view_model_example.authority_boundary[field], true, `${field} true in view model example`);
  }
  for (const field of forbiddenFalseBoundaryFields) {
    assert.equal(fixture.authority_boundary_sample[field], false, `${field} false in fixture authority`);
    assert.equal(fixture.view_model_example.authority_boundary[field], false, `${field} false in view model example`);
  }
  assert.equal(fixture.runtime_data_source_examples.durable_state_read.route, "/api/perspective/state/[perspective_id]");
  assert.equal(fixture.runtime_data_source_examples.trajectory_read.route, "/api/perspective/state/[perspective_id]/trajectory");
  assert.equal(fixture.runtime_data_source_examples.manual_anchor_read.route, "/api/perspective/layout/manual-anchors");
  assert.equal(fixture.runtime_data_source_examples.rag_context_preview.route, "/api/research-retrieval/rag-context-preview");
  assert.equal(
    fixture.mounted_cockpit_layout_seed_example.seed_fixture,
    "fixtures/project-constellation-runtime-ui.sample.v0.1.json",
  );
  assert.equal(fixture.mounted_cockpit_layout_seed_example.seed_path, "expected_props.layoutResult");
  assert.ok(fixture.mounted_cockpit_layout_seed_example.durable_nodes_min > 0);
  assert.ok(fixture.mounted_cockpit_layout_seed_example.candidate_overlay_nodes_min > 0);
  assert.equal(fixture.mounted_cockpit_layout_seed_example.display_read_model_only, true);
  assert.equal(fixture.no_layout_runtime_response_fallback_example.input.layout_result, null);
  assert.ok(fixture.no_layout_runtime_response_fallback_example.expected_output.durable_nodes_min > 0);
  assert.ok(fixture.no_layout_runtime_response_fallback_example.expected_output.candidate_overlay_nodes_min > 0);
  assert.ok(fixture.no_layout_runtime_response_fallback_example.expected_output.source_provenance_refs_min > 0);
  assertSafeDbPath(fixture.runtime_data_source_examples.durable_state_read.db_path, [".tmp/perspective-state/", "tmp/perspective-state/"]);
  assertSafeDbPath(fixture.runtime_data_source_examples.manual_anchor_read.db_path, [
    ".tmp/project-constellation-manual-anchors/",
    "tmp/project-constellation-manual-anchors/",
  ]);
  assertSafeDbPath(fixture.runtime_data_source_examples.rag_context_preview.db_path, [
    ".tmp/research-retrieval/",
    "tmp/research-retrieval/",
  ]);
  assertFixtureSafety();
}

function assertPackageAndIndex() {
  assert.equal(packageJson.scripts?.[packageScriptName], packageScriptValue);
  const indexBlock = extractIndexBlock(indexText, "Project Constellation Runtime UI Completion v0.1");
  for (const pointer of [
    docsPath,
    cockpitPath,
    viewPath,
    dataPanelPath,
    viewModelPath,
    fixturePath,
    "scripts/smoke-project-constellation-runtime-ui-completion-v0-1.mjs",
  ]) {
    assertIncludes(indexBlock, pointer, `index points to ${pointer}`);
  }
  assertIncludes(indexBlock, "constellation_runtime_ui_runtime_completion_v0_1", "index names slice");
  assertIncludes(indexBlock, "bounded runtime read/preview sources", "index says runtime source binding");
  assertIncludes(indexBlock, "Product-write remains parked by #686", "index keeps product-write parked");
}

function assertRuntimeSourceFiles() {
  assertIncludes(readText(stateRoutePath), "export async function GET", "state route has GET");
  assertIncludes(readText(trajectoryRoutePath), "export async function GET", "trajectory route has GET");
  assertIncludes(readText(manualAnchorRoutePath), "export async function GET", "manual anchor route has GET");
  assertIncludes(readText(ragPreviewRoutePath), "export async function POST", "rag context route has POST");
}

function assertViewModelBuilder() {
  for (const exportedName of [
    "buildRuntimeConstellationViewModelV01",
    "createConstellationRuntimeUiCompletionAuthorityBoundaryV01",
    "CONSTELLATION_RUNTIME_UI_COMPLETION_UI_VERSION_V01",
    "CONSTELLATION_RUNTIME_UI_COMPLETION_VIEW_MODEL_VERSION_V01",
  ]) {
    assert.equal(typeof viewModelLib[exportedName], exportedName.startsWith("CONSTELLATION") ? "string" : "function");
  }
  const built = viewModelLib.buildRuntimeConstellationViewModelV01({
    layout_result: legacyFixture.expected_props.layoutResult,
    selected_node_ref: legacyFixture.expected_props.selectedRef,
    manual_anchor_response: {
      status: "ok",
      error_code: null,
      result: {
        records: [
          {
            anchor_id: "anchor:runtime-ui-smoke:001",
            node_ref: legacyFixture.expected_props.selectedRef,
            anchor_reason: "Operator display hint for runtime UI smoke.",
            anchor_position: { x: 120, y: 160, z: 0 },
          },
        ],
      },
    },
    trajectory_response: {
      status: "ok",
      error_code: null,
      trajectory: {
        events: [
          {
            event_id: "trajectory:event:runtime-ui-smoke:001",
            event_kind: "review_record_saved",
            layer: "review_memory",
            occurred_at: "2026-06-28T00:00:00.000Z",
            subject_ref: "review-record-ref:runtime-ui:001",
            bounded_summary: "Selected node has bounded review memory context.",
            source_refs: ["source-ref:runtime-ui:002"],
            candidate_refs: ["candidate-ref:runtime-ui:001"],
            review_record_refs: ["review-record-ref:runtime-ui:001"],
            reason_codes: ["trajectory_is_read_only"],
          },
        ],
      },
    },
    rag_context_preview_response: {
      status: "ok",
      error_code: null,
      result: {
        status: "context_preview_created",
        context_item_count: 1,
        context_char_count: 86,
        retrieved_refs: [{ source_ref_id: "source-ref:runtime-ui:002" }],
        included_context_summaries: [
          {
            context_ref: "context:runtime-ui-smoke:001",
            source_ref_id: "source-ref:runtime-ui:002",
            bounded_title: "Runtime UI context",
            bounded_context_summary: "Bounded runtime context preview for selected node.",
            candidate_or_durable_marker: "candidate_context",
            stale_marker: "fresh",
            retrieval_score: 4,
          },
        ],
        excluded_context_reasons: [],
        staleness_warnings: [],
        unresolved_tensions: [],
        knowledge_gaps: [],
      },
    },
  });
  assert.equal(built.view_model_version, viewModelVersion);
  assert.equal(built.ui_version, uiVersion);
  assert.ok(built.durable_nodes.length > 0, "view model includes durable graph layer");
  assert.ok(built.candidate_overlay_nodes.length > 0, "view model includes candidate overlay layer");
  assert.ok(built.source_provenance_refs.length > 0, "view model includes source provenance refs");
  assert.ok(built.manual_anchor_previews.length > 0, "view model includes manual anchor preview");
  assert.ok(built.layout_diagnostics.length > 0, "view model includes diagnostics");
  assert.ok(built.selected_node_trajectory_preview.event_count > 0, "view model includes selected trajectory preview");
  assert.ok(
    built.selected_node_rag_context_preview.included_context_summaries.length > 0,
    "view model includes selected context preview",
  );
  for (const field of allowedTrueBoundaryFields) {
    assert.equal(built.authority_boundary[field], true, `built authority ${field} true`);
  }
  for (const field of forbiddenFalseBoundaryFields) {
    assert.equal(built.authority_boundary[field], false, `built authority ${field} false`);
  }
  const fallbackInput = fixture.no_layout_runtime_response_fallback_example.input;
  const fallbackBuilt = viewModelLib.buildRuntimeConstellationViewModelV01({
    layout_result: null,
    durable_state_read_response: fallbackInput.durable_state_read_response,
    trajectory_response: fallbackInput.trajectory_response,
    manual_anchor_response: fallbackInput.manual_anchor_response,
    rag_context_preview_response: fallbackInput.rag_context_preview_response,
  });
  assert.equal(fallbackBuilt.view_model_version, viewModelVersion);
  assert.ok(
    fallbackBuilt.durable_nodes.length >= fixture.no_layout_runtime_response_fallback_example.expected_output.durable_nodes_min,
    "no-layout runtime fallback includes durable graph nodes",
  );
  assert.ok(
    fallbackBuilt.candidate_overlay_nodes.length >=
      fixture.no_layout_runtime_response_fallback_example.expected_output.candidate_overlay_nodes_min,
    "no-layout runtime fallback includes candidate overlay nodes",
  );
  assert.ok(
    fallbackBuilt.source_provenance_refs.length >=
      fixture.no_layout_runtime_response_fallback_example.expected_output.source_provenance_refs_min,
    "no-layout runtime fallback includes source provenance refs",
  );
  assert.ok(
    fallbackBuilt.selected_node_trajectory_preview.event_count >=
      fixture.no_layout_runtime_response_fallback_example.expected_output.selected_node_trajectory_event_count_min,
    "no-layout runtime fallback includes selected trajectory preview",
  );
  assert.ok(
    fallbackBuilt.selected_node_rag_context_preview.context_item_count >=
      fixture.no_layout_runtime_response_fallback_example.expected_output.selected_node_context_item_count_min,
    "no-layout runtime fallback includes selected context preview",
  );
  assert.ok(fallbackBuilt.tension_markers.length > 0, "no-layout runtime fallback includes tension markers");
  assert.ok(fallbackBuilt.gap_markers.length > 0, "no-layout runtime fallback includes gap markers");
  assert.ok(fallbackBuilt.stale_markers.length > 0, "no-layout runtime fallback includes stale markers");
  assert.ok(fallbackBuilt.bridge_markers.length > 0, "no-layout runtime fallback includes bridge markers");
  assertIncludes(
    fallbackBuilt.reason_codes.join(" "),
    "no_layout_runtime_response_fallback",
    "fallback build records no-layout fallback reason",
  );
  assert.equal(fallbackBuilt.authority_boundary.layout_coordinate_is_truth, false);
  assert.equal(fallbackBuilt.authority_boundary.candidate_overlay_is_durable_state, false);
  assert.equal(fallbackBuilt.authority_boundary.rag_context_is_truth, false);
  assert.equal(fallbackBuilt.authority_boundary.retrieval_result_is_evidence, false);
}

function assertComponentSource() {
  assertIncludes(cockpitSource, "ConstellationRuntimeDataPanel", "cockpit imports runtime data panel");
  assertIncludes(cockpitSource, "projectConstellationRuntimeUiFixture", "cockpit imports mounted layout seed fixture");
  assertIncludes(
    cockpitSource,
    "layoutResult={projectConstellationRuntimeUiLayoutResult}",
    "cockpit passes seeded layout result to mounted runtime panel",
  );
  assertIncludes(
    cockpitSource,
    "project-constellation-runtime-ui-completion-section",
    "cockpit renders runtime UI completion section",
  );
  assertIncludes(
    cockpitSource,
    "Project Constellation runtime UI completion read-only source binding",
    "cockpit exposes runtime UI completion surface",
  );
  for (const phrase of [
    "durable graph layer",
    "candidate overlay layer",
    "Runtime source provenance inspector",
    "tension/gap/stale/bridge markers visible",
    "manual anchor preview",
    "layout diagnostics",
    "selected node trajectory preview",
    "selected node context preview",
    "Authority boundary",
    "Product-write remains parked by #686",
  ]) {
    assertIncludes(completionSource, phrase, `component renders ${phrase}`);
  }
  for (const field of allowedTrueBoundaryFields) {
    assertIncludes(viewModelSource(), field, `view model includes ${field}`);
  }
  for (const field of forbiddenFalseBoundaryFields) {
    assertIncludes(viewModelSource(), field, `view model includes ${field}`);
  }
  for (const forbiddenText of forbiddenControlTexts) {
    assert.ok(!componentSource.includes(forbiddenText), `component must not include forbidden control ${forbiddenText}`);
  }
  assertAllowedRuntimeRoutesOnly();
  assertNoDirectDbOrFileAccess();
  assertNoForbiddenRuntimeCode();
  assertIncludes(completionSource, "fetchBoundedJson(", "runtime panel fetch helper exists");
  assertIncludes(
    viewModelSource(),
    "no_layout_runtime_response_fallback",
    "view model supports no-layout runtime response fallback",
  );
  assertIncludes(
    viewModelSource(),
    "runtime_response_display_nodes_only",
    "fallback nodes are marked display/read-model only",
  );
  assertIncludes(completionSource, "GET /api/perspective/state/[perspective_id]", "runtime panel shows state route");
  assertIncludes(completionSource, "GET /api/perspective/state/[perspective_id]/trajectory", "runtime panel shows trajectory route");
  assertIncludes(completionSource, "GET /api/perspective/layout/manual-anchors", "runtime panel shows manual anchor route");
  assertIncludes(completionSource, "POST /api/research-retrieval/rag-context-preview", "runtime panel shows rag context preview route");
}

function assertAllowedRuntimeRoutesOnly() {
  const allowedPrefixes = [
    "/api/perspective/state/",
    "/api/perspective/layout/manual-anchors",
    "/api/research-retrieval/rag-context-preview",
  ];
  const routeMatches = Array.from(componentSource.matchAll(/["'`]((?:\/api\/)[^"'`?)]*)/g)).map((match) => match[1]);
  assert.ok(routeMatches.length >= 4, "component source includes runtime route paths");
  for (const routePath of routeMatches) {
    assert.ok(
      allowedPrefixes.some((prefix) => routePath.startsWith(prefix)),
      `unexpected route path ${routePath}`,
    );
  }
  assert.ok(!componentSource.includes("/api/research-retrieval/rebuild"), "component does not rebuild retrieval index");
  assert.ok(!componentSource.includes("/api/perspective/state/apply-delta"), "component does not apply durable state");
}

function assertNoDirectDbOrFileAccess() {
  for (const [filePath, source] of sourceByPath.entries()) {
    if (!runtimeComponentPaths.has(filePath)) continue;
    const imports = getImportSpecifiers(source);
    for (const forbiddenImport of ["better-sqlite3", "node:fs", "fs", "node:path", "path"]) {
      assert.ok(
        !imports.some((specifier) => specifier === forbiddenImport || specifier.includes(forbiddenImport)),
        `${filePath} must not import ${forbiddenImport}`,
      );
    }
  }
}

function assertNoForbiddenRuntimeCode() {
  for (const [filePath, source] of sourceByPath.entries()) {
    if (!runtimeComponentPaths.has(filePath)) continue;
    for (const forbiddenPattern of [
      /openai\./i,
      /provider.*call/i,
      /sourceFetch/i,
      /writeFile/i,
      /appendFile/i,
      /rebuildResearchRetrieval/i,
      /rag_answer/i,
      /createProof/i,
      /createEvidence/i,
      /promotePerspective/i,
      /productWrite/i,
      /allocateProduct/i,
      /github/i,
      /codex.*execute/i,
    ]) {
      assert.doesNotMatch(source, forbiddenPattern, `${filePath} must not include ${forbiddenPattern}`);
    }
  }
}

function assertChangedFileScope() {
  const changed = changedFilesAgainstMain();
  assert.ok(
    !changed.some(
      (filePath) =>
        filePath.startsWith("app/api/") &&
        !isManualAnchorRuntimeCompletionFile(filePath) &&
        !isFeedbackEventAggregationRuntimeCompletionFile(filePath) &&
        !isFeedbackControlsExpansionRuntimeCompletionFile(filePath) &&
        !isFeedbackInfluencedSurfacingPreviewRuntimeCompletionFile(filePath) &&
        !isRuntimeAuditPanelRuntimeCompletionFile(filePath) &&
        !isRuntimeAuditSelectedRouteInstrumentationV02File(filePath) &&
        !isRuntimeAuditSelectedRouteInstrumentationV03File(filePath) &&
        !isRuntimeAuditSelectedRouteInstrumentationV04Phase4File(filePath) &&
        !isProductWriteAcceptedEvidenceRefRuntimeV01File(filePath),
    ),
    "no new app/api route was added",
  );
  assert.ok(
    !changed.includes("lib/db/schema.sql") || isManualAnchorRuntimeCompletionFile("lib/db/schema.sql"),
    "DB schema must not be modified outside manual anchor runtime completion",
  );
  assert.ok(
    !changed.some(
      (filePath) =>
        /provider|retrieval-index-write|github|git-ledger|codex-execution|product-write|product-id/i.test(filePath) &&
        !isExpectedCompletionFile(filePath) &&
        !isFeedbackEventAggregationRuntimeCompletionFile(filePath) &&
        !isFeedbackControlsExpansionRuntimeCompletionFile(filePath) &&
        !isFeedbackInfluencedSurfacingPreviewRuntimeCompletionFile(filePath) &&
        !isRuntimeAuditPanelRuntimeCompletionFile(filePath) &&
        !isRuntimeAuditSelectedRouteInstrumentationV02File(filePath) &&
        !isRuntimeAuditSelectedRouteInstrumentationV03File(filePath) &&
        !isRuntimeAuditSelectedRouteInstrumentationV04Phase4File(filePath) &&
        !isProductWriteAcceptedEvidenceRefRuntimeV01File(filePath),
    ),
    "no provider/retrieval-index-write/Git/GitHub/Codex/product-write/product ID files were added",
  );
}

function assertFixtureSafety() {
  const markers = [
    "SAFE_MARKER_PRIVATE_URL",
    "SAFE_MARKER_LOCAL_PRIVATE_PATH",
    "SAFE_MARKER_SECRET_TOKEN",
    "SAFE_MARKER_RAW_SOURCE_BODY",
    "SAFE_MARKER_RAW_PROVIDER_OUTPUT",
    "SAFE_MARKER_RAW_RETRIEVAL_OUTPUT",
    "SAFE_MARKER_PROVIDER_THREAD_ID",
    "SAFE_MARKER_RAW_CONVERSATION",
    "SAFE_MARKER_HIDDEN_REASONING",
    "SAFE_MARKER_RAW_DB_ROW",
    "SAFE_MARKER_RAW_DIFF",
    "SAFE_MARKER_TELEMETRY_DUMP",
  ];
  for (const marker of markers) {
    for (const path of pathsContaining(fixture, marker)) {
      assert.match(path, /^bounded_error_examples\./, `${marker} may appear only inside bounded error examples`);
    }
  }
  assert.doesNotMatch(fixtureText, /\/Users\/|\/home\/|file:\/\/|sk-[A-Za-z0-9]|ghp_[A-Za-z0-9]/);
  assert.doesNotMatch(fixtureText, /\b(thread|run|session)_[A-Za-z0-9_-]{8,}/);
}

function assertSafeDbPath(value, allowedPrefixes) {
  assert.equal(typeof value, "string", "DB path must be a string");
  assert.ok(value.endsWith(".sqlite") || value.endsWith(".db"), "DB path must use SQLite suffix");
  assert.ok(allowedPrefixes.some((prefix) => value.startsWith(prefix)), `${value} must use allowed prefix`);
  assert.ok(!value.includes(".."), "DB path must not include parent traversal");
  assert.ok(!value.includes("\\"), "DB path must not include backslashes");
}

function runExistingSmokes() {
  for (const scriptName of [
    "smoke:project-constellation-runtime-ui-v0-1",
    "smoke:project-constellation-manual-anchors-v0-1",
    "smoke:rag-context-preview-runtime-completion-v0-1",
    "smoke:durable-perspective-state-apply-v0-1",
    "smoke:perspective-trajectory-v0-1",
  ]) {
    execFileSync("npm", ["run", scriptName], { stdio: "pipe" });
  }
}

function isExpectedCompletionFile(filePath) {
  return [
    docsPath,
    fixturePath,
    dataPanelPath,
    viewModelPath,
    viewPath,
    inspectorPath,
    globalsPath,
    "scripts/smoke-project-constellation-runtime-ui-completion-v0-1.mjs",
    packagePath,
    indexPath,
  ].includes(filePath);
}

function isManualAnchorRuntimeCompletionFile(filePath) {
  return [
    "lib/perspective/layout/manual-anchor-store.ts",
    "app/api/perspective/layout/manual-anchors/route.ts",
    "lib/db/schema.sql",
    "docs/PROJECT_CONSTELLATION_MANUAL_ANCHORS_RUNTIME_COMPLETION_V0_1.md",
    "fixtures/project-constellation-manual-anchors-runtime-completion.sample.v0.1.json",
    "scripts/smoke-project-constellation-manual-anchors-runtime-completion-v0-1.mjs",
    packagePath,
    indexPath,
  ].includes(filePath);
}

function isFeedbackEventAggregationRuntimeCompletionFile(filePath) {
  return [
    "lib/research-candidate-review/feedback-event-aggregation-runtime.ts",
    "app/api/research-candidate/feedback-events/aggregation/route.ts",
    "docs/FEEDBACK_EVENT_AGGREGATION_RUNTIME_COMPLETION_V0_1.md",
    "fixtures/feedback-event-aggregation-runtime-completion.sample.v0.1.json",
    "scripts/smoke-feedback-event-aggregation-runtime-completion-v0-1.mjs",
    packagePath,
    indexPath,
  ].includes(filePath);
}

function isFeedbackControlsExpansionRuntimeCompletionFile(filePath) {
  return [
    "components/feedback-event-expanded-controls.tsx",
    "app/api/research-candidate/feedback-events/route.ts",
    "lib/research-candidate-review/feedback-event-write-runtime.ts",
    "docs/FEEDBACK_CONTROLS_EXPANSION_RUNTIME_COMPLETION_V0_1.md",
    "fixtures/feedback-controls-expansion-runtime-completion.sample.v0.1.json",
    "scripts/smoke-feedback-controls-expansion-runtime-completion-v0-1.mjs",
    "scripts/smoke-feedback-controls-expanded-v0-1.mjs",
    packagePath,
    indexPath,
  ].includes(filePath);
}

function isFeedbackInfluencedSurfacingPreviewRuntimeCompletionFile(filePath) {
  return [
    "lib/research-candidate-review/feedback-influenced-surfacing-preview.ts",
    "app/api/research-candidate/feedback-events/surfacing-preview/route.ts",
    "components/feedback-influenced-surfacing-preview-panel.tsx",
    "docs/FEEDBACK_INFLUENCED_SURFACING_PREVIEW_RUNTIME_COMPLETION_V0_1.md",
    "fixtures/feedback-influenced-surfacing-preview-runtime-completion.sample.v0.1.json",
    "scripts/smoke-feedback-influenced-surfacing-preview-runtime-completion-v0-1.mjs",
    packagePath,
    indexPath,
  ].includes(filePath);
}

function isRuntimeAuditPanelRuntimeCompletionFile(filePath) {
  return [
    "lib/runtime-audit/audit-event-store.ts",
    "lib/runtime-audit/build-runtime-audit-model.ts",
    "app/api/runtime-audit/events/route.ts",
    "components/runtime-audit-panel.tsx",
    "docs/RUNTIME_AUDIT_PANEL_RUNTIME_COMPLETION_V0_1.md",
    "fixtures/runtime-audit-panel-runtime-completion.sample.v0.1.json",
    "scripts/smoke-runtime-audit-panel-runtime-completion-v0-1.mjs",
    "scripts/smoke-runtime-audit-panel-v0-1.mjs",
    packagePath,
    indexPath,
  ].includes(filePath);
}

function isRuntimeAuditSelectedRouteInstrumentationV02File(filePath) {
  return [
    "app/api/research-retrieval/rebuild/route.ts",
    "app/api/research-retrieval/search/route.ts",
    "app/api/perspective/layout/manual-anchors/route.ts",
    "app/api/runtime-audit/events/route.ts",
    "lib/runtime-audit/audit-event-store.ts",
    "docs/RUNTIME_AUDIT_SELECTED_ROUTE_INSTRUMENTATION_V0_2.md",
    "fixtures/runtime-audit-selected-route-instrumentation.v0.2.sample.json",
    "scripts/smoke-runtime-audit-selected-route-instrumentation-v0-2.mjs",
    packagePath,
    indexPath,
  ].includes(filePath);
}

function isRuntimeAuditSelectedRouteInstrumentationV03File(filePath) {
  return [
    "app/api/research-candidate-review/review-records/route.ts",
    "app/api/research-candidate-review/review-records/[review_record_id]/route.ts",
    "app/api/research-candidate-review/review-records/[review_record_id]/activity/route.ts",
    "app/api/research-candidate-review/review-records/[review_record_id]/discard/route.ts",
    "docs/RUNTIME_AUDIT_SELECTED_ROUTE_INSTRUMENTATION_V0_3.md",
    "fixtures/runtime-audit-selected-route-instrumentation.v0.3.sample.json",
    "scripts/smoke-runtime-audit-selected-route-instrumentation-v0-3.mjs",
    "scripts/smoke-runtime-audit-selected-route-instrumentation-v0-1.mjs",
    "scripts/smoke-research-candidate-review-memory-db-routes-runtime-v0-1.mjs",
    "scripts/smoke-research-candidate-review-memory-db-ui-runtime-v0-1.mjs",
    "scripts/smoke-foundation-lifecycle-review-memory-db-readonly-ui-completion-v0-1.mjs",
    packagePath,
    indexPath,
  ].includes(filePath);
}

function isRuntimeAuditSelectedRouteInstrumentationV04Phase4File(filePath) {
  return [
    "app/api/perspective/promotion-decisions/route.ts",
    "app/api/perspective/promotion-decisions/[promotion_decision_id]/route.ts",
    "app/api/perspective/formation-receipts/route.ts",
    "app/api/perspective/state/apply-delta/route.ts",
    "app/api/perspective/state/[perspective_id]/route.ts",
    "app/api/perspective/state/[perspective_id]/trajectory/route.ts",
    "lib/runtime-audit/audit-event-store.ts",
    "docs/RUNTIME_AUDIT_SELECTED_ROUTE_INSTRUMENTATION_V0_4_PHASE_4_PROMOTION_STATE_V0_1.md",
    "fixtures/runtime-audit-selected-route-instrumentation.v0.4.phase-4-promotion-state.sample.json",
    "scripts/smoke-runtime-audit-selected-route-instrumentation-v0-4-phase-4-promotion-state-v0-1.mjs",
    packagePath,
    indexPath,
  ].includes(filePath);
}

function isProductWriteAcceptedEvidenceRefRuntimeV01File(filePath) {
  if (filePath === "app/api/product-write/" || filePath === "lib/product-write/") return true;
  return [
    "app/api/product-write/accepted-evidence-refs/route.ts",
    "docs/PRODUCT_WRITE_ACCEPTED_EVIDENCE_REF_RUNTIME_V0_1.md",
    "fixtures/product-write-accepted-evidence-ref-runtime.sample.v0.1.json",
    "lib/product-write/accepted-evidence-ref-runtime.ts",
    "lib/product-write/accepted-evidence-ref-store.ts",
    "scripts/smoke-product-write-accepted-evidence-ref-runtime-v0-1.mjs",
    "types/product-write-accepted-evidence-ref.ts",
  ].includes(filePath);
}

function changedFilesAgainstMain() {
  try {
    const diffFiles = execFileSync("git", ["diff", "--name-only", "main"], { encoding: "utf8" })
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
    const untrackedFiles = execFileSync("git", ["ls-files", "--others", "--exclude-standard"], {
      encoding: "utf8",
    })
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
    return [...new Set([...diffFiles, ...untrackedFiles])].sort();
  } catch {
    return [];
  }
}

function getImportSpecifiers(source) {
  const specifiers = [];
  for (const match of source.matchAll(/from\s+["']([^"']+)["']/g)) specifiers.push(match[1]);
  for (const match of source.matchAll(/import\s+["']([^"']+)["']/g)) specifiers.push(match[1]);
  return specifiers;
}

function pathsContaining(value, needle, path = "") {
  const matches = [];
  if (typeof value === "string") {
    if (value.includes(needle)) matches.push(path);
    return matches;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      matches.push(...pathsContaining(item, needle, `${path}[${index}]`));
    });
    return matches;
  }
  if (value && typeof value === "object") {
    for (const [key, nested] of Object.entries(value)) {
      matches.push(...pathsContaining(nested, needle, path ? `${path}.${key}` : key));
    }
  }
  return matches;
}

function viewModelSource() {
  return sourceByPath.get(viewModelPath) ?? "";
}

function assertIncludes(source, phrase, message) {
  assert.ok(source.includes(phrase), message);
}

function extractIndexBlock(source, heading) {
  const start = source.indexOf(`- ${heading}:`);
  assert.ok(start >= 0, `index block for ${heading} must exist`);
  const next = source.indexOf("\n- ", start + 1);
  return next >= 0 ? source.slice(start, next) : source.slice(start);
}

function readText(filePath) {
  return readFileSync(filePath, "utf8");
}

function normalize(value) {
  return value.replace(/\s+/g, " ");
}
