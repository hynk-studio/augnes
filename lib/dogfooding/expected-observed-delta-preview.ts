import {
  containsCandidateIngressUnsafeMarkerV01,
  isCandidateIngressPublicSafeRefV01,
  normalizeCandidateIngressCandidateV01,
  sanitizeCandidateIngressSummaryV01,
  uniqueCandidateIngressStringsV01,
} from "@/lib/intake/candidate-ingress-normalizer";
import {
  CODEX_RESULT_REPORT_INTAKE_PREVIEW_VERSION,
  type CodexResultReportIntakePreview,
} from "@/types/codex-result-report-intake-preview";
import {
  CODEX_RESULT_REPORT_INTAKE_RECORD_REVIEW_VERSION,
  type CodexResultReportIntakeRecordReview,
} from "@/types/codex-result-report-intake-record-review";
import type { CandidateIngressNormalizedCandidate } from "@/types/candidate-ingress-normalizer";
import {
  EXPECTED_OBSERVED_DELTA_PREVIEW_VERSION,
  type ExpectedObservedDeltaCandidateBuckets,
  type ExpectedObservedDeltaExpectedMaterial,
  type ExpectedObservedDeltaPreview,
  type ExpectedObservedDeltaPreviewAuthorityBoundary,
  type ExpectedObservedDeltaPreviewInput,
  type ExpectedObservedDeltaPreviewRecommendedNextAction,
  type ExpectedObservedDeltaPreviewStatus,
} from "@/types/expected-observed-delta-preview";
import {
  WORK_EPISODE_RESIDUE_CANDIDATE_PREVIEW_VERSION,
  type WorkEpisodeResidueCandidatePreview,
} from "@/types/work-episode-residue-candidate-preview";

const DEFAULT_SCOPE = "project:augnes" as const;
const FALLBACK_AS_OF = "1970-01-01T00:00:00.000Z" as const;
const DEFAULT_SOURCE_REF = "expected-observed-delta-preview:v0.1" as const;
const DEFAULT_OPERATOR_REF = "operator:expected-observed-delta-review" as const;

type CandidateBucketName = keyof ExpectedObservedDeltaCandidateBuckets;

interface SignalContext {
  source_ref: string;
  operator_ref: string;
  work_ref?: string;
  result_ref?: string;
  handoff_ref?: string;
  evidence_refs: string[];
  source_refs: string[];
}

interface SignalCollections {
  expected: {
    files: string[];
    checks: string[];
    requirements: string[];
    nonGoals: string[];
    risks: string[];
    followups: string[];
    signalRefs: string[];
    explicit: boolean;
    derivedCount: number;
  };
  observed: {
    changedFiles: string[];
    passedChecks: string[];
    skippedChecks: string[];
    notDone: string[];
    requirements: string[];
    risks: string[];
    followups: string[];
    contextReuse: string[];
    signalRefs: string[];
  };
  reviewOnly: CandidateIngressNormalizedCandidate[];
  sourceRefs: string[];
  evidenceRefs: string[];
  blockedReasons: string[];
}

export function buildExpectedObservedDeltaPreviewV01({
  work_episode_residue_candidate_preview,
  codex_result_report_intake_record_review,
  codex_result_report_intake_preview,
  expected_material,
  scope,
  as_of,
  source_refs,
}: ExpectedObservedDeltaPreviewInput = {}): ExpectedObservedDeltaPreview {
  const residuePreview = isWorkEpisodeResidueCandidatePreview(
    work_episode_residue_candidate_preview,
  )
    ? work_episode_residue_candidate_preview
    : null;
  const recordReview = isCodexResultReportIntakeRecordReview(
    codex_result_report_intake_record_review,
  )
    ? codex_result_report_intake_record_review
    : null;
  const intakePreview = isCodexResultReportIntakePreview(
    codex_result_report_intake_preview,
  )
    ? codex_result_report_intake_preview
    : null;
  const parsedExpected = parseExpectedMaterial(expected_material);
  const collections = collectSignals({
    residuePreview,
    recordReview,
    intakePreview,
    expectedMaterial: parsedExpected.material,
    inputSourceRefs: source_refs ?? [],
  });
  const sourceRefs = uniqueCandidateIngressStringsV01([
    EXPECTED_OBSERVED_DELTA_PREVIEW_VERSION,
    ...(source_refs ?? []),
    ...collections.sourceRefs,
  ]).filter(isCandidateIngressPublicSafeRefV01);
  const evidenceRefs = uniqueCandidateIngressStringsV01(collections.evidenceRefs).filter(
    isCandidateIngressPublicSafeRefV01,
  );
  const context = buildSignalContext({
    residuePreview,
    recordReview,
    expectedMaterial: parsedExpected.material,
    sourceRefs,
    evidenceRefs,
  });
  const deltaCandidates = buildDeltaCandidates(collections, context);
  const deltaCandidateCount = countDeltaCandidates(deltaCandidates);
  const hasResultMaterial = hasCodexResultMaterial({
    residuePreview,
    recordReview,
    intakePreview,
  });
  const expectedSignalCount =
    collections.expected.files.length +
    collections.expected.checks.length +
    collections.expected.requirements.length +
    collections.expected.nonGoals.length +
    collections.expected.risks.length +
    collections.expected.followups.length +
    collections.expected.signalRefs.length;
  const observedSignalCount =
    collections.observed.changedFiles.length +
    collections.observed.passedChecks.length +
    collections.observed.skippedChecks.length +
    collections.observed.notDone.length +
    collections.observed.requirements.length +
    collections.observed.risks.length +
    collections.observed.followups.length +
    collections.observed.contextReuse.length;
  const blockedReasons = uniqueCandidateIngressStringsV01([
    ...collections.blockedReasons,
    ...parsedExpected.blockedReasons,
  ]);
  const insufficientDataReasons = uniqueCandidateIngressStringsV01([
    ...(!hasResultMaterial ? ["codex_result_material_missing"] : []),
    ...(expectedSignalCount === 0 ? ["expected_material_missing"] : []),
    ...(observedSignalCount === 0 ? ["observed_material_missing"] : []),
    ...(deltaCandidateCount === 0 ? ["expected_observed_delta_candidates_missing"] : []),
    ...(deltaCandidateCount > 0 && evidenceRefs.length === 0
      ? ["evidence_refs_missing_for_expected_observed_delta_review"]
      : []),
  ]);
  const status = determineStatus({
    hasResultMaterial,
    expectedSignalCount,
    observedSignalCount,
    deltaCandidateCount,
    blockedReasons,
    insufficientDataReasons,
  });

  return {
    preview_version: EXPECTED_OBSERVED_DELTA_PREVIEW_VERSION,
    scope:
      scope ??
      residuePreview?.scope ??
      recordReview?.scope ??
      intakePreview?.scope ??
      DEFAULT_SCOPE,
    as_of:
      as_of ??
      residuePreview?.as_of ??
      recordReview?.as_of ??
      intakePreview?.as_of ??
      FALLBACK_AS_OF,
    source_refs: sourceRefs,
    delta_preview_status: status,
    recommended_next_action: determineNextAction(status),
    input_summary: {
      has_work_episode_residue_candidate_preview: Boolean(residuePreview),
      has_codex_result_report_intake_record_review: Boolean(recordReview),
      has_codex_result_report_intake_preview: Boolean(intakePreview),
      has_explicit_expected_material: collections.expected.explicit,
      expected_signal_count: expectedSignalCount,
      observed_signal_count: observedSignalCount,
      delta_candidate_count: deltaCandidateCount,
      blocked_reason_count: blockedReasons.length,
      insufficient_data_reason_count: insufficientDataReasons.length,
    },
    expected_summary: {
      expected_file_refs: collections.expected.files,
      expected_check_refs: collections.expected.checks,
      expected_requirement_progress: collections.expected.requirements,
      expected_non_goals: collections.expected.nonGoals,
      expected_risks: collections.expected.risks,
      expected_followups: collections.expected.followups,
      expected_signal_refs: collections.expected.signalRefs,
      has_explicit_expected_material: collections.expected.explicit,
      derived_expected_signal_count: collections.expected.derivedCount,
    },
    observed_summary: {
      changed_files: collections.observed.changedFiles,
      passed_or_completed_checks: collections.observed.passedChecks,
      skipped_or_unverified_checks: collections.observed.skippedChecks,
      not_done_items: collections.observed.notDone,
      requirement_progress: collections.observed.requirements,
      risks: collections.observed.risks,
      followups: collections.observed.followups,
      context_reuse_signals: collections.observed.contextReuse,
      observed_signal_refs: collections.observed.signalRefs,
      has_observed_material: observedSignalCount > 0,
    },
    delta_candidates: deltaCandidates,
    mismatch_summary: {
      matched_expectation_count:
        deltaCandidates.matched_expectation_candidates.length,
      missing_expectation_count:
        deltaCandidates.missing_expectation_candidates.length,
      unexpected_observation_count:
        deltaCandidates.unexpected_observation_candidates.length,
      skipped_or_unverified_check_count:
        deltaCandidates.skipped_or_unverified_check_candidates.length,
      not_done_count: deltaCandidates.not_done_candidates.length,
      changed_file_delta_count:
        deltaCandidates.changed_file_delta_candidates.length,
      requirement_progress_delta_count:
        deltaCandidates.requirement_progress_delta_candidates.length,
      non_goal_risk_count: deltaCandidates.non_goal_risk_candidates.length,
      followup_delta_count: deltaCandidates.followup_delta_candidates.length,
      context_reuse_signal_count:
        deltaCandidates.context_reuse_signal_candidates.length,
      summary: buildMismatchSummaryText(deltaCandidates),
    },
    requirement_progress_comparison: {
      expected_requirement_progress: collections.expected.requirements,
      observed_requirement_progress: collections.observed.requirements,
      requirement_progress_delta_candidates:
        deltaCandidates.requirement_progress_delta_candidates,
      changed_files_are_not_requirement_completion: true,
    },
    verification_comparison: {
      expected_checks: collections.expected.checks,
      passed_or_completed_checks: collections.observed.passedChecks,
      skipped_or_unverified_checks: collections.observed.skippedChecks,
      skipped_checks_count_as_passed: false,
    },
    non_goal_comparison: {
      expected_non_goals: collections.expected.nonGoals,
      observed_risks: collections.observed.risks,
      non_goal_risk_candidates: deltaCandidates.non_goal_risk_candidates,
    },
    evidence_summary: {
      has_result_material: hasResultMaterial,
      has_expected_material: expectedSignalCount > 0,
      has_observed_material: observedSignalCount > 0,
      has_source_refs: sourceRefs.length > 0,
      has_evidence_refs: evidenceRefs.length > 0,
      source_refs: sourceRefs,
      evidence_refs: evidenceRefs,
      missing_evidence:
        deltaCandidateCount > 0 && evidenceRefs.length === 0
          ? ["evidence_refs_missing_for_expected_observed_delta_review"]
          : [],
    },
    blocked_reasons: blockedReasons,
    insufficient_data_reasons: insufficientDataReasons,
    operator_review_checklist: [
      "review_expected_material_before_delta_recording",
      "review_observed_changed_files_checks_skipped_checks_not_done_items_and_requirement_progress",
      "confirm_skipped_checks_are_not_counted_as_passed_checks",
      "confirm_not_done_items_are_not_counted_as_completed_work",
      "confirm_changed_files_or_pr_presence_are_not_requirement_completion",
      "confirm_expected_observed_delta_is_learning_signal_not_validation_approval",
    ],
    would_not_write: [
      "does_not_write_expected_observed_delta",
      "does_not_write_reuse_outcome_ledger",
      "does_not_write_dogfood_metrics",
      "does_not_write_work_episode",
      "does_not_write_memory",
      "does_not_write_perspective_unit",
      "does_not_write_next_work_bias",
      "does_not_update_current_working_perspective",
      "does_not_update_continuity_relay",
      "does_not_mutate_handoff_context",
      "does_not_send_handoff",
      "does_not_call_provider_openai_github_or_codex",
      "does_not_create_graph_vector_rag_crawler_or_browser_observer",
    ],
    non_goals: [
      "validation_approval_or_source_of_truth",
      "reuse_outcome_ledger_write",
      "dogfood_metric_write",
      "work_episode_durable_write",
      "memory_write",
      "perspective_or_cwp_mutation",
      "handoff_context_apply_or_send",
      "provider_github_codex_call",
    ],
    authority_boundary: createExpectedObservedDeltaPreviewAuthorityBoundaryV01(),
  };
}

export function createExpectedObservedDeltaPreviewAuthorityBoundaryV01(): ExpectedObservedDeltaPreviewAuthorityBoundary {
  return {
    read_only: true,
    candidate_material_only: true,
    source_of_truth: false,
    derived_read_model: true,
    can_write_expected_observed_delta: false,
    can_write_reuse_outcome_ledger: false,
    can_write_dogfood_metrics: false,
    can_write_work_episode: false,
    can_write_memory: false,
    can_write_perspective_unit: false,
    can_write_next_work_bias: false,
    can_update_current_working_perspective: false,
    can_update_continuity_relay: false,
    can_mutate_handoff_context: false,
    can_send_handoff: false,
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
      "ExpectedObservedDelta preview is read-only candidate material.",
      "It compares expected and observed signals for later operator review without treating changed files, PR presence, skipped checks, or not-done items as completion.",
    ],
  };
}

function collectSignals({
  residuePreview,
  recordReview,
  intakePreview,
  expectedMaterial,
  inputSourceRefs,
}: {
  residuePreview: WorkEpisodeResidueCandidatePreview | null;
  recordReview: CodexResultReportIntakeRecordReview | null;
  intakePreview: CodexResultReportIntakePreview | null;
  expectedMaterial: ExpectedObservedDeltaExpectedMaterial | null;
  inputSourceRefs: string[];
}): SignalCollections {
  const expected = {
    files: uniqueSafeSummaries(expectedMaterial?.expected_files ?? []),
    checks: uniqueSafeSummaries(expectedMaterial?.expected_checks ?? []),
    requirements: uniqueSafeSummaries(
      expectedMaterial?.expected_requirement_progress ?? [],
    ),
    nonGoals: uniqueSafeSummaries(expectedMaterial?.expected_non_goals ?? []),
    risks: uniqueSafeSummaries(expectedMaterial?.expected_risks ?? []),
    followups: uniqueSafeSummaries(expectedMaterial?.expected_followups ?? []),
    signalRefs: [] as string[],
    explicit: Boolean(expectedMaterial),
    derivedCount: 0,
  };
  const observed = {
    changedFiles: [] as string[],
    passedChecks: [] as string[],
    skippedChecks: [] as string[],
    notDone: [] as string[],
    requirements: [] as string[],
    risks: [] as string[],
    followups: [] as string[],
    contextReuse: [] as string[],
    signalRefs: [] as string[],
  };
  const reviewOnly = [
    ...(residuePreview?.candidate_residue.review_only_candidates ?? []),
  ];
  const allCandidates = [
    ...(residuePreview
      ? Object.values(residuePreview.candidate_residue).flat()
      : []),
    ...(intakePreview
      ? Object.values(intakePreview.candidate_material).flat()
      : []),
  ];

  for (const candidate of allCandidates) {
    const summary = candidate.summary;
    if (!summary) continue;
    if (candidate.candidate_kind === "changed_artifact_ref") {
      observed.changedFiles.push(summary);
    } else if (candidate.candidate_kind === "requirement") {
      if (looksExpected(summary)) {
        expected.requirements.push(summary);
        expected.derivedCount += 1;
      } else {
        observed.requirements.push(summary);
      }
    } else if (candidate.candidate_kind === "expected_observed_signal") {
      if (looksSkippedOrUnverified(summary)) {
        observed.skippedChecks.push(summary);
      } else if (looksExpected(summary)) {
        expected.signalRefs.push(summary);
        expected.derivedCount += 1;
      } else {
        observed.passedChecks.push(summary);
      }
    } else if (candidate.candidate_kind === "risk_or_blocker") {
      observed.risks.push(summary);
    } else if (candidate.candidate_kind === "next_action") {
      if (looksNotDone(summary)) observed.notDone.push(summary);
      else observed.followups.push(summary);
    } else if (candidate.candidate_kind === "reusable_context") {
      observed.contextReuse.push(summary);
    } else if (candidate.candidate_kind === "review_only") {
      reviewOnly.push(candidate);
    }
    observed.signalRefs.push(candidate.candidate_id);
  }

  for (const record of recordReview?.records ?? []) {
    observed.changedFiles.push(...record.changed_files_summary);
    for (const check of record.checks_summary) {
      if (looksSkippedOrUnverified(check)) observed.skippedChecks.push(check);
      else observed.passedChecks.push(check);
    }
    observed.skippedChecks.push(...record.skipped_checks_summary);
    observed.notDone.push(...record.not_done_summary);
    observed.requirements.push(...record.requirement_progress_summary);
    observed.risks.push(...record.risk_or_regression_summary);
    observed.followups.push(...record.followup_summary);
    observed.contextReuse.push(...record.context_reuse_signal_summary);
    for (const signal of record.expected_observed_signal_summary) {
      if (looksExpected(signal)) {
        expected.signalRefs.push(signal);
        expected.derivedCount += 1;
      }
    }
  }

  return {
    expected: {
      ...expected,
      files: uniqueSafeSummaries(expected.files),
      checks: uniqueSafeSummaries(expected.checks),
      requirements: uniqueSafeSummaries(expected.requirements),
      nonGoals: uniqueSafeSummaries(expected.nonGoals),
      risks: uniqueSafeSummaries(expected.risks),
      followups: uniqueSafeSummaries(expected.followups),
      signalRefs: uniqueSafeSummaries(expected.signalRefs),
    },
    observed: {
      changedFiles: uniqueSafeSummaries(observed.changedFiles),
      passedChecks: uniqueSafeSummaries(observed.passedChecks).filter(
        (item) => !looksSkippedOrUnverified(item),
      ),
      skippedChecks: uniqueSafeSummaries(observed.skippedChecks),
      notDone: uniqueSafeSummaries(observed.notDone),
      requirements: uniqueSafeSummaries(observed.requirements),
      risks: uniqueSafeSummaries(observed.risks),
      followups: uniqueSafeSummaries(observed.followups),
      contextReuse: uniqueSafeSummaries(observed.contextReuse),
      signalRefs: uniqueSafeSummaries(observed.signalRefs),
    },
    reviewOnly,
    sourceRefs: uniqueCandidateIngressStringsV01([
      ...inputSourceRefs,
      ...(residuePreview?.source_refs ?? []),
      ...(recordReview?.source_refs ?? []),
      ...(intakePreview?.source_refs ?? []),
      ...(expectedMaterial?.source_refs ?? []),
      ...allCandidates.flatMap((candidate) => candidate.source_refs),
    ]),
    evidenceRefs: uniqueCandidateIngressStringsV01([
      ...(residuePreview?.evidence_summary.evidence_refs ?? []),
      ...(recordReview?.evidence_summary.evidence_refs ?? []),
      ...(intakePreview?.evidence_summary.evidence_refs ?? []),
      ...(expectedMaterial?.evidence_refs ?? []),
      ...allCandidates.flatMap((candidate) => candidate.evidence_refs),
    ]),
    blockedReasons: uniqueCandidateIngressStringsV01([
      ...(residuePreview?.blocked_reasons ?? []),
      ...(recordReview?.blocked_reasons ?? []),
      ...(intakePreview?.blocked_reasons ?? []),
    ]),
  };
}

function buildDeltaCandidates(
  collections: SignalCollections,
  context: SignalContext,
): ExpectedObservedDeltaCandidateBuckets {
  const buckets = emptyBuckets();
  const expectedItems = uniqueSafeSummaries([
    ...collections.expected.files,
    ...collections.expected.checks,
    ...collections.expected.requirements,
    ...collections.expected.signalRefs,
  ]);
  const observedItems = uniqueSafeSummaries([
    ...collections.observed.changedFiles,
    ...collections.observed.passedChecks,
    ...collections.observed.requirements,
    ...collections.observed.contextReuse,
  ]);

  for (const expected of expectedItems) {
    const matched = observedItems.find((observed) => looseMatch(expected, observed));
    pushCandidate(
      matched
        ? buckets.matched_expectation_candidates
        : buckets.missing_expectation_candidates,
      context,
      matched ? "expected_observed_signal" : "risk_or_blocker",
      matched ? "Matched expectation" : "Missing expectation",
      matched
        ? `Expected signal has observed counterpart: ${expected}`
        : `Expected signal has no observed counterpart yet: ${expected}`,
      `expected:${expected}:${matched ?? "missing"}`,
    );
  }

  for (const observed of observedItems) {
    if (!expectedItems.some((expected) => looseMatch(expected, observed))) {
      pushCandidate(
        buckets.unexpected_observation_candidates,
        context,
        "expected_observed_signal",
        "Unexpected observation",
        `Observed signal has no expected counterpart yet: ${observed}`,
        `unexpected:${observed}`,
      );
    }
  }

  for (const skipped of collections.observed.skippedChecks) {
    pushCandidate(
      buckets.skipped_or_unverified_check_candidates,
      context,
      "risk_or_blocker",
      "Skipped or unverified check",
      `Skipped or unverified check is not counted as passed: ${skipped}`,
      `skipped:${skipped}`,
    );
  }

  for (const notDone of collections.observed.notDone) {
    pushCandidate(
      buckets.not_done_candidates,
      context,
      "next_action",
      "Not done item",
      `Not-done item is not counted as completed work: ${notDone}`,
      `not-done:${notDone}`,
    );
  }

  for (const changedFile of collections.observed.changedFiles) {
    pushCandidate(
      buckets.changed_file_delta_candidates,
      context,
      "changed_artifact_ref",
      "Changed file delta",
      `Changed file is observed artifact, not requirement completion by itself: ${changedFile}`,
      `changed-file:${changedFile}`,
    );
  }

  for (const requirement of uniqueSafeSummaries([
    ...collections.expected.requirements,
    ...collections.observed.requirements,
  ])) {
    pushCandidate(
      buckets.requirement_progress_delta_candidates,
      context,
      "requirement",
      "Requirement progress delta",
      `Requirement progress requires operator review beyond PR or file presence: ${requirement}`,
      `requirement:${requirement}`,
    );
  }

  for (const risk of uniqueSafeSummaries([
    ...collections.expected.nonGoals,
    ...collections.expected.risks,
    ...collections.observed.risks,
  ])) {
    pushCandidate(
      buckets.non_goal_risk_candidates,
      context,
      "risk_or_blocker",
      "Non-goal or risk signal",
      `Non-goal or risk signal to review: ${risk}`,
      `risk:${risk}`,
    );
  }

  for (const followup of uniqueSafeSummaries([
    ...collections.expected.followups,
    ...collections.observed.followups,
  ])) {
    pushCandidate(
      buckets.followup_delta_candidates,
      context,
      "next_action",
      "Followup delta",
      `Followup signal to review: ${followup}`,
      `followup:${followup}`,
    );
  }

  for (const reuse of collections.observed.contextReuse) {
    pushCandidate(
      buckets.context_reuse_signal_candidates,
      context,
      "reusable_context",
      "Context reuse signal",
      `Context reuse learning signal: ${reuse}`,
      `context-reuse:${reuse}`,
    );
  }

  buckets.review_only_candidates.push(...collections.reviewOnly);
  return buckets;
}

function parseExpectedMaterial(value: unknown): {
  material: ExpectedObservedDeltaExpectedMaterial | null;
  blockedReasons: string[];
} {
  if (value === undefined || value === null) {
    return { material: null, blockedReasons: [] };
  }
  if (!isRecord(value)) {
    return {
      material: null,
      blockedReasons: ["expected_material_must_be_object"],
    };
  }
  const allowedKeys = new Set([
    "expected_files",
    "expected_checks",
    "expected_requirement_progress",
    "expected_non_goals",
    "expected_risks",
    "expected_followups",
    "handoff_ref",
    "work_ref",
    "result_ref",
    "source_refs",
    "evidence_refs",
  ]);
  const blockedReasons: string[] = [];
  for (const key of Object.keys(value)) {
    if (!allowedKeys.has(key)) blockedReasons.push("expected_material_key_not_allowed");
  }
  if (containsCandidateIngressUnsafeMarkerV01(JSON.stringify(value))) {
    blockedReasons.push("expected_material_unsafe_marker_detected");
  }
  const material: ExpectedObservedDeltaExpectedMaterial = {
    expected_files: parseSafeStringArray(value.expected_files, blockedReasons, "expected_files"),
    expected_checks: parseSafeStringArray(value.expected_checks, blockedReasons, "expected_checks"),
    expected_requirement_progress: parseSafeStringArray(value.expected_requirement_progress, blockedReasons, "expected_requirement_progress"),
    expected_non_goals: parseSafeStringArray(value.expected_non_goals, blockedReasons, "expected_non_goals"),
    expected_risks: parseSafeStringArray(value.expected_risks, blockedReasons, "expected_risks"),
    expected_followups: parseSafeStringArray(value.expected_followups, blockedReasons, "expected_followups"),
    handoff_ref: optionalSafeRef(value.handoff_ref, blockedReasons, "handoff_ref"),
    work_ref: optionalSafeRef(value.work_ref, blockedReasons, "work_ref"),
    result_ref: optionalSafeRef(value.result_ref, blockedReasons, "result_ref"),
    source_refs: parseSafeRefArray(value.source_refs, blockedReasons, "source_refs"),
    evidence_refs: parseSafeRefArray(value.evidence_refs, blockedReasons, "evidence_refs"),
  };
  return {
    material: blockedReasons.length === 0 ? material : null,
    blockedReasons: uniqueCandidateIngressStringsV01(blockedReasons),
  };
}

function buildSignalContext({
  residuePreview,
  recordReview,
  expectedMaterial,
  sourceRefs,
  evidenceRefs,
}: {
  residuePreview: WorkEpisodeResidueCandidatePreview | null;
  recordReview: CodexResultReportIntakeRecordReview | null;
  expectedMaterial: ExpectedObservedDeltaExpectedMaterial | null;
  sourceRefs: string[];
  evidenceRefs: string[];
}): SignalContext {
  const firstRecord = recordReview?.records[0] ?? null;
  return {
    source_ref: sourceRefs[0] ?? DEFAULT_SOURCE_REF,
    operator_ref: firstRecord?.operator_ref ?? DEFAULT_OPERATOR_REF,
    work_ref: firstRecord?.work_ref ?? expectedMaterial?.work_ref ?? undefined,
    result_ref:
      firstRecord?.result_ref ?? expectedMaterial?.result_ref ?? undefined,
    handoff_ref: expectedMaterial?.handoff_ref ?? undefined,
    evidence_refs: evidenceRefs,
    source_refs: uniqueCandidateIngressStringsV01([
      ...(sourceRefs.length > 0 ? sourceRefs : [DEFAULT_SOURCE_REF]),
      residuePreview?.preview_version ?? "",
      recordReview?.review_version ?? "",
    ]).filter(isCandidateIngressPublicSafeRefV01),
  };
}

function pushCandidate(
  bucket: CandidateIngressNormalizedCandidate[],
  context: SignalContext,
  candidateKind: CandidateIngressNormalizedCandidate["candidate_kind"],
  label: string,
  summary: string,
  seed: string,
) {
  const candidate = normalizeCandidateIngressCandidateV01({
    candidate_kind: candidateKind,
    source_kind: "codex_result_report",
    label,
    summary,
    source_ref: context.source_ref,
    operator_ref: context.operator_ref,
    work_ref: context.work_ref,
    result_ref: context.result_ref,
    evidence_refs: context.evidence_refs,
    source_refs: context.source_refs,
    confidence: "inferred_heuristic",
    generated_view: true,
    seed,
  });
  if (candidate) bucket.push(candidate);
}

function emptyBuckets(): ExpectedObservedDeltaCandidateBuckets {
  return {
    matched_expectation_candidates: [],
    missing_expectation_candidates: [],
    unexpected_observation_candidates: [],
    skipped_or_unverified_check_candidates: [],
    not_done_candidates: [],
    changed_file_delta_candidates: [],
    requirement_progress_delta_candidates: [],
    non_goal_risk_candidates: [],
    followup_delta_candidates: [],
    context_reuse_signal_candidates: [],
    review_only_candidates: [],
  };
}

function countDeltaCandidates(buckets: ExpectedObservedDeltaCandidateBuckets): number {
  return Object.values(buckets).reduce((sum, bucket) => sum + bucket.length, 0);
}

function determineStatus({
  hasResultMaterial,
  expectedSignalCount,
  observedSignalCount,
  deltaCandidateCount,
  blockedReasons,
  insufficientDataReasons,
}: {
  hasResultMaterial: boolean;
  expectedSignalCount: number;
  observedSignalCount: number;
  deltaCandidateCount: number;
  blockedReasons: string[];
  insufficientDataReasons: string[];
}): ExpectedObservedDeltaPreviewStatus {
  if (!hasResultMaterial) return "no_result_material";
  if (blockedReasons.length > 0) return "keep_preview_only";
  if (expectedSignalCount === 0 && observedSignalCount === 0) return "insufficient_data";
  if (expectedSignalCount === 0) return "insufficient_expected_material";
  if (observedSignalCount === 0) return "insufficient_observed_material";
  if (deltaCandidateCount > 0 && insufficientDataReasons.length === 0) {
    return "ready_for_operator_review";
  }
  if (deltaCandidateCount > 0) return "delta_candidates_available";
  return "insufficient_data";
}

function determineNextAction(
  status: ExpectedObservedDeltaPreviewStatus,
): ExpectedObservedDeltaPreviewRecommendedNextAction {
  if (status === "no_result_material") return "supply_codex_result_report";
  if (status === "insufficient_expected_material") return "supply_expected_material";
  if (status === "ready_for_operator_review") {
    return "prepare_expected_observed_delta_decision";
  }
  if (status === "delta_candidates_available") {
    return "review_expected_observed_delta_candidates";
  }
  if (status === "keep_preview_only") return "keep_preview_only";
  return "review_expected_observed_delta_candidates";
}

function hasCodexResultMaterial({
  residuePreview,
  recordReview,
  intakePreview,
}: {
  residuePreview: WorkEpisodeResidueCandidatePreview | null;
  recordReview: CodexResultReportIntakeRecordReview | null;
  intakePreview: CodexResultReportIntakePreview | null;
}): boolean {
  return (
    (residuePreview?.input_summary.residue_candidate_count ?? 0) > 0 ||
    (recordReview?.input_summary.valid_record_count ?? 0) > 0 ||
    (intakePreview?.input_summary.candidate_count ?? 0) > 0
  );
}

function buildMismatchSummaryText(
  buckets: ExpectedObservedDeltaCandidateBuckets,
): string {
  return [
    `matched ${buckets.matched_expectation_candidates.length}`,
    `missing ${buckets.missing_expectation_candidates.length}`,
    `unexpected ${buckets.unexpected_observation_candidates.length}`,
    `skipped_or_unverified ${buckets.skipped_or_unverified_check_candidates.length}`,
    `not_done ${buckets.not_done_candidates.length}`,
  ].join("; ");
}

function uniqueSafeSummaries(values: unknown[]): string[] {
  return uniqueCandidateIngressStringsV01(
    values.map((value) => sanitizeCandidateIngressSummaryV01(value)),
  );
}

function parseSafeStringArray(
  value: unknown,
  reasons: string[],
  field: string,
): string[] {
  if (value === undefined) return [];
  if (!Array.isArray(value)) {
    reasons.push(`${field}_must_be_array`);
    return [];
  }
  if (value.length > 50) reasons.push(`${field}_too_large`);
  const parsed = uniqueSafeSummaries(value).slice(0, 50);
  if (parsed.length !== value.length) reasons.push(`${field}_contains_unsafe_or_empty_items`);
  return parsed;
}

function parseSafeRefArray(
  value: unknown,
  reasons: string[],
  field: string,
): string[] {
  if (value === undefined) return [];
  if (!Array.isArray(value)) {
    reasons.push(`${field}_must_be_array`);
    return [];
  }
  if (value.length > 50) reasons.push(`${field}_too_large`);
  const parsed = uniqueCandidateIngressStringsV01(value).filter(
    isCandidateIngressPublicSafeRefV01,
  );
  if (parsed.length !== value.length) reasons.push(`${field}_contains_unsafe_refs`);
  return parsed.slice(0, 50);
}

function optionalSafeRef(
  value: unknown,
  reasons: string[],
  field: string,
): string | null {
  if (value === undefined || value === null || value === "") return null;
  if (!isCandidateIngressPublicSafeRefV01(value)) {
    reasons.push(`${field}_unsafe`);
    return null;
  }
  return value;
}

function looseMatch(left: string, right: string): boolean {
  const a = normalizeForMatch(left);
  const b = normalizeForMatch(right);
  return Boolean(a && b && (a.includes(b) || b.includes(a)));
}

function normalizeForMatch(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function looksExpected(value: string): boolean {
  return /\b(expect|expected|requirement|planned|handoff|goal|should)\b/i.test(value);
}

function looksSkippedOrUnverified(value: string): boolean {
  return /\b(skip|skipped|not run|not-run|unverified|not verified|not_verified|missing check|did not run)\b/i.test(value);
}

function looksNotDone(value: string): boolean {
  return /\b(not done|not_done|todo|follow ?up|remaining|defer|blocked|incomplete)\b/i.test(value);
}

function isWorkEpisodeResidueCandidatePreview(
  value: unknown,
): value is WorkEpisodeResidueCandidatePreview {
  return (
    isRecord(value) &&
    value.preview_version === WORK_EPISODE_RESIDUE_CANDIDATE_PREVIEW_VERSION &&
    isRecord(value.candidate_residue) &&
    isRecord(value.input_summary)
  );
}

function isCodexResultReportIntakeRecordReview(
  value: unknown,
): value is CodexResultReportIntakeRecordReview {
  return (
    isRecord(value) &&
    value.review_version === CODEX_RESULT_REPORT_INTAKE_RECORD_REVIEW_VERSION &&
    Array.isArray(value.records) &&
    isRecord(value.input_summary)
  );
}

function isCodexResultReportIntakePreview(
  value: unknown,
): value is CodexResultReportIntakePreview {
  return (
    isRecord(value) &&
    value.preview_version === CODEX_RESULT_REPORT_INTAKE_PREVIEW_VERSION &&
    isRecord(value.candidate_material) &&
    isRecord(value.input_summary)
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}
