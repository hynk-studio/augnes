import type Database from "better-sqlite3";

import {
  assertVNextCoreRecordMatchesProtocolPayloadBindingV01,
  assertVNextDurableSemanticStoreSchemaV01,
  insertVNextCoreRecordV01,
  readVNextCoreRecordV01,
  readVNextCoreRecordByIdempotencyKeyV01,
  type VNextCoreRecordEnvelopeV01,
} from "@/lib/vnext/persistence/durable-semantic-store";
import { canonicalizeProtocolValueV01 } from "@/lib/vnext/protocol-primitives";
import { validateEpisodeDeltaProposalV01 } from "@/lib/vnext/episode-delta-proposal";
import {
  materializeRunAssessmentProposalV01,
  type RunAssessmentProposalAdmissionIdentityV01,
  type RunAssessmentProposalMaterializationV01,
} from "@/lib/vnext/run-assessment-proposal";
import type { CriterionAssessmentV01 } from "@/types/vnext/criterion-assessment";
import {
  RUN_ASSESSMENT_PROPOSAL_PROFILE_VERSION_V01,
  type EpisodeDeltaProposalV01,
} from "@/types/vnext/episode-delta-proposal";
import type { RunReceiptV01 } from "@/types/vnext/run-receipt";
import type { TaskContextPacketV01 } from "@/types/vnext/task-context-packet";
import {
  materializeStrategicAdvantageTransferProposalV01,
  type StrategicAdvantageTransferAdmissionIdentityV01,
  type StrategicAdvantageTransferMaterializationSourceV01,
  type StrategicAdvantageTransferMaterializationV01,
} from "@/lib/vnext/strategic-advantage-transfer";

export const EPISODE_DELTA_PROPOSAL_ADMISSION_VERSION_V01 =
  "episode_delta_proposal_admission.v0.1" as const;

export class EpisodeDeltaProposalAdmissionErrorV01 extends Error {
  constructor(readonly code: string) {
    super(code);
    this.name = "EpisodeDeltaProposalAdmissionErrorV01";
  }
}

interface RunAssessmentEpisodeDeltaProposalAdmissionInputV01 {
  expected: RunAssessmentProposalMaterializationV01;
  source: {
    packet: TaskContextPacketV01;
    receipt: RunReceiptV01;
    assessment: CriterionAssessmentV01;
  };
}

interface StrategicAdvantageTransferEpisodeDeltaProposalAdmissionInputV01 {
  expected: StrategicAdvantageTransferMaterializationV01;
  source: StrategicAdvantageTransferMaterializationSourceV01;
}

export function admitEpisodeDeltaProposalV01(
  db: Database.Database,
  input: RunAssessmentEpisodeDeltaProposalAdmissionInputV01,
): {
  status: "inserted" | "exact_replay";
  proposal: EpisodeDeltaProposalV01;
};
export function admitEpisodeDeltaProposalV01(
  db: Database.Database,
  input: StrategicAdvantageTransferEpisodeDeltaProposalAdmissionInputV01,
): {
  status: "inserted" | "exact_replay";
  proposal: EpisodeDeltaProposalV01;
};
/**
 * Canonical EpisodeDeltaProposal writer and replay authority. Each production
 * profile supplies exact source material, which is rematerialized here before
 * the shared envelope writer can persist it.
 */
export function admitEpisodeDeltaProposalV01(
  db: Database.Database,
  input:
    | RunAssessmentEpisodeDeltaProposalAdmissionInputV01
    | StrategicAdvantageTransferEpisodeDeltaProposalAdmissionInputV01,
): {
  status: "inserted" | "exact_replay";
  proposal: EpisodeDeltaProposalV01;
} {
  const ownsTransaction = !db.inTransaction;
  if (ownsTransaction) db.exec("BEGIN IMMEDIATE");
  try {
    assertVNextDurableSemanticStoreSchemaV01(db);
    const { proposal, idempotency_key, related } =
      resolveExpectedEpisodeDeltaProposalAdmissionV01(db, input);
    if (related) {
      if (
        related.record.idempotency_key !== idempotency_key ||
        canonicalizeProtocolValueV01(related.proposal) !==
          canonicalizeProtocolValueV01(proposal)
      ) {
        refuseV01("project_result_proposal_material_conflict");
      }
      if (ownsTransaction) db.exec("COMMIT");
      return { status: "exact_replay", proposal: related.proposal };
    }
    const write = writeExpectedEpisodeDeltaProposalV01(db, {
      proposal,
      idempotency_key,
    });
    if (ownsTransaction) db.exec("COMMIT");
    return {
      status: write.status,
      proposal: write.proposal,
    };
  } catch (error) {
    if (ownsTransaction && db.inTransaction) db.exec("ROLLBACK");
    if (
      error instanceof EpisodeDeltaProposalAdmissionErrorV01
    ) {
      throw error;
    }
    if (error instanceof Error && error.message === "vnext_core_record_conflict") {
      throw new EpisodeDeltaProposalAdmissionErrorV01(
        "episode_delta_proposal_conflicting_replay",
      );
    }
    throw error;
  }
}

function resolveExpectedEpisodeDeltaProposalAdmissionV01(
  db: Database.Database,
  input:
    | RunAssessmentEpisodeDeltaProposalAdmissionInputV01
    | StrategicAdvantageTransferEpisodeDeltaProposalAdmissionInputV01,
): {
  proposal: EpisodeDeltaProposalV01;
  idempotency_key: string;
  related: {
    record: VNextCoreRecordEnvelopeV01;
    proposal: EpisodeDeltaProposalV01;
  } | null;
} {
  if (isStrategicAdmissionInputV01(input)) {
    const material = materializeStrategicAdvantageTransferProposalV01(
      input.source,
    );
    if (
      canonicalizeProtocolValueV01(material) !==
      canonicalizeProtocolValueV01(input.expected)
    ) {
      refuseV01("project_result_proposal_material_conflict");
    }
    assertStrategicAdvantageTransferProposalRelationV01(
      material.proposal,
      material.identity,
    );
    return {
      proposal: material.proposal,
      idempotency_key: material.identity.idempotency_key,
      related: readStrategicAdvantageTransferProposalByIdentityV01(
        db,
        material.identity,
      ),
    };
  }
  const material = materializeRunAssessmentProposalV01(input.source);
  if (
    canonicalizeProtocolValueV01(material) !==
    canonicalizeProtocolValueV01(input.expected)
  ) {
    refuseV01("project_result_proposal_material_conflict");
  }
  assertRunAssessmentProposalRelationV01(
    material.proposal,
    material.identity,
  );
  return {
    proposal: material.proposal,
    idempotency_key: material.identity.idempotency_key,
    related: readProposalForExactSourcePurposeV01(db, material.identity),
  };
}

function isStrategicAdmissionInputV01(
  input:
    | RunAssessmentEpisodeDeltaProposalAdmissionInputV01
    | StrategicAdvantageTransferEpisodeDeltaProposalAdmissionInputV01,
): input is StrategicAdvantageTransferEpisodeDeltaProposalAdmissionInputV01 {
  return "base_strategy" in input.source;
}

export function readStrategicAdvantageTransferProposalByIdentityV01(
  db: Database.Database,
  identity: StrategicAdvantageTransferAdmissionIdentityV01,
): { record: VNextCoreRecordEnvelopeV01; proposal: EpisodeDeltaProposalV01 } | null {
  assertVNextDurableSemanticStoreSchemaV01(db);
  const record = readVNextCoreRecordByIdempotencyKeyV01(db, {
    record_kind: "episode_delta_proposal",
    workspace_id: identity.workspace_id,
    project_id: identity.project_id,
    idempotency_key: identity.idempotency_key,
  });
  if (!record) return null;
  if (validateEpisodeDeltaProposalV01(record.payload).status !== "valid") {
    refuseV01("strategic_advantage_transfer_record_invalid");
  }
  const proposal = record.payload as EpisodeDeltaProposalV01;
  assertVNextCoreRecordMatchesProtocolPayloadBindingV01(record, {
    workspace_id: proposal.workspace_id,
    project_id: proposal.project_id,
    fingerprint: proposal.integrity.fingerprint,
  });
  const profile = proposal.strategic_advantage_transfer;
  if (
    record.record_id !== proposal.proposal_id ||
    record.fingerprint !== proposal.integrity.fingerprint ||
    record.created_at !== proposal.created_at ||
    record.idempotency_key !== identity.idempotency_key ||
    !profile ||
    profile.analysis_identity !== identity.analysis_identity ||
    profile.source_proposal.proposal_id !== identity.source_proposal_id ||
    profile.source_proposal.proposal_fingerprint !==
      identity.source_proposal_fingerprint ||
    profile.packet_ref.external_id !== identity.packet_id ||
    profile.packet_ref.source_ref !== identity.packet_fingerprint ||
    profile.receipt_ref.external_id !== identity.receipt_id ||
    profile.receipt_ref.source_ref !== identity.receipt_fingerprint ||
    profile.assessment.assessment_fingerprint !==
      identity.assessment_fingerprint ||
    profile.base_strategy.base_fingerprint !== identity.base_fingerprint ||
    profile.working_frame.working_frame_fingerprint !==
      identity.working_frame_fingerprint ||
    profile.source_catalog.source_catalog_fingerprint !==
      identity.source_catalog_fingerprint
  ) {
    refuseV01("strategic_advantage_transfer_source_binding_conflict");
  }
  return { record, proposal };
}

function assertStrategicAdvantageTransferProposalRelationV01(
  proposal: EpisodeDeltaProposalV01,
  identity: StrategicAdvantageTransferAdmissionIdentityV01,
): void {
  const validation = validateEpisodeDeltaProposalV01(proposal);
  const profile = proposal.strategic_advantage_transfer;
  if (
    validation.status !== "valid" ||
    !profile ||
    proposal.workspace_id !== identity.workspace_id ||
    proposal.project_id !== identity.project_id ||
    proposal.status !== "pending_review" ||
    proposal.operation_revision !== undefined ||
    profile.analysis_identity !== identity.analysis_identity ||
    profile.source_proposal.proposal_id !== identity.source_proposal_id ||
    profile.source_proposal.proposal_fingerprint !==
      identity.source_proposal_fingerprint ||
    profile.packet_ref.external_id !== identity.packet_id ||
    profile.packet_ref.source_ref !== identity.packet_fingerprint ||
    profile.receipt_ref.external_id !== identity.receipt_id ||
    profile.receipt_ref.source_ref !== identity.receipt_fingerprint ||
    profile.assessment.assessment_fingerprint !==
      identity.assessment_fingerprint ||
    profile.base_strategy.base_fingerprint !== identity.base_fingerprint ||
    profile.working_frame.working_frame_fingerprint !==
      identity.working_frame_fingerprint ||
    profile.source_catalog.source_catalog_fingerprint !==
      identity.source_catalog_fingerprint
  ) {
    refuseV01("strategic_advantage_transfer_source_binding_conflict");
  }
}

function writeExpectedEpisodeDeltaProposalV01(
  db: Database.Database,
  input: { proposal: EpisodeDeltaProposalV01; idempotency_key: string },
) {
  const write = insertVNextCoreRecordV01(db, {
    record_kind: "episode_delta_proposal",
    record_id: input.proposal.proposal_id,
    workspace_id: input.proposal.workspace_id,
    project_id: input.proposal.project_id,
    fingerprint: input.proposal.integrity.fingerprint,
    idempotency_key: input.idempotency_key,
    payload: input.proposal,
    created_at: input.proposal.created_at,
  });
  assertVNextCoreRecordMatchesProtocolPayloadBindingV01(write.record, {
    workspace_id: input.proposal.workspace_id,
    project_id: input.proposal.project_id,
    fingerprint: input.proposal.integrity.fingerprint,
  });
  if (
    write.record.record_id !== input.proposal.proposal_id ||
    write.record.idempotency_key !== input.idempotency_key ||
    write.record.created_at !== input.proposal.created_at ||
    canonicalizeProtocolValueV01(write.record.payload) !==
      canonicalizeProtocolValueV01(input.proposal)
  ) {
    refuseV01("episode_delta_proposal_envelope_mismatch");
  }
  return { ...write, proposal: input.proposal };
}

export function readProposalForExactSourcePurposeV01(
  db: Database.Database,
  identity: RunAssessmentProposalAdmissionIdentityV01,
): {
  record: VNextCoreRecordEnvelopeV01;
  proposal: EpisodeDeltaProposalV01;
} | null {
  assertVNextDurableSemanticStoreSchemaV01(db);
  const rows = db
    .prepare(
      `SELECT record_id, workspace_id, project_id
       FROM vnext_core_records
       WHERE record_kind = 'episode_delta_proposal'
         AND json_type(payload_json, '$.operation_revision') IS NULL
         AND json_extract(payload_json, '$.source_assessment.admission_profile') = ?
         AND json_extract(payload_json, '$.source_assessment.packet_ref.external_id') = ?
         AND json_extract(payload_json, '$.source_assessment.receipt_ref.external_id') = ?
         AND json_extract(payload_json, '$.source_assessment.run_ref.external_id') = ?
       ORDER BY record_id
       LIMIT 2`,
    )
    .all(
      RUN_ASSESSMENT_PROPOSAL_PROFILE_VERSION_V01,
      identity.packet_id,
      identity.receipt_id,
      identity.run_id,
    ) as Array<{
    record_id: string;
    workspace_id: string;
    project_id: string;
  }>;
  if (rows.length > 1) {
    refuseV01("episode_delta_proposal_source_relation_conflict");
  }
  const row = rows[0];
  if (!row) return null;
  if (
    row.workspace_id !== identity.workspace_id ||
    row.project_id !== identity.project_id
  ) {
    refuseV01("episode_delta_proposal_source_scope_conflict");
  }
  const record = readVNextCoreRecordV01(db, {
    record_kind: "episode_delta_proposal",
    record_id: row.record_id,
    workspace_id: row.workspace_id,
    project_id: row.project_id,
  });
  if (!record) refuseV01("episode_delta_proposal_record_missing");
  if (validateEpisodeDeltaProposalV01(record.payload).status !== "valid") {
    refuseV01("episode_delta_proposal_record_invalid");
  }
  const proposal = record.payload as EpisodeDeltaProposalV01;
  assertVNextCoreRecordMatchesProtocolPayloadBindingV01(record, {
    workspace_id: proposal.workspace_id,
    project_id: proposal.project_id,
    fingerprint: proposal.integrity.fingerprint,
  });
  if (
    record.record_id !== proposal.proposal_id ||
    record.fingerprint !== proposal.integrity.fingerprint ||
    record.created_at !== proposal.created_at
  ) {
    refuseV01("episode_delta_proposal_envelope_mismatch");
  }
  assertRunAssessmentProposalRelationV01(proposal, identity);
  return { record, proposal };
}

export function assertRunAssessmentProposalRelationV01(
  proposal: EpisodeDeltaProposalV01,
  identity: RunAssessmentProposalAdmissionIdentityV01,
): void {
  const validation = validateEpisodeDeltaProposalV01(proposal);
  if (validation.status !== "valid") {
    refuseV01("episode_delta_proposal_invalid");
  }
  const source = proposal.source_assessment;
  if (
    !source ||
    proposal.workspace_id !== identity.workspace_id ||
    proposal.project_id !== identity.project_id ||
    proposal.status !== "pending_review" ||
    source.admission_profile !== identity.admission_profile ||
    source.admission_idempotency_key !== identity.idempotency_key ||
    canonicalizeProtocolValueV01(source.work_ref) !==
      canonicalizeProtocolValueV01(identity.work_ref) ||
    source.packet_ref.external_id !== identity.packet_id ||
    source.packet_ref.source_ref !== identity.packet_fingerprint ||
    source.receipt_ref.external_id !== identity.receipt_id ||
    source.receipt_ref.source_ref !== identity.receipt_fingerprint ||
    source.run_ref.external_id !== identity.run_id ||
    source.assessment.assessment_version !== identity.assessment_version ||
    source.assessment.assessment_fingerprint !== identity.assessment_fingerprint ||
    proposal.task_context_packet_ref?.external_id !== identity.packet_id ||
    proposal.task_context_packet_ref.source_ref !== identity.packet_fingerprint ||
    proposal.run_receipt_refs.length !== 1 ||
    proposal.run_receipt_refs[0]?.external_id !== identity.receipt_id ||
    proposal.run_receipt_refs[0]?.source_ref !== identity.receipt_fingerprint
  ) {
    refuseV01("episode_delta_proposal_source_binding_conflict");
  }
}

function refuseV01(code: string): never {
  throw new EpisodeDeltaProposalAdmissionErrorV01(code);
}
