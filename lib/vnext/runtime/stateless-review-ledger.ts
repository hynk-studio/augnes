import type Database from "better-sqlite3";
import type { AutonomyRunRecord } from "@/types/autonomy-runner-execution";
import { readAutonomyRunLedgerRecord, updateAutonomyRunLedgerFields } from "@/lib/autonomy/runner-ledger";
import { isTerminalRunnerStatus } from "@/lib/autonomy/runner-state";
import { STATELESS_WORK, reviewCheck as check } from "../stateless-work";
import { canonicalizeProtocolValueV01 as canonical, createProtocolSha256V01 as hash } from "../protocol-primitives";
import type { VNextLocalOperatorPilotConfigV01 as Config } from "./local-operator-session";
type Scope = Pick<Config, "workspace_id" | "project_id">;
const fingerprint = (value: unknown) => hash(canonical(value));

export interface ReviewState { version: string; grant_id: string; grant_fingerprint: string; revision: number; cancelled: boolean; recovery_suspended: boolean }
export function stateOf(run: AutonomyRunRecord) {
  const state = run.metadata.stateless_review as ReviewState;
  check(state?.version === STATELESS_WORK && Number.isSafeInteger(state.revision) && state.revision > 0 &&
    typeof state.cancelled === "boolean" && typeof state.recovery_suspended === "boolean", "run_state_invalid");
  return state;
}
export function readRun(db: Database.Database, config: Scope, id: string) {
  const run = readAutonomyRunLedgerRecord(id, { db });
  check(run && run.scope === config.project_id && run.metadata.workspace_id === config.workspace_id && run.metadata.project_id === config.project_id && run.steps.length === 3, "run_scope_invalid");
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
