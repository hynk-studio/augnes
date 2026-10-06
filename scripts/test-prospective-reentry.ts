import { createRecoveryBackup, RECOVERY_DATABASE_PAYLOAD } from "./recovery-backup.mjs";
import { inspectRecoveryDatabaseFile } from "./runtime-database-bootstrap.mjs";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, realpathSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import Database from "better-sqlite3";
import { applyCanonicalDatabaseMigrations } from "./canonical-database-migrations.mjs";
import { getOrCreateDefaultWorkspaceIdentityV01, getOrCreateCanonicalProjectForLocalRootV01, normalizeLocalProjectRootRefV01, rebindCanonicalProjectLocalRootV01 } from "../lib/vnext/persistence/project-identity-registry";
import { readCurrentVNextAutomationWorkSnapshotV01, readBoundedAutomationCapabilityGrantV01 } from "../lib/vnext/persistence/bounded-automation-authority";
import { readSharedProjectInspectorV01 } from "../lib/vnext/runtime/shared-project-inspector";
import { inspectVNextOperatorPilotPacketLineageV01 } from "../lib/vnext/runtime/operator-pilot-project-continuity";
import { defineInitialProjectWorkV01 } from "../lib/vnext/runtime/project-work-initialization";
import { revisePreExecutionProjectWorkV01 } from "../lib/vnext/runtime/project-work-revision";
import { createProspectiveReentryHandler } from "../app/api/vnext/operator/prospective-reentry/route";
import { readProspectiveAuthorization, type ProspectiveAuthorizationRequest, type ProspectiveAuthorization } from "../lib/vnext/persistence/prospective-authorization";
import { buildSelectedWorkSourceEntry, compareSelectedWorkSources, readSelectedWorkSources, selectedWorkSourceInput } from "../lib/intake/selected-work-source-comparison";
import { PROSPECTIVE_INPUT, readAgendaInput, judgeAgenda, prospectiveGuidance, type Agenda, type ConditionalMethod, type Observation } from "../lib/vnext/prospective-agenda";
import { canonicalizeProtocolValueV01 as canonical, createProtocolSha256V01 as hash } from "../lib/vnext/protocol-primitives";
import { ProspectiveReentryHost, prospectiveHostFingerprint } from "../lib/vnext/runtime/prospective-reentry";
import { readActiveProjectSelectionV01, selectActiveProjectV01 } from "../lib/vnext/persistence/project-lifecycle-registry";
import { mutateProjectControlV01, readProjectAutomationControlV01 } from "../lib/vnext/persistence/project-control-store";
import { listVNextCoreRecordsV01, readVNextCoreRecordV01 } from "../lib/vnext/persistence/durable-semantic-store";
import { readResultWorkPreparationV01, compareResultWorkSourcesV01, previewResultWorkV01, defineAuthoredSuccessorTaskV01 } from "../lib/vnext/runtime/authored-successor-task";
import { issueVNextLocalOperatorBootstrapV01, consumeVNextLocalOperatorBootstrapV01, readVNextLocalOperatorCredentialFromRequestV01, VNEXT_LOCAL_OPERATOR_SESSION_COOKIE_V01 } from "../lib/vnext/runtime/local-operator-session";
import { validateRecoveryCanonicalDatabaseV01 } from "./recovery-canonical-record-validator";
import type { TaskContextPacketV01 } from "../types/vnext/task-context-packet";
import type { SelectedWorkSourceInput } from "../types/vnext/project-work-revision";

const scope = { workspace_id: "workspace:11111111-1111-4111-8111-111111111111", project_id: "project:22222222-2222-4222-8222-222222222222" };
const T0 = "2026-10-02T00:00:00.000Z";
const at = (ms: number) => new Date(Date.parse(T0) + ms).toISOString();
const note = (value: unknown, provenance: SelectedWorkSourceInput["provenance"] = "user_declaration"): SelectedWorkSourceInput => ({
  source: "Constructed prospective mechanism fixture", text: typeof value === "string" ? value : canonical(value), provenance, label: "New candidate", observed_at: null,
});
const direction = note("Determine whether the selected release prerequisites support preparing a release recommendation.");
const directionRef = buildSelectedWorkSourceEntry(scope, direction).source_ref!;
const contents = ["Compatibility check: ready\n", "Recovery check: ready\n"];
const agenda: Agenda = {
  profile: PROSPECTIVE_INPUT, kind: "agenda", decision: "Prepare a release recommendation only when both prerequisites are present.",
  direction_ref: directionRef, interpretation: "The selected direction calls for complementary compatibility and recovery observations.", support_refs: [directionRef],
  premise_until: at(60_000), event_window: { earliest: at(9_000), latest: at(20_000) }, deadline: at(12_000),
  preparation_ms: { min: 100, max: 2_000 }, not_before: null, recheck_at: at(15_000), event_key: "release_event",
  inspections: [{ key: "compatible", path: "compatibility.txt", digest: hash(contents[0]!), contains: "ready" },
    { key: "recoverable", path: "recovery.txt", digest: hash(contents[1]!), contains: "ready" }],
  costs: { preparation: "Two bounded file reads", waiting: null, execution: "No commands or model calls", opportunity: null }, exploratory: false,
};
const method: ConditionalMethod = { profile: PROSPECTIVE_INPUT, kind: "method", id: "recommend", action: "Prepare the release recommendation for user review.",
  context: {}, premises: { compatible: true, recoverable: true }, support_refs: [directionRef], conflict_refs: [] };
const notes = (a = agenda, m = method) => [direction, note(a, "derived_interpretation"), note(m, "derived_interpretation")];
const entries = (a = agenda, m = method) => notes(a, m).map(n => buildSelectedWorkSourceEntry(scope, n));
const observation = (key: string, value: boolean, ms = 11_000): Observation => ({ key, value, availability: value ? "observed" : "checked_absent", source_ref: hash(key), observed_at: at(ms), reason: "constructed_observation" });

function pure() {
  assert.equal(prospectiveGuidance({} as TaskContextPacketV01, T0), null);
  assert.equal(prospectiveGuidance({ ...scope, selected_context: [buildSelectedWorkSourceEntry(scope, direction)] } as TaskContextPacketV01, T0), null);
  assert.match(prospectiveGuidance({ ...scope, selected_context: entries({ ...agenda, preparation_ms: { min: 2, max: 1 } }) } as TaskContextPacketV01, T0)!, /could not be interpreted/);
  const input = readAgendaInput(entries(), at(1_000))!;
  assert.equal(judgeAgenda(input, at(9_999)).action, "defer");
  assert.equal(judgeAgenda(input, at(10_000)).action, "prepare");
  assert.equal(judgeAgenda(input, at(10_000)).event_occurred, null);
  const later = readAgendaInput(entries({ ...agenda, deadline: at(30_000) }), at(1_000))!;
  assert.equal(judgeAgenda(later, at(10_000)).action, "defer");
  assert.equal(judgeAgenda(later, at(10_000)).prepare_at, at(28_000));
  assert.equal(judgeAgenda(readAgendaInput(entries({ ...agenda, preparation_ms: null }), T0)!, at(10_000)).action, "defer");
  const one = [observation("compatible", true)];
  assert.equal(judgeAgenda(input, at(11_000), one).action, "defer", "One half of a complementary bundle cannot settle the decision");
  const pair = [...one, observation("recoverable", true)];
  assert.equal(judgeAgenda(input, at(11_000), pair).action, "retain");
  for (const cutoff of [10_500, 10_999]) {
    assert.deepEqual(judgeAgenda(input, at(cutoff), pair), judgeAgenda(input, at(cutoff)), "Future results cannot change any current judgment field or evidence reference");
    assert.equal(judgeAgenda(input, at(cutoff)).action, "prepare");
  }
  for (const cutoff of [11_000, 11_001]) {
    const available = judgeAgenda(input, at(cutoff), pair);
    assert.equal(available.action, "retain");
    assert.deepEqual(available.observations, pair);
    for (const row of pair) assert(available.source_refs.includes(row.source_ref));
  }
  const completionNote = buildSelectedWorkSourceEntry(scope, { ...note({ profile: PROSPECTIVE_INPUT, kind: "inspection_result", agenda_ref: input.source_ref,
    receipt_id: "constructed-earlier-completion", receipt_fingerprint: hash("earlier-completion"), observations: [] }, "user_declaration"), observed_at: at(10_000) });
  const completed = readAgendaInput([...entries(), completionNote], at(10_500))!;
  assert.equal(judgeAgenda(completed, at(10_500)).action, "defer", "An independently available completion report can still suppress repeated preparation");
  assert.deepEqual(judgeAgenda(completed, at(10_500), pair), judgeAgenda(completed, at(10_500)));
  assert.equal(judgeAgenda(input, at(11_000), [one[0]!, observation("recoverable", false)]).action, "withdraw");
  const unavailable: Observation = { ...observation("recoverable", false), availability: "channel_unavailable", value: null };
  assert.equal(judgeAgenda(input, at(11_000), [one[0]!, unavailable]).action, "defer");
  assert.match(judgeAgenda(input, at(11_000), [one[0]!, unavailable]).next_action, /channel unavailable/);
  assert.equal(judgeAgenda(input, at(60_001), pair).action, "withdraw");
  assert.equal(judgeAgenda(input, at(20_000), pair).deadline_missed, true);
  assert.equal(judgeAgenda(input, at(20_000)).action, "defer", "A missed deadline never launches catch-up preparation");
  assert.equal(judgeAgenda(input, at(20_000)).next_recheck_at, null);
  assert.equal(input.agenda.deadline, at(12_000));
  const conditional = { ...input, methods: [{ ...method, context: { cue: true }, premises: { compatible: true } },
    { ...method, id: "alternate", context: { cue: false }, premises: { compatible: true }, action: "Use the alternate supported method." }] };
  const choose = (cue: boolean) => judgeAgenda(conditional, at(11_000), [...pair, observation("cue", cue)]);
  assert.deepEqual([choose(true).methods[0]!.status, choose(false).methods[0]!.status, choose(true).methods[0]!.status], ["supported", "other_context", "supported"]);
  const conflict = { ...conditional, methods: [{ ...conditional.methods[0]!, conflict_refs: [hash("prior contradictory result")] }, conditional.methods[1]!] };
  assert.equal(judgeAgenda(conflict, at(11_000), [...pair, observation("cue", false)]).methods[0]!.status, "conflicting");
  assert.equal(judgeAgenda(conditional, at(11_000), [observation("compatible", false), observation("recoverable", true), observation("cue", false)]).methods[0]!.status, "withdrawn");
  assert.equal(conditional.methods[0]!.context.cue, true, "Context changes never rewrite stored methods");
  const history = { ...conditional, observations: [...pair.map(o => ({ ...o, observed_at: at(9_000) })),
    observation("cue", true, 10_000), observation("cue", false, 11_000), observation("cue", true, 12_000)] };
  assert.deepEqual([10_000, 11_000, 12_000].map(ms => judgeAgenda(history, at(ms)).methods[0]!.status),
    ["supported", "other_context", "supported"], "Retained, dated cue history supports A to B to A without forgetting");
  assert.equal(judgeAgenda({ ...history, observations: [...history.observations, observation("cue", false, 12_000)] }, at(12_000)).methods[0]!.status, "conflicting");
  assert.equal(judgeAgenda({ ...history, observations: [...history.observations, observation("compatible", false, 11_000)] }, at(12_000)).methods[0]!.status, "conflicting", "A later cue cannot hide contradictory result evidence");
}

async function main() {
  pure();
  const root = realpathSync(mkdtempSync(path.join(tmpdir(), "augnes-prospective-")));
  let host: ProspectiveReentryHost | null = null;
  let db: Database.Database | null = null;
  try {
    const projectRoot = path.join(root, "operator-project-root");
    mkdirSync(projectRoot);
    const config = { ...scope, enabled: true as const, operator_id: "operator:prospective", database_path: path.join(root, "prospective.db") };
    db = new Database(config.database_path); db.pragma("foreign_keys=ON");
    applyCanonicalDatabaseMigrations(db);
    getOrCreateDefaultWorkspaceIdentityV01(db, { create_uuid: () => scope.workspace_id.slice(10), now: () => T0 });
    getOrCreateCanonicalProjectForLocalRootV01(db, { workspace_id: scope.workspace_id, local_root: normalizeLocalProjectRootRefV01(projectRoot, { base_path: root }) },
      { create_uuid: () => scope.project_id.slice(8), now: () => T0 });
    selectActiveProjectV01(db, { ...scope, expected_project_id: null, expected_revision: null, now: at(1) });
    const active = readActiveProjectSelectionV01(db, scope.workspace_id)!;
    let current = at(2);
    const now = () => current;
    const issue = issueVNextLocalOperatorBootstrapV01(db, { config, clock: { now } });
    const session = consumeVNextLocalOperatorBootstrapV01(db, { config, bootstrap_token: issue.bootstrap_token, clock: { now } });
    let cookie = `${VNEXT_LOCAL_OPERATOR_SESSION_COOKIE_V01}=${session.cookie_value}`;
    const credentialFromCookie = () => readVNextLocalOperatorCredentialFromRequestV01(new Request("http://127.0.0.1", { headers: { cookie } }));
    let credential = credentialFromCookie();
    const initial = defineInitialProjectWorkV01(db, { config, credential, clock: { now }, request: { action: "define_initial_project_work", ...scope,
      expected_active_project_id: scope.project_id, expected_active_selection_revision: active.selection_revision, expected_initialization_state: "not_defined",
      goal: "Prepare a source-grounded release recommendation", success_criteria: ["Inspect both selected prerequisites"], non_goals: ["Do not publish or deploy"] } });
    assert.equal(initial.packet.capability_grant, null);
    cookie = `${VNEXT_LOCAL_OPERATOR_SESSION_COOKIE_V01}=${initial.session_admission.cookie_value}`;
    const comparison = compareSelectedWorkSources(initial.packet, entries());
    current = at(3);
    const revised = revisePreExecutionProjectWorkV01(db, { config, credential: credentialFromCookie(), clock: { now }, request: {
      action: "revise_pre_execution_project_work", ...scope, expected_active_project_id: scope.project_id, expected_active_selection_revision: active.selection_revision,
      expected_current_packet_id: initial.packet.packet_id, expected_current_packet_fingerprint: initial.packet.integrity.fingerprint,
      expected_current_lineage_kind: "initial_user_defined", ...initial.definition, selected_source_context: comparison.entries, expected_source_comparison: comparison.fingerprint } });
    const packet = revised.packet;
    assert.equal(packet.capability_grant, null);
    const packetBefore = canonical(packet);
    current = at(4);
    cookie = `${VNEXT_LOCAL_OPERATOR_SESSION_COOKIE_V01}=${revised.session_admission.cookie_value}`;
    credential = credentialFromCookie();
    const input = readAgendaInput(readSelectedWorkSources(packet), current)!;
    assert(prospectiveGuidance(packet, current));
    const control = readProjectAutomationControlV01(db, scope);
    mutateProjectControlV01(db, { ...scope, action: "enable_automation", expected_active_project_id: scope.project_id,
      expected_active_selection_revision: active.selection_revision, expected_control_revision: control?.revision ?? null }, { now });
    writeFileSync(path.join(projectRoot, "compatibility.txt"), contents[0]!);
    writeFileSync(path.join(projectRoot, "recovery.txt"), contents[1]!);
    const environment = { NODE_ENV: "test" as const, AUGNES_VNEXT_OPERATOR_PILOT_ENABLED: "1",
      AUGNES_VNEXT_OPERATOR_WORKSPACE_ID: scope.workspace_id, AUGNES_VNEXT_OPERATOR_PROJECT_ID: scope.project_id,
      AUGNES_VNEXT_OPERATOR_ID: config.operator_id, AUGNES_DB_PATH: config.database_path };
    const route = createProspectiveReentryHandler({ clock: { now }, environment });
    const endpoint = "http://127.0.0.1/api/vnext/operator/prospective-reentry";
    const post = (body: unknown, extra: Record<string, string> = {}) => route(new Request(endpoint, { method: "POST",
      headers: { host: "127.0.0.1", origin: "http://127.0.0.1", "content-type": "application/json", cookie, ...extra }, body: JSON.stringify(body) }));
    const refusedArm = await post({ action: "arm", agenda_ref: input.source_ref });
    assert.equal(refusedArm.status, 409);
    assert.equal((await refusedArm.json()).error, "bounded_automation_source_grant_required");
    const previewResponse = await route(new Request(`${endpoint}?agenda_ref=${input.source_ref}&preview=authorization`, { headers: { host: "127.0.0.1", cookie } }));
    const previewBody = await previewResponse.json();
    assert.equal(previewResponse.status, 200, canonical(previewBody));
    const authorizationRequest = previewBody.authorization_preview as ProspectiveAuthorizationRequest;
    assert.equal(authorizationRequest.packet_fingerprint, packet.integrity.fingerprint);
    assert.equal(authorizationRequest.budget.max_commands, 0);
    const countGrants = () => listVNextCoreRecordsV01(db!, { ...scope, record_kinds: ["capability_grant"], limit: 128 }).length;
    assert.equal(countGrants(), 0, "Preview grants no authority");
    assert.equal((await post({ action: "authorize", authorization: authorizationRequest }, { cookie: "" })).status, 401);
    assert.equal((await post({ action: "authorize", authorization: authorizationRequest }, { origin: "https://foreign.example" })).status, 403);
    for (const patch of [{ project_id: "project:foreign" }, { packet_fingerprint: hash("other") }, { host_fingerprint: hash("other") },
      { root_fingerprint: hash("other") }, { work_profile: "arbitrary_work" }, { control_revision: 999 }, { expires_at: at(60_001) }, { expires_at: T0 },
      { budget: { ...authorizationRequest.budget, max_commands: 1 } }, { budget: { ...authorizationRequest.budget, max_attempts: 2 } }]) {
      assert.equal((await post({ action: "authorize", authorization: { ...authorizationRequest, ...patch } })).status, 409, canonical(patch));
    }
    assert.equal(countGrants(), 0);
    const authorizedResponse = await post({ action: "authorize", authorization: authorizationRequest });
    const authorized = await authorizedResponse.json();
    assert.equal(authorizedResponse.status, 200, canonical(authorized));
    const grant = authorized.authorization as ProspectiveAuthorization;
    assert.equal(authorized.host_started, false);
    assert.equal(authorized.state, null);
    assert.equal(countGrants(), 1);
    assert.deepEqual(readProspectiveAuthorization(db, { ...scope, grant_id: grant.grant_id, grant_fingerprint: grant.grant_fingerprint }), grant);
    assert.equal(listVNextCoreRecordsV01(db, { ...scope, record_kinds: ["automation_work_item", "run_receipt"], limit: 128 }).length, 0);
    assert.equal((await post({ action: "authorize", authorization: authorizationRequest })).status, 409, "Consumed action nonce cannot be reused");
    cookie = authorizedResponse.headers.get("set-cookie")!.split(";")[0]!;
    const replayResponse = await post({ action: "authorize", authorization: authorizationRequest });
    assert.equal(replayResponse.status, 200);
    assert.equal((await replayResponse.json()).authorization.grant_id, grant.grant_id);
    assert.equal(countGrants(), 1, "Fresh authenticated exact request reuses its grant");
    cookie = replayResponse.headers.get("set-cookie")!.split(";")[0]!;
    const authorizationRef = { grant_id: grant.grant_id, grant_fingerprint: grant.grant_fingerprint };
    const inspector = readSharedProjectInspectorV01(db, { config, authenticated_session_id: credential.session_id, observed_at: current,
      target: { target_kind: "capability_grant", record_id: grant.grant_id, expected_fingerprint: grant.grant_fingerprint } });
    assert.match(canonical(inspector), /exact preparation authorization/);
    // Copies retain the grant produced by the authenticated route. Mutations
    // use production owners; none inserts or fabricates authority directly.
    for (const scenario of ["policy", "root", "source", "expiry"]) {
      const casePath = path.join(root, `authorization-${scenario}.db`);
      writeFileSync(casePath, db.serialize());
      const caseDb = new Database(casePath);
      const caseConfig = { ...config, database_path: casePath };
      const caseNow = () => scenario === "expiry" ? at(60_000) : at(5);
      let caseCookie = cookie;
      try {
        if (scenario === "policy") {
          mutateProjectControlV01(caseDb, { ...scope, action: "pause_automation", expected_active_project_id: scope.project_id,
            expected_active_selection_revision: active.selection_revision, expected_control_revision: authorizationRequest.control_revision }, { now: caseNow });
        } else if (scenario === "root") {
          const otherRoot = path.join(root, "other-root"); mkdirSync(otherRoot);
          rebindCanonicalProjectLocalRootV01(caseDb, { ...scope, local_root: normalizeLocalProjectRootRefV01(otherRoot, { base_path: root }) }, { now: caseNow });
        } else if (scenario === "source") {
          const next = revisePreExecutionProjectWorkV01(caseDb, { config: caseConfig, credential: credentialFromCookie(), clock: { now: caseNow }, request: {
            action: "revise_pre_execution_project_work", ...scope, expected_active_project_id: scope.project_id, expected_active_selection_revision: active.selection_revision,
            expected_current_packet_id: packet.packet_id, expected_current_packet_fingerprint: packet.integrity.fingerprint,
            expected_current_lineage_kind: "pre_execution_user_revision", ...initial.definition, goal: "Reconsider the release direction" } });
          caseCookie = `${VNEXT_LOCAL_OPERATOR_SESSION_COOKIE_V01}=${next.session_admission.cookie_value}`;
        }
        const caseRoute = createProspectiveReentryHandler({ environment: { ...environment, AUGNES_DB_PATH: casePath }, clock: { now: caseNow } });
        const response = await caseRoute(new Request(endpoint, { method: "POST", headers: { host: "127.0.0.1", origin: "http://127.0.0.1", "content-type": "application/json", cookie: caseCookie },
          body: JSON.stringify({ action: "arm", agenda_ref: input.source_ref, authorization_ref: authorizationRef }) }));
        assert.equal(response.status, 409, `${scenario}: ${canonical(await response.json())}`);
        assert.equal(listVNextCoreRecordsV01(caseDb, { ...scope, record_kinds: ["automation_work_item", "run_receipt"], limit: 128 }).length, 0);
      } finally { caseDb.close(); }
    }
    assert.equal((await post({ action: "arm", agenda_ref: input.source_ref, authorization_ref: { ...authorizationRef, grant_fingerprint: hash("foreign") } })).status, 409);
    const armResponse = await post({ action: "arm", agenda_ref: input.source_ref, authorization_ref: authorizationRef });
    const armBody = await armResponse.json();
    assert.equal(armResponse.status, 200, canonical(armBody));
    assert.equal(armBody.host_started, false);
    cookie = armResponse.headers.get("set-cookie")!.split(";")[0]!;
    credential = credentialFromCookie();
    assert.equal(canonical(readVNextCoreRecordV01(db, { ...scope, record_kind: "task_context_packet", record_id: packet.packet_id })!.payload), packetBefore, "Authorization never rewrites source history");
    host = new ProspectiveReentryHost({ config, agenda_ref: input.source_ref, now });
    assert.throws(() => host!.cycle.queueCurrentTask({ config, credential, clock: { now },
      preparation: { host_fingerprint: prospectiveHostFingerprint(), agenda_ref: input.source_ref, authorization_ref: authorizationRef } }), /prospective_agenda_already_armed/);
    assert.equal((await host.wake()).status, "not_due");
    const count = () => listVNextCoreRecordsV01(db!, { ...scope, record_kinds: ["run_receipt"], limit: 128 }).length;
    const before = count();
    const armed = host.read()!;
    const armedDatabase = db.serialize();
    const backup = await (createRecoveryBackup as unknown as (input: {
      databasePath: string; backupDirectory: string; applicationScopeFingerprint: string;
      sourceApplication: { application_version: string; build_identity: string; package_contract: string; package_contract_version: number; runtime_contract: string; runtime_schema_version: number };
      reason: string; inspectDatabase: typeof inspectRecoveryDatabaseFile; now: () => Date;
    }) => Promise<{ backupPath: string }>)({ databasePath: config.database_path, backupDirectory: path.join(root, "backups"),
      applicationScopeFingerprint: "a".repeat(64), sourceApplication: { application_version: "0.1.1", build_identity: hash("constructed_prospective_build"),
        package_contract: "augnes.distributable.v1", package_contract_version: 1, runtime_contract: "augnes-local-runtime-supervisor-v1", runtime_schema_version: 2 },
      reason: "manual_recovery", inspectDatabase: inspectRecoveryDatabaseFile, now: () => new Date(current) });
    const recoveredDatabase = readFileSync(path.join(backup.backupPath, RECOVERY_DATABASE_PAYLOAD));
    assert.deepEqual(host.read(), armed, "Backup normalization cannot change authoritative wake eligibility");
    // Reopen the exact same durable state before eligibility: interruption does
    // not lose the agenda, slide its deadline, or require another user 'next'.
    await host.live.shutdown();
    host = new ProspectiveReentryHost({ config, agenda_ref: input.source_ref, now });
    current = at(10_100);
    const starts = await Promise.allSettled([host.wake(), host.wake()]);
    assert(starts.some(r => r.status === "fulfilled" && r.value.status === "admitted"), canonical(starts));
    for (let i = 0; i < 100 && host.read()!.phase !== "settled"; i++) {
      current = at(11_000 + i);
      await new Promise(resolve => setTimeout(resolve, 10));
      await host.wake();
    }
    const settled = host.read()!;
    assert.equal(settled.phase, "settled", canonical(settled));
    assert.equal(count() - before, 1);
    assert.equal(settled.history.at(-1)!.reason, "source_bound_result_reentry");
    assert.equal(settled.history.at(-1)!.judgment.action, "retain", canonical(settled.history.at(-1)));
    assert.equal(settled.history.at(-1)!.judgment.observations.length, 2);
    assert.equal(settled.history[0]!.judgment.information_cutoff, armed.history[0]!.judgment.information_cutoff);
    assert(settled.receipt_id && settled.receipt_fingerprint);
    const executedWork = readCurrentVNextAutomationWorkSnapshotV01(db, { ...scope, work_id: settled.work_id })!;
    const finalRef = executedWork.cycle_binding!.final_grant_ref;
    const finalGrant = readBoundedAutomationCapabilityGrantV01(db, { ...scope, grant_id: finalRef.external_id, grant_fingerprint: finalRef.source_ref! });
    assert.equal(finalGrant.budget.max_commands, 0);
    assert.equal(finalGrant.budget.max_runtime_ms, 10_000);
    assert.equal(finalGrant.source_grant_ref.external_id, grant.grant_id);
    const executionPacketRef = executedWork.cycle_binding!.packet_ref;
    const executionLineage = inspectVNextOperatorPilotPacketLineageV01(db, { config, packet_id: executionPacketRef.external_id, packet_fingerprint: executionPacketRef.source_ref! });
    assert.equal(executionLineage.lineage_kind, "bounded_preparation");
    assert.equal(executionLineage.source_transition_receipt, null);
    assert.notEqual(executionLineage.packet.task.goal, packet.task.goal, "Preparation does not execute or retry the authored task");
    current = at(20_000);
    await host.wake(); await host.wake();
    assert.equal(count() - before, 1, "Overdue and duplicate checks cannot create a catch-up burst");
    assert.equal(host.read()!.history.at(-1)!.judgment.deadline_missed, true);
    await host.live.shutdown();
    host = new ProspectiveReentryHost({ config, agenda_ref: input.source_ref, now });
    await host.wake();
    assert.equal(count() - before, 1, "Restart reconciles the existing receipt without repeating work");
    // Independent disposable databases keep the exact admitted source history.
    // These are fault-injection engineering cases, not ordinary-use evidence.
    for (const scenario of ["paused", "cancelled", "expired", "foreign", "restore", "uncertain", "stale_file", "missing_file", "host_loop"]) {
      const casePath = path.join(root, `${scenario}.db`);
      writeFileSync(casePath, scenario === "restore" ? recoveredDatabase : armedDatabase);
      const caseConfig = { ...config, database_path: casePath };
      const caseDb = new Database(casePath);
      let caseHost = new ProspectiveReentryHost({ config: caseConfig, agenda_ref: input.source_ref, now });
      current = at(10_100);
      const caseCount = () => listVNextCoreRecordsV01(caseDb, { ...scope, record_kinds: ["run_receipt"], limit: 128 }).length;
      const caseBefore = caseCount();
      try {
        if (scenario === "paused") {
          const c = readProjectAutomationControlV01(caseDb, scope)!;
          mutateProjectControlV01(caseDb, { ...scope, action: "pause_automation", expected_active_project_id: scope.project_id,
            expected_active_selection_revision: active.selection_revision, expected_control_revision: c.revision }, { now });
          assert.equal((await caseHost.wake()).state.phase, "stopped");
        } else if (scenario === "cancelled") {
          caseHost.cancel({ credential, clock: { now } });
          assert.equal((await caseHost.wake()).status, "stopped");
          assert.equal(caseHost.read()!.history.at(-1)!.reason, "operator_cancelled");
          assert.equal(caseHost.cycle.read(caseConfig).status, "no_eligible_work", "A cancelled queued preparation cannot block a later eligible work item");
        } else if (scenario === "expired") {
          current = at(60_001);
          assert.equal((await caseHost.wake()).state.phase, "stopped");
        } else if (scenario === "foreign") {
          await caseHost.live.shutdown();
          caseHost = new ProspectiveReentryHost({ config: { ...caseConfig, project_id: "project:33333333-3333-4333-8333-333333333333" }, agenda_ref: input.source_ref, now });
          await assert.rejects(() => caseHost.wake(), /prospective_host_binding_required/);
        } else if (scenario === "restore") {
          await assert.rejects(() => caseHost.wake(), /prospective_recovery_suspended/);
          assert.equal(caseHost.cycle.read(caseConfig).status, "no_eligible_work");
          caseHost.cancel({ credential, clock: { now } });
          assert.equal((await caseHost.wake()).status, "stopped", "Explicit cancellation releases a restored agenda without restoring execution permission");
        } else if (scenario === "uncertain") {
          caseHost.live.startAdmittedPolicyTriggeredV01 = async () => { throw new Error("constructed_host_interruption_after_atomic_claim"); };
          await caseHost.wake();
          await caseHost.live.shutdown();
          caseHost = new ProspectiveReentryHost({ config: caseConfig, agenda_ref: input.source_ref, now });
          assert.equal((await caseHost.wake()).status, "reconciliation_required_no_retry");
          assert.equal((await caseHost.wake()).status, "reconciliation_required_no_retry");
        } else {
          if (scenario === "stale_file") writeFileSync(path.join(root, "operator-project-root", "recovery.txt"), "Changed source version: ready\n");
          if (scenario === "missing_file") rmSync(path.join(root, "operator-project-root", "recovery.txt"));
          const run = await caseHost.runFor(3_000, new AbortController().signal);
          assert.equal(run.state?.phase, "settled", canonical(run));
          assert.equal(caseCount() - caseBefore, 1);
          const judgment = run.state!.history.at(-1)!.judgment;
          assert.equal(judgment.action, scenario === "host_loop" ? "retain" : "defer");
          if (scenario !== "host_loop") assert.equal(judgment.observations[1]!.availability, scenario === "stale_file" ? "conflicting" : "channel_unavailable");
        }
        if (!["stale_file", "missing_file", "host_loop"].includes(scenario)) assert.equal(caseCount(), caseBefore);
      } finally {
        await caseHost.live.shutdown(); caseDb.close();
        writeFileSync(path.join(root, "operator-project-root", "recovery.txt"), contents[1]!);
      }
    }
    // The ordinary result writer carries the structured, attributed observation
    // into the ordinary authenticated successor writer and its fresh GuideBrief.
    current = at(21_000);
    const prepared = readResultWorkPreparationV01(db, { config, receipt_id: settled.receipt_id, clock: { now } });
    assert(prepared.result_source);
    const selected = [...entries(), prepared.result_source];
    const resultComparison = compareResultWorkSourcesV01(db, { config, binding: prepared.binding, notes: selected.map(selectedWorkSourceInput), clock: { now } });
    const preview = previewResultWorkV01(db, { config, binding: prepared.binding, clock: { now },
      definition: { goal: "Review the source-bound release recommendation", success_criteria: ["Keep judgment separate from release authority"], non_goals: ["Do not publish or deploy"] },
      selected_sources: { selected_source_context: resultComparison.entries, expected_source_comparison: resultComparison.fingerprint,
        omitted_sources: [] } });
    const successor = await defineAuthoredSuccessorTaskV01(db, { config, credential, request: preview.request, clock: { now } });
    const successorInput = readAgendaInput(readSelectedWorkSources(successor.packet), current)!;
    assert.equal(judgeAgenda(successorInput, current).action, "retain");
    assert.match(prospectiveGuidance(successor.packet, current)!, /release recommendation/);
    assert.equal(successor.packet.capability_grant, null, "Result reuse grants no subsequent execution");
    assert.equal(validateRecoveryCanonicalDatabaseV01(db).status, "valid");
    console.log(JSON.stringify({ prospective_reentry: "pass", production_path: "ordinary initial authoring -> selected-source revision with null grant -> authenticated authorization preview and opt-in -> authenticated arm -> durable due wake -> atomic grant/native admission -> two real file reads -> receipt -> result event -> retained judgment -> ordinary successor",
      fixture: "constructed_exposed", model_calls: 0, inspection_runs: 1, ordinary_model_use: "not_run_no_authorized_case", comparative_usefulness: "not_run" }));
  } finally { await host?.live.shutdown(); db?.close(); rmSync(root, { recursive: true, force: true }); }
}
void main().catch(error => { console.error(error); process.exitCode = 1; });
