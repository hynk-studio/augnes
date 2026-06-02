import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, "..");
const componentPath = path.join(rootDir, "components", "augnes-cockpit.tsx");
const gateDesignPath = path.join(
  rootDir,
  "docs",
  "AG_WORK_RESUME_PROOF_EVIDENCE_RECORDING_COCKPIT_GATE_DESIGN_V0_1.md",
);
const browserReportPath = path.join(
  rootDir,
  "reports",
  "browser",
  "2026-06-02-ag-work-resume-proof-evidence-recording-cockpit-verification.md",
);
const packagePath = path.join(rootDir, "package.json");
const routePath = path.join(
  rootDir,
  "app",
  "api",
  "ag-work-resume",
  "proof-evidence-recordings",
  "route.ts",
);
const writerHelperPath = path.join(
  rootDir,
  "lib",
  "ag-work-resume-proof-evidence-recording.ts",
);
const schemaPath = path.join(rootDir, "lib", "db", "schema.sql");

for (const file of [
  componentPath,
  gateDesignPath,
  browserReportPath,
  packagePath,
  routePath,
  writerHelperPath,
  schemaPath,
]) {
  assert.ok(existsSync(file), `${file} must exist`);
}

const componentSource = readFileSync(componentPath, "utf8");
const gateDesignSource = readFileSync(gateDesignPath, "utf8");
const browserReportSource = readFileSync(browserReportPath, "utf8");
const routeSource = readFileSync(routePath, "utf8");
const writerHelperSource = readFileSync(writerHelperPath, "utf8");
const packageJson = JSON.parse(readFileSync(packagePath, "utf8"));

assert.equal(
  packageJson.scripts?.[
    "smoke:ag-work-resume-proof-evidence-recording-cockpit-panel"
  ],
  "node scripts/smoke-ag-work-resume-proof-evidence-recording-cockpit-panel.mjs",
  "package.json must expose the proof/evidence recording Cockpit panel smoke",
);

const panelSource = extractFunctionBlock(
  componentSource,
  "AgResumeProofEvidenceRecordingGatePanel",
);
const submitHandlerSource = extractFunctionBlock(
  panelSource,
  "handleProofEvidenceRecordingSubmit",
);
const requestBuilderSource = [
  extractFunctionBlock(
    componentSource,
    "buildAgResumeProofEvidenceRecordingRequestBody",
  ),
  extractFunctionBlock(
    componentSource,
    "assertNoAgResumeProofEvidenceRecordingForbiddenJsonFields",
  ),
  extractFunctionBlock(
    componentSource,
    "assertAgResumeProofEvidenceRecordingAllowedKeys",
  ),
].join("\n");
const resultsSource = [
  extractFunctionBlock(componentSource, "AgResumeProofEvidenceRecordingResults"),
  extractFunctionBlock(
    componentSource,
    "AgResumeProofEvidenceRecordingAuthorityBoundary",
  ),
].join("\n");
const fixtureSource = extractConstAssignment(
  componentSource,
  "SAFE_AG_RESUME_PROOF_EVIDENCE_RECORDING_FIXTURE",
);
const routeConstantSource = extractConstAssignment(
  componentSource,
  "AG_RESUME_PROOF_EVIDENCE_RECORDING_ROUTE",
);

assert.match(
  componentSource,
  /<AgResumeReconciliationCandidateLifecycleActionPanel \/>[\s\S]*<AgResumeReconciliationCandidateReadPanel \/>[\s\S]*<AgResumeProofEvidenceRecordingGatePanel \/>/,
  "Operator tab must render the recording gate after reconciliation candidate lifecycle/read surfaces",
);

assert.match(
  routeConstantSource,
  /"\/api\/ag-work-resume\/proof-evidence-recordings"/,
  "recording route constant must be the existing bounded route",
);
assert.match(
  submitHandlerSource,
  /fetch\(AG_RESUME_PROOF_EVIDENCE_RECORDING_ROUTE/,
  "panel submit must call only the recording route constant",
);
assert.match(submitHandlerSource, /method:\s*"POST"/, "submit must use POST");
assert.match(
  submitHandlerSource,
  /headers:\s*\{\s*"content-type":\s*"application\/json"\s*\}/,
  "submit must send application/json",
);
assert.equal(
  [...panelSource.matchAll(/\bfetch\(/g)].length,
  1,
  "recording panel must have exactly one fetch call",
);

for (const token of [
  "AG Resume Proof/Evidence Recording Gate",
  "Bounded Operator UI for one exact user/Core-approved proof/evidence recording attempt through the existing route.",
  "accepted_for_future_recording is not proof/evidence recording.",
  "Route success is not broader approval.",
  "Actual recording requires exact user/Core approval for this attempt.",
  "This UI calls only POST /api/ag-work-resume/proof-evidence-recordings",
  "must not weaken route/helper validation",
  "Record verification evidence",
  "Load safe fixture (not approval)",
  "Fixture data is not approval",
  "does not auto-submit",
  "candidate_id",
  "import_id cross-check",
  "mapping_id cross-check",
  "user_core_approval JSON object",
  "actor",
  "reason",
  "redaction_summary JSON object",
  "trust_provenance_label",
  "local_target_scope",
  "local_target_work_id",
  "expected_idempotency_key cross-check",
  "I have exact user/Core approval for this recording attempt.",
  "typed confirmation phrase",
  "record verification evidence",
]) {
  assert.match(panelSource, new RegExp(escapeRegExp(token)), `panel must include ${token}`);
}

for (const accessibilityToken of [
  'htmlFor="ag-resume-proof-evidence-recording-candidate-id-input"',
  'htmlFor="ag-resume-proof-evidence-recording-import-id-input"',
  'htmlFor="ag-resume-proof-evidence-recording-mapping-id-input"',
  'htmlFor="ag-resume-proof-evidence-recording-user-core-approval-input"',
  'htmlFor="ag-resume-proof-evidence-recording-actor-input"',
  'htmlFor="ag-resume-proof-evidence-recording-reason-input"',
  'htmlFor="ag-resume-proof-evidence-recording-redaction-summary-input"',
  'htmlFor="ag-resume-proof-evidence-recording-trust-label-input"',
  'htmlFor="ag-resume-proof-evidence-recording-local-target-scope-input"',
  'htmlFor="ag-resume-proof-evidence-recording-local-target-work-id-input"',
  'htmlFor="ag-resume-proof-evidence-recording-idempotency-key-input"',
  'htmlFor="ag-resume-proof-evidence-recording-confirmation-checkbox"',
  'htmlFor="ag-resume-proof-evidence-recording-confirmation-phrase-input"',
  "aria-describedby",
  'role="alert"',
  "aria-busy",
  "<input",
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
    "Proof/evidence recording safe fixture controls",
    "ag-resume-proof-evidence-recording-safe-fixture-heading",
  ],
  [
    "Proof/evidence recording inputs",
    "ag-resume-proof-evidence-recording-inputs-heading",
  ],
  [
    "Proof/evidence recording confirmation",
    "ag-resume-proof-evidence-recording-confirmation-heading",
  ],
  [
    "Proof/evidence recording controls",
    "ag-resume-proof-evidence-recording-action-controls-heading",
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

for (const validationToken of [
  "candidate_id is required for proof/evidence recording.",
  "actor is required for proof/evidence recording.",
  "reason is required for proof/evidence recording.",
  "trust_provenance_label is required for proof/evidence recording.",
  "local_target_scope is required for proof/evidence recording.",
  "local_target_work_id is required for proof/evidence recording.",
  "Exact user/Core approval checkbox is required for proof/evidence recording.",
  "typed confirmation phrase must exactly match record verification evidence.",
  "user_core_approval JSON",
  "redaction_summary JSON",
  "includes forbidden field",
  "includes unsupported field(s)",
]) {
  assert.match(
    requestBuilderSource,
    new RegExp(escapeRegExp(validationToken)),
    `request builder must include validation token ${validationToken}`,
  );
}

for (const supportedField of [
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
]) {
  assert.match(
    requestBuilderSource,
    new RegExp(escapeRegExp(supportedField)),
    `request builder must include supported field ${supportedField}`,
  );
}

for (const forbiddenField of [
  "db",
  "now",
  "session_id",
  "bind_session",
  "codex_continue",
  "codex_execute",
  "work_item_create",
  "work_event_create",
  "action_record",
  "mutate_imported_context",
  "mutate_confirmed_mapping",
  "mutate_proposal",
  "mutate_candidate",
  "approval_request_id",
  "approval_decision_id",
  "publish",
  "retry",
  "replay",
  "merge",
  "auto_merge",
  "external_post",
  "direct_resume_code",
  "relay_transfer",
  "hosted_transfer",
]) {
  assert.match(
    componentSource,
    new RegExp(`["']${escapeRegExp(forbiddenField)}["']`),
    `forbidden field guard must include ${forbiddenField}`,
  );
  assert.doesNotMatch(
    requestBuilderSource,
    new RegExp(`\\b${escapeRegExp(forbiddenField)}\\s*:`),
    `request body must not submit forbidden field ${forbiddenField}`,
  );
}

for (const localFunctionName of [
  "loadSafeProofEvidenceRecordingFixture",
  "clearProofEvidenceRecordingInputs",
]) {
  const source = extractFunctionBlock(panelSource, localFunctionName);
  assert.doesNotMatch(source, /\bfetch\(/, `${localFunctionName} must not fetch`);
  assert.doesNotMatch(source, /\/api\//, `${localFunctionName} must not call routes`);
  assert.doesNotMatch(source, /localStorage|sessionStorage|indexedDB|cookies|telemetry/i);
}
assert.match(
  extractFunctionBlock(panelSource, "loadSafeProofEvidenceRecordingFixture"),
  /setHasExactApproval\(false\)[\s\S]*setTypedConfirmationPhrase\(""\)/,
  "safe fixture must still require checkbox and typed confirmation",
);
assert.match(
  extractFunctionBlock(panelSource, "clearProofEvidenceRecordingInputs"),
  /setUserCoreApprovalJson\(""\)[\s\S]*setHasExactApproval\(false\)[\s\S]*setTypedConfirmationPhrase\(""\)[\s\S]*setResult\(null\)/,
  "clear/reset must clear approval, confirmation, phrase, and result state",
);

for (const forbiddenControlLabel of [
  "Run Codex",
  "Continue Codex",
  "Bind session",
  "Create work item",
  "Create work event",
  "Create action record",
  "Approve",
  "Publish",
  "Retry",
  "Replay",
  "Merge",
  "Auto-merge",
  "External post",
  "Mutate imported context",
  "Mutate confirmed mapping",
  "Mutate proposal",
  "Mutate reconciliation candidate",
  "Direct Resume Code",
  "Relay transfer",
  "Hosted transfer",
]) {
  assert.doesNotMatch(
    panelSource,
    new RegExp(`>\\s*${escapeRegExp(forbiddenControlLabel)}\\s*<`, "i"),
    `panel must not expose forbidden control ${forbiddenControlLabel}`,
  );
}

for (const forbiddenCall of [
  "createAgWorkResumeProofEvidenceRecordingFromCandidate",
  "Codex APIs/helpers",
  "session binding helpers",
  "action-record writers",
  "work item/event writers",
  "imported context writers",
  "confirmed mapping writers",
  "proposal writers",
  "reconciliation candidate lifecycle writers",
  "approval/publish/retry/replay/merge helpers",
  "OpenAI APIs",
  "GitHub APIs",
  "MCP tools",
  "Browser automation",
]) {
  assert.doesNotMatch(
    componentSource,
    new RegExp(escapeRegExp(forbiddenCall)),
    `component source must not reference forbidden call ${forbiddenCall}`,
  );
}

assert.doesNotMatch(
  componentSource,
  /import\s+[^;]*createAgWorkResumeProofEvidenceRecordingFromCandidate/,
  "component must not import the writer/helper",
);
assert.doesNotMatch(
  componentSource,
  /from\s+["']@\/lib\/ag-work-resume-proof-evidence-recording["']/,
  "component must not import proof/evidence recording helper module",
);
assert.doesNotMatch(
  panelSource,
  /localStorage|sessionStorage|indexedDB|cookies|telemetry|analytics/i,
  "panel must not persist approval or telemetry",
);

for (const resultToken of [
  "Proof/evidence recording result",
  "HTTP Status",
  "Route result",
  "Created",
  "candidate_id",
  "evidence_id",
  "recording_link_id",
  "idempotency_key",
  "target_record_kind",
  "Warnings",
  "Failures",
  "Bounded recommended next step",
  "authority_boundary",
  "verification_evidence_record_created",
  "bridge_link_created",
  "proof_recorded",
  "action_record_created",
  "session_bound",
  "codex_executed",
  "work_item_created",
  "work_event_created",
  "imported_context_mutated",
  "confirmed_mapping_mutated",
  "proposal_record_mutated",
  "reconciliation_candidate_mutated",
  "approval_granted",
  "publish_retry_replay_authority",
  "merge_authority",
  "auto_merge_authority",
  "external_posting_authority",
  "committed_state_mutated",
  "Allowed insert tables",
]) {
  assert.match(
    resultsSource,
    new RegExp(escapeRegExp(resultToken)),
    `result output must include ${resultToken}`,
  );
}

for (const fixtureToken of [
  "SAFE_AG_RESUME_PROOF_EVIDENCE_RECORDING_FIXTURE",
  "ag-resume-proof-evidence-reconciliation-candidate:cockpit-recording-safe-001",
  "ag-resume-imported-context:cockpit-recording-safe-001",
  "ag-resume-confirmed-mapping:cockpit-recording-safe-001",
  "AG-COCKPIT-RECORDING-001",
  "foreign_summary_user_core_attested",
  "verification_evidence_records",
  "ag_work_resume_proof_evidence_recording_links",
  "action_records",
  "sessions",
  "work_items",
  "work_events",
]) {
  assert.match(
    fixtureSource,
    new RegExp(escapeRegExp(fixtureToken)),
    `fixture must include ${fixtureToken}`,
  );
}

for (const designToken of [
  "AG Resume Proof/Evidence Recording Cockpit Gate Design v0.1",
  "POST /api/ag-work-resume/proof-evidence-recordings",
  "accepted_for_future_recording is not proof/evidence recording.",
  "Route success is not broader approval.",
  "Actual recording requires exact user/Core approval for this attempt.",
  "Record verification evidence",
  "Load safe fixture (not approval)",
]) {
  assert.match(gateDesignSource, new RegExp(escapeRegExp(designToken)));
}

for (const reportToken of [
  "AG Resume proof/evidence recording Cockpit gate",
  "Codex in-app Browser",
  "Operator tab",
  "boundary copy",
  "keyboard flow",
  "invalid approval JSON",
  "invalid redaction JSON",
  "missing approval/checkbox/typed confirmation",
  "POST /api/ag-work-resume/proof-evidence-recordings",
  "evidence_id",
  "recording_link_id",
  "verification_evidence_records",
  "ag_work_resume_proof_evidence_recording_links",
  "idempotent_no_new_write",
  "public-safe bounded failure text",
  "clear/reset behavior",
  "unauthorized controls scan",
  "network proof",
  "protected table counts unchanged",
  "Result: passed",
]) {
  assert.match(
    browserReportSource,
    new RegExp(escapeRegExp(reportToken), "i"),
    `browser report must include ${reportToken}`,
  );
}

assert.match(
  routeSource,
  /createAgWorkResumeProofEvidenceRecordingFromCandidate/,
  "route must still delegate to the writer/helper",
);
assert.match(
  writerHelperSource,
  /AG Resume actual proof\/evidence recording writes exactly one verification_evidence_records row/,
  "writer/helper authority statement must remain present",
);
assertChangedFilesGuard();

console.log(
  "PASS ag work resume proof/evidence recording Cockpit panel smoke",
);

function assertChangedFilesGuard() {
  const changedFiles = new Set([
    ...gitLinesAllowFailure(["diff", "--name-only", "origin/main...HEAD"]),
    ...gitLines(["diff", "--name-only"]),
    ...gitLines(["diff", "--cached", "--name-only"]),
    ...gitLines(["ls-files", "--others", "--exclude-standard"]),
  ]);
  const allowedFiles = new Set([
    "components/augnes-cockpit.tsx",
    "package.json",
    "reports/browser/2026-06-02-ag-work-resume-proof-evidence-recording-cockpit-verification.md",
    "scripts/smoke-ag-work-resume-proof-evidence-recording-cockpit-panel.mjs",
    "scripts/smoke-ag-work-resume-proof-evidence-recording-cockpit-gate-design.mjs",
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
  for (const file of changedFiles) {
    assert.ok(
      allowedFiles.has(file),
      `changed file is outside proof/evidence recording Cockpit panel slice: ${file}`,
    );
  }
  for (const forbiddenPath of [
    "app/api/ag-work-resume/proof-evidence-recordings/route.ts",
    "lib/ag-work-resume-proof-evidence-recording.ts",
    "lib/db/schema.sql",
  ]) {
    assert.equal(
      changedFiles.has(forbiddenPath),
      false,
      `implementation PR must not change ${forbiddenPath}`,
    );
  }
}

function gitLines(args) {
  return execFileSync("git", args, { cwd: rootDir, encoding: "utf8" })
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
  const nextConst = source.indexOf("\nconst ", start + signature.length);
  const nextFunction = source.indexOf("\nfunction ", start + signature.length);
  const candidates = [nextConst, nextFunction].filter((index) => index !== -1);
  const end = candidates.length > 0 ? Math.min(...candidates) : source.length;
  return source.slice(start, end);
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
