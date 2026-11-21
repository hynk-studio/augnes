import type Database from "better-sqlite3";
import { readSelectedWorkSources } from "@/lib/intake/selected-work-source-comparison";
import { CODEX_APP_SERVER_CLIENT_VERSION_V01 } from "@/types/vnext/codex-isolated-auth-projection";
import type { NativeHostPacketLineageV01 } from "@/types/vnext/native-host-adapter";
import { AUTHORED_SUCCESSOR_CONTEXT_V01 } from "@/types/vnext/project-work-initialization";
import type { TaskContextPacketV01 } from "@/types/vnext/task-context-packet";
import { buildResultWorkSourceV01 } from "./authored-successor-task";
import type { PersistedHostPacketAdmissionV01 } from "./direct-native-host-round-trip";
import { readProjectRunResultSourceBindingV01 } from "./project-run-result-read-model";

export type PiPatchLineage = PersistedHostPacketAdmissionV01["packet_lineage"] | NativeHostPacketLineageV01;
const checkId = "final_newline";

/** Only the immediate, explicitly retained result can supply the file. Its
 * reported digest is checked against the registered root by the byte reader. */
export function readPiPatchPredecessor(db: Database.Database, packet: TaskContextPacketV01, lineage: PiPatchLineage) {
  if (!("predecessor_receipt_ref" in lineage) ||
      !packet.compatibility.source_contracts.includes(AUTHORED_SUCCESSOR_CONTEXT_V01)) return null;
  const prior = readProjectRunResultSourceBindingV01(db, {
    workspace_id: packet.workspace_id, project_id: packet.project_id, receipt_id: lineage.predecessor_receipt_ref.external_id,
  });
  const { receipt, run } = prior;
  if (receipt.integrity.fingerprint !== lineage.predecessor_receipt_ref.source_ref || !prior.packet ||
      !run || run.status !== "completed" || receipt.execution.status !== "completed" ||
      run.metadata.terminal_receipt_persisted !== true || run.metadata.reconciliation_required !== false ||
      run.metadata.adapter_version !== CODEX_APP_SERVER_CLIENT_VERSION_V01 ||
      run.metadata.adapter_execution_profile !== "native_host_managed_model") return null;

  const selected = buildResultWorkSourceV01(prior);
  if (!selected || !readSelectedWorkSources(packet).some(entry => entry.source_ref === selected.source_ref)) return null;
  // The skipped check is run-scoped. With several changed files its target
  // would be ambiguous, even if exactly one of them happened to lack an LF.
  const [artifact] = receipt.changed_artifacts;
  const pending = receipt.skipped_checks.filter(check => check.check_id === checkId);
  if (receipt.changed_artifacts.length !== 1 || !artifact || artifact.artifact_ref.ref_type !== "repository_relative_artifact" ||
      (artifact.change_kind !== "added" && artifact.change_kind !== "modified") || artifact.basis !== "attested" ||
      !artifact.after_hash || !/^sha256:[a-f0-9]{64}$/u.test(artifact.after_hash) ||
      pending.length !== 1 || !pending[0]!.required || receipt.checks.some(check => check.check_id === checkId)) return null;

  return {
    path: artifact.artifact_ref.external_id, after_hash: artifact.after_hash,
    predecessor: { receipt_id: receipt.receipt_id, receipt_fingerprint: receipt.integrity.fingerprint, check_id: checkId },
  };
}
