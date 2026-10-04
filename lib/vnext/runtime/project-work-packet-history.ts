import type Database from "better-sqlite3";
import { assertVNextCoreRecordMatchesProtocolPayloadBindingV01, iterateVNextCoreRecordsV01 } from "../persistence/durable-semantic-store";
import { validateTaskContextPacketV01 } from "../task-context-packet";
import type { TaskContextPacketV01 } from "@/types/vnext/task-context-packet";

// A read-operation budget, not a revision-number or stored-history invariant.
// The existing initialization reader already owns the 4,096-record ceiling.
// Required evidence that exceeds a read budget is unavailable, never absent.
export const PROJECT_WORK_HISTORY_READ_BUDGET_V01 = { records: 4_096, packet_bytes: 16 * 1024 * 1024 } as const;

export class ProjectWorkPacketHistoryReadErrorV01 extends Error {
  constructor(readonly reason: "read_budget_exceeded" | "packet_invalid" | "packet_envelope_invalid") {
    super(`project_work_history_${reason}`);
  }
}

/** Caller owns a synchronous read transaction. Reuse the Core owner's indexed
 * 64-row keyset pages; do not interpret a full first page as complete history. */
export function readProjectWorkPacketHistoryV01(db: Database.Database, scope: { workspace_id: string; project_id: string }) {
  const records = [];
  let bytes = 0;
  for (const record of iterateVNextCoreRecordsV01(db, { ...scope, record_kind: "task_context_packet", order: "oldest_first" })) {
    bytes += Buffer.byteLength(JSON.stringify(record.payload));
    if (records.length >= PROJECT_WORK_HISTORY_READ_BUDGET_V01.records || bytes > PROJECT_WORK_HISTORY_READ_BUDGET_V01.packet_bytes)
      throw new ProjectWorkPacketHistoryReadErrorV01("read_budget_exceeded");
    const packet = record.payload as TaskContextPacketV01;
    if (validateTaskContextPacketV01(packet, { evaluated_at: packet?.generated_at ?? "" }).status !== "valid")
      throw new ProjectWorkPacketHistoryReadErrorV01("packet_invalid");
    assertVNextCoreRecordMatchesProtocolPayloadBindingV01(record, {
      workspace_id: packet.workspace_id, project_id: packet.project_id, fingerprint: packet.integrity.fingerprint,
    });
    if (record.record_id !== packet.packet_id || record.created_at !== packet.generated_at)
      throw new ProjectWorkPacketHistoryReadErrorV01("packet_envelope_invalid");
    records.push({ ...record, packet });
  }
  return records;
}
