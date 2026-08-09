import type { GuideBriefConversationIntentV01 } from "./guide-brief-conversation";
import type { GuideBriefInteractionPlanV01 } from "./guide-brief-interaction";
import type { SelectedWorkRelationshipQuestionKeyV01 } from "./selected-work-relationships";

export const GUIDE_BRIEF_INTERPRETATION_REQUEST_VERSION_V01 =
  "guidebrief_interpretation_request.v0.2" as const;
export const GUIDE_BRIEF_INTERPRETATION_RESULT_VERSION_V01 =
  "guidebrief_interpretation_result.v0.2" as const;

export const GUIDE_BRIEF_INTERPRETATION_LIMITS_V01 = {
  candidates: 24,
  returned_candidate_tokens: 2,
  max_input_bytes: 16_384,
  max_output_tokens: 256,
  timeout_ms: 8_000,
} as const;

export type GuideBriefInterpretationCoverageV01 =
  | "complete"
  | "partial"
  | "none";
export type GuideBriefInterpretationClassificationV01 =
  | "single"
  | "multiple"
  | "unsupported";

/** Provider-facing, invocation-local material. It carries no Core identity. */
export interface GuideBriefInterpretationProviderCandidateV01 {
  candidate_token: string;
  public_meaning: string;
  semantic_description: string;
  currently_available: true;
}

export interface GuideBriefInterpretationModelInputV01 {
  input_kind: "guidebrief_interpretation";
  utterance: string;
  candidates: GuideBriefInterpretationProviderCandidateV01[];
}

export interface GuideBriefInterpretationModelOutputV01 {
  coverage: GuideBriefInterpretationCoverageV01;
  classification: GuideBriefInterpretationClassificationV01;
  candidate_tokens: string[];
}

export interface GuideBriefInterpretationRequestV01 {
  request_version: typeof GUIDE_BRIEF_INTERPRETATION_REQUEST_VERSION_V01;
  utterance: string;
  workspace_id: string;
  project_id: string;
  expected_active_selection_revision: number;
  pc4_scope_key: string;
  guide_material_fingerprint: string;
  candidate_set_fingerprint: string;
  available_intents: GuideBriefConversationIntentV01[];
  pc5_binding: GuideBriefInterpretationPc5BindingV01 | null;
  mounted_host_generation: string;
}

/** Browser-selected scope is a non-authoritative lookup hint only. */
export interface GuideBriefInterpretationPc5BindingV01 {
  capability_snapshot_fingerprint: string;
  proposal_id: string;
  proposal_fingerprint: string;
  candidate_id: string;
  candidate_fingerprint: string;
  selected_relationship_question_key:
    | SelectedWorkRelationshipQuestionKeyV01
    | null;
}

export type GuideBriefInterpretationPublicStatusV01 =
  | "resolved"
  | "ambiguous"
  | "unsupported"
  | "unavailable"
  | "failed"
  | "timed_out"
  | "invalid"
  | "stale";

export interface GuideBriefInterpretationPublicResultV01 {
  result_version: typeof GUIDE_BRIEF_INTERPRETATION_RESULT_VERSION_V01;
  status: GuideBriefInterpretationPublicStatusV01;
  candidate_kind: "question" | "action" | null;
  intent: GuideBriefConversationIntentV01 | null;
  action_plan: GuideBriefInteractionPlanV01 | null;
  model_assisted: boolean;
  no_answer_prose_returned: true;
  no_action_executed: true;
  durable_state_changed: false;
}
