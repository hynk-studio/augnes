import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, realpathSync, writeFileSync, readFileSync, rmSync, renameSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { hasUnsettledAutonomyRunLedgerRecords, insertAutonomyRunLedgerRecord, updateAutonomyRunStepLedgerFields } from "../lib/autonomy/runner-ledger";
import { createVNextOperatorContextUseReviewHandlerV01 } from "../app/api/vnext/operator/project-continuity/route";
import { readSelectedWorkSources, selectedWorkSourceInput } from "../lib/intake/selected-work-source-comparison";
import { readProjectWorkInitializationV01 } from "../lib/vnext/runtime/project-work-initialization";
import { inspectPersistedHostProjectRootV01 } from "../lib/vnext/runtime/direct-native-host-round-trip";
import { fingerprintNativeHostPhysicalRootIdentityV01 } from "../lib/vnext/native-host/project-root-identity";
import { previewActivePortableProjectV01 } from "../lib/vnext/portability/portable-project";
import { createProjectDirectionHandler } from "../app/api/vnext/operator/project-direction/route";
import type { ModelAdapterV01 } from "../lib/vnext/model-gateway/contracts";
import { channel } from "node:diagnostics_channel";
import Database from "better-sqlite3";
import { applyCanonicalDatabaseMigrations } from "./canonical-database-migrations.mjs";
import { getOrCreateDefaultWorkspaceIdentityV01, getOrCreateCanonicalProjectForLocalRootV01, normalizeLocalProjectRootRefV01 } from "../lib/vnext/persistence/project-identity-registry";
import { readActiveProjectSelectionV01, selectActiveProjectV01 } from "../lib/vnext/persistence/project-lifecycle-registry";
import { issueVNextLocalOperatorBootstrapV01, consumeVNextLocalOperatorBootstrapV01, readVNextLocalOperatorCredentialFromRequestV01, VNEXT_LOCAL_OPERATOR_SESSION_COOKIE_V01 } from "../lib/vnext/runtime/local-operator-session";
import { defineInitialProjectWorkV01 } from "../lib/vnext/runtime/project-work-initialization";
import { mutateProjectControlV01, readProjectAutomationControlV01 } from "../lib/vnext/persistence/project-control-store";
import { createStatelessSourceReviewHandler } from "../app/api/vnext/operator/stateless-source-review/route";
import { StatelessSourceReviewHost, authorizeStatelessReview } from "../lib/vnext/runtime/stateless-source-review";
import { createOpenAIResponsesAdapterV01 } from "../lib/vnext/model-gateway/openai/responses-adapter";
import { preparePlannerModelGatewayRouteV01 } from "../lib/vnext/model-gateway/model-gateway";
import { listVNextCoreRecordsV01 } from "../lib/vnext/persistence/durable-semantic-store";
import { readProjectRunResultSourceBindingV01 } from "../lib/vnext/runtime/project-run-result-read-model";
import { createRecoveryBackup, RECOVERY_DATABASE_PAYLOAD } from "./recovery-backup.mjs";
import { inspectRecoveryDatabaseFile } from "./runtime-database-bootstrap.mjs";
import { validateRecoveryCanonicalDatabaseV01 } from "./recovery-canonical-record-validator";
import { canonicalizeProtocolValueV01 as canonical, createProtocolSha256V01 as hash } from "../lib/vnext/protocol-primitives";

const root = realpathSync(mkdtempSync(path.join(tmpdir(), "augnes-stateless-review-")));
let requests = 0;
const network = channel("undici:request:create"), onNetwork = () => { requests++; };
network.subscribe(onNetwork);
const databases: Database.Database[] = [];
const sourceText = "export function choose() { return 'advisory'; }\nexport function inspect() { return 'exact source bytes'; }\n";
function scripted(firstChoice = "read_selected_sources", secondChoice = "use_observation") {
  const inputs: any[] = []; let calls = 0;
  const controls = { lose: false, outputTokens: 80, dispatch: async () => {} };
  const adapter = createOpenAIResponsesAdapterV01({ environment: { OPENAI_API_KEY: "scripted-transport-only-not-a-key", OPENAI_MODEL: "gpt-4.1-mini" }, transport: async request => {
    calls++; const body = JSON.parse(request.body);
    assert.equal(body.store, false); assert.equal(body.previous_response_id, undefined);
    const material = JSON.parse(body.input[1].content[0].text); const input = JSON.parse(material.message); inputs.push(input);
    await controls.dispatch();
    if (controls.lose) throw new Error("simulated_transport_loss_after_dispatch");
    const choice = input.stage === "choose" ? firstChoice : secondChoice;
    const output = { recommendations: [{ title: "Bounded entrypoint finding", rationale: input.stage === "choose" ? (choice === "read_selected_sources" ? "Read the selected excerpt because the question concerns this entrypoint." : "The question needs broader evidence; defer this read rather than treating a limited excerpt as sufficient.") : (choice === "use_observation" ? "The selected excerpt exposes advisory output and bounded result reentry. These fragments do not prove a broader connection." : "Retain uncertainty because this observation is unavailable or insufficient for the question."),
      tool_name: choice, priority: "now", grounded_state_keys: [input.stage === "choose" ? input.review_ref : input.observation_fingerprint] }] };
    return { ok: true, status: 200, json: async () => ({ output: [{ type: "message", content: [{ type: "output_text", text: JSON.stringify(output) }] }], usage: { input_tokens: 200, output_tokens: controls.outputTokens, total_tokens: 200 + controls.outputTokens } }) };
  } });
  return { adapter, inputs, controls, get calls() { return calls; } };
}
async function fixture(name: string, firstChoice = "read_selected_sources", secondChoice = "use_observation", auditSources = false) {
  const dir = path.join(root, name); mkdirSync(dir); const projectRoot = path.join(dir, "project"); mkdirSync(projectRoot);
  writeFileSync(path.join(projectRoot, "entry.ts"), sourceText);
  const selected = auditSources ? [
    { path: "planner.ts", start_line: 141, end_line: 164 },
    { path: "prospective.ts", start_line: 112, end_line: 131 },
  ] : [{ path: "entry.ts", start_line: 1, end_line: 2 }];
  if (auditSources) {
    writeFileSync(path.join(projectRoot, "planner.ts"), readFileSync("lib/vnext/automation/policy-triggered-planner-run.ts"));
    writeFileSync(path.join(projectRoot, "prospective.ts"), readFileSync("lib/vnext/runtime/prospective-reentry.ts"));
  }
  const databasePath = path.join(dir, "review.db"), db = new Database(databasePath); databases.push(db); db.pragma("foreign_keys=ON"); applyCanonicalDatabaseMigrations(db);
  const workspace = getOrCreateDefaultWorkspaceIdentityV01(db), registration = getOrCreateCanonicalProjectForLocalRootV01(db, { workspace_id: workspace.workspace_id,
    local_root: normalizeLocalProjectRootRefV01(projectRoot, { base_path: root }), display_name: name });
  const scope = { workspace_id: workspace.workspace_id, project_id: registration.project.project_id };
  const config = { ...scope, enabled: true as const, operator_id: "operator:stateless-test", database_path: databasePath };
  let time = Date.now() + 10; const now = () => new Date(time).toISOString(), tick = (ms = 10) => { time += ms; };
  selectActiveProjectV01(db, { ...scope, expected_project_id: null, expected_revision: null, now: now() });
  const active = readActiveProjectSelectionV01(db, scope.workspace_id)!;
  const bootstrap = issueVNextLocalOperatorBootstrapV01(db, { config, clock: { now } }), session = consumeVNextLocalOperatorBootstrapV01(db, { config, clock: { now }, bootstrap_token: bootstrap.bootstrap_token });
  let cookie = `${VNEXT_LOCAL_OPERATOR_SESSION_COOKIE_V01}=${session.cookie_value}`;
  const credential = () => readVNextLocalOperatorCredentialFromRequestV01(new Request("http://127.0.0.1", { headers: { cookie } }));
  tick();
  const initial = defineInitialProjectWorkV01(db, { config, credential: credential(), clock: { now }, request: { action: "define_initial_project_work", ...scope,
    expected_active_project_id: scope.project_id, expected_active_selection_revision: active.selection_revision, expected_initialization_state: "not_defined",
    goal: "Identify the connections established by the selected entrypoints", success_criteria: ["Attribute findings to exact excerpts and preserve uncertainty"], non_goals: ["No repository-wide absence claim or semantic acceptance"] } });
  assert.equal(initial.packet.capability_grant, null); cookie = `${VNEXT_LOCAL_OPERATOR_SESSION_COOKIE_V01}=${initial.session_admission.cookie_value}`;
  tick();
  const control = readProjectAutomationControlV01(db, scope);
  mutateProjectControlV01(db, { ...scope, action: "enable_automation", expected_active_project_id: scope.project_id, expected_active_selection_revision: active.selection_revision, expected_control_revision: control?.revision ?? null }, { now });
  const script = scripted(firstChoice, secondChoice);
  const { adapter, inputs } = script;
  const environment = { NODE_ENV: "test" as const, AUGNES_VNEXT_OPERATOR_PILOT_ENABLED: "1", AUGNES_VNEXT_OPERATOR_WORKSPACE_ID: scope.workspace_id,
    AUGNES_VNEXT_OPERATOR_PROJECT_ID: scope.project_id, AUGNES_VNEXT_OPERATOR_ID: config.operator_id, AUGNES_DB_PATH: databasePath };
  const route = createStatelessSourceReviewHandler({ environment, clock: { now }, adapter });
  const url = "http://127.0.0.1/api/vnext/operator/stateless-source-review";
  async function call(body?: unknown, expected = 200, headers: Record<string, string> = {}, projectId = scope.project_id) {
    tick(); const response = await route(new Request(`${url}?project_id=${projectId}`, { method: body ? "POST" : "GET",
      headers: { host: "127.0.0.1", origin: "http://127.0.0.1", cookie, ...(body ? { "content-type": "application/json" } : {}), ...headers }, ...(body ? { body: JSON.stringify(body) } : {}) }));
    const value = await response.json(); assert.equal(response.status, expected, canonical(value));
    if (response.headers.get("set-cookie")) cookie = response.headers.get("set-cookie")!.split(";")[0]!;
    return value;
  }
  const prepared = await call({ action: "prepare", material: { question: "What connection does this exact entrypoint establish, and what remains unestablished?", files: selected } });
  const preview = (await call({ action: "preview", pricing: { input_nano_usd_per_byte: 1000, output_nano_usd_per_token: 1000, maximum_total_nano_usd: 100_000_000, source_version: "scripted-test-price-not-live-authority" } })).authorization;
  assert.equal(script.calls, 0);
  assert.equal(listVNextCoreRecordsV01(db, { ...scope, record_kinds: ["capability_grant"], limit: 128 }).length, 0);
  const direction = async (request: unknown) => {
    tick(); const response = await createProjectDirectionHandler({ environment, clock: { now } })(new Request(`http://127.0.0.1/api/vnext/operator/project-direction?project_id=${scope.project_id}`, {
      method: "POST", headers: { host: "127.0.0.1", origin: "http://127.0.0.1", cookie, "content-type": "application/json" }, body: JSON.stringify(request) }));
    const value = await response.json(); assert.equal(response.status, 200, value.error);
    cookie = response.headers.get("set-cookie")!.split(";")[0]!; return value;
  };
  const continuity = async (body: unknown, expected = 200, headers: Record<string, string> = {}) => {
    tick(); const response = await createVNextOperatorContextUseReviewHandlerV01({ environment, clock: { now } })(new Request("http://127.0.0.1/api/vnext/operator/project-continuity", {
      method: "POST", headers: { host: "127.0.0.1", origin: "http://127.0.0.1", cookie, "content-type": "application/json", ...headers }, body: JSON.stringify(body) }));
    const value = await response.json(); assert.equal(response.status, expected, canonical(value));
    if (response.headers.get("set-cookie")) cookie = response.headers.get("set-cookie")!.split(";")[0]!;
    return value;
  };
  return { db, scope, config, projectRoot, now, tick, adapter, inputs, call, preview, credential, direction, continuity, preparationBytes: prepared.result.preparation_bytes, controls: script.controls,
    host: (id: string, customAdapter = adapter) => new StatelessSourceReviewHost({ config, now, adapter: customAdapter }, id),
    get calls() { return script.calls; }, loseDispatch() { script.controls.lose = true; },
    authorizeOnly() { tick(); const authorized = authorizeStatelessReview(db, { config, now, adapter }, credential(), preview); cookie = `${VNEXT_LOCAL_OPERATOR_SESSION_COOKIE_V01}=${authorized.session_admission.cookie_value}`; return authorized; } };
}
function unsettledOwnerContract(run: any) {
  // Isolated ledger truth-table fixtures only. No grant, ordinary work or
  // successful execution is fabricated or repaired by these interventions.
  const db = new Database(":memory:");
  try {
    insertAutonomyRunLedgerRecord({ ...run, run_id: "own", status: "running", metadata: {} }, [], [], { db });
    insertAutonomyRunLedgerRecord({ ...run, run_id: "other", status: "completed", metadata: {} }, [], [], { db });
    const check = (metadata: string, expected: boolean) => {
      db.prepare("UPDATE autonomy_runs SET metadata_json=? WHERE run_id='other'").run(metadata);
      assert.equal(hasUnsettledAutonomyRunLedgerRecords({ db, scope: run.scope, exclude_run_id: "own" }), expected, metadata);
      assert.equal((db.prepare("SELECT metadata_json FROM autonomy_runs WHERE run_id='other'").get() as any).metadata_json, metadata);
    };
    for (const metadata of ['{"reconciliation_required":true}', '{"reconciliation_required":null}', '{"reconciliation_required":"false"}', '{"reconciliation_required":0}', '{', '[]', 'null']) check(metadata, true);
    check('{"reconciliation_required":false}', false); check('{}', false);
    assert.equal(hasUnsettledAutonomyRunLedgerRecords({ db, scope: run.scope }), true, "Own run is excluded only by explicit exact ID");
    assert.equal(hasUnsettledAutonomyRunLedgerRecords({ db, scope: run.scope, exclude_run_id: "other" }), true);
    assert.equal(hasUnsettledAutonomyRunLedgerRecords({ db, scope: "another-project" }), false);
  } finally { db.close(); }
}
async function ordinarySuccessor(f: Awaited<ReturnType<typeof fixture>>, result: any) {
  const prep = await f.continuity({ action: "read_result_work_preparation", receipt_id: result.receipt.receipt_id });
  assert.equal(result.run.metadata.reconciliation_required, false);
  const rootScope = await inspectPersistedHostProjectRootV01(f.db, { config: f.config, evaluated_at: f.now() });
  assert.equal(prep.binding.expected_root_fingerprint, rootScope.root_fingerprint);
  assert.equal(result.run.metadata.root_physical_identity_fingerprint, fingerprintNativeHostPhysicalRootIdentityV01(rootScope.physical_root_identity));
  assert.ok(prep.result_source, "The ordinary preparation exposes the completed review as a selectable attributed result");
  const note = selectedWorkSourceInput(prep.result_source);
  assert.equal(note.provenance, "imported_unverified"); assert.equal(note.label, "Unclassified / needs review");
  assert.ok(note.text.includes("verification: not_run")); assert.ok(note.text.includes("not independently verified"));
  assert.ok(note.source.includes(result.receipt.receipt_id)); assert.ok(note.source.includes(result.receipt.integrity.fingerprint));
  const comparison = (await f.continuity({ action: "compare_result_work_sources", binding: prep.binding, notes: [note] })).comparison;
  const preview = await f.continuity({ action: "preview_result_work", binding: prep.binding,
    definition: { goal: "Check the remaining connection using the attributed prior review", success_criteria: ["Keep the review's uncertainty and inspect the missing connection"], non_goals: ["Do not accept the model recommendation as truth or execution permission"] },
    selected_sources: { selected_source_context: comparison.entries, expected_source_comparison: comparison.fingerprint,
      omitted_sources: comparison.unselected_previous.map((row: any) => ({ source_binding: row.source_ref, reason: "The predecessor question is historical; this distinct task explicitly selects its result." })) } });
  assert.equal(preview.writes, 0);
  const before = canonical(listVNextCoreRecordsV01(f.db, { ...f.scope, record_kinds: ["capability_grant"], limit: 128 }));
  await f.continuity({ action: "prepare_result_work", request: preview.request }, 401, { cookie: "" });
  const next = await f.continuity({ action: "prepare_result_work", request: preview.request }, 201);
  assert.equal(next.execution_authority_granted, false); assert.equal(next.run_created, false); assert.equal(next.semantic_state_changed, false);
  const record = listVNextCoreRecordsV01(f.db, { ...f.scope, record_kinds: ["task_context_packet"], limit: 128 }).find(r => r.record_id === next.packet_id)!;
  const packet = record.payload as any;
  assert.equal(packet.capability_grant, null); assert.notEqual(packet.packet_id, f.preview.packet_id);
  assert.equal(readProjectWorkInitializationV01(f.db, f.config).current_packet?.packet_id, packet.packet_id);
  assert.equal(readSelectedWorkSources(packet).length, 1); assert.deepEqual(selectedWorkSourceInput(readSelectedWorkSources(packet)[0]!), note);
  assert.equal(packet.selected_context.find((e: any) => e.entry_id === `successor-predecessor:${result.receipt.receipt_id}`).bounded_summary,
    "Recorded execution: completed; verification: not_run. No proposal acceptance is implied.");
  assert.equal(canonical(listVNextCoreRecordsV01(f.db, { ...f.scope, record_kinds: ["capability_grant"], limit: 128 })), before);
  await f.call({ action: "authorize_and_run", authorization: f.preview }, 409);
  await f.call({ action: "continue", run_id: result.run.run_id }); assert.equal(f.calls, 2, "The predecessor grant never executes the successor");
  validateRecoveryCanonicalDatabaseV01(f.db);
}
async function main() {
  try {
    const previewAdapter = scripted();
    const routeIdentity = await preparePlannerModelGatewayRouteV01({ adapter: previewAdapter.adapter });
    assert.deepEqual(Object.keys(routeIdentity!).sort(), ["model_ref", "provider_ref"]);
    assert.equal(previewAdapter.calls, 0, "route preview must not dispatch a provider call or expose an invocable session");
    assert.equal(await preparePlannerModelGatewayRouteV01({ adapter: createOpenAIResponsesAdapterV01({ environment: {} }) }), null);
    const normal = await fixture("normal");
    await normal.call({ action: "authorize_and_run", authorization: normal.preview }, 401, { cookie: "" });
    await normal.call({ action: "authorize_and_run", authorization: normal.preview }, 403, { origin: "https://foreign.example" });
    const authoredBeforeMismatch = canonical(listVNextCoreRecordsV01(normal.db, { ...normal.scope, record_kinds: ["task_context_packet", "capability_grant"], limit: 128 }));
    await normal.call({ action: "prepare", material: { question: "Do not write to the cookie's other project", files: [{ path: "entry.ts", start_line: 1, end_line: 2 }] } }, 409, {}, `project:${randomUUID()}`);
    await normal.call({ action: "authorize_and_run", authorization: normal.preview }, 409, {}, "");
    assert.equal(canonical(listVNextCoreRecordsV01(normal.db, { ...normal.scope, record_kinds: ["task_context_packet", "capability_grant"], limit: 128 })), authoredBeforeMismatch);
    assert.equal(normal.calls, 0);
    const result = (await normal.call({ action: "authorize_and_run", authorization: normal.preview })).result;
    assert.equal(result.run.status, "completed", result.run.stop_reason); assert.equal(normal.calls, 2);
    assert.equal(normal.inputs[1].observation.sources[0].text, sourceText.trimEnd());
    assert.equal(normal.inputs[1].observation.availability, "observed");
    assert.equal(normal.inputs[1].prior_judgment.tool_name, "read_selected_sources");
    assert.equal(result.run.steps[1].output.action_bundles, 1);
    const binding = readProjectRunResultSourceBindingV01(normal.db, { ...normal.scope, receipt_id: result.receipt.receipt_id });
    assert.equal(binding.packet!.packet_id, normal.preview.packet_id); assert.equal(binding.receipt.model_invocations.length, 2);
    const read = await normal.call(); assert.equal(read.reviews[0].receipt.receipt_id, binding.receipt.receipt_id);
    await normal.call({ action: "continue", run_id: result.run.run_id }); assert.equal(normal.calls, 2);
    validateRecoveryCanonicalDatabaseV01(normal.db);
    await normal.call({ action: "authorize_and_run", authorization: normal.preview }, 409);
    assert.equal(normal.calls, 2);
    unsettledOwnerContract(result.run);
    await ordinarySuccessor(normal, result);
    for (const [name, metadata] of [["unreconciled", '{"reconciliation_required":true}'], ["malformed", '{']] as const) {
      const blocked = await fixture(`other-${name}`); const authorization = blocked.authorizeOnly();
      // Negative admission fault: never clear this other run to obtain success.
      insertAutonomyRunLedgerRecord({ ...result.run, run_id: `other-${name}`, scope: blocked.scope.project_id, created_at: blocked.now(), updated_at: blocked.now() }, [], [], { db: blocked.db });
      blocked.db.prepare("UPDATE autonomy_runs SET metadata_json=? WHERE run_id=?").run(metadata, `other-${name}`);
      await assert.rejects(() => blocked.host(authorization.run_id).run(), /unsettled_project_run/);
      assert.equal(blocked.calls, 0);
      assert.equal((blocked.db.prepare("SELECT metadata_json FROM autonomy_runs WHERE run_id=?").get(`other-${name}`) as any).metadata_json, metadata);
    }
    const restart = await fixture("restart"); const auth = restart.authorizeOnly();
    const host = new StatelessSourceReviewHost({ config: restart.config, now: restart.now, adapter: restart.adapter }, auth.run_id);
    assert.equal(await host.step(), true); assert.equal(await host.step(), true);
    const stored = canonical(host.read().run.steps[1]); assert.equal(restart.calls, 1);
    // No source reread is needed by the next judgment; exact bytes are in SQLite.
    rmSync(path.join(restart.projectRoot, "entry.ts"));
    const resumeInput = path.join(root, "resume.json");
    writeFileSync(resumeInput, JSON.stringify({ config: restart.config, run_id: auth.run_id, at: restart.now() }));
    const childEnvironment = { ...process.env }; delete childEnvironment.OPENAI_API_KEY;
    const child = spawnSync(process.execPath, ["--import", "tsx", "scripts/test-stateless-source-review.ts", "--resume", resumeInput], {
      cwd: process.cwd(), env: childEnvironment, timeout: 20_000, encoding: "utf8", maxBuffer: 256 * 1024 });
    assert.equal(child.status, 0, child.stderr || String(child.error));
    const childResult = JSON.parse(child.stdout.trim()); assert.equal(childResult.calls, 1); assert.equal(childResult.external_requests, 0);
    assert.equal(childResult.observation.sources[0].text, sourceText.trimEnd());
    const resumed = host.read(); assert.equal(resumed.run.status, "completed");
    assert.equal(canonical(resumed.run.steps[1]), stored); assert.equal(resumed.run.run_id, auth.run_id);
    await restart.call({ action: "continue", run_id: auth.run_id }); assert.equal(restart.calls, 1);
    for (const choice of ["no_action", "defer"]) {
      const unused = await fixture(`nonuse-${choice}`, choice, "decline_observation");
      const unusedResult = (await unused.call({ action: "authorize_and_run", authorization: unused.preview })).result;
      assert.equal(unusedResult.run.status, "completed"); assert.equal(unusedResult.run.steps[1].output.action_bundles, 0);
      assert.equal(unused.inputs[1].observation.availability, "not_used");
    }
    const unknown = await fixture("dispatch-unknown"); unknown.loseDispatch();
    const lost = (await unknown.call({ action: "authorize_and_run", authorization: unknown.preview })).result;
    assert.equal(unknown.calls, 1); assert.equal(lost.stage, "dispatch_outcome_unknown");
    const again = (await unknown.call({ action: "continue", run_id: lost.run.run_id })).result;
    assert.equal(unknown.calls, 1); assert.equal(again.stage, "dispatch_outcome_unknown");
    assert.equal(again.run.steps[0].output.failure_receipt.egress_attempted, true);
    assert.equal(again.run.status, "paused"); assert.equal(again.run.steps[0].status, "running");
    assert.equal(again.run.metadata.reconciliation_required, true);
    assert.equal(again.run.steps[0].output.dispatch_outcome, "unknown"); assert.equal(again.run.steps[0].output.received_model_result, null);
    assert.equal(again.run.steps[0].output.failure_receipt.usage, null);
    assert.deepEqual(again.run.steps, lost.run.steps, "Continuation preserves the exact unknown claim without replay");
    const actionUnknown = await fixture("action-dispatch-unknown"); const au = actionUnknown.authorizeOnly(); const auh = actionUnknown.host(au.run_id);
    await auh.step();
    // Isolated fault injection represents a process disappearing after the
    // action claim and before a durable result. It is not a positive grant path.
    updateAutonomyRunStepLedgerFields(auh.read().run.steps[1]!.step_id, { status: "running", output: { generation: "lost-action-controller" } }, { db: actionUnknown.db });
    const actionLost = await auh.run(); assert.equal(actionLost.stage, "dispatch_outcome_unknown");
    assert.equal(actionLost.run.steps[1]!.output.action_bundles, undefined); assert.equal(actionUnknown.calls, 1);
    await auh.run(); assert.equal(actionUnknown.calls, 1);
    const changed = await fixture("changed-source"); const ch = changed.authorizeOnly();
    writeFileSync(path.join(changed.projectRoot, "entry.ts"), "changed\n");
    const chost = new StatelessSourceReviewHost({ config: changed.config, now: changed.now, adapter: changed.adapter }, ch.run_id);
    await assert.rejects(() => chost.run(), /source_changed_before_judgment/); assert.equal(changed.calls, 0);
    const expired = await fixture("expiry"); const exp = expired.authorizeOnly(); expired.tick(600_001);
    const ehost = new StatelessSourceReviewHost({ config: expired.config, now: expired.now, adapter: expired.adapter }, exp.run_id);
    await assert.rejects(() => ehost.run(), /grant_source_or_permission_changed/); assert.equal(expired.calls, 0);
    const stop = await fixture("stop", "stop");
    const stopped = (await stop.call({ action: "authorize_and_run", authorization: stop.preview })).result;
    assert.equal(stop.calls, 1); assert.equal(stopped.run.status, "stopped");
    assert.deepEqual(stopped.run.steps.map((s: any) => s.status), ["completed", "skipped", "skipped"]);

    const cancelled = await fixture("cancelled"); const ca = cancelled.authorizeOnly();
    const chost2 = cancelled.host(ca.run_id); await chost2.step(); await chost2.step();
    const beforeCancel = canonical(chost2.read().run.steps[1]);
    await cancelled.call({ action: "cancel", run_id: ca.run_id });
    await cancelled.call({ action: "continue", run_id: ca.run_id });
    assert.equal(cancelled.calls, 1); assert.equal(canonical(chost2.read().run.steps[1]), beforeCancel);

    const revoked = await fixture("revoked"); const rev = revoked.authorizeOnly(); const rh = revoked.host(rev.run_id);
    await rh.step(); await rh.step();
    const active = readActiveProjectSelectionV01(revoked.db, revoked.scope.workspace_id)!;
    mutateProjectControlV01(revoked.db, { ...revoked.scope, action: "disable_automation", expected_active_project_id: revoked.scope.project_id,
      expected_active_selection_revision: active.selection_revision, expected_control_revision: 1 }, { now: revoked.now });
    await assert.rejects(() => rh.run(), /grant_source_or_permission_changed/); assert.equal(revoked.calls, 1);

    const wrongRoot = await fixture("wrong-root"); const wr = wrongRoot.authorizeOnly();
    renameSync(wrongRoot.projectRoot, `${wrongRoot.projectRoot}-original`); mkdirSync(wrongRoot.projectRoot);
    await assert.rejects(() => wrongRoot.host(wr.run_id).run(), /grant_source_or_permission_changed/); assert.equal(wrongRoot.calls, 0);
    assert.throws(() => new StatelessSourceReviewHost({ config: { ...normal.config, project_id: `project:${randomUUID()}` }, adapter: normal.adapter }, result.run.run_id).read(), /run_scope_invalid/);

    const irrelevant = await fixture("changed-after-choose", "read_selected_sources", "defer"); const ir = irrelevant.authorizeOnly(); const ih = irrelevant.host(ir.run_id);
    await ih.step(); writeFileSync(path.join(irrelevant.projectRoot, "entry.ts"), "changed meaning\n");
    await ih.run(); assert.equal(irrelevant.inputs[1].observation.availability, "conflicting"); assert.equal(irrelevant.inputs[1].observation.sources.length, 0);

    const during = await fixture("cancel-during-dispatch"); const dur = during.authorizeOnly(); const dh = during.host(dur.run_id);
    during.controls.dispatch = async () => { dh.cancel(during.credential()); };
    const dr = await dh.run(); assert.equal(during.calls, 1); assert.equal(dr.run.status, "cancelled"); assert.equal(dr.run.steps[0]!.status, "completed");

    const stale = await fixture("stale-generation"); const st = stale.authorizeOnly(); const sh = stale.host(st.run_id);
    stale.controls.dispatch = async () => { // Explicit isolated corruption: the old controller must not overwrite a successor fence.
      const step = sh.read().run.steps[0]!;
      updateAutonomyRunStepLedgerFields(step.step_id, { output: { ...step.output, generation: "successor-fence" } }, { db: stale.db });
    };
    await assert.rejects(() => sh.run(), /stale_generation_result_refused/);
    assert.equal(sh.read().stage, "dispatch_outcome_unknown"); await sh.run(); assert.equal(stale.calls, 1);

    const budget = await fixture("budget");
    await budget.call({ action: "preview", pricing: { input_nano_usd_per_byte: 1000, output_nano_usd_per_token: 1000, maximum_total_nano_usd: 1, source_version: "below-bound" } }, 409);
    const ba = budget.authorizeOnly(); budget.controls.outputTokens = 1025;
    await assert.rejects(() => budget.host(ba.run_id).run()); assert.equal(budget.calls, 1);
    const budgetSaved = budget.host(ba.run_id).read();
    assert.equal(budgetSaved.stage, "finished"); assert.equal(budgetSaved.run.status, "stopped");
    const budgetStep = budgetSaved.run.steps[0]!;
    assert.equal(budgetStep.status, "failed"); assert.equal(budgetStep.output.dispatch_outcome, "returned_invalid");
    const failure = budgetStep.output.failure_receipt as any, received = budgetStep.output.received_model_result as any;
    assert.equal(failure.failure_code, "model_gateway_budget_refused"); assert.equal(failure.status, "blocked"); assert.equal(failure.egress_attempted, true);
    assert.equal(failure.cost.basis, "unavailable"); assert.equal(failure.cost.amount, null);
    assert.deepEqual(received.usage, { basis: "provider_report", quality: "reported", source: "provider_response", input_tokens: 200, output_tokens: 1025, total_tokens: 1225 });
    assert.equal(budgetSaved.receipt, null, "Rejected output is not a successful work receipt");
    const budgetAgain = (await budget.call({ action: "continue", run_id: ba.run_id })).result;
    assert.deepEqual(budgetAgain.run, budgetSaved.run); assert.equal(budget.calls, 1);

    const invalid = await fixture("invalid-choice", "run_arbitrary_command"); const inv = invalid.authorizeOnly();
    await assert.rejects(() => invalid.host(inv.run_id).run());
    const invalidState = invalid.host(inv.run_id).read(); assert.equal(invalidState.run.status, "stopped"); assert.equal(invalidState.run.steps[0]!.output.dispatch_outcome, "returned_invalid");

    const preEgress = await fixture("cancel-before-egress"); const pe = preEgress.authorizeOnly();
    const pa: ModelAdapterV01 = { ...preEgress.adapter, async prepare(purpose, signal) {
      const session = await preEgress.adapter.prepare(purpose, signal);
      await preEgress.call({ action: "cancel", run_id: pe.run_id }); return session;
    } };
    await assert.rejects(() => preEgress.host(pe.run_id, pa).run()); assert.equal(preEgress.calls, 0);
    assert.equal(preEgress.host(pe.run_id).read().run.steps[0]!.output.dispatch_outcome, "not_issued");
    const preEgressSaved = preEgress.host(pe.run_id).read(); assert.equal(preEgressSaved.run.steps[0]!.status, "failed");
    assert.equal(preEgressSaved.run.steps[0]!.output.received_model_result, null);
    assert.deepEqual((await preEgress.call({ action: "continue", run_id: pe.run_id })).result.run, preEgressSaved.run); assert.equal(preEgress.calls, 0);

    const wrongPurpose = await fixture("pre-egress-invalid-purpose"); const wp = wrongPurpose.authorizeOnly();
    // Negative adapter configuration fault: response-invalid can originate
    // before invoke, so the error code alone cannot prove a received response.
    const wrongPurposeAdapter: ModelAdapterV01 = { ...wrongPurpose.adapter, async prepare(purpose, signal) {
      const session = await wrongPurpose.adapter.prepare(purpose, signal);
      return session ? { ...session, purpose: "observe_delta_compile" } : null;
    } };
    await assert.rejects(() => wrongPurpose.host(wp.run_id, wrongPurposeAdapter).run());
    const wrongPurposeSaved = wrongPurpose.host(wp.run_id).read(), wrongPurposeOutput = wrongPurposeSaved.run.steps[0]!.output;
    assert.equal((wrongPurposeOutput.failure_receipt as any).failure_code, "model_gateway_provider_response_invalid");
    assert.equal((wrongPurposeOutput.failure_receipt as any).egress_attempted, false);
    assert.equal(wrongPurposeOutput.dispatch_outcome, "not_issued"); assert.equal(wrongPurposeOutput.received_model_result, null);
    assert.deepEqual((await wrongPurpose.call({ action: "continue", run_id: wp.run_id })).result.run, wrongPurposeSaved.run); assert.equal(wrongPurpose.calls, 0);

    const corrupt = await fixture("stored-result-corruption"); const co = corrupt.authorizeOnly(); const coh = corrupt.host(co.run_id);
    await coh.step(); await coh.step();
    updateAutonomyRunStepLedgerFields(coh.read().run.steps[1]!.step_id, { output: { forged: true } }, { db: corrupt.db });
    await assert.rejects(() => coh.run(), /stored_result_changed/); assert.equal(corrupt.calls, 1);

    const direction = await fixture("direction-changed"); const di = direction.authorizeOnly(); const dih = direction.host(di.run_id);
    await dih.step(); await dih.step();
    await direction.direction({ action: "decide", expected_ref: null, content: { purpose: "Different source question", criteria: [], constraints: [] }, reason: "Change current direction", status: "active", proposal_ref: null });
    await assert.rejects(() => dih.run()); assert.equal(direction.calls, 1);

    const audit = await fixture("actual-entrypoints", "read_selected_sources", "use_observation", true);
    const ar = (await audit.call({ action: "authorize_and_run", authorization: audit.preview })).result;
    assert.equal(ar.run.status, "completed", ar.run.stop_reason); assert.equal(audit.inputs[1].observation.sources.length, 2);
    const actualObservation = audit.inputs[1].observation;
    assert.equal(actualObservation.bytes_read, readFileSync("lib/vnext/automation/policy-triggered-planner-run.ts").length + readFileSync("lib/vnext/runtime/prospective-reentry.ts").length);
    assert.ok(actualObservation.sources[0].text.includes("external_action_performed: false"));
    assert.ok(actualObservation.sources[1].text.includes("source_bound_result_reentry"));
    assert.throws(() => previewActivePortableProjectV01(normal.db), /portable_stateless_review_not_supported/);
    const recovery = await fixture("recovery"); const ra = recovery.authorizeOnly(); const rrh = recovery.host(ra.run_id);
    await rrh.step(); await rrh.step();
    const backup = await (createRecoveryBackup as unknown as (input: {
      databasePath: string; backupDirectory: string; applicationScopeFingerprint: string;
      sourceApplication: { application_version: string; build_identity: string; package_contract: string; package_contract_version: number; runtime_contract: string; runtime_schema_version: number };
      reason: string; inspectDatabase: typeof inspectRecoveryDatabaseFile; now: () => Date;
    }) => Promise<{ backupPath: string }>)({ databasePath: recovery.config.database_path, backupDirectory: path.join(root, "backups"), applicationScopeFingerprint: "a".repeat(64),
      sourceApplication: { application_version: "0.1.1", build_identity: hash("stateless-development"), package_contract: "augnes.distributable.v1", package_contract_version: 1, runtime_contract: "augnes-local-runtime-supervisor-v1", runtime_schema_version: 2 },
      reason: "manual_recovery", inspectDatabase: inspectRecoveryDatabaseFile, now: () => new Date(recovery.now()) });
    const recoveredPath = path.join(backup.backupPath, RECOVERY_DATABASE_PAYLOAD);
    const recovered = new Database(recoveredPath);
    try { assert.equal(validateRecoveryCanonicalDatabaseV01(recovered).status, "valid"); } finally { recovered.close(); }
    const suspended = new StatelessSourceReviewHost({ config: { ...recovery.config, database_path: recoveredPath }, now: recovery.now, adapter: recovery.adapter }, ra.run_id);
    assert.equal((await suspended.run()).stage, "recovery_suspended"); assert.equal(recovery.calls, 1);
    assert.equal(canonical(suspended.read().run.steps), canonical(rrh.read().run.steps));
    assert.equal(requests, 0);
    console.log(JSON.stringify({ status: "passed", normal_model_calls: normal.calls, action_bundles: 1, restart_model_calls: restart.calls + childResult.calls, fresh_process: true,
      ordinary_successor_authored: true, successor_execution_granted: false, unsettled_ledger_contract: "preserved",
      returned_over_budget: "returned_invalid_no_retry", pre_egress_refusal: "not_issued_no_retry", transport_loss: "unknown_no_retry",
      audit_source_bytes: actualObservation.bytes_read, audit_preparation_bytes: audit.preparationBytes + ar.run.metadata.authorization_preparation_bytes + ar.run.steps[0].output.preparation_bytes, audit_excerpt_bytes: actualObservation.sources.reduce((n: number, f: any) => n + Buffer.byteLength(f.text), 0), completed_action_replays: 0, unknown_dispatch_retries: 0, external_requests: requests, actual_model_judgment: "NOT RUN", usefulness: "NOT RUN" }));
  } finally { for (const db of databases) db.close(); rmSync(root, { recursive: true, force: true }); network.unsubscribe(onNetwork); }
}
async function resumeChild(filename: string) {
  try {
    const { config, run_id, at } = JSON.parse(readFileSync(filename, "utf8"));
    const script = scripted(); const result = await new StatelessSourceReviewHost({ config, now: () => at, adapter: script.adapter }, run_id).run();
    assert.equal(result.run.status, "completed"); assert.equal(requests, 0);
    console.log(JSON.stringify({ calls: script.calls, observation: script.inputs[0].observation, external_requests: requests }));
  } finally { rmSync(root, { recursive: true, force: true }); network.unsubscribe(onNetwork); }
}
void (process.argv[2] === "--resume" ? resumeChild(process.argv[3]!) : main()).catch(e => { console.error(e); process.exitCode = 1; });
