import type Database from "better-sqlite3";
import { handoffCheck as check, handoffHash, handoffSelectedNotes, parseWorkHandoff, readWorkHandoff, type WorkHandoff } from "../work-handoff";
import { readCurrentProjectWorkPacketLineageV01 } from "./operator-pilot-project-continuity";
import { readProjectWorkInitializationV01 } from "./project-work-initialization";
import { readProjectRunResultSourceBindingV01 } from "./project-run-result-read-model";
import { readRun, stateOf } from "./stateless-review-ledger";
import { rootBinding } from "./stateless-source-review";
import { statelessMandatoryEntries, STATELESS_WORK } from "../stateless-work";
import { assertStatelessUnsettledAdmission } from "./stateless-review-disposition";
import { assertTerminalHistoryActive } from "./stateless-terminal-authorship";
import { assertPacketDirectionCurrent, effectiveDirection } from "../persistence/project-direction-store";
import type { VNextLocalOperatorPilotConfigV01 as Config } from "./local-operator-session";
import type { DefineInitialProjectWorkRequestV01 } from "@/types/vnext/project-work-initialization";

/** Only a validated, unexecuted ordinary successor of a completed stateless
 * observation. This does not export a project or a resumable controller. */
export function exportWorkHandoff(db: Database.Database, config: Config, expected: { packet_id: string; packet_fingerprint: string; receipt_id: string }, at: string) {
  const lineage = readCurrentProjectWorkPacketLineageV01(db, config), packet = lineage?.packet;
  check(packet && lineage.projection_current && packet.packet_id === expected.packet_id && packet.integrity.fingerprint === expected.packet_fingerprint && packet.capability_grant === null && !readWorkHandoff(packet), "current_unexecuted_work_required");
  check(packet.work_ref && typeof packet.work_ref === "object", "work_identity_required");
  const init = readProjectWorkInitializationV01(db, config); check(init.project_work_binding, "project_binding_unavailable");
  check(!db.prepare("SELECT 1 FROM autonomy_runs WHERE scope=? AND (NOT json_valid(metadata_json) OR json_extract(metadata_json,'$.packet_id')=?) LIMIT 1").get(config.project_id, packet.packet_id), "execution_history_present");
  check(!packet.selected_context.some(e => e.entry_kind === "accepted_state_ref"), "semantic_state_not_supported");
  check(!effectiveDirection(db, config, at), "direction_transfer_not_supported");
  assertPacketDirectionCurrent(db, packet, at); assertStatelessUnsettledAdmission(db, config, packet); assertTerminalHistoryActive(db, config, packet);
  const result = readProjectRunResultSourceBindingV01(db, { ...config, receipt_id: expected.receipt_id });
  const ref = packet.compatibility.source_refs.find(r => r.ref_type === "run_receipt" && r.external_id === expected.receipt_id && r.source_ref === result.receipt.integrity.fingerprint);
  check(ref && result.run && result.packet && result.receipt.compatibility.source_contracts.includes(STATELESS_WORK), "receipt_lineage_missing");
  const run = readRun(db, config, result.run.run_id), state = stateOf(run), output = run.steps[1]!.output;
  check(run.status === "completed" && run.metadata.reconciliation_required === false && run.metadata.terminal_receipt_persisted === true && result.receipt.execution.status === "completed" && output.observation_fingerprint === handoffHash(output.observation), "completed_observation_required");
  const material = { version: "source_bound_work_handoff.v0.1" as const,
    source: { workspace_id: packet.workspace_id, project_id: packet.project_id, work_id: packet.work_ref.external_id, packet_id: packet.packet_id, packet_fingerprint: packet.integrity.fingerprint,
      generated_at: packet.generated_at, expires_at: packet.expires_at, exported_at: at, root_fingerprint: rootBinding(db, config).fingerprint },
    task: packet.task, selected_notes: handoffSelectedNotes(packet),
    obligations: statelessMandatoryEntries(packet).map(e => ({ entry_id: e.entry_id, source_ref: e.source_ref!, bounded_summary: e.bounded_summary! })),
    omissions: packet.excluded_context.map(e => ({ entry_id: e.entry_id, reason: e.why_excluded })),
    evidence: { workspace_id: packet.workspace_id, project_id: packet.project_id, packet_id: result.packet.packet_id, packet_fingerprint: result.packet.integrity.fingerprint,
      run_id: run.run_id, receipt_id: result.receipt.receipt_id, receipt_fingerprint: result.receipt.integrity.fingerprint, verification: result.receipt.verification.status,
      generation: output.generation as string, grant_id: state.grant_id, grant_fingerprint: state.grant_fingerprint,
      observation: output.observation as WorkHandoff["evidence"]["observation"], observation_fingerprint: output.observation_fingerprint as string } };
  return parseWorkHandoff({ ...material, fingerprint: handoffHash(material) });
}

/** Receiving preview is authenticated but read-only. The ordinary first-work
 * transaction checks this project root, direction and exact task again. */
export function previewReceivedWork(db: Database.Database, config: Config, value: unknown, at: string) {
  const handoff = parseWorkHandoff(value), state = readProjectWorkInitializationV01(db, config);
  check(state.state === "not_defined" && state.project_work_binding, "fresh_bound_project_required");
  check(handoff.source.project_id !== config.project_id, "same_project_refused");
  const request: DefineInitialProjectWorkRequestV01 = { action: "define_initial_project_work", workspace_id: config.workspace_id, project_id: config.project_id,
    expected_active_project_id: config.project_id, expected_active_selection_revision: state.active_selection_revision, expected_project_work_binding: state.project_work_binding, expected_initialization_state: "not_defined", ...handoff.task,
    handoff: { snapshot: handoff, expected_root_fingerprint: rootBinding(db, config).fingerprint, expected_direction_ref: effectiveDirection(db, config, at)?.ref ?? null } };
  return { request, fingerprint: handoffHash(request), execution_authority_granted: false, source_authenticity: "imported_unverified", material_availability: "transferred_historical_bytes", current_local_material: "not_verified" };
}
