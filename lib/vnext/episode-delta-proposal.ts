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
import { validateCriterionAssessmentV01 } from "@/lib/vnext/criterion-assessment";
import {
  normalizeStrategicAdvantageTransferProfileV01,
  validateStrategicAdvantageTransferProfileV01,
} from "@/lib/vnext/strategic-advantage-transfer-protocol";
import type { ExternalRefV01 } from "@/types/vnext/external-ref";
import {
  EPISODE_DELTA_PROPOSAL_ATTESTATION_TRUST_CLASSES_V01,
  EPISODE_DELTA_PROPOSAL_CANONICALIZATION_V01,
  EPISODE_DELTA_PROPOSAL_DELTA_TYPES_V01,
  EPISODE_DELTA_PROPOSAL_OBSERVATION_TRUST_CLASSES_V01,
  EPISODE_DELTA_PROPOSAL_OPERATIONS_V01,
  EPISODE_DELTA_PROPOSAL_STATUSES_V01,
  EPISODE_DELTA_PROPOSAL_VERSION_V01,
  OPERATION_AWARE_PROPOSAL_REVISION_PROFILE_VERSION_V01,
  RUN_ASSESSMENT_PROPOSAL_PROFILE_VERSION_V01,
  RUN_ASSESSMENT_PROPOSAL_SOURCE_MAX_CANONICAL_UTF8_BYTES_V01,
  RUN_ASSESSMENT_PROPOSAL_SOURCE_MAX_TEXT_CHARACTERS_V01,
  type EpisodeDeltaProposalAttestationV01,
  type EpisodeDeltaProposalAuthoritySummaryV01,
  type EpisodeDeltaProposalConflictV01,
  type EpisodeDeltaProposalDeltaCandidateV01,
  type EpisodeDeltaProposalInferenceV01,
  type EpisodeDeltaProposalMaterialBoundaryV01,
  type EpisodeDeltaProposalMissingInformationV01,
  type EpisodeDeltaProposalObservationV01,
  type EpisodeDeltaProposalOperationRevisionV01,
  type EpisodeDeltaProposalSourceAssessmentV01,
  type EpisodeDeltaProposalTrustSummaryV01,
  type EpisodeDeltaProposalUncertaintyV01,
  type EpisodeDeltaProposalV01,
  type EpisodeDeltaProposalValidationIssueV01,
  type EpisodeDeltaProposalValidationResultV01,
} from "@/types/vnext/episode-delta-proposal";
import type { StrategicAdvantageTransferProfileV01 } from "@/types/vnext/strategic-advantage-transfer";

const PENDING_PROPOSAL_ID = "episode-delta-proposal:pending";
const PENDING_FINGERPRINT = "sha256:pending";

const proposalStatuses = new Set<string>(
  EPISODE_DELTA_PROPOSAL_STATUSES_V01,
);
const deltaTypes = new Set<string>(
  EPISODE_DELTA_PROPOSAL_DELTA_TYPES_V01,
);
const operations = new Set<string>(
  EPISODE_DELTA_PROPOSAL_OPERATIONS_V01,
);
const observationTrustClasses = new Set<string>(
  EPISODE_DELTA_PROPOSAL_OBSERVATION_TRUST_CLASSES_V01,
);
const attestationTrustClasses = new Set<string>(
  EPISODE_DELTA_PROPOSAL_ATTESTATION_TRUST_CLASSES_V01,
);

const allowedRootKeys = new Set([
  "proposal_version",
  "proposal_id",
  "workspace_id",
  "project_id",
  "created_at",
  "status",
  "bounded_summary",
  "task_context_packet_ref",
  "run_receipt_refs",
  "source_assessment",
  "operation_revision",
  "strategic_advantage_transfer",
  "observations",
  "attestations",
  "inferences",
  "proposed_deltas",
  "conflicts",
  "missing_information",
  "uncertainties",
  "limitations",
  "source_status",
  "source_refs",
  "compatibility",
  "trust_summary",
  "material_boundary",
  "authority_summary",
  "integrity",
]);
const allowedObservationKeys = new Set([
  "material_id",
  "material_kind",
  "bounded_summary",
  "event_at",
  "observed_at",
  "observer_ref",
  "trust_class",
  "source_run_receipt_refs",
  "source_refs",
  "subject_refs",
]);
const allowedAttestationKeys = new Set([
  "material_id",
  "material_kind",
  "bounded_summary",
  "reported_at",
  "reporter_ref",
  "trust_class",
  "source_run_receipt_refs",
  "source_refs",
  "subject_refs",
]);
const allowedInferenceKeys = new Set([
  "material_id",
  "material_kind",
  "bounded_summary",
  "inferred_at",
  "interpreter_ref",
  "trust_class",
  "basis_material_ids",
  "source_run_receipt_refs",
  "source_refs",
  "subject_refs",
]);
const allowedDeltaKeys = new Set([
  "candidate_id",
  "delta_type",
  "operation",
  "title",
  "current_state",
  "proposed_state_summary",
  "target_refs",
  "basis_material_ids",
  "source_refs",
  "uncertainties",
  "limitations",
  "review_required",
]);
const allowedCurrentStateKeys = new Set([
  "knowledge_status",
  "bounded_summary",
  "source_material_ids",
  "source_refs",
]);
const allowedConflictKeys = new Set([
  "conflict_id",
  "conflict_kind",
  "bounded_summary",
  "material_ids",
  "source_refs",
  "resolution_status",
  "automatically_resolved",
]);
const allowedMissingInformationKeys = new Set([
  "missing_id",
  "knowledge_status",
  "code",
  "bounded_summary",
  "related_material_ids",
  "related_delta_ids",
  "source_refs",
  "review_required",
]);
const allowedUncertaintyKeys = new Set([
  "uncertainty_id",
  "bounded_summary",
  "related_material_ids",
  "related_delta_ids",
  "source_refs",
]);
const allowedSourceStatusKeys = new Set([
  "coverage",
  "currentness",
  "as_of",
  "review_required",
  "basis",
  "source_refs",
]);
const allowedCompatibilityKeys = new Set([
  "source_contracts",
  "unmapped_fields",
  "warnings",
  "external_refs",
]);
const allowedUnmappedFieldKeys = new Set(["source_field", "reason"]);
const allowedTrustSummaryKeys = new Set([
  "direct_observations",
  "verified_external_observations",
  "host_attestations",
  "provider_reports",
  "user_declarations",
  "imported_unverified_items",
  "derived_interpretations",
]);
const allowedMaterialBoundaryKeys = new Set([
  "bounded_summaries_only",
  "max_summary_characters",
  "max_collection_items",
  "max_refs_per_collection",
  "raw_prompt_persisted",
  "raw_transcript_persisted",
  "raw_terminal_output_persisted",
  "raw_provider_output_persisted",
  "raw_artifact_content_persisted",
  "hidden_reasoning_persisted",
  "credential_or_secret_persisted",
]);
const allowedAuthoritySummaryKeys = new Set([
  "proposal_is_command",
  "proposal_is_canonical_project_state",
  "proposal_is_review_decision",
  "proposal_is_state_transition_receipt",
  "proposal_is_accepted_evidence",
  "proposal_is_proof",
  "proposal_is_approval",
  "status_commits_state",
  "performs_durable_transition",
  "creates_evidence",
  "applies_perspective",
  "promotes_reviewed_memory",
  "closes_work",
  "selects_next_context_automatically",
  "authorizes_execution",
  "authorizes_scheduling",
  "authorizes_retry",
  "authorizes_replay",
  "authorizes_deployment",
  "authorizes_provider_calls",
  "authorizes_github_mutation",
  "authorizes_merge",
  "authorizes_publication",
  "authorizes_external_actuation",
  "authorizes_external_side_effects",
  "writes_database",
  "confidence_or_agreement_grants_authority",
  "source_validation_grants_authority",
  "fingerprint_verification_grants_authority",
  "changed_files_grant_authority",
  "passed_checks_grant_authority",
  "pull_request_presence_grants_authority",
  "notes",
]);
const allowedIntegrityKeys = new Set([
  "algorithm",
  "canonicalization",
  "fingerprint_scope",
  "fingerprint",
]);
const allowedSourceAssessmentKeys = new Set([
  "admission_profile",
  "admission_idempotency_key",
  "source_material_boundary",
  "work_ref",
  "run_ref",
  "packet_ref",
  "receipt_ref",
  "assessment",
  "expected",
  "observed",
  "comparison",
  "authority",
]);
const allowedSourceMaterialBoundaryKeys = new Set([
  "canonical_encoding",
  "max_canonical_bytes",
  "max_text_characters",
  "truncation_allowed",
]);
const allowedExpectedMaterialKeys = new Set([
  "task_goal",
  "success_criteria",
  "required_checks",
  "expected_artifacts",
  "required_return_fields",
  "forbidden_actions",
  "data_classification",
]);
const allowedExpectedCriterionKeys = new Set(["criterion_id", "criterion"]);
const allowedObservedMaterialKeys = new Set([
  "execution",
  "verification",
  "commands",
  "checks",
  "skipped_checks",
  "changed_artifacts",
  "artifact_refs",
  "blockers",
  "warnings",
  "gaps",
  "result_summary",
  "capability_coverage",
  "trust_summary",
  "compatibility",
]);
const allowedComparisonKeys = new Set([
  "relation_policy",
  "criterion_specific_relations_available",
  "task_success_status",
  "execution_status_is_task_success",
  "gaps",
]);
const allowedSourceAssessmentAuthorityKeys = new Set([
  "authoritative",
  "creates_evidence",
  "validates_claims",
  "creates_decision",
  "applies_transition",
  "changes_semantic_state",
  "changes_later_context",
]);
const allowedOperationRevisionKeys = new Set([
  "revision_profile",
  "admission_idempotency_key",
  "source",
  "revised_candidate",
  "authored_by_ref",
  "author_basis_refs",
  "rationale_summary",
  "selected_delta_type",
  "selected_operation",
  "target_expectations",
  "authority",
]);
const allowedOperationRevisionSourceKeys = new Set([
  "proposal_id",
  "proposal_fingerprint",
  "candidate_id",
  "candidate_fingerprint",
]);
const allowedOperationRevisionTargetExpectationKeys = new Set([
  "target_ref",
  "presence",
  "revision",
  "state_fingerprint",
  "source_transition_receipt_id",
  "source_transition_receipt_fingerprint",
]);
const allowedOperationRevisionAuthorityKeys = new Set([
  "authoritative",
  "creates_evidence",
  "validates_claims",
  "creates_decision",
  "applies_transition",
  "changes_semantic_state",
  "changes_later_context",
]);

const forbiddenSemanticFieldPattern =
  /(?:accepted.?evidence|canonical.?state|review.?decision|state.?transition|state.?(?:apply|commit|mutat|write)|work.?(?:clos|complet)|perspective.?(?:apply|mutat)|memory.?(?:promot|mutat)|auto.?apply|next.?context.?(?:select|apply)|provider.?author|github.?author|merge|publish|publication|external.?(?:actuat|side.?effect)|schedule|retry|replay|deploy|execution.?authority|semantic.?commit|approv)/i;

const boundedTextFieldNames = new Set([
  "bounded_summary",
  "proposed_state_summary",
  "title",
  "basis",
  "reason",
  "warnings",
  "limitations",
  "uncertainties",
  "notes",
  "rationale_summary",
]);
const runAssessmentSourceTextFieldNames = new Set([
  "task_goal",
  "criterion",
  "summary",
  "reason",
  "outcome",
  "required_checks",
  "expected_artifacts",
  "required_return_fields",
  "forbidden_actions",
  "limitations",
  "notes",
  "warnings",
  "gaps",
  "uncertainty",
]);

export const EPISODE_DELTA_PROPOSAL_REQUIRED_CORE_FIELDS_V01 = [
  "proposal_version",
  "proposal_id",
  "workspace_id",
  "project_id",
  "created_at",
  "status",
  "bounded_summary",
  "task_context_packet_ref",
  "run_receipt_refs",
  "observations",
  "attestations",
  "inferences",
  "proposed_deltas",
  "conflicts",
  "missing_information",
  "uncertainties",
  "limitations",
  "source_status",
  "source_refs",
  "compatibility",
  "trust_summary",
  "material_boundary",
  "authority_summary",
  "integrity",
] as const;

export type EpisodeDeltaProposalBuilderInputV01 = Omit<
  EpisodeDeltaProposalV01,
  | "proposal_version"
  | "proposal_id"
  | "trust_summary"
  | "material_boundary"
  | "authority_summary"
  | "integrity"
> & {
  authority_notes?: string[];
};

type ValidationAccumulator = {
  errors: EpisodeDeltaProposalValidationIssueV01[];
  warnings: EpisodeDeltaProposalValidationIssueV01[];
  blocked: boolean;
};

export function buildEpisodeDeltaProposalV01(
  input: EpisodeDeltaProposalBuilderInputV01,
): EpisodeDeltaProposalV01 {
  const observations = normalizeObservations(input.observations);
  const attestations = normalizeAttestations(input.attestations);
  const inferences = normalizeInferences(input.inferences);
  const proposal: EpisodeDeltaProposalV01 = {
    proposal_version: EPISODE_DELTA_PROPOSAL_VERSION_V01,
    proposal_id: PENDING_PROPOSAL_ID,
    workspace_id: normalizeProtocolTextV01(input.workspace_id),
    project_id: normalizeProtocolTextV01(input.project_id),
    created_at: normalizeProtocolTextV01(input.created_at),
    status: input.status,
    bounded_summary: normalizeProtocolTextV01(input.bounded_summary),
    task_context_packet_ref: normalizeNullableRef(
      input.task_context_packet_ref,
    ),
    run_receipt_refs: normalizeRefs(input.run_receipt_refs),
    ...(input.source_assessment
      ? {
          source_assessment: normalizeSourceAssessmentV01(
            input.source_assessment,
          ),
        }
      : {}),
    ...(input.operation_revision
      ? {
          operation_revision: normalizeOperationRevisionV01(
            input.operation_revision,
          ),
        }
      : {}),
    ...(input.strategic_advantage_transfer
      ? {
          strategic_advantage_transfer:
            normalizeStrategicAdvantageTransferProfileV01(
              input.strategic_advantage_transfer,
            ),
        }
      : {}),
    observations,
    attestations,
    inferences,
    proposed_deltas: normalizeDeltas(input.proposed_deltas),
    conflicts: normalizeConflicts(input.conflicts),
    missing_information: normalizeMissingInformation(
      input.missing_information,
    ),
    uncertainties: normalizeUncertainties(input.uncertainties),
    limitations: uniqueProtocolStringsV01(input.limitations),
    source_status: {
      coverage: input.source_status.coverage,
      currentness: input.source_status.currentness,
      as_of: normalizeProtocolNullableTextV01(input.source_status.as_of),
      review_required: input.source_status.review_required,
      basis: normalizeProtocolTextV01(input.source_status.basis),
      source_refs: normalizeRefs(input.source_status.source_refs),
    },
    source_refs: normalizeRefs(input.source_refs),
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
    trust_summary: deriveEpisodeDeltaProposalTrustSummaryV01(
      observations,
      attestations,
      inferences,
    ),
    material_boundary: createEpisodeDeltaProposalMaterialBoundaryV01(),
    authority_summary: createEpisodeDeltaProposalAuthoritySummaryV01(
      input.authority_notes,
    ),
    integrity: {
      algorithm: "sha256",
      canonicalization: EPISODE_DELTA_PROPOSAL_CANONICALIZATION_V01,
      fingerprint_scope: "proposal_without_integrity_fingerprint",
      fingerprint: PENDING_FINGERPRINT,
    },
  };
  assertEpisodeDeltaProposalBuildBoundsV01(proposal);
  proposal.proposal_id = deriveEpisodeDeltaProposalIdV01(proposal);
  proposal.integrity.fingerprint =
    createEpisodeDeltaProposalFingerprintV01(proposal);
  return proposal;
}

export function createEpisodeDeltaProposalAuthoritySummaryV01(
  notes: string[] = [],
): EpisodeDeltaProposalAuthoritySummaryV01 {
  return {
    proposal_is_command: false,
    proposal_is_canonical_project_state: false,
    proposal_is_review_decision: false,
    proposal_is_state_transition_receipt: false,
    proposal_is_accepted_evidence: false,
    proposal_is_proof: false,
    proposal_is_approval: false,
    status_commits_state: false,
    performs_durable_transition: false,
    creates_evidence: false,
    applies_perspective: false,
    promotes_reviewed_memory: false,
    closes_work: false,
    selects_next_context_automatically: false,
    authorizes_execution: false,
    authorizes_scheduling: false,
    authorizes_retry: false,
    authorizes_replay: false,
    authorizes_deployment: false,
    authorizes_provider_calls: false,
    authorizes_github_mutation: false,
    authorizes_merge: false,
    authorizes_publication: false,
    authorizes_external_actuation: false,
    authorizes_external_side_effects: false,
    writes_database: false,
    confidence_or_agreement_grants_authority: false,
    source_validation_grants_authority: false,
    fingerprint_verification_grants_authority: false,
    changed_files_grant_authority: false,
    passed_checks_grant_authority: false,
    pull_request_presence_grants_authority: false,
    notes: uniqueProtocolStringsV01([
      "EpisodeDeltaProposal is reviewable candidate material, not canonical project state.",
      "ReviewDecision and StateTransitionReceipt remain separate contracts.",
      "Source validation, fingerprints, changed files, passed checks, pull requests, and confidence do not grant semantic authority.",
      ...notes,
    ]),
  };
}

export function createEpisodeDeltaProposalMaterialBoundaryV01(): EpisodeDeltaProposalMaterialBoundaryV01 {
  return {
    bounded_summaries_only: true,
    max_summary_characters: 2000,
    max_collection_items: 128,
    max_refs_per_collection: 64,
    raw_prompt_persisted: false,
    raw_transcript_persisted: false,
    raw_terminal_output_persisted: false,
    raw_provider_output_persisted: false,
    raw_artifact_content_persisted: false,
    hidden_reasoning_persisted: false,
    credential_or_secret_persisted: false,
  };
}

export function createRunAssessmentProposalSourceMaterialBoundaryV01() {
  return {
    canonical_encoding: "utf8" as const,
    max_canonical_bytes:
      RUN_ASSESSMENT_PROPOSAL_SOURCE_MAX_CANONICAL_UTF8_BYTES_V01,
    max_text_characters: RUN_ASSESSMENT_PROPOSAL_SOURCE_MAX_TEXT_CHARACTERS_V01,
    truncation_allowed: false as const,
  };
}

export interface RunAssessmentProposalSourceMaterialBoundViolationV01 {
  code: "run_assessment_proposal_source_material_bound_exceeded";
  path: string;
  message: string;
}

export function collectRunAssessmentProposalSourceMaterialBoundViolationsV01(
  source: unknown,
): RunAssessmentProposalSourceMaterialBoundViolationV01[] {
  const boundary = createRunAssessmentProposalSourceMaterialBoundaryV01();
  const violations: RunAssessmentProposalSourceMaterialBoundViolationV01[] = [];
  walk(source, "$.source_assessment", (candidate, path) => {
    if (
      typeof candidate === "string" &&
      isRunAssessmentSourceTextPathV01(path) &&
      candidate.length > boundary.max_text_characters
    ) {
      violations.push({
        code: "run_assessment_proposal_source_material_bound_exceeded",
        path,
        message: `Source-derived text exceeds ${boundary.max_text_characters} characters.`,
      });
    }
  });
  let canonicalBytes: number | null = null;
  try {
    canonicalBytes = new TextEncoder().encode(
      canonicalizeProtocolValueV01(source),
    ).byteLength;
  } catch {
    // Structural validation reports malformed protocol values separately.
  }
  if (
    canonicalBytes !== null &&
    canonicalBytes > boundary.max_canonical_bytes
  ) {
    violations.push({
      code: "run_assessment_proposal_source_material_bound_exceeded",
      path: "$.source_assessment",
      message: `Canonical source-assessment material exceeds ${boundary.max_canonical_bytes} UTF-8 bytes (${canonicalBytes}).`,
    });
  }
  return violations;
}

export function canonicalizeEpisodeDeltaProposalValueV01(
  value: unknown,
): string {
  return canonicalizeProtocolValueV01(value);
}

export function deriveEpisodeDeltaProposalIdV01(
  proposal: EpisodeDeltaProposalV01,
): string {
  const identityHash = createProtocolSha256V01(
    canonicalizeProtocolValueV01({
      ...withoutFingerprint(proposal),
      proposal_id: PENDING_PROPOSAL_ID,
    }),
  );
  return `episode-delta-proposal:${identityHash.slice("sha256:".length, 31)}`;
}

export function createEpisodeDeltaProposalFingerprintV01(
  proposal: EpisodeDeltaProposalV01,
): string {
  return createProtocolSha256V01(
    canonicalizeProtocolValueV01(withoutFingerprint(proposal)),
  );
}

export function deriveEpisodeDeltaProposalTrustSummaryV01(
  observations: EpisodeDeltaProposalObservationV01[],
  attestations: EpisodeDeltaProposalAttestationV01[],
  inferences: EpisodeDeltaProposalInferenceV01[],
): EpisodeDeltaProposalTrustSummaryV01 {
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
    derived_interpretations: inferences.filter(
      (item) => item.trust_class === "derived_interpretation",
    ).length,
  };
}

export function validateEpisodeDeltaProposalV01(
  input: unknown,
): EpisodeDeltaProposalValidationResultV01 {
  const accumulator = createAccumulator();
  const sink = issueSink(accumulator);
  scanForbiddenProtocolMaterialV01(input, "$", sink, {
    secret_material_message:
      "Secret-shaped material is forbidden in EpisodeDeltaProposal.",
    provider_specific_field_message:
      "Provider-native identifiers must remain ExternalRef values in EpisodeDeltaProposal.",
    allowed_canonical_identity_paths: new Set([
      "$.source_assessment.assessment.run_id",
      "$.strategic_advantage_transfer.assessment.run_id",
      "$.strategic_advantage_transfer.budget.model",
      "$.strategic_advantage_transfer.model_invocation.receipt.invocation_id",
      "$.strategic_advantage_transfer.model_invocation.receipt.run_id",
    ]),
    allowed_false_invariant_fields: new Set([
      "automatically_resolved",
      "raw_prompt_persisted",
      "raw_transcript_persisted",
      "raw_terminal_output_persisted",
      "raw_provider_output_persisted",
      "raw_artifact_content_persisted",
      "hidden_reasoning_persisted",
      "credential_or_secret_persisted",
    ]),
    additional_forbidden_raw_field_pattern:
      /^(?:raw_provider_output|raw_terminal_(?:output|log)|terminal_(?:dump|log)|stdout|stderr|environment_dump|credential_dump)$/,
    additional_provider_identity_pattern:
      /^(?:(?:github|openai|chatgpt|codex|claude|gemini)(?:_.+)?|(?:response|invocation|workflow|job|commit|pr)_id)$/,
  });
  scanAbsoluteLocalPaths(input, "$", accumulator);

  if (!isProtocolRecordV01(input)) {
    addError(
      accumulator,
      "proposal_not_object",
      "$",
      "EpisodeDeltaProposal must be an object.",
    );
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
  const version = protocolStringValueV01(input.proposal_version);
  if (version !== EPISODE_DELTA_PROPOSAL_VERSION_V01) {
    addError(
      accumulator,
      "unsupported_protocol_version",
      "$.proposal_version",
      `Unsupported EpisodeDeltaProposal protocol version: ${version ?? "missing"}.`,
      true,
    );
  }
  for (const field of EPISODE_DELTA_PROPOSAL_REQUIRED_CORE_FIELDS_V01) {
    if (input[field] === undefined) {
      addError(
        accumulator,
        `${field}_missing`,
        `$.${field}`,
        `${field} is required by EpisodeDeltaProposal v0.1.`,
      );
    }
  }

  requireString(input, "proposal_id", "$", accumulator);
  requireString(input, "workspace_id", "$", accumulator);
  requireString(input, "project_id", "$", accumulator);
  const createdAt = requireTimestamp(
    input.created_at,
    "$.created_at",
    accumulator,
  );
  requireString(input, "bounded_summary", "$", accumulator);
  const status = protocolStringValueV01(input.status);
  if (!status || !proposalStatuses.has(status)) {
    addError(
      accumulator,
      "proposal_status_invalid",
      "$.status",
      "Proposal status must remain draft or pending_review; decision outcomes belong to ReviewDecision.",
      true,
    );
  }

  validateAllExternalRefs(input, accumulator);
  validateTaskContextPacketRef(input.task_context_packet_ref, accumulator);
  const runReceiptIdentities = validateRunReceiptRefs(
    input.run_receipt_refs,
    accumulator,
  );
  validateSourceAssessmentV01(input, accumulator);
  validateOperationRevisionV01(input, accumulator);
  validateStrategicAdvantageTransferV01(input, accumulator);
  validateRefArray(input.source_refs, "$.source_refs", accumulator);
  validateDuplicateExternalRefsPrimitiveV01(input, sink);

  validateObservations(input.observations, createdAt, runReceiptIdentities, accumulator);
  validateAttestations(input.attestations, createdAt, runReceiptIdentities, accumulator);
  validateInferences(input.inferences, createdAt, runReceiptIdentities, accumulator);
  validateDeltas(input.proposed_deltas, accumulator);
  validateConflicts(input.conflicts, accumulator);
  validateMissingInformation(input.missing_information, accumulator);
  validateUncertainties(input.uncertainties, accumulator);
  stringArray(input.limitations, "$.limitations", accumulator);
  validateSourceStatus(input.source_status, accumulator);
  validateCompatibility(input.compatibility, accumulator);
  validateRelations(input, accumulator);
  validateTrustSummary(input, accumulator);
  validateMaterialBoundary(input.material_boundary, accumulator);
  validateAuthority(input.authority_summary, accumulator);
  validateBounds(input, accumulator);
  validateIntegrity(input, accumulator);

  return buildValidationResult(
    accumulator,
    version === EPISODE_DELTA_PROPOSAL_VERSION_V01
      ? EPISODE_DELTA_PROPOSAL_VERSION_V01
      : null,
  );
}

function withoutFingerprint(proposal: EpisodeDeltaProposalV01) {
  const { fingerprint: _fingerprint, ...integrity } = proposal.integrity;
  return { ...proposal, integrity };
}

function normalizeNullableRef(ref: ExternalRefV01 | null): ExternalRefV01 | null {
  return ref ? normalizeExternalRefPrimitiveV01(ref) : null;
}

function normalizeRefs(refs: ExternalRefV01[]): ExternalRefV01[] {
  return uniqueProtocolValuesV01(
    refs.map(normalizeExternalRefPrimitiveV01),
  ).sort(compareExternalRefsV01);
}

function normalizeSourceAssessmentV01(
  input: EpisodeDeltaProposalSourceAssessmentV01,
): EpisodeDeltaProposalSourceAssessmentV01 {
  const cloned = structuredClone(input);
  return {
    ...cloned,
    admission_profile: RUN_ASSESSMENT_PROPOSAL_PROFILE_VERSION_V01,
    admission_idempotency_key: normalizeProtocolTextV01(
      input.admission_idempotency_key,
    ),
    source_material_boundary:
      createRunAssessmentProposalSourceMaterialBoundaryV01(),
    work_ref: normalizeNullableRef(input.work_ref),
    run_ref: normalizeExternalRefPrimitiveV01(input.run_ref),
    packet_ref: normalizeExternalRefPrimitiveV01(input.packet_ref),
    receipt_ref: normalizeExternalRefPrimitiveV01(input.receipt_ref),
    expected: {
      task_goal: normalizeProtocolTextV01(input.expected.task_goal),
      success_criteria: uniqueProtocolValuesV01(
        input.expected.success_criteria.map((criterion) => ({
          criterion_id: normalizeProtocolTextV01(criterion.criterion_id),
          criterion: normalizeProtocolTextV01(criterion.criterion),
        })),
      ).sort(compareProtocolCanonicalV01),
      required_checks: uniqueProtocolStringsV01(
        input.expected.required_checks,
      ),
      expected_artifacts: uniqueProtocolStringsV01(
        input.expected.expected_artifacts,
      ),
      required_return_fields: uniqueProtocolStringsV01(
        input.expected.required_return_fields,
      ),
      forbidden_actions: uniqueProtocolStringsV01(
        input.expected.forbidden_actions,
      ),
      data_classification: input.expected.data_classification,
    },
    comparison: {
      relation_policy: "explicit_protocol_relations_only",
      criterion_specific_relations_available: false,
      task_success_status: "unknown",
      execution_status_is_task_success: false,
      gaps: uniqueProtocolStringsV01(input.comparison.gaps),
    },
    authority: {
      authoritative: false,
      creates_evidence: false,
      validates_claims: false,
      creates_decision: false,
      applies_transition: false,
      changes_semantic_state: false,
      changes_later_context: false,
    },
  };
}

function normalizeOperationRevisionV01(
  input: EpisodeDeltaProposalOperationRevisionV01,
): EpisodeDeltaProposalOperationRevisionV01 {
  return {
    revision_profile:
      OPERATION_AWARE_PROPOSAL_REVISION_PROFILE_VERSION_V01,
    admission_idempotency_key: normalizeProtocolTextV01(
      input.admission_idempotency_key,
    ),
    source: {
      proposal_id: normalizeProtocolTextV01(input.source.proposal_id),
      proposal_fingerprint: normalizeProtocolTextV01(
        input.source.proposal_fingerprint,
      ),
      candidate_id: normalizeProtocolTextV01(input.source.candidate_id),
      candidate_fingerprint: normalizeProtocolTextV01(
        input.source.candidate_fingerprint,
      ),
    },
    revised_candidate: {
      candidate_id: normalizeProtocolTextV01(
        input.revised_candidate.candidate_id,
      ),
      candidate_fingerprint: normalizeProtocolTextV01(
        input.revised_candidate.candidate_fingerprint,
      ),
    },
    authored_by_ref: normalizeExternalRefPrimitiveV01(input.authored_by_ref),
    author_basis_refs: normalizeRefs(input.author_basis_refs),
    rationale_summary: normalizeProtocolTextV01(input.rationale_summary),
    selected_delta_type: input.selected_delta_type,
    selected_operation: input.selected_operation,
    target_expectations: uniqueProtocolValuesV01(
      input.target_expectations.map((expectation) => ({
        target_ref: normalizeExternalRefPrimitiveV01(expectation.target_ref),
        presence: expectation.presence,
        revision: expectation.revision,
        state_fingerprint: normalizeProtocolNullableTextV01(
          expectation.state_fingerprint,
        ),
        source_transition_receipt_id: normalizeProtocolNullableTextV01(
          expectation.source_transition_receipt_id,
        ),
        source_transition_receipt_fingerprint: normalizeProtocolNullableTextV01(
          expectation.source_transition_receipt_fingerprint,
        ),
      })),
    ).sort(compareProtocolCanonicalV01),
    authority: {
      authoritative: false,
      creates_evidence: false,
      validates_claims: false,
      creates_decision: false,
      applies_transition: false,
      changes_semantic_state: false,
      changes_later_context: false,
    },
  };
}

function normalizeObservations(
  values: EpisodeDeltaProposalObservationV01[],
): EpisodeDeltaProposalObservationV01[] {
  return uniqueProtocolValuesV01(
    values.map((item) => ({
      material_id: normalizeProtocolTextV01(item.material_id),
      material_kind: normalizeProtocolTextV01(item.material_kind),
      bounded_summary: normalizeProtocolTextV01(item.bounded_summary),
      event_at: normalizeProtocolNullableTextV01(item.event_at),
      observed_at: normalizeProtocolTextV01(item.observed_at),
      observer_ref: normalizeExternalRefPrimitiveV01(item.observer_ref),
      trust_class: item.trust_class,
      source_run_receipt_refs: normalizeRefs(item.source_run_receipt_refs),
      source_refs: normalizeRefs(item.source_refs),
      subject_refs: normalizeRefs(item.subject_refs),
    })),
  ).sort(compareProtocolCanonicalV01);
}

function normalizeAttestations(
  values: EpisodeDeltaProposalAttestationV01[],
): EpisodeDeltaProposalAttestationV01[] {
  return uniqueProtocolValuesV01(
    values.map((item) => ({
      material_id: normalizeProtocolTextV01(item.material_id),
      material_kind: normalizeProtocolTextV01(item.material_kind),
      bounded_summary: normalizeProtocolTextV01(item.bounded_summary),
      reported_at: normalizeProtocolTextV01(item.reported_at),
      reporter_ref: normalizeExternalRefPrimitiveV01(item.reporter_ref),
      trust_class: item.trust_class,
      source_run_receipt_refs: normalizeRefs(item.source_run_receipt_refs),
      source_refs: normalizeRefs(item.source_refs),
      subject_refs: normalizeRefs(item.subject_refs),
    })),
  ).sort(compareProtocolCanonicalV01);
}

function normalizeInferences(
  values: EpisodeDeltaProposalInferenceV01[],
): EpisodeDeltaProposalInferenceV01[] {
  return uniqueProtocolValuesV01(
    values.map((item) => ({
      material_id: normalizeProtocolTextV01(item.material_id),
      material_kind: normalizeProtocolTextV01(item.material_kind),
      bounded_summary: normalizeProtocolTextV01(item.bounded_summary),
      inferred_at: normalizeProtocolTextV01(item.inferred_at),
      interpreter_ref: normalizeExternalRefPrimitiveV01(item.interpreter_ref),
      trust_class: item.trust_class,
      basis_material_ids: uniqueProtocolStringsV01(item.basis_material_ids),
      source_run_receipt_refs: normalizeRefs(item.source_run_receipt_refs),
      source_refs: normalizeRefs(item.source_refs),
      subject_refs: normalizeRefs(item.subject_refs),
    })),
  ).sort(compareProtocolCanonicalV01);
}

function normalizeDeltas(
  values: EpisodeDeltaProposalDeltaCandidateV01[],
): EpisodeDeltaProposalDeltaCandidateV01[] {
  return uniqueProtocolValuesV01(
    values.map((item) => ({
      candidate_id: normalizeProtocolTextV01(item.candidate_id),
      delta_type: item.delta_type,
      operation: item.operation,
      title: normalizeProtocolTextV01(item.title),
      current_state: {
        knowledge_status: item.current_state.knowledge_status,
        bounded_summary: normalizeProtocolNullableTextV01(
          item.current_state.bounded_summary,
        ),
        source_material_ids: uniqueProtocolStringsV01(
          item.current_state.source_material_ids,
        ),
        source_refs: normalizeRefs(item.current_state.source_refs),
      },
      proposed_state_summary: normalizeProtocolTextV01(
        item.proposed_state_summary,
      ),
      target_refs: normalizeRefs(item.target_refs),
      basis_material_ids: uniqueProtocolStringsV01(item.basis_material_ids),
      source_refs: normalizeRefs(item.source_refs),
      uncertainties: uniqueProtocolStringsV01(item.uncertainties),
      limitations: uniqueProtocolStringsV01(item.limitations),
      review_required: true as const,
    })),
  ).sort(compareProtocolCanonicalV01);
}

function normalizeConflicts(
  values: EpisodeDeltaProposalConflictV01[],
): EpisodeDeltaProposalConflictV01[] {
  return uniqueProtocolValuesV01(
    values.map((item) => ({
      conflict_id: normalizeProtocolTextV01(item.conflict_id),
      conflict_kind: normalizeProtocolTextV01(item.conflict_kind),
      bounded_summary: normalizeProtocolTextV01(item.bounded_summary),
      material_ids: uniqueProtocolStringsV01(item.material_ids),
      source_refs: normalizeRefs(item.source_refs),
      resolution_status: "unresolved" as const,
      automatically_resolved: false as const,
    })),
  ).sort(compareProtocolCanonicalV01);
}

function normalizeMissingInformation(
  values: EpisodeDeltaProposalMissingInformationV01[],
): EpisodeDeltaProposalMissingInformationV01[] {
  return uniqueProtocolValuesV01(
    values.map((item) => ({
      missing_id: normalizeProtocolTextV01(item.missing_id),
      knowledge_status: item.knowledge_status,
      code: normalizeProtocolTextV01(item.code),
      bounded_summary: normalizeProtocolTextV01(item.bounded_summary),
      related_material_ids: uniqueProtocolStringsV01(
        item.related_material_ids,
      ),
      related_delta_ids: uniqueProtocolStringsV01(item.related_delta_ids),
      source_refs: normalizeRefs(item.source_refs),
      review_required: true as const,
    })),
  ).sort(compareProtocolCanonicalV01);
}

function normalizeUncertainties(
  values: EpisodeDeltaProposalUncertaintyV01[],
): EpisodeDeltaProposalUncertaintyV01[] {
  return uniqueProtocolValuesV01(
    values.map((item) => ({
      uncertainty_id: normalizeProtocolTextV01(item.uncertainty_id),
      bounded_summary: normalizeProtocolTextV01(item.bounded_summary),
      related_material_ids: uniqueProtocolStringsV01(
        item.related_material_ids,
      ),
      related_delta_ids: uniqueProtocolStringsV01(item.related_delta_ids),
      source_refs: normalizeRefs(item.source_refs),
    })),
  ).sort(compareProtocolCanonicalV01);
}

function validateTaskContextPacketRef(
  value: unknown,
  accumulator: ValidationAccumulator,
) {
  validateExternalRefStructureV01(
    value,
    "$.task_context_packet_ref",
    issueSink(accumulator),
    true,
  );
  if (
    value !== null &&
    isProtocolRecordV01(value) &&
    value.ref_type !== "task_context_packet"
  ) {
    addError(
      accumulator,
      "task_context_packet_ref_type_invalid",
      "$.task_context_packet_ref.ref_type",
      "task_context_packet_ref must use ref_type task_context_packet.",
    );
  }
}

function validateSourceAssessmentV01(
  proposal: ProtocolJsonRecordV01,
  accumulator: ValidationAccumulator,
): void {
  if (proposal.source_assessment === undefined) return;
  const path = "$.source_assessment";
  const source = recordAt(proposal.source_assessment, path, accumulator);
  if (!source) return;
  rejectUnknownNestedKeys(
    source,
    allowedSourceAssessmentKeys,
    path,
    accumulator,
  );
  if (source.admission_profile !== RUN_ASSESSMENT_PROPOSAL_PROFILE_VERSION_V01) {
    addError(
      accumulator,
      "run_assessment_proposal_profile_unsupported",
      `${path}.admission_profile`,
      "The embedded run-assessment proposal profile is unsupported.",
      true,
    );
  }
  validateRunAssessmentProposalSourceMaterialBoundaryV01(
    source.source_material_boundary,
    `${path}.source_material_boundary`,
    accumulator,
  );
  if (
    !/^sha256:[a-f0-9]{64}$/u.test(
      protocolStringValueV01(source.admission_idempotency_key) ?? "",
    )
  ) {
    addError(
      accumulator,
      "run_assessment_proposal_idempotency_invalid",
      `${path}.admission_idempotency_key`,
      "The run-assessment proposal idempotency key must be a sha256 fingerprint.",
      true,
    );
  }
  validateExternalRefStructureV01(
    source.work_ref,
    `${path}.work_ref`,
    issueSink(accumulator),
    true,
  );
  for (const [field, refType] of [
    ["run_ref", "run"],
    ["packet_ref", "task_context_packet"],
    ["receipt_ref", "run_receipt"],
  ] as const) {
    validateExternalRefStructureV01(
      source[field],
      `${path}.${field}`,
      issueSink(accumulator),
    );
    if (
      isProtocolRecordV01(source[field]) &&
      source[field].ref_type !== refType
    ) {
      addError(
        accumulator,
        "run_assessment_proposal_source_ref_type_invalid",
        `${path}.${field}.ref_type`,
        `${field} must use ref_type ${refType}.`,
        true,
      );
    }
  }

  const assessmentValidation = validateCriterionAssessmentV01(
    source.assessment,
  );
  if (assessmentValidation.status !== "valid") {
    addError(
      accumulator,
      "run_assessment_proposal_assessment_invalid",
      `${path}.assessment`,
      `The embedded criterion assessment is invalid: ${assessmentValidation.errors
        .map((issue) => issue.code)
        .join(",")}.`,
      true,
    );
  }

  const expected = recordAt(source.expected, `${path}.expected`, accumulator);
  if (expected) {
    rejectUnknownNestedKeys(
      expected,
      allowedExpectedMaterialKeys,
      `${path}.expected`,
      accumulator,
    );
    requireString(expected, "task_goal", `${path}.expected`, accumulator);
    for (const field of [
      "required_checks",
      "expected_artifacts",
      "required_return_fields",
      "forbidden_actions",
    ] as const) {
      stringArray(expected[field], `${path}.expected.${field}`, accumulator);
    }
    enumValue(
      expected.data_classification,
      new Set(["public_safe", "private", "local_only", "secret"]),
      `${path}.expected.data_classification`,
      "run_assessment_proposal_data_classification_invalid",
      accumulator,
    );
    const criteria = arrayAt(
      expected.success_criteria,
      `${path}.expected.success_criteria`,
      accumulator,
    );
    criteria.forEach((candidate, index) => {
      const criterionPath = `${path}.expected.success_criteria[${index}]`;
      const criterion = recordAt(candidate, criterionPath, accumulator);
      if (!criterion) return;
      rejectUnknownNestedKeys(
        criterion,
        allowedExpectedCriterionKeys,
        criterionPath,
        accumulator,
      );
      requireString(criterion, "criterion_id", criterionPath, accumulator);
      requireString(criterion, "criterion", criterionPath, accumulator);
    });
    if (
      isProtocolRecordV01(source.assessment) &&
      Array.isArray(source.assessment.criteria) &&
      canonicalizeProtocolValueV01(criteria) !==
        canonicalizeProtocolValueV01(
          source.assessment.criteria.map((criterion) =>
            isProtocolRecordV01(criterion)
              ? {
                  criterion_id: criterion.criterion_id,
                  criterion: criterion.criterion,
                }
              : criterion,
          ),
        )
    ) {
      addError(
        accumulator,
        "run_assessment_proposal_criteria_conflict",
        `${path}.expected.success_criteria`,
        "Expected criteria must exactly preserve the embedded assessment criteria.",
        true,
      );
    }
  }

  const observed = recordAt(source.observed, `${path}.observed`, accumulator);
  if (observed) {
    rejectUnknownNestedKeys(
      observed,
      allowedObservedMaterialKeys,
      `${path}.observed`,
      accumulator,
    );
    for (const field of [
      "commands",
      "checks",
      "skipped_checks",
      "changed_artifacts",
      "artifact_refs",
      "blockers",
      "warnings",
      "gaps",
      "capability_coverage",
    ] as const) {
      arrayAt(observed[field], `${path}.observed.${field}`, accumulator);
    }
    for (const field of [
      "execution",
      "verification",
      "result_summary",
      "trust_summary",
      "compatibility",
    ] as const) {
      recordAt(observed[field], `${path}.observed.${field}`, accumulator);
    }
  }

  const comparison = recordAt(
    source.comparison,
    `${path}.comparison`,
    accumulator,
  );
  if (comparison) {
    rejectUnknownNestedKeys(
      comparison,
      allowedComparisonKeys,
      `${path}.comparison`,
      accumulator,
    );
    if (
      comparison.relation_policy !== "explicit_protocol_relations_only" ||
      comparison.criterion_specific_relations_available !== false ||
      comparison.task_success_status !== "unknown" ||
      comparison.execution_status_is_task_success !== false
    ) {
      addError(
        accumulator,
        "run_assessment_proposal_relation_policy_conflict",
        `${path}.comparison`,
        "The v0.1 run-assessment profile must preserve no criterion relation and unknown task success.",
        true,
      );
    }
    stringArray(comparison.gaps, `${path}.comparison.gaps`, accumulator);
  }

  const authority = recordAt(
    source.authority,
    `${path}.authority`,
    accumulator,
  );
  if (authority) {
    rejectUnknownNestedKeys(
      authority,
      allowedSourceAssessmentAuthorityKeys,
      `${path}.authority`,
      accumulator,
    );
    for (const key of allowedSourceAssessmentAuthorityKeys) {
      if (authority[key] !== false) {
        addError(
          accumulator,
          "run_assessment_proposal_authority_violation",
          `${path}.authority.${key}`,
          "The embedded assessment snapshot must remain non-authoritative.",
          true,
        );
      }
    }
  }

  if (
    isProtocolRecordV01(source.assessment) &&
    (source.assessment.workspace_id !== proposal.workspace_id ||
      source.assessment.project_id !== proposal.project_id ||
      !sameRefV01(source.packet_ref, source.assessment.packet_ref) ||
      !sameRefV01(source.receipt_ref, source.assessment.receipt_ref) ||
      !sameRefV01(source.packet_ref, proposal.task_context_packet_ref) ||
      !refArrayContainsV01(proposal.run_receipt_refs, source.receipt_ref) ||
      (isProtocolRecordV01(source.run_ref) &&
        source.run_ref.external_id !== source.assessment.run_id))
  ) {
    addError(
      accumulator,
      "run_assessment_proposal_source_binding_conflict",
      path,
      "The embedded assessment must exactly bind the proposal, packet, receipt, run, workspace, and project.",
      true,
    );
  }
  if (
    isProtocolRecordV01(source.assessment) &&
    Array.isArray(source.assessment.criteria) &&
    source.assessment.criteria.some(
      (criterion) =>
        !isProtocolRecordV01(criterion) ||
        criterion.status !== "unknown" ||
        criterion.basis !== "insufficient" ||
        !Array.isArray(criterion.supporting_refs) ||
        criterion.supporting_refs.length !== 0 ||
        !Array.isArray(criterion.opposing_refs) ||
        criterion.opposing_refs.length !== 0 ||
        !Array.isArray(criterion.missing_refs) ||
        criterion.missing_refs.length !== 0,
    )
  ) {
    addError(
      accumulator,
      "run_assessment_proposal_no_relation_profile_conflict",
      `${path}.assessment.criteria`,
      "The current no-relation profile must preserve unknown/insufficient criteria with empty criterion-specific refs.",
      true,
    );
  }
  for (const violation of collectRunAssessmentProposalSourceMaterialBoundViolationsV01(
    source,
  )) {
    addError(
      accumulator,
      violation.code,
      violation.path,
      violation.message,
      true,
    );
  }
}

function validateOperationRevisionV01(
  proposal: ProtocolJsonRecordV01,
  accumulator: ValidationAccumulator,
): void {
  if (proposal.operation_revision === undefined) return;
  const path = "$.operation_revision";
  const revision = recordAt(proposal.operation_revision, path, accumulator);
  if (!revision) return;
  rejectUnknownNestedKeys(
    revision,
    allowedOperationRevisionKeys,
    path,
    accumulator,
  );
  if (
    revision.revision_profile !==
    OPERATION_AWARE_PROPOSAL_REVISION_PROFILE_VERSION_V01
  ) {
    addError(
      accumulator,
      "operation_aware_revision_profile_unsupported",
      `${path}.revision_profile`,
      "The operation-aware proposal revision profile is unsupported.",
      true,
    );
  }
  if (
    !/^sha256:[a-f0-9]{64}$/u.test(
      protocolStringValueV01(revision.admission_idempotency_key) ?? "",
    )
  ) {
    addError(
      accumulator,
      "operation_aware_revision_idempotency_invalid",
      `${path}.admission_idempotency_key`,
      "The operation-aware revision idempotency key must be sha256.",
      true,
    );
  }
  const source = recordAt(revision.source, `${path}.source`, accumulator);
  if (source) {
    rejectUnknownNestedKeys(
      source,
      allowedOperationRevisionSourceKeys,
      `${path}.source`,
      accumulator,
    );
    requireString(source, "proposal_id", `${path}.source`, accumulator);
    requireString(source, "candidate_id", `${path}.source`, accumulator);
    for (const field of [
      "proposal_fingerprint",
      "candidate_fingerprint",
    ] as const) {
      if (
        !/^sha256:[a-f0-9]{64}$/u.test(
          protocolStringValueV01(source[field]) ?? "",
        )
      ) {
        addError(
          accumulator,
          "operation_aware_revision_source_fingerprint_invalid",
          `${path}.source.${field}`,
          "Revision source fingerprints must be sha256.",
          true,
        );
      }
    }
    if (source.proposal_id === proposal.proposal_id) {
      addError(
        accumulator,
        "operation_aware_revision_self_source",
        `${path}.source.proposal_id`,
        "An immutable revision must bind a distinct source proposal.",
        true,
      );
    }
  }
  validateExternalRefStructureV01(
    revision.authored_by_ref,
    `${path}.authored_by_ref`,
    issueSink(accumulator),
  );
  if (
    !isProtocolRecordV01(revision.authored_by_ref) ||
    revision.authored_by_ref.trust_class !== "user_declaration" ||
    revision.authored_by_ref.observed_at !== proposal.created_at
  ) {
    addError(
      accumulator,
      "operation_aware_revision_author_binding_invalid",
      `${path}.authored_by_ref`,
      "Revision author provenance must remain a user declaration recorded at proposal creation.",
      true,
    );
  }
  const authorBasisRefs = arrayAt(
    revision.author_basis_refs,
    `${path}.author_basis_refs`,
    accumulator,
  );
  if (authorBasisRefs.length === 0) {
    addError(
      accumulator,
      "operation_aware_revision_author_basis_required",
      `${path}.author_basis_refs`,
      "Operation-aware revisions require an observed author-session basis.",
      true,
    );
  }
  authorBasisRefs.forEach((ref, index) => {
    validateExternalRefStructureV01(
      ref,
      `${path}.author_basis_refs[${index}]`,
      issueSink(accumulator),
    );
    if (
      !isProtocolRecordV01(ref) ||
      ![
        "direct_local_observation",
        "verified_external_observation",
      ].includes(protocolStringValueV01(ref.trust_class) ?? "") ||
      ref.observed_at !== proposal.created_at
    ) {
      addError(
        accumulator,
        "operation_aware_revision_author_basis_invalid",
        `${path}.author_basis_refs[${index}]`,
        "Revision author basis must be an exact direct or verified observation at proposal creation.",
        true,
      );
    }
  });
  requireString(revision, "rationale_summary", path, accumulator);
  const selectedDeltaType = protocolStringValueV01(
    revision.selected_delta_type,
  );
  if (!selectedDeltaType || !deltaTypes.has(selectedDeltaType)) {
    addError(
      accumulator,
      "operation_aware_revision_delta_type_invalid",
      `${path}.selected_delta_type`,
      "Revision delta type must be a supported proposal delta type.",
      true,
    );
  }
  const selectedOperation = protocolStringValueV01(
    revision.selected_operation,
  );
  if (
    !selectedOperation ||
    !operations.has(selectedOperation) ||
    selectedOperation === "unknown" ||
    selectedOperation === "no_change"
  ) {
    addError(
      accumulator,
      "operation_aware_revision_operation_invalid",
      `${path}.selected_operation`,
      "Revision operation must explicitly map to create, replace, supersede, or retract.",
      true,
    );
  }
  const expectations = arrayAt(
    revision.target_expectations,
    `${path}.target_expectations`,
    accumulator,
  );
  if (expectations.length === 0) {
    addError(
      accumulator,
      "operation_aware_revision_target_required",
      `${path}.target_expectations`,
      "Operation-aware revisions require at least one exact target expectation.",
      true,
    );
  }
  const expectationRefs: unknown[] = [];
  expectations.forEach((candidate, index) => {
    const expectationPath = `${path}.target_expectations[${index}]`;
    const expectation = recordAt(candidate, expectationPath, accumulator);
    if (!expectation) return;
    rejectUnknownNestedKeys(
      expectation,
      allowedOperationRevisionTargetExpectationKeys,
      expectationPath,
      accumulator,
    );
    validateExternalRefStructureV01(
      expectation.target_ref,
      `${expectationPath}.target_ref`,
      issueSink(accumulator),
    );
    expectationRefs.push(expectation.target_ref);
    const presence = protocolStringValueV01(expectation.presence);
    if (presence !== "absent" && presence !== "present") {
      addError(
        accumulator,
        "operation_aware_revision_target_presence_invalid",
        `${expectationPath}.presence`,
        "Target expectation presence must be absent or present.",
        true,
      );
    }
    if (
      !Number.isSafeInteger(expectation.revision) ||
      (expectation.revision as number) < 0
    ) {
      addError(
        accumulator,
        "operation_aware_revision_target_revision_invalid",
        `${expectationPath}.revision`,
        "Target revision must be a non-negative safe integer.",
        true,
      );
    }
    const stateFingerprint = protocolStringValueV01(
      expectation.state_fingerprint,
    );
    const sourceReceiptId = protocolStringValueV01(
      expectation.source_transition_receipt_id,
    );
    const sourceReceiptFingerprint = protocolStringValueV01(
      expectation.source_transition_receipt_fingerprint,
    );
    if (
      (presence === "absent" && stateFingerprint !== null) ||
      (presence === "present" &&
        !/^sha256:[a-f0-9]{64}$/u.test(stateFingerprint ?? ""))
    ) {
      addError(
        accumulator,
        "operation_aware_revision_target_state_invalid",
        `${expectationPath}.state_fingerprint`,
        "Present targets require an exact state fingerprint; absent targets require null.",
        true,
      );
    }
    if (
      (sourceReceiptId === null) !== (sourceReceiptFingerprint === null) ||
      (sourceReceiptFingerprint !== null &&
        !/^sha256:[a-f0-9]{64}$/u.test(sourceReceiptFingerprint))
    ) {
      addError(
        accumulator,
        "operation_aware_revision_target_lineage_invalid",
        expectationPath,
        "Target transition lineage ID and fingerprint must be both null or both exact.",
        true,
      );
    }
    const requiresAbsent = selectedOperation === "add";
    if (
      (requiresAbsent && presence !== "absent") ||
      (!requiresAbsent &&
        selectedOperation !== null &&
        selectedOperation !== "unknown" &&
        selectedOperation !== "no_change" &&
        presence !== "present")
    ) {
      addError(
        accumulator,
        "operation_aware_revision_before_state_conflict",
        `${expectationPath}.presence`,
        "Add requires absent state; revise, supersede, retract, and remove require present state.",
        true,
      );
    }
  });
  const revisedCandidateBinding = recordAt(
    revision.revised_candidate,
    `${path}.revised_candidate`,
    accumulator,
  );
  if (revisedCandidateBinding) {
    rejectUnknownNestedKeys(
      revisedCandidateBinding,
      new Set(["candidate_id", "candidate_fingerprint"]),
      `${path}.revised_candidate`,
      accumulator,
    );
    requireString(
      revisedCandidateBinding,
      "candidate_id",
      `${path}.revised_candidate`,
      accumulator,
    );
    if (
      !/^sha256:[a-f0-9]{64}$/u.test(
        protocolStringValueV01(
          revisedCandidateBinding.candidate_fingerprint,
        ) ?? "",
      )
    ) {
      addError(
        accumulator,
        "operation_aware_revision_candidate_fingerprint_invalid",
        `${path}.revised_candidate.candidate_fingerprint`,
        "The revised candidate fingerprint must be sha256.",
        true,
      );
    }
  }
  const deltas = arrayAt(
    proposal.proposed_deltas,
    "$.proposed_deltas",
    accumulator,
  );
  const delta = revisedCandidateBinding
    ? deltas
        .filter(
          (item): item is ProtocolJsonRecordV01 => isProtocolRecordV01(item),
        )
        .find(
          (item) =>
            item.candidate_id === revisedCandidateBinding.candidate_id,
        ) ?? null
    : null;
  if (!delta) {
    addError(
      accumulator,
      "operation_aware_revision_candidate_missing",
      "$.proposed_deltas",
      "An operation-aware revision must contain its exactly bound revised candidate.",
      true,
    );
  } else {
    if (
      delta.delta_type !== selectedDeltaType ||
      delta.operation !== selectedOperation ||
      !isProtocolRecordV01(delta.current_state) ||
      delta.current_state.knowledge_status !== "known" ||
      canonicalizeProtocolValueV01(delta.target_refs) !==
        canonicalizeProtocolValueV01(expectationRefs)
    ) {
      addError(
        accumulator,
        "operation_aware_revision_candidate_conflict",
        "$.proposed_deltas[0]",
        "The revised candidate must exactly preserve the selected type, operation, target set, and known before-state expectation.",
        true,
      );
    }
    if (
      revisedCandidateBinding &&
      protocolStringValueV01(revisedCandidateBinding.candidate_fingerprint) !==
        createProtocolSha256V01(canonicalizeProtocolValueV01(delta))
    ) {
      addError(
        accumulator,
        "operation_aware_revision_candidate_fingerprint_conflict",
        `${path}.revised_candidate.candidate_fingerprint`,
        "The revised candidate fingerprint must match the exact embedded candidate.",
        true,
      );
    }
    if (source && delta.candidate_id === source.candidate_id) {
      addError(
        accumulator,
        "operation_aware_revision_candidate_identity_reused",
        "$.proposed_deltas[0].candidate_id",
        "A revised candidate must receive a new deterministic candidate identity.",
        true,
      );
    }
  }
  const authority = recordAt(
    revision.authority,
    `${path}.authority`,
    accumulator,
  );
  if (authority) {
    rejectUnknownNestedKeys(
      authority,
      allowedOperationRevisionAuthorityKeys,
      `${path}.authority`,
      accumulator,
    );
    for (const key of allowedOperationRevisionAuthorityKeys) {
      if (authority[key] !== false) {
        addError(
          accumulator,
          "operation_aware_revision_authority_violation",
          `${path}.authority.${key}`,
          "Operation-aware revision material remains non-authoritative.",
          true,
        );
      }
    }
  }
  if (
    !Array.isArray(proposal.compatibility) &&
    isProtocolRecordV01(proposal.compatibility) &&
    Array.isArray(proposal.compatibility.source_contracts) &&
    !proposal.compatibility.source_contracts.includes(
      OPERATION_AWARE_PROPOSAL_REVISION_PROFILE_VERSION_V01,
    )
  ) {
    addError(
      accumulator,
      "operation_aware_revision_contract_missing",
      "$.compatibility.source_contracts",
      "Revision proposals must declare the operation-aware profile contract.",
      true,
    );
  }
}

function validateStrategicAdvantageTransferV01(
  proposal: ProtocolJsonRecordV01,
  accumulator: ValidationAccumulator,
): void {
  if (proposal.strategic_advantage_transfer === undefined) return;
  const path = "$.strategic_advantage_transfer";
  const validation = validateStrategicAdvantageTransferProfileV01(
    proposal.strategic_advantage_transfer,
  );
  for (const issue of validation.errors) {
    addError(
      accumulator,
      issue.code,
      issue.path.replace("$strategic_advantage_transfer", path),
      "Strategic advantage-transfer profile material is invalid.",
      true,
    );
  }
  if (
    validation.status !== "valid" ||
    !isProtocolRecordV01(proposal.strategic_advantage_transfer)
  ) {
    return;
  }
  const profile = proposal.strategic_advantage_transfer as unknown as
    StrategicAdvantageTransferProfileV01;
  if (
    proposal.source_assessment !== undefined ||
    proposal.status !== "pending_review"
  ) {
    addError(
      accumulator,
      "strategic_advantage_transfer_profile_collision",
      path,
      "Strategic proposals use one distinct additive profile and remain pending review.",
      true,
    );
  }
  if (
    !sameRefV01(proposal.task_context_packet_ref, profile.packet_ref) ||
    !Array.isArray(proposal.run_receipt_refs) ||
    proposal.run_receipt_refs.length !== 1 ||
    !sameRefV01(proposal.run_receipt_refs[0], profile.receipt_ref) ||
    proposal.workspace_id !== profile.assessment.workspace_id ||
    proposal.project_id !== profile.assessment.project_id
  ) {
    addError(
      accumulator,
      "strategic_advantage_transfer_source_binding_conflict",
      path,
      "Strategic proposal packet, receipt, assessment, workspace, and project binding must remain exact.",
      true,
    );
  }
  const deltas = Array.isArray(proposal.proposed_deltas)
    ? proposal.proposed_deltas.filter(isProtocolRecordV01)
    : [];
  const hasOperationRevision = isProtocolRecordV01(
    proposal.operation_revision,
  );
  if (profile.transfer_items.length === 0) {
    const expectedCandidateId = `strategic-candidate:no-transfer-${profile.analysis_identity.slice(7, 31)}`;
    const candidate = deltas[0];
    if (
      profile.stop_reason !== "no_transferable_advantage" ||
      hasOperationRevision ||
      deltas.length !== 1 ||
      !candidate ||
      candidate.candidate_id !== expectedCandidateId ||
      candidate.delta_type !== "research_delta" ||
      candidate.operation !== "unknown" ||
      candidate.review_required !== true ||
      !Array.isArray(candidate.target_refs) ||
      candidate.target_refs.length !== 1 ||
      !sameRefV01(candidate.target_refs[0], profile.base_strategy.target_ref)
    ) {
      addError(
        accumulator,
        "strategic_advantage_transfer_no_transfer_candidate_conflict",
        "$.proposed_deltas",
        "A bounded no-transfer result must map to one review-required unknown research candidate against the exact base target.",
        true,
      );
    }
  } else if (
    deltas.length !==
    profile.transfer_items.length + (hasOperationRevision ? 1 : 0)
  ) {
    addError(
      accumulator,
      "strategic_advantage_transfer_candidate_count_conflict",
      "$.proposed_deltas",
      "Every normalized transfer must map to exactly one reviewable candidate.",
      true,
    );
  }
  for (const transfer of profile.transfer_items) {
    const candidateId = `strategic-candidate:${transfer.transfer_id.slice(
      "strategic-transfer:".length,
    )}`;
    const candidate = deltas.find(
      (value) => value.candidate_id === candidateId,
    );
    const expectedLane =
      transfer.support.status === "supported"
        ? "validation_delta"
        : "research_delta";
    if (
      !candidate ||
      candidate.delta_type !== expectedLane ||
      candidate.operation !== "unknown" ||
      candidate.review_required !== true ||
      !Array.isArray(candidate.target_refs) ||
      candidate.target_refs.length !== 1 ||
      !sameRefV01(candidate.target_refs[0], profile.base_strategy.target_ref) ||
      !Array.isArray(candidate.source_refs) ||
      transfer.source_refs.some(
        (ref) => !refArrayContainsV01(candidate.source_refs, ref),
      )
    ) {
      addError(
        accumulator,
        "strategic_advantage_transfer_candidate_material_conflict",
        "$.proposed_deltas",
        "Strategic profile and pending candidate material must remain exactly related.",
        true,
      );
    }
  }
  if (
    !Array.isArray(proposal.compatibility) &&
    isProtocolRecordV01(proposal.compatibility) &&
    Array.isArray(proposal.compatibility.source_contracts) &&
    !proposal.compatibility.source_contracts.includes(
      profile.profile_version,
    )
  ) {
    addError(
      accumulator,
      "strategic_advantage_transfer_contract_missing",
      "$.compatibility.source_contracts",
      "Strategic proposals must declare the strategic profile contract.",
      true,
    );
  }
}

function sameRefV01(left: unknown, right: unknown): boolean {
  return (
    isProtocolRecordV01(left) &&
    isProtocolRecordV01(right) &&
    canonicalizeProtocolValueV01(left) === canonicalizeProtocolValueV01(right)
  );
}

function refArrayContainsV01(value: unknown, expected: unknown): boolean {
  return (
    Array.isArray(value) &&
    value.some((candidate) => sameRefV01(candidate, expected))
  );
}

function validateRunReceiptRefs(
  value: unknown,
  accumulator: ValidationAccumulator,
): Set<string> {
  const refs = arrayAt(value, "$.run_receipt_refs", accumulator);
  if (refs.length === 0) {
    addError(
      accumulator,
      "source_run_receipt_required",
      "$.run_receipt_refs",
      "EpisodeDeltaProposal requires one or more source RunReceipt references.",
    );
  }
  const identities = new Set<string>();
  refs.forEach((ref, index) => {
    const path = `$.run_receipt_refs[${index}]`;
    validateExternalRefStructureV01(ref, path, issueSink(accumulator));
    if (isProtocolRecordV01(ref) && ref.ref_type !== "run_receipt") {
      addError(
        accumulator,
        "run_receipt_ref_type_invalid",
        `${path}.ref_type`,
        "Source receipt references must use ref_type run_receipt.",
      );
    }
    const identity = refIdentity(ref);
    if (identity) identities.add(identity);
  });
  return identities;
}

function validateObservations(
  value: unknown,
  createdAt: number | null,
  runReceiptIdentities: ReadonlySet<string>,
  accumulator: ValidationAccumulator,
) {
  arrayAt(value, "$.observations", accumulator).forEach((candidate, index) => {
    const path = `$.observations[${index}]`;
    const item = recordAt(candidate, path, accumulator);
    if (!item) return;
    rejectUnknownNestedKeys(item, allowedObservationKeys, path, accumulator);
    requireString(item, "material_id", path, accumulator);
    requireString(item, "material_kind", path, accumulator);
    requireString(item, "bounded_summary", path, accumulator);
    optionalTimestamp(item.event_at, `${path}.event_at`, accumulator);
    const observedAt = requireTimestamp(
      item.observed_at,
      `${path}.observed_at`,
      accumulator,
    );
    validateExternalRefStructureV01(
      item.observer_ref,
      `${path}.observer_ref`,
      issueSink(accumulator),
    );
    const trustClass = protocolStringValueV01(item.trust_class);
    if (!trustClass || !observationTrustClasses.has(trustClass)) {
      addError(
        accumulator,
        "observation_trust_class_invalid",
        `${path}.trust_class`,
        "Observation material requires a direct or verified observation trust class.",
        true,
      );
    }
    if (
      isProtocolRecordV01(item.observer_ref) &&
      item.observer_ref.trust_class !== trustClass
    ) {
      addError(
        accumulator,
        "observation_trust_class_mismatch",
        `${path}.observer_ref.trust_class`,
        "Observation trust class must be preserved on its observer reference.",
        true,
      );
    }
    validateSourceRunReceiptRefs(
      item.source_run_receipt_refs,
      `${path}.source_run_receipt_refs`,
      runReceiptIdentities,
      accumulator,
    );
    validateRefArray(item.source_refs, `${path}.source_refs`, accumulator);
    validateRefArray(item.subject_refs, `${path}.subject_refs`, accumulator);
    warnForClockSkew(observedAt, createdAt, `${path}.observed_at`, accumulator);
  });
}

function validateAttestations(
  value: unknown,
  createdAt: number | null,
  runReceiptIdentities: ReadonlySet<string>,
  accumulator: ValidationAccumulator,
) {
  arrayAt(value, "$.attestations", accumulator).forEach((candidate, index) => {
    const path = `$.attestations[${index}]`;
    const item = recordAt(candidate, path, accumulator);
    if (!item) return;
    rejectUnknownNestedKeys(item, allowedAttestationKeys, path, accumulator);
    requireString(item, "material_id", path, accumulator);
    requireString(item, "material_kind", path, accumulator);
    requireString(item, "bounded_summary", path, accumulator);
    const reportedAt = requireTimestamp(
      item.reported_at,
      `${path}.reported_at`,
      accumulator,
    );
    validateExternalRefStructureV01(
      item.reporter_ref,
      `${path}.reporter_ref`,
      issueSink(accumulator),
    );
    const trustClass = protocolStringValueV01(item.trust_class);
    if (!trustClass || !attestationTrustClasses.has(trustClass)) {
      addError(
        accumulator,
        "attestation_trust_class_invalid",
        `${path}.trust_class`,
        "Attestation material requires an attestation-only trust class.",
        true,
      );
    }
    if (
      isProtocolRecordV01(item.reporter_ref) &&
      item.reporter_ref.trust_class !== trustClass
    ) {
      addError(
        accumulator,
        "attestation_trust_class_mismatch",
        `${path}.reporter_ref.trust_class`,
        "Attestation trust class must be preserved on its reporter reference.",
        true,
      );
    }
    validateSourceRunReceiptRefs(
      item.source_run_receipt_refs,
      `${path}.source_run_receipt_refs`,
      runReceiptIdentities,
      accumulator,
    );
    validateRefArray(item.source_refs, `${path}.source_refs`, accumulator);
    validateRefArray(item.subject_refs, `${path}.subject_refs`, accumulator);
    warnForClockSkew(reportedAt, createdAt, `${path}.reported_at`, accumulator);
  });
}

function validateInferences(
  value: unknown,
  createdAt: number | null,
  runReceiptIdentities: ReadonlySet<string>,
  accumulator: ValidationAccumulator,
) {
  arrayAt(value, "$.inferences", accumulator).forEach((candidate, index) => {
    const path = `$.inferences[${index}]`;
    const item = recordAt(candidate, path, accumulator);
    if (!item) return;
    rejectUnknownNestedKeys(item, allowedInferenceKeys, path, accumulator);
    requireString(item, "material_id", path, accumulator);
    requireString(item, "material_kind", path, accumulator);
    requireString(item, "bounded_summary", path, accumulator);
    const inferredAt = requireTimestamp(
      item.inferred_at,
      `${path}.inferred_at`,
      accumulator,
    );
    validateExternalRefStructureV01(
      item.interpreter_ref,
      `${path}.interpreter_ref`,
      issueSink(accumulator),
    );
    if (item.trust_class !== "derived_interpretation") {
      addError(
        accumulator,
        "inference_trust_class_invalid",
        `${path}.trust_class`,
        "Inference material must retain derived_interpretation trust.",
        true,
      );
    }
    if (
      isProtocolRecordV01(item.interpreter_ref) &&
      item.interpreter_ref.trust_class !== "derived_interpretation"
    ) {
      addError(
        accumulator,
        "inference_trust_class_mismatch",
        `${path}.interpreter_ref.trust_class`,
        "Inference trust class must be preserved on its interpreter reference.",
        true,
      );
    }
    requireNonEmptyStringArray(
      item.basis_material_ids,
      `${path}.basis_material_ids`,
      "inference_basis_required",
      accumulator,
    );
    validateSourceRunReceiptRefs(
      item.source_run_receipt_refs,
      `${path}.source_run_receipt_refs`,
      runReceiptIdentities,
      accumulator,
    );
    validateRefArray(item.source_refs, `${path}.source_refs`, accumulator);
    validateRefArray(item.subject_refs, `${path}.subject_refs`, accumulator);
    warnForClockSkew(inferredAt, createdAt, `${path}.inferred_at`, accumulator);
  });
}

function validateDeltas(value: unknown, accumulator: ValidationAccumulator) {
  const deltas = arrayAt(value, "$.proposed_deltas", accumulator);
  if (deltas.length === 0) {
    addError(
      accumulator,
      "proposed_delta_required",
      "$.proposed_deltas",
      "EpisodeDeltaProposal requires at least one reviewable semantic delta candidate.",
    );
  }
  deltas.forEach((candidate, index) => {
    const path = `$.proposed_deltas[${index}]`;
    const item = recordAt(candidate, path, accumulator);
    if (!item) return;
    rejectUnknownNestedKeys(item, allowedDeltaKeys, path, accumulator);
    requireString(item, "candidate_id", path, accumulator);
    enumValue(
      item.delta_type,
      deltaTypes,
      `${path}.delta_type`,
      "delta_type_invalid",
      accumulator,
    );
    enumValue(
      item.operation,
      operations,
      `${path}.operation`,
      "delta_operation_invalid",
      accumulator,
    );
    requireString(item, "title", path, accumulator);
    validateCurrentState(item.current_state, `${path}.current_state`, accumulator);
    requireString(item, "proposed_state_summary", path, accumulator);
    requireNonEmptyRefArray(
      item.target_refs,
      `${path}.target_refs`,
      "delta_target_required",
      accumulator,
    );
    requireNonEmptyStringArray(
      item.basis_material_ids,
      `${path}.basis_material_ids`,
      "delta_basis_required",
      accumulator,
    );
    validateRefArray(item.source_refs, `${path}.source_refs`, accumulator);
    stringArray(item.uncertainties, `${path}.uncertainties`, accumulator);
    stringArray(item.limitations, `${path}.limitations`, accumulator);
    if (item.review_required !== true) {
      addError(
        accumulator,
        "delta_review_boundary_violation",
        `${path}.review_required`,
        "Every EpisodeDeltaProposal delta candidate must remain review-required.",
        true,
      );
    }
  });
}

function validateCurrentState(
  value: unknown,
  path: string,
  accumulator: ValidationAccumulator,
) {
  const currentState = recordAt(value, path, accumulator);
  if (!currentState) return;
  rejectUnknownNestedKeys(
    currentState,
    allowedCurrentStateKeys,
    path,
    accumulator,
  );
  const knowledgeStatus = enumValue(
    currentState.knowledge_status,
    new Set(["known", "unknown", "missing"]),
    `${path}.knowledge_status`,
    "knowledge_status_invalid",
    accumulator,
  );
  validateNullableString(
    currentState.bounded_summary,
    `${path}.bounded_summary`,
    accumulator,
  );
  const sourceMaterialIds = stringArray(
    currentState.source_material_ids,
    `${path}.source_material_ids`,
    accumulator,
  );
  validateRefArray(currentState.source_refs, `${path}.source_refs`, accumulator);
  if (knowledgeStatus === "known") {
    if (!protocolStringValueV01(currentState.bounded_summary)) {
      addError(
        accumulator,
        "known_state_summary_missing",
        `${path}.bounded_summary`,
        "Known current state requires a bounded source-backed summary.",
      );
    }
    if (sourceMaterialIds.length === 0) {
      addError(
        accumulator,
        "known_state_source_missing",
        `${path}.source_material_ids`,
        "Known current state requires source material.",
      );
    }
  } else if (
    (knowledgeStatus === "unknown" || knowledgeStatus === "missing") &&
    currentState.bounded_summary !== null
  ) {
    addError(
      accumulator,
      "unknown_to_known_coercion",
      `${path}.bounded_summary`,
      "Unknown or missing current state must remain null rather than being coerced into known material.",
      true,
    );
  }
}

function validateConflicts(value: unknown, accumulator: ValidationAccumulator) {
  arrayAt(value, "$.conflicts", accumulator).forEach((candidate, index) => {
    const path = `$.conflicts[${index}]`;
    const item = recordAt(candidate, path, accumulator);
    if (!item) return;
    rejectUnknownNestedKeys(item, allowedConflictKeys, path, accumulator);
    requireString(item, "conflict_id", path, accumulator);
    requireString(item, "conflict_kind", path, accumulator);
    requireString(item, "bounded_summary", path, accumulator);
    const materialIds = stringArray(
      item.material_ids,
      `${path}.material_ids`,
      accumulator,
    );
    if (new Set(materialIds).size < 2) {
      addError(
        accumulator,
        "conflict_sources_insufficient",
        `${path}.material_ids`,
        "A preserved conflict requires at least two distinct source material IDs.",
      );
    }
    validateRefArray(item.source_refs, `${path}.source_refs`, accumulator);
    if (
      item.resolution_status !== "unresolved" ||
      item.automatically_resolved !== false
    ) {
      addError(
        accumulator,
        "conflict_auto_resolution_forbidden",
        path,
        "Conflicts must remain unresolved and must not be automatically resolved.",
        true,
      );
    }
  });
}

function validateMissingInformation(
  value: unknown,
  accumulator: ValidationAccumulator,
) {
  arrayAt(value, "$.missing_information", accumulator).forEach(
    (candidate, index) => {
      const path = `$.missing_information[${index}]`;
      const item = recordAt(candidate, path, accumulator);
      if (!item) return;
      rejectUnknownNestedKeys(
        item,
        allowedMissingInformationKeys,
        path,
        accumulator,
      );
      requireString(item, "missing_id", path, accumulator);
      enumValue(
        item.knowledge_status,
        new Set(["unknown", "missing"]),
        `${path}.knowledge_status`,
        "missing_information_status_invalid",
        accumulator,
      );
      requireString(item, "code", path, accumulator);
      requireString(item, "bounded_summary", path, accumulator);
      const materialIds = stringArray(
        item.related_material_ids,
        `${path}.related_material_ids`,
        accumulator,
      );
      const deltaIds = stringArray(
        item.related_delta_ids,
        `${path}.related_delta_ids`,
        accumulator,
      );
      if (materialIds.length === 0 && deltaIds.length === 0) {
        addError(
          accumulator,
          "missing_information_relation_required",
          path,
          "Missing or unknown information must relate to source material or a delta candidate.",
        );
      }
      validateRefArray(item.source_refs, `${path}.source_refs`, accumulator);
      if (item.review_required !== true) {
        addError(
          accumulator,
          "missing_information_review_boundary_violation",
          `${path}.review_required`,
          "Missing and unknown information must remain review-required.",
          true,
        );
      }
    },
  );
}

function validateUncertainties(
  value: unknown,
  accumulator: ValidationAccumulator,
) {
  arrayAt(value, "$.uncertainties", accumulator).forEach((candidate, index) => {
    const path = `$.uncertainties[${index}]`;
    const item = recordAt(candidate, path, accumulator);
    if (!item) return;
    rejectUnknownNestedKeys(item, allowedUncertaintyKeys, path, accumulator);
    requireString(item, "uncertainty_id", path, accumulator);
    requireString(item, "bounded_summary", path, accumulator);
    stringArray(item.related_material_ids, `${path}.related_material_ids`, accumulator);
    stringArray(item.related_delta_ids, `${path}.related_delta_ids`, accumulator);
    validateRefArray(item.source_refs, `${path}.source_refs`, accumulator);
  });
}

function validateSourceStatus(
  value: unknown,
  accumulator: ValidationAccumulator,
) {
  const sourceStatus = recordAt(value, "$.source_status", accumulator);
  if (!sourceStatus) return;
  rejectUnknownNestedKeys(
    sourceStatus,
    allowedSourceStatusKeys,
    "$.source_status",
    accumulator,
  );
  enumValue(
    sourceStatus.coverage,
    new Set(["complete", "partial", "unknown"]),
    "$.source_status.coverage",
    "source_coverage_invalid",
    accumulator,
  );
  const currentness = enumValue(
    sourceStatus.currentness,
    new Set(["fresh", "stale", "partial", "unknown"]),
    "$.source_status.currentness",
    "source_currentness_invalid",
    accumulator,
  );
  validateNullableString(
    sourceStatus.as_of,
    "$.source_status.as_of",
    accumulator,
  );
  if (currentness === "unknown" && sourceStatus.as_of !== null) {
    addError(
      accumulator,
      "unknown_currentness_timestamp_forbidden",
      "$.source_status.as_of",
      "Unknown source currentness must not be coerced into a known as_of time.",
      true,
    );
  }
  if (
    currentness &&
    currentness !== "unknown" &&
    parseStrictIsoTimestampV01(sourceStatus.as_of) === null
  ) {
    addError(
      accumulator,
      "timestamp_invalid",
      "$.source_status.as_of",
      "Known source currentness requires a valid ISO-8601 as_of timestamp with timezone.",
    );
  }
  if (typeof sourceStatus.review_required !== "boolean") {
    addError(
      accumulator,
      "source_review_required_invalid",
      "$.source_status.review_required",
      "source_status.review_required must be boolean.",
    );
  }
  if (currentness !== "fresh" && sourceStatus.review_required !== true) {
    addError(
      accumulator,
      "nonfresh_source_requires_review",
      "$.source_status.review_required",
      "Stale, partial, or unknown source material requires fresh review.",
      true,
    );
  }
  requireString(sourceStatus, "basis", "$.source_status", accumulator);
  validateRefArray(
    sourceStatus.source_refs,
    "$.source_status.source_refs",
    accumulator,
  );
}

function validateCompatibility(
  value: unknown,
  accumulator: ValidationAccumulator,
) {
  const compatibility = recordAt(value, "$.compatibility", accumulator);
  if (!compatibility) return;
  rejectUnknownNestedKeys(
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
  arrayAt(
    compatibility.unmapped_fields,
    "$.compatibility.unmapped_fields",
    accumulator,
  ).forEach((candidate, index) => {
    const path = `$.compatibility.unmapped_fields[${index}]`;
    const item = recordAt(candidate, path, accumulator);
    if (!item) return;
    rejectUnknownNestedKeys(item, allowedUnmappedFieldKeys, path, accumulator);
    requireString(item, "source_field", path, accumulator);
    requireString(item, "reason", path, accumulator);
  });
}

function validateRelations(
  input: ProtocolJsonRecordV01,
  accumulator: ValidationAccumulator,
) {
  const materialEntries = [
    ...idEntries(input.observations, "material_id", "$.observations"),
    ...idEntries(input.attestations, "material_id", "$.attestations"),
    ...idEntries(input.inferences, "material_id", "$.inferences"),
  ];
  const materialIds = uniqueIdSet(materialEntries, "material", accumulator);
  const deltaEntries = idEntries(
    input.proposed_deltas,
    "candidate_id",
    "$.proposed_deltas",
  );
  const deltaIds = uniqueIdSet(deltaEntries, "delta candidate", accumulator);
  uniqueIdSet(
    idEntries(input.conflicts, "conflict_id", "$.conflicts"),
    "conflict",
    accumulator,
  );
  uniqueIdSet(
    idEntries(input.missing_information, "missing_id", "$.missing_information"),
    "missing information",
    accumulator,
  );
  uniqueIdSet(
    idEntries(input.uncertainties, "uncertainty_id", "$.uncertainties"),
    "uncertainty",
    accumulator,
  );

  forEachRecord(input.inferences, "$.inferences", (item, path) => {
    validateIdRelations(
      item.basis_material_ids,
      materialIds,
      `${path}.basis_material_ids`,
      "relation_source_item_missing",
      accumulator,
    );
    const ownId = protocolStringValueV01(item.material_id);
    if (
      ownId &&
      stringValues(item.basis_material_ids).includes(ownId)
    ) {
      addError(
        accumulator,
        "inference_self_relation",
        `${path}.basis_material_ids`,
        "Inference material cannot use itself as source material.",
      );
    }
  });
  validateInferenceDependencyCycles(input.inferences, accumulator);

  forEachRecord(input.proposed_deltas, "$.proposed_deltas", (item, path) => {
    validateIdRelations(
      item.basis_material_ids,
      materialIds,
      `${path}.basis_material_ids`,
      "relation_source_item_missing",
      accumulator,
    );
    if (isProtocolRecordV01(item.current_state)) {
      validateIdRelations(
        item.current_state.source_material_ids,
        materialIds,
        `${path}.current_state.source_material_ids`,
        "relation_source_item_missing",
        accumulator,
      );
      const knowledgeStatus = protocolStringValueV01(
        item.current_state.knowledge_status,
      );
      const candidateId = protocolStringValueV01(item.candidate_id);
      if (
        candidateId &&
        (knowledgeStatus === "unknown" || knowledgeStatus === "missing") &&
        !hasExplicitMissingRelation(
          input.missing_information,
          candidateId,
          knowledgeStatus,
        )
      ) {
        addError(
          accumulator,
          "unknown_or_missing_material_not_explicit",
          `${path}.current_state.knowledge_status`,
          "Unknown or missing current state requires a matching missing_information relation.",
        );
      }
    }
  });

  forEachRecord(input.conflicts, "$.conflicts", (item, path) => {
    validateIdRelations(
      item.material_ids,
      materialIds,
      `${path}.material_ids`,
      "relation_source_item_missing",
      accumulator,
    );
  });
  forEachRecord(
    input.missing_information,
    "$.missing_information",
    (item, path) => {
      validateIdRelations(
        item.related_material_ids,
        materialIds,
        `${path}.related_material_ids`,
        "relation_source_item_missing",
        accumulator,
      );
      validateIdRelations(
        item.related_delta_ids,
        deltaIds,
        `${path}.related_delta_ids`,
        "relation_delta_item_missing",
        accumulator,
      );
    },
  );
  forEachRecord(input.uncertainties, "$.uncertainties", (item, path) => {
    validateIdRelations(
      item.related_material_ids,
      materialIds,
      `${path}.related_material_ids`,
      "relation_source_item_missing",
      accumulator,
    );
    validateIdRelations(
      item.related_delta_ids,
      deltaIds,
      `${path}.related_delta_ids`,
      "relation_delta_item_missing",
      accumulator,
    );
  });
}

function validateInferenceDependencyCycles(
  value: unknown,
  accumulator: ValidationAccumulator,
) {
  const boundary = createEpisodeDeltaProposalMaterialBoundaryV01();
  const inferenceRecords = (Array.isArray(value) ? value : [])
    .slice(0, boundary.max_collection_items)
    .map((item, index) => ({
      item: isProtocolRecordV01(item) ? item : null,
      path: `$.inferences[${index}]`,
    }))
    .filter(
      (
        entry,
      ): entry is { item: ProtocolJsonRecordV01; path: string } =>
        entry.item !== null,
    );
  const inferenceIds = new Set(
    inferenceRecords
      .map(({ item }) => protocolStringValueV01(item.material_id))
      .filter((id): id is string => Boolean(id)),
  );
  const dependencies = new Map<string, string[]>();
  const paths = new Map<string, string>();
  for (const { item, path } of inferenceRecords) {
    const inferenceId = protocolStringValueV01(item.material_id);
    if (!inferenceId || dependencies.has(inferenceId)) continue;
    dependencies.set(
      inferenceId,
      [
        ...new Set(
          stringValues(item.basis_material_ids)
            .slice(0, boundary.max_refs_per_collection)
            .filter(
              (dependencyId) =>
                dependencyId !== inferenceId &&
                inferenceIds.has(dependencyId),
            ),
        ),
      ].sort(),
    );
    paths.set(inferenceId, `${path}.basis_material_ids`);
  }

  const visitState = new Map<string, "visiting" | "visited">();
  const stack: string[] = [];
  const reportedCycles = new Set<string>();

  const visit = (inferenceId: string) => {
    visitState.set(inferenceId, "visiting");
    stack.push(inferenceId);
    for (const dependencyId of dependencies.get(inferenceId) ?? []) {
      const dependencyState = visitState.get(dependencyId);
      if (dependencyState === "visiting") {
        const cycleStart = stack.indexOf(dependencyId);
        const cycleIds = stack.slice(cycleStart);
        const cycleKey = canonicalizeProtocolValueV01([...cycleIds].sort());
        if (!reportedCycles.has(cycleKey)) {
          reportedCycles.add(cycleKey);
          addError(
            accumulator,
            "inference_basis_cycle",
            paths.get(inferenceId) ?? "$.inferences",
            `Inference basis cycle detected: ${[
              ...cycleIds,
              dependencyId,
            ].join(" -> ")}.`,
            true,
          );
        }
      } else if (dependencyState !== "visited") {
        visit(dependencyId);
      }
    }
    stack.pop();
    visitState.set(inferenceId, "visited");
  };

  for (const inferenceId of [...dependencies.keys()].sort()) {
    if (!visitState.has(inferenceId)) visit(inferenceId);
  }
}

function validateTrustSummary(
  input: ProtocolJsonRecordV01,
  accumulator: ValidationAccumulator,
) {
  const trustSummary = recordAt(
    input.trust_summary,
    "$.trust_summary",
    accumulator,
  );
  if (trustSummary) {
    rejectUnknownNestedKeys(
      trustSummary,
      allowedTrustSummaryKeys,
      "$.trust_summary",
      accumulator,
    );
  }
  const observations = typedObservations(input.observations);
  const attestations = typedAttestations(input.attestations);
  const inferences = typedInferences(input.inferences);
  const expected = deriveEpisodeDeltaProposalTrustSummaryV01(
    observations,
    attestations,
    inferences,
  );
  if (
    canonicalizeProtocolValueV01(input.trust_summary) !==
    canonicalizeProtocolValueV01(expected)
  ) {
    addError(
      accumulator,
      "trust_summary_mismatch",
      "$.trust_summary",
      "Trust summary must be derived without upgrading proposal material trust classes.",
    );
  }
}

function validateMaterialBoundary(
  value: unknown,
  accumulator: ValidationAccumulator,
) {
  const boundary = recordAt(value, "$.material_boundary", accumulator);
  if (!boundary) return;
  rejectUnknownNestedKeys(
    boundary,
    allowedMaterialBoundaryKeys,
    "$.material_boundary",
    accumulator,
  );
  const expected = createEpisodeDeltaProposalMaterialBoundaryV01();
  for (const [key, expectedValue] of Object.entries(expected)) {
    if (boundary[key] !== expectedValue) {
      addError(
        accumulator,
        "material_boundary_violation",
        `$.material_boundary.${key}`,
        `${key} must remain ${JSON.stringify(expectedValue)}.`,
        true,
      );
    }
  }
}

function validateRunAssessmentProposalSourceMaterialBoundaryV01(
  value: unknown,
  path: string,
  accumulator: ValidationAccumulator,
): void {
  const boundary = recordAt(value, path, accumulator);
  if (!boundary) return;
  rejectUnknownNestedKeys(
    boundary,
    allowedSourceMaterialBoundaryKeys,
    path,
    accumulator,
  );
  const expected = createRunAssessmentProposalSourceMaterialBoundaryV01();
  for (const [key, expectedValue] of Object.entries(expected)) {
    if (boundary[key] !== expectedValue) {
      addError(
        accumulator,
        "run_assessment_proposal_source_material_boundary_conflict",
        `${path}.${key}`,
        `${key} must remain ${JSON.stringify(expectedValue)} for the run-assessment profile.`,
        true,
      );
    }
  }
}

function validateAuthority(
  value: unknown,
  accumulator: ValidationAccumulator,
) {
  const authority = recordAt(value, "$.authority_summary", accumulator);
  if (!authority) return;
  rejectUnknownNestedKeys(
    authority,
    allowedAuthoritySummaryKeys,
    "$.authority_summary",
    accumulator,
  );
  stringArray(authority.notes, "$.authority_summary.notes", accumulator);
  const expected = createEpisodeDeltaProposalAuthoritySummaryV01(
    Array.isArray(authority.notes)
      ? authority.notes.filter(
          (item): item is string => typeof item === "string",
        )
      : [],
  );
  rejectUnknownProtocolKeysV01(
    authority,
    new Set(Object.keys(expected)),
    "$.authority_summary",
    issueSink(accumulator),
    "authority_boundary_violation",
    true,
  );
  for (const key of Object.keys(
    expected,
  ) as Array<keyof EpisodeDeltaProposalAuthoritySummaryV01>) {
    if (key === "notes") continue;
    if (authority[key] !== false) {
      addError(
        accumulator,
        "authority_boundary_violation",
        `$.authority_summary.${key}`,
        `${key} must remain false.`,
        true,
      );
    }
  }
}

function validateIntegrity(
  input: ProtocolJsonRecordV01,
  accumulator: ValidationAccumulator,
) {
  const integrity = recordAt(input.integrity, "$.integrity", accumulator);
  if (!integrity) return;
  rejectUnknownNestedKeys(
    integrity,
    allowedIntegrityKeys,
    "$.integrity",
    accumulator,
  );
  const proposal = input as unknown as EpisodeDeltaProposalV01;
  if (
    protocolStringValueV01(input.proposal_id) !==
    deriveEpisodeDeltaProposalIdV01(proposal)
  ) {
    addError(
      accumulator,
      "proposal_identity_mismatch",
      "$.proposal_id",
      "EpisodeDeltaProposal proposal_id is inconsistent with its deterministic identity.",
    );
  }
  if (
    protocolStringValueV01(integrity.fingerprint) !==
    createEpisodeDeltaProposalFingerprintV01(proposal)
  ) {
    addError(
      accumulator,
      "fingerprint_mismatch",
      "$.integrity.fingerprint",
      "EpisodeDeltaProposal fingerprint does not match its normalized content.",
    );
  }
  if (
    integrity.algorithm !== "sha256" ||
    integrity.canonicalization !==
      EPISODE_DELTA_PROPOSAL_CANONICALIZATION_V01 ||
    integrity.fingerprint_scope !==
      "proposal_without_integrity_fingerprint"
  ) {
    addError(
      accumulator,
      "integrity_metadata_invalid",
      "$.integrity",
      "EpisodeDeltaProposal integrity metadata is invalid.",
    );
  }
}

function validateSourceRunReceiptRefs(
  value: unknown,
  path: string,
  allowedIdentities: ReadonlySet<string>,
  accumulator: ValidationAccumulator,
) {
  const refs = arrayAt(value, path, accumulator);
  if (refs.length === 0) {
    addError(
      accumulator,
      "material_source_run_receipt_required",
      path,
      "Proposal material must retain one or more source RunReceipt references.",
    );
  }
  refs.forEach((ref, index) => {
    validateExternalRefStructureV01(
      ref,
      `${path}[${index}]`,
      issueSink(accumulator),
    );
    const identity = refIdentity(ref);
    if (!identity || !allowedIdentities.has(identity)) {
      addError(
        accumulator,
        "material_source_run_receipt_missing",
        `${path}[${index}]`,
        "Material source RunReceipt must be present in run_receipt_refs.",
      );
    }
  });
}

function validateAllExternalRefs(
  input: unknown,
  accumulator: ValidationAccumulator,
) {
  walk(input, "$", (value, path) => {
    if (isProtocolRecordV01(value) && value.ref_version !== undefined) {
      validateExternalRefStructureV01(value, path, issueSink(accumulator));
    }
  });
}

function validateRefArray(
  value: unknown,
  path: string,
  accumulator: ValidationAccumulator,
) {
  arrayAt(value, path, accumulator).forEach((ref, index) =>
    validateExternalRefStructureV01(
      ref,
      `${path}[${index}]`,
      issueSink(accumulator),
    ),
  );
}

function requireNonEmptyRefArray(
  value: unknown,
  path: string,
  code: string,
  accumulator: ValidationAccumulator,
) {
  const refs = arrayAt(value, path, accumulator);
  refs.forEach((ref, index) =>
    validateExternalRefStructureV01(
      ref,
      `${path}[${index}]`,
      issueSink(accumulator),
    ),
  );
  if (refs.length === 0) {
    addError(accumulator, code, path, "Expected at least one reference.");
  }
}

function requireNonEmptyStringArray(
  value: unknown,
  path: string,
  code: string,
  accumulator: ValidationAccumulator,
) {
  const values = stringArray(value, path, accumulator);
  if (values.length === 0) {
    addError(accumulator, code, path, "Expected at least one non-empty string.");
  }
}

function validateBounds(
  input: unknown,
  accumulator: ValidationAccumulator,
) {
  for (const violation of collectBoundViolations(input)) {
    addError(
      accumulator,
      violation.code,
      violation.path,
      violation.message,
      true,
    );
  }
}

function assertEpisodeDeltaProposalBuildBoundsV01(
  proposal: EpisodeDeltaProposalV01,
) {
  const [violation] = collectBoundViolations(proposal);
  if (violation) {
    throw new RangeError(`${violation.path}: ${violation.message}`);
  }
}

function collectBoundViolations(value: unknown) {
  const boundary = createEpisodeDeltaProposalMaterialBoundaryV01();
  const violations: Array<{ code: string; path: string; message: string }> = [];
  walk(value, "$", (candidate, path) => {
    if (Array.isArray(candidate)) {
      const isRefCollection = /(?:_refs|_ids)$/.test(lastPathKey(path));
      const limit = isRefCollection
        ? boundary.max_refs_per_collection
        : boundary.max_collection_items;
      if (candidate.length > limit) {
        violations.push({
          code: "collection_bound_exceeded",
          path,
          message: `Collection exceeds the v0.1 bound (${candidate.length} > ${limit}).`,
        });
      }
    } else if (
      typeof candidate === "string" &&
      isBoundedTextPath(path) &&
      candidate.length > boundary.max_summary_characters
    ) {
      violations.push({
        code: "summary_bound_exceeded",
        path,
        message: `Bounded text exceeds ${boundary.max_summary_characters} characters.`,
      });
    }
  });
  return violations;
}

function isBoundedTextPath(path: string) {
  return boundedTextFieldNames.has(lastPathKey(path));
}

function isRunAssessmentSourceTextPathV01(path: string): boolean {
  return runAssessmentSourceTextFieldNames.has(lastPathKey(path));
}

function lastPathKey(path: string) {
  return path.replace(/\[\d+\]$/, "").split(".").at(-1) ?? "";
}

function scanAbsoluteLocalPaths(
  value: unknown,
  path: string,
  accumulator: ValidationAccumulator,
) {
  walk(value, path, (candidate, candidatePath) => {
    if (
      typeof candidate === "string" &&
      /^(?:file:\/\/|\/(?!\/)|[A-Za-z]:[\\/])/.test(candidate)
    ) {
      addError(
        accumulator,
        "absolute_local_path_forbidden",
        candidatePath,
        "Absolute local paths are forbidden; use a bounded repository-relative ExternalRef.",
        true,
      );
    }
  });
}

function validateNullableString(
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

function requireString(
  record: ProtocolJsonRecordV01,
  field: string,
  path: string,
  accumulator: ValidationAccumulator,
): string | null {
  const value = protocolStringValueV01(record[field]);
  if (!value) {
    addError(
      accumulator,
      `${field}_missing`,
      `${path}.${field}`,
      `${field} must be a non-empty string.`,
    );
  }
  return value;
}

function requireTimestamp(
  value: unknown,
  path: string,
  accumulator: ValidationAccumulator,
): number | null {
  const parsed = parseStrictIsoTimestampV01(value);
  if (parsed === null) {
    addError(
      accumulator,
      "timestamp_invalid",
      path,
      "Expected a valid ISO-8601 timestamp with timezone.",
    );
  }
  return parsed;
}

function optionalTimestamp(
  value: unknown,
  path: string,
  accumulator: ValidationAccumulator,
): number | null {
  return value === null || value === undefined
    ? null
    : requireTimestamp(value, path, accumulator);
}

function warnForClockSkew(
  materialAt: number | null,
  createdAt: number | null,
  path: string,
  accumulator: ValidationAccumulator,
) {
  if (materialAt !== null && createdAt !== null && materialAt > createdAt) {
    addWarning(
      accumulator,
      "remote_clock_skew_possible",
      path,
      "Source material time is later than proposal created_at; remote clock skew may exist.",
    );
  }
}

function enumValue(
  value: unknown,
  values: ReadonlySet<string>,
  path: string,
  code: string,
  accumulator: ValidationAccumulator,
): string | null {
  const text = protocolStringValueV01(value);
  if (!text || !values.has(text)) {
    addError(
      accumulator,
      code,
      path,
      "Value is outside the EpisodeDeltaProposal v0.1 contract.",
    );
    return null;
  }
  return text;
}

function stringArray(
  value: unknown,
  path: string,
  accumulator: ValidationAccumulator,
): string[] {
  const values = arrayAt(value, path, accumulator);
  if (values.some((item) => !protocolStringValueV01(item))) {
    addError(
      accumulator,
      "string_array_malformed",
      path,
      "Expected non-empty strings.",
    );
  }
  return values
    .map(protocolStringValueV01)
    .filter((item): item is string => Boolean(item));
}

function stringValues(value: unknown): string[] {
  return (Array.isArray(value) ? value : [])
    .map(protocolStringValueV01)
    .filter((item): item is string => Boolean(item));
}

function validateIdRelations(
  value: unknown,
  availableIds: ReadonlySet<string>,
  path: string,
  code: string,
  accumulator: ValidationAccumulator,
) {
  for (const id of stringValues(value)) {
    if (!availableIds.has(id)) {
      addError(
        accumulator,
        code,
        path,
        `Related source item ${id} does not exist in this proposal.`,
      );
    }
  }
}

function hasExplicitMissingRelation(
  value: unknown,
  candidateId: string,
  knowledgeStatus: string,
) {
  return (Array.isArray(value) ? value : []).some(
    (item) =>
      isProtocolRecordV01(item) &&
      item.knowledge_status === knowledgeStatus &&
      stringValues(item.related_delta_ids).includes(candidateId),
  );
}

function idEntries(value: unknown, field: string, path: string) {
  return (Array.isArray(value) ? value : []).map((item, index) => ({
    id: isProtocolRecordV01(item)
      ? protocolStringValueV01(item[field])
      : null,
    path: `${path}[${index}].${field}`,
  }));
}

function uniqueIdSet(
  entries: Array<{ id: string | null; path: string }>,
  label: string,
  accumulator: ValidationAccumulator,
) {
  const ids = new Set<string>();
  for (const entry of entries) {
    if (!entry.id) continue;
    if (ids.has(entry.id)) {
      addError(
        accumulator,
        "duplicate_item_id",
        entry.path,
        `Duplicate ${label} ID ${entry.id} is not allowed.`,
      );
    }
    ids.add(entry.id);
  }
  return ids;
}

function refIdentity(value: unknown): string | null {
  if (!isProtocolRecordV01(value)) return null;
  const type = protocolStringValueV01(value.ref_type);
  const id = protocolStringValueV01(value.external_id);
  if (!type || !id) return null;
  return canonicalizeProtocolValueV01({
    type,
    id,
    provider: protocolStringValueV01(value.provider),
    host: protocolStringValueV01(value.host),
    namespace: protocolStringValueV01(value.compatibility_namespace),
  });
}

function typedObservations(value: unknown): EpisodeDeltaProposalObservationV01[] {
  return (Array.isArray(value) ? value : []).filter(
    (item): item is EpisodeDeltaProposalObservationV01 =>
      isProtocolRecordV01(item) &&
      observationTrustClasses.has(
        protocolStringValueV01(item.trust_class) ?? "",
      ),
  );
}

function typedAttestations(value: unknown): EpisodeDeltaProposalAttestationV01[] {
  return (Array.isArray(value) ? value : []).filter(
    (item): item is EpisodeDeltaProposalAttestationV01 =>
      isProtocolRecordV01(item) &&
      attestationTrustClasses.has(
        protocolStringValueV01(item.trust_class) ?? "",
      ),
  );
}

function typedInferences(value: unknown): EpisodeDeltaProposalInferenceV01[] {
  return (Array.isArray(value) ? value : []).filter(
    (item): item is EpisodeDeltaProposalInferenceV01 =>
      isProtocolRecordV01(item) &&
      item.trust_class === "derived_interpretation",
  );
}

function forEachRecord(
  value: unknown,
  path: string,
  callback: (item: ProtocolJsonRecordV01, path: string) => void,
) {
  (Array.isArray(value) ? value : []).forEach((item, index) => {
    if (isProtocolRecordV01(item)) callback(item, `${path}[${index}]`);
  });
}

function walk(
  value: unknown,
  path: string,
  visit: (value: unknown, path: string) => void,
) {
  visit(value, path);
  if (Array.isArray(value)) {
    value.forEach((child, index) => walk(child, `${path}[${index}]`, visit));
  } else if (isProtocolRecordV01(value)) {
    Object.entries(value).forEach(([key, child]) =>
      walk(child, `${path}.${key}`, visit),
    );
  }
}

function recordAt(
  value: unknown,
  path: string,
  accumulator: ValidationAccumulator,
): ProtocolJsonRecordV01 | null {
  if (!isProtocolRecordV01(value)) {
    addError(accumulator, "object_malformed", path, "Expected an object.");
    return null;
  }
  return value;
}

function arrayAt(
  value: unknown,
  path: string,
  accumulator: ValidationAccumulator,
): unknown[] {
  if (!Array.isArray(value)) {
    addError(accumulator, "array_malformed", path, "Expected an array.");
    return [];
  }
  return value;
}

function rejectUnknownNestedKeys(
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
        : `Field ${key} is not part of this nested EpisodeDeltaProposal v0.1 contract.`,
      blocked,
    );
  }
}

function createAccumulator(): ValidationAccumulator {
  return { errors: [], warnings: [], blocked: false };
}

function issueSink(accumulator: ValidationAccumulator) {
  return {
    error(
      code: string,
      path: string | null,
      message: string,
      blocked = false,
    ) {
      addError(accumulator, code, path, message, blocked);
    },
    warning(code: string, path: string | null, message: string) {
      addWarning(accumulator, code, path, message);
    },
  };
}

function addError(
  accumulator: ValidationAccumulator,
  code: string,
  path: string | null,
  message: string,
  blocked = false,
) {
  accumulator.errors.push({ severity: "error", code, path, message });
  if (blocked) accumulator.blocked = true;
}

function addWarning(
  accumulator: ValidationAccumulator,
  code: string,
  path: string | null,
  message: string,
) {
  accumulator.warnings.push({ severity: "warning", code, path, message });
}

function buildValidationResult(
  accumulator: ValidationAccumulator,
  version: typeof EPISODE_DELTA_PROPOSAL_VERSION_V01 | null,
): EpisodeDeltaProposalValidationResultV01 {
  return {
    status: accumulator.blocked
      ? "blocked"
      : accumulator.errors.length
        ? "invalid"
        : "valid",
    normalized_protocol_version: version,
    errors: accumulator.errors,
    warnings: accumulator.warnings,
  };
}
