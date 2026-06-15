import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import vm from "node:vm";

const serverPath = "apps/augnes_apps/src/server.ts";
const widgetPath = "apps/augnes_apps/public/console-widget.html";
const runbookPath = "apps/augnes_apps/docs/12_WORK_CONTRACT_CARD_RUNBOOK.md";
const packagePath = "package.json";

for (const filePath of [serverPath, widgetPath, runbookPath, packagePath]) {
  assert.ok(existsSync(filePath), `${filePath} must exist`);
}

const server = readFileSync(serverPath, "utf8");
const widget = readFileSync(widgetPath, "utf8");
const runbook = readFileSync(runbookPath, "utf8");
const packageJson = JSON.parse(readFileSync(packagePath, "utf8"));

assert.equal(
  packageJson.scripts?.["smoke:chatgpt-work-contract-card"],
  "node scripts/smoke-chatgpt-work-contract-card.mjs",
  "package.json must expose the Work Contract Card smoke script",
);

for (const text of [server, widget, runbook]) {
  assertBoundaryText(text);
}

assert.match(server, /work_contract_card/, "server must return Work Contract Card structured content");
assert.match(server, /codex_handoff_preview/, "server must return Codex Handoff Preview structured content");
assert.match(server, /work_contract_constellation_context/, "server must support optional Work Contract / Constellation context");
assert.match(server, /No Project Constellation context is attached to this work contract\./, "server must keep missing Constellation context explicit");
assert.match(widget, /renderWorkContractCard/, "widget must implement Work Contract Card rendering");
assert.match(widget, /renderCodexHandoffPreview/, "widget must implement Codex Handoff Preview rendering");
assert.match(widget, /renderWorkContractConstellationContext/, "widget must render Work Contract / Constellation context");
assert.match(widget, /renderCopyableHandoffPacket/, "widget must implement a bounded copy affordance renderer");
assert.match(server, /BEGIN_AUGNES_CODEX_HANDOFF_JSON/, "server packet must include JSON block begin delimiter");
assert.match(server, /END_AUGNES_CODEX_HANDOFF_JSON/, "server packet must include JSON block end delimiter");
assert.match(widget, /BEGIN_AUGNES_CODEX_HANDOFF_JSON/, "widget fallback packet must include JSON block begin delimiter");
assert.match(widget, /END_AUGNES_CODEX_HANDOFF_JSON/, "widget fallback packet must include JSON block end delimiter");
assert.match(widget, /After copying, validate locally with codex:handoff-preflight\./, "widget must include local preflight hint text");
assert.match(runbook, /Data Source/i, "runbook must explain the data source");
assert.match(runbook, /Missing Data Behavior/i, "runbook must explain missing data behavior");
assert.match(runbook, /Codex Handoff Preview/i, "runbook must explain the Codex Handoff Preview");

const uiText = `${server}\n${widget}`;
const forbiddenUiPhrases = [
  "Run Codex",
  "Start Codex",
  "Execute Codex",
  "Launch Codex",
  "Send to Codex",
  "Merge PR",
  "Enable auto-merge",
  "Approve publication",
  "Publish now",
  "Commit state",
  "Record proof",
  "Record evidence",
  "Retry",
  "Replay",
  "Deploy",
  "Post externally",
];
const allowedCopyLabels = ["Copy Codex Handoff", "Copy Handoff Preview"];
for (const phrase of forbiddenUiPhrases) {
  assert.doesNotMatch(uiText, new RegExp(escapeRegExp(phrase), "g"), `UI text must not include ${phrase}`);
}

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
  "existing bridge write tools must not be broadened or extended for the card",
);
assert.ok(!writeTools.some((name) => /work_contract|contract_card/i.test(name)), "card must not add a bridge write tool");

const workBriefBlock = extractToolBlock(server, "augnes_get_work_brief");
assert.match(workBriefBlock, /annotations:\s*bridgeReadAnnotations/, "augnes_get_work_brief must remain read-only annotated");
assert.match(workBriefBlock, /_meta:\s*widgetToolMeta/, "augnes_get_work_brief must be widget-backed for the card");
assert.match(workBriefBlock, /work_contract_card/, "augnes_get_work_brief must carry card structured content");
assert.match(workBriefBlock, /codex_handoff_preview/, "augnes_get_work_brief must carry handoff preview structured content");

if (server.includes('"augnes_get_work_contract_card"')) {
  const cardToolBlock = extractToolBlock(server, "augnes_get_work_contract_card");
  assert.match(cardToolBlock, /annotations:\s*bridgeReadAnnotations|annotations:\s*readOnlyAnnotations/, "new card tool must be read-only annotated");
  assert.doesNotMatch(cardToolBlock, /annotations:\s*bridgeWriteAnnotations/, "new card tool must not be write annotated");
}

assertNoNetworkCalls(extractFunction(server, "buildWorkContractCard"), "buildWorkContractCard");
assertNoNetworkCalls(extractFunction(server, "buildCodexHandoffPreview"), "buildCodexHandoffPreview");
assertNoNetworkCalls(extractFunction(server, "buildCopyableHandoffText"), "buildCopyableHandoffText");
assertNoNetworkCalls(extractFunction(server, "buildWorkContractConstellationContext"), "buildWorkContractConstellationContext");
assertNoNetworkCalls(extractFunction(server, "buildWorkContractConstellationContextFromBrief"), "buildWorkContractConstellationContextFromBrief");
assertNoNetworkCalls(extractFunction(server, "describeWorkContractCard"), "describeWorkContractCard");
assertNoNetworkCalls(extractFunction(server, "describeCodexHandoffPreview"), "describeCodexHandoffPreview");
assertNoNetworkCalls(extractFunction(widget, "renderWorkContractCard"), "renderWorkContractCard");
assertNoNetworkCalls(extractFunction(widget, "renderCodexHandoffPreview"), "renderCodexHandoffPreview");
assertNoNetworkCalls(extractFunction(widget, "renderWorkContractConstellationContext"), "renderWorkContractConstellationContext");
assertNoNetworkCalls(extractFunction(widget, "renderCopyableHandoffPacket"), "renderCopyableHandoffPacket");
assertNoNetworkCalls(extractFunction(widget, "normalizeWorkContractCard"), "normalizeWorkContractCard");
assertNoNetworkCalls(extractFunction(widget, "normalizeCodexHandoffPreview"), "normalizeCodexHandoffPreview");
assertNoNetworkCalls(extractFunction(widget, "normalizeWorkContractConstellationContext"), "normalizeWorkContractConstellationContext");
assertNoNetworkCalls(widget, "console-widget");

const renderSource = [
  extractFunction(widget, "el"),
  extractFunction(widget, "codeChip"),
  extractFunction(widget, "tag"),
  extractFunction(widget, "createMetricGrid"),
  extractFunction(widget, "createSection"),
  extractFunction(widget, "createTextList"),
  extractFunction(widget, "createCodeList"),
  extractFunction(widget, "createPreBlock"),
  extractFunction(widget, "copyTextToClipboard"),
  extractFunction(widget, "selectElementText"),
  extractFunction(widget, "renderCopyableHandoffPacket"),
  extractFunction(widget, "nonEmptyText"),
  extractFunction(widget, "safeArray"),
  extractFunction(widget, "safeCount"),
  extractFunction(widget, "createCodeListWithFallback"),
  extractFunction(widget, "safeRecord"),
  extractFunction(widget, "safeRecordArray"),
  extractFunction(widget, "firstRecord"),
  extractFunction(widget, "sourceRefText"),
  extractFunction(widget, "summarizeContextEvidenceRef"),
  extractFunction(widget, "summarizeContextTension"),
  extractFunction(widget, "summarizeContextNextAction"),
  extractFunction(widget, "normalizeWorkContractConstellationContext"),
  extractFunction(widget, "constellationContextPacketLines"),
  extractFunction(widget, "normalizeWorkContractCard"),
  extractFunction(widget, "normalizeCodexHandoffPreview"),
  extractFunction(widget, "renderWorkContractConstellationContext"),
  extractFunction(widget, "renderCodexHandoffPreview"),
  extractFunction(widget, "renderWorkContractCard"),
].join("\n\n");

assertNoForbiddenControls(extractFunction(widget, "renderWorkContractCard"), "renderWorkContractCard");
assertNoForbiddenControls(extractFunction(widget, "renderCodexHandoffPreview"), "renderCodexHandoffPreview");
assertNoForbiddenControls(extractFunction(widget, "normalizeWorkContractCard"), "normalizeWorkContractCard");
assertNoForbiddenControls(extractFunction(widget, "normalizeCodexHandoffPreview"), "normalizeCodexHandoffPreview");
assertSafeCopyAffordanceSource(extractFunction(widget, "renderCopyableHandoffPacket"));
assertSafeCopyHelperSource(extractFunction(widget, "copyTextToClipboard"));

const renderedFallback = renderFallbackCard(renderSource);
const renderedFallbackText = renderedFallback.text;
for (const expectedFallback of [
  "No expected files are listed in the work brief.",
  "No expected checks are listed in the work brief.",
  "No related state keys are listed in the work brief.",
  "No proof/evidence expectation is listed in the work brief; proof and evidence remain separate from approval.",
  "Skipped checks must be reported with concrete reasons; no per-check skipped expectation is listed in the work brief.",
]) {
  assert.match(renderedFallbackText, new RegExp(escapeRegExp(expectedFallback)), `fallback render must include: ${expectedFallback}`);
}
assertBoundaryText(renderedFallbackText);
for (const expectedPreviewText of [
  "Codex Handoff Preview",
  "Readiness reasons",
  "Stop conditions",
  "Copyable handoff packet",
  "This is a preview/copy packet, not an execution action.",
  "Copy Codex Handoff",
  "After copying, validate locally with codex:handoff-preflight.",
  "BEGIN_AUGNES_CODEX_HANDOFF_JSON",
  "END_AUGNES_CODEX_HANDOFF_JSON",
  "Copy action only. The packet is for a separate Codex session; copying does not execute Codex, approve anything, record proof or evidence, mutate Augnes state, merge, or enable auto-merge.",
  "Project Constellation context",
  "No Project Constellation context is attached to this work contract.",
]) {
  assert.match(renderedFallbackText, new RegExp(escapeRegExp(expectedPreviewText)), `fallback preview must include: ${expectedPreviewText}`);
}
await assertRenderedCopyAffordance(renderedFallback, "clipboard", /No Project Constellation context is attached to this work contract\./);
const renderedExecFallback = renderFallbackCard(renderSource, { clipboardWriteThrows: true });
await assertRenderedCopyAffordance(renderedExecFallback, "execCommand");
const renderedSelectionFallback = renderFallbackCard(renderSource, {
  clipboardWriteThrows: true,
  execCommandReturnsFalse: true,
});
await assertRenderedCopyAffordance(renderedSelectionFallback, "selection");

const renderedWithConstellation = renderConstellationContextCard(renderSource);
for (const expectedContextText of [
  "Selectable handoff seed context thesis.",
  "candidate:operator-review",
  "Operator review candidate",
  "selected",
  "Pointer one",
  "Unresolved tension summary.",
  "Operator review candidate summary.",
  "fixtures/project-constellation.sample.json",
]) {
  assert.match(renderedWithConstellation.text, new RegExp(escapeRegExp(expectedContextText)), `constellation context render must include: ${expectedContextText}`);
}
await assertRenderedCopyAffordance(renderedWithConstellation, "clipboard", /candidate:operator-review/);

console.log(
  JSON.stringify(
    {
      smoke: "chatgpt-work-contract-card",
      code_present: true,
      docs_present: true,
      package_script_present: true,
      boundary_text_present: true,
      handoff_preview_present: true,
      handoff_preview_stop_conditions_present: true,
      handoff_preview_copyable_packet_present: true,
      work_contract_constellation_context_optional: true,
      work_contract_constellation_context_rendered: true,
      missing_constellation_context_fallback_checked: true,
      constellation_context_handoff_packet_checked: true,
      safe_copy_affordance_present: true,
      safe_copy_affordance_local_only: true,
      copy_exec_fallback_checked: true,
      copy_visible_selection_fallback_checked: true,
      handoff_json_block_present: true,
      handoff_json_block_parseable: true,
      handoff_preflight_hint_present: true,
      forbidden_ui_text_absent: true,
      bridge_write_tools_unchanged: true,
      work_brief_read_only_widget_card: true,
      fallback_render_without_throwing: true,
      direct_network_calls_absent: true,
      forbidden_controls_absent: true,
    },
    null,
    2,
  ),
);

function assertBoundaryText(text) {
  const requiredPatterns = [
    /Work ID is a trace anchor, not committed state authority\./,
    /This card is read-only\./,
    /This card cannot execute Codex\./,
    /This card cannot commit or reject Augnes state\./,
    /This card cannot approve, publish, retry, replay, externally post, merge, or enable auto-merge\./,
    /Proof is not approval\./,
    /A PR is not merge authority\./,
    /Durable approval remains user\/Core gated\./,
    /This preview is read-only\./,
    /This preview cannot execute Codex\./,
    /This preview cannot record evidence\./,
    /This preview cannot record proof\./,
    /This preview cannot commit or reject Augnes state\./,
    /This preview cannot approve, publish, retry, replay, or externally post\./,
    /This preview cannot merge or enable auto-merge\./,
    /Evidence is not approval\./,
    /Raw DB paths are local-dev fallback only and should not be normal user-facing input\./,
  ];

  for (const pattern of requiredPatterns) {
    assert.match(text, pattern, `boundary text must include ${pattern}`);
  }
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

function extractToolBlock(source, toolName) {
  const registrationPattern = new RegExp(`registerAppTool\\(\\s*server,\\s*"${escapeRegExp(toolName)}"`);
  const registration = registrationPattern.exec(source);
  assert.ok(registration, `${toolName} tool registration must exist`);
  const start = registration.index;
  const nextMatch = [...source.slice(start + "registerAppTool(".length).matchAll(/registerAppTool\(/g)][0];
  const next = nextMatch ? start + "registerAppTool(".length + nextMatch.index : source.length;
  return source.slice(start, next);
}

function extractFunction(source, name) {
  const asyncMarker = `async function ${name}`;
  const marker = `function ${name}`;
  const asyncStart = source.indexOf(asyncMarker);
  const start = asyncStart === -1 ? source.indexOf(marker) : asyncStart;
  assert.notEqual(start, -1, `${name} must exist`);
  const signatureEnd = source.indexOf(")", start);
  assert.notEqual(signatureEnd, -1, `${name} must have a parameter list`);
  const openBrace = source.indexOf("{", signatureEnd);
  assert.notEqual(openBrace, -1, `${name} must have a body`);
  let depth = 0;
  for (let index = openBrace; index < source.length; index += 1) {
    const char = source[index];
    if (char === "{") depth += 1;
    if (char === "}") {
      depth -= 1;
      if (depth === 0) return source.slice(start, index + 1);
    }
  }
  throw new Error(`${name} body did not terminate`);
}

function assertNoNetworkCalls(source, label) {
  const forbiddenPatterns = [
    /\bfetch\s*\(/,
    /\bXMLHttpRequest\b/,
    /\bWebSocket\b/,
    /\bEventSource\b/,
    /\bapi\.github\.com\b/,
    /\bapi\.openai\.com\b/,
    /\/api\/(?:actions|evidence|observe|plan|work|state|publication|delivery)\b/,
    /\brecord-proof\b/,
    /\brecord-evidence\b/,
    /\bopenai\b.{0,20}\(/i,
    /\bgithub\b.{0,20}\(/i,
  ];
  for (const pattern of forbiddenPatterns) {
    assert.doesNotMatch(source, pattern, `${label} must not contain direct network or provider calls: ${pattern}`);
  }
}

function assertSafeCopyAffordanceSource(source) {
  assert.match(source, /document\.createElement\("button"\)/, "copy affordance must use a normal button element");
  assert.match(source, /copyButton\.type\s*=\s*"button"/, "copy affordance button must not submit a form");
  assert.match(
    source,
    /copyButton\.textContent\s*=\s*"Copy Codex Handoff"|copyButton\.textContent\s*=\s*"Copy Handoff Preview"/,
    "copy affordance label must be allowed",
  );
  assert.match(source, /copyTextToClipboard\(packetText\)/, "copy affordance must use the shared layered copy helper");
  assert.match(source, /selectElementText\(pre\)/, "copy affordance must fall back to visible packet text selection");
  assert.match(source, /status\.textContent\s*=\s*"Handoff copied\."/ , "copy success status must be local UI text");
  assert.match(
    source,
    /status\.textContent\s*=\s*"Clipboard blocked by this host\. Packet text selected; press Command\+C to copy\."/,
    "copy blocked status must tell the user the visible packet text was selected",
  );
  assert.match(
    source,
    /status\.textContent\s*=\s*"Copy unavailable\. Select and copy the packet text manually\."/,
    "copy failure status must tell the user to manually copy the visible packet",
  );
  assert.doesNotMatch(source, /\bfetch\s*\(/, "copy affordance must not call fetch");
  assert.doesNotMatch(source, /\bXMLHttpRequest\b/, "copy affordance must not use XMLHttpRequest");
  assert.doesNotMatch(source, /\bWebSocket\b/, "copy affordance must not use WebSocket");
  assert.doesNotMatch(source, /\bEventSource\b/, "copy affordance must not use EventSource");
  assert.doesNotMatch(source, /\brpcRequest\b|\brpcNotify\b|\bpostMessage\b/, "copy affordance must not call bridge/runtime messaging");
  assert.doesNotMatch(source, /\bdispatchEvent\b|\bCustomEvent\b/, "copy affordance must not dispatch execution events");
  assert.doesNotMatch(source, /\bwindow\.open\b|\blocation\./, "copy affordance must not navigate");
  assert.doesNotMatch(source, /\bsubmit\s*\(/, "copy affordance must not submit forms");
}

function assertSafeCopyHelperSource(source) {
  assert.match(source, /navigator\.clipboard\?\.writeText/, "copy helper must try navigator.clipboard.writeText first");
  assert.match(source, /document\.execCommand\?\.\("copy"\)/, "copy helper must provide an execCommand copy fallback");
  assert.doesNotMatch(source, /\bfetch\s*\(/, "copy helper must not call fetch");
  assert.doesNotMatch(source, /\bXMLHttpRequest\b/, "copy helper must not use XMLHttpRequest");
  assert.doesNotMatch(source, /\bWebSocket\b/, "copy helper must not use WebSocket");
  assert.doesNotMatch(source, /\bEventSource\b/, "copy helper must not use EventSource");
  assert.doesNotMatch(source, /\brpcRequest\b|\brpcNotify\b|\bpostMessage\b/, "copy helper must not call bridge/runtime messaging");
}

function assertNoForbiddenControls(source, label) {
  const forbiddenPatterns = [
    /createElement\(["']button["']\)/,
    /createElement\(["']form["']\)/,
    /createElement\(["']input["']\)/,
    /createElement\(["']select["']\)/,
    /createElement\(["']textarea["']\)/,
    /<button\b/i,
    /<form\b/i,
    /\bonclick\b/i,
    /addEventListener\(["']click["']/,
    /\brpcRequest\b/,
    /\brpcNotify\b/,
    /\bpostMessage\b/,
  ];
  for (const pattern of forbiddenPatterns) {
    assert.doesNotMatch(source, pattern, `${label} must not add execution or approval controls: ${pattern}`);
  }
}

function fallbackCardPayload() {
  return {
    work_contract_card: {
      scope: "project:augnes",
      work_id: "AG-SMOKE",
      work_title: "Fallback smoke card",
      work_status: "needs_review",
      priority: "next",
      recent_events_count: 0,
      linked_proof_action_ids_count: 0,
      linked_prs_count: 0,
      linked_docs_count: 0,
    },
    brief: {
      scope: "project:augnes",
      work_id: "AG-SMOKE",
      work: {
        work_id: "AG-SMOKE",
        title: "Fallback smoke card",
        status: "needs_review",
        priority: "next",
      },
      recent_events: [],
      related_proof: {},
    },
  };
}

function constellationContextCardPayload() {
  return {
    ...fallbackCardPayload(),
    work_contract_constellation_context: {
      status: "attached",
      thesis: "Selectable handoff seed context thesis.",
      selected_candidate_id: "candidate:operator-review",
      selected_candidate_label: "Operator review candidate",
      selection_status: "selected",
      selection_fallback_reason: "",
      pointer_evidence_ref_count: 1,
      pointer_evidence_refs: ["evidence:one: Pointer one -> fixtures/project-constellation.sample.json"],
      unresolved_tension_count: 1,
      unresolved_tensions: ["tension:one: Tension one: Unresolved tension summary."],
      advisory_next_action_summary: "candidate:operator-review: Operator review candidate summary.",
      source_refs: ["fixtures/project-constellation.sample.json"],
      boundary_text: [
        "Project Constellation context is read-only operator context.",
        "Evidence refs remain pointer-only.",
        "Unresolved tensions remain unresolved.",
        "Advisory next action context does not execute Codex.",
      ],
    },
  };
}

function renderFallbackCard(source, options = {}) {
  return renderCard(source, fallbackCardPayload(), options);
}

function renderConstellationContextCard(source, options = {}) {
  return renderCard(source, constellationContextCardPayload(), options);
}

function renderCard(source, payload, options = {}) {
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
  };
  context.navigator = {
    clipboard: {
      async writeText(text) {
        context.__clipboardWriteCount = (context.__clipboardWriteCount ?? 0) + 1;
        if (options.clipboardWriteThrows) throw new Error("blocked");
        context.__copiedText = text;
      },
    },
  };
  context.window = {
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
  };
  vm.createContext(context);
  context.__payload = payload;
  vm.runInContext(source, context);
  const output = vm.runInContext("renderWorkContractCard(__payload)", context);
  return {
    context,
    tree: output,
    text: collectText(output).replace(/\s+/g, " ").trim(),
  };
}

async function assertRenderedCopyAffordance(renderedFallback, expectedPath = "clipboard", expectedTextPattern = /Codex Handoff Preview/) {
  const buttons = collectNodes(renderedFallback.tree, (node) => node.tag === "button");
  assert.equal(buttons.length, 1, "fallback render must include exactly one safe copy button");
  assert.ok(allowedCopyLabels.includes(buttons[0].textContent), "copy button label must be allowed");
  assert.equal(buttons[0].type, "button", "copy button must be type=button");
  assert.ok(buttons[0].listeners.click?.length === 1, "copy button must have one local click handler");
  const statusNodes = collectNodes(
    renderedFallback.tree,
    (node) => node.attributes?.["aria-live"] === "polite" && node.textContent.includes("Copy action only."),
  );
  assert.equal(statusNodes.length, 1, "copy affordance must expose one aria-live local status node");
  const preBlocks = collectNodes(renderedFallback.tree, (node) => node.tag === "pre");
  assert.ok(preBlocks.some((node) => node.textContent.includes("Codex Handoff Preview")), "packet preformatted text must remain visible");

  await buttons[0].listeners.click[0]();
  const copiedText = expectedPath === "execCommand"
    ? renderedFallback.context.__execCommandText
    : expectedPath === "selection"
      ? renderedFallback.context.__selectedText
      : renderedFallback.context.__copiedText;
  assert.match(copiedText, /Codex Handoff Preview/, "copy button must copy the handoff packet");
  assert.match(copiedText, expectedTextPattern, "copy button must copy the expected visible handoff packet text");
  assert.match(copiedText, /BEGIN_AUGNES_CODEX_HANDOFF_JSON/, "copied packet must include JSON begin delimiter");
  assert.match(copiedText, /END_AUGNES_CODEX_HANDOFF_JSON/, "copied packet must include JSON end delimiter");
  if (expectedPath === "selection") {
    assert.equal(
      statusNodes[0].textContent,
      "Clipboard blocked by this host. Packet text selected; press Command+C to copy.",
      "host-blocked clipboard fallback must select visible packet text and label manual copy",
    );
    assert.equal(renderedFallback.context.__selectionCleared, true, "selection fallback must clear previous selection");
    assert.equal(renderedFallback.context.__rangeAdded, true, "selection fallback must select the visible packet text");
  } else {
    assert.equal(statusNodes[0].textContent, "Handoff copied.", "copy success must update local status only");
  }
  if (expectedPath === "execCommand") {
    assert.equal(renderedFallback.context.__execCommand, "copy", "copy fallback must use document.execCommand copy");
  } else {
    assert.equal(renderedFallback.context.__clipboardWriteCount, 1, "copy button must try navigator.clipboard once");
  }

  const jsonBlock = extractEmbeddedHandoffJson(copiedText);
  assert.equal(jsonBlock.schema, "augnes.codex_handoff_preview.v0_1", "embedded handoff JSON schema must match v0.1");
  assert.equal(jsonBlock.packet_kind, "codex_handoff_preview", "embedded handoff JSON kind must identify the packet");
  assert.equal(jsonBlock.copy_packet.preview_only, true, "embedded JSON must mark packet preview-only");
  assert.equal(jsonBlock.copy_packet.does_not_execute_codex, true, "embedded JSON must mark no Codex execution");
  assert.equal(jsonBlock.copy_packet.does_not_record_proof, true, "embedded JSON must mark no proof recording");
  assert.equal(jsonBlock.copy_packet.does_not_record_evidence, true, "embedded JSON must mark no evidence recording");
  assert.equal(jsonBlock.copy_packet.does_not_mutate_state, true, "embedded JSON must mark no state mutation");
  assert.equal(jsonBlock.copy_packet.does_not_merge, true, "embedded JSON must mark no merge authority");
}

function extractEmbeddedHandoffJson(text) {
  const begin = "BEGIN_AUGNES_CODEX_HANDOFF_JSON";
  const end = "END_AUGNES_CODEX_HANDOFF_JSON";
  const beginIndex = text.indexOf(begin);
  const endIndex = text.indexOf(end);
  assert.notEqual(beginIndex, -1, "copied packet must include JSON begin delimiter");
  assert.notEqual(endIndex, -1, "copied packet must include JSON end delimiter");
  assert.ok(endIndex > beginIndex, "copied packet JSON delimiters must be ordered");
  return JSON.parse(text.slice(beginIndex + begin.length, endIndex).trim());
}

function collectText(node) {
  if (!node || typeof node !== "object") return "";
  const ownText = [node.textContent, node.innerHTML].filter(Boolean).join(" ");
  const childText = Array.isArray(node.children) ? node.children.map(collectText).join(" ") : "";
  return `${ownText} ${childText}`;
}

function collectNodes(node, predicate, matches = []) {
  if (!node || typeof node !== "object") return matches;
  if (predicate(node)) matches.push(node);
  if (Array.isArray(node.children)) {
    for (const child of node.children) collectNodes(child, predicate, matches);
  }
  return matches;
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
