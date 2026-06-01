import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

const bridgeDesignPath =
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
const schemaPath = "lib/db/schema.sql";

for (const path of [
  bridgeDesignPath,
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

const bridgeDesign = readFileSync(bridgeDesignPath, "utf8");
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
  schemaIntegrationPolicy,
  actualRecordingGateDesign,
  closeout,
  authorityGate,
  sessionCodexGate,
  reconciliationDesign,
  lifecycleDoc,
].join("\n");

for (const phrase of [
  "AG Resume Proof/Evidence Recording Bridge Table Schema Design v0.1",
  "This document is design-only",
  "adds no runtime behavior",
  "adds no schema or migration",
  "modifies no `lib/db/schema.sql`",
  "adds no writer, helper, route, UI",
  "The bridge table is not proof/evidence recording by itself",
  "A bridge schema design is not approval to record",
  "A future schema/migration PR is not approval to record",
  "Actual proof/evidence recording remains separately user/Core gated",
  "`accepted_for_future_recording` is not proof/evidence recording",
  "ag_work_resume_proof_evidence_recording_links",
  "Proposed Columns",
  "Unique Constraints",
  "Indexes",
  "Foreign Key Policy",
  "Cascade/Delete Policy",
  "Idempotency Key Policy",
  "one `verification_evidence_records` row",
  "Action records are out of first implementation scope unless separately approved",
  "Approval/publish/retry/replay/merge remains out of scope",
  "Session binding and Codex continuation remain out of scope",
  "Browser verification skipped",
]) {
  assertIncludes(bridgeDesign, phrase);
}

for (const column of [
  "recording_link_id",
  "candidate_id",
  "import_id",
  "mapping_id",
  "local_target_scope",
  "local_target_work_id",
  "target_record_kind",
  "target_evidence_id",
  "target_action_id",
  "idempotency_key",
  "actor",
  "reason",
  "redaction_summary",
  "trust_provenance_label",
  "provenance_json",
  "recording_status",
  "failure_reason",
  "created_at",
  "updated_at",
]) {
  assertIncludes(bridgeDesign, `\`${column}\``);
}

for (const phrase of [
  "Decision: one candidate can have more than one recording link? No.",
  "Decision: can one idempotency key map to more than one link? No.",
  "Decision: must `target_evidence_id` be unique? Yes.",
  "Decision: must candidate_id be unique for the first implementation? Yes.",
  "Decision: are action records excluded from the first implementation? Yes.",
  "Imported context, confirmed mapping, and candidate rows are never mutated by bridge behavior.",
  "There are no pending bridge rows in the first implementation.",
  "target_evidence_id` is required and non-null",
  "target_action_id` must be `NULL`",
]) {
  assertIncludes(bridgeDesign, phrase);
}

for (const phrase of [
  "unique `candidate_id`",
  "unique `idempotency_key`",
  "unique `target_evidence_id`",
  "No cascade deletes",
  "deleting a candidate with a bridge row must fail",
  "deleting a verification evidence row with a bridge row must fail",
  "same payload may return an idempotent no-new-write result",
  "Same key with different payload must fail closed",
  "Same candidate with a different key must fail closed",
]) {
  assertIncludes(bridgeDesign, phrase);
}

for (const phrase of [
  "references `ag_work_resume_imported_contexts(import_id)`",
  "references `ag_work_resume_confirmed_mappings(mapping_id)`",
  "references\n  `verification_evidence_records(evidence_id)`",
  "references `action_records(id)` only in a later design",
]) {
  assertIncludes(bridgeDesign, phrase);
}

for (const phrase of [
  "no runtime behavior",
  "no schema or migration",
  "no `lib/db/schema.sql` modification",
  "no writer, helper, route, or UI",
  "no browser report",
  "no proof/evidence recording",
  "no `verification_evidence_records` row creation",
  "no `action_records` row creation",
  "no session binding",
  "no Codex execution or continuation",
  "no work item creation",
  "no work event creation",
  "no imported context mutation",
  "no confirmed mapping mutation",
  "no proposal mutation",
  "no reconciliation candidate mutation",
  "no approval, publish, retry, replay, merge, auto-merge, external posting",
]) {
  assertIncludes(bridgeDesign, phrase);
}

assert.equal(
  pkg.scripts?.[
    "smoke:ag-work-resume-proof-evidence-recording-bridge-table-schema-design"
  ],
  "node scripts/smoke-ag-work-resume-proof-evidence-recording-bridge-table-schema-design.mjs",
  "package.json should register the bridge table schema design smoke",
);

assert.ok(
  joinedPointers.includes(bridgeDesignPath),
  "AG Resume pointer docs should reference the bridge table schema design doc",
);

const changedFiles = gitChangedFiles();
const allowedChangedFiles = new Set([
  bridgeDesignPath,
  bridgeMigrationPolicyPath,
  schemaIntegrationPolicyPath,
  actualRecordingGateDesignPath,
  closeoutPath,
  authorityGatePath,
  sessionCodexGatePath,
  reconciliationDesignPath,
  lifecycleDocPath,
  schemaPath,
  "package.json",
  "docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECORDING_WRITER_HELPER_GATE_DESIGN_V0_1.md",
  "lib/ag-work-resume-proof-evidence-recording.ts",
  "scripts/ag-work-resume-proof-evidence-recording-create.mjs",
  "scripts/smoke-ag-work-resume-proof-evidence-recording-writer-helper.mjs",
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
  "bridge table schema design PR should be limited to docs, package script, and smoke guards",
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
    file !== schemaPath &&
    file !== "lib/ag-work-resume-proof-evidence-recording.ts"),
);
assert.deepEqual(
  runtimeSchemaOrBrowserChanged,
  [],
  "bridge table schema follow-up should not change runtime/migration/route/UI/browser files outside schema.sql and the scoped writer helper",
);

console.log(
  JSON.stringify(
    {
      smoke: "ag-work-resume-proof-evidence-recording-bridge-table-schema-design",
      bridge_design_doc_exists: true,
      design_only_boundary: true,
      proposed_table_name: "ag_work_resume_proof_evidence_recording_links",
      required_columns_listed: true,
      unique_index_fk_cascade_policy_described: true,
      first_target: "verification_evidence_records",
      action_records_out_of_first_scope: true,
      accepted_for_future_recording_not_recording: true,
      actual_recording_separately_user_core_gated: true,
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
    `Expected bridge design content to include: ${expected}`,
  );
}
