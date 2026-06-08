import type {
  PerspectiveIngressAdmissionDecisionV0,
  PerspectiveIngressAdmissionStateV0,
  PerspectiveIngressArtifactClassV0,
  PerspectiveIngressAuthorityBoundaryV0,
  PerspectiveIngressCandidateProjectionV0,
  PerspectiveIngressFormationReadinessV0,
  PerspectiveIngressKindV0,
  PerspectiveIngressRedactionStateV0,
  PerspectiveIngressSourceArtifactCandidateV0,
  PerspectiveIngressSourceProviderV0,
  PerspectiveIngressTrustLevelV0,
} from "@/types/perspective-ingress-admission";

export const PERSPECTIVE_INGRESS_ADMISSION_MODEL_VERSION =
  "perspective_ingress_admission_model.v0.1";

export const PERSPECTIVE_INGRESS_DEFAULT_AUTHORITY_BOUNDARY: PerspectiveIngressAuthorityBoundaryV0 =
  {
    local_only: true,
    read_only: true,
    external_calls_performed: false,
    persistence_performed: false,
    graph_db_write_performed: false,
    proof_evidence_readiness_write_performed: false,
    codex_execution_performed: false,
    github_mutation_performed: false,
    oauth_token_stored: false,
    raw_private_content_stored: false,
  };

export const PERSPECTIVE_INGRESS_KIND_TRUST_LEVELS: Record<
  PerspectiveIngressKindV0,
  PerspectiveIngressTrustLevelV0
> = {
  fixture: "fixture_public_safe",
  manual_pasted_text: "user_provided_local",
  chatgpt_export: "user_provided_local",
  codex_session_log: "user_provided_local",
  oauth_document: "oauth_user_authorized",
  oauth_calendar: "oauth_user_authorized",
  oauth_email: "oauth_user_authorized",
  browser_capture: "user_provided_local",
  agent_submitted_artifact: "agent_submitted_untrusted",
  external_pointer: "external_pointer_only",
};

export const PERSPECTIVE_INGRESS_KIND_ARTIFACT_CLASSES: Record<
  PerspectiveIngressKindV0,
  PerspectiveIngressArtifactClassV0
> = {
  fixture: "conversation_export",
  manual_pasted_text: "manual_note",
  chatgpt_export: "conversation_export",
  codex_session_log: "implementation_log",
  oauth_document: "document",
  oauth_calendar: "calendar_event",
  oauth_email: "email_thread",
  browser_capture: "browser_page",
  agent_submitted_artifact: "agent_report",
  external_pointer: "pointer_only",
};

export const PERSPECTIVE_INGRESS_ALLOWED_ADMISSION_TRANSITIONS: Record<
  PerspectiveIngressAdmissionStateV0,
  PerspectiveIngressAdmissionStateV0[]
> = {
  raw_quarantined: ["redacted_candidate", "rejected"],
  redacted_candidate: ["episode_candidate", "rejected"],
  episode_candidate: [
    "accepted_for_preview",
    "accepted_for_research_archive",
    "rejected",
  ],
  accepted_for_preview: ["accepted_for_research_archive", "superseded"],
  accepted_for_research_archive: ["superseded"],
  rejected: ["superseded"],
  superseded: [],
};

const OAUTH_INGRESS_KINDS = new Set<PerspectiveIngressKindV0>([
  "oauth_document",
  "oauth_calendar",
  "oauth_email",
]);

export function buildPerspectiveIngressCandidateId(input: {
  ingress_kind: PerspectiveIngressKindV0;
  source_ref?: string | null;
  source_label?: string | null;
  created_at?: string | null;
}): string {
  return [
    "candidate",
    input.ingress_kind,
    slugPart(input.source_ref ?? input.source_label ?? "source"),
    slugPart(input.created_at ?? "local"),
  ].join(".");
}

export function buildPerspectiveIngressSourceProvider(input: {
  ingress_kind: PerspectiveIngressKindV0;
  display_label?: string | null;
  provider_id?: string | null;
}): PerspectiveIngressSourceProviderV0 {
  const trustLevel = PERSPECTIVE_INGRESS_KIND_TRUST_LEVELS[input.ingress_kind];
  const artifactClass =
    PERSPECTIVE_INGRESS_KIND_ARTIFACT_CLASSES[input.ingress_kind];

  return {
    provider_id:
      input.provider_id ?? `provider.${input.ingress_kind.replaceAll("_", ".")}`,
    ingress_kind: input.ingress_kind,
    display_label: input.display_label ?? formatIngressKind(input.ingress_kind),
    trust_level: trustLevel,
    artifact_class: artifactClass,
    admission_notes: [
      "ingress candidate only",
      "not Formation authority",
      "not proof/evidence/readiness authority",
    ],
  };
}

export function buildPerspectiveIngressSourceArtifactCandidate(input: {
  ingress_kind: PerspectiveIngressKindV0;
  created_at?: string | null;
  source_label: string;
  source_ref: string;
  provenance_note?: string | null;
  bounded_summary?: string | null;
  pointer_refs?: string[];
  actor_refs?: string[];
  requested_by?: string | null;
  consent_ref?: string | null;
  retention_hint?: string | null;
  admission_state?: PerspectiveIngressAdmissionStateV0;
  redaction_state?: PerspectiveIngressRedactionStateV0;
  authority_boundary?: Partial<PerspectiveIngressAuthorityBoundaryV0>;
  blocked_reason?: string;
  supersedes_candidate_id?: string;
  eligible_for_research_archive?: boolean;
}): PerspectiveIngressSourceArtifactCandidateV0 {
  const sourceProvider = buildPerspectiveIngressSourceProvider({
    ingress_kind: input.ingress_kind,
  });
  const authorityBoundary = normalizeAuthorityBoundary(input.authority_boundary);
  const admissionState = normalizeAdmissionState({
    ingressKind: input.ingress_kind,
    admissionState: input.admission_state,
  });
  const redactionState =
    input.redaction_state ?? getDefaultRedactionState(input.ingress_kind);
  const boundedSummary = input.bounded_summary?.trim() ?? "";
  const candidate: Omit<
    PerspectiveIngressSourceArtifactCandidateV0,
    | "eligible_for_episode_candidate"
    | "eligible_for_preview"
    | "eligible_for_research_archive"
  > = {
    candidate_id: buildPerspectiveIngressCandidateId({
      ingress_kind: input.ingress_kind,
      source_ref: input.source_ref,
      source_label: input.source_label,
      created_at: input.created_at,
    }),
    ingress_kind: input.ingress_kind,
    artifact_class: sourceProvider.artifact_class,
    source_provider: sourceProvider,
    trust_level: sourceProvider.trust_level,
    admission_state: admissionState,
    redaction_state: redactionState,
    created_at: input.created_at ?? "local-preview",
    source_label: input.source_label,
    source_ref: input.source_ref,
    provenance_note:
      input.provenance_note ?? "bounded ingress candidate; no raw content stored",
    bounded_summary: boundedSummary,
    pointer_refs: [...(input.pointer_refs ?? [])],
    actor_refs: [...(input.actor_refs ?? [])],
    requested_by: input.requested_by ?? "operator:local",
    consent_ref: input.consent_ref ?? null,
    retention_hint: input.retention_hint ?? "candidate_pointer_only",
    authority_boundary: authorityBoundary,
    blocked_reason: input.blocked_reason,
    supersedes_candidate_id: input.supersedes_candidate_id,
  };
  const readiness = getPerspectiveIngressFormationReadiness({
    ...candidate,
    eligible_for_episode_candidate: false,
    eligible_for_preview: false,
    eligible_for_research_archive: false,
  });

  return {
    ...candidate,
    eligible_for_episode_candidate: readiness.eligible_for_episode_candidate,
    eligible_for_preview: readiness.eligible_for_preview,
    eligible_for_research_archive:
      Boolean(input.eligible_for_research_archive) &&
      readiness.eligible_for_research_archive,
  };
}

export function buildPerspectiveIngressAdmissionDecision(input: {
  candidate: PerspectiveIngressSourceArtifactCandidateV0;
  to_state: PerspectiveIngressAdmissionStateV0;
  reason?: string | null;
}): PerspectiveIngressAdmissionDecisionV0 {
  const allowed = canPerspectiveIngressTransition(
    input.candidate.admission_state,
    input.to_state,
  );

  return {
    decision_id: [
      "decision",
      input.candidate.candidate_id,
      input.candidate.admission_state,
      input.to_state,
    ].join("."),
    candidate_id: input.candidate.candidate_id,
    from_state: input.candidate.admission_state,
    to_state: input.to_state,
    allowed,
    reason:
      input.reason ??
      (allowed ? "allowed admission transition" : "blocked admission transition"),
    authority_boundary: { ...PERSPECTIVE_INGRESS_DEFAULT_AUTHORITY_BOUNDARY },
  };
}

export function getPerspectiveIngressAllowedNextStates(
  state: PerspectiveIngressAdmissionStateV0,
): PerspectiveIngressAdmissionStateV0[] {
  return [...PERSPECTIVE_INGRESS_ALLOWED_ADMISSION_TRANSITIONS[state]];
}

export function canPerspectiveIngressTransition(
  from: PerspectiveIngressAdmissionStateV0,
  to: PerspectiveIngressAdmissionStateV0,
): boolean {
  return PERSPECTIVE_INGRESS_ALLOWED_ADMISSION_TRANSITIONS[from].includes(to);
}

export function summarizePerspectiveIngressCandidateForFormation(
  candidate: PerspectiveIngressSourceArtifactCandidateV0,
): PerspectiveIngressCandidateProjectionV0 {
  assertPerspectiveIngressCandidateHasNoRawAuthority(candidate);

  return {
    projection_version: "perspective_ingress_candidate_projection.v0.1",
    candidate_id: candidate.candidate_id,
    ingress_kind: candidate.ingress_kind,
    artifact_class: candidate.artifact_class,
    trust_level: candidate.trust_level,
    admission_state: candidate.admission_state,
    redaction_state: candidate.redaction_state,
    source_label: candidate.source_label,
    source_ref: candidate.source_ref,
    provenance_note: candidate.provenance_note,
    bounded_summary: candidate.bounded_summary,
    pointer_refs: [...candidate.pointer_refs],
    actor_refs: [...candidate.actor_refs],
    eligible_for_episode_candidate: candidate.eligible_for_episode_candidate,
    eligible_for_preview: candidate.eligible_for_preview,
    eligible_for_research_archive: candidate.eligible_for_research_archive,
    authority_boundary: { ...candidate.authority_boundary },
  };
}

export function assertPerspectiveIngressCandidateHasNoRawAuthority(
  candidate: PerspectiveIngressSourceArtifactCandidateV0,
): true {
  const boundary = candidate.authority_boundary;
  if (!boundary.local_only) {
    throw new Error("Perspective ingress candidate requires local_only boundary");
  }
  if (!boundary.read_only) {
    throw new Error("Perspective ingress candidate requires read_only boundary");
  }

  const forbiddenFlags: (keyof PerspectiveIngressAuthorityBoundaryV0)[] = [
    "external_calls_performed",
    "persistence_performed",
    "graph_db_write_performed",
    "proof_evidence_readiness_write_performed",
    "codex_execution_performed",
    "github_mutation_performed",
    "oauth_token_stored",
    "raw_private_content_stored",
  ];

  for (const flag of forbiddenFlags) {
    if (boundary[flag]) {
      throw new Error(`Perspective ingress candidate has forbidden authority: ${flag}`);
    }
  }

  return true;
}

export function getPerspectiveIngressFormationReadiness(
  candidate: PerspectiveIngressSourceArtifactCandidateV0,
): PerspectiveIngressFormationReadinessV0 {
  const reasons: string[] = [];
  const boundary = candidate.authority_boundary;
  const hasBoundedSummary = candidate.bounded_summary.trim().length > 0;
  const redactionAllowsPreview =
    candidate.redaction_state === "redacted" ||
    candidate.redaction_state === "not_applicable";
  const hasLocalOnlyBoundary = boundary.local_only === true;
  const hasReadOnlyBoundary = boundary.read_only === true;
  const noRawAuthority =
    !boundary.external_calls_performed &&
    !boundary.persistence_performed &&
    !boundary.graph_db_write_performed &&
    !boundary.proof_evidence_readiness_write_performed &&
    !boundary.codex_execution_performed &&
    !boundary.github_mutation_performed &&
    !boundary.oauth_token_stored &&
    !boundary.raw_private_content_stored;

  if (!hasBoundedSummary) reasons.push("bounded summary required");
  if (!redactionAllowsPreview) reasons.push("redaction must be complete or not applicable");
  if (!hasLocalOnlyBoundary) reasons.push("local-only boundary required");
  if (!hasReadOnlyBoundary) reasons.push("read-only boundary required");
  if (!noRawAuthority) reasons.push("raw authority flags must all be false");
  if (OAUTH_INGRESS_KINDS.has(candidate.ingress_kind)) {
    reasons.push("OAuth candidates require separate admission before preview");
  }
  if (candidate.ingress_kind === "external_pointer") {
    reasons.push("external pointer requires separate adaptation before preview");
  }
  if (candidate.ingress_kind === "agent_submitted_artifact") {
    reasons.push("agent-submitted artifact is untrusted by default");
  }

  const eligibleForEpisodeCandidate =
    hasBoundedSummary &&
    redactionAllowsPreview &&
    hasLocalOnlyBoundary &&
    hasReadOnlyBoundary &&
    noRawAuthority;
  const eligibleForPreview =
    eligibleForEpisodeCandidate &&
    !OAUTH_INGRESS_KINDS.has(candidate.ingress_kind) &&
    candidate.ingress_kind !== "external_pointer" &&
    candidate.ingress_kind !== "agent_submitted_artifact";
  const eligibleForResearchArchive = false;

  return {
    candidate_id: candidate.candidate_id,
    eligible_for_episode_candidate: eligibleForEpisodeCandidate,
    eligible_for_preview: eligibleForPreview,
    eligible_for_research_archive: eligibleForResearchArchive,
    reasons,
  };
}

function getDefaultAdmissionState(
  ingressKind: PerspectiveIngressKindV0,
): PerspectiveIngressAdmissionStateV0 {
  if (ingressKind === "fixture" || ingressKind === "manual_pasted_text") {
    return "redacted_candidate";
  }

  return "raw_quarantined";
}

function normalizeAdmissionState({
  ingressKind,
  admissionState,
}: {
  ingressKind: PerspectiveIngressKindV0;
  admissionState?: PerspectiveIngressAdmissionStateV0;
}): PerspectiveIngressAdmissionStateV0 {
  const requestedState = admissionState ?? getDefaultAdmissionState(ingressKind);

  if (
    OAUTH_INGRESS_KINDS.has(ingressKind) &&
    requestedState !== "raw_quarantined" &&
    requestedState !== "redacted_candidate"
  ) {
    return "raw_quarantined";
  }

  return requestedState;
}

function getDefaultRedactionState(
  ingressKind: PerspectiveIngressKindV0,
): PerspectiveIngressRedactionStateV0 {
  if (ingressKind === "fixture" || ingressKind === "manual_pasted_text") {
    return "not_applicable";
  }

  return "pending";
}

function normalizeAuthorityBoundary(
  boundary: Partial<PerspectiveIngressAuthorityBoundaryV0> = {},
): PerspectiveIngressAuthorityBoundaryV0 {
  return {
    ...PERSPECTIVE_INGRESS_DEFAULT_AUTHORITY_BOUNDARY,
    ...boundary,
    oauth_token_stored: false,
    raw_private_content_stored: false,
  };
}

function formatIngressKind(ingressKind: PerspectiveIngressKindV0): string {
  return ingressKind
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function slugPart(value: string): string {
  const slug = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 48);

  return slug || "source";
}
