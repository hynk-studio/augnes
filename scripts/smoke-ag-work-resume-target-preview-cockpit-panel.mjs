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
  "AG_WORK_RESUME_TARGET_PREVIEW_COCKPIT_PANEL_V0_1.md",
);
const designDocPath = path.join(
  rootDir,
  "docs",
  "CROSS_LOCAL_AG_WORK_RESUME_DIRECT_CODE_V0_2.md",
);
const packagePath = path.join(rootDir, "package.json");
const browserReportPath = path.join(
  rootDir,
  "reports",
  "browser",
  "2026-05-31-ag-work-resume-copied-packet-validation-cockpit-panel-verification.md",
);

assert.ok(existsSync(componentPath), "Cockpit component must exist");
assert.ok(existsSync(docsPath), "Cockpit target preview panel docs must exist");
assert.ok(
  existsSync(browserReportPath),
  "copied-packet validation browser verification report must exist",
);

const componentSource = readFileSync(componentPath, "utf8");
const docsSource = readFileSync(docsPath, "utf8");
const designDocSource = readFileSync(designDocPath, "utf8");
const browserReportSource = readFileSync(browserReportPath, "utf8");
const packageJson = JSON.parse(readFileSync(packagePath, "utf8"));

assert.equal(
  packageJson.scripts?.["smoke:ag-work-resume-target-preview-cockpit-panel"],
  "node scripts/smoke-ag-work-resume-target-preview-cockpit-panel.mjs",
  "package.json must expose the Cockpit panel smoke",
);

const panelSource = extractFunctionBlock(
  componentSource,
  "AgResumeTargetPreviewPanel",
);
const validationHandlerSource = extractFunctionBlock(
  componentSource,
  "handleAgResumePacketValidation",
);
const fullPreviewHandlerSource = extractFunctionBlock(
  componentSource,
  "handleAgResumeTargetPreviewSubmit",
);
const fixtureSource = [
  extractConstObjectBlock(componentSource, "SAFE_AG_RESUME_EXAMPLE_PACKET"),
  extractConstObjectBlock(
    componentSource,
    "SAFE_AG_RESUME_EXAMPLE_LOCAL_CONTEXT",
  ),
].join("\n");
const resultsSource = extractFunctionBlock(
  componentSource,
  "AgResumeTargetPreviewResults",
);
const packetValidationResultsSource = extractFunctionBlock(
  componentSource,
  "AgResumePacketValidationResults",
);
const displaySource = [
  packetValidationResultsSource,
  resultsSource,
  extractFunctionBlock(componentSource, "AgResumeFindingList"),
  extractFunctionBlock(componentSource, "AgResumeConflictList"),
  extractFunctionBlock(componentSource, "AgResumeRecommendationList"),
  extractFunctionBlock(componentSource, "AgResumeForeignRefsPanel"),
].join("\n");

for (const token of [
  "agResumePacketInput",
  "agResumeLocalContextInput",
  "agResumePacketValidationResult",
  "agResumePacketValidationError",
  "agResumePacketValidationBusy",
  "agResumeTargetPreviewResult",
  "agResumeTargetPreviewError",
]) {
  assert.match(panelSource, new RegExp(token), `panel must use ${token}`);
}

for (const label of [
  "AG Resume Packet JSON",
  "Explicit Local B context JSON",
  "Strict target preview",
  "Skip packet preflight",
  "Treat dirty worktree / repo gaps more conservatively.",
  "Debug only; not recommended before relying on a preview.",
  "Debug only; run ag:resume-preflight before relying on this preview.",
  "Load safe example packet",
  "Load safe example Local B context",
  "Clear AG resume inputs",
  "Validate pasted packet only",
  "Packet validation uses local: null and always runs strict preflight",
  "Run read-only target preview",
]) {
  assert.match(panelSource, new RegExp(escapeRegExp(label)), `panel must show ${label}`);
}

for (const componentToken of [
  "Copied packet validation",
  "Validation is read-only packet review",
  "context_only is expected for packet-only validation",
]) {
  assert.match(
    componentSource,
    new RegExp(escapeRegExp(componentToken)),
    `component source must include ${componentToken}`,
  );
}

assert.match(
  panelSource,
  /fetch\("\/api\/ag-work-resume\/target-preview",\s*\{/,
  "panel must post only to the target preview route",
);
assert.match(panelSource, /method:\s*"POST"/, "panel route call must use POST");
assert.match(
  panelSource,
  /headers:\s*\{\s*"content-type":\s*"application\/json"\s*\}/,
  "panel route call must send application/json",
);
assert.match(
  fullPreviewHandlerSource,
  /body:\s*JSON\.stringify\(\{\s*packet,\s*local,\s*strict:\s*agResumeStrictTargetPreview,\s*skip_preflight:\s*agResumeSkipPreflight,\s*\}\)/s,
  "panel route call must send packet, local, strict, and skip_preflight",
);
assert.ok(
  fullPreviewHandlerSource.indexOf("parseAgResumeObjectInput") <
    fullPreviewHandlerSource.indexOf('fetch("/api/ag-work-resume/target-preview"'),
  "panel must parse JSON locally before route call",
);
assert.match(
  fullPreviewHandlerSource,
  /allowEmpty:\s*true/,
  "empty Local B context input must be allowed and sent as local null",
);

assert.ok(
  validationHandlerSource.indexOf("parseAgResumeObjectInput") <
    validationHandlerSource.indexOf('fetch("/api/ag-work-resume/target-preview"'),
  "validation handler must parse packet JSON locally before the route call",
);
assert.match(
  validationHandlerSource,
  /"AG Resume Packet JSON"/,
  "validation handler must parse the packet JSON input",
);
assert.doesNotMatch(
  validationHandlerSource,
  /agResumeLocalContextInput|Explicit Local B context JSON/,
  "validation handler must not parse or depend on Local B context input",
);
assert.match(
  validationHandlerSource,
  /body:\s*JSON\.stringify\(\{\s*packet,\s*local:\s*null,\s*strict:\s*true,\s*skip_preflight:\s*false,\s*\}\)/s,
  "validation handler must send local null, strict true, and skip_preflight false",
);
assert.doesNotMatch(
  validationHandlerSource,
  /agResumeSkipPreflight|agResumeStrictTargetPreview/,
  "validation handler must ignore full-preview checkbox state",
);

const routeStrings = [
  ...panelSource.matchAll(/["'`]((?:\/api\/)[^"'`]+)["'`]/g),
].map((match) => match[1]);
assert.deepEqual(
  [...new Set(routeStrings)],
  ["/api/ag-work-resume/target-preview"],
  "panel must not reference any other API route",
);

for (const forbiddenSource of [
  "localStorage",
  "sessionStorage",
  "indexedDB",
  "/api/work",
  "/api/actions",
  "/api/deltas",
  "/api/bridge",
  "/api/proof",
  "/api/evidence",
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
  2,
  "panel must have exactly two fetch calls for the two read-only route actions",
);

const buttonBlocks = [...panelSource.matchAll(/<button[\s\S]*?<\/button>/g)].map(
  (match) => match[0],
);
assert.ok(buttonBlocks.length > 0, "panel should expose a route preview button");
const submitButtonBlocks = buttonBlocks.filter((buttonBlock) =>
  /type="submit"/.test(buttonBlock),
);
assert.equal(
  submitButtonBlocks.length,
  1,
  "preview button must be the only submit button",
);
assert.match(
  submitButtonBlocks[0],
  /Run read-only target preview/,
  "the submit button must remain the read-only preview action",
);
for (const label of [
  "Load safe example packet",
  "Load safe example Local B context",
  "Clear AG resume inputs",
  "Validate pasted packet only",
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

for (const handlerName of [
  "loadSafeAgResumeExamplePacket",
  "loadSafeAgResumeExampleLocalContext",
  "clearAgResumeInputs",
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

for (const buttonBlock of buttonBlocks) {
  const literalLabels = [...buttonBlock.matchAll(/["'`]([^"'`]+)["'`]/g)]
    .map((match) => match[1])
    .join(" ");
  const normalizedButton = normalizeText(`${buttonBlock} ${literalLabels}`);
  for (const forbiddenLabel of [
    "execute codex",
    "run codex",
    "start codex",
    "merge",
    "approve",
    "publish",
    "retry",
    "replay",
    "record evidence",
    "record proof",
    "create work item",
    "create mapping record",
    "bind session",
    "import",
    "persist",
    "direct resume code",
    "relay",
  ]) {
    assert.ok(
      !normalizedButton.includes(forbiddenLabel),
      `panel action labels must not include "${forbiddenLabel}"`,
    );
  }
}

assert.match(
  fixtureSource,
  /SAFE_AG_RESUME_EXAMPLE_PACKET/,
  "component must include a safe packet fixture",
);
assert.match(
  fixtureSource,
  /SAFE_AG_RESUME_EXAMPLE_LOCAL_CONTEXT/,
  "component must include a safe Local B context fixture",
);
for (const fixtureToken of [
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
  "runtime_available: true",
  "base_commit_reachable: true",
  "dirty_worktree: false",
  "expected_files_missing: []",
  'mapping_status: "confirmed"',
]) {
  assert.match(
    fixtureSource,
    new RegExp(escapeRegExp(fixtureToken)),
    `fixtures must include ${fixtureToken}`,
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

for (const displayToken of [
  "HTTP Status",
  "Route ok",
  "Preview status",
  "preview.status",
  "Copied packet validation",
  "HTTP status:",
  "route ok:",
  "preflight ran:",
  "preflight ok:",
  "preflight status:",
  "Preflight warnings",
  "Preflight failures",
  "route recommended_next_step",
  "Validation is read-only packet review",
  "context_only is expected for packet-only validation",
  "OK to continue",
  "preview.ok_to_continue",
  "OK only for user/Core review. This is not Codex execution authority.",
  "recommended_next_step",
  "Preflight",
  "ran:",
  "ok:",
  "status:",
  "Warnings",
  "Failures",
  "Gaps",
  "Conflicts",
  "Recommendations",
  "Authority Boundary",
  "packet_summary.foreign_refs",
  "Foreign action refs",
  "Foreign evidence refs",
  "Foreign session refs",
]) {
  assert.match(
    displaySource,
    new RegExp(escapeRegExp(displayToken)),
    `result display must include ${displayToken}`,
  );
}

for (const boundaryText of [
  "Read-only target preview.",
  "Uses an already built packet and explicit Local B context.",
  "No import/persist/work item/mapping/proof/evidence/session/Codex",
  "ok_to_continue means user/Core review only.",
  "Foreign refs remain foreign until user/Core confirms mapping",
]) {
  assert.match(
    panelSource,
    new RegExp(escapeRegExp(boundaryText)),
    `panel must show boundary text: ${boundaryText}`,
  );
}

for (const docsPattern of [
  /read-only Operator tab surface/i,
  /already built packet and explicit Local B context/i,
  /Strict target preview/i,
  /Skip packet preflight/i,
  /Load safe example packet/i,
  /Load safe example Local B context/i,
  /Clear AG resume inputs/i,
  /Validate pasted packet only/i,
  /local: null/i,
  /strict: true/i,
  /skip_preflight: false/i,
  /always runs strict preflight/i,
  /ignores the\s+skip-preflight checkbox/i,
  /does not require or parse\s+`Explicit Local B context JSON`/i,
  /context_only.*expected.*packet-only validation/is,
  /read-only packet review/i,
  /does not map,\s*import,\s*persist/is,
  /create work items,\s*create mapping records,\s*record\s+proof\/evidence,\s*bind sessions/is,
  /execute Codex,\s*approve,\s*publish,\s*retry,\s*replay,\s*merge,\s*mutate state/is,
  /Direct Resume Code routes/i,
  /relay packet data/i,
  /synthetic, public-safe, and not persisted/i,
  /fixture buttons update local React state only/i,
  /fixture buttons.*do not call routes/is,
  /validation button and the read-only full preview\s+button call only `\/api\/ag-work-resume\/target-preview`/i,
  /Invalid JSON is rejected in\s+the browser before any route call/i,
  /Empty input sends\s+`local: null`/i,
  /No DB\/schema changes/i,
  /No runtime discovery/i,
  /No import\/persist\/work item\/mapping\/proof\/evidence\/session\/Codex/i,
  /No Direct Resume Code route/i,
  /No relay/i,
  /ok_to_continue.*user\/Core review only/i,
  /Foreign refs remain foreign/i,
  /does not modify route behavior/i,
  /Browser verification/i,
]) {
  assert.match(docsSource, docsPattern, `docs must mention ${docsPattern}`);
}

for (const reportPattern of [
  /Validate pasted packet only/i,
  /context_only expected/i,
  /strict preflight pass/i,
  /no unauthorized controls/i,
]) {
  assert.match(
    browserReportSource,
    reportPattern,
    `browser report must mention ${reportPattern}`,
  );
}

assert.match(
  designDocSource,
  /AG_WORK_RESUME_TARGET_PREVIEW_COCKPIT_PANEL_V0_1\.md/,
  "cross-local design doc should point to the Cockpit panel slice",
);

console.log(
  JSON.stringify(
    {
      smoke: "ag-work-resume-target-preview-cockpit-panel",
      cases: [
        "package script is present",
        "Operator tab panel source is present",
        "panel exposes packet/local JSON textareas and strict/skip_preflight controls",
        "panel exposes local-only safe fixture buttons",
        "panel exposes copied-packet validation without Local B context",
        "safe fixture buttons are type button and do not fetch or persist",
        "safe fixtures pass static public-safe guards",
        "panel parses JSON locally before posting either route action",
        "validation action sends local null, strict true, and skip_preflight false",
        "validation action ignores full-preview checkbox state",
        "empty Local B input is allowed as local null",
        "panel posts only to /api/ag-work-resume/target-preview",
        "preview action remains the only submit button",
        "panel displays route status, preflight, preview, foreign refs, and authority boundary",
        "panel displays copied-packet validation status and context_only expectation",
        "panel action labels do not expose forbidden authority controls",
        "docs capture read-only boundary and browser verification expectation",
        "browser verification report exists for copied-packet validation",
        "cross-local design doc points to the Cockpit panel slice",
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
        mode = "code";
        index += 1;
      }
      continue;
    }
    if (mode === "single-quote") {
      if (char === "'" && previous !== "\\") mode = "code";
      continue;
    }
    if (mode === "double-quote") {
      if (char === '"' && previous !== "\\") mode = "code";
      continue;
    }
    if (mode === "template") {
      if (char === "`" && previous !== "\\") mode = "code";
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
      mode = "single-quote";
      continue;
    }
    if (char === '"') {
      mode = "double-quote";
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

  assert.fail(`${functionName} body was not closed`);
}

function extractConstObjectBlock(source, constName) {
  const start = source.indexOf(`const ${constName} =`);
  assert.notEqual(start, -1, `${constName} must exist`);
  const firstBrace = source.indexOf("{", start);
  assert.notEqual(firstBrace, -1, `${constName} must have an object body`);
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
        mode = "code";
        index += 1;
      }
      continue;
    }
    if (mode === "single-quote") {
      if (char === "'" && previous !== "\\") mode = "code";
      continue;
    }
    if (mode === "double-quote") {
      if (char === '"' && previous !== "\\") mode = "code";
      continue;
    }
    if (mode === "template") {
      if (char === "`" && previous !== "\\") mode = "code";
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
      mode = "single-quote";
      continue;
    }
    if (char === '"') {
      mode = "double-quote";
      continue;
    }
    if (char === "`") {
      mode = "template";
      continue;
    }
    if (char === "{") depth += 1;
    if (char === "}") {
      depth -= 1;
      if (depth === 0) {
        const statementEnd = source.indexOf(";", index);
        return source.slice(start, statementEnd === -1 ? index + 1 : statementEnd + 1);
      }
    }
  }

  assert.fail(`${constName} object was not closed`);
}

function findFunctionBodyBrace(source, firstParen) {
  let depth = 0;
  for (let index = firstParen; index < source.length; index += 1) {
    const char = source[index];
    if (char === "(") depth += 1;
    if (char === ")") {
      depth -= 1;
      if (depth === 0) {
        const bodyStart = source.indexOf("{", index);
        assert.notEqual(bodyStart, -1, "function body brace must exist");
        return bodyStart;
      }
    }
  }
  assert.fail("function parameters were not closed");
}

function normalizeText(value) {
  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/\{[^}]*\}/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
