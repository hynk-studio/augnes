import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, "..");
const componentPath = path.join(rootDir, "components", "augnes-cockpit.tsx");
const docsPath = path.join(
  rootDir,
  "docs",
  "AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_CANDIDATE_LIFECYCLE_ACTION_COCKPIT_PANEL_V0_1.md",
);
const contractDocsPath = path.join(
  rootDir,
  "docs",
  "AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_CANDIDATE_LIFECYCLE_ACTIONS_V0_1.md",
);
const packagePath = path.join(rootDir, "package.json");
const browserReportPath = path.join(
  rootDir,
  "reports",
  "browser",
  "2026-06-01-ag-work-resume-proof-evidence-reconciliation-candidate-lifecycle-verification.md",
);

for (const file of [
  componentPath,
  docsPath,
  contractDocsPath,
  packagePath,
  browserReportPath,
]) {
  assert.ok(existsSync(file), `${file} must exist`);
}

const componentSource = readFileSync(componentPath, "utf8");
const docsSource = readFileSync(docsPath, "utf8");
const contractDocsSource = readFileSync(contractDocsPath, "utf8");
const browserReportSource = readFileSync(browserReportPath, "utf8");
const packageJson = JSON.parse(readFileSync(packagePath, "utf8"));

assert.equal(
  packageJson.scripts?.[
    "smoke:ag-work-resume-proof-evidence-reconciliation-candidate-lifecycle-action-cockpit-panel"
  ],
  "node scripts/smoke-ag-work-resume-proof-evidence-reconciliation-candidate-lifecycle-action-cockpit-panel.mjs",
  "package.json must expose the reconciliation candidate lifecycle Cockpit panel smoke",
);

const panelSource = extractFunctionBlock(
  componentSource,
  "AgResumeReconciliationCandidateLifecycleActionPanel",
);
const submitHandlerSource = extractFunctionBlock(
  panelSource,
  "handleReconciliationCandidateLifecycleActionSubmit",
);
const requestBuilderSource = extractFunctionBlock(
  componentSource,
  "buildReconciliationCandidateLifecycleActionRequestBody",
);
const resultSource = [
  extractFunctionBlock(
    componentSource,
    "AgResumeReconciliationCandidateLifecycleActionResults",
  ),
  extractFunctionBlock(
    componentSource,
    "AgResumeReconciliationCandidateLifecycleRecordSnapshot",
  ),
  extractFunctionBlock(
    componentSource,
    "AgResumeReconciliationCandidateAuthorityBoundary",
  ),
].join("\n");
const fixtureSource = extractConstAssignment(
  componentSource,
  "SAFE_AG_RESUME_RECONCILIATION_CANDIDATE_LIFECYCLE_ACTION_FIXTURE",
);

assert.match(
  componentSource,
  /<AgResumeReconciliationCandidateCreatePanel \/>[\s\S]*<AgResumeReconciliationCandidateLifecycleActionPanel \/>[\s\S]*<AgResumeReconciliationCandidateReadPanel \/>/,
  "Operator tab must render candidate lifecycle controls between candidate create and read surfaces",
);

for (const token of [
  "AG Resume Reconciliation Candidate Lifecycle Actions",
  "Bounded lifecycle controls for proof/evidence reconciliation candidate review metadata.",
  "Lifecycle actions update existing reconciliation candidate review",
  "accepted_for_future_recording",
  "is not proof/evidence",
  "The action submits JSON only to the candidate lifecycle action",
  "Not proof/evidence creation",
  "not session binding",
  "not Codex",
  "Not imported context/confirmed mapping/proposal mutation",
  "not approval, publish, retry, replay, or merge authority",
  "candidateId",
  "action",
  "reviewedBy",
  "reviewNote",
  "reviewedAt",
  "replacementCandidateId",
  "Reconciliation candidate lifecycle route error",
]) {
  assert.match(panelSource, new RegExp(escapeRegExp(token)), `panel must include ${token}`);
}

assert.match(
  submitHandlerSource,
  /fetch\(\s*"\/api\/ag-work-resume\/proof-evidence-reconciliation-candidates\/lifecycle-actions"/,
  "panel must call the candidate lifecycle POST route",
);
assert.match(submitHandlerSource, /method:\s*"POST"/, "panel route call must use POST");
assert.doesNotMatch(submitHandlerSource, /method:\s*"GET"/, "panel must not GET");
assert.match(
  submitHandlerSource,
  /headers:\s*\{\s*"content-type":\s*"application\/json"\s*\}/,
  "panel POST must set JSON content type",
);
assert.equal(
  [...panelSource.matchAll(/\bfetch\(/g)].length,
  1,
  "candidate lifecycle panel must have exactly one route fetch",
);

const routeStrings = [
  ...panelSource.matchAll(/["'`]((?:\/api\/)[^"'`]+)["'`]/g),
].map((match) => match[1]);
assert.deepEqual(
  [...new Set(routeStrings)],
  ["/api/ag-work-resume/proof-evidence-reconciliation-candidates/lifecycle-actions"],
  "panel must not reference any API route except candidate lifecycle actions",
);

for (const forbiddenRoute of [
  "/api/work",
  "/api/session",
  "/api/sessions",
  "/api/publication",
  "/api/approval",
  "/api/codex",
  "/api/ag-work-resume/imported-contexts",
  "/api/ag-work-resume/mapping-proposal-records",
  "/api/ag-work-resume/confirmed-mappings",
  "/api/ag-work-resume/direct",
  "/api/ag-work-resume/resolve",
  "/api/ag-work-resume/relay",
  "bridge",
  "mcp/app",
  "direct resume code",
]) {
  assert.doesNotMatch(
    routeStrings.join("\n"),
    new RegExp(escapeRegExp(forbiddenRoute), "i"),
    `panel API route strings must not reference ${forbiddenRoute}`,
  );
}

for (const forbiddenStorage of [
  "localStorage",
  "sessionStorage",
  "indexedDB",
  "telemetry",
  "analytics",
]) {
  assert.doesNotMatch(
    panelSource,
    new RegExp(escapeRegExp(forbiddenStorage), "i"),
    `panel source must not reference ${forbiddenStorage}`,
  );
}

for (const accessibilityToken of [
  'htmlFor="ag-resume-reconciliation-candidate-lifecycle-candidate-id-input"',
  'htmlFor="ag-resume-reconciliation-candidate-lifecycle-action-input"',
  'htmlFor="ag-resume-reconciliation-candidate-lifecycle-reviewed-by-input"',
  'htmlFor="ag-resume-reconciliation-candidate-lifecycle-review-note-input"',
  'htmlFor="ag-resume-reconciliation-candidate-lifecycle-reviewed-at-input"',
  'htmlFor="ag-resume-reconciliation-candidate-lifecycle-replacement-candidate-id-input"',
  "aria-describedby",
  'role="alert"',
  "aria-busy",
  "<input",
  "<select",
  "<textarea",
  "<button",
]) {
  assert.match(
    panelSource,
    new RegExp(escapeRegExp(accessibilityToken)),
    `panel must include accessibility token ${accessibilityToken}`,
  );
}

for (const [groupLabel, headingId] of [
  [
    "Reconciliation candidate lifecycle safe fixture controls",
    "ag-resume-reconciliation-candidate-lifecycle-safe-fixtures-heading",
  ],
  [
    "Reconciliation candidate lifecycle action inputs",
    "ag-resume-reconciliation-candidate-lifecycle-inputs-heading",
  ],
  [
    "Reconciliation candidate lifecycle action controls",
    "ag-resume-reconciliation-candidate-lifecycle-action-controls-heading",
  ],
]) {
  assert.match(
    panelSource,
    new RegExp(`role="group"[\\s\\S]*?aria-labelledby="${headingId}"`),
    `${groupLabel} must be a labelled control group`,
  );
  assert.match(
    panelSource,
    new RegExp(`id="${headingId}"[\\s\\S]*?${escapeRegExp(groupLabel)}`),
    `${groupLabel} heading must be visible`,
  );
}

for (const requestToken of [
  "candidate_id is required for candidate lifecycle action.",
  "action is required for candidate lifecycle action.",
  "action must be one of: accept_for_future_recording, reject, defer, withdraw, revoke, supersede.",
  "reviewed_by is required for candidate lifecycle action.",
  "review_note is required for candidate lifecycle action.",
  "replacement_candidate_id is allowed only for supersede.",
  "replacement_candidate_id must not equal candidate_id",
  "reviewed_at must be an ISO UTC timestamp with millisecond precision.",
  "candidate_id",
  "action",
  "reviewed_by",
  "review_note",
  "reviewed_at",
  "replacement_candidate_id",
]) {
  assert.match(
    requestBuilderSource,
    new RegExp(escapeRegExp(requestToken)),
    `request builder must include ${requestToken}`,
  );
}
assert.doesNotMatch(requestBuilderSource, /\bfetch\(/, "request builder must not fetch");
assert.doesNotMatch(requestBuilderSource, /\/api\//, "request builder must not call routes");
assert.doesNotMatch(
  requestBuilderSource,
  /\b(db|now)\b/,
  "request builder must not include db or now in route body",
);

for (const fixtureToken of [
  "SAFE_AG_RESUME_RECONCILIATION_CANDIDATE_LIFECYCLE_ACTION_FIXTURE",
  "accept_for_future_recording",
  "reject",
  "defer",
  "withdraw",
  "revoke",
  "supersede",
  "replacement_candidate_id",
  "user-core:reconciliation-candidate-lifecycle-cockpit-panel",
  "2026-06-01T07:00:00.000Z",
]) {
  assert.match(
    fixtureSource,
    new RegExp(escapeRegExp(fixtureToken)),
    `fixture must include ${fixtureToken}`,
  );
}

for (const localFunctionName of [
  "loadSafeReconciliationCandidateLifecycleActionFixture",
  "clearReconciliationCandidateLifecycleActionInputs",
]) {
  const source = extractFunctionBlock(panelSource, localFunctionName);
  assert.doesNotMatch(source, /\bfetch\(/, `${localFunctionName} must not fetch`);
  assert.doesNotMatch(source, /\/api\//, `${localFunctionName} must not call routes`);
  assert.doesNotMatch(source, /localStorage|sessionStorage|indexedDB/i);
}

for (const buttonLabel of [
  "Load safe accept for future recording action",
  "Load safe reject action",
  "Load safe defer action",
  "Load safe withdraw action",
  "Load safe revoke action",
  "Load safe supersede action",
  "Clear reconciliation candidate lifecycle inputs",
  "Apply reconciliation candidate lifecycle action",
]) {
  assert.match(
    panelSource,
    new RegExp(escapeRegExp(buttonLabel)),
    `panel must include button label ${buttonLabel}`,
  );
}

for (const forbiddenLabel of [
  "Record evidence",
  "Record proof",
  "Bind session",
  "Execute Codex",
  "Create work item",
  "Approve",
  "Publish",
  "Retry",
  "Replay",
  "Merge",
]) {
  assert.doesNotMatch(
    panelSource,
    new RegExp(`>\\s*${escapeRegExp(forbiddenLabel)}\\s*<`, "i"),
    `panel must not expose forbidden button label ${forbiddenLabel}`,
  );
}

for (const resultToken of [
  "HTTP Status",
  "Route ok",
  "Lifecycle status",
  "Action",
  "Candidate id",
  "Before/after status",
  "Updated fields",
  "Warnings",
  "Failures",
  "Lifecycle Authority Boundary",
  "Before reconciliation candidate",
  "After reconciliation candidate",
  "reconciliation_candidate_lifecycle_updated",
  "reconciliation_candidate_updated",
  "proof_recorded",
  "evidence_recorded",
  "session_bound",
  "codex_executed",
  "work_item_created",
  "work_event_created",
  "imported_context_updated",
  "confirmed_mapping_updated",
  "proposal_record_updated",
  "approval_granted",
  "publish_retry_replay_authority",
  "merge_authority",
]) {
  assert.match(
    resultSource,
    new RegExp(escapeRegExp(resultToken)),
    `result output must include ${resultToken}`,
  );
}

for (const docsToken of [
  "AG Work Resume Proof Evidence Reconciliation Candidate Lifecycle Action Cockpit Panel v0.1",
  "POST /api/ag-work-resume/proof-evidence-reconciliation-candidates/lifecycle-actions",
  "Lifecycle actions update existing reconciliation candidate review metadata only",
  "accepted_for_future_recording is not proof/evidence recording",
  "Allowed UI",
  "Local Validation",
  "Output Rendering",
  "role=\"alert\"",
  "aria-live=\"polite\"",
  "No proof/evidence recording",
  "No session binding",
  "No Codex execution or continuation",
  "No work item or work event creation",
  "No imported context mutation",
  "No confirmed mapping mutation",
  "No proposal mutation",
  "No approval, publish, retry, replay, merge",
  "Browser Verification Requirement",
]) {
  assert.match(docsSource, new RegExp(escapeRegExp(docsToken)), `docs must include ${docsToken}`);
}

for (const contractToken of [
  "Allowed Transitions",
  "invalid_transition",
  "replacement_not_found",
  "Duplicate actions",
  "accepted_for_future_recording is not proof/evidence recording",
]) {
  assert.match(
    contractDocsSource,
    new RegExp(escapeRegExp(contractToken)),
    `contract docs must include ${contractToken}`,
  );
}

for (const reportToken of [
  "AG Resume proof/evidence reconciliation candidate lifecycle",
  "Codex in-app Browser",
  "POST /api/ag-work-resume/proof-evidence-reconciliation-candidates/lifecycle-actions",
  "successful lifecycle action",
  "invalid action",
  "invalid transition",
  "missing reviewed_by",
  "missing review_note",
  "missing candidate",
  "route failure display",
  "clear/reset behavior",
  "accessibility/keyboard",
  "network proof",
  "DB side-effect proof",
  "protected table count proof",
  "No unauthorized controls",
  "Result: passed",
]) {
  assert.match(
    browserReportSource,
    new RegExp(escapeRegExp(reportToken), "i"),
    `browser report must include ${reportToken}`,
  );
}

assertChangedFilesGuard();

console.log(
  "PASS ag work resume proof/evidence reconciliation candidate lifecycle Cockpit panel smoke",
);

function assertChangedFilesGuard() {
  const changedFiles = new Set([
    ...gitLines(["diff", "--name-only"]),
    ...gitLines(["diff", "--cached", "--name-only"]),
    ...gitLines(["ls-files", "--others", "--exclude-standard"]),
  ]);
  const allowedFiles = new Set([
    "app/api/ag-work-resume/proof-evidence-reconciliation-candidates/lifecycle-actions/route.ts",
    "components/augnes-cockpit.tsx",
    "docs/AG_WORK_RESUME_ACTUAL_PROOF_EVIDENCE_RECORDING_GATE_DESIGN_V0_1.md",
    "docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECORDING_SCHEMA_INTEGRATION_POLICY_V0_1.md",
    "docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECORDING_BRIDGE_TABLE_SCHEMA_DESIGN_V0_1.md",
    "docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECORDING_BRIDGE_TABLE_MIGRATION_POLICY_V0_1.md",
    "docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECORDING_COCKPIT_GATE_DESIGN_V0_1.md",
    "docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECORDING_ROUTE_GATE_DESIGN_V0_1.md",
    "docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECORDING_WRITER_HELPER_GATE_DESIGN_V0_1.md",
    "docs/AG_WORK_RESUME_CROSS_LOCAL_CONTINUITY_REVIEW_METADATA_CLOSEOUT_V0_1.md",
    "docs/AG_WORK_RESUME_IMPORTED_CONTEXT_READ_V0_1.md",
    "docs/AG_WORK_RESUME_IMPORTED_CONTEXT_ROUTE_V0_1.md",
    "docs/AG_WORK_RESUME_IMPORTED_CONTEXT_WRITER_V0_1.md",
    "docs/AG_WORK_RESUME_MAPPING_IMPORT_AUTHORITY_GATE_V0_1.md",
    "docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_CANDIDATE_CREATE_COCKPIT_PANEL_V0_1.md",
    "docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_CANDIDATE_DB_SCHEMA_DESIGN_V0_1.md",
    "docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_CANDIDATE_DB_SCHEMA_IMPLEMENTATION_V0_1.md",
    "docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_CANDIDATE_LIFECYCLE_ACTIONS_V0_1.md",
    "docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_CANDIDATE_LIFECYCLE_ACTION_COCKPIT_PANEL_V0_1.md",
    "docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_CANDIDATE_READ_COCKPIT_PANEL_V0_1.md",
    "docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_CANDIDATE_READ_V0_1.md",
    "docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_CANDIDATE_ROUTE_V0_1.md",
    "docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_CANDIDATE_WRITER_V0_1.md",
    "docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_DESIGN_V0_1.md",
    "docs/AG_WORK_RESUME_PROOF_EVIDENCE_SESSION_CODEX_GATES_DESIGN_V0_1.md",
    "lib/db/schema.sql",
    "lib/ag-work-resume-proof-evidence-recording.ts",
    "app/api/ag-work-resume/proof-evidence-recordings/route.ts",
    "lib/ag-work-resume-proof-evidence-reconciliation-candidate-lifecycle-action.ts",
    "package.json",
    "reports/browser/2026-06-01-ag-work-resume-proof-evidence-reconciliation-candidate-lifecycle-verification.md",
    "reports/browser/2026-06-02-ag-work-resume-proof-evidence-recording-cockpit-verification.md",
    "scripts/ag-work-resume-proof-evidence-reconciliation-candidate-lifecycle-action.mjs",
    "scripts/ag-work-resume-proof-evidence-recording-create.mjs",
    "scripts/smoke-ag-work-resume-proof-evidence-recording-writer-helper.mjs",
    "scripts/smoke-ag-work-resume-proof-evidence-recording-route-gate-design.mjs",
    "scripts/smoke-ag-work-resume-proof-evidence-recording-route.mjs",
    "scripts/smoke-ag-work-resume-proof-evidence-recording-cockpit-gate-design.mjs",
    "scripts/smoke-ag-work-resume-proof-evidence-recording-cockpit-panel.mjs",
    "scripts/smoke-ag-work-resume-actual-proof-evidence-recording-gate-design.mjs",
    "scripts/smoke-ag-work-resume-proof-evidence-recording-schema-integration-policy.mjs",
    "scripts/smoke-ag-work-resume-proof-evidence-recording-bridge-table-schema-design.mjs",
    "scripts/smoke-ag-work-resume-proof-evidence-recording-bridge-table-migration-policy.mjs",
    "scripts/smoke-ag-work-resume-proof-evidence-recording-bridge-table-schema.mjs",
    "scripts/smoke-ag-work-resume-proof-evidence-recording-writer-helper-gate-design.mjs",
    "scripts/smoke-ag-work-resume-proof-evidence-reconciliation-candidate-create-cockpit-panel.mjs",
    "scripts/smoke-ag-work-resume-proof-evidence-reconciliation-candidate-db-schema.mjs",
    "scripts/smoke-ag-work-resume-proof-evidence-reconciliation-candidate-lifecycle-action.mjs",
    "scripts/smoke-ag-work-resume-proof-evidence-reconciliation-candidate-lifecycle-action-cockpit-panel.mjs",
    "scripts/smoke-ag-work-resume-proof-evidence-reconciliation-candidate-lifecycle-action-route.mjs",
    "scripts/smoke-ag-work-resume-proof-evidence-reconciliation-candidate-read-cockpit-panel.mjs",
    "scripts/smoke-ag-work-resume-proof-evidence-reconciliation-candidate-read.mjs",
    "scripts/smoke-ag-work-resume-proof-evidence-reconciliation-candidate-route.mjs",
    "scripts/smoke-ag-work-resume-proof-evidence-reconciliation-candidate-writer.mjs",
    "scripts/smoke-ag-work-resume-proof-evidence-reconciliation-design.mjs",
    "scripts/smoke-ag-work-resume-proof-evidence-session-codex-gates-design.mjs",
    "scripts/smoke-ag-work-resume-review-metadata-closeout.mjs",
    "scripts/smoke-ag-work-resume-imported-context-route.mjs",
    "scripts/smoke-ag-work-resume-imported-context-writer.mjs",
  ]);
  for (const file of changedFiles) {
    assert.ok(
      allowedFiles.has(file),
      `changed file is outside reconciliation candidate lifecycle Cockpit panel slice: ${file}`,
    );
  }
}

function gitLines(args) {
  return execFileSync("git", args, {
    cwd: rootDir,
    encoding: "utf8",
  })
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function extractFunctionBlock(source, functionName) {
  const signature = `function ${functionName}`;
  const start = source.indexOf(signature);
  assert.notEqual(start, -1, `${functionName} must exist`);
  const bodyStartMatch = source.slice(start).match(/\)\s*(?::[^{]+)?\{/);
  assert.ok(bodyStartMatch, `${functionName} must have a body`);
  const openBrace =
    start + bodyStartMatch.index + bodyStartMatch[0].lastIndexOf("{");
  return source.slice(start, findMatchingBrace(source, openBrace) + 1);
}

function extractConstAssignment(source, constName) {
  const signature = `const ${constName}`;
  const start = source.indexOf(signature);
  assert.notEqual(start, -1, `${constName} must exist`);
  const end = source.indexOf("} as const;", start);
  assert.notEqual(end, -1, `${constName} must end with as const`);
  return source.slice(start, end + "} as const;".length);
}

function findMatchingBrace(source, openBrace) {
  let depth = 0;
  let quote = null;
  let escaped = false;
  for (let index = openBrace; index < source.length; index += 1) {
    const char = source[index];
    if (quote) {
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === quote) {
        quote = null;
      }
      continue;
    }
    if (char === "'" || char === '"' || char === "`") {
      quote = char;
      continue;
    }
    if (char === "{") depth += 1;
    if (char === "}") {
      depth -= 1;
      if (depth === 0) return index;
    }
  }
  throw new Error("Unable to find matching brace.");
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
