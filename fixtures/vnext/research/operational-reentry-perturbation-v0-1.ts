import {
  buildOperationalReentryArmV01,
  buildOperationalReentryEvaluationV01,
  buildOperationalReentrySourceV01,
  type BuildOperationalReentryArmInputV01,
} from "@/lib/vnext/operational-reentry-perturbation";
import {
  canonicalizeProtocolValueV01,
  createProtocolSha256V01,
} from "@/lib/vnext/protocol-primitives";
import type {
  OperationalReentryArmV01,
  OperationalReentryEvaluationV01,
  OperationalReentrySourceV01,
} from "@/types/vnext/operational-reentry-perturbation";

export type OperationalReentryConditioningFixtureVariantV01 =
  | "structured_delta"
  | "reference_only"
  | "no_structured_delta"
  | "unknown";
export type OperationalReentryResetFixtureVariantV01 =
  | "positive_reset"
  | "sticky_stale"
  | "unknown";

export interface OperationalReentryPerturbationFixtureOptionsV01 {
  conditioning?: OperationalReentryConditioningFixtureVariantV01;
  reset?: OperationalReentryResetFixtureVariantV01;
}

export interface OperationalReentryPerturbationFixtureV01 {
  source: OperationalReentrySourceV01;
  arms: OperationalReentryArmV01[];
  evaluation: OperationalReentryEvaluationV01;
  fixture_kind: "deterministic_synthetic_public_safe_mechanics";
  real_provider_calls: 0;
  model_calls: 0;
  network_calls: 0;
  database_writes: 0;
  product_state_mutations: 0;
}

const TARGET_ENTRY_ID =
  "operational-continuation:d26d8d39ca551382d4cb3d13150423b1";
const TARGET_CANDIDATE_ID =
  "operational-friction-candidate:2b94bab619982ee637ad153e661360f";
const TARGET_ENTRY_FINGERPRINT =
  "sha256:63e14d88e5aa5db081bce8e7543ba4c5d5fe63feed45d3ddfc58254cdcbdece5";
const NON_TARGET_ENTRIES = [
  {
    entry_id: "accepted-state:semantic-state:0f1a4083fb628b6e8702cae1",
    fingerprint:
      "sha256:459ae6b4095c05db7837ff4927286a0a42ecf8e30d227457cc02407560870a2b",
  },
  {
    entry_id: "context:portable-manifest",
    fingerprint:
      "sha256:5cb47f917cf5b72e2dd778a2210d48dd539fa10d97b1bde043773ca918b6073d",
  },
];

const TASK = {
  goal: "Review one bounded provider-neutral semantic result chain without applying project state.",
  success_criteria: [
    "Receipt, proposal, and explicit decision relations remain project-isolated.",
  ],
  non_goals: [
    "No StateTransitionReceipt, durable write, Evidence acceptance, or next-context mutation.",
  ],
  required_checks: ["verify-portable-output"],
  forbidden_actions: ["Publish externally without explicit authority."],
  data_classification: "public_safe",
  task_family_key: "semantic-review-loop-equal-budget-stage-5",
};

const REPOSITORY = {
  frozen_head_commit: "b9e8f3e04fdc0b345a6fab88df69161ac11e876d",
  initial_worktree_content_fingerprint:
    "sha256:6140c75f0667d0581bf05ec904d2ae767ec14345dc4f479c473f67544516c9b3",
  construction_cutoff: "2026-07-18T15:02:00.000Z",
  observation_cutoff: "2026-07-18T18:00:00.000Z",
  observation_cutoff_policy: "fixed_predeclared_cutoff" as const,
  platform: "darwin",
  deterministic_adapter_identity: "deterministic_codex_adapter.v0.1",
  capability_version: "codex_host_round_trip.v0.1",
  capability_coverage: [
    "bounded_structured_result",
    "validated_packet_delivery",
    "zero_provider_egress",
  ],
  operation_approval_policy_fingerprint:
    "sha256:f9cab2784ef94a83aa5a67d6ab7c97b86dfca2bcee06c372855343d75a8623e1",
  verification_owner_set_fingerprint:
    "sha256:269b100a7fca50f81afdb954f8d01fcdd2a6e86754dfc0a05a4c09274d24fd71",
  equal_ceiling_fingerprint:
    "sha256:99d37ddcce0d78c822d4c167aa3809993a007feb1481f22bd5ebf93b66ab8ee3",
  equal_budget_is_equal_capability: false as const,
};

const TARGET = {
  packet_entry_id: TARGET_ENTRY_ID,
  packet_entry_kind: "source_ref" as const,
  external_ref: {
    ref_version: "external_ref.v0.1" as const,
    ref_type: "operational_friction_candidate" as const,
    external_id: TARGET_CANDIDATE_ID,
    trust_class: "derived_interpretation" as const,
    observed_at: "2026-07-18T14:33:00.000Z",
    source_ref:
      "sha256:8295ee4fcf01a75fd5787e1bc304e779c35f677be60f1837ad0df4d5dc39b75e",
    compatibility_namespace: "operational_context_selection.v0.1" as const,
  },
  currentness: {
    status: "fresh" as const,
    as_of: "2026-07-18T10:41:00.000Z",
  },
  candidate: recordRef(
    "operational_friction_candidate.v0.1",
    TARGET_CANDIDATE_ID,
    "sha256:8295ee4fcf01a75fd5787e1bc304e779c35f677be60f1837ad0df4d5dc39b75e",
  ),
  selection: recordRef(
    "operational_context_selection.v0.1",
    "operational-context-selection:03ae0fc97e892842fe4a987f7df1857",
    "sha256:01d3ff9a60642d89a5d93d1d566f2ecde64fbd5fa84a72ca78b73ce67d8f1f6b",
  ),
  materialization: recordRef(
    "source_linked_operational_continuation.v0.1",
    "operational-continuation-materialization:5ca70c7ebd16cd4e16d8cdda13d1fb2",
    "sha256:95bb41643ddb919baf9566bc1e5cb5150f2facf0662ae5f5eb5f4958eb274f44",
  ),
  admission: recordRef(
    "operational_continuation_admission.v0.1",
    "operational-continuation-admission:7db88c6dd46effbdddcd862f4c6df85",
    "sha256:e857c305e225fece315efa9b9b2fd745e8e691c799eda69e77fac3186e42788a",
  ),
  packet_a: recordRef(
    "task_context_packet.v0.1",
    "task-context-packet:aebeba9d44911c788c5f1a3",
    "sha256:1d1b4abed2ab52f029df7380e8c7fc685b9754f1a7a5df342100afb4f3ede2f7",
  ),
  packet_b: recordRef(
    "task_context_packet.v0.1",
    "task-context-packet:8810067e61ccfc30081739b",
    "sha256:7307094eb31cc503cf61d88c5f311e8869e4622aa472509f92bcd66aba271e25",
  ),
  lineage_run_receipt: recordRef(
    "run_receipt.v0.1",
    "run-receipt:67afc3ba7cb0e36002047f3e",
    "sha256:c42e4484d86e5fbe5ae691047b277a94130b5c3bee859b5c6b491865e4844fbd",
  ),
  attribution_projection: recordRef(
    "context_use_attribution_projection.v0.1",
    "context-use-attribution:9a157a398766cfa6a25aad2",
    "sha256:5276ed841fd3ae9ff7f7ad634f34ac808b8e46c249354658e12b8a1198a8ce02",
  ),
  attribution_row: {
    presentation: "yes" as const,
    citation_or_reference: "referenced" as const,
    actual_use: "unknown" as const,
    support_validation: "unknown" as const,
    outcome_association: "unknown" as const,
    causal_contribution: "unknown" as const,
    selected_by_exact_packet_and_admission_relation: true as const,
    proposal_only: true as const,
    semantic_transition_eligible: false as const,
    item_level_credit_or_blame: false as const,
  },
};

export function buildOperationalReentryPerturbationFixtureV01(
  options: OperationalReentryPerturbationFixtureOptionsV01 = {},
): OperationalReentryPerturbationFixtureV01 {
  const conditioning = options.conditioning ?? "structured_delta";
  const reset = options.reset ?? "positive_reset";
  const source = buildSourceV01();
  const exact = buildExactArmV01(source, conditioning);
  const ablation = buildAblationArmV01(source, conditioning);
  const stale = buildStaleArmV01(source, reset);
  const baseline = buildBaselineArmV01(source);
  const arms = [exact, ablation, stale, baseline];
  const evaluation = buildOperationalReentryEvaluationV01({
    source,
    arms,
    limitations: [
      "Deterministic fixture mechanics do not predict frontier-model behavior.",
      "The frozen source identities bind one captured public-safe Stage 5-derived construction; fresh upstream fixture constructions may allocate different exact lineage identities.",
      "Reference is not actual use, support validation, outcome association, or causal contribution.",
      "Reset observation is not reset, fallback, rollback, or policy authority.",
      "Neutral current-source reselection is outside E1 v0.1 and requires a separately exact repository-consistent source binding.",
      "The merged Stage 5 exact-case result remains inconclusive.",
    ],
    missing_evidence: [
      "bounded_real_matched_cohort",
      "exact_item_outcome_relation",
      "exact_item_support_relation",
      "empirical_general_benefit",
      "real_model_or_provider_observation",
      "stochastic_repetition_or_confidence",
      "exact_repository_bound_current_source_reselection",
    ],
  });
  return {
    source,
    arms,
    evaluation,
    fixture_kind: "deterministic_synthetic_public_safe_mechanics",
    real_provider_calls: 0,
    model_calls: 0,
    network_calls: 0,
    database_writes: 0,
    product_state_mutations: 0,
  };
}

export function buildOperationalReentryFixtureFamilyV01() {
  return {
    deciding_positive_reset: buildOperationalReentryPerturbationFixtureV01(),
    reference_only: buildOperationalReentryPerturbationFixtureV01({
      conditioning: "reference_only",
    }),
    no_structured_delta: buildOperationalReentryPerturbationFixtureV01({
      conditioning: "no_structured_delta",
    }),
    unknown_conditioning: buildOperationalReentryPerturbationFixtureV01({
      conditioning: "unknown",
    }),
    sticky_stale: buildOperationalReentryPerturbationFixtureV01({
      reset: "sticky_stale",
    }),
    unknown_reset: buildOperationalReentryPerturbationFixtureV01({
      reset: "unknown",
    }),
  };
}

function buildSourceV01(): OperationalReentrySourceV01 {
  return buildOperationalReentrySourceV01({
    merged_stage5_baseline_commit:
      "7c30c83ffc6bc579a8d730f7967244efe8a19214",
    workspace_id: "workspace:978f3b23-c461-4b4d-b740-a6a3b64cb1bf",
    project_id: "project:6df21b43-30c0-4671-b51e-3b07fe30ff85",
    work_id: "worker-process:portable-001",
    work_fingerprint:
      "sha256:ace2f4e066eab3c512dc781297ec9c2c83d2269440a3e311e0ddac39919d5452",
    evaluation_case_id: "evaluation-case:acgc5c-stage-5",
    frozen_source_case: recordRef(
      "model_host_succession_frozen_case.v0.1",
      "model-host-succession-frozen-case:dc67815d308cb13562e5ff6d",
      "sha256:517416caa579ed315365e3e630e37372a6b84d973c239dab66ee35df6c9b4f1e",
    ),
    parent_comparison_source_case: recordRef(
      "operational_continuation_comparison.v0.1",
      "operational-continuation-source-case:fc7df441963e41524d17cbb2",
      "sha256:fc7df441963e41524d17cbb206549471e5631f54b035dafe8dee5dc9536204bb",
    ),
    task: clone(TASK),
    repository: clone(REPOSITORY),
    target: clone(TARGET),
    packet_b_entry_ids: [
      ...NON_TARGET_ENTRIES.map((entry) => entry.entry_id),
      TARGET_ENTRY_ID,
    ],
    packet_b_entry_fingerprints: [
      ...NON_TARGET_ENTRIES.map((entry) => entry.fingerprint),
      TARGET_ENTRY_FINGERPRINT,
    ],
    non_target_packet_entry_ids: NON_TARGET_ENTRIES.map((entry) => entry.entry_id),
    non_target_packet_entry_fingerprints: NON_TARGET_ENTRIES.map(
      (entry) => entry.fingerprint,
    ),
    non_target_downstream_input_fingerprints: [
      fingerprint(TASK),
      fingerprint({
        deterministic_adapter_identity:
          REPOSITORY.deterministic_adapter_identity,
        capability_version: REPOSITORY.capability_version,
        capability_coverage: REPOSITORY.capability_coverage,
        operation_approval_policy_fingerprint:
          REPOSITORY.operation_approval_policy_fingerprint,
        verification_owner_set_fingerprint:
          REPOSITORY.verification_owner_set_fingerprint,
      }),
    ],
    selected_target_count: 1,
    target_disposition: "selected_effective_accept",
    target_is_bundle: false,
    target_budget_excluded: false,
    target_unresolved: false,
    continuation_hop: 1,
    second_continuation_hop_present: false,
    baseline: {
      workspace_id: "research-scope:stage5-one-run-baseline",
      project_id: "research-project:stage5-one-run-baseline",
      work_id: "worker-process:portable-001",
      work_fingerprint:
        "sha256:ace2f4e066eab3c512dc781297ec9c2c83d2269440a3e311e0ddac39919d5452",
      evaluation_case_id: "evaluation-case:acgc5c-stage-5",
      binding_kind: "exact_rebuilt_operational_comparison_one_run_semantics",
      parent_comparison_source_case: recordRef(
        "operational_continuation_comparison.v0.1",
        "operational-continuation-source-case:fc7df441963e41524d17cbb2",
        "sha256:fc7df441963e41524d17cbb206549471e5631f54b035dafe8dee5dc9536204bb",
      ),
      equal_ceiling_fingerprint:
        "sha256:99d37ddcce0d78c822d4c167aa3809993a007feb1481f22bd5ebf93b66ab8ee3",
      scope_is_rebuilt_isolated_semantics: true,
      run_count: 1,
      resume_used: false,
      operational_continuation_present: false,
      packet_b_present: false,
      continuation_admission_present: false,
      post_cutoff_candidate_material_present: false,
    },
    stage5_truth: {
      continuation_worked_end_to_end: true,
      exact_target_delivered_and_referenced: true,
      item_actual_use: "unknown",
      support_validation: "unknown",
      outcome_association: "unknown",
      causal_contribution: "unknown",
      item_actual_use_proven_count: 0,
      support_validated_count: 0,
      outcome_associated_count: 0,
      causally_supported_count: 0,
      exact_case_status: "inconclusive",
      bundle_credit_assigned: false,
    },
  });
}

function armBaseV01(
  source: OperationalReentrySourceV01,
  role: BuildOperationalReentryArmInputV01["role"],
): Omit<BuildOperationalReentryArmInputV01, "downstream"> {
  return {
    role,
    evidence_class:
      role === "existing_one_run_baseline"
        ? "synthetic_source_observation"
        : "deterministic_fixture_execution",
    source_id: source.source_id,
    source_fingerprint: source.integrity.fingerprint,
    workspace_id:
      role === "existing_one_run_baseline"
        ? source.baseline.workspace_id
        : source.workspace_id,
    project_id:
      role === "existing_one_run_baseline"
        ? source.baseline.project_id
        : source.project_id,
    work_id: source.work_id,
    evaluation_case_id: source.evaluation_case_id,
    task: clone(source.task),
    repository: clone(source.repository),
    target_entry_ids: role === "exact_reentry" ? [TARGET_ENTRY_ID] : [],
    packet_entry_ids:
      role === "exact_reentry"
        ? clone(source.packet_b_entry_ids)
        : role === "existing_one_run_baseline"
          ? []
          : clone(source.non_target_packet_entry_ids),
    packet_entry_fingerprints:
      role === "exact_reentry"
        ? clone(source.packet_b_entry_fingerprints)
        : role === "existing_one_run_baseline"
          ? []
          : clone(source.non_target_packet_entry_fingerprints),
    non_target_downstream_input_fingerprints:
      role === "existing_one_run_baseline"
        ? []
        : clone(source.non_target_downstream_input_fingerprints),
    target_lineage:
      role === "existing_one_run_baseline" ? null : clone(source.target),
    stale_relation: null,
  };
}

function buildExactArmV01(
  source: OperationalReentrySourceV01,
  variant: OperationalReentryConditioningFixtureVariantV01,
): OperationalReentryArmV01 {
  const downstream = commonDownstreamV01();
  if (variant !== "no_structured_delta") {
    downstream.referenced_source_ids = [TARGET_ENTRY_ID, TARGET_CANDIDATE_ID];
  }
  if (variant === "structured_delta") {
    downstream.operation_action_classes = ["target_linked_verification_preparation"];
    downstream.result_limitations = ["target_associated_structure_is_not_support"];
  }
  if (variant === "unknown") {
    downstream.response_status = "unobserved";
  }
  return buildOperationalReentryArmV01({
    ...armBaseV01(source, "exact_reentry"),
    evidence_class:
      variant === "unknown" ? "unobserved" : "deterministic_fixture_execution",
    downstream,
  });
}

function buildAblationArmV01(
  source: OperationalReentrySourceV01,
  variant: OperationalReentryConditioningFixtureVariantV01,
): OperationalReentryArmV01 {
  const downstream = commonDownstreamV01();
  if (variant === "unknown") downstream.response_status = "unobserved";
  return buildOperationalReentryArmV01({
    ...armBaseV01(source, "matched_single_item_ablation"),
    evidence_class:
      variant === "unknown" ? "unobserved" : "deterministic_fixture_execution",
    downstream,
  });
}

function buildStaleArmV01(
  source: OperationalReentrySourceV01,
  variant: OperationalReentryResetFixtureVariantV01,
): OperationalReentryArmV01 {
  const base = armBaseV01(source, "stale_or_regime_shift_reset");
  const downstream = commonDownstreamV01();
  downstream.response_status =
    variant === "positive_reset"
      ? "withheld"
      : variant === "sticky_stale"
        ? "continued"
        : "unobserved";
  if (variant === "positive_reset") {
    downstream.result_limitations = ["stale_target_withheld_mechanics_only"];
  }
  if (variant === "sticky_stale") {
    base.target_entry_ids = [TARGET_ENTRY_ID];
    base.packet_entry_ids = clone(source.packet_b_entry_ids);
    base.packet_entry_fingerprints = clone(source.packet_b_entry_fingerprints);
    downstream.referenced_source_ids = [TARGET_ENTRY_ID, TARGET_CANDIDATE_ID];
    downstream.operation_action_classes = ["target_linked_verification_preparation"];
    downstream.result_limitations = ["stale_target_persisted_candidate_only"];
  }
  return buildOperationalReentryArmV01({
    ...base,
    evidence_class:
      variant === "unknown" ? "unobserved" : "deterministic_fixture_execution",
    downstream,
    stale_relation: {
      reason_kind: "regime_inapplicable",
      target_entry_id: TARGET_ENTRY_ID,
      source_ref:
        "sha256:ca64e69fd744ae6dc4555c91666daedbc03aed76f1c69e4954540849e9ae0f4a",
      reason_observed_at: "2026-07-18T15:30:00.000Z",
      applies_before_outcome: true,
      regime_key: "synthetic-regime:verification-preparation-no-longer-applicable",
    },
  });
}

function buildBaselineArmV01(source: OperationalReentrySourceV01): OperationalReentryArmV01 {
  const downstream = commonDownstreamV01();
  downstream.referenced_source_ids = [
    source.baseline.parent_comparison_source_case.record_id,
  ];
  downstream.result_limitations = ["contextual_one_run_baseline_not_direct_ablation"];
  return buildOperationalReentryArmV01({
    ...armBaseV01(source, "existing_one_run_baseline"),
    downstream,
  });
}

function commonDownstreamV01() {
  return {
    referenced_source_ids: [] as string[],
    required_check_dispositions: [
      { check_id: "verify-portable-output", disposition: "passed" as const },
    ],
    operation_action_classes: ["bounded_result_review"],
    blocker_warning_gap_classes: [] as string[],
    changed_artifacts: [] as Array<{
      artifact_id: string;
      before_hash: string | null;
      after_hash: string | null;
    }>,
    result_limitations: ["deterministic_fixture_mechanics_only"],
    response_status: "continued" as
      | "continued"
      | "withheld"
      | "refused"
      | "abstained"
      | "unobserved",
  };
}

function recordRef(
  record_version: string,
  record_id: string,
  record_fingerprint: string,
) {
  return { record_version, record_id, record_fingerprint };
}

function clone<T>(value: T): T {
  return structuredClone(value);
}

function fingerprint(value: unknown): string {
  return createProtocolSha256V01(canonicalizeProtocolValueV01(value));
}
