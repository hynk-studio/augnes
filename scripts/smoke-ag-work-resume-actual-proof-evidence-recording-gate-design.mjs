import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

const designPath =
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
  designPath,
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
const closeout = readFileSync(closeoutPath, "utf8");
const authorityGate = readFileSync(authorityGatePath, "utf8");
const sessionCodexGate = readFileSync(sessionCodexGatePath, "utf8");
const reconciliationDesign = readFileSync(reconciliationDesignPath, "utf8");
const lifecycleDoc = readFileSync(lifecycleDocPath, "utf8");
const pkg = JSON.parse(readFileSync(packagePath, "utf8"));
const joinedPointers = [
  closeout,
  authorityGate,
  sessionCodexGate,
  reconciliationDesign,
  lifecycleDoc,
].join("\n");

for (const phrase of [
  "AG Resume Actual Proof/Evidence Recording Gate Design v0.1",
  "This document is design-only",
  "adds no runtime behavior",
  "adds no schema",
  "adds no writer, helper, route, UI",
  "`accepted_for_future_recording` is not proof/evidence recording",
  "Actual proof/evidence recording remains unauthorized until a separate implementation PR is explicitly approved after this design",
  "Why Review Metadata Is Not Proof/Evidence",
  "Required Preconditions Before Recording",
  "Candidate Lifecycle State Requirement",
  "Actor Requirement",
  "Reason Requirement",
  "Source Imported Context Requirement",
  "Confirmed Mapping Requirement",
  "Redaction Policy",
  "Trust And Provenance Policy",
  "Dedupe And Idempotency Policy",
  "Rollback And Failure Policy",
  "Protected Side-Effect Boundary",
  "Database And Schema Integration Options",
  "Future Route/Helper/UI Implementation Sequence",
  "Browser And DB Proof Requirements For Later PRs",
  "Explicit User/Core Approval Requirement",
  "Browser verification skipped",
]) {
  assertIncludes(design, phrase);
}

for (const phrase of [
  "user/Core explicitly authorizes the exact recording attempt",
  "candidate lifecycle state is allowed by the implementation policy",
  "source imported context exists",
  "source confirmed mapping exists",
  "local target work identity is explicit",
  "foreign refs are bounded summaries",
  "redaction report is safe",
  "provenance/trust classification is explicit",
  "dedupe/idempotency key is explicit",
  "protected side-effect boundary is enforced",
]) {
  assertIncludes(design, phrase);
}

for (const phrase of [
  "The required candidate lifecycle state for the first future implementation should be `accepted_for_future_recording`.",
  "necessary but not sufficient",
  "reject candidates in `proposed`, `deferred`, `rejected`, `withdrawn`, `superseded`, or `revoked`",
  "`superseded -> revoke` must continue to preserve `superseded_by_candidate_id` as audit metadata",
]) {
  assertIncludes(design, phrase);
}

for (const phrase of [
  "secrets included",
  "raw DB paths included",
  "raw session payloads included",
  "raw proof payloads included",
  "raw evidence payloads included",
  "must not copy raw foreign payloads into local proof/evidence records",
]) {
  assertIncludes(design, phrase);
}

for (const phrase of [
  "source runtime or packet identity",
  "source packet id and packet hash",
  "source imported context id",
  "source confirmed mapping id",
  "source reconciliation candidate id",
  "foreign ref type and id",
  "local target scope and work id",
  "trust level",
  "The trust label is metadata, not approval",
]) {
  assertIncludes(design, phrase);
}

assert.match(
  design,
  /actual-proof-evidence-recording:v0_1:<candidate_id>:<import_id>:<mapping_id>:<foreign_ref_type>:<foreign_ref_id>:<local_scope>:<local_work_id>:<record_kind>/,
  "design must include the recommended idempotency key shape",
);

for (const phrase of [
  "same key and same payload may return an idempotent replay result without creating another record",
  "same key with different payload must fail closed",
  "same candidate with a different key must fail closed",
  "Idempotency is not retry, replay, publish, or merge authority",
]) {
  assertIncludes(design, phrase);
}

for (const phrase of [
  "no partial proof/evidence record",
  "no work event",
  "no session binding",
  "no imported context mutation",
  "no confirmed mapping mutation",
  "no proposal mutation",
  "no approval row",
  "no publication row",
  "no delivery row",
  "Rollback must be mechanical and local",
]) {
  assertIncludes(design, phrase);
}

for (const phrase of [
  "Existing proof/action-record path",
  "Existing verification evidence path",
  "Split proof and evidence records",
  "New bridge table",
  "Design-only extension first",
]) {
  assertIncludes(design, phrase);
}

for (const phrase of [
  "exactly the approved local proof/evidence record or records were created",
  "no session rows or bindings were created",
  "imported context rows were not mutated",
  "confirmed mapping rows were not mutated",
  "proposal rows were not mutated",
  "failure paths leave no partial writes",
]) {
  assertIncludes(design, phrase);
}

for (const phrase of [
  "candidate id",
  "imported context id",
  "confirmed mapping id",
  "foreign ref type and id",
  "local target scope and work id",
  "intended record kind",
  "actor",
  "reason",
  "redaction status",
  "idempotency key",
  "expected side effects",
  "rollback/failure policy",
]) {
  assertIncludes(design, phrase);
}

for (const phrase of [
  "no proof/evidence recording",
  "no evidence recording",
  "no session binding",
  "no Codex execution or continuation",
  "no work item creation",
  "no work event creation",
  "no imported context mutation",
  "no confirmed mapping mutation",
  "no proposal mutation",
  "no approval, publish, retry, replay, merge, auto-merge, or external posting",
  "no Direct Resume Code",
  "no relay/hosted transfer",
]) {
  assertIncludes(design, phrase);
}

assert.equal(
  pkg.scripts?.["smoke:ag-work-resume-actual-proof-evidence-recording-gate-design"],
  "node scripts/smoke-ag-work-resume-actual-proof-evidence-recording-gate-design.mjs",
  "package.json should register the actual proof/evidence recording gate design smoke",
);

assert.ok(
  joinedPointers.includes(designPath),
  "AG Resume pointer docs should reference the actual proof/evidence recording gate design",
);

const changedFiles = gitChangedFiles();
const allowedChangedFiles = new Set([
  designPath,
  closeoutPath,
  authorityGatePath,
  sessionCodexGatePath,
  reconciliationDesignPath,
  lifecycleDocPath,
  "package.json",
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
  "actual recording gate design PR should be limited to docs, package script, and smoke guards",
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
const runtimeOrSchemaChanged = changedFiles.filter((file) =>
  forbiddenChangedPrefixes.some((prefix) => file.startsWith(prefix)),
);
assert.deepEqual(
  runtimeOrSchemaChanged,
  [],
  "actual recording gate design PR should not change route/helper/UI/runtime/schema/browser files",
);

console.log(
  JSON.stringify(
    {
      smoke: "ag-work-resume-actual-proof-evidence-recording-gate-design",
      design_doc_exists: true,
      design_only: true,
      accepted_for_future_recording_not_recording: true,
      explicit_user_core_approval_required: true,
      source_imported_context_required: true,
      confirmed_mapping_required: true,
      redaction_policy_defined: true,
      trust_provenance_policy_defined: true,
      idempotency_policy_defined: true,
      rollback_failure_policy_defined: true,
      protected_side_effect_boundary_defined: true,
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
    `Expected design content to include: ${expected}`,
  );
}
