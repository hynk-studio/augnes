import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

const policyPath =
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

for (const path of [
  policyPath,
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

const policy = readFileSync(policyPath, "utf8");
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
  actualRecordingGateDesign,
  closeout,
  authorityGate,
  sessionCodexGate,
  reconciliationDesign,
  lifecycleDoc,
].join("\n");

for (const phrase of [
  "AG Resume Proof/Evidence Recording Schema Integration Policy v0.1",
  "This document is design-only",
  "adds no runtime behavior",
  "adds no schema or migration",
  "adds no writer, helper, route, UI",
  "`accepted_for_future_recording` is not proof/evidence recording",
  "Schema/integration design is not approval to record",
  "Actual recording remains separately user/Core gated",
  "Policy Recommendation",
  "Recommended first implementation path: use a new bridge table from reconciliation candidate ids to local proof/evidence ids",
  "first target record kind narrowed to one `verification_evidence_records` row",
  "Option 1: Existing Proof/Action-Record Path",
  "Option 2: Existing Verification Evidence Path",
  "Option 3: Split Proof And Evidence Records",
  "Option 4: New Bridge Table From Reconciliation Candidate IDs To Local Proof/Evidence IDs",
  "Option 5: Deferring Implementation Until Another Design-Only Extension",
  "Protected Side-Effect Boundary",
  "Authority Boundary",
  "Browser verification skipped",
]) {
  assertIncludes(policy, phrase);
}

for (const phrase of [
  "What Local Record Would Be Created Later",
  "Required Existing Tables Or Schema Changes",
  "Provenance Fields",
  "Idempotency Key Placement",
  "Actor/Reason Placement",
  "Redaction Summary Placement",
  "Source Imported Context Linkage",
  "Confirmed Mapping Linkage",
  "Reconciliation Candidate Linkage",
  "Trust/Provenance Label Placement",
  "Rollback/Failure Behavior",
  "Read-Surface Implications",
  "Migration Risk",
  "Auditability",
  "Fit For First Implementation",
]) {
  const occurrences = policy.split(phrase).length - 1;
  assert.equal(
    occurrences,
    5,
    `Expected each evaluated option to include section: ${phrase}`,
  );
}

for (const phrase of [
  "one `verification_evidence_records` row",
  "one bridge/link row",
  "single local transaction",
  "user/Core explicitly approves the exact recording attempt",
  "candidate is in `accepted_for_future_recording`",
  "source imported context exists and remains allowed",
  "source confirmed mapping exists and remains allowed",
  "actor is explicit",
  "reason is explicit",
  "redaction summary is safe",
  "trust/provenance label is explicit",
  "idempotency key is explicit",
]) {
  assertIncludes(policy, phrase);
}

for (const phrase of [
  "actual-proof-evidence-recording:v0_1:<candidate_id>:<import_id>:<mapping_id>:<foreign_ref_type>:<foreign_ref_id>:<local_scope>:<local_work_id>:verification_evidence",
  "Same key with same payload may return an idempotent no-new-write response",
  "Same key with different payload must fail closed",
  "Same candidate with a different key must fail closed",
]) {
  assertIncludes(policy, phrase);
}

for (const phrase of [
  "no runtime behavior",
  "no schema or migration",
  "no writer, helper, route, or UI",
  "no browser report",
  "no proof/evidence recording",
  "no evidence recording",
  "no session binding",
  "no Codex execution or continuation",
  "no work item creation",
  "no work event creation",
  "no imported context mutation",
  "no confirmed mapping mutation",
  "no proposal mutation",
  "no approval, publish, retry, replay, merge, auto-merge, external posting",
  "Approval/publish/retry/replay/merge remains out of scope",
  "Session binding and Codex continuation remain out of scope",
]) {
  assertIncludes(policy, phrase);
}

assert.equal(
  pkg.scripts?.[
    "smoke:ag-work-resume-proof-evidence-recording-schema-integration-policy"
  ],
  "node scripts/smoke-ag-work-resume-proof-evidence-recording-schema-integration-policy.mjs",
  "package.json should register the schema/integration policy smoke",
);

assert.ok(
  joinedPointers.includes(policyPath),
  "AG Resume pointer docs should reference the schema/integration policy doc",
);

const changedFiles = gitChangedFiles();
const allowedChangedFiles = new Set([
  policyPath,
  actualRecordingGateDesignPath,
  closeoutPath,
  authorityGatePath,
  sessionCodexGatePath,
  reconciliationDesignPath,
  lifecycleDocPath,
  "package.json",
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
  "schema/integration policy PR should be limited to docs, package script, and smoke guards",
);

const forbiddenChangedPrefixes = [
  "app/",
  "app/api/",
  "components/",
  "lib/",
  "pages/",
  "public/",
  "migrations/",
  "db/",
  "apps/",
  "reports/browser/",
];
const runtimeSchemaOrBrowserChanged = changedFiles.filter((file) =>
  forbiddenChangedPrefixes.some((prefix) => file.startsWith(prefix)),
);
assert.deepEqual(
  runtimeSchemaOrBrowserChanged,
  [],
  "schema/integration policy PR should not change runtime/schema/migration/writer/helper/route/UI/browser files",
);

console.log(
  JSON.stringify(
    {
      smoke: "ag-work-resume-proof-evidence-recording-schema-integration-policy",
      policy_doc_exists: true,
      design_only_boundary: true,
      all_five_options_evaluated: true,
      recommended_first_path:
        "new bridge table with one verification_evidence_records target row",
      accepted_for_future_recording_not_recording: true,
      actual_recording_unauthorized: true,
      authority_boundary_preserved: true,
      changed_files_limited_to_docs_package_smokes: true,
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
    `Expected policy content to include: ${expected}`,
  );
}
