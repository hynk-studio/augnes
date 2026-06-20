import type {
  ResearchCandidateManualNotePreviewDraftActivityList,
  ResearchCandidateManualNotePreviewDraftDetail,
} from "@/lib/research-candidate-review/manual-note-preview-draft-store";
import {
  buildManualNotePreviewDraftPromotionReadinessAuthority,
  buildManualNotePreviewDraftPromotionReadinessBoundary,
  buildManualNotePreviewNoSideEffects,
  type ManualNotePreviewDraftPromotionCandidateSummary,
  type ManualNotePreviewDraftPromotionReadinessGateId,
  type ManualNotePreviewDraftPromotionReadinessGateResult,
  type ManualNotePreviewDraftPromotionReadinessGateStatus,
  type ManualNotePreviewDraftPromotionReadinessOkResponse,
  type ManualNotePreviewDraftPromotionReadinessStatus,
  type ManualNotePreviewDraftPromotionSourceSummary,
} from "@/lib/research-candidate-review/manual-note-runtime-preview";
import type { ResearchCandidateReviewPreviewResponse } from "@/types/research-candidate-review";

type PromotionReadinessBuildInput = {
  detail: ResearchCandidateManualNotePreviewDraftDetail;
  activity: ResearchCandidateManualNotePreviewDraftActivityList | null;
  route: string;
};

const CRITICAL_WARNING_CODES = new Set([
  "missing_research_question",
  "missing_operator_intent",
  "missing_source_title",
]);

export function buildManualNotePreviewDraftPromotionReadiness({
  detail,
  activity,
  route,
}: PromotionReadinessBuildInput): Omit<
  ManualNotePreviewDraftPromotionReadinessOkResponse,
  "ok" | "runtime_version"
> {
  const sourceSummary = buildSourceSummary(detail.preview);
  const candidateSummary = buildCandidateSummary(detail.preview);
  const gateResults = buildGateResults({
    detail,
    activity,
    sourceSummary,
    candidateSummary,
  });
  const readinessStatus = getReadinessStatus(gateResults);

  return {
    preview_draft_id: detail.draft.preview_draft_id,
    lifecycle_status: detail.lifecycle_status,
    readiness_status: readinessStatus,
    readiness_score: getReadinessScore(gateResults, readinessStatus),
    gate_results: gateResults,
    blockers: gateResults
      .filter((gate) => gate.status === "block")
      .map((gate) => gate.summary),
    warnings: gateResults
      .filter((gate) => gate.status === "warn")
      .map((gate) => gate.summary),
    next_review_steps: buildNextReviewSteps(gateResults, readinessStatus),
    source_summary: sourceSummary,
    candidate_summary: candidateSummary,
    lifecycle_summary: detail.draft.lifecycle_summary,
    authority: buildManualNotePreviewDraftPromotionReadinessAuthority(),
    runtime_boundary: buildManualNotePreviewDraftPromotionReadinessBoundary({
      route,
    }),
    no_side_effects: buildManualNotePreviewNoSideEffects(),
    created_at: new Date().toISOString(),
  };
}

function buildGateResults({
  detail,
  activity,
  sourceSummary,
  candidateSummary,
}: {
  detail: ResearchCandidateManualNotePreviewDraftDetail;
  activity: ResearchCandidateManualNotePreviewDraftActivityList | null;
  sourceSummary: ManualNotePreviewDraftPromotionSourceSummary;
  candidateSummary: ManualNotePreviewDraftPromotionCandidateSummary;
}): ManualNotePreviewDraftPromotionReadinessGateResult[] {
  const previewShapeBlockers = getPreviewShapeBlockers(detail.preview);
  const criticalWarnings = detail.warnings.filter((warning) =>
    CRITICAL_WARNING_CODES.has(warning.code),
  );
  const storedLinks = [
    detail.draft.promoted_at,
    detail.draft.canonical_perspective_id,
    detail.draft.proof_id,
    detail.draft.evidence_id,
    detail.draft.work_item_id,
  ].filter((value): value is string => typeof value === "string" && value.length > 0);
  const authorityBoundaryBlocked =
    detail.authority.canonical_perspective_created !== false ||
    detail.authority.proof_created !== false ||
    detail.authority.evidence_created !== false ||
    detail.authority.work_item_created !== false ||
    detail.authority.promotion_workflow !== false ||
    detail.preview.authority.promotes_perspective !== false ||
    detail.preview.authority.creates_proof !== false ||
    detail.preview.authority.creates_evidence !== false ||
    detail.preview.authority.creates_work_item !== false ||
    detail.preview.authority.commits_state !== false;

  return [
    gate({
      gateId: "lifecycle_gate",
      label: "Lifecycle gate",
      status:
        detail.lifecycle_status === "discarded_preview_draft" ? "block" : "pass",
      summary:
        detail.lifecycle_status === "discarded_preview_draft"
          ? "Discarded preview drafts are blocked from promotion discussion."
          : "Preview draft is active.",
      detail:
        detail.lifecycle_status === "discarded_preview_draft"
          ? "Discard is lifecycle hygiene only, but discarded drafts should not proceed to promotion discussion without a new explicit operator review."
          : "No discard marker was present for this preview draft.",
      evidenceFields: [
        "lifecycle_status",
        "lifecycle_summary.discard_state",
        "discard_metadata",
      ],
    }),
    gate({
      gateId: "storage_boundary_gate",
      label: "Storage boundary gate",
      status:
        detail.draft.manual_note_text_stored || previewShapeBlockers.length > 0
          ? "block"
          : "pass",
      summary:
        previewShapeBlockers.length > 0
          ? "Stored preview draft shape is missing required preview sections."
          : detail.draft.manual_note_text_stored
            ? "Raw manual note text storage was unexpectedly indicated."
            : "Stored draft contains parsed preview JSON metadata only.",
      detail:
        previewShapeBlockers.length > 0
          ? previewShapeBlockers.join(" ")
          : "The preflight reads stored preview JSON and metadata; raw manual note text is not returned.",
      evidenceFields: [
        "manual_note_text_stored",
        "preview.research_session_preview",
        "preview.source_reference_previews",
        "preview.claim_candidates",
        "preview.evidence_candidates",
      ],
    }),
    gate({
      gateId: "authority_boundary_gate",
      label: "Authority boundary gate",
      status: authorityBoundaryBlocked ? "block" : "pass",
      summary: authorityBoundaryBlocked
        ? "Stored authority boundary unexpectedly indicates canonical or workflow authority."
        : "Stored authority boundary remains preview-only and non-canonical.",
      detail: authorityBoundaryBlocked
        ? "Promotion readiness cannot proceed when stored boundary flags imply proof/evidence/work/Perspective writes."
        : "Runtime and preview authority flags preserve candidate-only, preview-only behavior.",
      evidenceFields: [
        "authority",
        "preview.authority",
        "stored_runtime_boundary",
        "stored_no_side_effects",
      ],
    }),
    gate({
      gateId: "parser_warning_gate",
      label: "Parser warning gate",
      status:
        criticalWarnings.length > 0
          ? "block"
          : detail.warnings.length > 0
            ? "warn"
            : "pass",
      summary:
        criticalWarnings.length > 0
          ? "Critical parser warnings block promotion discussion."
          : detail.warnings.length > 0
            ? "Parser warnings require operator review before promotion discussion."
            : "No parser warnings were recorded.",
      detail:
        detail.warnings.length > 0
          ? detail.warnings
              .map((warning) => `${warning.code}: ${warning.message}`)
              .join(" ")
          : "Parser result had no warnings.",
      evidenceFields: ["warnings", "warnings.code", "warnings.message"],
    }),
    gate({
      gateId: "source_reference_gate",
      label: "Source reference gate",
      status: sourceSummary.source_ref_count === 0 ? "block" : "pass",
      summary:
        sourceSummary.source_ref_count === 0
          ? "No source references are present."
          : "Source references are present.",
      detail:
        sourceSummary.source_ref_count === 0
          ? "Promotion discussion needs at least source reference preview metadata."
          : `Source ref count ${sourceSummary.source_ref_count}; no source URLs were fetched or validated.`,
      evidenceFields: [
        "source_summary.source_ref_count",
        "source_reference_previews",
        "research_session_preview.source_refs",
      ],
    }),
    gate({
      gateId: "claim_candidate_gate",
      label: "Claim candidate gate",
      status: candidateSummary.claims === 0 ? "block" : "pass",
      summary:
        candidateSummary.claims === 0
          ? "No claim candidates are present."
          : "Claim candidates are present.",
      detail:
        candidateSummary.claims === 0
          ? "Promotion discussion needs at least one claim candidate."
          : `Claim candidate count ${candidateSummary.claims}.`,
      evidenceFields: ["candidate_summary.claims", "claim_candidates"],
    }),
    gate({
      gateId: "evidence_candidate_gate",
      label: "Evidence candidate gate",
      status:
        candidateSummary.evidence === 0 && sourceSummary.source_ref_count === 0
          ? "block"
          : candidateSummary.evidence === 0
            ? "warn"
            : "pass",
      summary:
        candidateSummary.evidence === 0 && sourceSummary.source_ref_count === 0
          ? "No evidence candidates or source references are present."
          : candidateSummary.evidence === 0
            ? "No evidence candidates are present; source refs need operator review."
            : "Evidence candidates are present.",
      detail:
        candidateSummary.evidence === 0
          ? "Readiness remains bounded because the route does not retrieve or synthesize evidence."
          : `Evidence candidate count ${candidateSummary.evidence}.`,
      evidenceFields: [
        "candidate_summary.evidence",
        "evidence_candidates",
        "source_summary.source_ref_count",
      ],
    }),
    gate({
      gateId: "tension_gap_gate",
      label: "Tension and gap gate",
      status:
        candidateSummary.tensions > 0 || candidateSummary.knowledge_gaps > 0
          ? "warn"
          : "pass",
      summary:
        candidateSummary.tensions > 0 || candidateSummary.knowledge_gaps > 0
          ? "Tensions or knowledge gaps require operator review."
          : "No tension or knowledge gap candidates were recorded.",
      detail: `Tensions ${candidateSummary.tensions}; knowledge gaps ${candidateSummary.knowledge_gaps}.`,
      evidenceFields: [
        "candidate_summary.tensions",
        "candidate_summary.knowledge_gaps",
        "tension_candidates",
        "knowledge_gap_candidates",
      ],
    }),
    gate({
      gateId: "follow_up_work_gate",
      label: "Follow-up work gate",
      status: candidateSummary.follow_up_work > 0 ? "warn" : "pass",
      summary:
        candidateSummary.follow_up_work > 0
          ? "Follow-up work candidates require operator review."
          : "No follow-up work candidates were recorded.",
      detail: `Follow-up work candidate count ${candidateSummary.follow_up_work}; no work item is created by this preflight.`,
      evidenceFields: ["candidate_summary.follow_up_work", "follow_up_work_candidates"],
    }),
    gate({
      gateId: "label_metadata_gate",
      label: "Label metadata gate",
      status:
        detail.draft.lifecycle_summary.label_state === "untitled"
          ? "warn"
          : "pass",
      summary:
        detail.draft.lifecycle_summary.label_state === "untitled"
          ? "Operator preview label is missing."
          : "Operator preview label is present.",
      detail:
        detail.draft.lifecycle_summary.label_state === "untitled"
          ? "Labels are metadata only, but an operator-readable label helps promotion discussion review."
          : "Label remains operator-facing preview metadata only, not a canonical title.",
      evidenceFields: ["operator_note_label", "lifecycle_summary.label_state"],
    }),
    gate({
      gateId: "activity_metadata_gate",
      label: "Activity metadata gate",
      status:
        detail.draft.lifecycle_summary.activity_count <= 1 ? "warn" : "pass",
      summary:
        detail.draft.lifecycle_summary.activity_count <= 1
          ? "Activity history contains creation only or no recorded metadata."
          : "Activity metadata exists beyond initial creation.",
      detail: `Activity count ${detail.draft.lifecycle_summary.activity_count}; loaded activity items ${activity?.items.length ?? 0}. Activity is metadata only, not approval history.`,
      evidenceFields: [
        "lifecycle_summary.activity_count",
        "lifecycle_summary.last_activity_type",
        "activity.items",
      ],
    }),
    gate({
      gateId: "canonical_link_guard_gate",
      label: "Canonical link guard gate",
      status: storedLinks.length > 0 ? "block" : "pass",
      summary:
        storedLinks.length > 0
          ? "Stored draft has unexpected canonical/proof/evidence/work link fields."
          : "No canonical/proof/evidence/work link fields are set.",
      detail:
        storedLinks.length > 0
          ? "Preflight is blocked because a preview draft should not already point to canonical authority records."
          : "promoted_at, canonical_perspective_id, proof_id, evidence_id, and work_item_id are null.",
      evidenceFields: [
        "promoted_at",
        "canonical_perspective_id",
        "proof_id",
        "evidence_id",
        "work_item_id",
      ],
    }),
  ];
}

function gate({
  gateId,
  label,
  status,
  summary,
  detail,
  evidenceFields,
}: {
  gateId: ManualNotePreviewDraftPromotionReadinessGateId;
  label: string;
  status: ManualNotePreviewDraftPromotionReadinessGateStatus;
  summary: string;
  detail: string;
  evidenceFields: string[];
}): ManualNotePreviewDraftPromotionReadinessGateResult {
  return {
    gate_id: gateId,
    label,
    status,
    summary,
    detail,
    evidence_fields: evidenceFields,
    no_side_effects: true,
  };
}

function getReadinessStatus(
  gateResults: ManualNotePreviewDraftPromotionReadinessGateResult[],
): ManualNotePreviewDraftPromotionReadinessStatus {
  if (gateResults.some((gateResult) => gateResult.status === "block")) {
    return "blocked";
  }

  if (gateResults.some((gateResult) => gateResult.status === "warn")) {
    return "needs_operator_review";
  }

  return "ready_for_promotion_discussion";
}

function getReadinessScore(
  gateResults: ManualNotePreviewDraftPromotionReadinessGateResult[],
  readinessStatus: ManualNotePreviewDraftPromotionReadinessStatus,
) {
  const blockCount = gateResults.filter((gateResult) => gateResult.status === "block")
    .length;
  const warnCount = gateResults.filter((gateResult) => gateResult.status === "warn")
    .length;
  const baseScore = Math.max(0, 100 - blockCount * 25 - warnCount * 8);

  if (readinessStatus === "blocked") return Math.min(baseScore, 49);
  if (readinessStatus === "needs_operator_review") return Math.min(baseScore, 79);
  return baseScore;
}

function buildNextReviewSteps(
  gateResults: ManualNotePreviewDraftPromotionReadinessGateResult[],
  readinessStatus: ManualNotePreviewDraftPromotionReadinessStatus,
) {
  const steps: string[] = [];

  if (readinessStatus === "blocked") {
    steps.push("Resolve block gates before using this draft in promotion discussion.");
  }

  if (readinessStatus === "needs_operator_review") {
    steps.push("Review warning gates with the operator before promotion discussion.");
  }

  if (readinessStatus === "ready_for_promotion_discussion") {
    steps.push(
      "Discuss whether a separate authority-gated promotion design should be opened.",
    );
  }

  steps.push("Review source references, claim candidates, and evidence candidates.");

  if (
    gateResults.some(
      (gateResult) =>
        gateResult.gate_id === "tension_gap_gate" &&
        gateResult.status === "warn",
    )
  ) {
    steps.push("Resolve or explicitly carry tensions and knowledge gaps.");
  }

  steps.push("Do not treat this preflight as promotion authority.");

  return steps;
}

function buildSourceSummary(
  preview: ResearchCandidateReviewPreviewResponse,
): ManualNotePreviewDraftPromotionSourceSummary {
  const sourceRefs = Array.isArray(preview.source_reference_previews)
    ? preview.source_reference_previews
    : [];

  return {
    source_ref_count: sourceRefs.length,
    source_titles: sourceRefs.map((sourceRef) => sourceRef.title).filter(Boolean),
    source_identifiers: sourceRefs
      .map((sourceRef) => sourceRef.identifier_or_url)
      .filter(Boolean),
    source_statuses: sourceRefs
      .map((sourceRef) => sourceRef.source_status)
      .filter(Boolean),
    source_boundary_notes: sourceRefs
      .map((sourceRef) => sourceRef.boundary_notes)
      .filter(Boolean),
  };
}

function buildCandidateSummary(
  preview: ResearchCandidateReviewPreviewResponse,
): ManualNotePreviewDraftPromotionCandidateSummary {
  const claims = Array.isArray(preview.claim_candidates)
    ? preview.claim_candidates.length
    : 0;
  const evidence = Array.isArray(preview.evidence_candidates)
    ? preview.evidence_candidates.length
    : 0;
  const tensions = Array.isArray(preview.tension_candidates)
    ? preview.tension_candidates.length
    : 0;
  const knowledgeGaps = Array.isArray(preview.knowledge_gap_candidates)
    ? preview.knowledge_gap_candidates.length
    : 0;
  const perspectiveDeltas = Array.isArray(preview.perspective_delta_candidates)
    ? preview.perspective_delta_candidates.length
    : 0;
  const followUpWork = Array.isArray(preview.follow_up_work_candidates)
    ? preview.follow_up_work_candidates.length
    : 0;

  return {
    total:
      claims +
      evidence +
      tensions +
      knowledgeGaps +
      perspectiveDeltas +
      followUpWork,
    claims,
    evidence,
    tensions,
    knowledge_gaps: knowledgeGaps,
    perspective_deltas: perspectiveDeltas,
    follow_up_work: followUpWork,
  };
}

function getPreviewShapeBlockers(preview: ResearchCandidateReviewPreviewResponse) {
  const blockers: string[] = [];

  if (!preview.research_session_preview) {
    blockers.push("research_session_preview is missing.");
  }

  for (const [field, value] of [
    ["source_reference_previews", preview.source_reference_previews],
    ["claim_candidates", preview.claim_candidates],
    ["evidence_candidates", preview.evidence_candidates],
    ["tension_candidates", preview.tension_candidates],
    ["knowledge_gap_candidates", preview.knowledge_gap_candidates],
    ["perspective_delta_candidates", preview.perspective_delta_candidates],
    ["follow_up_work_candidates", preview.follow_up_work_candidates],
  ] as const) {
    if (!Array.isArray(value)) {
      blockers.push(`${field} is missing or malformed.`);
    }
  }

  return blockers;
}
