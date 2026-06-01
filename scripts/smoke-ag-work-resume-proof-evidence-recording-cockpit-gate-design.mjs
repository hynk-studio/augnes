import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

const cockpitGateDesignPath =
  "docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECORDING_COCKPIT_GATE_DESIGN_V0_1.md";
const routeGateDesignPath =
  "docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECORDING_ROUTE_GATE_DESIGN_V0_1.md";
const writerHelperGatePath =
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
const smokePath =
  "scripts/smoke-ag-work-resume-proof-evidence-recording-cockpit-gate-design.mjs";
const cockpitComponentPath = "components/augnes-cockpit.tsx";
const routePath = "app/api/ag-work-resume/proof-evidence-recordings/route.ts";
const writerHelperPath = "lib/ag-work-resume-proof-evidence-recording.ts";
const schemaPath = "lib/db/schema.sql";

for (const path of [
  cockpitGateDesignPath,
  routeGateDesignPath,
  writerHelperGatePath,
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
  routePath,
]) {
  assert.equal(existsSync(path), true, `Missing required input: ${path}`);
}

const design = readFileSync(cockpitGateDesignPath, "utf8");
const pointerDocs = [
  routeGateDesignPath,
  writerHelperGatePath,
  bridgeSchemaPath,
  bridgeMigrationPolicyPath,
  schemaIntegrationPolicyPath,
  actualRecordingGateDesignPath,
  closeoutPath,
  authorityGatePath,
  sessionCodexGatePath,
  reconciliationDesignPath,
  lifecycleDocPath,
]
  .map((path) => readFileSync(path, "utf8"))
  .join("\n");
const pkg = JSON.parse(readFileSync(packagePath, "utf8"));

for (const phrase of [
  "AG Resume Proof/Evidence Recording Cockpit Gate Design v0.1",
  "This document is design-only",
  "no UI/Cockpit implementation",
  "no route implementation",
  "no route modification",
  "no writer/helper behavior change",
  "no schema or migration",
  "no proof/evidence recording",
  "no `verification_evidence_records` rows",
  "no `ag_work_resume_proof_evidence_recording_links` rows",
  "no `action_records` rows",
  "no session binding",
  "no Codex execution or continuation",
  "no work item/event creation",
  "no imported context mutation",
  "no confirmed mapping mutation",
  "no proposal mutation",
  "no reconciliation candidate mutation",
  "no approval, publish, retry, replay, merge, auto-merge, external posting",
  "The UI gate design is not UI implementation",
  "The UI gate design is not approval to record",
  "A future UI implementation PR is not blanket approval to record",
  "`accepted_for_future_recording` is not proof/evidence recording",
  "Recording remains exact per-attempt user/Core gated",
  "The UI must not weaken route/helper validation",
]) {
  assertIncludes(design, phrase);
}

for (const phrase of [
  "Cockpit Operator tab, near AG Resume proof/evidence recording/candidate panels",
  "POST /api/ag-work-resume/proof-evidence-recordings",
  "The future UI must call only that route",
  "must not call `createAgWorkResumeProofEvidenceRecordingFromCandidate` directly",
  "candidate_id",
  "import_id",
  "mapping_id",
  "user_core_approval",
  "actor",
  "reason",
  "redaction_summary",
  "trust_provenance_label",
  "local_target_scope",
  "local_target_work_id",
  "expected_idempotency_key",
  "`candidate_id` is the canonical input",
  "`import_id`, `mapping_id`, and `expected_idempotency_key` are cross-checks only",
]) {
  assertIncludes(design, phrase);
}

for (const phrase of [
  "accepted_for_future_recording is not proof/evidence recording.",
  "Route success is not broader approval.",
  "Actual recording requires exact user/Core approval for this attempt.",
  "Manual JSON approval payload entry is allowed and required",
  "The UI may build a draft approval payload from visible fields only as a copy/edit convenience",
  "That draft is not approval",
  "Safe fixture loading is allowed only for development, smoke, and local demo verification",
  "Fixture data may never imply approval",
  "Record verification evidence",
  "confirmation checkbox",
  "typed confirmation phrase",
  "record verification evidence",
  "The idempotency key must be shown before submission",
  "Success must display `evidence_id`, `recording_link_id`, `candidate_id`, and `idempotency_key`",
  "Failure text must be public-safe only",
  "Browser verification is required for any future UI implementation PR",
]) {
  assertIncludes(design, phrase);
}

for (const phrase of [
  "Run Codex",
  "continue Codex",
  "bind session",
  "create work item/event",
  "create action record",
  "approve/publish/retry/replay/merge",
  "auto-merge",
  "external post",
  "mutate imported context",
  "mutate confirmed mapping",
  "mutate proposal",
  "mutate reconciliation candidate",
  "Direct Resume Code",
  "relay/hosted transfer",
  "`db`",
  "`now`",
  "`codex_continue`",
  "`codex_execute`",
  "`mutate_imported_context`",
  "`mutate_confirmed_mapping`",
  "`mutate_proposal`",
  "`mutate_candidate`",
  "`publish`",
  "`retry`",
  "`replay`",
  "`merge`",
  "`auto_merge`",
  "`external_post`",
]) {
  assertIncludes(design, phrase);
}

for (const phrase of [
  "Future UI must not call",
  "Codex APIs/helpers",
  "session binding helpers",
  "action-record writers",
  "work item/event writers",
  "imported context writers",
  "confirmed mapping writers",
  "proposal writers",
  "reconciliation candidate lifecycle writers",
  "approval/publish/retry/replay/merge helpers",
  "external network APIs",
  "OpenAI APIs",
  "GitHub APIs",
  "MCP tools",
  "Browser automation",
  "`createAgWorkResumeProofEvidenceRecordingFromCandidate` directly",
]) {
  assertIncludes(design, phrase);
}

for (const phrase of [
  "Clear And Reset Behavior",
  "Success Rendering",
  "Idempotent Rendering",
  "Failure Rendering",
  "Future DB And Network Proof Expectations",
  "Future Browser Verification Matrix",
  "Accessibility And Keyboard Expectations",
  "Unauthorized Controls Scan Expectations",
  "Protected Table Count Proof Expectations",
  "exact approved `recorded` may increase",
  "`verification_evidence_records` by 1",
  "`ag_work_resume_proof_evidence_recording_links` by 1",
]) {
  assertIncludes(design, phrase);
}

assert.equal(
  pkg.scripts?.[
    "smoke:ag-work-resume-proof-evidence-recording-cockpit-gate-design"
  ],
  "node scripts/smoke-ag-work-resume-proof-evidence-recording-cockpit-gate-design.mjs",
  "package.json should register the Cockpit gate design smoke",
);

assert.ok(
  pointerDocs.includes(cockpitGateDesignPath),
  "AG Resume pointer docs should reference the Cockpit gate design doc",
);

const changedFiles = gitChangedFiles();
const allowedChangedFiles = new Set([
  cockpitGateDesignPath,
  routeGateDesignPath,
  writerHelperGatePath,
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
  smokePath,
  "scripts/smoke-ag-work-resume-proof-evidence-recording-route.mjs",
  "scripts/smoke-ag-work-resume-proof-evidence-recording-route-gate-design.mjs",
  "scripts/smoke-ag-work-resume-proof-evidence-recording-writer-helper.mjs",
  "scripts/smoke-ag-work-resume-proof-evidence-recording-writer-helper-gate-design.mjs",
  "scripts/smoke-ag-work-resume-proof-evidence-recording-bridge-table-schema.mjs",
  "scripts/smoke-ag-work-resume-proof-evidence-recording-bridge-table-schema-design.mjs",
  "scripts/smoke-ag-work-resume-proof-evidence-recording-bridge-table-migration-policy.mjs",
  "scripts/smoke-ag-work-resume-proof-evidence-recording-schema-integration-policy.mjs",
  "scripts/smoke-ag-work-resume-actual-proof-evidence-recording-gate-design.mjs",
  "scripts/smoke-ag-work-resume-review-metadata-closeout.mjs",
  "scripts/smoke-ag-work-resume-proof-evidence-session-codex-gates-design.mjs",
  "scripts/smoke-ag-work-resume-proof-evidence-reconciliation-design.mjs",
  "scripts/smoke-ag-work-resume-proof-evidence-reconciliation-candidate-lifecycle-action.mjs",
  "scripts/smoke-ag-work-resume-proof-evidence-reconciliation-candidate-lifecycle-action-cockpit-panel.mjs",
]);
assert.deepEqual(
  changedFiles.filter((file) => !allowedChangedFiles.has(file)),
  [],
  "Cockpit gate design PR should be limited to docs, package script, and smoke guard",
);

assert.equal(
  changedFiles.includes(cockpitComponentPath),
  false,
  "Cockpit gate design PR must not change components/augnes-cockpit.tsx",
);
assert.equal(
  changedFiles.includes(routePath),
  false,
  "Cockpit gate design PR must not change the recording route implementation",
);
assert.equal(
  changedFiles.includes(writerHelperPath),
  false,
  "Cockpit gate design PR must not change writer/helper behavior",
);
assert.equal(
  changedFiles.includes(schemaPath),
  false,
  "Cockpit gate design PR must not change schema",
);

assert.deepEqual(
  changedFiles.filter(
    (file) =>
      file.startsWith("app/") ||
      file.startsWith("components/") ||
      file.startsWith("pages/") ||
      file.startsWith("public/") ||
      file.startsWith("migrations/") ||
      file.startsWith("db/") ||
      file.startsWith("apps/") ||
      file.startsWith("reports/browser/") ||
      file.startsWith("lib/") ||
      (file.startsWith("scripts/") && !file.startsWith("scripts/smoke-")),
  ),
  [],
  "Cockpit gate design PR must not change runtime/schema/migration/route/UI/browser/helper files",
);

console.log(
  JSON.stringify(
    {
      smoke: "ag-work-resume-proof-evidence-recording-cockpit-gate-design",
      cockpit_gate_design_doc_exists: true,
      design_only_boundary: true,
      no_components_augnes_cockpit_change: true,
      no_route_implementation_change: true,
      no_writer_helper_behavior_change: true,
      no_schema_migration_change: true,
      proposed_route:
        "POST /api/ag-work-resume/proof-evidence-recordings",
      exact_user_core_approval_required: true,
      accepted_for_future_recording_not_recording: true,
      ui_must_call_only_existing_route: true,
      ui_must_not_call_helper_directly: true,
      no_runtime_schema_migration_route_ui_browser_files_changed: true,
      future_browser_verification_required: true,
    },
    null,
    2,
  ),
);

function assertIncludes(source, phrase) {
  const normalizedSource = source.replace(/\s+/g, " ");
  const normalizedPhrase = phrase.replace(/\s+/g, " ");
  assert.ok(
    normalizedSource.includes(normalizedPhrase),
    `Missing required phrase: ${phrase}`,
  );
}

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
