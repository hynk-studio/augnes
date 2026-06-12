import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

const packageFile = "package.json";
const docFile =
  "docs/PERSPECTIVE_CODEX_FORMER_LOCAL_ADAPTER_VALIDATE_ORCHESTRATION_DESIGN_V0_1.md";
const reportFile =
  "reports/2026-06-11-perspective-codex-former-local-adapter-validate-orchestration-design.md";
const smokeFile =
  "scripts/smoke-perspective-codex-former-local-adapter-validate-orchestration-design.mjs";
const prepareExecutionDesignDocFile =
  "docs/PERSPECTIVE_CODEX_FORMER_LOCAL_ADAPTER_PREPARE_EXECUTION_DESIGN_V0_1.md";
const prepareExecutionDocFile =
  "docs/PERSPECTIVE_CODEX_FORMER_LOCAL_ADAPTER_PREPARE_EXECUTION_V0_1.md";
const prepareOutputSnapshotsDocFile =
  "docs/PERSPECTIVE_CODEX_FORMER_LOCAL_ADAPTER_PREPARE_OUTPUT_SNAPSHOTS_V0_1.md";
const manualWorkflowDocFile =
  "docs/PERSPECTIVE_CODEX_FORMER_MANUAL_WORKFLOW_V0_1.md";
const captureHelperFile = "scripts/perspective-codex-former-capture-helper.mjs";
const expectedTsxCommand =
  "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json";

const packageJson = JSON.parse(readFileSync(packageFile, "utf8"));
const docText = readFileSync(docFile, "utf8");
const reportText = readFileSync(reportFile, "utf8");
const smokeText = readFileSync(smokeFile, "utf8");
const publicText = `${docText}\n${reportText}`;

assertPackageScript();
assertFilesExist();
assertReturnedEnvelopeContract();
assertCandidateCountRule();
assertProvenanceChecks();
assertDryRunAndExecutionBoundaries();
assertResultStateSemantics();
assertWarningsAndGuidance();
assertFutureSnapshotAndUiPath();
assertAuthorityBoundary();
assertNoForbiddenImplementationSurfaces();
assertChangedFileBoundary();

console.log(
  "PASS smoke:perspective-codex-former-local-adapter-validate-orchestration-design",
);

function assertPackageScript() {
  assert.equal(
    packageJson.scripts[
      "smoke:perspective-codex-former-local-adapter-validate-orchestration-design"
    ],
    `${expectedTsxCommand} ${smokeFile}`,
    "package.json must register the validate orchestration design smoke",
  );
}

function assertFilesExist() {
  for (const file of [
    packageFile,
    docFile,
    reportFile,
    smokeFile,
    prepareExecutionDesignDocFile,
    prepareExecutionDocFile,
    prepareOutputSnapshotsDocFile,
    manualWorkflowDocFile,
    captureHelperFile,
  ]) {
    assert.equal(existsSync(file), true, `${file} must exist`);
  }
}

function assertReturnedEnvelopeContract() {
  assertIncludesAll(publicText, [
    "Returned Candidate Envelope Input Contract",
    "REAL TRANSCRIPT CAPTURE AFTER MANUAL COPY PACKET",
    "RETURNED_CODEX_RESPONSE",
    "END RETURNED_CODEX_RESPONSE",
    "candidate envelope JSON shape",
    "Candidate Envelope JSON Shape",
    "CodexPerspectiveCandidateDraft",
    "CodexPerspectiveCandidateDraftV0",
    "codex_perspective_candidate_draft.v0.1",
    "codex_perspective_candidate_draft",
    "source_former_input_packet",
    "thesis",
    "selected_material",
    "evidence_pointer_refs",
    "unresolved_tensions",
    "basis_quality_suggestion",
    "next_action_candidates",
    "user_core_decision_questions",
    "qualification_notes",
    "privacy_flags",
    "authority_flags",
    "forbidden_actions",
    "source_manual_copy_packet_id` and `source_prompt_hash` are envelope/helper metadata provenance fields, not required candidate draft fields",
    "candidate.source_former_input_packet.packet_id",
    "prompt_file_sha256 is prompt artifact byte hash",
    "Returned candidate content must not be treated as trusted runtime state.",
    "returned_candidate_treated_as_trusted_runtime_state: false",
    "Candidate content remains untrusted",
    "Validation summary must be review-only.",
  ]);
  assert.equal(
    publicText.includes('"draft_kind": "CodexPerspectiveCandidateDraft"'),
    false,
    "design must not use the old pseudo draft_kind",
  );
  assert.equal(
    publicText.includes('"draft_version": "v0.1"'),
    false,
    "design must not use the old pseudo draft_version",
  );
}

function assertCandidateCountRule() {
  assertIncludesAll(publicText, [
    "Candidate Count Rule",
    "`candidate_count` must be exactly one.",
    "Validation must be `BLOCKED` when `candidate_count` is zero, greater than one, unknown, unparsable",
    "The adapter must not choose a best candidate",
    "candidate_count",
  ]);
}

function assertProvenanceChecks() {
  assertIncludesAll(publicText, [
    "Provenance And Metadata Matching",
    "Prepare Execution Summary Relationship",
    "metadata/provenance matching against source input and prepare execution summary",
    "source_manual_copy_packet_id check",
    "former_input_packet_id check",
    "source_prompt_hash check",
    "prompt_file_sha256 check",
    "source_manual_copy_packet_id_match",
    "former_input_packet_id_match",
    "source_prompt_hash_match",
    "prompt_file_sha256",
    "prompt_file_sha256_match",
    "source_prompt_hash is envelope/helper metadata provenance",
    "prompt_file_sha256 is prompt artifact byte hash",
    "prepare execution summary",
    "source input",
    "helper metadata",
    "Any mismatch blocks validation.",
  ]);
}

function assertDryRunAndExecutionBoundaries() {
  assertIncludesAll(publicText, [
    "Validate Dry-Run Command Plan",
    "--dry-run --source-input <path>",
    "ready_for_validate_execution",
    "blocked_before_validate_execution",
    "Validate Execution Command Plan",
    "--execute --source-input <path>",
    "`--execute` and `--dry-run` must not be allowed together.",
    "Dry-run should",
    "Execution should",
    "Future dry-run should",
    "Future execution should",
  ]);
}

function assertResultStateSemantics() {
  assertIncludesAll(publicText, [
    "Result State Semantics",
    "PASS",
    "PASS with follow-up",
    "BLOCKED",
    "`PASS` must not mean approval, acceptance, mergeability, product readiness, Core decision, review decision",
    "`PASS with follow-up` must remain review material only.",
    "`BLOCKED` must remain a validation result, not an automated product decision.",
    "validation is not a review decision",
    "Validation summary is local review material only.",
  ]);
}

function assertWarningsAndGuidance() {
  assertIncludesAll(publicText, [
    "Warning Handling",
    "Pointer-Warning Handling",
    "pointer warnings",
    "Pointer warnings must be represented without turning pointer targets into trusted authority.",
    "target_material_trusted",
    "target_material_loaded",
    "candidate-compatible review material",
    "Candidate-Compatible Review Material",
    "Worker-Facing Guidance Connection",
    "Worker-Facing Guidance may run only after direct validation produces candidate-compatible review material.",
    "Worker-Facing Guidance is advisory-only.",
  ]);
}

function assertFutureSnapshotAndUiPath() {
  assertIncludesAll(publicText, [
    "Future Validate Result Snapshots",
    "Future Read-Only Validate UI",
    "future validate result snapshots",
    "future read-only validate UI",
    "The future UI must remain read-only until a later accepted-state/persistence design exists.",
    "read-only Session Panel",
    "Capture Review Inbox",
  ]);
}

function assertAuthorityBoundary() {
  assertIncludesAll(publicText, [
    "Authority Boundary",
    "no accepted state",
    "no review decision",
    "no DB",
    "no network",
    "no provider/model API",
    "no Codex call",
    "no Codex SDK",
    "no GitHub mutation",
    "no Core decision",
    "no proof/evidence/readiness records",
    "no persistence",
    "no surface export",
    "no clipboard automation",
    "no runtime fixture mutation",
    "no automatic promotion",
  ]);
}

function assertNoForbiddenImplementationSurfaces() {
  for (const snippet of [
    ["fetch", "("].join(""),
    ["XML", "Http", "Request"].join(""),
    ["responses", "create"].join("."),
    ["openai", "chat"].join("."),
    ["navigator", "clipboard"].join("."),
    ["better", "sqlite3"].join("-"),
    ["createClient", "("].join(""),
    ["graphql", "("].join(""),
    ["record", "Proof"].join(""),
    ["create", "Evidence"].join(""),
    ["commit", "State", "Update"].join(""),
  ]) {
    assert.equal(
      smokeText.includes(snippet),
      false,
      `smoke implementation must not introduce forbidden runtime surface ${snippet}`,
    );
  }
  assertIncludesAll(publicText, [
    "no validate orchestration implementation",
    "no validate execution CLI behavior",
    "no UI",
    "no route",
    "no browser-visible surface",
    "no runtime fixture mutation",
    "no DB write",
    "no network call",
    "no provider/model API call",
    "no Codex call",
    "no Codex SDK call",
    "no GitHub mutation",
    "no Core decision",
    "no proof/evidence/readiness records",
    "no persistence",
    "no surface export",
    "no clipboard automation",
    "no accepted state",
    "no review decision",
    "no automatic promotion",
  ]);
}

function assertChangedFileBoundary() {
  const allowedChangedFiles = new Set([
    packageFile,
    docFile,
    reportFile,
    smokeFile,
  ]);
  for (const changedFile of collectChangedFiles()) {
    assert(
      allowedChangedFiles.has(changedFile),
      `validate orchestration design changed an out-of-scope file: ${changedFile}`,
    );
    assert(
      changedFile === packageFile ||
        changedFile.startsWith("docs/") ||
        changedFile.startsWith("reports/") ||
        changedFile.startsWith("scripts/"),
      `validate orchestration design must stay docs/report/smoke/package only: ${changedFile}`,
    );
  }
}

function collectChangedFiles() {
  return [
    ...new Set([
      ...gitLines(["diff", "--name-only", "--diff-filter=ACMR", "HEAD"]),
      ...gitLines(["diff", "--cached", "--name-only", "--diff-filter=ACMR"]),
      ...gitLines(["diff", "--name-only", "--diff-filter=ACMR", "origin/main...HEAD"]),
      ...gitLines(["ls-files", "--others", "--exclude-standard"]),
    ]),
  ].sort();
}

function gitLines(args) {
  return execFileSync("git", args, { encoding: "utf8" })
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function assertIncludesAll(text, expectedSnippets) {
  for (const snippet of expectedSnippets) {
    assert(
      text.includes(snippet),
      `expected text to include ${JSON.stringify(snippet)}`,
    );
  }
}
