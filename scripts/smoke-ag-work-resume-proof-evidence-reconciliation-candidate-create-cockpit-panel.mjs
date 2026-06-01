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
  "AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_CANDIDATE_CREATE_COCKPIT_PANEL_V0_1.md",
);
const readPanelDocsPath = path.join(
  rootDir,
  "docs",
  "AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_CANDIDATE_READ_COCKPIT_PANEL_V0_1.md",
);
const readDocsPath = path.join(
  rootDir,
  "docs",
  "AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_CANDIDATE_READ_V0_1.md",
);
const routeDocsPath = path.join(
  rootDir,
  "docs",
  "AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_CANDIDATE_ROUTE_V0_1.md",
);
const writerDocsPath = path.join(
  rootDir,
  "docs",
  "AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_CANDIDATE_WRITER_V0_1.md",
);
const reconciliationDocsPath = path.join(
  rootDir,
  "docs",
  "AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_DESIGN_V0_1.md",
);
const gatesDocsPath = path.join(
  rootDir,
  "docs",
  "AG_WORK_RESUME_PROOF_EVIDENCE_SESSION_CODEX_GATES_DESIGN_V0_1.md",
);
const gateDocsPath = path.join(
  rootDir,
  "docs",
  "AG_WORK_RESUME_MAPPING_IMPORT_AUTHORITY_GATE_V0_1.md",
);
const packagePath = path.join(rootDir, "package.json");
const browserReportPath = path.join(
  rootDir,
  "reports",
  "browser",
  "2026-06-01-ag-work-resume-proof-evidence-reconciliation-candidate-create-cockpit-panel-verification.md",
);

for (const file of [
  componentPath,
  docsPath,
  readPanelDocsPath,
  readDocsPath,
  routeDocsPath,
  writerDocsPath,
  reconciliationDocsPath,
  gatesDocsPath,
  gateDocsPath,
  packagePath,
  browserReportPath,
]) {
  assert.ok(existsSync(file), `${file} must exist`);
}

const componentSource = readFileSync(componentPath, "utf8");
const docsSource = readFileSync(docsPath, "utf8");
const readPanelDocsSource = readFileSync(readPanelDocsPath, "utf8");
const readDocsSource = readFileSync(readDocsPath, "utf8");
const routeDocsSource = readFileSync(routeDocsPath, "utf8");
const writerDocsSource = readFileSync(writerDocsPath, "utf8");
const reconciliationDocsSource = readFileSync(reconciliationDocsPath, "utf8");
const gatesDocsSource = readFileSync(gatesDocsPath, "utf8");
const gateDocsSource = readFileSync(gateDocsPath, "utf8");
const browserReportSource = readFileSync(browserReportPath, "utf8");
const packageJson = JSON.parse(readFileSync(packagePath, "utf8"));

assert.equal(
  packageJson.scripts?.[
    "smoke:ag-work-resume-proof-evidence-reconciliation-candidate-create-cockpit-panel"
  ],
  "node scripts/smoke-ag-work-resume-proof-evidence-reconciliation-candidate-create-cockpit-panel.mjs",
  "package.json must expose the reconciliation candidate create Cockpit panel smoke",
);

const panelSource = extractFunctionBlock(
  componentSource,
  "AgResumeReconciliationCandidateCreatePanel",
);
const submitHandlerSource = extractFunctionBlock(
  panelSource,
  "handleReconciliationCandidateCreateSubmit",
);
const requestBuilderSource = extractFunctionBlock(
  componentSource,
  "buildReconciliationCandidateCreateRequestBody",
);
const resultSource = [
  extractFunctionBlock(
    componentSource,
    "AgResumeReconciliationCandidateCreateResults",
  ),
  extractFunctionBlock(
    componentSource,
    "AgResumeReconciliationCandidateAuthorityBoundary",
  ),
  extractFunctionBlock(componentSource, "AgResumeReconciliationCandidateCard"),
].join("\n");
const fixtureSource = extractConstAssignment(
  componentSource,
  "SAFE_AG_RESUME_RECONCILIATION_CANDIDATE_CREATE_FIXTURE",
);

assert.match(
  componentSource,
  /<AgResumeImportedContextReadPanel \/>[\s\S]*<AgResumeReconciliationCandidateCreatePanel \/>[\s\S]*<AgResumeReconciliationCandidateReadPanel \/>/,
  "Operator tab must render reconciliation candidate create near candidate read surfaces",
);

for (const token of [
  "AG Resume Reconciliation Candidate Create",
  "Bounded create controls for proof/evidence reconciliation candidate review metadata.",
  "Creates only reconciliation candidate review metadata through the",
  "existing POST reconciliation candidates route",
  "Reconciliation candidates are review metadata only.",
  "Candidate rows are not proof/evidence.",
  "Not proof/evidence recording",
  "not session binding",
  "not Codex",
  "Not work item/event creation",
  "not imported context/confirmed\n            mapping/proposal mutation",
  "Not approval, publish, retry, replay, or merge authority.",
  "importId",
  "mappingId",
  "foreignRefType",
  "foreignRefId",
  "localTargetScope",
  "localTargetWorkId",
  "summary",
  "redactionStatusJson",
  "proposedBy",
  "proposedReason",
  "createdAt",
  "Reconciliation candidate create route error",
]) {
  assert.match(panelSource, new RegExp(escapeRegExp(token)), `panel must include ${token}`);
}

assert.match(
  submitHandlerSource,
  /fetch\(\s*"\/api\/ag-work-resume\/proof-evidence-reconciliation-candidates"/,
  "panel must call the existing reconciliation candidates POST route",
);
assert.match(submitHandlerSource, /method:\s*"POST"/, "panel route call must use POST");
assert.doesNotMatch(submitHandlerSource, /method:\s*"GET"/, "create panel must not GET");
assert.match(
  submitHandlerSource,
  /headers:\s*\{\s*"content-type":\s*"application\/json"\s*\}/,
  "panel POST must set JSON content type",
);
assert.match(
  submitHandlerSource,
  /body:\s*JSON\.stringify\(requestBody\)/,
  "panel POST must send a JSON body built from supported fields",
);
assert.equal(
  [...panelSource.matchAll(/\bfetch\(/g)].length,
  1,
  "reconciliation candidate create panel must have exactly one route fetch",
);

const routeStrings = [
  ...panelSource.matchAll(/["'`]((?:\/api\/)[^"'`]+)["'`]/g),
].map((match) => match[1]);
assert.deepEqual(
  [...new Set(routeStrings)],
  ["/api/ag-work-resume/proof-evidence-reconciliation-candidates"],
  "panel must not reference any API route except reconciliation candidates POST",
);

for (const forbiddenRoute of [
  "/api/work",
  "/api/evidence",
  "/api/proof",
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
  'htmlFor="ag-resume-reconciliation-candidate-create-import-id-input"',
  'htmlFor="ag-resume-reconciliation-candidate-create-mapping-id-input"',
  'htmlFor="ag-resume-reconciliation-candidate-create-foreign-ref-type-input"',
  'htmlFor="ag-resume-reconciliation-candidate-create-foreign-ref-id-input"',
  'htmlFor="ag-resume-reconciliation-candidate-create-local-target-scope-input"',
  'htmlFor="ag-resume-reconciliation-candidate-create-local-target-work-id-input"',
  'htmlFor="ag-resume-reconciliation-candidate-create-summary-input"',
  'htmlFor="ag-resume-reconciliation-candidate-create-redaction-status-json-input"',
  'htmlFor="ag-resume-reconciliation-candidate-create-proposed-by-input"',
  'htmlFor="ag-resume-reconciliation-candidate-create-proposed-reason-input"',
  'htmlFor="ag-resume-reconciliation-candidate-create-created-at-input"',
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
    "Reconciliation candidate create safe fixture controls",
    "ag-resume-reconciliation-candidate-create-safe-fixtures-heading",
  ],
  [
    "Reconciliation candidate create inputs",
    "ag-resume-reconciliation-candidate-create-inputs-heading",
  ],
  [
    "Reconciliation candidate create controls",
    "ag-resume-reconciliation-candidate-create-action-controls-heading",
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

assert.match(resultSource, /aria-live="polite"/, "result section must use aria-live polite");
assert.match(
  resultSource,
  /aria-labelledby="ag-resume-reconciliation-candidate-create-result-heading"/,
  "result section must have a stable labelled heading",
);

for (const requestToken of [
  "import_id is required for reconciliation candidate create.",
  "foreign_ref_type is required for reconciliation candidate create.",
  "foreign_ref_type must be one of proof, evidence, action, session, git, evidence_pack, handoff, or other.",
  "foreign_ref_id is required for reconciliation candidate create.",
  "local_target_scope is required for reconciliation candidate create.",
  "local_target_work_id is required for reconciliation candidate create.",
  "summary is required for reconciliation candidate create.",
  "redaction_status JSON",
  "proposed_by is required for reconciliation candidate create.",
  "proposed_reason is required for reconciliation candidate create.",
  "created_at must be an ISO UTC timestamp with millisecond precision.",
  "redaction_status must explicitly set safe: true",
  "redaction_status must explicitly set",
  "secrets_included",
  "raw_db_paths_included",
  "session_payloads_included",
  "proof_payloads_included",
  "import_id",
  "mapping_id",
  "foreign_ref_type",
  "foreign_ref_id",
  "local_target_scope",
  "local_target_work_id",
  "redaction_status",
  "proposed_by",
  "proposed_reason",
  "created_at",
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
  "SAFE_AG_RESUME_RECONCILIATION_CANDIDATE_CREATE_FIXTURE",
  "ag-resume-imported-context:",
  "ag-resume-confirmed-mapping:",
  "proof",
  "evidence",
  "action",
  "git",
  "proof:foreign-public-safe:reconciliation-candidate-create-001",
  "project:augnes",
  "AG-FIXTURE-RECONCILIATION-CANDIDATE-CREATE-LOCAL-001",
  "redaction_status_json",
  "safe",
  "user-core:reconciliation-candidate-create-cockpit-panel",
  "2026-06-01T06:00:00.000Z",
]) {
  assert.match(
    fixtureSource,
    new RegExp(escapeRegExp(fixtureToken)),
    `fixture must include ${fixtureToken}`,
  );
}

for (const localFunctionName of [
  "loadSafeReconciliationCandidateDerivedMappingFixture",
  "loadSafeReconciliationCandidateExplicitMappingFixture",
  "loadSafeReconciliationCandidateMissingImportFixture",
  "loadSafeReconciliationCandidateInactiveImportFixture",
  "loadSafeReconciliationCandidateMismatchFixture",
  "clearReconciliationCandidateCreateInputs",
]) {
  const source = extractFunctionBlock(panelSource, localFunctionName);
  assert.doesNotMatch(source, /\bfetch\(/, `${localFunctionName} must not fetch`);
  assert.doesNotMatch(source, /\/api\//, `${localFunctionName} must not call routes`);
  assert.doesNotMatch(source, /localStorage|sessionStorage|indexedDB/i);
}

for (const buttonLabel of [
  "Load safe derived mapping create fixture",
  "Load safe explicit mapping create fixture",
  "Load safe missing import create fixture",
  "Load safe inactive import create fixture",
  "Load safe mismatch create fixture",
  "Clear reconciliation candidate create inputs",
  "Create reconciliation candidate",
]) {
  assert.match(
    panelSource,
    new RegExp(`>\\s*${escapeRegExp(buttonLabel)}\\s*<|\\?\\s*"Creating reconciliation candidate"\\s*:\\s*"Create reconciliation candidate"`),
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
  "Writer status",
  "Candidate id",
  "Import id",
  "Mapping id",
  "Foreign ref",
  "Local target",
  "Summary",
  "Redaction status",
  "Proposer",
  "Warnings",
  "Failures",
  "Create Authority Boundary",
  "Record Authority Boundary",
  "candidate_id",
  "import_id",
  "mapping_id",
  "foreign_ref_type",
  "foreign_ref_id",
  "local_target_scope",
  "local_target_work_id",
  "summary",
  "redaction_status",
  "proposed_by",
  "proposed_reason",
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
  "AG Work Resume Proof Evidence Reconciliation Candidate Create Cockpit Panel v0.1",
  "POST /api/ag-work-resume/proof-evidence-reconciliation-candidates",
  "Reconciliation candidates are review metadata only",
  "Candidate rows are not proof/evidence",
  "The create action sends exactly one route request",
  "JSON `Content-Type` header",
  "does not include `db` or `now`",
  "Local Validation",
  "Redaction Validation",
  "safe",
  "secrets_included",
  "raw_db_paths_included",
  "session_payloads_included",
  "proof_payloads_included",
  "Output Rendering",
  "role=\"alert\"",
  "aria-live=\"polite\"",
  "No schema or migration",
  "No read route behavior change",
  "No proof/evidence recording",
  "No session binding",
  "No Codex execution",
  "No work item or work event creation",
  "No imported context mutation",
  "No confirmed mapping mutation",
  "No proposal mutation",
  "No approve, publish, retry, replay, merge",
  "Browser Verification Requirement",
]) {
  assert.match(docsSource, new RegExp(escapeRegExp(docsToken)), `docs must include ${docsToken}`);
}

for (const pointerDocs of [
  readPanelDocsSource,
  readDocsSource,
  routeDocsSource,
  writerDocsSource,
  reconciliationDocsSource,
  gatesDocsSource,
  gateDocsSource,
]) {
  assert.match(
    pointerDocs,
    /AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_CANDIDATE_CREATE_COCKPIT_PANEL_V0_1\.md/,
    "pointer docs must link to the reconciliation candidate create Cockpit panel doc",
  );
}

for (const reportToken of [
  "AG Resume proof/evidence reconciliation candidate create Cockpit panel",
  "Codex in-app Browser",
  "POST /api/ag-work-resume/proof-evidence-reconciliation-candidates",
  "create from active imported context",
  "omitted mapping_id derives",
  "explicit matching mapping_id",
  "missing required local validation",
  "malformed created_at local validation",
  "unsafe redaction local validation",
  "imported_context_not_found",
  "imported_context_not_allowed",
  "imported_context_mismatch",
  "duplicate_candidate",
  "network proof",
  "JSON content-type",
  "supported body fields only",
  "no GET read route call",
  "DB side-effect proof",
  "exactly one candidate row created",
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

console.log("PASS ag work resume proof/evidence reconciliation candidate create cockpit panel smoke");

function assertChangedFilesGuard() {
  const changedFiles = new Set([
    ...gitLines(["diff", "--name-only"]),
    ...gitLines(["diff", "--cached", "--name-only"]),
    ...gitLines(["ls-files", "--others", "--exclude-standard"]),
  ]);
  const allowedFiles = new Set([
    "components/augnes-cockpit.tsx",
    "docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_CANDIDATE_CREATE_COCKPIT_PANEL_V0_1.md",
    "docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_CANDIDATE_READ_COCKPIT_PANEL_V0_1.md",
    "docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_CANDIDATE_READ_V0_1.md",
    "docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_CANDIDATE_ROUTE_V0_1.md",
    "docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_CANDIDATE_WRITER_V0_1.md",
    "docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_DESIGN_V0_1.md",
    "docs/AG_WORK_RESUME_PROOF_EVIDENCE_SESSION_CODEX_GATES_DESIGN_V0_1.md",
    "docs/AG_WORK_RESUME_MAPPING_IMPORT_AUTHORITY_GATE_V0_1.md",
    "reports/browser/2026-06-01-ag-work-resume-proof-evidence-reconciliation-candidate-create-cockpit-panel-verification.md",
    "scripts/smoke-ag-work-resume-proof-evidence-reconciliation-candidate-create-cockpit-panel.mjs",
    "scripts/smoke-ag-work-resume-proof-evidence-reconciliation-candidate-read-cockpit-panel.mjs",
    "scripts/smoke-ag-work-resume-proof-evidence-reconciliation-candidate-read.mjs",
    "scripts/smoke-ag-work-resume-proof-evidence-reconciliation-candidate-route.mjs",
    "scripts/smoke-ag-work-resume-proof-evidence-reconciliation-candidate-writer.mjs",
    "scripts/smoke-ag-work-resume-proof-evidence-reconciliation-candidate-db-schema.mjs",
    "scripts/smoke-ag-work-resume-proof-evidence-reconciliation-design.mjs",
    "scripts/smoke-ag-work-resume-proof-evidence-session-codex-gates-design.mjs",
    "scripts/smoke-ag-work-resume-imported-context-route.mjs",
    "scripts/smoke-ag-work-resume-imported-context-writer.mjs",
    "scripts/smoke-ag-work-resume-mapping-import-authority-gate.mjs",
    "package.json",
  ]);
  for (const file of changedFiles) {
    assert.ok(
      allowedFiles.has(file),
      `changed file is outside reconciliation candidate create Cockpit panel slice: ${file}`,
    );
    assert.equal(file.startsWith("app/"), false, `no app/api change: ${file}`);
    assert.equal(file.startsWith("apps/"), false, `no MCP/App change: ${file}`);
    assert.equal(file.startsWith("migrations/"), false, `no migration change: ${file}`);
    assert.equal(file.startsWith("lib/"), false, `no lib/schema change: ${file}`);
    assert.ok(
      file === "components/augnes-cockpit.tsx" || !file.startsWith("components/"),
      `component changes limited to the Cockpit panel: ${file}`,
    );
    assert.ok(
      file ===
        "reports/browser/2026-06-01-ag-work-resume-proof-evidence-reconciliation-candidate-create-cockpit-panel-verification.md" ||
        !file.startsWith("reports/browser/"),
      `browser report changes limited to reconciliation candidate create Cockpit panel: ${file}`,
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
        continue;
      }
      if (char === "\\") {
        escaped = true;
        continue;
      }
      if (char === quote) quote = null;
      continue;
    }

    if (char === '"' || char === "'" || char === "`") {
      quote = char;
      continue;
    }

    if (char === "{") depth += 1;
    if (char === "}") {
      depth -= 1;
      if (depth === 0) return index;
    }
  }

  throw new Error("No matching brace found");
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
