import { buildTemporalPreviewContext } from "@/lib/temporal-interpretation/context";
import { isOpenAIOutboundPayloadBoundaryErrorV01 } from "@/lib/model-egress/openai-outbound-payload-boundary-v0-1";
import { validateTemporalPreviewGuardrails } from "@/lib/temporal-interpretation/guardrails";
import { buildMockTemporalPreview } from "@/lib/temporal-interpretation/mock";
import { buildOpenAITemporalPreview } from "@/lib/temporal-interpretation/openai";
import {
  type PreviewGenerator,
  type TemporalPreviewContext,
  type TemporalPreviewResponse,
} from "@/lib/temporal-interpretation/types";

const DEFAULT_SCOPE = "project:augnes";

type PreviewRequest = {
  scope: string;
  context?: TemporalPreviewContext;
};

export function validateTemporalPreviewRequest(body: unknown): PreviewRequest {
  if (body === null || body === undefined) {
    return { scope: DEFAULT_SCOPE };
  }

  if (!isRecord(body)) {
    throw new Error("Request body must be a JSON object.");
  }

  const scope = body.scope ?? DEFAULT_SCOPE;
  if (typeof scope !== "string" || scope.trim().length === 0) {
    throw new Error("scope must be a non-empty string.");
  }

  return {
    scope: scope.trim(),
    context: isRecord(body.context)
      ? (body.context as TemporalPreviewContext)
      : undefined,
  };
}

export async function buildTemporalInterpretationPreview({
  scope,
  context: providedContext,
}: PreviewRequest): Promise<TemporalPreviewResponse> {
  const context = providedContext ?? buildTemporalPreviewContext(scope);
  const boundaries = [
    "Read-only preview only.",
    "No DB schema, migration, state/proof/mailbox/publication mutation, approval, publish, retry, RuleCandidate, PromotedRule, or automatic promotion behavior.",
    "Warnings are local deterministic guardrails, not interpretive quality proof.",
  ];
  let generator: PreviewGenerator = "mock";
  let model: string | null = null;
  let openaiError: string | undefined;
  let preview = buildMockTemporalPreview(context);

  if (process.env.OPENAI_API_KEY) {
    try {
      const openai = await buildOpenAITemporalPreview({ context });
      generator = "openai";
      model = openai.model;
      preview = openai.preview;
    } catch (error) {
      if (isOpenAIOutboundPayloadBoundaryErrorV01(error)) {
        throw error;
      }
      generator = "mock_fallback";
      openaiError =
        error instanceof Error ? error.message : "OpenAI preview failed.";
      preview = buildMockTemporalPreview(context);
      preview.warnings = [
        ...preview.warnings,
        "OpenAI preview failed; deterministic mock fallback was returned.",
      ];
    }
  }

  const guardrails = validateTemporalPreviewGuardrails({ context, preview });
  preview = {
    ...preview,
    warnings: guardrails.warnings,
  };

  return {
    runtime: "augnes",
    scope: context.scope,
    as_of: new Date().toISOString(),
    generator,
    model,
    preview,
    guardrails,
    openai_error: openaiError,
    boundaries,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
