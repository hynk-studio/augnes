import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { VNEXT_LOCAL_OPERATOR_SESSION_COOKIE_PATH_V01 } from "../lib/vnext/runtime/local-operator-session";

const PC5_INTERPRETATION_PATH =
  "/api/vnext/operator/guide-brief/interpretation";

const component = readFileSync(
  new URL(
    "../components/guide/guide-brief-conversation.tsx",
    import.meta.url,
  ),
  "utf8",
);
const css = readFileSync(
  new URL(
    "../components/guide/guide-brief-conversation.module.css",
    import.meta.url,
  ),
  "utf8",
);
const blankState = readFileSync(
  new URL("../components/blank-state/blank-state-client.tsx", import.meta.url),
  "utf8",
);
const detail = readFileSync(
  new URL(
    "../components/workbench/semantic-review/decision-centered-proposal-detail.tsx",
    import.meta.url,
  ),
  "utf8",
);
const owner = readFileSync(
  new URL(
    "../lib/vnext/guide-brief/guide-brief-conversation-plan.ts",
    import.meta.url,
  ),
  "utf8",
);

assert.match(component, /<summary>Ask about this work<\/summary>/);
assert.match(component, /Questions supported by current sources/);
assert.match(component, /visibleAnswer \?[\s\S]*ConversationAnswer/);
assert.match(
  component,
  /selectVisibleGuideBriefConversationAnswerV01\(\s*answer,\s*scopeKey,\s*\)/,
);
assert.match(
  component,
  /scopeGuideBriefConversationContextV01\(\s*context,\s*scopeKey,\s*\)/,
);
assert.match(component, /data-guidebrief-conversation-hydrated=\{String\(hydrated\)\}/);
assert.match(component, /data-guidebrief-conversation-presentation=\{presentation\}/);
assert.match(component, /setContext\(createGuideBriefConversationContextV01\(scopeKey\)\)/);
assert.match(component, /Guidance and bounded Browser handoffs only\./);
assert.match(component, /locally\s+configured\s+model provider/);
assert.match(component, /No\s+conversation transcript is stored/);
assert.match(
  component,
  /pc5InterpretationBinding\s*\?\s*"\/api\/vnext\/operator\/guide-brief\/interpretation"\s*:\s*"\/api\/augnes\/guide-brief\/interpretation"/,
);
assert.equal(
  PC5_INTERPRETATION_PATH.startsWith(
    `${VNEXT_LOCAL_OPERATOR_SESSION_COOKIE_PATH_V01}/`,
  ),
  true,
);
assert.match(component, /cache:\s*"no-store"/);
assert.match(component, /interpretationAbort\.current\?\.abort\(\)/);
assert.match(component, /interactionBusy/);
assert.match(component, /validateGuideBriefInterpretationPublicResultV01/);
assert.match(component, /guideBriefConversationCanonicalQuestionV01/);
assert.match(component, /pc5_binding:/);
assert.match(
  component,
  /projectGuideBriefInterpretationPc5BindingV01\(capabilitySnapshot\)/,
);
assert.match(
  component,
  /pc5InterpretationBinding\?\.capability_snapshot_fingerprint\s*\?\?\s*"conversation-only"/,
);
assert.doesNotMatch(
  component,
  /buildGuideBriefInterpretationCandidateSetFingerprintV01\([\s\S]{0,160}capabilitySnapshot\?\.fingerprint/,
);
assert.match(component, /candidate_kind === "action"/);
assert.match(
  component,
  /action_plan\.scope_key === binding\.scope_key/,
);
assert.match(
  component,
  /action_plan\.capability_snapshot_fingerprint ===\s*binding\.capability_snapshot_fingerprint/,
);
assert.doesNotMatch(
  component,
  /action_plan\.scope_key !== scopeKey|action_plan\.capability_snapshot_fingerprint !==\s*capabilitySnapshot\.fingerprint/,
);
assert.match(component, /setActionProposalWasModelAssisted\(true\)/);
assert.match(component, /data-guidebrief-model-action-activate="true"/);
assert.match(component, /Model-assisted match · action proposal/);
assert.match(component, /await executeInteractionPlanV01\(visibleInteractionPlan\)/);
assert.match(
  component,
  /data-augnes-visual-priority=\{SEMANTIC_VISUAL_PRIORITY\.supporting\}/,
);
assert.doesNotMatch(component, /localStorage|sessionStorage|indexedDB/);
assert.equal((component.match(/\bfetch\s*\(/gu) ?? []).length, 1);
assert.doesNotMatch(
  component,
  /api\.openai\.com|OPENAI_API_KEY|Authorization|responses\.create|provider\s*\(/i,
);
assert.doesNotMatch(component, /provider[_ -]authored.*direct_answer/i);
assert.doesNotMatch(component, /data-augnes-primary-action/);

assert.match(css, /min-height:\s*44px/);
assert.match(css, /min-width:\s*0/);
assert.match(css, /overflow-wrap:\s*anywhere/);
assert.match(css, /@media \(max-width:\s*760px\)/);

assert.match(blankState, /surface="blank_state"[\s\S]*interaction=\{blankInteraction\}/);
assert.match(detail, /surface="ai_workplane"/);
assert.match(detail, /buildSelectedWorkRelationshipsV01\(\{/);
assert.match(detail, /selected_relationship_question_key=/);
assert.match(detail, /workspace_id:\s*read\.proposal\.workspace_id/);
assert.match(detail, /project_id:\s*read\.proposal\.project_id/);
assert.doesNotMatch(detail, /guidebrief.*primary-action/i);

assert.match(owner, /routeGuideBriefConversationQuestionV01/);
assert.match(owner, /slice\(-GUIDE_BRIEF_CONVERSATION_MAX_TURNS_V01\)/);
assert.match(owner, /assertGuideBriefConversationInputBindingsV01/);
assert.match(owner, /highlightedRelationshipConnectionV01/);
assert.doesNotMatch(owner, /relationship\.connections\[0\]/);
assert.doesNotMatch(owner, /localStorage|sessionStorage|indexedDB/);
assert.doesNotMatch(owner, /\bfetch\s*\(|openai|anthropic|provider\(/i);

console.log("vNext GuideBrief conversation component contract tests passed.");
