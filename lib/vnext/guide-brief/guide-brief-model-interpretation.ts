import {
  GUIDE_BRIEF_CONVERSATION_INTENTS_V01,
  type GuideBriefConversationIntentV01,
} from "@/types/vnext/guide-brief-conversation";
import {
  GUIDE_BRIEF_INTERPRETATION_LIMITS_V01,
  GUIDE_BRIEF_INTERPRETATION_RESULT_VERSION_V01,
  type GuideBriefInterpretationPublicResultV01,
} from "@/types/vnext/guide-brief-interpretation";
import type { GuideBriefInteractionRequestV01 } from "@/types/vnext/guide-brief-interaction";

const INTENTS = new Set<string>(GUIDE_BRIEF_CONVERSATION_INTENTS_V01);

const QUESTION_CUES = [
  /^(?:what|where|why|how|which|when|who|is|are|do|does|can|could|would|should)\b/u,
  /\b(?:now|current|currently|evidence|support|source|connected|connection|relationship|review|attention|uncertain|conflict|decision|change|outcome|next|happening|position)\b/u,
  /(?:무엇|뭐|어디|왜|어떻게|어떤|언제|누가|현재|지금|상황|위치|근거|증거|출처|연결|관계|검토|확인|주의|불확실|충돌|결정|변경|결과|다음|진행)/u,
] as const;

const ACTION_SHAPED = [
  /^(?:please\s+)?(?:open|show|take|select|choose|click|prepare|accept|reject|supersede|replace|retract|remove|apply|confirm|save|start|resume|run|execute|navigate|switch|activate|create|submit|merge|deploy|release|publish)\b/u,
  /^(?:(?:can|could|would|will)\s+you\s+|please\s+)(?:open|show|take|select|choose|click|prepare|accept|reject|supersede|replace|retract|remove|apply|confirm|save|start|resume|run|execute|navigate|switch|activate|create|submit|merge|deploy|release|publish)\b/u,
  /(?:해\s*줘|해주세요|해라|열어|보여|선택해|골라|클릭해|준비해|수락해|거절해|대체해|철회해|삭제해|적용해|확정해|저장해|시작해|재개해|실행해|이동해|전환해|활성화해|생성해|제출해|병합해|배포해|게시해)(?:요)?[?!.\s]*$/u,
  /(?:열기|보기|선택|클릭|준비|수락|거절|대체|철회|삭제|적용|확정|저장|시작|재개|실행|이동|전환|활성화|생성|제출|병합|배포|게시)(?:해)?\s*(?:줘|주세요|주십시오)[?!.\s]*$/u,
  /\b(?:decision|transition|start|resume|project|url|api|button|selector|command)\b.*\b(?:create|prepare|apply|confirm|execute|run|open|click|switch)\b/u,
] as const;

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

export function buildGuideBriefInterpretationCandidateSetFingerprintV01(
  intents: readonly GuideBriefConversationIntentV01[],
): string {
  const canonical = [...intents].sort().join("\u0000");
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
}): boolean {
  const utterance = input.request.normalized_utterance;
  return (
    input.request.classification === "unsupported" &&
    input.request.pc4_intent === null &&
    input.request.candidate_route_keys.length === 0 &&
    input.project_context === "current" &&
    input.project_id !== null &&
    input.active_project_id === input.project_id &&
    Number.isSafeInteger(input.active_selection_revision) &&
    Number(input.active_selection_revision) > 0 &&
    input.available_intents.length > 0 &&
    input.available_intents.length <= GUIDE_BRIEF_INTERPRETATION_LIMITS_V01.candidates &&
    !MULTI_REQUEST.test(utterance) &&
    !ACTION_SHAPED.some((pattern) => pattern.test(utterance)) &&
    QUESTION_CUES.some((pattern) => pattern.test(utterance)) &&
    !FORBIDDEN_EGRESS_MATERIAL.some((pattern) => pattern.test(input.request.raw_utterance))
  );
}

export function validateGuideBriefInterpretationPublicResultV01(
  input: unknown,
): GuideBriefInterpretationPublicResultV01 {
  if (!isRecord(input)) throw new Error("guidebrief_interpretation_result_invalid");
  const keys = Object.keys(input).sort();
  const expected = [
    "durable_state_changed",
    "intent",
    "model_assisted",
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
  if (
    input.result_version !== GUIDE_BRIEF_INTERPRETATION_RESULT_VERSION_V01 ||
    !statuses.has(String(input.status)) ||
    (intent !== null && !INTENTS.has(String(intent))) ||
    input.model_assisted !== (input.status === "resolved") ||
    input.no_answer_prose_returned !== true ||
    input.durable_state_changed !== false
  ) {
    throw new Error("guidebrief_interpretation_result_invalid");
  }
  return input as unknown as GuideBriefInterpretationPublicResultV01;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
