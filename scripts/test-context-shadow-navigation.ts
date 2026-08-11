import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";

import { contextUseAttributionSourceFixture } from "@/fixtures/vnext/protocol/context-use-attribution-projection-v0-1";
import {
  buildContextUseAttributionProjectionV01,
  createContextUseAttributionProjectionFingerprintV01,
  deriveContextUseAttributionProjectionIdV01,
  validateContextUseAttributionProjectionV01,
} from "@/lib/vnext/context-use-attribution-projection";
import {
  assertValidPersonalPerspectiveShadowProjectionV01,
  buildPersonalPerspectivePairedEvaluationV01,
  buildPersonalPerspectiveShadowProjectionV01,
  type BuildPersonalPerspectiveShadowProjectionInputV01,
} from "@/lib/vnext/context-shadow-navigation";
import { selectPersonalPerspectiveContextV01 } from "@/lib/vnext/project-controls/project-controls";
import { canonicalizeProtocolValueV01 } from "@/lib/vnext/protocol-primitives";
import {
  runContextShadowNavigationReportV01,
  type ContextShadowNavigationReportRequestV01,
} from "@/scripts/context-shadow-navigation-report";
import type {
  ContextUseAttributionProjectionV01,
  ContextUseAttributionRowV01,
} from "@/types/vnext/context-use-attribution-projection";
import type {
  PersonalPerspectiveContextCandidateV01,
  PersonalPerspectiveEffectiveScopeV01,
} from "@/types/vnext/project-controls";
import type { TaskContextPacketSelectedEntryV01 } from "@/types/vnext/task-context-packet";

const workspaceId = "workspace:acgc2-shadow";
const projectId = "project:acgc2-shadow";
const packetBinding = {
  packet_version: "task_context_packet.v0.1" as const,
  packet_id: "packet:acgc2-shadow-baseline",
  packet_fingerprint: `sha256:${"a".repeat(64)}`,
};
const includedScope = makeScope();
const candidateA = makeCandidate("a");
const candidateB = makeCandidate("b");
const unreviewed = makeCandidate("unreviewed", {
  review_status: "unreviewed",
});
const staleBase = makeCandidate("stale");
const stale = {
  ...staleBase,
  entry: {
    ...staleBase.entry,
    currentness: { ...staleBase.entry.currentness, status: "stale" as const },
  },
};
const untrusted = makeCandidate("untrusted", {
  trust_policy_status: "ineligible",
});
const wrongKindBase = makeCandidate("wrong-kind");
const wrongKind = {
  ...wrongKindBase,
  entry: { ...wrongKindBase.entry, entry_kind: "evidence_ref" as const },
};
const candidates = [
  candidateA,
  candidateB,
  unreviewed,
  stale,
  untrusted,
  wrongKind,
];
const input = buildInput(candidates, 1);
const frozenInput = deepFreeze(clone(input));
const inputBefore = canonicalizeProtocolValueV01(frozenInput);
const projection = buildPersonalPerspectiveShadowProjectionV01(frozenInput);

assert.equal(canonicalizeProtocolValueV01(frozenInput), inputBefore);
assertValidPersonalPerspectiveShadowProjectionV01(projection);
assert.deepEqual(
  projection.baseline.selection,
  selectPersonalPerspectiveContextV01({
    workspace_id: workspaceId,
    project_id: projectId,
    scope: includedScope,
    candidates,
  }),
);
assert.equal(projection.baseline.selection.selected_context.length, 2);
assert.equal(projection.baseline.selection.excluded_context.length, 4);
assert.equal(projection.shadow.selected.length, 1);
assert.deepEqual(
  projection.shadow.selected[0]?.entry,
  projection.baseline.selection.selected_context[0],
);
assert.equal(projection.shadow.stop_reason, "max_shadow_selected_reached");
assert.equal(projection.shadow.budget.budget_excluded_count, 1);
assert.equal(
  projection.shadow.excluded.filter(
    (row) => row.exclusion_kind === "baseline_hard_exclusion",
  ).length,
  4,
);
assert.equal(
  projection.shadow.excluded.filter(
    (row) => row.exclusion_kind === "shadow_budget",
  ).length,
  1,
);
assert.equal(projection.comparison.overlap.length, 1);
assert.equal(projection.comparison.baseline_only.length, 1);
assert.equal(projection.comparison.shadow_only.length, 0);
assert.equal(projection.comparison.exclusion_reason_deltas.length, 1);
assert.ok(
  projection.comparison.exclusion_reason_deltas[0]?.shadow_reason.includes(
    "max_shadow_selected",
  ),
);
assertAllAuthorityFalseV01(projection.authority_summary);
assertAllAuthorityFalseV01(projection.candidate_snapshot.authority_summary);
assertAllAuthorityFalseV01(projection.shadow.authority_summary);
assertAllAuthorityFalseV01(projection.comparison.authority_summary);

const reordered = buildPersonalPerspectiveShadowProjectionV01(
  buildInput([...candidates].reverse(), 1),
);
assert.equal(
  reordered.candidate_snapshot.candidate_set_fingerprint,
  projection.candidate_snapshot.candidate_set_fingerprint,
);
assert.equal(
  reordered.baseline.baseline_result_fingerprint,
  projection.baseline.baseline_result_fingerprint,
);
assert.deepEqual(
  reordered.shadow.selected,
  projection.shadow.selected,
);

const duplicate = buildPersonalPerspectiveShadowProjectionV01(
  buildInput([...candidates, clone(candidateA)], 1),
);
assert.equal(
  duplicate.candidate_snapshot.candidate_set_fingerprint,
  projection.candidate_snapshot.candidate_set_fingerprint,
);
assert.equal(duplicate.candidate_snapshot.collection.duplicate_candidate_count, 1);
assert.deepEqual(
  duplicate.baseline.selection,
  projection.baseline.selection,
);

const changedCandidate = clone(candidateA);
changedCandidate.entry.bounded_summary = "Semantically changed bounded summary.";
const changed = buildPersonalPerspectiveShadowProjectionV01(
  buildInput([changedCandidate, ...candidates.slice(1)], 1),
);
assert.notEqual(
  changed.candidate_snapshot.candidate_set_fingerprint,
  projection.candidate_snapshot.candidate_set_fingerprint,
);

const exhausted = buildPersonalPerspectiveShadowProjectionV01(
  buildInput([candidateA, candidateB], 8),
);
assert.equal(exhausted.shadow.stop_reason, "candidates_exhausted");
assert.equal(exhausted.shadow.selected.length, 2);
const noEligible = buildPersonalPerspectiveShadowProjectionV01(
  buildInput([unreviewed, stale, untrusted, wrongKind], 1),
);
assert.equal(noEligible.shadow.stop_reason, "no_eligible_material");
const scopeExcluded = buildPersonalPerspectiveShadowProjectionV01({
  ...buildInput([candidateA], 1),
  scope: makeScope({
    status: "excluded",
    configured: true,
    effectively_included: false,
    effective_context_behavior: "excluded_by_explicit_choice",
  }),
});
assert.equal(scopeExcluded.shadow.stop_reason, "scope_excluded");
assert.equal(scopeExcluded.candidate_snapshot.candidates.length, 0);
assert.equal(scopeExcluded.candidate_snapshot.source_completeness.status, "partial");

assert.throws(
  () =>
    buildPersonalPerspectiveShadowProjectionV01(
      buildInput([
        makeCandidate("foreign", {
          candidate_scope: {
            scope_kind: "canonical_project",
            workspace_id: workspaceId,
            project_id: "project:foreign",
          },
        }),
      ], 1),
    ),
  /personal_perspective_candidate_scope_invalid/,
);
assert.throws(
  () =>
    buildPersonalPerspectiveShadowProjectionV01({
      ...buildInput([candidateA], 1),
      unknown_field: true,
    } as BuildPersonalPerspectiveShadowProjectionInputV01),
  /context_shadow_navigation_unknown_field/,
);
assert.throws(
  () =>
    buildPersonalPerspectiveShadowProjectionV01(
      buildInput([
        {
          ...candidateA,
          entry: {
            ...candidateA.entry,
            bounded_summary: "/Users/example/private/research.txt",
          },
        },
      ], 1),
    ),
  /context_shadow_navigation_material_refused:absolute_local_path/,
);
assert.throws(
  () =>
    buildPersonalPerspectiveShadowProjectionV01(
      buildInput([
        {
          ...candidateA,
          entry: {
            ...candidateA.entry,
            bounded_summary: `sk-proj-${"x".repeat(48)}`,
          },
        },
      ], 1),
    ),
  /context_shadow_navigation_material_refused:secret_shaped_material/,
);
const projectionWithUnknown = clone(projection) as typeof projection & {
  unknown_field?: boolean;
};
projectionWithUnknown.unknown_field = true;
assert.throws(
  () => assertValidPersonalPerspectiveShadowProjectionV01(projectionWithUnknown),
  /context_shadow_navigation_unknown_field/,
);

const attribution = buildAttributionProjectionV01(projection);
const preOutcomeBefore = canonicalizeProtocolValueV01(projection);
const attributionBefore = canonicalizeProtocolValueV01(attribution);
const paired = buildPersonalPerspectivePairedEvaluationV01(
  projection,
  attribution,
);
assert.equal(canonicalizeProtocolValueV01(projection), preOutcomeBefore);
assert.equal(canonicalizeProtocolValueV01(attribution), attributionBefore);
assert.equal(
  paired.pre_outcome_shadow.frozen_pair_fingerprint,
  projection.frozen_identity.frozen_pair_fingerprint,
);
assert.equal(paired.hindsight_boundary.frozen_shadow_unchanged, true);
assert.equal(paired.hindsight_boundary.later_evidence_used_for_selection, false);
assert.equal(paired.summary.overlap_count, 1);
assert.equal(paired.summary.baseline_only_count, 1);
assert.equal(paired.summary.shadow_only_count, 0);
assert.equal(paired.summary.selected_count_delta, -1);
assert.equal(paired.summary.critical_omission_candidate_count, 1);
const omission = paired.rows.find(
  (row) => row.comparison_lane === "baseline_only",
);
assert(omission);
assert.equal(omission.critical_omission_candidate, true);
assert.equal(
  omission.critical_omission_candidate_rule,
  "baseline_only_exact_reference_non_causal_v0.1",
);
assert.equal(omission.attribution.citation_or_reference.status, "referenced");
assert.equal(omission.attribution.support_validation.status, "unknown");
assert.equal(omission.attribution.outcome_association.status, "unknown");
assert.equal(omission.attribution.causal_contribution.status, "unknown");
assert.deepEqual(omission.attribution.causal_contribution.intervention_refs, []);
assert.ok(
  paired.rows.every((row) => row.attribution.actual_use.status === "unknown"),
);
assertAllAuthorityFalseV01(paired.authority_summary);

const foreignAttribution = resignAttributionV01({
  ...clone(attribution),
  project_id: "project:foreign",
});
assert.throws(
  () =>
    buildPersonalPerspectivePairedEvaluationV01(
      projection,
      foreignAttribution,
    ),
  /context_shadow_navigation_attribution_scope_mismatch/,
);
const anotherPacketAttribution = clone(attribution);
anotherPacketAttribution.later_task_context_packet.packet_id =
  "packet:another-packet";
resignAttributionV01(anotherPacketAttribution);
assert.throws(
  () =>
    buildPersonalPerspectivePairedEvaluationV01(
      projection,
      anotherPacketAttribution,
    ),
  /context_shadow_navigation_attribution_packet_mismatch/,
);

const reportRequest: ContextShadowNavigationReportRequestV01 = {
  ...input,
  later_context_use_attribution: attribution,
  format: "json",
};
const jsonReport = runContextShadowNavigationReportV01(reportRequest);
const parsedReport = JSON.parse(jsonReport) as {
  pre_outcome_shadow: typeof projection;
  later_paired_evaluation: typeof paired;
  boundary: Record<string, boolean>;
};
assert.equal(
  parsedReport.pre_outcome_shadow.integrity.fingerprint,
  projection.integrity.fingerprint,
);
assert.equal(
  parsedReport.later_paired_evaluation.integrity.fingerprint,
  paired.integrity.fingerprint,
);
assert.equal(parsedReport.boundary.authority_granted, false);
const markdownReport = runContextShadowNavigationReportV01({
  ...reportRequest,
  format: "markdown",
});
assert.match(markdownReport, /## Pre-outcome shadow/);
assert.match(markdownReport, /## Later paired evaluation/);
assert.match(markdownReport, /Shadow only: 0/);
assert.match(markdownReport, /Reference is not support/);

const cliInput = clone(reportRequest) as unknown as Record<string, unknown>;
delete cliInput.format;
const cli = spawnSync(
  process.execPath,
  [
    "--import",
    "tsx",
    "scripts/context-shadow-navigation-report.ts",
    "--format",
    "markdown",
  ],
  {
    cwd: process.cwd(),
    input: JSON.stringify(cliInput),
    encoding: "utf8",
    env: {
      NODE_ENV: "test",
      PATH: process.env.PATH ?? "",
    },
    timeout: 10_000,
  },
);
assert.equal(cli.status, 0, cli.stderr);
assert.equal(cli.signal, null);
assert.match(cli.stdout, /# Personal Perspective shadow-navigation report/);
assert.equal(cli.stderr, "");

const reportSource = readFileSync(
  "scripts/context-shadow-navigation-report.ts",
  "utf8",
);
assert.equal(/\bfetch\s*\(/u.test(reportSource), false);
assert.equal(/better-sqlite3|new Database/u.test(reportSource), false);
assert.equal(
  /OPENAI_API_KEY|@openai\/|model-gateway|callProvider/iu.test(reportSource),
  false,
);

console.log(
  JSON.stringify(
    {
      suite: "context-shadow-navigation-v0.1",
      status: "passed",
      deterministic_candidate_snapshot: true,
      stable_candidate_order_normalization: true,
      relevant_candidate_change_changes_fingerprint: true,
      baseline_selector_reused_unchanged: true,
      strict_subset_policy: true,
      shadow_only_count: 0,
      explicit_budget_and_stop_reasons: true,
      hard_gate_parity: true,
      exact_acgc1_attribution_join: true,
      hindsight_selection_calls: 0,
      unknown_item_lanes_preserved: true,
      critical_omission_candidate_non_causal: true,
      bounded_report_consumer: true,
      database_writes: 0,
      schema_changes: 0,
      packet_writes: 0,
      provider_calls: 0,
      network_calls: 0,
      external_calls: 0,
      authority_flags_true: 0,
    },
    null,
    2,
  ),
);

function buildInput(
  values: PersonalPerspectiveContextCandidateV01[],
  maxShadowSelected: number,
): BuildPersonalPerspectiveShadowProjectionInputV01 {
  return {
    workspace_id: workspaceId,
    project_id: projectId,
    scope: clone(includedScope),
    candidates: clone(values),
    baseline_task_context_packet: clone(packetBinding),
    max_shadow_selected: maxShadowSelected,
  };
}

function makeScope(
  overrides: Partial<PersonalPerspectiveEffectiveScopeV01> = {},
): PersonalPerspectiveEffectiveScopeV01 {
  return {
    effective_scope_version: "personal_perspective_effective_scope.v0.1",
    workspace_id: workspaceId,
    project_id: projectId,
    status: "included",
    configured: true,
    effectively_included: true,
    scope_revision: 4,
    created_at: "2026-08-11T00:00:00.000Z",
    updated_at: "2026-08-11T00:01:00.000Z",
    effective_context_behavior: "eligible_for_normal_context_selection",
    explanation: "Included for exact ACGC2 shadow evaluation.",
    ...overrides,
  };
}

function makeCandidate(
  suffix: string,
  overrides: Partial<PersonalPerspectiveContextCandidateV01> = {},
): PersonalPerspectiveContextCandidateV01 {
  const externalRef = {
    ref_version: "external_ref.v0.1" as const,
    ref_type: "reviewed_memory",
    external_id: `memory:${suffix}`,
    observed_at: "2026-08-11T00:00:00.000Z",
    trust_class: "direct_local_observation" as const,
  };
  return {
    candidate_scope: {
      scope_kind: "canonical_project",
      workspace_id: workspaceId,
      project_id: projectId,
    },
    review_status: "reviewed",
    trust_policy_status: "eligible",
    entry: {
      entry_id: `memory-entry:${suffix}`,
      entry_kind: "memory_ref",
      source_ref: `memory-source:${suffix}`,
      external_ref: externalRef,
      why_included: `Fixture candidate ${suffix}.`,
      currentness: {
        status: "fresh",
        as_of: "2026-08-11T00:00:00.000Z",
        basis: "Exact pre-outcome fixture currentness.",
        source_ref: {
          ...externalRef,
          external_id: `memory-currentness:${suffix}`,
        },
      },
      trust_class: "direct_local_observation",
      compatibility_source_ref: {
        ...externalRef,
        external_id: `memory-compatibility:${suffix}`,
      },
      bounded_summary: `Bounded memory ${suffix}.`,
    },
    ...overrides,
  };
}

function buildAttributionProjectionV01(
  preOutcome: ReturnType<typeof buildPersonalPerspectiveShadowProjectionV01>,
): ContextUseAttributionProjectionV01 {
  const attribution = buildContextUseAttributionProjectionV01(
    contextUseAttributionSourceFixture,
  );
  attribution.workspace_id = preOutcome.workspace_id;
  attribution.project_id = preOutcome.project_id;
  attribution.later_task_context_packet = clone(preOutcome.baseline.packet);
  attribution.rows = preOutcome.baseline.selection.selected_context.map(
    (entry, index) => attributionRowV01(entry, attribution.rows[index % attribution.rows.length]!, index === 1),
  );
  attribution.collection.selected_entry_count = attribution.rows.length;
  attribution.collection.projected_row_count = attribution.rows.length;
  attribution.completeness.missing_lanes = [
    "item_actual_use",
    "item_citation_or_reference",
    "item_support_validation",
    "item_outcome_association",
    "item_causal_contribution",
  ];
  return resignAttributionV01(attribution);
}

function attributionRowV01(
  entry: TaskContextPacketSelectedEntryV01,
  template: ContextUseAttributionRowV01,
  referenced: boolean,
): ContextUseAttributionRowV01 {
  return {
    ...clone(template),
    entry_id: entry.entry_id,
    entry_kind: entry.entry_kind,
    source_ref: entry.source_ref,
    external_ref: clone(entry.external_ref),
    compatibility_source_ref: clone(entry.compatibility_source_ref),
    why_included: entry.why_included,
    bounded_summary: entry.bounded_summary,
    currentness: clone(entry.currentness),
    trust_class: entry.trust_class,
    citation_or_reference: referenced
      ? {
          status: "referenced",
          basis: "exact_run_receipt_reference",
          source_refs: entry.external_ref ? [clone(entry.external_ref)] : [],
          unknown_reason: null,
        }
      : {
          status: "unknown",
          basis: "unknown",
          source_refs: [],
          unknown_reason: "No exact item reference is present in this lane.",
        },
    support_validation: {
      status: "unknown",
      basis: "no_exact_item_support_relation",
      source_refs: [],
      unknown_reason: "Reference presence is not support validation.",
    },
    outcome_association: {
      status: "unknown",
      basis: "no_exact_item_outcome_relation",
      source_refs: [],
      unknown_reason: "No exact item outcome relation is present.",
    },
    causal_contribution: {
      status: "unknown",
      basis: "no_intervention_relation",
      intervention_refs: [],
      unknown_reason: "No intervention relation is present.",
    },
    limitations: [
      "packet_level_actual_use_not_item_level",
      "packet_level_assessment_not_item_level",
      "no_item_specific_actual_use_relation",
      "no_exact_item_support_relation",
      "no_exact_item_outcome_relation",
      "no_intervention_relation",
      referenced
        ? "reference_presence_not_support_validation"
        : "no_exact_run_receipt_item_reference",
    ].sort(),
  };
}

function resignAttributionV01(
  attribution: ContextUseAttributionProjectionV01,
): ContextUseAttributionProjectionV01 {
  attribution.projection_id = deriveContextUseAttributionProjectionIdV01(
    attribution,
  );
  attribution.integrity.fingerprint =
    createContextUseAttributionProjectionFingerprintV01(attribution);
  const validation = validateContextUseAttributionProjectionV01(attribution);
  assert.equal(
    validation.status,
    "valid",
    JSON.stringify(validation.errors, null, 2),
  );
  return attribution;
}

function assertAllAuthorityFalseV01(value: object): void {
  for (const [key, flag] of Object.entries(
    value as unknown as Record<string, unknown>,
  )) {
    if (typeof flag === "boolean") {
      assert.equal(flag, false, key);
    }
  }
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value as Record<string, unknown>)) {
      deepFreeze(child);
    }
  }
  return value;
}
