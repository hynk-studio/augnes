#!/usr/bin/env node
import { pathToFileURL } from "node:url";
import Database from "better-sqlite3";

import { openDatabase } from "../lib/db.ts";
import { writeAutonomyDelegationGrant } from "../lib/autonomy/autonomy-delegation-grant-write.ts";
import {
  buildAutonomyDelegationGrantAuthorityBoundary,
  readAutonomyDelegationGrants,
} from "../lib/autonomy/read-autonomy-delegation-grants.ts";
import { writeAutohuntWorkQueueCandidate } from "../lib/autonomy/autohunt-work-queue-candidate-write.ts";
import { readAutohuntWorkQueueCandidates } from "../lib/autonomy/read-autohunt-work-queue-candidates.ts";
import { writeAutohuntPreflightPacket } from "../lib/autonomy/autohunt-preflight-packet-write.ts";
import { readAutohuntPreflightPackets } from "../lib/autonomy/read-autohunt-preflight-packets.ts";
import { buildAutohuntWorkbenchReadbackSpine } from "../lib/autonomy/autohunt-workbench-readback-spine.ts";
import { writeAutohuntHandoffPlanPreview } from "../lib/autonomy/autohunt-handoff-plan-preview-write.ts";
import { readAutohuntHandoffPlanPreviews } from "../lib/autonomy/read-autohunt-handoff-plan-previews.ts";
import { writeAutohuntHandoffPlanOperatorReviewDecision } from "../lib/autonomy/autohunt-handoff-plan-operator-review-decision-write.ts";
import { readAutohuntHandoffPlanOperatorReviewDecisions } from "../lib/autonomy/read-autohunt-handoff-plan-operator-review-decisions.ts";
import {
  allValuesFalse,
  fingerprint,
  stableJson,
} from "../lib/research-candidate-review/shared-source-chain-guards.ts";
import {
  AUTONOMY_DELEGATION_GRANT_ALLOWED_ACTIONS,
  AUTONOMY_DELEGATION_GRANT_ALLOWED_OUTPUTS,
  AUTONOMY_DELEGATION_GRANT_ALLOWED_WORK_CLASSES,
  AUTONOMY_DELEGATION_GRANT_FORBIDDEN_ACTIONS,
  AUTONOMY_DELEGATION_GRANT_FORBIDDEN_OUTPUTS,
  AUTONOMY_DELEGATION_GRANT_FORBIDDEN_WORK_CLASSES,
  AUTONOMY_DELEGATION_GRANT_STOP_CONDITIONS,
} from "../types/autonomy-delegation-grant.ts";

const DEFAULT_NOW_PREFIX = "2026-07-09T06:20";
const SEED_SCOPE = "project:augnes";
const SEED_APPROVAL_REF = "approval:local-autohunt-chain-dogfood-v0-1";
const SEED_SOURCE_FINGERPRINT = fingerprint({
  seed: "local-autohunt-chain-dogfood-v0-1",
  source: "workbench-readback-dogfood",
});

export function seedLocalAutohuntChainV01({
  db: providedDb = null,
  nowPrefix = DEFAULT_NOW_PREFIX,
  mode = "dry_run_in_memory",
} = {}) {
  const db = providedDb ?? new Database(":memory:");
  const shouldClose = !providedDb;

  try {
    return seedWithDb({ db, nowPrefix, mode });
  } catch (error) {
    return {
      ok: false,
      mode,
      refusal_reasons: [
        error instanceof Error ? error.message : String(error),
      ],
      report: {
        dogfood_kind: "local_autohunt_chain_seed_readback",
        dogfood_version: "local_autohunt_chain_seed_readback.v0.1",
        ok: false,
        mode,
        refusal_reasons: [
          error instanceof Error ? error.message : String(error),
        ],
        recommended_next_step:
          "Inspect refusal reasons; do not execute, schedule, fetch, or mutate outside the dogfood seed records.",
      },
    };
  } finally {
    if (shouldClose) db.close();
  }
}

function seedWithDb({ db, nowPrefix, mode }) {
  const grantResult = writeAutonomyDelegationGrant(makeGrantInput(), {
    db,
    now: `${nowPrefix}:00.000Z`,
  });
  const grant = requireWrittenRecord({
    step: "grant",
    result: grantResult,
    recordKey: "grant",
  });
  const grantReadback = readAutonomyDelegationGrants({
    db,
    scope: SEED_SCOPE,
    grant_status: "active",
  });

  const candidateResult = writeAutohuntWorkQueueCandidate(
    makeCandidateInput(grant),
    {
      db,
      now: `${nowPrefix}:10.000Z`,
    },
  );
  const candidate = requireWrittenRecord({
    step: "queue_candidate",
    result: candidateResult,
    recordKey: "candidate",
  });
  const queueReadback = readAutohuntWorkQueueCandidates({
    db,
    scope: SEED_SCOPE,
    source_grant_id: grant.grant_id,
    candidate_status: "queued",
  });

  const preflightResult = writeAutohuntPreflightPacket(
    {
      scope: SEED_SCOPE,
      source_grant: grant,
      source_queue: queueReadback,
    },
    {
      db,
      now: `${nowPrefix}:20.000Z`,
    },
  );
  const preflightPacket = requireWrittenRecord({
    step: "preflight_packet",
    result: preflightResult,
    recordKey: "preflight_packet",
  });
  const preflightReadback = readAutohuntPreflightPackets({
    db,
    scope: SEED_SCOPE,
    source_grant_id: grant.grant_id,
    preflight_status: "ready_for_supervised_handoff_planning",
  });

  const workbenchSpine = buildAutohuntWorkbenchReadbackSpine({
    grant_readback: grantReadback,
    queue_readback: queueReadback,
    preflight_readback: preflightReadback,
    as_of: `${nowPrefix}:30.000Z`,
  });
  if (
    workbenchSpine.spine_status !==
    "ready_for_supervised_handoff_planning"
  ) {
    throw new Error(`workbench_spine_not_ready:${workbenchSpine.spine_status}`);
  }

  const handoffPlanResult = writeAutohuntHandoffPlanPreview(
    {
      scope: SEED_SCOPE,
      source_preflight: preflightPacket,
      source_workbench_spine: workbenchSpine,
    },
    {
      db,
      now: `${nowPrefix}:40.000Z`,
    },
  );
  const handoffPlan = requireWrittenRecord({
    step: "handoff_plan",
    result: handoffPlanResult,
    recordKey: "handoff_plan",
  });
  const handoffPlanReadback = readAutohuntHandoffPlanPreviews({
    db,
    scope: SEED_SCOPE,
    source_grant_id: grant.grant_id,
    handoff_plan_status: "ready_for_operator_review",
  });

  const decisionResult =
    writeAutohuntHandoffPlanOperatorReviewDecision(
      makeDecisionInput(handoffPlan),
      {
        db,
        now: `${nowPrefix}:50.000Z`,
      },
    );
  const operatorDecision = requireWrittenRecord({
    step: "operator_decision",
    result: decisionResult,
    recordKey: "decision",
  });
  const operatorDecisionReadback =
    readAutohuntHandoffPlanOperatorReviewDecisions({
      db,
      scope: SEED_SCOPE,
      source_handoff_plan_id: handoffPlan.handoff_plan_id,
      decision_status:
        "accepted_for_future_supervised_handoff_copy_export_planning",
    });

  const readbackSelections = {
    grant_selected:
      grantReadback.latest_active_grant?.grant_id === grant.grant_id ||
      grantReadback.selected_grant?.grant_id === grant.grant_id,
    queue_candidate_selected: queueReadback.selected_queued_candidates.some(
      (record) => record.candidate_id === candidate.candidate_id,
    ),
    preflight_selected:
      preflightReadback.latest_ready_preflight_packet?.preflight_packet_id ===
      preflightPacket.preflight_packet_id,
    handoff_plan_selected:
      handoffPlanReadback.selected_handoff_plan?.handoff_plan_id ===
      handoffPlan.handoff_plan_id,
    operator_decision_selected:
      operatorDecisionReadback.selected_decision?.decision_id ===
      operatorDecision.decision_id,
  };

  const noRunNoExecutionBoundary = {
    grant: allValuesFalse(grantReadback.no_run_no_execution_boundary),
    queue_candidate: allValuesFalse(queueReadback.no_run_no_execution_boundary),
    preflight_packet: allValuesFalse(
      preflightReadback.no_run_no_execution_boundary,
    ),
    workbench_spine: allValuesFalse(workbenchSpine.authority_boundary),
    handoff_plan: allValuesFalse(
      handoffPlanReadback.no_run_no_execution_boundary,
    ),
    operator_decision: allValuesFalse(
      operatorDecisionReadback.no_run_no_execution_boundary,
    ),
  };

  const rawMaterialPersisted = {
    grant: grantReadback.raw_material_persisted,
    queue_candidate: queueReadback.raw_material_persisted,
    preflight_packet: preflightReadback.raw_material_persisted,
    workbench_spine: workbenchSpine.raw_material_persisted,
    handoff_plan: handoffPlanReadback.raw_material_persisted,
    operator_decision: operatorDecisionReadback.raw_material_persisted,
  };

  const report = {
    dogfood_kind: "local_autohunt_chain_seed_readback",
    dogfood_version: "local_autohunt_chain_seed_readback.v0.1",
    ok: true,
    mode,
    scope: SEED_SCOPE,
    grant_id: grant.grant_id,
    queue_candidate_id: candidate.candidate_id,
    preflight_packet_id: preflightPacket.preflight_packet_id,
    workbench_spine_status: workbenchSpine.spine_status,
    handoff_plan_id: handoffPlan.handoff_plan_id,
    operator_decision_id: operatorDecision.decision_id,
    selected_statuses: {
      grant: grant.grant_status,
      queue_candidate: candidate.candidate_status,
      preflight_packet: preflightPacket.preflight_status,
      workbench_spine: workbenchSpine.spine_status,
      handoff_plan: handoffPlan.handoff_plan_status,
      operator_decision: operatorDecision.decision_status,
      approval_scope:
        operatorDecision.accepted_summary?.approval_scope ?? null,
    },
    readback_selections: readbackSelections,
    fingerprints: {
      grant: grant.grant_fingerprint,
      queue_candidate: candidate.candidate_fingerprint,
      preflight_packet: preflightPacket.preflight_packet_fingerprint,
      workbench_spine: workbenchSpine.spine_fingerprint,
      handoff_plan: handoffPlan.handoff_plan_fingerprint,
      operator_decision: operatorDecision.decision_fingerprint,
      seed_source: SEED_SOURCE_FINGERPRINT,
    },
    write_results: {
      grant: grantResult.result_status,
      queue_candidate: candidateResult.result_status,
      preflight_packet: preflightResult.result_status,
      handoff_plan: handoffPlanResult.result_status,
      operator_decision: decisionResult.result_status,
    },
    row_count_write_summary: {
      grant: summarizeRowCountSummary(grant.row_count_write_summary),
      queue_candidate: summarizeRowCountSummary(
        candidate.row_count_write_summary,
      ),
      preflight_packet: summarizeRowCountSummary(
        preflightPacket.row_count_write_summary,
      ),
      handoff_plan: summarizeRowCountSummary(
        handoffPlan.row_count_write_summary,
      ),
      operator_decision: summarizeRowCountSummary(
        operatorDecision.row_count_write_summary,
      ),
    },
    no_run_no_execution_boundary: noRunNoExecutionBoundary,
    raw_material_persisted: rawMaterialPersisted,
    raw_material_persisted_any: Object.values(rawMaterialPersisted).some(
      Boolean,
    ),
    no_external_or_execution_authority: Object.values(
      noRunNoExecutionBoundary,
    ).every(Boolean),
    recommended_next_step:
      "Inspect Workbench readbacks; do not execute, schedule, fetch, create branches or PRs, call external services, or mutate Perspective/CWP/work/memory/proof/evidence/product state.",
  };

  return {
    ok: true,
    mode,
    report,
    records: {
      grant,
      candidate,
      preflight_packet: preflightPacket,
      workbench_spine: workbenchSpine,
      handoff_plan: handoffPlan,
      operator_decision: operatorDecision,
    },
    write_results: {
      grant: grantResult,
      queue_candidate: candidateResult,
      preflight_packet: preflightResult,
      handoff_plan: handoffPlanResult,
      operator_decision: decisionResult,
    },
    readbacks: {
      grant: grantReadback,
      queue_candidate: queueReadback,
      preflight_packet: preflightReadback,
      handoff_plan: handoffPlanReadback,
      operator_decision: operatorDecisionReadback,
    },
  };
}

function requireWrittenRecord({ step, result, recordKey }) {
  if (!result.ok || !result[recordKey]) {
    throw new Error(
      `${step}_write_refused:${stableJson(result.refusal_reasons ?? [])}`,
    );
  }
  return result[recordKey];
}

function makeGrantInput() {
  return {
    scope: SEED_SCOPE,
    grant_status: "active",
    grant_mode: "supervised_autohunt_planning",
    explicit_user_approval: {
      approval_ref: SEED_APPROVAL_REF,
      approved_by: "operator:local-dogfood",
      approved_at: "2026-07-09T06:20:00.000Z",
      approval_basis: "explicit local dogfood seed/readback approval",
      approval_text_fingerprint: fingerprint({
        approval: SEED_APPROVAL_REF,
        scope: "future supervised handoff planning visibility only",
      }),
      raw_approval_text_persisted: false,
    },
    source_autonomy_contract: {
      contract_id: "autonomy_contract.local_autohunt_chain_dogfood.v0.1",
      contract_fingerprint: fingerprint({
        contract: "local-autohunt-chain-dogfood-v0-1",
      }),
      contract_version: "autonomy_contract.v0.1",
      autonomy_mode: "scheduled_hunt_preview",
      source_refs: ["autonomy-contract:local-dogfood"],
    },
    allowed_work_classes: [
      AUTONOMY_DELEGATION_GRANT_ALLOWED_WORK_CLASSES[0],
      AUTONOMY_DELEGATION_GRANT_ALLOWED_WORK_CLASSES[3],
      AUTONOMY_DELEGATION_GRANT_ALLOWED_WORK_CLASSES[4],
    ],
    forbidden_work_classes: [
      ...AUTONOMY_DELEGATION_GRANT_FORBIDDEN_WORK_CLASSES,
    ],
    allowed_actions: [...AUTONOMY_DELEGATION_GRANT_ALLOWED_ACTIONS],
    forbidden_actions: [...AUTONOMY_DELEGATION_GRANT_FORBIDDEN_ACTIONS],
    budget: {
      time_limit_minutes: 20,
      max_iterations: 2,
      max_tool_calls: 20,
      max_codex_tasks: 0,
      max_draft_prs: 0,
      max_file_changes: 4,
      max_changed_files_per_pr: 4,
      allowed_file_globs: [
        "scripts/**",
        "components/autonomy/**",
        "components/workplane/agent-workplane.tsx",
        "lib/autonomy/**",
        "package.json",
      ],
      forbidden_file_globs: ["app/api/**", "docs/**", "lib/db/**"],
      retry_limit: 1,
      failure_threshold: 1,
      requires_budget_refresh_after: ["budget_exhausted", "scope_change"],
    },
    reporting_cadence: {
      mode: "manual",
      interval_description: "report after deterministic local seed/readback",
      minimum_report_fields: [
        "grant_id",
        "queue_candidate_id",
        "preflight_packet_id",
        "handoff_plan_id",
        "operator_decision_id",
      ],
      report_target_surface: "operator_report",
    },
    stop_conditions: [...AUTONOMY_DELEGATION_GRANT_STOP_CONDITIONS],
    allowed_outputs: [...AUTONOMY_DELEGATION_GRANT_ALLOWED_OUTPUTS],
    forbidden_outputs: [...AUTONOMY_DELEGATION_GRANT_FORBIDDEN_OUTPUTS],
    revocation: {
      revoked_by: null,
      revoked_at: null,
      revocation_reason: null,
      supersedes_grant_id: null,
      superseded_by_grant_id: null,
    },
    authority_boundary: buildAutonomyDelegationGrantAuthorityBoundary(),
    persisted_material_boundary: {
      persists_source_fingerprints: true,
      persists_budget: true,
      persists_policy: true,
      persists_raw_user_approval_text: false,
      persists_raw_prompt: false,
      persists_raw_operator_note: false,
      persists_secret_or_token: false,
      persists_url_or_env_value: false,
    },
  };
}

function makeCandidateInput(sourceGrant) {
  return {
    scope: SEED_SCOPE,
    candidate_origin: "operator_supplied",
    source_grant: sourceGrant,
    work_class: "small_refactor",
    title: "Local Autohunt chain readback dogfood candidate",
    summary:
      "Deterministic local candidate for readback-only Autohunt dogfood visibility.",
    source_refs: ["workbench-readback:local-autohunt-chain-dogfood"],
    source_fingerprints: [SEED_SOURCE_FINGERPRINT],
    evidence_refs: [],
    required_context_refs: ["context:local-autohunt-chain-dogfood"],
    proposed_files_or_globs: [
      "scripts/dogfood-seed-local-autohunt-chain-v0-1.mjs",
      "scripts/smoke-local-autohunt-chain-dogfood-v0-1.mjs",
      "package.json",
    ],
    expected_outputs: ["operator_review_packet", "handoff_plan_decision_report"],
    required_checks: [
      "npm run smoke:local-autohunt-chain-dogfood-v0-1",
      "npm run typecheck",
    ],
    blocked_actions: [],
    stop_conditions: [
      "manual_stop_requested",
      "authority_boundary_unclear",
      "budget_exhausted",
      "forbidden_action_requested",
    ],
    budget_projection: {
      estimated_iterations: 1,
      estimated_tool_calls: 4,
      estimated_codex_tasks: 0,
      estimated_file_changes: 3,
      estimated_draft_prs: 0,
    },
    proposed_actions: ["read_repo", "report_result"],
  };
}

function makeDecisionInput(handoffPlan) {
  return {
    scope: SEED_SCOPE,
    source_handoff_plan: handoffPlan,
    operator_decision:
      "accept_handoff_plan_for_future_supervised_copy_export_planning",
    review_basis: {
      review_basis_ref: "review-basis:local-autohunt-chain-dogfood-v0-1",
      reviewed_by: "operator:local-dogfood",
      reviewed_at: "2026-07-09T06:20:50.000Z",
      review_basis_fingerprint: fingerprint({
        review_basis: "local-autohunt-chain-dogfood-v0-1",
        handoff_plan_id: handoffPlan.handoff_plan_id,
      }),
      raw_review_note_persisted: false,
    },
    accepted_summary: {
      handoff_plan_id: handoffPlan.handoff_plan_id,
      handoff_plan_fingerprint: handoffPlan.handoff_plan_fingerprint,
      prompt_plan_id: handoffPlan.supervised_codex_prompt_plan.prompt_plan_id,
      review_packet_id: handoffPlan.operator_review_packet.review_packet_id,
      selected_candidate_count:
        handoffPlan.selected_candidate_plan_summaries.length,
      required_checks: [...handoffPlan.draft_pr_plan.checks_to_run],
      expected_changed_file_globs: [
        ...handoffPlan.draft_pr_plan.expected_changed_file_globs,
      ],
      max_changed_files: handoffPlan.draft_pr_plan.max_changed_files,
      approval_scope: "future_supervised_handoff_copy_export_planning_only",
    },
    defer_or_reject_summary: null,
  };
}

function summarizeRowCountSummary(summary) {
  return {
    target_table_name: summary.target_table_name,
    target_delta: summary.target_delta,
    target_delta_matches_expected: summary.target_delta_matches_expected,
    all_non_target_row_counts_unchanged:
      summary.all_non_target_row_counts_unchanged,
    non_target_changed_table_count: summary.non_target_changed_table_count,
  };
}

function runCli() {
  const args = new Set(process.argv.slice(2));
  const dryRun =
    args.has("--dry-run") ||
    process.env.AUGNES_DOGFOOD_SEED_LOCAL_AUTOHUNT_CHAIN !== "1";
  const db = dryRun ? new Database(":memory:") : openDatabase();
  const result = seedLocalAutohuntChainV01({
    db,
    mode: dryRun ? "dry_run_in_memory" : "persistent_local_db",
  });
  db.close();
  console.log(JSON.stringify(result.report, null, 2));
  if (!result.ok) process.exitCode = 1;
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  runCli();
}
