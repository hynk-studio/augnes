import {
  normalizeGuideBriefConversationQuestionV01,
  routeGuideBriefConversationQuestionV01,
} from "@/lib/vnext/guide-brief/guide-brief-conversation-plan";
import {
  BROWSER_ACTION_CAPABILITY_SNAPSHOT_VERSION_V01,
  BROWSER_ACTION_CAPABILITY_VERSION_V01,
  GUIDE_BRIEF_INTERACTION_OUTCOME_VERSION_V01,
  GUIDE_BRIEF_INTERACTION_PLAN_VERSION_V01,
  GUIDE_BRIEF_INTERACTION_REQUEST_VERSION_V01,
  type BrowserActionCapabilitySnapshotInputV01,
  type BrowserActionCapabilitySnapshotV01,
  type BrowserActionCapabilityV01,
  type BrowserActionConfirmationPolicyV01,
  type BrowserActionEffectClassV01,
  type BrowserActionKeyV01,
  type BrowserActionOwnerV01,
  type BrowserActionRouteKeyV01,
  type GuideBriefInteractionAdapterV01,
  type GuideBriefInteractionDispositionV01,
  type GuideBriefInteractionExecutionLedgerV01,
  type GuideBriefInteractionOutcomeV01,
  type GuideBriefInteractionPlanStatusV01,
  type GuideBriefInteractionPlanV01,
  type GuideBriefInteractionRequestInputV01,
  type GuideBriefInteractionRequestV01,
} from "@/types/vnext/guide-brief-interaction";
import { GUIDE_BRIEF_CONVERSATION_MAX_QUESTION_LENGTH_V01 } from "@/types/vnext/guide-brief-conversation";

const ACTION_KEYS = new Set<BrowserActionKeyV01>([
  "selected_work.select_next_candidate",
  "relationship.select_question",
  "surface.open_current_action",
  "panel.open_advanced_review",
  "inspector.open_selected_work",
  "decision.prepare_applying",
  "transition.prepare_preview",
]);
const OWNERS = new Set<BrowserActionOwnerV01>([
  "selected_candidate_surface",
  "pc3_relationship_surface",
  "pc2_current_action_surface",
  "advanced_review_surface",
  "inspector_surface",
  "review_decision_form",
  "semantic_transition_actions",
]);
const EFFECT_CLASSES = new Set<BrowserActionEffectClassV01>([
  "read",
  "navigation",
  "ui_selection",
  "prepare",
]);
const CONFIRMATION_POLICIES = new Set<BrowserActionConfirmationPolicyV01>([
  "immediate_current_scope",
  "owner_preparation_only",
  "read_only_owner_preview",
]);
const DESCRIPTOR_KEYS = new Set([
  "capability_version",
  "action_key",
  "target_handle",
  "public_label",
  "public_effect_preview",
  "owner",
  "effect_class",
  "availability",
  "unavailable_reason",
  "interaction_scope_key",
  "owner_actionability_identity",
  "confirmation_policy",
  "destination",
  "may_propose",
  "may_execute_immediately",
  "route_key",
  "target_scope",
  "authority",
]);
const TARGET_SCOPE_KEYS = new Set([
  "workspace_id",
  "project_id",
  "proposal_id",
  "proposal_fingerprint",
  "candidate_id",
  "candidate_fingerprint",
]);
const DESCRIPTOR_AUTHORITY_KEYS = new Set([
  "projection_only",
  "durable",
  "semantic_authority",
  "transition_authority",
  "execution_authority",
  "external_action_authority",
]);
const FORBIDDEN_DESCRIPTOR_KEYS = new Set([
  "callback",
  "endpoint",
  "method",
  "body",
  "selector",
  "nonce",
  "credential",
  "provider",
  "api_key",
  "cookie",
]);
const RELATIONSHIP_ROUTE_KEYS = new Set<BrowserActionRouteKeyV01>([
  "relationship_support_and_source",
  "relationship_candidate_and_decision",
  "relationship_blocker_and_conflict",
  "relationship_decision_and_project_change",
  "relationship_project_change_and_later_outcome",
]);
const MAX_PUBLIC_TEXT_V01 = 280;

const AUTHORITY = {
  projection_only: true,
  durable: false,
  makes_decision: false,
  authorizes_transition: false,
  applies_transition: false,
  executes_semantic_mutation: false,
  performs_external_action: false,
  calls_provider: false,
} as const;

const SNAPSHOT_AUTHORITY = {
  projection_only: true,
  rebuildable: true,
  persisted: false,
  calls_provider: false,
  performs_external_action: false,
} as const;

const ACTION_PHRASES: Array<{
  route_key: BrowserActionRouteKeyV01;
  phrases: string[];
}> = [
  {
    route_key: "next_candidate",
    phrases: [
      "show the next change",
      "review the next change",
      "move to the next unresolved change",
    ],
  },
  {
    route_key: "relationship_support_and_source",
    phrases: [
      "show the source connection",
      "show what supports this",
      "show what supports this suggestion",
    ],
  },
  {
    route_key: "relationship_blocker_and_conflict",
    phrases: ["show the blocker"],
  },
  {
    route_key: "relationship_candidate_and_decision",
    phrases: ["show the decision connection"],
  },
  {
    route_key: "relationship_decision_and_project_change",
    phrases: ["show the project change connection"],
  },
  {
    route_key: "relationship_project_change_and_later_outcome",
    phrases: ["show the later outcome"],
  },
  {
    route_key: "current_action",
    phrases: [
      "take me to the current action",
      "show what i should do next",
    ],
  },
  {
    route_key: "advanced_review",
    phrases: ["open advanced review"],
  },
  {
    route_key: "selected_work_inspector",
    phrases: ["open exact details", "show the exact source"],
  },
  {
    route_key: "decision_accept",
    phrases: ["prepare an accept decision", "prepare the accept decision"],
  },
  {
    route_key: "decision_supersede",
    phrases: [
      "prepare a replace decision",
      "prepare a supersede decision",
    ],
  },
  {
    route_key: "decision_retract",
    phrases: [
      "prepare a remove decision",
      "prepare a retract decision",
    ],
  },
  {
    route_key: "transition_preview",
    phrases: [
      "show what would change before applying",
      "review the impact",
    ],
  },
];

const MUTATION_OR_ARBITRARY_REQUEST =
  /^(?:apply this|confirm this|save the decision|start codex|resume work|activate this project|merge the pr|open (?:an )?arbitrary url|click the (?:first|second|third|fourth|\d+) button|run this api call)$/u;

export function normalizeGuideBriefInteractionUtteranceV01(
  utterance: string,
): string {
  return normalizeGuideBriefConversationQuestionV01(utterance);
}

export function createOpaqueGuideBriefInteractionTargetHandleV01(
  parts: readonly string[],
): string {
  return `guidebrief-target:${hashV01(stableCanonicalV01(parts))}`;
}

export function buildBrowserActionCapabilitySnapshotV01(
  input: BrowserActionCapabilitySnapshotInputV01,
): BrowserActionCapabilitySnapshotV01 {
  const context = boundedContextV01(input.context);
  validateContextV01(context);
  const identityPairs = new Set<string>();
  const targetHandles = new Set<string>();
  for (const capability of input.capabilities) {
    validateCapabilityV01(capability, context);
    const pair = `${capability.action_key}\u0000${capability.target_handle}`;
    if (identityPairs.has(pair) || targetHandles.has(capability.target_handle)) {
      contractErrorV01("guidebrief_interaction_duplicate_action_key_target");
    }
    identityPairs.add(pair);
    targetHandles.add(capability.target_handle);
  }
  const capabilities = input.capabilities
    .map(cloneCapabilityV01)
    .sort((left, right) =>
      compareCodeUnitsV01(
        `${left.action_key}\u0000${left.target_handle}`,
        `${right.action_key}\u0000${right.target_handle}`,
      )
    );
  const material = {
    context,
    capabilities,
  };
  return deepFreezeV01({
    snapshot_version: BROWSER_ACTION_CAPABILITY_SNAPSHOT_VERSION_V01,
    scope_key: context.pc4_scope_key,
    context,
    capabilities,
    fingerprint: `guidebrief-capability-snapshot:${hashV01(
      stableCanonicalV01(material),
    )}`,
    authority: SNAPSHOT_AUTHORITY,
  });
}

export function buildGuideBriefInteractionRequestV01(
  input: GuideBriefInteractionRequestInputV01,
): GuideBriefInteractionRequestV01 {
  if (
    !requiredTextV01(input.request_id) ||
    input.raw_utterance.length >
      GUIDE_BRIEF_CONVERSATION_MAX_QUESTION_LENGTH_V01
  ) {
    contractErrorV01("guidebrief_interaction_request_invalid");
  }
  const normalized = normalizeGuideBriefInteractionUtteranceV01(
    input.raw_utterance,
  );
  const routing = classifyCompleteUtteranceV01(
    normalized,
    input.scope_key,
    input.conversation_context,
  );

  return {
    request_version: GUIDE_BRIEF_INTERACTION_REQUEST_VERSION_V01,
    request_id: input.request_id,
    raw_utterance: input.raw_utterance,
    normalized_utterance: normalized,
    classification: routing.classification,
    pc4_intent: routing.pc4_intent,
    candidate_route_keys: routing.action_routes,
    scope_key: input.scope_key,
    capability_snapshot_fingerprint:
      input.capability_snapshot_fingerprint,
    previous_turn_anchor: input.previous_turn_anchor,
    ephemeral_only: true,
  };
}

export function compileGuideBriefInteractionPlanV01(input: {
  request: GuideBriefInteractionRequestV01;
  snapshot: BrowserActionCapabilitySnapshotV01;
}): GuideBriefInteractionPlanV01 {
  const { request, snapshot } = input;
  if (
    request.scope_key !== snapshot.scope_key ||
    request.capability_snapshot_fingerprint !== snapshot.fingerprint
  ) {
    return planV01({
      request,
      status: "stale",
      disposition: "stale",
      publicPreview:
        "The current work changed. Submit the request again in the refreshed view.",
    });
  }
  if (request.classification === "question") {
    return planV01({
      request,
      status: "resolved",
      disposition: "answer_only",
      owner: "pc4",
      publicPreview:
        "Use the current source-grounded GuideBrief explanation.",
    });
  }
  if (
    request.classification === "mixed" ||
    request.classification === "ambiguous"
  ) {
    return planV01({
      request,
      status: "ambiguous",
      disposition: "ambiguous",
      publicPreview:
        "Ask one question or request one supported Browser action at a time.",
    });
  }
  if (request.classification === "unsupported") {
    return planV01({
      request,
      status: "unsupported",
      disposition: "unsupported",
      publicPreview:
        "That request is outside the bounded current-work interaction family.",
    });
  }

  const route = request.candidate_route_keys[0] ?? null;
  const matches = snapshot.capabilities.filter((capability) =>
    route === "relationship_any"
      ? RELATIONSHIP_ROUTE_KEYS.has(capability.route_key)
      : capability.route_key === route
  );
  if (matches.length > 1) {
    return planV01({
      request,
      status: "ambiguous",
      disposition: "ambiguous",
      publicPreview:
        "More than one current action matches. Choose one supported action.",
    });
  }
  const capability = matches[0] ?? null;
  if (!capability || !capability.may_propose) {
    return planV01({
      request,
      status: "unavailable",
      disposition: "blocked",
      publicPreview:
        "That action is not available from the exact current owner.",
    });
  }
  if (capability.availability === "blocked") {
    return planForCapabilityV01(
      request,
      capability,
      "blocked",
      "blocked",
      capability.unavailable_reason ??
        "The current action owner is blocked.",
    );
  }
  if (
    capability.availability === "unavailable" ||
    !capability.may_execute_immediately
  ) {
    return planForCapabilityV01(
      request,
      capability,
      "unavailable",
      "blocked",
      capability.unavailable_reason ??
        "The current action owner is unavailable.",
    );
  }
  return planForCapabilityV01(
    request,
    capability,
    "resolved",
    dispositionForCapabilityV01(capability),
    capability.public_effect_preview,
  );
}

export function createGuideBriefInteractionExecutionLedgerV01():
  GuideBriefInteractionExecutionLedgerV01 {
  return {
    consumed_plan_ids: new Set<string>(),
    in_flight_plan_id: null,
  };
}

export async function executeGuideBriefInteractionPlanV01(input: {
  plan: GuideBriefInteractionPlanV01;
  current_snapshot: BrowserActionCapabilitySnapshotV01;
  adapters: GuideBriefInteractionAdapterV01[];
  ledger: GuideBriefInteractionExecutionLedgerV01;
  read_current_binding: () => {
    scope_key: string;
    capability_snapshot_fingerprint: string;
  };
}): Promise<GuideBriefInteractionOutcomeV01> {
  const { plan, current_snapshot: snapshot, adapters, ledger } = input;
  const before = input.read_current_binding();
  if (
    plan.status !== "resolved" ||
    plan.disposition === "answer_only" ||
    !plan.action_key ||
    !plan.target_handle ||
    !plan.owner ||
    plan.owner === "pc4" ||
    !plan.effect_class ||
    plan.scope_key !== snapshot.scope_key ||
    plan.capability_snapshot_fingerprint !== snapshot.fingerprint ||
    before.scope_key !== plan.scope_key ||
    before.capability_snapshot_fingerprint !==
      plan.capability_snapshot_fingerprint
  ) {
    return outcomeV01(
      plan,
      plan.status === "unsupported" ? "unsupported" : "stale",
      plan.status === "unsupported"
        ? plan.public_preview
        : "The current work changed before this action could run.",
      before,
    );
  }
  const capabilities = snapshot.capabilities.filter(
    (capability) =>
      capability.action_key === plan.action_key &&
      capability.target_handle === plan.target_handle,
  );
  const capability = capabilities.length === 1 ? capabilities[0]! : null;
  if (
    !capability ||
    capability.owner !== plan.owner ||
    capability.effect_class !== plan.effect_class ||
    capability.confirmation_policy !== plan.confirmation_policy ||
    capability.availability !== "available" ||
    !capability.may_execute_immediately
  ) {
    return outcomeV01(
      plan,
      "stale",
      "The registered current action no longer matches this plan.",
      before,
    );
  }
  const matchingAdapters = adapters.filter(
    (adapter) =>
      adapter.action_key === capability.action_key &&
      adapter.target_handle === capability.target_handle,
  );
  const adapter = matchingAdapters.length === 1 ? matchingAdapters[0]! : null;
  if (
    !adapter ||
    adapter.owner !== capability.owner ||
    adapter.effect_class !== capability.effect_class
  ) {
    return outcomeV01(
      plan,
      "blocked",
      "The exact current action owner is unavailable.",
      before,
    );
  }
  if (
    ledger.consumed_plan_ids.has(plan.plan_id) ||
    ledger.in_flight_plan_id !== null
  ) {
    return outcomeV01(
      plan,
      "blocked",
      "This single-use action was already started.",
      before,
    );
  }

  ledger.consumed_plan_ids.add(plan.plan_id);
  ledger.in_flight_plan_id = plan.plan_id;
  try {
    const result = await adapter.invoke();
    const after = input.read_current_binding();
    if (
      after.scope_key !== before.scope_key ||
      after.capability_snapshot_fingerprint !==
        before.capability_snapshot_fingerprint
    ) {
      return outcomeV01(
        plan,
        "stale",
        "The current work changed while the owner was responding. The prior result was not retained.",
        after,
      );
    }
    if (result.durable_state_changed !== false) {
      return outcomeV01(
        plan,
        "failed",
        "The owner result exceeded this read-only interaction boundary.",
        after,
      );
    }
    return {
      ...outcomeV01(
        plan,
        result.status,
        result.public_observed_effect,
        after,
      ),
      exact_result_ref: result.exact_result_ref,
    };
  } catch {
    const after = input.read_current_binding();
    return outcomeV01(
      plan,
      "failed",
      "The current action owner could not complete the bounded interaction. Nothing was retried.",
      after,
    );
  } finally {
    if (ledger.in_flight_plan_id === plan.plan_id) {
      ledger.in_flight_plan_id = null;
    }
  }
}

function exactActionRouteKeysV01(
  normalized: string,
): Array<BrowserActionRouteKeyV01 | "relationship_any"> {
  const matches = new Set<
    BrowserActionRouteKeyV01 | "relationship_any"
  >();
  if (normalized === "show the connection") {
    matches.add("relationship_any");
  }
  for (const family of ACTION_PHRASES) {
    if (
      family.phrases.some((phrase) => normalized === phrase)
    ) {
      matches.add(family.route_key);
    }
  }
  return [...matches];
}

function classifyCompleteUtteranceV01(
  normalized: string,
  scopeKey: string,
  context: GuideBriefInteractionRequestInputV01["conversation_context"],
): {
  classification: GuideBriefInteractionRequestV01["classification"];
  pc4_intent: GuideBriefInteractionRequestV01["pc4_intent"];
  action_routes: Array<
    BrowserActionRouteKeyV01 | "relationship_any"
  >;
} {
  if (!normalized) {
    return {
      classification: "unsupported",
      pc4_intent: null,
      action_routes: [],
    };
  }
  const segments = normalized.split(/\s+(?:and|then)\s+/u);
  const actionRoutes: Array<
    BrowserActionRouteKeyV01 | "relationship_any"
  > = [];
  const questionIntents: Array<
    NonNullable<GuideBriefInteractionRequestV01["pc4_intent"]>
  > = [];
  let containsUnsupported = false;
  let containsAmbiguous = false;

  for (const segment of segments) {
    if (!segment || MUTATION_OR_ARBITRARY_REQUEST.test(segment)) {
      containsUnsupported = true;
      continue;
    }
    const exactActions = exactActionRouteKeysV01(segment);
    if (exactActions.length === 1) {
      actionRoutes.push(exactActions[0]!);
      continue;
    }
    if (exactActions.length > 1) {
      containsAmbiguous = true;
      continue;
    }
    const route = routeGuideBriefConversationQuestionV01({
      question: segment,
      scope_key: scopeKey,
      conversation_context: context,
    });
    if (route.status === "supported" && route.intent) {
      questionIntents.push(route.intent);
    } else if (route.status === "ambiguous") {
      containsAmbiguous = true;
    } else {
      containsUnsupported = true;
    }
  }

  if (containsUnsupported) {
    return {
      classification: "unsupported",
      pc4_intent: null,
      action_routes: [],
    };
  }
  if (
    containsAmbiguous ||
    actionRoutes.length > 1 ||
    questionIntents.length > 1
  ) {
    return {
      classification: "ambiguous",
      pc4_intent: null,
      action_routes: [...new Set(actionRoutes)],
    };
  }
  if (actionRoutes.length === 1 && questionIntents.length === 1) {
    return {
      classification: "mixed",
      pc4_intent: questionIntents[0]!,
      action_routes: actionRoutes,
    };
  }
  if (actionRoutes.length === 1) {
    return {
      classification: "action",
      pc4_intent: null,
      action_routes: actionRoutes,
    };
  }
  if (questionIntents.length === 1) {
    return {
      classification: "question",
      pc4_intent: questionIntents[0]!,
      action_routes: [],
    };
  }
  return {
    classification: "unsupported",
    pc4_intent: null,
    action_routes: [],
  };
}

function validateContextV01(
  context: BrowserActionCapabilitySnapshotInputV01["context"],
): void {
  if (
    !requiredTextV01(context.pc4_scope_key) ||
    !requiredTextV01(context.project_context) ||
    (context.workspace_id === null) !== (context.project_id === null) ||
    (context.proposal_id === null) !==
      (context.proposal_fingerprint === null) ||
    (context.candidate_id === null) !==
      (context.candidate_fingerprint === null) ||
    (context.candidate_id !== null && context.proposal_id === null)
  ) {
    contractErrorV01("guidebrief_interaction_context_invalid");
  }
}

function validateCapabilityV01(
  capability: BrowserActionCapabilityV01,
  context: BrowserActionCapabilitySnapshotInputV01["context"],
): void {
  if (
    Object.keys(capability).some((key) => !DESCRIPTOR_KEYS.has(key)) ||
    containsFunctionV01(capability) ||
    containsForbiddenDescriptorKeyV01(capability) ||
    Object.keys(capability.target_scope).some(
      (key) => !TARGET_SCOPE_KEYS.has(key),
    ) ||
    Object.keys(capability.authority).some(
      (key) => !DESCRIPTOR_AUTHORITY_KEYS.has(key),
    )
  ) {
    contractErrorV01(
      "guidebrief_interaction_forbidden_descriptor_material",
    );
  }
  if (
    capability.capability_version !==
      BROWSER_ACTION_CAPABILITY_VERSION_V01 ||
    !ACTION_KEYS.has(capability.action_key) ||
    !OWNERS.has(capability.owner) ||
    !EFFECT_CLASSES.has(capability.effect_class) ||
    !CONFIRMATION_POLICIES.has(capability.confirmation_policy) ||
    !requiredTextV01(capability.target_handle) ||
    !requiredTextV01(capability.public_label) ||
    !requiredTextV01(capability.public_effect_preview) ||
    !requiredTextV01(capability.owner_actionability_identity) ||
    publicTextV01(capability.public_label) !==
      capability.public_label.trim().replace(/\s+/gu, " ") ||
    publicTextV01(capability.public_effect_preview) !==
      capability.public_effect_preview.trim().replace(/\s+/gu, " ") ||
    (capability.unavailable_reason !== null &&
      publicTextV01(capability.unavailable_reason) !==
        capability.unavailable_reason.trim().replace(/\s+/gu, " ")) ||
    capability.authority?.projection_only !== true ||
    capability.authority.durable !== false ||
    capability.authority.semantic_authority !== false ||
    capability.authority.transition_authority !== false ||
    capability.authority.execution_authority !== false ||
    capability.authority.external_action_authority !== false ||
    typeof capability.may_propose !== "boolean" ||
    typeof capability.may_execute_immediately !== "boolean" ||
    !["available", "blocked", "unavailable"].includes(
      capability.availability,
    ) ||
    capability.interaction_scope_key !== context.pc4_scope_key
  ) {
    contractErrorV01("guidebrief_interaction_capability_invalid");
  }
  const exactPolicy = actionPolicyV01(capability.action_key);
  if (
    capability.owner !== exactPolicy.owner ||
    capability.effect_class !== exactPolicy.effect_class ||
    capability.confirmation_policy !==
      exactPolicy.confirmation_policy ||
    !exactPolicy.route_keys.has(capability.route_key)
  ) {
    contractErrorV01("guidebrief_interaction_capability_policy_invalid");
  }
  if (
    capability.destination !== null &&
    !isRegisteredLocalDestinationV01(capability.destination)
  ) {
    contractErrorV01(
      "guidebrief_interaction_forbidden_descriptor_material",
    );
  }
  const target = capability.target_scope;
  if (
    target.workspace_id !== context.workspace_id ||
    target.project_id !== context.project_id ||
    target.proposal_id !== context.proposal_id ||
    target.proposal_fingerprint !== context.proposal_fingerprint
  ) {
    contractErrorV01("guidebrief_interaction_cross_scope_target");
  }
  const nextCandidate =
    capability.action_key === "selected_work.select_next_candidate";
  if (
    !nextCandidate &&
    (target.candidate_id !== context.candidate_id ||
      target.candidate_fingerprint !== context.candidate_fingerprint)
  ) {
    contractErrorV01("guidebrief_interaction_cross_candidate_target");
  }
  if (
    nextCandidate &&
    (!target.candidate_id ||
      !target.candidate_fingerprint ||
      target.candidate_id === context.candidate_id)
  ) {
    contractErrorV01("guidebrief_interaction_next_candidate_invalid");
  }
  if (
    capability.action_key === "relationship.select_question" &&
    !RELATIONSHIP_ROUTE_KEYS.has(capability.route_key)
  ) {
    contractErrorV01("guidebrief_interaction_relationship_route_invalid");
  }
  if (
    capability.action_key === "decision.prepare_applying" &&
    capability.availability === "available"
  ) {
    const routeKind = capability.route_key.replace("decision_", "");
    if (
      routeKind !== context.owner_state.decision_applying_kind ||
      !context.owner_state.decision_eligible
    ) {
      contractErrorV01("guidebrief_interaction_decision_binding_invalid");
    }
  }
  if (
    capability.action_key === "transition.prepare_preview" &&
    capability.availability === "available" &&
    !context.owner_state.transition_preview_available
  ) {
    contractErrorV01("guidebrief_interaction_transition_binding_invalid");
  }
}

function cloneCapabilityV01(
  capability: BrowserActionCapabilityV01,
): BrowserActionCapabilityV01 {
  return structuredClone(capability);
}

function boundedContextV01(
  context: BrowserActionCapabilitySnapshotInputV01["context"],
): BrowserActionCapabilitySnapshotInputV01["context"] {
  return {
    pc4_scope_key: context.pc4_scope_key,
    workspace_id: context.workspace_id,
    project_id: context.project_id,
    project_context: context.project_context,
    active_project_id: context.active_project_id,
    proposal_id: context.proposal_id,
    proposal_fingerprint: context.proposal_fingerprint,
    candidate_id: context.candidate_id,
    candidate_fingerprint: context.candidate_fingerprint,
    pc2: context.pc2 ? { ...context.pc2 } : null,
    pc3: context.pc3 ? { ...context.pc3 } : null,
    owner_state: { ...context.owner_state },
  };
}

function actionPolicyV01(actionKey: BrowserActionKeyV01): {
  owner: BrowserActionOwnerV01;
  effect_class: BrowserActionEffectClassV01;
  confirmation_policy: BrowserActionConfirmationPolicyV01;
  route_keys: ReadonlySet<BrowserActionRouteKeyV01>;
} {
  switch (actionKey) {
    case "selected_work.select_next_candidate":
      return {
        owner: "selected_candidate_surface",
        effect_class: "ui_selection",
        confirmation_policy: "immediate_current_scope",
        route_keys: new Set(["next_candidate"]),
      };
    case "relationship.select_question":
      return {
        owner: "pc3_relationship_surface",
        effect_class: "ui_selection",
        confirmation_policy: "immediate_current_scope",
        route_keys: RELATIONSHIP_ROUTE_KEYS,
      };
    case "surface.open_current_action":
      return {
        owner: "pc2_current_action_surface",
        effect_class: "navigation",
        confirmation_policy: "immediate_current_scope",
        route_keys: new Set(["current_action"]),
      };
    case "panel.open_advanced_review":
      return {
        owner: "advanced_review_surface",
        effect_class: "navigation",
        confirmation_policy: "immediate_current_scope",
        route_keys: new Set(["advanced_review"]),
      };
    case "inspector.open_selected_work":
      return {
        owner: "inspector_surface",
        effect_class: "navigation",
        confirmation_policy: "immediate_current_scope",
        route_keys: new Set(["selected_work_inspector"]),
      };
    case "decision.prepare_applying":
      return {
        owner: "review_decision_form",
        effect_class: "prepare",
        confirmation_policy: "owner_preparation_only",
        route_keys: new Set([
          "decision_accept",
          "decision_supersede",
          "decision_retract",
        ]),
      };
    case "transition.prepare_preview":
      return {
        owner: "semantic_transition_actions",
        effect_class: "read",
        confirmation_policy: "read_only_owner_preview",
        route_keys: new Set(["transition_preview"]),
      };
  }
}

function deepFreezeV01<T>(value: T): T {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const nested of Object.values(value as Record<string, unknown>)) {
      deepFreezeV01(nested);
    }
  }
  return value;
}

function dispositionForCapabilityV01(
  capability: BrowserActionCapabilityV01,
): GuideBriefInteractionDispositionV01 {
  if (capability.action_key === "transition.prepare_preview") {
    return "execute_owner_read";
  }
  if (capability.effect_class === "prepare") {
    return "prepare_owner_handoff";
  }
  return "execute_ui_action";
}

function planForCapabilityV01(
  request: GuideBriefInteractionRequestV01,
  capability: BrowserActionCapabilityV01,
  status: GuideBriefInteractionPlanStatusV01,
  disposition: GuideBriefInteractionDispositionV01,
  publicPreview: string,
): GuideBriefInteractionPlanV01 {
  return planV01({
    request,
    status,
    disposition,
    capability,
    publicPreview,
  });
}

function planV01(input: {
  request: GuideBriefInteractionRequestV01;
  status: GuideBriefInteractionPlanStatusV01;
  disposition: GuideBriefInteractionDispositionV01;
  capability?: BrowserActionCapabilityV01;
  owner?: "pc4";
  publicPreview: string;
}): GuideBriefInteractionPlanV01 {
  const material = {
    request_id: input.request.request_id,
    scope_key: input.request.scope_key,
    capability_snapshot_fingerprint:
      input.request.capability_snapshot_fingerprint,
    status: input.status,
    disposition: input.disposition,
    action_key: input.capability?.action_key ?? null,
    target_handle: input.capability?.target_handle ?? null,
    owner: input.capability?.owner ?? input.owner ?? null,
    effect_class: input.capability?.effect_class ?? null,
    confirmation_policy:
      input.capability?.confirmation_policy ?? null,
    public_label: input.capability?.public_label ?? null,
    public_preview: publicTextV01(input.publicPreview),
  };
  const fingerprint = `guidebrief-interaction-plan:${hashV01(
    stableCanonicalV01(material),
  )}`;
  return {
    plan_version: GUIDE_BRIEF_INTERACTION_PLAN_VERSION_V01,
    plan_id: `${input.request.request_id}:${fingerprint}`,
    plan_fingerprint: fingerprint,
    ...material,
    single_use_required: true,
    authority: AUTHORITY,
  };
}

function outcomeV01(
  plan: GuideBriefInteractionPlanV01,
  status: GuideBriefInteractionOutcomeV01["status"],
  publicObservedEffect: string,
  refreshed: {
    scope_key: string;
    capability_snapshot_fingerprint: string;
  },
): GuideBriefInteractionOutcomeV01 {
  return {
    outcome_version: GUIDE_BRIEF_INTERACTION_OUTCOME_VERSION_V01,
    plan_id: plan.plan_id,
    status,
    public_observed_effect: publicTextV01(publicObservedEffect),
    durable_state_changed: false,
    refreshed_scope_key: refreshed.scope_key,
    refreshed_capability_snapshot_fingerprint:
      refreshed.capability_snapshot_fingerprint,
    next_supported_action_suggestions: [],
    exact_result_ref: null,
    authority: AUTHORITY,
  };
}

function containsFunctionV01(value: unknown): boolean {
  if (typeof value === "function") return true;
  if (Array.isArray(value)) return value.some(containsFunctionV01);
  return Boolean(
    value &&
      typeof value === "object" &&
      Object.values(value as Record<string, unknown>).some(
        containsFunctionV01,
      ),
  );
}

function containsForbiddenDescriptorKeyV01(value: unknown): boolean {
  if (Array.isArray(value)) {
    return value.some(containsForbiddenDescriptorKeyV01);
  }
  if (!value || typeof value !== "object") return false;
  return Object.entries(value as Record<string, unknown>).some(
    ([key, nested]) =>
      FORBIDDEN_DESCRIPTOR_KEYS.has(key.toLocaleLowerCase("en-US")) ||
      containsForbiddenDescriptorKeyV01(nested),
  );
}

function isRegisteredLocalDestinationV01(value: string): boolean {
  return (
    value.length > 0 &&
    value.length <= 4096 &&
    (value.startsWith("/") || value.startsWith("#")) &&
    !value.startsWith("//") &&
    !/[\u0000-\u001f\u007f]/u.test(value)
  );
}

function publicTextV01(value: string): string {
  const compact = value
    .replace(
      /(?:[a-z0-9_-]+:)?sha256:[a-f0-9]{64}/giu,
      "exact reference",
    )
    .replace(/\b(?:request|plan|target|snapshot):[a-z0-9:._-]+\b/giu, "")
    .replaceAll("ReviewDecision", "saved decision")
    .replaceAll("StateTransitionReceipt", "project update record")
    .replaceAll("TaskContextPacket", "work context")
    .replace(/\b(?:nonce|TTL|endpoint|HTTP|adapter|registry)\b/giu, "")
    .replace(/[\u0000-\u001f\u007f]/gu, " ")
    .replace(/\s+/gu, " ")
    .trim();
  return compact.length <= MAX_PUBLIC_TEXT_V01
    ? compact
    : `${compact.slice(0, MAX_PUBLIC_TEXT_V01 - 1)}…`;
}

function requiredTextV01(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function contractErrorV01(code: string): never {
  throw new Error(code);
}

function stableCanonicalV01(value: unknown): string {
  return JSON.stringify(canonicalValueV01(value));
}

function canonicalValueV01(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalValueV01);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => compareCodeUnitsV01(left, right))
        .map(([key, nested]) => [key, canonicalValueV01(nested)]),
    );
  }
  return value;
}

function hashV01(value: string): string {
  let high = 0x811c9dc5;
  let low = 0x01000193;
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index);
    high = Math.imul(high ^ code, 0x01000193) >>> 0;
    low = Math.imul(low ^ (code + index), 0x811c9dc5) >>> 0;
  }
  return `${high.toString(16).padStart(8, "0")}${low
    .toString(16)
    .padStart(8, "0")}`;
}

function compareCodeUnitsV01(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}
