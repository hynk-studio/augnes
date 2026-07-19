import {
  assertModelEgressTextIsSafe,
} from "@/lib/model-egress/bounded-model-payload";
import {
  canonicalizeProtocolValueV01,
  compareExternalRefsV01,
  compareProtocolCanonicalV01,
  createProtocolSha256V01,
  normalizeExternalRefPrimitiveV01,
  normalizeProtocolTextV01,
  uniqueProtocolStringsV01,
  uniqueProtocolValuesV01,
  validateExternalRefStructureV01,
} from "@/lib/vnext/protocol-primitives";
import { validateCriterionAssessmentV01 } from "@/lib/vnext/criterion-assessment";
import { validateModelInvocationReceiptV02 } from "@/lib/vnext/model-gateway/model-invocation-receipt";
import { validateModelGatewayCostBudgetV01 } from "@/lib/vnext/model-gateway/cost-authority";
import { assertNativeHostPublicTextV01 } from "@/lib/vnext/native-host/native-host-contract";
import {
  EXTERNAL_REF_TRUST_CLASSES_V01,
  type ExternalRefTrustClassV01,
  type ExternalRefV01,
} from "@/types/vnext/external-ref";
import {
  STRATEGIC_ADVANTAGE_TRANSFER_BUDGET_VERSION_V01,
  STRATEGIC_ADVANTAGE_TRANSFER_ADVERSE_CONTEXT_VERSION_V01,
  STRATEGIC_ADVANTAGE_TRANSFER_LENSES_V01,
  STRATEGIC_ADVANTAGE_TRANSFER_MAX_CANONICAL_UTF8_BYTES_V01,
  STRATEGIC_ADVANTAGE_TRANSFER_MAX_ADVERSE_CONTEXT_ITEMS_V01,
  STRATEGIC_ADVANTAGE_TRANSFER_MAX_INPUT_BYTES_V01,
  STRATEGIC_ADVANTAGE_TRANSFER_MAX_LENSES_V01,
  STRATEGIC_ADVANTAGE_TRANSFER_MAX_OUTPUT_TOKENS_V01,
  STRATEGIC_ADVANTAGE_TRANSFER_MAX_SOURCE_CATALOG_ITEMS_V01,
  STRATEGIC_ADVANTAGE_TRANSFER_MAX_SOURCE_REFS_V01,
  STRATEGIC_ADVANTAGE_TRANSFER_MAX_TEXT_CHARACTERS_V01,
  STRATEGIC_ADVANTAGE_TRANSFER_MAX_TEXT_ITEMS_V01,
  STRATEGIC_ADVANTAGE_TRANSFER_MAX_TRANSFERS_V01,
  STRATEGIC_ADVANTAGE_TRANSFER_MODEL_SCHEMA_VERSION_V01,
  STRATEGIC_ADVANTAGE_TRANSFER_PROFILE_VERSION_V01,
  STRATEGIC_ADVANTAGE_TRANSFER_SOURCE_CATALOG_VERSION_V01,
  STRATEGIC_ADVANTAGE_TRANSFER_TIMEOUT_MS_V01,
  STRATEGIC_ADVANTAGE_TRANSFER_WORKING_FRAME_VERSION_V01,
  type StrategicAdvantageTransferBudgetV01,
  type StrategicAdvantageTransferAdverseContextItemV01,
  type StrategicAdvantageTransferAdverseContextV01,
  type StrategicAdvantageTransferAdverseCategoryV01,
  type StrategicAdvantageTransferAdverseEpistemicClassV01,
  type StrategicAdvantageTransferLensIdV01,
  type StrategicAdvantageTransferModelLensResultV01,
  type StrategicAdvantageTransferModelOutputV01,
  type StrategicAdvantageTransferModelTransferV01,
  type StrategicAdvantageTransferNormalizedItemV01,
  type StrategicAdvantageTransferProfileV01,
  type StrategicAdvantageTransferSourceCatalogV01,
  type StrategicAdvantageTransferWorkingFrameV01,
} from "@/types/vnext/strategic-advantage-transfer";

const SHA256 = /^sha256:[a-f0-9]{64}$/u;
const SAFE_ID = /^[A-Za-z0-9:._-]{1,256}$/u;
const SOURCE_KEY = /^source:[a-f0-9]{24}$/u;
const STRATEGIC_ADVERSE_CATEGORIES_V01 = [
  "conflict",
  "receipt_blocker",
  "receipt_warning",
  "receipt_gap",
  "failed_check",
  "blocked_check",
  "skipped_check",
  "unsupported_capability",
  "outside_coverage",
  "missing_information",
  "uncertainty",
  "unknown_criterion",
  "insufficient_criterion",
  "packet_gap",
  "packet_exclusion",
  "stale_source",
  "unavailable_source",
] as const satisfies readonly StrategicAdvantageTransferAdverseCategoryV01[];
const STRATEGIC_POSITIVE_SUPPORT_MATERIAL_KINDS_V01 = new Set([
  "source_observation:strategic_transfer_support",
]);

export class StrategicAdvantageTransferProtocolErrorV01 extends Error {
  constructor(readonly code: string, readonly path: string = "$") {
    super(code);
    this.name = "StrategicAdvantageTransferProtocolErrorV01";
  }
}

export interface StrategicAdvantageTransferValidationIssueV01 {
  code: string;
  path: string;
}

export interface StrategicAdvantageTransferProfileValidationResultV01 {
  status: "valid" | "blocked";
  errors: StrategicAdvantageTransferValidationIssueV01[];
}

export function createStrategicAdvantageTransferBudgetV01(
  costBudget: import("@/types/vnext/model-invocation-receipt").ModelGatewayCostBudgetV01 | null = null,
): StrategicAdvantageTransferBudgetV01 {
  return {
    budget_version: STRATEGIC_ADVANTAGE_TRANSFER_BUDGET_VERSION_V01,
    max_lenses: STRATEGIC_ADVANTAGE_TRANSFER_MAX_LENSES_V01,
    max_transfer_items: STRATEGIC_ADVANTAGE_TRANSFER_MAX_TRANSFERS_V01,
    max_source_catalog_items:
      STRATEGIC_ADVANTAGE_TRANSFER_MAX_SOURCE_CATALOG_ITEMS_V01,
    max_source_refs_per_transfer:
      STRATEGIC_ADVANTAGE_TRANSFER_MAX_SOURCE_REFS_V01,
    max_text_characters:
      STRATEGIC_ADVANTAGE_TRANSFER_MAX_TEXT_CHARACTERS_V01,
    max_total_canonical_utf8_bytes:
      STRATEGIC_ADVANTAGE_TRANSFER_MAX_CANONICAL_UTF8_BYTES_V01,
    model: {
      max_input_bytes: STRATEGIC_ADVANTAGE_TRANSFER_MAX_INPUT_BYTES_V01,
      max_output_tokens: STRATEGIC_ADVANTAGE_TRANSFER_MAX_OUTPUT_TOKENS_V01,
      max_provider_calls: 1,
      timeout_ms: STRATEGIC_ADVANTAGE_TRANSFER_TIMEOUT_MS_V01,
      automatic_retry: false,
      provider_failover: false,
      cost: costBudget
        ? { status: "available", budget: structuredClone(costBudget) }
        : {
            status: "unavailable",
            reason: "cost_authority_unavailable",
          },
    },
    truncation_allowed: false,
  };
}

export function createStrategicWorkingFrameFingerprintV01(
  frame: Omit<StrategicAdvantageTransferWorkingFrameV01, "working_frame_fingerprint">,
): string {
  return createProtocolSha256V01(canonicalizeProtocolValueV01(frame));
}

export function createStrategicSourceCatalogFingerprintV01(
  catalog: Omit<StrategicAdvantageTransferSourceCatalogV01, "source_catalog_fingerprint">,
): string {
  return createProtocolSha256V01(canonicalizeProtocolValueV01(catalog));
}

export function createStrategicAdverseContextFingerprintV01(
  context: Omit<
    StrategicAdvantageTransferAdverseContextV01,
    "adverse_context_fingerprint"
  >,
): string {
  return createProtocolSha256V01(canonicalizeProtocolValueV01(context));
}

export function createStrategicAdverseContextItemCodeV01(input: {
  category: StrategicAdvantageTransferAdverseCategoryV01;
  discriminator: unknown;
  bounded_summary: string;
  source_refs: ExternalRefV01[];
}): string {
  return `adverse:${input.category}:${createProtocolSha256V01(
    canonicalizeProtocolValueV01({
      discriminator: input.discriminator,
      bounded_summary: boundedText(
        input.bounded_summary,
        "$server_adverse_context.item.bounded_summary",
      ),
      source_refs: normalizeRefs(input.source_refs),
    }),
  ).slice(7, 31)}`;
}

export function projectStrategicCatalogAdverseContextItemsV01(
  input: StrategicAdvantageTransferSourceCatalogV01,
): StrategicAdvantageTransferAdverseContextItemV01[] {
  const catalog = validateStrategicAdvantageTransferSourceCatalogV01(input);
  return catalog.items
    .flatMap((entry) => {
      const categories = strategicCatalogAdverseCategoriesV01(
        entry.material_kind,
      );
      const sourceRefs = [normalizeExternalRefPrimitiveV01(entry.ref)];
      return categories.map((category) => ({
        code: createStrategicAdverseContextItemCodeV01({
          category,
          discriminator: {
            source_key: entry.source_key,
            material_kind: entry.material_kind,
          },
          bounded_summary: entry.bounded_summary,
          source_refs: sourceRefs,
        }),
        category,
        bounded_summary: entry.bounded_summary,
        source_refs: sourceRefs,
        epistemic_class: entry.trust_class,
        scope: "source_linked" as const,
      }));
    })
    .sort(compareProtocolCanonicalV01);
}

export function createStrategicAdvantageTransferAdverseContextV01(
  items: readonly StrategicAdvantageTransferAdverseContextItemV01[],
): StrategicAdvantageTransferAdverseContextV01 {
  const normalizedItems = uniqueProtocolValuesV01(
    items.map((item, index) =>
      normalizeStrategicAdverseContextItemV01(
        item,
        `$server_adverse_context.items[${index}]`,
      ),
    ),
  ).sort(compareProtocolCanonicalV01);
  if (
    normalizedItems.length >
    STRATEGIC_ADVANTAGE_TRANSFER_MAX_ADVERSE_CONTEXT_ITEMS_V01
  ) {
    fail(
      "strategic_advantage_transfer_adverse_context_bound_exceeded",
      "$server_adverse_context.items",
    );
  }
  const withoutFingerprint = {
    projection_version:
      STRATEGIC_ADVANTAGE_TRANSFER_ADVERSE_CONTEXT_VERSION_V01,
    items: normalizedItems,
  };
  const context = {
    ...withoutFingerprint,
    adverse_context_fingerprint:
      createStrategicAdverseContextFingerprintV01(withoutFingerprint),
  };
  validateStrategicAdvantageTransferAdverseContextV01(context);
  return context;
}

export function validateStrategicAdvantageTransferAdverseContextV01(
  input: unknown,
): StrategicAdvantageTransferAdverseContextV01 {
  const context = exactRecord(
    input,
    ["projection_version", "items", "adverse_context_fingerprint"],
    "$strategic_advantage_transfer.server_adverse_context",
  );
  literal(
    context.projection_version,
    STRATEGIC_ADVANTAGE_TRANSFER_ADVERSE_CONTEXT_VERSION_V01,
    "$strategic_advantage_transfer.server_adverse_context.projection_version",
  );
  const items = exactArray(
    context.items,
    "$strategic_advantage_transfer.server_adverse_context.items",
    0,
    STRATEGIC_ADVANTAGE_TRANSFER_MAX_ADVERSE_CONTEXT_ITEMS_V01,
  ).map((item, index) =>
    normalizeStrategicAdverseContextItemV01(
      item as StrategicAdvantageTransferAdverseContextItemV01,
      `$strategic_advantage_transfer.server_adverse_context.items[${index}]`,
    ),
  );
  if (
    canonicalizeProtocolValueV01(items) !==
    canonicalizeProtocolValueV01(
      uniqueProtocolValuesV01(items).sort(compareProtocolCanonicalV01),
    )
  ) {
    fail(
      "strategic_advantage_transfer_adverse_context_noncanonical",
      "$strategic_advantage_transfer.server_adverse_context.items",
    );
  }
  requiredSha(
    context.adverse_context_fingerprint,
    "$strategic_advantage_transfer.server_adverse_context.adverse_context_fingerprint",
  );
  const withoutFingerprint = {
    projection_version:
      STRATEGIC_ADVANTAGE_TRANSFER_ADVERSE_CONTEXT_VERSION_V01,
    items,
  };
  if (
    context.adverse_context_fingerprint !==
    createStrategicAdverseContextFingerprintV01(withoutFingerprint)
  ) {
    fail(
      "strategic_advantage_transfer_adverse_context_fingerprint_conflict",
      "$strategic_advantage_transfer.server_adverse_context.adverse_context_fingerprint",
    );
  }
  assertStrategicAdvantageTransferSourceTextSafeV01(
    context,
    "$strategic_advantage_transfer.server_adverse_context",
  );
  assertCanonicalSize(
    context,
    "$strategic_advantage_transfer.server_adverse_context",
  );
  return structuredClone(context) as unknown as StrategicAdvantageTransferAdverseContextV01;
}

function normalizeStrategicAdverseContextItemV01(
  input: unknown,
  path: string,
): StrategicAdvantageTransferAdverseContextItemV01 {
  const item = exactRecord(
    input,
    [
      "code",
      "category",
      "bounded_summary",
      "source_refs",
      "epistemic_class",
      "scope",
    ],
    path,
  );
  const code = requiredId(item.code, `${path}.code`);
  const category = requiredText(item.category, `${path}.category`);
  if (
    !STRATEGIC_ADVERSE_CATEGORIES_V01.includes(
      category as StrategicAdvantageTransferAdverseCategoryV01,
    )
  ) {
    fail(
      "strategic_advantage_transfer_adverse_context_category_invalid",
      `${path}.category`,
    );
  }
  const boundedSummary = boundedText(
    item.bounded_summary,
    `${path}.bounded_summary`,
  );
  const sourceRefs = refArray(item.source_refs, `${path}.source_refs`);
  const epistemicClass = requiredText(
    item.epistemic_class,
    `${path}.epistemic_class`,
  );
  if (
    ![
      ...EXTERNAL_REF_TRUST_CLASSES_V01,
      "unavailable",
      "unknown",
    ].includes(epistemicClass as StrategicAdvantageTransferAdverseEpistemicClassV01)
  ) {
    fail(
      "strategic_advantage_transfer_adverse_context_epistemic_class_invalid",
      `${path}.epistemic_class`,
    );
  }
  const scope = requiredText(item.scope, `${path}.scope`);
  if (scope !== "source_linked" && scope !== "task_wide_context") {
    fail(
      "strategic_advantage_transfer_adverse_context_scope_invalid",
      `${path}.scope`,
    );
  }
  if (scope === "source_linked" && sourceRefs.length === 0) {
    fail(
      "strategic_advantage_transfer_adverse_context_source_ref_required",
      `${path}.source_refs`,
    );
  }
  return {
    code,
    category: category as StrategicAdvantageTransferAdverseCategoryV01,
    bounded_summary: boundedSummary,
    source_refs: sourceRefs,
    epistemic_class:
      epistemicClass as StrategicAdvantageTransferAdverseEpistemicClassV01,
    scope,
  };
}

export function createStrategicSourceKeyV01(input: {
  ref: ExternalRefV01;
  material_kind: string;
  bounded_summary: string;
}): string {
  return `source:${createProtocolSha256V01(
    canonicalizeProtocolValueV01({
      ref: normalizeExternalRefPrimitiveV01(input.ref),
      material_kind: normalizeProtocolTextV01(input.material_kind),
      bounded_summary: normalizeProtocolTextV01(input.bounded_summary),
    }),
  ).slice("sha256:".length, "sha256:".length + 24)}`;
}

export function createStrategicAnalysisIdentityV01(input: unknown): string {
  return createProtocolSha256V01(canonicalizeProtocolValueV01(input));
}

export function assertStrategicAdvantageTransferSourceTextSafeV01(
  value: unknown,
  path = "$source",
): void {
  if (typeof value === "string") {
    try {
      assertNativeHostPublicTextV01(value);
    } catch {
      fail("strategic_advantage_transfer_source_text_unsafe", path);
    }
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) =>
      assertStrategicAdvantageTransferSourceTextSafeV01(
        item,
        `${path}[${index}]`,
      ),
    );
    return;
  }
  if (!value || typeof value !== "object") return;
  for (const [key, item] of Object.entries(value)) {
    assertStrategicAdvantageTransferSourceTextSafeV01(
      item,
      `${path}.${key}`,
    );
  }
}

export function normalizeStrategicAdvantageTransferModelOutputV01(
  input: unknown,
  expectedLenses?: readonly StrategicAdvantageTransferLensIdV01[],
): StrategicAdvantageTransferModelOutputV01 {
  const root = exactRecord(input, ["schema_version", "lens_results", "stop_reason"], "$model");
  literal(
    root.schema_version,
    STRATEGIC_ADVANTAGE_TRANSFER_MODEL_SCHEMA_VERSION_V01,
    "$model.schema_version",
  );
  const lensResults = exactArray(
    root.lens_results,
    "$model.lens_results",
    1,
    STRATEGIC_ADVANTAGE_TRANSFER_MAX_LENSES_V01,
  ).map((value, index) =>
    normalizeLensResult(value, `$model.lens_results[${index}]`),
  );
  const lensIds = lensResults.map((result) => result.lens_id);
  if (new Set(lensIds).size !== lensIds.length) {
    fail("strategic_advantage_transfer_duplicate_lens", "$model.lens_results");
  }
  if (
    expectedLenses &&
    canonicalizeProtocolValueV01([...lensIds].sort()) !==
      canonicalizeProtocolValueV01([...expectedLenses].sort())
  ) {
    fail("strategic_advantage_transfer_lens_relation_conflict", "$model.lens_results");
  }
  const stopReason = requiredText(root.stop_reason, "$model.stop_reason");
  if (
    stopReason !== "completed" &&
    stopReason !== "no_transferable_advantage"
  ) {
    fail("strategic_advantage_transfer_stop_reason_invalid", "$model.stop_reason");
  }
  const transferCount = lensResults.filter(
    (result) => result.result === "transfer",
  ).length;
  if (
    (transferCount === 0 && stopReason !== "no_transferable_advantage") ||
    (transferCount > 0 && stopReason !== "completed")
  ) {
    fail("strategic_advantage_transfer_stop_reason_conflict", "$model.stop_reason");
  }
  const normalized: StrategicAdvantageTransferModelOutputV01 = {
    schema_version: STRATEGIC_ADVANTAGE_TRANSFER_MODEL_SCHEMA_VERSION_V01,
    lens_results: [...lensResults].sort(compareProtocolCanonicalV01),
    stop_reason: stopReason,
  };
  assertModelEgressTextIsSafe(
    "strategic_advantage_transfer",
    canonicalizeProtocolValueV01(normalized),
  );
  assertStrategicAdvantageTransferSourceTextSafeV01(
    normalized,
    "$model",
  );
  assertCanonicalSize(normalized, "$model");
  return normalized;
}

export function validateStrategicAdvantageTransferWorkingFrameV01(
  input: unknown,
): StrategicAdvantageTransferWorkingFrameV01 {
  return validateWorkingFrame(input);
}

export function validateStrategicAdvantageTransferSourceCatalogV01(
  input: unknown,
): StrategicAdvantageTransferSourceCatalogV01 {
  return validateCatalog(input);
}

export function resolveStrategicAdvantageTransferItemsV01(input: {
  catalog: StrategicAdvantageTransferSourceCatalogV01;
  server_adverse_context: StrategicAdvantageTransferAdverseContextV01;
  model_output: StrategicAdvantageTransferModelOutputV01;
}): StrategicAdvantageTransferNormalizedItemV01[] {
  const adverseContext =
    validateStrategicAdvantageTransferAdverseContextV01(
      input.server_adverse_context,
    );
  const catalogByKey = new Map(
    input.catalog.items.map((item) => [item.source_key, item] as const),
  );
  return input.model_output.lens_results
    .filter(
      (result): result is StrategicAdvantageTransferModelTransferV01 =>
        result.result === "transfer",
    )
    .map((transfer) => {
      const sourceKeys = uniqueProtocolStringsV01(transfer.source_keys);
      const regressionKeys = uniqueProtocolStringsV01(
        transfer.regression_review.source_keys,
      );
      if (sourceKeys.length === 0) {
        fail(
          "strategic_advantage_transfer_source_required",
          `$model.${transfer.lens_id}.source_keys`,
        );
      }
      const sourceEntries = resolveCatalogKeys(
        catalogByKey,
        sourceKeys,
        `$model.${transfer.lens_id}.source_keys`,
      );
      const regressionEntries = resolveCatalogKeys(
        catalogByKey,
        regressionKeys,
        `$model.${transfer.lens_id}.regression_review.source_keys`,
      );
      const selectedSupportEntries = sourceEntries
        .map((entry) => ({
          source_key: entry.source_key,
          ref: entry.ref,
          material_kind: entry.material_kind,
          trust_class: entry.trust_class,
        }))
        .sort(compareProtocolCanonicalV01);
      const support = classifyStrategicSupport({
        selected_support_entries: sourceEntries,
        full_catalog_adverse_entries: input.catalog.items.filter(
          (entry) =>
            strategicCatalogAdverseCategoriesV01(entry.material_kind).length >
            0,
        ),
        task_wide_adverse_context: adverseContext.items.filter(
          (entry) => entry.scope === "task_wide_context",
        ),
        server_adverse_context_fingerprint:
          adverseContext.adverse_context_fingerprint,
      });
      const core = {
        lens_id: transfer.lens_id,
        title: transfer.title,
        applicability_condition: transfer.applicability_condition,
        expected_effect: transfer.expected_effect,
        transfer_cost: transfer.transfer_cost,
        source_keys: sourceKeys,
        source_refs: normalizeRefs(sourceEntries.map((entry) => entry.ref)),
        selected_support_entries: selectedSupportEntries,
        falsifier: transfer.falsifier,
        uncertainty: uniqueProtocolStringsV01(transfer.uncertainty),
        introduced_risks: uniqueProtocolStringsV01(
          transfer.introduced_risks,
        ),
        patch_summary: transfer.patch_summary,
        regression_review: {
          regression_risks: uniqueProtocolStringsV01(
            transfer.regression_review.regression_risks,
          ),
          checks_or_observations_needed: uniqueProtocolStringsV01(
            transfer.regression_review.checks_or_observations_needed,
          ),
          stop_conditions: uniqueProtocolStringsV01(
            transfer.regression_review.stop_conditions,
          ),
          invalidation_conditions: uniqueProtocolStringsV01(
            transfer.regression_review.invalidation_conditions,
          ),
          source_keys: regressionKeys,
          source_refs: normalizeRefs(
            regressionEntries.map((entry) => entry.ref),
          ),
        },
        known_limitations: uniqueProtocolStringsV01(
          transfer.known_limitations,
        ),
        support,
      };
      return {
        transfer_id: `strategic-transfer:${createProtocolSha256V01(
          canonicalizeProtocolValueV01(core),
        ).slice("sha256:".length, "sha256:".length + 24)}`,
        ...core,
      };
    })
    .sort(compareProtocolCanonicalV01);
}

export function normalizeStrategicAdvantageTransferProfileV01(
  input: StrategicAdvantageTransferProfileV01,
): StrategicAdvantageTransferProfileV01 {
  const cloned = structuredClone(input);
  const validation = validateStrategicAdvantageTransferProfileV01(cloned);
  if (validation.status !== "valid") {
    const issue = validation.errors[0]!;
    fail(issue.code, issue.path);
  }
  return cloned;
}

export function validateStrategicAdvantageTransferProfileV01(
  input: unknown,
): StrategicAdvantageTransferProfileValidationResultV01 {
  try {
    validateProfileOrThrow(input);
    return { status: "valid", errors: [] };
  } catch (error) {
    const issue =
      error instanceof StrategicAdvantageTransferProtocolErrorV01
        ? error
        : new StrategicAdvantageTransferProtocolErrorV01(
            "strategic_advantage_transfer_profile_invalid",
          );
    return {
      status: "blocked",
      errors: [{ code: issue.code, path: issue.path }],
    };
  }
}

function validateProfileOrThrow(
  input: unknown,
): asserts input is StrategicAdvantageTransferProfileV01 {
  const profile = exactRecord(
    input,
    [
      "profile_version",
      "analysis_identity",
      "source_proposal",
      "packet_ref",
      "receipt_ref",
      "assessment",
      "base_strategy",
      "working_frame",
      "source_catalog",
      "server_adverse_context",
      "lenses",
      "budget",
      "model_invocation",
      "normalized_model_output",
      "transfer_items",
      "stop_reason",
      "compatibility",
      "authority",
    ],
    "$strategic_advantage_transfer",
  );
  literal(
    profile.profile_version,
    STRATEGIC_ADVANTAGE_TRANSFER_PROFILE_VERSION_V01,
    "$strategic_advantage_transfer.profile_version",
  );
  requiredSha(profile.analysis_identity, "$strategic_advantage_transfer.analysis_identity");
  const sourceProposal = validateSourceProposal(profile.source_proposal);
  const packetRef = exactRef(profile.packet_ref, "$strategic_advantage_transfer.packet_ref");
  const receiptRef = exactRef(profile.receipt_ref, "$strategic_advantage_transfer.receipt_ref");
  if (packetRef.ref_type !== "task_context_packet" || receiptRef.ref_type !== "run_receipt") {
    fail("strategic_advantage_transfer_source_ref_type_invalid", "$strategic_advantage_transfer");
  }
  requiredSha(packetRef.source_ref, "$strategic_advantage_transfer.packet_ref.source_ref");
  requiredSha(receiptRef.source_ref, "$strategic_advantage_transfer.receipt_ref.source_ref");
  if (validateCriterionAssessmentV01(profile.assessment).status !== "valid") {
    fail("strategic_advantage_transfer_assessment_invalid", "$strategic_advantage_transfer.assessment");
  }
  const assessment = profile.assessment as StrategicAdvantageTransferProfileV01["assessment"];
  const base = validateBaseStrategy(profile.base_strategy);
  const frame = validateWorkingFrame(profile.working_frame);
  const catalog = validateCatalog(profile.source_catalog);
  const adverseContext =
    validateStrategicAdvantageTransferAdverseContextV01(
      profile.server_adverse_context,
    );
  if (
    canonicalizeProtocolValueV01(frame.server_adverse_context) !==
      canonicalizeProtocolValueV01(adverseContext)
  ) {
    fail(
      "strategic_advantage_transfer_adverse_context_binding_conflict",
      "$strategic_advantage_transfer.server_adverse_context",
    );
  }
  const expectedCatalogAdverseItems =
    projectStrategicCatalogAdverseContextItemsV01(catalog);
  const actualCatalogAdverseItems = adverseContext.items.filter(
    (item) => item.scope === "source_linked",
  );
  if (
    canonicalizeProtocolValueV01(actualCatalogAdverseItems) !==
    canonicalizeProtocolValueV01(expectedCatalogAdverseItems)
  ) {
    fail(
      "strategic_advantage_transfer_adverse_context_binding_conflict",
      "$strategic_advantage_transfer.server_adverse_context.items",
    );
  }
  const lenses = validateLenses(profile.lenses);
  validateBudget(profile.budget);
  const budget = profile.budget as StrategicAdvantageTransferBudgetV01;
  if (budget.model.cost.status !== "available") {
    fail(
      "strategic_advantage_transfer_cost_authority_unavailable",
      "$strategic_advantage_transfer.budget.model.cost",
    );
  }
  const modelOutput = normalizeStrategicAdvantageTransferModelOutputV01(
    profile.normalized_model_output,
    lenses,
  );
  const expectedTransfers = resolveStrategicAdvantageTransferItemsV01({
    catalog,
    server_adverse_context: adverseContext,
    model_output: modelOutput,
  });
  if (
    canonicalizeProtocolValueV01(profile.transfer_items) !==
    canonicalizeProtocolValueV01(expectedTransfers)
  ) {
    fail("strategic_advantage_transfer_material_conflict", "$strategic_advantage_transfer.transfer_items");
  }
  if (profile.stop_reason !== modelOutput.stop_reason) {
    fail("strategic_advantage_transfer_stop_reason_conflict", "$strategic_advantage_transfer.stop_reason");
  }
  const modelInvocation = exactRecord(
    profile.model_invocation,
    [
      "receipt",
      "receipt_ref",
      "receipt_fingerprint",
      "normalized_output_fingerprint",
      "schema_version",
    ],
    "$strategic_advantage_transfer.model_invocation",
  );
  const receipt = validateModelInvocationReceiptV02(modelInvocation.receipt);
  const receiptFingerprint = createProtocolSha256V01(
    canonicalizeProtocolValueV01(receipt),
  );
  requiredSha(modelInvocation.receipt_fingerprint, "$strategic_advantage_transfer.model_invocation.receipt_fingerprint");
  const receiptLineageRef = exactRef(
    modelInvocation.receipt_ref,
    "$strategic_advantage_transfer.model_invocation.receipt_ref",
  );
  const outputFingerprint = createProtocolSha256V01(
    canonicalizeProtocolValueV01(modelOutput),
  );
  if (
    receipt.purpose !== "strategic_advantage_transfer" ||
    receipt.invocation_id !==
      `strategic:${String(profile.analysis_identity).slice(7, 39)}` ||
    receipt.workspace_id !== assessment.workspace_id ||
    receipt.project_id !== assessment.project_id ||
    receipt.work_id !== null ||
    receipt.run_id !== null ||
    receipt.invocation_origin !== "interactive" ||
    receipt.requested_mode !== "live" ||
    receipt.status !== "completed" ||
    receipt.outcome !== "live_success" ||
    receipt.execution_mode !== "live" ||
    receipt.selection_reason !== "requested_live" ||
    receipt.egress_attempted !== true ||
    receipt.egress_status !== "occurred" ||
    receipt.privacy_decision !== "provider_egress_approved" ||
    receipt.data_classification !== frame.data_classification ||
    receipt.budget.decision !== "within_budget" ||
    receipt.budget.input_bytes_limit !==
      createStrategicAdvantageTransferBudgetV01().model.max_input_bytes ||
    receipt.budget.output_tokens_limit !==
      createStrategicAdvantageTransferBudgetV01().model.max_output_tokens ||
    receipt.budget.provider_call_limit !== 1 ||
    receipt.budget.provider_calls_used !== 1 ||
    receipt.budget.timeout_limit_ms !==
      createStrategicAdvantageTransferBudgetV01().model.timeout_ms ||
    canonicalizeProtocolValueV01(receipt.budget.cost_budget) !==
      canonicalizeProtocolValueV01(budget.model.cost.budget) ||
    receipt.budget.timeout_disposition !== "completed_within_deadline" ||
    receipt.cancellation_disposition !== "not_cancelled" ||
    receipt.failure_code !== null ||
    receipt.grant_lineage_ref !== null ||
    receipt.automation_control_lineage_ref !== null ||
    receipt.fallback_used !== false ||
    receipt.trust_class !== "provider_report" ||
    receipt.raw_prompt_persisted ||
    receipt.raw_response_persisted ||
    receipt.hidden_reasoning_persisted ||
    receipt.normalized_output_fingerprint !== outputFingerprint ||
    modelInvocation.receipt_fingerprint !== receiptFingerprint ||
    modelInvocation.normalized_output_fingerprint !== outputFingerprint ||
    modelInvocation.schema_version !==
      STRATEGIC_ADVANTAGE_TRANSFER_MODEL_SCHEMA_VERSION_V01 ||
    receiptLineageRef.ref_type !== "model_invocation_receipt" ||
    receiptLineageRef.external_id !== receipt.invocation_id ||
    receiptLineageRef.source_ref !== receiptFingerprint ||
    receiptLineageRef.trust_class !== "provider_report"
  ) {
    fail("strategic_advantage_transfer_model_receipt_conflict", "$strategic_advantage_transfer.model_invocation");
  }
  const requiredProvenance = [
    base.base_fingerprint,
    frame.working_frame_fingerprint,
    catalog.source_catalog_fingerprint,
    adverseContext.adverse_context_fingerprint,
    assessment.assessment_fingerprint,
    packetRef.source_ref,
    receiptRef.source_ref,
    sourceProposal.proposal_fingerprint,
  ];
  if (
    requiredProvenance.some((value) => !value) ||
    canonicalizeProtocolValueV01(receipt.provenance_refs) !==
      canonicalizeProtocolValueV01(
        uniqueProtocolStringsV01(requiredProvenance as string[]),
      )
  ) {
    fail("strategic_advantage_transfer_model_provenance_conflict", "$strategic_advantage_transfer.model_invocation.receipt.provenance_refs");
  }
  if (
    assessment.workspace_id !== frame.workspace_id ||
    assessment.project_id !== frame.project_id ||
    assessment.packet_ref.external_id !== packetRef.external_id ||
    assessment.packet_ref.source_ref !== packetRef.source_ref ||
    assessment.receipt_ref.external_id !== receiptRef.external_id ||
    assessment.receipt_ref.source_ref !== receiptRef.source_ref ||
    frame.assessment_fingerprint !== assessment.assessment_fingerprint ||
    frame.assessment_version !== assessment.assessment_version ||
    canonicalizeProtocolValueV01(frame.packet_ref) !==
      canonicalizeProtocolValueV01(packetRef) ||
    canonicalizeProtocolValueV01(frame.receipt_ref) !==
      canonicalizeProtocolValueV01(receiptRef) ||
    canonicalizeProtocolValueV01(frame.source_proposal) !==
      canonicalizeProtocolValueV01(sourceProposal) ||
    frame.base_strategy.base_fingerprint !== base.base_fingerprint ||
    catalog.workspace_id !== frame.workspace_id ||
    catalog.project_id !== frame.project_id
  ) {
    fail("strategic_advantage_transfer_source_binding_conflict", "$strategic_advantage_transfer");
  }
  const expectedAnalysisIdentity = createStrategicAnalysisIdentityV01({
    profile_version: STRATEGIC_ADVANTAGE_TRANSFER_PROFILE_VERSION_V01,
    schema_version: STRATEGIC_ADVANTAGE_TRANSFER_MODEL_SCHEMA_VERSION_V01,
    workspace_id: assessment.workspace_id,
    project_id: assessment.project_id,
    source_proposal_id: sourceProposal.proposal_id,
    source_proposal_fingerprint: sourceProposal.proposal_fingerprint,
    source_candidates: sourceProposal.candidate_bindings,
    packet_id: packetRef.external_id,
    packet_fingerprint: packetRef.source_ref,
    receipt_id: receiptRef.external_id,
    receipt_fingerprint: receiptRef.source_ref,
    assessment_version: assessment.assessment_version,
    assessment_fingerprint: assessment.assessment_fingerprint,
    base_fingerprint: base.base_fingerprint,
    working_frame_fingerprint: frame.working_frame_fingerprint,
    source_catalog_fingerprint: catalog.source_catalog_fingerprint,
    lenses,
    budget,
  });
  if (profile.analysis_identity !== expectedAnalysisIdentity) {
    fail(
      "strategic_advantage_transfer_analysis_identity_conflict",
      "$strategic_advantage_transfer.analysis_identity",
    );
  }
  validateCompatibility(profile.compatibility);
  validateAuthority(profile.authority);
  assertStrategicAdvantageTransferSourceTextSafeV01(
    profile,
    "$strategic_advantage_transfer",
  );
  assertNoForbiddenStrategicMaterial(profile);
  assertCanonicalSize(profile, "$strategic_advantage_transfer");
}

function normalizeLensResult(
  value: unknown,
  path: string,
): StrategicAdvantageTransferModelLensResultV01 {
  const discriminator = requiredText(
    plainRecord(value, path).result,
    `${path}.result`,
  );
  if (discriminator === "no_transfer") {
    const record = exactRecord(
      value,
      ["result", "lens_id", "non_transfer_reason"],
      path,
    );
    return {
      result: "no_transfer",
      lens_id: requiredLens(record.lens_id, `${path}.lens_id`),
      non_transfer_reason: boundedText(
        record.non_transfer_reason,
        `${path}.non_transfer_reason`,
      ),
    };
  }
  if (discriminator !== "transfer") {
    fail("strategic_advantage_transfer_result_invalid", `${path}.result`);
  }
  const record = exactRecord(
    value,
    [
      "result",
      "lens_id",
      "title",
      "applicability_condition",
      "expected_effect",
      "transfer_cost",
      "source_keys",
      "falsifier",
      "uncertainty",
      "introduced_risks",
      "patch_summary",
      "regression_review",
      "known_limitations",
    ],
    path,
  );
  const regression = exactRecord(
    record.regression_review,
    [
      "regression_risks",
      "checks_or_observations_needed",
      "stop_conditions",
      "invalidation_conditions",
      "source_keys",
    ],
    `${path}.regression_review`,
  );
  return {
    result: "transfer",
    lens_id: requiredLens(record.lens_id, `${path}.lens_id`),
    title: boundedText(record.title, `${path}.title`),
    applicability_condition: boundedText(
      record.applicability_condition,
      `${path}.applicability_condition`,
    ),
    expected_effect: boundedText(record.expected_effect, `${path}.expected_effect`),
    transfer_cost: boundedText(record.transfer_cost, `${path}.transfer_cost`),
    source_keys: sourceKeys(record.source_keys, `${path}.source_keys`),
    falsifier: boundedText(record.falsifier, `${path}.falsifier`),
    uncertainty: nonEmptyTextArray(record.uncertainty, `${path}.uncertainty`),
    introduced_risks: nonEmptyTextArray(
      record.introduced_risks,
      `${path}.introduced_risks`,
    ),
    patch_summary: boundedText(record.patch_summary, `${path}.patch_summary`),
    regression_review: {
      regression_risks: nonEmptyTextArray(
        regression.regression_risks,
        `${path}.regression_review.regression_risks`,
      ),
      checks_or_observations_needed: nonEmptyTextArray(
        regression.checks_or_observations_needed,
        `${path}.regression_review.checks_or_observations_needed`,
      ),
      stop_conditions: nonEmptyTextArray(
        regression.stop_conditions,
        `${path}.regression_review.stop_conditions`,
      ),
      invalidation_conditions: nonEmptyTextArray(
        regression.invalidation_conditions,
        `${path}.regression_review.invalidation_conditions`,
      ),
      source_keys: sourceKeys(
        regression.source_keys,
        `${path}.regression_review.source_keys`,
      ),
    },
    known_limitations: nonEmptyTextArray(
      record.known_limitations,
      `${path}.known_limitations`,
    ),
  };
}

function validateSourceProposal(input: unknown) {
  const source = exactRecord(
    input,
    ["proposal_id", "proposal_fingerprint", "candidate_bindings"],
    "$strategic_advantage_transfer.source_proposal",
  );
  const bindings = exactArray(
    source.candidate_bindings,
    "$strategic_advantage_transfer.source_proposal.candidate_bindings",
    1,
    128,
  ).map((value, index) => {
    const path = `$strategic_advantage_transfer.source_proposal.candidate_bindings[${index}]`;
    const binding = exactRecord(value, ["candidate_id", "candidate_fingerprint"], path);
    return {
      candidate_id: requiredId(binding.candidate_id, `${path}.candidate_id`),
      candidate_fingerprint: requiredSha(
        binding.candidate_fingerprint,
        `${path}.candidate_fingerprint`,
      ),
    };
  });
  if (
    canonicalizeProtocolValueV01(bindings) !==
    canonicalizeProtocolValueV01(
      uniqueProtocolValuesV01(bindings).sort(compareProtocolCanonicalV01),
    )
  ) {
    fail("strategic_advantage_transfer_source_candidates_noncanonical", "$strategic_advantage_transfer.source_proposal.candidate_bindings");
  }
  return {
    proposal_id: requiredId(source.proposal_id, "$strategic_advantage_transfer.source_proposal.proposal_id"),
    proposal_fingerprint: requiredSha(source.proposal_fingerprint, "$strategic_advantage_transfer.source_proposal.proposal_fingerprint"),
    candidate_bindings: bindings,
  };
}

function validateBaseStrategy(input: unknown) {
  const base = exactRecord(
    input,
    [
      "basis",
      "delta_type",
      "semantic_state_record_id",
      "semantic_state_record_fingerprint",
      "state_content_fingerprint",
      "state_ref",
      "target_ref",
      "target_key",
      "revision",
      "bounded_summary",
      "source_proposal_id",
      "source_proposal_fingerprint",
      "source_candidate_id",
      "source_candidate_fingerprint",
      "source_decision_id",
      "source_decision_fingerprint",
      "source_transition_receipt_id",
      "source_transition_receipt_fingerprint",
      "currentness",
      "source_refs",
      "base_fingerprint",
    ],
    "$strategic_advantage_transfer.base_strategy",
  );
  literal(base.basis, "packet_selected_accepted_semantic_state", "$strategic_advantage_transfer.base_strategy.basis");
  literal(base.delta_type, "agent_plan_delta", "$strategic_advantage_transfer.base_strategy.delta_type");
  literal(base.currentness, "fresh", "$strategic_advantage_transfer.base_strategy.currentness");
  requiredId(base.semantic_state_record_id, "$strategic_advantage_transfer.base_strategy.semantic_state_record_id");
  for (const [key, value] of [
    ["semantic_state_record_fingerprint", base.semantic_state_record_fingerprint],
    ["state_content_fingerprint", base.state_content_fingerprint],
    ["target_key", base.target_key],
    ["source_proposal_fingerprint", base.source_proposal_fingerprint],
    ["source_candidate_fingerprint", base.source_candidate_fingerprint],
    ["source_decision_fingerprint", base.source_decision_fingerprint],
    ["source_transition_receipt_fingerprint", base.source_transition_receipt_fingerprint],
    ["base_fingerprint", base.base_fingerprint],
  ] as const) requiredSha(value, `$strategic_advantage_transfer.base_strategy.${key}`);
  for (const [key, value] of [
    ["source_proposal_id", base.source_proposal_id],
    ["source_candidate_id", base.source_candidate_id],
    ["source_decision_id", base.source_decision_id],
    ["source_transition_receipt_id", base.source_transition_receipt_id],
  ] as const) requiredId(value, `$strategic_advantage_transfer.base_strategy.${key}`);
  if (!Number.isSafeInteger(base.revision) || Number(base.revision) < 1) {
    fail("strategic_advantage_transfer_base_revision_invalid", "$strategic_advantage_transfer.base_strategy.revision");
  }
  boundedText(base.bounded_summary, "$strategic_advantage_transfer.base_strategy.bounded_summary");
  exactRef(base.state_ref, "$strategic_advantage_transfer.base_strategy.state_ref");
  exactRef(base.target_ref, "$strategic_advantage_transfer.base_strategy.target_ref");
  refArray(base.source_refs, "$strategic_advantage_transfer.base_strategy.source_refs", 1);
  const { base_fingerprint: _fingerprint, ...withoutFingerprint } = base;
  if (
    base.base_fingerprint !==
    createProtocolSha256V01(canonicalizeProtocolValueV01(withoutFingerprint))
  ) {
    fail("strategic_advantage_transfer_base_fingerprint_conflict", "$strategic_advantage_transfer.base_strategy.base_fingerprint");
  }
  return base as unknown as StrategicAdvantageTransferProfileV01["base_strategy"];
}

function validateWorkingFrame(input: unknown) {
  const frame = exactRecord(
    input,
    [
      "frame_version",
      "workspace_id",
      "project_id",
      "packet_ref",
      "receipt_ref",
      "assessment_version",
      "assessment_fingerprint",
      "source_proposal",
      "data_classification",
      "task_goal",
      "success_criteria",
      "required_checks",
      "forbidden_actions",
      "expected_artifacts",
      "required_return_fields",
      "selected_accepted_state_refs",
      "excluded_context_summaries",
      "gap_summaries",
      "server_adverse_context",
      "base_strategy",
      "trust_summary",
      "coverage_summary",
      "authority",
      "working_frame_fingerprint",
    ],
    "$strategic_advantage_transfer.working_frame",
  );
  literal(frame.frame_version, STRATEGIC_ADVANTAGE_TRANSFER_WORKING_FRAME_VERSION_V01, "$strategic_advantage_transfer.working_frame.frame_version");
  requiredId(frame.workspace_id, "$strategic_advantage_transfer.working_frame.workspace_id");
  requiredId(frame.project_id, "$strategic_advantage_transfer.working_frame.project_id");
  exactRef(frame.packet_ref, "$strategic_advantage_transfer.working_frame.packet_ref");
  exactRef(frame.receipt_ref, "$strategic_advantage_transfer.working_frame.receipt_ref");
  requiredSha(frame.assessment_fingerprint, "$strategic_advantage_transfer.working_frame.assessment_fingerprint");
  validateSourceProposal(frame.source_proposal);
  if (
    frame.data_classification !== "public_safe" &&
    frame.data_classification !== "private" &&
    frame.data_classification !== "local_only" &&
    frame.data_classification !== "secret"
  ) {
    fail(
      "strategic_advantage_transfer_data_classification_invalid",
      "$strategic_advantage_transfer.working_frame.data_classification",
    );
  }
  boundedText(frame.task_goal, "$strategic_advantage_transfer.working_frame.task_goal");
  exactArray(frame.success_criteria, "$strategic_advantage_transfer.working_frame.success_criteria", 0, 128).forEach((value, index) => {
    const criterion = exactRecord(value, ["criterion_id", "criterion", "status", "basis", "uncertainty"], `$strategic_advantage_transfer.working_frame.success_criteria[${index}]`);
    requiredId(criterion.criterion_id, `$strategic_advantage_transfer.working_frame.success_criteria[${index}].criterion_id`);
    boundedText(criterion.criterion, `$strategic_advantage_transfer.working_frame.success_criteria[${index}].criterion`);
    if (!["satisfied", "unsatisfied", "unknown", "not_applicable"].includes(String(criterion.status))) fail("strategic_advantage_transfer_criterion_status_invalid", `$strategic_advantage_transfer.working_frame.success_criteria[${index}].status`);
    if (!["observed", "attested", "mixed", "insufficient"].includes(String(criterion.basis))) fail("strategic_advantage_transfer_criterion_basis_invalid", `$strategic_advantage_transfer.working_frame.success_criteria[${index}].basis`);
    textArray(criterion.uncertainty, `$strategic_advantage_transfer.working_frame.success_criteria[${index}].uncertainty`, 0);
  });
  for (const key of ["required_checks", "forbidden_actions", "expected_artifacts", "required_return_fields", "excluded_context_summaries", "gap_summaries", "coverage_summary"] as const) {
    textArray(frame[key], `$strategic_advantage_transfer.working_frame.${key}`, 0);
  }
  validateStrategicAdvantageTransferAdverseContextV01(
    frame.server_adverse_context,
  );
  refArray(frame.selected_accepted_state_refs, "$strategic_advantage_transfer.working_frame.selected_accepted_state_refs", 1);
  validateBaseStrategy(frame.base_strategy);
  const trust = exactRecord(
    frame.trust_summary,
    [
      "direct_local_observation",
      "verified_external_observation",
      "host_attestation",
      "provider_report",
      "user_declaration",
      "imported_unverified",
      "derived_interpretation",
    ],
    "$strategic_advantage_transfer.working_frame.trust_summary",
  );
  for (const [key, value] of Object.entries(trust)) {
    if (!Number.isSafeInteger(value) || Number(value) < 0) {
      fail(
        "strategic_advantage_transfer_trust_summary_invalid",
        `$strategic_advantage_transfer.working_frame.trust_summary.${key}`,
      );
    }
  }
  const authority = exactRecord(frame.authority, ["authoritative", "creates_decision", "applies_transition", "changes_semantic_state", "changes_later_context"], "$strategic_advantage_transfer.working_frame.authority");
  for (const value of Object.values(authority)) if (value !== false) fail("strategic_advantage_transfer_authority_violation", "$strategic_advantage_transfer.working_frame.authority");
  requiredSha(frame.working_frame_fingerprint, "$strategic_advantage_transfer.working_frame.working_frame_fingerprint");
  const { working_frame_fingerprint: _fingerprint, ...withoutFingerprint } = frame;
  if (frame.working_frame_fingerprint !== createStrategicWorkingFrameFingerprintV01(withoutFingerprint as unknown as Omit<StrategicAdvantageTransferWorkingFrameV01, "working_frame_fingerprint">)) {
    fail("strategic_advantage_transfer_working_frame_conflict", "$strategic_advantage_transfer.working_frame.working_frame_fingerprint");
  }
  assertStrategicAdvantageTransferSourceTextSafeV01(
    frame,
    "$strategic_advantage_transfer.working_frame",
  );
  assertCanonicalSize(frame, "$strategic_advantage_transfer.working_frame");
  return frame as unknown as StrategicAdvantageTransferWorkingFrameV01;
}

function validateCatalog(input: unknown): StrategicAdvantageTransferSourceCatalogV01 {
  const catalog = exactRecord(input, ["catalog_version", "workspace_id", "project_id", "items", "source_catalog_fingerprint"], "$strategic_advantage_transfer.source_catalog");
  literal(catalog.catalog_version, STRATEGIC_ADVANTAGE_TRANSFER_SOURCE_CATALOG_VERSION_V01, "$strategic_advantage_transfer.source_catalog.catalog_version");
  requiredId(catalog.workspace_id, "$strategic_advantage_transfer.source_catalog.workspace_id");
  requiredId(catalog.project_id, "$strategic_advantage_transfer.source_catalog.project_id");
  const items = exactArray(catalog.items, "$strategic_advantage_transfer.source_catalog.items", 1, STRATEGIC_ADVANTAGE_TRANSFER_MAX_SOURCE_CATALOG_ITEMS_V01).map((value, index) => {
    const path = `$strategic_advantage_transfer.source_catalog.items[${index}]`;
    const item = exactRecord(value, ["source_key", "ref", "material_kind", "trust_class", "reference_trust_class", "bounded_summary", "source_fingerprint"], path);
    const ref = exactRef(item.ref, `${path}.ref`);
    const sourceKey = requiredText(item.source_key, `${path}.source_key`);
    if (!SOURCE_KEY.test(sourceKey)) fail("strategic_advantage_transfer_source_key_invalid", `${path}.source_key`);
    const materialKind = requiredText(
      item.material_kind,
      `${path}.material_kind`,
    );
    const boundedSummary = boundedText(
      item.bounded_summary,
      `${path}.bounded_summary`,
    );
    if (
      item.material_kind !== materialKind ||
      item.bounded_summary !== boundedSummary
    ) {
      fail("strategic_advantage_transfer_source_catalog_noncanonical", path);
    }
    const expectedKey = createStrategicSourceKeyV01({
      ref,
      material_kind: materialKind,
      bounded_summary: boundedSummary,
    });
    if (sourceKey !== expectedKey) fail("strategic_advantage_transfer_source_key_conflict", `${path}.source_key`);
    if (!EXTERNAL_REF_TRUST_CLASSES_V01.includes(item.trust_class as ExternalRefTrustClassV01)) {
      fail("strategic_advantage_transfer_material_trust_invalid", `${path}.trust_class`);
    }
    if (item.reference_trust_class !== ref.trust_class) {
      fail(
        "strategic_advantage_transfer_reference_trust_conflict",
        `${path}.reference_trust_class`,
      );
    }
    const expectedSourceFingerprint =
      ref.source_ref?.startsWith("sha256:") ? ref.source_ref : null;
    if (item.source_fingerprint !== expectedSourceFingerprint) {
      fail(
        "strategic_advantage_transfer_source_fingerprint_conflict",
        `${path}.source_fingerprint`,
      );
    }
    return item;
  });
  if (new Set(items.map((item) => item.source_key)).size !== items.length) fail("strategic_advantage_transfer_duplicate_source_key", "$strategic_advantage_transfer.source_catalog.items");
  if (canonicalizeProtocolValueV01(items) !== canonicalizeProtocolValueV01([...items].sort(compareProtocolCanonicalV01))) fail("strategic_advantage_transfer_source_catalog_noncanonical", "$strategic_advantage_transfer.source_catalog.items");
  requiredSha(catalog.source_catalog_fingerprint, "$strategic_advantage_transfer.source_catalog.source_catalog_fingerprint");
  const { source_catalog_fingerprint: _fingerprint, ...withoutFingerprint } = catalog;
  if (catalog.source_catalog_fingerprint !== createStrategicSourceCatalogFingerprintV01(withoutFingerprint as unknown as Omit<StrategicAdvantageTransferSourceCatalogV01, "source_catalog_fingerprint">)) fail("strategic_advantage_transfer_source_catalog_conflict", "$strategic_advantage_transfer.source_catalog.source_catalog_fingerprint");
  assertStrategicAdvantageTransferSourceTextSafeV01(
    catalog,
    "$strategic_advantage_transfer.source_catalog",
  );
  assertCanonicalSize(catalog, "$strategic_advantage_transfer.source_catalog");
  return catalog as unknown as StrategicAdvantageTransferSourceCatalogV01;
}

function validateLenses(input: unknown): StrategicAdvantageTransferLensIdV01[] {
  const lenses = exactArray(input, "$strategic_advantage_transfer.lenses", 1, STRATEGIC_ADVANTAGE_TRANSFER_MAX_LENSES_V01).map((value, index) => requiredLens(value, `$strategic_advantage_transfer.lenses[${index}]`));
  if (new Set(lenses).size !== lenses.length) fail("strategic_advantage_transfer_duplicate_lens", "$strategic_advantage_transfer.lenses");
  if (
    canonicalizeProtocolValueV01(lenses) !==
    canonicalizeProtocolValueV01(STRATEGIC_ADVANTAGE_TRANSFER_LENSES_V01)
  ) {
    fail(
      "strategic_advantage_transfer_lens_relation_conflict",
      "$strategic_advantage_transfer.lenses",
    );
  }
  return lenses;
}

function validateBudget(input: unknown): void {
  const budget = exactRecord(
    input,
    [
      "budget_version",
      "max_lenses",
      "max_transfer_items",
      "max_source_catalog_items",
      "max_source_refs_per_transfer",
      "max_text_characters",
      "max_total_canonical_utf8_bytes",
      "model",
      "truncation_allowed",
    ],
    "$strategic_advantage_transfer.budget",
  );
  const model = exactRecord(
    budget.model,
    [
      "max_input_bytes",
      "max_output_tokens",
      "max_provider_calls",
      "timeout_ms",
      "automatic_retry",
      "provider_failover",
      "cost",
    ],
    "$strategic_advantage_transfer.budget.model",
  );
  const cost = plainRecord(
    model.cost,
    "$strategic_advantage_transfer.budget.model.cost",
  );
  const expectedBase = createStrategicAdvantageTransferBudgetV01();
  const { cost: _expectedCost, ...expectedModelBase } = expectedBase.model;
  const { cost: _actualCost, ...actualModelBase } = model;
  if (
    canonicalizeProtocolValueV01({
      ...budget,
      model: actualModelBase,
    }) !==
    canonicalizeProtocolValueV01({
      ...expectedBase,
      model: expectedModelBase,
    })
  ) {
    fail(
      "strategic_advantage_transfer_budget_conflict",
      "$strategic_advantage_transfer.budget",
    );
  }
  if (cost.status === "unavailable") {
    if (
      canonicalizeProtocolValueV01(cost) !==
      canonicalizeProtocolValueV01({
        status: "unavailable",
        reason: "cost_authority_unavailable",
      })
    ) {
      fail(
        "strategic_advantage_transfer_budget_conflict",
        "$strategic_advantage_transfer.budget.model.cost",
      );
    }
    return;
  }
  if (cost.status !== "available") {
    fail(
      "strategic_advantage_transfer_budget_conflict",
      "$strategic_advantage_transfer.budget.model.cost",
    );
  }
  exactRecord(
    cost,
    ["status", "budget"],
    "$strategic_advantage_transfer.budget.model.cost",
  );
  validateModelGatewayCostBudgetV01(cost.budget);
}

function validateCompatibility(input: unknown): void {
  const compatibility = exactRecord(input, ["source_contracts", "warnings"], "$strategic_advantage_transfer.compatibility");
  const contracts = textArray(compatibility.source_contracts, "$strategic_advantage_transfer.compatibility.source_contracts", 1);
  if (!contracts.includes(STRATEGIC_ADVANTAGE_TRANSFER_PROFILE_VERSION_V01)) fail("strategic_advantage_transfer_contract_missing", "$strategic_advantage_transfer.compatibility.source_contracts");
  textArray(compatibility.warnings, "$strategic_advantage_transfer.compatibility.warnings", 0);
}

function validateAuthority(input: unknown): void {
  const authority = exactRecord(input, ["authoritative", "creates_evidence", "validates_claims", "creates_decision", "authorizes_gate", "applies_transition", "changes_semantic_state", "changes_later_context", "authorizes_execution", "authorizes_external_action", "confidence_or_agreement_grants_authority"], "$strategic_advantage_transfer.authority");
  for (const [key, value] of Object.entries(authority)) if (value !== false) fail("strategic_advantage_transfer_authority_violation", `$strategic_advantage_transfer.authority.${key}`);
}

function classifyStrategicSupport(input: {
  selected_support_entries: StrategicAdvantageTransferSourceCatalogV01["items"];
  full_catalog_adverse_entries: StrategicAdvantageTransferSourceCatalogV01["items"];
  task_wide_adverse_context: StrategicAdvantageTransferAdverseContextItemV01[];
  server_adverse_context_fingerprint: string;
}): StrategicAdvantageTransferNormalizedItemV01["support"] {
  const catalogCategories = input.full_catalog_adverse_entries.flatMap(
    (entry) => strategicCatalogAdverseCategoriesV01(entry.material_kind),
  );
  const taskCategories = input.task_wide_adverse_context.map(
    (entry) => entry.category,
  );
  const count = (
    categories: readonly StrategicAdvantageTransferAdverseCategoryV01[],
  ) =>
    catalogCategories.filter((category) => categories.includes(category))
      .length +
    taskCategories.filter((category) => categories.includes(category)).length;
  const conflictedMaterial = count(["conflict"]);
  const skippedMaterial = count(["skipped_check"]);
  const unavailableMaterial = count([
    "unsupported_capability",
    "outside_coverage",
    "stale_source",
    "unavailable_source",
  ]);
  const missingMaterial = count([
    "receipt_blocker",
    "receipt_warning",
    "receipt_gap",
    "failed_check",
    "blocked_check",
    "missing_information",
    "packet_gap",
    "packet_exclusion",
  ]);
  const uncertainMaterial = count([
    "uncertainty",
    "unknown_criterion",
    "insufficient_criterion",
  ]);
  const eligible = input.selected_support_entries.filter((entry) =>
    STRATEGIC_POSITIVE_SUPPORT_MATERIAL_KINDS_V01.has(entry.material_kind),
  );
  const counts = {
    direct_local_observation: input.selected_support_entries.filter(
      (entry) => entry.trust_class === "direct_local_observation",
    ).length,
    verified_external_observation: input.selected_support_entries.filter(
      (entry) => entry.trust_class === "verified_external_observation",
    ).length,
    host_attestation: input.selected_support_entries.filter(
      (entry) => entry.trust_class === "host_attestation",
    ).length,
    provider_report: input.selected_support_entries.filter(
      (entry) => entry.trust_class === "provider_report",
    ).length,
    derived_interpretation: input.selected_support_entries.filter(
      (entry) => entry.trust_class === "derived_interpretation",
    ).length,
  };
  const eligibleObserved = eligible.filter(
    (entry) =>
      entry.trust_class === "direct_local_observation" ||
      entry.trust_class === "verified_external_observation",
  ).length;
  const eligibleAttested = eligible.filter(
    (entry) =>
      entry.trust_class === "host_attestation" ||
      entry.trust_class === "provider_report",
  ).length;
  const blockingMaterial =
    conflictedMaterial +
    skippedMaterial +
    unavailableMaterial +
    missingMaterial +
    uncertainMaterial;
  const sufficient = blockingMaterial === 0 && eligibleObserved > 0;
  return {
    status: sufficient ? "supported" : "unknown",
    basis: sufficient
      ? eligibleAttested > 0
        ? "mixed"
        : "observed"
      : blockingMaterial === 0 && eligibleObserved === 0 && eligibleAttested > 0
        ? "attested"
        : "insufficient",
    ...counts,
    conflicted_material: conflictedMaterial,
    skipped_material: skippedMaterial,
    unavailable_material: unavailableMaterial,
    missing_material: missingMaterial,
    uncertain_material: uncertainMaterial,
    skipped_or_unavailable_material:
      skippedMaterial + unavailableMaterial,
    task_wide_adverse_material: input.task_wide_adverse_context.length,
    server_adverse_context_fingerprint:
      input.server_adverse_context_fingerprint,
    positive_support_policy:
      "explicit_strategic_transfer_observation_only",
  };
}

export function strategicCatalogAdverseCategoriesV01(
  materialKind: string,
): StrategicAdvantageTransferAdverseCategoryV01[] {
  const categories: StrategicAdvantageTransferAdverseCategoryV01[] = [];
  if (materialKind === "source_conflict") categories.push("conflict");
  if (materialKind.startsWith("source_missing:")) {
    categories.push("missing_information");
  }
  if (materialKind === "source_uncertainty") categories.push("uncertainty");
  if (materialKind === "check_failed") categories.push("failed_check");
  if (materialKind === "check_blocked") categories.push("blocked_check");
  if (materialKind === "skipped_check") categories.push("skipped_check");
  if (materialKind === "coverage_unsupported") {
    categories.push("unsupported_capability");
  }
  if (materialKind === "coverage_outside_coverage") {
    categories.push("outside_coverage");
  }
  if (materialKind.startsWith("receipt_blocker:")) {
    categories.push("receipt_blocker");
  }
  if (materialKind.startsWith("receipt_warning:")) {
    categories.push("receipt_warning");
  }
  if (materialKind.startsWith("receipt_gap:")) {
    categories.push("receipt_gap");
  }
  if (materialKind.startsWith("packet_gap:")) categories.push("packet_gap");
  if (materialKind === "packet_exclusion") categories.push("packet_exclusion");
  if (materialKind.startsWith("criterion_assessment_item:unknown:")) {
    categories.push("unknown_criterion");
  }
  if (materialKind.endsWith(":insufficient")) {
    categories.push("insufficient_criterion");
  }
  return categories.sort();
}

function resolveCatalogKeys(
  catalog: Map<string, StrategicAdvantageTransferSourceCatalogV01["items"][number]>,
  keys: string[],
  path: string,
) {
  if (keys.length > STRATEGIC_ADVANTAGE_TRANSFER_MAX_SOURCE_REFS_V01) fail("strategic_advantage_transfer_source_ref_bound_exceeded", path);
  return keys.map((key) => {
    const entry = catalog.get(key);
    if (!entry) fail("strategic_advantage_transfer_unknown_source_key", path);
    return entry;
  });
}

function assertNoForbiddenStrategicMaterial(input: unknown): void {
  const forbiddenKeys = /^(?:raw_prompt|raw_provider_output|raw_response|transcript|reasoning|chain_of_thought|score|confidence|winner|fitness|consensus|vote|actor|agent|debate)$/iu;
  const visit = (value: unknown, path: string) => {
    if (Array.isArray(value)) return value.forEach((item, index) => visit(item, `${path}[${index}]`));
    if (!value || typeof value !== "object") return;
    for (const [key, child] of Object.entries(value)) {
      if (forbiddenKeys.test(key)) fail("strategic_advantage_transfer_forbidden_material", `${path}.${key}`);
      visit(child, `${path}.${key}`);
    }
  };
  visit(input, "$strategic_advantage_transfer");
}

function exactRef(value: unknown, path: string): ExternalRefV01 {
  let invalid = false;
  validateExternalRefStructureV01(value, path, {
    error() {
      invalid = true;
    },
    warning() {},
  });
  if (invalid) fail("strategic_advantage_transfer_ref_invalid", path);
  return normalizeExternalRefPrimitiveV01(value as ExternalRefV01);
}

function refArray(value: unknown, path: string, minimum = 0): ExternalRefV01[] {
  const refs = exactArray(value, path, minimum, STRATEGIC_ADVANTAGE_TRANSFER_MAX_SOURCE_REFS_V01).map((item, index) => exactRef(item, `${path}[${index}]`));
  if (canonicalizeProtocolValueV01(refs) !== canonicalizeProtocolValueV01(normalizeRefs(refs))) fail("strategic_advantage_transfer_refs_noncanonical", path);
  return refs;
}

function normalizeRefs(values: ExternalRefV01[]): ExternalRefV01[] {
  return uniqueProtocolValuesV01(values.map(normalizeExternalRefPrimitiveV01)).sort(compareExternalRefsV01);
}

function exactRecord(value: unknown, keys: readonly string[], path: string): Record<string, unknown> {
  const record = plainRecord(value, path);
  const actual = Object.keys(record).sort();
  const expected = [...keys].sort();
  if (canonicalizeProtocolValueV01(actual) !== canonicalizeProtocolValueV01(expected)) fail("strategic_advantage_transfer_unknown_or_missing_field", path);
  return record;
}

function plainRecord(value: unknown, path: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value) || (Object.getPrototypeOf(value) !== Object.prototype && Object.getPrototypeOf(value) !== null)) fail("strategic_advantage_transfer_record_invalid", path);
  return value as Record<string, unknown>;
}

function exactArray(value: unknown, path: string, minimum: number, maximum: number): unknown[] {
  if (!Array.isArray(value) || value.length < minimum || value.length > maximum) fail("strategic_advantage_transfer_collection_bound", path);
  return value;
}

function boundedText(value: unknown, path: string): string {
  const text = requiredText(value, path);
  if (text.length > STRATEGIC_ADVANTAGE_TRANSFER_MAX_TEXT_CHARACTERS_V01) fail("strategic_advantage_transfer_text_bound_exceeded", path);
  return text;
}

function requiredText(value: unknown, path: string): string {
  if (typeof value !== "string") fail("strategic_advantage_transfer_text_invalid", path);
  const normalized = normalizeProtocolTextV01(value);
  if (!normalized) fail("strategic_advantage_transfer_text_invalid", path);
  return normalized;
}

function requiredId(value: unknown, path: string): string {
  const text = requiredText(value, path);
  if (!SAFE_ID.test(text)) fail("strategic_advantage_transfer_identifier_invalid", path);
  return text;
}

function requiredSha(value: unknown, path: string): string {
  const text = requiredText(value, path);
  if (!SHA256.test(text)) fail("strategic_advantage_transfer_fingerprint_invalid", path);
  return text;
}

function requiredLens(value: unknown, path: string): StrategicAdvantageTransferLensIdV01 {
  const lens = requiredText(value, path);
  if (!STRATEGIC_ADVANTAGE_TRANSFER_LENSES_V01.includes(lens as StrategicAdvantageTransferLensIdV01)) fail("strategic_advantage_transfer_lens_invalid", path);
  return lens as StrategicAdvantageTransferLensIdV01;
}

function sourceKeys(value: unknown, path: string): string[] {
  const keys = exactArray(value, path, 1, STRATEGIC_ADVANTAGE_TRANSFER_MAX_SOURCE_REFS_V01).map((item, index) => {
    const key = requiredText(item, `${path}[${index}]`);
    if (!SOURCE_KEY.test(key)) fail("strategic_advantage_transfer_source_key_invalid", `${path}[${index}]`);
    return key;
  });
  if (new Set(keys).size !== keys.length) fail("strategic_advantage_transfer_duplicate_source_key", path);
  return [...keys].sort();
}

function nonEmptyTextArray(value: unknown, path: string): string[] {
  return textArray(value, path, 1);
}

function textArray(value: unknown, path: string, minimum: number): string[] {
  const values = exactArray(
    value,
    path,
    minimum,
    STRATEGIC_ADVANTAGE_TRANSFER_MAX_TEXT_ITEMS_V01,
  ).map((item, index) => boundedText(item, `${path}[${index}]`));
  const normalized = uniqueProtocolStringsV01(values);
  if (normalized.length !== values.length) fail("strategic_advantage_transfer_duplicate_text", path);
  return normalized;
}

function literal(value: unknown, expected: unknown, path: string): void {
  if (value !== expected) fail("strategic_advantage_transfer_literal_invalid", path);
}

function assertCanonicalSize(value: unknown, path: string): void {
  const size = new TextEncoder().encode(canonicalizeProtocolValueV01(value)).byteLength;
  if (size > STRATEGIC_ADVANTAGE_TRANSFER_MAX_CANONICAL_UTF8_BYTES_V01) fail("strategic_advantage_transfer_material_bound_exceeded", path);
}

function fail(code: string, path = "$"): never {
  throw new StrategicAdvantageTransferProtocolErrorV01(code, path);
}
