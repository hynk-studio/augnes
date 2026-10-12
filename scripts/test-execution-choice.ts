// Exposed deterministic product exercise; not an actual model or comparison.
import assert from "node:assert/strict";
import { createHash, randomBytes } from "node:crypto";
import { createServer } from "node:http";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync, copyFileSync, existsSync, realpathSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import Database from "better-sqlite3";
import { applyCanonicalDatabaseMigrations } from "./canonical-database-migrations.mjs";
import { trackServerConnections, closeTrackedServer } from "./test-harness-process-lifecycle.mjs";
import { runCanonicalChild, canonicalChildAcceptanceFailure } from "./canonical-child-runner.mjs";
import { installZeroNetworkGuard } from "./test-harness-zero-network-guard.mjs";
import { ordinaryExperienceUse } from "./companion-experience-use.mjs";
import { POST as resumeRoute } from "../app/api/augnes/read/codex-repository-continuity/route";
import { POST as sourcesRoute } from "../app/api/augnes/read/codex-repository-work-sources/route";
import { POST as writerRoute } from "../app/api/augnes/repository-work-revision/route";
import { POST as reviewRoute } from "../app/api/augnes/review/route";
import { handleMessageV01, selectCompanionForReadonlyRouteV01, readRepositoryWorkSourcesV01 } from "../plugins/augnes-operator/mcp/companion-proxy.mjs";
import { createRequestBoundReviewAdapter } from "../plugins/augnes-operator/mcp/request-bound-review.mjs";
import { EXECUTION_CHOICE_TOOL, prepareExecutionChoice } from "../plugins/augnes-operator/mcp/execution-choice.mjs";
import { REVIEW_MARKER, digest, callReview } from "../plugins/augnes-operator/mcp/review-connection.mjs";
import { getOrCreateDefaultWorkspaceIdentityV01, getOrCreateCanonicalProjectForLocalRootV01, normalizeLocalProjectRootRefV01 } from "../lib/vnext/persistence/project-identity-registry";
import { readActiveProjectSelectionV01 } from "../lib/vnext/persistence/project-lifecycle-registry";

const started = Date.now(), directory = realpathSync(mkdtempSync(path.join(tmpdir(), "ag-choice-")));
const exportDirectory = process.argv[2];
assert(!exportDirectory || (path.isAbsolute(exportDirectory) && !existsSync(exportDirectory)));
const dbPath = path.join(directory, "fixture.db"), db = new Database(dbPath);
const oldEnv = { ...process.env }, guard = installZeroNetworkGuard({ allowLoopback: true });
const hash = (v: string | Buffer) => `sha256:${createHash("sha256").update(v).digest("hex")}`;
const fixture = path.join(process.cwd(), "scripts/fixtures/experience-use");
const inputBytes = readFileSync(path.join(fixture, "b.json"));
const instance = "choice-fixture", generation = "generation-1", repository = "e".repeat(64), token = randomBytes(32).toString("base64url");
const trace: any[] = [], phases: Record<string, number> = {}, errors: string[] = [], artifacts: string[] = [];
let origin = "", requestId = 0, failSave = false, phaseStart = started;
const phase = (name: string) => { const now = Date.now(); phases[name] = now - phaseStart; phaseStart = now; console.log(JSON.stringify({ phase: name, duration_ms: phases[name] })); };
const routes: Record<string, (r: Request) => Promise<Response>> = {
  "/api/augnes/read/codex-repository-continuity": resumeRoute,
  "/api/augnes/read/codex-repository-work-sources": sourcesRoute,
  "/api/augnes/repository-work-revision": writerRoute, "/api/augnes/review": reviewRoute,
};
const prepare = Database.prototype.prepare;
const server = trackServerConnections(createServer(async (req, res) => {
  try {
    const url = new URL(req.url!, origin);
    if (["/healthz", "/api/healthz"].includes(url.pathname)) {
      res.setHeader("content-type", "application/json");
      res.end(JSON.stringify({ ok: true, name: "augnes-console", service: "augnes-ui", status: "ready", mode: "http", live_core_status: "ready", recovery_mode: false,
        runtime_instance_id: instance, runtime_generation_id: generation, runtime_repository_fingerprint: repository })); return;
    }
    const handler = routes[url.pathname]; if (!handler) { res.writeHead(404).end(); return; }
    const chunks = []; for await (const chunk of req) chunks.push(Buffer.from(chunk));
    const body = Buffer.concat(chunks).toString(), input = JSON.parse(body || "{}"), before = db.serialize();
    if (failSave && url.pathname === "/api/augnes/repository-work-revision" && input.action === "save") {
      Database.prototype.prepare = function (this: Database.Database, sql: string) {
        if (/INSERT INTO vnext_core_records/i.test(sql)) throw new Error("fixture_atomic_save_failure");
        return prepare.call(this, sql);
      } as typeof prepare;
    }
    let response;
    try { response = await handler(new Request(url, { method: req.method, headers: req.headers as Record<string, string>, ...(body ? { body } : {}) })); }
    finally { Database.prototype.prepare = prepare; }
    if (url.pathname.includes("/read/") || input.action === "preview" || response.status >= 400 ||
        (url.pathname.endsWith("/review") && ["connections", "inspect", "list", "prepare_use"].includes(input.action))) {
      assert(before.equals(db.serialize()), "read/preview/refusal must preserve database bytes");
    }
    response.headers.forEach((v, k) => res.setHeader(k, v)); res.writeHead(response.status).end(await response.text());
  } catch (error) { errors.push(String(error)); res.writeHead(500).end('{"fixture_error":true}'); }
}));
async function raw(name: string, args: object): Promise<any> {
  const reply: any = await handleMessageV01({ jsonrpc: "2.0", id: ++requestId, method: "tools/call", params: { name, arguments: args } });
  trace.push({ name, args, result: reply.result?.structuredContent ?? reply.error }); return reply;
}
async function call(name: string, args: object): Promise<any> {
  const reply = await raw(name, args); assert(!reply.error && !reply.result?.isError, JSON.stringify(reply)); return reply.result.structuredContent;
}
const note = (source: string, text: string, provenance = "imported_unverified") => ({ source, text, provenance, observed_at: null, label: "Next check" });
const burden = (execution: string) => ({ preparation: "small", waiting: "unknown", execution, coordination: "small", integration: "small", switching: "unknown" });
function judgment(connection?: string) {
  return { present: "Current worker", alternatives: [
    { arrangement: "Current worker", benefit: "Direct rational sum is sufficient", burden: burden("manual sum") },
    { arrangement: connection ? "Worker plus reviewer" : "Existing normalizer", benefit: connection ? "Check failed-attempt population" : "Reuse exact v1 arithmetic", burden: burden("unknown"), ...(connection ? { review_connection: connection } : {}) },
  ], recommended: connection ? "Worker plus reviewer" : "Existing normalizer", chosen: connection ? "Worker plus reviewer" : "Current worker",
    expectation: "Exact all-attempt total, with failed time retained", uncertainty: "No comparative benefit measured", horizon: new Date(Date.now() + 3600000).toISOString(), reconsider_when: "Version, units, goal or response availability changes" };
}
async function choice(root: string, action: string, values: object = {}, refuse = false) {
  const resumed = await call("augnes_resume_repository", { repositoryRoot: root });
  const args = { action, repositoryRoot: root, expectedSnapshotBinding: resumed.continuity.snapshot.binding, ...values };
  if (refuse) return (await raw(EXECUTION_CHOICE_TOOL, args)).result.structuredContent;
  return call(EXECUTION_CHOICE_TOOL, args);
}
async function savePrepared(prepared: any) {
  const args = prepared.revision_arguments;
  const preview = await call(prepared.revision_tool, args); assert.equal(preview.status, "previewed");
  return call("augnes_save_repository_work_revision", { ...args, previewBinding: preview.preview_binding });
}
async function child(label: string, args: string[], cwd = process.cwd(), env: Record<string, string | undefined> = { PATH: path.dirname(process.execPath) }) {
  let out = "", err = "";
  const result = await runCanonicalChild({ suite: "execution-choice", label, command: process.execPath, args, cwd, env,
    timeoutMs: 10_000, heartbeatMs: 0, log: () => {}, resourceOwner: undefined,
    stdout: { write(c: any) { out += c; return true; } } as typeof process.stdout,
    stderr: { write(c: any) { err += c; return true; } } as typeof process.stderr });
  assert.equal(canonicalChildAcceptanceFailure(result, { suite: "execution-choice", timeoutMs: 10_000, requireNaturalExit: true }), null, err);
  trace.push({ child: label, duration_ms: result.duration_ms, cleanup_completed: result.cleanup_completed, remaining_owned_processes: result.remaining_owned_processes });
  return JSON.parse(out);
}
function deliverAsset(root: string) {
  const worker = path.join(root, "worker"); mkdirSync(worker);
  const files = ["normalize-v1.mjs", "process-events.mjs"].map(name => {
    const bytes = readFileSync(path.join(fixture, name)); copyFileSync(path.join(fixture, name), path.join(worker, name));
    return { name, bytes: bytes.length, sha256: hash(bytes) };
  });
  writeFileSync(path.join(worker, "assets.json"), JSON.stringify({ files, identity: hash(JSON.stringify(files)) }));
  writeFileSync(path.join(worker, "b.json"), inputBytes);
  return hash(JSON.stringify(files));
}
async function output(root: string, mode: string) {
  const worker = path.join(root, "worker");
  const observed = await child("actual-downstream-calculation", [path.join(worker, "process-events.mjs"), mode, "v1", "b.json", "audit.json"], worker);
  assert(observed.imported.every((p: string) => path.dirname(p) === worker));
  const bytes = readFileSync(path.join(worker, "audit.json")), result = JSON.parse(bytes.toString());
  const expected = JSON.parse(readFileSync(path.join(fixture, "evaluator.json"), "utf8")).b;
  for (const [key, value] of Object.entries(expected)) assert.deepEqual(result[key], value);
  assert.equal(observed.output_sha256, hash(bytes)); artifacts.push(path.join(worker, "audit.json"));
  return note("note-ref:audit-output", JSON.stringify({ output: result, file_sha256: hash(bytes), check: "independent expected fields passed" }));
}

async function main() {
  db.pragma("foreign_keys = ON"); db.pragma("journal_mode = WAL"); applyCanonicalDatabaseMigrations(db);
  const workspace = getOrCreateDefaultWorkspaceIdentityV01(db);
  const selection = JSON.stringify(readActiveProjectSelectionV01(db, workspace.workspace_id));
  const projects = ["direct", "participation", "changed", "unavailable", "asset"].map(label => {
    const root = path.join(directory, label); mkdirSync(root);
    const p = getOrCreateCanonicalProjectForLocalRootV01(db, { workspace_id: workspace.workspace_id, local_root: normalizeLocalProjectRootRefV01(root, { base_path: directory }), display_name: label });
    return { root, scope: { workspace_id: workspace.workspace_id, project_id: p.project.project_id }, api: ordinaryExperienceUse(call, root) };
  });
  Object.assign(process.env, { AUGNES_DB_PATH: dbPath, AUGNES_RUNTIME_CHILD_ROLE: "ui", AUGNES_RUNTIME_INSTANCE_ID: instance,
    AUGNES_RUNTIME_GENERATION_ID: generation, AUGNES_RUNTIME_REPOSITORY_FINGERPRINT: repository, AUGNES_COMPANION_PROXY_TOKEN: token });
  delete process.env.AUGNES_RECOVERY_MODE;
  await new Promise<void>(resolve => server.listen(0, "127.0.0.1", resolve));
  const port = (server.address() as { port: number }).port; origin = `http://127.0.0.1:${port}`;
  const manifest = { schema_version: 2, contract: "augnes-local-runtime-supervisor-v1", generation_version: 1, generation_id: generation, instance_id: instance,
    repository_fingerprint: repository, supervisor_pid: process.pid, lifecycle_state: "ready", database_state: "ready", effective_url: origin, ui_port: port, bridge_port: port,
    children: ["ui", "bridge"].map(role => ({ role, pid: process.pid, port, state: "ready" })) };
  writeFileSync(path.join(directory, "runtime.json"), JSON.stringify(manifest));
  writeFileSync(path.join(directory, "companion-access.json"), JSON.stringify({ ...manifest, access_version: "augnes-companion-proxy-access.v0.1", proxy_token: token }), { mode: 0o600 });
  Object.assign(process.env, { AUGNES_COMPANION_RUNTIME_MANIFEST: path.join(directory, "runtime.json"), AUGNES_COMPANION_TEST_MODE: "1" });
  const connections = projects.map(p => ({ id: `review:${randomBytes(16).toString("hex")}`, project_key: digest({ purpose: "codex-current-continuity-public-project-key.v0.1", ...p.scope }), repository_root: p.root,
    destination: "task-owned-local-fixture", reviewer_label: "deterministic population checker, not a model", expires_at: new Date(Date.now() + 3600000).toISOString(),
    secret: randomBytes(32).toString("base64url"), storage_key: randomBytes(32).toString("base64url"), callback_origins: [] }));
  const configPath = path.join(directory, "review.json");
  const configure = () => writeFileSync(configPath, JSON.stringify({ version: REVIEW_MARKER, connections }), { mode: 0o600 });
  configure(); process.env.AUGNES_REVIEW_CONNECTIONS_FILE = configPath;
  for (const p of projects) {
    const asset = deliverAsset(p.root);
    await p.api.write("initial", await p.api.read(), { goal: "Audit all unique build-attempt worker cost, including failed attempts", success_criteria: ["Exact millisecond total and failed time; duplicate deliveries counted once"], non_goals: ["No makespan, provider calls, execution grants or semantic approval"] });
    await p.api.write("revise", await p.api.read(), { sources: { add: [note("note-ref:events", inputBytes.toString()), note("note-ref:method", `Delivered v1 normalizer and CLI with verified inventory ${asset}. Recheck hashes before execution. Retain distinct retries; only identical IDs deduplicate. v2 or changed units require recheck; success-only filtering is inappropriate for this goal. Node builtins only; model-independent. Prior fixture correctness is not comparative benefit.`)] } });
  }
  phase("setup");
  const [direct, participant, changed, unavailable, asset] = projects;
  const empty = await choice(direct.root, "read"); assert.equal(empty.choice, null);
  const beforeChoose = db.serialize();
  const prepared = await choice(direct.root, "choose", { judgment: judgment() });
  assert(beforeChoose.equals(db.serialize()));
  assert.equal(prepared.choice, null, "preparation is not a saved choice");
  const preview = await call(prepared.revision_tool, prepared.revision_arguments);
  const concurrent = await choice(direct.root, "choose", { judgment: { ...judgment(), chosen: "Existing normalizer" } });
  const concurrentPreview = await call(concurrent.revision_tool, concurrent.revision_arguments);
  failSave = true;
  const failed = await raw("augnes_save_repository_work_revision", { ...prepared.revision_arguments, previewBinding: preview.preview_binding });
  failSave = false; assert(failed.result?.isError || failed.error); assert(beforeChoose.equals(db.serialize()));
  assert.equal((await choice(direct.root, "read")).choice, null);
  await savePrepared(prepared);
  const afterSave = db.serialize();
  const staleSave = await raw("augnes_save_repository_work_revision", { ...concurrent.revision_arguments, previewBinding: concurrentPreview.preview_binding });
  assert(staleSave.result?.isError || staleSave.error); assert(afterSave.equals(db.serialize()), "stale save must not append a second choice or authorization");
  const first = await choice(direct.root, "read");
  assert(first.choice, JSON.stringify(first));
  assert.equal(first.choice.judgment.chosen, "Current worker"); assert.equal(first.choice.judgment.recommended, "Existing normalizer");
  assert.equal(first.choice.judgment.alternatives[0].burden.waiting, "unknown");
  assert.equal((await choice(direct.root, "choose", { judgment: judgment() }, true)).reason, "execution_choice_already_selected");
  assert.equal((await choice(direct.root, "participate", { participation: {} }, true)).reason, "execution_choice_no_participation_selected");
  // Meaningful direct alternative: the original worker calculates rational sums.
  const unique = [...new Map(JSON.parse(inputBytes.toString()).events.map((e: any) => [e.event_id, e])).values()] as any[];
  const sum = unique.reduce((n, e) => n + BigInt(e.duration_s.replace(".", "")) * BigInt(1000) / BigInt(10) ** BigInt(e.duration_s.split(".")[1]?.length ?? 0), BigInt(0));
  assert.equal(sum, BigInt(7500));
  let directCurrent = (await direct.api.write("revise", await direct.api.read(), { sources: { add: [note("note-ref:direct-result", `Direct exact rational sum: ${sum} ms; six unique attempts, failures retained.`)] } })).current;
  await savePrepared(await choice(direct.root, "assess", { assessment: { disposition: "used", result_refs: [directCurrent.sources.sources.find((s: any) => s.source_locator === "note-ref:direct-result").source_binding], compared_with_expectation: "Direct calculation meets the exact total; no recruitment needed", decision: "continue", next_action: "Keep direct work for this small input", reconsider_when: "Input volume or units change", unfinished: "No unfinished contribution" } }));
  assert.equal((db.prepare("SELECT count(*) AS n FROM vnext_review_requests").get() as any).n, 0);
  assert.equal((await choice(direct.root, "read")).followup.assessment.decision, "continue");
  await savePrepared(await choice(asset.root, "choose", { judgment: { ...judgment(), chosen: "Existing normalizer" } }));
  const assetResult = await output(asset.root, "capacity");
  await asset.api.write("revise", await asset.api.read(), { sources: { add: [assetResult] } });
  const assetView = await choice(asset.root, "read");
  await savePrepared(await choice(asset.root, "assess", { assessment: { disposition: "used", result_refs: [assetView.sources.find((s: any) => s.source_locator === "note-ref:audit-output").source_binding], compared_with_expectation: "Existing v1 asset produces the exact audited output without recruitment", decision: "continue", next_action: "Reuse v1 only for the same schema and population", reconsider_when: "Units, schema, input or goal change", unfinished: "No pending contribution" } }));
  assert.equal((db.prepare("SELECT count(*) AS n FROM vnext_review_requests").get() as any).n, 0);
  phase("direct_use_and_assessment");

  const connection = connections[1];
  await savePrepared(await choice(participant.root, "choose", { judgment: judgment(connection.id) }));
  const chosen = await choice(participant.root, "read"), originalChoice = JSON.stringify(chosen.choice);
  const materialRefs = chosen.sources.filter((s: any) => ["note-ref:events", "note-ref:method"].includes(s.source_locator)).map((s: any) => s.source_binding);
  const contribution = { purpose: "Population check beside the current worker", question: "Which population counts toward all-attempt cost and what is its total?", success: "Return population, total_ms and failed_ms from actual rows", checks: "Deduplicate identical IDs; preserve distinct retries; exact decimal seconds", dependency_order: "Read request and full event excerpt, calculate, reply; origin validates then computes the report", material_refs: materialRefs, recheck: "Changed input, version, units or goal require a new request" };
  assert.equal((await choice(participant.root, "participate", { participation: { ...contribution, material_refs: ["sha256:" + "f".repeat(64)] } }, true)).reason, "execution_choice_material_missing");
  const participation = await choice(participant.root, "participate", { participation: contribution });
  assert.equal(participation.delivered_material.find((s: any) => s.source_locator === "note-ref:events").excerpt_text, inputBytes.toString().trim());
  const request = await call(participation.request_tool, participation.request_arguments);
  assert.equal((await call(participation.request_tool, participation.request_arguments)).status, "exact_replay");
  assert.equal((await choice(participant.root, "read")).contribution.requests[0].request_ref, request.request_ref);
  const foreign = await raw("augnes_review_repository_work", { action: "readback", connection_ref: connections[2].id, request_ref: request.request_ref });
  assert.equal(foreign.result.structuredContent.reason, "review_access_refused");
  const adapter = createRequestBoundReviewAdapter(connection.id);
  const reviewerCall = async (name: string, args: object) => {
    const r: any = await adapter.handle({ jsonrpc: "2.0", id: ++requestId, method: "tools/call", params: { name, arguments: args, _meta: { "io.modelcontextprotocol/protocolVersion": "2026-07-28", "io.modelcontextprotocol/clientCapabilities": {} } } });
    assert(!r.error && !r.result?.isError, JSON.stringify(r)); return r.result.structuredContent;
  };
  const delivered = await reviewerCall("augnes_read_review_request", { request_ref: request.request_ref });
  assert(delivered.question.includes(chosen.choice.source_ref));
  const data = JSON.parse(delivered.sources.find((s: any) => s.source_locator === "note-ref:events").excerpt_text);
  const rows = [...new Map(data.events.map((e: any) => [e.event_id, e])).values()] as any[];
  // Consumer computes from the delivered bytes, without evaluator answers.
  const ms = (e: any) => Number(e.duration_s) * 1000;
  const answer = { population: "all unique attempts", total_ms: rows.reduce((a, e) => a + ms(e), 0), failed_ms: rows.filter(e => e.status === "failed").reduce((a, e) => a + ms(e), 0) };
  const replyArgs = { request_ref: request.request_ref, read_binding: delivered.read_binding, answer: JSON.stringify(answer), limitations: "Constructed deterministic calculation, not a model or measured delegation benefit", source_refs: materialRefs };
  const returned = await reviewerCall("augnes_reply_to_review", replyArgs);
  assert.equal((await reviewerCall("augnes_reply_to_review", replyArgs)).status, "exact_replay");
  const conflict: any = await adapter.handle({ jsonrpc: "2.0", id: ++requestId, method: "tools/call", params: { name: "augnes_reply_to_review", arguments: { ...replyArgs, answer: "overwrite" }, _meta: { "io.modelcontextprotocol/protocolVersion": "2026-07-28", "io.modelcontextprotocol/clientCapabilities": {} } } });
  assert.equal(conflict.result.structuredContent.reason, "review_reply_conflict");
  phase("participation_preparation_and_execution");
  const back = await call("augnes_review_repository_work", { action: "readback", connection_ref: connection.id, request_ref: request.request_ref });
  assert.equal(back.response_ref, returned.response_ref);
  const advice = JSON.parse(back.response.answer);
  assert.equal(advice.population, "all unique attempts");
  const report = await output(participant.root, advice.population === "all unique attempts" ? "capacity" : "success");
  assert.equal(JSON.parse(report.text).output.total_ms, advice.total_ms); assert.equal(JSON.parse(report.text).output.failed_ms, advice.failed_ms);
  const use = await call("augnes_review_repository_work", { action: "prepare_use", connection_ref: connection.id, request_ref: request.request_ref, choice: "retain", reasoning: "Keep the original all-attempt goal; use returned population and arithmetic to check capacity-audit output. No plan change required." });
  use.revision_arguments.changes.sources.add.push(report);
  await savePrepared(use);
  const afterUse = await choice(participant.root, "read");
  const resultRef = afterUse.sources.find((s: any) => s.source_locator === "note-ref:audit-output").source_binding;
  const assessment = { disposition: "used", result_refs: [resultRef], request_ref: request.request_ref, compared_with_expectation: "Returned population and totals match the generated audit; comparative benefit unknown", decision: "end_role", next_action: "Retain the checked audit and end this population-review role", reconsider_when: "Schema, units or audit population changes", unfinished: "No outstanding request; retain conditional v1 method and output" };
  assert.equal((await choice(participant.root, "assess", { assessment: { ...assessment, result_refs: materialRefs } }, true)).reason, "execution_choice_downstream_work_required");
  await savePrepared(await choice(participant.root, "assess", { assessment }));
  const closed = await choice(participant.root, "read"); assert.equal(JSON.stringify(closed.choice), originalChoice);
  assert.equal(closed.followup.assessment.decision, "end_role"); assert.equal(closed.followup.review_status, "returned");
  assert.equal(closed.contribution.requests[0].response_ref, returned.response_ref);
  assert.equal(closed.contribution.requests[0].currentness, "historical", "later work must not relabel the original returned basis");
  assert.equal((await call("augnes_review_repository_work", { action: "connections", repository_root: participant.root })).connections.length, 1, "role closure is not credential withdrawal");
  assert.equal((await choice(participant.root, "assess", { assessment }, true)).reason, "execution_choice_already_assessed");
  const fresh = await child("fresh-origin-process", ["--input-type=module", "-e", `import {handleMessageV01} from './plugins/augnes-operator/mcp/companion-proxy.mjs'; const root=process.argv[1]; const call=async(name,args)=>(await handleMessageV01({jsonrpc:'2.0',id:1,method:'tools/call',params:{name,arguments:args}})).result.structuredContent; const r=await call('augnes_resume_repository',{repositoryRoot:root}); const v=await call('${EXECUTION_CHOICE_TOOL}',{action:'read',repositoryRoot:root,expectedSnapshotBinding:r.continuity.snapshot.binding}); console.log(JSON.stringify(v));`, participant.root], process.cwd(), { ...process.env });
  assert.deepEqual(fresh.choice, closed.choice); assert.deepEqual(fresh.followup, closed.followup);
  phase("actual_integration_closure_and_fresh_readback");

  // New current basis after a pending request: original identity remains; no substitute reply.
  await savePrepared(await choice(changed.root, "choose", { judgment: judgment(connections[2].id) }));
  const changedView = await choice(changed.root, "read");
  const changedPreparation = await choice(changed.root, "participate", { participation: { ...contribution, material_refs: changedView.choice.basis.sources } });
  const changedRequest = await call(changedPreparation.request_tool, changedPreparation.request_arguments);
  const changedAdapter = createRequestBoundReviewAdapter(connections[2].id);
  const changedReviewCall = async (name: string, args: object) => changedAdapter.handle({ jsonrpc: "2.0", id: ++requestId, method: "tools/call", params: { name, arguments: args, _meta: { "io.modelcontextprotocol/protocolVersion": "2026-07-28", "io.modelcontextprotocol/clientCapabilities": {} } } }) as Promise<any>;
  const oldRead = (await changedReviewCall("augnes_read_review_request", { request_ref: changedRequest.request_ref })).result.structuredContent;
  await changed.api.write("revise", await changed.api.read(), { goal: "Audit only successful attempts instead" });
  const lateReply = await changedReviewCall("augnes_reply_to_review", { request_ref: changedRequest.request_ref, read_binding: oldRead.read_binding, answer: "All attempts cost 7500 ms", limitations: "Original basis only", source_refs: changedView.choice.basis.sources });
  assert.equal(lateReply.result.structuredContent.reason, "review_material_changed");
  const stale = await raw(changedPreparation.request_tool, changedPreparation.request_arguments); assert.equal(stale.result.structuredContent.reason, "review_material_changed");
  const retained = await call("augnes_review_repository_work", { action: "readback", connection_ref: connections[2].id, request_ref: changedRequest.request_ref });
  assert.equal(retained.material_ref, changedRequest.material_ref); assert.equal(retained.currentness, "historical");
  assert.equal(retained.response, null, "late refusal must not persist an old-basis answer as current work");
  assert.equal((await choice(changed.root, "participate", { participation: contribution }, true)).reason, "execution_choice_reconsideration_required");
  const wrongScope = await raw(EXECUTION_CHOICE_TOOL, { action: "read", repositoryRoot: changed.root, expectedSnapshotBinding: first.revision_arguments?.expectedSnapshotBinding ?? prepared.revision_arguments.expectedSnapshotBinding });
  assert.equal(wrongScope.result.structuredContent.status, "refresh_required");
  assert.equal((await choice(changed.root, "read")).applicability, "basis_changed");
  // Unavailable participant does not erase the original expectation or block direct continuation.
  await savePrepared(await choice(unavailable.root, "choose", { judgment: judgment(connections[3].id) }));
  connections.splice(3, 1); configure();
  const unavailablePreparation = await choice(unavailable.root, "participate", { participation: contribution }, true);
  assert.equal(unavailablePreparation.reason, "execution_choice_participant_unavailable");
  const unavailableCurrent = (await unavailable.api.write("revise", await unavailable.api.read(), { sources: { add: [note("note-ref:availability-observation", "Current configured participant list no longer includes the selected reviewer; no request dispatched. Direct calculation remains available.")] } })).current;
  await savePrepared(await choice(unavailable.root, "assess", { assessment: { disposition: "deferred", result_refs: [unavailableCurrent.sources.sources.find((s: any) => s.source_locator === "note-ref:availability-observation").source_binding], compared_with_expectation: "Expected review was unavailable; no returned contribution", decision: "end_role", next_action: "Continue directly using the retained input", reconsider_when: "A supported reviewer becomes available and still adds value", unfinished: "No request dispatched; retain original expectation and input" } }));
  assert.equal((await choice(unavailable.root, "read")).followup.review_status, "unavailable");
  // The composition must not combine an old source snapshot with a newer
  // review-use projection. Inject an actual ordinary write between its reads.
  const discovery = await selectCompanionForReadonlyRouteV01(); assert.equal(discovery.status, "resolved");
  const beforeRace = await direct.api.read(); let sourceReads = 0;
  const raced = await prepareExecutionChoice({ action: "read", repositoryRoot: direct.root, expectedSnapshotBinding: beforeRace.binding }, {
    readSources: async (input: any) => {
      if (++sourceReads === 2) await direct.api.write("revise", await direct.api.read(), { sources: { add: [note("note-ref:race-observation", "Current work changed during the composed read.")] } });
      return readRepositoryWorkSourcesV01(discovery.companion, input);
    }, review: (input: any) => callReview(discovery.companion, input, undefined),
  });
  assert.equal(raced.status, "refresh_required"); assert(!Object.hasOwn(raced, "choice"));
  assert.equal((await choice(direct.root, "read")).choice.judgment.chosen, "Current worker");
  assert.equal(JSON.stringify(readActiveProjectSelectionV01(db, workspace.workspace_id)), selection, "independent project reads must not activate a project");
  assert.equal(errors.length, 0, errors.join("\n"));
  phase("changed_basis_unavailability_and_preservation");
  if (exportDirectory) {
    mkdirSync(exportDirectory);
    writeFileSync(path.join(exportDirectory, "trace.json"), JSON.stringify(trace, null, 2));
    artifacts.forEach((file, i) => copyFileSync(file, path.join(exportDirectory, `audit-${i}.json`)));
    writeFileSync(path.join(exportDirectory, "report.json"), JSON.stringify({ evidence: "deterministic production-shaped paths", phases, elapsed_ms: Date.now() - started, actual_model: "NOT_RUN", comparative_usefulness: "NOT_RUN", human_repair: "unknown", configured_credentials: "synthetic task-owned only" }, null, 2));
  }
  console.log(JSON.stringify({ status: "passed", phases, elapsed_ms: Date.now() - started, model_use: "NOT_RUN", comparison: "NOT_RUN" }));
}
void main().finally(async () => {
  Database.prototype.prepare = prepare;
  await closeTrackedServer(server); db.close(); guard.restore();
  for (const key of Object.keys(process.env)) if (!(key in oldEnv)) delete process.env[key];
  Object.assign(process.env, oldEnv); rmSync(directory, { recursive: true, force: true });
  assert(!existsSync(directory)); console.log(JSON.stringify({ cleanup: "complete", remaining_owned_listeners: 0 }));
});
