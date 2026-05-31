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
  "AG_WORK_RESUME_MAPPING_PROPOSAL_LIFECYCLE_ACTION_COCKPIT_PANEL_V0_1.md",
);
const routeDocsPath = path.join(
  rootDir,
  "docs",
  "AG_WORK_RESUME_MAPPING_PROPOSAL_LIFECYCLE_ACTION_ROUTE_V0_1.md",
);
const helperDocsPath = path.join(
  rootDir,
  "docs",
  "AG_WORK_RESUME_MAPPING_PROPOSAL_LIFECYCLE_ACTION_HELPER_V0_1.md",
);
const readPanelDocsPath = path.join(
  rootDir,
  "docs",
  "AG_WORK_RESUME_MAPPING_PROPOSAL_RECORD_READ_COCKPIT_PANEL_V0_1.md",
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
  "2026-05-31-ag-work-resume-mapping-proposal-lifecycle-action-cockpit-panel-verification.md",
);
const lifecycleRoute =
  "/api/ag-work-resume/mapping-proposal-records/lifecycle-actions";
const docsName =
  "AG_WORK_RESUME_MAPPING_PROPOSAL_LIFECYCLE_ACTION_COCKPIT_PANEL_V0_1.md";

for (const file of [
  componentPath,
  docsPath,
  routeDocsPath,
  helperDocsPath,
  readPanelDocsPath,
  gateDocsPath,
  packagePath,
  browserReportPath,
]) {
  assert.ok(existsSync(file), `${file} must exist`);
}

const componentSource = readFileSync(componentPath, "utf8");
const docsSource = readFileSync(docsPath, "utf8");
const routeDocsSource = readFileSync(routeDocsPath, "utf8");
const helperDocsSource = readFileSync(helperDocsPath, "utf8");
const readPanelDocsSource = readFileSync(readPanelDocsPath, "utf8");
const gateDocsSource = readFileSync(gateDocsPath, "utf8");
const browserReportSource = readFileSync(browserReportPath, "utf8");
const packageJson = JSON.parse(readFileSync(packagePath, "utf8"));

assert.equal(
  packageJson.scripts?.[
    "smoke:ag-work-resume-mapping-proposal-lifecycle-action-cockpit-panel"
  ],
  "node scripts/smoke-ag-work-resume-mapping-proposal-lifecycle-action-cockpit-panel.mjs",
  "package.json must expose the lifecycle action Cockpit panel smoke",
);

const panelSource = extractFunctionBlock(
  componentSource,
  "AgResumeMappingProposalLifecycleActionPanel",
);
const submitHandlerSource = extractFunctionBlock(
  panelSource,
  "handleLifecycleActionSubmit",
);
const requestBuilderSource = extractFunctionBlock(
  componentSource,
  "buildMappingProposalLifecycleActionRequestBody",
);
const resultSource = [
  extractFunctionBlock(
    componentSource,
    "AgResumeMappingProposalLifecycleActionResults",
  ),
  extractFunctionBlock(
    componentSource,
    "AgResumeMappingProposalLifecycleRecordSnapshot",
  ),
  extractFunctionBlock(
    componentSource,
    "AgResumeMappingProposalLifecycleActionAuthorityBoundary",
  ),
].join("\n");
const fixtureSource = extractConstAssignment(
  componentSource,
  "SAFE_AG_RESUME_MAPPING_PROPOSAL_LIFECYCLE_ACTION_FIXTURE",
);

assert.match(
  componentSource,
  /<AgResumeMappingProposalRecordReviewPanel \/>[\s\S]*<AgResumeMappingProposalLifecycleActionPanel \/>/,
  "Operator tab must render lifecycle controls after the proposal record review panel",
);

for (const token of [
  "AG Resume Mapping Proposal Lifecycle Actions",
  "Bounded Cockpit controls for existing proposal review metadata.",
  "Lifecycle updates are proposal review metadata only",
  "existing POST lifecycle action",
  "No proposal creation",
  "replacement proposal creation",
  "confirmed\n            mapping",
  "proof/evidence",
  "Codex execution",
  "approval, publish, retry, replay, or merge authority",
  "Durable approval remains user/Core gated.",
  "proposalId",
  "action",
  "reviewedBy",
  "reviewNote",
  "reviewedAt",
  "replacementProposalId",
  "Mapping proposal lifecycle action route error",
]) {
  assert.match(
    panelSource,
    new RegExp(escapeRegExp(token)),
    `panel must include ${token}`,
  );
}

assert.match(
  submitHandlerSource,
  new RegExp(`fetch\\(\\s*"${escapeRegExp(lifecycleRoute)}"`),
  "panel must call the lifecycle action route",
);
assert.match(submitHandlerSource, /method:\s*"POST"/, "route call must use POST");
assert.doesNotMatch(submitHandlerSource, /method:\s*"GET"/, "panel must not GET");
assert.match(
  submitHandlerSource,
  /headers:\s*\{\s*"content-type":\s*"application\/json"\s*\}/,
  "panel POST must set JSON content type",
);
assert.match(
  submitHandlerSource,
  /body:\s*JSON\.stringify\(requestBody\)/,
  "panel POST must send the validated JSON body",
);

const routeStrings = [
  ...panelSource.matchAll(/["'`]((?:\/api\/)[^"'`]+)["'`]/g),
].map((match) => match[1]);
assert.deepEqual(
  [...new Set(routeStrings)],
  [lifecycleRoute],
  "panel must not reference any API route except the lifecycle action route",
);
assert.equal(
  [...panelSource.matchAll(/\bfetch\(/g)].length,
  1,
  "lifecycle panel must have exactly one route fetch",
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
  "/api/ag-work-resume/mapping-proposal-records?",
  "/api/ag-work-resume/mapping-proposal-records\"",
  "/api/ag-work-resume/mapping-proposal-records'",
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
  'htmlFor="ag-resume-mapping-proposal-lifecycle-proposal-id-input"',
  'htmlFor="ag-resume-mapping-proposal-lifecycle-action-input"',
  'htmlFor="ag-resume-mapping-proposal-lifecycle-reviewed-by-input"',
  'htmlFor="ag-resume-mapping-proposal-lifecycle-review-note-input"',
  'htmlFor="ag-resume-mapping-proposal-lifecycle-reviewed-at-input"',
  'htmlFor="ag-resume-mapping-proposal-lifecycle-replacement-proposal-id-input"',
  'id="ag-resume-mapping-proposal-lifecycle-proposal-id-input"',
  'id="ag-resume-mapping-proposal-lifecycle-action-input"',
  'id="ag-resume-mapping-proposal-lifecycle-reviewed-by-input"',
  'id="ag-resume-mapping-proposal-lifecycle-review-note-input"',
  'id="ag-resume-mapping-proposal-lifecycle-reviewed-at-input"',
  'id="ag-resume-mapping-proposal-lifecycle-replacement-proposal-id-input"',
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
    "Proposal lifecycle safe fixture controls",
    "ag-resume-mapping-proposal-lifecycle-safe-fixtures-heading",
  ],
  [
    "Proposal lifecycle action inputs",
    "ag-resume-mapping-proposal-lifecycle-inputs-heading",
  ],
  [
    "Proposal lifecycle action controls",
    "ag-resume-mapping-proposal-lifecycle-action-controls-heading",
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
  /aria-labelledby="ag-resume-mapping-proposal-lifecycle-action-result-heading"/,
  "result section must have a stable labelled heading",
);

for (const validationToken of [
  "proposal_id is required for lifecycle action.",
  "action is required for lifecycle action.",
  "action must be one of: withdraw, reject, supersede, expire.",
  "reviewed_by is required for lifecycle action.",
  "review_note is required for lifecycle action.",
  "replacement_proposal_id is allowed only for supersede.",
  "reviewed_at must be an ISO UTC timestamp with millisecond precision.",
  "requestBody.reviewed_at = trimmedReviewedAt",
  "requestBody.replacement_proposal_id = trimmedReplacementProposalId",
]) {
  assert.match(
    requestBuilderSource,
    new RegExp(escapeRegExp(validationToken)),
    `request builder must include ${validationToken}`,
  );
}
assert.doesNotMatch(requestBuilderSource, /\bfetch\(/, "request builder must not fetch");
assert.doesNotMatch(requestBuilderSource, /\/api\//, "request builder must not call routes");

for (const fixtureToken of [
  "SAFE_AG_RESUME_MAPPING_PROPOSAL_LIFECYCLE_ACTION_FIXTURE",
  "proposal_ids",
  "ag-resume-mapping-proposal:14dbaabfa7e8585b16181284",
  "ag-resume-mapping-proposal:0cd4f4bf115f41014c5d8491",
  "ag-resume-mapping-proposal:a6c8a67d51a1426f135947d8",
  "ag-resume-mapping-proposal:94ac2e457834768783757a54",
  "ag-resume-mapping-proposal:c7188476bb0f24138b263d32",
  "user-core:cockpit-lifecycle-fixture",
  "Synthetic Cockpit lifecycle review metadata fixture.",
  "2026-05-31T04:00:00.000Z",
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
  "loadSafeLifecycleActionFixture",
  "clearLifecycleActionInputs",
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
assert.equal(
  submitButtonBlocks.length,
  1,
  "lifecycle action must be the only submit button",
);
assert.match(
  submitButtonBlocks[0],
  /Apply lifecycle action/,
  "submit button must be the lifecycle action",
);
for (const label of [
  "Load safe withdraw action",
  "Load safe reject action",
  "Load safe supersede action",
  "Load safe expire action",
  "Clear lifecycle action inputs",
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
    "create proposal",
    "create replacement",
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
  ]) {
    assert.ok(
      !normalizedButton.includes(forbiddenLabel),
      `panel action labels must not include "${forbiddenLabel}"`,
    );
  }
}

for (const displayToken of [
  "Mapping proposal lifecycle action result",
  "Lifecycle action results are proposal review metadata only",
  "HTTP Status",
  "Route ok",
  "Lifecycle status",
  "Action",
  "Proposal id",
  "Before/after status",
  "Updated fields",
  "Warnings",
  "Failures",
  "Lifecycle Authority Boundary",
  "proposal_lifecycle_updated",
  "proposal_review_metadata_only",
  "proposal_record_created",
  "proposal_record_deleted",
  "confirmed_mapping_created",
  "import_record_created",
  "imported_context_created",
  "work_item_created",
  "work_event_created",
  "proof_recorded",
  "evidence_recorded",
  "session_bound",
  "codex_executed",
  "approval_granted",
  "publish_retry_replay_authority",
  "merge_authority",
  "Before proposal record",
  "After proposal record",
  "superseded_by_proposal_id",
]) {
  assert.match(
    resultSource,
    new RegExp(escapeRegExp(displayToken), "i"),
    `result display must include ${displayToken}`,
  );
}

for (const docsPattern of [
  /bounded controls/i,
  /POST \/api\/ag-work-resume\/mapping-proposal-records\/lifecycle-actions/i,
  /proposal_id/i,
  /withdraw.*reject.*supersede.*expire/is,
  /reviewed_by/i,
  /review_note/i,
  /reviewed_at/i,
  /replacement_proposal_id/i,
  /No proposal creation/i,
  /No replacement proposal creation/i,
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

for (const [source, label] of [
  [routeDocsSource, "route docs"],
  [helperDocsSource, "helper docs"],
  [readPanelDocsSource, "read panel docs"],
  [gateDocsSource, "authority gate docs"],
]) {
  assert.match(
    source,
    new RegExp(escapeRegExp(docsName)),
    `${label} must point to the lifecycle Cockpit panel doc`,
  );
}

for (const reportPattern of [
  /withdraw lifecycle action[\s\S]*updated/i,
  /reject lifecycle action[\s\S]*updated/i,
  /expire lifecycle action[\s\S]*updated/i,
  /supersede lifecycle action[\s\S]*updated/i,
  /not_active/i,
  /missing field local validation/i,
  /network inspection[\s\S]*only POST \/api\/ag-work-resume\/mapping-proposal-records\/lifecycle-actions/i,
  /content-type[\s\S]*application\/json/i,
  /proposal row count unchanged/i,
  /replacement row unchanged/i,
  /protected table counts unchanged/i,
  /confirmed mapping.*import.*imported-context.*absent/is,
  /no unauthorized controls/i,
]) {
  assert.match(
    browserReportSource,
    reportPattern,
    `browser report must mention ${reportPattern}`,
  );
}

assertNoUnexpectedChangedFiles();

console.log(
  JSON.stringify(
    {
      smoke: "ag-work-resume-mapping-proposal-lifecycle-action-cockpit-panel",
      cases: [
        "package script is present",
        "Operator tab lifecycle panel source is present after record review panel",
        "panel calls only POST /api/ag-work-resume/mapping-proposal-records/lifecycle-actions",
        "panel sends JSON content type and validated JSON body",
        "panel exposes proposal_id, action, reviewed_by, review_note, reviewed_at, and replacement_proposal_id inputs",
        "panel includes local validation for required fields and supersede-only replacement id",
        "panel includes accessible labels, helper text, grouped controls, alert errors, and live result region",
        "safe fixture buttons are type button and do not fetch or persist",
        "safe lifecycle fixture passes public-safe guards",
        "button labels do not expose forbidden authority controls",
        "result display includes before/after status, updated fields, warnings, failures, record snapshots, and authority boundary",
        "docs capture lifecycle route-only behavior, metadata boundary, non-goals, accessibility, and browser verification",
        "route/helper/read-panel/authority-gate docs point to the lifecycle Cockpit panel slice",
        "browser verification report exists for lifecycle success, not-active, local validation, network, DB, and unauthorized-control checks",
      ],
    },
    null,
    2,
  ),
);

function assertNoUnexpectedChangedFiles() {
  const changedFiles = new Set([
    ...gitLines(["diff", "--name-only"]),
    ...gitLines(["diff", "--cached", "--name-only"]),
    ...gitLines(["ls-files", "--others", "--exclude-standard"]),
  ]);
  const allowedFiles = new Set([
    "components/augnes-cockpit.tsx",
    "docs/AG_WORK_RESUME_MAPPING_PROPOSAL_LIFECYCLE_ACTION_COCKPIT_PANEL_V0_1.md",
    "docs/AG_WORK_RESUME_MAPPING_PROPOSAL_LIFECYCLE_ACTION_ROUTE_V0_1.md",
    "docs/AG_WORK_RESUME_MAPPING_PROPOSAL_LIFECYCLE_ACTION_HELPER_V0_1.md",
    "docs/AG_WORK_RESUME_MAPPING_PROPOSAL_LIFECYCLE_ACTIONS_DESIGN_V0_1.md",
    "docs/AG_WORK_RESUME_CONFIRMED_MAPPING_RECORD_DESIGN_V0_1.md",
    "docs/AG_WORK_RESUME_MAPPING_PROPOSAL_RECORD_DESIGN_V0_1.md",
    "docs/AG_WORK_RESUME_MAPPING_PROPOSAL_RECORD_WRITER_V0_1.md",
    "docs/AG_WORK_RESUME_MAPPING_PROPOSAL_RECORD_READ_V0_1.md",
    "docs/AG_WORK_RESUME_MAPPING_PROPOSAL_RECORD_READ_COCKPIT_PANEL_V0_1.md",
    "docs/AG_WORK_RESUME_MAPPING_IMPORT_AUTHORITY_GATE_V0_1.md",
    "scripts/smoke-ag-work-resume-mapping-proposal-lifecycle-action-cockpit-panel.mjs",
    "scripts/smoke-ag-work-resume-mapping-proposal-lifecycle-action-route.mjs",
    "scripts/smoke-ag-work-resume-mapping-proposal-lifecycle-action.mjs",
    "scripts/smoke-ag-work-resume-confirmed-mapping-record-design.mjs",
    "scripts/smoke-ag-work-resume-mapping-proposal-record-read.mjs",
    "scripts/smoke-ag-work-resume-mapping-proposal-record-writer.mjs",
    "reports/browser/2026-05-31-ag-work-resume-mapping-proposal-lifecycle-action-cockpit-panel-verification.md",
    "package.json",
  ]);
  const forbiddenFiles = [...changedFiles].filter(
    (file) =>
      !allowedFiles.has(file) ||
      (file.startsWith("app/") &&
        file !==
          "app/api/ag-work-resume/mapping-proposal-records/lifecycle-actions/route.ts") ||
      (file.startsWith("components/") && file !== "components/augnes-cockpit.tsx") ||
      file.startsWith("migrations/") ||
      file === "lib/db/schema.sql" ||
      file.startsWith("apps/") ||
      (file.startsWith("reports/browser/") && !allowedFiles.has(file)),
  );
  assert.deepEqual(
    forbiddenFiles,
    [],
    "changed files must stay inside lifecycle Cockpit panel docs/smoke/report/package scope",
  );
}

function extractFunctionBlock(source, functionName) {
  const start = source.indexOf(`function ${functionName}`);
  assert.notEqual(start, -1, `${functionName} must exist`);
  const firstParen = source.indexOf("(", start);
  assert.notEqual(firstParen, -1, `${functionName} must have parameters`);
  const firstBrace = findFunctionBodyBrace(source, firstParen);
  assert.notEqual(firstBrace, -1, `${functionName} must have a body`);
  let depth = 0;
  let mode = "code";

  for (let index = firstBrace; index < source.length; index += 1) {
    const char = source[index];
    const next = source[index + 1];
    const previous = source[index - 1];

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
      if (depth === 0) return source.slice(start, index + 1);
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

function gitLines(args) {
  const output = execFileSync("git", args, {
    cwd: rootDir,
    encoding: "utf8",
    stdio: "pipe",
  });
  return output
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
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
