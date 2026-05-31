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
  "AG_WORK_RESUME_MAPPING_PROPOSAL_PREVIEW_COCKPIT_PANEL_V0_1.md",
);
const routeDocsPath = path.join(
  rootDir,
  "docs",
  "AG_WORK_RESUME_MAPPING_PROPOSAL_PREVIEW_ROUTE_V0_1.md",
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
  "2026-05-31-ag-work-resume-mapping-proposal-cockpit-panel-verification.md",
);

assert.ok(existsSync(componentPath), "Cockpit component must exist");
assert.ok(existsSync(docsPath), "mapping proposal Cockpit docs must exist");
assert.ok(existsSync(routeDocsPath), "mapping proposal route docs must exist");
assert.ok(existsSync(gateDocsPath), "mapping/import authority gate docs must exist");
assert.ok(
  existsSync(browserReportPath),
  "mapping proposal Cockpit browser verification report must exist",
);

const componentSource = readFileSync(componentPath, "utf8");
const docsSource = readFileSync(docsPath, "utf8");
const routeDocsSource = readFileSync(routeDocsPath, "utf8");
const gateDocsSource = readFileSync(gateDocsPath, "utf8");
const browserReportSource = readFileSync(browserReportPath, "utf8");
const packageJson = JSON.parse(readFileSync(packagePath, "utf8"));

assert.equal(
  packageJson.scripts?.[
    "smoke:ag-work-resume-mapping-proposal-preview-cockpit-panel"
  ],
  "node scripts/smoke-ag-work-resume-mapping-proposal-preview-cockpit-panel.mjs",
  "package.json must expose the mapping proposal Cockpit panel smoke",
);

const panelSource = extractFunctionBlock(
  componentSource,
  "AgResumeMappingProposalPreviewPanel",
);
const submitHandlerSource = extractFunctionBlock(
  componentSource,
  "handleAgResumeMappingProposalPreviewSubmit",
);
const resultSource = [
  extractFunctionBlock(componentSource, "AgResumeMappingProposalPreviewResults"),
  extractFunctionBlock(componentSource, "AgResumeMappingWorkSummaryCard"),
  extractFunctionBlock(componentSource, "AgResumeMappingCandidateSummaryCard"),
  extractFunctionBlock(componentSource, "AgResumeMappingComparisonPanel"),
  extractFunctionBlock(componentSource, "AgResumeMappingFindingList"),
  extractFunctionBlock(componentSource, "AgResumeMappingQuestionList"),
  extractFunctionBlock(componentSource, "AgResumeMappingAuthorityBoundary"),
  extractFunctionBlock(componentSource, "AgResumeForeignRefsPanel"),
].join("\n");
const fixtureSource = [
  extractConstAssignment(componentSource, "SAFE_AG_RESUME_MAPPING_EXAMPLE_PACKET"),
  extractConstAssignment(
    componentSource,
    "SAFE_AG_RESUME_MAPPING_EXAMPLE_CANDIDATES",
  ),
  extractConstAssignment(
    componentSource,
    "SAFE_AG_RESUME_MAPPING_CONFLICTING_CANDIDATES",
  ),
  extractConstAssignment(
    componentSource,
    "SAFE_AG_RESUME_MAPPING_PREFLIGHT_FAILING_PACKET",
  ),
].join("\n");

for (const token of [
  "AG Resume Mapping Proposal Preview",
  "Read-only and proposal-only mapping proposal preview.",
  "Not mapping confirmation",
  "not import authorization",
  "not persistence",
  "Not proof/evidence authorization",
  "not Codex execution authority",
  "not merge/publish authority",
  "Durable approval remains user/Core gated.",
  "This panel does not run packet preflight",
  "agResumeMappingPacketInput",
  "agResumeMappingCandidatesInput",
  "agResumeMappingSelectedCandidateId",
  "agResumeMappingStrictPreview",
  "agResumeMappingProposalResult",
  "agResumeMappingPacketError",
  "agResumeMappingCandidatesError",
  "agResumeMappingRouteError",
]) {
  assert.match(panelSource, new RegExp(escapeRegExp(token)), `panel must include ${token}`);
}

assert.match(
  panelSource,
  /fetch\(\s*"\/api\/ag-work-resume\/mapping-proposal-preview"/,
  "panel must post to the mapping proposal preview route",
);
assert.match(panelSource, /method:\s*"POST"/, "panel route call must use POST");
assert.match(
  panelSource,
  /headers:\s*\{\s*"content-type":\s*"application\/json"\s*\}/,
  "panel route call must send application/json",
);
assert.match(
  submitHandlerSource,
  /body:\s*JSON\.stringify\(\{\s*packet,\s*candidates,\s*selected_candidate_id:\s*selectedCandidateId,\s*strict:\s*agResumeMappingStrictPreview,\s*source:\s*\{\s*reviewed_by_surface:\s*"cockpit",\s*reviewed_at:\s*new Date\(\)\.toISOString\(\),\s*\},\s*\}\)/s,
  "panel route body must send packet, candidates, selected_candidate_id, strict, and cockpit source timestamp",
);
const submitRouteIndex = submitHandlerSource.indexOf(
  "/api/ag-work-resume/mapping-proposal-preview",
);
assert.notEqual(
  submitRouteIndex,
  -1,
  "submit handler must call the mapping proposal preview route",
);
assert.ok(
  submitHandlerSource.indexOf("parseAgResumeObjectInput") < submitRouteIndex,
  "panel must parse packet JSON locally before route call",
);
assert.ok(
  submitHandlerSource.indexOf("parseAgResumeArrayInput") < submitRouteIndex,
  "panel must parse candidate JSON locally before route call",
);
assert.match(
  submitHandlerSource,
  /selectedCandidateId\s*=\s*agResumeMappingSelectedCandidateId\.trim\(\)\s*\|\|\s*null/,
  "empty selected candidate id must be sent as null",
);
assert.match(
  submitHandlerSource,
  /Mapping proposal route returned a non-JSON response/,
  "panel must show a safe local route error for non-JSON responses",
);

const routeStrings = [
  ...panelSource.matchAll(/["'`]((?:\/api\/)[^"'`]+)["'`]/g),
].map((match) => match[1]);
assert.deepEqual(
  [...new Set(routeStrings)],
  ["/api/ag-work-resume/mapping-proposal-preview"],
  "panel must not reference any other API route",
);

for (const forbiddenSource of [
  "localStorage",
  "sessionStorage",
  "indexedDB",
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
  "telemetry",
  "analytics",
]) {
  assert.doesNotMatch(
    panelSource,
    new RegExp(escapeRegExp(forbiddenSource), "i"),
    `panel must not reference ${forbiddenSource}`,
  );
}

assert.equal(
  [...panelSource.matchAll(/\bfetch\(/g)].length,
  1,
  "mapping proposal panel must have exactly one read-only route fetch",
);

for (const accessibilityToken of [
  'htmlFor="ag-resume-mapping-packet-json-input"',
  'htmlFor="ag-resume-mapping-candidates-json-input"',
  'htmlFor="ag-resume-mapping-selected-candidate-id-input"',
  'htmlFor="ag-resume-mapping-strict-preview-input"',
  'id="ag-resume-mapping-packet-json-input"',
  'id="ag-resume-mapping-candidates-json-input"',
  'id="ag-resume-mapping-selected-candidate-id-input"',
  'id="ag-resume-mapping-strict-preview-input"',
  "Paste an already built and preflighted AG Resume Packet. This panel does not run packet preflight.",
  "Paste explicit Local B candidate work items. This panel does not discover local work items.",
  "Leave empty to let the preview report needs_candidate when multiple candidates exist.",
  "Treat repo gaps such as dirty worktree or missing expected files more conservatively.",
  "aria-describedby",
  "aria-invalid",
  'role="alert"',
  "Mapping packet error:",
  "Mapping candidates error:",
  "Mapping proposal route error:",
  "aria-busy",
]) {
  assert.match(
    panelSource,
    new RegExp(escapeRegExp(accessibilityToken)),
    `panel must include accessibility token ${accessibilityToken}`,
  );
}

for (const [groupLabel, headingId] of [
  ["Mapping safe fixture controls", "ag-resume-mapping-safe-fixtures-heading"],
  [
    "Mapping error/edge fixture controls",
    "ag-resume-mapping-edge-fixtures-heading",
  ],
  ["Mapping proposal input controls", "ag-resume-mapping-inputs-heading"],
  ["Mapping proposal options", "ag-resume-mapping-options-heading"],
  [
    "Mapping proposal action controls",
    "ag-resume-mapping-action-controls-heading",
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

assert.doesNotMatch(
  panelSource,
  /role="button"/,
  "panel must use native buttons instead of role=button controls",
);
assert.doesNotMatch(
  panelSource,
  /onKeyDown|onKeyUp|onKeyPress/,
  "panel must not add custom keyboard shortcut handlers",
);
assert.match(
  resultSource,
  /aria-live="polite"/,
  "result section must use aria-live polite",
);
assert.match(
  resultSource,
  /aria-labelledby="ag-resume-mapping-proposal-preview-result-heading"/,
  "result section must have a stable labelled heading",
);

for (const fixtureToken of [
  "SAFE_AG_RESUME_MAPPING_EXAMPLE_PACKET",
  "SAFE_AG_RESUME_MAPPING_EXAMPLE_CANDIDATES",
  "SAFE_AG_RESUME_MAPPING_CONFLICTING_CANDIDATES",
  "SAFE_AG_RESUME_MAPPING_PREFLIGHT_FAILING_PACKET",
  "augnes.ag_work_resume_packet.v0_2",
  "ag_work_resume_packet",
  "https://github.com/hynk-studio/augnes.git",
  "preview_only_by_default: true",
  "may_create_local_work_item: false",
  "may_bind_session: false",
  "may_commit_or_reject_state: false",
  "may_execute_codex: false",
  "may_merge: false",
  "may_publish_or_replay: false",
  "raw_db_paths_included: false",
  "secrets_included: false",
  "tunnel_urls_included: false",
  "local_absolute_paths_included: false",
  "screenshots_or_media_included: false",
  "raw_openai_responses_included: false",
  "max_recent_work_events: 10",
  "max_foreign_evidence_refs: 20",
  "summaries_only: true",
  "raw_logs_included: false",
  "candidate_id",
  "local_scope",
  "local_work_id",
  "remote_matches: true",
  "base_commit_reachable: true",
  "dirty_worktree: false",
  "expected_files_present",
  "expected_files_missing: []",
]) {
  assert.match(
    fixtureSource,
    new RegExp(escapeRegExp(fixtureToken)),
    `fixtures must include ${fixtureToken}`,
  );
}

assert.match(
  fixtureSource,
  /SAFE_AG_RESUME_MAPPING_PREFLIGHT_FAILING_PACKET[\s\S]*may_execute_codex:\s*true/,
  "preflight-failing fixture must fail through safe target policy",
);

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
  "loadSafeAgResumeMappingExamplePacket",
  "loadSafeAgResumeMappingExampleCandidates",
  "loadNoCandidateAgResumeMappingExample",
  "loadConflictingAgResumeMappingCandidateExample",
  "loadPreflightFailingAgResumeMappingPacket",
  "clearAgResumeMappingProposalInputs",
]) {
  const handlerSource = extractFunctionBlock(componentSource, handlerName);
  assert.doesNotMatch(handlerSource, /\bfetch\(/, `${handlerName} must not fetch`);
  assert.doesNotMatch(handlerSource, /\/api\//, `${handlerName} must not call routes`);
  assert.doesNotMatch(
    handlerSource,
    /localStorage|sessionStorage|indexedDB/i,
    `${handlerName} must not persist browser state`,
  );
}

assert.match(
  extractFunctionBlock(componentSource, "loadNoCandidateAgResumeMappingExample"),
  /setAgResumeMappingCandidatesInput\(""\)[\s\S]*setAgResumeMappingSelectedCandidateId\(""\)/,
  "no-candidate fixture must clear candidates and selected candidate id",
);
assert.match(
  extractFunctionBlock(
    componentSource,
    "loadConflictingAgResumeMappingCandidateExample",
  ),
  /SAFE_AG_RESUME_MAPPING_CONFLICTING_CANDIDATES/,
  "conflicting candidate fixture must load conflicting candidates",
);

const buttonBlocks = [...panelSource.matchAll(/<button[\s\S]*?<\/button>/g)].map(
  (match) => match[0],
);
const submitButtonBlocks = buttonBlocks.filter((buttonBlock) =>
  /type="submit"/.test(buttonBlock),
);
assert.equal(
  submitButtonBlocks.length,
  1,
  "route preview action must be the only submit button",
);
assert.match(
  submitButtonBlocks[0],
  /Run read-only mapping proposal preview/,
  "submit button must be the read-only mapping proposal preview action",
);
for (const label of [
  "Load safe mapping example packet",
  "Load safe mapping example candidates",
  "Load no-candidate example",
  "Load conflicting candidate example",
  "Load preflight-failing mapping packet",
  "Clear mapping proposal inputs",
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
  ]) {
    assert.ok(
      !normalizedButton.includes(forbiddenLabel),
      `panel action labels must not include "${forbiddenLabel}"`,
    );
  }
}

for (const displayToken of [
  "Mapping proposal preview result",
  "HTTP Status",
  "Route ok",
  "Preview status",
  "preview.status",
  "OK for user/Core review",
  "preview.ok_for_user_core_review",
  "recommended_next_step",
  "Match confidence",
  "match_confidence_label",
  "Selected candidate summary",
  "Comparison",
  "Gaps",
  "Conflicts",
  "Questions",
  "Recommendations",
  "Foreign refs",
  "packet_summary.foreign_refs",
  "Authority Boundary",
  "ok_for_user_core_review means review only",
  "not mapping",
  "import authorization",
  "Codex execution authority",
  "Foreign refs remain foreign",
  "no mapping proposal gaps",
  "creates_mapping_record",
  "creates_import_record",
  "creates_work_item",
  "records_proof",
  "records_evidence",
  "binds_session",
  "executes_codex",
  "merge_authority",
  "state_mutation",
]) {
  assert.match(
    resultSource,
    new RegExp(escapeRegExp(displayToken), "i"),
    `result display must include ${displayToken}`,
  );
}

for (const safetyToken of [
  "ok_for_user_core_review means review only. It is not mapping",
  "Foreign refs remain foreign until a separate reconciliation authority gate exists.",
  "This panel does not create mapping records, import records, work items",
]) {
  assert.match(
    resultSource,
    new RegExp(escapeRegExp(safetyToken), "i"),
    `result display must include safety copy ${safetyToken}`,
  );
}

for (const docsPattern of [
  /read-only/i,
  /proposal-only/i,
  /Operator tab/i,
  /Mapping proposal packet JSON/i,
  /Local B candidate work items JSON/i,
  /Selected candidate id/i,
  /Strict mapping proposal preview/i,
  /Load safe mapping example packet/i,
  /Load safe mapping example candidates/i,
  /Load no-candidate example/i,
  /Load conflicting candidate example/i,
  /Load preflight-failing mapping packet/i,
  /Clear mapping proposal inputs/i,
  /HTTP status/i,
  /ok_for_user_core_review/i,
  /comparison/i,
  /gaps/i,
  /conflicts/i,
  /questions/i,
  /recommendations/i,
  /foreign refs/i,
  /authority boundary/i,
  /Mapping packet error/i,
  /Mapping candidates error/i,
  /Mapping proposal route error/i,
  /blocked unsafe policy/i,
  /conflict/i,
  /Accessibility Behavior/i,
  /label` \/ `htmlFor`/i,
  /aria-describedby/i,
  /role="alert"/i,
  /aria-live="polite"/i,
  /native buttons/i,
  /No DB\/schema changes/i,
  /No runtime discovery/i,
  /No route-side DB reads/i,
  /No persistence/i,
  /No import/i,
  /No mapping record creation/i,
  /No import record creation/i,
  /No work item creation/i,
  /No proof\/evidence recording/i,
  /No session binding/i,
  /No Direct Resume Code route/i,
  /No relay/i,
  /No Codex execution/i,
  /No approval, publish, retry, replay, external posting, merge, auto-merge, or\s+committed-state mutation/i,
  /Browser verification/i,
  /mapping confirmation and persistence remain a separately gated future design/i,
]) {
  assert.match(docsSource, docsPattern, `docs must mention ${docsPattern}`);
}

assert.match(
  routeDocsSource,
  /AG_WORK_RESUME_MAPPING_PROPOSAL_PREVIEW_COCKPIT_PANEL_V0_1\.md/,
  "route docs must point to the Cockpit panel doc",
);
assert.match(
  gateDocsSource,
  /Cockpit Operator tab panel[\s\S]*Stage A\s+preview-only/i,
  "authority gate docs must mention the Cockpit panel remains Stage A preview-only",
);

for (const reportPattern of [
  /safe fixture route call[\s\S]*candidate_review/i,
  /no-candidate result/i,
  /conflict result/i,
  /preflight-failing blocked result/i,
  /local parse error/i,
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
      smoke: "ag-work-resume-mapping-proposal-preview-cockpit-panel",
      cases: [
        "package script is present",
        "Operator tab mapping proposal panel source is present",
        "panel posts only to /api/ag-work-resume/mapping-proposal-preview",
        "panel locally parses packet JSON and candidate array JSON before fetch",
        "empty candidate input maps to [] and empty selected candidate id maps to null",
        "panel includes accessible labels, helper text, grouped controls, alert errors, and live result region",
        "panel uses native controls without custom keyboard shortcuts",
        "safe and edge fixture buttons are type button and do not fetch or persist",
        "safe fixtures pass static public-safe guards",
        "preflight-failing fixture fails through safe target policy",
        "button labels do not expose forbidden authority controls",
        "result display includes status, comparison, questions, recommendations, foreign refs, and authority boundary",
        "docs capture read-only/proposal-only boundary, non-goals, accessibility, and browser verification",
        "route and authority-gate docs point to the Cockpit panel slice",
        "browser verification report exists for safe, edge, parse, accessibility, and unauthorized-control checks",
      ],
    },
    null,
    2,
  ),
);

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
    if (mode === "single" || mode === "double" || mode === "template") {
      if (char === "\\" && next) {
        index += 1;
        continue;
      }
      if (
        (mode === "single" && char === "'") ||
        (mode === "double" && char === '"') ||
        (mode === "template" && char === "`")
      ) {
        mode = "code";
      }
      continue;
    }

    if (char === "/" && next === "/") {
      mode = "line-comment";
      index += 1;
      continue;
    }
    if (char === "/" && next === "*") {
      mode = "block-comment";
      index += 1;
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
      assert.ok(depth >= 0, `${functionName} parse depth must not go negative`);
    }
    assert.notEqual(previous, "\u0000");
  }

  assert.fail(`${functionName} block was not closed`);
}

function findFunctionBodyBrace(source, fromIndex) {
  let mode = "code";
  let parenDepth = 0;
  let seenOpeningParen = false;
  for (let index = fromIndex; index < source.length; index += 1) {
    const char = source[index];
    const next = source[index + 1];

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
    if (mode === "single" || mode === "double" || mode === "template") {
      if (char === "\\" && next) {
        index += 1;
        continue;
      }
      if (
        (mode === "single" && char === "'") ||
        (mode === "double" && char === '"') ||
        (mode === "template" && char === "`")
      ) {
        mode = "code";
      }
      continue;
    }

    if (char === "/" && next === "/") {
      mode = "line-comment";
      index += 1;
      continue;
    }
    if (char === "/" && next === "*") {
      mode = "block-comment";
      index += 1;
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
    if (char === "(") {
      parenDepth += 1;
      seenOpeningParen = true;
      continue;
    }
    if (char === ")") {
      parenDepth -= 1;
      assert.ok(parenDepth >= 0, "function parameter parse depth must not go negative");
      continue;
    }
    if (seenOpeningParen && parenDepth === 0 && char === "{") return index;
  }
  return -1;
}

function extractConstAssignment(source, constName) {
  const start = source.indexOf(`const ${constName}`);
  assert.notEqual(start, -1, `${constName} must exist`);
  const equalsIndex = source.indexOf("=", start);
  assert.notEqual(equalsIndex, -1, `${constName} must have an assignment`);
  const firstDelimiter = findFirstAssignmentDelimiter(source, equalsIndex + 1);
  assert.notEqual(firstDelimiter, -1, `${constName} assignment must have a value`);
  const opening = source[firstDelimiter];
  const closing = opening === "{" ? "}" : "]";
  let depth = 0;
  let mode = "code";

  for (let index = firstDelimiter; index < source.length; index += 1) {
    const char = source[index];
    const next = source[index + 1];

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
    if (mode === "single" || mode === "double" || mode === "template") {
      if (char === "\\" && next) {
        index += 1;
        continue;
      }
      if (
        (mode === "single" && char === "'") ||
        (mode === "double" && char === '"') ||
        (mode === "template" && char === "`")
      ) {
        mode = "code";
      }
      continue;
    }

    if (char === "/" && next === "/") {
      mode = "line-comment";
      index += 1;
      continue;
    }
    if (char === "/" && next === "*") {
      mode = "block-comment";
      index += 1;
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
    if (char === opening) depth += 1;
    if (char === closing) {
      depth -= 1;
      if (depth === 0) return source.slice(start, index + 1);
      assert.ok(depth >= 0, `${constName} parse depth must not go negative`);
    }
  }
  assert.fail(`${constName} assignment was not closed`);
}

function findFirstAssignmentDelimiter(source, fromIndex) {
  for (let index = fromIndex; index < source.length; index += 1) {
    if (source[index] === "{" || source[index] === "[") return index;
  }
  return -1;
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeText(value) {
  return value.replace(/\s+/g, " ").trim().toLowerCase();
}
