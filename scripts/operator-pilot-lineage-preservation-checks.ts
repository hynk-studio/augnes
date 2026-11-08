import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { copyFileSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import Database from "better-sqlite3";
import { canonicalizeProtocolValueV01 as canonical } from "../lib/vnext/protocol-primitives";
import { readVNextCoreRecordV01 } from "../lib/vnext/persistence/durable-semantic-store";
import { commitVNextSemanticTransitionV01, loadValidatedVNextSemanticTransitionRelationV01 } from "../lib/vnext/runtime/durable-semantic-transition";
import { compileTaskContextPacketFromPersistedSemanticStateV01 } from "../lib/vnext/runtime/persisted-semantic-context-compiler";
import { validateVNextOperatorPilotReviewDecisionProvenanceV01 } from "../lib/vnext/runtime/operator-pilot-review-material";
import { validateVNextOperatorPilotSemanticGateConfirmationProvenanceV01 } from "../lib/vnext/runtime/operator-pilot-semantic-transition";
import { readVNextOperatorPilotProposalDurableLineageV01 } from "../lib/vnext/runtime/operator-pilot-workbench-lineage";
import type { VNextLocalOperatorPilotConfigV01 } from "../lib/vnext/runtime/local-operator-session";
import type { TaskContextPacketV01 } from "../types/vnext/task-context-packet";

// These are the original pre-hex-issuance smoke identities. They are never
// substituted for the expectations of a newly issued current session.
export const LEGACY_OPERATOR_PILOT_FULL_LOOP_ANCHORS = {
  review_decision_id: "review-decision:bd118b1caeaeed2b1d61e893",
  review_decision_fingerprint: "sha256:601e179c9cc9f552ee2711289bbe4f3f7bbf1e443f1559079a4472d7880db092",
  confirmation_digest: "sha256:141dd6940cd1cfcbcca73062f97ba14e7209a2a9108350ac1cebeded69ab8aa8",
  gate_id: "semantic-commit-gate:eb857d907ce64c601e92736d",
  gate_fingerprint: "sha256:5c1674a4905d72b16d536089ed9eb847e04e3057fe81024fd8a43c9f178f8dd5",
  transition_receipt_id: "state-transition-receipt:3f7544f82b8d16a61663be83",
  transition_receipt_idempotency_key: "sha256:4963355b67edcdc610eeb8ce3b317a6d530f39a2e39797a6c4f88071f3423042",
  transition_receipt_fingerprint: "sha256:107e3d5017eccf82f3735775bf7efc9691eb761e99702ecc78b73c883105a54d",
  later_packet_id: "task-context-packet:c837ebe022057fa444b7e8f",
  later_packet_fingerprint: "sha256:0316fdb225280490122010c70661ce4397a659f861ab92305ccd475c80cfd31c",
  full_loop_fingerprint: "sha256:28dafe55f8271e3d14213a8d79f4dfb3d10361520ece6d594867f0960c9ac691",
} as const;

type Anchors = { [K in Exclude<keyof typeof LEGACY_OPERATOR_PILOT_FULL_LOOP_ANCHORS, "full_loop_fingerprint">]: string };
const tables = ["vnext_core_records", "vnext_semantic_state_entries", "vnext_semantic_target_heads", "vnext_local_operator_sessions"] as const;
const digest = (bytes: string | Buffer) => createHash("sha256").update(bytes).digest("hex");
function snapshot(db: Database.Database) {
  return Object.fromEntries(tables.map(table => [table, db.prepare(`SELECT * FROM ${table} ORDER BY rowid`).all()]));
}

/** Exercise an already committed database, never regenerate its legacy IDs or
 * records. The caller supplies the actual source-created checkpoint. Work occurs
 * only on disposable copies; session credentials are neither issued nor revived. */
export function assertOperatorPilotLineagePreserved(
  databasePath: string,
  scope: Pick<VNextLocalOperatorPilotConfigV01, "workspace_id" | "project_id" | "operator_id">,
  expected: Anchors,
) {
  const root = mkdtempSync(path.join(tmpdir(), "augnes-pilot-lineage-preservation-"));
  const beforeFile = digest(readFileSync(databasePath));
  const reopenPath = path.join(root, "reopened.db"), backupPath = path.join(root, "backup.db"), restoredPath = path.join(root, "restored.db");
  let before: ReturnType<typeof snapshot> | undefined;
  try {
    copyFileSync(databasePath, reopenPath);
    for (const phase of ["reopen", "restore"] as const) {
      const database = phase === "reopen" ? reopenPath : restoredPath;
      const db = new Database(database, { fileMustExist: true });
      try {
        assert.deepEqual(db.pragma("integrity_check"), [{ integrity_check: "ok" }]);
        const original = snapshot(db);
        if (before) assert(canonical(original) === canonical(before), "Backup/restore preserves every original canonical row, payload byte string and provenance row");
        else before = original;
        const config = { ...scope, enabled: true as const, database_path: database };
        const transition = loadValidatedVNextSemanticTransitionRelationV01(db, { ...scope,
          transition_receipt_id: expected.transition_receipt_id, transition_receipt_fingerprint: expected.transition_receipt_fingerprint });
        assert.equal(transition.decision.decision_id, expected.review_decision_id);
        assert.equal(transition.decision.integrity.fingerprint, expected.review_decision_fingerprint);
        assert.equal(transition.gate_record.gate_record_id, expected.gate_id);
        assert.equal(transition.gate_record.integrity.fingerprint, expected.gate_fingerprint);
        assert.equal(transition.gate_record.confirmation_digest, expected.confirmation_digest);
        assert.equal(transition.receipt.idempotency_key, expected.transition_receipt_idempotency_key);
        assert.equal(validateVNextOperatorPilotReviewDecisionProvenanceV01(db, { config, proposal: transition.proposal,
          decision: transition.decision, authenticated_session_id: null }).status, "valid");
        assert.equal(validateVNextOperatorPilotSemanticGateConfirmationProvenanceV01(db, { config, proposal: transition.proposal,
          decision: transition.decision, gate: transition.gate_record }).status, "valid");
        const lineage = readVNextOperatorPilotProposalDurableLineageV01(db, { config, proposal: transition.proposal, clock: { now: () => "2026-07-11T09:19:00.000Z" } });
        assert.equal(lineage.overall_status, "packet_compiled");
        assert.equal(lineage.read_only, true);
        assert.equal(lineage.semantic_authority_granted, false);
        assert(lineage.chains.some((chain) => chain.transition.receipt_id === expected.transition_receipt_id &&
          chain.compiled_packet?.packet_id === expected.later_packet_id));
        const persisted = readVNextCoreRecordV01(db, { ...scope, record_kind: "task_context_packet", record_id: expected.later_packet_id });
        assert(persisted && persisted.fingerprint === expected.later_packet_fingerprint);
        const packet = persisted.payload as TaskContextPacketV01;
        const priorRef = transition.proposal.task_context_packet_ref;
        assert(priorRef);
        const prior = readVNextCoreRecordV01(db, { ...scope, record_kind: "task_context_packet", record_id: priorRef.external_id });
        assert(prior && prior.fingerprint === priorRef.source_ref);
        const replay = commitVNextSemanticTransitionV01(db, { workspace_id: scope.workspace_id, project_id: scope.project_id,
          proposal_id: transition.proposal.proposal_id, proposal_fingerprint: transition.proposal.integrity.fingerprint,
          decision_id: expected.review_decision_id, decision_fingerprint: expected.review_decision_fingerprint,
          gate_record_id: expected.gate_id, gate_record_fingerprint: expected.gate_fingerprint, clock: { now: () => "2026-07-11T09:19:00.000Z" } });
        assert.equal(replay.status, "exact_replay");
        assert(canonical(replay.transition_receipt) === canonical(transition.receipt), "Transition replay preserves the original receipt");
        const compiled = compileTaskContextPacketFromPersistedSemanticStateV01(db, { workspace_id: scope.workspace_id, project_id: scope.project_id,
          prior_packet: prior.payload as TaskContextPacketV01, transition_receipt_id: expected.transition_receipt_id,
          transition_receipt_fingerprint: expected.transition_receipt_fingerprint, expiry_policy: { mode: "explicit", expires_at: packet.expires_at },
          clock: { now: () => packet.generated_at } });
        assert.equal(compiled.status, "exact_replay");
        assert(canonical(compiled.later_packet) === canonical(packet), "Packet replay preserves the original packet");
        assert(canonical(snapshot(db)) === canonical(original), "Historical reads and exact replay preserve original rows, IDs, fingerprints and payload strings");
        db.pragma("wal_checkpoint(TRUNCATE)");
      } finally { db.close(); }
      if (phase === "reopen") { copyFileSync(reopenPath, backupPath); copyFileSync(backupPath, restoredPath); }
    }
    assert.equal(digest(readFileSync(databasePath)), beforeFile, "Source-created historical checkpoint remains byte-identical");
    return { status: "pass", phases: ["reopen", "backup", "restore", "exact_transition_replay", "exact_packet_replay"],
      source_file_sha256: beforeFile, original_rows_sha256: digest(canonical(before)),
      original_tables: Object.fromEntries(Object.entries(before!).map(([table, rows]) => [table,
        { count: (rows as unknown[]).length, sha256: `sha256:${digest(canonical(rows))}` }])),
      row_counts: Object.fromEntries(Object.entries(before!).map(([table, rows]) => [table, (rows as unknown[]).length])) };
  } finally { rmSync(root, { recursive: true, force: true }); }
}
