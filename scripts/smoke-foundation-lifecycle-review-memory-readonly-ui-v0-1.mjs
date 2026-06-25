import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

const docPath = "docs/FOUNDATION_LIFECYCLE_REVIEW_MEMORY_READONLY_UI_V0_1.md";
const fixturePath =
  "fixtures/research-candidate-review.foundation-lifecycle-review-memory-readonly-ui.sample.v0.1.json";
const pagePath = "app/research-candidate/foundation-lifecycle-review-memory/page.tsx";
const clientPath =
  "app/research-candidate/foundation-lifecycle-review-memory/foundation-lifecycle-review-memory-client.tsx";
const uiContractPath =
  "lib/research-candidate-review/foundation-lifecycle-review-memory-ui-contract.ts";
const routePath = "app/api/research-candidate/review-memory/route.ts";
const packagePath = "package.json";
const indexPath = "docs/00_INDEX_LATEST.md";
const smokePath = "scripts/smoke-foundation-lifecycle-review-memory-readonly-ui-v0-1.mjs";
const uiVersion = "foundation_lifecycle_review_memory_readonly_ui.v0.1";
const routeVersion = "research_candidate_review_memory_routes.v0.1";
const storeVersion = "research_candidate_review_memory_store.v0.1";
const uiStatus = "readonly_ui_only";
const defaultStorePath = "tmp/research-candidate-review-memory/ui-preview-store.json";
const packageScriptName = "smoke:foundation-lifecycle-review-memory-readonly-ui-v0-1";
const packageScriptValue =
  "node scripts/smoke-foundation-lifecycle-review-memory-readonly-ui-v0-1.mjs";

const requiredSectionKinds = [
  "foundation_status",
  "lifecycle_summary",
  "calibration_summary",
  "logical_claim_shape_summary",
  "feedback_to_rule_summary",
  "temporal_handoff_summary",
  "target_agent_profile_summary",
  "review_memory_snapshot_summary",
  "authority_boundary",
  "deferred_work",
];

const forbiddenAuthorityFields = [
  "route_post_now",
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

assert.equal(fixture.fixture_version, "foundation_lifecycle_review_memory_readonly_ui.sample.v0.1");
assert.equal(fixture.ui_version, uiVersion);
assert.equal(fixture.route_version, routeVersion);
assert.equal(fixture.store_version, storeVersion);
assert.equal(fixture.scope, "project:augnes");
assert.equal(fixture.status, uiStatus);

assertUiContractExports();
assert.equal(uiContract.getDefaultFoundationLifecycleReviewMemoryStorePath(), defaultStorePath);
assertAuthorityBoundary(
  uiContract.getFoundationLifecycleReviewMemoryReadonlyUiAuthorityBoundary(),
  "ui contract",
);
assertAuthorityBoundary(fixture.sample_panel_state?.authority_boundary, "fixture panel state");
assert.deepEqual(
  uiContract.getFoundationLifecycleReviewMemoryReadonlySections().map((section) => section.section_kind),
  requiredSectionKinds,
);
assertNoForbiddenComponentImports(pageSource, pagePath);
assertNoForbiddenComponentImports(clientSource, clientPath);
assertClientGetOnlyBoundary();
assertClientLabels();
assertFixtureSections();
assertDisplaySafety();
assertDocCoverage();
assertNoForbiddenPositiveAuthorityGrants(doc, "doc");
assert.equal(packageJson.scripts[packageScriptName], packageScriptValue);
assertIndexCoverage();
assertRouteBaseline();

console.log(
  JSON.stringify(
    {
      smoke: "foundation-lifecycle-review-memory-readonly-ui-v0-1",
      final_status: "pass",
      ui_version: fixture.ui_version,
      route_version: fixture.route_version,
      store_version: fixture.store_version,
      status: fixture.status,
      sections: fixture.sample_sections.length,
      review_memory_rows: fixture.sample_review_memory_rows.length,
    },
    null,
    2,
  ),
);

function assertUiContractExports() {
  for (const exportedName of [
    "getFoundationLifecycleReviewMemoryReadonlyUiAuthorityBoundary",
    "getFoundationLifecycleReviewMemoryReadonlyUiBoundaryNotes",
    "getDefaultFoundationLifecycleReviewMemoryStorePath",
    "isSafeFoundationLifecycleReviewMemoryDisplayText",
    "getFoundationLifecycleReviewMemoryReadonlySections",
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
  for (const forbiddenImport of ["react", "fs", "node:fs", "review-memory-store"]) {
    assert.ok(
      !imports.some((specifier) => specifier === forbiddenImport || specifier.includes(forbiddenImport)),
      `UI contract helper must not import ${forbiddenImport}`,
    );
  }
  assert.ok(!uiContractSource.includes("fetch("), "UI contract helper must not call fetch");
  assert.ok(!uiContractSource.includes("route.ts"), "UI contract helper must not call route handlers");
}

function assertAuthorityBoundary(boundary, label) {
  assert.equal(boundary?.readonly_ui_only, true, `${label} readonly_ui_only true`);
  assert.equal(boundary?.route_get_only, true, `${label} route_get_only true`);
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

function assertClientGetOnlyBoundary() {
  assert.ok(
    clientSource.includes("/api/research-candidate/review-memory"),
    "client must use same-origin review-memory route path",
  );
  for (const forbiddenText of [
    'method: "POST"',
    "method:'POST'",
    "postRouteAction",
    "create_empty_snapshot",
    "upsert_record",
    "discard_record",
    "supersede_record",
    "onSubmit",
  ]) {
    assert.ok(!clientSource.includes(forbiddenText), `client must not contain ${forbiddenText}`);
  }
  assert.ok(clientSource.includes('method: "GET"'), "client must use GET");
  assert.ok(
    clientSource.includes("Load review memory snapshot"),
    "client must include Load review memory snapshot",
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

function assertClientLabels() {
  for (const sectionLabel of [
    "Foundation Status",
    "Lifecycle Summary",
    "Calibration Summary",
    "Logical Claim Shape Summary",
    "Feedback-to-Rule Summary",
    "Temporal Handoff Summary",
    "Target-Agent Packet Profile Summary",
    "Review Memory Snapshot Summary",
    "Authority Boundary",
    "Deferred Work",
  ]) {
    assert.ok(clientSource.includes(sectionLabel), `client source must include ${sectionLabel}`);
  }
  for (const boundaryLabel of [
    "Review memory is not truth.",
    "Candidate memory is not Perspective state.",
    "Lifecycle status is derived review context, not source of truth.",
    "Calibration context is diagnostic, not readiness authority.",
    "Logical shape context is structure-only, not proof.",
    "Feedback-to-Rule context is candidate-only, not rule mutation.",
    "Temporal handoff context is diagnostic, not authority.",
    "Target-agent packet profile is advisory, not prompt execution.",
    "Product-write remains parked by #686.",
  ]) {
    assert.ok(clientSource.includes(boundaryLabel), `client source must include ${boundaryLabel}`);
  }
}

function assertFixtureSections() {
  assert.deepEqual(fixture.sample_panel_state?.section_kinds, requiredSectionKinds);
  assert.deepEqual(
    fixture.sample_sections.map((section) => section.section_kind),
    requiredSectionKinds,
  );
  for (const lifecycleState of ["active", "discarded", "superseded"]) {
    assert.ok(
      fixture.sample_review_memory_rows.some((row) => row.lifecycle_state === lifecycleState),
      `fixture rows must include ${lifecycleState}`,
    );
  }
}

function assertDisplaySafety() {
  assertNoUnsafeDisplayText(
    JSON.stringify({
      sample_sections: fixture.sample_sections,
      sample_review_memory_rows: fixture.sample_review_memory_rows,
    }),
    "fixture display",
  );
  assertNoUnsafeDisplayText(extractClientDisplayedSummaries(), "client displayed summaries");
}

function assertNoUnsafeDisplayText(source, label) {
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
    assert.ok(!source.includes(forbiddenText), `${label} must not include ${forbiddenText}`);
  }
}

function extractClientDisplayedSummaries() {
  const start = clientSource.indexOf("const sectionLabels");
  const end = clientSource.indexOf("export function FoundationLifecycleReviewMemoryClient");
  assert.ok(start >= 0 && end > start, "client displayed summary constants must be found");
  return clientSource.slice(start, end);
}

function assertDocCoverage() {
  for (const requiredPhrase of [
    "Foundation/Lifecycle/Review Memory Read-only UI is readonly-ui-only.",
    "It implements the next Phase 2 UI consolidation slice from the integrated development roadmap guide v0.2.",
    "It follows #762 Lifecycle, #763 Calibration, #764 Logical Shape, #765/#766",
    "It does not add new API routes.",
    "It does not POST.",
    "It does not perform create/upsert/discard/supersede.",
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
    "Lifecycle status is derived review context, not source of truth.",
    "Calibration context is diagnostic, not readiness authority.",
    "Logical shape context is structure-only, not proof.",
    "Feedback-to-Rule context is candidate-only, not rule mutation.",
    "Temporal handoff context is diagnostic, not authority.",
    "Target-agent packet profile is advisory, not prompt execution.",
    "Discard is not deletion.",
    "Supersede preserves lineage.",
    "Source refs are lineage pointers, not proof.",
    "Source refs must be public-safe symbolic refs.",
    "Store paths remain constrained by the #771 route allowlist.",
    "UI is read-only and does not perform automatic background writes.",
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
  const block = extractIndexBlock(indexDoc, "Foundation/Lifecycle/Review Memory Read-only UI v0.1");
  for (const requiredText of [
    docPath,
    fixturePath,
    pagePath,
    clientPath,
    uiContractPath,
    routePath,
    smokePath,
    "integrated roadmap guide v0.2",
    "readonly-ui-only",
  ]) {
    assert.ok(block.includes(requiredText), `index block must include ${requiredText}`);
  }
  for (const requiredBoundaryText of [
    "does not implement new routes",
    "POST",
    "write actions",
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
  for (const forbiddenPattern of [
    /new API routes? (were|was) added/i,
    /POST (was|were) added/i,
    /write actions? (were|was) added/i,
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
  assert.ok(routeSource.includes("export async function POST"), "route baseline may still expose #771 POST");
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
