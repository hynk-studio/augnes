#!/usr/bin/env node
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

const docsPath = "docs/DETERMINISTIC_CRPF_VARIANT_REVIEW_V0_1.md";
const typePath = "types/deterministic-crpf-variant-review.ts";
const fixturePath = "fixtures/deterministic-crpf-variant-review.sample.v0.1.json";
const smokePath = "scripts/smoke-deterministic-crpf-variant-review-v0-1.mjs";
const packagePath = "package.json";
const indexPath = "docs/00_INDEX_LATEST.md";
const roadmapPath = "docs/AUGNES_INTEGRATED_DEVELOPMENT_ROADMAP_V0_2_1_FULL.md";
const productWriteTargetDocsPath = "docs/PRODUCT_WRITE_TARGET_CONTRACT_V0_1.md";
const authorityBoundaryDocsPath = "docs/AUTHORITY_BOUNDARY_REGRESSION_CI_V0_1.md";
const privacyGuardDocsPath = "docs/PRIVACY_REDACTION_RUNTIME_GUARD_V0_1.md";
const localDataPolicyDocsPath = "docs/LOCAL_DATA_EXPORT_IMPORT_POLICY_V0_1.md";
const codexResultDocsPath = "docs/CODEX_RESULT_REPORT_INGESTION_V0_1.md";
const temporalHandoffDocsPath =
  "docs/TEMPORAL_HANDOFF_USEFULNESS_EXPERIMENT_PLAN_V0_1.md";
const gitLedgerBuilderDocsPath =
  "docs/GIT_LEDGER_EXPORT_DETERMINISTIC_BUILDER_V0_1.md";

const fixtureVersion = "deterministic_crpf_variant_review.sample.v0.1";
const contractVersion = "deterministic_crpf_variant_review.v0.1";
const variantVersion = "deterministic_crpf_variant.v0.1";
const comparisonVersion = "deterministic_crpf_variant_comparison.v0.1";
const scope = "project:augnes";
const packageScriptName = "smoke:deterministic-crpf-variant-review-v0-1";
const packageScriptValue =
  "node scripts/smoke-deterministic-crpf-variant-review-v0-1.mjs";

const expectedSliceFiles = [
  docsPath,
  typePath,
  fixturePath,
  smokePath,
  packagePath,
  indexPath,
];

const statuses = [
  "contract_only",
  "fixture_only",
  "deterministic_review_aid_only",
  "ready_for_future_operator_review",
  "blocked_private_or_raw_payload",
  "blocked_forbidden_authority",
  "rejected",
];

const variantLabels = [
  "evidence_strict",
  "tension_preserving",
  "source_coverage_strict",
  "handoff_minimal",
  "operator_review_heavy",
];

const reviewCues = [
  "inspect_evidence_coverage",
  "preserve_unresolved_tension",
  "inspect_source_ref_coverage",
  "reduce_handoff_size",
  "request_operator_review",
  "preserve_not_done_item",
  "inspect_overclaim_risk",
  "compare_expected_observed_delta",
  "no_action",
];

const selectionCriteria = [
  "fixed_seed_ref",
  "public_safe_candidate_refs",
  "evidence_coverage",
  "source_ref_coverage",
  "unresolved_tension_preservation",
  "knowledge_gap_preservation",
  "expected_observed_delta_preservation",
  "handoff_size_bound",
  "operator_review_load",
  "overclaim_risk",
];

const reasonCodes = [
  "deterministic_crpf_review_only",
  "fixed_seed_required",
  "runtime_randomness_forbidden",
  "variant_is_review_aid",
  "variant_is_not_truth",
  "variant_is_not_proof",
  "variant_is_not_accepted_evidence",
  "variant_is_not_promotion",
  "variant_is_not_durable_state",
  "evidence_strict_variant_defined",
  "tension_preserving_variant_defined",
  "source_coverage_strict_variant_defined",
  "handoff_minimal_variant_defined",
  "operator_review_heavy_variant_defined",
  "source_refs_required",
  "unresolved_tension_preserved",
  "knowledge_gap_preserved",
  "expected_observed_delta_preserved",
  "operator_review_required",
  "privacy_guard_required",
  "product_write_denied",
  "provider_call_not_executed",
  "prompt_not_sent",
  "source_fetch_not_executed",
  "retrieval_not_executed",
  "rag_answer_not_generated",
  "db_write_not_executed",
  "proof_not_created",
  "evidence_not_created",
  "promotion_not_executed",
  "durable_state_not_mutated",
  "formation_receipt_not_written",
  "codex_not_executed",
  "git_github_not_executed",
  "smoke_pass_not_truth",
  "ci_pass_not_truth",
  "raw_private_payload_blocked",
  "private_url_blocked",
  "local_private_path_blocked",
  "secret_like_pattern_blocked",
  "provider_thread_run_session_id_blocked",
];

const authorityAllowedTrueFields = [
  "deterministic_crpf_variant_review_now",
  "contract_only",
  "fixture_only",
  "fixed_seed_only",
  "deterministic_review_aid_only",
  "caller_provided_fixture_only",
];

const authorityFalseFields = [
  "runtime_randomness_now",
  "provider_openai_call_now",
  "prompt_sent_now",
  "source_fetch_now",
  "retrieval_execution_now",
  "rag_answer_generation_now",
  "db_query_or_write_now",
  "route_now",
  "ui_now",
  "proof_or_evidence_record_now",
  "claim_or_evidence_write_now",
  "promotion_execution_now",
  "durable_state_write_now",
  "durable_state_apply_now",
  "formation_receipt_write_now",
  "git_ledger_export_runtime_now",
  "git_write_now",
  "github_api_call_now",
  "repository_file_write_now",
  "local_file_export_now",
  "local_file_import_now",
  "codex_execution_now",
  "codex_execution_authority",
  "github_automation_authority",
  "product_write_now",
  "product_write_runtime_now",
  "product_write_adapter_enabled_now",
  "product_id_allocation_now",
  "product_persistence_now",
  "product_write_authority",
  "variant_is_truth",
  "variant_is_proof",
  "variant_is_accepted_evidence",
  "variant_is_promotion_readiness",
  "variant_is_durable_state",
  "variant_is_product_write",
  "smoke_pass_is_truth",
  "ci_pass_is_truth",
];

const requiredDocsSections = [
  "## Purpose",
  "## Relationship to docs/AUGNES_INTEGRATED_DEVELOPMENT_ROADMAP_V0_2_1_FULL.md",
  "## Relationship to Research/ROI P1/P2 Backlog",
  "## Relationship to Candidate Lifecycle, Calibration, Logical Claim Shape, Temporal Handoff, and Codex Result Report Ingestion",
  "## Relationship to Privacy Redaction Runtime Guard",
  "## Relationship to Authority Boundary Regression CI",
  "## Relationship to Product Write Target Contract",
  "## Variant Set",
  "## Fixed Seed Policy",
  "## Selection Criteria",
  "## Review Cue Policy",
  "## Non-Authority Policy",
  "## Privacy/Redaction Policy",
  "## Authority Boundary",
  "## Fixture Policy",
  "## Verification Expectations",
  "## Deferred Work",
];

const docsExactPhrases = [
  "This slice is contract-only and fixture-only.",
  "This slice uses fixed seed refs only.",
  "This slice does not execute runtime randomness.",
  "This slice does not call providers.",
  "This slice does not send prompts.",
  "This slice does not fetch sources.",
  "This slice does not execute retrieval/RAG.",
  "This slice does not query/write DB.",
  "This slice does not add routes or UI.",
  "This slice does not create proof/evidence.",
  "This slice does not write claim/evidence records.",
  "This slice does not promote Perspective.",
  "This slice does not write/apply durable Perspective state.",
  "This slice does not write Formation Receipts.",
  "This slice does not execute Git Ledger export runtime.",
  "This slice does not execute Git or call GitHub.",
  "This slice does not execute Codex.",
  "This slice does not export/import files.",
  "This slice does not product-write.",
  "This slice does not allocate product IDs.",
  "Product-write remains parked by #686.",
  "A variant is a review aid only.",
  "A variant is not truth.",
  "A variant is not proof.",
  "A variant is not accepted evidence.",
  "A variant is not promotion readiness.",
  "A variant is not durable Perspective state.",
  "A variant is not product-write.",
  "Smoke/CI pass is not truth.",
  "The roadmap guide is not SSOT.",
];

const requiredTypeExports = [
  "DeterministicCrpfVariantReviewContractVersion",
  "DeterministicCrpfVariantVersion",
  "DeterministicCrpfVariantComparisonVersion",
  "DeterministicCrpfVariantReviewScope",
  "DeterministicCrpfVariantReviewStatuses",
  "DeterministicCrpfVariantPolicies",
  "DeterministicCrpfReviewCues",
  "DeterministicCrpfSelectionCriteria",
  "DeterministicCrpfReasonCodes",
  "DeterministicCrpfAuthorityBoundary",
  "DeterministicCrpfVariantContract",
  "DeterministicCrpfVariantComparisonBundle",
  "DeterministicCrpfValidationFinding",
];

const safeFixtureMarkers = [
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
];

const liveLookingPrivatePatterns = [
  /\bhttps?:\/\//,
  /\bfile:\/\//,
  /\/Users\//,
  /\/home\//,
  /\bsk-[A-Za-z0-9_-]{8,}\b/,
  /\bghp_[A-Za-z0-9_]{8,}\b/,
  /-----BEGIN [A-Z ]*PRIVATE KEY-----/,
  /\b(thread|run|session|resp|file)_[A-Za-z0-9]{16,}\b/,
  /\bgithub_pat_[A-Za-z0-9_]{8,}\b/,
];

for (const requiredPath of [
  docsPath,
  typePath,
  fixturePath,
  smokePath,
  packagePath,
  indexPath,
  roadmapPath,
  productWriteTargetDocsPath,
  authorityBoundaryDocsPath,
  privacyGuardDocsPath,
  localDataPolicyDocsPath,
  codexResultDocsPath,
  temporalHandoffDocsPath,
  gitLedgerBuilderDocsPath,
]) {
  assert.ok(existsSync(requiredPath), `required path missing: ${requiredPath}`);
}

const docs = readFile(docsPath);
const docsNormalized = normalizeWhitespace(docs);
const types = readFile(typePath);
const fixtureText = readFile(fixturePath);
const smokeSource = readFile(smokePath);
const packageJson = JSON.parse(readFile(packagePath));
const index = readFile(indexPath);
const roadmap = readFile(roadmapPath);
const fixture = JSON.parse(fixtureText);

assert.ok(
  roadmap.includes("deterministic_crpf_variant_review_v0_1"),
  "roadmap must contain deterministic_crpf_variant_review_v0_1",
);
assert.equal(packageJson.scripts?.[packageScriptName], packageScriptValue);
assert.ok(index.includes("Deterministic CRPF Variant Review v0.1"));
assert.ok(index.includes("docs/DETERMINISTIC_CRPF_VARIANT_REVIEW_V0_1.md"));
assert.ok(index.includes("types/deterministic-crpf-variant-review.ts"));
assert.ok(
  index.includes("fixtures/deterministic-crpf-variant-review.sample.v0.1.json"),
);
assert.ok(index.includes("scripts/smoke-deterministic-crpf-variant-review-v0-1.mjs"));
assert.ok(index.includes("deterministic_crpf_variant_review_v0_1"));
assert.ok(index.includes("Product-write remains parked by #686."));

for (const section of requiredDocsSections) {
  assert.ok(docs.includes(section), `docs must include section: ${section}`);
}
for (const phrase of docsExactPhrases) {
  assert.ok(
    docsNormalized.includes(normalizeWhitespace(phrase)),
    `docs must include phrase: ${phrase}`,
  );
}

for (const exportedName of requiredTypeExports) {
  assert.ok(types.includes(exportedName), `types must include ${exportedName}`);
}
for (const value of [
  contractVersion,
  variantVersion,
  comparisonVersion,
  scope,
  ...statuses,
  ...variantLabels,
  ...reviewCues,
  ...selectionCriteria,
  ...reasonCodes,
  ...authorityAllowedTrueFields,
  ...authorityFalseFields,
]) {
  assert.ok(types.includes(value), `types must include ${value}`);
}

assert.equal(fixture.fixture_version, fixtureVersion);
assert.equal(fixture.contract_version, contractVersion);
assert.equal(fixture.variant_version, variantVersion);
assert.equal(fixture.comparison_version, comparisonVersion);
assert.equal(fixture.scope, scope);
assert.equal(fixture.fixed_seed_ref, "fixed-seed-ref:deterministic-crpf-sample-v0-1");
assert.ok(fixture.comparison_bundle_example, "fixture must include comparison bundle");
assert.ok(fixture.selection_criteria, "fixture must include selection criteria");
assert.ok(fixture.expected_output_shape, "fixture must include expected output shape");
assert.ok(
  fixture.blocked_private_or_raw_payload_example,
  "fixture must include blocked private/raw example",
);
assert.ok(
  fixture.blocked_forbidden_authority_example,
  "fixture must include blocked forbidden authority example",
);
assert.ok(
  fixture.deterministic_repeatability_example,
  "fixture must include deterministic repeatability example",
);

assertAuthorityBoundary(fixture.authority_boundary_sample, "$.authority_boundary_sample");
assertAuthorityBoundary(
  fixture.comparison_bundle_example.authority_boundary,
  "$.comparison_bundle_example.authority_boundary",
);
assert.deepEqual(
  fixture.variants.map((variant) => variant.variant_label).sort(),
  [...variantLabels].sort(),
  "fixture must contain all five variants exactly once",
);
for (const variant of fixture.variants) {
  assert.equal(variant.variant_version, variantVersion);
  assert.equal(variant.contract_version, contractVersion);
  assert.equal(variant.scope, scope);
  for (const requiredField of [
    "fixed_seed_ref",
    "selection_policy",
    "candidate_inclusion_policy",
    "evidence_requirement_policy",
    "unresolved_tension_policy",
    "source_coverage_policy",
    "handoff_policy",
    "operator_review_policy",
    "expected_benefits",
    "risk_notes",
    "review_cues",
    "non_authority_notes",
    "reason_codes",
    "authority_boundary",
  ]) {
    assert.ok(variant[requiredField] !== undefined, `${variant.variant_label} missing ${requiredField}`);
  }
  assert.equal(variant.fixed_seed_ref, fixture.fixed_seed_ref);
  assert.ok(variant.selection_policy.includes("fixed_seed_ref_required"));
  assert.ok(variant.selection_policy.includes("fixture_backed_variant_only"));
  assert.ok(variant.review_cues.length > 0);
  assert.ok(variant.non_authority_notes.join(" ").includes("review aid only"));
  assertAuthorityBoundary(
    variant.authority_boundary,
    `$.variants.${variant.variant_label}.authority_boundary`,
  );
}

const repeatability = fixture.deterministic_repeatability_example;
assert.deepEqual(
  repeatability.first_variant_order,
  repeatability.second_variant_order,
  "same fixed seed/input must preserve variant order",
);
assert.equal(
  repeatability.first_fingerprint,
  repeatability.second_fingerprint,
  "same fixed seed/input must preserve fingerprint",
);
assert.equal(repeatability.fixed_seed_ref, fixture.fixed_seed_ref);

assert.equal(
  fixture.blocked_private_or_raw_payload_example.status,
  "blocked_private_or_raw_payload",
);
assert.equal(
  fixture.blocked_forbidden_authority_example.status,
  "blocked_forbidden_authority",
);
assert.equal(
  fixture.blocked_forbidden_authority_example.authority_boundary.runtime_randomness_now,
  true,
  "blocked forbidden authority example should show forbidden randomness claim",
);
assertSafeMarkerPlacement();
assertNoLiveLookingPrivateExamples();
assertNarrowSliceFileScope();
assertNoRuntimeCapabilityFiles();

assert.equal(
  packageJson.scripts?.["smoke:authority-boundary-regression-v0-1"],
  "node scripts/smoke-authority-boundary-regression-v0-1.mjs",
  "authority boundary regression smoke package script must not be weakened",
);
assert.equal(
  packageJson.scripts?.["smoke:product-write-target-contract-v0-1"],
  "node scripts/smoke-product-write-target-contract-v0-1.mjs",
);

console.log(
  JSON.stringify(
    {
      ok: true,
      smoke: "deterministic-crpf-variant-review-v0-1",
      contract_version: contractVersion,
      variant_version: variantVersion,
      comparison_version: comparisonVersion,
      variants: variantLabels.length,
      fixed_seed_ref: fixture.fixed_seed_ref,
    },
    null,
    2,
  ),
);

function assertAuthorityBoundary(boundary, label) {
  assert.ok(boundary && typeof boundary === "object", `${label} must be an object`);
  for (const field of authorityAllowedTrueFields) {
    assert.equal(boundary[field], true, `${label}.${field} must be true`);
  }
  for (const field of authorityFalseFields) {
    assert.equal(boundary[field], false, `${label}.${field} must be false`);
  }
}

function assertSafeMarkerPlacement() {
  const markerPaths = [];
  visit(fixture, "$", (value, pathLabel) => {
    if (typeof value !== "string") {
      return;
    }
    for (const marker of safeFixtureMarkers) {
      if (value.includes(marker)) {
        markerPaths.push([marker, pathLabel]);
      }
    }
  });
  assert.ok(markerPaths.length > 0, "fixture must include blocked safe markers");
  for (const [marker, pathLabel] of markerPaths) {
    assert.ok(safeFixtureMarkers.includes(marker), `unknown safe marker ${marker}`);
    assert.ok(
      pathLabel.startsWith(
        "$.blocked_private_or_raw_payload_example.blocked_fixture_markers",
      ),
      `safe marker ${marker} must appear only inside blocked fixture markers`,
    );
  }
}

function assertNoLiveLookingPrivateExamples() {
  const sources = [
    [docsPath, docs],
    [typePath, types],
    [fixturePath, fixtureText],
    [smokePath, smokeSource],
  ];
  for (const [filePath, source] of sources) {
    for (const pattern of liveLookingPrivatePatterns) {
      assert.ok(
        !pattern.test(source),
        `${filePath} must not include live-looking private/provider/secret examples: ${pattern}`,
      );
    }
  }
}

function assertNarrowSliceFileScope() {
  for (const expectedPath of expectedSliceFiles) {
    assert.ok(existsSync(expectedPath), `expected slice file missing: ${expectedPath}`);
  }
  const unexpected = [];
  for (const filePath of walk(".")) {
    const normalized = filePath.replaceAll(path.sep, "/");
    if (
      /deterministic[-_]crpf[-_]variant[-_]review/i.test(normalized) &&
      !expectedSliceFiles.includes(normalized)
    ) {
      unexpected.push(normalized);
    }
  }
  assert.deepEqual(
    unexpected,
    [],
    "slice must not add extra deterministic-crpf-variant-review files",
  );
}

function assertNoRuntimeCapabilityFiles() {
  const forbiddenRuntimeHits = [];
  for (const filePath of walk(".")) {
    const normalized = filePath.replaceAll(path.sep, "/");
    const isThisSlice = /deterministic[-_]crpf[-_]variant[-_]review/i.test(normalized);
    if (!isThisSlice) {
      continue;
    }
    if (
      /(^|\/)app\/api\//.test(normalized) ||
      /(^|\/)components\//.test(normalized) ||
      /(^|\/)(?:db|migrations)\//.test(normalized) ||
      /(^|\/)lib\//.test(normalized) ||
      /(provider|retrieval|codex-execution|product-write|product-id|github-api|git-runtime|random-runtime)/i.test(
        normalized,
      )
    ) {
      forbiddenRuntimeHits.push(normalized);
    }
  }
  assert.deepEqual(
    forbiddenRuntimeHits,
    [],
    "slice must not add route/UI/DB/provider/retrieval/GitHub/Git/Codex/product-write runtime files",
  );
}

function visit(value, pathLabel, callback) {
  callback(value, pathLabel);
  if (Array.isArray(value)) {
    value.forEach((entry, index) => visit(entry, `${pathLabel}[${index}]`, callback));
    return;
  }
  if (value && typeof value === "object") {
    for (const [key, entry] of Object.entries(value)) {
      visit(entry, `${pathLabel}.${key}`, callback);
    }
  }
}

function walk(root) {
  const paths = [];
  for (const entry of readdirSync(root)) {
    if (
      entry === ".git" ||
      entry === "node_modules" ||
      entry === ".next" ||
      entry === "dist" ||
      entry === "build" ||
      entry === "coverage"
    ) {
      continue;
    }
    const fullPath = path.join(root, entry);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      paths.push(...walk(fullPath));
    } else {
      paths.push(fullPath.replace(/^\.\//, ""));
    }
  }
  return paths;
}

function readFile(filePath) {
  return readFileSync(filePath, "utf8");
}

function normalizeWhitespace(value) {
  return value.replace(/\s+/g, " ").trim();
}
