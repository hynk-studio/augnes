import { registerOwnedChild, waitForOwnedProcessExit, terminateOwnedProcessTree } from "./test-harness-process-lifecycle.mjs";
import { differentSelectionRevision } from "./test-selection-observation";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, realpathSync, writeFileSync, readFileSync, rmSync, renameSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import Database from "better-sqlite3";
import { applyCanonicalDatabaseMigrations } from "./canonical-database-migrations.mjs";
import { installZeroNetworkGuard } from "./test-harness-zero-network-guard.mjs";
import { getOrCreateDefaultWorkspaceIdentityV01, getOrCreateCanonicalProjectForLocalRootV01, normalizeLocalProjectRootRefV01 } from "../lib/vnext/persistence/project-identity-registry";
import { selectActiveProjectV01 } from "../lib/vnext/persistence/project-lifecycle-registry";
import { issueVNextLocalOperatorBootstrapV01, consumeVNextLocalOperatorBootstrapV01, readVNextLocalOperatorCredentialFromRequestV01, revokeVNextLocalOperatorSessionByCredentialV01, VNEXT_LOCAL_OPERATOR_SESSION_COOKIE_V01 } from "../lib/vnext/runtime/local-operator-session";
import { createVNextOperatorContextUseReviewHandlerV01 } from "../app/api/vnext/operator/project-continuity/route";
import { createStatelessSourceReviewHandler } from "../app/api/vnext/operator/stateless-source-review/route";
import { createWorkHandoffHandler } from "../app/api/vnext/operator/work-handoff/route";
import { createOpenAIResponsesAdapterV01 } from "../lib/vnext/model-gateway/openai/responses-adapter";
import { readCurrentProjectWorkPacketLineageV01 } from "../lib/vnext/runtime/operator-pilot-project-continuity";
import { mutateProjectControlV01, readProjectAutomationControlV01 } from "../lib/vnext/persistence/project-control-store";
import { handoffHash } from "../lib/vnext/work-handoff";
import { canonicalizeProtocolValueV01 as canonical } from "../lib/vnext/protocol-primitives";
const root = realpathSync(mkdtempSync(path.join(tmpdir(), "augnes-work-handoff-")));
const guard = installZeroNetworkGuard({ allowLoopback: true });
const handles: Database.Database[] = [];
const sourceText = "export function entry() { return 'bounded source'; }\n";
const pricing = { input_nano_usd_per_byte: 1000, output_nano_usd_per_token: 1000, maximum_total_nano_usd: 100_000_000, source_version: "scripted-handoff-no-provider" };
async function fixture(name: string) {
  const dir = path.join(root, name); mkdirSync(dir); const projectRoot = path.join(dir, "project"); mkdirSync(projectRoot);
  writeFileSync(path.join(projectRoot, "entry.ts"), sourceText);
  const databasePath = path.join(dir, "review.sqlite"), db = new Database(databasePath); handles.push(db); db.pragma("foreign_keys=ON"); applyCanonicalDatabaseMigrations(db);
  const workspace = getOrCreateDefaultWorkspaceIdentityV01(db), registration = getOrCreateCanonicalProjectForLocalRootV01(db, { workspace_id: workspace.workspace_id,
    local_root: normalizeLocalProjectRootRefV01(projectRoot, { base_path: root }), display_name: name });
  const scope = { workspace_id: workspace.workspace_id, project_id: registration.project.project_id };
  const active = selectActiveProjectV01(db, { ...scope, now: new Date().toISOString(), expected_project_id: null, expected_revision: null });
  const config = { enabled: true as const, ...scope, operator_id: "operator:handoff-test", database_path: databasePath };
  const environment = { NODE_ENV: "test" as const, OPENAI_API_KEY: "", AUGNES_VNEXT_OPERATOR_PILOT_ENABLED: "1", AUGNES_VNEXT_OPERATOR_WORKSPACE_ID: scope.workspace_id, AUGNES_VNEXT_OPERATOR_PROJECT_ID: scope.project_id, AUGNES_VNEXT_OPERATOR_ID: config.operator_id, AUGNES_DB_PATH: databasePath };
  const bootstrap = issueVNextLocalOperatorBootstrapV01(db, { config }), session = consumeVNextLocalOperatorBootstrapV01(db, { config, bootstrap_token: bootstrap.bootstrap_token });
  let cookie = `${VNEXT_LOCAL_OPERATOR_SESSION_COOKIE_V01}=${session.cookie_value}`, calls = 0, lose = false;
  const inputs: any[] = [];
  const adapter = createOpenAIResponsesAdapterV01({ environment: { OPENAI_API_KEY: "scripted-not-a-key", OPENAI_MODEL: "gpt-4.1-mini" }, transport: async request => {
    calls++; const input = JSON.parse(JSON.parse(JSON.parse(request.body).input[1].content[0].text).message); inputs.push(input);
    if (lose) throw new Error("scripted_transport_loss");
    return { ok: true, status: 200, json: async () => ({ status: "completed", output: [{ type: "message", content: [{ type: "output_text", text: JSON.stringify({ recommendations: [{ title: "Bounded review", rationale: "Inspect the exact source and retain scope limits; no wider connection follows.", tool_name: input.stage === "choose" ? "read_selected_sources" : "use_observation", priority: "now", grounded_state_keys: [input.stage === "choose" ? input.review_ref : input.observation_fingerprint] }] }) }] }], usage: { input_tokens: 100, output_tokens: 70, total_tokens: 170 } }) };
  } });
  const routes = { handoff: createWorkHandoffHandler({ environment }), continuity: createVNextOperatorContextUseReviewHandlerV01({ environment }), review: createStatelessSourceReviewHandler({ environment, adapter }) };
  async function call(route: keyof typeof routes, body?: any, expected = 200) {
    const endpoint = route === "continuity" ? "project-continuity" : route === "handoff" ? "work-handoff" : "stateless-source-review";
    const response = await routes[route](new Request(`http://127.0.0.1/api/vnext/operator/${endpoint}${route === "continuity" ? "" : "?project_id=" + config.project_id}`, { method: body ? "POST" : "GET", headers: { host: "127.0.0.1", origin: "http://127.0.0.1", cookie, ...(body ? { "content-type": "application/json" } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) }));
    if (response.headers.get("set-cookie")) cookie = response.headers.get("set-cookie")!.split(";")[0]!;
    const value = await response.json(); assert.equal(response.status, expected, canonical(value)); return value;
  }
  const control = (enabled: boolean) => mutateProjectControlV01(db, { ...scope, action: enabled ? "enable_automation" : "disable_automation", expected_active_project_id: scope.project_id, expected_active_selection_revision: active.selection_revision, expected_control_revision: readProjectAutomationControlV01(db, scope)?.revision ?? null });
  const current = () => readCurrentProjectWorkPacketLineageV01(db, config)!.packet;
  const logout = () => { revokeVNextLocalOperatorSessionByCredentialV01(db, { config, credential: readVNextLocalOperatorCredentialFromRequestV01(new Request("http://127.0.0.1", { headers: { cookie } })) }); cookie = ""; };
  return { config, db, scope, dir, projectRoot, active, environment, call, control, current, logout, inputs, loss: (value: boolean) => { lose = value; }, get calls() { return calls; } };
}
const definition = { goal: "Inspect the selected source and preserve uncertainty", success_criteria: ["Attribute the finding"], non_goals: ["No accepted state or broad absence claim"] };
async function successor(f: Awaited<ReturnType<typeof fixture>>, receipt: any) {
 const prep = await f.call("continuity", { action: "read_result_work_preparation", receipt_id: receipt.receipt_id });
 const comparison = (await f.call("continuity", { action: "compare_result_work_sources", binding: prep.binding, notes: [{ source: `${receipt.receipt_id} ${receipt.integrity.fingerprint}`, observed_at: receipt.recorded_at, provenance: "derived_interpretation", label: "Unclassified / needs review", text: "Attributed fixture review: the bounded observation supports only the shown source. Full report unselected; reconsider scope in the receiving project." }] })).comparison;
 const preview = await f.call("continuity", { action: "preview_result_work", binding: prep.binding, definition, selected_sources: { selected_source_context: comparison.entries, expected_source_comparison: comparison.fingerprint, omitted_sources: comparison.unselected_previous.map((e: any) => ({ source_binding: e.source_ref, reason: "Prior inventory is historical; retain the bounded attributed review." })) } });
 await f.call("continuity", { action: "prepare_result_work", request: preview.request }, 201);
}
async function main() {
 const source = await fixture("source"), dest = await fixture("destination");
 await source.call("continuity", { action: "define_initial_project_work", ...source.scope, expected_active_project_id: source.scope.project_id, expected_active_selection_revision: source.active.selection_revision, expected_initialization_state: "not_defined", ...definition }, 201);
 const material = { question: "What does this exact source establish?", files: [{ path: "entry.ts", start_line: 1, end_line: 1 }] };
 await source.call("review", { action: "prepare", material }); source.control(true);
 const oldGrant = (await source.call("review", { action: "preview", pricing })).authorization;
 source.loss(true); const lost = (await source.call("review", { action: "authorize_and_run", authorization: oldGrant })).result;
 assert.equal(lost.run.metadata.reconciliation_required, true);
 const ended = (await source.call("review", { action: "end_work", binding: lost.disposition_preparation.binding })).result;
 await source.call("review", { action: "prepare_linked_work", expected_active_selection_revision: ended.disposition_preparation.expected_active_selection_revision, disposition: { run_id: lost.run.run_id, disposition_fingerprint: ended.run.metadata.stateless_review_disposition.fingerprint }, material });
 source.loss(false); const grant = (await source.call("review", { action: "preview", pricing })).authorization;
 const completed = (await source.call("review", { action: "authorize_and_run", authorization: grant })).result;
 assert.equal(completed.run.status, "completed"); await successor(source, completed.receipt); source.control(false);
 const counts = source.calls, packet = source.current(), expected = { packet_id: packet.packet_id, packet_fingerprint: packet.integrity.fingerprint, receipt_id: completed.receipt.receipt_id };
 await source.call("handoff", { action: "export", expected: { ...expected, packet_fingerprint: handoffHash("stale") } }, 409);
 const bundle = (await source.call("handoff", { action: "export", expected })).handoff; assert.equal(source.calls, counts);
 assert.equal(bundle.evidence.observation.sources[0].text, sourceText.trimEnd()); assert.ok(bundle.obligations[0].bounded_summary.includes(lost.run.run_id));
 assert.equal(bundle.evidence.verification, "not_run"); assert.ok(!canonical(bundle).includes("bounded_observation_supports_only_hidden_answer"));
 for (const edit of [(b: any) => { b.evidence.observation.sources[0].text += "changed"; }, (b: any) => { b.evidence.project_id = "foreign-project"; }, (b: any) => { delete b.evidence.generation; }, (b: any) => { b.evidence.observation.sources = []; }]) {
   const bad = structuredClone(bundle); edit(bad); const { fingerprint: _, ...material } = bad; bad.fingerprint = handoffHash(material);
   await dest.call("handoff", { action: "preview", handoff: bad }, 409);
 }
 const oversized = structuredClone(bundle); oversized.task.goal = "x".repeat(25000); const { fingerprint: _, ...large } = oversized; oversized.fingerprint = handoffHash(large);
 await dest.call("handoff", { action: "preview", handoff: oversized }, 409);
 const preview = (await dest.call("handoff", { action: "preview", handoff: bundle })).preview;
 renameSync(dest.projectRoot, dest.projectRoot + "-original"); mkdirSync(dest.projectRoot);
 try { await dest.call("handoff", { action: "receive", request: preview.request, expected_preview: preview.fingerprint }, 409); }
 finally { rmSync(dest.projectRoot, { recursive: true }); renameSync(dest.projectRoot + "-original", dest.projectRoot); }

 const stale = structuredClone(preview.request); stale.handoff.expected_root_fingerprint = handoffHash("other-root");
 await dest.call("handoff", { action: "receive", request: stale, expected_preview: handoffHash(stale) }, 409);
 stale.handoff.expected_root_fingerprint = preview.request.handoff.expected_root_fingerprint; stale.handoff.expected_direction_ref = handoffHash("other-direction");
 await dest.call("handoff", { action: "receive", request: stale, expected_preview: handoffHash(stale) }, 409);
 stale.handoff.expected_direction_ref = null; stale.expected_active_selection_revision = differentSelectionRevision(stale.expected_active_selection_revision);
 await dest.call("handoff", { action: "receive", request: stale, expected_preview: handoffHash(stale) }, 409);
 await dest.call("review", { action: "authorize_and_run", authorization: oldGrant }, 409); assert.equal(dest.calls, 0);
 const transferPath = path.join(root, "selected-handoff.json"); writeFileSync(transferPath, canonical(bundle));
 source.logout(); dest.logout(); source.db.close(); dest.db.close();
 rmSync(source.dir, { recursive: true }); assert.equal(existsSync(source.config.database_path), false);
 const input = path.join(root, "receiver.json"); writeFileSync(input, JSON.stringify({ config: dest.config, projectRoot: dest.projectRoot, handoffPath: transferPath, sourceDatabase: source.config.database_path, oldGrant }));
 for (const args of [[], ["--readback"]]) {
 const owned = new Set(); const child = registerOwnedChild(owned, spawn(process.execPath, ["--import", "tsx", "scripts/test-work-handoff-browser.ts", input, ...args], { detached: true, stdio: ["ignore", "pipe", "pipe"], env: { ...process.env, OPENAI_API_KEY: "" } }), { label: "handoff-receiver" });
 let output = ""; for (const stream of [child.child.stdout, child.child.stderr]) stream?.on("data", (b: Buffer) => { output = (output + b.toString()).slice(-20000); });
 try { const exit = await waitForOwnedProcessExit(child, 45000); assert.equal(exit.code, 0, output); console.log(output.trim()); } finally { await terminateOwnedProcessTree(child); assert.equal(owned.size, 0); }
 }
 console.log(JSON.stringify({ source_calls_scripted: counts, source_removed_before_receiving: true, provider_calls: 0, handoff_http_negative_boundaries: "PASS" }));
}
async function run() { try { await main(); assert.equal(guard.attempts.length, 0); } finally { for (const db of handles) if (db.open) db.close(); guard.restore(); rmSync(root, { recursive: true, force: true }); }

}
void run().catch(e => { console.error(e); process.exitCode = 1; });
