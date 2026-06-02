import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

const routeDesignPath =
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
  "scripts/smoke-ag-work-resume-proof-evidence-recording-route-gate-design.mjs";
const futureRoutePath =
  "app/api/ag-work-resume/proof-evidence-recordings/route.ts";

for (const path of [
  routeDesignPath,
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
]) {
  assert.equal(existsSync(path), true, `Missing required input: ${path}`);
}

const design = readFileSync(routeDesignPath, "utf8");
const pointerDocs = [
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
  "AG Resume Proof/Evidence Recording Route Gate Design v0.1",
  "This document is design-only",
  "no route implementation",
  "no UI/Cockpit controls",
  "no schema or migration",
  "no writer/helper implementation changes",
  "no proof/evidence recording",
  "no `verification_evidence_records` rows",
  "`ag_work_resume_proof_evidence_recording_links` rows",
  "no `action_records` rows",
  "no session binding",
  "no Codex execution or continuation",
  "no work item/event creation",
  "no imported context mutation",
  "no confirmed mapping mutation",
  "no proposal mutation",
  "no reconciliation candidate mutation",
  "no approval, publish, retry, replay, merge, auto-merge, external posting",
  "The route gate design is not route implementation",
  "The route gate design is not approval to record",
  "A future route implementation PR is not blanket approval to record",
  "Actual recording remains per-attempt user/Core gated",
  "`accepted_for_future_recording` is not proof/evidence recording",
  "The route must not weaken helper validation",
]) {
  assertIncludes(design, phrase);
}

for (const phrase of [
  "POST /api/ag-work-resume/proof-evidence-recordings",
  "application/json",
  "The route must reject unsupported fields",
  "Supported fields only",
  "Forbidden Fields",
  "`candidate_id`",
  "`user_core_approval`",
  "`actor`",
  "`reason`",
  "`redaction_summary`",
  "`trust_provenance_label`",
  "`local_target_scope`",
  "`local_target_work_id`",
  "`expected_idempotency_key`",
  "`db`",
  "`now`",
]) {
  assertIncludes(design, phrase);
}

for (const phrase of [
  "Exact User/Core Approval Payload Requirement",
  "The route must require `user_core_approval`",
  "pass it to the helper without weakening or replacing helper validation",
  "`candidate_id` is the canonical input",
  "`import_id`, `mapping_id`, and `expected_idempotency_key` only as cross-checks",
  "Every response must include an `authority_boundary` object",
  "The route should expose created row ids",
  "`recorded` | 201",
  "`idempotent_no_new_write` | 200",
  "`duplicate_conflict` | 409",
  "`invalid_candidate` | 409",
  "`missing_source_rows` | 404",
  "`unauthorized_attempt` | 403",
  "`fk_or_unique_failure` | 409",
  "`db_error` | 500",
]) {
  assertIncludes(design, phrase);
}

for (const phrase of [
  "The route must call only",
  "createAgWorkResumeProofEvidenceRecordingFromCandidate",
  "The route must not call `fetch`",
  "OpenAI APIs",
  "GitHub APIs",
  "MCP tools",
  "Browser",
  "Codex helpers",
  "session bind helpers",
  "action-record writers",
  "work item/event writers",
  "approval, publish, retry, replay, merge, auto-merge, or external-posting",
]) {
  assertIncludes(design, phrase);
}

for (const phrase of [
  "Route Smoke Expectations",
  "Future Route Implementation Verification Matrix",
  "Browser verification skipped",
  "no route implementation",
  "no UI/Cockpit controls",
  "no bridge rows created",
  "no `verification_evidence_records` row creation",
  "no `action_records` row creation",
]) {
  assertIncludes(design, phrase);
}

assert.equal(
  pkg.scripts?.[
    "smoke:ag-work-resume-proof-evidence-recording-route-gate-design"
  ],
  "node scripts/smoke-ag-work-resume-proof-evidence-recording-route-gate-design.mjs",
  "package.json should register the route gate design smoke",
);

assert.ok(
  pointerDocs.includes(routeDesignPath),
  "AG Resume pointer docs should reference the route gate design doc",
);

const changedFiles = gitChangedFiles();
const allowedChangedFiles = new Set([
  routeDesignPath,
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
  "docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECORDING_COCKPIT_GATE_DESIGN_V0_1.md",
  packagePath,
  smokePath,
  futureRoutePath,
  "components/augnes-cockpit.tsx",
  "reports/browser/2026-06-02-ag-work-resume-proof-evidence-recording-cockpit-verification.md",
  "scripts/smoke-ag-work-resume-proof-evidence-recording-route.mjs",
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
  "scripts/smoke-ag-work-resume-proof-evidence-recording-cockpit-gate-design.mjs",
  "scripts/smoke-ag-work-resume-proof-evidence-recording-cockpit-panel.mjs",
]);
assert.deepEqual(
  changedFiles.filter((file) => !allowedChangedFiles.has(file)),
  [],
  "route gate design PR should be limited to docs, package script, and smoke guards",
);

assert.deepEqual(
  changedFiles.filter(
    (file) =>
      (file.startsWith("app/") && file !== futureRoutePath) ||
      (file.startsWith("components/") &&
        file !== "components/augnes-cockpit.tsx") ||
      file.startsWith("pages/") ||
      file.startsWith("public/") ||
      file.startsWith("migrations/") ||
      file.startsWith("db/") ||
      file.startsWith("apps/") ||
      (file.startsWith("reports/browser/") &&
        file !==
          "reports/browser/2026-06-02-ag-work-resume-proof-evidence-recording-cockpit-verification.md") ||
      file.startsWith("lib/") ||
      (file.startsWith("scripts/") && !file.startsWith("scripts/smoke-")),
  ),
  [],
  "route gate design PR must not change runtime/schema/migration/route/UI/browser/helper files",
);

console.log(
  JSON.stringify(
    {
      smoke: "ag-work-resume-proof-evidence-recording-route-gate-design",
  route_gate_design_doc_exists: true,
  design_only_boundary: true,
  route_implementation_allowed_after_design: existsSync(futureRoutePath),
  proposed_route_path:
        "POST /api/ag-work-resume/proof-evidence-recordings",
      application_json_required: true,
      unsupported_fields_rejected: true,
      exact_user_core_approval_required: true,
      helper_only_future_delegation: true,
      route_gate_design_boundary_preserved: true,
      no_ui_cockpit_files_added: true,
      no_runtime_schema_migration_route_ui_browser_files_changed: true,
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
