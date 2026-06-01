import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";

const migrationPolicyPath =
  "docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECORDING_BRIDGE_TABLE_MIGRATION_POLICY_V0_1.md";
const bridgeDesignPath =
  "docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECORDING_BRIDGE_TABLE_SCHEMA_DESIGN_V0_1.md";
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

for (const inputPath of [
  migrationPolicyPath,
  bridgeDesignPath,
  schemaIntegrationPolicyPath,
  actualRecordingGateDesignPath,
  closeoutPath,
  authorityGatePath,
  sessionCodexGatePath,
  reconciliationDesignPath,
  lifecycleDocPath,
  packagePath,
  schemaPath,
]) {
  assert.equal(existsSync(inputPath), true, `Missing required input: ${inputPath}`);
}

const migrationPolicy = readFileSync(migrationPolicyPath, "utf8");
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
const schemaSql = readFileSync(schemaPath, "utf8");
const joinedPointers = [
  bridgeDesign,
  schemaIntegrationPolicy,
  actualRecordingGateDesign,
  closeout,
  authorityGate,
  sessionCodexGate,
  reconciliationDesign,
  lifecycleDoc,
].join("\n");

for (const phrase of [
  "AG Resume Proof/Evidence Recording Bridge Table Migration/DDL Policy v0.1",
  "This migration/DDL policy was introduced as design-only",
  "The schema-only\nimplementation follow-up may add the documented empty bridge table and indexes",
  "The migration/DDL policy is not approval to record",
  "A schema/migration PR is not approval to record",
  "The bridge table is not proof/evidence recording by itself",
  "Actual proof/evidence recording remains separately user/Core gated",
  "`accepted_for_future_recording` is not proof/evidence recording",
  "ag_work_resume_proof_evidence_recording_links",
  "Schema-Only Implementation Status",
  "npm run smoke:ag-work-resume-proof-evidence-recording-bridge-table-schema",
  "Exact Proposed CREATE TABLE DDL",
  "CREATE TABLE IF NOT EXISTS ag_work_resume_proof_evidence_recording_links",
  "Proposed Index DDL",
  "Foreign Key Feasibility",
  "FK Fallback Policy",
  "No-Cascade/Delete Restrict Policy",
  "JSON Text Validation Expectations",
  "Diff Boundary For Later Schema/Migration PR",
  "Rollback/Backout Policy",
  "Later PR Proof Requirements",
  "Browser verification skipped",
]) {
  assertIncludes(migrationPolicy, phrase);
}

for (const ddlToken of [
  "recording_link_id TEXT PRIMARY KEY",
  "record_kind = 'ag_work_resume_proof_evidence_recording_link'",
  "schema = 'augnes.ag_work_resume_proof_evidence_recording_link.v0_1'",
  "target_record_kind = 'verification_evidence'",
  "target_action_id TEXT CHECK (target_action_id IS NULL)",
  "recording_status = 'recorded'",
  "failure_reason TEXT CHECK (failure_reason IS NULL)",
  "CHECK (updated_at = created_at)",
  "ON DELETE RESTRICT",
  "ON UPDATE RESTRICT",
]) {
  assertIncludes(migrationPolicy, ddlToken);
}

for (const phrase of [
  "idx_ag_recording_links_candidate_unique",
  "idx_ag_recording_links_idempotency_unique",
  "idx_ag_recording_links_target_evidence_unique",
  "idx_ag_recording_links_import_time",
  "idx_ag_recording_links_mapping_time",
  "idx_ag_recording_links_local_target_time",
  "idx_ag_recording_links_status_time",
  "idx_ag_recording_links_actor_time",
  "idx_ag_recording_links_trust_label_time",
]) {
  assertIncludes(migrationPolicy, phrase);
}

for (const phrase of [
  "unique `candidate_id`",
  "unique `idempotency_key`",
  "unique `target_evidence_id`",
  "No pending placeholder rows are allowed",
  "Action records are out of first implementation scope",
  "No `target_action_id` foreign key is proposed",
  "same future transaction as the target",
  "bridge row must never be created\nbefore target evidence exists",
  "If evidence-row creation fails, there must be no bridge row",
]) {
  assertIncludes(migrationPolicy, phrase);
}

for (const phrase of [
  "No runtime behavior",
  "schema table/indexes only",
  "no migration files",
  "no writer/helper/route/UI",
  "no proof/evidence recording",
  "no `verification_evidence_records` row creation",
  "no `action_records` row creation",
  "no bridge row creation",
  "no session binding",
  "no Codex execution or continuation",
  "no work item/event creation",
  "no imported context mutation",
  "no confirmed mapping mutation",
  "no proposal mutation",
  "no reconciliation candidate mutation",
  "no approval, publish, retry, replay, merge, auto-merge, external posting",
  "Approval/publish/retry/replay/merge remains out of scope",
  "Session binding and\nCodex continuation remain out of scope",
]) {
  assertIncludes(migrationPolicy, phrase);
}

assert.equal(
  pkg.scripts?.[
    "smoke:ag-work-resume-proof-evidence-recording-bridge-table-migration-policy"
  ],
  "node scripts/smoke-ag-work-resume-proof-evidence-recording-bridge-table-migration-policy.mjs",
  "package.json should register the bridge table migration policy smoke",
);

assert.equal(
  pkg.scripts?.[
    "smoke:ag-work-resume-proof-evidence-recording-bridge-table-schema"
  ],
  "node scripts/smoke-ag-work-resume-proof-evidence-recording-bridge-table-schema.mjs",
  "package.json should register the bridge table schema smoke",
);

assert.equal(
  schemaSql.includes("CREATE TABLE IF NOT EXISTS ag_work_resume_proof_evidence_recording_links"),
  true,
  "lib/db/schema.sql should implement the bridge table in the schema-only PR",
);

assert.ok(
  joinedPointers.includes(migrationPolicyPath),
  "AG Resume pointer docs should reference the bridge table migration policy doc",
);

const changedFiles = gitChangedFiles();
const allowedChangedFiles = new Set([
  migrationPolicyPath,
  bridgeDesignPath,
  schemaIntegrationPolicyPath,
  actualRecordingGateDesignPath,
  closeoutPath,
  authorityGatePath,
  sessionCodexGatePath,
  reconciliationDesignPath,
  lifecycleDocPath,
  schemaPath,
  packagePath,
  "docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECORDING_ROUTE_GATE_DESIGN_V0_1.md",
  "docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECORDING_WRITER_HELPER_GATE_DESIGN_V0_1.md",
  "lib/ag-work-resume-proof-evidence-recording.ts",
  "scripts/ag-work-resume-proof-evidence-recording-create.mjs",
  "scripts/smoke-ag-work-resume-proof-evidence-recording-writer-helper.mjs",
  "scripts/smoke-ag-work-resume-proof-evidence-recording-route-gate-design.mjs",
  "app/api/ag-work-resume/proof-evidence-recordings/route.ts",
  "scripts/smoke-ag-work-resume-proof-evidence-recording-route.mjs",
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
  "bridge table migration policy PR should be limited to docs, package script, and smoke guards",
);

const migrationFiles = changedFiles.filter(isMigrationFile);
assert.deepEqual(
  migrationFiles,
  [],
  "migration policy PR must not add migration files",
);

const forbiddenChangedPrefixes = [
  "components/",
  "pages/",
  "public/",
  "migrations/",
  "db/",
  "apps/",
  "reports/browser/",
];
const runtimeSchemaOrBrowserChanged = changedFiles.filter(
  (file) =>
    (file.startsWith("app/") &&
      file !== "app/api/ag-work-resume/proof-evidence-recordings/route.ts") ||
    forbiddenChangedPrefixes.some((prefix) => file.startsWith(prefix)) ||
    (file.startsWith("lib/") &&
      file !== schemaPath &&
      file !== "lib/ag-work-resume-proof-evidence-recording.ts"),
);
assert.deepEqual(
  runtimeSchemaOrBrowserChanged,
  [],
  "bridge-table migration follow-up should not change runtime/migration/route/UI/browser files outside the scoped writer helper",
);

console.log(
  JSON.stringify(
    {
      smoke:
        "ag-work-resume-proof-evidence-recording-bridge-table-migration-policy",
      migration_policy_doc_exists: true,
      schema_only_boundary: true,
      proposed_create_table_documented: true,
      schema_sql_implements_bridge_table: true,
      no_migration_files_added: true,
      table_name: "ag_work_resume_proof_evidence_recording_links",
      key_constraints_documented: true,
      indexes_documented: true,
      fk_no_cascade_policy_documented: true,
      no_pending_placeholder_policy_documented: true,
      action_records_out_of_first_scope: true,
      future_schema_migration_pr_not_approval_to_record: true,
      actual_recording_separately_user_core_gated: true,
      accepted_for_future_recording_not_recording: true,
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

function isMigrationFile(file) {
  return (
    file.startsWith("migrations/") ||
    file.startsWith("db/migrations/") ||
    /(^|\/)migrations?\//i.test(file) ||
    /(^|\/)\d{8,}.*\.(?:sql|js|mjs|ts)$/.test(file)
  );
}

function assertIncludes(value, expected) {
  assert.equal(
    value.includes(expected),
    true,
    `Expected migration policy content to include: ${expected}`,
  );
}
