import {
  canonicalizeProtocolValueV01,
  compareProtocolCanonicalV01,
  compareProtocolCodeUnitsV01,
  createProtocolSha256V01,
  isProtocolRecordV01,
  normalizeProtocolTextV01,
  parseStrictIsoTimestampV01,
  scanForbiddenProtocolMaterialV01,
} from "@/lib/vnext/protocol-primitives";
import {
  STRATEGY_COMPOSITION_CANONICALIZATION_V01,
  STRATEGY_COMPOSITION_CASE_VERSION_V01,
  STRATEGY_COMPOSITION_EVALUATION_DESIGN_VERSION_V01,
  STRATEGY_COMPOSITION_MAX_COMPONENTS_V01,
  STRATEGY_COMPOSITION_MAX_RELATIONS_V01,
  STRATEGY_COMPOSITION_MAX_ROLE_BINDINGS_V01,
  STRATEGY_COMPOSITION_MAX_SOURCE_REFS_V01,
  STRATEGY_COMPOSITION_MAX_TEXT_CHARACTERS_V01,
  STRATEGY_COMPOSITION_MAX_TEXT_ITEMS_V01,
  STRATEGY_COMPOSITION_ROLES_V01,
  type StrategyComponentCandidateV01,
  type StrategyCompositionAblationTargetV01,
  type StrategyCompositionAuthoritySummaryV01,
  type StrategyCompositionCaseBindingV01,
  type StrategyCompositionCaseReferenceV01,
  type StrategyCompositionCaseV01,
  type StrategyCompositionEvaluationDesignV01,
  type StrategyCompositionIntegrityV01,
  type StrategyCompositionMaterialBoundaryV01,
  type StrategyCompositionProvenanceRelationV01,
  type StrategyCompositionRelationV01,
  type StrategyCompositionRoleBindingV01,
  type StrategyCompositionSourceBindingV01,
} from "@/types/vnext/strategy-composition-case";

const SHA256_PATTERN = /^sha256:[a-f0-9]{64}$/u;
const SAFE_ID_PATTERN = /^[A-Za-z0-9:._-]{1,256}$/u;
const PENDING_CASE_ID = "strategy-composition-case:pending";
const PENDING_FINGERPRINT = `sha256:${"0".repeat(64)}`;

const ROOT_KEYS = [
  "case_version",
  "case_id",
  "case_kind",
  "case_binding",
  "source_refs",
  "components",
  "role_bindings",
  "relations",
  "evaluation_design",
  "limitations",
  "missingness",
  "scalar_fitness_created",
  "material_boundary",
  "authority_summary",
  "integrity",
] as const;

const BUILDER_KEYS = [
  "case_binding",
  "source_refs",
  "components",
  "role_bindings",
  "relations",
  "evaluation_design",
  "limitations",
  "missingness",
] as const;

export interface BuildStrategyCompositionCaseInputV01 {
  case_binding: StrategyCompositionCaseBindingV01;
  source_refs: StrategyCompositionSourceBindingV01[];
  components: StrategyComponentCandidateV01[];
  role_bindings: StrategyCompositionRoleBindingV01[];
  relations: StrategyCompositionRelationV01[];
  evaluation_design: StrategyCompositionEvaluationDesignV01;
  limitations: string[];
  missingness: string[];
}

export interface BuildStrategyCompositionAblationCaseInputV01 {
  parent_case: StrategyCompositionCaseV01;
  case_key: string;
  target: StrategyCompositionAblationTargetV01;
}

export interface StrategyCompositionValidationIssueV01 {
  code: string;
  path: string;
}

export interface StrategyCompositionValidationResultV01 {
  status: "valid" | "blocked";
  errors: StrategyCompositionValidationIssueV01[];
}

export class StrategyCompositionCaseErrorV01 extends Error {
  constructor(
    readonly code: string,
    readonly path: string = "$",
  ) {
    super(code);
    this.name = "StrategyCompositionCaseErrorV01";
  }
}

export function canonicalizeStrategyCompositionValueV01(value: unknown): string {
  return canonicalizeProtocolValueV01(value);
}

export function createStrategyCompositionCaseReferenceV01(
  value: StrategyCompositionCaseV01,
): StrategyCompositionCaseReferenceV01 {
  assertValidStrategyCompositionCaseV01(value);
  return {
    workspace_id: value.case_binding.workspace_id,
    project_id: value.case_binding.project_id,
    case_id: value.case_id,
    case_fingerprint: value.integrity.fingerprint,
    case_key: value.case_binding.case_key,
    task_family_key: value.case_binding.task_family_key,
    construction_cutoff: value.case_binding.construction_cutoff,
  };
}

export function deriveStrategyCompositionCaseIdV01(
  value: StrategyCompositionCaseV01,
): string {
  const copy = structuredClone(value) as StrategyCompositionCaseV01;
  copy.case_id = PENDING_CASE_ID;
  delete (copy.integrity as Partial<StrategyCompositionIntegrityV01>).fingerprint;
  return `strategy-composition-case:${createProtocolSha256V01(
    canonicalizeProtocolValueV01(copy),
  ).slice("sha256:".length, 39)}`;
}

export function createStrategyCompositionCaseFingerprintV01(
  value: StrategyCompositionCaseV01,
): string {
  const copy = structuredClone(value) as StrategyCompositionCaseV01;
  delete (copy.integrity as Partial<StrategyCompositionIntegrityV01>).fingerprint;
  return createProtocolSha256V01(canonicalizeProtocolValueV01(copy));
}

export function buildStrategyCompositionCaseV01(
  input: BuildStrategyCompositionCaseInputV01,
): StrategyCompositionCaseV01 {
  assertBuilderInputV01(input);
  const before = canonicalizeProtocolValueV01(input);
  const safeInput = structuredClone(input);
  assertSafeMaterialV01(safeInput);
  assertNoForbiddenSemanticFieldsV01(safeInput);
  assertBoundsV01(safeInput);

  const caseBinding = normalizeCaseBindingV01(safeInput.case_binding);
  const sourceRefs = normalizeSourceRefsV01(
    safeInput.source_refs,
    caseBinding,
  );
  const components = normalizeComponentsV01(
    safeInput.components,
    sourceRefs,
  );
  const roleBindings = normalizeRoleBindingsV01(
    safeInput.role_bindings,
    components,
  );
  const relations = normalizeRelationsV01(
    safeInput.relations,
    components,
  );
  const evaluationDesign = normalizeEvaluationDesignV01(
    safeInput.evaluation_design,
    caseBinding,
    sourceRefs,
    components,
    roleBindings,
    relations,
  );

  const value: StrategyCompositionCaseV01 = {
    case_version: STRATEGY_COMPOSITION_CASE_VERSION_V01,
    case_id: PENDING_CASE_ID,
    case_kind: "derived_rebuildable_offline_research_case",
    case_binding: caseBinding,
    source_refs: sourceRefs,
    components,
    role_bindings: roleBindings,
    relations,
    evaluation_design: evaluationDesign,
    limitations: uniqueTextItemsV01(safeInput.limitations, "$.limitations"),
    missingness: uniqueTextItemsV01(safeInput.missingness, "$.missingness"),
    scalar_fitness_created: false,
    material_boundary: createMaterialBoundaryV01(),
    authority_summary: createAuthoritySummaryV01(),
    integrity: pendingIntegrityV01(),
  };
  value.case_id = deriveStrategyCompositionCaseIdV01(value);
  value.integrity.fingerprint = createStrategyCompositionCaseFingerprintV01(value);
  assertValidStrategyCompositionCaseV01(value);
  if (canonicalizeProtocolValueV01(input) !== before) {
    failV01("strategy_composition_input_mutated");
  }
  return value;
}

export function buildStrategyCompositionAblationCaseV01(
  input: BuildStrategyCompositionAblationCaseInputV01,
): StrategyCompositionCaseV01 {
  if (!isProtocolRecordV01(input)) {
    failV01("strategy_composition_ablation_input_invalid");
  }
  assertExactKeysV01(input, ["parent_case", "case_key", "target"]);
  assertValidStrategyCompositionCaseV01(input.parent_case);
  const parent = structuredClone(input.parent_case);
  if (parent.evaluation_design.case_role === "baseline") {
    failV01("strategy_composition_ablation_baseline_parent_invalid");
  }
  const target = normalizeAblationTargetV01(input.target, "$.target");
  const removed = removeAblationTargetV01(parent, target);
  const child = buildStrategyCompositionCaseV01({
    case_binding: {
      ...parent.case_binding,
      case_key: requiredIdV01(input.case_key, "$.case_key"),
    },
    source_refs: parent.source_refs,
    components: removed.components,
    role_bindings: removed.role_bindings,
    relations: removed.relations,
    evaluation_design: {
      design_version: STRATEGY_COMPOSITION_EVALUATION_DESIGN_VERSION_V01,
      case_role: "ablation",
      baseline_case: parent.evaluation_design.baseline_case,
      parent_case: createStrategyCompositionCaseReferenceV01(parent),
      targets: [target],
      exactly_one_target: true,
      causal_contribution_claimed: false,
      superiority_claimed: false,
    },
    limitations: parent.limitations,
    missingness: parent.missingness,
  });
  assertValidStrategyCompositionAblationRelationV01(parent, child);
  return child;
}

export function validateStrategyCompositionCaseV01(
  input: unknown,
): StrategyCompositionValidationResultV01 {
  try {
    assertValidStrategyCompositionCaseV01(input);
    return { status: "valid", errors: [] };
  } catch (error) {
    return blockedResultV01(error);
  }
}

export function assertValidStrategyCompositionCaseV01(
  input: unknown,
): asserts input is StrategyCompositionCaseV01 {
  if (!isProtocolRecordV01(input)) {
    failV01("strategy_composition_case_invalid");
  }
  assertSafeMaterialV01(input);
  assertNoForbiddenSemanticFieldsV01(input);
  assertBoundsV01(input);
  assertExactKeysV01(input, ROOT_KEYS);
  if (
    input.case_version !== STRATEGY_COMPOSITION_CASE_VERSION_V01 ||
    input.case_kind !== "derived_rebuildable_offline_research_case" ||
    input.scalar_fitness_created !== false
  ) {
    failV01("strategy_composition_case_contract_invalid");
  }

  const value = input as unknown as StrategyCompositionCaseV01;
  assertCanonicalCaseBindingV01(value.case_binding);
  assertCanonicalSourceRefsV01(value.source_refs, value.case_binding);
  assertCanonicalComponentsV01(value.components, value.source_refs);
  assertCanonicalRoleBindingsV01(value.role_bindings, value.components);
  assertCanonicalRelationsV01(value.relations, value.components);
  assertCanonicalEvaluationDesignV01(
    value.evaluation_design,
    value.case_binding,
    value.source_refs,
    value.components,
    value.role_bindings,
    value.relations,
  );
  assertCanonicalUniqueTextItemsV01(value.limitations, "$.limitations");
  assertCanonicalUniqueTextItemsV01(value.missingness, "$.missingness");
  if (
    canonicalizeProtocolValueV01(value.material_boundary) !==
      canonicalizeProtocolValueV01(createMaterialBoundaryV01()) ||
    canonicalizeProtocolValueV01(value.authority_summary) !==
      canonicalizeProtocolValueV01(createAuthoritySummaryV01())
  ) {
    failV01("strategy_composition_authority_boundary_invalid");
  }
  assertIdentityV01(value);
}

export function validateStrategyCompositionAblationRelationV01(
  parent: unknown,
  child: unknown,
): StrategyCompositionValidationResultV01 {
  try {
    assertValidStrategyCompositionAblationRelationV01(parent, child);
    return { status: "valid", errors: [] };
  } catch (error) {
    return blockedResultV01(error);
  }
}

export function assertValidStrategyCompositionAblationRelationV01(
  parentInput: unknown,
  childInput: unknown,
): void {
  assertValidStrategyCompositionCaseV01(parentInput);
  assertValidStrategyCompositionCaseV01(childInput);
  const parent = parentInput;
  const child = childInput;
  if (child.evaluation_design.case_role !== "ablation") {
    failV01("strategy_composition_ablation_design_required");
  }
  if (
    canonicalizeProtocolValueV01(child.evaluation_design.parent_case) !==
    canonicalizeProtocolValueV01(createStrategyCompositionCaseReferenceV01(parent))
  ) {
    failV01("strategy_composition_ablation_parent_binding_mismatch");
  }
  if (
    parent.case_binding.workspace_id !== child.case_binding.workspace_id ||
    parent.case_binding.project_id !== child.case_binding.project_id ||
    parent.case_binding.task_family_key !== child.case_binding.task_family_key ||
    parent.case_binding.construction_cutoff !==
      child.case_binding.construction_cutoff ||
    parent.case_binding.synthetic !== child.case_binding.synthetic ||
    parent.case_binding.case_key === child.case_binding.case_key ||
    canonicalizeProtocolValueV01(parent.source_refs) !==
      canonicalizeProtocolValueV01(child.source_refs) ||
    canonicalizeProtocolValueV01(parent.limitations) !==
      canonicalizeProtocolValueV01(child.limitations) ||
    canonicalizeProtocolValueV01(parent.missingness) !==
      canonicalizeProtocolValueV01(child.missingness)
  ) {
    failV01("strategy_composition_ablation_non_target_mutation");
  }
  const target = child.evaluation_design.targets[0]!;
  const expected = removeAblationTargetV01(parent, target);
  if (
    canonicalizeProtocolValueV01(expected.components) !==
      canonicalizeProtocolValueV01(child.components) ||
    canonicalizeProtocolValueV01(expected.role_bindings) !==
      canonicalizeProtocolValueV01(child.role_bindings) ||
    canonicalizeProtocolValueV01(expected.relations) !==
      canonicalizeProtocolValueV01(child.relations)
  ) {
    failV01("strategy_composition_ablation_non_target_mutation");
  }
}

export function validateStrategyCompositionHoldoutRelationV01(
  parent: unknown,
  holdout: unknown,
): StrategyCompositionValidationResultV01 {
  try {
    assertValidStrategyCompositionCaseV01(parent);
    assertValidStrategyCompositionCaseV01(holdout);
    if (holdout.evaluation_design.case_role !== "holdout") {
      failV01("strategy_composition_holdout_design_required");
    }
    if (
      canonicalizeProtocolValueV01(
        holdout.evaluation_design.parent_development_case,
      ) !==
      canonicalizeProtocolValueV01(
        createStrategyCompositionCaseReferenceV01(parent),
      )
    ) {
      failV01("strategy_composition_holdout_parent_binding_mismatch");
    }
    if (
      parent.case_binding.workspace_id !== holdout.case_binding.workspace_id ||
      parent.case_binding.project_id !== holdout.case_binding.project_id ||
      canonicalizeProtocolValueV01(parent.components) !==
        canonicalizeProtocolValueV01(holdout.components)
    ) {
      failV01("strategy_composition_holdout_recombination_invalid");
    }
    return { status: "valid", errors: [] };
  } catch (error) {
    return blockedResultV01(error);
  }
}

function normalizeCaseBindingV01(
  input: StrategyCompositionCaseBindingV01,
): StrategyCompositionCaseBindingV01 {
  if (!isProtocolRecordV01(input)) failV01("strategy_composition_case_binding_invalid");
  assertExactKeysV01(input, [
    "workspace_id",
    "project_id",
    "case_key",
    "task_family_key",
    "construction_cutoff",
    "synthetic",
  ]);
  const result = {
    workspace_id: requiredIdV01(input.workspace_id, "$.case_binding.workspace_id"),
    project_id: requiredIdV01(input.project_id, "$.case_binding.project_id"),
    case_key: requiredIdV01(input.case_key, "$.case_binding.case_key"),
    task_family_key: requiredIdV01(
      input.task_family_key,
      "$.case_binding.task_family_key",
    ),
    construction_cutoff: requiredTimestampV01(
      input.construction_cutoff,
      "$.case_binding.construction_cutoff",
    ),
    synthetic: input.synthetic,
  };
  if (typeof result.synthetic !== "boolean") {
    failV01("strategy_composition_case_binding_invalid");
  }
  return result;
}

function assertCanonicalCaseBindingV01(
  input: StrategyCompositionCaseBindingV01,
): void {
  const normalized = normalizeCaseBindingV01(input);
  if (canonicalizeProtocolValueV01(input) !== canonicalizeProtocolValueV01(normalized)) {
    failV01("strategy_composition_noncanonical_value");
  }
}

function normalizeSourceRefsV01(
  input: StrategyCompositionSourceBindingV01[],
  caseBinding: StrategyCompositionCaseBindingV01,
): StrategyCompositionSourceBindingV01[] {
  if (!Array.isArray(input) || input.length < 1) {
    failV01("strategy_composition_source_refs_required");
  }
  const seen = new Set<string>();
  const result = input.map((source, index) => {
    const path = `$.source_refs[${index}]`;
    if (!isProtocolRecordV01(source)) failV01("strategy_composition_source_binding_invalid", path);
    assertExactKeysV01(source, [
      "source_ref_id",
      "source_kind",
      "source_use",
      "workspace_id",
      "project_id",
      "source_id",
      "source_fingerprint",
      "observed_at",
      "available_at",
      "epistemic_status",
    ]);
    const normalized: StrategyCompositionSourceBindingV01 = {
      source_ref_id: requiredIdV01(source.source_ref_id, `${path}.source_ref_id`),
      source_kind: source.source_kind,
      source_use: source.source_use,
      workspace_id: requiredIdV01(source.workspace_id, `${path}.workspace_id`),
      project_id: requiredIdV01(source.project_id, `${path}.project_id`),
      source_id: requiredIdV01(source.source_id, `${path}.source_id`),
      source_fingerprint: requiredFingerprintV01(
        source.source_fingerprint,
        `${path}.source_fingerprint`,
      ),
      observed_at: requiredTimestampV01(source.observed_at, `${path}.observed_at`),
      available_at: requiredTimestampV01(source.available_at, `${path}.available_at`),
      epistemic_status: source.epistemic_status,
    };
    if (
      ![
        "task_context_packet",
        "run_receipt",
        "context_use_review",
        "criterion_assessment",
        "strategic_advantage_transfer_item",
        "accepted_semantic_source",
        "synthetic_fixture",
        "evaluation_outcome",
        "other_source",
      ].includes(normalized.source_kind) ||
      ![
        "construction_input",
        "design_reference",
        "withheld_holdout",
        "evaluation_outcome",
        "adverse_association",
      ].includes(normalized.source_use) ||
      !["observed", "attested", "derived", "unknown"].includes(
        normalized.epistemic_status,
      )
    ) {
      failV01("strategy_composition_source_binding_invalid", path);
    }
    if (
      normalized.workspace_id !== caseBinding.workspace_id ||
      normalized.project_id !== caseBinding.project_id
    ) {
      failV01("strategy_composition_workspace_project_mismatch", path);
    }
    const observed = parseStrictIsoTimestampV01(normalized.observed_at)!;
    const available = parseStrictIsoTimestampV01(normalized.available_at)!;
    const cutoff = parseStrictIsoTimestampV01(caseBinding.construction_cutoff)!;
    if (available < observed) {
      failV01("strategy_composition_source_chronology_invalid", path);
    }
    if (normalized.source_use === "construction_input" && available > cutoff) {
      failV01("strategy_composition_post_cutoff_construction_source", path);
    }
    if (
      (normalized.source_use === "evaluation_outcome") !==
      (normalized.source_kind === "evaluation_outcome")
    ) {
      failV01("strategy_composition_source_use_conflict", path);
    }
    if (seen.has(normalized.source_ref_id)) {
      failV01("strategy_composition_duplicate_source_ref_id", path);
    }
    seen.add(normalized.source_ref_id);
    return normalized;
  });
  return result.sort((left, right) =>
    compareProtocolCodeUnitsV01(left.source_ref_id, right.source_ref_id),
  );
}

function assertCanonicalSourceRefsV01(
  input: StrategyCompositionSourceBindingV01[],
  caseBinding: StrategyCompositionCaseBindingV01,
): void {
  const normalized = normalizeSourceRefsV01(input, caseBinding);
  if (canonicalizeProtocolValueV01(input) !== canonicalizeProtocolValueV01(normalized)) {
    failV01("strategy_composition_noncanonical_value");
  }
}

function normalizeComponentsV01(
  input: StrategyComponentCandidateV01[],
  sources: StrategyCompositionSourceBindingV01[],
): StrategyComponentCandidateV01[] {
  if (!Array.isArray(input) || input.length < 1) {
    failV01("strategy_composition_components_required");
  }
  const sourceMap = new Map(sources.map((source) => [source.source_ref_id, source]));
  const seen = new Set<string>();
  const result = input.map((component, index) => {
    const path = `$.components[${index}]`;
    if (!isProtocolRecordV01(component)) failV01("strategy_composition_component_invalid", path);
    assertExactKeysV01(component, [
      "component_id",
      "title",
      "summary",
      "procedural_function",
      "applicability_condition",
      "source_ref_ids",
      "expected_effect",
      "falsifier",
      "uncertainty",
      "limitations",
      "provenance_relations",
      "accepted_strategy",
    ]);
    const componentId = requiredIdV01(component.component_id, `${path}.component_id`);
    if (seen.has(componentId)) {
      failV01("strategy_composition_duplicate_component_id", path);
    }
    seen.add(componentId);
    const sourceRefIds = uniqueIdsV01(component.source_ref_ids, `${path}.source_ref_ids`);
    if (sourceRefIds.length < 1) {
      failV01("strategy_composition_component_source_required", path);
    }
    for (const sourceRefId of sourceRefIds) {
      const source = sourceMap.get(sourceRefId);
      if (!source) failV01("strategy_composition_dangling_source_ref", path);
      if (source.source_use !== "construction_input") {
        failV01("strategy_composition_component_source_leakage", path);
      }
    }
    if (component.accepted_strategy !== false) {
      failV01("strategy_composition_authority_boundary_invalid", `${path}.accepted_strategy`);
    }
    const provenance = normalizeProvenanceRelationsV01(
      component.provenance_relations,
      sourceRefIds,
      sourceMap,
      `${path}.provenance_relations`,
    );
    return {
      component_id: componentId,
      title: requiredTextV01(component.title, `${path}.title`),
      summary: requiredTextV01(component.summary, `${path}.summary`),
      procedural_function: requiredTextV01(
        component.procedural_function,
        `${path}.procedural_function`,
      ),
      applicability_condition: requiredTextV01(
        component.applicability_condition,
        `${path}.applicability_condition`,
      ),
      source_ref_ids: sourceRefIds,
      expected_effect: requiredTextV01(
        component.expected_effect,
        `${path}.expected_effect`,
      ),
      falsifier: requiredTextV01(component.falsifier, `${path}.falsifier`),
      uncertainty: uniqueTextItemsV01(
        component.uncertainty,
        `${path}.uncertainty`,
      ),
      limitations: uniqueTextItemsV01(
        component.limitations,
        `${path}.limitations`,
      ),
      provenance_relations: provenance,
      accepted_strategy: false as const,
    };
  });
  return result.sort((left, right) =>
    compareProtocolCodeUnitsV01(left.component_id, right.component_id),
  );
}

function normalizeProvenanceRelationsV01(
  input: StrategyCompositionProvenanceRelationV01[],
  componentSourceRefs: string[],
  sourceMap: Map<string, StrategyCompositionSourceBindingV01>,
  path: string,
): StrategyCompositionProvenanceRelationV01[] {
  if (!Array.isArray(input)) failV01("strategy_composition_provenance_invalid", path);
  const unique = new Map<string, StrategyCompositionProvenanceRelationV01>();
  input.forEach((relation, index) => {
    const itemPath = `${path}[${index}]`;
    if (!isProtocolRecordV01(relation)) failV01("strategy_composition_provenance_invalid", itemPath);
    assertExactKeysV01(relation, [
      "source_ref_id",
      "relation_kind",
      "accepted_component",
      "verified_benefit",
      "causal_evidence",
      "product_promotion",
    ]);
    const sourceRefId = requiredIdV01(relation.source_ref_id, `${itemPath}.source_ref_id`);
    const source = sourceMap.get(sourceRefId);
    if (!source || !componentSourceRefs.includes(sourceRefId)) {
      failV01("strategy_composition_provenance_source_mismatch", itemPath);
    }
    if (
      ![
        "strategic_advantage_transfer_hypothesis",
        "accepted_semantic_source",
        "other_source",
      ].includes(relation.relation_kind)
    ) {
      failV01("strategy_composition_provenance_invalid", itemPath);
    }
    if (
      relation.relation_kind === "strategic_advantage_transfer_hypothesis" &&
      source.source_kind !== "strategic_advantage_transfer_item"
    ) {
      failV01("strategy_composition_strategic_transfer_source_mismatch", itemPath);
    }
    if (
      relation.relation_kind === "accepted_semantic_source" &&
      source.source_kind !== "accepted_semantic_source"
    ) {
      failV01("strategy_composition_semantic_source_mismatch", itemPath);
    }
    if (
      relation.accepted_component !== false ||
      relation.verified_benefit !== false ||
      relation.causal_evidence !== false ||
      relation.product_promotion !== false
    ) {
      failV01("strategy_composition_provenance_authority_invalid", itemPath);
    }
    const normalized = {
      source_ref_id: sourceRefId,
      relation_kind: relation.relation_kind,
      accepted_component: false as const,
      verified_benefit: false as const,
      causal_evidence: false as const,
      product_promotion: false as const,
    };
    const key = `${sourceRefId}|${relation.relation_kind}`;
    if (!unique.has(key)) unique.set(key, normalized);
  });
  return [...unique.values()].sort(compareProtocolCanonicalV01);
}

function assertCanonicalComponentsV01(
  input: StrategyComponentCandidateV01[],
  sources: StrategyCompositionSourceBindingV01[],
): void {
  const normalized = normalizeComponentsV01(input, sources);
  if (canonicalizeProtocolValueV01(input) !== canonicalizeProtocolValueV01(normalized)) {
    failV01("strategy_composition_noncanonical_value");
  }
}

function normalizeRoleBindingsV01(
  input: StrategyCompositionRoleBindingV01[],
  components: StrategyComponentCandidateV01[],
): StrategyCompositionRoleBindingV01[] {
  if (!Array.isArray(input)) failV01("strategy_composition_role_bindings_invalid");
  const componentIds = new Set(components.map((component) => component.component_id));
  const roles = new Set<string>();
  const result = input.map((binding, index) => {
    const path = `$.role_bindings[${index}]`;
    if (!isProtocolRecordV01(binding)) failV01("strategy_composition_role_binding_invalid", path);
    assertExactKeysV01(binding, [
      "role",
      "component_id",
      "rationale",
      "actor_identity_included",
    ]);
    if (!STRATEGY_COMPOSITION_ROLES_V01.includes(binding.role)) {
      failV01("strategy_composition_role_invalid", `${path}.role`);
    }
    const componentId = requiredIdV01(binding.component_id, `${path}.component_id`);
    if (!componentIds.has(componentId)) {
      failV01("strategy_composition_dangling_component_ref", path);
    }
    if (roles.has(binding.role)) {
      failV01("strategy_composition_conflicting_role_binding", path);
    }
    roles.add(binding.role);
    if (binding.actor_identity_included !== false) {
      failV01("strategy_composition_actor_identity_forbidden", path);
    }
    return {
      role: binding.role,
      component_id: componentId,
      rationale: requiredTextV01(binding.rationale, `${path}.rationale`),
      actor_identity_included: false as const,
    };
  });
  return result.sort((left, right) =>
    compareProtocolCodeUnitsV01(left.role, right.role),
  );
}

function assertCanonicalRoleBindingsV01(
  input: StrategyCompositionRoleBindingV01[],
  components: StrategyComponentCandidateV01[],
): void {
  const normalized = normalizeRoleBindingsV01(input, components);
  if (canonicalizeProtocolValueV01(input) !== canonicalizeProtocolValueV01(normalized)) {
    failV01("strategy_composition_noncanonical_value");
  }
}

function normalizeRelationsV01(
  input: StrategyCompositionRelationV01[],
  components: StrategyComponentCandidateV01[],
): StrategyCompositionRelationV01[] {
  if (!Array.isArray(input)) failV01("strategy_composition_relations_invalid");
  const componentIds = new Set(components.map((component) => component.component_id));
  const unique = new Map<string, StrategyCompositionRelationV01>();
  input.forEach((relation, index) => {
    const path = `$.relations[${index}]`;
    if (!isProtocolRecordV01(relation)) failV01("strategy_composition_relation_invalid", path);
    assertExactKeysV01(relation, [
      "relation_kind",
      "subject_component_id",
      "object_component_id",
    ]);
    if (!(["must_precede", "depends_on"] as const).includes(relation.relation_kind)) {
      failV01("strategy_composition_relation_kind_invalid", path);
    }
    const normalized = {
      relation_kind: relation.relation_kind,
      subject_component_id: requiredIdV01(
        relation.subject_component_id,
        `${path}.subject_component_id`,
      ),
      object_component_id: requiredIdV01(
        relation.object_component_id,
        `${path}.object_component_id`,
      ),
    };
    if (
      !componentIds.has(normalized.subject_component_id) ||
      !componentIds.has(normalized.object_component_id)
    ) {
      failV01("strategy_composition_dangling_component_ref", path);
    }
    if (normalized.subject_component_id === normalized.object_component_id) {
      failV01("strategy_composition_self_edge", path);
    }
    unique.set(relationKeyV01(normalized), normalized);
  });
  const result = [...unique.values()].sort(compareProtocolCanonicalV01);
  assertAcyclicV01(result, componentIds);
  return result;
}

function assertCanonicalRelationsV01(
  input: StrategyCompositionRelationV01[],
  components: StrategyComponentCandidateV01[],
): void {
  const normalized = normalizeRelationsV01(input, components);
  if (canonicalizeProtocolValueV01(input) !== canonicalizeProtocolValueV01(normalized)) {
    failV01("strategy_composition_noncanonical_value");
  }
}

function assertAcyclicV01(
  relations: StrategyCompositionRelationV01[],
  componentIds: Set<string>,
): void {
  const next = new Map<string, Set<string>>(
    [...componentIds].map((componentId) => [componentId, new Set<string>()]),
  );
  for (const relation of relations) {
    const from =
      relation.relation_kind === "must_precede"
        ? relation.subject_component_id
        : relation.object_component_id;
    const to =
      relation.relation_kind === "must_precede"
        ? relation.object_component_id
        : relation.subject_component_id;
    next.get(from)!.add(to);
  }
  const visiting = new Set<string>();
  const visited = new Set<string>();
  const visit = (componentId: string) => {
    if (visiting.has(componentId)) failV01("strategy_composition_relation_cycle");
    if (visited.has(componentId)) return;
    visiting.add(componentId);
    for (const target of [...next.get(componentId)!].sort(compareProtocolCodeUnitsV01)) {
      visit(target);
    }
    visiting.delete(componentId);
    visited.add(componentId);
  };
  for (const componentId of [...componentIds].sort(compareProtocolCodeUnitsV01)) {
    visit(componentId);
  }
}

function normalizeEvaluationDesignV01(
  input: StrategyCompositionEvaluationDesignV01,
  caseBinding: StrategyCompositionCaseBindingV01,
  sources: StrategyCompositionSourceBindingV01[],
  components: StrategyComponentCandidateV01[],
  roles: StrategyCompositionRoleBindingV01[],
  relations: StrategyCompositionRelationV01[],
): StrategyCompositionEvaluationDesignV01 {
  if (!isProtocolRecordV01(input)) failV01("strategy_composition_evaluation_design_invalid");
  if (input.design_version !== STRATEGY_COMPOSITION_EVALUATION_DESIGN_VERSION_V01) {
    failV01("strategy_composition_evaluation_design_version_invalid");
  }
  if (input.superiority_claimed !== false) {
    failV01("strategy_composition_superiority_claim_forbidden");
  }
  if (input.case_role === "baseline") {
    assertExactKeysV01(input, [
      "design_version",
      "case_role",
      "baseline_case",
      "superiority_claimed",
    ]);
    if (input.baseline_case !== null) {
      failV01("strategy_composition_baseline_self_binding_invalid");
    }
    return structuredClone(input);
  }
  if (input.case_role === "development") {
    assertExactKeysV01(input, [
      "design_version",
      "case_role",
      "baseline_case",
      "superiority_claimed",
    ]);
    return {
      ...structuredClone(input),
      baseline_case: normalizeCaseReferenceV01(
        input.baseline_case,
        "$.evaluation_design.baseline_case",
        caseBinding,
      ),
    };
  }
  if (input.case_role === "holdout") {
    assertExactKeysV01(input, [
      "design_version",
      "case_role",
      "baseline_case",
      "parent_development_case",
      "development_task_family_key",
      "holdout_task_family_key",
      "frozen_cutoff",
      "withheld_source_ref_ids",
      "evaluation_outcome_source_ref_ids",
      "development_outcome_included",
      "holdout_success_claimed",
      "superiority_claimed",
    ]);
    const result = {
      ...structuredClone(input),
      baseline_case: normalizeCaseReferenceV01(
        input.baseline_case,
        "$.evaluation_design.baseline_case",
        caseBinding,
      ),
      parent_development_case: normalizeCaseReferenceV01(
        input.parent_development_case,
        "$.evaluation_design.parent_development_case",
        caseBinding,
      ),
      development_task_family_key: requiredIdV01(
        input.development_task_family_key,
        "$.evaluation_design.development_task_family_key",
      ),
      holdout_task_family_key: requiredIdV01(
        input.holdout_task_family_key,
        "$.evaluation_design.holdout_task_family_key",
      ),
      frozen_cutoff: requiredTimestampV01(
        input.frozen_cutoff,
        "$.evaluation_design.frozen_cutoff",
      ),
      withheld_source_ref_ids: uniqueIdsV01(
        input.withheld_source_ref_ids,
        "$.evaluation_design.withheld_source_ref_ids",
      ),
      evaluation_outcome_source_ref_ids: uniqueIdsV01(
        input.evaluation_outcome_source_ref_ids,
        "$.evaluation_design.evaluation_outcome_source_ref_ids",
      ),
    };
    validateHoldoutDesignV01(result, caseBinding, sources, components);
    return result;
  }
  if (input.case_role === "ablation") {
    assertExactKeysV01(input, [
      "design_version",
      "case_role",
      "baseline_case",
      "parent_case",
      "targets",
      "exactly_one_target",
      "causal_contribution_claimed",
      "superiority_claimed",
    ]);
    const result = {
      ...structuredClone(input),
      baseline_case: normalizeCaseReferenceV01(
        input.baseline_case,
        "$.evaluation_design.baseline_case",
        caseBinding,
      ),
      parent_case: normalizeCaseReferenceV01(
        input.parent_case,
        "$.evaluation_design.parent_case",
        caseBinding,
      ),
      targets: Array.isArray(input.targets)
        ? input.targets.map((target, index) =>
            normalizeAblationTargetV01(
              target,
              `$.evaluation_design.targets[${index}]`,
            ),
          )
        : [],
    };
    validateAblationDesignV01(result, caseBinding, components, roles, relations);
    return result;
  }
  if (input.case_role === "negative_transfer") {
    assertExactKeysV01(input, [
      "design_version",
      "case_role",
      "baseline_case",
      "origin_case",
      "origin_task_family_key",
      "target_task_family_key",
      "transfer_hypothesis_source_ref_ids",
      "adverse_association_source_ref_ids",
      "observed_adverse_association",
      "negative_transfer_candidate",
      "causal_negative_contribution_claimed",
      "general_harm_claimed",
      "superiority_claimed",
    ]);
    const result = {
      ...structuredClone(input),
      baseline_case: normalizeCaseReferenceV01(
        input.baseline_case,
        "$.evaluation_design.baseline_case",
        caseBinding,
      ),
      origin_case: normalizeCaseReferenceV01(
        input.origin_case,
        "$.evaluation_design.origin_case",
        caseBinding,
      ),
      origin_task_family_key: requiredIdV01(
        input.origin_task_family_key,
        "$.evaluation_design.origin_task_family_key",
      ),
      target_task_family_key: requiredIdV01(
        input.target_task_family_key,
        "$.evaluation_design.target_task_family_key",
      ),
      transfer_hypothesis_source_ref_ids: uniqueIdsV01(
        input.transfer_hypothesis_source_ref_ids,
        "$.evaluation_design.transfer_hypothesis_source_ref_ids",
      ),
      adverse_association_source_ref_ids: uniqueIdsV01(
        input.adverse_association_source_ref_ids,
        "$.evaluation_design.adverse_association_source_ref_ids",
      ),
    };
    validateNegativeTransferDesignV01(result, caseBinding, sources);
    return result;
  }
  failV01("strategy_composition_case_role_invalid");
}

function assertCanonicalEvaluationDesignV01(
  input: StrategyCompositionEvaluationDesignV01,
  caseBinding: StrategyCompositionCaseBindingV01,
  sources: StrategyCompositionSourceBindingV01[],
  components: StrategyComponentCandidateV01[],
  roles: StrategyCompositionRoleBindingV01[],
  relations: StrategyCompositionRelationV01[],
): void {
  const normalized = normalizeEvaluationDesignV01(
    input,
    caseBinding,
    sources,
    components,
    roles,
    relations,
  );
  if (canonicalizeProtocolValueV01(input) !== canonicalizeProtocolValueV01(normalized)) {
    failV01("strategy_composition_noncanonical_value");
  }
}

function validateHoldoutDesignV01(
  design: Extract<StrategyCompositionEvaluationDesignV01, { case_role: "holdout" }>,
  caseBinding: StrategyCompositionCaseBindingV01,
  sources: StrategyCompositionSourceBindingV01[],
  components: StrategyComponentCandidateV01[],
): void {
  if (
    design.development_outcome_included !== false ||
    design.holdout_success_claimed !== false
  ) {
    failV01("strategy_composition_holdout_authority_invalid");
  }
  if (
    design.holdout_task_family_key !== caseBinding.task_family_key ||
    design.frozen_cutoff !== caseBinding.construction_cutoff ||
    design.parent_development_case.task_family_key !==
      design.development_task_family_key ||
    design.parent_development_case.case_key === caseBinding.case_key ||
    design.development_task_family_key === design.holdout_task_family_key
  ) {
    failV01("strategy_composition_holdout_identity_contamination");
  }
  if (
    design.withheld_source_ref_ids.length < 1 ||
    design.evaluation_outcome_source_ref_ids.length < 1
  ) {
    failV01("strategy_composition_holdout_sources_required");
  }
  const sourceMap = new Map(sources.map((source) => [source.source_ref_id, source]));
  const withheld = new Set(design.withheld_source_ref_ids);
  const outcomes = new Set(design.evaluation_outcome_source_ref_ids);
  for (const sourceRefId of withheld) {
    const source = sourceMap.get(sourceRefId);
    if (!source || source.source_use !== "withheld_holdout") {
      failV01("strategy_composition_holdout_source_binding_invalid");
    }
    if (outcomes.has(sourceRefId)) failV01("strategy_composition_holdout_leakage");
  }
  const cutoff = parseStrictIsoTimestampV01(caseBinding.construction_cutoff)!;
  for (const sourceRefId of outcomes) {
    const source = sourceMap.get(sourceRefId);
    if (!source || source.source_use !== "evaluation_outcome") {
      failV01("strategy_composition_holdout_source_binding_invalid");
    }
    if (
      parseStrictIsoTimestampV01(source.observed_at)! <= cutoff ||
      parseStrictIsoTimestampV01(source.available_at)! <= cutoff
    ) {
      failV01("strategy_composition_holdout_cutoff_outcome_invalid");
    }
  }
  const componentSources = new Set(components.flatMap((component) => component.source_ref_ids));
  if ([...withheld, ...outcomes].some((sourceRefId) => componentSources.has(sourceRefId))) {
    failV01("strategy_composition_holdout_leakage");
  }
}

function validateAblationDesignV01(
  design: Extract<StrategyCompositionEvaluationDesignV01, { case_role: "ablation" }>,
  caseBinding: StrategyCompositionCaseBindingV01,
  components: StrategyComponentCandidateV01[],
  roles: StrategyCompositionRoleBindingV01[],
  relations: StrategyCompositionRelationV01[],
): void {
  if (
    design.targets.length !== 1 ||
    design.exactly_one_target !== true
  ) {
    failV01("strategy_composition_ablation_target_count_invalid");
  }
  if (design.causal_contribution_claimed !== false) {
    failV01("strategy_composition_ablation_causality_forbidden");
  }
  if (
    design.parent_case.case_key === caseBinding.case_key ||
    design.parent_case.task_family_key !== caseBinding.task_family_key ||
    design.parent_case.construction_cutoff !== caseBinding.construction_cutoff
  ) {
    failV01("strategy_composition_ablation_identity_invalid");
  }
  const target = design.targets[0]!;
  if (
    (target.target_kind === "component" &&
      components.some((component) => component.component_id === target.component_id)) ||
    (target.target_kind === "role_binding" &&
      roles.some(
        (binding) =>
          binding.role === target.role &&
          binding.component_id === target.component_id,
      )) ||
    (target.target_kind === "relation" &&
      relations.some((relation) => relationKeyV01(relation) === relationKeyV01(target)))
  ) {
    failV01("strategy_composition_ablation_target_not_removed");
  }
}

function validateNegativeTransferDesignV01(
  design: Extract<StrategyCompositionEvaluationDesignV01, { case_role: "negative_transfer" }>,
  caseBinding: StrategyCompositionCaseBindingV01,
  sources: StrategyCompositionSourceBindingV01[],
): void {
  if (
    design.negative_transfer_candidate !== true ||
    design.causal_negative_contribution_claimed !== false ||
    design.general_harm_claimed !== false
  ) {
    failV01("strategy_composition_negative_transfer_authority_invalid");
  }
  if (
    design.target_task_family_key !== caseBinding.task_family_key ||
    design.origin_case.task_family_key !== design.origin_task_family_key ||
    design.origin_task_family_key === design.target_task_family_key
  ) {
    failV01("strategy_composition_negative_transfer_identity_invalid");
  }
  if (design.transfer_hypothesis_source_ref_ids.length < 1) {
    failV01("strategy_composition_negative_transfer_source_required");
  }
  const sourceMap = new Map(sources.map((source) => [source.source_ref_id, source]));
  for (const sourceRefId of design.transfer_hypothesis_source_ref_ids) {
    const source = sourceMap.get(sourceRefId);
    if (
      !source ||
      source.source_kind !== "strategic_advantage_transfer_item" ||
      source.source_use !== "construction_input"
    ) {
      failV01("strategy_composition_negative_transfer_source_invalid");
    }
  }
  for (const sourceRefId of design.adverse_association_source_ref_ids) {
    const source = sourceMap.get(sourceRefId);
    if (!source || source.source_use !== "adverse_association") {
      failV01("strategy_composition_negative_transfer_adverse_source_invalid");
    }
  }
  if (
    (design.observed_adverse_association === "supplied") !==
      (design.adverse_association_source_ref_ids.length > 0) ||
    !["supplied", "not_supplied"].includes(design.observed_adverse_association)
  ) {
    failV01("strategy_composition_negative_transfer_association_invalid");
  }
}

function normalizeCaseReferenceV01(
  input: StrategyCompositionCaseReferenceV01,
  path: string,
  caseBinding: StrategyCompositionCaseBindingV01,
): StrategyCompositionCaseReferenceV01 {
  if (!isProtocolRecordV01(input)) {
    failV01("strategy_composition_case_reference_invalid", path);
  }
  assertExactKeysV01(input, [
    "workspace_id",
    "project_id",
    "case_id",
    "case_fingerprint",
    "case_key",
    "task_family_key",
    "construction_cutoff",
  ]);
  const result = {
    workspace_id: requiredIdV01(input.workspace_id, `${path}.workspace_id`),
    project_id: requiredIdV01(input.project_id, `${path}.project_id`),
    case_id: requiredIdV01(input.case_id, `${path}.case_id`),
    case_fingerprint: requiredFingerprintV01(
      input.case_fingerprint,
      `${path}.case_fingerprint`,
    ),
    case_key: requiredIdV01(input.case_key, `${path}.case_key`),
    task_family_key: requiredIdV01(
      input.task_family_key,
      `${path}.task_family_key`,
    ),
    construction_cutoff: requiredTimestampV01(
      input.construction_cutoff,
      `${path}.construction_cutoff`,
    ),
  };
  if (
    result.workspace_id !== caseBinding.workspace_id ||
    result.project_id !== caseBinding.project_id
  ) {
    failV01("strategy_composition_case_reference_scope_mismatch", path);
  }
  return result;
}

function normalizeAblationTargetV01(
  input: StrategyCompositionAblationTargetV01,
  path: string,
): StrategyCompositionAblationTargetV01 {
  if (!isProtocolRecordV01(input)) failV01("strategy_composition_ablation_target_invalid", path);
  if (input.target_kind === "component") {
    assertExactKeysV01(input, ["target_kind", "component_id"]);
    return {
      target_kind: "component",
      component_id: requiredIdV01(input.component_id, `${path}.component_id`),
    };
  }
  if (input.target_kind === "role_binding") {
    assertExactKeysV01(input, ["target_kind", "role", "component_id"]);
    if (!STRATEGY_COMPOSITION_ROLES_V01.includes(input.role)) {
      failV01("strategy_composition_ablation_target_invalid", path);
    }
    return {
      target_kind: "role_binding",
      role: input.role,
      component_id: requiredIdV01(input.component_id, `${path}.component_id`),
    };
  }
  if (input.target_kind === "relation") {
    assertExactKeysV01(input, [
      "target_kind",
      "relation_kind",
      "subject_component_id",
      "object_component_id",
    ]);
    if (!(["must_precede", "depends_on"] as const).includes(input.relation_kind)) {
      failV01("strategy_composition_ablation_target_invalid", path);
    }
    return {
      target_kind: "relation",
      relation_kind: input.relation_kind,
      subject_component_id: requiredIdV01(
        input.subject_component_id,
        `${path}.subject_component_id`,
      ),
      object_component_id: requiredIdV01(
        input.object_component_id,
        `${path}.object_component_id`,
      ),
    };
  }
  failV01("strategy_composition_ablation_target_invalid", path);
}

function removeAblationTargetV01(
  parent: StrategyCompositionCaseV01,
  target: StrategyCompositionAblationTargetV01,
): Pick<StrategyCompositionCaseV01, "components" | "role_bindings" | "relations"> {
  const components = structuredClone(parent.components);
  const roleBindings = structuredClone(parent.role_bindings);
  const relations = structuredClone(parent.relations);
  if (target.target_kind === "component") {
    if (!components.some((component) => component.component_id === target.component_id)) {
      failV01("strategy_composition_ablation_target_missing");
    }
    return {
      components: components.filter(
        (component) => component.component_id !== target.component_id,
      ),
      role_bindings: roleBindings.filter(
        (binding) => binding.component_id !== target.component_id,
      ),
      relations: relations.filter(
        (relation) =>
          relation.subject_component_id !== target.component_id &&
          relation.object_component_id !== target.component_id,
      ),
    };
  }
  if (target.target_kind === "role_binding") {
    const matches = (binding: StrategyCompositionRoleBindingV01) =>
      binding.role === target.role && binding.component_id === target.component_id;
    if (!roleBindings.some(matches)) {
      failV01("strategy_composition_ablation_target_missing");
    }
    return {
      components,
      role_bindings: roleBindings.filter((binding) => !matches(binding)),
      relations,
    };
  }
  const targetKey = relationKeyV01(target);
  if (!relations.some((relation) => relationKeyV01(relation) === targetKey)) {
    failV01("strategy_composition_ablation_target_missing");
  }
  return {
    components,
    role_bindings: roleBindings,
    relations: relations.filter(
      (relation) => relationKeyV01(relation) !== targetKey,
    ),
  };
}

function relationKeyV01(
  relation: Pick<
    StrategyCompositionRelationV01,
    "relation_kind" | "subject_component_id" | "object_component_id"
  >,
): string {
  return [
    relation.relation_kind,
    relation.subject_component_id,
    relation.object_component_id,
  ].join("|");
}

function assertBuilderInputV01(input: BuildStrategyCompositionCaseInputV01): void {
  if (!isProtocolRecordV01(input)) failV01("strategy_composition_builder_input_invalid");
  assertSafeMaterialV01(input);
  assertNoForbiddenSemanticFieldsV01(input);
  assertExactKeysV01(input, BUILDER_KEYS);
}

function assertIdentityV01(value: StrategyCompositionCaseV01): void {
  if (
    value.case_id !== deriveStrategyCompositionCaseIdV01(value) ||
    value.integrity.algorithm !== "sha256" ||
    value.integrity.canonicalization !==
      STRATEGY_COMPOSITION_CANONICALIZATION_V01 ||
    value.integrity.fingerprint_scope !==
      "object_without_integrity_fingerprint" ||
    !SHA256_PATTERN.test(value.integrity.fingerprint) ||
    value.integrity.fingerprint !==
      createStrategyCompositionCaseFingerprintV01(value)
  ) {
    failV01("strategy_composition_identity_fingerprint_invalid");
  }
}

function createMaterialBoundaryV01(): StrategyCompositionMaterialBoundaryV01 {
  return {
    bounded: true,
    max_components: STRATEGY_COMPOSITION_MAX_COMPONENTS_V01,
    max_role_bindings: STRATEGY_COMPOSITION_MAX_ROLE_BINDINGS_V01,
    max_relations: STRATEGY_COMPOSITION_MAX_RELATIONS_V01,
    max_source_refs: STRATEGY_COMPOSITION_MAX_SOURCE_REFS_V01,
    max_text_items: STRATEGY_COMPOSITION_MAX_TEXT_ITEMS_V01,
    max_text_characters: STRATEGY_COMPOSITION_MAX_TEXT_CHARACTERS_V01,
    raw_prompt_included: false,
    raw_transcript_included: false,
    raw_terminal_output_included: false,
    raw_provider_output_included: false,
    hidden_reasoning_included: false,
    credential_or_secret_included: false,
    absolute_local_path_included: false,
    actor_identity_included: false,
  };
}

function createAuthoritySummaryV01(): StrategyCompositionAuthoritySummaryV01 {
  return {
    is_canonical_core_record: false,
    is_accepted_strategy: false,
    is_evidence: false,
    is_policy: false,
    is_execution_plan: false,
    is_proposal: false,
    is_review_decision: false,
    is_transition: false,
    creates_actor_identity: false,
    writes_database: false,
    mutates_source_records: false,
    mutates_semantic_state: false,
    mutates_task_context_packet: false,
    selects_context: false,
    activates_policy: false,
    authorizes_execution: false,
    authorizes_provider_calls: false,
    authorizes_network_use: false,
    authorizes_external_actuation: false,
    authorizes_github_mutation: false,
    authorizes_publication: false,
    authorizes_merge: false,
    claims_verified_benefit: false,
    claims_causal_contribution: false,
    claims_general_harm: false,
    promotes_component_or_strategy: false,
    notes: [
      "Component Candidate is not Accepted Strategy; Component is not Role Binding or Actor Identity.",
      "Composition Hypothesis is not Execution Plan; Expected Effect is not Verified Benefit.",
      "Holdout Design is not Holdout Success; Ablation Design is not Causal Contribution.",
      "Negative-Transfer Candidate is not General Harm; Casebook is not Evidence, Policy, Decision, or Transition.",
    ],
  };
}

function pendingIntegrityV01(): StrategyCompositionIntegrityV01 {
  return {
    algorithm: "sha256",
    canonicalization: STRATEGY_COMPOSITION_CANONICALIZATION_V01,
    fingerprint_scope: "object_without_integrity_fingerprint",
    fingerprint: PENDING_FINGERPRINT,
  };
}

function assertSafeMaterialV01(value: unknown): void {
  const issues: string[] = [];
  scanForbiddenProtocolMaterialV01(
    value,
    "$",
    {
      error: (code) => issues.push(code),
      warning: () => {},
    },
    {
      secret_material_message:
        "Secret-shaped material is forbidden in Strategy Composition cases.",
      provider_specific_field_message:
        "Provider-specific identity is forbidden in Strategy Composition cases.",
      allowed_false_invariant_fields: new Set([
        "raw_prompt_included",
        "raw_transcript_included",
        "raw_terminal_output_included",
        "raw_provider_output_included",
        "hidden_reasoning_included",
        "credential_or_secret_included",
        "accepted_strategy",
        "accepted_component",
        "verified_benefit",
        "causal_evidence",
        "product_promotion",
        "actor_identity_included",
      ]),
      additional_forbidden_raw_field_pattern:
        /^(?:raw_provider_output|provider_output|raw_terminal_output|terminal_output|terminal_log|stdout|stderr|environment_dump)$/u,
    },
  );
  scanStringsV01(value, (text) => {
    if (
      /(?:^|[\s"'(])(?:\/Users\/|\/home\/|[A-Za-z]:[\\/]|\\\\)/u.test(
        text,
      )
    ) {
      issues.push("private_absolute_path");
    }
  });
  if (issues.length > 0) {
    failV01(
      `strategy_composition_material_refused:${uniqueStringsV01(issues).join(",")}`,
    );
  }
}

function assertNoForbiddenSemanticFieldsV01(value: unknown): void {
  const allowedFalseFields = new Set([
    "accepted_strategy",
    "accepted_component",
    "verified_benefit",
    "causal_evidence",
    "product_promotion",
    "actor_identity_included",
    "superiority_claimed",
    "development_outcome_included",
    "holdout_success_claimed",
    "causal_contribution_claimed",
    "causal_negative_contribution_claimed",
    "general_harm_claimed",
    "scalar_fitness_created",
    "is_accepted_strategy",
    "is_evidence",
    "is_policy",
    "is_execution_plan",
    "is_proposal",
    "is_review_decision",
    "is_transition",
    "creates_actor_identity",
    "claims_verified_benefit",
    "claims_causal_contribution",
    "claims_general_harm",
    "promotes_component_or_strategy",
  ]);
  scanEntriesV01(value, (key, fieldValue) => {
    const normalized = normalizeFieldNameV01(key);
    if (allowedFalseFields.has(normalized)) {
      if (fieldValue !== false) {
        failV01("strategy_composition_authority_field_forbidden", `$.${key}`);
      }
      return;
    }
    if (normalized === "negative_transfer_candidate") {
      if (fieldValue !== true) {
        failV01("strategy_composition_negative_transfer_authority_invalid", `$.${key}`);
      }
      return;
    }
    if (
      /(?:^|_)(actor_id|actor_identity|actor_profile|actor_persistence)(?:_|$)/u.test(
        normalized,
      )
    ) {
      failV01("strategy_composition_actor_identity_forbidden", `$.${key}`);
    }
    if (
      /(?:^|_)(accepted|promoted|promotion|winner|winning|superiority)(?:_|$)/u.test(
        normalized,
      )
    ) {
      failV01("strategy_composition_authority_field_forbidden", `$.${key}`);
    }
    if (
      /(?:^|_)(fitness|quality|score|ranking|rank|rating|pareto|weighted_sum)(?:_|$)/u.test(
        normalized,
      )
    ) {
      failV01("strategy_composition_scalar_field_forbidden", `$.${key}`);
    }
  });
}

function assertBoundsV01(value: unknown): void {
  scanValuesV01(value, (item) => {
    if (
      typeof item === "string" &&
      item.length > STRATEGY_COMPOSITION_MAX_TEXT_CHARACTERS_V01
    ) {
      failV01("strategy_composition_text_bound_exceeded");
    }
    if (
      Array.isArray(item) &&
      item.length > STRATEGY_COMPOSITION_MAX_SOURCE_REFS_V01
    ) {
      failV01("strategy_composition_collection_bound_exceeded");
    }
  });
  if (!isProtocolRecordV01(value)) return;
  const components = value.components;
  const roleBindings = value.role_bindings;
  const relations = value.relations;
  const sourceRefs = value.source_refs;
  if (
    (Array.isArray(components) &&
      components.length > STRATEGY_COMPOSITION_MAX_COMPONENTS_V01) ||
    (Array.isArray(roleBindings) &&
      roleBindings.length > STRATEGY_COMPOSITION_MAX_ROLE_BINDINGS_V01) ||
    (Array.isArray(relations) &&
      relations.length > STRATEGY_COMPOSITION_MAX_RELATIONS_V01) ||
    (Array.isArray(sourceRefs) &&
      sourceRefs.length > STRATEGY_COMPOSITION_MAX_SOURCE_REFS_V01)
  ) {
    failV01("strategy_composition_collection_bound_exceeded");
  }
}

function requiredIdV01(value: unknown, path: string): string {
  const result = normalizeProtocolTextV01(value);
  if (!SAFE_ID_PATTERN.test(result)) {
    failV01("strategy_composition_id_invalid", path);
  }
  return result;
}

function requiredTextV01(value: unknown, path: string): string {
  const result = normalizeProtocolTextV01(value);
  if (!result) failV01("strategy_composition_text_required", path);
  if (result.length > STRATEGY_COMPOSITION_MAX_TEXT_CHARACTERS_V01) {
    failV01("strategy_composition_text_bound_exceeded", path);
  }
  return result;
}

function requiredFingerprintV01(value: unknown, path: string): string {
  const result = normalizeProtocolTextV01(value);
  if (!SHA256_PATTERN.test(result)) {
    failV01("strategy_composition_source_fingerprint_invalid", path);
  }
  return result;
}

function requiredTimestampV01(value: unknown, path: string): string {
  const result = normalizeProtocolTextV01(value);
  if (parseStrictIsoTimestampV01(result) === null) {
    failV01("strategy_composition_timestamp_invalid", path);
  }
  return result;
}

function uniqueIdsV01(value: unknown, path: string): string[] {
  if (!Array.isArray(value)) failV01("strategy_composition_collection_invalid", path);
  return uniqueStringsV01(
    value.map((item, index) => requiredIdV01(item, `${path}[${index}]`)),
  );
}

function uniqueTextItemsV01(value: unknown, path: string): string[] {
  if (!Array.isArray(value)) failV01("strategy_composition_collection_invalid", path);
  if (value.length > STRATEGY_COMPOSITION_MAX_TEXT_ITEMS_V01) {
    failV01("strategy_composition_collection_bound_exceeded", path);
  }
  return uniqueStringsV01(
    value.map((item, index) => requiredTextV01(item, `${path}[${index}]`)),
  );
}

function assertCanonicalUniqueTextItemsV01(value: string[], path: string): void {
  const normalized = uniqueTextItemsV01(value, path);
  if (canonicalizeProtocolValueV01(value) !== canonicalizeProtocolValueV01(normalized)) {
    failV01("strategy_composition_noncanonical_value", path);
  }
}

function assertExactKeysV01(
  value: Record<string, unknown>,
  allowed: readonly string[],
): void {
  const allowedSet = new Set(allowed);
  if (Object.keys(value).some((key) => !allowedSet.has(key))) {
    failV01("strategy_composition_unknown_field");
  }
  if (allowed.some((key) => !(key in value))) {
    failV01("strategy_composition_missing_field");
  }
}

function blockedResultV01(error: unknown): StrategyCompositionValidationResultV01 {
  if (error instanceof StrategyCompositionCaseErrorV01) {
    return {
      status: "blocked",
      errors: [{ code: error.code, path: error.path }],
    };
  }
  return {
    status: "blocked",
    errors: [{ code: "strategy_composition_case_invalid", path: "$" }],
  };
}

function normalizeFieldNameV01(value: string): string {
  return value
    .trim()
    .replace(/([a-z0-9])([A-Z])/gu, "$1_$2")
    .replace(/[\s-]+/gu, "_")
    .toLowerCase();
}

function scanStringsV01(value: unknown, visit: (text: string) => void): void {
  if (typeof value === "string") visit(value);
  else if (Array.isArray(value)) value.forEach((item) => scanStringsV01(item, visit));
  else if (isProtocolRecordV01(value)) {
    Object.values(value).forEach((item) => scanStringsV01(item, visit));
  }
}

function scanValuesV01(value: unknown, visit: (value: unknown) => void): void {
  visit(value);
  if (Array.isArray(value)) value.forEach((item) => scanValuesV01(item, visit));
  else if (isProtocolRecordV01(value)) {
    Object.values(value).forEach((item) => scanValuesV01(item, visit));
  }
}

function scanEntriesV01(
  value: unknown,
  visit: (key: string, value: unknown) => void,
): void {
  if (Array.isArray(value)) {
    value.forEach((item) => scanEntriesV01(item, visit));
  } else if (isProtocolRecordV01(value)) {
    for (const [key, item] of Object.entries(value)) {
      visit(key, item);
      scanEntriesV01(item, visit);
    }
  }
}

function uniqueStringsV01(values: string[]): string[] {
  return [...new Set(values)].sort(compareProtocolCodeUnitsV01);
}

function failV01(code: string, path: string = "$"): never {
  throw new StrategyCompositionCaseErrorV01(code, path);
}
