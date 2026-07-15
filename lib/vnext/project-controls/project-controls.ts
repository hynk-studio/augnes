import {
  canonicalizeProtocolValueV01,
  compareProtocolCodeUnitsV01,
} from "@/lib/vnext/protocol-primitives";
import type { ExternalRefV01 } from "@/types/vnext/external-ref";
import {
  PERSONAL_PERSPECTIVE_CONTEXT_SELECTION_VERSION_V01,
  PROJECT_AUTOMATION_ADMISSION_RESULT_VERSION_V01,
  PROJECT_AUTOMATION_POLICY_PROFILE_V01,
  PROJECT_AUTOMATION_POLICY_SUMMARY_VERSION_V01,
  PROJECT_AUTOMATION_POLICY_VERSION_V01,
  type PersonalPerspectiveContextCandidateV01,
  type PersonalPerspectiveContextSelectionV01,
  type PersonalPerspectiveEffectiveScopeV01,
  type ProjectAutomationAdmissionInputV01,
  type ProjectAutomationAdmissionResultV01,
  type ProjectAutomationAdmissionStatusV01,
  type ProjectAutomationEffectiveStatusV01,
  type ProjectAutomationPolicySummaryV01,
  type ProjectAutomationPolicyV01,
} from "@/types/vnext/project-controls";
import type {
  TaskContextPacketExcludedEntryV01,
  TaskContextPacketSelectedEntryV01,
} from "@/types/vnext/task-context-packet";

export const PROJECT_CONTROLS_CONTEXT_LINEAGE_NAMESPACE_V01 =
  "project_controls.v0.1" as const;

export function buildConservativeProjectAutomationPolicyV01(input: {
  workspace_id: string;
  project_id: string;
}): ProjectAutomationPolicyV01 {
  return {
    policy_version: PROJECT_AUTOMATION_POLICY_VERSION_V01,
    profile: PROJECT_AUTOMATION_POLICY_PROFILE_V01,
    workspace_id: input.workspace_id,
    project_id: input.project_id,
    trigger: "policy_triggered_work",
    max_active_automated_runs: 1,
    automatic_retry: false,
    automatic_semantic_commit: false,
    durable_semantic_change_requires_review: true,
    automatic_approval: false,
    external_actions_authorized: false,
    provider_or_model_use_authorized: false,
    capability_grant_required: true,
    scheduler_integration: "external_reference_only",
    stop_conditions: [
      "manual_pause",
      "review_required",
      "grant_unavailable",
      "capability_unavailable",
      "active_run_limit",
      "policy_denied",
    ],
    can_expand_own_authority: false,
    can_increase_own_budget: false,
    can_select_cross_project_work: false,
    can_merge: false,
    can_publish: false,
    can_deploy: false,
    can_self_modify: false,
  };
}

export function validateProjectAutomationPolicyV01(
  input: unknown,
  scope: { workspace_id: string; project_id: string },
): { valid: boolean; errors: string[] } {
  const expected = buildConservativeProjectAutomationPolicyV01(scope);
  const valid =
    canonicalizeProtocolValueV01(input) ===
    canonicalizeProtocolValueV01(expected);
  return {
    valid,
    errors: valid
      ? []
      : [
          "The persisted automation policy is malformed, out of scope, or expands R3 authority.",
        ],
  };
}

export function buildProjectAutomationPolicySummaryV01(): ProjectAutomationPolicySummaryV01 {
  return {
    policy_summary_version:
      PROJECT_AUTOMATION_POLICY_SUMMARY_VERSION_V01,
    title: "Bounded project automation",
    profile: PROJECT_AUTOMATION_POLICY_PROFILE_V01,
    boundaries: [
      "One automated run at a time",
      "No automatic retry",
      "Review required before semantic change",
      "External actions not authorized",
      "Provider use requires separate capability and grant",
      "No scheduler connected",
    ],
  };
}

export function evaluateProjectAutomationAdmissionV01(
  input: ProjectAutomationAdmissionInputV01,
): ProjectAutomationAdmissionResultV01 {
  const scopeMatches = [
    input.control,
    input.candidate,
    input.grant_readiness,
    input.active_run_readiness,
  ].every(
    (value) =>
      value.workspace_id === input.workspace_id &&
      value.project_id === input.project_id,
  );
  if (!scopeMatches) {
    return admissionResult(
      input,
      "project_scope_mismatch",
      "Automation control, work, grant readiness, and active-run readiness must belong to the same project.",
    );
  }

  if (!validEffectiveAutomationStatus(input.control)) {
    return admissionResult(
      input,
      "policy_denied",
      "The project automation control could not be validated safely.",
    );
  }

  if (input.control.status === "not_configured") {
    return admissionResult(
      input,
      "not_configured",
      "Project automation is not configured.",
    );
  }
  if (input.control.status === "disabled") {
    return admissionResult(
      input,
      "disabled",
      "Project automation is disabled.",
    );
  }
  if (input.control.status === "paused") {
    return admissionResult(
      input,
      "paused",
      "Project automation is paused for new policy-triggered work.",
    );
  }

  const activeRunCount =
    input.active_run_readiness.active_automated_run_count;
  if (!Number.isSafeInteger(activeRunCount) || activeRunCount < 0) {
    return admissionResult(
      input,
      "unsupported",
      "Active automated-run readiness is unavailable.",
    );
  }
  if (activeRunCount >= 1) {
    return admissionResult(
      input,
      "active_run_limit",
      "The bounded policy permits only one active automated run for this project.",
    );
  }

  const grantStatus = input.grant_readiness.status;
  if (grantStatus === "required") {
    return admissionResult(
      input,
      "grant_required",
      "Project control permits the next check, but a project-scoped CapabilityGrant is still required.",
    );
  }
  if (grantStatus === "capability_unavailable") {
    return admissionResult(
      input,
      "capability_unavailable",
      "A required execution capability is unavailable.",
    );
  }
  if (grantStatus === "policy_denied") {
    return admissionResult(
      input,
      "policy_denied",
      "A later policy or grant check denied this work.",
    );
  }
  if (grantStatus === "unsupported") {
    return admissionResult(
      input,
      "unsupported",
      "The required grant or capability readiness check is unsupported.",
    );
  }
  return admissionResult(
    input,
    "eligible",
    "All supplied admission checks passed; execution still requires the separate run lifecycle boundary.",
  );
}

export function selectPersonalPerspectiveContextV01(input: {
  workspace_id: string;
  project_id: string;
  scope: PersonalPerspectiveEffectiveScopeV01;
  candidates: readonly PersonalPerspectiveContextCandidateV01[];
}): PersonalPerspectiveContextSelectionV01 {
  if (
    input.scope.workspace_id !== input.workspace_id ||
    input.scope.project_id !== input.project_id
  ) {
    throw new Error("personal_perspective_scope_binding_mismatch");
  }
  const scopeLineageRef = createPersonalPerspectiveScopeLineageRefV01(
    input.scope,
  );
  const selected: TaskContextPacketSelectedEntryV01[] = [];
  const excluded: TaskContextPacketExcludedEntryV01[] = [];
  const uniqueCandidates = uniquePersonalPerspectiveCandidates(input.candidates);

  for (const candidate of uniqueCandidates) {
    const exclusionReason = personalPerspectiveExclusionReason(
      input,
      candidate,
    );
    if (exclusionReason) {
      excluded.push(excludedEntry(candidate.entry, exclusionReason));
      continue;
    }
    selected.push({
      ...candidate.entry,
      why_included:
        "Included because this project explicitly permits Personal Perspective and the material passed project scope, review, currentness, trust, and context-selection checks.",
      compatibility_source_ref: scopeLineageRef,
    });
  }

  return {
    context_selection_version:
      PERSONAL_PERSPECTIVE_CONTEXT_SELECTION_VERSION_V01,
    workspace_id: input.workspace_id,
    project_id: input.project_id,
    scope_status: input.scope.status,
    scope_revision: input.scope.scope_revision,
    scope_lineage_ref: scopeLineageRef,
    selected_context: selected.sort(compareSelectedEntries),
    excluded_context: excluded.sort(compareExcludedEntries),
    eligible_selected_count: selected.length,
    excluded_count: excluded.length,
  };
}

export function isPersonalPerspectiveSelectedEntryV01(
  entry: TaskContextPacketSelectedEntryV01,
): boolean {
  return (
    entry.entry_kind === "memory_ref" &&
    entry.compatibility_source_ref?.ref_type ===
      "project_personal_perspective_scope" &&
    entry.compatibility_source_ref.compatibility_namespace ===
      PROJECT_CONTROLS_CONTEXT_LINEAGE_NAMESPACE_V01
  );
}

export function createPersonalPerspectiveScopeLineageRefV01(
  scope: PersonalPerspectiveEffectiveScopeV01,
): ExternalRefV01 | null {
  if (!scope.configured || scope.scope_revision === null || !scope.updated_at) {
    return null;
  }
  return {
    ref_version: "external_ref.v0.1",
    ref_type: "project_personal_perspective_scope",
    external_id: `${scope.project_id}:personal-perspective-scope:${scope.scope_revision}`,
    provider: null,
    host: null,
    observed_at: scope.updated_at,
    source_ref: `scope-revision:${scope.scope_revision}`,
    compatibility_namespace:
      PROJECT_CONTROLS_CONTEXT_LINEAGE_NAMESPACE_V01,
    trust_class: "direct_local_observation",
  };
}

function validEffectiveAutomationStatus(
  control: ProjectAutomationEffectiveStatusV01,
): boolean {
  const summaryMatches =
    canonicalizeProtocolValueV01(control.policy_summary) ===
    canonicalizeProtocolValueV01(buildProjectAutomationPolicySummaryV01());
  if (!summaryMatches) return false;
  if (control.status === "not_configured") {
    return (
      !control.configured &&
      control.control_revision === null &&
      !control.policy_triggered_work_allowed_at_control_layer
    );
  }
  if (!control.configured || control.control_revision === null) return false;
  return (
    control.policy_triggered_work_allowed_at_control_layer ===
    (control.status === "enabled")
  );
}

function admissionResult(
  input: ProjectAutomationAdmissionInputV01,
  status: ProjectAutomationAdmissionStatusV01,
  reason: string,
): ProjectAutomationAdmissionResultV01 {
  return {
    admission_result_version:
      PROJECT_AUTOMATION_ADMISSION_RESULT_VERSION_V01,
    workspace_id: input.workspace_id,
    project_id: input.project_id,
    status,
    eligible_for_next_gate: status === "eligible",
    reason,
    execution_authority_granted: false,
    grant_created: false,
    run_created: false,
    receipt_created: false,
    proposal_created: false,
    semantic_state_changed: false,
  };
}

function personalPerspectiveExclusionReason(
  input: {
    workspace_id: string;
    project_id: string;
    scope: PersonalPerspectiveEffectiveScopeV01;
  },
  candidate: PersonalPerspectiveContextCandidateV01,
): string | null {
  if (input.scope.status === "not_configured") {
    return "Excluded because Personal Perspective is not configured for this project.";
  }
  if (input.scope.status === "excluded") {
    return "Excluded because Personal Perspective is explicitly excluded for this project.";
  }
  if (candidate.candidate_scope.scope_kind !== "canonical_project") {
    return "Excluded because global, unscoped, or legacy Personal Perspective material is not eligible for implicit project reuse.";
  }
  if (
    candidate.candidate_scope.project_id === "project:augnes" ||
    candidate.candidate_scope.workspace_id !== input.workspace_id ||
    candidate.candidate_scope.project_id !== input.project_id
  ) {
    return "Excluded because the Personal Perspective material belongs to another project scope.";
  }
  if (candidate.review_status !== "reviewed") {
    return "Excluded because the Personal Perspective material is not reviewed and eligible.";
  }
  if (candidate.entry.currentness.status !== "fresh") {
    return "Excluded because the Personal Perspective material is not current enough for this task.";
  }
  if (candidate.trust_policy_status !== "eligible") {
    return "Excluded because the Personal Perspective material did not pass the existing trust policy.";
  }
  if (candidate.entry.entry_kind !== "memory_ref") {
    return "Excluded because the Personal Perspective material is not represented by the shared reviewed-memory context contract.";
  }
  return null;
}

function excludedEntry(
  entry: TaskContextPacketSelectedEntryV01,
  whyExcluded: string,
): TaskContextPacketExcludedEntryV01 {
  return {
    entry_id: `personal-perspective-excluded:${entry.entry_id}`,
    source_ref: entry.source_ref,
    external_ref: entry.external_ref,
    why_excluded: whyExcluded,
    currentness: entry.currentness,
  };
}

function uniquePersonalPerspectiveCandidates(
  candidates: readonly PersonalPerspectiveContextCandidateV01[],
): PersonalPerspectiveContextCandidateV01[] {
  const unique = new Map<string, PersonalPerspectiveContextCandidateV01>();
  for (const candidate of candidates) {
    const key = canonicalizeProtocolValueV01(candidate);
    if (!unique.has(key)) unique.set(key, candidate);
  }
  return [...unique.values()].sort((left, right) =>
    compareProtocolCodeUnitsV01(
      canonicalizeProtocolValueV01(left),
      canonicalizeProtocolValueV01(right),
    ),
  );
}

function compareSelectedEntries(
  left: TaskContextPacketSelectedEntryV01,
  right: TaskContextPacketSelectedEntryV01,
): number {
  return compareProtocolCodeUnitsV01(
    canonicalizeProtocolValueV01(left),
    canonicalizeProtocolValueV01(right),
  );
}

function compareExcludedEntries(
  left: TaskContextPacketExcludedEntryV01,
  right: TaskContextPacketExcludedEntryV01,
): number {
  return compareProtocolCodeUnitsV01(
    canonicalizeProtocolValueV01(left),
    canonicalizeProtocolValueV01(right),
  );
}
