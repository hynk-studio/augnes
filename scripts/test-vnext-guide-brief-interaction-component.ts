import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path: string) =>
  readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

const conversation = read(
  "components/guide/guide-brief-conversation.tsx",
);
const detail = read(
  "components/workbench/semantic-review/decision-centered-proposal-detail.tsx",
);
const decision = read(
  "components/workbench/semantic-review/review-decision-form.tsx",
);
const transition = read(
  "components/workbench/semantic-review/semantic-transition-actions.tsx",
);
const blankState = read("components/blank-state/blank-state-client.tsx");
const owner = read(
  "lib/vnext/guide-brief/guide-brief-interaction-plan.ts",
);
const types = read("types/vnext/guide-brief-interaction.ts");

assert.match(conversation, /buildBrowserActionCapabilitySnapshotV01/);
assert.match(conversation, /compileGuideBriefInteractionPlanV01/);
assert.match(conversation, /executeGuideBriefInteractionPlanV01/);
assert.match(
  conversation,
  /createGuideBriefInteractionExecutionLedgerV01/,
);
assert.doesNotMatch(
  conversation,
  /executionLedger\.current\s*=\s*createGuideBriefInteractionExecutionLedgerV01\(\)/,
  "snapshot refresh must not replace the mounted host execution coordinator",
);
assert.doesNotMatch(
  conversation,
  /setInteractionBusy\(false\);[\s\S]{0,80}\}, \[interactionIdentity\]\)/,
  "snapshot refresh must not clear actual in-flight host state",
);
assert.match(conversation, /mountedHost\.current/);
assert.match(
  conversation,
  /executionLedger\.current\.in_flight_plan_id !== null/,
  "submission must synchronously honor the mounted-host in-flight lock",
);
assert.match(conversation, /data-guidebrief-interaction-in-flight/);
assert.match(
  conversation,
  /interactionOutcome\??\.refreshed_scope_key === scopeKey/,
);
assert.match(
  conversation,
  /interactionOutcome\.refreshed_capability_snapshot_fingerprint ===/,
);
assert.match(
  conversation,
  /interactionPlan\.plan_id === interactionOutcome\.plan_id/,
  "an outcome must remain bound to the active plan that produced it",
);
assert.match(
  conversation,
  /interactionPlan\.scope_key === scopeKey/,
  "a scope-changing owner handoff must synchronously hide its old outcome",
);
assert.match(
  conversation,
  /interactionPlan\.capability_snapshot_fingerprint ===\s*capabilitySnapshot\?\.fingerprint/,
  "a capability-changing owner handoff must synchronously hide its old outcome",
);
assert.match(conversation, /No durable state changed through this interaction/);
assert.match(conversation, /Available interactions/);
assert.match(conversation, /Ask or act/);
assert.doesNotMatch(conversation, /data-augnes-primary-action/);
assert.doesNotMatch(
  conversation,
  /\blocalStorage\b|\bsessionStorage\b|\bindexedDB\b|\bfetch\s*\(/,
);

assert.match(blankState, /surface\.open_current_action/);
assert.match(blankState, /view\.primary_action\?\.kind === "link"/);
assert.match(blankState, /window\.location\.assign\(exactDestination\)/);
assert.doesNotMatch(
  blankState,
  /interaction[\s\S]{0,240}(?:choose\(|activate\(|mutate\()/,
);

assert.match(detail, /selectNextSelectedWorkCandidateV01/);
assert.match(
  detail,
  /input\.onSelectedCandidateChange\(\s*next\.candidate\.candidate_id/,
);
assert.match(detail, /input\.onRelationshipQuestionChange\(question\.question_key\)/);
assert.match(detail, /relationship\.select_question/);
assert.match(detail, /input\.advancedReviewRef\.current\.open = true/);
assert.match(detail, /input\.advancedReviewSummaryRef\.current\.focus\(\)/);
assert.match(detail, /window\.location\.assign\(input\.proposalInspectorHref\)/);
assert.match(
  detail,
  /decisionPreparationRef\.current\?\.prepareApplying/,
);
assert.match(
  detail,
  /transitionPreparationRef\.current\?\.preparePreview/,
);
assert.match(
  detail,
  /transitionPreviewAvailability\?\.scope_key ===\s*transitionPreviewOwnerScopeKey/,
  "Transition preparation availability must be bound to the exact current owner scope",
);
assert.match(detail, /onCurrentFocusCapabilityChange/);
assert.match(detail, /ownerFocusCapability/);
assert.match(detail, /owner_focus_identity/);
assert.match(
  detail,
  /decisionFocusOwnerScopeKey[\s\S]{0,320}strategicActionsAvailable/,
  "strategically blocked Decision UI must not publish a focus-owner scope",
);
assert.match(
  detail,
  /decisionPreparationRef\.current\s*\?\s*decisionCurrentFocusCapability\s*:\s*null/,
  "an absent Decision owner ref must fail closed",
);
assert.match(
  detail,
  /ownerFocusCapability\.owner_focus_identity/,
  "owner-local focus-stage identity must affect the registered capability",
);
assert.doesNotMatch(
  detail,
  /timeline\.current_position\.primary_action_owner !== "none" &&\s*!input\.ownerBusy/,
  "PC2 owner identity alone must not advertise a focusable current action",
);
assert.doesNotMatch(detail, /querySelector|querySelectorAll|document\./);
assert.doesNotMatch(detail, /\bfetch\s*\(/);

assert.match(decision, /ReviewDecisionPreparationHandleV01/);
assert.match(decision, /requestedDecision !== applyingDecision/);
assert.match(decision, /applyReviewDecisionSelectionV01/);
assert.match(decision, /rationaleBoundDecision/);
assert.match(decision, /decisionControlRef\.current\?\.focus\(\)/);
const prepareDecisionBody =
  decision.match(
    /prepareApplying:\s*\(requestedDecision\) => \{([\s\S]*?)\n\s*\},\n\s*getCurrentFocusCapability/,
  )?.[1] ?? "";
assert.ok(prepareDecisionBody.length > 0);
assert.doesNotMatch(prepareDecisionBody, /onSubmit|submitDecision|fetch/);

assert.match(transition, /SemanticTransitionPreparationHandleV01/);
assert.match(transition, /preparePreview,[\s\S]*getCurrentFocusCapability/);
assert.match(transition, /confirmationButtonRef/);
assert.match(transition, /applyButtonRef/);
assert.match(transition, /onCurrentFocusCapabilityChange/);
assert.match(transition, /method:\s*"GET"/);
assert.match(transition, /requestInFlight\.current/);
assert.match(transition, /requestIsCurrent\(requestGeneration\)/);
assert.match(
  transition,
  /project remains unchanged, and confirmation was not performed/,
);
assert.equal(
  (transition.match(/method:\s*"GET"/g) ?? []).length,
  1,
  "the owner retains exactly one preview GET path",
);
assert.equal(
  (transition.match(/method:\s*"POST"/g) ?? []).length,
  2,
  "existing confirmation and apply POST paths remain owner-owned and unchanged",
);

assert.match(owner, /DESCRIPTOR_KEYS/);
assert.match(owner, /containsFunctionV01/);
assert.match(owner, /actionPolicyV01/);
assert.match(owner, /ledger\.consumed_plan_ids\.add\(plan\.plan_id\)/);
assert.match(owner, /ledger\.in_flight_plan_id !== null/);
assert.match(owner, /read_current_binding/);
assert.match(owner, /result\.durable_state_changed !== false/);
assert.doesNotMatch(
  owner,
  /\blocalStorage\b|\bsessionStorage\b|\bindexedDB\b|\bfetch\s*\(|openai|anthropic/i,
);

assert.match(types, /browser_action_capability_snapshot\.v0\.1/);
assert.match(types, /guidebrief_interaction_plan\.v0\.1/);
assert.match(types, /guidebrief_interaction_outcome\.v0\.1/);
assert.match(types, /durable_state_changed:\s*false/);
assert.match(types, /makes_decision:\s*false/);
assert.match(types, /authorizes_transition:\s*false/);
assert.match(types, /applies_transition:\s*false/);
assert.match(types, /performs_external_action:\s*false/);
assert.doesNotMatch(types, /callback|selector|endpoint|http_method|request_body/);

console.log(
  "vNext GuideBrief bounded Browser interaction component and owner contracts passed.",
);
