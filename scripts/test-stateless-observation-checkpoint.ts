/** Ordinary HTTP checkpoint + real process replacement. Only provider transport is scripted. */
import assert from "node:assert/strict";
import { createServer, request as httpRequest } from "node:http";
import { spawn } from "node:child_process";
import { readFileSync, writeFileSync, existsSync, rmSync, appendFileSync } from "node:fs";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import Database from "better-sqlite3";
import { createStatelessSourceReviewHandler } from "../app/api/vnext/operator/stateless-source-review/route";
import { createVNextLocalOperatorSessionHandlersV01 } from "../app/api/vnext/operator/session/route";
import { issueVNextLocalOperatorBootstrapV01, VNEXT_LOCAL_OPERATOR_SESSION_COOKIE_V01, type VNextLocalOperatorPilotConfigV01 } from "../lib/vnext/runtime/local-operator-session";
import { createOpenAIResponsesAdapterV01 } from "../lib/vnext/model-gateway/openai/responses-adapter";
import { installZeroNetworkGuard } from "./test-harness-zero-network-guard.mjs";
import { registerOwnedChild, terminateOwnedProcessTree, trackServerConnections, closeTrackedServer } from "./test-harness-process-lifecycle.mjs";

type Input = { config: VNextLocalOperatorPilotConfigV01; ready: string; calls: string };
async function serve(filename: string) {
  assert.equal(process.env.OPENAI_API_KEY, "");
  const { config, ready, calls } = JSON.parse(readFileSync(filename, "utf8")) as Input;
  const guard = installZeroNetworkGuard({ allowLoopback: true });
  const environment = { NODE_ENV: "test" as const, OPENAI_API_KEY: "", AUGNES_VNEXT_OPERATOR_PILOT_ENABLED: "1", AUGNES_VNEXT_OPERATOR_WORKSPACE_ID: config.workspace_id,
    AUGNES_VNEXT_OPERATOR_PROJECT_ID: config.project_id, AUGNES_VNEXT_OPERATOR_ID: config.operator_id, AUGNES_DB_PATH: config.database_path };
  const adapter = createOpenAIResponsesAdapterV01({ environment: { OPENAI_API_KEY: "scripted-not-a-key", OPENAI_MODEL: "gpt-6.1-sol" }, transport: async req => {
    const request = JSON.parse(req.body), input = JSON.parse(JSON.parse(request.input[1].content[0].text).message);
    assert.deepEqual(request.reasoning, { effort: "low", mode: "standard" });
    appendFileSync(calls, JSON.stringify({ pid: process.pid, stage: input.stage, input, serialized_bytes: Buffer.byteLength(req.body) }) + "\n");
    return { ok: true, status: 200, json: async () => ({ status: "completed", output: [{ type: "message", content: [{ type: "output_text", text: JSON.stringify({ recommendations: [{
      title: "Bounded source review", rationale: input.stage === "choose" ? "Inspect the selected range to answer the bounded question." : "Use the saved excerpt; no wider conclusion follows from this bounded material.",
      tool_name: input.stage === "choose" ? "read_selected_sources" : "use_observation", priority: "now", grounded_state_keys: [input.stage === "choose" ? input.review_ref : input.observation_fingerprint],
    }] }) }] }], usage: { input_tokens: 100, output_tokens: 80, total_tokens: 180, output_tokens_details: { reasoning_tokens: 30 } } }) };
  } });
  const route = createStatelessSourceReviewHandler({ environment, adapter }), sessions = createVNextLocalOperatorSessionHandlersV01({ environment });
  let origin = "";
  const server = trackServerConnections(createServer(async (req, res) => {
    try {
      const chunks: Buffer[] = []; let bytes = 0;
      for await (const chunk of req) { bytes += chunk.length; assert.ok(bytes <= 65536); chunks.push(Buffer.from(chunk)); }
      const body = Buffer.concat(chunks).toString(), method = req.method ?? "GET";
      const request = new Request(origin + req.url, { method, headers: req.headers as Record<string, string>, ...(body ? { body } : {}) });
      const response = req.url === "/api/vnext/operator/session" ? await sessions[method === "POST" ? "POST" : "GET"](request) : await route(request);
      response.headers.forEach((v, k) => { if (k !== "set-cookie") res.setHeader(k, v); });
      const cookies = response.headers.getSetCookie(); if (cookies.length) res.setHeader("Set-Cookie", cookies);
      res.writeHead(response.status); res.end(await response.text());
    } catch { res.writeHead(500); res.end(JSON.stringify({ error: "checkpoint_fixture_http_failed" })); }
  }));
  let closing = false;
  const close = async () => { if (closing) return; closing = true; await closeTrackedServer(server); assert.equal(guard.attempts.length, 0); guard.restore(); process.exit(0); };
  process.on("SIGTERM", () => { void close(); }); process.on("SIGINT", () => { void close(); });
  await new Promise<void>(ok => server.listen(0, "127.0.0.1", ok)); origin = `http://127.0.0.1:${(server.address() as { port: number }).port}`;
  writeFileSync(ready, JSON.stringify({ origin, pid: process.pid }));
}

export async function checkpointProcessReplacement(config: VNextLocalOperatorPilotConfigV01, projectRoot: string) {
  const dir = path.dirname(config.database_path), calls = path.join(dir, "checkpoint-calls.jsonl"), owned = new Set();
  let active: ReturnType<typeof registerOwnedChild> | undefined, cookie = "", origin = "";
  const endpoint = `/api/vnext/operator/stateless-source-review?project_id=${config.project_id}`;
  async function call(route: string, body?: unknown, expected = 200) {
    const response = await new Promise<{ status: number; data: any; cookies: string[] }>((ok, no) => {
      const request = httpRequest(origin + route, { method: body ? "POST" : "GET", headers: { Origin: origin, "Sec-Fetch-Site": "same-origin", ...(cookie ? { Cookie: cookie } : {}), ...(body ? { "Content-Type": "application/json" } : {}) } }, res => {
        const chunks: Buffer[] = []; res.on("data", b => chunks.push(Buffer.from(b))); res.on("end", () => { try { ok({ status: res.statusCode!, data: JSON.parse(Buffer.concat(chunks).toString()), cookies: res.headers["set-cookie"] ?? [] }); } catch (e) { no(e); } });
      });
      request.setTimeout(10000, () => request.destroy(new Error("checkpoint_http_timeout"))); request.on("error", no); request.end(body ? JSON.stringify(body) : undefined);
    });
    for (const value of response.cookies) if (value.startsWith(VNEXT_LOCAL_OPERATOR_SESSION_COOKIE_V01 + "=")) cookie = value.split(";")[0]!;
    assert.equal(response.status, expected, JSON.stringify(response.data)); return response;
  }
  async function request(route: string, body?: unknown, expected = 200) {
    const result = await call(route, body, expected);
    return result.data;
  }
  async function start(index: number) {
    const ready = path.join(dir, `checkpoint-ready-${index}.json`), input = path.join(dir, `checkpoint-runtime-${index}.json`);
    writeFileSync(input, JSON.stringify({ config, ready, calls }));
    active = registerOwnedChild(owned, spawn(process.execPath, ["--import", "tsx", "scripts/test-stateless-observation-checkpoint.ts", "--serve", input], { cwd: process.cwd(), env: { ...process.env, OPENAI_API_KEY: "" }, detached: true, stdio: ["ignore", "ignore", "pipe"] }), { label: "checkpoint-scripted-http-runtime" });
    let error = ""; active.child.stderr?.on("data", (b: Buffer) => { error = (error + b).slice(-2000); });
    const until = Date.now() + 10000; while (!existsSync(ready) && Date.now() < until && !active.exited) await delay(25);
    assert.ok(existsSync(ready), error || "checkpoint_runtime_unavailable"); const state = JSON.parse(readFileSync(ready, "utf8")); origin = state.origin; cookie = "";
    const db = new Database(config.database_path); let token = "";
    try { token = issueVNextLocalOperatorBootstrapV01(db, { config }).bootstrap_token; } finally { db.close(); }
    try { await request("/api/vnext/operator/session", { action: "bootstrap", bootstrap_token: token }); } finally { token = ""; }
    assert.ok(cookie.startsWith(VNEXT_LOCAL_OPERATOR_SESSION_COOKIE_V01 + "=")); return state;
  }
  async function logout() {
    const latest = cookie; await request("/api/vnext/operator/session", { action: "logout" }); cookie = latest;
    const denied = await request("/api/vnext/operator/session", undefined, 401); assert.equal(denied.error_code, "operator_session_revoked"); cookie = "";
  }
  try {
    const first = await start(1), preview = await request(endpoint, { action: "preview", pause_after_observation: true, pricing: { input_nano_usd_per_byte: 1000, output_nano_usd_per_token: 1000, maximum_total_nano_usd: 200000000, source_version: "scripted-checkpoint" } });
    const saved = (await request(endpoint, { action: "authorize_and_run", authorization: preview.authorization })).result;
    assert.equal(saved.stage, "observation_saved"); assert.deepEqual(saved.run.steps.map((s: any) => s.status), ["completed", "completed", "planned"]);
    assert.equal(saved.run.steps[2].output.generation, undefined); assert.ok(saved.observation_checkpoint); await logout();
    await terminateOwnedProcessTree(active!); assert.equal(active!.closed, true); active = undefined;
    rmSync(path.join(projectRoot, "entry.ts")); // The new process must use persisted observation bytes.
    const second = await start(2); assert.notEqual(first.pid, second.pid);
    const read = await request(endpoint), restored = read.reviews.find((r: any) => r.run.run_id === saved.run.run_id);
    assert.deepEqual(restored.run, saved.run); assert.deepEqual(restored.observation_checkpoint, saved.observation_checkpoint);
    const final = (await request(endpoint, { action: "continue", run_id: saved.run.run_id, checkpoint: restored.observation_checkpoint })).result;
    assert.equal(final.run.status, "completed"); assert.equal(final.run.run_id, saved.run.run_id);
    assert.deepEqual(final.run.steps.slice(0, 2), saved.run.steps.slice(0, 2)); assert.equal(final.run.started_at, saved.run.started_at);
    assert.equal(final.run.metadata.stateless_review.grant_id, saved.run.metadata.stateless_review.grant_id);
    assert.equal(final.run.metadata.stateless_review.grant_fingerprint, saved.run.metadata.stateless_review.grant_fingerprint);
    await request(endpoint, { action: "continue", run_id: saved.run.run_id, checkpoint: saved.observation_checkpoint }, 409);
    await logout();
    const rows = readFileSync(calls, "utf8").trim().split("\n").map(l => JSON.parse(l)); assert.deepEqual(rows.map(r => r.stage), ["choose", "conclude"]);
    assert.notEqual(rows[0].pid, rows[1].pid); assert.deepEqual(rows[1].input.observation, saved.run.steps[1].output.observation);
    assert.equal(rows[1].input.observation_fingerprint, saved.observation_checkpoint.observation_fingerprint);
    console.log(JSON.stringify({ ordinary_http_checkpoint: true, real_process_replacement: true, fresh_session: true, model_calls: 2, completed_stage_replay: false, source_unavailable_after_observation: true, original_clock_and_grant: true, logout: 401 }));
  } finally { if (active) await terminateOwnedProcessTree(active); assert.equal(owned.size, 0); }
}
if (process.argv[2] === "--serve") void serve(process.argv[3]!).catch(e => { console.error(e); process.exitCode = 1; });
