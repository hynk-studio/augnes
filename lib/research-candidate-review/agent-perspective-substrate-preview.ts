import type {
  AgentPerspectiveRuleFire,
  AgentPerspectiveSourceRef,
  AgentPerspectiveSubstrateSnapshot,
  AgentPerspectiveSurfacingCandidate,
} from "@/types/agent-perspective-substrate";
import type {
  AgentPerspectivePreviewAuthorityBoundary,
  AgentPerspectivePreviewDiagnostics,
  AgentPerspectivePreviewValidationResult,
  AgentPerspectiveRulePreviewGroup,
  AgentPerspectiveSourceCoveragePreview,
  AgentPerspectiveSubstratePreview,
  AgentPerspectiveSubstratePreviewInput,
  AgentPerspectiveSubstratePreviewMode,
  AgentPerspectiveSubstratePreviewSection,
  AgentPerspectiveSurfacingPreviewCard,
} from "@/types/agent-perspective-substrate-preview";

type JsonRecord = Record<string, unknown>;
type AgentPerspectivePreviewAction =
  AgentPerspectiveSurfacingPreviewCard["suggested_user_actions"][number];

const PREVIEW_VERSION = "agent_perspective_substrate_preview.v0.1" as const;
const PREVIEW_MODE = "folded_advisory_audit" as const;
const DEFAULT_SCOPE = "project:augnes";
const DEFAULT_AS_OF = "fixture:agent-perspective-substrate-preview.v0.1";
const RECOMMENDATION_STATUS =
  "ready_for_cockpit_folded_audit_panel" as const;
const NEXT_RECOMMENDED_SLICE =
  "cockpit_agent_perspective_substrate_folded_audit_panel_v0_1" as const;
const SOURCE_COVERAGE_BOUNDARY_PATTERN = /source coverage boundary note/i;

const SECTION_DEFINITIONS = [
  {
    section_id: "aps_preview_section_blockers",
    section_title: "Blockers",
    section_kind: "blockers",
  },
  {
    section_id: "aps_preview_section_warnings",
    section_title: "Warnings",
    section_kind: "warnings",
  },
  {
    section_id: "aps_preview_section_notices",
    section_title: "Notices",
    section_kind: "notices",
  },
  {
    section_id: "aps_preview_section_retrieval_hints",
    section_title: "Retrieval hints",
    section_kind: "retrieval_hints",
  },
  {
    section_id: "aps_preview_section_handoff_improvements",
    section_title: "Handoff improvements",
    section_kind: "handoff_improvements",
  },
  {
    section_id: "aps_preview_section_stale_context",
    section_title: "Stale context",
    section_kind: "stale_context",
  },
  {
    section_id: "aps_preview_section_product_write_stopline",
    section_title: "Product write stopline",
    section_kind: "product_write_stopline",
  },
  {
    section_id: "aps_preview_section_source_coverage",
    section_title: "Source coverage",
    section_kind: "source_coverage",
  },
] as const;

export function buildAgentPerspectiveSubstratePreview(
  input: AgentPerspectiveSubstratePreviewInput,
): AgentPerspectiveSubstratePreview {
  const substrate = input.substrateSnapshot;
  const sourceDigestRefs = uniqueStrings(
    input.perspectiveGeometryDigestRefs ??
      substrate.source_inputs?.perspective_geometry_digest_refs ??
      [],
  );
  const previewMode = input.preview_mode ?? PREVIEW_MODE;
  const surfacingCards = buildSurfacingCards(
    substrate.surfacing_candidates ?? [],
  );
  const foldedSections = buildFoldedSections(surfacingCards);
  const ruleGroups = buildRuleGroups(substrate.rules_fired ?? [], surfacingCards);
  const sourceCoveragePreview = buildSourceCoveragePreview(surfacingCards);
  const diagnostics = buildDiagnostics({
    foldedSections,
    surfacingCards,
    sourceCoveragePreview,
  });

  const previewBase: AgentPerspectiveSubstratePreview = {
    runtime: "augnes",
    preview_version: PREVIEW_VERSION,
    scope: input.scope ?? substrate.scope ?? DEFAULT_SCOPE,
    as_of: input.as_of ?? DEFAULT_AS_OF,
    preview_mode: previewMode,
    source_substrate_ref: {
      substrate_version: substrate.substrate_version,
      scope: substrate.scope,
      as_of: substrate.as_of,
      source_ref_count: uniqueSourceRefs(
        substrate.source_snapshot_ref?.source_refs ?? [],
      ).length,
      surfacing_candidate_count: substrate.surfacing_candidates?.length ?? 0,
      rule_fire_count: substrate.rules_fired?.length ?? 0,
      source_snapshot_ref: substrate.source_snapshot_ref,
    },
    source_digest_refs: sourceDigestRefs,
    folded_sections: foldedSections,
    surfacing_cards: surfacingCards,
    rule_groups: ruleGroups,
    source_coverage_preview: sourceCoveragePreview,
    diagnostics,
    authority_boundary: getAgentPerspectivePreviewAuthorityBoundary(),
    validation: {
      passed: true,
      failure_codes: [],
    },
    fingerprint: "",
    recommendation_status: RECOMMENDATION_STATUS,
    next_recommended_slice: NEXT_RECOMMENDED_SLICE,
  };
  const validation = validateAgentPerspectiveSubstratePreview(previewBase);
  const previewWithValidation = {
    ...previewBase,
    validation,
  };
  return {
    ...previewWithValidation,
    fingerprint: createAgentPerspectiveSubstratePreviewFingerprint(
      previewWithValidation,
    ),
  };
}

export function validateAgentPerspectiveSubstratePreview(
  preview: AgentPerspectiveSubstratePreview,
): AgentPerspectivePreviewValidationResult {
  const failureCodes: string[] = [];
  const record = asRecord(preview as unknown);
  const sections = asArray(record.folded_sections).map(asRecord);
  const cards = asArray(record.surfacing_cards).map(asRecord);
  const diagnostics = asRecord(record.diagnostics);
  const authority = asRecord(record.authority_boundary);
  const sourceCoverage = asRecord(record.source_coverage_preview);

  if (record.preview_version !== PREVIEW_VERSION) {
    failureCodes.push("preview_version_invalid");
  }
  if (record.preview_mode !== PREVIEW_MODE) {
    failureCodes.push("preview_mode_invalid");
  }
  if (Object.keys(asRecord(record.source_substrate_ref)).length === 0) {
    failureCodes.push("source_substrate_ref_missing");
  }
  if (asArray(record.source_digest_refs).length === 0) {
    failureCodes.push("source_digest_refs_missing");
  }
  for (const sectionKind of SECTION_DEFINITIONS.map(
    (section) => section.section_kind,
  )) {
    if (!sections.some((section) => section.section_kind === sectionKind)) {
      failureCodes.push(`folded_section_${sectionKind}_missing`);
    }
  }
  for (const section of sections) {
    if (section.folded_by_default !== true) {
      failureCodes.push("folded_section_not_folded_by_default");
    }
    if (section.preview_only !== true) {
      failureCodes.push("folded_section_not_preview_only");
    }
  }
  for (const card of cards) {
    const cardId = asString(card.card_id) || "unknown_card";
    if (!asString(card.epistemic_status)) {
      failureCodes.push("surfacing_card_epistemic_status_missing");
    }
    if (!asString(card.review_status)) {
      failureCodes.push("surfacing_card_review_status_missing");
    }
    if (!asString(card.why_now)) {
      failureCodes.push("surfacing_card_why_now_missing");
    }
    if (
      asArray(card.source_refs).length === 0 &&
      !asString(card.source_coverage_boundary_note)
    ) {
      failureCodes.push("surfacing_card_source_refs_or_boundary_note_missing");
    }
    if (asArray(card.authority_boundary_notes).length === 0) {
      failureCodes.push("surfacing_card_authority_boundary_notes_missing");
    }
    for (const key of [
      "execution_authority",
      "durable_write_authority",
      "route_action_available",
      "db_write_available",
      "external_call_available",
      "agent_execution_available",
      "product_write_available",
    ]) {
      if (card[key] !== false) {
        failureCodes.push(`surfacing_card_${key}_not_false`);
      }
    }
    if (
      card.card_kind === "retrieval_hint" &&
      card.retrieval_executed_now !== undefined &&
      card.retrieval_executed_now !== false
    ) {
      failureCodes.push("retrieval_hint_card_executed");
    }
    if (
      card.card_kind === "product_write_stopline_reminder" &&
      card.product_write_available !== false
    ) {
      failureCodes.push(`product_write_stopline_card_available_${cardId}`);
    }
  }
  if (
    !cards.some(
      (card) => card.card_kind === "product_write_stopline_reminder",
    )
  ) {
    failureCodes.push("product_write_stopline_card_missing");
  }
  if (!isAdvisoryPreviewAuthorityBoundary(authority)) {
    failureCodes.push("authority_boundary_not_advisory_preview_only");
  }
  if (!diagnosticsAreDeterministic(diagnostics)) {
    failureCodes.push("diagnostics_not_deterministic");
  }
  if (diagnostics.preview_is_authority !== false) {
    failureCodes.push("preview_marked_as_authority");
  }
  if (diagnostics.product_write_stopline_respected !== true) {
    failureCodes.push("product_write_stopline_not_respected");
  }
  if (diagnostics.substrate_consumed_as_advisory !== true) {
    failureCodes.push("substrate_not_marked_advisory");
  }
  if (
    Number(
      sourceCoverage.cards_missing_source_refs_without_boundary_note_count,
    ) !== 0
  ) {
    failureCodes.push("source_coverage_missing_boundary_note");
  }
  if (record.recommendation_status !== RECOMMENDATION_STATUS) {
    failureCodes.push("recommendation_status_invalid");
  }
  if (record.next_recommended_slice !== NEXT_RECOMMENDED_SLICE) {
    failureCodes.push("next_recommended_slice_invalid");
  }
  if (representsForbiddenAuthority(record)) {
    failureCodes.push("forbidden_runtime_or_write_authority_represented");
  }
  return {
    passed: failureCodes.length === 0,
    failure_codes: uniqueStrings(failureCodes),
  };
}

export function createAgentPerspectiveSubstratePreviewFingerprint(
  value: unknown,
): string {
  return `fnv1a32:${fnv1a32(canonicalJson(stripGeneratedFields(value)))}`;
}

function buildSurfacingCards(
  candidates: AgentPerspectiveSurfacingCandidate[],
): AgentPerspectiveSurfacingPreviewCard[] {
  return candidates
    .slice()
    .sort((a, b) =>
      a.surfacing_candidate_id.localeCompare(b.surfacing_candidate_id),
    )
    .map((candidate) => {
      const sourceRefs = uniqueSourceRefs(candidate.source_refs ?? []);
      const sourceCoverageBoundaryNote =
        sourceRefs.length === 0
          ? extractSourceCoverageBoundaryNote(candidate.authority_boundary_notes)
          : null;
      const foldedSectionIds = getSectionIdsForCandidate(candidate);
      const card: AgentPerspectiveSurfacingPreviewCard = {
        card_id: `aps_preview_card_${candidate.surfacing_candidate_id}`,
        source_surfacing_candidate_id: candidate.surfacing_candidate_id,
        substrate_node_ids: uniqueStrings(candidate.substrate_node_ids ?? []),
        substrate_edge_ids: uniqueStrings(candidate.substrate_edge_ids ?? []),
        rule_fire_ids: uniqueStrings(candidate.rule_fire_ids ?? []),
        card_kind: candidate.surface_type,
        title: candidate.title,
        message: candidate.message,
        severity: candidate.severity,
        impact: candidate.impact,
        confidence: roundNumber(candidate.confidence),
        epistemic_status: candidate.epistemic_status,
        review_status: candidate.review_status,
        why_now: candidate.why_now,
        source_refs: sourceRefs,
        source_coverage_boundary_note: sourceCoverageBoundaryNote,
        suggested_user_actions: uniqueActions(candidate.suggested_user_actions),
        may_interrupt_user: candidate.may_interrupt_user,
        execution_authority: false,
        durable_write_authority: false,
        route_action_available: false,
        db_write_available: false,
        external_call_available: false,
        agent_execution_available: false,
        product_write_available: false,
        authority_boundary_notes: uniqueStrings(
          candidate.authority_boundary_notes,
        ),
        folded_section_ids: foldedSectionIds,
      };
      if (candidate.surface_type === "retrieval_hint") {
        card.retrieval_executed_now = false;
      }
      return card;
    });
}

function buildFoldedSections(
  cards: AgentPerspectiveSurfacingPreviewCard[],
): AgentPerspectiveSubstratePreviewSection[] {
  return SECTION_DEFINITIONS.map((definition) => {
    const sectionCards = cards.filter((card) =>
      card.folded_section_ids.includes(definition.section_id),
    );
    return {
      section_id: definition.section_id,
      section_title: definition.section_title,
      section_kind: definition.section_kind,
      folded_by_default: true,
      item_count: sectionCards.length,
      severity_counts: {
        blocker: countCardsBySeverity(sectionCards, "blocker"),
        warning: countCardsBySeverity(sectionCards, "warning"),
        notice: countCardsBySeverity(sectionCards, "notice"),
        info: countCardsBySeverity(sectionCards, "info"),
      },
      source_ref_count: uniqueSourceRefs(
        sectionCards.flatMap((card) => card.source_refs),
      ).length,
      representative_card_ids: sectionCards
        .map((card) => card.card_id)
        .sort()
        .slice(0, 3),
      authority_boundary_notes: [
        "Folded advisory preview section only; no route, UI action, durable write, agent execution, or product write authority.",
      ],
      preview_only: true,
    };
  });
}

function buildRuleGroups(
  rules: AgentPerspectiveRuleFire[],
  cards: AgentPerspectiveSurfacingPreviewCard[],
): AgentPerspectiveRulePreviewGroup[] {
  const groups = new Map<string, AgentPerspectiveRuleFire[]>();
  for (const rule of rules) {
    const key = `${rule.severity}:${getRuleCategory(rule.rule_name)}`;
    groups.set(key, [...(groups.get(key) ?? []), rule]);
  }
  return [...groups.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, groupRules]) => {
      const [severity, category] = key.split(":");
      const ruleFireIds = uniqueStrings(
        groupRules.map((rule) => rule.rule_fire_id),
      );
      const relatedCards = cards.filter((card) =>
        card.rule_fire_ids?.some((ruleFireId) =>
          ruleFireIds.includes(ruleFireId),
        ),
      );
      return {
        rule_group_id: `aps_preview_rule_group_${severity}_${category}`,
        severity: severity as AgentPerspectiveRulePreviewGroup["severity"],
        rule_names: uniqueStrings(groupRules.map((rule) => rule.rule_name)),
        rule_fire_ids: ruleFireIds,
        source_node_ids: uniqueStrings(
          groupRules.flatMap((rule) => rule.source_node_ids ?? []),
        ),
        surfacing_card_ids: uniqueStrings(
          relatedCards.map((card) => card.card_id),
        ),
        source_refs: uniqueSourceRefs(
          groupRules.flatMap((rule) => rule.source_refs ?? []),
        ),
        why_now_summary: uniqueStrings(
          groupRules.map((rule) => rule.why_now).filter(Boolean),
        ).join(" | "),
        authority_boundary_notes: uniqueStrings(
          groupRules.flatMap((rule) => rule.authority_boundary_notes ?? []),
        ),
      };
    });
}

function buildSourceCoveragePreview(
  cards: AgentPerspectiveSurfacingPreviewCard[],
): AgentPerspectiveSourceCoveragePreview {
  const sourceRefIds = uniqueSourceRefs(cards.flatMap((card) => card.source_refs))
    .map((sourceRef) => sourceRef.source_ref_id)
    .sort();
  const cardsWithSourceRefs = cards.filter((card) => card.source_refs.length > 0);
  const cardsWithBoundaryNote = cards.filter((card) =>
    Boolean(card.source_coverage_boundary_note),
  );
  const cardsMissingSourceRefsWithoutBoundaryNote = cards.filter(
    (card) =>
      card.source_refs.length === 0 && !card.source_coverage_boundary_note,
  );
  return {
    total_source_ref_count: sourceRefIds.length,
    surfaced_card_count: cards.length,
    cards_with_source_refs_count: cardsWithSourceRefs.length,
    cards_with_boundary_note_count: cardsWithBoundaryNote.length,
    cards_missing_source_refs_without_boundary_note_count:
      cardsMissingSourceRefsWithoutBoundaryNote.length,
    source_ref_coverage_ratio: roundRatio(cardsWithSourceRefs.length, cards.length),
    source_refs_missing_count: cards.filter((card) => card.source_refs.length === 0)
      .length,
    source_ref_ids: sourceRefIds,
    source_coverage_warnings:
      cardsMissingSourceRefsWithoutBoundaryNote.length > 0
        ? cardsMissingSourceRefsWithoutBoundaryNote.map(
            (card) => `${card.card_id}: missing source refs and boundary note`,
          )
        : cardsWithBoundaryNote.map(
            (card) => `${card.card_id}: source coverage boundary note used`,
          ),
  };
}

function buildDiagnostics(input: {
  foldedSections: AgentPerspectiveSubstratePreviewSection[];
  surfacingCards: AgentPerspectiveSurfacingPreviewCard[];
  sourceCoveragePreview: AgentPerspectiveSourceCoveragePreview;
}): AgentPerspectivePreviewDiagnostics {
  const cards = input.surfacingCards;
  return {
    folded_section_count: input.foldedSections.length,
    surfacing_card_count: cards.length,
    blocker_card_count: countCardsBySeverity(cards, "blocker"),
    warning_card_count: countCardsBySeverity(cards, "warning"),
    notice_card_count: countCardsBySeverity(cards, "notice"),
    info_card_count: countCardsBySeverity(cards, "info"),
    retrieval_hint_card_count: cards.filter(
      (card) => card.card_kind === "retrieval_hint",
    ).length,
    handoff_improvement_card_count: cards.filter(
      (card) => card.card_kind === "handoff_improvement_suggestion",
    ).length,
    stale_context_card_count: cards.filter(
      (card) => card.card_kind === "stale_context_notice",
    ).length,
    product_write_stopline_card_count: cards.filter(
      (card) => card.card_kind === "product_write_stopline_reminder",
    ).length,
    source_ref_coverage_ratio:
      input.sourceCoveragePreview.source_ref_coverage_ratio,
    missing_source_ref_without_boundary_count:
      input.sourceCoveragePreview
        .cards_missing_source_refs_without_boundary_note_count,
    preview_cards_with_execution_authority_count: cards.filter(
      (card) => card.execution_authority !== false,
    ).length,
    preview_cards_with_durable_write_authority_count: cards.filter(
      (card) => card.durable_write_authority !== false,
    ).length,
    product_write_stopline_respected: true,
    substrate_consumed_as_advisory: true,
    preview_is_authority: false,
  };
}

function getAgentPerspectivePreviewAuthorityBoundary(): AgentPerspectivePreviewAuthorityBoundary {
  return {
    derived_view_only: true,
    source_of_truth: false,
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
    advisory_only: true,
    preview_only: true,
  };
}

function getSectionIdsForCandidate(
  candidate: AgentPerspectiveSurfacingCandidate,
): string[] {
  const sectionIds = new Set<string>();
  if (candidate.severity === "blocker") {
    sectionIds.add("aps_preview_section_blockers");
  }
  if (candidate.severity === "warning") {
    sectionIds.add("aps_preview_section_warnings");
  }
  if (candidate.severity === "notice") {
    sectionIds.add("aps_preview_section_notices");
  }
  if (candidate.surface_type === "retrieval_hint") {
    sectionIds.add("aps_preview_section_retrieval_hints");
  }
  if (candidate.surface_type === "handoff_improvement_suggestion") {
    sectionIds.add("aps_preview_section_handoff_improvements");
  }
  if (candidate.surface_type === "stale_context_notice") {
    sectionIds.add("aps_preview_section_stale_context");
  }
  if (candidate.surface_type === "product_write_stopline_reminder") {
    sectionIds.add("aps_preview_section_product_write_stopline");
  }
  if (
    (candidate.source_refs ?? []).length === 0 ||
    Boolean(extractSourceCoverageBoundaryNote(candidate.authority_boundary_notes))
  ) {
    sectionIds.add("aps_preview_section_source_coverage");
  }
  return [...sectionIds].sort();
}

function getRuleCategory(ruleName: string): string {
  if (/source_refs|evidence_missing/.test(ruleName)) {
    return "source_discipline";
  }
  if (/unresolved_tension|stale|dismissed_warning/.test(ruleName)) {
    return "context_integrity";
  }
  if (/constraint|forbidden_action/.test(ruleName)) {
    return "handoff_boundary";
  }
  if (/retrieval_hint/.test(ruleName)) {
    return "retrieval_hints";
  }
  if (/coordinates/.test(ruleName)) {
    return "geometry_boundary";
  }
  if (/product_write/.test(ruleName)) {
    return "product_write_stopline";
  }
  return "general";
}

function extractSourceCoverageBoundaryNote(
  notes: string[] | undefined,
): string | null {
  const match = (notes ?? []).find((note) =>
    SOURCE_COVERAGE_BOUNDARY_PATTERN.test(note),
  );
  return match ?? null;
}

function countCardsBySeverity(
  cards: AgentPerspectiveSurfacingPreviewCard[],
  severity: AgentPerspectiveSurfacingPreviewCard["severity"],
): number {
  return cards.filter((card) => card.severity === severity).length;
}

function uniqueSourceRefs(
  sourceRefs: AgentPerspectiveSourceRef[],
): AgentPerspectiveSourceRef[] {
  return uniqueStrings(
    sourceRefs
      .map((sourceRef) => asString(asRecord(sourceRef).source_ref_id))
      .filter(Boolean),
  ).map((source_ref_id) => ({ source_ref_id }));
}

function isAdvisoryPreviewAuthorityBoundary(boundary: JsonRecord): boolean {
  if (boundary.derived_view_only !== true) return false;
  if (boundary.source_of_truth !== false) return false;
  if (boundary.advisory_only !== true) return false;
  if (boundary.preview_only !== true) return false;
  for (const key of [
    "can_commit_or_reject_state",
    "can_record_proof",
    "can_create_evidence",
    "can_update_work",
    "can_create_work_item",
    "can_execute_agents",
    "can_route_agents",
    "can_call_external_services",
    "can_call_providers_or_openai",
    "can_run_retrieval_or_rag",
    "can_fetch_sources",
    "can_promote_perspective",
    "can_allocate_product_ids",
    "can_execute_product_write",
    "can_open_db",
    "can_execute_sql",
    "can_execute_transaction",
    "can_add_route_or_ui",
  ]) {
    if (boundary[key] !== false) return false;
  }
  return true;
}

function diagnosticsAreDeterministic(diagnostics: JsonRecord): boolean {
  for (const key of [
    "folded_section_count",
    "surfacing_card_count",
    "blocker_card_count",
    "warning_card_count",
    "notice_card_count",
    "info_card_count",
    "retrieval_hint_card_count",
    "handoff_improvement_card_count",
    "stale_context_card_count",
    "product_write_stopline_card_count",
    "source_ref_coverage_ratio",
    "missing_source_ref_without_boundary_count",
    "preview_cards_with_execution_authority_count",
    "preview_cards_with_durable_write_authority_count",
  ]) {
    if (typeof diagnostics[key] !== "number" || !Number.isFinite(diagnostics[key])) {
      return false;
    }
  }
  for (const key of [
    "product_write_stopline_respected",
    "substrate_consumed_as_advisory",
  ]) {
    if (diagnostics[key] !== true) return false;
  }
  return diagnostics.preview_is_authority === false;
}

function representsForbiddenAuthority(value: unknown): boolean {
  const forbiddenFalseKeys = new Set([
    "execution_authority",
    "durable_write_authority",
    "route_action_available",
    "db_write_available",
    "external_call_available",
    "agent_execution_available",
    "product_write_available",
    "can_commit_or_reject_state",
    "can_record_proof",
    "can_create_evidence",
    "can_update_work",
    "can_create_work_item",
    "can_execute_agents",
    "can_route_agents",
    "can_call_external_services",
    "can_call_providers_or_openai",
    "can_run_retrieval_or_rag",
    "can_fetch_sources",
    "can_promote_perspective",
    "can_allocate_product_ids",
    "can_execute_product_write",
    "can_open_db",
    "can_execute_sql",
    "can_execute_transaction",
    "can_add_route_or_ui",
    "retrieval_executed_now",
  ]);
  let represented = false;
  visit(value, (key, nestedValue) => {
    if (forbiddenFalseKeys.has(key) && nestedValue !== false) {
      represented = true;
    }
  });
  return represented;
}

function stripGeneratedFields(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(stripGeneratedFields);
  }
  if (!value || typeof value !== "object") return value;
  const output: JsonRecord = {};
  for (const [key, nestedValue] of Object.entries(value)) {
    if (key === "fingerprint") continue;
    output[key] = stripGeneratedFields(nestedValue);
  }
  return output;
}

function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(canonicalJson).join(",")}]`;
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

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values.map(asString).filter(Boolean))].sort();
}

function uniqueActions(values: AgentPerspectivePreviewAction[]): AgentPerspectivePreviewAction[] {
  return [...new Set(values)].sort() as AgentPerspectivePreviewAction[];
}

function roundRatio(numerator: number, denominator: number): number {
  if (denominator <= 0) return 0;
  return roundNumber(numerator / denominator);
}

function roundNumber(value: number): number {
  return Number(value.toFixed(4));
}

function asRecord(value: unknown): JsonRecord {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as JsonRecord)
    : {};
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function visit(
  value: unknown,
  callback: (key: string, nestedValue: unknown) => void,
): void {
  if (Array.isArray(value)) {
    for (const item of value) visit(item, callback);
    return;
  }
  if (!value || typeof value !== "object") return;
  for (const [key, nestedValue] of Object.entries(value)) {
    callback(key, nestedValue);
    visit(nestedValue, callback);
  }
}
