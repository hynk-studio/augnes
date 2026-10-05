// Fresh process, real component, HTTP writers and authenticated local agent route.
// All identity/channel credentials below belong only to the disposable fixture.
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { spawn } from "node:child_process";
import { readFileSync, mkdirSync, rmSync } from "node:fs";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { build } from "esbuild";
import Database from "better-sqlite3";
import { installZeroNetworkGuard } from "./test-harness-zero-network-guard.mjs";
import { registerOwnedChild, terminateOwnedProcessTree, trackServerConnections, closeTrackedServer } from "./test-harness-process-lifecycle.mjs";
import { createVNextOperatorContextUseReviewHandlerV01, createVNextOperatorProjectContinuityHandlerV01 } from "../app/api/vnext/operator/project-continuity/route";
import { createVNextLocalOperatorSessionHandlersV01 } from "../app/api/vnext/operator/session/route";
import { createProjectDirectionHandler } from "../app/api/vnext/operator/project-direction/route";
import { createStatelessSourceReviewHandler } from "../app/api/vnext/operator/stateless-source-review/route";
import { POST as agentRevision } from "../app/api/augnes/repository-work-revision/route";
import { POST as agentResume } from "../app/api/augnes/read/codex-repository-continuity/route";
import { POST as agentSources } from "../app/api/augnes/read/codex-repository-work-sources/route";
import { CODEX_REPOSITORY_CONTINUITY_ROUTE_MARKER_V01 } from "../types/vnext/codex-repository-continuity";
import { issueVNextLocalOperatorBootstrapV01, VNEXT_LOCAL_OPERATOR_SESSION_COOKIE_V01, VNEXT_LOCAL_OPERATOR_SESSION_COOKIE_PATH_V01 } from "../lib/vnext/runtime/local-operator-session";
import { readCurrentProjectWorkPacketLineageV01 } from "../lib/vnext/runtime/operator-pilot-project-continuity";
import { readProjectAutomationControlV01 } from "../lib/vnext/persistence/project-control-store";
import { readActiveProjectSelectionV01, selectActiveProjectV01 } from "../lib/vnext/persistence/project-lifecycle-registry";
import { buildSelectedWorkSourceEntry, compareSelectedWorkSources, readSelectedWorkSources } from "../lib/intake/selected-work-source-comparison";
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
  send(method: string, params: object = {}): Promise<any> { return new Promise((ok, no) => { const id = ++this.next, timer = setTimeout(() => { this.pending.delete(id); no(new Error(`browser_timeout:${method}`)); }, 5000); this.pending.set(id, { ok, no, timer }); this.ws.send(JSON.stringify({ id, method, params })); }); }
  async eval(expression: string) { const r = await this.send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true }); assert.ok(!r.exceptionDetails, "browser_evaluation_failed"); return r.result.value; }
  close() { for (const p of this.pending.values()) { clearTimeout(p.timer); p.no(new Error("browser_closed")); } this.pending.clear(); this.ws.close(); }
}
async function until(fn: () => Promise<unknown>, label: string) { const end = performance.now() + 10000; while (performance.now() < end) { if (await fn()) return; await delay(50); } throw new Error(`browser_wait:${label}`); }

async function main() {
  const { config, projectRoot, at, mode, cumulative = false } = JSON.parse(readFileSync(process.argv[2]!, "utf8"));
  assert.ok(config.database_path.includes("durable-surface-"));
  const db = new Database(config.database_path), root = path.join(path.dirname(config.database_path), `owned-${mode}`); mkdirSync(root);
  const owned = new Set(), guard = installZeroNetworkGuard({ allowLoopback: true });
  const envBefore = { ...process.env }, NativeDate = Date;
  const clock = { now: () => at };
  const environment = { NODE_ENV: "test" as const, OPENAI_API_KEY: "", AUGNES_VNEXT_OPERATOR_PILOT_ENABLED: "1", AUGNES_VNEXT_OPERATOR_WORKSPACE_ID: config.workspace_id,
    AUGNES_VNEXT_OPERATOR_PROJECT_ID: config.project_id, AUGNES_VNEXT_OPERATOR_ID: config.operator_id, AUGNES_DB_PATH: config.database_path };
  const sessions = createVNextLocalOperatorSessionHandlersV01({ environment, clock });
  const stateless = createStatelessSourceReviewHandler({ environment, clock });
  const post = createVNextOperatorContextUseReviewHandlerV01({ environment, clock }), get = createVNextOperatorProjectContinuityHandlerV01({ environment, clock });
  let c: CDP | undefined, chrome: ReturnType<typeof registerOwnedChild> | undefined, origin = "", cookie = "", script = "", css = "", errors = 0, external = 0, saves = 0;
  const current = () => readCurrentProjectWorkPacketLineageV01(db, config)!.packet;
  const old = current(), nextGoal = cumulative ? `${current().task.goal} / ${mode} continuation` : current().task.goal, rows = db.prepare("SELECT * FROM vnext_core_records ORDER BY rowid").all();
  const authority = () => canonical([readProjectAutomationControlV01(db, config), ...["autonomy_runs", "autonomy_run_steps", "autonomy_run_events"].map(t => db.prepare(`SELECT * FROM ${t} ORDER BY rowid`).all())]);
  const beforeAuthority = authority();
  const server = trackServerConnections(createServer(async (req, res) => {
    try {
      if (req.url === "/app.js") { res.setHeader("Content-Type", "application/javascript"); res.end(script); return; }
      if (req.url === "/app.css") { res.setHeader("Content-Type", "text/css"); res.end(css); return; }
      if (!req.url?.startsWith("/api/")) { res.setHeader("Content-Type", "text/html"); res.end('<link rel="stylesheet" href="/app.css"><div id="root"></div><script src="/app.js"></script>'); return; }
      const chunks: Buffer[] = []; for await (const chunk of req) chunks.push(Buffer.from(chunk)); const body = Buffer.concat(chunks).toString();
      if (body && ["revise_pre_execution_project_work", "author_terminal_work", "prepare_linked_work"].includes(JSON.parse(body).action)) saves++;
      const request = new Request(origin + req.url, { method: req.method, headers: req.headers as Record<string, string>, ...(body ? { body } : {}) });
      const response = await (req.url === "/api/vnext/operator/session" ? sessions[req.method === "POST" ? "POST" : "GET"] : req.url.startsWith("/api/vnext/operator/stateless-source-review") ? stateless : req.method === "POST" ? post : get)(request);
      response.headers.forEach((v, k) => { if (k !== "set-cookie") res.setHeader(k, v); });
      const cookies = response.headers.getSetCookie(); if (cookies.length) res.setHeader("Set-Cookie", cookies);
      for (const value of cookies) if (value.startsWith(VNEXT_LOCAL_OPERATOR_SESSION_COOKIE_V01 + "=")) cookie = value.split(";")[0]!;
      res.statusCode = response.status; res.end(await response.text());
    } catch { errors++; res.statusCode = 500; res.end('{"error":"fixture_http_failed"}'); }
  }));
  async function http(endpoint: string, body?: unknown, status = 200) {
    const response = await fetch(origin + endpoint, { signal: AbortSignal.timeout(10000), method: body ? "POST" : "GET", headers: { origin, cookie, ...(body ? { "content-type": "application/json" } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });
    for (const value of response.headers.getSetCookie()) if (value.startsWith(VNEXT_LOCAL_OPERATOR_SESSION_COOKIE_V01 + "=")) cookie = value.split(";")[0]!;
    const data = await response.json(); assert.equal(response.status, status, canonical(data)); return data;
  }
  try {
    await new Promise<void>(ok => server.listen(0, "127.0.0.1", ok)); origin = `http://127.0.0.1:${(server.address() as { port: number }).port}`;
    const issued = issueVNextLocalOperatorBootstrapV01(db, { config, clock });
    await http("/api/vnext/operator/session", { action: "bootstrap", bootstrap_token: issued.bootstrap_token });
    const read = await http("/api/vnext/operator/project-continuity");
    assert.equal(read.work_initialization.current_packet.packet_fingerprint, old.integrity.fingerprint);
    if (mode === "readback") {
      assert.equal(old.expires_at, null); assert.equal(old.capability_grant, null);
      if (cumulative) {
        assert.equal(read.work_initialization.revision_eligibility.revision_count, 33);
        await http("/api/vnext/operator/project-continuity", { action: "revise_pre_execution_project_work", workspace_id: config.workspace_id, project_id: config.project_id,
          expected_active_project_id: config.project_id, expected_active_selection_revision: read.work_initialization.active_selection_revision,
          expected_current_packet_id: old.packet_id, expected_current_packet_fingerprint: old.integrity.fingerprint,
          expected_current_lineage_kind: read.work_initialization.current_packet.lineage_kind, ...old.task, goal: nextGoal }, 201);
      }
    }
    else if (mode === "agent") {
      Object.assign(process.env, environment, { AUGNES_RUNTIME_CHILD_ROLE: "ui", AUGNES_RUNTIME_INSTANCE_ID: "disposable-durable", AUGNES_RUNTIME_GENERATION_ID: "generation-1",
        AUGNES_RUNTIME_REPOSITORY_FINGERPRINT: "a".repeat(64), AUGNES_COMPANION_PROXY_TOKEN: "disposable-durable-channel" });
      delete process.env.AUGNES_RECOVERY_MODE;
      globalThis.Date = new Proxy(NativeDate, { construct(target, args) { return Reflect.construct(target, args.length ? args : [at]); }, get(target, key) { return key === "now" ? () => NativeDate.parse(at) : Reflect.get(target, key); } });
      const headers = { "content-type": "application/json", "x-augnes-companion-proxy": "disposable-durable-channel", "x-augnes-runtime-instance": "disposable-durable", "x-augnes-runtime-generation": "generation-1", "x-augnes-runtime-repository": "a".repeat(64) };
      const agent = async (route: (request: Request) => Promise<Response>, endpoint: string, marker: object, body: unknown, status = 200, extra = {}) => {
        const response = await route(new Request(origin + endpoint + "?scope=repository:local", { method: "POST", headers: { host: new URL(origin).host, ...headers, ...marker, ...extra }, body: JSON.stringify(body) }));
        const value = await response.json(); assert.equal(response.status, status, canonical(value)); return value;
      };
      const resumed = await agent(agentResume, "/api/augnes/read/codex-repository-continuity", { "x-augnes-local-readonly": CODEX_REPOSITORY_CONTINUITY_ROUTE_MARKER_V01 }, { repository_root: projectRoot });
      assert.equal(resumed.continuity.snapshot.status, "exact", canonical(resumed));
      if (!cumulative) { assert.equal(resumed.continuity.current_work.currentness, "stale"); assert.equal(resumed.continuity.current_work.start_eligible, false); }
      const input = { action: "preview", repository_root: projectRoot, expected_snapshot_binding: resumed.continuity.snapshot.binding, changes: { goal: nextGoal } };
      const marker = { "x-augnes-local-work-revision": "codex-repository-work-revision-v0.1" }, endpoint = "/api/augnes/repository-work-revision";
      const sources = await agent(agentSources, "/api/augnes/read/codex-repository-work-sources", { "x-augnes-local-readonly": "codex-repository-work-sources-v0.1" }, { repository_root: projectRoot, expected_snapshot_binding: input.expected_snapshot_binding, include_work_definition: true });
      assert.equal(sources.status, "available", canonical(sources));
      const before = db.serialize();
      const preview = await agent(agentRevision, endpoint, marker, input); assert.equal(preview.status, "previewed"); assert(before.equals(db.serialize()));
      const request = { ...input, action: "save", preview_binding: preview.preview_binding };
      await agent(agentRevision, endpoint, marker, request, 403, { "x-augnes-companion-proxy": "wrong-disposable-channel" });
      await agent(agentRevision, endpoint, marker, request, 409, { "x-augnes-runtime-generation": "stale-generation" });
      assert(before.equals(db.serialize()));
      // Each changed current state is authored in its own disposable backup.
      // The agent must reject its old preview without rotating admission state.
      for (const drift of ["selection", "direction", "source"] as const) {
        const file = path.join(root, `${drift}.db`); await db.backup(file);
        const copy = new Database(file), driftEnv = { ...environment, AUGNES_DB_PATH: file };
        process.env.AUGNES_DB_PATH = file;
        try {
          if (drift === "selection") {
            const selected = readActiveProjectSelectionV01(copy, config.workspace_id)!;
            selectActiveProjectV01(copy, { ...config, expected_project_id: config.project_id, expected_revision: selected.selection_revision, now: at });
          } else {
            let body: object, route: (request: Request) => Promise<Response>;
            if (drift === "direction") {
              route = createProjectDirectionHandler({ environment: driftEnv, clock });
              body = { action: "decide", expected_ref: null, content: { purpose: "A different current investigation", criteria: [], constraints: [] }, reason: "A material change after preview", status: "active", proposal_ref: null };
            } else {
              route = createVNextOperatorContextUseReviewHandlerV01({ environment: driftEnv, clock });
              const selected = [...readSelectedWorkSources(old), buildSelectedWorkSourceEntry(config, { source: "New user observation", observed_at: at, provenance: "user_declaration", label: "Unclassified / needs review", text: "Material added after the agent preview." })];
              body = { action: "revise_pre_execution_project_work", workspace_id: config.workspace_id, project_id: config.project_id,
                expected_active_project_id: config.project_id, expected_active_selection_revision: read.work_initialization.active_selection_revision,
                expected_current_packet_id: old.packet_id, expected_current_packet_fingerprint: old.integrity.fingerprint, expected_current_lineage_kind: read.work_initialization.current_packet.lineage_kind,
                ...old.task, selected_source_context: selected, expected_source_comparison: compareSelectedWorkSources(old, selected).fingerprint };
            }
            const response = await route(new Request(origin + `/api/vnext/operator/${drift === "direction" ? `project-direction?project_id=${config.project_id}` : "project-continuity"}`, { method: "POST", headers: { host: new URL(origin).host, origin, cookie, "content-type": "application/json" }, body: JSON.stringify(body) }));
            assert.ok(response.ok, canonical(await response.json()));
          }
          const frozen = copy.serialize(); await agent(agentRevision, endpoint, marker, request, 409); assert(frozen.equals(copy.serialize()));
        } finally { copy.close(); process.env.AUGNES_DB_PATH = config.database_path; }
      }
      console.log(JSON.stringify({ durable_agent_drift: ["selection", "direction", "selected_source"], result: "atomic_refusal" }));
      assert.equal((await agent(agentRevision, endpoint, marker, request)).status, "saved");
      assert.equal((await agent(agentRevision, endpoint, marker, request)).status, "exact_replay");
      await agent(agentRevision, endpoint, marker, { ...request, changes: { goal: "Stale conflicting request" } }, 409);
      globalThis.Date = NativeDate;
    } else {
      const initialization = read.work_initialization;
      const source = mode.startsWith("stateless-") ? `import React from 'react';import{createRoot}from'react-dom/client';import{StatelessSourceReview}from'./components/blank-state/stateless-source-review';createRoot(document.getElementById('root')).render(React.createElement(StatelessSourceReview,{projectId:${JSON.stringify(config.project_id)}}));`
        : `import React from 'react';import{createRoot}from'react-dom/client';import{FirstWorkComposer}from'./components/workbench/semantic-review/first-work-composer';
        const w=${JSON.stringify(initialization)};createRoot(document.getElementById('root')).render(React.createElement(FirstWorkComposer,{initialization:w,busy:false,mode:'revision',initialDefinition:w.current_work,onSave:async(definition,selection)=>{
        const r=await fetch('/api/vnext/operator/project-continuity',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({action:'revise_pre_execution_project_work',workspace_id:w.workspace_id,project_id:w.project_id,expected_active_project_id:w.project_id,expected_active_selection_revision:w.active_selection_revision,expected_current_packet_id:w.current_packet.packet_id,expected_current_packet_fingerprint:w.current_packet.packet_fingerprint,expected_current_lineage_kind:w.current_packet.lineage_kind,...definition,...(selection??{})})});if(!r.ok)throw new Error('save_failed');document.body.dataset.saved='true';}}));`;
      const bundled = await build({ stdin: { contents: source, resolveDir: process.cwd(), loader: "tsx" }, outfile: path.join(root, "app.js"), bundle: true, write: false, platform: "browser", define: { "process.env.NODE_ENV": '"production"' },
        plugins: [{ name: "fixture-navigation", setup(b) { b.onResolve({ filter: /^next\/navigation$/ }, () => ({ path: "fixture-navigation", namespace: "fixture" })); b.onLoad({ filter: /.*/, namespace: "fixture" }, () => ({ contents: "export const useRouter=()=>({refresh(){}});", loader: "js" })); } }] });
      script = bundled.outputFiles.find(f => f.path.endsWith(".js"))!.text; css = bundled.outputFiles.find(f => f.path.endsWith(".css"))?.text ?? "";
      const profile = path.join(root, "chrome"), args = ["--headless=new", "--no-sandbox", "--disable-gpu", "--no-first-run", "--no-default-browser-check", "--disable-background-networking", "--disable-component-update", "--disable-default-apps", "--disable-domain-reliability", "--disable-extensions", "--disable-sync", "--metrics-recording-only", "--no-pings", "--password-store=basic", "--use-mock-keychain", "--host-resolver-rules=MAP * ~NOTFOUND, EXCLUDE 127.0.0.1", "--remote-debugging-address=127.0.0.1", "--remote-debugging-port=0", `--user-data-dir=${profile}`, "about:blank"];
      const sandbox = '(version 1) (allow default) (deny network*) (allow network-inbound (local ip "localhost:*")) (allow network-outbound (remote ip "localhost:*")) (allow network-bind (local ip "localhost:*")) (allow network* (local unix-socket))';
      chrome = registerOwnedChild(owned, spawn("/usr/bin/sandbox-exec", ["-p", sandbox, "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", ...args], { detached: true, stdio: "ignore", env: { ...process.env, OPENAI_API_KEY: "" } }), { label: "durable-work-browser" });
      let port = ""; await until(async () => { try { port = readFileSync(path.join(profile, "DevToolsActivePort"), "utf8").split("\n")[0]!; return !!port; } catch { return false; } }, "chrome");
      const target = await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: "PUT" })).json() as any;
      c = new CDP(target.webSocketDebuggerUrl); await c.open(); const browser = c;
      await c.send("Network.enable"); await c.send("Runtime.enable"); await c.send("Page.enable");
      c.handlers.push(m => { if (m.method === "Runtime.exceptionThrown") errors++; if (m.method === "Network.requestWillBeSent" && /^https?:/u.test(m.params.request.url) && !m.params.request.url.startsWith(origin + "/")) external++; });
      await c.send("Network.setCookie", { name: VNEXT_LOCAL_OPERATOR_SESSION_COOKIE_V01, value: cookie.slice(cookie.indexOf("=") + 1), url: origin, path: VNEXT_LOCAL_OPERATOR_SESSION_COOKIE_PATH_V01, httpOnly: true, sameSite: "Strict" });
      await c.send("Page.navigate", { url: origin });
      if (mode.startsWith("stateless-")) {
        await until(() => browser.eval("!!document.querySelector('[data-stateless-source-review]')"), "saved_review_reader");
        await browser.eval("document.querySelector('[data-stateless-source-review]').open=true;[...document.querySelectorAll('button')].find(e=>e.textContent==='Read saved source reviews').click()");
        await until(() => browser.eval("[...document.querySelectorAll('button')].some(e=>e.textContent==='Resume saved work'&&!e.disabled)"), "resume_without_form_reentry");
        assert.equal(current().packet_id, old.packet_id, "Reading saved work does not refresh it");
        await browser.eval("[...document.querySelectorAll('button')].find(e=>e.textContent==='Resume saved work').click()");
        await until(() => browser.eval("document.body.textContent.includes('Saved work resumed.')"), "resumed");
        assert.equal(await browser.eval("document.querySelector('[aria-label=\"Source-review question\"]').value"), "");
      } else {
        await until(() => browser.eval(cumulative ? "!!document.querySelector('textarea')" : "[...document.querySelectorAll('button')].some(e=>e.textContent.includes('Save revision')&&!e.disabled)"), "editor_available");
        assert.ok(await browser.eval(`document.querySelector('textarea').value===${JSON.stringify(old.task.goal)}`));
        if (cumulative) await browser.eval(`(()=>{const e=document.querySelector('textarea');Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value').set.call(e,${JSON.stringify(nextGoal)});e.dispatchEvent(new Event('input',{bubbles:true}));})()`);
        await until(() => browser.eval("[...document.querySelectorAll('button')].some(e=>e.textContent.includes('Save revision')&&!e.disabled)"), "edited_save_available");
        await browser.eval("[...document.querySelectorAll('button')].find(e=>e.textContent.includes('Save revision')).click()");
        await until(() => browser.eval("document.body.dataset.saved==='true'"), "saved");
      }
      assert.equal(saves, 1);
    }
    assert.equal(current().expires_at, null); assert.equal(current().capability_grant, null); assert.deepEqual(current().task, { ...old.task, goal: nextGoal });
    assert.deepEqual(readSelectedWorkSources(current()), readSelectedWorkSources(old));
    assert.deepEqual(db.prepare("SELECT * FROM vnext_core_records ORDER BY rowid").all().slice(0, rows.length), rows);
    assert.equal(authority(), beforeAuthority); assert.equal(validateRecoveryCanonicalDatabaseV01(db).status, "valid");
    assert.equal(external, 0); assert.equal(errors, 0); assert.equal(guard.attempts.length, 0);
    if (cumulative) {
      const result = await http("/api/vnext/operator/project-continuity");
      assert.equal(result.work_initialization.revision_eligibility.revision_count, mode === "readback" ? 34 : 33);
      console.log(JSON.stringify({ cumulative_surface: mode, revision_count: result.work_initialization.revision_eligibility.revision_count, fresh_process: true, authority_unchanged: true, external_requests: external }));
    }
    if (!cumulative) console.log(JSON.stringify({ durable_surface: mode, fresh_process: process.pid, days_elapsed: mode === "readback" ? 8 : 4, unchanged_task: true, authority_unchanged: true, historical_rows_unchanged: true, provider_calls: 0 }));
  } finally {
    globalThis.Date = NativeDate;
    try { if (cookie) { await http("/api/vnext/operator/session", { action: "logout" }); await http("/api/vnext/operator/session", undefined, 401); } }
    finally { c?.close(); if (chrome) await terminateOwnedProcessTree(chrome); await closeTrackedServer(server); db.close(); guard.restore(); rmSync(root, { recursive: true, force: true });
      for (const key of Object.keys(process.env)) if (!(key in envBefore)) delete process.env[key]; Object.assign(process.env, envBefore); assert.equal(owned.size, 0); }
  }
}
void main().catch(error => { console.error(error); process.exitCode = 1; });
