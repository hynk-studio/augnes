import {
  CURRENT_WORKING_PERSPECTIVE_ROUTE_INTEGRATION_READ_SCOPE,
  CURRENT_WORKING_PERSPECTIVE_ROUTE_INTEGRATION_READ_VERSION,
  type CurrentWorkingPerspectiveRouteIntegrationAuthorityBoundary,
  type CurrentWorkingPerspectiveRouteIntegrationCwpSummary,
  type CurrentWorkingPerspectiveRouteIntegrationRead,
  type CurrentWorkingPerspectiveRouteIntegrationReadInput,
  type CurrentWorkingPerspectiveRouteIntegrationReadMode,
  type CurrentWorkingPerspectiveRouteIntegrationReadStatus,
  type CurrentWorkingPerspectiveRouteIntegrationResponseMode,
} from "@/types/current-working-perspective-route-integration-read";
import {
  CURRENT_WORKING_PERSPECTIVE_ROUTE_INTEGRATION_CONTRACT_RECORD_VERSION,
  CURRENT_WORKING_PERSPECTIVE_ROUTE_INTEGRATION_CONTRACT_SCOPE,
  type CurrentWorkingPerspectiveRouteIntegrationContractRecord,
  type CurrentWorkingPerspectiveRouteIntegrationContractStoreResult,
} from "@/types/current-working-perspective-route-integration-contract-write";
import {
  CURRENT_WORKING_PERSPECTIVE_APPLIED_SNAPSHOT_VERSION,
  CURRENT_WORKING_PERSPECTIVE_APPLY_SCOPE,
  type CurrentWorkingPerspectiveAppliedSnapshot,
  type CurrentWorkingPerspectiveApplyRecord,
} from "@/types/current-working-perspective-apply-write";
import type { CurrentWorkingPerspective } from "@/types/current-working-perspective";
import type { AppliedCurrentWorkingPerspectiveRead } from "./read-applied-current-working-perspective-for-web";

type RecordValue = Record<string, unknown>;

const FORBIDDEN_RAW_KEYS = new Set([
  "raw_text",
  "raw_report",
  "raw_excerpt",
]);

const CONTRACT_FORBIDDEN_NO_SIDE_EFFECT_FIELDS = [
  "api_perspective_current_route_modified",
  "current_working_perspective_route_response_replaced",
  "upstream_current_working_perspective_source_tables_updated",
  "upstream_current_working_perspective_source_tables_mutated",
  "applied_current_working_perspective_snapshot_written",
  "current_working_perspective_apply_record_written",
  "current_working_perspective_update_contract_record_written",
  "perspective_unit_written",
  "next_work_bias_written",
  "continuity_relay_written",
  "continuity_relay_updated",
  "live_relay_state_applied",
  "handoff_context_mutated",
  "handoff_context_applied",
  "selected_refs_written_to_live_handoff",
  "handoff_sent",
  "memory_written",
  "memory_promoted",
  "memory_mutated",
  "dogfood_metrics_written",
  "dogfood_metrics_global_state_updated",
  "dogfood_metric_snapshot_written",
  "reuse_outcome_ledger_written",
  "expected_observed_delta_written",
  "work_episode_written",
  "provider_called",
  "github_called",
  "codex_executed",
  "pr_created",
  "pr_merged",
  "autonomous_action_run",
  "graph_or_vector_store_created",
  "rag_stack_created",
  "browser_observed",
  "crawler_or_browser_observer_created",
  "workbench_action_button_rendered",
] as const;

export function buildCurrentWorkingPerspectiveRouteIntegrationReadV01({
  runtime_current_working_perspective_read,
  runtime_current_working_perspective,
  route_integration_contract_store_result,
  route_integration_contract_record,
  applied_current_working_perspective_read,
  requested_route_integration_mode,
  as_of,
  source_refs = [],
}: CurrentWorkingPerspectiveRouteIntegrationReadInput = {}):
  CurrentWorkingPerspectiveRouteIntegrationRead {
  const runtimeCwp = extractCurrentWorkingPerspective(
    runtime_current_working_perspective ??
      runtime_current_working_perspective_read,
  );
  const now = as_of ?? runtimeCwp?.as_of ?? new Date().toISOString();
  const storeResult = isContractStoreResult(
    route_integration_contract_store_result,
  )
    ? route_integration_contract_store_result
    : null;
  const candidateContract =
    (isContractRecord(route_integration_contract_record)
      ? route_integration_contract_record
      : null) ??
    storeResult?.record ??
    storeResult?.records?.[0] ??
    null;
  const appliedRead = isAppliedRead(applied_current_working_perspective_read)
    ? applied_current_working_perspective_read
    : null;
  const sourceRefs = uniqueStrings([
    ...source_refs,
    ...(candidateContract?.source_refs ?? []),
    ...(appliedRead?.latest_applied_snapshot?.source_refs ?? []),
  ]);
  const evidenceRefs = uniqueStrings([
    ...(candidateContract?.evidence_refs ?? []),
    ...(appliedRead?.latest_applied_snapshot?.evidence_refs ?? []),
  ]);
  const warnings: string[] = [];
  const blockedReasons: string[] = [];
  const refusalReasons: string[] = [];

  if (!runtimeCwp) blockedReasons.push("runtime_current_working_perspective_missing");
  if (
    runtime_current_working_perspective_read !== undefined &&
    runtime_current_working_perspective_read !== null &&
    !extractCurrentWorkingPerspective(runtime_current_working_perspective_read)
  ) {
    blockedReasons.push("runtime_current_working_perspective_malformed");
  }
  if (
    applied_current_working_perspective_read !== undefined &&
    applied_current_working_perspective_read !== null &&
    !appliedRead
  ) {
    blockedReasons.push("applied_current_working_perspective_read_malformed");
  }
  if (containsRawMaterialKeys(candidateContract) || containsRawMaterialKeys(appliedRead)) {
    refusalReasons.push("raw_material_key_refused");
  }

  const hasIntegrationRequest = Boolean(
    requested_route_integration_mode ||
      candidateContract ||
      storeResult ||
      appliedRead,
  );
  if (!hasIntegrationRequest) {
    return createRead({
      status: "runtime_only",
      responseMode: "runtime_only",
      runtimeCwp,
      appliedRead: null,
      contract: null,
      mode: null,
      asOf: now,
      sourceRefs,
      evidenceRefs,
      blockedReasons,
      refusalReasons,
      warnings,
      fallbackReason: null,
      primaryCwp: runtimeCwp,
      appliedCwp: null,
      overlayCandidate: false,
      preferredPrimary: false,
    });
  }

  if (!candidateContract) {
    blockedReasons.push("current_working_perspective_route_integration_contract_missing");
    return createRead({
      status: "contract_missing",
      responseMode: "runtime_only",
      runtimeCwp,
      appliedRead,
      contract: null,
      mode: requested_route_integration_mode ?? null,
      asOf: now,
      sourceRefs,
      evidenceRefs,
      blockedReasons,
      refusalReasons,
      warnings,
      fallbackReason: "approved_route_integration_contract_missing",
      primaryCwp: runtimeCwp,
      appliedCwp: null,
      overlayCandidate: false,
      preferredPrimary: false,
    });
  }

  const contractValidation = validateContractRecord(candidateContract);
  const storeSideEffects = storeResult
    ? validateContractStoreNoSideEffects(storeResult)
    : [];
  if (contractValidation.problemReasons.length > 0 || storeSideEffects.length > 0) {
    blockedReasons.push(
      ...contractValidation.problemReasons,
      ...storeSideEffects,
    );
    return createRead({
      status: "contract_invalid",
      responseMode: "runtime_only",
      runtimeCwp,
      appliedRead,
      contract: candidateContract,
      mode: requested_route_integration_mode ?? contractValidation.mode,
      asOf: now,
      sourceRefs,
      evidenceRefs,
      blockedReasons,
      refusalReasons,
      warnings,
      fallbackReason: "approved_route_integration_contract_invalid",
      primaryCwp: runtimeCwp,
      appliedCwp: null,
      overlayCandidate: false,
      preferredPrimary: false,
    });
  }

  const mode = requested_route_integration_mode ?? contractValidation.mode;
  if (!mode) {
    blockedReasons.push("route_integration_mode_missing");
    return createRead({
      status: "contract_invalid",
      responseMode: "runtime_only",
      runtimeCwp,
      appliedRead,
      contract: candidateContract,
      mode: null,
      asOf: now,
      sourceRefs,
      evidenceRefs,
      blockedReasons,
      refusalReasons,
      warnings,
      fallbackReason: "route_integration_mode_missing",
      primaryCwp: runtimeCwp,
      appliedCwp: null,
      overlayCandidate: false,
      preferredPrimary: false,
    });
  }
  if (mode !== candidateContract.route_integration_mode) {
    warnings.push("requested_route_integration_mode_differs_from_contract");
  }

  if (!appliedRead || appliedRead.status !== "latest_applied_snapshot_available") {
    blockedReasons.push("applied_current_working_perspective_snapshot_missing");
    return createRead({
      status: "applied_snapshot_missing",
      responseMode: "runtime_only",
      runtimeCwp,
      appliedRead,
      contract: candidateContract,
      mode,
      asOf: now,
      sourceRefs,
      evidenceRefs,
      blockedReasons,
      refusalReasons,
      warnings,
      fallbackReason: "applied_snapshot_missing",
      primaryCwp: runtimeCwp,
      appliedCwp: null,
      overlayCandidate: false,
      preferredPrimary: false,
    });
  }

  const snapshotValidation = validateAppliedReadAgainstContract(
    appliedRead,
    candidateContract,
  );
  if (snapshotValidation.problemReasons.length > 0) {
    blockedReasons.push(...snapshotValidation.problemReasons);
    return createRead({
      status: "applied_snapshot_invalid",
      responseMode: "runtime_only",
      runtimeCwp,
      appliedRead,
      contract: candidateContract,
      mode,
      asOf: now,
      sourceRefs,
      evidenceRefs,
      blockedReasons,
      refusalReasons,
      warnings,
      fallbackReason: "applied_snapshot_invalid",
      primaryCwp: runtimeCwp,
      appliedCwp: null,
      overlayCandidate: false,
      preferredPrimary: false,
    });
  }

  const appliedCwp =
    appliedRead.latest_applied_snapshot?.applied_current_working_perspective ??
    null;
  if (mode === "runtime_only_with_applied_snapshot_hint") {
    return createRead({
      status: "runtime_with_applied_snapshot_hint",
      responseMode: "runtime_primary_with_applied_snapshot_hint",
      runtimeCwp,
      appliedRead,
      contract: candidateContract,
      mode,
      asOf: now,
      sourceRefs,
      evidenceRefs,
      blockedReasons,
      refusalReasons,
      warnings,
      fallbackReason: null,
      primaryCwp: runtimeCwp,
      appliedCwp: null,
      overlayCandidate: false,
      preferredPrimary: false,
    });
  }
  if (mode === "applied_snapshot_overlay_candidate") {
    return createRead({
      status: "runtime_with_applied_snapshot_overlay_candidate",
      responseMode: "runtime_primary_with_applied_overlay_candidate",
      runtimeCwp,
      appliedRead,
      contract: candidateContract,
      mode,
      asOf: now,
      sourceRefs,
      evidenceRefs,
      blockedReasons,
      refusalReasons,
      warnings,
      fallbackReason: null,
      primaryCwp: runtimeCwp,
      appliedCwp,
      overlayCandidate: true,
      preferredPrimary: false,
    });
  }
  return createRead({
    status: runtimeCwp
      ? "applied_snapshot_preferred_with_runtime_fallback"
      : "fallback_to_runtime",
    responseMode: runtimeCwp
      ? "applied_snapshot_preferred_with_runtime_fallback"
      : "runtime_only",
    runtimeCwp,
    appliedRead,
    contract: candidateContract,
    mode,
    asOf: now,
    sourceRefs,
    evidenceRefs,
    blockedReasons,
    refusalReasons,
    warnings,
    fallbackReason: runtimeCwp ? null : "runtime_fallback_missing",
    primaryCwp: runtimeCwp ? appliedCwp : runtimeCwp,
    appliedCwp,
    overlayCandidate: false,
    preferredPrimary: Boolean(runtimeCwp && appliedCwp),
  });
}

export function createCurrentWorkingPerspectiveRouteIntegrationReadAuthorityBoundaryV01():
  CurrentWorkingPerspectiveRouteIntegrationAuthorityBoundary {
  return {
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
    notes: [
      "Route integration read is GET/read-only composition only.",
      "It never writes DB, creates schema, mutates upstream CWP source tables, writes applied snapshots, or modifies /api/perspective/current.",
    ],
  };
}

function createRead({
  status,
  responseMode,
  runtimeCwp,
  appliedRead,
  contract,
  mode,
  asOf,
  sourceRefs,
  evidenceRefs,
  blockedReasons,
  refusalReasons,
  warnings,
  fallbackReason,
  primaryCwp,
  appliedCwp,
  overlayCandidate,
  preferredPrimary,
}: {
  status: CurrentWorkingPerspectiveRouteIntegrationReadStatus;
  responseMode: CurrentWorkingPerspectiveRouteIntegrationResponseMode;
  runtimeCwp: CurrentWorkingPerspective | null;
  appliedRead: AppliedCurrentWorkingPerspectiveRead | null;
  contract: CurrentWorkingPerspectiveRouteIntegrationContractRecord | null;
  mode: CurrentWorkingPerspectiveRouteIntegrationReadMode | null;
  asOf: string;
  sourceRefs: string[];
  evidenceRefs: string[];
  blockedReasons: string[];
  refusalReasons: string[];
  warnings: string[];
  fallbackReason: string | null;
  primaryCwp: CurrentWorkingPerspective | null;
  appliedCwp: CurrentWorkingPerspective | null;
  overlayCandidate: boolean;
  preferredPrimary: boolean;
}): CurrentWorkingPerspectiveRouteIntegrationRead {
  const snapshot = appliedRead?.latest_applied_snapshot ?? null;
  const applyRecordRef =
    appliedRead?.latest_record?.record_id ??
    contract?.proposed_current_working_perspective_route_integration_contract
      ?.applied_snapshot_source_apply_record_ref ??
    null;
  return {
    read_version: CURRENT_WORKING_PERSPECTIVE_ROUTE_INTEGRATION_READ_VERSION,
    scope: CURRENT_WORKING_PERSPECTIVE_ROUTE_INTEGRATION_READ_SCOPE,
    as_of: asOf,
    status,
    route_path: "/api/perspective/current",
    route_family: "current_working_perspective",
    response_mode: responseMode,
    primary_current_working_perspective: primaryCwp,
    runtime_current_working_perspective: runtimeCwp,
    applied_current_working_perspective: appliedCwp,
    runtime_current_working_perspective_summary: summarizeCwp(runtimeCwp),
    applied_current_working_perspective_summary: summarizeCwp(
      snapshot?.applied_current_working_perspective ?? null,
    ),
    contract_summary: {
      record_id: contract?.record_id ?? null,
      route_path: contract?.route_path ?? "/api/perspective/current",
      route_family: contract?.route_family ?? "current_working_perspective",
      route_integration_mode: mode,
      source_applied_snapshot_ref: contract?.source_applied_snapshot_ref ?? null,
      source_cwp_apply_record_refs: contract?.source_cwp_apply_record_refs ?? [],
      source_cwp_update_contract_record_refs:
        contract?.source_cwp_update_contract_record_refs ?? [],
      guard_count: contract?.route_integration_guard_summary.enabled_guard_count ?? 0,
    },
    applied_snapshot_metadata: {
      applied_snapshot_ref: snapshot?.applied_snapshot_ref ?? null,
      source_contract_record_ref: snapshot?.source_contract_record_ref ?? null,
      source_apply_record_ref: applyRecordRef,
      source_current_working_perspective_ref:
        snapshot?.source_current_working_perspective_ref ?? null,
      as_of: snapshot?.as_of ?? null,
      applied_patch_count: snapshot?.applied_patch_count ?? 0,
      overlay_candidate: overlayCandidate,
      preferred_primary: preferredPrimary,
    },
    route_integration_metadata: {
      read_version: CURRENT_WORKING_PERSPECTIVE_ROUTE_INTEGRATION_READ_VERSION,
      route_path: "/api/perspective/current",
      route_family: "current_working_perspective",
      approved_contract_required: true,
      explicit_safe_paths_required: true,
      never_write_on_get: true,
      runtime_fallback_preserved: true,
      contract_record_id: contract?.record_id ?? null,
      applied_snapshot_ref: snapshot?.applied_snapshot_ref ?? null,
      requested_route_integration_mode: mode,
      effective_response_mode: responseMode,
    },
    fallback_metadata: {
      used_runtime_fallback:
        responseMode !== "applied_snapshot_preferred_with_runtime_fallback",
      fallback_reason: fallbackReason,
      runtime_cwp_available: Boolean(runtimeCwp),
      applied_snapshot_available: Boolean(snapshot),
    },
    source_refs: uniqueStrings(sourceRefs),
    evidence_refs: uniqueStrings(evidenceRefs),
    refusal_reasons: uniqueStrings(refusalReasons),
    blocked_reasons: uniqueStrings(blockedReasons),
    warnings: uniqueStrings(warnings),
    authority_boundary:
      createCurrentWorkingPerspectiveRouteIntegrationReadAuthorityBoundaryV01(),
  };
}

function summarizeCwp(
  cwp: CurrentWorkingPerspective | null,
): CurrentWorkingPerspectiveRouteIntegrationCwpSummary {
  return {
    cwp_ref: cwp ? `current-working-perspective:${cwp.scope}:${cwp.as_of}` : null,
    perspective_version: cwp?.perspective_version ?? null,
    scope: cwp?.scope ?? null,
    as_of: cwp?.as_of ?? null,
    current_frame_summary: cwp?.current_frame?.summary ?? null,
    current_thesis_summary: cwp?.current_thesis?.summary ?? null,
    active_goal_count: cwp?.active_goals?.length ?? 0,
    open_question_count: cwp?.open_questions?.length ?? 0,
    active_risk_count: cwp?.active_risks?.length ?? 0,
    next_candidate_count: cwp?.next_candidates?.length ?? 0,
    staleness_status: cwp?.staleness?.status ?? null,
  };
}

function validateContractRecord(
  record: CurrentWorkingPerspectiveRouteIntegrationContractRecord,
): {
  mode: CurrentWorkingPerspectiveRouteIntegrationReadMode | null;
  problemReasons: string[];
} {
  const reasons: string[] = [];
  if (containsRawMaterialKeys(record)) reasons.push("raw_material_key_refused");
  if (record.record_version !== CURRENT_WORKING_PERSPECTIVE_ROUTE_INTEGRATION_CONTRACT_RECORD_VERSION) {
    reasons.push("route_integration_contract_record_wrong_version");
  }
  if (
    record.review_status !==
    "recorded_as_scoped_current_working_perspective_route_integration_contract"
  ) {
    reasons.push("route_integration_contract_record_review_status_invalid");
  }
  if (record.route_path !== "/api/perspective/current") {
    reasons.push("route_integration_contract_route_path_invalid");
  }
  if (record.route_family !== "current_working_perspective") {
    reasons.push("route_integration_contract_route_family_invalid");
  }
  if (record.scope !== CURRENT_WORKING_PERSPECTIVE_ROUTE_INTEGRATION_CONTRACT_SCOPE) {
    reasons.push("route_integration_contract_scope_invalid");
  }
  const mode = isRouteIntegrationReadMode(record.route_integration_mode)
    ? record.route_integration_mode
    : null;
  if (!mode) reasons.push("route_integration_contract_mode_invalid");
  if (!isNonEmptyString(record.source_applied_snapshot_ref)) {
    reasons.push("route_integration_contract_applied_snapshot_ref_missing");
  }
  if (
    !Array.isArray(record.source_cwp_apply_record_refs) ||
    record.source_cwp_apply_record_refs.length === 0
  ) {
    reasons.push("route_integration_contract_apply_record_refs_missing");
  } else if (
    record.source_cwp_apply_record_refs.some(
      (ref) =>
        typeof ref !== "string" ||
        !ref.startsWith("current-working-perspective-apply:") ||
        ref.includes("cwp-update-contract") ||
        ref.includes("current-working-perspective-update-contract"),
    )
  ) {
    reasons.push("source_cwp_apply_record_refs_not_apply_records");
  }
  if (!hasExpectedContractAuthorityProfile(record.authority_profile)) {
    reasons.push("route_integration_contract_authority_profile_invalid");
  }
  if (!hasExpectedContractNoRouteChange(record.no_route_change_performed)) {
    reasons.push("route_integration_contract_no_route_change_invalid");
  }
  if (!hasExpectedContractAuthorityBoundary(record.authority_boundary)) {
    reasons.push("route_integration_contract_authority_boundary_invalid");
  }
  const contract = record.proposed_current_working_perspective_route_integration_contract;
  const guards = isRecord(contract.route_integration_guards)
    ? contract.route_integration_guards
    : null;
  const response = isRecord(contract.proposed_response_contract)
    ? contract.proposed_response_contract
    : null;
  if (
    contract.contract_kind !==
      "current_working_perspective_route_integration_contract.v0.1" ||
    contract.route_path !== "/api/perspective/current" ||
    contract.route_family !== "current_working_perspective"
  ) {
    reasons.push("route_integration_contract_material_invalid");
  }
  if (
    guards?.never_write_on_get !== true ||
    guards.preserve_runtime_fallback !== true ||
    guards.require_safe_applied_snapshot_db_path !== true ||
    guards.require_schema_existing_for_applied_snapshot_reads !== true
  ) {
    reasons.push("route_integration_contract_guards_invalid");
  }
  if (response?.does_not_include_raw_private_material !== true) {
    reasons.push("route_integration_contract_response_contract_invalid");
  }
  return { mode, problemReasons: uniqueStrings(reasons) };
}

function validateContractStoreNoSideEffects(
  storeResult: CurrentWorkingPerspectiveRouteIntegrationContractStoreResult,
): string[] {
  const sideEffects = storeResult.receipt?.no_side_effects;
  if (!sideEffects) return ["route_integration_contract_receipt_no_side_effects_missing"];
  const reasons = CONTRACT_FORBIDDEN_NO_SIDE_EFFECT_FIELDS
    .filter((field) => sideEffects[field] !== false)
    .map((field) => `route_integration_contract_forbidden_no_side_effect_true:${field}`);
  const allowedWriteFields = [
    "current_working_perspective_route_integration_contract_record_written",
    "current_working_perspective_route_integration_contract_receipt_written",
    "current_working_perspective_route_integration_contract_persisted",
    "current_working_perspective_route_integration_contract_written",
  ] as const;
  if (storeResult.status === "idempotent_existing") {
    for (const field of allowedWriteFields) {
      if (sideEffects[field] !== false) {
        reasons.push(`route_integration_contract_replay_claimed_write:${field}`);
      }
    }
  }
  return uniqueStrings(reasons);
}

function validateAppliedReadAgainstContract(
  read: AppliedCurrentWorkingPerspectiveRead,
  contract: CurrentWorkingPerspectiveRouteIntegrationContractRecord,
): { problemReasons: string[] } {
  const reasons: string[] = [];
  const snapshot = read.latest_applied_snapshot;
  if (read.read_version !== "applied_current_working_perspective_read.v0.1") {
    reasons.push("applied_current_working_perspective_read_wrong_version");
  }
  if (read.status !== "latest_applied_snapshot_available") {
    reasons.push("applied_current_working_perspective_snapshot_missing");
  }
  if (!snapshot) {
    reasons.push("applied_current_working_perspective_snapshot_missing");
    return { problemReasons: uniqueStrings(reasons) };
  }
  if (!isAppliedSnapshot(snapshot)) {
    reasons.push("applied_current_working_perspective_snapshot_malformed");
  }
  if (containsRawMaterialKeys(snapshot)) reasons.push("raw_material_key_refused");
  if (snapshot.snapshot_version !== CURRENT_WORKING_PERSPECTIVE_APPLIED_SNAPSHOT_VERSION) {
    reasons.push("applied_current_working_perspective_snapshot_wrong_version");
  }
  if (snapshot.scope !== CURRENT_WORKING_PERSPECTIVE_APPLY_SCOPE) {
    reasons.push("applied_current_working_perspective_snapshot_scope_invalid");
  }
  if (snapshot.applied_snapshot_ref !== contract.source_applied_snapshot_ref) {
    reasons.push("applied_snapshot_ref_mismatch_with_route_integration_contract");
  }
  const contractMaterial =
    contract.proposed_current_working_perspective_route_integration_contract;
  const expectedUpdateRefs = uniqueStrings([
    ...contract.source_cwp_update_contract_record_refs,
    contractMaterial.applied_snapshot_source_contract_record_ref ?? "",
  ]);
  if (!expectedUpdateRefs.includes(snapshot.source_contract_record_ref)) {
    reasons.push("applied_snapshot_source_contract_ref_mismatch");
  }
  const latestRecordId = read.latest_record?.record_id ?? null;
  if (
    latestRecordId &&
    !contract.source_cwp_apply_record_refs.includes(latestRecordId)
  ) {
    reasons.push("applied_snapshot_latest_record_ref_mismatch");
  }
  if (!isCurrentWorkingPerspectiveLike(snapshot.applied_current_working_perspective)) {
    reasons.push("applied_snapshot_current_working_perspective_malformed");
  }
  if (!hasSafeAppliedSnapshotAuthority(snapshot.authority_boundary)) {
    reasons.push("applied_snapshot_authority_boundary_invalid");
  }
  return { problemReasons: uniqueStrings(reasons) };
}

function extractCurrentWorkingPerspective(
  value: unknown,
): CurrentWorkingPerspective | null {
  if (isCurrentWorkingPerspectiveLike(value)) return value;
  if (
    isRecord(value) &&
    isCurrentWorkingPerspectiveLike(value.current_working_perspective)
  ) {
    return value.current_working_perspective;
  }
  if (
    isRecord(value) &&
    isCurrentWorkingPerspectiveLike(value.primary_current_working_perspective)
  ) {
    return value.primary_current_working_perspective;
  }
  return null;
}

function isCurrentWorkingPerspectiveLike(
  value: unknown,
): value is CurrentWorkingPerspective {
  if (!isRecord(value)) return false;
  const authority = isRecord(value.authority_boundary)
    ? value.authority_boundary
    : null;
  return (
    value.runtime === "augnes" &&
    value.perspective_version === "current_working_perspective.v0.1" &&
    value.projection_version === "augnes_delta_projection.v0.1" &&
    value.snapshot_version === "perspective_snapshot.v0.1" &&
    value.scope === CURRENT_WORKING_PERSPECTIVE_ROUTE_INTEGRATION_READ_SCOPE &&
    typeof value.as_of === "string" &&
    isRecord(value.current_frame) &&
    typeof value.current_frame.summary === "string" &&
    Array.isArray(value.current_frame.source_refs) &&
    isRecord(value.current_thesis) &&
    typeof value.current_thesis.summary === "string" &&
    Array.isArray(value.current_thesis.source_refs) &&
    Array.isArray(value.active_goals) &&
    Array.isArray(value.accepted_assumptions) &&
    Array.isArray(value.rejected_assumptions) &&
    Array.isArray(value.open_questions) &&
    Array.isArray(value.active_risks) &&
    Array.isArray(value.next_candidates) &&
    isRecord(value.research_pressure) &&
    Array.isArray(value.last_major_delta_refs) &&
    isRecord(value.review_queue_hints) &&
    isRecord(value.source_refs) &&
    isRecord(value.staleness) &&
    Array.isArray(value.gaps) &&
    Array.isArray(value.next_phase_notes) &&
    authority !== null &&
    authority.derived_view_only === true &&
    authority.can_write_db === false &&
    authority.can_apply_project_perspective === false &&
    authority.can_mutate_memory === false &&
    authority.can_call_github === false &&
    authority.can_call_openai_or_provider === false &&
    authority.can_execute_codex === false &&
    authority.can_create_branch_or_pr === false
  );
}

function isContractStoreResult(
  value: unknown,
): value is CurrentWorkingPerspectiveRouteIntegrationContractStoreResult {
  return (
    isRecord(value) &&
    value.store_version ===
      "current_working_perspective_route_integration_contract_store.v0.1" &&
    value.scope === CURRENT_WORKING_PERSPECTIVE_ROUTE_INTEGRATION_CONTRACT_SCOPE &&
    Array.isArray(value.records) &&
    isRecord(value.receipt) &&
    isRecord(value.no_side_effects)
  );
}

function isContractRecord(
  value: unknown,
): value is CurrentWorkingPerspectiveRouteIntegrationContractRecord {
  return (
    isRecord(value) &&
    value.record_version === CURRENT_WORKING_PERSPECTIVE_ROUTE_INTEGRATION_CONTRACT_RECORD_VERSION &&
    typeof value.record_id === "string" &&
    value.scope === CURRENT_WORKING_PERSPECTIVE_ROUTE_INTEGRATION_CONTRACT_SCOPE &&
    value.route_path === "/api/perspective/current" &&
    value.route_family === "current_working_perspective" &&
    Array.isArray(value.source_cwp_apply_record_refs) &&
    Array.isArray(value.source_cwp_update_contract_record_refs) &&
    isRecord(value.proposed_current_working_perspective_route_integration_contract) &&
    isRecord(value.authority_profile) &&
    isRecord(value.no_route_change_performed) &&
    isRecord(value.authority_boundary)
  );
}

function isAppliedRead(value: unknown): value is AppliedCurrentWorkingPerspectiveRead {
  return (
    isRecord(value) &&
    value.read_version === "applied_current_working_perspective_read.v0.1" &&
    typeof value.status === "string" &&
    isRecord(value.summary) &&
    isRecord(value.authority_boundary)
  );
}

function isAppliedSnapshot(
  value: unknown,
): value is CurrentWorkingPerspectiveAppliedSnapshot {
  return (
    isRecord(value) &&
    value.snapshot_version === CURRENT_WORKING_PERSPECTIVE_APPLIED_SNAPSHOT_VERSION &&
    typeof value.applied_snapshot_ref === "string" &&
    value.scope === CURRENT_WORKING_PERSPECTIVE_APPLY_SCOPE &&
    typeof value.source_contract_record_ref === "string" &&
    isCurrentWorkingPerspectiveLike(value.applied_current_working_perspective) &&
    Array.isArray(value.applied_patch_refs) &&
    typeof value.applied_patch_count === "number" &&
    isRecord(value.authority_boundary)
  );
}

function isRouteIntegrationReadMode(
  value: unknown,
): value is CurrentWorkingPerspectiveRouteIntegrationReadMode {
  return (
    value === "runtime_only_with_applied_snapshot_hint" ||
    value === "applied_snapshot_overlay_candidate" ||
    value === "applied_snapshot_preferred_with_runtime_fallback"
  );
}

function hasExpectedContractAuthorityProfile(value: unknown): boolean {
  return fieldsMatch(value, {
    durable_local_current_working_perspective_route_integration_contract: true,
    source_of_truth: false,
    local_project_current_working_perspective_route_integration_contract_only:
      true,
    current_working_perspective_route_integration_contract_written: true,
    api_perspective_current_route_modified: false,
    current_working_perspective_route_response_replaced: false,
    upstream_current_working_perspective_source_tables_mutated: false,
    applied_current_working_perspective_snapshot_written: false,
    current_working_perspective_apply_record_written: false,
    current_working_perspective_update_contract_record_written: false,
    perspective_unit_write_performed: false,
    next_work_bias_write_performed: false,
    continuity_relay_write_performed: false,
    continuity_relay_update_performed: false,
    handoff_context_mutation_performed: false,
    memory_promotion_performed: false,
    metric_update_performed: false,
  });
}

function hasExpectedContractNoRouteChange(value: unknown): boolean {
  return fieldsMatch(value, {
    api_perspective_current_route_modified: false,
    current_working_perspective_route_response_replaced: false,
    upstream_current_working_perspective_source_tables_updated: false,
    upstream_current_working_perspective_source_tables_mutated: false,
    applied_current_working_perspective_snapshot_written: false,
    current_working_perspective_apply_record_written: false,
    current_working_perspective_update_contract_record_written: false,
    perspective_unit_written: false,
    next_work_bias_written: false,
    continuity_relay_written: false,
    continuity_relay_updated: false,
    live_relay_state_applied: false,
    handoff_context_mutated: false,
    handoff_context_applied: false,
    selected_refs_written_to_live_handoff: false,
    handoff_sent: false,
    memory_written: false,
    memory_promoted: false,
    dogfood_metrics_written: false,
    dogfood_metrics_global_state_updated: false,
    dogfood_metric_snapshot_written: false,
    reuse_outcome_ledger_written: false,
    expected_observed_delta_written: false,
    work_episode_written: false,
  });
}

function hasExpectedContractAuthorityBoundary(value: unknown): boolean {
  return fieldsMatch(value, {
    durable_local_current_working_perspective_route_integration_contract: true,
    source_of_truth: false,
    local_project_current_working_perspective_route_integration_contract_only:
      true,
    can_modify_api_perspective_current_route: false,
    can_replace_current_working_perspective_route_response: false,
    can_update_upstream_current_working_perspective_source_tables: false,
    can_mutate_upstream_current_working_perspective_source_tables: false,
    can_write_applied_current_working_perspective_snapshot: false,
    can_write_current_working_perspective_apply_record: false,
    can_write_current_working_perspective_update_contract_record: false,
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
  });
}

function hasSafeAppliedSnapshotAuthority(value: unknown): boolean {
  return fieldsMatch(value, {
    can_replace_current_working_perspective_route_response: false,
    can_update_upstream_current_working_perspective_source_tables: false,
    can_mutate_upstream_current_working_perspective_source_tables: false,
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
  });
}

function fieldsMatch(value: unknown, expected: Record<string, unknown>): boolean {
  if (!isRecord(value)) return false;
  return Object.entries(expected).every(([key, expectedValue]) =>
    expectedValue === undefined
      ? value[key] === undefined
      : value[key] === expectedValue,
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

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function uniqueStrings(values: Array<string | null | undefined>): string[] {
  return [...new Set(values.filter((value): value is string => Boolean(value)))];
}
