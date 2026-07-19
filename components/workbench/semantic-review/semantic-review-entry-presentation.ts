import type { SemanticWorkbenchShellStateV01 } from "@/components/workbench/semantic-workbench-shell";

export interface SemanticReviewEntryPresentationInputV01 {
  projection_observed_at: string;
  proposal: {
    proposed_deltas: Array<{ candidate_id: string }>;
  };
  decisions: Array<{
    decision_id: string;
    decision: "accept" | "reject" | "defer" | "supersede" | "retract";
    decided_at: string;
    candidate: { candidate_id: string };
    revisit: null | {
      revisit_at: string | null;
      expires_at: string | null;
    };
    lineage: {
      prior_decisions: Array<{
        decision_id: string;
        decision_fingerprint: string;
      }>;
    };
    integrity: { fingerprint: string };
  }>;
  candidate_admissions: Array<{
    candidate_id: string;
    decision_allowed: { accept: boolean };
    blocking_reasons: string[];
  }>;
  durable_lineage: {
    chains: Array<{
      stage_status: "applied_awaiting_packet" | "packet_compiled";
      transition: {
        candidate_id: string;
        decision_id: string;
        decision_fingerprint: string;
      };
      compiled_packet: null | {
        packet_id: string;
        packet_fingerprint: string;
      };
    }>;
  };
  project_continuity: {
    latest_context_use_receipt: null | {
      receipt_id: string;
      receipt_fingerprint: string;
      task_context_packet_id: string;
      task_context_packet_fingerprint: string;
    };
    latest_context_use_review_status: null | {
      later_task_run_receipt_id: string;
      later_task_run_receipt_fingerprint: string;
    };
  };
}

export interface SemanticReviewEntryPresentationV01 {
  state: SemanticWorkbenchShellStateV01;
  label: string;
}

export function semanticReviewDetailEntryPresentationV01(
  read: SemanticReviewEntryPresentationInputV01,
): SemanticReviewEntryPresentationV01 {
  const proposalReviewState = proposalReviewStateV01(read);
  const latestChain = read.durable_lineage.chains.at(-1) ?? null;
  if (proposalReviewState === "requires_review") {
    return {
      state: "pending_proposal",
      label: "Proposal has candidate review remaining",
    };
  }
  if (proposalReviewState === "accepted_awaiting_transition") {
    return {
      state: "decided_proposal",
      label: latestChain
        ? "Decision recorded · another Transition remains"
        : "Decision recorded · Transition not applied",
    };
  }
  if (proposalReviewState === "transition_blocked") {
    return {
      state: "transition_blocked",
      label: "Decision recorded · Transition currently blocked",
    };
  }
  if (!latestChain) {
    return {
      state: "decided_proposal",
      label: "Decision recorded · no Transition applied",
    };
  }

  if (
    latestChain.stage_status === "applied_awaiting_packet" ||
    !latestChain.compiled_packet
  ) {
    return {
      state: "transition_applied",
      label: "Transition applied · later packet pending",
    };
  }

  const packet = latestChain.compiled_packet;
  const continuityReceipt = read.project_continuity.latest_context_use_receipt;
  const exactLaterReceipt =
    continuityReceipt?.task_context_packet_id === packet.packet_id &&
    continuityReceipt.task_context_packet_fingerprint ===
      packet.packet_fingerprint
      ? continuityReceipt
      : null;
  if (!exactLaterReceipt) {
    return {
      state: "transition_applied",
      label: "Transition applied · later packet compiled",
    };
  }

  const continuityReview =
    read.project_continuity.latest_context_use_review_status;
  const exactLaterReview =
    continuityReview?.later_task_run_receipt_id ===
      exactLaterReceipt.receipt_id &&
    continuityReview.later_task_run_receipt_fingerprint ===
      exactLaterReceipt.receipt_fingerprint;
  return exactLaterReview
    ? {
        state: "transition_applied",
        label: "Later-context feedback recorded",
      }
    : { state: "feedback_needed", label: "Later-context feedback needed" };
}

function proposalReviewStateV01(
  read: Pick<
    SemanticReviewEntryPresentationInputV01,
    | "projection_observed_at"
    | "proposal"
    | "decisions"
    | "candidate_admissions"
    | "durable_lineage"
  >,
):
  | "requires_review"
  | "transition_blocked"
  | "accepted_awaiting_transition"
  | "settled" {
  const observedAt = strictTimestampV01(read.projection_observed_at);
  let acceptedAwaitingTransition = false;
  let transitionBlocked = false;
  for (const candidate of read.proposal.proposed_deltas) {
    const decisions = read.decisions
      .filter(
        (decision) => decision.candidate.candidate_id === candidate.candidate_id,
      )
      .sort(compareEffectiveDecisionsV01);
    const effective = decisions[0];
    if (!effective) return "requires_review";
    if (effective.decision === "accept") {
      const applied = read.durable_lineage.chains.some(
        (chain) =>
          chain.transition.candidate_id === candidate.candidate_id &&
          chain.transition.decision_id === effective.decision_id &&
          chain.transition.decision_fingerprint ===
            effective.integrity.fingerprint,
      );
      if (!applied) {
        const admission = read.candidate_admissions.find(
          (value) => value.candidate_id === candidate.candidate_id,
        );
        if (!admission) {
          throw new Error("semantic_workbench_candidate_admission_missing");
        }
        if (admission.decision_allowed.accept) {
          acceptedAwaitingTransition = true;
        } else {
          transitionBlocked = true;
        }
      }
      continue;
    }
    if (
      effective.decision === "reject" ||
      effective.decision === "supersede"
    ) {
      continue;
    }
    if (effective.decision === "retract") return "requires_review";
    if (!effective.revisit) return "requires_review";
    const revisitAt = optionalTimestampV01(effective.revisit.revisit_at);
    const expiresAt = optionalTimestampV01(effective.revisit.expires_at);
    if (
      (expiresAt !== null && observedAt >= expiresAt) ||
      (revisitAt !== null && observedAt >= revisitAt)
    ) {
      return "requires_review";
    }
  }
  if (transitionBlocked) return "transition_blocked";
  return acceptedAwaitingTransition ? "accepted_awaiting_transition" : "settled";
}

function compareEffectiveDecisionsV01(
  left: SemanticReviewEntryPresentationInputV01["decisions"][number],
  right: SemanticReviewEntryPresentationInputV01["decisions"][number],
): number {
  const leftReferencesRight = decisionReferencesV01(left, right);
  const rightReferencesLeft = decisionReferencesV01(right, left);
  if (leftReferencesRight !== rightReferencesLeft) {
    return leftReferencesRight ? -1 : 1;
  }
  return (
    strictTimestampV01(right.decided_at) - strictTimestampV01(left.decided_at) ||
    compareCodeUnitsV01(right.decision_id, left.decision_id)
  );
}

function decisionReferencesV01(
  decision: SemanticReviewEntryPresentationInputV01["decisions"][number],
  possiblePrior: SemanticReviewEntryPresentationInputV01["decisions"][number],
): boolean {
  return decision.lineage.prior_decisions.some(
    (binding) =>
      binding.decision_id === possiblePrior.decision_id &&
      binding.decision_fingerprint === possiblePrior.integrity.fingerprint,
  );
}

function optionalTimestampV01(value: string | null): number | null {
  return value === null ? null : strictTimestampV01(value);
}

function strictTimestampV01(value: string): number {
  const match = value.match(
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,3}))?(Z|([+-])(\d{2}):(\d{2}))$/u,
  );
  if (!match) {
    throw new Error("semantic_workbench_projection_timestamp_invalid");
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = Number(match[4]);
  const minute = Number(match[5]);
  const second = Number(match[6]);
  const millisecond = Number((match[7] ?? "0").padEnd(3, "0"));
  const offsetHour = match[8] === "Z" ? 0 : Number(match[10]);
  const offsetMinute = match[8] === "Z" ? 0 : Number(match[11]);
  if (
    month < 1 ||
    month > 12 ||
    day < 1 ||
    hour > 23 ||
    minute > 59 ||
    second > 59 ||
    offsetHour > 23 ||
    offsetMinute > 59
  ) {
    throw new Error("semantic_workbench_projection_timestamp_invalid");
  }
  const offsetSign = match[9] === "-" ? -1 : 1;
  const offsetMilliseconds =
    offsetSign * (offsetHour * 60 + offsetMinute) * 60_000;
  const parsed =
    Date.UTC(year, month - 1, day, hour, minute, second, millisecond) -
    offsetMilliseconds;
  const local = new Date(parsed + offsetMilliseconds);
  if (
    local.getUTCFullYear() !== year ||
    local.getUTCMonth() !== month - 1 ||
    local.getUTCDate() !== day ||
    local.getUTCHours() !== hour ||
    local.getUTCMinutes() !== minute ||
    local.getUTCSeconds() !== second ||
    local.getUTCMilliseconds() !== millisecond
  ) {
    throw new Error("semantic_workbench_projection_timestamp_invalid");
  }
  return parsed;
}

function compareCodeUnitsV01(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}
