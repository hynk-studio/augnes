import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

const docPath = "docs/RESEARCH_CANDIDATE_REVIEW_MEMORY_UI_V0_1.md";
const fixturePath = "fixtures/research-candidate-review.memory-ui.sample.v0.1.json";
const pagePath = "app/research-candidate/review-memory/page.tsx";
const clientPath = "app/research-candidate/review-memory/review-memory-client.tsx";
const uiContractPath = "lib/research-candidate-review/review-memory-ui-contract.ts";
const routePath = "app/api/research-candidate/review-memory/route.ts";
const packagePath = "package.json";
const indexPath = "docs/00_INDEX_LATEST.md";
const smokePath = "scripts/smoke-research-candidate-review-memory-ui-v0-1.mjs";
const uiVersion = "research_candidate_review_memory_ui.v0.1";
const routeVersion = "research_candidate_review_memory_routes.v0.1";
const storeVersion = "research_candidate_review_memory_store.v0.1";
const uiStatus = "ui_route_client_only";
const defaultStorePath = "tmp/research-candidate-review-memory/ui-preview-store.json";
const packageScriptName = "smoke:research-candidate-review-memory-ui-v0-1";
const packageScriptValue =
  "node scripts/smoke-research-candidate-review-memory-ui-v0-1.mjs";

const forbiddenAuthorityFields = [
  "automatic_write_on_load",
  "direct_file_write_now",
  "direct_store_helper_write_now",
  "new_api_route_added_now",
  "db_migration_added_now",
  "db_query_or_write_now",
  "provider_openai_call_now",
  "source_fetch_now",
  "retrieval_rag_execution_now",
  "source_of_truth",
  "proof_or_evidence_record",
  "perspective_promotion",
  "durable_perspective_state",
  "work_mutation",
  "codex_execution_authority",
  "github_automation_authority",
  "git_ledger_export_authority",
  "product_write_authority",
  "product_id_allocation_authority",
];

for (const filePath of [
  docPath,
  fixturePath,
  pagePath,
  clientPath,
  uiContractPath,
  routePath,
  packagePath,
  indexPath,
]) {
  assert.ok(existsSync(filePath), `${filePath} must exist`);
}

const doc = readFile(docPath);
const fixture = readJson(fixturePath);
const pageSource = readFile(pagePath);
const clientSource = readFile(clientPath);
const uiContractSource = readFile(uiContractPath);
const routeSource = readFile(routePath);
const packageJson = readJson(packagePath);
const indexDoc = readFile(indexPath);
const uiContract = await import(pathToFileURL(uiContractPath).href);

assert.equal(fixture.fixture_version, "research_candidate_review_memory_ui.sample.v0.1");
assert.equal(fixture.ui_version, uiVersion);
assert.equal(fixture.route_version, routeVersion);
assert.equal(fixture.store_version, storeVersion);
assert.equal(fixture.scope, "project:augnes");
assert.equal(fixture.status, uiStatus);

assertUiContractExports();
assert.equal(uiContract.getDefaultReviewMemoryUiStorePath(), defaultStorePath);
assertAuthorityBoundary(uiContract.getReviewMemoryUiAuthorityBoundary(), "ui contract");
assertAuthorityBoundary(fixture.sample_panel_state?.authority_boundary, "fixture panel state");
assert.equal(fixture.sample_panel_state?.store_file_path, defaultStorePath);
assert.equal(fixture.sample_panel_state?.ui_version, uiVersion);
assert.equal(fixture.sample_panel_state?.status, uiStatus);

assertNoForbiddenComponentImports(pageSource, pagePath);
assertNoForbiddenComponentImports(clientSource, clientPath);
assertClientRouteAndStateBoundary();
assertClientLabelsAndActions();
assertClientExplicitPostBoundary();
assertClientForbiddenAuthorityWording();
assertFixtureSafety();
assertDocCoverage();
assertNoForbiddenPositiveAuthorityGrants(doc, "doc");
assert.equal(packageJson.scripts[packageScriptName], packageScriptValue);
assertIndexCoverage();
assertRouteBaseline();

console.log(
  JSON.stringify(
    {
      smoke: "research-candidate-review-memory-ui-v0-1",
      final_status: "pass",
      ui_version: fixture.ui_version,
      route_version: fixture.route_version,
      store_version: fixture.store_version,
      status: fixture.status,
      display_records: fixture.sample_safe_display_records.length,
    },
    null,
    2,
  ),
);

function assertUiContractExports() {
  for (const exportedName of [
    "getReviewMemoryUiAuthorityBoundary",
    "getReviewMemoryUiBoundaryNotes",
    "isSafeReviewMemoryUiDisplayText",
    "getDefaultReviewMemoryUiStorePath",
  ]) {
    assert.equal(
      typeof uiContract[exportedName],
      "function",
      `UI contract must export ${exportedName}`,
    );
    assert.ok(
      uiContractSource.includes(`export function ${exportedName}`),
      `UI contract source must export ${exportedName}`,
    );
  }
  const imports = getImportSpecifiers(uiContractSource);
  for (const forbiddenImport of ["react", "fs", "node:fs"]) {
    assert.ok(
      !imports.some((specifier) => specifier === forbiddenImport || specifier.includes(forbiddenImport)),
      `UI contract helper must not import ${forbiddenImport}`,
    );
  }
  assert.ok(!uiContractSource.includes("fetch("), "UI contract helper must not call fetch");
  assert.ok(!uiContractSource.includes("route.ts"), "UI contract helper must not call route handlers");
}

function assertAuthorityBoundary(boundary, label) {
  assert.equal(boundary?.ui_route_client_only, true, `${label} ui_route_client_only true`);
  assert.equal(boundary?.route_backed_only, true, `${label} route_backed_only true`);
  for (const field of forbiddenAuthorityFields) {
    assert.equal(boundary?.[field], false, `${label} ${field} false`);
  }
}

function assertNoForbiddenComponentImports(source, filePath) {
  const imports = getImportSpecifiers(source);
  for (const forbiddenImport of [
    "fs",
    "node:fs",
    "path",
    "node:path",
    "review-memory-store",
    "OpenAI",
    "better-sqlite3",
    "sqlite",
    "child_process",
  ]) {
    assert.ok(
      !imports.some((specifier) => specifier === forbiddenImport || specifier.includes(forbiddenImport)),
      `${filePath} must not import ${forbiddenImport}`,
    );
  }
}

function assertClientRouteAndStateBoundary() {
  assert.ok(
    clientSource.includes("/api/research-candidate/review-memory"),
    "client must use same-origin review-memory route path",
  );
  for (const externalUrlMarker of ["http://", "https://"]) {
    assert.ok(
      !clientSource.includes(externalUrlMarker),
      `client must not contain external fetch URL marker ${externalUrlMarker}`,
    );
  }
  for (const forbiddenStateApi of [
    "localStorage",
    "sessionStorage",
    "indexedDB",
    "document.cookie",
    "setInterval",
    "setTimeout",
  ]) {
    assert.ok(!clientSource.includes(forbiddenStateApi), `client must not use ${forbiddenStateApi}`);
  }
}

function assertClientLabelsAndActions() {
  for (const requiredLabel of [
    "Review memory is not truth.",
    "Candidate memory is not Perspective state.",
    "Discard is not deletion.",
    "Supersede preserves lineage.",
    "Source refs are lineage pointers, not proof.",
    "Product-write remains parked by #686.",
  ]) {
    assert.ok(clientSource.includes(requiredLabel), `client source must include ${requiredLabel}`);
  }
  for (const actionLabel of [
    "Load snapshot",
    "Create empty snapshot",
    "Upsert record",
    "Discard record",
    "Supersede record",
  ]) {
    assert.ok(clientSource.includes(actionLabel), `client source must include ${actionLabel}`);
  }
}

function assertClientExplicitPostBoundary() {
  assert.ok(clientSource.includes('method: "POST"'), "client must use explicit POST requests");
  assert.ok(clientSource.includes('method: "GET"'), "client must use explicit GET load");
  for (const submitHandler of ["upsertRecord", "discardRecord", "supersedeRecord"]) {
    assert.ok(
      clientSource.includes(`onSubmit={${submitHandler}}`),
      `${submitHandler} must be wired to form submit`,
    );
  }
  assert.ok(
    clientSource.includes("onClick={createEmptySnapshot}"),
    "create empty snapshot must be wired to explicit button click",
  );
  assert.ok(
    clientSource.includes("onClick={loadSnapshot}"),
    "load snapshot must be wired to explicit button click",
  );
  assert.ok(clientSource.includes("event.preventDefault()"), "forms must prevent default submit");
  assert.ok(!clientSource.includes("useEffect"), "client must not auto-POST on render or useEffect");
  assert.ok(
    !clientSource.includes("postRouteAction(") ||
      clientSource.includes("onSubmit={upsertRecord}") ||
      clientSource.includes("onClick={createEmptySnapshot}"),
    "POST helper must be reachable through explicit UI handlers",
  );
}

function assertClientForbiddenAuthorityWording() {
  for (const forbiddenText of [
    "proof created",
    "evidence record created",
    "Perspective promoted",
    "state committed",
    "product write enabled",
    "product write authority granted",
    "Codex executed",
    "GitHub automation",
  ]) {
    assert.ok(!clientSource.includes(forbiddenText), `client must not contain ${forbiddenText}`);
  }
}

function assertFixtureSafety() {
  assert.equal(fixture.sample_snapshot_summary?.store_version, storeVersion);
  assert.equal(fixture.sample_snapshot_summary?.source_refs_are_lineage_only, true);
  assert.equal(fixture.sample_snapshot_summary?.review_memory_is_not_truth, true);
  assert.ok(
    Array.isArray(fixture.sample_safe_display_records),
    "fixture must include sample_safe_display_records",
  );
  assert.ok(
    fixture.sample_safe_display_records.some((record) => record.lifecycle_state === "active"),
    "fixture must include active record summary",
  );
  assert.ok(
    fixture.sample_safe_display_records.some((record) => record.lifecycle_state === "discarded"),
    "fixture must include discarded record summary",
  );
  assert.ok(
    fixture.sample_safe_display_records.some((record) => record.lifecycle_state === "superseded"),
    "fixture must include superseded record summary",
  );
  assertNoUnsafeFixtureText(
    JSON.stringify({
      sample_snapshot_summary: fixture.sample_snapshot_summary,
      sample_safe_display_records: fixture.sample_safe_display_records,
    }),
  );
}

function assertNoUnsafeFixtureText(source) {
  for (const forbiddenText of [
    "raw source body",
    "raw provider output",
    "raw conversation",
    "hidden reasoning",
    "private URL",
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
    "raw db row",
    "browser dump",
  ]) {
    assert.ok(!source.includes(forbiddenText), `fixture display must not include ${forbiddenText}`);
  }
}

function assertDocCoverage() {
  for (const requiredPhrase of [
    "Research Candidate Review Memory UI is ui-route-client-only.",
    "It implements Phase 2.4 from the integrated development roadmap guide v0.2.",
    "It follows the #769 Review Memory Contract, #770 Review Memory Store, and #771",
    "It does not add new API routes.",
    "It does not directly write files.",
    "It does not import or call the store helper from UI components.",
    "It does not add DB migrations.",
    "It does not query or write DB.",
    "It does not call provider/OpenAI.",
    "It does not fetch external URLs.",
    "It does not execute retrieval/RAG.",
    "It does not create proof/evidence.",
    "It does not promote Perspective.",
    "It does not mutate durable Perspective state.",
    "It does not mutate work.",
    "It does not execute Codex.",
    "It does not call GitHub.",
    "It does not export Git Ledger packets.",
    "It does not write product records.",
    "Product-write remains parked by #686.",
    "Review memory is not truth.",
    "Candidate memory is not Perspective state.",
    "Discard is not deletion.",
    "Supersede preserves lineage.",
    "Source refs are lineage pointers, not proof.",
    "Source refs must be public-safe symbolic refs.",
    "Store paths remain constrained by the #771 route allowlist.",
    "UI actions are explicit operator actions, not automatic background writes.",
    "integrated development roadmap guide v0.2",
    "background inputs already integrated into the roadmap guide",
  ]) {
    assert.ok(doc.includes(requiredPhrase), `doc must include ${requiredPhrase}`);
  }
}

function assertNoForbiddenPositiveAuthorityGrants(source, label) {
  for (const field of forbiddenAuthorityFields) {
    assert.ok(!source.includes(`${field}: true`), `${label} must not grant ${field}`);
  }
}

function assertIndexCoverage() {
  const block = extractIndexBlock(indexDoc, "Research Candidate Review Memory UI v0.1");
  for (const requiredText of [
    docPath,
    fixturePath,
    pagePath,
    clientPath,
    uiContractPath,
    routePath,
    smokePath,
    "Phase 2.4",
    "integrated roadmap guide v0.2",
    "ui-route-client-only",
    "uses #771 routes",
  ]) {
    assert.ok(block.includes(requiredText), `index block must include ${requiredText}`);
  }
  for (const requiredBoundaryText of [
    "does not implement new routes",
    "DB migrations",
    "provider calls",
    "source fetch",
    "retrieval",
    "proof/evidence",
    "promotion",
    "GitHub automation",
    "Git Ledger",
    "product write",
    "product ID allocation",
  ]) {
    assert.ok(block.includes(requiredBoundaryText), `index block must include ${requiredBoundaryText}`);
  }
  assert.ok(
    block.includes("implements Phase 2.4 from the integrated roadmap guide v0.2 as ui-route-client-only"),
    "index block must mention Phase 2.4 as ui-route-client-only",
  );
  for (const forbiddenPattern of [
    /new API routes? (were|was) added/i,
    /DB migration (were|was) added/i,
    /provider runtime (were|was) added/i,
    /retrieval runtime (were|was) added/i,
    /promotion (were|was) added/i,
    /Codex execution (were|was) added/i,
    /GitHub automation (were|was) added/i,
    /Git Ledger export (were|was) added/i,
    /product write (were|was) added/i,
    /product ID allocation (were|was) added/i,
  ]) {
    assert.doesNotMatch(block, forbiddenPattern);
  }
}

function assertRouteBaseline() {
  assert.ok(routeSource.includes("export async function GET"), "route baseline must expose GET");
  assert.ok(routeSource.includes("export async function POST"), "route baseline must expose POST");
  assert.ok(
    routeSource.includes("research_candidate_review_memory_routes.v0.1"),
    "route baseline must remain v0.1",
  );
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

function readFile(filePath) {
  return readFileSync(filePath, "utf8");
}

function readJson(filePath) {
  return JSON.parse(readFile(filePath));
}
