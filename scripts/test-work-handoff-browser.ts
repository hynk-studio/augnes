import assert from "node:assert/strict";
import { createServer } from "node:http";
import { spawn } from "node:child_process";
import { readFileSync, writeFileSync, existsSync, mkdirSync, rmSync } from "node:fs";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { build } from "esbuild";
import Database from "better-sqlite3";
import { installZeroNetworkGuard } from "./test-harness-zero-network-guard.mjs";
import { registerOwnedChild, terminateOwnedProcessTree, trackServerConnections, closeTrackedServer } from "./test-harness-process-lifecycle.mjs";
import { createWorkHandoffHandler } from "../app/api/vnext/operator/work-handoff/route";
import { createVNextOperatorContextUseReviewHandlerV01 } from "../app/api/vnext/operator/project-continuity/route";
import { createStatelessSourceReviewHandler } from "../app/api/vnext/operator/stateless-source-review/route";
import { createVNextLocalOperatorSessionHandlersV01 } from "../app/api/vnext/operator/session/route";
import { createOpenAIResponsesAdapterV01 } from "../lib/vnext/model-gateway/openai/responses-adapter";
import { issueVNextLocalOperatorBootstrapV01, VNEXT_LOCAL_OPERATOR_SESSION_COOKIE_V01, VNEXT_LOCAL_OPERATOR_SESSION_COOKIE_PATH_V01 } from "../lib/vnext/runtime/local-operator-session";
import { readCurrentProjectWorkPacketLineageV01 } from "../lib/vnext/runtime/operator-pilot-project-continuity";
import { readProjectWorkInitializationV01 } from "../lib/vnext/runtime/project-work-initialization";
import { readProjectAutomationControlV01, mutateProjectControlV01 } from "../lib/vnext/persistence/project-control-store";
import { readSelectedWorkSources, selectedWorkSourceInput } from "../lib/intake/selected-work-source-comparison";
import { previewActivePortableProjectV01 } from "../lib/vnext/portability/portable-project";
import { runDirectNativeHostRoundTripV01 } from "../lib/vnext/runtime/direct-native-host-round-trip";
import { readWorkHandoff, handoffHash } from "../lib/vnext/work-handoff";
import { canonicalizeProtocolValueV01 as canonical } from "../lib/vnext/protocol-primitives";
import { validateRecoveryCanonicalDatabaseV01 } from "./recovery-canonical-record-validator";
class CDP {
  ws: WebSocket; next = 0; pending = new Map<number, { ok: (v: any) => void; no: (e: Error) => void; timer: ReturnType<typeof setTimeout> }>();
  handlers: Array<(v: any) => void> = [];
  constructor(url: string) { this.ws = new WebSocket(url); }
  async open() {
    await Promise.race([new Promise<void>((ok, no) => { this.ws.addEventListener("open", () => ok(), { once: true }); this.ws.addEventListener("error", () => no(new Error("browser_connection_failed")), { once: true }); }), delay(5000).then(() => { throw new Error("browser_connection_timeout"); })]);
    this.ws.addEventListener("message", event => { const m = JSON.parse(String(event.data)); if (m.id) { const p = this.pending.get(m.id); if (p) { clearTimeout(p.timer); this.pending.delete(m.id); m.error ? p.no(new Error("browser_protocol_error")) : p.ok(m.result); } } else this.handlers.forEach(f => f(m)); });
  }
  send(method: string, params: object = {}): Promise<any> {
    return new Promise((ok, no) => { const id = ++this.next, timer = setTimeout(() => { this.pending.delete(id); no(new Error(`browser_timeout:${method}`)); }, 5000); this.pending.set(id, { ok, no, timer }); this.ws.send(JSON.stringify({ id, method, params })); });
  }
  async eval(expression: string) { const r = await this.send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true }); assert.ok(!r.exceptionDetails, "browser_evaluation_failed"); return r.result.value; }
  close() { for (const p of this.pending.values()) { clearTimeout(p.timer); p.no(new Error("browser_closed")); } this.pending.clear(); this.ws.close(); }
}
async function until(fn: () => Promise<unknown>, label: string) { const end = Date.now() + 10000; while (Date.now() < end) { if (await fn()) return; await delay(50); } throw new Error(`browser_wait:${label}`); }
async function main() {
 const { config, projectRoot, handoffPath, sourceDatabase, oldGrant } = JSON.parse(readFileSync(process.argv[2]!, "utf8"));
 assert.equal(existsSync(sourceDatabase), false); assert.ok(config.database_path.includes("augnes-work-handoff-"));
 const snapshot = JSON.parse(readFileSync(handoffPath, "utf8")), db = new Database(config.database_path), owned = new Set();
 const root = path.join(path.dirname(config.database_path), "browser-owned"); mkdirSync(root);
 const guard = installZeroNetworkGuard({ allowLoopback: true });
 let c: CDP | undefined, child: ReturnType<typeof registerOwnedChild> | undefined, cookie = "", origin = "", script = "", calls = 0, external = 0;
 const inputs: any[] = [];
 const environment = { NODE_ENV: "test" as const, OPENAI_API_KEY: "", AUGNES_VNEXT_OPERATOR_PILOT_ENABLED: "1", AUGNES_VNEXT_OPERATOR_WORKSPACE_ID: config.workspace_id, AUGNES_VNEXT_OPERATOR_PROJECT_ID: config.project_id, AUGNES_VNEXT_OPERATOR_ID: config.operator_id, AUGNES_DB_PATH: config.database_path };
 const adapter = createOpenAIResponsesAdapterV01({ environment: { OPENAI_API_KEY: "scripted-not-a-key", OPENAI_MODEL: "gpt-4.1-mini" }, transport: async req => {
  calls++; const input = JSON.parse(JSON.parse(JSON.parse(req.body).input[1].content[0].text).message); inputs.push(input);
  return { ok: true, status: 200, json: async () => ({ output: [{ type: "message", content: [{ type: "output_text", text: JSON.stringify({ recommendations: [{ title: "Transferred context review", rationale: "Use the selected current observation and preserve imported uncertainty.", tool_name: input.stage === "choose" ? "read_selected_sources" : "use_observation", priority: "now", grounded_state_keys: [input.stage === "choose" ? input.review_ref : input.observation_fingerprint] }] }) }] }], usage: { input_tokens: 100, output_tokens: 70, total_tokens: 170 } }) };
 } });
 const handoff = createWorkHandoffHandler({ environment }), continuity = createVNextOperatorContextUseReviewHandlerV01({ environment }), review = createStatelessSourceReviewHandler({ environment, adapter }), sessions = createVNextLocalOperatorSessionHandlersV01({ environment });
 const endpoint = `/api/vnext/operator/work-handoff?project_id=${config.project_id}`, reviewEndpoint = `/api/vnext/operator/stateless-source-review?project_id=${config.project_id}`;
 const server = trackServerConnections(createServer(async (req, res) => {
  try {
   if (req.url === "/app.js") { res.setHeader("Content-Type", "application/javascript"); res.end(script); return; }
   if (!req.url?.startsWith("/api/")) { res.setHeader("Content-Type", "text/html"); res.end('<div id="root"></div><script src="/app.js"></script>'); return; }
   const chunks: Buffer[] = []; let size = 0; for await (const chunk of req) { size += chunk.length; assert.ok(size <= 64000); chunks.push(Buffer.from(chunk)); }
   const body = Buffer.concat(chunks).toString(); console.log(JSON.stringify({stage:"http",action:body?JSON.parse(body).action:"read",url:req.url})); const request = new Request(origin + req.url, { method: req.method, headers: req.headers as Record<string, string>, ...(body ? { body } : {}) });
   const response = await (req.url === "/api/vnext/operator/session" ? sessions[req.method === "POST" ? "POST" : "GET"] : req.url.startsWith("/api/vnext/operator/work-handoff") ? handoff : req.url.startsWith("/api/vnext/operator/stateless-source-review") ? review : continuity)(request);
   response.headers.forEach((v, k) => { if (k !== "set-cookie") res.setHeader(k, v); }); const cookies = response.headers.getSetCookie(); if (cookies.length) res.setHeader("Set-Cookie", cookies); for (const value of cookies) if (value.startsWith(VNEXT_LOCAL_OPERATOR_SESSION_COOKIE_V01 + "=")) cookie = value.split(";")[0]!;
   res.statusCode = response.status; res.end(await response.text());
  } catch { res.statusCode = 500; res.end(JSON.stringify({ error: "test_http_failed" })); }
 }));
 async function http(route: string, body?: any, expected = 200) { const response = await fetch(origin + route, { signal: AbortSignal.timeout(10000), method: body ? "POST" : "GET", headers: { origin, cookie, ...(body ? { "content-type": "application/json" } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) }); for (const value of response.headers.getSetCookie()) if (value.startsWith(VNEXT_LOCAL_OPERATOR_SESSION_COOKIE_V01 + "=")) cookie = value.split(";")[0]!; const value = await response.json(); assert.equal(response.status, expected, canonical(value)); return value; }
 const current = () => readCurrentProjectWorkPacketLineageV01(db, config)!.packet;
 try {
  script = (await build({ stdin: { contents: `import React from 'react'; import {createRoot} from 'react-dom/client'; import {WorkHandoff} from './components/blank-state/work-handoff'; createRoot(document.getElementById('root')).render(React.createElement(WorkHandoff,{projectId:${JSON.stringify(config.project_id)}}));`, resolveDir: process.cwd(), loader: "tsx" }, bundle: true, write: false, platform: "browser", define: { "process.env.NODE_ENV": '\"production\"' }, plugins: [{ name: "navigation-only", setup(b) { b.onResolve({ filter: /^next\/navigation$/ }, () => ({ path: "navigation", namespace: "test" })); b.onLoad({ filter: /.*/, namespace: "test" }, () => ({ contents: "export const useRouter = () => ({refresh(){}});" })); } }] })).outputFiles[0]!.text;
  await new Promise<void>(ok => server.listen(0, "127.0.0.1", ok)); origin = `http://127.0.0.1:${(server.address() as { port: number }).port}`;
  const bootstrap = issueVNextLocalOperatorBootstrapV01(db, { config }); const admitted = await http("/api/vnext/operator/session", { action: "bootstrap", bootstrap_token: bootstrap.bootstrap_token }); assert.equal(admitted.ok, true);
  if (process.argv[3] === "--readback") {
    const saved = await http(endpoint); assert.deepEqual(saved.handoff, snapshot); assert.equal(saved.packet.capability_grant, null);
    assert.equal(readProjectAutomationControlV01(db, config)!.enabled, false); const result = await http(reviewEndpoint);
    assert.equal(result.reviews.length, 1); assert.equal(result.reviews[0].run.status, "completed");
    assert.equal(calls, 0); assert.equal(validateRecoveryCanonicalDatabaseV01(db).status, "valid");
    console.log(JSON.stringify({ fresh_receiver_process: process.pid, authenticated_readback: "PASS", source_database_unavailable: !existsSync(sourceDatabase), provider_calls: 0 })); return;
  }

  const profile = path.join(root, "chrome"), args = ["--headless=new", "--no-sandbox", "--disable-gpu", "--no-first-run", "--no-default-browser-check", "--disable-background-networking", "--disable-component-update", "--disable-default-apps", "--disable-domain-reliability", "--disable-extensions", "--disable-sync", "--metrics-recording-only", "--no-pings", "--password-store=basic", "--use-mock-keychain", "--host-resolver-rules=MAP * ~NOTFOUND, EXCLUDE 127.0.0.1", "--remote-debugging-address=127.0.0.1", "--remote-debugging-port=0", `--user-data-dir=${profile}`, "about:blank"];
  const sandbox = '(version 1) (allow default) (deny network*) (allow network-inbound (local ip "localhost:*")) (allow network-outbound (remote ip "localhost:*")) (allow network-bind (local ip "localhost:*")) (allow network* (local unix-socket))';
  child = registerOwnedChild(owned, spawn("/usr/bin/sandbox-exec", ["-p", sandbox, "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", ...args], { detached: true, stdio: "ignore", env: { ...process.env, OPENAI_API_KEY: "" } }), { label: "work-handoff-browser" });
  let port = ""; await until(async () => { try { port = readFileSync(path.join(profile, "DevToolsActivePort"), "utf8").split("\n")[0]!; return !!port; } catch { return false; } }, "chrome");
  const target = await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: "PUT" })).json() as any;
  c = new CDP(target.webSocketDebuggerUrl); await c.open(); const browser = c;
  await c.send("Network.enable"); await c.send("Runtime.enable"); await c.send("Page.enable");
  c.handlers.push(m => { if (m.method === "Fetch.requestPaused") { const local = m.params.request.url.startsWith(origin + "/"); if (!local) external++; void browser.send(local ? "Fetch.continueRequest" : "Fetch.failRequest", { requestId: m.params.requestId, ...(local ? {} : { errorReason: "BlockedByClient" }) }).catch(() => {}); } });
  await c.send("Fetch.enable", { patterns: [{ urlPattern: "*", requestStage: "Request" }] });
  await c.send("Network.setCookie", { name: VNEXT_LOCAL_OPERATOR_SESSION_COOKIE_V01, value: cookie.slice(cookie.indexOf("=") + 1), url: origin, path: VNEXT_LOCAL_OPERATOR_SESSION_COOKIE_PATH_V01, httpOnly: true, sameSite: "Strict" });
  await c.send("Page.navigate", { url: origin }); await until(() => browser.eval("!!document.querySelector('[data-work-handoff]')"), "component");
  await browser.eval("document.querySelector('[data-work-handoff]').open=true");
  const document = await c.send("DOM.getDocument"), node = await c.send("DOM.querySelector", { nodeId: document.root.nodeId, selector: 'input[type="file"]' });
  await c.send("DOM.setFileInputFiles", { nodeId: node.nodeId, files: [handoffPath] });
  await until(() => browser.eval("[...document.querySelectorAll('button')].some(e=>e.textContent==='Author this work in the selected project'&&!e.disabled)"), "preview");
  assert.equal(calls, 0); assert.equal((db.prepare("SELECT COUNT(*) n FROM autonomy_runs").get() as { n: number }).n, 0); assert.equal(readProjectAutomationControlV01(db, config)?.enabled ?? false, false);
  assert.ok(await browser.eval(`document.body.textContent.includes(${JSON.stringify(snapshot.evidence.observation.sources[0].text)})`));
  await browser.eval("[...document.querySelectorAll('button')].find(e=>e.textContent==='Author this work in the selected project').click()");
  await until(() => browser.eval("document.body.textContent.includes('Work saved with no execution grant')"), "authored");
  const received = current(); assert.equal(received.capability_grant, null); assert.deepEqual(received.task, snapshot.task); assert.deepEqual(readWorkHandoff(received), snapshot);
  assert.throws(() => previewActivePortableProjectV01(db), /portable_imported_work_handoff_not_supported/);
  await assert.rejects(() => runDirectNativeHostRoundTripV01(db, { config, mode: "interactive" }), /direct_host_(run_conflict|unresolved_stateless_effects)/);
  assert.equal(received.workspace_id, config.workspace_id); assert.notEqual(received.project_id, snapshot.source.project_id);
  await http(reviewEndpoint, { action: "authorize_and_run", authorization: oldGrant }, 409); assert.equal(calls, 0);
  // Exact duplicate acknowledges only this unchanged immediate first work.
  const previewRequest = { action: "define_initial_project_work", workspace_id: config.workspace_id, project_id: config.project_id, expected_active_project_id: config.project_id, expected_active_selection_revision: 1, expected_initialization_state: "not_defined", ...snapshot.task, handoff: { snapshot, expected_root_fingerprint: (await import("../lib/vnext/runtime/stateless-source-review")).rootBinding(db, config).fingerprint, expected_direction_ref: null } };
  await http(endpoint, { action: "receive", request: { ...previewRequest, goal: "Changed after preview" }, expected_preview: handoffHash(previewRequest) }, 409);
  const duplicate = await http(endpoint, { action: "receive", request: previewRequest, expected_preview: handoffHash(previewRequest) }); assert.equal(duplicate.status, "exact_replay");
  assert.equal((await http(endpoint, { action: "verify_material", expected_packet_fingerprint: received.integrity.fingerprint })).matches_historical_material, true);
  const file = path.join(projectRoot, "entry.ts"), original = readFileSync(file);
  rmSync(file); await http(endpoint, { action: "verify_material", expected_packet_fingerprint: received.integrity.fingerprint }, 409);
  writeFileSync(file, original + "// changed current source\n"); assert.equal((await http(endpoint, { action: "verify_material", expected_packet_fingerprint: received.integrity.fingerprint })).matches_historical_material, false); writeFileSync(file, original);
  const state = readProjectWorkInitializationV01(db, config), comparison = (await http("/api/vnext/operator/project-continuity", { action: "compare_selected_work_sources", expected_current_packet_id: received.packet_id, expected_current_packet_fingerprint: received.integrity.fingerprint, notes: readSelectedWorkSources(received).map(selectedWorkSourceInput) })).comparison;
  const request = { action: "preview_new_project_work", workspace_id: config.workspace_id, project_id: config.project_id, expected_active_project_id: config.project_id, expected_active_selection_revision: state.active_selection_revision, expected_current_packet_id: received.packet_id, expected_current_packet_fingerprint: received.integrity.fingerprint, expected_current_lineage_kind: state.current_packet!.lineage_kind,
    goal: "Check remaining source limits using transferred context", success_criteria: ["Separate current observations from imported interpretation"], non_goals: ["Do not settle unknown effects"], selected_source_context: comparison.entries, expected_source_comparison: comparison.fingerprint, omitted_sources: [] };
  const next = await http("/api/vnext/operator/project-continuity", request); await http("/api/vnext/operator/project-continuity", next.request, 201);
  assert.deepEqual(readWorkHandoff(current()), snapshot); assert.equal(current().capability_grant, null); assert.equal(calls, 0);
  await http(endpoint, { action: "receive", request: previewRequest, expected_preview: handoffHash(previewRequest) }, 409);
  const material = { question: "What does the current selected source establish?", files: [{ path: "entry.ts", start_line: 1, end_line: 1 }] };
  await http(reviewEndpoint, { action: "prepare", material }); assert.deepEqual(readWorkHandoff(current()), snapshot);
  await http(reviewEndpoint, { action: "preview", pricing: { input_nano_usd_per_byte: 1000, output_nano_usd_per_token: 1000, maximum_total_nano_usd: 100000000, source_version: "scripted-only" } }, 409);
  const control = readProjectAutomationControlV01(db, config); mutateProjectControlV01(db, { workspace_id: config.workspace_id, project_id: config.project_id, action: "enable_automation", expected_active_project_id: config.project_id, expected_active_selection_revision: state.active_selection_revision!, expected_control_revision: control?.revision ?? null });
  const grant = (await http(reviewEndpoint, { action: "preview", pricing: { input_nano_usd_per_byte: 1000, output_nano_usd_per_token: 1000, maximum_total_nano_usd: 100000000, source_version: "scripted-only" } })).authorization;
  const result = (await http(reviewEndpoint, { action: "authorize_and_run", authorization: grant })).result; assert.equal(result.run.status, "completed"); assert.equal(calls, 2); assert.notEqual(grant.packet_id, oldGrant.packet_id);
  for (const input of inputs) { assert.equal(input.imported_work_history.fingerprint, snapshot.fingerprint); assert.ok(input.imported_work_history.obligations.length); assert.equal(input.imported_work_history.obligations[0].predecessors[0].run_id, JSON.parse(snapshot.obligations[0].bounded_summary).predecessors[0].run_id); assert.equal(input.selected_work_notes.notes[0].imported_attribution.source_entry_id, snapshot.selected_notes[0].entry_id); assert.equal(input.selected_work_notes.notes[0].imported_attribution.original_provenance, snapshot.selected_notes[0].trust_class); assert.equal(input.selected_work_notes.notes[0].text, snapshot.selected_notes[0].bounded_summary); }
  const resultPreparation = await http("/api/vnext/operator/project-continuity", { action: "read_result_work_preparation", receipt_id: result.receipt.receipt_id });
  const retainedNotes = readSelectedWorkSources(current()).filter(e => !e.bounded_summary?.includes('"profile":"stateless_source_review.v0.1"'));
  const resultComparison = (await http("/api/vnext/operator/project-continuity", { action: "compare_result_work_sources", binding: resultPreparation.binding, notes: retainedNotes.map(e => ({ saved_source_id: e.entry_id })) })).comparison;
  const resultPreview = await http("/api/vnext/operator/project-continuity", { action: "preview_result_work", binding: resultPreparation.binding,
    definition: { goal: "Review the next remaining obligation", success_criteria: ["Keep historical uncertainty separate"], non_goals: ["Do not accept the report as fact"] },
    selected_sources: { selected_source_context: resultComparison.entries, expected_source_comparison: resultComparison.fingerprint, omitted_sources: resultComparison.unselected_previous.map((e: any) => ({ source_binding: e.source_ref, reason: "Current inspection inventory is historical for this next task." })) } });
  await http("/api/vnext/operator/project-continuity", { action: "prepare_result_work", request: resultPreview.request }, 201);
  assert.deepEqual(readWorkHandoff(current()), snapshot); assert.equal(current().capability_grant, null);
  assert.equal(validateRecoveryCanonicalDatabaseV01(db).status, "valid");
  const latestControl = readProjectAutomationControlV01(db, config)!; mutateProjectControlV01(db, { workspace_id: config.workspace_id, project_id: config.project_id, action: "disable_automation", expected_active_project_id: config.project_id, expected_active_selection_revision: state.active_selection_revision!, expected_control_revision: latestControl.revision });
  console.log(JSON.stringify({ receiver_pid: process.pid, source_database_unavailable: true, ui_http_receive: "PASS", ordinary_successor_preparation: "PASS", fresh_scripted_calls: calls, mandatory_history_retained: true, material_missing_and_changed: "PASS", recovery_readback: "PASS", provider_calls: 0 }));
 } finally {
  try { if (cookie) { const latest = cookie; const logout = await http("/api/vnext/operator/session", { action: "logout" }); assert.equal(logout.status, "revoked"); cookie = latest; await http("/api/vnext/operator/session", undefined, 401); cookie = ""; } } finally {
  c?.close(); if (child) await terminateOwnedProcessTree(child); await closeTrackedServer(server); db.close(); assert.equal(owned.size, 0); assert.equal(guard.attempts.length, 0); guard.restore(); rmSync(root, { recursive: true, force: true }); assert.equal(external, 0);
  }
 }
}
void main().catch(e => { console.error(e); process.exitCode = 1; });
