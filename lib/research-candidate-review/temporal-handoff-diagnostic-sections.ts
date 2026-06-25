import { createHash } from "node:crypto";

import type {
  DecisionHoldMode,
  ExpectedObservedDeltaKind,
  NotDoneClassification,
  TemporalDecisionHoldTracePreview,
  TemporalExpectedObservedDeltaPreview,
  TemporalHandoffDiagnosticAuthorityBoundary,
  TemporalHandoffDiagnosticBuilderInput,
  TemporalHandoffDiagnosticReasonCode,
  TemporalHandoffDiagnosticReport,
  TemporalHandoffDiagnosticSections,
  TemporalHandoffDiagnosticValidationResult,
  TemporalHandoffPreviewInput,
  TemporalHandoffTargetKind,
  TemporalNotDonePreview,
} from "../../types/temporal-handoff-diagnostic-sections";

const sectionsVersion = "temporal_handoff_diagnostic_sections.v0.1" as const;
const reportVersion = "temporal_handoff_diagnostic_report.v0.1" as const;
const diagnosticStatus = "diagnostic_preview_only" as const;

const targetKindValues: TemporalHandoffTargetKind[] = [
  "ai_context_packet",
  "codex_handoff_draft",
  "human_review_packet",
  "dogfooding_review_packet",
  "unknown",
];

const deltaKindValues: ExpectedObservedDeltaKind[] = [
  "none",
  "omission",
  "unexpected_change",
  "factual_mismatch",
  "sequence_mismatch",
  "action_effect_mismatch",
  "scope_mismatch",
  "user_preference_shift",
  "repo_state_shift",
  "validation_mismatch",
  "authority_boundary_mismatch",
];

const holdModeValues: DecisionHoldMode[] = [
  "none",
  "reactive_repair",
  "anticipatory_stop",
  "bounded_continue",
  "operator_decision_required",
];

const notDoneValues: NotDoneClassification[] = [
  "not_started",
  "partial",
  "blocked",
  "out_of_scope",
  "needs_review",
  "complete",
  "unknown",
];

const reasonCodeValues: TemporalHandoffDiagnosticReasonCode[] = [
  "expected_files_present",
  "expected_files_missing",
  "observed_files_present",
  "observed_files_missing",
  "expected_checks_present",
  "expected_checks_missing",
  "observed_checks_present",
  "observed_checks_missing",
  "expected_observed_match",
  "expected_observed_mismatch",
  "source_refs_present",
  "source_refs_missing",
  "unresolved_tension_present",
  "knowledge_gap_present",
  "decision_hold_present",
  "not_done_classified",
  "authority_boundary_preserved",
  "diagnostic_preview_not_execution",
];

const forbiddenAuthorityFields = [
  "execution_approval",
  "codex_execution_authority",
  "github_automation_authority",
  "branch_pr_creation_authority",
  "source_of_truth",
  "proof_or_evidence_record",
  "perspective_promotion",
  "durable_perspective_state",
  "work_mutation",
  "provider_openai_authority",
  "source_fetch_authority",
  "retrieval_rag_authority",
  "git_ledger_export_authority",
  "product_write_authority",
  "product_id_allocation_authority",
] as const;

const forbiddenOutputTextPattern =
  /execution approved|Codex executed|GitHub PR created|branch created|proof created|evidence record created|Perspective promoted|state committed|product write|\btruth\b/i;

export function getTemporalHandoffDiagnosticAuthorityBoundary(): TemporalHandoffDiagnosticAuthorityBoundary {
  return {
    diagnostic_preview_only: true,
    execution_approval: false,
    codex_execution_authority: false,
    github_automation_authority: false,
    branch_pr_creation_authority: false,
    source_of_truth: false,
    proof_or_evidence_record: false,
    perspective_promotion: false,
    durable_perspective_state: false,
    work_mutation: false,
    provider_openai_authority: false,
    source_fetch_authority: false,
    retrieval_rag_authority: false,
    git_ledger_export_authority: false,
    product_write_authority: false,
    product_id_allocation_authority: false,
  };
}

export function buildTemporalHandoffDiagnosticReport(
  input: TemporalHandoffDiagnosticBuilderInput,
): TemporalHandoffDiagnosticReport {
  const sections = input.handoff_previews
    .map((preview) => buildSection(input, preview))
    .sort(compareSections);
  const holdModes = sections.flatMap((section) =>
    section.decision_hold_traces.length > 0
      ? section.decision_hold_traces.map((trace) => trace.hold_mode)
      : ["none" as const],
  );

  const report: TemporalHandoffDiagnosticReport = {
    report_version: reportVersion,
    scope: input.scope,
    status: diagnosticStatus,
    as_of: input.as_of,
    sections,
    target_counts: countByValues(
      targetKindValues,
      sections.map((section) => section.target_kind),
    ),
    delta_counts: countByValues(
      deltaKindValues,
      sections.flatMap((section) =>
        section.expected_observed_deltas.map((delta) => delta.delta_kind),
      ),
    ),
    hold_mode_counts: countByValues(holdModeValues, holdModes),
    not_done_counts: countByValues(
      notDoneValues,
      sections.map((section) => section.not_done.classification),
    ),
    boundary_notes: [
      "Decision hold is review context, not rejection.",
      "Expected/Observed delta is diagnostic, not authority.",
      "Not-done classification is review context, not automatic failure.",
      "Product-write remains parked by #686.",
      "Source refs are coverage signals, not proof.",
    ].sort(),
    report_fingerprint: "",
    authority_boundary: getTemporalHandoffDiagnosticAuthorityBoundary(),
  };

  return {
    ...report,
    report_fingerprint: createTemporalHandoffDiagnosticReportFingerprint(report),
  };
}

export function validateTemporalHandoffDiagnosticReport(
  report: TemporalHandoffDiagnosticReport,
): TemporalHandoffDiagnosticValidationResult {
  const failureCodes: string[] = [];
  if (report.report_version !== reportVersion) failureCodes.push("invalid_report_version");
  if (report.status !== diagnosticStatus) failureCodes.push("invalid_status");
  if (!report.scope) failureCodes.push("empty_scope");
  if (!Array.isArray(report.sections) || report.sections.length === 0) {
    failureCodes.push("empty_sections");
  }
  if (!report.report_fingerprint) {
    failureCodes.push("empty_report_fingerprint");
  } else if (
    report.report_fingerprint !== createTemporalHandoffDiagnosticReportFingerprint(report)
  ) {
    failureCodes.push("report_fingerprint_mismatch");
  }
  failureCodes.push(
    ...validateAuthorityBoundary(report.authority_boundary, "report_authority_boundary"),
  );

  const seenTargets = new Set<string>();
  for (const section of report.sections ?? []) {
    const sectionKey = `${section.target_kind}:${section.target_ref}`;
    if (seenTargets.has(sectionKey)) failureCodes.push(`duplicate_section:${sectionKey}`);
    seenTargets.add(sectionKey);
    if (!targetKindValues.includes(section.target_kind)) {
      failureCodes.push(`invalid_target_kind:${sectionKey}`);
    }
    for (const delta of section.expected_observed_deltas ?? []) {
      if (!delta.delta_id) failureCodes.push(`empty_delta_id:${sectionKey}`);
      if (!deltaKindValues.includes(delta.delta_kind)) {
        failureCodes.push(`invalid_delta_kind:${sectionKey}:${delta.delta_kind}`);
      }
    }
    for (const holdTrace of section.decision_hold_traces ?? []) {
      if (!holdTrace.hold_id) failureCodes.push(`empty_hold_id:${sectionKey}`);
      if (!holdModeValues.includes(holdTrace.hold_mode)) {
        failureCodes.push(`invalid_hold_mode:${sectionKey}:${holdTrace.hold_mode}`);
      }
    }
    if (!notDoneValues.includes(section.not_done?.classification)) {
      failureCodes.push(`invalid_not_done:${sectionKey}`);
    }
    for (const reasonCode of section.reason_codes ?? []) {
      if (!reasonCodeValues.includes(reasonCode)) {
        failureCodes.push(`invalid_reason_code:${sectionKey}:${reasonCode}`);
      }
    }
    if (!section.reason_codes.includes("diagnostic_preview_not_execution")) {
      failureCodes.push(`missing_diagnostic_preview_not_execution:${sectionKey}`);
    }
    if (!section.reason_codes.includes("authority_boundary_preserved")) {
      failureCodes.push(`missing_authority_boundary_preserved:${sectionKey}`);
    }
    if (
      section.source_refs.length === 0 &&
      !section.reason_codes.includes("source_refs_missing")
    ) {
      failureCodes.push(`missing_source_refs_missing_reason:${sectionKey}`);
    }
    if (
      section.unresolved_tension_refs.length > 0 &&
      !section.reason_codes.includes("unresolved_tension_present")
    ) {
      failureCodes.push(`missing_unresolved_tension_reason:${sectionKey}`);
    }
    failureCodes.push(
      ...validateAuthorityBoundary(
        section.authority_boundary,
        `section_authority_boundary:${sectionKey}`,
      ),
    );
    if (sectionTextHasForbiddenAuthority(section)) {
      failureCodes.push(`section_text_forbidden_authority:${sectionKey}`);
    }
  }

  return {
    passed: failureCodes.length === 0,
    failure_codes: failureCodes.sort(),
  };
}

export function createTemporalHandoffDiagnosticReportFingerprint(
  report: TemporalHandoffDiagnosticReport,
): string {
  const { report_fingerprint: _fingerprint, ...hashInput } = report;
  return createHash("sha256").update(canonicalJson(hashInput)).digest("hex");
}

function buildSection(
  input: TemporalHandoffDiagnosticBuilderInput,
  preview: TemporalHandoffPreviewInput,
): TemporalHandoffDiagnosticSections {
  const targetKind = normalizeTargetKind(preview.target_kind);
  const expectedFiles = uniqueSorted(preview.expected_files ?? []);
  const observedFiles = uniqueSorted(preview.observed_files ?? []);
  const expectedChecks = uniqueSorted(preview.expected_checks ?? []);
  const observedChecks = uniqueSorted(preview.observed_checks ?? []);
  const sourceRefs = uniqueSorted(preview.source_refs ?? []);
  const unresolvedTensionRefs = uniqueSorted(preview.unresolved_tension_refs ?? []);
  const knowledgeGapRefs = uniqueSorted(preview.knowledge_gap_refs ?? []);
  const reviewCueRefs = uniqueSorted(preview.review_cue_refs ?? []);
  const deltas = buildDeltas({
    targetKind,
    targetRef: preview.target_ref,
    expectedFiles,
    observedFiles,
    expectedChecks,
    observedChecks,
    sourceRefs,
    authorityBoundaryNotes: preview.authority_boundary_notes ?? [],
  });
  const notDone = classifyNotDone({
    expectedFiles,
    observedFiles,
    expectedChecks,
    observedChecks,
    deltas,
    statusHint: preview.status_hint,
  });
  const decisionHolds = buildDecisionHolds({
    targetKind,
    targetRef: preview.target_ref,
    sourceRefs,
    unresolvedTensionRefs,
    deltas,
    statusHint: preview.status_hint,
  });

  return {
    sections_version: sectionsVersion,
    scope: input.scope,
    status: diagnosticStatus,
    as_of: input.as_of,
    target_kind: targetKind,
    target_ref: preview.target_ref,
    source_fixture_refs: uniqueSorted(input.source_fixture_refs),
    expected_files: expectedFiles,
    observed_files: observedFiles,
    expected_checks: expectedChecks,
    observed_checks: observedChecks,
    source_refs: sourceRefs,
    unresolved_tension_refs: unresolvedTensionRefs,
    knowledge_gap_refs: knowledgeGapRefs,
    review_cue_refs: reviewCueRefs,
    expected_observed_deltas: deltas.sort(compareDeltas),
    decision_hold_traces: decisionHolds.sort(compareDecisionHolds),
    not_done: notDone,
    reason_codes: buildReasonCodes({
      expectedFiles,
      observedFiles,
      expectedChecks,
      observedChecks,
      sourceRefs,
      unresolvedTensionRefs,
      knowledgeGapRefs,
      decisionHolds,
      deltas,
    }),
    authority_boundary: getTemporalHandoffDiagnosticAuthorityBoundary(),
  };
}

function buildDeltas(args: {
  targetKind: TemporalHandoffTargetKind;
  targetRef: string;
  expectedFiles: string[];
  observedFiles: string[];
  expectedChecks: string[];
  observedChecks: string[];
  sourceRefs: string[];
  authorityBoundaryNotes: string[];
}): TemporalExpectedObservedDeltaPreview[] {
  const deltas: TemporalExpectedObservedDeltaPreview[] = [];
  const missingExpectedFiles = difference(args.expectedFiles, args.observedFiles);
  const unexpectedObservedFiles = difference(args.observedFiles, args.expectedFiles);
  const missingExpectedChecks = difference(args.expectedChecks, args.observedChecks);
  const unexpectedObservedChecks = difference(args.observedChecks, args.expectedChecks);
  if (missingExpectedFiles.length > 0) {
    deltas.push(
      createDelta(args, "omission", args.expectedFiles, args.observedFiles, missingExpectedFiles, []),
    );
  }
  if (unexpectedObservedFiles.length > 0) {
    deltas.push(
      createDelta(
        args,
        "unexpected_change",
        args.expectedFiles,
        args.observedFiles,
        [],
        unexpectedObservedFiles,
      ),
    );
  }
  if (missingExpectedChecks.length > 0 || unexpectedObservedChecks.length > 0) {
    deltas.push(
      createDelta(
        args,
        "validation_mismatch",
        args.expectedChecks,
        args.observedChecks,
        missingExpectedChecks,
        unexpectedObservedChecks,
      ),
    );
  }
  if (args.authorityBoundaryNotes.some(isAuthorityBoundaryConfusingNote)) {
    deltas.push(
      createDelta(
        args,
        "authority_boundary_mismatch",
        ["authority-boundary:diagnostic-preview-only"],
        ["authority-boundary:confusing-note"],
        [],
        ["authority-boundary:confusing-note"],
      ),
    );
  }
  if (deltas.length === 0) {
    deltas.push(
      createDelta(
        args,
        "none",
        [...args.expectedFiles, ...args.expectedChecks],
        [...args.observedFiles, ...args.observedChecks],
        [],
        [],
      ),
    );
  }
  return deltas;
}

function createDelta(
  args: {
    targetKind: TemporalHandoffTargetKind;
    targetRef: string;
    sourceRefs: string[];
  },
  deltaKind: ExpectedObservedDeltaKind,
  expectedRefs: string[],
  observedRefs: string[],
  missingExpectedRefs: string[],
  unexpectedObservedRefs: string[],
): TemporalExpectedObservedDeltaPreview {
  const sourceRefs = uniqueSorted(args.sourceRefs);
  const expected = uniqueSorted(expectedRefs);
  const observed = uniqueSorted(observedRefs);
  const missing = uniqueSorted(missingExpectedRefs);
  const unexpected = uniqueSorted(unexpectedObservedRefs);
  const deltaId = `delta:${args.targetKind}:${sanitizeIdSegment(args.targetRef)}:${deltaKind}`;
  return {
    delta_id: deltaId,
    delta_kind: deltaKind,
    expected_refs: expected,
    observed_refs: observed,
    missing_expected_refs: missing,
    unexpected_observed_refs: unexpected,
    source_refs: sourceRefs,
    reliability_preview: reliabilityPreview(sourceRefs, [
      ...expected,
      ...observed,
      ...missing,
      ...unexpected,
    ]),
    review_note: reviewNoteForDelta(deltaKind),
  };
}

function buildDecisionHolds(args: {
  targetKind: TemporalHandoffTargetKind;
  targetRef: string;
  sourceRefs: string[];
  unresolvedTensionRefs: string[];
  deltas: TemporalExpectedObservedDeltaPreview[];
  statusHint?: string;
}): TemporalDecisionHoldTracePreview[] {
  const holdTraces: TemporalDecisionHoldTracePreview[] = [];
  const sourceRefs = uniqueSorted(args.sourceRefs);
  const targetSegment = sanitizeIdSegment(args.targetRef);
  const normalizedStatus = normalizeStatusHint(args.statusHint);
  const mismatchDeltas = args.deltas.filter((delta) => delta.delta_kind !== "none");
  if (sourceRefs.length === 0) {
    holdTraces.push({
      hold_id: `hold:${args.targetKind}:${targetSegment}:source`,
      hold_mode: "operator_decision_required",
      trigger_refs: ["source_refs_missing"],
      source_refs: [],
      why_now: "Source coverage is missing for this diagnostic preview.",
      review_cue: "Inspect source coverage before treating the handoff as complete.",
    });
  }
  if (args.unresolvedTensionRefs.length > 0) {
    holdTraces.push({
      hold_id: `hold:${args.targetKind}:${targetSegment}:tension`,
      hold_mode: "anticipatory_stop",
      trigger_refs: uniqueSorted(args.unresolvedTensionRefs),
      source_refs: sourceRefs,
      why_now: "Unresolved tensions remain visible for operator review.",
      review_cue: "Review unresolved tensions before continuing the handoff.",
    });
  }
  if (mismatchDeltas.length > 0) {
    holdTraces.push({
      hold_id: `hold:${args.targetKind}:${targetSegment}:repair`,
      hold_mode: "reactive_repair",
      trigger_refs: uniqueSorted(mismatchDeltas.map((delta) => delta.delta_id)),
      source_refs: sourceRefs,
      why_now: "Expected and observed preview inputs differ.",
      review_cue: "Review mismatched refs before continuing.",
    });
  }
  if (normalizedStatus === "blocked") {
    holdTraces.push({
      hold_id: `hold:${args.targetKind}:${targetSegment}:blocked`,
      hold_mode: "operator_decision_required",
      trigger_refs: ["status_hint:blocked"],
      source_refs: sourceRefs,
      why_now: "The preview status is blocked.",
      review_cue: "Ask the operator to resolve the blocking condition.",
    });
  }
  if (normalizedStatus === "partial" || normalizedStatus === "needs_review") {
    holdTraces.push({
      hold_id: `hold:${args.targetKind}:${targetSegment}:bounded-continue`,
      hold_mode: "bounded_continue",
      trigger_refs: [`status_hint:${normalizedStatus}`],
      source_refs: sourceRefs,
      why_now: "The preview can continue only as bounded review context.",
      review_cue: "Continue review without treating the handoff as complete.",
    });
  }
  return holdTraces;
}

function classifyNotDone(args: {
  expectedFiles: string[];
  observedFiles: string[];
  expectedChecks: string[];
  observedChecks: string[];
  deltas: TemporalExpectedObservedDeltaPreview[];
  statusHint?: string;
}): TemporalNotDonePreview {
  const normalizedStatus = normalizeStatusHint(args.statusHint);
  if (normalizedStatus) {
    return notDoneFromClassification(
      normalizedStatus,
      args,
      `Status hint classifies this preview as ${normalizedStatus}.`,
    );
  }
  const expectedRefs = [...args.expectedFiles, ...args.expectedChecks];
  const observedRefs = [...args.observedFiles, ...args.observedChecks];
  const missingRefs = args.deltas.flatMap((delta) => delta.missing_expected_refs);
  if (expectedRefs.length > 0 && observedRefs.length === 0) {
    return notDoneFromClassification(
      "not_started",
      args,
      "Expected refs exist, but no observed refs were supplied.",
    );
  }
  if (observedRefs.length > 0 && missingRefs.length > 0) {
    return notDoneFromClassification(
      "partial",
      args,
      "Some observed refs exist, but expected refs remain missing.",
    );
  }
  if (args.deltas.every((delta) => delta.delta_kind === "none")) {
    return notDoneFromClassification(
      "complete",
      args,
      "Expected and observed refs match in this diagnostic preview.",
    );
  }
  return notDoneFromClassification(
    "unknown",
    args,
    "The preview does not provide enough bounded status signal.",
  );
}

function notDoneFromClassification(
  classification: NotDoneClassification,
  args: {
    expectedFiles: string[];
    observedFiles: string[];
    expectedChecks: string[];
    observedChecks: string[];
    deltas: TemporalExpectedObservedDeltaPreview[];
  },
  reason: string,
): TemporalNotDonePreview {
  const missingExpectedRefs = uniqueSorted(
    args.deltas.flatMap((delta) => delta.missing_expected_refs),
  );
  return {
    classification,
    reason,
    expected_remaining_refs: missingExpectedRefs,
    blocking_refs: classification === "blocked" ? missingExpectedRefs : [],
  };
}

function buildReasonCodes(args: {
  expectedFiles: string[];
  observedFiles: string[];
  expectedChecks: string[];
  observedChecks: string[];
  sourceRefs: string[];
  unresolvedTensionRefs: string[];
  knowledgeGapRefs: string[];
  decisionHolds: TemporalDecisionHoldTracePreview[];
  deltas: TemporalExpectedObservedDeltaPreview[];
}): TemporalHandoffDiagnosticReasonCode[] {
  return uniqueSorted([
    args.expectedFiles.length > 0 ? "expected_files_present" : "expected_files_missing",
    args.observedFiles.length > 0 ? "observed_files_present" : "observed_files_missing",
    args.expectedChecks.length > 0 ? "expected_checks_present" : "expected_checks_missing",
    args.observedChecks.length > 0 ? "observed_checks_present" : "observed_checks_missing",
    args.deltas.every((delta) => delta.delta_kind === "none")
      ? "expected_observed_match"
      : "expected_observed_mismatch",
    args.sourceRefs.length > 0 ? "source_refs_present" : "source_refs_missing",
    ...(args.unresolvedTensionRefs.length > 0 ? ["unresolved_tension_present"] : []),
    ...(args.knowledgeGapRefs.length > 0 ? ["knowledge_gap_present"] : []),
    ...(args.decisionHolds.length > 0 ? ["decision_hold_present"] : []),
    "not_done_classified",
    "authority_boundary_preserved",
    "diagnostic_preview_not_execution",
  ] as TemporalHandoffDiagnosticReasonCode[]);
}

function normalizeTargetKind(value: string): TemporalHandoffTargetKind {
  const normalized = value.toLowerCase();
  if (normalized === "ai_context_packet") return "ai_context_packet";
  if (normalized === "codex_handoff_draft" || normalized === "handoff") {
    return "codex_handoff_draft";
  }
  if (normalized === "human_review_packet") return "human_review_packet";
  if (normalized === "dogfooding_review_packet") return "dogfooding_review_packet";
  return "unknown";
}

function normalizeStatusHint(value?: string): NotDoneClassification | undefined {
  const normalized = (value ?? "").toLowerCase();
  if (normalized === "complete") return "complete";
  if (normalized === "blocked") return "blocked";
  if (normalized === "partial") return "partial";
  if (normalized === "out_of_scope") return "out_of_scope";
  if (normalized === "needs_review") return "needs_review";
  return undefined;
}

function isAuthorityBoundaryConfusingNote(note: string): boolean {
  const normalized = normalizeAuthorityBoundaryNote(note);
  if (isSafeAuthorityBoundaryDenial(normalized)) return false;
  return containsAuthorityGrantLikePhrase(normalized);
}

function normalizeAuthorityBoundaryNote(note: string): string {
  return note.toLowerCase().replace(/\s+/g, " ").trim();
}

function isSafeAuthorityBoundaryDenial(normalizedNote: string): boolean {
  if (
    /product[- ]write remains parked/.test(normalizedNote) ||
    /parked by #686/.test(normalizedNote)
  ) {
    return true;
  }
  if (/product_write_authority\s*:?\s*false/.test(normalizedNote)) {
    return true;
  }
  if (/does not write product records/.test(normalizedNote)) return true;
  return /\b(no|not)\s+(execution|approval|automation|pr creation|branch creation|product[- ]write|product records|product_write_authority)\b/.test(
    normalizedNote,
  );
}

function containsAuthorityGrantLikePhrase(normalizedNote: string): boolean {
  return /approval|execution|automation|pr creation|branch creation|product[- ]write|product records|product_write_authority/.test(
    normalizedNote,
  );
}

function reviewNoteForDelta(deltaKind: ExpectedObservedDeltaKind): string {
  if (deltaKind === "none") {
    return "Expected and observed refs match for this diagnostic preview.";
  }
  if (deltaKind === "omission") {
    return "Expected refs are missing from the observed preview.";
  }
  if (deltaKind === "unexpected_change") {
    return "Observed refs include unexpected preview material.";
  }
  if (deltaKind === "validation_mismatch") {
    return "Expected and observed validation refs differ.";
  }
  if (deltaKind === "authority_boundary_mismatch") {
    return "Authority boundary wording needs operator review.";
  }
  return "Expected and observed preview inputs differ.";
}

function reliabilityPreview(
  sourceRefs: string[],
  refs: string[],
): TemporalExpectedObservedDeltaPreview["reliability_preview"] {
  if (sourceRefs.length > 0 && refs.length > 0) return "high";
  if (refs.length > 0) return "medium";
  return "low";
}

function validateAuthorityBoundary(
  boundary: TemporalHandoffDiagnosticAuthorityBoundary,
  label: string,
): string[] {
  const failureCodes: string[] = [];
  if (boundary?.diagnostic_preview_only !== true) {
    failureCodes.push(`${label}:diagnostic_preview_only_not_true`);
  }
  for (const field of forbiddenAuthorityFields) {
    if (boundary?.[field] !== false) failureCodes.push(`${label}:${field}_not_false`);
  }
  return failureCodes;
}

function sectionTextHasForbiddenAuthority(section: TemporalHandoffDiagnosticSections): boolean {
  return [
    ...section.expected_observed_deltas.map((delta) => delta.review_note),
    ...section.decision_hold_traces.flatMap((trace) => [trace.why_now, trace.review_cue]),
    section.not_done.reason,
  ].some((value) => forbiddenOutputTextPattern.test(value));
}

function compareSections(
  left: TemporalHandoffDiagnosticSections,
  right: TemporalHandoffDiagnosticSections,
): number {
  return (
    left.target_kind.localeCompare(right.target_kind) ||
    left.target_ref.localeCompare(right.target_ref)
  );
}

function compareDeltas(
  left: TemporalExpectedObservedDeltaPreview,
  right: TemporalExpectedObservedDeltaPreview,
): number {
  return (
    left.delta_kind.localeCompare(right.delta_kind) ||
    left.delta_id.localeCompare(right.delta_id)
  );
}

function compareDecisionHolds(
  left: TemporalDecisionHoldTracePreview,
  right: TemporalDecisionHoldTracePreview,
): number {
  return (
    left.hold_mode.localeCompare(right.hold_mode) ||
    left.hold_id.localeCompare(right.hold_id)
  );
}

function countByValues<T extends string>(values: T[], observed: T[]): Record<T, number> {
  const counts = Object.fromEntries(values.map((value) => [value, 0])) as Record<T, number>;
  for (const value of observed) counts[value] += 1;
  return counts;
}

function difference(left: string[], right: string[]): string[] {
  const rightSet = new Set(right);
  return uniqueSorted(left.filter((value) => !rightSet.has(value)));
}

function uniqueSorted<T extends string>(values: T[]): T[] {
  return Array.from(new Set(values)).sort();
}

function sanitizeIdSegment(value: string): string {
  const sanitized = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
  return sanitized || "unknown";
}

function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map((item) => canonicalJson(item)).join(",")}]`;
  }
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return `{${Object.keys(record)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonicalJson(record[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}
