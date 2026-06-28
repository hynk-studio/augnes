#!/usr/bin/env node
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

const docsPath = "docs/RELEASE_READINESS_RUNTIME_GROUNDING_UPDATE_V0_1.md";
const fixturePath = "fixtures/release-readiness-runtime-grounding-update.sample.v0.1.json";
const packagePath = "package.json";
const indexPath = "docs/00_INDEX_LATEST.md";
const roadmapPath = "docs/AUGNES_INTEGRATED_DEVELOPMENT_ROADMAP_V0_2_1_FULL.md";

const packageScriptName = "smoke:release-readiness-runtime-grounding-update-v0-1";
const packageScriptValue = "node scripts/smoke-release-readiness-runtime-grounding-update-v0-1.mjs";
const scope = "project:augnes";
const fixtureVersion = "release_readiness_runtime_grounding_update.sample.v0.1";
const groundingVersion = "release_readiness_runtime_grounding_update.v0.1";

const requiredRuntimeSlices = [
  "research_candidate_review_memory_db_store_runtime_completion_v0_1",
  "research_candidate_review_memory_db_routes_runtime_completion_v0_1",
  "research_candidate_review_memory_db_ui_runtime_completion_v0_1",
  "foundation_lifecycle_review_memory_db_readonly_ui_completion_v0_1",
  "bounded_source_intake_runtime_completion_v0_1",
  "provider_assisted_extraction_runtime_completion_v0_1",
  "rebuildable_retrieval_index_runtime_completion_v0_1",
  "rag_context_preview_runtime_completion_v0_1",
  "constellation_runtime_ui_runtime_completion_v0_1",
  "layout_persistence_manual_anchors_runtime_completion_v0_1",
  "feedback_event_aggregation_runtime_completion_v0_1",
  "feedback_controls_expansion_runtime_completion_v0_1",
  "feedback_influenced_surfacing_preview_runtime_completion_v0_1",
  "runtime_audit_panel_runtime_completion_v0_1",
  "runtime_audit_selected_route_instrumentation_v0_1",
  "runtime_audit_selected_route_instrumentation_v0_2",
  "runtime_audit_selected_route_instrumentation_v0_3",
];

const allowedReadinessCategories = new Set([
  "runtime_complete_db_backed",
  "runtime_complete_same_origin_route",
  "runtime_complete_ui_bound",
  "runtime_complete_readonly_ui_bound",
  "runtime_complete_preview_only",
  "runtime_complete_advisory_only",
  "runtime_audit_substrate_complete",
  "runtime_audit_selected_instrumentation_complete",
  "contract_only",
  "parked_pending_explicit_approval",
  "deferred_future_work",
  "not_applicable",
]);

const requiredAuditVersions = [
  "runtime_audit_selected_route_instrumentation_v0_1",
  "runtime_audit_selected_route_instrumentation_v0_2",
  "runtime_audit_selected_route_instrumentation_v0_3",
];

const requiredParkedWork = [
  "product_write_minimal_runtime_v0_1",
  "product-write adapter enablement",
  "product ID allocation",
  "GitHub actuation implementation",
  "broad all-route audit instrumentation",
  "final RAG answer generation",
  "automatic provider/background operations",
  "automatic rule/parser/prompt/ranking/surfacing mutation",
];

const requiredDocsPhrases = [
  "This slice is release readiness grounding only.",
  "This slice is not roadmap completion closeout.",
  "This slice is not release approval.",
  "This slice is not release execution.",
  "This slice does not create version tags.",
  "This slice does not execute Git/GitHub.",
  "This slice does not product-write.",
  "This slice does not allocate product IDs.",
  "This slice does not approve `product_write_minimal_runtime_v0_1`.",
  "This slice does not approve GitHub actuation implementation.",
  "This slice does not query/write DB.",
  "This slice does not add routes/UI.",
  "This slice does not call providers.",
  "This slice does not execute retrieval/RAG.",
  "This slice does not create proof/evidence.",
  "This slice does not promote Perspective.",
  "This slice does not write/apply durable state.",
  "This slice does not write Formation Receipts.",
  "Product-write remains parked by #686.",
  "Readiness is not release approval.",
  "Readiness is not truth.",
  "Freeze manifest addendum is not release execution.",
  "Operator review is not merge authority.",
  "Smoke/CI pass is not truth.",
  "The roadmap guide is not SSOT.",
  "Future product-write or GitHub actuation work requires separate explicit\napproval.",
];

const requiredReleaseDocPointers = [
  "docs/RELEASE_READINESS_MATRIX_V0_1.md",
  "docs/RELEASE_CANDIDATE_OPERATOR_REVIEW_V0_1.md",
  "docs/RELEASE_CANDIDATE_FREEZE_MANIFEST_V0_1.md",
  "docs/RELEASE_POSTMERGE_OBSERVER_NOTES_V0_1.md",
];

const authorityTrueFields = [
  "release_readiness_runtime_grounding_update_now",
  "readiness_documentation_update_only",
  "runtime_inventory_public_safe_now",
  "operator_review_checklist_update_now",
  "freeze_manifest_addendum_now",
];

const authorityFalseFields = [
  "release_execution_now",
  "release_approval_now",
  "version_tag_create_now",
  "github_api_call_now",
  "git_write_now",
  "github_pr_create_now",
  "github_merge_now",
  "product_write_now",
  "product_write_runtime_now",
  "product_write_adapter_enabled_now",
  "product_id_allocation_now",
  "product_persistence_now",
  "db_query_or_write_now",
  "route_now",
  "ui_now",
  "provider_openai_call_now",
  "prompt_sent_now",
  "source_fetch_now",
  "retrieval_execution_now",
  "rag_answer_generation_now",
  "proof_or_evidence_record_now",
  "claim_or_evidence_write_now",
  "work_item_write_now",
  "promotion_execution_now",
  "durable_state_write_now",
  "durable_state_apply_now",
  "formation_receipt_write_now",
  "codex_execution_now",
  "codex_execution_authority",
  "github_automation_authority",
  "product_write_authority",
  "readiness_is_release_approval",
  "readiness_is_truth",
  "freeze_manifest_is_release_execution",
  "operator_review_is_merge_authority",
  "smoke_pass_is_truth",
  "ci_pass_is_truth",
];

const forbiddenFixtureMarkers = [
  "/Users/",
  "/home/",
  "file://",
  "sk-",
  "ghp_",
  "OPENAI_API_KEY",
  "GITHUB_TOKEN",
  "password:",
  "secret:",
  "private key",
  "SAFE_MARKER_",
  "provider_internal_id:",
  "connector_id:",
  "uploaded_file_id:",
];

const allowedChangedFiles = new Set([
  docsPath,
  fixturePath,
  "scripts/smoke-release-readiness-runtime-grounding-update-v0-1.mjs",
  "docs/RELEASE_READINESS_MATRIX_V0_1.md",
  "docs/RELEASE_CANDIDATE_OPERATOR_REVIEW_V0_1.md",
  "docs/RELEASE_CANDIDATE_FREEZE_MANIFEST_V0_1.md",
  "docs/RELEASE_POSTMERGE_OBSERVER_NOTES_V0_1.md",
  "docs/00_INDEX_LATEST.md",
  "package.json",
]);

const docs = read(docsPath);
const fixtureText = read(fixturePath);
const fixture = JSON.parse(fixtureText);
const packageJson = JSON.parse(read(packagePath));
const index = read(indexPath);
const roadmap = read(roadmapPath);

assert.ok(roadmap.includes("v0.2.1 FULL"), "roadmap must mention v0.2.1 FULL");

for (const path of [docsPath, fixturePath, packagePath, indexPath]) {
  assert.ok(existsSync(path), `${path} must exist`);
}

assert.equal(fixture.fixture_version, fixtureVersion);
assert.equal(fixture.grounding_version, groundingVersion);
assert.equal(fixture.scope, scope);
assert.equal(
  packageJson.scripts?.[packageScriptName],
  packageScriptValue,
  "package.json must register the runtime grounding smoke",
);

for (const path of [docsPath, fixturePath, "scripts/smoke-release-readiness-runtime-grounding-update-v0-1.mjs"]) {
  assert.ok(index.includes(path), `docs/00_INDEX_LATEST.md must point to ${path}`);
}
assert.ok(
  index.includes(packageScriptName),
  "docs/00_INDEX_LATEST.md must mention the package smoke",
);

for (const phrase of requiredDocsPhrases) {
  assert.ok(docs.includes(phrase), `docs must include required phrase: ${phrase}`);
}

for (const releaseDocPath of requiredReleaseDocPointers) {
  const releaseDoc = read(releaseDocPath);
  assert.ok(
    releaseDoc.includes("RELEASE_READINESS_RUNTIME_GROUNDING_UPDATE_V0_1.md"),
    `${releaseDocPath} must point to the runtime grounding update`,
  );
}

assert.ok(
  docs.includes("This slice does not declare full roadmap completion"),
  "docs must avoid full roadmap completion closeout",
);
assert.ok(
  fixture.release_readiness_matrix_delta.readiness_is_release_approval === false,
  "fixture must say readiness is not release approval",
);
assert.ok(
  fixture.release_readiness_matrix_delta.readiness_is_truth === false,
  "fixture must say readiness is not truth",
);
assert.ok(
  fixture.freeze_manifest_addendum.freeze_manifest_is_release_execution === false,
  "fixture must say freeze addendum is not release execution",
);

const inventoryBySlice = new Map(
  fixture.runtime_completion_inventory.map((entry) => [entry.slice_name, entry]),
);
for (const sliceName of requiredRuntimeSlices) {
  const entry = inventoryBySlice.get(sliceName);
  assert.ok(entry, `fixture inventory must include ${sliceName}`);
  assert.ok(
    allowedReadinessCategories.has(entry.readiness_category),
    `${sliceName} must use an allowed readiness category`,
  );
  assert.ok(existsSync(entry.docs_ref), `${sliceName} docs_ref must exist: ${entry.docs_ref}`);
  assert.ok(
    existsSync(entry.smoke_script_ref),
    `${sliceName} smoke_script_ref must exist: ${entry.smoke_script_ref}`,
  );
  for (const filePath of entry.primary_runtime_files ?? []) {
    assert.ok(existsSync(filePath), `${sliceName} primary runtime file must exist: ${filePath}`);
  }
  for (const routePath of entry.route_files ?? []) {
    assert.ok(existsSync(routePath), `${sliceName} route file must exist: ${routePath}`);
  }
  assert.equal(typeof entry.audit_instrumented, "boolean");
  assert.equal(typeof entry.remaining_gap, "string");
  assert.equal(typeof entry.non_authority_notes, "string");
}

const auditVersions = new Set(
  fixture.audit_instrumentation_inventory.map((entry) => entry.instrumentation_version),
);
for (const version of requiredAuditVersions) {
  assert.ok(auditVersions.has(version), `audit inventory must include ${version}`);
}
assert.ok(
  auditVersions.has("broad_all_route_instrumentation"),
  "audit inventory must include explicitly deferred broad all-route instrumentation",
);
assert.ok(
  fixture.audit_instrumentation_inventory.some(
    (entry) =>
      entry.instrumentation_version === "broad_all_route_instrumentation" &&
      entry.status === "explicitly_deferred",
  ),
  "broad all-route instrumentation must be explicitly deferred",
);
for (const entry of fixture.audit_instrumentation_inventory) {
  assert.ok(
    String(entry.raw_body_log_exclusion_policy ?? "").includes("bounded") ||
      String(entry.raw_body_log_exclusion_policy ?? "").includes("forbidden"),
    `${entry.instrumentation_version} must describe raw body/log exclusion`,
  );
}

for (const parked of requiredParkedWork) {
  assert.ok(fixture.parked_work.includes(parked), `parked work must include ${parked}`);
  assert.ok(docs.includes(parked), `docs must include parked work ${parked}`);
}

assert.ok(
  fixture.warning_baseline.some((warning) => warning.warning_ref === "MODULE_TYPELESS_PACKAGE_JSON"),
  "warning baseline must include MODULE_TYPELESS_PACKAGE_JSON",
);
assert.ok(
  fixture.warning_baseline.some((warning) => warning.warning_ref === "stripTypeScriptTypes"),
  "warning baseline must include stripTypeScriptTypes",
);
assert.ok(docs.includes("MODULE_TYPELESS_PACKAGE_JSON"));
assert.ok(docs.includes("stripTypeScriptTypes"));

for (const field of authorityTrueFields) {
  assert.equal(fixture.authority_boundary[field], true, `${field} must be true`);
}
for (const field of authorityFalseFields) {
  assert.equal(fixture.authority_boundary[field], false, `${field} must be false`);
  assert.ok(
    docs.includes(`\`${field}\``),
    `docs authority boundary must mention forbidden field ${field}`,
  );
}

for (const marker of forbiddenFixtureMarkers) {
  assert.ok(!fixtureText.includes(marker), `fixture must not include unsafe marker ${marker}`);
}

assertChangedFilesStayDocumentationOnly();

run("npm", ["run", "smoke:release-readiness-matrix-v0-1"]);
run("npm", ["run", "smoke:release-postmerge-observer-notes-v0-1"]);
run("npm", ["run", "smoke:runtime-audit-selected-route-instrumentation-v0-3"]);

console.log(
  JSON.stringify(
    {
      ok: true,
      smoke: "release-readiness-runtime-grounding-update-v0-1",
      grounding_version: groundingVersion,
      runtime_inventory_entries: fixture.runtime_completion_inventory.length,
      audit_inventory_entries: fixture.audit_instrumentation_inventory.length,
      parked_work_entries: fixture.parked_work.length,
    },
    null,
    2,
  ),
);

function read(path) {
  assert.ok(existsSync(path), `${path} must exist`);
  return readFileSync(path, "utf8");
}

function run(command, args) {
  execFileSync(command, args, { stdio: "inherit" });
}

function assertChangedFilesStayDocumentationOnly() {
  const changedFiles = getChangedFiles();
  for (const changedFile of changedFiles) {
    assert.ok(
      allowedChangedFiles.has(changedFile),
      `unexpected changed file for docs/fixture/smoke/package-only slice: ${changedFile}`,
    );
    assert.ok(!changedFile.startsWith("app/api/"), `no app/api route should be added: ${changedFile}`);
    assert.ok(!changedFile.startsWith("components/"), `no component/UI should be added: ${changedFile}`);
    assert.ok(!changedFile.startsWith("lib/"), `no lib runtime helper should be added: ${changedFile}`);
    assert.ok(!changedFile.includes("db/schema"), `no DB schema/helper should be changed: ${changedFile}`);
    assert.ok(!changedFile.includes("product-write"), `no product-write runtime file should be added: ${changedFile}`);
    assert.ok(!changedFile.includes("github"), `no GitHub runtime file should be added: ${changedFile}`);
    assert.ok(!changedFile.includes("codex"), `no Codex runtime file should be added: ${changedFile}`);
  }
}

function getChangedFiles() {
  for (const ref of ["main...HEAD", "origin/main...HEAD"]) {
    try {
      const output = execFileSync("git", ["diff", "--name-only", ref], {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"],
      }).trim();
      if (output.length > 0) {
        return output.split("\n").filter(Boolean);
      }
    } catch {
      // Try the next ref.
    }
  }
  return [];
}
