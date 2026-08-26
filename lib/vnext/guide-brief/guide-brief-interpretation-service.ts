import { randomBytes, randomUUID } from "node:crypto";

import { openDatabase } from "@/lib/db";
import {
  buildGuideBriefConversationPlanV01,
  buildGuideBriefConversationGuideFingerprintV01,
  buildGuideBriefConversationScopeKeyV01,
  guideBriefConversationCanonicalQuestionV01,
  listAvailableGuideBriefConversationIntentsV01,
} from "@/lib/vnext/guide-brief/guide-brief-conversation-plan";
import {
  buildGuideBriefInterpretationCandidateSetFingerprintV01,
  guideBriefActionInterpretationCandidateMeaningV01,
  guideBriefInterpretationCandidateMeaningV01,
  guideBriefInterpretationPriorAnswerMeaningV01,
  guideBriefInterpretationRequiresPriorAnchorV01,
  isGuideBriefModelInterpretationEligibleV01,
} from "@/lib/vnext/guide-brief/guide-brief-model-interpretation";
import {
  buildGuideBriefInteractionRequestV01,
  compileGuideBriefInteractionPlanV01,
} from "@/lib/vnext/guide-brief/guide-brief-interaction-plan";
import type { CurrentGuideBriefPc5CapabilityBindingV01 } from "@/lib/vnext/guide-brief/guide-brief-pc5-capability-source";
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
  type GuideBriefConversationPlanInputV01,
  type GuideBriefConversationIntentV01,
} from "@/types/vnext/guide-brief-conversation";
import {
  GUIDE_BRIEF_INTERPRETATION_LIMITS_V01,
  GUIDE_BRIEF_INTERPRETATION_ANCHOR_CLAIM_VERSION_V01,
  GUIDE_BRIEF_INTERPRETATION_REQUEST_VERSION_V01,
  GUIDE_BRIEF_INTERPRETATION_RESULT_VERSION_V01,
  type GuideBriefInterpretationPublicResultV01,
  type GuideBriefInterpretationProviderAnchorV01,
  type GuideBriefInterpretationPc5BindingV01,
  type GuideBriefInterpretationRequestV01,
} from "@/types/vnext/guide-brief-interpretation";
import type {
  BrowserActionCapabilityV01,
  GuideBriefInteractionPlanV01,
} from "@/types/vnext/guide-brief-interaction";

const CANONICAL_WORKSPACE =
  /^workspace:[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;
const CANONICAL_PROJECT =
  /^project:[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;
const SCOPE_KEY = /^guidebrief-conversation-scope:[a-f0-9]{16}$/u;
const GUIDE_MATERIAL_FINGERPRINT = /^derived:[a-f0-9]{16}$/u;
const CANDIDATE_FINGERPRINT = /^guidebrief-candidates:[a-f0-9]{16}$/u;
const CAPABILITY_SNAPSHOT_FINGERPRINT =
  /^guidebrief-capability-snapshot:[a-f0-9]{16}$/u;
const SHA256_FINGERPRINT = /^sha256:[a-f0-9]{64}$/u;
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
  load_pc5_binding?: (input: {
    guide: Awaited<ReturnType<typeof loadProjectGuideBriefV02>>["guide"];
    workspace_id: string;
    project_id: string;
    binding: GuideBriefInterpretationPc5BindingV01;
  }) =>
    | CurrentGuideBriefPc5CapabilityBindingV01
    | null
    | Promise<CurrentGuideBriefPc5CapabilityBindingV01 | null>;
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
  const pc5Before = request.pc5_binding
    ? await dependencies.load_pc5_binding?.({
        guide: before.guide,
        workspace_id: request.workspace_id,
        project_id: request.project_id,
        binding: request.pc5_binding,
      }) ?? null
    : null;
  if (request.pc5_binding && !pc5Before) {
    return publicResultV01("stale");
  }
  const exactAvailableIntents = exactAvailableIntentsV01(
    before.guide,
    pc5Before,
  );
  const capabilitySnapshotFingerprint =
    pc5Before?.snapshot.fingerprint ?? "conversation-only";
  if (
    (pc5Before?.snapshot.scope_key ??
      buildGuideBriefConversationScopeKeyV01({
        guide: before.guide,
        question: "",
        conversation_context: null,
      })) !== request.pc4_scope_key ||
    JSON.stringify(exactAvailableIntents) !==
      JSON.stringify(request.available_intents) ||
    buildGuideBriefInterpretationCandidateSetFingerprintV01(
      exactAvailableIntents,
      capabilitySnapshotFingerprint,
    ) !== request.candidate_set_fingerprint
  ) {
    return publicResultV01("stale");
  }
  const previousAnswerAnchor = rebuildPriorAnswerAnchorV01({
    request,
    guide: before.guide,
    pc5: pc5Before,
  });
  if (
    request.previous_answer_anchor_claim !== null &&
    previousAnswerAnchor === null
  ) {
    return publicResultV01("stale");
  }
  const deterministicRequest = buildGuideBriefInteractionRequestV01({
    request_id: "guidebrief-interpretation:server-admission",
    raw_utterance: request.utterance,
    scope_key: request.pc4_scope_key,
    capability_snapshot_fingerprint: capabilitySnapshotFingerprint,
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
      available_intents: exactAvailableIntents,
      available_actions: pc5Before?.snapshot.capabilities ?? [],
    })
  ) {
    return publicResultV01("unsupported");
  }
  if (
    guideBriefInterpretationRequiresPriorAnchorV01(
      deterministicRequest.normalized_utterance,
    ) && previousAnswerAnchor === null
  ) {
    return publicResultV01("unsupported");
  }

  const tokenBindings = new Map<string, InterpretationCandidateBindingV01>();
  const candidates = [
    ...exactAvailableIntents.map((intent) => ({
      binding: { kind: "question" as const, intent },
      meaning: guideBriefInterpretationCandidateMeaningV01(intent),
    })),
    ...(pc5Before?.snapshot.capabilities ?? [])
      .filter(
        (capability) =>
          capability.availability === "available" &&
          capability.may_propose,
      )
      .map((capability) => ({
        binding: { kind: "action" as const, capability },
        meaning:
          guideBriefActionInterpretationCandidateMeaningV01(capability),
      })),
  ].map(({ binding, meaning }) => {
    const token = `c_${
      dependencies.token_bytes?.() ?? randomBytes(16).toString("hex")
    }`;
    if (!/^c_[a-f0-9]{32}$/u.test(token) || tokenBindings.has(token)) {
      throw new Error("guidebrief_interpretation_token_generation_invalid");
    }
    tokenBindings.set(token, binding);
    return {
      candidate_token: token,
      ...meaning,
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
        provenance_refs: ["guidebrief:current-work-candidate"],
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
          previous_answer_anchor: previousAnswerAnchor,
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
    const pc5After = request.pc5_binding
      ? await dependencies.load_pc5_binding?.({
          guide: after.guide,
          workspace_id: request.workspace_id,
          project_id: request.project_id,
          binding: request.pc5_binding,
        }) ?? null
      : null;
    if (
      Boolean(request.pc5_binding) !== Boolean(pc5After) ||
      pc5After?.snapshot.fingerprint !== pc5Before?.snapshot.fingerprint
    ) {
      return publicResultV01("stale");
    }
    const previousAnswerAnchorAfter = rebuildPriorAnswerAnchorV01({
      request,
      guide: after.guide,
      pc5: pc5After,
    });
    if (
      JSON.stringify(previousAnswerAnchorAfter) !==
        JSON.stringify(previousAnswerAnchor)
    ) {
      return publicResultV01("stale");
    }
    if (
      JSON.stringify(exactAvailableIntentsV01(after.guide, pc5After)) !==
      JSON.stringify(exactAvailableIntents)
    ) {
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
    const binding = tokenBindings.get(output.candidate_tokens[0]!) ?? null;
    if (!binding) return publicResultV01("invalid");
    if (binding.kind === "question") {
      return exactAvailableIntents.includes(binding.intent)
        ? publicResultV01("resolved", {
            candidate_kind: "question",
            intent: binding.intent,
          })
        : publicResultV01("stale");
    }
    if (!pc5After) return publicResultV01("stale");
    const rebound = exactReboundCapabilityV01(
      binding.capability,
      pc5After.snapshot.capabilities,
    );
    if (!rebound) return publicResultV01("stale");
    const actionRequest = {
      ...deterministicRequest,
      request_id: `guidebrief-model-action:${randomUUID()}`,
      classification: "action" as const,
      pc4_intent: null,
      candidate_route_keys: [rebound.route_key],
      capability_snapshot_fingerprint: pc5After.snapshot.fingerprint,
    };
    const plan = compileGuideBriefInteractionPlanV01({
      request: actionRequest,
      snapshot: pc5After.snapshot,
    });
    return plan.status === "resolved"
      ? publicResultV01("resolved", {
          candidate_kind: "action",
          action_plan: plan,
        })
      : publicResultV01("stale");
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
    "pc5_binding",
    "previous_answer_anchor_claim",
    "project_id",
    "request_version",
    "utterance",
    "workspace_id",
  ].sort();
  if (JSON.stringify(Object.keys(input).sort()) !== JSON.stringify(expectedKeys)) {
    throw new Error("guidebrief_interpretation_request_invalid");
  }
  const intents = input.available_intents;
  const pc5Binding = validatePc5BindingV01(input.pc5_binding);
  const previousAnswerAnchorClaim = validatePreviousAnswerAnchorClaimV01(
    input.previous_answer_anchor_claim,
  );
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
    (previousAnswerAnchorClaim !== null &&
      (previousAnswerAnchorClaim.mounted_host_generation !==
        input.mounted_host_generation ||
        previousAnswerAnchorClaim.scope_key !== input.pc4_scope_key)) ||
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
    buildGuideBriefInterpretationCandidateSetFingerprintV01(
      orderedIntents,
      pc5Binding?.capability_snapshot_fingerprint ?? "conversation-only",
    ) !==
      input.candidate_set_fingerprint
  ) {
    throw new Error("guidebrief_interpretation_request_invalid");
  }
  return input as unknown as GuideBriefInterpretationRequestV01;
}

function validatePreviousAnswerAnchorClaimV01(
  input: unknown,
): GuideBriefInterpretationRequestV01["previous_answer_anchor_claim"] {
  if (input === null) return null;
  if (!isRecord(input)) {
    throw new Error("guidebrief_interpretation_request_invalid");
  }
  const keys = [
    "claim_version",
    "intent",
    "mounted_host_generation",
    "scope_key",
    "subjects",
  ].sort();
  const subjects = new Set([
    "project",
    "selected_work",
    "decision",
    "transition",
    "relationship",
    "later_outcome",
    "capability",
  ]);
  if (
    JSON.stringify(Object.keys(input).sort()) !== JSON.stringify(keys) ||
    input.claim_version !==
      GUIDE_BRIEF_INTERPRETATION_ANCHOR_CLAIM_VERSION_V01 ||
    typeof input.scope_key !== "string" ||
    !SCOPE_KEY.test(input.scope_key) ||
    !GUIDE_BRIEF_CONVERSATION_INTENTS_V01.includes(
      input.intent as GuideBriefConversationIntentV01,
    ) ||
    !Array.isArray(input.subjects) ||
    input.subjects.length !== 1 ||
    !subjects.has(String(input.subjects[0])) ||
    typeof input.mounted_host_generation !== "string" ||
    !HOST_GENERATION.test(input.mounted_host_generation)
  ) {
    throw new Error("guidebrief_interpretation_request_invalid");
  }
  return input as unknown as GuideBriefInterpretationRequestV01["previous_answer_anchor_claim"];
}

function validatePc5BindingV01(
  input: unknown,
): GuideBriefInterpretationPc5BindingV01 | null {
  if (input === null) return null;
  if (!isRecord(input)) {
    throw new Error("guidebrief_interpretation_request_invalid");
  }
  const keys = [
    "candidate_fingerprint",
    "candidate_id",
    "capability_snapshot_fingerprint",
    "proposal_fingerprint",
    "proposal_id",
    "selected_relationship_question_key",
  ].sort();
  const relationshipKeys = new Set([
    "support_and_source",
    "candidate_and_decision",
    "blocker_and_conflict",
    "decision_and_project_change",
    "project_change_and_later_outcome",
  ]);
  if (
    JSON.stringify(Object.keys(input).sort()) !== JSON.stringify(keys) ||
    typeof input.capability_snapshot_fingerprint !== "string" ||
    !CAPABILITY_SNAPSHOT_FINGERPRINT.test(
      input.capability_snapshot_fingerprint,
    ) ||
    typeof input.proposal_id !== "string" ||
    input.proposal_id.trim().length === 0 ||
    input.proposal_id.length > 512 ||
    typeof input.candidate_id !== "string" ||
    input.candidate_id.trim().length === 0 ||
    input.candidate_id.length > 512 ||
    typeof input.proposal_fingerprint !== "string" ||
    !SHA256_FINGERPRINT.test(input.proposal_fingerprint) ||
    typeof input.candidate_fingerprint !== "string" ||
    !SHA256_FINGERPRINT.test(input.candidate_fingerprint) ||
    (input.selected_relationship_question_key !== null &&
      !relationshipKeys.has(String(input.selected_relationship_question_key)))
  ) {
    throw new Error("guidebrief_interpretation_request_invalid");
  }
  return input as unknown as GuideBriefInterpretationPc5BindingV01;
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
  resolved: {
    candidate_kind: "question" | "action";
    intent?: GuideBriefConversationIntentV01;
    action_plan?: GuideBriefInteractionPlanV01;
  } | null = null,
): GuideBriefInterpretationPublicResultV01 {
  return {
    result_version: GUIDE_BRIEF_INTERPRETATION_RESULT_VERSION_V01,
    status,
    candidate_kind: status === "resolved"
      ? resolved?.candidate_kind ?? null
      : null,
    intent:
      status === "resolved" && resolved?.candidate_kind === "question"
        ? resolved.intent ?? null
        : null,
    action_plan:
      status === "resolved" && resolved?.candidate_kind === "action"
        ? resolved.action_plan ?? null
        : null,
    model_assisted: status === "resolved",
    no_answer_prose_returned: true,
    no_action_executed: true,
    durable_state_changed: false,
  };
}

type InterpretationCandidateBindingV01 =
  | {
      kind: "question";
      intent: GuideBriefConversationIntentV01;
    }
  | {
      kind: "action";
      capability: BrowserActionCapabilityV01;
    };

function exactAvailableIntentsV01(
  guide: Awaited<ReturnType<typeof loadProjectGuideBriefV02>>["guide"],
  pc5: CurrentGuideBriefPc5CapabilityBindingV01 | null,
): GuideBriefConversationIntentV01[] {
  return listAvailableGuideBriefConversationIntentsV01(
    pc5
      ? {
          guide,
          guide_source_fingerprint: null,
          selected_work_scope: pc5.selected_work_scope,
          timeline: pc5.timeline,
          relationships: pc5.relationships_by_question,
          selected_relationship_question_key:
            pc5.selected_relationship_question_key,
        }
      : { guide },
  );
}

function exactConversationInputV01(
  guide: Awaited<ReturnType<typeof loadProjectGuideBriefV02>>["guide"],
  pc5: CurrentGuideBriefPc5CapabilityBindingV01 | null,
): Omit<GuideBriefConversationPlanInputV01, "question" | "conversation_context"> {
  return pc5
    ? {
        guide,
        guide_source_fingerprint: null,
        selected_work_scope: pc5.selected_work_scope,
        timeline: pc5.timeline,
        relationships: pc5.relationships_by_question,
        selected_relationship_question_key:
          pc5.selected_relationship_question_key,
      }
    : { guide };
}

function rebuildPriorAnswerAnchorV01(input: {
  request: GuideBriefInterpretationRequestV01;
  guide: Awaited<ReturnType<typeof loadProjectGuideBriefV02>>["guide"];
  pc5: CurrentGuideBriefPc5CapabilityBindingV01 | null;
}): GuideBriefInterpretationProviderAnchorV01 | null {
  const claim = input.request.previous_answer_anchor_claim;
  if (claim === null) return null;
  const plan = buildGuideBriefConversationPlanV01({
    ...exactConversationInputV01(input.guide, input.pc5),
    question: guideBriefConversationCanonicalQuestionV01(claim.intent),
    conversation_context: null,
  });
  if (
    plan.routing.status !== "supported" ||
    plan.routing.intent !== claim.intent ||
    plan.availability === "unavailable" ||
    plan.availability === "ambiguous" ||
    plan.scope.scope_key !== input.request.pc4_scope_key ||
    plan.answer_anchor === null ||
    JSON.stringify(plan.answer_anchor) !==
      JSON.stringify({
        scope_key: claim.scope_key,
        intent: claim.intent,
        subjects: claim.subjects,
      })
  ) {
    return null;
  }
  return {
    anchor_kind: "immediately_previous_successful_guidebrief_answer",
    public_subject: guideBriefInterpretationPriorAnswerMeaningV01(
      claim.intent,
    ),
  };
}

function exactReboundCapabilityV01(
  issued: BrowserActionCapabilityV01,
  current: readonly BrowserActionCapabilityV01[],
): BrowserActionCapabilityV01 | null {
  const matches = current.filter(
    (capability) =>
      capability.action_key === issued.action_key &&
      capability.target_handle === issued.target_handle,
  );
  if (
    matches.length !== 1 ||
    JSON.stringify(matches[0]) !== JSON.stringify(issued) ||
    matches[0]!.availability !== "available" ||
    !matches[0]!.may_propose
  ) {
    return null;
  }
  return matches[0]!;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
