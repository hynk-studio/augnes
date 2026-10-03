// Focused real-component/HTTP-authoring check. The caller supplies an ordinary
// disposable fixture copy, never the retained candidate. Only Next navigation
// refresh is stubbed; review, comparison, preview, writer and cookies are real.
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
import { createStatelessSourceReviewHandler } from "../app/api/vnext/operator/stateless-source-review/route";
import { issueVNextLocalOperatorBootstrapV01, consumeVNextLocalOperatorBootstrapV01, readVNextLocalOperatorCredentialFromRequestV01,
  revokeVNextLocalOperatorSessionByCredentialV01, VNEXT_LOCAL_OPERATOR_SESSION_COOKIE_V01, VNEXT_LOCAL_OPERATOR_SESSION_COOKIE_PATH_V01 } from "../lib/vnext/runtime/local-operator-session";
import { readProjectAutomationControlV01 } from "../lib/vnext/persistence/project-control-store";
import { readProjectWorkInitializationV01 } from "../lib/vnext/runtime/project-work-initialization";

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
  const input = JSON.parse(readFileSync(process.argv[2]!, "utf8")), { config, at, request } = input;
  assert.ok(config.database_path.includes("terminal-browser-copy"), "disposable_copy_required");
  const root = path.join(path.dirname(config.database_path), "terminal-browser-owned"); mkdirSync(root);
  const guard = installZeroNetworkGuard({ allowLoopback: true }), db = new Database(config.database_path), clock = { now: () => at };
  const owned = new Set(); let child: ReturnType<typeof registerOwnedChild> | undefined, c: CDP | undefined, cookie = "", origin = "";
  let external = 0, failures = 0; const actions: string[] = [], responses: Array<{ status: number; error: string | null }> = [];
  const route = createStatelessSourceReviewHandler({ clock, environment: { NODE_ENV: "test", AUGNES_VNEXT_OPERATOR_PILOT_ENABLED: "1", AUGNES_VNEXT_OPERATOR_WORKSPACE_ID: config.workspace_id,
    AUGNES_VNEXT_OPERATOR_PROJECT_ID: config.project_id, AUGNES_VNEXT_OPERATOR_ID: config.operator_id, AUGNES_DB_PATH: config.database_path, OPENAI_API_KEY: "" } });
  const endpoint = `/api/vnext/operator/stateless-source-review?project_id=${config.project_id}`;
  const counts = () => [db.prepare("SELECT COUNT(*) n FROM autonomy_runs").get(), db.prepare("SELECT COUNT(*) n FROM vnext_core_records WHERE record_kind='capability_grant'").get()];
  const before = counts(); let script = "";
  const server = trackServerConnections(createServer(async (req, res) => {
    try {
      if (req.url === "/app.js") { res.setHeader("Content-Type", "application/javascript"); res.end(script); return; }
      if (!req.url?.startsWith("/api/")) { res.setHeader("Content-Type", "text/html"); res.end('<div id="root"></div><script src="/app.js"></script>'); return; }
      const chunks: Buffer[] = []; for await (const chunk of req) chunks.push(Buffer.from(chunk)); const body = Buffer.concat(chunks).toString();
      if (body) actions.push(JSON.parse(body).action);
      const response = await route(new Request(origin + req.url, { method: req.method, headers: req.headers as Record<string, string>, ...(body ? { body } : {}) }));
      response.headers.forEach((v, k) => res.setHeader(k, v));
      if (response.headers.get("set-cookie")) cookie = response.headers.get("set-cookie")!.split(";")[0]!;
      const text = await response.text(); responses.push({ status: response.status, error: JSON.parse(text).error ?? null });
      res.statusCode = response.status; res.end(text);
    } catch { failures++; res.statusCode = 500; res.end("fixture_http_failed"); }
  }));
  try {
    script = (await build({ stdin: { contents: `import React from 'react'; import {createRoot} from 'react-dom/client'; import {StatelessSourceReview} from './components/blank-state/stateless-source-review'; createRoot(document.getElementById('root')).render(React.createElement(StatelessSourceReview,{projectId:${JSON.stringify(config.project_id)}}));`, resolveDir: process.cwd(), loader: "tsx" },
      bundle: true, write: false, platform: "browser", define: { "process.env.NODE_ENV": '"production"' }, plugins: [{ name: "navigation-only", setup(b) { b.onResolve({ filter: /^next\/navigation$/ }, () => ({ path: "navigation", namespace: "test" })); b.onLoad({ filter: /.*/, namespace: "test" }, () => ({ contents: "export const useRouter = () => ({refresh(){}});" })); } }] })).outputFiles[0]!.text;
    await new Promise<void>(ok => server.listen(0, "127.0.0.1", ok)); origin = `http://127.0.0.1:${(server.address() as { port: number }).port}`;
    const bootstrap = issueVNextLocalOperatorBootstrapV01(db, { config, clock }), session = consumeVNextLocalOperatorBootstrapV01(db, { config, clock, bootstrap_token: bootstrap.bootstrap_token });
    cookie = `${VNEXT_LOCAL_OPERATOR_SESSION_COOKIE_V01}=${session.cookie_value}`;
    // The outer macOS loopback-only sandbox owns every child. Chrome cannot
    // install a second renderer sandbox inside it; this is an isolated profile.
    const profile = path.join(root, "chrome"), args = ["--headless=new", "--no-sandbox", "--disable-gpu", "--no-first-run", "--no-default-browser-check", "--disable-background-networking", "--disable-component-update", "--disable-default-apps", "--disable-domain-reliability", "--disable-extensions", "--disable-sync", "--metrics-recording-only", "--no-pings", "--password-store=basic", "--use-mock-keychain", "--host-resolver-rules=MAP * ~NOTFOUND, EXCLUDE 127.0.0.1", "--remote-debugging-address=127.0.0.1", "--remote-debugging-port=0", `--user-data-dir=${profile}`, "about:blank"];
    const sandbox = '(version 1) (allow default) (deny network*) (allow network-inbound (local ip "localhost:*")) (allow network-outbound (remote ip "localhost:*")) (allow network-bind (local ip "localhost:*")) (allow network* (local unix-socket))';
    child = registerOwnedChild(owned, spawn("/usr/bin/sandbox-exec", ["-p", sandbox, "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", ...args], { stdio: ["ignore", "ignore", "pipe"], detached: true, env: { ...process.env, OPENAI_API_KEY: "" } }), { label: "stateless-terminal-browser" });
    // Startup only, before the browser receives its local session cookie.
    let startup = ""; const startupLog = (b: Buffer) => { startup = (startup + b.toString()).slice(-2000); }; child.child.stderr!.on("data", startupLog);
    let port = ""; await until(async () => { if (child!.exited) throw new Error(`browser_start_failed:${startup}`); try { port = readFileSync(path.join(profile, "DevToolsActivePort"), "utf8").split("\n")[0]!; return !!port; } catch { return false; } }, "chrome");
    child.child.stderr!.off("data", startupLog); child.child.stderr!.resume(); startup = "";
    const target = await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: "PUT" })).json() as any;
    c = new CDP(target.webSocketDebuggerUrl); await c.open(); const browser = c;
    await c.send("Network.enable"); await c.send("Runtime.enable"); await c.send("Page.enable");
    c.handlers.push(m => { if (m.method === "Runtime.exceptionThrown") failures++; if (m.method === "Fetch.requestPaused") { const local = m.params.request.url.startsWith(origin + "/"); if (!local) external++; void browser.send(local ? "Fetch.continueRequest" : "Fetch.failRequest", { requestId: m.params.requestId, ...(local ? {} : { errorReason: "BlockedByClient" }) }).catch(() => { failures++; }); } });
    await c.send("Fetch.enable", { patterns: [{ urlPattern: "*", requestStage: "Request" }] });
    await c.send("Network.setCookie", { name: VNEXT_LOCAL_OPERATOR_SESSION_COOKIE_V01, value: session.cookie_value, url: origin, path: VNEXT_LOCAL_OPERATOR_SESSION_COOKIE_PATH_V01, httpOnly: true, sameSite: "Strict" });
    await c.send("Page.navigate", { url: origin });
    const click = async (text: string) => { await until(() => browser.eval(`[...document.querySelectorAll('button')].some(e=>e.textContent===${JSON.stringify(text)}&&!e.disabled)`), text); await browser.eval(`[...document.querySelectorAll('button')].find(e=>e.textContent===${JSON.stringify(text)}).click()`); };
    const set = (selector: string, value: string) => browser.eval(`(()=>{const e=document.querySelector(${JSON.stringify(selector)}); Object.getOwnPropertyDescriptor(e.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:HTMLInputElement.prototype,'value').set.call(e,${JSON.stringify(value)});e.dispatchEvent(new Event('input',{bubbles:true}));})()`);
    await until(() => browser.eval("!!document.querySelector('[data-stateless-source-review]')"), "component");
    await browser.eval("document.querySelector('[data-stateless-source-review]').open=true");
    await click("Read saved source reviews"); await until(() => browser.eval("!!document.querySelector('[data-stateless-terminal-authorship]')"), "review");
    await set('[aria-label="Source-review question"]', request.material.question); await set('[aria-label="Review file 1"]', request.material.files[0].path);
    await set('input[type="number"]', String(request.material.files[0].start_line));
    await set('label:has(input[type="number"]) + label input', String(request.material.files[0].end_line));
    await browser.eval("document.querySelector('[data-stateless-terminal-authorship]').open=true");
    await set('[aria-label="New work goal"]', request.definition.goal); await set('[aria-label="New work success criteria"]', request.definition.success_criteria.join("\n")); await set('[aria-label="New work non-goals"]', request.definition.non_goals.join("\n"));
    await click("Compare selected context for new work"); await until(() => browser.eval("!!document.querySelector('input[aria-label^=\"Omission reason\"]')"), "comparison");
    const labels = await c.eval("[...document.querySelectorAll('input[aria-label^=\"Omission reason\"]')].map(e=>e.getAttribute('aria-label'))");
    for (const label of labels) await set(`[aria-label=${JSON.stringify(label)}]`, "Explicit new source question; prior inventory remains historical.");
    await click("Preview linked authorship"); await click("Author new linked work");
    try { await until(() => browser.eval("document.body.innerText.includes('New linked work saved with no execution permission.')"), "saved"); }
    catch { throw new Error(`browser_authorship_failed:${JSON.stringify(responses)}`); }
    assert.equal(readProjectWorkInitializationV01(db, config).current_packet?.lineage_kind, "stateless_review_terminal_successor");
    assert.deepEqual(counts(), before); assert.equal(readProjectAutomationControlV01(db, config)!.enabled, false);
    assert.deepEqual(actions, ["compare_terminal_sources", "preview_terminal_work", "author_terminal_work"]); assert.equal(external, 0); assert.equal(failures, 0); assert.equal(guard.attempts.length, 0);
  } finally {
    try {
      if (cookie) { const credential = readVNextLocalOperatorCredentialFromRequestV01(new Request(origin, { headers: { cookie } })); assert.ok(revokeVNextLocalOperatorSessionByCredentialV01(db, { config, credential, clock }).revoked_at);
        assert.equal((await route(new Request(origin + endpoint, { headers: { host: new URL(origin).host, origin, cookie } }))).status, 401); }
    } finally { c?.close(); try { if (child) await terminateOwnedProcessTree(child); } finally { await closeTrackedServer(server); db.close(); guard.restore(); rmSync(root, { recursive: true, force: true }); } }
  }
  console.log(JSON.stringify({ browser: "actual_review_component_and_authenticated_http", actions, provider_calls: 0, grants_created: 0, runs_created: 0, logout_read: 401, cleanup: "complete" }));
}
void main().catch(e => { console.error(e); process.exitCode = 1; });
