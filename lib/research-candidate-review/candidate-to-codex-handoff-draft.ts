import type {
  CandidateToCodexHandoffDraft,
  CandidateToCodexHandoffDraftAuthorityBoundary,
  CandidateToCodexHandoffDraftExpectedChange,
  CandidateToCodexHandoffDraftExpectedCheck,
  CandidateToCodexHandoffDraftInput,
  CandidateToCodexHandoffDraftLineage,
  CandidateToCodexHandoffDraftSection,
  CandidateToCodexHandoffDraftStopCondition,
  CandidateToCodexHandoffDraftValidationResult,
} from "@/types/candidate-to-codex-handoff-draft";
import type { ResearchCandidateAIContextPacketGeometrySubstrateUpgrade } from "@/types/research-candidate-ai-context-packet";

type JsonRecord = Record<string, unknown>;

const draftVersion = "candidate_to_codex_handoff_draft.geometry_substrate.v0.1";
const handoffMode = "copyable_codex_prompt_preview";
const defaultTarget = "codex_implementation";
const nextRecommendedSlice = "candidate_to_codex_handoff_draft_review_v0_1";
const sourcePacketExpectedNextSlice =
  "candidate_to_codex_handoff_draft_geometry_substrate_v0_1";

export function buildCandidateToCodexHandoffDraftGeometrySubstrate(
  input: CandidateToCodexHandoffDraftInput,
): CandidateToCodexHandoffDraft {
  const packet = input.upgradedAiContextPacket;
  const sourcePacketRef = `${packet.packet_upgrade_version}:${packet.packet_fingerprint}`;
  const target = input.target ?? defaultTarget;
  const expectedFiles = expectedFutureReviewFiles();
  const expectedCheckCommands = expectedFutureReviewChecks();
  const stopConditions = buildStopConditions();
  const sourceRefs = collectSourceRefs(packet);
  const unresolvedTensions = packet.tension_summaries.map((tension) => ({
    tension_id: tension.id,
    node_id: tension.node_id,
    summary: tension.summary,
    source_refs: tension.source_refs,
    review_status: tension.review_status ?? "candidate_review_preview",
    epistemic_status: tension.epistemic_status ?? "candidate_tension",
    authority_note: tension.authority_note,
  }));
  const geometryContextSummary = buildGeometryContextSummary(packet);
  const agentSubstrateSummary = buildAgentSubstrateSummary(packet);
  const foldedAuditSummary = buildFoldedAuditSummary(packet);
  const manualLineageSummary = buildManualLineageSummary(packet);
  const lineage = buildLineage(packet, sourcePacketRef);
  const expectedChanges = buildExpectedChanges(expectedFiles);
  const expectedChecks = buildExpectedChecks(expectedCheckCommands);
  const sections = buildSections({
    packet,
    sourceRefs,
    geometryContextSummary,
    agentSubstrateSummary,
    foldedAuditSummary,
    manualLineageSummary,
  });
  const structuredHandoff = {
    mission_brief:
      "Review a candidate-to-Codex handoff draft that preserves GeometryDigest, Agent Substrate, folded audit, base packet, and manual-note lineage as advisory context.",
    implementation_intent:
      "Prepare a future bounded handoff draft review slice; do not implement product write, durable Perspective promotion, DB writes, provider calls, retrieval, Codex execution, GitHub automation, or external handoff sending.",
    source_packet_summary: {
      source_ai_context_packet_ref: sourcePacketRef,
      source_ai_context_packet_fingerprint: packet.packet_fingerprint,
      source_ai_context_packet_next_slice: packet.next_recommended_slice,
      source_packet_validation_passed: packet.validation.passed,
      target_agent: packet.target_agent_context.target_agent,
    },
    geometry_digest_summary: geometryContextSummary,
    agent_substrate_summary: agentSubstrateSummary,
    folded_audit_summary: foldedAuditSummary,
    manual_lineage_summary: manualLineageSummary,
    selected_context_cards: selectedContextCards(packet),
    forbidden_actions: requiredForbiddenActions(),
    expected_files: expectedFiles,
    expected_checks: expectedCheckCommands,
    stop_conditions: stopConditions.map((condition) => condition.condition),
    final_report_requirements: finalReportRequirements(),
  };

  const draft: CandidateToCodexHandoffDraft = {
    draft_kind: "candidate_to_codex_handoff_draft",
    draft_version: draftVersion,
    scope: input.scope ?? packet.scope,
    as_of:
      input.as_of ??
      "fixture:research-candidate-review.candidate-to-codex-handoff-draft.geometry-substrate.sample.v0.1",
    handoff_mode: input.handoff_mode ?? handoffMode,
    target,
    source_ai_context_packet_ref: sourcePacketRef,
    source_ai_context_packet_fingerprint: packet.packet_fingerprint,
    draft_fingerprint: "",
    fingerprint_algorithm: "fnv1a32_canonical_json",
    title: "Candidate-to-Codex handoff draft with Geometry/Substrate context v0.1",
    copyable_prompt: buildCopyablePrompt({
      packet,
      sourcePacketRef,
      title:
        "Add Candidate-to-Codex handoff draft review with Geometry/Substrate context v0.1",
      expectedFiles,
      expectedCheckCommands,
      stopConditions,
      sourceRefs,
      unresolvedTensions,
      geometryContextSummary,
      agentSubstrateSummary,
      foldedAuditSummary,
      manualLineageSummary,
      operatorNote: input.operator_note,
    }),
    structured_handoff: structuredHandoff,
    expected_changes: expectedChanges,
    expected_checks: expectedChecks,
    stop_conditions: stopConditions,
    source_refs: sourceRefs,
    unresolved_tensions: unresolvedTensions,
    geometry_context_summary: geometryContextSummary,
    agent_substrate_summary: agentSubstrateSummary,
    folded_audit_summary: foldedAuditSummary,
    manual_lineage_summary: manualLineageSummary,
    authority_boundary: getCandidateToCodexHandoffDraftAuthorityBoundary(),
    lineage,
    validation: { passed: true, failure_codes: [] },
    recommendation_status: "ready_for_candidate_to_codex_handoff_draft_review",
    next_recommended_slice: nextRecommendedSlice,
  };

  draft.validation = validateCandidateToCodexHandoffDraftGeometrySubstrate(draft);
  draft.draft_fingerprint = createCandidateToCodexHandoffDraftFingerprint(draft);
  return draft;
}

export function validateCandidateToCodexHandoffDraftGeometrySubstrate(
  draft: CandidateToCodexHandoffDraft,
): CandidateToCodexHandoffDraftValidationResult {
  const failureCodes: string[] = [];
  if (draft.draft_version !== draftVersion) {
    failureCodes.push("draft_version_invalid");
  }
  if (!draft.source_ai_context_packet_fingerprint) {
    failureCodes.push("source_ai_context_packet_fingerprint_missing");
  }
  if (
    recordString(
      draft.structured_handoff?.source_packet_summary,
      "source_ai_context_packet_next_slice",
    ) !== sourcePacketExpectedNextSlice
  ) {
    failureCodes.push("source_ai_context_packet_next_slice_invalid");
  }
  if (!draft.copyable_prompt || /```/.test(draft.copyable_prompt)) {
    failureCodes.push("copyable_prompt_missing_or_fenced");
  }
  for (const [label, expectedText] of [
    ["source_packet_fingerprint", draft.source_ai_context_packet_fingerprint],
    ["source_refs_summary", "Source refs summary:"],
    ["unresolved_tensions_summary", "Unresolved tensions summary:"],
    ["geometry_substrate_folded_audit_summary", "Geometry/Substrate/Folded audit summary:"],
    ["manual_lineage_summary", "Manual lineage summary:"],
    ["hard_boundaries", "Hard boundaries:"],
    ["stop_conditions", "Stop conditions:"],
    ["forbid_codex_execution", "Do not execute Codex automatically from this draft."],
    ["forbid_branch_pr_github", "Do not create branch/PR unless a human explicitly uses this draft as a Codex task."],
    ["forbid_github_automation", "Do not call GitHub automation from this draft."],
    ["forbid_provider", "Do not call providers/OpenAI."],
    ["forbid_retrieval", "Do not run retrieval/RAG."],
    ["forbid_source_fetch", "Do not fetch sources."],
    ["forbid_db_sql_transaction", "Do not write DB, open DB, execute SQL, or execute transactions."],
    ["forbid_proof_work_perspective", "Do not create proof/evidence, mutate work, or promote Perspective."],
    ["forbid_product_write", "Do not allocate product IDs or execute product write."],
  ] as const) {
    if (!draft.copyable_prompt.includes(expectedText)) {
      failureCodes.push(`copyable_prompt_${label}_missing`);
    }
  }
  if (!draft.structured_handoff) {
    failureCodes.push("structured_handoff_missing");
  }
  if (!Array.isArray(draft.expected_changes) || draft.expected_changes.length === 0) {
    failureCodes.push("expected_changes_missing");
  }
  if (!Array.isArray(draft.expected_checks) || draft.expected_checks.length === 0) {
    failureCodes.push("expected_checks_missing");
  }
  if (!Array.isArray(draft.stop_conditions) || draft.stop_conditions.length === 0) {
    failureCodes.push("stop_conditions_missing");
  }
  if (!Array.isArray(draft.source_refs) || draft.source_refs.length === 0) {
    failureCodes.push("source_refs_missing");
  }
  if (
    !Array.isArray(draft.unresolved_tensions) ||
    draft.unresolved_tensions.length === 0
  ) {
    failureCodes.push("unresolved_tensions_missing");
  }
  if (hasCoordinateFields(draft.geometry_context_summary)) {
    failureCodes.push("geometry_context_summary_coordinate_fields_exported");
  }
  if (!agentSubstrateSummaryPreservesSourceDiscipline(draft.agent_substrate_summary)) {
    failureCodes.push("agent_substrate_summary_source_discipline_missing");
  }
  if (
    recordString(draft.folded_audit_summary, "folded_panel_anchor_id") !==
    "agent-perspective-substrate-folded-audit-panel"
  ) {
    failureCodes.push("folded_audit_anchor_missing");
  }
  if (draft.manual_lineage_summary.manual_lineage_present !== true) {
    failureCodes.push("manual_lineage_missing");
  }
  if (!draft.lineage?.manual_ai_context_packet_base_ref) {
    failureCodes.push("lineage_manual_ai_context_packet_base_ref_missing");
  }
  if (
    !Array.isArray(draft.lineage?.manual_research_candidate_review_refs) ||
    draft.lineage.manual_research_candidate_review_refs.length === 0
  ) {
    failureCodes.push("lineage_manual_research_candidate_review_refs_missing");
  }
  if (
    !Array.isArray(draft.lineage?.manual_formation_receipt_refs) ||
    draft.lineage.manual_formation_receipt_refs.length === 0
  ) {
    failureCodes.push("lineage_manual_formation_receipt_refs_missing");
  }
  if (!authorityBoundaryIsSafe(draft.authority_boundary)) {
    failureCodes.push("authority_boundary_forbidden_capability_enabled");
  }
  if (!draft.lineage?.product_write_stopline_ref?.includes("pr:686")) {
    failureCodes.push("product_write_stopline_not_parked");
  }
  if (
    draft.recommendation_status !==
    "ready_for_candidate_to_codex_handoff_draft_review"
  ) {
    failureCodes.push("recommendation_status_invalid");
  }
  if (draft.next_recommended_slice !== nextRecommendedSlice) {
    failureCodes.push("next_recommended_slice_invalid");
  }
  return {
    passed: failureCodes.length === 0,
    failure_codes: uniqueSorted(failureCodes),
  };
}

export function createCandidateToCodexHandoffDraftFingerprint(
  value: CandidateToCodexHandoffDraft,
): string {
  return `fnv1a32:${fnv1a32(canonicalJson(stripGeneratedFields(value)))}`;
}

function buildCopyablePrompt({
  packet,
  sourcePacketRef,
  title,
  expectedFiles,
  expectedCheckCommands,
  stopConditions,
  sourceRefs,
  unresolvedTensions,
  geometryContextSummary,
  agentSubstrateSummary,
  foldedAuditSummary,
  manualLineageSummary,
  operatorNote,
}: {
  packet: ResearchCandidateAIContextPacketGeometrySubstrateUpgrade;
  sourcePacketRef: string;
  title: string;
  expectedFiles: string[];
  expectedCheckCommands: string[];
  stopConditions: CandidateToCodexHandoffDraftStopCondition[];
  sourceRefs: string[];
  unresolvedTensions: Array<Record<string, unknown>>;
  geometryContextSummary: Record<string, unknown>;
  agentSubstrateSummary: Record<string, unknown>;
  foldedAuditSummary: Record<string, unknown>;
  manualLineageSummary: CandidateToCodexHandoffDraft["manual_lineage_summary"];
  operatorNote?: string;
}): string {
  const lines = [
    "Candidate-to-Codex handoff draft preview",
    `Repo: hynk-studio/augnes`,
    `Canonical checkout: /Users/hynk/code/augnes`,
    `Do not touch: /Users/hynk/Documents/augnes`,
    `Source packet ref: ${sourcePacketRef}`,
    `Source packet fingerprint: ${packet.packet_fingerprint}`,
    `Source packet next slice: ${packet.next_recommended_slice}`,
    `Task title: ${title}`,
    "Goal: Review this copyable draft as advisory planning context for a future bounded Candidate-to-Codex handoff review slice.",
    `Operator note: ${operatorNote ?? "none"}`,
    `Expected files: ${expectedFiles.join(", ")}`,
    `Expected checks: ${expectedCheckCommands.join(" | ")}`,
    `Source refs summary: ${sourceRefs.join(", ")}`,
    `Unresolved tensions summary: ${unresolvedTensions.map((item) => item.summary).join(" | ")}`,
    `Geometry/Substrate/Folded audit summary: geometry digests ${String(geometryContextSummary.geometry_digest_ref_count)}; dominant clusters ${String(geometryContextSummary.dominant_cluster_count)}; substrate blockers ${String(agentSubstrateSummary.surfaced_blocker_count)}; substrate warnings ${String(agentSubstrateSummary.surfaced_warning_count)}; folded cards ${String(foldedAuditSummary.surfacing_card_count)}; folded panel ${String(foldedAuditSummary.folded_panel_anchor_id)}.`,
    `Manual lineage summary: manual lineage present ${String(manualLineageSummary.manual_lineage_present)}; manual packet ${manualLineageSummary.manual_ai_context_packet_base_ref ?? "missing"}; manual research refs ${manualLineageSummary.manual_research_candidate_review_refs.join(", ")}; manual receipt refs ${manualLineageSummary.manual_formation_receipt_refs.join(", ")}.`,
    "Hard boundaries:",
    "Do not execute Codex automatically from this draft.",
    "Do not create branch/PR unless a human explicitly uses this draft as a Codex task.",
    "Do not call GitHub automation from this draft.",
    "Do not treat this packet as source of truth.",
    "Do not create proof/evidence, mutate work, or promote Perspective.",
    "Do not call providers/OpenAI.",
    "Do not run retrieval/RAG.",
    "Do not fetch sources.",
    "Do not send external handoff.",
    "Do not write DB, open DB, execute SQL, or execute transactions.",
    "Do not allocate product IDs or execute product write.",
    "Stop conditions:",
    ...stopConditions.map((condition) => `- ${condition.condition}`),
    "Final report requirements:",
    ...finalReportRequirements().map((requirement) => `- ${requirement}`),
  ];
  return lines.join("\n");
}

function buildSections({
  packet,
  sourceRefs,
  geometryContextSummary,
  agentSubstrateSummary,
  foldedAuditSummary,
  manualLineageSummary,
}: {
  packet: ResearchCandidateAIContextPacketGeometrySubstrateUpgrade;
  sourceRefs: string[];
  geometryContextSummary: Record<string, unknown>;
  agentSubstrateSummary: Record<string, unknown>;
  foldedAuditSummary: Record<string, unknown>;
  manualLineageSummary: CandidateToCodexHandoffDraft["manual_lineage_summary"];
}): CandidateToCodexHandoffDraftSection[] {
  return [
    section("mission", "Mission", "mission", packet.mission_brief, sourceRefs),
    section(
      "source-packet",
      "Source Packet",
      "source_packet",
      `Fingerprint ${packet.packet_fingerprint}; next slice ${packet.next_recommended_slice}.`,
      [packet.packet_fingerprint],
    ),
    section(
      "geometry-context",
      "Geometry Context",
      "geometry_context",
      `Geometry digest refs ${String(geometryContextSummary.geometry_digest_ref_count)}; dominant clusters ${String(geometryContextSummary.dominant_cluster_count)}.`,
      packet.geometry_context.geometry_digest_refs,
    ),
    section(
      "agent-substrate",
      "Agent Substrate",
      "agent_substrate",
      `Blockers ${String(agentSubstrateSummary.surfaced_blocker_count)}; warnings ${String(agentSubstrateSummary.surfaced_warning_count)}.`,
      packet.agent_substrate_context.source_coverage_preview.source_ref_ids,
    ),
    section(
      "folded-audit",
      "Folded Audit",
      "folded_audit",
      `Folded panel anchor ${String(foldedAuditSummary.folded_panel_anchor_id)}.`,
      [packet.lineage.cockpit_folded_audit_panel_ref],
    ),
    section(
      "manual-lineage",
      "Manual Lineage",
      "manual_lineage",
      `Manual lineage present ${String(manualLineageSummary.manual_lineage_present)}.`,
      [
        ...manualLineageSummary.manual_research_candidate_review_refs,
        ...manualLineageSummary.manual_formation_receipt_refs,
      ],
    ),
    section(
      "boundaries",
      "Boundaries",
      "boundaries",
      "Copyable preview only; no execution, write, mutation, route, provider, retrieval, handoff sending, GitHub automation, or product write authority.",
      [],
    ),
    section(
      "stop-conditions",
      "Stop Conditions",
      "stop_conditions",
      "Stop before any source, authority, execution, write, mutation, product-write, provider, retrieval, GitHub automation, or external handoff breach.",
      [],
    ),
  ];
}

function section(
  id: string,
  title: string,
  kind: CandidateToCodexHandoffDraftSection["section_kind"],
  summary: string,
  sourceRefs: string[],
): CandidateToCodexHandoffDraftSection {
  return {
    section_id: `candidate_to_codex_${id}`,
    section_title: title,
    section_kind: kind,
    summary,
    source_refs: sourceRefs,
    preview_only: true,
    authority_boundary_notes: [
      "Section is copyable preview planning context only and grants no execution or durable authority.",
    ],
  };
}

function buildGeometryContextSummary(
  packet: ResearchCandidateAIContextPacketGeometrySubstrateUpgrade,
): Record<string, unknown> {
  return {
    geometry_digest_refs: packet.geometry_context.geometry_digest_refs,
    geometry_digest_ref_count: packet.geometry_context.geometry_digest_refs.length,
    dominant_cluster_count: packet.geometry_context.dominant_clusters.length,
    underrepresented_cluster_count:
      packet.geometry_context.underrepresented_clusters.length,
    bridge_node_count: packet.geometry_context.bridge_nodes.length,
    contradiction_pair_count: packet.geometry_context.contradiction_pairs.length,
    recommended_retrieval_expansion_count:
      packet.geometry_context.recommended_retrieval_expansion.length,
    layout_coordinates_consumed: false,
    raw_layout_coordinates_exported: false,
    geometry_digest_is_authority: false,
    authority_boundary_note:
      "GeometryDigest is advisory structure only; layout coordinates are not truth and are not exported as handoff authority.",
  };
}

function buildAgentSubstrateSummary(
  packet: ResearchCandidateAIContextPacketGeometrySubstrateUpgrade,
): Record<string, unknown> {
  return {
    substrate_ref: packet.agent_substrate_context.substrate_ref,
    substrate_preview_ref: packet.agent_substrate_context.substrate_preview_ref,
    surfaced_blocker_count: packet.agent_substrate_context.surfaced_blockers.length,
    surfaced_warning_count: packet.agent_substrate_context.surfaced_warnings.length,
    surfaced_notice_count: packet.agent_substrate_context.surfaced_notices.length,
    retrieval_hint_count: packet.agent_substrate_context.retrieval_hints.length,
    handoff_improvement_count:
      packet.agent_substrate_context.handoff_improvements.length,
    stale_context_notice_count:
      packet.agent_substrate_context.stale_context_notices.length,
    product_write_stopline_reminder_count:
      packet.agent_substrate_context.product_write_stopline_reminders.length,
    surfaced_blocker_ids: packet.agent_substrate_context.surfaced_blockers.map(
      (card) => card.card_id,
    ),
    surfaced_warning_ids: packet.agent_substrate_context.surfaced_warnings.map(
      (card) => card.card_id,
    ),
    source_ref_coverage_ratio:
      packet.agent_substrate_context.source_coverage_preview
        .source_ref_coverage_ratio,
    source_discipline_preserved: true,
    substrate_is_authority: false,
    preview_is_authority: false,
  };
}

function buildFoldedAuditSummary(
  packet: ResearchCandidateAIContextPacketGeometrySubstrateUpgrade,
): Record<string, unknown> {
  return {
    folded_panel_available: packet.folded_audit_context.folded_panel_available,
    folded_panel_anchor_id: packet.folded_audit_context.folded_panel_anchor_id,
    folded_section_count: packet.folded_audit_context.folded_sections.length,
    folded_section_ids: packet.folded_audit_context.folded_sections.map(
      (sectionValue) => sectionValue.section_id,
    ),
    surfacing_card_count: packet.folded_audit_context.surfacing_card_count,
    blocker_card_count: packet.folded_audit_context.blocker_card_count,
    warning_card_count: packet.folded_audit_context.warning_card_count,
    source_ref_coverage_ratio:
      packet.folded_audit_context.source_ref_coverage_ratio,
    local_ui_state_only: true,
    durable_feedback_persistence_available: false,
    route_or_api_available: false,
  };
}

function buildManualLineageSummary(
  packet: ResearchCandidateAIContextPacketGeometrySubstrateUpgrade,
): CandidateToCodexHandoffDraft["manual_lineage_summary"] {
  return {
    manual_ai_context_packet_base_ref:
      packet.lineage.manual_ai_context_packet_base_ref,
    manual_research_candidate_review_refs:
      packet.lineage.manual_research_candidate_review_refs,
    manual_formation_receipt_refs: packet.lineage.manual_formation_receipt_refs,
    manual_lineage_present:
      Boolean(packet.lineage.manual_ai_context_packet_base_ref) &&
      packet.lineage.manual_research_candidate_review_refs.length > 0 &&
      packet.lineage.manual_formation_receipt_refs.length > 0,
    manual_lineage_authority: false,
    manual_lineage_included_in_copyable_prompt: true,
  };
}

function buildLineage(
  packet: ResearchCandidateAIContextPacketGeometrySubstrateUpgrade,
  sourcePacketRef: string,
): CandidateToCodexHandoffDraftLineage {
  return {
    upgraded_ai_context_packet_ref: sourcePacketRef,
    upgraded_ai_context_packet_fingerprint: packet.packet_fingerprint,
    ai_context_packet_base_refs: packet.lineage.ai_context_packet_base_refs,
    manual_ai_context_packet_base_ref:
      packet.lineage.manual_ai_context_packet_base_ref,
    research_candidate_review_refs: packet.lineage.research_candidate_review_refs,
    manual_research_candidate_review_refs:
      packet.lineage.manual_research_candidate_review_refs,
    perspective_geometry_digest_refs:
      packet.lineage.perspective_geometry_digest_refs,
    agent_perspective_substrate_ref:
      packet.lineage.agent_perspective_substrate_ref,
    agent_perspective_substrate_preview_ref:
      packet.lineage.agent_perspective_substrate_preview_ref,
    cockpit_folded_audit_panel_ref:
      packet.lineage.cockpit_folded_audit_panel_ref,
    formation_receipt_refs: packet.lineage.formation_receipt_refs,
    manual_formation_receipt_refs: packet.lineage.manual_formation_receipt_refs,
    product_write_stopline_ref: packet.lineage.product_write_stopline_ref,
  };
}

function selectedContextCards(
  packet: ResearchCandidateAIContextPacketGeometrySubstrateUpgrade,
): Array<Record<string, unknown>> {
  return [
    ...packet.agent_substrate_context.surfaced_blockers,
    ...packet.agent_substrate_context.surfaced_warnings,
    ...packet.agent_substrate_context.handoff_improvements,
    ...packet.agent_substrate_context.product_write_stopline_reminders,
  ].map((card) => ({
    card_id: card.card_id,
    title: card.title,
    severity: card.severity,
    impact: card.impact,
    epistemic_status: card.epistemic_status,
    review_status: card.review_status,
    why_now: card.why_now,
    source_refs: card.source_refs,
    source_coverage_boundary_note: card.source_coverage_boundary_note ?? null,
    authority_boundary_notes: card.authority_boundary_notes,
    execution_authority: false,
    durable_write_authority: false,
  }));
}

function collectSourceRefs(
  packet: ResearchCandidateAIContextPacketGeometrySubstrateUpgrade,
): string[] {
  return uniqueSorted([
    ...packet.source_summaries.flatMap((summary) => summary.source_refs),
    ...packet.claim_summaries.flatMap((summary) => summary.source_refs),
    ...packet.evidence_summaries.flatMap((summary) => summary.source_refs),
    ...packet.tension_summaries.flatMap((summary) => summary.source_refs),
    ...packet.knowledge_gap_summaries.flatMap((summary) => summary.source_refs),
    ...packet.perspective_delta_summaries.flatMap((summary) => summary.source_refs),
    ...packet.follow_up_summaries.flatMap((summary) => summary.source_refs),
    ...packet.agent_substrate_context.source_coverage_preview.source_ref_ids,
  ]);
}

function buildExpectedChanges(
  expectedFiles: string[],
): CandidateToCodexHandoffDraftExpectedChange[] {
  return [
    {
      change_id: "candidate_to_codex_handoff_draft_review_slice",
      change_kind: "future_handoff_review_slice",
      description:
        "Future review/approval slice may validate the copyable handoff draft before any human explicitly uses it as a Codex task.",
      expected_files: expectedFiles,
      implementation_allowed_now: false,
      product_write_related: false,
      authority_boundary_notes: [
        "This draft does not authorize implementation, product write, branch creation, PR creation, or GitHub automation.",
      ],
    },
  ];
}

function buildExpectedChecks(
  expectedCheckCommands: string[],
): CandidateToCodexHandoffDraftExpectedCheck[] {
  return expectedCheckCommands.map((command, index) => ({
    check_id: `expected_check_${String(index + 1).padStart(2, "0")}`,
    command,
    purpose: "Future bounded handoff review validation command.",
    required_for_future_review: true,
    executes_codex_now: false,
    calls_github_now: false,
    authority_boundary_notes: [
      "Expected check is listed for future human-triggered review work only.",
    ],
  }));
}

function buildStopConditions(): CandidateToCodexHandoffDraftStopCondition[] {
  return [
    "source packet validation fails",
    "missing source refs without source coverage boundary note",
    "unresolved tension omitted from prompt",
    "manual lineage omitted",
    "GeometryDigest treated as authority",
    "Agent Substrate treated as authority",
    "retrieval execution requested",
    "provider/OpenAI call requested",
    "Codex execution requested by this draft",
    "branch/PR/GitHub automation requested by this draft",
    "DB/SQL/transaction requested",
    "proof/evidence/write mutation requested",
    "Perspective promotion requested",
    "product write/product ID allocation requested",
    "external handoff send requested",
  ].map((condition, index) => ({
    stop_condition_id: `stop_condition_${String(index + 1).padStart(2, "0")}`,
    condition,
    severity: "blocker",
    authority_boundary_notes: [
      "Stop condition preserves copyable-preview-only authority boundaries.",
    ],
  }));
}

function expectedFutureReviewFiles(): string[] {
  return [
    "types/candidate-to-codex-handoff-draft-review.ts",
    "lib/research-candidate-review/candidate-to-codex-handoff-draft-review.ts",
    "fixtures/research-candidate-review.candidate-to-codex-handoff-draft-review.sample.v0.1.json",
    "scripts/smoke-research-candidate-review-candidate-to-codex-handoff-draft-review-v0-1.mjs",
    "docs/00_INDEX_LATEST.md",
  ];
}

function expectedFutureReviewChecks(): string[] {
  return [
    "node --check scripts/smoke-research-candidate-review-candidate-to-codex-handoff-draft-review-v0-1.mjs",
    "npm run smoke:research-candidate-review-candidate-to-codex-handoff-draft-review-v0-1",
    "npm run typecheck",
    "git diff --check",
    "git diff --cached --check",
  ];
}

function requiredForbiddenActions(): string[] {
  return [
    "do not treat packet as source of truth",
    "do not create proof/evidence",
    "do not mutate work",
    "do not promote Perspective",
    "do not call providers/OpenAI",
    "do not run retrieval/RAG",
    "do not fetch sources",
    "do not route/execute agents",
    "do not execute Codex",
    "do not create branch/PR",
    "do not call GitHub automation",
    "do not send external handoff",
    "do not write DB",
    "do not allocate product IDs",
    "do not execute product write",
  ];
}

function finalReportRequirements(): string[] {
  return [
    "State that the handoff draft is preview-only and copyable text only.",
    "List changed files and validation results.",
    "Report skipped runtime/browser/DB checks with concrete reasons.",
    "Confirm no Codex execution, branch/PR creation, GitHub automation, external handoff sending, DB write, provider call, retrieval, proof/evidence/work/Perspective write, or product write occurred.",
    "Name next recommended slice candidate_to_codex_handoff_draft_review_v0_1.",
  ];
}

function getCandidateToCodexHandoffDraftAuthorityBoundary(): CandidateToCodexHandoffDraftAuthorityBoundary {
  return {
    preview_only: true,
    copyable_text_only: true,
    source_of_truth: false,
    can_execute_codex: false,
    can_create_branch: false,
    can_open_pr: false,
    can_call_github: false,
    can_send_external_handoff: false,
    can_commit_or_reject_state: false,
    can_record_proof: false,
    can_create_evidence: false,
    can_update_work: false,
    can_create_work_item: false,
    can_execute_agents: false,
    can_route_agents: false,
    can_call_external_services: false,
    can_call_providers_or_openai: false,
    can_run_retrieval_or_rag: false,
    can_fetch_sources: false,
    can_promote_perspective: false,
    can_allocate_product_ids: false,
    can_execute_product_write: false,
    can_open_db: false,
    can_execute_sql: false,
    can_execute_transaction: false,
    can_add_route_or_ui: false,
    durable_write_authority: false,
    merge_authority: false,
  };
}

function authorityBoundaryIsSafe(
  boundary: CandidateToCodexHandoffDraftAuthorityBoundary,
): boolean {
  if (!boundary || boundary.preview_only !== true || boundary.copyable_text_only !== true) {
    return false;
  }
  return [
    boundary.source_of_truth,
    boundary.can_execute_codex,
    boundary.can_create_branch,
    boundary.can_open_pr,
    boundary.can_call_github,
    boundary.can_send_external_handoff,
    boundary.can_commit_or_reject_state,
    boundary.can_record_proof,
    boundary.can_create_evidence,
    boundary.can_update_work,
    boundary.can_create_work_item,
    boundary.can_execute_agents,
    boundary.can_route_agents,
    boundary.can_call_external_services,
    boundary.can_call_providers_or_openai,
    boundary.can_run_retrieval_or_rag,
    boundary.can_fetch_sources,
    boundary.can_promote_perspective,
    boundary.can_allocate_product_ids,
    boundary.can_execute_product_write,
    boundary.can_open_db,
    boundary.can_execute_sql,
    boundary.can_execute_transaction,
    boundary.can_add_route_or_ui,
    boundary.durable_write_authority,
    boundary.merge_authority,
  ].every((value) => value === false);
}

function agentSubstrateSummaryPreservesSourceDiscipline(
  summary: Record<string, unknown>,
): boolean {
  return (
    summary.source_discipline_preserved === true &&
    typeof summary.surfaced_blocker_count === "number" &&
    Number(summary.surfaced_blocker_count) > 0 &&
    typeof summary.surfaced_warning_count === "number" &&
    Number(summary.surfaced_warning_count) > 0
  );
}

function recordString(value: unknown, key: string): string | undefined {
  if (!value || typeof value !== "object") return undefined;
  const nestedValue = (value as JsonRecord)[key];
  return typeof nestedValue === "string" ? nestedValue : undefined;
}

function hasCoordinateFields(value: unknown): boolean {
  let found = false;
  visit(value, (key) => {
    if (["x", "y", "fx", "fy", "position"].includes(key)) found = true;
  });
  return found;
}

function visit(value: unknown, callback: (key: string) => void): void {
  if (Array.isArray(value)) {
    value.forEach((item) => visit(item, callback));
    return;
  }
  if (!value || typeof value !== "object") return;
  for (const [key, nestedValue] of Object.entries(value)) {
    callback(key);
    visit(nestedValue, callback);
  }
}

function uniqueSorted(values: string[]): string[] {
  return Array.from(new Set(values)).sort();
}

function stripGeneratedFields(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(stripGeneratedFields);
  }
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value as JsonRecord)
      .filter(([key]) => key !== "draft_fingerprint")
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, nestedValue]) => [key, stripGeneratedFields(nestedValue)]),
  );
}

function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map((item) => canonicalJson(item)).join(",")}]`;
  }
  if (value && typeof value === "object") {
    return `{${Object.keys(value as JsonRecord)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonicalJson((value as JsonRecord)[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

function fnv1a32(value: string): string {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}
