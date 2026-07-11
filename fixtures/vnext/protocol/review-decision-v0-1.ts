import {
  genericCliDirectObservationProposalInputFixture,
} from "@/fixtures/vnext/protocol/episode-delta-proposal-v0-1";
import {
  buildEpisodeDeltaProposalV01,
  type EpisodeDeltaProposalBuilderInputV01,
} from "@/lib/vnext/episode-delta-proposal";
import {
  createEpisodeDeltaCandidateFingerprintV01,
  type ReviewDecisionBuilderInputV01,
} from "@/lib/vnext/review-decision";
import {
  EXTERNAL_REF_VERSION_V01,
  type ExternalRefTrustClassV01,
  type ExternalRefV01,
} from "@/types/vnext/external-ref";
import type {
  EpisodeDeltaProposalDeltaCandidateV01,
  EpisodeDeltaProposalV01,
} from "@/types/vnext/episode-delta-proposal";
import type { ReviewDecisionV01 } from "@/types/vnext/review-decision";

export const REVIEW_DECISION_FIXTURE_DECIDED_AT =
  "2026-07-10T12:15:00.000Z";

function ref(
  refType: string,
  externalId: string,
  trustClass: ExternalRefTrustClassV01,
  extra: Partial<ExternalRefV01> = {},
): ExternalRefV01 {
  return {
    ref_version: EXTERNAL_REF_VERSION_V01,
    ref_type: refType,
    external_id: externalId,
    trust_class: trustClass,
    ...extra,
  };
}

const actorRef = ref(
  "operator_actor",
  "synthetic-operator:review-decision-conformance",
  "user_declaration",
  { observed_at: REVIEW_DECISION_FIXTURE_DECIDED_AT },
);
const authorizationBasisRef = ref(
  "authorization_basis",
  "synthetic-basis:review-decision-conformance-only",
  "user_declaration",
  { observed_at: REVIEW_DECISION_FIXTURE_DECIDED_AT },
);

export const reviewDecisionGenericSourceProposal =
  buildEpisodeDeltaProposalV01(
    clone(genericCliDirectObservationProposalInputFixture),
  );

export const reviewDecisionMultiCandidateSourceProposal = (() => {
  const input = clone(
    genericCliDirectObservationProposalInputFixture,
  ) as EpisodeDeltaProposalBuilderInputV01;
  const original = input.proposed_deltas[0]!;
  input.bounded_summary =
    "Two reviewable candidates support deterministic supersession relation conformance.";
  input.proposed_deltas.push({
    ...clone(original),
    candidate_id: "delta:protocol-contract-alternative",
    title: "Review the narrower provider-neutral contract alternative",
    proposed_state_summary:
      "Add a narrower protocol contract candidate while preserving the original candidate for explicit review.",
    uncertainties: [
      "The alternative remains candidate material and has not been adopted.",
    ],
  });
  return buildEpisodeDeltaProposalV01(input);
})();

function baseDecisionInput(
  proposal: EpisodeDeltaProposalV01,
  candidate: EpisodeDeltaProposalDeltaCandidateV01,
  decision: ReviewDecisionBuilderInputV01["decision"],
): ReviewDecisionBuilderInputV01 {
  const decisionBasisRef = proposal.run_receipt_refs[0]!;
  return {
    workspace_id: proposal.workspace_id,
    project_id: proposal.project_id,
    source_proposal: {
      proposal_version: proposal.proposal_version,
      proposal_id: proposal.proposal_id,
      proposal_fingerprint: proposal.integrity.fingerprint,
    },
    candidate: {
      candidate_id: candidate.candidate_id,
      candidate_fingerprint:
        createEpisodeDeltaCandidateFingerprintV01(candidate),
    },
    decision,
    actor_ref: actorRef,
    authorization_basis_refs: [authorizationBasisRef],
    decision_basis_material_ids: [...candidate.basis_material_ids],
    decision_basis_refs: [decisionBasisRef],
    rationale_summary:
      "Synthetic conformance decision binds the exact candidate and proposal without applying project state.",
    decided_at: REVIEW_DECISION_FIXTURE_DECIDED_AT,
    revisit: null,
    requested_transition_intent: null,
    lineage: {
      prior_decisions: [],
      superseding_candidate: null,
      retracted_decision: null,
    },
    compatibility: {
      source_contracts: [proposal.proposal_version],
      unmapped_fields: [],
      warnings: [
        "Synthetic conformance material does not prove a real authorized operator decision.",
      ],
      external_refs: [],
    },
    authority_notes: [
      "This synthetic fixture exercises contract semantics only.",
    ],
  };
}

const genericCandidate =
  reviewDecisionGenericSourceProposal.proposed_deltas[0]!;

export const acceptReviewDecisionInputFixture = (() => {
  const input = baseDecisionInput(
    reviewDecisionGenericSourceProposal,
    genericCandidate,
    "accept",
  );
  input.rationale_summary =
    "Accept the bounded candidate for a separately authorized future transition path.";
  input.requested_transition_intent = {
    intent_id: "transition-intent:accept-protocol-contract",
    transition_kind: "semantic_candidate_apply",
    bounded_summary:
      "Request a future semantic candidate apply while keeping this decision contract non-actuating.",
    target_refs: [...genericCandidate.target_refs],
    intent_only: true,
    applied: false,
    state_transition_receipt_ref: null,
  };
  return input;
})();

export const rejectReviewDecisionInputFixture = (() => {
  const input = baseDecisionInput(
    reviewDecisionGenericSourceProposal,
    genericCandidate,
    "reject",
  );
  input.rationale_summary =
    "Reject this candidate without requesting or applying any transition.";
  return input;
})();

export const deferReviewDecisionInputFixture = (() => {
  const input = baseDecisionInput(
    reviewDecisionGenericSourceProposal,
    genericCandidate,
    "defer",
  );
  input.rationale_summary =
    "Defer the candidate until an independent integration source is available.";
  input.revisit = {
    revisit_at: "2026-07-17T12:15:00.000Z",
    expires_at: "2026-07-31T12:15:00.000Z",
    condition_summary:
      "Revisit when repository-native integration evidence is available.",
  };
  return input;
})();

export const supersedeReviewDecisionInputFixture = (() => {
  const proposal = reviewDecisionMultiCandidateSourceProposal;
  const target = proposal.proposed_deltas.find(
    (candidate) => candidate.candidate_id === "delta:protocol-contract",
  )!;
  const replacement = proposal.proposed_deltas.find(
    (candidate) =>
      candidate.candidate_id === "delta:protocol-contract-alternative",
  )!;
  const input = baseDecisionInput(proposal, target, "supersede");
  input.rationale_summary =
    "Supersede the broader candidate with the explicit narrower candidate while preserving both identities.";
  input.lineage.superseding_candidate = {
    candidate_id: replacement.candidate_id,
    candidate_fingerprint:
      createEpisodeDeltaCandidateFingerprintV01(replacement),
  };
  input.requested_transition_intent = {
    intent_id: "transition-intent:supersede-protocol-contract",
    transition_kind: "semantic_candidate_supersede",
    bounded_summary:
      "Request future supersession handling without applying project state.",
    target_refs: [...replacement.target_refs],
    intent_only: true,
    applied: false,
    state_transition_receipt_ref: null,
  };
  return input;
})();

export function retractReviewDecisionInputFixture(
  priorDecision: ReviewDecisionV01,
): ReviewDecisionBuilderInputV01 {
  const input = baseDecisionInput(
    reviewDecisionGenericSourceProposal,
    genericCandidate,
    "retract",
  );
  const priorBinding = {
    decision_id: priorDecision.decision_id,
    decision_fingerprint: priorDecision.integrity.fingerprint,
  };
  input.rationale_summary =
    "Retract the prior synthetic decision while preserving exact decision lineage.";
  input.lineage = {
    prior_decisions: [priorBinding],
    superseding_candidate: null,
    retracted_decision: priorBinding,
  };
  input.requested_transition_intent = {
    intent_id: "transition-intent:retract-prior-decision",
    transition_kind: "semantic_candidate_retract",
    bounded_summary:
      "Request future retraction handling without applying project state.",
    target_refs: [...genericCandidate.target_refs],
    intent_only: true,
    applied: false,
    state_transition_receipt_ref: null,
  };
  return input;
}

export interface InvalidReviewDecisionFixtureCaseV01 {
  name: string;
  expected_status: "invalid" | "blocked";
  expected_error_code: string;
  mutate(decision: ReviewDecisionV01): unknown;
}

function mutation(
  name: string,
  expectedStatus: "invalid" | "blocked",
  expectedErrorCode: string,
  mutate: (decision: ReviewDecisionV01 & Record<string, unknown>) => void,
): InvalidReviewDecisionFixtureCaseV01 {
  return {
    name,
    expected_status: expectedStatus,
    expected_error_code: expectedErrorCode,
    mutate(decision) {
      const value = clone(decision) as ReviewDecisionV01 &
        Record<string, unknown>;
      mutate(value);
      return value;
    },
  };
}

function authorityMutation(
  name: string,
  field: keyof ReviewDecisionV01["authority_summary"],
): InvalidReviewDecisionFixtureCaseV01 {
  return mutation(name, "blocked", "authority_boundary_violation", (value) => {
    (value.authority_summary as unknown as Record<string, unknown>)[field] =
      true;
  });
}

export const invalidReviewDecisionFixtureCases: InvalidReviewDecisionFixtureCaseV01[] = [
  mutation(
    "unsupported_protocol_version",
    "blocked",
    "unsupported_protocol_version",
    (value) => {
      (value as Record<string, unknown>).decision_version =
        "review_decision.v9.9";
    },
  ),
  mutation("missing_workspace_identity", "invalid", "workspace_id_missing", (value) => {
    value.workspace_id = "";
  }),
  mutation("missing_project_identity", "invalid", "project_id_missing", (value) => {
    value.project_id = "";
  }),
  mutation("provider_specific_core_field", "blocked", "provider_specific_core_field", (value) => {
    value.github_pr_id = "pr:synthetic";
  }),
  mutation("unknown_root_field", "blocked", "unknown_core_field", (value) => {
    value.unrecognized_semantic_state = "accepted";
  }),
  mutation("unknown_nested_field", "blocked", "unknown_nested_field", (value) => {
    (value.source_proposal as unknown as Record<string, unknown>).adopted = true;
  }),
  mutation("raw_prompt_field", "blocked", "raw_prompt_shaped_field", (value) => {
    value.raw_prompt = "synthetic prompt";
  }),
  mutation("raw_transcript_field", "blocked", "raw_transcript_shaped_field", (value) => {
    value.transcript = "synthetic transcript";
  }),
  mutation("hidden_reasoning_field", "blocked", "hidden_reasoning_shaped_field", (value) => {
    value.hidden_reasoning = "synthetic reasoning";
  }),
  mutation("terminal_dump_field", "blocked", "raw_terminal_log_shaped_field", (value) => {
    value.terminal_log = "synthetic terminal output";
  }),
  mutation("credential_field", "blocked", "secret_shaped_field", (value) => {
    value.credentials = "synthetic credential";
  }),
  mutation("secret_shaped_value", "blocked", "secret_shaped_material", (value) => {
    value.rationale_summary = "OPENAI_API_KEY=SAFE_MARKER_SECRET_TOKEN";
  }),
  mutation("absolute_local_path", "blocked", "absolute_local_path_forbidden", (value) => {
    value.rationale_summary = "/Users/example/private/review.txt";
  }),
  mutation("malformed_actor_ref", "invalid", "external_ref_malformed", (value) => {
    value.actor_ref = null as unknown as ExternalRefV01;
  }),
  mutation("conflicting_duplicate_external_ref", "blocked", "duplicate_conflicting_external_ref", (value) => {
    const duplicate = clone(value.authorization_basis_refs[0]!);
    duplicate.trust_class = "imported_unverified";
    value.authorization_basis_refs.push(duplicate);
  }),
  mutation("missing_authorization_basis", "invalid", "authorization_basis_required", (value) => {
    value.authorization_basis_refs = [];
  }),
  mutation("missing_decision_basis_material", "invalid", "decision_basis_material_required", (value) => {
    value.decision_basis_material_ids = [];
  }),
  mutation("missing_decision_basis_ref", "invalid", "decision_basis_ref_required", (value) => {
    value.decision_basis_refs = [];
  }),
  mutation("malformed_decided_at", "invalid", "timestamp_invalid", (value) => {
    value.decided_at = "not-a-timestamp";
  }),
  mutation("automatic_transition_claim", "blocked", "automatic_transition_claim", (value) => {
    if (value.requested_transition_intent) {
      (value.requested_transition_intent as unknown as Record<string, unknown>).applied = true;
    }
  }),
  mutation("state_transition_receipt_claim", "blocked", "state_transition_receipt_claim_forbidden", (value) => {
    if (value.requested_transition_intent) {
      (value.requested_transition_intent as unknown as Record<string, unknown>).state_transition_receipt_ref =
        "state-transition-receipt:synthetic";
    }
  }),
  authorityMutation("canonical_state_claim", "decision_is_canonical_project_state"),
  authorityMutation("accepted_evidence_claim", "decision_is_accepted_evidence"),
  authorityMutation("durable_transition_claim", "performs_durable_transition"),
  authorityMutation("database_write_claim", "writes_database"),
  authorityMutation("evidence_creation_claim", "creates_evidence"),
  authorityMutation("perspective_apply_claim", "applies_perspective"),
  authorityMutation("memory_promotion_claim", "promotes_reviewed_memory"),
  authorityMutation("work_closure_claim", "closes_work"),
  authorityMutation("provider_authority_claim", "authorizes_provider_calls"),
  authorityMutation("github_authority_claim", "authorizes_github_mutation"),
  authorityMutation("merge_authority_claim", "authorizes_merge"),
  authorityMutation("publication_authority_claim", "authorizes_publication"),
  authorityMutation("external_actuation_claim", "authorizes_external_actuation"),
  mutation("decision_identity_mismatch", "invalid", "decision_identity_mismatch", (value) => {
    value.decision_id = "review-decision:wrong";
  }),
  mutation("fingerprint_mismatch", "invalid", "fingerprint_mismatch", (value) => {
    value.integrity.fingerprint = `sha256:${"0".repeat(64)}`;
  }),
];

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}
