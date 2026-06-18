import type {
  EvidenceRole,
  PerspectiveDeltaType,
  PromotionReadiness,
  ResearchCandidateReviewPreviewResponse,
  ResearchCandidateReviewScope,
  ResearchEpistemicStatus,
  ResearchReviewStatus,
  TensionType,
} from "@/types/research-candidate-review";

export type ManualResearchNoteParserVersion =
  "manual_research_note_parser.v0.1";

export type ManualResearchNoteParserOptions = {
  scope?: ResearchCandidateReviewScope;
  work_id?: string;
  session_id?: string;
  source_ref_id?: string;
};

export type ManualResearchNoteParserWarning = {
  code: string;
  message: string;
  line?: number;
};

export type ManualResearchNoteParserResult = {
  parser_version: ManualResearchNoteParserVersion;
  preview: ResearchCandidateReviewPreviewResponse;
  warnings: ManualResearchNoteParserWarning[];
  authority: {
    preview_only: true;
    deterministic_parser_only: true;
    provider_calls: false;
    retrieval: false;
    db_writes: false;
    perspective_promotion: false;
    proof_or_evidence_writes: false;
  };
};

type ManualResearchNoteField =
  | "research_question"
  | "operator_intent"
  | "source_title"
  | "source_origin"
  | "source_identifier"
  | "claim"
  | "evidence"
  | "tension"
  | "gap"
  | "perspective_delta"
  | "next";

type ManualResearchNoteLine = {
  field: ManualResearchNoteField;
  value: string;
  line: number;
};

const PARSER_VERSION: ManualResearchNoteParserVersion =
  "manual_research_note_parser.v0.1";

const DEFAULT_SCOPE: ResearchCandidateReviewScope = "project:augnes";
const DEFAULT_WORK_ID = "AG-RESEARCH-CANDIDATE-MANUAL-PARSER-001";
const DEFAULT_SESSION_ID = "research_session_manual_note_001";
const DEFAULT_SOURCE_REF_ID = "source_ref_manual_note_001";
const DEFAULT_TARGET_PERSPECTIVE_KEY = "research.candidate_review";
const DEFAULT_RESEARCH_QUESTION = "Manual research note preview needs review";
const DEFAULT_OPERATOR_INTENT =
  "Review manually supplied research notes as candidate-only material.";
const DEFAULT_SOURCE_TITLE = "Manual pasted research note";
const DEFAULT_SOURCE_ORIGIN = "manual_paste";
const DEFAULT_SOURCE_IDENTIFIER = "manual-paste:local-preview";

const PREFIX_DEFINITIONS: {
  field: ManualResearchNoteField;
  prefixes: string[];
}[] = [
  { field: "research_question", prefixes: ["Research Question:", "연구질문:"] },
  { field: "operator_intent", prefixes: ["Operator Intent:", "의도:"] },
  { field: "source_title", prefixes: ["Source Title:", "출처제목:"] },
  { field: "source_origin", prefixes: ["Source Origin:", "출처:"] },
  { field: "source_identifier", prefixes: ["Source Identifier:", "식별자:"] },
  { field: "perspective_delta", prefixes: ["Perspective Delta:", "관점변화:"] },
  { field: "claim", prefixes: ["Claim:", "주장:"] },
  { field: "evidence", prefixes: ["Evidence:", "근거:"] },
  { field: "tension", prefixes: ["Tension:", "긴장:"] },
  { field: "gap", prefixes: ["Gap:", "공백:"] },
  { field: "next", prefixes: ["Next:", "다음:"] },
];

export function parseManualResearchNoteToPreview(
  input: string,
  options: ManualResearchNoteParserOptions = {},
): ManualResearchNoteParserResult {
  return buildManualResearchNotePreview(
    parseManualResearchNoteLines(input),
    options,
  );
}

export function parseManualResearchNoteLines(
  input: string,
): ManualResearchNoteLine[] {
  return input
    .split(/\r?\n/)
    .map((rawLine, index) => {
      const trimmedLine = rawLine.trim();

      if (!trimmedLine) return null;

      for (const definition of PREFIX_DEFINITIONS) {
        const matchedPrefix = definition.prefixes.find((prefix) =>
          trimmedLine.startsWith(prefix),
        );

        if (matchedPrefix) {
          return {
            field: definition.field,
            value: trimmedLine.slice(matchedPrefix.length).trim(),
            line: index + 1,
          };
        }
      }

      return null;
    })
    .filter((line): line is ManualResearchNoteLine => Boolean(line));
}

export function buildManualResearchNotePreview(
  lines: ManualResearchNoteLine[],
  options: ManualResearchNoteParserOptions = {},
): ManualResearchNoteParserResult {
  const warnings: ManualResearchNoteParserWarning[] = [];
  const scope = options.scope ?? DEFAULT_SCOPE;
  const workId = options.work_id ?? DEFAULT_WORK_ID;
  const sessionId = options.session_id ?? DEFAULT_SESSION_ID;
  const sourceRefId = options.source_ref_id ?? DEFAULT_SOURCE_REF_ID;

  const researchQuestion =
    firstLineValue(lines, "research_question") ??
    withMissingWarning(
      warnings,
      "missing_research_question",
      "Research Question is missing; using conservative fallback.",
      DEFAULT_RESEARCH_QUESTION,
    );
  const operatorIntent =
    firstLineValue(lines, "operator_intent") ??
    withMissingWarning(
      warnings,
      "missing_operator_intent",
      "Operator Intent is missing; using candidate-only review fallback.",
      DEFAULT_OPERATOR_INTENT,
    );
  const sourceTitle =
    firstLineValue(lines, "source_title") ??
    withMissingWarning(
      warnings,
      "missing_source_title",
      "Source Title is missing; using manual pasted note fallback.",
      DEFAULT_SOURCE_TITLE,
    );
  const sourceOrigin = firstLineValue(lines, "source_origin") ?? DEFAULT_SOURCE_ORIGIN;
  const sourceIdentifier =
    firstLineValue(lines, "source_identifier") ?? DEFAULT_SOURCE_IDENTIFIER;

  const claimLines = linesByField(lines, "claim");
  const evidenceLines = linesByField(lines, "evidence");
  const tensionLines = linesByField(lines, "tension");
  const gapLines = linesByField(lines, "gap");
  const deltaLines = linesByField(lines, "perspective_delta");
  const nextLines = linesByField(lines, "next");

  const claimCandidates: ResearchCandidateReviewPreviewResponse["claim_candidates"] =
    claimLines.map((line, index) => ({
      claim_candidate_id: orderId("claim_candidate", index),
      source_refs: [sourceRefId],
      claim_text: line.value,
      claim_type: "manual_note_claim",
      confidence_label: "manual_candidate",
      supporting_evidence_candidate_ids: [],
      contradicting_evidence_candidate_ids: [],
      review_status: reviewStatus("needs_review"),
      epistemic_status: epistemicStatus("candidate_claim"),
      boundary_notes:
        "Candidate claim only; not evidence, not proof, not committed state.",
    }));

  const firstClaimId =
    claimCandidates[0]?.claim_candidate_id ?? "unlinked_claim_candidate";
  const evidenceCandidates: ResearchCandidateReviewPreviewResponse["evidence_candidates"] =
    evidenceLines.map((line, index) => {
      if (claimCandidates.length === 0) {
        warnings.push({
          code: "evidence_without_claim",
          message:
            "Evidence line has no claim candidate; using unlinked claim candidate marker.",
          line: line.line,
        });
      }

      const roleAndSummary = parseEvidenceRole(line.value);

      return {
        evidence_candidate_id: orderId("evidence_candidate", index),
        source_ref_id: sourceRefId,
        claim_candidate_id: firstClaimId,
        evidence_summary: roleAndSummary.summary,
        evidence_role: roleAndSummary.role,
        locator: `manual_note_line:${line.line}`,
        quality_note:
          "Manual note evidence candidate requires human review before promotion.",
        review_status: reviewStatus("needs_review"),
        epistemic_status: epistemicStatus("operator_note"),
        boundary_notes:
          "Evidence candidate only; not an Augnes evidence row or proof record.",
      };
    });

  if (claimCandidates.length > 0) {
    const firstClaim = claimCandidates[0];
    firstClaim.supporting_evidence_candidate_ids = evidenceCandidates
      .filter((evidence) => evidence.evidence_role === "supports")
      .map((evidence) => evidence.evidence_candidate_id);
    firstClaim.contradicting_evidence_candidate_ids = evidenceCandidates
      .filter((evidence) => evidence.evidence_role === "contradicts")
      .map((evidence) => evidence.evidence_candidate_id);
  }

  const claimIds = claimCandidates.map((claim) => claim.claim_candidate_id);
  const evidenceIds = evidenceCandidates.map(
    (evidence) => evidence.evidence_candidate_id,
  );

  const tensionCandidates: ResearchCandidateReviewPreviewResponse["tension_candidates"] =
    tensionLines.map((line, index) => ({
      tension_candidate_id: orderId("tension_candidate", index),
      source_refs: [sourceRefId],
      summary: line.value,
      related_claim_candidate_ids: claimIds,
      related_evidence_candidate_ids: evidenceIds,
      tension_type: tensionType("ambiguity"),
      operator_question: line.value,
      blocks_or_qualifies_promotion: true,
      review_status: reviewStatus("needs_review"),
      epistemic_status: epistemicStatus("contested"),
      boundary_notes: "Tension candidate only; unresolved review material.",
    }));

  const tensionIds = tensionCandidates.map(
    (tension) => tension.tension_candidate_id,
  );

  const knowledgeGapCandidates: ResearchCandidateReviewPreviewResponse["knowledge_gap_candidates"] =
    gapLines.map((line, index) => {
      const gapParts = splitInlineList(line.value, ["next:", "다음:"]);

      return {
        knowledge_gap_candidate_id: orderId("knowledge_gap_candidate", index),
        source_refs: [sourceRefId],
        summary: gapParts.summary,
        why_it_matters: gapParts.summary,
        related_claim_candidate_ids: claimIds,
        related_tension_candidate_ids: tensionIds,
        suggested_next_reading: gapParts.items,
        review_status: reviewStatus("needs_review"),
        epistemic_status: epistemicStatus("hypothesis_only"),
        boundary_notes:
          "Knowledge gap candidate only; not filled by provider inference.",
      };
    });

  const gapIds = knowledgeGapCandidates.map(
    (gap) => gap.knowledge_gap_candidate_id,
  );

  const perspectiveDeltaCandidates: ResearchCandidateReviewPreviewResponse["perspective_delta_candidates"] =
    deltaLines.map((line, index) => ({
      perspective_delta_candidate_id: orderId(
        "perspective_delta_candidate",
        index,
      ),
      source_refs: [sourceRefId],
      target_perspective_key: DEFAULT_TARGET_PERSPECTIVE_KEY,
      delta_type: perspectiveDeltaType("refine"),
      before_summary:
        "Research Candidate Review remains a preview-only candidate surface.",
      after_summary: line.value,
      proposed_update_summary: line.value,
      basis_claim_candidate_ids: claimIds,
      basis_evidence_candidate_ids: evidenceIds,
      related_tension_candidate_ids: tensionIds,
      related_gap_candidate_ids: gapIds,
      risk_or_conflict_note:
        "Manual parser delta is not committed state, promotion, or source-of-truth authority.",
      promotion_readiness: promotionReadiness("not_ready"),
      review_status: reviewStatus("needs_review"),
      epistemic_status: epistemicStatus("hypothesis_only"),
      boundary_notes:
        "Perspective delta candidate only; not committed state or promotion.",
    }));

  const followUpWorkCandidates: ResearchCandidateReviewPreviewResponse["follow_up_work_candidates"] =
    nextLines.map((line, index) => {
      const files = splitInlineList(line.value, ["files:"]).items;
      const checks = splitInlineList(line.value, ["checks:"]).items;

      return {
        follow_up_work_candidate_id: orderId("follow_up_work_candidate", index),
        candidate_title: line.value,
        candidate_scope: scope,
        candidate_summary: line.value,
        reason: "Manual note proposed this as follow-up candidate material.",
        suggested_expected_files: files,
        suggested_expected_checks: checks,
        review_status: reviewStatus("candidate_only"),
        boundary_notes:
          "Follow-up work candidate only; not a work item, issue, branch, or dispatch.",
      };
    });

  const preview: ResearchCandidateReviewPreviewResponse = {
    preview_version: "research_candidate_review.v0.1",
    scope,
    status: "candidate_preview_only",
    authority: {
      candidate_only: true,
      source_of_truth: false,
      creates_evidence: false,
      creates_proof: false,
      commits_state: false,
      promotes_perspective: false,
      creates_work_item: false,
    },
    research_session_preview: {
      session_id: sessionId,
      scope,
      work_id: workId,
      research_question: researchQuestion,
      operator_intent: operatorIntent,
      source_refs: [sourceRefId],
      claim_candidate_count: claimCandidates.length,
      evidence_candidate_count: evidenceCandidates.length,
      tension_candidate_count: tensionCandidates.length,
      knowledge_gap_candidate_count: knowledgeGapCandidates.length,
      perspective_delta_candidate_count: perspectiveDeltaCandidates.length,
      follow_up_work_candidate_count: followUpWorkCandidates.length,
      review_status: reviewStatus("candidate_only"),
      boundary_notes:
        "Manual parser preview only; no durable research state, proof, evidence, work item, or perspective promotion is created.",
    },
    source_reference_previews: [
      {
        source_ref_id: sourceRefId,
        title: sourceTitle,
        authors_or_origin: sourceOrigin,
        identifier_or_url: sourceIdentifier,
        reference_source: "manual_note",
        source_status: "operator_supplied_reference",
        operator_note_summary:
          "Manual parser preview from bounded prefix-based pasted note.",
        review_status: reviewStatus("reviewed_reference_only"),
        boundary_notes:
          "Reference preview only; no fetch, provider enrichment, indexing, durable write, or source-of-truth authority.",
      },
    ],
    claim_candidates: claimCandidates,
    evidence_candidates: evidenceCandidates,
    tension_candidates: tensionCandidates,
    knowledge_gap_candidates: knowledgeGapCandidates,
    perspective_delta_candidates: perspectiveDeltaCandidates,
    follow_up_work_candidates: followUpWorkCandidates,
  };

  return {
    parser_version: PARSER_VERSION,
    preview,
    warnings,
    authority: manualParserAuthority(),
  };
}

function firstLineValue(
  lines: ManualResearchNoteLine[],
  field: ManualResearchNoteField,
) {
  return lines.find((line) => line.field === field)?.value || null;
}

function linesByField(
  lines: ManualResearchNoteLine[],
  field: ManualResearchNoteField,
) {
  return lines.filter((line) => line.field === field && line.value.length > 0);
}

function withMissingWarning(
  warnings: ManualResearchNoteParserWarning[],
  code: string,
  message: string,
  fallback: string,
) {
  warnings.push({ code, message });
  return fallback;
}

function parseEvidenceRole(value: string): {
  role: EvidenceRole;
  summary: string;
} {
  const markers: { role: EvidenceRole; prefixes: string[] }[] = [
    { role: "contradicts", prefixes: ["contradicts:", "반박:"] },
    { role: "contextualizes", prefixes: ["context:", "맥락:"] },
    { role: "limitation", prefixes: ["limitation:", "한계:"] },
  ];

  for (const marker of markers) {
    const matchedPrefix = marker.prefixes.find((prefix) =>
      value.toLowerCase().startsWith(prefix),
    );

    if (matchedPrefix) {
      return {
        role: marker.role,
        summary: value.slice(matchedPrefix.length).trim(),
      };
    }
  }

  return { role: "supports", summary: value };
}

function splitInlineList(value: string, markers: string[]) {
  const marker = markers.find((candidateMarker) => value.includes(candidateMarker));

  if (!marker) {
    return { summary: value, items: [] };
  }

  const [summaryPart, itemPart = ""] = value.split(marker);
  return {
    summary: summaryPart.trim(),
    items: itemPart
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean),
  };
}

function orderId(prefix: string, index: number) {
  return `${prefix}_${String(index + 1).padStart(3, "0")}`;
}

function reviewStatus(value: ResearchReviewStatus) {
  return value;
}

function epistemicStatus(value: ResearchEpistemicStatus) {
  return value;
}

function tensionType(value: TensionType) {
  return value;
}

function perspectiveDeltaType(value: PerspectiveDeltaType) {
  return value;
}

function promotionReadiness(value: PromotionReadiness) {
  return value;
}

function manualParserAuthority(): ManualResearchNoteParserResult["authority"] {
  return {
    preview_only: true,
    deterministic_parser_only: true,
    provider_calls: false,
    retrieval: false,
    db_writes: false,
    perspective_promotion: false,
    proof_or_evidence_writes: false,
  };
}
