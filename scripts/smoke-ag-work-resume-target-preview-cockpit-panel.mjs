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

assert.ok(existsSync(componentPath), "Cockpit component must exist");
assert.ok(existsSync(docsPath), "Cockpit target preview panel docs must exist");

const componentSource = readFileSync(componentPath, "utf8");
const docsSource = readFileSync(docsPath, "utf8");
const designDocSource = readFileSync(designDocPath, "utf8");
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
const resultsSource = extractFunctionBlock(
  componentSource,
  "AgResumeTargetPreviewResults",
);
const displaySource = [
  resultsSource,
  extractFunctionBlock(componentSource, "AgResumeFindingList"),
  extractFunctionBlock(componentSource, "AgResumeConflictList"),
  extractFunctionBlock(componentSource, "AgResumeRecommendationList"),
  extractFunctionBlock(componentSource, "AgResumeForeignRefsPanel"),
].join("\n");

for (const token of [
  "agResumePacketInput",
  "agResumeLocalContextInput",
  "agResumeTargetPreviewResult",
  "agResumeTargetPreviewError",
]) {
  assert.match(panelSource, new RegExp(token), `panel must use ${token}`);
}

for (const label of [
  "AG Resume Packet JSON",
  "Explicit Local B context JSON",
  "strict",
  "skip_preflight",
]) {
  assert.match(panelSource, new RegExp(escapeRegExp(label)), `panel must show ${label}`);
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
  panelSource,
  /body:\s*JSON\.stringify\(\{\s*packet,\s*local,\s*strict:\s*agResumeStrictTargetPreview,\s*skip_preflight:\s*agResumeSkipPreflight,\s*\}\)/s,
  "panel route call must send packet, local, strict, and skip_preflight",
);
assert.ok(
  panelSource.indexOf("parseAgResumeObjectInput") <
    panelSource.indexOf('fetch("/api/ag-work-resume/target-preview"'),
  "panel must parse JSON locally before route call",
);
assert.match(
  panelSource,
  /allowEmpty:\s*true/,
  "empty Local B context input must be allowed and sent as local null",
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
]) {
  assert.doesNotMatch(
    panelSource,
    new RegExp(escapeRegExp(forbiddenSource), "i"),
    `panel must not reference ${forbiddenSource}`,
  );
}

const buttonBlocks = [...panelSource.matchAll(/<button[\s\S]*?<\/button>/g)].map(
  (match) => match[0],
);
assert.ok(buttonBlocks.length > 0, "panel should expose a route preview button");
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
  ]) {
    assert.ok(
      !normalizedButton.includes(forbiddenLabel),
      `panel action labels must not include "${forbiddenLabel}"`,
    );
  }
}

for (const displayToken of [
  "HTTP Status",
  "Route ok",
  "preview.status",
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
  /Invalid JSON is rejected in\s+the browser before any route call/i,
  /Empty input sends\s+`local: null`/i,
  /No import\/persist\/work item\/mapping\/proof\/evidence\/session\/Codex/i,
  /ok_to_continue.*user\/Core review only/i,
  /Foreign refs remain foreign/i,
  /does not modify route behavior/i,
  /Browser verification/i,
]) {
  assert.match(docsSource, docsPattern, `docs must mention ${docsPattern}`);
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
        "panel parses JSON locally before posting",
        "empty Local B input is allowed as local null",
        "panel posts only to /api/ag-work-resume/target-preview",
        "panel displays route status, preflight, preview, foreign refs, and authority boundary",
        "panel action labels do not expose forbidden authority controls",
        "docs capture read-only boundary and browser verification expectation",
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
