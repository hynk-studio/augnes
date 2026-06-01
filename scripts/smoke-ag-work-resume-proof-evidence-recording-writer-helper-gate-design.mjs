import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

const designPath =
  "docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECORDING_WRITER_HELPER_GATE_DESIGN_V0_1.md";
const bridgeSchemaPath =
  "docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECORDING_BRIDGE_TABLE_SCHEMA_DESIGN_V0_1.md";
const bridgeMigrationPolicyPath =
  "docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECORDING_BRIDGE_TABLE_MIGRATION_POLICY_V0_1.md";
const schemaIntegrationPolicyPath =
  "docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECORDING_SCHEMA_INTEGRATION_POLICY_V0_1.md";
const actualRecordingGateDesignPath =
  "docs/AG_WORK_RESUME_ACTUAL_PROOF_EVIDENCE_RECORDING_GATE_DESIGN_V0_1.md";
const closeoutPath =
  "docs/AG_WORK_RESUME_CROSS_LOCAL_CONTINUITY_REVIEW_METADATA_CLOSEOUT_V0_1.md";
const authorityGatePath =
  "docs/AG_WORK_RESUME_MAPPING_IMPORT_AUTHORITY_GATE_V0_1.md";
const sessionCodexGatePath =
  "docs/AG_WORK_RESUME_PROOF_EVIDENCE_SESSION_CODEX_GATES_DESIGN_V0_1.md";
const reconciliationDesignPath =
  "docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_DESIGN_V0_1.md";
const lifecycleDocPath =
  "docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_CANDIDATE_LIFECYCLE_ACTIONS_V0_1.md";
const packagePath = "package.json";
const recommendedScriptPath =
  "scripts/ag-work-resume-proof-evidence-recording-create.mjs";

for (const path of [
  designPath,
  bridgeSchemaPath,
  bridgeMigrationPolicyPath,
  schemaIntegrationPolicyPath,
  actualRecordingGateDesignPath,
  closeoutPath,
  authorityGatePath,
  sessionCodexGatePath,
  reconciliationDesignPath,
  lifecycleDocPath,
  packagePath,
]) {
  assert.equal(existsSync(path), true, `Missing required input: ${path}`);
}

const design = readFileSync(designPath, "utf8");
const bridgeSchema = readFileSync(bridgeSchemaPath, "utf8");
const bridgeMigrationPolicy = readFileSync(bridgeMigrationPolicyPath, "utf8");
const schemaIntegrationPolicy = readFileSync(schemaIntegrationPolicyPath, "utf8");
const actualRecordingGateDesign = readFileSync(
  actualRecordingGateDesignPath,
  "utf8",
);
const closeout = readFileSync(closeoutPath, "utf8");
const authorityGate = readFileSync(authorityGatePath, "utf8");
const sessionCodexGate = readFileSync(sessionCodexGatePath, "utf8");
const reconciliationDesign = readFileSync(reconciliationDesignPath, "utf8");
const lifecycleDoc = readFileSync(lifecycleDocPath, "utf8");
const pkg = JSON.parse(readFileSync(packagePath, "utf8"));
const joinedPointers = [
  bridgeSchema,
  bridgeMigrationPolicy,
  schemaIntegrationPolicy,
  actualRecordingGateDesign,
  closeout,
  authorityGate,
  sessionCodexGate,
  reconciliationDesign,
  lifecycleDoc,
].join("\n");

for (const phrase of [
  "AG Resume Proof/Evidence Recording Writer/Helper Gate Design v0.1",
  "This document is design-only",
  "no runtime behavior",
  "no schema or migration",
  "no writer/helper implementation",
  "no route",
  "no UI",
  "no proof/evidence recording",
  "no bridge rows",
  "no `verification_evidence_records` row creation",
  "no `action_records` row creation",
  "`accepted_for_future_recording` is not proof/evidence recording",
  "Writer/helper gate design is not approval to record",
  "A future writer/helper implementation PR is not blanket approval to record",
  "Actual recording remains separately user/Core gated per exact attempt",
  "The bridge table is not proof/evidence recording by itself",
]) {
  assertIncludes(design, phrase);
}

for (const phrase of [
  "createAgWorkResumeProofEvidenceRecordingFromCandidate",
  "scripts/ag-work-resume-proof-evidence-recording-create.mjs",
  "Future helper name recommendation only",
  "Future local script recommendation only",
  "future recommendations, not implementation in this PR",
]) {
  assertIncludes(design, phrase);
}

if (existsSync(recommendedScriptPath)) {
  assert.equal(
    pkg.scripts?.["ag:resume-proof-evidence-recording-create"],
    "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json scripts/ag-work-resume-proof-evidence-recording-create.mjs",
    "implemented recording script must stay wired through the bounded package helper",
  );
}

for (const phrase of [
  "The future helper takes `candidate_id` as canonical input",
  "`import_id` and `mapping_id` only as optional cross-checks",
  "helper should derive the canonical idempotency key",
  "approval payload to include or attest to that exact key",
  "Re-read candidate, imported context, confirmed mapping, and local target\n   work identity",
  "same local transaction",
  "insert exactly one `verification_evidence_records` row",
  "insert exactly one `ag_work_resume_proof_evidence_recording_links` row",
]) {
  assertIncludes(design, phrase);
}

for (const phrase of [
  "one `verification_evidence_records` row",
  "one `ag_work_resume_proof_evidence_recording_links` row",
  "`action_records` row count does not change",
  "action records are out of first implementation scope",
  "route/UI out of scope",
  "session binding and Codex continuation remain out of scope",
  "approval/publish/retry/replay/merge remains out of scope",
]) {
  assertIncludes(design, phrase);
}

for (const result of [
  "idempotent_no_new_write",
  "invalid_candidate",
  "unsafe_redaction",
  "missing_source_rows",
  "fk_or_unique_failure",
  "duplicate_conflict",
  "unauthorized_attempt",
]) {
  assertIncludes(design, result);
}

for (const phrase of [
  "verification_evidence_records.metadata",
  "Bridge Row Shape",
  "`provenance_json` Shape",
  "target_action_id` | `NULL`",
  "failure_reason` | `NULL`",
  "foreign_summary_user_core_attested",
  "raw_foreign_payload_copied",
  "local target scope and work id",
  "local `work_items(scope, work_id)` row must already exist",
  "The helper must not create a work item",
]) {
  assertIncludes(design, phrase);
}

for (const phrase of [
  "The exact allowed insert tables for the first implementation are:",
  "`verification_evidence_records`",
  "`ag_work_resume_proof_evidence_recording_links`",
  "The future implementation must not insert, update, or delete rows in:",
  "`action_records`",
  "`work_items`",
  "`work_events`",
  "`ag_work_resume_imported_contexts`",
  "`ag_work_resume_confirmed_mappings`",
  "`ag_work_resume_mapping_proposals`",
  "`ag_work_resume_proof_evidence_reconciliation_candidates`",
]) {
  assertIncludes(design, phrase);
}

for (const phrase of [
  "Smoke Expectations",
  "writer/helper gate design doc exists",
  "recommended helper/script names are mentioned only as future recommendations",
  "future implementation allowed inserts are exactly one verification evidence\n  row plus one bridge row",
  "no runtime/schema/migration/writer/helper/route/UI/browser files changed",
  "DB Proof Expectations For Later Implementation PRs",
  "Browser verification skipped",
]) {
  assertIncludes(design, phrase);
}

assert.equal(
  pkg.scripts?.[
    "smoke:ag-work-resume-proof-evidence-recording-writer-helper-gate-design"
  ],
  "node scripts/smoke-ag-work-resume-proof-evidence-recording-writer-helper-gate-design.mjs",
  "package.json should register the writer/helper gate design smoke",
);

assert.ok(
  joinedPointers.includes(designPath),
  "AG Resume pointer docs should reference the writer/helper gate design doc",
);

const changedFiles = gitChangedFiles();
const allowedChangedFiles = new Set([
  designPath,
  bridgeSchemaPath,
  bridgeMigrationPolicyPath,
  schemaIntegrationPolicyPath,
  actualRecordingGateDesignPath,
  closeoutPath,
  authorityGatePath,
  sessionCodexGatePath,
  reconciliationDesignPath,
  lifecycleDocPath,
  packagePath,
  "docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECORDING_ROUTE_GATE_DESIGN_V0_1.md",
  "lib/ag-work-resume-proof-evidence-recording.ts",
  "scripts/ag-work-resume-proof-evidence-recording-create.mjs",
  "scripts/smoke-ag-work-resume-proof-evidence-recording-writer-helper.mjs",
  "scripts/smoke-ag-work-resume-proof-evidence-recording-route-gate-design.mjs",
  "scripts/smoke-ag-work-resume-proof-evidence-recording-writer-helper-gate-design.mjs",
  "scripts/smoke-ag-work-resume-proof-evidence-recording-bridge-table-schema.mjs",
  "scripts/smoke-ag-work-resume-proof-evidence-recording-bridge-table-migration-policy.mjs",
  "scripts/smoke-ag-work-resume-proof-evidence-recording-bridge-table-schema-design.mjs",
  "scripts/smoke-ag-work-resume-proof-evidence-recording-schema-integration-policy.mjs",
  "scripts/smoke-ag-work-resume-actual-proof-evidence-recording-gate-design.mjs",
  "scripts/smoke-ag-work-resume-review-metadata-closeout.mjs",
  "scripts/smoke-ag-work-resume-proof-evidence-session-codex-gates-design.mjs",
  "scripts/smoke-ag-work-resume-proof-evidence-reconciliation-design.mjs",
  "scripts/smoke-ag-work-resume-proof-evidence-reconciliation-candidate-lifecycle-action.mjs",
  "scripts/smoke-ag-work-resume-proof-evidence-reconciliation-candidate-lifecycle-action-cockpit-panel.mjs",
]);
const unexpectedChangedFiles = changedFiles.filter(
  (file) => !allowedChangedFiles.has(file),
);
assert.deepEqual(
  unexpectedChangedFiles,
  [],
  "writer/helper gate design PR should be limited to docs, package script, and smoke guards",
);

const forbiddenChangedPrefixes = [
  "app/",
  "app/api/",
  "components/",
  "pages/",
  "public/",
  "migrations/",
  "db/",
  "apps/",
  "reports/browser/",
];
const runtimeSchemaOrBrowserChanged = changedFiles.filter((file) =>
  forbiddenChangedPrefixes.some((prefix) => file.startsWith(prefix)) ||
  (file.startsWith("lib/") &&
    file !== "lib/ag-work-resume-proof-evidence-recording.ts"),
);
assert.deepEqual(
  runtimeSchemaOrBrowserChanged,
  [],
  "writer/helper implementation PR must not change runtime/schema/migration/route/UI/browser files outside the scoped writer helper",
);

console.log(
  JSON.stringify(
    {
      smoke: "ag-work-resume-proof-evidence-recording-writer-helper-gate-design",
      design_doc_exists: true,
      design_only_boundary: true,
      future_recommendation_names_only: true,
      accepted_for_future_recording_not_recording: true,
      per_attempt_user_core_gate_required: true,
      allowed_future_inserts:
        "exactly one verification_evidence_records row plus one bridge row",
      action_records_out_of_first_implementation_scope: true,
      route_ui_out_of_scope: true,
      session_binding_codex_continuation_out_of_scope: true,
      approval_publish_retry_replay_merge_out_of_scope: true,
      changed_files_limited_to_docs_package_scoped_writer_helper_smokes: true,
    },
    null,
    2,
  ),
);

function gitChangedFiles() {
  return [
    ...new Set([
      ...gitLinesAllowFailure(["diff", "--name-only", "origin/main...HEAD"]),
      ...gitLines(["diff", "--name-only"]),
      ...gitLines(["diff", "--cached", "--name-only"]),
      ...gitLines(["ls-files", "--others", "--exclude-standard"]),
    ]),
  ];
}

function gitLines(args) {
  return execFileSync("git", args, { encoding: "utf8" })
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function gitLinesAllowFailure(args) {
  try {
    return gitLines(args);
  } catch {
    return [];
  }
}

function assertIncludes(value, expected) {
  assert.equal(
    value.includes(expected),
    true,
    `Expected writer/helper design content to include: ${expected}`,
  );
}
