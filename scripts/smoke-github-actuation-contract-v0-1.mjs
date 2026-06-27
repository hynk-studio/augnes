#!/usr/bin/env node
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

const docsPath = "docs/GITHUB_ACTUATION_CONTRACT_V0_1.md";
const typePath = "types/github-actuation-contract.ts";
const fixturePath = "fixtures/github-actuation-contract.sample.v0.1.json";
const smokePath = "scripts/smoke-github-actuation-contract-v0-1.mjs";
const packagePath = "package.json";
const indexPath = "docs/00_INDEX_LATEST.md";
const roadmapPath = "docs/AUGNES_INTEGRATED_DEVELOPMENT_ROADMAP_V0_2_1_FULL.md";
const gitLedgerContractDocsPath = "docs/GIT_LEDGER_EXPORT_CONTRACT_V0_1.md";
const gitLedgerBuilderDocsPath =
  "docs/GIT_LEDGER_EXPORT_DETERMINISTIC_BUILDER_V0_1.md";
const gitLedgerBuilderPath = "lib/git-ledger/build-export-packet.ts";
const gitLedgerReadonlyDocsPath = "docs/GIT_LEDGER_EXPORT_READONLY_PREVIEW_V0_1.md";
const localGitLedgerExportDocsPath = "docs/LOCAL_GIT_LEDGER_EXPORT_V0_1.md";
const localGitLedgerExportPath = "lib/git-ledger/local-export.ts";
const privacyGuardDocsPath = "docs/PRIVACY_REDACTION_RUNTIME_GUARD_V0_1.md";
const localDataPolicyDocsPath = "docs/LOCAL_DATA_EXPORT_IMPORT_POLICY_V0_1.md";
const authorityBoundaryDocsPath = "docs/AUTHORITY_BOUNDARY_REGRESSION_CI_V0_1.md";

const fixtureVersion = "github_actuation_contract.sample.v0.1";
const contractVersion = "github_actuation_contract.v0.1";
const planVersion = "github_actuation_plan.v0.1";
const approvalPayloadVersion = "github_actuation_approval_payload.v0.1";
const scope = "project:augnes";
const packageScriptName = "smoke:github-actuation-contract-v0-1";
const packageScriptValue = "node scripts/smoke-github-actuation-contract-v0-1.mjs";

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
  "dry_run_plan_only",
  "ready_for_future_operator_review",
  "blocked_missing_explicit_approval",
  "blocked_forbidden_target",
  "blocked_forbidden_authority",
  "blocked_private_or_raw_payload",
  "rejected",
];

const actionKinds = [
  "dry_run_branch_plan",
  "dry_run_commit_plan",
  "dry_run_pull_request_plan",
  "dry_run_review_comment_plan",
  "dry_run_label_plan",
  "dry_run_check_summary_plan",
  "blocked_branch_create",
  "blocked_commit_create",
  "blocked_pull_request_create",
  "blocked_merge",
  "blocked_release_create",
  "blocked_repository_file_write",
  "blocked_product_write",
];

const permissionProfiles = [
  "read_only_metadata",
  "contents_read_only",
  "pull_request_read_only",
  "dry_run_planning_only",
  "future_contents_write_requires_explicit_approval",
  "future_pull_request_write_requires_explicit_approval",
  "forbidden_unbounded_write",
  "forbidden_admin",
  "forbidden_secrets",
  "forbidden_actions_write",
  "forbidden_packages_write",
  "forbidden_deployments_write",
];

const targetFilePolicies = [
  "allowlisted_public_safe_doc_ref",
  "allowlisted_public_safe_type_ref",
  "allowlisted_public_safe_fixture_ref",
  "allowlisted_public_safe_script_ref",
  "allowlisted_public_safe_lib_ref",
  "forbidden_secret_path",
  "forbidden_credential_path",
  "forbidden_private_key_path",
  "forbidden_unapproved_lockfile_path",
  "forbidden_unapproved_workflow_path",
  "forbidden_unapproved_index_pointer_path",
  "forbidden_product_write_path",
  "forbidden_db_migration_path",
  "forbidden_state_mutating_route_path",
  "forbidden_provider_secret_config_path",
];

const reasonCodes = [
  "roadmap_file_present",
  "git_ledger_contract_ref_present",
  "git_ledger_builder_ref_present",
  "readonly_preview_ref_present",
  "local_export_ref_present",
  "privacy_guard_required",
  "local_data_export_policy_required",
  "authority_boundary_regression_required",
  "github_actuation_contract_only",
  "dry_run_plan_only",
  "explicit_operator_approval_required",
  "target_repo_ref_required",
  "target_branch_ref_required",
  "target_file_allowlist_required",
  "forbidden_target_blocked",
  "forbidden_file_path_blocked",
  "raw_private_payload_blocked",
  "private_url_blocked",
  "local_private_path_blocked",
  "secret_like_pattern_blocked",
  "github_token_blocked",
  "provider_thread_run_session_id_blocked",
  "github_api_not_called",
  "git_write_not_executed",
  "commit_not_created",
  "branch_not_created",
  "tag_not_created",
  "pull_request_not_created",
  "pull_request_not_merged",
  "review_not_submitted",
  "label_not_written",
  "check_not_written",
  "release_not_created",
  "repository_file_not_written",
  "contents_write_not_granted",
  "actions_write_not_granted",
  "admin_permission_not_granted",
  "proof_not_created",
  "evidence_not_created",
  "promotion_not_executed",
  "durable_state_not_mutated",
  "formation_receipt_not_written",
  "codex_not_executed",
  "product_write_denied",
  "product_id_allocation_not_executed",
  "approval_not_merge_authority",
  "approval_not_product_write",
  "approval_not_proof",
  "approval_not_durable_state",
  "git_ref_not_authority",
  "github_pr_not_core_decision",
  "smoke_pass_not_truth",
  "ci_pass_not_truth",
];

const authorityAllowedTrueFields = [
  "github_actuation_contract_now",
  "dry_run_contract_only",
  "future_operator_approval_required",
  "caller_provided_refs_only",
];

const authorityFalseFields = [
  "github_api_call_now",
  "git_write_now",
  "git_commit_now",
  "git_branch_now",
  "git_tag_now",
  "github_pr_create_now",
  "github_pr_merge_now",
  "github_review_submit_now",
  "github_label_write_now",
  "github_check_write_now",
  "github_release_create_now",
  "repository_file_write_now",
  "contents_write_now",
  "actions_write_now",
  "packages_write_now",
  "deployments_write_now",
  "secrets_read_or_write_now",
  "admin_permission_now",
  "local_file_export_now",
  "local_file_import_now",
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
  "promotion_execution_now",
  "durable_state_write_now",
  "durable_state_apply_now",
  "formation_receipt_write_now",
  "codex_execution_now",
  "codex_execution_authority",
  "github_automation_authority",
  "product_write_now",
  "product_id_allocation_now",
  "product_write_authority",
  "approval_is_merge_authority",
  "approval_is_product_write",
  "approval_is_proof",
  "approval_is_durable_state",
  "git_ref_is_authority",
  "github_pr_is_core_decision",
  "smoke_pass_is_truth",
  "ci_pass_is_truth",
];

const requiredDocsSections = [
  "## Purpose",
  "## Relationship to docs/AUGNES_INTEGRATED_DEVELOPMENT_ROADMAP_V0_2_1_FULL.md",
  "## Relationship to Git Ledger Export Contract v0.1",
  "## Relationship to Git Ledger Export Deterministic Builder v0.1",
  "## Relationship to Git Ledger Export Readonly Preview v0.1",
  "## Relationship to Local Git Ledger Export v0.1",
  "## Relationship to Privacy Redaction Runtime Guard",
  "## Relationship to Local Data Export/Import Policy",
  "## Relationship to Authority Boundary Regression CI",
  "## Contract Scope",
  "## Permission Profile Policy",
  "## Target Repository/Branch Policy",
  "## Target File Allowlist Policy",
  "## Explicit Approval Payload Policy",
  "## Dry-Run Plan Policy",
  "## Preview-to-Action Diff Policy",
  "## Rollback/Abort Policy",
  "## Idempotency Policy",
  "## Privacy/Redaction Policy",
  "## Authority Boundary",
  "## Fixture Policy",
  "## Verification Expectations",
  "## Deferred Work",
];

const docsExactPhrases = [
  "This slice is contract-only and dry-run-only.",
  "This slice does not call GitHub.",
  "This slice does not execute Git.",
  "This slice does not create branches, commits, tags, PRs, reviews, labels, checks, releases, or merges.",
  "This slice does not write repository files.",
  "This slice does not grant contents write permission.",
  "This slice does not grant actions write permission.",
  "This slice does not grant admin permission.",
  "This slice does not read or write secrets.",
  "This slice does not export files locally.",
  "This slice does not import files.",
  "This slice does not query or write DB.",
  "This slice does not add routes or UI.",
  "This slice does not call providers.",
  "This slice does not send prompts.",
  "This slice does not fetch sources.",
  "This slice does not execute retrieval/RAG.",
  "This slice does not create proof/evidence.",
  "This slice does not write claim/evidence records.",
  "This slice does not promote Perspective.",
  "This slice does not write/apply durable Perspective state.",
  "This slice does not write Formation Receipts.",
  "This slice does not execute Codex.",
  "This slice does not product-write or allocate product IDs.",
  "Approval payload is not merge authority.",
  "Approval payload is not product-write.",
  "Approval payload is not proof.",
  "Approval payload is not durable state.",
  "Git ref is not authority.",
  "GitHub PR is not Core decision.",
  "Product-write remains parked by #686.",
  "Smoke/CI pass is not truth.",
  "The roadmap guide is not SSOT.",
  "Any future GitHub actuation implementation requires a separate explicitly approved PR.",
];

const requiredTypeExports = [
  "GitHubActuationContractVersion",
  "GitHubActuationPlanVersion",
  "GitHubActuationApprovalPayloadVersion",
  "GitHubActuationScope",
  "GitHubActuationStatuses",
  "GitHubActuationActionKinds",
  "GitHubActuationPermissionProfiles",
  "GitHubActuationTargetFilePolicies",
  "GitHubActuationReasonCodes",
  "GitHubActuationAuthorityBoundary",
  "GitHubActuationPlan",
  "GitHubActuationExplicitApprovalPayload",
  "GitHubActuationTargetFileRef",
  "GitHubActuationDryRunResult",
  "GitHubActuationValidationFinding",
];

const safeFixtureMarkers = [
  "SAFE_MARKER_GITHUB_TOKEN",
  "SAFE_MARKER_PRIVATE_URL",
  "SAFE_MARKER_LOCAL_PRIVATE_PATH",
  "SAFE_MARKER_SECRET_TOKEN",
  "SAFE_MARKER_RAW_SOURCE_BODY",
  "SAFE_MARKER_RAW_PROVIDER_OUTPUT",
  "SAFE_MARKER_RAW_RETRIEVAL_OUTPUT",
  "SAFE_MARKER_PROVIDER_THREAD_ID",
  "SAFE_MARKER_RAW_CONVERSATION",
  "SAFE_MARKER_HIDDEN_REASONING",
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

const requiredPaths = [
  docsPath,
  typePath,
  fixturePath,
  smokePath,
  packagePath,
  indexPath,
  roadmapPath,
  gitLedgerContractDocsPath,
  gitLedgerBuilderDocsPath,
  gitLedgerBuilderPath,
  gitLedgerReadonlyDocsPath,
  localGitLedgerExportDocsPath,
  localGitLedgerExportPath,
  privacyGuardDocsPath,
  localDataPolicyDocsPath,
  authorityBoundaryDocsPath,
];

for (const requiredPath of requiredPaths) {
  assert.ok(existsSync(requiredPath), `required path missing: ${requiredPath}`);
}

const docs = readFileSync(docsPath, "utf8");
const docsNormalized = normalizeWhitespace(docs);
const types = readFileSync(typePath, "utf8");
const fixtureText = readFileSync(fixturePath, "utf8");
const smokeSource = readFileSync(smokePath, "utf8");
const packageJson = JSON.parse(readFileSync(packagePath, "utf8"));
const index = readFileSync(indexPath, "utf8");
const roadmap = readFileSync(roadmapPath, "utf8");
const fixture = JSON.parse(fixtureText);

assert.ok(
  roadmap.includes("github_actuation_contract_v0_1"),
  "roadmap must contain github_actuation_contract_v0_1",
);
assert.equal(packageJson.scripts?.[packageScriptName], packageScriptValue);
assert.ok(index.includes("GitHub Actuation Contract v0.1"));
assert.ok(index.includes("docs/GITHUB_ACTUATION_CONTRACT_V0_1.md"));
assert.ok(index.includes("types/github-actuation-contract.ts"));
assert.ok(index.includes("fixtures/github-actuation-contract.sample.v0.1.json"));
assert.ok(index.includes("scripts/smoke-github-actuation-contract-v0-1.mjs"));
assert.ok(index.includes("github_actuation_contract_v0_1"));
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
for (const dependencyPhrase of [
  "Git Ledger Export Contract v0.1",
  "Git Ledger Export Deterministic Builder v0.1",
  "Git Ledger Export Readonly Preview v0.1",
  "Local Git Ledger Export v0.1",
  "Privacy Redaction Runtime Guard v0.1",
  "Local Data Export/Import Policy v0.1",
  "Authority Boundary Regression CI v0.1",
]) {
  assert.ok(docs.includes(dependencyPhrase), `docs must mention ${dependencyPhrase}`);
}

for (const exportedName of requiredTypeExports) {
  assert.ok(types.includes(exportedName), `types must include ${exportedName}`);
}
for (const value of [
  contractVersion,
  planVersion,
  approvalPayloadVersion,
  scope,
  ...statusVocabulary,
  ...actionKinds,
  ...permissionProfiles,
  ...targetFilePolicies,
  ...reasonCodes,
  ...authorityAllowedTrueFields,
  ...authorityFalseFields,
]) {
  assert.ok(types.includes(value), `types must include ${value}`);
}

assert.equal(fixture.fixture_version, fixtureVersion);
assert.equal(fixture.contract_version, contractVersion);
assert.equal(fixture.plan_version, planVersion);
assert.equal(fixture.approval_payload_version, approvalPayloadVersion);
assert.equal(fixture.scope, scope);

for (const key of [
  "safe_dry_run_plan_example",
  "explicit_approval_payload_example",
  "target_file_policy_example",
  "blocked_missing_explicit_approval_example",
  "blocked_forbidden_target_example",
  "blocked_forbidden_authority_example",
  "blocked_private_or_raw_payload_example",
  "dry_run_result_example",
  "authority_boundary_sample",
]) {
  assert.ok(fixture[key], `fixture must include ${key}`);
}

assert.equal(fixture.safe_dry_run_plan_example.status, "dry_run_plan_only");
assert.equal(
  fixture.explicit_approval_payload_example.product_write_acknowledgement,
  false,
);
assert.equal(
  fixture.explicit_approval_payload_example.approval_is_not_product_write,
  true,
);
assert.equal(fixture.explicit_approval_payload_example.approval_is_not_proof, true);
assert.equal(
  fixture.explicit_approval_payload_example.approval_is_not_durable_state,
  true,
);
assert.equal(
  fixture.blocked_missing_explicit_approval_example.status,
  "blocked_missing_explicit_approval",
);
assert.equal(fixture.blocked_forbidden_target_example.status, "blocked_forbidden_target");
assert.equal(
  fixture.blocked_forbidden_authority_example.status,
  "blocked_forbidden_authority",
);
assert.equal(
  fixture.blocked_private_or_raw_payload_example.status,
  "blocked_private_or_raw_payload",
);
assert.equal(fixture.dry_run_result_example.status, "dry_run_plan_only");

assertAuthorityBoundary(fixture.authority_boundary_sample, "$.authority_boundary_sample");
assertAuthorityBoundary(
  fixture.safe_dry_run_plan_example.authority_boundary,
  "$.safe_dry_run_plan_example.authority_boundary",
);
assertAuthorityBoundary(
  fixture.explicit_approval_payload_example.authority_boundary,
  "$.explicit_approval_payload_example.authority_boundary",
);
assertAuthorityBoundary(
  fixture.dry_run_result_example.authority_boundary,
  "$.dry_run_result_example.authority_boundary",
);
for (const field of authorityFalseFields) {
  if (field === "github_api_call_now") {
    assert.equal(
      fixture.blocked_forbidden_authority_example.authority_boundary[field],
      true,
      "blocked forbidden authority fixture should show a forbidden claim",
    );
  } else {
    assert.equal(
      fixture.blocked_forbidden_authority_example.authority_boundary[field],
      false,
      `blocked forbidden authority boundary ${field} should remain false`,
    );
  }
}

const allowedPolicies = fixture.target_file_policy_example.allowed_path_examples.map(
  (entry) => entry.policy,
);
const forbiddenPolicies = fixture.target_file_policy_example.forbidden_path_examples.map(
  (entry) => entry.policy,
);
for (const requiredAllowed of [
  "allowlisted_public_safe_doc_ref",
  "allowlisted_public_safe_type_ref",
  "allowlisted_public_safe_fixture_ref",
  "allowlisted_public_safe_script_ref",
]) {
  assert.ok(allowedPolicies.includes(requiredAllowed));
}
for (const requiredForbidden of [
  "forbidden_secret_path",
  "forbidden_credential_path",
  "forbidden_private_key_path",
  "forbidden_unapproved_lockfile_path",
  "forbidden_unapproved_workflow_path",
  "forbidden_unapproved_index_pointer_path",
  "forbidden_product_write_path",
  "forbidden_db_migration_path",
  "forbidden_state_mutating_route_path",
  "forbidden_provider_secret_config_path",
]) {
  assert.ok(forbiddenPolicies.includes(requiredForbidden));
}

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
  packageJson.scripts?.["smoke:local-git-ledger-export-v0-1"],
  "node scripts/smoke-local-git-ledger-export-v0-1.mjs",
);
assert.equal(
  packageJson.scripts?.["smoke:git-ledger-export-builder-v0-1"],
  "node scripts/smoke-git-ledger-export-builder-v0-1.mjs",
);
assert.equal(
  packageJson.scripts?.["smoke:git-ledger-export-contract-v0-1"],
  "node scripts/smoke-git-ledger-export-contract-v0-1.mjs",
);

console.log(
  JSON.stringify(
    {
      ok: true,
      smoke: "github-actuation-contract-v0-1",
      contract_version: contractVersion,
      plan_version: planVersion,
      approval_payload_version: approvalPayloadVersion,
      statuses: statusVocabulary.length,
      action_kinds: actionKinds.length,
      permission_profiles: permissionProfiles.length,
      target_file_policies: targetFilePolicies.length,
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
      /github[-_]actuation[-_]contract/i.test(normalized) &&
      !expectedSliceFiles.includes(normalized)
    ) {
      unexpected.push(normalized);
    }
  }
  assert.deepEqual(unexpected, [], "slice must not add extra github-actuation-contract files");
}

function assertNoRuntimeCapabilityFiles() {
  const forbiddenRuntimeHits = [];
  for (const filePath of walk(".")) {
    const normalized = filePath.replaceAll(path.sep, "/");
    const isThisSlice = /github[-_]actuation[-_]contract/i.test(normalized);
    if (!isThisSlice) {
      continue;
    }
    if (
      /(^|\/)app\/api\//.test(normalized) ||
      /(^|\/)components\//.test(normalized) ||
      /(^|\/)(?:db|migrations)\//.test(normalized) ||
      /(^|\/)lib\//.test(normalized) ||
      /(provider|retrieval|codex-execution|product-write|product-id|github-api|git-runtime)/i.test(
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

function normalizeWhitespace(value) {
  return value.replace(/\s+/g, " ").trim();
}
