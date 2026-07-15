import type Database from "better-sqlite3";
import { randomUUID } from "node:crypto";

import { openDatabase } from "@/lib/db";
import {
  buildAutonomyRunEventRecord,
  ensureAutonomyRunnerLedgerSchemaV01,
  insertAutonomyRunLedgerRecord,
  readAutonomyRunLedgerRecord,
  updateAutonomyRunLedgerFields,
  updateAutonomyRunStepLedgerFields,
  appendAutonomyRunLedgerEvent,
} from "@/lib/autonomy/runner-ledger";
import {
  buildDefaultRunnerAuthorityBoundary,
  buildDefaultRunnerBudgetSnapshot,
  buildDefaultRunnerSourceRefs,
  isTerminalRunnerStatus,
} from "@/lib/autonomy/runner-state";
import {
  buildMockRecommendations,
  buildPlannerModelInvocationEnvelopeV01,
  type PlannerGatewayDependenciesV01,
} from "@/lib/planner/planner";
import { buildStateBrief } from "@/lib/state/brief";
import {
  authorizeModelInvocationCapabilityGrantV01,
  ModelInvocationGrantErrorV01,
} from "@/lib/vnext/automation/model-invocation-capability-grant";
import {
  isModelGatewayInvocationErrorV01,
  PLANNER_MODEL_GATEWAY_PURPOSE_V01,
  type ModelGatewayBudgetV01,
  type ModelGatewayExecutionModeV01,
  type ModelInvocationReceiptV02,
  type PlannerRecommendationV01,
} from "@/lib/vnext/model-gateway/contracts";
import { invokePlannerModelGatewayV01 } from "@/lib/vnext/model-gateway/model-gateway";
import { projectModelInvocationReceiptToRunReceiptEntryV02 } from "@/lib/vnext/model-gateway/run-receipt-projection";
import { evaluateProjectAutomationAdmissionV01 } from "@/lib/vnext/project-controls/project-controls";
import {
  insertVNextCoreRecordV01,
  readVNextCoreRecordV01,
} from "@/lib/vnext/persistence/durable-semantic-store";
import { readProjectAutomationEffectiveStatusV01 } from "@/lib/vnext/persistence/project-control-store";
import { readCanonicalProjectWithRootV01 } from "@/lib/vnext/persistence/project-identity-registry";
import {
  buildRunReceiptV01,
  validateRunReceiptV01,
} from "@/lib/vnext/run-receipt";
import type {
  AutonomyRunEventRecord,
  AutonomyRunStepRecord,
  AutonomyRunSummary,
  AutonomyRunnerStatus,
} from "@/types/autonomy-runner-execution";
import type { ExternalRefV01 } from "@/types/vnext/external-ref";
import type { ModelInvocationCapabilityGrantAuthorityV01 } from "@/types/vnext/model-invocation-capability-grant";
import type { ProjectAutomationAdmissionStatusV01 } from "@/types/vnext/project-controls";
import type { RunReceiptV01 } from "@/types/vnext/run-receipt";

const CANONICAL_WORKSPACE =
  /^workspace:[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const CANONICAL_PROJECT =
  /^project:[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SAFE_IDENTIFIER = /^[A-Za-z0-9:._-]{1,256}$/;
const MAX_MESSAGE_CHARACTERS = 8_000;
const TERMINAL_RUN_STATUSES = [
  "blocked",
  "completed",
  "needs_review",
  "cancelled",
  "failed",
  "stopped",
] as const;

export const POLICY_TRIGGERED_PLANNER_RUN_VERSION_V01 =
  "policy_triggered_planner_run.v0.1" as const;

export type PolicyTriggeredPlannerRunErrorCodeV01 =
  | "policy_planner_request_invalid"
  | "policy_planner_scope_refused"
  | "policy_planner_control_revision_refused"
  | "policy_planner_admission_refused"
  | "policy_planner_grant_refused"
  | "policy_planner_run_conflict"
  | "policy_planner_gateway_blocked"
  | "policy_planner_gateway_cancelled"
  | "policy_planner_gateway_timeout"
  | "policy_planner_gateway_failed"
  | "policy_planner_finalization_failed";

export class PolicyTriggeredPlannerRunErrorV01 extends Error {
  constructor(
    readonly code: PolicyTriggeredPlannerRunErrorCodeV01,
    readonly admission_status: ProjectAutomationAdmissionStatusV01 | null,
    readonly model_invocation_receipt: ModelInvocationReceiptV02 | null,
    readonly run_receipt: RunReceiptV01 | null,
  ) {
    super("Policy-triggered Planner run did not complete successfully.");
    this.name = "PolicyTriggeredPlannerRunErrorV01";
  }
}

export interface PolicyTriggeredPlannerRunInputV01 {
  workspace_id: string;
  project_id: string;
  work_id: string;
  run_id: string;
  grant_id: string;
  automation_control_revision: number;
  message: string;
  execution_mode: ModelGatewayExecutionModeV01;
  invocation_budget: ModelGatewayBudgetV01;
  run_budget: ModelGatewayBudgetV01 & { max_timeout_ms: number };
  timeout_ms: number;
  cancellation_signal?: AbortSignal;
  project_root?: {
    path_flavor: "posix" | "win32";
    normalized_path: string;
  };
}

export interface PolicyTriggeredPlannerRunDependenciesV01 {
  grant_authority: ModelInvocationCapabilityGrantAuthorityV01;
  open_database?: () => Database.Database;
  gateway_dependencies?: Omit<
    PlannerGatewayDependenciesV01,
    "authorize_policy_invocation"
  >;
  build_state_brief?: typeof buildStateBrief;
  now?: () => Date;
  create_uuid?: () => string;
}

export interface PolicyTriggeredPlannerRunResultV01 {
  run_version: typeof POLICY_TRIGGERED_PLANNER_RUN_VERSION_V01;
  workspace_id: string;
  project_id: string;
  work_id: string;
  run_id: string;
  planner: "openai" | "mock";
  recommendations: PlannerRecommendationV01[];
  model_invocation_receipt: ModelInvocationReceiptV02;
  run_receipt: RunReceiptV01;
  semantic_state_changed: false;
  proposal_approved: false;
  publication_performed: false;
  deployment_performed: false;
  retry_performed: false;
  external_action_performed: false;
}

export async function runPolicyTriggeredPlannerV01(
  rawInput: PolicyTriggeredPlannerRunInputV01,
  dependencies: PolicyTriggeredPlannerRunDependenciesV01,
): Promise<PolicyTriggeredPlannerRunResultV01> {
  const input = safelyValidateRequest(rawInput);
  const open = dependencies.open_database ?? openDatabase;
  const database = open();
  ensureAutonomyRunnerLedgerSchemaV01(database);
  const clock = dependencies.now ?? (() => new Date());
  const admissionAt = strictNow(clock);
  let runCreated = false;
  try {
    const registration = readCanonicalProjectWithRootV01(database, input);
    if (!registration || !projectRootMatches(input, registration.root_binding.local_root)) {
      refuse("policy_planner_scope_refused");
    }
    const control = readProjectAutomationEffectiveStatusV01(database, input);
    if (
      control.control_revision !== null &&
      control.control_revision !== input.automation_control_revision
    ) {
      refuse("policy_planner_control_revision_refused");
    }
    const activeRunCount = countActivePolicyRuns(database, input.project_id);
    let grantMaterial: unknown | null = null;
    try {
      grantMaterial = await dependencies.grant_authority.read(input.grant_id);
    } catch {
      grantMaterial = null;
    }

    let authorization: ReturnType<
      typeof authorizeModelInvocationCapabilityGrantV01
    > | null = null;
    let grantFailure: ModelInvocationGrantErrorV01 | null = null;
    if (grantMaterial !== null) {
      try {
        authorization = authorizeModelInvocationCapabilityGrantV01({
          grant: grantMaterial,
          now: admissionAt,
          workspace_id: input.workspace_id,
          project_id: input.project_id,
          work_id: input.work_id,
          run_id: input.run_id,
          automation_control_revision: input.automation_control_revision,
          purpose: PLANNER_MODEL_GATEWAY_PURPOSE_V01,
          execution_mode: input.execution_mode,
          data_classification: "private",
          budget: input.invocation_budget,
          timeout_ms: input.timeout_ms,
          run_budget: input.run_budget,
        });
      } catch (error) {
        grantFailure =
          error instanceof ModelInvocationGrantErrorV01
            ? error
            : new ModelInvocationGrantErrorV01(
                "model_invocation_grant_invalid",
              );
      }
    }
    const admission = evaluateProjectAutomationAdmissionV01({
      workspace_id: input.workspace_id,
      project_id: input.project_id,
      control,
      candidate: {
        workspace_id: input.workspace_id,
        project_id: input.project_id,
      },
      grant_readiness: {
        workspace_id: input.workspace_id,
        project_id: input.project_id,
        status:
          grantMaterial === null
            ? "required"
            : grantFailure?.code === "model_invocation_capability_unavailable"
              ? "capability_unavailable"
              : grantFailure
                ? "policy_denied"
                : "ready",
      },
      active_run_readiness: {
        workspace_id: input.workspace_id,
        project_id: input.project_id,
        active_automated_run_count: activeRunCount,
      },
    });
    if (!admission.eligible_for_next_gate) {
      throw new PolicyTriggeredPlannerRunErrorV01(
        admission.status === "grant_required" ||
        admission.status === "capability_unavailable" ||
        admission.status === "policy_denied"
          ? "policy_planner_grant_refused"
          : "policy_planner_admission_refused",
        admission.status,
        null,
        null,
      );
    }
    if (!authorization || grantFailure) {
      throw new PolicyTriggeredPlannerRunErrorV01(
        "policy_planner_grant_refused",
        admission.status,
        null,
        null,
      );
    }
    assertRunIdentityAvailable(database, input);
    const startedAt = strictNow(clock);
    try {
      createPolicyRunLedgerRecord(
        database,
        input,
        authorization.grant.lineage_fingerprint,
        startedAt,
      );
    } catch {
      throw new PolicyTriggeredPlannerRunErrorV01(
        "policy_planner_run_conflict",
        admission.status,
        null,
        null,
      );
    }
    runCreated = true;

    const brief = (dependencies.build_state_brief ?? buildStateBrief)(
      input.project_id,
    );
    const invocationId = `model-invocation:${(
      dependencies.create_uuid ?? randomUUID
    )()}`;
    let plannerResult;
    try {
      plannerResult = await invokePlannerModelGatewayV01(
        buildPlannerModelInvocationEnvelopeV01({
          invocation_id: invocationId,
          workspace_id: input.workspace_id,
          project_id: input.project_id,
          message: input.message,
          brief,
          execution_mode: input.execution_mode,
          policy: {
            invocation_origin: "policy_triggered",
            automation_control_revision: input.automation_control_revision,
            work_id: input.work_id,
            run_id: input.run_id,
            grant_id: authorization.grant.grant_id,
            grant_fingerprint: authorization.grant.lineage_fingerprint,
          },
          budget: input.invocation_budget,
          timeout_ms: input.timeout_ms,
          cancellation_signal:
            input.cancellation_signal ?? new AbortController().signal,
          project_root: input.project_root,
        }),
        {
          ...(dependencies.gateway_dependencies ?? {}),
          deterministic_execute:
            dependencies.gateway_dependencies?.deterministic_execute ??
            ((purposeInput) => buildMockRecommendations(purposeInput.brief)),
          authorize_policy_invocation(envelope) {
            if (
              envelope.policy.invocation_origin !== "policy_triggered" ||
              envelope.policy.grant_id !== authorization.grant.grant_id ||
              envelope.policy.grant_fingerprint !==
                authorization.grant.lineage_fingerprint
            ) {
              throw new ModelInvocationGrantErrorV01(
                "model_invocation_grant_scope_mismatch",
              );
            }
            return authorization.authorization;
          },
        },
      );
    } catch (error) {
      const receipt = isModelGatewayInvocationErrorV01(error)
        ? error.receipt
        : null;
      const runReceipt = finalizePolicyPlannerRun(database, {
        input,
        receipt,
        terminal_at: strictNow(clock),
        gateway_code: isModelGatewayInvocationErrorV01(error)
          ? error.code
          : "model_gateway_transport_failed",
      });
      throw new PolicyTriggeredPlannerRunErrorV01(
        runErrorCode(receipt),
        admission.status,
        receipt,
        runReceipt,
      );
    }

    const runReceipt = finalizePolicyPlannerRun(database, {
      input,
      receipt: plannerResult.model_invocation_receipt,
      terminal_at: strictNow(clock),
      gateway_code: null,
    });
    return {
      run_version: POLICY_TRIGGERED_PLANNER_RUN_VERSION_V01,
      workspace_id: input.workspace_id,
      project_id: input.project_id,
      work_id: input.work_id,
      run_id: input.run_id,
      planner: plannerResult.planner,
      recommendations: plannerResult.recommendations,
      model_invocation_receipt: plannerResult.model_invocation_receipt,
      run_receipt: runReceipt,
      semantic_state_changed: false,
      proposal_approved: false,
      publication_performed: false,
      deployment_performed: false,
      retry_performed: false,
      external_action_performed: false,
    };
  } catch (error) {
    if (error instanceof PolicyTriggeredPlannerRunErrorV01) throw error;
    if (runCreated) {
      const receipt = finalizePolicyPlannerRun(database, {
        input,
        receipt: null,
        terminal_at: strictNow(clock),
        gateway_code: "model_gateway_transport_failed",
      });
      throw new PolicyTriggeredPlannerRunErrorV01(
        "policy_planner_finalization_failed",
        null,
        null,
        receipt,
      );
    }
    throw new PolicyTriggeredPlannerRunErrorV01(
      "policy_planner_scope_refused",
      null,
      null,
      null,
    );
  } finally {
    database.close();
  }
}

export function listIncompletePolicyTriggeredModelRunsV01(
  database: Database.Database,
  input: { project_id: string },
) {
  return database
    .prepare(
      `SELECT run_id, status, started_at, updated_at
       FROM autonomy_runs
       WHERE scope = ?
         AND json_extract(metadata_json, '$.invocation_origin') = 'policy_triggered'
         AND status NOT IN (${TERMINAL_RUN_STATUSES.map(() => "?").join(", ")})
       ORDER BY updated_at ASC, run_id ASC`,
    )
    .all(input.project_id, ...TERMINAL_RUN_STATUSES) as Array<{
    run_id: string;
    status: string;
    started_at: string | null;
    updated_at: string;
  }>;
}

function createPolicyRunLedgerRecord(
  database: Database.Database,
  input: PolicyTriggeredPlannerRunInputV01,
  grantFingerprint: string,
  startedAt: string,
): void {
  const run: AutonomyRunSummary = {
    run_id: input.run_id,
    scope: input.project_id,
    autonomy_contract_ref: "model_gateway_policy_run.v0.1",
    title: "Policy-triggered advisory Planner model step",
    status: "running",
    scheduled_for: null,
    started_at: startedAt,
    finished_at: null,
    created_at: startedAt,
    updated_at: startedAt,
    stop_reason: null,
    source_refs: buildDefaultRunnerSourceRefs({
      runner_refs: ["policy_triggered_planner_run.v0.1"],
    }),
    authority_boundary: buildDefaultRunnerAuthorityBoundary({
      notes: [
        "Direct provider calls remain forbidden; the bounded grant authorizes only the shared Model Gateway.",
        "Planner recommendations remain advisory and cannot mutate semantic state.",
      ],
    }),
    budget_snapshot: buildDefaultRunnerBudgetSnapshot({
      budget_id: `model-gateway-run-budget:${input.run_id}`,
      notes: [
        "The generic autonomy ledger grants no provider calls; model limits are enforced by the separate capability grant and Gateway receipt.",
      ],
    }),
    metadata: {
      invocation_origin: "policy_triggered",
      workspace_id: input.workspace_id,
      project_id: input.project_id,
      work_id: input.work_id,
      automation_control_revision: input.automation_control_revision,
      grant_id: input.grant_id,
      grant_fingerprint: grantFingerprint,
      model_purpose: PLANNER_MODEL_GATEWAY_PURPOSE_V01,
      automatic_retry: false,
      semantic_mutation_authorized: false,
    },
  };
  const step: AutonomyRunStepRecord = {
    step_id: `${input.run_id}.step.model-gateway`,
    run_id: input.run_id,
    step_index: 1,
    action_kind: "invoke_project_scoped_model_gateway",
    status: "running",
    title: "Invoke project-scoped Planner through Model Gateway",
    summary:
      "Run one bounded advisory Planner invocation through the shared Gateway.",
    started_at: startedAt,
    finished_at: null,
    output: {},
    error_message: null,
    created_at: startedAt,
    updated_at: startedAt,
  };
  const events: AutonomyRunEventRecord[] = [
    buildAutonomyRunEventRecord({
      run_id: input.run_id,
      event_type: "run_created",
      status: "running",
      message: "Policy-triggered Planner run record created.",
      payload: {
        workspace_id: input.workspace_id,
        project_id: input.project_id,
        work_id: input.work_id,
        semantic_mutation_authorized: false,
      },
      created_at: startedAt,
    }),
    buildAutonomyRunEventRecord({
      run_id: input.run_id,
      event_type: "run_started",
      status: "running",
      message: "Policy-triggered Planner model step started.",
      payload: { retry_count: 0, provider_race: false, failover: false },
      created_at: startedAt,
    }),
    buildAutonomyRunEventRecord({
      run_id: input.run_id,
      step_id: step.step_id,
      event_type: "step_started",
      status: "running",
      message: "Shared Model Gateway step started.",
      payload: { purpose: PLANNER_MODEL_GATEWAY_PURPOSE_V01 },
      created_at: startedAt,
    }),
  ];
  insertAutonomyRunLedgerRecord(run, [step], events, { db: database });
}

function finalizePolicyPlannerRun(
  database: Database.Database,
  input: {
    input: PolicyTriggeredPlannerRunInputV01;
    receipt: ModelInvocationReceiptV02 | null;
    terminal_at: string;
    gateway_code: string | null;
  },
): RunReceiptV01 {
  const current = readAutonomyRunLedgerRecord(input.input.run_id, {
    db: database,
  });
  if (!current) refuse("policy_planner_run_conflict");
  const existing = readRunReceiptForRun(database, input.input);
  if (isTerminalRunnerStatus(current.status)) {
    if (!existing) refuse("policy_planner_run_conflict");
    return existing;
  }
  const terminalAt = maxTimestamp(
    input.terminal_at,
    input.receipt?.finished_at ?? current.started_at ?? input.terminal_at,
  );
  const runReceipt = buildPolicyPlannerRunReceipt({
    input: input.input,
    receipt: input.receipt,
    started_at: current.started_at ?? current.created_at,
    terminal_at: terminalAt,
    gateway_code: input.gateway_code,
  });
  if (validateRunReceiptV01(runReceipt).status !== "valid") {
    refuse("policy_planner_finalization_failed");
  }
  if (existing) {
    if (existing.integrity.fingerprint !== runReceipt.integrity.fingerprint) {
      refuse("policy_planner_run_conflict");
    }
    return existing;
  }
  const lifecycle = lifecycleForReceipt(input.receipt);
  const step = current.steps[0];
  if (!step) refuse("policy_planner_finalization_failed");
  database.exec("BEGIN IMMEDIATE");
  try {
    insertVNextCoreRecordV01(database, {
      record_kind: "run_receipt",
      record_id: runReceipt.receipt_id,
      workspace_id: runReceipt.workspace_id,
      project_id: runReceipt.project_id,
      fingerprint: runReceipt.integrity.fingerprint,
      idempotency_key: runReceipt.idempotency_key,
      payload: runReceipt,
      created_at: runReceipt.recorded_at,
    });
    updateAutonomyRunStepLedgerFields(
      step.step_id,
      {
        status: lifecycle.step_status,
        finished_at: terminalAt,
        output: {
          model_invocation_count: input.receipt ? 1 : 0,
          provider_calls_used:
            input.receipt?.budget.provider_calls_used ?? 0,
          egress_attempted: input.receipt?.egress_attempted ?? false,
          semantic_state_changed: false,
        },
        error_message: null,
        updated_at: terminalAt,
      },
      { db: database },
    );
    updateAutonomyRunLedgerFields(
      input.input.run_id,
      {
        status: lifecycle.run_status,
        finished_at: terminalAt,
        updated_at: terminalAt,
        stop_reason: lifecycle.stop_reason,
        metadata: {
          ...current.metadata,
          run_receipt_id: runReceipt.receipt_id,
          run_receipt_fingerprint: runReceipt.integrity.fingerprint,
          model_invocation_count: input.receipt ? 1 : 0,
          semantic_state_changed: false,
        },
      },
      { db: database },
    );
    appendAutonomyRunLedgerEvent(
      buildAutonomyRunEventRecord({
        run_id: input.input.run_id,
        step_id: step.step_id,
        event_type:
          lifecycle.run_status === "completed"
            ? "step_completed"
            : "step_blocked",
        status: lifecycle.step_status,
        message: "Shared Model Gateway step reached a terminal state.",
        payload: {
          outcome: input.receipt?.outcome ?? "gateway_failure_without_receipt",
          provider_calls_used:
            input.receipt?.budget.provider_calls_used ?? 0,
        },
        created_at: terminalAt,
      }),
      { db: database },
    );
    appendAutonomyRunLedgerEvent(
      buildAutonomyRunEventRecord({
        run_id: input.input.run_id,
        event_type: lifecycle.event_type,
        status: lifecycle.run_status,
        message: "Policy-triggered Planner run reached a terminal state.",
        payload: {
          stop_reason: lifecycle.stop_reason,
          run_receipt_id: runReceipt.receipt_id,
          retry_performed: false,
          semantic_state_changed: false,
        },
        created_at: terminalAt,
      }),
      { db: database },
    );
    database.exec("COMMIT");
  } catch (error) {
    if (database.inTransaction) database.exec("ROLLBACK");
    throw error;
  }
  return runReceipt;
}

function buildPolicyPlannerRunReceipt(input: {
  input: PolicyTriggeredPlannerRunInputV01;
  receipt: ModelInvocationReceiptV02 | null;
  started_at: string;
  terminal_at: string;
  gateway_code: string | null;
}): RunReceiptV01 {
  const receipt = input.receipt;
  const workRef = localRef("work", input.input.work_id, input.terminal_at);
  const runRef = localRef("automation_run", input.input.run_id, input.terminal_at);
  const reporterRef = localRef(
    "automation_runtime",
    POLICY_TRIGGERED_PLANNER_RUN_VERSION_V01,
    input.terminal_at,
  );
  const modelEntry = receipt
    ? projectModelInvocationReceiptToRunReceiptEntryV02({
        receipt,
        workspace_id: input.input.workspace_id,
        project_id: input.input.project_id,
        work_id: input.input.work_id,
        run_id: input.input.run_id,
      })
    : null;
  const lifecycle = lifecycleForReceipt(receipt);
  const sourceRefs = modelEntry?.source_refs ?? [runRef, workRef];
  const providerRefs = receipt
    ? [receipt.attempted_provider_ref, receipt.attempted_model_ref].filter(
        (value): value is ExternalRefV01 => value !== null,
      )
    : [];
  return buildRunReceiptV01({
    workspace_id: input.input.workspace_id,
    project_id: input.input.project_id,
    run_id: input.input.run_id,
    work_ref: workRef,
    task_context_packet_ref: null,
    recorded_at: input.terminal_at,
    started_at: input.started_at,
    finished_at: input.terminal_at,
    execution: {
      status: lifecycle.receipt_status,
      basis: "observed",
      source_refs: [reporterRef],
    },
    verification: {
      status: "not_run",
      basis: "unknown",
      required_check_ids: [],
      source_refs: [],
    },
    reporter_ref: reporterRef,
    observer_refs: [reporterRef],
    verifier_refs: [],
    host_ref: null,
    worker_ref: reporterRef,
    model_invocations: modelEntry ? [modelEntry] : [],
    execution_environment: {
      environment_kind: "local",
      host_ref: null,
      worker_ref: reporterRef,
      operating_system: null,
      runtime_labels: ["model_gateway", "policy_triggered_planner"],
      source_refs: [reporterRef],
    },
    observations: [
      {
        observation_id: `observation:model-gateway:${input.input.run_id}`,
        observation_kind: "model_gateway_terminal_outcome",
        summary: "The bounded Model Gateway invocation reached a terminal outcome.",
        event_at: input.terminal_at,
        observed_at: input.terminal_at,
        observer_ref: reporterRef,
        trust_class: "direct_local_observation",
        source_refs: [runRef],
        related_command_ids: [],
        related_check_ids: [],
        related_artifact_refs: [],
      },
    ],
    attestations: [],
    changed_artifacts: [],
    commands: [],
    checks: [],
    skipped_checks: [],
    external_refs: [...providerRefs, ...sourceRefs],
    result_summary: {
      summary:
        lifecycle.run_status === "completed"
          ? "The bounded advisory Planner model step completed."
          : "The bounded advisory Planner model step did not complete successfully.",
      outcome: receipt?.outcome ?? "gateway_failure_without_receipt",
      limitations: [
        "Planner recommendations remain advisory and are not semantic state.",
        "The run receipt does not approve work or authorize an external action.",
      ],
    },
    blockers:
      lifecycle.run_status === "completed"
        ? []
        : [
            {
              code: input.gateway_code ?? "model_gateway_failure",
              summary: "The Model Gateway reached a non-success terminal outcome.",
              source_refs: [reporterRef],
            },
          ],
    warnings: [],
    gaps: [],
    privacy_egress: {
      data_classification: receipt?.data_classification ?? "private",
      egress_status: receipt?.egress_status ?? "unknown",
      basis: "observed",
      destination_refs:
        receipt?.egress_attempted && receipt.attempted_provider_ref
          ? [receipt.attempted_provider_ref]
          : [],
      redaction_status: receipt?.egress_attempted ? "applied" : "not_needed",
      retention_class: receipt?.retention_class ?? "none",
      raw_prompt_persisted: false,
      raw_output_persisted: false,
      raw_transcript_persisted: false,
      secret_material_persisted: false,
      source_refs: [reporterRef],
      notes: [
        "Only the bounded ModelInvocationReceipt is retained; prompt and response payloads are excluded.",
      ],
    },
    cost_usage: {
      cost_basis: "unknown",
      cost_amount: null,
      currency: null,
      usage: receipt?.usage
        ? {
            basis: "attested",
            input_units: receipt.usage.input_tokens,
            output_units: receipt.usage.output_tokens,
            total_units: receipt.usage.total_tokens,
            unit: "tokens",
          }
        : {
            basis: "unknown",
            input_units: null,
            output_units: null,
            total_units: null,
            unit: null,
          },
      source_refs: receipt?.usage ? providerRefs : [],
    },
    capability_coverage: [
      {
        capability: "project_scoped_model_invocation",
        coverage_level: "enforced",
        source_ref: receipt?.grant_lineage_ref ?? null,
        notes: [
          "A separate bounded grant authorized this one Gateway invocation only.",
        ],
      },
    ],
    source_refs: [reporterRef, ...sourceRefs],
    artifact_refs: [],
    compatibility: {
      source_contracts: [
        "policy_triggered_planner_run.v0.1",
        "model_invocation_receipt.v0.2",
        "run_receipt_model_invocation.v0.2",
      ],
      unmapped_fields: [],
      warnings: [],
      external_refs: [],
    },
    authority_notes: [
      "This receipt records operational evidence only.",
      "No semantic state, approval, publication, deployment, merge, retry, or external action is authorized.",
    ],
  });
}

function lifecycleForReceipt(receipt: ModelInvocationReceiptV02 | null): {
  run_status: AutonomyRunnerStatus;
  step_status: "completed" | "blocked" | "failed" | "cancelled";
  receipt_status: RunReceiptV01["execution"]["status"];
  stop_reason: string;
  event_type: "run_completed" | "run_blocked" | "run_cancelled" | "run_failed";
} {
  if (receipt?.status === "completed") {
    return {
      run_status: "completed",
      step_status: "completed",
      receipt_status: "completed",
      stop_reason: receipt.fallback_used
        ? "model_gateway_completed_with_fallback"
        : "model_gateway_completed",
      event_type: "run_completed",
    };
  }
  if (receipt?.status === "blocked") {
    return {
      run_status: "blocked",
      step_status: "blocked",
      receipt_status: "blocked",
      stop_reason: receipt.failure_code ?? "model_gateway_refused",
      event_type: "run_blocked",
    };
  }
  if (receipt?.status === "cancelled") {
    return {
      run_status: "cancelled",
      step_status: "cancelled",
      receipt_status: "cancelled",
      stop_reason: "model_gateway_cancelled",
      event_type: "run_cancelled",
    };
  }
  return {
    run_status: "failed",
    step_status: "failed",
    receipt_status: "failed",
    stop_reason:
      receipt?.status === "timed_out"
        ? "model_gateway_timeout"
        : receipt?.failure_code ?? "model_gateway_failed",
    event_type: "run_failed",
  };
}

function runErrorCode(
  receipt: ModelInvocationReceiptV02 | null,
): PolicyTriggeredPlannerRunErrorCodeV01 {
  if (receipt?.status === "blocked") return "policy_planner_gateway_blocked";
  if (receipt?.status === "cancelled") {
    return "policy_planner_gateway_cancelled";
  }
  if (receipt?.status === "timed_out") return "policy_planner_gateway_timeout";
  return "policy_planner_gateway_failed";
}

function readRunReceiptForRun(
  database: Database.Database,
  input: Pick<
    PolicyTriggeredPlannerRunInputV01,
    "workspace_id" | "project_id" | "run_id"
  >,
): RunReceiptV01 | null {
  const rows = database
    .prepare(
      `SELECT record_id FROM vnext_core_records
       WHERE workspace_id = ? AND project_id = ?
         AND record_kind = 'run_receipt'
         AND json_extract(payload_json, '$.run_id') = ?
       ORDER BY created_at ASC, record_id ASC
       LIMIT 2`,
    )
    .all(input.workspace_id, input.project_id, input.run_id) as Array<{
    record_id: string;
  }>;
  if (rows.length > 1) refuse("policy_planner_run_conflict");
  if (!rows[0]) return null;
  const record = readVNextCoreRecordV01(database, {
    record_kind: "run_receipt",
    record_id: rows[0].record_id,
    workspace_id: input.workspace_id,
    project_id: input.project_id,
  });
  if (!record || validateRunReceiptV01(record.payload).status !== "valid") {
    refuse("policy_planner_run_conflict");
  }
  return record.payload as RunReceiptV01;
}

function assertRunIdentityAvailable(
  database: Database.Database,
  input: PolicyTriggeredPlannerRunInputV01,
): void {
  if (
    readAutonomyRunLedgerRecord(input.run_id, { db: database }) ||
    readRunReceiptForRun(database, input)
  ) {
    refuse("policy_planner_run_conflict");
  }
}

function countActivePolicyRuns(
  database: Database.Database,
  projectId: string,
): number {
  const row = database
    .prepare(
      `SELECT COUNT(*) AS count FROM autonomy_runs
       WHERE scope = ?
         AND json_extract(metadata_json, '$.invocation_origin') = 'policy_triggered'
         AND status NOT IN (${TERMINAL_RUN_STATUSES.map(() => "?").join(", ")})`,
    )
    .get(projectId, ...TERMINAL_RUN_STATUSES) as { count: number };
  return row.count;
}

function validateRequest(
  input: PolicyTriggeredPlannerRunInputV01,
): PolicyTriggeredPlannerRunInputV01 {
  if (
    !exactDataRecord(
      input,
      [
        "workspace_id",
        "project_id",
        "work_id",
        "run_id",
        "grant_id",
        "automation_control_revision",
        "message",
        "execution_mode",
        "invocation_budget",
        "run_budget",
        "timeout_ms",
      ],
      ["cancellation_signal", "project_root"],
    ) ||
    !CANONICAL_WORKSPACE.test(input.workspace_id) ||
    !CANONICAL_PROJECT.test(input.project_id) ||
    !SAFE_IDENTIFIER.test(input.work_id) ||
    !SAFE_IDENTIFIER.test(input.run_id) ||
    !SAFE_IDENTIFIER.test(input.grant_id) ||
    !Number.isSafeInteger(input.automation_control_revision) ||
    input.automation_control_revision < 1 ||
    typeof input.message !== "string" ||
    input.message.trim().length < 1 ||
    input.message.length > MAX_MESSAGE_CHARACTERS ||
    (input.execution_mode !== "live" &&
      input.execution_mode !== "deterministic") ||
    !validBudget(input.invocation_budget, input.execution_mode) ||
    !validRunBudget(input.run_budget) ||
    !Number.isSafeInteger(input.timeout_ms) ||
    input.timeout_ms < 1 ||
    input.timeout_ms > 60_000 ||
    (input.cancellation_signal !== undefined &&
      !(input.cancellation_signal instanceof AbortSignal)) ||
    (input.project_root !== undefined && !validProjectRoot(input.project_root))
  ) {
    refuse("policy_planner_request_invalid");
  }
  return { ...input, message: input.message.trim() };
}

function safelyValidateRequest(
  input: PolicyTriggeredPlannerRunInputV01,
): PolicyTriggeredPlannerRunInputV01 {
  try {
    return validateRequest(input);
  } catch (error) {
    if (error instanceof PolicyTriggeredPlannerRunErrorV01) throw error;
    throw new PolicyTriggeredPlannerRunErrorV01(
      "policy_planner_request_invalid",
      null,
      null,
      null,
    );
  }
}

function validProjectRoot(value: unknown): value is NonNullable<
  PolicyTriggeredPlannerRunInputV01["project_root"]
> {
  if (!exactDataRecord(value, ["path_flavor", "normalized_path"])) return false;
  const flavor = Object.getOwnPropertyDescriptor(value, "path_flavor");
  const normalized = Object.getOwnPropertyDescriptor(value, "normalized_path");
  return Boolean(
    flavor &&
      "value" in flavor &&
      (flavor.value === "posix" || flavor.value === "win32") &&
      normalized &&
      "value" in normalized &&
      typeof normalized.value === "string" &&
      normalized.value.length > 0 &&
      normalized.value.length <= 8_192 &&
      !normalized.value.includes("\0"),
  );
}

function validBudget(
  budget: ModelGatewayBudgetV01,
  mode: ModelGatewayExecutionModeV01,
): boolean {
  return Boolean(
    exactDataRecord(budget, [
      "max_input_bytes",
      "max_output_tokens",
      "max_provider_calls",
    ]) &&
      Number.isSafeInteger(budget.max_input_bytes) &&
      budget.max_input_bytes > 0 &&
      budget.max_input_bytes <= 98_304 &&
      Number.isSafeInteger(budget.max_output_tokens) &&
      budget.max_output_tokens > 0 &&
      budget.max_output_tokens <= 4_096 &&
      budget.max_provider_calls === (mode === "live" ? 1 : 0),
  );
}

function validRunBudget(
  budget: PolicyTriggeredPlannerRunInputV01["run_budget"],
): boolean {
  return Boolean(
    exactDataRecord(budget, [
      "max_input_bytes",
      "max_output_tokens",
      "max_provider_calls",
      "max_timeout_ms",
    ]) &&
      Number.isSafeInteger(budget.max_input_bytes) &&
      budget.max_input_bytes > 0 &&
      budget.max_input_bytes <= 98_304 &&
      Number.isSafeInteger(budget.max_output_tokens) &&
      budget.max_output_tokens > 0 &&
      budget.max_output_tokens <= 4_096 &&
      (budget.max_provider_calls === 0 || budget.max_provider_calls === 1) &&
      Number.isSafeInteger(budget.max_timeout_ms) &&
      budget.max_timeout_ms > 0 &&
      budget.max_timeout_ms <= 60_000,
  );
}

function exactDataRecord(
  value: unknown,
  requiredKeys: readonly string[],
  optionalKeys: readonly string[] = [],
): value is Record<string, unknown> {
  if (
    typeof value !== "object" ||
    value === null ||
    Array.isArray(value) ||
    (Object.getPrototypeOf(value) !== Object.prototype &&
      Object.getPrototypeOf(value) !== null)
  ) {
    return false;
  }
  const allowed = new Set([...requiredKeys, ...optionalKeys]);
  return (
    requiredKeys.every((key) => Object.hasOwn(value, key)) &&
    Reflect.ownKeys(value).every((key) => {
      if (typeof key !== "string" || !allowed.has(key)) return false;
      const descriptor = Object.getOwnPropertyDescriptor(value, key);
      return Boolean(descriptor && "value" in descriptor);
    })
  );
}

function projectRootMatches(
  input: PolicyTriggeredPlannerRunInputV01,
  canonicalRoot: {
    path_flavor: "posix" | "win32";
    normalized_path: string;
  },
): boolean {
  return (
    !input.project_root ||
    (input.project_root.path_flavor === canonicalRoot.path_flavor &&
      input.project_root.normalized_path === canonicalRoot.normalized_path)
  );
}

function localRef(
  refType: string,
  externalId: string,
  observedAt: string,
): ExternalRefV01 {
  return {
    ref_version: "external_ref.v0.1",
    ref_type: refType,
    external_id: externalId,
    observed_at: observedAt,
    trust_class: "direct_local_observation",
  };
}

function maxTimestamp(left: string, right: string): string {
  return Date.parse(left) >= Date.parse(right) ? left : right;
}

function strictNow(now: () => Date): string {
  const value = now();
  if (!(value instanceof Date) || !Number.isFinite(value.getTime())) {
    refuse("policy_planner_request_invalid");
  }
  return value.toISOString();
}

function refuse(code: PolicyTriggeredPlannerRunErrorCodeV01): never {
  throw new PolicyTriggeredPlannerRunErrorV01(code, null, null, null);
}
