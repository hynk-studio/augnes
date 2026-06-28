import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

const roadmapPath = "docs/AUGNES_INTEGRATED_DEVELOPMENT_ROADMAP_V0_2_1_FULL.md";
const docPath = "docs/RESEARCH_CANDIDATE_REVIEW_MEMORY_DB_UI_RUNTIME_COMPLETION_V0_1.md";
const legacyUiDocPath = "docs/RESEARCH_CANDIDATE_REVIEW_MEMORY_UI_V0_1.md";
const dbRoutesDocPath = "docs/RESEARCH_CANDIDATE_REVIEW_MEMORY_DB_ROUTES_RUNTIME_COMPLETION_V0_1.md";
const dbStoreDocPath = "docs/RESEARCH_CANDIDATE_REVIEW_MEMORY_DB_STORE_RUNTIME_COMPLETION_V0_1.md";
const pagePath = "app/research-candidate/review-memory/page.tsx";
const dbPanelPath = "components/research-candidate-review-memory-db-panel.tsx";
const legacyClientPath = "app/research-candidate/review-memory/review-memory-client.tsx";
const collectionRoutePath = "app/api/research-candidate-review/review-records/route.ts";
const detailRoutePath =
  "app/api/research-candidate-review/review-records/[review_record_id]/route.ts";
const activityRoutePath =
  "app/api/research-candidate-review/review-records/[review_record_id]/activity/route.ts";
const discardRoutePath =
  "app/api/research-candidate-review/review-records/[review_record_id]/discard/route.ts";
const routeContractPath = "lib/research-candidate-review/review-memory-db-route-contract.ts";
const fixturePath = "fixtures/research-candidate-review.memory-db-ui-runtime.sample.v0.1.json";
const packagePath = "package.json";
const indexPath = "docs/00_INDEX_LATEST.md";
const packageScriptName = "smoke:research-candidate-review-memory-db-ui-runtime-v0-1";
const packageScriptValue =
  "node scripts/smoke-research-candidate-review-memory-db-ui-runtime-v0-1.mjs";
const dbRoutePackageScriptName = "smoke:research-candidate-review-memory-db-routes-runtime-v0-1";
const legacyUiPackageScriptName = "smoke:research-candidate-review-memory-ui-v0-1";

const uiVersion = "research_candidate_review_memory_db_ui_runtime.v0.1";
const routeVersion = "research_candidate_review_memory_db_routes.v0.1";
const dbStoreVersion = "research_candidate_review_memory_db_store.v0.1";
const contractVersion = "research_candidate_review_memory_contract.v0.1";
const scope = "project:augnes";
const dbRoutePrefix = "/api/research-candidate-review/review-records";
const legacyJsonRoutePath = "/api/research-candidate/review-memory";
const defaultDbPath = ".tmp/research-candidate-review-memory/ui/review-memory.sqlite";

const allowedTrueBoundaryFields = [
  "review_memory_db_ui_now",
  "db_backed_review_memory_routes_primary",
  "explicit_operator_ui_action_only",
  "same_origin_route_calls_only",
  "review_record_save_ui_now",
  "review_record_list_ui_now",
  "review_record_detail_ui_now",
  "review_record_activity_ui_now",
  "review_record_discard_ui_now",
];

const forbiddenFalseBoundaryFields = [
  "direct_db_access_from_ui_now",
  "direct_file_write_from_ui_now",
  "legacy_json_route_primary_persistence_now",
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
  "review_memory_is_truth",
  "review_memory_is_proof",
  "review_memory_is_accepted_evidence",
  "review_memory_is_durable_perspective_state",
  "candidate_is_fact",
  "candidate_is_proof",
  "source_ref_is_proof",
  "discard_is_delete",
  "smoke_pass_is_truth",
  "ci_pass_is_truth",
];

const forbiddenControlTexts = [
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
  legacyUiDocPath,
  dbRoutesDocPath,
  dbStoreDocPath,
  pagePath,
  dbPanelPath,
  legacyClientPath,
  collectionRoutePath,
  detailRoutePath,
  activityRoutePath,
  discardRoutePath,
  routeContractPath,
  fixturePath,
  packagePath,
  indexPath,
]) {
  assert.ok(existsSync(filePath), `${filePath} must exist`);
}

const roadmap = readText(roadmapPath);
const doc = normalizeWhitespace(readText(docPath));
const legacyUiDoc = normalizeWhitespace(readText(legacyUiDocPath));
const dbRoutesDoc = normalizeWhitespace(readText(dbRoutesDocPath));
const dbStoreDoc = normalizeWhitespace(readText(dbStoreDocPath));
const pageSource = readText(pagePath);
const panelSource = readText(dbPanelPath);
const routeContractSource = readText(routeContractPath);
const fixtureText = readText(fixturePath);
const fixture = JSON.parse(fixtureText);
const packageJson = JSON.parse(readText(packagePath));
const index = readText(indexPath);

assertRoadmapCoverage();
assertDocsCoverage();
assertFixtureCoverage();
assertPackageAndIndex();
assertDbRoutePreconditions();
assertComponentBinding();
assertNoForbiddenComponentImports();
assertNoForbiddenControls();
assertNoForbiddenRuntimeCode();
assertAuthorityBoundary(fixture.authority_boundary_sample, "fixture");
assertSourceAndCandidateRendering();
assertBoundedErrorRendering();
assertChangedFileScope();
assertExistingSmokesPass();

console.log(
  JSON.stringify(
    {
      smoke: "research-candidate-review-memory-db-ui-runtime-v0-1",
      final_status: "pass",
      ui_version: fixture.ui_version,
      route_version: fixture.route_version,
      db_store_version: fixture.db_store_version,
      contract_version: fixture.contract_version,
      scope: fixture.scope,
    },
    null,
    2,
  ),
);

function assertRoadmapCoverage() {
  assert.ok(roadmap.includes("## PR 2.4"), "roadmap must include PR 2.4");
  assert.ok(
    roadmap.includes("research_candidate_review_memory_ui_v0_1"),
    "roadmap must include original UI slice",
  );
  for (const phrase of [
    "Save review record",
    "Add reviewer note summary",
    "Mark defer/reject/request more evidence/duplicate/superseded",
    "List review records",
    "Open review record detail",
    "View source_refs and candidate_refs",
    "View authority boundary",
    "Discard with reason",
    "Copy review packet for human review",
    "all writes go to review memory routes only",
    "390px viewport no-overflow",
  ]) {
    assert.ok(roadmap.includes(phrase), `roadmap must include ${phrase}`);
  }
}

function assertDocsCoverage() {
  for (const phrase of [
    "This slice implements `research_candidate_review_memory_db_ui_runtime_completion_v0_1`.",
    "It closes the original Phase 2.4 UI gap by binding the operator Review Memory UI",
    "The earlier JSON/local-store-backed UI remains legacy/compatible but is not the DB-backed UI completion.",
    "All persistence goes through DB-backed same-origin review memory routes:",
    "The UI does not directly write DB.",
    "The UI does not directly write files.",
    "The legacy JSON route is not the primary persistence path:",
    "The default DB path is:",
    "Explicit Operator Action Policy",
    "The UI displays bounded error codes, not raw stack traces or raw rejected payloads.",
    "The DB-backed Review Memory UI does not add controls for promotion, proof,",
    "Product-write remains parked by #686.",
    "Review memory is not truth.",
    "Review memory is not proof.",
    "Review memory is not accepted evidence.",
    "Review memory is not durable Perspective state.",
    "Candidate refs are not facts.",
    "Source refs are lineage pointers, not proof.",
    "Discard is lifecycle transition, not delete.",
    "Smoke/CI pass is not truth.",
    "The roadmap guide is not SSOT.",
    "Follow-up foundation/lifecycle/review memory consolidated UI should use this",
  ]) {
    assert.ok(doc.includes(phrase), `doc must include ${phrase}`);
  }
  for (const phrase of [
    "This slice does not call providers.",
    "This slice does not send prompts.",
    "This slice does not fetch sources.",
    "This slice does not execute retrieval/RAG.",
    "This slice does not create proof/evidence.",
    "This slice does not write claim/evidence records.",
    "This slice does not create work items.",
    "This slice does not promote Perspective.",
    "This slice does not write/apply durable Perspective state.",
    "This slice does not write Formation Receipts.",
    "This slice does not execute Git Ledger export runtime.",
    "This slice does not execute Git or call GitHub.",
    "This slice does not execute Codex.",
    "This slice does not export/import files.",
    "This slice does not product-write.",
    "This slice does not allocate product IDs.",
  ]) {
    assert.ok(doc.includes(phrase), `doc must include explicit boundary: ${phrase}`);
  }
  assert.ok(
    legacyUiDoc.includes("same-origin review-memory route") &&
      legacyUiDoc.includes("/api/research-candidate/review-memory"),
    "legacy UI doc must remain legacy route-compatible",
  );
  assert.ok(
    dbRoutesDoc.includes("Follow-up UI completion should bind to these DB-backed routes"),
    "DB routes doc must point UI follow-up to DB routes",
  );
  assert.ok(
    dbStoreDoc.includes("Follow-up route/UI completion should bind to this DB-backed store"),
    "DB store doc must point UI follow-up to DB store",
  );
}

function assertFixtureCoverage() {
  assert.equal(fixture.fixture_version, "research_candidate_review_memory_db_ui_runtime.sample.v0.1");
  assert.equal(fixture.ui_version, uiVersion);
  assert.equal(fixture.route_version, routeVersion);
  assert.equal(fixture.db_store_version, dbStoreVersion);
  assert.equal(fixture.contract_version, contractVersion);
  assert.equal(fixture.scope, scope);
  assert.equal(fixture.default_db_path, defaultDbPath);
  for (const dbPath of fixture.safe_db_path_examples) {
    assertSafeDbPath(dbPath);
  }
  for (const key of [
    "ui_state_example",
    "save_review_record_action_example",
    "list_review_records_action_example",
    "open_detail_action_example",
    "append_activity_action_example",
    "discard_with_reason_action_example",
    "bounded_error_display_examples",
    "forbidden_control_examples",
    "expected_route_call_examples",
    "authority_boundary_sample",
  ]) {
    assert.ok(Object.hasOwn(fixture, key), `fixture must include ${key}`);
  }
  assert.equal(
    fixture.forbidden_legacy_primary_route_refs?.[0],
    legacyJsonRoutePath,
    "fixture must identify legacy route as forbidden primary route",
  );
  for (const actionKey of [
    "save_review_record_action_example",
    "list_review_records_action_example",
    "open_detail_action_example",
    "append_activity_action_example",
    "discard_with_reason_action_example",
  ]) {
    assert.ok(
      fixture[actionKey].route_path.startsWith(dbRoutePrefix),
      `${actionKey} must use DB route prefix`,
    );
  }
  assert.equal(
    fixture.save_review_record_action_example.body.input.source_refs[0].public_safe,
    true,
    "save fixture source ref must be public_safe true",
  );
  assertSafeMarkersOnlyInBlockedOrErrorExamples(fixture);
  assertNoLiveLookingFixtureValues(fixtureText);
}

function assertPackageAndIndex() {
  assert.equal(packageJson.scripts?.[packageScriptName], packageScriptValue);
  assert.ok(
    packageJson.scripts?.[dbRoutePackageScriptName],
    "DB route smoke package script must exist",
  );
  assert.ok(packageJson.scripts?.[legacyUiPackageScriptName], "legacy UI smoke package script exists");
  const block = normalizeWhitespace(
    extractIndexBlock(index, "Research Candidate Review Memory DB UI Runtime Completion v0.1"),
  );
  for (const requiredText of [
    docPath,
    fixturePath,
    dbPanelPath,
    pagePath,
    packageScriptName,
    "research_candidate_review_memory_db_ui_runtime_completion_v0_1",
    "original Phase 2.4",
    "DB-backed same-origin routes",
    "Product-write remains parked by #686",
  ]) {
    assert.ok(block.includes(requiredText), `index block must include ${requiredText}`);
  }
}

function assertDbRoutePreconditions() {
  for (const routeFile of [collectionRoutePath, detailRoutePath, activityRoutePath, discardRoutePath]) {
    assert.ok(existsSync(routeFile), `${routeFile} must exist`);
  }
  assert.ok(
    routeContractSource.includes("isSafeResearchCandidateReviewMemoryDbRoutePathV01"),
    "DB route contract must expose path validation",
  );
}

function assertComponentBinding() {
  assert.ok(
    pageSource.includes("ResearchCandidateReviewMemoryDbPanel"),
    "page must render DB-backed panel",
  );
  assert.ok(
    pageSource.includes("@/components/research-candidate-review-memory-db-panel"),
    "page must import DB panel",
  );
  assert.ok(panelSource.includes(dbRoutePrefix), "panel must use DB-backed route prefix");
  assert.ok(!pageSource.includes("ReviewMemoryClient"), "page must not render legacy client as primary UI");
  assert.ok(!panelSource.includes(legacyJsonRoutePath), "panel must not call legacy JSON route");
  assert.ok(panelSource.includes('method: "POST"'), "panel must use POST actions");
  assert.ok(panelSource.includes('method: "GET"'), "panel must use GET actions");
  for (const requiredSource of [
    "saveReviewRecord",
    "listReviewRecords",
    "openReviewRecord",
    "loadActivityHistory",
    "appendReviewerNoteSummary",
    "discardReviewRecord",
    "copyReviewPacket",
    "/activity",
    "/discard",
    "encodeURIComponent",
    "create_review_record",
    "append_review_record_activity",
    "discard_review_record",
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

function assertNoForbiddenControls() {
  for (const text of forbiddenControlTexts) {
    assert.ok(!panelSource.includes(text), `panel must not include forbidden control text ${text}`);
  }
  assert.deepEqual(
    fixture.forbidden_control_examples,
    forbiddenControlTexts,
    "fixture must list forbidden controls for documentation",
  );
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

function assertSourceAndCandidateRendering() {
  for (const requiredSource of [
    "candidate_refs",
    "source_refs",
    "SourceRefList",
    "RefList",
    "ActivityList",
    "discardReason",
    "Authority Boundary",
  ]) {
    assert.ok(panelSource.includes(requiredSource), `panel must render ${requiredSource}`);
  }
}

function assertBoundedErrorRendering() {
  for (const errorCode of [
    "same_origin_required",
    "invalid_db_path",
    "db_missing",
    "schema_missing",
    "blocked_private_or_raw_payload",
    "blocked_forbidden_authority",
    "conflict_existing_record",
    "not_found",
  ]) {
    assert.ok(panelSource.includes(errorCode), `panel must include bounded error ${errorCode}`);
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
    "smoke:research-candidate-review-memory-db-routes-runtime-v0-1",
    "smoke:research-candidate-review-memory-db-store-runtime-v0-1",
    "smoke:research-candidate-review-memory-ui-v0-1",
  ]) {
    execFileSync("npm", ["run", scriptName], { stdio: "pipe" });
  }
}

function assertAuthorityBoundary(boundary, label) {
  assert.ok(boundary && typeof boundary === "object", `${label} authority boundary must exist`);
  for (const field of allowedTrueBoundaryFields) {
    assert.equal(boundary[field], true, `${label} ${field} must be true`);
    assert.ok(panelSource.includes(`${field}: true`), `panel source must include ${field}: true`);
  }
  for (const field of forbiddenFalseBoundaryFields) {
    assert.equal(boundary[field], false, `${label} ${field} must be false`);
    assert.ok(panelSource.includes(`${field}: false`), `panel source must include ${field}: false`);
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
    .replaceAll("SAFE_MARKER_RAW_SOURCE_BODY", "")
    .replaceAll("raw_source_body_included", "")
    .replaceAll("raw_provider_output_included", "")
    .replaceAll("raw_retrieval_output_included", "")
    .replaceAll("provider_thread_run_session_ids_included", "")
    .replaceAll("raw_db_rows_included", "")
    .replaceAll("raw_browser_dump_included", "")
    .replaceAll("hidden_reasoning_included", "")
    .replaceAll("private_urls_included", "")
    .replaceAll("local_private_paths_included", "")
    .replaceAll("secrets_included", "");
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
