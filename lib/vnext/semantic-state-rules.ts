/**
 * Deterministic semantic-state meaning, independent of storage and runtime owners.
 * Inputs supply source material and time; validation does not authenticate stored
 * sources, authorize a Transition, or establish that a state is current.
 * SQL, retrieval, current-state rechecks and transactions remain with their owners.
 */
import {
  canonicalizeProtocolValueV01,
  createProtocolSha256V01,
  isProtocolRecordV01,
  normalizeExternalRefPrimitiveV01,
  normalizeProtocolTextV01,
  parseStrictIsoTimestampV01,
  validateExternalRefStructureV01,
} from "@/lib/vnext/protocol-primitives";
import { createEpisodeDeltaCandidateFingerprintV01 } from "@/lib/vnext/episode-delta-candidate";
import { normalizeProjectVerifyLifecycleBindingV01 } from "@/lib/vnext/project-verify-lifecycle-protocol";
import type { ExternalRefV01 } from "@/types/vnext/external-ref";
import type {
  EpisodeDeltaProposalDeltaCandidateV01,
  EpisodeDeltaProposalV01,
} from "@/types/vnext/episode-delta-proposal";
import { EPISODE_DELTA_PROPOSAL_DELTA_TYPES_V01 } from "@/types/vnext/episode-delta-proposal";
import {
  PROJECT_VERIFY_LIFECYCLE_TARGET_NAMESPACE_V01,
  type ProjectVerifyLifecycleBindingV01,
} from "@/types/vnext/project-verify-lifecycle";

export const VNEXT_SEMANTIC_STATE_CONTENT_VERSION_V01 =
  "persisted_semantic_state_content.v0.1" as const;
export const VNEXT_PERSISTED_SEMANTIC_STATE_VERSION_V01 =
  "persisted_semantic_state_version.v0.1" as const;
export const VNEXT_LOCAL_SEMANTIC_STATE_NAMESPACE_V01 =
  "augnes.vnext.local-semantic-state.v0.1" as const;

export interface VNextSemanticTargetIdentityV01 {
  compatibility_namespace: string | null;
  ref_type: string;
  external_id: string;
  provider: string | null;
  host: string | null;
}

export interface VNextSemanticStateContentV01 {
  state_content_version: typeof VNEXT_SEMANTIC_STATE_CONTENT_VERSION_V01;
  target_semantic_identity: VNextSemanticTargetIdentityV01;
  delta_type: EpisodeDeltaProposalDeltaCandidateV01["delta_type"];
  proposed_state_summary: string;
  /** Optional exact SR-2 identity; historical generic states omit it. */
  project_verify_lifecycle_binding?: ProjectVerifyLifecycleBindingV01;
}

export interface VNextPersistedSemanticStateVersionV01 {
  semantic_state_version: typeof VNEXT_PERSISTED_SEMANTIC_STATE_VERSION_V01;
  semantic_state_record_id: string;
  workspace_id: string;
  project_id: string;
  target_key: string;
  target_ref: ExternalRefV01;
  state_ref: ExternalRefV01;
  state_content: VNextSemanticStateContentV01;
  state_content_fingerprint: string;
  bounded_state_summary: string;
  source_proposal_id: string;
  source_proposal_fingerprint: string;
  source_candidate_id: string;
  source_candidate_fingerprint: string;
  source_decision_id: string;
  source_decision_fingerprint: string;
  created_at: string;
  integrity: {
    algorithm: "sha256";
    fingerprint_scope: "persisted_semantic_state_without_integrity_fingerprint";
    fingerprint: string;
  };
}

export interface VNextPersistedSemanticStateValidationIssueV01 {
  code: string;
  path: string;
  message: string;
}

export interface VNextPersistedSemanticStateValidationResultV01 {
  status: "valid" | "invalid";
  errors: VNextPersistedSemanticStateValidationIssueV01[];
  normalized_state: VNextPersistedSemanticStateVersionV01 | null;
}

export class VNextPersistedSemanticStateValidationErrorV01 extends Error {
  readonly code: string;
  readonly path: string;

  constructor(code: string, path: string, message = code) {
    super(message);
    this.name = "VNextPersistedSemanticStateValidationErrorV01";
    this.code = code;
    this.path = path;
  }
}

export function createVNextSemanticTargetIdentityV01(
  ref: ExternalRefV01,
): VNextSemanticTargetIdentityV01 {
  const normalized = normalizeExternalRefPrimitiveV01(ref);
  const compatibilityNamespace = normalized.compatibility_namespace ?? null;
  return {
    compatibility_namespace: compatibilityNamespace,
    ref_type: normalizeRequiredText(normalized.ref_type, "target_ref.ref_type"),
    external_id: normalizeRequiredText(
      normalized.external_id,
      "target_ref.external_id",
    ),
    provider: compatibilityNamespace ? null : (normalized.provider ?? null),
    host: compatibilityNamespace ? null : (normalized.host ?? null),
  };
}

export function deriveVNextSemanticTargetKeyV01(ref: ExternalRefV01): string {
  return createProtocolSha256V01(
    canonicalizeProtocolValueV01(createVNextSemanticTargetIdentityV01(ref)),
  );
}

export function buildVNextPersistedSemanticStateV01(input: {
  proposal: EpisodeDeltaProposalV01;
  candidate_id: string;
  target_ref: ExternalRefV01;
  source_decision: {
    decision_id: string;
    decision_fingerprint: string;
  };
  created_at: string;
}): VNextPersistedSemanticStateVersionV01 {
  const candidateId = normalizeRequiredText(input.candidate_id, "candidate_id");
  const candidate = input.proposal.proposed_deltas.find(
    (item) => item.candidate_id === candidateId,
  );
  if (!candidate) throw new Error("semantic_state_candidate_missing");
  const targetRef = normalizeExternalRefPrimitiveV01(input.target_ref);
  const targetCanonical = canonicalizeProtocolValueV01(targetRef);
  if (
    !candidate.target_refs.some(
      (item) =>
        canonicalizeProtocolValueV01(normalizeExternalRefPrimitiveV01(item)) ===
        targetCanonical,
    )
  ) {
    throw new Error("semantic_state_target_outside_candidate");
  }
  if (
    (targetRef.compatibility_namespace ===
      PROJECT_VERIFY_LIFECYCLE_TARGET_NAMESPACE_V01) !==
    Boolean(input.proposal.project_verify_lifecycle)
  ) {
    throw new Error("semantic_state_lifecycle_target_authority_conflict");
  }
  const summary = normalizeRequiredText(
    candidate.proposed_state_summary,
    "proposed_state_summary",
  );
  if (summary.length > 2000)
    throw new Error("semantic_state_summary_bound_exceeded");
  const content: VNextSemanticStateContentV01 = {
    state_content_version: VNEXT_SEMANTIC_STATE_CONTENT_VERSION_V01,
    target_semantic_identity: createVNextSemanticTargetIdentityV01(targetRef),
    delta_type: candidate.delta_type,
    proposed_state_summary: summary,
    ...(input.proposal.project_verify_lifecycle
      ? {
          project_verify_lifecycle_binding:
            normalizeProjectVerifyLifecycleBindingV01(
              input.proposal.project_verify_lifecycle.lifecycle_binding,
            ),
        }
      : {}),
  };
  const lifecycleBinding = content.project_verify_lifecycle_binding;
  if (
    lifecycleBinding &&
    (lifecycleBinding.workspace_id !== input.proposal.workspace_id ||
      lifecycleBinding.project_id !== input.proposal.project_id ||
      lifecycleBinding.selected_candidate.candidate_id !==
        candidate.candidate_id ||
      lifecycleBinding.selected_candidate.candidate_fingerprint !==
        createEpisodeDeltaCandidateFingerprintV01(candidate) ||
      canonicalizeProtocolValueV01(lifecycleBinding.family_target_ref) !==
        canonicalizeProtocolValueV01(targetRef))
  ) {
    throw new Error("semantic_state_lifecycle_binding_conflict");
  }
  const contentFingerprint = createProtocolSha256V01(
    canonicalizeProtocolValueV01(content),
  );
  const targetKey = deriveVNextSemanticTargetKeyV01(targetRef);
  const createdAt = normalizeRequiredText(input.created_at, "created_at");
  const recordId = derivePersistedSemanticStateRecordIdV01({
    workspace_id: input.proposal.workspace_id,
    project_id: input.proposal.project_id,
    target_key: targetKey,
    state_content_fingerprint: contentFingerprint,
    source_proposal_id: input.proposal.proposal_id,
    source_candidate_id: candidate.candidate_id,
    source_decision_id: input.source_decision.decision_id,
  });
  const stateRef = createPersistedSemanticStateRefV01(
    recordId,
    contentFingerprint,
    createdAt,
  );
  const withoutFingerprint = {
    semantic_state_version: VNEXT_PERSISTED_SEMANTIC_STATE_VERSION_V01,
    semantic_state_record_id: recordId,
    workspace_id: normalizeRequiredText(
      input.proposal.workspace_id,
      "workspace_id",
    ),
    project_id: normalizeRequiredText(input.proposal.project_id, "project_id"),
    target_key: targetKey,
    target_ref: targetRef,
    state_ref: stateRef,
    state_content: content,
    state_content_fingerprint: contentFingerprint,
    bounded_state_summary: summary,
    source_proposal_id: input.proposal.proposal_id,
    source_proposal_fingerprint: normalizeSha256(
      input.proposal.integrity.fingerprint,
      "source_proposal_fingerprint",
    ),
    source_candidate_id: candidate.candidate_id,
    source_candidate_fingerprint:
      createEpisodeDeltaCandidateFingerprintV01(candidate),
    source_decision_id: normalizeRequiredText(
      input.source_decision.decision_id,
      "source_decision_id",
    ),
    source_decision_fingerprint: normalizeSha256(
      input.source_decision.decision_fingerprint,
      "source_decision_fingerprint",
    ),
    created_at: createdAt,
    integrity: {
      algorithm: "sha256" as const,
      fingerprint_scope:
        "persisted_semantic_state_without_integrity_fingerprint" as const,
      fingerprint: "sha256:pending",
    },
  };
  const fingerprint =
    createPersistedSemanticStateFingerprintV01(withoutFingerprint);
  return {
    ...withoutFingerprint,
    integrity: { ...withoutFingerprint.integrity, fingerprint },
  };
}

export function validateVNextPersistedSemanticStateV01(
  input: unknown,
): VNextPersistedSemanticStateValidationResultV01 {
  try {
    return {
      status: "valid",
      errors: [],
      normalized_state: rebuildVNextPersistedSemanticStateV01(input),
    };
  } catch (error) {
    const issue =
      error instanceof VNextPersistedSemanticStateValidationErrorV01
        ? error
        : new VNextPersistedSemanticStateValidationErrorV01(
            "persisted_semantic_state_invalid",
            "$",
            error instanceof Error
              ? error.message
              : "Persisted semantic state is invalid.",
          );
    return {
      status: "invalid",
      errors: [{ code: issue.code, path: issue.path, message: issue.message }],
      normalized_state: null,
    };
  }
}

export function rebuildVNextPersistedSemanticStateV01(
  input: unknown,
): VNextPersistedSemanticStateVersionV01 {
  if (!isProtocolRecordV01(input)) {
    failSemanticState(
      "semantic_state_not_object",
      "$",
      "Persisted semantic state must be an object.",
    );
  }
  assertAllowedSemanticStateKeys(
    input,
    new Set([
      "semantic_state_version",
      "semantic_state_record_id",
      "workspace_id",
      "project_id",
      "target_key",
      "target_ref",
      "state_ref",
      "state_content",
      "state_content_fingerprint",
      "bounded_state_summary",
      "source_proposal_id",
      "source_proposal_fingerprint",
      "source_candidate_id",
      "source_candidate_fingerprint",
      "source_decision_id",
      "source_decision_fingerprint",
      "created_at",
      "integrity",
    ]),
    "$",
  );
  if (
    input.semantic_state_version !== VNEXT_PERSISTED_SEMANTIC_STATE_VERSION_V01
  ) {
    failSemanticState(
      "semantic_state_version_invalid",
      "$.semantic_state_version",
      "Persisted semantic state uses an unsupported version.",
    );
  }

  const workspaceId = semanticStateText(input.workspace_id, "$.workspace_id");
  const projectId = semanticStateText(input.project_id, "$.project_id");
  const targetRef = normalizeValidatedSemanticStateRef(
    input.target_ref,
    "$.target_ref",
  );
  const targetKey = deriveVNextSemanticTargetKeyV01(targetRef);
  if (
    normalizeSemanticStateSha(input.target_key, "$.target_key") !== targetKey
  ) {
    failSemanticState(
      "semantic_state_target_key_mismatch",
      "$.target_key",
      "Target key does not match the normalized target semantic identity.",
    );
  }

  if (!isProtocolRecordV01(input.state_content)) {
    failSemanticState(
      "semantic_state_content_invalid",
      "$.state_content",
      "State content must be an object.",
    );
  }
  const stateContent = input.state_content;
  assertAllowedSemanticStateKeys(
    stateContent,
    new Set([
      "state_content_version",
      "target_semantic_identity",
      "delta_type",
      "proposed_state_summary",
      "project_verify_lifecycle_binding",
    ]),
    "$.state_content",
  );
  if (
    stateContent.state_content_version !==
    VNEXT_SEMANTIC_STATE_CONTENT_VERSION_V01
  ) {
    failSemanticState(
      "semantic_state_content_version_invalid",
      "$.state_content.state_content_version",
      "Semantic state content uses an unsupported version.",
    );
  }
  if (
    typeof stateContent.delta_type !== "string" ||
    !EPISODE_DELTA_PROPOSAL_DELTA_TYPES_V01.includes(
      stateContent.delta_type as EpisodeDeltaProposalDeltaCandidateV01["delta_type"],
    )
  ) {
    failSemanticState(
      "semantic_state_delta_type_invalid",
      "$.state_content.delta_type",
      "Semantic state content requires a supported delta type.",
    );
  }
  const summary = semanticStateText(
    stateContent.proposed_state_summary,
    "$.state_content.proposed_state_summary",
  );
  if (summary.length > 2000) {
    failSemanticState(
      "semantic_state_summary_bound_exceeded",
      "$.state_content.proposed_state_summary",
      "Semantic state summary exceeds 2000 characters.",
    );
  }
  const targetIdentity = createVNextSemanticTargetIdentityV01(targetRef);
  if (
    canonicalizeProtocolValueV01(stateContent.target_semantic_identity) !==
    canonicalizeProtocolValueV01(targetIdentity)
  ) {
    failSemanticState(
      "semantic_state_target_identity_mismatch",
      "$.state_content.target_semantic_identity",
      "State content target identity does not match the normalized target ref.",
    );
  }
  const normalizedContent: VNextSemanticStateContentV01 = {
    state_content_version: VNEXT_SEMANTIC_STATE_CONTENT_VERSION_V01,
    target_semantic_identity: targetIdentity,
    delta_type:
      stateContent.delta_type as EpisodeDeltaProposalDeltaCandidateV01["delta_type"],
    proposed_state_summary: summary,
    ...(stateContent.project_verify_lifecycle_binding !== undefined
      ? {
          project_verify_lifecycle_binding:
            normalizeProjectVerifyLifecycleBindingV01(
              stateContent.project_verify_lifecycle_binding as ProjectVerifyLifecycleBindingV01,
            ),
        }
      : {}),
  };
  if (
    (targetRef.compatibility_namespace ===
      PROJECT_VERIFY_LIFECYCLE_TARGET_NAMESPACE_V01) !==
    Boolean(normalizedContent.project_verify_lifecycle_binding)
  ) {
    failSemanticState(
      "semantic_state_lifecycle_target_authority_conflict",
      "$.state_content.project_verify_lifecycle_binding",
      "Reserved Project Verify targets require the exact lifecycle binding, and generic targets cannot carry it.",
    );
  }
  if (
    normalizedContent.project_verify_lifecycle_binding &&
    canonicalizeProtocolValueV01(
      normalizedContent.project_verify_lifecycle_binding.family_target_ref,
    ) !== canonicalizeProtocolValueV01(targetRef)
  ) {
    failSemanticState(
      "semantic_state_lifecycle_target_mismatch",
      "$.state_content.project_verify_lifecycle_binding.family_target_ref",
      "Lifecycle binding target must exactly match the persisted semantic target.",
    );
  }
  if (
    normalizedContent.project_verify_lifecycle_binding &&
    (normalizedContent.project_verify_lifecycle_binding.workspace_id !==
      workspaceId ||
      normalizedContent.project_verify_lifecycle_binding.project_id !==
        projectId)
  ) {
    failSemanticState(
      "semantic_state_lifecycle_scope_mismatch",
      "$.state_content.project_verify_lifecycle_binding",
      "Lifecycle binding workspace and project must exactly match the persisted semantic-state scope.",
    );
  }
  const contentFingerprint = createProtocolSha256V01(
    canonicalizeProtocolValueV01(normalizedContent),
  );
  if (
    normalizeSemanticStateSha(
      input.state_content_fingerprint,
      "$.state_content_fingerprint",
    ) !== contentFingerprint
  ) {
    failSemanticState(
      "semantic_state_content_fingerprint_mismatch",
      "$.state_content_fingerprint",
      "State content fingerprint does not match normalized candidate-derived content.",
    );
  }
  if (
    semanticStateText(
      input.bounded_state_summary,
      "$.bounded_state_summary",
    ) !== summary
  ) {
    failSemanticState(
      "semantic_state_bounded_summary_mismatch",
      "$.bounded_state_summary",
      "Bounded state summary must match the normalized state content summary.",
    );
  }

  const sourceProposalId = semanticStateText(
    input.source_proposal_id,
    "$.source_proposal_id",
  );
  const sourceProposalFingerprint = normalizeSemanticStateSha(
    input.source_proposal_fingerprint,
    "$.source_proposal_fingerprint",
  );
  const sourceCandidateId = semanticStateText(
    input.source_candidate_id,
    "$.source_candidate_id",
  );
  const sourceCandidateFingerprint = normalizeSemanticStateSha(
    input.source_candidate_fingerprint,
    "$.source_candidate_fingerprint",
  );
  const sourceDecisionId = semanticStateText(
    input.source_decision_id,
    "$.source_decision_id",
  );
  const sourceDecisionFingerprint = normalizeSemanticStateSha(
    input.source_decision_fingerprint,
    "$.source_decision_fingerprint",
  );
  if (
    normalizedContent.project_verify_lifecycle_binding &&
    (normalizedContent.project_verify_lifecycle_binding.selected_candidate
      .candidate_id !== sourceCandidateId ||
      normalizedContent.project_verify_lifecycle_binding.selected_candidate
        .candidate_fingerprint !== sourceCandidateFingerprint)
  ) {
    failSemanticState(
      "semantic_state_lifecycle_candidate_mismatch",
      "$.state_content.project_verify_lifecycle_binding.selected_candidate",
      "Lifecycle selected candidate must exactly match the persisted semantic-state source candidate.",
    );
  }
  const createdAt = semanticStateText(input.created_at, "$.created_at");
  if (parseStrictIsoTimestampV01(createdAt) === null) {
    failSemanticState(
      "semantic_state_created_at_invalid",
      "$.created_at",
      "Persisted semantic state requires a strict ISO-8601 timestamp.",
    );
  }

  const recordId = derivePersistedSemanticStateRecordIdV01({
    workspace_id: workspaceId,
    project_id: projectId,
    target_key: targetKey,
    state_content_fingerprint: contentFingerprint,
    source_proposal_id: sourceProposalId,
    source_candidate_id: sourceCandidateId,
    source_decision_id: sourceDecisionId,
  });
  if (
    semanticStateText(
      input.semantic_state_record_id,
      "$.semantic_state_record_id",
    ) !== recordId
  ) {
    failSemanticState(
      "semantic_state_record_id_mismatch",
      "$.semantic_state_record_id",
      "Semantic state record ID does not match deterministic source bindings.",
    );
  }
  const expectedStateRef = createPersistedSemanticStateRefV01(
    recordId,
    contentFingerprint,
    createdAt,
  );
  const stateRef = normalizeValidatedSemanticStateRef(
    input.state_ref,
    "$.state_ref",
  );
  if (
    canonicalizeProtocolValueV01(stateRef) !==
    canonicalizeProtocolValueV01(expectedStateRef)
  ) {
    failSemanticState(
      "semantic_state_ref_mismatch",
      "$.state_ref",
      "State ref must preserve the deterministic local record identity and content provenance.",
    );
  }

  if (!isProtocolRecordV01(input.integrity)) {
    failSemanticState(
      "semantic_state_integrity_invalid",
      "$.integrity",
      "Semantic state integrity must be an object.",
    );
  }
  assertAllowedSemanticStateKeys(
    input.integrity,
    new Set(["algorithm", "fingerprint_scope", "fingerprint"]),
    "$.integrity",
  );
  if (
    input.integrity.algorithm !== "sha256" ||
    input.integrity.fingerprint_scope !==
      "persisted_semantic_state_without_integrity_fingerprint"
  ) {
    failSemanticState(
      "semantic_state_integrity_shape_invalid",
      "$.integrity",
      "Semantic state integrity algorithm or fingerprint scope is invalid.",
    );
  }

  const normalizedWithoutFingerprint = {
    semantic_state_version: VNEXT_PERSISTED_SEMANTIC_STATE_VERSION_V01,
    semantic_state_record_id: recordId,
    workspace_id: workspaceId,
    project_id: projectId,
    target_key: targetKey,
    target_ref: targetRef,
    state_ref: expectedStateRef,
    state_content: normalizedContent,
    state_content_fingerprint: contentFingerprint,
    bounded_state_summary: summary,
    source_proposal_id: sourceProposalId,
    source_proposal_fingerprint: sourceProposalFingerprint,
    source_candidate_id: sourceCandidateId,
    source_candidate_fingerprint: sourceCandidateFingerprint,
    source_decision_id: sourceDecisionId,
    source_decision_fingerprint: sourceDecisionFingerprint,
    created_at: createdAt,
    integrity: {
      algorithm: "sha256" as const,
      fingerprint_scope:
        "persisted_semantic_state_without_integrity_fingerprint" as const,
      fingerprint: "sha256:pending",
    },
  };
  const fingerprint = createPersistedSemanticStateFingerprintV01(
    normalizedWithoutFingerprint,
  );
  if (
    normalizeSemanticStateSha(
      input.integrity.fingerprint,
      "$.integrity.fingerprint",
    ) !== fingerprint
  ) {
    failSemanticState(
      "semantic_state_integrity_fingerprint_mismatch",
      "$.integrity.fingerprint",
      "Semantic state aggregate fingerprint does not match normalized content and lineage.",
    );
  }
  return {
    ...normalizedWithoutFingerprint,
    integrity: { ...normalizedWithoutFingerprint.integrity, fingerprint },
  };
}

function derivePersistedSemanticStateRecordIdV01(input: {
  workspace_id: string;
  project_id: string;
  target_key: string;
  state_content_fingerprint: string;
  source_proposal_id: string;
  source_candidate_id: string;
  source_decision_id: string;
}): string {
  const identityHash = createProtocolSha256V01(
    canonicalizeProtocolValueV01({
      semantic_state_version: VNEXT_PERSISTED_SEMANTIC_STATE_VERSION_V01,
      workspace_id: normalizeRequiredText(input.workspace_id, "workspace_id"),
      project_id: normalizeRequiredText(input.project_id, "project_id"),
      target_key: normalizeSha256(input.target_key, "target_key"),
      state_content_fingerprint: normalizeSha256(
        input.state_content_fingerprint,
        "state_content_fingerprint",
      ),
      source_proposal_id: normalizeRequiredText(
        input.source_proposal_id,
        "source_proposal_id",
      ),
      source_candidate_id: normalizeRequiredText(
        input.source_candidate_id,
        "source_candidate_id",
      ),
      source_decision_id: normalizeRequiredText(
        input.source_decision_id,
        "source_decision_id",
      ),
    }),
  );
  return `semantic-state:${identityHash.slice("sha256:".length, 31)}`;
}

function createPersistedSemanticStateRefV01(
  recordId: string,
  contentFingerprint: string,
  createdAt: string,
): ExternalRefV01 {
  return {
    ref_version: "external_ref.v0.1",
    ref_type: "accepted_semantic_state",
    external_id: normalizeRequiredText(recordId, "semantic_state_record_id"),
    trust_class: "direct_local_observation",
    observed_at: normalizeRequiredText(createdAt, "created_at"),
    source_ref: normalizeSha256(
      contentFingerprint,
      "state_content_fingerprint",
    ),
    compatibility_namespace: VNEXT_LOCAL_SEMANTIC_STATE_NAMESPACE_V01,
  };
}

function createPersistedSemanticStateFingerprintV01(input: unknown): string {
  if (!isProtocolRecordV01(input) || !isProtocolRecordV01(input.integrity)) {
    throw new Error("semantic_state_integrity_invalid");
  }
  return createProtocolSha256V01(
    canonicalizeProtocolValueV01({
      ...input,
      integrity: { ...input.integrity, fingerprint: undefined },
    }),
  );
}

function normalizeValidatedSemanticStateRef(
  input: unknown,
  path: string,
): ExternalRefV01 {
  const errors: VNextPersistedSemanticStateValidationIssueV01[] = [];
  validateExternalRefStructureV01(input, path, {
    error(code, issuePath, message) {
      errors.push({ code, path: issuePath ?? path, message });
    },
    warning() {},
  });
  if (errors[0]) {
    failSemanticState(errors[0].code, errors[0].path, errors[0].message);
  }
  const normalized = normalizeExternalRefPrimitiveV01(input as ExternalRefV01);
  return {
    ...normalized,
    trust_class: normalizeProtocolTextV01(
      normalized.trust_class,
    ) as ExternalRefV01["trust_class"],
  };
}

function assertAllowedSemanticStateKeys(
  input: Record<string, unknown>,
  allowed: ReadonlySet<string>,
  path: string,
): void {
  for (const key of Object.keys(input)) {
    if (!allowed.has(key)) {
      failSemanticState(
        "semantic_state_unknown_field",
        `${path}.${key}`,
        `Field ${key} is not part of persisted semantic state v0.1.`,
      );
    }
  }
}

function semanticStateText(value: unknown, path: string): string {
  const normalized = normalizeProtocolTextV01(value);
  if (!normalized) {
    failSemanticState(
      "semantic_state_required_field_missing",
      path,
      `${path} must be a non-empty string.`,
    );
  }
  return normalized;
}

function normalizeSemanticStateSha(value: unknown, path: string): string {
  const normalized = semanticStateText(value, path);
  if (!/^sha256:[a-f0-9]{64}$/.test(normalized)) {
    failSemanticState(
      "semantic_state_sha256_invalid",
      path,
      `${path} must be a lowercase SHA-256 fingerprint.`,
    );
  }
  return normalized;
}

function failSemanticState(code: string, path: string, message: string): never {
  throw new VNextPersistedSemanticStateValidationErrorV01(code, path, message);
}

/** @internal Shared with the storage representation; preserve legacy errors. */
export function normalizeRequiredText(value: unknown, field: string): string {
  const normalized = normalizeProtocolTextV01(value);
  if (!normalized) throw new Error(`${field}_required`);
  return normalized;
}

/** @internal Shared with the storage representation; preserve legacy errors. */
export function normalizeSha256(value: unknown, field: string): string {
  const normalized = normalizeRequiredText(value, field);
  if (!/^sha256:[a-f0-9]{64}$/.test(normalized)) {
    throw new Error(`${field}_invalid`);
  }
  return normalized;
}
