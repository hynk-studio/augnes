import type {
  ResearchCandidateManualNoteExpectedObservedDeltaDraftStatus,
  ResearchCandidateManualNoteHandoffResultIntake,
  ResearchCandidateManualNoteHandoffResultIntakeAuthorityBoundary,
  ResearchCandidateManualNoteHandoffResultIntakeInput,
  ResearchCandidateManualNoteHandoffResultIntakeValidation,
  ResearchCandidateManualNoteParsedResultSummary,
  ResearchCandidateManualNoteReuseOutcomeLabel,
  ResearchCandidateManualNoteVerificationItem,
} from "@/types/research-candidate-manual-note-handoff-result-intake";

type ParsedReport = {
  text_present: boolean;
  field_values: Map<string, string[]>;
  sections: Map<string, string[]>;
  section_present: Set<string>;
  ambiguous_combined_section_lines: string[];
  candidate_context_outcome_line: string | null;
  unsupported_candidate_context_outcome_line: string | null;
};

type ParsedCoverageProbe = {
  present: boolean;
  evidence: string[];
};

const intakeKind = "research_candidate_manual_note_handoff_result_intake" as const;
const intakeVersion =
  "research_candidate_manual_note_handoff_result_intake.v0.1" as const;
const nextRecommendedSlice =
  "manual_research_candidate_handoff_result_intake_operator_review_v0_1" as const;
const allowedReuseOutcomeLabels = [
  "helpful",
  "stale",
  "missing",
  "noisy",
  "misleading",
] as const satisfies readonly ResearchCandidateManualNoteReuseOutcomeLabel[];

const sectionAliases: Record<string, string> = {
  summary: "summary",
  result_summary: "summary",
  files_changed: "changed_files",
  changed_file: "changed_files",
  changed_files: "changed_files",
  files_changed_summary: "changed_files",
  verification: "verification_run",
  verification_run: "verification_run",
  verification_runs: "verification_run",
  verification_run_results: "verification_run",
  checks: "verification_run",
  checks_run: "verification_run",
  skipped_check: "skipped_checks",
  skipped_checks: "skipped_checks",
  skipped_checks_with_concrete_reasons: "skipped_checks",
  skipped_checks_and_reasons: "skipped_checks",
  skipped_checks_with_reasons: "skipped_checks",
  remaining_friction: "remaining_friction",
  remaining_caveats: "remaining_friction",
  remaining_risk: "remaining_friction",
  remaining_risks: "remaining_friction",
  caveats: "remaining_friction",
  observed_outcome: "observed_outcome",
  observed_result: "observed_outcome",
  observed_result_summary: "observed_outcome",
  outcome: "observed_outcome",
  expected_vs_observed: "expected_vs_observed_delta_summary",
  expected_observed_delta: "expected_vs_observed_delta_summary",
  expected_vs_observed_delta: "expected_vs_observed_delta_summary",
  expected_vs_observed_delta_summary: "expected_vs_observed_delta_summary",
  selected_candidate_context: "selected_candidate_context_outcome",
  selected_candidate_context_outcome: "selected_candidate_context_outcome",
  selected_candidate_context_feedback: "selected_candidate_context_outcome",
  whether_selected_candidate_context_was_helpful_stale_missing_noisy_misleading:
    "selected_candidate_context_outcome",
  context_feedback: "selected_candidate_context_outcome",
  candidate_context_feedback: "selected_candidate_context_outcome",
  authority_boundary: "authority_boundary",
  authority_boundary_statement: "authority_boundary",
  proof_evidence_rows_written: "proof_evidence_rows_written",
  proof_or_evidence_rows_written: "proof_evidence_rows_written",
  event_rows_created_or_mutated: "event_rows_created_or_mutated",
  work_status_changed: "work_status_changed",
  state_committed_or_rejected: "state_committed_or_rejected",
  live_host_observation: "live_host_observation",
  result_status: "result_status",
  status: "result_status",
  pr_url: "pr_url",
  pr_number: "pr_number",
};

export function buildResearchCandidateManualNoteHandoffResultIntake(
  input: ResearchCandidateManualNoteHandoffResultIntakeInput,
): ResearchCandidateManualNoteHandoffResultIntake {
  const seed = input.handoff_seed;
  const reportText = input.codex_result_report_text ?? "";
  const parsed = parseCodexResultReportText(reportText);
  const parsedResultSummary = buildParsedResultSummary(parsed, reportText);
  const changedFiles = extractChangedFiles(parsed);
  const verificationItems = extractVerificationItems(parsed);
  const skippedChecks = extractPlainItems(parsed, [
    "skipped_checks",
    "skipped checks",
    "skipped checks with concrete reasons",
  ]).filter((item) => !isNoneLike(item));
  const remainingFriction = extractPlainItems(parsed, [
    "remaining_friction",
    "remaining friction",
    "remaining caveats",
  ]).filter((item) => !isNoneLike(item));
  const expectedReturnFieldCoverage = seed.expected_return_report_fields.map(
    (field) => ({
      field,
      ...probeExpectedReturnField(field, parsed, {
        changedFiles,
        verificationItems,
        skippedChecks,
        remainingFriction,
        parsedResultSummary,
      }),
    }),
  );
  const missingRequiredReturnFields = expectedReturnFieldCoverage
    .filter((coverage) => !coverage.present)
    .map((coverage) => coverage.field);
  const expectedObservedDeltaDraft = buildExpectedObservedDeltaDraft({
    expectedSummary:
      seed.expected_observed_delta_seed.expected_delta_summary,
    observedSummary:
      parsedResultSummary.expected_vs_observed_delta_summary ??
      parsedResultSummary.observed_outcome,
    reportPresent: parsed.text_present,
  });
  const reuseOutcomeDraft = buildReuseOutcomeDraft({
    seed,
    parsed,
    parsedResultSummary,
  });
  const authorityBoundaryFindings = buildAuthorityBoundaryFindings({
    parsed,
    parsedResultSummary,
  });
  const warningReasons = uniqueSorted([
    ...missingRequiredReturnFields.map((field) => `missing_return_field:${field}`),
    ...reuseOutcomeDraft.warning_reasons,
    ...(parsed.unsupported_candidate_context_outcome_line
      ? ["unsupported_reuse_outcome_label"]
      : []),
    ...authorityBoundaryFindings.forbidden_side_effect_claims.map(
      (claim) => `result_report_claims_forbidden_side_effect:${claim}`,
    ),
    ...(parsed.ambiguous_combined_section_lines.length > 0
      ? ["ambiguous_combined_section_lines_present"]
      : []),
  ]);
  const stopConditions = buildStopConditions({
    reportPresent: parsed.text_present,
    missingRequiredReturnFields,
    forbiddenSideEffectClaims:
      authorityBoundaryFindings.forbidden_side_effect_claims,
  });
  const authorityBoundary =
    getResearchCandidateManualNoteHandoffResultIntakeAuthorityBoundary();
  const validation = validateResearchCandidateManualNoteHandoffResultIntake({
    reportPresent: parsed.text_present,
    missingRequiredReturnFields,
    authorityBoundary,
  });

  return {
    intake_kind: intakeKind,
    intake_version: intakeVersion,
    scope: seed.scope,
    source_handoff_seed_fingerprint: seed.seed_fingerprint,
    source_handoff_seed_ref: `${seed.seed_version}:${seed.seed_fingerprint}`,
    source_preview_session_id: seed.source_preview_session_id,
    source_refs: uniqueSorted(seed.source_refs),
    result_text_fingerprint: createResearchCandidateManualNoteResultTextFingerprint(
      reportText,
    ),
    fingerprint_algorithm: "fnv1a32_text_v0_1",
    source_metadata: {
      result_source: input.source_metadata?.result_source ?? "local_paste",
      pasted_at: input.source_metadata?.pasted_at ?? null,
      operator_note: input.source_metadata?.operator_note ?? null,
    },
    parsed_result_summary: parsedResultSummary,
    changed_files: changedFiles,
    verification_items: verificationItems,
    skipped_checks: skippedChecks,
    remaining_friction: remainingFriction,
    authority_boundary_findings: authorityBoundaryFindings,
    expected_return_field_coverage: expectedReturnFieldCoverage,
    expected_observed_delta_draft: expectedObservedDeltaDraft,
    reuse_outcome_draft: reuseOutcomeDraft,
    missing_required_return_fields: missingRequiredReturnFields,
    warning_reasons: warningReasons,
    stop_conditions: stopConditions,
    authority_boundary: authorityBoundary,
    validation,
    recommendation_status: !parsed.text_present
      ? "blocked_missing_result_report"
      : missingRequiredReturnFields.length > 0
        ? "blocked_missing_required_return_fields"
        : "ready_for_operator_review",
    next_recommended_slice: nextRecommendedSlice,
  };
}

export function createResearchCandidateManualNoteResultTextFingerprint(
  value: string,
): string {
  return `fnv1a32:${fnv1a32(normalizeReportText(value))}`;
}

export function getResearchCandidateManualNoteHandoffResultIntakeAuthorityBoundary(): ResearchCandidateManualNoteHandoffResultIntakeAuthorityBoundary {
  return {
    candidate_only: true,
    preview_only: true,
    local_parse_only: true,
    source_of_truth: false,
    can_write_db: false,
    can_record_proof: false,
    can_create_evidence: false,
    can_update_work: false,
    can_commit_or_reject_state: false,
    can_promote_perspective: false,
    can_create_work_item: false,
    can_call_github: false,
    can_execute_codex: false,
    can_call_providers_or_openai: false,
    can_fetch_sources: false,
    can_run_retrieval_rag_embeddings_vector_fts_or_crawler: false,
    can_send_external_handoff: false,
    can_allocate_product_ids: false,
    can_execute_product_write: false,
  };
}

function parseCodexResultReportText(reportText: string): ParsedReport {
  const fieldValues = new Map<string, string[]>();
  const sections = new Map<string, string[]>();
  const sectionPresent = new Set<string>();
  const ambiguousCombinedSectionLines: string[] = [];
  const lines = normalizeReportText(reportText).split("\n");
  let activeSection: string | null = null;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    const expectedFieldMentionCount = [
      "changed files",
      "verification",
      "skipped checks",
      "observed outcome",
      "remaining friction",
      "selected candidate context",
      "expected vs observed",
    ].filter((phrase) => line.toLowerCase().includes(phrase)).length;
    if (expectedFieldMentionCount >= 2) {
      ambiguousCombinedSectionLines.push(line);
    }

    const heading = parseHeading(line);
    if (heading) {
      activeSection = heading;
      sectionPresent.add(activeSection);
      continue;
    }

    const field = parseFieldLine(line);
    if (field) {
      appendMapValue(fieldValues, field.key, field.value);
      if (field.value) {
        appendMapValue(sections, field.key, field.value);
      }
      sectionPresent.add(field.key);
      activeSection = field.key;
      continue;
    }

    if (activeSection) {
      appendMapValue(sections, activeSection, cleanListItem(line));
    }
  }

  const candidateContextOutcomeLine = firstNonEmpty([
    ...valuesFor(fieldValues, "selected_candidate_context_outcome"),
    ...valuesFor(sections, "selected_candidate_context_outcome"),
    ...lines.filter((line) =>
      /selected candidate context|candidate context|context feedback/i.test(line),
    ),
  ]);
  const unsupportedCandidateContextOutcomeLine =
    candidateContextOutcomeLine &&
    !findReuseOutcomeLabels(candidateContextOutcomeLine).length
      ? candidateContextOutcomeLine
      : null;

  return {
    text_present: reportText.trim().length > 0,
    field_values: fieldValues,
    sections,
    section_present: sectionPresent,
    ambiguous_combined_section_lines: uniqueSorted(ambiguousCombinedSectionLines),
    candidate_context_outcome_line: candidateContextOutcomeLine,
    unsupported_candidate_context_outcome_line:
      unsupportedCandidateContextOutcomeLine,
  };
}

function buildParsedResultSummary(
  parsed: ParsedReport,
  reportText: string,
): ResearchCandidateManualNoteParsedResultSummary {
  const prUrl = firstNonEmpty([
    firstFieldValue(parsed, "pr_url"),
    reportText.match(/https:\/\/github\.com\/[^\s)]+\/pull\/\d+/)?.[0] ?? null,
  ]);
  return {
    result_status: firstFieldValue(parsed, "result_status"),
    pr_url: prUrl,
    pr_number: parsePrNumber({
      prNumberField: firstFieldValue(parsed, "pr_number"),
      prUrl,
      reportText,
    }),
    observed_outcome:
      firstFieldValue(parsed, "observed_outcome") ??
      firstSectionText(parsed, "observed_outcome"),
    live_host_observation:
      firstFieldValue(parsed, "live_host_observation") ??
      firstSectionText(parsed, "live_host_observation"),
    proof_evidence_rows_written: parseBooleanClaim(
      firstFieldValue(parsed, "proof_evidence_rows_written"),
    ),
    event_rows_created_or_mutated: parseBooleanClaim(
      firstFieldValue(parsed, "event_rows_created_or_mutated"),
    ),
    work_status_changed: parseBooleanClaim(
      firstFieldValue(parsed, "work_status_changed"),
    ),
    state_committed_or_rejected: parseBooleanClaim(
      firstFieldValue(parsed, "state_committed_or_rejected"),
    ),
    expected_vs_observed_delta_summary:
      firstFieldValue(parsed, "expected_vs_observed_delta_summary") ??
      firstSectionText(parsed, "expected_vs_observed_delta_summary"),
    selected_candidate_context_outcome: parseReuseOutcomeLabel(
      parsed.candidate_context_outcome_line,
    ),
    ambiguous_combined_section_lines:
      parsed.ambiguous_combined_section_lines,
  };
}

function buildExpectedObservedDeltaDraft({
  expectedSummary,
  observedSummary,
  reportPresent,
}: {
  expectedSummary: string;
  observedSummary: string | null;
  reportPresent: boolean;
}) {
  const status: ResearchCandidateManualNoteExpectedObservedDeltaDraftStatus =
    !reportPresent
      ? "blocked_missing_result_report"
      : !expectedSummary.trim()
        ? "blocked_missing_expected_observed_delta"
        : !observedSummary?.trim()
          ? "blocked_missing_observed_outcome"
          : "ready_for_operator_review";
  const mismatchOrGapSummary =
    status === "ready_for_operator_review"
      ? "Expected and observed summaries are both present for human review."
      : status === "blocked_missing_result_report"
        ? "No pasted Codex result report was supplied."
        : status === "blocked_missing_expected_observed_delta"
          ? "The source handoff seed did not include an expected delta summary."
          : "The pasted result report did not supply an observed outcome or expected vs observed delta summary.";

  return {
    draft_kind: "research_candidate_manual_note_expected_observed_delta_draft" as const,
    expected_summary: expectedSummary,
    observed_summary: observedSummary,
    mismatch_or_gap_summary: mismatchOrGapSummary,
    status,
    draft_only: true as const,
    source_of_truth: false as const,
    creates_record: false as const,
    creates_proof_or_evidence: false as const,
    approves_or_commits_state: false as const,
  };
}

function buildReuseOutcomeDraft({
  seed,
  parsed,
  parsedResultSummary,
}: {
  seed: ResearchCandidateManualNoteHandoffResultIntakeInput["handoff_seed"];
  parsed: ParsedReport;
  parsedResultSummary: ResearchCandidateManualNoteParsedResultSummary;
}) {
  const labels = findReuseOutcomeLabels(parsed.candidate_context_outcome_line);
  const warningReasons = uniqueSorted([
    ...(!parsed.candidate_context_outcome_line
      ? ["missing_reuse_outcome"]
      : []),
    ...(parsed.candidate_context_outcome_line && labels.length === 0
      ? ["unsupported_reuse_outcome"]
      : []),
    ...(labels.length > 1 ? ["ambiguous_reuse_outcome"] : []),
  ]);

  return {
    draft_kind: "research_candidate_manual_note_reuse_outcome_draft" as const,
    selected_candidate_context_refs:
      seed.expected_observed_delta_seed.candidate_context_refs,
    outcome_label: parsedResultSummary.selected_candidate_context_outcome,
    source_line: parsed.candidate_context_outcome_line,
    warning_reasons: warningReasons,
    draft_only: true as const,
    source_of_truth: false as const,
    writes_ledger: false as const,
    updates_salience: false as const,
    activates_perspective: false as const,
  };
}

function validateResearchCandidateManualNoteHandoffResultIntake({
  reportPresent,
  missingRequiredReturnFields,
  authorityBoundary,
}: {
  reportPresent: boolean;
  missingRequiredReturnFields: string[];
  authorityBoundary: ResearchCandidateManualNoteHandoffResultIntakeAuthorityBoundary;
}): ResearchCandidateManualNoteHandoffResultIntakeValidation {
  const failureCodes = uniqueSorted([
    ...(!reportPresent ? ["result_report_missing"] : []),
    ...missingRequiredReturnFields.map((field) => `required_return_field_missing:${field}`),
    ...(!authorityBoundaryIsSafe(authorityBoundary)
      ? ["authority_boundary_forbidden_capability_enabled"]
      : []),
  ]);

  return {
    passed: failureCodes.length === 0,
    failure_codes: failureCodes,
    result_report_present: reportPresent,
    deterministic_browser_safe: true,
    raw_result_text_retained: false,
    authority_boundary_safe: authorityBoundaryIsSafe(authorityBoundary),
    required_return_fields_present: missingRequiredReturnFields.length === 0,
  };
}

function probeExpectedReturnField(
  field: string,
  parsed: ParsedReport,
  context: {
    changedFiles: string[];
    verificationItems: ResearchCandidateManualNoteVerificationItem[];
    skippedChecks: string[];
    remainingFriction: string[];
    parsedResultSummary: ResearchCandidateManualNoteParsedResultSummary;
  },
): ParsedCoverageProbe {
  const normalizedField = canonicalKey(field);
  if (normalizedField === "changed_files") {
    return {
      present: context.changedFiles.length > 0,
      evidence: context.changedFiles,
    };
  }
  if (normalizedField === "verification_run") {
    return {
      present: context.verificationItems.length > 0,
      evidence: context.verificationItems.map((item) => item.item_text),
    };
  }
  if (normalizedField === "skipped_checks") {
    return {
      present:
        sectionOrFieldPresent(parsed, "skipped_checks") ||
        context.skippedChecks.length > 0,
      evidence:
        context.skippedChecks.length > 0
          ? context.skippedChecks
          : valuesFor(parsed.field_values, "skipped_checks"),
    };
  }
  if (normalizedField === "observed_outcome") {
    return {
      present: Boolean(context.parsedResultSummary.observed_outcome),
      evidence: compact([context.parsedResultSummary.observed_outcome]),
    };
  }
  if (normalizedField === "remaining_friction") {
    return {
      present:
        sectionOrFieldPresent(parsed, "remaining_friction") ||
        context.remainingFriction.length > 0,
      evidence:
        context.remainingFriction.length > 0
          ? context.remainingFriction
          : valuesFor(parsed.field_values, "remaining_friction"),
    };
  }
  if (normalizedField === "selected_candidate_context_outcome") {
    return {
      present:
        context.parsedResultSummary.selected_candidate_context_outcome !==
        "not_reported",
      evidence: compact([parsed.candidate_context_outcome_line]),
    };
  }
  if (normalizedField === "expected_vs_observed_delta_summary") {
    return {
      present: Boolean(
        context.parsedResultSummary.expected_vs_observed_delta_summary,
      ),
      evidence: compact([
        context.parsedResultSummary.expected_vs_observed_delta_summary,
      ]),
    };
  }

  return {
    present: sectionOrFieldPresent(parsed, normalizedField),
    evidence: [
      ...valuesFor(parsed.field_values, normalizedField),
      ...valuesFor(parsed.sections, normalizedField),
    ],
  };
}

function buildAuthorityBoundaryFindings({
  parsed,
  parsedResultSummary,
}: {
  parsed: ParsedReport;
  parsedResultSummary: ResearchCandidateManualNoteParsedResultSummary;
}) {
  return {
    boundary_statement_present: sectionOrFieldPresent(parsed, "authority_boundary"),
    pr_url_reported: Boolean(parsedResultSummary.pr_url),
    pr_url_is_not_requirement_completion: true as const,
    verification_is_not_proof_or_evidence: true as const,
    forbidden_side_effect_claims: uniqueSorted([
      ...(parsedResultSummary.proof_evidence_rows_written === true
        ? ["proof_evidence_rows_written"]
        : []),
      ...(parsedResultSummary.event_rows_created_or_mutated === true
        ? ["event_rows_created_or_mutated"]
        : []),
      ...(parsedResultSummary.work_status_changed === true
        ? ["work_status_changed"]
        : []),
      ...(parsedResultSummary.state_committed_or_rejected === true
        ? ["state_committed_or_rejected"]
        : []),
    ]),
  };
}

function buildStopConditions({
  reportPresent,
  missingRequiredReturnFields,
  forbiddenSideEffectClaims,
}: {
  reportPresent: boolean;
  missingRequiredReturnFields: string[];
  forbiddenSideEffectClaims: string[];
}) {
  return uniqueSorted([
    ...(!reportPresent ? ["pasted_result_report_text_missing"] : []),
    ...(missingRequiredReturnFields.length > 0
      ? ["required_return_fields_missing"]
      : []),
    ...(forbiddenSideEffectClaims.length > 0
      ? ["pasted_result_report_claims_forbidden_side_effects"]
      : []),
    "operator_review_required_before_any_record_write",
    "result_intake_preview_must_remain_local_only",
  ]);
}

function extractChangedFiles(parsed: ParsedReport): string[] {
  return uniqueSorted(
    extractPlainItems(parsed, ["changed_files", "changed files"])
      .flatMap(splitInlineList)
      .map((item) => item.replace(/^`|`$/g, "").trim())
      .filter((item) => item.length > 0 && !isNoneLike(item)),
  );
}

function extractVerificationItems(
  parsed: ParsedReport,
): ResearchCandidateManualNoteVerificationItem[] {
  return extractPlainItems(parsed, ["verification_run", "verification", "checks"])
    .filter((item) => !isNoneLike(item))
    .map((item) => ({
      item_text: item,
      command: extractCommand(item),
      status: detectVerificationStatus(item),
    }));
}

function extractPlainItems(parsed: ParsedReport, keys: string[]) {
  const canonicalKeys = keys.map(canonicalKey);
  return uniqueSorted(
    canonicalKeys.flatMap((key) => [
      ...valuesFor(parsed.field_values, key).flatMap(splitInlineList),
      ...valuesFor(parsed.sections, key),
    ]).map(cleanListItem),
  ).filter(Boolean);
}

function parseHeading(line: string): string | null {
  const markdownHeading = line.match(/^#{1,6}\s+(.+?)\s*#*$/);
  const candidate = markdownHeading
    ? markdownHeading[1]
    : !line.includes(":") && line.length <= 90
      ? line
      : null;
  if (!candidate) return null;
  const key = canonicalKey(candidate);
  return Object.values(sectionAliases).includes(key) ? key : null;
}

function parseFieldLine(line: string): { key: string; value: string } | null {
  const cleanLine = line.replace(/^[-*]\s+/, "").trim();
  const match = cleanLine.match(/^([A-Za-z][A-Za-z0-9 _/().-]{1,90}):\s*(.*)$/);
  if (!match) return null;
  const key = canonicalKey(match[1]);
  if (!Object.values(sectionAliases).includes(key)) return null;
  return {
    key,
    value: match[2].trim(),
  };
}

function parsePrNumber({
  prNumberField,
  prUrl,
  reportText,
}: {
  prNumberField: string | null;
  prUrl: string | null;
  reportText: string;
}) {
  const parsedField = prNumberField?.match(/\d+/)?.[0];
  const parsedUrl = prUrl?.match(/\/pull\/(\d+)/)?.[1];
  const parsedLoose = reportText.match(/\bPR\s*#?(\d+)\b/i)?.[1];
  const value = parsedField ?? parsedUrl ?? parsedLoose;
  return value ? Number(value) : null;
}

function parseBooleanClaim(value: string | null): boolean | null {
  if (!value) return null;
  const normalized = value.toLowerCase();
  if (/\b(no|none|false|0|not|did not|without|skipped)\b/.test(normalized)) {
    return false;
  }
  if (/\b(yes|true|1|written|created|mutated|changed|committed|rejected)\b/.test(normalized)) {
    return true;
  }
  return null;
}

function parseReuseOutcomeLabel(
  line: string | null,
): ResearchCandidateManualNoteReuseOutcomeLabel {
  return findReuseOutcomeLabels(line)[0] ?? "not_reported";
}

function findReuseOutcomeLabels(
  line: string | null,
): ResearchCandidateManualNoteReuseOutcomeLabel[] {
  if (!line) return [];
  const normalized = line.toLowerCase();
  return allowedReuseOutcomeLabels.filter((label) =>
    new RegExp(`\\b${label}\\b`, "i").test(normalized),
  );
}

function detectVerificationStatus(
  item: string,
): ResearchCandidateManualNoteVerificationItem["status"] {
  if (/\b(fail|failed|failure|error)\b/i.test(item)) return "failed";
  if (/\b(skip|skipped|not run|unavailable|missing)\b/i.test(item)) {
    return "skipped";
  }
  if (/\b(pass|passed|success|ok|green)\b/i.test(item)) return "passed";
  return "reported";
}

function extractCommand(item: string): string | null {
  return item.match(/`([^`]+)`/)?.[1] ?? item.match(/\b(npm|node|git)\s+[^\n;]+/)?.[0] ?? null;
}

function firstFieldValue(parsed: ParsedReport, key: string) {
  return firstNonEmpty(valuesFor(parsed.field_values, canonicalKey(key)));
}

function firstSectionText(parsed: ParsedReport, key: string) {
  const values = valuesFor(parsed.sections, canonicalKey(key)).filter(
    (value) => !isNoneLike(value),
  );
  return values.length > 0 ? values.join(" ").trim() : null;
}

function sectionOrFieldPresent(parsed: ParsedReport, key: string) {
  const canonical = canonicalKey(key);
  return (
    parsed.section_present.has(canonical) ||
    valuesFor(parsed.field_values, canonical).length > 0 ||
    valuesFor(parsed.sections, canonical).length > 0
  );
}

function canonicalKey(value: string): string {
  const normalized = value
    .replace(/[`*_]/g, " ")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return sectionAliases[normalized] ?? normalized;
}

function cleanListItem(value: string): string {
  return value
    .replace(/^[-*]\s+/, "")
    .replace(/^\d+[.)]\s+/, "")
    .trim();
}

function splitInlineList(value: string): string[] {
  const cleaned = cleanListItem(value);
  if (!cleaned) return [];
  if (cleaned.includes(",") && !cleaned.includes("://")) {
    return cleaned.split(",").map((item) => item.trim()).filter(Boolean);
  }
  return [cleaned];
}

function firstNonEmpty(values: Array<string | null | undefined>) {
  return values.find((value) => value?.trim())?.trim() ?? null;
}

function compact(values: Array<string | null | undefined>) {
  return values.filter((value): value is string => Boolean(value?.trim()));
}

function valuesFor(map: Map<string, string[]>, key: string) {
  return map.get(canonicalKey(key)) ?? [];
}

function appendMapValue(map: Map<string, string[]>, key: string, value: string) {
  const canonical = canonicalKey(key);
  const cleanValue = cleanListItem(value);
  if (!cleanValue) return;
  const currentValues = map.get(canonical) ?? [];
  map.set(canonical, [...currentValues, cleanValue]);
}

function isNoneLike(value: string): boolean {
  return /^(none|n\/a|not applicable|not supplied|no skipped checks|no files changed|no remaining friction)$/i.test(
    value.trim(),
  );
}

function normalizeReportText(value: string): string {
  return value.replace(/\r\n?/g, "\n").trim();
}

function authorityBoundaryIsSafe(
  boundary: ResearchCandidateManualNoteHandoffResultIntakeAuthorityBoundary,
) {
  if (
    boundary.candidate_only !== true ||
    boundary.preview_only !== true ||
    boundary.local_parse_only !== true
  ) {
    return false;
  }

  return [
    boundary.source_of_truth,
    boundary.can_write_db,
    boundary.can_record_proof,
    boundary.can_create_evidence,
    boundary.can_update_work,
    boundary.can_commit_or_reject_state,
    boundary.can_promote_perspective,
    boundary.can_create_work_item,
    boundary.can_call_github,
    boundary.can_execute_codex,
    boundary.can_call_providers_or_openai,
    boundary.can_fetch_sources,
    boundary.can_run_retrieval_rag_embeddings_vector_fts_or_crawler,
    boundary.can_send_external_handoff,
    boundary.can_allocate_product_ids,
    boundary.can_execute_product_write,
  ].every((value) => value === false);
}

function uniqueSorted(values: readonly string[]) {
  return Array.from(new Set(values.filter(Boolean))).sort();
}

function fnv1a32(value: string): string {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}
