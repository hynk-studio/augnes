import {
  canonicalizeProtocolValueV01,
  compareProtocolCanonicalV01,
  compareProtocolCodeUnitsV01,
  createProtocolSha256V01,
  isProtocolRecordV01,
  normalizeExternalRefPrimitiveV01,
  normalizeProtocolTextV01,
  protocolStringValueV01,
  rejectUnknownProtocolKeysV01,
  uniqueProtocolStringsV01,
  validateDuplicateExternalRefsPrimitiveV01,
  validateExternalRefStructureV01,
  type ProtocolValidationIssueSinkV01,
} from "@/lib/vnext/protocol-primitives";
import { deriveCriterionIdentityV01 } from "@/lib/vnext/criterion-identity";
import { validateRunReceiptV01 } from "@/lib/vnext/run-receipt";
import { validateTaskContextPacketV01 } from "@/lib/vnext/task-context-packet";
import {
  CRITERION_ASSESSMENT_BASES_V01,
  CRITERION_ASSESSMENT_STATUSES_V01,
  CRITERION_ASSESSMENT_VERSION_V01,
  type CriterionAssessmentBasisV01,
  type CriterionAssessmentAuthorityV01,
  type CriterionAssessmentItemV01,
  type CriterionAssessmentStatusV01,
  type CriterionAssessmentSummaryV01,
  type CriterionAssessmentTrustV01,
  type CriterionAssessmentV01,
  type CriterionAssessmentValidationIssueV01,
  type CriterionAssessmentValidationResultV01,
} from "@/types/vnext/criterion-assessment";
import type { ExternalRefV01 } from "@/types/vnext/external-ref";
import {
  CRITERION_VERIFICATION_EVALUATOR_VERSION_V01,
  type CriterionVerificationConclusiveTrustClassV01,
  type CriterionVerificationExactCheckObligationV01,
  type CriterionVerificationPlanEntryV01,
} from "@/types/vnext/criterion-verification-plan";
import type {
  RunReceiptCapabilityCoverageEntryV01,
  RunReceiptCheckResultV01,
  RunReceiptSkippedCheckV01,
  RunReceiptV01,
} from "@/types/vnext/run-receipt";
import type { TaskContextPacketV01 } from "@/types/vnext/task-context-packet";

const RUN_RECEIPT_REF_NAMESPACE_V01 = "augnes.vnext.run-receipt.v0.1";
const CRITERION_RELATION_REF_NAMESPACE_V01 =
  CRITERION_VERIFICATION_EVALUATOR_VERSION_V01;
const CRITERION_RELATION_REF_TYPES_V01 = new Set([
  "criterion_check_support",
  "criterion_check_opposition",
  "criterion_check_missing",
  "criterion_applicability",
]);
const SHA256_PATTERN_V01 = /^sha256:[a-f0-9]{64}$/u;

const assessmentStatuses = new Set<string>(
  CRITERION_ASSESSMENT_STATUSES_V01,
);
const assessmentBases = new Set<string>(CRITERION_ASSESSMENT_BASES_V01);
const allowedAssessmentKeys = new Set([
  "assessment_version",
  "workspace_id",
  "project_id",
  "packet_ref",
  "receipt_ref",
  "run_id",
  "criteria",
  "summary",
  "assessment_fingerprint",
  "authority",
]);
const allowedAssessmentItemKeys = new Set([
  "criterion_id",
  "criterion",
  "status",
  "basis",
  "supporting_refs",
  "opposing_refs",
  "missing_refs",
  "trust",
  "operation_coverage",
  "uncertainty",
]);
const allowedTrustKeys = new Set([
  "direct_local_observation",
  "verified_external_observation",
  "host_attestation",
  "provider_report",
  "user_declaration",
  "imported_unverified",
  "derived_interpretation",
]);
const allowedCoverageKeys = new Set([
  "capability",
  "coverage_level",
  "source_ref",
  "notes",
]);
const allowedSummaryKeys = new Set([
  "satisfied",
  "unsatisfied",
  "unknown",
  "not_applicable",
]);
const allowedAuthorityKeys = new Set([
  "authoritative",
  "creates_evidence",
  "validates_claims",
  "creates_proposal",
  "creates_decision",
  "applies_transition",
  "changes_semantic_state",
  "changes_later_context",
]);

export class CriterionAssessmentErrorV01 extends Error {
  constructor(readonly code: string) {
    super(code);
    this.name = "CriterionAssessmentErrorV01";
  }
}

/**
 * Pure, deterministic criterion evaluator for one validated packet/receipt
 * pair. Historical packets without a typed plan retain the original
 * unknown/insufficient projection byte-for-byte. Planned criteria consume only
 * exact structured check residue admitted by the server-owned packet profile.
 */
export function evaluateCriterionAssessmentV01(input: {
  packet: TaskContextPacketV01;
  receipt: RunReceiptV01;
}): CriterionAssessmentV01 {
  assertAssessmentInputBindingV01(input);

  const packetRef = assessmentExternalRefV01(
    input.receipt.task_context_packet_ref!,
  );
  const receiptRef = assessmentExternalRefV01({
    ref_version: "external_ref.v0.1",
    ref_type: "run_receipt",
    external_id: input.receipt.receipt_id,
    trust_class: "direct_local_observation",
    source_ref: input.receipt.integrity.fingerprint,
    compatibility_namespace: RUN_RECEIPT_REF_NAMESPACE_V01,
  });
  const trust = projectReceiptTrustV01(input.receipt);
  const operationCoverage = projectOperationCoverageV01(input.receipt);
  const uncertainty = taskWideUncertaintyV01(input.receipt);
  const unplannedCriterionUncertainty = input.packet.criterion_verification_plan
    ? criterionScopedUnplannedUncertaintyV01(input.receipt)
    : uncertainty;
  const planEntries = new Map(
    (input.packet.criterion_verification_plan?.criteria ?? []).map((entry) => [
      entry.criterion_id,
      entry,
    ]),
  );
  const criteriaById = new Map<string, CriterionAssessmentItemV01>();

  for (const rawCriterion of input.packet.task.success_criteria) {
    const criterion = normalizeProtocolTextV01(rawCriterion);
    const criterionId = deriveCriterionAssessmentIdV01(criterion);
    if (criteriaById.has(criterionId)) {
      throw new CriterionAssessmentErrorV01(
        "criterion_assessment_criterion_identity_conflict",
      );
    }
    const planEntry = planEntries.get(criterionId);
    criteriaById.set(
      criterionId,
      planEntry
        ? evaluatePlannedCriterionV01({
            packet: input.packet,
            receipt: input.receipt,
            entry: planEntry,
            operation_coverage: operationCoverage,
          })
        : {
            criterion_id: criterionId,
            criterion,
            status: "unknown",
            basis: "insufficient",
            supporting_refs: [],
            opposing_refs: [],
            missing_refs: [],
            trust: { ...trust },
            operation_coverage: cloneOperationCoverageV01(operationCoverage),
            uncertainty: [...unplannedCriterionUncertainty],
          },
    );
  }

  const criteria = [...criteriaById.values()].sort((left, right) =>
    compareProtocolCodeUnitsV01(left.criterion_id, right.criterion_id),
  );
  const withoutFingerprint = {
    assessment_version: CRITERION_ASSESSMENT_VERSION_V01,
    workspace_id: input.packet.workspace_id,
    project_id: input.packet.project_id,
    packet_ref: packetRef,
    receipt_ref: receiptRef,
    run_id: input.receipt.run_id,
    criteria,
    summary: summarizeCriteriaV01(criteria),
    authority: criterionAssessmentAuthorityV01(),
  };
  const assessment: CriterionAssessmentV01 = {
    ...withoutFingerprint,
    assessment_fingerprint:
      createCriterionAssessmentFingerprintV01(withoutFingerprint),
  };
  const validation = validateCriterionAssessmentV01(assessment);
  if (validation.status !== "valid") {
    throw new CriterionAssessmentErrorV01(
      `criterion_assessment_output_invalid:${validation.errors
        .map((issue) => issue.code)
        .join(",")}`,
    );
  }
  return assessment;
}

export function deriveCriterionAssessmentIdV01(criterion: string): string {
  try {
    return deriveCriterionIdentityV01(criterion);
  } catch {
    throw new CriterionAssessmentErrorV01(
      "criterion_assessment_criterion_empty",
    );
  }
}

export function canonicalizeCriterionAssessmentValueV01(
  value: unknown,
): string {
  return canonicalizeProtocolValueV01(value);
}

export function createCriterionAssessmentFingerprintV01(
  assessment:
    | CriterionAssessmentV01
    | Omit<CriterionAssessmentV01, "assessment_fingerprint">,
): string {
  return createProtocolSha256V01(
    canonicalizeProtocolValueV01(
      criterionAssessmentFingerprintMaterialV01(assessment),
    ),
  );
}

export function isExactCriterionRelationRefV01(
  value: unknown,
): value is ExternalRefV01 {
  if (!isProtocolRecordV01(value)) return false;
  const refType = protocolStringValueV01(value.ref_type);
  return (
    value.ref_version === "external_ref.v0.1" &&
    value.compatibility_namespace === CRITERION_RELATION_REF_NAMESPACE_V01 &&
    Boolean(refType && CRITERION_RELATION_REF_TYPES_V01.has(refType))
  );
}

export function validateCriterionAssessmentV01(
  input: unknown,
): CriterionAssessmentValidationResultV01 {
  const accumulator: ValidationAccumulatorV01 = {
    errors: [],
    warnings: [],
    blocked: false,
  };
  const sink = validationSinkV01(accumulator);
  if (!isProtocolRecordV01(input)) {
    sink.error(
      "criterion_assessment_malformed",
      "$",
      "Criterion assessment must be an object.",
    );
    return validationResultV01(accumulator, null);
  }
  rejectUnknownProtocolKeysV01(
    input,
    allowedAssessmentKeys,
    "$",
    sink,
    "criterion_assessment_unknown_field",
    true,
  );
  const version =
    input.assessment_version === CRITERION_ASSESSMENT_VERSION_V01
      ? CRITERION_ASSESSMENT_VERSION_V01
      : null;
  if (!version) {
    sink.error(
      "criterion_assessment_version_unsupported",
      "$.assessment_version",
      "Criterion assessment uses an unsupported version.",
      true,
    );
  }
  for (const [field, path] of [
    ["workspace_id", "$.workspace_id"],
    ["project_id", "$.project_id"],
    ["run_id", "$.run_id"],
  ] as const) {
    if (!protocolStringValueV01(input[field])) {
      sink.error(
        "criterion_assessment_identity_missing",
        path,
        `${field} must be a non-empty string.`,
      );
    }
  }
  validateAssessmentSourceRefV01(
    input.packet_ref,
    "$.packet_ref",
    "task_context_packet",
    sink,
  );
  validateAssessmentSourceRefV01(
    input.receipt_ref,
    "$.receipt_ref",
    "run_receipt",
    sink,
  );

  const criteria = Array.isArray(input.criteria) ? input.criteria : [];
  if (!Array.isArray(input.criteria)) {
    sink.error(
      "criterion_assessment_criteria_malformed",
      "$.criteria",
      "criteria must be an array.",
    );
  }
  const criterionIds = new Set<string>();
  const counts: CriterionAssessmentSummaryV01 = {
    satisfied: 0,
    unsatisfied: 0,
    unknown: 0,
    not_applicable: 0,
  };
  criteria.forEach((value, index) => {
    const path = `$.criteria[${index}]`;
    if (!isProtocolRecordV01(value)) {
      sink.error(
        "criterion_assessment_item_malformed",
        path,
        "Criterion assessment item must be an object.",
      );
      return;
    }
    rejectUnknownProtocolKeysV01(
      value,
      allowedAssessmentItemKeys,
      path,
      sink,
      "criterion_assessment_unknown_item_field",
      true,
    );
    const criterion = protocolStringValueV01(value.criterion);
    const criterionId = protocolStringValueV01(value.criterion_id);
    if (!criterion || !criterionId) {
      sink.error(
        "criterion_assessment_item_identity_missing",
        path,
        "criterion and criterion_id are required.",
      );
    } else {
      try {
        if (deriveCriterionAssessmentIdV01(criterion) !== criterionId) {
          sink.error(
            "criterion_assessment_item_identity_invalid",
            `${path}.criterion_id`,
            "criterion_id must be derived from normalized criterion content.",
            true,
          );
        }
      } catch {
        sink.error(
          "criterion_assessment_item_identity_invalid",
          `${path}.criterion_id`,
          "criterion_id could not be derived.",
          true,
        );
      }
      if (criterionIds.has(criterionId)) {
        sink.error(
          "criterion_assessment_item_duplicate",
          `${path}.criterion_id`,
          "Each criterion identity may appear only once.",
          true,
        );
      }
      criterionIds.add(criterionId);
    }
    const status = protocolStringValueV01(value.status);
    if (!status || !assessmentStatuses.has(status)) {
      sink.error(
        "criterion_assessment_status_invalid",
        `${path}.status`,
        "Criterion status is not recognized.",
      );
    } else {
      counts[status as keyof CriterionAssessmentSummaryV01] += 1;
    }
    const basis = protocolStringValueV01(value.basis);
    if (!basis || !assessmentBases.has(basis)) {
      sink.error(
        "criterion_assessment_basis_invalid",
        `${path}.basis`,
        "Criterion basis is not recognized.",
      );
    }
    if (
      basis === "insufficient" &&
      status &&
      assessmentStatuses.has(status) &&
      status !== "unknown"
    ) {
      sink.error(
        "criterion_assessment_status_basis_conflict",
        `${path}.status`,
        "An insufficient assessment basis requires unknown criterion status.",
        true,
      );
    }
    for (const field of [
      "supporting_refs",
      "opposing_refs",
      "missing_refs",
    ] as const) {
      validateRefArrayV01(value[field], `${path}.${field}`, sink);
    }
    validateTrustV01(value.trust, `${path}.trust`, sink);
    validateRelationAwareAssessmentItemV01(value, path, sink, {
      packet_ref: input.packet_ref,
      receipt_ref: input.receipt_ref,
    });
    validateCoverageV01(
      value.operation_coverage,
      `${path}.operation_coverage`,
      sink,
    );
    validateStringArrayV01(value.uncertainty, `${path}.uncertainty`, sink);
  });

  if (isProtocolRecordV01(input.summary)) {
    rejectUnknownProtocolKeysV01(
      input.summary,
      allowedSummaryKeys,
      "$.summary",
      sink,
      "criterion_assessment_unknown_summary_field",
      true,
    );
  }
  if (!summaryMatchesV01(input.summary, counts)) {
    sink.error(
      "criterion_assessment_summary_mismatch",
      "$.summary",
      "Assessment summary must equal the criterion status counts.",
      true,
    );
  }
  validateAuthorityV01(input.authority, sink);
  validateDuplicateExternalRefsPrimitiveV01(input, sink);
  const fingerprint = protocolStringValueV01(input.assessment_fingerprint);
  if (!fingerprint || !SHA256_PATTERN_V01.test(fingerprint)) {
    sink.error(
      "criterion_assessment_fingerprint_invalid",
      "$.assessment_fingerprint",
      "Assessment fingerprint must be a canonical sha256 value.",
    );
  } else if (
    accumulator.errors.length === 0 &&
    createCriterionAssessmentFingerprintV01(
      input as unknown as CriterionAssessmentV01,
    ) !== fingerprint
  ) {
    sink.error(
      "criterion_assessment_fingerprint_mismatch",
      "$.assessment_fingerprint",
      "Assessment fingerprint does not match normalized assessment content.",
      true,
    );
  }
  return validationResultV01(accumulator, version);
}

type CriterionRelationKindV01 = "support" | "opposition" | "missing";

type CriterionObligationResolutionV01 = {
  relation: CriterionRelationKindV01;
  basis: Exclude<CriterionAssessmentBasisV01, "insufficient"> | null;
  refs: ExternalRefV01[];
  uncertainty: string[];
};

function evaluatePlannedCriterionV01(input: {
  packet: TaskContextPacketV01;
  receipt: RunReceiptV01;
  entry: CriterionVerificationPlanEntryV01;
  operation_coverage: RunReceiptCapabilityCoverageEntryV01[];
}): CriterionAssessmentItemV01 {
  const { packet, receipt, entry } = input;
  if (entry.applicability.value === "not_applicable") {
    const applicabilityRef = criterionApplicabilityRefV01({
      packet,
      receipt,
      entry,
    });
    return {
      criterion_id: entry.criterion_id,
      criterion: entry.criterion,
      status: "not_applicable",
      basis: "observed",
      supporting_refs: [applicabilityRef],
      opposing_refs: [],
      missing_refs: [],
      trust: trustForRelationRefsV01([applicabilityRef]),
      operation_coverage: cloneOperationCoverageV01(input.operation_coverage),
      uncertainty: [
        "Applicability is false only because the validated server-owned plan contains the explicit constant not_applicable rule; no prose or model inference was used.",
        "CriterionAssessment remains derived execution readback and creates no Evidence, decision, Transition, or semantic-state change.",
      ],
    };
  }

  const resolutions = entry.obligations.map((obligation) =>
    resolveCriterionObligationV01({ packet, receipt, entry, obligation }),
  );
  const supportingRefs = relationRefsV01(resolutions, "support");
  const opposingRefs = relationRefsV01(resolutions, "opposition");
  const missingRefs = relationRefsV01(resolutions, "missing");
  const supportPresent = supportingRefs.length > 0;
  const oppositionPresent = opposingRefs.length > 0;
  const missingPresent = missingRefs.length > 0;
  let status: CriterionAssessmentStatusV01;
  let basis: CriterionAssessmentBasisV01;
  const uncertainty = uniqueProtocolStringsV01([
    ...resolutions.flatMap((resolution) => resolution.uncertainty),
    "CriterionAssessment relation refs are deterministic bindings to immutable receipt residue; they are not accepted Evidence or task acceptance.",
  ]);

  if (missingPresent) {
    status = "unknown";
    basis = "insufficient";
    uncertainty.push(
      "At least one exact required obligation is missing, skipped, blocked, unknown, under-covered, or below the declared basis/trust boundary.",
    );
  } else if (supportPresent && oppositionPresent) {
    status = "unknown";
    basis = "insufficient";
    uncertainty.push(
      "Exact supporting and opposing obligation residue coexist; the fixed conflict policy preserves both and returns unknown.",
    );
  } else if (oppositionPresent) {
    status = "unsatisfied";
    basis = conclusiveBasisV01(resolutions);
    uncertainty.push(
      "At least one exact required obligation failed under the fixed unsatisfied policy; no completion or prose inference was used.",
    );
  } else if (
    supportPresent &&
    resolutions.every((resolution) => resolution.relation === "support")
  ) {
    status = "satisfied";
    basis = conclusiveBasisV01(resolutions);
    uncertainty.push(
      "Every exact required obligation passed under aggregation=all and the declared basis/trust boundary.",
    );
  } else {
    status = "unknown";
    basis = "insufficient";
    uncertainty.push(
      "No complete conclusive exact-check relation set was available.",
    );
  }
  const allRefs = [...supportingRefs, ...opposingRefs, ...missingRefs];
  return {
    criterion_id: entry.criterion_id,
    criterion: entry.criterion,
    status,
    basis,
    supporting_refs: supportingRefs,
    opposing_refs: opposingRefs,
    missing_refs: missingRefs,
    trust: trustForRelationRefsV01(allRefs),
    operation_coverage: cloneOperationCoverageV01(input.operation_coverage),
    uncertainty: uniqueProtocolStringsV01(uncertainty),
  };
}

function resolveCriterionObligationV01(input: {
  packet: TaskContextPacketV01;
  receipt: RunReceiptV01;
  entry: CriterionVerificationPlanEntryV01;
  obligation: CriterionVerificationExactCheckObligationV01;
}): CriterionObligationResolutionV01 {
  const { packet, receipt, entry, obligation } = input;
  const check = receipt.checks.find(
    (candidate) => candidate.check_id === obligation.check_id,
  );
  const skipped = receipt.skipped_checks.find(
    (candidate) => candidate.check_id === obligation.check_id,
  );
  const receiptAdmitsCheck = receipt.verification.required_check_ids.includes(
    obligation.check_id,
  );
  if (check) {
    if (!check.required || !receiptAdmitsCheck) {
      return missingObligationResolutionV01({
        packet,
        receipt,
        entry,
        obligation,
        residue_kind: "check",
        residue: check,
        reason: `Exact check ${obligation.check_id} was not admitted as required receipt verification residue.`,
      });
    }
    if (check.status === "blocked" || check.status === "unknown") {
      return missingObligationResolutionV01({
        packet,
        receipt,
        entry,
        obligation,
        residue_kind: "check",
        residue: check,
        reason: `Exact check ${obligation.check_id} is ${check.status}; blocked or unknown checks are not conclusive opposition.`,
      });
    }
    const conclusiveBasis = conclusiveCheckBasisV01({
      receipt,
      entry,
      check,
    });
    if (!conclusiveBasis) {
      return missingObligationResolutionV01({
        packet,
        receipt,
        entry,
        obligation,
        residue_kind: "check",
        residue: check,
        reason: `Exact check ${obligation.check_id} did not meet the declared server-owned basis and trust boundary.`,
      });
    }
    const relation = check.status === "passed" ? "support" : "opposition";
    return {
      relation,
      basis: conclusiveBasis,
      refs: criterionCheckRelationRefsV01({
        packet,
        receipt,
        entry,
        obligation,
        relation,
        residue_kind: "check",
        residue: check,
      }),
      uncertainty: [
        `Exact check ${obligation.check_id} ${check.status}; it is bound only through obligation ${obligation.obligation_id}.`,
      ],
    };
  }
  if (skipped) {
    return missingObligationResolutionV01({
      packet,
      receipt,
      entry,
      obligation,
      residue_kind: "skipped_check",
      residue: skipped,
      reason: `Exact check ${obligation.check_id} was skipped: ${skipped.reason}`,
    });
  }
  return missingObligationResolutionV01({
    packet,
    receipt,
    entry,
    obligation,
    residue_kind: "absent_check",
    residue: null,
    reason: `Exact check ${obligation.check_id} is absent from receipt checks and skipped checks.`,
  });
}

function missingObligationResolutionV01(input: {
  packet: TaskContextPacketV01;
  receipt: RunReceiptV01;
  entry: CriterionVerificationPlanEntryV01;
  obligation: CriterionVerificationExactCheckObligationV01;
  residue_kind: "check" | "skipped_check" | "absent_check";
  residue: RunReceiptCheckResultV01 | RunReceiptSkippedCheckV01 | null;
  reason: string;
}): CriterionObligationResolutionV01 {
  return {
    relation: "missing",
    basis: null,
    refs: criterionCheckRelationRefsV01({
      ...input,
      relation: "missing",
    }),
    uncertainty: [input.reason],
  };
}

function conclusiveCheckBasisV01(input: {
  receipt: RunReceiptV01;
  entry: CriterionVerificationPlanEntryV01;
  check: RunReceiptCheckResultV01;
}): Exclude<CriterionAssessmentBasisV01, "insufficient"> | null {
  const { receipt, entry, check } = input;
  if (check.source_refs.length === 0 || check.basis === "unknown") return null;
  const admittedTrust = new Set<string>(entry.admitted_trust_classes);
  const observedRefs = new Set(
    receipt.verifier_refs
      .filter(
        (ref) =>
          (ref.trust_class === "direct_local_observation" ||
            ref.trust_class === "verified_external_observation") &&
          admittedTrust.has(ref.trust_class) &&
          receipt.observations.some(
            (observation) =>
              observation.related_check_ids.includes(check.check_id) &&
              (canonicalExternalRefV01(observation.observer_ref) ===
                canonicalExternalRefV01(ref) ||
                observation.source_refs.some(
                  (sourceRef) =>
                    canonicalExternalRefV01(sourceRef) ===
                    canonicalExternalRefV01(ref),
                )),
          ),
      )
      .map(canonicalExternalRefV01),
  );
  const hostAttestationRefs = new Set(
    receipt.attestations
      .filter(
        (attestation) =>
          attestation.trust_class === "host_attestation" &&
          attestation.reporter_ref.trust_class === "host_attestation" &&
          admittedTrust.has("host_attestation"),
      )
      .map((attestation) => canonicalExternalRefV01(attestation.reporter_ref)),
  );
  let observed = 0;
  let attested = 0;
  for (const sourceRef of check.source_refs) {
    const canonical = canonicalExternalRefV01(sourceRef);
    if (observedRefs.has(canonical)) observed += 1;
    else if (hostAttestationRefs.has(canonical)) attested += 1;
    else return null;
  }
  const actualBasis =
    observed > 0 && attested > 0
      ? ("mixed" as const)
      : observed > 0
        ? ("observed" as const)
        : attested > 0
          ? ("attested" as const)
          : null;
  if (!actualBasis || actualBasis !== check.basis) return null;
  if (entry.required_basis === "observed" && actualBasis !== "observed") {
    return null;
  }
  if (entry.required_basis === "attested" && actualBasis !== "attested") {
    return null;
  }
  return actualBasis;
}

function criterionCheckRelationRefsV01(input: {
  packet: TaskContextPacketV01;
  receipt: RunReceiptV01;
  entry: CriterionVerificationPlanEntryV01;
  obligation: CriterionVerificationExactCheckObligationV01;
  relation: CriterionRelationKindV01;
  residue_kind: "check" | "skipped_check" | "absent_check";
  residue: RunReceiptCheckResultV01 | RunReceiptSkippedCheckV01 | null;
}): ExternalRefV01[] {
  const sources = input.residue?.source_refs.length
    ? [
        ...new Map(
          input.residue.source_refs.map((ref) => [ref.trust_class, ref]),
        ).values(),
      ].sort(compareProtocolCanonicalV01)
    : [null];
  const residueStatus = input.residue
    ? "status" in input.residue
      ? input.residue.status
      : "skipped"
    : "absent";
  return sources
    .map((sourceRef) => {
      const material = {
        evaluator_version: CRITERION_RELATION_REF_NAMESPACE_V01,
        packet_id: input.packet.packet_id,
        packet_fingerprint: input.packet.integrity.fingerprint,
        plan_version:
          input.packet.criterion_verification_plan?.plan_version ?? null,
        profile_version:
          input.packet.criterion_verification_plan?.profile_version ?? null,
        workspace_id: input.packet.workspace_id,
        project_id: input.packet.project_id,
        criterion_id: input.entry.criterion_id,
        criterion: input.entry.criterion,
        receipt_id: input.receipt.receipt_id,
        receipt_fingerprint: input.receipt.integrity.fingerprint,
        run_id: input.receipt.run_id,
        obligation: input.obligation,
        relation: input.relation,
        residue_kind: input.residue_kind,
        residue: input.residue,
        residue_status: residueStatus,
        source_ref: sourceRef,
      };
      const relationFingerprint = createProtocolSha256V01(
        canonicalizeProtocolValueV01(material),
      );
      return assessmentExternalRefV01({
        ref_version: "external_ref.v0.1",
        ref_type:
          input.relation === "support"
            ? "criterion_check_support"
            : input.relation === "opposition"
              ? "criterion_check_opposition"
              : "criterion_check_missing",
        external_id: [
          "criterion-relation",
          input.relation,
          input.receipt.receipt_id,
          input.entry.criterion_id,
          input.obligation.obligation_id,
          input.obligation.check_id,
          residueStatus,
          input.residue?.basis ?? "insufficient",
          relationFingerprint.slice("sha256:".length, 31),
        ].join(":"),
        observed_at: input.receipt.recorded_at,
        source_ref: input.receipt.integrity.fingerprint,
        compatibility_namespace: CRITERION_RELATION_REF_NAMESPACE_V01,
        trust_class: sourceRef?.trust_class ?? "derived_interpretation",
      });
    })
    .sort(compareProtocolCanonicalV01);
}

function criterionApplicabilityRefV01(input: {
  packet: TaskContextPacketV01;
  receipt: RunReceiptV01;
  entry: CriterionVerificationPlanEntryV01;
}): ExternalRefV01 {
  const fingerprint = createProtocolSha256V01(
    canonicalizeProtocolValueV01({
      evaluator_version: CRITERION_RELATION_REF_NAMESPACE_V01,
      packet_id: input.packet.packet_id,
      packet_fingerprint: input.packet.integrity.fingerprint,
      workspace_id: input.packet.workspace_id,
      project_id: input.packet.project_id,
      criterion_id: input.entry.criterion_id,
      criterion: input.entry.criterion,
      applicability: input.entry.applicability,
      plan_version:
        input.packet.criterion_verification_plan?.plan_version ?? null,
      profile_version:
        input.packet.criterion_verification_plan?.profile_version ?? null,
    }),
  );
  return assessmentExternalRefV01({
    ref_version: "external_ref.v0.1",
    ref_type: "criterion_applicability",
    external_id: `criterion-applicability:${input.packet.packet_id}:${input.entry.criterion_id}:${fingerprint.slice("sha256:".length, 31)}`,
    observed_at: input.packet.generated_at,
    source_ref: input.packet.integrity.fingerprint,
    compatibility_namespace: CRITERION_RELATION_REF_NAMESPACE_V01,
    trust_class: "direct_local_observation",
  });
}

function relationRefsV01(
  resolutions: CriterionObligationResolutionV01[],
  relation: CriterionRelationKindV01,
): ExternalRefV01[] {
  return resolutions
    .filter((resolution) => resolution.relation === relation)
    .flatMap((resolution) => resolution.refs)
    .sort(compareProtocolCanonicalV01);
}

function conclusiveBasisV01(
  resolutions: CriterionObligationResolutionV01[],
): Exclude<CriterionAssessmentBasisV01, "insufficient"> {
  const bases = new Set(
    resolutions
      .map((resolution) => resolution.basis)
      .filter(
        (
          basis,
        ): basis is Exclude<CriterionAssessmentBasisV01, "insufficient"> =>
          basis !== null,
      ),
  );
  if (bases.size === 1 && bases.has("observed")) return "observed";
  if (bases.size === 1 && bases.has("attested")) return "attested";
  return "mixed";
}

function trustForRelationRefsV01(
  refs: ExternalRefV01[],
): CriterionAssessmentTrustV01 {
  const trust: CriterionAssessmentTrustV01 = {
    direct_local_observation: 0,
    verified_external_observation: 0,
    host_attestation: 0,
    provider_report: 0,
    user_declaration: 0,
    imported_unverified: 0,
    derived_interpretation: 0,
  };
  for (const ref of refs) {
    if (Object.hasOwn(trust, ref.trust_class)) {
      trust[ref.trust_class] += 1;
    }
  }
  return trust;
}

function cloneOperationCoverageV01(
  coverage: RunReceiptCapabilityCoverageEntryV01[],
): RunReceiptCapabilityCoverageEntryV01[] {
  return coverage.map((entry) => ({
    ...entry,
    source_ref: entry.source_ref ? { ...entry.source_ref } : null,
    notes: [...entry.notes],
  }));
}

function canonicalExternalRefV01(ref: ExternalRefV01): string {
  return canonicalizeProtocolValueV01(normalizeExternalRefPrimitiveV01(ref));
}

function assertAssessmentInputBindingV01(input: {
  packet: TaskContextPacketV01;
  receipt: RunReceiptV01;
}): void {
  if (
    validateTaskContextPacketV01(input.packet, {
      evaluated_at: input.packet.generated_at,
    }).status !== "valid"
  ) {
    throw new CriterionAssessmentErrorV01(
      "criterion_assessment_packet_invalid",
    );
  }
  if (validateRunReceiptV01(input.receipt).status !== "valid") {
    throw new CriterionAssessmentErrorV01(
      "criterion_assessment_receipt_invalid",
    );
  }
  if (input.packet.workspace_id !== input.receipt.workspace_id) {
    throw new CriterionAssessmentErrorV01(
      "criterion_assessment_workspace_mismatch",
    );
  }
  if (input.packet.project_id !== input.receipt.project_id) {
    throw new CriterionAssessmentErrorV01(
      "criterion_assessment_project_mismatch",
    );
  }
  const packetRef = input.receipt.task_context_packet_ref;
  if (
    !packetRef ||
    packetRef.ref_type !== "task_context_packet" ||
    !packetRef.source_ref
  ) {
    throw new CriterionAssessmentErrorV01(
      "criterion_assessment_packet_ref_missing",
    );
  }
  if (packetRef.external_id !== input.packet.packet_id) {
    throw new CriterionAssessmentErrorV01(
      "criterion_assessment_packet_id_mismatch",
    );
  }
  if (packetRef.source_ref !== input.packet.integrity.fingerprint) {
    throw new CriterionAssessmentErrorV01(
      "criterion_assessment_packet_fingerprint_mismatch",
    );
  }
}

function taskWideUncertaintyV01(receipt: RunReceiptV01): string[] {
  return uniqueProtocolStringsV01([
    "No explicit protocol-owned criterion-to-residue relation is available; receipt residue was not assigned as criterion supporting, opposing, or missing refs.",
    ...(receipt.execution.status === "completed"
      ? [
          "Host execution completed, but execution completion does not establish task success.",
        ]
      : []),
    ...(receipt.checks.some(
      (check) =>
        check.status === "passed" &&
        [
          "deterministic_packet_delivery",
          "validated_packet_delivery",
        ].includes(check.check_id),
    )
      ? [
          "Passed packet-delivery checks establish transport binding only and do not satisfy task criteria.",
        ]
      : []),
    ...(receipt.checks.length > 0
      ? [
          "Receipt checks have no explicit criterion relation and were not promoted to task-success support.",
        ]
      : []),
    ...(receipt.changed_artifacts.length > 0
      ? [
          "Changed artifacts have no explicit criterion relation and were not promoted to task-success support.",
        ]
      : []),
    ...receipt.skipped_checks.map(
      (check) => `Check ${check.check_id} was skipped: ${check.reason}`,
    ),
    ...receipt.capability_coverage
      .filter((entry) => entry.coverage_level === "outside_coverage")
      .map(
        (entry) =>
          `Capability ${entry.capability} is unavailable because it is outside receipt coverage.`,
      ),
    ...receipt.gaps.map((gap) => `Receipt gap ${gap.code}: ${gap.summary}`),
    ...receipt.warnings.map(
      (warning) => `Receipt uncertainty ${warning.code}: ${warning.summary}`,
    ),
    ...(Object.values(receipt.trust_summary).some((count) => count > 0)
      ? [
          "Trust counts describe available receipt residue classes, not criterion-level support.",
        ]
      : []),
  ]);
}

function criterionScopedUnplannedUncertaintyV01(
  receipt: RunReceiptV01,
): string[] {
  return uniqueProtocolStringsV01(
    taskWideUncertaintyV01(receipt).map((value) => {
      switch (value) {
        case "No explicit protocol-owned criterion-to-residue relation is available; receipt residue was not assigned as criterion supporting, opposing, or missing refs.":
          return "No typed server-owned verification plan binds this criterion; it remains unknown / insufficient.";
        case "Receipt checks have no explicit criterion relation and were not promoted to task-success support.":
          return "Receipt checks were not promoted to supporting, opposing, or missing refs for this unplanned criterion.";
        case "Changed artifacts have no explicit criterion relation and were not promoted to task-success support.":
          return "Changed artifacts were not promoted to supporting, opposing, or missing refs for this unplanned criterion.";
        case "Trust counts describe available receipt residue classes, not criterion-level support.":
          return "Trust counts describe task-wide receipt residue classes for this unplanned criterion, not criterion-level relation support.";
        default:
          return value;
      }
    }),
  );
}

function projectReceiptTrustV01(
  receipt: RunReceiptV01,
): CriterionAssessmentTrustV01 {
  return {
    direct_local_observation: receipt.trust_summary.direct_observations,
    verified_external_observation:
      receipt.trust_summary.verified_external_observations,
    host_attestation: receipt.trust_summary.host_attestations,
    provider_report: receipt.trust_summary.provider_reports,
    user_declaration: receipt.trust_summary.user_declarations,
    imported_unverified: receipt.trust_summary.imported_unverified_items,
    derived_interpretation: receipt.trust_summary.derived_interpretations,
  };
}

function projectOperationCoverageV01(
  receipt: RunReceiptV01,
): RunReceiptCapabilityCoverageEntryV01[] {
  const byCapability = new Map<
    string,
    RunReceiptCapabilityCoverageEntryV01
  >();
  for (const entry of receipt.capability_coverage) {
    const capability = normalizeProtocolTextV01(entry.capability);
    const normalized: RunReceiptCapabilityCoverageEntryV01 = {
      capability,
      coverage_level: entry.coverage_level,
      source_ref: entry.source_ref
        ? assessmentExternalRefV01(entry.source_ref)
        : null,
      notes: uniqueProtocolStringsV01(entry.notes),
    };
    const prior = byCapability.get(capability);
    if (
      prior &&
      canonicalizeProtocolValueV01(prior) !==
        canonicalizeProtocolValueV01(normalized)
    ) {
      throw new CriterionAssessmentErrorV01(
        "criterion_assessment_coverage_conflict",
      );
    }
    byCapability.set(capability, normalized);
  }
  return [...byCapability.values()].sort(compareProtocolCanonicalV01);
}

function assessmentExternalRefV01(ref: ExternalRefV01): ExternalRefV01 {
  return normalizeExternalRefPrimitiveV01(ref);
}

function summarizeCriteriaV01(
  criteria: CriterionAssessmentItemV01[],
): CriterionAssessmentSummaryV01 {
  return {
    satisfied: criteria.filter((item) => item.status === "satisfied").length,
    unsatisfied: criteria.filter((item) => item.status === "unsatisfied").length,
    unknown: criteria.filter((item) => item.status === "unknown").length,
    not_applicable: criteria.filter(
      (item) => item.status === "not_applicable",
    ).length,
  };
}

function criterionAssessmentAuthorityV01(): CriterionAssessmentAuthorityV01 {
  return {
    authoritative: false,
    creates_evidence: false,
    validates_claims: false,
    creates_proposal: false,
    creates_decision: false,
    applies_transition: false,
    changes_semantic_state: false,
    changes_later_context: false,
  };
}

function criterionAssessmentFingerprintMaterialV01(
  assessment:
    | CriterionAssessmentV01
    | Omit<CriterionAssessmentV01, "assessment_fingerprint">,
): Omit<CriterionAssessmentV01, "assessment_fingerprint"> {
  return {
    assessment_version: assessment.assessment_version,
    workspace_id: assessment.workspace_id,
    project_id: assessment.project_id,
    packet_ref: assessment.packet_ref,
    receipt_ref: assessment.receipt_ref,
    run_id: assessment.run_id,
    criteria: assessment.criteria,
    summary: assessment.summary,
    authority: assessment.authority,
  };
}

type ValidationAccumulatorV01 = {
  errors: CriterionAssessmentValidationIssueV01[];
  warnings: CriterionAssessmentValidationIssueV01[];
  blocked: boolean;
};

function validationSinkV01(
  accumulator: ValidationAccumulatorV01,
): ProtocolValidationIssueSinkV01 {
  return {
    error(code, path, message, blocked = false) {
      accumulator.errors.push({ severity: "error", code, path, message });
      if (blocked) accumulator.blocked = true;
    },
    warning(code, path, message) {
      accumulator.warnings.push({
        severity: "warning",
        code,
        path,
        message,
      });
    },
  };
}

function validateAssessmentSourceRefV01(
  value: unknown,
  path: string,
  expectedType: string,
  sink: ProtocolValidationIssueSinkV01,
): void {
  validateExternalRefStructureV01(value, path, sink);
  if (!isProtocolRecordV01(value)) return;
  if (value.ref_type !== expectedType) {
    sink.error(
      "criterion_assessment_source_ref_type_invalid",
      `${path}.ref_type`,
      `Expected ${expectedType} source reference.`,
      true,
    );
  }
  const fingerprint = protocolStringValueV01(value.source_ref);
  if (!fingerprint || !SHA256_PATTERN_V01.test(fingerprint)) {
    sink.error(
      "criterion_assessment_source_fingerprint_invalid",
      `${path}.source_ref`,
      "Source reference requires an exact sha256 fingerprint.",
      true,
    );
  }
}

function validateRefArrayV01(
  value: unknown,
  path: string,
  sink: ProtocolValidationIssueSinkV01,
): void {
  if (!Array.isArray(value)) {
    sink.error(
      "criterion_assessment_ref_array_malformed",
      path,
      "Expected an ExternalRef array.",
    );
    return;
  }
  value.forEach((ref, index) =>
    validateExternalRefStructureV01(ref, `${path}[${index}]`, sink),
  );
}

function validateRelationAwareAssessmentItemV01(
  value: Record<string, unknown>,
  path: string,
  sink: ProtocolValidationIssueSinkV01,
  sourceBinding: {
    packet_ref: unknown;
    receipt_ref: unknown;
  },
): void {
  const fields = [
    "supporting_refs",
    "opposing_refs",
    "missing_refs",
  ] as const;
  const refsByField = Object.fromEntries(
    fields.map((field) => [
      field,
      (Array.isArray(value[field]) ? value[field] : []).filter(
        isProtocolRecordV01,
      ),
    ]),
  ) as Record<(typeof fields)[number], Record<string, unknown>[]>;
  const relationRefs = fields.flatMap((field) =>
    refsByField[field].map((ref, index) => ({ ref, field, index })),
  ).filter(({ ref }) => {
    const namespace = protocolStringValueV01(ref.compatibility_namespace);
    const refType = protocolStringValueV01(ref.ref_type);
    return (
      namespace === CRITERION_RELATION_REF_NAMESPACE_V01 ||
      Boolean(refType && CRITERION_RELATION_REF_TYPES_V01.has(refType))
    );
  });
  const status = protocolStringValueV01(value.status);
  const basis = protocolStringValueV01(value.basis);
  const supportCount = refsByField.supporting_refs.length;
  const oppositionCount = refsByField.opposing_refs.length;
  const missingCount = refsByField.missing_refs.length;
  const criterionId = protocolStringValueV01(value.criterion_id);
  const packetRef = isProtocolRecordV01(sourceBinding.packet_ref)
    ? sourceBinding.packet_ref
    : null;
  const receiptRef = isProtocolRecordV01(sourceBinding.receipt_ref)
    ? sourceBinding.receipt_ref
    : null;
  const packetId = protocolStringValueV01(packetRef?.external_id);
  const packetFingerprint = protocolStringValueV01(packetRef?.source_ref);
  const receiptId = protocolStringValueV01(receiptRef?.external_id);
  const receiptFingerprint = protocolStringValueV01(receiptRef?.source_ref);
  if (relationRefs.length === 0) return;
  if (relationRefs.length !== supportCount + oppositionCount + missingCount) {
    sink.error(
      "criterion_assessment_relation_ref_mixed_profile",
      path,
      "Evaluator-owned relation arrays cannot mix exact SR-1 refs with untyped or candidate relation material.",
      true,
    );
  }

  for (const { ref, field, index } of relationRefs) {
    const refPath = `${path}.${field}[${index}]`;
    const refType = protocolStringValueV01(ref.ref_type);
    if (!isExactCriterionRelationRefV01(ref)) {
      sink.error(
        "criterion_assessment_relation_ref_invalid",
        refPath,
        "Criterion relation refs require the exact evaluator namespace and supported relation type.",
        true,
      );
      continue;
    }
    if (!refType) continue;
    const expectedTypes =
      field === "supporting_refs"
        ? new Set(["criterion_check_support", "criterion_applicability"])
        : field === "opposing_refs"
          ? new Set(["criterion_check_opposition"])
          : new Set(["criterion_check_missing"]);
    if (!expectedTypes.has(refType)) {
      sink.error(
        "criterion_assessment_relation_ref_direction_invalid",
        `${refPath}.ref_type`,
        "Criterion relation ref type does not match its support/opposition/missing projection.",
        true,
      );
    }
    const sourceRef = protocolStringValueV01(ref.source_ref);
    if (!sourceRef || !SHA256_PATTERN_V01.test(sourceRef)) {
      sink.error(
        "criterion_assessment_relation_source_invalid",
        `${refPath}.source_ref`,
        "Criterion relation refs require the exact packet or receipt fingerprint.",
        true,
      );
    }
    const externalId = protocolStringValueV01(ref.external_id);
    if (refType === "criterion_applicability") {
      if (!packetFingerprint || sourceRef !== packetFingerprint) {
        sink.error(
          "criterion_assessment_relation_applicability_source_mismatch",
          `${refPath}.source_ref`,
          "Criterion applicability refs must bind the assessment packet fingerprint.",
          true,
        );
      }
      const expectedPrefix =
        packetId && criterionId
          ? `criterion-applicability:${packetId}:${criterionId}:`
          : null;
      if (!externalId || !expectedPrefix || !externalId.startsWith(expectedPrefix)) {
        sink.error(
          "criterion_assessment_relation_applicability_identity_mismatch",
          `${refPath}.external_id`,
          "Criterion applicability refs must bind the assessment packet and criterion identities.",
          true,
        );
      }
      if (ref.trust_class !== "direct_local_observation") {
        sink.error(
          "criterion_assessment_relation_applicability_trust_mismatch",
          `${refPath}.trust_class`,
          "Server-owned constant applicability must remain a direct local observation.",
          true,
        );
      }
    } else {
      if (!receiptFingerprint || sourceRef !== receiptFingerprint) {
        sink.error(
          "criterion_assessment_relation_check_source_mismatch",
          `${refPath}.source_ref`,
          "Criterion check refs must bind the assessment receipt fingerprint.",
          true,
        );
      }
      const direction =
        refType === "criterion_check_support"
          ? "support"
          : refType === "criterion_check_opposition"
            ? "opposition"
            : "missing";
      const expectedPrefix =
        receiptId && criterionId
          ? `criterion-relation:${direction}:${receiptId}:${criterionId}:`
          : null;
      if (!externalId || !expectedPrefix || !externalId.startsWith(expectedPrefix)) {
        sink.error(
          "criterion_assessment_relation_check_identity_mismatch",
          `${refPath}.external_id`,
          "Criterion check refs must bind the assessment receipt and criterion identities.",
          true,
        );
      }
    }
  }

  const applicabilityCount = refsByField.supporting_refs.filter(
    (ref) => ref.ref_type === "criterion_applicability",
  ).length;
  const statusValid =
    (status === "satisfied" &&
      supportCount > 0 &&
      oppositionCount === 0 &&
      missingCount === 0 &&
      applicabilityCount === 0 &&
      basis !== "insufficient") ||
    (status === "unsatisfied" &&
      supportCount === 0 &&
      oppositionCount > 0 &&
      missingCount === 0 &&
      basis !== "insufficient") ||
    (status === "not_applicable" &&
      supportCount === applicabilityCount &&
      applicabilityCount > 0 &&
      oppositionCount === 0 &&
      missingCount === 0 &&
      basis === "observed") ||
    (status === "unknown" && basis === "insufficient");
  if (!statusValid) {
    sink.error(
      "criterion_assessment_relation_status_conflict",
      `${path}.status`,
      "Relation-aware status, basis, and ref directions are inconsistent.",
      true,
    );
  }
  if (status === "satisfied" || status === "unsatisfied") {
    const conclusiveRefs = [
      ...refsByField.supporting_refs,
      ...refsByField.opposing_refs,
    ];
    const observed = conclusiveRefs.some(
      (ref) =>
        ref.trust_class === "direct_local_observation" ||
        ref.trust_class === "verified_external_observation",
    );
    const attested = conclusiveRefs.some(
      (ref) => ref.trust_class === "host_attestation",
    );
    const underTrusted = conclusiveRefs.some(
      (ref) =>
        ![
          "direct_local_observation",
          "verified_external_observation",
          "host_attestation",
        ].includes(String(ref.trust_class)),
    );
    const expectedBasis =
      observed && attested
        ? "mixed"
        : observed
          ? "observed"
          : attested
            ? "attested"
            : null;
    if (underTrusted || !expectedBasis || basis !== expectedBasis) {
      sink.error(
        "criterion_assessment_relation_basis_mismatch",
        `${path}.basis`,
        "Conclusive relation basis must exactly preserve observed and host-attested trust classes.",
        true,
      );
    }
  }
  if (isProtocolRecordV01(value.trust)) {
    const expectedTrust = trustForRelationRefsV01(
      fields.flatMap((field) =>
        refsByField[field] as unknown as ExternalRefV01[],
      ),
    );
    if (
      canonicalizeProtocolValueV01(value.trust) !==
      canonicalizeProtocolValueV01(expectedTrust)
    ) {
      sink.error(
        "criterion_assessment_relation_trust_mismatch",
        `${path}.trust`,
        "Relation-aware trust counts must exactly describe the projected relation refs.",
        true,
      );
    }
  }
}

function validateTrustV01(
  value: unknown,
  path: string,
  sink: ProtocolValidationIssueSinkV01,
): void {
  if (!isProtocolRecordV01(value)) {
    sink.error(
      "criterion_assessment_trust_malformed",
      path,
      "Trust summary must be an object.",
    );
    return;
  }
  rejectUnknownProtocolKeysV01(
    value,
    allowedTrustKeys,
    path,
    sink,
    "criterion_assessment_unknown_trust_field",
    true,
  );
  for (const field of [
    "direct_local_observation",
    "verified_external_observation",
    "host_attestation",
    "provider_report",
    "user_declaration",
    "imported_unverified",
    "derived_interpretation",
  ]) {
    if (!Number.isInteger(value[field]) || Number(value[field]) < 0) {
      sink.error(
        "criterion_assessment_trust_count_invalid",
        `${path}.${field}`,
        "Trust counts must be non-negative integers.",
      );
    }
  }
}

function validateCoverageV01(
  value: unknown,
  path: string,
  sink: ProtocolValidationIssueSinkV01,
): void {
  if (!Array.isArray(value)) {
    sink.error(
      "criterion_assessment_coverage_malformed",
      path,
      "Operation coverage must be an array.",
    );
    return;
  }
  const capabilities = new Set<string>();
  value.forEach((entry, index) => {
    const entryPath = `${path}[${index}]`;
    if (!isProtocolRecordV01(entry)) {
      sink.error(
        "criterion_assessment_coverage_entry_malformed",
        entryPath,
        "Coverage entry must be an object.",
      );
      return;
    }
    rejectUnknownProtocolKeysV01(
      entry,
      allowedCoverageKeys,
      entryPath,
      sink,
      "criterion_assessment_unknown_coverage_field",
      true,
    );
    const capability = protocolStringValueV01(entry.capability);
    if (!capability) {
      sink.error(
        "criterion_assessment_coverage_capability_missing",
        `${entryPath}.capability`,
        "Coverage capability is required.",
      );
    } else if (capabilities.has(capability)) {
      sink.error(
        "criterion_assessment_coverage_duplicate",
        `${entryPath}.capability`,
        "Coverage capability may appear only once.",
        true,
      );
    } else {
      capabilities.add(capability);
    }
    if (
      ![
        "enforced",
        "observed",
        "advisory",
        "outside_coverage",
      ].includes(String(entry.coverage_level))
    ) {
      sink.error(
        "criterion_assessment_coverage_level_invalid",
        `${entryPath}.coverage_level`,
        "Coverage level is not recognized.",
      );
    }
    if (entry.source_ref !== null) {
      validateExternalRefStructureV01(
        entry.source_ref,
        `${entryPath}.source_ref`,
        sink,
      );
    }
    validateStringArrayV01(entry.notes, `${entryPath}.notes`, sink);
  });
}

function validateStringArrayV01(
  value: unknown,
  path: string,
  sink: ProtocolValidationIssueSinkV01,
): void {
  if (
    !Array.isArray(value) ||
    value.some((item) => !protocolStringValueV01(item))
  ) {
    sink.error(
      "criterion_assessment_string_array_malformed",
      path,
      "Expected an array of non-empty strings.",
    );
  }
}

function summaryMatchesV01(
  value: unknown,
  expected: CriterionAssessmentSummaryV01,
): boolean {
  return (
    isProtocolRecordV01(value) &&
    value.satisfied === expected.satisfied &&
    value.unsatisfied === expected.unsatisfied &&
    value.unknown === expected.unknown &&
    value.not_applicable === expected.not_applicable
  );
}

function validateAuthorityV01(
  value: unknown,
  sink: ProtocolValidationIssueSinkV01,
): void {
  if (!isProtocolRecordV01(value)) {
    sink.error(
      "criterion_assessment_authority_malformed",
      "$.authority",
      "Authority boundary must be an object.",
      true,
    );
    return;
  }
  rejectUnknownProtocolKeysV01(
    value,
    allowedAuthorityKeys,
    "$.authority",
    sink,
    "criterion_assessment_unknown_authority_field",
    true,
  );
  for (const field of [
    "authoritative",
    "creates_evidence",
    "validates_claims",
    "creates_proposal",
    "creates_decision",
    "applies_transition",
    "changes_semantic_state",
    "changes_later_context",
  ]) {
    if (value[field] !== false) {
      sink.error(
        "criterion_assessment_authority_invalid",
        `$.authority.${field}`,
        `${field} must remain false.`,
        true,
      );
    }
  }
}

function validationResultV01(
  accumulator: ValidationAccumulatorV01,
  version: typeof CRITERION_ASSESSMENT_VERSION_V01 | null,
): CriterionAssessmentValidationResultV01 {
  return {
    status: accumulator.blocked
      ? "blocked"
      : accumulator.errors.length > 0
        ? "invalid"
        : "valid",
    normalized_protocol_version: version,
    errors: accumulator.errors,
    warnings: accumulator.warnings,
  };
}
