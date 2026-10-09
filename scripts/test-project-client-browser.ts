// One disposable workspace, one ordinary browser profile, two independently
// authenticated tabs. Production components and route handlers own all writes.
import assert from "node:assert/strict";
import { checkAncillaryWorkDraftRecovery } from "./ancillary-work-draft-browser-checks";
import { checkResultWorkDraftRecovery } from "./result-work-draft-browser-checks";
import { checkWorkExpectationDraftRecovery } from "./work-expectation-draft-browser-checks";
import { createServer } from "node:http";
import { spawn } from "node:child_process";
import { existsSync, mkdtempSync, realpathSync, readFileSync, mkdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { build } from "esbuild";
import Database from "better-sqlite3";
import { applyCanonicalDatabaseMigrations } from "./canonical-database-migrations.mjs";
import { installZeroNetworkGuard } from "./test-harness-zero-network-guard.mjs";
import { registerOwnedChild, terminateOwnedProcessTree, trackServerConnections, closeTrackedServer } from "./test-harness-process-lifecycle.mjs";
import { createVNextOperatorContextUseReviewHandlerV01, createVNextOperatorProjectContinuityHandlerV01 } from "../app/api/vnext/operator/project-continuity/route";
import { createVNextLocalOperatorSessionHandlersV01 } from "../app/api/vnext/operator/session/route";
import { createVNextOperatorSemanticReviewHandlersV01 } from "../app/api/vnext/operator/semantic-review/route";
import { createVNextOperatorHostRoundTripReadHandlerV01 } from "../app/api/vnext/operator/host-round-trip/route";
import { GET as guideRoute } from "../app/api/augnes/read/guide-brief/route";
import { POST as projectRoute } from "../app/api/vnext/projects/route";
import { getOrCreateDefaultWorkspaceIdentityV01, getOrCreateCanonicalProjectForLocalRootV01, normalizeLocalProjectRootRefV01 } from "../lib/vnext/persistence/project-identity-registry";
import { issueVNextLocalOperatorBootstrapV01, type VNextLocalOperatorPilotConfigV01 } from "../lib/vnext/runtime/local-operator-session";
import { readActiveProjectSelectionV01, selectActiveProjectV01 } from "../lib/vnext/persistence/project-lifecycle-registry";
import { readCurrentProjectWorkPacketLineageV01 } from "../lib/vnext/runtime/operator-pilot-project-continuity";
import { readSelectedWorkSources } from "../lib/intake/selected-work-source-comparison";

class CDP {
  ws: WebSocket; next = 0; pending = new Map<number, { ok: (v: any) => void; no: (e: Error) => void; timer: ReturnType<typeof setTimeout> }>();
  handlers: Array<(v: any) => void> = [];
  constructor(url: string) { this.ws = new WebSocket(url); }
  async open() {
    await Promise.race([new Promise<void>((ok, no) => { this.ws.addEventListener("open", () => ok(), { once: true }); this.ws.addEventListener("error", () => no(new Error("browser_connection_failed")), { once: true }); }), delay(5000).then(() => { throw new Error("browser_connection_timeout"); })]);
    this.ws.addEventListener("message", event => { const m = JSON.parse(String(event.data)); if (m.id) { const p = this.pending.get(m.id); if (p) { clearTimeout(p.timer); this.pending.delete(m.id); m.error ? p.no(new Error("browser_protocol_error")) : p.ok(m.result); } } else this.handlers.forEach(f => f(m)); });
  }
  send(method: string, params: object = {}): Promise<any> { return new Promise((ok, no) => { const id = ++this.next, timer = setTimeout(() => { this.pending.delete(id); no(new Error(`browser_timeout:${method}`)); }, 10000); this.pending.set(id, { ok, no, timer }); this.ws.send(JSON.stringify({ id, method, params })); }); }
  async eval(expression: string) { const r = await this.send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true }); assert.ok(!r.exceptionDetails, "browser_evaluation_failed"); return r.result.value; }
  close() { for (const p of this.pending.values()) { clearTimeout(p.timer); p.no(new Error("browser_closed")); } this.pending.clear(); this.ws.close(); }
}
async function until(fn: () => Promise<unknown>, label: string) { const end = performance.now() + 15000; while (performance.now() < end) { if (await fn()) return; await delay(50); } throw new Error(`browser_wait:${label}`); }

async function main() {
  const root = realpathSync(mkdtempSync(path.join(tmpdir(), "augnes-project-client-browser-")));
  const databasePath = path.join(root, "workspace.db"), db = new Database(databasePath);
  const owned = new Set(), guard = installZeroNetworkGuard({ allowLoopback: true }), priorDbPath = process.env.AUGNES_DB_PATH;
  const tabs: CDP[] = []; let chrome: ReturnType<typeof registerOwnedChild> | undefined;
  let origin = "", script = "", css = "", errors = 0, external = 0;
  const responseLog: Array<{ route: string; project: string | null; action: string; status: number; error: unknown }> = [];
  let holdA = false, reachedHold = false;
  const held: { release?: () => void } = {};
  const clock = { now: () => new Date().toISOString() };
  const environment = { NODE_ENV: "test" as const, AUGNES_DB_PATH: databasePath,
    AUGNES_LOCAL_REVIEW_PROFILE: "companion_first_work_v1", AUGNES_RUNTIME_CONTRACT: "augnes-local-runtime-supervisor-v1",
    AUGNES_RUNTIME_CHILD_ROLE: "ui", AUGNES_DISTRIBUTION_MODE: "source" };
  const sessions = createVNextLocalOperatorSessionHandlersV01({ environment, clock });
  const continuity = { GET: createVNextOperatorProjectContinuityHandlerV01({ environment, clock }), POST: createVNextOperatorContextUseReviewHandlerV01({ environment, clock }) };
  const semantic = createVNextOperatorSemanticReviewHandlersV01({ environment, clock });
  const host = createVNextOperatorHostRoundTripReadHandlerV01({ environment, clock });
  let a: VNextLocalOperatorPilotConfigV01, b: VNextLocalOperatorPilotConfigV01;
  const server = trackServerConnections(createServer(async (req, res) => {
    try {
      if (req.url === "/app.js") { res.setHeader("Content-Type", "application/javascript"); res.end(script); return; }
      if (req.url === "/app.css") { res.setHeader("Content-Type", "text/css"); res.end(css); return; }
      if (!req.url?.startsWith("/api/")) { res.setHeader("Content-Type", "text/html"); res.end('<link rel="stylesheet" href="/app.css"><div id="root"></div><script src="/app.js"></script>'); return; }
      const chunks: Buffer[] = []; for await (const chunk of req) chunks.push(Buffer.from(chunk)); const body = Buffer.concat(chunks).toString();
      const request = new Request(origin + req.url, { method: req.method, headers: req.headers as Record<string, string>, ...(body ? { body } : {}) });
      const action = body ? JSON.parse(body).action ?? "" : "", project = request.headers.get("Augnes-Project-Id");
      // A genuine in-flight A save remains suspended until the B write finishes.
      if (holdA && action === "revise_pre_execution_project_work" && project === a.project_id) {
        holdA = false; reachedHold = true; await new Promise<void>(resolve => { held.release = resolve; });
      }
      const endpoint = new URL(request.url).pathname;
      const method = req.method === "POST" ? "POST" : "GET";
      const route = endpoint === "/api/vnext/operator/session" ? sessions[method]
        : endpoint === "/api/vnext/operator/project-continuity" ? continuity[method]
          : endpoint === "/api/vnext/operator/semantic-review" ? semantic[method]
            : endpoint === "/api/vnext/operator/host-round-trip" ? host
              : endpoint === "/api/augnes/read/guide-brief" ? guideRoute
                : endpoint === "/api/vnext/projects" ? projectRoute : null;
      assert.ok(route, `unexpected_fixture_route:${endpoint}`);
      const response = await route(request), text = await response.text();
      response.headers.forEach((value, key) => { if (key !== "set-cookie") res.setHeader(key, value); });
      const cookies = response.headers.getSetCookie(); if (cookies.length) res.setHeader("Set-Cookie", cookies);
      responseLog.push({ route: endpoint, project, action, status: response.status, error: JSON.parse(text).error_code ?? null });
      res.statusCode = response.status; res.end(text);
    } catch { errors++; res.statusCode = 500; res.end('{"error":"fixture_http_failed"}'); }
  }));
  try {
    db.pragma("foreign_keys=ON"); applyCanonicalDatabaseMigrations(db); process.env.AUGNES_DB_PATH = databasePath;
    const workspace = getOrCreateDefaultWorkspaceIdentityV01(db);
    [a, b] = ["A", "B"].map(name => {
      const projectRoot = path.join(root, name); mkdirSync(projectRoot);
      const registration = getOrCreateCanonicalProjectForLocalRootV01(db, { workspace_id: workspace.workspace_id,
        local_root: normalizeLocalProjectRootRefV01(projectRoot, { base_path: root }), display_name: `Project ${name}` });
      return { enabled: true as const, database_path: databasePath, workspace_id: workspace.workspace_id,
        project_id: registration.project.project_id, operator_id: "operator:local-review" };
    }) as [VNextLocalOperatorPilotConfigV01, VNextLocalOperatorPilotConfigV01];
    selectActiveProjectV01(db, { ...a, expected_project_id: null, expected_revision: null, now: clock.now() });
    const bundled = await build({ stdin: { contents: `import './app/globals.css';import React from 'react';import{createRoot}from'react-dom/client';import{SemanticReviewSurface}from'./components/workbench/semantic-review/semantic-review-surface';createRoot(document.getElementById('root')).render(React.createElement(SemanticReviewSurface,{projectId:new URL(location.href).searchParams.get('project_id')}));`, resolveDir: process.cwd(), loader: "tsx" }, outfile: path.join(root, "app.js"), bundle: true, write: false, platform: "browser", define: { "process.env.NODE_ENV": '"production"' },
      plugins: [{ name: "fixture-navigation", setup(builder) { builder.onResolve({ filter: /^next\/navigation$/ }, () => ({ path: "fixture-navigation", namespace: "fixture" })); builder.onLoad({ filter: /.*/, namespace: "fixture" }, () => ({ contents: "export const useRouter=()=>({refresh(){}});export const useSearchParams=()=>new URLSearchParams(location.search);", loader: "js" })); } }] });
    script = bundled.outputFiles.find(file => file.path.endsWith(".js"))!.text; css = bundled.outputFiles.find(file => file.path.endsWith(".css"))?.text ?? "";
    await new Promise<void>(ok => server.listen(0, "127.0.0.1", ok)); origin = `http://127.0.0.1:${(server.address() as { port: number }).port}`;
    const profile = path.join(root, "chrome"), args = ["--headless=new", "--no-sandbox", "--disable-gpu", "--no-first-run", "--no-default-browser-check", "--disable-background-networking", "--disable-component-update", "--disable-default-apps", "--disable-domain-reliability", "--disable-extensions", "--disable-sync", "--metrics-recording-only", "--no-pings", "--password-store=basic", "--use-mock-keychain", "--host-resolver-rules=MAP * ~NOTFOUND, EXCLUDE 127.0.0.1", "--remote-debugging-address=127.0.0.1", "--remote-debugging-port=0", `--user-data-dir=${profile}`, "about:blank"];
    const executable = [process.env.AUGNES_BROWSER_EXECUTABLE_PATH,
      "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/Applications/Chromium.app/Contents/MacOS/Chromium",
      "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge", "/usr/bin/google-chrome", "/usr/bin/google-chrome-stable",
      "/usr/bin/chromium", "/usr/bin/chromium-browser"].find(candidate => candidate && existsSync(candidate));
    assert.ok(executable, "project_client_browser_executable_missing");
    const sandbox = '(version 1) (allow default) (deny network*) (allow network-inbound (local ip "localhost:*")) (allow network-outbound (remote ip "localhost:*")) (allow network-bind (local ip "localhost:*")) (allow network* (local unix-socket))';
    chrome = registerOwnedChild(owned, spawn(process.platform === "darwin" ? "/usr/bin/sandbox-exec" : executable,
      process.platform === "darwin" ? ["-p", sandbox, executable, ...args] : args,
      { detached: true, stdio: "ignore", env: { ...process.env, OPENAI_API_KEY: "" } }), { label: "project-client-browser" });
    let port = ""; await until(async () => { try { port = readFileSync(path.join(profile, "DevToolsActivePort"), "utf8").split("\n")[0]!; return !!port; } catch { return false; } }, "chrome");
    const newTab = async (config: VNextLocalOperatorPilotConfigV01) => {
      const target = await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: "PUT" })).json() as any;
      const tab = new CDP(target.webSocketDebuggerUrl); await tab.open(); tabs.push(tab);
      await tab.send("Network.enable"); await tab.send("Runtime.enable"); await tab.send("Page.enable");
      tab.handlers.push(event => { if (event.method === "Runtime.exceptionThrown") errors++; if (event.method === "Fetch.requestPaused") {
        const local = event.params.request.url.startsWith(origin + "/"); if (!local) external++;
        void tab.send(local ? "Fetch.continueRequest" : "Fetch.failRequest", { requestId: event.params.requestId, ...(local ? {} : { errorReason: "BlockedByClient" }) }).catch(() => { errors++; });
      } });
      await tab.send("Fetch.enable", { patterns: [{ urlPattern: "*", requestStage: "Request" }] });
      await tab.send("Page.navigate", { url: `${origin}/workbench/semantic-review?project_id=${config.project_id}` }); return tab;
    };
    const set = (tab: CDP, selector: string, value: string) => tab.eval(`(()=>{const e=document.querySelector(${JSON.stringify(selector)});Object.getOwnPropertyDescriptor(e.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:HTMLInputElement.prototype,'value').set.call(e,${JSON.stringify(value)});e.dispatchEvent(new Event('input',{bubbles:true}));})()`);
    const click = async (tab: CDP, selector: string) => { await until(() => tab.eval(`!!document.querySelector(${JSON.stringify(selector)})&&!document.querySelector(${JSON.stringify(selector)}).disabled`), selector); await tab.eval(`document.querySelector(${JSON.stringify(selector)}).click()`); };
    const clickText = async (tab: CDP, text: string) => { await until(() => tab.eval(`[...document.querySelectorAll('button')].some(e=>e.textContent===${JSON.stringify(text)}&&!e.disabled)`), text); await tab.eval(`[...document.querySelectorAll('button')].find(e=>e.textContent===${JSON.stringify(text)}).click()`); };
    const current = (config: VNextLocalOperatorPilotConfigV01) => readCurrentProjectWorkPacketLineageV01(db, config)?.packet;
    const authenticate = async (tab: CDP, config: VNextLocalOperatorPilotConfigV01) => {
      await until(() => tab.eval("!!document.querySelector('#vnext-operator-bootstrap-token')"), "unlock_form");
      const issue = issueVNextLocalOperatorBootstrapV01(db, { config, clock });
      await set(tab, "#vnext-operator-bootstrap-token", issue.bootstrap_token);
      await click(tab, '[data-augnes-primary-action="unlock"]');
      await until(() => tab.eval("!!document.querySelector('[data-vnext-operator-session=authenticated]')"), "authenticated");
    };
    const openSelection = async (tab: CDP, config: VNextLocalOperatorPilotConfigV01) => {
      const active = readActiveProjectSelectionV01(db, workspace.workspace_id);
      assert.equal(await tab.eval(`fetch('/api/vnext/projects',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(${JSON.stringify({ action: "open", project_id: config.project_id, expected_project_id: active?.project_id ?? null, expected_revision: active?.selection_revision ?? null })})}).then(r=>r.status)`), 200);
    };
    const goalIs = (tab: CDP, goal: string) => until(() => tab.eval(`document.querySelector('[data-current-work-goal]')?.textContent===${JSON.stringify(goal)}`), goal);
    const tabA = await newTab(a); await authenticate(tabA, a);
    await until(() => tabA.eval("!!document.querySelector('#first-work-goal')"), "initial_A");
    await set(tabA, "#first-work-goal", "A first unfinished edit"); await set(tabA, "#first-work-success-criteria", "A result must remain A");
    const tabB = await newTab(b); await authenticate(tabB, b); await openSelection(tabB, b);
    await until(() => tabB.eval("!!document.querySelector('#first-work-goal')"), "initial_B");
    await set(tabB, "#first-work-goal", "B initial work"); await set(tabB, "#first-work-success-criteria", "B result must remain B");
    await click(tabB, '[data-first-work-action="save"]'); await goalIs(tabB, "B initial work");
    assert.equal(await tabA.eval("document.querySelector('#first-work-goal').value"), "A first unfinished edit");
    await click(tabA, '[data-first-work-action="save"]'); await goalIs(tabA, "A first unfinished edit");
    assert.equal(current(a)!.task.goal, "A first unfinished edit"); assert.equal(current(b)!.task.goal, "B initial work");
    await openSelection(tabA, a);
    await clickText(tabA, "Revise work definition"); await set(tabA, "#work-revision-goal", "A preserved revision");
    await tabA.eval("document.querySelector('[data-selected-work-sources]').open=true");
    await set(tabA, "#selected-note-source", "A source revision 1"); await set(tabA, "#selected-note-text", "Retain A exception exactly; B never receives this selected note.");
    await click(tabA, '[data-selected-source-action="add"]'); await click(tabA, '[data-selected-source-action="compare"]');
    await until(() => tabA.eval("!document.querySelector('[data-work-revision-action=save]').disabled"), "A_comparison");
    await openSelection(tabB, b); await clickText(tabB, "Revise work definition"); await set(tabB, "#work-revision-goal", "B independently revised");
    holdA = true; await click(tabA, '[data-work-revision-action="save"]'); await until(async () => reachedHold, "A_save_in_flight");
    await click(tabB, '[data-work-revision-action="save"]'); await goalIs(tabB, "B independently revised");
    await openSelection(tabB, a); assert.ok(held.release); held.release(); delete held.release;
    await goalIs(tabA, "A preserved revision"); assert.equal(readSelectedWorkSources(current(a)!)[0]!.bounded_summary, "Retain A exception exactly; B never receives this selected note.");
    assert.equal(readSelectedWorkSources(current(b)!).length, 0);
    // Another A writer changes the exact work while the original edit remains.
    await clickText(tabA, "Revise work definition"); await set(tabA, "#work-revision-goal", "A draft retained across conflict");
    const conflict = await tabA.eval(`(async()=>{const h={'Augnes-Project-Id':${JSON.stringify(a.project_id)},'content-type':'application/json'};const r=await fetch('/api/vnext/operator/project-continuity',{headers:h});const w=(await r.json()).work_initialization;const s=await fetch('/api/vnext/operator/project-continuity',{method:'POST',headers:h,body:JSON.stringify({action:'revise_pre_execution_project_work',workspace_id:w.workspace_id,project_id:w.project_id,expected_active_project_id:w.project_id,expected_active_selection_revision:w.active_selection_revision,expected_project_work_binding:w.project_work_binding,expected_current_packet_id:w.current_packet.packet_id,expected_current_packet_fingerprint:w.current_packet.packet_fingerprint,expected_current_lineage_kind:w.current_packet.lineage_kind,...w.current_work,goal:'A newer competing work'})});return s.status})()`);
    assert.equal(conflict, 201); await click(tabA, '[data-work-revision-action="save"]');
    await until(() => tabA.eval("!!document.querySelector('[data-work-draft-conflict]')"), "genuine_conflict");
    assert.equal(await tabA.eval("document.querySelector('#work-revision-goal').value"), "A draft retained across conflict");
    assert.equal(current(a)!.task.goal, "A newer competing work");
    await click(tabA, '[data-work-draft-action="rebase"]');
    await tabA.eval("document.querySelector('[data-selected-work-sources]').open=true");
    await click(tabA, '[data-selected-source-action="compare"]');
    await click(tabA, '[data-work-revision-action="save"]'); await goalIs(tabA, "A draft retained across conflict");
    // Different-new-work preparation and save retain B even with A selected.
    const priorB = current(b)!.packet_id;
    await clickText(tabB, "Prepare a different task");
    await set(tabB, "#new-work-goal", "B different new work"); await set(tabB, "#new-work-success-criteria", "A history remains separate");
    await tabB.eval("document.querySelector('[data-selected-work-sources]').open=true");
    await click(tabB, '[data-selected-source-action="compare"]');
    await click(tabB, '[data-augnes-primary-action="preview-new-work"]');
    await until(() => tabB.eval("!!document.querySelector('[data-new-work-preview]')"), "B_new_work_preview");
    const newWorkConflict = await tabB.eval(`(async()=>{const h={'Augnes-Project-Id':${JSON.stringify(b.project_id)},'content-type':'application/json'};const r=await fetch('/api/vnext/operator/project-continuity',{headers:h});const w=(await r.json()).work_initialization;return(await fetch('/api/vnext/operator/project-continuity',{method:'POST',headers:h,body:JSON.stringify({action:'revise_pre_execution_project_work',workspace_id:w.workspace_id,project_id:w.project_id,expected_active_project_id:w.project_id,expected_active_selection_revision:w.active_selection_revision,expected_project_work_binding:w.project_work_binding,expected_current_packet_id:w.current_packet.packet_id,expected_current_packet_fingerprint:w.current_packet.packet_fingerprint,expected_current_lineage_kind:w.current_packet.lineage_kind,...w.current_work,goal:'B competing preparation'})})).status})()`);
    assert.equal(newWorkConflict, 201); await click(tabB, '[data-new-work-action="save"]');
    await until(() => tabB.eval("!!document.querySelector('[data-work-draft-conflict]')"), "new_work_conflict");
    assert.equal(await tabB.eval("document.querySelector('#new-work-goal').value"), "B different new work");
    assert.equal(current(b)!.task.goal, "B competing preparation");
    await click(tabB, '[data-work-draft-action="rebase"]');
    await tabB.eval("document.querySelector('[data-selected-work-sources]').open=true");
    await click(tabB, '[data-selected-source-action="compare"]');
    await click(tabB, '[data-augnes-primary-action="preview-new-work"]');
    await until(() => tabB.eval("!!document.querySelector('[data-new-work-preview]')"), "B_refreshed_preview");
    assert.equal(await tabB.eval(`fetch('/api/vnext/operator/session',{method:'POST',headers:{'Augnes-Project-Id':${JSON.stringify(b.project_id)},'content-type':'application/json'},body:JSON.stringify({action:'logout'})}).then(r=>r.status)`), 200);
    await click(tabB, '[data-new-work-action="save"]');
    await until(() => tabB.eval("!!document.querySelector('#vnext-operator-bootstrap-token')"), "new_work_revoked");
    assert.equal(await tabB.eval("!!document.querySelector('#new-work-goal')"), false);
    assert.equal(current(b)!.task.goal, "B competing preparation");
    await authenticate(tabB, b);
    await until(() => tabB.eval("!!document.querySelector('[data-new-work-preview]')"), "new_work_restored");
    assert.equal(await tabB.eval("document.querySelector('#new-work-goal').value"), "B different new work");
    await click(tabB, '[data-new-work-action="save"]'); await goalIs(tabB, "B different new work");
    assert.notEqual(current(b)!.packet_id, priorB);
    assert.equal((db.prepare("SELECT COUNT(*) AS n FROM vnext_core_records WHERE record_id=?").get(priorB) as { n: number }).n, 1, "The original B work remains in history");
    // Revocation hides the retained A draft; only matching renewed authority
    // restores it. B's live tab remains authorized throughout.
    await clickText(tabA, "Revise work definition"); await set(tabA, "#work-revision-goal", "A retained after reauthentication");
    assert.equal(await tabA.eval(`fetch('/api/vnext/operator/session',{method:'POST',headers:{'Augnes-Project-Id':${JSON.stringify(a.project_id)},'content-type':'application/json'},body:JSON.stringify({action:'logout'})}).then(r=>r.status)`), 200);
    await tabA.eval("document.querySelector('[data-selected-work-sources]').open=true");
    await click(tabA, '[data-selected-source-action="compare"]');
    await until(() => tabA.eval("!!document.querySelector('#vnext-operator-bootstrap-token')"), "A_revoked");
    assert.equal(await tabA.eval("!!document.querySelector('#work-revision-goal')"), false);
    const wrongIssue = issueVNextLocalOperatorBootstrapV01(db, { config: b, clock });
    await set(tabA, "#vnext-operator-bootstrap-token", wrongIssue.bootstrap_token); await click(tabA, '[data-augnes-primary-action="unlock"]');
    await until(() => tabA.eval("document.body.textContent.includes('operator_session_scope_mismatch')"), "wrong_project_token_refused");
    assert.equal(await tabA.eval("!!document.querySelector('#work-revision-goal')"), false);
    assert.equal(await tabB.eval(`fetch('/api/vnext/operator/session',{headers:{'Augnes-Project-Id':${JSON.stringify(b.project_id)}}}).then(r=>r.status)`), 200);
    await authenticate(tabA, a);
    await until(() => tabA.eval("!!document.querySelector('#work-revision-goal')"), "A_draft_restored");
    assert.equal(await tabA.eval("document.querySelector('#work-revision-goal').value"), "A retained after reauthentication");
    assert.equal(await tabA.eval("document.body.textContent.includes('Retain A exception exactly')"), true);
    if (await tabA.eval("!!document.querySelector('[data-work-draft-action=rebase]')")) {
      await click(tabA, '[data-work-draft-action="rebase"]'); await tabA.eval("document.querySelector('[data-selected-work-sources]').open=true"); await click(tabA, '[data-selected-source-action="compare"]');
    }
    await click(tabA, '[data-work-revision-action="save"]'); await goalIs(tabA, "A retained after reauthentication");
    await openSelection(tabB, b);
    const freshA = await newTab(a), freshB = await newTab(b);
    await goalIs(freshA, "A retained after reauthentication"); await goalIs(freshB, "B different new work");
    for (const width of [390, 768, 1440]) {
      await freshA.send("Emulation.setDeviceMetricsOverride", { width, height: 900, deviceScaleFactor: 1, mobile: width === 390 });
      assert.equal(await freshA.eval("document.documentElement.scrollWidth<=window.innerWidth+1"), true, `horizontal_overflow_${width}`);
    }
    assert.equal(readActiveProjectSelectionV01(db, workspace.workspace_id)!.project_id, b.project_id, "Opening an inactive A URL cannot switch the workspace selection");
    assert.equal(await freshB.eval("document.body.textContent.includes('Retain A exception exactly')"), false);
    const resultDraftComponent = await checkResultWorkDraftRecovery(tabA);
    const expectationDraftComponent = await checkWorkExpectationDraftRecovery(tabA);
    const ancillaryDraftComponent = await checkAncillaryWorkDraftRecovery(tabA);
    assert.equal(errors, 0, JSON.stringify(responseLog)); assert.equal(external, 0); assert.equal(guard.attempts.length, 0);
    console.log(JSON.stringify({ result: "PASS", harness: "production React components and HTTP handlers; Next navigation refresh stubbed", one_browser_profile: true, result_draft_component: resultDraftComponent, expectation_draft_component: expectationDraftComponent, ancillary_draft_component: ancillaryDraftComponent, interleaving: "A request held while B saves, then A released", initial_saves: "A and B", revision_source_save: "A retained text and selected note across A-B-A", conflict: "newer A preserved, draft retained and explicit refresh accepted", different_new_work: "B conflict refreshed and retained; revoked preview hidden then restored; saved while A selected; history retained", revoked_draft: "hidden; wrong-project refused; matching reauthentication restored text and sources", fresh_reentry: "correct A/B work; inactive URL does not select", viewport_widths: [390, 768, 1440], provider_calls: 0, external_requests: external, browser_errors: errors }));
  } catch (error) {
    console.error("Browser route outcomes:", responseLog);
    // Only authored fixture DOM is inspected; credentials never enter a dump.
    for (const tab of tabs) { try { console.error(await tab.eval("document.body.innerText.slice(-5000)")); } catch {} }
    throw error;
  } finally {
    held.release?.(); for (const tab of tabs) tab.close();
    if (chrome) await terminateOwnedProcessTree(chrome);
    await closeTrackedServer(server); db.close(); guard.restore();
    if (priorDbPath === undefined) delete process.env.AUGNES_DB_PATH; else process.env.AUGNES_DB_PATH = priorDbPath;
    rmSync(root, { recursive: true, force: true }); assert.equal(owned.size, 0);
    assert.equal(server.listening, false); assert.equal(db.open, false); assert.equal(existsSync(root), false);
    if (chrome) assert.equal(chrome.closed, true);
    console.log(JSON.stringify({ project_client_browser_cleanup: "complete", owned_children: owned.size, listener_open: server.listening, database_open: db.open, temporary_root_exists: existsSync(root) }));
  }
}
void main().catch(error => { console.error(error); process.exitCode = 1; });
