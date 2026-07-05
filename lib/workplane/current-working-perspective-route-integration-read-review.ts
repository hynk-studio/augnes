import {
  CURRENT_WORKING_PERSPECTIVE_ROUTE_INTEGRATION_READ_REVIEW_VERSION,
  type CurrentWorkingPerspectiveRouteIntegrationReadReview,
  type CurrentWorkingPerspectiveRouteIntegrationReadReviewAuthorityBoundary,
  type CurrentWorkingPerspectiveRouteIntegrationReadReviewInput,
  type CurrentWorkingPerspectiveRouteIntegrationReadReviewStatus,
} from "@/types/current-working-perspective-route-integration-read-review";
import type { CurrentWorkingPerspectiveRouteIntegrationRead } from "@/types/current-working-perspective-route-integration-read";

type RecordValue = Record<string, unknown>;

const FORBIDDEN_RAW_KEYS = new Set([
  "raw_text",
  "raw_report",
  "raw_excerpt",
]);

export function buildCurrentWorkingPerspectiveRouteIntegrationReadReviewV01(
  input: CurrentWorkingPerspectiveRouteIntegrationReadReviewInput = {},
): CurrentWorkingPerspectiveRouteIntegrationReadReview {
  const asOf = input.as_of ?? new Date().toISOString();
  const sourceRefs = input.source_refs ?? [];
  const read = isRouteIntegrationRead(input.route_integration_read)
    ? input.route_integration_read
    : null;
  const problemReasons: string[] = [];
  if (
    input.route_integration_read !== undefined &&
    input.route_integration_read !== null &&
    !read
  ) {
    problemReasons.push("current_working_perspective_route_integration_read_malformed");
  }
  if (containsRawMaterialKeys(input.route_integration_read)) {
    problemReasons.push("raw_material_key_refused");
  }
  if (read && !hasExpectedReadAuthorityBoundary(read.authority_boundary)) {
    problemReasons.push("current_working_perspective_route_integration_read_authority_boundary_invalid");
  }
  if (
    read?.applied_current_working_perspective &&
    !read.runtime_current_working_perspective
  ) {
    problemReasons.push("runtime_fallback_missing_for_applied_snapshot_participation");
  }
  const selectedContractFound = Boolean(
    input.selected_contract_record_id &&
      read?.contract_summary.record_id === input.selected_contract_record_id,
  );
  const selectedSnapshotFound = Boolean(
    input.selected_applied_snapshot_ref &&
      read?.applied_snapshot_metadata.applied_snapshot_ref ===
        input.selected_applied_snapshot_ref,
  );
  const reviewStatus = determineReviewStatus(read, problemReasons);
  const primarySource =
    read?.response_mode === "applied_snapshot_preferred_with_runtime_fallback"
      ? "applied_snapshot"
      : read?.primary_current_working_perspective
        ? "runtime"
        : "none";

  return {
    review_version:
      CURRENT_WORKING_PERSPECTIVE_ROUTE_INTEGRATION_READ_REVIEW_VERSION,
    scope: input.scope ?? read?.scope ?? "project:augnes",
    as_of: asOf,
    source_refs: sourceRefs,
    review_status: reviewStatus,
    input_summary: {
      has_route_integration_read: Boolean(read),
      read_status: read?.status ?? null,
      response_mode: read?.response_mode ?? null,
      selected_contract_record_id: input.selected_contract_record_id ?? null,
      selected_contract_record_found: selectedContractFound,
      selected_applied_snapshot_ref: input.selected_applied_snapshot_ref ?? null,
      selected_applied_snapshot_found: selectedSnapshotFound,
      runtime_fallback_available: Boolean(read?.runtime_current_working_perspective),
      applied_snapshot_participates: Boolean(
        read?.applied_current_working_perspective,
      ),
    },
    route_integration_summary: {
      route_path: read?.route_path ?? null,
      route_family: read?.route_family ?? null,
      response_mode: read?.response_mode ?? null,
      primary_source: primarySource,
      status: read?.status ?? null,
    },
    contract_summary: {
      contract_record_id: read?.contract_summary.record_id ?? null,
      route_integration_mode:
        read?.contract_summary.route_integration_mode ?? null,
      source_applied_snapshot_ref:
        read?.contract_summary.source_applied_snapshot_ref ?? null,
      source_cwp_apply_record_ref_count:
        read?.contract_summary.source_cwp_apply_record_refs.length ?? 0,
      source_cwp_update_contract_record_ref_count:
        read?.contract_summary.source_cwp_update_contract_record_refs.length ??
        0,
    },
    applied_snapshot_summary: {
      applied_snapshot_ref:
        read?.applied_snapshot_metadata.applied_snapshot_ref ?? null,
      source_contract_record_ref:
        read?.applied_snapshot_metadata.source_contract_record_ref ?? null,
      source_apply_record_ref:
        read?.applied_snapshot_metadata.source_apply_record_ref ?? null,
      applied_patch_count:
        read?.applied_snapshot_metadata.applied_patch_count ?? 0,
      overlay_candidate:
        read?.applied_snapshot_metadata.overlay_candidate ?? false,
      preferred_primary:
        read?.applied_snapshot_metadata.preferred_primary ?? false,
    },
    runtime_fallback_summary: {
      runtime_cwp_available:
        read?.fallback_metadata.runtime_cwp_available ?? false,
      used_runtime_fallback: read?.fallback_metadata.used_runtime_fallback ?? false,
      fallback_reason: read?.fallback_metadata.fallback_reason ?? null,
    },
    blocked_reasons: uniqueStrings([
      ...problemReasons,
      ...(read?.blocked_reasons ?? []),
    ]),
    warning_reasons: read?.warnings ?? [],
    refusal_reasons: read?.refusal_reasons ?? [],
    operator_review_checklist: [
      "confirm_route_get_remains_read_only",
      "confirm_runtime_fallback_is_available_when_snapshot_participates",
      "confirm_no_upstream_cwp_source_table_mutation",
      "confirm_no_applied_snapshot_or_contract_record_write",
    ],
    would_not_do: [
      "does_not_write_db_or_create_schema",
      "does_not_modify_api_perspective_current_route_from_workbench",
      "does_not_mutate_upstream_current_working_perspective_source_tables",
      "does_not_apply_handoff_memory_relay_metrics_or_external_actions",
    ],
    non_goals: [
      "no_post_put_patch_delete_route_behavior",
      "no_hidden_global_default_db_path",
      "no_handoff_context_update_or_apply",
      "no_memory_or_metric_promotion",
    ],
    authority_boundary:
      createCurrentWorkingPerspectiveRouteIntegrationReadReviewAuthorityBoundaryV01(),
    route_integration_read: read,
  };
}

export function createCurrentWorkingPerspectiveRouteIntegrationReadReviewAuthorityBoundaryV01():
  CurrentWorkingPerspectiveRouteIntegrationReadReviewAuthorityBoundary {
  return {
    read_only: true,
    route_integration_read_review_only: true,
    source_of_truth: false,
    can_write_db: false,
    can_create_schema: false,
    can_modify_api_perspective_current_route: false,
    can_replace_current_working_perspective_route_response: false,
    can_update_upstream_current_working_perspective_source_tables: false,
    can_mutate_upstream_current_working_perspective_source_tables: false,
    can_write_applied_current_working_perspective_snapshot: false,
    can_write_current_working_perspective_apply_record: false,
    can_write_current_working_perspective_update_contract_record: false,
    can_write_route_integration_contract_record: false,
    can_write_perspective_unit: false,
    can_write_next_work_bias: false,
    can_write_continuity_relay: false,
    can_update_continuity_relay: false,
    can_apply_live_relay_state: false,
    can_mutate_handoff_context: false,
    can_apply_handoff_context: false,
    can_write_selected_refs_to_live_handoff: false,
    can_send_handoff: false,
    can_write_memory: false,
    can_mutate_memory: false,
    can_promote_memory: false,
    can_update_global_dogfood_metrics: false,
    can_write_dogfood_metrics: false,
    can_write_dogfood_metric_snapshot: false,
    can_write_reuse_outcome_ledger: false,
    can_write_expected_observed_delta: false,
    can_write_work_episode: false,
    can_call_provider_openai: false,
    can_call_github: false,
    can_execute_codex: false,
    can_create_pr: false,
    can_merge_pr: false,
    can_run_autonomous_action: false,
    can_create_graph_or_vector_store: false,
    can_create_rag_stack: false,
    can_crawl_or_observe_browser: false,
    can_render_workbench_action_button: false,
    notes: [
      "Review consumes already-built route integration read material only.",
      "Workbench does not call the route, open DB handles, create schema, or write records.",
    ],
  };
}

function determineReviewStatus(
  read: CurrentWorkingPerspectiveRouteIntegrationRead | null,
  problemReasons: string[],
): CurrentWorkingPerspectiveRouteIntegrationReadReviewStatus {
  if (problemReasons.length > 0) return "integration_invalid";
  if (!read) return "runtime_only";
  if (
    read.status === "contract_invalid" ||
    read.status === "applied_snapshot_invalid"
  ) {
    return "integration_invalid";
  }
  if (
    read.status === "fallback_to_runtime" ||
    read.status === "contract_missing" ||
    read.status === "applied_snapshot_missing"
  ) {
    return "fallback_to_runtime";
  }
  if (read.status === "runtime_with_applied_snapshot_overlay_candidate") {
    return "applied_snapshot_overlay_available";
  }
  if (read.status === "applied_snapshot_preferred_with_runtime_fallback") {
    return "applied_snapshot_preferred_available";
  }
  if (read.status === "runtime_with_applied_snapshot_hint") {
    return "integration_available";
  }
  return "runtime_only";
}

function isRouteIntegrationRead(
  value: unknown,
): value is CurrentWorkingPerspectiveRouteIntegrationRead {
  return (
    isRecord(value) &&
    value.read_version ===
      "current_working_perspective_route_integration_read.v0.1" &&
    value.scope === "project:augnes" &&
    typeof value.as_of === "string" &&
    typeof value.status === "string" &&
    value.route_path === "/api/perspective/current" &&
    value.route_family === "current_working_perspective" &&
    typeof value.response_mode === "string" &&
    isRecord(value.route_integration_metadata) &&
    isRecord(value.fallback_metadata) &&
    isRecord(value.authority_boundary) &&
    Array.isArray(value.source_refs) &&
    Array.isArray(value.evidence_refs) &&
    Array.isArray(value.refusal_reasons) &&
    Array.isArray(value.blocked_reasons) &&
    Array.isArray(value.warnings)
  );
}

function hasExpectedReadAuthorityBoundary(value: unknown): boolean {
  if (!isRecord(value)) return false;
  const expected = {
    read_only: true,
    route_integration_read_only: true,
    source_of_truth: false,
    can_write_db: false,
    can_create_schema: false,
    can_modify_api_perspective_current_route: false,
    can_replace_current_working_perspective_route_response: false,
    can_update_upstream_current_working_perspective_source_tables: false,
    can_mutate_upstream_current_working_perspective_source_tables: false,
    can_write_applied_current_working_perspective_snapshot: false,
    can_write_current_working_perspective_apply_record: false,
    can_write_current_working_perspective_update_contract_record: false,
    can_write_route_integration_contract_record: false,
    can_write_perspective_unit: false,
    can_write_next_work_bias: false,
    can_write_continuity_relay: false,
    can_update_continuity_relay: false,
    can_apply_live_relay_state: false,
    can_mutate_handoff_context: false,
    can_apply_handoff_context: false,
    can_write_selected_refs_to_live_handoff: false,
    can_send_handoff: false,
    can_write_memory: false,
    can_mutate_memory: false,
    can_promote_memory: false,
    can_update_global_dogfood_metrics: false,
    can_write_dogfood_metrics: false,
    can_write_dogfood_metric_snapshot: false,
    can_write_reuse_outcome_ledger: false,
    can_write_expected_observed_delta: false,
    can_write_work_episode: false,
    can_call_provider_openai: false,
    can_call_github: false,
    can_execute_codex: false,
    can_create_pr: false,
    can_merge_pr: false,
    can_run_autonomous_action: false,
    can_create_graph_or_vector_store: false,
    can_create_rag_stack: false,
    can_crawl_or_observe_browser: false,
    can_render_workbench_action_button: false,
  };
  return Object.entries(expected).every(([key, expectedValue]) =>
    value[key] === expectedValue,
  );
}

function containsRawMaterialKeys(value: unknown, seen = new Set<unknown>()): boolean {
  if (!value || typeof value !== "object") return false;
  if (seen.has(value)) return false;
  seen.add(value);
  if (Array.isArray(value)) {
    return value.some((entry) => containsRawMaterialKeys(entry, seen));
  }
  return Object.entries(value as RecordValue).some(
    ([key, nested]) =>
      FORBIDDEN_RAW_KEYS.has(key) || containsRawMaterialKeys(nested, seen),
  );
}

function isRecord(value: unknown): value is RecordValue {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function uniqueStrings(values: Array<string | null | undefined>): string[] {
  return [...new Set(values.filter((value): value is string => Boolean(value)))];
}
