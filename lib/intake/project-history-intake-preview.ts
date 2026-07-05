import {
  asCandidateIngressPublicSafeRefV01,
  containsCandidateIngressUnsafeMarkerV01,
  dedupeCandidateIngressPublicSafeRefsV01,
  detectCandidateIngressUnsafeMarkersV01,
  isCandidateIngressPublicSafeRefV01,
  normalizeCandidateIngressCandidateV01,
  sanitizeCandidateIngressSummaryV01,
  uniqueCandidateIngressStringsV01,
} from "@/lib/intake/candidate-ingress-normalizer";
import type { CandidateIngressNormalizedCandidate } from "@/types/candidate-ingress-normalizer";
import {
  PROJECT_HISTORY_INTAKE_PREVIEW_VERSION,
  type ProjectHistoryCandidateMaterial,
  type ProjectHistoryExtractedPreview,
  type ProjectHistoryIntakeAuthorityBoundary,
  type ProjectHistoryIntakePreview,
  type ProjectHistoryIntakePreviewInput,
  type ProjectHistoryIntakePreviewStatus,
  type ProjectHistoryIntakeRecommendedNextAction,
} from "@/types/project-history-intake-preview";

export const PROJECT_HISTORY_RAW_TEXT_MAX_LENGTH = 12000 as const;

const DEFAULT_SCOPE = "project:augnes" as const;
const FALLBACK_AS_OF = "1970-01-01T00:00:00.000Z" as const;

const structuredFreeTextFields = [
  "title",
  "summary",
  "timeline_events",
  "decisions",
  "requirements",
  "changed_artifacts",
  "prs",
  "commits",
  "result_refs",
  "open_questions",
  "risks",
  "next_actions",
] as const;

export function buildProjectHistoryIntakePreviewV01({
  digest,
  raw_text,
  source_ref,
  operator_ref,
  project_ref,
  work_ref,
  as_of,
  scope,
  source_refs,
}: ProjectHistoryIntakePreviewInput = {}): ProjectHistoryIntakePreview {
  const structuredDigest = isRecord(digest) ? digest : null;
  const effectiveRawText = raw_text ?? (typeof digest === "string" ? digest : undefined);
  const rawText = typeof effectiveRawText === "string" ? effectiveRawText : "";
  const trimmedRawText = rawText.trim();
  const rawTooLarge = rawText.length > PROJECT_HISTORY_RAW_TEXT_MAX_LENGTH;
  const extractedPreview = buildExtractedPreview(rawTooLarge ? "" : rawText);
  const rawUnsafeMarkers = detectCandidateIngressUnsafeMarkersV01(rawText);
  const structuredUnsafeReasons = buildStructuredUnsafeReasons(structuredDigest);

  const resolvedProjectRef =
    project_ref ?? stringField(structuredDigest, "project_ref");
  const resolvedWorkRef = work_ref ?? stringField(structuredDigest, "work_ref");
  const evidenceRefs = dedupeCandidateIngressPublicSafeRefsV01([
    ...stringArrayField(structuredDigest, "evidence_refs"),
    ...extractedPreview.explicit_ref_like_tokens.filter((token) =>
      token.startsWith("evidence:"),
    ),
  ]);
  const outputSourceRefs = dedupeCandidateIngressPublicSafeRefsV01([
    ...(source_refs ?? []),
    ...stringArrayField(structuredDigest, "source_refs"),
    ...extractedPreview.explicit_ref_like_tokens.filter((token) =>
      token.startsWith("source:"),
    ),
    source_ref ?? "",
  ]);
  const unsafeRefReasons = buildUnsafeRefReasons({
    source_ref,
    operator_ref,
    project_ref: resolvedProjectRef,
    work_ref: resolvedWorkRef,
    evidence_refs: [
      ...stringArrayField(structuredDigest, "evidence_refs"),
      ...extractedPreview.explicit_ref_like_tokens.filter((token) =>
        token.startsWith("evidence:"),
      ),
    ],
    source_refs: [
      ...(source_refs ?? []),
      ...stringArrayField(structuredDigest, "source_refs"),
      source_ref ?? "",
    ],
  });
  const candidateContext = {
    source_ref: asCandidateIngressPublicSafeRefV01(source_ref) ??
      "source:project-history-source-missing",
    operator_ref: asCandidateIngressPublicSafeRefV01(operator_ref) ??
      "operator:project-history-review-required",
    project_ref: asCandidateIngressPublicSafeRefV01(resolvedProjectRef) ??
      undefined,
    work_ref: asCandidateIngressPublicSafeRefV01(resolvedWorkRef) ?? undefined,
    evidence_refs: evidenceRefs,
    source_refs: outputSourceRefs,
  };
  const candidateMaterial = mergeCandidateMaterial([
    buildStructuredCandidateMaterial({
      digest: structuredDigest,
      unsafeFields: structuredUnsafeReasons.unsafeFields,
      context: candidateContext,
    }),
    buildRawTextCandidateMaterial({
      extractedPreview,
      rawTextUsable: Boolean(trimmedRawText) && !rawTooLarge && rawUnsafeMarkers.length === 0,
      context: candidateContext,
    }),
  ]);
  const ingestableCandidateCount = countIngestableCandidates(candidateMaterial);
  const candidateCount = countCandidates(candidateMaterial);
  const hasHistoryMaterial =
    structuredDigest !== null || (Boolean(trimmedRawText) && !rawTooLarge);
  const rawTextStatus =
    rawTooLarge ? "too_large" : rawUnsafeMarkers.length > 0 ? "unsafe" : trimmedRawText ? "supplied" : "missing";
  const digestStatus = digest === undefined || digest === null
    ? "missing"
    : structuredDigest || typeof digest === "string"
      ? "supplied"
      : "malformed";
  const blockedReasons = uniqueCandidateIngressStringsV01([
    ...(rawTooLarge ? ["raw_text_too_large"] : []),
    ...rawUnsafeMarkers.map((reason) => `raw_text_${reason}`),
    ...structuredUnsafeReasons.reasons,
    ...unsafeRefReasons,
  ]);
  const missingEvidence =
    ingestableCandidateCount > 0 && evidenceRefs.length === 0
      ? ["evidence_refs_missing_for_project_history_candidate_ingest"]
      : [];
  const insufficientDataReasons = buildInsufficientDataReasons({
    hasHistoryMaterial,
    source_ref,
    operator_ref,
    project_ref: resolvedProjectRef,
    candidateCount,
    ingestableCandidateCount,
    missingEvidence,
    digestStatus,
    rawTextStatus,
  });
  const readiness = {
    ready_for_operator_review:
      ingestableCandidateCount > 0 &&
      blockedReasons.length === 0 &&
      isCandidateIngressPublicSafeRefV01(source_ref ?? "") &&
      isCandidateIngressPublicSafeRefV01(operator_ref ?? "") &&
      isCandidateIngressPublicSafeRefV01(resolvedProjectRef ?? ""),
    ready_for_candidate_ingest_record:
      ingestableCandidateCount > 0 &&
      blockedReasons.length === 0 &&
      insufficientDataReasons.length === 0 &&
      missingEvidence.length === 0,
    requires_digest_or_raw_text: !hasHistoryMaterial,
    requires_source_ref: !isCandidateIngressPublicSafeRefV01(source_ref ?? ""),
    requires_operator_ref: !isCandidateIngressPublicSafeRefV01(operator_ref ?? ""),
    requires_project_ref: !isCandidateIngressPublicSafeRefV01(resolvedProjectRef ?? ""),
    requires_candidate_material: ingestableCandidateCount === 0,
    requires_evidence_refs: missingEvidence.length > 0,
    requires_public_safe_refs: unsafeRefReasons.length > 0,
    requires_privacy_review: true,
    requires_no_blockers: blockedReasons.length > 0,
    current_blockers: blockedReasons,
    current_insufficient_data: insufficientDataReasons,
    current_unsafe_refs: uniqueCandidateIngressStringsV01([
      ...unsafeRefReasons,
      ...rawUnsafeMarkers,
      ...structuredUnsafeReasons.reasons,
    ]),
    current_missing_evidence: missingEvidence,
  };
  const intakePreviewStatus = determineStatus({
    hasHistoryMaterial,
    digestStatus,
    rawTextStatus,
    candidateCount,
    ingestableCandidateCount,
    blockedReasons,
    readiness,
  });
  const recommendedNextAction = determineNextAction({
    status: intakePreviewStatus,
    readiness,
    blockedReasons,
  });

  return {
    preview_version: PROJECT_HISTORY_INTAKE_PREVIEW_VERSION,
    scope: scope ?? DEFAULT_SCOPE,
    as_of: as_of ?? stringField(structuredDigest, "created_at") ?? FALLBACK_AS_OF,
    source_refs: outputSourceRefs,
    source_kind: "project_history_digest",
    intake_preview_status: intakePreviewStatus,
    recommended_next_action: recommendedNextAction,
    input_summary: {
      has_digest: digestStatus !== "missing",
      has_raw_text: rawTextStatus !== "missing",
      source_ref_supplied: Boolean(source_ref?.trim()),
      operator_ref_supplied: Boolean(operator_ref?.trim()),
      project_ref_supplied: Boolean(resolvedProjectRef?.trim()),
      work_ref_supplied: Boolean(resolvedWorkRef?.trim()),
      raw_text_length: rawText.length,
      raw_text_line_count: rawText ? rawText.split(/\r?\n/).length : 0,
      candidate_count: candidateCount,
      ingestable_candidate_count: ingestableCandidateCount,
      source_ref_count: outputSourceRefs.length,
      evidence_ref_count: evidenceRefs.length,
      unsafe_ref_count: readiness.current_unsafe_refs.length,
      missing_reason_count: insufficientDataReasons.length,
      blocked_reason_count: blockedReasons.length,
    },
    source_status: {
      digest: digestStatus,
      raw_text: rawTextStatus,
      source_kind: "known",
      source_ref: refStatus(source_ref),
      operator_ref: refStatus(operator_ref),
      project_ref: refStatus(resolvedProjectRef),
      work_ref: optionalRefStatus(resolvedWorkRef),
      authority_boundary: "valid_read_only",
    },
    candidate_material: candidateMaterial,
    extracted_preview: extractedPreview,
    readiness,
    evidence_summary: {
      has_history_material: hasHistoryMaterial,
      has_candidate_material: ingestableCandidateCount > 0,
      has_source_refs: outputSourceRefs.length > 0,
      has_evidence_refs: evidenceRefs.length > 0,
      has_operator_ref: isCandidateIngressPublicSafeRefV01(operator_ref ?? ""),
      has_project_ref: isCandidateIngressPublicSafeRefV01(resolvedProjectRef ?? ""),
      has_unsafe_refs: readiness.current_unsafe_refs.length > 0,
      has_missing_evidence: missingEvidence.length > 0,
      source_refs: outputSourceRefs,
      evidence_refs: evidenceRefs,
      missing_evidence: missingEvidence,
      unsafe_refs: readiness.current_unsafe_refs,
    },
    blocked_reasons: blockedReasons,
    insufficient_data_reasons: insufficientDataReasons,
    unsafe_ref_reasons: readiness.current_unsafe_refs,
    privacy_review_notes: [
      "project_history_intake_requires_operator_privacy_review_before_candidate_record_write",
      "raw_text_is_not_stored_as_durable_state_by_this_preview",
    ],
    operator_review_checklist: [
      "confirm_project_history_material_is_selected_and_source_refed",
      "confirm_candidate_summaries_are_bounded_and_review_only",
      "confirm_evidence_refs_support_project_history_candidates",
      "confirm_no_private_paths_tokens_passwords_or_credential_urls",
      "confirm_project_history_intake_is_not_memory_or_perspective_state",
    ],
    would_not_ingest: [
      "does_not_write_db",
      "does_not_create_schema",
      "does_not_write_memory",
      "does_not_mutate_current_working_perspective",
      "does_not_write_perspective_unit",
      "does_not_write_next_work_bias",
      "does_not_update_continuity_relay",
      "does_not_mutate_handoff_context",
      "does_not_send_handoff",
      "does_not_call_provider_openai_github_or_codex",
    ],
    non_goals: [
      "memory_write",
      "perspective_unit_durable_mutation",
      "next_work_bias_durable_mutation",
      "cwp_mutation",
      "continuity_relay_write",
      "live_handoff_context_apply",
      "provider_github_codex_call",
      "automatic_project_history_promotion",
    ],
    authority_boundary: createProjectHistoryIntakeAuthorityBoundaryV01(),
  };
}

export function createProjectHistoryIntakeAuthorityBoundaryV01(): ProjectHistoryIntakeAuthorityBoundary {
  return {
    read_only: true,
    advisory_only: true,
    source_of_truth: false,
    derived_read_model: true,
    can_write_db: false,
    can_create_schema: false,
    can_create_ingest_record: false,
    can_create_ingest_receipt: false,
    can_write_memory: false,
    can_mutate_memory: false,
    can_promote_memory: false,
    can_mutate_current_working_perspective: false,
    can_write_perspective_unit: false,
    can_write_next_work_bias: false,
    can_update_continuity_relay: false,
    can_mutate_handoff_context: false,
    can_apply_handoff_context: false,
    can_write_selected_refs_to_live_handoff: false,
    can_send_handoff: false,
    can_write_dogfood_metrics: false,
    can_write_reuse_ledger: false,
    can_call_provider_openai: false,
    can_call_github: false,
    can_execute_codex: false,
    can_create_pr: false,
    can_merge_pr: false,
    can_run_autonomous_action: false,
    can_create_graph_or_vector_store: false,
    can_create_rag_stack: false,
    can_crawl_or_observe_browser: false,
    notes: [
      "Project history intake preview is a read-only derived model.",
      "It normalizes selected project history material into candidate-only review items and cannot write memory, Perspective, CWP, relay, handoff, providers, GitHub, Codex, or autonomous actions.",
    ],
  };
}

function buildExtractedPreview(rawText: string): ProjectHistoryExtractedPreview {
  const lines = rawText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  return {
    heading_lines: lines
      .filter((line) => /^(#{1,4}\s+|title:|summary:|history:|timeline:|decisions?:|requirements?:|next:)/i.test(line))
      .slice(0, 12),
    checklist_lines: lines
      .filter((line) => /^(-|\*)\s+\[[ xX]\]|^todo\b|^next\b/i.test(line))
      .slice(0, 20),
    pr_like_refs: uniqueCandidateIngressStringsV01(
      rawText.match(/\b(?:PR\s*#|pull\/)(\d{1,8})\b/gi) ?? [],
    ).slice(0, 20),
    commit_like_refs: uniqueCandidateIngressStringsV01(
      rawText.match(/\b[0-9a-f]{7,40}\b/gi) ?? [],
    ).slice(0, 20),
    explicit_ref_like_tokens: uniqueCandidateIngressStringsV01(
      rawText.match(/\b(?:source|evidence|work|result|project|ref):[^\s,;)]+/gi) ?? [],
    ).slice(0, 30),
    possible_dates: uniqueCandidateIngressStringsV01(
      rawText.match(/\b\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z?)?\b/g) ?? [],
    ).slice(0, 20),
    next_action_lines: lines
      .filter((line) => /^(next|todo|follow[- ]?up|action):|\bnext action\b/i.test(line))
      .slice(0, 12),
    risk_or_blocker_lines: lines
      .filter((line) => /\b(risk|blocker|blocked|unsafe|missing)\b/i.test(line))
      .slice(0, 12),
    review_notes: [
      "raw_text_preview_uses_local_deterministic_extraction_only",
      "raw_text_is_not_semantically_summarized",
    ],
  };
}

type CandidateContext = {
  source_ref: string;
  operator_ref: string;
  project_ref?: string;
  work_ref?: string;
  evidence_refs: string[];
  source_refs: string[];
};

function buildStructuredCandidateMaterial({
  digest,
  unsafeFields,
  context,
}: {
  digest: Record<string, unknown> | null;
  unsafeFields: string[];
  context: CandidateContext;
}): ProjectHistoryCandidateMaterial {
  const material = emptyCandidateMaterial();
  if (!digest) return material;
  if (!unsafeFields.includes("summary")) {
    pushCandidate(material.project_state_summary_candidates, context, {
      candidate_kind: "project_state_summary",
      label: stringField(digest, "title") ?? "Project history summary",
      summary: stringField(digest, "summary") ?? "",
      seed: "summary",
    });
  }
  for (const [field, target, kind] of [
    ["timeline_events", material.timeline_event_candidates, "timeline_event"],
    ["decisions", material.decision_candidates, "decision"],
    ["requirements", material.requirement_candidates, "requirement"],
    ["changed_artifacts", material.changed_artifact_candidates, "changed_artifact_ref"],
    ["prs", material.changed_artifact_candidates, "changed_artifact_ref"],
    ["commits", material.changed_artifact_candidates, "changed_artifact_ref"],
    ["open_questions", material.open_question_candidates, "open_question"],
    ["risks", material.risk_or_blocker_candidates, "risk_or_blocker"],
    ["next_actions", material.next_action_candidates, "next_action"],
    ["result_refs", material.expected_observed_signal_candidates, "expected_observed_signal"],
  ] as const) {
    if (unsafeFields.includes(field)) continue;
    stringArrayField(digest, field).forEach((item, index) =>
      pushCandidate(target, context, {
        candidate_kind: kind,
        label: item,
        summary: item,
        seed: `${field}:${index}:${item}`,
      }),
    );
  }
  context.evidence_refs.forEach((ref) =>
    pushCandidate(material.evidence_ref_candidates, context, {
      candidate_kind: "evidence_ref",
      label: ref,
      summary: `Project history evidence ref ${ref}`,
      seed: `evidence:${ref}`,
    }),
  );
  context.source_refs.forEach((ref) =>
    pushCandidate(material.source_ref_candidates, context, {
      candidate_kind: "source_ref",
      label: ref,
      summary: `Project history source ref ${ref}`,
      seed: `source:${ref}`,
    }),
  );
  return material;
}

function buildRawTextCandidateMaterial({
  extractedPreview,
  rawTextUsable,
  context,
}: {
  extractedPreview: ProjectHistoryExtractedPreview;
  rawTextUsable: boolean;
  context: CandidateContext;
}): ProjectHistoryCandidateMaterial {
  const material = emptyCandidateMaterial();
  if (!rawTextUsable) return material;
  extractedPreview.next_action_lines.forEach((line, index) =>
    pushCandidate(material.next_action_candidates, context, {
      candidate_kind: "next_action",
      label: line,
      summary: line,
      confidence: "inferred_heuristic",
      generated_view: true,
      seed: `raw_next:${index}:${line}`,
    }),
  );
  extractedPreview.risk_or_blocker_lines.forEach((line, index) =>
    pushCandidate(material.risk_or_blocker_candidates, context, {
      candidate_kind: "risk_or_blocker",
      label: line,
      summary: line,
      confidence: "inferred_heuristic",
      generated_view: true,
      seed: `raw_risk:${index}:${line}`,
    }),
  );
  extractedPreview.pr_like_refs.forEach((ref) =>
    pushCandidate(material.changed_artifact_candidates, context, {
      candidate_kind: "changed_artifact_ref",
      label: ref,
      summary: `Project history PR-like ref ${ref}`,
      confidence: "inferred_heuristic",
      generated_view: true,
      pr_ref: ref.replace(/\s+/g, ""),
      seed: `raw_pr:${ref}`,
    }),
  );
  extractedPreview.commit_like_refs.forEach((ref) =>
    pushCandidate(material.changed_artifact_candidates, context, {
      candidate_kind: "changed_artifact_ref",
      label: ref,
      summary: `Project history commit-like ref ${ref}`,
      confidence: "inferred_heuristic",
      generated_view: true,
      commit_ref: `commit:${ref}`,
      seed: `raw_commit:${ref}`,
    }),
  );
  return material;
}

function pushCandidate(
  bucket: CandidateIngressNormalizedCandidate[],
  context: CandidateContext,
  input: {
    candidate_kind: CandidateIngressNormalizedCandidate["candidate_kind"];
    label: string;
    summary: string;
    confidence?: CandidateIngressNormalizedCandidate["confidence"];
    generated_view?: boolean;
    pr_ref?: string;
    commit_ref?: string;
    seed?: string;
  },
) {
  const summary = sanitizeCandidateIngressSummaryV01(input.summary);
  if (!summary) return;
  const candidate = normalizeCandidateIngressCandidateV01({
    candidate_kind: input.candidate_kind,
    source_kind: "project_history_digest",
    label: input.label,
    summary,
    source_ref: context.source_ref,
    operator_ref: context.operator_ref,
    project_ref: context.project_ref,
    work_ref: context.work_ref,
    pr_ref: input.pr_ref,
    commit_ref: input.commit_ref,
    evidence_refs: context.evidence_refs,
    source_refs: context.source_refs,
    confidence: input.confidence ?? "explicit",
    generated_view: input.generated_view ?? false,
    persistence_horizon:
      input.candidate_kind === "review_only" ? "review_only" : "local_project_candidate_record",
    seed: input.seed,
  });
  if (candidate) bucket.push(candidate);
}

function buildStructuredUnsafeReasons(digest: Record<string, unknown> | null) {
  const reasons: string[] = [];
  const unsafeFields: string[] = [];
  if (!digest) return { reasons, unsafeFields };
  for (const field of structuredFreeTextFields) {
    const values = field === "summary" || field === "title"
      ? [stringField(digest, field) ?? ""]
      : stringArrayField(digest, field);
    if (values.some(containsCandidateIngressUnsafeMarkerV01)) {
      unsafeFields.push(field);
      reasons.push(`project_history_digest_${field}_unsafe`);
      reasons.push("project_history_digest_contains_secret_or_private_marker");
    }
  }
  return {
    reasons: uniqueCandidateIngressStringsV01(reasons),
    unsafeFields: uniqueCandidateIngressStringsV01(unsafeFields),
  };
}

function buildUnsafeRefReasons(values: Record<string, unknown>): string[] {
  const reasons: string[] = [];
  for (const [label, value] of Object.entries(values)) {
    const refs = Array.isArray(value) ? value : [value];
    for (const ref of refs) {
      if (typeof ref === "string" && ref.trim() && !isCandidateIngressPublicSafeRefV01(ref)) {
        reasons.push(`${label}_unsafe`);
      }
    }
  }
  return uniqueCandidateIngressStringsV01(reasons);
}

function buildInsufficientDataReasons({
  hasHistoryMaterial,
  source_ref,
  operator_ref,
  project_ref,
  candidateCount,
  ingestableCandidateCount,
  missingEvidence,
  digestStatus,
  rawTextStatus,
}: {
  hasHistoryMaterial: boolean;
  source_ref?: string;
  operator_ref?: string;
  project_ref?: string;
  candidateCount: number;
  ingestableCandidateCount: number;
  missingEvidence: string[];
  digestStatus: string;
  rawTextStatus: string;
}) {
  const reasons: string[] = [];
  if (!hasHistoryMaterial) reasons.push("project_history_digest_or_raw_text_missing");
  if (digestStatus === "malformed") reasons.push("project_history_digest_malformed");
  if (rawTextStatus === "too_large") reasons.push("raw_text_too_large_for_preview");
  if (!isCandidateIngressPublicSafeRefV01(source_ref ?? "")) reasons.push("source_ref_missing");
  if (!isCandidateIngressPublicSafeRefV01(operator_ref ?? "")) reasons.push("operator_ref_missing");
  if (!isCandidateIngressPublicSafeRefV01(project_ref ?? "")) reasons.push("project_ref_missing");
  if (candidateCount === 0 || ingestableCandidateCount === 0) reasons.push("project_history_candidate_material_missing");
  reasons.push(...missingEvidence);
  return uniqueCandidateIngressStringsV01(reasons);
}

function determineStatus({
  hasHistoryMaterial,
  digestStatus,
  rawTextStatus,
  candidateCount,
  ingestableCandidateCount,
  blockedReasons,
  readiness,
}: {
  hasHistoryMaterial: boolean;
  digestStatus: string;
  rawTextStatus: string;
  candidateCount: number;
  ingestableCandidateCount: number;
  blockedReasons: string[];
  readiness: { ready_for_operator_review: boolean; ready_for_candidate_ingest_record: boolean };
}): ProjectHistoryIntakePreviewStatus {
  if (!hasHistoryMaterial) return "no_history";
  if (digestStatus === "malformed") return "malformed";
  if (blockedReasons.length > 0 || rawTextStatus === "unsafe") return "unsafe";
  if (readiness.ready_for_candidate_ingest_record) return "ready_for_operator_review";
  if (readiness.ready_for_operator_review || ingestableCandidateCount > 0) return "candidate_material_available";
  if (candidateCount > 0) return "keep_preview_only";
  return "insufficient_data";
}

function determineNextAction({
  status,
  readiness,
  blockedReasons,
}: {
  status: ProjectHistoryIntakePreviewStatus;
  readiness: ProjectHistoryIntakePreview["readiness"];
  blockedReasons: string[];
}): ProjectHistoryIntakeRecommendedNextAction {
  if (blockedReasons.length > 0 || status === "unsafe") return "resolve_unsafe_refs";
  if (readiness.requires_digest_or_raw_text) return "supply_project_history_digest";
  if (readiness.requires_source_ref) return "supply_source_ref";
  if (readiness.requires_operator_ref) return "supply_operator_ref";
  if (readiness.requires_project_ref) return "supply_project_ref";
  if (readiness.ready_for_candidate_ingest_record) return "prepare_project_history_candidate_ingest";
  if (readiness.ready_for_operator_review || status === "candidate_material_available") return "review_project_history_candidates";
  return "supply_project_history_digest";
}

function emptyCandidateMaterial(): ProjectHistoryCandidateMaterial {
  return {
    timeline_event_candidates: [],
    project_state_summary_candidates: [],
    decision_candidates: [],
    requirement_candidates: [],
    changed_artifact_candidates: [],
    open_question_candidates: [],
    risk_or_blocker_candidates: [],
    next_action_candidates: [],
    evidence_ref_candidates: [],
    source_ref_candidates: [],
    reusable_context_candidates: [],
    expected_observed_signal_candidates: [],
    review_only_candidates: [],
  };
}

function mergeCandidateMaterial(
  materials: ProjectHistoryCandidateMaterial[],
): ProjectHistoryCandidateMaterial {
  const merged = emptyCandidateMaterial();
  for (const material of materials) {
    for (const key of Object.keys(merged) as Array<keyof ProjectHistoryCandidateMaterial>) {
      merged[key].push(...material[key]);
    }
  }
  return merged;
}

function countCandidates(material: ProjectHistoryCandidateMaterial): number {
  return Object.values(material).reduce((total, candidates) => total + candidates.length, 0);
}

function countIngestableCandidates(material: ProjectHistoryCandidateMaterial): number {
  return Object.entries(material).reduce(
    (total, [key, candidates]) =>
      key === "review_only_candidates" ? total : total + candidates.length,
    0,
  );
}

function refStatus(value: unknown): "supplied" | "missing" | "unsafe" {
  if (typeof value !== "string" || !value.trim()) return "missing";
  return isCandidateIngressPublicSafeRefV01(value) ? "supplied" : "unsafe";
}

function optionalRefStatus(value: unknown): "supplied" | "missing" | "unsafe" {
  return refStatus(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function stringField(
  value: Record<string, unknown> | null,
  field: string,
): string | undefined {
  const fieldValue = value?.[field];
  return typeof fieldValue === "string" && fieldValue.trim()
    ? fieldValue.trim()
    : undefined;
}

function stringArrayField(
  value: Record<string, unknown> | null,
  field: string,
): string[] {
  const fieldValue = value?.[field];
  if (Array.isArray(fieldValue)) {
    return fieldValue
      .filter((item): item is string => typeof item === "string")
      .map((item) => item.trim())
      .filter(Boolean);
  }
  if (typeof fieldValue === "string" && fieldValue.trim()) {
    return [fieldValue.trim()];
  }
  return [];
}
