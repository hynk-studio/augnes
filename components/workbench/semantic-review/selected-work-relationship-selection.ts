import type {
  SelectedWorkRelationshipQuestionKeyV01,
  SelectedWorkRelationshipQuestionV01,
} from "@/types/vnext/selected-work-relationships";

export interface SelectedWorkRelationshipScopeV01 {
  workspace_id: string;
  project_id: string;
  proposal_id: string;
  proposal_fingerprint: string;
  candidate_id: string;
  candidate_fingerprint: string;
}

export interface SelectedWorkRelationshipQuestionSelectionV01 {
  scope_key: string;
  question_key: SelectedWorkRelationshipQuestionKeyV01;
}

export function selectedWorkRelationshipScopeKeyV01(
  scope: SelectedWorkRelationshipScopeV01,
): string {
  return [
    scope.workspace_id,
    scope.project_id,
    scope.proposal_id,
    scope.proposal_fingerprint,
    scope.candidate_id,
    scope.candidate_fingerprint,
  ].join("\u0000");
}

export function effectiveSelectedWorkRelationshipQuestionV01(input: {
  scope_key: string;
  selection: SelectedWorkRelationshipQuestionSelectionV01 | null;
  available_questions: readonly SelectedWorkRelationshipQuestionV01[];
  default_question_key: SelectedWorkRelationshipQuestionKeyV01 | null;
}): SelectedWorkRelationshipQuestionKeyV01 | null {
  const availableQuestionKeys = input.available_questions.map(
    (question) => question.question_key,
  );
  const fallback =
    input.default_question_key &&
    availableQuestionKeys.includes(input.default_question_key)
      ? input.default_question_key
      : (availableQuestionKeys[0] ?? null);
  return input.selection?.scope_key === input.scope_key &&
    availableQuestionKeys.includes(input.selection.question_key)
    ? input.selection.question_key
    : fallback;
}
