import {
  allValuesFalse,
  assertAllFalseBoundary,
  containsForbiddenRawMaterial,
  findForbiddenRawMaterialFields,
  fingerprint,
  requiredStringFieldsPresent,
  stableJson,
  validateSourceBindingPairs,
} from "@/lib/research-candidate-review/shared-source-chain-guards";
import type { AutohuntHandoffCopyExportPreview } from "@/types/autohunt-handoff-copy-export-preview";
import type {
  AutohuntHandoffPlanOperatorReviewDecision,
  AutohuntHandoffPlanOperatorReviewDecisionReadback,
} from "@/types/autohunt-handoff-plan-operator-review-decision";
import type {
  AutohuntHandoffPlanPreview,
  AutohuntHandoffPlanPreviewReadback,
} from "@/types/autohunt-handoff-plan-preview";
import {
  AUTOHUNT_EXECUTION_READINESS_ALLOWED_NEXT_DESIGN_OUTPUTS,
  AUTOHUNT_EXECUTION_READINESS_AUTHORITY_FLAG_NAMES,
  AUTOHUNT_EXECUTION_READINESS_FORBIDDEN_CURRENT_OUTPUTS,
  AUTOHUNT_EXECUTION_READINESS_FUTURE_DESIGN_REQUIREMENTS,
  AUTOHUNT_EXECUTION_READINESS_GATE_KIND,
  AUTOHUNT_EXECUTION_READINESS_GATE_VERSION,
  type AutohuntExecutionReadinessAuthorityBoundary,
  type AutohuntExecutionReadinessDogfoodSeedReport,
  type AutohuntExecutionReadinessGate,
  type AutohuntExecutionReadinessGateInput,
  type AutohuntExecutionReadinessGateStatus,
  type AutohuntExecutionReadinessMaterialBoundary,
  type AutohuntExecutionReadinessSourceChainSummary,
} from "@/types/autohunt-execution-readiness-gate";
import type { AutohuntWorkbenchReadbackSpine } from "@/types/autohunt-workbench-readback-spine";

const DEFAULT_AS_OF = "2026-07-09T00:00:00.000Z";
const READY_SPINE_STATUS = "ready_for_supervised_handoff_planning";
const READY_HANDOFF_PLAN_STATUS = "ready_for_operator_review";
const ACCEPTED_DECISION_STATUS =
  "accepted_for_future_supervised_handoff_copy_export_planning";
const ACCEPTANCE_SCOPE =
  "future_supervised_handoff_copy_export_planning_only";
const READY_COPY_EXPORT_STATUS = "ready_for_operator_copy_review";

const SAFE_RAW_BOUNDARY_KEYS = new Set([
  "raw_material_persisted",
  "raw_prompt_text_persisted",
  "raw_copy_text_persisted",
  "raw_pr_body_persisted",
  "raw_operator_note_persisted",
  "raw_source_payload_persisted",
  "secret_or_token_persisted",
  "url_or_env_value_persisted",
  "raw_material_absent",
  "persists_raw_copy_text",
  "persists_raw_prompt_text",
  "persists_raw_pr_body",
  "persists_raw_operator_note",
  "persists_raw_source_payload",
  "persists_secret_or_token",
  "persists_url_or_env_value",
  "expected_result_report_sections",
]);

export function buildAutohuntExecutionReadinessGate({
  workbench_spine,
  handoff_plan_readback,
  operator_decision_readback,
  copy_export_preview,
  local_dogfood_seed_report = null,
  as_of = DEFAULT_AS_OF,
  raw_material_probe = null,
}: AutohuntExecutionReadinessGateInput): AutohuntExecutionReadinessGate {
  const handoffPlan = selectHandoffPlan(handoff_plan_readback);
  const operatorDecision = selectOperatorDecision(operator_decision_readback);
  const authorityBoundary = buildAutohuntExecutionReadinessAuthorityBoundary();
  const materialBoundary = buildMaterialBoundary();
  const sourceChainSummary = buildSourceChainSummary({
    workbench_spine,
    handoffPlan,
    operatorDecision,
    copy_export_preview,
  });
  const sourceChainBindingsPresent = validateSourceChainBindings({
    workbench_spine,
    handoffPlan,
    operatorDecision,
    copy_export_preview,
  });
  const authorityBoundariesAllFalse = areAuthorityBoundariesAllFalse({
    gateAuthority: authorityBoundary,
    workbench_spine,
    handoffPlanReadback: handoff_plan_readback,
    handoffPlan,
    operatorDecisionReadback: operator_decision_readback,
    operatorDecision,
    copy_export_preview,
  });
  const exportBoundaryPassive = copy_export_preview
    ? copy_export_preview.export_boundary.copy_button_rendered === false &&
      copy_export_preview.export_boundary.file_download_rendered === false &&
      copy_export_preview.export_boundary.launch_button_rendered === false &&
      copy_export_preview.export_boundary.clipboard_written === false &&
      copy_export_preview.export_boundary.file_written === false &&
      copy_export_preview.export_boundary.codex_executed === false &&
      copy_export_preview.export_boundary.github_called === false &&
      copy_export_preview.export_boundary.branch_or_pr_created === false
    : false;
  const rawMaterialAbsent =
    isRawMaterialAbsent(raw_material_probe) &&
    materialBoundaryIsSafe(materialBoundary) &&
    rawMaterialFlagsSafe({
      workbench_spine,
      handoffPlanReadback: handoff_plan_readback,
      operatorDecisionReadback: operator_decision_readback,
      copy_export_preview,
    });
  const dogfoodSeedReportPresent = Boolean(local_dogfood_seed_report);
  const dogfoodSeedReportReady = dogfoodSeedReportPresent
    ? isDogfoodSeedReportReady(local_dogfood_seed_report)
    : true;

  const checks = {
    active_grant_present:
      Boolean(workbench_spine?.latest_active_grant_summary.grant_id) &&
      Boolean(workbench_spine?.latest_active_grant_summary.grant_fingerprint),
    queued_candidate_present:
      (workbench_spine?.queued_candidate_summary.queued_candidate_count ?? 0) >
        0 &&
      Boolean(workbench_spine?.queued_candidate_summary.latest_candidate_id) &&
      Boolean(
        workbench_spine?.queued_candidate_summary.latest_candidate_fingerprint,
      ),
    ready_preflight_present:
      Boolean(workbench_spine?.ready_preflight_summary.preflight_packet_id) &&
      Boolean(
        workbench_spine?.ready_preflight_summary.preflight_packet_fingerprint,
      ),
    workbench_spine_ready:
      workbench_spine?.spine_status === READY_SPINE_STATUS,
    handoff_plan_ready:
      handoffPlan?.handoff_plan_status === READY_HANDOFF_PLAN_STATUS,
    operator_decision_accepted:
      operatorDecision?.decision_status === ACCEPTED_DECISION_STATUS,
    operator_decision_scope_limited:
      operatorDecision?.accepted_summary?.approval_scope === ACCEPTANCE_SCOPE,
    copy_export_preview_ready:
      copy_export_preview?.preview_status === READY_COPY_EXPORT_STATUS,
    source_chain_bindings_present: sourceChainBindingsPresent,
    dogfood_seed_report_present: dogfoodSeedReportPresent,
    dogfood_seed_report_ready: dogfoodSeedReportReady,
    authority_boundaries_all_false: authorityBoundariesAllFalse,
    export_boundary_passive: exportBoundaryPassive,
    raw_material_absent: rawMaterialAbsent,
  };
  const blockerReasons = buildBlockerReasons(checks, {
    copy_export_preview,
    local_dogfood_seed_report,
  });
  const readinessStatus = getReadinessStatus(checks, {
    workbench_spine,
    handoffPlan,
    operatorDecision,
    copy_export_preview,
    local_dogfood_seed_report,
  });
  const readinessChecks = {
    ...checks,
    checks_passed:
      readinessStatus === "ready_for_future_supervised_execution_design" &&
      blockerReasons.length === 0,
    blocker_reasons: blockerReasons,
    warning_reasons: buildWarningReasons({
      dogfoodSeedReportPresent,
      handoffPlanReadback: handoff_plan_readback,
      operatorDecisionReadback: operator_decision_readback,
      copy_export_preview,
    }),
  };

  const gateWithoutFingerprint = {
    readiness_gate_kind: AUTOHUNT_EXECUTION_READINESS_GATE_KIND,
    readiness_gate_version: AUTOHUNT_EXECUTION_READINESS_GATE_VERSION,
    scope: "project:augnes" as const,
    as_of,
    readiness_status: readinessStatus,
    source_chain_summary: sourceChainSummary,
    readiness_checks: readinessChecks,
    future_execution_design_requirements: [
      ...AUTOHUNT_EXECUTION_READINESS_FUTURE_DESIGN_REQUIREMENTS,
    ],
    allowed_next_design_outputs: [
      ...AUTOHUNT_EXECUTION_READINESS_ALLOWED_NEXT_DESIGN_OUTPUTS,
    ],
    forbidden_current_outputs: [
      ...AUTOHUNT_EXECUTION_READINESS_FORBIDDEN_CURRENT_OUTPUTS,
    ],
    authority_boundary: authorityBoundary,
    material_boundary: materialBoundary,
  };

  return {
    ...gateWithoutFingerprint,
    gate_fingerprint: fingerprint(gateWithoutFingerprint),
  };
}

export function buildAutohuntExecutionReadinessAuthorityBoundary(): AutohuntExecutionReadinessAuthorityBoundary {
  return Object.fromEntries(
    AUTOHUNT_EXECUTION_READINESS_AUTHORITY_FLAG_NAMES.map((flagName) => [
      flagName,
      false,
    ]),
  ) as AutohuntExecutionReadinessAuthorityBoundary;
}

function selectHandoffPlan(
  readback: AutohuntHandoffPlanPreviewReadback | null | undefined,
): AutohuntHandoffPlanPreview | null {
  return readback?.selected_handoff_plan ?? readback?.latest_ready_handoff_plan ?? null;
}

function selectOperatorDecision(
  readback:
    | AutohuntHandoffPlanOperatorReviewDecisionReadback
    | null
    | undefined,
): AutohuntHandoffPlanOperatorReviewDecision | null {
  return readback?.selected_decision ?? readback?.latest_accepted_decision ?? null;
}

function buildSourceChainSummary({
  workbench_spine,
  handoffPlan,
  operatorDecision,
  copy_export_preview,
}: {
  workbench_spine: AutohuntWorkbenchReadbackSpine | null | undefined;
  handoffPlan: AutohuntHandoffPlanPreview | null;
  operatorDecision: AutohuntHandoffPlanOperatorReviewDecision | null;
  copy_export_preview: AutohuntHandoffCopyExportPreview | null | undefined;
}): AutohuntExecutionReadinessSourceChainSummary {
  return {
    active_grant_id:
      workbench_spine?.latest_active_grant_summary.grant_id ?? null,
    active_grant_fingerprint:
      workbench_spine?.latest_active_grant_summary.grant_fingerprint ?? null,
    queued_candidate_count:
      workbench_spine?.queued_candidate_summary.queued_candidate_count ?? 0,
    latest_queued_candidate_id:
      workbench_spine?.queued_candidate_summary.latest_candidate_id ?? null,
    latest_queued_candidate_fingerprint:
      workbench_spine?.queued_candidate_summary.latest_candidate_fingerprint ??
      null,
    ready_preflight_packet_id:
      workbench_spine?.ready_preflight_summary.preflight_packet_id ?? null,
    ready_preflight_packet_fingerprint:
      workbench_spine?.ready_preflight_summary.preflight_packet_fingerprint ??
      null,
    workbench_spine_fingerprint: workbench_spine?.spine_fingerprint ?? null,
    workbench_spine_status: workbench_spine?.spine_status ?? null,
    handoff_plan_id: handoffPlan?.handoff_plan_id ?? null,
    handoff_plan_fingerprint: handoffPlan?.handoff_plan_fingerprint ?? null,
    operator_decision_id: operatorDecision?.decision_id ?? null,
    operator_decision_fingerprint:
      operatorDecision?.decision_fingerprint ?? null,
    operator_decision_status: operatorDecision?.decision_status ?? null,
    copy_export_preview_fingerprint:
      copy_export_preview?.preview_fingerprint ?? null,
    copy_export_preview_status: copy_export_preview?.preview_status ?? null,
  };
}

function validateSourceChainBindings({
  workbench_spine,
  handoffPlan,
  operatorDecision,
  copy_export_preview,
}: {
  workbench_spine: AutohuntWorkbenchReadbackSpine | null | undefined;
  handoffPlan: AutohuntHandoffPlanPreview | null;
  operatorDecision: AutohuntHandoffPlanOperatorReviewDecision | null;
  copy_export_preview: AutohuntHandoffCopyExportPreview | null | undefined;
}) {
  const required = requiredStringFieldsPresent(
    {
      spine_grant_id: workbench_spine?.latest_active_grant_summary.grant_id,
      spine_grant_fingerprint:
        workbench_spine?.latest_active_grant_summary.grant_fingerprint,
      spine_preflight_packet_id:
        workbench_spine?.ready_preflight_summary.preflight_packet_id,
      spine_preflight_packet_fingerprint:
        workbench_spine?.ready_preflight_summary.preflight_packet_fingerprint,
      spine_fingerprint: workbench_spine?.spine_fingerprint,
      handoff_plan_id: handoffPlan?.handoff_plan_id,
      handoff_plan_fingerprint: handoffPlan?.handoff_plan_fingerprint,
      decision_id: operatorDecision?.decision_id,
      decision_fingerprint: operatorDecision?.decision_fingerprint,
      copy_preview_fingerprint: copy_export_preview?.preview_fingerprint,
    },
    [
      "spine_grant_id",
      "spine_grant_fingerprint",
      "spine_preflight_packet_id",
      "spine_preflight_packet_fingerprint",
      "spine_fingerprint",
      "handoff_plan_id",
      "handoff_plan_fingerprint",
      "decision_id",
      "decision_fingerprint",
      "copy_preview_fingerprint",
    ],
  );
  const bindings = validateSourceBindingPairs([
    {
      field: "handoff_plan_source_grant_id",
      expected: workbench_spine?.latest_active_grant_summary.grant_id,
      actual: handoffPlan?.source_grant.grant_id,
      reason: "handoff_plan_must_bind_to_active_grant",
    },
    {
      field: "handoff_plan_source_grant_fingerprint",
      expected: workbench_spine?.latest_active_grant_summary.grant_fingerprint,
      actual: handoffPlan?.source_grant.grant_fingerprint,
      reason: "handoff_plan_must_bind_to_active_grant_fingerprint",
    },
    {
      field: "handoff_plan_source_preflight_id",
      expected: workbench_spine?.ready_preflight_summary.preflight_packet_id,
      actual: handoffPlan?.source_preflight.preflight_packet_id,
      reason: "handoff_plan_must_bind_to_ready_preflight",
    },
    {
      field: "handoff_plan_source_preflight_fingerprint",
      expected:
        workbench_spine?.ready_preflight_summary.preflight_packet_fingerprint,
      actual: handoffPlan?.source_preflight.preflight_packet_fingerprint,
      reason: "handoff_plan_must_bind_to_ready_preflight_fingerprint",
    },
    {
      field: "handoff_plan_source_spine_fingerprint",
      expected: workbench_spine?.spine_fingerprint,
      actual: handoffPlan?.source_workbench_spine.spine_fingerprint,
      reason: "handoff_plan_must_bind_to_workbench_spine",
    },
    {
      field: "decision_source_handoff_plan_id",
      expected: handoffPlan?.handoff_plan_id,
      actual: operatorDecision?.source_handoff_plan.handoff_plan_id,
      reason: "decision_must_bind_to_handoff_plan",
    },
    {
      field: "decision_source_handoff_plan_fingerprint",
      expected: handoffPlan?.handoff_plan_fingerprint,
      actual: operatorDecision?.source_handoff_plan.handoff_plan_fingerprint,
      reason: "decision_must_bind_to_handoff_plan_fingerprint",
    },
    {
      field: "copy_preview_source_decision_id",
      expected: operatorDecision?.decision_id,
      actual: copy_export_preview?.source_operator_decision.decision_id,
      reason: "copy_preview_must_bind_to_operator_decision",
    },
    {
      field: "copy_preview_source_decision_fingerprint",
      expected: operatorDecision?.decision_fingerprint,
      actual: copy_export_preview?.source_operator_decision.decision_fingerprint,
      reason: "copy_preview_must_bind_to_operator_decision_fingerprint",
    },
    {
      field: "copy_preview_source_handoff_plan_id",
      expected: handoffPlan?.handoff_plan_id,
      actual: copy_export_preview?.source_handoff_plan.handoff_plan_id,
      reason: "copy_preview_must_bind_to_handoff_plan",
    },
    {
      field: "copy_preview_source_handoff_plan_fingerprint",
      expected: handoffPlan?.handoff_plan_fingerprint,
      actual: copy_export_preview?.source_handoff_plan.handoff_plan_fingerprint,
      reason: "copy_preview_must_bind_to_handoff_plan_fingerprint",
    },
  ]);
  const candidateBindingsPresent =
    (workbench_spine?.chain_binding.selected_candidate_ids.length ?? 0) > 0 &&
    (workbench_spine?.chain_binding.selected_candidate_fingerprints.length ??
      0) > 0 &&
    arraysMatch(
      workbench_spine?.chain_binding.selected_candidate_ids ?? [],
      handoffPlan?.source_preflight.selected_candidate_ids ?? [],
    ) &&
    arraysMatch(
      workbench_spine?.chain_binding.selected_candidate_fingerprints ?? [],
      handoffPlan?.source_preflight.selected_candidate_fingerprints ?? [],
    ) &&
    arraysMatch(
      handoffPlan?.source_preflight.selected_candidate_ids ?? [],
      operatorDecision?.source_handoff_plan.selected_candidate_ids ?? [],
    ) &&
    arraysMatch(
      handoffPlan?.source_preflight.selected_candidate_fingerprints ?? [],
      operatorDecision?.source_handoff_plan.selected_candidate_fingerprints ??
        [],
    ) &&
    arraysMatch(
      operatorDecision?.source_handoff_plan.selected_candidate_ids ?? [],
      copy_export_preview?.source_handoff_plan.selected_candidate_ids ?? [],
    ) &&
    arraysMatch(
      operatorDecision?.source_handoff_plan.selected_candidate_fingerprints ??
        [],
      copy_export_preview?.source_handoff_plan.selected_candidate_fingerprints ??
        [],
    );

  return required.passed && bindings.passed && candidateBindingsPresent;
}

function arraysMatch(left: string[], right: string[]) {
  return stableJson(left) === stableJson(right);
}

function areAuthorityBoundariesAllFalse({
  gateAuthority,
  workbench_spine,
  handoffPlanReadback,
  handoffPlan,
  operatorDecisionReadback,
  operatorDecision,
  copy_export_preview,
}: {
  gateAuthority: AutohuntExecutionReadinessAuthorityBoundary;
  workbench_spine: AutohuntWorkbenchReadbackSpine | null | undefined;
  handoffPlanReadback: AutohuntHandoffPlanPreviewReadback | null | undefined;
  handoffPlan: AutohuntHandoffPlanPreview | null;
  operatorDecisionReadback:
    | AutohuntHandoffPlanOperatorReviewDecisionReadback
    | null
    | undefined;
  operatorDecision: AutohuntHandoffPlanOperatorReviewDecision | null;
  copy_export_preview: AutohuntHandoffCopyExportPreview | null | undefined;
}) {
  const boundaries = [
    gateAuthority,
    workbench_spine?.authority_boundary,
    handoffPlanReadback?.no_run_no_execution_boundary,
    handoffPlan?.authority_boundary,
    operatorDecisionReadback?.no_run_no_execution_boundary,
    operatorDecision?.authority_boundary,
    copy_export_preview?.authority_boundary,
  ].filter(Boolean) as object[];
  return boundaries.every((boundary, index) => {
    const assertion = assertAllFalseBoundary(
      boundary,
      `autohunt_execution_readiness_boundary_${index}`,
    );
    return assertion.passed && allValuesFalse(boundary);
  });
}

function buildMaterialBoundary(): AutohuntExecutionReadinessMaterialBoundary {
  return {
    raw_material_persisted: false,
    raw_prompt_text_persisted: false,
    raw_copy_text_persisted: false,
    raw_pr_body_persisted: false,
    raw_operator_note_persisted: false,
    raw_source_payload_persisted: false,
    secret_or_token_persisted: false,
    url_or_env_value_persisted: false,
  };
}

function materialBoundaryIsSafe(
  boundary: AutohuntExecutionReadinessMaterialBoundary,
) {
  return Object.values(boundary).every((value) => value === false);
}

function rawMaterialFlagsSafe({
  workbench_spine,
  handoffPlanReadback,
  operatorDecisionReadback,
  copy_export_preview,
}: {
  workbench_spine: AutohuntWorkbenchReadbackSpine | null | undefined;
  handoffPlanReadback: AutohuntHandoffPlanPreviewReadback | null | undefined;
  operatorDecisionReadback:
    | AutohuntHandoffPlanOperatorReviewDecisionReadback
    | null
    | undefined;
  copy_export_preview: AutohuntHandoffCopyExportPreview | null | undefined;
}) {
  return (
    (workbench_spine?.raw_material_persisted ?? false) === false &&
    (handoffPlanReadback?.raw_material_persisted ?? false) === false &&
    (operatorDecisionReadback?.raw_material_persisted ?? false) === false &&
    (copy_export_preview?.copy_packet.raw_copy_text_persisted ?? false) ===
      false &&
    (copy_export_preview?.draft_pr_plan_preview.raw_pr_body_persisted ??
      false) === false &&
    (copy_export_preview?.persisted_material_boundary.persists_raw_copy_text ??
      false) === false &&
    (copy_export_preview?.persisted_material_boundary.persists_raw_prompt_text ??
      false) === false &&
    (copy_export_preview?.persisted_material_boundary.persists_raw_pr_body ??
      false) === false &&
    (copy_export_preview?.persisted_material_boundary
      .persists_raw_operator_note ?? false) === false &&
    (copy_export_preview?.persisted_material_boundary
      .persists_raw_source_payload ?? false) === false &&
    isRawMaterialAbsent(stripSafeRawBoundaryKeys(copy_export_preview ?? null))
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

function stripSafeRawBoundaryKeys(value: unknown): unknown {
  if (value === null || typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map(stripSafeRawBoundaryKeys);
  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => !SAFE_RAW_BOUNDARY_KEYS.has(key))
      .map(([key, nested]) => [key, stripSafeRawBoundaryKeys(nested)]),
  );
}

function isDogfoodSeedReportReady(
  report: AutohuntExecutionReadinessDogfoodSeedReport | null | undefined,
) {
  if (!report) return false;
  const statuses = report.selected_statuses ?? {};
  const readbackSelections = Object.values(report.readback_selections ?? {});
  const noRunBoundary = Object.values(
    report.no_run_no_execution_boundary ?? {},
  );
  return (
    report.ok === true &&
    statuses.grant === "active" &&
    statuses.queue_candidate === "queued" &&
    statuses.preflight_packet === READY_SPINE_STATUS &&
    statuses.workbench_spine === READY_SPINE_STATUS &&
    statuses.handoff_plan === READY_HANDOFF_PLAN_STATUS &&
    statuses.operator_decision === ACCEPTED_DECISION_STATUS &&
    statuses.approval_scope === ACCEPTANCE_SCOPE &&
    readbackSelections.length > 0 &&
    readbackSelections.every((value) => value === true) &&
    noRunBoundary.length > 0 &&
    noRunBoundary.every((value) => value === true) &&
    report.raw_material_persisted_any === false &&
    report.no_external_or_execution_authority === true
  );
}

function buildBlockerReasons(
  checks: {
    active_grant_present: boolean;
    queued_candidate_present: boolean;
    ready_preflight_present: boolean;
    workbench_spine_ready: boolean;
    handoff_plan_ready: boolean;
    operator_decision_accepted: boolean;
    operator_decision_scope_limited: boolean;
    copy_export_preview_ready: boolean;
    source_chain_bindings_present: boolean;
    dogfood_seed_report_present: boolean;
    dogfood_seed_report_ready: boolean;
    authority_boundaries_all_false: boolean;
    export_boundary_passive: boolean;
    raw_material_absent: boolean;
  },
  sources: {
    copy_export_preview: AutohuntHandoffCopyExportPreview | null | undefined;
    local_dogfood_seed_report:
      | AutohuntExecutionReadinessDogfoodSeedReport
      | null
      | undefined;
  },
) {
  return [
    !checks.active_grant_present ? "missing_active_grant" : null,
    !checks.queued_candidate_present ? "missing_queued_candidate" : null,
    !checks.ready_preflight_present ? "missing_ready_preflight" : null,
    !checks.workbench_spine_ready ? "missing_ready_workbench_spine" : null,
    !checks.handoff_plan_ready ? "missing_ready_handoff_plan" : null,
    !checks.operator_decision_accepted
      ? "missing_accepted_operator_decision"
      : null,
    !checks.operator_decision_scope_limited
      ? "operator_decision_scope_not_limited"
      : null,
    !sources.copy_export_preview ? "missing_copy_export_preview" : null,
    sources.copy_export_preview && !checks.copy_export_preview_ready
      ? "copy_export_preview_not_ready"
      : null,
    !checks.source_chain_bindings_present
      ? "source_chain_bindings_missing"
      : null,
    sources.local_dogfood_seed_report && !checks.dogfood_seed_report_ready
      ? "dogfood_seed_not_verified"
      : null,
    !checks.authority_boundaries_all_false
      ? "authority_boundary_not_clear"
      : null,
    !checks.export_boundary_passive ? "export_boundary_not_passive" : null,
    !checks.raw_material_absent ? "unsafe_material_detected" : null,
  ].filter((reason): reason is string => Boolean(reason));
}

function getReadinessStatus(
  checks: {
    active_grant_present: boolean;
    queued_candidate_present: boolean;
    ready_preflight_present: boolean;
    workbench_spine_ready: boolean;
    handoff_plan_ready: boolean;
    operator_decision_accepted: boolean;
    operator_decision_scope_limited: boolean;
    copy_export_preview_ready: boolean;
    source_chain_bindings_present: boolean;
    dogfood_seed_report_ready: boolean;
    authority_boundaries_all_false: boolean;
    export_boundary_passive: boolean;
    raw_material_absent: boolean;
  },
  sources: {
    workbench_spine: AutohuntWorkbenchReadbackSpine | null | undefined;
    handoffPlan: AutohuntHandoffPlanPreview | null;
    operatorDecision: AutohuntHandoffPlanOperatorReviewDecision | null;
    copy_export_preview: AutohuntHandoffCopyExportPreview | null | undefined;
    local_dogfood_seed_report:
      | AutohuntExecutionReadinessDogfoodSeedReport
      | null
      | undefined;
  },
): AutohuntExecutionReadinessGateStatus {
  if (!checks.raw_material_absent) return "unsafe_material_detected";
  if (!checks.authority_boundaries_all_false) {
    return "authority_boundary_not_clear";
  }
  if (!sources.workbench_spine) return "insufficient_data";
  if (!checks.active_grant_present) return "missing_active_grant";
  if (!checks.queued_candidate_present) return "missing_queued_candidate";
  if (!checks.ready_preflight_present) return "missing_ready_preflight";
  if (!checks.workbench_spine_ready) return "missing_ready_workbench_spine";
  if (!sources.handoffPlan || !checks.handoff_plan_ready) {
    return "missing_ready_handoff_plan";
  }
  if (!sources.operatorDecision || !checks.operator_decision_accepted) {
    return "missing_accepted_operator_decision";
  }
  if (!sources.copy_export_preview) return "missing_copy_export_preview";
  if (!checks.copy_export_preview_ready) return "copy_export_preview_not_ready";
  if (
    !checks.operator_decision_scope_limited ||
    !checks.source_chain_bindings_present ||
    !checks.export_boundary_passive
  ) {
    return "blocked";
  }
  if (sources.local_dogfood_seed_report && !checks.dogfood_seed_report_ready) {
    return "dogfood_seed_not_verified";
  }
  return "ready_for_future_supervised_execution_design";
}

function buildWarningReasons({
  dogfoodSeedReportPresent,
  handoffPlanReadback,
  operatorDecisionReadback,
  copy_export_preview,
}: {
  dogfoodSeedReportPresent: boolean;
  handoffPlanReadback: AutohuntHandoffPlanPreviewReadback | null | undefined;
  operatorDecisionReadback:
    | AutohuntHandoffPlanOperatorReviewDecisionReadback
    | null
    | undefined;
  copy_export_preview: AutohuntHandoffCopyExportPreview | null | undefined;
}) {
  return [
    "future_execution_design_only",
    "fresh_explicit_approval_still_required",
    !dogfoodSeedReportPresent
      ? "local_dogfood_seed_report_not_supplied_to_builder"
      : null,
    (handoffPlanReadback?.invalid_record_count ?? 0) > 0
      ? "handoff_plan_invalid_records_present"
      : null,
    (operatorDecisionReadback?.invalid_record_count ?? 0) > 0
      ? "operator_decision_invalid_records_present"
      : null,
    copy_export_preview?.validation.warning_reasons ?? [],
  ]
    .flat()
    .filter((reason): reason is string => Boolean(reason));
}
