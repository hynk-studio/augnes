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
const recordDesignDocsPath = path.join(
  rootDir,
  "docs",
  "AG_WORK_RESUME_CONFIRMED_MAPPING_RECORD_DESIGN_V0_1.md",
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
  "2026-05-31-ag-work-resume-confirmed-mapping-read-cockpit-panel-verification.md",
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
    "smoke:ag-work-resume-confirmed-mapping-read-cockpit-panel"
  ],
  "node scripts/smoke-ag-work-resume-confirmed-mapping-read-cockpit-panel.mjs",
  "package.json must expose the confirmed mapping read Cockpit panel smoke",
);

const panelSource = extractFunctionBlock(
  componentSource,
  "AgResumeConfirmedMappingReadPanel",
);
const submitHandlerSource = extractFunctionBlock(
  panelSource,
  "handleConfirmedMappingReadSubmit",
);
const queryBuilderSource = extractFunctionBlock(
  componentSource,
  "buildConfirmedMappingReadSearchParams",
);
const resultSource = [
  extractFunctionBlock(componentSource, "AgResumeConfirmedMappingReadResults"),
  extractFunctionBlock(componentSource, "AgResumeConfirmedMappingReadFilters"),
  extractFunctionBlock(
    componentSource,
    "AgResumeConfirmedMappingReadAuthorityBoundary",
  ),
  extractFunctionBlock(componentSource, "AgResumeConfirmedMappingCard"),
].join("\n");
const fixtureSource = extractConstAssignment(
  componentSource,
  "SAFE_AG_RESUME_CONFIRMED_MAPPING_REVIEW_FIXTURE",
);

assert.match(
  componentSource,
  /<AgResumeMappingProposalLifecycleActionPanel \/>[\s\S]*<AgResumeConfirmedMappingReadPanel \/>[\s\S]*<CoordinationEventTimeline\b/,
  "Operator tab must render the confirmed mapping review panel after lifecycle actions and before the event timeline",
);

for (const token of [
  "AG Resume Confirmed Mapping Review",
  "Read-only review over Stage C confirmed mapping identity metadata.",
  "Read-only confirmed mapping identity metadata only.",
  "Calls only the existing GET confirmed mappings route.",
  "No create/update/delete controls",
  "no lifecycle controls",
  "no\n            writer route call",
  "not imported resume context",
  "not proof/evidence",
  "not\n            session binding",
  "not Codex",
  "not approval, publish, retry,\n            replay, or merge authority",
  "Durable approval remains user/Core gated.",
  "mappingId",
  "foreignScope",
  "foreignWorkId",
  "localScope",
  "localWorkId",
  "sourceProposalId",
  "packetId",
  "packetHash",
  "status",
  "limit",
  "Confirmed mapping read route error",
]) {
  assert.match(panelSource, new RegExp(escapeRegExp(token)), `panel must include ${token}`);
}

assert.match(
  submitHandlerSource,
  /fetch\(\s*`\/api\/ag-work-resume\/confirmed-mappings\?\$\{searchParams\.toString\(\)\}`/,
  "panel must call the existing confirmed mappings GET route",
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
  ["/api/ag-work-resume/confirmed-mappings?${searchParams.toString()}"],
  "panel must not reference any API route except confirmed-mappings GET",
);

assert.equal(
  [...panelSource.matchAll(/\bfetch\(/g)].length,
  1,
  "confirmed mapping read panel must have exactly one route fetch",
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
  'htmlFor="ag-resume-confirmed-mapping-mapping-id-input"',
  'htmlFor="ag-resume-confirmed-mapping-foreign-scope-input"',
  'htmlFor="ag-resume-confirmed-mapping-foreign-work-id-input"',
  'htmlFor="ag-resume-confirmed-mapping-local-scope-input"',
  'htmlFor="ag-resume-confirmed-mapping-local-work-id-input"',
  'htmlFor="ag-resume-confirmed-mapping-source-proposal-id-input"',
  'htmlFor="ag-resume-confirmed-mapping-packet-id-input"',
  'htmlFor="ag-resume-confirmed-mapping-packet-hash-input"',
  'htmlFor="ag-resume-confirmed-mapping-status-input"',
  'htmlFor="ag-resume-confirmed-mapping-limit-input"',
  'id="ag-resume-confirmed-mapping-mapping-id-input"',
  'id="ag-resume-confirmed-mapping-foreign-scope-input"',
  'id="ag-resume-confirmed-mapping-foreign-work-id-input"',
  'id="ag-resume-confirmed-mapping-local-scope-input"',
  'id="ag-resume-confirmed-mapping-local-work-id-input"',
  'id="ag-resume-confirmed-mapping-source-proposal-id-input"',
  'id="ag-resume-confirmed-mapping-packet-id-input"',
  'id="ag-resume-confirmed-mapping-packet-hash-input"',
  'id="ag-resume-confirmed-mapping-status-input"',
  'id="ag-resume-confirmed-mapping-limit-input"',
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
    "Confirmed mapping safe fixture controls",
    "ag-resume-confirmed-mapping-safe-fixtures-heading",
  ],
  [
    "Confirmed mapping lookup inputs",
    "ag-resume-confirmed-mapping-inputs-heading",
  ],
  [
    "Confirmed mapping read controls",
    "ag-resume-confirmed-mapping-action-controls-heading",
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
  /aria-labelledby="ag-resume-confirmed-mapping-read-result-heading"/,
  "result section must have a stable labelled heading",
);

for (const queryToken of [
  "mapping_id fetch must not be combined with list filters or limit.",
  "foreign_scope and foreign_work_id must be supplied together.",
  "local_scope and local_work_id must be supplied together.",
  "packet_id and packet_hash must be supplied together.",
  "At least one confirmed mapping read filter is required",
  "limit must be a positive integer.",
  'searchParams.set("foreign_scope"',
  'searchParams.set("foreign_work_id"',
  'searchParams.set("local_scope"',
  'searchParams.set("local_work_id"',
  'searchParams.set("source_proposal_id"',
  'searchParams.set("packet_id"',
  'searchParams.set("packet_hash"',
  'searchParams.set("status"',
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
  "SAFE_AG_RESUME_CONFIRMED_MAPPING_REVIEW_FIXTURE",
  "ag-resume-confirmed-mapping:",
  "project:foreign",
  "AG-FIXTURE-CONFIRMED-MAPPING-001",
  "project:augnes",
  "AG-FIXTURE-CONFIRMED-MAPPING-LOCAL-001",
  "ag-resume-mapping-proposal:",
  "resume-packet:",
  "sha256:",
  "active",
  "20",
]) {
  assert.match(
    fixtureSource,
    new RegExp(escapeRegExp(fixtureToken)),
    `fixture must include ${fixtureToken}`,
  );
}

for (const localFunctionName of [
  "loadSafeMappingIdFixture",
  "loadSafeConfirmedForeignWorkFixture",
  "loadSafeConfirmedLocalWorkFixture",
  "loadSafeConfirmedSourceProposalFixture",
  "loadSafeConfirmedPacketFixture",
  "loadSafeConfirmedStatusFixture",
  "clearConfirmedMappingInputs",
]) {
  const source = extractFunctionBlock(panelSource, localFunctionName);
  assert.doesNotMatch(source, /\bfetch\(/, `${localFunctionName} must not fetch`);
  assert.doesNotMatch(source, /\/api\//, `${localFunctionName} must not call routes`);
  assert.doesNotMatch(source, /localStorage|sessionStorage|indexedDB/i);
}

for (const buttonLabel of [
  "Load safe mapping id lookup",
  "Load safe foreign work lookup",
  "Load safe local work lookup",
  "Load safe source proposal lookup",
  "Load safe packet lookup",
  "Load safe status lookup",
  "Clear confirmed mapping inputs",
  "Read confirmed mappings",
]) {
  assert.match(
    panelSource,
    new RegExp(`>\\s*${escapeRegExp(buttonLabel)}\\s*<|\\?\\s*"Reading confirmed mappings"\\s*:\\s*"Read confirmed mappings"`),
    `panel must include button label ${buttonLabel}`,
  );
}

for (const forbiddenLabel of [
  "Create confirmed mapping",
  "Create mapping",
  "Confirm mapping",
  "Update confirmed mapping",
  "Delete confirmed mapping",
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
  "Read status",
  "Record count",
  "Applied filters",
  "Warnings",
  "Failures",
  "Read Authority Boundary",
  "Record Authority Boundary",
  "mapping_identity_metadata_only",
  "foreign_scope",
  "foreign_work_id",
  "local_scope",
  "local_work_id",
  "source_proposal_id",
  "packet_id",
  "packet_hash",
  "Confirmation metadata",
  "confirmed_by",
  "confirmed_at",
  "confirmation_reason",
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
  "AG Work Resume Confirmed Mapping Read Cockpit Panel v0.1",
  "read-only review",
  "GET /api/ag-work-resume/confirmed-mappings",
  "mapping identity metadata only",
  "mapping_id",
  "foreign_scope",
  "foreign_work_id",
  "local_scope",
  "local_work_id",
  "source_proposal_id",
  "packet_id",
  "packet_hash",
  "status",
  "limit",
  "Load safe mapping id lookup",
  "Read confirmed mappings",
  "Confirmed mapping read result",
  "no `role=\"button\"",
  "No create control",
  "No update route",
  "No delete route",
  "No lifecycle mutation",
  "No import or imported resume context",
  "No proof/evidence recording",
  "No session binding",
  "No Codex execution",
  "No MCP/App schema changes",
  "No localStorage, sessionStorage, or indexedDB",
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
    /AG_WORK_RESUME_CONFIRMED_MAPPING_READ_COCKPIT_PANEL_V0_1\.md/,
    "pointer docs must link to the confirmed mapping read Cockpit panel doc",
  );
}

for (const reportToken of [
  "AG Resume confirmed mapping read Cockpit panel",
  "Codex in-app Browser",
  "GET /api/ag-work-resume/confirmed-mappings",
  "mapping_id",
  "foreign_scope",
  "local_scope",
  "source_proposal_id",
  "packet_id",
  "status",
  "network",
  "request body length was `0`",
  "no read call sent a JSON `Content-Type` header",
  "DB side-effect proof",
  "ag_work_resume_confirmed_mappings",
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

console.log("PASS ag work resume confirmed mapping read cockpit panel smoke");

function assertChangedFilesGuard() {
  const changedFiles = new Set([
    ...gitLines(["diff", "--name-only"]),
    ...gitLines(["diff", "--cached", "--name-only"]),
    ...gitLines(["ls-files", "--others", "--exclude-standard"]),
  ]);
  const allowedFiles = new Set([
    "components/augnes-cockpit.tsx",
    "docs/AG_WORK_RESUME_CONFIRMED_MAPPING_READ_COCKPIT_PANEL_V0_1.md",
    "docs/AG_WORK_RESUME_CONFIRMED_MAPPING_CREATE_COCKPIT_PANEL_V0_1.md",
    "reports/browser/2026-05-31-ag-work-resume-confirmed-mapping-read-cockpit-panel-verification.md",
    "reports/browser/2026-06-01-ag-work-resume-confirmed-mapping-create-cockpit-panel-verification.md",
    "scripts/smoke-ag-work-resume-confirmed-mapping-create-cockpit-panel.mjs",
    "scripts/smoke-ag-work-resume-confirmed-mapping-read-cockpit-panel.mjs",
    "scripts/smoke-ag-work-resume-confirmed-mapping-read.mjs",
    "scripts/smoke-ag-work-resume-confirmed-mapping-route.mjs",
    "scripts/smoke-ag-work-resume-confirmed-mapping-writer.mjs",
    "scripts/smoke-ag-work-resume-confirmed-mapping-db-schema.mjs",
    "docs/AG_WORK_RESUME_CONFIRMED_MAPPING_READ_V0_1.md",
    "docs/AG_WORK_RESUME_CONFIRMED_MAPPING_ROUTE_V0_1.md",
    "docs/AG_WORK_RESUME_CONFIRMED_MAPPING_WRITER_V0_1.md",
    "docs/AG_WORK_RESUME_CONFIRMED_MAPPING_RECORD_DESIGN_V0_1.md",
    "docs/AG_WORK_RESUME_IMPORTED_CONTEXT_RECORD_DESIGN_V0_1.md",
    "docs/AG_WORK_RESUME_MAPPING_IMPORT_AUTHORITY_GATE_V0_1.md",
    "package.json",
    "scripts/smoke-ag-work-resume-confirmed-mapping-record-design.mjs",
    "scripts/smoke-ag-work-resume-imported-context-record-design.mjs",
  ]);
  for (const file of changedFiles) {
    assert.ok(
      allowedFiles.has(file),
      `changed file is outside confirmed mapping read Cockpit panel slice: ${file}`,
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
