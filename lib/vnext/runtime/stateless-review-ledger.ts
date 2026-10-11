import type Database from "better-sqlite3";
import type { AutonomyRunRecord } from "@/types/autonomy-runner-execution";
import { readAutonomyRunLedgerRecord, updateAutonomyRunLedgerFields } from "@/lib/autonomy/runner-ledger";
import { isTerminalRunnerStatus } from "@/lib/autonomy/runner-state";
import { STATELESS_WORK, reviewCheck as check, type StatelessGrant } from "../stateless-work";
import { canonicalizeProtocolValueV01 as canonical, createProtocolSha256V01 as hash } from "../protocol-primitives";
import type { VNextLocalOperatorPilotConfigV01 as Config } from "./local-operator-session";
type Scope = Pick<Config, "workspace_id" | "project_id">;
const fingerprint = (value: unknown) => hash(canonical(value));

export interface ReviewState { version: string; grant_id: string; grant_fingerprint: string; revision: number; cancelled: boolean; recovery_suspended: boolean; pause_after_observation?: true; observation_resume_generation?: string }
export function stateOf(run: AutonomyRunRecord) {
  const state = run.metadata.stateless_review as ReviewState;
  check(state?.version === STATELESS_WORK && Number.isSafeInteger(state.revision) && state.revision > 0 &&
    typeof state.cancelled === "boolean" && typeof state.recovery_suspended === "boolean", "run_state_invalid");
  check(state.pause_after_observation === undefined || state.pause_after_observation === true, "checkpoint_state_invalid");
  check(state.observation_resume_generation === undefined || (state.pause_after_observation === true && typeof state.observation_resume_generation === "string" && /^[0-9a-f-]{36}$/.test(state.observation_resume_generation)), "checkpoint_state_invalid");
  return state;
}
export function readRun(db: Database.Database, config: Scope, id: string) {
  const run = readAutonomyRunLedgerRecord(id, { db });
  check(run, "run_missing");
  check(run.scope === config.project_id && run.metadata.workspace_id === config.workspace_id && run.metadata.project_id === config.project_id && run.steps.length === 3, "run_scope_invalid");
  stateOf(run);
  for (const [index, step] of run.steps.entries()) {
    check(step.run_id === id && step.step_index === index + 1 && step.title === ["choose", "observe", "conclude"][index], "step_identity_invalid");
    if (step.status === "completed") {
      const { result_fingerprint, ...material } = step.output;
      check(result_fingerprint === fingerprint(material), "stored_result_changed");
    }
  }
  return run;
}
export function patchRun(db: Database.Database, run: AutonomyRunRecord, patch: Partial<ReviewState>, at: string, status = run.status, stopReason = run.stop_reason) {
  updateAutonomyRunLedgerFields(run.run_id, { status, stop_reason: stopReason, updated_at: at,
    ...(status === "running" && !run.started_at ? { started_at: at } : {}), ...(isTerminalRunnerStatus(status) ? { finished_at: at } : {}), metadata: { ...run.metadata, stateless_review: { ...stateOf(run), ...patch, revision: stateOf(run).revision + 1 } } }, { db });
}

/** A saved boundary is local progress, never settlement of a dispatched claim. */
export function readObservationCheckpoint(run: AutonomyRunRecord, grant: StatelessGrant) {
  const state = stateOf(run), [choose, observe, conclude] = run.steps;
  if (!grant.request.pause_after_observation || !state.pause_after_observation || isTerminalRunnerStatus(run.status) || state.cancelled || state.recovery_suspended ||
    run.metadata.stateless_review_disposition || run.metadata.reconciliation_required !== false ||
    choose?.status !== "completed" || observe?.status !== "completed" || conclude?.status !== "planned") return null;
  check(observe.output.observation_fingerprint === fingerprint(observe.output.observation), "checkpoint_observation_invalid");
  return { run_id: run.run_id, revision: state.revision, grant_id: grant.grant_id, grant_fingerprint: grant.grant_fingerprint,
    packet_id: grant.request.packet_id, packet_fingerprint: grant.request.packet_fingerprint,
    choose_result_fingerprint: choose.output.result_fingerprint, observation_result_fingerprint: observe.output.result_fingerprint,
    observation_generation: observe.output.generation, observation_fingerprint: observe.output.observation_fingerprint };
}
export type StatelessObservationCheckpoint = NonNullable<ReturnType<typeof readObservationCheckpoint>>;
