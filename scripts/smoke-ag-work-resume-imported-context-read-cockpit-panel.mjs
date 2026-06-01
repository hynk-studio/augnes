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
const recordDesignDocsPath = path.join(
  rootDir,
  "docs",
  "AG_WORK_RESUME_IMPORTED_CONTEXT_RECORD_DESIGN_V0_1.md",
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
  "2026-06-01-ag-work-resume-imported-context-read-cockpit-panel-verification.md",
);

for (const file of [
  componentPath,
  docsPath,
  readDocsPath,
  routeDocsPath,
  writerDocsPath,
  recordDesignDocsPath,
  gateDocsPath,
  packagePath,
  browserReportPath,
]) {
  assert.ok(existsSync(file), `${file} must exist`);
}

const componentSource = readFileSync(componentPath, "utf8");
const docsSource = readFileSync(docsPath, "utf8");
const readDocsSource = readFileSync(readDocsPath, "utf8");
const routeDocsSource = readFileSync(routeDocsPath, "utf8");
const writerDocsSource = readFileSync(writerDocsPath, "utf8");
const recordDesignDocsSource = readFileSync(recordDesignDocsPath, "utf8");
const gateDocsSource = readFileSync(gateDocsPath, "utf8");
const browserReportSource = readFileSync(browserReportPath, "utf8");
const packageJson = JSON.parse(readFileSync(packagePath, "utf8"));

assert.equal(
  packageJson.scripts?.[
    "smoke:ag-work-resume-imported-context-read-cockpit-panel"
  ],
  "node scripts/smoke-ag-work-resume-imported-context-read-cockpit-panel.mjs",
  "package.json must expose the imported context read Cockpit panel smoke",
);

const panelSource = extractFunctionBlock(
  componentSource,
  "AgResumeImportedContextReadPanel",
);
const submitHandlerSource = extractFunctionBlock(
  panelSource,
  "handleImportedContextReadSubmit",
);
const queryBuilderSource = extractFunctionBlock(
  componentSource,
  "buildImportedContextReadSearchParams",
);
const resultSource = [
  extractFunctionBlock(componentSource, "AgResumeImportedContextReadResults"),
  extractFunctionBlock(componentSource, "AgResumeImportedContextReadFilters"),
  extractFunctionBlock(
    componentSource,
    "AgResumeImportedContextAuthorityBoundary",
  ),
  extractFunctionBlock(componentSource, "AgResumeImportedContextCard"),
].join("\n");
const fixtureSource = extractConstAssignment(
  componentSource,
  "SAFE_AG_RESUME_IMPORTED_CONTEXT_REVIEW_FIXTURE",
);

assert.match(
  componentSource,
  /<AgResumeConfirmedMappingReadPanel \/>[\s\S]*<AgResumeImportedContextReadPanel \/>[\s\S]*<CoordinationEventTimeline\b/,
  "Operator tab must render the imported context read panel after confirmed mapping read and before the event timeline",
);

for (const token of [
  "AG Resume Imported Context Review",
  "Read-only review over Stage D imported context metadata.",
  "Read-only imported context review metadata only.",
  "Calls only the existing GET imported contexts route.",
  "Not proof/evidence",
  "not session binding",
  "not Codex",
  "Not work item/event creation",
  "not confirmed mapping/proposal",
  "Not approval, publish, retry, replay, or merge authority.",
  "Durable\n            approval remains user/Core gated.",
  "importId",
  "mappingId",
  "foreignScope",
  "foreignWorkId",
  "localScope",
  "localWorkId",
  "packetId",
  "packetHash",
  "status",
  "createdBy",
  "limit",
  "Imported context read route error",
]) {
  assert.match(panelSource, new RegExp(escapeRegExp(token)), `panel must include ${token}`);
}

assert.match(
  submitHandlerSource,
  /fetch\(\s*`\/api\/ag-work-resume\/imported-contexts\?\$\{searchParams\.toString\(\)\}`/,
  "panel must call the existing imported contexts GET route",
);
assert.match(submitHandlerSource, /method:\s*"GET"/, "panel route call must use GET");
assert.doesNotMatch(submitHandlerSource, /method:\s*"POST"/, "panel must not POST");
assert.doesNotMatch(submitHandlerSource, /JSON\.stringify/, "panel must not build a write body");
assert.doesNotMatch(
  submitHandlerSource,
  /headers\s*:/,
  "panel GET must not set request headers",
);
assert.doesNotMatch(
  panelSource,
  /content-type/i,
  "panel GET must not set JSON content type",
);

const routeStrings = [
  ...panelSource.matchAll(/["'`]((?:\/api\/)[^"'`]+)["'`]/g),
].map((match) => match[1]);
assert.deepEqual(
  [...new Set(routeStrings)],
  ["/api/ag-work-resume/imported-contexts?${searchParams.toString()}"],
  "panel must not reference any API route except imported-contexts GET",
);

assert.equal(
  [...panelSource.matchAll(/\bfetch\(/g)].length,
  1,
  "imported context read panel must have exactly one route fetch",
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
  "localStorage",
  "sessionStorage",
  "indexedDB",
  "telemetry",
  "analytics",
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
  'htmlFor="ag-resume-imported-context-import-id-input"',
  'htmlFor="ag-resume-imported-context-mapping-id-input"',
  'htmlFor="ag-resume-imported-context-foreign-scope-input"',
  'htmlFor="ag-resume-imported-context-foreign-work-id-input"',
  'htmlFor="ag-resume-imported-context-local-scope-input"',
  'htmlFor="ag-resume-imported-context-local-work-id-input"',
  'htmlFor="ag-resume-imported-context-packet-id-input"',
  'htmlFor="ag-resume-imported-context-packet-hash-input"',
  'htmlFor="ag-resume-imported-context-status-input"',
  'htmlFor="ag-resume-imported-context-created-by-input"',
  'htmlFor="ag-resume-imported-context-limit-input"',
  'id="ag-resume-imported-context-import-id-input"',
  'id="ag-resume-imported-context-mapping-id-input"',
  'id="ag-resume-imported-context-foreign-scope-input"',
  'id="ag-resume-imported-context-foreign-work-id-input"',
  'id="ag-resume-imported-context-local-scope-input"',
  'id="ag-resume-imported-context-local-work-id-input"',
  'id="ag-resume-imported-context-packet-id-input"',
  'id="ag-resume-imported-context-packet-hash-input"',
  'id="ag-resume-imported-context-status-input"',
  'id="ag-resume-imported-context-created-by-input"',
  'id="ag-resume-imported-context-limit-input"',
  "aria-describedby",
  'role="alert"',
  "aria-busy",
  "<input",
  "<select",
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
    "Imported context safe fixture controls",
    "ag-resume-imported-context-safe-fixtures-heading",
  ],
  [
    "Imported context lookup inputs",
    "ag-resume-imported-context-inputs-heading",
  ],
  [
    "Imported context read controls",
    "ag-resume-imported-context-action-controls-heading",
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
  /aria-labelledby="ag-resume-imported-context-read-result-heading"/,
  "result section must have a stable labelled heading",
);

for (const queryToken of [
  "import_id fetch must not be combined with list filters or limit.",
  "foreign_scope and foreign_work_id must be supplied together.",
  "local_scope and local_work_id must be supplied together.",
  "packet_id and packet_hash must be supplied together.",
  "At least one imported context read filter is required",
  "limit must be a positive integer.",
  'searchParams.set("mapping_id"',
  'searchParams.set("foreign_scope"',
  'searchParams.set("foreign_work_id"',
  'searchParams.set("local_scope"',
  'searchParams.set("local_work_id"',
  'searchParams.set("packet_id"',
  'searchParams.set("packet_hash"',
  'searchParams.set("status"',
  'searchParams.set("created_by"',
  'searchParams.set("limit"',
]) {
  assert.match(
    queryBuilderSource,
    new RegExp(escapeRegExp(queryToken)),
    `query builder must include ${queryToken}`,
  );
}
assert.doesNotMatch(queryBuilderSource, /\bfetch\(/, "query builder must not fetch");
assert.doesNotMatch(queryBuilderSource, /\/api\//, "query builder must not call routes");

for (const fixtureToken of [
  "SAFE_AG_RESUME_IMPORTED_CONTEXT_REVIEW_FIXTURE",
  "ag-resume-imported-context:",
  "ag-resume-confirmed-mapping:",
  "project:foreign",
  "AG-FIXTURE-IMPORTED-CONTEXT-READ-001",
  "project:augnes",
  "AG-FIXTURE-IMPORTED-CONTEXT-READ-LOCAL-001",
  "resume-packet:",
  "sha256:",
  "review_metadata",
  "user-core:imported-context-read-cockpit-panel",
  "20",
]) {
  assert.match(
    fixtureSource,
    new RegExp(escapeRegExp(fixtureToken)),
    `fixture must include ${fixtureToken}`,
  );
}

for (const localFunctionName of [
  "loadSafeImportedContextIdFixture",
  "loadSafeImportedContextMappingFixture",
  "loadSafeImportedContextForeignWorkFixture",
  "loadSafeImportedContextLocalWorkFixture",
  "loadSafeImportedContextPacketFixture",
  "loadSafeImportedContextStatusFixture",
  "loadSafeImportedContextCreatedByFixture",
  "clearImportedContextInputs",
]) {
  const source = extractFunctionBlock(panelSource, localFunctionName);
  assert.doesNotMatch(source, /\bfetch\(/, `${localFunctionName} must not fetch`);
  assert.doesNotMatch(source, /\/api\//, `${localFunctionName} must not call routes`);
  assert.doesNotMatch(source, /localStorage|sessionStorage|indexedDB/i);
}

for (const buttonLabel of [
  "Load safe import id lookup",
  "Load safe mapping lookup",
  "Load safe foreign work lookup",
  "Load safe local work lookup",
  "Load safe packet lookup",
  "Load safe status lookup",
  "Load safe creator lookup",
  "Clear imported context inputs",
  "Read imported contexts",
]) {
  assert.match(
    panelSource,
    new RegExp(`>\\s*${escapeRegExp(buttonLabel)}\\s*<|\\?\\s*"Reading imported contexts"\\s*:\\s*"Read imported contexts"`),
    `panel must include button label ${buttonLabel}`,
  );
}

for (const forbiddenLabel of [
  "Create imported context",
  "Update imported context",
  "Delete imported context",
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
  "Reader status",
  "Record count",
  "Applied filters",
  "Warnings",
  "Failures",
  "Read Authority Boundary",
  "Record Authority Boundary",
  "review_metadata_only",
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
  "created_at",
  "updated_at",
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
  "AG Work Resume Imported Context Read Cockpit Panel v0.1",
  "read-only Cockpit Operator panel",
  "GET /api/ag-work-resume/imported-contexts",
  "read-only imported context review metadata only",
  "existing POST create route is preserved",
  "import_id",
  "mapping_id",
  "foreign_scope",
  "foreign_work_id",
  "local_scope",
  "local_work_id",
  "packet_id",
  "packet_hash",
  "status",
  "created_by",
  "limit",
  "Load safe import id lookup",
  "Read imported contexts",
  "Imported context cards render",
  "role=\"alert\"",
  "aria-live=\"polite\"",
  "No create controls",
  "No update route",
  "No delete route",
  "No lifecycle mutation",
  "No proof/evidence recording",
  "No session binding",
  "No Codex execution",
  "No schema or migration",
  "No ChatGPT App, MCP/App schema, or bridge tool changes",
  "No telemetry, analytics, localStorage, sessionStorage, or indexedDB",
  "No approval, publish, retry, replay, merge",
  "Browser Verification Requirement",
  "network proof",
  "DB side-effect proof",
]) {
  assert.match(docsSource, new RegExp(escapeRegExp(docsToken)), `docs must include ${docsToken}`);
}

for (const pointerDocs of [
  readDocsSource,
  routeDocsSource,
  writerDocsSource,
  recordDesignDocsSource,
  gateDocsSource,
]) {
  assert.match(
    pointerDocs,
    /AG_WORK_RESUME_IMPORTED_CONTEXT_READ_COCKPIT_PANEL_V0_1\.md/,
    "pointer docs must link to the imported context read Cockpit panel doc",
  );
}

for (const reportToken of [
  "AG Resume imported context read Cockpit panel",
  "Codex in-app Browser",
  "GET /api/ag-work-resume/imported-contexts",
  "import_id",
  "mapping_id",
  "foreign_scope",
  "local_scope",
  "packet_id",
  "status",
  "created_by",
  "network proof",
  "request body length was `0`",
  "no read call sent a JSON `Content-Type` header",
  "DB side-effect proof",
  "ag_work_resume_imported_contexts",
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

console.log("PASS ag work resume imported context read cockpit panel smoke");

function assertChangedFilesGuard() {
  const changedFiles = new Set([
    ...gitLines(["diff", "--name-only"]),
    ...gitLines(["diff", "--cached", "--name-only"]),
    ...gitLines(["ls-files", "--others", "--exclude-standard"]),
  ]);
  const allowedFiles = new Set([
    "components/augnes-cockpit.tsx",
    "docs/AG_WORK_RESUME_IMPORTED_CONTEXT_READ_COCKPIT_PANEL_V0_1.md",
    "docs/AG_WORK_RESUME_IMPORTED_CONTEXT_READ_V0_1.md",
    "docs/AG_WORK_RESUME_IMPORTED_CONTEXT_ROUTE_V0_1.md",
    "docs/AG_WORK_RESUME_IMPORTED_CONTEXT_WRITER_V0_1.md",
    "docs/AG_WORK_RESUME_IMPORTED_CONTEXT_RECORD_DESIGN_V0_1.md",
    "docs/AG_WORK_RESUME_MAPPING_IMPORT_AUTHORITY_GATE_V0_1.md",
    "reports/browser/2026-06-01-ag-work-resume-imported-context-read-cockpit-panel-verification.md",
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
      `changed file is outside imported context read Cockpit panel slice: ${file}`,
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
        "reports/browser/2026-06-01-ag-work-resume-imported-context-read-cockpit-panel-verification.md" ||
        !file.startsWith("reports/browser/"),
      `browser report changes limited to this read panel: ${file}`,
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
  const bodyStartMatch = source.slice(start).match(/\)\s*\{/);
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
