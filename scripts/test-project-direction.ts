import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, realpathSync, writeFileSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import Database from "better-sqlite3";
import { applyCanonicalDatabaseMigrations } from "./canonical-database-migrations.mjs";
import { getOrCreateDefaultWorkspaceIdentityV01, getOrCreateCanonicalProjectForLocalRootV01, normalizeLocalProjectRootRefV01 } from "../lib/vnext/persistence/project-identity-registry";
import { readActiveProjectSelectionV01, selectActiveProjectV01 } from "../lib/vnext/persistence/project-lifecycle-registry";
import { issueVNextLocalOperatorBootstrapV01, consumeVNextLocalOperatorBootstrapV01, readVNextLocalOperatorCredentialFromRequestV01, VNEXT_LOCAL_OPERATOR_SESSION_COOKIE_V01 } from "../lib/vnext/runtime/local-operator-session";
import { defineInitialProjectWorkV01 } from "../lib/vnext/runtime/project-work-initialization";
import { revisePreExecutionProjectWorkV01 } from "../lib/vnext/runtime/project-work-revision";
import { createProjectDirectionHandler } from "../app/api/vnext/operator/project-direction/route";
import { createAgentProjectDirectionHandler } from "../app/api/vnext/agent/project-direction/route";
import { createProspectiveReentryHandler } from "../app/api/vnext/operator/prospective-reentry/route";
import { assertPacketDirectionCurrent, effectiveDirection, packetDirectionBinding, readProjectDirection, validateProjectDirectionHistory } from "../lib/vnext/persistence/project-direction-store";
import { readVNextCoreRecordV01, listVNextCoreRecordsV01 } from "../lib/vnext/persistence/durable-semantic-store";
import { mutateProjectControlV01, readProjectAutomationControlV01 } from "../lib/vnext/persistence/project-control-store";
import { ProspectiveReentryHost } from "../lib/vnext/runtime/prospective-reentry";
import { buildSelectedWorkSourceEntry, compareSelectedWorkSources, readSelectedWorkSources, selectedWorkSourceInput } from "../lib/intake/selected-work-source-comparison";
import { readResultWorkPreparationV01, compareResultWorkSourcesV01, previewResultWorkV01, defineAuthoredSuccessorTaskV01 } from "../lib/vnext/runtime/authored-successor-task";
import { readAgendaInput, judgeAgenda } from "../lib/vnext/prospective-agenda";
import { canonicalizeProtocolValueV01 as canonical, createProtocolSha256V01 as hash } from "../lib/vnext/protocol-primitives";
import { createRecoveryBackup, RECOVERY_DATABASE_PAYLOAD } from "./recovery-backup.mjs";
import { inspectRecoveryDatabaseFile } from "./runtime-database-bootstrap.mjs";
import { validateRecoveryCanonicalDatabaseV01 } from "./recovery-canonical-record-validator";
import type { TaskContextPacketV01 } from "../types/vnext/task-context-packet";

async function main() {
  const root = realpathSync(mkdtempSync(path.join(tmpdir(), "augnes-direction-")));
  const db = new Database(path.join(root, "direction.db"));
  let host: ProspectiveReentryHost | null = null;
  try {
    db.pragma("foreign_keys=ON"); applyCanonicalDatabaseMigrations(db);
    const workspace = getOrCreateDefaultWorkspaceIdentityV01(db);
    const projectRoot = path.join(root, "human"); mkdirSync(projectRoot);
    const registration = getOrCreateCanonicalProjectForLocalRootV01(db, { workspace_id: workspace.workspace_id, local_root: normalizeLocalProjectRootRefV01(projectRoot, { base_path: root }), display_name: "Human direction case" });
    const scope = { workspace_id: workspace.workspace_id, project_id: registration.project.project_id };
    const config = { ...scope, enabled: true as const, operator_id: "operator:local-review", database_path: path.join(root, "direction.db") };
    selectActiveProjectV01(db, { ...scope, expected_project_id: null, expected_revision: null, now: new Date().toISOString() });
    const active = readActiveProjectSelectionV01(db, scope.workspace_id)!;
    let instant = Date.now() + 5;
    const now = () => new Date(instant).toISOString();
    const tick = () => { instant += 100; };
    const clock = { now };
    const environment = { NODE_ENV: "test" as const, AUGNES_DB_PATH: config.database_path,
      AUGNES_LOCAL_REVIEW_PROFILE: "companion_first_work_v1", AUGNES_RUNTIME_CONTRACT: "augnes-local-runtime-supervisor-v1",
      AUGNES_RUNTIME_CHILD_ROLE: "ui", AUGNES_DISTRIBUTION_MODE: "source" };
    const issue = issueVNextLocalOperatorBootstrapV01(db, { config, clock });
    const session = consumeVNextLocalOperatorBootstrapV01(db, { config, clock, bootstrap_token: issue.bootstrap_token });
    let cookie = `${VNEXT_LOCAL_OPERATOR_SESSION_COOKIE_V01}=${session.cookie_value}`;
    const credential = () => readVNextLocalOperatorCredentialFromRequestV01(new Request("http://127.0.0.1", { headers: { cookie } }));
    const human = createProjectDirectionHandler({ environment, clock });
    const agent = createAgentProjectDirectionHandler({ environment, clock });
    const prospective = createProspectiveReentryHandler({ environment, clock });
    const humanUrl = `http://127.0.0.1/api/vnext/operator/project-direction?project_id=${scope.project_id}`;
    const prospectiveUrl = "http://127.0.0.1/api/vnext/operator/prospective-reentry";
    async function call(route: (request: Request) => Promise<Response>, url: string, body?: unknown, extra: Record<string, string> = {}, expected = 200) {
      const response = await route(new Request(url, { method: body ? "POST" : "GET", headers: { host: "127.0.0.1", origin: "http://127.0.0.1", "content-type": "application/json", cookie, ...extra }, ...(body ? { body: JSON.stringify(body) } : {}) }));
      const value = await response.json();
      assert.equal(response.status, expected, value.error ?? "unexpected response status");
      if (response.ok && response.headers.has("set-cookie")) cookie = response.headers.get("set-cookie")!.split(";")[0]!;
      return value;
    }
    const purpose = (value: string) => ({ purpose: value, criteria: [], constraints: [] });
    const decide = (ref: string | null, value: string) => ({ action: "decide", expected_ref: ref, content: purpose(value), reason: ref ? "Observed priorities changed" : "Initial project question", status: "active", proposal_ref: null });
    const initial = defineInitialProjectWorkV01(db, { config, credential: credential(), clock, request: { action: "define_initial_project_work", ...scope,
      expected_active_project_id: scope.project_id, expected_active_selection_revision: active.selection_revision, expected_initialization_state: "not_defined",
      goal: "Review selected release prerequisites", success_criteria: ["Inspect both sources"], non_goals: ["No publishing"] } });
    cookie = `${VNEXT_LOCAL_OPERATOR_SESSION_COOKIE_V01}=${initial.session_admission.cookie_value}`;
    assert.equal(packetDirectionBinding(db, initial.packet), null, "Legacy no-direction work stays usable");
    assertPacketDirectionCurrent(db, initial.packet, now());
    tick();
    await call(human, humanUrl, decide(null, "Which preparation supports a release review?"), { cookie: "" }, 401);
    await call(human, humanUrl, decide(null, "Which preparation supports a release review?"), { origin: "https://foreign.example" }, 403);
    const first = await call(human, humanUrl, decide(null, "Which preparation supports a release review?"));
    assert.equal(first.state.effective.value.principal.kind, "human");
    assert.equal(first.state.effective.value.created_by, null, "Do not invent legacy project creation attribution");
    assert.throws(() => assertPacketDirectionCurrent(db, initial.packet, now()), /reconsideration_required/);
    tick();
    await call(human, humanUrl, decide(null, "Concurrent stale decision"), {}, 409);
    const firstRef = first.record.ref;
    const independentRoot = path.join(root, "independent"), childRoot = path.join(root, "child"); mkdirSync(independentRoot); mkdirSync(childRoot);
    const allowed = [purpose("Explore a bounded source question"), purpose("Retain the method and investigate its conditions")];
    const policy = await call(human, humanUrl, { action: "authorize_agent", role: "role:researcher", allowed_directions: allowed, max_mutations: 8, expires_in_minutes: 60,
      creation_slots: [{ root: independentRoot, display_name: "Independent agent project", delegation: null },
        { root: childRoot, display_name: "Delegated child", delegation: { expected_parent_ref: firstRef, why: "Separate bounded question", contribution: "Review one prerequisite", return_question: "What should the parent investigate?" } }] });
    // Token is transmitted only in memory between real issuance and admission.
    let token: string = policy.credential;
    const agentUrl = "http://127.0.0.1/api/vnext/agent/project-direction";
    let sequence = 0;
    async function agentCall(projectId: string | null, operation: unknown, expected = 200, seq = sequence) {
      const response = await agent(new Request(agentUrl, { method: "POST", headers: { host: "127.0.0.1", origin: "http://127.0.0.1", "content-type": "application/json", authorization: `Bearer ${token}` },
        body: JSON.stringify({ project_id: projectId, sequence: seq, operation }) }));
      const value = await response.json(); assert.equal(response.status, expected, value.error ?? "agent request failed");
      if (response.ok) sequence = value.sequence;
      return value;
    }
    const spoofed = await agent(new Request(agentUrl, { method: "POST", headers: { host: "127.0.0.1", origin: "http://127.0.0.1", "content-type": "application/json", cookie }, body: JSON.stringify({ actor_kind: "agent" }) }));
    assert.equal(spoofed.status, 401);
    await agentCall(scope.project_id, decide(firstRef, allowed[0]!.purpose), 403);
    const proposal = await agentCall(scope.project_id, { action: "propose", expected_ref: firstRef, content: allowed[0], reason: "Consider an alternative" });
    assert.equal(effectiveDirection(db, scope, now())!.ref, firstRef, "Agent proposal cannot replace the human north star");
    tick();
    const independent = await agentCall(null, { action: "create_project", slot: 0, content: allowed[0], reason: "Authorized independent exploration" });
    assert.equal(independent.state.effective.value.parent, null);
    assert.deepEqual(independent.state.effective.value.created_by, { kind: "agent", id: "role:researcher" });
    tick();
    const concurrentDecision = { project_id: independent.project_id, sequence, operation: { ...decide(independent.record.ref, allowed[1]!.purpose), status: "paused" } };
    const concurrentResponses = await Promise.all([0, 1].map(() => agent(new Request(agentUrl, { method: "POST", headers: {
      host: "127.0.0.1", origin: "http://127.0.0.1", "content-type": "application/json", authorization: `Bearer ${token}` }, body: JSON.stringify(concurrentDecision) }))));
    assert.deepEqual(concurrentResponses.map(r => r.status).sort(), [200, 409], "Exactly one concurrent direction mutation consumes the sequence and prior revision");
    sequence = (await concurrentResponses.find(r => r.status === 200)!.json()).sequence;
    await agentCall(independent.project_id, decide(independent.record.ref, allowed[1]!.purpose), 409, sequence - 1);
    tick();
    const independentCurrent = effectiveDirection(db, { ...scope, project_id: independent.project_id }, now())!;
    await agentCall(independent.project_id, decide(independentCurrent.ref, "Unbounded unrelated goal"), 403);
    await agentCall("project:foreign", decide(null, allowed[0]!.purpose), 403);
    const child = await agentCall(null, { action: "create_project", slot: 1, content: allowed[0], reason: "Authorized separate contribution" });
    assert.equal(child.state.effective.value.parent.project_id, scope.project_id);
    tick();
    await agentCall(child.project_id, { action: "return_proposal", expected_ref: child.record.ref, receipt_id: null, receipt_fingerprint: null, summary: "Propose checking the selected prerequisite; this is not an observed finding." });
    assert.equal(effectiveDirection(db, scope, now())!.ref, firstRef);
    assert(readProjectDirection(db, scope, now()).proposals.some(p => p.value.child_result?.direction_ref === child.record.ref));
    await agentCall(child.project_id, { ...decide(child.record.ref, allowed[0]!.purpose), parent: { project_id: child.project_id } }, 409);
    // A fresh authorized transport reconstructs identical logical authority and history.
    const replacement = createAgentProjectDirectionHandler({ environment, clock });
    const fresh = await replacement(new Request(`${agentUrl}?project_id=${independent.project_id}`, { headers: { host: "127.0.0.1", authorization: `Bearer ${token}` } }));
    assert.equal(fresh.status, 200); assert.deepEqual((await fresh.json()).state, readProjectDirection(db, { ...scope, project_id: independent.project_id }, now()));
    writeFileSync(path.join(projectRoot, "compatibility.txt"), "ready\n"); writeFileSync(path.join(projectRoot, "recovery.txt"), "ready\n");
    tick();
    const prepared = await call(human, humanUrl, { action: "prepare_inspection", expected_ref: firstRef, files: [{ path: "compatibility.txt", contains: "ready" }, { path: "recovery.txt", contains: "ready" }] });
    const packet = readVNextCoreRecordV01(db, { ...scope, record_kind: "task_context_packet", record_id: prepared.packet_id })!.payload as TaskContextPacketV01;
    assert.equal(packet.capability_grant, null); assertPacketDirectionCurrent(db, packet, now());
    // A selected counterobservation is retained as attributed support, not silently
    // reclassified when preference changes. The production comparison/writer owns it.
    tick();
    const counter = buildSelectedWorkSourceEntry(scope, { source: "Contradictory selected observation", label: "New candidate", observed_at: now(), provenance: "imported_unverified",
      text: canonical({ profile: "augnes.prospective-input.v0.1", kind: "observation", key: "independent_counterevidence", availability: "observed", value: false }) });
    const factualComparison = compareSelectedWorkSources(packet, [...readSelectedWorkSources(packet), counter]);
    const factualRevision = revisePreExecutionProjectWorkV01(db, { config, credential: credential(), clock, request: { action: "revise_pre_execution_project_work", ...scope,
      expected_active_project_id: scope.project_id, expected_active_selection_revision: active.selection_revision, expected_current_packet_id: packet.packet_id,
      expected_current_packet_fingerprint: packet.integrity.fingerprint, expected_current_lineage_kind: "pre_execution_user_revision", ...initial.definition,
      selected_source_context: factualComparison.entries, expected_source_comparison: factualComparison.fingerprint } });
    cookie = `${VNEXT_LOCAL_OPERATOR_SESSION_COOKIE_V01}=${factualRevision.session_admission.cookie_value}`;
    const beforeBytes = canonical(packet);
    const beforeCutoff = now();
    const beforeState = readProjectDirection(db, scope, beforeCutoff);
    const beforeJudgment = judgeAgenda(readAgendaInput(readSelectedWorkSources(packet), beforeCutoff)!, beforeCutoff);
    tick();
    const changedAt = now();
    const second = await call(human, humanUrl, decide(firstRef, "Review evidence before choosing a release recommendation"));
    assert.deepEqual(readProjectDirection(db, scope, beforeCutoff), beforeState);
    assert.deepEqual(judgeAgenda(readAgendaInput(readSelectedWorkSources(packet), beforeCutoff)!, beforeCutoff), beforeJudgment);
    for (const time of [new Date(Date.parse(changedAt) - 1).toISOString(), changedAt, new Date(Date.parse(changedAt) + 1).toISOString()]) {
      assert.equal(effectiveDirection(db, scope, time)!.ref, time < changedAt ? firstRef : second.record.ref);
    }
    assert.equal(readProjectDirection(db, scope, now()).pending_work[0]!.needs_reconsideration, true);
    assert.equal(readProjectDirection(db, { ...scope, project_id: child.project_id }, now()).parent_current, false);
    tick(); await agentCall(child.project_id, decide(child.record.ref, allowed[1]!.purpose), 409);
    assert.equal(canonical(readVNextCoreRecordV01(db, { ...scope, record_kind: "task_context_packet", record_id: packet.packet_id })!.payload), beforeBytes);
    assert.throws(() => assertPacketDirectionCurrent(db, packet, now()), /reconsideration_required/);
    const oldToken = token;
    tick();
    const renewed = await call(human, humanUrl, { action: "renew_agent", grant_ref: policy.record.ref, projects: [
      { project_id: independent.project_id, expected_ref: independentCurrent.ref }, { project_id: child.project_id, expected_ref: child.record.ref }], expires_in_minutes: 60, max_mutations: 1 });
    await agentCall(independent.project_id, decide(independentCurrent.ref, allowed[0]!.purpose), 403);
    token = renewed.credential; sequence = 0;
    const replacementRead = await replacement(new Request(`${agentUrl}?project_id=${independent.project_id}`, { headers: { host: "127.0.0.1", authorization: `Bearer ${token}` } }));
    assert.equal(replacementRead.status, 200);
    assert.deepEqual((await replacementRead.json()).state.history, independentCurrent ? readProjectDirection(db, { ...scope, project_id: independent.project_id }, now()).history : []);
    tick(); const reauthorized = await agentCall(child.project_id, decide(child.record.ref, allowed[1]!.purpose));
    assert.equal(reauthorized.state.parent_current, true); assert.equal(reauthorized.state.effective.value.parent.direction_ref, second.record.ref);
    assert.equal(reauthorized.state.history[0].value.parent.direction_ref, firstRef, "Renewal preserves earlier delegation");
    assert.notEqual(token, oldToken);
    tick(); await agentCall(child.project_id, decide(reauthorized.record.ref, allowed[0]!.purpose), 403);
    const expiredReader = createAgentProjectDirectionHandler({ environment, clock: { now: () => renewed.record.value.expires_at } });
    assert.equal((await expiredReader(new Request(`${agentUrl}?project_id=${child.project_id}`, { headers: { host: "127.0.0.1", authorization: `Bearer ${token}` } }))).status, 403);
    assert.equal((await agent(new Request(`${agentUrl}?project_id=${child.project_id}`, { headers: { host: "127.0.0.1", authorization: `Bearer augnes-direction.${"a".repeat(43)}` } }))).status, 401);
    const nextPreparation = await call(human, humanUrl, { action: "prepare_inspection", expected_ref: second.record.ref, files: [{ path: "compatibility.txt", contains: "ready" }, { path: "recovery.txt", contains: "ready" }] });
    const nextPacket = readVNextCoreRecordV01(db, { ...scope, record_kind: "task_context_packet", record_id: nextPreparation.packet_id })!.payload as TaskContextPacketV01;
    assert(readSelectedWorkSources(nextPacket).some(e => canonical(e) === canonical(counter)), "Direction-only change preserves counterevidence and its provenance");
    const oldMethods = readSelectedWorkSources(packet).filter(e => JSON.parse(e.bounded_summary!).kind === "method");
    for (const method of oldMethods) assert(readSelectedWorkSources(nextPacket).some(e => canonical(e) === canonical(method)), "Direction-only change preserves applicable methods and support");
    tick();
    const revision = revisePreExecutionProjectWorkV01(db, { config, credential: credential(), clock, request: { action: "revise_pre_execution_project_work", ...scope,
      expected_active_project_id: scope.project_id, expected_active_selection_revision: active.selection_revision, expected_current_packet_id: nextPacket.packet_id,
      expected_current_packet_fingerprint: nextPacket.integrity.fingerprint, expected_current_lineage_kind: "pre_execution_user_revision", ...initial.definition, goal: "Review both prerequisites with uncertainty retained" } });
    cookie = `${VNEXT_LOCAL_OPERATOR_SESSION_COOKIE_V01}=${revision.session_admission.cookie_value}`;
    assert.equal(effectiveDirection(db, scope, now())!.ref, second.record.ref, "Task editing never changes direction");
    tick();
    const control = readProjectAutomationControlV01(db, scope);
    mutateProjectControlV01(db, { ...scope, action: "enable_automation", expected_active_project_id: scope.project_id, expected_active_selection_revision: active.selection_revision, expected_control_revision: control?.revision ?? null }, { now });
    const preview = await call(prospective, `${prospectiveUrl}?agenda_ref=${nextPreparation.agenda_ref}&preview=authorization`);
    const authorization = await call(prospective, prospectiveUrl, { action: "authorize", authorization: preview.authorization_preview });
    await call(prospective, prospectiveUrl, { action: "arm", agenda_ref: nextPreparation.agenda_ref, authorization_ref: { grant_id: authorization.authorization.grant_id, grant_fingerprint: authorization.authorization.grant_fingerprint } });
    host = new ProspectiveReentryHost({ config, agenda_ref: nextPreparation.agenda_ref, now });
    tick();
    const running = call(human, humanUrl, { action: "run_inspection", agenda_ref: nextPreparation.agenda_ref });
    for (let i = 0; i < 100 && host.read()!.phase === "armed"; i++) { tick(); await new Promise(resolve => setTimeout(resolve, 10)); }
    assert(["claimed", "settled"].includes(host.read()!.phase), "The supported HTTP action admits the real host");
    // Another genuinely authenticated local session changes direction while the
    // first request owns the foreground host. No fixture actor/authority switch.
    const concurrentBootstrap = issueVNextLocalOperatorBootstrapV01(db, { config, clock });
    const concurrentSession = consumeVNextLocalOperatorBootstrapV01(db, { config, clock, bootstrap_token: concurrentBootstrap.bootstrap_token });
    cookie = `${VNEXT_LOCAL_OPERATOR_SESSION_COOKIE_V01}=${concurrentSession.cookie_value}`;
    tick(); const duringRun = await call(human, humanUrl, decide(second.record.ref, "Reconsider inspected evidence before release"));
    assert.equal(readProjectDirection(db, scope, now()).pending_work[0]!.admitted, true);
    assert.equal(readProjectDirection(db, scope, now()).pending_work[0]!.needs_reconsideration, false, "Already admitted work keeps its original basis");
    const completed = await running; assert.equal(completed.inspection.state.phase, "settled");
    const settled = host.read()!; assert.equal(settled.phase, "settled"); assert.equal(settled.history.at(-1)!.judgment.action, "retain");
    assert.equal(listVNextCoreRecordsV01(db, { ...scope, record_kinds: ["run_receipt"], limit: 128 }).length, 1);
    tick();
    const result = readResultWorkPreparationV01(db, { config, receipt_id: settled.receipt_id!, clock });
    const comparison = compareResultWorkSourcesV01(db, { config, binding: result.binding, notes: [...readSelectedWorkSources(revision.packet), result.result_source!].map(selectedWorkSourceInput), clock });
    const successorPreview = previewResultWorkV01(db, { config, binding: result.binding, clock, definition: { goal: "Review the inspected sources under the current direction", success_criteria: ["Keep support separate from authority"], non_goals: ["No publishing"] },
      selected_sources: { selected_source_context: comparison.entries, expected_source_comparison: comparison.fingerprint, omitted_sources: [] } });
    const successor = await defineAuthoredSuccessorTaskV01(db, { config, credential: credential(), clock, request: successorPreview.request });
    cookie = `${VNEXT_LOCAL_OPERATOR_SESSION_COOKIE_V01}=${successor.session_admission.cookie_value}`;
    assert.equal(packetDirectionBinding(db, successor.packet)!.value.direction_ref, duringRun.record.ref);
    assert.equal(successor.packet.capability_grant, null);
    assert.equal(judgeAgenda(readAgendaInput(readSelectedWorkSources(successor.packet), now())!, now()).action, "retain");
    validateProjectDirectionHistory(db);
    assert.equal(validateRecoveryCanonicalDatabaseV01(db).status, "valid");
    tick();
    const backup = await (createRecoveryBackup as unknown as (input: {
      databasePath: string; backupDirectory: string; applicationScopeFingerprint: string;
      sourceApplication: { application_version: string; build_identity: string; package_contract: string; package_contract_version: number; runtime_contract: string; runtime_schema_version: number };
      reason: string; inspectDatabase: typeof inspectRecoveryDatabaseFile; now: () => Date;
    }) => Promise<{ backupPath: string }>)({ databasePath: config.database_path, backupDirectory: path.join(root, "backups"), applicationScopeFingerprint: "a".repeat(64),
      sourceApplication: { application_version: "0.1.1", build_identity: hash("direction-development"), package_contract: "augnes.distributable.v1", package_contract_version: 1, runtime_contract: "augnes-local-runtime-supervisor-v1", runtime_schema_version: 2 },
      reason: "manual_recovery", inspectDatabase: inspectRecoveryDatabaseFile, now: () => new Date(now()) });
    const recovered = new Database(path.join(backup.backupPath, RECOVERY_DATABASE_PAYLOAD));
    try { validateProjectDirectionHistory(recovered); assert.deepEqual(readProjectDirection(recovered, scope, now()).history, readProjectDirection(db, scope, now()).history);
      assert.equal((recovered.prepare("SELECT count(*) AS count FROM vnext_project_direction_credentials WHERE token_hash IS NOT NULL OR suspended=0").get() as { count: number }).count, 0); }
    finally { recovered.close(); }
    await call(human, humanUrl, { action: "revoke_agent", grant_ref: renewed.record.ref, reason: "End the bounded exercise" });
    await agentCall(independent.project_id, decide(independentCurrent.ref, allowed[0]!.purpose), 403);
    console.log(JSON.stringify({ project_direction: "pass", journeys: ["authenticated_human", "independent_agent_role", "delegated_child"], consumer_path: "ordinary work -> direction -> source inspection preparation -> explicit authorization -> arm -> real files -> receipt -> reentry -> successor", model_calls: 0, usefulness: "not_measured", proposal_preserved: !!proposal.record, cleanup: "owned temporary database and roots removed in finally" }));
  } finally { await host?.live.shutdown(); db.close(); rmSync(root, { recursive: true, force: true }); }
}
void main().catch(error => { console.error(error); process.exitCode = 1; });
