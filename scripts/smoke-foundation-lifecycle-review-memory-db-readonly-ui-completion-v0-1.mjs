import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

const roadmapPath = "docs/AUGNES_INTEGRATED_DEVELOPMENT_ROADMAP_V0_2_1_FULL.md";
const docPath = "docs/FOUNDATION_LIFECYCLE_REVIEW_MEMORY_DB_READONLY_UI_COMPLETION_V0_1.md";
const legacyDocPath = "docs/FOUNDATION_LIFECYCLE_REVIEW_MEMORY_READONLY_UI_V0_1.md";
const dbUiDocPath = "docs/RESEARCH_CANDIDATE_REVIEW_MEMORY_DB_UI_RUNTIME_COMPLETION_V0_1.md";
const dbRoutesDocPath = "docs/RESEARCH_CANDIDATE_REVIEW_MEMORY_DB_ROUTES_RUNTIME_COMPLETION_V0_1.md";
const pagePath = "app/research-candidate/foundation-lifecycle-review-memory/page.tsx";
const legacyClientPath =
  "app/research-candidate/foundation-lifecycle-review-memory/foundation-lifecycle-review-memory-client.tsx";
const dbReadonlyPanelPath = "components/foundation-lifecycle-review-memory-db-readonly-panel.tsx";
const dbUiPanelPath = "components/research-candidate-review-memory-db-panel.tsx";
const collectionRoutePath = "app/api/research-candidate-review/review-records/route.ts";
const detailRoutePath =
  "app/api/research-candidate-review/review-records/[review_record_id]/route.ts";
const activityRoutePath =
  "app/api/research-candidate-review/review-records/[review_record_id]/activity/route.ts";
const fixturePath =
  "fixtures/foundation-lifecycle-review-memory.db-readonly-ui-completion.sample.v0.1.json";
const packagePath = "package.json";
const indexPath = "docs/00_INDEX_LATEST.md";
const packageScriptName =
  "smoke:foundation-lifecycle-review-memory-db-readonly-ui-completion-v0-1";
const packageScriptValue =
  "node scripts/smoke-foundation-lifecycle-review-memory-db-readonly-ui-completion-v0-1.mjs";

const uiVersion = "foundation_lifecycle_review_memory_db_readonly_ui_completion.v0.1";
const routeVersion = "research_candidate_review_memory_db_routes.v0.1";
const dbStoreVersion = "research_candidate_review_memory_db_store.v0.1";
const scope = "project:augnes";
const defaultDbPath = ".tmp/research-candidate-review-memory/ui/review-memory.sqlite";
const dbRoutePrefix = "/api/research-candidate-review/review-records";
const legacyJsonRoutePath = "/api/research-candidate/review-memory";

const requiredReadOnlySections = [
  "Foundation completion summary",
  "Rail status matrix",
  "Runtime readiness matrix",
  "Forbidden capability matrix",
  "Product-write parked status",
  "Next runtime slice pointer",
  "Lifecycle summary",
  "Review records list/detail",
  "Activity history",
  "Operator decision queue",
  "Known warnings/skipped checks",
  "Authority boundary",
];

const allowedTrueBoundaryFields = [
  "foundation_lifecycle_review_memory_db_readonly_ui_now",
  "readonly_ui_only",
  "db_backed_review_memory_get_routes_primary",
  "same_origin_route_calls_only",
  "foundation_status_orientation_now",
  "lifecycle_summary_review_cue_now",
  "review_memory_record_read_now",
  "review_memory_activity_read_now",
  "product_write_parked_status_visible",
];

const forbiddenFalseBoundaryFields = [
  "review_memory_write_ui_now",
  "review_memory_discard_ui_now",
  "direct_db_access_from_ui_now",
  "direct_file_write_from_ui_now",
  "legacy_json_route_primary_persistence_now",
  "post_route_call_now",
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
  "foundation_status_is_runtime_completion",
  "lifecycle_cue_is_execution_authority",
  "review_memory_is_truth",
  "review_memory_is_proof",
  "review_memory_is_accepted_evidence",
  "review_memory_is_durable_perspective_state",
  "candidate_is_fact",
  "candidate_is_proof",
  "source_ref_is_proof",
  "smoke_pass_is_truth",
  "ci_pass_is_truth",
];

const forbiddenControlTexts = [
  "Save review record",
  "Add reviewer note summary",
  "Discard with reason",
  "Promote",
  "Create proof",
  "Create evidence",
  "Create work item",
  "Execute Codex",
  "Product write",
  "Create product",
  "Allocate product ID",
  "GitHub PR",
  "Git commit",
];

const safeMarkers = [
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

for (const filePath of [
  roadmapPath,
  docPath,
  legacyDocPath,
  dbUiDocPath,
  dbRoutesDocPath,
  pagePath,
  legacyClientPath,
  dbReadonlyPanelPath,
  dbUiPanelPath,
  collectionRoutePath,
  detailRoutePath,
  activityRoutePath,
  fixturePath,
  packagePath,
  indexPath,
]) {
  assert.ok(existsSync(filePath), `${filePath} must exist`);
}

const roadmap = readText(roadmapPath);
const doc = normalizeWhitespace(readText(docPath));
const legacyDoc = normalizeWhitespace(readText(legacyDocPath));
const dbUiDoc = normalizeWhitespace(readText(dbUiDocPath));
const dbRoutesDoc = normalizeWhitespace(readText(dbRoutesDocPath));
const pageSource = readText(pagePath);
const panelSource = readText(dbReadonlyPanelPath);
const fixtureText = readText(fixturePath);
const fixture = JSON.parse(fixtureText);
const packageJson = JSON.parse(readText(packagePath));
const index = readText(indexPath);

assertRoadmapCoverage();
assertDocsCoverage();
assertFixtureCoverage();
assertPackageAndIndex();
assertDbRuntimePreconditions();
assertActivePageBinding();
assertReadOnlyRouteBinding();
assertNoForbiddenComponentImports();
assertNoForbiddenControlsOrWrites();
assertNoForbiddenRuntimeCode();
assertRenderedSections();
assertAuthorityBoundary(fixture.authority_boundary_sample, "fixture");
assertChangedFileScope();
assertExistingSmokesPass();

console.log(
  JSON.stringify(
    {
      smoke: "foundation-lifecycle-review-memory-db-readonly-ui-completion-v0-1",
      final_status: "pass",
      ui_version: fixture.ui_version,
      route_version: fixture.route_version,
      db_store_version: fixture.db_store_version,
      scope: fixture.scope,
    },
    null,
    2,
  ),
);

function assertRoadmapCoverage() {
  assert.ok(roadmap.includes("## PR 2.5"), "roadmap must include PR 2.5");
  assert.ok(
    roadmap.includes("foundation_lifecycle_review_memory_readonly_ui_v0_1"),
    "roadmap must include original read-only UI slice",
  );
  for (const phrase of [
    "Foundation completion summary",
    "Rail status matrix",
    "Runtime readiness matrix",
    "Forbidden capability matrix",
    "Product-write parked status",
    "Next runtime slice pointer",
    "Lifecycle summary",
    "Review records list/detail",
    "Operator decision queue",
    "Known warnings/skipped checks",
    "dashboard는 orientation surface",
    "lifecycle은 next review cue",
    "review memory는 explicit user action 기록",
  ]) {
    assert.ok(roadmap.includes(phrase), `roadmap must include ${phrase}`);
  }
}

function assertDocsCoverage() {
  for (const phrase of [
    "This slice implements `foundation_lifecycle_review_memory_db_readonly_ui_completion_v0_1`.",
    "This slice closes the original Phase 2.5 read-only UI gap by binding review memory visibility to DB-backed GET routes.",
    "The earlier read-only UI remains useful orientation but did not include DB-backed review memory reads.",
    "This UI is read-only.",
    "Read-only means no mutation, not no runtime data.",
    "This UI does not call POST routes.",
    "This UI does not create, update, discard, or supersede review records.",
    "The UI does not directly write DB.",
    "The UI does not directly write files.",
    "Foundation status is orientation, not runtime completion.",
    "Lifecycle is next review cue, not execution authority.",
    "Review memory is explicit user-action record, not truth, proof, accepted evidence, or durable Perspective state.",
    "Candidate refs are not facts.",
    "Source refs are lineage pointers, not proof.",
    "Smoke/CI pass is not truth.",
    "The roadmap guide is not SSOT.",
    "Product-write remains parked by #686.",
  ]) {
    assert.ok(doc.includes(phrase), `doc must include ${phrase}`);
  }
  for (const phrase of [
    "This UI does not call providers.",
    "This UI does not send prompts.",
    "This UI does not fetch sources.",
    "This UI does not execute retrieval/RAG.",
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
  ]) {
    assert.ok(doc.includes(phrase), `doc must include explicit boundary ${phrase}`);
  }
  assert.ok(
    legacyDoc.includes("uses the legacy JSON route") || legacyDoc.includes("#771 route"),
    "legacy doc must remain oriented around earlier route",
  );
  assert.ok(
    dbUiDoc.includes("All persistence goes through DB-backed same-origin review memory routes"),
    "DB UI doc must exist and mention DB routes",
  );
  assert.ok(
    dbRoutesDoc.includes("GET routes do not create DB files or schema."),
    "DB routes doc must cover GET no-create policy",
  );
}

function assertFixtureCoverage() {
  assert.equal(
    fixture.fixture_version,
    "foundation_lifecycle_review_memory_db_readonly_ui_completion.sample.v0.1",
  );
  assert.equal(fixture.ui_version, uiVersion);
  assert.equal(fixture.route_version, routeVersion);
  assert.equal(fixture.db_store_version, dbStoreVersion);
  assert.equal(fixture.scope, scope);
  assert.equal(fixture.default_db_path, defaultDbPath);
  assertSafeDbPath(fixture.default_db_path);
  assert.deepEqual(fixture.read_only_sections, requiredReadOnlySections);
  for (const key of [
    "foundation_summary_example",
    "rail_status_matrix_example",
    "runtime_readiness_matrix_example",
    "forbidden_capability_matrix_example",
    "product_write_parked_status_example",
    "next_runtime_slice_pointer_example",
    "lifecycle_summary_example",
    "review_records_list_request_example",
    "review_record_detail_request_example",
    "review_record_activity_request_example",
    "bounded_error_display_examples",
    "forbidden_control_examples",
    "operator_decision_queue_example",
    "known_warnings_skipped_checks_example",
    "authority_boundary_sample",
  ]) {
    assert.ok(Object.hasOwn(fixture, key), `fixture must include ${key}`);
  }
  for (const requestKey of [
    "review_records_list_request_example",
    "review_record_detail_request_example",
    "review_record_activity_request_example",
  ]) {
    assert.equal(fixture[requestKey].method, "GET", `${requestKey} must use GET`);
    assert.ok(
      fixture[requestKey].route_path.startsWith(dbRoutePrefix),
      `${requestKey} must use DB route prefix`,
    );
  }
  assert.deepEqual(fixture.forbidden_control_examples, forbiddenControlTexts);
  assertSafeMarkersOnlyInBlockedOrErrorExamples(fixture);
  assertNoLiveLookingFixtureValues(fixtureText);
}

function assertPackageAndIndex() {
  assert.equal(packageJson.scripts?.[packageScriptName], packageScriptValue);
  const block = normalizeWhitespace(
    extractIndexBlock(index, "Foundation/Lifecycle/Review Memory DB Readonly UI Completion v0.1"),
  );
  for (const requiredText of [
    docPath,
    fixturePath,
    dbReadonlyPanelPath,
    pagePath,
    packageScriptName,
    "foundation_lifecycle_review_memory_db_readonly_ui_completion_v0_1",
    "original Phase 2.5",
    "DB-backed same-origin GET routes",
    "Product-write remains parked by #686",
  ]) {
    assert.ok(block.includes(requiredText), `index block must include ${requiredText}`);
  }
}

function assertDbRuntimePreconditions() {
  for (const routeFile of [collectionRoutePath, detailRoutePath, activityRoutePath]) {
    assert.ok(existsSync(routeFile), `${routeFile} must exist`);
  }
  assert.ok(existsSync(dbUiPanelPath), "DB UI completion panel must exist");
}

function assertActivePageBinding() {
  assert.ok(
    pageSource.includes("FoundationLifecycleReviewMemoryDbReadonlyPanel"),
    "active page must render DB readonly panel",
  );
  assert.ok(
    pageSource.includes("@/components/foundation-lifecycle-review-memory-db-readonly-panel"),
    "active page must import DB readonly panel",
  );
  assert.ok(
    !pageSource.includes("FoundationLifecycleReviewMemoryClient"),
    "active page must not render legacy client as primary surface",
  );
}

function assertReadOnlyRouteBinding() {
  assert.ok(panelSource.includes(dbRoutePrefix), "panel must use DB-backed review memory route");
  assert.ok(!panelSource.includes(legacyJsonRoutePath), "panel must not use legacy JSON route");
  assert.ok(panelSource.includes('method: "GET"'), "panel must call GET routes");
  for (const requiredSource of [
    "loadReviewRecords",
    "openReviewRecord",
    "loadActivityHistory",
    "/activity",
    "include_discarded",
    "route_version",
    "db_path",
  ]) {
    assert.ok(panelSource.includes(requiredSource), `panel must include ${requiredSource}`);
  }
}

function assertNoForbiddenComponentImports() {
  const imports = [...getImportSpecifiers(pageSource), ...getImportSpecifiers(panelSource)];
  for (const forbiddenImport of [
    "fs",
    "node:fs",
    "path",
    "node:path",
    "better-sqlite3",
    "sqlite",
    "review-memory-db-store",
    "review-memory-store",
    "child_process",
  ]) {
    assert.ok(
      !imports.some((specifier) => specifier === forbiddenImport || specifier.includes(forbiddenImport)),
      `UI source must not import ${forbiddenImport}`,
    );
  }
}

function assertNoForbiddenControlsOrWrites() {
  for (const forbiddenText of forbiddenControlTexts) {
    assert.ok(!panelSource.includes(forbiddenText), `panel must not include ${forbiddenText}`);
  }
  for (const forbiddenSource of [
    'method: "POST"',
    "method:'POST'",
    "method: 'POST'",
    "onSubmit",
    "create_review_record",
    "append_review_record_activity",
    "discard_review_record",
    "/discard",
    "saveReviewRecord",
    "appendReviewerNoteSummary",
    "discardReviewRecord",
    "supersede",
  ]) {
    assert.ok(!panelSource.includes(forbiddenSource), `panel must not include ${forbiddenSource}`);
  }
}

function assertNoForbiddenRuntimeCode() {
  for (const forbiddenText of [
    "localStorage",
    "sessionStorage",
    "indexedDB",
    "document.cookie",
    "new Database",
    "OpenAI",
    "source_fetch(",
    "executeRetrieval",
    "runRetrieval",
    "generateRagAnswer",
    "githubApiCall(",
    "createGithub",
    "executeCodex",
    "product_id_allocation_now: true",
    "product_write_now: true",
  ]) {
    assert.ok(!panelSource.includes(forbiddenText), `panel must not include ${forbiddenText}`);
  }
}

function assertRenderedSections() {
  for (const text of [
    "Foundation completion summary",
    "Rail status matrix",
    "Runtime readiness matrix",
    "Forbidden capability matrix",
    "Product-write parked status",
    "Next runtime slice pointer",
    "Lifecycle summary",
    "Review records list",
    "Review record detail",
    "Activity history",
    "Operator decision queue",
    "Known warnings/skipped checks",
    "Authority boundary",
    "candidate_refs",
    "source_refs",
  ]) {
    assert.ok(panelSource.includes(text), `panel must render ${text}`);
  }
  for (const errorCode of boundedErrorCodesForSource()) {
    assert.ok(panelSource.includes(errorCode), `panel must display bounded error ${errorCode}`);
  }
}

function assertChangedFileScope() {
  const changed = changedFilesAgainstMain();
  if (changed.length === 0) return;
  assert.ok(
    !changed.some(
      (filePath) =>
        filePath.startsWith("app/api/research-candidate-review/review-records/") ||
        filePath === "app/api/research-candidate/review-memory/route.ts",
    ),
    "no review-memory app/api route was added for this slice",
  );
  assert.ok(
    !changed.some((filePath) => filePath === "lib/research-candidate-review/review-memory-db-store.ts"),
    "DB store helper must not be modified for this slice",
  );
  assert.ok(!changed.includes("lib/db/schema.sql"), "DB schema must not be modified for this slice");
	  assert.ok(
	    !changed.some((filePath) =>
	      /provider|retrieval|rag|github|git-ledger|codex-execution|product-write|product-id/i.test(filePath) &&
	      !isProviderExtractionRuntimeCompletionFile(filePath) &&
	      !isRetrievalIndexRuntimeCompletionFile(filePath),
	    ),
	    "no provider/retrieval/Git/GitHub/Codex/product-write/product ID files were added",
	  );
}

function isProviderExtractionRuntimeCompletionFile(filePath) {
  if (
    filePath === "app/api/research-candidate-review/provider-extraction/" ||
    filePath === "lib/research-extraction/"
  ) {
    return true;
  }
  return [
    "docs/PROVIDER_ASSISTED_EXTRACTION_RUNTIME_COMPLETION_V0_1.md",
    "lib/research-extraction/provider-extract-candidates.ts",
    "lib/research-extraction/normalize-provider-output.ts",
    "lib/research-extraction/provider-boundary.ts",
    "app/api/research-candidate-review/provider-extraction/route.ts",
    "fixtures/provider-assisted-extraction-runtime-completion.sample.v0.1.json",
    "scripts/smoke-provider-assisted-extraction-runtime-completion-v0-1.mjs",
	  ].includes(filePath);
}

function isRetrievalIndexRuntimeCompletionFile(filePath) {
  return [
    "docs/REBUILDABLE_RETRIEVAL_INDEX_RUNTIME_COMPLETION_V0_1.md",
    "lib/research-retrieval/index-store.ts",
    "lib/research-retrieval/rebuild-index.ts",
    "lib/research-retrieval/search-index.ts",
    "app/api/research-retrieval/rebuild/route.ts",
    "app/api/research-retrieval/search/route.ts",
    "fixtures/research-retrieval-index-runtime-completion.sample.v0.1.json",
    "scripts/smoke-research-retrieval-index-runtime-completion-v0-1.mjs",
  ].includes(filePath);
}

function assertExistingSmokesPass() {
  for (const scriptName of [
    "smoke:research-candidate-review-memory-db-ui-runtime-v0-1",
    "smoke:research-candidate-review-memory-db-routes-runtime-v0-1",
    "smoke:research-candidate-review-memory-db-store-runtime-v0-1",
    "smoke:foundation-lifecycle-review-memory-readonly-ui-v0-1",
    "smoke:research-candidate-review-memory-ui-v0-1",
  ]) {
    execFileSync("npm", ["run", scriptName], { stdio: "pipe" });
  }
}

function assertAuthorityBoundary(boundary, label) {
  assert.ok(boundary && typeof boundary === "object", `${label} authority boundary must exist`);
  for (const field of allowedTrueBoundaryFields) {
    assert.equal(boundary[field], true, `${label} ${field} must be true`);
    assert.ok(panelSource.includes(`${field}: true`), `panel must include ${field}: true`);
  }
  for (const field of forbiddenFalseBoundaryFields) {
    assert.equal(boundary[field], false, `${label} ${field} must be false`);
    assert.ok(panelSource.includes(`${field}: false`), `panel must include ${field}: false`);
  }
}

function assertSafeDbPath(value) {
  assert.equal(typeof value, "string", "DB path must be string");
  assert.ok(value.endsWith(".sqlite") || value.endsWith(".db"), "DB path must be SQLite path");
  assert.ok(
    value.startsWith("tmp/research-candidate-review-memory/") ||
      value.startsWith(".tmp/research-candidate-review-memory/"),
    "DB path must be allowlisted",
  );
  assert.ok(!value.startsWith("/"), "DB path must not be absolute");
  assert.ok(!value.includes(".."), "DB path must not traverse parents");
  assert.ok(!value.includes("\\"), "DB path must not contain backslash");
  assert.ok(!value.includes("://"), "DB path must not be URL-like");
}

function assertSafeMarkersOnlyInBlockedOrErrorExamples(value, path = []) {
  if (typeof value === "string") {
    for (const marker of safeMarkers) {
      if (value.includes(marker)) {
        assert.ok(
          path.some((part) => /blocked|error/i.test(String(part))),
          `${marker} may appear only in blocked/error examples; found at ${path.join(".")}`,
        );
      }
    }
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => assertSafeMarkersOnlyInBlockedOrErrorExamples(item, [...path, index]));
    return;
  }
  if (!value || typeof value !== "object") return;
  for (const [key, nested] of Object.entries(value)) {
    assertSafeMarkersOnlyInBlockedOrErrorExamples(nested, [...path, key]);
  }
}

function assertNoLiveLookingFixtureValues(text) {
  const sanitized = text
    .replaceAll("SAFE_MARKER_PRIVATE_URL", "")
    .replaceAll("provider_openai_call_now", "")
    .replaceAll("raw_value_echoed", "");
  for (const forbiddenPattern of [
    /\/Users\//,
    /\/home\//,
    /file:\/\//,
    /https?:\/\//,
    /\bsk-[A-Za-z0-9]/,
    /\bghp_[A-Za-z0-9]/,
    /OPENAI_API_KEY/,
    /GITHUB_TOKEN/,
    /thread_[A-Za-z0-9_-]+/,
    /run_[A-Za-z0-9_-]+/,
    /uploaded[-_ ]?file[-_ ]?id/i,
    /connector[-_ ]?id/i,
  ]) {
    assert.doesNotMatch(sanitized, forbiddenPattern);
  }
}

function boundedErrorCodesForSource() {
  return [
    "invalid_db_path",
    "db_missing",
    "schema_missing",
    "blocked_private_or_raw_payload",
    "blocked_forbidden_authority",
    "not_found",
    "same_origin_required",
  ];
}

function getImportSpecifiers(source) {
  const specifiers = [];
  for (const match of source.matchAll(/from\s+["']([^"']+)["']/g)) {
    specifiers.push(match[1]);
  }
  for (const match of source.matchAll(/import\s+["']([^"']+)["']/g)) {
    specifiers.push(match[1]);
  }
  return specifiers;
}

function extractIndexBlock(source, heading) {
  const start = source.indexOf(`- ${heading}:`);
  assert.ok(start >= 0, `index block for ${heading} must exist`);
  const next = source.indexOf("\n- ", start + 1);
  return next >= 0 ? source.slice(start, next) : source.slice(start);
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

function normalizeWhitespace(value) {
  return value.replace(/\s+/g, " ");
}

function readText(filePath) {
  return readFileSync(filePath, "utf8");
}
