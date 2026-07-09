import {
  allValuesFalse,
  fingerprint,
  stableJson,
  validateSourceBindingPairs,
} from "@/lib/research-candidate-review/shared-source-chain-guards";
import type {
  AutonomyDelegationGrant,
  AutonomyDelegationGrantReadback,
} from "@/types/autonomy-delegation-grant";
import type {
  AutohuntWorkQueueCandidate,
  AutohuntWorkQueueCandidateReadback,
} from "@/types/autohunt-work-queue-candidate";
import type {
  AutohuntPreflightPacket,
  AutohuntPreflightPacketNextAllowedOutput,
  AutohuntPreflightPacketReadback,
} from "@/types/autohunt-preflight-packet";
import type {
  AutohuntWorkbenchReadbackSpine,
  AutohuntWorkbenchReadbackSpineAuthorityBoundary,
  AutohuntWorkbenchReadbackSpineStatus,
} from "@/types/autohunt-workbench-readback-spine";
import {
  AUTOHUNT_WORKBENCH_READBACK_SPINE_AUTHORITY_FLAG_NAMES,
  AUTOHUNT_WORKBENCH_READBACK_SPINE_BLOCKED_ACTIONS,
  AUTOHUNT_WORKBENCH_READBACK_SPINE_KIND,
  AUTOHUNT_WORKBENCH_READBACK_SPINE_NEXT_ALLOWED_OUTPUTS,
  AUTOHUNT_WORKBENCH_READBACK_SPINE_VERSION,
} from "@/types/autohunt-workbench-readback-spine";

export interface BuildAutohuntWorkbenchReadbackSpineInput {
  grant_readback: AutonomyDelegationGrantReadback;
  queue_readback: AutohuntWorkQueueCandidateReadback;
  preflight_readback: AutohuntPreflightPacketReadback;
  as_of?: string;
}

export function buildAutohuntWorkbenchReadbackSpine({
  grant_readback,
  queue_readback,
  preflight_readback,
  as_of = new Date().toISOString(),
}: BuildAutohuntWorkbenchReadbackSpineInput): AutohuntWorkbenchReadbackSpine {
  const activeGrant = selectLatestActiveGrant(grant_readback);
  const queuedCandidates = selectQueuedCandidates(queue_readback);
  const readyPreflightPacket = selectLatestReadyPreflightPacket(
    preflight_readback,
  );
  const authorityBoundary =
    buildAutohuntWorkbenchReadbackSpineAuthorityBoundary();
  const chainBinding = buildChainBinding({
    activeGrant,
    queuedCandidates,
    readyPreflightPacket,
  });
  const allAuthorityFlagsFalse =
    allValuesFalse(authorityBoundary) &&
    allReadbackAuthorityBoundariesFalse({
      grant_readback,
      queue_readback,
      preflight_readback,
    });
  const totalInvalidRecordCount =
    grant_readback.invalid_record_count +
    queue_readback.invalid_record_count +
    preflight_readback.invalid_record_count;
  const spineStatus = deriveSpineStatus({
    activeGrant,
    queuedCandidateCount: queuedCandidates.length,
    readyPreflightPacket,
    chainBindingPassed:
      chainBinding.grant_to_candidates_bound &&
      chainBinding.candidates_to_preflight_bound &&
      chainBinding.grant_fingerprint_matches &&
      chainBinding.candidate_fingerprints_match,
    allAuthorityFlagsFalse,
    totalInvalidRecordCount,
  });

  const spineWithoutFingerprint = {
    spine_kind: AUTOHUNT_WORKBENCH_READBACK_SPINE_KIND,
    spine_version: AUTOHUNT_WORKBENCH_READBACK_SPINE_VERSION,
    scope: grant_readback.scope,
    as_of,
    spine_status: spineStatus,
    latest_active_grant_summary: summarizeActiveGrant(
      activeGrant,
      grant_readback.invalid_record_count,
    ),
    queued_candidate_summary: summarizeQueuedCandidates(
      queuedCandidates,
      queue_readback,
    ),
    ready_preflight_summary: summarizeReadyPreflight(
      readyPreflightPacket,
      preflight_readback,
    ),
    chain_binding: chainBinding,
    next_allowed_outputs: [
      ...AUTOHUNT_WORKBENCH_READBACK_SPINE_NEXT_ALLOWED_OUTPUTS,
    ] as AutohuntPreflightPacketNextAllowedOutput[],
    blocked_actions: [...AUTOHUNT_WORKBENCH_READBACK_SPINE_BLOCKED_ACTIONS],
    authority_boundary: authorityBoundary,
    raw_material_persisted: false,
  } satisfies Omit<AutohuntWorkbenchReadbackSpine, "spine_fingerprint">;

  return {
    ...spineWithoutFingerprint,
    spine_fingerprint: fingerprint(spineWithoutFingerprint),
  };
}

export function buildAutohuntWorkbenchReadbackSpineAuthorityBoundary(): AutohuntWorkbenchReadbackSpineAuthorityBoundary {
  return Object.fromEntries(
    AUTOHUNT_WORKBENCH_READBACK_SPINE_AUTHORITY_FLAG_NAMES.map((field) => [
      field,
      false,
    ]),
  ) as AutohuntWorkbenchReadbackSpineAuthorityBoundary;
}

function selectLatestActiveGrant(readback: AutonomyDelegationGrantReadback) {
  return (
    readback.latest_active_grant ??
    sortByCreatedAtDesc(readback.active_grants)[0] ??
    null
  );
}

function selectQueuedCandidates(readback: AutohuntWorkQueueCandidateReadback) {
  const scopedQueuedCandidates = readback.candidates.filter(
    (candidate) => candidate.candidate_status === "queued",
  );
  const hasScopedFilter =
    Boolean(readback.source_grant_id_filter) ||
    readback.candidate_status_filter === "queued" ||
    Boolean(readback.candidate_id_filter);
  const candidates =
    hasScopedFilter || scopedQueuedCandidates.length > 0
      ? scopedQueuedCandidates
      : readback.queued_candidates;
  return sortByCreatedAtDesc(candidates);
}

function selectLatestReadyPreflightPacket(
  readback: AutohuntPreflightPacketReadback,
) {
  if (
    readback.latest_ready_preflight_packet?.preflight_status ===
    "ready_for_supervised_handoff_planning"
  ) {
    return readback.latest_ready_preflight_packet;
  }
  return (
    sortByCreatedAtDesc(
      readback.preflight_packets.filter(
        (packet) =>
          packet.preflight_status ===
          "ready_for_supervised_handoff_planning",
      ),
    )[0] ??
    sortByCreatedAtDesc(readback.ready_preflight_packets)[0] ??
    null
  );
}

function buildChainBinding({
  activeGrant,
  queuedCandidates,
  readyPreflightPacket,
}: {
  activeGrant: AutonomyDelegationGrant | null;
  queuedCandidates: AutohuntWorkQueueCandidate[];
  readyPreflightPacket: AutohuntPreflightPacket | null;
}): AutohuntWorkbenchReadbackSpine["chain_binding"] {
  const selectedCandidateIds =
    readyPreflightPacket?.source_queue_readback.selected_candidate_ids ?? [];
  const selectedCandidateFingerprints =
    readyPreflightPacket?.source_queue_readback
      .selected_candidate_fingerprints ?? [];
  const selectedCandidatePairs = new Map(
    selectedCandidateIds.map((candidateId, index) => [
      candidateId,
      selectedCandidateFingerprints[index] ?? "",
    ]),
  );
  const queuedCandidateById = new Map(
    queuedCandidates.map((candidate) => [candidate.candidate_id, candidate]),
  );
  const grantCandidateBinding = activeGrant
    ? validateSourceBindingPairs(
        queuedCandidates.flatMap((candidate) => [
          {
            field: "source_grant_id",
            expected: activeGrant.grant_id,
            actual: candidate.source_grant.grant_id,
            reason: "candidate_source_grant_id_mismatch",
          },
          {
            field: "source_grant_fingerprint",
            expected: activeGrant.grant_fingerprint,
            actual: candidate.source_grant.grant_fingerprint,
            reason: "candidate_source_grant_fingerprint_mismatch",
          },
        ]),
      )
    : null;
  const preflightGrantBinding =
    activeGrant && readyPreflightPacket
      ? validateSourceBindingPairs([
          {
            field: "preflight_source_grant_id",
            expected: activeGrant.grant_id,
            actual: readyPreflightPacket.source_grant.grant_id,
            reason: "preflight_source_grant_id_mismatch",
          },
          {
            field: "preflight_source_grant_fingerprint",
            expected: activeGrant.grant_fingerprint,
            actual: readyPreflightPacket.source_grant.grant_fingerprint,
            reason: "preflight_source_grant_fingerprint_mismatch",
          },
        ])
      : null;
  const candidateFingerprintsMatch =
    selectedCandidatePairs.size > 0 &&
    [...selectedCandidatePairs.entries()].every(
      ([candidateId, candidateFingerprint]) =>
        queuedCandidateById.get(candidateId)?.candidate_fingerprint ===
        candidateFingerprint,
    );
  const candidatesToPreflightBound =
    Boolean(readyPreflightPacket) &&
    candidateFingerprintsMatch &&
    selectedCandidatePairs.size === selectedCandidateIds.length;
  const grantToCandidatesBound =
    Boolean(activeGrant) &&
    queuedCandidates.length > 0 &&
    grantCandidateBinding?.passed === true;
  const grantFingerprintMatches =
    grantToCandidatesBound && preflightGrantBinding?.passed === true;

  return {
    grant_to_candidates_bound: grantToCandidatesBound,
    candidates_to_preflight_bound: candidatesToPreflightBound,
    grant_fingerprint_matches: grantFingerprintMatches,
    candidate_fingerprints_match: candidateFingerprintsMatch,
    selected_candidate_ids: selectedCandidateIds,
    selected_candidate_fingerprints: selectedCandidateFingerprints,
  };
}

function deriveSpineStatus({
  activeGrant,
  queuedCandidateCount,
  readyPreflightPacket,
  chainBindingPassed,
  allAuthorityFlagsFalse,
  totalInvalidRecordCount,
}: {
  activeGrant: AutonomyDelegationGrant | null;
  queuedCandidateCount: number;
  readyPreflightPacket: AutohuntPreflightPacket | null;
  chainBindingPassed: boolean;
  allAuthorityFlagsFalse: boolean;
  totalInvalidRecordCount: number;
}): AutohuntWorkbenchReadbackSpineStatus {
  if (!activeGrant) return "missing_grant";
  if (queuedCandidateCount === 0) return "no_queued_candidates";
  if (!readyPreflightPacket) return "missing_preflight_packet";
  if (totalInvalidRecordCount > 0) return "invalid_record_attention";
  if (!chainBindingPassed || !allAuthorityFlagsFalse) return "blocked";
  if (
    readyPreflightPacket.preflight_status ===
    "ready_for_supervised_handoff_planning"
  ) {
    return "ready_for_supervised_handoff_planning";
  }
  return "insufficient_data";
}

function summarizeActiveGrant(
  grant: AutonomyDelegationGrant | null,
  invalidGrantCount: number,
): AutohuntWorkbenchReadbackSpine["latest_active_grant_summary"] {
  return {
    grant_id: grant?.grant_id ?? null,
    grant_fingerprint: grant?.grant_fingerprint ?? null,
    grant_status: grant?.grant_status ?? null,
    grant_mode: grant?.grant_mode ?? null,
    approval_ref: grant?.explicit_user_approval.approval_ref ?? null,
    approval_text_fingerprint:
      grant?.explicit_user_approval.approval_text_fingerprint ?? null,
    budget_summary: grant
      ? {
          time_limit_minutes: grant.budget.time_limit_minutes,
          max_iterations: grant.budget.max_iterations,
          max_tool_calls: grant.budget.max_tool_calls,
          max_codex_tasks: grant.budget.max_codex_tasks,
          max_draft_prs: grant.budget.max_draft_prs,
          max_file_changes: grant.budget.max_file_changes,
          max_changed_files_per_pr: grant.budget.max_changed_files_per_pr,
        }
      : null,
    invalid_grant_count: invalidGrantCount,
  };
}

function summarizeQueuedCandidates(
  queuedCandidates: AutohuntWorkQueueCandidate[],
  readback: AutohuntWorkQueueCandidateReadback,
): AutohuntWorkbenchReadbackSpine["queued_candidate_summary"] {
  const latestCandidate = queuedCandidates[0] ?? null;
  return {
    queued_candidate_count: queuedCandidates.length,
    latest_candidate_id: latestCandidate?.candidate_id ?? null,
    latest_candidate_fingerprint: latestCandidate?.candidate_fingerprint ?? null,
    origins: uniqueStrings(
      queuedCandidates.map((candidate) => candidate.candidate_origin),
    ),
    work_classes: uniqueStrings(
      queuedCandidates.map((candidate) => candidate.work_class),
    ),
    invalid_candidate_count: readback.invalid_record_count,
    blocker_reasons: uniqueStrings([
      ...readback.grant_fit_blocker_reasons,
      ...queuedCandidates.flatMap(
        (candidate) => candidate.grant_fit.blocker_reasons,
      ),
    ]),
    warning_reasons: uniqueStrings([
      ...readback.grant_fit_warning_reasons,
      ...queuedCandidates.flatMap(
        (candidate) => candidate.grant_fit.warning_reasons,
      ),
    ]),
  };
}

function summarizeReadyPreflight(
  packet: AutohuntPreflightPacket | null,
  readback: AutohuntPreflightPacketReadback,
): AutohuntWorkbenchReadbackSpine["ready_preflight_summary"] {
  return {
    preflight_packet_id: packet?.preflight_packet_id ?? null,
    preflight_packet_fingerprint: packet?.preflight_packet_fingerprint ?? null,
    preflight_status: packet?.preflight_status ?? null,
    selected_candidate_count:
      packet?.source_queue_readback.selected_candidate_ids.length ?? 0,
    aggregate_budget_projection: packet?.aggregate_budget_projection ?? null,
    blocker_reasons: uniqueStrings([
      ...readback.preflight_blocker_reasons,
      ...(packet?.preflight_checks.blocker_reasons ?? []),
    ]),
    warning_reasons: uniqueStrings([
      ...readback.preflight_warning_reasons,
      ...(packet?.preflight_checks.warning_reasons ?? []),
    ]),
    invalid_packet_count: readback.invalid_record_count,
  };
}

function sortByCreatedAtDesc<T extends { created_at: string }>(values: T[]) {
  return [...values].sort(
    (left, right) =>
      right.created_at.localeCompare(left.created_at) ||
      stableJson(left).localeCompare(stableJson(right)),
  );
}

function uniqueStrings(values: string[]) {
  return [...new Set(values.filter((value) => value.trim().length > 0))].sort();
}

function allReadbackAuthorityBoundariesFalse({
  grant_readback,
  queue_readback,
  preflight_readback,
}: {
  grant_readback: AutonomyDelegationGrantReadback;
  queue_readback: AutohuntWorkQueueCandidateReadback;
  preflight_readback: AutohuntPreflightPacketReadback;
}) {
  return (
    allValuesFalse(grant_readback.no_run_no_execution_boundary) &&
    allValuesFalse(queue_readback.no_run_no_execution_boundary) &&
    allValuesFalse(preflight_readback.no_run_no_execution_boundary)
  );
}
