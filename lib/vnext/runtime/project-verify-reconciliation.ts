import type Database from "better-sqlite3";

import {
  validateContextUseReviewRelationsV01,
  validateContextUseReviewV01,
} from "@/lib/vnext/context-use-review";
import {
  assertVNextCoreRecordMatchesProtocolPayloadBindingV01,
  assertVNextDurableSemanticStoreSchemaV01,
  countVNextCoreRecordsV01,
  deriveVNextSemanticTargetKeyV01,
  listVNextCoreRecordsV01,
  readVNextCoreRecordV01,
  readVNextSemanticStateEntryV01,
  readVNextSemanticTargetHeadV01,
  rebuildVNextPersistedSemanticStateV01,
  type VNextCoreRecordEnvelopeV01,
  type VNextPersistedSemanticStateVersionV01,
  type VNextSemanticStateProjectionEntryV01,
  type VNextSemanticTargetHeadV01,
} from "@/lib/vnext/persistence/durable-semantic-store";
import { assertPersistedRunAssessmentProposalSourceBoundV01 } from "@/lib/vnext/persistence/episode-delta-proposal-admission";
import { readProjectVerifyLifecycleProposalByIdentityV01 } from "@/lib/vnext/persistence/project-verify-lifecycle-admission";
import {
  listClaimEvidenceRelationFamilyRevisionsV01,
  listClaimFamilyRevisionsV01,
  listRelationsForExactClaimV01,
  listRelationsForExactEvidenceV01,
  listProjectClaimRecordsV01,
  listProjectEvidenceRecordsV01,
  readClaimRecordV01,
  readClaimEvidenceRelationV01,
  readEvidenceRecordV01,
} from "@/lib/vnext/persistence/project-verify-material-store";
import { compareProjectVerifyApplicabilityScopesV01 } from "@/lib/vnext/project-verify-applicability";
import {
  deriveProjectVerifyLifecycleProposalAdmissionIdentityV01,
  type ProjectVerifyLifecycleSelectedRecordV01,
} from "@/lib/vnext/project-verify-lifecycle";
import {
  createProjectVerifyFamilyOriginFingerprintV01,
  createProjectVerifyFamilyTargetRefV01,
} from "@/lib/vnext/project-verify-lifecycle-protocol";
import {
  canonicalizeProtocolValueV01,
  createProtocolSha256V01,
  parseStrictIsoTimestampV01,
} from "@/lib/vnext/protocol-primitives";
import {
  claimEvidenceRelationReferenceV01,
  claimRecordReferenceV01,
  evidenceRecordReferenceV01,
} from "@/lib/vnext/project-verify-material";
import {
  createEpisodeDeltaCandidateFingerprintV01,
  validateReviewDecisionAgainstEpisodeDeltaProposalV01,
} from "@/lib/vnext/review-decision";
import { validateEpisodeDeltaProposalV01 } from "@/lib/vnext/episode-delta-proposal";
import {
  assertProjectVerifyLifecycleProposalFullSourceBoundV01,
  assertProjectVerifyLifecyclePersistedStateSourceBoundV01,
  loadValidatedVNextSemanticCommitGateRelationV01,
  loadValidatedVNextSemanticTransitionRelationV01,
  type ValidatedVNextSemanticTransitionRelationV01,
  type VNextSemanticCommitGateRecordV01,
} from "@/lib/vnext/runtime/durable-semantic-transition";
import { validateRunReceiptV01 } from "@/lib/vnext/run-receipt";
import { validateTaskContextPacketTransitionRelationV01 } from "@/lib/vnext/state-transition-eligibility";
import { validateTaskContextPacketV01 } from "@/lib/vnext/task-context-packet";
import { createVNextOperatorPilotContextUseReviewLogicalIdentityV01 } from "@/lib/vnext/runtime/operator-pilot-context-use-contract";
import type { ContextUseReviewV01 } from "@/types/vnext/context-use-review";
import type { EpisodeDeltaProposalV01 } from "@/types/vnext/episode-delta-proposal";
import type { ExternalRefV01 } from "@/types/vnext/external-ref";
import type { ReviewDecisionV01 } from "@/types/vnext/review-decision";
import type { RunReceiptV01 } from "@/types/vnext/run-receipt";
import type { StateTransitionReceiptV01 } from "@/types/vnext/state-transition-receipt";
import type { TaskContextPacketV01 } from "@/types/vnext/task-context-packet";
import {
  PROJECT_VERIFY_RECONCILIATION_MAX_CONFLICTS_V01,
  PROJECT_VERIFY_RECONCILIATION_MAX_FAMILIES_V01,
  PROJECT_VERIFY_RECONCILIATION_MAX_REFS_V01,
  PROJECT_VERIFY_RECONCILIATION_MAX_REVISIONS_V01,
  PROJECT_VERIFY_RECONCILIATION_VERSION_V01,
  PROJECT_VERIFY_READ_MAX_IDENTIFIER_CHARACTERS_V01,
  type ProjectVerifyApplicationLayerV01,
  type ProjectVerifyClaimFamilyProjectionV01,
  type ProjectVerifyClaimRevisionProjectionV01,
  type ProjectVerifyConflictV01,
  type ProjectVerifyDecisionLayerV01,
  type ProjectVerifyEvidenceProjectionV01,
  type ProjectVerifyExactProtocolKindV01,
  type ProjectVerifyExactProtocolRefV01,
  type ProjectVerifyGateLayerV01,
  type ProjectVerifyLaterContextProjectionV01,
  type ProjectVerifyReadAuthorityV01,
  type ProjectVerifyReadCompletenessV01,
  type ProjectVerifyReconciliationV01,
  type ProjectVerifyRelationFamilyProjectionV01,
  type ProjectVerifyRelationMaterialBucketsV01,
  type ProjectVerifyRelationRevisionProjectionV01,
  type ProjectVerifyRevisionLifecycleV01,
  type ProjectVerifyTransitionLayerV01,
} from "@/types/vnext/project-verify-reconciliation";
import type {
  ClaimEvidenceRelationReferenceV01,
  ClaimEvidenceRelationV01,
  ClaimRecordReferenceV01,
  ClaimRecordV01,
  EvidenceRecordV01,
} from "@/types/vnext/project-verify-material";

const READ_LIMIT_V01 = 256;
const RECONCILIATION_BOUNDED_COLLECTION_COUNT_V01 = 16;
const RECONCILIATION_AGGREGATE_READ_LIMIT_V01 =
  READ_LIMIT_V01 * RECONCILIATION_BOUNDED_COLLECTION_COUNT_V01;
const SHA256_V01 = /^sha256:[a-f0-9]{64}$/u;

export class ProjectVerifyReconciliationReadErrorV01 extends Error {
  constructor(readonly code: string) {
    super(code);
    this.name = "ProjectVerifyReconciliationReadErrorV01";
  }
}

export interface ReadProjectVerifyReconciliationInputV01 {
  workspace_id: string;
  project_id: string;
  /** The caller supplies the observation time so replay is deterministic. */
  observed_at: string;
}

export type ProjectVerifyReconciliationFocusV01 =
  | {
      focus_kind: "criterion";
      criterion_id: string;
      packet_ref: ProjectVerifyExactProtocolRefV01;
      receipt_ref: ProjectVerifyExactProtocolRefV01;
    }
  | { focus_kind: "evidence"; evidence_id: string }
  | { focus_kind: "claim"; claim_id: string }
  | { focus_kind: "claim_family"; claim_family_id: string }
  | { focus_kind: "claim_evidence_relation"; relation_id: string }
  | {
      focus_kind: "claim_evidence_relation_family";
      relation_family_id: string;
    }
  | { focus_kind: "proposal"; proposal_id: string }
  | { focus_kind: "transition_receipt"; transition_receipt_id: string };

export interface ProjectVerifyFocusedReconciliationV01 {
  reconciliation: ProjectVerifyReconciliationV01;
  focus_bounded: boolean;
}

interface LifecycleSourcesV01 {
  proposal: EpisodeDeltaProposalV01 | null;
  decision: ReviewDecisionV01 | null;
  gate: VNextSemanticCommitGateRecordV01 | null;
  transition: ValidatedVNextSemanticTransitionRelationV01 | null;
  conflict_codes: string[];
}

interface FamilyCurrentHeadV01 {
  head: VNextSemanticTargetHeadV01 | null;
  projection: VNextSemanticStateProjectionEntryV01 | null;
  state: VNextPersistedSemanticStateVersionV01 | null;
  transition: ValidatedVNextSemanticTransitionRelationV01 | null;
  selected_record_ref:
    ClaimRecordReferenceV01 | ClaimEvidenceRelationReferenceV01 | null;
}

interface RevisionWorkV01<
  TRecord extends ProjectVerifyLifecycleSelectedRecordV01,
> {
  record: TRecord;
  sources: LifecycleSourcesV01;
}

/**
 * Canonical bounded Core projection. Every emitted lifecycle identity is
 * reloaded through the immutable scoped readers. This function performs only
 * SELECTs and pure protocol validation; it cannot admit or mutate material.
 */
export function readProjectVerifyReconciliationV01(
  db: Database.Database,
  input: ReadProjectVerifyReconciliationInputV01,
): ProjectVerifyReconciliationV01 {
  assertExactKeysV01(
    input,
    ["workspace_id", "project_id", "observed_at"],
    "reconciliation_read_input_fields_invalid",
  );
  return readProjectVerifyReconciliationInternalV01(db, input, null)
    .reconciliation;
}

/**
 * Internal exact-root variant for the lineage reader. The ordinary project
 * projection remains newest-first and bounded; this path additionally reloads
 * the requested scoped root and its bounded exact family/endpoints so an older
 * root cannot disappear behind unrelated project material.
 */
export function readProjectVerifyReconciliationForLineageV01(
  db: Database.Database,
  input: ReadProjectVerifyReconciliationInputV01 & {
    focus: ProjectVerifyReconciliationFocusV01;
  },
): ProjectVerifyFocusedReconciliationV01 {
  assertExactKeysV01(
    input,
    ["workspace_id", "project_id", "observed_at", "focus"],
    "reconciliation_focused_read_input_fields_invalid",
  );
  validateFocusV01(input.focus);
  return readProjectVerifyReconciliationInternalV01(db, input, input.focus);
}

function readProjectVerifyReconciliationInternalV01(
  db: Database.Database,
  input: ReadProjectVerifyReconciliationInputV01,
  focus: ProjectVerifyReconciliationFocusV01 | null,
): ProjectVerifyFocusedReconciliationV01 {
  assertVNextDurableSemanticStoreSchemaV01(db);
  const scope = normalizeScopeV01(input);
  const observedAt = requiredTimestampV01(
    input.observed_at,
    "observed_at_invalid",
  );

  const evidenceCount = countVNextCoreRecordsV01(db, {
    ...scope,
    record_kind: "evidence_record",
  });
  const claimCount = countVNextCoreRecordsV01(db, {
    ...scope,
    record_kind: "claim_record",
  });
  const relationCount = countVNextCoreRecordsV01(db, {
    ...scope,
    record_kind: "claim_evidence_relation",
  });
  const proposalCount = countVNextCoreRecordsV01(db, {
    ...scope,
    record_kind: "episode_delta_proposal",
  });
  const packetCount = countVNextCoreRecordsV01(db, {
    ...scope,
    record_kind: "task_context_packet",
  });
  const contextUseReviewCount = countVNextCoreRecordsV01(db, {
    ...scope,
    record_kind: "context_use_review",
  });
  const focusedMaterial = readFocusedMaterialV01(db, scope, focus);
  const evidenceCollection = boundedUniqueRecordsV01(
    focusedMaterial.evidence,
    listProjectEvidenceRecordsV01(db, {
      ...scope,
      limit: READ_LIMIT_V01,
    }),
    (record) => record.evidence_id,
  );
  const claimCollection = boundedUniqueRecordsV01(
    focusedMaterial.claims,
    listProjectClaimRecordsV01(db, {
      ...scope,
      limit: READ_LIMIT_V01,
    }),
    (record) => record.claim_id,
  );
  const relationCollection = boundedUniqueRecordsV01(
    focusedMaterial.relations,
    listProjectRelationsV01(db, scope),
    (record) => record.relation_id,
  );
  const evidenceRecords = evidenceCollection.records;
  const claimRecords = claimCollection.records;
  const relationRecords = relationCollection.records;

  const evidence = evidenceRecords.map(evidenceProjectionV01);
  const relationById = new Map(
    relationRecords.map((record) => [record.relation_id, record]),
  );
  const claimFamilyCollection = groupClaimsV01(db, scope, claimRecords);
  const relationFamilyCollection = groupRelationsV01(
    db,
    scope,
    relationRecords,
  );
  const claimFamilies = claimFamilyCollection.families;
  const relationFamilies = relationFamilyCollection.families;

  const claimFamilyProjections: ProjectVerifyClaimFamilyProjectionV01[] = [];
  const relationFamilyProjections: ProjectVerifyRelationFamilyProjectionV01[] =
    [];
  const topLevelConflicts: ProjectVerifyConflictV01[] = [];

  for (const family of claimFamilies) {
    const target = readFamilyCurrentHeadV01(db, scope, family[0]!);
    const revisionWork = family.map((record) => ({
      record,
      sources: readLifecycleSourcesV01(db, scope, record),
    }));
    claimFamilyProjections.push(
      projectClaimFamilyV01(family, revisionWork, target, observedAt),
    );
  }
  for (const family of relationFamilies) {
    const target = readFamilyCurrentHeadV01(db, scope, family[0]!);
    const revisionWork = family.map((record) => ({
      record,
      sources: readLifecycleSourcesV01(db, scope, record),
    }));
    relationFamilyProjections.push(
      projectRelationFamilyV01(family, revisionWork, target, observedAt),
    );
  }

  const sourceAssessment = readSourceAssessmentMaterialV01(db, scope, focus);
  const transitions = uniqueValidatedTransitionsV01([
    ...claimFamilyProjections.flatMap((family) =>
      family.revisions.flatMap((revision) =>
        revision.lifecycle.transition.transition_receipt_ref
          ? [revision.lifecycle.transition.transition_receipt_ref]
          : [],
      ),
    ),
    ...relationFamilyProjections.flatMap((family) =>
      family.revisions.flatMap((revision) =>
        revision.lifecycle.transition.transition_receipt_ref
          ? [revision.lifecycle.transition.transition_receipt_ref]
          : [],
      ),
    ),
  ]).map((ref) =>
    loadValidatedVNextSemanticTransitionRelationV01(db, {
      ...scope,
      transition_receipt_id: ref.record_id,
      transition_receipt_fingerprint: ref.record_fingerprint,
    }),
  );
  const focusedTransitionReceiptIds = focusedTransitionReceiptIdsV01(
    focus,
    focusedMaterial,
    claimFamilyProjections,
    relationFamilyProjections,
  );
  const laterContextCollection = readLaterContextV01(
    db,
    scope,
    transitions,
    focusedTransitionReceiptIds,
  );
  const laterContext = laterContextCollection.records;

  const pendingRelationMaterial = emptyRelationBucketsV01();
  const appliedRelationMaterial = emptyRelationBucketsV01();
  for (const family of relationFamilyProjections) {
    for (const revision of family.revisions) {
      const bucket = relationBucketV01(revision.relation.relation_kind);
      if (revision.lifecycle.application.status === "applied_current") {
        appliedRelationMaterial[bucket].push(revision.relation_ref);
      } else if (
        revision.lifecycle.decision.status !== "rejected" &&
        (revision.lifecycle.application.status === "never_applied" ||
          revision.lifecycle.application.status === "pending_later_candidate")
      ) {
        pendingRelationMaterial[bucket].push(revision.relation_ref);
      }
    }
  }
  sortRelationBucketsV01(pendingRelationMaterial);
  sortRelationBucketsV01(appliedRelationMaterial);

  const applicabilityCollection = buildApplicabilityGroupsV01(
    claimFamilyProjections,
    relationFamilyProjections,
    relationById,
  );
  const applicabilityGroups = applicabilityCollection.records;
  const allConflicts = boundedConflictsV01([
    ...topLevelConflicts,
    ...claimFamilyProjections.flatMap((family) => family.conflicts),
    ...relationFamilyProjections.flatMap((family) => family.conflicts),
  ]);
  const bounded =
    evidenceCount > READ_LIMIT_V01 ||
    claimCount > READ_LIMIT_V01 ||
    relationCount > READ_LIMIT_V01 ||
    proposalCount > READ_LIMIT_V01 ||
    packetCount > READ_LIMIT_V01 ||
    contextUseReviewCount > READ_LIMIT_V01 ||
    focusedMaterial.bounded ||
    evidenceCollection.bounded ||
    claimCollection.bounded ||
    relationCollection.bounded ||
    claimFamilyCollection.bounded ||
    relationFamilyCollection.bounded ||
    applicabilityCollection.bounded ||
    sourceAssessment.bounded_incomplete ||
    laterContextCollection.bounded ||
    claimFamilyProjections.length >
      PROJECT_VERIFY_RECONCILIATION_MAX_FAMILIES_V01 ||
    relationFamilyProjections.length >
      PROJECT_VERIFY_RECONCILIATION_MAX_FAMILIES_V01;
  if (bounded) {
    allConflicts.push({
      conflict_kind: "bounded_read",
      code: "project_verify_record_bound_exceeded",
      exact_refs: [],
      source_refs: [],
    });
  }
  const allRevisionProjections: Array<
    | ProjectVerifyClaimRevisionProjectionV01
    | ProjectVerifyRelationRevisionProjectionV01
  > = [
    ...claimFamilyProjections.flatMap((family) => family.revisions),
    ...relationFamilyProjections.flatMap((family) => family.revisions),
  ];
  const projectedConflicts = boundedConflictsV01(allConflicts);
  const returnedItems =
    sourceAssessment.packet_refs.length +
    sourceAssessment.receipt_refs.length +
    sourceAssessment.assessment_refs.length +
    sourceAssessment.criteria.length +
    evidence.length +
    claimFamilyProjections.length +
    claimFamilyProjections.reduce(
      (count, family) => count + family.revisions.length,
      0,
    ) +
    relationFamilyProjections.length +
    relationFamilyProjections.reduce(
      (count, family) => count + family.revisions.length,
      0,
    ) +
    relationBucketRefCountV01(pendingRelationMaterial) +
    relationBucketRefCountV01(appliedRelationMaterial) +
    applicabilityGroups.length +
    applicabilityGroups.reduce(
      (count, group) => count + group.pairwise_scope_comparisons.length,
      0,
    ) +
    applicabilityGroups.reduce(
      (count, group) => count + group.applied_relation_material.length,
      0,
    ) +
    laterContext.length +
    projectedConflicts.length;
  if (returnedItems > RECONCILIATION_AGGREGATE_READ_LIMIT_V01) {
    failV01("project_verify_reconciliation_aggregate_bound_exceeded");
  }
  const completeness = completenessV01(
    returnedItems,
    bounded,
    bounded ? "project_verify_record_bound_exceeded" : null,
    RECONCILIATION_AGGREGATE_READ_LIMIT_V01,
  );

  const withoutFingerprint = {
    reconciliation_version: PROJECT_VERIFY_RECONCILIATION_VERSION_V01,
    workspace_id: scope.workspace_id,
    project_id: scope.project_id,
    observed_at: observedAt,
    source_packets: sourceAssessment.packet_refs,
    source_receipts: sourceAssessment.receipt_refs,
    source_assessments: sourceAssessment.assessment_refs,
    criteria: sourceAssessment.criteria,
    evidence,
    claim_families: claimFamilyProjections,
    relation_families: relationFamilyProjections,
    pending_relation_material: pendingRelationMaterial,
    applied_relation_material: appliedRelationMaterial,
    applicability_groups: applicabilityGroups,
    later_context: laterContext,
    conflicts: projectedConflicts,
    summary: {
      support_present: appliedRelationMaterial.supports.length > 0,
      opposition_present: appliedRelationMaterial.opposes.length > 0,
      contradiction_present: appliedRelationMaterial.contradicts.length > 0,
      qualification_present: appliedRelationMaterial.qualifies.length > 0,
      contextualization_present:
        appliedRelationMaterial.contextualizes.length > 0,
      insufficient_material_present:
        appliedRelationMaterial.insufficient.length > 0 ||
        pendingRelationMaterial.insufficient.length > 0,
      mixed_or_disputed_material_present:
        (appliedRelationMaterial.supports.length > 0 &&
          (appliedRelationMaterial.opposes.length > 0 ||
            appliedRelationMaterial.contradicts.length > 0)) ||
        applicabilityGroups.some((group) => group.disposition === "disputed"),
      no_applied_relation: Object.values(appliedRelationMaterial).every(
        (refs) => refs.length === 0,
      ),
      pending_review: allRevisionProjections.some(
        (revision) => revision.lifecycle.review.status === "pending_review",
      ),
      applied_current:
        claimFamilyProjections.some(
          (family) => family.applied_current_head_ref,
        ) ||
        relationFamilyProjections.some(
          (family) => family.applied_current_head_ref,
        ),
      retracted: allRevisionProjections.some(
        (revision) =>
          revision.lifecycle.application.status === "applied_retracted",
      ),
      claim_truth: "not_established",
    },
    bounds: {
      max_families: PROJECT_VERIFY_RECONCILIATION_MAX_FAMILIES_V01,
      max_revisions_per_family: PROJECT_VERIFY_RECONCILIATION_MAX_REVISIONS_V01,
      max_refs_per_collection: PROJECT_VERIFY_RECONCILIATION_MAX_REFS_V01,
      max_conflicts: PROJECT_VERIFY_RECONCILIATION_MAX_CONFLICTS_V01,
    },
    completeness,
    authority: readAuthorityV01(),
  } satisfies Omit<ProjectVerifyReconciliationV01, "projection_fingerprint">;
  return {
    reconciliation: {
      ...withoutFingerprint,
      projection_fingerprint: createProtocolSha256V01(
        canonicalizeProtocolValueV01(withoutFingerprint),
      ),
    },
    focus_bounded:
      focusedMaterial.bounded || laterContextCollection.focus_bounded,
  };
}

function listProjectRelationsV01(
  db: Database.Database,
  scope: { workspace_id: string; project_id: string },
): ClaimEvidenceRelationV01[] {
  return listVNextCoreRecordsV01(db, {
    ...scope,
    record_kinds: ["claim_evidence_relation"],
    limit: READ_LIMIT_V01,
  }).map((envelope) => {
    const record = readClaimEvidenceRelationV01(db, {
      ...scope,
      relation_id: envelope.record_id,
    });
    if (!record) failV01("project_verify_relation_disappeared");
    return record;
  });
}

interface FocusedProjectVerifyMaterialV01 {
  evidence: EvidenceRecordV01[];
  claims: ClaimRecordV01[];
  relations: ClaimEvidenceRelationV01[];
  bounded: boolean;
}

function readFocusedMaterialV01(
  db: Database.Database,
  scope: { workspace_id: string; project_id: string },
  focus: ProjectVerifyReconciliationFocusV01 | null,
): FocusedProjectVerifyMaterialV01 {
  const evidence = new Map<string, EvidenceRecordV01>();
  const claims = new Map<string, ClaimRecordV01>();
  const relations = new Map<string, ClaimEvidenceRelationV01>();
  let bounded = false;

  const addEvidenceRecord = (record: EvidenceRecordV01): boolean => {
    if (evidence.has(record.evidence_id)) return true;
    if (evidence.size >= READ_LIMIT_V01) {
      bounded = true;
      return false;
    }
    evidence.set(record.evidence_id, record);
    return true;
  };
  const addClaimRecord = (record: ClaimRecordV01): boolean => {
    if (claims.has(record.claim_id)) return true;
    if (claims.size >= READ_LIMIT_V01) {
      bounded = true;
      return false;
    }
    claims.set(record.claim_id, record);
    return true;
  };
  const addRelationRecord = (record: ClaimEvidenceRelationV01): boolean => {
    if (relations.has(record.relation_id)) return true;
    if (relations.size >= READ_LIMIT_V01) {
      bounded = true;
      return false;
    }
    relations.set(record.relation_id, record);
    return true;
  };
  const addEvidence = (evidenceId: string): void => {
    const record = readEvidenceRecordV01(db, {
      ...scope,
      evidence_id: evidenceId,
    });
    if (record) addEvidenceRecord(record);
  };
  const addClaimFamily = (claimId: string): void => {
    const record = readClaimRecordV01(db, { ...scope, claim_id: claimId });
    if (!record) return;
    // Pin the exact requested or endpoint record before expanding its family.
    // A family is never later projected partially; groupClaimsV01 either keeps
    // the complete lineage inside the aggregate cap or marks it omitted.
    addClaimRecord(record);
    for (const revision of listClaimFamilyRevisionsV01(db, {
      ...scope,
      claim_family_id: record.claim_family_id,
    })) {
      addClaimRecord(revision);
    }
  };
  const addRelationFamily = (relationId: string): void => {
    const record = readClaimEvidenceRelationV01(db, {
      ...scope,
      relation_id: relationId,
    });
    if (!record) return;
    // As above, preserve the exact relation root before bounded expansion.
    addRelationRecord(record);
    for (const revision of listClaimEvidenceRelationFamilyRevisionsV01(db, {
      ...scope,
      relation_family_id: record.relation_family_id,
    })) {
      if (addRelationRecord(revision)) {
        addClaimFamily(revision.claim_ref.record_id);
        addEvidence(revision.evidence_ref.record_id);
      }
    }
  };
  const addRelations = (records: ClaimEvidenceRelationV01[]): void => {
    for (const record of records) {
      addRelationFamily(record.relation_id);
    }
  };
  const addRelationsForClaim = (claim: ClaimRecordV01): void => {
    const count = countRelationsByExactEndpointV01(db, scope, {
      id_path: "$.claim_ref.record_id",
      fingerprint_path: "$.claim_ref.record_fingerprint",
      record_id: claim.claim_id,
      record_fingerprint: claim.integrity.fingerprint,
    });
    bounded = bounded || count > READ_LIMIT_V01;
    addRelations(
      listRelationsForExactClaimV01(db, {
        ...scope,
        claim_ref: claimRecordReferenceV01(claim),
        limit: READ_LIMIT_V01,
      }),
    );
  };
  const addRelationsForEvidence = (record: EvidenceRecordV01): void => {
    const count = countRelationsByExactEndpointV01(db, scope, {
      id_path: "$.evidence_ref.record_id",
      fingerprint_path: "$.evidence_ref.record_fingerprint",
      record_id: record.evidence_id,
      record_fingerprint: record.integrity.fingerprint,
    });
    bounded = bounded || count > READ_LIMIT_V01;
    addRelations(
      listRelationsForExactEvidenceV01(db, {
        ...scope,
        evidence_ref: evidenceRecordReferenceV01(record),
        limit: READ_LIMIT_V01,
      }),
    );
  };
  const addSelectedRecord = (
    selected:
      ClaimRecordReferenceV01 | ClaimEvidenceRelationReferenceV01 | null,
  ): void => {
    if (!selected) return;
    if (selected.record_kind === "claim_record") {
      addClaimFamily(selected.record_id);
      const claim = claims.get(selected.record_id);
      if (claim) addRelationsForClaim(claim);
      return;
    }
    addRelationFamily(selected.record_id);
  };

  if (focus) {
    switch (focus.focus_kind) {
      case "criterion": {
        const source = readSourceAssessmentMaterialV01(db, scope, focus);
        const exactCriteria = source.criteria.filter(
          (item) =>
            item.criterion.criterion_id === focus.criterion_id &&
            exactProtocolRefEqualV01(item.packet_ref, focus.packet_ref) &&
            exactProtocolRefEqualV01(item.receipt_ref, focus.receipt_ref),
        );
        for (const criterion of exactCriteria) {
          for (const relationRef of [
            ...criterion.criterion.supporting_refs,
            ...criterion.criterion.opposing_refs,
            ...criterion.criterion.missing_refs,
          ]) {
            const matching = queryEvidenceByExactSourceRefV01(
              db,
              scope,
              relationRef,
            );
            bounded = bounded || matching.bounded;
            for (const record of matching.records) {
              if (addEvidenceRecord(record)) {
                addRelationsForEvidence(record);
              }
            }
          }
        }
        break;
      }
      case "evidence": {
        addEvidence(focus.evidence_id);
        const record = evidence.get(focus.evidence_id);
        if (record) addRelationsForEvidence(record);
        break;
      }
      case "claim": {
        addClaimFamily(focus.claim_id);
        const claim = claims.get(focus.claim_id);
        if (claim) addRelationsForClaim(claim);
        break;
      }
      case "claim_family": {
        const family = listClaimFamilyRevisionsV01(db, {
          ...scope,
          claim_family_id: focus.claim_family_id,
        });
        if (family[0]) addClaimFamily(family[0].claim_id);
        for (const claim of family) {
          addRelationsForClaim(claim);
        }
        break;
      }
      case "claim_evidence_relation":
        addRelationFamily(focus.relation_id);
        break;
      case "claim_evidence_relation_family": {
        const family = listClaimEvidenceRelationFamilyRevisionsV01(db, {
          ...scope,
          relation_family_id: focus.relation_family_id,
        });
        if (family[0]) addRelationFamily(family[0].relation_id);
        break;
      }
      case "proposal":
        addSelectedRecord(
          selectedRecordForExactProposalV01(db, scope, focus.proposal_id),
        );
        break;
      case "transition_receipt":
        addSelectedRecord(
          selectedRecordForExactTransitionV01(
            db,
            scope,
            focus.transition_receipt_id,
          ),
        );
        break;
    }
  }

  return {
    evidence: [...evidence.values()],
    claims: [...claims.values()],
    relations: [...relations.values()],
    bounded,
  };
}

function focusedTransitionReceiptIdsV01(
  focus: ProjectVerifyReconciliationFocusV01 | null,
  focusedMaterial: FocusedProjectVerifyMaterialV01,
  claimFamilies: ProjectVerifyClaimFamilyProjectionV01[],
  relationFamilies: ProjectVerifyRelationFamilyProjectionV01[],
): Set<string> {
  const ids = new Set<string>();
  if (!focus) return ids;
  if (focus.focus_kind === "transition_receipt") {
    ids.add(focus.transition_receipt_id);
  }
  const focusedClaimIds = new Set(
    focusedMaterial.claims.map((record) => record.claim_id),
  );
  const focusedRelationIds = new Set(
    focusedMaterial.relations.map((record) => record.relation_id),
  );
  for (const revision of claimFamilies.flatMap((family) => family.revisions)) {
    const exactMatch =
      (focus.focus_kind === "claim" &&
        revision.claim_ref.record_id === focus.claim_id) ||
      (focus.focus_kind === "claim_family" &&
        revision.claim.claim_family_id === focus.claim_family_id) ||
      (focus.focus_kind === "proposal" &&
        revision.lifecycle.review.proposal_ref?.record_id ===
          focus.proposal_id) ||
      ((focus.focus_kind === "criterion" || focus.focus_kind === "evidence") &&
        focusedClaimIds.has(revision.claim_ref.record_id));
    if (exactMatch && revision.lifecycle.transition.transition_receipt_ref) {
      ids.add(revision.lifecycle.transition.transition_receipt_ref.record_id);
    }
  }
  for (const revision of relationFamilies.flatMap(
    (family) => family.revisions,
  )) {
    const exactMatch =
      (focus.focus_kind === "claim_evidence_relation" &&
        revision.relation_ref.record_id === focus.relation_id) ||
      (focus.focus_kind === "claim_evidence_relation_family" &&
        revision.relation.relation_family_id === focus.relation_family_id) ||
      (focus.focus_kind === "proposal" &&
        revision.lifecycle.review.proposal_ref?.record_id ===
          focus.proposal_id) ||
      ((focus.focus_kind === "criterion" || focus.focus_kind === "evidence") &&
        focusedRelationIds.has(revision.relation_ref.record_id));
    if (exactMatch && revision.lifecycle.transition.transition_receipt_ref) {
      ids.add(revision.lifecycle.transition.transition_receipt_ref.record_id);
    }
  }
  return ids;
}

function queryEvidenceByExactSourceRefV01(
  db: Database.Database,
  scope: { workspace_id: string; project_id: string },
  sourceRef: ExternalRefV01,
): { records: EvidenceRecordV01[]; bounded: boolean } {
  const rows = db
    .prepare(
      `SELECT DISTINCT core.record_id
       FROM vnext_core_records AS core
       JOIN json_each(core.payload_json, '$.source_refs') AS source_ref
       WHERE core.workspace_id = ? AND core.project_id = ?
         AND core.record_kind = 'evidence_record'
         AND json_extract(source_ref.value, '$.ref_type') = ?
         AND json_extract(source_ref.value, '$.external_id') = ?
         AND json_extract(source_ref.value, '$.source_ref') IS ?
       ORDER BY core.created_at, core.record_id
       LIMIT ?`,
    )
    .all(
      scope.workspace_id,
      scope.project_id,
      sourceRef.ref_type,
      sourceRef.external_id,
      sourceRef.source_ref,
      READ_LIMIT_V01 + 1,
    ) as Array<{ record_id: string }>;
  const records = rows.slice(0, READ_LIMIT_V01).map(({ record_id }) => {
    const record = readEvidenceRecordV01(db, {
      ...scope,
      evidence_id: record_id,
    });
    if (
      !record ||
      !record.source_refs.some(
        (candidate) => canonical(candidate) === canonical(sourceRef),
      )
    ) {
      failV01("project_verify_focused_criterion_evidence_source_conflict");
    }
    return record;
  });
  return { records, bounded: rows.length > READ_LIMIT_V01 };
}

function exactProtocolRefEqualV01(
  left: ProjectVerifyExactProtocolRefV01,
  right: ProjectVerifyExactProtocolRefV01,
): boolean {
  return (
    left.record_kind === right.record_kind &&
    left.record_id === right.record_id &&
    left.record_fingerprint === right.record_fingerprint
  );
}

function countRelationsByExactEndpointV01(
  db: Database.Database,
  scope: { workspace_id: string; project_id: string },
  input: {
    id_path: "$.claim_ref.record_id" | "$.evidence_ref.record_id";
    fingerprint_path:
      "$.claim_ref.record_fingerprint" | "$.evidence_ref.record_fingerprint";
    record_id: string;
    record_fingerprint: string;
  },
): number {
  const row = db
    .prepare(
      `SELECT COUNT(*) AS count
       FROM vnext_core_records
       WHERE workspace_id = ? AND project_id = ?
         AND record_kind = 'claim_evidence_relation'
         AND json_extract(payload_json, ?) = ?
         AND json_extract(payload_json, ?) = ?`,
    )
    .get(
      scope.workspace_id,
      scope.project_id,
      input.id_path,
      input.record_id,
      input.fingerprint_path,
      input.record_fingerprint,
    ) as { count: number };
  return row.count;
}

function selectedRecordForExactProposalV01(
  db: Database.Database,
  scope: { workspace_id: string; project_id: string },
  proposalId: string,
): ClaimRecordReferenceV01 | ClaimEvidenceRelationReferenceV01 | null {
  const envelope = readVNextCoreRecordV01(db, {
    ...scope,
    record_kind: "episode_delta_proposal",
    record_id: proposalId,
  });
  if (!envelope) return null;
  if (validateEpisodeDeltaProposalV01(envelope.payload).status !== "valid") {
    failV01("project_verify_focused_proposal_invalid");
  }
  const proposal = envelope.payload as EpisodeDeltaProposalV01;
  assertEnvelopeV01(envelope, {
    ...scope,
    record_id: proposal.proposal_id,
    fingerprint: proposal.integrity.fingerprint,
    created_at: proposal.created_at,
  });
  if (!proposal.project_verify_lifecycle) return null;
  try {
    assertProjectVerifyLifecycleProposalFullSourceBoundV01(db, proposal);
  } catch {
    failV01("project_verify_focused_proposal_source_conflict");
  }
  return structuredClone(
    proposal.project_verify_lifecycle.lifecycle_binding.selected_record_ref,
  );
}

function selectedRecordForExactTransitionV01(
  db: Database.Database,
  scope: { workspace_id: string; project_id: string },
  transitionReceiptId: string,
): ClaimRecordReferenceV01 | ClaimEvidenceRelationReferenceV01 | null {
  const envelope = readVNextCoreRecordV01(db, {
    ...scope,
    record_kind: "state_transition_receipt",
    record_id: transitionReceiptId,
  });
  if (!envelope) return null;
  const transition = loadValidatedVNextSemanticTransitionRelationV01(db, {
    ...scope,
    transition_receipt_id: envelope.record_id,
    transition_receipt_fingerprint: envelope.fingerprint,
  });
  return structuredClone(
    transition.proposal.project_verify_lifecycle?.lifecycle_binding
      .selected_record_ref ?? null,
  );
}

function uniqueRecordsV01<T>(
  primary: T[],
  focused: T[],
  identity: (record: T) => string,
): T[] {
  const records = new Map<string, T>();
  for (const record of [...primary, ...focused]) {
    records.set(identity(record), record);
  }
  return [...records.values()];
}

interface BoundedRecordCollectionV01<T> {
  records: T[];
  bounded: boolean;
}

/**
 * Merge a focused exact-root window with the ordinary project window without
 * allowing either collection to widen the fixed read contract. Focused roots
 * are inserted first so an old exact lookup remains visible when unrelated
 * newer project material fills the ordinary window.
 */
function boundedUniqueRecordsV01<T>(
  focused: T[],
  ordinary: T[],
  identity: (record: T) => string,
): BoundedRecordCollectionV01<T> {
  const records = new Map<string, T>();
  let bounded = false;
  for (const record of [...focused, ...ordinary]) {
    const key = identity(record);
    if (records.has(key)) continue;
    if (records.size >= READ_LIMIT_V01) {
      bounded = true;
      continue;
    }
    records.set(key, record);
  }
  return { records: [...records.values()], bounded };
}

interface BoundedFamilyCollectionV01<T> {
  families: T[][];
  bounded: boolean;
}

function groupClaimsV01(
  db: Database.Database,
  scope: { workspace_id: string; project_id: string },
  records: ClaimRecordV01[],
): BoundedFamilyCollectionV01<ClaimRecordV01> {
  const families = new Map<string, ClaimRecordV01[]>();
  let revisionCount = 0;
  let bounded = false;
  for (const record of records) {
    if (!families.has(record.claim_family_id)) {
      const lineage = listClaimFamilyRevisionsV01(db, {
        ...scope,
        claim_family_id: record.claim_family_id,
      });
      if (revisionCount + lineage.length > READ_LIMIT_V01) {
        bounded = true;
        continue;
      }
      families.set(record.claim_family_id, lineage);
      revisionCount += lineage.length;
    }
  }
  return {
    families: [...families.values()].sort((left, right) =>
      left[0]!.claim_family_id.localeCompare(right[0]!.claim_family_id),
    ),
    bounded,
  };
}

function groupRelationsV01(
  db: Database.Database,
  scope: { workspace_id: string; project_id: string },
  records: ClaimEvidenceRelationV01[],
): BoundedFamilyCollectionV01<ClaimEvidenceRelationV01> {
  const families = new Map<string, ClaimEvidenceRelationV01[]>();
  let revisionCount = 0;
  let bounded = false;
  for (const record of records) {
    if (!families.has(record.relation_family_id)) {
      const lineage = listClaimEvidenceRelationFamilyRevisionsV01(db, {
        ...scope,
        relation_family_id: record.relation_family_id,
      });
      if (revisionCount + lineage.length > READ_LIMIT_V01) {
        bounded = true;
        continue;
      }
      families.set(record.relation_family_id, lineage);
      revisionCount += lineage.length;
    }
  }
  return {
    families: [...families.values()].sort((left, right) =>
      left[0]!.relation_family_id.localeCompare(right[0]!.relation_family_id),
    ),
    bounded,
  };
}

function readLifecycleSourcesV01(
  db: Database.Database,
  scope: { workspace_id: string; project_id: string },
  record: ProjectVerifyLifecycleSelectedRecordV01,
): LifecycleSourcesV01 {
  const entityKind =
    "claim_version" in record ? "claim_record" : "claim_evidence_relation";
  const familyId =
    "claim_version" in record
      ? record.claim_family_id
      : record.relation_family_id;
  const recordRef =
    "claim_version" in record
      ? claimRecordReferenceV01(record)
      : claimEvidenceRelationReferenceV01(record);
  const identity = deriveProjectVerifyLifecycleProposalAdmissionIdentityV01({
    ...scope,
    entity_kind: entityKind,
    family_id: familyId,
    selected_record_ref: recordRef,
  });
  const persisted = readProjectVerifyLifecycleProposalByIdentityV01(
    db,
    identity,
  );
  if (!persisted) {
    return {
      proposal: null,
      decision: null,
      gate: null,
      transition: null,
      conflict_codes: [],
    };
  }
  const decisionEnvelopes = queryCoreRecordsV01(db, scope, {
    record_kind: "review_decision",
    where: [
      "json_extract(payload_json, '$.source_proposal.proposal_id') = ?",
      "json_extract(payload_json, '$.candidate.candidate_id') = ?",
    ],
    values: [
      persisted.proposal.proposal_id,
      persisted.proposal.project_verify_lifecycle!.lifecycle_binding
        .decision_candidate.candidate_id,
    ],
    limit: 3,
  });
  const receiptEnvelopes = queryCoreRecordsV01(db, scope, {
    record_kind: "state_transition_receipt",
    where: ["json_extract(payload_json, '$.source_proposal.proposal_id') = ?"],
    values: [persisted.proposal.proposal_id],
    limit: 3,
  });
  if (receiptEnvelopes.length > 1) {
    return {
      proposal: persisted.proposal,
      decision: null,
      gate: null,
      transition: null,
      conflict_codes: ["project_verify_transition_lineage_ambiguous"],
    };
  }
  const receiptEnvelope = receiptEnvelopes[0] ?? null;
  if (receiptEnvelope) {
    const transition = loadValidatedVNextSemanticTransitionRelationV01(db, {
      ...scope,
      transition_receipt_id: receiptEnvelope.record_id,
      transition_receipt_fingerprint: receiptEnvelope.fingerprint,
    });
    if (
      canonicalizeProtocolValueV01(transition.proposal) !==
      canonicalizeProtocolValueV01(persisted.proposal)
    ) {
      failV01("project_verify_transition_proposal_conflict");
    }
    const exactDecisionEnvelope = readVNextCoreRecordV01(db, {
      ...scope,
      record_kind: "review_decision",
      record_id: transition.decision.decision_id,
    });
    if (
      !exactDecisionEnvelope ||
      exactDecisionEnvelope.fingerprint !==
        transition.decision.integrity.fingerprint
    ) {
      failV01("project_verify_transition_decision_envelope_missing");
    }
    const exactDecision = validatedDecisionV01(
      db,
      exactDecisionEnvelope,
      persisted.proposal,
      scope,
    );
    if (
      canonicalizeProtocolValueV01(exactDecision) !==
      canonicalizeProtocolValueV01(transition.decision)
    ) {
      failV01("project_verify_transition_decision_envelope_conflict");
    }
    const exactGateEnvelope = readVNextCoreRecordV01(db, {
      ...scope,
      record_kind: "semantic_commit_gate",
      record_id: transition.gate_record.gate_record_id,
    });
    if (
      !exactGateEnvelope ||
      exactGateEnvelope.fingerprint !==
        transition.gate_record.integrity.fingerprint
    ) {
      failV01("project_verify_transition_gate_envelope_missing");
    }
    const exactGate = validatedGateEnvelopeV01(
      db,
      exactGateEnvelope,
      persisted.proposal,
      exactDecision,
      scope,
    );
    if (
      canonicalizeProtocolValueV01(exactGate) !==
      canonicalizeProtocolValueV01(transition.gate_record)
    ) {
      failV01("project_verify_transition_gate_envelope_conflict");
    }
    const decisionCount = countCoreRecordsWhereV01(db, scope, {
      record_kind: "review_decision",
      where: [
        "json_extract(payload_json, '$.source_proposal.proposal_id') = ?",
        "json_extract(payload_json, '$.candidate.candidate_id') = ?",
      ],
      values: [
        persisted.proposal.proposal_id,
        persisted.proposal.project_verify_lifecycle!.lifecycle_binding
          .decision_candidate.candidate_id,
      ],
    });
    const gateCount = countCoreRecordsWhereV01(db, scope, {
      record_kind: "semantic_commit_gate",
      where: [
        "json_extract(payload_json, '$.proposal_id') = ?",
        "json_extract(payload_json, '$.decision_id') = ?",
      ],
      values: [persisted.proposal.proposal_id, transition.decision.decision_id],
    });
    assertLifecycleTransitionStateSourceV01(db, scope, transition);
    const conflictCodes = [
      ...(decisionCount > 1
        ? ["project_verify_competing_decision_lineage"]
        : []),
      ...(gateCount > 1 ? ["project_verify_competing_gate_lineage"] : []),
    ];
    return {
      proposal: persisted.proposal,
      decision: transition.decision,
      gate: transition.gate_record,
      transition,
      conflict_codes: conflictCodes,
    };
  }
  if (decisionEnvelopes.length > 1) {
    return {
      proposal: persisted.proposal,
      decision: null,
      gate: null,
      transition: null,
      conflict_codes: ["project_verify_decision_lineage_ambiguous"],
    };
  }
  const decisionEnvelope = decisionEnvelopes[0] ?? null;
  const decision = decisionEnvelope
    ? validatedDecisionV01(db, decisionEnvelope, persisted.proposal, scope)
    : null;
  if (!decision) {
    return {
      proposal: persisted.proposal,
      decision: null,
      gate: null,
      transition: null,
      conflict_codes: [],
    };
  }
  const gateEnvelopes = queryCoreRecordsV01(db, scope, {
    record_kind: "semantic_commit_gate",
    where: [
      "json_extract(payload_json, '$.proposal_id') = ?",
      "json_extract(payload_json, '$.decision_id') = ?",
    ],
    values: [persisted.proposal.proposal_id, decision.decision_id],
    limit: 3,
  });
  if (gateEnvelopes.length > 1) {
    return {
      proposal: persisted.proposal,
      decision,
      gate: null,
      transition: null,
      conflict_codes: ["project_verify_gate_lineage_ambiguous"],
    };
  }
  const gateEnvelope = gateEnvelopes[0] ?? null;
  const gate = gateEnvelope
    ? validatedGateEnvelopeV01(
        db,
        gateEnvelope,
        persisted.proposal,
        decision,
        scope,
      )
    : null;

  return {
    proposal: persisted.proposal,
    decision,
    gate,
    transition: null,
    conflict_codes: [],
  };
}

function assertLifecycleTransitionStateSourceV01(
  db: Database.Database,
  scope: { workspace_id: string; project_id: string },
  transition: ValidatedVNextSemanticTransitionRelationV01,
): void {
  const binding =
    transition.proposal.project_verify_lifecycle?.lifecycle_binding;
  if (!binding) failV01("project_verify_transition_binding_missing");
  const effects = transition.receipt.effects.filter(
    (effect) =>
      canonicalizeProtocolValueV01(effect.target_ref) ===
      canonicalizeProtocolValueV01(binding.family_target_ref),
  );
  if (effects.length !== 1) {
    failV01("project_verify_transition_effect_conflict");
  }
  const effect = effects[0]!;
  if (effect.after_state.presence === "absent") return;
  const envelope = readVNextCoreRecordV01(db, {
    record_kind: "semantic_state",
    record_id: effect.after_state.state_ref.external_id,
    ...scope,
  });
  if (!envelope) failV01("project_verify_historical_semantic_state_missing");
  const state = rebuildVNextPersistedSemanticStateV01(envelope.payload);
  assertVNextCoreRecordMatchesProtocolPayloadBindingV01(envelope, {
    workspace_id: state.workspace_id,
    project_id: state.project_id,
    fingerprint: state.integrity.fingerprint,
  });
  if (
    envelope.record_id !== state.semantic_state_record_id ||
    envelope.created_at !== state.created_at ||
    canonicalizeProtocolValueV01(state.state_ref) !==
      canonicalizeProtocolValueV01(effect.after_state.state_ref) ||
    state.state_content_fingerprint !== effect.after_state.state_fingerprint
  ) {
    failV01("project_verify_historical_semantic_state_conflict");
  }
  assertProjectVerifyLifecyclePersistedStateSourceBoundV01(db, {
    state,
    transition_receipt_id: transition.receipt.transition_receipt_id,
    transition_receipt_fingerprint: transition.receipt.integrity.fingerprint,
  });
}

function projectClaimFamilyV01(
  family: ClaimRecordV01[],
  work: RevisionWorkV01<ClaimRecordV01>[],
  target: FamilyCurrentHeadV01,
  observedAt: string,
): ProjectVerifyClaimFamilyProjectionV01 {
  const first = family[0]!;
  const revisions = work.map((item, index) => ({
    claim_ref: claimRecordReferenceV01(item.record),
    claim: item.record,
    lifecycle: revisionLifecycleV01(
      item,
      work,
      target,
      index === work.length - 1,
      observedAt,
    ),
  })) satisfies ProjectVerifyClaimRevisionProjectionV01[];
  const current =
    target.selected_record_ref?.record_kind === "claim_record"
      ? target.selected_record_ref
      : null;
  return {
    claim_family_id: first.claim_family_id,
    family_target_ref: familyTargetForRecordV01(first),
    family_origin_fingerprint: createProjectVerifyFamilyOriginFingerprintV01(
      first.family_origin,
    ),
    applicability_scope_fingerprint:
      first.applicability_scope.scope_fingerprint,
    subject_refs: structuredClone(first.subject_refs),
    applicability_scope: structuredClone(first.applicability_scope),
    revisions,
    latest_recorded_candidate_ref: claimRecordReferenceV01(family.at(-1)!),
    applied_current_head_ref: current,
    previously_applied_refs: revisions
      .filter(
        (revision) =>
          revision.lifecycle.application.status === "previously_applied" ||
          revision.lifecycle.application.status === "applied_superseded" ||
          revision.lifecycle.application.status === "applied_retracted",
      )
      .map((revision) => revision.claim_ref),
    pending_revision_refs: revisions
      .filter(
        (revision) =>
          revision.lifecycle.decision.status !== "rejected" &&
          (revision.lifecycle.application.status === "never_applied" ||
            revision.lifecycle.application.status ===
              "pending_later_candidate"),
      )
      .map((revision) => revision.claim_ref),
    conflicts: familyConflictsV01(revisions),
    completeness: completenessV01(family.length, false, null),
  };
}

function projectRelationFamilyV01(
  family: ClaimEvidenceRelationV01[],
  work: RevisionWorkV01<ClaimEvidenceRelationV01>[],
  target: FamilyCurrentHeadV01,
  observedAt: string,
): ProjectVerifyRelationFamilyProjectionV01 {
  const first = family[0]!;
  const revisions = work.map((item, index) => ({
    relation_ref: claimEvidenceRelationReferenceV01(item.record),
    relation: item.record,
    lifecycle: revisionLifecycleV01(
      item,
      work,
      target,
      index === work.length - 1,
      observedAt,
    ),
  })) satisfies ProjectVerifyRelationRevisionProjectionV01[];
  const current =
    target.selected_record_ref?.record_kind === "claim_evidence_relation"
      ? target.selected_record_ref
      : null;
  return {
    relation_family_id: first.relation_family_id,
    family_target_ref: familyTargetForRecordV01(first),
    family_origin_fingerprint: createProjectVerifyFamilyOriginFingerprintV01(
      first.family_origin,
    ),
    applicability_scope_fingerprint:
      first.applicability_scope.scope_fingerprint,
    claim_ref: structuredClone(first.claim_ref),
    evidence_ref: structuredClone(first.evidence_ref),
    applicability_scope: structuredClone(first.applicability_scope),
    revisions,
    latest_recorded_candidate_ref: claimEvidenceRelationReferenceV01(
      family.at(-1)!,
    ),
    applied_current_head_ref: current,
    previously_applied_refs: revisions
      .filter(
        (revision) =>
          revision.lifecycle.application.status === "previously_applied" ||
          revision.lifecycle.application.status === "applied_superseded" ||
          revision.lifecycle.application.status === "applied_retracted",
      )
      .map((revision) => revision.relation_ref),
    pending_revision_refs: revisions
      .filter(
        (revision) =>
          revision.lifecycle.decision.status !== "rejected" &&
          (revision.lifecycle.application.status === "never_applied" ||
            revision.lifecycle.application.status ===
              "pending_later_candidate"),
      )
      .map((revision) => revision.relation_ref),
    conflicts: familyConflictsV01(revisions),
    completeness: completenessV01(family.length, false, null),
  };
}

function revisionLifecycleV01<
  TRecord extends ProjectVerifyLifecycleSelectedRecordV01,
>(
  item: RevisionWorkV01<TRecord>,
  family: RevisionWorkV01<TRecord>[],
  target: FamilyCurrentHeadV01,
  latest: boolean,
  observedAt: string,
): ProjectVerifyRevisionLifecycleV01 {
  const selected = selectedRecordRefV01(item.record);
  const sources = item.sources;
  const conflicts = sources.conflict_codes.map((code) => ({
    conflict_kind: conflictKindForCodeV01(code),
    code,
    exact_refs: compactRefsV01([
      sources.proposal ? proposalRefV01(sources.proposal) : null,
      sources.decision ? decisionRefV01(sources.decision) : null,
      sources.gate ? gateRefV01(sources.gate) : null,
      sources.transition ? transitionRefV01(sources.transition.receipt) : null,
    ]),
    source_refs: [],
  })) satisfies ProjectVerifyConflictV01[];
  const applied = Boolean(sources.transition);
  const current = sameRecordRefV01(target.selected_record_ref, selected);
  const appliedSuccessor = family.find((candidate) => {
    const binding =
      candidate.sources.transition?.proposal.project_verify_lifecycle
        ?.lifecycle_binding;
    return Boolean(
      binding &&
      sameRecordRefV01(binding.prior_record_ref, selected) &&
      candidate.sources.transition,
    );
  });
  const successorBinding =
    appliedSuccessor?.sources.transition?.proposal.project_verify_lifecycle
      ?.lifecycle_binding ?? null;
  const selectedRetraction =
    sources.transition &&
    sources.proposal?.project_verify_lifecycle?.lifecycle_binding
      .selected_record_operation_intent === "retract"
      ? sources.transition
      : null;
  const retracted = Boolean(
    selectedRetraction ||
    successorBinding?.selected_record_operation_intent === "retract",
  );
  const superseded =
    successorBinding?.selected_record_operation_intent === "supersede";
  const laterCandidate =
    !applied &&
    sources.decision?.decision !== "reject" &&
    family.some(
      (candidate) => candidate.record.revision < item.record.revision,
    ) &&
    target.head?.presence === "present";
  const applicationSourceConflict =
    (current && !applied) ||
    sources.conflict_codes.some(
      (code) =>
        code.includes("transition") ||
        code.includes("semantic_state") ||
        code.includes("current_head") ||
        code.includes("projection") ||
        code.includes("source_conflict"),
    );
  const application: ProjectVerifyApplicationLayerV01 = {
    status: applicationSourceConflict
      ? "conflict"
      : current
        ? "applied_current"
        : retracted
          ? "applied_retracted"
          : superseded
            ? "applied_superseded"
            : applied
              ? "previously_applied"
              : laterCandidate
                ? "pending_later_candidate"
                : "never_applied",
    current_family_head: current,
    applied_at: sources.transition?.receipt.applied_at ?? null,
    ended_at: current
      ? null
      : (selectedRetraction?.receipt.applied_at ??
        appliedSuccessor?.sources.transition?.receipt.applied_at ??
        null),
  };
  return {
    record: {
      recorded: true,
      latest_recorded_candidate: latest,
      prior_record_ref: structuredClone(priorRecordRefV01(item.record)),
      operation_target_ref: structuredClone(operationTargetRefV01(item.record)),
    },
    review: reviewLayerV01(sources),
    decision: decisionLayerV01(sources),
    gate: gateLayerV01(sources, observedAt),
    transition: transitionLayerV01(sources, target, selected),
    application,
    truth: {
      claim_truth: "not_established",
      relation_is_proof: false,
      evidence_acceptance: "not_established_by_reconciliation",
    },
    conflicts,
  };
}

function reviewLayerV01(sources: LifecycleSourcesV01) {
  return {
    status: sources.conflict_codes.some((code) => code.includes("decision"))
      ? "conflict"
      : !sources.proposal
        ? "no_proposal"
        : sources.decision
          ? "reviewed"
          : "pending_review",
    proposal_ref: sources.proposal ? proposalRefV01(sources.proposal) : null,
    proposal_candidate_ref: sources.proposal
      ? candidateRefV01(sources.proposal)
      : null,
  } as const;
}

function decisionLayerV01(
  sources: LifecycleSourcesV01,
): ProjectVerifyDecisionLayerV01 {
  if (sources.conflict_codes.some((code) => code.includes("decision"))) {
    return {
      status: "conflict",
      decision_ref: sources.decision ? decisionRefV01(sources.decision) : null,
    };
  }
  if (!sources.decision) return { status: "no_decision", decision_ref: null };
  const status = {
    accept: "accepted",
    reject: "rejected",
    defer: "deferred",
    supersede: "supersede_decision",
    retract: "retract_decision",
  } as const;
  return {
    status: status[sources.decision.decision],
    decision_ref: decisionRefV01(sources.decision),
  };
}

function gateLayerV01(
  sources: LifecycleSourcesV01,
  observedAt: string,
): ProjectVerifyGateLayerV01 {
  if (sources.conflict_codes.some((code) => code.includes("gate"))) {
    return {
      status: "source_conflict",
      gate_ref: sources.gate ? gateRefV01(sources.gate) : null,
    };
  }
  if (!sources.gate) return { status: "no_gate", gate_ref: null };
  const observedAtMs = parseStrictIsoTimestampV01(observedAt);
  const expiresAtMs = parseStrictIsoTimestampV01(
    sources.gate.semantic_commit_gate_evaluation.expires_at,
  );
  if (observedAtMs === null || expiresAtMs === null) {
    failV01("project_verify_gate_timestamp_invalid");
  }
  if (!sources.transition && observedAtMs > expiresAtMs) {
    return { status: "expired", gate_ref: gateRefV01(sources.gate) };
  }
  return { status: "authorized", gate_ref: gateRefV01(sources.gate) };
}

function transitionLayerV01(
  sources: LifecycleSourcesV01,
  target: FamilyCurrentHeadV01,
  selected: ClaimRecordReferenceV01 | ClaimEvidenceRelationReferenceV01,
): ProjectVerifyTransitionLayerV01 {
  if (sources.conflict_codes.some((code) => code.includes("transition"))) {
    return {
      status: "source_conflict",
      transition_receipt_ref: null,
      semantic_state_ref: null,
      semantic_target_head_ref: null,
    };
  }
  if (!sources.transition) {
    return {
      status: sources.gate ? "transition_missing" : "no_transition",
      transition_receipt_ref: null,
      semantic_state_ref: null,
      semantic_target_head_ref: null,
    };
  }
  const isCurrent = sameRecordRefV01(target.selected_record_ref, selected);
  const isCurrentRetraction =
    target.head?.presence === "absent" &&
    target.head.source_transition_receipt_id ===
      sources.transition.receipt.transition_receipt_id;
  return {
    status: "applied",
    transition_receipt_ref: transitionRefV01(sources.transition.receipt),
    semantic_state_ref:
      isCurrent && target.state ? semanticStateRefV01(target.state) : null,
    semantic_target_head_ref:
      isCurrent || isCurrentRetraction ? targetHeadRefV01(target.head!) : null,
  };
}

function readFamilyCurrentHeadV01(
  db: Database.Database,
  scope: { workspace_id: string; project_id: string },
  record: ProjectVerifyLifecycleSelectedRecordV01,
): FamilyCurrentHeadV01 {
  const targetRef = familyTargetForRecordV01(record);
  const targetKey = deriveVNextSemanticTargetKeyV01(targetRef);
  const head = readVNextSemanticTargetHeadV01(db, {
    ...scope,
    target_key: targetKey,
  });
  if (!head) {
    return {
      head: null,
      projection: null,
      state: null,
      transition: null,
      selected_record_ref: null,
    };
  }
  const transition = loadValidatedVNextSemanticTransitionRelationV01(db, {
    ...scope,
    transition_receipt_id: head.source_transition_receipt_id,
    transition_receipt_fingerprint: head.source_transition_receipt_fingerprint,
  });
  if (
    head.workspace_id !== scope.workspace_id ||
    head.project_id !== scope.project_id ||
    head.target_key !== targetKey ||
    head.updated_at !== transition.receipt.recorded_at
  ) {
    failV01("project_verify_current_head_receipt_binding_conflict");
  }
  const binding =
    transition.proposal.project_verify_lifecycle?.lifecycle_binding;
  if (
    !binding ||
    canonical(binding.family_target_ref) !== canonical(targetRef)
  ) {
    failV01("project_verify_current_head_transition_binding_conflict");
  }
  const effect = transition.receipt.effects.find(
    (candidate) => canonical(candidate.target_ref) === canonical(targetRef),
  );
  const intended = transition.gate_record.intended_effects.find(
    (candidate) => canonical(candidate.target_ref) === canonical(targetRef),
  );
  if (
    !effect ||
    !intended ||
    effect.after_state.presence !== head.presence ||
    effect.after_state.state_fingerprint !== head.current_state_fingerprint ||
    head.revision !== intended.expected_revision ||
    head.revision !== binding.selected_record_revision
  ) {
    failV01("project_verify_current_head_effect_conflict");
  }
  const projection = readVNextSemanticStateEntryV01(db, {
    ...scope,
    target_key: targetKey,
  });
  if (head.presence === "absent") {
    if (projection || effect.after_state.presence !== "absent") {
      failV01("project_verify_retracted_projection_conflict");
    }
    return {
      head,
      projection: null,
      state: null,
      transition,
      selected_record_ref: null,
    };
  }
  if (
    !projection ||
    projection.workspace_id !== scope.workspace_id ||
    projection.project_id !== scope.project_id ||
    projection.target_key !== targetKey ||
    projection.revision !== head.revision ||
    projection.updated_at !== head.updated_at ||
    canonical(projection.target_ref) !== canonical(targetRef) ||
    projection.state_fingerprint !== head.current_state_fingerprint ||
    projection.source_transition_receipt_id !==
      head.source_transition_receipt_id ||
    projection.source_transition_receipt_fingerprint !==
      head.source_transition_receipt_fingerprint
  ) {
    failV01("project_verify_current_projection_conflict");
  }
  const stateEnvelope = readVNextCoreRecordV01(db, {
    ...scope,
    record_kind: "semantic_state",
    record_id: projection.state_ref.external_id,
  });
  if (!stateEnvelope) failV01("project_verify_current_state_missing");
  const state = rebuildVNextPersistedSemanticStateV01(stateEnvelope.payload);
  assertEnvelopeV01(stateEnvelope, {
    ...scope,
    record_id: state.semantic_state_record_id,
    fingerprint: state.integrity.fingerprint,
    created_at: state.created_at,
  });
  if (
    state.state_content_fingerprint !== projection.state_fingerprint ||
    canonical(state.state_ref) !== canonical(projection.state_ref) ||
    canonical(effect.after_state.state_ref) !== canonical(state.state_ref) ||
    canonical(state.state_content.project_verify_lifecycle_binding) !==
      canonical(binding) ||
    state.source_proposal_id !== transition.proposal.proposal_id ||
    state.source_proposal_fingerprint !==
      transition.proposal.integrity.fingerprint ||
    state.source_decision_id !== transition.decision.decision_id ||
    state.source_decision_fingerprint !==
      transition.decision.integrity.fingerprint
  ) {
    failV01("project_verify_current_state_binding_conflict");
  }
  try {
    assertProjectVerifyLifecyclePersistedStateSourceBoundV01(db, {
      state,
      transition_receipt_id: head.source_transition_receipt_id,
      transition_receipt_fingerprint:
        head.source_transition_receipt_fingerprint,
    });
  } catch {
    failV01("project_verify_current_state_source_conflict");
  }
  return {
    head,
    projection,
    state,
    transition,
    selected_record_ref: structuredClone(binding.selected_record_ref),
  };
}

function validatedDecisionV01(
  db: Database.Database,
  envelope: VNextCoreRecordEnvelopeV01,
  proposal: EpisodeDeltaProposalV01,
  scope: { workspace_id: string; project_id: string },
): ReviewDecisionV01 {
  const validation = validateReviewDecisionAgainstEpisodeDeltaProposalV01(
    envelope.payload,
    proposal,
  );
  if (validation.status !== "valid") {
    failV01("project_verify_review_decision_invalid");
  }
  const decision = envelope.payload as ReviewDecisionV01;
  const profile = proposal.project_verify_lifecycle;
  if (
    profile &&
    profile.lifecycle_binding.selected_record_revision > 1 &&
    decision.decision !== "reject" &&
    decision.decision !== "defer"
  ) {
    const expectedHead = profile.current_head_expectation;
    if (
      expectedHead.presence !== "present" ||
      !expectedHead.source_transition_receipt_id ||
      !expectedHead.source_transition_receipt_fingerprint
    ) {
      failV01("project_verify_prior_decision_source_missing");
    }
    const prior = loadValidatedVNextSemanticTransitionRelationV01(db, {
      ...scope,
      transition_receipt_id: expectedHead.source_transition_receipt_id,
      transition_receipt_fingerprint:
        expectedHead.source_transition_receipt_fingerprint,
    });
    const declared = decision.lineage.prior_decisions;
    if (
      declared.length !== 1 ||
      declared[0]?.decision_id !== prior.decision.decision_id ||
      declared[0]?.decision_fingerprint !==
        prior.decision.integrity.fingerprint ||
      canonical(
        prior.proposal.project_verify_lifecycle?.lifecycle_binding
          .selected_record_ref,
      ) !== canonical(profile.lifecycle_binding.prior_record_ref)
    ) {
      failV01("project_verify_prior_decision_source_conflict");
    }
  }
  assertEnvelopeV01(envelope, {
    ...scope,
    record_id: decision.decision_id,
    fingerprint: decision.integrity.fingerprint,
    created_at: decision.decided_at,
  });
  return decision;
}

function validatedGateEnvelopeV01(
  db: Database.Database,
  envelope: VNextCoreRecordEnvelopeV01,
  proposal: EpisodeDeltaProposalV01,
  decision: ReviewDecisionV01,
  scope: { workspace_id: string; project_id: string },
): VNextSemanticCommitGateRecordV01 {
  const authenticated = loadValidatedVNextSemanticCommitGateRelationV01(db, {
    ...scope,
    gate_record_id: envelope.record_id,
    gate_record_fingerprint: envelope.fingerprint,
  });
  const gate = authenticated.gate_record;
  if (
    authenticated.eligibility.status !== "eligible" ||
    canonical(authenticated.proposal) !== canonical(proposal) ||
    canonical(authenticated.decision) !== canonical(decision) ||
    canonical(gate) !== canonical(envelope.payload)
  ) {
    failV01("project_verify_semantic_gate_source_conflict");
  }
  assertEnvelopeV01(envelope, {
    ...scope,
    record_id: gate.gate_record_id,
    fingerprint: gate.integrity.fingerprint,
    created_at: gate.confirmed_at,
  });
  if (envelope.idempotency_key !== gate.confirmation_digest) {
    failV01("project_verify_semantic_gate_envelope_conflict");
  }
  return gate;
}

function readSourceAssessmentMaterialV01(
  db: Database.Database,
  scope: { workspace_id: string; project_id: string },
  focus: ProjectVerifyReconciliationFocusV01 | null,
) {
  const packetRefs: ProjectVerifyExactProtocolRefV01[] = [];
  const receiptRefs: ProjectVerifyExactProtocolRefV01[] = [];
  const assessmentRefs: ProjectVerifyExactProtocolRefV01[] = [];
  const criteria: ProjectVerifyReconciliationV01["criteria"] = [];
  const proposalEnvelopes = listVNextCoreRecordsV01(db, {
    ...scope,
    record_kinds: ["episode_delta_proposal"],
    limit: READ_LIMIT_V01,
  });
  if (focus?.focus_kind === "criterion") {
    const rows = db
      .prepare(
        `SELECT record_id
         FROM vnext_core_records
         WHERE workspace_id = ? AND project_id = ?
           AND record_kind = 'episode_delta_proposal'
           AND json_type(payload_json, '$.operation_revision') IS NULL
           AND json_extract(
             payload_json,
             '$.source_assessment.packet_ref.external_id'
           ) = ?
           AND json_extract(
             payload_json,
             '$.source_assessment.packet_ref.source_ref'
           ) = ?
           AND json_extract(
             payload_json,
             '$.source_assessment.receipt_ref.external_id'
           ) = ?
           AND json_extract(
             payload_json,
             '$.source_assessment.receipt_ref.source_ref'
           ) = ?
           AND EXISTS (
             SELECT 1
             FROM json_each(
               payload_json,
               '$.source_assessment.assessment.criteria'
             ) AS criterion
             WHERE json_extract(criterion.value, '$.criterion_id') = ?
           )
         ORDER BY created_at, record_id
         LIMIT 2`,
      )
      .all(
        scope.workspace_id,
        scope.project_id,
        focus.packet_ref.record_id,
        focus.packet_ref.record_fingerprint,
        focus.receipt_ref.record_id,
        focus.receipt_ref.record_fingerprint,
        focus.criterion_id,
      ) as Array<{ record_id: string }>;
    for (const row of rows) {
      const envelope = readVNextCoreRecordV01(db, {
        ...scope,
        record_kind: "episode_delta_proposal",
        record_id: row.record_id,
      });
      if (!envelope) failV01("project_verify_source_record_disappeared");
      if (
        !proposalEnvelopes.some(
          (candidate) => candidate.record_id === envelope.record_id,
        )
      ) {
        proposalEnvelopes.push(envelope);
      }
    }
  }
  for (const envelope of proposalEnvelopes) {
    if (!isRecordV01(envelope.payload) || !envelope.payload.source_assessment) {
      continue;
    }
    const proposal = envelope.payload as unknown as EpisodeDeltaProposalV01;
    assertPersistedRunAssessmentProposalSourceBoundV01(db, proposal);
    const source = proposal.source_assessment!;
    const packetRef = exactRefV01(
      "task_context_packet",
      source.packet_ref.external_id,
      requiredShaV01(source.packet_ref.source_ref, "packet_source_ref_invalid"),
    );
    const receiptRef = exactRefV01(
      "run_receipt",
      source.receipt_ref.external_id,
      requiredShaV01(
        source.receipt_ref.source_ref,
        "receipt_source_ref_invalid",
      ),
    );
    const assessmentRef = exactRefV01(
      "criterion_assessment",
      source.assessment.assessment_fingerprint,
      source.assessment.assessment_fingerprint,
    );
    packetRefs.push(packetRef);
    receiptRefs.push(receiptRef);
    assessmentRefs.push(assessmentRef);
    for (const criterion of source.assessment.criteria) {
      criteria.push({
        packet_ref: packetRef,
        receipt_ref: receiptRef,
        assessment_ref: assessmentRef,
        criterion: structuredClone(criterion),
      });
    }
  }
  const uniqueCriteria = uniqueRecordsV01([], criteria, (item) =>
    canonical({
      packet_ref: item.packet_ref,
      receipt_ref: item.receipt_ref,
      assessment_ref: item.assessment_ref,
      criterion_id: item.criterion.criterion_id,
    }),
  );
  const focusedCriteria = uniqueCriteria.filter(
    (item) =>
      focus?.focus_kind === "criterion" &&
      item.criterion.criterion_id === focus.criterion_id &&
      exactProtocolRefEqualV01(item.packet_ref, focus.packet_ref) &&
      exactProtocolRefEqualV01(item.receipt_ref, focus.receipt_ref),
  );
  const packetRefCollection = boundedUniqueRecordsV01(
    focusedCriteria.map((item) => item.packet_ref),
    uniqueExactRefsV01(packetRefs),
    canonical,
  );
  const receiptRefCollection = boundedUniqueRecordsV01(
    focusedCriteria.map((item) => item.receipt_ref),
    uniqueExactRefsV01(receiptRefs),
    canonical,
  );
  const assessmentRefCollection = boundedUniqueRecordsV01(
    focusedCriteria.map((item) => item.assessment_ref),
    uniqueExactRefsV01(assessmentRefs),
    canonical,
  );
  return {
    packet_refs: packetRefCollection.records,
    receipt_refs: receiptRefCollection.records,
    assessment_refs: assessmentRefCollection.records,
    criteria: uniqueCriteria
      .sort((left, right) => {
        const leftFocused =
          focus?.focus_kind === "criterion" &&
          left.criterion.criterion_id === focus.criterion_id &&
          exactProtocolRefEqualV01(left.packet_ref, focus.packet_ref) &&
          exactProtocolRefEqualV01(left.receipt_ref, focus.receipt_ref)
            ? 0
            : 1;
        const rightFocused =
          focus?.focus_kind === "criterion" &&
          right.criterion.criterion_id === focus.criterion_id &&
          exactProtocolRefEqualV01(right.packet_ref, focus.packet_ref) &&
          exactProtocolRefEqualV01(right.receipt_ref, focus.receipt_ref)
            ? 0
            : 1;
        return (
          leftFocused - rightFocused ||
          canonical({
            packet_ref: left.packet_ref,
            receipt_ref: left.receipt_ref,
            assessment_ref: left.assessment_ref,
            criterion_id: left.criterion.criterion_id,
          }).localeCompare(
            canonical({
              packet_ref: right.packet_ref,
              receipt_ref: right.receipt_ref,
              assessment_ref: right.assessment_ref,
              criterion_id: right.criterion.criterion_id,
            }),
          )
        );
      })
      .slice(0, READ_LIMIT_V01),
    bounded_incomplete:
      packetRefCollection.bounded ||
      receiptRefCollection.bounded ||
      assessmentRefCollection.bounded ||
      uniqueCriteria.length > READ_LIMIT_V01,
  };
}

interface BoundedLaterContextCollectionV01 {
  records: ProjectVerifyLaterContextProjectionV01[];
  bounded: boolean;
  focus_bounded: boolean;
}

function readLaterContextV01(
  db: Database.Database,
  scope: { workspace_id: string; project_id: string },
  transitions: ValidatedVNextSemanticTransitionRelationV01[],
  focusedTransitionReceiptIds: Set<string>,
): BoundedLaterContextCollectionV01 {
  const result: ProjectVerifyLaterContextProjectionV01[] = [];
  let bounded = false;
  let focusBounded = false;
  const append = (
    item: ProjectVerifyLaterContextProjectionV01,
    focused: boolean,
  ): void => {
    if (result.length >= READ_LIMIT_V01) {
      bounded = true;
      focusBounded = focusBounded || focused;
      return;
    }
    result.push(item);
  };
  const orderedTransitions = [...transitions].sort((left, right) => {
    const leftFocused = focusedTransitionReceiptIds.has(
      left.receipt.transition_receipt_id,
    )
      ? 0
      : 1;
    const rightFocused = focusedTransitionReceiptIds.has(
      right.receipt.transition_receipt_id,
    )
      ? 0
      : 1;
    return (
      leftFocused - rightFocused ||
      left.receipt.transition_receipt_id.localeCompare(
        right.receipt.transition_receipt_id,
      )
    );
  });
  for (
    let transitionIndex = 0;
    transitionIndex < orderedTransitions.length;
    transitionIndex += 1
  ) {
    if (result.length >= READ_LIMIT_V01) {
      bounded = true;
      focusBounded =
        focusBounded ||
        orderedTransitions
          .slice(transitionIndex)
          .some((candidate) =>
            focusedTransitionReceiptIds.has(
              candidate.receipt.transition_receipt_id,
            ),
          );
      break;
    }
    const transition = orderedTransitions[transitionIndex]!;
    const receiptRef = transitionRefV01(transition.receipt);
    const focused = focusedTransitionReceiptIds.has(receiptRef.record_id);
    const packetCollection = queryLaterPacketEnvelopesV01(
      db,
      scope,
      receiptRef,
    );
    bounded = bounded || packetCollection.bounded;
    focusBounded = focusBounded || (focused && packetCollection.bounded);
    const later = packetCollection.records
      .map((envelope) =>
        assertProjectVerifyTaskContextPacketEnvelopeV01(envelope, scope),
      )
      .filter((packet) =>
        validateLaterPacketAgainstTransitionV01(db, scope, packet, transition),
      )
      .sort((left, right) =>
        left.generated_at.localeCompare(right.generated_at),
      );
    if (later.length === 0) {
      // A truncated exact-source query cannot prove packet absence. Surface
      // bounded incompleteness instead of claiming the focused transition is
      // still packet-pending.
      if (!packetCollection.bounded) {
        append(
          {
            source_transition_receipt_ref: receiptRef,
            later_packet_ref: null,
            context_use_review_ref: null,
            status: "transition_applied_packet_pending",
          },
          focused,
        );
      }
      continue;
    }
    for (const packet of later) {
      if (result.length >= READ_LIMIT_V01) {
        bounded = true;
        focusBounded = focusBounded || focused;
        break;
      }
      const reviewCollection = queryContextUseReviewEnvelopesV01(
        db,
        scope,
        receiptRef,
        packetRefV01(packet),
      );
      bounded = bounded || reviewCollection.bounded;
      focusBounded = focusBounded || (focused && reviewCollection.bounded);
      const matchingReview = reviewCollection.records.map((envelope) =>
        assertProjectVerifyContextUseReviewSourceBoundV01(
          db,
          scope,
          envelope,
          packet,
          transition,
        ),
      );
      if (matchingReview.length === 0) {
        if (!reviewCollection.bounded) {
          append(
            {
              source_transition_receipt_ref: receiptRef,
              later_packet_ref: packetRefV01(packet),
              context_use_review_ref: null,
              status: "packet_compiled_feedback_pending",
            },
            focused,
          );
        }
        continue;
      }
      for (const review of matchingReview) {
        append(
          {
            source_transition_receipt_ref: receiptRef,
            later_packet_ref: packetRefV01(packet),
            context_use_review_ref: contextUseReviewRefV01(review),
            status: "feedback_recorded",
          },
          focused,
        );
      }
    }
  }
  return {
    records: result.sort((left, right) =>
      `${left.source_transition_receipt_ref.record_id}\0${left.later_packet_ref?.record_id ?? ""}\0${left.context_use_review_ref?.record_id ?? ""}`.localeCompare(
        `${right.source_transition_receipt_ref.record_id}\0${right.later_packet_ref?.record_id ?? ""}\0${right.context_use_review_ref?.record_id ?? ""}`,
      ),
    ),
    bounded,
    focus_bounded: focusBounded,
  };
}

function queryLaterPacketEnvelopesV01(
  db: Database.Database,
  scope: { workspace_id: string; project_id: string },
  receiptRef: ProjectVerifyExactProtocolRefV01,
): BoundedRecordCollectionV01<VNextCoreRecordEnvelopeV01> {
  const rows = db
    .prepare(
      `SELECT DISTINCT core.record_id
       FROM vnext_core_records AS core
       JOIN json_each(
         core.payload_json,
         '$.compatibility.source_refs'
       ) AS source_ref
       WHERE core.workspace_id = ? AND core.project_id = ?
         AND core.record_kind = 'task_context_packet'
         AND json_extract(source_ref.value, '$.ref_type') = 'state_transition_receipt'
         AND json_extract(source_ref.value, '$.external_id') = ?
         AND json_extract(source_ref.value, '$.source_ref') = ?
       ORDER BY core.created_at, core.record_id
       LIMIT ?`,
    )
    .all(
      scope.workspace_id,
      scope.project_id,
      receiptRef.record_id,
      receiptRef.record_fingerprint,
      READ_LIMIT_V01 + 1,
    ) as Array<{ record_id: string }>;
  const records = rows
    .slice(0, READ_LIMIT_V01)
    .map(({ record_id: recordId }) => {
      const envelope = readVNextCoreRecordV01(db, {
        ...scope,
        record_kind: "task_context_packet",
        record_id: recordId,
      });
      if (!envelope) failV01("project_verify_later_packet_disappeared");
      return envelope;
    });
  return { records, bounded: rows.length > READ_LIMIT_V01 };
}

function queryContextUseReviewEnvelopesV01(
  db: Database.Database,
  scope: { workspace_id: string; project_id: string },
  receiptRef: ProjectVerifyExactProtocolRefV01,
  packetRef: ProjectVerifyExactProtocolRefV01,
): BoundedRecordCollectionV01<VNextCoreRecordEnvelopeV01> {
  const rows = db
    .prepare(
      `SELECT record_id
       FROM vnext_core_records
       WHERE workspace_id = ? AND project_id = ?
         AND record_kind = 'context_use_review'
         AND json_extract(
           payload_json,
           '$.source_transition_receipt.transition_receipt_id'
         ) = ?
         AND json_extract(
           payload_json,
           '$.source_transition_receipt.transition_receipt_fingerprint'
         ) = ?
         AND json_extract(payload_json, '$.later_packet.packet_id') = ?
         AND json_extract(
           payload_json,
           '$.later_packet.packet_fingerprint'
         ) = ?
       ORDER BY created_at, record_id
       LIMIT ?`,
    )
    .all(
      scope.workspace_id,
      scope.project_id,
      receiptRef.record_id,
      receiptRef.record_fingerprint,
      packetRef.record_id,
      packetRef.record_fingerprint,
      READ_LIMIT_V01 + 1,
    ) as Array<{ record_id: string }>;
  const records = rows
    .slice(0, READ_LIMIT_V01)
    .map(({ record_id: recordId }) => {
      const envelope = readVNextCoreRecordV01(db, {
        ...scope,
        record_kind: "context_use_review",
        record_id: recordId,
      });
      if (!envelope) failV01("project_verify_context_use_review_disappeared");
      return envelope;
    });
  return { records, bounded: rows.length > READ_LIMIT_V01 };
}

function validateLaterPacketAgainstTransitionV01(
  db: Database.Database,
  scope: { workspace_id: string; project_id: string },
  later: TaskContextPacketV01,
  transition: ValidatedVNextSemanticTransitionRelationV01,
): boolean {
  const priorRefs = later.compatibility.source_refs.filter(
    (ref) =>
      ref.ref_type === "task_context_packet" &&
      ref.source_ref &&
      ref.external_id !== later.packet_id,
  );
  return priorRefs.some((ref) => {
    const envelope = readVNextCoreRecordV01(db, {
      ...scope,
      record_kind: "task_context_packet",
      record_id: ref.external_id,
    });
    if (!envelope || envelope.fingerprint !== ref.source_ref) return false;
    const prior = assertProjectVerifyTaskContextPacketEnvelopeV01(
      envelope,
      scope,
    );
    return (
      validateTaskContextPacketTransitionRelationV01(
        prior,
        transition.receipt,
        later,
      ).status === "valid"
    );
  });
}

export function assertProjectVerifyContextUseReviewSourceBoundV01(
  db: Database.Database,
  scope: { workspace_id: string; project_id: string },
  envelope: VNextCoreRecordEnvelopeV01,
  later: TaskContextPacketV01,
  transition: ValidatedVNextSemanticTransitionRelationV01,
): ContextUseReviewV01 {
  const review = assertProjectVerifyContextUseReviewEnvelopeV01(
    envelope,
    scope,
  );
  const priorEnvelope = readVNextCoreRecordV01(db, {
    ...scope,
    record_kind: "task_context_packet",
    record_id: review.prior_packet.packet_id,
  });
  const runEnvelope = readVNextCoreRecordV01(db, {
    ...scope,
    record_kind: "run_receipt",
    record_id: review.later_task_run_receipt.receipt_id,
  });
  if (!priorEnvelope || !runEnvelope) {
    failV01("project_verify_context_use_review_source_missing");
  }
  const prior = assertProjectVerifyTaskContextPacketEnvelopeV01(
    priorEnvelope,
    scope,
  );
  const run = assertProjectVerifyRunReceiptEnvelopeV01(runEnvelope, scope);
  if (
    validateContextUseReviewRelationsV01(
      review,
      prior,
      later,
      transition.receipt,
      run,
    ).status !== "valid"
  ) {
    failV01("project_verify_context_use_review_relation_invalid");
  }
  return review;
}

function buildApplicabilityGroupsV01(
  claimFamilies: ProjectVerifyClaimFamilyProjectionV01[],
  relationFamilies: ProjectVerifyRelationFamilyProjectionV01[],
  relationById: Map<string, ClaimEvidenceRelationV01>,
): BoundedRecordCollectionV01<
  ProjectVerifyReconciliationV01["applicability_groups"][number]
> {
  const groups = new Map<string, ProjectVerifyClaimFamilyProjectionV01[]>();
  let comparisonCount = 0;
  let bounded = false;
  for (const family of claimFamilies.filter(
    (candidate) => candidate.applied_current_head_ref !== null,
  )) {
    const subjectKey = canonical(family.subject_refs);
    const bucket = groups.get(subjectKey) ?? [];
    bucket.push(family);
    groups.set(subjectKey, bucket);
  }
  const records = [...groups.entries()]
    .map(([subjectKey, families]) => {
      const comparisons: ProjectVerifyReconciliationV01["applicability_groups"][number]["pairwise_scope_comparisons"] =
        [];
      let hasUnknown = false;
      let hasPairwiseOverlap = families.length === 1;
      for (let left = 0; left < families.length; left += 1) {
        for (let right = left + 1; right < families.length; right += 1) {
          const comparison = compareProjectVerifyApplicabilityScopesV01(
            families[left]!.applicability_scope,
            families[right]!.applicability_scope,
          );
          hasUnknown = hasUnknown || comparison.status === "unknown";
          hasPairwiseOverlap =
            hasPairwiseOverlap || comparison.status === "overlap";
          const projected = {
            left_claim_family_id: families[left]!.claim_family_id,
            right_claim_family_id: families[right]!.claim_family_id,
            comparison,
          };
          if (comparisonCount < READ_LIMIT_V01) {
            comparisons.push(projected);
            comparisonCount += 1;
          } else {
            bounded = true;
          }
        }
      }
      const claimIds = new Set(
        families.flatMap((family) =>
          family.applied_current_head_ref
            ? [family.applied_current_head_ref.record_id]
            : [],
        ),
      );
      const currentFamilyByClaimId = new Map(
        families.flatMap((family) =>
          family.applied_current_head_ref
            ? [[family.applied_current_head_ref.record_id, family] as const]
            : [],
        ),
      );
      const appliedRelationSources = relationFamilies.flatMap((family) => {
        const current = family.applied_current_head_ref;
        if (!current) return [];
        const relation = relationById.get(current.record_id);
        if (!relation || !claimIds.has(relation.claim_ref.record_id)) return [];
        const claimFamily = currentFamilyByClaimId.get(
          relation.claim_ref.record_id,
        );
        if (!claimFamily) return [];
        const exactApplicabilitySubjects =
          canonical(relation.applicability_scope.subject_refs) ===
          canonical(claimFamily.applicability_scope.subject_refs);
        return [
          {
            relation,
            scope_comparison: exactApplicabilitySubjects
              ? compareProjectVerifyApplicabilityScopesV01(
                  relation.applicability_scope,
                  claimFamily.applicability_scope,
                )
              : null,
            projection: {
              relation_kind: relation.relation_kind,
              relation_ref: claimEvidenceRelationReferenceV01(relation),
              claim_ref: structuredClone(relation.claim_ref),
              evidence_ref: structuredClone(relation.evidence_ref),
            },
          },
        ];
      });
      const appliedRelations = appliedRelationSources.map(
        (source) => source.projection,
      );
      const allNotApplicable = families.every(
        (family) =>
          family.applicability_scope.condition.kind === "constant" &&
          family.applicability_scope.condition.value === "not_applicable",
      );
      const opposingScopeComparisons = appliedRelationSources
        .filter(
          ({ relation }) =>
            relation.relation_kind === "opposes" ||
            relation.relation_kind === "contradicts",
        )
        .map(({ scope_comparison: comparison }) => comparison);
      const opposingScopeUnknown = opposingScopeComparisons.some(
        (comparison) => comparison === null || comparison.status === "unknown",
      );
      const disputed =
        families.some((family) => family.conflicts.length > 0) ||
        (hasPairwiseOverlap &&
          opposingScopeComparisons.some(
            (comparison) => comparison?.status === "overlap",
          ));
      return {
        group_id: createProtocolSha256V01(
          canonicalizeProtocolValueV01({
            namespace: "project_verify_applicability_group.v0.1",
            subject_key: subjectKey,
            family_ids: families.map((family) => family.claim_family_id).sort(),
          }),
        ),
        subject_refs: structuredClone(families[0]!.subject_refs),
        claim_family_ids: families
          .map((family) => family.claim_family_id)
          .sort(),
        pairwise_scope_comparisons: comparisons,
        disposition: allNotApplicable
          ? "not_applicable"
          : families.some((family) => family.conflicts.length > 0)
            ? "disputed"
            : hasUnknown || (hasPairwiseOverlap && opposingScopeUnknown)
              ? "scope_overlap_unknown"
              : disputed
                ? "disputed"
                : "coexisting",
        applied_relation_material: appliedRelations.sort((left, right) =>
          left.relation_ref.record_id.localeCompare(
            right.relation_ref.record_id,
          ),
        ),
      } as const;
    })
    .sort((left, right) => left.group_id.localeCompare(right.group_id));
  if (records.length > READ_LIMIT_V01) bounded = true;
  return { records: records.slice(0, READ_LIMIT_V01), bounded };
}

function evidenceProjectionV01(
  evidence: EvidenceRecordV01,
): ProjectVerifyEvidenceProjectionV01 {
  const conclusive =
    evidence.trust_class === "direct_local_observation" ||
    evidence.trust_class === "verified_external_observation";
  return {
    evidence_ref: evidenceRecordReferenceV01(evidence),
    evidence,
    source_authentication: conclusive
      ? {
          status: "verified",
          authenticator_profile: evidence.producer.producer_profile,
        }
      : { status: "not_required", authenticator_profile: null },
    trust_class: evidence.trust_class,
    coverage: evidence.coverage,
    source_refs: structuredClone(evidence.source_refs),
    limitations: [...evidence.limitations],
    uncertainty: [...evidence.uncertainty],
    acceptance_status: "not_accepted_by_record_existence",
  };
}

function queryCoreRecordsV01(
  db: Database.Database,
  scope: { workspace_id: string; project_id: string },
  input: {
    record_kind:
      "review_decision" | "semantic_commit_gate" | "state_transition_receipt";
    where: string[];
    values: string[];
    limit: number;
  },
): VNextCoreRecordEnvelopeV01[] {
  if (input.limit < 1 || input.limit > 3) failV01("read_query_limit_invalid");
  const rows = db
    .prepare(
      `SELECT record_id
       FROM vnext_core_records
       WHERE workspace_id = ? AND project_id = ? AND record_kind = ?
         AND ${input.where.join(" AND ")}
       ORDER BY created_at, record_id
       LIMIT ?`,
    )
    .all(
      scope.workspace_id,
      scope.project_id,
      input.record_kind,
      ...input.values,
      input.limit,
    ) as Array<{ record_id: string }>;
  return rows.map((row) => {
    const envelope = readVNextCoreRecordV01(db, {
      ...scope,
      record_kind: input.record_kind,
      record_id: row.record_id,
    });
    if (!envelope) failV01("project_verify_source_record_disappeared");
    return envelope;
  });
}

function countCoreRecordsWhereV01(
  db: Database.Database,
  scope: { workspace_id: string; project_id: string },
  input: {
    record_kind:
      "review_decision" | "semantic_commit_gate" | "state_transition_receipt";
    where: string[];
    values: string[];
  },
): number {
  const row = db
    .prepare(
      `SELECT COUNT(*) AS count
       FROM vnext_core_records
       WHERE workspace_id = ? AND project_id = ? AND record_kind = ?
         AND ${input.where.join(" AND ")}`,
    )
    .get(
      scope.workspace_id,
      scope.project_id,
      input.record_kind,
      ...input.values,
    ) as { count: number };
  return row.count;
}

export function assertProjectVerifyTaskContextPacketEnvelopeV01(
  envelope: VNextCoreRecordEnvelopeV01,
  scope: { workspace_id: string; project_id: string },
): TaskContextPacketV01 {
  const packet = envelope.payload as TaskContextPacketV01;
  if (
    validateTaskContextPacketV01(packet, {
      evaluated_at: packet.generated_at,
    }).status !== "valid"
  ) {
    failV01("project_verify_later_packet_invalid");
  }
  assertEnvelopeV01(envelope, {
    ...scope,
    record_id: packet.packet_id,
    fingerprint: packet.integrity.fingerprint,
    created_at: packet.generated_at,
  });
  if (envelope.idempotency_key !== null) {
    failV01("project_verify_task_context_packet_envelope_conflict");
  }
  return packet;
}

export function assertProjectVerifyRunReceiptEnvelopeV01(
  envelope: VNextCoreRecordEnvelopeV01,
  scope: { workspace_id: string; project_id: string },
): RunReceiptV01 {
  if (validateRunReceiptV01(envelope.payload).status !== "valid") {
    failV01("project_verify_context_use_run_receipt_invalid");
  }
  const run = envelope.payload as RunReceiptV01;
  assertEnvelopeV01(envelope, {
    ...scope,
    record_id: run.receipt_id,
    fingerprint: run.integrity.fingerprint,
    created_at: run.recorded_at,
  });
  if (envelope.idempotency_key !== run.idempotency_key) {
    failV01("project_verify_context_use_run_receipt_envelope_conflict");
  }
  return run;
}

export function assertProjectVerifyContextUseReviewEnvelopeV01(
  envelope: VNextCoreRecordEnvelopeV01,
  scope: { workspace_id: string; project_id: string },
): ContextUseReviewV01 {
  if (validateContextUseReviewV01(envelope.payload).status !== "valid") {
    failV01("project_verify_context_use_review_invalid");
  }
  const review = envelope.payload as ContextUseReviewV01;
  assertEnvelopeV01(envelope, {
    ...scope,
    record_id: review.review_id,
    fingerprint: review.integrity.fingerprint,
    created_at: review.reviewed_at,
  });
  const logicalIdentity =
    createVNextOperatorPilotContextUseReviewLogicalIdentityV01(review);
  const expectedIdempotencyKey = createProtocolSha256V01(
    canonicalizeProtocolValueV01({ logical_identity: logicalIdentity }),
  );
  if (envelope.idempotency_key !== expectedIdempotencyKey) {
    failV01("project_verify_context_use_review_envelope_conflict");
  }
  return review;
}

function assertEnvelopeV01(
  envelope: VNextCoreRecordEnvelopeV01,
  expected: {
    workspace_id: string;
    project_id: string;
    record_id: string;
    fingerprint: string;
    created_at: string;
  },
): void {
  try {
    assertVNextCoreRecordMatchesProtocolPayloadBindingV01(envelope, expected);
  } catch {
    failV01("project_verify_protocol_envelope_conflict");
  }
  if (
    envelope.record_id !== expected.record_id ||
    envelope.created_at !== expected.created_at
  ) {
    failV01("project_verify_protocol_envelope_conflict");
  }
}

function familyConflictsV01(
  revisions: Array<
    | ProjectVerifyClaimRevisionProjectionV01
    | ProjectVerifyRelationRevisionProjectionV01
  >,
): ProjectVerifyConflictV01[] {
  return boundedConflictsV01(
    revisions.flatMap((revision) => revision.lifecycle.conflicts),
  );
}

function familyTargetForRecordV01(
  record: ProjectVerifyLifecycleSelectedRecordV01,
): ExternalRefV01 {
  return createProjectVerifyFamilyTargetRefV01({
    entity_kind:
      "claim_version" in record ? "claim_record" : "claim_evidence_relation",
    family_id:
      "claim_version" in record
        ? record.claim_family_id
        : record.relation_family_id,
    family_origin_fingerprint: createProjectVerifyFamilyOriginFingerprintV01(
      record.family_origin,
    ),
  });
}

function priorRecordRefV01(record: ProjectVerifyLifecycleSelectedRecordV01) {
  return "claim_version" in record
    ? record.prior_claim_ref
    : record.prior_relation_ref;
}

function operationTargetRefV01(
  record: ProjectVerifyLifecycleSelectedRecordV01,
) {
  return "claim_version" in record
    ? record.operation_target_claim_ref
    : record.supersedes_relation_ref;
}

function selectedRecordRefV01(record: ProjectVerifyLifecycleSelectedRecordV01) {
  return "claim_version" in record
    ? claimRecordReferenceV01(record)
    : claimEvidenceRelationReferenceV01(record);
}

function emptyRelationBucketsV01(): ProjectVerifyRelationMaterialBucketsV01 {
  return {
    supports: [],
    opposes: [],
    contradicts: [],
    qualifies: [],
    contextualizes: [],
    insufficient: [],
  };
}

function relationBucketV01(
  kind: ClaimEvidenceRelationV01["relation_kind"],
): keyof ProjectVerifyRelationMaterialBucketsV01 {
  return kind;
}

function sortRelationBucketsV01(
  buckets: ProjectVerifyRelationMaterialBucketsV01,
): void {
  for (const refs of Object.values(
    buckets,
  ) as ClaimEvidenceRelationReferenceV01[][]) {
    refs.sort((left, right) => left.record_id.localeCompare(right.record_id));
  }
}

function relationBucketRefCountV01(
  buckets: ProjectVerifyRelationMaterialBucketsV01,
): number {
  return Object.values(buckets).reduce((count, refs) => count + refs.length, 0);
}

function completenessV01(
  returned: number,
  incomplete: boolean,
  reason: string | null,
  fixedBound = READ_LIMIT_V01,
): ProjectVerifyReadCompletenessV01 {
  return {
    status: incomplete ? "bounded_incomplete" : "complete",
    returned_items: returned,
    fixed_bound: fixedBound,
    continuation_cursor: null,
    omitted_reason: reason,
  };
}

function readAuthorityV01(): ProjectVerifyReadAuthorityV01 {
  return {
    read_only: true,
    projection_is_rebuildable: true,
    writes_database: false,
    creates_evidence: false,
    accepts_evidence: false,
    creates_claim_or_relation: false,
    creates_proposal: false,
    creates_review_decision: false,
    authorizes_semantic_commit_gate: false,
    applies_transition: false,
    selects_current_head: false,
    establishes_truth: false,
    changes_semantic_state: false,
    changes_later_context: false,
    calls_model_or_provider: false,
    performs_network_or_external_action: false,
  };
}

function proposalRefV01(
  proposal: EpisodeDeltaProposalV01,
): ProjectVerifyExactProtocolRefV01 {
  return exactRefV01(
    "episode_delta_proposal",
    proposal.proposal_id,
    proposal.integrity.fingerprint,
  );
}

function candidateRefV01(
  proposal: EpisodeDeltaProposalV01,
): ProjectVerifyExactProtocolRefV01 {
  const candidate = proposal.proposed_deltas[0]!;
  return exactRefV01(
    "episode_delta_proposal_candidate",
    candidate.candidate_id,
    createEpisodeDeltaCandidateFingerprintV01(candidate),
  );
}

function decisionRefV01(
  decision: ReviewDecisionV01,
): ProjectVerifyExactProtocolRefV01 {
  return exactRefV01(
    "review_decision",
    decision.decision_id,
    decision.integrity.fingerprint,
  );
}

function gateRefV01(
  gate: VNextSemanticCommitGateRecordV01,
): ProjectVerifyExactProtocolRefV01 {
  return exactRefV01(
    "semantic_commit_gate",
    gate.gate_record_id,
    gate.integrity.fingerprint,
  );
}

function transitionRefV01(
  receipt: StateTransitionReceiptV01,
): ProjectVerifyExactProtocolRefV01 {
  return exactRefV01(
    "state_transition_receipt",
    receipt.transition_receipt_id,
    receipt.integrity.fingerprint,
  );
}

function semanticStateRefV01(
  state: VNextPersistedSemanticStateVersionV01,
): ProjectVerifyExactProtocolRefV01 {
  return exactRefV01(
    "semantic_state",
    state.semantic_state_record_id,
    state.integrity.fingerprint,
  );
}

function targetHeadRefV01(
  head: VNextSemanticTargetHeadV01,
): ProjectVerifyExactProtocolRefV01 {
  return exactRefV01(
    "semantic_target_head",
    head.target_key,
    createProtocolSha256V01(canonicalizeProtocolValueV01(head)),
  );
}

function packetRefV01(
  packet: TaskContextPacketV01,
): ProjectVerifyExactProtocolRefV01 {
  return exactRefV01(
    "task_context_packet",
    packet.packet_id,
    packet.integrity.fingerprint,
  );
}

function contextUseReviewRefV01(
  review: ContextUseReviewV01,
): ProjectVerifyExactProtocolRefV01 {
  return exactRefV01(
    "context_use_review",
    review.review_id,
    review.integrity.fingerprint,
  );
}

function exactRefV01(
  recordKind: ProjectVerifyExactProtocolKindV01,
  recordId: string,
  recordFingerprint: string,
): ProjectVerifyExactProtocolRefV01 {
  return {
    record_kind: recordKind,
    record_id: requiredTextV01(recordId, "protocol_ref_record_id_invalid"),
    record_fingerprint: requiredShaV01(
      recordFingerprint,
      "protocol_ref_fingerprint_invalid",
    ),
  };
}

function uniqueExactRefsV01(
  refs: ProjectVerifyExactProtocolRefV01[],
): ProjectVerifyExactProtocolRefV01[] {
  const unique = new Map(refs.map((ref) => [canonical(ref), ref]));
  return [...unique.values()].sort((left, right) =>
    `${left.record_kind}\0${left.record_id}`.localeCompare(
      `${right.record_kind}\0${right.record_id}`,
    ),
  );
}

function uniqueValidatedTransitionsV01(
  refs: ProjectVerifyExactProtocolRefV01[],
): ProjectVerifyExactProtocolRefV01[] {
  return uniqueExactRefsV01(refs).filter(
    (ref) => ref.record_kind === "state_transition_receipt",
  );
}

function compactRefsV01(
  refs: Array<ProjectVerifyExactProtocolRefV01 | null>,
): ProjectVerifyExactProtocolRefV01[] {
  return uniqueExactRefsV01(
    refs.filter((ref): ref is ProjectVerifyExactProtocolRefV01 => ref !== null),
  );
}

function boundedConflictsV01(
  conflicts: ProjectVerifyConflictV01[],
): ProjectVerifyConflictV01[] {
  return conflicts
    .sort((left, right) =>
      `${left.conflict_kind}\0${left.code}`.localeCompare(
        `${right.conflict_kind}\0${right.code}`,
      ),
    )
    .slice(0, PROJECT_VERIFY_RECONCILIATION_MAX_CONFLICTS_V01);
}

function conflictKindForCodeV01(
  code: string,
): ProjectVerifyConflictV01["conflict_kind"] {
  if (code.includes("decision")) return "review_decision";
  if (code.includes("gate")) return "semantic_commit_gate";
  if (code.includes("transition")) return "transition";
  return "lineage";
}

function sameRecordRefV01(
  left: ClaimRecordReferenceV01 | ClaimEvidenceRelationReferenceV01 | null,
  right: ClaimRecordReferenceV01 | ClaimEvidenceRelationReferenceV01 | null,
): boolean {
  return Boolean(left && right && canonical(left) === canonical(right));
}

function canonical(value: unknown): string {
  return canonicalizeProtocolValueV01(value);
}

function normalizeScopeV01(input: {
  workspace_id: string;
  project_id: string;
}) {
  return {
    workspace_id: requiredTextV01(input.workspace_id, "workspace_id_invalid"),
    project_id: requiredTextV01(input.project_id, "project_id_invalid"),
  };
}

function requiredTextV01(value: unknown, code: string): string {
  if (
    typeof value !== "string" ||
    value.trim() !== value ||
    value.length === 0 ||
    value.length > PROJECT_VERIFY_READ_MAX_IDENTIFIER_CHARACTERS_V01
  ) {
    failV01(code);
  }
  return value;
}

function validateFocusV01(focus: ProjectVerifyReconciliationFocusV01): void {
  if (!focus || typeof focus !== "object") failV01("focus_invalid");
  switch (focus.focus_kind) {
    case "criterion":
      assertExactKeysV01(
        focus,
        ["focus_kind", "criterion_id", "packet_ref", "receipt_ref"],
        "focus_fields_invalid",
      );
      requiredTextV01(focus.criterion_id, "criterion_id_invalid");
      validateFocusExactRefV01(focus.packet_ref, "task_context_packet");
      validateFocusExactRefV01(focus.receipt_ref, "run_receipt");
      return;
    case "evidence":
      assertExactKeysV01(
        focus,
        ["focus_kind", "evidence_id"],
        "focus_fields_invalid",
      );
      requiredTextV01(focus.evidence_id, "evidence_id_invalid");
      return;
    case "claim":
      assertExactKeysV01(
        focus,
        ["focus_kind", "claim_id"],
        "focus_fields_invalid",
      );
      requiredTextV01(focus.claim_id, "claim_id_invalid");
      return;
    case "claim_family":
      assertExactKeysV01(
        focus,
        ["focus_kind", "claim_family_id"],
        "focus_fields_invalid",
      );
      requiredTextV01(focus.claim_family_id, "claim_family_id_invalid");
      return;
    case "claim_evidence_relation":
      assertExactKeysV01(
        focus,
        ["focus_kind", "relation_id"],
        "focus_fields_invalid",
      );
      requiredTextV01(focus.relation_id, "relation_id_invalid");
      return;
    case "claim_evidence_relation_family":
      assertExactKeysV01(
        focus,
        ["focus_kind", "relation_family_id"],
        "focus_fields_invalid",
      );
      requiredTextV01(focus.relation_family_id, "relation_family_id_invalid");
      return;
    case "proposal":
      assertExactKeysV01(
        focus,
        ["focus_kind", "proposal_id"],
        "focus_fields_invalid",
      );
      requiredTextV01(focus.proposal_id, "proposal_id_invalid");
      return;
    case "transition_receipt":
      assertExactKeysV01(
        focus,
        ["focus_kind", "transition_receipt_id"],
        "focus_fields_invalid",
      );
      requiredTextV01(
        focus.transition_receipt_id,
        "transition_receipt_id_invalid",
      );
      return;
    default:
      failV01("focus_kind_invalid");
  }
}

function validateFocusExactRefV01(
  ref: ProjectVerifyExactProtocolRefV01,
  expectedKind: ProjectVerifyExactProtocolKindV01,
): void {
  assertExactKeysV01(
    ref,
    ["record_kind", "record_id", "record_fingerprint"],
    "focus_ref_fields_invalid",
  );
  if (ref.record_kind !== expectedKind) failV01("focus_ref_kind_invalid");
  requiredTextV01(ref.record_id, "focus_ref_record_id_invalid");
  requiredShaV01(ref.record_fingerprint, "focus_ref_fingerprint_invalid");
}

function assertExactKeysV01(
  value: unknown,
  expectedKeys: readonly string[],
  code: string,
): void {
  if (!isRecordV01(value)) failV01(code);
  const actual = Object.keys(value).sort();
  const expected = [...expectedKeys].sort();
  if (canonical(actual) !== canonical(expected)) failV01(code);
}

function requiredTimestampV01(value: unknown, code: string): string {
  const text = requiredTextV01(value, code);
  if (parseStrictIsoTimestampV01(text) === null) failV01(code);
  return text;
}

function requiredShaV01(value: unknown, code: string): string {
  const text = requiredTextV01(value, code);
  if (!SHA256_V01.test(text)) failV01(code);
  return text;
}

function isRecordV01(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function failV01(code: string): never {
  throw new ProjectVerifyReconciliationReadErrorV01(code);
}
