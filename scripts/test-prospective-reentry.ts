import { createRecoveryBackup, RECOVERY_DATABASE_PAYLOAD } from "./recovery-backup.mjs";
import { inspectRecoveryDatabaseFile } from "./runtime-database-bootstrap.mjs";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import Database from "better-sqlite3";
import { buildVNextOperatorBrowserFixtureV01 } from "./vnext-operator-browser-fixture-builder-v0-1";
import { buildSelectedWorkSourceEntry, readSelectedWorkSources, selectedWorkSourceInput } from "../lib/intake/selected-work-source-comparison";
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
  assert.equal(judgeAgenda(input, at(10_500), pair).action, "defer", "No later-result leakage");
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
  const root = mkdtempSync(path.join(tmpdir(), "augnes-prospective-"));
  let host: ProspectiveReentryHost | null = null;
  let db: Database.Database | null = null;
  try {
    await buildVNextOperatorBrowserFixtureV01({ output_directory: root, reference_time: T0, selected_notes: notes() });
    const manifest = JSON.parse(readFileSync(path.join(root, "operator-pilot-browser-fixture.json"), "utf8"));
    const config = { ...scope, enabled: true as const, operator_id: manifest.operator_id as string, database_path: path.join(root, manifest.database_file) };
    db = new Database(config.database_path); db.pragma("foreign_keys=ON");
    const packet = readVNextCoreRecordV01(db, { ...scope, record_kind: "task_context_packet", record_id: manifest.packet_id })!.payload as TaskContextPacketV01;
    assert(prospectiveGuidance(packet, at(1_000)));
    const input = readAgendaInput(readSelectedWorkSources(packet), at(1_000))!;
    selectActiveProjectV01(db, { ...scope, expected_project_id: null, expected_revision: null, now: at(1) });
    const active = readActiveProjectSelectionV01(db, scope.workspace_id)!;
    const control = readProjectAutomationControlV01(db, scope);
    mutateProjectControlV01(db, { ...scope, action: "enable_automation", expected_active_project_id: scope.project_id,
      expected_active_selection_revision: active.selection_revision, expected_control_revision: control?.revision ?? null }, { now: () => at(1) });
    writeFileSync(path.join(root, "operator-project-root", "compatibility.txt"), contents[0]!);
    writeFileSync(path.join(root, "operator-project-root", "recovery.txt"), contents[1]!);
    let current = at(2);
    const now = () => current;
    const issue = issueVNextLocalOperatorBootstrapV01(db, { config, clock: { now } });
    let credential = consumeVNextLocalOperatorBootstrapV01(db, { config, bootstrap_token: issue.bootstrap_token, clock: { now } }).credential;
    host = new ProspectiveReentryHost({ config, agenda_ref: input.source_ref, now });
    const queued = host.cycle.queueCurrentTask({ config, credential, clock: { now }, preparation: { host_fingerprint: prospectiveHostFingerprint(), agenda_ref: input.source_ref } });
    credential = readVNextLocalOperatorCredentialFromRequestV01(new Request("http://127.0.0.1", { headers: { cookie: `${VNEXT_LOCAL_OPERATOR_SESSION_COOKIE_V01}=${queued.session_admission.cookie_value}` } }));
    assert.throws(() => host!.cycle.queueCurrentTask({ config, credential, clock: { now },
      preparation: { host_fingerprint: prospectiveHostFingerprint(), agenda_ref: input.source_ref } }), /prospective_agenda_already_armed/);
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
    assert.equal(settled.history.at(-1)!.judgment.action, "retain");
    assert.equal(settled.history.at(-1)!.judgment.observations.length, 2);
    assert.equal(settled.history[0]!.judgment.information_cutoff, armed.history[0]!.judgment.information_cutoff);
    assert(settled.receipt_id && settled.receipt_fingerprint);
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
        } else if (scenario === "expired") {
          current = at(60_001);
          assert.equal((await caseHost.wake()).state.phase, "stopped");
        } else if (scenario === "foreign") {
          await caseHost.live.shutdown();
          caseHost = new ProspectiveReentryHost({ config: { ...caseConfig, project_id: "project:33333333-3333-4333-8333-333333333333" }, agenda_ref: input.source_ref, now });
          await assert.rejects(() => caseHost.wake(), /prospective_host_binding_required/);
        } else if (scenario === "restore") {
          await assert.rejects(() => caseHost.wake(), /prospective_recovery_suspended/);
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
    const comparison = compareResultWorkSourcesV01(db, { config, binding: prepared.binding, notes: selected.map(selectedWorkSourceInput), clock: { now } });
    const preview = previewResultWorkV01(db, { config, binding: prepared.binding, clock: { now },
      definition: { goal: "Review the source-bound release recommendation", success_criteria: ["Keep judgment separate from release authority"], non_goals: ["Do not publish or deploy"] },
      selected_sources: { selected_source_context: comparison.entries, expected_source_comparison: comparison.fingerprint,
        omitted_sources: [] } });
    const successor = await defineAuthoredSuccessorTaskV01(db, { config, credential, request: preview.request, clock: { now } });
    const successorInput = readAgendaInput(readSelectedWorkSources(successor.packet), current)!;
    assert.equal(judgeAgenda(successorInput, current).action, "retain");
    assert.match(prospectiveGuidance(successor.packet, current)!, /release recommendation/);
    assert.equal(successor.packet.capability_grant, null, "Result reuse grants no subsequent execution");
    assert.equal(validateRecoveryCanonicalDatabaseV01(db).status, "valid");
    console.log(JSON.stringify({ prospective_reentry: "pass", production_path: "selected notes -> semantic packet writer -> authenticated queue -> durable due wake -> atomic grant/native admission -> two real file reads -> receipt -> result event -> retained judgment -> ordinary successor",
      fixture: "constructed_exposed", model_calls: 0, inspection_runs: 1, ordinary_model_use: "not_run_no_authorized_case", comparative_usefulness: "not_run" }));
  } finally { await host?.live.shutdown(); db?.close(); rmSync(root, { recursive: true, force: true }); }
}
void main().catch(error => { console.error(error); process.exitCode = 1; });
