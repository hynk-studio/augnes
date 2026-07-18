import {
  assertModelEgressCollectionCount,
  cloneBoundedModelEgressJson,
  requireModelEgressText,
  serializeModelEgressJson,
} from "@/lib/model-egress/bounded-model-payload";
import { normalizeStrategicAdvantageTransferModelOutputV01 } from "@/lib/vnext/strategic-advantage-transfer-protocol";
import type { StrategicAdvantageTransferModelInputV01 } from "@/types/vnext/strategic-advantage-transfer";

const PURPOSE = "strategic_advantage_transfer" as const;

export const STRATEGIC_ADVANTAGE_TRANSFER_MODEL_EGRESS_LIMITS = {
  dynamicBytes: 65_536,
  finalRequestBytes: 81_920,
  responseBytes: 49_152,
  sourceCatalogItems: 64,
  lenses: 3,
} as const;

const boundedText = { type: "string", minLength: 1, maxLength: 1200 } as const;
const boundedTextArray = {
  type: "array",
  minItems: 1,
  maxItems: 16,
  items: boundedText,
} as const;
const sourceKeyArray = {
  type: "array",
  minItems: 1,
  maxItems: 16,
  items: { type: "string", pattern: "^source:[a-f0-9]{24}$" },
} as const;

export const strategicAdvantageTransferResponseSchema = {
  type: "object",
  additionalProperties: false,
  required: ["schema_version", "lens_results", "stop_reason"],
  properties: {
    schema_version: {
      type: "string",
      enum: ["strategic_advantage_transfer_model_output.v0.1"],
    },
    lens_results: {
      type: "array",
      minItems: 1,
      maxItems: 3,
      items: {
        anyOf: [
          {
            type: "object",
            additionalProperties: false,
            required: ["result", "lens_id", "non_transfer_reason"],
            properties: {
              result: { type: "string", enum: ["no_transfer"] },
              lens_id: {
                type: "string",
                enum: [
                  "constraint_fit",
                  "verification_leverage",
                  "regression_safety",
                ],
              },
              non_transfer_reason: boundedText,
            },
          },
          {
            type: "object",
            additionalProperties: false,
            required: [
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
            properties: {
              result: { type: "string", enum: ["transfer"] },
              lens_id: {
                type: "string",
                enum: [
                  "constraint_fit",
                  "verification_leverage",
                  "regression_safety",
                ],
              },
              title: boundedText,
              applicability_condition: boundedText,
              expected_effect: boundedText,
              transfer_cost: boundedText,
              source_keys: sourceKeyArray,
              falsifier: boundedText,
              uncertainty: boundedTextArray,
              introduced_risks: boundedTextArray,
              patch_summary: boundedText,
              regression_review: {
                type: "object",
                additionalProperties: false,
                required: [
                  "regression_risks",
                  "checks_or_observations_needed",
                  "stop_conditions",
                  "invalidation_conditions",
                  "source_keys",
                ],
                properties: {
                  regression_risks: boundedTextArray,
                  checks_or_observations_needed: boundedTextArray,
                  stop_conditions: boundedTextArray,
                  invalidation_conditions: boundedTextArray,
                  source_keys: sourceKeyArray,
                },
              },
              known_limitations: boundedTextArray,
            },
          },
        ],
      },
    },
    stop_reason: {
      type: "string",
      enum: ["completed", "no_transferable_advantage"],
    },
  },
} as const;

export function buildStrategicAdvantageTransferSystemPromptV01(): string {
  return [
    "Evaluate only bounded local transfer opportunities against the supplied exact base and working frame.",
    "Return one result for each supplied fixed lens and use only supplied source keys.",
    "Do not rank, vote, select a winner, invent sources, infer authority, or emit hidden reasoning, confidence, scores, personas, debate, or transcripts.",
    "A transfer requires applicability, expected effect, cost, falsifier, uncertainty, risks, a local patch summary, and regression review material.",
    "When no source-linked transfer is supportable for a lens, return no_transfer with a bounded reason.",
  ].join(" ");
}

export function projectStrategicAdvantageTransferModelMaterialV01(
  input: { canonical_project_id: string } & StrategicAdvantageTransferModelInputV01,
) {
  if (!input.canonical_project_id.startsWith("project:")) {
    throw new Error("strategic_project_scope_invalid");
  }
  assertModelEgressCollectionCount(
    PURPOSE,
    input.lenses.length,
    STRATEGIC_ADVANTAGE_TRANSFER_MODEL_EGRESS_LIMITS.lenses,
  );
  assertModelEgressCollectionCount(
    PURPOSE,
    input.source_catalog.items.length,
    STRATEGIC_ADVANTAGE_TRANSFER_MODEL_EGRESS_LIMITS.sourceCatalogItems,
  );
  const material = cloneBoundedModelEgressJson(
    PURPOSE,
    {
      profile_version: input.profile_version,
      schema_version: input.schema_version,
      working_frame: input.working_frame,
      source_catalog: input.source_catalog,
      lenses: input.lenses,
      budget: {
        max_lenses: input.budget.max_lenses,
        max_transfer_items: input.budget.max_transfer_items,
        max_source_refs_per_transfer:
          input.budget.max_source_refs_per_transfer,
        max_text_characters: input.budget.max_text_characters,
        truncation_allowed: input.budget.truncation_allowed,
      },
    },
    { maximumDepth: 10, maximumNodes: 2_048 },
  );
  serializeModelEgressJson(
    PURPOSE,
    material,
    STRATEGIC_ADVANTAGE_TRANSFER_MODEL_EGRESS_LIMITS.dynamicBytes,
  );
  return material;
}

export function parseStrategicAdvantageTransferOutputV01(
  outputText: string,
  expectedLenses: StrategicAdvantageTransferModelInputV01["lenses"],
) {
  const bounded = requireModelEgressText(
    PURPOSE,
    outputText,
    STRATEGIC_ADVANTAGE_TRANSFER_MODEL_EGRESS_LIMITS.responseBytes,
  );
  let parsed: unknown;
  try {
    parsed = JSON.parse(bounded);
  } catch {
    throw new Error("strategic_advantage_transfer_output_json_invalid");
  }
  return normalizeStrategicAdvantageTransferModelOutputV01(
    parsed,
    expectedLenses,
  );
}
