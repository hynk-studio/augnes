#!/usr/bin/env node
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

const docsPath = "docs/PRODUCT_WRITE_TARGET_CONTRACT_V0_1.md";
const typePath = "types/product-write-target-contract.ts";
const fixturePath = "fixtures/product-write-target-contract.sample.v0.1.json";
const smokePath = "scripts/smoke-product-write-target-contract-v0-1.mjs";
const packagePath = "package.json";
const indexPath = "docs/00_INDEX_LATEST.md";
const roadmapPath = "docs/AUGNES_INTEGRATED_DEVELOPMENT_ROADMAP_V0_2_1_FULL.md";
const reentryDocsPath = "docs/PRODUCT_WRITE_REENTRY_REVIEW_V0_1.md";
const disabledHarnessDocsPath =
  "docs/DISABLED_PRODUCT_WRITE_ADAPTER_REENTRY_HARNESS_V0_1.md";
const githubActuationDocsPath = "docs/GITHUB_ACTUATION_CONTRACT_V0_1.md";
const localGitLedgerExportDocsPath = "docs/LOCAL_GIT_LEDGER_EXPORT_V0_1.md";
const gitLedgerBuilderDocsPath =
  "docs/GIT_LEDGER_EXPORT_DETERMINISTIC_BUILDER_V0_1.md";
const privacyGuardDocsPath = "docs/PRIVACY_REDACTION_RUNTIME_GUARD_V0_1.md";
const localDataPolicyDocsPath = "docs/LOCAL_DATA_EXPORT_IMPORT_POLICY_V0_1.md";
const authorityBoundaryDocsPath = "docs/AUTHORITY_BOUNDARY_REGRESSION_CI_V0_1.md";
const reentrySmokePath = "scripts/smoke-product-write-reentry-review-v0-1.mjs";
const disabledHarnessSmokePath =
  "scripts/smoke-disabled-product-write-adapter-reentry-harness-v0-1.mjs";

const fixtureVersion = "product_write_target_contract.sample.v0.1";
const contractVersion = "product_write_target_contract.v0.1";
const targetGroupVersion = "product_write_target_group.v0.1";
const approvalBindingVersion = "product_write_target_approval_binding.v0.1";
const transactionBoundaryVersion =
  "product_write_target_transaction_boundary.v0.1";
const scope = "project:augnes";
const packageScriptName = "smoke:product-write-target-contract-v0-1";
const packageScriptValue =
  "node scripts/smoke-product-write-target-contract-v0-1.mjs";

const expectedSliceFiles = [
  docsPath,
  typePath,
  fixturePath,
  smokePath,
  packagePath,
  indexPath,
];

const statusVocabulary = [
  "contract_only",
  "ready_for_future_reentry_review",
  "blocked_missing_prerequisite",
  "blocked_forbidden_target",
  "blocked_forbidden_authority",
  "blocked_product_write_execution",
  "blocked_private_or_raw_payload",
  "rejected",
];

const targetGroups = [
  "accepted_evidence_records",
  "proof_records",
  "work_items",
  "perspective_state_records",
  "formation_receipts",
  "product_activity_log",
];

const futureWriteIntents = [
  "future_write_accepted_evidence_after_promotion_and_receipt",
  "future_write_proof_record_after_formal_review",
  "future_write_work_item_after_operator_approval",
  "future_write_perspective_state_after_receipt_backed_apply",
  "future_write_formation_receipt_after_promotion_decision",
  "future_write_product_activity_log_after_explicit_write",
  "preview_only",
];

const forbiddenWriteIntents = [
  "write_candidate_as_proof_now",
  "write_candidate_as_evidence_now",
  "write_provider_output_as_truth_now",
  "write_retrieval_result_as_evidence_now",
  "write_codex_result_as_state_now",
  "write_feedback_as_truth_now",
  "allocate_product_id_now",
  "execute_product_write_now",
  "bypass_promotion_decision",
  "bypass_formation_receipt",
  "bypass_operator_approval",
  "bypass_preview_to_write_diff",
  "write_without_source_refs",
  "write_without_audit_trail",
  "mutate_durable_state_from_product_write",
  "create_work_item_from_provider_output",
  "create_proof_from_rag_answer",
];

const prerequisiteKinds = [
  "promotion_decision_ref",
  "formation_receipt_ref",
  "review_record_ref",
  "source_refs",
  "accepted_evidence_refs",
  "durable_state_ref",
  "operator_approval_ref",
  "product_write_reentry_review_ref",
  "product_write_target_contract_ref",
];

const reasonCodes = [
  "roadmap_file_present",
  "product_write_reentry_review_ref_present",
  "disabled_adapter_harness_ref_present",
  "github_actuation_contract_ref_present",
  "git_ledger_export_ref_present",
  "privacy_guard_required",
  "local_data_export_policy_required",
  "authority_boundary_regression_required",
  "product_write_target_contract_only",
  "product_write_remains_parked",
  "product_write_denied",
  "product_write_execution_not_implemented",
  "product_write_adapter_not_enabled",
  "product_id_allocation_not_executed",
  "product_persistence_not_executed",
  "promotion_decision_required",
  "formation_receipt_required",
  "review_record_required",
  "operator_approval_required",
  "source_refs_required",
  "accepted_evidence_refs_required",
  "preview_to_write_diff_required",
  "idempotency_key_required",
  "transaction_boundary_required",
  "rollback_policy_required",
  "audit_trail_required",
  "target_group_defined",
  "owner_surface_defined",
  "schema_ref_defined",
  "candidate_not_proof",
  "candidate_not_accepted_evidence",
  "provider_output_not_truth",
  "retrieval_result_not_evidence",
  "codex_result_not_state",
  "feedback_not_truth",
  "product_activity_log_not_product_write_authority",
  "raw_private_payload_blocked",
  "private_url_blocked",
  "local_private_path_blocked",
  "secret_like_pattern_blocked",
  "provider_thread_run_session_id_blocked",
  "db_write_not_executed",
  "sql_transaction_not_executed",
  "proof_not_created",
  "evidence_not_created",
  "work_item_not_created",
  "promotion_not_executed",
  "durable_state_not_mutated",
  "formation_receipt_not_written",
  "provider_call_not_executed",
  "prompt_not_sent",
  "retrieval_not_executed",
  "rag_answer_not_generated",
  "git_write_not_executed",
  "github_api_not_called",
  "repository_file_not_written",
  "codex_not_executed",
  "smoke_pass_not_truth",
  "ci_pass_not_truth",
];

const authorityAllowedTrueFields = [
  "product_write_target_contract_now",
  "contract_only",
  "future_reentry_review_required",
  "operator_approval_required_for_future_write",
  "promotion_decision_required",
  "formation_receipt_required",
  "source_refs_required",
  "preview_to_write_diff_required",
  "audit_trail_required",
  "rollback_policy_required",
];

const authorityFalseFields = [
  "product_write_now",
  "product_write_runtime_now",
  "product_write_adapter_enabled_now",
  "product_write_target_contract_runtime_now",
  "product_id_allocation_now",
  "product_persistence_now",
  "product_route_now",
  "product_ui_now",
  "sql_transaction_now",
  "db_query_or_write_now",
  "proof_or_evidence_record_now",
  "claim_or_evidence_write_now",
  "work_item_write_now",
  "promotion_execution_now",
  "durable_state_write_now",
  "durable_state_apply_now",
  "formation_receipt_write_now",
  "provider_openai_call_now",
  "prompt_sent_now",
  "source_fetch_now",
  "retrieval_execution_now",
  "rag_answer_generation_now",
  "git_ledger_export_runtime_now",
  "git_write_now",
  "github_api_call_now",
  "repository_file_write_now",
  "local_file_export_now",
  "local_file_import_now",
  "codex_execution_now",
  "codex_execution_authority",
  "github_automation_authority",
  "product_write_authority",
  "candidate_is_proof",
  "candidate_is_accepted_evidence",
  "provider_output_is_truth",
  "retrieval_result_is_evidence",
  "codex_result_is_state",
  "feedback_is_truth",
  "product_id_is_allocated",
  "preview_is_write_approval",
  "smoke_pass_is_truth",
  "ci_pass_is_truth",
];

const requiredDocsSections = [
  "## Purpose",
  "## Relationship to docs/AUGNES_INTEGRATED_DEVELOPMENT_ROADMAP_V0_2_1_FULL.md",
  "## Relationship to Product Write Reentry Review v0.1",
  "## Relationship to Disabled Product Write Adapter Reentry Harness v0.1",
  "## Relationship to Promotion Decision Store",
  "## Relationship to Formation Receipt Durable Write",
  "## Relationship to Durable Perspective State Apply",
  "## Relationship to Git Ledger / Local Export / GitHub Actuation Contract",
  "## Relationship to Privacy Redaction Runtime Guard",
  "## Relationship to Local Data Export/Import Policy",
  "## Relationship to Authority Boundary Regression CI",
  "## Contract Scope",
  "## Target Group Matrix",
  "## Required Prerequisite Policy",
  "## Idempotency Key Policy",
  "## Transaction Boundary Policy",
  "## Rollback Policy",
  "## Audit Trail Policy",
  "## Source Refs Policy",
  "## Operator Approval Binding",
  "## Preview-to-Write Diff Policy",
  "## Forbidden Direct Write Policy",
  "## Product ID Allocation Policy",
  "## Authority Boundary",
  "## Fixture Policy",
  "## Verification Expectations",
  "## Deferred Work",
];

const docsExactPhrases = [
  "This slice is contract-only.",
  "This slice does not execute product-write.",
  "This slice does not enable a product-write adapter.",
  "This slice does not allocate product IDs.",
  "This slice does not persist products.",
  "This slice does not open product routes or product UI.",
  "This slice does not execute SQL transactions.",
  "This slice does not query/write DB.",
  "This slice does not write proof/evidence records.",
  "This slice does not write claim/evidence records.",
  "This slice does not create work items.",
  "This slice does not promote Perspective.",
  "This slice does not write/apply durable Perspective state.",
  "This slice does not write Formation Receipts.",
  "This slice does not call providers.",
  "This slice does not send prompts.",
  "This slice does not fetch sources.",
  "This slice does not execute retrieval/RAG.",
  "This slice does not execute Git Ledger export runtime.",
  "This slice does not execute Git.",
  "This slice does not call GitHub.",
  "This slice does not write repository files.",
  "This slice does not export/import files.",
  "This slice does not execute Codex.",
  "Product-write remains parked by #686.",
  "Candidate cannot be written as proof/evidence directly.",
  "Provider output cannot be written as accepted evidence directly.",
  "Retrieval result cannot be written as accepted evidence directly.",
  "Codex result cannot be written as proof/evidence/state.",
  "Feedback cannot be written as truth.",
  "Product write is impossible without promotion decision and Formation Receipt.",
  "Product write is impossible without explicit operator approval.",
  "Product ID allocation remains disabled in this contract.",
  "Preview-to-write diff is not write approval.",
  "Smoke/CI pass is not truth.",
  "The roadmap guide is not SSOT.",
];

const requiredTypeExports = [
  "ProductWriteTargetContractVersion",
  "ProductWriteTargetGroupVersion",
  "ProductWriteTargetApprovalBindingVersion",
  "ProductWriteTargetTransactionBoundaryVersion",
  "ProductWriteTargetScope",
  "ProductWriteTargetStatuses",
  "ProductWriteTargetGroups",
  "ProductWriteTargetFutureWriteIntents",
  "ProductWriteTargetForbiddenWriteIntents",
  "ProductWriteTargetPrerequisiteKinds",
  "ProductWriteTargetIdempotencyPolicies",
  "ProductWriteTargetTransactionBoundaryPolicies",
  "ProductWriteTargetRollbackPolicies",
  "ProductWriteTargetAuditTrailPolicies",
  "ProductWriteTargetReasonCodes",
  "ProductWriteTargetAuthorityBoundary",
  "ProductWriteTargetGroupContract",
  "ProductWriteTargetApprovalBinding",
  "ProductWriteTargetTransactionBoundary",
  "ProductWriteTargetValidationFinding",
  "ProductWriteTargetContractBundle",
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
  reentryDocsPath,
  disabledHarnessDocsPath,
  githubActuationDocsPath,
  localGitLedgerExportDocsPath,
  gitLedgerBuilderDocsPath,
  privacyGuardDocsPath,
  localDataPolicyDocsPath,
  authorityBoundaryDocsPath,
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
  roadmap.includes("product_write_target_contract_v0_1"),
  "roadmap must contain product_write_target_contract_v0_1",
);
assert.equal(packageJson.scripts?.[packageScriptName], packageScriptValue);
assert.ok(index.includes("Product Write Target Contract v0.1"));
assert.ok(index.includes("docs/PRODUCT_WRITE_TARGET_CONTRACT_V0_1.md"));
assert.ok(index.includes("types/product-write-target-contract.ts"));
assert.ok(index.includes("fixtures/product-write-target-contract.sample.v0.1.json"));
assert.ok(index.includes("scripts/smoke-product-write-target-contract-v0-1.mjs"));
assert.ok(index.includes("product_write_target_contract_v0_1"));
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
  targetGroupVersion,
  approvalBindingVersion,
  transactionBoundaryVersion,
  scope,
  ...statusVocabulary,
  ...targetGroups,
  ...futureWriteIntents,
  ...forbiddenWriteIntents,
  ...prerequisiteKinds,
  ...reasonCodes,
  ...authorityAllowedTrueFields,
  ...authorityFalseFields,
]) {
  assert.ok(types.includes(value), `types must include ${value}`);
}

assert.equal(fixture.fixture_version, fixtureVersion);
assert.equal(fixture.contract_version, contractVersion);
assert.equal(fixture.target_group_version, targetGroupVersion);
assert.equal(fixture.approval_binding_version, approvalBindingVersion);
assert.equal(fixture.transaction_boundary_version, transactionBoundaryVersion);
assert.equal(fixture.scope, scope);

for (const key of [
  "target_contract_bundle_example",
  "target_groups",
  "approval_binding_example",
  "transaction_boundary_example",
  "blocked_missing_prerequisite_example",
  "blocked_forbidden_target_example",
  "blocked_forbidden_authority_example",
  "blocked_product_write_execution_example",
  "blocked_private_or_raw_payload_example",
  "authority_boundary_sample",
]) {
  assert.ok(fixture[key], `fixture must include ${key}`);
}

assertAuthorityBoundary(fixture.authority_boundary_sample, "$.authority_boundary_sample");
assertAuthorityBoundary(
  fixture.target_contract_bundle_example.authority_boundary,
  "$.target_contract_bundle_example.authority_boundary",
);
assertAuthorityBoundary(
  fixture.approval_binding_example.authority_boundary,
  "$.approval_binding_example.authority_boundary",
);
assertAuthorityBoundary(
  fixture.transaction_boundary_example.authority_boundary,
  "$.transaction_boundary_example.authority_boundary",
);

assert.deepEqual(
  fixture.target_groups.map((entry) => entry.target_group).sort(),
  [...targetGroups].sort(),
  "fixture must contain all target groups exactly once",
);

for (const targetGroup of fixture.target_groups) {
  assert.equal(targetGroup.target_group_version, targetGroupVersion);
  assert.equal(targetGroup.contract_version, contractVersion);
  assert.equal(targetGroup.scope, scope);
  for (const requiredField of [
    "owner_surface",
    "schema_ref",
    "allowed_future_write_intents",
    "forbidden_write_intents",
    "required_prerequisites",
    "idempotency_key_policy",
    "transaction_boundary_policy",
    "rollback_policy",
    "audit_trail_policy",
    "source_refs_policy",
    "operator_approval_policy",
    "preview_to_write_diff_policy",
    "authority_boundary",
  ]) {
    assert.ok(
      targetGroup[requiredField] !== undefined,
      `${targetGroup.target_group} must include ${requiredField}`,
    );
  }
  assert.ok(targetGroup.owner_surface.startsWith("owner-surface:"));
  assert.ok(targetGroup.schema_ref.startsWith("schema-ref:"));
  assert.ok(targetGroup.allowed_future_write_intents.includes("preview_only"));
  assert.ok(targetGroup.forbidden_write_intents.length > 0);
  assert.ok(targetGroup.required_prerequisites.includes("source_refs"));
  assert.ok(targetGroup.required_prerequisites.includes("operator_approval_ref"));
  assert.ok(
    targetGroup.required_prerequisites.includes("product_write_reentry_review_ref"),
  );
  assert.ok(
    targetGroup.required_prerequisites.includes("product_write_target_contract_ref"),
  );
  assert.ok(targetGroup.idempotency_key_policy.length > 0);
  assert.ok(targetGroup.transaction_boundary_policy.includes("no_sql_transaction_now"));
  assert.ok(targetGroup.rollback_policy.includes("rollback_plan_required"));
  assert.ok(targetGroup.audit_trail_policy.includes("audit_trail_required"));
  assert.ok(targetGroup.preview_to_write_diff_policy.includes("not write approval"));
  assertAuthorityBoundary(
    targetGroup.authority_boundary,
    `$.target_groups.${targetGroup.target_group}.authority_boundary`,
  );
}

assert.equal(
  fixture.blocked_missing_prerequisite_example.status,
  "blocked_missing_prerequisite",
);
assert.equal(fixture.blocked_forbidden_target_example.status, "blocked_forbidden_target");
assert.equal(
  fixture.blocked_forbidden_authority_example.status,
  "blocked_forbidden_authority",
);
assert.equal(
  fixture.blocked_product_write_execution_example.status,
  "blocked_product_write_execution",
);
assert.equal(
  fixture.blocked_private_or_raw_payload_example.status,
  "blocked_private_or_raw_payload",
);
assert.equal(
  fixture.blocked_product_write_execution_example.authority_boundary.product_write_now,
  false,
  "blocked execution example must keep product_write_now false",
);
assert.equal(
  fixture.blocked_forbidden_authority_example.authority_boundary.product_write_now,
  true,
  "blocked forbidden authority example should show the forbidden claim",
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
  packageJson.scripts?.["smoke:product-write-reentry-review-v0-1"],
  "node scripts/smoke-product-write-reentry-review-v0-1.mjs",
);
assert.equal(
  packageJson.scripts?.["smoke:disabled-product-write-adapter-reentry-harness-v0-1"],
  "node scripts/smoke-disabled-product-write-adapter-reentry-harness-v0-1.mjs",
);
assert.ok(existsSync(reentrySmokePath), "product-write reentry smoke must exist");
assert.ok(existsSync(disabledHarnessSmokePath), "disabled harness smoke must exist");

console.log(
  JSON.stringify(
    {
      ok: true,
      smoke: "product-write-target-contract-v0-1",
      contract_version: contractVersion,
      target_group_version: targetGroupVersion,
      approval_binding_version: approvalBindingVersion,
      transaction_boundary_version: transactionBoundaryVersion,
      target_groups: targetGroups.length,
      forbidden_write_intents: forbiddenWriteIntents.length,
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
      /product[-_]write[-_]target[-_]contract/i.test(normalized) &&
      !expectedSliceFiles.includes(normalized)
    ) {
      unexpected.push(normalized);
    }
  }
  assert.deepEqual(
    unexpected,
    [],
    "slice must not add extra product-write-target-contract files",
  );
}

function assertNoRuntimeCapabilityFiles() {
  const forbiddenRuntimeHits = [];
  for (const filePath of walk(".")) {
    const normalized = filePath.replaceAll(path.sep, "/");
    const isThisSlice = /product[-_]write[-_]target[-_]contract/i.test(normalized);
    if (!isThisSlice) {
      continue;
    }
    if (
      /(^|\/)app\/api\//.test(normalized) ||
      /(^|\/)components\//.test(normalized) ||
      /(^|\/)(?:db|migrations)\//.test(normalized) ||
      /(^|\/)lib\//.test(normalized) ||
      /(provider|retrieval|codex-execution|product-id|github-api|git-runtime)/i.test(
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
