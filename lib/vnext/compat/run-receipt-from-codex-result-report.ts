import type {
  CodexResultReportIngestionRecordV01,
  CodexResultReportStatusV01,
} from "@/lib/dogfooding/codex-result-report-normalizer";
import {
  canonicalizeProtocolValueV01,
  createProtocolSha256V01,
  isProtocolRecordV01,
  parseStrictIsoTimestampV01,
  protocolStringValueV01,
} from "@/lib/vnext/protocol-primitives";
import {
  validateLegacyResultMappingInputKeysV01,
  validateLegacyResultRawOptionalExternalRefsV01,
} from "@/lib/vnext/compat/legacy-result-mapping-primitives";
import {
  classifyCodexResultArtifactRefV01,
  validateCodexResultReportRecordForRunReceiptV01,
  type CodexResultReportSourceValidationV01,
  type CodexResultRunReceiptMappingIssueV01,
} from "@/lib/vnext/compat/codex-result-report-source-validator";
import {
  buildRunReceiptV01,
  validateRunReceiptV01,
  type RunReceiptBuilderInputV01,
} from "@/lib/vnext/run-receipt";
import {
  EXTERNAL_REF_VERSION_V01,
  type ExternalRefTrustClassV01,
  type ExternalRefV01,
} from "@/types/vnext/external-ref";
import type {
  RunReceiptAttestationV01,
  RunReceiptChangedArtifactV01,
  RunReceiptCheckResultV01,
  RunReceiptIssueV01,
  RunReceiptV01,
} from "@/types/vnext/run-receipt";

const COMPATIBILITY_NAMESPACE =
  "augnes.codex-result-report-ingestion.v0.1";
const dataClassifications = new Set<string>([
  "public_safe",
  "private",
  "local_only",
  "secret",
]);
const allowedMappingInputKeys = new Set([
  "workspace_id",
  "project_id",
  "run_id",
  "recorded_at",
  "data_classification",
  "source_record",
  "work_ref",
  "task_context_packet_ref",
  "host_ref",
  "worker_ref",
]);
export {
  validateCodexResultReportRecordForRunReceiptV01,
  type CodexResultReportSourceValidationV01,
  type CodexResultRunReceiptMappingIssueV01,
} from "@/lib/vnext/compat/codex-result-report-source-validator";

export interface CodexResultReportRunReceiptInputV01 {
  workspace_id: string;
  project_id: string;
  run_id: string;
  recorded_at: string;
  data_classification: RunReceiptV01["privacy_egress"]["data_classification"];
  source_record: CodexResultReportIngestionRecordV01;
  work_ref?: ExternalRefV01 | null;
  task_context_packet_ref?: ExternalRefV01 | null;
  host_ref?: ExternalRefV01 | null;
  worker_ref?: ExternalRefV01 | null;
}

export interface CodexResultReportRunReceiptMappingResultV01 {
  status: "mapped" | "blocked" | "invalid";
  receipt: RunReceiptV01 | null;
  errors: CodexResultRunReceiptMappingIssueV01[];
  warnings: CodexResultRunReceiptMappingIssueV01[];
  source_record_fingerprint: string | null;
  normalized_source_status: CodexResultReportStatusV01 | null;
}

export function mapCodexResultReportRecordToRunReceiptV01(
  input: CodexResultReportRunReceiptInputV01,
): CodexResultReportRunReceiptMappingResultV01;
export function mapCodexResultReportRecordToRunReceiptV01(
  input: unknown,
): CodexResultReportRunReceiptMappingResultV01;
export function mapCodexResultReportRecordToRunReceiptV01(
  input: unknown,
): CodexResultReportRunReceiptMappingResultV01 {
  if (!isProtocolRecordV01(input)) {
    return invalidMappingResult({
      severity: "error",
      code: "mapping_input_not_object",
      path: "$",
      message: "RunReceipt compatibility mapping input must be an object.",
    });
  }

  const inputKeyValidation = validateLegacyResultMappingInputKeysV01(
    input,
    allowedMappingInputKeys,
  );
  if (inputKeyValidation.errors.length > 0) {
    return {
      status: inputKeyValidation.blocked ? "blocked" : "invalid",
      receipt: null,
      errors: inputKeyValidation.errors,
      warnings: [],
      source_record_fingerprint: null,
      normalized_source_status: null,
    };
  }

  const externalRefValidation =
    validateLegacyResultRawOptionalExternalRefsV01(input);
  if (externalRefValidation.errors.length > 0) {
    return {
      status: externalRefValidation.blocked ? "blocked" : "invalid",
      receipt: null,
      errors: externalRefValidation.errors,
      warnings: externalRefValidation.warnings,
      source_record_fingerprint: null,
      normalized_source_status: null,
    };
  }

  const inputErrors: CodexResultRunReceiptMappingIssueV01[] = [];
  for (const field of ["workspace_id", "project_id", "run_id"] as const) {
    if (!protocolStringValueV01(input[field])) {
      inputErrors.push({
        severity: "error",
        code: `${field}_missing`,
        path: `$.${field}`,
        message: `${field} must be explicitly supplied as a non-empty string.`,
      });
    }
  }
  if (parseStrictIsoTimestampV01(input.recorded_at) === null) {
    inputErrors.push({ severity: "error", code: "recorded_at_invalid", path: "$.recorded_at", message: "recorded_at must be an explicit ISO-8601 timestamp with timezone." });
  }
  if (!dataClassifications.has(protocolStringValueV01(input.data_classification) ?? "")) {
    inputErrors.push({ severity: "error", code: "data_classification_invalid", path: "$.data_classification", message: "data_classification must be explicitly supplied from the RunReceipt v0.1 set." });
  }

  const hasSourceRecord =
    Object.prototype.hasOwnProperty.call(input, "source_record") &&
    input.source_record !== undefined &&
    input.source_record !== null;
  if (!hasSourceRecord) {
    inputErrors.push({
      severity: "error",
      code: "source_record_missing",
      path: "$.source_record",
      message: "source_record must be explicitly supplied.",
    });
  }
  const sourceValidation: CodexResultReportSourceValidationV01 = hasSourceRecord
    ? validateCodexResultReportRecordForRunReceiptV01(input.source_record)
    : {
        status: "invalid",
        normalized_source_status: null,
        source_record_fingerprint: null,
        errors: [],
        warnings: [],
      };
  const errors = [...inputErrors, ...sourceValidation.errors];
  const warnings = sourceValidation.warnings;
  if (errors.length > 0) {
    return {
      status: sourceValidation.status === "blocked" ? "blocked" : "invalid",
      receipt: null,
      errors,
      warnings,
      source_record_fingerprint: sourceValidation.source_record_fingerprint,
      normalized_source_status: sourceValidation.normalized_source_status,
    };
  }

  let receipt: RunReceiptV01;
  try {
    receipt = buildMappedReceipt(
      input as unknown as CodexResultReportRunReceiptInputV01,
    );
  } catch {
    return invalidMappingResult(
      {
        severity: "error",
        code: "mapping_build_failed",
        path: null,
        message: "Malformed compatibility input could not be normalized safely.",
      },
      sourceValidation,
      warnings,
    );
  }
  const receiptValidation = validateRunReceiptV01(receipt);
  if (receiptValidation.status !== "valid") {
    return {
      status: receiptValidation.status === "blocked" ? "blocked" : "invalid",
      receipt: null,
      errors: receiptValidation.errors,
      warnings: [...warnings, ...receiptValidation.warnings],
      source_record_fingerprint: sourceValidation.source_record_fingerprint,
      normalized_source_status: sourceValidation.normalized_source_status,
    };
  }

  return {
    status: "mapped",
    receipt,
    errors: [],
    warnings: [...warnings, ...receiptValidation.warnings],
    source_record_fingerprint: sourceValidation.source_record_fingerprint,
    normalized_source_status: sourceValidation.normalized_source_status,
  };
}

function buildMappedReceipt(
  input: CodexResultReportRunReceiptInputV01,
): RunReceiptV01 {
  const source = input.source_record;
  const sourceRecordRef = externalRef(
    "normalized_codex_result_report_record",
    source.report_id,
    "imported_unverified",
    source.reported_at,
    source.report_fingerprint,
  );
  const operatorRef = externalRef(
    "operator_actor",
    source.operator_actor_ref,
    "user_declaration",
    source.reported_at,
    source.report_id,
  );
  const metadataRefs = [
    externalRef("legacy_scope", source.scope, "imported_unverified"),
    externalRef("source_record_status", source.status, "imported_unverified"),
    externalRef("source_report_kind", source.report_kind, "imported_unverified"),
    externalRef(
      "source_record_fingerprint",
      source.report_fingerprint,
      "imported_unverified",
    ),
  ];
  const gitRefs = [
    ...sortedStrings(source.pr_refs).map((value) =>
      externalRef("github_pull_request", value, "imported_unverified"),
    ),
    externalRef("git_branch", source.branch_ref, "imported_unverified"),
    ...sortedStrings(source.commit_refs).map((value) =>
      externalRef("git_commit", value, "imported_unverified"),
    ),
  ];
  const legacySourceRefs = sortedStrings(source.source_refs).map((value) =>
    externalRef("legacy_source_ref", value, "imported_unverified"),
  );
  const allFileValues = sortedStrings([
    ...source.observed_file_refs,
    ...source.changed_file_refs,
  ]);
  const artifactRefs = allFileValues.map((value) =>
    externalRef(
      classifyCodexResultArtifactRefV01(value) === "legacy_artifact_ref"
        ? "legacy_artifact_ref"
        : "repository_relative_path",
      value,
      "imported_unverified",
      source.reported_at,
      source.report_id,
    ),
  );
  const artifactByValue = new Map(
    artifactRefs.map((ref) => [ref.external_id, ref]),
  );

  const attestations: RunReceiptAttestationV01[] = [
    attestation(
      "source_summary",
      source.normalized_summary,
      sourceRecordRef,
      source.reported_at,
      [],
    ),
    attestation(
      "source_record_status",
      `Legacy source status: ${source.status}.`,
      sourceRecordRef,
      source.reported_at,
      metadataRefs,
    ),
  ];
  addClaimAttestations(
    attestations,
    "observed_file_claim",
    source.observed_file_refs,
    sourceRecordRef,
    source.reported_at,
    artifactByValue,
  );
  addClaimAttestations(
    attestations,
    "changed_file_claim",
    source.changed_file_refs,
    sourceRecordRef,
    source.reported_at,
    artifactByValue,
  );
  addClaimAttestations(
    attestations,
    "observed_check_claim",
    source.observed_check_refs,
    sourceRecordRef,
    source.reported_at,
  );
  addClaimAttestations(
    attestations,
    "skipped_check_claim",
    source.skipped_check_refs,
    sourceRecordRef,
    source.reported_at,
  );
  addClaimAttestations(
    attestations,
    "known_warning_claim",
    source.known_warning_refs,
    sourceRecordRef,
    source.reported_at,
  );
  addClaimAttestations(
    attestations,
    "not_done_claim",
    source.not_done_refs,
    sourceRecordRef,
    source.reported_at,
  );
  addClaimAttestations(
    attestations,
    "expected_observed_delta_claim",
    source.expected_observed_delta_refs,
    sourceRecordRef,
    source.reported_at,
  );

  const changedArtifacts: RunReceiptChangedArtifactV01[] = sortedStrings(
    source.changed_file_refs,
  ).map((value) => ({
    artifact_ref: requiredArtifactRef(artifactByValue, value),
    change_kind: "unknown",
    before_hash: null,
    after_hash: null,
    basis: "attested",
    related_observation_ids: [],
    related_attestation_ids: [stableId("attestation", "changed_file_claim", value)],
    source_refs: [sourceRecordRef],
  }));

  const checks: RunReceiptCheckResultV01[] = sortedStrings(
    source.observed_check_refs,
  ).map((value) => ({
    check_id: stableId("check", "legacy_observed_check", value),
    required: false,
    status: "unknown",
    basis: "attested",
    summary: boundedText(`Legacy check claim: ${value}`),
    source_refs: [sourceRecordRef],
  }));

  const topLevelWarnings: RunReceiptIssueV01[] = sortedStrings(
    source.known_warning_refs,
  ).map((value) => issue("legacy_known_warning", value, sourceRecordRef));
  if (source.status === "needs_operator_review") {
    topLevelWarnings.push(
      issue(
        "legacy_operator_review_required",
        "The normalized legacy source requires operator review.",
        sourceRecordRef,
      ),
    );
  }
  const gaps = [
    ...sortedStrings(source.not_done_refs).map((value) =>
      issue("legacy_not_done", value, sourceRecordRef),
    ),
    ...sortedStrings(source.expected_observed_delta_refs).map((value) =>
      issue("legacy_expected_observed_delta", value, sourceRecordRef),
    ),
    ...sortedStrings(source.skipped_check_refs).map((value) =>
      issue(
        "legacy_skipped_check_unstructured",
        `Skipped-check claim requires structured review: ${value}`,
        sourceRecordRef,
      ),
    ),
  ];

  const compatibilityWarnings = sortedStrings([
    "Legacy Codex result material remains candidate-only imported claims.",
    "No legacy field creates a direct or verified observation.",
    "The mapper does not infer execution completion or verification success.",
    ...source.boundary_notes.map((note) => `Legacy boundary note: ${note}`),
    ...source.reason_codes.map((code) => `Legacy reason code: ${code}`),
    `Legacy privacy guard ${source.privacy_report.guard_version}: ${source.privacy_report.status}.`,
    ...source.review_cues.map(
      (cue) =>
        `Legacy review cue ${cue.cue_kind}: ${cue.public_safe_summary}`,
    ),
  ]);
  const allExternalRefs = [
    sourceRecordRef,
    operatorRef,
    ...metadataRefs,
    ...gitRefs,
    ...legacySourceRefs,
    ...artifactRefs,
    input.host_ref ?? null,
    input.worker_ref ?? null,
  ].filter((value): value is ExternalRefV01 => value !== null);

  const receiptInput: RunReceiptBuilderInputV01 = {
    workspace_id: input.workspace_id,
    project_id: input.project_id,
    run_id: input.run_id,
    work_ref: input.work_ref ?? null,
    task_context_packet_ref: input.task_context_packet_ref ?? null,
    recorded_at: input.recorded_at,
    started_at: null,
    finished_at: null,
    execution: {
      status: "unknown",
      basis: "attested",
      source_refs: [sourceRecordRef],
    },
    verification: {
      status: "unknown",
      basis: "attested",
      required_check_ids: [],
      source_refs: [sourceRecordRef],
    },
    reporter_ref: sourceRecordRef,
    observer_refs: [],
    verifier_refs: [],
    host_ref: input.host_ref ?? null,
    worker_ref: input.worker_ref ?? null,
    model_invocations: [],
    execution_environment: {
      environment_kind: "unknown",
      host_ref: input.host_ref ?? null,
      worker_ref: input.worker_ref ?? null,
      operating_system: null,
      runtime_labels: ["legacy-result-report-compatibility"],
      source_refs: [sourceRecordRef],
    },
    observations: [],
    attestations,
    changed_artifacts: changedArtifacts,
    commands: [],
    checks,
    skipped_checks: [],
    external_refs: allExternalRefs,
    result_summary: {
      summary: source.normalized_summary,
      outcome: null,
      limitations: [
        "Imported legacy report claims are not direct observations.",
        "Receipt does not establish proof, accepted Evidence, approval, or project-state completion.",
        "Execution and verification outcomes remain unknown.",
      ],
    },
    blockers: [],
    warnings: topLevelWarnings,
    gaps,
    privacy_egress: {
      data_classification: input.data_classification,
      egress_status: "unknown",
      basis: "unknown",
      destination_refs: [],
      redaction_status: "applied",
      retention_class: null,
      raw_prompt_persisted: false,
      raw_output_persisted: false,
      raw_transcript_persisted: false,
      secret_material_persisted: false,
      source_refs: [],
      notes: [
        "Source normalization privacy is known; original run egress remains unknown.",
        "Mapper purity does not prove that the represented run had no egress.",
      ],
    },
    cost_usage: {
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
    },
    capability_coverage: [
      coverage(
        "run_execution_observation",
        "outside_coverage",
        sourceRecordRef,
      ),
      coverage(
        "artifact_change_verification",
        "advisory",
        sourceRecordRef,
      ),
      coverage("check_verification", "advisory", sourceRecordRef),
      coverage("authority_enforcement", "outside_coverage", sourceRecordRef),
    ],
    source_refs: [sourceRecordRef, ...legacySourceRefs],
    artifact_refs: artifactRefs,
    compatibility: {
      source_contracts: [source.record_version],
      unmapped_fields: [
        {
          source_field: "execution_status",
          reason: "Legacy normalized report has no direct execution telemetry.",
        },
        {
          source_field: "verification_status",
          reason: "Flattened diagnostic claims cannot establish verification status.",
        },
        ...(source.skipped_check_refs.length > 0
          ? [
              {
                source_field: "skipped_check_refs",
                reason:
                  "Flattened strings lack stable structured identity, requiredness, and a discrete skip reason.",
              },
            ]
          : []),
        ...(source.observed_file_refs.length > 0
          ? [
              {
                source_field: "observed_file_refs",
                reason:
                  "Legacy observed naming lacks independent observer provenance; values remain attestations.",
              },
            ]
          : []),
        ...(source.observed_check_refs.length > 0
          ? [
              {
                source_field: "observed_check_refs",
                reason:
                  "Legacy observed naming lacks verifier provenance; checks remain optional and unknown.",
              },
            ]
          : []),
      ],
      warnings: compatibilityWarnings,
      external_refs: [sourceRecordRef, ...metadataRefs, ...gitRefs, operatorRef],
    },
    authority_notes: [
      "Legacy source authority boundary was validated as closed before mapping.",
      "Legacy report references and review cues grant no RunReceipt authority.",
    ],
  };
  return buildRunReceiptV01(receiptInput);
}

function addClaimAttestations(
  output: RunReceiptAttestationV01[],
  kind: string,
  values: string[],
  reporter: ExternalRefV01,
  reportedAt: string,
  artifactByValue?: ReadonlyMap<string, ExternalRefV01>,
) {
  for (const value of sortedStrings(values)) {
    const subject = artifactByValue?.get(value);
    output.push(
      attestation(
        kind,
        boundedText(`Legacy ${kind.replaceAll("_", " ")}: ${value}`),
        reporter,
        reportedAt,
        subject ? [subject] : [],
        value,
      ),
    );
  }
}

function attestation(
  kind: string,
  summary: string,
  reporter: ExternalRefV01,
  reportedAt: string,
  subjects: ExternalRefV01[],
  identityValue = summary,
): RunReceiptAttestationV01 {
  return {
    attestation_id: stableId("attestation", kind, identityValue),
    attestation_kind: kind,
    summary: boundedText(summary),
    reported_at: reportedAt,
    reporter_ref: reporter,
    trust_class: "imported_unverified",
    source_refs: [reporter],
    subject_refs: subjects,
  };
}

function issue(
  code: string,
  summary: string,
  sourceRef: ExternalRefV01,
): RunReceiptIssueV01 {
  return { code, summary: boundedText(summary), source_refs: [sourceRef] };
}

function coverage(
  capability: string,
  coverageLevel: "advisory" | "outside_coverage",
  sourceRef: ExternalRefV01,
) {
  return {
    capability,
    coverage_level: coverageLevel,
    source_ref: sourceRef,
    notes: [
      coverageLevel === "advisory"
        ? "Legacy report claims are review cues and do not verify or enforce behavior."
        : "The compatibility mapper does not observe or enforce the represented run.",
    ],
  };
}

function externalRef(
  refType: string,
  externalId: string,
  trustClass: ExternalRefTrustClassV01,
  observedAt?: string,
  sourceRef?: string,
): ExternalRefV01 {
  return {
    ref_version: EXTERNAL_REF_VERSION_V01,
    ref_type: refType,
    external_id: externalId,
    trust_class: trustClass,
    ...(observedAt ? { observed_at: observedAt } : {}),
    ...(sourceRef ? { source_ref: sourceRef } : {}),
    compatibility_namespace: COMPATIBILITY_NAMESPACE,
  };
}

function requiredArtifactRef(
  refs: ReadonlyMap<string, ExternalRefV01>,
  value: string,
): ExternalRefV01 {
  const ref = refs.get(value);
  if (!ref) throw new Error("Internal deterministic artifact mapping failed.");
  return ref;
}

function stableId(prefix: string, kind: string, value: string): string {
  const hash = createProtocolSha256V01(
    canonicalizeProtocolValueV01({ kind, value }),
  );
  return `${prefix}:${hash.slice("sha256:".length, 31)}`;
}

function boundedText(value: string): string {
  const normalized = value.replace(/\s+/g, " ").trim();
  return normalized.length <= 240
    ? normalized
    : `${normalized.slice(0, 237)}...`;
}

function sortedStrings(values: Iterable<string>): string[] {
  return [...new Set(values)].sort();
}

function invalidMappingResult(
  issue: CodexResultRunReceiptMappingIssueV01,
  sourceValidation?: CodexResultReportSourceValidationV01,
  warnings: CodexResultRunReceiptMappingIssueV01[] = [],
): CodexResultReportRunReceiptMappingResultV01 {
  return {
    status: "invalid",
    receipt: null,
    errors: [issue],
    warnings,
    source_record_fingerprint:
      sourceValidation?.source_record_fingerprint ?? null,
    normalized_source_status:
      sourceValidation?.normalized_source_status ?? null,
  };
}
