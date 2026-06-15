import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import vm from "node:vm";

const packagePath = "package.json";
const serverPath = "apps/augnes_apps/src/server.ts";
const widgetPath = "apps/augnes_apps/public/console-widget.html";
const adapterPath = "apps/augnes_apps/src/adapters/state-runtime-http.ts";
const typesPath = "apps/augnes_apps/src/lib/state-runtime-types.ts";
const mockAdapterPath = "apps/augnes_apps/scripts/mock-state-runtime.ts";
const runbookPath = "apps/augnes_apps/docs/12_WORK_CONTRACT_CARD_RUNBOOK.md";

for (const filePath of [
  packagePath,
  serverPath,
  widgetPath,
  adapterPath,
  typesPath,
  mockAdapterPath,
  runbookPath,
]) {
  assert.ok(existsSync(filePath), `${filePath} must exist`);
}

const packageJson = JSON.parse(readFileSync(packagePath, "utf8"));
const server = readFileSync(serverPath, "utf8");
const widget = readFileSync(widgetPath, "utf8");
const adapter = readFileSync(adapterPath, "utf8");
const types = readFileSync(typesPath, "utf8");
const mockAdapter = readFileSync(mockAdapterPath, "utf8");
const runbook = readFileSync(runbookPath, "utf8");

assert.equal(
  packageJson.scripts?.["smoke:chatgpt-constellation-preview-surface"],
  "node scripts/smoke-chatgpt-constellation-preview-surface.mjs",
  "package.json must expose smoke:chatgpt-constellation-preview-surface",
);

const toolBlock = extractToolBlock(server, "augnes_get_project_constellation_preview");
assert.match(server, /"augnes_get_project_constellation_preview"/, "new Project Constellation tool must exist");
assert.match(toolBlock, /annotations:\s*bridgeReadAnnotations/, "new Project Constellation tool must be read-only annotated");
assert.doesNotMatch(toolBlock, /annotations:\s*bridgeWriteAnnotations/, "new Project Constellation tool must not be write annotated");
assert.match(toolBlock, /_meta:\s*widgetToolMeta/, "new Project Constellation tool must be widget-backed");
assert.match(toolBlock, /stateRuntimeAdapter\.getConstellationPreview\(resolvedScope\)/, "tool must reuse the state runtime read adapter");

for (const expected of [
  "project_constellation_preview",
  "project_constellation",
  "evidence_pointers",
  "unresolved_tensions",
  "next_action_candidates",
  "copyable_handoff_seed",
  "missing_data_fallbacks",
]) {
  assert.match(toolBlock, new RegExp(escapeRegExp(expected)), `structuredContent must include ${expected}`);
}

assert.match(server, /PROJECT_CONSTELLATION_HANDOFF_BOUNDARY_TEXT/, "server must define explicit Project Constellation preview boundaries");
assert.match(server, /PROJECT_CONSTELLATION_REQUIRED_CHECKS/, "server must define handoff seed validation guidance");
assert.match(server, /No missing context was invented\./, "fallback content must say missing context was not invented");
assert.match(server, /Fallback text is explicit; no missing Project Constellation context was invented\./, "structured fallback must be explicit");

assert.match(adapter, /getConstellationPreview\(scope: StateRuntimeScope\)/, "HTTP adapter must expose getConstellationPreview");
assert.match(adapter, /\/api\/augnes\/read\/constellation-preview/, "adapter must read the existing constellation preview route");
assert.match(adapter, /x-augnes-local-readonly/, "adapter must send the local read-only marker header");
assert.match(adapter, /constellation-preview-v0\.1/, "adapter must send the local read-only marker value");
assert.match(types, /ProjectConstellationPreviewToolInputSchema/, "tool input schema must be defined");
assert.match(types, /ConstellationPreviewResultSchema/, "constellation preview route response schema must be defined");
assert.match(mockAdapter, /getConstellationPreview\(scope: StateRuntimeScope\)/, "mock bridge adapter must implement the new read method");

assert.match(widget, /renderProjectConstellationPreview/, "widget must implement Project Constellation preview rendering");
assert.match(widget, /normalizeProjectConstellationPreview/, "widget must normalize Project Constellation preview data");
assert.match(widget, /renderCopyableConstellationHandoff/, "widget must implement bounded local handoff copy rendering");
assert.match(widget, /Copy Handoff Preview/, "widget must expose a local copy affordance for preview text");
assert.match(widget, /does not invent missing context/, "widget fallback must avoid invented context");
assert.match(runbook, /Project Constellation Preview Card/, "runbook must document the new Project Constellation preview card");
assert.match(runbook, /augnes_get_project_constellation_preview/, "runbook must name the callable read-only tool");

const writeTools = collectToolsWithAnnotation(server, "bridgeWriteAnnotations");
assert.deepEqual(
  writeTools,
  [
    "augnes_observe",
    "augnes_record_action_result",
    "augnes_record_work_event",
    "augnes_generate_codex_handoff_draft",
    "augnes_review_codex_result_draft",
  ],
  "existing Work Contract Card write-tool boundaries must not be broadened",
);
assert.ok(!writeTools.includes("augnes_get_project_constellation_preview"), "new Project Constellation preview tool must not be a write tool");

const newSurfaceSource = [
  toolBlock,
  extractBlockByMarker(server, "function buildProjectConstellationPreviewSurface"),
  extractBlockByMarker(server, "function buildProjectConstellationHandoffSeed"),
  extractBlockByMarker(server, "function describeProjectConstellationPreviewSurface"),
  extractBlockByMarker(adapter, "async getConstellationPreview"),
  extractBlockByMarker(widget, "function normalizeProjectConstellationPreview"),
  extractBlockByMarker(widget, "function renderCopyableConstellationHandoff"),
  extractBlockByMarker(widget, "function renderProjectConstellationPreview"),
].join("\n\n");

for (const forbidden of [
  "Run Codex",
  "Start Codex",
  "Launch Codex",
  "Send to Codex",
  "Commit state",
  "Record proof",
  "Record evidence",
  "Approve publication",
  "Publish now",
  "Merge PR",
  "Enable auto-merge",
  "Retry",
  "Replay",
]) {
  assert.doesNotMatch(newSurfaceSource, new RegExp(escapeRegExp(forbidden), "g"), `new surface must not expose forbidden label: ${forbidden}`);
}

for (const forbiddenPattern of [
  /\bapi\.github\.com\b/,
  /\bapi\.openai\.com\b/,
  /\bopenai\b.{0,20}\(/i,
  /\bgithub\b.{0,20}\(/i,
  /\/api\/(?:actions|evidence|observe|plan|work|handoffs|publications|delivery)\b/,
  /\brecord-proof\b/,
  /\brecord-evidence\b/,
]) {
  assert.doesNotMatch(newSurfaceSource, forbiddenPattern, `new surface must not add forbidden execution/write/provider calls: ${forbiddenPattern}`);
}

const renderedFallback = renderFallbackProjectConstellationPreview();
assert.match(
  renderedFallback.text,
  /No Project Constellation route payload was returned/,
  "fallback render must show explicit missing route payload text",
);
assert.match(
  renderedFallback.text,
  /does not invent missing context/,
  "fallback render must state that missing context is not invented",
);
assert.match(
  renderedFallback.text,
  /Copy Handoff Preview/,
  "fallback render must keep preview text copyable",
);

console.log(
  JSON.stringify(
    {
      smoke: "chatgpt-constellation-preview-surface",
      package_script_present: true,
      tool_present: true,
      tool_read_only_annotated: true,
      tool_not_write_annotated: true,
      structured_content_field_families_present: true,
      local_route_reuse_present: true,
      local_read_marker_present: true,
      widget_panel_present: true,
      copyable_handoff_seed_present: true,
      work_contract_write_tools_unchanged: true,
      forbidden_execution_write_control_labels_absent: true,
      github_openai_provider_calls_absent: true,
      fallback_render_checked: true,
    },
    null,
    2,
  ),
);
console.log("PASS smoke:chatgpt-constellation-preview-surface");

function extractToolBlock(source, toolName) {
  const registrationPattern = new RegExp(`registerAppTool\\(\\s*server,\\s*"${escapeRegExp(toolName)}"`);
  const registration = registrationPattern.exec(source);
  assert.ok(registration, `${toolName} tool registration must exist`);
  const start = registration.index;
  const nextMatch = [...source.slice(start + "registerAppTool(".length).matchAll(/registerAppTool\(/g)][0];
  const next = nextMatch ? start + "registerAppTool(".length + nextMatch.index : source.length;
  return source.slice(start, next);
}

function collectToolsWithAnnotation(source, annotationName) {
  const matches = [...source.matchAll(/registerAppTool\(\s*server,\s*"([^"]+)"/g)];
  return matches
    .map((match, index) => {
      const next = matches[index + 1]?.index ?? source.length;
      return {
        name: match[1],
        block: source.slice(match.index, next),
      };
    })
    .filter(({ block }) => block.includes(`annotations: ${annotationName}`))
    .map(({ name }) => name);
}

function extractBlockByMarker(source, marker) {
  const start = source.indexOf(marker);
  assert.notEqual(start, -1, `${marker} must exist`);
  const openParen = source.indexOf("(", start);
  assert.notEqual(openParen, -1, `${marker} must have a parameter list`);
  let parenDepth = 0;
  let closeParen = -1;
  for (let index = openParen; index < source.length; index += 1) {
    const char = source[index];
    if (char === "(") parenDepth += 1;
    if (char === ")") {
      parenDepth -= 1;
      if (parenDepth === 0) {
        closeParen = index;
        break;
      }
    }
  }
  assert.notEqual(closeParen, -1, `${marker} parameter list must terminate`);
  const openBrace = source.indexOf("{", closeParen);
  assert.notEqual(openBrace, -1, `${marker} must have a body`);
  let depth = 0;
  for (let index = openBrace; index < source.length; index += 1) {
    const char = source[index];
    if (char === "{") depth += 1;
    if (char === "}") {
      depth -= 1;
      if (depth === 0) return source.slice(start, index + 1);
    }
  }
  throw new Error(`${marker} body did not terminate`);
}

function renderFallbackProjectConstellationPreview() {
  const renderSource = [
    extractBlockByMarker(widget, "function el"),
    extractBlockByMarker(widget, "function tag"),
    extractBlockByMarker(widget, "function createMetricGrid"),
    extractBlockByMarker(widget, "function createSection"),
    extractBlockByMarker(widget, "function createList"),
    extractBlockByMarker(widget, "function createTextList"),
    extractBlockByMarker(widget, "function createPreBlock"),
    extractBlockByMarker(widget, "function nonEmptyText"),
    extractBlockByMarker(widget, "function safeArray"),
    extractBlockByMarker(widget, "function safeCount"),
    extractBlockByMarker(widget, "function safeObject"),
    extractBlockByMarker(widget, "function safeObjectArray"),
    extractBlockByMarker(widget, "function normalizeProjectConstellationPreview"),
    extractBlockByMarker(widget, "function createConstellationNodeCard"),
    extractBlockByMarker(widget, "function createConstellationEdgeCard"),
    extractBlockByMarker(widget, "function createConstellationClusterCard"),
    extractBlockByMarker(widget, "function createConstellationEvidenceCard"),
    extractBlockByMarker(widget, "function createConstellationTensionCard"),
    extractBlockByMarker(widget, "function createConstellationNextActionCard"),
    extractBlockByMarker(widget, "function renderCopyableConstellationHandoff"),
    extractBlockByMarker(widget, "function renderProjectConstellationPreview"),
  ].join("\n\n");

  class FakeNode {
    constructor(tag) {
      this.tag = tag;
      this.children = [];
      this.textContent = "";
      this.className = "";
      this.innerHTML = "";
      this.open = false;
      this.type = "";
      this.attributes = {};
      this.listeners = {};
    }

    append(...children) {
      for (const child of children) this.appendChild(child);
    }

    appendChild(child) {
      this.children.push(child);
      return child;
    }

    setAttribute(name, value) {
      this.attributes[name] = String(value);
    }

    addEventListener(name, handler) {
      this.listeners[name] ??= [];
      this.listeners[name].push(handler);
    }
  }

  const context = {
    document: {
      createElement(tag) {
        return new FakeNode(tag);
      },
    },
    Number,
    Array,
    String,
    Error,
    Promise,
    navigator: {
      clipboard: {
        async writeText() {},
      },
    },
  };
  vm.createContext(context);
  vm.runInContext(renderSource, context);
  const output = vm.runInContext(
    `renderProjectConstellationPreview({
      project_constellation_preview: {
        fallback_text: "No Project Constellation route payload was returned. This fallback does not invent missing context.",
        missing_data_fallbacks: ["No Project Constellation route payload was returned."]
      }
    })`,
    context,
  );

  return {
    tree: output,
    text: collectText(output).replace(/\s+/g, " ").trim(),
  };
}

function collectText(node) {
  if (!node || typeof node !== "object") return "";
  const ownText = [node.textContent, node.innerHTML].filter(Boolean).join(" ");
  const childText = Array.isArray(node.children) ? node.children.map(collectText).join(" ") : "";
  return `${ownText} ${childText}`;
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
