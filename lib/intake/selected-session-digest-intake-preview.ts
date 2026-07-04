import {
  SELECTED_SESSION_DIGEST_INTAKE_PREVIEW_VERSION,
  type SelectedSessionDigestExtractedPreview,
  type SelectedSessionDigestFutureIngestContractPreview,
  type SelectedSessionDigestIntakeAuthorityBoundary,
  type SelectedSessionDigestIntakeCandidate,
  type SelectedSessionDigestIntakeCandidateKind,
  type SelectedSessionDigestIntakeCandidateMaterial,
  type SelectedSessionDigestIntakePreview,
  type SelectedSessionDigestIntakePreviewInput,
  type SelectedSessionDigestIntakePreviewStatus,
  type SelectedSessionDigestIntakeReadiness,
  type SelectedSessionDigestIntakeRecommendedNextAction,
  type SelectedSessionDigestIntakeSourceStatus,
  type SelectedSessionDigestSourceKind,
} from "@/types/selected-session-digest-intake-preview";

export const SELECTED_SESSION_DIGEST_RAW_TEXT_MAX_LENGTH = 12000 as const;

const DEFAULT_SCOPE = "project:augnes" as const;
const FALLBACK_AS_OF = "1970-01-01T00:00:00.000Z" as const;

const knownSourceKinds = [
  "chatgpt_session_digest",
  "codex_session_digest",
  "project_history_digest",
  "research_note_digest",
  "manual_operator_digest",
] as const satisfies readonly SelectedSessionDigestSourceKind[];

type DigestStatus = SelectedSessionDigestIntakeSourceStatus["digest"];
type RawTextStatus = SelectedSessionDigestIntakeSourceStatus["raw_text"];
type RefInput = {
  label: string;
  values: Array<string | undefined>;
};

export function buildSelectedSessionDigestIntakePreviewV01({
  digest,
  raw_text,
  source_kind,
  source_ref,
  operator_ref,
  session_ref,
  project_ref,
  as_of,
  scope,
  source_refs,
}: SelectedSessionDigestIntakePreviewInput = {}): SelectedSessionDigestIntakePreview {
  const digestStatus = getDigestStatus(digest);
  const structuredDigest = isRecord(digest) ? digest : null;
  const effectiveRawText = raw_text ?? (typeof digest === "string" ? digest : undefined);
  const rawTextPreview = buildRawTextExtractedPreview(effectiveRawText);
  const normalizedSourceKind = normalizeSourceKind(source_kind);
  const resolvedSessionRef =
    session_ref ?? stringField(structuredDigest, "session_ref");
  const resolvedProjectRef =
    project_ref ?? stringField(structuredDigest, "project_ref");
  const structuredEvidenceRefs = stringArrayField(
    structuredDigest,
    "evidence_refs",
  );
  const structuredSourceRefs = stringArrayField(structuredDigest, "source_refs");
  const rawSourceRefTokens =
    rawTextPreview.extracted_preview.explicit_ref_like_tokens.filter((token) =>
      token.startsWith("source:"),
    );
  const rawEvidenceRefTokens =
    rawTextPreview.extracted_preview.explicit_ref_like_tokens.filter((token) =>
      token.startsWith("evidence:"),
    );
  const sourceRefValues = uniqueSortedStrings([
    ...(source_refs ?? []),
    ...structuredSourceRefs,
    ...rawSourceRefTokens,
    ...(source_ref ? [source_ref] : []),
  ]);
  const evidenceRefValues = uniqueSortedStrings([
    ...structuredEvidenceRefs,
    ...rawEvidenceRefTokens,
  ]);
  const rawUnsafeMarkers = detectRawTextUnsafeMarkers(rawTextPreview.raw_text);
  const unsafeRefReasons = buildUnsafeRefReasons([
    { label: "source_ref", values: [source_ref] },
    { label: "operator_ref", values: [operator_ref] },
    { label: "session_ref", values: [resolvedSessionRef] },
    { label: "project_ref", values: [resolvedProjectRef] },
    { label: "source_refs", values: sourceRefValues },
    { label: "evidence_ref", values: evidenceRefValues },
  ]);
  const rawTextStatus = getRawTextStatus(rawTextPreview, rawUnsafeMarkers);
  const safeSourceRefs = uniqueSortedStrings(
    sourceRefValues.filter(isPublicSafeRef),
  );
  const safeEvidenceRefs = uniqueSortedStrings(
    evidenceRefValues.filter(isPublicSafeRef),
  );
  const candidateBuildContext: CandidateBuildContext = {
    source_kind:
      normalizedSourceKind === "missing" ? "unknown" : normalizedSourceKind,
    source_ref: hasPublicSafeValue(source_ref)
      ? source_ref
      : "source_ref_missing_review_required",
    session_ref: hasPublicSafeValue(resolvedSessionRef)
      ? resolvedSessionRef
      : undefined,
    project_ref: hasPublicSafeValue(resolvedProjectRef)
      ? resolvedProjectRef
      : undefined,
    operator_ref: hasPublicSafeValue(operator_ref) ? operator_ref : undefined,
    evidence_refs: safeEvidenceRefs,
    source_refs: safeSourceRefs,
  };
  const candidateMaterial = mergeCandidateMaterial([
    buildStructuredDigestCandidateMaterial({
      digest: structuredDigest,
      context: candidateBuildContext,
    }),
    buildRawTextCandidateMaterial({
      extractedPreview: rawTextPreview.extracted_preview,
      rawTextStatus,
      context: candidateBuildContext,
    }),
  ]);
  const ingestableCandidateCount =
    countIngestableCandidates(candidateMaterial);
  const candidateCount = countCandidates(candidateMaterial);
  const sourceStatus = buildSourceStatus({
    digestStatus,
    rawTextStatus,
    normalizedSourceKind,
    source_ref,
    operator_ref,
  });
  const blockedReasons = buildBlockedReasons({
    rawTextStatus,
    unsafeRefReasons,
    rawUnsafeMarkers,
  });
  const missingEvidence = ingestableCandidateCount > 0 && safeEvidenceRefs.length === 0
    ? ["evidence_refs_missing_for_future_ingest_contract"]
    : [];
  const insufficientDataReasons = buildInsufficientDataReasons({
    digestStatus,
    rawTextStatus,
    normalizedSourceKind,
    source_ref,
    operator_ref,
    resolvedSessionRef,
    resolvedProjectRef,
    ingestableCandidateCount,
    candidateCount,
    missingEvidence,
  });
  const readiness = buildReadiness({
    normalizedSourceKind,
    source_ref,
    operator_ref,
    resolvedSessionRef,
    resolvedProjectRef,
    ingestableCandidateCount,
    blockedReasons,
    insufficientDataReasons,
    unsafeRefReasons,
    missingEvidence,
  });
  const intakePreviewStatus = determineIntakePreviewStatus({
    hasDigestOrRawText: hasDigestOrRawText({
      digestStatus,
      rawTextStatus,
    }),
    digestStatus,
    rawTextStatus,
    candidateCount,
    ingestableCandidateCount,
    readiness,
    blockedReasons,
  });
  const recommendedNextAction = determineRecommendedNextAction({
    intakePreviewStatus,
    readiness,
    source_ref,
    operator_ref,
    blockedReasons,
    ingestableCandidateCount,
  });
  const outputSourceRefs = buildOutputSourceRefs({
    source_refs: safeSourceRefs,
    extracted_preview: rawTextPreview.extracted_preview,
  });

  return {
    preview_version: SELECTED_SESSION_DIGEST_INTAKE_PREVIEW_VERSION,
    scope: scope ?? DEFAULT_SCOPE,
    as_of: as_of ?? stringField(structuredDigest, "created_at") ?? FALLBACK_AS_OF,
    source_refs: outputSourceRefs,
    intake_preview_status: intakePreviewStatus,
    recommended_next_action: recommendedNextAction,
    input_summary: {
      has_digest: digestStatus !== "missing",
      has_raw_text: rawTextStatus !== "missing",
      source_kind: normalizedSourceKind,
      source_ref_supplied: Boolean(source_ref?.trim()),
      operator_ref_supplied: Boolean(operator_ref?.trim()),
      session_ref_supplied: Boolean(resolvedSessionRef?.trim()),
      project_ref_supplied: Boolean(resolvedProjectRef?.trim()),
      raw_text_length: rawTextPreview.raw_text.length,
      raw_text_line_count: rawTextPreview.raw_text_line_count,
      candidate_count: candidateCount,
      source_ref_count: outputSourceRefs.length,
      evidence_ref_count: safeEvidenceRefs.length,
      unsafe_ref_count: unsafeRefReasons.length + rawUnsafeMarkers.length,
      missing_reason_count: insufficientDataReasons.length,
      blocked_reason_count: blockedReasons.length,
    },
    source_status: sourceStatus,
    candidate_material: candidateMaterial,
    extracted_preview: rawTextPreview.extracted_preview,
    future_ingest_contract_preview: buildFutureIngestContractPreview(),
    readiness,
    evidence_summary: {
      has_digest_or_raw_text: hasDigestOrRawText({
        digestStatus,
        rawTextStatus,
      }),
      has_candidate_material: ingestableCandidateCount > 0,
      has_source_refs: outputSourceRefs.length > 0,
      has_evidence_refs: safeEvidenceRefs.length > 0,
      has_operator_ref: isPublicSafeRef(operator_ref ?? ""),
      has_session_or_project_ref:
        isPublicSafeRef(resolvedSessionRef ?? "") ||
        isPublicSafeRef(resolvedProjectRef ?? ""),
      has_unsafe_refs: unsafeRefReasons.length + rawUnsafeMarkers.length > 0,
      has_missing_evidence: missingEvidence.length > 0,
      source_refs: outputSourceRefs,
      evidence_refs: safeEvidenceRefs,
      missing_evidence: missingEvidence,
      unsafe_refs: uniqueSortedStrings([
        ...unsafeRefReasons,
        ...rawUnsafeMarkers,
      ]),
    },
    blocked_reasons: blockedReasons,
    insufficient_data_reasons: insufficientDataReasons,
    unsafe_ref_reasons: uniqueSortedStrings([
      ...unsafeRefReasons,
      ...rawUnsafeMarkers,
    ]),
    privacy_review_notes: buildPrivacyReviewNotes(rawTextStatus),
    operator_review_checklist: buildOperatorReviewChecklist(),
    would_not_ingest: buildWouldNotIngest(),
    non_goals: buildNonGoals(),
    authority_boundary: createSelectedSessionDigestIntakeAuthorityBoundaryV01(),
  };
}

export function createSelectedSessionDigestIntakeAuthorityBoundaryV01(): SelectedSessionDigestIntakeAuthorityBoundary {
  return {
    read_only: true,
    advisory_only: true,
    source_of_truth: false,
    derived_read_model: true,
    can_write_db: false,
    can_create_schema: false,
    can_create_ingest_record: false,
    can_write_memory: false,
    can_mutate_memory: false,
    can_promote_memory: false,
    can_mutate_current_working_perspective: false,
    can_write_perspective_unit: false,
    can_write_next_work_bias: false,
    can_update_continuity_relay: false,
    can_mutate_handoff_context: false,
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
      "Selected session digest intake preview is read-only and advisory.",
      "It only previews manually supplied digest material for later operator review.",
      "Future durable ingest requires a separate reviewed contract and no-side-effects receipt.",
    ],
  };
}

type CandidateBuildContext = {
  source_kind: SelectedSessionDigestSourceKind;
  source_ref: string;
  session_ref?: string;
  project_ref?: string;
  operator_ref?: string;
  evidence_refs: string[];
  source_refs: string[];
};

type RawTextPreviewBuild = {
  raw_text: string;
  raw_text_line_count: number;
  extracted_preview: SelectedSessionDigestExtractedPreview;
};

function getDigestStatus(digest: unknown): DigestStatus {
  if (digest === undefined || digest === null) return "missing";
  return isRecord(digest) ? "supplied" : "malformed";
}

function normalizeSourceKind(
  sourceKind: unknown,
): SelectedSessionDigestSourceKind | "missing" {
  if (typeof sourceKind !== "string" || !sourceKind.trim()) return "missing";
  if (sourceKind === "unknown") return "unknown";
  return knownSourceKinds.includes(
    sourceKind as (typeof knownSourceKinds)[number],
  )
    ? (sourceKind as SelectedSessionDigestSourceKind)
    : "unknown";
}

function getRawTextStatus(
  rawTextPreview: RawTextPreviewBuild,
  rawUnsafeMarkers: string[],
): RawTextStatus {
  if (!rawTextPreview.raw_text) return "missing";
  if (rawTextPreview.raw_text.length > SELECTED_SESSION_DIGEST_RAW_TEXT_MAX_LENGTH) {
    return "too_large";
  }
  return rawUnsafeMarkers.length ? "unsafe" : "supplied";
}

function buildSourceStatus({
  digestStatus,
  rawTextStatus,
  normalizedSourceKind,
  source_ref,
  operator_ref,
}: {
  digestStatus: DigestStatus;
  rawTextStatus: RawTextStatus;
  normalizedSourceKind: SelectedSessionDigestSourceKind | "missing";
  source_ref?: string;
  operator_ref?: string;
}): SelectedSessionDigestIntakeSourceStatus {
  return {
    digest: digestStatus,
    raw_text: rawTextStatus,
    source_kind:
      normalizedSourceKind === "missing"
        ? "missing"
        : normalizedSourceKind === "unknown"
          ? "unknown"
          : "known",
    source_ref: refStatus(source_ref),
    operator_ref: refStatus(operator_ref),
    authority_boundary: "valid_read_only",
  };
}

function refStatus(
  value?: string,
): SelectedSessionDigestIntakeSourceStatus["source_ref"] {
  if (value === undefined || value === null || !value.trim()) return "missing";
  return isPublicSafeRef(value) ? "supplied" : "unsafe";
}

function buildRawTextExtractedPreview(rawText?: string): RawTextPreviewBuild {
  const trimmedText = typeof rawText === "string" ? rawText.trim() : "";
  const rawTextLineCount = trimmedText ? trimmedText.split(/\r?\n/).length : 0;
  if (!trimmedText) {
    return {
      raw_text: "",
      raw_text_line_count: 0,
      extracted_preview: {
        heading_lines: [],
        checklist_lines: [],
        explicit_ref_like_tokens: [],
        possible_dates: [],
        quoted_identifiers: [],
        review_notes: ["raw_text_missing_or_empty_after_trim"],
      },
    };
  }

  if (trimmedText.length > SELECTED_SESSION_DIGEST_RAW_TEXT_MAX_LENGTH) {
    return {
      raw_text: trimmedText,
      raw_text_line_count: rawTextLineCount,
      extracted_preview: {
        heading_lines: [],
        checklist_lines: [],
        explicit_ref_like_tokens: [],
        possible_dates: [],
        quoted_identifiers: [],
        review_notes: [
          "raw_text_over_max_length_not_extracted",
          "raw_text_extraction_is_deterministic_and_not_semantic_summary",
        ],
      },
    };
  }

  const lines = trimmedText.split(/\r?\n/);
  const headingLines = lines
    .filter((line) =>
      /^\s*(#{1,6}\s+\S|Title:|Summary:|Decisions:|Next:)/i.test(line),
    )
    .map(truncateSnippet);
  const checklistLines = lines
    .filter((line) =>
      /^\s*(- \[ \]|- \[x\]|\* \[ \]|TODO\b|Next\b)/i.test(line),
    )
    .map(truncateSnippet);
  const explicitRefLikeTokens = uniqueSortedStrings(
    Array.from(
      trimmedText.matchAll(
        /\b(?:session|project|source|evidence|decision|work|ref):[A-Za-z0-9._:/@#|=-]{1,120}\b/g,
      ),
      (match) => match[0],
    ).filter(isPublicSafeRef),
  );
  const possibleDates = uniqueSortedStrings(
    Array.from(
      trimmedText.matchAll(
        /\b\d{4}-\d{2}-\d{2}(?:[T ][0-9]{2}:[0-9]{2}(?::[0-9]{2}(?:\.[0-9]+)?)?(?:Z|[+-][0-9]{2}:?[0-9]{2})?)?\b/g,
      ),
      (match) => match[0],
    ),
  );
  const quotedIdentifiers = uniqueSortedStrings(
    Array.from(
      trimmedText.matchAll(/`([^`\n]{1,80})`|"([^"\n]{1,80})"|'([^'\n]{1,80})'/g),
      (match) => match[1] ?? match[2] ?? match[3] ?? "",
    )
      .map((value) => value.trim())
      .filter(Boolean)
      .map(truncateSnippet),
  );

  return {
    raw_text: trimmedText,
    raw_text_line_count: rawTextLineCount,
    extracted_preview: {
      heading_lines: uniqueSortedStrings(headingLines),
      checklist_lines: uniqueSortedStrings(checklistLines),
      explicit_ref_like_tokens: explicitRefLikeTokens,
      possible_dates: possibleDates,
      quoted_identifiers: quotedIdentifiers,
      review_notes: [
        "raw_text_extraction_is_deterministic_and_not_semantic_summary",
        "raw_text_candidates_require_operator_review",
      ],
    },
  };
}

function buildStructuredDigestCandidateMaterial({
  digest,
  context,
}: {
  digest: Record<string, unknown> | null;
  context: CandidateBuildContext;
}): SelectedSessionDigestIntakeCandidateMaterial {
  const material = emptyCandidateMaterial();
  if (!digest) return material;

  let index = 0;
  for (const value of [
    ...fieldToStrings(digest, "title"),
    ...fieldToStrings(digest, "summary"),
  ]) {
    addCandidate(material, {
      kind: "session_summary",
      label: "Structured session summary",
      summary: value,
      raw_excerpt: value,
      context,
      confidence: "explicit",
      index: index++,
    });
  }
  for (const value of fieldToStrings(digest, "goals")) {
    addCandidate(material, {
      kind: "user_goal",
      label: "Structured user goal",
      summary: value,
      raw_excerpt: value,
      context,
      confidence: "explicit",
      index: index++,
    });
  }
  for (const value of fieldToStrings(digest, "decisions")) {
    addCandidate(material, {
      kind: "decision",
      label: "Structured decision",
      summary: value,
      raw_excerpt: value,
      context,
      confidence: "explicit",
      index: index++,
    });
  }
  for (const value of fieldToStrings(digest, "open_questions")) {
    addCandidate(material, {
      kind: "open_question",
      label: "Structured open question",
      summary: value,
      raw_excerpt: value,
      context,
      confidence: "explicit",
      index: index++,
    });
  }
  for (const value of fieldToStrings(digest, "next_actions")) {
    addCandidate(material, {
      kind: "next_action",
      label: "Structured next action",
      summary: value,
      raw_excerpt: value,
      context,
      confidence: "explicit",
      index: index++,
    });
  }
  for (const value of stringArrayField(digest, "evidence_refs").filter(
    isPublicSafeRef,
  )) {
    addCandidate(material, {
      kind: "evidence_ref",
      label: "Structured evidence ref",
      summary: `Evidence ref supplied for review: ${value}`,
      raw_excerpt: value,
      context: { ...context, evidence_refs: uniqueSortedStrings([value]) },
      confidence: "explicit",
      index: index++,
    });
  }
  for (const value of stringArrayField(digest, "source_refs").filter(
    isPublicSafeRef,
  )) {
    addCandidate(material, {
      kind: "source_ref",
      label: "Structured source ref",
      summary: `Source ref supplied for review: ${value}`,
      raw_excerpt: value,
      context: { ...context, source_refs: uniqueSortedStrings([value]) },
      confidence: "explicit",
      index: index++,
    });
  }
  for (const value of fieldToStrings(digest, "risks")) {
    addCandidate(material, {
      kind: "risk_or_blocker",
      label: "Structured risk or blocker",
      summary: value,
      raw_excerpt: value,
      context,
      confidence: "explicit",
      index: index++,
    });
  }
  for (const value of fieldToStrings(digest, "reusable_context")) {
    addCandidate(material, {
      kind: "reusable_context",
      label: "Structured reusable context",
      summary: value,
      raw_excerpt: value,
      context,
      confidence: "explicit",
      index: index++,
    });
  }
  for (const value of [
    ...fieldToStrings(digest, "review_only"),
    ...fieldToStrings(digest, "rejected_or_review_only"),
  ]) {
    addCandidate(material, {
      kind: "rejected_or_review_only",
      label: "Structured review-only material",
      summary: value,
      raw_excerpt: value,
      context,
      confidence: "explicit",
      index: index++,
    });
  }

  return material;
}

function buildRawTextCandidateMaterial({
  extractedPreview,
  rawTextStatus,
  context,
}: {
  extractedPreview: SelectedSessionDigestExtractedPreview;
  rawTextStatus: RawTextStatus;
  context: CandidateBuildContext;
}): SelectedSessionDigestIntakeCandidateMaterial {
  const material = emptyCandidateMaterial();
  if (rawTextStatus !== "supplied") return material;

  let index = 0;
  for (const line of extractedPreview.heading_lines) {
    addCandidate(material, {
      kind: "session_summary",
      label: "Raw heading-like line",
      summary: `Deterministic heading-like line for review: ${line}`,
      raw_excerpt: line,
      context,
      confidence: "inferred_heuristic",
      index: index++,
    });
  }
  for (const line of extractedPreview.checklist_lines) {
    addCandidate(material, {
      kind: "next_action",
      label: "Raw checklist-like line",
      summary: `Deterministic checklist-like line for review: ${line}`,
      raw_excerpt: line,
      context,
      confidence: "inferred_heuristic",
      index: index++,
    });
  }
  for (const token of extractedPreview.explicit_ref_like_tokens) {
    addCandidate(material, {
      kind: candidateKindForRefToken(token),
      label: "Raw ref-like token",
      summary: `Explicit ref-like token supplied for review: ${token}`,
      raw_excerpt: token,
      context: contextForRefToken(token, context),
      confidence: "inferred_heuristic",
      index: index++,
    });
  }
  for (const line of buildRiskMarkerLines(extractedPreview)) {
    addCandidate(material, {
      kind: "risk_or_blocker",
      label: "Raw risk marker",
      summary: `Deterministic risk marker line for review: ${line}`,
      raw_excerpt: line,
      context,
      confidence: "inferred_heuristic",
      index: index++,
    });
  }

  return material;
}

function candidateKindForRefToken(
  token: string,
): SelectedSessionDigestIntakeCandidateKind {
  if (token.startsWith("evidence:")) return "evidence_ref";
  if (token.startsWith("source:")) return "source_ref";
  if (token.startsWith("decision:")) return "decision";
  return "reusable_context";
}

function contextForRefToken(
  token: string,
  context: CandidateBuildContext,
): CandidateBuildContext {
  if (token.startsWith("evidence:")) {
    return { ...context, evidence_refs: uniqueSortedStrings([token]) };
  }
  if (token.startsWith("source:")) {
    return { ...context, source_refs: uniqueSortedStrings([token]) };
  }
  return context;
}

function buildRiskMarkerLines(
  extractedPreview: SelectedSessionDigestExtractedPreview,
): string[] {
  return uniqueSortedStrings(
    [
      ...extractedPreview.heading_lines,
      ...extractedPreview.checklist_lines,
      ...extractedPreview.quoted_identifiers,
    ].filter((line) => /\b(blocked|blocker|unsafe|risk|missing|privacy)\b/i.test(line)),
  );
}

function addCandidate(
  material: SelectedSessionDigestIntakeCandidateMaterial,
  {
    kind,
    label,
    summary,
    raw_excerpt,
    context,
    confidence,
    index,
  }: {
    kind: SelectedSessionDigestIntakeCandidateKind;
    label: string;
    summary: string;
    raw_excerpt?: string;
    context: CandidateBuildContext;
    confidence: SelectedSessionDigestIntakeCandidate["confidence"];
    index: number;
  },
) {
  const candidate: SelectedSessionDigestIntakeCandidate = {
    candidate_id: [
      "selected-session-digest",
      kind,
      String(index).padStart(2, "0"),
      safeRefComponent(summary),
    ].join("|"),
    candidate_kind: kind,
    label,
    summary: truncateSnippet(summary),
    raw_excerpt: raw_excerpt ? truncateSnippet(raw_excerpt) : undefined,
    source_kind: context.source_kind,
    source_ref: context.source_ref,
    session_ref: context.session_ref,
    project_ref: context.project_ref,
    operator_ref: context.operator_ref,
    evidence_refs: uniqueSortedStrings(context.evidence_refs),
    source_refs: uniqueSortedStrings(context.source_refs),
    confidence,
    review_required: true,
    ingest_preview_only: true,
    would_write_memory: false,
    would_mutate_perspective: false,
    would_mutate_cwp: false,
    would_create_handoff: false,
  };

  candidateBucket(material, kind).push(candidate);
}

function candidateBucket(
  material: SelectedSessionDigestIntakeCandidateMaterial,
  kind: SelectedSessionDigestIntakeCandidateKind,
): SelectedSessionDigestIntakeCandidate[] {
  switch (kind) {
    case "session_summary":
      return material.session_summary_candidates;
    case "user_goal":
      return material.user_goal_candidates;
    case "decision":
      return material.decision_candidates;
    case "open_question":
      return material.open_question_candidates;
    case "next_action":
      return material.next_action_candidates;
    case "evidence_ref":
      return material.evidence_ref_candidates;
    case "source_ref":
      return material.source_ref_candidates;
    case "risk_or_blocker":
      return material.risk_or_blocker_candidates;
    case "reusable_context":
      return material.reusable_context_candidates;
    case "rejected_or_review_only":
      return material.rejected_or_review_only_candidates;
  }
}

function buildBlockedReasons({
  rawTextStatus,
  unsafeRefReasons,
  rawUnsafeMarkers,
}: {
  rawTextStatus: RawTextStatus;
  unsafeRefReasons: string[];
  rawUnsafeMarkers: string[];
}): string[] {
  return uniqueSortedStrings([
    ...(rawTextStatus === "too_large" ? ["blocked_raw_text_too_large"] : []),
    ...unsafeRefReasons,
    ...rawUnsafeMarkers,
  ]);
}

function buildInsufficientDataReasons({
  digestStatus,
  rawTextStatus,
  normalizedSourceKind,
  source_ref,
  operator_ref,
  resolvedSessionRef,
  resolvedProjectRef,
  ingestableCandidateCount,
  candidateCount,
  missingEvidence,
}: {
  digestStatus: DigestStatus;
  rawTextStatus: RawTextStatus;
  normalizedSourceKind: SelectedSessionDigestSourceKind | "missing";
  source_ref?: string;
  operator_ref?: string;
  resolvedSessionRef?: string;
  resolvedProjectRef?: string;
  ingestableCandidateCount: number;
  candidateCount: number;
  missingEvidence: string[];
}): string[] {
  return uniqueSortedStrings([
    ...(digestStatus === "missing" && rawTextStatus === "missing"
      ? ["selected_session_digest_or_raw_text_missing"]
      : []),
    ...(digestStatus === "malformed" && rawTextStatus === "missing"
      ? ["structured_digest_malformed"]
      : []),
    ...(rawTextStatus === "too_large" ? ["raw_text_too_large_for_preview"] : []),
    ...(normalizedSourceKind === "missing" ? ["source_kind_missing"] : []),
    ...(normalizedSourceKind === "unknown" ? ["source_kind_unknown"] : []),
    ...missingPublicSafeReason("source_ref_missing", source_ref),
    ...missingPublicSafeReason("operator_ref_missing", operator_ref),
    ...(!hasPublicSafeValue(resolvedSessionRef) &&
    !hasPublicSafeValue(resolvedProjectRef)
      ? ["session_or_project_ref_missing"]
      : []),
    ...(ingestableCandidateCount === 0
      ? [
          candidateCount > 0
            ? "ingestable_candidate_material_missing_review_only_material_present"
            : "candidate_material_missing",
        ]
      : []),
    ...missingEvidence,
  ]);
}

function buildReadiness({
  normalizedSourceKind,
  source_ref,
  operator_ref,
  resolvedSessionRef,
  resolvedProjectRef,
  ingestableCandidateCount,
  blockedReasons,
  insufficientDataReasons,
  unsafeRefReasons,
  missingEvidence,
}: {
  normalizedSourceKind: SelectedSessionDigestSourceKind | "missing";
  source_ref?: string;
  operator_ref?: string;
  resolvedSessionRef?: string;
  resolvedProjectRef?: string;
  ingestableCandidateCount: number;
  blockedReasons: string[];
  insufficientDataReasons: string[];
  unsafeRefReasons: string[];
  missingEvidence: string[];
}): SelectedSessionDigestIntakeReadiness {
  const hasKnownSourceKind =
    normalizedSourceKind !== "missing" && normalizedSourceKind !== "unknown";
  const hasSourceRef = hasPublicSafeValue(source_ref);
  const hasOperatorRef = hasPublicSafeValue(operator_ref);
  const hasSessionOrProjectRef =
    hasPublicSafeValue(resolvedSessionRef) || hasPublicSafeValue(resolvedProjectRef);
  const readyForOperatorReview =
    ingestableCandidateCount > 0 &&
    blockedReasons.length === 0 &&
    unsafeRefReasons.length === 0;
  const readyForFutureIngestContractPreview =
    readyForOperatorReview &&
    hasKnownSourceKind &&
    hasSourceRef &&
    hasOperatorRef &&
    hasSessionOrProjectRef &&
    missingEvidence.length === 0;

  return {
    ready_for_operator_review: readyForOperatorReview,
    ready_for_future_ingest_contract_preview:
      readyForFutureIngestContractPreview,
    requires_digest_or_raw_text: insufficientDataReasons.includes(
      "selected_session_digest_or_raw_text_missing",
    ),
    requires_known_source_kind: !hasKnownSourceKind,
    requires_source_ref: !hasSourceRef,
    requires_operator_ref: !hasOperatorRef,
    requires_public_safe_refs: unsafeRefReasons.length > 0,
    requires_candidate_material: ingestableCandidateCount === 0,
    requires_privacy_review: true,
    requires_no_blockers: blockedReasons.length > 0,
    current_blockers: blockedReasons,
    current_insufficient_data: insufficientDataReasons,
    current_unsafe_refs: unsafeRefReasons,
  };
}

function determineIntakePreviewStatus({
  hasDigestOrRawText,
  digestStatus,
  rawTextStatus,
  candidateCount,
  ingestableCandidateCount,
  readiness,
  blockedReasons,
}: {
  hasDigestOrRawText: boolean;
  digestStatus: DigestStatus;
  rawTextStatus: RawTextStatus;
  candidateCount: number;
  ingestableCandidateCount: number;
  readiness: SelectedSessionDigestIntakeReadiness;
  blockedReasons: string[];
}): SelectedSessionDigestIntakePreviewStatus {
  if (!hasDigestOrRawText) return "no_digest";
  if (blockedReasons.length > 0 || rawTextStatus === "unsafe") return "unsafe";
  if (
    digestStatus === "malformed" &&
    rawTextStatus === "missing" &&
    ingestableCandidateCount === 0
  ) {
    return "malformed";
  }
  if (readiness.ready_for_operator_review) return "ready_for_operator_review";
  if (ingestableCandidateCount > 0) return "candidate_material_available";
  if (candidateCount > 0) return "keep_preview_only";
  return "insufficient_data";
}

function determineRecommendedNextAction({
  intakePreviewStatus,
  readiness,
  source_ref,
  operator_ref,
  blockedReasons,
  ingestableCandidateCount,
}: {
  intakePreviewStatus: SelectedSessionDigestIntakePreviewStatus;
  readiness: SelectedSessionDigestIntakeReadiness;
  source_ref?: string;
  operator_ref?: string;
  blockedReasons: string[];
  ingestableCandidateCount: number;
}): SelectedSessionDigestIntakeRecommendedNextAction {
  if (intakePreviewStatus === "no_digest") return "supply_selected_session_digest";
  if (blockedReasons.length > 0 || readiness.requires_public_safe_refs) {
    return "resolve_unsafe_refs";
  }
  if (!hasPublicSafeValue(source_ref)) return "supply_source_ref";
  if (!hasPublicSafeValue(operator_ref)) return "supply_operator_ref";
  if (readiness.ready_for_future_ingest_contract_preview) {
    return "prepare_separate_digest_ingest_contract_preview";
  }
  if (ingestableCandidateCount > 0) return "review_intake_candidate";
  if (intakePreviewStatus === "keep_preview_only") return "keep_preview_only";
  return "reject_digest_candidate";
}

function buildFutureIngestContractPreview(): SelectedSessionDigestFutureIngestContractPreview {
  return {
    proposed_record_kind: "selected_session_digest_ingest_candidate.v0.1",
    required_operator_review: [
      "operator_confirms_candidate_material",
      "operator_confirms_review_only_boundaries",
    ],
    required_source_kind: ["known_supported_source_kind"],
    required_source_ref: ["public_safe_source_ref"],
    required_operator_ref: ["public_safe_operator_ref"],
    required_session_or_project_ref: [
      "public_safe_session_ref_or_project_ref",
    ],
    required_evidence_refs: ["public_safe_evidence_refs"],
    required_idempotency_key: ["stable_public_safe_digest_intake_key"],
    required_privacy_review: [
      "operator_confirms_selected_digest_is_safe_to_ingest",
      "operator_resolves_private_or_secret_material_before_ingest",
    ],
    required_no_side_effects_receipt: [
      "no_db_write",
      "no_memory_write",
      "no_perspective_or_cwp_mutation",
      "no_handoff_mutation_or_send",
    ],
    required_refusal_checks: [
      "reject_unsafe_refs",
      "reject_unknown_source_kind_for_future_ingest",
      "reject_missing_operator_review",
      "reject_missing_source_ref",
    ],
  };
}

function buildPrivacyReviewNotes(rawTextStatus: RawTextStatus): string[] {
  return uniqueSortedStrings([
    "manual_selected_digest_material_requires_operator_privacy_review_before_any_future_ingest",
    "preview_does_not_parse_private_files_fetch_urls_or_call_llms",
    "raw_text_heuristics_do_not_claim_semantic_understanding",
    ...(rawTextStatus === "unsafe"
      ? ["raw_text_contains_obvious_private_or_secret_marker"]
      : []),
  ]);
}

function buildOperatorReviewChecklist(): string[] {
  return [
    "confirm_digest_material_was_manually_selected_for_review",
    "confirm_source_kind_matches_the_supplied_material",
    "confirm_source_ref_operator_ref_and_session_or_project_ref_are_public_safe",
    "confirm_candidate_material_is_not_fabricated_from_raw_text",
    "confirm_evidence_refs_are_present_and_safe_before_future_ingest",
    "confirm_review_only_or_rejected_material_stays_out_of_ingestable_material",
    "confirm_future_ingest_contract_is_separate_and_operator_approved",
  ];
}

function buildWouldNotIngest(): string[] {
  return [
    "does_not_create_ingest_record",
    "does_not_write_db_rows",
    "does_not_create_schema",
    "does_not_write_memory",
    "does_not_mutate_memory",
    "does_not_mutate_current_working_perspective",
    "does_not_mutate_perspective_unit",
    "does_not_write_next_work_bias",
    "does_not_update_continuity_relay",
    "does_not_mutate_handoff_context",
    "does_not_write_selected_refs_to_active_handoff_packet",
    "does_not_send_handoffs",
    "does_not_write_dogfood_metrics",
    "does_not_write_reuse_ledger",
    "does_not_call_provider_openai",
    "does_not_call_github",
    "does_not_execute_codex",
    "does_not_create_prs",
    "does_not_merge_prs",
    "does_not_run_autonomous_actions",
    "does_not_create_graph_vector_rag_crawler_browser_observer",
  ];
}

function buildNonGoals(): string[] {
  return [
    "no_live_ingest",
    "no_memory_write_path",
    "no_perspective_or_cwp_mutation_path",
    "no_handoff_context_mutation_path",
    "no_selected_ref_live_packet_write",
    "no_provider_or_llm_summarization",
    "no_github_codex_or_autonomous_action",
    "no_graph_vector_rag_crawler_browser_observer_infrastructure",
    "no_workbench_import_write_apply_approve_send_button",
  ];
}

function buildOutputSourceRefs({
  source_refs,
  extracted_preview,
}: {
  source_refs: string[];
  extracted_preview: SelectedSessionDigestExtractedPreview;
}): string[] {
  return uniqueSortedStrings([
    ...source_refs,
    ...extracted_preview.explicit_ref_like_tokens.filter((token) =>
      token.startsWith("source:"),
    ),
    SELECTED_SESSION_DIGEST_INTAKE_PREVIEW_VERSION,
  ]);
}

function hasDigestOrRawText({
  digestStatus,
  rawTextStatus,
}: {
  digestStatus: DigestStatus;
  rawTextStatus: RawTextStatus;
}): boolean {
  return digestStatus !== "missing" || rawTextStatus !== "missing";
}

function emptyCandidateMaterial(): SelectedSessionDigestIntakeCandidateMaterial {
  return {
    session_summary_candidates: [],
    user_goal_candidates: [],
    decision_candidates: [],
    open_question_candidates: [],
    next_action_candidates: [],
    evidence_ref_candidates: [],
    source_ref_candidates: [],
    risk_or_blocker_candidates: [],
    reusable_context_candidates: [],
    rejected_or_review_only_candidates: [],
  };
}

function mergeCandidateMaterial(
  materials: SelectedSessionDigestIntakeCandidateMaterial[],
): SelectedSessionDigestIntakeCandidateMaterial {
  const merged = emptyCandidateMaterial();
  for (const material of materials) {
    merged.session_summary_candidates.push(...material.session_summary_candidates);
    merged.user_goal_candidates.push(...material.user_goal_candidates);
    merged.decision_candidates.push(...material.decision_candidates);
    merged.open_question_candidates.push(...material.open_question_candidates);
    merged.next_action_candidates.push(...material.next_action_candidates);
    merged.evidence_ref_candidates.push(...material.evidence_ref_candidates);
    merged.source_ref_candidates.push(...material.source_ref_candidates);
    merged.risk_or_blocker_candidates.push(...material.risk_or_blocker_candidates);
    merged.reusable_context_candidates.push(...material.reusable_context_candidates);
    merged.rejected_or_review_only_candidates.push(
      ...material.rejected_or_review_only_candidates,
    );
  }
  return merged;
}

function countCandidates(
  material: SelectedSessionDigestIntakeCandidateMaterial,
): number {
  return (
    material.session_summary_candidates.length +
    material.user_goal_candidates.length +
    material.decision_candidates.length +
    material.open_question_candidates.length +
    material.next_action_candidates.length +
    material.evidence_ref_candidates.length +
    material.source_ref_candidates.length +
    material.risk_or_blocker_candidates.length +
    material.reusable_context_candidates.length +
    material.rejected_or_review_only_candidates.length
  );
}

function countIngestableCandidates(
  material: SelectedSessionDigestIntakeCandidateMaterial,
): number {
  return (
    material.session_summary_candidates.length +
    material.user_goal_candidates.length +
    material.decision_candidates.length +
    material.open_question_candidates.length +
    material.next_action_candidates.length +
    material.evidence_ref_candidates.length +
    material.source_ref_candidates.length +
    material.risk_or_blocker_candidates.length +
    material.reusable_context_candidates.length
  );
}

function buildUnsafeRefReasons(refInputs: RefInput[]): string[] {
  const reasons: string[] = [];
  for (const refInput of refInputs) {
    for (const value of refInput.values) {
      if (value === undefined || value === null || !value.trim()) continue;
      if (!isPublicSafeRef(value)) reasons.push(`${refInput.label}_unsafe`);
    }
  }
  return uniqueSortedStrings(reasons);
}

function detectRawTextUnsafeMarkers(rawText: string): string[] {
  if (!rawText) return [];
  return uniqueSortedStrings([
    ...(rawTextTokenLikeSecretPattern.test(rawText)
      ? ["raw_text_contains_token_like_secret_marker"]
      : []),
    ...(rawTextEmbeddedCredentialUrlPattern.test(rawText)
      ? ["raw_text_contains_embedded_credential_url_marker"]
      : []),
    ...(/\/Users\/|\/home\/|(?:^|\s)\.env\b/i.test(rawText)
      ? ["raw_text_contains_private_path_marker"]
      : []),
    ...(/\b(password:|secret:)/i.test(rawText)
      ? ["raw_text_contains_secret_label_marker"]
      : []),
  ]);
}

function fieldToStrings(
  record: Record<string, unknown>,
  field: string,
): string[] {
  const value = record[field];
  if (typeof value === "string" && value.trim()) return [value.trim()];
  if (Array.isArray(value)) {
    return value
      .filter((item): item is string => typeof item === "string")
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
}

function stringArrayField(
  record: Record<string, unknown> | null,
  field: string,
): string[] {
  if (!record) return [];
  return fieldToStrings(record, field);
}

function stringField(
  record: Record<string, unknown> | null,
  field: string,
): string | undefined {
  if (!record) return undefined;
  const value = record[field];
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function missingPublicSafeReason(reason: string, value?: string): string[] {
  return hasPublicSafeValue(value) ? [] : [reason];
}

function hasPublicSafeValue(value?: string): value is string {
  return typeof value === "string" && isPublicSafeRef(value);
}

function isPublicSafeRef(value: string): boolean {
  if (!value.trim()) return false;
  if (value.length > 180) return false;
  if (/[\s\x00-\x1f\x7f]/.test(value)) return false;
  if (value.startsWith("/") || /^[a-zA-Z]:[\\/]/.test(value)) return false;
  if (value.includes("\\") || value.includes("../") || value.includes("..\\")) {
    return false;
  }
  if (tokenLikeSecretRefPattern.test(value)) return false;
  if (embeddedCredentialUrlRefPattern.test(value)) return false;
  if (/(^|[/:])(\.env)([/:]|$)/i.test(value)) return false;
  if (/(\/Users\/|\/home\/|password:|secret:)/i.test(value)) return false;
  return true;
}

const tokenLikeSecretRefPattern = /(^|[:/@|=])(sk-|ghp_|github_pat_|xoxb-)/i;
const embeddedCredentialUrlRefPattern =
  /(^|[:|=])[a-z][a-z0-9+.-]*:\/\/[^/\s]+@/i;
const rawTextTokenLikeSecretPattern =
  /(^|[\s:/@|=])(sk-|ghp_|github_pat_|xoxb-)/i;
const rawTextEmbeddedCredentialUrlPattern =
  /(^|[\s:|=])[a-z][a-z0-9+.-]*:\/\/[^/\s]+@/i;

function truncateSnippet(value: string): string {
  const trimmed = value.replace(/\s+/g, " ").trim();
  return trimmed.length > 180 ? `${trimmed.slice(0, 177)}...` : trimmed;
}

function safeRefComponent(value: string): string {
  return value.replace(/[\s\x00-\x1f\x7f|]/g, "_").slice(0, 80);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function uniqueSortedStrings(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean))).sort((a, b) =>
    a.localeCompare(b),
  );
}
