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
import { validateRunReceiptV01 } from "@/lib/vnext/run-receipt";
import { validateTaskContextPacketV01 } from "@/lib/vnext/task-context-packet";
import {
  CRITERION_ASSESSMENT_BASES_V01,
  CRITERION_ASSESSMENT_STATUSES_V01,
  CRITERION_ASSESSMENT_VERSION_V01,
  type CriterionAssessmentAuthorityV01,
  type CriterionAssessmentItemV01,
  type CriterionAssessmentSummaryV01,
  type CriterionAssessmentTrustV01,
  type CriterionAssessmentV01,
  type CriterionAssessmentValidationIssueV01,
  type CriterionAssessmentValidationResultV01,
} from "@/types/vnext/criterion-assessment";
import type { ExternalRefV01 } from "@/types/vnext/external-ref";
import type {
  RunReceiptCapabilityCoverageEntryV01,
  RunReceiptV01,
} from "@/types/vnext/run-receipt";
import type { TaskContextPacketV01 } from "@/types/vnext/task-context-packet";

const CRITERION_ID_VERSION_V01 = "criterion_identity.v0.1" as const;
const CRITERION_ID_PREFIX_V01 = "criterion:" as const;
const RUN_RECEIPT_REF_NAMESPACE_V01 = "augnes.vnext.run-receipt.v0.1";
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
 * Pure R6-A evaluator for one already validated packet/receipt pair.
 *
 * Current v0.1 packet and receipt contracts expose no explicit
 * criterion-to-residue relation. Consequently this first policy never uses
 * prose similarity, check names, artifacts, completion, or model output as
 * positive, negative, or missing criterion support. It truthfully preserves
 * every criterion as unknown/insufficient while projecting task-wide
 * uncertainty, trust, and coverage for review without assigning criterion
 * relations that the protocol does not provide.
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
  const criteriaById = new Map<string, CriterionAssessmentItemV01>();

  for (const rawCriterion of input.packet.task.success_criteria) {
    const criterion = normalizeProtocolTextV01(rawCriterion);
    const criterionId = deriveCriterionAssessmentIdV01(criterion);
    if (criteriaById.has(criterionId)) {
      throw new CriterionAssessmentErrorV01(
        "criterion_assessment_criterion_identity_conflict",
      );
    }
    criteriaById.set(criterionId, {
      criterion_id: criterionId,
      criterion,
      status: "unknown",
      basis: "insufficient",
      supporting_refs: [],
      opposing_refs: [],
      missing_refs: [],
      trust: { ...trust },
      operation_coverage: operationCoverage.map((entry) => ({
        ...entry,
        source_ref: entry.source_ref ? { ...entry.source_ref } : null,
        notes: [...entry.notes],
      })),
      uncertainty: [...uncertainty],
    });
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
  const normalizedCriterion = normalizeProtocolTextV01(criterion);
  if (!normalizedCriterion) {
    throw new CriterionAssessmentErrorV01(
      "criterion_assessment_criterion_empty",
    );
  }
  return `${CRITERION_ID_PREFIX_V01}${createProtocolSha256V01(
    canonicalizeProtocolValueV01({
      criterion_identity_version: CRITERION_ID_VERSION_V01,
      criterion: normalizedCriterion,
    }),
  )}`;
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
