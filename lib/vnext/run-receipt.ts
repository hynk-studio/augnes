import {
  canonicalizeProtocolValueV01,
  compareExternalRefsV01,
  compareProtocolCanonicalV01,
  createProtocolSha256V01,
  isProtocolRecordV01,
  normalizeExternalRefPrimitiveV01,
  normalizeProtocolNullableTextV01,
  normalizeProtocolTextV01,
  parseStrictIsoTimestampV01,
  protocolStringValueV01,
  rejectUnknownProtocolKeysV01,
  scanForbiddenProtocolMaterialV01,
  uniqueProtocolStringsV01,
  uniqueProtocolValuesV01,
  validateDuplicateExternalRefsPrimitiveV01,
  validateExternalRefStructureV01,
  type ProtocolJsonRecordV01,
} from "@/lib/vnext/protocol-primitives";
import { EXTERNAL_REF_VERSION_V01, type ExternalRefV01 } from "@/types/vnext/external-ref";
import { validateModelInvocationReceiptV02 } from "@/lib/vnext/model-gateway/model-invocation-receipt";
import {
  RUN_RECEIPT_ATTESTATION_TRUST_CLASSES_V01,
  RUN_RECEIPT_CANONICALIZATION_V01,
  RUN_RECEIPT_EXECUTION_STATUSES_V01,
  RUN_RECEIPT_OBSERVATION_TRUST_CLASSES_V01,
  RUN_RECEIPT_MODEL_INVOCATION_ENTRY_VERSION_V02,
  RUN_RECEIPT_STATUS_BASES_V01,
  RUN_RECEIPT_VERIFICATION_STATUSES_V01,
  RUN_RECEIPT_VERSION_V01,
  type RunReceiptAttestationV01,
  type RunReceiptAuthoritySummaryV01,
  type RunReceiptChangedArtifactV01,
  type RunReceiptCheckResultV01,
  type RunReceiptCommandSummaryV01,
  type RunReceiptIssueV01,
  type RunReceiptModelInvocationEntryV02,
  type RunReceiptModelInvocationV01,
  type RunReceiptObservationV01,
  type RunReceiptSkippedCheckV01,
  type RunReceiptTrustSummaryV01,
  type RunReceiptV01,
  type RunReceiptValidationIssueV01,
  type RunReceiptValidationResultV01,
} from "@/types/vnext/run-receipt";

const PENDING_RECEIPT_ID = "run-receipt:pending";
const PENDING_FINGERPRINT = "sha256:pending";
const PENDING_IDEMPOTENCY_KEY = "sha256:pending";

const executionStatuses = new Set<string>(RUN_RECEIPT_EXECUTION_STATUSES_V01);
const verificationStatuses = new Set<string>(
  RUN_RECEIPT_VERIFICATION_STATUSES_V01,
);
const statusBases = new Set<string>(RUN_RECEIPT_STATUS_BASES_V01);
const observationTrustClasses = new Set<string>(
  RUN_RECEIPT_OBSERVATION_TRUST_CLASSES_V01,
);
const attestationTrustClasses = new Set<string>(
  RUN_RECEIPT_ATTESTATION_TRUST_CLASSES_V01,
);

const allowedRootKeys = new Set([
  "receipt_version",
  "receipt_id",
  "workspace_id",
  "project_id",
  "run_id",
  "work_ref",
  "task_context_packet_ref",
  "recorded_at",
  "started_at",
  "finished_at",
  "execution",
  "verification",
  "reporter_ref",
  "observer_refs",
  "verifier_refs",
  "host_ref",
  "worker_ref",
  "model_invocations",
  "execution_environment",
  "observations",
  "attestations",
  "changed_artifacts",
  "commands",
  "checks",
  "skipped_checks",
  "external_refs",
  "result_summary",
  "blockers",
  "warnings",
  "gaps",
  "privacy_egress",
  "cost_usage",
  "capability_coverage",
  "trust_summary",
  "source_refs",
  "artifact_refs",
  "compatibility",
  "authority_summary",
  "idempotency_key",
  "integrity",
]);

const allowedExecutionKeys = new Set(["status", "basis", "source_refs"]);
const allowedVerificationKeys = new Set([
  "status",
  "basis",
  "required_check_ids",
  "source_refs",
]);
const allowedExecutionEnvironmentKeys = new Set([
  "environment_kind",
  "host_ref",
  "worker_ref",
  "operating_system",
  "runtime_labels",
  "source_refs",
]);
const allowedResultSummaryKeys = new Set([
  "summary",
  "outcome",
  "limitations",
]);
const allowedIssueKeys = new Set(["code", "summary", "source_refs"]);
const allowedCompatibilityKeys = new Set([
  "source_contracts",
  "unmapped_fields",
  "warnings",
  "external_refs",
]);
const allowedUnmappedFieldKeys = new Set(["source_field", "reason"]);
const allowedObservationKeys = new Set([
  "observation_id",
  "observation_kind",
  "summary",
  "event_at",
  "observed_at",
  "observer_ref",
  "trust_class",
  "source_refs",
  "related_command_ids",
  "related_check_ids",
  "related_artifact_refs",
]);
const allowedAttestationKeys = new Set([
  "attestation_id",
  "attestation_kind",
  "summary",
  "reported_at",
  "reporter_ref",
  "trust_class",
  "source_refs",
  "subject_refs",
]);
const allowedCommandKeys = new Set([
  "command_id",
  "summary",
  "command_fingerprint",
  "started_at",
  "finished_at",
  "exit_code",
  "status",
  "basis",
  "source_refs",
  "raw_output_included",
]);
const allowedCheckKeys = new Set([
  "check_id",
  "required",
  "status",
  "basis",
  "summary",
  "source_refs",
]);
const allowedSkippedCheckKeys = new Set([
  "check_id",
  "required",
  "reason",
  "basis",
  "source_refs",
]);
const allowedChangedArtifactKeys = new Set([
  "artifact_ref",
  "change_kind",
  "before_hash",
  "after_hash",
  "basis",
  "related_observation_ids",
  "related_attestation_ids",
  "source_refs",
]);
const allowedModelInvocationKeys = new Set([
  "invocation_ref",
  "provider_ref",
  "model_ref",
  "started_at",
  "finished_at",
  "input_units",
  "output_units",
  "latency_ms",
  "retry_count",
  "status",
  "retention_class",
  "egress_status",
  "raw_prompt_persisted",
  "raw_response_persisted",
  "hidden_reasoning_persisted",
  "source_refs",
]);
const allowedModelInvocationEntryV02Keys = new Set([
  "entry_version",
  "invocation_ref",
  "work_ref",
  "run_ref",
  "invocation_receipt",
  "retry_count",
  "source_refs",
]);
const allowedPrivacyEgressKeys = new Set([
  "data_classification",
  "egress_status",
  "basis",
  "destination_refs",
  "redaction_status",
  "retention_class",
  "raw_prompt_persisted",
  "raw_output_persisted",
  "raw_transcript_persisted",
  "secret_material_persisted",
  "source_refs",
  "notes",
]);
const allowedCostUsageKeys = new Set([
  "cost_basis",
  "cost_amount",
  "currency",
  "usage",
  "source_refs",
]);
const allowedUsageKeys = new Set([
  "basis",
  "input_units",
  "output_units",
  "total_units",
  "unit",
]);
const allowedCapabilityCoverageKeys = new Set([
  "capability",
  "coverage_level",
  "source_ref",
  "notes",
]);
const allowedTrustSummaryKeys = new Set([
  "direct_observations",
  "verified_external_observations",
  "host_attestations",
  "provider_reports",
  "user_declarations",
  "imported_unverified_items",
  "derived_interpretations",
]);
const allowedAuthoritySummaryKeys = new Set([
  "receipt_is_command",
  "receipt_is_canonical_project_state",
  "receipt_is_approval",
  "receipt_is_proof",
  "receipt_is_accepted_evidence",
  "receipt_is_semantic_commit",
  "closes_work",
  "authorizes_execution",
  "authorizes_external_side_effects",
  "authorizes_provider_calls",
  "authorizes_github_mutation",
  "authorizes_merge",
  "authorizes_publication",
  "authorizes_perspective_or_memory_mutation",
  "performs_durable_transition",
  "writes_database",
  "creates_routes_or_ui_actions",
  "reporting_action_grants_authority",
  "notes",
]);
const allowedIntegrityKeys = new Set([
  "algorithm",
  "canonicalization",
  "fingerprint_scope",
  "fingerprint",
]);

const forbiddenSemanticFieldPattern =
  /(?:approv|authori[sz]|accepted.?evidence|evidence.?accepted|canonical.?state|state.?(?:appl|commit|mutat|write|accept|reject)|work.?(?:clos|complet)|publish|publication|merge|semantic.?commit|durable.?transition|proof.?accepted|execute.?granted|execution.?authority)/i;

export const RUN_RECEIPT_REQUIRED_CORE_FIELDS_V01 = [
  "receipt_version",
  "receipt_id",
  "workspace_id",
  "project_id",
  "run_id",
  "recorded_at",
  "execution",
  "verification",
  "reporter_ref",
  "observer_refs",
  "verifier_refs",
  "model_invocations",
  "execution_environment",
  "observations",
  "attestations",
  "changed_artifacts",
  "commands",
  "checks",
  "skipped_checks",
  "external_refs",
  "result_summary",
  "blockers",
  "warnings",
  "gaps",
  "privacy_egress",
  "cost_usage",
  "capability_coverage",
  "trust_summary",
  "source_refs",
  "artifact_refs",
  "compatibility",
  "authority_summary",
  "idempotency_key",
  "integrity",
] as const;

export type RunReceiptBuilderInputV01 = Omit<
  RunReceiptV01,
  | "receipt_version"
  | "receipt_id"
  | "trust_summary"
  | "authority_summary"
  | "idempotency_key"
  | "integrity"
> & {
  authority_notes?: string[];
};

type ValidationAccumulator = {
  errors: RunReceiptValidationIssueV01[];
  warnings: RunReceiptValidationIssueV01[];
  blocked: boolean;
};

export function buildRunReceiptV01(
  input: RunReceiptBuilderInputV01,
): RunReceiptV01 {
  const observations = normalizeObservations(input.observations);
  const attestations = normalizeAttestations(input.attestations);
  const receipt: RunReceiptV01 = {
    receipt_version: RUN_RECEIPT_VERSION_V01,
    receipt_id: PENDING_RECEIPT_ID,
    workspace_id: normalizeProtocolTextV01(input.workspace_id),
    project_id: normalizeProtocolTextV01(input.project_id),
    run_id: normalizeProtocolTextV01(input.run_id),
    work_ref: normalizeNullableRef(input.work_ref),
    task_context_packet_ref: normalizeNullableRef(input.task_context_packet_ref),
    recorded_at: normalizeProtocolTextV01(input.recorded_at),
    started_at: normalizeProtocolNullableTextV01(input.started_at),
    finished_at: normalizeProtocolNullableTextV01(input.finished_at),
    execution: {
      status: input.execution.status,
      basis: input.execution.basis,
      source_refs: normalizeRefs(input.execution.source_refs),
    },
    verification: {
      status: input.verification.status,
      basis: input.verification.basis,
      required_check_ids: uniqueProtocolStringsV01(
        input.verification.required_check_ids,
      ),
      source_refs: normalizeRefs(input.verification.source_refs),
    },
    reporter_ref: normalizeExternalRefPrimitiveV01(input.reporter_ref),
    observer_refs: normalizeRefs(input.observer_refs),
    verifier_refs: normalizeRefs(input.verifier_refs),
    host_ref: normalizeNullableRef(input.host_ref),
    worker_ref: normalizeNullableRef(input.worker_ref),
    model_invocations: normalizeModelInvocations(input.model_invocations),
    execution_environment: {
      environment_kind: input.execution_environment.environment_kind,
      host_ref: normalizeNullableRef(input.execution_environment.host_ref),
      worker_ref: normalizeNullableRef(input.execution_environment.worker_ref),
      operating_system: normalizeProtocolNullableTextV01(
        input.execution_environment.operating_system,
      ),
      runtime_labels: uniqueProtocolStringsV01(
        input.execution_environment.runtime_labels,
      ),
      source_refs: normalizeRefs(input.execution_environment.source_refs),
    },
    observations,
    attestations,
    changed_artifacts: normalizeChangedArtifacts(input.changed_artifacts),
    commands: normalizeCommands(input.commands),
    checks: normalizeChecks(input.checks),
    skipped_checks: normalizeSkippedChecks(input.skipped_checks),
    external_refs: normalizeRefs(input.external_refs),
    result_summary: {
      summary: normalizeProtocolTextV01(input.result_summary.summary),
      outcome: normalizeProtocolNullableTextV01(input.result_summary.outcome),
      limitations: uniqueProtocolStringsV01(input.result_summary.limitations),
    },
    blockers: normalizeIssues(input.blockers),
    warnings: normalizeIssues(input.warnings),
    gaps: normalizeIssues(input.gaps),
    privacy_egress: {
      data_classification: input.privacy_egress.data_classification,
      egress_status: input.privacy_egress.egress_status,
      basis: input.privacy_egress.basis,
      retention_class: normalizeProtocolNullableTextV01(
        input.privacy_egress.retention_class,
      ),
      destination_refs: normalizeRefs(input.privacy_egress.destination_refs),
      redaction_status: input.privacy_egress.redaction_status,
      raw_prompt_persisted: false,
      raw_output_persisted: false,
      raw_transcript_persisted: false,
      secret_material_persisted: false,
      source_refs: normalizeRefs(input.privacy_egress.source_refs),
      notes: uniqueProtocolStringsV01(input.privacy_egress.notes),
    },
    cost_usage: {
      cost_basis: input.cost_usage.cost_basis,
      cost_amount: input.cost_usage.cost_amount,
      currency: normalizeProtocolNullableTextV01(input.cost_usage.currency),
      usage: {
        basis: input.cost_usage.usage.basis,
        input_units: input.cost_usage.usage.input_units,
        output_units: input.cost_usage.usage.output_units,
        total_units: input.cost_usage.usage.total_units,
        unit: normalizeProtocolNullableTextV01(input.cost_usage.usage.unit),
      },
      source_refs: normalizeRefs(input.cost_usage.source_refs),
    },
    capability_coverage: uniqueProtocolValuesV01(
      input.capability_coverage.map((entry) => ({
        capability: normalizeProtocolTextV01(entry.capability),
        coverage_level: entry.coverage_level,
        source_ref: normalizeNullableRef(entry.source_ref),
        notes: uniqueProtocolStringsV01(entry.notes),
      })),
    ).sort(compareProtocolCanonicalV01),
    trust_summary: deriveRunReceiptTrustSummaryV01(observations, attestations),
    source_refs: normalizeRefs(input.source_refs),
    artifact_refs: normalizeRefs(input.artifact_refs),
    compatibility: {
      source_contracts: uniqueProtocolStringsV01(
        input.compatibility.source_contracts,
      ),
      unmapped_fields: uniqueProtocolValuesV01(
        input.compatibility.unmapped_fields.map((entry) => ({
          source_field: normalizeProtocolTextV01(entry.source_field),
          reason: normalizeProtocolTextV01(entry.reason),
        })),
      ).sort(compareProtocolCanonicalV01),
      warnings: uniqueProtocolStringsV01(input.compatibility.warnings),
      external_refs: normalizeRefs(input.compatibility.external_refs),
    },
    authority_summary: createRunReceiptAuthoritySummaryV01(
      input.authority_notes,
    ),
    idempotency_key: PENDING_IDEMPOTENCY_KEY,
    integrity: {
      algorithm: "sha256",
      canonicalization: RUN_RECEIPT_CANONICALIZATION_V01,
      fingerprint_scope: "receipt_without_integrity_fingerprint",
      fingerprint: PENDING_FINGERPRINT,
    },
  };
  receipt.idempotency_key = createRunReceiptIdempotencyKeyV01(receipt);
  receipt.receipt_id = deriveRunReceiptIdV01(receipt);
  receipt.integrity.fingerprint = createRunReceiptFingerprintV01(receipt);
  return receipt;
}

export function createRunReceiptAuthoritySummaryV01(
  notes: string[] = [],
): RunReceiptAuthoritySummaryV01 {
  return {
    receipt_is_command: false,
    receipt_is_canonical_project_state: false,
    receipt_is_approval: false,
    receipt_is_proof: false,
    receipt_is_accepted_evidence: false,
    receipt_is_semantic_commit: false,
    closes_work: false,
    authorizes_execution: false,
    authorizes_external_side_effects: false,
    authorizes_provider_calls: false,
    authorizes_github_mutation: false,
    authorizes_merge: false,
    authorizes_publication: false,
    authorizes_perspective_or_memory_mutation: false,
    performs_durable_transition: false,
    writes_database: false,
    creates_routes_or_ui_actions: false,
    reporting_action_grants_authority: false,
    notes: uniqueProtocolStringsV01([
      "RunReceipt reports bounded run material without granting authority.",
      "Reporting an action does not authorize or approve that action.",
      ...notes,
    ]),
  };
}

export function canonicalizeRunReceiptValueV01(value: unknown): string {
  return canonicalizeProtocolValueV01(value);
}

export function createRunReceiptIdempotencyKeyV01(
  receipt: RunReceiptV01,
): string {
  return createProtocolSha256V01(
    canonicalizeProtocolValueV01({
      receipt_version: receipt.receipt_version,
      workspace_id: receipt.workspace_id,
      project_id: receipt.project_id,
      run_id: receipt.run_id,
      recorded_at: receipt.recorded_at,
      reporter_ref: receipt.reporter_ref,
      source_refs: receipt.source_refs,
    }),
  );
}

export function deriveRunReceiptIdV01(receipt: RunReceiptV01): string {
  const identityHash = createProtocolSha256V01(
    canonicalizeProtocolValueV01({
      ...withoutFingerprint(receipt),
      receipt_id: PENDING_RECEIPT_ID,
    }),
  );
  return `run-receipt:${identityHash.slice("sha256:".length, 31)}`;
}

export function createRunReceiptFingerprintV01(
  receipt: RunReceiptV01,
): string {
  return createProtocolSha256V01(
    canonicalizeProtocolValueV01(withoutFingerprint(receipt)),
  );
}

export function deriveRunReceiptTrustSummaryV01(
  observations: RunReceiptObservationV01[],
  attestations: RunReceiptAttestationV01[],
): RunReceiptTrustSummaryV01 {
  return {
    direct_observations: observations.filter(
      (item) => item.trust_class === "direct_local_observation",
    ).length,
    verified_external_observations: observations.filter(
      (item) => item.trust_class === "verified_external_observation",
    ).length,
    host_attestations: attestations.filter(
      (item) => item.trust_class === "host_attestation",
    ).length,
    provider_reports: attestations.filter(
      (item) => item.trust_class === "provider_report",
    ).length,
    user_declarations: attestations.filter(
      (item) => item.trust_class === "user_declaration",
    ).length,
    imported_unverified_items: attestations.filter(
      (item) => item.trust_class === "imported_unverified",
    ).length,
    derived_interpretations: attestations.filter(
      (item) => item.trust_class === "derived_interpretation",
    ).length,
  };
}

export function validateRunReceiptV01(
  input: unknown,
): RunReceiptValidationResultV01 {
  const accumulator = createAccumulator();
  const sink = issueSink(accumulator);
  const allowedCanonicalIdentityPaths = new Set(["$.run_id"]);
  if (isProtocolRecordV01(input) && Array.isArray(input.model_invocations)) {
    input.model_invocations.forEach((_item, index) => {
      allowedCanonicalIdentityPaths.add(
        `$.model_invocations[${index}].invocation_receipt.run_id`,
      );
      allowedCanonicalIdentityPaths.add(
        `$.model_invocations[${index}].invocation_receipt.invocation_id`,
      );
    });
  }
  scanForbiddenProtocolMaterialV01(
    input,
    "$",
    sink,
    {
      secret_material_message: "Secret-shaped material is forbidden in RunReceipt.",
      provider_specific_field_message:
        "Provider-native identifiers must remain ExternalRef values; run_id is the explicit Augnes identity.",
      allowed_canonical_identity_paths: allowedCanonicalIdentityPaths,
      allowed_false_invariant_fields: new Set([
        "secret_material_persisted",
      ]),
      additional_forbidden_raw_field_pattern:
        /^(?:raw_provider_output|raw_terminal_log|terminal_log|stdout|stderr|environment_dump)$/,
      additional_provider_identity_pattern:
        /^(?:(?:github|claude|gemini)(?:_.+)?|(?:response|invocation|workflow|job|commit|pr)_id)$/,
    },
  );
  scanAbsoluteLocalPaths(input, "$", accumulator);
  if (!isProtocolRecordV01(input)) {
    addError(accumulator, "receipt_not_object", "$", "RunReceipt must be an object.");
    return buildValidationResult(accumulator, null);
  }
  rejectUnknownProtocolKeysV01(
    input,
    allowedRootKeys,
    "$",
    sink,
    "unknown_core_field",
    true,
  );
  const version = protocolStringValueV01(input.receipt_version);
  if (version !== RUN_RECEIPT_VERSION_V01) {
    addError(
      accumulator,
      "unsupported_protocol_version",
      "$.receipt_version",
      `Unsupported RunReceipt protocol version: ${version ?? "missing"}.`,
      true,
    );
  }
  for (const field of RUN_RECEIPT_REQUIRED_CORE_FIELDS_V01) {
    if (input[field] === undefined) {
      addError(
        accumulator,
        `${field}_missing`,
        `$.${field}`,
        `${field} is required by RunReceipt v0.1.`,
      );
    }
  }
  requireString(input, "receipt_id", "$", accumulator);
  requireString(input, "workspace_id", "$", accumulator);
  requireString(input, "project_id", "$", accumulator);
  requireString(input, "run_id", "$", accumulator);
  const recordedAt = requireTimestamp(input.recorded_at, "$.recorded_at", accumulator);
  const startedAt = optionalTimestamp(input.started_at, "$.started_at", accumulator);
  const finishedAt = optionalTimestamp(input.finished_at, "$.finished_at", accumulator);
  validateTimeOrder(startedAt, finishedAt, "$.started_at", "$.finished_at", accumulator);
  if (recordedAt !== null && finishedAt !== null && finishedAt > recordedAt) {
    addWarning(
      accumulator,
      "remote_clock_skew_possible",
      "$.finished_at",
      "Run finish time is later than recorded_at; remote clock skew may exist.",
    );
  }

  validateAllExternalRefs(input, accumulator);
  validateExternalRefStructureV01(input.reporter_ref, "$.reporter_ref", sink);
  validateRefArray(input.observer_refs, "$.observer_refs", accumulator);
  validateRefArray(input.verifier_refs, "$.verifier_refs", accumulator);
  validateExternalRefStructureV01(input.work_ref, "$.work_ref", sink, true);
  validateExternalRefStructureV01(
    input.task_context_packet_ref,
    "$.task_context_packet_ref",
    sink,
    true,
  );
  validateExternalRefStructureV01(input.host_ref, "$.host_ref", sink, true);
  validateExternalRefStructureV01(input.worker_ref, "$.worker_ref", sink, true);
  validateRefArray(input.external_refs, "$.external_refs", accumulator);
  validateRefArray(input.source_refs, "$.source_refs", accumulator);
  validateRefArray(input.artifact_refs, "$.artifact_refs", accumulator);
  validateDuplicateExternalRefsPrimitiveV01(input, sink);

  validateCoreContainers(input, accumulator);
  validateStatusAxes(input, accumulator);
  validateObservations(input, recordedAt, accumulator);
  validateAttestations(input, recordedAt, accumulator);
  validateCommands(input, recordedAt, accumulator);
  validateChecks(input, accumulator);
  validateProvenanceBasisCoherence(input, accumulator);
  validateChangedArtifacts(input, accumulator);
  validateModelInvocations(input, recordedAt, accumulator);
  validatePrivacyEgress(input, accumulator);
  validateCostUsage(input, accumulator);
  validateCapabilityCoverage(input, accumulator);
  validateTrustSummary(input, accumulator);
  validateAuthority(input, accumulator);
  validateIntegrity(input, accumulator);
  return buildValidationResult(
    accumulator,
    version === RUN_RECEIPT_VERSION_V01 ? RUN_RECEIPT_VERSION_V01 : null,
  );
}

function validateCoreContainers(
  input: ProtocolJsonRecordV01,
  accumulator: ValidationAccumulator,
) {
  const environment = recordAt(
    input.execution_environment,
    "$.execution_environment",
    accumulator,
  );
  if (environment) {
    rejectUnknownNestedKeysV01(
      environment,
      allowedExecutionEnvironmentKeys,
      "$.execution_environment",
      accumulator,
    );
    enumValue(
      environment.environment_kind,
      new Set(["local", "remote", "hybrid", "unknown"]),
      "$.execution_environment.environment_kind",
      "execution_environment_kind_invalid",
      accumulator,
    );
    validateNullableStringV01(
      environment.operating_system,
      "$.execution_environment.operating_system",
      accumulator,
    );
    validateExternalRefStructureV01(
      environment.host_ref,
      "$.execution_environment.host_ref",
      issueSink(accumulator),
      true,
    );
    validateExternalRefStructureV01(
      environment.worker_ref,
      "$.execution_environment.worker_ref",
      issueSink(accumulator),
      true,
    );
    stringArray(
      environment.runtime_labels,
      "$.execution_environment.runtime_labels",
      accumulator,
    );
    validateRefArray(
      environment.source_refs,
      "$.execution_environment.source_refs",
      accumulator,
    );
  }
  const summary = recordAt(input.result_summary, "$.result_summary", accumulator);
  if (summary) {
    rejectUnknownNestedKeysV01(
      summary,
      allowedResultSummaryKeys,
      "$.result_summary",
      accumulator,
    );
    requireString(summary, "summary", "$.result_summary", accumulator);
    validateNullableStringV01(
      summary.outcome,
      "$.result_summary.outcome",
      accumulator,
    );
    stringArray(
      summary.limitations,
      "$.result_summary.limitations",
      accumulator,
    );
  }
  validateIssues(input.blockers, "$.blockers", accumulator);
  validateIssues(input.warnings, "$.warnings", accumulator);
  validateIssues(input.gaps, "$.gaps", accumulator);
  const compatibility = recordAt(
    input.compatibility,
    "$.compatibility",
    accumulator,
  );
  if (compatibility) {
    rejectUnknownNestedKeysV01(
      compatibility,
      allowedCompatibilityKeys,
      "$.compatibility",
      accumulator,
    );
    stringArray(
      compatibility.source_contracts,
      "$.compatibility.source_contracts",
      accumulator,
    );
    stringArray(
      compatibility.warnings,
      "$.compatibility.warnings",
      accumulator,
    );
    validateRefArray(
      compatibility.external_refs,
      "$.compatibility.external_refs",
      accumulator,
    );
    const unmapped = arrayAt(
      compatibility.unmapped_fields,
      "$.compatibility.unmapped_fields",
      accumulator,
    );
    unmapped.forEach((value, index) => {
      const item = recordAt(
        value,
        `$.compatibility.unmapped_fields[${index}]`,
        accumulator,
      );
      if (!item) return;
      rejectUnknownNestedKeysV01(
        item,
        allowedUnmappedFieldKeys,
        `$.compatibility.unmapped_fields[${index}]`,
        accumulator,
      );
      requireString(
        item,
        "source_field",
        `$.compatibility.unmapped_fields[${index}]`,
        accumulator,
      );
      requireString(
        item,
        "reason",
        `$.compatibility.unmapped_fields[${index}]`,
        accumulator,
      );
    });
  }
}

function validateIssues(
  value: unknown,
  path: string,
  accumulator: ValidationAccumulator,
) {
  arrayAt(value, path, accumulator).forEach((candidate, index) => {
    const itemPath = `${path}[${index}]`;
    const item = recordAt(candidate, itemPath, accumulator);
    if (!item) return;
    rejectUnknownNestedKeysV01(
      item,
      allowedIssueKeys,
      itemPath,
      accumulator,
    );
    requireString(item, "code", itemPath, accumulator);
    requireString(item, "summary", itemPath, accumulator);
    validateRefArray(item.source_refs, `${itemPath}.source_refs`, accumulator);
  });
}

function withoutFingerprint(receipt: RunReceiptV01) {
  const { fingerprint: _fingerprint, ...integrity } = receipt.integrity;
  return { ...receipt, integrity };
}

function normalizeNullableRef(ref: ExternalRefV01 | null): ExternalRefV01 | null {
  return ref ? normalizeExternalRefPrimitiveV01(ref) : null;
}

function normalizeRefs(refs: ExternalRefV01[]): ExternalRefV01[] {
  return uniqueProtocolValuesV01(refs.map(normalizeExternalRefPrimitiveV01)).sort(
    compareExternalRefsV01,
  );
}

function normalizeObservations(
  values: RunReceiptObservationV01[],
): RunReceiptObservationV01[] {
  return uniqueProtocolValuesV01(
    values.map((item) => ({
      observation_id: normalizeProtocolTextV01(item.observation_id),
      observation_kind: normalizeProtocolTextV01(item.observation_kind),
      summary: normalizeProtocolTextV01(item.summary),
      event_at: normalizeProtocolNullableTextV01(item.event_at),
      observed_at: normalizeProtocolTextV01(item.observed_at),
      observer_ref: normalizeExternalRefPrimitiveV01(item.observer_ref),
      trust_class: item.trust_class,
      source_refs: normalizeRefs(item.source_refs),
      related_command_ids: uniqueProtocolStringsV01(item.related_command_ids),
      related_check_ids: uniqueProtocolStringsV01(item.related_check_ids),
      related_artifact_refs: normalizeRefs(item.related_artifact_refs),
    })),
  ).sort(compareProtocolCanonicalV01);
}

function normalizeAttestations(
  values: RunReceiptAttestationV01[],
): RunReceiptAttestationV01[] {
  return uniqueProtocolValuesV01(
    values.map((item) => ({
      attestation_id: normalizeProtocolTextV01(item.attestation_id),
      attestation_kind: normalizeProtocolTextV01(item.attestation_kind),
      summary: normalizeProtocolTextV01(item.summary),
      reported_at: normalizeProtocolTextV01(item.reported_at),
      reporter_ref: normalizeExternalRefPrimitiveV01(item.reporter_ref),
      trust_class: item.trust_class,
      source_refs: normalizeRefs(item.source_refs),
      subject_refs: normalizeRefs(item.subject_refs),
    })),
  ).sort(compareProtocolCanonicalV01);
}

function normalizeCommands(
  values: RunReceiptCommandSummaryV01[],
): RunReceiptCommandSummaryV01[] {
  return uniqueProtocolValuesV01(
    values.map((item) => ({
      command_id: normalizeProtocolTextV01(item.command_id),
      summary: normalizeProtocolTextV01(item.summary),
      command_fingerprint: normalizeProtocolNullableTextV01(
        item.command_fingerprint,
      ),
      started_at: normalizeProtocolNullableTextV01(item.started_at),
      finished_at: normalizeProtocolNullableTextV01(item.finished_at),
      exit_code: item.exit_code,
      status: item.status,
      basis: item.basis,
      source_refs: normalizeRefs(item.source_refs),
      raw_output_included: false as const,
    })),
  ).sort(compareProtocolCanonicalV01);
}

function normalizeChecks(values: RunReceiptCheckResultV01[]): RunReceiptCheckResultV01[] {
  return uniqueProtocolValuesV01(
    values.map((item) => ({
      check_id: normalizeProtocolTextV01(item.check_id),
      required: item.required,
      status: item.status,
      basis: item.basis,
      summary: normalizeProtocolTextV01(item.summary),
      source_refs: normalizeRefs(item.source_refs),
    })),
  ).sort(compareProtocolCanonicalV01);
}

function normalizeSkippedChecks(
  values: RunReceiptSkippedCheckV01[],
): RunReceiptSkippedCheckV01[] {
  return uniqueProtocolValuesV01(
    values.map((item) => ({
      check_id: normalizeProtocolTextV01(item.check_id),
      required: item.required,
      reason: normalizeProtocolTextV01(item.reason),
      basis: item.basis,
      source_refs: normalizeRefs(item.source_refs),
    })),
  ).sort(compareProtocolCanonicalV01);
}

function normalizeChangedArtifacts(
  values: RunReceiptChangedArtifactV01[],
): RunReceiptChangedArtifactV01[] {
  return uniqueProtocolValuesV01(
    values.map((item) => ({
      artifact_ref: normalizeExternalRefPrimitiveV01(item.artifact_ref),
      change_kind: item.change_kind,
      before_hash: normalizeProtocolNullableTextV01(item.before_hash),
      after_hash: normalizeProtocolNullableTextV01(item.after_hash),
      basis: item.basis,
      related_observation_ids: uniqueProtocolStringsV01(
        item.related_observation_ids,
      ),
      related_attestation_ids: uniqueProtocolStringsV01(
        item.related_attestation_ids,
      ),
      source_refs: normalizeRefs(item.source_refs),
    })),
  ).sort(compareProtocolCanonicalV01);
}

function normalizeModelInvocations(
  values: RunReceiptModelInvocationV01[],
): RunReceiptModelInvocationV01[] {
  return uniqueProtocolValuesV01(
    values.map((item) => {
      if ("entry_version" in item) {
        return {
          entry_version: RUN_RECEIPT_MODEL_INVOCATION_ENTRY_VERSION_V02,
          invocation_ref: normalizeExternalRefPrimitiveV01(
            item.invocation_ref,
          ),
          work_ref: normalizeExternalRefPrimitiveV01(item.work_ref),
          run_ref: normalizeExternalRefPrimitiveV01(item.run_ref),
          invocation_receipt: validateModelInvocationReceiptV02(
            item.invocation_receipt,
          ),
          retry_count: 0 as const,
          source_refs: normalizeRefs(item.source_refs),
        } satisfies RunReceiptModelInvocationEntryV02;
      }
      return {
        invocation_ref: normalizeExternalRefPrimitiveV01(item.invocation_ref),
        provider_ref: normalizeNullableRef(item.provider_ref),
        model_ref: normalizeNullableRef(item.model_ref),
        started_at: normalizeProtocolNullableTextV01(item.started_at),
        finished_at: normalizeProtocolNullableTextV01(item.finished_at),
        input_units: item.input_units,
        output_units: item.output_units,
        latency_ms: item.latency_ms,
        retry_count: item.retry_count,
        status: item.status,
        retention_class: normalizeProtocolNullableTextV01(item.retention_class),
        egress_status: item.egress_status,
        raw_prompt_persisted: false as const,
        raw_response_persisted: false as const,
        hidden_reasoning_persisted: false as const,
        source_refs: normalizeRefs(item.source_refs),
      };
    }),
  ).sort(compareProtocolCanonicalV01);
}

function normalizeIssues(values: RunReceiptIssueV01[]): RunReceiptIssueV01[] {
  return uniqueProtocolValuesV01(
    values.map((item) => ({
      code: normalizeProtocolTextV01(item.code),
      summary: normalizeProtocolTextV01(item.summary),
      source_refs: normalizeRefs(item.source_refs),
    })),
  ).sort(compareProtocolCanonicalV01);
}

function validateAllExternalRefs(input: unknown, accumulator: ValidationAccumulator) {
  walk(input, "$", (value, path) => {
    if (isProtocolRecordV01(value) && value.ref_version !== undefined) {
      validateExternalRefStructureV01(value, path, issueSink(accumulator));
    }
  });
}

function validateStatusAxes(input: ProtocolJsonRecordV01, accumulator: ValidationAccumulator) {
  const execution = recordAt(input.execution, "$.execution", accumulator);
  const verification = recordAt(input.verification, "$.verification", accumulator);
  if (execution) {
    rejectUnknownNestedKeysV01(
      execution,
      allowedExecutionKeys,
      "$.execution",
      accumulator,
    );
    enumValue(execution.status, executionStatuses, "$.execution.status", "execution_status_invalid", accumulator);
    basisValue(execution.basis, "$.execution.basis", accumulator);
    validateRefArray(execution.source_refs, "$.execution.source_refs", accumulator);
  }
  if (verification) {
    rejectUnknownNestedKeysV01(
      verification,
      allowedVerificationKeys,
      "$.verification",
      accumulator,
    );
    enumValue(verification.status, verificationStatuses, "$.verification.status", "verification_status_invalid", accumulator);
    basisValue(verification.basis, "$.verification.basis", accumulator);
    stringArray(verification.required_check_ids, "$.verification.required_check_ids", accumulator);
    validateRefArray(verification.source_refs, "$.verification.source_refs", accumulator);
  }
}

function validateObservations(
  input: ProtocolJsonRecordV01,
  recordedAt: number | null,
  accumulator: ValidationAccumulator,
) {
  const observations = arrayAt(input.observations, "$.observations", accumulator);
  const observerRefs = refIdentitySet(input.observer_refs);
  const commandIds = idSet(input.commands, "command_id");
  const checkIds = new Set([
    ...idSet(input.checks, "check_id"),
    ...idSet(input.skipped_checks, "check_id"),
  ]);
  const artifactIdentities = new Set([
    ...refIdentitySet(input.artifact_refs),
    ...changedArtifactIdentitySet(input.changed_artifacts),
  ]);
  const observationIds = new Set<string>();
  for (const [index, value] of observations.entries()) {
    const path = `$.observations[${index}]`;
    const item = recordAt(value, path, accumulator);
    if (!item) continue;
    rejectUnknownNestedKeysV01(
      item,
      allowedObservationKeys,
      path,
      accumulator,
    );
    const observationId = requireString(
      item,
      "observation_id",
      path,
      accumulator,
    );
    if (observationId && observationIds.has(observationId)) {
      addError(
        accumulator,
        "duplicate_observation_id",
        `${path}.observation_id`,
        `Observation ID ${observationId} must be unique.`,
      );
    }
    if (observationId) observationIds.add(observationId);
    requireString(item, "observation_kind", path, accumulator);
    requireString(item, "summary", path, accumulator);
    optionalTimestamp(item.event_at, `${path}.event_at`, accumulator);
    const observedAt = requireTimestamp(item.observed_at, `${path}.observed_at`, accumulator);
    validateExternalRefStructureV01(item.observer_ref, `${path}.observer_ref`, issueSink(accumulator));
    const trust = protocolStringValueV01(item.trust_class);
    if (!trust || !observationTrustClasses.has(trust)) {
      addError(accumulator, "observation_trust_class_invalid", `${path}.trust_class`, "Observation requires a direct or verified observation trust class.", true);
    }
    const observerIdentity = refIdentity(item.observer_ref);
    if (!observerIdentity || !observerRefs.has(observerIdentity)) {
      addError(accumulator, "observation_observer_unregistered", `${path}.observer_ref`, "Observation observer_ref must be present in observer_refs.");
    }
    validateRefArray(item.source_refs, `${path}.source_refs`, accumulator);
    const relatedCommandIds = stringArray(
      item.related_command_ids,
      `${path}.related_command_ids`,
      accumulator,
    );
    for (const commandId of relatedCommandIds) {
      if (!commandIds.has(commandId)) {
        addError(
          accumulator,
          "observation_related_command_missing",
          `${path}.related_command_ids`,
          `Related command ${commandId} does not exist in this receipt.`,
        );
      }
    }
    const relatedCheckIds = stringArray(
      item.related_check_ids,
      `${path}.related_check_ids`,
      accumulator,
    );
    for (const checkId of relatedCheckIds) {
      if (!checkIds.has(checkId)) {
        addError(
          accumulator,
          "observation_related_check_missing",
          `${path}.related_check_ids`,
          `Related check ${checkId} does not exist in checks or skipped_checks.`,
        );
      }
    }
    validateRefArray(
      item.related_artifact_refs,
      `${path}.related_artifact_refs`,
      accumulator,
    );
    for (const relatedArtifact of Array.isArray(item.related_artifact_refs)
      ? item.related_artifact_refs
      : []) {
      const identity = refIdentity(relatedArtifact);
      if (!identity || !artifactIdentities.has(identity)) {
        addError(
          accumulator,
          "observation_related_artifact_missing",
          `${path}.related_artifact_refs`,
          "Related artifact reference does not resolve to artifact_refs or changed_artifacts.",
        );
      }
    }
    if (recordedAt !== null && observedAt !== null && observedAt > recordedAt) {
      addWarning(accumulator, "remote_clock_skew_possible", `${path}.observed_at`, "Observation time is later than recorded_at; remote clock skew may exist.");
    }
  }
}

function validateAttestations(
  input: ProtocolJsonRecordV01,
  recordedAt: number | null,
  accumulator: ValidationAccumulator,
) {
  const attestations = arrayAt(input.attestations, "$.attestations", accumulator);
  const attestationIds = new Set<string>();
  for (const [index, value] of attestations.entries()) {
    const path = `$.attestations[${index}]`;
    const item = recordAt(value, path, accumulator);
    if (!item) continue;
    rejectUnknownNestedKeysV01(
      item,
      allowedAttestationKeys,
      path,
      accumulator,
    );
    const attestationId = requireString(
      item,
      "attestation_id",
      path,
      accumulator,
    );
    if (attestationId && attestationIds.has(attestationId)) {
      addError(
        accumulator,
        "duplicate_attestation_id",
        `${path}.attestation_id`,
        `Attestation ID ${attestationId} must be unique.`,
      );
    }
    if (attestationId) attestationIds.add(attestationId);
    requireString(item, "attestation_kind", path, accumulator);
    requireString(item, "summary", path, accumulator);
    const reportedAt = requireTimestamp(item.reported_at, `${path}.reported_at`, accumulator);
    validateExternalRefStructureV01(item.reporter_ref, `${path}.reporter_ref`, issueSink(accumulator));
    const trust = protocolStringValueV01(item.trust_class);
    if (!trust || !attestationTrustClasses.has(trust)) {
      addError(accumulator, "attestation_trust_class_invalid", `${path}.trust_class`, "Attestation requires an attestation-only trust class.", true);
    }
    validateRefArray(item.source_refs, `${path}.source_refs`, accumulator);
    validateRefArray(item.subject_refs, `${path}.subject_refs`, accumulator);
    if (recordedAt !== null && reportedAt !== null && reportedAt > recordedAt) {
      addWarning(accumulator, "remote_clock_skew_possible", `${path}.reported_at`, "Attestation time is later than recorded_at; remote clock skew may exist.");
    }
  }
}

function validateCommands(
  input: ProtocolJsonRecordV01,
  recordedAt: number | null,
  accumulator: ValidationAccumulator,
) {
  const commands = arrayAt(input.commands, "$.commands", accumulator);
  const commandIds = new Set<string>();
  for (const [index, value] of commands.entries()) {
    const path = `$.commands[${index}]`;
    const item = recordAt(value, path, accumulator);
    if (!item) continue;
    rejectUnknownNestedKeysV01(item, allowedCommandKeys, path, accumulator);
    const commandId = requireString(item, "command_id", path, accumulator);
    if (commandId && commandIds.has(commandId)) {
      addError(
        accumulator,
        "duplicate_command_id",
        `${path}.command_id`,
        `Command ID ${commandId} must be unique.`,
      );
    }
    if (commandId) commandIds.add(commandId);
    requireString(item, "summary", path, accumulator);
    const started = optionalTimestamp(item.started_at, `${path}.started_at`, accumulator);
    const finished = optionalTimestamp(item.finished_at, `${path}.finished_at`, accumulator);
    validateTimeOrder(started, finished, `${path}.started_at`, `${path}.finished_at`, accumulator);
    if (item.exit_code !== null && !Number.isInteger(item.exit_code)) {
      addError(accumulator, "command_exit_code_invalid", `${path}.exit_code`, "Command exit_code must be an integer or null.");
    }
    enumValue(
      item.status,
      new Set(["completed", "failed", "blocked", "unknown"]),
      `${path}.status`,
      "command_status_invalid",
      accumulator,
    );
    basisValue(item.basis, `${path}.basis`, accumulator);
    validateNullableStringV01(
      item.command_fingerprint,
      `${path}.command_fingerprint`,
      accumulator,
    );
    if (item.raw_output_included !== false) {
      addError(accumulator, "raw_command_output_forbidden", `${path}.raw_output_included`, "Command raw output must not be included.", true);
    }
    validateRefArray(item.source_refs, `${path}.source_refs`, accumulator);
    if (recordedAt !== null && finished !== null && finished > recordedAt) {
      addWarning(accumulator, "remote_clock_skew_possible", `${path}.finished_at`, "Command finish time is later than recorded_at; remote clock skew may exist.");
    }
  }
}

function validateChecks(input: ProtocolJsonRecordV01, accumulator: ValidationAccumulator) {
  const checks = arrayAt(input.checks, "$.checks", accumulator);
  const skipped = arrayAt(input.skipped_checks, "$.skipped_checks", accumulator);
  const byCheck = new Map<string, Set<string>>();
  const checkCounts = new Map<string, number>();
  const requiredNonPassingChecks = new Set<string>();
  for (const [index, value] of checks.entries()) {
    const path = `$.checks[${index}]`;
    const item = recordAt(value, path, accumulator);
    if (!item) continue;
    rejectUnknownNestedKeysV01(item, allowedCheckKeys, path, accumulator);
    const checkId = requireString(item, "check_id", path, accumulator);
    if (checkId) {
      const count = (checkCounts.get(checkId) ?? 0) + 1;
      checkCounts.set(checkId, count);
      if (count > 1) {
        addError(
          accumulator,
          "duplicate_check_id",
          `${path}.check_id`,
          `Check ID ${checkId} must be unique even when status is unchanged.`,
        );
      }
    }
    const status = protocolStringValueV01(item.status);
    if (!status || !new Set(["passed", "failed", "blocked", "unknown"]).has(status)) {
      addError(accumulator, "check_status_invalid", `${path}.status`, "Check status must be passed, failed, blocked, or unknown.");
    }
    if (typeof item.required !== "boolean") addError(accumulator, "check_required_invalid", `${path}.required`, "Check required must be boolean.");
    requireString(item, "summary", path, accumulator);
    basisValue(item.basis, `${path}.basis`, accumulator);
    validateRefArray(item.source_refs, `${path}.source_refs`, accumulator);
    if (checkId && status) {
      const statuses = byCheck.get(checkId) ?? new Set<string>();
      statuses.add(status);
      byCheck.set(checkId, statuses);
      if (item.required === true && status !== "passed") {
        requiredNonPassingChecks.add(checkId);
      }
    }
  }
  const skippedIds = new Set<string>();
  const skippedCounts = new Map<string, number>();
  const requiredSkippedIds = new Set<string>();
  for (const [index, value] of skipped.entries()) {
    const path = `$.skipped_checks[${index}]`;
    const item = recordAt(value, path, accumulator);
    if (!item) continue;
    rejectUnknownNestedKeysV01(
      item,
      allowedSkippedCheckKeys,
      path,
      accumulator,
    );
    const checkId = requireString(item, "check_id", path, accumulator);
    const reason = requireString(item, "reason", path, accumulator);
    if (reason && /^(?:not run|skipped|n\/?a|none)$/i.test(reason)) {
      addError(accumulator, "skipped_check_reason_insufficient", `${path}.reason`, "Skipped check requires a concrete reason.");
    }
    if (typeof item.required !== "boolean") addError(accumulator, "check_required_invalid", `${path}.required`, "Skipped check required must be boolean.");
    basisValue(item.basis, `${path}.basis`, accumulator);
    validateRefArray(item.source_refs, `${path}.source_refs`, accumulator);
    if (checkId) {
      const count = (skippedCounts.get(checkId) ?? 0) + 1;
      skippedCounts.set(checkId, count);
      if (count > 1) {
        addError(
          accumulator,
          "duplicate_skipped_check_id",
          `${path}.check_id`,
          `Skipped check ID ${checkId} must be unique.`,
        );
      }
      skippedIds.add(checkId);
      if (item.required === true) requiredSkippedIds.add(checkId);
    }
  }
  for (const [checkId, statuses] of byCheck) {
    if (statuses.size > 1) {
      addError(accumulator, "conflicting_check_results", "$.checks", `Check ${checkId} has conflicting statuses.`, true);
    }
    if (skippedIds.has(checkId)) {
      addError(accumulator, "check_result_and_skip_conflict", "$.skipped_checks", `Check ${checkId} is both a result and skipped.`, true);
    }
  }
  const verification = isProtocolRecordV01(input.verification) ? input.verification : null;
  if (verification?.status === "passed") {
    const requiredIds = Array.isArray(verification.required_check_ids)
      ? verification.required_check_ids.map(protocolStringValueV01).filter((value): value is string => Boolean(value))
      : [];
    for (const checkId of requiredIds) {
      const statuses = byCheck.get(checkId);
      if (!statuses) {
        addError(accumulator, "required_check_unaccounted", "$.verification.required_check_ids", `Required check ${checkId} is unaccounted for.`);
      } else if (!statuses.has("passed") || statuses.size !== 1) {
        addError(accumulator, "verification_pass_conflicts_required_check", "$.verification.status", `Verification cannot pass because required check ${checkId} did not pass.`);
      }
      if (skippedIds.has(checkId)) {
        addError(accumulator, "verification_pass_conflicts_required_skip", "$.verification.status", `Verification cannot pass because required check ${checkId} was skipped.`);
      }
    }
    for (const checkId of requiredNonPassingChecks) {
      addError(
        accumulator,
        "verification_pass_conflicts_required_check",
        "$.verification.status",
        `Verification cannot pass because required check ${checkId} did not pass.`,
      );
    }
    for (const checkId of requiredSkippedIds) {
      addError(
        accumulator,
        "verification_pass_conflicts_required_skip",
        "$.verification.status",
        `Verification cannot pass because required check ${checkId} was skipped.`,
      );
    }
  }
}

function validateProvenanceBasisCoherence(
  input: ProtocolJsonRecordV01,
  accumulator: ValidationAccumulator,
) {
  const observerIds = refIdentitySet(input.observer_refs);
  const verifierIds = refIdentitySet(input.verifier_refs);
  const attestationReporterIds = new Set<string>();
  for (const value of Array.isArray(input.attestations)
    ? input.attestations
    : []) {
    if (!isProtocolRecordV01(value)) continue;
    const identity = refIdentity(value.reporter_ref);
    if (identity) attestationReporterIds.add(identity);
  }

  const executionObservedIds = new Set<string>();
  const verificationObservedIds = new Set<string>();
  for (const value of Array.isArray(input.observations)
    ? input.observations
    : []) {
    if (!isProtocolRecordV01(value)) continue;
    const observerIdentity = refIdentity(value.observer_ref);
    if (observerIdentity && observerIds.has(observerIdentity)) {
      executionObservedIds.add(observerIdentity);
    }
    if (
      Array.isArray(value.related_check_ids) &&
      value.related_check_ids.length > 0
    ) {
      if (observerIdentity && verifierIds.has(observerIdentity)) {
        verificationObservedIds.add(observerIdentity);
      }
      addMatchingRefIdentities(
        value.source_refs,
        verifierIds,
        verificationObservedIds,
      );
    }
  }
  for (const value of [
    ...(Array.isArray(input.checks) ? input.checks : []),
    ...(Array.isArray(input.skipped_checks) ? input.skipped_checks : []),
  ]) {
    if (!isProtocolRecordV01(value)) continue;
    if (value.basis === "observed" || value.basis === "mixed") {
      addMatchingRefIdentities(
        value.source_refs,
        verifierIds,
        verificationObservedIds,
      );
    }
  }

  const execution = isProtocolRecordV01(input.execution)
    ? input.execution
    : null;
  if (execution) {
    validateBasisSourceSupport(
      execution.basis,
      execution.source_refs,
      executionObservedIds,
      attestationReporterIds,
      "$.execution",
      accumulator,
    );
    if (
      execution.status === "blocked" &&
      (!Array.isArray(input.blockers) || input.blockers.length === 0)
    ) {
      addError(
        accumulator,
        "blocked_execution_requires_blocker",
        "$.blockers",
        "Blocked execution requires at least one blocker.",
      );
    }
  }

  const verification = isProtocolRecordV01(input.verification)
    ? input.verification
    : null;
  if (verification) {
    validateBasisSourceSupport(
      verification.basis,
      verification.source_refs,
      verificationObservedIds,
      attestationReporterIds,
      "$.verification",
      accumulator,
    );
  }

  validateEntryBasisArray(
    input.commands,
    "$.commands",
    observerIds,
    attestationReporterIds,
    accumulator,
  );
  validateEntryBasisArray(
    input.checks,
    "$.checks",
    verifierIds,
    attestationReporterIds,
    accumulator,
  );
  validateEntryBasisArray(
    input.skipped_checks,
    "$.skipped_checks",
    verifierIds,
    attestationReporterIds,
    accumulator,
  );
}

function validateEntryBasisArray(
  value: unknown,
  path: string,
  observedActorIds: ReadonlySet<string>,
  attestationReporterIds: ReadonlySet<string>,
  accumulator: ValidationAccumulator,
) {
  if (!Array.isArray(value)) return;
  value.forEach((candidate, index) => {
    if (!isProtocolRecordV01(candidate)) return;
    validateBasisSourceSupport(
      candidate.basis,
      candidate.source_refs,
      observedActorIds,
      attestationReporterIds,
      `${path}[${index}]`,
      accumulator,
    );
  });
}

function validateBasisSourceSupport(
  basisValueInput: unknown,
  sourceRefs: unknown,
  observedActorIds: ReadonlySet<string>,
  attestationReporterIds: ReadonlySet<string>,
  path: string,
  accumulator: ValidationAccumulator,
) {
  const basis = protocolStringValueV01(basisValueInput);
  if (basis === "unknown" || !statusBases.has(basis ?? "")) return;
  const sourceIds = [...refIdentitySet(sourceRefs)];
  const observedMatches = sourceIds.filter((identity) =>
    observedActorIds.has(identity),
  );
  const attestedMatches = sourceIds.filter((identity) =>
    attestationReporterIds.has(identity),
  );
  const allowedIds =
    basis === "observed"
      ? observedActorIds
      : basis === "attested"
        ? attestationReporterIds
        : new Set([...observedActorIds, ...attestationReporterIds]);
  const unsupportedIds = sourceIds.filter((identity) => !allowedIds.has(identity));

  if (sourceIds.length === 0) {
    addError(
      accumulator,
      "basis_provenance_source_missing",
      `${path}.source_refs`,
      `${basis} basis requires at least one provenance source reference.`,
    );
    return;
  }
  if (unsupportedIds.length > 0) {
    addError(
      accumulator,
      "basis_provenance_source_unregistered",
      `${path}.source_refs`,
      "Basis source_refs contain references outside registered observed actors and attestation reporters.",
    );
  }
  if (basis === "observed" && observedMatches.length === 0) {
    addError(
      accumulator,
      "observed_basis_unsupported",
      `${path}.basis`,
      "Observed basis requires matching registered observed provenance.",
    );
  }
  if (basis === "attested" && attestedMatches.length === 0) {
    addError(
      accumulator,
      "attested_basis_unsupported",
      `${path}.basis`,
      "Attested basis requires a source matching an actual attestation reporter.",
    );
  }
  if (
    basis === "mixed" &&
    (observedMatches.length === 0 || attestedMatches.length === 0)
  ) {
    addError(
      accumulator,
      "mixed_basis_unsupported",
      `${path}.basis`,
      "Mixed basis requires both observed and attested provenance support.",
    );
  }
}

function addMatchingRefIdentities(
  value: unknown,
  allowed: ReadonlySet<string>,
  output: Set<string>,
) {
  for (const identity of refIdentitySet(value)) {
    if (allowed.has(identity)) output.add(identity);
  }
}

function validateChangedArtifacts(input: ProtocolJsonRecordV01, accumulator: ValidationAccumulator) {
  const observations = idSet(input.observations, "observation_id");
  const attestations = idSet(input.attestations, "attestation_id");
  const artifacts = arrayAt(input.changed_artifacts, "$.changed_artifacts", accumulator);
  for (const [index, value] of artifacts.entries()) {
    const path = `$.changed_artifacts[${index}]`;
    const item = recordAt(value, path, accumulator);
    if (!item) continue;
    rejectUnknownNestedKeysV01(
      item,
      allowedChangedArtifactKeys,
      path,
      accumulator,
    );
    validateExternalRefStructureV01(item.artifact_ref, `${path}.artifact_ref`, issueSink(accumulator));
    enumValue(
      item.change_kind,
      new Set(["added", "modified", "deleted", "renamed", "unknown"]),
      `${path}.change_kind`,
      "artifact_change_kind_invalid",
      accumulator,
    );
    basisValue(item.basis, `${path}.basis`, accumulator);
    validateNullableStringV01(
      item.before_hash,
      `${path}.before_hash`,
      accumulator,
    );
    validateNullableStringV01(
      item.after_hash,
      `${path}.after_hash`,
      accumulator,
    );
    const observationIds = stringArray(item.related_observation_ids, `${path}.related_observation_ids`, accumulator);
    const attestationIds = stringArray(item.related_attestation_ids, `${path}.related_attestation_ids`, accumulator);
    const missingObservationIds = observationIds.filter(
      (id) => !observations.has(id),
    );
    const missingAttestationIds = attestationIds.filter(
      (id) => !attestations.has(id),
    );
    if (missingObservationIds.length > 0) {
      addError(
        accumulator,
        "artifact_related_observation_missing",
        `${path}.related_observation_ids`,
        `Changed artifact references unknown observations: ${missingObservationIds.join(", ")}.`,
      );
    }
    if (missingAttestationIds.length > 0) {
      addError(
        accumulator,
        "artifact_related_attestation_missing",
        `${path}.related_attestation_ids`,
        `Changed artifact references unknown attestations: ${missingAttestationIds.join(", ")}.`,
      );
    }
    if ((item.basis === "observed" || item.basis === "mixed") && observationIds.length === 0) {
      addError(accumulator, "artifact_observation_provenance_missing", `${path}.related_observation_ids`, "Observed artifact change requires a related observation.");
    }
    if ((item.basis === "attested" || item.basis === "mixed") && attestationIds.length === 0) {
      addError(accumulator, "artifact_attestation_provenance_missing", `${path}.related_attestation_ids`, "Attested artifact change requires a related attestation.");
    }
    validateRefArray(item.source_refs, `${path}.source_refs`, accumulator);
  }
}

function validateModelInvocations(
  input: ProtocolJsonRecordV01,
  recordedAt: number | null,
  accumulator: ValidationAccumulator,
) {
  const invocations = arrayAt(input.model_invocations, "$.model_invocations", accumulator);
  const seenInvocationIds = new Set<string>();
  for (const [index, value] of invocations.entries()) {
    const path = `$.model_invocations[${index}]`;
    const item = recordAt(value, path, accumulator);
    if (!item) continue;
    if (Object.hasOwn(item, "entry_version")) {
      const invocationId = validateModelInvocationEntryV02(
        item,
        input,
        recordedAt,
        path,
        accumulator,
      );
      if (invocationId) {
        if (seenInvocationIds.has(invocationId)) {
          addError(
            accumulator,
            "model_invocation_duplicate",
            `${path}.invocation_ref.external_id`,
            "RunReceipt cannot contain the same model invocation more than once.",
          );
        }
        seenInvocationIds.add(invocationId);
      }
      continue;
    }
    rejectUnknownNestedKeysV01(
      item,
      allowedModelInvocationKeys,
      path,
      accumulator,
    );
    validateExternalRefStructureV01(item.invocation_ref, `${path}.invocation_ref`, issueSink(accumulator));
    validateExternalRefStructureV01(item.provider_ref, `${path}.provider_ref`, issueSink(accumulator), true);
    validateExternalRefStructureV01(item.model_ref, `${path}.model_ref`, issueSink(accumulator), true);
    const started = optionalTimestamp(item.started_at, `${path}.started_at`, accumulator);
    const finished = optionalTimestamp(item.finished_at, `${path}.finished_at`, accumulator);
    validateTimeOrder(started, finished, `${path}.started_at`, `${path}.finished_at`, accumulator);
    enumValue(
      item.status,
      new Set(["completed", "failed", "blocked", "unknown"]),
      `${path}.status`,
      "model_invocation_status_invalid",
      accumulator,
    );
    enumValue(
      item.egress_status,
      new Set(["occurred", "did_not_occur", "blocked", "unknown"]),
      `${path}.egress_status`,
      "model_invocation_egress_invalid",
      accumulator,
    );
    validateRefArray(item.source_refs, `${path}.source_refs`, accumulator);
    const invocationEgressStatus = protocolStringValueV01(item.egress_status);
    const invocationSources = Array.isArray(item.source_refs)
      ? item.source_refs
      : [];
    if (
      invocationEgressStatus &&
      invocationEgressStatus !== "unknown" &&
      invocationSources.length === 0
    ) {
      addError(
        accumulator,
        "model_egress_source_missing",
        `${path}.source_refs`,
        "Non-unknown model invocation egress requires a provenance source reference.",
      );
    }
    if (
      invocationEgressStatus === "occurred" &&
      item.provider_ref === null &&
      !invocationSources.some(isDestinationIdentifyingRef)
    ) {
      addError(
        accumulator,
        "model_egress_destination_missing",
        `${path}.provider_ref`,
        "Occurred model invocation egress requires a provider or destination-identifying reference.",
      );
    }
    if (
      item.retention_class !== null &&
      !protocolStringValueV01(item.retention_class)
    ) {
      addError(
        accumulator,
        "model_retention_class_invalid",
        `${path}.retention_class`,
        "Model retention_class must be null or a non-empty string.",
      );
    }
    for (const key of ["raw_prompt_persisted", "raw_response_persisted", "hidden_reasoning_persisted"]) {
      if (item[key] !== false) addError(accumulator, "model_payload_persistence_forbidden", `${path}.${key}`, `${key} must be false.`, true);
    }
    for (const key of ["input_units", "output_units", "latency_ms", "retry_count"]) {
      if (item[key] !== null && (!Number.isFinite(item[key]) || Number(item[key]) < 0)) {
        addError(accumulator, "model_invocation_metric_invalid", `${path}.${key}`, `${key} must be a non-negative number or null.`);
      }
    }
    if (recordedAt !== null && finished !== null && finished > recordedAt) addWarning(accumulator, "remote_clock_skew_possible", `${path}.finished_at`, "Invocation finish time is later than recorded_at; remote clock skew may exist.");
  }
}

function validateModelInvocationEntryV02(
  item: ProtocolJsonRecordV01,
  root: ProtocolJsonRecordV01,
  recordedAt: number | null,
  path: string,
  accumulator: ValidationAccumulator,
): string | null {
  rejectUnknownNestedKeysV01(
    item,
    allowedModelInvocationEntryV02Keys,
    path,
    accumulator,
  );
  if (item.entry_version !== RUN_RECEIPT_MODEL_INVOCATION_ENTRY_VERSION_V02) {
    addError(
      accumulator,
      "model_invocation_entry_version_invalid",
      `${path}.entry_version`,
      "Model invocation entry uses an unsupported version.",
    );
  }
  validateExternalRefStructureV01(
    item.invocation_ref,
    `${path}.invocation_ref`,
    issueSink(accumulator),
  );
  validateExternalRefStructureV01(
    item.work_ref,
    `${path}.work_ref`,
    issueSink(accumulator),
  );
  validateExternalRefStructureV01(
    item.run_ref,
    `${path}.run_ref`,
    issueSink(accumulator),
  );
  validateRefArray(item.source_refs, `${path}.source_refs`, accumulator);
  if (item.retry_count !== 0) {
    addError(
      accumulator,
      "model_invocation_retry_forbidden",
      `${path}.retry_count`,
      "R4 model invocation entries require retry_count 0.",
    );
  }

  let receipt;
  try {
    receipt = validateModelInvocationReceiptV02(item.invocation_receipt);
  } catch {
    addError(
      accumulator,
      "model_invocation_receipt_invalid",
      `${path}.invocation_receipt`,
      "Embedded ModelInvocationReceipt is invalid.",
      true,
    );
    return null;
  }
  const invocationRef = isProtocolRecordV01(item.invocation_ref)
    ? item.invocation_ref
    : null;
  const workRef = isProtocolRecordV01(item.work_ref) ? item.work_ref : null;
  const runRef = isProtocolRecordV01(item.run_ref) ? item.run_ref : null;
  const outerWorkRef = isProtocolRecordV01(root.work_ref)
    ? root.work_ref
    : null;
  if (
    receipt.invocation_origin !== "policy_triggered" ||
    receipt.workspace_id !== protocolStringValueV01(root.workspace_id) ||
    receipt.project_id !== protocolStringValueV01(root.project_id) ||
    receipt.run_id !== protocolStringValueV01(root.run_id) ||
    receipt.work_id === null ||
    invocationRef?.ref_type !== "model_invocation" ||
    invocationRef.external_id !== receipt.invocation_id ||
    workRef?.ref_type !== "work" ||
    workRef.external_id !== receipt.work_id ||
    runRef?.ref_type !== "automation_run" ||
    runRef.external_id !== receipt.run_id ||
    outerWorkRef?.external_id !== receipt.work_id
  ) {
    addError(
      accumulator,
      "model_invocation_run_binding_mismatch",
      path,
      "Model invocation entry must bind the exact canonical workspace, project, work, and run.",
      true,
    );
  }
  const finished = parseStrictIsoTimestampV01(receipt.finished_at);
  if (recordedAt !== null && finished !== null && finished > recordedAt) {
    addWarning(
      accumulator,
      "remote_clock_skew_possible",
      `${path}.invocation_receipt.finished_at`,
      "Invocation finish time is later than recorded_at; clock skew may exist.",
    );
  }
  return receipt.invocation_id;
}

function validatePrivacyEgress(input: ProtocolJsonRecordV01, accumulator: ValidationAccumulator) {
  const privacy = recordAt(input.privacy_egress, "$.privacy_egress", accumulator);
  if (!privacy) return;
  rejectUnknownNestedKeysV01(
    privacy,
    allowedPrivacyEgressKeys,
    "$.privacy_egress",
    accumulator,
  );
  const status = protocolStringValueV01(privacy.egress_status);
  const basis = protocolStringValueV01(privacy.basis);
  enumValue(
    privacy.data_classification,
    new Set(["public_safe", "private", "local_only", "secret"]),
    "$.privacy_egress.data_classification",
    "data_classification_invalid",
    accumulator,
  );
  if (!status || !new Set(["occurred", "did_not_occur", "blocked", "unknown"]).has(status)) addError(accumulator, "egress_status_invalid", "$.privacy_egress.egress_status", "Unknown egress status.");
  basisValue(basis, "$.privacy_egress.basis", accumulator);
  const destinations = arrayAt(privacy.destination_refs, "$.privacy_egress.destination_refs", accumulator);
  const sources = arrayAt(privacy.source_refs, "$.privacy_egress.source_refs", accumulator);
  validateRefArray(
    privacy.destination_refs,
    "$.privacy_egress.destination_refs",
    accumulator,
  );
  validateRefArray(
    privacy.source_refs,
    "$.privacy_egress.source_refs",
    accumulator,
  );
  enumValue(
    privacy.redaction_status,
    new Set(["applied", "not_needed", "not_applied", "unknown"]),
    "$.privacy_egress.redaction_status",
    "redaction_status_invalid",
    accumulator,
  );
  stringArray(privacy.notes, "$.privacy_egress.notes", accumulator);
  if (
    privacy.retention_class !== null &&
    !protocolStringValueV01(privacy.retention_class)
  ) {
    addError(
      accumulator,
      "retention_class_invalid",
      "$.privacy_egress.retention_class",
      "retention_class must be null or a non-empty string.",
    );
  }
  if (status === "occurred" && destinations.length === 0) addError(accumulator, "egress_destination_missing", "$.privacy_egress.destination_refs", "Occurred egress requires a destination reference.");
  if (status && status !== "unknown" && basis === "unknown") addError(accumulator, "egress_claim_basis_inconsistent", "$.privacy_egress.basis", "Non-unknown egress requires an observed, attested, or mixed basis.");
  if (status && status !== "unknown" && sources.length === 0) addError(accumulator, "egress_source_missing", "$.privacy_egress.source_refs", "Non-unknown egress requires at least one provenance source reference.");
  if (
    status === "did_not_occur" &&
    destinations.length > 0 &&
    !hasEgressDestinationJustification(input.warnings)
  ) {
    addError(
      accumulator,
      "did_not_occur_destination_unjustified",
      "$.privacy_egress.destination_refs",
      "did_not_occur must not claim a destination without an explicit source warning.",
    );
  }
  if (status === "unknown" && basis !== "unknown") addWarning(accumulator, "egress_unknown_with_source_basis", "$.privacy_egress", "Egress remains unknown despite a non-unknown source basis.");
  if (status && status !== "unknown" && basis && basis !== "unknown") {
    validateBasisSourceSupport(
      basis,
      privacy.source_refs,
      new Set([
        ...refIdentitySet(input.observer_refs),
        ...refIdentitySet(input.verifier_refs),
      ]),
      attestationReporterIdentitySet(input.attestations),
      "$.privacy_egress",
      accumulator,
    );
  }
  for (const key of ["raw_prompt_persisted", "raw_output_persisted", "raw_transcript_persisted", "secret_material_persisted"]) {
    if (privacy[key] !== false) addError(accumulator, "privacy_persistence_invariant_violated", `$.privacy_egress.${key}`, `${key} must be false.`, true);
  }
}

function validateCostUsage(input: ProtocolJsonRecordV01, accumulator: ValidationAccumulator) {
  const cost = recordAt(input.cost_usage, "$.cost_usage", accumulator);
  if (!cost) return;
  rejectUnknownNestedKeysV01(
    cost,
    allowedCostUsageKeys,
    "$.cost_usage",
    accumulator,
  );
  const basis = protocolStringValueV01(cost.cost_basis);
  const amount = cost.cost_amount;
  const currency = protocolStringValueV01(cost.currency);
  const measurementBases = new Set(["measured", "attested", "estimated", "unknown"]);
  if (!basis || !measurementBases.has(basis)) addError(accumulator, "cost_basis_invalid", "$.cost_usage.cost_basis", "Unknown cost basis.");
  if (basis === "unknown" && amount !== null) addError(accumulator, "unknown_cost_must_be_null", "$.cost_usage.cost_amount", "Unknown cost must be null, not zero or another number.");
  if (basis === "unknown" && cost.currency !== null) addError(accumulator, "unknown_cost_currency_must_be_null", "$.cost_usage.currency", "Unknown cost currency must be null.");
  if (basis && basis !== "unknown" && amount === null) addError(accumulator, "cost_amount_missing", "$.cost_usage.cost_amount", "Non-unknown cost requires a numeric amount.");
  if (basis && basis !== "unknown" && !currency) addError(accumulator, "cost_currency_missing", "$.cost_usage.currency", "Measured, attested, or estimated cost requires a currency.");
  if (amount !== null && (!Number.isFinite(amount) || Number(amount) < 0)) addError(accumulator, "cost_amount_invalid", "$.cost_usage.cost_amount", "Cost amount must be finite, non-negative, or null.");
  const usage = recordAt(cost.usage, "$.cost_usage.usage", accumulator);
  if (!usage) return;
  rejectUnknownNestedKeysV01(
    usage,
    allowedUsageKeys,
    "$.cost_usage.usage",
    accumulator,
  );
  const usageBasis = protocolStringValueV01(usage.basis);
  const counts = [usage.input_units, usage.output_units, usage.total_units];
  if (!usageBasis || !measurementBases.has(usageBasis)) addError(accumulator, "usage_basis_invalid", "$.cost_usage.usage.basis", "Unknown usage basis.");
  if (usageBasis === "unknown" && counts.some((value) => value !== null)) addError(accumulator, "unknown_usage_must_be_null", "$.cost_usage.usage", "Unknown usage values must be null, not zero.");
  if (usageBasis === "unknown" && usage.unit !== null) addError(accumulator, "unknown_usage_unit_must_be_null", "$.cost_usage.usage.unit", "Unknown usage unit must be null.");
  if (usageBasis && usageBasis !== "unknown" && counts.every((value) => value === null)) addError(accumulator, "usage_counts_missing", "$.cost_usage.usage", "Non-unknown usage requires at least one count.");
  if (usageBasis && usageBasis !== "unknown" && !protocolStringValueV01(usage.unit)) addError(accumulator, "usage_unit_missing", "$.cost_usage.usage.unit", "Measured, attested, or estimated usage requires a unit.");
  for (const [index, count] of counts.entries()) {
    if (count !== null && (!Number.isFinite(count) || Number(count) < 0)) {
      addError(
        accumulator,
        "usage_value_invalid",
        `$.cost_usage.usage.${["input_units", "output_units", "total_units"][index]}`,
        "Usage values must be finite, non-negative, or null.",
      );
    }
  }
  validateRefArray(cost.source_refs, "$.cost_usage.source_refs", accumulator);
}

function validateCapabilityCoverage(
  input: ProtocolJsonRecordV01,
  accumulator: ValidationAccumulator,
) {
  const entries = arrayAt(
    input.capability_coverage,
    "$.capability_coverage",
    accumulator,
  );
  entries.forEach((candidate, index) => {
    const path = `$.capability_coverage[${index}]`;
    const item = recordAt(candidate, path, accumulator);
    if (!item) return;
    rejectUnknownNestedKeysV01(
      item,
      allowedCapabilityCoverageKeys,
      path,
      accumulator,
    );
    requireString(item, "capability", path, accumulator);
    enumValue(
      item.coverage_level,
      new Set(["enforced", "observed", "advisory", "outside_coverage"]),
      `${path}.coverage_level`,
      "coverage_level_invalid",
      accumulator,
    );
    validateExternalRefStructureV01(
      item.source_ref,
      `${path}.source_ref`,
      issueSink(accumulator),
      true,
    );
    stringArray(item.notes, `${path}.notes`, accumulator);
  });
}

function validateTrustSummary(input: ProtocolJsonRecordV01, accumulator: ValidationAccumulator) {
  const trustSummary = recordAt(
    input.trust_summary,
    "$.trust_summary",
    accumulator,
  );
  if (trustSummary) {
    rejectUnknownNestedKeysV01(
      trustSummary,
      allowedTrustSummaryKeys,
      "$.trust_summary",
      accumulator,
    );
  }
  const observations = Array.isArray(input.observations) ? input.observations.filter(isObservation).map((item) => item as unknown as RunReceiptObservationV01) : [];
  const attestations = Array.isArray(input.attestations) ? input.attestations.filter(isAttestation).map((item) => item as unknown as RunReceiptAttestationV01) : [];
  const expected = deriveRunReceiptTrustSummaryV01(observations, attestations);
  if (canonicalizeProtocolValueV01(input.trust_summary) !== canonicalizeProtocolValueV01(expected)) {
    addError(accumulator, "trust_summary_mismatch", "$.trust_summary", "Trust summary must be derived from receipt observations and attestations.");
  }
}

function validateAuthority(input: ProtocolJsonRecordV01, accumulator: ValidationAccumulator) {
  const authority = recordAt(input.authority_summary, "$.authority_summary", accumulator);
  if (!authority) return;
  rejectUnknownNestedKeysV01(
    authority,
    allowedAuthoritySummaryKeys,
    "$.authority_summary",
    accumulator,
  );
  stringArray(authority.notes, "$.authority_summary.notes", accumulator);
  const expected = createRunReceiptAuthoritySummaryV01(
    Array.isArray(authority.notes) ? authority.notes.filter((value): value is string => typeof value === "string") : [],
  );
  rejectUnknownProtocolKeysV01(
    authority,
    new Set(Object.keys(expected)),
    "$.authority_summary",
    issueSink(accumulator),
    "authority_boundary_violation",
    true,
  );
  for (const key of Object.keys(expected) as Array<keyof RunReceiptAuthoritySummaryV01>) {
    if (key === "notes") continue;
    if (authority[key] !== false) {
      addError(accumulator, "authority_boundary_violation", `$.authority_summary.${key}`, `${key} must remain false.`, true);
    }
  }
}

function validateIntegrity(input: ProtocolJsonRecordV01, accumulator: ValidationAccumulator) {
  const integrity = recordAt(input.integrity, "$.integrity", accumulator);
  if (!integrity) return;
  rejectUnknownNestedKeysV01(
    integrity,
    allowedIntegrityKeys,
    "$.integrity",
    accumulator,
  );
  const typed = input as unknown as RunReceiptV01;
  if (protocolStringValueV01(input.idempotency_key) !== createRunReceiptIdempotencyKeyV01(typed)) addError(accumulator, "idempotency_key_mismatch", "$.idempotency_key", "RunReceipt idempotency key does not match its canonical identity inputs.");
  if (protocolStringValueV01(input.receipt_id) !== deriveRunReceiptIdV01(typed)) addError(accumulator, "receipt_identity_mismatch", "$.receipt_id", "RunReceipt receipt_id is inconsistent with its deterministic identity.");
  if (protocolStringValueV01(integrity.fingerprint) !== createRunReceiptFingerprintV01(typed)) addError(accumulator, "fingerprint_mismatch", "$.integrity.fingerprint", "RunReceipt fingerprint does not match its normalized content.");
  if (integrity.algorithm !== "sha256" || integrity.canonicalization !== RUN_RECEIPT_CANONICALIZATION_V01 || integrity.fingerprint_scope !== "receipt_without_integrity_fingerprint") addError(accumulator, "integrity_metadata_invalid", "$.integrity", "RunReceipt integrity metadata is invalid.");
}

function scanAbsoluteLocalPaths(value: unknown, path: string, accumulator: ValidationAccumulator) {
  walk(value, path, (candidate, candidatePath) => {
    if (
      typeof candidate === "string" &&
      /^(?:file:\/\/|\/(?!\/)|[A-Za-z]:[\\/])/.test(candidate)
    ) {
      addError(accumulator, "absolute_local_path_forbidden", candidatePath, "Absolute local paths are forbidden; use a repository-relative ExternalRef.", true);
    }
  });
}

function validateRefArray(value: unknown, path: string, accumulator: ValidationAccumulator) {
  const refs = arrayAt(value, path, accumulator);
  refs.forEach((ref, index) => validateExternalRefStructureV01(ref, `${path}[${index}]`, issueSink(accumulator)));
}

function refIdentitySet(value: unknown): Set<string> {
  return new Set((Array.isArray(value) ? value : []).map(refIdentity).filter((identity): identity is string => Boolean(identity)));
}

function changedArtifactIdentitySet(value: unknown): Set<string> {
  return new Set(
    (Array.isArray(value) ? value : [])
      .map((item) =>
        isProtocolRecordV01(item) ? refIdentity(item.artifact_ref) : null,
      )
      .filter((identity): identity is string => Boolean(identity)),
  );
}

function attestationReporterIdentitySet(value: unknown): Set<string> {
  return new Set(
    (Array.isArray(value) ? value : [])
      .map((item) =>
        isProtocolRecordV01(item) ? refIdentity(item.reporter_ref) : null,
      )
      .filter((identity): identity is string => Boolean(identity)),
  );
}

function isDestinationIdentifyingRef(value: unknown): boolean {
  if (!isProtocolRecordV01(value)) return false;
  const refType = protocolStringValueV01(value.ref_type);
  return Boolean(
    refType && /(?:provider|destination|egress_target|host)/i.test(refType),
  );
}

function hasEgressDestinationJustification(value: unknown): boolean {
  return (Array.isArray(value) ? value : []).some(
    (item) =>
      isProtocolRecordV01(item) &&
      item.code === "egress_destination_justified" &&
      Array.isArray(item.source_refs) &&
      item.source_refs.length > 0,
  );
}

function refIdentity(value: unknown): string | null {
  if (!isProtocolRecordV01(value)) return null;
  const type = protocolStringValueV01(value.ref_type);
  const id = protocolStringValueV01(value.external_id);
  if (!type || !id) return null;
  return canonicalizeProtocolValueV01({ type, id, provider: protocolStringValueV01(value.provider), host: protocolStringValueV01(value.host), namespace: protocolStringValueV01(value.compatibility_namespace) });
}

function idSet(value: unknown, field: string): Set<string> {
  return new Set((Array.isArray(value) ? value : []).map((item) => isProtocolRecordV01(item) ? protocolStringValueV01(item[field]) : null).filter((id): id is string => Boolean(id)));
}

function walk(value: unknown, path: string, visit: (value: unknown, path: string) => void) {
  visit(value, path);
  if (Array.isArray(value)) value.forEach((child, index) => walk(child, `${path}[${index}]`, visit));
  else if (isProtocolRecordV01(value)) Object.entries(value).forEach(([key, child]) => walk(child, `${path}.${key}`, visit));
}

function recordAt(value: unknown, path: string, accumulator: ValidationAccumulator): ProtocolJsonRecordV01 | null {
  if (!isProtocolRecordV01(value)) {
    addError(accumulator, "object_malformed", path, "Expected an object.");
    return null;
  }
  return value;
}

function rejectUnknownNestedKeysV01(
  record: ProtocolJsonRecordV01,
  allowed: ReadonlySet<string>,
  path: string,
  accumulator: ValidationAccumulator,
) {
  for (const key of Object.keys(record)) {
    if (allowed.has(key)) continue;
    const blocked = forbiddenSemanticFieldPattern.test(key);
    addError(
      accumulator,
      blocked ? "forbidden_semantic_field" : "unknown_nested_field",
      `${path}.${key}`,
      blocked
        ? `Unknown field ${key} attempts a forbidden authority or state semantic.`
        : `Field ${key} is not part of this nested RunReceipt v0.1 contract.`,
      blocked,
    );
  }
}

function arrayAt(value: unknown, path: string, accumulator: ValidationAccumulator): unknown[] {
  if (!Array.isArray(value)) {
    addError(accumulator, "array_malformed", path, "Expected an array.");
    return [];
  }
  return value;
}

function stringArray(value: unknown, path: string, accumulator: ValidationAccumulator): string[] {
  const array = arrayAt(value, path, accumulator);
  if (array.some((item) => !protocolStringValueV01(item))) addError(accumulator, "string_array_malformed", path, "Expected non-empty strings.");
  return array.map(protocolStringValueV01).filter((item): item is string => Boolean(item));
}

function validateNullableStringV01(
  value: unknown,
  path: string,
  accumulator: ValidationAccumulator,
) {
  if (value === null) return;
  if (typeof value !== "string" || value.trim().length === 0) {
    addError(
      accumulator,
      "nullable_string_malformed",
      path,
      "Expected null or a non-empty string.",
    );
  }
}

function requireString(record: ProtocolJsonRecordV01, field: string, path: string, accumulator: ValidationAccumulator): string | null {
  const value = protocolStringValueV01(record[field]);
  if (!value) addError(accumulator, `${field}_missing`, `${path}.${field}`, `${field} must be a non-empty string.`);
  return value;
}

function requireTimestamp(value: unknown, path: string, accumulator: ValidationAccumulator): number | null {
  const parsed = parseStrictIsoTimestampV01(value);
  if (parsed === null) addError(accumulator, "timestamp_invalid", path, "Expected a valid ISO-8601 timestamp with timezone.");
  return parsed;
}

function optionalTimestamp(value: unknown, path: string, accumulator: ValidationAccumulator): number | null {
  return value === null || value === undefined ? null : requireTimestamp(value, path, accumulator);
}

function validateTimeOrder(started: number | null, finished: number | null, startedPath: string, finishedPath: string, accumulator: ValidationAccumulator) {
  if (started !== null && finished !== null && started > finished) addError(accumulator, "time_order_invalid", finishedPath, `${finishedPath} must not be earlier than ${startedPath}.`);
}

function basisValue(value: unknown, path: string, accumulator: ValidationAccumulator) {
  enumValue(value, statusBases, path, "status_basis_invalid", accumulator);
}

function enumValue(value: unknown, values: ReadonlySet<string>, path: string, code: string, accumulator: ValidationAccumulator) {
  const text = protocolStringValueV01(value);
  if (!text || !values.has(text)) addError(accumulator, code, path, "Value is outside the v0.1 contract.");
}

function isObservation(value: unknown): boolean {
  return isProtocolRecordV01(value) && observationTrustClasses.has(protocolStringValueV01(value.trust_class) ?? "");
}

function isAttestation(value: unknown): boolean {
  return isProtocolRecordV01(value) && attestationTrustClasses.has(protocolStringValueV01(value.trust_class) ?? "");
}

function createAccumulator(): ValidationAccumulator {
  return { errors: [], warnings: [], blocked: false };
}

function issueSink(accumulator: ValidationAccumulator) {
  return {
    error(code: string, path: string | null, message: string, blocked = false) {
      addError(accumulator, code, path, message, blocked);
    },
    warning(code: string, path: string | null, message: string) {
      addWarning(accumulator, code, path, message);
    },
  };
}

function addError(accumulator: ValidationAccumulator, code: string, path: string | null, message: string, blocked = false) {
  accumulator.errors.push({ severity: "error", code, path, message });
  if (blocked) accumulator.blocked = true;
}

function addWarning(accumulator: ValidationAccumulator, code: string, path: string | null, message: string) {
  accumulator.warnings.push({ severity: "warning", code, path, message });
}

function buildValidationResult(accumulator: ValidationAccumulator, version: typeof RUN_RECEIPT_VERSION_V01 | null): RunReceiptValidationResultV01 {
  return {
    status: accumulator.blocked ? "blocked" : accumulator.errors.length ? "invalid" : "valid",
    normalized_protocol_version: version,
    errors: accumulator.errors,
    warnings: accumulator.warnings,
  };
}
