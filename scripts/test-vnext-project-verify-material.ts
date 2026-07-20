import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import Database from "better-sqlite3";

import { genericCliDirectObservationInputFixture } from "@/fixtures/vnext/protocol/run-receipt-v0-1";
import { genericCliBuilderInputFixture } from "@/fixtures/vnext/protocol/task-context-packet-v0-1";
import { createSemanticTransitionDecisionInputV01 } from "@/fixtures/vnext/protocol/semantic-transition-loop-v0-1";
import {
  createAcceptedEvidenceRefAuthorityBoundaryV01,
  listAcceptedEvidenceRefRuntimeV01,
  readAcceptedEvidenceRefRuntimeV01,
} from "@/lib/product-write/accepted-evidence-ref-runtime";
import {
  ensureAcceptedEvidenceRefStoreSchemaV01,
  writeAcceptedEvidenceRefRecordV01,
} from "@/lib/product-write/accepted-evidence-ref-store";
import { buildLogicalClaimShapePreviewReport } from "@/lib/research-candidate-review/logical-claim-shape";
import {
  createLocalProjectRootCriterionVerificationPlanV01,
  LOCAL_PROJECT_ROOT_VERIFICATION_REQUIRED_CHECKS_V01,
  LOCAL_PROJECT_ROOT_VERIFICATION_TASK_V01,
} from "@/lib/vnext/automation/local-project-root-verification-profile";
import { evaluateCriterionAssessmentV01 } from "@/lib/vnext/criterion-assessment";
import { createProtocolSha256V01 } from "@/lib/vnext/protocol-primitives";
import { admitEpisodeDeltaProposalV01 } from "@/lib/vnext/persistence/episode-delta-proposal-admission";
import {
  admitClaimEvidenceRelationV01,
  admitClaimRecordV01,
  admitEvidenceRecordV01,
  admitProjectVerifyMaterialBatchV01,
  createProjectVerifyMaterialReadSessionV01,
  listClaimEvidenceRelationFamilyRevisionsV01,
  listClaimFamilyRevisionsV01,
  listProjectClaimRecordsV01,
  listProjectEvidenceRecordsV01,
  listRelationsForExactClaimV01,
  listRelationsForExactEvidenceV01,
  readClaimEvidenceRelationV01,
  readClaimEvidenceRelationFamilyLineageV01,
  readClaimFamilyLineageV01,
  readClaimRecordV01,
  readEvidenceRecordV01,
  ProjectVerifyMaterialStoreErrorV01,
} from "@/lib/vnext/persistence/project-verify-material-store";
import {
  admitRunCriterionProjectVerifyMaterialV01,
  readSourceBoundRunCriterionProjectVerifyMaterialV01,
  RunCriterionProjectVerifyMaterialAdmissionErrorV01,
} from "@/lib/vnext/persistence/run-criterion-project-verify-material-admission";
import {
  countVNextCoreRecordsV01,
  ensureVNextDurableSemanticStoreSchemaV01,
  insertVNextCoreRecordV01,
} from "@/lib/vnext/persistence/durable-semantic-store";
import {
  buildClaimEvidenceRelationV01,
  buildClaimRecordV01,
  buildEvidenceRecordV01,
  canonicalizeProjectVerifyMaterialV01,
  claimEvidenceRelationReferenceV01,
  claimRecordReferenceV01,
  createClaimApplicabilityScopeV01,
  evidenceRecordReferenceV01,
  ProjectVerifyMaterialErrorV01,
} from "@/lib/vnext/project-verify-material";
import { materializeRunAssessmentProposalV01 } from "@/lib/vnext/run-assessment-proposal";
import { materializeRunCriterionProjectVerifyMaterialV01 } from "@/lib/vnext/run-criterion-project-verify-material";
import {
  buildReviewDecisionV01,
  validateReviewDecisionAgainstEpisodeDeltaProposalV01,
  validateReviewDecisionV01,
} from "@/lib/vnext/review-decision";
import {
  buildRunReceiptV01,
  type RunReceiptBuilderInputV01,
} from "@/lib/vnext/run-receipt";
import {
  buildTaskContextPacketV01,
  type TaskContextPacketBuilderInputV01,
} from "@/lib/vnext/task-context-packet";
import type {
  ClaimApplicabilityScopeV01,
  ClaimEvidenceRelationKindV01,
  ClaimEvidenceRelationV01,
  ClaimOperationIntentV01,
  ClaimRecordV01,
  EvidenceRecordV01,
} from "@/types/vnext/project-verify-material";
import type { ExternalRefV01 } from "@/types/vnext/external-ref";
import type { TaskContextPacketV01 } from "@/types/vnext/task-context-packet";
import type { LogicalClaimShapePreviewBuilderInput } from "@/types/research-candidate-logical-claim-shape";
import {
  ProductWriteAcceptedEvidenceRefOperatorApprovalPayloadVersion,
  ProductWriteAcceptedEvidenceRefRecordVersion,
  ProductWriteAcceptedEvidenceRefRuntimeSliceRef,
  ProductWriteAcceptedEvidenceRefRuntimeVersion,
  ProductWriteAcceptedEvidenceRefScope,
  ProductWriteAcceptedEvidenceRefStoreVersion,
  ProductWriteAcceptedEvidenceRefTargetGroup,
  type ProductWriteAcceptedEvidenceRefCreateInput,
  type ProductWriteAcceptedEvidenceRefRecord,
} from "@/types/product-write-accepted-evidence-ref";
import { migrateVNextDurableSemanticStoreV01 } from "./db-migrations.mjs";

const WORKSPACE_ID = "workspace-sr2-project-verify-proof";
const PROJECT_ID = "project-sr2-project-verify-proof";
const OTHER_PROJECT_ID = "project-sr2-project-verify-proof-other";
const CREATED_AT = "2026-07-10T04:00:00.000Z";
const PRODUCER = {
  producer_kind: "server_deterministic_evaluator" as const,
  producer_profile: "sr2-project-verify-focused-proof.v0.1",
};
const USER_PRODUCER = {
  producer_kind: "user" as const,
  producer_profile: "sr2-project-verify-user-candidate.v0.1",
};
const MODEL_PRODUCER = {
  producer_kind: "model" as const,
  producer_profile: "sr2-project-verify-model-candidate.v0.1",
};

function refV01(
  refType: string,
  externalId: string,
  trustClass: ExternalRefV01["trust_class"] = "direct_local_observation",
): ExternalRefV01 {
  return {
    ref_version: "external_ref.v0.1",
    ref_type: refType,
    external_id: externalId,
    trust_class: trustClass,
    observed_at: CREATED_AT,
  };
}

const subjectRef = refV01("project_verify_subject", "subject:sr2-proof");
const sourceRef = refV01("project_verify_source", "source:sr2-proof");
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
  summary?: string;
  projectId?: string;
  trustClass?: ExternalRefV01["trust_class"];
  producer?: EvidenceRecordV01["producer"];
}): EvidenceRecordV01 {
  const trustClass = input.trustClass ?? "derived_interpretation";
  const evidenceKind =
    trustClass === "host_attestation"
      ? "host_attestation_material"
      : trustClass === "user_declaration"
        ? "user_declared_material"
        : trustClass === "provider_report"
          ? "provider_report_material"
          : trustClass === "imported_unverified"
            ? "imported_unverified_material"
            : "derived_interpretation_material";
  return buildEvidenceRecordV01({
    identity_namespace: "augnes.test.sr2.evidence.v0.1",
    identity_key: input.identityKey,
    workspace_id: WORKSPACE_ID,
    project_id: input.projectId ?? PROJECT_ID,
    evidence_kind: evidenceKind,
    subject_refs: [subjectRef],
    source_refs: [sourceRef],
    source_observed_or_reported_at: CREATED_AT,
    recorded_at: CREATED_AT,
    trust_class: trustClass,
    coverage: "complete",
    bounded_summary: input.summary ?? `Evidence ${input.identityKey}.`,
    material_fingerprint: null,
    limitations: ["Support material is not truth or accepted state."],
    uncertainty: [],
    producer: input.producer ?? PRODUCER,
  });
}

function claimV01(input: {
  revision: number;
  prior: ClaimRecordV01 | null;
  operation: ClaimOperationIntentV01;
  target?: ClaimRecordV01 | null;
  proposition: string;
  familySeed?: string;
  projectId?: string;
  scope?: ClaimApplicabilityScopeV01;
  producer?: ClaimRecordV01["producer"];
  sourceRefs?: ExternalRefV01[];
}): ClaimRecordV01 {
  const producer = input.producer ?? PRODUCER;
  const priorOrigin = input.prior?.family_origin;
  return buildClaimRecordV01({
    family_origin: {
      origin_namespace:
        priorOrigin?.origin_namespace ?? "augnes.test.sr2.claim-family.v0.1",
      origin_seed:
        input.familySeed ?? priorOrigin?.origin_seed ?? "explicit-family-seed",
      origin_profile: priorOrigin?.origin_profile ?? producer.producer_profile,
      origin_producer_kind:
        priorOrigin?.origin_producer_kind ?? producer.producer_kind,
    },
    workspace_id: WORKSPACE_ID,
    project_id: input.projectId ?? PROJECT_ID,
    revision: input.revision,
    prior_claim_ref: input.prior ? claimRecordReferenceV01(input.prior) : null,
    operation_intent: input.operation,
    operation_target_claim_ref: input.target
      ? claimRecordReferenceV01(input.target)
      : null,
    proposition: input.proposition,
    subject_refs: [subjectRef],
    applicability_scope: input.scope ?? applicability,
    source_refs: input.sourceRefs ?? [sourceRef],
    limitations: ["Candidate proposition remains non-applied."],
    uncertainty: ["Truth is not established by record existence."],
    producer,
    created_at: new Date(
      Date.parse(CREATED_AT) + input.revision * 1_000,
    ).toISOString(),
  });
}

function relationV01(input: {
  familySeed: string;
  revision?: number;
  prior?: ClaimEvidenceRelationV01 | null;
  operation?: ClaimOperationIntentV01;
  supersedes?: ClaimEvidenceRelationV01 | null;
  claim: ClaimRecordV01;
  evidence: EvidenceRecordV01;
  kind: ClaimEvidenceRelationKindV01;
  basis?: "observed" | "attested" | "mixed" | "insufficient";
  trustClass?: ExternalRefV01["trust_class"];
  workspaceId?: string;
  projectId?: string;
  producer?: ClaimEvidenceRelationV01["producer"];
  sourceRefs?: ExternalRefV01[];
  scope?: ClaimApplicabilityScopeV01;
}): ClaimEvidenceRelationV01 {
  const revision = input.revision ?? 1;
  const producer = input.producer ?? PRODUCER;
  const priorOrigin = input.prior?.family_origin;
  return buildClaimEvidenceRelationV01({
    family_origin: {
      origin_namespace:
        priorOrigin?.origin_namespace ?? "augnes.test.sr2.relation-family.v0.1",
      origin_seed: input.familySeed,
      origin_profile: priorOrigin?.origin_profile ?? producer.producer_profile,
      origin_producer_kind:
        priorOrigin?.origin_producer_kind ?? producer.producer_kind,
    },
    workspace_id: input.workspaceId ?? WORKSPACE_ID,
    project_id: input.projectId ?? PROJECT_ID,
    revision,
    prior_relation_ref: input.prior
      ? claimEvidenceRelationReferenceV01(input.prior)
      : null,
    operation_intent: input.operation ?? "create",
    supersedes_relation_ref: input.supersedes
      ? claimEvidenceRelationReferenceV01(input.supersedes)
      : null,
    claim_ref: claimRecordReferenceV01(input.claim),
    evidence_ref: evidenceRecordReferenceV01(input.evidence),
    relation_kind: input.kind,
    applicability_scope: input.scope ?? applicability,
    basis: input.basis ?? "mixed",
    trust_class: input.trustClass ?? "derived_interpretation",
    source_refs: input.sourceRefs ?? [sourceRef],
    limitations: ["Candidate relation does not prove the Claim."],
    uncertainty:
      input.kind === "insufficient" ? ["Material is non-conclusive."] : [],
    producer,
    created_at: new Date(
      Date.parse(CREATED_AT) + revision * 2_000,
    ).toISOString(),
  });
}

function countRowsV01(db: Database.Database, table: string): number {
  const row = db.prepare(`SELECT COUNT(*) AS count FROM ${table}`).get() as {
    count: number;
  };
  return row.count;
}

function authoritySnapshotV01(db: Database.Database) {
  return {
    review_decisions: countVNextCoreRecordsV01(db, {
      workspace_id: WORKSPACE_ID,
      project_id: PROJECT_ID,
      record_kind: "review_decision",
    }),
    gates: countVNextCoreRecordsV01(db, {
      workspace_id: WORKSPACE_ID,
      project_id: PROJECT_ID,
      record_kind: "semantic_commit_gate",
    }),
    transitions: countVNextCoreRecordsV01(db, {
      workspace_id: WORKSPACE_ID,
      project_id: PROJECT_ID,
      record_kind: "state_transition_receipt",
    }),
    semantic_states: countVNextCoreRecordsV01(db, {
      workspace_id: WORKSPACE_ID,
      project_id: PROJECT_ID,
      record_kind: "semantic_state",
    }),
    context_use_reviews: countVNextCoreRecordsV01(db, {
      workspace_id: WORKSPACE_ID,
      project_id: PROJECT_ID,
      record_kind: "context_use_review",
    }),
    task_context_packets: countVNextCoreRecordsV01(db, {
      workspace_id: WORKSPACE_ID,
      project_id: PROJECT_ID,
      record_kind: "task_context_packet",
    }),
    semantic_state_entries: countRowsV01(db, "vnext_semantic_state_entries"),
    semantic_target_heads: countRowsV01(db, "vnext_semantic_target_heads"),
  };
}

function readOnlyDatabaseSnapshotV01(db: Database.Database) {
  return {
    total_core_records: countRowsV01(db, "vnext_core_records"),
    ...authoritySnapshotV01(db),
  };
}

function isStoreErrorV01(code: string) {
  return (error: unknown): boolean =>
    error instanceof ProjectVerifyMaterialStoreErrorV01 && error.code === code;
}

function assertBuilderRefusalV01(operation: () => unknown): void {
  assert.throws(
    operation,
    (error) => error instanceof ProjectVerifyMaterialErrorV01,
  );
}

function assertCanonicalEqualV01(actual: unknown, expected: unknown): void {
  assert.equal(
    canonicalizeProjectVerifyMaterialV01(actual),
    canonicalizeProjectVerifyMaterialV01(expected),
  );
}

function assertMaterialReadSessionBoundaryV01(): void {
  const db = new Database(":memory:");
  const otherDb = new Database(":memory:");
  try {
    ensureVNextDurableSemanticStoreSchemaV01(db);
    ensureVNextDurableSemanticStoreSchemaV01(otherDb);
    const claim1 = claimV01({
      revision: 1,
      prior: null,
      operation: "create",
      proposition: "A read session authenticates one exact family snapshot.",
      familySeed: "material-read-session",
    });
    admitClaimRecordV01(db, {
      workspace_id: WORKSPACE_ID,
      project_id: PROJECT_ID,
      claim: claim1,
    });
    const session = createProjectVerifyMaterialReadSessionV01(db, {
      workspace_id: WORKSPACE_ID,
      project_id: PROJECT_ID,
    });
    const first = listClaimFamilyRevisionsV01(
      db,
      {
        workspace_id: WORKSPACE_ID,
        project_id: PROJECT_ID,
        claim_family_id: claim1.claim_family_id,
      },
      session,
    );
    assert.equal(first.length, 1);
    first[0]!.limitations.push("caller-local mutation");
    assertCanonicalEqualV01(
      listClaimFamilyRevisionsV01(
        db,
        {
          workspace_id: WORKSPACE_ID,
          project_id: PROJECT_ID,
          claim_family_id: claim1.claim_family_id,
        },
        session,
      ),
      [claim1],
    );

    const claim2 = claimV01({
      revision: 2,
      prior: claim1,
      operation: "revise",
      proposition: "A changed exact family snapshot is reloaded.",
      familySeed: "material-read-session",
      producer: USER_PRODUCER,
    });
    admitClaimRecordV01(db, {
      workspace_id: WORKSPACE_ID,
      project_id: PROJECT_ID,
      claim: claim2,
    });
    assertCanonicalEqualV01(
      listClaimFamilyRevisionsV01(
        db,
        {
          workspace_id: WORKSPACE_ID,
          project_id: PROJECT_ID,
          claim_family_id: claim1.claim_family_id,
        },
        session,
      ),
      [claim1, claim2],
    );

    assert.throws(
      () =>
        listClaimFamilyRevisionsV01(
          db,
          {
            workspace_id: WORKSPACE_ID,
            project_id: PROJECT_ID,
            claim_family_id: claim1.claim_family_id,
          },
          Object.freeze({}) as ReturnType<
            typeof createProjectVerifyMaterialReadSessionV01
          >,
        ),
      isStoreErrorV01("project_verify_material_read_session_invalid"),
      "only a creator-issued opaque read session may reuse authentication",
    );

    for (const readWithWrongSessionScope of [
      () =>
        listClaimFamilyRevisionsV01(
          db,
          {
            workspace_id: WORKSPACE_ID,
            project_id: OTHER_PROJECT_ID,
            claim_family_id: claim1.claim_family_id,
          },
          session,
        ),
      () =>
        listClaimFamilyRevisionsV01(
          otherDb,
          {
            workspace_id: WORKSPACE_ID,
            project_id: PROJECT_ID,
            claim_family_id: claim1.claim_family_id,
          },
          session,
        ),
    ]) {
      assert.throws(
        readWithWrongSessionScope,
        isStoreErrorV01("project_verify_material_read_session_scope_conflict"),
      );
    }
  } finally {
    otherDb.close();
    db.close();
  }
}

function assertImmutableMaterialStoreV01(): void {
  const db = new Database(":memory:");
  try {
    ensureVNextDurableSemanticStoreSchemaV01(db);
    const authorityBefore = authoritySnapshotV01(db);

    const evidence = evidenceV01({ identityKey: "immutable-evidence" });
    assert.equal(
      admitEvidenceRecordV01(db, {
        workspace_id: WORKSPACE_ID,
        project_id: PROJECT_ID,
        evidence,
      }).status,
      "inserted",
    );
    assert.equal(
      admitEvidenceRecordV01(db, {
        workspace_id: WORKSPACE_ID,
        project_id: PROJECT_ID,
        evidence,
      }).status,
      "exact_replay",
    );
    assertCanonicalEqualV01(
      readEvidenceRecordV01(db, {
        workspace_id: WORKSPACE_ID,
        project_id: PROJECT_ID,
        evidence_id: evidence.evidence_id,
      }),
      evidence,
    );
    const changedEvidence = evidenceV01({
      identityKey: "immutable-evidence",
      summary: "Changed material under the same immutable identity.",
    });
    assert.equal(changedEvidence.evidence_id, evidence.evidence_id);
    assert.notEqual(
      changedEvidence.integrity.fingerprint,
      evidence.integrity.fingerprint,
    );
    assert.throws(
      () =>
        admitEvidenceRecordV01(db, {
          workspace_id: WORKSPACE_ID,
          project_id: PROJECT_ID,
          evidence: changedEvidence,
        }),
      isStoreErrorV01("evidence_record_conflict"),
    );
    assert.equal(
      listProjectClaimRecordsV01(db, {
        workspace_id: WORKSPACE_ID,
        project_id: PROJECT_ID,
      }).length,
      0,
      "Evidence admission must not create a Claim implicitly",
    );

    const claim1 = claimV01({
      revision: 1,
      prior: null,
      operation: "create",
      proposition: "The bounded project verification property holds.",
    });
    const claim1Bytes = canonicalizeProjectVerifyMaterialV01(claim1);
    assert.equal(
      admitClaimRecordV01(db, {
        workspace_id: WORKSPACE_ID,
        project_id: PROJECT_ID,
        claim: claim1,
      }).status,
      "inserted",
    );
    assert.equal(
      readClaimRecordV01(db, {
        workspace_id: WORKSPACE_ID,
        project_id: OTHER_PROJECT_ID,
        claim_id: claim1.claim_id,
      }),
      null,
    );
    assert.equal(
      readClaimRecordV01(db, {
        workspace_id: "workspace-sr2-project-verify-proof-foreign",
        project_id: PROJECT_ID,
        claim_id: claim1.claim_id,
      }),
      null,
    );
    const skippedRevisionPrior = claimV01({
      revision: 2,
      prior: claim1,
      operation: "revise",
      proposition: "Unadmitted revision two.",
    });
    const skippedRevision = claimV01({
      revision: 3,
      prior: skippedRevisionPrior,
      operation: "revise",
      proposition: "Skipped revision three.",
    });
    assert.throws(
      () =>
        admitClaimRecordV01(db, {
          workspace_id: WORKSPACE_ID,
          project_id: PROJECT_ID,
          claim: skippedRevision,
        }),
      isStoreErrorV01("claim_revision_not_contiguous"),
    );
    const wrongPrior = buildClaimRecordV01({
      family_origin: claim1.family_origin,
      workspace_id: WORKSPACE_ID,
      project_id: PROJECT_ID,
      revision: 2,
      prior_claim_ref: {
        ...claimRecordReferenceV01(claim1),
        record_fingerprint: `sha256:${"f".repeat(64)}`,
      },
      operation_intent: "revise",
      operation_target_claim_ref: null,
      proposition: "Wrong prior fingerprint candidate.",
      subject_refs: claim1.subject_refs,
      applicability_scope: claim1.applicability_scope,
      source_refs: claim1.source_refs,
      limitations: claim1.limitations,
      uncertainty: claim1.uncertainty,
      producer: claim1.producer,
      created_at: "2026-07-10T04:00:02.000Z",
    });
    assert.throws(
      () =>
        admitClaimRecordV01(db, {
          workspace_id: WORKSPACE_ID,
          project_id: PROJECT_ID,
          claim: wrongPrior,
        }),
      isStoreErrorV01("claim_prior_ref_conflict"),
    );
    assertBuilderRefusalV01(() =>
      claimV01({
        revision: 2,
        prior: claim1,
        operation: "revise",
        proposition: "Wrong family must fail closed.",
        familySeed: "different-family",
      }),
    );
    assertBuilderRefusalV01(() =>
      buildClaimRecordV01({
        family_origin: {
          ...claim1.family_origin,
          origin_profile: "changed-family-origin.v0.1",
        },
        workspace_id: claim1.workspace_id,
        project_id: claim1.project_id,
        revision: 2,
        prior_claim_ref: claimRecordReferenceV01(claim1),
        operation_intent: "revise",
        operation_target_claim_ref: null,
        proposition: "Changing family origin must not preserve lineage.",
        subject_refs: claim1.subject_refs,
        applicability_scope: claim1.applicability_scope,
        source_refs: claim1.source_refs,
        limitations: claim1.limitations,
        uncertainty: claim1.uncertainty,
        producer: claim1.producer,
        created_at: "2026-07-10T04:00:02.000Z",
      }),
    );
    assertBuilderRefusalV01(() =>
      claimV01({
        revision: 2,
        prior: claim1,
        operation: "revise",
        proposition: "Changed scope must fail closed.",
        scope: createClaimApplicabilityScopeV01({
          subject_refs: [subjectRef],
          condition: {
            kind: "constant",
            value: "applicable",
            context_refs: [],
          },
        }),
      }),
    );

    const claim2 = claimV01({
      revision: 2,
      prior: claim1,
      operation: "revise",
      proposition: "The bounded property holds under the exact recorded scope.",
      producer: USER_PRODUCER,
      sourceRefs: [
        refV01(
          "user_claim_revision",
          "user:claim-revision:2",
          "user_declaration",
        ),
      ],
    });
    const competingSibling = claimV01({
      revision: 2,
      prior: claim1,
      operation: "revise",
      proposition: "A competing sibling proposition.",
    });
    assert.equal(
      admitClaimRecordV01(db, {
        workspace_id: WORKSPACE_ID,
        project_id: PROJECT_ID,
        claim: claim2,
      }).status,
      "inserted",
    );
    assert.throws(
      () =>
        admitClaimRecordV01(db, {
          workspace_id: WORKSPACE_ID,
          project_id: PROJECT_ID,
          claim: competingSibling,
        }),
      isStoreErrorV01("claim_record_conflict"),
    );
    const claim3 = claimV01({
      revision: 3,
      prior: claim2,
      operation: "supersede",
      target: claim2,
      proposition: "Supersession candidate for the exact prior revision.",
    });
    const claim3Bytes = canonicalizeProjectVerifyMaterialV01(claim3);
    assert.equal(
      admitClaimRecordV01(db, {
        workspace_id: WORKSPACE_ID,
        project_id: PROJECT_ID,
        claim: claim3,
      }).status,
      "inserted",
    );
    const claim4 = claimV01({
      revision: 4,
      prior: claim3,
      operation: "retract",
      target: claim3,
      proposition: claim3.proposition,
      producer: USER_PRODUCER,
      sourceRefs: [
        refV01(
          "user_retraction_candidate",
          "user:claim-retraction:4",
          "user_declaration",
        ),
      ],
    });
    const changedClaimRetraction = claimV01({
      revision: 4,
      prior: claim3,
      operation: "retract",
      target: claim3,
      proposition: "A retract candidate cannot rewrite its target proposition.",
      producer: USER_PRODUCER,
    });
    assert.throws(
      () =>
        admitClaimRecordV01(db, {
          workspace_id: WORKSPACE_ID,
          project_id: PROJECT_ID,
          claim: changedClaimRetraction,
        }),
      isStoreErrorV01("claim_retract_proposition_conflict"),
    );
    assertBuilderRefusalV01(() =>
      claimV01({
        revision: 4,
        prior: claim3,
        operation: "retract",
        target: claim3,
        proposition: claim3.proposition,
        scope: createClaimApplicabilityScopeV01({
          subject_refs: [subjectRef],
          condition: {
            kind: "constant",
            value: "applicable",
            context_refs: [],
          },
        }),
      }),
    );
    assert.equal(
      admitClaimRecordV01(db, {
        workspace_id: WORKSPACE_ID,
        project_id: PROJECT_ID,
        claim: claim4,
      }).status,
      "inserted",
    );
    assert.equal(canonicalizeProjectVerifyMaterialV01(claim3), claim3Bytes);
    assert.equal(
      canonicalizeProjectVerifyMaterialV01(
        readClaimRecordV01(db, {
          workspace_id: WORKSPACE_ID,
          project_id: PROJECT_ID,
          claim_id: claim1.claim_id,
        }),
      ),
      claim1Bytes,
      "later candidates must not mutate revision one",
    );
    assert.deepEqual(
      listClaimFamilyRevisionsV01(db, {
        workspace_id: WORKSPACE_ID,
        project_id: PROJECT_ID,
        claim_family_id: claim1.claim_family_id,
      }).map((claim) => [claim.revision, claim.operation_intent]),
      [
        [1, "create"],
        [2, "revise"],
        [3, "supersede"],
        [4, "retract"],
      ],
    );
    const claimLineage = readClaimFamilyLineageV01(db, {
      workspace_id: WORKSPACE_ID,
      project_id: PROJECT_ID,
      claim_family_id: claim1.claim_family_id,
    });
    assert.equal(claimLineage.latest_recorded_revision, 4);
    assert.equal(claimLineage.canonical_applied_current_head_ref, null);
    assert.equal(claimLineage.review_decision_ref, null);
    assert.equal(claimLineage.transition_ref, null);
    assert.equal(claimLineage.truth_status, "not_established");
    assert.deepEqual(claimLineage.competing_candidate_revisions, []);
    assert.equal(claimLineage.unresolved_lineage_conflict, false);
    assert.equal(
      claim1.producer.producer_kind,
      "server_deterministic_evaluator",
    );
    assert.equal(claim2.producer.producer_kind, "user");
    assert.equal(claim4.producer.producer_kind, "user");
    assert.deepEqual(claim2.family_origin, claim1.family_origin);
    assert.deepEqual(claim4.family_origin, claim1.family_origin);

    const modelClaim1 = claimV01({
      revision: 1,
      prior: null,
      operation: "create",
      familySeed: "model-origin-family",
      proposition: "A model proposed this bounded candidate proposition.",
      producer: MODEL_PRODUCER,
      sourceRefs: [
        refV01(
          "model_candidate_source",
          "model:candidate:claim:1",
          "derived_interpretation",
        ),
      ],
    });
    const userModelCorrection = claimV01({
      revision: 2,
      prior: modelClaim1,
      operation: "revise",
      familySeed: "model-origin-family",
      proposition: "A user corrected the model-origin candidate proposition.",
      producer: USER_PRODUCER,
      sourceRefs: [
        refV01(
          "user_claim_correction",
          "user:model-claim:correction",
          "user_declaration",
        ),
      ],
    });
    for (const claim of [modelClaim1, userModelCorrection]) {
      admitClaimRecordV01(db, {
        workspace_id: WORKSPACE_ID,
        project_id: PROJECT_ID,
        claim,
      });
    }
    assert.equal(
      modelClaim1.claim_family_id,
      userModelCorrection.claim_family_id,
    );
    assert.equal(modelClaim1.producer.producer_kind, "model");
    assert.equal(userModelCorrection.producer.producer_kind, "user");
    assert.equal(
      userModelCorrection.family_origin.origin_producer_kind,
      "model",
    );
    assert.equal(userModelCorrection.lifecycle.review_status, "not_reviewed");
    assert.equal(
      userModelCorrection.lifecycle.application_status,
      "not_applied",
    );
    assert.equal(userModelCorrection.lifecycle.truth_status, "not_established");
    assertBuilderRefusalV01(() =>
      claimV01({
        revision: 257,
        prior: claim4,
        operation: "revise",
        proposition: "Revision 257 must remain outside the bounded lineage.",
      }),
    );
    assert.equal(
      listClaimFamilyRevisionsV01(db, {
        workspace_id: WORKSPACE_ID,
        project_id: PROJECT_ID,
        claim_family_id: claim1.claim_family_id,
      }).length,
      4,
      "a refused out-of-bound revision must leave readable lineage intact",
    );

    const sameTextOtherProject = claimV01({
      revision: 1,
      prior: null,
      operation: "create",
      proposition: claim1.proposition,
      projectId: OTHER_PROJECT_ID,
    });
    assert.notEqual(sameTextOtherProject.claim_id, claim1.claim_id);
    assert.equal(
      admitClaimRecordV01(db, {
        workspace_id: WORKSPACE_ID,
        project_id: OTHER_PROJECT_ID,
        claim: sameTextOtherProject,
      }).status,
      "inserted",
    );
    const otherProjectEvidence = evidenceV01({
      identityKey: "other-project-evidence",
      projectId: OTHER_PROJECT_ID,
    });
    admitEvidenceRecordV01(db, {
      workspace_id: WORKSPACE_ID,
      project_id: OTHER_PROJECT_ID,
      evidence: otherProjectEvidence,
    });
    const otherProjectRelation = relationV01({
      familySeed: "foreign-prior-family",
      claim: sameTextOtherProject,
      evidence: otherProjectEvidence,
      kind: "supports",
      projectId: OTHER_PROJECT_ID,
    });
    admitClaimEvidenceRelationV01(db, {
      workspace_id: WORKSPACE_ID,
      project_id: OTHER_PROJECT_ID,
      relation: otherProjectRelation,
    });
    assertBuilderRefusalV01(() =>
      relationV01({
        familySeed: "foreign-prior-family",
        revision: 2,
        prior: otherProjectRelation,
        operation: "revise",
        claim: claim1,
        evidence,
        kind: "supports",
      }),
    );
    const opposingEvidence = evidenceV01({ identityKey: "opposing-evidence" });
    const contradictionEvidence = evidenceV01({
      identityKey: "contradiction-evidence",
    });
    const qualificationEvidence = evidenceV01({
      identityKey: "qualification-evidence",
    });
    const insufficientEvidence = evidenceV01({
      identityKey: "insufficient-evidence",
    });
    for (const item of [
      opposingEvidence,
      contradictionEvidence,
      qualificationEvidence,
      insufficientEvidence,
    ]) {
      admitEvidenceRecordV01(db, {
        workspace_id: WORKSPACE_ID,
        project_id: PROJECT_ID,
        evidence: item,
      });
    }
    const support1 = relationV01({
      familySeed: "support-family",
      claim: claim1,
      evidence,
      kind: "supports",
    });
    assert.equal(
      admitClaimEvidenceRelationV01(db, {
        workspace_id: WORKSPACE_ID,
        project_id: PROJECT_ID,
        relation: support1,
      }).status,
      "inserted",
    );
    assertCanonicalEqualV01(
      readClaimEvidenceRelationV01(db, {
        workspace_id: WORKSPACE_ID,
        project_id: PROJECT_ID,
        relation_id: support1.relation_id,
      }),
      support1,
    );
    const changedRelationReplay = relationV01({
      familySeed: "support-family",
      claim: claim1,
      evidence,
      kind: "opposes",
    });
    assert.equal(changedRelationReplay.relation_id, support1.relation_id);
    assert.throws(
      () =>
        admitClaimEvidenceRelationV01(db, {
          workspace_id: WORKSPACE_ID,
          project_id: PROJECT_ID,
          relation: changedRelationReplay,
        }),
      isStoreErrorV01("claim_evidence_relation_conflict"),
    );
    const opposition = relationV01({
      familySeed: "opposition-family",
      claim: claim1,
      evidence: opposingEvidence,
      kind: "opposes",
    });
    const contradiction = relationV01({
      familySeed: "contradiction-family",
      claim: claim1,
      evidence: contradictionEvidence,
      kind: "contradicts",
    });
    const qualification = relationV01({
      familySeed: "qualification-family",
      claim: claim1,
      evidence: qualificationEvidence,
      kind: "qualifies",
    });
    const insufficient = relationV01({
      familySeed: "insufficient-family",
      claim: claim1,
      evidence: insufficientEvidence,
      kind: "insufficient",
      basis: "insufficient",
    });
    for (const relation of [
      opposition,
      contradiction,
      qualification,
      insufficient,
    ]) {
      admitClaimEvidenceRelationV01(db, {
        workspace_id: WORKSPACE_ID,
        project_id: PROJECT_ID,
        relation,
      });
    }
    assert.deepEqual(
      new Set(
        listRelationsForExactClaimV01(db, {
          workspace_id: WORKSPACE_ID,
          project_id: PROJECT_ID,
          claim_ref: claimRecordReferenceV01(claim1),
        }).map((relation) => relation.relation_kind),
      ),
      new Set([
        "supports",
        "opposes",
        "contradicts",
        "qualifies",
        "insufficient",
      ]),
    );
    assert.equal(
      listRelationsForExactEvidenceV01(db, {
        workspace_id: WORKSPACE_ID,
        project_id: PROJECT_ID,
        evidence_ref: evidenceRecordReferenceV01(evidence),
      }).length,
      1,
    );

    const support2 = relationV01({
      familySeed: "support-family",
      revision: 2,
      prior: support1,
      operation: "revise",
      claim: claim1,
      evidence,
      kind: "qualifies",
      producer: USER_PRODUCER,
      sourceRefs: [
        refV01(
          "user_relation_revision",
          "user:relation-revision:2",
          "user_declaration",
        ),
      ],
    });
    const support3 = relationV01({
      familySeed: "support-family",
      revision: 3,
      prior: support2,
      operation: "supersede",
      supersedes: support2,
      claim: claim1,
      evidence,
      kind: "contextualizes",
    });
    const support3Bytes = canonicalizeProjectVerifyMaterialV01(support3);
    for (const relation of [support2, support3]) {
      admitClaimEvidenceRelationV01(db, {
        workspace_id: WORKSPACE_ID,
        project_id: PROJECT_ID,
        relation,
      });
    }
    const support4 = relationV01({
      familySeed: "support-family",
      revision: 4,
      prior: support3,
      operation: "retract",
      claim: claim1,
      evidence,
      kind: support3.relation_kind,
      basis: support3.basis,
      trustClass: support3.trust_class,
      producer: USER_PRODUCER,
      sourceRefs: [
        refV01(
          "user_relation_retraction",
          "user:relation-retraction:4",
          "user_declaration",
        ),
      ],
    });
    const changedKindRetraction = relationV01({
      familySeed: "support-family",
      revision: 4,
      prior: support3,
      operation: "retract",
      claim: claim1,
      evidence,
      kind: "qualifies",
      basis: support3.basis,
      trustClass: support3.trust_class,
      producer: USER_PRODUCER,
    });
    assert.throws(
      () =>
        admitClaimEvidenceRelationV01(db, {
          workspace_id: WORKSPACE_ID,
          project_id: PROJECT_ID,
          relation: changedKindRetraction,
        }),
      isStoreErrorV01("relation_retract_semantics_conflict"),
    );
    const changedBasisRetraction = relationV01({
      familySeed: "support-family",
      revision: 4,
      prior: support3,
      operation: "retract",
      claim: claim1,
      evidence,
      kind: support3.relation_kind,
      basis: "insufficient",
      trustClass: support3.trust_class,
      producer: USER_PRODUCER,
    });
    assert.throws(
      () =>
        admitClaimEvidenceRelationV01(db, {
          workspace_id: WORKSPACE_ID,
          project_id: PROJECT_ID,
          relation: changedBasisRetraction,
        }),
      isStoreErrorV01("relation_retract_semantics_conflict"),
    );
    const changedTrustRetraction = relationV01({
      familySeed: "support-family",
      revision: 4,
      prior: support3,
      operation: "retract",
      claim: claim1,
      evidence,
      kind: support3.relation_kind,
      basis: "attested",
      trustClass: "host_attestation",
      producer: USER_PRODUCER,
    });
    assert.throws(
      () =>
        admitClaimEvidenceRelationV01(db, {
          workspace_id: WORKSPACE_ID,
          project_id: PROJECT_ID,
          relation: changedTrustRetraction,
        }),
      isStoreErrorV01("relation_evidence_trust_conflict"),
    );
    assertBuilderRefusalV01(() =>
      relationV01({
        familySeed: "support-family",
        revision: 4,
        prior: support3,
        operation: "retract",
        claim: claim1,
        evidence: opposingEvidence,
        kind: support3.relation_kind,
        basis: support3.basis,
        trustClass: support3.trust_class,
      }),
    );
    assertBuilderRefusalV01(() =>
      relationV01({
        familySeed: "support-family",
        revision: 4,
        prior: support3,
        operation: "retract",
        claim: claim1,
        evidence,
        kind: support3.relation_kind,
        basis: support3.basis,
        trustClass: support3.trust_class,
        scope: createClaimApplicabilityScopeV01({
          subject_refs: [subjectRef],
          condition: {
            kind: "constant",
            value: "applicable",
            context_refs: [],
          },
        }),
      }),
    );
    assertBuilderRefusalV01(() =>
      buildClaimEvidenceRelationV01({
        family_origin: {
          ...support3.family_origin,
          origin_profile: "changed-relation-family-origin.v0.1",
        },
        workspace_id: support3.workspace_id,
        project_id: support3.project_id,
        revision: 4,
        prior_relation_ref: claimEvidenceRelationReferenceV01(support3),
        operation_intent: "retract",
        supersedes_relation_ref: null,
        claim_ref: support3.claim_ref,
        evidence_ref: support3.evidence_ref,
        relation_kind: support3.relation_kind,
        applicability_scope: support3.applicability_scope,
        basis: support3.basis,
        trust_class: support3.trust_class,
        source_refs: support3.source_refs,
        limitations: support3.limitations,
        uncertainty: support3.uncertainty,
        producer: USER_PRODUCER,
        created_at: "2026-07-10T04:00:08.000Z",
      }),
    );
    admitClaimEvidenceRelationV01(db, {
      workspace_id: WORKSPACE_ID,
      project_id: PROJECT_ID,
      relation: support4,
    });
    assert.equal(canonicalizeProjectVerifyMaterialV01(support3), support3Bytes);
    assert.deepEqual(
      listClaimEvidenceRelationFamilyRevisionsV01(db, {
        workspace_id: WORKSPACE_ID,
        project_id: PROJECT_ID,
        relation_family_id: support1.relation_family_id,
      }).map((relation) => [relation.revision, relation.operation_intent]),
      [
        [1, "create"],
        [2, "revise"],
        [3, "supersede"],
        [4, "retract"],
      ],
    );
    assert.equal(
      support1.producer.producer_kind,
      "server_deterministic_evaluator",
    );
    assert.equal(support2.producer.producer_kind, "user");
    assert.equal(support4.producer.producer_kind, "user");
    assert.deepEqual(support2.family_origin, support1.family_origin);
    assert.deepEqual(support4.family_origin, support1.family_origin);

    const modelEvidence = evidenceV01({
      identityKey: "model-origin-relation-evidence",
      producer: MODEL_PRODUCER,
    });
    admitEvidenceRecordV01(db, {
      workspace_id: WORKSPACE_ID,
      project_id: PROJECT_ID,
      evidence: modelEvidence,
    });
    const modelRelation1 = relationV01({
      familySeed: "model-origin-relation-family",
      claim: modelClaim1,
      evidence: modelEvidence,
      kind: "supports",
      producer: MODEL_PRODUCER,
      sourceRefs: [
        refV01(
          "model_relation_candidate",
          "model:relation:candidate:1",
          "derived_interpretation",
        ),
      ],
    });
    const userRelationCorrection = relationV01({
      familySeed: "model-origin-relation-family",
      revision: 2,
      prior: modelRelation1,
      operation: "revise",
      claim: modelClaim1,
      evidence: modelEvidence,
      kind: "qualifies",
      producer: USER_PRODUCER,
      sourceRefs: [
        refV01(
          "user_relation_correction",
          "user:model-relation:correction",
          "user_declaration",
        ),
      ],
    });
    for (const relation of [modelRelation1, userRelationCorrection]) {
      admitClaimEvidenceRelationV01(db, {
        workspace_id: WORKSPACE_ID,
        project_id: PROJECT_ID,
        relation,
      });
    }
    assert.equal(
      modelRelation1.relation_family_id,
      userRelationCorrection.relation_family_id,
    );
    assert.equal(modelRelation1.producer.producer_kind, "model");
    assert.equal(userRelationCorrection.producer.producer_kind, "user");
    assert.equal(
      userRelationCorrection.family_origin.origin_producer_kind,
      "model",
    );
    assert.equal(
      userRelationCorrection.lifecycle.review_status,
      "not_reviewed",
    );
    assert.equal(
      userRelationCorrection.lifecycle.application_status,
      "not_applied",
    );
    const relationLineage = readClaimEvidenceRelationFamilyLineageV01(db, {
      workspace_id: WORKSPACE_ID,
      project_id: PROJECT_ID,
      relation_family_id: support1.relation_family_id,
    });
    assert.equal(relationLineage.canonical_applied_current_head_ref, null);
    assert.equal(relationLineage.relation_status, "not_established");
    assert.equal(relationLineage.transition_ref, null);
    assertBuilderRefusalV01(() =>
      relationV01({
        familySeed: "support-family",
        revision: 257,
        prior: support4,
        operation: "revise",
        claim: claim1,
        evidence,
        kind: "supports",
      }),
    );
    assert.equal(
      listClaimEvidenceRelationFamilyRevisionsV01(db, {
        workspace_id: WORKSPACE_ID,
        project_id: PROJECT_ID,
        relation_family_id: support1.relation_family_id,
      }).length,
      4,
    );

    const crossProjectRelation = relationV01({
      familySeed: "cross-project",
      claim: claim1,
      evidence,
      kind: "supports",
      projectId: OTHER_PROJECT_ID,
    });
    assert.throws(
      () =>
        admitClaimEvidenceRelationV01(db, {
          workspace_id: WORKSPACE_ID,
          project_id: OTHER_PROJECT_ID,
          relation: crossProjectRelation,
        }),
      isStoreErrorV01("relation_claim_endpoint_missing"),
    );
    const foreignWorkspaceRelation = relationV01({
      familySeed: "cross-workspace",
      claim: claim1,
      evidence,
      kind: "supports",
      workspaceId: "workspace-sr2-project-verify-proof-foreign",
    });
    assert.throws(
      () =>
        admitClaimEvidenceRelationV01(db, {
          workspace_id: "workspace-sr2-project-verify-proof-foreign",
          project_id: PROJECT_ID,
          relation: foreignWorkspaceRelation,
        }),
      isStoreErrorV01("relation_claim_endpoint_missing"),
    );
    const forgedClaimRefRelation = buildClaimEvidenceRelationV01({
      family_origin: {
        origin_namespace: "augnes.test.sr2.relation-family.v0.1",
        origin_seed: "forged-claim-ref",
        origin_profile: PRODUCER.producer_profile,
        origin_producer_kind: PRODUCER.producer_kind,
      },
      workspace_id: WORKSPACE_ID,
      project_id: PROJECT_ID,
      revision: 1,
      prior_relation_ref: null,
      operation_intent: "create",
      supersedes_relation_ref: null,
      claim_ref: {
        ...claimRecordReferenceV01(claim1),
        record_fingerprint: `sha256:${"e".repeat(64)}`,
      },
      evidence_ref: evidenceRecordReferenceV01(evidence),
      relation_kind: "supports",
      applicability_scope: applicability,
      basis: "observed",
      trust_class: "direct_local_observation",
      source_refs: [sourceRef],
      limitations: [],
      uncertainty: [],
      producer: PRODUCER,
      created_at: CREATED_AT,
    });
    assert.throws(
      () =>
        admitClaimEvidenceRelationV01(db, {
          workspace_id: WORKSPACE_ID,
          project_id: PROJECT_ID,
          relation: forgedClaimRefRelation,
        }),
      isStoreErrorV01("relation_claim_endpoint_fingerprint_conflict"),
    );
    const elevatedTrustRelation = relationV01({
      familySeed: "elevated-trust",
      claim: claim1,
      evidence,
      kind: "supports",
      basis: "attested",
      trustClass: "host_attestation",
    });
    assert.throws(
      () =>
        admitClaimEvidenceRelationV01(db, {
          workspace_id: WORKSPACE_ID,
          project_id: PROJECT_ID,
          relation: elevatedTrustRelation,
        }),
      isStoreErrorV01("relation_evidence_trust_conflict"),
    );
    const insufficientTrustLaunderingRelation = relationV01({
      familySeed: "insufficient-trust-laundering",
      claim: claim1,
      evidence,
      kind: "insufficient",
      basis: "insufficient",
      trustClass: "host_attestation",
    });
    assert.throws(
      () =>
        admitClaimEvidenceRelationV01(db, {
          workspace_id: WORKSPACE_ID,
          project_id: PROJECT_ID,
          relation: insufficientTrustLaunderingRelation,
        }),
      isStoreErrorV01("relation_evidence_trust_conflict"),
    );
    const missingEvidence = evidenceV01({ identityKey: "never-admitted" });
    const missingEndpointRelation = relationV01({
      familySeed: "missing-evidence",
      claim: claim1,
      evidence: missingEvidence,
      kind: "supports",
    });
    assert.throws(
      () =>
        admitClaimEvidenceRelationV01(db, {
          workspace_id: WORKSPACE_ID,
          project_id: PROJECT_ID,
          relation: missingEndpointRelation,
        }),
      isStoreErrorV01("relation_evidence_endpoint_missing"),
    );

    const mismatchedPayload = evidenceV01({
      identityKey: "raw-envelope-payload-scope-mismatch",
    });
    insertVNextCoreRecordV01(db, {
      record_kind: "evidence_record",
      record_id: mismatchedPayload.evidence_id,
      workspace_id: WORKSPACE_ID,
      project_id: OTHER_PROJECT_ID,
      fingerprint: mismatchedPayload.integrity.fingerprint,
      idempotency_key: mismatchedPayload.idempotency_key,
      payload: mismatchedPayload,
      created_at: mismatchedPayload.recorded_at,
    });
    assert.throws(
      () =>
        readEvidenceRecordV01(db, {
          workspace_id: WORKSPACE_ID,
          project_id: OTHER_PROJECT_ID,
          evidence_id: mismatchedPayload.evidence_id,
        }),
      isStoreErrorV01("project_verify_material_envelope_binding_conflict"),
    );

    const batchEvidence = evidenceV01({ identityKey: "atomic-batch" });
    const batchClaim = claimV01({
      revision: 1,
      prior: null,
      operation: "create",
      familySeed: "atomic-batch-family",
      proposition: "Atomic batch candidate.",
    });
    const batchRelation = relationV01({
      familySeed: "atomic-batch-relation",
      claim: batchClaim,
      evidence: batchEvidence,
      kind: "supports",
    });
    const batchInput = {
      workspace_id: WORKSPACE_ID,
      project_id: PROJECT_ID,
      evidence_records: [batchEvidence],
      claim_records: [batchClaim],
      relations: [batchRelation],
    };
    assert.equal(
      admitProjectVerifyMaterialBatchV01(db, batchInput).status,
      "inserted",
    );
    assert.equal(
      admitProjectVerifyMaterialBatchV01(db, batchInput).status,
      "exact_replay",
    );

    const rollbackEvidence = evidenceV01({ identityKey: "rollback-member" });
    const rollbackRelation = relationV01({
      familySeed: "rollback-relation",
      claim: batchClaim,
      evidence: missingEvidence,
      kind: "supports",
    });
    const completeDatabaseBeforeRollback = db.serialize();
    assert.throws(
      () =>
        admitProjectVerifyMaterialBatchV01(db, {
          workspace_id: WORKSPACE_ID,
          project_id: PROJECT_ID,
          evidence_records: [rollbackEvidence],
          claim_records: [],
          relations: [rollbackRelation],
        }),
      isStoreErrorV01("relation_evidence_endpoint_missing"),
    );
    assert.deepEqual(
      db.serialize(),
      completeDatabaseBeforeRollback,
      "failed batch must rollback the complete database, not only its new member",
    );
    assert.equal(
      readEvidenceRecordV01(db, {
        workspace_id: WORKSPACE_ID,
        project_id: PROJECT_ID,
        evidence_id: rollbackEvidence.evidence_id,
      }),
      null,
      "failed batch must leave no partial Evidence",
    );

    const nestedEvidence = evidenceV01({ identityKey: "nested-savepoint" });
    db.exec("BEGIN IMMEDIATE");
    assert.equal(
      admitEvidenceRecordV01(db, {
        workspace_id: WORKSPACE_ID,
        project_id: PROJECT_ID,
        evidence: nestedEvidence,
      }).status,
      "inserted",
    );
    assert.equal(db.inTransaction, true);
    db.exec("ROLLBACK");
    assert.equal(
      readEvidenceRecordV01(db, {
        workspace_id: WORKSPACE_ID,
        project_id: PROJECT_ID,
        evidence_id: nestedEvidence.evidence_id,
      }),
      null,
    );

    assert.deepEqual(authoritySnapshotV01(db), authorityBefore);
    assert.equal(claim1.lifecycle.application_status, "not_applied");
    assert.equal(claim1.lifecycle.review_status, "not_reviewed");
    assert.equal(evidence.lifecycle.acceptance_status, "not_accepted");
    assert.equal(support1.lifecycle.application_status, "not_applied");
    assert.equal(support1.authority.relation_existence_proves_claim, false);
    assert.equal(support1.authority.evidence_count_calculates_truth, false);

    const readOnlyBefore = readOnlyDatabaseSnapshotV01(db);
    const evidenceList = listProjectEvidenceRecordsV01(db, {
      workspace_id: WORKSPACE_ID,
      project_id: PROJECT_ID,
    });
    const listedEvidence = evidenceList.find(
      (candidate) => candidate.evidence_id === evidence.evidence_id,
    );
    assert(listedEvidence);
    assert.equal(
      listedEvidence.integrity.fingerprint,
      evidence.integrity.fingerprint,
    );
    assert.equal(listedEvidence.trust_class, evidence.trust_class);
    assert.equal(listedEvidence.coverage, evidence.coverage);
    assert.deepEqual(listedEvidence.lifecycle, evidence.lifecycle);
    const claimList = listProjectClaimRecordsV01(db, {
      workspace_id: WORKSPACE_ID,
      project_id: PROJECT_ID,
    });
    const listedClaim = claimList.find(
      (candidate) => candidate.claim_id === claim1.claim_id,
    );
    assert(listedClaim);
    assert.equal(
      listedClaim.integrity.fingerprint,
      claim1.integrity.fingerprint,
    );
    assert.deepEqual(listedClaim.lifecycle, claim1.lifecycle);
    readClaimFamilyLineageV01(db, {
      workspace_id: WORKSPACE_ID,
      project_id: PROJECT_ID,
      claim_family_id: claim1.claim_family_id,
    });
    readClaimEvidenceRelationFamilyLineageV01(db, {
      workspace_id: WORKSPACE_ID,
      project_id: PROJECT_ID,
      relation_family_id: support1.relation_family_id,
    });
    listRelationsForExactClaimV01(db, {
      workspace_id: WORKSPACE_ID,
      project_id: PROJECT_ID,
      claim_ref: claimRecordReferenceV01(claim1),
    });
    listRelationsForExactEvidenceV01(db, {
      workspace_id: WORKSPACE_ID,
      project_id: PROJECT_ID,
      evidence_ref: evidenceRecordReferenceV01(evidence),
    });
    assert.deepEqual(
      readOnlyDatabaseSnapshotV01(db),
      readOnlyBefore,
      "scoped project material readers must perform zero writes",
    );

    assert.throws(
      () =>
        db
          .prepare(
            "UPDATE vnext_core_records SET created_at = created_at WHERE record_kind = 'evidence_record' AND record_id = ?",
          )
          .run(evidence.evidence_id),
      /vnext_core_records_immutable/u,
    );
  } finally {
    db.close();
  }
}

const SR1_RECORD_KINDS_SQL_V01 = `
  'automation_work_item',
  'capability_grant',
  'episode_delta_proposal',
  'review_decision',
  'semantic_commit_gate',
  'semantic_state',
  'state_transition_receipt',
  'task_context_packet',
  'run_receipt',
  'context_use_review'
`;

function createPreSr2CoreRecordsTableV01(
  db: Database.Database,
  allowedKindsSql = SR1_RECORD_KINDS_SQL_V01,
): void {
  db.exec(`
    CREATE TABLE vnext_core_records (
      record_kind TEXT NOT NULL CHECK (record_kind IN (${allowedKindsSql})),
      record_id TEXT NOT NULL CHECK (length(trim(record_id)) > 0),
      workspace_id TEXT NOT NULL CHECK (length(trim(workspace_id)) > 0),
      project_id TEXT NOT NULL CHECK (length(trim(project_id)) > 0),
      fingerprint TEXT NOT NULL CHECK (
        length(fingerprint) = 71 AND substr(fingerprint, 1, 7) = 'sha256:'
      ),
      idempotency_key TEXT CHECK (
        idempotency_key IS NULL OR
        (length(idempotency_key) = 71 AND substr(idempotency_key, 1, 7) = 'sha256:')
      ),
      payload_json TEXT NOT NULL CHECK (
        json_valid(payload_json) AND json_type(payload_json) = 'object'
      ),
      created_at TEXT NOT NULL CHECK (length(trim(created_at)) > 0),
      PRIMARY KEY (record_kind, record_id)
    );
    CREATE UNIQUE INDEX idx_vnext_core_records_project_idempotency
      ON vnext_core_records(workspace_id, project_id, record_kind, idempotency_key)
      WHERE idempotency_key IS NOT NULL;
    CREATE INDEX idx_vnext_core_records_project_kind_created
      ON vnext_core_records(workspace_id, project_id, record_kind, created_at, record_id);
    CREATE TRIGGER trg_vnext_core_records_immutable_update
      BEFORE UPDATE ON vnext_core_records
      BEGIN SELECT RAISE(ABORT, 'vnext_core_records_immutable'); END;
    CREATE TRIGGER trg_vnext_core_records_immutable_delete
      BEFORE DELETE ON vnext_core_records
      BEGIN SELECT RAISE(ABORT, 'vnext_core_records_immutable'); END;
  `);
}

function insertPreSr2RowV01(
  db: Database.Database,
  kind = "task_context_packet",
): void {
  db.prepare(
    `INSERT INTO vnext_core_records (
       record_kind, record_id, workspace_id, project_id, fingerprint,
       idempotency_key, payload_json, created_at
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    kind,
    "pre-sr2-record",
    WORKSPACE_ID,
    PROJECT_ID,
    `sha256:${"1".repeat(64)}`,
    `sha256:${"2".repeat(64)}`,
    '{"legacy":"sr1-byte-preservation","order":[3,2,1]}',
    "2026-07-09T00:00:00.000Z",
  );
}

function rawCoreRowsV01(db: Database.Database): unknown[] {
  return db
    .prepare(
      `SELECT record_kind, record_id, workspace_id, project_id, fingerprint,
              idempotency_key, payload_json, created_at
       FROM vnext_core_records ORDER BY record_kind, record_id`,
    )
    .all();
}

function assertPreSr2SchemaUpgradeV01(): void {
  const db = new Database(":memory:");
  try {
    createPreSr2CoreRecordsTableV01(db);
    insertPreSr2RowV01(db);
    const before = rawCoreRowsV01(db);
    ensureVNextDurableSemanticStoreSchemaV01(db);
    assert.deepEqual(rawCoreRowsV01(db), before);
    const upgradedSql = (
      db
        .prepare(
          "SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'vnext_core_records'",
        )
        .get() as { sql: string }
    ).sql;
    for (const kind of [
      "evidence_record",
      "claim_record",
      "claim_evidence_relation",
    ]) {
      assert.equal(upgradedSql.includes(`'${kind}'`), true);
    }
    assert.throws(
      () =>
        db
          .prepare(
            "UPDATE vnext_core_records SET created_at = created_at WHERE record_id = ?",
          )
          .run("pre-sr2-record"),
      /vnext_core_records_immutable/u,
    );
    const upgradedSchema = db
      .prepare(
        "SELECT type, name, sql FROM sqlite_master WHERE name LIKE 'vnext_%' OR name LIKE 'trg_vnext_%' ORDER BY type, name",
      )
      .all();
    ensureVNextDurableSemanticStoreSchemaV01(db);
    assert.deepEqual(rawCoreRowsV01(db), before);
    assert.deepEqual(
      db
        .prepare(
          "SELECT type, name, sql FROM sqlite_master WHERE name LIKE 'vnext_%' OR name LIKE 'trg_vnext_%' ORDER BY type, name",
        )
        .all(),
      upgradedSchema,
      "repeated upgrade must be a no-op",
    );
  } finally {
    db.close();
  }

  const rollbackDb = new Database(":memory:");
  try {
    createPreSr2CoreRecordsTableV01(
      rollbackDb,
      `${SR1_RECORD_KINDS_SQL_V01}, 'unsupported_drift_kind'`,
    );
    insertPreSr2RowV01(rollbackDb, "unsupported_drift_kind");
    const before = rawCoreRowsV01(rollbackDb);
    assert.throws(
      () => ensureVNextDurableSemanticStoreSchemaV01(rollbackDb),
      /CHECK constraint failed/u,
    );
    assert.deepEqual(rawCoreRowsV01(rollbackDb), before);
    assert.equal(
      rollbackDb
        .prepare(
          "SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'vnext_core_records_upgrade_v0_3'",
        )
        .get(),
      undefined,
      "failed upgrade must rollback its temporary table",
    );
  } finally {
    rollbackDb.close();
  }

  const orphanDb = new Database(":memory:");
  try {
    createPreSr2CoreRecordsTableV01(orphanDb);
    insertPreSr2RowV01(orphanDb);
    orphanDb.exec(
      "CREATE TABLE vnext_core_records_upgrade_v0_3 (sentinel TEXT)",
    );
    const before = rawCoreRowsV01(orphanDb);
    assert.throws(
      () => ensureVNextDurableSemanticStoreSchemaV01(orphanDb),
      /vnext_core_record_kind_upgrade_orphan_table/u,
    );
    assert.deepEqual(rawCoreRowsV01(orphanDb), before);
  } finally {
    orphanDb.close();
  }
}

function semanticProjectionSentinelRowsV01(db: Database.Database) {
  return {
    entries: db
      .prepare(
        "SELECT * FROM vnext_semantic_state_entries ORDER BY workspace_id, project_id, target_key",
      )
      .all(),
    heads: db
      .prepare(
        "SELECT * FROM vnext_semantic_target_heads ORDER BY workspace_id, project_id, target_key",
      )
      .all(),
  };
}

function assertExportedDatabaseMigrationV01(): void {
  const db = new Database(":memory:");
  try {
    migrateVNextDurableSemanticStoreV01(db);
    const targetKey = `sha256:${"3".repeat(64)}`;
    const stateFingerprint = `sha256:${"4".repeat(64)}`;
    const proposalFingerprint = `sha256:${"5".repeat(64)}`;
    const candidateFingerprint = `sha256:${"6".repeat(64)}`;
    const transitionFingerprint = `sha256:${"7".repeat(64)}`;
    db.prepare(
      `INSERT INTO vnext_semantic_state_entries (
        workspace_id, project_id, presence, target_key, target_ref_json,
        state_ref_json, current_state_fingerprint, bounded_state_summary,
        source_proposal_id, source_proposal_fingerprint, source_candidate_id,
        source_candidate_fingerprint, source_transition_receipt_id,
        source_transition_receipt_fingerprint, revision, updated_at
      ) VALUES (?, ?, 'present', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)`,
    ).run(
      WORKSPACE_ID,
      PROJECT_ID,
      targetKey,
      '{"ref":"target","order":[2,1]}',
      '{"ref":"state","order":[4,3]}',
      stateFingerprint,
      "Pre-SR-2 semantic projection sentinel.",
      "proposal:sentinel",
      proposalFingerprint,
      "candidate:sentinel",
      candidateFingerprint,
      "transition:sentinel",
      transitionFingerprint,
      "2026-07-09T01:00:00.000Z",
    );
    db.prepare(
      `INSERT INTO vnext_semantic_target_heads (
        workspace_id, project_id, target_key, revision, presence,
        current_state_fingerprint, source_transition_receipt_id,
        source_transition_receipt_fingerprint, updated_at
      ) VALUES (?, ?, ?, 1, 'present', ?, ?, ?, ?)`,
    ).run(
      WORKSPACE_ID,
      PROJECT_ID,
      targetKey,
      stateFingerprint,
      "transition:sentinel",
      transitionFingerprint,
      "2026-07-09T01:00:00.000Z",
    );
    const projectionBefore = semanticProjectionSentinelRowsV01(db);

    db.exec(`
      DROP TRIGGER trg_vnext_core_records_immutable_update;
      DROP TRIGGER trg_vnext_core_records_immutable_delete;
      DROP TABLE vnext_core_records;
    `);
    createPreSr2CoreRecordsTableV01(db);
    insertPreSr2RowV01(db);
    const coreBefore = rawCoreRowsV01(db);
    const migrated = migrateVNextDurableSemanticStoreV01(db);
    assert.deepEqual(migrated.rebuilt_tables, ["vnext_core_records"]);
    assert.deepEqual(rawCoreRowsV01(db), coreBefore);
    assert.deepEqual(
      semanticProjectionSentinelRowsV01(db),
      projectionBefore,
      "the exported migration must preserve existing semantic projection bytes",
    );
    const repeated = migrateVNextDurableSemanticStoreV01(db);
    assert.deepEqual(repeated.rebuilt_tables, []);
    assert.deepEqual(rawCoreRowsV01(db), coreBefore);
    assert.deepEqual(semanticProjectionSentinelRowsV01(db), projectionBefore);
  } finally {
    db.close();
  }
}

function assertSerializedCrossConnectionReplayV01(): void {
  const directory = mkdtempSync(join(tmpdir(), "augnes-sr2-proof-"));
  const databasePath = join(directory, "project-verify.sqlite");
  const restoredDatabasePath = join(
    directory,
    "project-verify-restored.sqlite",
  );
  const first = new Database(databasePath);
  let second: Database.Database | null = null;
  let restored: Database.Database | null = null;
  try {
    ensureVNextDurableSemanticStoreSchemaV01(first);
    second = new Database(databasePath);
    ensureVNextDurableSemanticStoreSchemaV01(second);
    second.pragma("busy_timeout = 25");
    const evidence = evidenceV01({ identityKey: "cross-connection-replay" });
    first.exec("BEGIN IMMEDIATE");
    assert.equal(
      admitEvidenceRecordV01(first, {
        workspace_id: WORKSPACE_ID,
        project_id: PROJECT_ID,
        evidence,
      }).status,
      "inserted",
    );
    assert.throws(
      () =>
        admitEvidenceRecordV01(second!, {
          workspace_id: WORKSPACE_ID,
          project_id: PROJECT_ID,
          evidence,
        }),
      (error) =>
        error instanceof Error &&
        "code" in error &&
        error.code === "SQLITE_BUSY",
      "a real competing BEGIN IMMEDIATE must fail boundedly while the owner holds the lock",
    );
    assert.equal(
      countVNextCoreRecordsV01(second, {
        workspace_id: WORKSPACE_ID,
        project_id: PROJECT_ID,
        record_kind: "evidence_record",
      }),
      0,
      "the competing connection cannot observe or duplicate the uncommitted row",
    );
    first.exec("COMMIT");
    assert.equal(
      admitEvidenceRecordV01(second, {
        workspace_id: WORKSPACE_ID,
        project_id: PROJECT_ID,
        evidence,
      }).status,
      "exact_replay",
    );
    assert.equal(
      countVNextCoreRecordsV01(second, {
        workspace_id: WORKSPACE_ID,
        project_id: PROJECT_ID,
        record_kind: "evidence_record",
      }),
      1,
    );
    const restoredClaim1 = claimV01({
      revision: 1,
      prior: null,
      operation: "create",
      familySeed: "backup-restore-claim-family",
      proposition: "Backup and restore preserve candidate lineage.",
    });
    const restoredClaim2 = claimV01({
      revision: 2,
      prior: restoredClaim1,
      operation: "revise",
      familySeed: "backup-restore-claim-family",
      proposition: "Backup and restore preserve revised candidate lineage.",
    });
    const restoredClaim3 = claimV01({
      revision: 3,
      prior: restoredClaim2,
      operation: "supersede",
      target: restoredClaim2,
      familySeed: "backup-restore-claim-family",
      proposition: "Backup and restore preserve supersession candidates.",
    });
    const restoredClaim4 = claimV01({
      revision: 4,
      prior: restoredClaim3,
      operation: "retract",
      target: restoredClaim3,
      familySeed: "backup-restore-claim-family",
      proposition: restoredClaim3.proposition,
    });
    for (const claim of [
      restoredClaim1,
      restoredClaim2,
      restoredClaim3,
      restoredClaim4,
    ]) {
      admitClaimRecordV01(first, {
        workspace_id: WORKSPACE_ID,
        project_id: PROJECT_ID,
        claim,
      });
    }
    const restoredRelation1 = relationV01({
      familySeed: "backup-restore-relation-family",
      claim: restoredClaim1,
      evidence,
      kind: "supports",
    });
    const restoredRelation2 = relationV01({
      familySeed: "backup-restore-relation-family",
      revision: 2,
      prior: restoredRelation1,
      operation: "revise",
      claim: restoredClaim1,
      evidence,
      kind: "qualifies",
    });
    const restoredRelation3 = relationV01({
      familySeed: "backup-restore-relation-family",
      revision: 3,
      prior: restoredRelation2,
      operation: "supersede",
      supersedes: restoredRelation2,
      claim: restoredClaim1,
      evidence,
      kind: "contextualizes",
    });
    const restoredRelation4 = relationV01({
      familySeed: "backup-restore-relation-family",
      revision: 4,
      prior: restoredRelation3,
      operation: "retract",
      claim: restoredClaim1,
      evidence,
      kind: restoredRelation3.relation_kind,
      basis: restoredRelation3.basis,
      trustClass: restoredRelation3.trust_class,
    });
    for (const relation of [
      restoredRelation1,
      restoredRelation2,
      restoredRelation3,
      restoredRelation4,
    ]) {
      admitClaimEvidenceRelationV01(first, {
        workspace_id: WORKSPACE_ID,
        project_id: PROJECT_ID,
        relation,
      });
    }
    const claimFingerprints = [
      restoredClaim1,
      restoredClaim2,
      restoredClaim3,
      restoredClaim4,
    ].map((record) => record.integrity.fingerprint);
    const relationFingerprints = [
      restoredRelation1,
      restoredRelation2,
      restoredRelation3,
      restoredRelation4,
    ].map((record) => record.integrity.fingerprint);
    first.exec(`VACUUM INTO '${restoredDatabasePath.replaceAll("'", "''")}'`);
    restored = new Database(restoredDatabasePath, { fileMustExist: true });
    ensureVNextDurableSemanticStoreSchemaV01(restored);
    assertCanonicalEqualV01(
      readEvidenceRecordV01(restored, {
        workspace_id: WORKSPACE_ID,
        project_id: PROJECT_ID,
        evidence_id: evidence.evidence_id,
      }),
      evidence,
    );
    assert.deepEqual(
      listClaimFamilyRevisionsV01(restored, {
        workspace_id: WORKSPACE_ID,
        project_id: PROJECT_ID,
        claim_family_id: restoredClaim1.claim_family_id,
      }).map((record) => record.integrity.fingerprint),
      claimFingerprints,
    );
    assert.deepEqual(
      listClaimEvidenceRelationFamilyRevisionsV01(restored, {
        workspace_id: WORKSPACE_ID,
        project_id: PROJECT_ID,
        relation_family_id: restoredRelation1.relation_family_id,
      }).map((record) => record.integrity.fingerprint),
      relationFingerprints,
    );
    assert.equal(
      admitProjectVerifyMaterialBatchV01(restored, {
        workspace_id: WORKSPACE_ID,
        project_id: PROJECT_ID,
        evidence_records: [evidence],
        claim_records: [
          restoredClaim1,
          restoredClaim2,
          restoredClaim3,
          restoredClaim4,
        ],
        relations: [
          restoredRelation1,
          restoredRelation2,
          restoredRelation3,
          restoredRelation4,
        ],
      }).status,
      "exact_replay",
      "a restored complete batch must retain exact-replay identity",
    );
    const changedRestoredEvidence = evidenceV01({
      identityKey: "cross-connection-replay",
      summary: "Changed material must conflict after restore.",
    });
    assert.throws(
      () =>
        admitEvidenceRecordV01(restored!, {
          workspace_id: WORKSPACE_ID,
          project_id: PROJECT_ID,
          evidence: changedRestoredEvidence,
        }),
      isStoreErrorV01("evidence_record_conflict"),
    );
    for (const [recordKind, recordId] of [
      ["evidence_record", evidence.evidence_id],
      ["claim_record", restoredClaim4.claim_id],
      ["claim_evidence_relation", restoredRelation4.relation_id],
    ] as const) {
      for (const statement of [
        "UPDATE vnext_core_records SET created_at = created_at WHERE record_kind = ? AND record_id = ?",
        "DELETE FROM vnext_core_records WHERE record_kind = ? AND record_id = ?",
      ]) {
        assert.throws(
          () => restored!.prepare(statement).run(recordKind, recordId),
          /vnext_core_records_immutable/u,
          "restored immutable update/delete triggers must remain enforced",
        );
      }
    }
  } finally {
    restored?.close();
    second?.close();
    first.close();
    rmSync(directory, { recursive: true, force: true });
  }
}

interface LegacyAcceptedEvidenceFixtureV01 {
  valid_create_input: ProductWriteAcceptedEvidenceRefCreateInput;
  expected_record_ref: string;
}

function assertLegacyCompatibilityV01(): void {
  const db = new Database(":memory:");
  try {
    ensureVNextDurableSemanticStoreSchemaV01(db);
    ensureAcceptedEvidenceRefStoreSchemaV01(db);
    const fixture = JSON.parse(
      readFileSync(
        join(
          process.cwd(),
          "fixtures/product-write-accepted-evidence-ref-runtime.sample.v0.1.json",
        ),
        "utf8",
      ),
    ) as LegacyAcceptedEvidenceFixtureV01;
    const input = fixture.valid_create_input;
    const legacyRecord: ProductWriteAcceptedEvidenceRefRecord = {
      record_version: ProductWriteAcceptedEvidenceRefRecordVersion,
      store_version: ProductWriteAcceptedEvidenceRefStoreVersion,
      runtime_version: ProductWriteAcceptedEvidenceRefRuntimeVersion,
      scope: ProductWriteAcceptedEvidenceRefScope,
      target_group: ProductWriteAcceptedEvidenceRefTargetGroup,
      accepted_evidence_ref_write_id: fixture.expected_record_ref,
      idempotency_key: input.idempotency_key,
      payload_fingerprint: `sha256:${"a".repeat(64)}`,
      promotion_decision_ref: input.promotion_decision_ref,
      formation_receipt_ref: input.formation_receipt_ref,
      review_record_ref: input.review_record_ref,
      public_safe_source_refs: input.public_safe_source_refs,
      accepted_evidence_refs: input.accepted_evidence_refs,
      product_write_reentry_review_ref: input.product_write_reentry_review_ref,
      product_write_target_contract_ref:
        input.product_write_target_contract_ref,
      preview_to_write_diff_ref: input.preview_to_write_diff_ref,
      rollback_or_abort_plan_ref: input.rollback_or_abort_plan_ref,
      operator_approval_ref: input.operator_approval_payload.approval_ref,
      operator_actor_ref: input.operator_approval_payload.operator_actor_ref,
      operator_approval_payload: {
        ...input.operator_approval_payload,
        payload_version:
          ProductWriteAcceptedEvidenceRefOperatorApprovalPayloadVersion,
        approved_runtime_slice: ProductWriteAcceptedEvidenceRefRuntimeSliceRef,
      },
      accepted_evidence_ref_write_record_written: true,
      product_id_allocated: false,
      broad_product_persistence_executed: false,
      product_write_adapter_enabled: false,
      proof_created: false,
      evidence_created: false,
      claim_evidence_written: false,
      work_item_created: false,
      promotion_executed: false,
      formation_receipt_written_now: false,
      durable_perspective_state_mutated: false,
      accepted_evidence_ref_write_is_truth: false,
      accepted_evidence_ref_write_is_proof: false,
      accepted_evidence_ref_write_is_durable_perspective_state: false,
      accepted_evidence_ref_write_is_product_id_allocation: false,
      operator_approval_is_proof: false,
      preview_to_write_diff_is_write_approval: false,
      source_refs_are_lineage_pointers: true,
      promotion_decision_is_prerequisite_not_command: true,
      formation_receipt_is_prerequisite_not_product_write_authority: true,
      audit_event_is_product_authority: false,
      reason_codes: input.reason_codes,
      boundary_notes: input.boundary_notes,
      authority_boundary: createAcceptedEvidenceRefAuthorityBoundaryV01({
        writeNow: true,
        dbNow: true,
      }),
      created_at: "2026-06-28T00:00:00.000Z",
      updated_at: "2026-06-28T00:00:00.000Z",
    };
    const coreBefore = countRowsV01(db, "vnext_core_records");
    assert.equal(
      writeAcceptedEvidenceRefRecordV01(legacyRecord, db).status,
      "written",
    );
    const read = readAcceptedEvidenceRefRuntimeV01(
      fixture.expected_record_ref,
      db,
    );
    assert.equal(read.status, "read");
    assert.equal(read.record?.scope, "project:augnes");
    assert.equal(read.record?.evidence_created, false);
    assert.equal(read.record?.claim_evidence_written, false);
    assert.equal(listAcceptedEvidenceRefRuntimeV01({}, db).records.length, 1);
    assert.equal(
      countRowsV01(db, "vnext_core_records"),
      coreBefore,
      "legacy accepted-evidence reads and writes must not create vNext material",
    );

    const logicalFixture = JSON.parse(
      readFileSync(
        join(
          process.cwd(),
          "fixtures/research-candidate-review.logical-claim-shape.sample.v0.1.json",
        ),
        "utf8",
      ),
    ) as {
      scope: LogicalClaimShapePreviewBuilderInput["scope"];
      as_of: string;
      source_fixture_refs: string[];
      input_preview: Pick<
        LogicalClaimShapePreviewBuilderInput,
        "candidate_review" | "calibration_diagnostic"
      >;
    };
    const preview = buildLogicalClaimShapePreviewReport({
      scope: logicalFixture.scope,
      as_of: logicalFixture.as_of,
      source_fixture_refs: logicalFixture.source_fixture_refs,
      ...logicalFixture.input_preview,
    });
    assert.equal(preview.status, "structure_preview_only");
    assert.equal(preview.authority_boundary.structure_preview_only, true);
    assert.equal(preview.authority_boundary.proof_or_evidence_record, false);
    assert.equal(preview.authority_boundary.source_of_truth, false);
    assert.equal(
      countRowsV01(db, "vnext_core_records"),
      coreBefore,
      "logical Claim preview must not admit canonical Claim material",
    );
  } finally {
    db.close();
  }
}

function productionShapedSourceV01(
  withVerificationPlan = true,
  generatedAt = "2026-07-10T00:30:00.000Z",
) {
  const packetInput = structuredClone(
    genericCliBuilderInputFixture,
  ) as TaskContextPacketBuilderInputV01;
  packetInput.workspace_id = WORKSPACE_ID;
  packetInput.project_id = PROJECT_ID;
  packetInput.generated_at = generatedAt;
  packetInput.expires_at = null;
  packetInput.task = {
    goal: LOCAL_PROJECT_ROOT_VERIFICATION_TASK_V01.goal,
    success_criteria: [
      ...LOCAL_PROJECT_ROOT_VERIFICATION_TASK_V01.success_criteria,
    ],
    non_goals: [...LOCAL_PROJECT_ROOT_VERIFICATION_TASK_V01.non_goals],
  };
  packetInput.constraints.required_checks = [
    ...LOCAL_PROJECT_ROOT_VERIFICATION_REQUIRED_CHECKS_V01,
  ];
  packetInput.return_contract.required_checks = [
    ...LOCAL_PROJECT_ROOT_VERIFICATION_REQUIRED_CHECKS_V01,
  ];
  if (withVerificationPlan) {
    packetInput.criterion_verification_plan =
      createLocalProjectRootCriterionVerificationPlanV01({
        workspace_id: WORKSPACE_ID,
        project_id: PROJECT_ID,
      });
  } else {
    delete packetInput.criterion_verification_plan;
  }
  const packet = buildTaskContextPacketV01(packetInput);
  return productionShapedSourceForPacketV01(packet, {
    runId: "run-sr2-production-shaped-source",
    failedCheckId: null,
  });
}

function productionShapedSourceForPacketV01(
  packet: TaskContextPacketV01,
  input: { runId: string; failedCheckId: string | null },
) {
  const receiptInput = structuredClone(
    genericCliDirectObservationInputFixture,
  ) as RunReceiptBuilderInputV01;
  receiptInput.workspace_id = WORKSPACE_ID;
  receiptInput.project_id = PROJECT_ID;
  receiptInput.run_id = input.runId;
  receiptInput.work_ref =
    packet.work_ref && typeof packet.work_ref === "object"
      ? structuredClone(packet.work_ref)
      : null;
  receiptInput.task_context_packet_ref = {
    ref_version: "external_ref.v0.1",
    ref_type: "task_context_packet",
    external_id: packet.packet_id,
    trust_class: "direct_local_observation",
    observed_at: packet.generated_at,
    source_ref: packet.integrity.fingerprint,
    compatibility_namespace: packet.packet_version,
  };
  const verifierRef = receiptInput.verifier_refs[0]!;
  receiptInput.verification = {
    status: input.failedCheckId ? "failed" : "passed",
    basis: "observed",
    required_check_ids: [
      ...LOCAL_PROJECT_ROOT_VERIFICATION_REQUIRED_CHECKS_V01,
    ],
    source_refs: [verifierRef],
  };
  receiptInput.checks = LOCAL_PROJECT_ROOT_VERIFICATION_REQUIRED_CHECKS_V01.map(
    (checkId) => {
      const status = checkId === input.failedCheckId ? "failed" : "passed";
      return {
        check_id: checkId,
        required: true,
        status,
        basis: "observed" as const,
        summary: `Exact production-profile check ${checkId} ${status}.`,
        source_refs: [verifierRef],
      };
    },
  );
  receiptInput.skipped_checks = [];
  receiptInput.changed_artifacts = [];
  receiptInput.artifact_refs = [];
  receiptInput.commands = [];
  receiptInput.observations = [
    {
      observation_id: "observation:sr2-production-shaped-verification",
      observation_kind: "command_result",
      summary:
        "The server-owned bounded project-root verifier completed its exact checks.",
      event_at: receiptInput.finished_at ?? CREATED_AT,
      observed_at: receiptInput.finished_at ?? CREATED_AT,
      observer_ref: receiptInput.observer_refs[0]!,
      trust_class: "direct_local_observation",
      source_refs: [verifierRef],
      related_command_ids: [],
      related_check_ids: [
        ...LOCAL_PROJECT_ROOT_VERIFICATION_REQUIRED_CHECKS_V01,
      ],
      related_artifact_refs: [],
    },
  ];
  receiptInput.attestations = [];
  receiptInput.result_summary = {
    summary: input.failedCheckId
      ? "The production-shaped local project-root verification preserved one exact failure."
      : "The production-shaped local project-root verification completed.",
    outcome: "completed",
    limitations: [
      "Criterion assessment and SR-2 material remain non-authoritative.",
    ],
  };
  const receipt = buildRunReceiptV01(receiptInput);
  const assessment = evaluateCriterionAssessmentV01({ packet, receipt });
  const proposalMaterial = materializeRunAssessmentProposalV01({
    packet,
    receipt,
    assessment,
  });
  return { packet, receipt, assessment, proposalMaterial };
}

function persistProductionSourcesV01(
  db: Database.Database,
  source: ReturnType<typeof productionShapedSourceV01>,
): void {
  insertVNextCoreRecordV01(db, {
    record_kind: "task_context_packet",
    record_id: source.packet.packet_id,
    workspace_id: source.packet.workspace_id,
    project_id: source.packet.project_id,
    fingerprint: source.packet.integrity.fingerprint,
    idempotency_key: null,
    payload: source.packet,
    created_at: source.packet.generated_at,
  });
  insertVNextCoreRecordV01(db, {
    record_kind: "run_receipt",
    record_id: source.receipt.receipt_id,
    workspace_id: source.receipt.workspace_id,
    project_id: source.receipt.project_id,
    fingerprint: source.receipt.integrity.fingerprint,
    idempotency_key: source.receipt.idempotency_key,
    payload: source.receipt,
    created_at: source.receipt.recorded_at,
  });
  const admittedProposal = admitEpisodeDeltaProposalV01(db, {
    expected: source.proposalMaterial,
    source: {
      packet: source.packet,
      receipt: source.receipt,
      assessment: source.assessment,
    },
  });
  assert.equal(admittedProposal.status, "inserted");
}

function rebuildEvidenceWithForgedAssessmentSourceV01(
  record: EvidenceRecordV01,
): EvidenceRecordV01 {
  const sourceRefs = structuredClone(record.source_refs);
  const assessmentRef = sourceRefs.find(
    (candidate) => candidate.ref_type === "criterion_assessment",
  );
  assert(assessmentRef);
  assessmentRef.external_id = `sha256:${"b".repeat(64)}`;
  assessmentRef.source_ref = `sha256:${"b".repeat(64)}`;
  return buildEvidenceRecordV01({
    identity_namespace: record.identity_namespace,
    identity_key: record.identity_key,
    workspace_id: record.workspace_id,
    project_id: record.project_id,
    evidence_kind: record.evidence_kind,
    subject_refs: record.subject_refs,
    source_refs: sourceRefs,
    source_observed_or_reported_at: record.source_observed_or_reported_at,
    recorded_at: record.recorded_at,
    trust_class: record.trust_class,
    coverage: record.coverage,
    bounded_summary: record.bounded_summary,
    material_fingerprint: record.material_fingerprint,
    limitations: record.limitations,
    uncertainty: record.uncertainty,
    producer: record.producer,
  });
}

function rebuildClaimWithForgedPacketSourceV01(
  record: ClaimRecordV01,
): ClaimRecordV01 {
  const sourceRefs = structuredClone(record.source_refs);
  const packetRef = sourceRefs.find(
    (candidate) => candidate.ref_type === "task_context_packet",
  );
  assert(packetRef);
  packetRef.source_ref = `sha256:${"c".repeat(64)}`;
  return buildClaimRecordV01({
    family_origin: record.family_origin,
    workspace_id: record.workspace_id,
    project_id: record.project_id,
    revision: record.revision,
    prior_claim_ref: record.prior_claim_ref,
    operation_intent: record.operation_intent,
    operation_target_claim_ref: record.operation_target_claim_ref,
    proposition: record.proposition,
    subject_refs: record.subject_refs,
    applicability_scope: record.applicability_scope,
    source_refs: sourceRefs,
    limitations: record.limitations,
    uncertainty: record.uncertainty,
    producer: record.producer,
    created_at: record.created_at,
  });
}

function rebuildRelationWithForgedAssessmentSourceV01(
  record: ClaimEvidenceRelationV01,
): ClaimEvidenceRelationV01 {
  const sourceRefs = structuredClone(record.source_refs);
  const assessmentRef = sourceRefs.find(
    (candidate) => candidate.ref_type === "criterion_assessment",
  );
  assert(assessmentRef);
  assessmentRef.external_id = `sha256:${"d".repeat(64)}`;
  assessmentRef.source_ref = `sha256:${"d".repeat(64)}`;
  return buildClaimEvidenceRelationV01({
    family_origin: record.family_origin,
    workspace_id: record.workspace_id,
    project_id: record.project_id,
    revision: record.revision,
    prior_relation_ref: record.prior_relation_ref,
    operation_intent: record.operation_intent,
    supersedes_relation_ref: record.supersedes_relation_ref,
    claim_ref: record.claim_ref,
    evidence_ref: record.evidence_ref,
    relation_kind: record.relation_kind,
    applicability_scope: record.applicability_scope,
    basis: record.basis,
    trust_class: record.trust_class,
    source_refs: sourceRefs,
    limitations: record.limitations,
    uncertainty: record.uncertainty,
    producer: record.producer,
    created_at: record.created_at,
  });
}

function assertSourceBoundAdmissionV01(): void {
  const source = productionShapedSourceV01();
  assert.equal(
    source.assessment.criteria.every(
      (criterion) => criterion.status === "satisfied",
    ),
    true,
  );
  const db = new Database(":memory:");
  try {
    ensureVNextDurableSemanticStoreSchemaV01(db);
    persistProductionSourcesV01(db, source);
    const expectedMaterial = materializeRunCriterionProjectVerifyMaterialV01({
      packet: source.packet,
      receipt: source.receipt,
      assessment: source.assessment,
      proposal: source.proposalMaterial.proposal,
    });
    const exactGenericAdmissionBefore = db.serialize();
    for (const admitWithoutSourceBinding of [
      () =>
        admitEvidenceRecordV01(db, {
          workspace_id: WORKSPACE_ID,
          project_id: PROJECT_ID,
          evidence: expectedMaterial.evidence_records[0]!,
        }),
      () =>
        admitClaimRecordV01(db, {
          workspace_id: WORKSPACE_ID,
          project_id: PROJECT_ID,
          claim: expectedMaterial.claim_records[0]!,
        }),
      () =>
        admitClaimEvidenceRelationV01(db, {
          workspace_id: WORKSPACE_ID,
          project_id: PROJECT_ID,
          relation: expectedMaterial.relations[0]!,
        }),
    ]) {
      assert.throws(
        admitWithoutSourceBinding,
        isStoreErrorV01("source_bound_run_material_required"),
      );
    }
    assert.deepEqual(
      db.serialize(),
      exactGenericAdmissionBefore,
      "reserved exact criterion material cannot enter through generic writers",
    );
    const authorityBefore = authoritySnapshotV01(db);
    const admitted = admitRunCriterionProjectVerifyMaterialV01(db, {
      workspace_id: WORKSPACE_ID,
      project_id: PROJECT_ID,
      receipt_id: source.receipt.receipt_id,
    });
    assert.equal(admitted.status, "inserted");
    assert.equal(admitted.material.claim_records.length, 4);
    assert.equal(admitted.material.evidence_records.length, 5);
    assert.equal(admitted.material.relations.length, 5);
    assert.equal(
      admitted.material.evidence_records.every(
        (evidence) =>
          evidence.trust_class === "direct_local_observation" &&
          evidence.producer.producer_profile ===
            "run_criterion_project_verify_producer.v0.1",
      ),
      true,
      "the registered exact SR-1 source authenticator preserves observed trust",
    );
    assert.equal(
      admitted.material.relations.every(
        (relation) => relation.relation_kind === "supports",
      ),
      true,
    );
    assert.equal(
      admitted.material.claim_records.every(
        (claim) =>
          claim.lifecycle.application_status === "not_applied" &&
          claim.lifecycle.truth_status === "not_established",
      ),
      true,
    );
    assert.deepEqual(authoritySnapshotV01(db), authorityBefore);
    for (const foreignScope of [
      {
        workspace_id: WORKSPACE_ID,
        project_id: OTHER_PROJECT_ID,
      },
      {
        workspace_id: "workspace-sr2-project-verify-proof-foreign",
        project_id: PROJECT_ID,
      },
    ]) {
      assert.throws(
        () =>
          admitRunCriterionProjectVerifyMaterialV01(db, {
            ...foreignScope,
            receipt_id: source.receipt.receipt_id,
          }),
        /project_result_receipt_missing/u,
      );
      assert.throws(
        () =>
          readSourceBoundRunCriterionProjectVerifyMaterialV01(db, {
            ...foreignScope,
            receipt_id: source.receipt.receipt_id,
          }),
        /project_result_receipt_missing/u,
      );
    }

    const replay = admitRunCriterionProjectVerifyMaterialV01(db, {
      workspace_id: WORKSPACE_ID,
      project_id: PROJECT_ID,
      receipt_id: source.receipt.receipt_id,
    });
    assert.equal(replay.status, "exact_replay");
    assertCanonicalEqualV01(replay.material, admitted.material);
    const reloaded = readSourceBoundRunCriterionProjectVerifyMaterialV01(db, {
      workspace_id: WORKSPACE_ID,
      project_id: PROJECT_ID,
      receipt_id: source.receipt.receipt_id,
    });
    assertCanonicalEqualV01(reloaded, admitted.material);
    const sourceClaim1 = admitted.material.claim_records[0]!;
    const userSourceClaim2 = buildClaimRecordV01({
      family_origin: sourceClaim1.family_origin,
      workspace_id: sourceClaim1.workspace_id,
      project_id: sourceClaim1.project_id,
      revision: 2,
      prior_claim_ref: claimRecordReferenceV01(sourceClaim1),
      operation_intent: "revise",
      operation_target_claim_ref: null,
      proposition: `${sourceClaim1.proposition} User-authored candidate correction.`,
      subject_refs: sourceClaim1.subject_refs,
      applicability_scope: sourceClaim1.applicability_scope,
      source_refs: [
        refV01(
          "user_claim_revision",
          "user:source-bound-claim:revision:2",
          "user_declaration",
        ),
      ],
      limitations: [
        "This later revision is user-authored candidate material and is not source-bound observation.",
      ],
      uncertainty: ["Review and application remain absent."],
      producer: USER_PRODUCER,
      created_at: source.receipt.recorded_at,
    });
    assert.equal(
      admitClaimRecordV01(db, {
        workspace_id: WORKSPACE_ID,
        project_id: PROJECT_ID,
        claim: userSourceClaim2,
      }).status,
      "inserted",
    );
    assert.equal(
      userSourceClaim2.claim_family_id,
      sourceClaim1.claim_family_id,
    );
    assert.equal(
      userSourceClaim2.family_origin.origin_producer_kind,
      "server_deterministic_evaluator",
    );
    assert.equal(userSourceClaim2.producer.producer_kind, "user");
    assert.equal(userSourceClaim2.lifecycle.review_status, "not_reviewed");
    assert.equal(userSourceClaim2.lifecycle.application_status, "not_applied");
    assert.equal(userSourceClaim2.lifecycle.truth_status, "not_established");
    assertBuilderRefusalV01(() =>
      buildClaimRecordV01({
        family_origin: sourceClaim1.family_origin,
        workspace_id: sourceClaim1.workspace_id,
        project_id: sourceClaim1.project_id,
        revision: 2,
        prior_claim_ref: claimRecordReferenceV01(sourceClaim1),
        operation_intent: "revise",
        operation_target_claim_ref: null,
        proposition: `${sourceClaim1.proposition} Forged server-authored change.`,
        subject_refs: sourceClaim1.subject_refs,
        applicability_scope: sourceClaim1.applicability_scope,
        source_refs: sourceClaim1.source_refs,
        limitations: sourceClaim1.limitations,
        uncertainty: sourceClaim1.uncertainty,
        producer: sourceClaim1.producer,
        created_at: source.receipt.recorded_at,
      }),
    );

    const sourceRelation1 = admitted.material.relations.find(
      (relation) => relation.claim_ref.record_id === sourceClaim1.claim_id,
    );
    assert(sourceRelation1);
    const userSourceRelation2 = buildClaimEvidenceRelationV01({
      family_origin: sourceRelation1.family_origin,
      workspace_id: sourceRelation1.workspace_id,
      project_id: sourceRelation1.project_id,
      revision: 2,
      prior_relation_ref: claimEvidenceRelationReferenceV01(sourceRelation1),
      operation_intent: "revise",
      supersedes_relation_ref: null,
      claim_ref: sourceRelation1.claim_ref,
      evidence_ref: sourceRelation1.evidence_ref,
      relation_kind: "qualifies",
      applicability_scope: sourceRelation1.applicability_scope,
      basis: sourceRelation1.basis,
      trust_class: sourceRelation1.trust_class,
      source_refs: [
        refV01(
          "user_relation_revision",
          "user:source-bound-relation:revision:2",
          "user_declaration",
        ),
      ],
      limitations: [
        "This user-authored relation revision remains a candidate over authentic exact endpoints.",
      ],
      uncertainty: ["Review and application remain absent."],
      producer: USER_PRODUCER,
      created_at: source.receipt.recorded_at,
    });
    assert.equal(
      admitClaimEvidenceRelationV01(db, {
        workspace_id: WORKSPACE_ID,
        project_id: PROJECT_ID,
        relation: userSourceRelation2,
      }).status,
      "inserted",
    );
    assert.equal(
      userSourceRelation2.relation_family_id,
      sourceRelation1.relation_family_id,
    );
    assert.equal(
      userSourceRelation2.family_origin.origin_producer_kind,
      "server_deterministic_evaluator",
    );
    assert.equal(userSourceRelation2.producer.producer_kind, "user");
    assert.equal(userSourceRelation2.lifecycle.review_status, "not_reviewed");
    assert.equal(
      userSourceRelation2.lifecycle.application_status,
      "not_applied",
    );
    assertBuilderRefusalV01(() =>
      buildClaimEvidenceRelationV01({
        family_origin: sourceRelation1.family_origin,
        workspace_id: sourceRelation1.workspace_id,
        project_id: sourceRelation1.project_id,
        revision: 2,
        prior_relation_ref: claimEvidenceRelationReferenceV01(sourceRelation1),
        operation_intent: "revise",
        supersedes_relation_ref: null,
        claim_ref: sourceRelation1.claim_ref,
        evidence_ref: sourceRelation1.evidence_ref,
        relation_kind: "qualifies",
        applicability_scope: sourceRelation1.applicability_scope,
        basis: sourceRelation1.basis,
        trust_class: sourceRelation1.trust_class,
        source_refs: sourceRelation1.source_refs,
        limitations: sourceRelation1.limitations,
        uncertainty: sourceRelation1.uncertainty,
        producer: sourceRelation1.producer,
        created_at: source.receipt.recorded_at,
      }),
    );
    const readOnlyBefore = readOnlyDatabaseSnapshotV01(db);
    assertCanonicalEqualV01(
      readSourceBoundRunCriterionProjectVerifyMaterialV01(db, {
        workspace_id: WORKSPACE_ID,
        project_id: PROJECT_ID,
        receipt_id: source.receipt.receipt_id,
      }),
      admitted.material,
    );
    assert.deepEqual(
      readOnlyDatabaseSnapshotV01(db),
      readOnlyBefore,
      "source-bound recomputation and reload must perform zero writes",
    );
    assert.deepEqual(authoritySnapshotV01(db), authorityBefore);

    const decision = buildReviewDecisionV01(
      createSemanticTransitionDecisionInputV01(
        {
          fixture_id: "sr2-decision-alone",
          workspace_id: WORKSPACE_ID,
          project_id: PROJECT_ID,
          run_id: source.receipt.run_id,
        },
        source.proposalMaterial.proposal,
      ),
    );
    assert.equal(validateReviewDecisionV01(decision).status, "valid");
    assert.equal(
      validateReviewDecisionAgainstEpisodeDeltaProposalV01(
        decision,
        source.proposalMaterial.proposal,
      ).status,
      "valid",
    );
    insertVNextCoreRecordV01(db, {
      record_kind: "review_decision",
      record_id: decision.decision_id,
      workspace_id: decision.workspace_id,
      project_id: decision.project_id,
      fingerprint: decision.integrity.fingerprint,
      idempotency_key: null,
      payload: decision,
      created_at: decision.decided_at,
    });
    const authorityAfterDecision = authoritySnapshotV01(db);
    assert.equal(
      authorityAfterDecision.review_decisions,
      authorityBefore.review_decisions + 1,
    );
    assert.equal(authorityAfterDecision.gates, authorityBefore.gates);
    assert.equal(
      authorityAfterDecision.transitions,
      authorityBefore.transitions,
    );
    assert.equal(
      authorityAfterDecision.semantic_states,
      authorityBefore.semantic_states,
    );
    assert.equal(
      authorityAfterDecision.semantic_state_entries,
      authorityBefore.semantic_state_entries,
    );
    assert.equal(
      authorityAfterDecision.semantic_target_heads,
      authorityBefore.semantic_target_heads,
    );
    assert.equal(
      authorityAfterDecision.task_context_packets,
      authorityBefore.task_context_packets,
      "ReviewDecision admission must not create or change a later packet",
    );
    assert.equal(
      authorityAfterDecision.context_use_reviews,
      authorityBefore.context_use_reviews,
    );
    assertCanonicalEqualV01(
      readSourceBoundRunCriterionProjectVerifyMaterialV01(db, {
        workspace_id: WORKSPACE_ID,
        project_id: PROJECT_ID,
        receipt_id: source.receipt.receipt_id,
      }),
      admitted.material,
    );
  } finally {
    db.close();
  }

  const forgedDb = new Database(":memory:");
  try {
    ensureVNextDurableSemanticStoreSchemaV01(forgedDb);
    persistProductionSourcesV01(forgedDb, source);
    const cleanDb = new Database(":memory:");
    let expectedEvidence: EvidenceRecordV01;
    try {
      ensureVNextDurableSemanticStoreSchemaV01(cleanDb);
      persistProductionSourcesV01(cleanDb, source);
      expectedEvidence = admitRunCriterionProjectVerifyMaterialV01(cleanDb, {
        workspace_id: WORKSPACE_ID,
        project_id: PROJECT_ID,
        receipt_id: source.receipt.receipt_id,
      }).material.evidence_records[0]!;
    } finally {
      cleanDb.close();
    }
    const forgedEvidence =
      rebuildEvidenceWithForgedAssessmentSourceV01(expectedEvidence);
    assert.equal(forgedEvidence.evidence_id, expectedEvidence.evidence_id);
    assert.notEqual(
      forgedEvidence.integrity.fingerprint,
      expectedEvidence.integrity.fingerprint,
    );
    insertVNextCoreRecordV01(forgedDb, {
      record_kind: "evidence_record",
      record_id: forgedEvidence.evidence_id,
      workspace_id: forgedEvidence.workspace_id,
      project_id: forgedEvidence.project_id,
      fingerprint: forgedEvidence.integrity.fingerprint,
      idempotency_key: forgedEvidence.idempotency_key,
      payload: forgedEvidence,
      created_at: forgedEvidence.recorded_at,
    });
    for (const genericRead of [
      () =>
        readEvidenceRecordV01(forgedDb, {
          workspace_id: WORKSPACE_ID,
          project_id: PROJECT_ID,
          evidence_id: forgedEvidence.evidence_id,
        }),
      () =>
        listProjectEvidenceRecordsV01(forgedDb, {
          workspace_id: WORKSPACE_ID,
          project_id: PROJECT_ID,
        }),
    ]) {
      assert.throws(
        genericRead,
        isStoreErrorV01("source_bound_evidence_material_conflict"),
      );
    }
    assert.throws(
      () =>
        readSourceBoundRunCriterionProjectVerifyMaterialV01(forgedDb, {
          workspace_id: WORKSPACE_ID,
          project_id: PROJECT_ID,
          receipt_id: source.receipt.receipt_id,
        }),
      (error) =>
        error instanceof Error &&
        "code" in error &&
        error.code === "source_bound_evidence_material_conflict",
    );
  } finally {
    forgedDb.close();
  }

  const canonicalMaterial = materializeSourceVerifyMaterialV01(source);
  const expectedClaim = canonicalMaterial.claim_records[0]!;
  const forgedClaim = rebuildClaimWithForgedPacketSourceV01(expectedClaim);
  assert.equal(forgedClaim.claim_id, expectedClaim.claim_id);
  assert.notEqual(
    forgedClaim.integrity.fingerprint,
    expectedClaim.integrity.fingerprint,
  );
  const forgedClaimDb = new Database(":memory:");
  try {
    ensureVNextDurableSemanticStoreSchemaV01(forgedClaimDb);
    persistProductionSourcesV01(forgedClaimDb, source);
    insertVNextCoreRecordV01(forgedClaimDb, {
      record_kind: "claim_record",
      record_id: forgedClaim.claim_id,
      workspace_id: forgedClaim.workspace_id,
      project_id: forgedClaim.project_id,
      fingerprint: forgedClaim.integrity.fingerprint,
      idempotency_key: forgedClaim.idempotency_key,
      payload: forgedClaim,
      created_at: forgedClaim.created_at,
    });
    for (const genericRead of [
      () =>
        readClaimRecordV01(forgedClaimDb, {
          workspace_id: WORKSPACE_ID,
          project_id: PROJECT_ID,
          claim_id: forgedClaim.claim_id,
        }),
      () =>
        listProjectClaimRecordsV01(forgedClaimDb, {
          workspace_id: WORKSPACE_ID,
          project_id: PROJECT_ID,
        }),
    ]) {
      assert.throws(
        genericRead,
        isStoreErrorV01("source_bound_claim_packet_conflict"),
      );
    }
  } finally {
    forgedClaimDb.close();
  }

  const expectedRelation = canonicalMaterial.relations[0]!;
  const relationClaim = canonicalMaterial.claim_records.find(
    (candidate) => candidate.claim_id === expectedRelation.claim_ref.record_id,
  );
  const relationEvidence = canonicalMaterial.evidence_records.find(
    (candidate) =>
      candidate.evidence_id === expectedRelation.evidence_ref.record_id,
  );
  assert(relationClaim);
  assert(relationEvidence);
  const forgedRelation =
    rebuildRelationWithForgedAssessmentSourceV01(expectedRelation);
  assert.equal(forgedRelation.relation_id, expectedRelation.relation_id);
  assert.notEqual(
    forgedRelation.integrity.fingerprint,
    expectedRelation.integrity.fingerprint,
  );
  const forgedRelationDb = new Database(":memory:");
  try {
    ensureVNextDurableSemanticStoreSchemaV01(forgedRelationDb);
    persistProductionSourcesV01(forgedRelationDb, source);
    insertVNextCoreRecordV01(forgedRelationDb, {
      record_kind: "evidence_record",
      record_id: relationEvidence.evidence_id,
      workspace_id: relationEvidence.workspace_id,
      project_id: relationEvidence.project_id,
      fingerprint: relationEvidence.integrity.fingerprint,
      idempotency_key: relationEvidence.idempotency_key,
      payload: relationEvidence,
      created_at: relationEvidence.recorded_at,
    });
    insertVNextCoreRecordV01(forgedRelationDb, {
      record_kind: "claim_record",
      record_id: relationClaim.claim_id,
      workspace_id: relationClaim.workspace_id,
      project_id: relationClaim.project_id,
      fingerprint: relationClaim.integrity.fingerprint,
      idempotency_key: relationClaim.idempotency_key,
      payload: relationClaim,
      created_at: relationClaim.created_at,
    });
    insertVNextCoreRecordV01(forgedRelationDb, {
      record_kind: "claim_evidence_relation",
      record_id: forgedRelation.relation_id,
      workspace_id: forgedRelation.workspace_id,
      project_id: forgedRelation.project_id,
      fingerprint: forgedRelation.integrity.fingerprint,
      idempotency_key: forgedRelation.idempotency_key,
      payload: forgedRelation,
      created_at: forgedRelation.created_at,
    });
    for (const genericRead of [
      () =>
        readClaimEvidenceRelationV01(forgedRelationDb, {
          workspace_id: WORKSPACE_ID,
          project_id: PROJECT_ID,
          relation_id: forgedRelation.relation_id,
        }),
      () =>
        listRelationsForExactClaimV01(forgedRelationDb, {
          workspace_id: WORKSPACE_ID,
          project_id: PROJECT_ID,
          claim_ref: claimRecordReferenceV01(relationClaim),
        }),
    ]) {
      assert.throws(
        genericRead,
        isStoreErrorV01("source_bound_relation_material_conflict"),
      );
    }
  } finally {
    forgedRelationDb.close();
  }

  const noPlanSource = productionShapedSourceV01(false);
  assert.equal(
    noPlanSource.assessment.criteria.every(
      (criterion) =>
        criterion.status === "unknown" && criterion.basis === "insufficient",
    ),
    true,
  );
  const noPlanDb = new Database(":memory:");
  try {
    ensureVNextDurableSemanticStoreSchemaV01(noPlanDb);
    persistProductionSourcesV01(noPlanDb, noPlanSource);
    const recordsBefore = countRowsV01(noPlanDb, "vnext_core_records");
    const admitted = admitRunCriterionProjectVerifyMaterialV01(noPlanDb, {
      workspace_id: WORKSPACE_ID,
      project_id: PROJECT_ID,
      receipt_id: noPlanSource.receipt.receipt_id,
    });
    assert.equal(admitted.status, "no_exact_material");
    assert.deepEqual(admitted.material.evidence_records, []);
    assert.deepEqual(admitted.material.claim_records, []);
    assert.deepEqual(admitted.material.relations, []);
    assert.equal(countRowsV01(noPlanDb, "vnext_core_records"), recordsBefore);
    for (const recordKind of [
      "evidence_record",
      "claim_record",
      "claim_evidence_relation",
    ] as const) {
      assert.equal(
        countVNextCoreRecordsV01(noPlanDb, {
          workspace_id: WORKSPACE_ID,
          project_id: PROJECT_ID,
          record_kind: recordKind,
        }),
        0,
      );
    }
  } finally {
    noPlanDb.close();
  }
}

function materializeSourceVerifyMaterialV01(
  source: ReturnType<typeof productionShapedSourceV01>,
) {
  return materializeRunCriterionProjectVerifyMaterialV01({
    packet: source.packet,
    receipt: source.receipt,
    assessment: source.assessment,
    proposal: source.proposalMaterial.proposal,
  });
}

function sourceClaimIdentityV01(
  material: ReturnType<typeof materializeSourceVerifyMaterialV01>,
) {
  return material.claim_records
    .map((claim) => ({
      proposition: claim.proposition,
      claim_id: claim.claim_id,
      claim_family_id: claim.claim_family_id,
      fingerprint: claim.integrity.fingerprint,
    }))
    .sort((left, right) => left.proposition.localeCompare(right.proposition));
}

function assertSourceClaimDeterminismV01(): void {
  const firstSource = productionShapedSourceV01();
  const secondSource = productionShapedSourceForPacketV01(firstSource.packet, {
    runId: "run-sr2-production-shaped-source-alternate",
    failedCheckId: "project_root_manifest_verified",
  });
  assert.notEqual(
    firstSource.receipt.receipt_id,
    secondSource.receipt.receipt_id,
  );
  assert.equal(firstSource.packet.packet_id, secondSource.packet.packet_id);
  const firstMaterial = materializeSourceVerifyMaterialV01(firstSource);
  const secondMaterial = materializeSourceVerifyMaterialV01(secondSource);
  assert.deepEqual(
    sourceClaimIdentityV01(firstMaterial),
    sourceClaimIdentityV01(secondMaterial),
    "one exact packet must produce stable Claim candidates across differing receipts",
  );

  const admitInOrder = (
    orderedSources: Array<typeof firstSource>,
  ): ReturnType<typeof sourceClaimIdentityV01> => {
    const db = new Database(":memory:");
    try {
      ensureVNextDurableSemanticStoreSchemaV01(db);
      for (const source of orderedSources)
        persistProductionSourcesV01(db, source);
      for (const source of orderedSources) {
        const admitted = admitRunCriterionProjectVerifyMaterialV01(db, {
          workspace_id: WORKSPACE_ID,
          project_id: PROJECT_ID,
          receipt_id: source.receipt.receipt_id,
        });
        assert.equal(admitted.status, "inserted");
      }
      return sourceClaimIdentityV01({
        ...firstMaterial,
        claim_records: listProjectClaimRecordsV01(db, {
          workspace_id: WORKSPACE_ID,
          project_id: PROJECT_ID,
        }),
      });
    } finally {
      db.close();
    }
  };
  const forward = admitInOrder([firstSource, secondSource]);
  const reverse = admitInOrder([secondSource, firstSource]);
  assert.deepEqual(forward, reverse);
  assert.deepEqual(forward, sourceClaimIdentityV01(firstMaterial));

  const differentPacketSource = productionShapedSourceV01(
    true,
    "2026-07-10T00:31:00.000Z",
  );
  assert.notEqual(
    differentPacketSource.packet.integrity.fingerprint,
    firstSource.packet.integrity.fingerprint,
  );
  const differentPacketClaims = sourceClaimIdentityV01(
    materializeSourceVerifyMaterialV01(differentPacketSource),
  );
  assert.deepEqual(
    differentPacketClaims.map((claim) => claim.proposition),
    forward.map((claim) => claim.proposition),
  );
  for (let index = 0; index < forward.length; index += 1) {
    assert.notEqual(
      differentPacketClaims[index]!.claim_family_id,
      forward[index]!.claim_family_id,
      "a changed packet fingerprint must create a distinct Claim family",
    );
  }
}

function resignForgedEvidenceV01(record: EvidenceRecordV01): EvidenceRecordV01 {
  const withoutFingerprint = {
    ...record,
    integrity: {
      algorithm: record.integrity.algorithm,
      canonicalization: record.integrity.canonicalization,
      fingerprint_scope: record.integrity.fingerprint_scope,
    },
  };
  return {
    ...withoutFingerprint,
    integrity: {
      ...withoutFingerprint.integrity,
      fingerprint: createProtocolSha256V01(
        canonicalizeProjectVerifyMaterialV01(withoutFingerprint),
      ),
    },
  };
}

function assertConclusiveEvidenceSourceAuthenticationV01(): void {
  assertBuilderRefusalV01(() =>
    buildEvidenceRecordV01({
      identity_namespace: "augnes.test.unregistered-local-observation.v0.1",
      identity_key: "unregistered-local-observation",
      workspace_id: WORKSPACE_ID,
      project_id: PROJECT_ID,
      evidence_kind: "direct_observation_material",
      subject_refs: [subjectRef],
      source_refs: [sourceRef],
      source_observed_or_reported_at: CREATED_AT,
      recorded_at: CREATED_AT,
      trust_class: "direct_local_observation",
      coverage: "complete",
      bounded_summary:
        "An arbitrary local adapter cannot mint observation trust.",
      material_fingerprint: null,
      limitations: [],
      uncertainty: [],
      producer: {
        producer_kind: "local_adapter",
        producer_profile: "arbitrary-local-adapter.v0.1",
      },
    }),
  );
  assertBuilderRefusalV01(() =>
    buildEvidenceRecordV01({
      identity_namespace: "augnes.test.unregistered-external-observation.v0.1",
      identity_key: "unregistered-external-observation",
      workspace_id: WORKSPACE_ID,
      project_id: PROJECT_ID,
      evidence_kind: "verified_external_observation_material",
      subject_refs: [subjectRef],
      source_refs: [
        refV01(
          "external_observation",
          "external:unregistered-observation",
          "verified_external_observation",
        ),
      ],
      source_observed_or_reported_at: CREATED_AT,
      recorded_at: CREATED_AT,
      trust_class: "verified_external_observation",
      coverage: "complete",
      bounded_summary:
        "An arbitrary deterministic evaluator cannot mint verified observation trust.",
      material_fingerprint: null,
      limitations: [],
      uncertainty: [],
      producer: {
        producer_kind: "server_deterministic_evaluator",
        producer_profile: "arbitrary-deterministic-evaluator.v0.1",
      },
    }),
  );
  for (const producer of [
    USER_PRODUCER,
    MODEL_PRODUCER,
    {
      producer_kind: "provider" as const,
      producer_profile: "provider-candidate.v0.1",
    },
    {
      producer_kind: "import" as const,
      producer_profile: "import-candidate.v0.1",
    },
  ]) {
    assertBuilderRefusalV01(() =>
      buildEvidenceRecordV01({
        identity_namespace: "augnes.test.observation-laundering.v0.1",
        identity_key: `observation-laundering:${producer.producer_kind}`,
        workspace_id: WORKSPACE_ID,
        project_id: PROJECT_ID,
        evidence_kind: "direct_observation_material",
        subject_refs: [subjectRef],
        source_refs: [sourceRef],
        source_observed_or_reported_at: CREATED_AT,
        recorded_at: CREATED_AT,
        trust_class: "direct_local_observation",
        coverage: "complete",
        bounded_summary: "Candidate material cannot be relabeled observed.",
        material_fingerprint: null,
        limitations: [],
        uncertainty: [],
        producer,
      }),
    );
  }

  const db = new Database(":memory:");
  try {
    ensureVNextDurableSemanticStoreSchemaV01(db);
    const claim = claimV01({
      revision: 1,
      prior: null,
      operation: "create",
      familySeed: "forged-observation-read-family",
      proposition: "Forged observation material remains unreadable.",
    });
    admitClaimRecordV01(db, {
      workspace_id: WORKSPACE_ID,
      project_id: PROJECT_ID,
      claim,
    });
    const candidate = evidenceV01({
      identityKey: "forged-observation-restored",
    });
    const forgedEvidence = resignForgedEvidenceV01({
      ...candidate,
      evidence_kind: "direct_observation_material",
      trust_class: "direct_local_observation",
      producer: {
        producer_kind: "local_adapter",
        producer_profile: "forged-restored-local-adapter.v0.1",
      },
    });
    insertVNextCoreRecordV01(db, {
      record_kind: "evidence_record",
      record_id: forgedEvidence.evidence_id,
      workspace_id: forgedEvidence.workspace_id,
      project_id: forgedEvidence.project_id,
      fingerprint: forgedEvidence.integrity.fingerprint,
      idempotency_key: forgedEvidence.idempotency_key,
      payload: forgedEvidence,
      created_at: forgedEvidence.recorded_at,
    });
    const forgedRelation = buildClaimEvidenceRelationV01({
      family_origin: {
        origin_namespace: "augnes.test.forged-observation-relation.v0.1",
        origin_seed: "forged-observation-relation",
        origin_profile: USER_PRODUCER.producer_profile,
        origin_producer_kind: USER_PRODUCER.producer_kind,
      },
      workspace_id: WORKSPACE_ID,
      project_id: PROJECT_ID,
      revision: 1,
      prior_relation_ref: null,
      operation_intent: "create",
      supersedes_relation_ref: null,
      claim_ref: claimRecordReferenceV01(claim),
      evidence_ref: {
        record_kind: "evidence_record",
        record_id: forgedEvidence.evidence_id,
        record_fingerprint: forgedEvidence.integrity.fingerprint,
      },
      relation_kind: "supports",
      applicability_scope: applicability,
      basis: "observed",
      trust_class: "direct_local_observation",
      source_refs: [
        refV01(
          "user_relation_candidate",
          "user:forged-observation-relation",
          "user_declaration",
        ),
      ],
      limitations: ["The endpoint source must authenticate before readback."],
      uncertainty: [],
      producer: USER_PRODUCER,
      created_at: CREATED_AT,
    });
    insertVNextCoreRecordV01(db, {
      record_kind: "claim_evidence_relation",
      record_id: forgedRelation.relation_id,
      workspace_id: forgedRelation.workspace_id,
      project_id: forgedRelation.project_id,
      fingerprint: forgedRelation.integrity.fingerprint,
      idempotency_key: forgedRelation.idempotency_key,
      payload: forgedRelation,
      created_at: forgedRelation.created_at,
    });
    for (const read of [
      () =>
        readEvidenceRecordV01(db, {
          workspace_id: WORKSPACE_ID,
          project_id: PROJECT_ID,
          evidence_id: forgedEvidence.evidence_id,
        }),
      () =>
        listProjectEvidenceRecordsV01(db, {
          workspace_id: WORKSPACE_ID,
          project_id: PROJECT_ID,
        }),
      () =>
        readClaimEvidenceRelationV01(db, {
          workspace_id: WORKSPACE_ID,
          project_id: PROJECT_ID,
          relation_id: forgedRelation.relation_id,
        }),
      () =>
        readClaimEvidenceRelationFamilyLineageV01(db, {
          workspace_id: WORKSPACE_ID,
          project_id: PROJECT_ID,
          relation_family_id: forgedRelation.relation_family_id,
        }),
      () =>
        listRelationsForExactClaimV01(db, {
          workspace_id: WORKSPACE_ID,
          project_id: PROJECT_ID,
          claim_ref: claimRecordReferenceV01(claim),
        }),
      () =>
        listRelationsForExactEvidenceV01(db, {
          workspace_id: WORKSPACE_ID,
          project_id: PROJECT_ID,
          evidence_ref: forgedRelation.evidence_ref,
        }),
    ]) {
      assert.throws(read, isStoreErrorV01("persisted_evidence_record_invalid"));
    }
  } finally {
    db.close();
  }
}

function assertPrivacyBoundaryV01(): void {
  assertBuilderRefusalV01(() =>
    evidenceV01({
      identityKey: "raw-private-material",
      summary: "Persist OPENAI_API_KEY=sk-proj-forbidden-secret-material",
    }),
  );
  assertBuilderRefusalV01(() =>
    evidenceV01({
      identityKey: "arbitrary-posix-private-path",
      summary: "/custom/private/key",
    }),
  );
  const prototype = evidenceV01({ identityKey: "external-ref-boundary" });
  const rebuildWithSourceRef = (source: ExternalRefV01) =>
    buildEvidenceRecordV01({
      identity_namespace: prototype.identity_namespace,
      identity_key: prototype.identity_key,
      workspace_id: prototype.workspace_id,
      project_id: prototype.project_id,
      evidence_kind: prototype.evidence_kind,
      subject_refs: prototype.subject_refs,
      source_refs: [source],
      source_observed_or_reported_at: prototype.source_observed_or_reported_at,
      recorded_at: prototype.recorded_at,
      trust_class: prototype.trust_class,
      coverage: prototype.coverage,
      bounded_summary: prototype.bounded_summary,
      material_fingerprint: prototype.material_fingerprint,
      limitations: prototype.limitations,
      uncertainty: prototype.uncertainty,
      producer: prototype.producer,
    });
  assertBuilderRefusalV01(() =>
    rebuildWithSourceRef({
      ...sourceRef,
      external_id: "x".repeat(2_001),
    }),
  );
  assertBuilderRefusalV01(() =>
    rebuildWithSourceRef({
      ...sourceRef,
      source_ref: "x".repeat(2_001),
    }),
  );
}

let unexpectedExternalCalls = 0;
const originalFetch = globalThis.fetch;
globalThis.fetch = (async () => {
  unexpectedExternalCalls += 1;
  throw new Error("sr2_project_verify_unexpected_external_call");
}) as typeof globalThis.fetch;

try {
  assertPreSr2SchemaUpgradeV01();
  assertExportedDatabaseMigrationV01();
  assertMaterialReadSessionBoundaryV01();
  assertImmutableMaterialStoreV01();
  assertSerializedCrossConnectionReplayV01();
  assertSourceBoundAdmissionV01();
  assertSourceClaimDeterminismV01();
  assertConclusiveEvidenceSourceAuthenticationV01();
  assertPrivacyBoundaryV01();
  assertLegacyCompatibilityV01();
  assert.equal(unexpectedExternalCalls, 0);

  process.stdout.write(
    `${JSON.stringify({
      suite: "vnext-project-verify-material-v0.1",
      status: "passed",
      pre_sr2_upgrade_preservation_rollback_orphan_checked: true,
      exported_migration_semantic_projection_preservation_checked: true,
      call_local_material_read_session_boundaries_checked: true,
      immutable_replay_conflict_checked: true,
      claim_candidate_lineage_checked: true,
      family_origin_revision_producer_separation_checked: true,
      pure_retraction_semantics_checked: true,
      relation_coexistence_and_lineage_checked: true,
      relation_trust_elevation_refused: true,
      insufficient_relation_trust_laundering_refused: true,
      project_and_workspace_isolation_checked: true,
      atomic_batch_and_nested_transaction_checked: true,
      serialized_cross_connection_replay_checked: true,
      bounded_sqlite_busy_concurrency_checked: true,
      source_bound_production_shaped_admission_checked: true,
      conclusive_observation_source_authentication_checked: true,
      forged_observation_detail_list_relation_lineage_reads_refused: true,
      reserved_exact_material_generic_admission_refused: true,
      restored_forged_material_generic_read_refused: true,
      source_claim_receipt_and_order_determinism_checked: true,
      packet_fingerprint_claim_family_separation_checked: true,
      historical_no_plan_no_exact_material_checked: true,
      forged_restore_refusal_checked: true,
      backup_restore_all_kinds_and_lineage_checked: true,
      restored_immutable_triggers_checked: true,
      legacy_evidence_and_claim_preview_separation_checked: true,
      review_decision_alone_non_actuating_checked: true,
      read_only_database_stability_checked: true,
      zero_authority_writes_checked: true,
      bounded_private_material_checked: true,
      external_ref_2001_character_bound_checked: true,
      arbitrary_posix_path_refused: true,
      lineage_revision_257_refused: true,
      unexpected_network_or_provider_calls: unexpectedExternalCalls,
    })}\n`,
  );
} finally {
  globalThis.fetch = originalFetch;
}
