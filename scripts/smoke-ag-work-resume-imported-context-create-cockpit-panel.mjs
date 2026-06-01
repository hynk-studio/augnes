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
  "AG_WORK_RESUME_IMPORTED_CONTEXT_CREATE_COCKPIT_PANEL_V0_1.md",
);
const readPanelDocsPath = path.join(
  rootDir,
  "docs",
  "AG_WORK_RESUME_IMPORTED_CONTEXT_READ_COCKPIT_PANEL_V0_1.md",
);
const readDocsPath = path.join(
  rootDir,
  "docs",
  "AG_WORK_RESUME_IMPORTED_CONTEXT_READ_V0_1.md",
);
const routeDocsPath = path.join(
  rootDir,
  "docs",
  "AG_WORK_RESUME_IMPORTED_CONTEXT_ROUTE_V0_1.md",
);
const writerDocsPath = path.join(
  rootDir,
  "docs",
  "AG_WORK_RESUME_IMPORTED_CONTEXT_WRITER_V0_1.md",
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
  "2026-06-01-ag-work-resume-imported-context-create-cockpit-panel-verification.md",
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
    "smoke:ag-work-resume-imported-context-create-cockpit-panel"
  ],
  "node scripts/smoke-ag-work-resume-imported-context-create-cockpit-panel.mjs",
  "package.json must expose the imported context create Cockpit panel smoke",
);

const panelSource = extractFunctionBlock(
  componentSource,
  "AgResumeImportedContextCreatePanel",
);
const submitHandlerSource = extractFunctionBlock(
  panelSource,
  "handleImportedContextCreateSubmit",
);
const requestBuilderSource = extractFunctionBlock(
  componentSource,
  "buildImportedContextCreateRequestBody",
);
const resultSource = [
  extractFunctionBlock(componentSource, "AgResumeImportedContextCreateResults"),
  extractFunctionBlock(
    componentSource,
    "AgResumeImportedContextAuthorityBoundary",
  ),
  extractFunctionBlock(componentSource, "AgResumeImportedContextCard"),
].join("\n");
const fixtureSource = extractConstAssignment(
  componentSource,
  "SAFE_AG_RESUME_IMPORTED_CONTEXT_CREATE_FIXTURE",
);

assert.match(
  componentSource,
  /<AgResumeConfirmedMappingReadPanel \/>[\s\S]*<AgResumeImportedContextCreatePanel \/>[\s\S]*<AgResumeImportedContextReadPanel \/>/,
  "Operator tab must render imported context create near imported context read surfaces",
);

for (const token of [
  "AG Resume Imported Context Create",
  "Bounded create controls for Stage D imported context review metadata.",
  "Creates only imported context review metadata through the existing",
  "POST imported contexts route",
  "Imported context is bounded review metadata only.",
  "Not proof/evidence",
  "not session binding",
  "not Codex",
  "Not work item/event creation",
  "not confirmed mapping/proposal",
  "Not approval, publish, retry, replay, or merge authority.",
  "mappingId",
  "packetId",
  "packetHash",
  "sourceRuntimeInstanceId",
  "foreignScope",
  "foreignWorkId",
  "localScope",
  "localWorkId",
  "importedSummary",
  "importedExpectedFilesJson",
  "importedExpectedChecksJson",
  "foreignRefsSummaryJson",
  "redactionReportJson",
  "createdBy",
  "importReason",
  "createdAt",
  "Imported context create route error",
]) {
  assert.match(panelSource, new RegExp(escapeRegExp(token)), `panel must include ${token}`);
}

assert.match(
  submitHandlerSource,
  /fetch\(\s*"\/api\/ag-work-resume\/imported-contexts"/,
  "panel must call the existing imported contexts route",
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
  "imported context create panel must have exactly one route fetch",
);

const routeStrings = [
  ...panelSource.matchAll(/["'`]((?:\/api\/)[^"'`]+)["'`]/g),
].map((match) => match[1]);
assert.deepEqual(
  [...new Set(routeStrings)],
  ["/api/ag-work-resume/imported-contexts"],
  "panel must not reference any API route except imported-contexts POST",
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
  "/api/ag-work-resume/direct",
  "/api/ag-work-resume/resolve",
  "/api/ag-work-resume/relay",
  "/api/ag-work-resume/mapping-proposal-records",
  "/api/ag-work-resume/confirmed-mappings",
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
  'htmlFor="ag-resume-imported-context-create-mapping-id-input"',
  'htmlFor="ag-resume-imported-context-create-packet-id-input"',
  'htmlFor="ag-resume-imported-context-create-packet-hash-input"',
  'htmlFor="ag-resume-imported-context-create-source-runtime-instance-id-input"',
  'htmlFor="ag-resume-imported-context-create-foreign-scope-input"',
  'htmlFor="ag-resume-imported-context-create-foreign-work-id-input"',
  'htmlFor="ag-resume-imported-context-create-local-scope-input"',
  'htmlFor="ag-resume-imported-context-create-local-work-id-input"',
  'htmlFor="ag-resume-imported-context-create-imported-summary-input"',
  'htmlFor="ag-resume-imported-context-create-expected-files-input"',
  'htmlFor="ag-resume-imported-context-create-expected-checks-input"',
  'htmlFor="ag-resume-imported-context-create-foreign-refs-input"',
  'htmlFor="ag-resume-imported-context-create-redaction-report-input"',
  'htmlFor="ag-resume-imported-context-create-created-by-input"',
  'htmlFor="ag-resume-imported-context-create-import-reason-input"',
  'htmlFor="ag-resume-imported-context-create-created-at-input"',
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
    "Imported context create safe fixture controls",
    "ag-resume-imported-context-create-safe-fixtures-heading",
  ],
  [
    "Imported context create inputs",
    "ag-resume-imported-context-create-inputs-heading",
  ],
  [
    "Imported context create controls",
    "ag-resume-imported-context-create-action-controls-heading",
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
  /aria-labelledby="ag-resume-imported-context-create-result-heading"/,
  "result section must have a stable labelled heading",
);

for (const requestToken of [
  "mapping_id is required for imported context create.",
  "packet_id is required for imported context create.",
  "packet_hash is required for imported context create.",
  "imported_summary is required for imported context create.",
  "created_by is required for imported context create.",
  "import_reason is required for imported context create.",
  "created_at must be an ISO UTC timestamp with millisecond precision.",
  "imported_expected_files JSON",
  "imported_expected_checks JSON",
  "foreign_refs_summary JSON",
  "redaction_report JSON",
  "redaction_report must explicitly set",
  "secrets_included",
  "raw_db_paths_included",
  "session_payloads_included",
  "proof_payloads_included",
  "source_runtime_instance_id",
  "imported_expected_files",
  "imported_expected_checks",
  "foreign_refs_summary",
  "redaction_report",
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
  "SAFE_AG_RESUME_IMPORTED_CONTEXT_CREATE_FIXTURE",
  "ag-resume-confirmed-mapping:",
  "resume-packet:",
  "sha256:",
  "imported_expected_files_json",
  "imported_expected_checks_json",
  "foreign_refs_summary_json",
  "redaction_report_json",
  "user-core:imported-context-create-cockpit-panel",
  "2026-06-01T05:02:00.000Z",
]) {
  assert.match(
    fixtureSource,
    new RegExp(escapeRegExp(fixtureToken)),
    `fixture must include ${fixtureToken}`,
  );
}

for (const localFunctionName of [
  "loadSafeImportedContextCreateFixture",
  "loadSafeImportedContextMatchingIdentityFixture",
  "loadSafeImportedContextMissingMappingFixture",
  "loadSafeImportedContextInactiveMappingFixture",
  "loadSafeImportedContextMismatchFixture",
  "clearImportedContextCreateInputs",
]) {
  const source = extractFunctionBlock(panelSource, localFunctionName);
  assert.doesNotMatch(source, /\bfetch\(/, `${localFunctionName} must not fetch`);
  assert.doesNotMatch(source, /\/api\//, `${localFunctionName} must not call routes`);
  assert.doesNotMatch(source, /localStorage|sessionStorage|indexedDB/i);
}

for (const buttonLabel of [
  "Load safe create fixture",
  "Load safe matching identity create fixture",
  "Load safe missing mapping fixture",
  "Load safe inactive mapping fixture",
  "Load safe mapping mismatch fixture",
  "Clear imported context create inputs",
  "Create imported context",
]) {
  assert.match(
    panelSource,
    new RegExp(`>\\s*${escapeRegExp(buttonLabel)}\\s*<|\\?\\s*"Creating imported context"\\s*:\\s*"Create imported context"`),
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
  "Import id",
  "Mapping id",
  "Warnings",
  "Failures",
  "Create Authority Boundary",
  "Record Authority Boundary",
  "import_id",
  "mapping_id",
  "foreign_scope",
  "foreign_work_id",
  "local_scope",
  "local_work_id",
  "packet_id",
  "packet_hash",
  "imported_summary",
  "imported_expected_files",
  "imported_expected_checks",
  "foreign_refs_summary",
  "redaction_report",
  "created_by",
  "import_reason",
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
  "AG Work Resume Imported Context Create Cockpit Panel v0.1",
  "POST /api/ag-work-resume/imported-contexts",
  "Imported context remains bounded review metadata only",
  "The create action sends exactly one route request",
  "JSON `Content-Type` header",
  "does not include `db` or `now`",
  "Local Validation",
  "Redaction Validation",
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
  "No confirmed mapping mutation",
  "No proposal mutation",
  "No approval, publish, retry, replay, merge",
  "Browser Verification Requirement",
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
    /AG_WORK_RESUME_IMPORTED_CONTEXT_CREATE_COCKPIT_PANEL_V0_1\.md/,
    "pointer docs must link to the imported context create Cockpit panel doc",
  );
}

for (const reportToken of [
  "AG Resume imported context create Cockpit panel",
  "Codex in-app Browser",
  "POST /api/ag-work-resume/imported-contexts",
  "create from active confirmed mapping",
  "missing required local validation",
  "malformed created_at local validation",
  "unsafe redaction local validation",
  "mapping_not_found",
  "mapping_not_active",
  "mapping_mismatch",
  "network proof",
  "JSON content-type",
  "no GET read route call",
  "DB side-effect proof",
  "exactly one imported context row created",
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

console.log("PASS ag work resume imported context create cockpit panel smoke");

function assertChangedFilesGuard() {
  const changedFiles = new Set([
    ...gitLines(["diff", "--name-only"]),
    ...gitLines(["diff", "--cached", "--name-only"]),
    ...gitLines(["ls-files", "--others", "--exclude-standard"]),
  ]);
  const allowedFiles = new Set([
    "components/augnes-cockpit.tsx",
    "docs/AG_WORK_RESUME_IMPORTED_CONTEXT_CREATE_COCKPIT_PANEL_V0_1.md",
    "docs/AG_WORK_RESUME_IMPORTED_CONTEXT_READ_COCKPIT_PANEL_V0_1.md",
    "docs/AG_WORK_RESUME_IMPORTED_CONTEXT_READ_V0_1.md",
    "docs/AG_WORK_RESUME_IMPORTED_CONTEXT_ROUTE_V0_1.md",
    "docs/AG_WORK_RESUME_IMPORTED_CONTEXT_WRITER_V0_1.md",
    "docs/AG_WORK_RESUME_IMPORTED_CONTEXT_RECORD_DESIGN_V0_1.md",
    "docs/AG_WORK_RESUME_MAPPING_IMPORT_AUTHORITY_GATE_V0_1.md",
    "reports/browser/2026-06-01-ag-work-resume-imported-context-create-cockpit-panel-verification.md",
    "scripts/smoke-ag-work-resume-imported-context-create-cockpit-panel.mjs",
    "scripts/smoke-ag-work-resume-imported-context-read-cockpit-panel.mjs",
    "scripts/smoke-ag-work-resume-imported-context-read.mjs",
    "scripts/smoke-ag-work-resume-imported-context-route.mjs",
    "scripts/smoke-ag-work-resume-imported-context-writer.mjs",
    "scripts/smoke-ag-work-resume-imported-context-db-schema.mjs",
    "scripts/smoke-ag-work-resume-confirmed-mapping-writer.mjs",
    "scripts/smoke-ag-work-resume-confirmed-mapping-route.mjs",
    "package.json",
  ]);
  for (const file of changedFiles) {
    assert.ok(
      allowedFiles.has(file),
      `changed file is outside imported context create Cockpit panel slice: ${file}`,
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
        "reports/browser/2026-06-01-ag-work-resume-imported-context-create-cockpit-panel-verification.md" ||
        !file.startsWith("reports/browser/"),
      `browser report changes limited to this create panel: ${file}`,
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
