import {
  buildStrategyCompositionAblationCaseV01,
  buildStrategyCompositionCaseV01,
  createStrategyCompositionCaseReferenceV01,
  type BuildStrategyCompositionCaseInputV01,
} from "@/lib/vnext/strategy-composition-case";
import { STRATEGY_COMPOSITION_EVALUATION_DESIGN_VERSION_V01 } from "@/types/vnext/strategy-composition-case";

const workspaceId = "workspace:strategy-composition-fixture";
const projectId = "project:strategy-composition-fixture";
const developmentCutoff = "2026-08-05T00:00:00.000Z";

const baselineSource = sourceFixture({
  source_ref_id: "source:baseline-design",
  source_kind: "synthetic_fixture",
  source_use: "construction_input",
  source_id: "fixture:monolithic-baseline",
  fingerprint_character: "1",
  observed_at: "2026-08-01T00:00:00.000Z",
  available_at: "2026-08-01T00:00:00.000Z",
  epistemic_status: "observed",
});

export const strategyCompositionBaselineInputFixture = deepFreeze({
  case_binding: {
    workspace_id: workspaceId,
    project_id: projectId,
    case_key: "case:monolithic-baseline",
    task_family_key: "task-family:repository-change",
    construction_cutoff: developmentCutoff,
    synthetic: true,
  },
  source_refs: [baselineSource],
  components: [
    componentFixture({
      component_id: "component:monolithic-instruction",
      title: "Monolithic bounded instruction",
      summary:
        "One bounded instruction combines decomposition, falsification, and verification without claiming superiority.",
      procedural_function:
        "Represent the simplest comparison reference without evaluating it.",
      applicability_condition:
        "Use only as an explicit offline baseline for the same task family.",
      source_ref_ids: [baselineSource.source_ref_id],
      expected_effect:
        "Provide a concrete baseline identity for a later controlled comparison.",
      falsifier:
        "The baseline is invalid if its task family, source, or cutoff differs from the candidate case.",
      uncertainty: ["No comparative outcome is available in this contract."],
      limitations: ["Baseline design is not a superiority result."],
    }),
  ],
  role_bindings: [],
  relations: [],
  evaluation_design: {
    design_version: STRATEGY_COMPOSITION_EVALUATION_DESIGN_VERSION_V01,
    case_role: "baseline",
    baseline_case: null,
    superiority_claimed: false,
  },
  limitations: ["The baseline is a design reference, not an accepted strategy."],
  missingness: ["No baseline outcome is present."],
} satisfies BuildStrategyCompositionCaseInputV01);

export const strategyCompositionBaselineCaseFixture =
  buildStrategyCompositionCaseV01(strategyCompositionBaselineInputFixture);

const strategicTransferSource = sourceFixture({
  source_ref_id: "source:strategic-transfer-item",
  source_kind: "strategic_advantage_transfer_item",
  source_use: "construction_input",
  source_id: "transfer:verification-leverage",
  fingerprint_character: "2",
  observed_at: "2026-08-02T00:00:00.000Z",
  available_at: "2026-08-02T00:00:00.000Z",
  epistemic_status: "derived",
});
const assessmentSource = sourceFixture({
  source_ref_id: "source:criterion-assessment",
  source_kind: "criterion_assessment",
  source_use: "construction_input",
  source_id: "assessment:source-bound-plan",
  fingerprint_character: "3",
  observed_at: "2026-08-02T12:00:00.000Z",
  available_at: "2026-08-02T12:00:00.000Z",
  epistemic_status: "observed",
});
const verificationSource = sourceFixture({
  source_ref_id: "source:verification-guide",
  source_kind: "accepted_semantic_source",
  source_use: "construction_input",
  source_id: "semantic:verification-order",
  fingerprint_character: "4",
  observed_at: "2026-08-03T00:00:00.000Z",
  available_at: "2026-08-03T00:00:00.000Z",
  epistemic_status: "observed",
});

const developmentComponents = [
  componentFixture({
    component_id: "component:decompose",
    title: "Decompose the bounded change",
    summary:
      "Separate the requested change into source, behavior, and verification responsibilities.",
    procedural_function:
      "Make the bounded strategy hypothesis inspectable before execution exists.",
    applicability_condition:
      "The task has multiple independently reviewable responsibilities.",
    source_ref_ids: [assessmentSource.source_ref_id],
    expected_effect:
      "Reduce hidden coupling among the proposed responsibilities.",
    falsifier:
      "The decomposition adds no reviewable distinction or introduces scope outside the case.",
    uncertainty: ["The later comparison may find no burden reduction."],
    limitations: ["Decomposition is a hypothesis, not an execution plan."],
  }),
  componentFixture({
    component_id: "component:falsify",
    title: "Search for a bounded falsifier",
    summary:
      "Preserve a source-linked candidate for checking the composition against an invalidation condition.",
    procedural_function:
      "Expose one reviewable way the composition could be wrong.",
    applicability_condition:
      "The candidate effect can be contradicted by a bounded observation.",
    source_ref_ids: [strategicTransferSource.source_ref_id],
    expected_effect:
      "Increase the visibility of a possible regression before later comparison.",
    falsifier:
      "The proposed invalidation condition cannot distinguish the composition from its baseline.",
    uncertainty: ["Strategic transfer provenance does not establish benefit."],
    limitations: ["The transfer item remains a non-authoritative hypothesis."],
    provenance_relations: [
      {
        source_ref_id: strategicTransferSource.source_ref_id,
        relation_kind: "strategic_advantage_transfer_hypothesis",
        accepted_component: false,
        verified_benefit: false,
        causal_evidence: false,
        product_promotion: false,
      },
    ],
  }),
  componentFixture({
    component_id: "component:verify",
    title: "Verify the exact boundary",
    summary:
      "Check the bounded source, cutoff, and authority-negative result before any later evaluation.",
    procedural_function:
      "Keep verification distinct from construction and expected effect.",
    applicability_condition:
      "The case has exact source and cutoff bindings to validate.",
    source_ref_ids: [verificationSource.source_ref_id],
    expected_effect:
      "Make unsupported or stale construction material visible.",
    falsifier:
      "The check cannot identify a source, cutoff, or authority violation.",
    uncertainty: ["Passing conformance does not demonstrate usefulness."],
    limitations: ["Verification design is not verified benefit."],
    provenance_relations: [
      {
        source_ref_id: verificationSource.source_ref_id,
        relation_kind: "accepted_semantic_source",
        accepted_component: false,
        verified_benefit: false,
        causal_evidence: false,
        product_promotion: false,
      },
    ],
  }),
];

export const strategyCompositionDevelopmentInputFixture = deepFreeze({
  case_binding: {
    workspace_id: workspaceId,
    project_id: projectId,
    case_key: "case:development-composition",
    task_family_key: "task-family:repository-change",
    construction_cutoff: developmentCutoff,
    synthetic: true,
  },
  source_refs: [
    verificationSource,
    strategicTransferSource,
    assessmentSource,
  ],
  components: developmentComponents,
  role_bindings: [
    {
      role: "verification",
      component_id: "component:verify",
      rationale: "The component checks exact source and cutoff boundaries.",
      actor_identity_included: false,
    },
    {
      role: "planning",
      component_id: "component:decompose",
      rationale: "The component structures the composition hypothesis.",
      actor_identity_included: false,
    },
    {
      role: "falsification",
      component_id: "component:falsify",
      rationale: "The component preserves an explicit invalidation path.",
      actor_identity_included: false,
    },
  ],
  relations: [
    {
      relation_kind: "depends_on",
      subject_component_id: "component:verify",
      object_component_id: "component:falsify",
    },
    {
      relation_kind: "must_precede",
      subject_component_id: "component:decompose",
      object_component_id: "component:falsify",
    },
    {
      relation_kind: "must_precede",
      subject_component_id: "component:decompose",
      object_component_id: "component:falsify",
    },
  ],
  evaluation_design: {
    design_version: STRATEGY_COMPOSITION_EVALUATION_DESIGN_VERSION_V01,
    case_role: "development",
    baseline_case: createStrategyCompositionCaseReferenceV01(
      strategyCompositionBaselineCaseFixture,
    ),
    superiority_claimed: false,
  },
  limitations: [
    "The composition is an offline research hypothesis only.",
    "No outcome, ranking, or superiority comparison exists.",
  ],
  missingness: ["Later matched comparison outcomes are unavailable."],
} satisfies BuildStrategyCompositionCaseInputV01);

export const strategyCompositionDevelopmentCaseFixture =
  buildStrategyCompositionCaseV01(strategyCompositionDevelopmentInputFixture);

const holdoutWithheldSource = sourceFixture({
  source_ref_id: "source:holdout-withheld",
  source_kind: "synthetic_fixture",
  source_use: "withheld_holdout",
  source_id: "fixture:holdout-hidden-material",
  fingerprint_character: "5",
  observed_at: "2026-08-04T00:00:00.000Z",
  available_at: "2026-08-04T00:00:00.000Z",
  epistemic_status: "observed",
});
const holdoutOutcomeSource = sourceFixture({
  source_ref_id: "source:holdout-outcome",
  source_kind: "evaluation_outcome",
  source_use: "evaluation_outcome",
  source_id: "outcome:holdout-evaluation",
  fingerprint_character: "6",
  observed_at: "2026-08-07T00:00:00.000Z",
  available_at: "2026-08-07T00:00:00.000Z",
  epistemic_status: "observed",
});

export const strategyCompositionHoldoutInputFixture = deepFreeze({
  case_binding: {
    workspace_id: workspaceId,
    project_id: projectId,
    case_key: "case:holdout-recombination",
    task_family_key: "task-family:holdout-review",
    construction_cutoff: "2026-08-06T00:00:00.000Z",
    synthetic: true,
  },
  source_refs: [
    ...strategyCompositionDevelopmentCaseFixture.source_refs,
    holdoutWithheldSource,
    holdoutOutcomeSource,
  ],
  components: strategyCompositionDevelopmentCaseFixture.components,
  role_bindings: [
    {
      role: "decomposition",
      component_id: "component:decompose",
      rationale: "The holdout recombination uses decomposition as an explicit slot.",
      actor_identity_included: false,
    },
    {
      role: "verification",
      component_id: "component:falsify",
      rationale: "The holdout recombination tests a different role assignment.",
      actor_identity_included: false,
    },
    {
      role: "synthesis",
      component_id: "component:verify",
      rationale: "The final bounded check is placed in the synthesis slot.",
      actor_identity_included: false,
    },
  ],
  relations: [
    {
      relation_kind: "must_precede",
      subject_component_id: "component:decompose",
      object_component_id: "component:verify",
    },
    {
      relation_kind: "depends_on",
      subject_component_id: "component:falsify",
      object_component_id: "component:decompose",
    },
  ],
  evaluation_design: {
    design_version: STRATEGY_COMPOSITION_EVALUATION_DESIGN_VERSION_V01,
    case_role: "holdout",
    baseline_case: createStrategyCompositionCaseReferenceV01(
      strategyCompositionBaselineCaseFixture,
    ),
    parent_development_case: createStrategyCompositionCaseReferenceV01(
      strategyCompositionDevelopmentCaseFixture,
    ),
    development_task_family_key:
      strategyCompositionDevelopmentCaseFixture.case_binding.task_family_key,
    holdout_task_family_key: "task-family:holdout-review",
    frozen_cutoff: "2026-08-06T00:00:00.000Z",
    withheld_source_ref_ids: [holdoutWithheldSource.source_ref_id],
    evaluation_outcome_source_ref_ids: [holdoutOutcomeSource.source_ref_id],
    development_outcome_included: false,
    holdout_success_claimed: false,
    superiority_claimed: false,
  },
  limitations: [
    "The holdout fixture demonstrates recombination design, not successful performance.",
  ],
  missingness: ["No matched holdout outcome comparison is performed."],
} satisfies BuildStrategyCompositionCaseInputV01);

export const strategyCompositionHoldoutCaseFixture =
  buildStrategyCompositionCaseV01(strategyCompositionHoldoutInputFixture);

export const strategyCompositionAblationCaseFixture =
  buildStrategyCompositionAblationCaseV01({
    parent_case: strategyCompositionDevelopmentCaseFixture,
    case_key: "case:ablation-remove-falsification-role",
    target: {
      target_kind: "role_binding",
      role: "falsification",
      component_id: "component:falsify",
    },
  });

const adverseAssociationSource = sourceFixture({
  source_ref_id: "source:adverse-association",
  source_kind: "other_source",
  source_use: "adverse_association",
  source_id: "association:different-task-family",
  fingerprint_character: "7",
  observed_at: "2026-08-07T00:00:00.000Z",
  available_at: "2026-08-07T00:00:00.000Z",
  epistemic_status: "observed",
});

export const strategyCompositionNegativeTransferInputFixture = deepFreeze({
  case_binding: {
    workspace_id: workspaceId,
    project_id: projectId,
    case_key: "case:negative-transfer-risk",
    task_family_key: "task-family:time-critical-response",
    construction_cutoff: "2026-08-08T00:00:00.000Z",
    synthetic: true,
  },
  source_refs: [strategicTransferSource, adverseAssociationSource],
  components: [
    developmentComponents.find(
      (component) => component.component_id === "component:falsify",
    )!,
  ],
  role_bindings: [
    {
      role: "verification",
      component_id: "component:falsify",
      rationale:
        "The different task family preserves the candidate while exposing transfer risk.",
      actor_identity_included: false,
    },
  ],
  relations: [],
  evaluation_design: {
    design_version: STRATEGY_COMPOSITION_EVALUATION_DESIGN_VERSION_V01,
    case_role: "negative_transfer",
    baseline_case: createStrategyCompositionCaseReferenceV01(
      strategyCompositionBaselineCaseFixture,
    ),
    origin_case: createStrategyCompositionCaseReferenceV01(
      strategyCompositionDevelopmentCaseFixture,
    ),
    origin_task_family_key: "task-family:repository-change",
    target_task_family_key: "task-family:time-critical-response",
    transfer_hypothesis_source_ref_ids: [strategicTransferSource.source_ref_id],
    adverse_association_source_ref_ids: [adverseAssociationSource.source_ref_id],
    observed_adverse_association: "supplied",
    negative_transfer_candidate: true,
    causal_negative_contribution_claimed: false,
    general_harm_claimed: false,
    superiority_claimed: false,
  },
  limitations: [
    "One adverse association does not establish general harm or causal contribution.",
  ],
  missingness: ["Matched negative-transfer intervention evidence is unavailable."],
} satisfies BuildStrategyCompositionCaseInputV01);

export const strategyCompositionNegativeTransferCaseFixture =
  buildStrategyCompositionCaseV01(
    strategyCompositionNegativeTransferInputFixture,
  );

export const strategyCompositionAblationInputFixture = deepFreeze(
  caseBuilderInputFromCase(strategyCompositionAblationCaseFixture),
);

export interface InvalidStrategyCompositionCaseFixtureV01 {
  name: string;
  expected_code: string;
  input: BuildStrategyCompositionCaseInputV01;
}

export const invalidStrategyCompositionCaseFixtureCasesV01: InvalidStrategyCompositionCaseFixtureV01[] = [
  invalidFixture("duplicate_component_id", "strategy_composition_duplicate_component_id", (input) => {
    input.components.push(clone(input.components[0]!));
  }),
  invalidFixture("dangling_role_binding", "strategy_composition_dangling_component_ref", (input) => {
    input.role_bindings[0]!.component_id = "component:missing";
  }),
  invalidFixture("dangling_relation", "strategy_composition_dangling_component_ref", (input) => {
    input.relations[0]!.object_component_id = "component:missing";
  }),
  invalidFixture("self_edge", "strategy_composition_self_edge", (input) => {
    input.relations[0]!.object_component_id = input.relations[0]!.subject_component_id;
  }),
  invalidFixture("dependency_cycle", "strategy_composition_relation_cycle", (input) => {
    input.relations.push({
      relation_kind: "must_precede",
      subject_component_id: "component:verify",
      object_component_id: "component:decompose",
    });
  }),
  invalidFixture("conflicting_role_binding", "strategy_composition_conflicting_role_binding", (input) => {
    input.role_bindings.push({
      role: "verification",
      component_id: "component:decompose",
      rationale: "A second component cannot occupy the exact same case-local role.",
      actor_identity_included: false,
    });
  }),
  invalidFixture("malformed_source_ref", "strategy_composition_id_invalid", (input) => {
    input.source_refs[0]!.source_ref_id = "bad source ref";
  }),
  invalidFixture("malformed_fingerprint", "strategy_composition_source_fingerprint_invalid", (input) => {
    input.source_refs[0]!.source_fingerprint = "sha256:bad";
  }),
  invalidFixture("malformed_timestamp", "strategy_composition_timestamp_invalid", (input) => {
    input.source_refs[0]!.available_at = "not-a-timestamp";
  }),
  invalidFixture("cross_project_source", "strategy_composition_workspace_project_mismatch", (input) => {
    input.source_refs[0]!.project_id = "project:other";
  }),
  invalidFixture("cross_project_case_reference", "strategy_composition_case_reference_scope_mismatch", (input) => {
    if (input.evaluation_design.case_role === "development") {
      input.evaluation_design.baseline_case.project_id = "project:other";
    }
  }),
  invalidFixture("post_cutoff_construction_source", "strategy_composition_post_cutoff_construction_source", (input) => {
    input.source_refs[0]!.observed_at = "2026-08-06T00:00:00.000Z";
    input.source_refs[0]!.available_at = "2026-08-06T00:00:00.000Z";
  }),
  invalidHoldoutFixture("holdout_leakage", "strategy_composition_component_source_leakage", (input) => {
    input.components[0]!.source_ref_ids = [holdoutWithheldSource.source_ref_id];
  }),
  invalidHoldoutFixture("holdout_identity_contamination", "strategy_composition_holdout_identity_contamination", (input) => {
    if (input.evaluation_design.case_role === "holdout") {
      input.evaluation_design.holdout_task_family_key =
        input.evaluation_design.development_task_family_key;
      input.case_binding.task_family_key =
        input.evaluation_design.development_task_family_key;
    }
  }),
  invalidAblationFixture("multi_target_ablation", "strategy_composition_ablation_target_count_invalid", (input) => {
    if (input.evaluation_design.case_role === "ablation") {
      input.evaluation_design.targets.push({
        target_kind: "relation",
        relation_kind: "must_precede",
        subject_component_id: "component:decompose",
        object_component_id: "component:falsify",
      });
    }
  }),
  invalidFixture("actor_identity", "strategy_composition_actor_identity_forbidden", (input) => {
    (input.components[0] as unknown as Record<string, unknown>).actor_identity =
      "actor:forbidden";
  }),
  invalidFixture("accepted_field", "strategy_composition_authority_field_forbidden", (input) => {
    (input.components[0] as unknown as Record<string, unknown>).accepted = true;
  }),
  invalidFixture("promoted_field", "strategy_composition_authority_field_forbidden", (input) => {
    (input as unknown as Record<string, unknown>).promoted_component = true;
  }),
  invalidFixture("winner_field", "strategy_composition_authority_field_forbidden", (input) => {
    (input as unknown as Record<string, unknown>).winner = "component:verify";
  }),
  invalidFixture("scalar_fitness", "strategy_composition_scalar_field_forbidden", (input) => {
    (input as unknown as Record<string, unknown>).fitness_score = 0.9;
  }),
  invalidFixture("scalar_quality", "strategy_composition_scalar_field_forbidden", (input) => {
    (input.components[0] as unknown as Record<string, unknown>).quality = 1;
  }),
  invalidFixture("raw_prompt", "strategy_composition_material_refused:raw_prompt_shaped_field", (input) => {
    (input as unknown as Record<string, unknown>).raw_prompt = "forbidden";
  }),
  invalidFixture("raw_transcript", "strategy_composition_material_refused:raw_transcript_shaped_field", (input) => {
    (input as unknown as Record<string, unknown>).transcript = "forbidden";
  }),
  invalidFixture("raw_provider_output", "strategy_composition_material_refused:raw_provider_output_shaped_field", (input) => {
    (input as unknown as Record<string, unknown>).raw_provider_output = "forbidden";
  }),
  invalidFixture("raw_terminal_output", "strategy_composition_material_refused:raw_terminal_log_shaped_field", (input) => {
    (input as unknown as Record<string, unknown>).terminal_log = "forbidden";
  }),
  invalidFixture("hidden_reasoning", "strategy_composition_material_refused:hidden_reasoning_shaped_field", (input) => {
    (input as unknown as Record<string, unknown>).hidden_reasoning = "forbidden";
  }),
  invalidFixture("secret", "strategy_composition_material_refused:secret_shaped_material", (input) => {
    input.limitations = ["OPENAI_API_KEY=sk-proj-abcdefghijklmnopqrstuvwxyz"];
  }),
  invalidFixture("private_absolute_path", "strategy_composition_material_refused:private_absolute_path", (input) => {
    input.limitations = ["/Users/private/casebook.json"];
  }),
  invalidFixture("unknown_field", "strategy_composition_unknown_field", (input) => {
    (input.components[0] as unknown as Record<string, unknown>).extra = "forbidden";
  }),
  invalidFixture("component_bound", "strategy_composition_collection_bound_exceeded", (input) => {
    input.components = Array.from({ length: 25 }, (_, index) => ({
      ...clone(input.components[index % input.components.length]!),
      component_id: `component:bounded-${index}`,
    }));
    input.role_bindings = [];
    input.relations = [];
  }),
  invalidFixture("text_bound", "strategy_composition_text_bound_exceeded", (input) => {
    input.components[0]!.summary = "x".repeat(1601);
  }),
];

export function reorderedStrategyCompositionDevelopmentInputFixture() {
  const input = clone(strategyCompositionDevelopmentInputFixture);
  input.source_refs.reverse();
  input.components.reverse();
  input.role_bindings.reverse();
  input.relations.reverse();
  input.components.forEach((component) => {
    component.source_ref_ids.reverse();
    component.uncertainty.reverse();
    component.limitations.reverse();
    component.provenance_relations.reverse();
  });
  input.limitations.reverse();
  input.missingness.reverse();
  return input;
}

function invalidFixture(
  name: string,
  expectedCode: string,
  mutate: (input: BuildStrategyCompositionCaseInputV01) => void,
): InvalidStrategyCompositionCaseFixtureV01 {
  const input = clone(strategyCompositionDevelopmentInputFixture);
  mutate(input);
  return { name, expected_code: expectedCode, input };
}

function invalidHoldoutFixture(
  name: string,
  expectedCode: string,
  mutate: (input: BuildStrategyCompositionCaseInputV01) => void,
): InvalidStrategyCompositionCaseFixtureV01 {
  const input = clone(strategyCompositionHoldoutInputFixture);
  mutate(input);
  return { name, expected_code: expectedCode, input };
}

function invalidAblationFixture(
  name: string,
  expectedCode: string,
  mutate: (input: BuildStrategyCompositionCaseInputV01) => void,
): InvalidStrategyCompositionCaseFixtureV01 {
  const input = clone(strategyCompositionAblationInputFixture);
  mutate(input);
  return { name, expected_code: expectedCode, input };
}

function caseBuilderInputFromCase(
  value: ReturnType<typeof buildStrategyCompositionCaseV01>,
): BuildStrategyCompositionCaseInputV01 {
  return {
    case_binding: clone(value.case_binding),
    source_refs: clone(value.source_refs),
    components: clone(value.components),
    role_bindings: clone(value.role_bindings),
    relations: clone(value.relations),
    evaluation_design: clone(value.evaluation_design),
    limitations: clone(value.limitations),
    missingness: clone(value.missingness),
  };
}

function componentFixture(
  input: Omit<
    BuildStrategyCompositionCaseInputV01["components"][number],
    "provenance_relations" | "accepted_strategy"
  > & {
    provenance_relations?: BuildStrategyCompositionCaseInputV01["components"][number]["provenance_relations"];
  },
) {
  return {
    ...input,
    provenance_relations: input.provenance_relations ?? [],
    accepted_strategy: false as const,
  };
}

function sourceFixture(input: {
  source_ref_id: string;
  source_kind: BuildStrategyCompositionCaseInputV01["source_refs"][number]["source_kind"];
  source_use: BuildStrategyCompositionCaseInputV01["source_refs"][number]["source_use"];
  source_id: string;
  fingerprint_character: string;
  observed_at: string;
  available_at: string;
  epistemic_status: BuildStrategyCompositionCaseInputV01["source_refs"][number]["epistemic_status"];
}) {
  return {
    source_ref_id: input.source_ref_id,
    source_kind: input.source_kind,
    source_use: input.source_use,
    workspace_id: workspaceId,
    project_id: projectId,
    source_id: input.source_id,
    source_fingerprint: `sha256:${input.fingerprint_character.repeat(64)}`,
    observed_at: input.observed_at,
    available_at: input.available_at,
    epistemic_status: input.epistemic_status,
  };
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value as Record<string, unknown>)) {
      deepFreeze(child);
    }
  }
  return value;
}
