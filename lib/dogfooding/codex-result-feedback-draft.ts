import type { CodexResultReportIngestionRecordV01 } from "@/lib/dogfooding/codex-result-report-normalizer";
import type { HandoffContextRelayRationale } from "@/types/handoff-context-relay-rationale";
import {
  CODEX_RESULT_FEEDBACK_DRAFT_VERSION,
  type CodexContextReuseRef,
  type CodexExpectedObservedDeltaDraft,
  type CodexResultCarryForwardSuggestions,
  type CodexResultExpectationItem,
  type CodexResultFeedbackDraft,
  type CodexResultFeedbackDraftAuthorityBoundary,
  type CodexResultFeedbackDraftCandidateStatus,
  type CodexResultFeedbackDraftConfidence,
  type CodexResultFeedbackObservedReturnSignal,
  type CodexResultFeedbackReturnSignal,
  type CodexReuseOutcomeDraft,
} from "@/types/codex-result-feedback-draft";

const FALLBACK_AS_OF = "1970-01-01T00:00:00.000Z" as const;
const DEFAULT_SCOPE = "project:augnes" as const;

const KNOWN_EXPECTED_FIELDS = [
  "changed_files",
  "checks_run",
  "skipped_checks",
  "requirement_progress",
  "context_helpful_or_stale_refs",
  "unresolved_gaps",
  "next_relay_update_suggestions",
] as const;

export type CodexResultFeedbackDraftInput = {
  handoff_context_rationale?: HandoffContextRelayRationale | null;
  result_report?: CodexResultReportIngestionRecordV01 | null;
  as_of?: string;
};

export function buildCodexResultFeedbackDraft({
  handoff_context_rationale: rationale,
  result_report: report,
  as_of,
}: CodexResultFeedbackDraftInput): CodexResultFeedbackDraft {
  const expectedReturnSignal = buildExpectedReturnSignal(rationale);
  const observedReturnSignal = buildObservedReturnSignal(report);
  const insufficientDataReasons = buildInsufficientDataReasons({
    rationale,
    report,
    observedReturnSignal,
  });
  const expectedObservedDelta = buildExpectedObservedDeltaDraft({
    expectedReturnSignal,
    observedReturnSignal,
    report,
    insufficientDataReasons,
  });
  const reuseOutcomeDraft = buildReuseOutcomeDraft({
    rationale,
    report,
    insufficientDataReasons,
  });
  const carryForwardSuggestions = buildCarryForwardSuggestions({
    rationale,
    expectedObservedDelta,
    reuseOutcomeDraft,
    observedReturnSignal,
  });
  const staleOrGapWarnings = uniqueSortedStrings([
    ...(rationale?.stale_or_gap_warnings.map((warning) => warning.summary) ?? [
      "missing_handoff_context_rationale",
    ]),
    ...observedReturnSignal.unresolved_gaps,
    ...expectedObservedDelta.missing_expectations.map(
      (item) => `missing_expected_return_signal:${item.field}`,
    ),
  ]);
  const candidateStatus = determineCandidateStatus({
    insufficientDataReasons,
    expectedObservedDelta,
    reuseOutcomeDraft,
  });

  return {
    runtime: "augnes",
    draft_version: CODEX_RESULT_FEEDBACK_DRAFT_VERSION,
    scope: rationale?.scope ?? report?.scope ?? DEFAULT_SCOPE,
    as_of: as_of ?? report?.reported_at ?? rationale?.as_of ?? FALLBACK_AS_OF,
    source_refs: buildSourceRefs({ rationale, report }),
    result_report_refs: {
      result_report_ref: report?.report_id ?? null,
      result_report_fingerprint: report?.report_fingerprint ?? null,
      pr_refs: report?.pr_refs ?? [],
      branch_ref: report?.branch_ref ?? null,
      commit_refs: report?.commit_refs ?? [],
      source_refs: report?.source_refs ?? [],
    },
    handoff_context_refs: {
      context_relay_rationale_ref: rationale
        ? `handoff-context-relay-rationale:${rationale.rationale_version}`
        : null,
      context_relay_rationale_version: rationale?.rationale_version ?? null,
      continuity_relay_ref: rationale?.source_refs.continuity_relay_ref ?? null,
      handoff_capsule_ref: rationale?.source_refs.handoff_capsule_ref ?? null,
      codex_launch_card_ref: rationale?.source_refs.codex_launch_card_ref ?? null,
      selected_refs: rationale?.selected_refs.map((ref) => ref.ref_id) ?? [],
      selected_source_refs: rationale?.source_refs.selected_source_refs ?? [],
    },
    expected_return_signal: expectedReturnSignal,
    observed_return_signal: observedReturnSignal,
    expected_observed_delta: expectedObservedDelta,
    reuse_outcome_draft: reuseOutcomeDraft,
    carry_forward_suggestions: carryForwardSuggestions,
    insufficient_data_reasons: insufficientDataReasons,
    stale_or_gap_warnings: staleOrGapWarnings,
    authority_boundary: buildAuthorityBoundary(),
    candidate_status: candidateStatus,
    source_status: {
      handoff_context_rationale: rationale ? "supplied" : "missing",
      codex_result_report: report ? "supplied" : "missing",
      codex_result_report_status: report?.status ?? "missing",
    },
    fallback_reason: {
      handoff_context_rationale: rationale
        ? null
        : "Handoff Context Relay Rationale was not supplied; reuse comparison remains insufficient_data.",
      codex_result_report: report
        ? null
        : "Codex Result Report was not supplied; expected/observed comparison remains insufficient_data.",
    },
    notes: [
      "Derived from a normalized Codex Result Report and the existing Handoff Context Relay Rationale.",
      "This is candidate feedback material only; it does not update memory, dogfood metrics, Perspective state, GitHub, Codex, or handoff delivery.",
    ],
  };
}

function buildExpectedReturnSignal(
  rationale?: HandoffContextRelayRationale | null,
): CodexResultFeedbackReturnSignal {
  const expected = rationale?.expected_return_signal;
  return {
    signal_version: expected?.signal_version ?? null,
    required_fields: expected?.required_fields ?? [...KNOWN_EXPECTED_FIELDS],
    context_feedback_fields: expected?.context_feedback_fields ?? [],
    instructions: expected?.instructions ?? [
      "No Handoff Context Relay Rationale was supplied, so expected return signal fields use the v0.1 fallback list.",
    ],
  };
}

function buildObservedReturnSignal(
  report?: CodexResultReportIngestionRecordV01 | null,
): CodexResultFeedbackObservedReturnSignal {
  if (!report) {
    return {
      changed_files: [],
      checks_run: [],
      skipped_checks: [],
      requirement_progress: [],
      context_helpful_or_stale_refs: [],
      unresolved_gaps: [],
      next_relay_update_suggestions: [],
    };
  }

  const allResultRefs = collectResultSignalRefs(report);
  return {
    changed_files: uniqueSortedStrings([
      ...report.changed_file_refs,
      ...report.observed_file_refs,
    ]),
    checks_run: uniqueSortedStrings(report.observed_check_refs),
    skipped_checks: uniqueSortedStrings(report.skipped_check_refs),
    requirement_progress: uniqueSortedStrings([
      report.normalized_summary,
      ...report.expected_observed_delta_refs.filter((ref) =>
        includesAny(ref, ["requirement", "progress", "done", "completed"]),
      ),
    ]),
    context_helpful_or_stale_refs: uniqueSortedStrings(
      allResultRefs.filter((ref) =>
        includesAny(ref, [
          "context-helpful",
          "context_helpful",
          "context-stale",
          "context_stale",
          "context-missing",
          "context_missing",
          "context-noisy",
          "context_noisy",
          "context-misleading",
          "context_misleading",
        ]),
      ),
    ),
    unresolved_gaps: uniqueSortedStrings([
      ...report.not_done_refs,
      ...report.known_warning_refs.filter((ref) =>
        includesAny(ref, ["gap", "unresolved", "blocked", "warning"]),
      ),
    ]),
    next_relay_update_suggestions: uniqueSortedStrings(
      allResultRefs.filter((ref) =>
        includesAny(ref, [
          "next-relay-update",
          "next_relay_update",
          "relay-update",
          "relay_update",
          "next-handoff",
          "next_handoff",
        ]),
      ),
    ),
  };
}

function buildExpectedObservedDeltaDraft({
  expectedReturnSignal,
  observedReturnSignal,
  report,
  insufficientDataReasons,
}: {
  expectedReturnSignal: CodexResultFeedbackReturnSignal;
  observedReturnSignal: CodexResultFeedbackObservedReturnSignal;
  report?: CodexResultReportIngestionRecordV01 | null;
  insufficientDataReasons: string[];
}): CodexExpectedObservedDeltaDraft {
  const matched: CodexResultExpectationItem[] = [];
  const missing: CodexResultExpectationItem[] = [];

  for (const field of uniqueSortedStrings([
    ...expectedReturnSignal.required_fields,
    ...expectedReturnSignal.context_feedback_fields,
  ])) {
    const observed = observedValuesForExpectedField(field, observedReturnSignal);
    const item = buildExpectationItem({
      field,
      observed,
      report,
      status: observed.length > 0 ? "matched" : "missing",
    });
    if (observed.length > 0) {
      matched.push(item);
    } else {
      missing.push(item);
    }
  }

  const unexpected = buildUnexpectedObservations(report, expectedReturnSignal);
  const deltaInsufficientReasons = uniqueSortedStrings([
    ...insufficientDataReasons,
    ...missing.map((item) => `missing_expected_return_signal:${item.field}`),
  ]);

  return {
    matched_expectations: matched,
    missing_expectations: missing,
    unexpected_observations: unexpected,
    skipped_or_unverified_checks: observedReturnSignal.skipped_checks,
    changed_files_observed: observedReturnSignal.changed_files,
    checks_observed: observedReturnSignal.checks_run,
    requirement_progress_observed: observedReturnSignal.requirement_progress,
    not_done_items: observedReturnSignal.unresolved_gaps,
    mismatch_summary: buildMismatchSummary({ matched, missing, unexpected }),
    confidence: confidenceFor({
      report,
      missingCount: missing.length,
      insufficientDataReasons: deltaInsufficientReasons,
    }),
    insufficient_data_reasons: deltaInsufficientReasons,
  };
}

function buildExpectationItem({
  field,
  observed,
  report,
  status,
}: {
  field: string;
  observed: string[];
  report?: CodexResultReportIngestionRecordV01 | null;
  status: "matched" | "missing";
}): CodexResultExpectationItem {
  return {
    field,
    status,
    summary:
      status === "matched"
        ? `${field} was present in the normalized Codex Result Report.`
        : `${field} was expected by the handoff context but was not present in the normalized Codex Result Report.`,
    source_refs: uniqueSortedStrings([
      ...(observed.length > 0 ? observed : []),
      ...(report ? [`codex-result-report:${report.report_id}`] : []),
    ]),
  };
}

function buildUnexpectedObservations(
  report: CodexResultReportIngestionRecordV01 | null | undefined,
  expectedReturnSignal: CodexResultFeedbackReturnSignal,
): CodexResultExpectationItem[] {
  if (!report) return [];
  const expected = new Set([
    ...expectedReturnSignal.required_fields,
    ...expectedReturnSignal.context_feedback_fields,
  ]);
  const observations: CodexResultExpectationItem[] = [];
  if (report.known_warning_refs.length > 0 && !expected.has("known_warnings")) {
    observations.push({
      field: "known_warnings",
      status: "unexpected",
      summary:
        "Known warnings were reported even though the handoff return signal did not explicitly request that field.",
      source_refs: report.known_warning_refs,
    });
  }
  if (report.expected_observed_delta_refs.length > 0) {
    observations.push({
      field: "reported_expected_observed_delta_refs",
      status: "unexpected",
      summary:
        "The result report already included expected/observed delta refs; preserve them as candidate comparison material.",
      source_refs: report.expected_observed_delta_refs,
    });
  }
  return observations;
}

function buildReuseOutcomeDraft({
  rationale,
  report,
  insufficientDataReasons,
}: {
  rationale?: HandoffContextRelayRationale | null;
  report?: CodexResultReportIngestionRecordV01 | null;
  insufficientDataReasons: string[];
}): CodexReuseOutcomeDraft {
  const selectedRefs = rationale?.selected_refs ?? [];
  const resultRefs = report ? collectResultSignalRefs(report) : [];
  const buckets = {
    helpful_refs: [] as CodexContextReuseRef[],
    stale_refs: [] as CodexContextReuseRef[],
    missing_refs: [] as CodexContextReuseRef[],
    noisy_refs: [] as CodexContextReuseRef[],
    misleading_refs: [] as CodexContextReuseRef[],
    unused_or_unmentioned_refs: [] as CodexContextReuseRef[],
    unknown_refs: [] as CodexContextReuseRef[],
  };

  for (const ref of selectedRefs) {
    const evidence = resultRefs.filter((resultRef) => resultRef.includes(ref.ref_id));
    const reuseRef = {
      ref_id: ref.ref_id,
      label: ref.label,
      reason_category: ref.reason_category,
      evidence_refs: evidence,
      summary: ref.summary,
    };

    if (evidence.length === 0) {
      buckets.unknown_refs.push(reuseRef);
      continue;
    }
    if (evidenceHasFeedback(evidence, "misleading")) {
      buckets.misleading_refs.push(reuseRef);
    } else if (evidenceHasFeedback(evidence, "noisy")) {
      buckets.noisy_refs.push(reuseRef);
    } else if (evidenceHasFeedback(evidence, "stale")) {
      buckets.stale_refs.push(reuseRef);
    } else if (evidenceHasFeedback(evidence, "missing")) {
      buckets.missing_refs.push(reuseRef);
    } else if (evidenceHasFeedback(evidence, "helpful")) {
      buckets.helpful_refs.push(reuseRef);
    } else {
      buckets.unused_or_unmentioned_refs.push(reuseRef);
    }
  }

  const correctionsNeeded = uniqueSortedStrings([
    ...buckets.stale_refs.map((ref) => `review_stale_ref:${ref.ref_id}`),
    ...buckets.missing_refs.map((ref) => `add_missing_ref:${ref.ref_id}`),
    ...buckets.noisy_refs.map((ref) => `deprioritize_noisy_ref:${ref.ref_id}`),
    ...buckets.misleading_refs.map(
      (ref) => `correct_misleading_ref:${ref.ref_id}`,
    ),
    ...(rationale
      ? []
      : ["missing_handoff_context_rationale_prevents_reuse_assessment"]),
    ...(report ? [] : ["missing_codex_result_report_prevents_reuse_assessment"]),
  ]);
  const actionableCount =
    buckets.helpful_refs.length +
    buckets.stale_refs.length +
    buckets.missing_refs.length +
    buckets.noisy_refs.length +
    buckets.misleading_refs.length;

  return {
    helpful_refs: sortReuseRefs(buckets.helpful_refs),
    stale_refs: sortReuseRefs(buckets.stale_refs),
    missing_refs: sortReuseRefs(buckets.missing_refs),
    noisy_refs: sortReuseRefs(buckets.noisy_refs),
    misleading_refs: sortReuseRefs(buckets.misleading_refs),
    unused_or_unmentioned_refs: sortReuseRefs(buckets.unused_or_unmentioned_refs),
    unknown_refs: sortReuseRefs(buckets.unknown_refs),
    context_helpfulness_summary:
      actionableCount > 0
        ? "Some selected context refs had explicit result-report feedback; treat this as candidate reuse signal only."
        : "No selected context refs had explicit helpful/stale/missing/noisy/misleading feedback, so reuse outcome remains unknown.",
    context_corrections_needed: correctionsNeeded,
    confidence:
      insufficientDataReasons.length > 0
        ? "insufficient_data"
        : actionableCount > 0
          ? "medium"
          : "low",
    review_needed: true,
  };
}

function buildCarryForwardSuggestions({
  rationale,
  expectedObservedDelta,
  reuseOutcomeDraft,
  observedReturnSignal,
}: {
  rationale?: HandoffContextRelayRationale | null;
  expectedObservedDelta: CodexExpectedObservedDeltaDraft;
  reuseOutcomeDraft: CodexReuseOutcomeDraft;
  observedReturnSignal: CodexResultFeedbackObservedReturnSignal;
}): CodexResultCarryForwardSuggestions {
  const missingFields = expectedObservedDelta.missing_expectations.map(
    (item) => item.field,
  );
  const problematicRefs = [
    ...reuseOutcomeDraft.stale_refs,
    ...reuseOutcomeDraft.missing_refs,
    ...reuseOutcomeDraft.noisy_refs,
    ...reuseOutcomeDraft.misleading_refs,
  ];
  const preserveRefs = uniqueSortedStrings([
    ...reuseOutcomeDraft.helpful_refs.map((ref) => ref.ref_id),
    ...(rationale?.selected_refs
      .filter(
        (ref) =>
          ref.blocks_handoff ||
          ref.reason_category === "preserve_current_work" ||
          ref.reason_category === "block_confident_handoff_if_missing",
      )
      .map((ref) => ref.ref_id) ?? []),
  ]);
  const warnRefs = uniqueSortedStrings([
    ...problematicRefs.map((ref) => ref.ref_id),
    ...(rationale?.stale_or_gap_warnings.flatMap((warning) => warning.source_refs) ??
      []),
  ]);
  const unresolvedGaps = uniqueSortedStrings([
    ...observedReturnSignal.unresolved_gaps,
    ...expectedObservedDelta.insufficient_data_reasons,
    ...(rationale?.stop_if_missing.map((item) => item.summary) ?? []),
  ]);

  return {
    next_relay_update_suggestions: uniqueSortedStrings([
      ...observedReturnSignal.next_relay_update_suggestions,
      ...missingFields.map((field) => `ask_next_result_for:${field}`),
      ...problematicRefs.map((ref) => `review_context_ref:${ref.ref_id}`),
    ]),
    next_handoff_adjustments: uniqueSortedStrings([
      ...(missingFields.length > 0
        ? [`Make expected return fields explicit: ${missingFields.join(", ")}`]
        : []),
      ...(reuseOutcomeDraft.unknown_refs.length > 0
        ? [
            "Ask the next result to classify selected context refs as helpful, stale, missing, noisy, misleading, or unknown.",
          ]
        : []),
      "Keep stop-if-missing blockers visible until a later slice records reviewed outcome.",
    ]),
    refs_to_preserve_next_time: preserveRefs,
    refs_to_warn_next_time: warnRefs,
    refs_to_drop_or_deprioritize: uniqueSortedStrings([
      ...reuseOutcomeDraft.noisy_refs.map((ref) => ref.ref_id),
      ...reuseOutcomeDraft.misleading_refs.map((ref) => ref.ref_id),
    ]),
    unresolved_gaps: unresolvedGaps,
    next_focus_candidate:
      missingFields.length > 0
        ? `Close missing return signal fields before claiming reuse improvement: ${missingFields.join(", ")}.`
        : "Review context reuse classifications before updating the next relay or handoff.",
  };
}

function buildInsufficientDataReasons({
  rationale,
  report,
  observedReturnSignal,
}: {
  rationale?: HandoffContextRelayRationale | null;
  report?: CodexResultReportIngestionRecordV01 | null;
  observedReturnSignal: CodexResultFeedbackObservedReturnSignal;
}): string[] {
  const reasons: string[] = [];
  if (!rationale) reasons.push("missing_handoff_context_rationale");
  if (!report) reasons.push("missing_codex_result_report");
  if (report?.status === "rejected") reasons.push("codex_result_report_rejected");
  if (report?.status === "blocked_private_or_raw_payload") {
    reasons.push("codex_result_report_blocked_private_or_raw_payload");
  }
  if (report?.status === "blocked_forbidden_authority") {
    reasons.push("codex_result_report_blocked_forbidden_authority");
  }
  if (rationale && rationale.selected_refs.length === 0) {
    reasons.push("handoff_context_rationale_has_no_selected_refs");
  }
  if (
    rationale &&
    report &&
    observedReturnSignal.context_helpful_or_stale_refs.length === 0
  ) {
    reasons.push("missing_context_reuse_feedback_signal");
  }
  return uniqueSortedStrings(reasons);
}

function determineCandidateStatus({
  insufficientDataReasons,
  expectedObservedDelta,
  reuseOutcomeDraft,
}: {
  insufficientDataReasons: string[];
  expectedObservedDelta: CodexExpectedObservedDeltaDraft;
  reuseOutcomeDraft: CodexReuseOutcomeDraft;
}): CodexResultFeedbackDraftCandidateStatus {
  if (
    insufficientDataReasons.includes("missing_handoff_context_rationale") ||
    insufficientDataReasons.includes("missing_codex_result_report")
  ) {
    return "insufficient_data";
  }
  if (
    expectedObservedDelta.missing_expectations.length > 0 ||
    expectedObservedDelta.skipped_or_unverified_checks.length > 0 ||
    reuseOutcomeDraft.unknown_refs.length > 0 ||
    reuseOutcomeDraft.review_needed
  ) {
    return "needs_operator_review";
  }
  return "candidate_ready_for_review";
}

function observedValuesForExpectedField(
  field: string,
  observed: CodexResultFeedbackObservedReturnSignal,
): string[] {
  if (field === "changed_files") return observed.changed_files;
  if (field === "checks_run") return observed.checks_run;
  if (field === "skipped_checks") return observed.skipped_checks;
  if (field === "requirement_progress") return observed.requirement_progress;
  if (field === "context_helpful_or_stale_refs") {
    return observed.context_helpful_or_stale_refs;
  }
  if (field === "unresolved_gaps") return observed.unresolved_gaps;
  if (field === "next_relay_update_suggestions") {
    return observed.next_relay_update_suggestions;
  }
  return [];
}

function buildMismatchSummary({
  matched,
  missing,
  unexpected,
}: {
  matched: CodexResultExpectationItem[];
  missing: CodexResultExpectationItem[];
  unexpected: CodexResultExpectationItem[];
}): string {
  if (missing.length === 0 && unexpected.length === 0) {
    return `Matched ${matched.length} expected return fields with no missing fields.`;
  }
  return `Matched ${matched.length} expected return fields; missing ${missing.length}; unexpected observations ${unexpected.length}.`;
}

function confidenceFor({
  report,
  missingCount,
  insufficientDataReasons,
}: {
  report?: CodexResultReportIngestionRecordV01 | null;
  missingCount: number;
  insufficientDataReasons: string[];
}): CodexResultFeedbackDraftConfidence {
  if (!report || insufficientDataReasons.length > 0) return "insufficient_data";
  if (missingCount === 0) return "medium";
  if (missingCount <= 2) return "low";
  return "insufficient_data";
}

function collectResultSignalRefs(
  report: CodexResultReportIngestionRecordV01,
): string[] {
  return uniqueSortedStrings([
    ...report.source_refs,
    ...report.observed_file_refs,
    ...report.changed_file_refs,
    ...report.observed_check_refs,
    ...report.skipped_check_refs,
    ...report.known_warning_refs,
    ...report.not_done_refs,
    ...report.expected_observed_delta_refs,
    ...report.boundary_notes,
    ...report.review_cues.flatMap((cue) => [
      cue.public_safe_summary,
      ...cue.source_refs,
      ...cue.reason_codes,
    ]),
  ]);
}

function buildSourceRefs({
  rationale,
  report,
}: {
  rationale?: HandoffContextRelayRationale | null;
  report?: CodexResultReportIngestionRecordV01 | null;
}): string[] {
  return uniqueSortedStrings([
    CODEX_RESULT_FEEDBACK_DRAFT_VERSION,
    ...(rationale
      ? [
          rationale.rationale_version,
          ...rationale.source_refs.source_refs,
          ...rationale.source_refs.selected_source_refs,
          ...rationale.selected_refs.map((ref) => ref.ref_id),
        ]
      : ["missing_handoff_context_rationale"]),
    ...(report
      ? [
          report.record_version,
          `codex-result-report-id:${report.report_id}`,
          `codex-result-report-fingerprint:${report.report_fingerprint}`,
          ...report.source_refs,
        ]
      : ["missing_codex_result_report"]),
  ]);
}

function buildAuthorityBoundary(): CodexResultFeedbackDraftAuthorityBoundary {
  return {
    read_only: true,
    candidate_material_only: true,
    source_of_truth: false,
    derived_read_model: true,
    can_write_db: false,
    can_write_dogfood_ledger: false,
    can_mutate_memory: false,
    can_promote_memory: false,
    can_apply_project_perspective: false,
    can_create_promotion_decision: false,
    can_create_formation_receipt: false,
    can_call_provider_openai: false,
    can_call_github: false,
    can_execute_codex: false,
    can_send_handoff: false,
    can_create_pr: false,
    can_merge_pr: false,
    can_run_autonomous_action: false,
    can_create_graph_or_vector_store: false,
    can_create_rag_stack: false,
    can_crawl_or_observe_browser: false,
    notes: [
      "Candidate feedback draft is read-only and advisory.",
      "It cannot write dogfood metrics, durable memory, Perspective state, GitHub, Codex, or handoff delivery.",
    ],
  };
}

function includesAny(value: string, needles: readonly string[]): boolean {
  const normalized = value.toLowerCase();
  return needles.some((needle) => normalized.includes(needle.toLowerCase()));
}

function evidenceHasFeedback(
  evidenceRefs: readonly string[],
  kind: "helpful" | "stale" | "missing" | "noisy" | "misleading",
): boolean {
  return evidenceRefs.some((evidenceRef) => {
    const normalized = evidenceRef.toLowerCase();
    return (
      normalized.startsWith(`context-${kind}-ref:`) ||
      normalized.startsWith(`context_${kind}_ref:`) ||
      normalized.startsWith(`context-${kind}:`) ||
      normalized.startsWith(`context_${kind}:`)
    );
  });
}

function sortReuseRefs(refs: CodexContextReuseRef[]): CodexContextReuseRef[] {
  return [...refs].sort((left, right) => left.ref_id.localeCompare(right.ref_id));
}

function uniqueSortedStrings(values: readonly string[]): string[] {
  return Array.from(
    new Set(
      values
        .map((value) => value.trim())
        .filter((value) => value.length > 0),
    ),
  ).sort();
}
