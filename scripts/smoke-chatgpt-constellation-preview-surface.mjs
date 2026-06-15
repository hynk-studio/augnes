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
assert.match(toolBlock, /annotations:\s*localRouteReadAnnotations/, "new Project Constellation tool must use local route read annotations");
assert.doesNotMatch(toolBlock, /annotations:\s*bridgeWriteAnnotations/, "new Project Constellation tool must not be write annotated");
const localRouteReadAnnotations = extractConstBlockByMarker(server, "const localRouteReadAnnotations");
assert.match(localRouteReadAnnotations, /readOnlyHint:\s*true/, "local route read annotations must be read-only");
assert.match(localRouteReadAnnotations, /destructiveHint:\s*false/, "local route read annotations must be non-destructive");
assert.match(localRouteReadAnnotations, /idempotentHint:\s*true/, "local route read annotations must mark repeated reads idempotent");
assert.match(localRouteReadAnnotations, /openWorldHint:\s*false/, "local route read annotations must avoid an open-world false affordance");
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
assert.match(
  types,
  /selected_candidate_id:\s*z\.string\(\)\.min\(1\)\.optional\(\)/,
  "tool input schema must accept optional selected_candidate_id",
);
assert.match(types, /ConstellationPreviewResultSchema/, "constellation preview route response schema must be defined");
assert.match(mockAdapter, /getConstellationPreview\(scope: StateRuntimeScope\)/, "mock bridge adapter must implement the new read method");
assert.match(toolBlock, /selected_candidate_id/, "tool handler must accept selected_candidate_id");
assert.match(toolBlock, /requested_candidate_id/, "structuredContent must expose requested_candidate_id");
assert.match(toolBlock, /selected_candidate_id/, "structuredContent must expose selected_candidate_id");
assert.match(toolBlock, /selected_candidate_label/, "structuredContent must expose selected_candidate_label");
assert.match(toolBlock, /selection_status/, "structuredContent must expose selection_status");
assert.match(toolBlock, /selection_fallback_reason/, "structuredContent must expose selection fallback metadata");
assert.match(server, /type ProjectConstellationSelectionStatus = "selected" \| "defaulted" \| "requested_not_found" \| "unavailable"/, "server must define bounded selection statuses");
assert.match(server, /function resolveProjectConstellationHandoffSelection/, "server must resolve selected/default/fallback candidate state");
assert.match(server, /selection_status:\s*"defaulted"/, "server must preserve default first-candidate selection behavior");
assert.match(server, /selection_status:\s*"selected"/, "server must support a matching requested candidate");
assert.match(server, /selection_status:\s*"requested_not_found"/, "server must expose requested-not-found fallback state");
assert.match(server, /Requested candidate/, "handoff seed must represent requested candidate selection");
assert.match(server, /Selected candidate/, "handoff seed must represent selected candidate selection");
assert.match(server, /Requested candidate \$\{requestedCandidateId\} was not returned; using default candidate/, "server fallback must name the missing requested candidate and default candidate");

assert.match(widget, /renderProjectConstellationPreview/, "widget must implement Project Constellation preview rendering");
assert.match(widget, /normalizeProjectConstellationPreview/, "widget must normalize Project Constellation preview data");
assert.match(widget, /renderCopyableConstellationHandoff/, "widget must implement bounded local handoff copy rendering");
assert.match(widget, /Use for handoff/, "widget must expose local Use for handoff controls");
assert.match(widget, /aria-pressed/, "widget must expose pressed state for selected handoff candidate controls");
assert.match(widget, /selected-item/, "widget must visually mark the selected/default candidate");
assert.match(widget, /buildConstellationHandoffSeedForCandidate/, "widget must rebuild the visible seed when a candidate is selected");
assert.match(widget, /Copy Handoff Preview/, "widget must expose a local copy affordance for preview text");
assert.match(widget, /function copyTextToClipboard/, "widget must centralize local clipboard copy behavior");
assert.match(widget, /document\.execCommand\?\.\("copy"\)/, "widget must provide a local execCommand copy fallback for Developer Mode hosts");
assert.match(widget, /function selectElementText/, "widget must select visible handoff text when the host blocks clipboard writes");
assert.match(widget, /Preview text selected; press Command\+C to copy/, "widget must label host-blocked clipboard fallback precisely");
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
  extractBlockByMarker(server, "function resolveProjectConstellationHandoffSelection"),
  extractBlockByMarker(server, "function buildProjectConstellationPreviewSurface"),
  extractBlockByMarker(server, "function buildProjectConstellationHandoffSeed"),
  extractBlockByMarker(server, "function describeProjectConstellationPreviewSurface"),
  extractBlockByMarker(adapter, "async getConstellationPreview"),
  extractBlockByMarker(widget, "function normalizeProjectConstellationPreview"),
  extractBlockByMarker(widget, "function buildConstellationHandoffSeedForCandidate"),
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
  "Deploy",
  "Post externally",
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
await assertConstellationCopyAffordance(renderedFallback, "clipboard");
const renderedExecFallback = renderFallbackProjectConstellationPreview({ clipboardWriteThrows: true });
await assertConstellationCopyAffordance(renderedExecFallback, "execCommand");
const renderedSelectionFallback = renderFallbackProjectConstellationPreview({
  clipboardWriteThrows: true,
  execCommandReturnsFalse: true,
});
await assertConstellationCopyAffordance(renderedSelectionFallback, "selection");
const renderedSelectable = renderSelectableProjectConstellationPreview();
assertSelectableNextActionHandoff(renderedSelectable);
await assertConstellationCopyAffordance(renderedSelectable, "clipboard", /candidate:operator-review/);

console.log(
  JSON.stringify(
    {
      smoke: "chatgpt-constellation-preview-surface",
      package_script_present: true,
      tool_present: true,
      tool_read_only_annotated: true,
      tool_not_write_annotated: true,
      structured_content_field_families_present: true,
      selected_candidate_id_input_present: true,
      selection_metadata_present: true,
      default_selection_checked: true,
      requested_candidate_selection_checked: true,
      requested_not_found_fallback_checked: true,
      local_route_reuse_present: true,
      local_read_marker_present: true,
      widget_panel_present: true,
      selectable_next_action_controls_present: true,
      selected_candidate_visual_state_checked: true,
      selected_candidate_seed_refresh_checked: true,
      copy_uses_selected_candidate_seed_text_checked: true,
      copyable_handoff_seed_present: true,
      work_contract_write_tools_unchanged: true,
      forbidden_execution_write_control_labels_absent: true,
      github_openai_provider_calls_absent: true,
      fallback_render_checked: true,
      clipboard_exec_fallback_checked: true,
      clipboard_blocked_visible_selection_checked: true,
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

function extractConstBlockByMarker(source, marker) {
  const start = source.indexOf(marker);
  assert.notEqual(start, -1, `${marker} must exist`);
  const end = source.indexOf("} as const;", start);
  assert.notEqual(end, -1, `${marker} const block must terminate`);
  return source.slice(start, end + "} as const;".length);
}

function renderFallbackProjectConstellationPreview(options = {}) {
  return renderProjectConstellationPreviewPayload(
    {
      project_constellation_preview: {
        fallback_text: "No Project Constellation route payload was returned. This fallback does not invent missing context.",
        missing_data_fallbacks: ["No Project Constellation route payload was returned."],
      },
    },
    options,
  );
}

function renderSelectableProjectConstellationPreview(options = {}) {
  return renderProjectConstellationPreviewPayload(
    {
      project_constellation_preview: {
        title: "Project Constellation Preview",
        scope: "project:augnes",
        status: "available",
        requested_candidate_id: null,
        selected_candidate_id: "candidate:default",
        selected_candidate_label: "Default advisory candidate",
        selection_status: "defaulted",
        selection_fallback_reason: null,
        selection: {
          requested_candidate_id: null,
          selected_candidate_id: "candidate:default",
          selected_candidate_label: "Default advisory candidate",
          selection_status: "defaulted",
          selection_fallback_reason: null,
        },
        project_constellation: {
          constellation_id: "project_constellation.sample",
          boundary_class: "read_only_local_static_preview",
          thesis: "Selectable handoff seed test thesis.",
          nodes: [
            {
              id: "node:one",
              type: "decision",
              label: "First node",
              summary: "First bounded node summary.",
              evidence_pointers: [{ pointer_id: "evidence:one" }],
            },
          ],
          edges: [
            {
              id: "edge:one",
              source: "node:one",
              target: "node:two",
              summary: "First bounded edge summary.",
            },
          ],
          clusters: [
            {
              id: "cluster:one",
              label: "Primary cluster",
              cluster_thesis: "Primary bounded cluster summary.",
            },
          ],
        },
        evidence_pointers: [
          {
            pointer_id: "evidence:one",
            label: "Pointer one",
            target_ref: "fixtures/project-constellation.sample.json",
            bounded_summary: "Pointer-only evidence summary.",
          },
        ],
        unresolved_tensions: [
          {
            tension_id: "tension:one",
            label: "Tension one",
            summary: "Unresolved tension summary.",
          },
        ],
        next_action_candidates: [
          {
            candidate_id: "candidate:default",
            label: "Default advisory candidate",
            summary: "Default candidate summary.",
          },
          {
            candidate_id: "candidate:operator-review",
            label: "Operator review candidate",
            summary: "Operator review candidate summary.",
          },
        ],
        copyable_handoff_seed: {
          status: "available",
          requested_candidate_id: null,
          selected_candidate_id: "candidate:default",
          selected_candidate_label: "Default advisory candidate",
          selection_status: "defaulted",
          selection_fallback_reason: null,
          preview_text:
            "Augnes Project Constellation handoff seed\nSelected/default advisory next action\n- candidate:default: Default candidate summary.",
          source_refs: ["fixtures/project-constellation.sample.json"],
          required_checks: ["npm run typecheck"],
          skipped_check_policy: "Report every skipped check with a concrete reason.",
          final_report_requirements: ["Changed files", "Verification results"],
          boundary_text: [
            "This preview is read-only.",
            "This preview cannot execute Codex.",
            "A copied handoff seed is manual preview text only.",
          ],
        },
        source_refs: [{ source_ref: "fixtures/project-constellation.sample.json" }],
        missing_data_fallbacks: [],
      },
    },
    options,
  );
}

function renderProjectConstellationPreviewPayload(payload, options = {}) {
  const renderSource = [
    extractBlockByMarker(widget, "function el"),
    extractBlockByMarker(widget, "function tag"),
    extractBlockByMarker(widget, "function createMetricGrid"),
    extractBlockByMarker(widget, "function createSection"),
    extractBlockByMarker(widget, "function createList"),
    extractBlockByMarker(widget, "function createTextList"),
    extractBlockByMarker(widget, "function createPreBlock"),
    extractBlockByMarker(widget, "async function copyTextToClipboard"),
    extractBlockByMarker(widget, "function selectElementText"),
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
    extractBlockByMarker(widget, "function listForConstellationHandoff"),
    extractBlockByMarker(widget, "function summarizeConstellationEvidencePointer"),
    extractBlockByMarker(widget, "function summarizeConstellationTension"),
    extractBlockByMarker(widget, "function summarizeConstellationNextAction"),
    extractBlockByMarker(widget, "function sourceRefLabel"),
    extractBlockByMarker(widget, "function buildConstellationHandoffSeedText"),
    extractBlockByMarker(widget, "function buildConstellationHandoffSeedForCandidate"),
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
      this.value = "";
      this.style = {};
      this.attributes = {};
      this.listeners = {};
      this.focused = false;
      this.selected = false;
      this.selectionRange = undefined;
    }

    append(...children) {
      for (const child of children) this.appendChild(child);
    }

    appendChild(child) {
      this.children.push(child);
      return child;
    }

    replaceChildren(...children) {
      this.children = [];
      this.append(...children);
    }

    setAttribute(name, value) {
      this.attributes[name] = String(value);
    }

    addEventListener(name, handler) {
      this.listeners[name] ??= [];
      this.listeners[name].push(handler);
    }

    focus() {
      this.focused = true;
    }

    select() {
      this.selected = true;
    }

    setSelectionRange(start, end) {
      this.selectionRange = [start, end];
    }

    remove() {
      this.removed = true;
    }
  }

  const body = new FakeNode("body");
  const context = {
    document: {
      body,
      createElement(tag) {
        return new FakeNode(tag);
      },
      createRange() {
        return {
          selectNodeContents(node) {
            context.__selectedText = node?.textContent ?? "";
          },
        };
      },
      execCommand(command) {
        context.__execCommand = command;
        const lastChild = body.children[body.children.length - 1];
        context.__execCommandText = lastChild?.value ?? "";
        return options.execCommandReturnsFalse ? false : command === "copy";
      },
    },
    Number,
    Array,
    String,
    Error,
    Promise,
    navigator: {
      clipboard: {
        async writeText(text) {
          context.__clipboardWriteCount = (context.__clipboardWriteCount ?? 0) + 1;
          if (options.clipboardWriteThrows) throw new Error("blocked");
          context.__copiedText = text;
        },
      },
    },
    window: {
      getSelection() {
        return {
          removeAllRanges() {
            context.__selectionCleared = true;
          },
          addRange() {
            context.__rangeAdded = true;
          },
        };
      },
    },
  };
  vm.createContext(context);
  context.__payload = payload;
  vm.runInContext(renderSource, context);
  const output = vm.runInContext("renderProjectConstellationPreview(__payload)", context);

  return {
    context,
    tree: output,
    text: collectText(output).replace(/\s+/g, " ").trim(),
  };
}

function assertSelectableNextActionHandoff(renderedPreview) {
  const useButtons = collectNodes(renderedPreview.tree, (node) => node.tag === "button" && node.textContent === "Use for handoff");
  assert.equal(useButtons.length, 2, "widget must render Use for handoff controls for next action candidates");
  assert.equal(useButtons[0].attributes["aria-pressed"], "true", "default candidate control must start selected");
  assert.equal(useButtons[1].attributes["aria-pressed"], "false", "non-default candidate control must start unselected");
  assert.match(renderedPreview.text, /Default candidate summary/, "default handoff seed must be visible before selection");

  useButtons[1].listeners.click[0]();
  const updatedText = collectText(renderedPreview.tree).replace(/\s+/g, " ").trim();
  assert.equal(useButtons[0].attributes["aria-pressed"], "false", "previous default candidate must become unpressed after selection");
  assert.equal(useButtons[1].attributes["aria-pressed"], "true", "selected non-default candidate must expose aria-pressed");
  const selectedCards = collectNodes(renderedPreview.tree, (node) => typeof node.className === "string" && node.className.includes("selected-item"));
  assert.equal(selectedCards.length, 1, "exactly one advisory next action card must be visually selected");
  assert.match(updatedText, /candidate:operator-review/, "updated visible handoff seed must reference the selected candidate id");
  assert.match(updatedText, /Operator review candidate summary/, "updated visible handoff seed must reference the selected candidate summary");
}

async function assertConstellationCopyAffordance(renderedFallback, expectedPath, expectedTextPattern = /Augnes Project Constellation handoff seed/) {
  const buttons = collectNodes(renderedFallback.tree, (node) => node.tag === "button" && node.textContent === "Copy Handoff Preview");
  assert.equal(buttons.length, 1, "fallback render must include exactly one Project Constellation copy button");
  const statusNodes = collectNodes(
    renderedFallback.tree,
    (node) => node.attributes?.["aria-live"] === "polite" && node.textContent.includes("Copy action only."),
  );
  assert.equal(statusNodes.length, 1, "Project Constellation copy affordance must expose one aria-live local status node");
  const preBlocks = collectNodes(renderedFallback.tree, (node) => node.tag === "pre");
  assert.ok(preBlocks.some((node) => node.textContent.includes("Augnes Project Constellation handoff seed")), "handoff seed text must remain visible");

  await buttons[0].listeners.click[0]();
  const copiedText = expectedPath === "execCommand"
    ? renderedFallback.context.__execCommandText
    : expectedPath === "selection"
      ? renderedFallback.context.__selectedText
      : renderedFallback.context.__copiedText;
  assert.match(copiedText, /Augnes Project Constellation handoff seed/, "copy affordance must target the handoff seed text");
  assert.match(copiedText, expectedTextPattern, "copy affordance must target the currently visible handoff seed text");
  if (expectedPath === "selection") {
    assert.equal(
      statusNodes[0].textContent,
      "Clipboard blocked by this host. Preview text selected; press Command+C to copy.",
      "host-blocked clipboard fallback must select visible text and label manual copy",
    );
    assert.equal(renderedFallback.context.__selectionCleared, true, "selection fallback must clear previous selection");
    assert.equal(renderedFallback.context.__rangeAdded, true, "selection fallback must select the visible seed text");
  } else {
    assert.equal(statusNodes[0].textContent, "Handoff preview copied.", "copy success must update local status only");
  }
  if (expectedPath === "execCommand") {
    assert.equal(renderedFallback.context.__execCommand, "copy", "copy fallback must use document.execCommand copy");
  } else {
    assert.equal(renderedFallback.context.__clipboardWriteCount, 1, "copy button must try navigator.clipboard once");
  }
}

function collectNodes(node, predicate) {
  if (!node || typeof node !== "object") return [];
  const own = predicate(node) ? [node] : [];
  const childNodes = Array.isArray(node.children) ? node.children.flatMap((child) => collectNodes(child, predicate)) : [];
  return own.concat(childNodes);
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
