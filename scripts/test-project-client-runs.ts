import { NativeHostReconciliationRequiredErrorV01 } from "../lib/vnext/native-host/native-host-contract";
import { readProjectWorkBindingV01 } from "../lib/vnext/runtime/project-work-binding";
import { recordWorkExpectationMaterial } from "../lib/vnext/runtime/work-expectation";
import { deriveCriterionIdentityV01 } from "../lib/vnext/criterion-identity";
import { createVNextOperatorHostRoundTripHandlerV01, createVNextOperatorHostRoundTripReadHandlerV01 } from "../app/api/vnext/operator/host-round-trip/route";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, realpathSync, rmSync, renameSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import Database from "better-sqlite3";
import { applyCanonicalDatabaseMigrations } from "./canonical-database-migrations.mjs";
import { normalizeLocalProjectRootRefV01 } from "../lib/vnext/persistence/project-identity-registry";
import { getOrCreateCanonicalProjectForLocalRootV01, getOrCreateDefaultWorkspaceIdentityV01 } from "../lib/vnext/persistence/project-identity-registry";
import { readActiveProjectSelectionV01, selectActiveProjectV01 } from "../lib/vnext/persistence/project-lifecycle-registry";
import { consumeVNextLocalOperatorBootstrapV01, issueVNextLocalOperatorBootstrapV01, readVNextLocalOperatorCredentialFromRequestV01, VNEXT_LOCAL_OPERATOR_SESSION_COOKIE_V01, serializeVNextLocalOperatorSessionCookieV01, type VNextLocalOperatorPilotConfigV01, type VNextLocalOperatorSessionCredentialV01 } from "../lib/vnext/runtime/local-operator-session";
import { defineInitialProjectWorkV01, readProjectWorkInitializationV01 } from "../lib/vnext/runtime/project-work-initialization";
import { readWorkExpectationDraft, workExpectationBindingKey } from "../components/workbench/semantic-review/work-expectation-draft";
import { LiveNativeHostRunServiceV01, type LiveNativeHostRunProjectionV01 } from "../lib/vnext/runtime/live-native-host-run-service";
import { createDeterministicCodexAdapterV01 } from "../lib/vnext/native-host/deterministic-codex-adapter";
import { readAutonomyRunLedgerRecord } from "../lib/autonomy/runner-ledger";
import type { NativeHostAdapterV01, NativeHostInvocationControlV01, NativeHostRequestV01 } from "../types/vnext/native-host-adapter";
import type { ExternalRefV01 } from "../types/vnext/external-ref";

const root = realpathSync(mkdtempSync(path.join(tmpdir(), "augnes-client-runs-")));
const databasePath = path.join(root, "workspace.db");
const at = "2026-08-01T00:00:20.000Z";
const clock = { now: () => at };
const db = new Database(databasePath);
let service: LiveNativeHostRunServiceV01 | undefined;
const gates = new Map<string, ReturnType<typeof barrier>>();
const disconnect = new Set<string>();
const invocations = new Map<string, { request: NativeHostRequestV01; control: NativeHostInvocationControlV01 }>();
let opened = 0;
let closed = 0;

function barrier() { let release!: () => void; const promise = new Promise<void>(resolve => { release = resolve; }); return { promise, release }; }
function credential(value: string): VNextLocalOperatorSessionCredentialV01 { return readVNextLocalOperatorCredentialFromRequestV01(new Request("http://127.0.0.1", { headers: { cookie: `${VNEXT_LOCAL_OPERATOR_SESSION_COOKIE_V01}=${value}` } })); }
function select(project_id: string) { const previous = readActiveProjectSelectionV01(db, workspace.workspace_id); selectActiveProjectV01(db, { workspace_id: workspace.workspace_id, project_id, expected_project_id: previous?.project_id ?? null, expected_revision: previous?.selection_revision ?? null, now: at }); }
function hostRef(kind: string, request: NativeHostRequestV01): ExternalRefV01 { return { ref_version: "external_ref.v0.1", ref_type: kind, external_id: `${kind}:${request.project_id}`, provider: "codex", host: "app_server", observed_at: at, trust_class: "direct_local_observation", compatibility_namespace: "client-runs-test.v0.1" }; }
async function event(projectId: string, index: number) { const { request, control } = invocations.get(projectId)!; await control.lifecycle_sink!.report_event({ event_id: `native-host-event:${projectId}:${index}`, run_id: request.run_id, state: "running", event_kind: "thread_status_changed", observed_at: at, coverage: "observed", host_refs: [hostRef("host_thread", request), hostRef("host_turn", request)], bounded_metadata: { progress: index } }); }
function openDatabase() { const connection = new Database(databasePath); connection.pragma("foreign_keys = ON"); opened++; const close = connection.close.bind(connection); connection.close = () => { closed++; return close(); }; return connection; }
async function until(config: VNextLocalOperatorPilotConfigV01, predicate: (value: LiveNativeHostRunProjectionV01) => boolean) { const deadline = performance.now() + 3000; while (performance.now() < deadline) { const projection = service!.read(config); if (predicate(projection)) return projection; await new Promise(resolve => setTimeout(resolve, 1)); } throw new Error("project_run_did_not_settle"); }

db.pragma("foreign_keys = ON");
applyCanonicalDatabaseMigrations(db);
const workspace = getOrCreateDefaultWorkspaceIdentityV01(db);
function project(name: string) {
  const projectRoot = path.join(root, name); mkdirSync(projectRoot);
  const registration = getOrCreateCanonicalProjectForLocalRootV01(db, { workspace_id: workspace.workspace_id, local_root: normalizeLocalProjectRootRefV01(projectRoot, { base_path: root }), display_name: name });
  const config: VNextLocalOperatorPilotConfigV01 = { enabled: true, workspace_id: workspace.workspace_id, project_id: registration.project.project_id, operator_id: "operator:project-client-runs", database_path: databasePath };
  select(config.project_id);
  const issue = issueVNextLocalOperatorBootstrapV01(db, { config, clock: { now: () => "2026-08-01T00:00:00.000Z" } });
  const session = consumeVNextLocalOperatorBootstrapV01(db, { config, bootstrap_token: issue.bootstrap_token, clock: { now: () => "2026-08-01T00:00:01.000Z" } });
  const result = defineInitialProjectWorkV01(db, { config, credential: session.credential, clock: { now: () => "2026-08-01T00:00:09.000Z" }, request: { action: "define_initial_project_work", workspace_id: config.workspace_id, project_id: config.project_id, expected_active_project_id: config.project_id, expected_active_selection_revision: readActiveProjectSelectionV01(db, config.workspace_id)!.selection_revision, expected_initialization_state: "not_defined", goal: `Inspect ${name} in its physical root`, success_criteria: ["The intended project retains the result"], non_goals: ["No network or file writes"] } });
  gates.set(config.project_id, barrier());
  return { config, projectRoot, credential: credential(result.session_admission.cookie_value), packet: result.packet, binding: readProjectWorkBindingV01(db, config)!, selection: readActiveProjectSelectionV01(db, config.workspace_id)!.selection_revision };
}

void (async () => {
  try {
    const a = project("A"); const b = project("B");
    const initialization = readProjectWorkInitializationV01(db, a.config), drafts = new Map<string, Map<string, unknown>>();
    const draft = readWorkExpectationDraft(drafts, initialization, a.config)!;
    draft.set("expectationReason", "A's retained forecast"); draft.set("expectationConditions", "A's original conditions");
    assert.equal(readWorkExpectationDraft(drafts, initialization, null), undefined);
    assert.equal(readWorkExpectationDraft(drafts, initialization, b.config), undefined);
    assert.equal(readWorkExpectationDraft(drafts, initialization, { ...a.config, operator_id: "operator:other" })!.has("expectationReason"), false);
    assert.equal(readWorkExpectationDraft(drafts, initialization, { ...a.config }), draft);
    assert.equal(workExpectationBindingKey({ ...initialization, active_project_id: b.config.project_id, active_selection_revision: null }), workExpectationBindingKey(initialization));
    assert.notEqual(workExpectationBindingKey({ ...initialization, project_work_binding: "different-root" }), workExpectationBindingKey(initialization));
    assert.notEqual(workExpectationBindingKey({ ...initialization, current_packet: { ...initialization.current_packet!, packet_fingerprint: "different-work" } }), workExpectationBindingKey(initialization));
    const base = createDeterministicCodexAdapterV01({ now: () => at });
    const adapter: NativeHostAdapterV01 = { ...base, invoke(request, control) {
      invocations.set(request.project_id, { request, control });
      const gate = gates.get(request.project_id)!;
      const stopped = () => gate.release();
      control.cancellation_signal.addEventListener("abort", stopped, { once: true });
      const result = gate.promise.then(() => { if (disconnect.delete(request.project_id)) throw new NativeHostReconciliationRequiredErrorV01("test_transport_disconnected"); return base.invoke(request, control).result; }).finally(() => control.cancellation_signal.removeEventListener("abort", stopped));
      const settled = result.then(() => undefined, () => undefined);
      return { result, settled, request_stop: async () => { gate.release(); await settled; } };
    } };
    service = new LiveNativeHostRunServiceV01({ adapter_factory: () => adapter, open_database: openDatabase, now: () => at, timeout_ms: 20_000 });
    const environment: NodeJS.ProcessEnv = { NODE_ENV: "test", AUGNES_VNEXT_OPERATOR_PILOT_ENABLED: "1", AUGNES_VNEXT_OPERATOR_WORKSPACE_ID: a.config.workspace_id, AUGNES_VNEXT_OPERATOR_PROJECT_ID: a.config.project_id, AUGNES_VNEXT_OPERATOR_ID: a.config.operator_id, AUGNES_DB_PATH: databasePath };
    const options = { environment, clock, open_database: openDatabase, live_service: service };
    const post = createVNextOperatorHostRoundTripHandlerV01(options);
    const get = createVNextOperatorHostRoundTripReadHandlerV01(options);
    const cookies = new Map<string, string>();
    function storeCookie(cookie: string) { const pair = cookie.split(";")[0]; const i = pair.indexOf("="); cookies.set(pair.slice(0, i), pair.slice(i + 1)); }
    function putCredential(p: typeof a, value: string) { storeCookie(serializeVNextLocalOperatorSessionCookieV01({ value, expires_at: "2026-08-01T02:00:00.000Z", max_age_seconds: 3600, secure: false, request: new Request("http://127.0.0.1", { headers: { "Augnes-Project-Id": p.config.project_id } }) })); }
    async function route(p: typeof a, body?: Record<string, unknown>) {
      const request = new Request("http://127.0.0.1/api/vnext/operator/host-round-trip", { method: body ? "POST" : "GET", headers: { host: "127.0.0.1", "Augnes-Project-Id": p.config.project_id, origin: "http://127.0.0.1", "content-type": "application/json", cookie: [...cookies].map(([name, value]) => `${name}=${value}`).join("; ") }, ...(body ? { body: JSON.stringify(body) } : {}) });
      const response = await (body ? post : get)(request);
      const result = await response.json(); assert(response.ok, `${response.status}:${result.error_code}`);
      const setCookie = response.headers.get("set-cookie"); if (setCookie) { storeCookie(setCookie); p.credential = credential(setCookie.split(";")[0].split("=").slice(1).join("=")); }
      return result;
    }
    const start = (p: typeof a) => service!.start({ config: p.config, mode: "interactive", operator_mutation: { credential: p.credential, clock } });
    const expectation = recordWorkExpectationMaterial(db, { config: a.config, credential: a.credential,
      clock: { now: () => "2026-08-01T00:00:11.000Z" }, request: { action: "record_work_expectation", expected_active_project_id: a.config.project_id,
        expected_active_selection_revision: a.selection, expected_project_work_binding: a.binding, expected_previous_id: null,
        expected_packet_id: a.packet.packet_id, expected_packet_fingerprint: a.packet.integrity.fingerprint,
        criterion_id: deriveCriterionIdentityV01(a.packet.task.success_criteria[0]), predicted_outcome: "satisfied", reason: "This target retains its result", conditions: "Its relevant work remains unchanged" } });
    a.credential = credential(expectation.session_admission.cookie_value);
    assert.equal(expectation.record.project_id, a.config.project_id);
    const startedA = await start(a); a.credential = credential(startedA.session_admission!.cookie_value);
    await event(a.config.project_id, 1);
    const startedB = await start(b); b.credential = credential(startedB.session_admission!.cookie_value);
    await event(b.config.project_id, 1);
    putCredential(a, startedA.session_admission!.cookie_value); putCredential(b, startedB.session_admission!.cookie_value);
    assert.equal(cookies.size, 2);
    assert.equal((await route(a)).live_run.run_ref, startedA.projection.run_ref);
    assert.equal((await route(b)).live_run.run_ref, startedB.projection.run_ref);
    assert.equal(invocations.size, 2);
    assert.notEqual(invocations.get(a.config.project_id)!.request.root_scope.canonical_root, invocations.get(b.config.project_id)!.request.root_scope.canonical_root);
    assert.equal(service.read(a.config).status, "running"); assert.equal(service.read(b.config).status, "running");
    await event(a.config.project_id, 2); await event(b.config.project_id, 2);
    select(a.config.project_id); await event(b.config.project_id, 3); select(b.config.project_id);
    const aRequest = invocations.get(a.config.project_id)!.request;
    const approval = { approval_version: "native_host_approval.v0.1" as const, approval_id: "native-host-approval:project-a", idempotency_fingerprint: `sha256:${"1".repeat(64)}`, workspace_id: a.config.workspace_id, project_id: a.config.project_id, run_id: aRequest.run_id, packet_id: aRequest.packet.packet_id, packet_fingerprint: aRequest.packet.integrity.fingerprint, host_thread_ref: hostRef("host_thread", aRequest), host_turn_ref: hostRef("host_turn", aRequest), host_item_ref: hostRef("host_item", aRequest), host_request_ref: hostRef("host_approval_request", aRequest), operation_class: "command_execution" as const, repository_relative_paths: [], network_resources: [], command_summary: "Inspect the project", command_fingerprint: null, resource_summary: "This project only", public_reason: "A bounded test decision is requested", public_risk_summary: "No commands execute in the deterministic adapter", budget_impact: null, available_decisions: ["approve_once", "decline", "cancel_run"] as ("approve_once" | "decline" | "cancel_run")[], issued_at: at, expires_at: null, coverage: "observed" as const };
    const decisionPromise = invocations.get(a.config.project_id)!.control.lifecycle_sink!.request_approval(approval);
    const pending = service.read(a.config);
    assert.equal(pending.status, "waiting_for_approval"); assert(pending.pending_approval);
    await assert.rejects(service.decide({ config: b.config, credential: b.credential, run_ref: aRequest.run_id, approval_ref: approval.approval_id, control_revision: pending.pending_approval.control_revision, decision: "approve_once", clock }), /live_host_run_scope_mismatch/);
    await assert.rejects(service.decide({ config: a.config, credential: b.credential, run_ref: aRequest.run_id, approval_ref: approval.approval_id, control_revision: pending.pending_approval.control_revision, decision: "approve_once", clock }), /operator_session_scope_mismatch/);
    await route(a, { action: "approve_once", run_ref: aRequest.run_id, approval_ref: approval.approval_id, control_revision: pending.pending_approval.control_revision });
    assert.equal((await decisionPromise).decision, "approve_once");
    await invocations.get(a.config.project_id)!.control.lifecycle_sink!.report_event({ event_id: "native-host-event:a-approval-resolved", run_id: aRequest.run_id, state: "running", event_kind: "approval_resolved", observed_at: at, coverage: "observed", host_refs: [hostRef("host_thread", aRequest), hostRef("host_turn", aRequest)], bounded_metadata: { approval_id: approval.approval_id, approval_fingerprint: approval.idempotency_fingerprint } });
    disconnect.add(a.config.project_id); gates.get(a.config.project_id)!.release();
    await until(a.config, value => value.status === "paused");
    // Wait for the existing lifecycle owner to release the stopped invocation.
    const releasedBy = performance.now() + 3000;
    while (service.readRepositoryControllerObservationV01(a.config, aRequest.run_id).owned) {
      assert(performance.now() < releasedBy, "paused controller must release ownership");
      await new Promise(resolve => setImmediate(resolve));
    }
    assert.equal((await route(a)).live_run.status, "paused");
    assert.equal((await route(b)).live_run.status, "running");
    const paused = service.read(a.config); gates.set(a.config.project_id, barrier());
    const resumed = await route(a, { action: "resume", run_ref: aRequest.run_id, control_revision: paused.control_revision });
    assert.equal(resumed.live_run.run_ref, aRequest.run_id);
    assert(invocations.get(a.config.project_id)!.control.resume_binding);
    await event(a.config.project_id, 5);
    const aProjection = service.read(a.config);
    await assert.rejects(service.cancel({ config: a.config, credential: a.credential, run_ref: aRequest.run_id, control_revision: aProjection.control_revision - 1, clock }), /live_host_control_revision_conflict/);
    const movedRoot = `${a.projectRoot}-moved`; renameSync(a.projectRoot, movedRoot);
    await assert.rejects(service.cancel({ config: a.config, credential: a.credential, run_ref: aRequest.run_id, control_revision: aProjection.control_revision, clock }));
    mkdirSync(a.projectRoot);
    await assert.rejects(service.cancel({ config: a.config, credential: a.credential, run_ref: aRequest.run_id, control_revision: aProjection.control_revision, clock }), /live_host_root_binding_mismatch/);
    rmSync(a.projectRoot, { recursive: true }); renameSync(movedRoot, a.projectRoot);
    await assert.rejects(service.cancel({ config: a.config, credential: a.credential, run_ref: aRequest.run_id, control_revision: aProjection.control_revision, clock: { now: () => "2026-08-02T00:00:00.000Z" } }), /operator_session_expired/);
    await route(a, { action: "cancel", run_ref: aRequest.run_id, control_revision: aProjection.control_revision });
    await until(a.config, value => value.status === "cancelled");
    assert.equal(invocations.get(b.config.project_id)!.control.cancellation_signal.aborted, false);
    assert.equal((await route(b)).live_run.status, "running");
    await event(b.config.project_id, 4);
    gates.get(b.config.project_id)!.release();
    await until(b.config, value => value.status === "completed");
    await service.shutdown();
    const fresh = new LiveNativeHostRunServiceV01({ open_database: openDatabase, now: () => at });
    assert.equal(fresh.read(a.config).status, "cancelled"); assert.equal(fresh.read(b.config).status, "completed");
    assert.equal(readAutonomyRunLedgerRecord(aRequest.run_id, { db })!.scope, a.config.project_id);
    assert.equal(readAutonomyRunLedgerRecord(startedB.projection.run_ref!, { db })!.scope, b.config.project_id);
    assert.equal(opened, closed);
    console.log(JSON.stringify({ test: "project-client-runs", status: "pass", mode: "interactive", adapter: "deterministic_zero_model", overlapping_projects: 2, physical_roots: 2, progress_interleaving: "A1 B1 A2 B2 B3 disconnectA resumeA A5 cancelA B4", inactive_project_approval_cancel_and_resume: true, authenticated_route_controls: true, shared_cookie_jar_projects: cookies.size, retained_refusals: ["wrong_project_run", "wrong_project_credential", "stale_control_revision", "missing_root", "replaced_physical_root", "expired_session"], bound_expectation_while_other_selected: true, cancelled_a_b_completed: true, fresh_scoped_readback: true, owned_databases_closed: opened, provider_calls: 0 }));
  } finally { for (const gate of gates.values()) gate.release(); await service?.shutdown(); db.close(); rmSync(root, { recursive: true, force: true }); }
})().catch(error => { console.error(error); process.exitCode = 1; });
