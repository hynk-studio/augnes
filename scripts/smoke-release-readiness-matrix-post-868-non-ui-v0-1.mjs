#!/usr/bin/env node
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

const docsPath = "docs/RELEASE_READINESS_MATRIX_POST_868_NON_UI_V0_1.md";
const fixturePath =
  "fixtures/release-readiness-matrix-post-868-non-ui.sample.v0.1.json";
const smokePath =
  "scripts/smoke-release-readiness-matrix-post-868-non-ui-v0-1.mjs";
const packagePath = "package.json";
const indexPath = "docs/00_INDEX_LATEST.md";

const selectedAuditSmokePath =
  "scripts/smoke-selected-runtime-audit-event-store-v0-1.mjs";
const gitLedgerSmokePath =
  "scripts/smoke-git-ledger-export-from-local-manifest-v0-1.mjs";
const manifestSmokePath =
  "scripts/smoke-local-data-export-manifest-builder-v0-1.mjs";
const proposalSmokePath =
  "scripts/smoke-dogfooding-to-review-memory-proposal-v0-1.mjs";
const handoffSmokePath =
  "scripts/smoke-conversation-handoff-from-dogfooding-record-v0-1.mjs";
const packetSmokePath = "scripts/smoke-conversation-handoff-packet-v0-2.mjs";
const codexBindingSmokePath =
  "scripts/smoke-codex-result-to-dogfooding-record-v0-1.mjs";
const dogfoodingSmokePath =
  "scripts/smoke-dogfooding-research-record-runtime-v0-1.mjs";

const reconciliationDocsPath =
  "docs/DOGFOODING_RESEARCH_RECORD_RUNTIME_V0_1.md";
const selectedAuditDocsPath =
  "docs/SELECTED_RUNTIME_AUDIT_EVENT_STORE_V0_1.md";
const privacyDocsPath = "docs/PRIVACY_REDACTION_RUNTIME_GUARD_V0_1.md";
const authorityDocsPath = "docs/AUTHORITY_BOUNDARY_REGRESSION_CI_V0_1.md";

const matrixVersion = "release_readiness_matrix_post_868_non_ui.v0.1";
const scope = "project:augnes";
const nextRecommendedSlice =
  "no_next_slice_v0_3_core_sequence_complete_pending_operator_decision";
const packageScriptName =
  "smoke:release-readiness-matrix-post-868-non-ui-v0-1";
const packageScriptValue =
  "node scripts/smoke-release-readiness-matrix-post-868-non-ui-v0-1.mjs";

const expectedChangedFiles = new Set([
  docsPath,
  fixturePath,
  smokePath,
  "docs/ACTIVE_DEVELOPMENT_COMPLETION_POSTURE_V0_1.md",
  "docs/CONVERSATION_HANDOFF_FROM_DOGFOODING_RECORD_V0_1.md",
  "fixtures/codex-result-report-ingestion.sample.v0.1.json",
  "fixtures/codex-result-to-dogfooding-record.sample.v0.1.json",
  "fixtures/conversation-handoff-from-dogfooding-record.sample.v0.1.json",
  "fixtures/git-ledger-export-from-local-manifest.sample.v0.1.json",
  "lib/dogfooding/codex-result-report-normalizer.ts",
  "lib/git-ledger/build-export-packet-from-local-manifest.ts",
  "lib/git-ledger/build-export-packet.ts",
  "lib/handoff/build-handoff-from-dogfooding-record.ts",
  "scripts/smoke-codex-result-report-ingestion-v0-1.mjs",
  "scripts/smoke-codex-result-to-dogfooding-record-v0-1.mjs",
  "scripts/smoke-conversation-handoff-from-dogfooding-record-v0-1.mjs",
  "scripts/smoke-git-ledger-export-from-local-manifest-v0-1.mjs",
  "scripts/smoke-local-data-export-manifest-builder-v0-1.mjs",
  "scripts/smoke-dogfooding-to-review-memory-proposal-v0-1.mjs",
  "scripts/smoke-selected-runtime-audit-event-store-v0-1.mjs",
  packagePath,
  indexPath,
  selectedAuditSmokePath,
  gitLedgerSmokePath,
  manifestSmokePath,
  proposalSmokePath,
  handoffSmokePath,
  packetSmokePath,
  codexBindingSmokePath,
  dogfoodingSmokePath,
]);

const newSliceFiles = [docsPath, fixturePath, smokePath];
const allowedRepairRuntimeFiles = new Set([
  "lib/dogfooding/codex-result-report-normalizer.ts",
  "lib/git-ledger/build-export-packet-from-local-manifest.ts",
  "lib/git-ledger/build-export-packet.ts",
  "lib/handoff/build-handoff-from-dogfooding-record.ts",
]);

const requiredRowIds = [
  "pr_868_frozen_web_baseline",
  "active_development_completion_posture",
  "dogfooding_research_record_runtime",
  "codex_result_to_dogfooding_record_binding",
  "conversation_handoff_packet_builder",
  "conversation_handoff_from_dogfooding_record_binding",
  "dogfooding_to_review_memory_proposal_candidate_builder",
  "local_data_export_manifest_candidate_builder",
  "git_ledger_export_from_local_manifest_binding",
  "selected_runtime_audit_event_store",
  "privacy_redaction_guard",
  "authority_boundary_regression",
  "product_write_parked_status",
  "github_git_actuation_blocked_status",
  "live_provider_blocked_status",
  "source_fetch_blocked_status",
  "retrieval_expansion_blocked_status",
  "release_deploy_publish_blocked_status",
  "web_last_backlog_frozen_status",
  "skipped_checks_and_reason",
  "known_warnings",
  "not_done_items",
  "remaining_explicit_reentry_backlog",
];

const requiredClassifications = [
  "implemented_non_ui",
  "candidate_only",
  "blocked_by_design",
  "web_last_backlog",
  "explicit_reentry_blocked",
  "skipped_with_reason",
  "warning_observed",
  "incomplete",
  "not_in_scope",
  "ready_for_operator_review",
  "ready_for_next_planning",
  "no_release_recommendation",
];

const requiredBlockedCapabilities = [
  "product_write",
  "github_git_actuation",
  "live_provider",
  "source_fetch",
  "retrieval_expansion",
  "release_deploy_publish",
  "proof_evidence_creation",
  "review_memory_write",
  "promotion_execution",
  "formation_receipt_write",
  "durable_state_apply",
];

const requiredWebLastBacklog = [
  "ui_components",
  "cockpit_workbench_polish",
  "browser_validation_only",
  "public_surface_polish",
  "route_ia_polish",
  "mobile_viewport_polish",
  "read_display_only_ui_expansion",
];

const requiredExplicitReentry = [
  "product_write",
  "github_git_actuation",
  "live_provider_calls",
  "source_fetch",
  "retrieval_expansion",
  "release_execution",
  "promotion_execution",
  "formation_receipt_write",
  "durable_state_apply",
  "proof_evidence_creation",
];

const executionFalseFields = [
  "release_execution",
  "deploy_execution",
  "publish_execution",
  "product_write_execution",
  "github_git_actuation",
  "provider_execution",
  "retrieval_execution",
  "source_fetch_execution",
];

const requiredDocsPhrases = [
  "PR #868 is treated as the frozen web baseline",
  "`/` is the public Augnes surface",
  "`/perspective` is Perspective detail",
  "`/workbench` is Cockpit/workbench",
  "PR #878 provides selected runtime audit event store context.",
  "This matrix is a static repo-grounded artifact.",
  "Its authority coverage is verified by fixture fields and smoke assertions, not by a callable runtime phrase blocker.",
  "This slice adds no UI",
  "Release readiness matrix is not release approval.",
  "Release readiness matrix is not deploy approval.",
  "Release readiness matrix is not publish approval.",
  "Release readiness matrix is not product readiness.",
  "Release readiness matrix is not proof.",
  "Release readiness matrix is not accepted evidence.",
  "Release readiness matrix is not authority.",
  "Readiness classification is not execution approval.",
  "Matrix fingerprint is not proof.",
  "Matrix fingerprint is not approval.",
  "Product-write, GitHub/Git actuation, live provider calls, source fetch, retrieval expansion, and release/deploy/publish execution remain blocked unless separately approved.",
  "UI, Cockpit, browser-validation-only, public-surface, route IA polish, mobile viewport polish, and read/display-only UI expansion remain Web-last backlog.",
  "`no_next_slice_v0_3_core_sequence_complete_pending_operator_decision`",
];

const forbiddenClassificationTokens = [
  "release_approval",
  "deploy_approval",
  "publish_approval",
  "product_readiness",
  "proof_readiness",
  "authority",
];

for (const requiredPath of [
  docsPath,
  fixturePath,
  smokePath,
  packagePath,
  indexPath,
  selectedAuditSmokePath,
  gitLedgerSmokePath,
  manifestSmokePath,
  proposalSmokePath,
  handoffSmokePath,
  packetSmokePath,
  codexBindingSmokePath,
  dogfoodingSmokePath,
  reconciliationDocsPath,
  selectedAuditDocsPath,
  privacyDocsPath,
  authorityDocsPath,
]) {
  assert.ok(existsSync(requiredPath), `required path must exist: ${requiredPath}`);
}

const docsText = read(docsPath);
const fixture = JSON.parse(read(fixturePath));
const packageJson = JSON.parse(read(packagePath));
const indexText = read(indexPath);
const selectedAuditSmokeText = read(selectedAuditSmokePath);
const oldSmokeTexts = [
  read(gitLedgerSmokePath),
  read(manifestSmokePath),
  read(proposalSmokePath),
  read(handoffSmokePath),
  read(packetSmokePath),
  read(codexBindingSmokePath),
  read(dogfoodingSmokePath),
];

assertFixtureShape();
assertRequiredRowsAndClassifications();
assertRouteBaseline();
assertBlockedAndBacklogBoundaries();
assertAuthorityBoundary();
assertDeterministicFingerprint();
assertDocsAndIndexPointers();
assertCompatibilityGuards();
const changedFileScopeReasonCode = assertChangedFileScope();

console.log(
  JSON.stringify(
    {
      smoke: "release-readiness-matrix-post-868-non-ui-v0-1",
      final_status: "pass",
      matrix_id: fixture.matrix_id,
      matrix_fingerprint: fixture.matrix_fingerprint,
      next_recommended_slice: fixture.next_recommended_slice,
      changed_file_scope_checked: true,
      changed_file_scope_reason_code: changedFileScopeReasonCode,
    },
    null,
    2,
  ),
);

function assertFixtureShape() {
  assert.equal(fixture.matrix_version, matrixVersion);
  assert.equal(fixture.scope, scope);
  assert.equal(fixture.next_recommended_slice, nextRecommendedSlice);
  assert.ok(Array.isArray(fixture.rows), "rows must be an array");
  assert.ok(fixture.rows.length >= requiredRowIds.length);
  assert.equal(packageJson.scripts?.[packageScriptName], packageScriptValue);
  for (const field of executionFalseFields) {
    assert.equal(fixture[field], false, `${field} must be false`);
  }
}

function assertRequiredRowsAndClassifications() {
  const rowIds = new Set(fixture.rows.map((row) => row.row_id));
  for (const rowId of requiredRowIds) {
    assert.ok(rowIds.has(rowId), `matrix row must exist: ${rowId}`);
  }

  const classifications = new Set(fixture.rows.map((row) => row.classification));
  for (const classification of requiredClassifications) {
    assert.ok(
      classifications.has(classification),
      `classification must exist: ${classification}`,
    );
  }
  for (const classification of classifications) {
    for (const forbiddenToken of forbiddenClassificationTokens) {
      assert.ok(
        !classification.includes(forbiddenToken),
        `classification must not include ${forbiddenToken}`,
      );
    }
  }
}

function assertRouteBaseline() {
  assert.equal(fixture.route_model_baseline.frozen_by, "github-pr:#868");
  assert.equal(fixture.route_model_baseline.frozen, true);
  const routeRoles = new Map(
    fixture.route_model_baseline.routes.map((route) => [route.path, route.role]),
  );
  assert.equal(routeRoles.get("/"), "public_augnes_surface");
  assert.equal(routeRoles.get("/perspective"), "perspective_detail");
  assert.equal(routeRoles.get("/workbench"), "cockpit_workbench");
  for (const route of fixture.route_model_baseline.routes) {
    assert.equal(route.frozen, true, `${route.path} must be frozen`);
  }
}

function assertBlockedAndBacklogBoundaries() {
  const blocked = new Map(
    fixture.blocked_capabilities.map((entry) => [entry.capability, entry.blocked]),
  );
  for (const capability of requiredBlockedCapabilities) {
    assert.equal(blocked.get(capability), true, `${capability} must remain blocked`);
  }

  const webLast = new Map(
    fixture.web_last_backlog.map((entry) => [entry.item_id, entry.frozen]),
  );
  for (const itemId of requiredWebLastBacklog) {
    assert.equal(webLast.get(itemId), true, `${itemId} must remain Web-last frozen`);
  }

  const reentry = new Map(
    fixture.explicit_reentry_backlog.map((entry) => [entry.item_id, entry.blocked]),
  );
  for (const itemId of requiredExplicitReentry) {
    assert.equal(reentry.get(itemId), true, `${itemId} must remain reentry-blocked`);
  }
}

function assertAuthorityBoundary() {
  const boundary = fixture.authority_boundary;
  for (const field of [
    "matrix_review_only",
    "repo_grounded_public_safe_summaries_only",
    "matrix_static_repo_artifact_only",
    "authority_coverage_verified_by_fixture_fields_and_smoke_assertions_only",
    "skipped_checks_are_review_context_only",
    "known_warnings_are_review_context_only",
    "not_done_items_are_next_planning_cues_only",
    "blocked_capability_remains_blocked",
    "web_last_backlog_remains_frozen",
    "explicit_reentry_backlog_remains_blocked",
  ]) {
    assert.equal(boundary[field], true, `authority boundary ${field} must be true`);
  }
  for (const field of [
    "release_readiness_matrix_is_release_approval",
    "release_readiness_matrix_is_deploy_approval",
    "release_readiness_matrix_is_publish_approval",
    "release_readiness_matrix_is_product_readiness",
    "release_readiness_matrix_is_proof",
    "release_readiness_matrix_is_accepted_evidence",
    "release_readiness_matrix_is_authority",
    "callable_runtime_phrase_blocker_added",
    "readiness_classification_is_execution_approval",
    "matrix_fingerprint_is_proof",
    "matrix_fingerprint_is_approval",
    "smoke_pass_is_evidence",
    "ci_pass_is_authority",
    "validation_pass_is_approval",
    "validation_failure_is_rejection",
    "next_recommended_slice_is_execution_approval",
  ]) {
    assert.equal(boundary[field], false, `authority boundary ${field} must be false`);
  }
  assert.equal(fixture.readiness_summary.route_model_frozen, true);
  assert.equal(
    fixture.readiness_summary.non_ui_sequence_implemented_as_repo_artifacts,
    true,
  );
  assert.equal(fixture.readiness_summary.review_only_no_release_execution, true);
  assert.equal(fixture.readiness_summary.blocked_capabilities_remain_blocked, true);
  assert.equal(fixture.readiness_summary.web_last_backlog_remains_frozen, true);
  assert.equal(
    fixture.readiness_summary.next_recommended_slice_requires_operator_decision,
    true,
  );
  assert.equal(fixture.readiness_summary.product_readiness_claimed, false);
  assert.equal(fixture.readiness_summary.release_approval_claimed, false);
  assert.equal(fixture.readiness_summary.proof_evidence_readiness_claimed, false);
  assert.equal(fixture.readiness_summary.market_user_readiness_claimed, false);
  assert.equal(fixture.readiness_summary.deployability_claimed, false);
}

function assertDeterministicFingerprint() {
  const expected = fingerprintFixture(fixture);
  assert.equal(
    fixture.matrix_fingerprint,
    expected,
    "matrix fingerprint must match canonical fixture content",
  );
  assert.equal(fixture.authority_boundary.matrix_fingerprint_is_proof, false);
  assert.equal(fixture.authority_boundary.matrix_fingerprint_is_approval, false);
}

function assertDocsAndIndexPointers() {
  for (const phrase of requiredDocsPhrases) {
    assert.ok(
      includesNormalized(docsText, phrase),
      `docs must include required phrase: ${phrase}`,
    );
  }
  for (const pointer of [docsPath, fixturePath, smokePath]) {
    assert.ok(indexText.includes(pointer), `latest index must include ${pointer}`);
  }
  assert.ok(indexText.includes(packageScriptName), "latest index must include package script");
}

function assertCompatibilityGuards() {
  for (const pointer of newSliceFiles) {
    assert.ok(
      selectedAuditSmokeText.includes(pointer),
      `selected runtime audit smoke guard must include ${pointer}`,
    );
    for (const smokeText of oldSmokeTexts) {
      assert.ok(
        smokeText.includes(pointer),
        `older exact changed-file guard must include ${pointer}`,
      );
    }
  }
  for (const smokeText of [selectedAuditSmokeText, ...oldSmokeTexts]) {
    assert.doesNotMatch(
      smokeText,
      /release-readiness.*\*\*/i,
      "compatibility guards must not become broad future-slice allowlists",
    );
  }
}

function assertChangedFileScope() {
  const changedFiles = getChangedFiles();
  const boundaryMode = getBoundarySmokeMode();
  if (changedFiles.length === 0) {
    assert.ok(
      isCleanMergedMainTree(),
      "changed-file scope must inspect a non-empty delta unless clean merged-main mode applies",
    );
    return "post_merge_clean_tree_no_changed_file_delta";
  }
  if (boundaryMode === "content-only") {
    return "changed_file_scope_skipped_content_only";
  }
  for (const filePath of changedFiles) {
    assert.ok(expectedChangedFiles.has(filePath), `Unexpected changed file: ${filePath}`);
    assert.ok(!filePath.startsWith("components/"), `No component files allowed: ${filePath}`);
    assert.ok(!filePath.startsWith("app/"), `No route files allowed: ${filePath}`);
    assert.ok(!filePath.includes("/migrations/"), `No migration files allowed: ${filePath}`);
    if (filePath.startsWith("lib/")) {
      assert.ok(
        allowedRepairRuntimeFiles.has(filePath),
        `No runtime helper files allowed outside targeted repair paths: ${filePath}`,
      );
    }
    assert.ok(!filePath.startsWith("types/"), `No runtime type files allowed: ${filePath}`);
  }
  for (const requiredPath of newSliceFiles) {
    assert.ok(changedFiles.includes(requiredPath), `changed files must include ${requiredPath}`);
  }
  return "changed_file_scope_checked";
}

function getBoundarySmokeMode() {
  const mode = process.env.AUGNES_BOUNDARY_SMOKE_MODE || "scoped";
  assert.ok(
    ["scoped", "content-only"].includes(mode),
    `AUGNES_BOUNDARY_SMOKE_MODE must be unset, scoped, or content-only; received ${JSON.stringify(mode)}`,
  );
  return mode;
}

function getChangedFiles() {
  const candidates = new Set();
  for (const args of [
    ["diff", "--name-only", "origin/main...HEAD"],
    ["diff", "--name-only"],
    ["diff", "--cached", "--name-only"],
    ["ls-files", "--others", "--exclude-standard"],
  ]) {
    const output = execFileSync("git", args, { encoding: "utf8" }).trim();
    for (const line of output.split(/\r?\n/)) {
      if (line.trim()) candidates.add(line.trim());
    }
  }
  return [...candidates].sort();
}

function isCleanMergedMainTree() {
  return (
    gitOutput(["status", "--short"]) === "" &&
    gitOutput(["diff", "--name-only"]) === "" &&
    gitOutput(["diff", "--cached", "--name-only"]) === "" &&
    gitOutput(["ls-files", "--others", "--exclude-standard"]) === "" &&
    isHeadOnMainOrCurrentMain()
  );
}

function isHeadOnMainOrCurrentMain() {
  const head = gitOutput(["rev-parse", "HEAD"]);
  const branch = gitOutput(["branch", "--show-current"]);
  if (branch === "main") return true;
  for (const ref of ["main", "refs/heads/main", "origin/main", "refs/remotes/origin/main"]) {
    if (gitOutputOrNull(["rev-parse", "--verify", ref]) === head) return true;
  }
  return false;
}

function gitOutput(args) {
  return execFileSync("git", args, { encoding: "utf8" }).trim();
}

function gitOutputOrNull(args) {
  try {
    return gitOutput(args);
  } catch {
    return null;
  }
}

function fingerprintFixture(value) {
  const copy = structuredClone(value);
  copy.matrix_fingerprint = "";
  return `sha256:${createHash("sha256").update(canonicalJson(copy)).digest("hex")}`;
}

function canonicalJson(value) {
  if (Array.isArray(value)) {
    return `[${value.map((entry) => canonicalJson(entry)).join(",")}]`;
  }
  if (value && typeof value === "object") {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

function includesNormalized(source, phrase) {
  return source.replace(/\s+/g, " ").includes(phrase.replace(/\s+/g, " "));
}

function read(path) {
  return readFileSync(path, "utf8");
}
