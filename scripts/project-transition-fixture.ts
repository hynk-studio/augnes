import type Database from "better-sqlite3";
import { buildSemanticReviewLoopTaskContextPacketFixture, buildSemanticReviewLoopRunReceiptFixture, buildSemanticReviewLoopProposalFixture } from "../fixtures/vnext/protocol/semantic-review-loop-v0-1";
import { insertVNextCoreRecordV01 } from "../lib/vnext/persistence/durable-semantic-store";
import { admitStructuredRunReceiptV01 } from "../lib/vnext/persistence/structured-run-receipt-admission";
import { createEpisodeDeltaCandidateFingerprintV01 } from "../lib/vnext/review-decision";
import type { VNextLocalOperatorPilotConfigV01 } from "../lib/vnext/runtime/local-operator-session";

// Reuse the semantic-loop material, persistence and admission owners. Authentication,
// review, preview, confirmation and application stay on their production routes.
export function seedProjectTransition(db: Database.Database, config: VNextLocalOperatorPilotConfigV01) {
  const context = { fixture_id: config.project_id, workspace_id: config.workspace_id,
    project_id: config.project_id, run_id: `run:preview-${config.project_id}` };
  const packet = buildSemanticReviewLoopTaskContextPacketFixture(context, { data_classification: "public_safe" });
  const receipt = buildSemanticReviewLoopRunReceiptFixture(context, packet);
  const proposal = buildSemanticReviewLoopProposalFixture(context, packet, receipt, { primary_delta_type: "agent_plan_delta" });
  insertVNextCoreRecordV01(db, { record_kind: "task_context_packet", record_id: packet.packet_id,
    ...config, fingerprint: packet.integrity.fingerprint, payload: packet, created_at: packet.generated_at, idempotency_key: null });
  admitStructuredRunReceiptV01(db, receipt);
  insertVNextCoreRecordV01(db, { record_kind: "episode_delta_proposal", record_id: proposal.proposal_id,
    ...config, fingerprint: proposal.integrity.fingerprint, payload: proposal, created_at: proposal.created_at, idempotency_key: null });
  const candidate = proposal.proposed_deltas[0]!;
  return { config, packet, proposal, decisionRequest: { proposal_id: proposal.proposal_id,
    proposal_fingerprint: proposal.integrity.fingerprint, candidate_id: candidate.candidate_id,
    candidate_fingerprint: createEpisodeDeltaCandidateFingerprintV01(candidate), decision: "accept" as const,
    revisit: null, rationale_summary: "Explicitly review this project's bounded synthetic change." } };
}
