import assert from "node:assert/strict";

import {
  ProjectVerifyMaterialErrorV01,
  buildClaimEvidenceRelationV01,
  buildClaimRecordV01,
  buildEvidenceRecordV01,
  canonicalizeProjectVerifyMaterialV01,
  claimEvidenceRelationReferenceV01,
  claimRecordReferenceV01,
  createClaimApplicabilityScopeV01,
  evidenceRecordReferenceV01,
  type ClaimEvidenceRelationBuilderInputV01,
  type ClaimRecordBuilderInputV01,
  type EvidenceRecordBuilderInputV01,
  validateClaimEvidenceRelationV01,
  validateClaimRecordV01,
  validateEvidenceRecordV01,
} from "@/lib/vnext/project-verify-material";
import type { ExternalRefV01 } from "@/types/vnext/external-ref";
import {
  PROJECT_VERIFY_MATERIAL_MAX_COLLECTION_ITEMS_V01,
  PROJECT_VERIFY_MATERIAL_MAX_TEXT_CHARACTERS_V01,
  type ClaimApplicabilityScopeV01,
  type ClaimEvidenceRelationV01,
  type ClaimRecordV01,
  type EvidenceRecordV01,
  type ProjectVerifyProducerV01,
} from "@/types/vnext/project-verify-material";

const WORKSPACE_ID = "workspace-project-verify-conformance";
const PROJECT_A_ID = "project-project-verify-a";
const PROJECT_B_ID = "project-project-verify-b";
const RECORDED_AT = "2026-07-20T01:00:00.000Z";
const REVISION_AT = "2026-07-20T01:01:00.000Z";
const SUPERSEDE_AT = "2026-07-20T01:02:00.000Z";
const RETRACT_AT = "2026-07-20T01:03:00.000Z";

const SERVER_PRODUCER = {
  producer_kind: "server_deterministic_evaluator",
  producer_profile: "project_verify_conformance.v0.1",
} as const satisfies ProjectVerifyProducerV01;

export interface ProjectVerifyMaterialConformanceSummaryV01 {
  suite: "project-verify-material-v0.1";
  status: "passed";
  evidence_contract_checked: true;
  exact_replay_and_canonical_determinism_checked: true;
  same_identity_changed_material_checked: true;
  bounded_private_material_refusal_checked: true;
  claim_revision_lineage_checked: true;
  claim_supersession_and_retraction_candidates_checked: true;
  relation_kind_coexistence_checked: true;
  relation_revision_supersession_retraction_checked: true;
  endpoint_and_lineage_tamper_refusal_checked: true;
  producer_and_trust_boundaries_checked: true;
  project_and_family_isolation_checked: true;
  lifecycle_review_application_truth_separation_checked: true;
  database_calls: 0;
  provider_calls: 0;
  network_calls: 0;
  external_side_effects: 0;
}

export function runProjectVerifyMaterialConformanceV01(): ProjectVerifyMaterialConformanceSummaryV01 {
  const directEvidenceInput = deepFreeze(evidenceInputV01());
  const directEvidenceInputBefore =
    canonicalizeProjectVerifyMaterialV01(directEvidenceInput);
  const directEvidence = buildEvidenceRecordV01(directEvidenceInput);
  assert.equal(
    canonicalizeProjectVerifyMaterialV01(directEvidenceInput),
    directEvidenceInputBefore,
    "Evidence materialization must not mutate input.",
  );
  assertValidEvidenceV01(directEvidence);
  assertEvidenceNonAuthorityV01(directEvidence);
  assert.equal(directEvidence.evidence_kind, "direct_observation_material");
  assert.equal(directEvidence.trust_class, "direct_local_observation");
  assert.equal(directEvidence.coverage, "complete");

  const directEvidenceReplay = buildEvidenceRecordV01(
    deepFreeze(cloneValue(evidenceInputV01())),
  );
  assert.deepEqual(directEvidenceReplay, directEvidence);
  assert.equal(
    canonicalizeProjectVerifyMaterialV01(directEvidenceReplay),
    canonicalizeProjectVerifyMaterialV01(directEvidence),
  );

  const reorderedInput = evidenceInputV01({
    subject_refs: [
      externalRefV01("project_subject", "subject:secondary"),
      externalRefV01("project_subject", "subject:primary"),
    ],
    source_refs: [
      externalRefV01("verification_source", "source:secondary"),
      externalRefV01("verification_source", "source:primary"),
    ],
    limitations: ["Second limitation.", "First limitation."],
    uncertainty: ["Second uncertainty.", "First uncertainty."],
  });
  const normalizedOrder = buildEvidenceRecordV01(reorderedInput);
  const reversedOrder = cloneValue(reorderedInput);
  reversedOrder.subject_refs.reverse();
  reversedOrder.source_refs.reverse();
  reversedOrder.limitations.reverse();
  reversedOrder.uncertainty.reverse();
  assert.deepEqual(buildEvidenceRecordV01(reversedOrder), normalizedOrder);

  const changedEvidence = buildEvidenceRecordV01(
    evidenceInputV01({
      bounded_summary:
        "The same evidence identity now carries changed material.",
    }),
  );
  assert.equal(changedEvidence.evidence_id, directEvidence.evidence_id);
  assert.equal(changedEvidence.idempotency_key, directEvidence.idempotency_key);
  assert.notEqual(
    changedEvidence.integrity.fingerprint,
    directEvidence.integrity.fingerprint,
  );
  const changedWithoutResigning = cloneValue(directEvidence);
  changedWithoutResigning.bounded_summary = changedEvidence.bounded_summary;
  assertValidationRefusedV01(
    validateEvidenceRecordV01(changedWithoutResigning),
    "changed Evidence under an existing identity",
  );

  assertBoundedPrivateMaterialRefusalV01();

  const subjectRefs = [externalRefV01("claim_subject", "subject:claim-a")];
  const applicabilityScope = applicabilityScopeV01(subjectRefs);
  const claimOneInput = deepFreeze(
    claimInputV01({
      subject_refs: subjectRefs,
      applicability_scope: applicabilityScope,
    }),
  );
  const claimOneInputBefore =
    canonicalizeProjectVerifyMaterialV01(claimOneInput);
  const claimOne = buildClaimRecordV01(claimOneInput);
  assert.equal(
    canonicalizeProjectVerifyMaterialV01(claimOneInput),
    claimOneInputBefore,
    "Claim materialization must not mutate input.",
  );
  assertValidClaimV01(claimOne);
  assertClaimNonAuthorityV01(claimOne);
  assert.equal(claimOne.revision, 1);
  assert.equal(claimOne.operation_intent, "create");
  assert.equal(claimOne.prior_claim_ref, null);

  const claimOneBeforeRevisions =
    canonicalizeProjectVerifyMaterialV01(claimOne);
  const claimTwo = buildClaimRecordV01(
    claimInputV01({
      subject_refs: subjectRefs,
      applicability_scope: applicabilityScope,
      revision: 2,
      prior_claim_ref: claimRecordReferenceV01(claimOne),
      operation_intent: "revise",
      proposition: "The exact project verification proposition is revised.",
      created_at: REVISION_AT,
    }),
  );
  assertValidClaimV01(claimTwo);
  assert.equal(claimTwo.claim_family_id, claimOne.claim_family_id);
  assert.notEqual(claimTwo.claim_id, claimOne.claim_id);
  assert.deepEqual(claimTwo.prior_claim_ref, claimRecordReferenceV01(claimOne));

  const claimThree = buildClaimRecordV01(
    claimInputV01({
      subject_refs: subjectRefs,
      applicability_scope: applicabilityScope,
      revision: 3,
      prior_claim_ref: claimRecordReferenceV01(claimTwo),
      operation_intent: "supersede",
      operation_target_claim_ref: claimRecordReferenceV01(claimTwo),
      proposition: "A supersession candidate replaces the prior proposition.",
      created_at: SUPERSEDE_AT,
    }),
  );
  const claimFour = buildClaimRecordV01(
    claimInputV01({
      subject_refs: subjectRefs,
      applicability_scope: applicabilityScope,
      revision: 4,
      prior_claim_ref: claimRecordReferenceV01(claimThree),
      operation_intent: "retract",
      operation_target_claim_ref: claimRecordReferenceV01(claimThree),
      proposition: "A retraction candidate preserves the proposition history.",
      created_at: RETRACT_AT,
    }),
  );
  for (const claim of [claimThree, claimFour]) {
    assertValidClaimV01(claim);
    assertClaimNonAuthorityV01(claim);
    assert.equal(claim.claim_family_id, claimOne.claim_family_id);
  }
  assert.equal(
    canonicalizeProjectVerifyMaterialV01(claimOne),
    claimOneBeforeRevisions,
    "Claim revisions must not mutate the original Claim.",
  );
  assertClaimLineageRefusalsV01({ claimOne, claimTwo, applicabilityScope });

  const hostEvidence = buildEvidenceRecordV01(
    evidenceInputV01({
      identity_key: "host-attestation",
      evidence_kind: "host_attestation_material",
      source_refs: [
        externalRefV01("host_check", "host-check:manifest", "host_attestation"),
      ],
      trust_class: "host_attestation",
      producer: {
        producer_kind: "host",
        producer_profile: "bounded_host.v0.1",
      },
    }),
  );
  const contradictionEvidence = buildEvidenceRecordV01(
    evidenceInputV01({
      identity_key: "contradiction-observation",
      bounded_summary: "A direct observation contradicts the proposition.",
    }),
  );
  const qualifiedEvidence = buildEvidenceRecordV01(
    evidenceInputV01({
      identity_key: "verified-external-qualification",
      evidence_kind: "verified_external_observation_material",
      source_refs: [
        externalRefV01(
          "verified_external_source",
          "external:qualification",
          "verified_external_observation",
        ),
      ],
      trust_class: "verified_external_observation",
      producer: {
        producer_kind: "server_deterministic_evaluator",
        producer_profile: "verified_external_material.v0.1",
      },
    }),
  );
  const userEvidence = buildEvidenceRecordV01(
    evidenceInputV01({
      identity_key: "user-insufficient-material",
      evidence_kind: "user_declared_material",
      source_refs: [
        externalRefV01(
          "user_declaration",
          "user:insufficient",
          "user_declaration",
        ),
      ],
      trust_class: "user_declaration",
      coverage: "partial",
      producer: {
        producer_kind: "user",
        producer_profile: "user_declared_candidate.v0.1",
      },
    }),
  );

  const supportRelation = relationV01({
    family_seed: "support",
    claim: claimOne,
    evidence: directEvidence,
    relation_kind: "supports",
    basis: "observed",
    trust_class: "direct_local_observation",
  });
  const oppositionRelation = relationV01({
    family_seed: "opposition",
    claim: claimOne,
    evidence: hostEvidence,
    relation_kind: "opposes",
    basis: "attested",
    trust_class: "host_attestation",
    producer: {
      producer_kind: "host",
      producer_profile: "bounded_host.v0.1",
    },
  });
  const contradictionRelation = relationV01({
    family_seed: "contradiction",
    claim: claimOne,
    evidence: contradictionEvidence,
    relation_kind: "contradicts",
    basis: "observed",
    trust_class: "direct_local_observation",
  });
  const qualificationRelation = relationV01({
    family_seed: "qualification",
    claim: claimOne,
    evidence: qualifiedEvidence,
    relation_kind: "qualifies",
    basis: "observed",
    trust_class: "verified_external_observation",
  });
  const insufficientRelation = relationV01({
    family_seed: "insufficient",
    claim: claimOne,
    evidence: userEvidence,
    relation_kind: "insufficient",
    basis: "insufficient",
    trust_class: "user_declaration",
    producer: {
      producer_kind: "user",
      producer_profile: "user_declared_candidate.v0.1",
    },
  });
  const contextualRelation = relationV01({
    family_seed: "contextual",
    claim: claimOne,
    evidence: qualifiedEvidence,
    relation_kind: "contextualizes",
    basis: "observed",
    trust_class: "verified_external_observation",
  });
  const coexistingRelations = [
    supportRelation,
    oppositionRelation,
    contradictionRelation,
    qualificationRelation,
    insufficientRelation,
    contextualRelation,
  ];
  assert.deepEqual(
    new Set(coexistingRelations.map((relation) => relation.relation_kind)),
    new Set([
      "supports",
      "opposes",
      "contradicts",
      "qualifies",
      "insufficient",
      "contextualizes",
    ]),
  );
  for (const relation of coexistingRelations) {
    assertValidRelationV01(relation);
    assertRelationNonAuthorityV01(relation);
    assert.equal(relation.claim_ref.record_id, claimOne.claim_id);
  }

  assertRelationLineageAndTamperRefusalV01({
    claim: claimOne,
    evidence: directEvidence,
    relationOne: supportRelation,
  });
  assertProducerAndTrustBoundariesV01({ claim: claimOne, userEvidence });
  assertProjectAndFamilyIsolationV01({
    claimOne,
    applicabilityScope,
    subjectRefs,
  });

  return {
    suite: "project-verify-material-v0.1",
    status: "passed",
    evidence_contract_checked: true,
    exact_replay_and_canonical_determinism_checked: true,
    same_identity_changed_material_checked: true,
    bounded_private_material_refusal_checked: true,
    claim_revision_lineage_checked: true,
    claim_supersession_and_retraction_candidates_checked: true,
    relation_kind_coexistence_checked: true,
    relation_revision_supersession_retraction_checked: true,
    endpoint_and_lineage_tamper_refusal_checked: true,
    producer_and_trust_boundaries_checked: true,
    project_and_family_isolation_checked: true,
    lifecycle_review_application_truth_separation_checked: true,
    database_calls: 0,
    provider_calls: 0,
    network_calls: 0,
    external_side_effects: 0,
  };
}

function assertBoundedPrivateMaterialRefusalV01(): void {
  assertProjectVerifyErrorV01(
    () =>
      buildEvidenceRecordV01(
        evidenceInputV01({
          bounded_summary: "x".repeat(
            PROJECT_VERIFY_MATERIAL_MAX_TEXT_CHARACTERS_V01 + 1,
          ),
        }),
      ),
    "over-bound Evidence summary",
  );
  assertProjectVerifyErrorV01(
    () =>
      buildEvidenceRecordV01(
        evidenceInputV01({
          bounded_summary:
            "Credential marker sk-proj-1234567890 must not persist.",
        }),
      ),
    "secret-shaped Evidence summary",
  );
  assertProjectVerifyErrorV01(
    () =>
      buildEvidenceRecordV01(
        evidenceInputV01({ limitations: ["/Users/example/private.txt"] }),
      ),
    "absolute local path",
  );
  assertProjectVerifyErrorV01(
    () =>
      buildEvidenceRecordV01(
        evidenceInputV01({
          limitations: Array.from(
            { length: PROJECT_VERIFY_MATERIAL_MAX_COLLECTION_ITEMS_V01 + 1 },
            (_, index) => `limitation-${index}`,
          ),
        }),
      ),
    "over-bound Evidence limitations",
  );

  const rawField = cloneValue(
    buildEvidenceRecordV01(evidenceInputV01()),
  ) as EvidenceRecordV01 & { raw_prompt?: string };
  rawField.raw_prompt = "raw prompt material";
  assertValidationRefusedV01(
    validateEvidenceRecordV01(rawField),
    "raw-shaped protocol field",
  );
}

function assertClaimLineageRefusalsV01(input: {
  claimOne: ClaimRecordV01;
  claimTwo: ClaimRecordV01;
  applicabilityScope: ClaimApplicabilityScopeV01;
}): void {
  const otherFamily = buildClaimRecordV01(
    claimInputV01({
      family_seed: "other-family",
      subject_refs: input.claimOne.subject_refs,
      applicability_scope: input.applicabilityScope,
    }),
  );
  const otherProject = buildClaimRecordV01(
    claimInputV01({
      project_id: PROJECT_B_ID,
      subject_refs: input.claimOne.subject_refs,
      applicability_scope: input.applicabilityScope,
    }),
  );
  const revisionBase = {
    subject_refs: input.claimOne.subject_refs,
    applicability_scope: input.applicabilityScope,
    revision: 2,
    operation_intent: "revise" as const,
    proposition: "A revised proposition.",
    created_at: REVISION_AT,
  };
  assertProjectVerifyErrorV01(
    () =>
      buildClaimRecordV01(
        claimInputV01({
          ...revisionBase,
          prior_claim_ref: claimRecordReferenceV01(otherFamily),
        }),
      ),
    "foreign Claim family prior",
  );
  assertProjectVerifyErrorV01(
    () =>
      buildClaimRecordV01(
        claimInputV01({
          ...revisionBase,
          prior_claim_ref: claimRecordReferenceV01(otherProject),
        }),
      ),
    "foreign project Claim prior",
  );
  assertProjectVerifyErrorV01(
    () =>
      buildClaimRecordV01(
        claimInputV01({
          ...revisionBase,
          revision: 3,
          prior_claim_ref: claimRecordReferenceV01(input.claimOne),
        }),
      ),
    "skipped Claim revision",
  );
  assertProjectVerifyErrorV01(
    () =>
      buildClaimRecordV01(
        claimInputV01({
          ...revisionBase,
          prior_claim_ref: claimRecordReferenceV01(input.claimOne),
          operation_intent: "supersede",
          operation_target_claim_ref: claimRecordReferenceV01(input.claimTwo),
        }),
      ),
    "incoherent Claim operation target",
  );

  const wrongPriorFingerprint = cloneValue(input.claimTwo);
  assert(wrongPriorFingerprint.prior_claim_ref);
  wrongPriorFingerprint.prior_claim_ref.record_fingerprint = sha256V01("b");
  assertValidationRefusedV01(
    validateClaimRecordV01(wrongPriorFingerprint),
    "changed Claim prior fingerprint",
  );
  const wrongScope = cloneValue(input.claimTwo);
  wrongScope.project_id = PROJECT_B_ID;
  assertValidationRefusedV01(
    validateClaimRecordV01(wrongScope),
    "changed Claim project scope",
  );
}

function assertRelationLineageAndTamperRefusalV01(input: {
  claim: ClaimRecordV01;
  evidence: EvidenceRecordV01;
  relationOne: ClaimEvidenceRelationV01;
}): void {
  const relationOneBefore = canonicalizeProjectVerifyMaterialV01(
    input.relationOne,
  );
  const relationTwo = buildClaimEvidenceRelationV01(
    relationInputV01({
      family_seed: "support",
      claim: input.claim,
      evidence: input.evidence,
      revision: 2,
      prior_relation_ref: claimEvidenceRelationReferenceV01(input.relationOne),
      operation_intent: "revise",
      relation_kind: "qualifies",
      created_at: REVISION_AT,
    }),
  );
  const relationThree = buildClaimEvidenceRelationV01(
    relationInputV01({
      family_seed: "support",
      claim: input.claim,
      evidence: input.evidence,
      revision: 3,
      prior_relation_ref: claimEvidenceRelationReferenceV01(relationTwo),
      operation_intent: "supersede",
      supersedes_relation_ref: claimEvidenceRelationReferenceV01(relationTwo),
      relation_kind: "opposes",
      created_at: SUPERSEDE_AT,
    }),
  );
  const relationFour = buildClaimEvidenceRelationV01(
    relationInputV01({
      family_seed: "support",
      claim: input.claim,
      evidence: input.evidence,
      revision: 4,
      prior_relation_ref: claimEvidenceRelationReferenceV01(relationThree),
      operation_intent: "retract",
      relation_kind: "insufficient",
      basis: "insufficient",
      created_at: RETRACT_AT,
    }),
  );
  for (const relation of [relationTwo, relationThree, relationFour]) {
    assertValidRelationV01(relation);
    assertRelationNonAuthorityV01(relation);
    assert.equal(
      relation.relation_family_id,
      input.relationOne.relation_family_id,
    );
  }
  assert.equal(
    canonicalizeProjectVerifyMaterialV01(input.relationOne),
    relationOneBefore,
    "Relation revisions must not mutate the original relation.",
  );

  const otherRelation = relationV01({
    family_seed: "other-relation-family",
    claim: input.claim,
    evidence: input.evidence,
    relation_kind: "supports",
    basis: "observed",
    trust_class: "direct_local_observation",
  });
  assertProjectVerifyErrorV01(
    () =>
      buildClaimEvidenceRelationV01(
        relationInputV01({
          family_seed: "support",
          claim: input.claim,
          evidence: input.evidence,
          revision: 2,
          prior_relation_ref: claimEvidenceRelationReferenceV01(otherRelation),
          operation_intent: "revise",
          created_at: REVISION_AT,
        }),
      ),
    "foreign relation family prior",
  );
  assertProjectVerifyErrorV01(
    () =>
      buildClaimEvidenceRelationV01(
        relationInputV01({
          family_seed: "support",
          claim: input.claim,
          evidence: input.evidence,
          revision: 3,
          prior_relation_ref: claimEvidenceRelationReferenceV01(
            input.relationOne,
          ),
          operation_intent: "revise",
          created_at: REVISION_AT,
        }),
      ),
    "skipped relation revision",
  );

  const changedClaimFingerprint = cloneValue(input.relationOne);
  changedClaimFingerprint.claim_ref.record_fingerprint = sha256V01("c");
  assertValidationRefusedV01(
    validateClaimEvidenceRelationV01(changedClaimFingerprint),
    "changed relation Claim fingerprint",
  );
  const changedEvidenceFingerprint = cloneValue(input.relationOne);
  changedEvidenceFingerprint.evidence_ref.record_fingerprint = sha256V01("d");
  assertValidationRefusedV01(
    validateClaimEvidenceRelationV01(changedEvidenceFingerprint),
    "changed relation Evidence fingerprint",
  );
  assertProjectVerifyErrorV01(
    () =>
      buildClaimEvidenceRelationV01({
        ...relationInputV01({
          family_seed: "malformed-endpoint",
          claim: input.claim,
          evidence: input.evidence,
        }),
        claim_ref: {
          ...claimRecordReferenceV01(input.claim),
          record_fingerprint: "sha256:truncated",
        },
      }),
    "malformed endpoint fingerprint",
  );
}

function assertProducerAndTrustBoundariesV01(input: {
  claim: ClaimRecordV01;
  userEvidence: EvidenceRecordV01;
}): void {
  assertProjectVerifyErrorV01(
    () =>
      buildEvidenceRecordV01(
        evidenceInputV01({
          evidence_kind: "direct_observation_material",
          trust_class: "host_attestation",
        }),
      ),
    "direct observation relabeled as host attestation",
  );
  assertProjectVerifyErrorV01(
    () =>
      buildEvidenceRecordV01(
        evidenceInputV01({
          evidence_kind: "host_attestation_material",
          trust_class: "direct_local_observation",
        }),
      ),
    "host attestation relabeled as direct observation",
  );
  assertProjectVerifyErrorV01(
    () =>
      buildEvidenceRecordV01(
        evidenceInputV01({
          evidence_kind: "direct_observation_material",
          trust_class: "direct_local_observation",
          producer: {
            producer_kind: "host",
            producer_profile: "host_candidate.v0.1",
          },
        }),
      ),
    "host-produced material presented as direct observation",
  );

  const providerEvidence = buildEvidenceRecordV01(
    evidenceInputV01({
      identity_key: "provider-report",
      evidence_kind: "provider_report_material",
      source_refs: [
        externalRefV01(
          "provider_report",
          "provider:report:candidate",
          "provider_report",
        ),
      ],
      trust_class: "provider_report",
      coverage: "partial",
      producer: {
        producer_kind: "provider",
        producer_profile: "provider_candidate.v0.1",
      },
    }),
  );
  assertEvidenceNonAuthorityV01(providerEvidence);
  assertProjectVerifyErrorV01(
    () =>
      relationV01({
        family_seed: "provider-observed-forbidden",
        claim: input.claim,
        evidence: providerEvidence,
        relation_kind: "supports",
        basis: "observed",
        trust_class: "provider_report",
        producer: {
          producer_kind: "provider",
          producer_profile: "provider_candidate.v0.1",
        },
      }),
    "provider relation presented as observed",
  );
  const providerCandidate = relationV01({
    family_seed: "provider-insufficient",
    claim: input.claim,
    evidence: providerEvidence,
    relation_kind: "insufficient",
    basis: "insufficient",
    trust_class: "provider_report",
    producer: {
      producer_kind: "provider",
      producer_profile: "provider_candidate.v0.1",
    },
  });
  const modelEvidence = buildEvidenceRecordV01(
    evidenceInputV01({
      identity_key: "model-derived-insufficient",
      evidence_kind: "derived_interpretation_material",
      source_refs: [
        externalRefV01(
          "derived_interpretation",
          "model:derived:candidate",
          "derived_interpretation",
        ),
      ],
      trust_class: "derived_interpretation",
      coverage: "partial",
      producer: {
        producer_kind: "model",
        producer_profile: "model_candidate.v0.1",
      },
    }),
  );
  assertValidEvidenceV01(modelEvidence);
  assertEvidenceNonAuthorityV01(modelEvidence);
  assert.equal(modelEvidence.lifecycle.acceptance_status, "not_accepted");
  assertProjectVerifyErrorV01(
    () =>
      relationV01({
        family_seed: "model-observed-forbidden",
        claim: input.claim,
        evidence: modelEvidence,
        relation_kind: "supports",
        basis: "observed",
        trust_class: "derived_interpretation",
        producer: {
          producer_kind: "model",
          producer_profile: "model_candidate.v0.1",
        },
      }),
    "model relation presented as observed",
  );
  const modelCandidate = relationV01({
    family_seed: "model-insufficient-boundary",
    claim: input.claim,
    evidence: modelEvidence,
    relation_kind: "insufficient",
    basis: "insufficient",
    trust_class: "derived_interpretation",
    producer: {
      producer_kind: "model",
      producer_profile: "model_candidate.v0.1",
    },
  });
  const userCandidate = relationV01({
    family_seed: "user-insufficient-boundary",
    claim: input.claim,
    evidence: input.userEvidence,
    relation_kind: "insufficient",
    basis: "insufficient",
    trust_class: "user_declaration",
    producer: {
      producer_kind: "user",
      producer_profile: "user_declared_candidate.v0.1",
    },
  });
  for (const relation of [providerCandidate, modelCandidate, userCandidate]) {
    assertValidRelationV01(relation);
    assertRelationNonAuthorityV01(relation);
    assert.equal(relation.lifecycle.candidate_status, "candidate");
    assert.equal(relation.lifecycle.relation_status, "not_established");
  }
}

function assertProjectAndFamilyIsolationV01(input: {
  claimOne: ClaimRecordV01;
  applicabilityScope: ClaimApplicabilityScopeV01;
  subjectRefs: ExternalRefV01[];
}): void {
  const samePropositionOtherProject = buildClaimRecordV01(
    claimInputV01({
      project_id: PROJECT_B_ID,
      subject_refs: input.subjectRefs,
      applicability_scope: input.applicabilityScope,
      proposition: input.claimOne.proposition,
    }),
  );
  assert.notEqual(
    samePropositionOtherProject.claim_family_id,
    input.claimOne.claim_family_id,
  );
  assert.notEqual(
    samePropositionOtherProject.claim_id,
    input.claimOne.claim_id,
  );

  const identicalTextDistinctFamily = buildClaimRecordV01(
    claimInputV01({
      family_seed: "explicit-distinct-family",
      subject_refs: input.subjectRefs,
      applicability_scope: input.applicabilityScope,
      proposition: input.claimOne.proposition,
    }),
  );
  assert.notEqual(
    identicalTextDistinctFamily.claim_family_id,
    input.claimOne.claim_family_id,
  );

  const similarTextFamilyA = buildClaimRecordV01(
    claimInputV01({
      family_seed: "similar-family-a",
      subject_refs: input.subjectRefs,
      applicability_scope: input.applicabilityScope,
      proposition: "Manifest verification completed within its bound.",
    }),
  );
  const similarTextFamilyB = buildClaimRecordV01(
    claimInputV01({
      family_seed: "similar-family-b",
      subject_refs: input.subjectRefs,
      applicability_scope: input.applicabilityScope,
      proposition: "Manifest verification completed inside the bound.",
    }),
  );
  assert.notEqual(
    similarTextFamilyA.claim_family_id,
    similarTextFamilyB.claim_family_id,
  );

  const changedPropositionSameIdentity = buildClaimRecordV01(
    claimInputV01({
      subject_refs: input.subjectRefs,
      applicability_scope: input.applicabilityScope,
      proposition:
        "Changed proposition text under the same explicit family seed.",
    }),
  );
  assert.equal(
    changedPropositionSameIdentity.claim_family_id,
    input.claimOne.claim_family_id,
  );
  assert.equal(
    changedPropositionSameIdentity.claim_id,
    input.claimOne.claim_id,
  );
  assert.equal(
    changedPropositionSameIdentity.idempotency_key,
    input.claimOne.idempotency_key,
  );
  assert.notEqual(
    changedPropositionSameIdentity.integrity.fingerprint,
    input.claimOne.integrity.fingerprint,
  );
}

function evidenceInputV01(
  overrides: Partial<EvidenceRecordBuilderInputV01> = {},
): EvidenceRecordBuilderInputV01 {
  return {
    identity_namespace: "project_verify_conformance",
    identity_key: "direct-observation",
    workspace_id: WORKSPACE_ID,
    project_id: PROJECT_A_ID,
    evidence_kind: "direct_observation_material",
    subject_refs: [externalRefV01("project_subject", "subject:primary")],
    source_refs: [externalRefV01("verification_source", "source:primary")],
    source_observed_or_reported_at: RECORDED_AT,
    recorded_at: RECORDED_AT,
    trust_class: "direct_local_observation",
    coverage: "complete",
    bounded_summary: "A bounded direct observation was recorded.",
    material_fingerprint: sha256V01("a"),
    limitations: ["The record establishes support material only."],
    uncertainty: ["Semantic acceptance remains unreviewed."],
    producer: {
      producer_kind: "local_adapter",
      producer_profile: "local_adapter_conformance.v0.1",
    },
    ...overrides,
  };
}

function claimInputV01(
  overrides: Partial<ClaimRecordBuilderInputV01> & {
    subject_refs?: ExternalRefV01[];
    applicability_scope?: ClaimApplicabilityScopeV01;
  } = {},
): ClaimRecordBuilderInputV01 {
  const subjectRefs = overrides.subject_refs ?? [
    externalRefV01("claim_subject", "subject:claim-a"),
  ];
  const {
    subject_refs: _subjectRefs,
    applicability_scope: applicabilityScope,
    ...remainingOverrides
  } = overrides;
  return {
    family_namespace: "project_verify_conformance",
    family_seed: "explicit-family-seed-a",
    workspace_id: WORKSPACE_ID,
    project_id: PROJECT_A_ID,
    revision: 1,
    prior_claim_ref: null,
    operation_intent: "create",
    operation_target_claim_ref: null,
    proposition: "The exact project verification proposition holds.",
    subject_refs: subjectRefs,
    applicability_scope:
      applicabilityScope ?? applicabilityScopeV01(subjectRefs),
    source_refs: [externalRefV01("claim_source", "source:claim-a")],
    limitations: ["This proposition remains a candidate."],
    uncertainty: ["No ReviewDecision or Transition exists."],
    producer: SERVER_PRODUCER,
    created_at: RECORDED_AT,
    ...remainingOverrides,
  };
}

function relationInputV01(input: {
  family_seed: string;
  claim: ClaimRecordV01;
  evidence: EvidenceRecordV01;
  revision?: number;
  prior_relation_ref?: ClaimEvidenceRelationBuilderInputV01["prior_relation_ref"];
  operation_intent?: ClaimEvidenceRelationBuilderInputV01["operation_intent"];
  supersedes_relation_ref?: ClaimEvidenceRelationBuilderInputV01["supersedes_relation_ref"];
  relation_kind?: ClaimEvidenceRelationBuilderInputV01["relation_kind"];
  basis?: ClaimEvidenceRelationBuilderInputV01["basis"];
  trust_class?: ClaimEvidenceRelationBuilderInputV01["trust_class"];
  producer?: ProjectVerifyProducerV01;
  created_at?: string;
}): ClaimEvidenceRelationBuilderInputV01 {
  return {
    family_namespace: "project_verify_conformance",
    family_seed: input.family_seed,
    workspace_id: input.claim.workspace_id,
    project_id: input.claim.project_id,
    revision: input.revision ?? 1,
    prior_relation_ref: input.prior_relation_ref ?? null,
    operation_intent: input.operation_intent ?? "create",
    supersedes_relation_ref: input.supersedes_relation_ref ?? null,
    claim_ref: claimRecordReferenceV01(input.claim),
    evidence_ref: evidenceRecordReferenceV01(input.evidence),
    relation_kind: input.relation_kind ?? "supports",
    applicability_scope: input.claim.applicability_scope,
    basis: input.basis ?? "observed",
    trust_class: input.trust_class ?? "direct_local_observation",
    source_refs: input.evidence.source_refs,
    limitations: ["The relation remains candidate material."],
    uncertainty: ["The relation does not establish Claim truth."],
    producer: input.producer ?? SERVER_PRODUCER,
    created_at: input.created_at ?? RECORDED_AT,
  };
}

function relationV01(
  input: Parameters<typeof relationInputV01>[0],
): ClaimEvidenceRelationV01 {
  return buildClaimEvidenceRelationV01(relationInputV01(input));
}

function applicabilityScopeV01(
  subjectRefs: ExternalRefV01[],
): ClaimApplicabilityScopeV01 {
  return createClaimApplicabilityScopeV01({
    subject_refs: subjectRefs,
    environment_refs: [
      externalRefV01("environment", "environment:local-project-root"),
    ],
    temporal_scope: {
      kind: "interval",
      valid_from: "2026-07-20T00:00:00.000Z",
      valid_until: "2026-07-21T00:00:00.000Z",
    },
    condition: {
      kind: "exact_context",
      value: "applicable",
      context_refs: [
        externalRefV01("exact_context", "context:project-verification"),
      ],
    },
  });
}

function externalRefV01(
  refType: string,
  externalId: string,
  trustClass: ExternalRefV01["trust_class"] = "direct_local_observation",
): ExternalRefV01 {
  return {
    ref_version: "external_ref.v0.1",
    ref_type: refType,
    external_id: externalId,
    observed_at: RECORDED_AT,
    trust_class: trustClass,
  };
}

function assertValidEvidenceV01(record: EvidenceRecordV01): void {
  const validation = validateEvidenceRecordV01(record);
  assert.equal(validation.status, "valid", JSON.stringify(validation));
}

function assertValidClaimV01(record: ClaimRecordV01): void {
  const validation = validateClaimRecordV01(record);
  assert.equal(validation.status, "valid", JSON.stringify(validation));
}

function assertValidRelationV01(record: ClaimEvidenceRelationV01): void {
  const validation = validateClaimEvidenceRelationV01(record);
  assert.equal(validation.status, "valid", JSON.stringify(validation));
}

function assertEvidenceNonAuthorityV01(record: EvidenceRecordV01): void {
  assert.deepEqual(record.lifecycle, {
    record_status: "recorded",
    review_status: "not_reviewed",
    decision_ref: null,
    acceptance_status: "not_accepted",
    transition_ref: null,
  });
  assert.equal(record.authority.record_is_support_material, true);
  assertAllFalseV01(record.authority, ["record_is_support_material"]);
}

function assertClaimNonAuthorityV01(record: ClaimRecordV01): void {
  assert.deepEqual(record.lifecycle, {
    record_status: "recorded",
    candidate_status: "candidate",
    review_status: "not_reviewed",
    decision_ref: null,
    application_status: "not_applied",
    transition_ref: null,
    truth_status: "not_established",
  });
  assert.equal(record.authority.record_is_candidate_proposition, true);
  assertAllFalseV01(record.authority, ["record_is_candidate_proposition"]);
}

function assertRelationNonAuthorityV01(record: ClaimEvidenceRelationV01): void {
  assert.deepEqual(record.lifecycle, {
    record_status: "recorded",
    candidate_status: "candidate",
    review_status: "not_reviewed",
    decision_ref: null,
    application_status: "not_applied",
    transition_ref: null,
    relation_status: "not_established",
  });
  assert.equal(record.authority.record_is_candidate_relation, true);
  assertAllFalseV01(record.authority, ["record_is_candidate_relation"]);
}

function assertAllFalseV01(value: object, allowedTrueKeys: string[]): void {
  const allowed = new Set(allowedTrueKeys);
  for (const [key, enabled] of Object.entries(value)) {
    if (allowed.has(key)) continue;
    assert.equal(enabled, false, `${key} must remain false`);
  }
}

function assertValidationRefusedV01(
  validation: { status: "valid" | "invalid" | "blocked" },
  label: string,
): void {
  assert.notEqual(validation.status, "valid", `${label} must fail closed`);
}

function assertProjectVerifyErrorV01(
  operation: () => unknown,
  label: string,
): void {
  assert.throws(
    operation,
    (error) => error instanceof ProjectVerifyMaterialErrorV01,
    `${label} must throw ProjectVerifyMaterialErrorV01`,
  );
}

function sha256V01(hexCharacter: string): string {
  return `sha256:${hexCharacter.repeat(64)}`;
}

function deepFreeze<T>(value: T): T {
  if (!value || typeof value !== "object" || Object.isFrozen(value))
    return value;
  for (const child of Object.values(value as Record<string, unknown>)) {
    deepFreeze(child);
  }
  return Object.freeze(value);
}

function cloneValue<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}
