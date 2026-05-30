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
assert.match(widget, /renderWorkContractCard/, "widget must implement Work Contract Card rendering");
assert.match(widget, /renderCodexHandoffPreview/, "widget must implement Codex Handoff Preview rendering");
assert.match(runbook, /Data Source/i, "runbook must explain the data source");
assert.match(runbook, /Missing Data Behavior/i, "runbook must explain missing data behavior");
assert.match(runbook, /Codex Handoff Preview/i, "runbook must explain the Codex Handoff Preview");

const uiText = `${server}\n${widget}`;
const forbiddenUiPhrases = [
  "Run Codex",
  "Start Codex",
  "Execute Codex",
  "Merge PR",
  "Enable auto-merge",
  "Approve publication",
  "Publish now",
  "Commit state",
  "Record proof",
  "Record evidence",
];
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
assertNoNetworkCalls(extractFunction(server, "describeWorkContractCard"), "describeWorkContractCard");
assertNoNetworkCalls(extractFunction(server, "describeCodexHandoffPreview"), "describeCodexHandoffPreview");
assertNoNetworkCalls(extractFunction(widget, "renderWorkContractCard"), "renderWorkContractCard");
assertNoNetworkCalls(extractFunction(widget, "renderCodexHandoffPreview"), "renderCodexHandoffPreview");
assertNoNetworkCalls(extractFunction(widget, "normalizeWorkContractCard"), "normalizeWorkContractCard");
assertNoNetworkCalls(extractFunction(widget, "normalizeCodexHandoffPreview"), "normalizeCodexHandoffPreview");
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
  extractFunction(widget, "nonEmptyText"),
  extractFunction(widget, "safeArray"),
  extractFunction(widget, "safeCount"),
  extractFunction(widget, "createCodeListWithFallback"),
  extractFunction(widget, "normalizeWorkContractCard"),
  extractFunction(widget, "normalizeCodexHandoffPreview"),
  extractFunction(widget, "renderCodexHandoffPreview"),
  extractFunction(widget, "renderWorkContractCard"),
].join("\n\n");

assertNoForbiddenControls(extractFunction(widget, "renderWorkContractCard"), "renderWorkContractCard");
assertNoForbiddenControls(extractFunction(widget, "renderCodexHandoffPreview"), "renderCodexHandoffPreview");
assertNoForbiddenControls(extractFunction(widget, "normalizeWorkContractCard"), "normalizeWorkContractCard");
assertNoForbiddenControls(extractFunction(widget, "normalizeCodexHandoffPreview"), "normalizeCodexHandoffPreview");

const renderedFallbackText = renderFallbackCard(renderSource);
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
]) {
  assert.match(renderedFallbackText, new RegExp(escapeRegExp(expectedPreviewText)), `fallback preview must include: ${expectedPreviewText}`);
}

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
  const marker = `function ${name}`;
  const start = source.indexOf(marker);
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
    /\bopenai\b.{0,20}\(/i,
    /\bgithub\b.{0,20}\(/i,
  ];
  for (const pattern of forbiddenPatterns) {
    assert.doesNotMatch(source, pattern, `${label} must not contain direct network or provider calls: ${pattern}`);
  }
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

function renderFallbackCard(source) {
  class FakeNode {
    constructor(tag) {
      this.tag = tag;
      this.children = [];
      this.textContent = "";
      this.className = "";
      this.innerHTML = "";
      this.open = false;
    }

    append(...children) {
      for (const child of children) this.appendChild(child);
    }

    appendChild(child) {
      this.children.push(child);
      return child;
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
  };
  vm.createContext(context);
  vm.runInContext(source, context);
  const output = vm.runInContext(
    `renderWorkContractCard({
      work_contract_card: {
        scope: "project:augnes",
        work_id: "AG-SMOKE",
        work_title: "Fallback smoke card",
        work_status: "needs_review",
        priority: "next",
        recent_events_count: 0,
        linked_proof_action_ids_count: 0,
        linked_prs_count: 0,
        linked_docs_count: 0
      },
      brief: {
        scope: "project:augnes",
        work_id: "AG-SMOKE",
        work: {
          work_id: "AG-SMOKE",
          title: "Fallback smoke card",
          status: "needs_review",
          priority: "next"
        },
        recent_events: [],
        related_proof: {}
      }
    })`,
    context,
  );
  return collectText(output).replace(/\s+/g, " ").trim();
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
