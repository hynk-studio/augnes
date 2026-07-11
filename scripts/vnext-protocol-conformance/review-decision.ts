import assert from "node:assert/strict";

import {
  acceptReviewDecisionInputFixture,
  deferReviewDecisionInputFixture,
  importedBasisReviewDecisionInputFixture,
  invalidReviewDecisionFixtureCases,
  rejectReviewDecisionInputFixture,
  retractReviewDecisionInputFixture,
  reviewDecisionGenericSourceProposal,
  reviewDecisionImportedBasisSourceProposal,
  reviewDecisionMultiCandidateSourceProposal,
  supersedeReviewDecisionInputFixture,
} from "@/fixtures/vnext/protocol/review-decision-v0-1";
import {
  buildReviewDecisionV01,
  canonicalizeReviewDecisionValueV01,
  createEpisodeDeltaCandidateFingerprintV01,
  createReviewDecisionFingerprintV01,
  deriveReviewDecisionIdV01,
  REVIEW_DECISION_REQUIRED_CORE_FIELDS_V01,
  type ReviewDecisionBuilderInputV01,
  validateReviewDecisionAgainstEpisodeDeltaProposalV01,
  validateReviewDecisionV01,
} from "@/lib/vnext/review-decision";
import type { ExternalRefV01 } from "@/types/vnext/external-ref";
import type { EpisodeDeltaProposalV01 } from "@/types/vnext/episode-delta-proposal";
import type { ReviewDecisionV01 } from "@/types/vnext/review-decision";

const FIXED_GENERIC_DECISION_ID =
  "review-decision:5d8e6beed62d1d72fb5558cf";
const FIXED_GENERIC_DECISION_FINGERPRINT =
  "sha256:5b7164496cf7bbde12c1e130e3773bf8e0a5ed8346620298f953ec4a9aaebd6f";

export interface ReviewDecisionConformanceSummaryV01 {
  suite: "review-decision-v0.1";
  status: "passed";
  positive_fixtures: string[];
  positive_fixture_count: number;
  negative_fixture_count: number;
  relation_negative_fixture_count: number;
  deterministic_decision_identity: true;
  generic_decision_id: string;
  generic_fingerprint: string;
  required_openai_specific_core_fields: number;
  required_chatgpt_specific_core_fields: number;
  required_codex_specific_core_fields: number;
  all_five_decisions_checked: true;
  exact_proposal_binding_checked: true;
  exact_candidate_binding_checked: true;
  actor_and_authorization_basis_refs_checked: true;
  proposal_material_basis_checked: true;
  exact_basis_ref_provenance_checked: true;
  requested_transition_intent_unapplied_checked: true;
  requested_transition_target_binding_checked: true;
  decision_transition_separation_checked: true;
  defer_revisit_semantics_checked: true;
  supersession_lineage_checked: true;
  retraction_lineage_checked: true;
  cross_project_isolation_checked: true;
  strict_root_and_nested_schema_checked: true;
  bounded_material_boundary_checked: true;
  builder_input_immutability_checked: true;
  unordered_collection_normalization_checked: true;
  resigned_malformed_decision_rejected: true;
  resigned_transition_claim_rejected: true;
  no_real_authorization_fabricated: true;
}

export function runReviewDecisionConformanceV01(): ReviewDecisionConformanceSummaryV01 {
  const acceptInput = deepFreeze(clone(acceptReviewDecisionInputFixture));
  const acceptBefore = canonicalizeReviewDecisionValueV01(acceptInput);
  const accept = buildReviewDecisionV01(acceptInput);
  assert.equal(
    canonicalizeReviewDecisionValueV01(acceptInput),
    acceptBefore,
    "accept builder input must not mutate",
  );
  const reject = buildAndValidate(
    "reject",
    rejectReviewDecisionInputFixture,
    reviewDecisionGenericSourceProposal,
  );
  const defer = buildAndValidate(
    "defer",
    deferReviewDecisionInputFixture,
    reviewDecisionGenericSourceProposal,
  );
  const supersede = buildAndValidate(
    "supersede",
    supersedeReviewDecisionInputFixture,
    reviewDecisionMultiCandidateSourceProposal,
  );
  const retract = buildAndValidate(
    "retract",
    retractReviewDecisionInputFixture(accept),
    reviewDecisionGenericSourceProposal,
  );
  const importedBasisDecision = buildAndValidate(
    "imported_basis",
    importedBasisReviewDecisionInputFixture,
    reviewDecisionImportedBasisSourceProposal,
  );

  assertValidationValid(
    "accept",
    accept,
    reviewDecisionGenericSourceProposal,
  );
  assert.equal(accept.decision, "accept");
  assert.equal(reject.decision, "reject");
  assert.equal(defer.decision, "defer");
  assert.equal(supersede.decision, "supersede");
  assert.equal(retract.decision, "retract");
  assert.equal(accept.decision_id, FIXED_GENERIC_DECISION_ID);
  assert.equal(
    accept.integrity.fingerprint,
    FIXED_GENERIC_DECISION_FINGERPRINT,
  );
  assert.equal(
    accept.source_proposal.proposal_id,
    reviewDecisionGenericSourceProposal.proposal_id,
  );
  assert.equal(
    accept.source_proposal.proposal_fingerprint,
    reviewDecisionGenericSourceProposal.integrity.fingerprint,
  );
  assert.equal(
    accept.candidate.candidate_fingerprint,
    createEpisodeDeltaCandidateFingerprintV01(
      reviewDecisionGenericSourceProposal.proposed_deltas[0]!,
    ),
  );
  assert.ok(accept.authorization_basis_refs.length > 0);
  assert.ok(accept.decision_basis_material_ids.length > 0);
  assert.ok(accept.decision_basis_refs.length > 0);
  assert.equal(accept.requested_transition_intent?.intent_only, true);
  assert.equal(accept.requested_transition_intent?.applied, false);
  assert.equal(
    accept.requested_transition_intent?.state_transition_receipt_ref,
    null,
  );
  assert.equal(reject.requested_transition_intent, null);
  assert.ok(defer.revisit);
  assert.ok(defer.revisit?.revisit_at);
  assert.ok(supersede.lineage.superseding_candidate);
  assert.notEqual(
    supersede.lineage.superseding_candidate?.candidate_id,
    supersede.candidate.candidate_id,
  );
  assert.ok(retract.lineage.retracted_decision);
  assert.deepEqual(retract.lineage.prior_decisions, [
    retract.lineage.retracted_decision,
  ]);
  assert.equal(
    retract.lineage.retracted_decision?.decision_id,
    accept.decision_id,
  );
  assert.deepEqual(
    accept.requested_transition_intent?.target_refs,
    reviewDecisionGenericSourceProposal.proposed_deltas[0]!.target_refs,
  );
  assert.deepEqual(
    supersede.requested_transition_intent?.target_refs,
    reviewDecisionMultiCandidateSourceProposal.proposed_deltas.find(
      (candidate) =>
        candidate.candidate_id ===
        supersede.lineage.superseding_candidate?.candidate_id,
    )!.target_refs,
  );
  assert.deepEqual(
    retract.requested_transition_intent?.target_refs,
    reviewDecisionGenericSourceProposal.proposed_deltas[0]!.target_refs,
  );
  assertAllFalseAuthority(accept);
  assertMaterialBoundary(accept);
  assert.equal(
    accept.authority_summary.contract_validation_verifies_actor_authorization,
    false,
  );
  assert.equal(
    accept.authority_summary.construction_proves_real_user_decision,
    false,
  );

  const repeated = buildReviewDecisionV01(
    deepFreeze(clone(acceptReviewDecisionInputFixture)),
  );
  assert.deepEqual(repeated, accept);

  const normalizationInput = clone(acceptReviewDecisionInputFixture);
  normalizationInput.authorization_basis_refs.push({
    ref_version: "external_ref.v0.1",
    ref_type: "authorization_basis",
    external_id: "synthetic-basis:secondary",
    trust_class: "user_declaration",
    observed_at: normalizationInput.decided_at,
  });
  normalizationInput.decision_basis_refs.push(
    reviewDecisionGenericSourceProposal.source_refs[0]!,
  );
  normalizationInput.decision_basis_material_ids.push(
    reviewDecisionGenericSourceProposal.observations[0]!.material_id,
  );
  normalizationInput.compatibility.warnings.push(
    "A second warning exists only to exercise unordered normalization.",
  );
  const normalized = buildReviewDecisionV01(
    deepFreeze(clone(normalizationInput)),
  );
  reverseAllArrays(normalizationInput);
  const reordered = buildReviewDecisionV01(deepFreeze(normalizationInput));
  assert.deepEqual(
    reordered,
    normalized,
    "Semantically unordered collections must normalize deterministically.",
  );

  const maxBoundedInput = clone(rejectReviewDecisionInputFixture);
  maxBoundedInput.rationale_summary = "x".repeat(2000);
  const maxBounded = buildReviewDecisionV01(deepFreeze(maxBoundedInput));
  assert.equal(validateReviewDecisionV01(maxBounded).status, "valid");

  const oversizedInput = clone(rejectReviewDecisionInputFixture);
  oversizedInput.rationale_summary = "x".repeat(2001);
  assert.throws(
    () => buildReviewDecisionV01(deepFreeze(oversizedInput)),
    RangeError,
  );

  for (const invalidCase of invalidReviewDecisionFixtureCases) {
    const validation = validateReviewDecisionV01(invalidCase.mutate(accept));
    assert.equal(
      validation.status,
      invalidCase.expected_status,
      `${invalidCase.name}: ${format(validation)}`,
    );
    assert.ok(
      validation.errors.some(
        (issue) => issue.code === invalidCase.expected_error_code,
      ),
      `${invalidCase.name} must report ${invalidCase.expected_error_code}: ${format(validation)}`,
    );
  }

  const relationCases = relationNegativeCases({
    accept,
    supersede,
    retract,
    importedBasisDecision,
  });
  for (const relationCase of relationCases) {
    const validation = validateReviewDecisionAgainstEpisodeDeltaProposalV01(
      relationCase.decision,
      relationCase.proposal,
    );
    assert.equal(
      validation.status,
      relationCase.expectedStatus,
      `${relationCase.name}: ${format(validation)}`,
    );
    assert.ok(
      validation.errors.some(
        (issue) => issue.code === relationCase.expectedCode,
      ),
      `${relationCase.name} must report ${relationCase.expectedCode}: ${format(validation)}`,
    );
    if (relationCase.resigned) assertIntegrityChecksPassed(validation);
  }

  const resignedMalformed = clone(accept);
  (
    resignedMalformed.candidate as unknown as Record<string, unknown>
  ).candidate_fingerprint = "not-a-sha256";
  resign(resignedMalformed);
  const resignedMalformedValidation = validateReviewDecisionV01(
    resignedMalformed,
  );
  assert.equal(
    resignedMalformedValidation.status,
    "invalid",
    format(resignedMalformedValidation),
  );
  assert.ok(
    resignedMalformedValidation.errors.some(
      (issue) => issue.code === "candidate_fingerprint_malformed",
    ),
  );
  assertIntegrityChecksPassed(resignedMalformedValidation);

  const resignedTransitionClaim = clone(accept);
  (
    resignedTransitionClaim.requested_transition_intent as unknown as Record<
      string,
      unknown
    >
  ).applied = true;
  resign(resignedTransitionClaim);
  const resignedTransitionValidation = validateReviewDecisionV01(
    resignedTransitionClaim,
  );
  assert.equal(
    resignedTransitionValidation.status,
    "blocked",
    format(resignedTransitionValidation),
  );
  assert.ok(
    resignedTransitionValidation.errors.some(
      (issue) => issue.code === "automatic_transition_claim",
    ),
  );
  assertIntegrityChecksPassed(resignedTransitionValidation);

  const requiredOpenAiSpecificFields =
    REVIEW_DECISION_REQUIRED_CORE_FIELDS_V01.filter((field) =>
      /openai/i.test(field),
    );
  const requiredChatGptSpecificFields =
    REVIEW_DECISION_REQUIRED_CORE_FIELDS_V01.filter((field) =>
      /chatgpt/i.test(field),
    );
  const requiredCodexSpecificFields =
    REVIEW_DECISION_REQUIRED_CORE_FIELDS_V01.filter((field) =>
      /codex/i.test(field),
    );
  assert.deepEqual(
    [
      ...requiredOpenAiSpecificFields,
      ...requiredChatGptSpecificFields,
      ...requiredCodexSpecificFields,
    ],
    [],
  );

  return {
    suite: "review-decision-v0.1",
    status: "passed",
    positive_fixtures: ["accept", "reject", "defer", "supersede", "retract"],
    positive_fixture_count: 5,
    negative_fixture_count: invalidReviewDecisionFixtureCases.length,
    relation_negative_fixture_count: relationCases.length,
    deterministic_decision_identity: true,
    generic_decision_id: accept.decision_id,
    generic_fingerprint: accept.integrity.fingerprint,
    required_openai_specific_core_fields: requiredOpenAiSpecificFields.length,
    required_chatgpt_specific_core_fields:
      requiredChatGptSpecificFields.length,
    required_codex_specific_core_fields: requiredCodexSpecificFields.length,
    all_five_decisions_checked: true,
    exact_proposal_binding_checked: true,
    exact_candidate_binding_checked: true,
    actor_and_authorization_basis_refs_checked: true,
    proposal_material_basis_checked: true,
    exact_basis_ref_provenance_checked: true,
    requested_transition_intent_unapplied_checked: true,
    requested_transition_target_binding_checked: true,
    decision_transition_separation_checked: true,
    defer_revisit_semantics_checked: true,
    supersession_lineage_checked: true,
    retraction_lineage_checked: true,
    cross_project_isolation_checked: true,
    strict_root_and_nested_schema_checked: true,
    bounded_material_boundary_checked: true,
    builder_input_immutability_checked: true,
    unordered_collection_normalization_checked: true,
    resigned_malformed_decision_rejected: true,
    resigned_transition_claim_rejected: true,
    no_real_authorization_fabricated: true,
  };
}

function buildAndValidate(
  name: string,
  input: ReviewDecisionBuilderInputV01,
  proposal: EpisodeDeltaProposalV01,
): ReviewDecisionV01 {
  const frozen = deepFreeze(clone(input));
  const before = canonicalizeReviewDecisionValueV01(frozen);
  const decision = buildReviewDecisionV01(frozen);
  assert.equal(
    canonicalizeReviewDecisionValueV01(frozen),
    before,
    `${name} builder input must not mutate`,
  );
  assertValidationValid(name, decision, proposal);
  return decision;
}

function assertValidationValid(
  name: string,
  decision: ReviewDecisionV01,
  proposal: EpisodeDeltaProposalV01,
) {
  const standalone = validateReviewDecisionV01(decision);
  assert.equal(standalone.status, "valid", `${name}: ${format(standalone)}`);
  const relation = validateReviewDecisionAgainstEpisodeDeltaProposalV01(
    decision,
    proposal,
  );
  assert.equal(relation.status, "valid", `${name}: ${format(relation)}`);
}

function relationNegativeCases({
  accept,
  supersede,
  retract,
  importedBasisDecision,
}: {
  accept: ReviewDecisionV01;
  supersede: ReviewDecisionV01;
  retract: ReviewDecisionV01;
  importedBasisDecision: ReviewDecisionV01;
}) {
  const cases: Array<{
    name: string;
    decision: ReviewDecisionV01;
    proposal: EpisodeDeltaProposalV01;
    expectedStatus: "invalid" | "blocked";
    expectedCode: string;
    resigned: boolean;
  }> = [];
  const add = (
    name: string,
    expectedCode: string,
    mutate: (decision: ReviewDecisionV01) => void,
    proposal = reviewDecisionGenericSourceProposal,
    expectedStatus: "invalid" | "blocked" = "blocked",
    sourceDecision = accept,
  ) => {
    const decision = clone(sourceDecision);
    mutate(decision);
    resign(decision);
    cases.push({
      name,
      decision,
      proposal,
      expectedStatus,
      expectedCode,
      resigned: true,
    });
  };

  add("workspace_mismatch", "workspace_mismatch", (decision) => {
    decision.workspace_id = "workspace-other-project";
  });
  add("project_mismatch", "project_mismatch", (decision) => {
    decision.project_id = "project-other";
  });
  add("proposal_id_mismatch", "proposal_id_mismatch", (decision) => {
    decision.source_proposal.proposal_id =
      "episode-delta-proposal:another-proposal";
  });
  add(
    "proposal_fingerprint_mismatch",
    "proposal_fingerprint_mismatch",
    (decision) => {
      decision.source_proposal.proposal_fingerprint = `sha256:${"1".repeat(64)}`;
    },
  );
  add("candidate_missing", "candidate_missing_from_proposal", (decision) => {
    decision.candidate.candidate_id = "delta:not-present";
  });
  add(
    "candidate_from_another_proposal",
    "candidate_missing_from_proposal",
    (decision) => {
      const foreignCandidate =
        reviewDecisionMultiCandidateSourceProposal.proposed_deltas.find(
          (candidate) =>
            candidate.candidate_id === "delta:protocol-contract-alternative",
        )!;
      decision.candidate = {
        candidate_id: foreignCandidate.candidate_id,
        candidate_fingerprint:
          createEpisodeDeltaCandidateFingerprintV01(foreignCandidate),
      };
    },
  );
  add(
    "candidate_fingerprint_mismatch",
    "candidate_fingerprint_mismatch",
    (decision) => {
      decision.candidate.candidate_fingerprint = `sha256:${"2".repeat(64)}`;
    },
  );
  add(
    "basis_material_outside_proposal",
    "basis_material_outside_proposal",
    (decision) => {
      decision.decision_basis_material_ids = ["material:not-present"];
    },
  );
  add("basis_ref_outside_proposal", "basis_ref_outside_proposal", (decision) => {
    decision.decision_basis_refs = [
      {
        ref_version: "external_ref.v0.1",
        ref_type: "source",
        external_id: "source:not-present",
        trust_class: "imported_unverified",
      },
    ];
  });
  add(
    "basis_ref_trust_upgrade_resigned",
    "basis_ref_provenance_mismatch",
    (decision) => {
      decision.decision_basis_refs[0]!.trust_class =
        "direct_local_observation";
    },
    reviewDecisionImportedBasisSourceProposal,
    "blocked",
    importedBasisDecision,
  );
  add(
    "basis_ref_source_fingerprint_changed_resigned",
    "basis_ref_provenance_mismatch",
    (decision) => {
      decision.decision_basis_refs[0]!.source_ref = `sha256:${"7".repeat(64)}`;
    },
    reviewDecisionImportedBasisSourceProposal,
    "blocked",
    importedBasisDecision,
  );
  add(
    "transition_target_outside_proposal_resigned",
    "requested_transition_target_mismatch",
    (decision) => {
      decision.requested_transition_intent!.target_refs = [
        {
          ref_version: "external_ref.v0.1",
          ref_type: "semantic_target",
          external_id: "target:not-in-proposal",
          trust_class: "derived_interpretation",
        },
      ];
    },
  );

  const multiAcceptInput = clone(supersedeReviewDecisionInputFixture);
  multiAcceptInput.decision = "accept";
  multiAcceptInput.lineage.superseding_candidate = null;
  multiAcceptInput.requested_transition_intent!.transition_kind =
    "semantic_candidate_apply";
  multiAcceptInput.requested_transition_intent!.target_refs = [
    ...reviewDecisionMultiCandidateSourceProposal.proposed_deltas.find(
      (candidate) =>
        candidate.candidate_id === multiAcceptInput.candidate.candidate_id,
    )!.target_refs,
  ];
  const multiAccept = buildReviewDecisionV01(multiAcceptInput);
  add(
    "transition_target_from_another_candidate_resigned",
    "requested_transition_target_mismatch",
    (decision) => {
      decision.requested_transition_intent!.target_refs = [
        ...reviewDecisionMultiCandidateSourceProposal.proposed_deltas.find(
          (candidate) =>
            candidate.candidate_id !== decision.candidate.candidate_id,
        )!.target_refs,
      ];
    },
    reviewDecisionMultiCandidateSourceProposal,
    "blocked",
    multiAccept,
  );
  add(
    "supersede_uses_original_candidate_target_resigned",
    "requested_transition_target_mismatch",
    (decision) => {
      decision.requested_transition_intent!.target_refs = [
        ...reviewDecisionMultiCandidateSourceProposal.proposed_deltas.find(
          (candidate) => candidate.candidate_id === decision.candidate.candidate_id,
        )!.target_refs,
      ];
    },
    reviewDecisionMultiCandidateSourceProposal,
    "blocked",
    supersede,
  );
  add(
    "transition_target_trust_changed_resigned",
    "requested_transition_target_mismatch",
    (decision) => {
      decision.requested_transition_intent!.target_refs[0]!.trust_class =
        "imported_unverified";
    },
  );
  add(
    "transition_target_source_ref_changed_resigned",
    "requested_transition_target_mismatch",
    (decision) => {
      decision.requested_transition_intent!.target_refs[0]!.source_ref =
        `sha256:${"8".repeat(64)}`;
    },
    reviewDecisionGenericSourceProposal,
    "blocked",
    retract,
  );
  add(
    "decision_precedes_proposal",
    "decision_precedes_proposal",
    (decision) => {
      decision.decided_at = "2026-07-09T00:00:00.000Z";
    },
    reviewDecisionGenericSourceProposal,
    "invalid",
  );

  const invalidProposal = clone(reviewDecisionGenericSourceProposal);
  invalidProposal.authority_summary.proposal_is_canonical_project_state =
    true as false;
  cases.push({
    name: "invalid_source_proposal",
    decision: accept,
    proposal: invalidProposal,
    expectedStatus: "blocked",
    expectedCode: "source_proposal_invalid",
    resigned: false,
  });
  return cases;
}

function resign(decision: ReviewDecisionV01) {
  decision.decision_id = deriveReviewDecisionIdV01(decision);
  decision.integrity.fingerprint = createReviewDecisionFingerprintV01(decision);
}

function assertIntegrityChecksPassed(value: {
  errors: Array<{ code: string }>;
}) {
  for (const integrityCode of [
    "decision_identity_mismatch",
    "fingerprint_mismatch",
  ]) {
    assert.equal(
      value.errors.some((issue) => issue.code === integrityCode),
      false,
      `Re-signed semantic rejection must not rely on ${integrityCode}.`,
    );
  }
}

function assertAllFalseAuthority(decision: ReviewDecisionV01) {
  for (const [key, value] of Object.entries(decision.authority_summary)) {
    if (key === "notes") continue;
    assert.equal(value, false, `${key} must remain false`);
  }
}

function assertMaterialBoundary(decision: ReviewDecisionV01) {
  assert.equal(decision.material_boundary.bounded_summaries_only, true);
  for (const [key, value] of Object.entries(decision.material_boundary)) {
    if (
      key.startsWith("raw_") ||
      key === "hidden_reasoning_persisted" ||
      key === "credential_or_secret_persisted" ||
      key === "absolute_local_path_persisted"
    ) {
      assert.equal(value, false, `${key} must remain false`);
    }
  }
}

function reverseAllArrays(value: unknown) {
  if (Array.isArray(value)) {
    value.reverse();
    value.forEach(reverseAllArrays);
    return;
  }
  if (!value || typeof value !== "object") return;
  Object.values(value as Record<string, unknown>).forEach(reverseAllArrays);
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function deepFreeze<T>(value: T): T {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  Object.values(value as Record<string, unknown>).forEach(deepFreeze);
  return Object.freeze(value);
}

function format(value: {
  status: string;
  errors: Array<{ code: string; path: string | null; message: string }>;
  warnings: Array<{ code: string; path: string | null; message: string }>;
}) {
  return JSON.stringify(value, null, 2);
}
