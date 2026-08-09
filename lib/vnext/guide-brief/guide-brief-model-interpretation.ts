import {
  GUIDE_BRIEF_CONVERSATION_INTENTS_V01,
  type GuideBriefConversationIntentV01,
} from "@/types/vnext/guide-brief-conversation";
import {
  GUIDE_BRIEF_INTERPRETATION_LIMITS_V01,
  GUIDE_BRIEF_INTERPRETATION_RESULT_VERSION_V01,
  type GuideBriefInterpretationPublicResultV01,
} from "@/types/vnext/guide-brief-interpretation";
import type {
  BrowserActionCapabilityV01,
  GuideBriefInteractionRequestV01,
} from "@/types/vnext/guide-brief-interaction";
import { GUIDE_BRIEF_INTERACTION_PLAN_VERSION_V01 } from "@/types/vnext/guide-brief-interaction";

const INTENTS = new Set<string>(GUIDE_BRIEF_CONVERSATION_INTENTS_V01);

const QUESTION_CUES = [
  /^(?:what|where|why|how|which|when|who|is|are|do|does|can|could|would|should)\b/u,
  /\b(?:now|current|currently|evidence|support|source|connected|connection|relationship|review|attention|uncertain|conflict|decision|change|outcome|next|happening|position)\b/u,
  /(?:무엇|뭐|어디|왜|어떻게|어떤|언제|누가|현재|지금|상황|위치|근거|증거|출처|연결|관계|검토|확인|주의|불확실|충돌|결정|변경|결과|다음|진행)/u,
] as const;

const ENGLISH_PC5_ACTION = String.raw`(?:open|take|select|choose|prepare|show|review|focus)`;
const ENGLISH_PC5_ACTION_GERUND = String.raw`(?:opening|taking|selecting|choosing|preparing|showing|reviewing|focusing)`;
const ENGLISH_SHOW_ACTION_TARGET = String.raw`(?:the\s+)?(?:next\s+(?:change|candidate|unresolved\s+change)|source\s+connection|blocker|decision\s+connection|project\s+change\s+connection|later\s+outcome|current\s+action|advanced\s+review|exact\s+(?:details|source)|impact|what\s+i\s+should\s+do\s+next|what\s+would\s+change\s+before\s+applying)`;
const ENGLISH_ACTION_REQUEST = String.raw`(?:${ENGLISH_PC5_ACTION}\b.*(?:next\s+(?:change|candidate)|source|support|connection|current\s+action|advanced\s+review|exact\s+(?:details|source)|accept|replace|supersede|retract|remove|impact|before\s+applying)|show\s+${ENGLISH_SHOW_ACTION_TARGET}\b)`;
const ENGLISH_ACTION_REQUEST_GERUND = String.raw`(?:${ENGLISH_PC5_ACTION_GERUND}\b.*(?:next\s+(?:change|candidate)|source|support|connection|current\s+action|advanced\s+review|exact\s+(?:details|source)|accept|replace|supersede|retract|remove|impact|before\s+applying)|showing\s+${ENGLISH_SHOW_ACTION_TARGET}\b)`;
const KOREAN_ACTION_REQUEST_ENDING = String.raw`(?:줘|주세요|주십시오|줄래(?:요)?|줄\s*수\s*(?:있어(?:요)?|있나요|있습니까)|주시겠어요|주실래요|주시겠습니까)`;
const KOREAN_PC5_ACTION_REQUEST = new RegExp(
  String.raw`(?:(?:다음|후보|변경|근거|출처|연결|관계|현재|지금|검토|화면|항목|자세|상세|수락|대체|철회|적용\s*전|뭐가\s*바뀌).*)?(?:보여|열어|선택해|골라|준비해|데려가|이동해)(?:\s*${KOREAN_ACTION_REQUEST_ENDING})?(?:요)?\s*$`,
  "u",
);

const PC5_ACTION_SHAPED = [
  new RegExp(String.raw`^(?:please\s+)?${ENGLISH_ACTION_REQUEST}`, "u"),
  new RegExp(
    String.raw`^(?:can|could|would|will)\s+you(?:\s+please)?\s+${ENGLISH_ACTION_REQUEST}`,
    "u",
  ),
  new RegExp(
    String.raw`^please\s+(?:can|could|would|will)\s+you\s+${ENGLISH_ACTION_REQUEST}`,
    "u",
  ),
  new RegExp(
    String.raw`^would\s+you\s+mind\s+${ENGLISH_ACTION_REQUEST_GERUND}`,
    "u",
  ),
  new RegExp(
    String.raw`^i(?:\s+d|\s+would)\s+like\s+you\s+to\s+${ENGLISH_ACTION_REQUEST}`,
    "u",
  ),
  KOREAN_PC5_ACTION_REQUEST,
] as const;

const FORBIDDEN_OR_OUT_OF_FAMILY_ACTION = [
  /\b(?:apply|confirm|save|start|resume|run|execute|call|click|switch|activate|create|delete|rebind|commit|push|merge|deploy|release|publish)\b/u,
  /\b(?:api|url|button|selector|command|github|pull request)\b/u,
  /(?:적용|확정|저장|시작|재개|실행|호출|클릭|전환|활성화|생성|삭제|재연결|커밋|푸시|병합|배포|게시)(?:해|하|시켜|할)/u,
  /(?:api|url|버튼|명령|깃허브|풀\s*리퀘스트|프로젝트)/iu,
] as const;

const GENERIC_ENGLISH_REQUEST = /^(?:please\s+[a-z]+|(?:can|could|would|will)\s+you(?:\s+please)?\s+[a-z]+|would\s+you\s+mind\s+[a-z]+|i(?:\s+d|\s+would)\s+like\s+you\s+to\s+[a-z]+)/u;
const READ_ONLY_ENGLISH_REQUEST = /^(?:(?:can|could|would|will)\s+you(?:\s+please)?\s+|please\s+)?(?:tell|explain|describe|restate|show\s+me\s+(?:whether|if))\b/u;
const READ_ONLY_KOREAN_REQUEST = new RegExp(
  String.raw`(?:알려|설명해)(?:\s*${KOREAN_ACTION_REQUEST_ENDING})?(?:요)?\s*$`,
  "u",
);
const DIRECT_SEMANTIC_ACTION = /\b(?:accept|reject|supersede|replace|retract|remove)\b|(?:수락|거절|대체|철회)(?:해|하|할)/u;
const SEMANTIC_PREPARATION_REQUEST = /\bprepare\b|(?:준비해|준비하|준비할)/u;

const PC5_ACTION_FAMILY_CUES: Record<
  BrowserActionCapabilityV01["action_key"],
  RegExp
> = {
  "selected_work.select_next_candidate":
    /\b(?:next\s+(?:change|candidate|unresolved\s+change))\b|(?:다음|후보).*(?:변경|후보|검토)|(?:변경|후보).*(?:다음)/u,
  "relationship.select_question":
    /\b(?:source|support|supporting|connection|relationship|blocker|later\s+outcome)\b|(?:근거|출처|연결|관계)/u,
  "surface.open_current_action":
    /\b(?:current\s+action|what\s+i\s+should\s+do\s+next)\b|(?:해야\s*할\s*곳|현재\s*(?:행동|작업)|지금\s*(?:행동|작업)|데려가|이동해)/u,
  "panel.open_advanced_review":
    /\badvanced\s+review\b|(?:고급\s*검토)/u,
  "inspector.open_selected_work":
    /\bexact\s+(?:details|source)\b|(?:자세한?\s*내용|상세한?\s*내용|정확한?\s*(?:내용|세부))/u,
  "decision.prepare_applying":
    /\b(?:accept|replace|supersede|retract|remove)\b|(?:수락|대체|철회).*(?:결정|준비)|(?:결정|준비).*(?:수락|대체|철회)/u,
  "transition.prepare_preview":
    /\b(?:impact|before\s+applying|what\s+would\s+change)\b|(?:적용\s*전|뭐가\s*바뀌|무엇이\s*바뀌)/u,
};

const MULTI_REQUEST = /(?:\s+(?:and|then)\s+|(?:그리고|그다음|한\s*뒤|후에)\s+)/u;

const FORBIDDEN_EGRESS_MATERIAL = [
  /(?:https?:\/\/|file:\/\/|\/Users\/|\/home\/|[A-Za-z]:\\)/u,
  /\b(?:workspace|project|candidate|proposal|request|receipt|run|work):[A-Za-z0-9:._-]+\b/u,
  /\b(?:sha256:)?[a-f0-9]{64}\b/iu,
  /\b(?:endpoint|route|selector|cookie|nonce|fingerprint|source[_ -]?ref|api[_ -]?key|authorization)\b/u,
] as const;

const PUBLIC_MEANINGS: Record<
  GuideBriefConversationIntentV01,
  { public_meaning: string; semantic_description: string }
> = {
  current_situation: {
    public_meaning: "What is happening now?",
    semantic_description: "The present meaningful situation of the current work.",
  },
  meaningful_change: {
    public_meaning: "What meaningfully changed?",
    semantic_description: "The important recent change or result in the current work.",
  },
  human_attention_reason: {
    public_meaning: "Why does this need my attention?",
    semantic_description: "Why the current work needs human review, attention, or judgment.",
  },
  source_and_support: {
    public_meaning: "What supports this?",
    semantic_description: "The evidence, sources, or support already available for the current work.",
  },
  relationship_explanation: {
    public_meaning: "Why is this connected?",
    semantic_description: "How and why currently shown work items or evidence are related.",
  },
  uncertainty_and_conflict: {
    public_meaning: "What remains uncertain or in conflict?",
    semantic_description: "Known uncertainty, disagreement, limitation, or conflict in the current work.",
  },
  decision_and_authority: {
    public_meaning: "What decision is pending and who decides?",
    semantic_description: "The current decision boundary and preserved human authority, as read-only information.",
  },
  transition_status: {
    public_meaning: "Has the project change been applied?",
    semantic_description: "The read-only status of any current proposed or completed project change.",
  },
  later_outcome: {
    public_meaning: "What later outcome should show usefulness?",
    semantic_description: "The later outcome or follow-up signal already recorded for the current work.",
  },
  next_meaningful_action: {
    public_meaning: "What is the next meaningful action?",
    semantic_description: "The already projected next step for the current work, without executing it.",
  },
  capability_boundary: {
    public_meaning: "What can Augnes do here?",
    semantic_description: "The current read-only capability and authority boundary of this surface.",
  },
};

export function guideBriefInterpretationCandidateMeaningV01(
  intent: GuideBriefConversationIntentV01,
) {
  return PUBLIC_MEANINGS[intent];
}

export function guideBriefActionInterpretationCandidateMeaningV01(
  capability: BrowserActionCapabilityV01,
) {
  return {
    public_meaning: capability.public_label,
    semantic_description: capability.public_effect_preview,
  };
}

export function buildGuideBriefInterpretationCandidateSetFingerprintV01(
  intents: readonly GuideBriefConversationIntentV01[],
  capabilitySnapshotFingerprint = "conversation-only",
): string {
  const canonical = `${[...intents].sort().join("\u0000")}\u0001${capabilitySnapshotFingerprint}`;
  let high = 0x811c9dc5;
  let low = 0x01000193;
  for (let index = 0; index < canonical.length; index += 1) {
    const code = canonical.charCodeAt(index);
    high = Math.imul(high ^ code, 0x01000193) >>> 0;
    low = Math.imul(low ^ (code + index), 0x811c9dc5) >>> 0;
  }
  return `guidebrief-candidates:${high.toString(16).padStart(8, "0")}${low
    .toString(16)
    .padStart(8, "0")}`;
}

export function isGuideBriefModelInterpretationEligibleV01(input: {
  request: GuideBriefInteractionRequestV01;
  project_context: "none" | "current" | "viewed";
  active_project_id: string | null;
  project_id: string | null;
  active_selection_revision: number | null;
  available_intents: readonly GuideBriefConversationIntentV01[];
  available_actions?: readonly BrowserActionCapabilityV01[];
}): boolean {
  const utterance = input.request.normalized_utterance;
  const hasMatchingAvailableAction =
    (input.available_actions?.some(
      (capability) =>
        capability.availability === "available" &&
        capability.may_propose &&
        PC5_ACTION_FAMILY_CUES[capability.action_key].test(utterance),
    ) ?? false);
  const actionEligible =
    hasMatchingAvailableAction &&
    PC5_ACTION_SHAPED.some((pattern) => pattern.test(utterance));
  const genericRequest =
    GENERIC_ENGLISH_REQUEST.test(utterance) ||
    KOREAN_PC5_ACTION_REQUEST.test(utterance);
  const readOnlyRequest =
    READ_ONLY_ENGLISH_REQUEST.test(utterance) ||
    READ_ONLY_KOREAN_REQUEST.test(utterance);
  const questionEligible =
    QUESTION_CUES.some((pattern) => pattern.test(utterance)) &&
    (!genericRequest || readOnlyRequest);
  const directSemanticAction =
    DIRECT_SEMANTIC_ACTION.test(utterance) &&
    !SEMANTIC_PREPARATION_REQUEST.test(utterance);
  return (
    input.request.classification === "unsupported" &&
    input.request.pc4_intent === null &&
    input.request.candidate_route_keys.length === 0 &&
    input.project_context === "current" &&
    input.project_id !== null &&
    input.active_project_id === input.project_id &&
    Number.isSafeInteger(input.active_selection_revision) &&
    Number(input.active_selection_revision) > 0 &&
    input.available_intents.length + (input.available_actions?.length ?? 0) > 0 &&
    input.available_intents.length + (input.available_actions?.length ?? 0) <=
      GUIDE_BRIEF_INTERPRETATION_LIMITS_V01.candidates &&
    !MULTI_REQUEST.test(utterance) &&
    !directSemanticAction &&
    !FORBIDDEN_OR_OUT_OF_FAMILY_ACTION.some((pattern) => pattern.test(utterance)) &&
    (questionEligible || actionEligible) &&
    !FORBIDDEN_EGRESS_MATERIAL.some((pattern) => pattern.test(input.request.raw_utterance))
  );
}

export function validateGuideBriefInterpretationPublicResultV01(
  input: unknown,
): GuideBriefInterpretationPublicResultV01 {
  if (!isRecord(input)) throw new Error("guidebrief_interpretation_result_invalid");
  const keys = Object.keys(input).sort();
  const expected = [
    "action_plan",
    "candidate_kind",
    "durable_state_changed",
    "intent",
    "model_assisted",
    "no_action_executed",
    "no_answer_prose_returned",
    "result_version",
    "status",
  ];
  if (JSON.stringify(keys) !== JSON.stringify(expected)) {
    throw new Error("guidebrief_interpretation_result_invalid");
  }
  const statuses = new Set([
    "resolved", "ambiguous", "unsupported", "unavailable", "failed",
    "timed_out", "invalid", "stale",
  ]);
  const intent = input.intent;
  const actionPlan = input.action_plan;
  const questionResolved =
    input.status === "resolved" && input.candidate_kind === "question";
  const actionResolved =
    input.status === "resolved" && input.candidate_kind === "action";
  if (
    input.result_version !== GUIDE_BRIEF_INTERPRETATION_RESULT_VERSION_V01 ||
    !statuses.has(String(input.status)) ||
    !["question", "action", null].includes(
      input.candidate_kind as "question" | "action" | null,
    ) ||
    (intent !== null && !INTENTS.has(String(intent))) ||
    (questionResolved !== (intent !== null)) ||
    (actionResolved !== isResolvedActionPlanV01(actionPlan)) ||
    (input.status !== "resolved" &&
      (input.candidate_kind !== null || intent !== null || actionPlan !== null)) ||
    input.model_assisted !== (input.status === "resolved") ||
    input.no_answer_prose_returned !== true ||
    input.no_action_executed !== true ||
    input.durable_state_changed !== false
  ) {
    throw new Error("guidebrief_interpretation_result_invalid");
  }
  return input as unknown as GuideBriefInterpretationPublicResultV01;
}

function isResolvedActionPlanV01(value: unknown): boolean {
  return (
    isRecord(value) &&
    value.plan_version === GUIDE_BRIEF_INTERACTION_PLAN_VERSION_V01 &&
    value.status === "resolved" &&
    typeof value.action_key === "string" &&
    typeof value.target_handle === "string" &&
    typeof value.public_label === "string" &&
    typeof value.public_preview === "string" &&
    value.authority !== null &&
    isRecord(value.authority) &&
    value.authority.makes_decision === false &&
    value.authority.applies_transition === false &&
    value.authority.executes_semantic_mutation === false &&
    value.authority.calls_provider === false
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
