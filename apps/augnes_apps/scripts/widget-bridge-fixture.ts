import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

type JsonRpcMessage = Record<string, unknown>;
type WidgetEvent = Record<string, unknown>;

class FakeElement {
  private value = "";
  children: FakeElement[] = [];
  hidden = false;
  replaceChildrenCount = 0;
  textWriteCount = 0;

  get textContent() {
    return this.value;
  }

  set textContent(value: string) {
    this.value = String(value);
    this.textWriteCount += 1;
  }

  replaceChildren(...children: FakeElement[]) {
    this.children = children;
    this.replaceChildrenCount += 1;
  }

  append(...children: FakeElement[]) {
    this.children.push(...children);
  }
}

type WidgetHarness = ReturnType<typeof createWidgetHarness>;

const widgetHtml = readFileSync(
  new URL("../public/console-widget.html", import.meta.url),
  "utf8"
);
const widgetScriptMatch = widgetHtml.match(/<script>\s*([\s\S]*?)<\/script>/);
if (!widgetScriptMatch?.[1]) {
  throw new Error("console widget should contain one inline bridge script");
}
const widgetScript = widgetScriptMatch[1];

function createWidgetHarness(openai?: Record<string, unknown>) {
  const elements = new Map(
    ["title", "summary", "details", "facts"].map((id) => [id, new FakeElement()])
  );
  const listeners = new Map<string, Array<(event: WidgetEvent) => void>>();
  const posted: Array<{ message: JsonRpcMessage; targetOrigin: string }> = [];
  const timers = new Map<number, () => void>();
  let nextTimerId = 0;

  const parent = {
    postMessage(message: JsonRpcMessage, targetOrigin: string) {
      posted.push({ message, targetOrigin });
    },
  };
  const window = {
    parent,
    openai,
    addEventListener(
      type: string,
      listener: (event: WidgetEvent) => void
    ) {
      listeners.set(type, [...(listeners.get(type) ?? []), listener]);
    },
    setTimeout(callback: () => void) {
      nextTimerId += 1;
      timers.set(nextTimerId, callback);
      return nextTimerId;
    },
    clearTimeout(id: number) {
      timers.delete(id);
    },
  };
  const document = {
    getElementById(id: string) {
      return elements.get(id) ?? null;
    },
    createElement() {
      return new FakeElement();
    },
  };

  vm.runInNewContext(widgetScript, { document, window });

  return {
    elements,
    parent,
    posted,
    timers,
    dispatch(type: string, event: WidgetEvent) {
      for (const listener of listeners.get(type) ?? []) listener(event);
    },
  };
}

function initializeRequest(harness: WidgetHarness) {
  const request = harness.posted.find(
    ({ message }) => message.method === "ui/initialize"
  )?.message;
  assert.ok(request, "widget should send ui/initialize");
  return request;
}

async function flushMicrotasks() {
  await new Promise<void>((resolve) => setImmediate(resolve));
}

async function completeInitialization(harness: WidgetHarness) {
  const request = initializeRequest(harness);
  harness.dispatch("message", {
    source: harness.parent,
    data: {
      jsonrpc: "2.0",
      id: request.id,
      result: {
        protocolVersion: "2026-01-26",
        hostInfo: { name: "widget-bridge-fixture", version: "1.0.0" },
        hostCapabilities: {},
        hostContext: {},
      },
    },
  });
  await flushMicrotasks();
  assert.ok(
    harness.posted.some(
      ({ message }) => message.method === "ui/notifications/initialized"
    ),
    "widget should notify the host after successful initialization"
  );
  assert.equal(harness.timers.size, 0, "completed initialization should clear its timer");
}

function workBrief(title: string) {
  return {
    panel: "work_brief",
    brief: {
      work: { title, status: "active", priority: "high" },
      recent_events: [],
    },
  };
}

function sendToolResult(harness: WidgetHarness, params: Record<string, unknown>) {
  harness.dispatch("message", {
    source: harness.parent,
    data: {
      jsonrpc: "2.0",
      method: "ui/notifications/tool-result",
      params,
    },
  });
}

export async function assertConsoleWidgetBridge() {
  const initialToolOutput = createWidgetHarness({
    toolOutput: workBrief("Initial tool output"),
  });
  assert.equal(
    initialToolOutput.elements.get("title")?.textContent,
    "Initial tool output",
    "window.openai.toolOutput should render through the shared projection"
  );
  await completeInitialization(initialToolOutput);

  const initialStructuredContent = createWidgetHarness({
    structuredContent: workBrief("Initial structured content"),
  });
  assert.equal(
    initialStructuredContent.elements.get("title")?.textContent,
    "Initial structured content",
    "window.openai.structuredContent should render through the shared projection"
  );
  await completeInitialization(initialStructuredContent);

  const globalsEvent = createWidgetHarness();
  await completeInitialization(globalsEvent);
  globalsEvent.dispatch("openai:set_globals", {
    detail: { globals: { toolOutput: workBrief("Globals event result") } },
  });
  assert.equal(
    globalsEvent.elements.get("title")?.textContent,
    "Globals event result",
    "openai:set_globals should render supplied tool output"
  );

  const bridge = createWidgetHarness();
  const request = initializeRequest(bridge);
  assert.deepEqual(JSON.parse(JSON.stringify(request.params)), {
    appInfo: { name: "augnes-console-widget", version: "0.1.0" },
    appCapabilities: {},
    protocolVersion: "2026-01-26",
  });
  assert.match(String(request.id), /^augnes-ui-\d+$/);
  assert.equal(bridge.posted[0]?.targetOrigin, "*");

  bridge.dispatch("message", {
    source: {},
    data: {
      jsonrpc: "2.0",
      id: request.id,
      result: {
        protocolVersion: "2026-01-26",
        hostInfo: { name: "ignored", version: "1.0.0" },
        hostCapabilities: {},
        hostContext: {},
      },
    },
  });
  await flushMicrotasks();
  assert.equal(
    bridge.posted.filter(
      ({ message }) => message.method === "ui/notifications/initialized"
    ).length,
    0,
    "non-parent initialization responses should be ignored"
  );
  bridge.dispatch("message", {
    source: bridge.parent,
    data: {
      jsonrpc: "2.0",
      id: "augnes-ui-mismatch",
      result: {
        protocolVersion: "2026-01-26",
        hostInfo: { name: "ignored", version: "1.0.0" },
        hostCapabilities: {},
        hostContext: {},
      },
    },
  });
  assert.equal(
    bridge.timers.size,
    1,
    "a mismatched response id should not consume the pending initialization"
  );
  bridge.dispatch("message", {
    source: bridge.parent,
    data: { jsonrpc: "2.0", id: request.id, result: { protocolVersion: 7 } },
  });
  await flushMicrotasks();
  assert.equal(
    bridge.posted.filter(
      ({ message }) => message.method === "ui/notifications/initialized"
    ).length,
    0,
    "malformed initialization responses should fail closed"
  );
  assert.equal(bridge.timers.size, 0, "malformed matching responses should clean up pending state");

  const standardDelivery = createWidgetHarness();
  await completeInitialization(standardDelivery);
  sendToolResult(standardDelivery, {
    structuredContent: workBrief("MCP Apps result"),
  });
  assert.equal(
    standardDelivery.elements.get("title")?.textContent,
    "MCP Apps result",
    "ui/notifications/tool-result should render structuredContent"
  );

  const textDelivery = createWidgetHarness();
  await completeInitialization(textDelivery);
  sendToolResult(textDelivery, {
    content: [{ type: "text", text: JSON.stringify(workBrief("JSON text result")) }],
  });
  assert.equal(
    textDelivery.elements.get("title")?.textContent,
    "JSON text result",
    "the bounded first JSON text content item should render"
  );
  const beforeMalformedText = textDelivery.elements.get("facts")?.replaceChildrenCount;
  sendToolResult(textDelivery, {
    content: [{ type: "text", text: "<img src=x onerror=alert(1)>" }],
  });
  assert.equal(
    textDelivery.elements.get("title")?.textContent,
    "JSON text result",
    "malformed text should not erase a valid projection"
  );
  assert.equal(
    textDelivery.elements.get("facts")?.replaceChildrenCount,
    beforeMalformedText,
    "malformed text should not trigger a second render after valid data"
  );

  const publicTextFallback = createWidgetHarness();
  await completeInitialization(publicTextFallback);
  sendToolResult(publicTextFallback, {
    content: [{ type: "text", text: "<script>provider payload</script>" }],
  });
  assert.equal(
    publicTextFallback.elements.get("title")?.textContent,
    "Read-only Augnes result",
    "initial non-JSON text should use a fixed public-safe projection"
  );
  assert.doesNotMatch(
    publicTextFallback.elements.get("summary")?.textContent ?? "",
    /provider payload|<script>/i,
    "the public-safe fallback should not render raw tool text"
  );

  const restrictedMessages = createWidgetHarness();
  await completeInitialization(restrictedMessages);
  const initialTitle = restrictedMessages.elements.get("title")?.textContent;
  restrictedMessages.dispatch("message", {
    source: {},
    data: {
      jsonrpc: "2.0",
      method: "ui/notifications/tool-result",
      params: { structuredContent: workBrief("Wrong source") },
    },
  });
  restrictedMessages.dispatch("message", {
    source: restrictedMessages.parent,
    data: {
      jsonrpc: "1.0",
      method: "ui/notifications/tool-result",
      params: { structuredContent: workBrief("Wrong envelope") },
    },
  });
  restrictedMessages.dispatch("message", {
    source: restrictedMessages.parent,
    data: {
      jsonrpc: "2.0",
      method: "ui/notifications/host-context-changed",
      params: { structuredContent: workBrief("Wrong method") },
    },
  });
  assert.equal(
    restrictedMessages.elements.get("title")?.textContent,
    initialTitle,
    "non-parent, malformed, and unrelated messages should not alter the projection"
  );

  const duplicate = createWidgetHarness({
    toolOutput: workBrief("Idempotent result"),
  });
  await completeInitialization(duplicate);
  const firstRenderCount = duplicate.elements.get("facts")?.replaceChildrenCount ?? 0;
  sendToolResult(duplicate, {
    structuredContent: {
      brief: {
        recent_events: [],
        work: { priority: "high", status: "active", title: "Idempotent result" },
      },
      panel: "work_brief",
    },
  });
  assert.equal(
    duplicate.elements.get("facts")?.replaceChildrenCount,
    firstRenderCount,
    "canonical duplicate delivery should not render twice"
  );
  sendToolResult(duplicate, {
    structuredContent: workBrief("Distinct later result"),
  });
  assert.equal(
    duplicate.elements.get("title")?.textContent,
    "Distinct later result",
    "a distinct later result should replace the read-only projection"
  );
  assert.equal(
    duplicate.elements.get("facts")?.replaceChildrenCount,
    firstRenderCount + 1,
    "a distinct later result should render exactly once"
  );

  assert.doesNotMatch(widgetHtml, /\binnerHTML\b|insertAdjacentHTML/);
  assert.doesNotMatch(
    widgetHtml,
    /navigator\.clipboard|execCommand|<button|<textarea|<input|<select|contenteditable|localStorage|sessionStorage|\bfetch\s*\(|XMLHttpRequest|WebSocket|EventSource|codexResultText|codexResultPaste/i
  );
  assert.doesNotMatch(widgetHtml, /tools\/call|ui\/message|ui\/update-model-context/);
  assert.doesNotMatch(
    widgetHtml,
    /Handoff Capsule|Core Handoff|Launch Card|copy packet|paste result|result textarea/i
  );
  assert.match(widgetHtml, /MAX_PENDING_REQUESTS = 4/);
  assert.match(widgetHtml, /Native-host execution and structured result/);
}

if (
  process.argv[1] &&
  fileURLToPath(import.meta.url) === resolve(process.argv[1])
) {
  await assertConsoleWidgetBridge();
  console.log(
    "Widget bridge fixture passed: 8 scenarios, 0 external/provider calls."
  );
}
