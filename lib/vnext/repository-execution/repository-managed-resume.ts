import type Database from "better-sqlite3";

import {
  appendAutonomyRunLedgerEvent,
  buildAutonomyRunEventRecord,
  readAutonomyRunLedgerRecord,
  updateAutonomyRunLedgerFields,
  updateAutonomyRunStepLedgerFields,
} from "@/lib/autonomy/runner-ledger";
import { readCanonicalProjectWithRootV01 } from "@/lib/vnext/persistence/project-identity-registry";
import {
  insertRepositoryManagedResumeAttemptInsideTransactionV01,
  insertRepositoryManagedResumeRuntimeClaimInsideTransactionV01,
  listRepositoryRunResumeCheckpointsV01,
  readOpenRepositoryExecutionDecisionV01,
  readPhysicalRootBaselineV01,
  readRepositoryExecutionDecisionRequestV01,
  readRepositoryManagedResumeAttemptForCheckpointV01,
  readRepositoryManagedResumeAttemptForDecisionV01,
  readRepositoryManagedResumeAttemptV01,
  readRepositoryManagedResumeCancellationV01,
  readRepositoryManagedResumeRuntimeClaimV01,
  transferRepositoryManagedResumeRuntimeClaimInsideTransactionV01,
  transitionRepositoryManagedResumeAttemptInsideTransactionV01,
  transitionRepositoryManagedResumeRuntimeClaimInsideTransactionV01,
} from "@/lib/vnext/persistence/repository-execution-store";
import {
  canonicalizeProtocolValueV01,
  createProtocolSha256V01,
} from "@/lib/vnext/protocol-primitives";
import {
  assertGrantedRepositoryExecutionDecisionInsideTransactionV01,
  consumeRepositoryExecutionDecisionInsideTransactionV01,
  createRepositoryExecutionDecisionRequestV01,
  fingerprintProjectRootBindingV01,
  inspectPhysicalRootForExecutionV01,
  readExpectedDatabaseAdmissionStateV01,
  type RepositoryExecutionDependenciesV01,
} from "@/lib/vnext/repository-execution/repository-execution";
import {
  readRepositoryRunResumeEligibilityV01,
  requireConsumedRepositoryRunAttachmentV01,
  selectCanonicalRepositoryAttachmentRunV01,
} from "@/lib/vnext/repository-execution/repository-run-resume";
import { inspectRepositoryWorktreeV01 } from "@/lib/vnext/repository-execution/worktree-observation";
import type { LiveNativeHostRunServiceV01 } from "@/lib/vnext/runtime/live-native-host-run-service";
import type { VNextLocalOperatorPilotConfigV01 } from "@/lib/vnext/runtime/local-operator-session";
import { validateExternalRefV01 } from "@/lib/vnext/task-context-packet";
import type { AutonomyRunRecord } from "@/types/autonomy-runner-execution";
import type { ExternalRefV01 } from "@/types/vnext/external-ref";
import type {
  NativeHostRepositoryDelegationContextV01,
  NativeHostRepositoryResumeContextV01,
  NativeHostResumeBindingV01,
} from "@/types/vnext/native-host-adapter";
import {
  REPOSITORY_MANAGED_RESUME_ATTEMPT_VERSION_V01,
  REPOSITORY_MANAGED_RESUME_RUNTIME_CLAIM_VERSION_V01,
  REPOSITORY_MANAGED_RESUME_PREPARATION_VERSION_V01,
  REPOSITORY_MANAGED_RESUME_VERSION_V01,
  type RepositoryManagedResumeAttemptV01,
  type RepositoryManagedResumeAuthorityV01,
  type RepositoryManagedResumeExpectedStateV01,
  type RepositoryManagedResumePreparationV01,
  type RepositoryManagedResumeResultV01,
  type RepositoryManagedResumeRuntimeClaimV01,
} from "@/types/vnext/repository-managed-resume";
import type { RepositoryRunResumeCheckpointV01 } from "@/types/vnext/repository-run-resume";

const RESUME_DECISION_MAX_AGE_MS = 15 * 60 * 1_000;

export class RepositoryManagedResumeErrorV01 extends Error {
  constructor(readonly code: string, readonly status = 409) {
    super(code);
    this.name = "RepositoryManagedResumeErrorV01";
  }
}

export interface RepositoryManagedResumeDependenciesV01
  extends RepositoryExecutionDependenciesV01 {
  platform?: NodeJS.Platform;
  before_admission_transaction?: () => void;
  after_attempt_insert_inside_transaction?: () => void;
  after_run_update_inside_transaction?: () => void;
  after_step_update_inside_transaction?: () => void;
  after_event_append_inside_transaction?: () => void;
  after_decision_consume_inside_transaction?: () => void;
  after_admission_commit?: () => void | Promise<void>;
  after_post_commit_launch_gate?: () => void | Promise<void>;
  before_invocation_marker?: () => void;
  after_invocation_marker?: () => void;
}

interface ResumeSourceV01 {
  run: AutonomyRunRecord;
  attachment: ReturnType<typeof requireConsumedRepositoryRunAttachmentV01>;
  checkpoint: RepositoryRunResumeCheckpointV01;
  registration: NonNullable<ReturnType<typeof readCanonicalProjectWithRootV01>>;
  expected_state_base: Omit<
    RepositoryManagedResumeExpectedStateV01,
    "requested_at" | "expires_at"
  >;
  repository_delegation_context: NativeHostRepositoryDelegationContextV01;
  resume_binding: NativeHostResumeBindingV01;
}

const READ_AUTHORITY = Object.freeze({
  decision_request_created: false,
  decision_grant_consumed: false,
  resume_attempt_created: false,
  controller_generation_created: false,
  worker_started: false,
  provider_resume_may_occur: false,
  provider_thread_start_allowed: false,
  new_run_or_attachment_allowed: false,
  arbitrary_network_access_granted: false,
  github_authority_granted: false,
  release_authority_granted: false,
  semantic_authority_granted: false,
  approval_decided: false,
  review_decision_created: false,
  transition_created: false,
  accepted_state_mutated: false,
  work_closed: false,
}) satisfies RepositoryManagedResumeAuthorityV01;

export async function prepareRepositoryManagedResumeV01(
  db: Database.Database,
  input: { config: VNextLocalOperatorPilotConfigV01 },
  service: LiveNativeHostRunServiceV01,
  dependencies: RepositoryManagedResumeDependenciesV01 = {},
): Promise<RepositoryManagedResumePreparationV01> {
  const now = strictNowV01(dependencies.now);
  const observed = await observeResumeReadySourceV01(
    db,
    input.config,
    service,
    dependencies,
    now,
  );
  if ("preparation" in observed) return observed.preparation;
  const existingAttempt = readRepositoryManagedResumeAttemptForCheckpointV01(
    db,
    {
      run_id: observed.run.run_id,
      checkpoint_fingerprint: observed.checkpoint.checkpoint_fingerprint,
    },
  );
  if (existingAttempt) {
    return blockedPreparationV01(
      "reconciliation_required",
      "This checkpoint already has one durable resume attempt; review its exact state.",
      observed,
    );
  }
  const existingDecision = readOpenRepositoryExecutionDecisionV01(db, {
    workspace_id: input.config.workspace_id,
    project_id: input.config.project_id,
    action: "resume_repository_managed_delegation",
  });
  let requestedAt = now;
  let expiresAt = new Date(
    Date.parse(requestedAt) + RESUME_DECISION_MAX_AGE_MS,
  ).toISOString();
  if (
    existingDecision &&
    Date.parse(existingDecision.expires_at) > Date.parse(now)
  ) {
    try {
      const expected = parseExpectedStateV01(existingDecision.expected_state_json);
      const {
        requested_at: existingRequestedAt,
        expires_at: existingExpiresAt,
        ...existingBase
      } = expected;
      if (
        canonicalizeProtocolValueV01(existingBase) ===
        canonicalizeProtocolValueV01(observed.expected_state_base)
      ) {
        requestedAt = existingRequestedAt;
        expiresAt = existingExpiresAt;
      }
    } catch {
      // A malformed request is never replayed. The decision owner supersedes
      // it when the exact expected-state fingerprint differs.
    }
  }
  const expectedState: RepositoryManagedResumeExpectedStateV01 = {
    ...observed.expected_state_base,
    requested_at: requestedAt,
    expires_at: expiresAt,
  };
  const decision = createRepositoryExecutionDecisionRequestV01(db, {
    action: "resume_repository_managed_delegation",
    workspace_id: input.config.workspace_id,
    project_id: input.config.project_id,
    expected_state: { ...expectedState },
  }, {
    now: () => requestedAt,
    max_age_ms: RESUME_DECISION_MAX_AGE_MS,
  });
  return {
    preparation_version: REPOSITORY_MANAGED_RESUME_PREPARATION_VERSION_V01,
    status: "decision_required",
    ordinary_text:
      "Resume this exact managed run from its last confirmed operation? Confirm once in Browser before continuing.",
    project: {
      project_id: observed.run.scope,
      display_name: observed.registration.project.display_name,
    },
    run_id: observed.run.run_id,
    attachment_id: observed.attachment.attachment_id,
    attachment_binding_fingerprint: observed.attachment.binding_fingerprint,
    expected_controller_generation:
      observed.expected_state_base.expected_next_controller_generation,
    expected_run_control_revision:
      observed.expected_state_base.run_control_revision,
    expected_state_fingerprint: decision.expected_state_fingerprint,
    decision_request: decision,
    expires_at: decision.expires_at,
    authority: { ...READ_AUTHORITY, decision_request_created: true },
  };
}

export async function resumeRepositoryManagedDelegationV01(
  db: Database.Database,
  input: {
    config: VNextLocalOperatorPilotConfigV01;
    run_id: string;
    attachment_id: string;
    expected_attachment_binding_fingerprint: string;
    expected_state_fingerprint: string;
    expected_controller_generation: number;
    expected_run_control_revision: number;
    decision_request_fingerprint: string;
    decision_grant_fingerprint: string;
  },
  service: LiveNativeHostRunServiceV01,
  dependencies: RepositoryManagedResumeDependenciesV01 = {},
): Promise<RepositoryManagedResumeResultV01> {
  assertResumeInputV01(input);
  if ((dependencies.platform ?? process.platform) !== "darwin") {
    return nonMutatingResultV01(
      "blocked",
      "Explicit repository resume is supported only on verified local macOS filesystems.",
      input,
      service,
    );
  }
  const now = strictNowV01(dependencies.now);
  const existing = readRepositoryManagedResumeAttemptForDecisionV01(
    db,
    input.decision_request_fingerprint,
  );
  if (existing) {
    assertAttemptInputV01(existing, input);
    return replayOrLaunchAttemptV01(
      db,
      input.config,
      existing,
      service,
      dependencies,
    );
  }
  const observed = await observeResumeReadySourceV01(
    db,
    input.config,
    service,
    dependencies,
    now,
  );
  if ("preparation" in observed) {
    const raced = readRepositoryManagedResumeAttemptForDecisionV01(
      db,
      input.decision_request_fingerprint,
    );
    if (raced) {
      assertAttemptInputV01(raced, input);
      return replayOrLaunchAttemptV01(
        db,
        input.config,
        raced,
        service,
        dependencies,
      );
    }
    return nonMutatingResultV01(
      observed.preparation.status === "active_owned"
        ? "active_owned"
        : observed.preparation.status === "approval_pending"
          ? "approval_pending"
          : observed.preparation.status === "reconciliation_required"
            ? "reconciliation_required"
            : "blocked",
      observed.preparation.ordinary_text,
      input,
      service,
    );
  }
  const concurrentlyAdmitted = readRepositoryManagedResumeAttemptForDecisionV01(
    db,
    input.decision_request_fingerprint,
  );
  if (concurrentlyAdmitted) {
    assertAttemptInputV01(concurrentlyAdmitted, input);
    return replayOrLaunchAttemptV01(
      db,
      input.config,
      concurrentlyAdmitted,
      service,
      dependencies,
    );
  }
  assertInputMatchesSourceV01(input, observed);
  const decision = readRepositoryExecutionDecisionRequestV01(
    db,
    input.decision_request_fingerprint,
  );
  const expectedState = parseExpectedStateV01(decision?.expected_state_json);
  if (
    !decision ||
    decision.expected_state_fingerprint !== input.expected_state_fingerprint ||
    canonicalizeProtocolValueV01(expectedState) !==
      canonicalizeProtocolValueV01({
        ...observed.expected_state_base,
        requested_at: expectedState.requested_at,
        expires_at: expectedState.expires_at,
      })
  ) {
    refuse("repository_managed_resume_expected_state_mismatch");
  }
  const racedAttempt = readRepositoryManagedResumeAttemptForDecisionV01(
    db,
    input.decision_request_fingerprint,
  );
  if (racedAttempt) {
    assertAttemptInputV01(racedAttempt, input);
    return replayOrLaunchAttemptV01(
      db,
      input.config,
      racedAttempt,
      service,
      dependencies,
    );
  }
  dependencies.before_admission_transaction?.();
  db.exec("BEGIN IMMEDIATE");
  let attempt!: RepositoryManagedResumeAttemptV01;
  try {
    const granted = assertGrantedRepositoryExecutionDecisionInsideTransactionV01(
      db,
      {
        action: "resume_repository_managed_delegation",
        workspace_id: input.config.workspace_id,
        project_id: input.config.project_id,
        expected_state_fingerprint: input.expected_state_fingerprint,
        decision_request_fingerprint: input.decision_request_fingerprint,
        decision_grant_fingerprint: input.decision_grant_fingerprint,
        now,
      },
    );
    const exact = requireExactDatabaseSourceV01(
      db,
      input.config,
      observed,
      service,
    );
    const resumedGeneration = exact.checkpoint.controller_generation + 1;
    const admittedRunRevision = numberV01(exact.run.metadata.control_revision) + 1;
    const step = exact.run.steps.find(
      (candidate) => candidate.step_id === exact.checkpoint.step_id,
    );
    if (!step) refuse("repository_managed_resume_step_missing");
    const admittedStepRevision = numberV01(step.output.control_revision) + 1;
    const runtime = service.readRepositoryResumeRuntimeClaimV01();
    const attemptMaterial = {
      attempt_version: REPOSITORY_MANAGED_RESUME_ATTEMPT_VERSION_V01,
      workspace_id: input.config.workspace_id,
      project_id: input.config.project_id,
      run_id: exact.run.run_id,
      attachment_id: exact.attachment.attachment_id,
      attachment_binding_fingerprint: exact.attachment.binding_fingerprint,
      checkpoint_fingerprint: exact.checkpoint.checkpoint_fingerprint,
      checkpoint_version: exact.checkpoint.checkpoint_version,
      prior_controller_generation: exact.checkpoint.controller_generation,
      resumed_controller_generation: resumedGeneration,
      decision_request_fingerprint: granted.request_fingerprint,
      decision_grant_fingerprint: input.decision_grant_fingerprint,
      expected_state_fingerprint: input.expected_state_fingerprint,
      admitted_run_control_revision: admittedRunRevision,
      admitted_step_control_revision: admittedStepRevision,
      attempt_state: "admitted_not_invoked" as const,
      final_outcome: null,
      admitted_at: now,
      provider_invocation_started_at: null,
      settled_at: null,
      updated_at: now,
    };
    attempt = {
      ...attemptMaterial,
      // Admission observations remain for compatibility, but execution ownership
      // is exclusively the mutable runtime claim below.
      runtime_instance_fingerprint: runtime.runtime_instance_fingerprint,
      runtime_generation_fingerprint: runtime.runtime_generation_fingerprint,
      attempt_fingerprint: createProtocolSha256V01(
        canonicalizeProtocolValueV01(attemptMaterial),
      ),
    };
    insertRepositoryManagedResumeAttemptInsideTransactionV01(db, attempt);
    insertRepositoryManagedResumeRuntimeClaimInsideTransactionV01(db, {
      claim_version: REPOSITORY_MANAGED_RESUME_RUNTIME_CLAIM_VERSION_V01,
      attempt_fingerprint: attempt.attempt_fingerprint,
      runtime_instance_fingerprint: runtime.runtime_instance_fingerprint,
      runtime_generation_fingerprint: runtime.runtime_generation_fingerprint,
      claim_revision: 1,
      claim_lifecycle: "claimed",
      claimed_at: now,
      updated_at: now,
    });
    dependencies.after_attempt_insert_inside_transaction?.();
    updateAutonomyRunLedgerFields(exact.run.run_id, {
      status: "starting",
      stop_reason: null,
      updated_at: now,
      metadata: {
        ...exact.run.metadata,
        control_revision: admittedRunRevision,
        controller_generation: resumedGeneration,
        runtime_instance_fingerprint: runtime.runtime_instance_fingerprint,
        runtime_generation_fingerprint: runtime.runtime_generation_fingerprint,
        repository_resume_attempt_fingerprint: attempt.attempt_fingerprint,
        repository_resume_runtime_claim_revision: 1,
        repository_resume_checkpoint_fingerprint:
          exact.checkpoint.checkpoint_fingerprint,
        repository_resume_step_id: exact.checkpoint.step_id,
        provider_resume_invocation_started: false,
        reconciliation_required: false,
        public_reason: null,
      },
    }, { db });
    dependencies.after_run_update_inside_transaction?.();
    updateAutonomyRunStepLedgerFields(step.step_id, {
      status: "running",
      error_message: null,
      updated_at: now,
      output: {
        ...step.output,
        control_revision: admittedStepRevision,
        repository_resume_attempt_fingerprint: attempt.attempt_fingerprint,
      },
    }, { db });
    dependencies.after_step_update_inside_transaction?.();
    appendAutonomyRunLedgerEvent(buildAutonomyRunEventRecord({
      run_id: exact.run.run_id,
      step_id: step.step_id,
      event_type: "run_resumed",
      status: "starting",
      message:
        "One exact Browser-confirmed same-run resume attempt was durably admitted.",
      payload: {
        control_revision: admittedRunRevision,
        controller_generation: resumedGeneration,
        automatic_retry: false,
        provider_resume_invoked: false,
      },
      created_at: now,
    }), { db });
    dependencies.after_event_append_inside_transaction?.();
    consumeRepositoryExecutionDecisionInsideTransactionV01(db, {
      request: granted,
      consumed_at: now,
      result_fingerprint: attempt.attempt_fingerprint,
    });
    dependencies.after_decision_consume_inside_transaction?.();
    db.exec("COMMIT");
  } catch (error) {
    if (db.inTransaction) db.exec("ROLLBACK");
    throw normalizeErrorV01(error);
  }
  try {
    await dependencies.after_admission_commit?.();
  } catch {
    return resultV01(
      "blocked",
      "The resume attempt was admitted, but this request did not start its worker. Exact replay may continue the same attempt.",
      attempt,
      service,
      input.config,
      false,
    );
  }
  return replayOrLaunchAttemptV01(
    db,
    input.config,
    attempt,
    service,
    dependencies,
  );
}

async function replayOrLaunchAttemptV01(
  db: Database.Database,
  config: VNextLocalOperatorPilotConfigV01,
  attempt: RepositoryManagedResumeAttemptV01,
  service: LiveNativeHostRunServiceV01,
  dependencies: RepositoryManagedResumeDependenciesV01,
): Promise<RepositoryManagedResumeResultV01> {
  let runtimeClaim = readRepositoryManagedResumeRuntimeClaimV01(
    db,
    attempt.attempt_fingerprint,
  );
  if (!runtimeClaim) {
    markAttemptReconciliationV01(db, attempt, strictNowV01(dependencies.now));
    return resultV01(
      "reconciliation_required",
      "The resume attempt has no exact runtime claim; provider resume will not be invoked.",
      attempt, service, config, false,
    );
  }
  const controller = service.readRepositoryControllerObservationV01(
    config,
    attempt.run_id,
  );
  if (controller.owned) {
    if (
      controller.controller_generation !== attempt.resumed_controller_generation ||
      controller.runtime_instance_fingerprint !==
        runtimeClaim.runtime_instance_fingerprint ||
      controller.runtime_generation_fingerprint !==
        runtimeClaim.runtime_generation_fingerprint
    ) {
      refuse("repository_managed_resume_controller_conflict");
    }
    return resultV01(
      "exact_replay",
      "The exact resumed controller already owns this run.",
      attempt,
      service,
      config,
      false,
    );
  }
  if (
    attempt.attempt_state === "provider_resume_invocation_started" ||
    attempt.attempt_state === "controller_owned" ||
    attempt.attempt_state === "reconciliation_required"
  ) {
    return resultV01(
      "reconciliation_required",
      "Provider resume may already have started; it will not be invoked again.",
      attempt,
      service,
      config,
      false,
    );
  }
  if (readRepositoryManagedResumeCancellationV01(db, attempt.attempt_fingerprint)) {
    return resultV01(
      "reconciliation_required",
      "Cancellation is durably recorded for this resume attempt; it cannot be reacquired.",
      attempt, service, config, false,
    );
  }
  if (attempt.attempt_state === "settled") {
    return resultV01(
      "exact_replay",
      "This exact resume attempt is already settled.",
      attempt,
      service,
      config,
      false,
    );
  }
  const runtime = service.readRepositoryResumeRuntimeClaimV01();
  if (
    runtimeClaim.runtime_instance_fingerprint !== runtime.runtime_instance_fingerprint ||
    runtimeClaim.runtime_generation_fingerprint !== runtime.runtime_generation_fingerprint
  ) {
    const transferred = await transferRuntimeClaimV01(
      db, config, attempt, runtimeClaim, service, dependencies,
    );
    if (!transferred) {
      const winner = service.readRepositoryControllerObservationV01(config, attempt.run_id);
      return resultV01(
        winner.owned ? "exact_replay" : "reconciliation_required",
        winner.owned
          ? "The exact resumed controller already owns this run."
          : "Another verified runtime changed the resume claim; provider resume was not invoked by this request.",
        attempt, service, config, false,
      );
    }
    runtimeClaim = transferred;
  }
  let source: ResumeSourceV01;
  try {
    source = await requireAdmittedAttemptSourceV01(
      db,
      config,
      attempt,
      service,
      dependencies,
      runtimeClaim,
    );
    await dependencies.after_post_commit_launch_gate?.();
  } catch {
    const current = readRepositoryManagedResumeAttemptV01(
      db,
      attempt.attempt_fingerprint,
    ) ?? attempt;
    const racedController = service.readRepositoryControllerObservationV01(
      config,
      attempt.run_id,
    );
    const exactRacedController = racedController.owned &&
      racedController.controller_generation ===
        attempt.resumed_controller_generation &&
      racedController.runtime_instance_fingerprint ===
        runtimeClaim.runtime_instance_fingerprint &&
      racedController.runtime_generation_fingerprint ===
        runtimeClaim.runtime_generation_fingerprint;
    if (
      current.attempt_state === "settled" ||
      ((current.attempt_state === "provider_resume_invocation_started" ||
        current.attempt_state === "controller_owned") && exactRacedController)
    ) {
      return resultV01(
        "exact_replay",
        current.attempt_state === "settled"
          ? "This exact resume attempt is already settled."
          : "The exact resumed controller already owns this run.",
        current,
        service,
        config,
        false,
      );
    }
    return resultV01(
      current.attempt_state === "admitted_not_invoked"
        ? "blocked"
        : "reconciliation_required",
      current.attempt_state === "admitted_not_invoked"
        ? "The admitted resume attempt remains available, but this request did not start its worker."
        : "The admitted resume claim changed after provider invocation became uncertain; review it before continuing.",
      attempt,
      service,
      config,
      false,
    );
  }
  const resumeContext = repositoryResumeContextV01(attempt);
  const claim = repositoryResumeClaimV01(source, attempt, runtimeClaim);
  try {
    const launched = await service.launchAdmittedRepositoryResumeV01({
      config,
      repository_delegation_context: source.repository_delegation_context,
      repository_resume_context: resumeContext,
      resume_binding: source.resume_binding,
      claim,
      before_adapter_invoke: async () => {
        await assertImmediateInvocationGateAndMarkV01(
          db,
          config,
          attempt,
          service,
          dependencies,
          runtimeClaim,
        );
      },
    });
    return resultV01(
      launched.status === "exact_replay" ? "exact_replay" : "accepted",
      launched.status === "exact_replay"
        ? "The exact resumed controller already owns this run."
        : "The same managed run resumed from its last confirmed operation.",
      attempt,
      service,
      config,
      launched.status === "accepted",
    );
  } catch (error) {
    const current = readRepositoryManagedResumeAttemptV01(
      db,
      attempt.attempt_fingerprint,
    );
    if (current?.attempt_state !== "admitted_not_invoked") {
      markAttemptReconciliationV01(
        db,
        current ?? attempt,
        strictNowV01(dependencies.now),
      );
    }
    return resultV01(
      current?.attempt_state === "admitted_not_invoked"
        ? "blocked"
        : "reconciliation_required",
      current?.attempt_state === "admitted_not_invoked"
        ? "The admitted resume attempt remains available, but this request did not start its worker."
        : "Provider resume may have started; this request will not invoke it again.",
      current ?? attempt,
      service,
      config,
      false,
    );
  }
}

async function transferRuntimeClaimV01(
  db: Database.Database,
  config: VNextLocalOperatorPilotConfigV01,
  attempt: RepositoryManagedResumeAttemptV01,
  priorClaim: RepositoryManagedResumeRuntimeClaimV01,
  service: LiveNativeHostRunServiceV01,
  dependencies: RepositoryManagedResumeDependenciesV01,
): Promise<RepositoryManagedResumeRuntimeClaimV01 | null> {
  if (
    attempt.attempt_state !== "admitted_not_invoked" ||
    attempt.provider_invocation_started_at != null ||
    priorClaim.claim_lifecycle !== "claimed"
  ) return null;
  const runtime = service.readRepositoryResumeRuntimeClaimV01();
  await requireAdmittedAttemptSourceV01(
    db, config, attempt, service, dependencies, priorClaim, true,
  );
  const now = strictNowV01(dependencies.now);
  db.exec("BEGIN IMMEDIATE");
  try {
    const currentAttempt = readRepositoryManagedResumeAttemptV01(db, attempt.attempt_fingerprint);
    const run = readAutonomyRunLedgerRecord(attempt.run_id, { db });
    const controller = service.readRepositoryControllerObservationV01(config, attempt.run_id);
    const attachment = run ? requireConsumedRepositoryRunAttachmentV01(db, run) : null;
    const checkpoint = listRepositoryRunResumeCheckpointsV01(db, {
      ...config,
      run_id: attempt.run_id,
    }).at(-1);
    const step = run?.steps.find((candidate) => candidate.step_id === checkpoint?.step_id);
    const selected = selectCanonicalRepositoryAttachmentRunV01(db, config);
    const registration = readCanonicalProjectWithRootV01(db, config);
    const baseline = checkpoint
      ? readPhysicalRootBaselineV01(db, {
          ...config,
          node_scope_fingerprint: checkpoint.node_scope_fingerprint,
        })
      : null;
    const databaseState = checkpoint
      ? readExpectedDatabaseAdmissionStateV01(db, {
          ...config,
          node_scope_fingerprint: checkpoint.node_scope_fingerprint,
        })
      : null;
    const expected = parseExpectedStateV01(
      readRepositoryExecutionDecisionRequestV01(
        db,
        attempt.decision_request_fingerprint,
      )?.expected_state_json,
    );
    const thread = externalRefForFingerprintV01(run?.metadata.host_thread_ref, "host_thread");
    const turn = externalRefForFingerprintV01(run?.metadata.host_turn_ref, "host_turn");
    if (
      !currentAttempt || currentAttempt.attempt_state !== "admitted_not_invoked" ||
      currentAttempt.provider_invocation_started_at != null || !run ||
      !attachment || !checkpoint || !step || !registration || !baseline ||
      !databaseState || !thread || !turn || run.status !== "starting" ||
      controller.owned || run.metadata.pending_approval != null ||
      readRepositoryManagedResumeCancellationV01(db, attempt.attempt_fingerprint) != null ||
      selected?.run_id !== run.run_id ||
      attachment.attachment_id !== attempt.attachment_id ||
      attachment.binding_fingerprint !== attempt.attachment_binding_fingerprint ||
      checkpoint.checkpoint_fingerprint !== attempt.checkpoint_fingerprint ||
      checkpoint.event_high_water_mark !== expected.checkpoint_event_high_water_mark ||
      checkpoint.step_high_water_mark !== expected.checkpoint_step_high_water_mark ||
      checkpoint.effect_ledger_high_water_mark !== expected.checkpoint_effect_high_water_mark ||
      checkpoint.controller_generation !== attempt.prior_controller_generation ||
      numberV01(run.metadata.controller_generation) !== attempt.resumed_controller_generation ||
      numberV01(run.metadata.control_revision) !== attempt.admitted_run_control_revision ||
      numberV01(step.output.control_revision) !== attempt.admitted_step_control_revision ||
      run.metadata.repository_resume_attempt_fingerprint !== attempt.attempt_fingerprint ||
      run.metadata.repository_execution_envelope_fingerprint !== expected.execution_envelope_fingerprint ||
      run.metadata.packet_id !== expected.packet_id ||
      run.metadata.packet_fingerprint !== expected.packet_fingerprint ||
      databaseState.current_work_fingerprint !== expected.current_work_fingerprint ||
      fingerprintProjectRootBindingV01(registration.root_binding) !== expected.root_binding_fingerprint ||
      baseline.baseline_fingerprint !== expected.physical_root_baseline_fingerprint ||
      createProtocolSha256V01(canonicalizeProtocolValueV01(thread)) !==
        expected.provider_thread_binding_fingerprint ||
      createProtocolSha256V01(canonicalizeProtocolValueV01(turn)) !==
        expected.provider_turn_binding_fingerprint ||
      runtime.capability.adapter_version !== expected.adapter_version ||
      runtime.capability.capability_version !== expected.capability_version ||
      runtime.capability.provider_resume_binding_version !==
        expected.provider_resume_binding_version ||
      !runtime.capability.resumable_after_detach
    ) {
      db.exec("ROLLBACK");
      return null;
    }
    requireConsumedResumeDecisionV01(db, attempt);
    const transferred = transferRepositoryManagedResumeRuntimeClaimInsideTransactionV01(db, {
      attempt_fingerprint: attempt.attempt_fingerprint,
      expected_claim_revision: priorClaim.claim_revision,
      expected_runtime_instance_fingerprint: priorClaim.runtime_instance_fingerprint,
      expected_runtime_generation_fingerprint: priorClaim.runtime_generation_fingerprint,
      runtime_instance_fingerprint: runtime.runtime_instance_fingerprint,
      runtime_generation_fingerprint: runtime.runtime_generation_fingerprint,
      claimed_at: now,
    });
    if (!transferred) {
      db.exec("ROLLBACK");
      return null;
    }
    updateAutonomyRunLedgerFields(run.run_id, {
      updated_at: now,
      metadata: {
        ...run.metadata,
        runtime_instance_fingerprint: transferred.runtime_instance_fingerprint,
        runtime_generation_fingerprint: transferred.runtime_generation_fingerprint,
        repository_resume_runtime_claim_revision: transferred.claim_revision,
      },
    }, { db });
    db.exec("COMMIT");
    return transferred;
  } catch (error) {
    if (db.inTransaction) db.exec("ROLLBACK");
    throw error;
  }
}

function requireConsumedResumeDecisionV01(
  db: Database.Database,
  attempt: RepositoryManagedResumeAttemptV01,
): void {
  const decision = readRepositoryExecutionDecisionRequestV01(db, attempt.decision_request_fingerprint);
  if (
    !decision || decision.action !== "resume_repository_managed_delegation" ||
    decision.status !== "consumed" || decision.workspace_id !== attempt.workspace_id ||
    decision.project_id !== attempt.project_id ||
    decision.expected_state_fingerprint !== attempt.expected_state_fingerprint ||
    decision.grant_fingerprint !== attempt.decision_grant_fingerprint ||
    decision.result_fingerprint !== attempt.attempt_fingerprint
  ) refuse("repository_managed_resume_consumed_decision_invalid");
}

async function observeResumeReadySourceV01(
  db: Database.Database,
  config: VNextLocalOperatorPilotConfigV01,
  service: LiveNativeHostRunServiceV01,
  dependencies: RepositoryManagedResumeDependenciesV01,
  now: string,
): Promise<ResumeSourceV01 | { preparation: RepositoryManagedResumePreparationV01 }> {
  if ((dependencies.platform ?? process.platform) !== "darwin") {
    return { preparation: blockedPreparationV01(
      "unsupported",
      "Explicit repository resume is supported only on verified local macOS filesystems.",
    ) };
  }
  const eligibility = await readRepositoryRunResumeEligibilityV01(db, {
    config,
    generated_at: now,
  }, {
    ...dependencies,
    read_controller: (candidateConfig, runId) =>
      service.readRepositoryControllerObservationV01(candidateConfig, runId),
    read_capability: () => service.readCapabilityContractV01(),
  });
  if (eligibility.status !== "resume_ready") {
    const status = eligibility.status === "unavailable"
      ? "blocked"
      : eligibility.status;
    return { preparation: blockedPreparationV01(
      status,
      eligibility.summary,
    ) };
  }
  const run = selectCanonicalRepositoryAttachmentRunV01(db, config);
  if (!run) refuse("repository_managed_resume_run_missing");
  const attachment = requireConsumedRepositoryRunAttachmentV01(db, run);
  const checkpoints = listRepositoryRunResumeCheckpointsV01(db, {
    ...config,
    run_id: run.run_id,
  });
  const checkpoint = checkpoints.at(-1);
  const registration = readCanonicalProjectWithRootV01(db, config);
  const baseline = readPhysicalRootBaselineV01(db, {
    ...config,
    node_scope_fingerprint: attachment.node_scope_fingerprint,
  });
  const state = readExpectedDatabaseAdmissionStateV01(db, {
    ...config,
    node_scope_fingerprint: attachment.node_scope_fingerprint,
  });
  const runtime = service.readRepositoryResumeRuntimeClaimV01();
  if (!checkpoint || !registration || !baseline) {
    refuse("repository_managed_resume_source_unavailable");
  }
  const step = run.steps.find((candidate) => candidate.step_id === checkpoint.step_id);
  if (!step) refuse("repository_managed_resume_step_missing");
  const thread = exactExternalRefV01(run.metadata.host_thread_ref, "host_thread");
  const turn = exactExternalRefV01(run.metadata.host_turn_ref, "host_turn");
  const connection = optionalExternalRefV01(
    run.metadata.host_connection_ref,
    "host_connection",
  );
  const session = optionalExternalRefV01(
    run.metadata.host_session_ref,
    "host_session",
  );
  const expectedStateBase = {
    expected_state_version: "repository_managed_resume_expected_state.v0.1" as const,
    action: "resume_repository_managed_delegation" as const,
    workspace_id: config.workspace_id,
    project_id: config.project_id,
    run_id: run.run_id,
    attachment_id: attachment.attachment_id,
    attachment_binding_fingerprint: attachment.binding_fingerprint,
    attachment_lifecycle: "consumed" as const,
    checkpoint_fingerprint: checkpoint.checkpoint_fingerprint,
    checkpoint_version: checkpoint.checkpoint_version,
    checkpoint_event_high_water_mark: checkpoint.event_high_water_mark,
    checkpoint_step_high_water_mark: checkpoint.step_high_water_mark,
    checkpoint_effect_high_water_mark: checkpoint.effect_ledger_high_water_mark,
    run_control_revision: numberV01(run.metadata.control_revision),
    step_control_revision: numberV01(step.output.control_revision),
    prior_controller_generation: checkpoint.controller_generation,
    expected_next_controller_generation: checkpoint.controller_generation + 1,
    execution_envelope_fingerprint: checkpoint.execution_envelope_fingerprint,
    adapter_version: checkpoint.adapter_version,
    capability_version: checkpoint.capability_version,
    provider_resume_binding_version: checkpoint.provider_resume_binding_version,
    provider_thread_binding_fingerprint: createProtocolSha256V01(
      canonicalizeProtocolValueV01(thread),
    ),
    provider_turn_binding_fingerprint: createProtocolSha256V01(
      canonicalizeProtocolValueV01(turn),
    ),
    root_binding_fingerprint: fingerprintProjectRootBindingV01(
      registration.root_binding,
    ),
    physical_root_baseline_fingerprint: baseline.baseline_fingerprint,
    packet_id: requiredStringV01(run.metadata.packet_id),
    packet_fingerprint: requiredFingerprintV01(run.metadata.packet_fingerprint),
    current_work_fingerprint: requiredFingerprintV01(
      state.current_work_fingerprint,
    ),
    checkpoint_worktree_fingerprint: checkpoint.worktree_observation_fingerprint,
    runtime_instance_fingerprint: runtime.runtime_instance_fingerprint,
    runtime_generation_fingerprint: runtime.runtime_generation_fingerprint,
    platform: "darwin" as const,
    resume_mode: "explicit_same_run" as const,
  };
  return {
    run,
    attachment,
    checkpoint,
    registration,
    expected_state_base: expectedStateBase,
    repository_delegation_context: repositoryDelegationContextFromRunV01(run),
    resume_binding: {
      host_connection_ref: connection,
      host_thread_ref: thread,
      host_session_ref: session,
      host_turn_ref: turn,
      control_revision: numberV01(run.metadata.control_revision),
    },
  };
}

function requireExactDatabaseSourceV01(
  db: Database.Database,
  config: VNextLocalOperatorPilotConfigV01,
  expected: ResumeSourceV01,
  service: LiveNativeHostRunServiceV01,
): ResumeSourceV01 {
  const run = selectCanonicalRepositoryAttachmentRunV01(db, config);
  if (!run || run.run_id !== expected.run.run_id) {
    refuse("repository_managed_resume_run_drift");
  }
  const attachment = requireConsumedRepositoryRunAttachmentV01(db, run);
  const checkpoint = listRepositoryRunResumeCheckpointsV01(db, {
    ...config,
    run_id: run.run_id,
  }).at(-1);
  const step = run.steps.find((candidate) => candidate.step_id === checkpoint?.step_id);
  const registration = readCanonicalProjectWithRootV01(db, config);
  const state = checkpoint
    ? readExpectedDatabaseAdmissionStateV01(db, {
        ...config,
        node_scope_fingerprint: checkpoint.node_scope_fingerprint,
      })
    : null;
  const baseline = checkpoint
    ? readPhysicalRootBaselineV01(db, {
        ...config,
        node_scope_fingerprint: checkpoint.node_scope_fingerprint,
      })
    : null;
  const runtime = service.readRepositoryResumeRuntimeClaimV01();
  const thread = externalRefForFingerprintV01(run.metadata.host_thread_ref, "host_thread");
  const turn = externalRefForFingerprintV01(run.metadata.host_turn_ref, "host_turn");
  const controller = service.readRepositoryControllerObservationV01(
    config,
    run.run_id,
  );
  if (
    controller.owned ||
    !checkpoint ||
    !step ||
    !registration ||
    !state ||
    !baseline ||
    !thread ||
    !turn ||
    run.metadata.pending_approval != null ||
    canonicalizeProtocolValueV01(attachment) !==
      canonicalizeProtocolValueV01(expected.attachment) ||
    canonicalizeProtocolValueV01(checkpoint) !==
      canonicalizeProtocolValueV01(expected.checkpoint) ||
    numberV01(run.metadata.control_revision) !==
      expected.expected_state_base.run_control_revision ||
    numberV01(step.output.control_revision) !==
      expected.expected_state_base.step_control_revision ||
    numberV01(run.metadata.controller_generation) !==
      expected.expected_state_base.prior_controller_generation ||
    run.metadata.repository_execution_envelope_fingerprint !==
      expected.expected_state_base.execution_envelope_fingerprint ||
    run.metadata.packet_id !== expected.expected_state_base.packet_id ||
    run.metadata.packet_fingerprint !== expected.expected_state_base.packet_fingerprint ||
    state.current_work_fingerprint !==
      expected.expected_state_base.current_work_fingerprint ||
    fingerprintProjectRootBindingV01(registration.root_binding) !==
      expected.expected_state_base.root_binding_fingerprint ||
    baseline.baseline_fingerprint !==
      expected.expected_state_base.physical_root_baseline_fingerprint ||
    runtime.runtime_instance_fingerprint !==
      expected.expected_state_base.runtime_instance_fingerprint ||
    runtime.runtime_generation_fingerprint !==
      expected.expected_state_base.runtime_generation_fingerprint ||
    runtime.capability.adapter_version !== expected.expected_state_base.adapter_version ||
    runtime.capability.capability_version !==
      expected.expected_state_base.capability_version ||
    runtime.capability.provider_resume_binding_version !==
      expected.expected_state_base.provider_resume_binding_version ||
    !runtime.capability.resumable_after_detach ||
    createProtocolSha256V01(canonicalizeProtocolValueV01(thread)) !==
      expected.expected_state_base.provider_thread_binding_fingerprint ||
    createProtocolSha256V01(canonicalizeProtocolValueV01(turn)) !==
      expected.expected_state_base.provider_turn_binding_fingerprint ||
    readRepositoryManagedResumeAttemptForCheckpointV01(db, {
      run_id: run.run_id,
      checkpoint_fingerprint: checkpoint.checkpoint_fingerprint,
    })
  ) {
    refuse("repository_managed_resume_expected_state_drift");
  }
  return { ...expected, run, attachment, checkpoint };
}

async function requireAdmittedAttemptSourceV01(
  db: Database.Database,
  config: VNextLocalOperatorPilotConfigV01,
  attempt: RepositoryManagedResumeAttemptV01,
  service: LiveNativeHostRunServiceV01,
  dependencies: RepositoryManagedResumeDependenciesV01,
  runtimeClaim: RepositoryManagedResumeRuntimeClaimV01,
  allowRuntimeTransfer = false,
): Promise<ResumeSourceV01> {
  const run = readAutonomyRunLedgerRecord(attempt.run_id, { db });
  if (!run) refuse("repository_managed_resume_run_missing");
  const attachment = requireConsumedRepositoryRunAttachmentV01(db, run);
  const checkpoint = listRepositoryRunResumeCheckpointsV01(db, {
    ...config,
    run_id: run.run_id,
  }).at(-1);
  const registration = readCanonicalProjectWithRootV01(db, config);
  if (!checkpoint || !registration) refuse("repository_managed_resume_source_unavailable");
  const physical = await inspectPhysicalRootForExecutionV01(
    db,
    registration.root_binding.local_root.normalized_path,
    dependencies,
  );
  const worktree = await (
    dependencies.inspect_worktree ?? inspectRepositoryWorktreeV01
  )(registration.root_binding.local_root.normalized_path, { now: dependencies.now });
  const runtime = service.readRepositoryResumeRuntimeClaimV01();
  const controller = service.readRepositoryControllerObservationV01(
    config,
    attempt.run_id,
  );
  const exactAttempt = readRepositoryManagedResumeAttemptV01(
    db,
    attempt.attempt_fingerprint,
  );
  const step = run.steps.find((candidate) => candidate.step_id === checkpoint.step_id);
  const expected = parseExpectedStateV01(
    readRepositoryExecutionDecisionRequestV01(
      db,
      attempt.decision_request_fingerprint,
    )?.expected_state_json,
  );
  const baseline = readPhysicalRootBaselineV01(db, {
    ...config,
    node_scope_fingerprint: checkpoint.node_scope_fingerprint,
  });
  const databaseState = readExpectedDatabaseAdmissionStateV01(db, {
    ...config,
    node_scope_fingerprint: checkpoint.node_scope_fingerprint,
  });
  const selected = selectCanonicalRepositoryAttachmentRunV01(db, config);
  const thread = externalRefForFingerprintV01(run.metadata.host_thread_ref, "host_thread");
  const turn = externalRefForFingerprintV01(run.metadata.host_turn_ref, "host_turn");
  if (
    !exactAttempt ||
    exactAttempt.attempt_state !== "admitted_not_invoked" ||
    readRepositoryManagedResumeCancellationV01(db, attempt.attempt_fingerprint) != null ||
    run.status !== "starting" ||
    numberV01(run.metadata.controller_generation) !==
      attempt.resumed_controller_generation ||
    numberV01(run.metadata.control_revision) !==
      attempt.admitted_run_control_revision ||
    !step ||
    numberV01(step.output.control_revision) !==
      attempt.admitted_step_control_revision ||
    run.metadata.repository_resume_attempt_fingerprint !==
      attempt.attempt_fingerprint ||
    (controller.owned &&
      (controller.controller_generation !== attempt.resumed_controller_generation ||
        controller.runtime_instance_fingerprint !== runtimeClaim.runtime_instance_fingerprint ||
        controller.runtime_generation_fingerprint !==
          runtimeClaim.runtime_generation_fingerprint)) ||
    selected?.run_id !== run.run_id ||
    attachment.attachment_id !== attempt.attachment_id ||
    attachment.binding_fingerprint !== attempt.attachment_binding_fingerprint ||
    checkpoint.checkpoint_fingerprint !== attempt.checkpoint_fingerprint ||
    checkpoint.event_high_water_mark !== expected.checkpoint_event_high_water_mark ||
    checkpoint.step_high_water_mark !== expected.checkpoint_step_high_water_mark ||
    checkpoint.effect_ledger_high_water_mark !==
      expected.checkpoint_effect_high_water_mark ||
    checkpoint.controller_generation !== attempt.prior_controller_generation ||
    checkpoint.execution_envelope_fingerprint !==
      expected.execution_envelope_fingerprint ||
    run.metadata.repository_execution_envelope_fingerprint !==
      expected.execution_envelope_fingerprint ||
    run.metadata.packet_id !== expected.packet_id ||
    run.metadata.packet_fingerprint !== expected.packet_fingerprint ||
    databaseState.current_work_fingerprint !== expected.current_work_fingerprint ||
    !baseline ||
    baseline.baseline_fingerprint !== expected.physical_root_baseline_fingerprint ||
    fingerprintProjectRootBindingV01(registration.root_binding) !==
      expected.root_binding_fingerprint ||
    !thread ||
    !turn ||
    createProtocolSha256V01(canonicalizeProtocolValueV01(thread)) !==
      expected.provider_thread_binding_fingerprint ||
    createProtocolSha256V01(canonicalizeProtocolValueV01(turn)) !==
      expected.provider_turn_binding_fingerprint ||
    physical.status !== "exact" ||
    !physicalMatchesBaselineV01(physical, baseline) ||
    worktree.status !== "exact" ||
    worktree.observation_fingerprint !== checkpoint.worktree_observation_fingerprint ||
    fingerprintProjectRootBindingV01(registration.root_binding) !==
      checkpoint.root_binding_fingerprint ||
    (!allowRuntimeTransfer &&
      (runtime.runtime_instance_fingerprint !== runtimeClaim.runtime_instance_fingerprint ||
        runtime.runtime_generation_fingerprint !==
          runtimeClaim.runtime_generation_fingerprint)) ||
    runtime.capability.adapter_version !== checkpoint.adapter_version ||
    runtime.capability.capability_version !== checkpoint.capability_version ||
    runtime.capability.provider_resume_binding_version !==
      expected.provider_resume_binding_version ||
    !runtime.capability.resumable_after_detach
  ) {
    refuse("repository_managed_resume_launch_gate_changed");
  }
  requireConsumedResumeDecisionV01(db, attempt);
  return {
    run,
    attachment,
    checkpoint,
    registration,
    expected_state_base: parseExpectedStateBaseV01(
      canonicalizeProtocolValueV01(expected),
    ),
    repository_delegation_context: repositoryDelegationContextFromRunV01(run),
    resume_binding: resumeBindingFromRunV01(run, checkpoint.run_control_revision),
  };
}

async function assertImmediateInvocationGateAndMarkV01(
  db: Database.Database,
  config: VNextLocalOperatorPilotConfigV01,
  attempt: RepositoryManagedResumeAttemptV01,
  service: LiveNativeHostRunServiceV01,
  dependencies: RepositoryManagedResumeDependenciesV01,
  runtimeClaim: RepositoryManagedResumeRuntimeClaimV01,
): Promise<void> {
  const registration = readCanonicalProjectWithRootV01(db, config);
  if (!registration) refuse("repository_managed_resume_launch_gate_changed");
  const physical = await inspectPhysicalRootForExecutionV01(
    db,
    registration.root_binding.local_root.normalized_path,
    dependencies,
  );
  const worktree = await (
    dependencies.inspect_worktree ?? inspectRepositoryWorktreeV01
  )(registration.root_binding.local_root.normalized_path, { now: dependencies.now });
  dependencies.before_invocation_marker?.();
  const now = strictNowV01(dependencies.now);
  db.exec("BEGIN IMMEDIATE");
  try {
    const current = readRepositoryManagedResumeAttemptV01(
      db,
      attempt.attempt_fingerprint,
    );
    const run = readAutonomyRunLedgerRecord(attempt.run_id, { db });
    const checkpoint = listRepositoryRunResumeCheckpointsV01(db, {
      ...config,
      run_id: attempt.run_id,
    }).at(-1);
    const selected = selectCanonicalRepositoryAttachmentRunV01(db, config);
    const exactRegistration = readCanonicalProjectWithRootV01(db, config);
    const attachment = run
      ? requireConsumedRepositoryRunAttachmentV01(db, run)
      : null;
    const expected = parseExpectedStateV01(
      readRepositoryExecutionDecisionRequestV01(
        db,
        attempt.decision_request_fingerprint,
      )?.expected_state_json,
    );
    const baseline = checkpoint
      ? readPhysicalRootBaselineV01(db, {
          ...config,
          node_scope_fingerprint: checkpoint.node_scope_fingerprint,
        })
      : null;
    const databaseState = checkpoint
      ? readExpectedDatabaseAdmissionStateV01(db, {
          ...config,
          node_scope_fingerprint: checkpoint.node_scope_fingerprint,
        })
      : null;
    const runtime = service.readRepositoryResumeRuntimeClaimV01();
    const thread = externalRefForFingerprintV01(
      run?.metadata.host_thread_ref,
      "host_thread",
    );
    const turn = externalRefForFingerprintV01(
      run?.metadata.host_turn_ref,
      "host_turn",
    );
    const step = run?.steps.find(
      (candidate) => candidate.step_id === checkpoint?.step_id,
    );
    const controller = service.readRepositoryControllerObservationV01(
      config,
      attempt.run_id,
    );
    if (
      !current ||
      current.attempt_state !== "admitted_not_invoked" ||
      readRepositoryManagedResumeCancellationV01(db, attempt.attempt_fingerprint) != null ||
      !run ||
      !checkpoint ||
      !selected ||
      !exactRegistration ||
      !attachment ||
      !baseline ||
      !databaseState ||
      !thread ||
      !turn ||
      !step ||
      run.status !== "starting" ||
      run.metadata.pending_approval != null ||
      selected.run_id !== run.run_id ||
      attachment.attachment_id !== attempt.attachment_id ||
      attachment.binding_fingerprint !== attempt.attachment_binding_fingerprint ||
      checkpoint.checkpoint_fingerprint !== attempt.checkpoint_fingerprint ||
      checkpoint.event_high_water_mark !== expected.checkpoint_event_high_water_mark ||
      checkpoint.step_high_water_mark !== expected.checkpoint_step_high_water_mark ||
      checkpoint.effect_ledger_high_water_mark !==
        expected.checkpoint_effect_high_water_mark ||
      checkpoint.execution_envelope_fingerprint !==
        expected.execution_envelope_fingerprint ||
      numberV01(step.output.control_revision) !==
        attempt.admitted_step_control_revision ||
      numberV01(run.metadata.controller_generation) !==
        attempt.resumed_controller_generation ||
      numberV01(run.metadata.control_revision) !==
        attempt.admitted_run_control_revision ||
      run.metadata.repository_execution_envelope_fingerprint !==
        expected.execution_envelope_fingerprint ||
      run.metadata.packet_id !== expected.packet_id ||
      run.metadata.packet_fingerprint !== expected.packet_fingerprint ||
      databaseState.current_work_fingerprint !== expected.current_work_fingerprint ||
      fingerprintProjectRootBindingV01(exactRegistration.root_binding) !==
        expected.root_binding_fingerprint ||
      baseline.baseline_fingerprint !== expected.physical_root_baseline_fingerprint ||
      runtime.runtime_instance_fingerprint !== runtimeClaim.runtime_instance_fingerprint ||
      runtime.runtime_generation_fingerprint !==
        runtimeClaim.runtime_generation_fingerprint ||
      runtime.capability.adapter_version !== expected.adapter_version ||
      runtime.capability.capability_version !== expected.capability_version ||
      runtime.capability.provider_resume_binding_version !==
        expected.provider_resume_binding_version ||
      !runtime.capability.resumable_after_detach ||
      createProtocolSha256V01(canonicalizeProtocolValueV01(thread)) !==
        expected.provider_thread_binding_fingerprint ||
      createProtocolSha256V01(canonicalizeProtocolValueV01(turn)) !==
        expected.provider_turn_binding_fingerprint ||
      !controller.owned ||
      controller.controller_generation !== attempt.resumed_controller_generation ||
      controller.runtime_instance_fingerprint !== runtimeClaim.runtime_instance_fingerprint ||
      controller.runtime_generation_fingerprint !==
        runtimeClaim.runtime_generation_fingerprint ||
      physical.status !== "exact" ||
      !physicalMatchesBaselineV01(physical, baseline) ||
      physical.node_scope_fingerprint !== attachment.node_scope_fingerprint ||
      worktree.status !== "exact" ||
      worktree.observation_fingerprint !== checkpoint.worktree_observation_fingerprint
    ) {
      refuse("repository_managed_resume_invocation_gate_changed");
    }
    requireConsumedResumeDecisionV01(db, attempt);
    if (!transitionRepositoryManagedResumeRuntimeClaimInsideTransactionV01(db, {
      attempt_fingerprint: attempt.attempt_fingerprint,
      claim_revision: runtimeClaim.claim_revision,
      runtime_instance_fingerprint: runtimeClaim.runtime_instance_fingerprint,
      runtime_generation_fingerprint: runtimeClaim.runtime_generation_fingerprint,
      from: "claimed",
      to: "invocation_started",
      updated_at: now,
    })) {
      refuse("repository_managed_resume_runtime_claim_conflict");
    }
    if (!transitionRepositoryManagedResumeAttemptInsideTransactionV01(db, {
      attempt_fingerprint: attempt.attempt_fingerprint,
      from: ["admitted_not_invoked"],
      to: "provider_resume_invocation_started",
      provider_invocation_started_at: now,
      updated_at: now,
    })) {
      refuse("repository_managed_resume_invocation_marker_conflict");
    }
    updateAutonomyRunLedgerFields(run.run_id, {
      updated_at: now,
      metadata: {
        ...run.metadata,
        provider_resume_invocation_started: true,
        provider_resume_invocation_started_at: now,
      },
    }, { db });
    appendAutonomyRunLedgerEvent(buildAutonomyRunEventRecord({
      run_id: run.run_id,
      step_id: checkpoint.step_id,
      event_type: "run_starting",
      status: "starting",
      message: "Provider resume invocation crossed its durable no-retry boundary.",
      payload: {
        controller_generation: attempt.resumed_controller_generation,
        provider_resume_invocation_started: true,
        provider_thread_start_allowed: false,
      },
      created_at: now,
    }), { db });
    db.exec("COMMIT");
    dependencies.after_invocation_marker?.();
  } catch (error) {
    if (db.inTransaction) db.exec("ROLLBACK");
    throw error;
  }
}

function repositoryResumeClaimV01(
  source: ResumeSourceV01,
  attempt: RepositoryManagedResumeAttemptV01,
  runtimeClaim: RepositoryManagedResumeRuntimeClaimV01,
) {
  return {
    run_id: attempt.run_id,
    packet_id: requiredStringV01(source.run.metadata.packet_id),
    packet_fingerprint: requiredFingerprintV01(source.run.metadata.packet_fingerprint),
    attachment_id: attempt.attachment_id,
    attachment_binding_fingerprint: attempt.attachment_binding_fingerprint,
    execution_envelope_fingerprint:
      source.checkpoint.execution_envelope_fingerprint,
    checkpoint_step_id: source.checkpoint.step_id,
    resumed_controller_generation: attempt.resumed_controller_generation,
    admitted_run_control_revision: attempt.admitted_run_control_revision,
    admitted_step_control_revision: attempt.admitted_step_control_revision,
    attempt_fingerprint: attempt.attempt_fingerprint,
    runtime_claim_revision: runtimeClaim.claim_revision,
    runtime_instance_fingerprint: runtimeClaim.runtime_instance_fingerprint,
    runtime_generation_fingerprint: runtimeClaim.runtime_generation_fingerprint,
  };
}

function repositoryResumeContextV01(
  attempt: RepositoryManagedResumeAttemptV01,
): NativeHostRepositoryResumeContextV01 {
  return {
    context_version: "native_host_repository_resume_context.v0.1",
    attempt_fingerprint: attempt.attempt_fingerprint,
    checkpoint_fingerprint: attempt.checkpoint_fingerprint,
    expected_state_fingerprint: attempt.expected_state_fingerprint,
    prior_controller_generation: attempt.prior_controller_generation,
    resumed_controller_generation: attempt.resumed_controller_generation,
    admitted_run_control_revision: attempt.admitted_run_control_revision,
    admitted_step_control_revision: attempt.admitted_step_control_revision,
  };
}

function repositoryDelegationContextFromRunV01(
  run: AutonomyRunRecord,
): NativeHostRepositoryDelegationContextV01 {
  const paths = Array.isArray(run.metadata.repository_protected_untracked_paths)
    ? run.metadata.repository_protected_untracked_paths.filter(
        (value): value is string => typeof value === "string",
      )
    : [];
  const context: NativeHostRepositoryDelegationContextV01 = {
    context_version: "native_host_repository_delegation_context.v0.1",
    attachment_id: requiredFingerprintV01(run.metadata.repository_attachment_id),
    attachment_binding_fingerprint: requiredFingerprintV01(
      run.metadata.repository_attachment_binding_fingerprint,
    ),
    execution_envelope_fingerprint: requiredFingerprintV01(
      run.metadata.repository_execution_envelope_fingerprint,
    ),
    start_decision_request_fingerprint: requiredFingerprintV01(
      run.metadata.repository_start_decision_request_fingerprint,
    ),
    protected_untracked_paths_fingerprint: requiredFingerprintV01(
      run.metadata.repository_protected_untracked_paths_fingerprint,
    ),
    protected_untracked_paths: paths,
  };
  if (
    createProtocolSha256V01(canonicalizeProtocolValueV01(paths)) !==
      context.protected_untracked_paths_fingerprint
  ) {
    refuse("repository_managed_resume_start_context_invalid");
  }
  return context;
}

function resumeBindingFromRunV01(
  run: AutonomyRunRecord,
  controlRevision: number,
): NativeHostResumeBindingV01 {
  return {
    host_connection_ref: optionalExternalRefV01(
      run.metadata.host_connection_ref,
      "host_connection",
    ),
    host_thread_ref: exactExternalRefV01(run.metadata.host_thread_ref, "host_thread"),
    host_session_ref: optionalExternalRefV01(
      run.metadata.host_session_ref,
      "host_session",
    ),
    host_turn_ref: exactExternalRefV01(run.metadata.host_turn_ref, "host_turn"),
    control_revision: controlRevision,
  };
}

function resultV01(
  status: RepositoryManagedResumeResultV01["status"],
  ordinaryText: string,
  attempt: RepositoryManagedResumeAttemptV01,
  service: LiveNativeHostRunServiceV01,
  config: VNextLocalOperatorPilotConfigV01,
  workerStarted: boolean,
): RepositoryManagedResumeResultV01 {
  return {
    resume_version: REPOSITORY_MANAGED_RESUME_VERSION_V01,
    status,
    ordinary_text: ordinaryText,
    run_id: attempt.run_id,
    attachment_id: attempt.attachment_id,
    controller_generation: attempt.resumed_controller_generation,
    projection: service.readExactRepositoryDelegationProjectionV01(
      config,
      attempt.run_id,
    ),
    authority: {
      ...READ_AUTHORITY,
      decision_grant_consumed: true,
      resume_attempt_created: true,
      controller_generation_created: true,
      worker_started: workerStarted,
      provider_resume_may_occur: workerStarted,
    },
  };
}

function nonMutatingResultV01(
  status: "active_owned" | "approval_pending" | "blocked" | "reconciliation_required",
  ordinaryText: string,
  input: {
    config: VNextLocalOperatorPilotConfigV01;
    run_id: string;
    attachment_id: string;
    expected_controller_generation: number;
  },
  service: LiveNativeHostRunServiceV01,
): RepositoryManagedResumeResultV01 {
  return {
    resume_version: REPOSITORY_MANAGED_RESUME_VERSION_V01,
    status,
    ordinary_text: ordinaryText,
    run_id: input.run_id,
    attachment_id: input.attachment_id,
    controller_generation: input.expected_controller_generation,
    projection: service.readExactRepositoryDelegationProjectionV01(
      input.config,
      input.run_id,
    ),
    authority: READ_AUTHORITY,
  };
}

/** Recovery-only validation of the private, machine-local attempt history. */
export function validateRepositoryManagedResumeAttemptV01(
  attempt: RepositoryManagedResumeAttemptV01,
): boolean {
  try {
    if (
      attempt.attempt_version !== REPOSITORY_MANAGED_RESUME_ATTEMPT_VERSION_V01 ||
      attempt.checkpoint_version !== "repository_run_resume_checkpoint.v0.1" ||
      attempt.resumed_controller_generation !==
        attempt.prior_controller_generation + 1 ||
      attempt.prior_controller_generation < 1 ||
      attempt.admitted_run_control_revision < 1 ||
      attempt.admitted_step_control_revision < 1 ||
      ![
        "admitted_not_invoked",
        "provider_resume_invocation_started",
        "controller_owned",
        "settled",
        "reconciliation_required",
      ].includes(attempt.attempt_state) ||
      ![
        attempt.workspace_id,
        attempt.project_id,
        attempt.run_id,
        attempt.attachment_id,
      ].every((value) => typeof value === "string" && value.trim().length > 0) ||
      ![
        attempt.attempt_fingerprint,
        attempt.attachment_binding_fingerprint,
        attempt.checkpoint_fingerprint,
        attempt.decision_request_fingerprint,
        attempt.decision_grant_fingerprint,
        attempt.expected_state_fingerprint,
        attempt.runtime_instance_fingerprint,
        attempt.runtime_generation_fingerprint,
      ].every((value) => /^sha256:[0-9a-f]{64}$/u.test(value)) ||
      !Number.isFinite(Date.parse(attempt.admitted_at)) ||
      !Number.isFinite(Date.parse(attempt.updated_at)) ||
      Date.parse(attempt.updated_at) < Date.parse(attempt.admitted_at)
    ) return false;
    if (
      attempt.attempt_state === "admitted_not_invoked" &&
      (attempt.provider_invocation_started_at !== null ||
        attempt.settled_at !== null ||
        attempt.final_outcome !== null)
    ) return false;
    if (
      ["provider_resume_invocation_started", "controller_owned"].includes(
        attempt.attempt_state,
      ) &&
      (!attempt.provider_invocation_started_at ||
        attempt.settled_at !== null ||
        attempt.final_outcome !== null)
    ) return false;
    if (
      attempt.attempt_state === "settled" &&
      (!attempt.settled_at || !attempt.final_outcome)
    ) return false;
    const immutableAdmission = {
      attempt_version: attempt.attempt_version,
      workspace_id: attempt.workspace_id,
      project_id: attempt.project_id,
      run_id: attempt.run_id,
      attachment_id: attempt.attachment_id,
      attachment_binding_fingerprint: attempt.attachment_binding_fingerprint,
      checkpoint_fingerprint: attempt.checkpoint_fingerprint,
      checkpoint_version: attempt.checkpoint_version,
      prior_controller_generation: attempt.prior_controller_generation,
      resumed_controller_generation: attempt.resumed_controller_generation,
      decision_request_fingerprint: attempt.decision_request_fingerprint,
      decision_grant_fingerprint: attempt.decision_grant_fingerprint,
      expected_state_fingerprint: attempt.expected_state_fingerprint,
      admitted_run_control_revision: attempt.admitted_run_control_revision,
      admitted_step_control_revision: attempt.admitted_step_control_revision,
      attempt_state: "admitted_not_invoked",
      final_outcome: null,
      admitted_at: attempt.admitted_at,
      provider_invocation_started_at: null,
      settled_at: null,
      updated_at: attempt.admitted_at,
    };
    return attempt.attempt_fingerprint === createProtocolSha256V01(
      canonicalizeProtocolValueV01(immutableAdmission),
    );
  } catch {
    return false;
  }
}

/** Recovery-only immutable-relation validation; it never checks live eligibility. */
export function validateRepositoryManagedResumeAttemptRelationsV01(
  db: Database.Database,
  attempt: RepositoryManagedResumeAttemptV01,
): boolean {
  try {
    if (!validateRepositoryManagedResumeAttemptV01(attempt)) return false;
    const run = readAutonomyRunLedgerRecord(attempt.run_id, { db });
    if (!run) return false;
    const attachment = requireConsumedRepositoryRunAttachmentV01(db, run);
    const checkpoint = listRepositoryRunResumeCheckpointsV01(db, {
      workspace_id: attempt.workspace_id,
      project_id: attempt.project_id,
      run_id: attempt.run_id,
    }).find((candidate) =>
      candidate.checkpoint_fingerprint === attempt.checkpoint_fingerprint
    );
    const decision = readRepositoryExecutionDecisionRequestV01(
      db,
      attempt.decision_request_fingerprint,
    );
    return Boolean(
      run.scope === attempt.project_id &&
      run.metadata.workspace_id === attempt.workspace_id &&
      run.metadata.repository_attachment_id === attempt.attachment_id &&
      run.metadata.repository_attachment_binding_fingerprint ===
        attempt.attachment_binding_fingerprint &&
      attachment.attachment_id === attempt.attachment_id &&
      attachment.binding_fingerprint === attempt.attachment_binding_fingerprint &&
      checkpoint &&
      checkpoint.controller_generation === attempt.prior_controller_generation &&
      decision?.action === "resume_repository_managed_delegation" &&
      decision.workspace_id === attempt.workspace_id &&
      decision.project_id === attempt.project_id &&
      decision.expected_state_fingerprint === attempt.expected_state_fingerprint &&
      decision.grant_fingerprint === attempt.decision_grant_fingerprint &&
      decision.status === "consumed" &&
      decision.result_fingerprint === attempt.attempt_fingerprint &&
      readRepositoryManagedResumeRuntimeClaimV01(db, attempt.attempt_fingerprint) != null
    );
  } catch {
    return false;
  }
}

function blockedPreparationV01(
  status: Exclude<RepositoryManagedResumePreparationV01["status"], "decision_required">,
  text: string,
  source?: ResumeSourceV01,
): RepositoryManagedResumePreparationV01 {
  return {
    preparation_version: REPOSITORY_MANAGED_RESUME_PREPARATION_VERSION_V01,
    status,
    ordinary_text: text,
    project: source
      ? {
          project_id: source.run.scope,
          display_name: source.registration.project.display_name,
        }
      : null,
    run_id: source?.run.run_id ?? null,
    attachment_id: source?.attachment.attachment_id ?? null,
    attachment_binding_fingerprint: source?.attachment.binding_fingerprint ?? null,
    expected_controller_generation: null,
    expected_run_control_revision: null,
    expected_state_fingerprint: null,
    decision_request: null,
    expires_at: null,
    authority: READ_AUTHORITY,
  };
}

function markAttemptReconciliationV01(
  db: Database.Database,
  attempt: RepositoryManagedResumeAttemptV01,
  now: string,
): void {
  if (attempt.attempt_state === "settled") return;
  db.exec("BEGIN IMMEDIATE");
  try {
    transitionRepositoryManagedResumeAttemptInsideTransactionV01(db, {
      attempt_fingerprint: attempt.attempt_fingerprint,
      from: [
        "admitted_not_invoked",
        "provider_resume_invocation_started",
        "controller_owned",
        "reconciliation_required",
      ],
      to: "reconciliation_required",
      updated_at: now,
    });
    const runtimeClaim = readRepositoryManagedResumeRuntimeClaimV01(
      db,
      attempt.attempt_fingerprint,
    );
    if (
      runtimeClaim &&
      (runtimeClaim.claim_lifecycle === "claimed" ||
        runtimeClaim.claim_lifecycle === "invocation_started")
    ) {
      transitionRepositoryManagedResumeRuntimeClaimInsideTransactionV01(db, {
        attempt_fingerprint: attempt.attempt_fingerprint,
        claim_revision: runtimeClaim.claim_revision,
        runtime_instance_fingerprint: runtimeClaim.runtime_instance_fingerprint,
        runtime_generation_fingerprint: runtimeClaim.runtime_generation_fingerprint,
        from: runtimeClaim.claim_lifecycle,
        to: "released",
        updated_at: now,
      });
    }
    const run = readAutonomyRunLedgerRecord(attempt.run_id, { db });
    if (run && !["completed", "failed", "cancelled", "timed_out"].includes(run.status)) {
      updateAutonomyRunLedgerFields(run.run_id, {
        status: "paused",
        stop_reason: "native_host_reconciliation_required",
        updated_at: now,
        metadata: {
          ...run.metadata,
          reconciliation_required: true,
          public_reason: "repository_resume_attempt_ambiguous",
        },
      }, { db });
    }
    db.exec("COMMIT");
  } catch (error) {
    if (db.inTransaction) db.exec("ROLLBACK");
    throw error;
  }
}

function parseExpectedStateV01(value: unknown): RepositoryManagedResumeExpectedStateV01 {
  try {
    const candidate = JSON.parse(requiredStringV01(value)) as RepositoryManagedResumeExpectedStateV01;
    if (
      candidate.expected_state_version !==
        "repository_managed_resume_expected_state.v0.1" ||
      candidate.action !== "resume_repository_managed_delegation"
    ) refuse("repository_managed_resume_expected_state_invalid");
    return candidate;
  } catch (error) {
    if (error instanceof RepositoryManagedResumeErrorV01) throw error;
    refuse("repository_managed_resume_expected_state_invalid");
  }
}

function parseExpectedStateBaseV01(
  value: unknown,
): ResumeSourceV01["expected_state_base"] {
  const { requested_at: _requested, expires_at: _expires, ...base } =
    parseExpectedStateV01(value);
  return base;
}

function assertResumeInputV01(input: {
  run_id: string;
  attachment_id: string;
  expected_attachment_binding_fingerprint: string;
  expected_state_fingerprint: string;
  expected_controller_generation: number;
  expected_run_control_revision: number;
  decision_request_fingerprint: string;
  decision_grant_fingerprint: string;
}): void {
  if (
    !input.run_id ||
    !isFingerprintV01(input.attachment_id) ||
    !isFingerprintV01(input.expected_attachment_binding_fingerprint) ||
    !isFingerprintV01(input.expected_state_fingerprint) ||
    !isFingerprintV01(input.decision_request_fingerprint) ||
    !isFingerprintV01(input.decision_grant_fingerprint) ||
    !Number.isSafeInteger(input.expected_controller_generation) ||
    input.expected_controller_generation < 2 ||
    !Number.isSafeInteger(input.expected_run_control_revision) ||
    input.expected_run_control_revision < 0
  ) refuse("repository_managed_resume_input_invalid", 422);
}

function assertAttemptInputV01(
  attempt: RepositoryManagedResumeAttemptV01,
  input: {
    config: VNextLocalOperatorPilotConfigV01;
    run_id: string;
    attachment_id: string;
    expected_attachment_binding_fingerprint: string;
    expected_state_fingerprint: string;
    expected_controller_generation: number;
    expected_run_control_revision: number;
    decision_request_fingerprint: string;
    decision_grant_fingerprint: string;
  },
): void {
  if (
    attempt.workspace_id !== input.config.workspace_id ||
    attempt.project_id !== input.config.project_id ||
    attempt.run_id !== input.run_id ||
    attempt.attachment_id !== input.attachment_id ||
    attempt.attachment_binding_fingerprint !==
      input.expected_attachment_binding_fingerprint ||
    attempt.expected_state_fingerprint !== input.expected_state_fingerprint ||
    attempt.resumed_controller_generation !== input.expected_controller_generation ||
    attempt.admitted_run_control_revision !==
      input.expected_run_control_revision + 1 ||
    attempt.decision_request_fingerprint !== input.decision_request_fingerprint ||
    attempt.decision_grant_fingerprint !== input.decision_grant_fingerprint
  ) refuse("repository_managed_resume_replay_conflict");
}

function assertInputMatchesSourceV01(
  input: {
    config: VNextLocalOperatorPilotConfigV01;
    run_id: string;
    attachment_id: string;
    expected_attachment_binding_fingerprint: string;
    expected_controller_generation: number;
    expected_run_control_revision: number;
  },
  source: ResumeSourceV01,
): void {
  if (
    input.run_id !== source.run.run_id ||
    input.attachment_id !== source.attachment.attachment_id ||
    input.expected_attachment_binding_fingerprint !==
      source.attachment.binding_fingerprint ||
    input.expected_controller_generation !==
      source.expected_state_base.expected_next_controller_generation ||
    input.expected_run_control_revision !==
      source.expected_state_base.run_control_revision
  ) refuse("repository_managed_resume_expected_state_mismatch");
}

function exactExternalRefV01(
  value: unknown,
  type: "host_thread" | "host_turn",
): ExternalRefV01 {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    refuse("repository_managed_resume_provider_binding_invalid");
  }
  const candidate = value as ExternalRefV01;
  if (
    candidate.ref_type !== type ||
    candidate.provider !== "codex" ||
    candidate.host !== "app_server" ||
    validateExternalRefV01(candidate).status !== "valid"
  ) refuse("repository_managed_resume_provider_binding_invalid");
  return candidate;
}

function externalRefForFingerprintV01(
  value: unknown,
  type: "host_thread" | "host_turn",
): ExternalRefV01 | null {
  try {
    return exactExternalRefV01(value, type);
  } catch {
    return null;
  }
}

function physicalMatchesBaselineV01(
  observation: Extract<
    Awaited<ReturnType<typeof inspectPhysicalRootForExecutionV01>>,
    { status: "exact" }
  >,
  baseline: NonNullable<ReturnType<typeof readPhysicalRootBaselineV01>>,
): boolean {
  return (
    observation.node_scope_fingerprint === baseline.node_scope_fingerprint &&
    observation.identity.identity_version === baseline.identity_version &&
    observation.identity.canonical_realpath_fingerprint ===
      baseline.canonical_realpath_fingerprint &&
    observation.identity.device === baseline.filesystem_volume_identity &&
    observation.identity.inode === baseline.filesystem_object_identity
  );
}

function optionalExternalRefV01(
  value: unknown,
  type: "host_connection" | "host_session",
): ExternalRefV01 | null {
  if (value == null) return null;
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    refuse("repository_managed_resume_provider_binding_invalid");
  }
  const candidate = value as ExternalRefV01;
  if (
    candidate.ref_type !== type ||
    candidate.provider !== "codex" ||
    candidate.host !== "app_server" ||
    validateExternalRefV01(candidate).status !== "valid"
  ) refuse("repository_managed_resume_provider_binding_invalid");
  return candidate;
}

function requiredStringV01(value: unknown): string {
  if (typeof value !== "string" || value.length < 1 || value.length > 16 * 1024) {
    refuse("repository_managed_resume_source_invalid");
  }
  return value;
}

function requiredFingerprintV01(value: unknown): string {
  if (!isFingerprintV01(value)) refuse("repository_managed_resume_source_invalid");
  return value;
}

function isFingerprintV01(value: unknown): value is string {
  return typeof value === "string" && /^sha256:[a-f0-9]{64}$/u.test(value);
}

function numberV01(value: unknown): number {
  if (!Number.isSafeInteger(value) || Number(value) < 0) {
    refuse("repository_managed_resume_source_invalid");
  }
  return Number(value);
}

function strictNowV01(now: (() => string) | undefined): string {
  const value = (now ?? (() => new Date().toISOString()))();
  if (!Number.isFinite(Date.parse(value)) || new Date(value).toISOString() !== value) {
    refuse("repository_managed_resume_clock_invalid", 500);
  }
  return value;
}

function normalizeErrorV01(error: unknown): Error {
  return error instanceof RepositoryManagedResumeErrorV01
    ? error
    : error instanceof Error
      ? error
      : new RepositoryManagedResumeErrorV01("repository_managed_resume_unavailable", 503);
}

function refuse(code: string, status = 409): never {
  throw new RepositoryManagedResumeErrorV01(code, status);
}
