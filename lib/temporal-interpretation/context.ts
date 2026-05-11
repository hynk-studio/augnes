import { buildStateBrief } from "@/lib/state/brief";
import {
  type TemporalPreviewContext,
  type TemporalPreviewCounterexample,
  type TemporalPreviewEvidenceAnchor,
  type TemporalPreviewTension,
} from "@/lib/temporal-interpretation/types";

const DEFAULT_SCOPE = "project:augnes";

export function buildTemporalPreviewContext(
  scope = DEFAULT_SCOPE,
): TemporalPreviewContext {
  const brief = buildStateBrief(scope);
  const asOf = new Date().toISOString();
  const notableKeys = brief.agent_handoff.current_status.notable_state_keys ?? [];
  const activeEntries = brief.active_state.slice(0, 5);
  const completedEntries = brief.completed_state.slice(0, 3);
  const recentActions = brief.recent_actions.slice(0, 3);
  const evidenceAnchors: TemporalPreviewEvidenceAnchor[] = [
    ...activeEntries.map((entry) => ({
      ref: `state:${entry.state_key}`,
      claim: `${entry.state_key} is committed ${entry.stability} state for ${entry.temporal_scope}.`,
      source_type: "committed_state" as const,
    })),
    ...completedEntries.map((entry) => ({
      ref: `state:${entry.state_key}`,
      claim: `${entry.state_key} is recorded as completed state.`,
      source_type: "committed_state" as const,
    })),
    ...recentActions.map((action) => ({
      ref: `action:${action.id}`,
      claim: action.description ?? action.title,
      source_type: "action_record" as const,
    })),
  ].slice(0, 8);
  const counterexamples = buildCounterexamples({ brief });
  const residualTensions = buildResidualTensions({ brief });

  return {
    scope,
    as_of: asOf,
    current_interpretation: brief.agent_handoff.current_status.summary,
    active_prior_context: [
      "Augnes currently treats committed temporal state as the source of truth.",
      "Pending proposals, summaries, and handoff packets are interpretive aids, not durable authority.",
      brief.agent_handoff.next_recommended_action.rationale,
    ].join(" "),
    evidence_anchors: evidenceAnchors,
    summary_refs: [
      {
        ref: "summary:agent_handoff.current_status",
        summary: brief.agent_handoff.current_status.summary,
      },
      {
        ref: "summary:agent_handoff.next_recommended_action",
        summary: brief.agent_handoff.next_recommended_action.title,
      },
    ],
    source_authority_profile: {
      committed_state_authority: notableKeys.slice(0, 8),
      summary_only_refs: [
        "summary:agent_handoff.current_status",
        "summary:agent_handoff.next_recommended_action",
      ],
      allowed_now: [
        "read_state_brief",
        "render_preview",
        "run_local_guardrails",
      ],
      blocked_now: [
        "commit_state",
        "publish_proof",
        "promote_rule",
        "claim_full_p4_readiness",
      ],
    },
    counterexamples,
    residual_tensions: residualTensions,
    user_preferences: [
      "The challenge-demo slice should prioritize a small working preview over conceptual documentation.",
      "OpenAI should be optional locally because mock fallback must work from a clean checkout.",
    ],
    safe_next_step:
      "Review the read-only preview against the accepted manual temporal interpretation baseline before promoting any durable P4 implementation work.",
    non_authority_boundary:
      "This preview is non-authoritative: it does not commit state, approve work, publish proof, mutate mailbox status, promote rules, or claim full P4 PerspectiveSnapshot readiness.",
  };
}

function buildCounterexamples({
  brief,
}: {
  brief: ReturnType<typeof buildStateBrief>;
}): TemporalPreviewCounterexample[] {
  const pending = brief.pending_proposals.slice(0, 2).map((proposal) => ({
    ref: `proposal:${proposal.id}`,
    description: `${proposal.state_key} is only a pending proposal and must not be treated as committed evidence.`,
  }));

  return [
    ...pending,
    {
      ref: "boundary:summary_refs",
      description:
        "A handoff or summary can guide interpretation but cannot become an evidence anchor by itself.",
    },
  ];
}

function buildResidualTensions({
  brief,
}: {
  brief: ReturnType<typeof buildStateBrief>;
}): TemporalPreviewTension[] {
  const open = brief.open_tensions.slice(0, 4).map((tension) => ({
    ref: `tension:${tension.id}`,
    description: tension.description,
  }));

  if (open.length > 0) {
    return open;
  }

  return [
    {
      ref: "boundary:p4_scope",
      description:
        "The preview can demonstrate temporal interpretation but remains separate from durable P4 PerspectiveSnapshot implementation.",
    },
  ];
}
