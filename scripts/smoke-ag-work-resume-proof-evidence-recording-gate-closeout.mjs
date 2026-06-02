import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

const closeoutPath =
  "docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECORDING_GATE_CLOSEOUT_V0_1.md";
const browserReportPath =
  "reports/browser/2026-06-02-ag-work-resume-proof-evidence-recording-cockpit-verification.md";
const packagePath = "package.json";

const pointerDocPaths = [
  "docs/AG_WORK_RESUME_CROSS_LOCAL_CONTINUITY_REVIEW_METADATA_CLOSEOUT_V0_1.md",
  "docs/AG_WORK_RESUME_ACTUAL_PROOF_EVIDENCE_RECORDING_GATE_DESIGN_V0_1.md",
  "docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECORDING_SCHEMA_INTEGRATION_POLICY_V0_1.md",
  "docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECORDING_BRIDGE_TABLE_SCHEMA_DESIGN_V0_1.md",
  "docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECORDING_BRIDGE_TABLE_MIGRATION_POLICY_V0_1.md",
  "docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECORDING_WRITER_HELPER_GATE_DESIGN_V0_1.md",
  "docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECORDING_ROUTE_GATE_DESIGN_V0_1.md",
  "docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECORDING_COCKPIT_GATE_DESIGN_V0_1.md",
  "docs/AG_WORK_RESUME_MAPPING_IMPORT_AUTHORITY_GATE_V0_1.md",
  "docs/AG_WORK_RESUME_PROOF_EVIDENCE_SESSION_CODEX_GATES_DESIGN_V0_1.md",
  "docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_DESIGN_V0_1.md",
  "docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_CANDIDATE_LIFECYCLE_ACTIONS_V0_1.md",
];

for (const path of [closeoutPath, browserReportPath, packagePath, ...pointerDocPaths]) {
  assert.equal(existsSync(path), true, `Missing required closeout input: ${path}`);
}

const closeout = readFileSync(closeoutPath, "utf8");
const browserReport = readFileSync(browserReportPath, "utf8");
const normalizedCloseout = normalizeWhitespace(closeout);
const normalizedBrowserReport = normalizeWhitespace(browserReport);
const pointerDocs = new Map(
  pointerDocPaths.map((path) => [path, readFileSync(path, "utf8")]),
);
const packageJson = JSON.parse(readFileSync(packagePath, "utf8"));

for (const phrase of [
  "AG Resume Proof/Evidence Recording Gate Milestone v0.1",
  "bounded path from accepted reconciliation candidate metadata to local verification evidence",
  "reviewed reconciliation candidate metadata",
  "`accepted_for_future_recording` candidate lifecycle state",
  "actual proof/evidence recording gate design",
  "schema/integration policy",
  "bridge table schema design",
  "bridge table migration/DDL policy",
  "bridge table schema implementation",
  "writer/helper gate design",
  "writer/helper implementation",
  "route gate design",
  "route implementation",
  "Cockpit gate design",
  "Cockpit Operator panel implementation",
  "browser verification",
  "DB side-effect proof",
  "one `verification_evidence_records` row",
  "one `ag_work_resume_proof_evidence_recording_links` row",
  "created in one transaction",
  "only through exact per-attempt user/Core approval",
  "only through the existing writer/helper, route, and Cockpit gate path",
  "`action_records` proof path",
  "session binding",
  "Codex continuation",
  "work item/event creation",
  "imported context mutation",
  "confirmed mapping mutation",
  "proposal mutation",
  "reconciliation candidate mutation",
  "approval/publish/retry/replay/merge",
  "Direct Resume Code",
  "relay/hosted transfer",
  "committed-state authority",
  "blanket approval for future recording attempts",
  "Authority Boundary Matrix",
  "Verification Matrix",
  "Browser Report Inventory",
  "CODEX_READ_BRIEF_RUNTIME_UNAVAILABLE",
  "Proof-only closeout record skipped",
  "GitHub visible CI/statusCheckRollup was unavailable or empty",
  "design `action_records` proof path",
  "design session binding gate",
  "design Codex continuation gate",
  "design broader operator workflow",
  "design proof/evidence recording read/report surface",
  "Preconditions Before `action_records` Proof Path",
  "Preconditions Before Session Binding",
  "Preconditions Before Codex Continuation",
  "Current Safe Stopping Point",
]) {
  assertIncludes(normalizedCloseout, phrase, closeoutPath);
}

for (const check of [
  "npm run typecheck",
  "npm run smoke:ag-work-resume-proof-evidence-recording-gate-closeout",
  "npm run smoke:ag-work-resume-proof-evidence-recording-writer-helper",
  "npm run smoke:ag-work-resume-proof-evidence-recording-route",
  "npm run smoke:ag-work-resume-proof-evidence-recording-cockpit-panel",
  "npm run smoke:ag-work-resume-proof-evidence-recording-bridge-table-schema",
  "npm run smoke:ag-work-resume-proof-evidence-recording-bridge-table-migration-policy",
  "npm run smoke:ag-work-resume-proof-evidence-recording-schema-integration-policy",
  "npm run smoke:ag-work-resume-actual-proof-evidence-recording-gate-design",
  "npm run smoke:ag-work-resume-review-metadata-closeout",
  "npm run smoke:ag-work-resume-mapping-import-authority-gate",
  "npm run smoke:ag-work-resume-proof-evidence-session-codex-gates-design",
  "npm run smoke:ag-work-resume-proof-evidence-reconciliation-design",
  "npm run smoke:ag-work-resume-proof-evidence-reconciliation-candidate-lifecycle-action",
  "npm run smoke:ag-work-resume-proof-evidence-reconciliation-candidate-lifecycle-action-route",
  "npm run smoke:ag-work-resume-proof-evidence-reconciliation-candidate-lifecycle-action-cockpit-panel",
  "node --check",
  "node scripts/smoke-ag-work-resume-proof-evidence-recording-gate-closeout.mjs",
  "git diff --check",
  "git diff --cached --check",
]) {
  assertIncludes(normalizedCloseout, check, closeoutPath);
}

for (const matrixEntry of [
  "`accepted_for_future_recording`",
  "writer/helper",
  "route",
  "Cockpit panel",
  "`verification_evidence_records` row",
  "bridge link row",
  "`action_records`",
  "session binding",
  "Codex continuation",
  "work item/event creation",
  "source-row mutation",
  "approval/publish/retry/replay/merge",
  "Direct Resume Code / relay / hosted transfer",
]) {
  assertIncludes(normalizedCloseout, matrixEntry, closeoutPath);
}

for (const reportPhrase of [
  "Operator panel visible",
  "required boundary copy visible",
  "keyboard flow",
  "local validation",
  "safe fixture not approval",
  "clear/reset",
  "exact approved route submit returns 201",
  "idempotent repeat returns 200",
  "failure path returns 403",
  "evidence/link rows 0 -> 1 on recorded",
  "no duplicate rows on idempotent repeat",
  "no new rows on failure",
  "protected table counts unchanged",
]) {
  assertIncludes(normalizedCloseout, reportPhrase, closeoutPath);
}

for (const reportPhrase of [
  "AG Resume proof/evidence recording Cockpit gate browser verification",
  "Result: passed",
  "Operator tab",
  "accepted_for_future_recording is not proof/evidence recording.",
  "Route success is not broader approval.",
  "Actual recording requires exact user/Core approval for this attempt.",
  "HTTP status: `201`",
  "HTTP status: `200`",
  "HTTP status: `403`",
  "`verification_evidence_records`: `0 -> 1`",
  "`ag_work_resume_proof_evidence_recording_links`: `0 -> 1`",
  "Protected table counts unchanged",
]) {
  assertIncludes(normalizedBrowserReport, reportPhrase, browserReportPath);
}

for (const [path, doc] of pointerDocs.entries()) {
  assertIncludes(doc, closeoutPath, path);
  assertIncludes(doc, "Proof/Evidence Recording Gate Milestone v0.1", path);
}

assert.equal(
  packageJson.scripts?.["smoke:ag-work-resume-proof-evidence-recording-gate-closeout"],
  "node scripts/smoke-ag-work-resume-proof-evidence-recording-gate-closeout.mjs",
  "package.json should register the proof/evidence recording gate closeout smoke",
);

const changedFiles = execFileSync(
  "git",
  ["status", "--porcelain", "--untracked-files=all"],
  {
    encoding: "utf8",
  },
)
  .split("\n")
  .map((line) => line.trimEnd())
  .filter(Boolean)
  .map((line) => {
    const file = line.slice(3).trim();
    return file.includes(" -> ") ? file.split(" -> ").at(-1) : file;
  });

const diffChangedFiles = execFileSync("git", ["diff", "--name-only", "HEAD"], {
  encoding: "utf8",
})
  .split("\n")
  .map((line) => line.trim())
  .filter(Boolean);

const closeoutSmokePath =
  "scripts/smoke-ag-work-resume-proof-evidence-recording-gate-closeout.mjs";
const allowedChangedFiles = new Set([
  closeoutPath,
  closeoutSmokePath,
  packagePath,
  "scripts/smoke-ag-work-resume-actual-proof-evidence-recording-gate-design.mjs",
  "scripts/smoke-ag-work-resume-proof-evidence-reconciliation-candidate-lifecycle-action-cockpit-panel.mjs",
  "scripts/smoke-ag-work-resume-proof-evidence-reconciliation-candidate-lifecycle-action.mjs",
  "scripts/smoke-ag-work-resume-proof-evidence-reconciliation-design.mjs",
  "scripts/smoke-ag-work-resume-proof-evidence-recording-bridge-table-migration-policy.mjs",
  "scripts/smoke-ag-work-resume-proof-evidence-recording-bridge-table-schema-design.mjs",
  "scripts/smoke-ag-work-resume-proof-evidence-recording-bridge-table-schema.mjs",
  "scripts/smoke-ag-work-resume-proof-evidence-recording-cockpit-gate-design.mjs",
  "scripts/smoke-ag-work-resume-proof-evidence-recording-cockpit-panel.mjs",
  "scripts/smoke-ag-work-resume-proof-evidence-recording-route-gate-design.mjs",
  "scripts/smoke-ag-work-resume-proof-evidence-recording-route.mjs",
  "scripts/smoke-ag-work-resume-proof-evidence-recording-schema-integration-policy.mjs",
  "scripts/smoke-ag-work-resume-proof-evidence-recording-writer-helper-gate-design.mjs",
  "scripts/smoke-ag-work-resume-proof-evidence-recording-writer-helper.mjs",
  "scripts/smoke-ag-work-resume-proof-evidence-session-codex-gates-design.mjs",
  "scripts/smoke-ag-work-resume-review-metadata-closeout.mjs",
  ...pointerDocPaths,
]);

const unexpectedChangedFiles = changedFiles.filter(
  (file) => !allowedChangedFiles.has(file),
);
assert.deepEqual(
  unexpectedChangedFiles,
  [],
  "closeout PR should be limited to the closeout doc, pointer docs, package pointer, closeout smoke, and smoke-guard compatibility updates",
);

const unexpectedDiffFiles = diffChangedFiles.filter(
  (file) => !allowedChangedFiles.has(file),
);
assert.deepEqual(
  unexpectedDiffFiles,
  [],
  "closeout PR diff should be limited to the closeout doc, pointer docs, package pointer, closeout smoke, and smoke-guard compatibility updates",
);

const forbiddenRuntimeChanges = changedFiles.filter(
  (file) =>
    file === "package-lock.json" ||
    file.startsWith("app/") ||
    file.startsWith("components/") ||
    file.startsWith("lib/") ||
    file.startsWith("migrations/") ||
    file.startsWith("apps/") ||
    file.startsWith("hooks/") ||
    file.startsWith("plugins/") ||
    file.startsWith(".codex/") ||
    file.startsWith(".agents/skills/"),
);
assert.deepEqual(
  forbiddenRuntimeChanges,
  [],
  "closeout PR must not change runtime, schema, routes, UI, hooks, plugins, skills, package-lock, or secret-handling files",
);

console.log(
  JSON.stringify(
    {
      smoke: "ag-work-resume-proof-evidence-recording-gate-closeout",
      closeout_doc_exists: true,
      milestone_name_exists: true,
      exact_allowed_recording_side_effect_documented: true,
      action_records_out_of_scope: true,
      session_binding_out_of_scope: true,
      codex_continuation_out_of_scope: true,
      source_row_mutation_out_of_scope: true,
      browser_report_inventory_present: true,
      pointer_docs_reference_closeout: true,
      package_script_added: true,
      changed_files_limited_to_docs_package_pointer_closeout_smoke_and_guard_compatibility: true,
    },
    null,
    2,
  ),
);

function assertIncludes(value, expected, source) {
  assert.equal(
    value.includes(expected),
    true,
    `Expected ${source} to include: ${expected}`,
  );
}

function normalizeWhitespace(value) {
  return value.replace(/\s+/g, " ").trim();
}
