import assert from "node:assert/strict";

import {
  buildBrowserActionCapabilitySnapshotV01,
  buildGuideBriefInteractionRequestV01,
  compileGuideBriefInteractionPlanV01,
  createGuideBriefInteractionExecutionLedgerV01,
  executeGuideBriefInteractionPlanV01,
} from "@/lib/vnext/guide-brief/guide-brief-interaction-plan";
import {
  applyReviewDecisionSelectionV01,
  canSubmitReviewDecisionFormV01,
  DEFAULT_DEFER_RATIONALE_V01,
} from "@/components/workbench/semantic-review/review-decision-form-state";
import type {
  BrowserActionCapabilitySnapshotInputV01,
  BrowserActionCapabilityV01,
  GuideBriefInteractionAdapterV01,
} from "@/types/vnext/guide-brief-interaction";

async function main(): Promise<void> {
const fingerprint = (value: string) =>
  `sha256:${value.padEnd(64, value.at(-1) ?? "0").slice(0, 64)}`;

const context: BrowserActionCapabilitySnapshotInputV01["context"] = {
  pc4_scope_key: "guidebrief-conversation-scope:current",
  workspace_id: "workspace-current",
  project_id: "project-current",
  project_context: "current",
  active_project_id: "project-current",
  proposal_id: "proposal-current",
  proposal_fingerprint: fingerprint("a"),
  candidate_id: "candidate-current",
  candidate_fingerprint: fingerprint("b"),
  pc2: {
    current_item_id: "review-focused",
    stage: "review_focused",
    primary_action_owner: "candidate_selection",
    material_identity: "pc2:current",
  },
  pc3: {
    selected_question_key: "support_and_source",
    highlighted_connection_id: "connection-current",
    material_identity: "pc3:current",
  },
  owner_state: {
    busy: false,
    decision_applying_kind: "accept",
    decision_eligible: true,
    transition_preview_available: false,
  },
};

for (const applyingDecision of [
  "accept",
  "supersede",
  "retract",
] as const) {
  const prepared = applyReviewDecisionSelectionV01(
    {
      decision: "defer",
      rationale_summary: DEFAULT_DEFER_RATIONALE_V01,
      rationale_bound_decision: "defer",
      revisit_condition: "Review when exact source material is available.",
    },
    applyingDecision,
  );
  assert.equal(prepared.decision, applyingDecision);
  assert.equal(prepared.rationale_summary, "");
  assert.equal(prepared.rationale_bound_decision, null);
  assert.equal(
    canSubmitReviewDecisionFormV01(prepared, {
      busy: false,
      selected_decision_allowed: true,
    }),
    false,
  );
}
const preservedUserRationale = applyReviewDecisionSelectionV01(
  {
    decision: "defer",
    rationale_summary: "My own exact review note.",
    rationale_bound_decision: "defer",
    revisit_condition: "Review next week.",
  },
  "accept",
);
assert.equal(
  preservedUserRationale.rationale_summary,
  "My own exact review note.",
);
assert.equal(
  preservedUserRationale.rationale_bound_decision,
  null,
  "preserved user text must be explicitly reviewed under the new decision",
);
assert.equal(
  canSubmitReviewDecisionFormV01(preservedUserRationale, {
    busy: false,
    selected_decision_allowed: true,
  }),
  false,
);

const capability = (
  overrides: Partial<BrowserActionCapabilityV01> = {},
): BrowserActionCapabilityV01 => ({
  capability_version: "browser_action_capability.v0.1",
  action_key: "selected_work.select_next_candidate",
  target_handle: "target:next-candidate",
  public_label: "Show the next change",
  public_effect_preview: "Select the exact next unresolved change.",
  owner: "selected_candidate_surface",
  effect_class: "ui_selection",
  availability: "available",
  unavailable_reason: null,
  interaction_scope_key: context.pc4_scope_key,
  owner_actionability_identity: "candidate-selection:available",
  confirmation_policy: "immediate_current_scope",
  destination: "#selected-work-next-candidate",
  may_propose: true,
  may_execute_immediately: true,
  route_key: "next_candidate",
  target_scope: {
    workspace_id: context.workspace_id,
    project_id: context.project_id,
    proposal_id: context.proposal_id,
    proposal_fingerprint: context.proposal_fingerprint,
    candidate_id: "candidate-next",
    candidate_fingerprint: fingerprint("c"),
  },
  authority: {
    projection_only: true,
    durable: false,
    semantic_authority: false,
    transition_authority: false,
    execution_authority: false,
    external_action_authority: false,
  },
  ...overrides,
});

const empty = buildBrowserActionCapabilitySnapshotV01({
  context,
  capabilities: [],
});
assert.equal(empty.capabilities.length, 0);

const blankStateEmpty = buildBrowserActionCapabilitySnapshotV01({
  context: {
    ...context,
    proposal_id: null,
    proposal_fingerprint: null,
    candidate_id: null,
    candidate_fingerprint: null,
    pc2: null,
    pc3: null,
    owner_state: {
      busy: false,
      decision_applying_kind: null,
      decision_eligible: false,
      transition_preview_available: false,
    },
  },
  capabilities: [],
});
assert.equal(blankStateEmpty.capabilities.length, 0);

const one = buildBrowserActionCapabilitySnapshotV01({
  context,
  capabilities: [capability()],
});
assert.equal(one.capabilities.length, 1);
assert.deepEqual(
  buildBrowserActionCapabilitySnapshotV01({
    context,
    capabilities: [capability()],
  }),
  one,
);

assert.throws(
  () =>
    buildBrowserActionCapabilitySnapshotV01({
      context,
      capabilities: [
        capability(),
        capability(),
      ],
    }),
  /guidebrief_interaction_duplicate_action_key/,
);

assert.throws(
  () =>
    buildBrowserActionCapabilitySnapshotV01({
      context,
      capabilities: [
        {
          ...capability(),
          selector: "#unsafe",
        } as BrowserActionCapabilityV01,
      ],
    }),
  /guidebrief_interaction_forbidden_descriptor_material/,
);

const request = buildGuideBriefInteractionRequestV01({
  request_id: "request-1",
  raw_utterance: "Show the next change.",
  scope_key: context.pc4_scope_key,
  capability_snapshot_fingerprint: one.fingerprint,
  previous_turn_anchor: null,
  conversation_context: null,
});
assert.equal(request.classification, "action");

const plan = compileGuideBriefInteractionPlanV01({
  request,
  snapshot: one,
});
assert.equal(plan.status, "resolved");
assert.equal(plan.action_key, "selected_work.select_next_candidate");
assert.equal(plan.disposition, "execute_ui_action");
assert.equal(plan.effect_class, "ui_selection");

const unsupportedRequest = buildGuideBriefInteractionRequestV01({
  request_id: "request-unsupported",
  raw_utterance: "Apply this.",
  scope_key: context.pc4_scope_key,
  capability_snapshot_fingerprint: one.fingerprint,
  previous_turn_anchor: null,
  conversation_context: null,
});
assert.equal(unsupportedRequest.classification, "unsupported");
assert.equal(
  compileGuideBriefInteractionPlanV01({
    request: unsupportedRequest,
    snapshot: one,
  }).status,
  "unsupported",
);

const mixedRequest = buildGuideBriefInteractionRequestV01({
  request_id: "request-mixed",
  raw_utterance: "What is happening now and show the next change.",
  scope_key: context.pc4_scope_key,
  capability_snapshot_fingerprint: one.fingerprint,
  previous_turn_anchor: null,
  conversation_context: null,
});
assert.equal(mixedRequest.classification, "mixed");
assert.equal(
  compileGuideBriefInteractionPlanV01({
    request: mixedRequest,
    snapshot: one,
  }).status,
  "ambiguous",
);

const ambiguousPc4FollowUp = buildGuideBriefInteractionRequestV01({
  request_id: "request-ambiguous-pc4-follow-up",
  raw_utterance: "Why?",
  scope_key: context.pc4_scope_key,
  capability_snapshot_fingerprint: one.fingerprint,
  previous_turn_anchor: null,
  conversation_context: null,
});
assert.equal(
  ambiguousPc4FollowUp.classification,
  "ambiguous",
  "the PC5 dispatcher must preserve PC4's bounded ambiguous follow-up result",
);

const adapterCalls: string[] = [];
const adapter: GuideBriefInteractionAdapterV01 = {
  action_key: "selected_work.select_next_candidate",
  target_handle: "target:next-candidate",
  owner: "selected_candidate_surface",
  effect_class: "ui_selection",
  invoke: async () => {
    adapterCalls.push("invoked");
    return {
      status: "completed",
      public_observed_effect: "The next unresolved change is now selected.",
      durable_state_changed: false,
      exact_result_ref: null,
    };
  },
};
const ledger = createGuideBriefInteractionExecutionLedgerV01();
const current = () => ({
  scope_key: context.pc4_scope_key,
  capability_snapshot_fingerprint: one.fingerprint,
});
const [first, duplicate] = await Promise.all([
  executeGuideBriefInteractionPlanV01({
    plan,
    current_snapshot: one,
    adapters: [adapter],
    ledger,
    read_current_binding: current,
  }),
  executeGuideBriefInteractionPlanV01({
    plan,
    current_snapshot: one,
    adapters: [adapter],
    ledger,
    read_current_binding: current,
  }),
]);
assert.equal(first.status, "completed");
assert.equal(duplicate.status, "blocked");
assert.equal(adapterCalls.length, 1);
assert.equal(first.durable_state_changed, false);
assert.deepEqual(first.authority, {
  projection_only: true,
  durable: false,
  makes_decision: false,
  authorizes_transition: false,
  applies_transition: false,
  executes_semantic_mutation: false,
  performs_external_action: false,
  calls_provider: false,
});
assert.deepEqual(plan.authority, first.authority);

const stale = await executeGuideBriefInteractionPlanV01({
  plan: {
    ...plan,
    plan_id: `${plan.plan_id}:stale`,
    plan_fingerprint: `${plan.plan_fingerprint}:stale`,
  },
  current_snapshot: one,
  adapters: [adapter],
  ledger: createGuideBriefInteractionExecutionLedgerV01(),
  read_current_binding: () => ({
    scope_key: "guidebrief-conversation-scope:changed",
    capability_snapshot_fingerprint: one.fingerprint,
  }),
});
assert.equal(stale.status, "stale");
assert.equal(adapterCalls.length, 1);

assert.equal(Object.isFrozen(one), true);
assert.equal(Object.isFrozen(one.capabilities[0]), true);

const registeredCapability = (
  actionKey: BrowserActionCapabilityV01["action_key"],
  routeKey: BrowserActionCapabilityV01["route_key"],
  capabilityContext = context,
  overrides: Partial<BrowserActionCapabilityV01> = {},
): BrowserActionCapabilityV01 => {
  const policy = {
    "selected_work.select_next_candidate": {
      owner: "selected_candidate_surface",
      effect_class: "ui_selection",
      confirmation_policy: "immediate_current_scope",
    },
    "relationship.select_question": {
      owner: "pc3_relationship_surface",
      effect_class: "ui_selection",
      confirmation_policy: "immediate_current_scope",
    },
    "surface.open_current_action": {
      owner: "pc2_current_action_surface",
      effect_class: "navigation",
      confirmation_policy: "immediate_current_scope",
    },
    "panel.open_advanced_review": {
      owner: "advanced_review_surface",
      effect_class: "navigation",
      confirmation_policy: "immediate_current_scope",
    },
    "inspector.open_selected_work": {
      owner: "inspector_surface",
      effect_class: "navigation",
      confirmation_policy: "immediate_current_scope",
    },
    "decision.prepare_applying": {
      owner: "review_decision_form",
      effect_class: "prepare",
      confirmation_policy: "owner_preparation_only",
    },
    "transition.prepare_preview": {
      owner: "semantic_transition_actions",
      effect_class: "read",
      confirmation_policy: "read_only_owner_preview",
    },
  }[actionKey] as Pick<
    BrowserActionCapabilityV01,
    "owner" | "effect_class" | "confirmation_policy"
  >;
  const next = actionKey === "selected_work.select_next_candidate";
  return {
    capability_version: "browser_action_capability.v0.1",
    action_key: actionKey,
    target_handle: `target:${actionKey}:${routeKey}`,
    public_label: "Current supported interaction",
    public_effect_preview: "Use the exact current owner.",
    ...policy,
    availability: "available",
    unavailable_reason: null,
    interaction_scope_key: capabilityContext.pc4_scope_key,
    owner_actionability_identity: `${actionKey}:available`,
    destination: "#current-owner",
    may_propose: true,
    may_execute_immediately: true,
    route_key: routeKey,
    target_scope: {
      workspace_id: capabilityContext.workspace_id,
      project_id: capabilityContext.project_id,
      proposal_id: capabilityContext.proposal_id,
      proposal_fingerprint: capabilityContext.proposal_fingerprint,
      candidate_id: next
        ? "candidate-next"
        : capabilityContext.candidate_id,
      candidate_fingerprint: next
        ? fingerprint("c")
        : capabilityContext.candidate_fingerprint,
    },
    authority: {
      projection_only: true,
      durable: false,
      semantic_authority: false,
      transition_authority: false,
      execution_authority: false,
      external_action_authority: false,
    },
    ...overrides,
  };
};

const relationshipCapability = registeredCapability(
  "relationship.select_question",
  "relationship_support_and_source",
);
const orderedA = buildBrowserActionCapabilitySnapshotV01({
  context,
  capabilities: [capability(), relationshipCapability],
});
const orderedB = buildBrowserActionCapabilitySnapshotV01({
  context,
  capabilities: [relationshipCapability, capability()],
});
assert.deepEqual(orderedA, orderedB);

for (const invalid of [
  { owner: "" },
  { effect_class: "external_effect" },
  { confirmation_policy: "caller_may_confirm" },
  {
    authority: {
      ...capability().authority,
      semantic_authority: true,
    },
  },
  {
    public_label: `Show sha256:${"a".repeat(64)}`,
  },
] as Array<Record<string, unknown>>) {
  assert.throws(
    () =>
      buildBrowserActionCapabilitySnapshotV01({
        context,
        capabilities: [
          {
            ...capability(),
            ...invalid,
          } as BrowserActionCapabilityV01,
        ],
      }),
    /guidebrief_interaction_capability/,
  );
}

for (const forbidden of [
  { callback: () => undefined },
  { endpoint: "/api/unsafe" },
  { method: "POST" },
  { body: { action: "apply" } },
  { selector: "#third-button" },
  { arbitrary_url: "https://example.com" },
]) {
  assert.throws(
    () =>
      buildBrowserActionCapabilitySnapshotV01({
        context,
        capabilities: [
          {
            ...capability(),
            ...forbidden,
          } as BrowserActionCapabilityV01,
        ],
      }),
    /guidebrief_interaction_forbidden_descriptor_material/,
  );
}
assert.throws(
  () =>
    buildBrowserActionCapabilitySnapshotV01({
      context,
      capabilities: [
        capability({ destination: "https://example.com" }),
      ],
    }),
  /guidebrief_interaction_forbidden_descriptor_material/,
);
for (const nestedForbidden of [
  {
    target_scope: {
      ...capability().target_scope,
      selector: "#unsafe",
    },
  },
  {
    authority: {
      ...capability().authority,
      endpoint: "/api/unsafe",
    },
  },
]) {
  assert.throws(
    () =>
      buildBrowserActionCapabilitySnapshotV01({
        context,
        capabilities: [
          {
            ...capability(),
            ...nestedForbidden,
          } as BrowserActionCapabilityV01,
        ],
      }),
    /guidebrief_interaction_forbidden_descriptor_material/,
  );
}

const blockedSnapshot = buildBrowserActionCapabilitySnapshotV01({
  context,
  capabilities: [
    capability({
      availability: "blocked",
      unavailable_reason: "The current owner is busy.",
      may_execute_immediately: false,
    }),
  ],
});
const blockedRequest = buildGuideBriefInteractionRequestV01({
  request_id: "request-blocked",
  raw_utterance: "Show the next change.",
  scope_key: context.pc4_scope_key,
  capability_snapshot_fingerprint: blockedSnapshot.fingerprint,
  previous_turn_anchor: null,
  conversation_context: null,
});
assert.equal(
  compileGuideBriefInteractionPlanV01({
    request: blockedRequest,
    snapshot: blockedSnapshot,
  }).status,
  "blocked",
);
const unavailableSnapshot = buildBrowserActionCapabilitySnapshotV01({
  context,
  capabilities: [
    capability({
      availability: "unavailable",
      unavailable_reason: "No exact next change is available.",
      may_execute_immediately: false,
    }),
  ],
});
assert.equal(
  compileGuideBriefInteractionPlanV01({
    request: {
      ...blockedRequest,
      request_id: "request-unavailable",
      capability_snapshot_fingerprint: unavailableSnapshot.fingerprint,
    },
    snapshot: unavailableSnapshot,
  }).status,
  "unavailable",
);

const contextSnapshots = (
  variants: Array<
    BrowserActionCapabilitySnapshotInputV01["context"]
  >,
) =>
  variants.map((variant) =>
    buildBrowserActionCapabilitySnapshotV01({
      context: variant,
      capabilities: [],
    }).fingerprint
  );
const materialVariants = contextSnapshots([
  context,
  { ...context, project_id: "project-viewed" },
  {
    ...context,
    project_context: "viewed",
    active_project_id: "project-other",
  },
  {
    ...context,
    proposal_id: "proposal-other",
    proposal_fingerprint: fingerprint("d"),
  },
  {
    ...context,
    candidate_id: "candidate-same-title-other",
    candidate_fingerprint: fingerprint("e"),
  },
  { ...context, candidate_fingerprint: fingerprint("f") },
  {
    ...context,
    pc2: { ...context.pc2!, current_item_id: "decision-recorded" },
  },
  {
    ...context,
    pc2: { ...context.pc2!, primary_action_owner: "decision" },
  },
  {
    ...context,
    pc2: { ...context.pc2!, material_identity: "pc2:changed" },
  },
  {
    ...context,
    pc3: {
      ...context.pc3!,
      selected_question_key: "blocker_and_conflict",
    },
  },
  {
    ...context,
    pc3: {
      ...context.pc3!,
      highlighted_connection_id: "connection-changed",
    },
  },
  {
    ...context,
    pc3: { ...context.pc3!, material_identity: "pc3:changed" },
  },
  {
    ...context,
    pc4_scope_key: "guidebrief-conversation-scope:material-changed",
  },
  {
    ...context,
    owner_state: { ...context.owner_state, busy: true },
  },
  {
    ...context,
    owner_state: {
      ...context.owner_state,
      decision_applying_kind: "supersede",
    },
  },
  {
    ...context,
    owner_state: {
      ...context.owner_state,
      decision_eligible: false,
    },
  },
  {
    ...context,
    owner_state: {
      ...context.owner_state,
      transition_preview_available: true,
    },
  },
]);
assert.equal(
  new Set(materialVariants).size,
  materialVariants.length,
  "every answer/action-affecting exact context change must rebuild the snapshot",
);
assert.notEqual(empty.fingerprint, one.fingerprint);
assert.notEqual(
  one.fingerprint,
  buildBrowserActionCapabilitySnapshotV01({
    context,
    capabilities: [
      capability({ owner_actionability_identity: "owner:changed" }),
    ],
  }).fingerprint,
);
const timestampReplay = buildBrowserActionCapabilitySnapshotV01({
  context: {
    ...context,
    generated_at: "2099-01-01T00:00:00.000Z",
  } as BrowserActionCapabilitySnapshotInputV01["context"],
  capabilities: [],
});
assert.equal(timestampReplay.fingerprint, empty.fingerprint);

assert.throws(
  () =>
    buildBrowserActionCapabilitySnapshotV01({
      context,
      capabilities: [
        capability({
          target_scope: {
            ...capability().target_scope,
            project_id: "project-other",
          },
        }),
      ],
    }),
  /guidebrief_interaction_cross_scope_target/,
);
assert.throws(
  () =>
    buildBrowserActionCapabilitySnapshotV01({
      context,
      capabilities: [
        relationshipCapability && {
          ...relationshipCapability,
          target_scope: {
            ...relationshipCapability.target_scope,
            candidate_id: "candidate-other",
          },
        },
      ],
    }),
  /guidebrief_interaction_cross_candidate_target/,
);

const commandCases: Array<{
  utterance: string;
  action: BrowserActionCapabilityV01["action_key"];
  route: BrowserActionCapabilityV01["route_key"];
  context?: BrowserActionCapabilitySnapshotInputV01["context"];
}> = [
  {
    utterance: "Show the next change.",
    action: "selected_work.select_next_candidate",
    route: "next_candidate",
  },
  {
    utterance: "Review the next change.",
    action: "selected_work.select_next_candidate",
    route: "next_candidate",
  },
  {
    utterance: "Move to the next unresolved change.",
    action: "selected_work.select_next_candidate",
    route: "next_candidate",
  },
  {
    utterance: "Show the source connection.",
    action: "relationship.select_question",
    route: "relationship_support_and_source",
  },
  {
    utterance: "Show what supports this.",
    action: "relationship.select_question",
    route: "relationship_support_and_source",
  },
  {
    utterance: "Show the blocker.",
    action: "relationship.select_question",
    route: "relationship_blocker_and_conflict",
  },
  {
    utterance: "Show the decision connection.",
    action: "relationship.select_question",
    route: "relationship_candidate_and_decision",
  },
  {
    utterance: "Show the project-change connection.",
    action: "relationship.select_question",
    route: "relationship_decision_and_project_change",
  },
  {
    utterance: "Show the later outcome.",
    action: "relationship.select_question",
    route: "relationship_project_change_and_later_outcome",
  },
  {
    utterance: "Take me to the current action.",
    action: "surface.open_current_action",
    route: "current_action",
  },
  {
    utterance: "Show what I should do next.",
    action: "surface.open_current_action",
    route: "current_action",
  },
  {
    utterance: "Open advanced review.",
    action: "panel.open_advanced_review",
    route: "advanced_review",
  },
  {
    utterance: "Open exact details.",
    action: "inspector.open_selected_work",
    route: "selected_work_inspector",
  },
  {
    utterance: "Show the exact source.",
    action: "inspector.open_selected_work",
    route: "selected_work_inspector",
  },
  {
    utterance: "Prepare an accept decision.",
    action: "decision.prepare_applying",
    route: "decision_accept",
  },
  {
    utterance: "Show what would change before applying.",
    action: "transition.prepare_preview",
    route: "transition_preview",
    context: {
      ...context,
      owner_state: {
        ...context.owner_state,
        transition_preview_available: true,
      },
    },
  },
  {
    utterance: "Review the impact.",
    action: "transition.prepare_preview",
    route: "transition_preview",
    context: {
      ...context,
      owner_state: {
        ...context.owner_state,
        transition_preview_available: true,
      },
    },
  },
];
for (const commandCase of commandCases) {
  const commandContext = commandCase.context ?? context;
  const registered = registeredCapability(
    commandCase.action,
    commandCase.route,
    commandContext,
  );
  const snapshot = buildBrowserActionCapabilitySnapshotV01({
    context: commandContext,
    capabilities: [registered],
  });
  const commandRequest = buildGuideBriefInteractionRequestV01({
    request_id: `request:${commandCase.route}:${commandCase.utterance}`,
    raw_utterance: commandCase.utterance,
    scope_key: commandContext.pc4_scope_key,
    capability_snapshot_fingerprint: snapshot.fingerprint,
    previous_turn_anchor: null,
    conversation_context: null,
  });
  const commandPlan = compileGuideBriefInteractionPlanV01({
    request: commandRequest,
    snapshot,
  });
  assert.equal(commandRequest.classification, "action", commandCase.utterance);
  assert.equal(commandPlan.status, "resolved", commandCase.utterance);
  assert.equal(commandPlan.action_key, commandCase.action, commandCase.utterance);
}

for (const utterance of [
  "Apply this.",
  "Confirm this.",
  "Save the decision.",
  "Start Codex.",
  "Resume work.",
  "Activate this project.",
  "Merge the PR.",
  "Open an arbitrary URL.",
  "Click the third button.",
  "Run this API call.",
  "Open https://example.com.",
]) {
  const unsupported = buildGuideBriefInteractionRequestV01({
    request_id: `unsupported:${utterance}`,
    raw_utterance: utterance,
    scope_key: context.pc4_scope_key,
    capability_snapshot_fingerprint: one.fingerprint,
    previous_turn_anchor: null,
    conversation_context: null,
  });
  assert.equal(unsupported.classification, "unsupported", utterance);
}

for (const utterance of [
  "Show the next change and apply this.",
  "Show the next change and confirm this.",
  "Open advanced review and merge the PR.",
  "Show the blocker and write a poem.",
  "Run something arbitrary and open exact details.",
  "Show the next change then confirm this.",
  "Open exact details and write a poem.",
]) {
  const partiallyUnderstood =
    buildGuideBriefInteractionRequestV01({
      request_id: `partial:${utterance}`,
      raw_utterance: utterance,
      scope_key: context.pc4_scope_key,
      capability_snapshot_fingerprint: orderedA.fingerprint,
      previous_turn_anchor: null,
      conversation_context: null,
    });
  assert.equal(
    partiallyUnderstood.classification,
    "unsupported",
    utterance,
  );
  assert.equal(
    compileGuideBriefInteractionPlanV01({
      request: partiallyUnderstood,
      snapshot: orderedA,
    }).status,
    "unsupported",
    utterance,
  );
}

const multiAction = buildGuideBriefInteractionRequestV01({
  request_id: "request-multi",
  raw_utterance: "Open advanced review and show the next change.",
  scope_key: context.pc4_scope_key,
  capability_snapshot_fingerprint: orderedA.fingerprint,
  previous_turn_anchor: null,
  conversation_context: null,
});
assert.equal(multiAction.classification, "ambiguous");
assert.equal(
  compileGuideBriefInteractionPlanV01({
    request: multiAction,
    snapshot: orderedA,
  }).status,
  "ambiguous",
);
const multiActionThen = buildGuideBriefInteractionRequestV01({
  request_id: "request-multi-then",
  raw_utterance: "Open advanced review then show the next change.",
  scope_key: context.pc4_scope_key,
  capability_snapshot_fingerprint: orderedA.fingerprint,
  previous_turn_anchor: null,
  conversation_context: null,
});
assert.equal(multiActionThen.classification, "ambiguous");

const ambiguousRelationshipSnapshot =
  buildBrowserActionCapabilitySnapshotV01({
    context,
    capabilities: [
      relationshipCapability,
      registeredCapability(
        "relationship.select_question",
        "relationship_blocker_and_conflict",
      ),
    ],
  });
const ambiguousRelationship = buildGuideBriefInteractionRequestV01({
  request_id: "request-ambiguous-relationship",
  raw_utterance: "Show the connection.",
  scope_key: context.pc4_scope_key,
  capability_snapshot_fingerprint:
    ambiguousRelationshipSnapshot.fingerprint,
  previous_turn_anchor: null,
  conversation_context: null,
});
assert.equal(
  compileGuideBriefInteractionPlanV01({
    request: ambiguousRelationship,
    snapshot: ambiguousRelationshipSnapshot,
  }).status,
  "ambiguous",
);

const noCapabilityRequest = buildGuideBriefInteractionRequestV01({
  request_id: "request-no-capability",
  raw_utterance: "Open advanced review.",
  scope_key: context.pc4_scope_key,
  capability_snapshot_fingerprint: empty.fingerprint,
  previous_turn_anchor: null,
  conversation_context: null,
});
assert.equal(
  compileGuideBriefInteractionPlanV01({
    request: noCapabilityRequest,
    snapshot: empty,
  }).status,
  "unavailable",
);

const callerTaintedPlan = compileGuideBriefInteractionPlanV01({
  request: {
    ...request,
    effect_class: "external_effect",
    confirmation_policy: "none",
  } as typeof request,
  snapshot: one,
});
assert.equal(callerTaintedPlan.effect_class, "ui_selection");
assert.equal(
  callerTaintedPlan.confirmation_policy,
  "immediate_current_scope",
);
assert.deepEqual(
  compileGuideBriefInteractionPlanV01({ request, snapshot: one }),
  plan,
);
const distinctRequest = buildGuideBriefInteractionRequestV01({
  request_id: "request-2",
  raw_utterance: "Show the next change.",
  scope_key: context.pc4_scope_key,
  capability_snapshot_fingerprint: one.fingerprint,
  previous_turn_anchor: null,
  conversation_context: null,
});
assert.notEqual(
  compileGuideBriefInteractionPlanV01({
    request: distinctRequest,
    snapshot: one,
  }).plan_id,
  plan.plan_id,
);

const consumedAgain = await executeGuideBriefInteractionPlanV01({
  plan,
  current_snapshot: one,
  adapters: [adapter],
  ledger,
  read_current_binding: current,
});
assert.equal(consumedAgain.status, "blocked");
assert.equal(adapterCalls.length, 1);

const missingAdapter = await executeGuideBriefInteractionPlanV01({
  plan: compileGuideBriefInteractionPlanV01({
    request: distinctRequest,
    snapshot: one,
  }),
  current_snapshot: one,
  adapters: [],
  ledger: createGuideBriefInteractionExecutionLedgerV01(),
  read_current_binding: current,
});
assert.equal(missingAdapter.status, "blocked");

for (const mismatchedAdapter of [
  { ...adapter, target_handle: "target:other" },
  { ...adapter, owner: "pc3_relationship_surface" as const },
  { ...adapter, effect_class: "navigation" as const },
]) {
  const mismatch = await executeGuideBriefInteractionPlanV01({
    plan: compileGuideBriefInteractionPlanV01({
      request: distinctRequest,
      snapshot: one,
    }),
    current_snapshot: one,
    adapters: [mismatchedAdapter],
    ledger: createGuideBriefInteractionExecutionLedgerV01(),
    read_current_binding: current,
  });
  assert.equal(mismatch.status, "blocked");
}

const exception = await executeGuideBriefInteractionPlanV01({
  plan: compileGuideBriefInteractionPlanV01({
    request: distinctRequest,
    snapshot: one,
  }),
  current_snapshot: one,
  adapters: [{
    ...adapter,
    invoke: async () => {
      throw new Error("owner failure");
    },
  }],
  ledger: createGuideBriefInteractionExecutionLedgerV01(),
  read_current_binding: current,
});
assert.equal(exception.status, "failed");
assert.match(exception.public_observed_effect, /Nothing was retried/);

let lateBinding = current();
const late = await executeGuideBriefInteractionPlanV01({
  plan: compileGuideBriefInteractionPlanV01({
    request: distinctRequest,
    snapshot: one,
  }),
  current_snapshot: one,
  adapters: [{
    ...adapter,
    invoke: async () => {
      lateBinding = {
        scope_key: "guidebrief-conversation-scope:late-change",
        capability_snapshot_fingerprint: one.fingerprint,
      };
      return {
        status: "completed",
        public_observed_effect: "A stale effect must not be retained.",
        durable_state_changed: false,
        exact_result_ref: null,
      };
    },
  }],
  ledger: createGuideBriefInteractionExecutionLedgerV01(),
  read_current_binding: () => lateBinding,
});
assert.equal(late.status, "stale");
assert.doesNotMatch(
  late.public_observed_effect,
  /stale effect must not be retained/i,
);

const reloadedLedger = createGuideBriefInteractionExecutionLedgerV01();
assert.equal(reloadedLedger.consumed_plan_ids.size, 0);
assert.equal(reloadedLedger.in_flight_plan_id, null);

const changedSnapshot = buildBrowserActionCapabilitySnapshotV01({
  context,
  capabilities: [
    capability({
      owner_actionability_identity: "candidate-selection:changed",
    }),
  ],
});
let hostBinding = current();
let releaseDeferred!: () => void;
const deferred = new Promise<void>((resolve) => {
  releaseDeferred = resolve;
});
let activeAdapters = 0;
let maximumAdapterConcurrency = 0;
let deferredCalls = 0;
const hostLedger = createGuideBriefInteractionExecutionLedgerV01();
const deferredAdapter: GuideBriefInteractionAdapterV01 = {
  ...adapter,
  invoke: async () => {
    deferredCalls += 1;
    activeAdapters += 1;
    maximumAdapterConcurrency = Math.max(
      maximumAdapterConcurrency,
      activeAdapters,
    );
    await deferred;
    activeAdapters -= 1;
    return {
      status: "preview_prepared",
      public_observed_effect:
        "Impact is ready and the project remains unchanged.",
      durable_state_changed: false,
      exact_result_ref: null,
    };
  },
};
const firstDeferredPlan = compileGuideBriefInteractionPlanV01({
  request: {
    ...request,
    request_id: "request-host-first",
  },
  snapshot: one,
});
const deferredOutcomePromise = executeGuideBriefInteractionPlanV01({
  plan: firstDeferredPlan,
  current_snapshot: one,
  adapters: [deferredAdapter],
  ledger: hostLedger,
  read_current_binding: () => hostBinding,
});
await Promise.resolve();
hostBinding = {
  scope_key: context.pc4_scope_key,
  capability_snapshot_fingerprint: changedSnapshot.fingerprint,
};
const changedRequest = buildGuideBriefInteractionRequestV01({
  request_id: "request-host-second",
  raw_utterance: "Show the next change.",
  scope_key: context.pc4_scope_key,
  capability_snapshot_fingerprint: changedSnapshot.fingerprint,
  previous_turn_anchor: null,
  conversation_context: null,
});
const changedPlan = compileGuideBriefInteractionPlanV01({
  request: changedRequest,
  snapshot: changedSnapshot,
});
const blockedDuringSnapshotChange =
  await executeGuideBriefInteractionPlanV01({
    plan: changedPlan,
    current_snapshot: changedSnapshot,
    adapters: [deferredAdapter],
    ledger: hostLedger,
    read_current_binding: () => hostBinding,
  });
assert.equal(blockedDuringSnapshotChange.status, "blocked");
assert.equal(deferredCalls, 1);
releaseDeferred();
assert.equal((await deferredOutcomePromise).status, "stale");
assert.equal(maximumAdapterConcurrency, 1);
const freshAdapter = {
  ...deferredAdapter,
  invoke: async () => {
    deferredCalls += 1;
    activeAdapters += 1;
    maximumAdapterConcurrency = Math.max(
      maximumAdapterConcurrency,
      activeAdapters,
    );
    activeAdapters -= 1;
    return {
      status: "completed" as const,
      public_observed_effect:
        "The next unresolved change is now selected.",
      durable_state_changed: false as const,
      exact_result_ref: null,
    };
  },
};
const afterSettlement = await executeGuideBriefInteractionPlanV01({
  plan: {
    ...changedPlan,
    plan_id: `${changedPlan.plan_id}:after-settlement`,
  },
  current_snapshot: changedSnapshot,
  adapters: [freshAdapter],
  ledger: hostLedger,
  read_current_binding: () => hostBinding,
});
assert.equal(afterSettlement.status, "completed");
assert.equal(deferredCalls, 2);
assert.equal(maximumAdapterConcurrency, 1);

console.log(
  "vNext GuideBrief bounded Browser interaction substrate tests passed.",
);
}

void main();
