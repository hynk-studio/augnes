import type {
  ArtifactRef,
  AugnesDelta,
  AugnesDeltaAuthorityBoundary,
  AugnesDeltaBudgetSummary,
  AugnesDeltaType,
  AugnesDeltaValidationSummary,
  DeltaMergePolicy,
  EvidenceRef,
  HandoffRef,
  ResearchDiagnosticRef,
  SnapshotRef,
} from "../../types/augnes-delta";
import {
  AUTONOMY_RUNNER_DELTA_BATCH_VERSION,
  type AutonomyRunRecord,
  type AutonomyRunStepRecord,
  type AutonomyRunnerSourceRefs,
  type RecoveredAutonomyDeltaBatch,
} from "../../types/autonomy-runner-execution";
import { buildDefaultRunnerAuthorityBoundary } from "./runner-state";

const DELTA_CONTRACT_VERSION = "augnes_delta_contract.v0.1" as const;
const RUNNER_DELTA_CREATED_BY = "autonomy_runner_v0_1" as const;

export function buildRecoveredDeltaBatchForRun(
  run: AutonomyRunRecord,
  createdAt: string,
): RecoveredAutonomyDeltaBatch {
  const completedSteps = run.steps.filter((step) => step.status === "completed");
  const sourceRefs = buildBatchSourceRefs(run);
  const validation = buildBatchValidation(run);
  const authorityBoundary = {
    ...buildDefaultRunnerAuthorityBoundary(),
    ...run.authority_boundary,
  };

  const deltas: AugnesDelta[] = [
    buildRunnerDelta({
      run,
      type: "coordination_delta",
      delta_id: `${run.run_id}.delta.coordination`,
      title: "Autonomy run ledger execution recorded",
      summary:
        "Local runner created execution ledger records and preserved append-only events.",
      createdAt,
      sourceRefs,
      targetRefs: [
        `autonomy_run:${run.run_id}`,
        ...completedSteps.map((step) => `autonomy_run_step:${step.step_id}`),
      ],
      reviewNotes: [
        "Autonomy Run is an execution record, not an approval record.",
        "Runner ledger is not a proof/evidence ledger.",
      ],
    }),
    buildRunnerDelta({
      run,
      type: "validation_delta",
      delta_id: `${run.run_id}.delta.validation`,
      title: "Autonomy runner boundary validation recorded",
      summary:
        "Runner output confirms local-only execution with no provider, GitHub, Codex, memory, or Perspective apply step.",
      createdAt,
      sourceRefs,
      targetRefs: [
        `autonomy_run:${run.run_id}`,
        "boundary:no_external_calls",
        "boundary:no_memory_mutation",
        "boundary:no_perspective_apply",
      ],
      reviewNotes: [
        "Evidence pointer is not evidence write.",
        "Research diagnostics are not authority.",
        "Durable memory follows a separate merge policy.",
      ],
    }),
    buildRunnerDelta({
      run,
      type: "agent_plan_delta",
      delta_id: `${run.run_id}.delta.agent_plan`,
      title: "Autonomy runner next review candidate",
      summary:
        "Recovered runner output is a review candidate for operator inspection, not an auto-applied plan.",
      createdAt,
      sourceRefs,
      targetRefs: [
        `autonomy_run:${run.run_id}`,
        `autonomy_contract:${run.autonomy_contract_ref ?? "unspecified"}`,
      ],
      reviewNotes: [
        "Guide suggestion is not user decision.",
        "Delta outside an Autonomy Contract boundary cannot be auto_applied.",
      ],
    }),
    buildRunnerDelta({
      run,
      type: "handoff_delta",
      delta_id: `${run.run_id}.delta.handoff`,
      title: "Autonomy runner ledger readback candidate",
      summary:
        "Recovered DeltaBatch can be read back from the runner ledger for local operator review.",
      createdAt,
      sourceRefs,
      targetRefs: [
        `autonomy_run_delta_batch:${run.run_id}.batch.recovered`,
        `autonomy_run:${run.run_id}`,
      ],
      reviewNotes: [
        "Stale snapshot based handoff must include a warning.",
        "PR is not merge authority.",
      ],
    }),
  ];

  return {
    batch_id: `${run.run_id}.batch.recovered`,
    run_id: run.run_id,
    batch_version: AUTONOMY_RUNNER_DELTA_BATCH_VERSION,
    status: run.status === "blocked" ? "blocked" : "needs_review",
    title: `Recovered Autonomy Runner DeltaBatch for ${run.title}`,
    summary:
      "Local runner execution output recovered from the runner ledger as review-only AugnesDelta candidates.",
    created_at: createdAt,
    delta_count: deltas.length,
    deltas,
    source_refs: sourceRefs,
    validation,
    authority_boundary: authorityBoundary,
  };
}

function buildRunnerDelta({
  run,
  type,
  delta_id,
  title,
  summary,
  createdAt,
  sourceRefs,
  targetRefs,
  reviewNotes,
}: {
  run: AutonomyRunRecord;
  type: AugnesDeltaType;
  delta_id: string;
  title: string;
  summary: string;
  createdAt: string;
  sourceRefs: AutonomyRunnerSourceRefs;
  targetRefs: string[];
  reviewNotes: string[];
}): AugnesDelta {
  return {
    delta_id,
    contract_version: DELTA_CONTRACT_VERSION,
    scope: run.scope,
    type,
    status: "needs_review",
    source: "agent_run",
    title,
    summary,
    created_at: createdAt,
    created_by: RUNNER_DELTA_CREATED_BY,
    target_refs: targetRefs,
    snapshot_refs: buildSnapshotRefs(run, sourceRefs),
    diagnostic_refs: buildDiagnosticRefs(run),
    evidence_refs: buildEvidenceRefs(run),
    artifact_refs: buildArtifactRefs(run),
    handoff_refs: buildHandoffRefs(run),
    merge_policy: buildManualReviewMergePolicy(run.scope),
    authority_boundary: buildDeltaAuthorityBoundary(),
    validation_summary: buildDeltaValidationSummary(run),
    budget_summary: buildDeltaBudgetSummary(run),
    review_notes: reviewNotes,
    non_goals: [
      "No durable Perspective apply.",
      "No durable memory mutation.",
      "No proof or evidence write.",
      "No provider/OpenAI/GitHub/Codex call.",
      "No branch, PR, publish, deploy, merge, retry, or replay behavior.",
    ],
  };
}

function buildBatchSourceRefs(
  run: AutonomyRunRecord,
): AutonomyRunnerSourceRefs {
  return {
    ...run.source_refs,
    autonomy_contract_refs: uniqueSorted([
      ...run.source_refs.autonomy_contract_refs,
      run.autonomy_contract_ref ?? "",
    ]),
    runner_refs: uniqueSorted([
      ...run.source_refs.runner_refs,
      `autonomy_run:${run.run_id}`,
      ...run.steps.map((step) => `autonomy_run_step:${step.step_id}`),
      ...run.events.map((event) => `autonomy_run_event:${event.event_id}`),
    ]),
  };
}

function buildBatchValidation(
  run: AutonomyRunRecord,
): RecoveredAutonomyDeltaBatch["validation"] {
  return {
    validation_status: run.status === "blocked" ? "blocked" : "needs_review",
    completed_checks: [
      "runner_ledger_run_record_written",
      "runner_ledger_step_record_written",
      "runner_ledger_event_history_written",
      "delta_batch_recovery_written",
      "no_external_provider_github_codex_call_recorded",
      "no_memory_mutation_recorded",
      "no_durable_perspective_apply_recorded",
    ],
    skipped_checks: [
      {
        check: "workplane_delta_projection_integration",
        reason:
          "Deferred in v0.1 to keep recovery bounded to runner ledger readback.",
      },
    ],
    notes: [
      "DeltaBatch recovery is not durable Perspective apply.",
      "DeltaBatch recovery is not memory mutation.",
      "Recovered deltas are review candidates.",
    ],
  };
}

function buildSnapshotRefs(
  run: AutonomyRunRecord,
  sourceRefs: AutonomyRunnerSourceRefs,
): SnapshotRef[] {
  return [
    {
      snapshot_id: `${run.run_id}.snapshot.runner_ledger`,
      snapshot_kind: "autonomy_runner_ledger",
      created_at: run.updated_at,
      source_refs: sourceRefs.runner_refs,
      staleness_status: "partial",
      freshness_notes: [
        "Runner ledger snapshot is local and bounded to run records.",
        "Stale snapshot based handoff must include a warning.",
      ],
    },
  ];
}

function buildDiagnosticRefs(run: AutonomyRunRecord): ResearchDiagnosticRef[] {
  return [
    {
      diagnostic_id: `${run.run_id}.diagnostic.boundary`,
      diagnostic_kind: "runner_boundary_review",
      source_ref: `autonomy_run:${run.run_id}`,
      summary:
        "Runner boundary diagnostics are local review context, not authority.",
      status: "review_only",
      non_authority_notes: [
        "Research diagnostics are not authority.",
        "Autonomy Run is not an approval record.",
      ],
      informs_delta_ids: [
        `${run.run_id}.delta.validation`,
        `${run.run_id}.delta.agent_plan`,
      ],
    },
  ];
}

function buildEvidenceRefs(run: AutonomyRunRecord): EvidenceRef[] {
  return [
    {
      evidence_ref: `${run.run_id}.evidence_pointer.runner_ledger`,
      evidence_kind: "validation_pointer",
      pointer_semantics: "pointer_only",
      summary:
        "Pointer to runner ledger readback only; no proof/evidence record is written.",
      verified_status: "partial",
      proof_write_authority: false,
      evidence_write_authority: false,
    },
  ];
}

function buildArtifactRefs(run: AutonomyRunRecord): ArtifactRef[] {
  return [
    {
      artifact_ref: "docs/AUTONOMY_RUNNER_EXECUTION_V0_1.md",
      artifact_kind: "doc",
      pointer_semantics: "pointer_only",
      summary: "Runner execution v0.1 documentation pointer.",
      source_of_truth: false,
    },
    {
      artifact_ref: `autonomy_run:${run.run_id}`,
      artifact_kind: "runner_ledger_record",
      pointer_semantics: "pointer_only",
      summary: "Autonomy runner ledger record pointer.",
      source_of_truth: false,
    },
  ];
}

function buildHandoffRefs(run: AutonomyRunRecord): HandoffRef[] {
  return [
    {
      handoff_ref: `${run.run_id}.handoff.review_only`,
      handoff_kind: "operator_packet",
      pointer_semantics: "pointer_only",
      summary:
        "Review-only pointer to recovered runner output; it is not an external handoff send.",
      execution_authority: false,
      external_send_authority: false,
    },
  ];
}

function buildManualReviewMergePolicy(scope: string): DeltaMergePolicy {
  return {
    mode: "manual_review_required",
    target_scope: scope,
    allowed_auto_apply: false,
    requires_user_judgment: true,
    requires_fresh_snapshot: true,
    requires_validation: true,
    durable_memory_allowed: false,
    project_perspective_allowed: false,
    external_side_effect_allowed: false,
    blocked_reason:
      "Autonomy Runner v0.1 recovery creates review candidates only; auto-apply is blocked.",
  };
}

function buildDeltaAuthorityBoundary(): AugnesDeltaAuthorityBoundary {
  return {
    source_of_truth:
      "autonomy_runner_ledger; Delta is a projection/change unit, not source of truth",
    can_commit_or_reject_state: false,
    can_record_proof: false,
    can_create_evidence: false,
    can_update_work: false,
    can_mutate_memory: false,
    can_apply_project_perspective: false,
    can_publish_external: false,
    can_merge: false,
    can_retry_replay_deploy: false,
    can_call_github: false,
    can_call_openai_or_provider: false,
    can_execute_codex: false,
    can_create_branch_or_pr: false,
    notes: [
      "Delta is not source of truth; it is a projection/change unit.",
      "Delta outside an Autonomy Contract boundary cannot be auto_applied.",
      "DeltaBatch recovery is not durable Perspective apply.",
      "DeltaBatch recovery is not memory mutation.",
    ],
  };
}

function buildDeltaValidationSummary(
  run: AutonomyRunRecord,
): AugnesDeltaValidationSummary {
  return {
    validation_status: run.status === "blocked" ? "partial" : "passed",
    required_checks: [
      "runner_step_executed",
      "runner_event_recorded",
      "runner_delta_batch_recovered",
      "runner_delta_batch_readback",
      "forbidden_external_actions_absent",
    ],
    completed_checks: [
      "runner_step_executed",
      "runner_event_recorded",
      "forbidden_external_actions_absent",
    ],
    failed_checks: [],
    skipped_checks: [
      {
        check: "durable_perspective_apply",
        reason: "Forbidden for Autonomy Runner v0.1 recovery.",
      },
      {
        check: "durable_memory_mutation",
        reason: "Forbidden for Autonomy Runner v0.1 recovery.",
      },
    ],
    notes: [
      "Smoke pass is validation signal, not proof/evidence.",
      "Evidence pointer is not evidence write.",
    ],
  };
}

function buildDeltaBudgetSummary(
  run: AutonomyRunRecord,
): AugnesDeltaBudgetSummary {
  const completedStepCount = run.steps.filter(
    (step: AutonomyRunStepRecord) => step.status === "completed",
  ).length;

  return {
    budget_scope: run.budget_snapshot.budget_id,
    estimated_delta_count: 4,
    reviewed_delta_count: 0,
    auto_apply_candidate_count: 0,
    manual_review_required_count: 4,
    blocked_delta_count: 0,
    notes: [
      `Completed deterministic runner steps: ${completedStepCount}.`,
      "No external-call, provider-call, GitHub-call, Codex-task, memory-mutation, or Perspective-apply budget was granted.",
    ],
  };
}

function uniqueSorted(values: readonly string[]): string[] {
  return [...new Set(values.filter(Boolean))].sort();
}
