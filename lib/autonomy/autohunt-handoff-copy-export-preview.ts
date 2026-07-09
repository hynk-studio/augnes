import {
  computeAutohuntHandoffPlanOperatorReviewDecisionFingerprint,
  buildAutohuntHandoffPlanOperatorReviewDecisionAuthorityBoundary,
} from "@/lib/autonomy/read-autohunt-handoff-plan-operator-review-decisions";
import {
  allValuesFalse,
  containsForbiddenRawMaterial,
  findForbiddenRawMaterialFields,
  fingerprint,
  requiredStringFieldsPresent,
  stableJson,
  validateSourceBindingPairs,
} from "@/lib/research-candidate-review/shared-source-chain-guards";
import type {
  AutohuntHandoffPlanOperatorReviewDecision,
  AutohuntHandoffPlanOperatorReviewDecisionReadback,
} from "@/types/autohunt-handoff-plan-operator-review-decision";
import {
  AUTOHUNT_HANDOFF_COPY_EXPORT_BLOCKED_ACTIONS,
  AUTOHUNT_HANDOFF_COPY_EXPORT_PREVIEW_KIND,
  AUTOHUNT_HANDOFF_COPY_EXPORT_PREVIEW_VERSION,
  type AutohuntHandoffCopyExportBoundary,
  type AutohuntHandoffCopyExportDraftPrPlanPreview,
  type AutohuntHandoffCopyExportPersistedMaterialBoundary,
  type AutohuntHandoffCopyExportPreview,
  type AutohuntHandoffCopyExportPreviewInput,
  type AutohuntHandoffCopyExportPreviewStatus,
  type AutohuntHandoffCopyPacket,
} from "@/types/autohunt-handoff-copy-export-preview";

const DEFAULT_AS_OF = "2026-07-09T00:00:00.000Z";
const ACCEPTED_DECISION_STATUS =
  "accepted_for_future_supervised_handoff_copy_export_planning";
const ACCEPT_OPERATOR_DECISION =
  "accept_handoff_plan_for_future_supervised_copy_export_planning";
const ACCEPTANCE_SCOPE =
  "future_supervised_handoff_copy_export_planning_only";

const DEFAULT_EXPECTED_RESULT_REPORT_SECTIONS = [
  "Summary",
  "Requirement progress",
  "Files changed",
  "Checks run",
  "Authority boundary statement",
  "Non-goals preserved",
  "Result report",
  "Remaining risks",
  "Next recommended follow-up",
];

const DEFAULT_NON_GOALS = [
  "no runner",
  "no scheduler",
  "no daemon",
  "no background work",
  "no Codex execution",
  "no GitHub automation",
  "no branch creation",
  "no PR creation",
  "no merge",
  "no deploy",
  "no provider or OpenAI call",
  "no source fetch",
  "no retrieval",
  "no memory write",
  "no Perspective or CWP mutation",
  "no work mutation",
  "no proof or evidence write",
  "no product or delivery mutation",
  "no clipboard write",
  "no file download",
];

const DEFAULT_OPERATOR_WARNINGS = [
  "This preview is manual-copy planning material only.",
  "Explicit operator approval is still required before execution, branch or PR creation, merge, deploy, or external calls.",
  "Do not treat this preview as a Codex launch request.",
  "No raw prompt text or raw PR body is persisted or rendered.",
];

const SAFE_RAW_BOUNDARY_KEYS = new Set([
  "raw_copy_text_persisted",
  "raw_pr_body_persisted",
  "persists_raw_copy_text",
  "persists_raw_prompt_text",
  "persists_raw_pr_body",
  "persists_raw_operator_note",
  "persists_raw_source_payload",
  "persists_secret_or_token",
  "persists_url_or_env_value",
  "raw_material_absent",
  "expected_result_report_sections",
]);

export function buildAutohuntHandoffCopyExportPreview({
  source_operator_decision,
  as_of = DEFAULT_AS_OF,
  operator_display_hints = null,
  raw_material_probe = null,
}: AutohuntHandoffCopyExportPreviewInput): AutohuntHandoffCopyExportPreview {
  const decision = selectDecision(source_operator_decision);
  const authorityBoundary =
    buildAutohuntHandoffPlanOperatorReviewDecisionAuthorityBoundary();
  const persistedMaterialBoundary = buildPersistedMaterialBoundary();
  const rawMaterialAbsent =
    isRawMaterialAbsent(raw_material_probe) &&
    isRawMaterialAbsent(operator_display_hints);

  const sourceOperatorDecision = {
    decision_id: decision?.decision_id ?? null,
    decision_fingerprint: decision?.decision_fingerprint ?? null,
    decision_status: decision?.decision_status ?? null,
    operator_decision: decision?.operator_decision ?? null,
    approval_scope: decision?.accepted_summary?.approval_scope ?? null,
  };
  const sourceHandoffPlan = {
    handoff_plan_id:
      decision?.source_handoff_plan.handoff_plan_id ?? null,
    handoff_plan_fingerprint:
      decision?.source_handoff_plan.handoff_plan_fingerprint ?? null,
    prompt_plan_id: decision?.accepted_summary?.prompt_plan_id ?? null,
    review_packet_id: decision?.accepted_summary?.review_packet_id ?? null,
    selected_candidate_ids:
      decision?.source_handoff_plan.selected_candidate_ids ?? [],
    selected_candidate_fingerprints:
      decision?.source_handoff_plan.selected_candidate_fingerprints ?? [],
  };

  const decisionFingerprintVerified = decision
    ? decision.decision_fingerprint ===
      computeAutohuntHandoffPlanOperatorReviewDecisionFingerprint(decision)
    : false;
  const sourceDecisionAccepted =
    decision?.decision_status === ACCEPTED_DECISION_STATUS;
  const operatorDecisionAccepts =
    decision?.operator_decision === ACCEPT_OPERATOR_DECISION;
  const approvalScopeLimited =
    decision?.accepted_summary?.approval_scope === ACCEPTANCE_SCOPE;
  const sourceHandoffPlanBindingPresent =
    decision !== null && validateSourceHandoffPlanBinding(decision);
  const requiredChecksPresent =
    (decision?.accepted_summary?.required_checks.length ?? 0) > 0;
  const requiredBlockedActionsPresent = AUTOHUNT_HANDOFF_COPY_EXPORT_BLOCKED_ACTIONS.every(
    (action) => decision?.blocked_actions.includes(action) ?? false,
  );
  const authorityBoundaryAllFalse =
    allValuesFalse(authorityBoundary) &&
    (decision ? allValuesFalse(decision.authority_boundary) : true);

  const copyPacket = buildCopyPacket({
    decision,
    sourceHandoffPlan,
    operator_display_hints,
  });
  const draftPrPlanPreview = buildDraftPrPlanPreview(decision);
  const exportBoundary = buildExportBoundary(
    Boolean(
      decision &&
        sourceDecisionAccepted &&
        operatorDecisionAccepts &&
        decisionFingerprintVerified &&
        approvalScopeLimited &&
        sourceHandoffPlanBindingPresent &&
        requiredChecksPresent &&
        requiredBlockedActionsPresent &&
        authorityBoundaryAllFalse &&
        rawMaterialAbsent,
    ),
  );
  const copyPacketSafe = isCopyPacketSafe(copyPacket);
  const exportBoundaryPassive = allExportBoundaryActionsFalse(exportBoundary);
  const persistedMaterialBoundarySafe = isPersistedMaterialBoundarySafe(
    persistedMaterialBoundary,
  );

  const blockerReasons = buildBlockerReasons({
    decision,
    sourceDecisionAccepted,
    operatorDecisionAccepts,
    decisionFingerprintVerified,
    approvalScopeLimited,
    sourceHandoffPlanBindingPresent,
    requiredChecksPresent,
    requiredBlockedActionsPresent,
    authorityBoundaryAllFalse,
    rawMaterialAbsent,
    copyPacketSafe,
    exportBoundaryPassive,
    persistedMaterialBoundarySafe,
  });
  const status = getPreviewStatus({
    decision,
    sourceDecisionAccepted,
    decisionFingerprintVerified,
    sourceHandoffPlanBindingPresent,
    rawMaterialAbsent,
    blockerReasons,
  });
  const validation = {
    passed:
      status === "ready_for_operator_copy_review" &&
      blockerReasons.length === 0,
    source_decision_present: decision !== null,
    source_decision_accepted: sourceDecisionAccepted,
    operator_decision_accepts: operatorDecisionAccepts,
    source_decision_fingerprint_verified: decisionFingerprintVerified,
    approval_scope_limited: approvalScopeLimited,
    source_handoff_plan_binding_present: sourceHandoffPlanBindingPresent,
    required_checks_present: requiredChecksPresent,
    required_blocked_actions_present: requiredBlockedActionsPresent,
    authority_boundary_all_false: authorityBoundaryAllFalse,
    export_boundary_passive: exportBoundaryPassive,
    persisted_material_boundary_safe: persistedMaterialBoundarySafe,
    raw_material_absent: rawMaterialAbsent,
    copy_packet_safe: copyPacketSafe,
    blocker_reasons: blockerReasons,
    warning_reasons: buildWarningReasons(decision),
  };

  const previewWithoutFingerprint = {
    copy_export_preview_kind: AUTOHUNT_HANDOFF_COPY_EXPORT_PREVIEW_KIND,
    copy_export_preview_version: AUTOHUNT_HANDOFF_COPY_EXPORT_PREVIEW_VERSION,
    scope: "project:augnes" as const,
    as_of,
    preview_status: status,
    source_operator_decision: sourceOperatorDecision,
    source_handoff_plan: sourceHandoffPlan,
    copy_packet: copyPacket,
    draft_pr_plan_preview: draftPrPlanPreview,
    export_boundary: exportBoundary,
    authority_boundary: authorityBoundary,
    persisted_material_boundary: persistedMaterialBoundary,
    validation,
  };

  return {
    ...previewWithoutFingerprint,
    preview_fingerprint: fingerprint(previewWithoutFingerprint),
  };
}

export function buildAutohuntHandoffCopyExportAuthorityBoundary() {
  return buildAutohuntHandoffPlanOperatorReviewDecisionAuthorityBoundary();
}

function selectDecision(
  source:
    | AutohuntHandoffPlanOperatorReviewDecisionReadback
    | AutohuntHandoffPlanOperatorReviewDecision
    | null
    | undefined,
): AutohuntHandoffPlanOperatorReviewDecision | null {
  if (!source) return null;
  if ("decision_kind" in source) return source;
  return source.selected_decision ?? source.latest_accepted_decision ?? null;
}

function validateSourceHandoffPlanBinding(
  decision: AutohuntHandoffPlanOperatorReviewDecision,
) {
  const required = requiredStringFieldsPresent(
    {
      handoff_plan_id: decision.source_handoff_plan.handoff_plan_id,
      handoff_plan_fingerprint:
        decision.source_handoff_plan.handoff_plan_fingerprint,
      source_grant_id: decision.source_handoff_plan.source_grant_id,
      source_grant_fingerprint:
        decision.source_handoff_plan.source_grant_fingerprint,
      source_preflight_packet_id:
        decision.source_handoff_plan.source_preflight_packet_id,
      source_preflight_packet_fingerprint:
        decision.source_handoff_plan.source_preflight_packet_fingerprint,
      source_workbench_spine_fingerprint:
        decision.source_handoff_plan.source_workbench_spine_fingerprint,
      prompt_plan_id: decision.accepted_summary?.prompt_plan_id,
      review_packet_id: decision.accepted_summary?.review_packet_id,
    },
    [
      "handoff_plan_id",
      "handoff_plan_fingerprint",
      "source_grant_id",
      "source_grant_fingerprint",
      "source_preflight_packet_id",
      "source_preflight_packet_fingerprint",
      "source_workbench_spine_fingerprint",
      "prompt_plan_id",
      "review_packet_id",
    ],
  );
  const binding = validateSourceBindingPairs([
    {
      field: "accepted_summary_handoff_plan_id",
      expected: decision.source_handoff_plan.handoff_plan_id,
      actual: decision.accepted_summary?.handoff_plan_id,
      reason: "accepted_summary_must_match_source_handoff_plan_id",
    },
    {
      field: "accepted_summary_handoff_plan_fingerprint",
      expected: decision.source_handoff_plan.handoff_plan_fingerprint,
      actual: decision.accepted_summary?.handoff_plan_fingerprint,
      reason:
        "accepted_summary_must_match_source_handoff_plan_fingerprint",
    },
  ]);
  return (
    required.passed &&
    binding.passed &&
    decision.source_handoff_plan.selected_candidate_ids.length > 0 &&
    decision.source_handoff_plan.selected_candidate_fingerprints.length > 0
  );
}

function buildCopyPacket({
  decision,
  sourceHandoffPlan,
  operator_display_hints,
}: {
  decision: AutohuntHandoffPlanOperatorReviewDecision | null;
  sourceHandoffPlan: {
    handoff_plan_id: string | null;
    handoff_plan_fingerprint: string | null;
    prompt_plan_id: string | null;
    review_packet_id: string | null;
    selected_candidate_ids: string[];
    selected_candidate_fingerprints: string[];
  };
  operator_display_hints: AutohuntHandoffCopyExportPreviewInput["operator_display_hints"];
}): AutohuntHandoffCopyPacket {
  const sourceRefs = [
    decision?.decision_id ? `operator-decision:${decision.decision_id}` : null,
    sourceHandoffPlan.handoff_plan_id
      ? `handoff-plan:${sourceHandoffPlan.handoff_plan_id}`
      : null,
    decision?.source_handoff_plan.source_grant_id
      ? `grant:${decision.source_handoff_plan.source_grant_id}`
      : null,
    decision?.source_handoff_plan.source_preflight_packet_id
      ? `preflight:${decision.source_handoff_plan.source_preflight_packet_id}`
      : null,
    ...(operator_display_hints?.source_refs ?? []),
  ].filter((value): value is string => Boolean(value));
  const sourceFingerprints = [
    decision?.decision_fingerprint,
    sourceHandoffPlan.handoff_plan_fingerprint,
    decision?.source_handoff_plan.source_grant_fingerprint,
    decision?.source_handoff_plan.source_preflight_packet_fingerprint,
    decision?.source_handoff_plan.source_workbench_spine_fingerprint,
    ...sourceHandoffPlan.selected_candidate_fingerprints,
    ...(operator_display_hints?.hint_fingerprints ?? []),
  ].filter((value): value is string => Boolean(value));
  const packetSource = {
    decision_fingerprint: decision?.decision_fingerprint ?? null,
    handoff_plan_fingerprint: sourceHandoffPlan.handoff_plan_fingerprint,
    selected_candidate_fingerprints:
      sourceHandoffPlan.selected_candidate_fingerprints,
    required_checks: decision?.accepted_summary?.required_checks ?? [],
  };
  const packetBase = {
    copy_packet_id: buildDeterministicPreviewId(
      "autohunt-handoff-copy-packet",
      packetSource,
    ),
    copy_packet_title: "Supervised Autohunt handoff copy/export preview",
    goal_summary:
      "Prepare structured manual handoff material for future supervised planning without executing Codex, creating branches or PRs, calling external services, or mutating state.",
    required_context_refs: [
      sourceHandoffPlan.prompt_plan_id
        ? `prompt-plan:${sourceHandoffPlan.prompt_plan_id}`
        : null,
      sourceHandoffPlan.review_packet_id
        ? `review-packet:${sourceHandoffPlan.review_packet_id}`
        : null,
      sourceHandoffPlan.handoff_plan_id
        ? `handoff-plan:${sourceHandoffPlan.handoff_plan_id}`
        : null,
      decision?.decision_id ? `operator-decision:${decision.decision_id}` : null,
    ].filter((value): value is string => Boolean(value)),
    source_refs: sourceRefs,
    source_fingerprints: sourceFingerprints,
    selected_candidate_refs: sourceHandoffPlan.selected_candidate_ids,
    implementation_constraints: [
      "Use only the listed refs, fingerprints, checks, and file-glob previews.",
      "Do not execute Codex from this preview.",
      "Do not create a branch or PR from this preview.",
      "Do not call GitHub, provider, OpenAI, source fetch, or retrieval systems.",
      "Do not mutate Perspective, CWP, work, memory, proof, evidence, product, or delivery state.",
    ],
    acceptance_criteria: [
      `source decision status is ${ACCEPTED_DECISION_STATUS}`,
      `approval scope is ${ACCEPTANCE_SCOPE}`,
      `selected candidate count is ${decision?.accepted_summary?.selected_candidate_count ?? 0}`,
      `max changed files preview is ${decision?.accepted_summary?.max_changed_files ?? 0}`,
      "all dangerous authority flags remain false",
    ],
    required_checks: decision?.accepted_summary?.required_checks ?? [],
    expected_result_report_sections: DEFAULT_EXPECTED_RESULT_REPORT_SECTIONS,
    non_goals: DEFAULT_NON_GOALS,
    blocked_actions: [...AUTOHUNT_HANDOFF_COPY_EXPORT_BLOCKED_ACTIONS],
    operator_warnings: DEFAULT_OPERATOR_WARNINGS,
    raw_copy_text_persisted: false as const,
  };
  return {
    ...packetBase,
    copy_packet_fingerprint: fingerprint(packetBase),
  };
}

function buildDraftPrPlanPreview(
  decision: AutohuntHandoffPlanOperatorReviewDecision | null,
): AutohuntHandoffCopyExportDraftPrPlanPreview {
  const suffix = decision?.decision_id.split(":").pop() ?? "pending";
  return {
    branch_name_preview: `future/supervised-autohunt-handoff-${suffix}`,
    pr_title_preview: "Supervised Autohunt handoff implementation preview",
    pr_body_section_labels: DEFAULT_EXPECTED_RESULT_REPORT_SECTIONS,
    expected_changed_file_globs:
      decision?.accepted_summary?.expected_changed_file_globs ?? [],
    max_changed_files: decision?.accepted_summary?.max_changed_files ?? 0,
    checks_to_run: decision?.accepted_summary?.required_checks ?? [],
    reviewer_focus: [
      "source refs and fingerprints match the accepted decision",
      "all non-goals and blocked actions remain preserved",
      "no raw prompt text or raw PR body is introduced",
      "operator approval is still required before any execution or external call",
    ],
    raw_pr_body_persisted: false,
  };
}

function buildPersistedMaterialBoundary(): AutohuntHandoffCopyExportPersistedMaterialBoundary {
  return {
    persists_source_fingerprints: true,
    persists_copy_export_policy: true,
    persists_raw_copy_text: false,
    persists_raw_prompt_text: false,
    persists_raw_pr_body: false,
    persists_raw_operator_note: false,
    persists_raw_source_payload: false,
    persists_secret_or_token: false,
    persists_url_or_env_value: false,
  };
}

function buildExportBoundary(
  ready: boolean,
): AutohuntHandoffCopyExportBoundary {
  return {
    export_ready_for_manual_copy: ready,
    copy_button_rendered: false,
    file_download_rendered: false,
    launch_button_rendered: false,
    clipboard_written: false,
    file_written: false,
    codex_executed: false,
    github_called: false,
    branch_or_pr_created: false,
  };
}

function allExportBoundaryActionsFalse(
  boundary: AutohuntHandoffCopyExportBoundary,
) {
  const { export_ready_for_manual_copy: _ready, ...actionFlags } = boundary;
  return Object.values(actionFlags).every((value) => value === false);
}

function isPersistedMaterialBoundarySafe(
  boundary: AutohuntHandoffCopyExportPersistedMaterialBoundary,
) {
  return (
    boundary.persists_source_fingerprints === true &&
    boundary.persists_copy_export_policy === true &&
    boundary.persists_raw_copy_text === false &&
    boundary.persists_raw_prompt_text === false &&
    boundary.persists_raw_pr_body === false &&
    boundary.persists_raw_operator_note === false &&
    boundary.persists_raw_source_payload === false &&
    boundary.persists_secret_or_token === false &&
    boundary.persists_url_or_env_value === false
  );
}

function isRawMaterialAbsent(value: unknown) {
  if (value === null || typeof value === "undefined") return true;
  const scrubbed = stripSafeRawBoundaryKeys(value);
  return (
    findForbiddenRawMaterialFields(scrubbed).length === 0 &&
    !containsForbiddenRawMaterial(scrubbed)
  );
}

function isCopyPacketSafe(packet: AutohuntHandoffCopyPacket) {
  const scrubbed = stripSafeRawBoundaryKeys(packet);
  return (
    findForbiddenRawMaterialFields(scrubbed).length === 0 &&
    !containsForbiddenRawMaterial(scrubbed) &&
    stableJson(scrubbed).includes("raw_copy_text_persisted") === false
  );
}

function stripSafeRawBoundaryKeys(value: unknown): unknown {
  if (value === null || typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map(stripSafeRawBoundaryKeys);
  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => !SAFE_RAW_BOUNDARY_KEYS.has(key))
      .map(([key, nested]) => [key, stripSafeRawBoundaryKeys(nested)]),
  );
}

function buildBlockerReasons({
  decision,
  sourceDecisionAccepted,
  operatorDecisionAccepts,
  decisionFingerprintVerified,
  approvalScopeLimited,
  sourceHandoffPlanBindingPresent,
  requiredChecksPresent,
  requiredBlockedActionsPresent,
  authorityBoundaryAllFalse,
  rawMaterialAbsent,
  copyPacketSafe,
  exportBoundaryPassive,
  persistedMaterialBoundarySafe,
}: {
  decision: AutohuntHandoffPlanOperatorReviewDecision | null;
  sourceDecisionAccepted: boolean;
  operatorDecisionAccepts: boolean;
  decisionFingerprintVerified: boolean;
  approvalScopeLimited: boolean;
  sourceHandoffPlanBindingPresent: boolean;
  requiredChecksPresent: boolean;
  requiredBlockedActionsPresent: boolean;
  authorityBoundaryAllFalse: boolean;
  rawMaterialAbsent: boolean;
  copyPacketSafe: boolean;
  exportBoundaryPassive: boolean;
  persistedMaterialBoundarySafe: boolean;
}) {
  return [
    !decision ? "missing_accepted_decision" : null,
    decision && !sourceDecisionAccepted ? "source_decision_not_accepted" : null,
    decision && !operatorDecisionAccepts ? "operator_decision_not_accept" : null,
    decision && !decisionFingerprintVerified
      ? "source_decision_fingerprint_mismatch"
      : null,
    decision && !approvalScopeLimited ? "approval_scope_not_limited" : null,
    decision && !sourceHandoffPlanBindingPresent
      ? "source_handoff_plan_binding_missing"
      : null,
    decision && !requiredChecksPresent ? "required_checks_missing" : null,
    decision && !requiredBlockedActionsPresent
      ? "required_blocked_actions_missing"
      : null,
    !authorityBoundaryAllFalse ? "authority_boundary_not_all_false" : null,
    !rawMaterialAbsent ? "unsafe_material_refused" : null,
    !copyPacketSafe ? "copy_packet_unsafe" : null,
    !exportBoundaryPassive ? "export_boundary_not_passive" : null,
    !persistedMaterialBoundarySafe ? "material_boundary_not_safe" : null,
  ].filter((reason): reason is string => Boolean(reason));
}

function getPreviewStatus({
  decision,
  sourceDecisionAccepted,
  decisionFingerprintVerified,
  sourceHandoffPlanBindingPresent,
  rawMaterialAbsent,
  blockerReasons,
}: {
  decision: AutohuntHandoffPlanOperatorReviewDecision | null;
  sourceDecisionAccepted: boolean;
  decisionFingerprintVerified: boolean;
  sourceHandoffPlanBindingPresent: boolean;
  rawMaterialAbsent: boolean;
  blockerReasons: string[];
}): AutohuntHandoffCopyExportPreviewStatus {
  if (!rawMaterialAbsent) return "unsafe_material_refused";
  if (!decision) return "missing_accepted_decision";
  if (!sourceDecisionAccepted) return "source_decision_not_accepted";
  if (!decisionFingerprintVerified) {
    return "source_decision_fingerprint_mismatch";
  }
  if (!sourceHandoffPlanBindingPresent) {
    return "source_handoff_plan_binding_missing";
  }
  if (blockerReasons.length > 0) return "blocked";
  return "ready_for_operator_copy_review";
}

function buildWarningReasons(
  decision: AutohuntHandoffPlanOperatorReviewDecision | null,
) {
  return [
    decision ? "manual_copy_review_only" : null,
    decision ? "execution_requires_future_explicit_approval" : null,
    decision ? "branch_or_pr_creation_not_authorized" : null,
  ].filter((reason): reason is string => Boolean(reason));
}

function buildDeterministicPreviewId(prefix: string, value: unknown) {
  const digest = fingerprint(value).split(":").pop()?.slice(0, 8) ?? "unknown";
  return `${prefix}:${digest}`;
}
