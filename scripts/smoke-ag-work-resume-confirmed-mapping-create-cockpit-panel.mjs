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
  "AG_WORK_RESUME_CONFIRMED_MAPPING_CREATE_COCKPIT_PANEL_V0_1.md",
);
const readPanelDocsPath = path.join(
  rootDir,
  "docs",
  "AG_WORK_RESUME_CONFIRMED_MAPPING_READ_COCKPIT_PANEL_V0_1.md",
);
const readDocsPath = path.join(
  rootDir,
  "docs",
  "AG_WORK_RESUME_CONFIRMED_MAPPING_READ_V0_1.md",
);
const routeDocsPath = path.join(
  rootDir,
  "docs",
  "AG_WORK_RESUME_CONFIRMED_MAPPING_ROUTE_V0_1.md",
);
const writerDocsPath = path.join(
  rootDir,
  "docs",
  "AG_WORK_RESUME_CONFIRMED_MAPPING_WRITER_V0_1.md",
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
  "2026-06-01-ag-work-resume-confirmed-mapping-create-cockpit-panel-verification.md",
);

for (const file of [
  componentPath,
  docsPath,
  readPanelDocsPath,
  readDocsPath,
  routeDocsPath,
  writerDocsPath,
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
const gateDocsSource = readFileSync(gateDocsPath, "utf8");
const browserReportSource = readFileSync(browserReportPath, "utf8");
const packageJson = JSON.parse(readFileSync(packagePath, "utf8"));

assert.equal(
  packageJson.scripts?.[
    "smoke:ag-work-resume-confirmed-mapping-create-cockpit-panel"
  ],
  "node scripts/smoke-ag-work-resume-confirmed-mapping-create-cockpit-panel.mjs",
  "package.json must expose the confirmed mapping create Cockpit panel smoke",
);

const panelSource = extractFunctionBlock(
  componentSource,
  "AgResumeConfirmedMappingCreatePanel",
);
const submitHandlerSource = extractFunctionBlock(
  panelSource,
  "handleConfirmedMappingCreateSubmit",
);
const requestBuilderSource = extractFunctionBlock(
  componentSource,
  "buildConfirmedMappingCreateRequestBody",
);
const resultSource = [
  extractFunctionBlock(componentSource, "AgResumeConfirmedMappingCreateResults"),
  extractFunctionBlock(
    componentSource,
    "AgResumeConfirmedMappingCreateAuthorityBoundary",
  ),
  extractFunctionBlock(componentSource, "AgResumeConfirmedMappingCard"),
].join("\n");
const fixtureSource = extractConstAssignment(
  componentSource,
  "SAFE_AG_RESUME_CONFIRMED_MAPPING_CREATE_FIXTURE",
);

assert.match(
  componentSource,
  /<AgResumeMappingProposalLifecycleActionPanel \/>[\s\S]*<AgResumeConfirmedMappingCreatePanel \/>[\s\S]*<AgResumeConfirmedMappingReadPanel \/>/,
  "Operator tab must render create panel after proposal lifecycle actions and before confirmed mapping read panel",
);

for (const token of [
  "AG Resume Confirmed Mapping Create",
  "Bounded create controls for Stage C confirmed mapping identity association rows.",
  "Creates only confirmed mapping foreign/local identity association",
  "Not import, not imported resume context",
  "not\n            session binding",
  "not Codex execution",
  "not approval, publish,\n            retry, replay, or merge authority",
  "No lifecycle mutation controls",
  "no Direct\n            Resume Code",
  "Durable approval remains user/Core gated.",
  "sourceProposalId",
  "foreignScope",
  "foreignWorkId",
  "localScope",
  "localWorkId",
  "packetId",
  "packetHash",
  "sourceRuntimeInstanceId",
  "confirmedBy",
  "confirmationReason",
  "confirmedAt",
  "Confirmed mapping create route error",
]) {
  assert.match(panelSource, new RegExp(escapeRegExp(token)), `panel must include ${token}`);
}

assert.match(
  submitHandlerSource,
  /fetch\(\s*"\/api\/ag-work-resume\/confirmed-mappings"/,
  "panel must call the existing confirmed mappings POST route",
);
assert.match(
  submitHandlerSource,
  /method:\s*"POST"/,
  "panel route call must use POST",
);
assert.match(
  submitHandlerSource,
  /headers:\s*\{\s*"content-type":\s*"application\/json"\s*\}/,
  "panel route call must use JSON content type",
);
assert.match(
  submitHandlerSource,
  /body:\s*JSON\.stringify\(requestBody\)/,
  "panel route call must send JSON built from the request body",
);
assert.doesNotMatch(submitHandlerSource, /method:\s*"GET"/, "panel must not GET");
assert.doesNotMatch(
  submitHandlerSource,
  /\?\\?\$\{searchParams\.toString\(\)\}/,
  "panel must not call the read route with query params",
);
assert.doesNotMatch(
  submitHandlerSource,
  /\b(db|now)\s*:/,
  "panel request must not send db or now",
);

const routeStrings = [
  ...panelSource.matchAll(/["'`]((?:\/api\/)[^"'`]+)["'`]/g),
].map((match) => match[1]);
assert.deepEqual(
  [...new Set(routeStrings)],
  ["/api/ag-work-resume/confirmed-mappings"],
  "panel must not reference any API route except confirmed-mappings POST",
);

assert.equal(
  [...panelSource.matchAll(/\bfetch\(/g)].length,
  1,
  "confirmed mapping create panel must have exactly one route fetch",
);

for (const forbiddenSource of [
  "/api/work",
  "/api/evidence",
  "/api/proof",
  "/api/session",
  "/api/sessions",
  "/api/publication",
  "/api/approval",
  "/api/codex",
  "/api/ag-work-resume/direct",
  "/api/ag-work-resume/resolve",
  "/api/ag-work-resume/import",
  "/api/ag-work-resume/relay",
  "/api/ag-work-resume/mapping-proposal-records",
  "localStorage",
  "sessionStorage",
  "indexedDB",
  "telemetry",
  "analytics",
]) {
  assert.doesNotMatch(
    panelSource,
    new RegExp(escapeRegExp(forbiddenSource), "i"),
    `panel must not reference ${forbiddenSource}`,
  );
}

for (const accessibilityToken of [
  'htmlFor="ag-resume-confirmed-mapping-create-source-proposal-id-input"',
  'htmlFor="ag-resume-confirmed-mapping-create-foreign-scope-input"',
  'htmlFor="ag-resume-confirmed-mapping-create-foreign-work-id-input"',
  'htmlFor="ag-resume-confirmed-mapping-create-local-scope-input"',
  'htmlFor="ag-resume-confirmed-mapping-create-local-work-id-input"',
  'htmlFor="ag-resume-confirmed-mapping-create-packet-id-input"',
  'htmlFor="ag-resume-confirmed-mapping-create-packet-hash-input"',
  'htmlFor="ag-resume-confirmed-mapping-create-source-runtime-instance-id-input"',
  'htmlFor="ag-resume-confirmed-mapping-create-confirmed-by-input"',
  'htmlFor="ag-resume-confirmed-mapping-create-confirmation-reason-input"',
  'htmlFor="ag-resume-confirmed-mapping-create-confirmed-at-input"',
  'id="ag-resume-confirmed-mapping-create-source-proposal-id-input"',
  'id="ag-resume-confirmed-mapping-create-foreign-scope-input"',
  'id="ag-resume-confirmed-mapping-create-foreign-work-id-input"',
  'id="ag-resume-confirmed-mapping-create-local-scope-input"',
  'id="ag-resume-confirmed-mapping-create-local-work-id-input"',
  'id="ag-resume-confirmed-mapping-create-packet-id-input"',
  'id="ag-resume-confirmed-mapping-create-packet-hash-input"',
  'id="ag-resume-confirmed-mapping-create-source-runtime-instance-id-input"',
  'id="ag-resume-confirmed-mapping-create-confirmed-by-input"',
  'id="ag-resume-confirmed-mapping-create-confirmation-reason-input"',
  'id="ag-resume-confirmed-mapping-create-confirmed-at-input"',
  "aria-describedby",
  'role="alert"',
  "aria-busy",
]) {
  assert.match(
    panelSource,
    new RegExp(escapeRegExp(accessibilityToken)),
    `panel must include accessibility token ${accessibilityToken}`,
  );
}

for (const [groupLabel, headingId] of [
  [
    "Confirmed mapping create safe fixture controls",
    "ag-resume-confirmed-mapping-create-safe-fixtures-heading",
  ],
  [
    "Confirmed mapping create inputs",
    "ag-resume-confirmed-mapping-create-inputs-heading",
  ],
  [
    "Confirmed mapping create controls",
    "ag-resume-confirmed-mapping-create-action-controls-heading",
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

assert.match(
  resultSource,
  /aria-live="polite"/,
  "result section must use aria-live polite",
);
assert.match(
  resultSource,
  /aria-labelledby="ag-resume-confirmed-mapping-create-result-heading"/,
  "result section must have a stable labelled heading",
);

for (const requestToken of [
  "source_proposal_id is required for confirmed mapping create.",
  "confirmed_by is required for confirmed mapping create.",
  "confirmation_reason is required for confirmed mapping create.",
  "confirmed_at must be an ISO UTC timestamp with millisecond precision.",
  "source_proposal_id: trimmedSourceProposalId",
  "confirmed_by: trimmedConfirmedBy",
  "confirmation_reason: trimmedConfirmationReason",
  "requestBody.foreign_scope = trimmedForeignScope",
  "requestBody.foreign_work_id = trimmedForeignWorkId",
  "requestBody.local_scope = trimmedLocalScope",
  "requestBody.local_work_id = trimmedLocalWorkId",
  "requestBody.packet_id = trimmedPacketId",
  "requestBody.packet_hash = trimmedPacketHash",
  "requestBody.source_runtime_instance_id = trimmedSourceRuntimeInstanceId",
  "requestBody.confirmed_at = trimmedConfirmedAt",
]) {
  assert.match(
    requestBuilderSource,
    new RegExp(escapeRegExp(requestToken)),
    `request body builder must include ${requestToken}`,
  );
}
assert.doesNotMatch(requestBuilderSource, /\bfetch\(/, "request builder must not fetch");
assert.doesNotMatch(requestBuilderSource, /\/api\//, "request builder must not call routes");
assert.doesNotMatch(
  requestBuilderSource,
  /\b(db|now)\s*[:=]/,
  "request builder must not include db or now fields",
);

for (const fixtureToken of [
  "SAFE_AG_RESUME_CONFIRMED_MAPPING_CREATE_FIXTURE",
  "proposed",
  "needs_review",
  "missing_local",
  "ag-resume-mapping-proposal:",
  "project:foreign",
  "project:augnes",
  "AG-FIXTURE-CONFIRMED-CREATE-PROPOSED-001",
  "AG-FIXTURE-CONFIRMED-CREATE-NEEDS-REVIEW-001",
  "AG-FIXTURE-CONFIRMED-CREATE-MISSING-LOCAL-001",
  "resume-packet:",
  "sha256:",
  "user-core:confirmed-mapping-create",
]) {
  assert.match(
    fixtureSource,
    new RegExp(escapeRegExp(fixtureToken)),
    `fixture must include ${fixtureToken}`,
  );
}

for (const localFunctionName of [
  "loadSafeProposedCreateFixture",
  "loadSafeMatchingIdentityCreateFixture",
  "loadSafeNeedsReviewCreateFixture",
  "loadSafeLocalWorkMissingCreateFixture",
  "clearConfirmedMappingCreateInputs",
]) {
  const source = extractFunctionBlock(panelSource, localFunctionName);
  assert.doesNotMatch(source, /\bfetch\(/, `${localFunctionName} must not fetch`);
  assert.doesNotMatch(source, /\/api\//, `${localFunctionName} must not call routes`);
  assert.doesNotMatch(source, /localStorage|sessionStorage|indexedDB/i);
}

for (const buttonLabel of [
  "Load safe proposed create fixture",
  "Load safe matching identity fixture",
  "Load safe needs_review create fixture",
  "Load safe local work missing fixture",
  "Clear confirmed mapping create inputs",
  "Create confirmed mapping",
]) {
  assert.match(
    panelSource,
    new RegExp(`>\\s*${escapeRegExp(buttonLabel)}\\s*<|\\?\\s*"Creating confirmed mapping"\\s*:\\s*"Create confirmed mapping"`),
    `panel must include button label ${buttonLabel}`,
  );
}

for (const forbiddenLabel of [
  "Import context",
  "Record evidence",
  "Record proof",
  "Bind session",
  "Execute Codex",
  "Approve",
  "Publish",
  "Retry",
  "Replay",
  "Merge",
  "Direct Resume Code",
  "Relay",
  "Read confirmed mappings",
]) {
  assert.doesNotMatch(
    panelSource,
    new RegExp(`>\\s*${escapeRegExp(forbiddenLabel)}\\s*<`, "i"),
    `panel must not expose forbidden button label ${forbiddenLabel}`,
  );
}
assert.doesNotMatch(
  panelSource,
  /role="button"/,
  "panel must not use custom role=button controls",
);

for (const resultToken of [
  "HTTP Status",
  "Route ok",
  "Writer status",
  "mapping_id",
  "source_proposal_id",
  "Submitted create fields",
  "Warnings",
  "Failures",
  "Create Authority Boundary",
  "Record Authority Boundary",
  "foreign_scope",
  "foreign_work_id",
  "local_scope",
  "local_work_id",
  "packet_id",
  "packet_hash",
  "Confirmation metadata",
  "confirmed_by",
  "confirmed_at",
  "confirmation_reason",
  "confirmed_mapping_created",
  "proof_recorded",
  "evidence_recorded",
  "session_bound",
  "codex_executed",
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
  "AG Work Resume Confirmed Mapping Create Cockpit Panel v0.1",
  "POST /api/ag-work-resume/confirmed-mappings",
  "Confirmed mapping remains one foreign work identity associated with one",
  "This create panel does not call the `GET` read route",
  "source_proposal_id",
  "confirmed_by",
  "confirmation_reason",
  "confirmed_at",
  "content-type: application/json",
  "The panel does not send `db`, `now`, or unknown fields.",
  "Load safe proposed create fixture",
  "Load safe matching identity fixture",
  "Load safe needs_review create fixture",
  "Load safe local work missing fixture",
  "Clear confirmed mapping create inputs",
  "Create confirmed mapping",
  "Confirmed mapping create result",
  "no `role=\"button\"",
  "No schema or migration",
  "No route implementation change",
  "No read route call from the create panel",
  "No proof/evidence recording",
  "No session binding",
  "No Codex execution",
  "No MCP/App schema changes",
  "No localStorage, sessionStorage, or indexedDB",
  "Browser Verification Requirement",
  "network proof",
  "DB proof",
]) {
  assert.match(docsSource, new RegExp(escapeRegExp(docsToken)), `docs must include ${docsToken}`);
}

for (const pointerDocs of [
  readPanelDocsSource,
  readDocsSource,
  routeDocsSource,
  writerDocsSource,
  gateDocsSource,
]) {
  assert.match(
    pointerDocs,
    /AG_WORK_RESUME_CONFIRMED_MAPPING_CREATE_COCKPIT_PANEL_V0_1\.md/,
    "pointer docs must link to the confirmed mapping create Cockpit panel doc",
  );
}

for (const reportToken of [
  "AG Resume confirmed mapping create Cockpit panel",
  "Codex in-app Browser",
  "POST /api/ag-work-resume/confirmed-mappings",
  "content-type: application/json",
  "source_proposal_id",
  "confirmed_by",
  "confirmation_reason",
  "confirmed_at",
  "proposed proposal create",
  "needs_review proposal create",
  "missing required local validation",
  "malformed `confirmed_at` local validation",
  "duplicate_active_mapping",
  "local_work_not_found",
  "network proof",
  "no GET read route",
  "DB proof",
  "ag_work_resume_confirmed_mappings",
  "work_events",
  "action_records",
  "verification_evidence_records",
  "sessions",
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

console.log("PASS ag work resume confirmed mapping create cockpit panel smoke");

function assertChangedFilesGuard() {
  const changedFiles = new Set([
    ...gitLines(["diff", "--name-only"]),
    ...gitLines(["diff", "--cached", "--name-only"]),
    ...gitLines(["ls-files", "--others", "--exclude-standard"]),
  ]);
  const allowedFiles = new Set([
    "components/augnes-cockpit.tsx",
    "docs/AG_WORK_RESUME_CONFIRMED_MAPPING_CREATE_COCKPIT_PANEL_V0_1.md",
    "docs/AG_WORK_RESUME_CONFIRMED_MAPPING_READ_COCKPIT_PANEL_V0_1.md",
    "docs/AG_WORK_RESUME_CONFIRMED_MAPPING_READ_V0_1.md",
    "docs/AG_WORK_RESUME_CONFIRMED_MAPPING_ROUTE_V0_1.md",
    "docs/AG_WORK_RESUME_CONFIRMED_MAPPING_WRITER_V0_1.md",
    "docs/AG_WORK_RESUME_CONFIRMED_MAPPING_RECORD_DESIGN_V0_1.md",
    "docs/AG_WORK_RESUME_IMPORTED_CONTEXT_RECORD_DESIGN_V0_1.md",
    "docs/AG_WORK_RESUME_IMPORTED_CONTEXT_DB_SCHEMA_DESIGN_V0_1.md",
    "docs/AG_WORK_RESUME_MAPPING_IMPORT_AUTHORITY_GATE_V0_1.md",
    "package.json",
    "reports/browser/2026-06-01-ag-work-resume-confirmed-mapping-create-cockpit-panel-verification.md",
    "scripts/smoke-ag-work-resume-confirmed-mapping-create-cockpit-panel.mjs",
    "scripts/smoke-ag-work-resume-confirmed-mapping-read-cockpit-panel.mjs",
    "scripts/smoke-ag-work-resume-confirmed-mapping-read.mjs",
    "scripts/smoke-ag-work-resume-confirmed-mapping-route.mjs",
    "scripts/smoke-ag-work-resume-confirmed-mapping-writer.mjs",
    "scripts/smoke-ag-work-resume-confirmed-mapping-db-schema.mjs",
    "scripts/smoke-ag-work-resume-confirmed-mapping-record-design.mjs",
    "scripts/smoke-ag-work-resume-imported-context-record-design.mjs",
    "scripts/smoke-ag-work-resume-imported-context-db-schema-design.mjs",
  ]);
  for (const file of changedFiles) {
    assert.ok(
      allowedFiles.has(file),
      `changed file is outside confirmed mapping create Cockpit panel slice: ${file}`,
    );
    assert.equal(file.startsWith("app/"), false, `no app/api change: ${file}`);
    assert.equal(file.startsWith("apps/"), false, `no MCP/App change: ${file}`);
    assert.equal(file.startsWith("migrations/"), false, `no migration change: ${file}`);
    assert.equal(file.startsWith("lib/"), false, `no lib runtime change: ${file}`);
    assert.notEqual(file, "lib/db/schema.sql", "schema.sql must be unchanged");
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
  const bodyStartMatch = source
    .slice(start)
    .match(/\)\s*(?::\s*[^{]+)?\{/);
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

  throw new Error(`No matching brace found at ${openBrace}`);
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
