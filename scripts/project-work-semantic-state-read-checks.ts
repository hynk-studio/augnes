import assert from "node:assert/strict";
import Database from "better-sqlite3";
import {
  inspectVNextOperatorPilotPacketLineageV01,
  readCurrentProjectWorkPacketLineageV01,
} from "../lib/vnext/runtime/operator-pilot-project-continuity";
import type { VNextLocalOperatorPilotConfigV01 } from "../lib/vnext/runtime/local-operator-session";

// Exercise the production history reader on isolated copies of a genuinely
// authored/reviewed fixture. No validation result is supplied by this helper.
export function assertFreshProjectWorkSemanticStateReadsV01(
  original: Database.Database,
  config: VNextLocalOperatorPilotConfigV01,
): void {
  const bytes = original.serialize();
  let projectionReads = 0;
  const db = new Database(bytes, { verbose(sql) {
    if (typeof sql === "string" && sql.includes("LEFT JOIN vnext_semantic_state_entries AS state")) projectionReads++;
  } });
  try {
    const first = readCurrentProjectWorkPacketLineageV01(db, config);
    assert(first);
    const firstReads = projectionReads;
    assert(firstReads > 0, "A populated packet history validates current state");
    const afterFirst = db.serialize();
    assert.deepEqual(readCurrentProjectWorkPacketLineageV01(db, config), first);
    assert.equal(projectionReads, firstReads * 2, "Every public read validates state anew");
    assert(afterFirst.equals(db.serialize()), "Both reads preserve all database bytes");

    const foreign = { ...config, project_id: "project:foreign-semantic-state-read" };
    assert.equal(readCurrentProjectWorkPacketLineageV01(db, foreign), null);
    assert.deepEqual(readCurrentProjectWorkPacketLineageV01(db, config), first);
    console.log(JSON.stringify({ packet_history_state_read: "available", projection_presence_reads_per_call: firstReads,
      fresh_public_read: true, foreign_scope: "separate", writes: 0 }));
  } finally { db.close(); }

  const corruptions = [
    { name: "state", sql: "UPDATE vnext_semantic_state_entries SET bounded_state_summary = 'changed after read' WHERE workspace_id = ? AND project_id = ?" },
    { name: "head", sql: "UPDATE vnext_semantic_target_heads SET current_state_fingerprint = ? WHERE workspace_id = ? AND project_id = ?" },
    { name: "receipt", sql: "UPDATE vnext_core_records SET payload_json = json_set(payload_json, '$.source_proposal.proposal_fingerprint', ?) WHERE record_kind = 'state_transition_receipt' AND workspace_id = ? AND project_id = ?" },
    { name: "packet", sql: "UPDATE vnext_core_records SET payload_json = json_set(payload_json, '$.task.goal', 'changed after read') WHERE record_kind = 'task_context_packet' AND workspace_id = ? AND project_id = ?" },
  ];
  for (const corruption of corruptions) {
    const copy = new Database(bytes);
    try {
      const current = readCurrentProjectWorkPacketLineageV01(copy, config);
      assert(current);
      const args = [config.workspace_id, config.project_id];
      if (corruption.name === "head" || corruption.name === "receipt") args.unshift("sha256:" + "0".repeat(64));
      // Only these disposable copies permit raw corruption. Production keeps
      // the immutable-record triggers, and the original fixture is untouched.
      let trigger: { sql: string } | undefined;
      if (corruption.name === "receipt" || corruption.name === "packet") {
        trigger = copy.prepare("SELECT sql FROM sqlite_master WHERE type = 'trigger' AND name = 'trg_vnext_core_records_immutable_update'").get() as { sql: string };
        copy.exec("DROP TRIGGER trg_vnext_core_records_immutable_update");
      }
      assert(copy.prepare(corruption.sql).run(...args).changes > 0);
      if (trigger) copy.exec(trigger.sql);
      const damaged = copy.serialize();
      const refuses = () => readCurrentProjectWorkPacketLineageV01(copy, config);
      assert.throws(refuses, /fingerprint|mismatch|conflict|invalid|drift/);
      assert.throws(() => inspectVNextOperatorPilotPacketLineageV01(copy, {
        config, packet_id: current.packet.packet_id, packet_fingerprint: current.packet.integrity.fingerprint,
      }), /fingerprint|mismatch|conflict|invalid|drift/);
      assert(damaged.equals(copy.serialize()), "Refusal preserves damaged input, without repair");
      assert.equal(copy.inTransaction, false);
      console.log(JSON.stringify({ packet_history_state_read: corruption.name, after_prior_success: "refused", standalone: "refused", writes: 0 }));
    } finally { copy.close(); }
  }

  const empty = new Database(bytes);
  try {
    const trigger = empty.prepare("SELECT sql FROM sqlite_master WHERE type = 'trigger' AND name = 'trg_vnext_core_records_immutable_delete'").get() as { sql: string };
    empty.exec("DROP TRIGGER trg_vnext_core_records_immutable_delete");
    empty.prepare("DELETE FROM vnext_core_records WHERE record_kind = 'task_context_packet' AND workspace_id = ? AND project_id = ?")
      .run(config.workspace_id, config.project_id);
    empty.exec(trigger.sql);
    empty.prepare("UPDATE vnext_semantic_state_entries SET bounded_state_summary = 'unrelated to empty packet history' WHERE workspace_id = ? AND project_id = ?")
      .run(config.workspace_id, config.project_id);
    assert.equal(readCurrentProjectWorkPacketLineageV01(empty, config), null,
      "An empty packet history retains its lazy validation behavior");
  } finally { empty.close(); }
}
