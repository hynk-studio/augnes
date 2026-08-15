import type Database from "better-sqlite3";

import { readLatestManagedLiveAutonomyRunSummaryV01 } from "@/lib/autonomy/runner-ledger";
import { isTerminalRunnerStatus } from "@/lib/autonomy/runner-state";
import {
  insertVNextCoreRecordV01,
  readVNextCoreRecordV01,
} from "@/lib/vnext/persistence/durable-semantic-store";
import { readActiveProjectSelectionV01 } from "@/lib/vnext/persistence/project-lifecycle-registry";
import {
  canonicalizeProtocolValueV01,
  createProtocolSha256V01,
  isProtocolRecordV01,
} from "@/lib/vnext/protocol-primitives";
import {
  rebuildOperationalContinuationFromDurableSourcesV01,
  type OperationalContinuationReadRequestV01,
} from "@/lib/vnext/runtime/operational-continuation-read-model";
import {
  VNextLocalOperatorSessionErrorV01,
  admitVNextLocalOperatorMutationInsideTransactionV01,
  authenticateVNextLocalOperatorCurrentCredentialV01,
  type VNextLocalOperatorPilotConfigV01,
  type VNextLocalOperatorSecretSourceV01,
  type VNextLocalOperatorSessionCredentialV01,
} from "@/lib/vnext/runtime/local-operator-session";
import type { VNextLocalRuntimeClockV01 } from "@/lib/vnext/runtime/local-runtime-clock";
import { readProjectWorkInitializationV01 } from "@/lib/vnext/runtime/project-work-initialization";
import {
  SourceLinkedOperationalContinuationLineageErrorV01,
  createOperationalContinuationAdmissionV01,
  inspectSourceLinkedOperationalContinuationLineageV01,
  readOperationalContinuationLineageStateV01,
} from "@/lib/vnext/runtime/source-linked-operational-continuation-lineage";
import {
  OPERATIONAL_CONTINUATION_ADMISSION_REQUEST_VERSION_V01,
  type AdmitSourceLinkedOperationalContinuationRequestV01,
  type AdmitSourceLinkedOperationalContinuationResultV01,
} from "@/types/vnext/operational-continuation-admission";
import type { SourceLinkedOperationalContinuationV01 } from "@/types/vnext/operational-context-selection";

const REQUEST_KEYS = [
  "request_version",
  "action",
  "workspace_id",
  "project_id",
  "expected_active_project_id",
  "expected_active_selection_revision",
  "expected_current_packet_a_id",
  "expected_current_packet_a_fingerprint",
  "source_request",
  "expected_materialization_identity",
  "expected_selection_id",
  "expected_selection_fingerprint",
  "expected_packet_b_id",
  "expected_packet_b_fingerprint",
] as const;
const SOURCE_REQUEST_KEYS = [
  "frames",
  "window_kind",
  "paired_evaluation",
  "decision_time_cutoff",
  "max_selected_candidates",
] as const;

export class OperationalContinuationAdmissionErrorV01 extends Error {
  constructor(readonly code: string, readonly status = 409) {
    super(code);
    this.name = "OperationalContinuationAdmissionErrorV01";
  }
}

export interface OperationalContinuationAdmissionDependenciesV01 {
  root_available?: (root: string) => boolean;
  before_transaction?: () => void;
  after_packet_insert_inside_transaction?: () => void;
  after_admission_insert_inside_transaction?: () => void;
}

export function admitSourceLinkedOperationalContinuationV01(
  db: Database.Database,
  input: {
    config: VNextLocalOperatorPilotConfigV01;
    credential: VNextLocalOperatorSessionCredentialV01;
    request: unknown;
    clock?: VNextLocalRuntimeClockV01;
    secret_source?: VNextLocalOperatorSecretSourceV01;
  },
  dependencies: OperationalContinuationAdmissionDependenciesV01 = {},
): AdmitSourceLinkedOperationalContinuationResultV01 {
  const request = parseRequestV01(input.request);
  if (
    request.workspace_id !== input.config.workspace_id ||
    request.project_id !== input.config.project_id ||
    request.expected_active_project_id !== input.config.project_id
  ) {
    refuse("operational_continuation_admission_scope_conflict", 403);
  }
  if (db.inTransaction) {
    refuse("operational_continuation_admission_transaction_conflict");
  }
  const requestFingerprint = createProtocolSha256V01(
    canonicalizeProtocolValueV01(request),
  );
  const requestBefore = canonicalizeProtocolValueV01(request);
  // All source, identity, current-state, selected-material, replay, and
  // nonterminal-run checks that can precede authentication are performed here.
  inspectAdmissionStateV01(db, input.config, request, dependencies);
  if (canonicalizeProtocolValueV01(request) !== requestBefore) {
    refuse("operational_continuation_admission_input_mutated", 500);
  }
  dependencies.before_transaction?.();
  db.exec("BEGIN IMMEDIATE");
  try {
    // Rebuild the full ACGC1-5A chain again under the writer lock. No caller
    // projection, packet bytes, selection, decision, or identity is trusted.
    const exact = inspectAdmissionStateV01(
      db,
      input.config,
      request,
      dependencies,
    );
    if (exact.existing) {
      const currentSession =
        authenticateVNextLocalOperatorCurrentCredentialV01(db, {
          config: input.config,
          credential: input.credential,
          clock: input.clock,
        });
      db.exec("COMMIT");
      return resultV01(
        "exact_replay",
        exact.existing.admission,
        exact.existing.packet_b,
        currentSession,
      );
    }
    const sessionAdmission =
      admitVNextLocalOperatorMutationInsideTransactionV01(db, {
        config: input.config,
        credential: input.credential,
        clock: input.clock,
        secret_source: input.secret_source,
      });
    const admission = createOperationalContinuationAdmissionV01({
      continuation: exact.continuation,
      operator_id: input.config.operator_id,
      session_admission: sessionAdmission,
      request_fingerprint: requestFingerprint,
    });
    const packetB = exact.continuation.candidate_task_context_packet_b;
    const packetWrite = insertVNextCoreRecordV01(db, {
      record_kind: "task_context_packet",
      record_id: packetB.packet_id,
      workspace_id: packetB.workspace_id,
      project_id: packetB.project_id,
      fingerprint: packetB.integrity.fingerprint,
      idempotency_key: admission.idempotency_key,
      payload: packetB,
      created_at: packetB.generated_at,
    });
    if (packetWrite.status !== "inserted") {
      refuse("operational_continuation_packet_insert_conflict");
    }
    dependencies.after_packet_insert_inside_transaction?.();
    const admissionWrite = insertVNextCoreRecordV01(db, {
      record_kind: "operational_continuation_admission",
      record_id: admission.admission_id,
      workspace_id: admission.workspace_id,
      project_id: admission.project_id,
      fingerprint: admission.integrity.fingerprint,
      idempotency_key: admission.idempotency_key,
      payload: admission,
      created_at: admission.authenticated_action.admitted_at,
    });
    if (admissionWrite.status !== "inserted") {
      refuse("operational_continuation_admission_insert_conflict");
    }
    dependencies.after_admission_insert_inside_transaction?.();
    const lineage = inspectSourceLinkedOperationalContinuationLineageV01(db, {
      workspace_id: input.config.workspace_id,
      project_id: input.config.project_id,
      packet_id: packetB.packet_id,
      packet_fingerprint: packetB.integrity.fingerprint,
    });
    if (!lineage.projection_current) {
      refuse("operational_continuation_packet_not_current");
    }
    const current = readProjectWorkInitializationV01(
      db,
      input.config,
      dependencies.root_available
        ? { root_available: dependencies.root_available }
        : {},
    );
    if (
      current.state !== "defined_operational_continuation_work" ||
      current.current_packet?.packet_id !== packetB.packet_id ||
      current.current_packet.packet_fingerprint !==
        packetB.integrity.fingerprint ||
      current.current_packet.lineage_kind !==
        "source_linked_operational_continuation"
    ) {
      refuse("operational_continuation_packet_not_current");
    }
    db.exec("COMMIT");
    return resultV01("inserted", admission, packetB, sessionAdmission);
  } catch (error) {
    if (db.inTransaction) db.exec("ROLLBACK");
    if (
      error instanceof OperationalContinuationAdmissionErrorV01 ||
      error instanceof SourceLinkedOperationalContinuationLineageErrorV01 ||
      error instanceof VNextLocalOperatorSessionErrorV01
    ) {
      throw error;
    }
    throw new OperationalContinuationAdmissionErrorV01(
      "operational_continuation_admission_write_failed",
      409,
    );
  }
}

function inspectAdmissionStateV01(
  db: Database.Database,
  config: VNextLocalOperatorPilotConfigV01,
  request: AdmitSourceLinkedOperationalContinuationRequestV01,
  dependencies: OperationalContinuationAdmissionDependenciesV01,
): {
  continuation: SourceLinkedOperationalContinuationV01;
  existing: ReturnType<typeof readOperationalContinuationLineageStateV01>;
} {
  const sourceRequest: OperationalContinuationReadRequestV01 = {
    workspace_id: config.workspace_id,
    project_id: config.project_id,
    operator_id: config.operator_id,
    frames: structuredClone(request.source_request.frames),
    window_kind: request.source_request.window_kind,
    paired_evaluation: structuredClone(
      request.source_request.paired_evaluation,
    ),
    decision_time_cutoff: request.source_request.decision_time_cutoff,
    max_selected_candidates:
      request.source_request.max_selected_candidates,
  };
  const continuation =
    rebuildOperationalContinuationFromDurableSourcesV01(db, sourceRequest);
  if (
    canonicalizeProtocolValueV01(continuation.materialization_identity) !==
      canonicalizeProtocolValueV01(
        request.expected_materialization_identity,
      ) ||
    continuation.selection.selection_id !== request.expected_selection_id ||
    continuation.selection.integrity.fingerprint !==
      request.expected_selection_fingerprint ||
    continuation.candidate_task_context_packet_b.packet_id !==
      request.expected_packet_b_id ||
    continuation.candidate_task_context_packet_b.integrity.fingerprint !==
      request.expected_packet_b_fingerprint
  ) {
    refuse("operational_continuation_expected_materialization_mismatch");
  }
  if (
    continuation.selection.selected_rows.length < 1 ||
    continuation.selection.selected_rows.some(
      (row) =>
        row.disposition !== "selected_effective_accept" ||
        row.review_decision?.disposition !== "accept" ||
        row.review_decision.review_mode !==
          "proposal_only_no_activation" ||
        row.review_decision.requested_transition_intent_present !== false ||
        row.semantic_transition_eligible !== false ||
        row.proposal_only !== true,
    )
  ) {
    refuse("operational_continuation_no_selected_eligible_material");
  }
  const identity = continuation.materialization_identity;
  if (
    identity.packet_a_id !== request.expected_current_packet_a_id ||
    identity.packet_a_fingerprint !==
      request.expected_current_packet_a_fingerprint
  ) {
    refuse("operational_continuation_packet_a_expected_binding_mismatch");
  }
  const active = readActiveProjectSelectionV01(db, config.workspace_id);
  if (
    active?.project_id !== request.expected_active_project_id ||
    active.selection_revision !== request.expected_active_selection_revision
  ) {
    refuse("operational_continuation_active_selection_changed");
  }
  const latestRun = readLatestManagedLiveAutonomyRunSummaryV01(
    { workspace_id: config.workspace_id, project_id: config.project_id },
    db,
  );
  if (latestRun && !isTerminalRunnerStatus(latestRun.status)) {
    refuse("operational_continuation_nonterminal_run_conflict");
  }
  const existing = readOperationalContinuationLineageStateV01(db, config);
  const current = readProjectWorkInitializationV01(
    db,
    config,
    dependencies.root_available
      ? { root_available: dependencies.root_available }
      : {},
  );
  if (existing) {
    if (
      existing.admission.idempotency_key !==
        identity.future_admission_idempotency_key ||
      existing.admission.acgc5a_materialization_identity
        .materialization_fingerprint !== identity.materialization_fingerprint ||
      canonicalizeProtocolValueV01(existing.packet_b) !==
        canonicalizeProtocolValueV01(
          continuation.candidate_task_context_packet_b,
        ) ||
      current.state !== "defined_operational_continuation_work" ||
      current.current_packet?.packet_id !== existing.packet_b.packet_id ||
      current.current_packet.packet_fingerprint !==
        existing.packet_b.integrity.fingerprint
    ) {
      refuse("operational_continuation_admission_replay_conflict");
    }
    return { continuation, existing };
  }
  const packetBRecord = readVNextCoreRecordV01(db, {
    record_kind: "task_context_packet",
    record_id: identity.candidate_packet_b_id,
    workspace_id: config.workspace_id,
    project_id: config.project_id,
  });
  if (packetBRecord) {
    refuse("operational_continuation_orphan_packet_conflict");
  }
  if (
    current.current_packet?.packet_id !== identity.packet_a_id ||
    current.current_packet.packet_fingerprint !== identity.packet_a_fingerprint ||
    canonicalizeProtocolValueV01(current.current_work) !==
      canonicalizeProtocolValueV01(continuation.candidate_task_context_packet_b.task)
  ) {
    refuse("operational_continuation_packet_a_no_longer_current");
  }
  return { continuation, existing: null };
}

function parseRequestV01(
  value: unknown,
): AdmitSourceLinkedOperationalContinuationRequestV01 {
  if (!isProtocolRecordV01(value)) {
    refuse("operational_continuation_admission_request_invalid", 400);
  }
  if (
    canonicalizeProtocolValueV01(Object.keys(value).sort()) !==
      canonicalizeProtocolValueV01([...REQUEST_KEYS].sort()) ||
    value.request_version !==
      OPERATIONAL_CONTINUATION_ADMISSION_REQUEST_VERSION_V01 ||
    value.action !== "admit_source_linked_operational_continuation" ||
    typeof value.workspace_id !== "string" ||
    typeof value.project_id !== "string" ||
    typeof value.expected_active_project_id !== "string" ||
    !Number.isSafeInteger(value.expected_active_selection_revision) ||
    Number(value.expected_active_selection_revision) < 1 ||
    typeof value.expected_current_packet_a_id !== "string" ||
    !/^sha256:[a-f0-9]{64}$/u.test(
      String(value.expected_current_packet_a_fingerprint),
    ) ||
    !isProtocolRecordV01(value.source_request) ||
    canonicalizeProtocolValueV01(
      Object.keys(value.source_request).sort(),
    ) !== canonicalizeProtocolValueV01([...SOURCE_REQUEST_KEYS].sort()) ||
    !isProtocolRecordV01(value.expected_materialization_identity) ||
    typeof value.expected_selection_id !== "string" ||
    !/^sha256:[a-f0-9]{64}$/u.test(
      String(value.expected_selection_fingerprint),
    ) ||
    typeof value.expected_packet_b_id !== "string" ||
    !/^sha256:[a-f0-9]{64}$/u.test(
      String(value.expected_packet_b_fingerprint),
    )
  ) {
    refuse("operational_continuation_admission_request_invalid", 400);
  }
  return structuredClone(
    value,
  ) as unknown as AdmitSourceLinkedOperationalContinuationRequestV01;
}

function resultV01(
  status: "inserted" | "exact_replay",
  admission: AdmitSourceLinkedOperationalContinuationResultV01["admission"],
  packetB: AdmitSourceLinkedOperationalContinuationResultV01["packet_b"],
  session: {
    cookie_value: string;
    cookie_expires_at: string;
    cookie_max_age_seconds: number;
  },
): AdmitSourceLinkedOperationalContinuationResultV01 {
  return {
    status,
    admission: structuredClone(admission),
    packet_b: structuredClone(packetB),
    session_admission: {
      cookie_value: session.cookie_value,
      cookie_expires_at: session.cookie_expires_at,
      cookie_max_age_seconds: session.cookie_max_age_seconds,
    },
    packet_b_persisted: true,
    packet_b_current: true,
    attachment_prepared: false,
    start_decision_created: false,
    resume_decision_created: false,
    grant_issued: false,
    run_created: false,
    provider_called: false,
    model_called: false,
    network_called: false,
    github_called: false,
    project_files_written: false,
    project_commands_executed: false,
    semantic_state_changed: false,
    semantic_transition_created: false,
    policy_activated: false,
    semantic_authority_granted: false,
    execution_authority_granted: false,
  };
}

function refuse(code: string, status = 409): never {
  throw new OperationalContinuationAdmissionErrorV01(code, status);
}
