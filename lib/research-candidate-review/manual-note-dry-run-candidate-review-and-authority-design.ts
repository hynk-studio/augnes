import type {
  ManualNotePreviewDraftPromotionDryRunBlockedSideEffect,
  ManualNotePreviewDraftPromotionDryRunClaimTarget,
  ManualNotePreviewDraftPromotionDryRunEvidenceTarget,
  ManualNotePreviewDraftPromotionDryRunFollowUpWorkTarget,
  ManualNotePreviewDraftPromotionDryRunPerspectiveDeltaTarget,
  ManualNotePreviewDraftPromotionDryRunPlanOkResponse,
  ManualNotePreviewDraftPromotionDryRunRequiredAuthority,
  ManualNotePreviewDraftPromotionDryRunSourceReferenceTarget,
  ManualNotePreviewDraftPromotionDryRunTensionGapTarget,
} from "@/lib/research-candidate-review/manual-note-runtime-preview";

export const MANUAL_NOTE_DRY_RUN_CANDIDATE_REVIEW_PACKET_VERSION =
  "manual_note_dry_run_candidate_review_packet.v0.1" as const;

export const MANUAL_NOTE_AUTHORITY_GATED_PROMOTION_DESIGN_PACKET_VERSION =
  "manual_note_authority_gated_promotion_design_packet.v0.1" as const;

export type ManualNoteDryRunCandidateSelectionIds = {
  source_reference_target_ids: string[];
  claim_target_ids: string[];
  evidence_target_ids: string[];
  tension_gap_target_ids: string[];
  perspective_delta_target_ids: string[];
  follow_up_work_target_ids: string[];
};

type CandidateTargetCounts = {
  source_reference_targets: number;
  claim_targets: number;
  evidence_targets: number;
  tension_gap_targets: number;
  perspective_delta_targets: number;
  follow_up_work_targets: number;
  total: number;
};

type ManualNoteDryRunCandidateReviewAuthority = {
  local_review_only: true;
  selection_is_not_approval: true;
  selection_is_not_promotion_authority: true;
  actual_promotion_allowed: false;
  proof_or_evidence_writes: false;
  perspective_or_canonical_writes: false;
  canonical_graph_write: false;
  work_item_creation: false;
  provider_or_openai_calls: false;
  retrieval_or_rag: false;
  source_fetching: false;
  external_handoff_sent: false;
  packet_persisted: false;
  browser_persistence: false;
};

export type ManualNoteDryRunCandidateReviewPacket = {
  packet_kind: "manual_note_dry_run_candidate_review_packet";
  packet_version: typeof MANUAL_NOTE_DRY_RUN_CANDIDATE_REVIEW_PACKET_VERSION;
  packet_fingerprint: string;
  source_plan: {
    preview_draft_id: string;
    dry_run_plan_version: string;
    dry_run_status: string;
    readiness_status: string;
    readiness_score: number;
    plan_fingerprint: string;
  };
  selection_state: {
    selection_mode: "local_operator_screen_state";
    selection_persisted: false;
    selection_is_not_approval: true;
    selection_is_not_promotion_authority: true;
  };
  selected_counts: CandidateTargetCounts;
  unselected_counts: CandidateTargetCounts;
  selected_source_reference_targets: ManualNotePreviewDraftPromotionDryRunSourceReferenceTarget[];
  selected_claim_targets: ManualNotePreviewDraftPromotionDryRunClaimTarget[];
  selected_evidence_targets: ManualNotePreviewDraftPromotionDryRunEvidenceTarget[];
  selected_tension_gap_targets: ManualNotePreviewDraftPromotionDryRunTensionGapTarget[];
  selected_perspective_delta_targets: ManualNotePreviewDraftPromotionDryRunPerspectiveDeltaTarget[];
  selected_follow_up_work_targets: ManualNotePreviewDraftPromotionDryRunFollowUpWorkTarget[];
  blocked_side_effects: ManualNotePreviewDraftPromotionDryRunBlockedSideEffect[];
  unresolved_authority_requirements: ManualNotePreviewDraftPromotionDryRunRequiredAuthority[];
  review_notes: {
    source_verification_required: true;
    proof_evidence_authority_required: true;
    canonical_write_authority_required: true;
    work_item_authority_required_if_follow_up_work_selected: true;
    provider_or_retrieval_not_used: true;
  };
  local_copy_boundary: {
    local_clipboard_only: true;
    external_handoff_sent: false;
    packet_persisted: false;
    selection_persisted: false;
    approval_created: false;
    promotion_authority_granted: false;
    actual_promotion_allowed: false;
  };
  authority: ManualNoteDryRunCandidateReviewAuthority;
  next_recommended_slice: "authority_gated_actual_promotion_design_packet";
};

export type ManualNoteAuthorityGatedPromotionDesignPacket = {
  packet_kind: "manual_note_authority_gated_promotion_design_packet";
  packet_version: typeof MANUAL_NOTE_AUTHORITY_GATED_PROMOTION_DESIGN_PACKET_VERSION;
  packet_fingerprint: string;
  source_candidate_review_packet: {
    packet_version: string;
    packet_fingerprint: string;
    preview_draft_id: string;
    selected_counts: CandidateTargetCounts;
  };
  design_status:
    | "blocked_by_missing_authority"
    | "ready_for_human_authority_review";
  design_summary: string;
  proposed_write_contract: {
    actual_write_route_added: false;
    write_adapter_implemented: false;
    write_execution_enabled: false;
    selected_preview_draft_required: true;
    selected_candidates_required: true;
    operator_promotion_decision_required: true;
    durable_write_contract_required: true;
    source_evidence_authority_required: true;
    proof_evidence_write_authority_required: true;
    canonical_perspective_write_authority_required: true;
    idempotency_and_rollback_required: true;
    review_audit_record_required: true;
  };
  canonical_target_mapping_design: {
    selected_claim_targets: Array<{
      source_claim_candidate_id: string;
      proposed_record_kind: "canonical_claim_design_record";
      canonical_claim_id_created_now: null;
      write_performed_now: false;
    }>;
    selected_evidence_targets: Array<{
      source_evidence_candidate_id: string;
      source_claim_candidate_id: string;
      proposed_record_kind: "proof_evidence_design_record";
      proof_id_created_now: null;
      evidence_id_created_now: null;
      write_performed_now: false;
    }>;
    selected_perspective_delta_targets: Array<{
      source_perspective_delta_candidate_id: string;
      proposed_record_kind: "perspective_canonical_graph_design_record";
      perspective_id_created_now: null;
      canonical_graph_edge_id_created_now: null;
      write_performed_now: false;
    }>;
    selected_source_reference_targets: Array<{
      source_ref_id: string;
      proposed_record_kind: "source_verification_design_record";
      fetched: false;
      verified: false;
      indexed: false;
    }>;
    selected_follow_up_work_targets: Array<{
      source_follow_up_work_candidate_id: string;
      proposed_record_kind: "separate_work_item_lane_design_record";
      work_item_id_created_now: null;
      work_item_creation_now: false;
    }>;
  };
  idempotency_design: {
    required: true;
    proposed_key_inputs: [
      "preview_draft_id",
      "candidate review packet fingerprint",
      "selected target ids",
      "operator decision id placeholder",
    ];
    idempotency_key_generated_now: false;
  };
  rollback_design: {
    required: true;
    rollback_implemented_now: false;
    rollback_notes: string[];
  };
  review_audit_design: {
    required: true;
    audit_record_created_now: false;
    approval_history_created_now: false;
    preview_activity_is_not_approval_history: true;
  };
  source_evidence_authority_design: {
    source_fetching_performed_now: false;
    source_verification_performed_now: false;
    proof_evidence_records_created_now: false;
    required_future_lane: "source_evidence_authority_lane";
  };
  execution_boundary: {
    design_only: true;
    actual_promotion_allowed: false;
    write_authority_granted: false;
    actual_write_route_added: false;
    write_adapter_implemented: false;
    proof_or_evidence_writes: false;
    perspective_or_canonical_writes: false;
    canonical_graph_write: false;
    work_item_creation: false;
    provider_or_openai_calls: false;
    retrieval_or_rag: false;
    source_fetching: false;
    external_handoff_sent: false;
    design_packet_persisted: false;
    browser_persistence: false;
  };
  blocking_requirements_before_any_write: [
    "explicit_operator_promotion_decision",
    "source_verification_authority",
    "proof_evidence_write_authority",
    "canonical_perspective_write_authority",
    "idempotency_contract",
    "rollback_contract",
    "audit_record_contract",
    "disabled_by_default_write_adapter_review",
  ];
  next_recommended_slice: "disabled_by_default_actual_promotion_write_adapter_skeleton";
};

type BuildCandidateReviewPacketInput = {
  plan: ManualNotePreviewDraftPromotionDryRunPlanOkResponse;
  selected_target_ids: ManualNoteDryRunCandidateSelectionIds;
};

type BuildAuthorityDesignPacketInput = {
  candidate_review_packet: ManualNoteDryRunCandidateReviewPacket;
};

const EMPTY_SELECTION: ManualNoteDryRunCandidateSelectionIds = {
  source_reference_target_ids: [],
  claim_target_ids: [],
  evidence_target_ids: [],
  tension_gap_target_ids: [],
  perspective_delta_target_ids: [],
  follow_up_work_target_ids: [],
};

const CANDIDATE_REVIEW_AUTHORITY: ManualNoteDryRunCandidateReviewAuthority = {
  local_review_only: true,
  selection_is_not_approval: true,
  selection_is_not_promotion_authority: true,
  actual_promotion_allowed: false,
  proof_or_evidence_writes: false,
  perspective_or_canonical_writes: false,
  canonical_graph_write: false,
  work_item_creation: false,
  provider_or_openai_calls: false,
  retrieval_or_rag: false,
  source_fetching: false,
  external_handoff_sent: false,
  packet_persisted: false,
  browser_persistence: false,
};

export function buildManualNoteDryRunCandidateSelectionDefault(
  _plan: ManualNotePreviewDraftPromotionDryRunPlanOkResponse,
): ManualNoteDryRunCandidateSelectionIds {
  return copySelectionIds(EMPTY_SELECTION);
}

export function buildManualNoteDryRunCandidateReviewPacket(
  input: BuildCandidateReviewPacketInput,
): ManualNoteDryRunCandidateReviewPacket {
  const selected = normalizeSelectionForPlan(input.plan, input.selected_target_ids);
  const selectedTargets = selectTargets(input.plan, selected);
  const selectedCounts = countSelectedTargets(selectedTargets);
  const totalCounts = countPlanTargets(input.plan);
  const unselectedCounts = subtractCounts(totalCounts, selectedCounts);
  const sourcePlan = {
    preview_draft_id: input.plan.preview_draft_id,
    dry_run_plan_version: input.plan.dry_run_plan_version,
    dry_run_status: input.plan.dry_run_status,
    readiness_status: input.plan.readiness_snapshot.readiness_status,
    readiness_score: input.plan.readiness_snapshot.readiness_score,
    plan_fingerprint: createManualNoteDryRunPlanFingerprint(input.plan),
  };

  const packetWithoutFingerprint: Omit<
    ManualNoteDryRunCandidateReviewPacket,
    "packet_fingerprint"
  > = {
    packet_kind: "manual_note_dry_run_candidate_review_packet",
    packet_version: MANUAL_NOTE_DRY_RUN_CANDIDATE_REVIEW_PACKET_VERSION,
    source_plan: sourcePlan,
    selection_state: {
      selection_mode: "local_operator_screen_state",
      selection_persisted: false,
      selection_is_not_approval: true,
      selection_is_not_promotion_authority: true,
    },
    selected_counts: selectedCounts,
    unselected_counts: unselectedCounts,
    selected_source_reference_targets:
      selectedTargets.selected_source_reference_targets,
    selected_claim_targets: selectedTargets.selected_claim_targets,
    selected_evidence_targets: selectedTargets.selected_evidence_targets,
    selected_tension_gap_targets: selectedTargets.selected_tension_gap_targets,
    selected_perspective_delta_targets:
      selectedTargets.selected_perspective_delta_targets,
    selected_follow_up_work_targets:
      selectedTargets.selected_follow_up_work_targets,
    blocked_side_effects: input.plan.blocked_side_effects.map((value) => ({
      ...value,
    })),
    unresolved_authority_requirements:
      input.plan.required_authorities_before_write.map((value) => ({
        ...value,
      })),
    review_notes: {
      source_verification_required: true,
      proof_evidence_authority_required: true,
      canonical_write_authority_required: true,
      work_item_authority_required_if_follow_up_work_selected: true,
      provider_or_retrieval_not_used: true,
    },
    local_copy_boundary: {
      local_clipboard_only: true,
      external_handoff_sent: false,
      packet_persisted: false,
      selection_persisted: false,
      approval_created: false,
      promotion_authority_granted: false,
      actual_promotion_allowed: false,
    },
    authority: { ...CANDIDATE_REVIEW_AUTHORITY },
    next_recommended_slice: "authority_gated_actual_promotion_design_packet",
  };

  return {
    ...packetWithoutFingerprint,
    packet_fingerprint: createManualNoteDryRunCandidateReviewFingerprint(input),
  };
}

export function buildManualNoteDryRunCandidateReviewMarkdown(
  packet: ManualNoteDryRunCandidateReviewPacket,
) {
  return [
    "# Research Candidate Dry-Run Candidate Review Packet",
    "",
    "Local review aid only.",
    "Selections are not approval.",
    "Selections are not persisted.",
    "Selections do not grant write authority.",
    "",
    `packet_version: ${packet.packet_version}`,
    `packet_fingerprint: ${packet.packet_fingerprint}`,
    `preview_draft_id: ${packet.source_plan.preview_draft_id}`,
    `dry_run_status: ${packet.source_plan.dry_run_status}`,
    `readiness_status: ${packet.source_plan.readiness_status}`,
    `readiness_score: ${packet.source_plan.readiness_score}`,
    "",
    "## Selected Counts",
    formatCounts(packet.selected_counts),
    "",
    "## Unselected Counts",
    formatCounts(packet.unselected_counts),
    "",
    "## Selected Target Summaries",
    ...formatSelectedTargetSummaries(packet),
    "",
    "## Unresolved Authority Requirements",
    ...packet.unresolved_authority_requirements.map(
      (authority) => `- ${authority.authority_id}: ${authority.reason}`,
    ),
    "",
    "## Blocked Side Effects",
    ...packet.blocked_side_effects.map(
      (sideEffect) =>
        `- ${sideEffect.side_effect_id}: blocked ${String(sideEffect.blocked)}; performed ${String(sideEffect.performed)}`,
    ),
    "",
    "## Local Copy Boundary",
    formatMixedMap(packet.local_copy_boundary),
    "",
    "## Authority",
    formatMixedMap(packet.authority),
    "",
    `next_recommended_slice: ${packet.next_recommended_slice}`,
  ].join("\n");
}

export function buildManualNoteDryRunCandidateReviewJson(
  packet: ManualNoteDryRunCandidateReviewPacket,
) {
  return JSON.stringify(packet, null, 2);
}

export function buildManualNoteAuthorityGatedPromotionDesignPacket(
  input: BuildAuthorityDesignPacketInput,
): ManualNoteAuthorityGatedPromotionDesignPacket {
  const reviewPacket = input.candidate_review_packet;
  const packetWithoutFingerprint: Omit<
    ManualNoteAuthorityGatedPromotionDesignPacket,
    "packet_fingerprint"
  > = {
    packet_kind: "manual_note_authority_gated_promotion_design_packet",
    packet_version:
      MANUAL_NOTE_AUTHORITY_GATED_PROMOTION_DESIGN_PACKET_VERSION,
    source_candidate_review_packet: {
      packet_version: reviewPacket.packet_version,
      packet_fingerprint: reviewPacket.packet_fingerprint,
      preview_draft_id: reviewPacket.source_plan.preview_draft_id,
      selected_counts: { ...reviewPacket.selected_counts },
    },
    design_status:
      reviewPacket.selected_counts.total > 0
        ? "ready_for_human_authority_review"
        : "blocked_by_missing_authority",
    design_summary:
      reviewPacket.selected_counts.total > 0
        ? "Selected dry-run candidates can be discussed as future write-design inputs, but no write route, adapter, authority, source verification, proof/evidence record, Perspective record, canonical graph record, or work item exists in this lane."
        : "No dry-run candidates are selected, and write authority is still absent.",
    proposed_write_contract: {
      actual_write_route_added: false,
      write_adapter_implemented: false,
      write_execution_enabled: false,
      selected_preview_draft_required: true,
      selected_candidates_required: true,
      operator_promotion_decision_required: true,
      durable_write_contract_required: true,
      source_evidence_authority_required: true,
      proof_evidence_write_authority_required: true,
      canonical_perspective_write_authority_required: true,
      idempotency_and_rollback_required: true,
      review_audit_record_required: true,
    },
    canonical_target_mapping_design:
      buildCanonicalTargetMappingDesign(reviewPacket),
    idempotency_design: {
      required: true,
      proposed_key_inputs: [
        "preview_draft_id",
        "candidate review packet fingerprint",
        "selected target ids",
        "operator decision id placeholder",
      ],
      idempotency_key_generated_now: false,
    },
    rollback_design: {
      required: true,
      rollback_implemented_now: false,
      rollback_notes: [
        "Future writes must define compensating behavior before the write adapter can be enabled.",
        "This packet records design requirements only and cannot roll back records because it creates none.",
      ],
    },
    review_audit_design: {
      required: true,
      audit_record_created_now: false,
      approval_history_created_now: false,
      preview_activity_is_not_approval_history: true,
    },
    source_evidence_authority_design: {
      source_fetching_performed_now: false,
      source_verification_performed_now: false,
      proof_evidence_records_created_now: false,
      required_future_lane: "source_evidence_authority_lane",
    },
    execution_boundary: {
      design_only: true,
      actual_promotion_allowed: false,
      write_authority_granted: false,
      actual_write_route_added: false,
      write_adapter_implemented: false,
      proof_or_evidence_writes: false,
      perspective_or_canonical_writes: false,
      canonical_graph_write: false,
      work_item_creation: false,
      provider_or_openai_calls: false,
      retrieval_or_rag: false,
      source_fetching: false,
      external_handoff_sent: false,
      design_packet_persisted: false,
      browser_persistence: false,
    },
    blocking_requirements_before_any_write: [
      "explicit_operator_promotion_decision",
      "source_verification_authority",
      "proof_evidence_write_authority",
      "canonical_perspective_write_authority",
      "idempotency_contract",
      "rollback_contract",
      "audit_record_contract",
      "disabled_by_default_write_adapter_review",
    ],
    next_recommended_slice:
      "disabled_by_default_actual_promotion_write_adapter_skeleton",
  };

  return {
    ...packetWithoutFingerprint,
    packet_fingerprint: createManualNoteAuthorityGatedPromotionDesignFingerprint(
      input,
    ),
  };
}

export function buildManualNoteAuthorityGatedPromotionDesignMarkdown(
  packet: ManualNoteAuthorityGatedPromotionDesignPacket,
) {
  return [
    "# Research Candidate Authority-Gated Actual Promotion Design Packet",
    "",
    "Authority design is not actual promotion.",
    "No proof/evidence, Perspective, canonical graph, work item, provider, retrieval, source fetch, or external handoff is performed.",
    "",
    `packet_version: ${packet.packet_version}`,
    `packet_fingerprint: ${packet.packet_fingerprint}`,
    `preview_draft_id: ${packet.source_candidate_review_packet.preview_draft_id}`,
    `design_status: ${packet.design_status}`,
    `design_summary: ${packet.design_summary}`,
    "",
    "## Proposed Write Contract",
    formatMixedMap(packet.proposed_write_contract),
    "",
    "## Idempotency Design",
    formatMixedMap(packet.idempotency_design),
    "",
    "## Rollback Design",
    formatMixedMap(packet.rollback_design),
    "",
    "## Review Audit Design",
    formatMixedMap(packet.review_audit_design),
    "",
    "## Source Evidence Authority Design",
    formatMixedMap(packet.source_evidence_authority_design),
    "",
    "## Execution Boundary",
    formatMixedMap(packet.execution_boundary),
    "",
    "## Blocking Requirements Before Any Write",
    ...packet.blocking_requirements_before_any_write.map(
      (requirement) => `- ${requirement}`,
    ),
    "",
    `next_recommended_slice: ${packet.next_recommended_slice}`,
  ].join("\n");
}

export function buildManualNoteAuthorityGatedPromotionDesignJson(
  packet: ManualNoteAuthorityGatedPromotionDesignPacket,
) {
  return JSON.stringify(packet, null, 2);
}

export function createManualNoteDryRunCandidateReviewFingerprint(
  input: BuildCandidateReviewPacketInput,
) {
  const selected = normalizeSelectionForPlan(input.plan, input.selected_target_ids);
  return createFingerprint({
    packet_kind: "manual_note_dry_run_candidate_review_packet",
    packet_version: MANUAL_NOTE_DRY_RUN_CANDIDATE_REVIEW_PACKET_VERSION,
    source_plan: {
      preview_draft_id: input.plan.preview_draft_id,
      dry_run_plan_version: input.plan.dry_run_plan_version,
      dry_run_status: input.plan.dry_run_status,
      readiness_status: input.plan.readiness_snapshot.readiness_status,
      readiness_score: input.plan.readiness_snapshot.readiness_score,
    },
    selected_target_ids: selected,
    authority_false_flags: {
      actual_promotion_allowed: false,
      proof_or_evidence_writes: false,
      perspective_or_canonical_writes: false,
      canonical_graph_write: false,
      work_item_creation: false,
      provider_or_openai_calls: false,
      retrieval_or_rag: false,
      source_fetching: false,
      external_handoff_sent: false,
      packet_persisted: false,
      browser_persistence: false,
    },
  });
}

export function createManualNoteAuthorityGatedPromotionDesignFingerprint(
  input: BuildAuthorityDesignPacketInput,
) {
  const reviewPacket = input.candidate_review_packet;
  return createFingerprint({
    packet_kind: "manual_note_authority_gated_promotion_design_packet",
    packet_version:
      MANUAL_NOTE_AUTHORITY_GATED_PROMOTION_DESIGN_PACKET_VERSION,
    source_plan: reviewPacket.source_plan,
    source_candidate_review_packet_fingerprint:
      reviewPacket.packet_fingerprint,
    selected_target_ids: {
      source_reference_target_ids:
        reviewPacket.selected_source_reference_targets.map(
          (target) => target.source_ref_id,
        ),
      claim_target_ids: reviewPacket.selected_claim_targets.map(
        (target) => target.claim_candidate_id,
      ),
      evidence_target_ids: reviewPacket.selected_evidence_targets.map(
        (target) => target.evidence_candidate_id,
      ),
      tension_gap_target_ids: reviewPacket.selected_tension_gap_targets.map(
        (target) => target.target_id,
      ),
      perspective_delta_target_ids:
        reviewPacket.selected_perspective_delta_targets.map(
          (target) => target.perspective_delta_candidate_id,
        ),
      follow_up_work_target_ids:
        reviewPacket.selected_follow_up_work_targets.map(
          (target) => target.follow_up_work_candidate_id,
        ),
    },
    authority_false_flags: {
      actual_promotion_allowed: false,
      write_authority_granted: false,
      actual_write_route_added: false,
      write_adapter_implemented: false,
      proof_or_evidence_writes: false,
      perspective_or_canonical_writes: false,
      canonical_graph_write: false,
      work_item_creation: false,
      provider_or_openai_calls: false,
      retrieval_or_rag: false,
      source_fetching: false,
      external_handoff_sent: false,
      design_packet_persisted: false,
      browser_persistence: false,
    },
  });
}

function createManualNoteDryRunPlanFingerprint(
  plan: ManualNotePreviewDraftPromotionDryRunPlanOkResponse,
) {
  return createFingerprint({
    preview_draft_id: plan.preview_draft_id,
    dry_run_plan_version: plan.dry_run_plan_version,
    dry_run_status: plan.dry_run_status,
    readiness_status: plan.readiness_snapshot.readiness_status,
    readiness_score: plan.readiness_snapshot.readiness_score,
    target_counts: countPlanTargets(plan),
    authority_false_flags: {
      actual_promotion_allowed: false,
      proof_or_evidence_writes: false,
      perspective_or_canonical_writes: false,
      canonical_graph_write: false,
      work_item_creation: false,
      provider_or_openai_calls: false,
      retrieval_or_rag: false,
      source_fetching: false,
      external_handoff_sent: false,
      dry_run_plan_persisted: false,
      browser_persistence: false,
    },
  });
}

function normalizeSelectionForPlan(
  plan: ManualNotePreviewDraftPromotionDryRunPlanOkResponse,
  selection: ManualNoteDryRunCandidateSelectionIds,
): ManualNoteDryRunCandidateSelectionIds {
  return {
    source_reference_target_ids: normalizeIds(
      selection.source_reference_target_ids,
      plan.hypothetical_targets.source_reference_targets.map(
        (target) => target.source_ref_id,
      ),
    ),
    claim_target_ids: normalizeIds(
      selection.claim_target_ids,
      plan.hypothetical_targets.claim_targets.map(
        (target) => target.claim_candidate_id,
      ),
    ),
    evidence_target_ids: normalizeIds(
      selection.evidence_target_ids,
      plan.hypothetical_targets.evidence_targets.map(
        (target) => target.evidence_candidate_id,
      ),
    ),
    tension_gap_target_ids: normalizeIds(
      selection.tension_gap_target_ids,
      plan.hypothetical_targets.tension_gap_targets.map(
        (target) => target.target_id,
      ),
    ),
    perspective_delta_target_ids: normalizeIds(
      selection.perspective_delta_target_ids,
      plan.hypothetical_targets.perspective_delta_targets.map(
        (target) => target.perspective_delta_candidate_id,
      ),
    ),
    follow_up_work_target_ids: normalizeIds(
      selection.follow_up_work_target_ids,
      plan.hypothetical_targets.follow_up_work_targets.map(
        (target) => target.follow_up_work_candidate_id,
      ),
    ),
  };
}

function selectTargets(
  plan: ManualNotePreviewDraftPromotionDryRunPlanOkResponse,
  selection: ManualNoteDryRunCandidateSelectionIds,
) {
  return {
    selected_source_reference_targets: selectById(
      plan.hypothetical_targets.source_reference_targets,
      selection.source_reference_target_ids,
      (target) => target.source_ref_id,
    ),
    selected_claim_targets: selectById(
      plan.hypothetical_targets.claim_targets,
      selection.claim_target_ids,
      (target) => target.claim_candidate_id,
    ),
    selected_evidence_targets: selectById(
      plan.hypothetical_targets.evidence_targets,
      selection.evidence_target_ids,
      (target) => target.evidence_candidate_id,
    ),
    selected_tension_gap_targets: selectById(
      plan.hypothetical_targets.tension_gap_targets,
      selection.tension_gap_target_ids,
      (target) => target.target_id,
    ),
    selected_perspective_delta_targets: selectById(
      plan.hypothetical_targets.perspective_delta_targets,
      selection.perspective_delta_target_ids,
      (target) => target.perspective_delta_candidate_id,
    ),
    selected_follow_up_work_targets: selectById(
      plan.hypothetical_targets.follow_up_work_targets,
      selection.follow_up_work_target_ids,
      (target) => target.follow_up_work_candidate_id,
    ),
  };
}

function selectById<T>(
  targets: T[],
  selectedIds: string[],
  getId: (target: T) => string,
) {
  const selected = new Set(selectedIds);
  return targets.filter((target) => selected.has(getId(target)));
}

function countSelectedTargets(
  selectedTargets: ReturnType<typeof selectTargets>,
): CandidateTargetCounts {
  const counts = {
    source_reference_targets:
      selectedTargets.selected_source_reference_targets.length,
    claim_targets: selectedTargets.selected_claim_targets.length,
    evidence_targets: selectedTargets.selected_evidence_targets.length,
    tension_gap_targets: selectedTargets.selected_tension_gap_targets.length,
    perspective_delta_targets:
      selectedTargets.selected_perspective_delta_targets.length,
    follow_up_work_targets:
      selectedTargets.selected_follow_up_work_targets.length,
  };

  return {
    ...counts,
    total: Object.values(counts).reduce((sum, value) => sum + value, 0),
  };
}

function countPlanTargets(
  plan: ManualNotePreviewDraftPromotionDryRunPlanOkResponse,
): CandidateTargetCounts {
  const counts = {
    source_reference_targets:
      plan.hypothetical_targets.source_reference_targets.length,
    claim_targets: plan.hypothetical_targets.claim_targets.length,
    evidence_targets: plan.hypothetical_targets.evidence_targets.length,
    tension_gap_targets: plan.hypothetical_targets.tension_gap_targets.length,
    perspective_delta_targets:
      plan.hypothetical_targets.perspective_delta_targets.length,
    follow_up_work_targets:
      plan.hypothetical_targets.follow_up_work_targets.length,
  };

  return {
    ...counts,
    total: Object.values(counts).reduce((sum, value) => sum + value, 0),
  };
}

function subtractCounts(
  totalCounts: CandidateTargetCounts,
  selectedCounts: CandidateTargetCounts,
): CandidateTargetCounts {
  return {
    source_reference_targets:
      totalCounts.source_reference_targets -
      selectedCounts.source_reference_targets,
    claim_targets: totalCounts.claim_targets - selectedCounts.claim_targets,
    evidence_targets: totalCounts.evidence_targets - selectedCounts.evidence_targets,
    tension_gap_targets:
      totalCounts.tension_gap_targets - selectedCounts.tension_gap_targets,
    perspective_delta_targets:
      totalCounts.perspective_delta_targets -
      selectedCounts.perspective_delta_targets,
    follow_up_work_targets:
      totalCounts.follow_up_work_targets -
      selectedCounts.follow_up_work_targets,
    total: totalCounts.total - selectedCounts.total,
  };
}

function buildCanonicalTargetMappingDesign(
  reviewPacket: ManualNoteDryRunCandidateReviewPacket,
): ManualNoteAuthorityGatedPromotionDesignPacket["canonical_target_mapping_design"] {
  return {
    selected_claim_targets: reviewPacket.selected_claim_targets.map((target) => ({
      source_claim_candidate_id: target.claim_candidate_id,
      proposed_record_kind: "canonical_claim_design_record",
      canonical_claim_id_created_now: null,
      write_performed_now: false,
    })),
    selected_evidence_targets: reviewPacket.selected_evidence_targets.map(
      (target) => ({
        source_evidence_candidate_id: target.evidence_candidate_id,
        source_claim_candidate_id: target.claim_candidate_id,
        proposed_record_kind: "proof_evidence_design_record",
        proof_id_created_now: null,
        evidence_id_created_now: null,
        write_performed_now: false,
      }),
    ),
    selected_perspective_delta_targets:
      reviewPacket.selected_perspective_delta_targets.map((target) => ({
        source_perspective_delta_candidate_id:
          target.perspective_delta_candidate_id,
        proposed_record_kind: "perspective_canonical_graph_design_record",
        perspective_id_created_now: null,
        canonical_graph_edge_id_created_now: null,
        write_performed_now: false,
      })),
    selected_source_reference_targets:
      reviewPacket.selected_source_reference_targets.map((target) => ({
        source_ref_id: target.source_ref_id,
        proposed_record_kind: "source_verification_design_record",
        fetched: false,
        verified: false,
        indexed: false,
      })),
    selected_follow_up_work_targets:
      reviewPacket.selected_follow_up_work_targets.map((target) => ({
        source_follow_up_work_candidate_id: target.follow_up_work_candidate_id,
        proposed_record_kind: "separate_work_item_lane_design_record",
        work_item_id_created_now: null,
        work_item_creation_now: false,
      })),
  };
}

function normalizeIds(ids: string[], allowedIds: string[]) {
  const allowed = new Set(allowedIds);
  const unique = new Set(ids.filter((id) => allowed.has(id)));
  return allowedIds.filter((id) => unique.has(id));
}

function copySelectionIds(
  selection: ManualNoteDryRunCandidateSelectionIds,
): ManualNoteDryRunCandidateSelectionIds {
  return {
    source_reference_target_ids: [...selection.source_reference_target_ids],
    claim_target_ids: [...selection.claim_target_ids],
    evidence_target_ids: [...selection.evidence_target_ids],
    tension_gap_target_ids: [...selection.tension_gap_target_ids],
    perspective_delta_target_ids: [...selection.perspective_delta_target_ids],
    follow_up_work_target_ids: [...selection.follow_up_work_target_ids],
  };
}

function createFingerprint(value: unknown) {
  const canonical = canonicalJson(value);
  let hash = 0x811c9dc5;
  for (let index = 0; index < canonical.length; index += 1) {
    hash ^= canonical.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return `fnv1a32:${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

function canonicalJson(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map((item) => canonicalJson(item)).join(",")}]`;
  }

  return `{${Object.entries(value as Record<string, unknown>)
    .filter(([key]) => key !== "generated_at" && key !== "selected_at")
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, item]) => `${JSON.stringify(key)}:${canonicalJson(item)}`)
    .join(",")}}`;
}

function formatCounts(counts: CandidateTargetCounts) {
  return [
    `source_reference_targets: ${counts.source_reference_targets}`,
    `claim_targets: ${counts.claim_targets}`,
    `evidence_targets: ${counts.evidence_targets}`,
    `tension_gap_targets: ${counts.tension_gap_targets}`,
    `perspective_delta_targets: ${counts.perspective_delta_targets}`,
    `follow_up_work_targets: ${counts.follow_up_work_targets}`,
    `total: ${counts.total}`,
  ].join("\n");
}

function formatSelectedTargetSummaries(
  packet: ManualNoteDryRunCandidateReviewPacket,
) {
  return [
    `- source_reference_targets: ${packet.selected_source_reference_targets
      .map((target) => target.source_ref_id)
      .join(", ") || "none"}`,
    `- claim_targets: ${packet.selected_claim_targets
      .map((target) => target.claim_candidate_id)
      .join(", ") || "none"}`,
    `- evidence_targets: ${packet.selected_evidence_targets
      .map((target) => target.evidence_candidate_id)
      .join(", ") || "none"}`,
    `- tension_gap_targets: ${packet.selected_tension_gap_targets
      .map((target) => target.target_id)
      .join(", ") || "none"}`,
    `- perspective_delta_targets: ${packet.selected_perspective_delta_targets
      .map((target) => target.perspective_delta_candidate_id)
      .join(", ") || "none"}`,
    `- follow_up_work_targets: ${packet.selected_follow_up_work_targets
      .map((target) => target.follow_up_work_candidate_id)
      .join(", ") || "none"}`,
  ];
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
