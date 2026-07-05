import { createHash } from "node:crypto";

import {
  CANDIDATE_INGRESS_NORMALIZER_VERSION,
  type CandidateIngressAuthorityProfile,
  type CandidateIngressNormalizeCandidateInput,
  type CandidateIngressNormalizedCandidate,
} from "@/types/candidate-ingress-normalizer";

export const CANDIDATE_INGRESS_REF_MAX_LENGTH = 240 as const;

const unsafeMarkerPatterns = [
  /(^|[:/@|=])(sk-|ghp_|github_pat_|xoxb-)/i,
  /(^|[:|=])[a-z][a-z0-9+.-]*:\/\/[^/\s]+@/i,
  /\bpassword\s*:/i,
  /\bsecret\s*:/i,
  /\/Users\//,
  /\/home\//,
  /(^|[/\\])\.env(\b|$)/i,
] as const;

export function createCandidateIngressAuthorityProfileV01({
  generated_view = false,
}: {
  generated_view?: boolean;
} = {}): CandidateIngressAuthorityProfile {
  return {
    source_of_truth: false,
    generated_view,
    candidate_material_only: true,
    can_write_memory: false,
    can_mutate_perspective: false,
    can_mutate_cwp: false,
    can_create_handoff: false,
  };
}

export function isCandidateIngressPublicSafeRefV01(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const trimmed = value.trim();
  if (!trimmed) return false;
  if (trimmed !== value) return false;
  if (trimmed.length > CANDIDATE_INGRESS_REF_MAX_LENGTH) return false;
  if (/[\r\n\t\0\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/.test(trimmed)) return false;
  if (trimmed.startsWith("/") || /^[A-Za-z]:[\\/]/.test(trimmed)) return false;
  if (trimmed.includes("..") || trimmed.includes("\\") || trimmed.includes("//")) {
    return false;
  }
  return !containsCandidateIngressUnsafeMarkerV01(trimmed);
}

export function asCandidateIngressPublicSafeRefV01(
  value: unknown,
): string | null {
  return isCandidateIngressPublicSafeRefV01(value) ? value : null;
}

export function containsCandidateIngressUnsafeMarkerV01(value: unknown): boolean {
  if (typeof value !== "string") return false;
  return unsafeMarkerPatterns.some((pattern) => pattern.test(value));
}

export function detectCandidateIngressUnsafeMarkersV01(
  value: unknown,
): string[] {
  if (typeof value !== "string" || value.length === 0) return [];
  const reasons: string[] = [];
  if (/(^|[:/@|=])(sk-|ghp_|github_pat_|xoxb-)/i.test(value)) {
    reasons.push("token_like_secret_marker_detected");
  }
  if (/(^|[:|=])[a-z][a-z0-9+.-]*:\/\/[^/\s]+@/i.test(value)) {
    reasons.push("embedded_credential_url_detected");
  }
  if (/\bpassword\s*:/i.test(value)) reasons.push("password_marker_detected");
  if (/\bsecret\s*:/i.test(value)) reasons.push("secret_marker_detected");
  if (/\/Users\//.test(value)) reasons.push("private_users_path_detected");
  if (/\/home\//.test(value)) reasons.push("private_home_path_detected");
  if (/(^|[/\\])\.env(\b|$)/i.test(value)) reasons.push("env_file_marker_detected");
  return uniqueCandidateIngressStringsV01(reasons);
}

export function uniqueCandidateIngressStringsV01(values: unknown[]): string[] {
  return Array.from(
    new Set(
      values
        .filter((value): value is string => typeof value === "string")
        .map((value) => value.trim())
        .filter(Boolean),
    ),
  ).sort((a, b) => a.localeCompare(b));
}

export function dedupeCandidateIngressPublicSafeRefsV01(
  values: unknown[],
): string[] {
  return uniqueCandidateIngressStringsV01(values).filter(
    isCandidateIngressPublicSafeRefV01,
  );
}

export function sanitizeCandidateIngressSummaryV01(value: unknown): string {
  if (typeof value !== "string") return "";
  const normalized = value.replace(/\s+/g, " ").trim();
  if (!normalized) return "";
  if (containsCandidateIngressUnsafeMarkerV01(normalized)) return "";
  return normalized.length > 180 ? `${normalized.slice(0, 177)}...` : normalized;
}

export function sanitizeCandidateIngressLabelV01(value: unknown): string {
  const summary = sanitizeCandidateIngressSummaryV01(value);
  return summary.length > 80 ? `${summary.slice(0, 77)}...` : summary;
}

export function createCandidateIngressCandidateIdV01(
  input: Pick<
    CandidateIngressNormalizeCandidateInput,
    | "candidate_kind"
    | "source_kind"
    | "source_ref"
    | "project_ref"
    | "work_ref"
    | "result_ref"
    | "pr_ref"
    | "commit_ref"
    | "seed"
  > & { summary?: string },
): string {
  const hash = createHash("sha256")
    .update(
      JSON.stringify({
        version: CANDIDATE_INGRESS_NORMALIZER_VERSION,
        candidate_kind: input.candidate_kind,
        source_kind: input.source_kind,
        source_ref: input.source_ref,
        project_ref: input.project_ref ?? null,
        work_ref: input.work_ref ?? null,
        result_ref: input.result_ref ?? null,
        pr_ref: input.pr_ref ?? null,
        commit_ref: input.commit_ref ?? null,
        seed: input.seed ?? input.summary ?? "",
      }),
    )
    .digest("hex")
    .slice(0, 16);
  return `candidate:${input.candidate_kind}:${hash}`;
}

export function normalizeCandidateIngressCandidateV01(
  input: CandidateIngressNormalizeCandidateInput,
): CandidateIngressNormalizedCandidate | null {
  const summary = sanitizeCandidateIngressSummaryV01(input.summary);
  const label = sanitizeCandidateIngressLabelV01(input.label || input.summary);
  const sourceRef = asCandidateIngressPublicSafeRefV01(input.source_ref);
  const operatorRef = asCandidateIngressPublicSafeRefV01(input.operator_ref);
  if (!summary || !label || !sourceRef || !operatorRef) return null;

  const evidenceRefs = dedupeCandidateIngressPublicSafeRefsV01(
    input.evidence_refs ?? [],
  );
  const sourceRefs = dedupeCandidateIngressPublicSafeRefsV01([
    ...(input.source_refs ?? []),
    sourceRef,
  ]);
  const candidateId = createCandidateIngressCandidateIdV01({
    ...input,
    source_ref: sourceRef,
    summary,
  });

  return {
    candidate_id: candidateId,
    candidate_kind: input.candidate_kind,
    source_kind: input.source_kind,
    label,
    summary,
    source_ref: sourceRef,
    operator_ref: operatorRef,
    session_ref: optionalSafeRef(input.session_ref),
    project_ref: optionalSafeRef(input.project_ref),
    work_ref: optionalSafeRef(input.work_ref),
    result_ref: optionalSafeRef(input.result_ref),
    pr_ref: optionalSafeRef(input.pr_ref),
    commit_ref: optionalSafeRef(input.commit_ref),
    evidence_refs: evidenceRefs,
    source_refs: sourceRefs,
    confidence: input.confidence ?? "explicit",
    review_required: true,
    candidate_only: true,
    persistence_horizon: input.persistence_horizon ?? "local_project_candidate_record",
    authority_profile: createCandidateIngressAuthorityProfileV01({
      generated_view: input.generated_view ?? false,
    }),
  };
}

function optionalSafeRef(value: unknown): string | undefined {
  return asCandidateIngressPublicSafeRefV01(value) ?? undefined;
}
