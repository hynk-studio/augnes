import {
  createRunResultReviewHrefV01,
  createSuggestedChangeReviewHrefV01,
} from "@/lib/vnext/ai-workplane-review-href";
import type {
  ContextualInspectorExactStatusV01,
  ContextualInspectorProjectActivityV01,
  ContextualInspectorRelatedContextV01,
  ContextualInspectorRouteErrorStateV01,
  ContextualInspectorViewV01,
} from "@/types/vnext/contextual-inspector";
import { CONTEXTUAL_INSPECTOR_VIEW_VERSION_V01 } from "@/types/vnext/contextual-inspector";
import type {
  SharedProjectInspectorExactRefV01,
  SharedProjectInspectorProjectionV01,
  SharedProjectInspectorSectionKindV01,
  SharedProjectInspectorTargetV01,
} from "@/types/vnext/shared-project-inspector";

const PRIMARY_SECTION_LIMIT_V01 = 4;
const TEXT_LIMIT_V01 = 320;
const PUBLIC_ERROR_CODE_V01 = /^[a-z0-9_:-]{1,160}$/u;

const MISSING_ROUTE_ERROR_CODES_V01 = new Set([
  "shared_inspector_target_missing",
  "shared_inspector_automation_policy_missing",
  "shared_inspector_automation_binding_missing",
  "shared_inspector_strategic_material_missing",
  "shared_inspector_personal_perspective_not_included",
]);

const CONFLICT_ROUTE_ERROR_CODES_V01 = new Set([
  "shared_inspector_active_project_conflict",
  "shared_inspector_criterion_source_conflict",
  "shared_inspector_family_source_conflict",
  "shared_inspector_candidate_source_conflict",
  "shared_inspector_target_head_conflict",
  "shared_inspector_automation_policy_conflict",
  "shared_inspector_automation_work_conflict",
  "shared_inspector_automation_binding_conflict",
  "shared_inspector_target_fingerprint_conflict",
  "shared_inspector_evidence_source_conflict",
  "shared_inspector_claim_source_conflict",
  "shared_inspector_relation_source_conflict",
  "shared_inspector_decision_source_conflict",
  "shared_inspector_transition_source_conflict",
  "shared_inspector_semantic_state_conflict",
  "shared_inspector_context_use_review_conflict",
  "shared_inspector_capability_grant_conflict",
  "shared_inspector_packet_source_conflict",
  "shared_inspector_receipt_source_conflict",
  "shared_inspector_proposal_source_conflict",
]);

const AUTHORITY_V01 = {
  writes_database: false,
  creates_evidence: false,
  accepts_evidence: false,
  establishes_claim_truth: false,
  creates_proposal: false,
  creates_decision: false,
  authorizes_project_change: false,
  applies_project_change: false,
  starts_or_controls_work: false,
  calls_model_or_provider: false,
  performs_external_action: false,
  repairs_source_conflict: false,
} as const;

const ALL_SECTIONS_V01: readonly SharedProjectInspectorSectionKindV01[] = [
  "target_authority",
  "timeline",
  "selected_context_work",
  "run_receipt",
  "criterion_basis",
  "evidence_claims_relations",
  "proposal_candidate",
  "decision_gate",
  "transition_current_head",
  "later_context_feedback",
  "automation",
  "strategic_perspective",
  "integration_capability",
];

const RESULT_SECTIONS_V01: readonly SharedProjectInspectorSectionKindV01[] = [
  "run_receipt",
  "criterion_basis",
  "integration_capability",
  "timeline",
  "selected_context_work",
];
const MATERIAL_SECTIONS_V01: readonly SharedProjectInspectorSectionKindV01[] = [
  "criterion_basis",
  "evidence_claims_relations",
  "selected_context_work",
  "proposal_candidate",
  "timeline",
];
const PROPOSAL_SECTIONS_V01: readonly SharedProjectInspectorSectionKindV01[] = [
  "proposal_candidate",
  "criterion_basis",
  "evidence_claims_relations",
  "decision_gate",
  "transition_current_head",
  "later_context_feedback",
];
const DECISION_SECTIONS_V01: readonly SharedProjectInspectorSectionKindV01[] = [
  "decision_gate",
  "transition_current_head",
  "proposal_candidate",
  "later_context_feedback",
  "timeline",
];
const AUTOMATION_SECTIONS_V01: readonly SharedProjectInspectorSectionKindV01[] = [
  "automation",
  "timeline",
  "run_receipt",
  "integration_capability",
  "selected_context_work",
];
const CONTEXT_SECTIONS_V01: readonly SharedProjectInspectorSectionKindV01[] = [
  "selected_context_work",
  "later_context_feedback",
  "strategic_perspective",
  "timeline",
  "target_authority",
];

export function buildContextualInspectorViewV01(input: {
  inspector: SharedProjectInspectorProjectionV01;
  project_activity: ContextualInspectorProjectActivityV01;
}): ContextualInspectorViewV01 {
  const { inspector } = input;
  const exactStatus = exactStatusV01(inspector);
  const orderedSections = orderSectionsV01(
    inspector.sections,
    relevanceForTargetV01(inspector.target.target_kind),
  );
  const primarySections = orderedSections.slice(0, PRIMARY_SECTION_LIMIT_V01);
  const additionalSections = orderedSections.slice(PRIMARY_SECTION_LIMIT_V01);
  const defaultOpen = primarySections.find((section) =>
    ["conflict", "bounded_incomplete"].includes(section.status),
  );
  const statusCopy = statusCopyV01(exactStatus);
  return {
    presentation_version: CONTEXTUAL_INSPECTOR_VIEW_VERSION_V01,
    target_kind: inspector.target.target_kind,
    target_label: targetLabelV01(inspector.target.target_kind),
    heading: targetHeadingV01(inspector.target.target_kind),
    target_summary: targetSummaryV01(inspector),
    exact_status: exactStatus,
    status_label: statusCopy.label,
    status_explanation: statusCopy.explanation,
    project_activity: input.project_activity,
    activity_notice: activityNoticeV01(input.project_activity),
    observed_at: inspector.observed_at,
    related_context: deriveContextualInspectorRelatedContextV01(inspector),
    primary_sections: primarySections,
    additional_sections: additionalSections,
    default_open_section_kind: defaultOpen?.section_kind ?? null,
    authority: AUTHORITY_V01,
  };
}

export function buildUnavailableContextualInspectorViewV01(
  target: SharedProjectInspectorTargetV01,
  projectActivity: ContextualInspectorProjectActivityV01 | null = null,
): ContextualInspectorViewV01 {
  const copy = statusCopyV01("unavailable");
  return {
    presentation_version: CONTEXTUAL_INSPECTOR_VIEW_VERSION_V01,
    target_kind: target.target_kind,
    target_label: targetLabelV01(target.target_kind),
    heading: targetHeadingV01(target.target_kind),
    target_summary:
      "The exact source could not be read. No substitute record was selected.",
    exact_status: "unavailable",
    status_label: copy.label,
    status_explanation: copy.explanation,
    project_activity: projectActivity,
    activity_notice: activityNoticeV01(projectActivity),
    observed_at: null,
    related_context: deriveSafeContextualInspectorRelatedContextV01(target),
    primary_sections: [],
    additional_sections: [],
    default_open_section_kind: null,
    authority: AUTHORITY_V01,
  };
}

export function publicContextualInspectorErrorCodeV01(
  value: unknown,
): string {
  return typeof value === "string" && PUBLIC_ERROR_CODE_V01.test(value)
    ? value
    : "shared_inspector_unavailable";
}

export function classifyContextualInspectorRouteErrorV01(
  errorCode: string | null,
): ContextualInspectorRouteErrorStateV01 {
  if (errorCode && MISSING_ROUTE_ERROR_CODES_V01.has(errorCode)) {
    return "missing";
  }
  if (errorCode && CONFLICT_ROUTE_ERROR_CODES_V01.has(errorCode)) {
    return "conflict";
  }
  return "unavailable";
}

export function contextualInspectorRouteErrorPresentationV01(
  errorCode: string | null,
): {
  state: ContextualInspectorRouteErrorStateV01;
  title: string;
  explanation: string;
} {
  const state = classifyContextualInspectorRouteErrorV01(errorCode);
  if (state === "missing") {
    return {
      state,
      title: "The exact target is no longer available",
      explanation:
        "The requested exact record could not be resolved. No substitute record was selected.",
    };
  }
  if (state === "conflict") {
    return {
      state,
      title: "The saved exact sources no longer agree",
      explanation:
        "The exact source conflict was preserved. These details do not repair or choose another record.",
    };
  }
  return {
    state,
    title: "Exact details could not be read",
    explanation:
      "No project write, repair, provider call, or automatic retry was attempted.",
  };
}

export function deriveSafeContextualInspectorRelatedContextV01(
  target: SharedProjectInspectorTargetV01,
): ContextualInspectorRelatedContextV01 {
  if (target.target_kind === "automation_run") {
    return {
      kind: "delegated_work",
      label: "Back to delegated work",
      href: "/workbench/semantic-review#delegated-work",
      explanation:
        "Delegated work is the closest safe context available before local review access is established.",
    };
  }
  if (
    [
      "automation_policy",
      "capability_grant",
      "personal_perspective_inclusion",
    ].includes(target.target_kind)
  ) {
    return {
      kind: "blank_state",
      label: "Back to Continuities",
      href: "/",
      explanation:
        "Continuities is the closest safe project context available before local review access is established.",
    };
  }
  return {
    kind: "ai_workplane_home",
    label: "Back to AI Workplane",
    href: "/workbench/semantic-review",
    explanation:
      "AI Workplane is the closest safe context available before local review access is established.",
  };
}

export function contextualInspectorSectionTitleV01(
  kind: SharedProjectInspectorSectionKindV01,
): string {
  const labels: Record<SharedProjectInspectorSectionKindV01, string> = {
    target_authority: "Safeguards",
    timeline: "Source history",
    selected_context_work: "Selected work context",
    run_receipt: "Result and verification",
    criterion_basis: "Requirement checks",
    evidence_claims_relations: "Supporting and conflicting information",
    proposal_candidate: "Suggested change",
    decision_gate: "Decision safeguards",
    transition_current_head: "Project change status",
    later_context_feedback: "Later work and feedback",
    automation: "Delegated and automated work",
    strategic_perspective: "Strategic and Personal Perspective context",
    integration_capability: "Integration and capability checks",
  };
  return labels[kind];
}

export function contextualInspectorSectionSummaryV01(
  kind: SharedProjectInspectorSectionKindV01,
): string {
  const summaries: Record<SharedProjectInspectorSectionKindV01, string> = {
    target_authority:
      "Exact project scope, source identity, and read-only protections.",
    timeline:
      "The bounded recorded history related to this exact detail.",
    selected_context_work:
      "The selected work context and why it was included.",
    run_receipt:
      "The saved result, verification residue, and reported execution outcome.",
    criterion_basis:
      "How the relevant requirements were checked and what remains unconfirmed.",
    evidence_claims_relations:
      "Supporting, conflicting, and missing information without asserting truth.",
    proposal_candidate:
      "The suggested project change and its exact source binding.",
    decision_gate:
      "The saved decision and the separate safeguards around project changes.",
    transition_current_head:
      "Whether the reviewed change affected the current saved project state.",
    later_context_feedback:
      "How later work used the reviewed context and what feedback was recorded.",
    automation:
      "The bounded work, policy, approval, and lifecycle material related to this item.",
    strategic_perspective:
      "Optional strategic or Personal Perspective material bound to this work.",
    integration_capability:
      "The exact integration and capability coverage reported with this result.",
  };
  return summaries[kind];
}

function exactStatusV01(
  inspector: SharedProjectInspectorProjectionV01,
): ContextualInspectorExactStatusV01 {
  if (
    inspector.target_status === "conflict" ||
    inspector.completeness === "conflict"
  ) {
    return "conflict";
  }
  if (inspector.target_status === "missing") return "missing";
  if (
    inspector.target_status === "bounded_incomplete" ||
    inspector.completeness === "bounded_incomplete"
  ) {
    return "bounded_incomplete";
  }
  if (inspector.completeness === "partial") return "partial";
  return "complete";
}

function statusCopyV01(
  status: ContextualInspectorExactStatusV01,
): { label: string; explanation: string } {
  switch (status) {
    case "complete":
      return {
        label: "Exact detail available",
        explanation:
          "The bounded exact sources for this detail are available.",
      };
    case "partial":
      return {
        label: "Some related detail is unavailable",
        explanation:
          "Available exact material is shown without treating missing material as resolved.",
      };
    case "bounded_incomplete":
      return {
        label: "This is a bounded exact view",
        explanation:
          "Some earlier or additional exact material is not shown here. Omitted material is not treated as absent or resolved.",
      };
    case "conflict":
      return {
        label: "Exact sources do not agree",
        explanation:
          "The saved exact sources conflict. These details do not repair or choose between them.",
      };
    case "missing":
      return {
        label: "The exact target is no longer available",
        explanation:
          "The requested exact record could not be resolved. No substitute record was selected.",
      };
    case "unavailable":
      return {
        label: "Exact details could not be read",
        explanation:
          "No repair, write, model call, or external action was attempted.",
      };
  }
}

function activityNoticeV01(
  activity: ContextualInspectorProjectActivityV01 | null,
): string | null {
  return activity === "inactive_read_only"
    ? "This project is not current. These details remain read-only, and opening them did not switch projects."
    : null;
}

function relevanceForTargetV01(
  targetKind: SharedProjectInspectorTargetV01["target_kind"],
): readonly SharedProjectInspectorSectionKindV01[] {
  if (
    ["run_receipt", "integration_health", "capability_coverage"].includes(
      targetKind,
    )
  ) {
    return RESULT_SECTIONS_V01;
  }
  if (
    [
      "criterion",
      "evidence_record",
      "claim_record",
      "claim_evidence_relation",
      "claim_family",
      "relation_family",
    ].includes(targetKind)
  ) {
    return MATERIAL_SECTIONS_V01;
  }
  if (
    [
      "episode_delta_proposal",
      "proposal_candidate",
      "strategic_material",
    ].includes(targetKind)
  ) {
    return PROPOSAL_SECTIONS_V01;
  }
  if (
    [
      "review_decision",
      "semantic_commit_gate",
      "state_transition_receipt",
      "semantic_state",
      "semantic_target_head",
    ].includes(targetKind)
  ) {
    return DECISION_SECTIONS_V01;
  }
  if (
    [
      "automation_work_item",
      "automation_policy",
      "automation_cycle",
      "automation_run",
      "capability_grant",
    ].includes(targetKind)
  ) {
    return AUTOMATION_SECTIONS_V01;
  }
  if (
    [
      "task_context_packet",
      "later_task_context_packet",
      "context_use_review",
      "operational_continuation_admission",
      "personal_perspective_inclusion",
    ].includes(targetKind)
  ) {
    return CONTEXT_SECTIONS_V01;
  }
  return ALL_SECTIONS_V01;
}

function orderSectionsV01(
  sections: SharedProjectInspectorProjectionV01["sections"],
  relevant: readonly SharedProjectInspectorSectionKindV01[],
): SharedProjectInspectorProjectionV01["sections"] {
  const rank = new Map(relevant.map((kind, index) => [kind, index]));
  const fallback = new Map(ALL_SECTIONS_V01.map((kind, index) => [kind, index]));
  return [...sections].sort((left, right) => {
    const leftRank = rank.get(left.section_kind);
    const rightRank = rank.get(right.section_kind);
    if (leftRank !== undefined || rightRank !== undefined) {
      if (leftRank === undefined) return 1;
      if (rightRank === undefined) return -1;
      const leftIssue = sectionIssuePriorityV01(left.status);
      const rightIssue = sectionIssuePriorityV01(right.status);
      if (leftIssue !== rightIssue) return leftIssue - rightIssue;
      return leftRank - rightRank;
    }
    return (
      (fallback.get(left.section_kind) ?? Number.MAX_SAFE_INTEGER) -
      (fallback.get(right.section_kind) ?? Number.MAX_SAFE_INTEGER)
    );
  });
}

function sectionIssuePriorityV01(
  status: SharedProjectInspectorProjectionV01["sections"][number]["status"],
): number {
  if (status === "conflict") return 0;
  if (status === "bounded_incomplete") return 1;
  return 2;
}

function deriveContextualInspectorRelatedContextV01(
  inspector: SharedProjectInspectorProjectionV01,
): ContextualInspectorRelatedContextV01 {
  return relatedContextFromTargetV01(
    inspector.target,
    exactRefsV01(inspector),
  );
}

function relatedContextFromTargetV01(
  target: SharedProjectInspectorTargetV01,
  refs: SharedProjectInspectorExactRefV01[],
): ContextualInspectorRelatedContextV01 {
  const proposalId =
    target.target_kind === "episode_delta_proposal"
      ? target.record_id
      : target.target_kind === "proposal_candidate" ||
          target.target_kind === "strategic_material"
        ? target.proposal_id
        : firstRefV01(refs, "episode_delta_proposal");
  const proposalFirst = [
    "episode_delta_proposal",
    "proposal_candidate",
    "strategic_material",
    "review_decision",
    "semantic_commit_gate",
    "state_transition_receipt",
    "semantic_state",
    "semantic_target_head",
    "context_use_review",
  ].includes(target.target_kind);
  if (proposalFirst && proposalId) {
    return {
      kind: "suggested_change",
      label: "Back to suggested change",
      href: createSuggestedChangeReviewHrefV01(proposalId),
      explanation:
        "This is the closest exact suggested-change context for the detail.",
    };
  }

  const receiptId =
    target.target_kind === "run_receipt"
      ? target.record_id
      : target.target_kind === "criterion" ||
          target.target_kind === "integration_health" ||
          target.target_kind === "capability_coverage"
        ? target.receipt_id
        : firstRefV01(refs, "run_receipt");
  if (
    receiptId &&
    [
      "run_receipt",
      "criterion",
      "evidence_record",
      "claim_record",
      "claim_evidence_relation",
      "claim_family",
      "relation_family",
      "integration_health",
      "capability_coverage",
    ].includes(target.target_kind)
  ) {
    return {
      kind: "result",
      label: "Back to result",
      href: createRunResultReviewHrefV01(receiptId),
      explanation:
        "This is the closest exact result context for the detail.",
    };
  }
  if (target.target_kind === "automation_run") {
    return {
      kind: "delegated_work",
      label: "Back to delegated work",
      href: "/workbench/semantic-review#delegated-work",
      explanation:
        "This exact run belongs to the delegated-work progress shown in AI Workplane.",
    };
  }
  if (
    [
      "automation_policy",
      "capability_grant",
      "personal_perspective_inclusion",
    ].includes(target.target_kind)
  ) {
    return {
      kind: "blank_state",
      label: "Back to Continuities",
      href: "/",
      explanation:
        "This exact detail belongs to project options in Continuities.",
    };
  }
  if (proposalId) {
    return {
      kind: "suggested_change",
      label: "Back to suggested change",
      href: createSuggestedChangeReviewHrefV01(proposalId),
      explanation:
        "This is the closest exact suggested-change context for the detail.",
    };
  }
  if (receiptId) {
    return {
      kind: "result",
      label: "Back to result",
      href: createRunResultReviewHrefV01(receiptId),
      explanation:
        "This is the closest exact result context for the detail.",
    };
  }
  return {
    kind: "ai_workplane_home",
    label: "Back to AI Workplane",
    href: "/workbench/semantic-review",
    explanation:
      "AI Workplane is the closest related context for this exact detail.",
  };
}

function exactRefsV01(
  inspector: SharedProjectInspectorProjectionV01,
): SharedProjectInspectorExactRefV01[] {
  const refs = inspector.sections.flatMap((section) => [
    ...section.exact_refs,
    ...section.items.flatMap((item) => item.exact_refs),
  ]);
  return [
    ...new Map(
      refs.map((ref) => [
        `${ref.record_kind}:${ref.record_id}:${ref.record_fingerprint ?? ""}`,
        ref,
      ]),
    ).values(),
  ];
}

function firstRefV01(
  refs: SharedProjectInspectorExactRefV01[],
  kind: string,
): string | null {
  return refs.find((ref) => ref.record_kind === kind)?.record_id ?? null;
}

function targetLabelV01(
  kind: SharedProjectInspectorTargetV01["target_kind"],
): string {
  const labels: Record<SharedProjectInspectorTargetV01["target_kind"], string> = {
    project_coordination: "Project detail",
    task_context_packet: "Work context",
    automation_work_item: "Automated work",
    run_receipt: "Result",
    evidence_record: "Supporting information",
    claim_record: "Project statement",
    claim_evidence_relation: "Source relationship",
    episode_delta_proposal: "Suggested change",
    review_decision: "Saved decision",
    semantic_commit_gate: "Change confirmation",
    state_transition_receipt: "Applied project change",
    semantic_state: "Saved project state",
    later_task_context_packet: "Later work context",
    context_use_review: "Context feedback",
    operational_continuation_admission: "Operational continuation admission",
    capability_grant: "Capability grant",
    criterion: "Requirement check",
    claim_family: "Project statement history",
    relation_family: "Source relationship history",
    proposal_candidate: "Change option",
    semantic_target_head: "Current saved version",
    automation_policy: "Automation policy",
    automation_cycle: "Automated work cycle",
    automation_run: "Delegated work run",
    strategic_material: "Strategic review material",
    personal_perspective_inclusion: "Personal Perspective inclusion",
    integration_health: "Integration health",
    capability_coverage: "Capability coverage",
  };
  return labels[kind];
}

function targetHeadingV01(
  kind: SharedProjectInspectorTargetV01["target_kind"],
): string {
  return `${targetLabelV01(kind)} details`;
}

function targetSummaryV01(
  inspector: SharedProjectInspectorProjectionV01,
): string {
  const kind = inspector.target.target_kind;
  if (
    ["criterion", "proposal_candidate", "episode_delta_proposal", "strategic_material"].includes(
      kind,
    )
  ) {
    return boundedTextV01(inspector.target_summary);
  }
  const summaries: Partial<
    Record<SharedProjectInspectorTargetV01["target_kind"], string>
  > = {
    project_coordination:
      "This compatibility detail summarizes the current project’s exact coordination sources.",
    task_context_packet:
      "This detail shows the exact bounded context selected for a specific piece of work.",
    later_task_context_packet:
      "This detail shows the exact bounded context compiled for later work.",
    run_receipt:
      "This detail confirms the saved result and the exact project work it came from.",
    evidence_record:
      "This detail shows one exact piece of supporting information and its limits.",
    claim_record:
      "This detail shows one revisable project statement and its source history.",
    claim_evidence_relation:
      "This detail shows one exact relationship between a statement and supporting material.",
    review_decision:
      "This detail shows the saved decision without applying or changing the project.",
    semantic_commit_gate:
      "This detail shows the exact safeguard that confirmed one reviewed project change.",
    state_transition_receipt:
      "This detail shows the exact record of an applied project change.",
    semantic_state:
      "This detail shows one exact saved version of project context.",
    context_use_review:
      "This detail shows how later work used reviewed project context.",
    automation_work_item:
      "This detail shows the exact bounded automated work source.",
    automation_policy:
      "This detail shows the project’s exact automation boundaries.",
    automation_cycle:
      "This detail shows one bounded automated work cycle.",
    automation_run:
      "This detail shows the exact delegated-work run and its durable progress sources.",
    capability_grant:
      "This detail shows one bounded operational capability without granting project authority.",
    personal_perspective_inclusion:
      "This detail shows the reviewed Personal Perspective material selected for one task.",
    integration_health:
      "This detail shows the exact integration observations saved with a result.",
    capability_coverage:
      "This detail shows the exact capability coverage saved with a result.",
    semantic_target_head:
      "This detail shows the exact current saved version selected by the Core.",
    claim_family:
      "This detail shows immutable revisions separately from current applied material.",
    relation_family:
      "This detail shows immutable source-relationship revisions and their currentness.",
  };
  return boundedTextV01(summaries[kind] ?? inspector.target_summary);
}

function boundedTextV01(value: string): string {
  const compact = value.replace(/\s+/gu, " ").trim();
  if (!compact) return "Exact source detail is available.";
  return compact.length <= TEXT_LIMIT_V01
    ? compact
    : `${compact.slice(0, TEXT_LIMIT_V01 - 1)}…`;
}
