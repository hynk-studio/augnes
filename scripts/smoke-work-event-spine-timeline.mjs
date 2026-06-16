import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import vm from "node:vm";

const serverPath = "apps/augnes_apps/src/server.ts";
const widgetPath = "apps/augnes_apps/public/console-widget.html";
const runbookPath = "apps/augnes_apps/docs/12_WORK_CONTRACT_CARD_RUNBOOK.md";
const demoSeedPath = "scripts/demo-seed.mjs";

for (const filePath of [serverPath, widgetPath, runbookPath, demoSeedPath]) {
  assert.ok(existsSync(filePath), `${filePath} must exist`);
}

const server = readFileSync(serverPath, "utf8");
const widget = readFileSync(widgetPath, "utf8");
const runbook = readFileSync(runbookPath, "utf8");
const demoSeed = readFileSync(demoSeedPath, "utf8");

assert.match(server, /function buildWorkEventSpineTimeline\(/, "server must define a pure Work Event Spine timeline helper");
assert.match(server, /briefRecord\.coordination_events/, "server helper must derive from attached work brief coordination_events");
assert.match(server, /work_event_spine_timeline:\s*workEventSpineTimeline/, "augnes_get_work_brief must expose work_event_spine_timeline");
assert.match(server, /coordination_event_timeline:\s*workEventSpineTimeline/, "augnes_get_work_brief must expose coordination_event_timeline alias");
assert.match(server, /event_spine_timeline:\s*workEventSpineTimeline/, "augnes_get_work_brief must expose event_spine_timeline alias");
assert.match(server, /event_spine_inspector:\s*workEventSpineTimeline\.selected_event/, "augnes_get_work_brief must expose selected event inspector alias");
assert.match(server, /sort_order:\s*"created_at_ascending"/, "timeline sort order must be explicit");
assert.match(server, /No coordination events are attached to this work item yet\./, "empty state must be explicit");

for (const label of [
  "Work event spine",
  "Event timeline",
  "Event inspector",
  "Event type",
  "Created at",
  "Actor",
  "Authority level",
  "Work ID",
  "Payload ref",
  "Result status",
  "State keys",
  "Causal parent",
  "Source surface",
  "Target",
  "No coordination events yet",
]) {
  assert.match(widget, new RegExp(escapeRegExp(label)), `widget must render label: ${label}`);
}

assert.match(runbook, /structuredContent\.brief\.coordination_events/, "runbook must document attached coordination_events as data source");
assert.match(runbook, /does not fetch `\/api\/events`/, "runbook must document no App/MCP event fetching");
assert.match(runbook, /not broader event instrumentation/, "runbook must document no new instrumentation");
assert.match(runbook, /not a\s+result import\/write path/i, "runbook must document no result write path");
assert.match(runbook, /not proof\/evidence recording/i, "runbook must document no proof/evidence recording");
assert.match(runbook, /not state\s+commit\/reject/i, "runbook must document no state commit/reject");
assert.match(demoSeed, /event:ag-006-spine-storage-handoff/, "demo seed must include the AG-006 coordination event");
assert.match(demoSeed, /workId:\s*"AG-006"/, "demo seed must attach the coordination event to AG-006");

const serverFeatureSource = [
  extractFunction(server, "stateKeysFromUnknown"),
  extractFunction(server, "payloadSummaryFromEventRecord"),
  extractFunction(server, "sortTimestamp"),
  extractFunction(server, "buildWorkEventSpineTimelineEvent"),
  extractFunction(server, "buildWorkEventSpineTimeline"),
].join("\n\n");
const widgetFeatureSource = [
  extractFunction(widget, "eventStringArray"),
  extractFunction(widget, "sortEventTimestamp"),
  extractFunction(widget, "normalizeCoordinationTimelineEvent"),
  extractFunction(widget, "normalizeWorkEventSpineTimeline"),
  extractFunction(widget, "formatTimelineSortOrder"),
  extractFunction(widget, "renderWorkEventTimelineItem"),
  extractFunction(widget, "renderWorkEventSpineTimeline"),
].join("\n\n");

assertNoForbiddenFeatureAuthority(serverFeatureSource, "server Work Event Spine timeline helper");
assertNoForbiddenFeatureAuthority(widgetFeatureSource, "widget Work Event Spine timeline renderer");

const renderSource = [
  extractFunction(widget, "el"),
  extractFunction(widget, "codeChip"),
  extractFunction(widget, "tag"),
  extractFunction(widget, "createMetricGrid"),
  extractFunction(widget, "createSection"),
  extractFunction(widget, "createTextList"),
  extractFunction(widget, "createCodeList"),
  extractFunction(widget, "nonEmptyText"),
  extractFunction(widget, "safeArray"),
  extractFunction(widget, "formatUiStatus"),
  extractFunction(widget, "createCodeListWithFallback"),
  extractFunction(widget, "safeRecord"),
  extractFunction(widget, "safeRecordArray"),
  extractFunction(widget, "firstRecord"),
  widgetFeatureSource,
].join("\n\n");

const fixturePayload = {
  brief: {
    scope: "project:augnes",
    work_id: "AG-006",
    coordination_events: [
      {
        event_id: "event:ag-006-spine-storage-handoff-ready",
        event_type: "handoff_ready",
        scope: "project:augnes",
        work_id: "AG-006",
        actor: "user",
        target: "codex",
        source_surface: "local_runtime",
        authority_level: "handoff_guidance",
        state_keys: ["coordination.event_spine"],
        causal_parent_id: "event:ag-006-spine-storage-handoff-created",
        payload_ref: "docs/AUGNES_COORDINATION_SPINE_ROADMAP.md#pr-b",
        result_status: "",
        created_at: "2026-05-08T00:05:00.000Z",
        payload_summary: "Handoff result has a temporal anchor.",
      },
      {
        event_id: "event:ag-006-spine-storage-handoff-created",
        event_type: "handoff_created",
        scope: "project:augnes",
        work_id: "AG-006",
        actor: "user",
        target: "codex",
        source_surface: "local_runtime",
        authority_level: "handoff_guidance",
        state_keys: ["coordination.event_spine", "integration.chatgpt_app"],
        causal_parent_id: "",
        payload_ref: "docs/AUGNES_COORDINATION_SPINE_ROADMAP.md#pr-b",
        result_status: "completed",
        created_at: "2026-05-08T00:01:00.000Z",
        payload_summary: "Handoff packet was created from the Work Contract Card.",
      },
    ],
  },
  work_event_spine_timeline: {
    timeline_type: "work_event_spine_timeline",
    status: "attached",
    scope: "project:augnes",
    work_id: "AG-006",
    event_count: 2,
    sort_order: "created_at_ascending",
    events: [],
    selected_event: null,
    empty_state: "No coordination events are attached to this work item yet.",
    warnings: [],
    boundary_text: [
      "Work event spine timeline is read-only and derived from attached work brief coordination_events.",
      "No event creation.",
      "No event mutation.",
      "No proof/evidence write.",
      "No state commit/reject.",
      "No Codex execution.",
      "No GitHub calls.",
      "No provider/OpenAI calls.",
      "No publish/merge/retry/replay/deploy authority.",
    ],
  },
};

const rendered = renderWidget(renderSource, fixturePayload);
for (const expected of [
  "Work event spine timeline is read-only and derived from attached work brief coordination_events.",
  "Event timeline",
  "Event inspector",
  "event:ag-006-spine-storage-handoff-created",
  "handoff_created",
  "2026-05-08T00:01:00.000Z",
  "handoff_guidance",
  "docs/AUGNES_COORDINATION_SPINE_ROADMAP.md#pr-b",
  "coordination.event_spine",
  "integration.chatgpt_app",
  "Handoff packet was created from the Work Contract Card.",
]) {
  assert.match(rendered.text, new RegExp(escapeRegExp(expected)), `rendered fixture must include ${expected}`);
}
assert.ok(
  rendered.text.indexOf("event:ag-006-spine-storage-handoff-created") <
    rendered.text.indexOf("event:ag-006-spine-storage-handoff-ready"),
  "rendered fixture must sort events by created_at ascending",
);

const emptyRendered = renderWidget(renderSource, {
  brief: { scope: "project:augnes", work_id: "AG-EMPTY", coordination_events: [] },
});
assert.match(emptyRendered.text, /No coordination events yet/, "empty render must label no coordination events yet");
assert.match(
  emptyRendered.text,
  /No coordination events are attached to this work item yet\./,
  "empty render must use explicit no-events state",
);
assert.doesNotMatch(emptyRendered.text, /event:/, "empty render must not invent event IDs");
assert.doesNotMatch(emptyRendered.text, /docs\/AUGNES_COORDINATION_SPINE_ROADMAP/, "empty render must not invent payload refs");

console.log(JSON.stringify({
  smoke: "work-event-spine-timeline",
  server_structured_content_present: true,
  attached_coordination_events_data_source_checked: true,
  empty_state_checked: true,
  widget_labels_checked: true,
  fixture_event_details_rendered: true,
  sort_order_checked: true,
  read_only_boundary_checked: true,
  forbidden_authority_patterns_absent: true,
}, null, 2));

function renderWidget(source, payload) {
  class FakeNode {
    constructor(tag) {
      this.tag = tag;
      this.children = [];
      this.textContent = "";
      this.innerHTML = "";
      this.className = "";
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
    Date,
    Number,
    Array,
    String,
  };
  vm.createContext(context);
  context.__payload = payload;
  vm.runInContext(source, context);
  const output = vm.runInContext(
    "renderWorkEventSpineTimeline(__payload.work_event_spine_timeline, __payload)",
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

function extractFunction(source, name) {
  const asyncMarker = `async function ${name}(`;
  const marker = `function ${name}(`;
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

function assertNoForbiddenFeatureAuthority(source, label) {
  const forbiddenPatterns = [
    /\bchild_process\b/,
    /\bspawn\s*\(/,
    /\bexecFile\s*\(/,
    /\bexec\s*\(/,
    /\bfetch\s*\(/,
    /\bXMLHttpRequest\b/,
    /\bWebSocket\b/,
    /\bEventSource\b/,
    /\bapi\.github\.com\b/,
    /\bapi\.openai\.com\b/,
    /\bopenai\b.{0,20}\(/i,
    /\bgithub\b.{0,20}\(/i,
    /\bappendCoordinationEvent\b/,
    /\brecordEvidence\b/,
    /\brecordProof\b/,
    /\bcommitState\b/,
    /\bmergePr\b/i,
    /\bpublish\b.{0,20}\(/i,
    /\bretry\b.{0,20}\(/i,
    /\breplay\b.{0,20}\(/i,
    /\bdeploy\b.{0,20}\(/i,
  ];
  for (const pattern of forbiddenPatterns) {
    assert.doesNotMatch(source, pattern, `${label} must not contain forbidden authority pattern: ${pattern}`);
  }
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
