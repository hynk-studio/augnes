#!/usr/bin/env node
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

const docsPath = "docs/OPERATOR_PATH_BACKEND_REMAINING_GAP_INVENTORY_V0_1.md";
const fixturePath =
  "fixtures/operator-path-backend-remaining-gap-inventory.sample.v0.1.json";
const smokePath =
  "scripts/smoke-operator-path-backend-remaining-gap-inventory-v0-1.mjs";
const packagePath = "package.json";
const indexPath = "docs/00_INDEX_LATEST.md";

const sliceName = "operator_path_backend_remaining_gap_inventory_v0_1";
const packageScriptName = "smoke:operator-path-backend-remaining-gap-inventory-v0-1";
const packageScriptValue =
  "node scripts/smoke-operator-path-backend-remaining-gap-inventory-v0-1.mjs";

const checkedSurfaces = [
  "route:/api/research-retrieval/final-rag-answer",
  "route:/api/research-retrieval/final-rag-answer/review-memory",
  "route:/api/research-candidate-review/review-records",
  "route:/api/research-candidate-review/review-records/[review_record_id]",
  "route:/api/research-candidate-review/review-records/[review_record_id]/activity",
  "route:/api/perspective/promotion/readiness-packet",
];

const boundaryCategories = [
  "no-external-IO coverage",
  "DB path rejection coverage",
  "missing DB response behavior",
  "schema_missing response behavior",
  "read-only GET route behavior",
  "Review Memory write isolation",
  "promotion readiness read-only behavior",
  "runtime audit event coverage",
  "runtime audit invalid path nonfatal behavior",
  "raw data redaction/public-safety boundary",
  "selected-route audit coverage",
  "changed-file guard / allowlist consistency",
  "existing validation command coverage",
  "known backend warnings that should not be confused with failure",
  "remaining backend work that can proceed without human review",
  "backend work that must remain blocked until human review because it crosses authority",
];

const findingClassifications = [
  "no_remaining_gap_observed",
  "docs_or_fixture_gap",
  "smoke_coverage_gap",
  "backend_runtime_gap",
  "deferred_authority_gap",
  "human_judgment_gap",
];

const deniedCapabilities = [
  "product authority",
  "promotion execution",
  "promotion decision write",
  "proof/evidence creation",
  "durable state apply",
  "Formation Receipt write",
  "product-write",
  "accepted evidence ref write",
  "product ID allocation",
  "GitHub actuation",
  "release execution",
  "release authority",
  "live provider validation",
  "source fetching/retrieval expansion",
  "broad all-route audit instrumentation",
  "UI behavior",
  "API routes",
  "DB schema",
  "migrations",
];

const forbiddenCapabilityKeys = [
  "product_authority",
  "promotion_execution",
  "promotion_decision_write",
  "promotion_decision_store_usage_or_write",
  "proof_evidence_creation",
  "durable_perspective_state_apply",
  "formation_receipt_write",
  "product_write",
  "accepted_evidence_ref_write",
  "product_id_allocation",
  "github_actuation",
  "release_execution",
  "release_authority",
  "live_provider_validation",
  "source_fetching_retrieval_expansion",
  "broad_all_route_audit_instrumentation",
  "ui_behavior",
  "api_routes",
  "db_schema_or_migrations",
];

const expectedChangedFiles = new Set([
  docsPath,
  fixturePath,
  smokePath,
  packagePath,
  indexPath,
  "scripts/smoke-operator-path-human-review-packet-v0-1.mjs",
  "scripts/smoke-operator-path-backend-safety-validation-bundle-v0-1.mjs",
  "scripts/smoke-operator-path-assisted-manual-qa-execution-report-v0-1.mjs",
  "scripts/smoke-operator-path-manual-qa-runbook-v0-1.mjs",
  "scripts/smoke-final-rag-answer-review-memory-operator-path-usability-audit-v0-1.mjs",
  "scripts/smoke-final-rag-answer-review-memory-operator-browser-validation-v0-1.mjs",
  "scripts/smoke-final-rag-answer-review-memory-end-to-end-operator-path-v0-1.mjs",
  "scripts/smoke-promotion-readiness-packet-from-review-memory-v0-1.mjs",
  "scripts/smoke-final-answer-candidate-review-ui-binding-v0-1.mjs",
  "scripts/smoke-final-rag-answer-review-memory-binding-v0-1.mjs",
  "scripts/smoke-final-rag-answer-generation-candidate-review-v0-1.mjs",
  "docs/OPERATOR_PATH_PUBLIC_SAFE_ARTIFACT_INDEX_V0_1.md",
  "fixtures/operator-path-public-safe-artifact-index.sample.v0.1.json",
  "scripts/smoke-operator-path-public-safe-artifact-index-v0-1.mjs",
  "components/promotion-readiness-packet-panel.tsx",
  "app/perspective/promotion/readiness-packet/page.tsx",
  "docs/PROMOTION_READINESS_PACKET_UI_READ_DISPLAY_BINDING_V0_1.md",
  "fixtures/promotion-readiness-packet-ui-read-display-binding.sample.v0.1.json",
  "scripts/smoke-promotion-readiness-packet-ui-read-display-binding-v0-1.mjs",
  "docs/PROMOTION_READINESS_PACKET_UI_BROWSER_STATIC_VALIDATION_V0_1.md",
  "fixtures/promotion-readiness-packet-ui-browser-static-validation.sample.v0.1.json",
  "reports/browser/2026-06-29-promotion-readiness-packet-ui-browser-static-validation.md",
  "scripts/browser-validate-promotion-readiness-packet-ui-browser-static-validation-v0-1.mjs",
  "scripts/smoke-promotion-readiness-packet-ui-browser-static-validation-v0-1.mjs",
  "app/perspective/promotion/page.tsx",
  "components/promotion-readiness-packet-review-hub.tsx",
  "docs/PROMOTION_READINESS_PACKET_REVIEW_HUB_READ_DISPLAY_V0_1.md",
  "fixtures/promotion-readiness-packet-review-hub-read-display.sample.v0.1.json",
  "reports/browser/2026-06-29-promotion-readiness-packet-review-hub-read-display.md",
  "scripts/browser-validate-promotion-readiness-packet-review-hub-read-display-v0-1.mjs",
  "scripts/smoke-promotion-readiness-packet-review-hub-read-display-v0-1.mjs",
  "app/page.tsx",
  "components/promotion-readiness-review-hub-cockpit-entrypoint.tsx",
  "docs/PROMOTION_READINESS_REVIEW_HUB_COCKPIT_ENTRYPOINT_V0_1.md",
  "fixtures/promotion-readiness-review-hub-cockpit-entrypoint.sample.v0.1.json",
  "reports/browser/2026-06-29-promotion-readiness-review-hub-cockpit-entrypoint.md",
  "scripts/browser-validate-promotion-readiness-review-hub-cockpit-entrypoint-v0-1.mjs",
  "scripts/smoke-promotion-readiness-review-hub-cockpit-entrypoint-v0-1.mjs",
]);

for (const filePath of [docsPath, fixturePath, smokePath, packagePath, indexPath]) {
  assert.ok(existsSync(filePath), `${filePath} must exist`);
}

const rawDocs = readText(docsPath);
const docs = normalize(rawDocs);
const fixtureText = readText(fixturePath);
const fixture = JSON.parse(fixtureText);
const packageJson = JSON.parse(readText(packagePath));
const index = readText(indexPath);

assertPointers();
assertBasisAndGatePolicy();
assertSurfacesAndCategories();
assertFindings();
assertHumanStatus();
assertAuthorityBoundary();
assertPublicSafe();
assertRecommendation();
assertChangedFileScope();

console.log(
  JSON.stringify(
    {
      smoke: "operator-path-backend-remaining-gap-inventory-v0-1",
      final_status: "pass",
      slice_name: sliceName,
      backend_runtime_gap_found: false,
      human_signoff_completed: false,
      human_review_still_required: true,
      final_recommendation: fixture.final_recommendation,
    },
    null,
    2,
  ),
);

function assertPointers() {
  assert.equal(fixture.slice_name, sliceName);
  assert.equal(fixture.version, "operator_path_backend_remaining_gap_inventory.v0.1");
  assert.equal(fixture.packet_type, "backend_remaining_gap_inventory");
  assert.deepEqual(fixture.basis_prs, [856, 857]);
  assert.equal(packageJson.scripts?.[packageScriptName], packageScriptValue);
  for (const pointer of [docsPath, fixturePath, smokePath, packageScriptName, sliceName]) {
    assertIncludes(index, pointer, `index pointer ${pointer}`);
  }
}

function assertBasisAndGatePolicy() {
  for (const phrase of [
    "Current basis: PR #856",
    "PR #857",
    "Human review is not a global gate for non-authority backend work.",
    "Human review remains required before authority-increasing transitions.",
    "does not perform human review",
    "does not claim human signoff",
  ]) {
    assertIncludes(rawDocs, phrase, `basis/gate phrase ${phrase}`);
  }
  assert.equal(
    fixture.gate_policy.human_review_is_not_global_gate_for_non_authority_backend_work,
    true,
  );
  assert.equal(
    fixture.gate_policy.human_review_required_before_authority_increasing_transitions,
    true,
  );
}

function assertSurfacesAndCategories() {
  for (const surface of checkedSurfaces) {
    assertIncludes(rawDocs, surface, `doc surface ${surface}`);
    assert.ok(fixture.checked_surfaces.includes(surface), `fixture surface ${surface}`);
  }
  for (const category of boundaryCategories) {
    assertIncludes(rawDocs, category, `doc boundary category ${category}`);
    assert.ok(fixture.boundary_categories.includes(category), `fixture category ${category}`);
  }
  for (const classification of findingClassifications) {
    assertIncludes(rawDocs, classification, `doc classification ${classification}`);
    assert.ok(
      fixture.finding_classifications.includes(classification),
      `fixture classification ${classification}`,
    );
  }
}

function assertFindings() {
  assert.ok(Array.isArray(fixture.findings), "fixture findings must be an array");
  assert.ok(fixture.findings.length >= 6, "fixture includes bounded findings");
  for (const finding of fixture.findings) {
    for (const field of [
      "finding_id",
      "category",
      "surface",
      "evidence_source",
      "proposed_next_slice",
      "authority_risk",
      "may_proceed_before_human_review",
    ]) {
      assert.ok(Object.hasOwn(finding, field), `finding ${finding.finding_id} has ${field}`);
    }
    assert.ok(
      findingClassifications.includes(finding.category),
      `finding category is bounded: ${finding.category}`,
    );
    assert.equal(typeof finding.may_proceed_before_human_review, "boolean");
    assertNoUnsafeText(JSON.stringify(finding), `finding ${finding.finding_id}`);
  }
  for (const fieldName of [
    "finding_id",
    "category",
    "surface",
    "evidence_source",
    "proposed_next_slice",
    "authority_risk",
    "may_proceed_before_human_review",
  ]) {
    assertIncludes(rawDocs, fieldName, `doc finding field ${fieldName}`);
  }
}

function assertHumanStatus() {
  assertIncludes(rawDocs, "human_signoff_completed: false", "doc human signoff false");
  assertIncludes(rawDocs, "human_review_still_required: true", "doc human review true");
  assert.equal(fixture.human_signoff_completed, false);
  assert.equal(fixture.human_review_still_required, true);
}

function assertAuthorityBoundary() {
  for (const phrase of deniedCapabilities) {
    assertIncludes(docs, normalize(phrase), `doc denies ${phrase}`);
  }
  for (const capability of forbiddenCapabilityKeys) {
    assert.ok(
      fixture.forbidden_capabilities.includes(capability),
      `fixture forbids ${capability}`,
    );
    assert.equal(fixture.authority_boundary[capability], false, `authority ${capability}`);
  }
  for (const phrase of [
    "does not create proof/evidence",
    "does not write promotion decisions",
    "does not use or write the promotion decision store",
    "does not execute promotion",
    "does not create durable Perspective state",
    "does not write Formation Receipts",
    "does not product-write",
    "does not write accepted evidence refs",
    "does not allocate product IDs",
    "does not add GitHub actuation",
    "does not add release execution",
    "does not call live providers",
    "does not fetch sources",
    "does not expand retrieval execution",
    "does not add broad all-route audit instrumentation",
    "does not add UI behavior",
    "does not add API routes",
    "does not add DB schema or migrations",
  ]) {
    assertIncludes(docs, normalize(phrase), `doc boundary ${phrase}`);
  }
  for (const field of [
    "validation_pass_is_truth",
    "validation_pass_is_proof",
    "validation_pass_is_approval",
    "validation_pass_is_product_readiness",
  ]) {
    assert.equal(fixture.authority_boundary[field], false, field);
  }
}

function assertPublicSafe() {
  for (const phrase of [
    "does not embed raw artifacts",
    "raw browser reports",
    "screenshots",
    "terminal logs",
    "browser dumps",
    "raw DB rows",
    "raw route responses",
    "raw provider output",
    "prompts",
    "retrieval output",
    "source bodies",
    "secrets",
    "private paths",
    "GitHub payloads",
    "release payloads",
  ]) {
    assertIncludes(docs, normalize(phrase), `public-safe doc phrase ${phrase}`);
  }
  assert.doesNotMatch(rawDocs, /!\[[^\]]*]\([^)]*\)/, "doc must not embed images");
  for (const [key, value] of Object.entries(fixture.public_safe_policy)) {
    if (key === "summary_labels_only" || key === "symbolic_refs_only") {
      assert.equal(value, true, `public_safe_policy.${key}`);
    } else {
      assert.equal(value, false, `public_safe_policy.${key}`);
    }
  }
  assertNoUnsafeText(rawDocs, "doc");
  assertNoUnsafeText(fixtureText, "fixture");
}

function assertRecommendation() {
  assert.ok(Array.isArray(fixture.machine_safe_next_slices));
  assert.ok(
    fixture.machine_safe_next_slices.includes("operator_path_public_safe_artifact_index_v0_1"),
    "machine safe next slice includes artifact index",
  );
  for (const nextSlice of fixture.machine_safe_next_slices) {
    assert.doesNotMatch(
      nextSlice,
      /promotion|product-write|release|write_authority/i,
      `machine safe next slice is non-authority: ${nextSlice}`,
    );
  }
  for (const blocked of [
    "promotion execution",
    "promotion decision write",
    "promotion decision store usage/write",
    "product-write",
    "accepted evidence ref write",
    "product ID allocation",
    "proof/evidence creation",
    "durable Perspective state apply",
    "Formation Receipt write",
    "GitHub actuation",
    "release execution/publication",
  ]) {
    assert.ok(
      fixture.blocked_until_human_review.includes(blocked),
      `blocked until human review ${blocked}`,
    );
  }
  assert.equal(fixture.final_recommendation, "operator_path_public_safe_artifact_index_v0_1");
  assert.doesNotMatch(
    fixture.final_recommendation,
    /promotion execution|product-write|release/i,
    "final recommendation must not be promotion/product/release",
  );
  assertIncludes(
    rawDocs,
    "Proceed to\n`operator_path_public_safe_artifact_index_v0_1`.",
    "doc final recommendation",
  );
  assertIncludes(rawDocs, "Do not recommend promotion execution, product-write, or release.", "not next");
}

function assertChangedFileScope() {
  const changed = changedFiles();
  const unexpected = [...changed].filter((filePath) => !expectedChangedFiles.has(filePath)).sort();
  assert.deepEqual(unexpected, [], `Unexpected changed file(s): ${unexpected.join(", ")}`);
}

function assertNoUnsafeText(value, label) {
  for (const pattern of [
    /\/Users\/[^/\s]+/i,
    /sk-[A-Za-z0-9_-]{12,}/,
    /BEGIN (?:RSA |OPENSSH |EC |)PRIVATE KEY/,
    /browserSessionDump/i,
    /browser_session_dump/i,
    /github_payload\s*:\s*\{/i,
    /release_payload\s*:\s*\{/i,
    /raw_db_rows\s*:\s*\[/i,
    /raw_route_responses\s*:\s*\[/i,
    /raw_provider_output\s*:\s*["{[]/i,
    /raw_prompt\s*:\s*["{[]/i,
    /raw_retrieval_output\s*:\s*["{[]/i,
    /source_body\s*:\s*["{[]/i,
    /terminal_log\s*:\s*["{[]/i,
  ]) {
    assert.doesNotMatch(value, pattern, `${label} must not contain ${pattern}`);
  }
}

function changedFiles() {
  const changed = new Set();
  for (const args of [
    ["diff", "--name-only"],
    ["ls-files", "--others", "--exclude-standard"],
  ]) {
    for (const filePath of runGitLines(args)) changed.add(filePath);
  }
  for (const args of [
    ["diff", "--name-only", "origin/main...HEAD"],
    ["diff", "--name-only", "main...HEAD"],
  ]) {
    const lines = runGitLines(args, { allowFailure: true });
    for (const filePath of lines) changed.add(filePath);
    if (lines.length > 0) break;
  }
  return changed;
}

function runGitLines(args, options = {}) {
  try {
    return execFileSync("git", args, { cwd: process.cwd(), encoding: "utf8" })
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
  } catch (error) {
    if (options.allowFailure) return [];
    throw error;
  }
}

function readText(filePath) {
  return readFileSync(filePath, "utf8");
}

function normalize(value) {
  return String(value).replace(/\s+/g, " ").trim();
}

function assertIncludes(haystack, needle, label) {
  assert.ok(haystack.includes(needle), `${label} missing: ${needle}`);
}
