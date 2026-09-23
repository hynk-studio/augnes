import type Database from "better-sqlite3";

import {
  canonicalizeProtocolValueV01,
  createProtocolSha256V01,
  isProtocolRecordV01,
} from "@/lib/vnext/protocol-primitives";
import {
  readOperationalContinuationV01,
  type OperationalContinuationReadRequestV01,
  type OperationalContinuationReadResultV01,
} from "@/lib/vnext/runtime/operational-continuation-read-model";
import type { OperationalContextSelectionRecordBindingV01 } from "@/types/vnext/operational-context-selection";

export const OPERATIONAL_OPTIONAL_INSPECTION_RULE_V01 =
  "exact_reconstructed_proposal_or_no_optional_inspection.v0.1" as const;

export interface OperationalOptionalInspectionCandidateV01 {
  rule_version: typeof OPERATIONAL_OPTIONAL_INSPECTION_RULE_V01;
  view_fingerprint: string;
  kind: "inspect_optional_detail" | "proceed_without_optional_inspection";
  target: OperationalContextSelectionRecordBindingV01 | null;
}

export interface OperationalOptionalInspectionObservationV01 {
  candidate_index: number;
  status: "admitted_for_observation" | "refused";
  reason:
    | "exact_available_detail"
    | "no_additional_optional_inspection"
    | "malformed_candidate"
    | "unsupported_rule"
    | "unsupported_kind"
    | "stale_view"
    | "unavailable_target"
    | "duplicate_candidate";
}

/**
 * Offline source-only consumer, not the continuation admission writer or a
 * Browser/Companion executor. Reconstruct on every call; never accept a caller's
 * claimed view, currentness, capability, or authority. Source-owner refusals
 * propagate unchanged. Same-view replay is an idempotent read, not consumption
 * of a grant; replay against changed material must bind the new view.
 */
export function readOperationalOptionalInspectionV01(
  db: Database.Database,
  request: OperationalContinuationReadRequestV01,
  candidates: readonly unknown[] = [],
) {
  if (!Array.isArray(candidates) || candidates.length > 2) {
    throw new Error("operational_optional_inspection_candidate_bound_invalid");
  }
  const sourceResult = readOperationalContinuationV01(db, request);
  const view = buildViewV01(sourceResult);
  const availableCandidates: OperationalOptionalInspectionCandidateV01[] = [
    {
      rule_version: OPERATIONAL_OPTIONAL_INSPECTION_RULE_V01,
      view_fingerprint: view.fingerprint,
      kind: "inspect_optional_detail",
      target: structuredClone(view.optional_detail.target),
    },
    {
      rule_version: OPERATIONAL_OPTIONAL_INSPECTION_RULE_V01,
      view_fingerprint: view.fingerprint,
      kind: "proceed_without_optional_inspection",
      target: null,
    },
  ];
  const seen = new Set<string>();
  const observations = candidates.map((candidate, index) => {
    const reason = classifyCandidateV01(candidate, view, seen);
    return {
      candidate_index: index,
      status:
        reason === "exact_available_detail" ||
        reason === "no_additional_optional_inspection"
          ? "admitted_for_observation"
          : "refused",
      reason,
    } satisfies OperationalOptionalInspectionObservationV01;
  });
  return {
    source_result: sourceResult,
    scenario: {
      view,
      available_candidates: availableCandidates,
      // Invalid caller material is deliberately not echoed into the report.
      observations,
      objective_labels: null,
      cost_labels: null,
      expert_reference: null,
      executed: false as const,
    },
  };
}

function buildViewV01(result: OperationalContinuationReadResultV01) {
  const { selection, candidate_task_context_packet_b: packet } =
    result.continuation;
  const material = {
    rule_version: OPERATIONAL_OPTIONAL_INSPECTION_RULE_V01,
    // Includes exact project/work/packet/run/source/decision/rule identities
    // and cutoff; it is not a live current-work or authorization revision.
    source_binding: result.continuation.materialization_identity,
    work_ref: selection.work_ref,
    source_currentness: selection.source_currentness,
    packet_source_status: packet.source_status,
    uncertainties: selection.uncertainties,
    limitations: selection.limitations,
    mandatory: {
      identity_currentness_authority_checks_remain_required: true as const,
      constraints: packet.constraints,
      criterion_verification_plan: packet.criterion_verification_plan ?? null,
      return_required_checks: packet.return_contract.required_checks,
      optional_choice_satisfies_required_checks: false as const,
    },
    host: {
      surface: "local_offline_report" as const,
      sqlite_query_only: true as const,
      // This reader has not observed a live host or acquired a grant. Unknown
      // live bindings cannot be promoted into an execution eligibility claim.
      current_root: null,
      current_run: null,
      current_generation: null,
      current_authority_revision: null,
      current_grant_stop_conditions: null,
      live_eligibility: "not_observed" as const,
    },
    optional_detail: {
      owner: "readOperationalFrictionProposalFromExactSourcesV01" as const,
      record_kind: "episode_delta_proposal" as const,
      target: selection.acgc4_proposal,
      availability: "exact_source_reconstructed" as const,
    },
    authority: selection.authority_summary,
  };
  return structuredClone({
    ...material,
    fingerprint: createProtocolSha256V01(canonicalizeProtocolValueV01(material)),
  });
}

function classifyCandidateV01(
  candidate: unknown,
  view: ReturnType<typeof buildViewV01>,
  seen: Set<string>,
): OperationalOptionalInspectionObservationV01["reason"] {
  if (
    !isProtocolRecordV01(candidate) ||
    !hasExactKeysV01(candidate, ["rule_version", "view_fingerprint", "kind", "target"]) ||
    typeof candidate.view_fingerprint !== "string" ||
    !/^sha256:[a-f0-9]{64}$/u.test(candidate.view_fingerprint)
  ) return "malformed_candidate";
  if (candidate.rule_version !== OPERATIONAL_OPTIONAL_INSPECTION_RULE_V01) {
    return "unsupported_rule";
  }
  if (
    candidate.kind !== "inspect_optional_detail" &&
    candidate.kind !== "proceed_without_optional_inspection"
  ) return "unsupported_kind";
  if (candidate.kind === "inspect_optional_detail") {
    if (
      !isProtocolRecordV01(candidate.target) ||
      !hasExactKeysV01(candidate.target, ["record_version", "record_id", "record_fingerprint"]) ||
      Object.values(candidate.target).some((value) => typeof value !== "string")
    ) return "malformed_candidate";
  } else if (candidate.target !== null) return "malformed_candidate";
  if (candidate.view_fingerprint !== view.fingerprint) return "stale_view";
  if (
    candidate.kind === "inspect_optional_detail" &&
    canonicalizeProtocolValueV01(candidate.target) !==
      canonicalizeProtocolValueV01(view.optional_detail.target)
  ) return "unavailable_target";
  const identity = candidate.kind;
  if (seen.has(identity)) return "duplicate_candidate";
  seen.add(identity);
  return candidate.kind === "inspect_optional_detail"
    ? "exact_available_detail"
    : "no_additional_optional_inspection";
}

function hasExactKeysV01(value: Record<string, unknown>, keys: string[]): boolean {
  return Object.keys(value).length === keys.length &&
    keys.every((key) => Object.hasOwn(value, key));
}
