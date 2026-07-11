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
import type { ExternalRefV01 } from "@/types/vnext/external-ref";
import {
  EPISODE_DELTA_PROPOSAL_ATTESTATION_TRUST_CLASSES_V01,
  EPISODE_DELTA_PROPOSAL_CANONICALIZATION_V01,
  EPISODE_DELTA_PROPOSAL_DELTA_TYPES_V01,
  EPISODE_DELTA_PROPOSAL_OBSERVATION_TRUST_CLASSES_V01,
  EPISODE_DELTA_PROPOSAL_OPERATIONS_V01,
  EPISODE_DELTA_PROPOSAL_STATUSES_V01,
  EPISODE_DELTA_PROPOSAL_VERSION_V01,
  type EpisodeDeltaProposalAttestationV01,
  type EpisodeDeltaProposalAuthoritySummaryV01,
  type EpisodeDeltaProposalConflictV01,
  type EpisodeDeltaProposalDeltaCandidateV01,
  type EpisodeDeltaProposalInferenceV01,
  type EpisodeDeltaProposalMaterialBoundaryV01,
  type EpisodeDeltaProposalMissingInformationV01,
  type EpisodeDeltaProposalObservationV01,
  type EpisodeDeltaProposalTrustSummaryV01,
  type EpisodeDeltaProposalUncertaintyV01,
  type EpisodeDeltaProposalV01,
  type EpisodeDeltaProposalValidationIssueV01,
  type EpisodeDeltaProposalValidationResultV01,
} from "@/types/vnext/episode-delta-proposal";

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
