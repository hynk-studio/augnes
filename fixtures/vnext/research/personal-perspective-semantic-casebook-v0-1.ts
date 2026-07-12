import {
  PERSONAL_PERSPECTIVE_AUTHORITY_FLAGS_V01,
  PERSONAL_PERSPECTIVE_CASEBOOK_BOUNDS_V01,
  PERSONAL_PERSPECTIVE_DELETED_REUSE_REFUSAL_CASE_KEY_V01,
  PERSONAL_PERSPECTIVE_DELETED_REUSE_REFUSAL_LIMITATION_V01,
  PERSONAL_PERSPECTIVE_DELETED_REUSE_REFUSAL_RATIONALE_V01,
  PERSONAL_PERSPECTIVE_DELETED_REUSE_REFUSAL_SUMMARY_V01,
  PERSONAL_PERSPECTIVE_DELETED_REUSE_REFUSAL_TITLE_V01,
  PERSONAL_PERSPECTIVE_DELETION_SOURCE_KEY_V01,
  PERSONAL_PERSPECTIVE_DELETION_SOURCE_SCOPE_QUALIFIER_V01,
  PERSONAL_PERSPECTIVE_DELETION_SOURCE_SUMMARY_V01,
  PERSONAL_PERSPECTIVE_DELETION_REVIEW_ACTIONS_V01,
  PERSONAL_PERSPECTIVE_FUTURE_REVIEW_ACTIONS_V01,
  PERSONAL_PERSPECTIVE_NOT_APPLICABLE_JUSTIFICATION_V01,
  PERSONAL_PERSPECTIVE_TOMBSTONE_LIMITATION_V01,
  PERSONAL_PERSPECTIVE_TOMBSTONE_CASE_KEY_V01,
  PERSONAL_PERSPECTIVE_TOMBSTONE_RATIONALE_V01,
  PERSONAL_PERSPECTIVE_TOMBSTONE_REF_V01,
  PERSONAL_PERSPECTIVE_TOMBSTONE_SCOPE_QUALIFIER_V01,
  PERSONAL_PERSPECTIVE_TOMBSTONE_SUMMARY_V01,
  PERSONAL_PERSPECTIVE_TOMBSTONE_TITLE_V01,
  PERSONAL_PERSPECTIVE_REQUIRED_COVERAGE_V01,
  clone,
  resignPersonalPerspectiveSemanticCasebookV01,
  type PersonalPerspectiveCaseSeedV01,
  type PersonalPerspectiveScopeKindV01,
  type PersonalPerspectiveScopeV01,
  type PersonalPerspectiveSemanticCasebookSeedV01,
  type PersonalPerspectiveSemanticCasebookV01,
  type PersonalPerspectiveSourceSeedV01,
} from "@/scripts/lib/personal-perspective-semantic-casebook-v0-1";

function scope(
  kind: PersonalPerspectiveScopeKindV01,
  qualifier: string,
  extra: Partial<PersonalPerspectiveScopeV01> = {},
): PersonalPerspectiveScopeV01 {
  return {
    kind,
    qualifiers: [qualifier],
    project_scope_ref: null,
    valid_from: null,
    valid_until: null,
    ambiguous: false,
    sharing_outside_scope_authorized: false,
    ...extra,
  };
}

function source(
  source_key: string,
  source_kind: PersonalPerspectiveSourceSeedV01["source_kind"],
  summary: string,
  sourceScope = scope("workspace_conceptual", "fictional-workspace-concept"),
): PersonalPerspectiveSourceSeedV01 {
  return { source_key, source_kind, summary, scope: sourceScope };
}

function counterexample(
  status: PersonalPerspectiveCaseSeedV01["counterexample"]["status"],
  options: Partial<PersonalPerspectiveCaseSeedV01["counterexample"]> = {},
): PersonalPerspectiveCaseSeedV01["counterexample"] {
  const defaults: Record<
    PersonalPerspectiveCaseSeedV01["counterexample"]["status"],
    PersonalPerspectiveCaseSeedV01["counterexample"]
  > = {
    known_present: {
      status: "known_present",
      source_keys: ["counterexample-alpha"],
      search_summary: null,
      justification: null,
      search_completed: true,
      completeness_claimed: false,
      impossibility_claimed: false,
    },
    none_found: {
      status: "none_found",
      source_keys: [],
      search_summary:
        "A bounded review of the named fictional sources found no counterexample; the result remains revisable.",
      justification: null,
      search_completed: true,
      completeness_claimed: false,
      impossibility_claimed: false,
    },
    not_searched: {
      status: "not_searched",
      source_keys: [],
      search_summary: null,
      justification: null,
      search_completed: false,
      completeness_claimed: false,
      impossibility_claimed: false,
    },
    not_applicable: {
      status: "not_applicable",
      source_keys: [],
      search_summary: null,
      justification: PERSONAL_PERSPECTIVE_NOT_APPLICABLE_JUSTIFICATION_V01,
      search_completed: false,
      completeness_claimed: false,
      impossibility_claimed: false,
    },
  };
  return { ...defaults[status], ...options, status };
}

function candidate(
  case_key: string,
  semantic_kind: PersonalPerspectiveCaseSeedV01["semantic_kind"],
  summary: string,
  sourceKey: string,
  options: Partial<PersonalPerspectiveCaseSeedV01> = {},
): PersonalPerspectiveCaseSeedV01 {
  return {
    case_key,
    case_type: "candidate",
    title: `Synthetic ${case_key.replaceAll("-", " ")}`,
    summary,
    proposition: summary,
    tombstone_ref: null,
    semantic_kind,
    epistemic_origin: "explicit_synthetic_user_declaration",
    scope: scope("workspace_conceptual", "fictional-workspace-concept"),
    source_relations: [{ source_key: sourceKey, relation: "supports" }],
    case_relations: [],
    counterexample: counterexample("not_searched"),
    candidate_status: "candidate",
    refusal_kind: null,
    rationale:
      "The fictional material is retained only as a scoped, revisable, review-required semantic candidate.",
    limitations: [
      "Synthetic fixture meaning does not establish an actual user's identity, endorsement, or behavior.",
    ],
    future_review_actions: [
      "endorse",
      "correct",
      "narrow_scope",
      "add_exception",
      "add_counterexample",
      "defer",
      "reject",
    ],
    reuse_eligibility: "review_required",
    synthetic_content_retained: true,
    ...options,
  };
}

function refusal(
  case_key: string,
  refusal_kind: NonNullable<PersonalPerspectiveCaseSeedV01["refusal_kind"]>,
  summary: string,
  sourceKey: string,
  sourceRelation: PersonalPerspectiveCaseSeedV01["source_relations"][number]["relation"] =
    "derived_from",
): PersonalPerspectiveCaseSeedV01 {
  const caseSeed: PersonalPerspectiveCaseSeedV01 = {
    case_key,
    case_type: "refusal",
    title: `Synthetic ${case_key.replaceAll("-", " ")}`,
    summary,
    proposition: null,
    tombstone_ref: null,
    semantic_kind: "refusal_material",
    epistemic_origin: "derived_interpretation",
    scope: scope("situational", "fictional-refusal-situation"),
    source_relations: [{ source_key: sourceKey, relation: sourceRelation }],
    case_relations: [],
    counterexample: counterexample("not_applicable"),
    candidate_status: null,
    refusal_kind,
    rationale:
      "The fictional input is represented only as refusal or correction material and is not normalized into a candidate.",
    limitations: [
      "This refusal demonstrates deterministic semantics only and records no completed user decision.",
    ],
    future_review_actions: [
      "correct",
      "narrow_scope",
      "defer",
      "reject",
      "inspect_source_and_revision_lineage",
    ],
    reuse_eligibility: "prohibited",
    synthetic_content_retained: false,
  };
  if (refusal_kind === "deleted_item_reuse") {
    caseSeed.title = PERSONAL_PERSPECTIVE_DELETED_REUSE_REFUSAL_TITLE_V01;
    caseSeed.summary = PERSONAL_PERSPECTIVE_DELETED_REUSE_REFUSAL_SUMMARY_V01;
    caseSeed.rationale =
      PERSONAL_PERSPECTIVE_DELETED_REUSE_REFUSAL_RATIONALE_V01;
    caseSeed.limitations = [
      PERSONAL_PERSPECTIVE_DELETED_REUSE_REFUSAL_LIMITATION_V01,
    ];
    caseSeed.future_review_actions = [
      ...PERSONAL_PERSPECTIVE_DELETION_REVIEW_ACTIONS_V01,
    ];
  }
  return caseSeed;
}

const sources: PersonalPerspectiveSourceSeedV01[] = [
  source(
    "declaration-descriptive",
    "synthetic_user_declaration",
    "A fictional declaration describes a preference for pausing before a bounded decision without claiming global identity.",
  ),
  source(
    "declaration-aspiration",
    "synthetic_user_declaration",
    "A fictional declaration states an aspiration to become more deliberate without asserting current behavior.",
  ),
  source(
    "declaration-commitment-a",
    "synthetic_user_declaration",
    "A fictional declaration names care for completeness as one scoped commitment.",
  ),
  source(
    "declaration-commitment-b",
    "synthetic_user_declaration",
    "A fictional declaration names timely delivery as another scoped commitment.",
  ),
  source(
    "declaration-principle",
    "synthetic_user_declaration",
    "A fictional declaration proposes checking reversibility as a revisable decision principle.",
  ),
  source(
    "joint-interpretation-alpha",
    "synthetic_joint_interpretation",
    "A fictional joint interpretation proposes a recurring disposition candidate and requires review.",
  ),
  source(
    "joint-context-alpha",
    "synthetic_contextual_fact",
    "A fictional contextual source supplies a second bounded basis for joint interpretation.",
  ),
  source(
    "model-inference-alpha",
    "synthetic_model_inference",
    "A fictional model inference proposes a recurring pattern and remains candidate-only.",
  ),
  source(
    "behavior-task-choice",
    "synthetic_behavior_observation",
    "A fictional task observation records one choice within one task and contains no personality conclusion.",
    scope("task_specific", "fictional-task-a"),
  ),
  source(
    "world-context-alpha",
    "synthetic_contextual_fact",
    "A fictional contextual source supports a bounded and revisable world-model candidate.",
    scope("situational", "fictional-situation-a"),
  ),
  source(
    "declaration-role-alpha",
    "synthetic_user_declaration",
    "A fictional declaration describes behavior only within fictional-role-a.",
    scope("role_specific", "fictional-role-a"),
  ),
  source(
    "declaration-relationship-alpha",
    "synthetic_user_declaration",
    "A fictional declaration describes one pattern only inside fictional-relationship-a.",
    scope("relationship_specific", "fictional-relationship-a"),
  ),
  source(
    "scope-project-alpha",
    "synthetic_scope_constraint",
    "A fictional scope constraint narrows a broader candidate only for one synthetic project scope.",
    scope("project_specific", "fictional-project-a", {
      project_scope_ref: "synthetic-project-scope:fictional-a",
    }),
  ),
  source(
    "counterexample-alpha",
    "synthetic_counterexample",
    "A fictional counterexample records one bounded situation where the broader pattern did not appear.",
    scope("exception", "fictional-exception-a"),
  ),
  source(
    "contest-alpha",
    "synthetic_joint_interpretation",
    "A fictional interpretation contests whether a recurring pattern has the proposed meaning.",
  ),
  source(
    "declaration-stale",
    "synthetic_user_declaration",
    "A fictional declaration is intentionally marked stale pending re-evaluation.",
    scope("time_bounded", "fictional-time-window-a", {
      valid_from: "2025-01-01T00:00:00.000Z",
      valid_until: "2025-12-31T23:59:59.000Z",
    }),
  ),
  source(
    "retraction-alpha",
    "synthetic_retraction_instruction",
    "A fictional retraction instruction preserves only bounded synthetic lineage and prohibits reuse.",
  ),
  source(
    PERSONAL_PERSPECTIVE_DELETION_SOURCE_KEY_V01,
    "synthetic_deletion_instruction",
    PERSONAL_PERSPECTIVE_DELETION_SOURCE_SUMMARY_V01,
    scope(
      "workspace_conceptual",
      PERSONAL_PERSPECTIVE_DELETION_SOURCE_SCOPE_QUALIFIER_V01,
    ),
  ),
  source(
    "false-premise-alpha",
    "synthetic_false_premise",
    "A fictional false premise is retained only so deterministic refusal can be validated.",
  ),
  source(
    "scope-overglobal-alpha",
    "synthetic_scope_constraint",
    "A fictional scope constraint rejects a workspace-global reading and permits only a narrower interpretation.",
    scope("project_specific", "fictional-project-a", {
      project_scope_ref: "synthetic-project-scope:fictional-a",
    }),
  ),
  source(
    "scope-conflict-alpha",
    "synthetic_scope_constraint",
    "A fictional scope constraint records unresolved conflict between two bounded scopes.",
  ),
];

const cases: PersonalPerspectiveCaseSeedV01[] = [
  candidate(
    "descriptive-self-understanding",
    "descriptive_self_understanding",
    "The fictional candidate describes pausing before a bounded decision in the stated scope and remains revisable.",
    "declaration-descriptive",
    { counterexample: counterexample("none_found") },
  ),
  candidate(
    "aspirational-identity",
    "aspirational_identity",
    "The fictional candidate aspires to greater deliberation and does not describe current behavior as achieved.",
    "declaration-aspiration",
  ),
  candidate(
    "commitment-completeness",
    "stable_value_or_commitment",
    "The fictional candidate values completeness while allowing tension with timely delivery and no universal behavior guarantee.",
    "declaration-commitment-a",
    {
      case_relations: [
        {
          target_case_key: "commitment-timeliness",
          relation: "contests",
          target_effect: "preserves_target",
        },
      ],
    },
  ),
  candidate(
    "commitment-timeliness",
    "stable_value_or_commitment",
    "The fictional candidate values timely delivery while allowing tension with completeness.",
    "declaration-commitment-b",
  ),
  candidate(
    "decision-principle-reversibility",
    "decision_principle",
    "The fictional candidate treats reversibility as a scoped consideration rather than an automatic policy.",
    "declaration-principle",
  ),
  candidate(
    "jointly-interpreted-candidate",
    "recurring_disposition_candidate",
    "The fictional jointly interpreted candidate remains review-required and does not become settled identity.",
    "joint-interpretation-alpha",
    {
      epistemic_origin: "jointly_interpreted_synthetic_candidate",
      source_relations: [
        { source_key: "joint-interpretation-alpha", relation: "derived_from" },
        { source_key: "joint-context-alpha", relation: "contextualizes" },
      ],
    },
  ),
  candidate(
    "model-inferred-candidate",
    "recurring_disposition_candidate",
    "The fictional model inference remains a candidate with no user-identity or task-context authority.",
    "model-inference-alpha",
    {
      epistemic_origin: "model_inferred_synthetic_candidate",
      source_relations: [
        { source_key: "model-inference-alpha", relation: "derived_from" },
      ],
    },
  ),
  candidate(
    "task-choice-observation",
    "behavior_observation",
    "The fictional source records one task choice only and refuses any global identity inference.",
    "behavior-task-choice",
    {
      epistemic_origin: "observed_synthetic_behavior",
      scope: scope("task_specific", "fictional-task-a"),
      source_relations: [
        { source_key: "behavior-task-choice", relation: "observes" },
      ],
      counterexample: counterexample("not_applicable"),
    },
  ),
  candidate(
    "behavior-pattern-interpretation",
    "behavioral_pattern_interpretation",
    "The fictional interpretation is separate from the observed task choice and remains a candidate.",
    "behavior-task-choice",
    {
      epistemic_origin: "derived_interpretation",
      scope: scope("task_specific", "fictional-task-a"),
      source_relations: [
        { source_key: "behavior-task-choice", relation: "derived_from" },
      ],
      case_relations: [
        {
          target_case_key: "task-choice-observation",
          relation: "interprets",
          target_effect: "preserves_target",
        },
      ],
    },
  ),
  candidate(
    "world-model-candidate",
    "world_model_candidate",
    "The fictional world-model candidate is source-backed, situational, and revisable.",
    "world-context-alpha",
    {
      epistemic_origin: "derived_interpretation",
      scope: scope("situational", "fictional-situation-a"),
      source_relations: [
        { source_key: "world-context-alpha", relation: "derived_from" },
      ],
      counterexample: counterexample("none_found"),
    },
  ),
  candidate(
    "contextual-role",
    "contextual_role",
    "The fictional candidate applies only within fictional-role-a and does not rewrite workspace-level meaning.",
    "declaration-role-alpha",
    { scope: scope("role_specific", "fictional-role-a") },
  ),
  candidate(
    "relationship-specific-candidate",
    "relationship_model_candidate",
    "The fictional candidate applies only within fictional-relationship-a and grants no sharing outside that scope.",
    "declaration-relationship-alpha",
    { scope: scope("relationship_specific", "fictional-relationship-a") },
  ),
  candidate(
    "persistent-tension",
    "persistent_tension",
    "The fictional case preserves completeness and timeliness as unresolved sides without forcing a resolution.",
    "declaration-commitment-a",
    {
      epistemic_origin: "jointly_interpreted_synthetic_candidate",
      source_relations: [
        { source_key: "declaration-commitment-a", relation: "supports" },
        { source_key: "declaration-commitment-b", relation: "supports" },
        { source_key: "joint-interpretation-alpha", relation: "derived_from" },
      ],
    },
  ),
  candidate(
    "project-scope-narrowing",
    "scope_narrowing",
    "The fictional project-specific candidate narrows the broader descriptive candidate without replacing it.",
    "scope-project-alpha",
    {
      epistemic_origin: "derived_interpretation",
      scope: scope("project_specific", "fictional-project-a", {
        project_scope_ref: "synthetic-project-scope:fictional-a",
      }),
      source_relations: [
        { source_key: "scope-project-alpha", relation: "constrains_scope" },
      ],
      case_relations: [
        {
          target_case_key: "descriptive-self-understanding",
          relation: "narrows",
          target_effect: "preserves_target",
        },
      ],
    },
  ),
  candidate(
    "known-exception",
    "known_exception",
    "The fictional exception narrows one broader recurring candidate without disproving it in every scope.",
    "counterexample-alpha",
    {
      epistemic_origin: "derived_interpretation",
      scope: scope("exception", "fictional-exception-a"),
      source_relations: [
        { source_key: "counterexample-alpha", relation: "counterexample" },
        {
          source_key: "joint-interpretation-alpha",
          relation: "derived_from",
        },
      ],
      case_relations: [
        {
          target_case_key: "jointly-interpreted-candidate",
          relation: "exception_to",
          target_effect: "preserves_target",
        },
      ],
      counterexample: counterexample("known_present"),
    },
  ),
  candidate(
    "known-present-counterexample",
    "recurring_disposition_candidate",
    "The fictional candidate preserves one exact known counterexample source and makes no exception-free claim.",
    "declaration-descriptive",
    {
      source_relations: [
        { source_key: "declaration-descriptive", relation: "supports" },
        { source_key: "counterexample-alpha", relation: "counterexample" },
      ],
      counterexample: counterexample("known_present"),
    },
  ),
  candidate(
    "counterexample-not-searched",
    "world_model_candidate",
    "The fictional candidate explicitly records that no counterexample search was performed.",
    "world-context-alpha",
    {
      epistemic_origin: "derived_interpretation",
      scope: scope("situational", "fictional-situation-a"),
      source_relations: [
        { source_key: "world-context-alpha", relation: "derived_from" },
      ],
      counterexample: counterexample("not_searched"),
    },
  ),
  candidate(
    "contested-interpretation",
    "contested_interpretation",
    "The fictional interpretation preserves disagreement and is not represented as settled truth.",
    "contest-alpha",
    {
      epistemic_origin: "jointly_interpreted_synthetic_candidate",
      candidate_status: "contested",
      source_relations: [
        { source_key: "contest-alpha", relation: "derived_from" },
        { source_key: "joint-context-alpha", relation: "contextualizes" },
      ],
      case_relations: [
        {
          target_case_key: "jointly-interpreted-candidate",
          relation: "contests",
          target_effect: "preserves_target",
        },
      ],
    },
  ),
  candidate(
    "stale-candidate",
    "descriptive_self_understanding",
    "The fictional candidate is stale and requires re-evaluation before any future use.",
    "declaration-stale",
    {
      scope: scope("time_bounded", "fictional-time-window-a", {
        valid_from: "2025-01-01T00:00:00.000Z",
        valid_until: "2025-12-31T23:59:59.000Z",
      }),
      candidate_status: "stale",
      reuse_eligibility: "re_evaluation_required",
    },
  ),
  candidate(
    "retracted-candidate",
    "descriptive_self_understanding",
    "The fictional candidate retains bounded synthetic lineage after retraction and cannot be reused or revived.",
    "retraction-alpha",
    {
      epistemic_origin: "derived_interpretation",
      source_relations: [
        { source_key: "retraction-alpha", relation: "derived_from" },
      ],
      candidate_status: "retracted",
      reuse_eligibility: "prohibited",
    },
  ),
  {
    case_key: PERSONAL_PERSPECTIVE_TOMBSTONE_CASE_KEY_V01,
    case_type: "tombstone",
    title: PERSONAL_PERSPECTIVE_TOMBSTONE_TITLE_V01,
    summary: PERSONAL_PERSPECTIVE_TOMBSTONE_SUMMARY_V01,
    proposition: null,
    tombstone_ref: PERSONAL_PERSPECTIVE_TOMBSTONE_REF_V01,
    semantic_kind: "deletion_tombstone",
    epistemic_origin: "derived_interpretation",
    scope: scope(
      "situational",
      PERSONAL_PERSPECTIVE_TOMBSTONE_SCOPE_QUALIFIER_V01,
    ),
    source_relations: [
      {
        source_key: PERSONAL_PERSPECTIVE_DELETION_SOURCE_KEY_V01,
        relation: "derived_from",
      },
    ],
    case_relations: [],
    counterexample: counterexample("not_applicable"),
    candidate_status: "deleted",
    refusal_kind: null,
    rationale: PERSONAL_PERSPECTIVE_TOMBSTONE_RATIONALE_V01,
    limitations: [PERSONAL_PERSPECTIVE_TOMBSTONE_LIMITATION_V01],
    future_review_actions: [
      ...PERSONAL_PERSPECTIVE_DELETION_REVIEW_ACTIONS_V01,
    ],
    reuse_eligibility: "prohibited",
    synthetic_content_retained: false,
  },
  refusal(
    "false-premise-refusal",
    "false_premise",
    "The fictional false premise is refused and never becomes an identity candidate.",
    "false-premise-alpha",
  ),
  refusal(
    "over-globalization-refusal",
    "over_globalization",
    "The fictional workspace-global claim is refused while a separate project-scoped narrowing remains reviewable.",
    "scope-overglobal-alpha",
    "constrains_scope",
  ),
  refusal(
    "task-choice-globalization-refusal",
    "task_choice_globalization",
    "The fictional one-task choice cannot establish a stable or global identity.",
    "behavior-task-choice",
  ),
  candidate(
    "counterexample-driven-revision",
    "revision_candidate",
    "The fictional revision remains traceable to the broader candidate and its counterexample and is not automatically applied.",
    "counterexample-alpha",
    {
      epistemic_origin: "derived_interpretation",
      source_relations: [
        { source_key: "counterexample-alpha", relation: "counterexample" },
        { source_key: "joint-interpretation-alpha", relation: "derived_from" },
      ],
      case_relations: [
        {
          target_case_key: "jointly-interpreted-candidate",
          relation: "revises",
          target_effect: "preserves_target",
        },
      ],
      counterexample: counterexample("known_present"),
    },
  ),
  refusal(
    PERSONAL_PERSPECTIVE_DELETED_REUSE_REFUSAL_CASE_KEY_V01,
    "deleted_item_reuse",
    PERSONAL_PERSPECTIVE_DELETED_REUSE_REFUSAL_SUMMARY_V01,
    PERSONAL_PERSPECTIVE_DELETION_SOURCE_KEY_V01,
  ),
  refusal(
    "retracted-item-reuse-refusal",
    "retracted_item_reuse",
    "The fictional retracted item cannot be selected or automatically revived.",
    "retraction-alpha",
  ),
  refusal(
    "insufficient-source-refusal",
    "insufficient_source",
    "The fictional material is refused because its bounded source cannot support candidate admission.",
    "scope-conflict-alpha",
    "constrains_scope",
  ),
  refusal(
    "scope-conflict-refusal",
    "scope_conflict",
    "The fictional scope conflict remains refusal material instead of a silent higher-scope rewrite.",
    "scope-conflict-alpha",
    "constrains_scope",
  ),
];

const coverageCaseKeys: Record<
  (typeof PERSONAL_PERSPECTIVE_REQUIRED_COVERAGE_V01)[number],
  string[]
> = {
  P01_descriptive_self_understanding: ["descriptive-self-understanding"],
  P02_aspirational_identity: ["aspirational-identity"],
  P03_stable_value_or_commitment: ["commitment-completeness", "persistent-tension"],
  P04_decision_principle: ["decision-principle-reversibility"],
  P05_jointly_interpreted_candidate: ["jointly-interpreted-candidate"],
  P06_model_inferred_candidate: ["model-inferred-candidate"],
  P07_observed_behavior_separated_from_interpretation: [
    "task-choice-observation",
    "behavior-pattern-interpretation",
  ],
  P08_world_model_candidate: ["world-model-candidate"],
  P09_contextual_role: ["contextual-role"],
  P10_relationship_specific_candidate: ["relationship-specific-candidate"],
  P11_persistent_tension: ["persistent-tension"],
  P12_project_specific_scope_narrowing: ["project-scope-narrowing"],
  P13_known_exception: ["known-exception"],
  P14_known_present_counterexample: ["known-present-counterexample"],
  P15_none_found_counterexample: ["world-model-candidate"],
  P16_not_searched_counterexample: ["counterexample-not-searched"],
  P17_valid_not_applicable_counterexample: ["task-choice-observation"],
  P18_contested_interpretation: ["contested-interpretation"],
  P19_stale_candidate: ["stale-candidate"],
  P20_retracted_candidate: ["retracted-candidate"],
  P21_deleted_item_tombstone: ["deleted-item-tombstone"],
  P22_false_premise_refusal: ["false-premise-refusal"],
  P23_over_globalization_correction: [
    "over-globalization-refusal",
    "project-scope-narrowing",
  ],
  P24_task_choice_observation_only: [
    "task-choice-observation",
    "task-choice-globalization-refusal",
  ],
  P25_counterexample_driven_revision_candidate: [
    "counterexample-driven-revision",
  ],
};

export const PRIMARY_PERSONAL_PERSPECTIVE_CASEBOOK_SEED_V01: PersonalPerspectiveSemanticCasebookSeedV01 = {
  sources,
  cases,
  coverage: PERSONAL_PERSPECTIVE_REQUIRED_COVERAGE_V01.map((requirement_id) => ({
    requirement_id,
    case_keys: coverageCaseKeys[requirement_id],
  })),
};

export function createExactBoundaryPersonalPerspectiveCasebookSeedV01(): PersonalPerspectiveSemanticCasebookSeedV01 {
  const seed = clone(PRIMARY_PERSONAL_PERSPECTIVE_CASEBOOK_SEED_V01);
  const boundarySource = requiredSource(seed, "declaration-descriptive");
  boundarySource.summary = "s".repeat(
    PERSONAL_PERSPECTIVE_CASEBOOK_BOUNDS_V01.source_summary_characters,
  );
  const boundaryCase = requiredCase(seed, "descriptive-self-understanding");
  boundaryCase.title = "T".repeat(
    PERSONAL_PERSPECTIVE_CASEBOOK_BOUNDS_V01.title_characters,
  );
  boundaryCase.summary = "S".repeat(
    PERSONAL_PERSPECTIVE_CASEBOOK_BOUNDS_V01.summary_or_proposition_characters,
  );
  boundaryCase.proposition = "P".repeat(
    PERSONAL_PERSPECTIVE_CASEBOOK_BOUNDS_V01.summary_or_proposition_characters,
  );
  boundaryCase.rationale = "R".repeat(
    PERSONAL_PERSPECTIVE_CASEBOOK_BOUNDS_V01.rationale_characters,
  );
  boundaryCase.limitations = [
    "L".repeat(PERSONAL_PERSPECTIVE_CASEBOOK_BOUNDS_V01.limitation_characters),
    "fictional-boundary-limitation-02",
    "fictional-boundary-limitation-03",
    "fictional-boundary-limitation-04",
    "fictional-boundary-limitation-05",
    "fictional-boundary-limitation-06",
    "fictional-boundary-limitation-07",
    "fictional-boundary-limitation-08",
  ];
  const boundaryQualifiers = [
    "Q".repeat(
      PERSONAL_PERSPECTIVE_CASEBOOK_BOUNDS_V01.scope_qualifier_characters,
    ),
    "fictional-boundary-qualifier-02",
    "fictional-boundary-qualifier-03",
    "fictional-boundary-qualifier-04",
    "fictional-boundary-qualifier-05",
    "fictional-boundary-qualifier-06",
    "fictional-boundary-qualifier-07",
    "fictional-boundary-qualifier-08",
  ];
  boundarySource.scope.qualifiers = clone(boundaryQualifiers);
  boundaryCase.scope.qualifiers = clone(boundaryQualifiers);
  boundaryCase.future_review_actions = [
    ...PERSONAL_PERSPECTIVE_FUTURE_REVIEW_ACTIONS_V01,
  ];

  const relationTargetKeys: string[] = [];
  for (let index = 1; index <= PERSONAL_PERSPECTIVE_CASEBOOK_BOUNDS_V01.case_relations; index += 1) {
    const caseKey = `boundary-relation-target-${index}`;
    relationTargetKeys.push(caseKey);
    seed.cases.push(
      candidate(
        caseKey,
        "descriptive_self_understanding",
        `The fictional boundary target preserves relation slot ${index}.`,
        "declaration-descriptive",
        { scope: scope("workspace_conceptual", boundaryQualifiers[0]!) },
      ),
    );
    requiredCase(seed, caseKey).scope.qualifiers = clone(boundaryQualifiers);
  }
  boundaryCase.case_relations = relationTargetKeys.map((target_case_key) => ({
    target_case_key,
    relation: "contests",
    target_effect: "preserves_target",
  }));

  const exactCounterexampleSourceKeys = ["counterexample-alpha"];
  for (let index = 2; index <= PERSONAL_PERSPECTIVE_CASEBOOK_BOUNDS_V01.counterexample_refs; index += 1) {
    const sourceKey = `boundary-counterexample-${index}`;
    exactCounterexampleSourceKeys.push(sourceKey);
    seed.sources.push(
      source(
        sourceKey,
        "synthetic_counterexample",
        `A fictional exact-boundary counterexample fills source-ref slot ${index}.`,
        scope("exception", "fictional-exception-a"),
      ),
    );
  }
  const knownException = requiredCase(seed, "known-exception");
  knownException.source_relations = exactCounterexampleSourceKeys.map(
    (source_key) => ({ source_key, relation: "counterexample" }),
  );
  knownException.counterexample.source_keys = clone(
    exactCounterexampleSourceKeys,
  );

  requiredCase(seed, "world-model-candidate").counterexample.search_summary =
    "C".repeat(
      PERSONAL_PERSPECTIVE_CASEBOOK_BOUNDS_V01.counterexample_summary_characters,
    );
  return seed;
}

export function createExactMaxCollectionsPersonalPerspectiveCasebookSeedV01(): PersonalPerspectiveSemanticCasebookSeedV01 {
  const seed = clone(PRIMARY_PERSONAL_PERSPECTIVE_CASEBOOK_SEED_V01);
  let sourceIndex = 0;
  while (seed.sources.length < PERSONAL_PERSPECTIVE_CASEBOOK_BOUNDS_V01.sources) {
    sourceIndex += 1;
    seed.sources.push(
      source(
        `max-source-${sourceIndex}`,
        "synthetic_user_declaration",
        `A fictional bounded declaration fills exact source collection slot ${sourceIndex}.`,
        scope("situational", `fictional-max-source-${sourceIndex}`),
      ),
    );
  }
  let caseIndex = 0;
  while (seed.cases.length < PERSONAL_PERSPECTIVE_CASEBOOK_BOUNDS_V01.cases) {
    caseIndex += 1;
    seed.cases.push(
      candidate(
        `max-case-${caseIndex}`,
        "descriptive_self_understanding",
        `The fictional bounded candidate fills exact case collection slot ${caseIndex}.`,
        `max-source-${caseIndex}`,
        { scope: scope("situational", `fictional-max-source-${caseIndex}`) },
      ),
    );
  }
  return seed;
}

export interface PersonalPerspectiveCasebookNegativeFixtureV01 {
  name: string;
  expected_issue_code: string;
  resign: boolean;
  direct_input?: () => unknown;
  mutate?: (casebook: PersonalPerspectiveSemanticCasebookV01) => void;
}

function attack(
  name: string,
  expected_issue_code: string,
  mutate: (casebook: PersonalPerspectiveSemanticCasebookV01) => void,
  resign = false,
): PersonalPerspectiveCasebookNegativeFixtureV01 {
  return { name, expected_issue_code, resign, mutate };
}

function direct(
  name: string,
  expected_issue_code: string,
  direct_input: () => unknown,
): PersonalPerspectiveCasebookNegativeFixtureV01 {
  return { name, expected_issue_code, resign: false, direct_input };
}

function rootRecord(casebook: PersonalPerspectiveSemanticCasebookV01): Record<string, unknown> {
  return casebook as unknown as Record<string, unknown>;
}

function caseRecord(
  casebook: PersonalPerspectiveSemanticCasebookV01,
  caseKey: string,
): Record<string, unknown> {
  return requiredOutputCase(casebook, caseKey) as unknown as Record<
    string,
    unknown
  >;
}

function setRootAuthority(
  casebook: PersonalPerspectiveSemanticCasebookV01,
  field: (typeof PERSONAL_PERSPECTIVE_AUTHORITY_FLAGS_V01)[number],
): void {
  (casebook.authority_boundary as unknown as Record<string, unknown>)[field] =
    true;
}

function setCaseAuthority(
  casebook: PersonalPerspectiveSemanticCasebookV01,
  caseKey: string,
  field: (typeof PERSONAL_PERSPECTIVE_AUTHORITY_FLAGS_V01)[number],
): void {
  (
    requiredOutputCase(casebook, caseKey)
      .authority_boundary as unknown as Record<string, unknown>
  )[field] = true;
}

function setSemanticAssertion(
  casebook: PersonalPerspectiveSemanticCasebookV01,
  caseKey: string,
  field: string,
): void {
  (
    requiredOutputCase(casebook, caseKey)
      .semantic_assertions as unknown as Record<string, unknown>
  )[field] = true;
}

const authorityAttacks: PersonalPerspectiveCasebookNegativeFixtureV01[] = [
  attack(
    "resigned_model_inference_accepted_identity",
    "prohibited_authority_true_actual_user_identity_established",
    (casebook) =>
      setCaseAuthority(
        casebook,
        "model-inferred-candidate",
        "actual_user_identity_established",
      ),
    true,
  ),
  attack(
    "observed_behavior_promoted_to_personality_truth",
    "semantic_assertion_true_observed_behavior_establishes_personality_truth",
    (casebook) =>
      setSemanticAssertion(
        casebook,
        "task-choice-observation",
        "observed_behavior_establishes_personality_truth",
      ),
    true,
  ),
  attack(
    "source_integrity_treated_as_authenticity",
    "source_authenticity_claimed",
    (casebook) => {
      casebook.sources[0]!.authenticity_established = true as false;
    },
    true,
  ),
  attack(
    "candidate_treated_as_review_decision",
    "prohibited_authority_true_candidate_is_review_decision",
    (casebook) =>
      setCaseAuthority(
        casebook,
        "descriptive-self-understanding",
        "candidate_is_review_decision",
      ),
    true,
  ),
  attack(
    "candidate_treated_as_semantic_transition",
    "prohibited_authority_true_candidate_is_semantic_transition",
    (casebook) =>
      setCaseAuthority(
        casebook,
        "descriptive-self-understanding",
        "candidate_is_semantic_transition",
      ),
    true,
  ),
  attack(
    "candidate_treated_as_evidence",
    "prohibited_authority_true_candidate_is_evidence",
    (casebook) =>
      setCaseAuthority(
        casebook,
        "descriptive-self-understanding",
        "candidate_is_evidence",
      ),
    true,
  ),
  attack(
    "candidate_treated_as_accepted_memory",
    "prohibited_authority_true_candidate_is_accepted_memory",
    (casebook) =>
      setCaseAuthority(
        casebook,
        "descriptive-self-understanding",
        "candidate_is_accepted_memory",
      ),
    true,
  ),
  attack(
    "candidate_treated_as_accepted_personal_perspective",
    "prohibited_authority_true_candidate_is_accepted_personal_perspective",
    (casebook) =>
      setCaseAuthority(
        casebook,
        "descriptive-self-understanding",
        "candidate_is_accepted_personal_perspective",
      ),
    true,
  ),
  attack(
    "resigned_persistence_authority",
    "prohibited_authority_true_persistence_authorized",
    (casebook) => setRootAuthority(casebook, "persistence_authorized"),
    true,
  ),
  attack(
    "personal_vault_claimed_implemented",
    "prohibited_authority_true_personal_vault_implemented",
    (casebook) => setRootAuthority(casebook, "personal_vault_implemented"),
    true,
  ),
  attack(
    "task_context_inclusion_authorized",
    "prohibited_authority_true_task_context_inclusion_authorized",
    (casebook) =>
      setRootAuthority(casebook, "task_context_inclusion_authorized"),
    true,
  ),
  attack(
    "resigned_hidden_context_injection",
    "prohibited_authority_true_hidden_context_injection_performed",
    (casebook) =>
      setRootAuthority(casebook, "hidden_context_injection_performed"),
    true,
  ),
  attack(
    "resigned_cross_project_sharing_authority",
    "prohibited_authority_true_cross_project_sharing_authorized",
    (casebook) =>
      setRootAuthority(casebook, "cross_project_sharing_authorized"),
    true,
  ),
  attack(
    "automatic_personal_perspective_application",
    "prohibited_authority_true_automatic_personal_perspective_application",
    (casebook) =>
      setRootAuthority(
        casebook,
        "automatic_personal_perspective_application",
      ),
    true,
  ),
  attack(
    "automatic_review_decision",
    "prohibited_authority_true_automatic_review_decision",
    (casebook) => setRootAuthority(casebook, "automatic_review_decision"),
    true,
  ),
  attack(
    "semantic_state_commit_authority",
    "prohibited_authority_true_semantic_state_commit_authorized",
    (casebook) =>
      setRootAuthority(casebook, "semantic_state_commit_authorized"),
    true,
  ),
  attack(
    "work_closure_authority",
    "prohibited_authority_true_work_closed",
    (casebook) => setRootAuthority(casebook, "work_closed"),
    true,
  ),
  attack(
    "publication_readiness_authority",
    "prohibited_authority_true_publication_authorized",
    (casebook) => setRootAuthority(casebook, "publication_authorized"),
    true,
  ),
  attack(
    "provider_model_execution_authority",
    "prohibited_authority_true_provider_execution_authorized",
    (casebook) => setRootAuthority(casebook, "provider_execution_authorized"),
    true,
  ),
  attack(
    "provider_or_model_called_claim",
    "prohibited_authority_true_provider_or_model_called",
    (casebook) => setRootAuthority(casebook, "provider_or_model_called"),
    true,
  ),
  attack(
    "external_actuation_authority",
    "prohibited_authority_true_external_actuation_authorized",
    (casebook) => setRootAuthority(casebook, "external_actuation_authorized"),
    true,
  ),
  attack(
    "github_merge_authority",
    "prohibited_authority_true_github_merge_authorized",
    (casebook) => setRootAuthority(casebook, "github_merge_authorized"),
    true,
  ),
  attack(
    "automatic_perspective_actor_promotion",
    "prohibited_authority_true_automatic_perspective_actor_promotion",
    (casebook) =>
      setRootAuthority(casebook, "automatic_perspective_actor_promotion"),
    true,
  ),
  attack(
    "evolutionary_fitness_selection",
    "prohibited_authority_true_evolutionary_fitness_selection_authorized",
    (casebook) =>
      setRootAuthority(
        casebook,
        "evolutionary_fitness_selection_authorized",
      ),
    true,
  ),
];

const unsafeAttacks: PersonalPerspectiveCasebookNegativeFixtureV01[] = [
  attack("raw_prompt_field", "raw_prompt_field", (casebook) => {
    rootRecord(casebook)["raw_" + "prompt"] = "fictional blocked material";
  }),
  attack("raw_transcript_field", "raw_transcript_field", (casebook) => {
    rootRecord(casebook)["raw_" + "transcript"] = "fictional blocked material";
  }),
  attack("hidden_reasoning_field", "hidden_reasoning_field", (casebook) => {
    rootRecord(casebook)["hidden_" + "reasoning"] = "fictional blocked material";
  }),
  attack("terminal_dump_field", "terminal_dump_field", (casebook) => {
    rootRecord(casebook)["terminal_" + "dump"] = "fictional blocked material";
  }),
  attack("environment_dump_field", "environment_dump_field", (casebook) => {
    rootRecord(casebook)["environment_" + "dump"] = "fictional blocked material";
  }),
  attack("raw_provider_output_field", "raw_provider_output_field", (casebook) => {
    rootRecord(casebook)["raw_provider_" + "output"] = "fictional blocked material";
  }),
  attack("credential_shaped_material", "credential_shaped_material", (casebook) => {
    casebook.sources[0]!.summary = "gho_" + "a".repeat(24);
  }, true),
  attack("token_shaped_material", "token_shaped_material", (casebook) => {
    casebook.sources[0]!.summary = "Bearer " + "b".repeat(24);
  }, true),
  attack("fine_grained_credential_shaped_material", "credential_shaped_material", (casebook) => {
    casebook.sources[0]!.summary = "github_" + "pat_" + "c".repeat(24);
  }, true),
  attack("aws_api_key_shaped_material", "api_key_shaped_material", (casebook) => {
    casebook.sources[0]!.summary = "AKIA" + "D".repeat(16);
  }, true),
  attack("slack_token_shaped_material", "token_shaped_material", (casebook) => {
    casebook.sources[0]!.summary = "xoxb-" + "e".repeat(24);
  }, true),
  attack("raw_jwt_token_shaped_material", "token_shaped_material", (casebook) => {
    casebook.sources[0]!.summary =
      "eyJ" + "f".repeat(12) + ".eyJ" + "g".repeat(12) + "." + "h".repeat(16);
  }, true),
  attack("api_key_shaped_material", "api_key_shaped_material", (casebook) => {
    casebook.sources[0]!.summary = "api_" + "key=" + "b".repeat(18);
  }),
  attack("private_key_shaped_material", "private_key_shaped_material", (casebook) => {
    casebook.sources[0]!.summary = "BEGIN" + " PRIVATE KEY";
  }),
  attack("private_absolute_unix_path", "private_unix_path", (casebook) => {
    casebook.sources[0]!.summary = "/" + "Users" + "/fictional/private-item";
  }),
  attack("generic_private_absolute_unix_path", "private_unix_path", (casebook) => {
    casebook.sources[0]!.summary = "/" + "var/tmp/fictional-private-item";
  }, true),
  attack("quoted_private_absolute_unix_path", "private_unix_path", (casebook) => {
    casebook.sources[0]!.summary =
      "The fictional blocked path is '" + "/tmp/fictional/item'.";
  }, true),
  attack("private_windows_absolute_path", "private_windows_path", (casebook) => {
    casebook.sources[0]!.summary = "C:" + "\\" + "Users" + "\\fictional\\item";
  }),
  attack("private_windows_drive_relative_path", "private_windows_path", (casebook) => {
    casebook.sources[0]!.summary = "D:" + "fictional\\item";
  }),
  attack("prefixed_private_windows_absolute_path", "private_windows_path", (casebook) => {
    casebook.sources[0]!.summary =
      "prefix:" + "C:" + "\\" + "Users" + "\\fictional\\item";
  }),
  attack("prefixed_private_windows_drive_relative_path", "private_windows_path", (casebook) => {
    casebook.sources[0]!.summary = "prefix:" + "D:" + "fictional\\item";
  }),
  attack("private_windows_unc_path", "private_windows_path", (casebook) => {
    casebook.sources[0]!.summary =
      "\\" + "\\fictional-server\\private-share\\item";
  }, true),
  attack("private_windows_rooted_path", "private_windows_path", (casebook) => {
    casebook.sources[0]!.summary = "\\" + "fictional-root\\private-item";
  }, true),
  attack("home_directory_path", "home_directory_path", (casebook) => {
    casebook.sources[0]!.summary = "~" + "/fictional/item";
  }),
  attack("prefixed_home_directory_path", "home_directory_path", (casebook) => {
    casebook.sources[0]!.summary = "prefix:" + "~" + "/fictional/item";
  }),
  attack("file_uri", "file_uri", (casebook) => {
    casebook.sources[0]!.summary = "file" + "://fictional/item";
  }),
  attack("private_url", "private_url", (casebook) => {
    casebook.sources[0]!.summary = "https" + "://private.example.invalid/item";
  }),
  attack("private_url_rfc1918", "private_url", (casebook) => {
    casebook.sources[0]!.summary = "http" + "://172.16.0.1/item";
  }, true),
  attack("private_url_link_local", "private_url", (casebook) => {
    casebook.sources[0]!.summary = "http" + "://169.254.1.1/item";
  }, true),
  attack("private_url_local_hostname", "private_url", (casebook) => {
    casebook.sources[0]!.summary = "http" + "://service.local/item";
  }, true),
  attack("private_url_ipv6_loopback", "private_url", (casebook) => {
    casebook.sources[0]!.summary = "http" + "://[::1]/item";
  }, true),
  attack("opaque_secret_material", "opaque_secret_material", (casebook) => {
    casebook.sources[0]!.summary = "secret=" + "fictional".repeat(3);
  }),
  attack("actual_personal_data_marker", "actual_personal_data_marker", (casebook) => {
    casebook.sources[0]!.summary = "actual" + " personal material";
  }),
  attack("raw_prompt_material", "raw_prompt_material", (casebook) => {
    casebook.sources[0]!.summary = "raw" + " prompt";
  }),
  attack("raw_transcript_material", "raw_transcript_material", (casebook) => {
    casebook.sources[0]!.summary = "raw" + " transcript";
  }),
  attack("hidden_reasoning_material", "hidden_reasoning_material", (casebook) => {
    casebook.sources[0]!.summary = "hidden" + " reasoning";
  }),
  attack("terminal_dump_material", "terminal_dump_material", (casebook) => {
    casebook.sources[0]!.summary = "terminal" + " dump";
  }),
  attack("environment_dump_material", "environment_dump_material", (casebook) => {
    casebook.sources[0]!.summary = "environment" + " dump";
  }),
];

export const PERSONAL_PERSPECTIVE_CASEBOOK_NEGATIVE_FIXTURES_V01: PersonalPerspectiveCasebookNegativeFixtureV01[] = [
  direct("non_object_input", "casebook_non_object", () => "not-an-object"),
  attack("unsupported_version", "unsupported_casebook_version", (casebook) => {
    rootRecord(casebook).casebook_version = "unsupported.v9";
  }),
  attack("missing_required_field", "unsupported_casebook_version", (casebook) => {
    delete rootRecord(casebook).casebook_version;
  }),
  attack("unknown_root_field", "unknown_field", (casebook) => {
    rootRecord(casebook).unexpected_root = false;
  }),
  attack("unknown_nested_field", "unknown_field", (casebook) => {
    (requiredOutputCase(casebook, "descriptive-self-understanding").scope as unknown as Record<string, unknown>).unexpected_nested = false;
  }),
  attack("unknown_authority_shaped_field", "unknown_authority_shaped_field", (casebook) => {
    rootRecord(casebook).hidden_approval_authority = false;
  }),
  attack("malformed_enum", "semantic_kind_invalid", (casebook) => {
    caseRecord(casebook, "descriptive-self-understanding").semantic_kind = "unknown_kind";
  }),
  attack("malformed_timestamp", "timestamp_invalid", (casebook) => {
    rootRecord(casebook).defined_at = "not-a-time";
  }),
  attack("malformed_collection", "cases_malformed_collection", (casebook) => {
    rootRecord(casebook).cases = {};
  }),
  attack("oversized_title", "bounded_text_oversized", (casebook) => {
    requiredOutputCase(casebook, "descriptive-self-understanding").title = "T".repeat(
      PERSONAL_PERSPECTIVE_CASEBOOK_BOUNDS_V01.title_characters + 1,
    );
  }),
  attack("oversized_source_summary", "bounded_text_oversized", (casebook) => {
    requiredOutputSource(casebook, "declaration-descriptive").summary = "S".repeat(
      PERSONAL_PERSPECTIVE_CASEBOOK_BOUNDS_V01.source_summary_characters + 1,
    );
  }),
  attack("oversized_case_summary", "bounded_text_oversized", (casebook) => {
    requiredOutputCase(casebook, "descriptive-self-understanding").summary = "S".repeat(
      PERSONAL_PERSPECTIVE_CASEBOOK_BOUNDS_V01.summary_or_proposition_characters + 1,
    );
  }),
  attack("oversized_proposition", "bounded_text_oversized", (casebook) => {
    requiredOutputCase(casebook, "descriptive-self-understanding").proposition = "P".repeat(
      PERSONAL_PERSPECTIVE_CASEBOOK_BOUNDS_V01.summary_or_proposition_characters + 1,
    );
  }),
  attack("oversized_rationale", "bounded_text_oversized", (casebook) => {
    requiredOutputCase(casebook, "descriptive-self-understanding").rationale = "R".repeat(
      PERSONAL_PERSPECTIVE_CASEBOOK_BOUNDS_V01.rationale_characters + 1,
    );
  }),
  attack("oversized_counterexample_summary", "bounded_text_oversized", (casebook) => {
    requiredOutputCase(casebook, "world-model-candidate").counterexample.search_summary = "C".repeat(
      PERSONAL_PERSPECTIVE_CASEBOOK_BOUNDS_V01.counterexample_summary_characters + 1,
    );
  }),
  attack("oversized_scope_qualifier_text", "bounded_text_oversized", (casebook) => {
    requiredOutputCase(casebook, "descriptive-self-understanding").scope.qualifiers = [
      "Q".repeat(
        PERSONAL_PERSPECTIVE_CASEBOOK_BOUNDS_V01.scope_qualifier_characters + 1,
      ),
    ];
  }),
  attack("oversized_limitation_text", "bounded_text_oversized", (casebook) => {
    requiredOutputCase(casebook, "descriptive-self-understanding").limitations = [
      "L".repeat(
        PERSONAL_PERSPECTIVE_CASEBOOK_BOUNDS_V01.limitation_characters + 1,
      ),
    ];
  }),
  attack("oversized_experiment_list_item_text", "bounded_text_oversized", (casebook) => {
    casebook.experiment.inputs[0] = "I".repeat(
      PERSONAL_PERSPECTIVE_CASEBOOK_BOUNDS_V01.list_item_characters + 1,
    );
  }),
  attack("oversized_scope_qualifier_collection", "collection_oversized", (casebook) => {
    requiredOutputCase(casebook, "descriptive-self-understanding").scope.qualifiers =
      Array.from(
        { length: PERSONAL_PERSPECTIVE_CASEBOOK_BOUNDS_V01.scope_qualifiers + 1 },
        (_, index) => `fictional-overbound-qualifier-${index}`,
      );
  }),
  attack("oversized_limitation_collection", "collection_oversized", (casebook) => {
    requiredOutputCase(casebook, "descriptive-self-understanding").limitations =
      Array.from(
        { length: PERSONAL_PERSPECTIVE_CASEBOOK_BOUNDS_V01.limitations + 1 },
        (_, index) => `fictional-overbound-limitation-${index}`,
      );
  }),
  attack("oversized_source_relation_collection", "source_relations_oversized", (casebook) => {
    const relation = clone(
      requiredOutputCase(casebook, "descriptive-self-understanding")
        .source_relations[0]!,
    );
    requiredOutputCase(
      casebook,
      "descriptive-self-understanding",
    ).source_relations = Array.from(
      { length: PERSONAL_PERSPECTIVE_CASEBOOK_BOUNDS_V01.source_relations + 1 },
      () => clone(relation),
    );
  }),
  attack("oversized_case_relation_collection", "case_relations_oversized", (casebook) => {
    const target = requiredOutputCase(casebook, "commitment-completeness");
    const relation = clone(target.case_relations[0]!);
    target.case_relations = Array.from(
      { length: PERSONAL_PERSPECTIVE_CASEBOOK_BOUNDS_V01.case_relations + 1 },
      () => clone(relation),
    );
  }),
  attack("oversized_counterexample_ref_collection", "collection_oversized", (casebook) => {
    const target = requiredOutputCase(casebook, "known-present-counterexample");
    target.counterexample.source_refs = Array.from(
      { length: PERSONAL_PERSPECTIVE_CASEBOOK_BOUNDS_V01.counterexample_refs + 1 },
      () => target.counterexample.source_refs[0]!,
    );
  }),
  attack("oversized_future_review_action_collection", "collection_oversized", (casebook) => {
    requiredOutputCase(
      casebook,
      "descriptive-self-understanding",
    ).future_review_actions = Array.from(
      { length: PERSONAL_PERSPECTIVE_CASEBOOK_BOUNDS_V01.future_review_actions + 1 },
      () => "defer",
    );
  }),
  attack("oversized_experiment_list_collection", "collection_oversized", (casebook) => {
    casebook.experiment.excluded_inputs = Array.from(
      { length: PERSONAL_PERSPECTIVE_CASEBOOK_BOUNDS_V01.experiment_list_items + 1 },
      (_, index) => `fictional-excluded-input-${index}`,
    );
  }),
  attack("oversized_coverage_collection", "coverage_matrix_oversized", (casebook) => {
    casebook.coverage_matrix.push(clone(casebook.coverage_matrix[0]!));
  }),
  attack("oversized_case_collection", "case_collection_oversized", (casebook) => {
    const first = clone(casebook.cases[0]!);
    while (casebook.cases.length <= PERSONAL_PERSPECTIVE_CASEBOOK_BOUNDS_V01.cases) {
      casebook.cases.push(clone(first));
    }
  }),
  attack("oversized_source_collection", "source_collection_oversized", (casebook) => {
    const first = clone(casebook.sources[0]!);
    while (casebook.sources.length <= PERSONAL_PERSPECTIVE_CASEBOOK_BOUNDS_V01.sources) {
      casebook.sources.push(clone(first));
    }
  }),
  attack("duplicate_case_id", "duplicate_case_id", (casebook) => {
    casebook.cases.push(clone(casebook.cases[0]!));
  }),
  attack("duplicate_source_id", "duplicate_source_id", (casebook) => {
    casebook.sources.push(clone(casebook.sources[0]!));
  }),
  attack("conflicting_case_identity", "conflicting_case_identity", (casebook) => {
    const duplicate = clone(casebook.cases[0]!);
    duplicate.summary = "Conflicting fictional semantic content under the same case ID.";
    casebook.cases.push(duplicate);
  }),
  attack("conflicting_source_identity", "conflicting_source_identity", (casebook) => {
    const duplicate = clone(casebook.sources[0]!);
    duplicate.summary = "Conflicting fictional source meaning under the same source ID.";
    casebook.sources.push(duplicate);
  }),
  attack("malformed_case_id", "case_id_malformed", (casebook) => {
    requiredOutputCase(casebook, "descriptive-self-understanding").case_id = "bad-case-id";
  }),
  attack("malformed_source_id", "source_id_malformed", (casebook) => {
    casebook.sources[0]!.source_id = "bad-source-id";
  }),
  attack("mismatched_source_fingerprint", "source_fingerprint_mismatch", (casebook) => {
    casebook.sources[0]!.integrity.fingerprint = "sha256:" + "0".repeat(64);
  }),
  attack("mismatched_case_fingerprint", "case_fingerprint_mismatch", (casebook) => {
    casebook.cases[0]!.integrity.fingerprint = "sha256:" + "0".repeat(64);
  }),
  attack("aggregate_fingerprint_mismatch", "aggregate_fingerprint_mismatch", (casebook) => {
    casebook.integrity.fingerprint = "sha256:" + "0".repeat(64);
  }),
  attack("zero_source_refs", "admitted_case_source_required", (casebook) => {
    requiredOutputCase(casebook, "descriptive-self-understanding").source_relations = [];
  }, true),
  attack("unresolved_source_ref", "source_ref_unresolved", (casebook) => {
    requiredOutputCase(casebook, "descriptive-self-understanding").source_relations[0]!.source_id =
      "ppscb-source-v0-1:" + "0".repeat(24);
  }, true),
  attack("malformed_source_ref", "required_string_missing_or_invalid", (casebook) => {
    (requiredOutputCase(casebook, "descriptive-self-understanding").source_relations[0] as unknown as Record<string, unknown>).source_id = 7;
  }),
  ...unsafeAttacks,
  ...authorityAttacks,
  attack("resigned_fake_personal_project_id", "fake_personal_project_id", (casebook) => {
    const target = requiredOutputCase(casebook, "project-scope-narrowing");
    target.scope.project_scope_ref = "project:personal";
  }, true),
  attack("project_exception_rewrites_workspace_candidate", "lower_scope_rewrite_attempted", (casebook) => {
    const target = requiredOutputCase(casebook, "project-scope-narrowing");
    (target.case_relations[0] as unknown as Record<string, unknown>).target_effect = "replaces_target";
  }, true),
  attack("role_specific_behavior_promoted_global", "role_specific_meaning_globalized", (casebook) => {
    requiredOutputCase(casebook, "contextual-role").scope.kind = "workspace_conceptual";
  }, true),
  attack("relationship_specific_material_shared_global", "reuse_cross_project_sharing_authorized_true", (casebook) => {
    requiredOutputCase(casebook, "relationship-specific-candidate").reuse.cross_project_sharing_authorized = true as false;
  }, true),
  attack("resigned_task_choice_promoted_global", "behavior_observation_globalized", (casebook) => {
    requiredOutputCase(casebook, "task-choice-observation").scope.kind = "workspace_conceptual";
  }, true),
  attack("contradictory_scope", "project_scope_ref_not_applicable", (casebook) => {
    requiredOutputCase(casebook, "contextual-role").scope.project_scope_ref =
      "synthetic-project-scope:fictional-a";
  }, true),
  attack("unknown_parent_scope", "case_relation_target_unresolved", (casebook) => {
    requiredOutputCase(casebook, "project-scope-narrowing").case_relations[0]!.target_case_id =
      "ppscb-case-v0-1:" + "0".repeat(24);
  }, true),
  attack("cross_scope_relation_missing_case", "case_relation_target_unresolved", (casebook) => {
    requiredOutputCase(casebook, "known-exception").case_relations[0]!.target_case_id =
      "ppscb-case-v0-1:" + "1".repeat(24);
  }, true),
  attack("cross_task_interpretation_relation", "cross_scope_case_relation", (casebook) => {
    const source = clone(requiredOutputSource(casebook, "behavior-task-choice"));
    source.source_id = "ppscb-source-v0-1:" + "e".repeat(24);
    source.source_key = "behavior-task-choice-b";
    source.scope.qualifiers = ["fictional-task-b"];
    casebook.sources.push(source);
    const interpretation = requiredOutputCase(
      casebook,
      "behavior-pattern-interpretation",
    );
    interpretation.scope.qualifiers = ["fictional-task-b"];
    interpretation.source_relations = [
      { source_id: source.source_id, relation: "derived_from" },
    ];
  }, true),
  attack("cross_project_case_relation", "cross_project_case_relation", (casebook) => {
    const target = requiredOutputCase(casebook, "descriptive-self-understanding");
    target.scope.kind = "project_specific";
    target.scope.project_scope_ref = "synthetic-project-scope:fictional-b";
  }, true),
  attack("lower_scope_override_replaces_higher", "lower_scope_rewrite_attempted", (casebook) => {
    const relation = requiredOutputCase(casebook, "known-exception").case_relations[0]!;
    (relation as unknown as Record<string, unknown>).target_effect = "replaces_target";
  }, true),
  attack("cross_project_personal_context_leakage", "prohibited_authority_true_cross_project_sharing_authorized", (casebook) => {
    setRootAuthority(casebook, "cross_project_sharing_authorized");
  }, true),
  attack("known_present_without_ref", "known_present_counterexample_ref_required", (casebook) => {
    const target = requiredOutputCase(casebook, "known-present-counterexample");
    target.counterexample.source_refs = [];
  }, true),
  attack("known_present_unresolved_ref", "counterexample_ref_unresolved", (casebook) => {
    const target = requiredOutputCase(casebook, "known-present-counterexample");
    target.counterexample.source_refs = ["ppscb-source-v0-1:" + "2".repeat(24)];
  }, true),
  attack("known_present_unrelated_ref", "known_present_counterexample_ref_unrelated", (casebook) => {
    const target = requiredOutputCase(casebook, "known-present-counterexample");
    const declaration = requiredOutputSource(casebook, "declaration-descriptive");
    target.counterexample.source_refs = [declaration.source_id];
    target.source_relations = [
      { source_id: declaration.source_id, relation: "counterexample" },
    ];
  }, true),
  attack("none_found_with_known_ref", "none_found_with_counterexample_ref", (casebook) => {
    const target = requiredOutputCase(casebook, "world-model-candidate");
    const counter = requiredOutputSource(casebook, "counterexample-alpha");
    target.counterexample.source_refs = [counter.source_id];
    target.source_relations.push({ source_id: counter.source_id, relation: "counterexample" });
  }, true),
  attack("none_found_as_impossibility", "none_found_impossibility_claim", (casebook) => {
    requiredOutputCase(casebook, "world-model-candidate").counterexample.impossibility_claimed = true;
  }, true),
  attack("not_searched_as_completed", "not_searched_false_completeness", (casebook) => {
    requiredOutputCase(casebook, "counterexample-not-searched").counterexample.search_completed = true;
  }, true),
  attack("not_searched_false_completeness", "not_searched_false_completeness", (casebook) => {
    requiredOutputCase(casebook, "counterexample-not-searched").counterexample.completeness_claimed = true;
  }, true),
  attack("not_searched_impossibility_claim", "not_searched_false_completeness", (casebook) => {
    requiredOutputCase(casebook, "counterexample-not-searched").counterexample.impossibility_claimed = true;
  }, true),
  attack("invalid_not_applicable", "not_applicable_invalid_case_type", (casebook) => {
    requiredOutputCase(casebook, "world-model-candidate").counterexample = {
      status: "not_applicable",
      source_refs: [],
      search_summary: null,
      justification: "Counterexample review was incorrectly declared inapplicable.",
      search_completed: false,
      completeness_claimed: false,
      impossibility_claimed: false,
    };
  }, true),
  attack("missing_counterexample_status", "counterexample_status_invalid", (casebook) => {
    delete (requiredOutputCase(casebook, "world-model-candidate").counterexample as unknown as Record<string, unknown>).status;
  }),
  attack("unknown_counterexample_status", "counterexample_status_invalid", (casebook) => {
    (requiredOutputCase(casebook, "world-model-candidate").counterexample as unknown as Record<string, unknown>).status = "unknown";
  }),
  attack("fabricated_counterexample_coverage", "semantic_assertion_true_counterexample_fabricated_for_coverage", (casebook) => {
    setSemanticAssertion(casebook, "known-present-counterexample", "counterexample_fabricated_for_coverage");
  }, true),
  attack("resigned_known_present_without_relation", "known_present_counterexample_relation_required", (casebook) => {
    const target = requiredOutputCase(casebook, "known-present-counterexample");
    target.source_relations = target.source_relations.filter(
      (relation) => relation.relation !== "counterexample",
    );
  }, true),
  attack("duplicate_conflicting_counterexample_relation", "duplicate_conflicting_source_relation", (casebook) => {
    const target = requiredOutputCase(casebook, "known-present-counterexample");
    const counter = requiredOutputSource(casebook, "counterexample-alpha");
    target.source_relations.push({ source_id: counter.source_id, relation: "supports" });
  }, true),
  attack("contested_as_settled_truth", "semantic_assertion_true_contested_as_settled_truth", (casebook) => {
    setSemanticAssertion(casebook, "contested-interpretation", "contested_as_settled_truth");
  }, true),
  attack("stale_item_silently_reusable", "stale_item_silently_reusable", (casebook) => {
    requiredOutputCase(casebook, "stale-candidate").reuse.eligibility = "review_required";
  }, true),
  attack("retracted_item_selected_for_reuse", "retracted_item_reuse_or_revival", (casebook) => {
    requiredOutputCase(casebook, "retracted-candidate").reuse.eligibility = "review_required";
  }, true),
  attack("retracted_item_automatically_revived", "reuse_automatic_revival_authorized_true", (casebook) => {
    requiredOutputCase(casebook, "retracted-candidate").reuse.automatic_revival_authorized = true as false;
  }, true),
  attack("deleted_item_retains_content", "deleted_item_retains_reusable_content", (casebook) => {
    requiredOutputCase(casebook, "deleted-item-tombstone").proposition =
      "A fictional deleted proposition was improperly retained.";
  }, true),
  attack("deleted_item_content_bearing_source", "deleted_tombstone_content_bearing_source_forbidden", (casebook) => {
    const tombstone = requiredOutputCase(casebook, "deleted-item-tombstone");
    const declaration = requiredOutputSource(casebook, "declaration-descriptive");
    tombstone.source_relations = [
      { source_id: declaration.source_id, relation: "derived_from" },
    ];
  }, true),
  attack("deleted_source_content_bearing_key", "deleted_source_content_boundary_mismatch", (casebook) => {
    requiredOutputSource(casebook, "deletion-alpha").source_key =
      "fictional-deleted-statement-prefers-option-alpha";
  }, true),
  attack("deleted_source_content_bearing_scope", "deleted_source_content_boundary_mismatch", (casebook) => {
    requiredOutputSource(casebook, "deletion-alpha").scope.qualifiers = [
      "fictional deleted statement prefers option alpha",
    ];
  }, true),
  attack("deleted_item_rehydrated", "reuse_rehydration_authorized_true", (casebook) => {
    requiredOutputCase(casebook, "deleted-item-tombstone").reuse.rehydration_authorized = true as false;
  }, true),
  attack("resigned_deleted_item_reuse", "deleted_item_reuse_or_rehydration", (casebook) => {
    requiredOutputCase(casebook, "deleted-item-tombstone").reuse.eligibility = "review_required";
  }, true),
  attack("deleted_item_selected_for_context", "reuse_task_context_selection_authorized_true", (casebook) => {
    requiredOutputCase(casebook, "deleted-item-tombstone").reuse.task_context_selection_authorized = true as false;
  }, true),
  attack("candidate_status_omitted", "candidate_status_invalid", (casebook) => {
    delete caseRecord(casebook, "stale-candidate").candidate_status;
  }),
  attack("retracted_status_omitted", "candidate_status_invalid", (casebook) => {
    delete caseRecord(casebook, "retracted-candidate").candidate_status;
  }),
  attack("deleted_status_omitted", "candidate_status_invalid", (casebook) => {
    delete caseRecord(casebook, "deleted-item-tombstone").candidate_status;
  }),
  attack("resigned_false_premise_admission", "false_premise_admitted_as_candidate", (casebook) => {
    requiredOutputSource(casebook, "declaration-descriptive").source_kind =
      "synthetic_false_premise";
  }, true),
  attack("candidate_uses_refusal_semantic_kind", "case_type_semantic_kind_incompatible", (casebook) => {
    const extra = clone(
      requiredOutputCase(casebook, "descriptive-self-understanding"),
    );
    extra.case_key = "candidate-refusal-kind-attack";
    extra.semantic_kind = "refusal_material";
    casebook.cases.push(extra);
  }, true),
  attack("candidate_uses_deletion_semantic_kind", "case_type_semantic_kind_incompatible", (casebook) => {
    const extra = clone(
      requiredOutputCase(casebook, "descriptive-self-understanding"),
    );
    extra.case_key = "candidate-deletion-kind-attack";
    extra.semantic_kind = "deletion_tombstone";
    casebook.cases.push(extra);
  }, true),
  attack("candidate_inferred_from_deletion_instruction", "deletion_source_usage_invalid", (casebook) => {
    const extra = clone(
      requiredOutputCase(casebook, "descriptive-self-understanding"),
    );
    const source = requiredOutputSource(casebook, "deletion-alpha");
    extra.case_key = "candidate-from-deletion-attack";
    extra.epistemic_origin = "derived_interpretation";
    extra.source_relations = [
      { source_id: source.source_id, relation: "derived_from" },
    ];
    casebook.cases.push(extra);
  }, true),
  attack("candidate_revived_from_retraction_instruction", "retraction_source_usage_invalid", (casebook) => {
    const extra = clone(
      requiredOutputCase(casebook, "descriptive-self-understanding"),
    );
    const source = requiredOutputSource(casebook, "retraction-alpha");
    extra.case_key = "candidate-from-retraction-attack";
    extra.epistemic_origin = "derived_interpretation";
    extra.source_relations = [
      { source_id: source.source_id, relation: "derived_from" },
    ];
    casebook.cases.push(extra);
  }, true),
  attack("narrows_relation_on_wrong_semantic_kind", "case_relation_semantic_kind_mismatch", (casebook) => {
    requiredOutputCase(casebook, "project-scope-narrowing").semantic_kind =
      "descriptive_self_understanding";
  }, true),
  attack("revises_relation_on_wrong_semantic_kind", "case_relation_semantic_kind_mismatch", (casebook) => {
    requiredOutputCase(
      casebook,
      "counterexample-driven-revision",
    ).semantic_kind = "recurring_disposition_candidate";
  }, true),
  attack("interprets_relation_on_wrong_semantic_kind", "case_relation_semantic_kind_mismatch", (casebook) => {
    requiredOutputCase(
      casebook,
      "behavior-pattern-interpretation",
    ).semantic_kind = "descriptive_self_understanding";
  }, true),
  attack("unlinked_exception_scope_candidate", "exception_scope_semantic_kind_invalid", (casebook) => {
    const extra = clone(
      requiredOutputCase(casebook, "descriptive-self-understanding"),
    );
    extra.case_key = "unlinked-exception-scope-attack";
    extra.scope.kind = "exception";
    extra.scope.qualifiers = ["fictional-unlinked-exception"];
    casebook.cases.push(extra);
  }, true),
  attack("known_exception_without_counterexample", "known_exception_counterexample_required", (casebook) => {
    const extra = clone(requiredOutputCase(casebook, "known-exception"));
    extra.case_key = "known-exception-without-counterexample-attack";
    extra.counterexample = {
      status: "not_searched",
      source_refs: [],
      search_summary: null,
      justification: null,
      search_completed: false,
      completeness_claimed: false,
      impossibility_claimed: false,
    };
    extra.source_relations = extra.source_relations.filter(
      (relation) => relation.relation !== "counterexample",
    );
    casebook.cases.push(extra);
  }, true),
  attack("derived_interpretation_mislabeled_observation", "behavior_observation_origin_invalid", (casebook) => {
    const extra = clone(
      requiredOutputCase(casebook, "behavior-pattern-interpretation"),
    );
    extra.case_key = "derived-observation-label-attack";
    extra.semantic_kind = "behavior_observation";
    extra.case_relations = [];
    casebook.cases.push(extra);
  }, true),
  attack("over_globalized_claim_accepted", "semantic_assertion_true_over_globalized_claim_accepted", (casebook) => {
    setSemanticAssertion(casebook, "project-scope-narrowing", "over_globalized_claim_accepted");
  }, true),
  attack("aspiration_as_current_truth", "semantic_assertion_true_aspiration_treated_as_current_truth", (casebook) => {
    setSemanticAssertion(casebook, "aspirational-identity", "aspiration_treated_as_current_truth");
  }, true),
  attack("tension_automatically_resolved", "semantic_assertion_true_tension_automatically_resolved", (casebook) => {
    setSemanticAssertion(casebook, "persistent-tension", "tension_automatically_resolved");
  }, true),
  attack("exception_disproves_broader_globally", "semantic_assertion_true_exception_proves_global_falsehood", (casebook) => {
    setSemanticAssertion(casebook, "known-exception", "exception_proves_global_falsehood");
  }, true),
  attack("model_agreement_as_verification", "semantic_assertion_true_model_agreement_treated_as_verification", (casebook) => {
    setSemanticAssertion(casebook, "model-inferred-candidate", "model_agreement_treated_as_verification");
  }, true),
  attack("repetition_as_user_endorsement", "semantic_assertion_true_repeated_observation_treated_as_endorsement", (casebook) => {
    setSemanticAssertion(casebook, "behavior-pattern-interpretation", "repeated_observation_treated_as_endorsement");
  }, true),
  attack("confidence_as_authority", "semantic_assertion_true_confidence_score_grants_authority", (casebook) => {
    setSemanticAssertion(casebook, "model-inferred-candidate", "confidence_score_grants_authority");
  }, true),
  attack("provider_specific_field_mandatory", "unknown_field", (casebook) => {
    caseRecord(casebook, "model-inferred-candidate").provider_required = true;
  }, true),
  attack("psychological_diagnosis_as_truth", "semantic_assertion_true_psychological_diagnosis_assigned", (casebook) => {
    setSemanticAssertion(casebook, "model-inferred-candidate", "psychological_diagnosis_assigned");
  }, true),
  attack("accepted_name_grants_authority", "unknown_field", (casebook) => {
    caseRecord(casebook, "descriptive-self-understanding").accepted = true;
  }, true),
  attack("verified_name_grants_authority", "unknown_field", (casebook) => {
    caseRecord(casebook, "descriptive-self-understanding").verified = true;
  }, true),
  attack("helpful_name_grants_authority", "unknown_field", (casebook) => {
    caseRecord(casebook, "descriptive-self-understanding").helpful = true;
  }, true),
  attack("observed_name_grants_authority", "unknown_field", (casebook) => {
    caseRecord(casebook, "descriptive-self-understanding").observed = true;
  }, true),
  attack("stable_name_grants_authority", "unknown_field", (casebook) => {
    caseRecord(casebook, "descriptive-self-understanding").stable = true;
  }, true),
  attack("user_declaration_relation_relabel", "source_kind_relation_invalid", (casebook) => {
    requiredOutputCase(
      casebook,
      "descriptive-self-understanding",
    ).source_relations[0]!.relation = "observes";
  }, true),
  attack("joint_interpretation_relation_relabel", "source_kind_relation_invalid", (casebook) => {
    const target = requiredOutputCase(casebook, "jointly-interpreted-candidate");
    const sourceId = requiredOutputSource(
      casebook,
      "joint-interpretation-alpha",
    ).source_id;
    target.source_relations.find(
      (relation) => relation.source_id === sourceId,
    )!.relation = "observes";
  }, true),
  attack("reserved_personal_project_qualifier", "fake_personal_project_id", (casebook) => {
    requiredOutputCase(
      casebook,
      "descriptive-self-understanding",
    ).scope.qualifiers = ["project:user"];
  }, true),
  attack("reserved_personal_project_source_summary", "fake_personal_project_id", (casebook) => {
    requiredOutputSource(casebook, "declaration-descriptive").summary =
      "A fictional source improperly names project:personal.";
  }, true),
  attack("experiment_authority_metadata_tampered", "experiment_metadata_mismatch", (casebook) => {
    casebook.experiment.authority_boundary = [
      "A tampered synthetic phrase attempts to grant persistence authority.",
    ];
  }, true),
  attack("experiment_retention_metadata_tampered", "experiment_metadata_mismatch", (casebook) => {
    casebook.experiment.retention =
      "A tampered synthetic phrase attempts to retain non-fixture material.";
  }, true),
  attack("experiment_excluded_inputs_removed", "experiment_metadata_mismatch", (casebook) => {
    casebook.experiment.excluded_inputs = [];
  }, true),
  attack("coverage_rows_all_point_to_one_case", "required_coverage_semantic_mismatch", (casebook) => {
    const ref = requiredOutputCase(
      casebook,
      "descriptive-self-understanding",
    ).case_id;
    for (const row of casebook.coverage_matrix) row.case_refs = [ref];
  }, true),
  attack("commitment_tension_unrelated_target", "required_coverage_case_semantics_mismatch", (casebook) => {
    requiredOutputCase(
      casebook,
      "commitment-completeness",
    ).case_relations[0]!.target_case_id = requiredOutputCase(
      casebook,
      "aspirational-identity",
    ).case_id;
  }, true),
  attack("known_exception_unrelated_target", "known_exception_relation_required", (casebook) => {
    requiredOutputCase(
      casebook,
      "known-exception",
    ).case_relations[0]!.target_case_id = requiredOutputCase(
      casebook,
      "commitment-timeliness",
    ).case_id;
  }, true),
  attack("revision_unrelated_original", "required_coverage_case_semantics_mismatch", (casebook) => {
    requiredOutputCase(
      casebook,
      "counterexample-driven-revision",
    ).case_relations[0]!.target_case_id = requiredOutputCase(
      casebook,
      "commitment-timeliness",
    ).case_id;
  }, true),
  attack("persistent_tension_one_side_removed", "persistent_tension_two_sides_required", (casebook) => {
    const source = requiredOutputSource(casebook, "declaration-commitment-b");
    const target = requiredOutputCase(casebook, "persistent-tension");
    target.source_relations = target.source_relations.filter(
      (relation) => relation.source_id !== source.source_id,
    );
  }, true),
  attack("contested_interpretation_candidate_status", "contested_interpretation_status_required", (casebook) => {
    requiredOutputCase(
      casebook,
      "contested-interpretation",
    ).candidate_status = "candidate";
  }, true),
  attack("case_non_authority_summary_tampered", "case_non_authority_summary_mismatch", (casebook) => {
    requiredOutputCase(
      casebook,
      "descriptive-self-understanding",
    ).non_authority_summary =
      "A contradictory synthetic summary attempts to claim authority.";
  }, true),
  attack("integrity_omitted_fields_tampered", "integrity_omitted_fields_mismatch", (casebook) => {
    casebook.integrity.omitted_fields = ["authority_boundary"];
  }, true),
  attack("integrity_scope_tampered", "integrity_fingerprint_scope_mismatch", (casebook) => {
    casebook.integrity.fingerprint_scope =
      "A tampered scope omits authority and privacy boundaries.";
  }, true),
  attack("none_found_false_completeness", "none_found_false_completeness", (casebook) => {
    requiredOutputCase(
      casebook,
      "world-model-candidate",
    ).counterexample.completeness_claimed = true;
  }, true),
  attack("duplicate_case_key_conflicting_semantics", "conflicting_case_key", (casebook) => {
    const duplicate = clone(
      requiredOutputCase(casebook, "descriptive-self-understanding"),
    );
    duplicate.proposition =
      "A conflicting fictional proposition reuses the same case key.";
    casebook.cases.push(duplicate);
  }, true),
  attack("unsorted_limitations", "unordered_collection_not_normalized", (casebook) => {
    requiredOutputCase(
      casebook,
      "descriptive-self-understanding",
    ).limitations = ["zeta fictional limitation", "alpha fictional limitation"];
  }, true),
  attack("duplicate_review_actions", "unordered_collection_not_normalized", (casebook) => {
    const target = requiredOutputCase(casebook, "descriptive-self-understanding");
    target.future_review_actions.push(target.future_review_actions[0]!);
  }, true),
  attack("joint_candidate_duplicate_source_inflation", "joint_interpretation_multiple_sources_required", (casebook) => {
    const target = requiredOutputCase(casebook, "jointly-interpreted-candidate");
    const joint = target.source_relations.find(
      (relation) => relation.relation === "derived_from",
    )!;
    target.source_relations = [clone(joint), clone(joint)];
  }, true),
  attack("synthetic_personal_project_scope", "fake_personal_project_id", (casebook) => {
    requiredOutputCase(
      casebook,
      "project-scope-narrowing",
    ).scope.project_scope_ref = "synthetic-project-scope:personal";
  }, true),
  attack("cross_project_source_relation", "cross_project_source_relation", (casebook) => {
    requiredOutputCase(
      casebook,
      "project-scope-narrowing",
    ).scope.project_scope_ref = "synthetic-project-scope:fictional-b";
  }, true),
  attack("restricted_counterexample_source_scope_leak", "source_scope_escapes_case_scope", (casebook) => {
    requiredOutputSource(casebook, "counterexample-alpha").scope = {
      kind: "relationship_specific",
      qualifiers: ["fictional-relationship-b"],
      project_scope_ref: null,
      valid_from: null,
      valid_until: null,
      ambiguous: false,
      sharing_outside_scope_authorized: false,
    };
  }, true),
  attack("situational_source_promoted_workspace_global", "source_scope_escapes_case_scope", (casebook) => {
    requiredOutputSource(casebook, "declaration-descriptive").scope = {
      kind: "situational",
      qualifiers: ["fictional-situation-b"],
      project_scope_ref: null,
      valid_from: null,
      valid_until: null,
      ambiguous: false,
      sharing_outside_scope_authorized: false,
    };
  }, true),
  attack("none_found_retains_counterexample_relation", "none_found_with_counterexample_relation", (casebook) => {
    const target = requiredOutputCase(casebook, "world-model-candidate");
    const counter = requiredOutputSource(casebook, "counterexample-alpha");
    target.source_relations.push({
      source_id: counter.source_id,
      relation: "counterexample",
    });
  }, true),
  attack("known_present_omits_known_counterexample_ref", "known_present_counterexample_ref_coverage_incomplete", (casebook) => {
    const extra = requiredOutputSource(casebook, "contest-alpha");
    extra.source_kind = "synthetic_counterexample";
    requiredOutputCase(
      casebook,
      "known-present-counterexample",
    ).source_relations.push({
      source_id: extra.source_id,
      relation: "counterexample",
    });
  }, true),
  attack("tombstone_title_retains_deleted_content", "deleted_tombstone_content_boundary_mismatch", (casebook) => {
    requiredOutputCase(casebook, "deleted-item-tombstone").title =
      "A fictional deleted proposition appears in the title.";
  }, true),
  attack("tombstone_ref_retains_deleted_content", "deleted_tombstone_ref_invalid", (casebook) => {
    requiredOutputCase(casebook, "deleted-item-tombstone").tombstone_ref =
      "synthetic-deletion-tombstone:fictional-prefers-option-alpha";
  }, true),
  attack("tombstone_scope_retains_deleted_content", "deleted_tombstone_content_boundary_mismatch", (casebook) => {
    requiredOutputCase(casebook, "deleted-item-tombstone").scope.qualifiers = [
      "fictional deleted statement prefers option alpha",
    ];
  }, true),
  attack("additional_content_bearing_tombstone_key", "deleted_tombstone_content_boundary_mismatch", (casebook) => {
    const extra = clone(requiredOutputCase(casebook, "deleted-item-tombstone"));
    extra.case_key = "fictional-deleted-statement-prefers-option-alpha";
    casebook.cases.push(extra);
  }, true),
  attack("deleted_refusal_retains_deleted_content", "deleted_refusal_content_boundary_mismatch", (casebook) => {
    requiredOutputCase(casebook, "deleted-item-reuse-refusal").summary =
      "The fictional deleted statement preferred option alpha.";
  }, true),
  attack("tombstone_counterexample_retains_deleted_content", "deleted_tombstone_content_boundary_mismatch", (casebook) => {
    requiredOutputCase(
      casebook,
      "deleted-item-tombstone",
    ).counterexample.justification =
      "The fictional deleted statement preferred option alpha.";
  }, true),
  attack("tombstone_review_action_reopens_content", "deleted_tombstone_content_boundary_mismatch", (casebook) => {
    requiredOutputCase(
      casebook,
      "deleted-item-tombstone",
    ).future_review_actions = ["endorse"];
  }, true),
  attack("deleted_refusal_counterexample_retains_content", "deleted_refusal_content_boundary_mismatch", (casebook) => {
    requiredOutputCase(
      casebook,
      "deleted-item-reuse-refusal",
    ).counterexample.justification =
      "The fictional deleted statement preferred option alpha.";
  }, true),
  attack("deleted_refusal_review_action_reopens_content", "deleted_refusal_content_boundary_mismatch", (casebook) => {
    requiredOutputCase(
      casebook,
      "deleted-item-reuse-refusal",
    ).future_review_actions = ["endorse"];
  }, true),
  attack("deleted_refusal_case_relation_retains_lineage", "deleted_refusal_content_boundary_mismatch", (casebook) => {
    requiredOutputCase(
      casebook,
      "deleted-item-reuse-refusal",
    ).case_relations = [
      {
        target_case_id: requiredOutputCase(
          casebook,
          "descriptive-self-understanding",
        ).case_id,
        relation: "revises",
        target_effect: "preserves_target",
      },
    ];
  }, true),
  attack("deleted_refusal_retains_synthetic_content", "deleted_refusal_content_boundary_mismatch", (casebook) => {
    requiredOutputCase(
      casebook,
      "deleted-item-reuse-refusal",
    ).reuse.synthetic_content_retained = true;
  }, true),
  attack("revision_self_lineage", "case_relation_self_target_forbidden", (casebook) => {
    const revision = requiredOutputCase(casebook, "counterexample-driven-revision");
    revision.case_relations[0]!.target_case_id = revision.case_id;
  }, true),
  attack("false_premise_refusal_wrong_source_kind", "refusal_source_kind_required", (casebook) => {
    requiredOutputSource(casebook, "false-premise-alpha").source_kind =
      "synthetic_contextual_fact";
  }, true),
  attack("over_globalization_refusal_wrong_source_kind", "refusal_source_kind_required", (casebook) => {
    requiredOutputSource(casebook, "scope-overglobal-alpha").source_kind =
      "synthetic_user_declaration";
  }, true),
  attack("retracted_status_wrong_source_kind", "retracted_status_source_required", (casebook) => {
    requiredOutputSource(casebook, "retraction-alpha").source_kind =
      "synthetic_contextual_fact";
  }, true),
  attack("timestamp_whitespace_normalization_attack", "timestamp_invalid", (casebook) => {
    requiredOutputCase(casebook, "stale-candidate").scope.valid_from =
      " 2025-01-01T00:00:00.000Z";
  }, true),
  attack("malformed_null_source_entry", "source_malformed", (casebook) => {
    (casebook.sources as unknown[])[0] = null;
  }),
  attack("malformed_null_case_entry", "case_malformed", (casebook) => {
    (casebook.cases as unknown[])[0] = null;
  }),
  attack("non_json_bigint_input", "non_json_scalar_forbidden", (casebook) => {
    rootRecord(casebook).non_json_value = BigInt(7);
  }),
  attack("multiple_issue_ordering", "prohibited_authority_true_work_closed", (casebook) => {
    setRootAuthority(casebook, "work_closed");
    setRootAuthority(casebook, "publication_authorized");
    requiredOutputCase(casebook, "contextual-role").scope.kind = "workspace_conceptual";
  }, true),
];

export function buildPersonalPerspectiveCasebookNegativeInputV01(
  descriptor: PersonalPerspectiveCasebookNegativeFixtureV01,
  base: PersonalPerspectiveSemanticCasebookV01,
): unknown {
  if (descriptor.direct_input) return descriptor.direct_input();
  const mutated = clone(base);
  descriptor.mutate?.(mutated);
  return descriptor.resign
    ? resignPersonalPerspectiveSemanticCasebookV01(mutated)
    : mutated;
}

function requiredSource(
  seed: PersonalPerspectiveSemanticCasebookSeedV01,
  sourceKey: string,
): PersonalPerspectiveSourceSeedV01 {
  const value = seed.sources.find((item) => item.source_key === sourceKey);
  if (!value) throw new Error("fixture_source_missing");
  return value;
}

function requiredCase(
  seed: PersonalPerspectiveSemanticCasebookSeedV01,
  caseKey: string,
): PersonalPerspectiveCaseSeedV01 {
  const value = seed.cases.find((item) => item.case_key === caseKey);
  if (!value) throw new Error("fixture_case_missing");
  return value;
}

function requiredOutputSource(
  casebook: PersonalPerspectiveSemanticCasebookV01,
  sourceKey: string,
) {
  const value = casebook.sources.find((item) => item.source_key === sourceKey);
  if (!value) throw new Error("fixture_output_source_missing");
  return value;
}

function requiredOutputCase(
  casebook: PersonalPerspectiveSemanticCasebookV01,
  caseKey: string,
) {
  const value = casebook.cases.find((item) => item.case_key === caseKey);
  if (!value) throw new Error("fixture_output_case_missing");
  return value;
}
