import type Database from "better-sqlite3";
import { directionObject, directionRef } from "../project-direction";
import { directionCheck as check } from "../persistence/project-direction-store";
import { readReentry } from "../persistence/prospective-reentry-store";
import { ProspectiveReentryHost, prospectiveHostFingerprint } from "./prospective-reentry";
import { admitVNextLocalOperatorMutationInsideTransactionV01, type VNextLocalOperatorPilotConfigV01, type VNextLocalOperatorSessionCredentialV01 } from "./local-operator-session";
import type { VNextLocalRuntimeClockV01 } from "./local-runtime-clock";

/** One explicit browser action borrows the existing foreground host owner.
 * Arming alone still never starts a host. No daemon or retry is introduced. */
export async function runDirectionInspection(db: Database.Database, input: {
  config: VNextLocalOperatorPilotConfigV01; credential: VNextLocalOperatorSessionCredentialV01;
  request: unknown; clock?: VNextLocalRuntimeClockV01; signal: AbortSignal;
}) {
  const body = directionObject(input.request, ["action", "agenda_ref"]);
  check(body.action === "run_inspection" && process.platform === "darwin" && process.arch === "arm64", "qualified_inspection_required");
  const agendaRef = directionRef(body.agenda_ref);
  check(!input.signal.aborted && !db.inTransaction, "inspection_request_ended");
  const admission = db.transaction(() => {
    const admission = admitVNextLocalOperatorMutationInsideTransactionV01(db, input);
    const state = readReentry(db, { ...input.config, agenda_ref: agendaRef });
    check(state?.phase === "armed" && state.host_fingerprint === prospectiveHostFingerprint(), "inspection_not_armed_reconcile_before_retry");
    return admission;
  }).immediate();
  const host = new ProspectiveReentryHost({ config: input.config, agenda_ref: agendaRef, now: input.clock?.now });
  try {
    const result = await host.runFor(15_000, input.signal);
    return { inspection: result, host_started: true, model_calls: 0, session_admission: admission };
  } catch {
    // The action nonce is already consumed. Return its replacement even when
    // execution needs reconciliation, preserving the durable failure/no-retry.
    return { inspection: { status: "inspect_durable_state_before_retry", state: host.read() }, host_started: true, model_calls: 0, session_admission: admission };
  } finally { await host.live.shutdown(); }
}
