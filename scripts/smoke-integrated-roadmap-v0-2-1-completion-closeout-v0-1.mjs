#!/usr/bin/env node
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

const docsPath = "docs/INTEGRATED_ROADMAP_V0_2_1_COMPLETION_CLOSEOUT_V0_1.md";
const fixturePath =
  "fixtures/integrated-roadmap-v0-2-1-completion-closeout.sample.v0.1.json";
const smokePath =
  "scripts/smoke-integrated-roadmap-v0-2-1-completion-closeout-v0-1.mjs";
const packagePath = "package.json";
const indexPath = "docs/00_INDEX_LATEST.md";
const roadmapPath = "docs/AUGNES_INTEGRATED_DEVELOPMENT_ROADMAP_V0_2_1_FULL.md";
const formalInvariantDocsPath = "docs/FORMAL_INVARIANT_CHECKS_NARROW_SCOPE_V0_1.md";
const empiricalCalibrationDocsPath = "docs/EMPIRICAL_CALIBRATION_DATASET_V0_1.md";
const deterministicCrpfDocsPath = "docs/DETERMINISTIC_CRPF_VARIANT_REVIEW_V0_1.md";
const productWriteTargetDocsPath = "docs/PRODUCT_WRITE_TARGET_CONTRACT_V0_1.md";
const githubActuationDocsPath = "docs/GITHUB_ACTUATION_CONTRACT_V0_1.md";
const localGitLedgerExportDocsPath = "docs/LOCAL_GIT_LEDGER_EXPORT_V0_1.md";
const gitLedgerReadonlyDocsPath = "docs/GIT_LEDGER_EXPORT_READONLY_PREVIEW_V0_1.md";
const gitLedgerBuilderDocsPath =
  "docs/GIT_LEDGER_EXPORT_DETERMINISTIC_BUILDER_V0_1.md";
const authorityBoundaryDocsPath = "docs/AUTHORITY_BOUNDARY_REGRESSION_CI_V0_1.md";
const privacyGuardDocsPath = "docs/PRIVACY_REDACTION_RUNTIME_GUARD_V0_1.md";
const localDataPolicyDocsPath = "docs/LOCAL_DATA_EXPORT_IMPORT_POLICY_V0_1.md";
const codexResultDocsPath = "docs/CODEX_RESULT_REPORT_INGESTION_V0_1.md";
const temporalHandoffDocsPath =
  "docs/TEMPORAL_HANDOFF_USEFULNESS_EXPERIMENT_PLAN_V0_1.md";

const fixtureVersion = "integrated_roadmap_v0_2_1_completion_closeout.sample.v0.1";
const closeoutVersion = "integrated_roadmap_v0_2_1_completion_closeout.v0.1";
const scope = "project:augnes";
const packageScriptName =
  "smoke:integrated-roadmap-v0-2-1-completion-closeout-v0-1";
const packageScriptValue =
  "node scripts/smoke-integrated-roadmap-v0-2-1-completion-closeout-v0-1.mjs";

const expectedSliceFiles = [
  docsPath,
  fixturePath,
  smokePath,
  packagePath,
  indexPath,
];

const closeoutCategories = [
  "completed_contract_only",
  "completed_fixture_only",
  "completed_readonly_preview",
  "completed_static_smoke",
  "completed_local_helper",
  "completed_local_export_helper",
  "completed_runtime_guard",
  "completed_runtime_write_surface",
  "completed_release_readiness_review",
  "parked_pending_explicit_approval",
  "deferred_out_of_roadmap",
  "not_applicable",
  "superseded_by_existing_slice",
];

const requiredSliceIds = [
  "privacy_redaction_runtime_guard_v0_1",
  "local_data_export_import_policy_v0_1",
  "authority_boundary_regression_ci_v0_1",
  "codex_result_report_ingestion_v0_1",
  "temporal_handoff_usefulness_experiment_v0_1",
  "git_ledger_export_contract_v0_1",
  "git_ledger_export_deterministic_builder_v0_1",
  "git_ledger_export_readonly_preview_v0_1",
  "local_git_ledger_export_v0_1",
  "github_actuation_contract_v0_1",
  "product_write_reentry_review_v0_1",
  "product_write_target_contract_v0_1",
  "disabled_product_write_adapter_reentry_harness_v0_1",
  "deterministic_crpf_variant_review_v0_1",
  "empirical_calibration_dataset_v0_1",
  "target_agent_ai_context_packet_profiles_v0_1",
  "formal_invariant_checks_narrow_scope_v0_1",
  "release_readiness_matrix_v0_1",
  "release_candidate_operator_review_v0_1",
  "release_candidate_freeze_manifest_v0_1",
  "release_postmerge_observer_notes_v0_1",
];

const requiredVerificationScripts = [
  packageScriptName,
  "smoke:formal-invariant-checks-narrow-scope-v0-1",
  "smoke:empirical-calibration-dataset-v0-1",
  "smoke:deterministic-crpf-variant-review-v0-1",
  "smoke:product-write-target-contract-v0-1",
  "smoke:github-actuation-contract-v0-1",
  "smoke:local-git-ledger-export-v0-1",
  "smoke:git-ledger-export-readonly-preview-v0-1",
  "smoke:git-ledger-export-builder-v0-1",
  "smoke:git-ledger-export-contract-v0-1",
  "smoke:authority-boundary-regression-v0-1",
  "smoke:privacy-redaction-guard-v0-1",
  "smoke:local-data-export-policy-v0-1",
  "smoke:codex-result-report-ingestion-v0-1",
  "smoke:temporal-handoff-usefulness-experiment-plan-v0-1",
  "smoke:release-postmerge-observer-notes-v0-1",
  "smoke:release-readiness-matrix-v0-1",
];

const parkedWorkIds = [
  "product_write_minimal_runtime_v0_1",
  "github_actuation_implementation",
  "product_write_adapter_enablement",
  "product_id_allocation",
  "actual_proof_evidence_product_persistence_writes_beyond_existing_merged_surfaces",
];

const authorityAllowedTrueFields = [
  "integrated_roadmap_closeout_now",
  "closeout_review_only",
  "public_safe_inventory_only",
  "operator_decision_required_for_next_runtime",
  "product_write_reentry_requires_explicit_approval",
  "github_actuation_requires_separate_approval",
];

const authorityFalseFields = [
  "product_write_now",
  "product_write_runtime_now",
  "product_write_adapter_enabled_now",
  "product_id_allocation_now",
  "product_persistence_now",
  "sql_transaction_now",
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
  "closeout_is_release_approval",
  "closeout_is_product_write_approval",
  "closeout_is_merge_authority",
  "closeout_is_truth",
  "smoke_pass_is_truth",
  "ci_pass_is_truth",
];

const docsSections = [
  "## Purpose",
  "## Relationship to docs/AUGNES_INTEGRATED_DEVELOPMENT_ROADMAP_V0_2_1_FULL.md",
  "## Roadmap Status Summary",
  "## Phase-by-Phase Closeout Summary",
  "## Slice Inventory",
  "## Verification Rail Inventory",
  "## Warning Baseline",
  "## Parked Work",
  "## Explicit Approval Gates",
  "## Product-Write Stopline",
  "## GitHub Actuation Stopline",
  "## Release/Readiness Note",
  "## Authority Boundary",
  "## Fixture Policy",
  "## Verification Expectations",
  "## Deferred Work",
];

const docsExactPhrases = [
  "This slice is closeout review only.",
  "This slice is public-safe inventory only.",
  "This slice does not execute product-write.",
  "This slice does not enable a product-write adapter.",
  "This slice does not allocate product IDs.",
  "This slice does not persist products.",
  "This slice does not execute SQL transactions.",
  "This slice does not query/write DB.",
  "This slice does not add routes or UI.",
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
  "This slice does not execute Git.",
  "This slice does not call GitHub.",
  "This slice does not create PRs or merge PRs.",
  "This slice does not write repository files.",
  "This slice does not export/import files.",
  "This slice does not execute Codex.",
  "Product-write remains parked by #686.",
  "product_write_minimal_runtime_v0_1 is not approved by this closeout.",
  "GitHub actuation implementation is not approved by this closeout.",
  "Closeout is not release approval.",
  "Closeout is not product-write approval.",
  "Closeout is not merge authority.",
  "Closeout is not truth.",
  "Smoke/CI pass is not truth.",
  "The roadmap guide is not SSOT.",
  "Future product-write or GitHub actuation work requires a separate explicitly approved PR.",
];

const liveLookingPrivatePatterns = [
  /\bhttps?:\/\//,
  /\bfile:\/\//,
  /\/Users\//,
  /\/home\//,
  /\bsk-[A-Za-z0-9_-]{8,}\b/,
  /\bghp_[A-Za-z0-9_]{8,}\b/,
  /\bgithub_pat_[A-Za-z0-9_]{8,}\b/,
  /-----BEGIN [A-Z ]*PRIVATE KEY-----/,
  /\b(thread|run|session|resp|file)_[A-Za-z0-9]{16,}\b/,
  /\bSAFE_MARKER_/,
];

for (const requiredPath of [
  docsPath,
  fixturePath,
  smokePath,
  packagePath,
  indexPath,
  roadmapPath,
  formalInvariantDocsPath,
  empiricalCalibrationDocsPath,
  deterministicCrpfDocsPath,
  productWriteTargetDocsPath,
  githubActuationDocsPath,
  localGitLedgerExportDocsPath,
  gitLedgerReadonlyDocsPath,
  gitLedgerBuilderDocsPath,
  authorityBoundaryDocsPath,
  privacyGuardDocsPath,
  localDataPolicyDocsPath,
  codexResultDocsPath,
  temporalHandoffDocsPath,
]) {
  assert.ok(existsSync(requiredPath), `required path missing: ${requiredPath}`);
}

const docs = readFile(docsPath);
const fixtureText = readFile(fixturePath);
const smokeSource = readFile(smokePath);
const packageJson = JSON.parse(readFile(packagePath));
const index = readFile(indexPath);
const roadmap = readFile(roadmapPath);
const fixture = JSON.parse(fixtureText);

assert.ok(
  roadmap.includes("v0.2.1 FULL"),
  "roadmap file must mention v0.2.1 FULL",
);
assert.ok(
  roadmap.includes("formal_invariant_checks_narrow_scope_v0_1"),
  "roadmap must contain formal invariant checks slice",
);
assert.equal(packageJson.scripts?.[packageScriptName], packageScriptValue);

for (const pointer of [docsPath, fixturePath, smokePath]) {
  assert.ok(index.includes(pointer), `latest index must include ${pointer}`);
}
assert.ok(index.includes(packageScriptName), "latest index must include package script");
assert.ok(
  index.includes("integrated_roadmap_v0_2_1_completion_closeout_v0_1"),
  "latest index must include closeout slice id",
);
assert.ok(index.includes("Product-write remains parked by #686."));

for (const section of docsSections) {
  assert.ok(docs.includes(section), `docs must include section: ${section}`);
}
for (const phrase of docsExactPhrases) {
  assert.ok(
    normalizeWhitespace(docs).includes(normalizeWhitespace(phrase)),
    `docs must include phrase: ${phrase}`,
  );
}

assert.equal(fixture.fixture_version, fixtureVersion);
assert.equal(fixture.closeout_version, closeoutVersion);
assert.equal(fixture.scope, scope);
assert.equal(fixture.roadmap_ref, roadmapPath);
assert.equal(fixture.closeout_status, "closeout_review_only");
assert.ok(Array.isArray(fixture.phase_summary), "fixture must include phase summary");
assert.ok(Array.isArray(fixture.slice_inventory), "fixture must include slice inventory");
assert.ok(
  Array.isArray(fixture.verification_script_inventory),
  "fixture must include verification script inventory",
);
assert.ok(Array.isArray(fixture.warning_baseline), "fixture must include warning baseline");
assert.ok(Array.isArray(fixture.parked_work), "fixture must include parked work");
assert.ok(Array.isArray(fixture.approval_gates), "fixture must include approval gates");
assert.ok(fixture.product_write_stopline, "fixture must include product-write stopline");
assert.ok(fixture.github_actuation_stopline, "fixture must include GitHub actuation stopline");

assertAuthorityBoundary(fixture.authority_boundary, "$.authority_boundary");
assertSliceInventory();
assertVerificationScriptInventory();
assertWarningBaseline();
assertParkedWork();
assertApprovalGates();
assertStoplines();
assertNoRealLookingPrivateExamples();
assertNarrowSliceFileScope();
assertNoRuntimeCapabilityFiles();

assert.equal(
  packageJson.scripts?.["smoke:authority-boundary-regression-v0-1"],
  "node scripts/smoke-authority-boundary-regression-v0-1.mjs",
  "authority boundary regression smoke package script must not be weakened",
);
assert.equal(
  packageJson.scripts?.["smoke:formal-invariant-checks-narrow-scope-v0-1"],
  "node scripts/smoke-formal-invariant-checks-narrow-scope-v0-1.mjs",
  "formal invariant smoke must remain runnable",
);

console.log(
  JSON.stringify(
    {
      ok: true,
      smoke: "integrated-roadmap-v0-2-1-completion-closeout-v0-1",
      closeout_version: closeoutVersion,
      slices: fixture.slice_inventory.length,
      parked_work: fixture.parked_work.length,
      verification_scripts: fixture.verification_script_inventory.length,
    },
    null,
    2,
  ),
);

function readFile(filePath) {
  return readFileSync(filePath, "utf8");
}

function normalizeWhitespace(value) {
  return String(value).replace(/\s+/g, " ").trim();
}

function assertAuthorityBoundary(boundary, label) {
  assert.ok(boundary && typeof boundary === "object", `${label} must be an object`);
  for (const field of authorityAllowedTrueFields) {
    assert.equal(boundary[field], true, `${label}.${field} must be true`);
  }
  for (const field of authorityFalseFields) {
    assert.equal(boundary[field], false, `${label}.${field} must be false`);
  }
}

function assertSliceInventory() {
  const inventoryById = new Map(
    fixture.slice_inventory.map((entry) => [entry.slice_id, entry]),
  );
  for (const sliceId of requiredSliceIds) {
    assert.ok(inventoryById.has(sliceId), `slice inventory must include ${sliceId}`);
  }
  for (const entry of fixture.slice_inventory) {
    assert.ok(closeoutCategories.includes(entry.category), `${entry.slice_id}.category`);
    assert.ok(Array.isArray(entry.artifact_refs), `${entry.slice_id}.artifact_refs`);
    assert.ok(entry.artifact_refs.length > 0, `${entry.slice_id}.artifact_refs`);
    assert.ok(entry.verification_script_ref, `${entry.slice_id}.verification_script_ref`);
    assert.ok(entry.closeout_note, `${entry.slice_id}.closeout_note`);
  }
  assert.equal(
    inventoryById.get("product_write_target_contract_v0_1").category,
    "completed_contract_only",
  );
  assert.equal(
    inventoryById.get("git_ledger_export_readonly_preview_v0_1").category,
    "completed_readonly_preview",
  );
  assert.equal(
    inventoryById.get("local_git_ledger_export_v0_1").category,
    "completed_local_export_helper",
  );
  assert.equal(
    inventoryById.get("formal_invariant_checks_narrow_scope_v0_1").category,
    "completed_static_smoke",
  );
}

function assertVerificationScriptInventory() {
  for (const scriptName of requiredVerificationScripts) {
    assert.ok(
      fixture.verification_script_inventory.includes(scriptName),
      `fixture verification_script_inventory must include ${scriptName}`,
    );
    assert.ok(
      packageJson.scripts?.[scriptName],
      `package.json must include verification script ${scriptName}`,
    );
  }
}

function assertWarningBaseline() {
  assert.ok(fixture.warning_baseline.length > 0, "warning baseline must be non-empty");
  const warningText = JSON.stringify(fixture.warning_baseline);
  assert.ok(
    warningText.includes("stripTypeScriptTypes"),
    "warning baseline must identify stripTypeScriptTypes warning",
  );
  assert.ok(
    warningText.includes("diagnostic only"),
    "warning baseline must identify warning as diagnostic only",
  );
}

function assertParkedWork() {
  const parkedById = new Map(fixture.parked_work.map((entry) => [entry.work_id, entry]));
  for (const workId of parkedWorkIds) {
    assert.ok(parkedById.has(workId), `parked_work must include ${workId}`);
    assert.equal(
      parkedById.get(workId).status,
      "parked_pending_explicit_approval",
      `${workId} must be parked pending explicit approval`,
    );
  }
  assert.ok(
    parkedById
      .get("product_write_minimal_runtime_v0_1")
      .reason.includes("Product-write remains parked by #686"),
    "product_write_minimal_runtime_v0_1 must preserve #686 stopline",
  );
}

function assertApprovalGates() {
  const gatesById = new Map(fixture.approval_gates.map((entry) => [entry.gate_id, entry]));
  for (const gateId of [
    "future_product_write_runtime",
    "future_github_actuation_implementation",
  ]) {
    assert.ok(gatesById.has(gateId), `approval gate missing ${gateId}`);
    assert.equal(
      gatesById.get(gateId).required_approval,
      "separate_explicitly_approved_pr",
      `${gateId} must require separate explicitly approved PR`,
    );
  }
}

function assertStoplines() {
  assert.equal(
    fixture.product_write_stopline.status,
    "parked_pending_explicit_approval",
  );
  assert.equal(fixture.product_write_stopline.issue_ref, "#686");
  assert.equal(
    fixture.product_write_stopline.statement,
    "Product-write remains parked by #686.",
  );
  assert.equal(fixture.product_write_stopline.minimal_runtime_approval, "not_approved");
  assert.equal(fixture.product_write_stopline.product_write_authority_granted, false);
  assert.equal(
    fixture.github_actuation_stopline.status,
    "parked_pending_explicit_approval",
  );
  assert.equal(
    fixture.github_actuation_stopline.statement,
    "GitHub actuation implementation is not approved by this closeout.",
  );
  assert.equal(
    fixture.github_actuation_stopline.github_actuation_authority_granted,
    false,
  );
}

function assertNoRealLookingPrivateExamples() {
  const newSliceSources = [
    [docsPath, docs],
    [fixturePath, fixtureText],
    [smokePath, smokeSource],
  ];
  for (const [filePath, source] of newSliceSources) {
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
    assert.ok(existsSync(expectedPath), `expected slice file must exist: ${expectedPath}`);
  }
  const unexpected = [];
  for (const filePath of walk(".")) {
    if (
      /integrated[-_]roadmap[-_]v0[-_]2[-_]1[-_]completion[-_]closeout/i.test(
        filePath,
      ) &&
      !expectedSliceFiles.includes(filePath)
    ) {
      unexpected.push(filePath);
    }
  }
  assert.deepEqual(
    unexpected.sort(),
    [],
    "closeout slice files must stay in the expected file set",
  );
}

function assertNoRuntimeCapabilityFiles() {
  const forbiddenSliceRuntimePatterns = [
    /^app\/api\/.*integrated.*roadmap/i,
    /^components\/.*integrated.*roadmap/i,
    /^lib\/.*integrated.*roadmap/i,
    /^types\/.*integrated.*roadmap/i,
    /^db\//,
    /^migrations\//,
  ];
  const unexpected = [];
  for (const filePath of walk(".")) {
    const normalized = filePath.replaceAll(path.sep, "/");
    if (expectedSliceFiles.includes(normalized)) {
      continue;
    }
    if (
      /integrated[-_]roadmap[-_]v0[-_]2[-_]1[-_]completion[-_]closeout/i.test(
        normalized,
      ) &&
      forbiddenSliceRuntimePatterns.some((pattern) => pattern.test(normalized))
    ) {
      unexpected.push(normalized);
    }
  }
  assert.deepEqual(
    unexpected.sort(),
    [],
    "no route/UI/lib/types/DB/runtime files may be added for this closeout slice",
  );
}

function walk(root) {
  const paths = [];
  for (const entry of readdirSync(root)) {
    const fullPath = path.join(root, entry);
    const normalized = fullPath.replaceAll(path.sep, "/");
    if (
      /(^|\/)(node_modules|\.next|\.git|dist|build|coverage|out|\.turbo|\.tmp|tmp)$/.test(
        normalized,
      )
    ) {
      continue;
    }
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      paths.push(...walk(fullPath));
      continue;
    }
    paths.push(normalized);
  }
  return paths;
}
