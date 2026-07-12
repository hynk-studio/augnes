import {
  EXTERNAL_REF_TRUST_CLASSES_V01,
  EXTERNAL_REF_VERSION_V01,
  type ExternalRefTrustClassV01,
  type ExternalRefV01,
} from "@/types/vnext/external-ref";
import {
  canonicalizeProtocolValueV01,
  createProtocolSha256V01,
  normalizeExternalRefPrimitiveV01,
  parseStrictIsoTimestampV01,
  scanForbiddenProtocolMaterialV01,
  validateDuplicateExternalRefsPrimitiveV01,
  validateExternalRefStructureV01,
} from "@/lib/vnext/protocol-primitives";
import { TASK_CONTEXT_PACKET_ID_HEX_LENGTH_V01 } from "@/lib/vnext/task-context-packet-handoff";
import {
  TASK_CONTEXT_PACKET_CANONICALIZATION_V01,
  TASK_CONTEXT_PACKET_CURRENTNESS_STATUSES_V01,
  TASK_CONTEXT_PACKET_DATA_CLASSIFICATIONS_V01,
  TASK_CONTEXT_PACKET_VERSION_V01,
  type TaskContextPacketAuthoritySummaryV01,
  type TaskContextPacketBoundedCapabilitySummaryV01,
  type TaskContextPacketCompatibilityMetadataV01,
  type TaskContextPacketContextBudgetV01,
  type TaskContextPacketCurrentnessV01,
  type TaskContextPacketCurrentProjectionV01,
  type TaskContextPacketExcludedEntryV01,
  type TaskContextPacketGapV01,
  type TaskContextPacketIssueV01,
  type TaskContextPacketProjectionItemV01,
  type TaskContextPacketReturnContractV01,
  type TaskContextPacketSelectedEntryV01,
  type TaskContextPacketSourceStatusV01,
  type TaskContextPacketV01,
  type TaskContextPacketValidationIssueV01,
  type TaskContextPacketValidationResultV01,
} from "@/types/vnext/task-context-packet";

const DEFAULT_MAX_SELECTED_ENTRIES = 64;
const DEFAULT_MAX_PROJECTION_ITEMS = 64;
const DEFAULT_MAX_CHARACTERS = 200_000;
const DEFAULT_MAX_ESTIMATED_TOKENS = 50_000;
const PENDING_PACKET_ID = "task-context-packet:pending";
const PENDING_FINGERPRINT = "sha256:pending";

const trustClasses = new Set<string>(EXTERNAL_REF_TRUST_CLASSES_V01);
const currentnessStatuses = new Set<string>(
  TASK_CONTEXT_PACKET_CURRENTNESS_STATUSES_V01,
);
const dataClassifications = new Set<string>(
  TASK_CONTEXT_PACKET_DATA_CLASSIFICATIONS_V01,
);
const selectedEntryKinds = new Set([
  "accepted_state_ref",
  "memory_ref",
  "evidence_ref",
  "claim_ref",
  "artifact_ref",
  "proof_ref",
  "action_ref",
  "legacy_state_key_ref",
  "source_ref",
  "work_ref",
  "other_ref",
]);
const projectionItemKinds = new Set([
  "frame",
  "thesis",
  "active_goal",
  "risk",
  "open_question",
  "gap",
  "source_ref",
  "other",
]);
const issueSeverities = new Set([
  "low",
  "medium",
  "high",
  "blocking",
  "unknown",
]);
const authorityCoverageLevels = new Set([
  "enforced",
  "observed",
  "advisory",
  "outside_coverage",
]);

const allowedRootKeys = new Set([
  "packet_version",
  "packet_id",
  "workspace_id",
  "project_id",
  "work_ref",
  "generated_at",
  "expires_at",
  "task",
  "current_projection",
  "selected_context",
  "excluded_context",
  "tensions",
  "risks",
  "gaps",
  "constraints",
  "capability_grant",
  "return_contract",
  "authority_summary",
  "source_status",
  "compatibility",
  "integrity",
]);
export const TASK_CONTEXT_PACKET_REQUIRED_CORE_FIELDS_V01 = [
  "packet_version",
  "packet_id",
  "workspace_id",
  "project_id",
  "generated_at",
  "task",
  "current_projection",
  "selected_context",
  "excluded_context",
  "tensions",
  "risks",
  "gaps",
  "constraints",
  "return_contract",
  "authority_summary",
  "source_status",
  "compatibility",
  "integrity",
] as const;

export interface TaskContextPacketBuilderInputV01 {
  workspace_id: string;
  project_id: string;
  work_ref?: string | ExternalRefV01 | null;
  generated_at: string;
  expires_at?: string | null;
  task: TaskContextPacketV01["task"];
  current_projection?: TaskContextPacketCurrentProjectionV01 | null;
  selected_context: TaskContextPacketSelectedEntryV01[];
  excluded_context?: TaskContextPacketExcludedEntryV01[];
  tensions?: TaskContextPacketIssueV01[];
  risks?: TaskContextPacketIssueV01[];
  gaps?: TaskContextPacketGapV01[];
  constraints: Omit<TaskContextPacketV01["constraints"], "context_budget"> & {
    context_budget?: Partial<TaskContextPacketContextBudgetV01> | null;
  };
  capability_grant?: TaskContextPacketBoundedCapabilitySummaryV01 | null;
  return_contract: TaskContextPacketReturnContractV01;
  source_status: TaskContextPacketSourceStatusV01;
  compatibility: TaskContextPacketCompatibilityMetadataV01;
  authority_notes?: string[];
}

export interface TaskContextPacketValidationOptionsV01 {
  /** Explicit clock value. The validator never reads the current time. */
  evaluated_at: string;
}

type ValidationAccumulator = {
  errors: TaskContextPacketValidationIssueV01[];
  warnings: TaskContextPacketValidationIssueV01[];
  blocked: boolean;
};

type JsonRecord = Record<string, unknown>;

export function buildTaskContextPacketV01(
  input: TaskContextPacketBuilderInputV01,
): TaskContextPacketV01 {
  const requestedBudget = normalizeContextBudgetV01(
    input.constraints.context_budget,
  );
  const allSelectedContext = normalizeSelectedContextV01(
    input.selected_context,
  );
  const selectedEntryLimit =
    requestedBudget.max_selected_entries ?? DEFAULT_MAX_SELECTED_ENTRIES;
  const selectedContext = allSelectedContext.slice(
    0,
    selectedEntryLimit,
  );
  const droppedSelectedContext = allSelectedContext.slice(selectedEntryLimit);
  const allProjectionItems = input.current_projection
    ? normalizeProjectionItemsV01(input.current_projection.items)
    : [];
  const projectionItemLimit =
    requestedBudget.max_projection_items ?? DEFAULT_MAX_PROJECTION_ITEMS;
  const projectionItems = allProjectionItems.slice(0, projectionItemLimit);
  const droppedProjectionItems = allProjectionItems.slice(projectionItemLimit);
  const currentProjection = input.current_projection
    ? normalizeCurrentProjectionV01(
        {
          ...input.current_projection,
          warnings:
            droppedProjectionItems.length > 0
              ? [
                  ...input.current_projection.warnings,
                  `${droppedProjectionItems.length} projection item(s) were excluded by the explicit context budget.`,
                ]
              : input.current_projection.warnings,
        },
        projectionItems,
      )
    : null;
  const task = {
    goal: normalizeText(input.task.goal),
    success_criteria: uniqueSortedStrings(input.task.success_criteria),
    non_goals: uniqueSortedStrings(input.task.non_goals),
  };
  const excludedContext = normalizeExcludedContextV01([
    ...(input.excluded_context ?? []),
    ...droppedSelectedContext.map(
      (entry): TaskContextPacketExcludedEntryV01 => ({
        entry_id: `budget-excluded:${entry.entry_id}`,
        source_ref: entry.source_ref,
        external_ref: entry.external_ref,
        why_excluded: "Excluded by the explicit selected-context budget.",
        currentness: entry.currentness,
      }),
    ),
  ]);
  const tensions = normalizeIssuesV01(input.tensions ?? [], "tension");
  const risks = normalizeIssuesV01(input.risks ?? [], "risk");
  const gaps = normalizeGapsV01([
    ...(input.gaps ?? []),
    ...(droppedProjectionItems.length > 0
      ? [
          {
            code: "context_budget_projection_truncation",
            summary: `${droppedProjectionItems.length} projection item(s) were excluded by the explicit context budget.`,
            severity: "medium" as const,
            missing_fields: ["current_projection.items"],
            source_refs: droppedProjectionItems.flatMap(
              (item) => item.source_refs,
            ),
            external_refs: droppedProjectionItems.flatMap(
              (item) => item.external_refs,
            ),
          },
        ]
      : []),
  ]);
  const returnContract = normalizeReturnContractV01(input.return_contract);
  const sourceStatus = normalizeSourceStatusV01(input.source_status);
  const compatibility = normalizeCompatibilityV01(input.compatibility);
  const capabilityGrant = input.capability_grant
    ? normalizeCapabilityGrantV01(input.capability_grant)
    : null;
  const workRef = normalizeWorkRefV01(input.work_ref);
  const contextBudget: TaskContextPacketContextBudgetV01 = {
    ...requestedBudget,
    estimated_tokens: null,
    truncation_applied:
      requestedBudget.truncation_applied ||
      selectedContext.length !== allSelectedContext.length ||
      projectionItems.length !== allProjectionItems.length,
  };
  const authoritySummary = createTaskContextPacketAuthoritySummaryV01(
    input.authority_notes,
  );
  const packetWithPendingIdentity: TaskContextPacketV01 = {
    packet_version: TASK_CONTEXT_PACKET_VERSION_V01,
    packet_id: PENDING_PACKET_ID,
    workspace_id: normalizeText(input.workspace_id),
    project_id: normalizeText(input.project_id),
    work_ref: workRef,
    generated_at: normalizeText(input.generated_at),
    expires_at: normalizeNullableText(input.expires_at),
    task,
    current_projection: currentProjection,
    selected_context: selectedContext,
    excluded_context: excludedContext,
    tensions,
    risks,
    gaps,
    constraints: {
      required_checks: uniqueSortedStrings(input.constraints.required_checks),
      forbidden_actions: uniqueSortedStrings(
        input.constraints.forbidden_actions,
      ),
      data_classification: input.constraints.data_classification,
      context_budget: contextBudget,
    },
    capability_grant: capabilityGrant,
    return_contract: returnContract,
    authority_summary: authoritySummary,
    source_status: sourceStatus,
    compatibility,
    integrity: {
      canonicalization: TASK_CONTEXT_PACKET_CANONICALIZATION_V01,
      fingerprint_algorithm: "sha256",
      fingerprint_scope: "packet_without_integrity_fingerprint",
      fingerprint: PENDING_FINGERPRINT,
    },
  };
  const estimatedTokens = estimateTaskContextPacketTokensV01(
    packetWithPendingIdentity,
  );
  const packetWithEstimate: TaskContextPacketV01 = {
    ...packetWithPendingIdentity,
    constraints: {
      ...packetWithPendingIdentity.constraints,
      context_budget: {
        ...packetWithPendingIdentity.constraints.context_budget,
        estimated_tokens: estimatedTokens,
      },
    },
  };
  const packetId = deriveTaskContextPacketIdV01(packetWithEstimate);
  const packetWithIdentity = {
    ...packetWithEstimate,
    packet_id: packetId,
  };
  const fingerprint = createTaskContextPacketFingerprintV01(
    packetWithIdentity,
  );

  const packet = {
    ...packetWithIdentity,
    integrity: {
      ...packetWithIdentity.integrity,
      fingerprint,
    },
  };
  assertTaskContextPacketBuildBudgetV01(packet);
  return packet;
}

export function createTaskContextPacketAuthoritySummaryV01(
  notes: string[] = [],
): TaskContextPacketAuthoritySummaryV01 {
  return {
    is_command: false,
    is_canonical_project_state: false,
    is_approval: false,
    performs_durable_transition: false,
    grants_execution_authority: false,
    grants_external_side_effect_authority: false,
    grants_semantic_commit_authority: false,
    can_write_database: false,
    can_call_provider: false,
    can_use_network: false,
    can_mutate_external_state: false,
    current_projection_is_source_of_truth: false,
    provider_refs_are_canonical: false,
    notes: uniqueSortedStrings([
      "TaskContextPacket is bounded read-only context.",
      "Missing source material remains a gap or warning.",
      "Provider and host identifiers remain ExternalRef values.",
      "Current Working Perspective remains a projection.",
      ...notes,
    ]),
  };
}

export function normalizeExternalRefV01(
  input: ExternalRefV01,
): ExternalRefV01 {
  return normalizeExternalRefPrimitiveV01(input);
}

export function canonicalizeTaskContextValueV01(value: unknown): string {
  return canonicalizeProtocolValueV01(value);
}

export function createTaskContextPacketFingerprintV01(
  packet: TaskContextPacketV01,
): string {
  return sha256(canonicalizeTaskContextValueV01(withoutFingerprintV01(packet)));
}

export function deriveTaskContextPacketIdV01(
  packet: TaskContextPacketV01,
): string {
  const identityHash = sha256(
    canonicalizeTaskContextValueV01({
      ...withoutFingerprintV01(packet),
      packet_id: PENDING_PACKET_ID,
    }),
  );
  const suffixStart = "sha256:".length;
  return `task-context-packet:${identityHash.slice(
    suffixStart,
    suffixStart + TASK_CONTEXT_PACKET_ID_HEX_LENGTH_V01,
  )}`;
}

function withoutFingerprintV01(packet: TaskContextPacketV01) {
  const { fingerprint: _fingerprint, ...integrity } = packet.integrity;
  return { ...packet, integrity };
}

function estimateTaskContextPacketTokensV01(packet: TaskContextPacketV01) {
  const material = withoutFingerprintV01({
    ...packet,
    packet_id: PENDING_PACKET_ID,
    constraints: {
      ...packet.constraints,
      context_budget: {
        ...packet.constraints.context_budget,
        estimated_tokens: null,
      },
    },
  });
  return Math.max(
    1,
    Math.ceil(canonicalizeTaskContextValueV01(material).length / 4),
  );
}

function assertTaskContextPacketBuildBudgetV01(packet: TaskContextPacketV01) {
  const budget = packet.constraints.context_budget;
  const characters = canonicalizeTaskContextValueV01(packet).length;
  if (budget.max_characters !== null && characters > budget.max_characters) {
    throw new RangeError(
      `TaskContextPacket exceeds max_characters (${characters} > ${budget.max_characters}).`,
    );
  }
  if (
    budget.max_estimated_tokens !== null &&
    budget.estimated_tokens !== null &&
    budget.estimated_tokens > budget.max_estimated_tokens
  ) {
    throw new RangeError(
      `TaskContextPacket exceeds max_estimated_tokens (${budget.estimated_tokens} > ${budget.max_estimated_tokens}).`,
    );
  }
}

export function validateExternalRefV01(
  input: unknown,
): TaskContextPacketValidationResultV01 {
  const accumulator = createAccumulator();
  scanForbiddenPacketMaterialV01(input, "$", accumulator, false);
  validateExternalRefAtV01(input, "$", accumulator);
  return buildValidationResult(
    accumulator,
    isRecord(input) && input.ref_version === EXTERNAL_REF_VERSION_V01
      ? EXTERNAL_REF_VERSION_V01
      : null,
  );
}

export function validateTaskContextPacketV01(
  input: unknown,
  options: TaskContextPacketValidationOptionsV01,
): TaskContextPacketValidationResultV01 {
  const accumulator = createAccumulator();
  scanForbiddenPacketMaterialV01(input, "$", accumulator, false);

  if (!isRecord(input)) {
    addError(
      accumulator,
      "packet_not_object",
      "$",
      "TaskContextPacket must be an object.",
    );
    return buildValidationResult(accumulator, null);
  }

  const packetVersion = stringValue(input.packet_version);
  rejectUnknownKeysV01(
    input,
    allowedRootKeys,
    "$",
    accumulator,
    "unknown_core_field",
    true,
  );
  if (packetVersion !== TASK_CONTEXT_PACKET_VERSION_V01) {
    addError(
      accumulator,
      "unsupported_protocol_version",
      "$.packet_version",
      `Unsupported TaskContextPacket protocol version: ${
        packetVersion ?? "missing"
      }.`,
      true,
    );
  }

  requireString(input, "packet_id", "$", accumulator);
  requireString(input, "workspace_id", "$", accumulator);
  requireString(input, "project_id", "$", accumulator);
  requireIsoTimestamp(input.generated_at, "$.generated_at", accumulator);
  const evaluatedAt = requireIsoTimestamp(
    options?.evaluated_at,
    "$.validation.evaluated_at",
    accumulator,
  );
  const generatedAt = parseIsoTimestamp(input.generated_at);
  const expiresAt = validateOptionalTimestamp(
    input.expires_at,
    "$.expires_at",
    accumulator,
  );
  if (expiresAt !== null && generatedAt !== null && expiresAt <= generatedAt) {
    addError(
      accumulator,
      "packet_expired_at_generation",
      "$.expires_at",
      "expires_at must be later than generated_at.",
      true,
    );
  }
  if (expiresAt !== null && evaluatedAt !== null && expiresAt <= evaluatedAt) {
    addError(
      accumulator,
      "packet_expired",
      "$.expires_at",
      "TaskContextPacket is expired at the explicit evaluation time.",
      true,
    );
  }

  validateWorkRefV01(input.work_ref, "$.work_ref", accumulator);
  validateTaskV01(input.task, accumulator);
  validateCurrentProjectionAtV01(
    input.current_projection,
    "$.current_projection",
    accumulator,
  );
  validateSelectedContextV01(input.selected_context, accumulator);
  validateExcludedContextV01(input.excluded_context, accumulator);
  validateIssuesV01(input.tensions, "tension", "$.tensions", accumulator);
  validateIssuesV01(input.risks, "risk", "$.risks", accumulator);
  validateGapsV01(input.gaps, accumulator);
  validateConstraintsV01(input.constraints, input, accumulator);
  validateCapabilityGrantAtV01(
    input.capability_grant,
    "$.capability_grant",
    evaluatedAt,
    accumulator,
  );
  validateReturnContractV01(input.return_contract, accumulator);
  validateAuthoritySummaryV01(input.authority_summary, accumulator);
  validateSourceStatusV01(input.source_status, accumulator);
  validateCompatibilityV01(input.compatibility, accumulator);
  validateDuplicateExternalRefsV01(input, accumulator);
  validateRequiredGapCoverageV01(input, accumulator);
  validateIntegrityV01(input, accumulator);

  return buildValidationResult(
    accumulator,
    packetVersion === TASK_CONTEXT_PACKET_VERSION_V01
      ? TASK_CONTEXT_PACKET_VERSION_V01
      : null,
  );
}

function normalizeSelectedContextV01(
  entries: TaskContextPacketSelectedEntryV01[],
): TaskContextPacketSelectedEntryV01[] {
  return uniqueByCanonical(
    entries.map((entry) => ({
      entry_id: normalizeText(entry.entry_id),
      entry_kind: entry.entry_kind,
      source_ref: normalizeNullableText(entry.source_ref),
      external_ref: entry.external_ref
        ? normalizeExternalRefV01(entry.external_ref)
        : null,
      why_included: normalizeText(entry.why_included),
      currentness: normalizeCurrentnessV01(entry.currentness),
      trust_class: entry.trust_class,
      compatibility_source_ref: entry.compatibility_source_ref
        ? normalizeExternalRefV01(entry.compatibility_source_ref)
        : null,
      bounded_summary: normalizeNullableText(entry.bounded_summary),
    })),
  ).sort(compareCanonical);
}

function normalizeExcludedContextV01(
  entries: TaskContextPacketExcludedEntryV01[],
): TaskContextPacketExcludedEntryV01[] {
  return uniqueByCanonical(
    entries.map((entry) => ({
      entry_id: normalizeText(entry.entry_id),
      source_ref: normalizeNullableText(entry.source_ref),
      external_ref: entry.external_ref
        ? normalizeExternalRefV01(entry.external_ref)
        : null,
      why_excluded: normalizeText(entry.why_excluded),
      currentness: normalizeCurrentnessV01(entry.currentness),
    })),
  ).sort(compareCanonical);
}

function normalizeProjectionItemsV01(
  items: TaskContextPacketProjectionItemV01[],
): TaskContextPacketProjectionItemV01[] {
  return uniqueByCanonical(
    items.map((item) => ({
      item_kind: item.item_kind,
      summary: normalizeText(item.summary),
      source_refs: uniqueSortedStrings(item.source_refs),
      external_refs: normalizeExternalRefsV01(item.external_refs),
      currentness: normalizeCurrentnessV01(item.currentness),
    })),
  ).sort(compareCanonical);
}

function normalizeCurrentProjectionV01(
  projection: TaskContextPacketCurrentProjectionV01,
  items: TaskContextPacketProjectionItemV01[],
): TaskContextPacketCurrentProjectionV01 {
  return {
    projection_kind: "current_working_perspective",
    projection_only: true,
    canonical_state: false,
    perspective_ref: normalizeNullableText(projection.perspective_ref),
    bounded_summary: normalizeText(projection.bounded_summary),
    as_of: normalizeNullableText(projection.as_of),
    items,
    source_refs: uniqueSortedStrings(projection.source_refs),
    external_refs: normalizeExternalRefsV01(projection.external_refs),
    currentness: normalizeCurrentnessV01(projection.currentness),
    warnings: uniqueSortedStrings(projection.warnings),
  };
}

function normalizeIssuesV01(
  issues: TaskContextPacketIssueV01[],
  expectedKind: TaskContextPacketIssueV01["issue_kind"],
): TaskContextPacketIssueV01[] {
  return uniqueByCanonical(
    issues.map((issue) => ({
      issue_kind: expectedKind,
      summary: normalizeText(issue.summary),
      severity: issue.severity,
      source_refs: uniqueSortedStrings(issue.source_refs),
      external_refs: normalizeExternalRefsV01(issue.external_refs),
      currentness: normalizeCurrentnessV01(issue.currentness),
    })),
  ).sort(compareCanonical);
}

function normalizeGapsV01(
  gaps: TaskContextPacketGapV01[],
): TaskContextPacketGapV01[] {
  return uniqueByCanonical(
    gaps.map((gap) => ({
      code: normalizeText(gap.code),
      summary: normalizeText(gap.summary),
      severity: gap.severity,
      missing_fields: uniqueSortedStrings(gap.missing_fields),
      source_refs: uniqueSortedStrings(gap.source_refs),
      external_refs: normalizeExternalRefsV01(gap.external_refs),
    })),
  ).sort(compareCanonical);
}

function normalizeCurrentnessV01(
  currentness: TaskContextPacketCurrentnessV01,
): TaskContextPacketCurrentnessV01 {
  return {
    status: currentness.status,
    as_of: normalizeNullableText(currentness.as_of),
    basis: normalizeText(currentness.basis),
    source_ref: currentness.source_ref
      ? normalizeExternalRefV01(currentness.source_ref)
      : null,
  };
}

function normalizeContextBudgetV01(
  input: Partial<TaskContextPacketContextBudgetV01> | null | undefined,
): TaskContextPacketContextBudgetV01 {
  return {
    bounded: true,
    max_selected_entries: positiveIntegerOrDefault(
      input?.max_selected_entries,
      DEFAULT_MAX_SELECTED_ENTRIES,
    ),
    max_projection_items: positiveIntegerOrDefault(
      input?.max_projection_items,
      DEFAULT_MAX_PROJECTION_ITEMS,
    ),
    max_characters: positiveIntegerOrDefault(
      input?.max_characters,
      DEFAULT_MAX_CHARACTERS,
    ),
    max_estimated_tokens: positiveIntegerOrDefault(
      input?.max_estimated_tokens,
      DEFAULT_MAX_ESTIMATED_TOKENS,
    ),
    estimated_tokens: positiveIntegerOrNull(input?.estimated_tokens),
    truncation_applied: input?.truncation_applied === true,
  };
}

function normalizeCapabilityGrantV01(
  grant: TaskContextPacketBoundedCapabilitySummaryV01,
): TaskContextPacketBoundedCapabilitySummaryV01 {
  return {
    grant_ref: normalizeNullableText(grant.grant_ref),
    grant_external_ref: grant.grant_external_ref
      ? normalizeExternalRefV01(grant.grant_external_ref)
      : null,
    allowed_capabilities: uniqueSortedStrings(grant.allowed_capabilities),
    forbidden_capabilities: uniqueSortedStrings(grant.forbidden_capabilities),
    resource_scope: uniqueSortedStrings(grant.resource_scope),
    stop_conditions: uniqueSortedStrings(grant.stop_conditions),
    coverage: grant.coverage,
    expires_at: normalizeNullableText(grant.expires_at),
  };
}

function normalizeReturnContractV01(
  contract: TaskContextPacketReturnContractV01,
): TaskContextPacketReturnContractV01 {
  return {
    return_kind: contract.return_kind,
    required_fields: uniqueSortedStrings(contract.required_fields),
    expected_artifacts: uniqueSortedStrings(contract.expected_artifacts),
    required_checks: uniqueSortedStrings(contract.required_checks),
    return_ref: contract.return_ref
      ? normalizeExternalRefV01(contract.return_ref)
      : null,
    compatibility_only: contract.compatibility_only,
  };
}

function normalizeSourceStatusV01(
  status: TaskContextPacketSourceStatusV01,
): TaskContextPacketSourceStatusV01 {
  return {
    status: status.status,
    currentness: normalizeCurrentnessV01(status.currentness),
    source_refs: uniqueSortedStrings(status.source_refs),
    external_refs: normalizeExternalRefsV01(status.external_refs),
    warnings: uniqueSortedStrings(status.warnings),
  };
}

function normalizeCompatibilityV01(
  compatibility: TaskContextPacketCompatibilityMetadataV01,
): TaskContextPacketCompatibilityMetadataV01 {
  return {
    source_contracts: uniqueSortedStrings(compatibility.source_contracts),
    legacy_scope_ref: compatibility.legacy_scope_ref
      ? normalizeExternalRefV01(compatibility.legacy_scope_ref)
      : null,
    source_refs: normalizeExternalRefsV01(compatibility.source_refs),
    unmapped_fields: uniqueByCanonical(
      compatibility.unmapped_fields.map((field) => ({
        source_field: normalizeText(field.source_field),
        reason: normalizeText(field.reason),
        source_ref: field.source_ref
          ? normalizeExternalRefV01(field.source_ref)
          : null,
        redacted: true as const,
      })),
    ).sort(compareCanonical),
    warnings: uniqueSortedStrings(compatibility.warnings),
  };
}

function normalizeWorkRefV01(
  workRef: TaskContextPacketBuilderInputV01["work_ref"],
): TaskContextPacketV01["work_ref"] {
  if (typeof workRef === "string") return normalizeNullableText(workRef);
  return workRef ? normalizeExternalRefV01(workRef) : null;
}

function normalizeExternalRefsV01(refs: ExternalRefV01[]): ExternalRefV01[] {
  return uniqueByCanonical(refs.map(normalizeExternalRefV01)).sort(
    compareExternalRefs,
  );
}

function validateTaskV01(input: unknown, accumulator: ValidationAccumulator) {
  if (!isRecord(input)) {
    addError(accumulator, "task_missing", "$.task", "task must be an object.");
    return;
  }
  rejectUnknownKeysV01(
    input,
    new Set(["goal", "success_criteria", "non_goals"]),
    "$.task",
    accumulator,
  );
  requireString(input, "goal", "$.task", accumulator);
  requireStringArray(
    input.success_criteria,
    "$.task.success_criteria",
    accumulator,
  );
  requireStringArray(input.non_goals, "$.task.non_goals", accumulator);
}

function validateSelectedContextV01(
  input: unknown,
  accumulator: ValidationAccumulator,
) {
  if (!Array.isArray(input)) {
    addError(
      accumulator,
      "selected_context_malformed",
      "$.selected_context",
      "selected_context must be an array.",
    );
    return;
  }
  const entryIds = new Map<string, string>();
  input.forEach((value, index) => {
    const path = `$.selected_context[${index}]`;
    if (!isRecord(value)) {
      addError(
        accumulator,
        "selected_context_entry_malformed",
        path,
        "Selected context entry must be an object.",
      );
      return;
    }
    rejectUnknownKeysV01(
      value,
      new Set([
        "entry_id",
        "entry_kind",
        "source_ref",
        "external_ref",
        "why_included",
        "currentness",
        "trust_class",
        "compatibility_source_ref",
        "bounded_summary",
      ]),
      path,
      accumulator,
    );
    const entryId = requireString(value, "entry_id", path, accumulator);
    if (!selectedEntryKinds.has(String(value.entry_kind))) {
      addError(
        accumulator,
        "selected_context_entry_kind_invalid",
        `${path}.entry_kind`,
        "Selected context entry_kind is malformed or unsupported.",
      );
    }
    requireString(value, "why_included", path, accumulator);
    const sourceRef = stringValue(value.source_ref);
    if (!sourceRef && !isRecord(value.external_ref)) {
      addError(
        accumulator,
        "selected_context_reference_missing",
        path,
        "Selected context must preserve a source_ref or ExternalRef.",
      );
    }
    validateExternalRefAtV01(value.external_ref, `${path}.external_ref`, accumulator, true);
    validateExternalRefAtV01(
      value.compatibility_source_ref,
      `${path}.compatibility_source_ref`,
      accumulator,
      true,
    );
    validateCurrentnessAtV01(
      value.currentness,
      `${path}.currentness`,
      accumulator,
    );
    const trustClass = stringValue(value.trust_class);
    if (!trustClass || !trustClasses.has(trustClass)) {
      addError(
        accumulator,
        "selected_context_trust_class_invalid",
        `${path}.trust_class`,
        "Selected context requires a known trust class.",
      );
    }
    const externalRef = jsonRecord(value.external_ref);
    const compatibilitySourceRef = jsonRecord(value.compatibility_source_ref);
    if (
      externalRef &&
      trustClass &&
      externalRef.trust_class !== trustClass
    ) {
      addError(
        accumulator,
        "selected_context_trust_conflict",
        `${path}.trust_class`,
        "Selected context trust class must match its ExternalRef.",
      );
    }
    if (
      value.entry_kind === "evidence_ref" &&
      [
        sourceRef,
        externalRef?.ref_type,
        externalRef?.external_id,
        compatibilitySourceRef?.ref_type,
        compatibilitySourceRef?.external_id,
      ].some(isProofOrActionReferenceV01)
    ) {
      addError(
        accumulator,
        "proof_promoted_to_evidence",
        `${path}.entry_kind`,
        "Legacy proof/action references cannot be promoted to Evidence by compatibility mapping.",
        true,
      );
    }
    if (entryId) {
      const canonical = canonicalizeTaskContextValueV01(value);
      const existing = entryIds.get(entryId);
      if (existing && existing !== canonical) {
        addError(
          accumulator,
          "duplicate_conflicting_selected_entry",
          `${path}.entry_id`,
          `Conflicting selected context entries share entry_id ${entryId}.`,
          true,
        );
      } else {
        entryIds.set(entryId, canonical);
      }
    }
  });
}

function isProofOrActionReferenceV01(value: unknown) {
  const text = stringValue(value)?.toLowerCase();
  return Boolean(
    text && /(?:^|[.:/_-])(?:proof|action)(?:[.:/_-]|$)/.test(text),
  );
}

function validateExcludedContextV01(
  input: unknown,
  accumulator: ValidationAccumulator,
) {
  if (!Array.isArray(input)) {
    addError(
      accumulator,
      "excluded_context_malformed",
      "$.excluded_context",
      "excluded_context must be an array.",
    );
    return;
  }
  input.forEach((value, index) => {
    const path = `$.excluded_context[${index}]`;
    if (!isRecord(value)) {
      addError(
        accumulator,
        "excluded_context_entry_malformed",
        path,
        "Excluded context entry must be an object.",
      );
      return;
    }
    rejectUnknownKeysV01(
      value,
      new Set([
        "entry_id",
        "source_ref",
        "external_ref",
        "why_excluded",
        "currentness",
      ]),
      path,
      accumulator,
    );
    requireString(value, "entry_id", path, accumulator);
    requireString(value, "why_excluded", path, accumulator);
    if (!stringValue(value.source_ref) && !isRecord(value.external_ref)) {
      addError(
        accumulator,
        "excluded_context_reference_missing",
        path,
        "Excluded context must preserve a source_ref or ExternalRef.",
      );
    }
    validateExternalRefAtV01(value.external_ref, `${path}.external_ref`, accumulator, true);
    validateCurrentnessAtV01(
      value.currentness,
      `${path}.currentness`,
      accumulator,
    );
  });
}

function validateCurrentProjectionAtV01(
  input: unknown,
  path: string,
  accumulator: ValidationAccumulator,
) {
  if (input === null) return;
  if (!isRecord(input)) {
    addError(
      accumulator,
      "current_projection_malformed",
      path,
      "current_projection must be null or an object.",
    );
    return;
  }
  rejectUnknownKeysV01(
    input,
    new Set([
      "projection_kind",
      "projection_only",
      "canonical_state",
      "perspective_ref",
      "bounded_summary",
      "as_of",
      "items",
      "source_refs",
      "external_refs",
      "currentness",
      "warnings",
    ]),
    path,
    accumulator,
  );
  if (input.projection_kind !== "current_working_perspective") {
    addError(
      accumulator,
      "current_projection_kind_invalid",
      `${path}.projection_kind`,
      "Current projection kind must be current_working_perspective.",
    );
  }
  if (input.projection_only !== true || input.canonical_state !== false) {
    addError(
      accumulator,
      "current_projection_authority_invalid",
      path,
      "Current Working Perspective must remain projection-only and noncanonical.",
      true,
    );
  }
  requireString(input, "bounded_summary", path, accumulator);
  validateOptionalTimestamp(input.as_of, `${path}.as_of`, accumulator);
  validateCurrentnessAtV01(
    input.currentness,
    `${path}.currentness`,
    accumulator,
  );
  validateExternalRefArrayAtV01(
    input.external_refs,
    `${path}.external_refs`,
    accumulator,
  );
  requireStringArray(input.source_refs, `${path}.source_refs`, accumulator);
  requireStringArray(input.warnings, `${path}.warnings`, accumulator);
  if (!Array.isArray(input.items)) {
    addError(
      accumulator,
      "current_projection_items_malformed",
      `${path}.items`,
      "Projection items must be an array.",
    );
    return;
  }
  input.items.forEach((value, index) => {
    const itemPath = `${path}.items[${index}]`;
    if (!isRecord(value)) {
      addError(
        accumulator,
        "current_projection_item_malformed",
        itemPath,
        "Projection item must be an object.",
      );
      return;
    }
    rejectUnknownKeysV01(
      value,
      new Set([
        "item_kind",
        "summary",
        "source_refs",
        "external_refs",
        "currentness",
      ]),
      itemPath,
      accumulator,
    );
    requireString(value, "summary", itemPath, accumulator);
    if (!projectionItemKinds.has(String(value.item_kind))) {
      addError(
        accumulator,
        "current_projection_item_kind_invalid",
        `${itemPath}.item_kind`,
        "Projection item_kind is malformed or unsupported.",
      );
    }
    requireStringArray(value.source_refs, `${itemPath}.source_refs`, accumulator);
    validateExternalRefArrayAtV01(
      value.external_refs,
      `${itemPath}.external_refs`,
      accumulator,
    );
    validateCurrentnessAtV01(
      value.currentness,
      `${itemPath}.currentness`,
      accumulator,
    );
  });
}

function validateIssuesV01(
  input: unknown,
  expectedKind: TaskContextPacketIssueV01["issue_kind"],
  path: string,
  accumulator: ValidationAccumulator,
) {
  if (!Array.isArray(input)) {
    addError(
      accumulator,
      `${expectedKind}s_malformed`,
      path,
      `${expectedKind}s must be an array.`,
    );
    return;
  }
  input.forEach((value, index) => {
    const itemPath = `${path}[${index}]`;
    if (!isRecord(value)) {
      addError(
        accumulator,
        `${expectedKind}_malformed`,
        itemPath,
        `${expectedKind} must be an object.`,
      );
      return;
    }
    rejectUnknownKeysV01(
      value,
      new Set([
        "issue_kind",
        "summary",
        "severity",
        "source_refs",
        "external_refs",
        "currentness",
      ]),
      itemPath,
      accumulator,
    );
    if (value.issue_kind !== expectedKind) {
      addError(
        accumulator,
        `${expectedKind}_kind_invalid`,
        `${itemPath}.issue_kind`,
        `Expected issue_kind ${expectedKind}.`,
      );
    }
    requireString(value, "summary", itemPath, accumulator);
    if (!issueSeverities.has(String(value.severity))) {
      addError(
        accumulator,
        `${expectedKind}_severity_invalid`,
        `${itemPath}.severity`,
        `${expectedKind} severity is malformed or unsupported.`,
      );
    }
    validateCurrentnessAtV01(
      value.currentness,
      `${itemPath}.currentness`,
      accumulator,
    );
    requireStringArray(value.source_refs, `${itemPath}.source_refs`, accumulator);
    validateExternalRefArrayAtV01(
      value.external_refs,
      `${itemPath}.external_refs`,
      accumulator,
    );
  });
}

function validateGapsV01(input: unknown, accumulator: ValidationAccumulator) {
  if (!Array.isArray(input)) {
    addError(accumulator, "gaps_malformed", "$.gaps", "gaps must be an array.");
    return;
  }
  input.forEach((value, index) => {
    const path = `$.gaps[${index}]`;
    if (!isRecord(value)) {
      addError(accumulator, "gap_malformed", path, "Gap must be an object.");
      return;
    }
    rejectUnknownKeysV01(
      value,
      new Set([
        "code",
        "summary",
        "severity",
        "missing_fields",
        "source_refs",
        "external_refs",
      ]),
      path,
      accumulator,
    );
    requireString(value, "code", path, accumulator);
    requireString(value, "summary", path, accumulator);
    if (!issueSeverities.has(String(value.severity))) {
      addError(
        accumulator,
        "gap_severity_invalid",
        `${path}.severity`,
        "Gap severity is malformed or unsupported.",
      );
    }
    requireStringArray(value.missing_fields, `${path}.missing_fields`, accumulator);
    requireStringArray(value.source_refs, `${path}.source_refs`, accumulator);
    validateExternalRefArrayAtV01(
      value.external_refs,
      `${path}.external_refs`,
      accumulator,
    );
  });
}

function validateConstraintsV01(
  input: unknown,
  packet: JsonRecord,
  accumulator: ValidationAccumulator,
) {
  if (!isRecord(input)) {
    addError(
      accumulator,
      "constraints_malformed",
      "$.constraints",
      "constraints must be an object.",
    );
    return;
  }
  rejectUnknownKeysV01(
    input,
    new Set([
      "required_checks",
      "forbidden_actions",
      "data_classification",
      "context_budget",
    ]),
    "$.constraints",
    accumulator,
  );
  requireStringArray(
    input.required_checks,
    "$.constraints.required_checks",
    accumulator,
  );
  requireStringArray(
    input.forbidden_actions,
    "$.constraints.forbidden_actions",
    accumulator,
  );
  const classification = stringValue(input.data_classification);
  if (!classification || !dataClassifications.has(classification)) {
    addError(
      accumulator,
      "data_classification_invalid",
      "$.constraints.data_classification",
      "Unknown TaskContextPacket data classification.",
    );
  }
  if (!isRecord(input.context_budget)) {
    addError(
      accumulator,
      "context_budget_malformed",
      "$.constraints.context_budget",
      "context_budget must be an object.",
    );
    return;
  }
  const budget = input.context_budget;
  rejectUnknownKeysV01(
    budget,
    new Set([
      "bounded",
      "max_selected_entries",
      "max_projection_items",
      "max_characters",
      "max_estimated_tokens",
      "estimated_tokens",
      "truncation_applied",
    ]),
    "$.constraints.context_budget",
    accumulator,
  );
  if (budget.bounded !== true) {
    addError(
      accumulator,
      "context_budget_not_bounded",
      "$.constraints.context_budget.bounded",
      "TaskContextPacket context budget must be explicitly bounded.",
      true,
    );
  }
  const maxSelected = positiveIntegerOrNull(budget.max_selected_entries);
  const maxProjection = positiveIntegerOrNull(budget.max_projection_items);
  const maxCharacters = positiveIntegerOrNull(budget.max_characters);
  const maxTokens = positiveIntegerOrNull(budget.max_estimated_tokens);
  const estimatedTokens = positiveIntegerOrNull(budget.estimated_tokens);
  if (
    maxSelected === null ||
    maxProjection === null ||
    maxCharacters === null ||
    maxTokens === null ||
    estimatedTokens === null
  ) {
    addError(
      accumulator,
      "context_budget_limits_missing",
      "$.constraints.context_budget",
      "All context budget limits and the deterministic token estimate must be positive integers.",
    );
  }
  if (typeof budget.truncation_applied !== "boolean") {
    addError(
      accumulator,
      "context_budget_truncation_flag_invalid",
      "$.constraints.context_budget.truncation_applied",
      "truncation_applied must be a boolean.",
    );
  }
  const selectedCount = Array.isArray(packet.selected_context)
    ? packet.selected_context.length
    : 0;
  const projection = jsonRecord(packet.current_projection);
  const projectionCount = Array.isArray(projection?.items)
    ? projection.items.length
    : 0;
  if (maxSelected !== null && selectedCount > maxSelected) {
    addError(
      accumulator,
      "selected_context_budget_exceeded",
      "$.selected_context",
      "selected_context exceeds its declared budget.",
      true,
    );
  }
  if (maxProjection !== null && projectionCount > maxProjection) {
    addError(
      accumulator,
      "projection_budget_exceeded",
      "$.current_projection.items",
      "Projection items exceed their declared budget.",
      true,
    );
  }
  const characters = canonicalizeTaskContextValueV01(packet).length;
  if (maxCharacters !== null && characters > maxCharacters) {
    addError(
      accumulator,
      "character_budget_exceeded",
      "$.constraints.context_budget.max_characters",
      "Packet exceeds its declared character budget.",
      true,
    );
  }
  if (
    maxTokens !== null &&
    estimatedTokens !== null &&
    estimatedTokens > maxTokens
  ) {
    addError(
      accumulator,
      "estimated_token_budget_exceeded",
      "$.constraints.context_budget.estimated_tokens",
      "Estimated tokens exceed the declared token budget.",
      true,
    );
  }
  if (
    estimatedTokens !== null &&
    isRecord(packet.integrity) &&
    isRecord(packet.constraints)
  ) {
    const recomputedEstimate = estimateTaskContextPacketTokensV01(
      packet as unknown as TaskContextPacketV01,
    );
    if (estimatedTokens !== recomputedEstimate) {
      addError(
        accumulator,
        "estimated_token_count_mismatch",
        "$.constraints.context_budget.estimated_tokens",
        `Declared token estimate ${estimatedTokens} does not match deterministic estimate ${recomputedEstimate}.`,
      );
    }
  }
}

function validateCapabilityGrantAtV01(
  input: unknown,
  path: string,
  evaluatedAt: number | null,
  accumulator: ValidationAccumulator,
) {
  if (input === null) return;
  if (!isRecord(input)) {
    addError(
      accumulator,
      "capability_grant_malformed",
      path,
      "capability_grant must be null or an object.",
    );
    return;
  }
  rejectUnknownKeysV01(
    input,
    new Set([
      "grant_ref",
      "grant_external_ref",
      "allowed_capabilities",
      "forbidden_capabilities",
      "resource_scope",
      "stop_conditions",
      "coverage",
      "expires_at",
    ]),
    path,
    accumulator,
  );
  validateExternalRefAtV01(
    input.grant_external_ref,
    `${path}.grant_external_ref`,
    accumulator,
    true,
  );
  requireStringArray(
    input.allowed_capabilities,
    `${path}.allowed_capabilities`,
    accumulator,
  );
  requireStringArray(
    input.forbidden_capabilities,
    `${path}.forbidden_capabilities`,
    accumulator,
  );
  requireStringArray(input.resource_scope, `${path}.resource_scope`, accumulator);
  requireStringArray(input.stop_conditions, `${path}.stop_conditions`, accumulator);
  if (!authorityCoverageLevels.has(String(input.coverage))) {
    addError(
      accumulator,
      "capability_coverage_invalid",
      `${path}.coverage`,
      "Capability coverage is malformed or unsupported.",
    );
  }
  const expiresAt = validateOptionalTimestamp(
    input.expires_at,
    `${path}.expires_at`,
    accumulator,
  );
  if (expiresAt !== null && evaluatedAt !== null && expiresAt <= evaluatedAt) {
    addError(
      accumulator,
      "capability_grant_expired",
      `${path}.expires_at`,
      "Bounded capability summary is expired.",
      true,
    );
  }
}

function validateReturnContractV01(
  input: unknown,
  accumulator: ValidationAccumulator,
) {
  if (!isRecord(input)) {
    addError(
      accumulator,
      "return_contract_malformed",
      "$.return_contract",
      "return_contract must be an object.",
    );
    return;
  }
  rejectUnknownKeysV01(
    input,
    new Set([
      "return_kind",
      "required_fields",
      "expected_artifacts",
      "required_checks",
      "return_ref",
      "compatibility_only",
    ]),
    "$.return_contract",
    accumulator,
  );
  if (
    input.return_kind !== "bounded_result" &&
    input.return_kind !== "compatibility_result_report"
  ) {
    addError(
      accumulator,
      "return_kind_invalid",
      "$.return_contract.return_kind",
      "Unknown return contract kind.",
    );
  }
  if (
    input.return_kind === "compatibility_result_report" &&
    input.compatibility_only !== true
  ) {
    addError(
      accumulator,
      "compatibility_return_overclaim",
      "$.return_contract.compatibility_only",
      "Legacy result-report return must remain compatibility-only.",
      true,
    );
  }
  requireStringArray(
    input.required_fields,
    "$.return_contract.required_fields",
    accumulator,
  );
  requireStringArray(
    input.expected_artifacts,
    "$.return_contract.expected_artifacts",
    accumulator,
  );
  requireStringArray(
    input.required_checks,
    "$.return_contract.required_checks",
    accumulator,
  );
  validateExternalRefAtV01(
    input.return_ref,
    "$.return_contract.return_ref",
    accumulator,
    true,
  );
}

function validateAuthoritySummaryV01(
  input: unknown,
  accumulator: ValidationAccumulator,
) {
  if (!isRecord(input)) {
    addError(
      accumulator,
      "authority_summary_malformed",
      "$.authority_summary",
      "authority_summary must be an object.",
    );
    return;
  }
  rejectUnknownKeysV01(
    input,
    new Set([
      "is_command",
      "is_canonical_project_state",
      "is_approval",
      "performs_durable_transition",
      "grants_execution_authority",
      "grants_external_side_effect_authority",
      "grants_semantic_commit_authority",
      "can_write_database",
      "can_call_provider",
      "can_use_network",
      "can_mutate_external_state",
      "current_projection_is_source_of_truth",
      "provider_refs_are_canonical",
      "notes",
    ]),
    "$.authority_summary",
    accumulator,
    "unknown_authority_field",
    true,
  );
  const falseFields: Array<keyof TaskContextPacketAuthoritySummaryV01> = [
    "is_command",
    "is_canonical_project_state",
    "is_approval",
    "performs_durable_transition",
    "grants_execution_authority",
    "grants_external_side_effect_authority",
    "grants_semantic_commit_authority",
    "can_write_database",
    "can_call_provider",
    "can_use_network",
    "can_mutate_external_state",
    "current_projection_is_source_of_truth",
    "provider_refs_are_canonical",
  ];
  for (const field of falseFields) {
    if (input[field] !== false) {
      addError(
        accumulator,
        "authority_boundary_violation",
        `$.authority_summary.${field}`,
        `${field} must be false for TaskContextPacket v0.1.`,
        true,
      );
    }
  }
  requireStringArray(input.notes, "$.authority_summary.notes", accumulator);
}

function validateSourceStatusV01(
  input: unknown,
  accumulator: ValidationAccumulator,
) {
  if (!isRecord(input)) {
    addError(
      accumulator,
      "source_status_malformed",
      "$.source_status",
      "source_status must be an object.",
    );
    return;
  }
  rejectUnknownKeysV01(
    input,
    new Set([
      "status",
      "currentness",
      "source_refs",
      "external_refs",
      "warnings",
    ]),
    "$.source_status",
    accumulator,
  );
  if (!new Set(["complete", "partial", "unknown"]).has(String(input.status))) {
    addError(
      accumulator,
      "source_status_invalid",
      "$.source_status.status",
      "source_status.status is malformed or unsupported.",
    );
  }
  validateCurrentnessAtV01(
    input.currentness,
    "$.source_status.currentness",
    accumulator,
  );
  requireStringArray(input.source_refs, "$.source_status.source_refs", accumulator);
  validateExternalRefArrayAtV01(
    input.external_refs,
    "$.source_status.external_refs",
    accumulator,
  );
  requireStringArray(input.warnings, "$.source_status.warnings", accumulator);
  const sourceRefCount = Array.isArray(input.source_refs)
    ? input.source_refs.length
    : 0;
  const externalRefCount = Array.isArray(input.external_refs)
    ? input.external_refs.length
    : 0;
  const sourceCurrentness = jsonRecord(input.currentness);
  if (
    input.status === "complete" &&
    sourceRefCount + externalRefCount === 0
  ) {
    addError(
      accumulator,
      "source_status_incoherent",
      "$.source_status",
      "Complete source coverage requires at least one source reference.",
    );
  }
  if (input.status !== "complete") {
    addWarning(
      accumulator,
      "source_status_not_complete",
      "$.source_status.status",
      "Packet sources are partial or unknown; downstream use must preserve that warning.",
    );
  }
  const currentnessStatus = stringValue(sourceCurrentness?.status);
  if (
    currentnessStatus &&
    currentnessStatuses.has(currentnessStatus) &&
    currentnessStatus !== "fresh"
  ) {
    addWarning(
      accumulator,
      "source_currentness_not_fresh",
      "$.source_status.currentness.status",
      "Source currentness is stale, partial, or unknown independently of source coverage.",
    );
  }
}

function validateCompatibilityV01(
  input: unknown,
  accumulator: ValidationAccumulator,
) {
  if (!isRecord(input)) {
    addError(
      accumulator,
      "compatibility_malformed",
      "$.compatibility",
      "compatibility metadata must be an object.",
    );
    return;
  }
  rejectUnknownKeysV01(
    input,
    new Set([
      "source_contracts",
      "legacy_scope_ref",
      "source_refs",
      "unmapped_fields",
      "warnings",
    ]),
    "$.compatibility",
    accumulator,
  );
  const sourceContracts = requireStringArray(
    input.source_contracts,
    "$.compatibility.source_contracts",
    accumulator,
  );
  if (sourceContracts.length === 0) {
    addError(
      accumulator,
      "compatibility_source_contract_missing",
      "$.compatibility.source_contracts",
      "At least one source contract must be identified.",
    );
  }
  validateExternalRefAtV01(
    input.legacy_scope_ref,
    "$.compatibility.legacy_scope_ref",
    accumulator,
    true,
  );
  validateExternalRefArrayAtV01(
    input.source_refs,
    "$.compatibility.source_refs",
    accumulator,
  );
  requireStringArray(input.warnings, "$.compatibility.warnings", accumulator);
  if (!Array.isArray(input.unmapped_fields)) {
    addError(
      accumulator,
      "compatibility_unmapped_fields_malformed",
      "$.compatibility.unmapped_fields",
      "unmapped_fields must be an array.",
    );
    return;
  }
  input.unmapped_fields.forEach((value, index) => {
    const path = `$.compatibility.unmapped_fields[${index}]`;
    if (!isRecord(value)) {
      addError(
        accumulator,
        "compatibility_unmapped_field_malformed",
        path,
        "Unmapped compatibility field must be an object.",
      );
      return;
    }
    rejectUnknownKeysV01(
      value,
      new Set(["source_field", "reason", "source_ref", "redacted"]),
      path,
      accumulator,
    );
    requireString(value, "source_field", path, accumulator);
    requireString(value, "reason", path, accumulator);
    if (value.redacted !== true) {
      addError(
        accumulator,
        "compatibility_unmapped_field_not_redacted",
        `${path}.redacted`,
        "Unmapped field content must not be copied into the packet.",
        true,
      );
    }
    validateExternalRefAtV01(
      value.source_ref,
      `${path}.source_ref`,
      accumulator,
      true,
    );
  });
}

function validateCurrentnessAtV01(
  input: unknown,
  path: string,
  accumulator: ValidationAccumulator,
) {
  if (!isRecord(input)) {
    addError(
      accumulator,
      "currentness_malformed",
      path,
      "Currentness must be an object.",
    );
    return;
  }
  rejectUnknownKeysV01(
    input,
    new Set(["status", "as_of", "basis", "source_ref"]),
    path,
    accumulator,
  );
  const status = stringValue(input.status);
  if (!status || !currentnessStatuses.has(status)) {
    addError(
      accumulator,
      "currentness_status_invalid",
      `${path}.status`,
      "Currentness status is malformed or unsupported.",
    );
  }
  const asOf = validateOptionalTimestamp(
    input.as_of,
    `${path}.as_of`,
    accumulator,
  );
  if (status && status !== "unknown" && asOf === null) {
    addError(
      accumulator,
      "currentness_timestamp_missing",
      `${path}.as_of`,
      "Fresh, stale, or partial currentness requires an as_of timestamp.",
    );
  }
  requireString(input, "basis", path, accumulator);
  validateExternalRefAtV01(
    input.source_ref,
    `${path}.source_ref`,
    accumulator,
    true,
  );
}

function validateExternalRefAtV01(
  input: unknown,
  path: string,
  accumulator: ValidationAccumulator,
  nullable = false,
) {
  validateExternalRefStructureV01(input, path, issueSink(accumulator), nullable);
}

function validateExternalRefArrayAtV01(
  input: unknown,
  path: string,
  accumulator: ValidationAccumulator,
) {
  if (!Array.isArray(input)) {
    addError(
      accumulator,
      "external_ref_array_malformed",
      path,
      "Expected an array of ExternalRef values.",
    );
    return;
  }
  input.forEach((value, index) =>
    validateExternalRefAtV01(value, `${path}[${index}]`, accumulator),
  );
}

function validateWorkRefV01(
  input: unknown,
  path: string,
  accumulator: ValidationAccumulator,
) {
  if (input === null) return;
  if (typeof input === "string") {
    if (!input.trim()) {
      addError(accumulator, "work_ref_malformed", path, "work_ref is empty.");
    }
    return;
  }
  validateExternalRefAtV01(input, path, accumulator);
}

function validateDuplicateExternalRefsV01(
  input: JsonRecord,
  accumulator: ValidationAccumulator,
) {
  validateDuplicateExternalRefsPrimitiveV01(input, issueSink(accumulator));
}

function validateRequiredGapCoverageV01(
  input: JsonRecord,
  accumulator: ValidationAccumulator,
) {
  const task = jsonRecord(input.task);
  const gaps = Array.isArray(input.gaps) ? input.gaps : [];
  const gapCodes = new Set(
    gaps
      .map((gap) => (isRecord(gap) ? stringValue(gap.code) : null))
      .filter((code): code is string => Boolean(code)),
  );
  const checks: Array<{
    missing: boolean;
    code: string;
    path: string;
    message: string;
  }> = [
    {
      missing: !Array.isArray(task?.success_criteria) || task.success_criteria.length === 0,
      code: "missing_success_criteria",
      path: "$.task.success_criteria",
      message: "Missing success criteria must be preserved as a gap.",
    },
    {
      missing: !Array.isArray(task?.non_goals) || task.non_goals.length === 0,
      code: "missing_non_goals",
      path: "$.task.non_goals",
      message: "Missing non-goals must be preserved as a gap.",
    },
    {
      missing: input.current_projection === null,
      code: "missing_current_projection",
      path: "$.current_projection",
      message: "Missing Current Working Perspective must be preserved as a gap.",
    },
    {
      missing:
        !Array.isArray(input.selected_context) ||
        input.selected_context.length === 0,
      code: "missing_selected_context",
      path: "$.selected_context",
      message: "Missing selected context must be preserved as a gap.",
    },
  ];
  for (const check of checks) {
    if (check.missing && !gapCodes.has(check.code)) {
      addError(
        accumulator,
        `${check.code}_gap_missing`,
        check.path,
        check.message,
      );
    } else if (check.missing) {
      addWarning(
        accumulator,
        check.code,
        check.path,
        check.message,
      );
    }
  }
}

function validateIntegrityV01(
  input: JsonRecord,
  accumulator: ValidationAccumulator,
) {
  const integrity = jsonRecord(input.integrity);
  if (!integrity) {
    addError(
      accumulator,
      "integrity_missing",
      "$.integrity",
      "TaskContextPacket integrity metadata is required.",
    );
    return;
  }
  rejectUnknownKeysV01(
    integrity,
    new Set([
      "canonicalization",
      "fingerprint_algorithm",
      "fingerprint_scope",
      "fingerprint",
    ]),
    "$.integrity",
    accumulator,
  );
  if (integrity.canonicalization !== TASK_CONTEXT_PACKET_CANONICALIZATION_V01) {
    addError(
      accumulator,
      "canonicalization_unsupported",
      "$.integrity.canonicalization",
      "Unsupported TaskContextPacket canonicalization.",
    );
  }
  if (integrity.fingerprint_algorithm !== "sha256") {
    addError(
      accumulator,
      "fingerprint_algorithm_unsupported",
      "$.integrity.fingerprint_algorithm",
      "TaskContextPacket v0.1 requires SHA-256 fingerprinting.",
    );
  }
  if (integrity.fingerprint_scope !== "packet_without_integrity_fingerprint") {
    addError(
      accumulator,
      "fingerprint_scope_unsupported",
      "$.integrity.fingerprint_scope",
      "TaskContextPacket fingerprint scope is unsupported.",
    );
  }
  const fingerprint = stringValue(integrity.fingerprint);
  if (!fingerprint || !/^sha256:[a-f0-9]{64}$/.test(fingerprint)) {
    addError(
      accumulator,
      "fingerprint_malformed",
      "$.integrity.fingerprint",
      "TaskContextPacket fingerprint is malformed.",
    );
    return;
  }
  const typedPacket = input as unknown as TaskContextPacketV01;
  const expectedFingerprint = createTaskContextPacketFingerprintV01(typedPacket);
  if (fingerprint !== expectedFingerprint) {
    addError(
      accumulator,
      "fingerprint_mismatch",
      "$.integrity.fingerprint",
      "TaskContextPacket fingerprint does not match its normalized content.",
    );
  }
  const packetId = stringValue(input.packet_id);
  const expectedPacketId = deriveTaskContextPacketIdV01(typedPacket);
  if (packetId && packetId !== expectedPacketId) {
    addError(
      accumulator,
      "packet_identity_mismatch",
      "$.packet_id",
      "TaskContextPacket packet_id is inconsistent with its deterministic identity.",
    );
  }
}

function scanForbiddenPacketMaterialV01(
  value: unknown,
  path: string,
  accumulator: ValidationAccumulator,
  insideExternalRef: boolean,
) {
  scanForbiddenProtocolMaterialV01(
    value,
    path,
    issueSink(accumulator),
    {
      secret_material_message:
        "Secret-shaped material is forbidden in TaskContextPacket.",
      provider_specific_field_message:
        "Provider, host, model, task, run, thread, and session identifiers must remain ExternalRef values.",
    },
    insideExternalRef,
  );
}

function requireString(
  record: JsonRecord,
  field: string,
  path: string,
  accumulator: ValidationAccumulator,
): string | null {
  const value = stringValue(record[field]);
  if (!value) {
    addError(
      accumulator,
      `${field}_missing`,
      `${path}.${field}`,
      `${field} must be a non-empty string.`,
    );
  }
  return value;
}

function requireStringArray(
  value: unknown,
  path: string,
  accumulator: ValidationAccumulator,
): string[] {
  if (!Array.isArray(value) || value.some((item) => !stringValue(item))) {
    addError(
      accumulator,
      "string_array_malformed",
      path,
      "Expected an array of non-empty strings.",
    );
    return [];
  }
  return value as string[];
}

function requireIsoTimestamp(
  value: unknown,
  path: string,
  accumulator: ValidationAccumulator,
): number | null {
  const parsed = parseIsoTimestamp(value);
  if (parsed === null) {
    addError(
      accumulator,
      "timestamp_invalid",
      path,
      "Expected a valid ISO-8601 timestamp with timezone.",
    );
  }
  return parsed;
}

function validateOptionalTimestamp(
  value: unknown,
  path: string,
  accumulator: ValidationAccumulator,
): number | null {
  if (value === null || value === undefined) return null;
  return requireIsoTimestamp(value, path, accumulator);
}

function parseIsoTimestamp(value: unknown): number | null {
  return parseStrictIsoTimestampV01(value);
}

function createAccumulator(): ValidationAccumulator {
  return { errors: [], warnings: [], blocked: false };
}

function issueSink(accumulator: ValidationAccumulator) {
  return {
    error(
      code: string,
      path: string | null,
      message: string,
      blocked = false,
    ) {
      addError(accumulator, code, path, message, blocked);
    },
    warning(code: string, path: string | null, message: string) {
      addWarning(accumulator, code, path, message);
    },
  };
}

function rejectUnknownKeysV01(
  record: JsonRecord,
  allowed: ReadonlySet<string>,
  path: string,
  accumulator: ValidationAccumulator,
  code = "unknown_schema_field",
  blocked = false,
) {
  for (const key of Object.keys(record)) {
    if (allowed.has(key)) continue;
    addError(
      accumulator,
      code,
      `${path}.${key}`,
      `Field ${key} is not part of this v0.1 contract.`,
      blocked,
    );
  }
}

function addError(
  accumulator: ValidationAccumulator,
  code: string,
  path: string | null,
  message: string,
  blocked = false,
) {
  accumulator.errors.push({ severity: "error", code, path, message });
  if (blocked) accumulator.blocked = true;
}

function addWarning(
  accumulator: ValidationAccumulator,
  code: string,
  path: string | null,
  message: string,
) {
  accumulator.warnings.push({ severity: "warning", code, path, message });
}

function buildValidationResult(
  accumulator: ValidationAccumulator,
  version:
    | typeof TASK_CONTEXT_PACKET_VERSION_V01
    | typeof EXTERNAL_REF_VERSION_V01
    | null,
): TaskContextPacketValidationResultV01 {
  return {
    status: accumulator.blocked
      ? "blocked"
      : accumulator.errors.length > 0
        ? "invalid"
        : "valid",
    normalized_protocol_version: version,
    errors: accumulator.errors,
    warnings: accumulator.warnings,
  };
}

function normalizeText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeNullableText(value: unknown): string | null {
  const text = normalizeText(value);
  return text || null;
}

function stringValue(value: unknown): string | null {
  return normalizeNullableText(value);
}

function jsonRecord(value: unknown): JsonRecord | null {
  return isRecord(value) ? value : null;
}

function isRecord(value: unknown): value is JsonRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function uniqueSortedStrings(values: unknown): string[] {
  if (!Array.isArray(values)) return [];
  return [...new Set(values.map(normalizeText).filter(Boolean))].sort(
    compareCodeUnits,
  );
}

function uniqueByCanonical<T>(values: T[]): T[] {
  const unique = new Map<string, T>();
  for (const value of values) {
    const canonical = canonicalizeTaskContextValueV01(value);
    if (!unique.has(canonical)) unique.set(canonical, value);
  }
  return [...unique.values()];
}

function compareCanonical(a: unknown, b: unknown) {
  return compareCodeUnits(
    canonicalizeTaskContextValueV01(a),
    canonicalizeTaskContextValueV01(b),
  );
}

function compareExternalRefs(a: ExternalRefV01, b: ExternalRefV01) {
  return compareCodeUnits(externalRefSortKey(a), externalRefSortKey(b));
}

function compareCodeUnits(a: string, b: string) {
  return a < b ? -1 : a > b ? 1 : 0;
}

function externalRefSortKey(ref: ExternalRefV01) {
  return [
    ref.compatibility_namespace ?? "",
    ref.ref_type,
    ref.external_id,
    ref.provider ?? "",
    ref.host ?? "",
    ref.trust_class,
    canonicalizeTaskContextValueV01(ref),
  ].join("|");
}

function positiveIntegerOrDefault(value: unknown, fallback: number) {
  return Number.isInteger(value) && Number(value) > 0 ? Number(value) : fallback;
}

function positiveIntegerOrNull(value: unknown): number | null {
  return Number.isInteger(value) && Number(value) > 0 ? Number(value) : null;
}

function sha256(value: string) {
  return createProtocolSha256V01(value);
}
