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
import { normalizeCodexResultReportV01 } from "@/lib/dogfooding/codex-result-report-normalizer";
import type { CandidateIngressNormalizedCandidate } from "@/types/candidate-ingress-normalizer";
import {
  CODEX_RESULT_REPORT_INTAKE_PREVIEW_VERSION,
  type CodexResultReportCandidateMaterial,
  type CodexResultReportExtractedPreview,
  type CodexResultReportIntakeAuthorityBoundary,
  type CodexResultReportIntakePreview,
  type CodexResultReportIntakePreviewInput,
  type CodexResultReportIntakePreviewStatus,
  type CodexResultReportIntakeRecommendedNextAction,
} from "@/types/codex-result-report-intake-preview";

export const CODEX_RESULT_REPORT_RAW_TEXT_MAX_LENGTH = 12000 as const;

const DEFAULT_SCOPE = "project:augnes" as const;
const FALLBACK_AS_OF = "1970-01-01T00:00:00.000Z" as const;

const structuredFreeTextFields = [
  "summary",
  "work_id",
  "result_status",
  "changed_files",
  "checks",
  "skipped_checks",
  "not_done",
  "requirement_progress",
  "unexpected_changes",
  "regressions_or_risks",
  "followups",
  "context_feedback",
  "handoff_feedback",
  "expected_vs_observed",
] as const;

export function buildCodexResultReportIntakePreviewV01({
  result_report,
  raw_text,
  source_ref,
  operator_ref,
  work_ref,
  result_ref,
  pr_ref,
  commit_ref,
  project_ref,
  as_of,
  scope,
  source_refs,
}: CodexResultReportIntakePreviewInput = {}): CodexResultReportIntakePreview {
  const structuredReport = isRecord(result_report) ? result_report : null;
  const normalizedReport = tryNormalizeExistingCodexResultReport(structuredReport);
  const effectiveRawText =
    raw_text ?? (typeof result_report === "string" ? result_report : undefined);
  const rawText = typeof effectiveRawText === "string" ? effectiveRawText : "";
  const trimmedRawText = rawText.trim();
  const rawTooLarge = rawText.length > CODEX_RESULT_REPORT_RAW_TEXT_MAX_LENGTH;
  const extractedPreview = buildExtractedPreview(rawTooLarge ? "" : rawText);
  const rawUnsafeMarkers = detectCandidateIngressUnsafeMarkersV01(rawText);
  const structuredUnsafeReasons = buildStructuredUnsafeReasons(structuredReport);

  const resolvedWorkRef =
    work_ref ?? stringField(structuredReport, "work_ref") ?? safePrefixedRef("work", stringField(structuredReport, "work_id"));
  const resolvedResultRef =
    result_ref ?? stringField(structuredReport, "result_ref") ?? stringField(structuredReport, "report_id");
  const resolvedPrRef =
    pr_ref ?? stringField(structuredReport, "pr_ref") ?? firstStringField(structuredReport, "pr_refs");
  const resolvedCommitRef =
    commit_ref ?? stringField(structuredReport, "commit_ref") ?? firstStringField(structuredReport, "commit_refs");
  const resolvedProjectRef =
    project_ref ?? stringField(structuredReport, "project_ref");
  const evidenceRefs = dedupeCandidateIngressPublicSafeRefsV01([
    ...stringArrayField(structuredReport, "evidence_refs"),
    ...extractedPreview.explicit_ref_like_tokens.filter((token) =>
      token.startsWith("evidence:"),
    ),
  ]);
  const outputSourceRefs = dedupeCandidateIngressPublicSafeRefsV01([
    ...(source_refs ?? []),
    ...stringArrayField(structuredReport, "source_refs"),
    ...(normalizedReport?.source_refs ?? []),
    ...extractedPreview.explicit_ref_like_tokens.filter((token) =>
      token.startsWith("source:"),
    ),
    source_ref ?? "",
  ]);
  const unsafeRefReasons = buildUnsafeRefReasons({
    source_ref,
    operator_ref,
    work_ref: resolvedWorkRef,
    result_ref: resolvedResultRef,
    pr_ref: resolvedPrRef,
    commit_ref: resolvedCommitRef,
    project_ref: resolvedProjectRef,
    evidence_refs: [
      ...stringArrayField(structuredReport, "evidence_refs"),
      ...extractedPreview.explicit_ref_like_tokens.filter((token) =>
        token.startsWith("evidence:"),
      ),
    ],
    source_refs: [
      ...(source_refs ?? []),
      ...stringArrayField(structuredReport, "source_refs"),
      source_ref ?? "",
    ],
  });
  const candidateContext = {
    source_ref: asCandidateIngressPublicSafeRefV01(source_ref) ??
      "source:codex-result-report-source-missing",
    operator_ref: asCandidateIngressPublicSafeRefV01(operator_ref) ??
      "operator:codex-result-report-review-required",
    project_ref: asCandidateIngressPublicSafeRefV01(resolvedProjectRef) ??
      undefined,
    work_ref: asCandidateIngressPublicSafeRefV01(resolvedWorkRef) ?? undefined,
    result_ref: asCandidateIngressPublicSafeRefV01(resolvedResultRef) ??
      undefined,
    pr_ref: asCandidateIngressPublicSafeRefV01(resolvedPrRef) ?? undefined,
    commit_ref: asCandidateIngressPublicSafeRefV01(resolvedCommitRef) ??
      undefined,
    evidence_refs: evidenceRefs,
    source_refs: outputSourceRefs,
  };
  const candidateMaterial = mergeCandidateMaterial([
    buildStructuredCandidateMaterial({
      report: structuredReport,
      normalizedReport,
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
  const hasResultReportMaterial =
    structuredReport !== null || (Boolean(trimmedRawText) && !rawTooLarge);
  const rawTextStatus =
    rawTooLarge ? "too_large" : rawUnsafeMarkers.length > 0 ? "unsafe" : trimmedRawText ? "supplied" : "missing";
  const reportStatus = result_report === undefined || result_report === null
    ? "missing"
    : structuredReport || typeof result_report === "string"
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
      ? ["evidence_refs_missing_for_codex_result_report_candidate_ingest"]
      : [];
  const hasWorkOrResultRef =
    isCandidateIngressPublicSafeRefV01(resolvedWorkRef ?? "") ||
    isCandidateIngressPublicSafeRefV01(resolvedResultRef ?? "");
  const insufficientDataReasons = buildInsufficientDataReasons({
    hasResultReportMaterial,
    source_ref,
    operator_ref,
    hasWorkOrResultRef,
    candidateCount,
    ingestableCandidateCount,
    missingEvidence,
    reportStatus,
    rawTextStatus,
  });
  const readiness = {
    ready_for_operator_review:
      ingestableCandidateCount > 0 &&
      blockedReasons.length === 0 &&
      isCandidateIngressPublicSafeRefV01(source_ref ?? "") &&
      isCandidateIngressPublicSafeRefV01(operator_ref ?? "") &&
      hasWorkOrResultRef,
    ready_for_candidate_ingest_record:
      ingestableCandidateCount > 0 &&
      blockedReasons.length === 0 &&
      insufficientDataReasons.length === 0 &&
      missingEvidence.length === 0,
    requires_result_report_or_raw_text: !hasResultReportMaterial,
    requires_source_ref: !isCandidateIngressPublicSafeRefV01(source_ref ?? ""),
    requires_operator_ref: !isCandidateIngressPublicSafeRefV01(operator_ref ?? ""),
    requires_work_or_result_ref: !hasWorkOrResultRef,
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
    hasResultReportMaterial,
    reportStatus,
    rawTextStatus,
    candidateCount,
    ingestableCandidateCount,
    blockedReasons,
    readiness,
  });
  const recommendedNextAction = determineNextAction({
    readiness,
    blockedReasons,
    missingEvidence,
  });

  return {
    preview_version: CODEX_RESULT_REPORT_INTAKE_PREVIEW_VERSION,
    scope: scope ?? DEFAULT_SCOPE,
    as_of:
      as_of ??
      stringField(structuredReport, "created_at") ??
      stringField(structuredReport, "reported_at") ??
      FALLBACK_AS_OF,
    source_refs: outputSourceRefs,
    source_kind: "codex_result_report",
    intake_preview_status: intakePreviewStatus,
    recommended_next_action: recommendedNextAction,
    input_summary: {
      has_result_report: reportStatus !== "missing",
      has_raw_text: rawTextStatus !== "missing",
      source_ref_supplied: Boolean(source_ref?.trim()),
      operator_ref_supplied: Boolean(operator_ref?.trim()),
      work_ref_supplied: Boolean(resolvedWorkRef?.trim()),
      result_ref_supplied: Boolean(resolvedResultRef?.trim()),
      pr_ref_supplied: Boolean(resolvedPrRef?.trim()),
      commit_ref_supplied: Boolean(resolvedCommitRef?.trim()),
      project_ref_supplied: Boolean(resolvedProjectRef?.trim()),
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
      result_report: reportStatus,
      raw_text: rawTextStatus,
      source_kind: "known",
      source_ref: refStatus(source_ref),
      operator_ref: refStatus(operator_ref),
      work_ref: optionalRefStatus(resolvedWorkRef),
      result_ref: optionalRefStatus(resolvedResultRef),
      pr_ref: optionalRefStatus(resolvedPrRef),
      commit_ref: optionalRefStatus(resolvedCommitRef),
      project_ref: optionalRefStatus(resolvedProjectRef),
      authority_boundary: "valid_read_only",
    },
    candidate_material: candidateMaterial,
    extracted_preview: extractedPreview,
    readiness,
    evidence_summary: {
      has_result_report_material: hasResultReportMaterial,
      has_candidate_material: ingestableCandidateCount > 0,
      has_source_refs: outputSourceRefs.length > 0,
      has_evidence_refs: evidenceRefs.length > 0,
      has_operator_ref: isCandidateIngressPublicSafeRefV01(operator_ref ?? ""),
      has_work_or_result_ref: hasWorkOrResultRef,
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
      "codex_result_report_intake_requires_operator_privacy_review_before_candidate_record_write",
      "raw_text_and_raw_report_material_are_not_stored_as_durable_state_by_this_preview",
      normalizedReport
        ? "existing_codex_result_report_normalizer_aligned_for_public_safe_review_cues"
        : "existing_codex_result_report_normalizer_not_applicable_to_this_input_shape",
    ],
    operator_review_checklist: [
      "confirm_codex_result_report_material_is_selected_and_source_refed",
      "confirm_candidate_summaries_are_bounded_and_review_only",
      "confirm_evidence_refs_support_codex_result_candidates",
      "confirm_no_private_paths_tokens_passwords_or_credential_urls",
      "confirm_codex_result_report_intake_is_not_dogfood_outcome_approval",
    ],
    would_not_ingest: [
      "does_not_write_work_episode",
      "does_not_write_expected_observed_delta",
      "does_not_write_reuse_outcome_ledger",
      "does_not_write_dogfood_metrics",
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
      "dogfood_metric_write",
      "reuse_outcome_ledger_write",
      "expected_observed_delta_write",
      "work_episode_write",
      "provider_github_codex_call",
      "automatic_codex_result_promotion",
    ],
    authority_boundary: createCodexResultReportIntakeAuthorityBoundaryV01(),
  };
}

export function createCodexResultReportIntakeAuthorityBoundaryV01(): CodexResultReportIntakeAuthorityBoundary {
  return {
    read_only: true,
    advisory_only: true,
    source_of_truth: false,
    derived_read_model: true,
    can_write_db: false,
    can_create_schema: false,
    can_create_ingest_record: false,
    can_create_ingest_receipt: false,
    can_write_work_episode: false,
    can_write_expected_observed_delta: false,
    can_write_reuse_outcome_ledger: false,
    can_write_dogfood_metrics: false,
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
      "Codex result report intake preview is a read-only derived model.",
      "It normalizes selected Codex result material into candidate-only review items and cannot write WorkEpisode, ExpectedObservedDelta, reuse outcomes, dogfood metrics, memory, Perspective, CWP, relay, handoff state, providers, GitHub, Codex, or autonomous actions.",
    ],
  };
}

function buildExtractedPreview(rawText: string): CodexResultReportExtractedPreview {
  const lines = rawText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  return {
    heading_lines: lines
      .filter((line) => /^(#{1,4}\s+|summary:|result_status:|changed files?:|checks?:|skipped checks?:|not done:|follow[- ]?ups?:|expected|observed)/i.test(line))
      .slice(0, 12),
    result_status_lines: lines
      .filter((line) => /^result[_ -]?status:|\b(result_status|passed|failed|blocked|written|refused)\b/i.test(line))
      .slice(0, 12),
    changed_file_lines: lines
      .filter((line) => /^[-*]\s+[\w./-]+\.(ts|tsx|js|jsx|mjs|json|md)\b|^(changed files?|files?):/i.test(line))
      .slice(0, 30),
    check_lines: lines
      .filter((line) => /\b(npm run|smoke:|typecheck|passed|failed|check)\b/i.test(line))
      .slice(0, 24),
    skipped_check_lines: lines
      .filter((line) => /\b(skipped|not run|unable to run)\b/i.test(line))
      .slice(0, 18),
    not_done_or_followup_lines: lines
      .filter((line) => /\b(not done|follow[- ]?up|remaining|next)\b/i.test(line))
      .slice(0, 18),
    expected_observed_lines: lines
      .filter((line) => /\b(expected|observed|delta|actual)\b/i.test(line))
      .slice(0, 18),
    pr_like_refs: uniqueCandidateIngressStringsV01(
      rawText.match(/\b(?:PR\s*#|pull\/)(\d{1,8})\b/gi) ?? [],
    ).slice(0, 20),
    commit_like_refs: uniqueCandidateIngressStringsV01(
      rawText.match(/\b[0-9a-f]{7,40}\b/gi) ?? [],
    ).slice(0, 20),
    explicit_ref_like_tokens: uniqueCandidateIngressStringsV01(
      rawText.match(/\b(?:source|evidence|work|result|project|pr|commit|ref):[^\s,;)]+/gi) ?? [],
    ).slice(0, 30),
    possible_dates: uniqueCandidateIngressStringsV01(
      rawText.match(/\b\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z?)?\b/g) ?? [],
    ).slice(0, 20),
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
  result_ref?: string;
  pr_ref?: string;
  commit_ref?: string;
  evidence_refs: string[];
  source_refs: string[];
};

function buildStructuredCandidateMaterial({
  report,
  normalizedReport,
  unsafeFields,
  context,
}: {
  report: Record<string, unknown> | null;
  normalizedReport: NormalizedCodexResultReport | null;
  unsafeFields: string[];
  context: CandidateContext;
}): CodexResultReportCandidateMaterial {
  const material = emptyCandidateMaterial();
  if (!report && !normalizedReport) return material;
  if (!unsafeFields.includes("summary")) {
    pushCandidate(material.result_summary_candidates, context, {
      candidate_kind: "project_state_summary",
      label: stringField(report, "result_status") ?? "Codex result report summary",
      summary:
        stringField(report, "summary") ??
        normalizedReport?.normalized_summary ??
        "",
      seed: "summary",
    });
  }
  for (const [field, target, kind] of [
    ["changed_files", material.changed_file_candidates, "changed_artifact_ref"],
    ["checks", material.check_result_candidates, "expected_observed_signal"],
    ["skipped_checks", material.skipped_check_candidates, "expected_observed_signal"],
    ["not_done", material.not_done_candidates, "next_action"],
    ["requirement_progress", material.requirement_progress_candidates, "requirement"],
    ["expected_vs_observed", material.expected_observed_signal_candidates, "expected_observed_signal"],
    ["context_feedback", material.context_reuse_signal_candidates, "reusable_context"],
    ["handoff_feedback", material.context_reuse_signal_candidates, "reusable_context"],
    ["unexpected_changes", material.risk_or_regression_candidates, "risk_or_blocker"],
    ["regressions_or_risks", material.risk_or_regression_candidates, "risk_or_blocker"],
    ["followups", material.followup_candidates, "next_action"],
  ] as const) {
    if (unsafeFields.includes(field)) continue;
    stringArrayField(report, field).forEach((item, index) =>
      pushCandidate(target, context, {
        candidate_kind: kind,
        label: item,
        summary: item,
        seed: `${field}:${index}:${item}`,
      }),
    );
  }
  for (const [items, target, kind, seedPrefix] of [
    [normalizedReport?.changed_file_refs ?? [], material.changed_file_candidates, "changed_artifact_ref", "normalized_changed_file"],
    [normalizedReport?.observed_check_refs ?? [], material.check_result_candidates, "expected_observed_signal", "normalized_check"],
    [normalizedReport?.skipped_check_refs ?? [], material.skipped_check_candidates, "expected_observed_signal", "normalized_skipped"],
    [normalizedReport?.not_done_refs ?? [], material.not_done_candidates, "next_action", "normalized_not_done"],
    [normalizedReport?.expected_observed_delta_refs ?? [], material.expected_observed_signal_candidates, "expected_observed_signal", "normalized_expected_observed"],
  ] as const) {
    items.forEach((item, index) =>
      pushCandidate(target, context, {
        candidate_kind: kind,
        label: item,
        summary: item,
        seed: `${seedPrefix}:${index}:${item}`,
      }),
    );
  }
  context.evidence_refs.forEach((ref) =>
    pushCandidate(material.evidence_ref_candidates, context, {
      candidate_kind: "evidence_ref",
      label: ref,
      summary: `Codex result report evidence ref ${ref}`,
      seed: `evidence:${ref}`,
    }),
  );
  context.source_refs.forEach((ref) =>
    pushCandidate(material.source_ref_candidates, context, {
      candidate_kind: "source_ref",
      label: ref,
      summary: `Codex result report source ref ${ref}`,
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
  extractedPreview: CodexResultReportExtractedPreview;
  rawTextUsable: boolean;
  context: CandidateContext;
}): CodexResultReportCandidateMaterial {
  const material = emptyCandidateMaterial();
  if (!rawTextUsable) return material;
  extractedPreview.result_status_lines.forEach((line, index) =>
    pushCandidate(material.result_summary_candidates, context, {
      candidate_kind: "project_state_summary",
      label: line,
      summary: line,
      confidence: "inferred_heuristic",
      generated_view: true,
      seed: `raw_result:${index}:${line}`,
    }),
  );
  extractedPreview.changed_file_lines.forEach((line, index) =>
    pushCandidate(material.changed_file_candidates, context, {
      candidate_kind: "changed_artifact_ref",
      label: line,
      summary: line,
      confidence: "inferred_heuristic",
      generated_view: true,
      seed: `raw_changed:${index}:${line}`,
    }),
  );
  extractedPreview.check_lines.forEach((line, index) =>
    pushCandidate(material.check_result_candidates, context, {
      candidate_kind: "expected_observed_signal",
      label: line,
      summary: line,
      confidence: "inferred_heuristic",
      generated_view: true,
      seed: `raw_check:${index}:${line}`,
    }),
  );
  extractedPreview.skipped_check_lines.forEach((line, index) =>
    pushCandidate(material.skipped_check_candidates, context, {
      candidate_kind: "expected_observed_signal",
      label: line,
      summary: line,
      confidence: "inferred_heuristic",
      generated_view: true,
      seed: `raw_skipped:${index}:${line}`,
    }),
  );
  extractedPreview.not_done_or_followup_lines.forEach((line, index) =>
    pushCandidate(material.followup_candidates, context, {
      candidate_kind: "next_action",
      label: line,
      summary: line,
      confidence: "inferred_heuristic",
      generated_view: true,
      seed: `raw_followup:${index}:${line}`,
    }),
  );
  extractedPreview.expected_observed_lines.forEach((line, index) =>
    pushCandidate(material.expected_observed_signal_candidates, context, {
      candidate_kind: "expected_observed_signal",
      label: line,
      summary: line,
      confidence: "inferred_heuristic",
      generated_view: true,
      seed: `raw_expected_observed:${index}:${line}`,
    }),
  );
  extractedPreview.pr_like_refs.forEach((ref) =>
    pushCandidate(material.changed_file_candidates, context, {
      candidate_kind: "changed_artifact_ref",
      label: ref,
      summary: `Codex result report PR-like ref ${ref}`,
      confidence: "inferred_heuristic",
      generated_view: true,
      pr_ref: ref.replace(/\s+/g, ""),
      seed: `raw_pr:${ref}`,
    }),
  );
  extractedPreview.commit_like_refs.forEach((ref) =>
    pushCandidate(material.changed_file_candidates, context, {
      candidate_kind: "changed_artifact_ref",
      label: ref,
      summary: `Codex result report commit-like ref ${ref}`,
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
    source_kind: "codex_result_report",
    label: input.label,
    summary,
    source_ref: context.source_ref,
    operator_ref: context.operator_ref,
    project_ref: context.project_ref,
    work_ref: context.work_ref,
    result_ref: context.result_ref,
    pr_ref: input.pr_ref ?? context.pr_ref,
    commit_ref: input.commit_ref ?? context.commit_ref,
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

function buildStructuredUnsafeReasons(report: Record<string, unknown> | null) {
  const reasons: string[] = [];
  const unsafeFields: string[] = [];
  if (!report) return { reasons, unsafeFields };
  for (const field of structuredFreeTextFields) {
    const values = stringArrayField(report, field);
    if (values.some(containsCandidateIngressUnsafeMarkerV01)) {
      unsafeFields.push(field);
      reasons.push(`codex_result_report_${field}_unsafe`);
      reasons.push("codex_result_report_contains_secret_or_private_marker");
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
  hasResultReportMaterial,
  source_ref,
  operator_ref,
  hasWorkOrResultRef,
  candidateCount,
  ingestableCandidateCount,
  missingEvidence,
  reportStatus,
  rawTextStatus,
}: {
  hasResultReportMaterial: boolean;
  source_ref?: string;
  operator_ref?: string;
  hasWorkOrResultRef: boolean;
  candidateCount: number;
  ingestableCandidateCount: number;
  missingEvidence: string[];
  reportStatus: string;
  rawTextStatus: string;
}) {
  const reasons: string[] = [];
  if (!hasResultReportMaterial) reasons.push("codex_result_report_or_raw_text_missing");
  if (reportStatus === "malformed") reasons.push("codex_result_report_malformed");
  if (rawTextStatus === "too_large") reasons.push("raw_text_too_large_for_preview");
  if (!isCandidateIngressPublicSafeRefV01(source_ref ?? "")) reasons.push("source_ref_missing");
  if (!isCandidateIngressPublicSafeRefV01(operator_ref ?? "")) reasons.push("operator_ref_missing");
  if (!hasWorkOrResultRef) reasons.push("work_or_result_ref_missing");
  if (candidateCount === 0 || ingestableCandidateCount === 0) reasons.push("codex_result_candidate_material_missing");
  reasons.push(...missingEvidence);
  return uniqueCandidateIngressStringsV01(reasons);
}

function determineStatus({
  hasResultReportMaterial,
  reportStatus,
  rawTextStatus,
  candidateCount,
  ingestableCandidateCount,
  blockedReasons,
  readiness,
}: {
  hasResultReportMaterial: boolean;
  reportStatus: string;
  rawTextStatus: string;
  candidateCount: number;
  ingestableCandidateCount: number;
  blockedReasons: string[];
  readiness: { ready_for_operator_review: boolean; ready_for_candidate_ingest_record: boolean };
}): CodexResultReportIntakePreviewStatus {
  if (!hasResultReportMaterial) return "no_result_report";
  if (reportStatus === "malformed") return "malformed";
  if (blockedReasons.length > 0 || rawTextStatus === "unsafe") return "unsafe";
  if (readiness.ready_for_candidate_ingest_record) return "ready_for_operator_review";
  if (readiness.ready_for_operator_review || ingestableCandidateCount > 0) return "candidate_material_available";
  if (candidateCount > 0) return "keep_preview_only";
  return "insufficient_data";
}

function determineNextAction({
  readiness,
  blockedReasons,
  missingEvidence,
}: {
  readiness: CodexResultReportIntakePreview["readiness"];
  blockedReasons: string[];
  missingEvidence: string[];
}): CodexResultReportIntakeRecommendedNextAction {
  if (blockedReasons.length > 0) return "resolve_unsafe_refs";
  if (readiness.requires_result_report_or_raw_text) return "supply_codex_result_report";
  if (readiness.requires_source_ref) return "supply_source_ref";
  if (readiness.requires_operator_ref) return "supply_operator_ref";
  if (readiness.requires_work_or_result_ref) return "supply_work_or_result_ref";
  if (missingEvidence.length > 0) return "supply_evidence_refs";
  if (readiness.ready_for_candidate_ingest_record) return "prepare_codex_result_report_candidate_ingest";
  if (readiness.ready_for_operator_review) return "review_codex_result_candidates";
  return "keep_preview_only";
}

function emptyCandidateMaterial(): CodexResultReportCandidateMaterial {
  return {
    result_summary_candidates: [],
    changed_file_candidates: [],
    check_result_candidates: [],
    skipped_check_candidates: [],
    not_done_candidates: [],
    requirement_progress_candidates: [],
    expected_observed_signal_candidates: [],
    context_reuse_signal_candidates: [],
    risk_or_regression_candidates: [],
    followup_candidates: [],
    evidence_ref_candidates: [],
    source_ref_candidates: [],
    reusable_context_candidates: [],
    review_only_candidates: [],
  };
}

function mergeCandidateMaterial(
  materials: CodexResultReportCandidateMaterial[],
): CodexResultReportCandidateMaterial {
  const merged = emptyCandidateMaterial();
  for (const material of materials) {
    for (const key of Object.keys(merged) as Array<keyof CodexResultReportCandidateMaterial>) {
      merged[key].push(...material[key]);
    }
  }
  return merged;
}

function countCandidates(material: CodexResultReportCandidateMaterial): number {
  return Object.values(material).reduce((sum, bucket) => sum + bucket.length, 0);
}

function countIngestableCandidates(material: CodexResultReportCandidateMaterial): number {
  return countCandidates({
    ...material,
    review_only_candidates: [],
  });
}

type NormalizedCodexResultReport = {
  normalized_summary: string;
  source_refs: string[];
  changed_file_refs: string[];
  observed_check_refs: string[];
  skipped_check_refs: string[];
  not_done_refs: string[];
  expected_observed_delta_refs: string[];
};

function tryNormalizeExistingCodexResultReport(
  report: Record<string, unknown> | null,
): NormalizedCodexResultReport | null {
  if (!report) return null;
  try {
    const normalized = normalizeCodexResultReportV01(report) as unknown;
    if (!isRecord(normalized)) return null;
    return {
      normalized_summary: typeof normalized.normalized_summary === "string"
        ? normalized.normalized_summary
        : "",
      source_refs: stringArrayField(normalized, "source_refs"),
      changed_file_refs: stringArrayField(normalized, "changed_file_refs"),
      observed_check_refs: stringArrayField(normalized, "observed_check_refs"),
      skipped_check_refs: stringArrayField(normalized, "skipped_check_refs"),
      not_done_refs: stringArrayField(normalized, "not_done_refs"),
      expected_observed_delta_refs: stringArrayField(
        normalized,
        "expected_observed_delta_refs",
      ),
    };
  } catch {
    return null;
  }
}

function stringField(record: Record<string, unknown> | null, field: string): string | undefined {
  const value = record?.[field];
  return typeof value === "string" && value.trim() ? value : undefined;
}

function firstStringField(record: Record<string, unknown> | null, field: string): string | undefined {
  return stringArrayField(record, field)[0];
}

function stringArrayField(record: Record<string, unknown> | null, field: string): string[] {
  const value = record?.[field];
  if (typeof value === "string" && value.trim()) return [value];
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (typeof item === "string") return item;
      if (isRecord(item)) {
        return (
          stringField(item, "summary") ??
          stringField(item, "label") ??
          stringField(item, "path") ??
          stringField(item, "ref") ??
          stringField(item, "command") ??
          stringField(item, "name") ??
          ""
        );
      }
      return "";
    })
    .filter(Boolean)
    .slice(0, 50);
}

function safePrefixedRef(prefix: string, value: string | undefined): string | undefined {
  if (!value) return undefined;
  if (value.includes(":")) return value;
  const candidate = `${prefix}:${value.replace(/\s+/g, "-")}`;
  return isCandidateIngressPublicSafeRefV01(candidate) ? candidate : undefined;
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
