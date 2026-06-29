#!/usr/bin/env node
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

const docsPath = "docs/OPERATOR_PATH_PUBLIC_SAFE_ARTIFACT_INDEX_V0_1.md";
const fixturePath = "fixtures/operator-path-public-safe-artifact-index.sample.v0.1.json";
const smokePath = "scripts/smoke-operator-path-public-safe-artifact-index-v0-1.mjs";
const packagePath = "package.json";
const indexPath = "docs/00_INDEX_LATEST.md";

const sliceName = "operator_path_public_safe_artifact_index_v0_1";
const packageScriptName = "smoke:operator-path-public-safe-artifact-index-v0-1";
const packageScriptValue =
  "node scripts/smoke-operator-path-public-safe-artifact-index-v0-1.mjs";

const artifactClasses = [
  "assisted manual QA execution report artifact",
  "browser validation report artifact",
  "desktop screenshot artifact",
  "mobile screenshot artifact",
  "backend safety validation bundle summary artifact",
  "human review packet summary artifact",
  "backend remaining gap inventory summary artifact",
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
  "DB schema/migrations",
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
  "scripts/smoke-operator-path-backend-remaining-gap-inventory-v0-1.mjs",
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
assertBasis();
assertArtifactIndex();
assertPolicies();
assertHumanStatus();
assertAuthorityBoundary();
assertPublicSafe();
assertRecommendation();
assertChangedFileScope();

console.log(
  JSON.stringify(
    {
      smoke: "operator-path-public-safe-artifact-index-v0-1",
      final_status: "pass",
      slice_name: sliceName,
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
  assert.equal(fixture.version, "operator_path_public_safe_artifact_index.v0.1");
  assert.equal(fixture.packet_type, "public_safe_artifact_index");
  assert.deepEqual(fixture.basis_prs, [856, 857, 858]);
  assert.equal(packageJson.scripts?.[packageScriptName], packageScriptValue);
  for (const pointer of [docsPath, fixturePath, smokePath, packageScriptName, sliceName]) {
    assertIncludes(index, pointer, `latest index pointer ${pointer}`);
  }
}

function assertBasis() {
  for (const phrase of [
    "Current basis: PR #856",
    "PR #857",
    "PR #858",
    "PR #858 found no backend runtime gap",
    "Purpose: public-safe symbolic artifact index only",
  ]) {
    assertIncludes(docs, normalize(phrase), `basis phrase ${phrase}`);
  }
}

function assertArtifactIndex() {
  assert.ok(Array.isArray(fixture.artifact_classes), "artifact_classes must be an array");
  assert.ok(Array.isArray(fixture.artifact_index), "artifact_index must be an array");
  assert.equal(fixture.artifact_index.length, artifactClasses.length);
  for (const artifactClass of artifactClasses) {
    assertIncludes(rawDocs, artifactClass, `doc artifact class ${artifactClass}`);
    assert.ok(
      fixture.artifact_classes.includes(artifactClass),
      `fixture artifact class ${artifactClass}`,
    );
    assert.ok(
      fixture.artifact_index.some((entry) => entry.artifact_class === artifactClass),
      `fixture artifact entry ${artifactClass}`,
    );
  }
  for (const entry of fixture.artifact_index) {
    for (const field of [
      "artifact_id",
      "artifact_class",
      "produced_by",
      "symbolic_location",
      "expected_reader",
      "public_safe_summary",
      "raw_copy_allowed",
      "screenshot_embedded",
      "authority_risk",
    ]) {
      assert.ok(Object.hasOwn(entry, field), `artifact ${entry.artifact_id} has ${field}`);
    }
    assert.match(
      entry.symbolic_location,
      /^<[A-Z0-9_]+>$/,
      `symbolic location ${entry.symbolic_location}`,
    );
    assert.equal(entry.raw_copy_allowed, false, `${entry.artifact_id} raw_copy_allowed`);
    assert.equal(entry.screenshot_embedded, false, `${entry.artifact_id} screenshot_embedded`);
    assertNoUnsafeText(JSON.stringify(entry), `artifact ${entry.artifact_id}`);
  }
  for (const fieldName of [
    "artifact_id",
    "artifact_class",
    "produced_by",
    "symbolic_location",
    "expected_reader",
    "public_safe_summary",
    "raw_copy_allowed",
    "screenshot_embedded",
    "authority_risk",
  ]) {
    assertIncludes(rawDocs, fieldName, `doc table field ${fieldName}`);
  }
}

function assertPolicies() {
  assertIncludes(rawDocs, "This index does not copy raw artifacts into the repo.", "raw copy");
  assertIncludes(
    rawDocs,
    "Screenshot paths are symbolic only and screenshots are not embedded.",
    "screenshot policy",
  );
  assertIncludes(rawDocs, "Private local paths must not be included.", "private path policy");
  assertIncludes(rawDocs, "Artifact freshness caveat", "freshness caveat");
  assert.equal(fixture.raw_copy_policy.raw_copy_allowed, false);
  assert.equal(fixture.raw_copy_policy.raw_artifacts_copied_into_repo, false);
  assert.equal(fixture.raw_copy_policy.symbolic_locations_only, true);
  assert.equal(fixture.screenshot_policy.screenshot_embedded, false);
  assert.equal(fixture.screenshot_policy.screenshots_copied_into_repo, false);
  assert.equal(fixture.screenshot_policy.screenshot_paths_symbolic_only, true);
  assert.equal(fixture.private_path_policy.private_local_paths_included, false);
  assert.equal(fixture.private_path_policy.symbolic_placeholders_only, true);
  assert.ok(fixture.freshness_caveat.includes("freshness matters"));
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
  for (const field of [
    "validation_pass_is_truth",
    "validation_pass_is_proof",
    "validation_pass_is_approval",
    "validation_pass_is_product_readiness",
  ]) {
    assert.equal(fixture.authority_boundary[field], false, field);
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
    assertIncludes(docs, normalize(phrase), `authority phrase ${phrase}`);
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
    assertIncludes(docs, normalize(phrase), `public-safe phrase ${phrase}`);
  }
  assert.doesNotMatch(rawDocs, /!\[[^\]]*]\([^)]*\)/, "doc must not embed images");
  assertNoUnsafeText(rawDocs, "doc");
  assertNoUnsafeText(fixtureText, "fixture");
}

function assertRecommendation() {
  assert.match(
    fixture.final_recommendation,
    /^operator_path_(known_warning_registry|docs_fixture_consistency_audit)_v0_1$/,
    "final recommendation is a non-authority cleanup slice",
  );
  assert.doesNotMatch(
    fixture.final_recommendation,
    /promotion execution|promotion|product-write|release/i,
    "final recommendation must not be promotion/product/release",
  );
  assertIncludes(
    rawDocs,
    "Proceed to `operator_path_known_warning_registry_v0_1` or",
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
    /\/tmp\/[^\s)"']+/i,
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
