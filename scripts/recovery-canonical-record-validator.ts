import type Database from "better-sqlite3";

import { validateBoundedAutomationCapabilityGrantV01 } from "../lib/vnext/bounded-automation-cycle";
import {
  validateContextUseReviewRelationsV01,
  validateContextUseReviewV01,
} from "../lib/vnext/context-use-review";
import { validateEpisodeDeltaProposalV01 } from "../lib/vnext/episode-delta-proposal";
import {
  validateClaimEvidenceRelationV01,
  validateClaimRecordV01,
  validateEvidenceRecordV01,
} from "../lib/vnext/project-verify-material";
import {
  canonicalizeProtocolValueV01,
  createProtocolSha256V01,
} from "../lib/vnext/protocol-primitives";
import {
  validateReviewDecisionAgainstEpisodeDeltaProposalV01,
  validateReviewDecisionV01,
} from "../lib/vnext/review-decision";
import { validateRunReceiptV01 } from "../lib/vnext/run-receipt";
import {
  createStateTransitionReceiptLineageRefV01,
  validateSemanticTransitionFullChainV01,
} from "../lib/vnext/state-transition-eligibility";
import { validateStateTransitionReceiptV01 } from "../lib/vnext/state-transition-receipt";
import { validateTaskContextPacketV01 } from "../lib/vnext/task-context-packet";
import {
  listCurrentVNextAutomationWorkSnapshotsV01,
  readBoundedAutomationCapabilityGrantV01,
  validateVNextAutomationWorkSnapshotV01,
} from "../lib/vnext/persistence/bounded-automation-authority";
import {
  assertVNextCoreRecordMatchesProtocolPayloadBindingV01,
  readVNextCoreRecordV01,
  validateVNextPersistedSemanticStateV01,
} from "../lib/vnext/persistence/durable-semantic-store";
import { readProjectHomeDatabaseCompatibilityV01 } from "../lib/vnext/project-home/project-home-projection";
import { assertPersistedRunAssessmentProposalSourceBoundV01 } from "../lib/vnext/persistence/episode-delta-proposal-admission";
import {
  readClaimEvidenceRelationV01,
  readClaimRecordV01,
  readEvidenceRecordV01,
} from "../lib/vnext/persistence/project-verify-material-store";
import { assertPersistedProjectVerifyLifecycleProposalSourceBoundV01 } from "../lib/vnext/persistence/project-verify-lifecycle-admission";
import {
  loadValidatedVNextSemanticCommitGateRelationV01,
  loadValidatedVNextSemanticTransitionRelationV01,
} from "../lib/vnext/runtime/durable-semantic-transition";
import type { VNextLocalOperatorPilotConfigV01 } from "../lib/vnext/runtime/local-operator-session";
import { createVNextOperatorPilotContextUseReviewLogicalIdentityV01 } from "../lib/vnext/runtime/operator-pilot-context-use-contract";
import { readVNextOperatorPilotProposalDurableLineageV01 } from "../lib/vnext/runtime/operator-pilot-workbench-lineage";
import { VNEXT_PERSISTED_SEMANTIC_CONTEXT_COMPILER_VERSION_V01 } from "../lib/vnext/runtime/persisted-semantic-context-compiler";
import { readSharedProjectInspectorV01 } from "../lib/vnext/runtime/shared-project-inspector";
import type { ContextUseReviewV01 } from "../types/vnext/context-use-review";
import type { EpisodeDeltaProposalV01 } from "../types/vnext/episode-delta-proposal";
import type { ReviewDecisionV01 } from "../types/vnext/review-decision";
import type { RunReceiptV01 } from "../types/vnext/run-receipt";
import type { StateTransitionReceiptV01 } from "../types/vnext/state-transition-receipt";
import type { TaskContextPacketV01 } from "../types/vnext/task-context-packet";

export const RECOVERY_CANONICAL_RECORD_VALIDATOR_CONTRACT_V01 =
  "augnes.recovery-canonical-record-validator.v1" as const;
export const RECOVERY_CANONICAL_RECORD_VALIDATOR_CONTRACT_VERSION_V01 =
  1 as const;

const OPERATOR_DECISION_REQUEST_VERSION_V01 =
  "vnext_operator_pilot_decision_request.v0.1";

const RECORD_KINDS_V01 = [
  "automation_work_item",
  "capability_grant",
  "evidence_record",
  "claim_record",
  "claim_evidence_relation",
  "episode_delta_proposal",
  "review_decision",
  "semantic_commit_gate",
  "semantic_state",
  "state_transition_receipt",
  "task_context_packet",
  "run_receipt",
  "context_use_review",
] as const;

type CanonicalRecordKindV01 = (typeof RECORD_KINDS_V01)[number];

export type RecoveryCanonicalRecordValidationCodeV01 =
  | "canonical_records_valid"
  | "database_canonical_invariant_failed"
  | "database_cross_project_reference"
  | "database_reader_incompatible";

export type RecoveryCanonicalRecordValidationResultV01 =
  | {
      contract: typeof RECOVERY_CANONICAL_RECORD_VALIDATOR_CONTRACT_V01;
      contract_version: typeof RECOVERY_CANONICAL_RECORD_VALIDATOR_CONTRACT_VERSION_V01;
      status: "valid";
      code: "canonical_records_valid";
      record_count: number;
    }
  | {
      contract: typeof RECOVERY_CANONICAL_RECORD_VALIDATOR_CONTRACT_V01;
      contract_version: typeof RECOVERY_CANONICAL_RECORD_VALIDATOR_CONTRACT_VERSION_V01;
      status: "invalid";
      code: Exclude<
        RecoveryCanonicalRecordValidationCodeV01,
        "canonical_records_valid"
      >;
      record_count: 0;
    };

interface CanonicalRecordRowV01 {
  record_kind: string;
  record_id: string;
  workspace_id: string;
  project_id: string;
  fingerprint: string;
  idempotency_key: string | null;
  payload_json: string;
  created_at: string;
}

interface ParsedCanonicalRecordV01 extends Omit<
  CanonicalRecordRowV01,
  "record_kind" | "payload_json"
> {
  record_kind: CanonicalRecordKindV01;
  payload: Record<string, unknown>;
}

class CanonicalRecordRefusalV01 extends Error {
  readonly code: Exclude<
    RecoveryCanonicalRecordValidationCodeV01,
    "canonical_records_valid"
  >;

  constructor(
    code: Exclude<
      RecoveryCanonicalRecordValidationCodeV01,
      "canonical_records_valid"
    > = "database_canonical_invariant_failed",
  ) {
    super(code);
    this.name = "CanonicalRecordRefusalV01";
    this.code = code;
  }
}

function refuseV01(
  code: Exclude<
    RecoveryCanonicalRecordValidationCodeV01,
    "canonical_records_valid"
  > = "database_canonical_invariant_failed",
): never {
  throw new CanonicalRecordRefusalV01(code);
}

function validResultV01(
  recordCount: number,
): RecoveryCanonicalRecordValidationResultV01 {
  return {
    contract: RECOVERY_CANONICAL_RECORD_VALIDATOR_CONTRACT_V01,
    contract_version: RECOVERY_CANONICAL_RECORD_VALIDATOR_CONTRACT_VERSION_V01,
    status: "valid",
    code: "canonical_records_valid",
    record_count: recordCount,
  };
}

function invalidResultV01(
  code: Exclude<
    RecoveryCanonicalRecordValidationCodeV01,
    "canonical_records_valid"
  >,
): RecoveryCanonicalRecordValidationResultV01 {
  return {
    contract: RECOVERY_CANONICAL_RECORD_VALIDATOR_CONTRACT_V01,
    contract_version: RECOVERY_CANONICAL_RECORD_VALIDATOR_CONTRACT_VERSION_V01,
    status: "invalid",
    code,
    record_count: 0,
  };
}

function isRecordV01(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function requiredStringV01(
  value: unknown,
  code: Exclude<
    RecoveryCanonicalRecordValidationCodeV01,
    "canonical_records_valid"
  > = "database_canonical_invariant_failed",
): string {
  if (typeof value !== "string" || value.length === 0) refuseV01(code);
  return value;
}

function nullableStringV01(value: unknown): string | null {
  if (value === null) return null;
  return requiredStringV01(value);
}

function parsePayloadV01(value: string): Record<string, unknown> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(value);
  } catch {
    refuseV01();
  }
  if (!isRecordV01(parsed)) refuseV01();
  return parsed;
}

function recordKeyV01(kind: string, id: string): string {
  return `${kind}\u0000${id}`;
}

function exactFingerprintV01(payload: Record<string, unknown>): string {
  const integrity = payload.integrity;
  if (!isRecordV01(integrity)) refuseV01();
  return requiredStringV01(integrity.fingerprint);
}

function exactEnvelopeV01(
  record: ParsedCanonicalRecordV01,
  expected: {
    record_id: unknown;
    workspace_id: unknown;
    project_id: unknown;
    fingerprint: unknown;
    idempotency_key: string | null;
    created_at: unknown;
  },
): void {
  if (
    record.record_id !== requiredStringV01(expected.record_id) ||
    record.workspace_id !== requiredStringV01(expected.workspace_id) ||
    record.project_id !== requiredStringV01(expected.project_id) ||
    record.fingerprint !== requiredStringV01(expected.fingerprint) ||
    record.idempotency_key !== expected.idempotency_key ||
    record.created_at !== requiredStringV01(expected.created_at)
  ) {
    refuseV01();
  }
}

function sha256V01(value: unknown): string {
  return createProtocolSha256V01(canonicalizeProtocolValueV01(value));
}

function automationSnapshotIdempotencyV01(
  payload: Record<string, unknown>,
): string {
  const source = payload.source;
  if (!isRecordV01(source)) refuseV01();
  return sha256V01({
    purpose: requiredStringV01(payload.snapshot_version),
    work_id: requiredStringV01(source.work_id),
    revision: payload.revision,
  });
}

function capabilityGrantIdempotencyV01(
  payload: Record<string, unknown>,
): string {
  return sha256V01({
    purpose: requiredStringV01(payload.grant_version),
    workspace_id: requiredStringV01(payload.workspace_id),
    project_id: requiredStringV01(payload.project_id),
    work_source_ref: payload.work_source_ref,
    policy_ref: payload.policy_ref,
    control_revision: payload.control_revision,
    packet_intent_fingerprint: payload.packet_intent_fingerprint,
  });
}

function proposalIdempotencyV01(
  payload: Record<string, unknown>,
): string | null {
  const revision = payload.operation_revision;
  if (isRecordV01(revision)) {
    return requiredStringV01(revision.admission_idempotency_key);
  }
  const assessment = payload.source_assessment;
  if (isRecordV01(assessment)) {
    return requiredStringV01(assessment.admission_idempotency_key);
  }
  const strategic = payload.strategic_advantage_transfer;
  if (isRecordV01(strategic)) {
    return sha256V01({
      purpose: requiredStringV01(strategic.profile_version),
      analysis_identity: requiredStringV01(strategic.analysis_identity),
    });
  }
  const lifecycle = payload.project_verify_lifecycle;
  if (isRecordV01(lifecycle)) {
    return requiredStringV01(lifecycle.admission_idempotency_key);
  }
  return null;
}

function decisionIdempotencyV01(
  payload: Record<string, unknown>,
  persistedIdempotencyKey: string | null,
): string | null {
  const bases = payload.authorization_basis_refs;
  const sessionBasis = Array.isArray(bases)
    ? bases.find(
        (value) =>
          isRecordV01(value) &&
          value.ref_type === "local_operator_session_action",
      )
    : undefined;
  if (!sessionBasis) {
    if (persistedIdempotencyKey !== null) refuseV01();
    return null;
  }
  const actor = payload.actor_ref;
  const sourceProposal = payload.source_proposal;
  const candidate = payload.candidate;
  if (
    !isRecordV01(sessionBasis) ||
    !isRecordV01(actor) ||
    !isRecordV01(sourceProposal) ||
    !isRecordV01(candidate)
  ) {
    refuseV01();
  }
  const decision = requiredStringV01(payload.decision);
  const revisit = payload.revisit;
  let requestRevisit: { condition_summary: string } | null = null;
  if (decision === "defer") {
    if (!isRecordV01(revisit)) refuseV01();
    requestRevisit = {
      condition_summary: requiredStringV01(revisit.condition_summary),
    };
  }
  return sha256V01({
    request_version: OPERATOR_DECISION_REQUEST_VERSION_V01,
    workspace_id: requiredStringV01(payload.workspace_id),
    project_id: requiredStringV01(payload.project_id),
    operator_id: requiredStringV01(actor.external_id),
    session_id: requiredStringV01(sessionBasis.external_id),
    proposal_id: requiredStringV01(sourceProposal.proposal_id),
    proposal_fingerprint: requiredStringV01(
      sourceProposal.proposal_fingerprint,
    ),
    candidate_id: requiredStringV01(candidate.candidate_id),
    candidate_fingerprint: requiredStringV01(candidate.candidate_fingerprint),
    decision,
    rationale_summary: requiredStringV01(payload.rationale_summary),
    revisit: requestRevisit,
  });
}

function contextUseReviewIdempotencyV01(
  payload: Record<string, unknown>,
): string {
  const logicalIdentity =
    createVNextOperatorPilotContextUseReviewLogicalIdentityV01(
      payload as unknown as ContextUseReviewV01,
    );
  return sha256V01({ logical_identity: logicalIdentity });
}

function requireRelatedRecordV01(
  byIdentity: Map<string, ParsedCanonicalRecordV01>,
  input: {
    kind: CanonicalRecordKindV01;
    id: unknown;
    fingerprint: unknown;
    workspace_id: string;
    project_id: string;
  },
): ParsedCanonicalRecordV01 {
  const id = requiredStringV01(input.id);
  const record = byIdentity.get(recordKeyV01(input.kind, id));
  if (!record) refuseV01();
  if (
    record.workspace_id !== input.workspace_id ||
    record.project_id !== input.project_id
  ) {
    refuseV01("database_cross_project_reference");
  }
  if (record.fingerprint !== requiredStringV01(input.fingerprint)) {
    refuseV01();
  }
  return record;
}

function validatePayloadAndEnvelopeV01(record: ParsedCanonicalRecordV01): void {
  const payload = record.payload;
  switch (record.record_kind) {
    case "automation_work_item": {
      if (!validateVNextAutomationWorkSnapshotV01(payload)) refuseV01();
      const source = payload.source;
      if (!isRecordV01(source)) refuseV01();
      exactEnvelopeV01(record, {
        record_id: payload.snapshot_id,
        workspace_id: source.workspace_id,
        project_id: source.project_id,
        fingerprint: exactFingerprintV01(payload),
        idempotency_key: automationSnapshotIdempotencyV01(payload),
        created_at: payload.observed_at,
      });
      return;
    }
    case "capability_grant": {
      if (!validateBoundedAutomationCapabilityGrantV01(payload)) refuseV01();
      exactEnvelopeV01(record, {
        record_id: payload.grant_id,
        workspace_id: payload.workspace_id,
        project_id: payload.project_id,
        fingerprint: payload.grant_fingerprint,
        idempotency_key: capabilityGrantIdempotencyV01(payload),
        created_at: payload.issued_at,
      });
      return;
    }
    case "evidence_record": {
      if (validateEvidenceRecordV01(payload).status !== "valid") refuseV01();
      exactEnvelopeV01(record, {
        record_id: payload.evidence_id,
        workspace_id: payload.workspace_id,
        project_id: payload.project_id,
        fingerprint: exactFingerprintV01(payload),
        idempotency_key: requiredStringV01(payload.idempotency_key),
        created_at: payload.recorded_at,
      });
      return;
    }
    case "claim_record": {
      if (validateClaimRecordV01(payload).status !== "valid") refuseV01();
      exactEnvelopeV01(record, {
        record_id: payload.claim_id,
        workspace_id: payload.workspace_id,
        project_id: payload.project_id,
        fingerprint: exactFingerprintV01(payload),
        idempotency_key: requiredStringV01(payload.idempotency_key),
        created_at: payload.created_at,
      });
      return;
    }
    case "claim_evidence_relation": {
      if (validateClaimEvidenceRelationV01(payload).status !== "valid") {
        refuseV01();
      }
      exactEnvelopeV01(record, {
        record_id: payload.relation_id,
        workspace_id: payload.workspace_id,
        project_id: payload.project_id,
        fingerprint: exactFingerprintV01(payload),
        idempotency_key: requiredStringV01(payload.idempotency_key),
        created_at: payload.created_at,
      });
      return;
    }
    case "episode_delta_proposal": {
      if (validateEpisodeDeltaProposalV01(payload).status !== "valid") {
        refuseV01();
      }
      exactEnvelopeV01(record, {
        record_id: payload.proposal_id,
        workspace_id: payload.workspace_id,
        project_id: payload.project_id,
        fingerprint: exactFingerprintV01(payload),
        idempotency_key: proposalIdempotencyV01(payload),
        created_at: payload.created_at,
      });
      return;
    }
    case "review_decision": {
      if (validateReviewDecisionV01(payload).status !== "valid") refuseV01();
      exactEnvelopeV01(record, {
        record_id: payload.decision_id,
        workspace_id: payload.workspace_id,
        project_id: payload.project_id,
        fingerprint: exactFingerprintV01(payload),
        idempotency_key: decisionIdempotencyV01(
          payload,
          record.idempotency_key,
        ),
        created_at: payload.decided_at,
      });
      return;
    }
    case "semantic_commit_gate": {
      exactEnvelopeV01(record, {
        record_id: payload.gate_record_id,
        workspace_id: payload.workspace_id,
        project_id: payload.project_id,
        fingerprint: exactFingerprintV01(payload),
        idempotency_key: requiredStringV01(payload.confirmation_digest),
        created_at: payload.confirmed_at,
      });
      return;
    }
    case "semantic_state": {
      if (validateVNextPersistedSemanticStateV01(payload).status !== "valid") {
        refuseV01();
      }
      exactEnvelopeV01(record, {
        record_id: payload.semantic_state_record_id,
        workspace_id: payload.workspace_id,
        project_id: payload.project_id,
        fingerprint: exactFingerprintV01(payload),
        idempotency_key: null,
        created_at: payload.created_at,
      });
      return;
    }
    case "state_transition_receipt": {
      if (validateStateTransitionReceiptV01(payload).status !== "valid") {
        refuseV01();
      }
      exactEnvelopeV01(record, {
        record_id: payload.transition_receipt_id,
        workspace_id: payload.workspace_id,
        project_id: payload.project_id,
        fingerprint: exactFingerprintV01(payload),
        idempotency_key: requiredStringV01(payload.idempotency_key),
        created_at: payload.recorded_at,
      });
      return;
    }
    case "task_context_packet": {
      if (
        validateTaskContextPacketV01(payload, {
          evaluated_at: requiredStringV01(payload.generated_at),
        }).status !== "valid"
      ) {
        refuseV01();
      }
      exactEnvelopeV01(record, {
        record_id: payload.packet_id,
        workspace_id: payload.workspace_id,
        project_id: payload.project_id,
        fingerprint: exactFingerprintV01(payload),
        idempotency_key: null,
        created_at: payload.generated_at,
      });
      return;
    }
    case "run_receipt": {
      if (validateRunReceiptV01(payload).status !== "valid") refuseV01();
      exactEnvelopeV01(record, {
        record_id: payload.receipt_id,
        workspace_id: payload.workspace_id,
        project_id: payload.project_id,
        fingerprint: exactFingerprintV01(payload),
        idempotency_key: requiredStringV01(payload.idempotency_key),
        created_at: payload.recorded_at,
      });
      return;
    }
    case "context_use_review": {
      if (validateContextUseReviewV01(payload).status !== "valid") {
        refuseV01();
      }
      exactEnvelopeV01(record, {
        record_id: payload.review_id,
        workspace_id: payload.workspace_id,
        project_id: payload.project_id,
        fingerprint: exactFingerprintV01(payload),
        idempotency_key: contextUseReviewIdempotencyV01(payload),
        created_at: payload.reviewed_at,
      });
      return;
    }
  }
}

function validateProposalRelationsV01(
  db: Database.Database,
  record: ParsedCanonicalRecordV01,
  byIdentity: Map<string, ParsedCanonicalRecordV01>,
): void {
  const proposal = record.payload as unknown as EpisodeDeltaProposalV01;
  if (
    proposal.source_assessment?.comparison
      .criterion_specific_relations_available === true
  ) {
    assertPersistedRunAssessmentProposalSourceBoundV01(db, proposal);
  }
  if (proposal.project_verify_lifecycle) {
    assertPersistedProjectVerifyLifecycleProposalSourceBoundV01(db, proposal);
  }
  if (proposal.operation_revision) {
    requireRelatedRecordV01(byIdentity, {
      kind: "episode_delta_proposal",
      id: proposal.operation_revision.source.proposal_id,
      fingerprint: proposal.operation_revision.source.proposal_fingerprint,
      workspace_id: record.workspace_id,
      project_id: record.project_id,
    });
  }
  if (proposal.strategic_advantage_transfer) {
    requireRelatedRecordV01(byIdentity, {
      kind: "episode_delta_proposal",
      id: proposal.strategic_advantage_transfer.source_proposal.proposal_id,
      fingerprint:
        proposal.strategic_advantage_transfer.source_proposal
          .proposal_fingerprint,
      workspace_id: record.workspace_id,
      project_id: record.project_id,
    });
    requireRelatedRecordV01(byIdentity, {
      kind: "task_context_packet",
      id: proposal.strategic_advantage_transfer.packet_ref.external_id,
      fingerprint: proposal.strategic_advantage_transfer.packet_ref.source_ref,
      workspace_id: record.workspace_id,
      project_id: record.project_id,
    });
    requireRelatedRecordV01(byIdentity, {
      kind: "run_receipt",
      id: proposal.strategic_advantage_transfer.receipt_ref.external_id,
      fingerprint: proposal.strategic_advantage_transfer.receipt_ref.source_ref,
      workspace_id: record.workspace_id,
      project_id: record.project_id,
    });
  }
}

function validateDecisionRelationV01(
  record: ParsedCanonicalRecordV01,
  byIdentity: Map<string, ParsedCanonicalRecordV01>,
): void {
  const decision = record.payload as unknown as ReviewDecisionV01;
  const proposalRecord = requireRelatedRecordV01(byIdentity, {
    kind: "episode_delta_proposal",
    id: decision.source_proposal.proposal_id,
    fingerprint: decision.source_proposal.proposal_fingerprint,
    workspace_id: record.workspace_id,
    project_id: record.project_id,
  });
  if (
    validateReviewDecisionAgainstEpisodeDeltaProposalV01(
      decision,
      proposalRecord.payload,
    ).status !== "valid"
  ) {
    refuseV01();
  }
}

function validateSemanticStateRelationsV01(
  record: ParsedCanonicalRecordV01,
  byIdentity: Map<string, ParsedCanonicalRecordV01>,
): void {
  const payload = record.payload;
  requireRelatedRecordV01(byIdentity, {
    kind: "episode_delta_proposal",
    id: payload.source_proposal_id,
    fingerprint: payload.source_proposal_fingerprint,
    workspace_id: record.workspace_id,
    project_id: record.project_id,
  });
  requireRelatedRecordV01(byIdentity, {
    kind: "review_decision",
    id: payload.source_decision_id,
    fingerprint: payload.source_decision_fingerprint,
    workspace_id: record.workspace_id,
    project_id: record.project_id,
  });
}

function relationBindingV01(
  value: unknown,
  idKey: string,
  fingerprintKey: string,
): { id: string; fingerprint: string } {
  if (!isRecordV01(value)) refuseV01();
  return {
    id: requiredStringV01(value[idKey]),
    fingerprint: requiredStringV01(value[fingerprintKey]),
  };
}

function validateContextUseReviewRelationV01(
  record: ParsedCanonicalRecordV01,
  byIdentity: Map<string, ParsedCanonicalRecordV01>,
): void {
  const review = record.payload as unknown as ContextUseReviewV01;
  const priorBinding = relationBindingV01(
    review.prior_packet,
    "packet_id",
    "packet_fingerprint",
  );
  const laterBinding = relationBindingV01(
    review.later_packet,
    "packet_id",
    "packet_fingerprint",
  );
  const transitionBinding = relationBindingV01(
    review.source_transition_receipt,
    "transition_receipt_id",
    "transition_receipt_fingerprint",
  );
  const runBinding = relationBindingV01(
    review.later_task_run_receipt,
    "receipt_id",
    "receipt_fingerprint",
  );
  const prior = requireRelatedRecordV01(byIdentity, {
    kind: "task_context_packet",
    ...priorBinding,
    workspace_id: record.workspace_id,
    project_id: record.project_id,
  });
  const later = requireRelatedRecordV01(byIdentity, {
    kind: "task_context_packet",
    ...laterBinding,
    workspace_id: record.workspace_id,
    project_id: record.project_id,
  });
  const transition = requireRelatedRecordV01(byIdentity, {
    kind: "state_transition_receipt",
    ...transitionBinding,
    workspace_id: record.workspace_id,
    project_id: record.project_id,
  });
  const run = requireRelatedRecordV01(byIdentity, {
    kind: "run_receipt",
    ...runBinding,
    workspace_id: record.workspace_id,
    project_id: record.project_id,
  });
  if (
    validateContextUseReviewRelationsV01(
      review,
      prior.payload as unknown as TaskContextPacketV01,
      later.payload as unknown as TaskContextPacketV01,
      transition.payload as unknown as StateTransitionReceiptV01,
      run.payload as unknown as RunReceiptV01,
    ).status !== "valid"
  ) {
    refuseV01();
  }
}

function validateCompiledTaskContextPacketRelationV01(
  db: Database.Database,
  record: ParsedCanonicalRecordV01,
  byIdentity: Map<string, ParsedCanonicalRecordV01>,
): void {
  const packet = record.payload as unknown as TaskContextPacketV01;
  if (
    !packet.compatibility.source_contracts.includes(
      VNEXT_PERSISTED_SEMANTIC_CONTEXT_COMPILER_VERSION_V01,
    )
  ) {
    return;
  }
  const priorRefs = packet.compatibility.source_refs.filter(
    (ref) =>
      ref.ref_type === "task_context_packet" &&
      ref.compatibility_namespace ===
        VNEXT_PERSISTED_SEMANTIC_CONTEXT_COMPILER_VERSION_V01,
  );
  const transitionRefs = packet.compatibility.source_refs.filter(
    (ref) =>
      ref.ref_type === "state_transition_receipt" &&
      ref.compatibility_namespace ===
        "augnes.vnext.state-transition-receipt.v0.1",
  );
  if (priorRefs.length === 0 || transitionRefs.length === 0) refuseV01();

  const priorPackets = priorRefs.map((priorRef) => {
    const priorRecord = requireRelatedRecordV01(byIdentity, {
      kind: "task_context_packet",
      id: priorRef.external_id,
      fingerprint: priorRef.source_ref,
      workspace_id: record.workspace_id,
      project_id: record.project_id,
    });
    const priorPacket = priorRecord.payload as unknown as TaskContextPacketV01;
    const expectedPriorRef = {
      ref_version: "external_ref.v0.1" as const,
      ref_type: "task_context_packet",
      external_id: priorPacket.packet_id,
      trust_class: "derived_interpretation" as const,
      observed_at: priorPacket.generated_at,
      source_ref: priorPacket.integrity.fingerprint,
      compatibility_namespace:
        VNEXT_PERSISTED_SEMANTIC_CONTEXT_COMPILER_VERSION_V01,
    };
    if (
      canonicalizeProtocolValueV01(priorRef) !==
      canonicalizeProtocolValueV01(expectedPriorRef)
    ) {
      refuseV01();
    }
    return priorPacket;
  });
  const transitions = transitionRefs.map((transitionRef) => {
    requireRelatedRecordV01(byIdentity, {
      kind: "state_transition_receipt",
      id: transitionRef.external_id,
      fingerprint: transitionRef.source_ref,
      workspace_id: record.workspace_id,
      project_id: record.project_id,
    });
    const transition = loadValidatedVNextSemanticTransitionRelationV01(db, {
      workspace_id: record.workspace_id,
      project_id: record.project_id,
      transition_receipt_id: transitionRef.external_id,
      transition_receipt_fingerprint: requiredStringV01(
        transitionRef.source_ref,
      ),
    });
    if (
      canonicalizeProtocolValueV01(transitionRef) !==
      canonicalizeProtocolValueV01(
        createStateTransitionReceiptLineageRefV01(transition.receipt),
      )
    ) {
      refuseV01();
    }
    return transition;
  });
  const validRelations = priorPackets.flatMap((priorPacket) =>
    transitions.flatMap((transition) => {
      const relation = validateSemanticTransitionFullChainV01({
        ...transition.eligibility_input,
        receipt: transition.receipt,
        prior_packet: priorPacket,
        later_packet: packet,
      });
      return relation.status === "valid" ? [relation] : [];
    }),
  );
  if (validRelations.length !== 1) refuseV01();
}

function validateRunReceiptRelationsV01(
  db: Database.Database,
  record: ParsedCanonicalRecordV01,
  byIdentity: Map<string, ParsedCanonicalRecordV01>,
): void {
  const receipt = record.payload as unknown as RunReceiptV01;
  const packetRef = receipt.task_context_packet_ref;
  if (packetRef) {
    if (packetRef.ref_type !== "task_context_packet" || !packetRef.source_ref) {
      refuseV01();
    }
    requireRelatedRecordV01(byIdentity, {
      kind: "task_context_packet",
      id: packetRef.external_id,
      fingerprint: packetRef.source_ref,
      workspace_id: record.workspace_id,
      project_id: record.project_id,
    });
    const packetRecord = readVNextCoreRecordV01(db, {
      record_kind: "task_context_packet",
      record_id: packetRef.external_id,
      workspace_id: record.workspace_id,
      project_id: record.project_id,
    });
    if (!packetRecord || packetRecord.fingerprint !== packetRef.source_ref) {
      refuseV01();
    }
    const packet = packetRecord.payload as TaskContextPacketV01;
    if (
      validateTaskContextPacketV01(packet, {
        evaluated_at: packet?.generated_at ?? "",
      }).status !== "valid"
    ) {
      refuseV01();
    }
    assertVNextCoreRecordMatchesProtocolPayloadBindingV01(packetRecord, {
      workspace_id: packet.workspace_id,
      project_id: packet.project_id,
      fingerprint: packet.integrity.fingerprint,
    });
    if (
      packetRecord.record_id !== packet.packet_id ||
      packetRecord.created_at !== packet.generated_at
    ) {
      refuseV01();
    }
  }

  for (const transitionRef of [
    ...receipt.external_refs,
    ...receipt.source_refs,
  ].filter((ref) => ref.ref_type === "state_transition_receipt")) {
    if (!transitionRef.source_ref) refuseV01();
    requireRelatedRecordV01(byIdentity, {
      kind: "state_transition_receipt",
      id: transitionRef.external_id,
      fingerprint: transitionRef.source_ref,
      workspace_id: record.workspace_id,
      project_id: record.project_id,
    });
    const transition = loadValidatedVNextSemanticTransitionRelationV01(db, {
      workspace_id: record.workspace_id,
      project_id: record.project_id,
      transition_receipt_id: transitionRef.external_id,
      transition_receipt_fingerprint: transitionRef.source_ref,
    });
    if (
      transition.receipt.transition_receipt_id !== transitionRef.external_id ||
      transition.receipt.integrity.fingerprint !== transitionRef.source_ref ||
      transition.receipt.workspace_id !== record.workspace_id ||
      transition.receipt.project_id !== record.project_id
    ) {
      refuseV01();
    }
  }
}

function validateDatabaseRelationsV01(
  db: Database.Database,
  records: ParsedCanonicalRecordV01[],
  byIdentity: Map<string, ParsedCanonicalRecordV01>,
): void {
  const validatedAutomationScopes = new Set<string>();
  for (const record of records) {
    switch (record.record_kind) {
      case "automation_work_item": {
        const scopeKey = `${record.workspace_id}\u0000${record.project_id}`;
        if (!validatedAutomationScopes.has(scopeKey)) {
          listCurrentVNextAutomationWorkSnapshotsV01(db, {
            workspace_id: record.workspace_id,
            project_id: record.project_id,
          });
          validatedAutomationScopes.add(scopeKey);
        }
        break;
      }
      case "capability_grant": {
        const found = readBoundedAutomationCapabilityGrantV01(db, {
          workspace_id: record.workspace_id,
          project_id: record.project_id,
          grant_id: record.record_id,
          grant_fingerprint: record.fingerprint,
        });
        if (found.grant_fingerprint !== record.fingerprint) refuseV01();
        break;
      }
      case "task_context_packet":
        validateCompiledTaskContextPacketRelationV01(db, record, byIdentity);
        break;
      case "run_receipt":
        validateRunReceiptRelationsV01(db, record, byIdentity);
        break;
      case "evidence_record": {
        const found = readEvidenceRecordV01(db, {
          workspace_id: record.workspace_id,
          project_id: record.project_id,
          evidence_id: record.record_id,
        });
        if (!found || found.integrity.fingerprint !== record.fingerprint) {
          refuseV01();
        }
        break;
      }
      case "claim_record": {
        const found = readClaimRecordV01(db, {
          workspace_id: record.workspace_id,
          project_id: record.project_id,
          claim_id: record.record_id,
        });
        if (!found || found.integrity.fingerprint !== record.fingerprint) {
          refuseV01();
        }
        break;
      }
      case "claim_evidence_relation": {
        const found = readClaimEvidenceRelationV01(db, {
          workspace_id: record.workspace_id,
          project_id: record.project_id,
          relation_id: record.record_id,
        });
        if (!found || found.integrity.fingerprint !== record.fingerprint) {
          refuseV01();
        }
        break;
      }
      case "episode_delta_proposal":
        validateProposalRelationsV01(db, record, byIdentity);
        break;
      case "review_decision":
        validateDecisionRelationV01(record, byIdentity);
        break;
      case "semantic_commit_gate":
        loadValidatedVNextSemanticCommitGateRelationV01(db, {
          workspace_id: record.workspace_id,
          project_id: record.project_id,
          gate_record_id: record.record_id,
          gate_record_fingerprint: record.fingerprint,
        });
        break;
      case "semantic_state":
        validateSemanticStateRelationsV01(record, byIdentity);
        break;
      case "state_transition_receipt":
        loadValidatedVNextSemanticTransitionRelationV01(db, {
          workspace_id: record.workspace_id,
          project_id: record.project_id,
          transition_receipt_id: record.record_id,
          transition_receipt_fingerprint: record.fingerprint,
        });
        break;
      case "context_use_review":
        validateContextUseReviewRelationV01(record, byIdentity);
        break;
    }
  }
}

interface ProductReaderProjectScopeV01 {
  workspace_id: string;
  project_id: string;
  created_at: string;
  operator_id: string | null;
  session_id: string | null;
}

function databaseTableExistsV01(
  db: Database.Database,
  tableName: string,
): boolean {
  return Boolean(
    db
      .prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = ?")
      .get(tableName),
  );
}

function currentProductReaderSchemaAvailableV01(
  db: Database.Database,
): boolean {
  // The one supported pre-R8-B source schema is validated again after its
  // additive migration. Only a current staged database carries both of these
  // operational tables, so old data is not judged against readers it has not
  // been migrated to yet.
  return [
    "augnes_schema_migrations",
    "augnes_package_identity_guard",
    "vnext_project_identities",
    "vnext_project_root_bindings",
    "vnext_local_operator_sessions",
    "vnext_semantic_state_entries",
    "vnext_semantic_target_heads",
  ].every((tableName) => databaseTableExistsV01(db, tableName));
}

function latestScopeTimestampV01(
  project: ProductReaderProjectScopeV01,
  records: ParsedCanonicalRecordV01[],
): string {
  return records
    .filter(
      (record) =>
        record.workspace_id === project.workspace_id &&
        record.project_id === project.project_id,
    )
    .reduce(
      (latest, record) =>
        record.created_at > latest ? record.created_at : latest,
      requiredStringV01(project.created_at),
    );
}

function validateProductReaderCompatibilityV01(
  db: Database.Database,
  records: ParsedCanonicalRecordV01[],
): void {
  if (!currentProductReaderSchemaAvailableV01(db)) return;

  try {
    const projects = db
      .prepare(
        `SELECT project.workspace_id, project.project_id, project.created_at,
                (
                  SELECT session.operator_id
                    FROM vnext_local_operator_sessions AS session
                   WHERE session.workspace_id = project.workspace_id
                     AND session.project_id = project.project_id
                   ORDER BY session.issued_at, session.session_id
                   LIMIT 1
                ) AS operator_id,
                (
                  SELECT session.session_id
                    FROM vnext_local_operator_sessions AS session
                   WHERE session.workspace_id = project.workspace_id
                     AND session.project_id = project.project_id
                   ORDER BY session.issued_at, session.session_id
                   LIMIT 1
                ) AS session_id
           FROM vnext_project_identities AS project
          ORDER BY project.workspace_id, project.project_id`,
      )
      .all() as ProductReaderProjectScopeV01[];
    const projectsByScope = new Map(
      projects.map((project) => [
        `${project.workspace_id}\u0000${project.project_id}`,
        project,
      ]),
    );
    for (const record of records) {
      if (
        !projectsByScope.has(`${record.workspace_id}\u0000${record.project_id}`)
      ) {
        refuseV01("database_cross_project_reference");
      }
    }

    for (const project of projects) {
      const observedAt = latestScopeTimestampV01(project, records);
      const config: VNextLocalOperatorPilotConfigV01 = {
        enabled: true,
        workspace_id: requiredStringV01(project.workspace_id),
        project_id: requiredStringV01(project.project_id),
        operator_id:
          project.operator_id ?? "operator:recovery-reader-validation",
        database_path:
          typeof db.name === "string" && db.name.length > 0
            ? db.name
            : ":memory:",
      };
      const home = readProjectHomeDatabaseCompatibilityV01(
        db,
        {
          workspace_id: config.workspace_id,
          project_id: config.project_id,
        },
        {
          now: () => observedAt,
          operator_config: config,
        },
      );
      if (
        home.workspace_id !== config.workspace_id ||
        home.project_id !== config.project_id ||
        home.read_compatible !== true ||
        home.projection_only !== true
      ) {
        refuseV01("database_reader_incompatible");
      }

      const proposals = records.filter(
        (candidate) =>
          candidate.record_kind === "episode_delta_proposal" &&
          candidate.workspace_id === config.workspace_id &&
          candidate.project_id === config.project_id,
      );
      const latestTransition = records
        .filter(
          (candidate) =>
            candidate.record_kind === "state_transition_receipt" &&
            candidate.workspace_id === config.workspace_id &&
            candidate.project_id === config.project_id,
        )
        .at(-1);
      const appliedProposalId = latestTransition
        ? (latestTransition.payload as unknown as StateTransitionReceiptV01)
            .source_proposal.proposal_id
        : null;
      const representativeProposal =
        proposals.find(
          (candidate) => candidate.record_id === appliedProposalId,
        ) ??
        proposals.at(-1) ??
        null;

      if (representativeProposal) {
        const record = representativeProposal;
        const proposal = record.payload as unknown as EpisodeDeltaProposalV01;
        const workbench = readVNextOperatorPilotProposalDurableLineageV01(db, {
          config,
          proposal,
          clock: { now: () => observedAt },
        });
        if (
          workbench.proposal_id !== proposal.proposal_id ||
          workbench.proposal_fingerprint !== proposal.integrity.fingerprint ||
          workbench.read_only !== true ||
          workbench.semantic_authority_granted !== false
        ) {
          refuseV01("database_reader_incompatible");
        }
        const inspector = readSharedProjectInspectorV01(db, {
          config,
          authenticated_session_id:
            project.session_id ?? "session:recovery-reader-validation",
          observed_at: observedAt,
          target: {
            target_kind: "episode_delta_proposal",
            record_id: proposal.proposal_id,
            expected_fingerprint: proposal.integrity.fingerprint,
          },
        });
        if (
          inspector.workspace_id !== config.workspace_id ||
          inspector.project_id !== config.project_id ||
          inspector.target.target_kind !== "episode_delta_proposal" ||
          inspector.authority.read_only !== true ||
          inspector.authority.writes_database !== false ||
          inspector.authority.creates_review_decision !== false ||
          inspector.authority.applies_transition !== false ||
          inspector.authority.calls_model_or_provider !== false
        ) {
          refuseV01("database_reader_incompatible");
        }
      } else {
        const inspector = readSharedProjectInspectorV01(db, {
          config,
          authenticated_session_id:
            project.session_id ?? "session:recovery-reader-validation",
          observed_at: observedAt,
          target: { target_kind: "project_coordination" },
        });
        if (
          inspector.workspace_id !== config.workspace_id ||
          inspector.project_id !== config.project_id ||
          inspector.authority.read_only !== true ||
          inspector.authority.writes_database !== false
        ) {
          refuseV01("database_reader_incompatible");
        }
      }
    }
  } catch (error) {
    if (error instanceof CanonicalRecordRefusalV01) throw error;
    refuseV01("database_reader_incompatible");
  }
}

function readCanonicalRecordsV01(
  db: Database.Database,
): ParsedCanonicalRecordV01[] {
  let table: unknown;
  try {
    table = db
      .prepare(
        "SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'vnext_core_records'",
      )
      .get();
  } catch {
    refuseV01("database_reader_incompatible");
  }
  if (!table) return [];

  let count: number;
  let rows: CanonicalRecordRowV01[];
  try {
    const countRow = db
      .prepare("SELECT COUNT(*) AS count FROM vnext_core_records")
      .get() as { count: number | bigint };
    count = Number(countRow.count);
    if (!Number.isSafeInteger(count) || count < 0) refuseV01();
    rows = db
      .prepare(
        `SELECT record_kind, record_id, workspace_id, project_id,
                fingerprint, idempotency_key, payload_json, created_at
           FROM vnext_core_records
          ORDER BY record_kind, record_id`,
      )
      .all() as CanonicalRecordRowV01[];
  } catch (error) {
    if (error instanceof CanonicalRecordRefusalV01) throw error;
    refuseV01("database_reader_incompatible");
  }
  if (rows.length !== count) refuseV01("database_reader_incompatible");
  const allowedKinds = new Set<string>(RECORD_KINDS_V01);
  return rows.map((row) => {
    if (!allowedKinds.has(row.record_kind)) refuseV01();
    return {
      record_kind: row.record_kind as CanonicalRecordKindV01,
      record_id: requiredStringV01(row.record_id),
      workspace_id: requiredStringV01(row.workspace_id),
      project_id: requiredStringV01(row.project_id),
      fingerprint: requiredStringV01(row.fingerprint),
      idempotency_key: nullableStringV01(row.idempotency_key),
      payload: parsePayloadV01(row.payload_json),
      created_at: requiredStringV01(row.created_at),
    };
  });
}

/**
 * Validates immutable canonical records through their production validators,
 * exact persistence envelopes, and the durable source/authority loaders that
 * already define read compatibility. The result is deliberately bounded and
 * never exposes validator exceptions or persisted material.
 */
export function validateRecoveryCanonicalDatabaseV01(
  db: Database.Database,
): RecoveryCanonicalRecordValidationResultV01 {
  try {
    const records = readCanonicalRecordsV01(db);
    const byIdentity = new Map<string, ParsedCanonicalRecordV01>();
    for (const record of records) {
      const key = recordKeyV01(record.record_kind, record.record_id);
      if (byIdentity.has(key)) refuseV01();
      byIdentity.set(key, record);
      validatePayloadAndEnvelopeV01(record);
    }
    validateDatabaseRelationsV01(db, records, byIdentity);
    validateProductReaderCompatibilityV01(db, records);
    return validResultV01(records.length);
  } catch (error) {
    return invalidResultV01(
      error instanceof CanonicalRecordRefusalV01
        ? error.code
        : "database_canonical_invariant_failed",
    );
  }
}
