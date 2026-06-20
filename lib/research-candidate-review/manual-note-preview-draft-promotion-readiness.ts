import type {
  ResearchCandidateManualNotePreviewDraftActivityList,
  ResearchCandidateManualNotePreviewDraftDetail,
} from "@/lib/research-candidate-review/manual-note-preview-draft-store";
import {
  buildManualNotePreviewDraftPromotionReadinessAuthority,
  buildManualNotePreviewDraftPromotionReadinessBoundary,
  buildManualNotePreviewNoSideEffects,
  type ManualNotePreviewDraftPromotionCandidateSummary,
  type ManualNotePreviewDraftPromotionReadinessGateExplanation,
  type ManualNotePreviewDraftPromotionReadinessGateId,
  type ManualNotePreviewDraftPromotionReadinessGateResult,
  type ManualNotePreviewDraftPromotionReadinessGateStatus,
  type ManualNotePreviewDraftPromotionReadinessResolutionBoundary,
  type ManualNotePreviewDraftPromotionReadinessResolutionHint,
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

const PREVIEW_RESOLUTION_BOUNDARY: ManualNotePreviewDraftPromotionReadinessResolutionBoundary =
  {
    preview_metadata_only: true,
    does_not_promote: true,
    does_not_write_proof_or_evidence: true,
    does_not_create_work_item: true,
    does_not_fetch_sources: true,
    does_not_run_retrieval: true,
    does_not_call_provider: true,
    does_not_update_perspective: true,
  };

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
    gate_explanation: buildGateExplanation({
      gateId,
      label,
      status,
      summary,
      detail,
      evidenceFields,
    }),
    no_side_effects: true,
  };
}

function buildGateExplanation({
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
}): ManualNotePreviewDraftPromotionReadinessGateExplanation {
  const currentSignal = `${status}: ${summary} ${detail}`;

  switch (gateId) {
    case "lifecycle_gate":
      return explanation({
        title: "Lifecycle state must be active preview metadata",
        explanation:
          status === "block"
            ? "This preview draft is discarded. Discard is lifecycle hygiene for preview drafts, so this draft should not be used for promotion discussion."
            : "This preview draft is active preview metadata and has no discard marker.",
        why:
          "Operators need to distinguish active preview material from inactive preview drafts without treating discard as a review decision.",
        currentSignal,
        actions:
          status === "block"
            ? [
                safeAction(
                  "Inspect Preview draft activity for the discard metadata.",
                  "existing_preview_surface",
                ),
                safeAction(
                  "Create a new runtime preview draft from revised source material if the material is still needed.",
                  "new_preview_draft",
                ),
                safeAction(
                  "Do not undiscard or promote this draft in this lane.",
                  "separate_future_lane",
                ),
              ]
            : [
                safeAction(
                  "Keep using the active stored preview draft for read-only inspection.",
                  "existing_preview_surface",
                ),
              ],
        surfaces: [
          "Recent runtime preview drafts",
          "Open preview draft",
          "Preview draft activity",
        ],
        evidenceFields,
        canResolveInLane: status !== "block",
      });
    case "storage_boundary_gate":
      return explanation({
        title: "Stored preview shape and raw-note boundary",
        explanation:
          "The preflight expects parsed preview JSON metadata only. Raw manual note text must remain unavailable and unpersisted.",
        why:
          "Promotion discussion readiness is only meaningful if it is based on a bounded preview record, not hidden raw-note storage or malformed stored JSON.",
        currentSignal,
        actions:
          status === "block"
            ? [
                safeAction(
                  "Inspect stored preview draft metadata and runtime boundary fields.",
                  "existing_preview_surface",
                ),
                safeAction(
                  "Create a new runtime preview draft if the stored preview shape is malformed.",
                  "new_preview_draft",
                ),
                safeAction(
                  "Do not repair or mutate database rows in this lane.",
                  "stop_and_inspect",
                ),
              ]
            : [
                safeAction(
                  "Continue inspecting the stored preview JSON and boundary readout.",
                  "existing_preview_surface",
                ),
              ],
        surfaces: [
          "Stored preview draft metadata",
          "Runtime boundary",
          "Create runtime preview draft",
        ],
        evidenceFields,
        canResolveInLane: status !== "block",
      });
    case "authority_boundary_gate":
      return explanation({
        title: "Preview authority must remain non-canonical",
        explanation:
          "The preview draft must not indicate canonical Perspective, proof/evidence, workflow, provider, retrieval, or work item authority.",
        why:
          "If preview-only authority is contaminated, operators cannot trust this readout as a non-authoritative discussion aid.",
        currentSignal,
        actions:
          status === "block"
            ? [
                safeAction(
                  "Stop and inspect stored authority fields and runtime boundary fields.",
                  "stop_and_inspect",
                ),
                safeAction(
                  "Do not proceed with promotion discussion from this draft.",
                  "separate_future_lane",
                ),
                safeAction(
                  "Do not cleanup or mutate authority fields in this lane.",
                  "stop_and_inspect",
                ),
              ]
            : [
                safeAction(
                  "Keep the preflight as read-only guidance and continue reviewing candidate metadata.",
                  "existing_preview_surface",
                ),
              ],
        surfaces: ["Runtime boundary", "Stored preview draft metadata"],
        evidenceFields,
        canResolveInLane: false,
      });
    case "parser_warning_gate":
      return explanation({
        title: "Parser warnings need operator review",
        explanation:
          "Parser warnings mark missing or ambiguous manual note structure. Critical warnings block promotion discussion readiness.",
        why:
          "The deterministic parser is the only source for this preview. Missing research question, operator intent, or source title weakens the operator review frame.",
        currentSignal,
        actions: [
          safeAction(
            "Inspect the parser warning summary beside the preview result.",
            "existing_preview_surface",
          ),
          safeAction(
            "Create a new preview draft with clearer Research Question, Operator Intent, and Source Title lines.",
            "new_preview_draft",
          ),
          safeAction(
            "Do not use provider extraction or retrieval to fill missing fields.",
            "separate_future_lane",
          ),
        ],
        surfaces: [
          "Warning summary",
          "Manual note input",
          "Create runtime preview draft",
        ],
        evidenceFields,
        canResolveInLane: true,
      });
    case "source_reference_gate":
      return explanation({
        title: "Source reference metadata is required",
        explanation:
          "The preview needs source reference metadata so operators can understand what source material the candidates came from.",
        why:
          "Source references support human review context without fetching, validating, indexing, or treating URLs as truth.",
        currentSignal,
        actions: [
          safeAction(
            "Inspect the source reference preview list.",
            "existing_preview_surface",
          ),
          safeAction(
            "Paste a revised note with Source Title, Source Origin, and Source Identifier lines.",
            "new_preview_draft",
          ),
          safeAction(
            "Do not fetch or externally validate source URLs in this lane.",
            "separate_future_lane",
          ),
        ],
        surfaces: [
          "Source references",
          "Manual note input",
          "Create runtime preview draft",
        ],
        evidenceFields,
        canResolveInLane: true,
      });
    case "claim_candidate_gate":
      return explanation({
        title: "At least one claim candidate is needed",
        explanation:
          "The draft needs an explicit claim candidate before it can be discussed as candidate research material.",
        why:
          "Without a claim candidate, there is no concrete candidate assertion for the operator to review.",
        currentSignal,
        actions: [
          safeAction("Inspect the claim candidate list.", "existing_preview_surface"),
          safeAction(
            "Paste a revised note with explicit Claim lines.",
            "new_preview_draft",
          ),
          safeAction(
            "Do not synthesize claims with a provider in this lane.",
            "separate_future_lane",
          ),
        ],
        surfaces: [
          "Claim candidates",
          "Manual note input",
          "Create runtime preview draft",
        ],
        evidenceFields,
        canResolveInLane: true,
      });
    case "evidence_candidate_gate":
      return explanation({
        title: "Evidence candidates remain preview-only",
        explanation:
          "Evidence candidate coverage helps operators review the source-bound support for claims. Missing evidence candidates need human review, not proof writes.",
        why:
          "Evidence candidates are not proof or evidence records, but their absence affects discussion readiness.",
        currentSignal,
        actions: [
          safeAction(
            "Inspect evidence candidates and source references.",
            "existing_preview_surface",
          ),
          safeAction(
            "Paste a revised note with explicit Evidence lines when source-bound support is available.",
            "new_preview_draft",
          ),
          safeAction(
            "Do not write proof or evidence records in this lane.",
            "separate_future_lane",
          ),
        ],
        surfaces: [
          "Evidence candidates",
          "Source references",
          "Manual note input",
        ],
        evidenceFields,
        canResolveInLane: true,
      });
    case "tension_gap_gate":
      return explanation({
        title: "Tensions and gaps require operator review",
        explanation:
          "Tensions and knowledge gaps are not errors. They indicate uncertainty that should be explicitly reviewed before any future authority-gated design.",
        why:
          "Carrying uncertainty forward intentionally is safer than allowing candidate material to appear settled.",
        currentSignal,
        actions: [
          safeAction(
            "Inspect tension and knowledge gap candidate lists.",
            "existing_preview_surface",
          ),
          safeAction(
            "Decide whether to carry the gap into a separate future design lane.",
            "separate_future_lane",
          ),
          safeAction(
            "Do not create work items from this preflight.",
            "separate_future_lane",
          ),
        ],
        surfaces: ["Tensions", "Knowledge gaps", "Candidate summary"],
        evidenceFields,
        canResolveInLane: true,
      });
    case "follow_up_work_gate":
      return explanation({
        title: "Follow-up work candidates are suggestions only",
        explanation:
          "Follow-up work candidates are parsed suggestions from the note. They are not work items and do not trigger any assignment or queue.",
        why:
          "Operators need to review suggested next work separately so preview material does not silently become durable work.",
        currentSignal,
        actions: [
          safeAction(
            "Inspect follow-up work candidates.",
            "existing_preview_surface",
          ),
          safeAction(
            "Decide separately whether a future work item lane is needed.",
            "separate_future_lane",
          ),
          safeAction(
            "Do not create work items in this lane.",
            "separate_future_lane",
          ),
        ],
        surfaces: ["Follow-up work", "Candidate summary"],
        evidenceFields,
        canResolveInLane: false,
      });
    case "label_metadata_gate":
      return explanation({
        title: "Operator labels improve scanability only",
        explanation:
          "The label is operator-facing preview metadata. It is not a canonical title and does not classify the draft.",
        why:
          "Readable labels help operators scan drafts without granting authority to the preview record.",
        currentSignal,
        actions: [
          safeAction(
            "Use the existing Edit label, Save label, Cancel, or Clear label controls.",
            "existing_preview_surface",
          ),
          safeAction(
            "Keep the label descriptive without treating it as a Perspective node title.",
            "existing_preview_surface",
          ),
        ],
        surfaces: ["Recent runtime preview drafts", "Edit label"],
        evidenceFields,
        canResolveInLane: true,
      });
    case "activity_metadata_gate":
      return explanation({
        title: "Activity metadata is lifecycle context",
        explanation:
          "Activity metadata shows create, label, clear-label, and discard lifecycle events for the preview draft.",
        why:
          "Lifecycle context helps reviewers understand the preview draft history without creating approval history.",
        currentSignal,
        actions: [
          safeAction(
            "Use Load activity or Refresh activity to inspect recorded lifecycle metadata.",
            "existing_preview_surface",
          ),
          safeAction(
            "Review created, label, clear-label, and discard history when present.",
            "existing_preview_surface",
          ),
          safeAction(
            "Do not treat activity as approval history.",
            "separate_future_lane",
          ),
        ],
        surfaces: ["Preview draft activity", "Load activity", "Refresh activity"],
        evidenceFields,
        canResolveInLane: true,
      });
    case "canonical_link_guard_gate":
      return explanation({
        title: "Canonical link fields must remain null",
        explanation:
          "Preview draft link fields for promotion, canonical Perspective, proof, evidence, and work items must remain null.",
        why:
          "Non-null authority links would mean the preview draft no longer looks like isolated preview metadata.",
        currentSignal,
        actions:
          status === "block"
            ? [
                safeAction(
                  "Stop and review data integrity if any authority link field is non-null.",
                  "stop_and_inspect",
                ),
                safeAction(
                  "Do not mutate, repair, or cleanup link fields in this lane.",
                  "stop_and_inspect",
                ),
              ]
            : [
                safeAction(
                  "Continue review with the canonical/proof/evidence/work link fields remaining null.",
                  "existing_preview_surface",
                ),
              ],
        surfaces: ["Stored preview draft metadata", "Runtime boundary"],
        evidenceFields,
        canResolveInLane: false,
      });
  }
}

function explanation({
  title,
  explanation,
  why,
  currentSignal,
  actions,
  surfaces,
  evidenceFields,
  canResolveInLane,
}: {
  title: string;
  explanation: string;
  why: string;
  currentSignal: string;
  actions: ManualNotePreviewDraftPromotionReadinessResolutionHint[];
  surfaces: string[];
  evidenceFields: string[];
  canResolveInLane: boolean;
}): ManualNotePreviewDraftPromotionReadinessGateExplanation {
  return {
    explanation_title: title,
    operator_explanation: explanation,
    why_it_matters: why,
    current_signal: currentSignal,
    suggested_safe_actions: actions,
    related_ui_surfaces: surfaces,
    related_evidence_fields: evidenceFields,
    can_be_resolved_in_current_preview_lane: canResolveInLane,
    resolution_boundary: PREVIEW_RESOLUTION_BOUNDARY,
  };
}

function safeAction(
  safeActionText: string,
  actionScope: ManualNotePreviewDraftPromotionReadinessResolutionHint["action_scope"],
): ManualNotePreviewDraftPromotionReadinessResolutionHint {
  return {
    safe_action: safeActionText,
    action_scope: actionScope,
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
