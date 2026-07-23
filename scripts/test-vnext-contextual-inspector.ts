import assert from "node:assert/strict";

import {
  buildContextualInspectorViewV01,
  buildUnavailableContextualInspectorViewV01,
} from "../lib/vnext/inspector/contextual-inspector-view";
import {
  createSharedInspectorHrefV01,
  parseSharedInspectorTargetV01,
} from "../lib/vnext/shared-project-inspector-href";
import type {
  SharedProjectInspectorProjectionV01,
  SharedProjectInspectorSectionKindV01,
  SharedProjectInspectorSectionV01,
  SharedProjectInspectorTargetV01,
} from "../types/vnext/shared-project-inspector";

const HASH = `sha256:${"a".repeat(64)}`;
const PROPOSAL_ID = `episode-delta-proposal:${"1".repeat(24)}`;
const RECEIPT_ID = `run-receipt:${"2".repeat(24)}`;
const SECTION_KINDS: SharedProjectInspectorSectionKindV01[] = [
  "target_authority",
  "timeline",
  "selected_context_work",
  "run_receipt",
  "criterion_basis",
  "evidence_claims_relations",
  "proposal_candidate",
  "decision_gate",
  "transition_current_head",
  "later_context_feedback",
  "automation",
  "strategic_perspective",
  "integration_capability",
];

const TARGET_CASES: Array<{
  target: SharedProjectInspectorTargetV01;
  related:
    | "ai_workplane_home"
    | "suggested_change"
    | "result"
    | "delegated_work"
    | "blank_state";
  firstSection: SharedProjectInspectorSectionKindV01;
}> = [
  {
    target: { target_kind: "project_coordination" },
    related: "ai_workplane_home",
    firstSection: "target_authority",
  },
  {
    target: fingerprintTarget("task_context_packet", "task-context-packet:1"),
    related: "ai_workplane_home",
    firstSection: "selected_context_work",
  },
  {
    target: fingerprintTarget("run_receipt", RECEIPT_ID),
    related: "result",
    firstSection: "run_receipt",
  },
  {
    target: {
      target_kind: "criterion",
      criterion_id: "criterion:1",
      packet_id: "task-context-packet:1",
      packet_fingerprint: HASH,
      receipt_id: RECEIPT_ID,
      receipt_fingerprint: HASH,
      assessment_id: "criterion-assessment:1",
      assessment_fingerprint: HASH,
    },
    related: "result",
    firstSection: "criterion_basis",
  },
  {
    target: fingerprintTarget("evidence_record", "evidence:1"),
    related: "result",
    firstSection: "criterion_basis",
  },
  {
    target: fingerprintTarget("claim_record", "claim:1"),
    related: "result",
    firstSection: "criterion_basis",
  },
  {
    target: fingerprintTarget("claim_evidence_relation", "relation:1"),
    related: "result",
    firstSection: "criterion_basis",
  },
  {
    target: {
      target_kind: "claim_family",
      family_id: "claim-family:1",
      family_origin_fingerprint: HASH,
      applicability_scope_fingerprint: HASH,
    },
    related: "result",
    firstSection: "criterion_basis",
  },
  {
    target: {
      target_kind: "relation_family",
      family_id: "relation-family:1",
      family_origin_fingerprint: HASH,
      applicability_scope_fingerprint: HASH,
    },
    related: "result",
    firstSection: "criterion_basis",
  },
  {
    target: fingerprintTarget("episode_delta_proposal", PROPOSAL_ID),
    related: "suggested_change",
    firstSection: "proposal_candidate",
  },
  {
    target: {
      target_kind: "proposal_candidate",
      proposal_id: PROPOSAL_ID,
      proposal_fingerprint: HASH,
      candidate_id: "candidate:1",
      candidate_fingerprint: HASH,
    },
    related: "suggested_change",
    firstSection: "proposal_candidate",
  },
  {
    target: fingerprintTarget("review_decision", "review-decision:1"),
    related: "suggested_change",
    firstSection: "decision_gate",
  },
  {
    target: fingerprintTarget("semantic_commit_gate", "semantic-gate:1"),
    related: "suggested_change",
    firstSection: "decision_gate",
  },
  {
    target: fingerprintTarget(
      "state_transition_receipt",
      "state-transition-receipt:1",
    ),
    related: "suggested_change",
    firstSection: "decision_gate",
  },
  {
    target: fingerprintTarget("semantic_state", "semantic-state:1"),
    related: "suggested_change",
    firstSection: "decision_gate",
  },
  {
    target: {
      target_kind: "semantic_target_head",
      target_key: "goal:current",
      revision: 1,
      presence: "present",
      transition_receipt_id: "state-transition-receipt:1",
      transition_receipt_fingerprint: HASH,
    },
    related: "suggested_change",
    firstSection: "decision_gate",
  },
  {
    target: fingerprintTarget(
      "later_task_context_packet",
      "task-context-packet:later",
    ),
    related: "ai_workplane_home",
    firstSection: "selected_context_work",
  },
  {
    target: fingerprintTarget("context_use_review", "context-use-review:1"),
    related: "suggested_change",
    firstSection: "selected_context_work",
  },
  {
    target: fingerprintTarget("automation_work_item", "automation-work:1"),
    related: "ai_workplane_home",
    firstSection: "automation",
  },
  {
    target: {
      target_kind: "automation_policy",
      policy_id: "project:1:1",
      policy_fingerprint: HASH,
    },
    related: "blank_state",
    firstSection: "automation",
  },
  {
    target: { target_kind: "automation_cycle", cycle_id: "cycle:1" },
    related: "ai_workplane_home",
    firstSection: "automation",
  },
  {
    target: { target_kind: "automation_run", run_id: "run:1" },
    related: "delegated_work",
    firstSection: "automation",
  },
  {
    target: fingerprintTarget("capability_grant", "capability-grant:1"),
    related: "blank_state",
    firstSection: "automation",
  },
  {
    target: {
      target_kind: "strategic_material",
      proposal_id: PROPOSAL_ID,
      proposal_fingerprint: HASH,
    },
    related: "suggested_change",
    firstSection: "proposal_candidate",
  },
  {
    target: {
      target_kind: "personal_perspective_inclusion",
      packet_id: "task-context-packet:1",
      packet_fingerprint: HASH,
    },
    related: "blank_state",
    firstSection: "selected_context_work",
  },
  {
    target: {
      target_kind: "integration_health",
      receipt_id: RECEIPT_ID,
      receipt_fingerprint: HASH,
    },
    related: "result",
    firstSection: "run_receipt",
  },
  {
    target: {
      target_kind: "capability_coverage",
      receipt_id: RECEIPT_ID,
      receipt_fingerprint: HASH,
    },
    related: "result",
    firstSection: "run_receipt",
  },
];

for (const testCase of TARGET_CASES) {
  const href = createSharedInspectorHrefV01(testCase.target);
  assert.deepEqual(
    parseSharedInspectorTargetV01(
      new URL(href, "http://127.0.0.1:3000"),
    ),
    testCase.target,
  );
  assert.doesNotMatch(href, /return_to|return_label|workspace_id|project_id/u);
  const projection = projectionV01(testCase.target);
  const view = buildContextualInspectorViewV01({ inspector: projection });
  const repeated = buildContextualInspectorViewV01({ inspector: projection });
  assert.equal(view.presentation_version, "contextual_inspector_view.v0.1");
  assert.equal(view.related_context.kind, testCase.related);
  assert.equal(view.primary_sections[0]?.section_kind, testCase.firstSection);
  assert.ok(view.primary_sections.length <= 4);
  assert.equal(
    view.primary_sections.length + view.additional_sections.length,
    projection.sections.length,
  );
  assert.equal(
    new Set(view.primary_sections.map((section) => section.section_kind)).size,
    view.primary_sections.length,
  );
  assert.deepEqual(view, repeated);
  assert.ok(
    Object.values(view.authority).every((value) => value === false),
    `${testCase.target.target_kind} must grant no presentation authority`,
  );
  const firstViewport = [
    view.target_label,
    view.heading,
    view.target_summary,
    view.status_label,
    view.status_explanation,
    view.related_context.label,
    view.related_context.explanation,
  ].join("\n");
  assert.doesNotMatch(firstViewport, /sha256:|episode-delta-proposal:|run-receipt:/u);
}

const issueProjection = projectionV01(
  fingerprintTarget("episode_delta_proposal", PROPOSAL_ID),
);
issueProjection.sections.find(
  (section) => section.section_kind === "decision_gate",
)!.status = "conflict";
issueProjection.sections.find(
  (section) => section.section_kind === "criterion_basis",
)!.status = "bounded_incomplete";
const issueView = buildContextualInspectorViewV01({
  inspector: issueProjection,
});
assert.equal(issueView.primary_sections[0]?.section_kind, "decision_gate");
assert.equal(issueView.default_open_section_kind, "decision_gate");
assert.equal(
  issueView.primary_sections.filter(
    (section) => section.section_kind === issueView.default_open_section_kind,
  ).length,
  1,
);

for (const completeness of [
  "complete",
  "partial",
  "bounded_incomplete",
  "conflict",
] as const) {
  const projection = projectionV01({ target_kind: "project_coordination" });
  projection.completeness = completeness;
  projection.target_status =
    completeness === "conflict"
      ? "conflict"
      : completeness === "bounded_incomplete"
        ? "bounded_incomplete"
        : "present";
  const view = buildContextualInspectorViewV01({ inspector: projection });
  assert.equal(
    view.status,
    completeness === "complete" ? "complete" : completeness,
  );
}

const missingProjection = projectionV01({
  target_kind: "project_coordination",
});
missingProjection.target_status = "missing";
assert.equal(
  buildContextualInspectorViewV01({ inspector: missingProjection }).status,
  "missing",
);
assert.equal(
  buildContextualInspectorViewV01({
    inspector: projectionV01({ target_kind: "project_coordination" }),
    project_activity: "inactive_read_only",
  }).status,
  "inactive_read_only",
);
assert.equal(
  buildUnavailableContextualInspectorViewV01({
    target_kind: "project_coordination",
  }).status,
  "unavailable",
);

const emptyProjection = projectionV01({
  target_kind: "project_coordination",
});
emptyProjection.sections = [];
const emptyView = buildContextualInspectorViewV01({
  inspector: emptyProjection,
});
assert.deepEqual(emptyView.primary_sections, []);
assert.deepEqual(emptyView.additional_sections, []);

const omittedProjection = projectionV01({
  target_kind: "project_coordination",
});
omittedProjection.sections[0]!.bounds.presentation_omitted = true;
omittedProjection.sections[0]!.bounds.items = collectionBoundV01(8, 2);
assert.equal(
  buildContextualInspectorViewV01({ inspector: omittedProjection })
    .primary_sections[0]?.bounds.presentation_omitted,
  true,
);

console.log(
  `Contextual Inspector presentation: ${TARGET_CASES.length} target families and status/boundary cases passed.`,
);

function fingerprintTarget(
  targetKind:
    | "task_context_packet"
    | "automation_work_item"
    | "run_receipt"
    | "evidence_record"
    | "claim_record"
    | "claim_evidence_relation"
    | "episode_delta_proposal"
    | "review_decision"
    | "semantic_commit_gate"
    | "state_transition_receipt"
    | "semantic_state"
    | "later_task_context_packet"
    | "context_use_review"
    | "capability_grant",
  recordId: string,
): SharedProjectInspectorTargetV01 {
  return {
    target_kind: targetKind,
    record_id: recordId,
    expected_fingerprint: HASH,
  };
}

function projectionV01(
  target: SharedProjectInspectorTargetV01,
): SharedProjectInspectorProjectionV01 {
  const refs = exactRefsForTargetV01(target);
  return {
    inspector_version: "shared_project_inspector.v0.1",
    workspace_id: "workspace:default",
    project_id: "project:fixture",
    observed_at: "2026-07-24T00:00:00.000Z",
    target,
    target_status: "present",
    target_title: "Exact source material",
    target_summary: "A bounded exact detail for the current project.",
    target_trust: "source_bound",
    target_currentness: "current",
    completeness: "complete",
    sections: SECTION_KINDS.map((kind) => sectionV01(kind, refs)),
    lineage: null,
    authority: {
      read_only: true,
      projection_is_rebuildable: true,
      writes_database: false,
      creates_evidence: false,
      accepts_evidence: false,
      creates_claim_or_relation: false,
      creates_proposal_or_revision: false,
      creates_review_decision: false,
      authorizes_semantic_commit_gate: false,
      applies_transition: false,
      compiles_later_packet: false,
      records_context_use_review: false,
      creates_automation_cycle_or_grant: false,
      selects_current_head: false,
      establishes_claim_truth: false,
      promotes_perspective_or_memory: false,
      calls_model_or_provider: false,
      performs_network_or_external_action: false,
      mutates_filesystem: false,
    },
  };
}

function sectionV01(
  sectionKind: SharedProjectInspectorSectionKindV01,
  refs: SharedProjectInspectorSectionV01["exact_refs"],
): SharedProjectInspectorSectionV01 {
  const sectionRefs = sectionKind === "target_authority" ? [] : refs;
  return {
    section_kind: sectionKind,
    title: sectionKind,
    status: "available",
    summary: `Bounded ${sectionKind} material.`,
    facts: [],
    items: [],
    exact_refs: sectionRefs,
    bounds: {
      facts: collectionBoundV01(0, 0),
      items: collectionBoundV01(0, 0),
      exact_refs: collectionBoundV01(sectionRefs.length, sectionRefs.length),
      presentation_omitted: false,
      upstream_bounded_incomplete: false,
      incompleteness_reasons: [],
    },
  };
}

function exactRefsForTargetV01(
  target: SharedProjectInspectorTargetV01,
): SharedProjectInspectorSectionV01["exact_refs"] {
  if (
    [
      "run_receipt",
      "criterion",
      "evidence_record",
      "claim_record",
      "claim_evidence_relation",
      "claim_family",
      "relation_family",
      "integration_health",
      "capability_coverage",
    ].includes(target.target_kind)
  ) {
    return [
      {
        record_kind: "run_receipt",
        record_id: RECEIPT_ID,
        record_fingerprint: HASH,
      },
    ];
  }
  if (
    [
      "episode_delta_proposal",
      "proposal_candidate",
      "review_decision",
      "semantic_commit_gate",
      "state_transition_receipt",
      "semantic_state",
      "semantic_target_head",
      "context_use_review",
      "strategic_material",
    ].includes(target.target_kind)
  ) {
    return [
      {
        record_kind: "episode_delta_proposal",
        record_id: PROPOSAL_ID,
        record_fingerprint: HASH,
      },
    ];
  }
  return [];
}

function collectionBoundV01(total: number, returned: number) {
  const omitted = total > returned;
  return {
    total_count: total,
    returned_count: returned,
    presentation_bound: Math.max(returned, 1),
    omitted_count: Math.max(0, total - returned),
    omitted,
    omission_reason: omitted
      ? ("inspector_presentation_bound_exceeded" as const)
      : null,
  };
}
