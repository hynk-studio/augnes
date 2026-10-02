import { hostname } from "node:os";
import type Database from "better-sqlite3";
import { readSelectedWorkSources } from "@/lib/intake/selected-work-source-comparison";
import { readAutonomyRunLedgerRecord } from "@/lib/autonomy/runner-ledger";
import { canonicalizeProtocolValueV01 as canonical, createProtocolSha256V01 as hash } from "../protocol-primitives";
import { judgeAgenda, readAgendaInput, type Observation, type ProspectiveJudgment } from "../prospective-agenda";
import { readReentry, writeReentry, type ReentryState, type ReentryScope } from "../persistence/prospective-reentry-store";
import { readCurrentVNextAutomationWorkSnapshotV01 } from "../persistence/bounded-automation-authority";
import { readProjectAutomationControlV01 } from "../persistence/project-control-store";
import { readProjectRunResultSourceBindingV01 } from "./project-run-result-read-model";
import { inspectVNextOperatorPilotPacketLineageV01, projectVNextOperatorPilotContinuityV01 } from "./operator-pilot-project-continuity";
import { BoundedAutomationCycleServiceV01 } from "./bounded-automation-cycle";
import { LiveNativeHostRunServiceV01 } from "./live-native-host-run-service";
import { createSelectedSourceInspectionAdapter, SELECTED_SOURCE_RESULT, SELECTED_SOURCE_ADAPTER, type InspectionResult } from "../native-host/selected-source-inspection-adapter";
import { openVNextLocalOperatorDatabaseV01, admitVNextLocalOperatorMutationInsideTransactionV01, type VNextLocalOperatorPilotConfigV01, type VNextLocalOperatorSessionCredentialV01 } from "./local-operator-session";
import type { VNextLocalRuntimeClockV01 } from "./local-runtime-clock";

export function prospectiveHostFingerprint() { return hash(canonical({ host: hostname(), platform: process.platform, architecture: process.arch, adapter: SELECTED_SOURCE_ADAPTER })); }
export interface ProspectiveHostOptions {
  config: VNextLocalOperatorPilotConfigV01; agenda_ref: string;
  now?: () => string; open_database?: (config: VNextLocalOperatorPilotConfigV01) => Database.Database;
}

/** One opt-in host, project, agenda, work class and attempt. No general scheduler,
 * model invocation, credential replay, automatic Resume or retry. */
export class ProspectiveReentryHost {
  readonly live: LiveNativeHostRunServiceV01;
  readonly cycle: BoundedAutomationCycleServiceV01;
  private readonly now: () => string;
  private readonly open: NonNullable<ProspectiveHostOptions["open_database"]>;
  private readonly scope: ReentryScope;
  constructor(readonly options: ProspectiveHostOptions) {
    this.now = options.now ?? (() => new Date().toISOString());
    this.open = options.open_database ?? openVNextLocalOperatorDatabaseV01;
    this.scope = { ...options.config, agenda_ref: options.agenda_ref };
    this.live = new LiveNativeHostRunServiceV01({ open_database: this.open, now: this.now, timeout_ms: 10_000,
      adapter_factory: () => createSelectedSourceInspectionAdapter(this.now, () => {
        const guardDb = this.open(this.options.config);
        try {
          const state = readReentry(guardDb, this.scope);
          const control = readProjectAutomationControlV01(guardDb, this.options.config);
          const work = state ? readCurrentVNextAutomationWorkSnapshotV01(guardDb, { ...this.options.config, work_id: state.work_id }) : null;
          if (!state || state.phase !== "claimed" || !control?.enabled || control.paused || control.revision !== state.control_revision ||
            !work || !work.source.source_capability_grant.expires_at || Date.parse(work.source.source_capability_grant.expires_at) <= Date.parse(this.now())) throw new Error("prospective_inspection_cancelled_or_grant_changed");
        } finally { guardDb.close(); }
      }) });
    this.cycle = new BoundedAutomationCycleServiceV01({ open_database: this.open, now: this.now, live_service: this.live });
  }
  read() { const db = this.open(this.options.config); try { return readReentry(db, this.scope); } finally { db.close(); } }

  cancel(input: { credential: VNextLocalOperatorSessionCredentialV01; clock?: VNextLocalRuntimeClockV01 }) {
    const db = this.open(this.options.config);
    try {
      db.exec("BEGIN IMMEDIATE");
      const admission = admitVNextLocalOperatorMutationInsideTransactionV01(db, { ...input, config: this.options.config });
      const state = readReentry(db, this.scope);
      if (!state) throw new Error("prospective_agenda_missing");
      // Cancelling eligibility prevents any later claim. A claimed read-only
      // attempt can settle once; this neither resumes it nor admits another.
      this.save(db, state, admission.action_observed_at, "operator_cancelled",
        { ...state.history.at(-1)!.judgment, information_cutoff: admission.action_observed_at, action: "withdraw", next_action: "The operator cancelled this agenda; no further preparation is admitted." }, "stopped", null);
      db.exec("COMMIT");
      return admission;
    } catch (e) { if (db.inTransaction) db.exec("ROLLBACK"); throw e; } finally { db.close(); }
  }

  async wake(eventSourceRef?: string): Promise<{ status: string; state: ReentryState }> {
    const db = this.open(this.options.config);
    let state: ReentryState;
    let launch = false;
    try {
      db.exec("BEGIN IMMEDIATE");
      const current = readReentry(db, this.scope);
      if (!current || current.host_fingerprint !== prospectiveHostFingerprint()) throw new Error("prospective_host_binding_required");
      state = current;
      if (state.phase === "stopped") { db.exec("COMMIT"); return { status: "stopped", state }; }
      const at = this.now();
      if (Date.parse(at) < Date.parse(state.history.at(-1)!.at)) throw new Error("prospective_clock_regressed");
      const work = readCurrentVNextAutomationWorkSnapshotV01(db, { ...this.options.config, work_id: state.work_id });
      const packetId = work?.cycle_binding?.packet_ref.external_id ?? state.packet_id;
      const packetFingerprint = work?.cycle_binding?.packet_ref.source_ref ?? state.packet_fingerprint;
      const lineage = inspectVNextOperatorPilotPacketLineageV01(db, { config: this.options.config, packet_id: packetId, packet_fingerprint: packetFingerprint! });
      const input = readAgendaInput(readSelectedWorkSources(lineage.packet), at);
      if (!input || input.source_ref !== state.agenda_ref || !work || work.source.work_fingerprint !== state.work_fingerprint) throw new Error("prospective_source_binding_invalid");
      const event = eventSourceRef ? input.observations.find(o => o.source_ref === eventSourceRef && o.key === state.event_key && o.observed_at <= at) : null;
      if (eventSourceRef && (!event || state.event_refs.includes(eventSourceRef))) { db.exec("COMMIT"); return { status: "stale_or_duplicate_event", state }; }
      let observations: Observation[] = [];
      let receiptId = state.receipt_id, receiptFingerprint = state.receipt_fingerprint;
      if (work.cycle_binding?.run_id) {
        const run = readAutonomyRunLedgerRecord(work.cycle_binding.run_id, { db });
        if (!run || run.scope !== state.project_id || run.metadata.workspace_id !== state.workspace_id) throw new Error("prospective_run_binding_invalid");
        const ref = work.cycle_binding.receipt_ref;
        if (!ref) { db.exec("COMMIT"); return { status: run.metadata.reconciliation_required || this.live.readProjectionOnlyV01(this.options.config, run).reconciliation_required ? "reconciliation_required_no_retry" : "awaiting_result", state }; }
        const result = readProjectRunResultSourceBindingV01(db, { ...this.options.config, receipt_id: ref.external_id });
        if (!result.packet || result.packet.packet_id !== packetId || result.receipt.integrity.fingerprint !== ref.source_ref ||
          result.run?.run_id !== run.run_id || !run.metadata.terminal_receipt_persisted || run.metadata.reconciliation_required) throw new Error("prospective_result_not_reconciled");
        if (result.receipt.execution.status !== "completed") {
          state = this.save(db, state, at, "preparation_did_not_complete_no_retry", { ...judgeAgenda(input, at), action: "defer", next_action: "Reconcile the recorded terminal execution before any separately authorized new work." }, "stopped", null);
          db.exec("COMMIT"); return { status: "stopped", state };
        }
        const report = JSON.parse(result.receipt.result_summary.summary) as InspectionResult;
        if (report.version !== SELECTED_SOURCE_RESULT || report.agenda_ref !== state.agenda_ref || report.model_calls !== 0 ||
          !Array.isArray(report.observations) || report.observations.length !== input.agenda.inspections.length ||
          report.observations.some((o, i) => o.key !== input.agenda.inspections[i]!.key || !/^sha256:[a-f0-9]{64}$/u.test(o.source_ref) || Date.parse(o.observed_at) > Date.parse(result.receipt.recorded_at))) throw new Error("prospective_result_profile_invalid");
        observations = report.observations;
        receiptId = result.receipt.receipt_id; receiptFingerprint = result.receipt.integrity.fingerprint;
      }
      const due = state.next_wake_at !== null && Date.parse(state.next_wake_at) <= Date.parse(at);
      const newResult = receiptId !== state.receipt_id;
      if (!due && !event && !newResult) { db.exec("COMMIT"); return { status: "not_due", state }; }
      let judgment = judgeAgenda(input, at, observations);
      const control = readProjectAutomationControlV01(db, this.options.config);
      const continuity = projectVNextOperatorPilotContinuityV01(db, { config: this.options.config, clock: { now: () => at } });
      const stopped = !lineage.projection_current || continuity.packet_currentness !== "fresh" ||
        continuity.latest_compiled_packet?.packet_id !== packetId || !control?.enabled || control.paused || control.revision !== state.control_revision || judgment.action === "withdraw";
      if (stopped) judgment = { ...judgment, action: "withdraw", next_action: "Current source, premise or project permission changed. Retain history and stop further admission." };
      launch = !stopped && state.phase === "armed" && judgment.action === "prepare";
      const phase = stopped ? "stopped" : newResult || state.phase === "settled" ? "settled" : state.phase;
      const next = phase === "stopped" ? null : launch ? at : judgment.next_recheck_at;
      state = this.save(db, { ...state, receipt_id: receiptId, receipt_fingerprint: receiptFingerprint,
        event_refs: eventSourceRef ? [...state.event_refs, eventSourceRef] : state.event_refs }, at,
      newResult ? "source_bound_result_reentry" : event ? "selected_observation_event" : "due_recheck", judgment, phase, next);
      db.exec("COMMIT");
    } catch (e) { if (db.inTransaction) db.exec("ROLLBACK"); throw e; } finally { db.close(); }
    if (launch) {
      try {
        await this.cycle.runScheduled({ config: this.options.config, expected_control_revision: state.control_revision,
          scheduled_wake: { agenda_ref: state.agenda_ref, host_fingerprint: state.host_fingerprint } });
      } catch (error) {
        const failedDb = this.open(this.options.config);
        try {
          failedDb.exec("BEGIN IMMEDIATE");
          const failed = readReentry(failedDb, this.scope)!;
          if (failed.phase === "armed") this.save(failedDb, failed, this.now(), "admission_refused_no_retry",
            { ...failed.history.at(-1)!.judgment, action: "defer", next_action: "Admission refused. Inspect source, grant and budget before separately authorizing new work." }, "stopped", null);
          failedDb.exec("COMMIT");
        } catch { if (failedDb.inTransaction) failedDb.exec("ROLLBACK"); } finally { failedDb.close(); }
        throw error;
      }
      state = this.read()!;
    }
    return { status: launch ? "admitted" : state.phase, state };
  }

  private save(db: Database.Database, state: ReentryState, at: string, reason: string, judgment: ProspectiveJudgment,
    phase: ReentryState["phase"], next: string | null): ReentryState {
    // Coalesce overdue triggers; never enumerate missed intervals or catch up.
    if (state.history.length >= 23) { phase = "stopped"; next = null; }
    const { judgment_id: _id, information_cutoff: _cutoff, ...material } = judgment;
    judgment = { ...judgment, judgment_id: hash(canonical({ ...material, information_cutoff: null })) };
    const changed = judgment.judgment_id !== state.history.at(-1)!.judgment.judgment_id || reason === "source_bound_result_reentry";
    const nextState = { ...state, revision: state.revision + 1, phase, next_wake_at: next,
      history: changed ? [...state.history, { at, reason, judgment }] : state.history };
    writeReentry(db, nextState, state.revision); return nextState;
  }

  /** Bounded foreground host owner. Restart reads SQLite eligibility/result state;
   * no daemon installation, recurrence expansion or persisted cookie is needed. */
  async runFor(maxRuntimeMs: number, signal: AbortSignal) {
    if (!Number.isSafeInteger(maxRuntimeMs) || maxRuntimeMs < 1 || maxRuntimeMs > 3_600_000) throw new Error("prospective_host_budget_invalid");
    const until = performance.now() + maxRuntimeMs;
    try {
      while (!signal.aborted && performance.now() < until) {
        const result = await this.wake();
        if (result.state.phase === "stopped" || result.status === "reconciliation_required_no_retry" || ["settled", "armed"].includes(result.state.phase) && !result.state.next_wake_at) return result;
        const wait = result.state.phase === "claimed" ? 50 : result.state.next_wake_at ? Math.max(10, Date.parse(result.state.next_wake_at) - Date.parse(this.now())) : maxRuntimeMs;
        await new Promise<void>(resolve => {
          const done = () => { clearTimeout(timer); signal.removeEventListener("abort", done); resolve(); };
          const timer = setTimeout(done, Math.min(wait, 1_000, Math.max(1, until - performance.now())));
          signal.addEventListener("abort", done, { once: true });
        });
      }
      return { status: "host_budget_ended", state: this.read() };
    } finally { await this.live.shutdown(); }
  }
}
