import type { EpisodeDeltaProposalBuilderInputV01 } from "@/lib/vnext/episode-delta-proposal";
import {
  EXTERNAL_REF_VERSION_V01,
  type ExternalRefTrustClassV01,
  type ExternalRefV01,
} from "@/types/vnext/external-ref";
import type { EpisodeDeltaProposalV01 } from "@/types/vnext/episode-delta-proposal";

export const EPISODE_DELTA_PROPOSAL_FIXTURE_CREATED_AT =
  "2026-07-10T12:00:00.000Z";
const SOURCE_AT = "2026-07-10T11:50:00.000Z";
const STALE_SOURCE_AT = "2026-07-01T09:00:00.000Z";
const MAX_BOUNDED_TEXT = "x".repeat(2000);
const OVERSIZED_BOUNDED_TEXT = "x".repeat(2001);

function ref(
  ref_type: string,
  external_id: string,
  trust_class: ExternalRefTrustClassV01,
  extra: Partial<ExternalRefV01> = {},
): ExternalRefV01 {
  return {
    ref_version: EXTERNAL_REF_VERSION_V01,
    ref_type,
    external_id,
    trust_class,
    ...extra,
  };
}

const genericRunReceiptRef = ref(
  "run_receipt",
  "run-receipt:generic-cli-fixture",
  "direct_local_observation",
  { host: "generic-cli", observed_at: SOURCE_AT },
);
const genericTaskContextPacketRef = ref(
  "task_context_packet",
  "task-context-packet:generic-cli-fixture",
  "direct_local_observation",
  { host: "generic-cli", observed_at: SOURCE_AT },
);
const genericObserverRef = ref(
  "worker",
  "generic-cli-worker-fixture",
  "direct_local_observation",
  { host: "generic-cli", observed_at: SOURCE_AT },
);
const semanticTargetRef = ref(
  "project_semantic_target",
  "target:protocol-foundation",
  "direct_local_observation",
  { observed_at: SOURCE_AT },
);
const sourceArtifactRef = ref(
  "repository_relative_path",
  "types/vnext/episode-delta-proposal.ts",
  "direct_local_observation",
  { host: "git", observed_at: SOURCE_AT },
);

function genericDirectObservationInput(): EpisodeDeltaProposalBuilderInputV01 {
  return {
    workspace_id: "workspace-portable-fixture",
    project_id: "project-portable-fixture",
    created_at: EPISODE_DELTA_PROPOSAL_FIXTURE_CREATED_AT,
    status: "pending_review",
    bounded_summary:
      "A bounded local observation supports one reviewable protocol-foundation change candidate.",
    task_context_packet_ref: genericTaskContextPacketRef,
    run_receipt_refs: [genericRunReceiptRef],
    observations: [
      {
        material_id: "material:observation:protocol-file",
        material_kind: "repository_artifact_observation",
        bounded_summary:
          "A repository-relative protocol contract artifact is present in the bounded run result.",
        event_at: SOURCE_AT,
        observed_at: SOURCE_AT,
        observer_ref: genericObserverRef,
        trust_class: "direct_local_observation",
        source_run_receipt_refs: [genericRunReceiptRef],
        source_refs: [genericRunReceiptRef, sourceArtifactRef],
        subject_refs: [sourceArtifactRef],
      },
    ],
    attestations: [],
    inferences: [],
    proposed_deltas: [
      {
        candidate_id: "delta:protocol-contract",
        delta_type: "code_delta",
        operation: "revise",
        title: "Review the provider-neutral proposal contract candidate",
        current_state: {
          knowledge_status: "known",
          bounded_summary:
            "The protocol foundation currently includes TaskContextPacket and RunReceipt contracts.",
          source_material_ids: ["material:observation:protocol-file"],
          source_refs: [genericRunReceiptRef],
        },
        proposed_state_summary:
          "Add a pure EpisodeDeltaProposal contract for reviewable semantic change candidates.",
        target_refs: [semanticTargetRef],
        basis_material_ids: ["material:observation:protocol-file"],
        source_refs: [genericRunReceiptRef, sourceArtifactRef],
        uncertainties: [],
        limitations: [
          "The candidate is contract-level fixture material and does not prove integration or use.",
        ],
        review_required: true,
      },
    ],
    conflicts: [],
    missing_information: [],
    uncertainties: [],
    limitations: [
      "This synthetic fixture demonstrates contract behavior only.",
    ],
    source_status: {
      coverage: "complete",
      currentness: "fresh",
      as_of: SOURCE_AT,
      review_required: false,
      basis: "The local adapter directly observed the bounded source receipt.",
      source_refs: [genericRunReceiptRef],
    },
    source_refs: [
      genericRunReceiptRef,
      genericTaskContextPacketRef,
      sourceArtifactRef,
    ],
    compatibility: {
      source_contracts: [],
      unmapped_fields: [],
      warnings: [],
      external_refs: [],
    },
    authority_notes: [],
  };
}

export const genericCliDirectObservationProposalInputFixture =
  genericDirectObservationInput();

export const hostAttestationOnlyProposalInputFixture = (() => {
  const runReceiptRef = ref(
    "run_receipt",
    "run-receipt:host-attestation-fixture",
    "host_attestation",
    {
      provider: "provider-a",
      host: "host-a",
      observed_at: SOURCE_AT,
    },
  );
  const reporterRef = ref(
    "host_session",
    "host-session:fixture",
    "host_attestation",
    { provider: "provider-a", host: "host-a", observed_at: SOURCE_AT },
  );
  const targetRef = ref(
    "project_semantic_target",
    "target:host-reported-result",
    "host_attestation",
    { provider: "provider-a", host: "host-a" },
  );
  const input = genericDirectObservationInput();
  input.bounded_summary =
    "A host attestation supports a reviewable candidate without becoming an observation.";
  input.task_context_packet_ref = null;
  input.run_receipt_refs = [runReceiptRef];
  input.observations = [];
  input.attestations = [
    {
      material_id: "material:attestation:host-result",
      material_kind: "host_result_attestation",
      bounded_summary:
        "The host reported a bounded result; the proposal does not upgrade it to direct observation.",
      reported_at: SOURCE_AT,
      reporter_ref: reporterRef,
      trust_class: "host_attestation",
      source_run_receipt_refs: [runReceiptRef],
      source_refs: [runReceiptRef, reporterRef],
      subject_refs: [targetRef],
    },
  ];
  input.inferences = [];
  input.proposed_deltas = [
    {
      candidate_id: "delta:host-attested-result",
      delta_type: "coordination_delta",
      operation: "revise",
      title: "Review the host-reported coordination candidate",
      current_state: {
        knowledge_status: "known",
        bounded_summary:
          "The current coordination meaning is represented only by the supplied host attestation.",
        source_material_ids: ["material:attestation:host-result"],
        source_refs: [runReceiptRef],
      },
      proposed_state_summary:
        "Review whether the host-reported result should inform project coordination.",
      target_refs: [targetRef],
      basis_material_ids: ["material:attestation:host-result"],
      source_refs: [runReceiptRef, reporterRef],
      uncertainties: ["The host report has not been independently observed."],
      limitations: ["Host attestation is candidate basis, not accepted Evidence."],
      review_required: true,
    },
  ];
  input.conflicts = [];
  input.missing_information = [];
  input.uncertainties = [
    {
      uncertainty_id: "uncertainty:host-verification",
      bounded_summary:
        "Independent observation of the host-reported result is unavailable.",
      related_material_ids: ["material:attestation:host-result"],
      related_delta_ids: ["delta:host-attested-result"],
      source_refs: [runReceiptRef],
    },
  ];
  input.source_status = {
    coverage: "partial",
    currentness: "partial",
    as_of: SOURCE_AT,
    review_required: true,
    basis: "Only host-attested source material is available.",
    source_refs: [runReceiptRef, reporterRef],
  };
  input.source_refs = [runReceiptRef, reporterRef];
  input.compatibility = {
    source_contracts: ["host_result_fixture.v0.1"],
    unmapped_fields: [],
    warnings: ["Host claims remain attestations."],
    external_refs: [reporterRef],
  };
  return input;
})();

function mixedProvenanceInput(): EpisodeDeltaProposalBuilderInputV01 {
  const input = genericDirectObservationInput();
  const hostRunReceiptRef = ref(
    "run_receipt",
    "run-receipt:mixed-host-fixture",
    "host_attestation",
    { provider: "provider-b", host: "host-b", observed_at: SOURCE_AT },
  );
  const hostReporterRef = ref(
    "host_session",
    "host-session:mixed-fixture",
    "host_attestation",
    { provider: "provider-b", host: "host-b", observed_at: SOURCE_AT },
  );
  const interpreterRef = ref(
    "deterministic_rule",
    "rule:bounded-semantic-comparison-v0-1",
    "derived_interpretation",
    { host: "local-rules", observed_at: SOURCE_AT },
  );
  input.bounded_summary =
    "Observed, attested, and derived material remain separate in a mixed-provenance proposal.";
  input.run_receipt_refs = [genericRunReceiptRef, hostRunReceiptRef];
  input.attestations = [
    {
      material_id: "material:attestation:mixed-result",
      material_kind: "host_result_attestation",
      bounded_summary:
        "A separate host reported that the bounded protocol result is complete.",
      reported_at: SOURCE_AT,
      reporter_ref: hostReporterRef,
      trust_class: "host_attestation",
      source_run_receipt_refs: [hostRunReceiptRef],
      source_refs: [hostRunReceiptRef, hostReporterRef],
      subject_refs: [semanticTargetRef],
    },
  ];
  input.inferences = [
    {
      material_id: "material:inference:mixed-meaning",
      material_kind: "deterministic_semantic_comparison",
      bounded_summary:
        "The observed artifact and host report jointly suggest a reviewable coordination change.",
      inferred_at: SOURCE_AT,
      interpreter_ref: interpreterRef,
      trust_class: "derived_interpretation",
      basis_material_ids: [
        "material:observation:protocol-file",
        "material:attestation:mixed-result",
      ],
      source_run_receipt_refs: [genericRunReceiptRef, hostRunReceiptRef],
      source_refs: [genericRunReceiptRef, hostRunReceiptRef],
      subject_refs: [semanticTargetRef],
    },
  ];
  input.proposed_deltas[0] = {
    ...input.proposed_deltas[0]!,
    candidate_id: "delta:mixed-provenance",
    delta_type: "coordination_delta",
    title: "Review the mixed-provenance coordination candidate",
    current_state: {
      knowledge_status: "known",
      bounded_summary:
        "The supplied receipts preserve distinct observation and attestation material.",
      source_material_ids: [
        "material:observation:protocol-file",
        "material:attestation:mixed-result",
      ],
      source_refs: [genericRunReceiptRef, hostRunReceiptRef],
    },
    proposed_state_summary:
      "Review whether the mixed source material should change project coordination meaning.",
    basis_material_ids: ["material:inference:mixed-meaning"],
    source_refs: [genericRunReceiptRef, hostRunReceiptRef, interpreterRef],
    uncertainties: ["The host attestation remains independently unverified."],
    limitations: ["Derived interpretation is not Evidence or approval."],
  };
  input.uncertainties = [
    {
      uncertainty_id: "uncertainty:mixed-host-source",
      bounded_summary:
        "The host-attested source has not been upgraded to direct observation.",
      related_material_ids: ["material:attestation:mixed-result"],
      related_delta_ids: ["delta:mixed-provenance"],
      source_refs: [hostRunReceiptRef],
    },
  ];
  input.source_status = {
    coverage: "partial",
    currentness: "partial",
    as_of: SOURCE_AT,
    review_required: true,
    basis: "Mixed observed and host-attested source material requires review.",
    source_refs: [genericRunReceiptRef, hostRunReceiptRef],
  };
  input.source_refs = [
    genericRunReceiptRef,
    hostRunReceiptRef,
    hostReporterRef,
    interpreterRef,
  ];
  return input;
}

export const mixedProvenanceProposalInputFixture = mixedProvenanceInput();

export const conflictingSourceProposalInputFixture = (() => {
  const input = mixedProvenanceInput();
  input.bounded_summary =
    "Conflicting observed and attested material remains explicitly unresolved.";
  input.conflicts = [
    {
      conflict_id: "conflict:completion-meaning",
      conflict_kind: "source_meaning_conflict",
      bounded_summary:
        "The local observation establishes an artifact, while the host attestation claims broader completion.",
      material_ids: [
        "material:observation:protocol-file",
        "material:attestation:mixed-result",
      ],
      source_refs: input.run_receipt_refs,
      resolution_status: "unresolved",
      automatically_resolved: false,
    },
  ];
  input.proposed_deltas[0]!.uncertainties.push(
    "The completion meaning remains conflicted and unresolved.",
  );
  return input;
})();

export const unknownAndMissingProposalInputFixture = (() => {
  const input = genericDirectObservationInput();
  input.bounded_summary =
    "Unknown and missing current project material remains explicit in reviewable candidates.";
  input.proposed_deltas = [
    {
      ...input.proposed_deltas[0]!,
      candidate_id: "delta:unknown-current-state",
      operation: "unknown",
      title: "Review a candidate with unknown current state",
      current_state: {
        knowledge_status: "unknown",
        bounded_summary: null,
        source_material_ids: [],
        source_refs: [],
      },
      proposed_state_summary:
        "Keep the candidate pending until the current semantic state is known.",
      uncertainties: ["Current semantic state is unknown."],
    },
    {
      ...input.proposed_deltas[0]!,
      candidate_id: "delta:missing-source-basis",
      operation: "add",
      title: "Review a candidate with missing source basis",
      current_state: {
        knowledge_status: "missing",
        bounded_summary: null,
        source_material_ids: [],
        source_refs: [],
      },
      proposed_state_summary:
        "Request the missing source basis before any semantic decision.",
      uncertainties: ["A required semantic source is missing."],
    },
  ];
  input.missing_information = [
    {
      missing_id: "missing:unknown-current-state",
      knowledge_status: "unknown",
      code: "current_semantic_state_unknown",
      bounded_summary:
        "The current semantic state cannot be established from the supplied receipt.",
      related_material_ids: ["material:observation:protocol-file"],
      related_delta_ids: ["delta:unknown-current-state"],
      source_refs: [genericRunReceiptRef],
      review_required: true,
    },
    {
      missing_id: "missing:source-basis",
      knowledge_status: "missing",
      code: "required_source_basis_missing",
      bounded_summary:
        "A source needed to establish the current semantic basis is absent.",
      related_material_ids: ["material:observation:protocol-file"],
      related_delta_ids: ["delta:missing-source-basis"],
      source_refs: [genericRunReceiptRef],
      review_required: true,
    },
  ];
  input.uncertainties = [
    {
      uncertainty_id: "uncertainty:unknown-and-missing",
      bounded_summary:
        "Neither unknown nor missing material is converted into known state.",
      related_material_ids: ["material:observation:protocol-file"],
      related_delta_ids: [
        "delta:unknown-current-state",
        "delta:missing-source-basis",
      ],
      source_refs: [genericRunReceiptRef],
    },
  ];
  input.source_status = {
    coverage: "unknown",
    currentness: "unknown",
    as_of: null,
    review_required: true,
    basis: "The supplied source does not establish aggregate currentness.",
    source_refs: [genericRunReceiptRef],
  };
  return input;
})();

export const staleSourceReviewProposalInputFixture = (() => {
  const input = genericDirectObservationInput();
  input.bounded_summary =
    "Stale source material remains review-required before any later decision.";
  input.source_status = {
    coverage: "complete",
    currentness: "stale",
    as_of: STALE_SOURCE_AT,
    review_required: true,
    basis: "The source timestamp predates the bounded review window.",
    source_refs: [genericRunReceiptRef],
  };
  input.uncertainties = [
    {
      uncertainty_id: "uncertainty:stale-source",
      bounded_summary:
        "The source may no longer describe current project semantics.",
      related_material_ids: ["material:observation:protocol-file"],
      related_delta_ids: ["delta:protocol-contract"],
      source_refs: [genericRunReceiptRef],
    },
  ];
  return input;
})();

export const maxBoundedTextProposalInputFixture = (() => {
  const input = genericDirectObservationInput();
  input.bounded_summary =
    "A text-bearing collection element exactly at the v0.1 limit remains valid.";
  input.limitations = [MAX_BOUNDED_TEXT];
  return input;
})();

export const observationInferenceChainProposalInputFixture = (() => {
  const input = genericDirectObservationInput();
  const firstInterpreterRef = ref(
    "deterministic_rule",
    "rule:observation-inference-chain-a",
    "derived_interpretation",
    { host: "local-rules", observed_at: SOURCE_AT },
  );
  const secondInterpreterRef = ref(
    "deterministic_rule",
    "rule:observation-inference-chain-b",
    "derived_interpretation",
    { host: "local-rules", observed_at: SOURCE_AT },
  );
  input.bounded_summary =
    "A two-step inference chain remains valid when rooted in observation material.";
  input.inferences = [
    {
      material_id: "material:inference:observation-rooted-a",
      material_kind: "deterministic_semantic_interpretation",
      bounded_summary:
        "The observed protocol artifact supports a first bounded interpretation.",
      inferred_at: SOURCE_AT,
      interpreter_ref: firstInterpreterRef,
      trust_class: "derived_interpretation",
      basis_material_ids: ["material:observation:protocol-file"],
      source_run_receipt_refs: [genericRunReceiptRef],
      source_refs: [genericRunReceiptRef],
      subject_refs: [semanticTargetRef],
    },
    {
      material_id: "material:inference:observation-rooted-b",
      material_kind: "deterministic_semantic_interpretation",
      bounded_summary:
        "The first interpretation supports a second bounded interpretation without a cycle.",
      inferred_at: SOURCE_AT,
      interpreter_ref: secondInterpreterRef,
      trust_class: "derived_interpretation",
      basis_material_ids: ["material:inference:observation-rooted-a"],
      source_run_receipt_refs: [genericRunReceiptRef],
      source_refs: [genericRunReceiptRef],
      subject_refs: [semanticTargetRef],
    },
  ];
  input.proposed_deltas[0]!.basis_material_ids = [
    "material:inference:observation-rooted-b",
  ];
  input.source_refs.push(firstInterpreterRef, secondInterpreterRef);
  return input;
})();

export const attestationInferenceProposalInputFixture = (() => {
  const input = clone(hostAttestationOnlyProposalInputFixture);
  const interpreterRef = ref(
    "deterministic_rule",
    "rule:attestation-inference-chain",
    "derived_interpretation",
    { host: "local-rules", observed_at: SOURCE_AT },
  );
  const runReceiptRef = input.run_receipt_refs[0]!;
  const targetRef = input.proposed_deltas[0]!.target_refs[0]!;
  input.bounded_summary =
    "A bounded inference remains valid when rooted in attestation material.";
  input.inferences = [
    {
      material_id: "material:inference:attestation-rooted",
      material_kind: "deterministic_semantic_interpretation",
      bounded_summary:
        "The host attestation supports a derived interpretation without upgrading trust.",
      inferred_at: SOURCE_AT,
      interpreter_ref: interpreterRef,
      trust_class: "derived_interpretation",
      basis_material_ids: ["material:attestation:host-result"],
      source_run_receipt_refs: [runReceiptRef],
      source_refs: [runReceiptRef],
      subject_refs: [targetRef],
    },
  ];
  input.proposed_deltas[0]!.basis_material_ids = [
    "material:inference:attestation-rooted",
  ];
  input.source_refs.push(interpreterRef);
  return input;
})();

export interface InvalidEpisodeDeltaProposalFixtureCaseV01 {
  name: string;
  expected_status: "invalid" | "blocked";
  expected_error_code: string;
  mutate(proposal: EpisodeDeltaProposalV01): unknown;
}

function mutation(
  name: string,
  expected_status: "invalid" | "blocked",
  expected_error_code: string,
  mutate: (proposal: EpisodeDeltaProposalV01 & Record<string, unknown>) => void,
): InvalidEpisodeDeltaProposalFixtureCaseV01 {
  return {
    name,
    expected_status,
    expected_error_code,
    mutate(proposal) {
      const value = clone(proposal) as EpisodeDeltaProposalV01 &
        Record<string, unknown>;
      mutate(value);
      return value;
    },
  };
}

function authorityMutation(
  name: string,
  field: keyof EpisodeDeltaProposalV01["authority_summary"],
): InvalidEpisodeDeltaProposalFixtureCaseV01 {
  return mutation(name, "blocked", "authority_boundary_violation", (value) => {
    (value.authority_summary as unknown as Record<string, unknown>)[field] = true;
  });
}

export const invalidEpisodeDeltaProposalFixtureCases: InvalidEpisodeDeltaProposalFixtureCaseV01[] = [
  mutation("unsupported_protocol_version", "blocked", "unsupported_protocol_version", (value) => {
    value.proposal_version = "episode_delta_proposal.v9" as never;
  }),
  mutation("missing_workspace_id", "invalid", "workspace_id_missing", (value) => {
    value.workspace_id = "";
  }),
  mutation("missing_project_id", "invalid", "project_id_missing", (value) => {
    value.project_id = "";
  }),
  mutation("missing_source_run_receipt", "invalid", "source_run_receipt_required", (value) => {
    value.run_receipt_refs = [];
  }),
  mutation("decision_status_on_proposal", "blocked", "proposal_status_invalid", (value) => {
    value.status = "accepted" as never;
  }),
  mutation("provider_specific_core_field", "blocked", "provider_specific_core_field", (value) => {
    value.openai_session_id = "provider-native-fixture";
  }),
  mutation("raw_prompt_field", "blocked", "raw_prompt_shaped_field", (value) => {
    value.raw_prompt = "synthetic prompt-shaped material";
  }),
  mutation("raw_transcript_field", "blocked", "raw_transcript_shaped_field", (value) => {
    value.raw_transcript = "synthetic transcript-shaped material";
  }),
  mutation("hidden_reasoning_field", "blocked", "hidden_reasoning_shaped_field", (value) => {
    value.hidden_reasoning = "synthetic reasoning-shaped material";
  }),
  mutation("terminal_dump_field", "blocked", "raw_terminal_log_shaped_field", (value) => {
    value.environment_dump = "synthetic terminal dump";
  }),
  mutation("credential_field", "blocked", "secret_shaped_field", (value) => {
    value.credentials = "synthetic credential-shaped material";
  }),
  mutation("secret_shaped_value", "blocked", "secret_shaped_material", (value) => {
    value.limitations = ["OPENAI_API_KEY=sk-proj-fixture-secret"];
  }),
  mutation("oversized_top_level_limitation", "blocked", "summary_bound_exceeded", (value) => {
    value.limitations = [OVERSIZED_BOUNDED_TEXT];
  }),
  mutation("oversized_delta_uncertainty", "blocked", "summary_bound_exceeded", (value) => {
    value.proposed_deltas[0]!.uncertainties = [OVERSIZED_BOUNDED_TEXT];
  }),
  mutation("oversized_compatibility_warning", "blocked", "summary_bound_exceeded", (value) => {
    value.compatibility.warnings = [OVERSIZED_BOUNDED_TEXT];
  }),
  mutation("unknown_root_field", "blocked", "unknown_core_field", (value) => {
    value.extra_metadata = "not in contract";
  }),
  mutation("unknown_nested_field", "invalid", "unknown_nested_field", (value) => {
    (value.proposed_deltas[0] as unknown as Record<string, unknown>).display_hint = "not in contract";
  }),
  mutation("malformed_external_ref", "invalid", "external_ref_malformed", (value) => {
    value.run_receipt_refs[0] = null as never;
  }),
  mutation("conflicting_duplicate_external_ref", "blocked", "duplicate_conflicting_external_ref", (value) => {
    value.compatibility.external_refs.push(
      ref("host_session", "duplicate-ref", "host_attestation", {
        provider: "provider-a",
        compatibility_namespace: "compat.duplicate",
      }),
      ref("host_session", "duplicate-ref", "imported_unverified", {
        provider: "provider-b",
        compatibility_namespace: "compat.duplicate",
      }),
    );
  }),
  mutation("observation_attestation_trust", "blocked", "observation_trust_class_invalid", (value) => {
    value.observations[0]!.trust_class = "host_attestation" as never;
    value.observations[0]!.observer_ref.trust_class = "host_attestation";
  }),
  mutation("attestation_observation_trust", "blocked", "attestation_trust_class_invalid", (value) => {
    const attestation = clone(hostAttestationOnlyProposalInputFixture.attestations[0]!);
    attestation.trust_class = "direct_local_observation" as never;
    attestation.reporter_ref.trust_class = "direct_local_observation";
    value.attestations = [attestation];
  }),
  mutation("malformed_timestamp", "invalid", "timestamp_invalid", (value) => {
    value.created_at = "not-a-timestamp";
  }),
  mutation("missing_relation_source_item", "invalid", "relation_source_item_missing", (value) => {
    value.proposed_deltas[0]!.basis_material_ids.push("material:missing");
  }),
  mutation("direct_inference_self_reference", "invalid", "inference_self_relation", (value) => {
    const inference = clone(observationInferenceChainProposalInputFixture.inferences[0]!);
    inference.basis_material_ids = [inference.material_id];
    value.inferences = [inference];
    value.trust_summary.derived_interpretations = 1;
  }),
  mutation("two_node_inference_cycle", "blocked", "inference_basis_cycle", (value) => {
    const first = clone(observationInferenceChainProposalInputFixture.inferences[0]!);
    const second = clone(observationInferenceChainProposalInputFixture.inferences[1]!);
    first.material_id = "material:inference:cycle-a";
    first.basis_material_ids = ["material:inference:cycle-b"];
    second.material_id = "material:inference:cycle-b";
    second.basis_material_ids = ["material:inference:cycle-a"];
    value.inferences = [first, second];
    value.trust_summary.derived_interpretations = 2;
  }),
  mutation("three_node_inference_cycle", "blocked", "inference_basis_cycle", (value) => {
    const first = clone(observationInferenceChainProposalInputFixture.inferences[0]!);
    const second = clone(observationInferenceChainProposalInputFixture.inferences[1]!);
    const third = clone(observationInferenceChainProposalInputFixture.inferences[0]!);
    first.material_id = "material:inference:cycle-a";
    first.basis_material_ids = ["material:inference:cycle-b"];
    second.material_id = "material:inference:cycle-b";
    second.basis_material_ids = ["material:inference:cycle-c"];
    third.material_id = "material:inference:cycle-c";
    third.basis_material_ids = ["material:inference:cycle-a"];
    value.inferences = [first, second, third];
    value.trust_summary.derived_interpretations = 3;
  }),
  mutation("mismatched_deterministic_id", "invalid", "proposal_identity_mismatch", (value) => {
    value.proposal_id = "episode-delta-proposal:wrong";
  }),
  mutation("mismatched_fingerprint", "invalid", "fingerprint_mismatch", (value) => {
    value.integrity.fingerprint = "sha256:wrong";
  }),
  mutation("unknown_to_known_coercion", "blocked", "unknown_to_known_coercion", (value) => {
    value.proposed_deltas[0]!.current_state.knowledge_status = "unknown";
    value.proposed_deltas[0]!.current_state.bounded_summary = "Invented current state";
  }),
  mutation("stale_source_without_review", "blocked", "nonfresh_source_requires_review", (value) => {
    value.source_status.currentness = "stale";
    value.source_status.as_of = STALE_SOURCE_AT;
    value.source_status.review_required = false;
  }),
  mutation("conflict_auto_resolved", "blocked", "conflict_auto_resolution_forbidden", (value) => {
    value.conflicts = [
      {
        conflict_id: "conflict:forbidden-auto-resolution",
        conflict_kind: "fixture_conflict",
        bounded_summary: "Synthetic conflict must remain unresolved.",
        material_ids: ["material:observation:protocol-file", "material:missing"],
        source_refs: value.run_receipt_refs,
        resolution_status: "resolved" as never,
        automatically_resolved: true as never,
      },
    ];
  }),
  authorityMutation("claims_accepted_evidence", "proposal_is_accepted_evidence"),
  authorityMutation("claims_canonical_state", "proposal_is_canonical_project_state"),
  authorityMutation("claims_review_decision", "proposal_is_review_decision"),
  authorityMutation("claims_state_transition", "proposal_is_state_transition_receipt"),
  authorityMutation("claims_work_closure", "closes_work"),
  authorityMutation("claims_perspective_apply", "applies_perspective"),
  authorityMutation("claims_memory_promotion", "promotes_reviewed_memory"),
  authorityMutation("claims_provider_authority", "authorizes_provider_calls"),
  authorityMutation("claims_github_authority", "authorizes_github_mutation"),
  authorityMutation("claims_merge_authority", "authorizes_merge"),
  authorityMutation("claims_publication_authority", "authorizes_publication"),
  authorityMutation("claims_external_actuation", "authorizes_external_actuation"),
  authorityMutation("claims_execution_authority", "authorizes_execution"),
  authorityMutation("claims_scheduling_authority", "authorizes_scheduling"),
  authorityMutation("claims_retry_authority", "authorizes_retry"),
  authorityMutation("claims_replay_authority", "authorizes_replay"),
  authorityMutation("claims_deployment_authority", "authorizes_deployment"),
  authorityMutation("claims_database_write", "writes_database"),
  authorityMutation("claims_automatic_next_context", "selects_next_context_automatically"),
  authorityMutation("confidence_grants_authority", "confidence_or_agreement_grants_authority"),
  authorityMutation("source_validation_grants_authority", "source_validation_grants_authority"),
  authorityMutation("fingerprint_verification_grants_authority", "fingerprint_verification_grants_authority"),
  authorityMutation("changed_files_grant_authority", "changed_files_grant_authority"),
  authorityMutation("passed_checks_grant_authority", "passed_checks_grant_authority"),
  authorityMutation("pull_request_presence_grants_authority", "pull_request_presence_grants_authority"),
];

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}
