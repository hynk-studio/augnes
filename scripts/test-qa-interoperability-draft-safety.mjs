// Focused, reusable regression checks for the 2026-11-09 human/agent QA findings.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import vm from "node:vm";
import { handleMessageV01 } from "../plugins/augnes-operator/mcp/companion-proxy.mjs";
import { executionChoiceText } from "../plugins/augnes-operator/mcp/execution-choice.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const web = readFileSync(path.join(root, "apps/web_planning/src/client.js.txt"), "utf8");

function sourcePart(start, end) {
  const a = web.indexOf(start);
  assert(a !== -1, "missing function start: " + start);
  const b = web.indexOf(end, a + start.length);
  assert(b !== -1, "missing function end: " + end);
  return web.slice(a, b);
}

function deferred() {
  let resolve;
  const promise = new Promise(r => { resolve = r; });
  return { promise, resolve };
}

function fakeDom() {
  const elements = new Map();
  function $(id) {
    if (!elements.has(id)) {
      elements.set(id, {
        hidden: false, textContent: "", value: "", files: [], children: [],
        replaceChildren(...items) { this.children = items; },
        append(item) { this.children.push(item); },
      });
    }
    return elements.get(id);
  }
  return $;
}

async function testProxy() {
  function request(id, method, params) { return { jsonrpc: "2.0", id, method, params }; }
  const init = async v => (await handleMessageV01(request(1, "initialize", { protocolVersion: v }))).result.protocolVersion;
  assert.equal(await init("2025-06-18"), "2025-06-18");
  assert.equal(await init("2025-03-26"), "2025-06-18");
  assert.equal(await init("2999-01-01"), "2025-06-18");
  assert.equal(await handleMessageV01({ jsonrpc: "2.0", method: "notifications/progress", params: { progress: 20 } }), null);
  assert.equal(await handleMessageV01({ jsonrpc: "2.0", method: "notifications/initialized" }), null);
  const catalog = await handleMessageV01(request(2, "tools/list"));
  assert(catalog.result.tools.some(tool => tool.name === "augnes_resume_repository"));
  const unknown = await handleMessageV01(request(3, "tools/call", {
    name: "augnes_this_tool_does_not_exist",
    arguments: { repositoryRoot: "/tmp/qa-project-not-connected" },
  }));
  assert.equal(unknown.error?.code, -32602);
  assert.equal(unknown.error?.message, "unknown_tool_name");
  assert.equal(unknown.result, undefined);
  const unavailable = executionChoiceText({ status: "unavailable", reason: "companion_unavailable",
    next_action: "Reconnect and read fresh work." });
  assert.match(unavailable, /could not be checked/);
  assert.match(unavailable, /does not mean none/);
  assert.doesNotMatch(unavailable, /No arrangement has been selected/);
  const empty = executionChoiceText({ status: "available", work: { goal: "Test" }, next_action: "Review." });
  assert.match(empty, /No arrangement has been selected/);
}

function testSignout() {
  const $ = fakeDom();
  let allowed = false, cleared = 0, message = "";
  const state = { $, mayLeave: () => allowed, deny: () => { cleared++; }, status: text => { message = text; } };
  vm.runInNewContext(sourcePart("$('signout').onclick=", "\nwindow.addEventListener('beforeunload'"), state);
  let prevented = 0;
  $("signout").onclick({ preventDefault() { prevented++; } });
  assert.equal(cleared, 0);
  assert.equal(prevented, 1, "cancelled sign-out must not follow the logout link");
  assert.match(message, /Sign out cancelled/);
  allowed = true;
  $("signout").onclick({ preventDefault() { prevented++; } });
  assert.equal(cleared, 1);
  assert.equal(prevented, 1, "approved sign-out must keep the logout link working");
}

async function testImport(stage) {
  const $ = fakeDom();
  const fileRead = deferred(), apiResponse = deferred();
  const exportText = JSON.stringify({ format: "web_planning_export.v0.3" });
  $("import-file").files = [{ size: 100, text: () => stage === "file" ? fileRead.promise : Promise.resolve(exportText) }];
  let apiCalls = 0, shows = 0, lists = 0, message = "";
  const state = {
    $, work: "original", inputEpoch: 0, accessLost: false,
    mayLeave: () => true, runWorkChange: fn => fn(),
    api: () => { apiCalls++; return stage === "response" ? apiResponse.promise : Promise.resolve({ saved: { work_id: "imported" } }); },
    show: async () => { shows++; }, list: async () => { lists++; },
    status: text => { message = text; },
  };
  vm.runInNewContext(sourcePart("$('import').onclick=", "\n$('more-work').onclick"), state);
  const running = $("import").onclick();
  if (stage === "file") {
    state.inputEpoch++;
    fileRead.resolve(exportText);
  } else if (stage === "response") {
    for (let i = 0; i < 5; i++) await Promise.resolve();
    assert.equal(apiCalls, 1, "reconstruction should have been requested");
    state.inputEpoch++;
    apiResponse.resolve({ saved: { work_id: "imported" } });
  }
  await running;
  if (stage === "normal") {
    assert.equal(shows, 1);
    assert.equal(state.work, "imported");
  } else {
    assert.equal(shows, 0, "late import must not overwrite a newer unsaved draft");
    assert.equal(state.work, "original");
    assert.match(message, /draft|edited|edits/i);
    assert.equal(apiCalls, stage === "file" ? 0 : 1);
    if (stage === "response") assert.equal(lists, 1);
  }
}

async function testScenes(modified) {
  const $ = fakeDom(), pending = deferred();
  const state = {
    $, inputEpoch: 0, sceneLoadEpoch: 0, sceneBook: null, activeScene: null,
    sceneModified: false, accessLost: false, sceneContext: null, sceneReviewPending: null,
    sceneUnknown: false, sceneInherited: false, sceneFile: "augnes-scenes.v1.json",
    invalidateSceneContext: () => {}, invalidateSceneReview: () => {},
    fileText: () => pending.promise,
    document: { createElement: () => ({}) },
  };
  state.displayScene = saved => { state.activeScene = saved; };
  vm.runInNewContext(sourcePart("async function loadScenes(r){", "\nfunction sceneCanStart()") +
    "\nglobalThis.loadScenes = loadScenes;", state);
  const loading = state.loadScenes({ files: [{ name: state.sceneFile, role: "scene" }] });
  if (modified) {
    state.activeScene = { id: "new-unsaved-scene", draft: "New writing" };
    state.sceneModified = true;
    state.inputEpoch++;
  }
  pending.resolve(JSON.stringify({ scenes: [{ id: "saved-scene", title: "Older writing", draft: "Old writing" }] }));
  await loading;
  assert.equal(state.activeScene.id, modified ? "new-unsaved-scene" : "saved-scene");
  if (modified) {
    assert.equal(state.activeScene.draft, "New writing");
    assert.equal(state.sceneModified, true);
    assert.match($("scene-state").textContent, /not displayed/);
  }
}

await testProxy();
const parsed = spawnSync(process.execPath, ["--check", "--input-type=commonjs"], { input: web, encoding: "utf8" });
assert.equal(parsed.status, 0, parsed.stderr);
testSignout();
await testImport("file");
await testImport("response");
await testImport("normal");
await testScenes(true);
await testScenes(false);
console.log("qa_interoperability_draft_safety_passed");
