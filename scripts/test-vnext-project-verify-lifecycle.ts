import assert from "node:assert/strict";
import {
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import Database from "better-sqlite3";

import { buildSemanticTransitionLoopFixtureV01 } from "@/fixtures/vnext/protocol/semantic-transition-loop-v0-1";
import { semanticReviewLoopProjectAFixture } from "@/fixtures/vnext/protocol/semantic-review-loop-v0-1";
import {
  createEpisodeDeltaProposalFingerprintV01,
  deriveEpisodeDeltaProposalIdV01,
  validateEpisodeDeltaProposalV01,
} from "@/lib/vnext/episode-delta-proposal";
import {
  deriveVNextSemanticTargetKeyV01,
  ensureVNextDurableSemanticStoreSchemaV01,
  insertVNextCoreRecordV01,
  readVNextCoreRecordV01,
  readVNextSemanticStateEntryV01,
  readVNextSemanticTargetHeadV01,
  rebuildVNextPersistedSemanticStateV01,
  buildVNextPersistedSemanticStateV01,
} from "@/lib/vnext/persistence/durable-semantic-store";
import {
  admitProjectVerifyLifecycleProposalV01,
  assertPersistedProjectVerifyLifecycleProposalSourceBoundV01,
  materializeProjectVerifyClaimLifecycleProposalV01 as materializeProjectVerifyClaimLifecycleProposalCoreV01,
  materializeProjectVerifyRelationLifecycleProposalV01 as materializeProjectVerifyRelationLifecycleProposalCoreV01,
  ProjectVerifyLifecycleAdmissionErrorV01,
  assertProjectVerifyLifecycleProposalCurrentHeadExpectationV01,
} from "@/lib/vnext/persistence/project-verify-lifecycle-admission";
import { readProjectVerifyLifecycleProposalLocatorOnlyV01 } from "@/lib/vnext/persistence/project-verify-lifecycle-source";
import {
  admitClaimEvidenceRelationV01,
  admitClaimRecordV01,
  admitEvidenceRecordV01,
  admitProjectVerifyMaterialBatchV01,
} from "@/lib/vnext/persistence/project-verify-material-store";
import {
  buildClaimEvidenceRelationV01,
  buildClaimRecordV01,
  buildEvidenceRecordV01,
  claimEvidenceRelationReferenceV01,
  claimRecordReferenceV01,
  createClaimApplicabilityScopeV01,
  evidenceRecordReferenceV01,
} from "@/lib/vnext/project-verify-material";
import {
  buildProjectVerifyLifecycleBindingV01,
  buildProjectVerifyLifecycleProposalProfileV01,
} from "@/lib/vnext/project-verify-lifecycle-protocol";
import { materializeProjectVerifyLifecycleProposalV01 } from "@/lib/vnext/project-verify-lifecycle";
import {
  canonicalizeProtocolValueV01,
  createProtocolSha256V01,
} from "@/lib/vnext/protocol-primitives";
import {
  buildReviewDecisionV01,
  createEpisodeDeltaCandidateFingerprintV01,
  validateReviewDecisionAgainstEpisodeDeltaProposalV01,
  validateReviewDecisionV01,
  type ReviewDecisionBuilderInputV01,
} from "@/lib/vnext/review-decision";
import {
  assertProjectVerifyLifecyclePersistedStateSourceBoundWithReadSessionV01,
  commitVNextSemanticTransitionV01,
  createValidatedVNextSemanticTransitionRelationReadSessionV01,
  loadValidatedVNextSemanticTransitionRelationV01,
  persistVNextSemanticReviewMaterialV01,
  prepareVNextSemanticCommitPreviewV01,
  recordVNextSemanticCommitAuthorizationV01,
  VNEXT_SEMANTIC_TRANSITION_TEST_FAILURE_CHECKPOINTS_V01,
  type VNextSemanticCommitAuthorizationResultV01,
  type VNextSemanticCommitPreviewV01,
  type VNextSemanticTransitionCommitResultV01,
} from "@/lib/vnext/runtime/durable-semantic-transition";
import {
  VNEXT_LOCAL_OPERATOR_SESSION_COOKIE_V01,
  VNEXT_LOCAL_OPERATOR_SESSION_SCHEMA_SQL_V01,
  consumeVNextLocalOperatorBootstrapV01,
  issueVNextLocalOperatorBootstrapV01,
  readVNextLocalOperatorCredentialFromRequestV01,
  type VNextLocalOperatorPilotConfigV01,
  type VNextLocalOperatorSecretSourceV01,
  type VNextLocalOperatorSessionCredentialV01,
} from "@/lib/vnext/runtime/local-operator-session";
import { readProjectVerifyLineageV01 } from "@/lib/vnext/runtime/project-verify-lineage";
import {
  readProjectVerifyReconciliationForLineageV01,
  readProjectVerifyReconciliationV01,
} from "@/lib/vnext/runtime/project-verify-reconciliation";
import {
  recordVNextOperatorPilotReviewDecisionV01,
  resolveVNextOperatorPilotApplyingDecisionV01,
} from "@/lib/vnext/runtime/operator-pilot-review-material";
import type { EpisodeDeltaProposalV01 } from "@/types/vnext/episode-delta-proposal";
import type { ExternalRefV01 } from "@/types/vnext/external-ref";
import type {
  ClaimEvidenceRelationKindV01,
  ClaimEvidenceRelationV01,
  ClaimApplicabilityScopeV01,
  ClaimOperationIntentV01,
  ClaimRecordV01,
  EvidenceRecordV01,
} from "@/types/vnext/project-verify-material";
import type { ReviewDecisionV01 } from "@/types/vnext/review-decision";

const WORKSPACE_ID = "workspace-sr3-project-verify-proof";
const PROJECT_ID = "project-sr3-project-verify-proof";
const OTHER_PROJECT_ID = "project-sr3-project-verify-proof-other";
const BASE_AT = "2026-07-20T00:00:00.000Z";
const PRODUCER = {
  producer_kind: "server_deterministic_evaluator" as const,
  producer_profile: "sr3-project-verify-focused-proof.v0.1",
};
const USER_PRODUCER = {
  producer_kind: "user" as const,
  producer_profile: "sr3-project-verify-user-candidate.v0.1",
};

function testLifecycleObservedAtV01(
  db: Database.Database,
  scope: { workspace_id: string; project_id: string },
): string {
  const row = db
    .prepare(
      `SELECT MAX(observed_at) AS observed_at
         FROM (
           SELECT created_at AS observed_at
             FROM vnext_core_records
            WHERE workspace_id = ? AND project_id = ?
           UNION ALL
           SELECT updated_at AS observed_at
             FROM vnext_semantic_target_heads
            WHERE workspace_id = ? AND project_id = ?
         )`,
    )
    .get(
      scope.workspace_id,
      scope.project_id,
      scope.workspace_id,
      scope.project_id,
    ) as { observed_at: string | null };
  const floor = row.observed_at ?? BASE_AT;
  return new Date(Date.parse(floor) + 1_000).toISOString();
}

function materializeProjectVerifyClaimLifecycleProposalV01(
  db: Database.Database,
  input: Omit<
    Parameters<typeof materializeProjectVerifyClaimLifecycleProposalCoreV01>[1],
    "observed_at"
  > & { observed_at?: string },
) {
  return materializeProjectVerifyClaimLifecycleProposalCoreV01(db, {
    ...input,
    observed_at: input.observed_at ?? testLifecycleObservedAtV01(db, input),
  });
}

function materializeProjectVerifyRelationLifecycleProposalV01(
  db: Database.Database,
  input: Omit<
    Parameters<
      typeof materializeProjectVerifyRelationLifecycleProposalCoreV01
    >[1],
    "observed_at"
  > & { observed_at?: string },
) {
  return materializeProjectVerifyRelationLifecycleProposalCoreV01(db, {
    ...input,
    observed_at: input.observed_at ?? testLifecycleObservedAtV01(db, input),
  });
}

interface AppliedLifecycleV01 {
  proposal: EpisodeDeltaProposalV01;
  decision: ReviewDecisionV01;
  preview: VNextSemanticCommitPreviewV01;
  authorization: VNextSemanticCommitAuthorizationResultV01;
  commit: VNextSemanticTransitionCommitResultV01;
}

function refV01(
  refType: string,
  externalId: string,
  trustClass: ExternalRefV01["trust_class"] = "derived_interpretation",
  observedAt: string = BASE_AT,
): ExternalRefV01 {
  return {
    ref_version: "external_ref.v0.1",
    ref_type: refType,
    external_id: externalId,
    observed_at: observedAt,
    trust_class: trustClass,
  };
}

const subjectRef = refV01(
  "project_verify_subject",
  "subject:sr3-lifecycle-proof",
);
const sourceRef = refV01("project_verify_source", "source:sr3-lifecycle-proof");
const applicability = createClaimApplicabilityScopeV01({
  subject_refs: [subjectRef],
  environment_refs: [refV01("environment", "environment:local")],
  condition: {
    kind: "exact_context",
    value: "applicable",
    context_refs: [sourceRef],
  },
});

function evidenceV01(input: {
  identityKey: string;
  projectId?: string;
}): EvidenceRecordV01 {
  return buildEvidenceRecordV01({
    identity_namespace: "augnes.test.sr3.evidence.v0.1",
    identity_key: input.identityKey,
    workspace_id: WORKSPACE_ID,
    project_id: input.projectId ?? PROJECT_ID,
    evidence_kind: "derived_interpretation_material",
    subject_refs: [subjectRef],
    source_refs: [sourceRef],
    source_observed_or_reported_at: BASE_AT,
    recorded_at: BASE_AT,
    trust_class: "derived_interpretation",
    coverage: "complete",
    bounded_summary: `Bounded candidate support material ${input.identityKey}.`,
    material_fingerprint: null,
    limitations: ["Evidence existence does not establish truth."],
    uncertainty: ["Semantic application remains separately authorized."],
    producer: PRODUCER,
  });
}

function claimV01(input: {
  revision: number;
  prior: ClaimRecordV01 | null;
  operation: ClaimOperationIntentV01;
  proposition: string;
  familySeed: string;
  projectId?: string;
  applicabilityScope?: ClaimApplicabilityScopeV01;
}): ClaimRecordV01 {
  const producer = input.revision === 1 ? PRODUCER : USER_PRODUCER;
  return buildClaimRecordV01({
    family_origin: {
      origin_namespace:
        input.prior?.family_origin.origin_namespace ??
        "augnes.test.sr3.claim-family.v0.1",
      origin_seed: input.prior?.family_origin.origin_seed ?? input.familySeed,
      origin_profile:
        input.prior?.family_origin.origin_profile ?? PRODUCER.producer_profile,
      origin_producer_kind:
        input.prior?.family_origin.origin_producer_kind ??
        PRODUCER.producer_kind,
    },
    workspace_id: WORKSPACE_ID,
    project_id: input.projectId ?? PROJECT_ID,
    revision: input.revision,
    prior_claim_ref: input.prior ? claimRecordReferenceV01(input.prior) : null,
    operation_intent: input.operation,
    operation_target_claim_ref:
      input.operation === "supersede" || input.operation === "retract"
        ? claimRecordReferenceV01(assertPresentV01(input.prior))
        : null,
    proposition: input.proposition,
    subject_refs: input.applicabilityScope?.subject_refs ?? [subjectRef],
    applicability_scope: input.applicabilityScope ?? applicability,
    source_refs: [
      input.revision === 1
        ? sourceRef
        : refV01(
            "user_claim_revision",
            `user:sr3-claim:${input.familySeed}:${input.revision}`,
            "user_declaration",
            timestampV01(input.revision, 1),
          ),
    ],
    limitations: ["The Claim remains an immutable candidate proposition."],
    uncertainty: ["Claim truth is not established."],
    producer,
    created_at: timestampV01(input.revision, 0),
  });
}

function relationV01(input: {
  revision: number;
  prior: ClaimEvidenceRelationV01 | null;
  operation: ClaimOperationIntentV01;
  familySeed: string;
  claim: ClaimRecordV01;
  evidence: EvidenceRecordV01;
  kind: ClaimEvidenceRelationKindV01;
  applicabilityScope?: ClaimApplicabilityScopeV01;
  createdAt?: string;
}): ClaimEvidenceRelationV01 {
  const producer = input.revision === 1 ? PRODUCER : USER_PRODUCER;
  return buildClaimEvidenceRelationV01({
    family_origin: {
      origin_namespace:
        input.prior?.family_origin.origin_namespace ??
        "augnes.test.sr3.relation-family.v0.1",
      origin_seed: input.prior?.family_origin.origin_seed ?? input.familySeed,
      origin_profile:
        input.prior?.family_origin.origin_profile ?? PRODUCER.producer_profile,
      origin_producer_kind:
        input.prior?.family_origin.origin_producer_kind ??
        PRODUCER.producer_kind,
    },
    workspace_id: WORKSPACE_ID,
    project_id: PROJECT_ID,
    revision: input.revision,
    prior_relation_ref: input.prior
      ? claimEvidenceRelationReferenceV01(input.prior)
      : null,
    operation_intent: input.operation,
    supersedes_relation_ref:
      input.operation === "supersede"
        ? claimEvidenceRelationReferenceV01(assertPresentV01(input.prior))
        : null,
    claim_ref: claimRecordReferenceV01(input.claim),
    evidence_ref: evidenceRecordReferenceV01(input.evidence),
    relation_kind: input.kind,
    applicability_scope: input.applicabilityScope ?? applicability,
    basis: "insufficient",
    trust_class: "derived_interpretation",
    source_refs: [
      input.revision === 1
        ? sourceRef
        : refV01(
            "user_relation_revision",
            `user:sr3-relation:${input.familySeed}:${input.revision}`,
            "user_declaration",
            timestampV01(input.revision, 2),
          ),
    ],
    limitations: ["Relation existence does not prove the Claim."],
    uncertainty: ["The relation basis remains non-conclusive."],
    producer,
    created_at: input.createdAt ?? timestampV01(input.revision, 2),
  });
}

function decisionV01(input: {
  proposal: EpisodeDeltaProposalV01;
  decision?: ReviewDecisionV01["decision"];
  priorDecision?: ReviewDecisionV01 | null;
  cycle: number;
}): ReviewDecisionV01 {
  const proposal = input.proposal;
  const profile = assertPresentV01(proposal.project_verify_lifecycle);
  const candidate = assertPresentV01(proposal.proposed_deltas[0]);
  const operation = profile.lifecycle_binding.selected_record_operation_intent;
  const applyingDecision: ReviewDecisionV01["decision"] =
    operation === "supersede"
      ? "supersede"
      : operation === "retract"
        ? "retract"
        : "accept";
  const decision = input.decision ?? applyingDecision;
  const isApplying = decision === applyingDecision;
  const candidateBinding = {
    candidate_id: candidate.candidate_id,
    candidate_fingerprint: createEpisodeDeltaCandidateFingerprintV01(candidate),
  };
  const priorBinding = input.priorDecision
    ? {
        decision_id: input.priorDecision.decision_id,
        decision_fingerprint: input.priorDecision.integrity.fingerprint,
      }
    : null;
  const decidedAt = cycleTimestampV01(input.cycle, 0);
  const decisionInput: ReviewDecisionBuilderInputV01 = {
    workspace_id: proposal.workspace_id,
    project_id: proposal.project_id,
    source_proposal: {
      proposal_version: proposal.proposal_version,
      proposal_id: proposal.proposal_id,
      proposal_fingerprint: proposal.integrity.fingerprint,
    },
    candidate: candidateBinding,
    decision,
    actor_ref: refV01(
      "operator_actor",
      `operator:sr3:${input.cycle}:${decision}`,
      "user_declaration",
      decidedAt,
    ),
    authorization_basis_refs: [
      refV01(
        "operator_authorization_basis",
        `authorization:sr3:${input.cycle}:${decision}`,
        "user_declaration",
        decidedAt,
      ),
    ],
    decision_basis_material_ids: [...candidate.basis_material_ids],
    decision_basis_refs: [assertPresentV01(candidate.source_refs[0])],
    rationale_summary:
      "The focused proof records a synthetic user-declared decision; contract construction does not prove real operator authorization.",
    decided_at: decidedAt,
    revisit:
      decision === "defer"
        ? {
            revisit_at: cycleTimestampV01(input.cycle + 1, 0),
            expires_at: null,
            condition_summary: "Revisit only through a later explicit review.",
          }
        : null,
    requested_transition_intent: isApplying
      ? {
          intent_id: `transition-intent:sr3:${profile.integrity.fingerprint.slice(7, 23)}:${decision}`,
          transition_kind:
            applyingDecision === "accept"
              ? "semantic_candidate_apply"
              : applyingDecision === "supersede"
                ? "semantic_candidate_supersede"
                : "semantic_candidate_retract",
          bounded_summary:
            "Request one exact family-target effect through the existing semantic commit gate and Transition writer.",
          target_refs: [profile.lifecycle_binding.family_target_ref],
          intent_only: true,
          applied: false,
          state_transition_receipt_ref: null,
        }
      : null,
    lineage: {
      prior_decisions: isApplying && priorBinding ? [priorBinding] : [],
      superseding_candidate:
        isApplying && applyingDecision === "supersede"
          ? candidateBinding
          : null,
      retracted_decision:
        isApplying && applyingDecision === "retract" ? priorBinding : null,
    },
    compatibility: {
      source_contracts: [
        proposal.proposal_version,
        profile.proposal_profile,
        profile.lifecycle_binding.binding_version,
      ],
      unmapped_fields: [],
      warnings: [
        "Claim truth and Evidence acceptance remain outside ReviewDecision.",
      ],
      external_refs: [],
    },
    authority_notes: [
      "Only a later successfully committed Transition may change the family head.",
    ],
  };
  const built = buildReviewDecisionV01(decisionInput);
  assert.equal(validateReviewDecisionV01(built).status, "valid");
  assert.equal(
    validateReviewDecisionAgainstEpisodeDeltaProposalV01(built, proposal)
      .status,
    "valid",
  );
  return built;
}

function rebuildDecisionV01(
  decision: ReviewDecisionV01,
  overrides: Partial<
    Pick<
      ReviewDecisionBuilderInputV01,
      "candidate" | "decision" | "requested_transition_intent" | "lineage"
    >
  >,
): ReviewDecisionV01 {
  return buildReviewDecisionV01({
    workspace_id: decision.workspace_id,
    project_id: decision.project_id,
    source_proposal: structuredClone(decision.source_proposal),
    candidate: structuredClone(overrides.candidate ?? decision.candidate),
    decision: overrides.decision ?? decision.decision,
    actor_ref: structuredClone(decision.actor_ref),
    authorization_basis_refs: structuredClone(
      decision.authorization_basis_refs,
    ),
    decision_basis_material_ids: [...decision.decision_basis_material_ids],
    decision_basis_refs: structuredClone(decision.decision_basis_refs),
    rationale_summary: decision.rationale_summary,
    decided_at: decision.decided_at,
    revisit: structuredClone(decision.revisit),
    requested_transition_intent: structuredClone(
      overrides.requested_transition_intent ??
        decision.requested_transition_intent,
    ),
    lineage: structuredClone(overrides.lineage ?? decision.lineage),
    compatibility: structuredClone(decision.compatibility),
    authority_notes: [...decision.authority_summary.notes],
  });
}

function rebuildLifecycleProposalV01(
  proposal: EpisodeDeltaProposalV01,
  input: {
    selected_record_fingerprint?: string;
    current_head_state_fingerprint?: string;
  },
): EpisodeDeltaProposalV01 {
  const rebuilt = structuredClone(proposal);
  const profile = assertPresentV01(rebuilt.project_verify_lifecycle);
  const oldBinding = profile.lifecycle_binding;
  const selectedFingerprint =
    input.selected_record_fingerprint ??
    oldBinding.selected_record_ref.record_fingerprint;
  if (
    selectedFingerprint !== oldBinding.selected_record_ref.record_fingerprint
  ) {
    rewriteRecordFingerprintRefsV01(
      rebuilt,
      oldBinding.selected_record_ref.record_kind,
      oldBinding.selected_record_ref.record_id,
      oldBinding.selected_record_ref.record_fingerprint,
      selectedFingerprint,
    );
  }
  const rewrittenProfile = assertPresentV01(rebuilt.project_verify_lifecycle);
  const rewrittenBinding = rewrittenProfile.lifecycle_binding;
  const candidate = assertPresentV01(rebuilt.proposed_deltas[0]);
  const candidateBinding = {
    candidate_id: candidate.candidate_id,
    candidate_fingerprint: createEpisodeDeltaCandidateFingerprintV01(candidate),
  };
  const binding = buildProjectVerifyLifecycleBindingV01({
    entity_kind: rewrittenBinding.entity_kind,
    workspace_id: rewrittenBinding.workspace_id,
    project_id: rewrittenBinding.project_id,
    family_id: rewrittenBinding.family_id,
    family_target_ref: rewrittenBinding.family_target_ref,
    family_origin_fingerprint: rewrittenBinding.family_origin_fingerprint,
    applicability_scope_fingerprint:
      rewrittenBinding.applicability_scope_fingerprint,
    selected_record_ref: rewrittenBinding.selected_record_ref,
    selected_record_revision: rewrittenBinding.selected_record_revision,
    selected_record_operation_intent:
      rewrittenBinding.selected_record_operation_intent,
    prior_record_ref: rewrittenBinding.prior_record_ref,
    operation_target_record_ref: rewrittenBinding.operation_target_record_ref,
    relation_endpoints: rewrittenBinding.relation_endpoints,
    decision_candidate: candidateBinding,
    selected_candidate: candidateBinding,
  });
  const head = structuredClone(rewrittenProfile.current_head_expectation);
  if (input.current_head_state_fingerprint !== undefined) {
    assert.equal(head.presence, "present");
    head.state_content_fingerprint = input.current_head_state_fingerprint;
  }
  rebuilt.project_verify_lifecycle =
    buildProjectVerifyLifecycleProposalProfileV01({
      lifecycle_binding: binding,
      current_head_expectation: head,
    });
  rebuilt.proposal_id = deriveEpisodeDeltaProposalIdV01(rebuilt);
  rebuilt.integrity.fingerprint =
    createEpisodeDeltaProposalFingerprintV01(rebuilt);
  return rebuilt;
}

function rebuildLifecycleStateOuterFingerprintsV01(
  state: ReturnType<typeof buildVNextPersistedSemanticStateV01>,
  input: {
    binding_workspace_id?: string;
    binding_project_id?: string;
    binding_candidate?: { candidate_id: string; candidate_fingerprint: string };
  },
): ReturnType<typeof buildVNextPersistedSemanticStateV01> {
  const rebuilt = structuredClone(state);
  const priorBinding = assertPresentV01(
    rebuilt.state_content.project_verify_lifecycle_binding,
  );
  const candidate = input.binding_candidate ?? priorBinding.selected_candidate;
  const binding = buildProjectVerifyLifecycleBindingV01({
    entity_kind: priorBinding.entity_kind,
    workspace_id: input.binding_workspace_id ?? priorBinding.workspace_id,
    project_id: input.binding_project_id ?? priorBinding.project_id,
    family_id: priorBinding.family_id,
    family_target_ref: priorBinding.family_target_ref,
    family_origin_fingerprint: priorBinding.family_origin_fingerprint,
    applicability_scope_fingerprint:
      priorBinding.applicability_scope_fingerprint,
    selected_record_ref: priorBinding.selected_record_ref,
    selected_record_revision: priorBinding.selected_record_revision,
    selected_record_operation_intent:
      priorBinding.selected_record_operation_intent,
    prior_record_ref: priorBinding.prior_record_ref,
    operation_target_record_ref: priorBinding.operation_target_record_ref,
    relation_endpoints: priorBinding.relation_endpoints,
    decision_candidate: candidate,
    selected_candidate: candidate,
  });
  rebuilt.state_content.project_verify_lifecycle_binding = binding;
  rebuilt.state_content_fingerprint = createProtocolSha256V01(
    canonicalizeProtocolValueV01(rebuilt.state_content),
  );
  const identityFingerprint = createProtocolSha256V01(
    canonicalizeProtocolValueV01({
      semantic_state_version: rebuilt.semantic_state_version,
      workspace_id: rebuilt.workspace_id,
      project_id: rebuilt.project_id,
      target_key: rebuilt.target_key,
      state_content_fingerprint: rebuilt.state_content_fingerprint,
      source_proposal_id: rebuilt.source_proposal_id,
      source_candidate_id: rebuilt.source_candidate_id,
      source_decision_id: rebuilt.source_decision_id,
    }),
  );
  rebuilt.semantic_state_record_id = `semantic-state:${identityFingerprint.slice("sha256:".length, 31)}`;
  rebuilt.state_ref = {
    ...rebuilt.state_ref,
    external_id: rebuilt.semantic_state_record_id,
    source_ref: rebuilt.state_content_fingerprint,
  };
  rebuilt.integrity.fingerprint = createProtocolSha256V01(
    canonicalizeProtocolValueV01({
      ...rebuilt,
      integrity: { ...rebuilt.integrity, fingerprint: undefined },
    }),
  );
  return rebuilt;
}

function rebuildLifecycleRelationEndpointProposalV01(
  proposal: EpisodeDeltaProposalV01,
): EpisodeDeltaProposalV01 {
  const rebuilt = structuredClone(proposal);
  const profile = assertPresentV01(rebuilt.project_verify_lifecycle);
  const oldBinding = profile.lifecycle_binding;
  const oldEndpoints = assertPresentV01(oldBinding.relation_endpoints);
  const candidate = assertPresentV01(rebuilt.proposed_deltas[0]);
  const candidateBinding = {
    candidate_id: candidate.candidate_id,
    candidate_fingerprint: createEpisodeDeltaCandidateFingerprintV01(candidate),
  };
  const binding = buildProjectVerifyLifecycleBindingV01({
    entity_kind: oldBinding.entity_kind,
    workspace_id: oldBinding.workspace_id,
    project_id: oldBinding.project_id,
    family_id: oldBinding.family_id,
    family_target_ref: oldBinding.family_target_ref,
    family_origin_fingerprint: oldBinding.family_origin_fingerprint,
    applicability_scope_fingerprint: oldBinding.applicability_scope_fingerprint,
    selected_record_ref: oldBinding.selected_record_ref,
    selected_record_revision: oldBinding.selected_record_revision,
    selected_record_operation_intent:
      oldBinding.selected_record_operation_intent,
    prior_record_ref: oldBinding.prior_record_ref,
    operation_target_record_ref: oldBinding.operation_target_record_ref,
    relation_endpoints: {
      claim_ref: oldEndpoints.claim_ref,
      evidence_ref: {
        ...oldEndpoints.evidence_ref,
        record_fingerprint: `sha256:${"f".repeat(64)}`,
      },
    },
    decision_candidate: candidateBinding,
    selected_candidate: candidateBinding,
  });
  rebuilt.project_verify_lifecycle =
    buildProjectVerifyLifecycleProposalProfileV01({
      lifecycle_binding: binding,
      current_head_expectation: profile.current_head_expectation,
    });
  rebuilt.proposal_id = deriveEpisodeDeltaProposalIdV01(rebuilt);
  rebuilt.integrity.fingerprint =
    createEpisodeDeltaProposalFingerprintV01(rebuilt);
  return rebuilt;
}

function rewriteRecordFingerprintRefsV01(
  value: unknown,
  recordKind: "claim_record" | "claim_evidence_relation",
  recordId: string,
  oldFingerprint: string,
  newFingerprint: string,
): void {
  if (Array.isArray(value)) {
    for (const item of value) {
      rewriteRecordFingerprintRefsV01(
        item,
        recordKind,
        recordId,
        oldFingerprint,
        newFingerprint,
      );
    }
    return;
  }
  if (!value || typeof value !== "object") return;
  const record = value as Record<string, unknown>;
  if (
    record.record_kind === recordKind &&
    record.record_id === recordId &&
    record.record_fingerprint === oldFingerprint
  ) {
    record.record_fingerprint = newFingerprint;
  }
  if (
    record.ref_type === recordKind &&
    record.external_id === recordId &&
    record.source_ref === oldFingerprint
  ) {
    record.source_ref = newFingerprint;
  }
  for (const nested of Object.values(record)) {
    rewriteRecordFingerprintRefsV01(
      nested,
      recordKind,
      recordId,
      oldFingerprint,
      newFingerprint,
    );
  }
}

function applyLifecycleV01(input: {
  db: Database.Database;
  proposal: EpisodeDeltaProposalV01;
  priorDecision?: ReviewDecisionV01 | null;
  cycle: number;
}): AppliedLifecycleV01 {
  const decision = decisionV01({
    proposal: input.proposal,
    priorDecision: input.priorDecision ?? null,
    cycle: input.cycle,
  });
  const persisted = persistVNextSemanticReviewMaterialV01(input.db, {
    proposal: input.proposal,
    decision,
  });
  assert.equal(persisted.proposal_record.status, "exact_replay");
  assert.equal(persisted.decision_record.status, "inserted");

  const beforePreview = stateCountSnapshotV01(input.db);
  const preview = prepareVNextSemanticCommitPreviewV01(input.db, {
    workspace_id: WORKSPACE_ID,
    project_id: PROJECT_ID,
    proposal_id: input.proposal.proposal_id,
    proposal_fingerprint: input.proposal.integrity.fingerprint,
    decision_id: decision.decision_id,
    decision_fingerprint: decision.integrity.fingerprint,
    authorized_applier_identity: {
      ref_type: "semantic_transition_applier",
      external_id: `local-core-applier:sr3:${input.cycle}`,
    },
    gate_ttl_ms: 30_000,
    clock: fixedClockV01(
      cycleTimestampV01(input.cycle, 1),
      cycleTimestampV01(input.cycle, 2),
    ),
  });
  assert.deepEqual(stateCountSnapshotV01(input.db), beforePreview);

  const authorization = recordVNextSemanticCommitAuthorizationV01(input.db, {
    preview,
    confirmation_digest: preview.confirmation_digest,
    operator_actor_ref: decision.actor_ref,
    clock: fixedClockV01(
      cycleTimestampV01(input.cycle, 3),
      cycleTimestampV01(input.cycle, 4),
      cycleTimestampV01(input.cycle, 5),
    ),
  });
  assert.equal(authorization.status, "inserted");
  assert.equal(authorization.eligibility.status, "eligible");
  assert.deepEqual(stateCountSnapshotV01(input.db), beforePreview);

  const commitInput = {
    workspace_id: WORKSPACE_ID,
    project_id: PROJECT_ID,
    proposal_id: input.proposal.proposal_id,
    proposal_fingerprint: input.proposal.integrity.fingerprint,
    decision_id: decision.decision_id,
    decision_fingerprint: decision.integrity.fingerprint,
    gate_record_id: authorization.gate_record.gate_record_id,
    gate_record_fingerprint: authorization.gate_record.integrity.fingerprint,
    clock: fixedClockV01(
      cycleTimestampV01(input.cycle, 6),
      cycleTimestampV01(input.cycle, 7),
    ),
  };
  const commit = commitVNextSemanticTransitionV01(input.db, commitInput);
  assert.equal(commit.status, "applied");
  const replay = commitVNextSemanticTransitionV01(input.db, {
    ...commitInput,
    clock: fixedClockV01(
      cycleTimestampV01(input.cycle, 6),
      cycleTimestampV01(input.cycle, 7),
    ),
  });
  assert.equal(replay.status, "exact_replay");
  assert.deepEqual(replay.transition_receipt, commit.transition_receipt);
  return { proposal: input.proposal, decision, preview, authorization, commit };
}

function commitRecordedLifecycleDecisionV01(input: {
  db: Database.Database;
  proposal: EpisodeDeltaProposalV01;
  decision: ReviewDecisionV01;
  cycle: number;
}): VNextSemanticTransitionCommitResultV01 {
  const preview = prepareVNextSemanticCommitPreviewV01(input.db, {
    workspace_id: WORKSPACE_ID,
    project_id: PROJECT_ID,
    proposal_id: input.proposal.proposal_id,
    proposal_fingerprint: input.proposal.integrity.fingerprint,
    decision_id: input.decision.decision_id,
    decision_fingerprint: input.decision.integrity.fingerprint,
    authorized_applier_identity: {
      ref_type: "semantic_transition_applier",
      external_id: `local-core-applier:r7b-operator:${input.cycle}`,
    },
    gate_ttl_ms: 30_000,
    clock: fixedClockV01(
      cycleTimestampV01(input.cycle, 1),
      cycleTimestampV01(input.cycle, 2),
    ),
  });
  const authorization = recordVNextSemanticCommitAuthorizationV01(input.db, {
    preview,
    confirmation_digest: preview.confirmation_digest,
    operator_actor_ref: input.decision.actor_ref,
    clock: fixedClockV01(
      cycleTimestampV01(input.cycle, 3),
      cycleTimestampV01(input.cycle, 4),
      cycleTimestampV01(input.cycle, 5),
    ),
  });
  assert.equal(authorization.status, "inserted");
  assert.equal(authorization.eligibility.status, "eligible");
  const commit = commitVNextSemanticTransitionV01(input.db, {
    workspace_id: WORKSPACE_ID,
    project_id: PROJECT_ID,
    proposal_id: input.proposal.proposal_id,
    proposal_fingerprint: input.proposal.integrity.fingerprint,
    decision_id: input.decision.decision_id,
    decision_fingerprint: input.decision.integrity.fingerprint,
    gate_record_id: authorization.gate_record.gate_record_id,
    gate_record_fingerprint: authorization.gate_record.integrity.fingerprint,
    clock: fixedClockV01(
      cycleTimestampV01(input.cycle, 6),
      cycleTimestampV01(input.cycle, 7),
    ),
  });
  assert.equal(commit.status, "applied");
  return commit;
}

class ProjectVerifyOperatorSecretSourceV01
  implements VNextLocalOperatorSecretSourceV01
{
  private sequence = 1;

  bytes(size: number): Uint8Array {
    const value = this.sequence;
    this.sequence += 1;
    return Uint8Array.from(
      { length: size },
      (_, index) => ((value * 31 + index * 17) % 251) + 1,
    );
  }
}

function credentialFromCookieV01(
  cookieValue: string,
): VNextLocalOperatorSessionCredentialV01 {
  return readVNextLocalOperatorCredentialFromRequestV01(
    new Request("http://127.0.0.1/api/vnext/operator/semantic-review", {
      headers: {
        cookie: `${VNEXT_LOCAL_OPERATOR_SESSION_COOKIE_V01}=${cookieValue}`,
      },
    }),
  );
}

function authorizeLifecycleGateV01(input: {
  db: Database.Database;
  proposal: EpisodeDeltaProposalV01;
  decision: ReviewDecisionV01;
  cycle: number;
  gateTtlMs: number;
  applierSuffix: string;
}): {
  preview: VNextSemanticCommitPreviewV01;
  authorization: VNextSemanticCommitAuthorizationResultV01;
} {
  const preview = prepareVNextSemanticCommitPreviewV01(input.db, {
    workspace_id: WORKSPACE_ID,
    project_id: PROJECT_ID,
    proposal_id: input.proposal.proposal_id,
    proposal_fingerprint: input.proposal.integrity.fingerprint,
    decision_id: input.decision.decision_id,
    decision_fingerprint: input.decision.integrity.fingerprint,
    authorized_applier_identity: {
      ref_type: "semantic_transition_applier",
      external_id: `local-core-applier:gate-history:${input.applierSuffix}`,
    },
    gate_ttl_ms: input.gateTtlMs,
    clock: fixedClockV01(
      cycleTimestampV01(input.cycle, 1),
      cycleTimestampV01(input.cycle, 2),
    ),
  });
  const authorization = recordVNextSemanticCommitAuthorizationV01(input.db, {
    preview,
    confirmation_digest: preview.confirmation_digest,
    operator_actor_ref: input.decision.actor_ref,
    clock: fixedClockV01(
      cycleTimestampV01(input.cycle, 3),
      cycleTimestampV01(input.cycle, 4),
      cycleTimestampV01(input.cycle, 5),
    ),
  });
  assert.equal(authorization.status, "inserted");
  assert.equal(authorization.eligibility.status, "eligible");
  return { preview, authorization };
}

function createReviewedClaimLifecycleV01(input: {
  db: Database.Database;
  familySeed: string;
  proposition: string;
  cycle: number;
  decision?: ReviewDecisionV01["decision"];
}): {
  claim: ClaimRecordV01;
  proposal: EpisodeDeltaProposalV01;
  decision: ReviewDecisionV01;
} {
  const claim = claimV01({
    revision: 1,
    prior: null,
    operation: "create",
    proposition: input.proposition,
    familySeed: input.familySeed,
  });
  admitClaimRecordV01(input.db, {
    workspace_id: WORKSPACE_ID,
    project_id: PROJECT_ID,
    claim,
  });
  const material = materializeProjectVerifyClaimLifecycleProposalV01(
    input.db,
    {
      workspace_id: WORKSPACE_ID,
      project_id: PROJECT_ID,
      claim_id: claim.claim_id,
    },
  );
  admitProjectVerifyLifecycleProposalV01(input.db, material);
  const decision = decisionV01({
    proposal: material.proposal,
    decision: input.decision,
    priorDecision: null,
    cycle: input.cycle,
  });
  persistVNextSemanticReviewMaterialV01(input.db, {
    proposal: material.proposal,
    decision,
  });
  return { claim, proposal: material.proposal, decision };
}

function assertTransitionReadSessionBoundaryV01(
  db: Database.Database,
  applied: AppliedLifecycleV01,
): void {
  const loadTransition =
    createValidatedVNextSemanticTransitionRelationReadSessionV01(db, {
      workspace_id: WORKSPACE_ID,
      project_id: PROJECT_ID,
    });
  const source = {
    transition_receipt_id:
      applied.commit.transition_receipt.transition_receipt_id,
    transition_receipt_fingerprint:
      applied.commit.transition_receipt.integrity.fingerprint,
  };
  const first = loadTransition(source);
  assert.deepEqual(first.receipt, applied.commit.transition_receipt);
  const persistedState = assertPresentV01(applied.commit.semantic_state);
  assert.deepEqual(
    assertProjectVerifyLifecyclePersistedStateSourceBoundWithReadSessionV01(
      db,
      {
        state: persistedState,
        ...source,
      },
      loadTransition,
    ).receipt,
    applied.commit.transition_receipt,
    "the read-session state validator preserves exact source authentication",
  );
  const fakeReadSession = (_input: typeof source) => structuredClone(first);
  assert.throws(
    () =>
      assertProjectVerifyLifecyclePersistedStateSourceBoundWithReadSessionV01(
        db,
        { state: persistedState, ...source },
        fakeReadSession,
      ),
    /persisted_project_verify_lifecycle_read_session_invalid/,
    "an arbitrary callable cannot forge a source-authenticated read session",
  );
  const crossScopeState = structuredClone(persistedState);
  crossScopeState.project_id = OTHER_PROJECT_ID;
  assert.throws(
    () =>
      assertProjectVerifyLifecyclePersistedStateSourceBoundWithReadSessionV01(
        db,
        { state: crossScopeState, ...source },
        loadTransition,
      ),
    /persisted_project_verify_lifecycle_read_session_scope_mismatch/,
    "a creator-issued session cannot authenticate a state from another scope",
  );
  const otherDb = new Database(":memory:");
  try {
    ensureVNextDurableSemanticStoreSchemaV01(otherDb);
    const otherDatabaseSession =
      createValidatedVNextSemanticTransitionRelationReadSessionV01(otherDb, {
        workspace_id: WORKSPACE_ID,
        project_id: PROJECT_ID,
      });
    assert.throws(
      () =>
        assertProjectVerifyLifecyclePersistedStateSourceBoundWithReadSessionV01(
          db,
          { state: persistedState, ...source },
          otherDatabaseSession,
        ),
      /persisted_project_verify_lifecycle_read_session_scope_mismatch/,
      "a same-scope session issued for another database cannot be reused",
    );
  } finally {
    otherDb.close();
  }
  const changedState = structuredClone(persistedState);
  changedState.source_candidate_id = "forged-read-session-candidate";
  assert.throws(
    () =>
      assertProjectVerifyLifecyclePersistedStateSourceBoundWithReadSessionV01(
        db,
        { state: changedState, ...source },
        loadTransition,
      ),
    /persisted_project_verify_lifecycle_source_conflict/,
    "a successful Transition cache hit cannot authenticate changed persisted-state source material",
  );
  first.receipt.recorded_at = "2000-01-01T00:00:00.000Z";
  assert.deepEqual(
    loadTransition(source).receipt,
    applied.commit.transition_receipt,
    "a caller-local mutation cannot alter the cached Transition source",
  );

  const wrongFingerprint = `sha256:${"f".repeat(64)}`;
  assert.notEqual(wrongFingerprint, source.transition_receipt_fingerprint);
  assert.throws(
    () =>
      assertProjectVerifyLifecyclePersistedStateSourceBoundWithReadSessionV01(
        db,
        {
          state: persistedState,
          ...source,
          transition_receipt_fingerprint: wrongFingerprint,
        },
        loadTransition,
      ),
    /persisted_transition_receipt_fingerprint_mismatch/,
    "the state helper cannot reuse a successful cache entry under a changed receipt fingerprint",
  );
  assert.throws(
    () =>
      loadTransition({
        ...source,
        transition_receipt_fingerprint: wrongFingerprint,
      }),
    /persisted_transition_receipt_fingerprint_mismatch/,
    "a successful cache hit cannot authenticate the same receipt ID under a changed fingerprint",
  );
}

function assertCurrentBindingV01(input: {
  db: Database.Database;
  proposal: EpisodeDeltaProposalV01;
  expectedRevision: number;
  expectedPresence?: "absent" | "present";
}): void {
  const binding = assertPresentV01(
    input.proposal.project_verify_lifecycle,
  ).lifecycle_binding;
  const targetKey = deriveVNextSemanticTargetKeyV01(binding.family_target_ref);
  const head = assertPresentV01(
    readVNextSemanticTargetHeadV01(input.db, {
      workspace_id: WORKSPACE_ID,
      project_id: PROJECT_ID,
      target_key: targetKey,
    }),
  );
  assert.equal(head.revision, input.expectedRevision);
  const expectedPresence = input.expectedPresence ?? "present";
  assert.equal(head.presence, expectedPresence);
  const projection = readVNextSemanticStateEntryV01(input.db, {
    workspace_id: WORKSPACE_ID,
    project_id: PROJECT_ID,
    target_key: targetKey,
  });
  if (expectedPresence === "absent") {
    assert.equal(projection, null);
    return;
  }
  const exactProjection = assertPresentV01(projection);
  const envelope = assertPresentV01(
    readVNextCoreRecordV01(input.db, {
      record_kind: "semantic_state",
      record_id: exactProjection.state_ref.external_id,
      workspace_id: WORKSPACE_ID,
      project_id: PROJECT_ID,
    }),
  );
  const state = rebuildVNextPersistedSemanticStateV01(envelope.payload);
  assert.equal(
    state.state_content_fingerprint,
    exactProjection.state_fingerprint,
  );
  assert.deepEqual(
    state.state_content.project_verify_lifecycle_binding,
    binding,
  );
  assert.deepEqual(
    state.state_content.project_verify_lifecycle_binding?.selected_record_ref,
    binding.selected_record_ref,
  );
}

function assertClaimLifecycleV01(): void {
  const db = new Database(":memory:");
  try {
    ensureVNextDurableSemanticStoreSchemaV01(db);
    const claim1 = claimV01({
      revision: 1,
      prior: null,
      operation: "create",
      proposition: "The exact bounded property holds.",
      familySeed: "claim-lifecycle",
    });
    const claim2 = claimV01({
      revision: 2,
      prior: claim1,
      operation: "revise",
      proposition: claim1.proposition,
      familySeed: "claim-lifecycle",
    });
    const claim3 = claimV01({
      revision: 3,
      prior: claim2,
      operation: "supersede",
      proposition:
        "A later immutable candidate supersedes the prior proposition.",
      familySeed: "claim-lifecycle",
    });
    const claim4 = claimV01({
      revision: 4,
      prior: claim3,
      operation: "retract",
      proposition: claim3.proposition,
      familySeed: "claim-lifecycle",
    });
    for (const claim of [claim1, claim2, claim3, claim4]) {
      assert.equal(
        admitClaimRecordV01(db, {
          workspace_id: WORKSPACE_ID,
          project_id: PROJECT_ID,
          claim,
        }).status,
        "inserted",
      );
    }

    assert.throws(
      () =>
        materializeProjectVerifyClaimLifecycleProposalCoreV01(db, {
          workspace_id: WORKSPACE_ID,
          project_id: PROJECT_ID,
          claim_id: claim1.claim_id,
          observed_at: BASE_AT,
        }),
      /project_verify_lifecycle_observation_predates_(selected_record|source)/,
    );

    const createMaterial = materializeProjectVerifyClaimLifecycleProposalV01(
      db,
      {
        workspace_id: WORKSPACE_ID,
        project_id: PROJECT_ID,
        claim_id: claim1.claim_id,
      },
    );
    assert.equal(
      admitProjectVerifyLifecycleProposalV01(db, createMaterial).status,
      "inserted",
    );
    assert.equal(
      admitProjectVerifyLifecycleProposalV01(db, createMaterial).status,
      "exact_replay",
    );
    assert.equal(
      assertPersistedProjectVerifyLifecycleProposalSourceBoundV01(
        db,
        createMaterial.proposal,
      ).selected_record.integrity.fingerprint,
      claim1.integrity.fingerprint,
    );
    const noState = stateCountSnapshotV01(db);
    for (const [index, decisionValue] of (
      ["reject", "defer"] as const
    ).entries()) {
      const decision = decisionV01({
        proposal: createMaterial.proposal,
        decision: decisionValue,
        priorDecision: null,
        cycle: index + 1,
      });
      persistVNextSemanticReviewMaterialV01(db, {
        proposal: createMaterial.proposal,
        decision,
      });
      assert.deepEqual(stateCountSnapshotV01(db), noState);
    }
    assert.throws(
      () =>
        materializeProjectVerifyClaimLifecycleProposalV01(db, {
          workspace_id: WORKSPACE_ID,
          project_id: OTHER_PROJECT_ID,
          claim_id: claim1.claim_id,
        }),
      (error: unknown) =>
        error instanceof ProjectVerifyLifecycleAdmissionErrorV01,
    );
    assert.throws(
      () =>
        materializeProjectVerifyClaimLifecycleProposalV01(db, {
          workspace_id: WORKSPACE_ID,
          project_id: PROJECT_ID,
          claim_id: claim2.claim_id,
        }),
      /head_expectation_conflict/,
      "revision two cannot be proposed before revision one is applied",
    );

    const createApplied = applyLifecycleV01({
      db,
      proposal: createMaterial.proposal,
      cycle: 10,
    });
    assertTransitionReadSessionBoundaryV01(db, createApplied);
    assertCurrentBindingV01({
      db,
      proposal: createMaterial.proposal,
      expectedRevision: 1,
    });
    assert.equal(claim1.lifecycle.application_status, "not_applied");
    assert.equal(claim1.lifecycle.truth_status, "not_established");

    assert.throws(
      () =>
        materializeProjectVerifyClaimLifecycleProposalV01(db, {
          workspace_id: WORKSPACE_ID,
          project_id: PROJECT_ID,
          claim_id: claim3.claim_id,
        }),
      /head_expectation_conflict/,
      "an unapplied intermediate revision cannot be skipped",
    );

    assert.throws(
      () =>
        materializeProjectVerifyClaimLifecycleProposalCoreV01(db, {
          workspace_id: WORKSPACE_ID,
          project_id: PROJECT_ID,
          claim_id: claim2.claim_id,
          observed_at: cycleTimestampV01(1, 0),
        }),
      /project_verify_lifecycle_observation_predates_source/,
      "a head observation cannot predate the exact Transition that created the head",
    );

    const reviseMaterial = materializeProjectVerifyClaimLifecycleProposalV01(
      db,
      {
        workspace_id: WORKSPACE_ID,
        project_id: PROJECT_ID,
        claim_id: claim2.claim_id,
      },
    );
    admitProjectVerifyLifecycleProposalV01(db, reviseMaterial);
    const revised = applyLifecycleV01({
      db,
      proposal: reviseMaterial.proposal,
      priorDecision: createApplied.decision,
      cycle: 20,
    });
    assertCurrentBindingV01({
      db,
      proposal: reviseMaterial.proposal,
      expectedRevision: 2,
    });
    assert.equal(claim2.proposition, claim1.proposition);
    assert.notEqual(
      createApplied.commit.semantic_state?.state_content_fingerprint,
      revised.commit.semantic_state?.state_content_fingerprint,
      "exact selected-record fingerprint, not proposition text alone, binds state identity",
    );

    const supersedeMaterial = materializeProjectVerifyClaimLifecycleProposalV01(
      db,
      {
        workspace_id: WORKSPACE_ID,
        project_id: PROJECT_ID,
        claim_id: claim3.claim_id,
      },
    );
    admitProjectVerifyLifecycleProposalV01(db, supersedeMaterial);
    const superseded = applyLifecycleV01({
      db,
      proposal: supersedeMaterial.proposal,
      priorDecision: revised.decision,
      cycle: 30,
    });
    assertCurrentBindingV01({
      db,
      proposal: supersedeMaterial.proposal,
      expectedRevision: 3,
    });

    const retractMaterial = materializeProjectVerifyClaimLifecycleProposalV01(
      db,
      {
        workspace_id: WORKSPACE_ID,
        project_id: PROJECT_ID,
        claim_id: claim4.claim_id,
      },
    );
    admitProjectVerifyLifecycleProposalV01(db, retractMaterial);
    applyLifecycleV01({
      db,
      proposal: retractMaterial.proposal,
      priorDecision: superseded.decision,
      cycle: 40,
    });
    assertCurrentBindingV01({
      db,
      proposal: retractMaterial.proposal,
      expectedRevision: 4,
      expectedPresence: "absent",
    });
    assert.equal(
      readVNextCoreRecordV01(db, {
        record_kind: "claim_record",
        record_id: claim1.claim_id,
        workspace_id: WORKSPACE_ID,
        project_id: PROJECT_ID,
      }) !== null,
      true,
    );
    assert.throws(
      () =>
        materializeProjectVerifyClaimLifecycleProposalV01(db, {
          workspace_id: WORKSPACE_ID,
          project_id: PROJECT_ID,
          claim_id: claim1.claim_id,
        }),
      /family_already_retracted/,
      "retraction does not reactivate an older revision",
    );
    const beforeRead = fullCountSnapshotV01(db);
    const reconciliation = readProjectVerifyReconciliationV01(db, {
      workspace_id: WORKSPACE_ID,
      project_id: PROJECT_ID,
      observed_at: cycleTimestampV01(90, 0),
    });
    assert.deepEqual(fullCountSnapshotV01(db), beforeRead);
    const claimFamily = assertPresentV01(
      reconciliation.claim_families.find(
        (family) => family.claim_family_id === claim1.claim_family_id,
      ),
    );
    assert.equal(claimFamily.revisions.length, 4);
    assert.equal(claimFamily.applied_current_head_ref, null);
    assert.equal(
      claimFamily.revisions.every(
        (revision) =>
          revision.lifecycle.truth.claim_truth === "not_established" &&
          revision.lifecycle.truth.evidence_acceptance ===
            "not_established_by_reconciliation",
      ),
      true,
    );
    assert.equal(reconciliation.summary.claim_truth, "not_established");
    assert.equal(reconciliation.summary.retracted, true);
    assert.equal(reconciliation.authority.writes_database, false);
    assert.equal(reconciliation.authority.establishes_truth, false);
  } finally {
    db.close();
  }
}

function assertOperatorPilotProjectVerifyDecisionAdapterV01(): void {
  const db = new Database(":memory:");
  try {
    ensureVNextDurableSemanticStoreSchemaV01(db);
    db.exec(VNEXT_LOCAL_OPERATOR_SESSION_SCHEMA_SQL_V01);
    const config: VNextLocalOperatorPilotConfigV01 = {
      enabled: true,
      workspace_id: WORKSPACE_ID,
      project_id: PROJECT_ID,
      operator_id: "operator:r7b-project-verify-focused-proof",
      database_path: ":memory:",
    };
    const secretSource = new ProjectVerifyOperatorSecretSourceV01();
    let sessionNow = cycleTimestampV01(100, 0);
    const sessionClock = { now: () => sessionNow };
    const issued = issueVNextLocalOperatorBootstrapV01(db, {
      config,
      clock: sessionClock,
      secret_source: secretSource,
    });
    const consumed = consumeVNextLocalOperatorBootstrapV01(db, {
      config,
      bootstrap_token: issued.bootstrap_token,
      clock: sessionClock,
      secret_source: secretSource,
    });
    let credential = consumed.credential;

    const claims = [
      claimV01({
        revision: 1,
        prior: null,
        operation: "create",
        proposition: "The Workbench adapter applies an exact create decision.",
        familySeed: "operator-adapter-lifecycle",
      }),
    ];
    claims.push(
      claimV01({
        revision: 2,
        prior: claims[0]!,
        operation: "revise",
        proposition: "The Workbench adapter applies an exact revised candidate.",
        familySeed: "operator-adapter-lifecycle",
      }),
    );
    claims.push(
      claimV01({
        revision: 3,
        prior: claims[1]!,
        operation: "supersede",
        proposition: "The Workbench adapter explicitly supersedes the current head.",
        familySeed: "operator-adapter-lifecycle",
      }),
    );
    claims.push(
      claimV01({
        revision: 4,
        prior: claims[2]!,
        operation: "retract",
        proposition: claims[2]!.proposition,
        familySeed: "operator-adapter-lifecycle",
      }),
    );
    for (const claim of claims) {
      admitClaimRecordV01(db, {
        workspace_id: WORKSPACE_ID,
        project_id: PROJECT_ID,
        claim,
      });
    }

    let priorDecision: ReviewDecisionV01 | null = null;
    let lastProposal: EpisodeDeltaProposalV01 | null = null;
    for (const [index, claim] of claims.entries()) {
      const material = materializeProjectVerifyClaimLifecycleProposalV01(db, {
        workspace_id: WORKSPACE_ID,
        project_id: PROJECT_ID,
        claim_id: claim.claim_id,
      });
      admitProjectVerifyLifecycleProposalV01(db, material);
      const candidate = assertPresentV01(material.proposal.proposed_deltas[0]);
      const applying = resolveVNextOperatorPilotApplyingDecisionV01(
        material.proposal,
        candidate,
      );
      const expectedDecision =
        claim.operation_intent === "supersede"
          ? "supersede"
          : claim.operation_intent === "retract"
            ? "retract"
            : "accept";
      assert.equal(applying.decision, expectedDecision);
      sessionNow = cycleTimestampV01(110 + index * 10, 0);
      const request = {
        proposal_id: material.proposal.proposal_id,
        proposal_fingerprint: material.proposal.integrity.fingerprint,
        candidate_id: candidate.candidate_id,
        candidate_fingerprint:
          createEpisodeDeltaCandidateFingerprintV01(candidate),
        decision: expectedDecision,
        rationale_summary:
          `Record the exact ${claim.operation_intent} lifecycle decision without implying application.`,
      };
      if (expectedDecision !== "accept") {
        assert.throws(
          () =>
            recordVNextOperatorPilotReviewDecisionV01(db, {
              config,
              credential,
              request: { ...request, decision: "accept" },
              clock: sessionClock,
              secret_source: secretSource,
            }),
          /operator_pilot_decision_operation_mismatch/,
          "a canonical lifecycle proposal refuses the wrong applying decision before consuming the action nonce",
        );
      }
      const recorded = recordVNextOperatorPilotReviewDecisionV01(db, {
        config,
        credential,
        request,
        clock: sessionClock,
        secret_source: secretSource,
      });
      assert.equal(recorded.status, "inserted");
      assert.equal(recorded.decision.decision, expectedDecision);
      assert.equal(
        recorded.decision.requested_transition_intent?.transition_kind,
        applying.transition_kind,
      );
      assert.deepEqual(
        recorded.decision.lineage.prior_decisions,
        priorDecision
          ? [
              {
                decision_id: priorDecision.decision_id,
                decision_fingerprint: priorDecision.integrity.fingerprint,
              },
            ]
          : [],
      );
      assert.deepEqual(
        recorded.decision.lineage.superseding_candidate,
        expectedDecision === "supersede"
          ? {
              candidate_id: candidate.candidate_id,
              candidate_fingerprint:
                createEpisodeDeltaCandidateFingerprintV01(candidate),
            }
          : null,
      );
      assert.deepEqual(
        recorded.decision.lineage.retracted_decision,
        expectedDecision === "retract" && priorDecision
          ? {
              decision_id: priorDecision.decision_id,
              decision_fingerprint: priorDecision.integrity.fingerprint,
            }
          : null,
      );
      credential = credentialFromCookieV01(recorded.session_cookie.value);
      if (index === 0) {
        const replay = recordVNextOperatorPilotReviewDecisionV01(db, {
          config,
          credential,
          request,
          clock: sessionClock,
          secret_source: secretSource,
        });
        assert.equal(replay.status, "exact_replay");
        assert.equal(replay.decision.decision_id, recorded.decision.decision_id);
        credential = credentialFromCookieV01(replay.session_cookie.value);
      }
      const commit = commitRecordedLifecycleDecisionV01({
        db,
        proposal: material.proposal,
        decision: recorded.decision,
        cycle: 110 + index * 10,
      });
      assert.equal(commit.status, "applied");
      priorDecision = recorded.decision;
      lastProposal = material.proposal;
    }

    assertCurrentBindingV01({
      db,
      proposal: assertPresentV01(lastProposal),
      expectedRevision: 4,
      expectedPresence: "absent",
    });
    assert.equal(
      claims.every(
        (claim) =>
          readVNextCoreRecordV01(db, {
            record_kind: "claim_record",
            record_id: claim.claim_id,
            workspace_id: WORKSPACE_ID,
            project_id: PROJECT_ID,
          }) !== null,
      ),
      true,
      "retraction preserves immutable Claim history",
    );
  } finally {
    db.close();
  }
}

function assertRelationLifecycleV01(): void {
  const db = new Database(":memory:");
  try {
    ensureVNextDurableSemanticStoreSchemaV01(db);
    const evidence = evidenceV01({ identityKey: "relation-evidence" });
    const claim = claimV01({
      revision: 1,
      prior: null,
      operation: "create",
      proposition: "A relation endpoint Claim remains only candidate material.",
      familySeed: "relation-endpoint-claim",
    });
    admitEvidenceRecordV01(db, {
      workspace_id: WORKSPACE_ID,
      project_id: PROJECT_ID,
      evidence,
    });
    admitClaimRecordV01(db, {
      workspace_id: WORKSPACE_ID,
      project_id: PROJECT_ID,
      claim,
    });
    const relation1 = relationV01({
      revision: 1,
      prior: null,
      operation: "create",
      familySeed: "relation-lifecycle",
      claim,
      evidence,
      kind: "supports",
    });
    const relation2 = relationV01({
      revision: 2,
      prior: relation1,
      operation: "revise",
      familySeed: "relation-lifecycle",
      claim,
      evidence,
      kind: "qualifies",
    });
    const relation3 = relationV01({
      revision: 3,
      prior: relation2,
      operation: "supersede",
      familySeed: "relation-lifecycle",
      claim,
      evidence,
      kind: "contradicts",
    });
    const relation4 = relationV01({
      revision: 4,
      prior: relation3,
      operation: "retract",
      familySeed: "relation-lifecycle",
      claim,
      evidence,
      kind: relation3.relation_kind,
    });
    for (const relation of [relation1, relation2, relation3, relation4]) {
      assert.equal(
        admitClaimEvidenceRelationV01(db, {
          workspace_id: WORKSPACE_ID,
          project_id: PROJECT_ID,
          relation,
        }).status,
        "inserted",
      );
    }

    let priorDecision: ReviewDecisionV01 | null = null;
    let cycle = 50;
    for (const [index, relation] of [
      relation1,
      relation2,
      relation3,
      relation4,
    ].entries()) {
      const material = materializeProjectVerifyRelationLifecycleProposalV01(
        db,
        {
          workspace_id: WORKSPACE_ID,
          project_id: PROJECT_ID,
          relation_id: relation.relation_id,
        },
      );
      admitProjectVerifyLifecycleProposalV01(db, material);
      const applied = applyLifecycleV01({
        db,
        proposal: material.proposal,
        priorDecision,
        cycle,
      });
      priorDecision = applied.decision;
      assertCurrentBindingV01({
        db,
        proposal: material.proposal,
        expectedRevision: index + 1,
        expectedPresence:
          relation.operation_intent === "retract" ? "absent" : "present",
      });
      cycle += 10;
    }
    assert.equal(claim.lifecycle.truth_status, "not_established");
    assert.equal(relation1.lifecycle.relation_status, "not_established");
    assert.equal(
      readVNextSemanticTargetHeadV01(db, {
        workspace_id: WORKSPACE_ID,
        project_id: PROJECT_ID,
        target_key: deriveVNextSemanticTargetKeyV01(
          assertPresentV01(
            materializeProjectVerifyClaimLifecycleProposalV01(db, {
              workspace_id: WORKSPACE_ID,
              project_id: PROJECT_ID,
              claim_id: claim.claim_id,
            }).proposal.project_verify_lifecycle,
          ).lifecycle_binding.family_target_ref,
        ),
      }),
      null,
      "applying a relation does not implicitly apply its Claim endpoint",
    );
    const beforeRead = fullCountSnapshotV01(db);
    const reconciliation = readProjectVerifyReconciliationV01(db, {
      workspace_id: WORKSPACE_ID,
      project_id: PROJECT_ID,
      observed_at: cycleTimestampV01(95, 0),
    });
    assert.deepEqual(fullCountSnapshotV01(db), beforeRead);
    const relationFamily = assertPresentV01(
      reconciliation.relation_families.find(
        (family) => family.relation_family_id === relation1.relation_family_id,
      ),
    );
    assert.equal(relationFamily.revisions.length, 4);
    assert.equal(relationFamily.applied_current_head_ref, null);
    assert.equal(
      relationFamily.revisions.every(
        (revision) => revision.lifecycle.truth.relation_is_proof === false,
      ),
      true,
    );
    assert.equal(reconciliation.summary.no_applied_relation, true);
    assert.equal(reconciliation.summary.retracted, true);
  } finally {
    db.close();
  }
}

function assertIndependentRelationMaterialCoexistenceV01(): void {
  const db = new Database(":memory:");
  try {
    ensureVNextDurableSemanticStoreSchemaV01(db);
    const claim = claimV01({
      revision: 1,
      prior: null,
      operation: "create",
      proposition:
        "Independent exact relation families may coexist without deciding Claim truth.",
      familySeed: "coexisting-relation-endpoint",
    });
    admitClaimRecordV01(db, {
      workspace_id: WORKSPACE_ID,
      project_id: PROJECT_ID,
      claim,
    });

    const appliedKinds = [
      "supports",
      "opposes",
      "contradicts",
      "qualifies",
      "insufficient",
    ] as const satisfies readonly ClaimEvidenceRelationKindV01[];
    const appliedRelations: ClaimEvidenceRelationV01[] = [];
    for (const [index, kind] of appliedKinds.entries()) {
      const evidence = evidenceV01({
        identityKey: `coexisting-${kind}`,
      });
      admitEvidenceRecordV01(db, {
        workspace_id: WORKSPACE_ID,
        project_id: PROJECT_ID,
        evidence,
      });
      const relation = relationV01({
        revision: 1,
        prior: null,
        operation: "create",
        familySeed: `coexisting-${kind}`,
        claim,
        evidence,
        kind,
      });
      admitClaimEvidenceRelationV01(db, {
        workspace_id: WORKSPACE_ID,
        project_id: PROJECT_ID,
        relation,
      });
      const material = materializeProjectVerifyRelationLifecycleProposalV01(
        db,
        {
          workspace_id: WORKSPACE_ID,
          project_id: PROJECT_ID,
          relation_id: relation.relation_id,
        },
      );
      admitProjectVerifyLifecycleProposalV01(db, material);
      applyLifecycleV01({
        db,
        proposal: material.proposal,
        cycle: 500 + index * 10,
      });
      appliedRelations.push(relation);
    }

    const pendingKinds = ["supports", "insufficient"] as const;
    const pendingRelations: ClaimEvidenceRelationV01[] = [];
    for (const kind of pendingKinds) {
      const evidence = evidenceV01({
        identityKey: `pending-${kind}`,
      });
      admitEvidenceRecordV01(db, {
        workspace_id: WORKSPACE_ID,
        project_id: PROJECT_ID,
        evidence,
      });
      const relation = relationV01({
        revision: 1,
        prior: null,
        operation: "create",
        familySeed: `pending-${kind}`,
        claim,
        evidence,
        kind,
      });
      admitClaimEvidenceRelationV01(db, {
        workspace_id: WORKSPACE_ID,
        project_id: PROJECT_ID,
        relation,
      });
      pendingRelations.push(relation);
    }

    const beforeRead = fullCountSnapshotV01(db);
    const reconciliation = readProjectVerifyReconciliationV01(db, {
      workspace_id: WORKSPACE_ID,
      project_id: PROJECT_ID,
      observed_at: cycleTimestampV01(560, 0),
    });
    assert.deepEqual(fullCountSnapshotV01(db), beforeRead);
    for (const kind of appliedKinds) {
      assert.equal(
        reconciliation.applied_relation_material[kind].length,
        1,
        `one independently applied ${kind} family remains visible`,
      );
    }
    for (const kind of pendingKinds) {
      assert.equal(
        reconciliation.pending_relation_material[kind].length,
        1,
        `pending ${kind} remains separate from applied material`,
      );
    }
    assert.equal(reconciliation.summary.support_present, true);
    assert.equal(reconciliation.summary.opposition_present, true);
    assert.equal(reconciliation.summary.contradiction_present, true);
    assert.equal(reconciliation.summary.qualification_present, true);
    assert.equal(reconciliation.summary.insufficient_material_present, true);
    assert.equal(
      reconciliation.summary.mixed_or_disputed_material_present,
      true,
    );
    assert.equal(reconciliation.summary.claim_truth, "not_established");
    assert.equal(
      reconciliation.relation_families
        .filter((family) =>
          appliedRelations.some(
            (relation) =>
              relation.relation_family_id === family.relation_family_id,
          ),
        )
        .every((family) => family.applied_current_head_ref !== null),
      true,
    );
    assert.equal(
      reconciliation.relation_families
        .filter((family) =>
          pendingRelations.some(
            (relation) =>
              relation.relation_family_id === family.relation_family_id,
          ),
        )
        .every(
          (family) =>
            family.applied_current_head_ref === null &&
            family.pending_revision_refs.length === 1,
        ),
      true,
    );
    assert.equal(
      reconciliation.relation_families.every((family) =>
        family.revisions.every(
          (revision) => revision.lifecycle.truth.relation_is_proof === false,
        ),
      ),
      true,
    );
  } finally {
    db.close();
  }
}

function assertApplicabilityGroupingV01(): void {
  const exactDb = new Database(":memory:");
  try {
    ensureVNextDurableSemanticStoreSchemaV01(exactDb);
    const exactScope = createClaimApplicabilityScopeV01({
      subject_refs: [subjectRef],
      environment_refs: [refV01("environment", "environment:exact-overlap")],
      temporal_scope: {
        kind: "interval",
        valid_from: "2026-07-20T00:00:00.000Z",
        valid_until: "2026-07-21T00:00:00.000Z",
      },
      condition: {
        kind: "constant",
        value: "applicable",
        context_refs: [],
      },
    });
    const exactClaims = ["left", "right"].map((side) =>
      claimV01({
        revision: 1,
        prior: null,
        operation: "create",
        proposition: `The exact-overlap ${side} candidate remains independent.`,
        familySeed: `applicability-exact-${side}`,
        applicabilityScope: exactScope,
      }),
    );
    for (const [index, claim] of exactClaims.entries()) {
      admitClaimRecordV01(exactDb, {
        workspace_id: WORKSPACE_ID,
        project_id: PROJECT_ID,
        claim,
      });
      const material = materializeProjectVerifyClaimLifecycleProposalV01(
        exactDb,
        {
          workspace_id: WORKSPACE_ID,
          project_id: PROJECT_ID,
          claim_id: claim.claim_id,
        },
      );
      admitProjectVerifyLifecycleProposalV01(exactDb, material);
      applyLifecycleV01({
        db: exactDb,
        proposal: material.proposal,
        cycle: 600 + index * 10,
      });
    }
    const reconciliation = readProjectVerifyReconciliationV01(exactDb, {
      workspace_id: WORKSPACE_ID,
      project_id: PROJECT_ID,
      observed_at: cycleTimestampV01(630, 0),
    });
    const group = assertPresentV01(reconciliation.applicability_groups[0]);
    assert.equal(reconciliation.applicability_groups.length, 1);
    assert.equal(group.claim_family_ids.length, 2);
    assert.equal(group.disposition, "coexisting");
    assert.equal(group.pairwise_scope_comparisons.length, 1);
    assert.equal(
      group.pairwise_scope_comparisons[0]?.comparison.status,
      "overlap",
    );
    assert.equal(
      group.pairwise_scope_comparisons[0]?.comparison.basis,
      "exact_scope_fingerprint",
    );
    assert.equal(
      reconciliation.claim_families.filter(
        (family) => family.applied_current_head_ref !== null,
      ).length,
      2,
      "exact overlap preserves both family heads and selects no global winner",
    );
  } finally {
    exactDb.close();
  }

  const unknownDb = new Database(":memory:");
  try {
    ensureVNextDurableSemanticStoreSchemaV01(unknownDb);
    const unknownScopes = ["host-a", "host-b"].map((environment) =>
      createClaimApplicabilityScopeV01({
        subject_refs: [subjectRef],
        environment_refs: [refV01("environment", `environment:${environment}`)],
        condition: {
          kind: "constant",
          value: "applicable",
          context_refs: [],
        },
      }),
    );
    const unknownClaims = unknownScopes.map((scope, index) =>
      claimV01({
        revision: 1,
        prior: null,
        operation: "create",
        proposition: `Environment-specific candidate ${index + 1}.`,
        familySeed: `applicability-unknown-${index + 1}`,
        applicabilityScope: scope,
      }),
    );
    for (const [index, claim] of unknownClaims.entries()) {
      admitClaimRecordV01(unknownDb, {
        workspace_id: WORKSPACE_ID,
        project_id: PROJECT_ID,
        claim,
      });
      const material = materializeProjectVerifyClaimLifecycleProposalV01(
        unknownDb,
        {
          workspace_id: WORKSPACE_ID,
          project_id: PROJECT_ID,
          claim_id: claim.claim_id,
        },
      );
      admitProjectVerifyLifecycleProposalV01(unknownDb, material);
      applyLifecycleV01({
        db: unknownDb,
        proposal: material.proposal,
        cycle: 640 + index * 10,
      });
    }
    const unknownOpposingEvidence = evidenceV01({
      identityKey: "applicability-unknown-opposition",
    });
    admitEvidenceRecordV01(unknownDb, {
      workspace_id: WORKSPACE_ID,
      project_id: PROJECT_ID,
      evidence: unknownOpposingEvidence,
    });
    const unknownOpposingRelation = relationV01({
      revision: 1,
      prior: null,
      operation: "create",
      familySeed: "applicability-unknown-opposition",
      claim: unknownClaims[0]!,
      evidence: unknownOpposingEvidence,
      kind: "opposes",
    });
    admitClaimEvidenceRelationV01(unknownDb, {
      workspace_id: WORKSPACE_ID,
      project_id: PROJECT_ID,
      relation: unknownOpposingRelation,
    });
    const unknownRelationProposal =
      materializeProjectVerifyRelationLifecycleProposalV01(unknownDb, {
        workspace_id: WORKSPACE_ID,
        project_id: PROJECT_ID,
        relation_id: unknownOpposingRelation.relation_id,
      });
    admitProjectVerifyLifecycleProposalV01(unknownDb, unknownRelationProposal);
    applyLifecycleV01({
      db: unknownDb,
      proposal: unknownRelationProposal.proposal,
      cycle: 665,
    });
    const reconciliation = readProjectVerifyReconciliationV01(unknownDb, {
      workspace_id: WORKSPACE_ID,
      project_id: PROJECT_ID,
      observed_at: cycleTimestampV01(670, 0),
    });
    const group = assertPresentV01(reconciliation.applicability_groups[0]);
    assert.equal(reconciliation.applicability_groups.length, 1);
    assert.equal(group.claim_family_ids.length, 2);
    assert.equal(group.disposition, "scope_overlap_unknown");
    assert.equal(group.pairwise_scope_comparisons.length, 1);
    assert.equal(
      group.pairwise_scope_comparisons[0]?.comparison.status,
      "unknown",
    );
    assert.equal(
      group.pairwise_scope_comparisons[0]?.comparison.basis,
      "environment_identity_unknown",
    );
    assert.equal(
      reconciliation.claim_families.filter(
        (family) => family.applied_current_head_ref !== null,
      ).length,
      2,
    );
    assert.equal(group.applied_relation_material.length, 1);
    assert.equal(group.applied_relation_material[0]?.relation_kind, "opposes");
  } finally {
    unknownDb.close();
  }

  const supersededEndpointDb = new Database(":memory:");
  try {
    ensureVNextDurableSemanticStoreSchemaV01(supersededEndpointDb);
    const claim1 = claimV01({
      revision: 1,
      prior: null,
      operation: "create",
      proposition: "The first applied revision has exact opposing material.",
      familySeed: "applicability-superseded-endpoint",
    });
    const claim2 = claimV01({
      revision: 2,
      prior: claim1,
      operation: "revise",
      proposition:
        "The current revision remains distinct from its superseded endpoint.",
      familySeed: "applicability-superseded-endpoint",
    });
    for (const claim of [claim1, claim2]) {
      admitClaimRecordV01(supersededEndpointDb, {
        workspace_id: WORKSPACE_ID,
        project_id: PROJECT_ID,
        claim,
      });
    }
    const claim1Proposal = materializeProjectVerifyClaimLifecycleProposalV01(
      supersededEndpointDb,
      {
        workspace_id: WORKSPACE_ID,
        project_id: PROJECT_ID,
        claim_id: claim1.claim_id,
      },
    );
    admitProjectVerifyLifecycleProposalV01(
      supersededEndpointDb,
      claim1Proposal,
    );
    const claim1Applied = applyLifecycleV01({
      db: supersededEndpointDb,
      proposal: claim1Proposal.proposal,
      cycle: 680,
    });

    const opposingEvidence = evidenceV01({
      identityKey: "applicability-superseded-endpoint-opposition",
    });
    admitEvidenceRecordV01(supersededEndpointDb, {
      workspace_id: WORKSPACE_ID,
      project_id: PROJECT_ID,
      evidence: opposingEvidence,
    });
    const opposingRelation = relationV01({
      revision: 1,
      prior: null,
      operation: "create",
      familySeed: "applicability-superseded-endpoint-opposition",
      claim: claim1,
      evidence: opposingEvidence,
      kind: "opposes",
    });
    admitClaimEvidenceRelationV01(supersededEndpointDb, {
      workspace_id: WORKSPACE_ID,
      project_id: PROJECT_ID,
      relation: opposingRelation,
    });
    const relationProposal =
      materializeProjectVerifyRelationLifecycleProposalV01(
        supersededEndpointDb,
        {
          workspace_id: WORKSPACE_ID,
          project_id: PROJECT_ID,
          relation_id: opposingRelation.relation_id,
        },
      );
    admitProjectVerifyLifecycleProposalV01(
      supersededEndpointDb,
      relationProposal,
    );
    applyLifecycleV01({
      db: supersededEndpointDb,
      proposal: relationProposal.proposal,
      cycle: 690,
    });

    const claim2Proposal = materializeProjectVerifyClaimLifecycleProposalV01(
      supersededEndpointDb,
      {
        workspace_id: WORKSPACE_ID,
        project_id: PROJECT_ID,
        claim_id: claim2.claim_id,
      },
    );
    admitProjectVerifyLifecycleProposalV01(
      supersededEndpointDb,
      claim2Proposal,
    );
    applyLifecycleV01({
      db: supersededEndpointDb,
      proposal: claim2Proposal.proposal,
      priorDecision: claim1Applied.decision,
      cycle: 700,
    });

    const reconciliation = readProjectVerifyReconciliationV01(
      supersededEndpointDb,
      {
        workspace_id: WORKSPACE_ID,
        project_id: PROJECT_ID,
        observed_at: cycleTimestampV01(710, 0),
      },
    );
    const group = assertPresentV01(reconciliation.applicability_groups[0]);
    assert.equal(group.disposition, "coexisting");
    assert.equal(group.applied_relation_material.length, 0);
    assert.equal(
      reconciliation.applied_relation_material.opposes.some(
        (ref) => ref.record_id === opposingRelation.relation_id,
      ),
      true,
      "historical endpoint opposition remains visible without disputing the current revision",
    );
  } finally {
    supersededEndpointDb.close();
  }

  const disjointDb = new Database(":memory:");
  try {
    ensureVNextDurableSemanticStoreSchemaV01(disjointDb);
    const disjointScopes = [
      ["2026-08-01T00:00:00.000Z", "2026-08-02T00:00:00.000Z"],
      ["2026-08-03T00:00:00.000Z", "2026-08-04T00:00:00.000Z"],
    ].map(([validFrom, validUntil]) =>
      createClaimApplicabilityScopeV01({
        subject_refs: [subjectRef],
        environment_refs: structuredClone(applicability.environment_refs),
        temporal_scope: {
          kind: "interval",
          valid_from: validFrom!,
          valid_until: validUntil!,
        },
        condition: structuredClone(applicability.condition),
      }),
    );
    const disjointClaims = disjointScopes.map((scope, index) =>
      claimV01({
        revision: 1,
        prior: null,
        operation: "create",
        proposition: `Disjoint temporal Claim ${index + 1}.`,
        familySeed: `applicability-disjoint-${index + 1}`,
        applicabilityScope: scope,
      }),
    );
    for (const [index, claim] of disjointClaims.entries()) {
      admitClaimRecordV01(disjointDb, {
        workspace_id: WORKSPACE_ID,
        project_id: PROJECT_ID,
        claim,
      });
      const material = materializeProjectVerifyClaimLifecycleProposalV01(
        disjointDb,
        {
          workspace_id: WORKSPACE_ID,
          project_id: PROJECT_ID,
          claim_id: claim.claim_id,
        },
      );
      admitProjectVerifyLifecycleProposalV01(disjointDb, material);
      applyLifecycleV01({
        db: disjointDb,
        proposal: material.proposal,
        cycle: 720 + index * 10,
      });
    }
    const disjointEvidence = evidenceV01({
      identityKey: "applicability-disjoint-opposition",
    });
    admitEvidenceRecordV01(disjointDb, {
      workspace_id: WORKSPACE_ID,
      project_id: PROJECT_ID,
      evidence: disjointEvidence,
    });
    const disjointOpposition = relationV01({
      revision: 1,
      prior: null,
      operation: "create",
      familySeed: "applicability-disjoint-opposition",
      claim: disjointClaims[0]!,
      evidence: disjointEvidence,
      kind: "opposes",
    });
    admitClaimEvidenceRelationV01(disjointDb, {
      workspace_id: WORKSPACE_ID,
      project_id: PROJECT_ID,
      relation: disjointOpposition,
    });
    const relationMaterial =
      materializeProjectVerifyRelationLifecycleProposalV01(disjointDb, {
        workspace_id: WORKSPACE_ID,
        project_id: PROJECT_ID,
        relation_id: disjointOpposition.relation_id,
      });
    admitProjectVerifyLifecycleProposalV01(disjointDb, relationMaterial);
    applyLifecycleV01({
      db: disjointDb,
      proposal: relationMaterial.proposal,
      cycle: 740,
    });
    const reconciliation = readProjectVerifyReconciliationV01(disjointDb, {
      workspace_id: WORKSPACE_ID,
      project_id: PROJECT_ID,
      observed_at: cycleTimestampV01(750, 0),
    });
    const group = assertPresentV01(reconciliation.applicability_groups[0]);
    assert.equal(
      group.pairwise_scope_comparisons[0]?.comparison.status,
      "disjoint",
    );
    assert.equal(group.applied_relation_material.length, 1);
    assert.equal(group.disposition, "coexisting");
  } finally {
    disjointDb.close();
  }

  const differentSubjectDb = new Database(":memory:");
  try {
    ensureVNextDurableSemanticStoreSchemaV01(differentSubjectDb);
    const claim = claimV01({
      revision: 1,
      prior: null,
      operation: "create",
      proposition:
        "Opposition about another exact subject must remain non-conclusive.",
      familySeed: "applicability-different-subject-claim",
    });
    admitClaimRecordV01(differentSubjectDb, {
      workspace_id: WORKSPACE_ID,
      project_id: PROJECT_ID,
      claim,
    });
    const claimProposal = materializeProjectVerifyClaimLifecycleProposalV01(
      differentSubjectDb,
      {
        workspace_id: WORKSPACE_ID,
        project_id: PROJECT_ID,
        claim_id: claim.claim_id,
      },
    );
    admitProjectVerifyLifecycleProposalV01(differentSubjectDb, claimProposal);
    applyLifecycleV01({
      db: differentSubjectDb,
      proposal: claimProposal.proposal,
      cycle: 760,
    });
    const evidence = evidenceV01({
      identityKey: "applicability-different-subject-opposition",
    });
    admitEvidenceRecordV01(differentSubjectDb, {
      workspace_id: WORKSPACE_ID,
      project_id: PROJECT_ID,
      evidence,
    });
    const differentSubjectScope = createClaimApplicabilityScopeV01({
      subject_refs: [
        refV01(
          "project_verify_subject",
          "subject:sr3-lifecycle-proof-different",
        ),
      ],
      environment_refs: structuredClone(applicability.environment_refs),
      temporal_scope: structuredClone(applicability.temporal_scope),
      condition: structuredClone(applicability.condition),
    });
    const relation = relationV01({
      revision: 1,
      prior: null,
      operation: "create",
      familySeed: "applicability-different-subject-opposition",
      claim,
      evidence,
      kind: "opposes",
      applicabilityScope: differentSubjectScope,
    });
    admitClaimEvidenceRelationV01(differentSubjectDb, {
      workspace_id: WORKSPACE_ID,
      project_id: PROJECT_ID,
      relation,
    });
    const relationProposal =
      materializeProjectVerifyRelationLifecycleProposalV01(differentSubjectDb, {
        workspace_id: WORKSPACE_ID,
        project_id: PROJECT_ID,
        relation_id: relation.relation_id,
      });
    admitProjectVerifyLifecycleProposalV01(
      differentSubjectDb,
      relationProposal,
    );
    applyLifecycleV01({
      db: differentSubjectDb,
      proposal: relationProposal.proposal,
      cycle: 770,
    });
    const reconciliation = readProjectVerifyReconciliationV01(
      differentSubjectDb,
      {
        workspace_id: WORKSPACE_ID,
        project_id: PROJECT_ID,
        observed_at: cycleTimestampV01(780, 0),
      },
    );
    const group = assertPresentV01(reconciliation.applicability_groups[0]);
    assert.equal(group.disposition, "scope_overlap_unknown");
    assert.equal(group.applied_relation_material.length, 1);
    assert.equal(
      group.applied_relation_material[0]?.relation_ref.record_id,
      relation.relation_id,
      "different-subject opposition remains visible without becoming conclusive",
    );
    assert.equal(reconciliation.summary.claim_truth, "not_established");
  } finally {
    differentSubjectDb.close();
  }
}

function assertBoundedReadIncompletenessV01(): void {
  const db = new Database(":memory:");
  try {
    ensureVNextDurableSemanticStoreSchemaV01(db);
    const allEvidence: EvidenceRecordV01[] = [];
    for (let index = 1; index <= 257; index += 1) {
      const evidence = evidenceV01({
        identityKey: `bounded-lineage-evidence-${index.toString().padStart(3, "0")}`,
      });
      admitEvidenceRecordV01(db, {
        workspace_id: WORKSPACE_ID,
        project_id: PROJECT_ID,
        evidence,
      });
      allEvidence.push(evidence);
    }
    const beforeRead = fullCountSnapshotV01(db);
    const readInput = {
      workspace_id: WORKSPACE_ID,
      project_id: PROJECT_ID,
      observed_at: cycleTimestampV01(700, 0),
    };
    const reconciliation = readProjectVerifyReconciliationV01(db, readInput);
    assert.equal(reconciliation.evidence.length, 256);
    assert.equal(reconciliation.completeness.status, "bounded_incomplete");
    assert.equal(reconciliation.completeness.continuation_cursor, null);
    assert.equal(
      reconciliation.completeness.omitted_reason,
      "project_verify_record_bound_exceeded",
    );
    assert.equal(
      reconciliation.conflicts.some(
        (conflict) =>
          conflict.conflict_kind === "bounded_read" &&
          conflict.code === "project_verify_record_bound_exceeded",
      ),
      true,
    );
    const visibleEvidenceIds = new Set(
      reconciliation.evidence.map((item) => item.evidence_ref.record_id),
    );
    const selectedEvidence = assertPresentV01(
      allEvidence.find(
        (evidence) => !visibleEvidenceIds.has(evidence.evidence_id),
      ),
    );
    const lineage = readProjectVerifyLineageV01(db, {
      ...readInput,
      lookup: {
        lookup_kind: "evidence",
        evidence_id: selectedEvidence.evidence_id,
        expected_fingerprint: selectedEvidence.integrity.fingerprint,
      },
    });
    assert.equal(lineage.completeness.status, "complete");
    assert.equal(lineage.stop.reason, "source_missing");
    assert.equal(
      lineage.nodes.some(
        (node) =>
          node.node_kind === "evidence_record" &&
          node.record_id === selectedEvidence.evidence_id &&
          node.record_fingerprint === selectedEvidence.integrity.fingerprint,
      ),
      true,
      "an exact older root is direct-read even when the project projection is bounded",
    );
    assert.equal(lineage.completeness.continuation_cursor, null);
    assert.equal(lineage.completeness.omitted_reason, null);
    assert.deepEqual(fullCountSnapshotV01(db), beforeRead);
  } finally {
    db.close();
  }
}

function assertFocusedAggregateExpansionBoundV01(): void {
  const db = new Database(":memory:");
  try {
    ensureVNextDurableSemanticStoreSchemaV01(db);
    const focusedEvidence = evidenceV01({
      identityKey: "focused-aggregate-expansion-root",
    });
    admitEvidenceRecordV01(db, {
      workspace_id: WORKSPACE_ID,
      project_id: PROJECT_ID,
      evidence: focusedEvidence,
    });

    // Two complete Claim families expand to 257 revisions. The 256-revision
    // family is deliberately related first, so the focused reader must retain
    // that complete lineage, omit the later one-record family, preserve the
    // exact Evidence root, and report aggregate incompleteness. Direct generic
    // envelope insertion keeps this fixture about read validation; the reader
    // still validates every material fingerprint, endpoint, and prior link.
    const completeFamily: ClaimRecordV01[] = [];
    let prior: ClaimRecordV01 | null = null;
    for (let revision = 1; revision <= 256; revision += 1) {
      const claim = claimV01({
        revision,
        prior,
        operation: revision === 1 ? "create" : "revise",
        proposition: `Focused aggregate complete-family revision ${revision}.`,
        familySeed: "focused-aggregate-complete-family",
      });
      completeFamily.push(claim);
      prior = claim;
    }
    const omittedFamily = claimV01({
      revision: 1,
      prior: null,
      operation: "create",
      proposition: "Focused aggregate omitted one-record family.",
      familySeed: "focused-aggregate-omitted-family",
    });
    for (const claim of [...completeFamily, omittedFamily]) {
      assert.equal(
        insertVNextCoreRecordV01(db, {
          record_kind: "claim_record",
          record_id: claim.claim_id,
          workspace_id: WORKSPACE_ID,
          project_id: PROJECT_ID,
          fingerprint: claim.integrity.fingerprint,
          idempotency_key: claim.idempotency_key,
          payload: claim,
          created_at: claim.created_at,
        }).status,
        "inserted",
      );
    }
    const relations = [
      relationV01({
        revision: 1,
        prior: null,
        operation: "create",
        familySeed: "focused-aggregate-complete-relation",
        claim: assertPresentV01(completeFamily.at(-1)),
        evidence: focusedEvidence,
        kind: "insufficient",
        createdAt: timestampV01(300, 2),
      }),
      relationV01({
        revision: 1,
        prior: null,
        operation: "create",
        familySeed: "focused-aggregate-omitted-relation",
        claim: omittedFamily,
        evidence: focusedEvidence,
        kind: "insufficient",
        createdAt: timestampV01(299, 2),
      }),
    ];
    for (const relation of relations) {
      assert.equal(
        insertVNextCoreRecordV01(db, {
          record_kind: "claim_evidence_relation",
          record_id: relation.relation_id,
          workspace_id: WORKSPACE_ID,
          project_id: PROJECT_ID,
          fingerprint: relation.integrity.fingerprint,
          idempotency_key: relation.idempotency_key,
          payload: relation,
          created_at: relation.created_at,
        }).status,
        "inserted",
      );
    }

    const beforeRead = fullCountSnapshotV01(db);
    const focused = readProjectVerifyReconciliationForLineageV01(db, {
      workspace_id: WORKSPACE_ID,
      project_id: PROJECT_ID,
      observed_at: cycleTimestampV01(755, 0),
      focus: {
        focus_kind: "evidence",
        evidence_id: focusedEvidence.evidence_id,
      },
    });
    const reconciliation = focused.reconciliation;
    const claimRevisionCount = reconciliation.claim_families.reduce(
      (count, family) => count + family.revisions.length,
      0,
    );
    const relationRevisionCount = reconciliation.relation_families.reduce(
      (count, family) => count + family.revisions.length,
      0,
    );
    assert.equal(focused.focus_bounded, true);
    assert.equal(reconciliation.completeness.status, "bounded_incomplete");
    assert.equal(
      reconciliation.evidence.some(
        (item) => item.evidence_ref.record_id === focusedEvidence.evidence_id,
      ),
      true,
      "the exact focused Evidence root survives aggregate truncation",
    );
    assert.equal(claimRevisionCount, 256);
    assert.equal(relationRevisionCount, 2);
    assert.equal(reconciliation.evidence.length <= 256, true);
    assert.equal(reconciliation.claim_families.length, 1);
    assert.equal(
      reconciliation.claim_families.every(
        (family) =>
          family.revisions.length === 256 &&
          family.revisions.every(
            (revision, index) => revision.claim.revision === index + 1,
          ),
      ),
      true,
      "aggregate truncation never emits a partial Claim family lineage",
    );
    assert.equal(
      reconciliation.completeness.returned_items <=
        reconciliation.completeness.fixed_bound,
      true,
    );
    assert.deepEqual(fullCountSnapshotV01(db), beforeRead);
  } finally {
    db.close();
  }
}

function assertReadInputBoundsV01(): void {
  const db = new Database(":memory:");
  try {
    ensureVNextDurableSemanticStoreSchemaV01(db);
    const oversized = "x".repeat(257);
    const base = {
      workspace_id: WORKSPACE_ID,
      project_id: PROJECT_ID,
      observed_at: BASE_AT,
    };
    const reconciliationInput = (value: unknown) =>
      value as Parameters<typeof readProjectVerifyReconciliationV01>[1];
    const lineageInput = (lookup: unknown) =>
      ({
        ...base,
        lookup,
      }) as Parameters<typeof readProjectVerifyLineageV01>[1];
    assert.throws(
      () =>
        readProjectVerifyReconciliationV01(
          db,
          reconciliationInput({ ...base, unexpected: oversized }),
        ),
      /reconciliation_read_input_fields_invalid/,
    );
    for (const [field, value] of [
      ["workspace_id", oversized],
      ["project_id", oversized],
    ] as const) {
      assert.throws(
        () =>
          readProjectVerifyReconciliationV01(
            db,
            reconciliationInput({ ...base, [field]: value }),
          ),
        new RegExp(`${field}_invalid`),
      );
    }

    const sha = `sha256:${"a".repeat(64)}`;
    const oversizedLookups: unknown[] = [
      {
        lookup_kind: "criterion",
        criterion_id: oversized,
        packet_ref: {
          record_kind: "task_context_packet",
          record_id: "packet-input-bound",
          record_fingerprint: sha,
        },
        receipt_ref: {
          record_kind: "run_receipt",
          record_id: "receipt-input-bound",
          record_fingerprint: sha,
        },
      },
      {
        lookup_kind: "evidence",
        evidence_id: oversized,
        expected_fingerprint: null,
      },
      {
        lookup_kind: "claim",
        claim_id: oversized,
        expected_fingerprint: null,
      },
      { lookup_kind: "claim_family", claim_family_id: oversized },
      {
        lookup_kind: "claim_evidence_relation",
        relation_id: oversized,
        expected_fingerprint: null,
      },
      {
        lookup_kind: "claim_evidence_relation_family",
        relation_family_id: oversized,
      },
      {
        lookup_kind: "proposal",
        proposal_id: oversized,
        expected_fingerprint: null,
      },
      {
        lookup_kind: "transition_receipt",
        transition_receipt_id: oversized,
        expected_fingerprint: null,
      },
    ];
    for (const lookup of oversizedLookups) {
      assert.throws(
        () => readProjectVerifyLineageV01(db, lineageInput(lookup)),
        /_invalid/,
      );
    }
    assert.throws(
      () =>
        readProjectVerifyLineageV01(
          db,
          lineageInput({
            lookup_kind: "evidence",
            evidence_id: "evidence-input-bound",
            expected_fingerprint: null,
            unexpected: oversized,
          }),
        ),
      /lineage_lookup_fields_invalid/,
    );
    assert.throws(
      () =>
        readProjectVerifyLineageV01(
          db,
          lineageInput({
            lookup_kind: "criterion",
            criterion_id: "criterion-input-bound",
            packet_ref: {
              record_kind: "task_context_packet",
              record_id: "packet-input-bound",
              record_fingerprint: sha,
              unexpected: oversized,
            },
            receipt_ref: {
              record_kind: "run_receipt",
              record_id: "receipt-input-bound",
              record_fingerprint: sha,
            },
          }),
        ),
      /lineage_lookup_ref_fields_invalid/,
    );
    assert.throws(
      () =>
        readProjectVerifyLineageV01(db, {
          ...lineageInput({
            lookup_kind: "claim_family",
            claim_family_id: "claim-family-input-bound",
          }),
          unexpected: oversized,
        } as Parameters<typeof readProjectVerifyLineageV01>[1]),
      /lineage_read_input_fields_invalid/,
    );
  } finally {
    db.close();
  }
}

function assertLifecycleRefusalMatrixV01(): void {
  const db = new Database(":memory:");
  try {
    ensureVNextDurableSemanticStoreSchemaV01(db);
    const claim1 = claimV01({
      revision: 1,
      prior: null,
      operation: "create",
      proposition: "Lifecycle mutations must fail closed.",
      familySeed: "lifecycle-refusal-matrix",
    });
    const claim2 = claimV01({
      revision: 2,
      prior: claim1,
      operation: "revise",
      proposition: "Lifecycle mutations still fail closed after revision.",
      familySeed: "lifecycle-refusal-matrix",
    });
    for (const claim of [claim1, claim2]) {
      admitClaimRecordV01(db, {
        workspace_id: WORKSPACE_ID,
        project_id: PROJECT_ID,
        claim,
      });
    }
    const createMaterial = materializeProjectVerifyClaimLifecycleProposalV01(
      db,
      {
        workspace_id: WORKSPACE_ID,
        project_id: PROJECT_ID,
        claim_id: claim1.claim_id,
      },
    );
    const unadmittedDecision = decisionV01({
      proposal: createMaterial.proposal,
      priorDecision: null,
      cycle: 199,
    });
    const beforeDirectReviewPersistence = fullCountSnapshotV01(db);
    assert.throws(
      () =>
        persistVNextSemanticReviewMaterialV01(db, {
          proposal: createMaterial.proposal,
          decision: unadmittedDecision,
        }),
      /project_verify_lifecycle_proposal_canonical_admission_required/,
      "Project Verify lifecycle review material requires prior canonical source admission",
    );
    assert.deepEqual(fullCountSnapshotV01(db), beforeDirectReviewPersistence);

    const reservedTargetWithoutProfile = structuredClone(
      createMaterial.proposal,
    );
    delete reservedTargetWithoutProfile.project_verify_lifecycle;
    reservedTargetWithoutProfile.proposal_id = deriveEpisodeDeltaProposalIdV01(
      reservedTargetWithoutProfile,
    );
    reservedTargetWithoutProfile.integrity.fingerprint =
      createEpisodeDeltaProposalFingerprintV01(reservedTargetWithoutProfile);
    const reservedTargetValidation = validateEpisodeDeltaProposalV01(
      reservedTargetWithoutProfile,
    );
    assert.equal(reservedTargetValidation.status, "blocked");
    assert.equal(
      reservedTargetValidation.errors.some(
        (issue) =>
          issue.code ===
          "project_verify_lifecycle_reserved_target_without_profile",
      ),
      true,
    );

    admitProjectVerifyLifecycleProposalV01(db, createMaterial);
    assert.deepEqual(
      readProjectVerifyLifecycleProposalLocatorOnlyV01(
        db,
        createMaterial.identity,
      )?.proposal,
      createMaterial.proposal,
      "the internal locator returns the exact canonical proposal envelope without projecting lifecycle authenticity",
    );
    assert.throws(
      () =>
        readProjectVerifyLifecycleProposalLocatorOnlyV01(db, {
          ...createMaterial.identity,
          unexpected: "locator-boundary-forgery",
        } as Parameters<
          typeof readProjectVerifyLifecycleProposalLocatorOnlyV01
        >[1]),
      /project_verify_lifecycle_proposal_locator_identity_fields_invalid/,
    );
    assert.throws(
      () =>
        readProjectVerifyLifecycleProposalLocatorOnlyV01(db, {
          ...createMaterial.identity,
          family_id: "claim-family:locator-identity-forgery",
        }),
      /project_verify_lifecycle_proposal_identity_conflict/,
      "a matching idempotency lookup cannot substitute a different family identity",
    );
    assert.throws(
      () =>
        readProjectVerifyLifecycleProposalLocatorOnlyV01(db, {
          ...createMaterial.identity,
          workspace_id: "x".repeat(257),
        }),
      /project_verify_lifecycle_proposal_locator_workspace_invalid/,
      "locator scope is bounded before the database lookup",
    );
    const correctDecision = decisionV01({
      proposal: createMaterial.proposal,
      priorDecision: null,
      cycle: 200,
    });
    const baseline = fullCountSnapshotV01(db);

    const wrongOperation = rebuildDecisionV01(correctDecision, {
      decision: "supersede",
      requested_transition_intent: {
        ...assertPresentV01(correctDecision.requested_transition_intent),
        transition_kind: "semantic_candidate_supersede",
      },
      lineage: {
        ...correctDecision.lineage,
        superseding_candidate: correctDecision.candidate,
      },
    });
    assert.equal(
      validateReviewDecisionAgainstEpisodeDeltaProposalV01(
        wrongOperation,
        createMaterial.proposal,
      ).errors.some(
        (issue) =>
          issue.code === "project_verify_lifecycle_decision_operation_mismatch",
      ),
      true,
    );

    const wrongTarget = rebuildDecisionV01(correctDecision, {
      requested_transition_intent: {
        ...assertPresentV01(correctDecision.requested_transition_intent),
        target_refs: [
          {
            ...assertPresentV01(
              correctDecision.requested_transition_intent?.target_refs[0],
            ),
            external_id: "claim-family:forged-target",
          },
        ],
      },
    });
    assert.equal(
      validateReviewDecisionAgainstEpisodeDeltaProposalV01(
        wrongTarget,
        createMaterial.proposal,
      ).errors.some(
        (issue) =>
          issue.code === "requested_transition_target_mismatch" ||
          issue.code === "project_verify_lifecycle_transition_intent_mismatch",
      ),
      true,
    );

    const wrongCandidate = rebuildDecisionV01(correctDecision, {
      candidate: {
        ...correctDecision.candidate,
        candidate_fingerprint: `sha256:${"c".repeat(64)}`,
      },
    });
    assert.equal(
      validateReviewDecisionAgainstEpisodeDeltaProposalV01(
        wrongCandidate,
        createMaterial.proposal,
      ).errors.some(
        (issue) =>
          issue.code === "candidate_fingerprint_mismatch" ||
          issue.code === "project_verify_lifecycle_decision_candidate_mismatch",
      ),
      true,
    );

    const forgedSelectedRecordProposal = rebuildLifecycleProposalV01(
      createMaterial.proposal,
      { selected_record_fingerprint: `sha256:${"d".repeat(64)}` },
    );
    assert.equal(
      validateEpisodeDeltaProposalV01(forgedSelectedRecordProposal).status,
      "valid",
      "the forged proposal recomputes all structural fingerprints before source authentication",
    );
    assert.throws(
      () =>
        assertPersistedProjectVerifyLifecycleProposalSourceBoundV01(
          db,
          forgedSelectedRecordProposal,
        ),
      /project_verify_lifecycle_(selected_record|proposal_source_material)_conflict/,
    );
    assert.deepEqual(fullCountSnapshotV01(db), baseline);

    const createApplied = applyLifecycleV01({
      db,
      proposal: createMaterial.proposal,
      cycle: 210,
    });
    const reviseMaterial = materializeProjectVerifyClaimLifecycleProposalV01(
      db,
      {
        workspace_id: WORKSPACE_ID,
        project_id: PROJECT_ID,
        claim_id: claim2.claim_id,
      },
    );
    admitProjectVerifyLifecycleProposalV01(db, reviseMaterial);
    const forgedHeadProposal = rebuildLifecycleProposalV01(
      reviseMaterial.proposal,
      { current_head_state_fingerprint: `sha256:${"e".repeat(64)}` },
    );
    assert.equal(
      validateEpisodeDeltaProposalV01(forgedHeadProposal).status,
      "valid",
      "the changed head expectation retains a structurally valid outer proposal",
    );
    assert.throws(
      () =>
        assertPersistedProjectVerifyLifecycleProposalSourceBoundV01(
          db,
          forgedHeadProposal,
        ),
      /project_verify_lifecycle_(historical_head|proposal_source_material|head_expectation|transition_effect)_conflict|semantic_state/,
    );

    applyLifecycleV01({
      db,
      proposal: reviseMaterial.proposal,
      priorDecision: createApplied.decision,
      cycle: 220,
    });
    assert.throws(
      () =>
        assertProjectVerifyLifecycleProposalCurrentHeadExpectationV01(
          db,
          reviseMaterial.proposal,
        ),
      /project_verify_lifecycle_current_head_expectation_conflict/,
      "an already-advanced live family head makes the old proposal snapshot stale",
    );

    const endpointEvidence = evidenceV01({
      identityKey: "relation-endpoint-source-refusal",
    });
    admitEvidenceRecordV01(db, {
      workspace_id: WORKSPACE_ID,
      project_id: PROJECT_ID,
      evidence: endpointEvidence,
    });
    const endpointRelation = relationV01({
      revision: 1,
      prior: null,
      operation: "create",
      familySeed: "relation-endpoint-source-refusal",
      claim: claim2,
      evidence: endpointEvidence,
      kind: "supports",
    });
    admitClaimEvidenceRelationV01(db, {
      workspace_id: WORKSPACE_ID,
      project_id: PROJECT_ID,
      relation: endpointRelation,
    });
    const endpointMaterial =
      materializeProjectVerifyRelationLifecycleProposalV01(db, {
        workspace_id: WORKSPACE_ID,
        project_id: PROJECT_ID,
        relation_id: endpointRelation.relation_id,
      });
    const forgedEndpointProposal = rebuildLifecycleRelationEndpointProposalV01(
      endpointMaterial.proposal,
    );
    assert.equal(
      validateEpisodeDeltaProposalV01(forgedEndpointProposal).status,
      "valid",
      "a fully fingerprinted endpoint mutation remains structural until exact SR-2 sources are reloaded",
    );
    assert.throws(
      () =>
        assertPersistedProjectVerifyLifecycleProposalSourceBoundV01(
          db,
          forgedEndpointProposal,
        ),
      /project_verify_lifecycle_proposal_source_material_conflict|project_verify_lifecycle_selected_record_conflict/,
    );
  } finally {
    db.close();
  }
}

function assertExactLineageStopsV01(): void {
  const scenarios = [
    {
      label: "recorded",
      phase: "recorded",
      expected: "candidate_recorded_no_proposal",
      review: "no_proposal",
      decision: "no_decision",
      gate: "no_gate",
      transition: "no_transition",
      application: "never_applied",
    },
    {
      label: "proposal",
      phase: "proposal",
      expected: "proposal_pending_review",
      review: "pending_review",
      decision: "no_decision",
      gate: "no_gate",
      transition: "no_transition",
      application: "never_applied",
    },
    {
      label: "reject",
      phase: "reject",
      expected: "review_rejected",
      review: "reviewed",
      decision: "rejected",
      gate: "no_gate",
      transition: "no_transition",
      application: "never_applied",
    },
    {
      label: "defer",
      phase: "defer",
      expected: "review_deferred",
      review: "reviewed",
      decision: "deferred",
      gate: "no_gate",
      transition: "no_transition",
      application: "never_applied",
    },
    {
      label: "accept",
      phase: "accept",
      expected: "decision_recorded_gate_pending",
      review: "reviewed",
      decision: "accepted",
      gate: "no_gate",
      transition: "no_transition",
      application: "never_applied",
    },
    {
      label: "gate",
      phase: "gate",
      expected: "gate_authorized_transition_pending",
      review: "reviewed",
      decision: "accepted",
      gate: "authorized",
      transition: "transition_missing",
      application: "never_applied",
    },
    {
      label: "applied",
      phase: "applied",
      expected: "transition_applied_packet_pending",
      review: "reviewed",
      decision: "accepted",
      gate: "authorized",
      transition: "applied",
      application: "applied_current",
    },
  ] as const;

  for (const [index, scenario] of scenarios.entries()) {
    const db = new Database(":memory:");
    try {
      ensureVNextDurableSemanticStoreSchemaV01(db);
      const claim = claimV01({
        revision: 1,
        prior: null,
        operation: "create",
        proposition: `Exact lineage stops truthfully at ${scenario.label}.`,
        familySeed: `lineage-stop-${scenario.label}`,
      });
      admitClaimRecordV01(db, {
        workspace_id: WORKSPACE_ID,
        project_id: PROJECT_ID,
        claim,
      });
      let material: ReturnType<
        typeof materializeProjectVerifyClaimLifecycleProposalV01
      > | null = null;
      let decision: ReviewDecisionV01 | null = null;
      let authorization: VNextSemanticCommitAuthorizationResultV01 | null =
        null;
      const cycle = 300 + index * 10;
      if (scenario.phase !== "recorded") {
        material = materializeProjectVerifyClaimLifecycleProposalV01(db, {
          workspace_id: WORKSPACE_ID,
          project_id: PROJECT_ID,
          claim_id: claim.claim_id,
        });
        admitProjectVerifyLifecycleProposalV01(db, material);
      }
      if (scenario.phase !== "recorded" && scenario.phase !== "proposal") {
        decision = decisionV01({
          proposal: assertPresentV01(material).proposal,
          decision:
            scenario.phase === "reject"
              ? "reject"
              : scenario.phase === "defer"
                ? "defer"
                : "accept",
          priorDecision: null,
          cycle,
        });
        persistVNextSemanticReviewMaterialV01(db, {
          proposal: assertPresentV01(material).proposal,
          decision,
        });
      }
      if (scenario.phase === "gate" || scenario.phase === "applied") {
        const exactMaterial = assertPresentV01(material);
        const exactDecision = assertPresentV01(decision);
        const preview = prepareVNextSemanticCommitPreviewV01(db, {
          workspace_id: WORKSPACE_ID,
          project_id: PROJECT_ID,
          proposal_id: exactMaterial.proposal.proposal_id,
          proposal_fingerprint: exactMaterial.proposal.integrity.fingerprint,
          decision_id: exactDecision.decision_id,
          decision_fingerprint: exactDecision.integrity.fingerprint,
          authorized_applier_identity: {
            ref_type: "semantic_transition_applier",
            external_id: `local-core-applier:lineage-stop:${scenario.label}`,
          },
          gate_ttl_ms: 30_000,
          clock: fixedClockV01(
            cycleTimestampV01(cycle, 1),
            cycleTimestampV01(cycle, 2),
          ),
        });
        authorization = recordVNextSemanticCommitAuthorizationV01(db, {
          preview,
          confirmation_digest: preview.confirmation_digest,
          operator_actor_ref: exactDecision.actor_ref,
          clock: fixedClockV01(
            cycleTimestampV01(cycle, 3),
            cycleTimestampV01(cycle, 4),
            cycleTimestampV01(cycle, 5),
          ),
        });
      }
      if (scenario.phase === "applied") {
        const exactMaterial = assertPresentV01(material);
        const exactDecision = assertPresentV01(decision);
        const exactAuthorization = assertPresentV01(authorization);
        assert.equal(
          commitVNextSemanticTransitionV01(db, {
            workspace_id: WORKSPACE_ID,
            project_id: PROJECT_ID,
            proposal_id: exactMaterial.proposal.proposal_id,
            proposal_fingerprint: exactMaterial.proposal.integrity.fingerprint,
            decision_id: exactDecision.decision_id,
            decision_fingerprint: exactDecision.integrity.fingerprint,
            gate_record_id: exactAuthorization.gate_record.gate_record_id,
            gate_record_fingerprint:
              exactAuthorization.gate_record.integrity.fingerprint,
            clock: fixedClockV01(
              cycleTimestampV01(cycle, 6),
              cycleTimestampV01(cycle, 7),
            ),
          }).status,
          "applied",
        );
      }

      const beforeRead = fullCountSnapshotV01(db);
      const lineage = readProjectVerifyLineageV01(db, {
        workspace_id: WORKSPACE_ID,
        project_id: PROJECT_ID,
        observed_at: cycleTimestampV01(cycle, 8),
        lookup: {
          lookup_kind: "claim",
          claim_id: claim.claim_id,
          expected_fingerprint: claim.integrity.fingerprint,
        },
      });
      assert.equal(lineage.stop.reason, scenario.expected, scenario.label);
      assert.equal(lineage.conflicts.length, 0, scenario.label);
      assert.equal(lineage.authority.writes_database, false);
      const reconciliation = readProjectVerifyReconciliationV01(db, {
        workspace_id: WORKSPACE_ID,
        project_id: PROJECT_ID,
        observed_at: cycleTimestampV01(cycle, 8),
      });
      assert.equal(
        reconciliation.summary.pending_review,
        scenario.phase === "proposal",
        `${scenario.label} must distinguish a bare recorded candidate from an admitted proposal pending review`,
      );
      const revision = assertPresentV01(
        reconciliation.claim_families
          .find((family) => family.claim_family_id === claim.claim_family_id)
          ?.revisions.find(
            (candidate) => candidate.claim.claim_id === claim.claim_id,
          ),
      );
      assert.equal(revision.lifecycle.record.recorded, true, scenario.label);
      assert.equal(
        revision.lifecycle.record.latest_recorded_candidate,
        true,
        scenario.label,
      );
      assert.equal(
        revision.lifecycle.review.status,
        scenario.review,
        scenario.label,
      );
      assert.equal(
        revision.lifecycle.decision.status,
        scenario.decision,
        scenario.label,
      );
      assert.equal(
        revision.lifecycle.gate.status,
        scenario.gate,
        scenario.label,
      );
      assert.equal(
        revision.lifecycle.transition.status,
        scenario.transition,
        scenario.label,
      );
      assert.equal(
        revision.lifecycle.application.status,
        scenario.application,
        scenario.label,
      );
      assert.equal(revision.lifecycle.truth.claim_truth, "not_established");
      if (scenario.phase === "gate" || scenario.phase === "applied") {
        const afterExpiryAt = cycleTimestampV01(cycle, 40);
        const afterExpiry = readProjectVerifyReconciliationV01(db, {
          workspace_id: WORKSPACE_ID,
          project_id: PROJECT_ID,
          observed_at: afterExpiryAt,
        });
        const afterExpiryRevision = assertPresentV01(
          afterExpiry.claim_families
            .find((family) => family.claim_family_id === claim.claim_family_id)
            ?.revisions.find(
              (candidate) => candidate.claim.claim_id === claim.claim_id,
            ),
        );
        assert.equal(
          afterExpiryRevision.lifecycle.gate.status,
          scenario.phase === "gate" ? "expired" : "authorized",
        );
        assert.equal(
          afterExpiryRevision.lifecycle.application.status,
          scenario.phase === "gate" ? "never_applied" : "applied_current",
        );
        const afterExpiryLineage = readProjectVerifyLineageV01(db, {
          workspace_id: WORKSPACE_ID,
          project_id: PROJECT_ID,
          observed_at: afterExpiryAt,
          lookup: {
            lookup_kind: "claim",
            claim_id: claim.claim_id,
            expected_fingerprint: claim.integrity.fingerprint,
          },
        });
        if (scenario.phase === "gate") {
          assert.equal(
            afterExpiryLineage.stop.reason,
            "gate_expired_transition_not_applied",
          );
          assert.equal(
            afterExpiryLineage.nodes.some(
              (node) =>
                node.node_kind === "semantic_commit_gate" &&
                node.status === "expired",
            ),
            true,
          );
        }
      }
      assert.deepEqual(fullCountSnapshotV01(db), beforeRead);
    } finally {
      db.close();
    }
  }
}

function assertLifecycleRestoreAndForgeryV01(): void {
  const directory = mkdtempSync(join(tmpdir(), "augnes-sr3-restore-"));
  const databasePath = join(directory, "lifecycle.sqlite");
  const restoredPath = join(directory, "lifecycle-restored.sqlite");
  const db = new Database(databasePath);
  let restored: Database.Database | null = null;
  try {
    ensureVNextDurableSemanticStoreSchemaV01(db);
    const claim = claimV01({
      revision: 1,
      prior: null,
      operation: "create",
      proposition: "Backup and restore preserve exact lifecycle sources.",
      familySeed: "lifecycle-restore",
    });
    admitClaimRecordV01(db, {
      workspace_id: WORKSPACE_ID,
      project_id: PROJECT_ID,
      claim,
    });
    const material = materializeProjectVerifyClaimLifecycleProposalV01(db, {
      workspace_id: WORKSPACE_ID,
      project_id: PROJECT_ID,
      claim_id: claim.claim_id,
    });
    admitProjectVerifyLifecycleProposalV01(db, material);
    const applied = applyLifecycleV01({
      db,
      proposal: material.proposal,
      cycle: 400,
    });
    const exactAppliedState = assertPresentV01(applied.commit.semantic_state);
    const forgedNestedScope = rebuildLifecycleStateOuterFingerprintsV01(
      exactAppliedState,
      { binding_project_id: OTHER_PROJECT_ID },
    );
    assert.throws(
      () => rebuildVNextPersistedSemanticStateV01(forgedNestedScope),
      (error: unknown) =>
        error instanceof Error &&
        "code" in error &&
        error.code === "semantic_state_lifecycle_scope_mismatch",
      "fully recomputed nested lifecycle scope cannot disagree with the outer semantic-state scope",
    );
    const forgedNestedCandidate = rebuildLifecycleStateOuterFingerprintsV01(
      exactAppliedState,
      {
        binding_candidate: {
          candidate_id: "forged-lifecycle-candidate",
          candidate_fingerprint: `sha256:${"9".repeat(64)}`,
        },
      },
    );
    assert.throws(
      () => rebuildVNextPersistedSemanticStateV01(forgedNestedCandidate),
      (error: unknown) =>
        error instanceof Error &&
        "code" in error &&
        error.code === "semantic_state_lifecycle_candidate_mismatch",
      "fully recomputed nested candidate material cannot disagree with the outer semantic-state source candidate",
    );
    const retractedFamilyClaim = claimV01({
      revision: 1,
      prior: null,
      operation: "create",
      proposition: "Restored absent heads retain exact receipt time lineage.",
      familySeed: "lifecycle-restore-absent-head",
    });
    admitClaimRecordV01(db, {
      workspace_id: WORKSPACE_ID,
      project_id: PROJECT_ID,
      claim: retractedFamilyClaim,
    });
    const retractedFamilyCreate =
      materializeProjectVerifyClaimLifecycleProposalV01(db, {
        workspace_id: WORKSPACE_ID,
        project_id: PROJECT_ID,
        claim_id: retractedFamilyClaim.claim_id,
      });
    admitProjectVerifyLifecycleProposalV01(db, retractedFamilyCreate);
    const retractedFamilyApplied = applyLifecycleV01({
      db,
      proposal: retractedFamilyCreate.proposal,
      cycle: 410,
    });
    const retraction = claimV01({
      revision: 2,
      prior: retractedFamilyClaim,
      operation: "retract",
      proposition: retractedFamilyClaim.proposition,
      familySeed: "lifecycle-restore-absent-head",
    });
    admitClaimRecordV01(db, {
      workspace_id: WORKSPACE_ID,
      project_id: PROJECT_ID,
      claim: retraction,
    });
    const retractionMaterial =
      materializeProjectVerifyClaimLifecycleProposalV01(db, {
        workspace_id: WORKSPACE_ID,
        project_id: PROJECT_ID,
        claim_id: retraction.claim_id,
      });
    admitProjectVerifyLifecycleProposalV01(db, retractionMaterial);
    applyLifecycleV01({
      db,
      proposal: retractionMaterial.proposal,
      priorDecision: retractedFamilyApplied.decision,
      cycle: 420,
    });
    const readInput = {
      workspace_id: WORKSPACE_ID,
      project_id: PROJECT_ID,
      observed_at: cycleTimestampV01(430, 0),
    };
    const reconciliation = readProjectVerifyReconciliationV01(db, readInput);
    const lineage = readProjectVerifyLineageV01(db, {
      ...readInput,
      lookup: {
        lookup_kind: "claim" as const,
        claim_id: claim.claim_id,
        expected_fingerprint: claim.integrity.fingerprint,
      },
    });
    db.exec(`VACUUM INTO '${restoredPath.replaceAll("'", "''")}'`);
    restored = new Database(restoredPath, { fileMustExist: true });
    ensureVNextDurableSemanticStoreSchemaV01(restored);
    assert.deepEqual(
      readProjectVerifyReconciliationV01(restored, readInput),
      reconciliation,
    );
    assert.deepEqual(
      readProjectVerifyLineageV01(restored, {
        ...readInput,
        lookup: {
          lookup_kind: "claim",
          claim_id: claim.claim_id,
          expected_fingerprint: claim.integrity.fingerprint,
        },
      }),
      lineage,
    );

    const presentTargetKey = exactAppliedState.target_key;
    const absentTargetKey = deriveVNextSemanticTargetKeyV01(
      retractionMaterial.proposal.project_verify_lifecycle!.lifecycle_binding
        .family_target_ref,
    );
    const presentHead = assertPresentV01(
      readVNextSemanticTargetHeadV01(restored, {
        workspace_id: WORKSPACE_ID,
        project_id: PROJECT_ID,
        target_key: presentTargetKey,
      }),
    );
    const absentHead = assertPresentV01(
      readVNextSemanticTargetHeadV01(restored, {
        workspace_id: WORKSPACE_ID,
        project_id: PROJECT_ID,
        target_key: absentTargetKey,
      }),
    );
    assert.equal(presentHead.presence, "present");
    assert.equal(absentHead.presence, "absent");
    restored
      .prepare(
        `UPDATE vnext_semantic_target_heads
         SET updated_at = ?
         WHERE workspace_id = ? AND project_id = ? AND target_key = ?`,
      )
      .run(
        cycleTimestampV01(431, 0),
        WORKSPACE_ID,
        PROJECT_ID,
        presentTargetKey,
      );
    assert.throws(
      () => readProjectVerifyReconciliationV01(restored!, readInput),
      /project_verify_current_head_receipt_binding_conflict/,
      "a restored present target head timestamp must match its exact Transition receipt",
    );
    restored
      .prepare(
        `UPDATE vnext_semantic_target_heads
         SET updated_at = ?
         WHERE workspace_id = ? AND project_id = ? AND target_key = ?`,
      )
      .run(presentHead.updated_at, WORKSPACE_ID, PROJECT_ID, presentTargetKey);
    restored
      .prepare(
        `UPDATE vnext_semantic_state_entries
         SET updated_at = ?
         WHERE workspace_id = ? AND project_id = ? AND target_key = ?`,
      )
      .run(
        cycleTimestampV01(431, 1),
        WORKSPACE_ID,
        PROJECT_ID,
        presentTargetKey,
      );
    assert.throws(
      () => readProjectVerifyReconciliationV01(restored!, readInput),
      /project_verify_current_projection_conflict/,
      "a restored present projection timestamp must match its exact target head",
    );
    restored
      .prepare(
        `UPDATE vnext_semantic_state_entries
         SET updated_at = ?
         WHERE workspace_id = ? AND project_id = ? AND target_key = ?`,
      )
      .run(presentHead.updated_at, WORKSPACE_ID, PROJECT_ID, presentTargetKey);
    restored
      .prepare(
        `UPDATE vnext_semantic_target_heads
         SET updated_at = ?
         WHERE workspace_id = ? AND project_id = ? AND target_key = ?`,
      )
      .run(
        cycleTimestampV01(431, 2),
        WORKSPACE_ID,
        PROJECT_ID,
        absentTargetKey,
      );
    assert.throws(
      () => readProjectVerifyReconciliationV01(restored!, readInput),
      /project_verify_current_head_receipt_binding_conflict/,
      "a restored absent target head timestamp must match its exact retraction receipt",
    );
    restored
      .prepare(
        `UPDATE vnext_semantic_target_heads
         SET updated_at = ?
         WHERE workspace_id = ? AND project_id = ? AND target_key = ?`,
      )
      .run(absentHead.updated_at, WORKSPACE_ID, PROJECT_ID, absentTargetKey);

    restored.exec("DROP TRIGGER trg_vnext_core_records_immutable_update");
    restored
      .prepare(
        `UPDATE vnext_core_records
         SET idempotency_key = NULL
         WHERE record_kind = 'episode_delta_proposal'
           AND record_id = ? AND workspace_id = ? AND project_id = ?`,
      )
      .run(material.proposal.proposal_id, WORKSPACE_ID, PROJECT_ID);
    restored.exec(`CREATE TRIGGER trg_vnext_core_records_immutable_update
      BEFORE UPDATE ON vnext_core_records
      BEGIN SELECT RAISE(ABORT, 'vnext_core_records_immutable'); END`);
    assert.throws(
      () => readProjectVerifyReconciliationV01(restored!, readInput),
      /persisted_project_verify_lifecycle_source_conflict/,
      "a restored lifecycle proposal without its canonical admission idempotency binding cannot authenticate reconciliation",
    );
    assert.throws(
      () =>
        loadValidatedVNextSemanticTransitionRelationV01(restored!, {
          workspace_id: WORKSPACE_ID,
          project_id: PROJECT_ID,
          transition_receipt_id:
            applied.commit.transition_receipt.transition_receipt_id,
          transition_receipt_fingerprint:
            applied.commit.transition_receipt.integrity.fingerprint,
        }),
      /persisted_project_verify_lifecycle_source_conflict/,
      "the Transition source reader refuses a restored lifecycle proposal that lost canonical admission identity",
    );
    assert.throws(
      () =>
        readProjectVerifyLineageV01(restored!, {
          ...readInput,
          lookup: {
            lookup_kind: "claim",
            claim_id: claim.claim_id,
            expected_fingerprint: claim.integrity.fingerprint,
          },
        }),
      /persisted_project_verify_lifecycle_source_conflict/,
      "a restored lifecycle proposal without its canonical admission idempotency binding cannot authenticate lineage",
    );
    restored.exec("DROP TRIGGER trg_vnext_core_records_immutable_update");
    restored
      .prepare(
        `UPDATE vnext_core_records
         SET idempotency_key = ?
         WHERE record_kind = 'episode_delta_proposal'
           AND record_id = ? AND workspace_id = ? AND project_id = ?`,
      )
      .run(
        material.identity.admission_idempotency_key,
        material.proposal.proposal_id,
        WORKSPACE_ID,
        PROJECT_ID,
      );
    restored.exec(`CREATE TRIGGER trg_vnext_core_records_immutable_update
      BEFORE UPDATE ON vnext_core_records
      BEGIN SELECT RAISE(ABORT, 'vnext_core_records_immutable'); END`);

    const forgedClaim = claimV01({
      revision: 1,
      prior: null,
      operation: "create",
      proposition: "A forged restored proposition must not become current.",
      familySeed: "lifecycle-restore",
    });
    const forgedProposal = materializeProjectVerifyLifecycleProposalV01({
      selected_record: forgedClaim,
      current_head_expectation: {
        presence: "absent",
        revision: 0,
        state_content_fingerprint: null,
        source_transition_receipt_id: null,
        source_transition_receipt_fingerprint: null,
        selected_record_ref: null,
      },
      observed_at: forgedClaim.created_at,
    }).proposal;
    const forgedCandidate = assertPresentV01(forgedProposal.proposed_deltas[0]);
    const forgedBinding = assertPresentV01(
      forgedProposal.project_verify_lifecycle,
    ).lifecycle_binding;
    assert.equal(forgedBinding.family_id, claim.claim_family_id);
    const forgedState = buildVNextPersistedSemanticStateV01({
      proposal: forgedProposal,
      candidate_id: forgedCandidate.candidate_id,
      target_ref: forgedBinding.family_target_ref,
      source_decision: {
        decision_id: applied.decision.decision_id,
        decision_fingerprint: applied.decision.integrity.fingerprint,
      },
      created_at: cycleTimestampV01(402, 0),
    });
    assert.deepEqual(
      rebuildVNextPersistedSemanticStateV01(forgedState),
      forgedState,
    );
    assert.equal(
      insertVNextCoreRecordV01(restored, {
        record_kind: "semantic_state",
        record_id: forgedState.semantic_state_record_id,
        workspace_id: forgedState.workspace_id,
        project_id: forgedState.project_id,
        fingerprint: forgedState.integrity.fingerprint,
        idempotency_key: null,
        payload: forgedState,
        created_at: forgedState.created_at,
      }).status,
      "inserted",
    );
    restored
      .prepare(
        `UPDATE vnext_semantic_state_entries
         SET state_ref_json = ?, current_state_fingerprint = ?,
             bounded_state_summary = ?, source_proposal_id = ?,
             source_proposal_fingerprint = ?, source_candidate_id = ?,
             source_candidate_fingerprint = ?
         WHERE workspace_id = ? AND project_id = ? AND target_key = ?`,
      )
      .run(
        JSON.stringify(forgedState.state_ref),
        forgedState.state_content_fingerprint,
        forgedState.bounded_state_summary,
        forgedState.source_proposal_id,
        forgedState.source_proposal_fingerprint,
        forgedState.source_candidate_id,
        forgedState.source_candidate_fingerprint,
        WORKSPACE_ID,
        PROJECT_ID,
        forgedState.target_key,
      );
    restored
      .prepare(
        `UPDATE vnext_semantic_target_heads
         SET current_state_fingerprint = ?
         WHERE workspace_id = ? AND project_id = ? AND target_key = ?`,
      )
      .run(
        forgedState.state_content_fingerprint,
        WORKSPACE_ID,
        PROJECT_ID,
        forgedState.target_key,
      );

    assert.throws(
      () => readProjectVerifyReconciliationV01(restored!, readInput),
      /persisted_project_verify_lifecycle_source_conflict|project_verify_current_state_binding_conflict|project_verify_current_head_effect_conflict|semantic_state_projection_record_mismatch|semantic_target_head_receipt/,
    );
    assert.throws(
      () =>
        readProjectVerifyLineageV01(restored!, {
          ...readInput,
          lookup: {
            lookup_kind: "claim",
            claim_id: claim.claim_id,
            expected_fingerprint: claim.integrity.fingerprint,
          },
        }),
      /persisted_project_verify_lifecycle_source_conflict|project_verify_current_state_binding_conflict|project_verify_current_head_effect_conflict|semantic_state_projection_record_mismatch|semantic_target_head_receipt/,
    );
  } finally {
    restored?.close();
    db.close();
    rmSync(directory, { recursive: true, force: true });
  }
}

function assertPriorLifecycleSourceChainRequiredV01(): void {
  const source = new Database(":memory:");
  const transplanted = new Database(":memory:");
  try {
    ensureVNextDurableSemanticStoreSchemaV01(source);
    ensureVNextDurableSemanticStoreSchemaV01(transplanted);
    const claim1 = claimV01({
      revision: 1,
      prior: null,
      operation: "create",
      proposition: "A valid applied prior revision has an exact source chain.",
      familySeed: "prior-source-chain-required",
    });
    const claim2 = claimV01({
      revision: 2,
      prior: claim1,
      operation: "revise",
      proposition:
        "The next revision cannot rely on transplanted state and receipt residue alone.",
      familySeed: "prior-source-chain-required",
    });
    for (const claim of [claim1, claim2]) {
      admitClaimRecordV01(source, {
        workspace_id: WORKSPACE_ID,
        project_id: PROJECT_ID,
        claim,
      });
    }
    const material = materializeProjectVerifyClaimLifecycleProposalV01(source, {
      workspace_id: WORKSPACE_ID,
      project_id: PROJECT_ID,
      claim_id: claim1.claim_id,
    });
    admitProjectVerifyLifecycleProposalV01(source, material);
    const applied = applyLifecycleV01({
      db: source,
      proposal: material.proposal,
      cycle: 710,
    });
    const projection = assertPresentV01(applied.commit.projection);
    const head = assertPresentV01(
      readVNextSemanticTargetHeadV01(source, {
        workspace_id: WORKSPACE_ID,
        project_id: PROJECT_ID,
        target_key: projection.target_key,
      }),
    );

    for (const claim of [claim1, claim2]) {
      const envelope = assertPresentV01(
        readVNextCoreRecordV01(source, {
          record_kind: "claim_record",
          record_id: claim.claim_id,
          workspace_id: WORKSPACE_ID,
          project_id: PROJECT_ID,
        }),
      );
      insertVNextCoreRecordV01(transplanted, envelope);
    }
    const semanticState = assertPresentV01(applied.commit.semantic_state);
    const stateEnvelope = assertPresentV01(
      readVNextCoreRecordV01(source, {
        record_kind: "semantic_state",
        record_id: semanticState.semantic_state_record_id,
        workspace_id: WORKSPACE_ID,
        project_id: PROJECT_ID,
      }),
    );
    const receiptEnvelope = assertPresentV01(
      readVNextCoreRecordV01(source, {
        record_kind: "state_transition_receipt",
        record_id: applied.commit.transition_receipt.transition_receipt_id,
        workspace_id: WORKSPACE_ID,
        project_id: PROJECT_ID,
      }),
    );
    insertVNextCoreRecordV01(transplanted, stateEnvelope);
    insertVNextCoreRecordV01(transplanted, receiptEnvelope);
    transplanted
      .prepare(
        `INSERT INTO vnext_semantic_state_entries (
          workspace_id, project_id, presence, target_key, target_ref_json,
          state_ref_json, current_state_fingerprint, bounded_state_summary,
          source_proposal_id, source_proposal_fingerprint, source_candidate_id,
          source_candidate_fingerprint, source_transition_receipt_id,
          source_transition_receipt_fingerprint, revision, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        projection.workspace_id,
        projection.project_id,
        projection.presence,
        projection.target_key,
        JSON.stringify(projection.target_ref),
        JSON.stringify(projection.state_ref),
        projection.state_fingerprint,
        projection.bounded_state_summary,
        projection.source_proposal_id,
        projection.source_proposal_fingerprint,
        projection.source_candidate_id,
        projection.source_candidate_fingerprint,
        projection.source_transition_receipt_id,
        projection.source_transition_receipt_fingerprint,
        projection.revision,
        projection.updated_at,
      );
    transplanted
      .prepare(
        `INSERT INTO vnext_semantic_target_heads (
          workspace_id, project_id, target_key, revision, presence,
          current_state_fingerprint, source_transition_receipt_id,
          source_transition_receipt_fingerprint, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        head.workspace_id,
        head.project_id,
        head.target_key,
        head.revision,
        head.presence,
        head.current_state_fingerprint,
        head.source_transition_receipt_id,
        head.source_transition_receipt_fingerprint,
        head.updated_at,
      );

    assert.equal(
      countCoreRecordsV01(transplanted, "episode_delta_proposal"),
      0,
    );
    assert.equal(countCoreRecordsV01(transplanted, "review_decision"), 0);
    assert.equal(countCoreRecordsV01(transplanted, "semantic_commit_gate"), 0);
    const beforeRefusal = fullCountSnapshotV01(transplanted);
    assert.throws(
      () =>
        materializeProjectVerifyClaimLifecycleProposalV01(transplanted, {
          workspace_id: WORKSPACE_ID,
          project_id: PROJECT_ID,
          claim_id: claim2.claim_id,
        }),
      /project_verify_lifecycle_prior_source_chain_conflict|persisted_proposal_missing/,
      "state, head, receipt, and selected Claim lineage cannot replace the exact prior proposal, decision, and gate chain",
    );
    assert.deepEqual(fullCountSnapshotV01(transplanted), beforeRefusal);
  } finally {
    transplanted.close();
    source.close();
  }
}

function assertHistoricalAppliedStateRequiredV01(): void {
  const db = new Database(":memory:");
  try {
    ensureVNextDurableSemanticStoreSchemaV01(db);
    const claim1 = claimV01({
      revision: 1,
      prior: null,
      operation: "create",
      proposition: "Historical applied state remains exact after revision.",
      familySeed: "historical-applied-state-required",
    });
    const claim2 = claimV01({
      revision: 2,
      prior: claim1,
      operation: "revise",
      proposition: "A later revision does not erase its prior applied state.",
      familySeed: "historical-applied-state-required",
    });
    for (const claim of [claim1, claim2]) {
      admitClaimRecordV01(db, {
        workspace_id: WORKSPACE_ID,
        project_id: PROJECT_ID,
        claim,
      });
    }
    const firstMaterial = materializeProjectVerifyClaimLifecycleProposalV01(
      db,
      {
        workspace_id: WORKSPACE_ID,
        project_id: PROJECT_ID,
        claim_id: claim1.claim_id,
      },
    );
    admitProjectVerifyLifecycleProposalV01(db, firstMaterial);
    const firstApplied = applyLifecycleV01({
      db,
      proposal: firstMaterial.proposal,
      cycle: 730,
    });
    const secondMaterial = materializeProjectVerifyClaimLifecycleProposalV01(
      db,
      {
        workspace_id: WORKSPACE_ID,
        project_id: PROJECT_ID,
        claim_id: claim2.claim_id,
      },
    );
    admitProjectVerifyLifecycleProposalV01(db, secondMaterial);
    applyLifecycleV01({
      db,
      proposal: secondMaterial.proposal,
      priorDecision: firstApplied.decision,
      cycle: 740,
    });
    const historicalState = assertPresentV01(
      firstApplied.commit.semantic_state,
    );
    db.exec("DROP TRIGGER trg_vnext_core_records_immutable_delete");
    db.prepare(
      `DELETE FROM vnext_core_records
        WHERE record_kind = 'semantic_state' AND record_id = ?
          AND workspace_id = ? AND project_id = ?`,
    ).run(historicalState.semantic_state_record_id, WORKSPACE_ID, PROJECT_ID);
    db.exec(`CREATE TRIGGER trg_vnext_core_records_immutable_delete
      BEFORE DELETE ON vnext_core_records
      BEGIN SELECT RAISE(ABORT, 'vnext_core_records_immutable'); END`);
    assert.throws(
      () =>
        readProjectVerifyReconciliationV01(db, {
          workspace_id: WORKSPACE_ID,
          project_id: PROJECT_ID,
          observed_at: cycleTimestampV01(750, 0),
        }),
      /project_verify_historical_semantic_state_missing|persisted_project_verify_lifecycle_source_conflict/,
      "a valid later head cannot make a missing historical applied-state envelope appear previously applied",
    );
  } finally {
    db.close();
  }
}

function assertRollbackCheckpointsV01(): void {
  const commitCheckpoints =
    VNEXT_SEMANTIC_TRANSITION_TEST_FAILURE_CHECKPOINTS_V01.filter(
      (checkpoint) =>
        [
          "after_first_state_record_insert",
          "after_first_projection_write",
          "before_receipt_insert",
          "after_receipt_insert_before_commit",
        ].includes(checkpoint),
    );
  assert.equal(commitCheckpoints.length, 4);
  for (const [index, checkpoint] of commitCheckpoints.entries()) {
    const db = new Database(":memory:");
    try {
      ensureVNextDurableSemanticStoreSchemaV01(db);
      const claim = claimV01({
        revision: 1,
        prior: null,
        operation: "create",
        proposition: `Rollback checkpoint ${checkpoint} remains atomic.`,
        familySeed: `rollback-${checkpoint}`,
      });
      admitClaimRecordV01(db, {
        workspace_id: WORKSPACE_ID,
        project_id: PROJECT_ID,
        claim,
      });
      const material = materializeProjectVerifyClaimLifecycleProposalV01(db, {
        workspace_id: WORKSPACE_ID,
        project_id: PROJECT_ID,
        claim_id: claim.claim_id,
      });
      admitProjectVerifyLifecycleProposalV01(db, material);
      const decision = decisionV01({
        proposal: material.proposal,
        priorDecision: null,
        cycle: 100 + index,
      });
      persistVNextSemanticReviewMaterialV01(db, {
        proposal: material.proposal,
        decision,
      });
      const preview = prepareVNextSemanticCommitPreviewV01(db, {
        workspace_id: WORKSPACE_ID,
        project_id: PROJECT_ID,
        proposal_id: material.proposal.proposal_id,
        proposal_fingerprint: material.proposal.integrity.fingerprint,
        decision_id: decision.decision_id,
        decision_fingerprint: decision.integrity.fingerprint,
        authorized_applier_identity: {
          ref_type: "semantic_transition_applier",
          external_id: `local-core-applier:rollback:${index}`,
        },
        gate_ttl_ms: 30_000,
        clock: fixedClockV01(
          cycleTimestampV01(100 + index, 1),
          cycleTimestampV01(100 + index, 2),
        ),
      });
      const authorization = recordVNextSemanticCommitAuthorizationV01(db, {
        preview,
        confirmation_digest: preview.confirmation_digest,
        operator_actor_ref: decision.actor_ref,
        clock: fixedClockV01(
          cycleTimestampV01(100 + index, 3),
          cycleTimestampV01(100 + index, 4),
          cycleTimestampV01(100 + index, 5),
        ),
      });
      const baseline = fullCountSnapshotV01(db);
      assert.throws(
        () =>
          commitVNextSemanticTransitionV01(db, {
            workspace_id: WORKSPACE_ID,
            project_id: PROJECT_ID,
            proposal_id: material.proposal.proposal_id,
            proposal_fingerprint: material.proposal.integrity.fingerprint,
            decision_id: decision.decision_id,
            decision_fingerprint: decision.integrity.fingerprint,
            gate_record_id: authorization.gate_record.gate_record_id,
            gate_record_fingerprint:
              authorization.gate_record.integrity.fingerprint,
            clock: fixedClockV01(
              cycleTimestampV01(100 + index, 6),
              cycleTimestampV01(100 + index, 7),
            ),
            test_options: {
              on_checkpoint(observed) {
                if (observed === checkpoint) {
                  throw new Error(`injected_sr3_failure:${checkpoint}`);
                }
              },
            },
          }),
        new RegExp(`injected_sr3_failure:${checkpoint}`),
      );
      assert.deepEqual(fullCountSnapshotV01(db), baseline);
    } finally {
      db.close();
    }
  }
}

function assertCanonicalGateAndDecisionHistoryResolutionV01(): void {
  const db = new Database(":memory:");
  try {
    ensureVNextDurableSemanticStoreSchemaV01(db);

    const reauthorized = createReviewedClaimLifecycleV01({
      db,
      familySeed: "expired-then-reauthorized",
      proposition:
        "An expired authorization can be followed by one exact current authorization.",
      cycle: 800,
    });
    const gateA = authorizeLifecycleGateV01({
      db,
      proposal: reauthorized.proposal,
      decision: reauthorized.decision,
      cycle: 800,
      gateTtlMs: 5_000,
      applierSuffix: "expired-a",
    }).authorization.gate_record;
    const gateB = authorizeLifecycleGateV01({
      db,
      proposal: reauthorized.proposal,
      decision: reauthorized.decision,
      cycle: 801,
      gateTtlMs: 30_000,
      applierSuffix: "reauthorized-b",
    }).authorization.gate_record;
    assert.notEqual(gateA.gate_record_id, gateB.gate_record_id);

    const beforePendingReads = fullCountSnapshotV01(db);
    const pendingObservedAt = cycleTimestampV01(801, 8);
    const pendingReconciliation = readProjectVerifyReconciliationV01(db, {
      workspace_id: WORKSPACE_ID,
      project_id: PROJECT_ID,
      observed_at: pendingObservedAt,
    });
    const pendingRevision = assertPresentV01(
      pendingReconciliation.claim_families
        .find(
          (family) =>
            family.claim_family_id === reauthorized.claim.claim_family_id,
        )
        ?.revisions.find(
          (revision) =>
            revision.claim_ref.record_id === reauthorized.claim.claim_id,
        ),
    );
    assert.equal(pendingRevision.lifecycle.decision.status, "accepted");
    assert.equal(pendingRevision.lifecycle.gate.status, "authorized");
    assert.equal(
      pendingRevision.lifecycle.gate.gate_ref?.record_id,
      gateB.gate_record_id,
    );
    assert.equal(pendingRevision.lifecycle.transition.status, "transition_missing");
    assert.equal(pendingRevision.lifecycle.conflicts.length, 0);
    const pendingLineage = readProjectVerifyLineageV01(db, {
      workspace_id: WORKSPACE_ID,
      project_id: PROJECT_ID,
      observed_at: pendingObservedAt,
      lookup: {
        lookup_kind: "claim",
        claim_id: reauthorized.claim.claim_id,
        expected_fingerprint: reauthorized.claim.integrity.fingerprint,
      },
    });
    assert.equal(pendingLineage.stop.reason, "gate_authorized_transition_pending");
    assert.equal(
      pendingLineage.nodes.some(
        (node) =>
          node.node_kind === "semantic_commit_gate" &&
          node.record_id === gateB.gate_record_id &&
          node.status === "gate_authorized",
      ),
      true,
    );
    assert.equal(
      pendingLineage.nodes.some(
        (node) =>
          node.node_kind === "semantic_commit_gate" &&
          node.record_id === gateA.gate_record_id,
      ),
      false,
      "the single-gate lineage projection selects the current valid reauthorization, not expired history",
    );
    assert.deepEqual(fullCountSnapshotV01(db), beforePendingReads);

    const applied = commitVNextSemanticTransitionV01(db, {
      workspace_id: WORKSPACE_ID,
      project_id: PROJECT_ID,
      proposal_id: reauthorized.proposal.proposal_id,
      proposal_fingerprint: reauthorized.proposal.integrity.fingerprint,
      decision_id: reauthorized.decision.decision_id,
      decision_fingerprint: reauthorized.decision.integrity.fingerprint,
      gate_record_id: gateB.gate_record_id,
      gate_record_fingerprint: gateB.integrity.fingerprint,
      clock: fixedClockV01(
        cycleTimestampV01(801, 9),
        cycleTimestampV01(801, 10),
      ),
    });
    assert.equal(applied.status, "applied");
    const appliedHead = assertPresentV01(
      readVNextSemanticTargetHeadV01(db, {
        workspace_id: WORKSPACE_ID,
        project_id: PROJECT_ID,
        target_key: deriveVNextSemanticTargetKeyV01(
          assertPresentV01(
            reauthorized.proposal.project_verify_lifecycle,
          ).lifecycle_binding.family_target_ref,
        ),
      }),
    );
    assert.equal(
      appliedHead.source_transition_receipt_id,
      applied.transition_receipt.transition_receipt_id,
    );
    const beforeAppliedReads = fullCountSnapshotV01(db);
    const appliedObservedAt = cycleTimestampV01(802, 0);
    const appliedReconciliation = readProjectVerifyReconciliationV01(db, {
      workspace_id: WORKSPACE_ID,
      project_id: PROJECT_ID,
      observed_at: appliedObservedAt,
    });
    const appliedRevision = assertPresentV01(
      appliedReconciliation.claim_families
        .find(
          (family) =>
            family.claim_family_id === reauthorized.claim.claim_family_id,
        )
        ?.revisions.find(
          (revision) =>
            revision.claim_ref.record_id === reauthorized.claim.claim_id,
        ),
    );
    assert.equal(appliedRevision.lifecycle.gate.status, "authorized");
    assert.equal(
      appliedRevision.lifecycle.gate.gate_ref?.record_id,
      gateB.gate_record_id,
    );
    assert.equal(appliedRevision.lifecycle.transition.status, "applied");
    assert.equal(appliedRevision.lifecycle.application.status, "applied_current");
    assert.equal(appliedRevision.lifecycle.conflicts.length, 0);
    const appliedLineage = readProjectVerifyLineageV01(db, {
      workspace_id: WORKSPACE_ID,
      project_id: PROJECT_ID,
      observed_at: appliedObservedAt,
      lookup: {
        lookup_kind: "claim",
        claim_id: reauthorized.claim.claim_id,
        expected_fingerprint: reauthorized.claim.integrity.fingerprint,
      },
    });
    assert.equal(appliedLineage.stop.reason, "transition_applied_packet_pending");
    assert.equal(
      appliedLineage.nodes.some(
        (node) =>
          node.node_kind === "semantic_commit_gate" &&
          node.record_id === gateB.gate_record_id,
      ),
      true,
    );
    assert.equal(
      appliedLineage.nodes.some(
        (node) =>
          node.node_kind === "state_transition_receipt_effect" &&
          node.record_id === applied.transition_receipt.transition_receipt_id,
      ),
      true,
    );
    assert.deepEqual(fullCountSnapshotV01(db), beforeAppliedReads);

    const expired = createReviewedClaimLifecycleV01({
      db,
      familySeed: "multiple-expired-gates",
      proposition:
        "Multiple expired authorization attempts remain immutable non-applying history.",
      cycle: 810,
    });
    const expiredGateA = authorizeLifecycleGateV01({
      db,
      proposal: expired.proposal,
      decision: expired.decision,
      cycle: 810,
      gateTtlMs: 5_000,
      applierSuffix: "expired-history-a",
    }).authorization.gate_record;
    const expiredGateB = authorizeLifecycleGateV01({
      db,
      proposal: expired.proposal,
      decision: expired.decision,
      cycle: 811,
      gateTtlMs: 5_000,
      applierSuffix: "expired-history-b",
    }).authorization.gate_record;
    db.prepare(
      `INSERT INTO vnext_core_records (
         record_kind, record_id, workspace_id, project_id, fingerprint,
         idempotency_key, payload_json, created_at
       )
       SELECT record_kind, ?, workspace_id, ?, fingerprint,
              idempotency_key, payload_json, created_at
       FROM vnext_core_records
       WHERE record_kind = 'semantic_commit_gate' AND record_id = ?`,
    ).run(
      `foreign-project:${expiredGateA.gate_record_id}`,
      OTHER_PROJECT_ID,
      expiredGateA.gate_record_id,
    );
    const beforeExpiredReads = fullCountSnapshotV01(db);
    const expiredObservedAt = cycleTimestampV01(812, 0);
    const expiredReconciliation = readProjectVerifyReconciliationV01(db, {
      workspace_id: WORKSPACE_ID,
      project_id: PROJECT_ID,
      observed_at: expiredObservedAt,
    });
    const expiredRevision = assertPresentV01(
      expiredReconciliation.claim_families
        .find(
          (family) => family.claim_family_id === expired.claim.claim_family_id,
        )
        ?.revisions.find(
          (revision) => revision.claim_ref.record_id === expired.claim.claim_id,
        ),
    );
    assert.equal(expiredRevision.lifecycle.gate.status, "expired");
    assert.equal(
      expiredRevision.lifecycle.gate.gate_ref?.record_id,
      expiredGateB.gate_record_id,
      "the newest confirmed expired gate is selected only for deterministic history display",
    );
    assert.equal(expiredRevision.lifecycle.conflicts.length, 0);
    const expiredLineage = readProjectVerifyLineageV01(db, {
      workspace_id: WORKSPACE_ID,
      project_id: PROJECT_ID,
      observed_at: expiredObservedAt,
      lookup: {
        lookup_kind: "claim",
        claim_id: expired.claim.claim_id,
        expected_fingerprint: expired.claim.integrity.fingerprint,
      },
    });
    assert.equal(
      expiredLineage.stop.reason,
      "gate_expired_transition_not_applied",
    );
    assert.equal(
      expiredLineage.stop.exact_ref?.record_id,
      expiredGateB.gate_record_id,
    );
    assert.equal(
      expiredLineage.nodes.some(
        (node) => node.record_id === `foreign-project:${expiredGateA.gate_record_id}`,
      ),
      false,
      "cross-project secondary gate material never enters the exact project chain",
    );
    assert.deepEqual(fullCountSnapshotV01(db), beforeExpiredReads);

    const competing = createReviewedClaimLifecycleV01({
      db,
      familySeed: "simultaneous-valid-gates",
      proposition:
        "Simultaneously valid pending authorizations remain explicitly ambiguous.",
      cycle: 820,
    });
    authorizeLifecycleGateV01({
      db,
      proposal: competing.proposal,
      decision: competing.decision,
      cycle: 820,
      gateTtlMs: 300_000,
      applierSuffix: "simultaneous-a",
    });
    authorizeLifecycleGateV01({
      db,
      proposal: competing.proposal,
      decision: competing.decision,
      cycle: 821,
      gateTtlMs: 300_000,
      applierSuffix: "simultaneous-b",
    });
    const beforeCompetingReads = fullCountSnapshotV01(db);
    const competingObservedAt = cycleTimestampV01(822, 0);
    const competingReconciliation = readProjectVerifyReconciliationV01(db, {
      workspace_id: WORKSPACE_ID,
      project_id: PROJECT_ID,
      observed_at: competingObservedAt,
    });
    const competingRevision = assertPresentV01(
      competingReconciliation.claim_families
        .find(
          (family) =>
            family.claim_family_id === competing.claim.claim_family_id,
        )
        ?.revisions.find(
          (revision) =>
            revision.claim_ref.record_id === competing.claim.claim_id,
        ),
    );
    assert.equal(competingRevision.lifecycle.decision.status, "accepted");
    assert.equal(competingRevision.lifecycle.gate.status, "source_conflict");
    assert.equal(competingRevision.lifecycle.gate.gate_ref, null);
    assert.equal(
      competingRevision.lifecycle.conflicts.some(
        (conflict) =>
          conflict.code === "project_verify_competing_gate_authorization",
      ),
      true,
    );
    const competingLineage = readProjectVerifyLineageV01(db, {
      workspace_id: WORKSPACE_ID,
      project_id: PROJECT_ID,
      observed_at: competingObservedAt,
      lookup: {
        lookup_kind: "claim",
        claim_id: competing.claim.claim_id,
        expected_fingerprint: competing.claim.integrity.fingerprint,
      },
    });
    assert.equal(competingLineage.stop.reason, "source_conflict");
    assert.deepEqual(fullCountSnapshotV01(db), beforeCompetingReads);

    const reviewedTwice = createReviewedClaimLifecycleV01({
      db,
      familySeed: "review-decision-history",
      proposition:
        "Historical review decisions coexist until an exact gate or Transition selects one chain.",
      cycle: 830,
      decision: "reject",
    });
    const laterAccept = decisionV01({
      proposal: reviewedTwice.proposal,
      decision: "accept",
      priorDecision: null,
      cycle: 831,
    });
    persistVNextSemanticReviewMaterialV01(db, {
      proposal: reviewedTwice.proposal,
      decision: laterAccept,
    });
    const ambiguousDecisionRead = readProjectVerifyReconciliationV01(db, {
      workspace_id: WORKSPACE_ID,
      project_id: PROJECT_ID,
      observed_at: cycleTimestampV01(831, 8),
    });
    const ambiguousDecisionRevision = assertPresentV01(
      ambiguousDecisionRead.claim_families
        .find(
          (family) =>
            family.claim_family_id === reviewedTwice.claim.claim_family_id,
        )
        ?.revisions.find(
          (revision) =>
            revision.claim_ref.record_id === reviewedTwice.claim.claim_id,
        ),
    );
    assert.equal(ambiguousDecisionRevision.lifecycle.decision.status, "conflict");
    assert.equal(
      ambiguousDecisionRevision.lifecycle.conflicts.some(
        (conflict) =>
          conflict.code === "project_verify_decision_lineage_ambiguous",
      ),
      true,
      "the authority permits multiple immutable decisions, so an ungated pending read remains genuinely ambiguous",
    );
    const selectedDecisionGate = authorizeLifecycleGateV01({
      db,
      proposal: reviewedTwice.proposal,
      decision: laterAccept,
      cycle: 832,
      gateTtlMs: 30_000,
      applierSuffix: "decision-selected-by-gate",
    }).authorization.gate_record;
    const selectedDecisionRead = readProjectVerifyReconciliationV01(db, {
      workspace_id: WORKSPACE_ID,
      project_id: PROJECT_ID,
      observed_at: cycleTimestampV01(832, 8),
    });
    const selectedDecisionRevision = assertPresentV01(
      selectedDecisionRead.claim_families
        .find(
          (family) =>
            family.claim_family_id === reviewedTwice.claim.claim_family_id,
        )
        ?.revisions.find(
          (revision) =>
            revision.claim_ref.record_id === reviewedTwice.claim.claim_id,
        ),
    );
    assert.equal(selectedDecisionRevision.lifecycle.decision.status, "accepted");
    assert.equal(
      selectedDecisionRevision.lifecycle.decision.decision_ref?.record_id,
      laterAccept.decision_id,
    );
    assert.equal(
      selectedDecisionRevision.lifecycle.gate.gate_ref?.record_id,
      selectedDecisionGate.gate_record_id,
    );
    assert.equal(selectedDecisionRevision.lifecycle.conflicts.length, 0);
  } finally {
    db.close();
  }

  const forgedDb = new Database(":memory:");
  try {
    ensureVNextDurableSemanticStoreSchemaV01(forgedDb);
    const forged = createReviewedClaimLifecycleV01({
      db: forgedDb,
      familySeed: "forged-secondary-gate",
      proposition: "A forged historical gate must fail the complete read chain.",
      cycle: 840,
    });
    const validGate = authorizeLifecycleGateV01({
      db: forgedDb,
      proposal: forged.proposal,
      decision: forged.decision,
      cycle: 840,
      gateTtlMs: 5_000,
      applierSuffix: "forged-history-valid",
    }).authorization.gate_record;
    authorizeLifecycleGateV01({
      db: forgedDb,
      proposal: forged.proposal,
      decision: forged.decision,
      cycle: 841,
      gateTtlMs: 30_000,
      applierSuffix: "forged-history-current",
    });
    forgedDb.exec("DROP TRIGGER trg_vnext_core_records_immutable_update");
    forgedDb
      .prepare(
        `UPDATE vnext_core_records
         SET payload_json = json_set(
           payload_json,
           '$.semantic_commit_gate_evaluation.decision_fingerprint',
           ?
         )
         WHERE record_kind = 'semantic_commit_gate' AND record_id = ?`,
      )
      .run(`sha256:${"f".repeat(64)}`, validGate.gate_record_id);
    forgedDb.exec(`CREATE TRIGGER trg_vnext_core_records_immutable_update
      BEFORE UPDATE ON vnext_core_records
      BEGIN SELECT RAISE(ABORT, 'vnext_core_records_immutable'); END`);
    const beforeForgedRead = fullCountSnapshotV01(forgedDb);
    assert.throws(
      () =>
        readProjectVerifyReconciliationV01(forgedDb, {
          workspace_id: WORKSPACE_ID,
          project_id: PROJECT_ID,
          observed_at: cycleTimestampV01(841, 8),
        }),
      /semantic_commit_gate|project_verify_protocol_envelope_conflict|persisted_semantic_commit_gate/,
      "a forged secondary gate fails closed instead of being ignored by count or ordering",
    );
    assert.deepEqual(fullCountSnapshotV01(forgedDb), beforeForgedRead);
  } finally {
    forgedDb.close();
  }
}

function assertSerializedCrossConnectionReplayV01(): void {
  const directory = mkdtempSync(join(tmpdir(), "augnes-sr3-lifecycle-"));
  const databasePath = join(directory, "lifecycle.sqlite");
  const first = new Database(databasePath);
  let second: Database.Database | null = null;
  try {
    ensureVNextDurableSemanticStoreSchemaV01(first);
    const competingDb = new Database(databasePath);
    second = competingDb;
    ensureVNextDurableSemanticStoreSchemaV01(competingDb);
    const claim = claimV01({
      revision: 1,
      prior: null,
      operation: "create",
      proposition:
        "Serialized duplicate application preserves one canonical family head.",
      familySeed: "serialized-cross-connection",
    });
    admitClaimRecordV01(first, {
      workspace_id: WORKSPACE_ID,
      project_id: PROJECT_ID,
      claim,
    });
    const material = materializeProjectVerifyClaimLifecycleProposalV01(first, {
      workspace_id: WORKSPACE_ID,
      project_id: PROJECT_ID,
      claim_id: claim.claim_id,
    });
    const competingMaterial = materializeProjectVerifyClaimLifecycleProposalV01(
      competingDb,
      {
        workspace_id: WORKSPACE_ID,
        project_id: PROJECT_ID,
        claim_id: claim.claim_id,
      },
    );
    assert.deepEqual(competingMaterial, material);
    assert.equal(
      admitProjectVerifyLifecycleProposalV01(first, material).status,
      "inserted",
    );
    assert.equal(
      admitProjectVerifyLifecycleProposalV01(competingDb, competingMaterial)
        .status,
      "exact_replay",
    );

    const firstDecision = decisionV01({
      proposal: material.proposal,
      priorDecision: null,
      cycle: 150,
    });
    const competingDecision = decisionV01({
      proposal: material.proposal,
      priorDecision: null,
      cycle: 151,
    });
    persistVNextSemanticReviewMaterialV01(first, {
      proposal: material.proposal,
      decision: firstDecision,
    });
    persistVNextSemanticReviewMaterialV01(competingDb, {
      proposal: material.proposal,
      decision: competingDecision,
    });
    const firstPreview = prepareVNextSemanticCommitPreviewV01(first, {
      workspace_id: WORKSPACE_ID,
      project_id: PROJECT_ID,
      proposal_id: material.proposal.proposal_id,
      proposal_fingerprint: material.proposal.integrity.fingerprint,
      decision_id: firstDecision.decision_id,
      decision_fingerprint: firstDecision.integrity.fingerprint,
      authorized_applier_identity: {
        ref_type: "semantic_transition_applier",
        external_id: "local-core-applier:sr3:race:first",
      },
      gate_ttl_ms: 300_000,
      clock: fixedClockV01(
        cycleTimestampV01(150, 1),
        cycleTimestampV01(150, 2),
      ),
    });
    const competingPreview = prepareVNextSemanticCommitPreviewV01(competingDb, {
      workspace_id: WORKSPACE_ID,
      project_id: PROJECT_ID,
      proposal_id: material.proposal.proposal_id,
      proposal_fingerprint: material.proposal.integrity.fingerprint,
      decision_id: competingDecision.decision_id,
      decision_fingerprint: competingDecision.integrity.fingerprint,
      authorized_applier_identity: {
        ref_type: "semantic_transition_applier",
        external_id: "local-core-applier:sr3:race:competing",
      },
      gate_ttl_ms: 300_000,
      clock: fixedClockV01(
        cycleTimestampV01(151, 1),
        cycleTimestampV01(151, 2),
      ),
    });
    const firstObservation = assertPresentV01(
      firstPreview.current_state_observations[0],
    );
    const competingObservation = assertPresentV01(
      competingPreview.current_state_observations[0],
    );
    assert.equal(firstPreview.current_state_observations.length, 1);
    assert.equal(competingPreview.current_state_observations.length, 1);
    assert.deepEqual(
      firstObservation.target_ref,
      competingObservation.target_ref,
    );
    assert.equal(firstObservation.presence, "absent");
    assert.equal(competingObservation.presence, "absent");
    assert.equal(firstObservation.state_ref, null);
    assert.equal(competingObservation.state_ref, null);
    assert.equal(firstObservation.state_fingerprint, null);
    assert.equal(competingObservation.state_fingerprint, null);
    const firstAuthorization = recordVNextSemanticCommitAuthorizationV01(
      first,
      {
        preview: firstPreview,
        confirmation_digest: firstPreview.confirmation_digest,
        operator_actor_ref: firstDecision.actor_ref,
        clock: fixedClockV01(
          cycleTimestampV01(150, 3),
          cycleTimestampV01(150, 4),
          cycleTimestampV01(150, 5),
        ),
      },
    );
    const competingAuthorization = recordVNextSemanticCommitAuthorizationV01(
      competingDb,
      {
        preview: competingPreview,
        confirmation_digest: competingPreview.confirmation_digest,
        operator_actor_ref: competingDecision.actor_ref,
        clock: fixedClockV01(
          cycleTimestampV01(151, 3),
          cycleTimestampV01(151, 4),
          cycleTimestampV01(151, 5),
        ),
      },
    );
    const alternateGatePreview = prepareVNextSemanticCommitPreviewV01(
      competingDb,
      {
        workspace_id: WORKSPACE_ID,
        project_id: PROJECT_ID,
        proposal_id: material.proposal.proposal_id,
        proposal_fingerprint: material.proposal.integrity.fingerprint,
        decision_id: firstDecision.decision_id,
        decision_fingerprint: firstDecision.integrity.fingerprint,
        authorized_applier_identity: {
          ref_type: "semantic_transition_applier",
          external_id: "local-core-applier:sr3:race:first-alternate-gate",
        },
        gate_ttl_ms: 300_000,
        clock: fixedClockV01(
          cycleTimestampV01(150, 10),
          cycleTimestampV01(150, 11),
        ),
      },
    );
    const alternateGateAuthorization =
      recordVNextSemanticCommitAuthorizationV01(competingDb, {
        preview: alternateGatePreview,
        confirmation_digest: alternateGatePreview.confirmation_digest,
        operator_actor_ref: firstDecision.actor_ref,
        clock: fixedClockV01(
          cycleTimestampV01(150, 12),
          cycleTimestampV01(150, 13),
          cycleTimestampV01(150, 14),
        ),
      });
    assert.notEqual(
      alternateGateAuthorization.gate_record.gate_record_id,
      firstAuthorization.gate_record.gate_record_id,
    );
    const firstCommitInput = {
      workspace_id: WORKSPACE_ID,
      project_id: PROJECT_ID,
      proposal_id: material.proposal.proposal_id,
      proposal_fingerprint: material.proposal.integrity.fingerprint,
      decision_id: firstDecision.decision_id,
      decision_fingerprint: firstDecision.integrity.fingerprint,
      gate_record_id: firstAuthorization.gate_record.gate_record_id,
      gate_record_fingerprint:
        firstAuthorization.gate_record.integrity.fingerprint,
      clock: fixedClockV01(
        cycleTimestampV01(152, 0),
        cycleTimestampV01(152, 1),
      ),
    };
    const applied = commitVNextSemanticTransitionV01(first, firstCommitInput);
    assert.equal(applied.status, "applied");
    const afterFirstCommit = fullCountSnapshotV01(first);
    assert.throws(
      () =>
        commitVNextSemanticTransitionV01(competingDb, {
          workspace_id: WORKSPACE_ID,
          project_id: PROJECT_ID,
          proposal_id: material.proposal.proposal_id,
          proposal_fingerprint: material.proposal.integrity.fingerprint,
          decision_id: competingDecision.decision_id,
          decision_fingerprint: competingDecision.integrity.fingerprint,
          gate_record_id: competingAuthorization.gate_record.gate_record_id,
          gate_record_fingerprint:
            competingAuthorization.gate_record.integrity.fingerprint,
          clock: fixedClockV01(
            cycleTimestampV01(152, 2),
            cycleTimestampV01(152, 3),
          ),
        }),
      /project_verify_lifecycle_current_head_expectation_conflict|semantic_commit_gate_current_state_changed/,
      "one of two competing authorized applications loses the live family-head CAS",
    );
    assert.deepEqual(fullCountSnapshotV01(competingDb), afterFirstCommit);

    const replay = commitVNextSemanticTransitionV01(competingDb, {
      ...firstCommitInput,
      clock: fixedClockV01(
        cycleTimestampV01(152, 0),
        cycleTimestampV01(152, 1),
      ),
    });
    assert.equal(replay.status, "exact_replay");
    assert.deepEqual(replay.transition_receipt, applied.transition_receipt);
    assert.equal(countRowsV01(competingDb, "vnext_semantic_target_heads"), 1);
    assert.equal(countRowsV01(competingDb, "vnext_semantic_state_entries"), 1);
    const reconciliation = readProjectVerifyReconciliationV01(competingDb, {
      workspace_id: WORKSPACE_ID,
      project_id: PROJECT_ID,
      observed_at: cycleTimestampV01(153, 0),
    });
    const revision = assertPresentV01(
      reconciliation.claim_families
        .find((family) => family.claim_family_id === claim.claim_family_id)
        ?.revisions.find(
          (candidate) => candidate.claim.claim_id === claim.claim_id,
        ),
    );
    assert.equal(revision.lifecycle.decision.status, "accepted");
    assert.equal(revision.lifecycle.gate.status, "authorized");
    assert.equal(revision.lifecycle.transition.status, "applied");
    assert.equal(revision.lifecycle.application.status, "applied_current");
    assert.equal(revision.lifecycle.conflicts.length, 0);
    assert.equal(
      revision.lifecycle.decision.decision_ref?.record_id,
      firstDecision.decision_id,
      "the exact receipt-selected decision remains canonical alongside the losing historical attempt",
    );
    assert.equal(
      revision.lifecycle.gate.gate_ref?.record_id,
      firstAuthorization.gate_record.gate_record_id,
      "the exact receipt-selected gate remains canonical alongside unused valid gates",
    );
    const lineage = readProjectVerifyLineageV01(competingDb, {
      workspace_id: WORKSPACE_ID,
      project_id: PROJECT_ID,
      observed_at: cycleTimestampV01(153, 0),
      lookup: {
        lookup_kind: "claim",
        claim_id: claim.claim_id,
        expected_fingerprint: claim.integrity.fingerprint,
      },
    });
    assert.equal(lineage.stop.reason, "transition_applied_packet_pending");
    assert.equal(
      lineage.nodes.some(
        (node) =>
          node.node_kind === "state_transition_receipt_effect" &&
          node.record_id === applied.transition_receipt.transition_receipt_id,
      ),
      true,
    );
  } finally {
    second?.close();
    first.close();
    rmSync(directory, { recursive: true, force: true });
  }
}

function assertReceiptSelectedSourcesIgnoreHistoricalMultiplicityV01(): void {
  const db = new Database(":memory:");
  try {
    ensureVNextDurableSemanticStoreSchemaV01(db);
    const claim = claimV01({
      revision: 1,
      prior: null,
      operation: "create",
      proposition:
        "The receipt-selected Decision and gate remain canonical alongside bounded historical attempts.",
      familySeed: "receipt-selected-source-history",
    });
    admitClaimRecordV01(db, {
      workspace_id: WORKSPACE_ID,
      project_id: PROJECT_ID,
      claim,
    });
    const material = materializeProjectVerifyClaimLifecycleProposalV01(db, {
      workspace_id: WORKSPACE_ID,
      project_id: PROJECT_ID,
      claim_id: claim.claim_id,
    });
    admitProjectVerifyLifecycleProposalV01(db, material);

    const decisions = Array.from({ length: 4 }, (_, index) =>
      decisionV01({
        proposal: material.proposal,
        priorDecision: null,
        cycle: 760 + index,
      }),
    );
    for (const decision of decisions) {
      persistVNextSemanticReviewMaterialV01(db, {
        proposal: material.proposal,
        decision,
      });
    }
    const appliedDecision = assertPresentV01(decisions.at(-1));
    const authorizations: VNextSemanticCommitAuthorizationResultV01[] = [];
    for (let index = 0; index < 4; index += 1) {
      const cycle = 764 + index;
      const preview = prepareVNextSemanticCommitPreviewV01(db, {
        workspace_id: WORKSPACE_ID,
        project_id: PROJECT_ID,
        proposal_id: material.proposal.proposal_id,
        proposal_fingerprint: material.proposal.integrity.fingerprint,
        decision_id: appliedDecision.decision_id,
        decision_fingerprint: appliedDecision.integrity.fingerprint,
        authorized_applier_identity: {
          ref_type: "semantic_transition_applier",
          external_id: `local-core-applier:competitor-bound:${index}`,
        },
        gate_ttl_ms: 300_000,
        clock: fixedClockV01(
          cycleTimestampV01(cycle, 1),
          cycleTimestampV01(cycle, 2),
        ),
      });
      authorizations.push(
        recordVNextSemanticCommitAuthorizationV01(db, {
          preview,
          confirmation_digest: preview.confirmation_digest,
          operator_actor_ref: appliedDecision.actor_ref,
          clock: fixedClockV01(
            cycleTimestampV01(cycle, 3),
            cycleTimestampV01(cycle, 4),
            cycleTimestampV01(cycle, 5),
          ),
        }),
      );
    }
    const appliedGate = assertPresentV01(authorizations.at(-1)).gate_record;
    const committed = commitVNextSemanticTransitionV01(db, {
      workspace_id: WORKSPACE_ID,
      project_id: PROJECT_ID,
      proposal_id: material.proposal.proposal_id,
      proposal_fingerprint: material.proposal.integrity.fingerprint,
      decision_id: appliedDecision.decision_id,
      decision_fingerprint: appliedDecision.integrity.fingerprint,
      gate_record_id: appliedGate.gate_record_id,
      gate_record_fingerprint: appliedGate.integrity.fingerprint,
      clock: fixedClockV01(
        cycleTimestampV01(768, 0),
        cycleTimestampV01(768, 1),
      ),
    });
    assert.equal(committed.status, "applied");

    const reconciliation = readProjectVerifyReconciliationV01(db, {
      workspace_id: WORKSPACE_ID,
      project_id: PROJECT_ID,
      observed_at: cycleTimestampV01(769, 0),
    });
    const revision = assertPresentV01(
      reconciliation.claim_families
        .find((family) => family.claim_family_id === claim.claim_family_id)
        ?.revisions.find(
          (candidate) => candidate.claim_ref.record_id === claim.claim_id,
        ),
    );
    assert.equal(revision.lifecycle.application.status, "applied_current");
    assert.equal(revision.lifecycle.transition.status, "applied");
    assert.equal(
      revision.lifecycle.decision.decision_ref?.record_id,
      appliedDecision.decision_id,
    );
    assert.equal(
      revision.lifecycle.gate.gate_ref?.record_id,
      appliedGate.gate_record_id,
    );
    assert.equal(
      revision.lifecycle.conflicts.length,
      0,
      "validated historical decisions and unused gates do not conflict with the exact receipt-selected chain",
    );
  } finally {
    db.close();
  }
}

function assertHistoricalStateCompatibilityV01(): void {
  const fixture = buildSemanticTransitionLoopFixtureV01(
    semanticReviewLoopProjectAFixture,
  );
  const candidate = assertPresentV01(fixture.proposal.proposed_deltas[0]);
  const target = assertPresentV01(candidate.target_refs[0]);
  const state = buildVNextPersistedSemanticStateV01({
    proposal: fixture.proposal,
    candidate_id: candidate.candidate_id,
    target_ref: target,
    source_decision: {
      decision_id: fixture.decision.decision_id,
      decision_fingerprint: fixture.decision.integrity.fingerprint,
    },
    created_at: fixture.transition_receipt.recorded_at,
  });
  assert.equal(state.state_content.project_verify_lifecycle_binding, undefined);
  assert.deepEqual(rebuildVNextPersistedSemanticStateV01(state), state);
}

function stateCountSnapshotV01(db: Database.Database) {
  return {
    semantic_state_entries: countRowsV01(db, "vnext_semantic_state_entries"),
    semantic_target_heads: countRowsV01(db, "vnext_semantic_target_heads"),
    semantic_state_records: countCoreRecordsV01(db, "semantic_state"),
    transition_receipts: countCoreRecordsV01(db, "state_transition_receipt"),
  };
}

function fullCountSnapshotV01(db: Database.Database) {
  return {
    core_records: countRowsV01(db, "vnext_core_records"),
    ...stateCountSnapshotV01(db),
  };
}

function countRowsV01(db: Database.Database, table: string): number {
  return (
    db.prepare(`SELECT COUNT(*) AS count FROM ${table}`).get() as {
      count: number;
    }
  ).count;
}

function countCoreRecordsV01(db: Database.Database, kind: string): number {
  return (
    db
      .prepare(
        "SELECT COUNT(*) AS count FROM vnext_core_records WHERE record_kind = ?",
      )
      .get(kind) as { count: number }
  ).count;
}

function fixedClockV01(...timestamps: string[]) {
  assert(timestamps.length > 0);
  let index = 0;
  return {
    now() {
      const value = timestamps[Math.min(index, timestamps.length - 1)]!;
      if (index < timestamps.length - 1) index += 1;
      return value;
    },
  };
}

function timestampV01(index: number, offsetSeconds: number): string {
  return new Date(
    Date.parse(BASE_AT) + index * 10_000 + offsetSeconds * 1_000,
  ).toISOString();
}

function cycleTimestampV01(cycle: number, offsetSeconds: number): string {
  return new Date(
    Date.parse(BASE_AT) + cycle * 60_000 + offsetSeconds * 1_000,
  ).toISOString();
}

function assertPresentV01<T>(value: T | null | undefined): T {
  assert(value !== null && value !== undefined);
  return value;
}

function assertStructuralSourceImportBoundaryV01(): void {
  const repositoryRoot = process.cwd();
  const vnextRoot = join(repositoryRoot, "lib", "vnext");
  const files: string[] = [];
  const visit = (directory: string): void => {
    for (const entry of readdirSync(directory)) {
      const path = join(directory, entry);
      if (statSync(path).isDirectory()) visit(path);
      else if (path.endsWith(".ts")) files.push(path);
    }
  };
  visit(vnextRoot);
  const importers = files
    .filter((path) =>
      readFileSync(path, "utf8").includes(
        'from "@/lib/vnext/persistence/project-verify-lifecycle-source"',
      ),
    )
    .map((path) => path.slice(repositoryRoot.length + 1))
    .sort();
  assert.deepEqual(importers, [
    "lib/vnext/persistence/project-verify-lifecycle-admission.ts",
    "lib/vnext/runtime/durable-semantic-transition.ts",
    "lib/vnext/runtime/project-verify-reconciliation.ts",
  ]);
  const locatorImporters = files
    .filter(
      (path) =>
        !path.endsWith(
          "lib/vnext/persistence/project-verify-lifecycle-source.ts",
        ) &&
        readFileSync(path, "utf8").includes(
          "readProjectVerifyLifecycleProposalLocatorOnlyV01",
        ),
    )
    .map((path) => path.slice(repositoryRoot.length + 1))
    .sort();
  assert.deepEqual(locatorImporters, [
    "lib/vnext/persistence/project-verify-lifecycle-admission.ts",
    "lib/vnext/runtime/durable-semantic-transition.ts",
    "lib/vnext/runtime/project-verify-reconciliation.ts",
  ]);
  const structuralReaderImporters = files
    .filter(
      (path) =>
        !path.endsWith(
          "lib/vnext/persistence/project-verify-lifecycle-source.ts",
        ) &&
        readFileSync(path, "utf8").includes(
          "readProjectVerifyLifecycleProposalStructuralOnlyV01",
        ),
    )
    .map((path) => path.slice(repositoryRoot.length + 1))
    .sort();
  assert.deepEqual(structuralReaderImporters, []);
  const reconciliationSource = readFileSync(
    join(
      repositoryRoot,
      "lib/vnext/runtime/project-verify-reconciliation.ts",
    ),
    "utf8",
  );
  assert.equal(
    reconciliationSource.includes(
      "readProjectVerifyLifecycleProposalStructuralOnlyV01",
    ),
    false,
  );
  assert.equal(
    reconciliationSource.includes(
      "assertProjectVerifyLifecycleProposalFullSourceBoundV01",
    ),
    true,
    "zero-receipt and ambiguous-receipt projection retains the full source gate",
  );
  const structuralSource = readFileSync(
    join(
      repositoryRoot,
      "lib/vnext/persistence/project-verify-lifecycle-source.ts",
    ),
    "utf8",
  );
  assert.equal(
    /export (?:function|const) assertPersistedProjectVerifyLifecycleProposalSourceBoundV01/u.test(
      structuralSource,
    ),
    false,
  );
  assert.equal(
    /export function readProjectVerifyLifecycleCurrentHeadExpectationV01/u.test(
      structuralSource,
    ),
    false,
  );
}

let unexpectedExternalCalls = 0;
const originalFetch = globalThis.fetch;
globalThis.fetch = (async () => {
  unexpectedExternalCalls += 1;
  throw new Error("sr3_project_verify_unexpected_external_call");
}) as typeof globalThis.fetch;

const operatorAdapterOnly = process.argv
  .slice(2)
  .includes("--operator-adapter-only");

try {
  if (operatorAdapterOnly) {
    assertOperatorPilotProjectVerifyDecisionAdapterV01();
    assert.equal(unexpectedExternalCalls, 0);
    process.stdout.write(
      `${JSON.stringify({
        suite: "vnext-project-verify-operator-adapter-v0.1",
        status: "passed",
        operator_workbench_lifecycle_decision_adapter_checked: [
          "accept_create",
          "accept_revise",
          "supersede",
          "retract",
          "wrong_applying_decision_refused",
          "exact_replay",
        ],
        exact_prior_decision_lineage_checked: true,
        transition_application_separate_checked: true,
        immutable_retraction_history_checked: true,
        unexpected_network_or_provider_calls: unexpectedExternalCalls,
      })}\n`,
    );
  } else {
    assertStructuralSourceImportBoundaryV01();
    assertClaimLifecycleV01();
    assertRelationLifecycleV01();
  assertIndependentRelationMaterialCoexistenceV01();
  assertApplicabilityGroupingV01();
  assertBoundedReadIncompletenessV01();
  assertFocusedAggregateExpansionBoundV01();
  assertReadInputBoundsV01();
  assertLifecycleRefusalMatrixV01();
  assertExactLineageStopsV01();
  assertLifecycleRestoreAndForgeryV01();
  assertPriorLifecycleSourceChainRequiredV01();
  assertHistoricalAppliedStateRequiredV01();
  assertRollbackCheckpointsV01();
  assertCanonicalGateAndDecisionHistoryResolutionV01();
  assertSerializedCrossConnectionReplayV01();
  assertReceiptSelectedSourcesIgnoreHistoricalMultiplicityV01();
  assertHistoricalStateCompatibilityV01();
  assert.equal(unexpectedExternalCalls, 0);
  process.stdout.write(
    `${JSON.stringify({
      suite: "vnext-project-verify-lifecycle-v0.1",
      status: "passed",
      exact_lifecycle_proposal_admission_replay_checked: true,
      reject_defer_and_gate_non_actuation_checked: true,
      claim_create_revise_supersede_retract_checked: true,
      relation_create_revise_supersede_retract_checked: true,
      independent_applied_relation_coexistence_checked: [
        "supports",
        "opposes",
        "contradicts",
        "qualifies",
        "insufficient",
      ],
      pending_and_applied_relation_material_separated: true,
      exact_overlap_preserves_independent_family_heads: true,
      unknown_scope_overlap_reported_without_inference: true,
      bounded_reconciliation_and_lineage_incompleteness_checked: true,
      focused_aggregate_expansion_bound_checked: true,
      reserved_family_target_without_profile_refused: true,
      direct_review_without_canonical_lifecycle_admission_refused: true,
      changed_relation_endpoint_source_refused: true,
      lifecycle_decision_target_selected_record_and_head_refusal_checked: true,
      exact_lineage_truthful_stops_checked: [
        "candidate_recorded_no_proposal",
        "proposal_pending_review",
        "review_rejected",
        "review_deferred",
        "decision_recorded_gate_pending",
        "gate_authorized_transition_pending",
        "transition_applied_packet_pending",
      ],
      lifecycle_backup_restore_projection_identity_checked: true,
      restored_forged_lifecycle_state_read_refused: true,
      transplanted_prior_state_without_complete_source_chain_refused: true,
      exact_state_binding_and_single_family_head_checked: true,
      transition_exact_replay_checked: true,
      call_local_transition_read_session_boundaries_checked: true,
      intermediate_revision_skip_refused: true,
      project_isolation_checked: true,
      rollback_checkpoints_checked: [
        ...VNEXT_SEMANTIC_TRANSITION_TEST_FAILURE_CHECKPOINTS_V01,
      ].filter((checkpoint) =>
        [
          "after_first_state_record_insert",
          "after_first_projection_write",
          "before_receipt_insert",
          "after_receipt_insert_before_commit",
        ].includes(checkpoint),
      ),
      canonical_gate_history_resolution_checked: [
        "expired_then_reauthorized_pending",
        "expired_then_reauthorized_applied",
        "multiple_expired_history",
        "simultaneously_unexpired_conflict",
        "forged_secondary_gate_refusal",
        "cross_project_secondary_gate_exclusion",
      ],
      review_decision_multiplicity_resolved_by_exact_gate_or_transition: true,
      serialized_cross_connection_exact_replay_checked: true,
      competing_authorized_family_cas_checked: true,
      receipt_selected_sources_ignore_historical_multiplicity_checked: true,
      historical_generic_state_compatibility_checked: true,
      reconciliation_read_only_lifecycle_projection_checked: true,
      claim_truth_not_established_checked: true,
      relation_existence_non_proof_checked: true,
      unexpected_network_or_provider_calls: unexpectedExternalCalls,
      })}\n`,
    );
  }
} finally {
  globalThis.fetch = originalFetch;
}
