import assert from "node:assert/strict";

import {
  genericCliDirectObservationInputFixture,
  mixedProvenanceInputFixture,
} from "@/fixtures/vnext/protocol/run-receipt-v0-1";
import { genericCliBuilderInputFixture } from "@/fixtures/vnext/protocol/task-context-packet-v0-1";
import {
  createLocalProjectRootCriterionVerificationPlanV01,
  LOCAL_PROJECT_ROOT_VERIFICATION_REQUIRED_CHECKS_V01,
  LOCAL_PROJECT_ROOT_VERIFICATION_TASK_V01,
} from "@/lib/vnext/automation/local-project-root-verification-profile";
import { deriveCriterionVerificationObligationIdV01 } from "@/lib/vnext/criterion-verification-plan";
import {
  canonicalizeCriterionAssessmentValueV01,
  createCriterionAssessmentFingerprintV01,
  deriveCriterionAssessmentIdV01,
  evaluateCriterionAssessmentV01,
  formatCriterionRelationRefExternalIdV01,
  isExactCriterionRelationRefV01,
  parseCriterionRelationRefExternalIdV01,
  validateCriterionAssessmentAgainstSourcesV01,
  validateCriterionAssessmentV01,
  CriterionAssessmentErrorV01,
  type CriterionCheckRelationRefIdentityV01,
} from "@/lib/vnext/criterion-assessment";
import {
  buildRunReceiptV01,
  validateRunReceiptV01,
  type RunReceiptBuilderInputV01,
} from "@/lib/vnext/run-receipt";
import {
  buildTaskContextPacketV01,
  type TaskContextPacketBuilderInputV01,
  validateTaskContextPacketV01,
} from "@/lib/vnext/task-context-packet";
import type { ExternalRefV01 } from "@/types/vnext/external-ref";
import type {
  CriterionAssessmentStatusV01,
  CriterionAssessmentV01,
} from "@/types/vnext/criterion-assessment";
import type { CriterionVerificationPlanV01 } from "@/types/vnext/criterion-verification-plan";
import type {
  RunReceiptCheckResultV01,
  RunReceiptSkippedCheckV01,
  RunReceiptV01,
} from "@/types/vnext/run-receipt";
import type { TaskContextPacketV01 } from "@/types/vnext/task-context-packet";

const WORKSPACE_ID = "workspace-criterion-assessment";
const PROJECT_ID = "project-criterion-assessment";
const OTHER_PROJECT_ID = "project-criterion-assessment-other";
const RECORDED_AT = "2026-07-18T00:30:00.000Z";

export interface CriterionAssessmentConformanceSummaryV01 {
  suite: "criterion-assessment-v0.1";
  status: "passed";
  criteria_assessed: number;
  deterministic_output_checked: true;
  stable_criterion_identity_checked: true;
  insufficient_unknown_checked: true;
  status_basis_invariant_checked: true;
  criterion_specific_refs_unassigned_checked: true;
  full_source_provenance_fingerprint_checked: true;
  completed_not_success_checked: true;
  skipped_not_support_checked: true;
  unsupported_not_observed_success_checked: true;
  trust_classes_distinct_checked: true;
  exact_binding_refusal_checked: true;
  authority_boundary_checked: true;
  optional_plan_backward_compatibility_checked: true;
  exact_pass_fail_relation_checked: true;
  incomplete_relation_unknown_checked: true;
  all_aggregation_failure_semantics_checked: true;
  explicit_constant_applicability_checked: true;
  observed_attested_mixed_basis_checked: true;
  candidate_only_material_excluded_checked: true;
  invalid_plan_binding_checked: true;
  relation_replay_and_fingerprint_checked: true;
  exact_relation_binding_tamper_refused_checked: true;
  partial_plan_unplanned_uncertainty_checked: true;
  production_profile_positive_negative_checked: true;
  explicit_relation_boundary: "optional_server_owned_exact_check_plan_only";
}

export function runCriterionAssessmentConformanceV01(): CriterionAssessmentConformanceSummaryV01 {
  const packet = criterionPacketV01(PROJECT_ID);
  const receipt = insufficientReceiptV01(packet);
  const packetBefore = canonicalizeCriterionAssessmentValueV01(packet);
  const receiptBefore = canonicalizeCriterionAssessmentValueV01(receipt);
  const receiptValidation = validateRunReceiptV01(receipt);
  assert.equal(
    receiptValidation.status,
    "valid",
    JSON.stringify(receiptValidation),
  );

  const first = evaluateCriterionAssessmentV01({ packet, receipt });
  const second = evaluateCriterionAssessmentV01({
    packet: clone(packet),
    receipt: clone(receipt),
  });
  assert.deepEqual(second, first);
  assert.equal(
    second.assessment_fingerprint,
    first.assessment_fingerprint,
  );
  assert.equal(validateCriterionAssessmentV01(first).status, "valid");
  assert.equal(first.criteria.length, packet.task.success_criteria.length);
  assert.equal(first.summary.unknown, packet.task.success_criteria.length);
  assert.equal(first.summary.satisfied, 0);
  assert.equal(first.summary.unsatisfied, 0);
  assert.equal(first.summary.not_applicable, 0);
  assert.equal(first.packet_ref.external_id, packet.packet_id);
  assert.equal(first.packet_ref.source_ref, packet.integrity.fingerprint);
  assert.equal(
    first.packet_ref.observed_at,
    receipt.task_context_packet_ref?.observed_at,
  );
  assert.equal(first.receipt_ref.external_id, receipt.receipt_id);
  assert.equal(first.receipt_ref.source_ref, receipt.integrity.fingerprint);
  assert.equal(first.run_id, receipt.run_id);
  assert.equal(
    first.criteria.every((item) =>
      item.uncertainty.includes(
        "No explicit protocol-owned criterion-to-residue relation is available; receipt residue was not assigned as criterion supporting, opposing, or missing refs.",
      ),
    ),
    true,
    "historical no-plan assessment copy must remain byte-compatible",
  );
  assert.equal(
    first.criteria.every(
      (item) =>
        item.status === "unknown" &&
        item.basis === "insufficient" &&
        item.supporting_refs.length === 0 &&
        item.opposing_refs.length === 0 &&
        item.missing_refs.length === 0,
    ),
    true,
  );
  assert.equal(
    first.criteria.every((item) =>
      item.uncertainty.some((value) =>
        value.includes("execution completion does not establish task success"),
      ),
    ),
    true,
  );
  assert.equal(
    first.criteria.every((item) =>
      item.uncertainty.some((value) =>
        value.includes("packet-delivery checks establish transport binding only"),
      ),
    ),
    true,
  );
  assert.equal(
    first.criteria.every((item) =>
      item.uncertainty.some((value) => value.includes("was skipped")),
    ),
    true,
  );
  assert.equal(
    first.criteria.every((item) =>
      item.uncertainty.some((value) =>
        value.includes(
          "Receipt gap repository_command_execution_unavailable",
        ),
      ),
    ),
    true,
  );
  assert.equal(
    first.criteria.every((item) =>
      item.operation_coverage.some(
        (entry) =>
          entry.capability === "repository_command_execution" &&
          entry.coverage_level === "outside_coverage" &&
          entry.source_ref === null,
      ),
    ),
    true,
  );
  assert.equal(
    first.criteria.every(
      (item) =>
        item.trust.direct_local_observation ===
        receipt.trust_summary.direct_observations,
    ),
    true,
  );
  assert.equal(
    canonicalizeCriterionAssessmentValueV01(packet),
    packetBefore,
    "evaluation must not mutate the packet",
  );
  assert.equal(
    canonicalizeCriterionAssessmentValueV01(receipt),
    receiptBefore,
    "evaluation must not mutate the receipt",
  );

  assert.equal(
    deriveCriterionAssessmentIdV01("  Preserve exact source binding.  "),
    deriveCriterionAssessmentIdV01("Preserve exact source binding."),
  );
  for (const item of first.criteria) {
    assert.equal(
      item.criterion_id,
      deriveCriterionAssessmentIdV01(item.criterion),
    );
  }

  assertProvenanceFingerprintMutationV01(
    first,
    (changed) => {
      changed.packet_ref.observed_at = "2026-07-18T01:00:00.000Z";
    },
    "packet_ref.observed_at",
  );
  assertProvenanceFingerprintMutationV01(
    first,
    (changed) => {
      changed.receipt_ref.observed_at = "2026-07-18T01:01:00.000Z";
    },
    "receipt_ref.observed_at",
  );
  assertProvenanceFingerprintMutationV01(
    first,
    (changed) => {
      for (const item of changed.criteria) {
        const coverage = item.operation_coverage.find(
          (entry) => entry.capability === "local_repository_observation",
        );
        assert(coverage?.source_ref?.observed_at);
        coverage.source_ref.observed_at = "2026-07-18T01:02:00.000Z";
      }
    },
    "operation_coverage.source_ref.observed_at",
  );

  for (const status of [
    "satisfied",
    "unsatisfied",
    "not_applicable",
  ] as const satisfies readonly CriterionAssessmentStatusV01[]) {
    const conflict = clone(first);
    conflict.criteria[0]!.status = status;
    conflict.summary.unknown -= 1;
    conflict.summary[status] += 1;
    conflict.assessment_fingerprint =
      createCriterionAssessmentFingerprintV01(conflict);
    const validation = validateCriterionAssessmentV01(conflict);
    assert.equal(validation.status, "blocked");
    assert.equal(
      validation.errors.some(
        (issue) =>
          issue.code === "criterion_assessment_status_basis_conflict",
      ),
      true,
      `${status} with insufficient basis must fail closed`,
    );
  }

  const unknownObserved = clone(first);
  unknownObserved.criteria[0]!.basis = "observed";
  unknownObserved.assessment_fingerprint =
    createCriterionAssessmentFingerprintV01(unknownObserved);
  assert.equal(
    validateCriterionAssessmentV01(unknownObserved).status,
    "valid",
    "historical unknown status may retain an observed basis when future explicit residue is incomplete or conflicting",
  );

  const failedReceiptInput = insufficientReceiptInputV01(packet);
  failedReceiptInput.checks = failedReceiptInput.checks.map((check) => ({
    ...check,
    status: "failed" as const,
    summary: "The transport check failed without a criterion relation.",
  }));
  failedReceiptInput.verification.status = "failed";
  const failedReceipt = buildRunReceiptV01(failedReceiptInput);
  const failedAssessment = evaluateCriterionAssessmentV01({
    packet,
    receipt: failedReceipt,
  });
  assert.equal(
    failedAssessment.criteria.every(
      (item) =>
        item.status === "unknown" && item.opposing_refs.length === 0,
    ),
    true,
    "a failed check without an explicit criterion relation must not infer unsatisfied",
  );

  const mixedReceipt = mixedTrustReceiptV01(packet);
  const mixedAssessment = evaluateCriterionAssessmentV01({
    packet,
    receipt: mixedReceipt,
  });
  const mixedTrust = mixedAssessment.criteria[0]!.trust;
  assert.equal(mixedTrust.direct_local_observation > 0, true);
  assert.equal(mixedTrust.verified_external_observation > 0, true);
  assert.equal(mixedTrust.host_attestation > 0, true);
  assert.equal(mixedTrust.provider_report > 0, true);
  assert.equal(mixedTrust.derived_interpretation > 0, true);
  assert.equal(mixedAssessment.criteria[0]!.status, "unknown");
  assert.equal(mixedAssessment.criteria[0]!.basis, "insufficient");

  const wrongPacketIdReceipt = buildRunReceiptV01({
    ...insufficientReceiptInputV01(packet),
    task_context_packet_ref: {
      ...insufficientReceiptInputV01(packet).task_context_packet_ref!,
      external_id: "task-context-packet:00000000000000000000000",
    },
  });
  assertAssessmentErrorV01(
    () =>
      evaluateCriterionAssessmentV01({
        packet,
        receipt: wrongPacketIdReceipt,
      }),
    "criterion_assessment_packet_id_mismatch",
  );

  const wrongPacketFingerprintReceipt = buildRunReceiptV01({
    ...insufficientReceiptInputV01(packet),
    task_context_packet_ref: {
      ...insufficientReceiptInputV01(packet).task_context_packet_ref!,
      source_ref: `sha256:${"0".repeat(64)}`,
    },
  });
  assertAssessmentErrorV01(
    () =>
      evaluateCriterionAssessmentV01({
        packet,
        receipt: wrongPacketFingerprintReceipt,
      }),
    "criterion_assessment_packet_fingerprint_mismatch",
  );

  const otherProjectPacket = criterionPacketV01(OTHER_PROJECT_ID);
  assertAssessmentErrorV01(
    () =>
      evaluateCriterionAssessmentV01({
        packet: otherProjectPacket,
        receipt,
      }),
    "criterion_assessment_project_mismatch",
  );

  const tampered = clone(first);
  tampered.summary.unknown = 0;
  assert.equal(validateCriterionAssessmentV01(tampered).status, "blocked");

  const unknownField = Object.assign(clone(first), {
    provider_interpretation: "must not enter the provider-neutral contract",
  });
  assert.equal(
    validateCriterionAssessmentV01(unknownField).status,
    "blocked",
  );

  assert.deepEqual(first.authority, {
    authoritative: false,
    creates_evidence: false,
    validates_claims: false,
    creates_proposal: false,
    creates_decision: false,
    applies_transition: false,
    changes_semantic_state: false,
    changes_later_context: false,
  });

  assertTypedCriterionVerificationV01();

  return {
    suite: "criterion-assessment-v0.1",
    status: "passed",
    criteria_assessed: first.criteria.length,
    deterministic_output_checked: true,
    stable_criterion_identity_checked: true,
    insufficient_unknown_checked: true,
    status_basis_invariant_checked: true,
    criterion_specific_refs_unassigned_checked: true,
    full_source_provenance_fingerprint_checked: true,
    completed_not_success_checked: true,
    skipped_not_support_checked: true,
    unsupported_not_observed_success_checked: true,
    trust_classes_distinct_checked: true,
    exact_binding_refusal_checked: true,
    authority_boundary_checked: true,
    optional_plan_backward_compatibility_checked: true,
    exact_pass_fail_relation_checked: true,
    incomplete_relation_unknown_checked: true,
    all_aggregation_failure_semantics_checked: true,
    explicit_constant_applicability_checked: true,
    observed_attested_mixed_basis_checked: true,
    candidate_only_material_excluded_checked: true,
    invalid_plan_binding_checked: true,
    relation_replay_and_fingerprint_checked: true,
    exact_relation_binding_tamper_refused_checked: true,
    partial_plan_unplanned_uncertainty_checked: true,
    production_profile_positive_negative_checked: true,
    explicit_relation_boundary: "optional_server_owned_exact_check_plan_only",
  };
}

type PlannedCheckStatusV01 = RunReceiptCheckResultV01["status"];
type PlannedCheckBasisV01 = RunReceiptCheckResultV01["basis"];

interface PlannedCheckInputV01 {
  check_id: string;
  status: PlannedCheckStatusV01;
  basis?: PlannedCheckBasisV01;
}

interface PlannedReceiptOptionsV01 {
  label: string;
  checks?: PlannedCheckInputV01[];
  skipped_check_ids?: string[];
  candidate_only_material?: boolean;
  candidate_check_trust?: "provider_report" | "user_declaration";
}

function assertTypedCriterionVerificationV01(): void {
  const noPlanInput = productionPacketInputV01(PROJECT_ID, false);
  const noPlanPacket = buildTaskContextPacketV01(noPlanInput);
  const noPlanReplay = buildTaskContextPacketV01(clone(noPlanInput));
  assert.deepEqual(noPlanReplay, noPlanPacket);
  assert.equal("criterion_verification_plan" in noPlanPacket, false);
  assert.equal(
    validateTaskContextPacketV01(noPlanPacket, { evaluated_at: RECORDED_AT })
      .status,
    "valid",
  );

  const packet = productionPacketV01(PROJECT_ID);
  assert.equal(packet.packet_version, noPlanPacket.packet_version);
  assert.notEqual(packet.packet_id, noPlanPacket.packet_id);
  assert.notEqual(
    packet.integrity.fingerprint,
    noPlanPacket.integrity.fingerprint,
  );
  assert.equal(
    validateTaskContextPacketV01(packet, { evaluated_at: RECORDED_AT }).status,
    "valid",
  );

  const partialPlanInput = productionPacketInputV01(PROJECT_ID, true);
  const unplannedCriterion =
    LOCAL_PROJECT_ROOT_VERIFICATION_TASK_V01.success_criteria[1];
  partialPlanInput.criterion_verification_plan!.criteria =
    partialPlanInput.criterion_verification_plan!.criteria.filter(
      (entry) => entry.criterion !== unplannedCriterion,
    );
  const partialPlanPacket = buildTaskContextPacketV01(partialPlanInput);
  const partialPlanReceipt = plannedReceiptV01(partialPlanPacket, {
    label: "partial-plan-unplanned-criterion",
    checks: [observedCheckV01("project_root_scope_verified", "passed")],
  });
  const unplannedItem = criterionItemV01(
    evaluateCriterionAssessmentV01({
      packet: partialPlanPacket,
      receipt: partialPlanReceipt,
    }),
    unplannedCriterion,
  );
  assert.equal(unplannedItem.status, "unknown");
  assert.equal(unplannedItem.basis, "insufficient");
  assert.equal(unplannedItem.supporting_refs.length, 0);
  assert.equal(
    unplannedItem.uncertainty.includes(
      "No typed server-owned verification plan binds this criterion; it remains unknown / insufficient.",
    ),
    true,
  );
  assert.equal(
    unplannedItem.uncertainty.includes(
      "No explicit protocol-owned criterion-to-residue relation is available; receipt residue was not assigned as criterion supporting, opposing, or missing refs.",
    ),
    false,
  );

  const rootCriterion = LOCAL_PROJECT_ROOT_VERIFICATION_TASK_V01.success_criteria[0];
  const manifestBoundCriterion =
    LOCAL_PROJECT_ROOT_VERIFICATION_TASK_V01.success_criteria[1];
  const manifestCriterion =
    LOCAL_PROJECT_ROOT_VERIFICATION_TASK_V01.success_criteria[2];
  const noSideEffectsCriterion =
    LOCAL_PROJECT_ROOT_VERIFICATION_TASK_V01.success_criteria[3];

  const passedRootReceipt = plannedReceiptV01(packet, {
    label: "passed-root",
    checks: [observedCheckV01("project_root_scope_verified", "passed")],
  });
  const passedRoot = evaluateCriterionAssessmentV01({
    packet,
    receipt: passedRootReceipt,
  });
  const passedRootItem = criterionItemV01(passedRoot, rootCriterion);
  assert.equal(passedRootItem.status, "satisfied");
  assert.equal(passedRootItem.basis, "observed");
  assert.equal(passedRootItem.supporting_refs.length, 1);
  assert.equal(
    isExactCriterionRelationRefV01(passedRootItem.supporting_refs[0]),
    true,
  );
  assertCriterionCheckRefV01(
    passedRootItem.supporting_refs[0]!,
    passedRootReceipt,
    "project_root_scope_verified",
    "passed",
    "criterion_check_support",
    "direct_local_observation",
  );
  const wrongCheckSourceAssessment = clone(passedRoot);
  wrongCheckSourceAssessment.criteria.find(
    (item) => item.criterion === rootCriterion,
  )!.supporting_refs[0]!.source_ref = `sha256:${"0".repeat(64)}`;
  assertAssessmentValidationErrorV01(
    wrongCheckSourceAssessment,
    "criterion_assessment_relation_check_source_mismatch",
  );
  const wrongCheckReceiptIdentityAssessment = clone(passedRoot);
  const wrongReceiptRef = wrongCheckReceiptIdentityAssessment.criteria.find(
    (item) => item.criterion === rootCriterion,
  )!.supporting_refs[0]!;
  const wrongReceiptIdentity = parseCriterionRelationRefExternalIdV01(
    wrongReceiptRef.external_id,
  );
  assert(wrongReceiptIdentity?.kind === "check");
  wrongReceiptRef.external_id = formatCriterionRelationRefExternalIdV01({
    ...wrongReceiptIdentity,
    receipt_id: "run-receipt:foreign",
  });
  assertAssessmentValidationErrorV01(
    wrongCheckReceiptIdentityAssessment,
    "criterion_assessment_relation_check_identity_mismatch",
  );
  const wrongCheckCriterionIdentityAssessment = clone(passedRoot);
  const wrongCriterionRef = wrongCheckCriterionIdentityAssessment.criteria.find(
    (item) => item.criterion === rootCriterion,
  )!.supporting_refs[0]!;
  const wrongCriterionIdentity = parseCriterionRelationRefExternalIdV01(
    wrongCriterionRef.external_id,
  );
  assert(wrongCriterionIdentity?.kind === "check");
  const foreignCriterionId =
    deriveCriterionAssessmentIdV01(manifestBoundCriterion);
  wrongCriterionRef.external_id = formatCriterionRelationRefExternalIdV01({
    ...wrongCriterionIdentity,
    criterion_id: foreignCriterionId,
    obligation_id: deriveCriterionVerificationObligationIdV01({
      criterion_id: foreignCriterionId,
      check_id: wrongCriterionIdentity.check_id,
    }),
  });
  assertAssessmentValidationErrorV01(
    wrongCheckCriterionIdentityAssessment,
    "criterion_assessment_relation_check_identity_mismatch",
  );
  assert.equal(
    validateCriterionAssessmentAgainstSourcesV01({
      packet,
      receipt: passedRootReceipt,
      assessment: passedRoot,
    }).status,
    "valid",
  );
  const exactRelationMutations: Array<{
    label: string;
    mutate: (input: {
      assessment: CriterionAssessmentV01;
      item: CriterionAssessmentV01["criteria"][number];
      ref: ExternalRefV01;
      identity: CriterionCheckRelationRefIdentityV01;
    }) => void;
  }> = [
    {
      label: "obligation-id",
      mutate: ({ ref, identity }) => {
        ref.external_id = formatCriterionRelationRefExternalIdV01({
          ...identity,
          obligation_id: `criterion-obligation:sha256:${"0".repeat(64)}`,
        });
      },
    },
    {
      label: "check-id",
      mutate: ({ ref, identity }) => {
        ref.external_id = formatCriterionRelationRefExternalIdV01({
          ...identity,
          check_id: "project_root_manifest_verified",
        });
      },
    },
    {
      label: "relation-direction",
      mutate: ({ assessment, item, ref, identity }) => {
        item.supporting_refs = [];
        ref.ref_type = "criterion_check_opposition";
        ref.external_id = formatCriterionRelationRefExternalIdV01({
          ...identity,
          direction: "opposition",
          residue_status: "failed",
          relation_material_fingerprint: `sha256:${"1".repeat(64)}`,
        });
        item.opposing_refs = [ref];
        item.status = "unsatisfied";
        assessment.summary.satisfied -= 1;
        assessment.summary.unsatisfied += 1;
      },
    },
    {
      label: "residue-kind",
      mutate: ({ assessment, item, ref, identity }) => {
        item.supporting_refs = [];
        ref.ref_type = "criterion_check_missing";
        ref.external_id = formatCriterionRelationRefExternalIdV01({
          ...identity,
          direction: "missing",
          residue_kind: "skipped_check",
          residue_status: "skipped",
          relation_material_fingerprint: `sha256:${"2".repeat(64)}`,
        });
        item.missing_refs = [ref];
        item.status = "unknown";
        item.basis = "insufficient";
        assessment.summary.satisfied -= 1;
        assessment.summary.unknown += 1;
      },
    },
    {
      label: "check-status",
      mutate: ({ ref, identity }) => {
        ref.external_id = formatCriterionRelationRefExternalIdV01({
          ...identity,
          residue_status: "failed",
        });
      },
    },
    {
      label: "basis",
      mutate: ({ ref, identity }) => {
        ref.external_id = formatCriterionRelationRefExternalIdV01({
          ...identity,
          basis: "attested",
        });
      },
    },
    {
      label: "relation-material-fingerprint",
      mutate: ({ ref, identity }) => {
        ref.external_id = formatCriterionRelationRefExternalIdV01({
          ...identity,
          relation_material_fingerprint: `sha256:${"3".repeat(64)}`,
        });
      },
    },
  ];
  for (const testCase of exactRelationMutations) {
    const changed = clone(passedRoot);
    const item = criterionItemV01(changed, rootCriterion);
    const ref = item.supporting_refs[0]!;
    const receiptSourceFingerprint = ref.source_ref;
    const identity = parseCriterionRelationRefExternalIdV01(ref.external_id);
    assert(identity?.kind === "check");
    testCase.mutate({ assessment: changed, item, ref, identity });
    assert.equal(
      ref.source_ref,
      receiptSourceFingerprint,
      `${testCase.label} must retain the correct receipt source fingerprint`,
    );
    changed.assessment_fingerprint =
      createCriterionAssessmentFingerprintV01(changed);
    const structural = validateCriterionAssessmentV01(changed);
    const sourceBound = validateCriterionAssessmentAgainstSourcesV01({
      packet,
      receipt: passedRootReceipt,
      assessment: changed,
    });
    assert.equal(
      sourceBound.status,
      "blocked",
      `${testCase.label} must fail source-bound validation`,
    );
    assert.equal(
      structural.status !== "valid" || sourceBound.status === "blocked",
      true,
      `${testCase.label} must be refused structurally or by source binding`,
    );
  }
  const canonicalRelationExternalId =
    passedRootItem.supporting_refs[0]!.external_id;
  const relationSegments = canonicalRelationExternalId.split("|");
  const reorderedSegments = [...relationSegments];
  [reorderedSegments[3], reorderedSegments[4]] = [
    reorderedSegments[4]!,
    reorderedSegments[3]!,
  ];
  for (const [label, externalId] of [
    ["truncated", relationSegments.slice(0, -1).join("|")],
    ["reordered", reorderedSegments.join("|")],
    ["malformed", `${canonicalRelationExternalId}%`],
  ] as const) {
    const malformed = clone(passedRoot);
    criterionItemV01(malformed, rootCriterion).supporting_refs[0]!.external_id =
      externalId;
    assertAssessmentValidationErrorV01(
      malformed,
      "criterion_assessment_relation_ref_invalid",
    );
    assert.equal(
      parseCriterionRelationRefExternalIdV01(externalId),
      null,
      `${label} relation identifiers must not parse`,
    );
  }

  const failedRootReceipt = plannedReceiptV01(packet, {
    label: "failed-root",
    checks: [observedCheckV01("project_root_scope_verified", "failed")],
  });
  const failedRoot = evaluateCriterionAssessmentV01({
    packet,
    receipt: failedRootReceipt,
  });
  const failedRootItem = criterionItemV01(failedRoot, rootCriterion);
  assert.equal(failedRootItem.status, "unsatisfied");
  assert.equal(failedRootItem.basis, "observed");
  assert.equal(failedRootItem.opposing_refs.length, 1);
  assertCriterionCheckRefV01(
    failedRootItem.opposing_refs[0]!,
    failedRootReceipt,
    "project_root_scope_verified",
    "failed",
    "criterion_check_opposition",
    "direct_local_observation",
  );

  const incompleteCases = [
    {
      label: "skipped-root",
      options: {
        label: "skipped-root",
        skipped_check_ids: ["project_root_scope_verified"],
      } satisfies PlannedReceiptOptionsV01,
      expectedResidue: "skipped",
    },
    {
      label: "absent-root",
      options: { label: "absent-root" } satisfies PlannedReceiptOptionsV01,
      expectedResidue: "absent",
    },
    {
      label: "blocked-root",
      options: {
        label: "blocked-root",
        checks: [observedCheckV01("project_root_scope_verified", "blocked")],
      } satisfies PlannedReceiptOptionsV01,
      expectedResidue: "blocked",
    },
    {
      label: "unknown-root",
      options: {
        label: "unknown-root",
        checks: [observedCheckV01("project_root_scope_verified", "unknown")],
      } satisfies PlannedReceiptOptionsV01,
      expectedResidue: "unknown",
    },
  ] as const;
  for (const incompleteCase of incompleteCases) {
    const incompleteReceipt = plannedReceiptV01(
      packet,
      incompleteCase.options,
    );
    const incomplete = criterionItemV01(
      evaluateCriterionAssessmentV01({ packet, receipt: incompleteReceipt }),
      rootCriterion,
    );
    assert.equal(incomplete.status, "unknown", incompleteCase.label);
    assert.equal(incomplete.basis, "insufficient", incompleteCase.label);
    assert.equal(incomplete.supporting_refs.length, 0, incompleteCase.label);
    assert.equal(incomplete.opposing_refs.length, 0, incompleteCase.label);
    assert.equal(incomplete.missing_refs.length, 1, incompleteCase.label);
    const parsedMissing = parseCriterionRelationRefExternalIdV01(
      incomplete.missing_refs[0]!.external_id,
    );
    assert(parsedMissing?.kind === "check");
    assert.equal(
      parsedMissing.residue_status,
      incompleteCase.expectedResidue,
      `${incompleteCase.label} must preserve its exact missing residue status`,
    );
  }

  const allPassedReceipt = plannedReceiptV01(packet, {
    label: "all-two-passed",
    checks: [
      observedCheckV01("project_file_mutation_absent", "passed"),
      observedCheckV01("provider_model_network_absent", "passed"),
    ],
  });
  const allPassedItem = criterionItemV01(
    evaluateCriterionAssessmentV01({ packet, receipt: allPassedReceipt }),
    noSideEffectsCriterion,
  );
  assert.equal(allPassedItem.status, "satisfied");
  assert.equal(allPassedItem.supporting_refs.length, 2);

  const oneMissingReceipt = plannedReceiptV01(packet, {
    label: "one-of-two-missing",
    checks: [observedCheckV01("project_file_mutation_absent", "passed")],
  });
  const oneMissingItem = criterionItemV01(
    evaluateCriterionAssessmentV01({ packet, receipt: oneMissingReceipt }),
    noSideEffectsCriterion,
  );
  assert.equal(oneMissingItem.status, "unknown");
  assert.equal(oneMissingItem.basis, "insufficient");
  assert.equal(oneMissingItem.supporting_refs.length, 1);
  assert.equal(oneMissingItem.missing_refs.length, 1);

  const oneFailedOneMissingReceipt = plannedReceiptV01(packet, {
    label: "one-failed-one-missing",
    checks: [observedCheckV01("project_file_mutation_absent", "failed")],
  });
  const oneFailedOneMissingItem = criterionItemV01(
    evaluateCriterionAssessmentV01({
      packet,
      receipt: oneFailedOneMissingReceipt,
    }),
    noSideEffectsCriterion,
  );
  assert.equal(oneFailedOneMissingItem.status, "unknown");
  assert.equal(oneFailedOneMissingItem.basis, "insufficient");
  assert.equal(oneFailedOneMissingItem.supporting_refs.length, 0);
  assert.equal(oneFailedOneMissingItem.opposing_refs.length, 1);
  assert.equal(oneFailedOneMissingItem.missing_refs.length, 1);

  const allFailedReceipt = plannedReceiptV01(packet, {
    label: "all-two-failed",
    checks: [
      observedCheckV01("project_file_mutation_absent", "failed"),
      observedCheckV01("provider_model_network_absent", "failed"),
    ],
  });
  const allFailedItem = criterionItemV01(
    evaluateCriterionAssessmentV01({ packet, receipt: allFailedReceipt }),
    noSideEffectsCriterion,
  );
  assert.equal(allFailedItem.status, "unsatisfied");
  assert.equal(allFailedItem.opposing_refs.length, 2);

  const differentObligationPassFailReceipt = plannedReceiptV01(packet, {
    label: "different-obligation-pass-fail",
    checks: [
      observedCheckV01("project_file_mutation_absent", "passed"),
      observedCheckV01("provider_model_network_absent", "failed"),
    ],
  });
  const differentObligationPassFailAssessment =
    evaluateCriterionAssessmentV01({
      packet,
      receipt: differentObligationPassFailReceipt,
    });
  const differentObligationPassFailItem = criterionItemV01(
    differentObligationPassFailAssessment,
    noSideEffectsCriterion,
  );
  assert.equal(differentObligationPassFailItem.status, "unsatisfied");
  assert.equal(differentObligationPassFailItem.basis, "observed");
  assert.equal(differentObligationPassFailItem.supporting_refs.length, 1);
  assert.equal(differentObligationPassFailItem.opposing_refs.length, 1);
  assert.equal(differentObligationPassFailItem.missing_refs.length, 0);
  assert.equal(
    differentObligationPassFailItem.uncertainty.some((value) =>
      value.includes("passed obligations remain preserved"),
    ),
    true,
  );

  const contradictorySameObligation = clone(
    differentObligationPassFailAssessment,
  );
  const contradictoryItem = criterionItemV01(
    contradictorySameObligation,
    noSideEffectsCriterion,
  );
  const originalSupport = contradictoryItem.supporting_refs[0]!;
  const parsedSupport = parseCriterionRelationRefExternalIdV01(
    originalSupport.external_id,
  );
  assert(parsedSupport?.kind === "check");
  const contradictoryRef: ExternalRefV01 = {
    ...clone(originalSupport),
    ref_type: "criterion_check_opposition",
    external_id: formatCriterionRelationRefExternalIdV01({
      ...parsedSupport,
      direction: "opposition",
      residue_status: "failed",
      relation_material_fingerprint: `sha256:${"f".repeat(64)}`,
    }),
  };
  contradictoryItem.opposing_refs.push(contradictoryRef);
  contradictoryItem.status = "unknown";
  contradictoryItem.basis = "insufficient";
  contradictoryItem.trust.direct_local_observation += 1;
  contradictorySameObligation.summary.unsatisfied -= 1;
  contradictorySameObligation.summary.unknown += 1;
  assertAssessmentValidationErrorV01(
    contradictorySameObligation,
    "criterion_assessment_relation_obligation_conflict",
  );

  const notApplicableInput = productionPacketInputV01(PROJECT_ID, true);
  notApplicableInput.criterion_verification_plan!.criteria[0]!.applicability = {
    rule: "constant",
    value: "not_applicable",
  };
  const notApplicablePacket = buildTaskContextPacketV01(notApplicableInput);
  const notApplicableReceipt = plannedReceiptV01(notApplicablePacket, {
    label: "not-applicable",
  });
  const notApplicableItem = criterionItemV01(
    evaluateCriterionAssessmentV01({
      packet: notApplicablePacket,
      receipt: notApplicableReceipt,
    }),
    notApplicableInput.criterion_verification_plan!.criteria[0]!.criterion,
  );
  assert.equal(notApplicableItem.status, "not_applicable");
  assert.equal(notApplicableItem.basis, "observed");
  assert.equal(notApplicableItem.supporting_refs.length, 1);
  assert.equal(
    notApplicableItem.supporting_refs[0]!.ref_type,
    "criterion_applicability",
  );
  const notApplicableAssessment = evaluateCriterionAssessmentV01({
    packet: notApplicablePacket,
    receipt: notApplicableReceipt,
  });
  const wrongApplicabilitySourceAssessment = clone(notApplicableAssessment);
  wrongApplicabilitySourceAssessment.criteria.find(
    (item) => item.criterion === notApplicableItem.criterion,
  )!.supporting_refs[0]!.source_ref = `sha256:${"0".repeat(64)}`;
  assertAssessmentValidationErrorV01(
    wrongApplicabilitySourceAssessment,
    "criterion_assessment_relation_applicability_source_mismatch",
  );
  const wrongApplicabilityIdentityAssessment = clone(notApplicableAssessment);
  const wrongApplicabilityRef =
    wrongApplicabilityIdentityAssessment.criteria.find(
      (item) => item.criterion === notApplicableItem.criterion,
    )!.supporting_refs[0]!;
  const wrongApplicabilityIdentity = parseCriterionRelationRefExternalIdV01(
    wrongApplicabilityRef.external_id,
  );
  assert(wrongApplicabilityIdentity?.kind === "applicability");
  wrongApplicabilityRef.external_id =
    formatCriterionRelationRefExternalIdV01({
      ...wrongApplicabilityIdentity,
      packet_id: "task-context-packet:00000000000000000000000",
    });
  assertAssessmentValidationErrorV01(
    wrongApplicabilityIdentityAssessment,
    "criterion_assessment_relation_applicability_identity_mismatch",
  );
  assert.equal(
    notApplicableItem.uncertainty.some((value) =>
      value.includes("no prose or model inference"),
    ),
    true,
  );

  const attestedReceipt = plannedReceiptV01(packet, {
    label: "attested-root",
    checks: [
      {
        check_id: "project_root_scope_verified",
        status: "passed",
        basis: "attested",
      },
    ],
  });
  const attestedItem = criterionItemV01(
    evaluateCriterionAssessmentV01({ packet, receipt: attestedReceipt }),
    rootCriterion,
  );
  assert.equal(attestedItem.status, "satisfied");
  assert.equal(attestedItem.basis, "attested");
  assert.equal(attestedItem.trust.host_attestation, 1);
  assert.equal(attestedItem.trust.direct_local_observation, 0);

  const mixedObligationsReceipt = plannedReceiptV01(packet, {
    label: "mixed-obligations",
    checks: [
      observedCheckV01("project_file_mutation_absent", "passed"),
      {
        check_id: "provider_model_network_absent",
        status: "passed",
        basis: "attested",
      },
    ],
  });
  const mixedObligationsItem = criterionItemV01(
    evaluateCriterionAssessmentV01({
      packet,
      receipt: mixedObligationsReceipt,
    }),
    noSideEffectsCriterion,
  );
  assert.equal(mixedObligationsItem.status, "satisfied");
  assert.equal(mixedObligationsItem.basis, "mixed");
  assert.equal(mixedObligationsItem.trust.direct_local_observation, 1);
  assert.equal(mixedObligationsItem.trust.host_attestation, 1);

  const mixedPassFailReceipt = plannedReceiptV01(packet, {
    label: "mixed-pass-fail-obligations",
    checks: [
      observedCheckV01("project_file_mutation_absent", "passed"),
      {
        check_id: "provider_model_network_absent",
        status: "failed",
        basis: "attested",
      },
    ],
  });
  const mixedPassFailItem = criterionItemV01(
    evaluateCriterionAssessmentV01({
      packet,
      receipt: mixedPassFailReceipt,
    }),
    noSideEffectsCriterion,
  );
  assert.equal(mixedPassFailItem.status, "unsatisfied");
  assert.equal(mixedPassFailItem.basis, "mixed");
  assert.equal(mixedPassFailItem.supporting_refs.length, 1);
  assert.equal(mixedPassFailItem.opposing_refs.length, 1);
  assert.equal(mixedPassFailItem.missing_refs.length, 0);
  assert.equal(mixedPassFailItem.trust.direct_local_observation, 1);
  assert.equal(mixedPassFailItem.trust.host_attestation, 1);

  const candidateOnlyReceipt = plannedReceiptV01(packet, {
    label: "candidate-only",
    candidate_only_material: true,
  });
  assert.equal(candidateOnlyReceipt.trust_summary.provider_reports > 0, true);
  assert.equal(candidateOnlyReceipt.trust_summary.user_declarations > 0, true);
  const candidateOnlyAssessment = evaluateCriterionAssessmentV01({
    packet,
    receipt: candidateOnlyReceipt,
  });
  assert.equal(
    candidateOnlyAssessment.criteria.every(
      (item) =>
        item.status === "unknown" &&
        item.basis === "insufficient" &&
        item.trust.provider_report === 0 &&
        item.trust.user_declaration === 0,
    ),
    true,
    "provider/user candidate material cannot enter the conclusive evaluator",
  );
  for (const candidateTrust of [
    "provider_report",
    "user_declaration",
  ] as const) {
    const candidateCheckReceipt = plannedReceiptV01(packet, {
      label: `candidate-check-${candidateTrust}`,
      checks: [
        {
          check_id: "project_root_scope_verified",
          status: "passed",
          basis: "attested",
        },
      ],
      candidate_only_material: true,
      candidate_check_trust: candidateTrust,
    });
    const candidateCheckItem = criterionItemV01(
      evaluateCriterionAssessmentV01({
        packet,
        receipt: candidateCheckReceipt,
      }),
      rootCriterion,
    );
    assert.equal(candidateCheckItem.status, "unknown", candidateTrust);
    assert.equal(candidateCheckItem.basis, "insufficient", candidateTrust);
    assert.equal(candidateCheckItem.supporting_refs.length, 0, candidateTrust);
    assert.equal(candidateCheckItem.missing_refs.length, 1, candidateTrust);
    assert.equal(
      candidateCheckItem.trust[candidateTrust],
      1,
      candidateTrust,
    );
  }

  assertInvalidPlanBindingV01(
    "criterion mismatch",
    (plan) => {
      plan.criteria[0]!.criterion = "A criterion not present in the packet.";
    },
    "criterion_verification_plan_criterion_missing",
  );
  assertInvalidPlanBindingV01(
    "workspace mismatch",
    (plan) => {
      plan.workspace_id = "workspace-foreign";
    },
    "criterion_verification_plan_workspace_mismatch",
  );
  assertInvalidPlanBindingV01(
    "project mismatch",
    (plan) => {
      plan.project_id = OTHER_PROJECT_ID;
    },
    "criterion_verification_plan_project_mismatch",
  );
  assertInvalidPlanBindingV01(
    "non-admitted check",
    (plan) => {
      plan.criteria[0]!.obligations[0]!.check_id = "model_inferred_check";
    },
    "criterion_verification_plan_check_not_admitted",
  );
  assertInvalidPlanBindingV01(
    "duplicate obligation",
    (plan) => {
      plan.criteria[0]!.obligations.push(
        clone(plan.criteria[0]!.obligations[0]!),
      );
    },
    "criterion_verification_plan_obligation_duplicate",
  );
  assertInvalidPlanBindingV01(
    "duplicate criterion entry",
    (plan) => {
      plan.criteria.push(clone(plan.criteria[0]!));
    },
    "criterion_verification_plan_criterion_duplicate",
  );

  const replayAssessment = evaluateCriterionAssessmentV01({
    packet: clone(packet),
    receipt: clone(passedRootReceipt),
  });
  assert.deepEqual(replayAssessment, passedRoot);
  const changedReceipt = plannedReceiptV01(packet, {
    label: "passed-root",
    checks: [observedCheckV01("project_root_scope_verified", "failed")],
  });
  assert.equal(changedReceipt.idempotency_key, passedRootReceipt.idempotency_key);
  assert.notEqual(changedReceipt.receipt_id, passedRootReceipt.receipt_id);
  assert.notEqual(
    changedReceipt.integrity.fingerprint,
    passedRootReceipt.integrity.fingerprint,
  );
  const changedAssessment = evaluateCriterionAssessmentV01({
    packet,
    receipt: changedReceipt,
  });
  assert.notEqual(
    changedAssessment.assessment_fingerprint,
    passedRoot.assessment_fingerprint,
  );
  const staleChangedReceipt = clone(passedRootReceipt);
  staleChangedReceipt.checks[0]!.status = "failed";
  assertAssessmentErrorV01(
    () =>
      evaluateCriterionAssessmentV01({
        packet,
        receipt: staleChangedReceipt,
      }),
    "criterion_assessment_receipt_invalid",
  );
  assert.notEqual(
    notApplicablePacket.integrity.fingerprint,
    packet.integrity.fingerprint,
  );

  const otherProjectPacket = productionPacketV01(OTHER_PROJECT_ID);
  assertAssessmentErrorV01(
    () =>
      evaluateCriterionAssessmentV01({
        packet: otherProjectPacket,
        receipt: passedRootReceipt,
      }),
    "criterion_assessment_project_mismatch",
  );

  const completeReceipt = plannedReceiptV01(packet, {
    label: "production-complete",
    checks: LOCAL_PROJECT_ROOT_VERIFICATION_REQUIRED_CHECKS_V01.map(
      (checkId) => observedCheckV01(checkId, "passed"),
    ),
  });
  const completeAssessment = evaluateCriterionAssessmentV01({
    packet,
    receipt: completeReceipt,
  });
  assert.deepEqual(completeAssessment.summary, {
    satisfied: 4,
    unsatisfied: 0,
    unknown: 0,
    not_applicable: 0,
  });
  assert.equal(
    completeAssessment.criteria.every(
      (item) => item.status === "satisfied" && item.basis === "observed",
    ),
    true,
  );

  const manifestFailureReceipt = plannedReceiptV01(packet, {
    label: "production-manifest-failure",
    checks: [
      observedCheckV01("project_root_scope_verified", "passed"),
      observedCheckV01("project_root_manifest_verified", "failed"),
    ],
    skipped_check_ids: [
      "project_root_manifest_bound",
      "project_file_mutation_absent",
      "provider_model_network_absent",
    ],
  });
  const manifestFailureAssessment = evaluateCriterionAssessmentV01({
    packet,
    receipt: manifestFailureReceipt,
  });
  assert.equal(
    criterionItemV01(manifestFailureAssessment, rootCriterion).status,
    "satisfied",
  );
  assert.equal(
    criterionItemV01(manifestFailureAssessment, manifestCriterion).status,
    "unsatisfied",
  );
  assert.equal(
    criterionItemV01(manifestFailureAssessment, manifestBoundCriterion).status,
    "unknown",
  );
  assert.equal(
    criterionItemV01(manifestFailureAssessment, noSideEffectsCriterion).status,
    "unknown",
  );
}

function productionPacketV01(projectId: string): TaskContextPacketV01 {
  return buildTaskContextPacketV01(productionPacketInputV01(projectId, true));
}

function productionPacketInputV01(
  projectId: string,
  includePlan: boolean,
): TaskContextPacketBuilderInputV01 {
  const input = clone(
    genericCliBuilderInputFixture,
  ) as TaskContextPacketBuilderInputV01;
  input.workspace_id = WORKSPACE_ID;
  input.project_id = projectId;
  input.generated_at = RECORDED_AT;
  input.expires_at = null;
  input.task = {
    goal: LOCAL_PROJECT_ROOT_VERIFICATION_TASK_V01.goal,
    success_criteria: [
      ...LOCAL_PROJECT_ROOT_VERIFICATION_TASK_V01.success_criteria,
    ],
    non_goals: [...LOCAL_PROJECT_ROOT_VERIFICATION_TASK_V01.non_goals],
  };
  input.constraints.required_checks = [
    ...LOCAL_PROJECT_ROOT_VERIFICATION_REQUIRED_CHECKS_V01,
  ];
  input.constraints.context_budget = {
    ...input.constraints.context_budget,
    max_characters: 100_000,
    max_estimated_tokens: 25_000,
  };
  input.return_contract.required_checks = [
    ...LOCAL_PROJECT_ROOT_VERIFICATION_REQUIRED_CHECKS_V01,
  ];
  if (includePlan) {
    input.criterion_verification_plan =
      createLocalProjectRootCriterionVerificationPlanV01({
        workspace_id: WORKSPACE_ID,
        project_id: projectId,
      });
  } else {
    delete input.criterion_verification_plan;
  }
  return input;
}

function plannedReceiptV01(
  packet: TaskContextPacketV01,
  options: PlannedReceiptOptionsV01,
): RunReceiptV01 {
  const input = clone(
    genericCliDirectObservationInputFixture,
  ) as RunReceiptBuilderInputV01;
  const observedRef = refV01(
    "criterion_verifier",
    `criterion-observer-${options.label}`,
    "direct_local_observation",
  );
  const hostRef = refV01(
    "criterion_host_report",
    `criterion-host-${options.label}`,
    "host_attestation",
  );
  const providerRef = refV01(
    "criterion_relation_candidate",
    `provider-candidate-${options.label}`,
    "provider_report",
  );
  const userRef = refV01(
    "criterion_relation_candidate",
    `user-candidate-${options.label}`,
    "user_declaration",
  );
  const checks = options.checks ?? [];
  const skippedCheckIds = options.skipped_check_ids ?? [];
  const candidateCheckRef =
    options.candidate_check_trust === "provider_report"
      ? providerRef
      : options.candidate_check_trust === "user_declaration"
        ? userRef
        : null;
  const usesHost = checks.some(
    (check) => check.basis === "attested" || check.basis === "mixed",
  ) && !candidateCheckRef;
  const usesObservedVerification =
    checks.some(
      (check) => (check.basis ?? "observed") !== "attested",
    ) || skippedCheckIds.length > 0;
  const usesAttestedVerification = usesHost || Boolean(candidateCheckRef);

  input.workspace_id = packet.workspace_id;
  input.project_id = packet.project_id;
  input.run_id = `run-criterion-${options.label}`;
  input.recorded_at = RECORDED_AT;
  input.started_at = "2026-07-18T00:00:00.000Z";
  input.finished_at = "2026-07-18T00:20:00.000Z";
  input.work_ref = null;
  input.task_context_packet_ref = packetRefV01(packet);
  input.execution = {
    status: "completed",
    basis: "observed",
    source_refs: [observedRef],
  };
  input.verification = {
    status: verificationStatusV01(checks, skippedCheckIds),
    basis:
      usesObservedVerification && usesAttestedVerification
        ? "mixed"
        : usesAttestedVerification
          ? "attested"
          : usesObservedVerification
            ? "observed"
            : "unknown",
    required_check_ids: [
      ...LOCAL_PROJECT_ROOT_VERIFICATION_REQUIRED_CHECKS_V01,
    ],
    source_refs: [
      ...(usesObservedVerification ? [observedRef] : []),
      ...(usesHost ? [hostRef] : []),
      ...(candidateCheckRef ? [candidateCheckRef] : []),
    ],
  };
  input.reporter_ref = observedRef;
  input.observer_refs = [observedRef];
  input.verifier_refs = [observedRef, ...(usesHost ? [hostRef] : [])];
  input.host_ref = usesHost ? hostRef : null;
  input.worker_ref = observedRef;
  input.model_invocations = [];
  input.execution_environment = {
    environment_kind: "local",
    host_ref: usesHost ? hostRef : null,
    worker_ref: observedRef,
    operating_system: "portable-test-fixture",
    runtime_labels: ["criterion-exact-check-fixture"],
    source_refs: [observedRef],
  };
  input.observations = [
    {
      observation_id: `observation:${options.label}:execution`,
      observation_kind: "bounded_execution",
      summary: "The bounded fixture execution was directly observed.",
      event_at: "2026-07-18T00:20:00.000Z",
      observed_at: "2026-07-18T00:20:00.000Z",
      observer_ref: observedRef,
      trust_class: "direct_local_observation",
      source_refs: [observedRef],
      related_command_ids: [],
      related_check_ids: [],
      related_artifact_refs: [],
    },
    ...checks
      .filter((check) => (check.basis ?? "observed") !== "attested")
      .map((check, index) => ({
        observation_id: `observation:${options.label}:check:${index}`,
        observation_kind: "exact_check_result",
        summary: `Exact check ${check.check_id} was directly observed.`,
        event_at: "2026-07-18T00:20:00.000Z",
        observed_at: "2026-07-18T00:20:00.000Z",
        observer_ref: observedRef,
        trust_class: "direct_local_observation" as const,
        source_refs: [observedRef],
        related_command_ids: [],
        related_check_ids: [check.check_id],
        related_artifact_refs: [],
      })),
    ...skippedCheckIds.map((checkId, index) => ({
      observation_id: `observation:${options.label}:skip:${index}`,
      observation_kind: "exact_check_skip",
      summary: `Exact check ${checkId} could not complete.`,
      event_at: "2026-07-18T00:20:00.000Z",
      observed_at: "2026-07-18T00:20:00.000Z",
      observer_ref: observedRef,
      trust_class: "direct_local_observation" as const,
      source_refs: [observedRef],
      related_command_ids: [],
      related_check_ids: [checkId],
      related_artifact_refs: [],
    })),
  ];
  input.attestations = [
    ...(usesHost
      ? [
          {
            attestation_id: `attestation:${options.label}:checks`,
            attestation_kind: "exact_check_result_claim",
            summary:
              "The host attested only the exact structured check residue.",
            reported_at: "2026-07-18T00:20:00.000Z",
            reporter_ref: hostRef,
            trust_class: "host_attestation" as const,
            source_refs: [hostRef],
            subject_refs: [],
          },
        ]
      : []),
    ...(options.candidate_only_material
      ? [
          {
            attestation_id: `attestation:${options.label}:provider-candidate`,
            attestation_kind: "criterion_relation_candidate",
            summary:
              "Provider material is retained only as a non-conclusive candidate.",
            reported_at: "2026-07-18T00:20:00.000Z",
            reporter_ref: providerRef,
            trust_class: "provider_report" as const,
            source_refs: [providerRef],
            subject_refs: [],
          },
          {
            attestation_id: `attestation:${options.label}:user-candidate`,
            attestation_kind: "criterion_relation_candidate",
            summary:
              "User material is retained only as a non-conclusive candidate.",
            reported_at: "2026-07-18T00:20:00.000Z",
            reporter_ref: userRef,
            trust_class: "user_declaration" as const,
            source_refs: [userRef],
            subject_refs: [],
          },
        ]
      : []),
  ];
  input.changed_artifacts = [];
  input.commands = [];
  input.checks = checks.map(
    (check): RunReceiptCheckResultV01 => ({
      check_id: check.check_id,
      required: true,
      status: check.status,
      basis: check.basis ?? "observed",
      summary: `Exact structured check ${check.check_id} is ${check.status}.`,
      source_refs:
        check.basis === "attested"
          ? [candidateCheckRef ?? hostRef]
          : check.basis === "mixed"
            ? [observedRef, hostRef]
            : [observedRef],
    }),
  );
  input.skipped_checks = skippedCheckIds.map(
    (checkId): RunReceiptSkippedCheckV01 => ({
      check_id: checkId,
      required: true,
      reason: `Exact structured check ${checkId} could not complete in the bounded fixture.`,
      basis: "observed",
      source_refs: [observedRef],
    }),
  );
  input.external_refs = [
    ...(usesHost ? [hostRef] : []),
    ...(options.candidate_only_material ? [providerRef, userRef] : []),
  ];
  input.result_summary = {
    summary:
      "The production-shaped exact-check fixture completed without granting semantic authority.",
    outcome: "completed",
    limitations: [
      "Structured receipt residue is not accepted Evidence or task acceptance.",
    ],
  };
  input.blockers = [];
  input.warnings = [];
  input.gaps = [];
  input.privacy_egress = {
    data_classification: "public_safe",
    egress_status: "unknown",
    basis: "unknown",
    destination_refs: [],
    redaction_status: "not_needed",
    retention_class: null,
    raw_prompt_persisted: false,
    raw_output_persisted: false,
    raw_transcript_persisted: false,
    secret_material_persisted: false,
    source_refs: [],
    notes: ["No egress conclusion is inferred from this pure fixture."],
  };
  input.cost_usage = {
    cost_basis: "unknown",
    cost_amount: null,
    currency: null,
    usage: {
      basis: "unknown",
      input_units: null,
      output_units: null,
      total_units: null,
      unit: null,
    },
    source_refs: [],
  };
  input.capability_coverage = [
    {
      capability: "local_project_root_verification",
      coverage_level: "observed",
      source_ref: observedRef,
      notes: ["Coverage does not create semantic authority."],
    },
  ];
  input.source_refs = [
    observedRef,
    ...(usesHost ? [hostRef] : []),
    ...(options.candidate_only_material ? [providerRef, userRef] : []),
  ];
  input.artifact_refs = [];
  input.compatibility = {
    source_contracts: ["local_project_root_verification.v0.1"],
    unmapped_fields: [],
    warnings: [],
    external_refs: [],
  };
  input.authority_notes = [
    "Criterion assessment is derived and cannot create Evidence, decisions, Transitions, or semantic state.",
  ];
  const receipt = buildRunReceiptV01(input);
  const validation = validateRunReceiptV01(receipt);
  assert.equal(
    validation.status,
    "valid",
    `${options.label}: ${JSON.stringify(validation)}`,
  );
  return receipt;
}

function verificationStatusV01(
  checks: PlannedCheckInputV01[],
  skippedCheckIds: string[],
): RunReceiptBuilderInputV01["verification"]["status"] {
  if (checks.some((check) => check.status === "failed")) return "failed";
  if (
    skippedCheckIds.length === 0 &&
    checks.length === LOCAL_PROJECT_ROOT_VERIFICATION_REQUIRED_CHECKS_V01.length &&
    checks.every((check) => check.status === "passed")
  ) {
    return "passed";
  }
  if (checks.length === 0 && skippedCheckIds.length === 0) return "not_run";
  return "partial";
}

function observedCheckV01(
  checkId: string,
  status: PlannedCheckStatusV01,
): PlannedCheckInputV01 {
  return { check_id: checkId, status, basis: "observed" };
}

function criterionItemV01(
  assessment: CriterionAssessmentV01,
  criterion: string,
) {
  const item = assessment.criteria.find(
    (candidate) => candidate.criterion === criterion,
  );
  assert(item, `Expected assessment item for criterion: ${criterion}`);
  return item;
}

function assertCriterionCheckRefV01(
  ref: ExternalRefV01,
  receipt: RunReceiptV01,
  checkId: string,
  status: PlannedCheckStatusV01,
  refType: string,
  trustClass: ExternalRefV01["trust_class"],
): void {
  assert.equal(ref.ref_type, refType);
  assert.equal(ref.source_ref, receipt.integrity.fingerprint);
  assert.equal(ref.trust_class, trustClass);
  assert.equal(ref.compatibility_namespace, "criterion_exact_check_evaluator.v0.1");
  const parsed = parseCriterionRelationRefExternalIdV01(ref.external_id);
  assert(parsed?.kind === "check");
  assert.equal(parsed.receipt_id, receipt.receipt_id);
  assert.equal(parsed.receipt_fingerprint, receipt.integrity.fingerprint);
  assert.equal(parsed.run_id, receipt.run_id);
  assert.equal(parsed.check_id, checkId);
  assert.equal(parsed.residue_status, status);
  assert.equal(parsed.trust_class, trustClass);
  assert.equal(parsed.relation_material_fingerprint.startsWith("sha256:"), true);
}

function assertInvalidPlanBindingV01(
  label: string,
  mutate: (plan: CriterionVerificationPlanV01) => void,
  expectedCode: string,
): void {
  const input = productionPacketInputV01(PROJECT_ID, true);
  mutate(input.criterion_verification_plan!);
  const packet = buildTaskContextPacketV01(input);
  const validation = validateTaskContextPacketV01(packet, {
    evaluated_at: RECORDED_AT,
  });
  assert.equal(validation.status, "blocked", `${label}: ${JSON.stringify(validation)}`);
  assert.equal(
    validation.errors.some((issue) => issue.code === expectedCode),
    true,
    `${label} must report ${expectedCode}: ${JSON.stringify(validation)}`,
  );
  assertAssessmentErrorV01(
    () =>
      evaluateCriterionAssessmentV01({
        packet,
        receipt: plannedReceiptV01(productionPacketV01(PROJECT_ID), {
          label: `invalid-${label.replaceAll(" ", "-")}`,
        }),
      }),
    "criterion_assessment_packet_invalid",
  );
}

function criterionPacketV01(projectId: string) {
  const input = clone(
    genericCliBuilderInputFixture,
  ) as TaskContextPacketBuilderInputV01;
  input.workspace_id = WORKSPACE_ID;
  input.project_id = projectId;
  input.generated_at = RECORDED_AT;
  input.expires_at = null;
  input.task.goal = "Assess exact task success without inferring from prose.";
  input.task.success_criteria = [
    "Preserve exact source binding.",
    "Keep skipped checks distinct from passed checks.",
  ];
  input.task.non_goals = [
    "Do not create a proposal, decision, Transition, or Evidence record.",
  ];
  input.constraints.required_checks = ["check:repository"];
  return buildTaskContextPacketV01(input);
}

function insufficientReceiptV01(
  packet: ReturnType<typeof criterionPacketV01>,
) {
  return buildRunReceiptV01(insufficientReceiptInputV01(packet));
}

function insufficientReceiptInputV01(
  packet: ReturnType<typeof criterionPacketV01>,
): RunReceiptBuilderInputV01 {
  const input = clone(
    genericCliDirectObservationInputFixture,
  ) as RunReceiptBuilderInputV01;
  input.workspace_id = packet.workspace_id;
  input.project_id = packet.project_id;
  input.run_id = "run-criterion-assessment-insufficient";
  input.recorded_at = RECORDED_AT;
  input.task_context_packet_ref = packetRefV01(packet);
  input.verification = {
    status: "partial",
    basis: "observed",
    required_check_ids: [
      "check:typecheck",
      "validated_packet_delivery",
      "check:repository",
    ],
    source_refs: input.verification.source_refs,
  };
  input.checks = [
    ...input.checks,
    {
      ...input.checks[0]!,
      check_id: "validated_packet_delivery",
      required: true,
      status: "passed",
      summary: "The exact packet was delivered to the bounded host adapter.",
    },
  ];
  input.skipped_checks = [
    {
      check_id: "check:repository",
      required: true,
      reason: "Repository command execution is unsupported in this fixture.",
      basis: "observed",
      source_refs: [input.verifier_refs[0]!],
    },
  ];
  input.capability_coverage = [
    ...input.capability_coverage,
    {
      capability: "repository_command_execution",
      coverage_level: "outside_coverage",
      source_ref: null,
      notes: ["The deterministic adapter cannot execute repository commands."],
    },
  ];
  input.gaps = [
    {
      code: "repository_command_execution_unavailable",
      summary: "Repository commands were not executed.",
      source_refs: [input.reporter_ref],
    },
  ];
  input.result_summary = {
    summary: "Host execution completed with task success still unknown.",
    outcome: "completed",
    limitations: ["No criterion relation was recorded."],
  };
  return input;
}

function mixedTrustReceiptV01(
  packet: ReturnType<typeof criterionPacketV01>,
) {
  const input = clone(
    mixedProvenanceInputFixture,
  ) as RunReceiptBuilderInputV01;
  input.workspace_id = packet.workspace_id;
  input.project_id = packet.project_id;
  input.run_id = "run-criterion-assessment-mixed-trust";
  input.task_context_packet_ref = packetRefV01(packet);
  const providerRef = refV01(
    "provider_reporter",
    "provider-report-fixture",
    "provider_report",
  );
  const derivedRef = refV01(
    "assessment_projection",
    "derived-interpretation-fixture",
    "derived_interpretation",
  );
  input.attestations.push(
    {
      attestation_id: "attestation:provider-report",
      attestation_kind: "provider_result_report",
      summary: "The provider reported bounded result material.",
      reported_at: RECORDED_AT,
      reporter_ref: providerRef,
      trust_class: "provider_report",
      source_refs: [providerRef],
      subject_refs: [],
    },
    {
      attestation_id: "attestation:derived-interpretation",
      attestation_kind: "derived_result_interpretation",
      summary: "A projection retained one derived interpretation.",
      reported_at: RECORDED_AT,
      reporter_ref: derivedRef,
      trust_class: "derived_interpretation",
      source_refs: [derivedRef],
      subject_refs: [],
    },
  );
  input.external_refs.push(providerRef, derivedRef);
  input.source_refs.push(providerRef, derivedRef);
  return buildRunReceiptV01(input);
}

function packetRefV01(
  packet: ReturnType<typeof criterionPacketV01>,
): ExternalRefV01 {
  return {
    ref_version: "external_ref.v0.1",
    ref_type: "task_context_packet",
    external_id: packet.packet_id,
    trust_class: "direct_local_observation",
    observed_at: packet.generated_at,
    source_ref: packet.integrity.fingerprint,
    compatibility_namespace: packet.packet_version,
  };
}

function refV01(
  refType: string,
  externalId: string,
  trustClass: ExternalRefV01["trust_class"],
): ExternalRefV01 {
  return {
    ref_version: "external_ref.v0.1",
    ref_type: refType,
    external_id: externalId,
    observed_at: RECORDED_AT,
    trust_class: trustClass,
  };
}

function assertAssessmentErrorV01(
  action: () => unknown,
  expectedCode: string,
): void {
  assert.throws(
    action,
    (error) =>
      error instanceof CriterionAssessmentErrorV01 &&
      error.code === expectedCode,
  );
}

function assertAssessmentValidationErrorV01(
  assessment: CriterionAssessmentV01,
  expectedCode: string,
): void {
  assessment.assessment_fingerprint =
    createCriterionAssessmentFingerprintV01(assessment);
  const validation = validateCriterionAssessmentV01(assessment);
  assert.equal(validation.status, "blocked", JSON.stringify(validation));
  assert.equal(
    validation.errors.some((issue) => issue.code === expectedCode),
    true,
    `${expectedCode} must fail closed: ${JSON.stringify(validation)}`,
  );
}

function assertProvenanceFingerprintMutationV01(
  assessment: CriterionAssessmentV01,
  mutate: (changed: CriterionAssessmentV01) => void,
  field: string,
): void {
  const changed = clone(assessment);
  mutate(changed);
  const recomputedFingerprint =
    createCriterionAssessmentFingerprintV01(changed);
  assert.notEqual(
    recomputedFingerprint,
    assessment.assessment_fingerprint,
    `${field} must affect the assessment fingerprint`,
  );

  const staleValidation = validateCriterionAssessmentV01(changed);
  assert.equal(staleValidation.status, "blocked");
  assert.equal(
    staleValidation.errors.some(
      (issue) => issue.code === "criterion_assessment_fingerprint_mismatch",
    ),
    true,
    `${field} with the prior fingerprint must fail validation`,
  );

  changed.assessment_fingerprint = recomputedFingerprint;
  const recomputedValidation = validateCriterionAssessmentV01(changed);
  assert.equal(
    recomputedValidation.status,
    "valid",
    JSON.stringify(recomputedValidation),
  );
}

function clone<T>(value: T): T {
  return structuredClone(value);
}
