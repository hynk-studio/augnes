import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, "..");
const componentPath = path.join(rootDir, "components", "augnes-cockpit.tsx");
const docsPath = path.join(
  rootDir,
  "docs",
  "AG_WORK_RESUME_MAPPING_PROPOSAL_RECORD_READ_COCKPIT_PANEL_V0_1.md",
);
const readDocsPath = path.join(
  rootDir,
  "docs",
  "AG_WORK_RESUME_MAPPING_PROPOSAL_RECORD_READ_V0_1.md",
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
  "2026-05-31-ag-work-resume-mapping-proposal-record-read-cockpit-panel-verification.md",
);

for (const file of [
  componentPath,
  docsPath,
  readDocsPath,
  gateDocsPath,
  packagePath,
  browserReportPath,
]) {
  assert.ok(existsSync(file), `${file} must exist`);
}

const componentSource = readFileSync(componentPath, "utf8");
const docsSource = readFileSync(docsPath, "utf8");
const readDocsSource = readFileSync(readDocsPath, "utf8");
const gateDocsSource = readFileSync(gateDocsPath, "utf8");
const browserReportSource = readFileSync(browserReportPath, "utf8");
const packageJson = JSON.parse(readFileSync(packagePath, "utf8"));

assert.equal(
  packageJson.scripts?.[
    "smoke:ag-work-resume-mapping-proposal-record-read-cockpit-panel"
  ],
  "node scripts/smoke-ag-work-resume-mapping-proposal-record-read-cockpit-panel.mjs",
  "package.json must expose the proposal record read Cockpit panel smoke",
);

const panelSource = extractFunctionBlock(
  componentSource,
  "AgResumeMappingProposalRecordReviewPanel",
);
const submitHandlerSource = extractFunctionBlock(componentSource, "handleSubmit", {
  after: panelSource.indexOf("function handleSubmit"),
  source: panelSource,
});
const queryBuilderSource = extractFunctionBlock(
  componentSource,
  "buildMappingProposalRecordReadSearchParams",
);
const resultSource = [
  extractFunctionBlock(componentSource, "AgResumeMappingProposalRecordReadResults"),
  extractFunctionBlock(componentSource, "AgResumeMappingProposalRecordReadFilters"),
  extractFunctionBlock(
    componentSource,
    "AgResumeMappingProposalRecordReadAuthorityBoundary",
  ),
  extractFunctionBlock(componentSource, "AgResumeMappingProposalRecordCard"),
  extractFunctionBlock(
    componentSource,
    "AgResumeMappingProposalRecordAuthorityBoundary",
  ),
  extractFunctionBlock(componentSource, "AgResumeUnknownList"),
  extractFunctionBlock(componentSource, "AgResumeJsonSummaryCard"),
].join("\n");
const fixtureSource = extractConstAssignment(
  componentSource,
  "SAFE_AG_RESUME_MAPPING_PROPOSAL_RECORD_REVIEW_FIXTURE",
);

assert.match(
  componentSource,
  /<AgResumeMappingProposalPreviewPanel \/>[\s\S]*<AgResumeMappingProposalRecordReviewPanel \/>/,
  "Operator tab must render the record review panel after the mapping proposal preview panel",
);

for (const token of [
  "AG Resume Mapping Proposal Record Review",
  "Read-only review over stored Stage B mapping proposal records.",
  "Read-only proposal record review metadata.",
  "Reads only through the existing GET mapping proposal records route.",
  "No create/write affordance",
  "lifecycle mutation",
  "confirmed mapping",
  "proof/evidence",
  "Codex",
  "merge authority",
  "Durable approval remains user/Core gated.",
  "proposalId",
  "foreignScope",
  "foreignWorkId",
  "candidateLocalScope",
  "candidateLocalWorkId",
  "status",
  "limit",
  "Mapping proposal record read route error",
]) {
  assert.match(panelSource, new RegExp(escapeRegExp(token)), `panel must include ${token}`);
}

assert.match(
  panelSource,
  /fetch\(\s*`\/api\/ag-work-resume\/mapping-proposal-records\?\$\{searchParams\.toString\(\)\}`/,
  "panel must call the existing mapping proposal records GET route",
);
assert.match(panelSource, /method:\s*"GET"/, "panel route call must use GET");
assert.doesNotMatch(panelSource, /method:\s*"POST"/, "panel must not POST");
assert.doesNotMatch(panelSource, /JSON\.stringify/, "panel must not build a write body");
assert.doesNotMatch(panelSource, /content-type/i, "panel GET must not set JSON content type");

const routeStrings = [
  ...panelSource.matchAll(/["'`]((?:\/api\/)[^"'`]+)["'`]/g),
].map((match) => match[1]);
assert.deepEqual(
  [...new Set(routeStrings)],
  ["/api/ag-work-resume/mapping-proposal-records?${searchParams.toString()}"],
  "panel must not reference any API route except mapping-proposal-records GET",
);

assert.equal(
  [...panelSource.matchAll(/\bfetch\(/g)].length,
  1,
  "proposal record read panel must have exactly one route fetch",
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
  'htmlFor="ag-resume-mapping-record-proposal-id-input"',
  'htmlFor="ag-resume-mapping-record-foreign-scope-input"',
  'htmlFor="ag-resume-mapping-record-foreign-work-id-input"',
  'htmlFor="ag-resume-mapping-record-candidate-local-scope-input"',
  'htmlFor="ag-resume-mapping-record-candidate-local-work-id-input"',
  'htmlFor="ag-resume-mapping-record-status-input"',
  'htmlFor="ag-resume-mapping-record-limit-input"',
  'id="ag-resume-mapping-record-proposal-id-input"',
  'id="ag-resume-mapping-record-foreign-scope-input"',
  'id="ag-resume-mapping-record-foreign-work-id-input"',
  'id="ag-resume-mapping-record-candidate-local-scope-input"',
  'id="ag-resume-mapping-record-candidate-local-work-id-input"',
  'id="ag-resume-mapping-record-status-input"',
  'id="ag-resume-mapping-record-limit-input"',
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
    "Proposal record safe fixture controls",
    "ag-resume-mapping-record-safe-fixtures-heading",
  ],
  [
    "Proposal record lookup inputs",
    "ag-resume-mapping-record-inputs-heading",
  ],
  [
    "Proposal record read controls",
    "ag-resume-mapping-record-action-controls-heading",
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
  /aria-labelledby="ag-resume-mapping-proposal-record-read-result-heading"/,
  "result section must have a stable labelled heading",
);

for (const queryToken of [
  "proposal_id fetch must not be combined with list filters or limit.",
  "foreign_scope and foreign_work_id must be supplied together.",
  "candidate_local_scope and candidate_local_work_id must be supplied together.",
  "At least one proposal record read filter is required",
  "limit must be a positive integer.",
  'searchParams.set("foreign_scope"',
  'searchParams.set("foreign_work_id"',
  'searchParams.set("candidate_local_scope"',
  'searchParams.set("candidate_local_work_id"',
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
  "SAFE_AG_RESUME_MAPPING_PROPOSAL_RECORD_REVIEW_FIXTURE",
  "ag-resume-mapping-proposal:fixture-cockpit-read-001",
  "project:augnes",
  "AG-FIXTURE-MAPPING-PROPOSAL-001",
  "proposed",
  'limit: "20"',
]) {
  assert.match(
    fixtureSource,
    new RegExp(escapeRegExp(fixtureToken)),
    `fixture must include ${fixtureToken}`,
  );
}

for (const forbiddenFixtureToken of [
  "sk-",
  "ghp_",
  "github_pat_",
  "OPENAI_API_KEY",
  "GITHUB_TOKEN",
  "BEGIN PRIVATE KEY",
  "/tmp/augnes",
  ".db",
  "/Users/",
  "/home/",
  "trycloudflare.com",
  "ngrok",
  "loca.lt",
]) {
  assert.doesNotMatch(
    fixtureSource,
    new RegExp(escapeRegExp(forbiddenFixtureToken), "i"),
    `fixtures must not include ${forbiddenFixtureToken}`,
  );
}

for (const handlerName of [
  "loadSafeProposalIdFixture",
  "loadSafeForeignWorkFixture",
  "loadSafeCandidateWorkFixture",
  "loadSafeStatusFixture",
  "clearInputs",
]) {
  const handlerSource = extractFunctionBlock(panelSource, handlerName);
  assert.doesNotMatch(handlerSource, /\bfetch\(/, `${handlerName} must not fetch`);
  assert.doesNotMatch(handlerSource, /\/api\//, `${handlerName} must not call routes`);
  assert.doesNotMatch(
    handlerSource,
    /localStorage|sessionStorage|indexedDB/i,
    `${handlerName} must not persist browser state`,
  );
}

const buttonBlocks = [...panelSource.matchAll(/<button[\s\S]*?<\/button>/g)].map(
  (match) => match[0],
);
const submitButtonBlocks = buttonBlocks.filter((buttonBlock) =>
  /type="submit"/.test(buttonBlock),
);
assert.equal(submitButtonBlocks.length, 1, "read action must be the only submit button");
assert.match(
  submitButtonBlocks[0],
  /Read proposal records/,
  "submit button must be the read-only proposal record read action",
);
for (const label of [
  "Load safe proposal id lookup",
  "Load safe foreign work lookup",
  "Load safe candidate work lookup",
  "Load safe status lookup",
  "Clear proposal record inputs",
]) {
  const matchingBlocks = buttonBlocks.filter((buttonBlock) =>
    buttonBlock.includes(label),
  );
  assert.equal(matchingBlocks.length, 1, `${label} button must exist once`);
  assert.match(
    matchingBlocks[0],
    /type="button"/,
    `${label} must be type="button"`,
  );
}

for (const buttonBlock of buttonBlocks) {
  const normalizedButton = normalizeText(buttonBlock);
  for (const forbiddenLabel of [
    "confirm mapping",
    "create mapping",
    "import context",
    "create work item",
    "record proof",
    "record evidence",
    "bind session",
    "execute codex",
    "run codex",
    "start codex",
    "approve",
    "publish",
    "retry",
    "replay",
    "merge",
    "direct resume code",
    "relay",
    "withdraw",
    "reject",
    "supersede",
    "expire",
  ]) {
    assert.ok(
      !normalizedButton.includes(forbiddenLabel),
      `panel action labels must not include "${forbiddenLabel}"`,
    );
  }
}

for (const displayToken of [
  "Mapping proposal record read result",
  "Proposal record reads are review metadata only",
  "HTTP Status",
  "Route ok",
  "Read status",
  "Record count",
  "Applied filters",
  "Warnings",
  "Failures",
  "Read Authority Boundary",
  "proposal_review_metadata_only",
  "proposal_record_created",
  "proposal_record_updated",
  "proposal_record_deleted",
  "confirmed_mapping_created",
  "import_record_created",
  "work_item_created",
  "work_event_created",
  "proof_recorded",
  "evidence_recorded",
  "session_bound",
  "codex_executed",
  "approval_granted",
  "publish_retry_replay_authority",
  "merge_authority",
  "Foreign work",
  "Candidate local work",
  "Proposal metadata",
  "comparison_summary",
  "gaps_summary",
  "conflicts_summary",
  "questions_summary",
  "foreign_refs_summary",
  "repo_context_summary",
  "redaction_summary",
  "Record Authority Boundary",
]) {
  assert.match(
    resultSource,
    new RegExp(escapeRegExp(displayToken), "i"),
    `result display must include ${displayToken}`,
  );
}

for (const docsPattern of [
  /read-only review/i,
  /Stage B mapping proposal records/i,
  /GET \/api\/ag-work-resume\/mapping-proposal-records/i,
  /proposal_id/i,
  /foreign_scope.*foreign_work_id/is,
  /candidate_local_scope.*candidate_local_work_id/is,
  /status/i,
  /limit/i,
  /No create\/write affordance/i,
  /No update route/i,
  /No withdraw, reject, supersede, or expire action/i,
  /No confirmed mapping/i,
  /No import/i,
  /No work item or work event creation/i,
  /No proof\/evidence recording/i,
  /No session binding/i,
  /No Codex execution or Codex continuation/i,
  /No ChatGPT App cards/i,
  /No MCP\/App schema changes/i,
  /No bridge tools/i,
  /No telemetry or analytics/i,
  /No localStorage, sessionStorage, or indexedDB/i,
  /Browser Verification Requirement/i,
]) {
  assert.match(docsSource, docsPattern, `docs must mention ${docsPattern}`);
}

assert.match(
  readDocsSource,
  /AG_WORK_RESUME_MAPPING_PROPOSAL_RECORD_READ_COCKPIT_PANEL_V0_1\.md/,
  "read docs must point to the Cockpit panel doc",
);
assert.match(
  gateDocsSource,
  /Cockpit Operator read-only proposal record review panel[\s\S]*proposal review metadata only/i,
  "authority gate docs must mention the read-only proposal record review panel",
);

for (const reportPattern of [
  /status list result[\s\S]*listed/i,
  /foreign work list result/i,
  /proposal_id fetch result/i,
  /not-found result/i,
  /local validation error/i,
  /clear interaction/i,
  /accessibility\/keyboard observation/i,
  /no unauthorized controls/i,
]) {
  assert.match(
    browserReportSource,
    reportPattern,
    `browser report must mention ${reportPattern}`,
  );
}

console.log(
  JSON.stringify(
    {
      smoke: "ag-work-resume-mapping-proposal-record-read-cockpit-panel",
      cases: [
        "package script is present",
        "Operator tab proposal record read panel source is present",
        "panel calls only GET /api/ag-work-resume/mapping-proposal-records",
        "panel builds strict supported query filters locally",
        "panel exposes proposal_id, foreign work, candidate local work, status, and limit inputs",
        "panel includes accessible labels, helper text, grouped controls, alert errors, and live result region",
        "safe fixture buttons are type button and do not fetch or persist",
        "safe lookup fixture passes public-safe guards",
        "button labels do not expose forbidden authority controls",
        "result display includes filters, warnings, failures, proposal records, summaries, and authority boundaries",
        "docs capture read-only review-metadata boundary, non-goals, accessibility, and browser verification",
        "reader and authority-gate docs point to the Cockpit panel slice",
        "browser verification report exists for list/fetch/not-found/error/accessibility/unauthorized-control checks",
      ],
    },
    null,
    2,
  ),
);

function extractFunctionBlock(source, functionName, options = {}) {
  const searchSource = options.source ?? source;
  const searchStart = options.after ?? 0;
  const start = searchSource.indexOf(`function ${functionName}`, searchStart);
  assert.notEqual(start, -1, `${functionName} must exist`);
  const firstParen = searchSource.indexOf("(", start);
  assert.notEqual(firstParen, -1, `${functionName} must have parameters`);
  const firstBrace = findFunctionBodyBrace(searchSource, firstParen);
  assert.notEqual(firstBrace, -1, `${functionName} must have a body`);
  let depth = 0;
  let mode = "code";

  for (let index = firstBrace; index < searchSource.length; index += 1) {
    const char = searchSource[index];
    const next = searchSource[index + 1];
    const previous = searchSource[index - 1];

    if (mode === "line-comment") {
      if (char === "\n") mode = "code";
      continue;
    }
    if (mode === "block-comment") {
      if (char === "*" && next === "/") {
        index += 1;
        mode = "code";
      }
      continue;
    }
    if (mode === "single") {
      if (char === "'" && previous !== "\\") mode = "code";
      continue;
    }
    if (mode === "double") {
      if (char === '"' && previous !== "\\") mode = "code";
      continue;
    }
    if (mode === "template") {
      if (char === "`" && previous !== "\\") mode = "code";
      continue;
    }
    if (char === "/" && next === "/") {
      index += 1;
      mode = "line-comment";
      continue;
    }
    if (char === "/" && next === "*") {
      index += 1;
      mode = "block-comment";
      continue;
    }
    if (char === "'") {
      mode = "single";
      continue;
    }
    if (char === '"') {
      mode = "double";
      continue;
    }
    if (char === "`") {
      mode = "template";
      continue;
    }
    if (char === "{") depth += 1;
    if (char === "}") {
      depth -= 1;
      if (depth === 0) return searchSource.slice(start, index + 1);
    }
  }

  assert.fail(`${functionName} block was not closed`);
}

function findFunctionBodyBrace(source, fromIndex) {
  let parenDepth = 0;
  for (let index = fromIndex; index < source.length; index += 1) {
    const char = source[index];
    if (char === "(") parenDepth += 1;
    if (char === ")") parenDepth -= 1;
    if (char === "{" && parenDepth === 0) return index;
  }
  return -1;
}

function extractConstAssignment(source, constName) {
  const start = source.indexOf(`const ${constName}`);
  assert.notEqual(start, -1, `${constName} must exist`);
  const end = source.indexOf("\n\n", start);
  assert.notEqual(end, -1, `${constName} must have an assignment end`);
  return source.slice(start, end);
}

function normalizeText(value) {
  return value
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
