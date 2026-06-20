import {
  buildManualNotePromotionBoundaryAudit,
  type ManualNotePromotionBoundaryAudit,
} from "@/lib/research-candidate-review/manual-note-promotion-boundary-audit";
import type {
  ResearchCandidateManualNotePreviewDraftActivityList,
  ResearchCandidateManualNotePreviewDraftDetail,
} from "@/lib/research-candidate-review/manual-note-preview-draft-store";
import {
  MANUAL_NOTE_RUNTIME_VERSION,
  buildManualNotePreviewNoSideEffects,
  type ManualNotePreviewDraftPromotionDryRunAuthority,
  type ManualNotePreviewDraftPromotionDryRunBlockedSideEffect,
  type ManualNotePreviewDraftPromotionDryRunCopyBoundary,
  type ManualNotePreviewDraftPromotionDryRunHypotheticalTargets,
  type ManualNotePreviewDraftPromotionDryRunPlanOkResponse,
  type ManualNotePreviewDraftPromotionDryRunReadinessSnapshot,
  type ManualNotePreviewDraftPromotionDryRunRequiredAuthority,
  type ManualNotePreviewDraftPromotionDryRunRuntimeBoundary,
  type ManualNotePreviewDraftPromotionDryRunStatus,
  type ManualNotePreviewDraftPromotionReadinessGateId,
  type ManualNotePreviewDraftPromotionReadinessOkResponse,
} from "@/lib/research-candidate-review/manual-note-runtime-preview";

export const MANUAL_NOTE_PROMOTION_DRY_RUN_PLAN_VERSION =
  "manual_note_promotion_dry_run_plan.v0.1" as const;

type BuildManualNotePreviewDraftPromotionDryRunPlanInput = {
  detail: ResearchCandidateManualNotePreviewDraftDetail;
  activity: ResearchCandidateManualNotePreviewDraftActivityList | null;
  readiness: ManualNotePreviewDraftPromotionReadinessOkResponse;
  boundaryAudit?: ManualNotePromotionBoundaryAudit;
  route: string;
};

type ManualNotePromotionDryRunPlanCopySource = Omit<
  ManualNotePreviewDraftPromotionDryRunPlanOkResponse,
  "local_copy_packet"
>;

const REQUIRED_AUTHORITIES_BEFORE_WRITE: ManualNotePreviewDraftPromotionDryRunRequiredAuthority[] =
  [
    {
      authority_id: "operator_promotion_decision",
      required: true,
      reason:
        "An operator must explicitly select the preview draft, candidate material, and write intent before any future promotion lane can write.",
    },
    {
      authority_id: "durable_write_contract",
      required: true,
      reason:
        "A future write lane must define exact durable records, idempotency keys, and rollback behavior.",
    },
    {
      authority_id: "source_evidence_authority_model",
      required: true,
      reason:
        "Source references and evidence candidates are unverified preview metadata in this lane.",
    },
    {
      authority_id: "proof_evidence_write_authority",
      required: true,
      reason:
        "Evidence candidates are not proof or evidence records and cannot become records without separate authority.",
    },
    {
      authority_id: "canonical_perspective_write_authority",
      required: true,
      reason:
        "Perspective/canonical graph writes require a separate authority contract and target selection.",
    },
    {
      authority_id: "idempotency_and_rollback_contract",
      required: true,
      reason:
        "Actual writes must be repeat-safe and recoverable before a write path exists.",
    },
    {
      authority_id: "review_audit_record_contract",
      required: true,
      reason:
        "Future write design needs explicit review/audit semantics; preview activity is not approval history.",
    },
  ];

const BLOCKED_SIDE_EFFECTS: ManualNotePreviewDraftPromotionDryRunBlockedSideEffect[] =
  [
    {
      side_effect_id: "proof_or_evidence_writes",
      blocked: true,
      performed: false,
    },
    {
      side_effect_id: "perspective_or_canonical_writes",
      blocked: true,
      performed: false,
    },
    { side_effect_id: "work_item_creation", blocked: true, performed: false },
    {
      side_effect_id: "provider_or_openai_calls",
      blocked: true,
      performed: false,
    },
    { side_effect_id: "retrieval_or_rag", blocked: true, performed: false },
    { side_effect_id: "source_fetching", blocked: true, performed: false },
    {
      side_effect_id: "external_handoff_sending",
      blocked: true,
      performed: false,
    },
    { side_effect_id: "browser_persistence", blocked: true, performed: false },
    {
      side_effect_id: "dry_run_plan_persistence",
      blocked: true,
      performed: false,
    },
  ];

const LOCAL_COPY_BOUNDARY: ManualNotePreviewDraftPromotionDryRunCopyBoundary = {
  local_clipboard_only: true,
  external_handoff_sent: false,
  dry_run_plan_persisted: false,
  promotion_authority_granted: false,
  actual_promotion_allowed: false,
};

export function buildManualNotePreviewDraftPromotionDryRunPlan({
  detail,
  activity,
  readiness,
  boundaryAudit = buildManualNotePromotionBoundaryAudit(),
  route,
}: BuildManualNotePreviewDraftPromotionDryRunPlanInput): ManualNotePreviewDraftPromotionDryRunPlanOkResponse {
  const dryRunStatus = getDryRunStatus(readiness);
  const readinessSnapshot = summarizeManualNotePromotionDryRunGateSnapshot(
    readiness,
  );
  const hypotheticalTargets = buildHypotheticalTargets(detail);
  const planWithoutCopyPacket: ManualNotePromotionDryRunPlanCopySource = {
    ok: true,
    runtime_version: MANUAL_NOTE_RUNTIME_VERSION,
    preview_draft_id: detail.draft.preview_draft_id,
    dry_run_plan_version: MANUAL_NOTE_PROMOTION_DRY_RUN_PLAN_VERSION,
    dry_run_status: dryRunStatus,
    dry_run_summary: buildDryRunSummary({
      dryRunStatus,
      readiness,
      activity,
    }),
    selected_preview_draft: {
      preview_draft_id: detail.draft.preview_draft_id,
      operator_note_label: detail.draft.operator_note_label,
      lifecycle_status: detail.lifecycle_status,
      parser_version: detail.draft.parser_version,
      preview_version: detail.draft.preview_version,
      input_fingerprint: detail.draft.input_fingerprint,
      warning_count: detail.warnings.length,
      candidate_count_summary: detail.draft.candidate_count_summary,
      created_at: detail.draft.created_at,
      updated_at: detail.draft.updated_at,
    },
    readiness_snapshot: readinessSnapshot,
    boundary_audit_snapshot: {
      audit_kind: boundaryAudit.audit_kind,
      audit_version: boundaryAudit.audit_version,
      readiness_is_not_promotion_authority:
        boundaryAudit.authority_statement
          .readiness_is_not_promotion_authority,
      ready_for_promotion_discussion_is_not_write_authority:
        boundaryAudit.authority_statement
          .ready_for_promotion_discussion_is_not_write_authority,
      actual_promotion_allowed:
        boundaryAudit.authority_statement.actual_promotion_allowed,
      dry_run_promotion_allowed_by_this_audit:
        boundaryAudit.authority_statement.dry_run_promotion_allowed_by_this_audit,
      next_recommended_slice: boundaryAudit.next_recommended_slice,
    },
    hypothetical_targets: hypotheticalTargets,
    proposed_canonical_deltas: {
      hypothetical_only: true,
      no_canonical_ids: true,
      no_proof_ids: true,
      no_evidence_ids: true,
      no_work_item_ids: true,
      no_db_write_refs: true,
      source_reference_delta_count:
        hypotheticalTargets.source_reference_targets.length,
      claim_delta_count: hypotheticalTargets.claim_targets.length,
      evidence_delta_count: hypotheticalTargets.evidence_targets.length,
      perspective_delta_count:
        hypotheticalTargets.perspective_delta_targets.length,
      follow_up_work_delta_count:
        hypotheticalTargets.follow_up_work_targets.length,
      delta_summaries: buildHypotheticalDeltaSummaries(hypotheticalTargets),
    },
    required_authorities_before_write: REQUIRED_AUTHORITIES_BEFORE_WRITE.map(
      copyRequiredAuthority,
    ),
    blocked_side_effects: BLOCKED_SIDE_EFFECTS.map(copyBlockedSideEffect),
    operator_next_steps: buildOperatorNextSteps({
      dryRunStatus,
      readiness,
    }),
    authority: buildManualNotePreviewDraftPromotionDryRunAuthority(),
    runtime_boundary: buildManualNotePreviewDraftPromotionDryRunBoundary({
      route,
    }),
    no_side_effects: buildManualNotePreviewNoSideEffects(),
  };

  return {
    ...planWithoutCopyPacket,
    local_copy_packet: {
      markdown:
        buildManualNotePreviewDraftPromotionDryRunMarkdown(
          planWithoutCopyPacket,
        ),
      json: buildManualNotePreviewDraftPromotionDryRunJsonPacket(
        planWithoutCopyPacket,
      ),
      boundary: { ...LOCAL_COPY_BOUNDARY },
    },
  };
}

export function buildManualNotePreviewDraftPromotionDryRunMarkdown(
  plan: ManualNotePromotionDryRunPlanCopySource,
) {
  return [
    "# Research Candidate Preview Draft No-Write Promotion Dry-Run Plan",
    "",
    "This is not promotion.",
    "No proof/evidence, Perspective, canonical graph, or work item writes are performed.",
    "Source references are not fetched or verified.",
    "Provider/retrieval is not used.",
    "",
    `dry_run_plan_version: ${plan.dry_run_plan_version}`,
    `preview_draft_id: ${plan.preview_draft_id}`,
    `dry_run_status: ${plan.dry_run_status}`,
    `dry_run_summary: ${plan.dry_run_summary}`,
    "",
    "## Selected Preview Draft",
    formatMixedMap(plan.selected_preview_draft),
    "",
    "## Readiness Snapshot",
    formatMixedMap(plan.readiness_snapshot),
    "",
    "## Boundary Audit Snapshot",
    formatMixedMap(plan.boundary_audit_snapshot),
    "",
    "## Hypothetical Targets",
    `source_reference_targets: ${plan.hypothetical_targets.source_reference_targets.length}`,
    `claim_targets: ${plan.hypothetical_targets.claim_targets.length}`,
    `evidence_targets: ${plan.hypothetical_targets.evidence_targets.length}`,
    `tension_gap_targets: ${plan.hypothetical_targets.tension_gap_targets.length}`,
    `perspective_delta_targets: ${plan.hypothetical_targets.perspective_delta_targets.length}`,
    `follow_up_work_targets: ${plan.hypothetical_targets.follow_up_work_targets.length}`,
    "",
    "## Proposed Canonical Deltas",
    formatMixedMap(plan.proposed_canonical_deltas),
    "",
    "## Required Authorities Before Write",
    formatAuthorityList(plan.required_authorities_before_write),
    "",
    "## Blocked Side Effects",
    formatBlockedSideEffects(plan.blocked_side_effects),
    "",
    "## Operator Next Steps",
    formatList(plan.operator_next_steps, "No next steps."),
    "",
    "## Runtime Boundary",
    formatMixedMap(plan.runtime_boundary),
    "",
    "Local copy boundary:",
    formatMixedMap(LOCAL_COPY_BOUNDARY),
  ].join("\n");
}

export function buildManualNotePreviewDraftPromotionDryRunJsonPacket(
  plan: ManualNotePromotionDryRunPlanCopySource,
) {
  return JSON.stringify(
    {
      ...plan,
      local_copy_boundary: LOCAL_COPY_BOUNDARY,
    },
    null,
    2,
  );
}

export function buildManualNotePreviewDraftPromotionDryRunBoundary({
  route,
}: {
  route: string;
}): ManualNotePreviewDraftPromotionDryRunRuntimeBoundary {
  return {
    route,
    runtime_version: MANUAL_NOTE_RUNTIME_VERSION,
    source_kind: "stored_manual_paste_preview_draft",
    dry_run_actions: "build_no_write_promotion_plan_only",
    dry_run_only: true,
    dry_run_plan_persisted: false,
    readiness_is_not_promotion_authority: true,
    ready_for_promotion_discussion_is_not_write_authority: true,
    raw_manual_note_text_persisted: false,
    raw_manual_note_text_returned: false,
    proof_or_evidence_writes: false,
    canonical_perspective_write: false,
    canonical_graph_write: false,
    work_item_creation: false,
    approval_workflow_created: false,
    publication_workflow_created: false,
    promotion_workflow_created: false,
    provider_or_openai_calls: false,
    retrieval_or_rag: false,
    source_fetching: false,
    external_handoff_sending: false,
    browser_persistence: false,
  };
}

export function buildManualNotePreviewDraftPromotionDryRunAuthority(): ManualNotePreviewDraftPromotionDryRunAuthority {
  return {
    dry_run_only: true,
    no_write_plan_only: true,
    readiness_is_not_promotion_authority: true,
    ready_for_promotion_discussion_is_not_write_authority: true,
    actual_promotion_allowed: false,
    promotion_authority_granted: false,
    proof_or_evidence_writes: false,
    perspective_or_canonical_writes: false,
    canonical_perspective_write: false,
    canonical_graph_write: false,
    work_item_creation: false,
    provider_or_openai_calls: false,
    retrieval_or_rag: false,
    source_fetching: false,
    external_handoff_sent: false,
    dry_run_plan_persisted: false,
    browser_persistence: false,
  };
}

export function summarizeManualNotePromotionDryRunGateSnapshot(
  readiness: ManualNotePreviewDraftPromotionReadinessOkResponse,
): ManualNotePreviewDraftPromotionDryRunReadinessSnapshot {
  const gateIdsByStatus = getGateIdsByStatus(readiness);

  return {
    readiness_status: readiness.readiness_status,
    readiness_score: readiness.readiness_score,
    blocker_count: gateIdsByStatus.block.length,
    warning_count: gateIdsByStatus.warn.length,
    gate_count: readiness.gate_results.length,
    blocking_gate_ids: gateIdsByStatus.block,
    warning_gate_ids: gateIdsByStatus.warn,
    pass_gate_ids: gateIdsByStatus.pass,
  };
}

function getDryRunStatus(
  readiness: ManualNotePreviewDraftPromotionReadinessOkResponse,
): ManualNotePreviewDraftPromotionDryRunStatus {
  if (readiness.readiness_status === "blocked") return "blocked";
  if (readiness.readiness_status === "needs_operator_review") {
    return "needs_operator_review";
  }
  return "plan_ready";
}

function buildDryRunSummary({
  dryRunStatus,
  readiness,
  activity,
}: {
  dryRunStatus: ManualNotePreviewDraftPromotionDryRunStatus;
  readiness: ManualNotePreviewDraftPromotionReadinessOkResponse;
  activity: ResearchCandidateManualNotePreviewDraftActivityList | null;
}) {
  const activityCount = activity?.items.length ?? 0;
  if (dryRunStatus === "blocked") {
    return `No-write dry-run plan is blocked by ${readiness.blockers.length} readiness blocker(s). Activity metadata read count ${activityCount}.`;
  }
  if (dryRunStatus === "needs_operator_review") {
    return `No-write dry-run plan is available for operator review with ${readiness.warnings.length} warning(s); it grants no write authority.`;
  }
  return "No-write dry-run plan is ready for operator discussion; actual promotion still requires a separate authority-gated write design.";
}

function buildHypotheticalTargets(
  detail: ResearchCandidateManualNotePreviewDraftDetail,
): ManualNotePreviewDraftPromotionDryRunHypotheticalTargets {
  const preview = detail.preview;

  return {
    source_reference_targets: preview.source_reference_previews.map(
      (sourceReference) => ({
        source_ref_id: sourceReference.source_ref_id,
        title: sourceReference.title,
        identifier_or_url: sourceReference.identifier_or_url,
        source_status: sourceReference.source_status,
        boundary_notes: sourceReference.boundary_notes,
        target_status: "unverified_source_metadata_only",
        source_fetched_or_verified: false,
      }),
    ),
    claim_targets: preview.claim_candidates.map((claim) => ({
      claim_candidate_id: claim.claim_candidate_id,
      claim_text: claim.claim_text,
      claim_type: claim.claim_type,
      confidence_label: claim.confidence_label,
      target_status: "candidate_claim_no_write",
      needs_operator_selection: true,
      canonical_claim_id: null,
    })),
    evidence_targets: preview.evidence_candidates.map((evidence) => ({
      evidence_candidate_id: evidence.evidence_candidate_id,
      claim_candidate_id: evidence.claim_candidate_id,
      evidence_summary: evidence.evidence_summary,
      evidence_role: evidence.evidence_role,
      target_status: "candidate_evidence_no_write",
      requires_proof_evidence_authority: true,
      proof_id: null,
      evidence_id: null,
    })),
    tension_gap_targets: [
      ...preview.tension_candidates.map((tension) => ({
        target_id: tension.tension_candidate_id,
        target_kind: "tension" as const,
        summary: tension.summary,
        target_status: "unresolved_non_canonical" as const,
        canonical_record_id: null,
      })),
      ...preview.knowledge_gap_candidates.map((gap) => ({
        target_id: gap.knowledge_gap_candidate_id,
        target_kind: "knowledge_gap" as const,
        summary: gap.summary,
        target_status: "unresolved_non_canonical" as const,
        canonical_record_id: null,
      })),
    ],
    perspective_delta_targets: preview.perspective_delta_candidates.map(
      (delta) => ({
        perspective_delta_candidate_id: delta.perspective_delta_candidate_id,
        target_perspective_key: delta.target_perspective_key,
        delta_type: delta.delta_type,
        proposed_update_summary: delta.proposed_update_summary,
        target_status: "candidate_perspective_delta_no_write",
        perspective_id: null,
        canonical_graph_edge_id: null,
      }),
    ),
    follow_up_work_targets: preview.follow_up_work_candidates.map((work) => ({
      follow_up_work_candidate_id: work.follow_up_work_candidate_id,
      candidate_title: work.candidate_title,
      candidate_summary: work.candidate_summary,
      target_status: "not_work_item",
      requires_separate_work_item_lane: true,
      work_item_id: null,
    })),
  };
}

function buildHypotheticalDeltaSummaries(
  targets: ManualNotePreviewDraftPromotionDryRunHypotheticalTargets,
) {
  return [
    `${targets.source_reference_targets.length} source reference target(s) remain unverified metadata.`,
    `${targets.claim_targets.length} claim candidate target(s) require operator selection.`,
    `${targets.evidence_targets.length} evidence candidate target(s) require proof/evidence authority before write.`,
    `${targets.perspective_delta_targets.length} Perspective delta target(s) remain no-write candidate deltas.`,
    `${targets.follow_up_work_targets.length} follow-up work target(s) remain non-work-item suggestions.`,
  ];
}

function buildOperatorNextSteps({
  dryRunStatus,
  readiness,
}: {
  dryRunStatus: ManualNotePreviewDraftPromotionDryRunStatus;
  readiness: ManualNotePreviewDraftPromotionReadinessOkResponse;
}) {
  if (dryRunStatus === "blocked") {
    return [
      "Resolve or inspect block gates before relying on this dry-run plan.",
      "Create a revised preview draft if the selected draft is discarded or structurally incomplete.",
      "Keep all hypothetical targets no-write and non-canonical.",
    ];
  }

  if (dryRunStatus === "needs_operator_review") {
    return [
      "Review warning gates and unresolved candidate context before any future design lane.",
      "Confirm source references remain unfetched and unverified.",
      "Decide whether a separate authority-gated write design is warranted.",
    ];
  }

  return [
    "Review hypothetical targets and proposed deltas with an operator.",
    "Use readiness as discussion input only, not write authority.",
    "Open a separate authority-gated write design before any actual promotion implementation.",
  ];
}

function getGateIdsByStatus(
  readiness: ManualNotePreviewDraftPromotionReadinessOkResponse,
) {
  return {
    block: readiness.gate_results
      .filter((gate) => gate.status === "block")
      .map((gate) => gate.gate_id),
    warn: readiness.gate_results
      .filter((gate) => gate.status === "warn")
      .map((gate) => gate.gate_id),
    pass: readiness.gate_results
      .filter((gate) => gate.status === "pass")
      .map((gate) => gate.gate_id),
  } satisfies Record<
    "block" | "warn" | "pass",
    ManualNotePreviewDraftPromotionReadinessGateId[]
  >;
}

function copyRequiredAuthority(
  value: ManualNotePreviewDraftPromotionDryRunRequiredAuthority,
): ManualNotePreviewDraftPromotionDryRunRequiredAuthority {
  return { ...value };
}

function copyBlockedSideEffect(
  value: ManualNotePreviewDraftPromotionDryRunBlockedSideEffect,
): ManualNotePreviewDraftPromotionDryRunBlockedSideEffect {
  return { ...value };
}

function formatAuthorityList(
  values: ManualNotePreviewDraftPromotionDryRunRequiredAuthority[],
) {
  return values
    .map(
      (value) =>
        `- ${value.authority_id}: required ${String(value.required)}; ${value.reason}`,
    )
    .join("\n");
}

function formatBlockedSideEffects(
  values: ManualNotePreviewDraftPromotionDryRunBlockedSideEffect[],
) {
  return values
    .map(
      (value) =>
        `- ${value.side_effect_id}: blocked ${String(value.blocked)}; performed ${String(value.performed)}`,
    )
    .join("\n");
}

function formatList(values: string[], emptyText: string) {
  if (values.length === 0) return emptyText;
  return values.map((value) => `- ${value}`).join("\n");
}

function formatMixedMap(values: Record<string, unknown>) {
  return Object.entries(values)
    .map(([key, value]) => `${key}: ${formatValue(value)}`)
    .join("\n");
}

function formatValue(value: unknown): string {
  if (value === null || typeof value === "undefined") return "none";
  if (Array.isArray(value)) return value.length > 0 ? value.join(", ") : "none";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}
