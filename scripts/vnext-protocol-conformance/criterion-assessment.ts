import assert from "node:assert/strict";

import {
  genericCliDirectObservationInputFixture,
  mixedProvenanceInputFixture,
} from "@/fixtures/vnext/protocol/run-receipt-v0-1";
import { genericCliBuilderInputFixture } from "@/fixtures/vnext/protocol/task-context-packet-v0-1";
import {
  canonicalizeCriterionAssessmentValueV01,
  createCriterionAssessmentFingerprintV01,
  deriveCriterionAssessmentIdV01,
  evaluateCriterionAssessmentV01,
  validateCriterionAssessmentV01,
  CriterionAssessmentErrorV01,
} from "@/lib/vnext/criterion-assessment";
import {
  buildRunReceiptV01,
  validateRunReceiptV01,
  type RunReceiptBuilderInputV01,
} from "@/lib/vnext/run-receipt";
import {
  buildTaskContextPacketV01,
  type TaskContextPacketBuilderInputV01,
} from "@/lib/vnext/task-context-packet";
import type { ExternalRefV01 } from "@/types/vnext/external-ref";
import type {
  CriterionAssessmentStatusV01,
  CriterionAssessmentV01,
} from "@/types/vnext/criterion-assessment";

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
  explicit_relation_gap: "task_context_packet_and_run_receipt_v0_1_have_no_criterion_relation";
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
    "unknown status may retain an observed basis when future explicit residue is incomplete or conflicting",
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
    explicit_relation_gap:
      "task_context_packet_and_run_receipt_v0_1_have_no_criterion_relation",
  };
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
