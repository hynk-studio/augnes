import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

const closeoutPath =
  "docs/AG_WORK_RESUME_CROSS_LOCAL_CONTINUITY_REVIEW_METADATA_CLOSEOUT_V0_1.md";
const actualRecordingGateDesignPath =
  "docs/AG_WORK_RESUME_ACTUAL_PROOF_EVIDENCE_RECORDING_GATE_DESIGN_V0_1.md";
const schemaIntegrationPolicyPath =
  "docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECORDING_SCHEMA_INTEGRATION_POLICY_V0_1.md";
const bridgeDesignPath =
  "docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECORDING_BRIDGE_TABLE_SCHEMA_DESIGN_V0_1.md";
const bridgeMigrationPolicyPath =
  "docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECORDING_BRIDGE_TABLE_MIGRATION_POLICY_V0_1.md";
const authorityGatePath =
  "docs/AG_WORK_RESUME_MAPPING_IMPORT_AUTHORITY_GATE_V0_1.md";
const packagePath = "package.json";
const schemaPath = "lib/db/schema.sql";

for (const path of [
  closeoutPath,
  "docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECORDING_GATE_CLOSEOUT_V0_1.md",
  actualRecordingGateDesignPath,
  schemaIntegrationPolicyPath,
  bridgeDesignPath,
  bridgeMigrationPolicyPath,
  authorityGatePath,
  packagePath,
]) {
  assert.equal(existsSync(path), true, `Missing required closeout input: ${path}`);
}

const closeout = readFileSync(closeoutPath, "utf8");
const actualRecordingGateDesign = readFileSync(
  actualRecordingGateDesignPath,
  "utf8",
);
const schemaIntegrationPolicy = readFileSync(schemaIntegrationPolicyPath, "utf8");
const bridgeDesign = readFileSync(bridgeDesignPath, "utf8");
const bridgeMigrationPolicy = readFileSync(bridgeMigrationPolicyPath, "utf8");
const authorityGate = readFileSync(authorityGatePath, "utf8");
const pkg = JSON.parse(readFileSync(packagePath, "utf8"));
const joined = [
  closeout,
  actualRecordingGateDesign,
  schemaIntegrationPolicy,
  bridgeDesign,
  bridgeMigrationPolicy,
  authorityGate,
].join("\n");

for (const phrase of [
  "AG Resume Cross-local Continuity Review-Metadata Milestone v0.1",
  "Stage A packet / preview",
  "Stage B proposal record create/read/lifecycle/UI",
  "Stage C confirmed mapping create/read/UI",
  "Stage D imported context create/read/UI",
  "proof/evidence/session/Codex gate design",
  "proof/evidence reconciliation design",
  "reconciliation candidate create/read/lifecycle/UI",
  "Route/Helper/UI Inventory",
  "DB Table Inventory",
  "Authority Boundary Matrix",
  "Verification Matrix",
  "Browser Report Inventory",
  "actual proof/evidence recording",
  "evidence recording",
  "session binding",
  "Codex continuation",
  "Direct Resume Code",
  "relay/hosted transfer",
  "work item/event creation",
  "imported context mutation beyond existing scoped create/read",
  "confirmed mapping mutation beyond existing scoped create/read",
  "proposal mutation beyond existing scoped lifecycle",
  "approval/publish/retry/replay/merge authority",
  "user/Core explicit authorization",
  "fresh `codex:read-brief` succeeds",
]) {
  assertIncludes(closeout, phrase);
}

for (const phrase of [
  "review-metadata milestone",
  "adds no runtime behavior",
  "adds no schema",
  "adds no writer/helper/route/UI",
  "proof/evidence recording",
  "session binding",
  "Codex execution or continuation",
  "approval, publish, retry, replay, merge",
]) {
  assertIncludes(closeout, phrase);
}

assert.match(
  closeout,
  /`accepted_for_future_recording` is not proof\/evidence recording/,
  "accepted_for_future_recording must stay non-recording metadata",
);
assert.match(
  closeout,
  /`superseded -> revoke` preserves `superseded_by_candidate_id` as audit metadata/,
  "superseded revoke audit metadata boundary must be preserved",
);
assert.match(
  closeout,
  /Proof\/evidence recording[\s\S]*Out of scope/,
  "actual proof/evidence recording must be explicitly out of scope",
);
assert.match(
  closeout,
  /Session binding[\s\S]*Out of scope/,
  "session binding must be explicitly out of scope",
);
assert.match(
  closeout,
  /Codex continuation[\s\S]*Out of scope/,
  "Codex continuation must be explicitly out of scope",
);
assert.match(
  closeout,
  /Approval\/publish\/retry\/replay\/merge\/auto-merge[\s\S]*Out of scope/,
  "approval/publish/retry/replay/merge must be explicitly out of scope",
);

assert.ok(
  joined.includes(closeoutPath),
  "pointer docs should reference the closeout doc",
);
assert.equal(
  pkg.scripts?.["smoke:ag-work-resume-review-metadata-closeout"],
  "node scripts/smoke-ag-work-resume-review-metadata-closeout.mjs",
  "package.json should register the closeout smoke",
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

const allowedChangedFiles = new Set([
  closeoutPath,
  "docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECORDING_GATE_CLOSEOUT_V0_1.md",
  actualRecordingGateDesignPath,
  schemaIntegrationPolicyPath,
  bridgeDesignPath,
  bridgeMigrationPolicyPath,
  "docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECORDING_ROUTE_GATE_DESIGN_V0_1.md",
  "docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECORDING_WRITER_HELPER_GATE_DESIGN_V0_1.md",
  authorityGatePath,
  schemaPath,
  "package.json",
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
  "docs/AG_WORK_RESUME_PROOF_EVIDENCE_SESSION_CODEX_GATES_DESIGN_V0_1.md",
  "docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_DESIGN_V0_1.md",
  "docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_CANDIDATE_LIFECYCLE_ACTIONS_V0_1.md",
  "docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECORDING_COCKPIT_GATE_DESIGN_V0_1.md",
  "components/augnes-cockpit.tsx",
  "reports/browser/2026-06-02-ag-work-resume-proof-evidence-recording-cockpit-verification.md",
  "scripts/smoke-ag-work-resume-actual-proof-evidence-recording-gate-design.mjs",
  "scripts/smoke-ag-work-resume-review-metadata-closeout.mjs",
    "scripts/smoke-ag-work-resume-proof-evidence-recording-gate-closeout.mjs",
  "scripts/smoke-ag-work-resume-proof-evidence-session-codex-gates-design.mjs",
  "scripts/smoke-ag-work-resume-proof-evidence-reconciliation-design.mjs",
  "scripts/smoke-ag-work-resume-proof-evidence-reconciliation-candidate-lifecycle-action.mjs",
  "scripts/smoke-ag-work-resume-proof-evidence-reconciliation-candidate-lifecycle-action-cockpit-panel.mjs",
  "scripts/smoke-ag-work-resume-proof-evidence-recording-cockpit-gate-design.mjs",
  "scripts/smoke-ag-work-resume-proof-evidence-recording-cockpit-panel.mjs",
]);

const unexpectedChangedFiles = changedFiles.filter(
  (file) => !allowedChangedFiles.has(file),
);
assert.deepEqual(
  unexpectedChangedFiles,
  [],
  "closeout PR should be limited to docs, the closeout smoke, and package pointer updates",
);

const forbiddenChangedPrefixes = [
  "components/",
  "pages/",
  "public/",
  "migrations/",
  "db/",
  "apps/",
];
const runtimeOrSchemaChanged = changedFiles.filter((file) =>
  (file.startsWith("app/") &&
    file !== "app/api/ag-work-resume/proof-evidence-recordings/route.ts") ||
  (file.startsWith("components/") &&
    file !== "components/augnes-cockpit.tsx") ||
  (file.startsWith("reports/browser/") &&
    file !==
      "reports/browser/2026-06-02-ag-work-resume-proof-evidence-recording-cockpit-verification.md") ||
  forbiddenChangedPrefixes
    .filter((prefix) => prefix !== "components/" && prefix !== "reports/browser/")
    .some((prefix) => file.startsWith(prefix)) ||
  (file.startsWith("lib/") &&
    file !== schemaPath &&
    file !== "lib/ag-work-resume-proof-evidence-recording.ts"),
);
assert.deepEqual(
  runtimeOrSchemaChanged,
  [],
  "closeout follow-up should not change route/UI/runtime files outside schema.sql and the scoped writer helper",
);

const unexpectedDiffFiles = diffChangedFiles.filter(
  (file) => !allowedChangedFiles.has(file),
);
assert.deepEqual(
  unexpectedDiffFiles,
  [],
  "closeout PR diff should be limited to docs, the closeout smoke, and package pointer updates",
);

console.log(
  JSON.stringify(
    {
      smoke: "ag-work-resume-review-metadata-closeout",
      closeout_doc_exists: true,
      milestone_name_exists: true,
      review_metadata_pipeline_stages_listed: true,
      proof_evidence_recording_out_of_scope: true,
      session_binding_out_of_scope: true,
      codex_continuation_out_of_scope: true,
      approval_publish_retry_replay_merge_out_of_scope: true,
      changed_files_limited_to_docs_package_scoped_writer_helper_smoke_pointers: true,
    },
    null,
    2,
  ),
);

function assertIncludes(value, expected) {
  assert.equal(
    value.includes(expected),
    true,
    `Expected closeout content to include: ${expected}`,
  );
}
