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
import {
  RUN_RECEIPT_ATTESTATION_TRUST_CLASSES_V01,
  RUN_RECEIPT_CANONICALIZATION_V01,
  RUN_RECEIPT_EXECUTION_STATUSES_V01,
  RUN_RECEIPT_OBSERVATION_TRUST_CLASSES_V01,
  RUN_RECEIPT_STATUS_BASES_V01,
  RUN_RECEIPT_VERIFICATION_STATUSES_V01,
  RUN_RECEIPT_VERSION_V01,
  type RunReceiptAttestationV01,
  type RunReceiptAuthoritySummaryV01,
  type RunReceiptChangedArtifactV01,
  type RunReceiptCheckResultV01,
  type RunReceiptCommandSummaryV01,
  type RunReceiptIssueV01,
  type RunReceiptModelInvocationSummaryV01,
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
      ...input.privacy_egress,
      retention_class: normalizeProtocolNullableTextV01(
        input.privacy_egress.retention_class,
      ),
      destination_refs: normalizeRefs(input.privacy_egress.destination_refs),
      source_refs: normalizeRefs(input.privacy_egress.source_refs),
      notes: uniqueProtocolStringsV01(input.privacy_egress.notes),
    },
    cost_usage: {
      ...input.cost_usage,
      currency: normalizeProtocolNullableTextV01(input.cost_usage.currency),
      usage: {
        ...input.cost_usage.usage,
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
  scanForbiddenProtocolMaterialV01(
    input,
    "$",
    sink,
    {
      secret_material_message: "Secret-shaped material is forbidden in RunReceipt.",
      provider_specific_field_message:
        "Provider-native identifiers must remain ExternalRef values; run_id is the explicit Augnes identity.",
      allowed_canonical_identity_paths: new Set(["$.run_id"]),
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
    enumValue(
      environment.environment_kind,
      new Set(["local", "remote", "hybrid", "unknown"]),
      "$.execution_environment.environment_kind",
      "execution_environment_kind_invalid",
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
    requireString(summary, "summary", "$.result_summary", accumulator);
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
      ...item,
      observation_id: normalizeProtocolTextV01(item.observation_id),
      observation_kind: normalizeProtocolTextV01(item.observation_kind),
      summary: normalizeProtocolTextV01(item.summary),
      event_at: normalizeProtocolNullableTextV01(item.event_at),
      observed_at: normalizeProtocolTextV01(item.observed_at),
      observer_ref: normalizeExternalRefPrimitiveV01(item.observer_ref),
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
      ...item,
      attestation_id: normalizeProtocolTextV01(item.attestation_id),
      attestation_kind: normalizeProtocolTextV01(item.attestation_kind),
      summary: normalizeProtocolTextV01(item.summary),
      reported_at: normalizeProtocolTextV01(item.reported_at),
      reporter_ref: normalizeExternalRefPrimitiveV01(item.reporter_ref),
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
      ...item,
      command_id: normalizeProtocolTextV01(item.command_id),
      summary: normalizeProtocolTextV01(item.summary),
      command_fingerprint: normalizeProtocolNullableTextV01(
        item.command_fingerprint,
      ),
      started_at: normalizeProtocolNullableTextV01(item.started_at),
      finished_at: normalizeProtocolNullableTextV01(item.finished_at),
      source_refs: normalizeRefs(item.source_refs),
      raw_output_included: false as const,
    })),
  ).sort(compareProtocolCanonicalV01);
}

function normalizeChecks(values: RunReceiptCheckResultV01[]): RunReceiptCheckResultV01[] {
  return uniqueProtocolValuesV01(
    values.map((item) => ({
      ...item,
      check_id: normalizeProtocolTextV01(item.check_id),
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
      ...item,
      check_id: normalizeProtocolTextV01(item.check_id),
      reason: normalizeProtocolTextV01(item.reason),
      source_refs: normalizeRefs(item.source_refs),
    })),
  ).sort(compareProtocolCanonicalV01);
}

function normalizeChangedArtifacts(
  values: RunReceiptChangedArtifactV01[],
): RunReceiptChangedArtifactV01[] {
  return uniqueProtocolValuesV01(
    values.map((item) => ({
      ...item,
      artifact_ref: normalizeExternalRefPrimitiveV01(item.artifact_ref),
      before_hash: normalizeProtocolNullableTextV01(item.before_hash),
      after_hash: normalizeProtocolNullableTextV01(item.after_hash),
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
  values: RunReceiptModelInvocationSummaryV01[],
): RunReceiptModelInvocationSummaryV01[] {
  return uniqueProtocolValuesV01(
    values.map((item) => ({
      ...item,
      invocation_ref: normalizeExternalRefPrimitiveV01(item.invocation_ref),
      provider_ref: normalizeNullableRef(item.provider_ref),
      model_ref: normalizeNullableRef(item.model_ref),
      started_at: normalizeProtocolNullableTextV01(item.started_at),
      finished_at: normalizeProtocolNullableTextV01(item.finished_at),
      retention_class: normalizeProtocolNullableTextV01(item.retention_class),
      raw_prompt_persisted: false as const,
      raw_response_persisted: false as const,
      hidden_reasoning_persisted: false as const,
      source_refs: normalizeRefs(item.source_refs),
    })),
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
    enumValue(execution.status, executionStatuses, "$.execution.status", "execution_status_invalid", accumulator);
    basisValue(execution.basis, "$.execution.basis", accumulator);
    validateRefArray(execution.source_refs, "$.execution.source_refs", accumulator);
  }
  if (verification) {
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
  for (const [index, value] of observations.entries()) {
    const path = `$.observations[${index}]`;
    const item = recordAt(value, path, accumulator);
    if (!item) continue;
    requireString(item, "observation_id", path, accumulator);
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
  for (const [index, value] of attestations.entries()) {
    const path = `$.attestations[${index}]`;
    const item = recordAt(value, path, accumulator);
    if (!item) continue;
    requireString(item, "attestation_id", path, accumulator);
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
  for (const [index, value] of commands.entries()) {
    const path = `$.commands[${index}]`;
    const item = recordAt(value, path, accumulator);
    if (!item) continue;
    requireString(item, "command_id", path, accumulator);
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
  const requiredNonPassingChecks = new Set<string>();
  for (const [index, value] of checks.entries()) {
    const path = `$.checks[${index}]`;
    const item = recordAt(value, path, accumulator);
    if (!item) continue;
    const checkId = requireString(item, "check_id", path, accumulator);
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
  const requiredSkippedIds = new Set<string>();
  for (const [index, value] of skipped.entries()) {
    const path = `$.skipped_checks[${index}]`;
    const item = recordAt(value, path, accumulator);
    if (!item) continue;
    const checkId = requireString(item, "check_id", path, accumulator);
    const reason = requireString(item, "reason", path, accumulator);
    if (reason && /^(?:not run|skipped|n\/?a|none)$/i.test(reason)) {
      addError(accumulator, "skipped_check_reason_insufficient", `${path}.reason`, "Skipped check requires a concrete reason.");
    }
    if (typeof item.required !== "boolean") addError(accumulator, "check_required_invalid", `${path}.required`, "Skipped check required must be boolean.");
    basisValue(item.basis, `${path}.basis`, accumulator);
    validateRefArray(item.source_refs, `${path}.source_refs`, accumulator);
    if (checkId) {
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

function validateChangedArtifacts(input: ProtocolJsonRecordV01, accumulator: ValidationAccumulator) {
  const observations = idSet(input.observations, "observation_id");
  const attestations = idSet(input.attestations, "attestation_id");
  const artifacts = arrayAt(input.changed_artifacts, "$.changed_artifacts", accumulator);
  for (const [index, value] of artifacts.entries()) {
    const path = `$.changed_artifacts[${index}]`;
    const item = recordAt(value, path, accumulator);
    if (!item) continue;
    validateExternalRefStructureV01(item.artifact_ref, `${path}.artifact_ref`, issueSink(accumulator));
    enumValue(
      item.change_kind,
      new Set(["added", "modified", "deleted", "renamed", "unknown"]),
      `${path}.change_kind`,
      "artifact_change_kind_invalid",
      accumulator,
    );
    basisValue(item.basis, `${path}.basis`, accumulator);
    const observationIds = stringArray(item.related_observation_ids, `${path}.related_observation_ids`, accumulator);
    const attestationIds = stringArray(item.related_attestation_ids, `${path}.related_attestation_ids`, accumulator);
    if ((item.basis === "observed" || item.basis === "mixed") && !observationIds.some((id) => observations.has(id))) {
      addError(accumulator, "artifact_observation_provenance_missing", `${path}.related_observation_ids`, "Observed artifact change requires a related observation.");
    }
    if ((item.basis === "attested" || item.basis === "mixed") && !attestationIds.some((id) => attestations.has(id))) {
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
  for (const [index, value] of invocations.entries()) {
    const path = `$.model_invocations[${index}]`;
    const item = recordAt(value, path, accumulator);
    if (!item) continue;
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

function validatePrivacyEgress(input: ProtocolJsonRecordV01, accumulator: ValidationAccumulator) {
  const privacy = recordAt(input.privacy_egress, "$.privacy_egress", accumulator);
  if (!privacy) return;
  const status = protocolStringValueV01(privacy.egress_status);
  const basis = protocolStringValueV01(privacy.basis);
  if (!status || !new Set(["occurred", "did_not_occur", "blocked", "unknown"]).has(status)) addError(accumulator, "egress_status_invalid", "$.privacy_egress.egress_status", "Unknown egress status.");
  basisValue(basis, "$.privacy_egress.basis", accumulator);
  const destinations = arrayAt(privacy.destination_refs, "$.privacy_egress.destination_refs", accumulator);
  if (status === "occurred" && destinations.length === 0) addError(accumulator, "egress_destination_missing", "$.privacy_egress.destination_refs", "Occurred egress requires a destination reference.");
  if (status === "did_not_occur" && basis === "unknown") addError(accumulator, "egress_claim_basis_inconsistent", "$.privacy_egress.basis", "did_not_occur requires an observed, attested, or mixed basis.");
  if (status === "unknown" && basis !== "unknown") addWarning(accumulator, "egress_unknown_with_source_basis", "$.privacy_egress", "Egress remains unknown despite a non-unknown source basis.");
  for (const key of ["raw_prompt_persisted", "raw_output_persisted", "raw_transcript_persisted", "secret_material_persisted"]) {
    if (privacy[key] !== false) addError(accumulator, "privacy_persistence_invariant_violated", `$.privacy_egress.${key}`, `${key} must be false.`, true);
  }
}

function validateCostUsage(input: ProtocolJsonRecordV01, accumulator: ValidationAccumulator) {
  const cost = recordAt(input.cost_usage, "$.cost_usage", accumulator);
  if (!cost) return;
  const basis = protocolStringValueV01(cost.cost_basis);
  const amount = cost.cost_amount;
  const currency = protocolStringValueV01(cost.currency);
  if (!basis || !new Set(["measured", "attested", "estimated", "unknown"]).has(basis)) addError(accumulator, "cost_basis_invalid", "$.cost_usage.cost_basis", "Unknown cost basis.");
  if (basis === "unknown" && amount !== null) addError(accumulator, "unknown_cost_must_be_null", "$.cost_usage.cost_amount", "Unknown cost must be null, not zero or another number.");
  if (basis !== "unknown" && amount !== null && !currency) addError(accumulator, "cost_currency_missing", "$.cost_usage.currency", "Measured, attested, or estimated cost requires a currency.");
  if (amount !== null && (!Number.isFinite(amount) || Number(amount) < 0)) addError(accumulator, "cost_amount_invalid", "$.cost_usage.cost_amount", "Cost amount must be non-negative or null.");
  const usage = recordAt(cost.usage, "$.cost_usage.usage", accumulator);
  if (!usage) return;
  const usageBasis = protocolStringValueV01(usage.basis);
  const counts = [usage.input_units, usage.output_units, usage.total_units];
  if (usageBasis === "unknown" && counts.some((value) => value !== null)) addError(accumulator, "unknown_usage_must_be_null", "$.cost_usage.usage", "Unknown usage values must be null, not zero.");
  if (usageBasis !== "unknown" && counts.some((value) => value !== null) && !protocolStringValueV01(usage.unit)) addError(accumulator, "usage_unit_missing", "$.cost_usage.usage.unit", "Measured, attested, or estimated usage requires a unit.");
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
