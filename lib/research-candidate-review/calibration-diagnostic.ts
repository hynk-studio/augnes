import { createHash } from "node:crypto";

import type {
  ResearchCandidateCalibrationAuthorityBoundary,
  ResearchCandidateCalibrationCandidateFamily,
  ResearchCandidateCalibrationCandidateReviewInput,
  ResearchCandidateCalibrationDiagnostic,
  ResearchCandidateCalibrationDiagnosticBuilderInput,
  ResearchCandidateCalibrationDiagnosticReport,
  ResearchCandidateCalibrationFeedbackEvent,
  ResearchCandidateCalibrationReadinessLabel,
  ResearchCandidateCalibrationReasonCode,
  ResearchCandidateCalibrationRiskFlag,
  ResearchCandidateCalibrationValidationResult,
} from "../../types/research-candidate-calibration-diagnostic";

type CandidateCollectionKey = keyof ResearchCandidateCalibrationCandidateReviewInput;

type CandidateFamilyConfig = {
  family: ResearchCandidateCalibrationCandidateFamily;
  collectionKey: CandidateCollectionKey;
  idField: string;
};

type CandidateRecord = {
  family: ResearchCandidateCalibrationCandidateFamily;
  id: string;
  object: Record<string, unknown>;
};

type LifecycleSummaryRecord = {
  candidateId: string;
  candidateFamily: ResearchCandidateCalibrationCandidateFamily;
  object: Record<string, unknown>;
};

const diagnosticVersion = "research_candidate_calibration_diagnostic.v0.1" as const;
const diagnosticStatus = "diagnostic_only" as const;

const familyConfigs: CandidateFamilyConfig[] = [
  {
    family: "claim",
    collectionKey: "claim_candidates",
    idField: "claim_candidate_id",
  },
  {
    family: "evidence",
    collectionKey: "evidence_candidates",
    idField: "evidence_candidate_id",
  },
  {
    family: "tension",
    collectionKey: "tension_candidates",
    idField: "tension_candidate_id",
  },
  {
    family: "knowledge_gap",
    collectionKey: "knowledge_gap_candidates",
    idField: "knowledge_gap_candidate_id",
  },
  {
    family: "perspective_delta",
    collectionKey: "perspective_delta_candidates",
    idField: "perspective_delta_candidate_id",
  },
  {
    family: "follow_up_work",
    collectionKey: "follow_up_work_candidates",
    idField: "follow_up_work_candidate_id",
  },
];

const familyValues: ResearchCandidateCalibrationCandidateFamily[] = [
  "claim",
  "evidence",
  "tension",
  "knowledge_gap",
  "perspective_delta",
  "follow_up_work",
];

const readinessValues: ResearchCandidateCalibrationReadinessLabel[] = [
  "not_ready",
  "weak_ready",
  "ready_with_tensions",
  "ready",
  "blocked",
];

const reasonCodeValues: ResearchCandidateCalibrationReasonCode[] = [
  "source_ref_missing",
  "source_ref_present",
  "source_coverage_boundary_present",
  "evidence_missing",
  "evidence_present",
  "contradiction_present",
  "unresolved_tension_present",
  "knowledge_gap_present",
  "locator_missing",
  "locator_present",
  "lifecycle_blocked",
  "lifecycle_invalidated",
  "lifecycle_operator_corrected",
  "lifecycle_operator_pinned",
  "lifecycle_operator_dismissed",
  "operator_invalidation_present",
  "operator_correction_present",
  "operator_pin_present",
  "operator_dismissal_present",
  "readiness_overclaim_risk",
  "ready_with_unresolved_tensions",
  "diagnostic_only_not_promotion",
];

const riskFlagValues: ResearchCandidateCalibrationRiskFlag[] = [
  "stale_context",
  "overclaim_risk",
  "missing_source_ref",
  "missing_evidence",
  "missing_locator",
  "operator_invalidated",
  "contradiction_or_tension",
  "knowledge_gap_open",
];

const forbiddenAuthorityFields = [
  "empirical_calibration_model",
  "confidence_is_truth",
  "readiness_is_promotion",
  "proof_or_evidence_record",
  "perspective_promotion",
  "durable_perspective_state",
  "work_mutation",
  "execution_authority",
  "codex_execution_authority",
  "github_automation_authority",
  "provider_openai_authority",
  "source_fetch_authority",
  "retrieval_rag_authority",
  "git_ledger_export_authority",
  "product_write_authority",
  "product_id_allocation_authority",
] as const;

export function getResearchCandidateCalibrationAuthorityBoundary(): ResearchCandidateCalibrationAuthorityBoundary {
  return {
    diagnostic_only: true,
    empirical_calibration_model: false,
    confidence_is_truth: false,
    readiness_is_promotion: false,
    proof_or_evidence_record: false,
    perspective_promotion: false,
    durable_perspective_state: false,
    work_mutation: false,
    execution_authority: false,
    codex_execution_authority: false,
    github_automation_authority: false,
    provider_openai_authority: false,
    source_fetch_authority: false,
    retrieval_rag_authority: false,
    git_ledger_export_authority: false,
    product_write_authority: false,
    product_id_allocation_authority: false,
  };
}

export function buildResearchCandidateCalibrationDiagnosticReport(
  input: ResearchCandidateCalibrationDiagnosticBuilderInput,
): ResearchCandidateCalibrationDiagnosticReport {
  const candidateRecords = collectCandidateRecords(input.candidate_review);
  const evidenceRecords = candidateRecords.filter(
    (candidate) => candidate.family === "evidence",
  );
  const tensionRecords = candidateRecords.filter(
    (candidate) => candidate.family === "tension",
  );
  const knowledgeGapRecords = candidateRecords.filter(
    (candidate) => candidate.family === "knowledge_gap",
  );
  const lifecycleSummaries = collectLifecycleSummaries(
    input.lifecycle_read_model?.candidate_summaries ?? [],
  );
  const feedbackEvents = sortFeedbackEvents(input.feedback_events ?? []);

  const diagnostics = candidateRecords
    .map((candidate) =>
      buildCandidateDiagnostic({
        input,
        candidate,
        candidateRecords,
        evidenceRecords,
        tensionRecords,
        knowledgeGapRecords,
        lifecycleSummaries,
        feedbackEvents,
      }),
    )
    .sort((left, right) =>
      left.candidate_family.localeCompare(right.candidate_family) ||
      left.candidate_id.localeCompare(right.candidate_id),
    );

  const readinessCounts = createReadinessCounts();
  const riskFlagCounts = createRiskFlagCounts();
  const diagnosticQueue = {
    blocked: [] as string[],
    overclaim_risk: [] as string[],
    missing_source: [] as string[],
    unresolved_tensions: [] as string[],
    ready_with_tensions: [] as string[],
  };

  for (const diagnostic of diagnostics) {
    readinessCounts[diagnostic.readiness_label] += 1;
    for (const flag of diagnostic.risk_flags) {
      riskFlagCounts[flag] += 1;
    }
    if (diagnostic.readiness_label === "blocked") {
      diagnosticQueue.blocked.push(diagnostic.candidate_id);
    }
    if (diagnostic.risk_flags.includes("overclaim_risk")) {
      diagnosticQueue.overclaim_risk.push(diagnostic.candidate_id);
    }
    if (diagnostic.risk_flags.includes("missing_source_ref")) {
      diagnosticQueue.missing_source.push(diagnostic.candidate_id);
    }
    if (diagnostic.unresolved_tension_count > 0) {
      diagnosticQueue.unresolved_tensions.push(diagnostic.candidate_id);
    }
    if (diagnostic.readiness_label === "ready_with_tensions") {
      diagnosticQueue.ready_with_tensions.push(diagnostic.candidate_id);
    }
  }

  diagnosticQueue.blocked.sort();
  diagnosticQueue.overclaim_risk.sort();
  diagnosticQueue.missing_source.sort();
  diagnosticQueue.unresolved_tensions.sort();
  diagnosticQueue.ready_with_tensions.sort();

  const report: ResearchCandidateCalibrationDiagnosticReport = {
    diagnostic_version: diagnosticVersion,
    scope: input.scope,
    status: diagnosticStatus,
    as_of: input.as_of,
    source_fixture_refs: uniqueSorted(input.source_fixture_refs),
    diagnostics,
    readiness_counts: readinessCounts,
    risk_flag_counts: riskFlagCounts,
    diagnostic_queue: diagnosticQueue,
    boundary_notes: [
      "Calibration Diagnostic is diagnostic-only.",
      "Feedback is operator signal, not truth.",
      "Confidence is not truth.",
      "Readiness is not promotion.",
      "Ready means ready for review, not ready to promote.",
      "diagnostic_summary is explanation, not authority.",
      "Product-write remains parked by #686.",
    ].sort(),
    diagnostic_fingerprint: "",
    authority_boundary: getResearchCandidateCalibrationAuthorityBoundary(),
  };

  return {
    ...report,
    diagnostic_fingerprint:
      createResearchCandidateCalibrationDiagnosticFingerprint(report),
  };
}

export function validateResearchCandidateCalibrationDiagnosticReport(
  report: ResearchCandidateCalibrationDiagnosticReport,
): ResearchCandidateCalibrationValidationResult {
  const failureCodes: string[] = [];
  if (report.diagnostic_version !== diagnosticVersion) {
    failureCodes.push("invalid_diagnostic_version");
  }
  if (report.status !== diagnosticStatus) {
    failureCodes.push("invalid_status");
  }
  if (!report.scope) {
    failureCodes.push("empty_scope");
  }
  if (!Array.isArray(report.diagnostics) || report.diagnostics.length === 0) {
    failureCodes.push("empty_diagnostics");
  }
  if (!report.diagnostic_fingerprint) {
    failureCodes.push("empty_diagnostic_fingerprint");
  } else if (
    report.diagnostic_fingerprint !==
    createResearchCandidateCalibrationDiagnosticFingerprint(report)
  ) {
    failureCodes.push("diagnostic_fingerprint_mismatch");
  }
  failureCodes.push(
    ...validateAuthorityBoundary(report.authority_boundary, "report_authority_boundary"),
  );

  const seenCandidateKeys = new Set<string>();
  for (const diagnostic of report.diagnostics ?? []) {
    const candidateKey = `${diagnostic.candidate_family}:${diagnostic.candidate_id}`;
    if (seenCandidateKeys.has(candidateKey)) {
      failureCodes.push(`duplicate_candidate:${candidateKey}`);
    }
    seenCandidateKeys.add(candidateKey);
    if (
      diagnostic.source_refs.length === 0 &&
      !diagnostic.source_coverage_boundary_note &&
      !diagnostic.readiness_reason_codes.includes("source_ref_missing")
    ) {
      failureCodes.push(`missing_source_ref_reason:${candidateKey}`);
    }
    if (!readinessValues.includes(diagnostic.readiness_label)) {
      failureCodes.push(`invalid_readiness_label:${candidateKey}`);
    }
    for (const reasonCode of diagnostic.readiness_reason_codes ?? []) {
      if (!reasonCodeValues.includes(reasonCode)) {
        failureCodes.push(`invalid_reason_code:${candidateKey}:${reasonCode}`);
      }
    }
    for (const riskFlag of diagnostic.risk_flags ?? []) {
      if (!riskFlagValues.includes(riskFlag)) {
        failureCodes.push(`invalid_risk_flag:${candidateKey}:${riskFlag}`);
      }
    }
    if (diagnostic.readiness_label === "ready") {
      if (diagnostic.source_ref_coverage_ratio === 0) {
        failureCodes.push(`ready_without_source_ref:${candidateKey}`);
      }
      if (diagnostic.unresolved_tension_count > 0) {
        failureCodes.push(`ready_with_unresolved_tension:${candidateKey}`);
      }
      if (diagnostic.contradiction_count > 0) {
        failureCodes.push(`ready_with_contradiction:${candidateKey}`);
      }
      if (diagnostic.knowledge_gap_count > 0) {
        failureCodes.push(`ready_with_knowledge_gap:${candidateKey}`);
      }
      if (
        ["claim", "perspective_delta"].includes(diagnostic.candidate_family) &&
        diagnostic.support_count === 0
      ) {
        failureCodes.push(`ready_without_support:${candidateKey}`);
      }
    }
    failureCodes.push(
      ...validateAuthorityBoundary(
        diagnostic.authority_boundary,
        `diagnostic_authority_boundary:${candidateKey}`,
      ),
    );
    if (forbiddenDiagnosticSummaryPattern.test(diagnostic.diagnostic_summary)) {
      failureCodes.push(`forbidden_diagnostic_summary_authority:${candidateKey}`);
    }
  }

  return {
    passed: failureCodes.length === 0,
    failure_codes: failureCodes.sort(),
  };
}

export function createResearchCandidateCalibrationDiagnosticFingerprint(
  report: ResearchCandidateCalibrationDiagnosticReport,
): string {
  const { diagnostic_fingerprint: _fingerprint, ...hashInput } = report;
  return createHash("sha256").update(canonicalJson(hashInput)).digest("hex");
}

function buildCandidateDiagnostic(args: {
  input: ResearchCandidateCalibrationDiagnosticBuilderInput;
  candidate: CandidateRecord;
  candidateRecords: CandidateRecord[];
  evidenceRecords: CandidateRecord[];
  tensionRecords: CandidateRecord[];
  knowledgeGapRecords: CandidateRecord[];
  lifecycleSummaries: LifecycleSummaryRecord[];
  feedbackEvents: ResearchCandidateCalibrationFeedbackEvent[];
}): ResearchCandidateCalibrationDiagnostic {
  const {
    input,
    candidate,
    candidateRecords,
    evidenceRecords,
    tensionRecords,
    knowledgeGapRecords,
    lifecycleSummaries,
    feedbackEvents,
  } = args;
  const lifecycleSummary = lifecycleSummaries.find(
    (summary) =>
      summary.candidateId === candidate.id &&
      summary.candidateFamily === candidate.family,
  );
  const relatedFeedbackEvents = feedbackEvents.filter((event) =>
    feedbackEventTargetsCandidate(event, candidate),
  );
  const sourceRefs = uniqueSorted([
    ...candidateSourceRefs(candidate.object),
    ...stringArrayField(lifecycleSummary?.object ?? {}, "source_refs"),
    ...relatedFeedbackEvents.flatMap((event) => event.source_ref_ids ?? []),
  ]);
  const sourceCoverageBoundaryNote =
    stringField(candidate.object, "source_coverage_boundary_note") ??
    stringField(lifecycleSummary?.object ?? {}, "source_coverage_boundary_note");
  const currentReviewStatus =
    stringField(candidate.object, "current_review_status") ??
    stringField(candidate.object, "review_status") ??
    stringField(lifecycleSummary?.object ?? {}, "current_review_status") ??
    "candidate_only";
  const currentEpistemicStatus =
    stringField(candidate.object, "current_epistemic_status") ??
    stringField(candidate.object, "epistemic_status") ??
    stringField(lifecycleSummary?.object ?? {}, "current_epistemic_status");
  const lifecycleStatus = stringField(lifecycleSummary?.object ?? {}, "lifecycle_status");
  const lifecycleNextReviewAction = stringField(
    lifecycleSummary?.object ?? {},
    "next_review_action",
  );
  const sourceRefCoverageRatio = sourceRefs.length > 0 ? 1 : 0;
  const supportCount = countSupport(candidate, candidateRecords, evidenceRecords);
  const contradictionCount = countContradictions(candidate, evidenceRecords, tensionRecords);
  const unresolvedTensionCount =
    numberField(lifecycleSummary?.object ?? {}, "unresolved_tension_count") ??
    countUnresolvedTensions(candidate, tensionRecords);
  const knowledgeGapCount =
    numberField(lifecycleSummary?.object ?? {}, "knowledge_gap_count") ??
    countKnowledgeGaps(candidate, knowledgeGapRecords);
  const missingLocatorCount = countMissingLocators(candidate, evidenceRecords);
  const feedbackSignalCounts = countFeedbackSignals(relatedFeedbackEvents);
  const readinessOverclaimRisk = hasReadinessOverclaimRisk({
    candidate,
    supportCount,
    sourceRefCoverageRatio,
    unresolvedTensionCount,
  });
  const readinessLabel = chooseReadinessLabel({
    candidate,
    lifecycleStatus,
    relatedFeedbackEvents,
    sourceRefs,
    sourceCoverageBoundaryNote,
    supportCount,
    contradictionCount,
    unresolvedTensionCount,
    knowledgeGapCount,
    sourceRefCoverageRatio,
    missingLocatorCount,
  });
  const riskFlags = buildRiskFlags({
    lifecycleStatus,
    relatedFeedbackEvents,
    sourceRefs,
    sourceCoverageBoundaryNote,
    candidate,
    supportCount,
    contradictionCount,
    unresolvedTensionCount,
    knowledgeGapCount,
    missingLocatorCount,
    readinessOverclaimRisk,
  });
  const readinessReasonCodes = buildReasonCodes({
    sourceRefs,
    sourceCoverageBoundaryNote,
    candidate,
    supportCount,
    contradictionCount,
    unresolvedTensionCount,
    knowledgeGapCount,
    missingLocatorCount,
    lifecycleStatus,
    feedbackSignalCounts,
    readinessOverclaimRisk,
    readinessLabel,
  });

  return {
    diagnostic_version: diagnosticVersion,
    scope: input.scope,
    status: diagnosticStatus,
    as_of: input.as_of,
    candidate_id: candidate.id,
    candidate_family: candidate.family,
    source_refs: sourceRefs,
    ...(sourceCoverageBoundaryNote
      ? { source_coverage_boundary_note: sourceCoverageBoundaryNote }
      : {}),
    current_review_status: currentReviewStatus,
    ...(currentEpistemicStatus
      ? { current_epistemic_status: currentEpistemicStatus }
      : {}),
    ...(lifecycleStatus ? { lifecycle_status: lifecycleStatus } : {}),
    ...(lifecycleNextReviewAction
      ? { lifecycle_next_review_action: lifecycleNextReviewAction }
      : {}),
    support_count: supportCount,
    contradiction_count: contradictionCount,
    unresolved_tension_count: unresolvedTensionCount,
    knowledge_gap_count: knowledgeGapCount,
    source_ref_coverage_ratio: sourceRefCoverageRatio,
    missing_locator_count: missingLocatorCount,
    feedback_signal_counts: feedbackSignalCounts,
    risk_flags: riskFlags,
    readiness_label: readinessLabel,
    readiness_reason_codes: readinessReasonCodes,
    diagnostic_summary: createDiagnosticSummary(candidate, readinessLabel, riskFlags),
    authority_boundary: getResearchCandidateCalibrationAuthorityBoundary(),
  };
}

function chooseReadinessLabel(args: {
  candidate: CandidateRecord;
  lifecycleStatus?: string;
  relatedFeedbackEvents: ResearchCandidateCalibrationFeedbackEvent[];
  sourceRefs: string[];
  sourceCoverageBoundaryNote?: string;
  supportCount: number;
  contradictionCount: number;
  unresolvedTensionCount: number;
  knowledgeGapCount: number;
  sourceRefCoverageRatio: number;
  missingLocatorCount: number;
}): ResearchCandidateCalibrationReadinessLabel {
  if (
    args.lifecycleStatus === "blocked" ||
    (args.sourceRefs.length === 0 && !args.sourceCoverageBoundaryNote)
  ) {
    return "blocked";
  }
  if (
    args.lifecycleStatus === "invalidated" ||
    args.relatedFeedbackEvents.some((event) => event.event_type === "invalidate_preview")
  ) {
    return "not_ready";
  }
  if (args.contradictionCount > 0 || args.unresolvedTensionCount > 0) {
    return args.supportCount > 0 && args.sourceRefCoverageRatio > 0
      ? "ready_with_tensions"
      : "weak_ready";
  }
  if (args.knowledgeGapCount > 0) {
    return args.supportCount > 0 && args.sourceRefCoverageRatio > 0
      ? "ready_with_tensions"
      : "weak_ready";
  }
  if (
    ["claim", "perspective_delta"].includes(args.candidate.family) &&
    args.supportCount === 0
  ) {
    return args.sourceRefs.length === 0 ? "not_ready" : "weak_ready";
  }
  if (args.missingLocatorCount > 0) return "weak_ready";
  if (
    args.sourceRefCoverageRatio > 0 &&
    args.supportCount > 0 &&
    args.unresolvedTensionCount === 0 &&
    args.knowledgeGapCount === 0 &&
    args.contradictionCount === 0
  ) {
    return "ready";
  }
  return "weak_ready";
}

function buildReasonCodes(args: {
  sourceRefs: string[];
  sourceCoverageBoundaryNote?: string;
  candidate: CandidateRecord;
  supportCount: number;
  contradictionCount: number;
  unresolvedTensionCount: number;
  knowledgeGapCount: number;
  missingLocatorCount: number;
  lifecycleStatus?: string;
  feedbackSignalCounts: ResearchCandidateCalibrationDiagnostic["feedback_signal_counts"];
  readinessOverclaimRisk: boolean;
  readinessLabel: ResearchCandidateCalibrationReadinessLabel;
}): ResearchCandidateCalibrationReasonCode[] {
  return uniqueSorted([
    args.sourceRefs.length > 0 ? "source_ref_present" : "source_ref_missing",
    ...(args.sourceCoverageBoundaryNote ? ["source_coverage_boundary_present"] : []),
    ...(["claim", "perspective_delta"].includes(args.candidate.family)
      ? [args.supportCount > 0 ? "evidence_present" : "evidence_missing"]
      : args.supportCount > 0
        ? ["evidence_present"]
        : []),
    ...(args.contradictionCount > 0 ? ["contradiction_present"] : []),
    ...(args.unresolvedTensionCount > 0 ? ["unresolved_tension_present"] : []),
    ...(args.knowledgeGapCount > 0 ? ["knowledge_gap_present"] : []),
    ...(args.missingLocatorCount > 0 ? ["locator_missing"] : []),
    ...(args.candidate.family === "evidence" &&
    args.missingLocatorCount === 0 &&
    hasLocator(args.candidate.object)
      ? ["locator_present"]
      : []),
    ...(args.lifecycleStatus === "blocked" ? ["lifecycle_blocked"] : []),
    ...(args.lifecycleStatus === "invalidated" ? ["lifecycle_invalidated"] : []),
    ...(args.lifecycleStatus === "operator_corrected"
      ? ["lifecycle_operator_corrected"]
      : []),
    ...(args.lifecycleStatus === "operator_pinned" ? ["lifecycle_operator_pinned"] : []),
    ...(args.lifecycleStatus === "operator_dismissed"
      ? ["lifecycle_operator_dismissed"]
      : []),
    ...(args.feedbackSignalCounts.invalidate_preview > 0
      ? ["operator_invalidation_present"]
      : []),
    ...(args.feedbackSignalCounts.correct_preview > 0
      ? ["operator_correction_present"]
      : []),
    ...(args.feedbackSignalCounts.pin_preview > 0 ? ["operator_pin_present"] : []),
    ...(args.feedbackSignalCounts.dismiss_preview > 0
      ? ["operator_dismissal_present"]
      : []),
    ...(args.readinessOverclaimRisk ? ["readiness_overclaim_risk"] : []),
    ...(args.readinessLabel === "ready_with_tensions"
      ? ["ready_with_unresolved_tensions"]
      : []),
    "diagnostic_only_not_promotion",
  ] as ResearchCandidateCalibrationReasonCode[]);
}

function buildRiskFlags(args: {
  lifecycleStatus?: string;
  relatedFeedbackEvents: ResearchCandidateCalibrationFeedbackEvent[];
  sourceRefs: string[];
  sourceCoverageBoundaryNote?: string;
  candidate: CandidateRecord;
  supportCount: number;
  contradictionCount: number;
  unresolvedTensionCount: number;
  knowledgeGapCount: number;
  missingLocatorCount: number;
  readinessOverclaimRisk: boolean;
}): ResearchCandidateCalibrationRiskFlag[] {
  return uniqueSorted([
    ...(args.sourceRefs.length === 0 && !args.sourceCoverageBoundaryNote
      ? ["missing_source_ref"]
      : []),
    ...(["claim", "perspective_delta"].includes(args.candidate.family) &&
    args.supportCount === 0
      ? ["missing_evidence"]
      : []),
    ...(args.missingLocatorCount > 0 ? ["missing_locator"] : []),
    ...(args.relatedFeedbackEvents.some(
      (event) => event.event_type === "invalidate_preview",
    )
      ? ["operator_invalidated"]
      : []),
    ...(args.contradictionCount > 0 || args.unresolvedTensionCount > 0
      ? ["contradiction_or_tension"]
      : []),
    ...(args.knowledgeGapCount > 0 ? ["knowledge_gap_open"] : []),
    ...(args.readinessOverclaimRisk ? ["overclaim_risk"] : []),
    ...(args.lifecycleStatus === "stale" ? ["stale_context"] : []),
  ] as ResearchCandidateCalibrationRiskFlag[]);
}

function countSupport(
  candidate: CandidateRecord,
  candidateRecords: CandidateRecord[],
  evidenceRecords: CandidateRecord[],
): number {
  if (candidate.family === "claim") {
    return supportedEvidenceRecordsForClaim(candidate, evidenceRecords).length;
  }
  if (candidate.family === "perspective_delta") {
    return verifiedSupportIds(candidate, candidateRecords, evidenceRecords, {
      evidenceFields: [
        "basis_evidence_candidate_ids",
        "supporting_evidence_candidate_ids",
      ],
      claimFields: ["basis_claim_candidate_ids", "supporting_claim_candidate_ids"],
    }).length;
  }
  return verifiedSupportIds(candidate, candidateRecords, evidenceRecords, {
    evidenceFields: ["supporting_evidence_candidate_ids", "basis_evidence_candidate_ids"],
    claimFields: ["supporting_claim_candidate_ids", "basis_claim_candidate_ids"],
  }).length;
}

function supportedEvidenceRecordsForClaim(
  claim: CandidateRecord,
  evidenceRecords: CandidateRecord[],
): CandidateRecord[] {
  const explicitEvidenceIds = new Set([
    ...stringArrayField(claim.object, "supporting_evidence_candidate_ids"),
    ...stringArrayField(claim.object, "basis_evidence_candidate_ids"),
  ]);
  return evidenceRecords
    .filter((evidence) => stringField(evidence.object, "evidence_role") !== "contradicts")
    .filter(
      (evidence) =>
        explicitEvidenceIds.has(evidence.id) || evidenceLinksClaim(evidence, claim.id),
    )
    .sort((left, right) => left.id.localeCompare(right.id));
}

function verifiedSupportIds(
  candidate: CandidateRecord,
  candidateRecords: CandidateRecord[],
  evidenceRecords: CandidateRecord[],
  fields: {
    evidenceFields: string[];
    claimFields: string[];
  },
): string[] {
  const evidenceById = existingEvidenceById(evidenceRecords);
  const claimIds = existingClaimIds(candidateRecords);
  const supportIds = new Set<string>();
  for (const field of fields.evidenceFields) {
    for (const evidenceId of stringArrayField(candidate.object, field)) {
      const evidence = evidenceById.get(evidenceId);
      if (evidence && stringField(evidence.object, "evidence_role") !== "contradicts") {
        supportIds.add(`evidence:${evidence.id}`);
      }
    }
  }
  for (const field of fields.claimFields) {
    for (const claimId of stringArrayField(candidate.object, field)) {
      if (claimIds.has(claimId)) supportIds.add(`claim:${claimId}`);
    }
  }
  return Array.from(supportIds).sort();
}

function existingEvidenceById(
  evidenceRecords: CandidateRecord[],
): Map<string, CandidateRecord> {
  return new Map(evidenceRecords.map((evidence) => [evidence.id, evidence]));
}

function existingClaimIds(candidateRecords: CandidateRecord[]): Set<string> {
  return new Set(
    candidateRecords
      .filter((candidate) => candidate.family === "claim")
      .map((candidate) => candidate.id),
  );
}

function countContradictions(
  candidate: CandidateRecord,
  evidenceRecords: CandidateRecord[],
  tensionRecords: CandidateRecord[],
): number {
  const contradictionKeys = new Set<string>();
  for (const evidenceId of stringArrayField(
    candidate.object,
    "contradicting_evidence_candidate_ids",
  )) {
    contradictionKeys.add(`direct-evidence:${evidenceId}`);
  }
  for (const evidence of evidenceRecords) {
    if (
      stringField(evidence.object, "evidence_role") === "contradicts" &&
      candidateLinksEvidence(candidate, evidence)
    ) {
      contradictionKeys.add(`evidence:${evidence.id}`);
    }
  }
  for (const tension of tensionRecords) {
    if (
      stringField(tension.object, "tension_type") === "contradiction" &&
      tensionLinksCandidate(tension, candidate)
    ) {
      contradictionKeys.add(`tension:${tension.id}`);
    }
  }
  return contradictionKeys.size;
}

function countUnresolvedTensions(
  candidate: CandidateRecord,
  tensionRecords: CandidateRecord[],
): number {
  if (candidate.family === "tension") {
    return candidate.object.blocks_or_qualifies_promotion === true ? 1 : 0;
  }
  const directTensionIds = new Set([
    ...stringArrayField(candidate.object, "related_tension_candidate_ids"),
  ]);
  for (const tension of tensionRecords) {
    if (tensionLinksCandidate(tension, candidate)) {
      directTensionIds.add(tension.id);
    }
  }
  return directTensionIds.size;
}

function countKnowledgeGaps(
  candidate: CandidateRecord,
  knowledgeGapRecords: CandidateRecord[],
): number {
  if (candidate.family === "knowledge_gap") return 1;
  const directGapIds = new Set([
    ...stringArrayField(candidate.object, "related_gap_candidate_ids"),
    ...stringArrayField(candidate.object, "related_knowledge_gap_candidate_ids"),
  ]);
  for (const gap of knowledgeGapRecords) {
    if (knowledgeGapLinksCandidate(gap, candidate)) {
      directGapIds.add(gap.id);
    }
  }
  return directGapIds.size;
}

function countMissingLocators(
  candidate: CandidateRecord,
  evidenceRecords: CandidateRecord[],
): number {
  if (candidate.family === "evidence") return hasLocator(candidate.object) ? 0 : 1;
  if (candidate.family === "claim" || candidate.family === "perspective_delta") {
    return linkedEvidenceRecords(candidate, evidenceRecords).filter(
      (evidence) => !hasLocator(evidence.object),
    ).length;
  }
  return hasLocatorLikeField(candidate.object) && !hasLocator(candidate.object) ? 1 : 0;
}

function hasReadinessOverclaimRisk(args: {
  candidate: CandidateRecord;
  supportCount: number;
  sourceRefCoverageRatio: number;
  unresolvedTensionCount: number;
}): boolean {
  return (
    ["ready", "ready_with_tensions"].includes(
      stringField(args.candidate.object, "promotion_readiness") ?? "",
    ) &&
    (args.supportCount === 0 ||
      args.sourceRefCoverageRatio === 0 ||
      args.unresolvedTensionCount > 0)
  );
}

function countFeedbackSignals(
  feedbackEvents: ResearchCandidateCalibrationFeedbackEvent[],
): ResearchCandidateCalibrationDiagnostic["feedback_signal_counts"] {
  return {
    dismiss_preview: feedbackEvents.filter(
      (event) => event.event_type === "dismiss_preview",
    ).length,
    pin_preview: feedbackEvents.filter((event) => event.event_type === "pin_preview")
      .length,
    correct_preview: feedbackEvents.filter(
      (event) => event.event_type === "correct_preview",
    ).length,
    invalidate_preview: feedbackEvents.filter(
      (event) => event.event_type === "invalidate_preview",
    ).length,
  };
}

function collectCandidateRecords(
  candidateReview: ResearchCandidateCalibrationCandidateReviewInput,
): CandidateRecord[] {
  return familyConfigs.flatMap((config) =>
    (candidateReview[config.collectionKey] ?? [])
      .map((candidate) => asRecord(candidate))
      .filter(isPresent)
      .map((candidate) => ({
        family: config.family,
        id: candidateId(candidate, config.idField),
        object: candidate,
      }))
      .filter((candidate) => candidate.id.length > 0),
  );
}

function collectLifecycleSummaries(values: unknown[]): LifecycleSummaryRecord[] {
  return values
    .map((value) => asRecord(value))
    .filter(isPresent)
    .map((summary) => {
      const candidateFamily = normalizeFamily(
        stringField(summary, "candidate_family") ?? "",
      );
      return {
        candidateId: stringField(summary, "candidate_id") ?? "",
        candidateFamily,
        object: summary,
      };
    })
    .filter(
      (summary): summary is LifecycleSummaryRecord =>
        summary.candidateId.length > 0 && summary.candidateFamily !== undefined,
    );
}

function candidateId(candidate: Record<string, unknown>, idField: string): string {
  return (
    stringField(candidate, idField) ??
    stringField(candidate, "candidate_id") ??
    stringField(candidate, "id") ??
    ""
  );
}

function candidateSourceRefs(candidate: Record<string, unknown>): string[] {
  return uniqueSorted([
    ...stringArrayField(candidate, "source_refs"),
    ...stringArrayField(candidate, "source_ref_ids"),
    ...optionalStringArray(stringField(candidate, "source_ref_id")),
  ]);
}

function candidateLinksEvidence(
  candidate: CandidateRecord,
  evidence: CandidateRecord,
): boolean {
  if (candidate.family === "claim") return evidenceLinksClaim(evidence, candidate.id);
  if (candidate.family === "evidence") return candidate.id === evidence.id;
  if (candidate.family === "perspective_delta") {
    return stringArrayField(candidate.object, "basis_evidence_candidate_ids").includes(
      evidence.id,
    );
  }
  return stringArrayField(candidate.object, "related_evidence_candidate_ids").includes(
    evidence.id,
  );
}

function evidenceLinksClaim(evidence: CandidateRecord, claimId: string): boolean {
  return (
    stringField(evidence.object, "claim_candidate_id") === claimId ||
    stringArrayField(evidence.object, "related_claim_candidate_ids").includes(claimId) ||
    stringArrayField(evidence.object, "claim_candidate_ids").includes(claimId)
  );
}

function tensionLinksCandidate(tension: CandidateRecord, candidate: CandidateRecord): boolean {
  if (candidate.family === "claim") {
    return stringArrayField(tension.object, "related_claim_candidate_ids").includes(
      candidate.id,
    );
  }
  if (candidate.family === "evidence") {
    return stringArrayField(tension.object, "related_evidence_candidate_ids").includes(
      candidate.id,
    );
  }
  if (candidate.family === "perspective_delta") {
    return stringArrayField(candidate.object, "related_tension_candidate_ids").includes(
      tension.id,
    );
  }
  return (
    stringArrayField(tension.object, "related_candidate_ids").includes(candidate.id) ||
    stringArrayField(candidate.object, "related_tension_candidate_ids").includes(
      tension.id,
    )
  );
}

function knowledgeGapLinksCandidate(
  gap: CandidateRecord,
  candidate: CandidateRecord,
): boolean {
  if (candidate.family === "claim") {
    return stringArrayField(gap.object, "related_claim_candidate_ids").includes(
      candidate.id,
    );
  }
  if (candidate.family === "tension") {
    return stringArrayField(gap.object, "related_tension_candidate_ids").includes(
      candidate.id,
    );
  }
  if (candidate.family === "evidence") {
    return stringArrayField(gap.object, "related_evidence_candidate_ids").includes(
      candidate.id,
    );
  }
  if (candidate.family === "perspective_delta") {
    return (
      stringArrayField(candidate.object, "related_gap_candidate_ids").includes(gap.id) ||
      stringArrayField(candidate.object, "related_knowledge_gap_candidate_ids").includes(
        gap.id,
      )
    );
  }
  return stringArrayField(gap.object, "related_candidate_ids").includes(candidate.id);
}

function linkedEvidenceRecords(
  candidate: CandidateRecord,
  evidenceRecords: CandidateRecord[],
): CandidateRecord[] {
  return evidenceRecords.filter((evidence) => candidateLinksEvidence(candidate, evidence));
}

function feedbackEventTargetsCandidate(
  event: ResearchCandidateCalibrationFeedbackEvent,
  candidate: CandidateRecord,
): boolean {
  if (event.target_id !== candidate.id) return false;
  const normalizedFamily = normalizeFeedbackTargetFamily(event.target_kind);
  if (normalizedFamily === null) {
    // Legacy previews may omit target_kind. Keep target-id-only matching only
    // for absent or empty target_kind.
    return true;
  }
  return normalizedFamily === candidate.family;
}

function normalizeFeedbackTargetFamily(
  targetKind: string | undefined,
): ResearchCandidateCalibrationCandidateFamily | null | undefined {
  if (!targetKind || targetKind.trim().length === 0) return null;
  return normalizeFamily(targetKind);
}

function normalizeFamily(
  family: string,
): ResearchCandidateCalibrationCandidateFamily | undefined {
  const normalized = family.trim().toLowerCase();
  if (normalized === "claim" || normalized === "claim_candidate") return "claim";
  if (normalized === "evidence" || normalized === "evidence_candidate") {
    return "evidence";
  }
  if (normalized === "tension" || normalized === "tension_candidate") {
    return "tension";
  }
  if (
    normalized === "knowledge_gap" ||
    normalized === "gap" ||
    normalized === "knowledge_gap_candidate"
  ) {
    return "knowledge_gap";
  }
  if (
    normalized === "perspective_delta" ||
    normalized === "perspective_delta_candidate"
  ) {
    return "perspective_delta";
  }
  if (
    normalized === "follow_up_work" ||
    normalized === "follow_up_work_candidate"
  ) {
    return "follow_up_work";
  }
  return undefined;
}

function sortFeedbackEvents(
  events: ResearchCandidateCalibrationFeedbackEvent[],
): ResearchCandidateCalibrationFeedbackEvent[] {
  return [...events].sort(
    (left, right) =>
      (left.created_at ?? "").localeCompare(right.created_at ?? "") ||
      left.event_id.localeCompare(right.event_id),
  );
}

function createReadinessCounts(): Record<ResearchCandidateCalibrationReadinessLabel, number> {
  return Object.fromEntries(readinessValues.map((label) => [label, 0])) as Record<
    ResearchCandidateCalibrationReadinessLabel,
    number
  >;
}

function createRiskFlagCounts(): Record<ResearchCandidateCalibrationRiskFlag, number> {
  return Object.fromEntries(riskFlagValues.map((flag) => [flag, 0])) as Record<
    ResearchCandidateCalibrationRiskFlag,
    number
  >;
}

function createDiagnosticSummary(
  candidate: CandidateRecord,
  readinessLabel: ResearchCandidateCalibrationReadinessLabel,
  riskFlags: ResearchCandidateCalibrationRiskFlag[],
): string {
  const riskText = riskFlags.length > 0 ? riskFlags.join(", ") : "none";
  return `Diagnostic review cue for ${candidate.family} ${candidate.id}: readiness_label=${readinessLabel}; risk_flags=${riskText}; diagnostic-only explanation for operator review.`;
}

function validateAuthorityBoundary(
  boundary: ResearchCandidateCalibrationAuthorityBoundary,
  prefix: string,
): string[] {
  const failureCodes: string[] = [];
  if (boundary?.diagnostic_only !== true) {
    failureCodes.push(`${prefix}:not_diagnostic_only`);
  }
  for (const field of forbiddenAuthorityFields) {
    if (boundary?.[field] !== false) {
      failureCodes.push(`${prefix}:forbidden_authority:${field}`);
    }
  }
  return failureCodes;
}

const forbiddenDiagnosticSummaryPattern =
  /\bpromoted\b|proof created|evidence record created|state committed|product write|\btruth\b|\bpromotion\b/i;

function hasLocator(record: Record<string, unknown>): boolean {
  return locatorFields.some((field) => {
    const value = record[field];
    if (typeof value === "string") return value.trim().length > 0;
    if (Array.isArray(value)) return value.length > 0;
    return Boolean(value && typeof value === "object");
  });
}

function hasLocatorLikeField(record: Record<string, unknown>): boolean {
  return locatorFields.some((field) => Object.hasOwn(record, field));
}

const locatorFields = [
  "locator",
  "source_locator",
  "source_locator_ref",
  "quote_locator",
  "evidence_locator",
] as const;

function canonicalJson(value: unknown): string {
  if (value === null) return "null";
  if (typeof value === "string") return JSON.stringify(value);
  if (typeof value === "number" || typeof value === "boolean") {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((item) => canonicalJson(item)).join(",")}]`;
  }
  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    const entries = Object.keys(record)
      .filter((key) => record[key] !== undefined)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonicalJson(record[key])}`);
    return `{${entries.join(",")}}`;
  }
  return JSON.stringify(null);
}

function stringField(record: Record<string, unknown>, field: string): string | undefined {
  const value = record[field];
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function stringArrayField(record: Record<string, unknown>, field: string): string[] {
  const value = record[field];
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

function numberField(record: Record<string, unknown>, field: string): number | undefined {
  const value = record[field];
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function optionalStringArray(value: string | undefined): string[] {
  return value ? [value] : [];
}

function uniqueSorted<T extends string>(values: T[]): T[] {
  return Array.from(new Set(values.filter((value) => value.length > 0))).sort();
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function isPresent<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}
