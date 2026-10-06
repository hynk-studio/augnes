import { validateStatelessGrant } from "../stateless-work";
import { readStatelessGrant } from "../persistence/stateless-work-grant";
import type Database from "better-sqlite3";
import { readEvidenceRecordV01 } from "@/lib/vnext/persistence/project-verify-material-store";
import { readVNextCoreRecordV01 } from "../persistence/durable-semantic-store";
import { validateProspectiveAuthorization, readProspectiveAuthorization } from "../persistence/prospective-authorization";

/** Shared by admission and historical reconstruction. Recorded Evidence is
 * immutable support material, never execution, acceptance or a semantic head.
 * Its canonical owner validates scope, integrity and reserved producer sources;
 * invalid material throws instead of becoming an eligibility exception.
 * All other work records retain their existing blocking behavior. */
export function isNonBlockingPreExecutionRecordV01(
  db: Database.Database,
  scope: { workspace_id: string; project_id: string },
  row: { record_kind: string; record_id: string },
  preparationPacketIds: ReadonlySet<string>,
): boolean {
  if (row.record_kind === "task_context_packet") return preparationPacketIds.has(row.record_id);
  if (row.record_kind === "work_expectation_record") return true;
  if (row.record_kind === "capability_grant") {
    const record = readVNextCoreRecordV01(db, { ...scope, record_kind: "capability_grant", record_id: row.record_id });
    if (!record) return false;
    if (validateStatelessGrant(record.payload)) {
      const grant = readStatelessGrant(db, { ...scope, grant_id: row.record_id, grant_fingerprint: record.fingerprint });
      return preparationPacketIds.has(grant.request.packet_id);
    }
    if (!validateProspectiveAuthorization(record.payload)) return false;
    // Explicit permission without queued/executed work is not work history.
    // Revision preserves the grant's old source; admission then refuses it.
    const grant = readProspectiveAuthorization(db, { ...scope, grant_id: row.record_id, grant_fingerprint: record.fingerprint });
    return preparationPacketIds.has(grant.request.packet_id);
  }
  if (row.record_kind === "evidence_record") {
    return readEvidenceRecordV01(db, { ...scope, evidence_id: row.record_id }) !== null;
  }
  return false;
}
