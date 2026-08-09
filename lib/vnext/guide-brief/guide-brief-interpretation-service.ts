import { randomBytes, randomUUID } from "node:crypto";

import { openDatabase } from "@/lib/db";
import { buildGuideBriefConversationGuideFingerprintV01 } from "@/lib/vnext/guide-brief/guide-brief-conversation-plan";
import {
  buildGuideBriefInterpretationCandidateSetFingerprintV01,
  guideBriefInterpretationCandidateMeaningV01,
  isGuideBriefModelInterpretationEligibleV01,
} from "@/lib/vnext/guide-brief/guide-brief-model-interpretation";
import { buildGuideBriefInteractionRequestV01 } from "@/lib/vnext/guide-brief/guide-brief-interaction-plan";
import { loadProjectGuideBriefV02 } from "@/lib/vnext/guide-brief/project-guide-brief-source";
import {
  invokeGuideBriefInterpretationModelGatewayV01,
  type GuideBriefInterpretationModelGatewayDependenciesV01,
} from "@/lib/vnext/model-gateway/model-gateway";
import {
  GUIDE_BRIEF_INTERPRETATION_MODEL_GATEWAY_PURPOSE_V01,
  MODEL_INVOCATION_ENVELOPE_VERSION_V01,
  ModelGatewayInvocationErrorV01,
} from "@/lib/vnext/model-gateway/contracts";
import { readActiveProjectSelectionV01 } from "@/lib/vnext/persistence/project-lifecycle-registry";
import {
  GUIDE_BRIEF_CONVERSATION_INTENTS_V01,
  GUIDE_BRIEF_CONVERSATION_MAX_QUESTION_LENGTH_V01,
  type GuideBriefConversationIntentV01,
} from "@/types/vnext/guide-brief-conversation";
import {
  GUIDE_BRIEF_INTERPRETATION_LIMITS_V01,
  GUIDE_BRIEF_INTERPRETATION_REQUEST_VERSION_V01,
  GUIDE_BRIEF_INTERPRETATION_RESULT_VERSION_V01,
  type GuideBriefInterpretationPublicResultV01,
  type GuideBriefInterpretationRequestV01,
} from "@/types/vnext/guide-brief-interpretation";

const CANONICAL_WORKSPACE =
  /^workspace:[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;
const CANONICAL_PROJECT =
  /^project:[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;
const SCOPE_KEY = /^guidebrief-conversation-scope:[a-f0-9]{16}$/u;
const GUIDE_MATERIAL_FINGERPRINT = /^derived:[a-f0-9]{16}$/u;
const CANDIDATE_FINGERPRINT = /^guidebrief-candidates:[a-f0-9]{16}$/u;
const HOST_GENERATION = /^guidebrief-host:[a-f0-9-]{36}$/u;

export interface GuideBriefInterpretationServiceDependenciesV01
  extends GuideBriefInterpretationModelGatewayDependenciesV01 {
  invoke_model?: typeof invokeGuideBriefInterpretationModelGatewayV01;
  load_guide?: typeof loadProjectGuideBriefV02;
  token_bytes?: () => string;
  read_active_selection?: (
    workspaceId: string,
  ) => { project_id: string; selection_revision: number } | null;
  fingerprint_guide?: typeof buildGuideBriefConversationGuideFingerprintV01;
}

export async function interpretGuideBriefQuestionV01(
  input: unknown,
  signal: AbortSignal,
  dependencies: GuideBriefInterpretationServiceDependenciesV01 = {},
): Promise<GuideBriefInterpretationPublicResultV01> {
  const request = validateGuideBriefInterpretationRequestV01(input);
  const loadGuide = dependencies.load_guide ?? loadProjectGuideBriefV02;
  const fingerprintGuide =
    dependencies.fingerprint_guide ??
    buildGuideBriefConversationGuideFingerprintV01;
  const beforeBinding = await loadExactGuideBriefBindingV01({
    loadGuide,
    request,
    fingerprintGuide,
  });
  if (!beforeBinding) {
    return publicResultV01("stale");
  }
  const before = beforeBinding.bundle;
  const deterministicRequest = buildGuideBriefInteractionRequestV01({
    request_id: "guidebrief-interpretation:server-admission",
    raw_utterance: request.utterance,
    scope_key: request.pc4_scope_key,
    capability_snapshot_fingerprint: "conversation-only",
    previous_turn_anchor: null,
    conversation_context: null,
  });
  if (
    !isGuideBriefModelInterpretationEligibleV01({
      request: deterministicRequest,
      project_context: before.guide.identity.project_context,
      active_project_id: before.guide.identity.active_project_id,
      project_id: before.guide.identity.project_id,
      active_selection_revision:
        before.guide.identity.active_selection_revision,
      available_intents: request.available_intents,
    })
  ) {
    return publicResultV01("unsupported");
  }

  const tokenToIntent = new Map<string, GuideBriefConversationIntentV01>();
  const candidates = request.available_intents.map((intent) => {
    const token = `q_${
      dependencies.token_bytes?.() ?? randomBytes(16).toString("hex")
    }`;
    if (!/^q_[a-f0-9]{32}$/u.test(token) || tokenToIntent.has(token)) {
      throw new Error("guidebrief_interpretation_token_generation_invalid");
    }
    tokenToIntent.set(token, intent);
    return {
      candidate_token: token,
      ...guideBriefInterpretationCandidateMeaningV01(intent),
      currently_available: true as const,
    };
  });

  try {
    const result = await (
      dependencies.invoke_model ??
      invokeGuideBriefInterpretationModelGatewayV01
    )(
      {
        envelope_version: MODEL_INVOCATION_ENVELOPE_VERSION_V01,
        invocation_id: `guidebrief-interpretation:${randomUUID()}`,
        workspace_id: request.workspace_id,
        project_id: request.project_id,
        purpose: GUIDE_BRIEF_INTERPRETATION_MODEL_GATEWAY_PURPOSE_V01,
        data_classification: "private",
        provenance_refs: ["guidebrief:current-work-question"],
        privacy: { provider_egress: "allow", retention_class: "none" },
        budget: {
          max_input_bytes:
            GUIDE_BRIEF_INTERPRETATION_LIMITS_V01.max_input_bytes,
          max_output_tokens:
            GUIDE_BRIEF_INTERPRETATION_LIMITS_V01.max_output_tokens,
          max_provider_calls: 1,
        },
        timeout_ms: GUIDE_BRIEF_INTERPRETATION_LIMITS_V01.timeout_ms,
        cancellation: { signal },
        execution_mode: "live",
        policy: {
          invocation_origin: "interactive",
          expected_active_project_id: request.project_id,
          expected_active_selection_revision:
            request.expected_active_selection_revision,
        },
        input: {
          input_kind: GUIDE_BRIEF_INTERPRETATION_MODEL_GATEWAY_PURPOSE_V01,
          utterance: request.utterance,
          candidates,
        },
      },
      dependencies,
    );

    const after = await loadGuide(beforeBinding.read_input);
    const activeAfter = (
      dependencies.read_active_selection ?? readCurrentActiveSelectionV01
    )(request.workspace_id);
    if (
      activeAfter?.project_id !== request.project_id ||
      activeAfter.selection_revision !==
        request.expected_active_selection_revision
    ) {
      return publicResultV01("stale");
    }
    if (!exactActiveBindingV01(after.guide, request, fingerprintGuide)) {
      return publicResultV01("stale");
    }
    if (result.interpreter !== "openai") {
      return publicResultV01("unavailable");
    }
    const output = result.output;
    if (
      output.coverage !== "complete" ||
      output.classification !== "single"
    ) {
      return publicResultV01(
        output.classification === "unsupported" || output.coverage === "none"
          ? "unsupported"
          : "ambiguous",
      );
    }
    if (output.candidate_tokens.length !== 1) {
      return publicResultV01("invalid");
    }
    const intent = tokenToIntent.get(output.candidate_tokens[0]!) ?? null;
    return intent
      ? publicResultV01("resolved", intent)
      : publicResultV01("invalid");
  } catch (error) {
    if (error instanceof ModelGatewayInvocationErrorV01) {
      if (error.code === "model_gateway_timeout") {
        return publicResultV01("timed_out");
      }
      if (error.code === "model_gateway_cancelled") {
        return publicResultV01("unavailable");
      }
      if (error.code === "model_gateway_scope_refused") {
        return publicResultV01("stale");
      }
      if (error.code === "model_gateway_provider_response_invalid") {
        return publicResultV01("invalid");
      }
      return publicResultV01("failed");
    }
    return publicResultV01("failed");
  }
}

async function loadExactGuideBriefBindingV01(input: {
  loadGuide: typeof loadProjectGuideBriefV02;
  request: GuideBriefInterpretationRequestV01;
  fingerprintGuide: typeof buildGuideBriefConversationGuideFingerprintV01;
}) {
  const canonical = await input.loadGuide();
  if (
    exactActiveBindingV01(
      canonical.guide,
      input.request,
      input.fingerprintGuide,
    )
  ) {
    return { bundle: canonical, read_input: {} };
  }
  const viewedInput = { project_id: input.request.project_id };
  const viewed = await input.loadGuide(viewedInput);
  return exactActiveBindingV01(
    viewed.guide,
    input.request,
    input.fingerprintGuide,
  )
    ? { bundle: viewed, read_input: viewedInput }
    : null;
}

export function validateGuideBriefInterpretationRequestV01(
  input: unknown,
): GuideBriefInterpretationRequestV01 {
  if (!isRecord(input)) throw new Error("guidebrief_interpretation_request_invalid");
  const expectedKeys = [
    "available_intents",
    "candidate_set_fingerprint",
    "expected_active_selection_revision",
    "guide_material_fingerprint",
    "mounted_host_generation",
    "pc4_scope_key",
    "project_id",
    "request_version",
    "utterance",
    "workspace_id",
  ].sort();
  if (JSON.stringify(Object.keys(input).sort()) !== JSON.stringify(expectedKeys)) {
    throw new Error("guidebrief_interpretation_request_invalid");
  }
  const intents = input.available_intents;
  if (
    input.request_version !== GUIDE_BRIEF_INTERPRETATION_REQUEST_VERSION_V01 ||
    typeof input.utterance !== "string" ||
    input.utterance.trim().length === 0 ||
    input.utterance.length > GUIDE_BRIEF_CONVERSATION_MAX_QUESTION_LENGTH_V01 ||
    typeof input.workspace_id !== "string" ||
    !CANONICAL_WORKSPACE.test(input.workspace_id) ||
    typeof input.project_id !== "string" ||
    !CANONICAL_PROJECT.test(input.project_id) ||
    !Number.isSafeInteger(input.expected_active_selection_revision) ||
    Number(input.expected_active_selection_revision) < 1 ||
    typeof input.pc4_scope_key !== "string" ||
    !SCOPE_KEY.test(input.pc4_scope_key) ||
    typeof input.guide_material_fingerprint !== "string" ||
    !GUIDE_MATERIAL_FINGERPRINT.test(input.guide_material_fingerprint) ||
    typeof input.candidate_set_fingerprint !== "string" ||
    !CANDIDATE_FINGERPRINT.test(input.candidate_set_fingerprint) ||
    typeof input.mounted_host_generation !== "string" ||
    !HOST_GENERATION.test(input.mounted_host_generation) ||
    !Array.isArray(intents) ||
    intents.length < 1 ||
    intents.length > GUIDE_BRIEF_INTERPRETATION_LIMITS_V01.candidates ||
    new Set(intents).size !== intents.length ||
    intents.some(
      (intent) =>
        !GUIDE_BRIEF_CONVERSATION_INTENTS_V01.includes(
          intent as GuideBriefConversationIntentV01,
        ),
    )
  ) {
    throw new Error("guidebrief_interpretation_request_invalid");
  }
  const orderedIntents = GUIDE_BRIEF_CONVERSATION_INTENTS_V01.filter((intent) =>
    intents.includes(intent),
  );
  if (
    JSON.stringify(orderedIntents) !== JSON.stringify(intents) ||
    buildGuideBriefInterpretationCandidateSetFingerprintV01(orderedIntents) !==
      input.candidate_set_fingerprint
  ) {
    throw new Error("guidebrief_interpretation_request_invalid");
  }
  return input as unknown as GuideBriefInterpretationRequestV01;
}

function exactActiveBindingV01(
  guide: Awaited<ReturnType<typeof loadProjectGuideBriefV02>>["guide"],
  request: GuideBriefInterpretationRequestV01,
  fingerprintGuide: typeof buildGuideBriefConversationGuideFingerprintV01,
) {
  return (
    guide.identity.project_context === "current" &&
    guide.identity.workspace_id === request.workspace_id &&
    guide.identity.project_id === request.project_id &&
    guide.identity.active_project_id === request.project_id &&
    guide.identity.active_selection_revision ===
      request.expected_active_selection_revision &&
    fingerprintGuide(guide) === request.guide_material_fingerprint
  );
}

function readCurrentActiveSelectionV01(workspaceId: string) {
  const db = openDatabase();
  try {
    return readActiveProjectSelectionV01(db, workspaceId);
  } finally {
    db.close();
  }
}

function publicResultV01(
  status: GuideBriefInterpretationPublicResultV01["status"],
  intent: GuideBriefConversationIntentV01 | null = null,
): GuideBriefInterpretationPublicResultV01 {
  return {
    result_version: GUIDE_BRIEF_INTERPRETATION_RESULT_VERSION_V01,
    status,
    intent,
    model_assisted: status === "resolved",
    no_answer_prose_returned: true,
    durable_state_changed: false,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
