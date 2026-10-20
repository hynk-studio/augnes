/** Engineered explicit repair and fresh-process consumption, never a model test. */
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { createServer } from "node:http";
import { readFileSync, writeFileSync, mkdirSync, lstatSync } from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { applyCanonicalDatabaseMigrations } from "./canonical-database-migrations.mjs";
import { trackServerConnections, closeTrackedServer } from "./test-harness-process-lifecycle.mjs";
import { installZeroNetworkGuard } from "./test-harness-zero-network-guard.mjs";
import { getOrCreateDefaultWorkspaceIdentityV01, getOrCreateCanonicalProjectForLocalRootV01,
  normalizeLocalProjectRootRefV01 } from "../lib/vnext/persistence/project-identity-registry";
import { selectActiveProjectV01, readActiveProjectSelectionV01 } from "../lib/vnext/persistence/project-lifecycle-registry";
import { issueVNextLocalOperatorBootstrapV01, consumeVNextLocalOperatorBootstrapV01,
  readVNextLocalOperatorCredentialFromRequestV01, VNEXT_LOCAL_OPERATOR_SESSION_COOKIE_V01,
  type VNextLocalOperatorPilotConfigV01 } from "../lib/vnext/runtime/local-operator-session";
import { defineInitialProjectWorkV01 } from "../lib/vnext/runtime/project-work-initialization";
import { runDirectNativeHostRoundTripV01 } from "../lib/vnext/runtime/direct-native-host-round-trip";
import { createDeterministicCodexAdapterV01 } from "../lib/vnext/native-host/deterministic-codex-adapter";
import { createVNextOperatorContextUseReviewHandlerV01, createVNextOperatorProjectContinuityHandlerV01 } from "../app/api/vnext/operator/project-continuity/route";

const [mode, root] = process.argv.slice(2);
assert(["produce", "consume"].includes(mode!) && root && process.argv.length === 4);
const hash = (value: string | Buffer) => createHash("sha256").update(value).digest("hex");
const record = (name: string, value: unknown) => writeFileSync(path.join(root!, name), JSON.stringify(value, null, 2) + "\n", { flag: "wx", mode: 0o600 });
const read = (name: string) => JSON.parse(readFileSync(path.join(root!, name), "utf8"));
const at = (second: number) => `2026-08-01T00:00:${String(second).padStart(2, "0")}.000Z`;
const clock = { now: () => at(20) };
const projectRoot = path.join(root!, "project"), sessionFile = path.join(root!, "session.cookie");
const guard = installZeroNetworkGuard({ allowLoopback: true });
let db: Database.Database | undefined, server: ReturnType<typeof createServer> | undefined;
let adapterCalls = 0;

async function main() {
  let config: VNextLocalOperatorPilotConfigV01;
  let cookie: string, receiptId: string | undefined;
  if (mode === "produce") {
    mkdirSync(projectRoot, { recursive: true });
    db = new Database(path.join(root!, "project.db")); db.pragma("foreign_keys=ON"); applyCanonicalDatabaseMigrations(db);
    const workspace = getOrCreateDefaultWorkspaceIdentityV01(db);
    const project = getOrCreateCanonicalProjectForLocalRootV01(db, { workspace_id: workspace.workspace_id,
      local_root: normalizeLocalProjectRootRefV01(projectRoot, { base_path: root! }), display_name: "Synthetic offline photo catalogue" });
    config = { enabled: true, workspace_id: workspace.workspace_id, project_id: project.project.project_id,
      operator_id: "operator:synthetic-catalogue-repair", database_path: path.join(root!, "project.db") };
    selectActiveProjectV01(db, { ...config, expected_project_id: null, expected_revision: null, now: at(0) });
    const bootstrap = issueVNextLocalOperatorBootstrapV01(db, { config, clock: { now: () => at(0) } });
    const session = consumeVNextLocalOperatorBootstrapV01(db, { config, bootstrap_token: bootstrap.bootstrap_token, clock: { now: () => at(1) } });
    const selection = readActiveProjectSelectionV01(db, config.workspace_id)!;
    const initial = defineInitialProjectWorkV01(db, { config, credential: session.credential, clock: { now: () => at(2) }, request: {
      action: "define_initial_project_work", workspace_id: config.workspace_id, project_id: config.project_id,
      expected_active_project_id: config.project_id, expected_active_selection_revision: selection.selection_revision,
      expected_initialization_state: "not_defined", goal: "Establish the synthetic catalogue planning predecessor.",
      success_criteria: ["Retain the completed synthetic result as historical evidence."], non_goals: ["No real provider or catalogue conversion."] } });
    const credential = readVNextLocalOperatorCredentialFromRequestV01(new Request("http://127.0.0.1", {
      headers: { cookie: VNEXT_LOCAL_OPERATOR_SESSION_COOKIE_V01 + "=" + initial.session_admission.cookie_value } }));
    let fixtureTime = Date.parse(at(4));
    const now = () => new Date(fixtureTime += 100).toISOString();
    const settled = await runDirectNativeHostRoundTripV01(db, { config, mode: "interactive", operator_mutation: {
      credential, clock: { now: () => at(4) } } }, { adapter: createDeterministicCodexAdapterV01({ now, observe: () => { adapterCalls++; } }), now });
    assert(fixtureTime < Date.parse(clock.now()));
    assert.equal(settled.receipt.execution.status, "completed");
    receiptId = settled.receipt.receipt_id;
    cookie = VNEXT_LOCAL_OPERATOR_SESSION_COOKIE_V01 + "=" + settled.session_admission!.cookie_value;
    record("access.json", config);
  } else { config = read("access.json"); cookie = readFileSync(sessionFile, "utf8"); }
  const environment = { NODE_ENV: "test" as const, AUGNES_DB_PATH: config.database_path, AUGNES_VNEXT_OPERATOR_PILOT_ENABLED: "1",
    AUGNES_VNEXT_OPERATOR_WORKSPACE_ID: config.workspace_id, AUGNES_VNEXT_OPERATOR_PROJECT_ID: config.project_id, AUGNES_VNEXT_OPERATOR_ID: config.operator_id };
  const get = createVNextOperatorProjectContinuityHandlerV01({ environment, clock });
  const post = createVNextOperatorContextUseReviewHandlerV01({ environment, clock });
  const unexpected = createVNextOperatorContextUseReviewHandlerV01({ environment, clock,
    open_database: () => { throw new RangeError("UNRELATED_PRIVATE_SOURCE_SENTINEL"); } });
  let origin = "";
  server = trackServerConnections(createServer(async (req, res) => {
    try {
      const chunks: Buffer[] = []; let bytes = 0;
      for await (const chunk of req) { bytes += chunk.length; assert(bytes <= 64_000); chunks.push(Buffer.from(chunk)); }
      const request = new Request(origin + req.url, { method: req.method, headers: req.headers as Record<string, string>,
        ...(req.method === "POST" ? { body: Buffer.concat(chunks).toString() } : {}) });
      const handler = req.url === "/unexpected" ? unexpected : req.method === "POST" ? post : get;
      const response = await handler(request);
      response.headers.forEach((v, k) => { if (k !== "set-cookie") res.setHeader(k, v); });
      if (response.headers.getSetCookie().length) res.setHeader("Set-Cookie", response.headers.getSetCookie());
      res.statusCode = response.status; res.end(await response.text());
    } catch { res.statusCode = 500; res.end('{"error_code":"fixture_http_failed"}'); }
  }));
  await new Promise<void>(resolve => server!.listen(0, "127.0.0.1", resolve));
  origin = "http://127.0.0.1:" + (server.address() as { port: number }).port;
  const http = async (label: string, body?: unknown, expectedStatus = 200, route = "/api/vnext/operator/project-continuity") => {
    const response = await fetch(origin + route, { method: body ? "POST" : "GET", headers: { cookie, origin, "content-type": "application/json" },
      ...(body ? { body: JSON.stringify(body) } : {}), signal: AbortSignal.timeout(10_000) });
    const value = await response.json();
    record(`${mode}-${label}.json`, { method: body ? "POST" : "GET", route, request: body ?? null, status: response.status, response: value,
      authentication: "disposable production-writer session; credential/header omitted", set_cookie_observed: response.headers.getSetCookie().length > 0 });
    assert.equal(response.status, expectedStatus, JSON.stringify(value));
    const rotation = response.headers.getSetCookie()[0]; if (rotation) cookie = rotation.split(";")[0]!;
    return value;
  };
  if (mode === "produce") {
    // The outer test froze the complete plan and independent obligation map
    // before this process. No current draft or response manufactures that basis.
    const full = readFileSync(path.join(projectRoot, "complete-plan.md"));
    const plan = JSON.parse(full.toString().split("```json\n")[1]!.split("\n```\n")[0]!);
    const artifact = { relative_path: "complete-plan.md", sha256: hash(full) };
    const before = await http("before"), databaseBefore = db!.serialize();
    const prep = await http("preparation", { action: "read_result_work_preparation", receipt_id: receiptId });
    const notes = plan.obligations.map((item: { id: string; action: string }, index: number) => ({
      source: `complete-plan.md#${item.id} sha256:${artifact.sha256}`, observed_at: null, provenance: "user_declaration", label: "Next check",
      text: (index === 0 ? `Artifact reference: ${JSON.stringify(artifact)}\n` : "") + item.action + "\n" +
        "Catalogue preparation remains conditional. 한국어 labels and astral 😀 names require exact content comparison; quoted paths such as \"stage\\\\catalogue\" are data. ".repeat(4) }));
    const comparison = (await http("comparison", { action: "compare_result_work_sources", binding: prep.binding, notes })).comparison;
    const selected_sources = { selected_source_context: comparison.entries, expected_source_comparison: comparison.fingerprint, omitted_sources: [] };
    const long = { goal: "Prepare the offline photo catalogue migration plan. ".repeat(17),
      success_criteria: plan.obligations.map((item: { action: string }) => item.action + " Document every conditional branch before any future authorized conversion. ".repeat(5)),
      non_goals: ["No conversion, publication, execution authority or semantic acceptance.", "No removal of originals, validation, rollback, rejection/correction history or unresolved conditions."] };
    const rejectedDraft = { action: "preview_result_work", binding: prep.binding, definition: long, selected_sources, include_packet_budget_diagnostics: true };
    record("rejected-draft.json", rejectedDraft); const draftBytes = readFileSync(path.join(root!, "rejected-draft.json"));
    const refused = await http("refused-preview", rejectedDraft, 409);
    assert.equal(refused.error_code, "successor_task_packet_max_characters_exceeded");
    assert.equal(refused.packet_budget.limit, 76_000); assert.equal(refused.packet_budget.unit, "utf16_code_units");
    assert.equal(refused.packet_budget.overage, refused.packet_budget.observed - 76_000);
    const request = { action: "define_authored_successor_task", ...prep.binding, expected_direction_ref: null, selected_sources,
      definition: { objective: long.goal.trim(), checks: long.success_criteria.map((criterion: string, i: number) => ({ check_id: `criterion_${i + 1}`, criterion: criterion.trim() })),
        stop_conditions: long.non_goals, materials: [], approved_instruction_hashes: [] } };
    const refusedSave = await http("refused-save", { action: "prepare_result_work", request, include_packet_budget_diagnostics: true }, 409);
    assert.deepEqual(refusedSave.packet_budget, refused.packet_budget);
    assert(databaseBefore.equals(db!.serialize())); assert.deepEqual((await http("refusal-readback")).work_initialization, before.work_initialization);
    const unknown = await http("unexpected-range-error", rejectedDraft, 500, "/unexpected");
    assert.equal(unknown.error_code, "operator_pilot_continuity_read_failed"); assert.equal(unknown.packet_budget, undefined);
    assert(!JSON.stringify(unknown).includes("SENTINEL"));
    // Explicit coordinator-authored representation: retain all eight whole
    // notes and the complete artifact; no truncation, automatic retry or deletion.
    const compact = { goal: "Prepare a conditional offline photo-catalogue migration checklist using complete-plan.md; do not execute it.",
      success_criteria: plan.obligations.map((item: { action: string }) => item.action), non_goals: long.non_goals };
    record("representation-change.json", { author: "deterministic fixture coordinator", changes: "Replace repeated goal/check explanations with explicit obligation statements; full original plan and all eight notes retained.",
      deselected_sources: [], complete_artifact: artifact, rejected_draft_sha256: hash(draftBytes), revised_definition: compact });
    const preview = await http("repaired-preview", { ...rejectedDraft, definition: compact });
    assert.equal(preview.writes, 0); assert(databaseBefore.equals(db!.serialize()));
    const saved = await http("explicit-save", { action: "prepare_result_work", request: preview.request, include_packet_budget_diagnostics: true }, 201);
    const fresh = await http("saved-readback");
    assert.deepEqual(fresh.work_initialization.current_work, compact);
    assert.deepEqual(fresh.work_initialization.selected_source_context, comparison.entries);
    assert.equal(fresh.work_initialization.current_packet.packet_id, saved.packet_id);
    assert.equal(fresh.work_initialization.current_packet.packet_fingerprint, saved.packet_fingerprint);
    assert(full.equals(readFileSync(path.join(projectRoot, artifact.relative_path))));
    assert(draftBytes.equals(readFileSync(path.join(root!, "rejected-draft.json"))));
    writeFileSync(sessionFile, cookie, { flag: "wx", mode: 0o600 });
    record("producer-result.json", { pid: process.pid, artifact, rejected_draft_sha256: hash(draftBytes), packet_id: saved.packet_id,
      packet_fingerprint: saved.packet_fingerprint, retained_notes: comparison.entries.length, packet_budget: refused.packet_budget,
      atomic_refusal: true, read_only_preview: true, exact_saved_readback: true, adapter_calls: adapterCalls, actual_model_calls: 0 });
  } else {
    // This fresh process reads ordinary authenticated HTTP state first, then
    // actually opens the file named by its attributed current source note.
    const current = await http("current-entry");
    const notes = current.work_initialization.selected_source_context;
    const serializedNotes = JSON.stringify(notes);
    const candidates = notes.flatMap((entry: { bounded_summary: string }) => {
      const text = entry.bounded_summary;
      return text.startsWith("Artifact reference: ") ? [JSON.parse(text.split("\n")[0]!.slice("Artifact reference: ".length))] : [];
    });
    assert.equal(candidates.length, 1); const artifact = candidates[0];
    assert(/^[a-z][a-z0-9-]*\.md$/.test(artifact.relative_path) && /^[a-f0-9]{64}$/.test(artifact.sha256));
    const file = path.join(projectRoot, artifact.relative_path), stat = lstatSync(file);
    assert(stat.isFile() && !stat.isSymbolicLink() && stat.nlink === 1 && stat.size <= 65_536);
    const bytes = readFileSync(file); assert.equal(hash(bytes), artifact.sha256);
    const plan = JSON.parse(bytes.toString().split("```json\n")[1]!.split("\n```\n")[0]!);
    const work = current.work_initialization.current_work;
    const checklist = plan.obligations.map((item: { id: string; action: string; condition: string }) => {
      assert(work.success_criteria.includes(item.action)); assert(serializedNotes.includes(item.id));
      return { id: item.id, action: item.action, condition: item.condition, status: "pending_explicit_authorization_and_checks" };
    });
    const output = { pid: process.pid, current_packet: current.work_initialization.current_packet, artifact,
      actual_file_read: { bytes: bytes.length, sha256: hash(bytes) }, checklist, history: plan.history,
      unresolved_conditions: plan.unresolved_conditions, decision: "hold_conversion_pending_applicability_and_validation",
      authority: "planning only; no execution or semantic acceptance", actual_model_calls: 0 };
    record("consumer-output.json", output);
    writeFileSync(path.join(root!, "next-work-checklist.md"), `# Conditional catalogue preparation\n\n${output.decision}\n\n` +
      checklist.map((item: { id: string; action: string; condition: string }) => `- [ ] ${item.id}: ${item.action} Condition: ${item.condition}`).join("\n") +
      `\n\nHistory: ${JSON.stringify(output.history)}\nUnresolved: ${JSON.stringify(output.unresolved_conditions)}\n`, { flag: "wx", mode: 0o600 });
    assert.equal(adapterCalls, 0);
  }
}
main().then(() => { console.log(JSON.stringify({ successor_budget_repair: mode, status: "pass", pid: process.pid })); })
  .catch(error => { console.error(error); process.exitCode = 1; })
  .finally(async () => {
    const port = (server?.address() as { port: number } | null)?.port ?? null;
    if (server) await closeTrackedServer(server);
    db?.close(); guard.restore();
    const cleanup = { owned_port: port, server_closed: !server?.listening,
      producer_database_closed: !db?.open, forbidden_network_attempts: guard.attempts.length };
    record(`${mode}-cleanup.json`, cleanup);
    assert(cleanup.server_closed && cleanup.producer_database_closed);
    assert.equal(guard.attempts.length, 0);
  });
