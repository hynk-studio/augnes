import type Database from "better-sqlite3";

import {
  normalizeCodexResultReportV01,
  validateCodexResultReportInputV01,
  type CodexResultReportIngestionRecordV01,
} from "@/lib/dogfooding/codex-result-report-normalizer";
import {
  assertVNextCoreRecordMatchesProtocolPayloadBindingV01,
  assertVNextDurableSemanticStoreSchemaV01,
  readVNextCoreRecordV01,
} from "@/lib/vnext/persistence/durable-semantic-store";
import { admitStructuredRunReceiptV01 } from "@/lib/vnext/persistence/structured-run-receipt-admission";
import {
  canonicalizeProtocolValueV01,
  createProtocolSha256V01,
  normalizeProtocolTextV01,
} from "@/lib/vnext/protocol-primitives";
import {
  mapCodexResultReportRecordToRunReceiptV01,
} from "@/lib/vnext/compat/run-receipt-from-codex-result-report";
import {
  validateCodexResultReportRecordForRunReceiptV01,
} from "@/lib/vnext/compat/codex-result-report-source-validator";
import {
  buildRunReceiptV01,
  validateRunReceiptV01,
} from "@/lib/vnext/run-receipt";
import {
  admitVNextLocalOperatorMutationInsideTransactionV01,
  authenticateVNextLocalOperatorSessionV01,
  type VNextLocalOperatorPilotConfigV01,
  type VNextLocalOperatorSecretSourceV01,
  type VNextLocalOperatorSessionCredentialV01,
  type VNextLocalOperatorSessionMutationAdmissionV01,
} from "@/lib/vnext/runtime/local-operator-session";
import {
  readVNextLocalRuntimeClockNowV01,
  type VNextLocalRuntimeClockV01,
} from "@/lib/vnext/runtime/local-runtime-clock";
import {
  inspectVNextOperatorPilotPacketLineageV01,
} from "@/lib/vnext/runtime/operator-pilot-project-continuity";
import type { ExternalRefV01 } from "@/types/vnext/external-ref";
import type { RunReceiptAttestationV01, RunReceiptObservationV01, RunReceiptV01 } from "@/types/vnext/run-receipt";
import type { TaskContextPacketSelectedEntryV01 } from "@/types/vnext/task-context-packet";

export const VNEXT_OPERATOR_PILOT_LATER_RESULT_INTAKE_VERSION_V01 =
  "vnext_operator_pilot_later_result_intake.v0.1" as const;

const COMPATIBILITY_NAMESPACE =
  "augnes.vnext.operator-pilot-later-result-intake.v0.1";
const MAX_HISTORY = 128;
const MAX_RUN_ID_CHARACTERS = 256;
const MAX_CITATIONS = 64;
const RESULT_REPORT_KEYS = new Set([
  "input_version",
  "scope",
  "report_id",
  "report_kind",
  "reported_at",
  "operator_actor_ref",
  "pr_refs",
  "branch_ref",
  "commit_refs",
  "codex_claimed_summary",
  "expected_files",
  "observed_files",
  "expected_checks",
  "observed_checks",
  "validation_commands",
  "skipped_checks",
  "known_warnings",
  "changed_files_summary",
  "not_done_items",
  "expected_observed_delta",
  "boundary_notes",
  "source_refs",
  "privacy_report",
  "authority_boundary",
]);

export type VNextOperatorPilotReportedPayloadUseV01 =
  | "yes"
  | "partial"
  | "no"
  | "unknown";

export class VNextOperatorPilotLaterResultErrorV01 extends Error {
  readonly code: string;
  readonly status: number;

  constructor(code: string, status = 400) {
    super(code);
    this.name = "VNextOperatorPilotLaterResultErrorV01";
    this.code = code;
    this.status = status;
  }
}

export interface VNextOperatorPilotPacketConsumptionV01 {
  reported_payload_use: VNextOperatorPilotReportedPayloadUseV01;
  cited_selected_context: Array<{
    entry_id: string;
    state_ref: ExternalRefV01;
    state_fingerprint: string;
  }>;
}

export interface VNextOperatorPilotPacketConsumptionRelationV01 {
  packet_referenced: true;
  payload_use_reported: true;
  selected_state_refs_cited: boolean;
  local_integrity_verified: true;
  actual_use_review_required: true;
  helpfulness_established: false;
}

export interface VNextOperatorPilotLaterResultReadModelV01 {
  intake_version: typeof VNEXT_OPERATOR_PILOT_LATER_RESULT_INTAKE_VERSION_V01;
  workspace_id: string;
  project_id: string;
  receipt: RunReceiptV01;
  source_transition_receipt: {
    transition_receipt_id: string;
    transition_receipt_fingerprint: string;
  };
  packet_consumption: VNextOperatorPilotPacketConsumptionV01;
  relation: VNextOperatorPilotPacketConsumptionRelationV01;
  proposal_created: false;
  decision_created: false;
  transition_created: false;
  evidence_accepted: false;
  work_closed: false;
}

export interface VNextOperatorPilotLaterResultWriteResultV01
  extends VNextOperatorPilotLaterResultReadModelV01 {
  status: "inserted" | "exact_replay";
  session_admission: VNextLocalOperatorSessionMutationAdmissionV01;
}

interface ParsedIntakeRequestV01 {
  packet_id: string;
  packet_fingerprint: string;
  transition_receipt_id: string;
  transition_receipt_fingerprint: string;
  run_id: string;
  result_report: unknown;
  packet_consumption: {
    reported_payload_use: VNextOperatorPilotReportedPayloadUseV01;
    cited_selected_context_entry_ids: string[];
  };
}

interface ResolvedIntakeV01 {
  workspace_id: string;
  project_id: string;
  data_classification: RunReceiptV01["privacy_egress"]["data_classification"];
  request: ParsedIntakeRequestV01;
  source_record: CodexResultReportIngestionRecordV01;
  packet_ref: ExternalRefV01;
  transition_ref: ExternalRefV01;
  state_refs: ExternalRefV01[];
  state_read_refs: ExternalRefV01[];
  citation_refs: ExternalRefV01[];
  consumption: VNextOperatorPilotPacketConsumptionV01;
  intake_identity: string;
  intake_request_fingerprint: string;
}

export function recordVNextOperatorPilotLaterResultV01(
  db: Database.Database,
  input: {
    config: VNextLocalOperatorPilotConfigV01;
    credential: VNextLocalOperatorSessionCredentialV01;
    request: unknown;
    clock?: VNextLocalRuntimeClockV01;
    secret_source?: VNextLocalOperatorSecretSourceV01;
  },
): VNextOperatorPilotLaterResultWriteResultV01 {
  assertVNextDurableSemanticStoreSchemaV01(db);
  const request = parseIntakeRequest(input.request);
  authenticateVNextLocalOperatorSessionV01(db, input);
  const prevalidatedAt = readVNextLocalRuntimeClockNowV01(
    input.clock,
    "operator_pilot_later_result_prevalidated_at",
  );
  resolveIntake(db, input.config, request, prevalidatedAt, true);
  if (db.inTransaction) throw intakeError("operator_pilot_nested_transaction", 409);
  db.exec("BEGIN IMMEDIATE");
  try {
    const admission = admitVNextLocalOperatorMutationInsideTransactionV01(db, input);
    const resolved = resolveIntake(
      db,
      input.config,
      request,
      admission.action_observed_at,
      true,
    );
    const existing = findExistingIntakeReceipt(db, input.config, resolved);
    if (existing) {
      const model = readModelFromReceipt(db, input.config, existing);
      db.exec("COMMIT");
      return {
        ...model,
        status: "exact_replay",
        session_admission: admission,
      };
    }
    const receipt = buildLaterResultReceipt(
      resolved,
      admission.action_observed_at,
      input.config.operator_id,
      admission.session.session_id,
    );
    const write = admitStructuredRunReceiptV01(db, receipt);
    if (write.status !== "inserted") {
      throw intakeError("operator_pilot_later_result_unexpected_replay", 409);
    }
    const model = readModelFromReceipt(db, input.config, receipt);
    db.exec("COMMIT");
    return {
      ...model,
      status: "inserted",
      session_admission: admission,
    };
  } catch (error) {
    if (db.inTransaction) db.exec("ROLLBACK");
    throw error;
  }
}

export function readVNextOperatorPilotLaterResultV01(
  db: Database.Database,
  input: {
    config: VNextLocalOperatorPilotConfigV01;
    receipt_id: string;
    receipt_fingerprint: string;
  },
): VNextOperatorPilotLaterResultReadModelV01 {
  assertVNextDurableSemanticStoreSchemaV01(db);
  const receiptId = requiredText(input.receipt_id, "receipt_id");
  const receiptFingerprint = sha256(input.receipt_fingerprint, "receipt_fingerprint");
  const record = readVNextCoreRecordV01(db, {
    record_kind: "run_receipt",
    record_id: receiptId,
    workspace_id: input.config.workspace_id,
    project_id: input.config.project_id,
  });
  if (!record) throw intakeError("operator_pilot_later_result_missing", 404);
  if (record.fingerprint !== receiptFingerprint) {
    throw intakeError("operator_pilot_later_result_fingerprint_mismatch", 409);
  }
  if (validateRunReceiptV01(record.payload).status !== "valid") {
    throw intakeError("operator_pilot_later_result_invalid", 422);
  }
  const receipt = record.payload as RunReceiptV01;
  assertVNextCoreRecordMatchesProtocolPayloadBindingV01(record, {
    workspace_id: receipt.workspace_id,
    project_id: receipt.project_id,
    fingerprint: receipt.integrity.fingerprint,
  });
  if (
    record.record_id !== receipt.receipt_id ||
    record.idempotency_key !== receipt.idempotency_key ||
    record.created_at !== receipt.recorded_at
  ) {
    throw intakeError("operator_pilot_later_result_envelope_mismatch", 422);
  }
  return readModelFromReceipt(db, input.config, receipt);
}

export function readLatestVNextOperatorPilotLaterResultForPacketV01(
  db: Database.Database,
  input: {
    config: VNextLocalOperatorPilotConfigV01;
    packet_id: string;
    packet_fingerprint: string;
  },
): VNextOperatorPilotLaterResultReadModelV01 {
  assertVNextDurableSemanticStoreSchemaV01(db);
  const packetId = requiredText(input.packet_id, "packet_id");
  const packetFingerprint = sha256(input.packet_fingerprint, "packet_fingerprint");
  inspectVNextOperatorPilotPacketLineageV01(db, {
    config: input.config,
    packet_id: packetId,
    packet_fingerprint: packetFingerprint,
  });
  const rows = db.prepare(
    `SELECT record_id, fingerprint FROM vnext_core_records
     WHERE workspace_id = ? AND project_id = ? AND record_kind = 'run_receipt'
     ORDER BY created_at, record_id LIMIT ?`,
  ).all(
    input.config.workspace_id,
    input.config.project_id,
    MAX_HISTORY + 1,
  ) as Array<{ record_id: string; fingerprint: string }>;
  if (rows.length > MAX_HISTORY) {
    throw intakeError("operator_pilot_run_receipt_history_bound_exceeded", 422);
  }
  const matches: VNextOperatorPilotLaterResultReadModelV01[] = [];
  for (const row of rows) {
    const record = readVNextCoreRecordV01(db, {
      record_kind: "run_receipt",
      record_id: row.record_id,
      workspace_id: input.config.workspace_id,
      project_id: input.config.project_id,
    });
    if (!record || !isLaterResultReceipt(record.payload)) continue;
    const receipt = record.payload as RunReceiptV01;
    if (
      receipt.task_context_packet_ref?.external_id !== packetId ||
      receipt.task_context_packet_ref.source_ref !== packetFingerprint
    ) {
      continue;
    }
    matches.push(
      readVNextOperatorPilotLaterResultV01(db, {
        config: input.config,
        receipt_id: row.record_id,
        receipt_fingerprint: row.fingerprint,
      }),
    );
  }
  const latest = matches.at(-1);
  if (!latest) throw intakeError("operator_pilot_later_result_missing", 404);
  return latest;
}

function resolveIntake(
  db: Database.Database,
  config: VNextLocalOperatorPilotConfigV01,
  request: ParsedIntakeRequestV01,
  observedAt: string,
  requireCurrent: boolean,
): ResolvedIntakeV01 {
  const lineage = inspectVNextOperatorPilotPacketLineageV01(db, {
    config,
    packet_id: request.packet_id,
    packet_fingerprint: request.packet_fingerprint,
  });
  if (requireCurrent && !lineage.projection_current) {
    throw intakeError("operator_pilot_later_packet_stale", 409);
  }
  if (
    lineage.source_transition_receipt.transition_receipt_id !==
      request.transition_receipt_id ||
    lineage.source_transition_receipt.transition_receipt_fingerprint !==
      request.transition_receipt_fingerprint
  ) {
    throw intakeError("operator_pilot_later_result_transition_mismatch", 409);
  }
  assertResultReportInputKeys(request.result_report);
  const inputValidation = validateCodexResultReportInputV01(request.result_report);
  if (!inputValidation.passed) {
    throw intakeError(
      inputValidation.status.startsWith("blocked")
        ? "operator_pilot_later_result_blocked"
        : "operator_pilot_later_result_report_invalid",
      422,
    );
  }
  const sourceRecord = normalizeCodexResultReportV01(request.result_report);
  const sourceValidation = validateCodexResultReportRecordForRunReceiptV01(sourceRecord);
  if (sourceValidation.status !== "valid") {
    throw intakeError("operator_pilot_later_result_source_invalid", 422);
  }
  const acceptedEntries = lineage.packet.selected_context.filter(
    (entry) => entry.entry_kind === "accepted_state_ref",
  );
  const acceptedById = new Map(acceptedEntries.map((entry) => [entry.entry_id, entry]));
  const consumption = resolveConsumption(
    request.packet_consumption,
    acceptedById,
  );
  const requiredSourceRefs = [
    lineage.packet.packet_id,
    lineage.packet.integrity.fingerprint,
    request.transition_receipt_id,
    request.transition_receipt_fingerprint,
    ...consumption.cited_selected_context.flatMap((entry) => [
      entry.entry_id,
      entry.state_ref.external_id,
      entry.state_fingerprint,
    ]),
  ];
  if (requiredSourceRefs.some((value) => !sourceRecord.source_refs.includes(value))) {
    throw intakeError("operator_pilot_later_result_source_ref_missing", 422);
  }
  const packetRef = directRef(
    "task_context_packet",
    lineage.packet.packet_id,
    observedAt,
    lineage.packet.integrity.fingerprint,
  );
  const transitionRef = directRef(
    "state_transition_receipt",
    request.transition_receipt_id,
    observedAt,
    request.transition_receipt_fingerprint,
  );
  const stateRefs = consumption.cited_selected_context.map(
    (entry) => entry.state_ref,
  );
  const stateReadRefs = consumption.cited_selected_context.map((entry) =>
    directRef(
      "accepted_semantic_state_read",
      entry.state_ref.external_id,
      observedAt,
      entry.state_fingerprint,
    ),
  );
  const citationRefs = consumption.cited_selected_context.map((entry) => ({
    ref_version: "external_ref.v0.1" as const,
    ref_type: "task_context_selected_entry",
    external_id: entry.entry_id,
    trust_class: "user_declaration" as const,
    observed_at: observedAt,
    source_ref: entry.state_fingerprint,
    compatibility_namespace: COMPATIBILITY_NAMESPACE,
  }));
  const identityHash = createProtocolSha256V01(
    canonicalizeProtocolValueV01({
      workspace_id: config.workspace_id,
      project_id: config.project_id,
      report_id: sourceRecord.report_id,
      packet_id: request.packet_id,
      packet_fingerprint: request.packet_fingerprint,
      transition_receipt_id: request.transition_receipt_id,
      transition_receipt_fingerprint: request.transition_receipt_fingerprint,
    }),
  );
  const intakeIdentity = `later-result-intake:${identityHash.slice(7, 38)}`;
  const intakeRequestFingerprint = createProtocolSha256V01(
    canonicalizeProtocolValueV01({
      workspace_id: config.workspace_id,
      project_id: config.project_id,
      run_id: request.run_id,
      source_record: sourceRecord,
      packet_id: request.packet_id,
      packet_fingerprint: request.packet_fingerprint,
      transition_receipt_id: request.transition_receipt_id,
      transition_receipt_fingerprint: request.transition_receipt_fingerprint,
      packet_consumption: consumption,
    }),
  );
  return {
    workspace_id: config.workspace_id,
    project_id: config.project_id,
    data_classification: lineage.packet.constraints.data_classification,
    request,
    source_record: sourceRecord,
    packet_ref: packetRef,
    transition_ref: transitionRef,
    state_refs: stateRefs,
    state_read_refs: stateReadRefs,
    citation_refs: citationRefs,
    consumption,
    intake_identity: intakeIdentity,
    intake_request_fingerprint: intakeRequestFingerprint,
  };
}

function buildLaterResultReceipt(
  resolved: ResolvedIntakeV01,
  observedAt: string,
  operatorId: string,
  sessionId: string,
): RunReceiptV01 {
  const mapping = mapCodexResultReportRecordToRunReceiptV01({
    workspace_id: resolved.workspace_id,
    project_id: resolved.project_id,
    run_id: resolved.request.run_id,
    recorded_at: observedAt,
    data_classification: resolved.data_classification,
    source_record: resolved.source_record,
    task_context_packet_ref: resolved.packet_ref,
  });
  if (mapping.status !== "mapped" || !mapping.receipt) {
    throw intakeError("operator_pilot_later_result_mapping_failed", 422);
  }
  const mapped = mapping.receipt;
  const intakeRef = directRef(
    "later_task_result_intake",
    resolved.intake_identity,
    observedAt,
    resolved.intake_request_fingerprint,
  );
  const observerRef = directRef(
    "later_task_result_intake_observer",
    `local-intake-observer:${resolved.project_id}`,
    observedAt,
    resolved.intake_request_fingerprint,
  );
  const sessionEvidenceFingerprint = createProtocolSha256V01(
    canonicalizeProtocolValueV01({
      action: "record_later_task_result",
      workspace_id: resolved.workspace_id,
      project_id: resolved.project_id,
      operator_id: operatorId,
      session_id: sessionId,
      intake_request_fingerprint: resolved.intake_request_fingerprint,
      observed_at: observedAt,
    }),
  );
  const sessionEvidenceRef = directRef(
    "local_operator_session_action",
    sessionId,
    observedAt,
    sessionEvidenceFingerprint,
  );
  const operatorActorRef: ExternalRefV01 = {
    ref_version: "external_ref.v0.1",
    ref_type: "local_operator_actor",
    external_id: operatorId,
    trust_class: "user_declaration",
    observed_at: observedAt,
    source_ref: sessionEvidenceFingerprint,
    compatibility_namespace: COMPATIBILITY_NAMESPACE,
  };
  const consumptionFingerprint = createProtocolSha256V01(
    canonicalizeProtocolValueV01(resolved.consumption),
  );
  const consumptionRef: ExternalRefV01 = {
    ref_version: "external_ref.v0.1",
    ref_type: "packet_consumption_report",
    external_id: resolved.consumption.reported_payload_use,
    trust_class: "user_declaration",
    observed_at: observedAt,
    source_ref: consumptionFingerprint,
    compatibility_namespace: COMPATIBILITY_NAMESPACE,
  };
  const observations: RunReceiptObservationV01[] = [
    localObservation(
      "later_packet_integrity_read",
      "The local intake read and validated the exact persisted later TaskContextPacket ID and fingerprint.",
      observedAt,
      observerRef,
      [resolved.packet_ref, intakeRef],
      resolved.state_read_refs,
    ),
    localObservation(
      "source_transition_receipt_integrity_read",
      "The local intake read and validated the exact source StateTransitionReceipt lineage.",
      observedAt,
      observerRef,
      [resolved.transition_ref, intakeRef],
      [],
    ),
    localObservation(
      "codex_result_record_validation",
      "The local intake normalized and validated the bounded Codex result record; its work claims remain imported attestations.",
      observedAt,
      observerRef,
      [intakeRef],
      [],
    ),
  ];
  const consumptionAttestation: RunReceiptAttestationV01 = {
    attestation_id: `attestation:${consumptionFingerprint.slice(7, 38)}`,
    attestation_kind: "packet_consumption_report",
    summary:
      `Caller-reported packet payload use: ${resolved.consumption.reported_payload_use}; cited accepted-state entries: ${resolved.consumption.cited_selected_context.length}.`,
    reported_at: observedAt,
    reporter_ref: operatorActorRef,
    trust_class: "user_declaration",
    source_refs: [operatorActorRef, sessionEvidenceRef, consumptionRef],
    subject_refs: [
      resolved.packet_ref,
      ...resolved.citation_refs,
      ...resolved.state_refs,
    ],
  };
  const {
    receipt_version: _receiptVersion,
    receipt_id: _receiptId,
    trust_summary: _trustSummary,
    authority_summary: mappedAuthority,
    idempotency_key: _idempotencyKey,
    integrity: _integrity,
    ...base
  } = mapped;
  const receipt = buildRunReceiptV01({
    ...base,
    observer_refs: [...mapped.observer_refs, observerRef],
    observations: [...mapped.observations, ...observations],
    attestations: [...mapped.attestations, consumptionAttestation],
    external_refs: [
      ...mapped.external_refs,
      intakeRef,
      resolved.packet_ref,
      resolved.transition_ref,
      consumptionRef,
      operatorActorRef,
      sessionEvidenceRef,
      ...resolved.state_refs,
      ...resolved.state_read_refs,
      ...resolved.citation_refs,
    ],
    result_summary: {
      ...mapped.result_summary,
      limitations: [
        ...mapped.result_summary.limitations,
        "Packet consumption remains caller-reported and requires explicit operator review.",
        "Packet reference, cited state, and local integrity validation do not establish helpfulness or outcome improvement.",
      ],
    },
    source_refs: [
      ...mapped.source_refs,
      intakeRef,
      resolved.packet_ref,
      resolved.transition_ref,
      sessionEvidenceRef,
      ...resolved.state_read_refs,
    ],
    artifact_refs: [
      ...mapped.artifact_refs,
      ...resolved.state_refs,
      ...resolved.state_read_refs,
    ],
    compatibility: {
      ...mapped.compatibility,
      source_contracts: [
        ...mapped.compatibility.source_contracts,
        VNEXT_OPERATOR_PILOT_LATER_RESULT_INTAKE_VERSION_V01,
      ],
      warnings: [
        ...mapped.compatibility.warnings,
        "Direct local observations cover only persisted-record reads and validation performed by intake.",
        "Codex-reported work and packet use remain imported or attested material.",
      ],
      external_refs: [
        ...mapped.compatibility.external_refs,
        intakeRef,
        resolved.packet_ref,
        resolved.transition_ref,
        consumptionRef,
        operatorActorRef,
        sessionEvidenceRef,
        ...resolved.citation_refs,
      ],
    },
    authority_notes: [
      ...mappedAuthority.notes,
      "Later-result intake does not create a proposal, decision, transition, accepted Evidence, work closure, or helpfulness judgment.",
    ],
  });
  const validation = validateRunReceiptV01(receipt);
  if (validation.status !== "valid") {
    throw intakeError("operator_pilot_later_result_receipt_invalid", 422);
  }
  return receipt;
}

function localObservation(
  kind: string,
  summary: string,
  observedAt: string,
  observerRef: ExternalRefV01,
  sourceRefs: ExternalRefV01[],
  relatedArtifactRefs: ExternalRefV01[],
): RunReceiptObservationV01 {
  return {
    observation_id: `observation:${createProtocolSha256V01(
      canonicalizeProtocolValueV01({ kind, source_refs: sourceRefs }),
    ).slice(7, 38)}`,
    observation_kind: kind,
    summary,
    event_at: observedAt,
    observed_at: observedAt,
    observer_ref: observerRef,
    trust_class: "direct_local_observation",
    source_refs: sourceRefs,
    related_command_ids: [],
    related_check_ids: [],
    related_artifact_refs: relatedArtifactRefs,
  };
}

function findExistingIntakeReceipt(
  db: Database.Database,
  config: VNextLocalOperatorPilotConfigV01,
  resolved: ResolvedIntakeV01,
): RunReceiptV01 | null {
  const rows = db.prepare(
    `SELECT record_id FROM vnext_core_records
     WHERE workspace_id = ? AND project_id = ? AND record_kind = 'run_receipt'
     ORDER BY created_at, record_id LIMIT ?`,
  ).all(config.workspace_id, config.project_id, MAX_HISTORY + 1) as Array<{
    record_id: string;
  }>;
  if (rows.length > MAX_HISTORY) {
    throw intakeError("operator_pilot_run_receipt_history_bound_exceeded", 422);
  }
  const matches: RunReceiptV01[] = [];
  for (const row of rows) {
    const record = readVNextCoreRecordV01(db, {
      record_kind: "run_receipt",
      record_id: row.record_id,
      workspace_id: config.workspace_id,
      project_id: config.project_id,
    });
    if (!record || validateRunReceiptV01(record.payload).status !== "valid") {
      throw intakeError("operator_pilot_persisted_run_receipt_invalid", 422);
    }
    const receipt = record.payload as RunReceiptV01;
    const identityRefs = receipt.external_refs.filter(
      (ref) =>
        ref.ref_type === "later_task_result_intake" &&
        ref.external_id === resolved.intake_identity &&
        ref.compatibility_namespace === COMPATIBILITY_NAMESPACE,
    );
    if (identityRefs.length === 0) continue;
    if (
      identityRefs.length !== 1 ||
      identityRefs[0]!.source_ref !== resolved.intake_request_fingerprint
    ) {
      throw intakeError("operator_pilot_later_result_identity_conflict", 409);
    }
    assertVNextCoreRecordMatchesProtocolPayloadBindingV01(record, {
      workspace_id: receipt.workspace_id,
      project_id: receipt.project_id,
      fingerprint: receipt.integrity.fingerprint,
    });
    if (
      record.record_id !== receipt.receipt_id ||
      record.created_at !== receipt.recorded_at ||
      record.idempotency_key !== receipt.idempotency_key
    ) {
      throw intakeError("operator_pilot_later_result_envelope_mismatch", 422);
    }
    matches.push(receipt);
  }
  if (matches.length > 1) {
    throw intakeError("operator_pilot_later_result_duplicate_identity", 409);
  }
  return matches[0] ?? null;
}

function readModelFromReceipt(
  db: Database.Database,
  config: VNextLocalOperatorPilotConfigV01,
  receipt: RunReceiptV01,
): VNextOperatorPilotLaterResultReadModelV01 {
  if (!isLaterResultReceipt(receipt)) {
    throw intakeError("operator_pilot_later_result_contract_mismatch", 422);
  }
  const packetRef = receipt.task_context_packet_ref;
  const intakeRefs = receipt.external_refs.filter(
    (ref) =>
      ref.ref_type === "later_task_result_intake" &&
      ref.compatibility_namespace === COMPATIBILITY_NAMESPACE,
  );
  const transitionRefs = receipt.external_refs.filter(
    (ref) =>
      ref.ref_type === "state_transition_receipt" &&
      ref.compatibility_namespace === COMPATIBILITY_NAMESPACE,
  );
  const consumptionRefs = receipt.external_refs.filter(
    (ref) =>
      ref.ref_type === "packet_consumption_report" &&
      ref.compatibility_namespace === COMPATIBILITY_NAMESPACE,
  );
  const citationRefs = receipt.external_refs.filter(
    (ref) =>
      ref.ref_type === "task_context_selected_entry" &&
      ref.compatibility_namespace === COMPATIBILITY_NAMESPACE,
  );
  const operatorActorRefs = receipt.external_refs.filter(
    (ref) =>
      ref.ref_type === "local_operator_actor" &&
      ref.compatibility_namespace === COMPATIBILITY_NAMESPACE,
  );
  const sessionEvidenceRefs = receipt.external_refs.filter(
    (ref) =>
      ref.ref_type === "local_operator_session_action" &&
      ref.compatibility_namespace === COMPATIBILITY_NAMESPACE,
  );
  const stateReadRefs = receipt.external_refs.filter(
    (ref) =>
      ref.ref_type === "accepted_semantic_state_read" &&
      ref.compatibility_namespace === COMPATIBILITY_NAMESPACE,
  );
  if (
    !packetRef?.source_ref ||
    packetRef.ref_type !== "task_context_packet" ||
    packetRef.trust_class !== "direct_local_observation" ||
    packetRef.compatibility_namespace !== COMPATIBILITY_NAMESPACE ||
    packetRef.observed_at !== receipt.recorded_at ||
    intakeRefs.length !== 1 ||
    intakeRefs[0]!.trust_class !== "direct_local_observation" ||
    intakeRefs[0]!.observed_at !== receipt.recorded_at ||
    !intakeRefs[0]!.source_ref ||
    transitionRefs.length !== 1 ||
    transitionRefs[0]!.trust_class !== "direct_local_observation" ||
    transitionRefs[0]!.observed_at !== receipt.recorded_at ||
    consumptionRefs.length !== 1 ||
    consumptionRefs[0]!.trust_class !== "user_declaration" ||
    consumptionRefs[0]!.observed_at !== receipt.recorded_at ||
    operatorActorRefs.length !== 1 ||
    operatorActorRefs[0]!.external_id !== config.operator_id ||
    operatorActorRefs[0]!.trust_class !== "user_declaration" ||
    operatorActorRefs[0]!.observed_at !== receipt.recorded_at ||
    !operatorActorRefs[0]!.source_ref ||
    sessionEvidenceRefs.length !== 1 ||
    sessionEvidenceRefs[0]!.trust_class !== "direct_local_observation" ||
    sessionEvidenceRefs[0]!.observed_at !== receipt.recorded_at ||
    sessionEvidenceRefs[0]!.source_ref !== operatorActorRefs[0]!.source_ref
  ) {
    throw intakeError("operator_pilot_later_result_relation_invalid", 422);
  }
  const lineage = inspectVNextOperatorPilotPacketLineageV01(db, {
    config,
    packet_id: packetRef.external_id,
    packet_fingerprint: packetRef.source_ref,
  });
  const transitionRef = transitionRefs[0]!;
  if (
    transitionRef.external_id !==
      lineage.source_transition_receipt.transition_receipt_id ||
    transitionRef.source_ref !==
      lineage.source_transition_receipt.transition_receipt_fingerprint
  ) {
    throw intakeError("operator_pilot_later_result_transition_relation_invalid", 422);
  }
  const acceptedById = new Map(
    lineage.packet.selected_context
      .filter((entry) => entry.entry_kind === "accepted_state_ref")
      .map((entry) => [entry.entry_id, entry]),
  );
  const cited = citationRefs.map((ref) => {
    const entry = acceptedById.get(ref.external_id);
    if (
      !entry?.external_ref ||
      !entry.source_ref ||
      entry.source_ref !== ref.source_ref ||
      ref.trust_class !== "user_declaration" ||
      ref.observed_at !== receipt.recorded_at
    ) {
      throw intakeError("operator_pilot_later_result_citation_relation_invalid", 422);
    }
    return {
      entry_id: entry.entry_id,
      state_ref: entry.external_ref,
      state_fingerprint: entry.source_ref,
    };
  });
  const reported = consumptionRefs[0]!.external_id;
  if (!("yes partial no unknown".split(" ").includes(reported))) {
    throw intakeError("operator_pilot_later_result_consumption_invalid", 422);
  }
  const packetConsumption: VNextOperatorPilotPacketConsumptionV01 = {
    reported_payload_use: reported as VNextOperatorPilotReportedPayloadUseV01,
    cited_selected_context: cited,
  };
  const expectedPacketRef = directRef(
    "task_context_packet",
    lineage.packet.packet_id,
    receipt.recorded_at,
    lineage.packet.integrity.fingerprint,
  );
  const expectedTransitionRef = directRef(
    "state_transition_receipt",
    lineage.source_transition_receipt.transition_receipt_id,
    receipt.recorded_at,
    lineage.source_transition_receipt.transition_receipt_fingerprint,
  );
  const intakeRef = intakeRefs[0]!;
  if (!/^later-result-intake:[a-f0-9]{31}$/.test(intakeRef.external_id)) {
    throw intakeError("operator_pilot_later_result_intake_identity_invalid", 422);
  }
  const expectedIntakeRef = directRef(
    "later_task_result_intake",
    intakeRef.external_id,
    receipt.recorded_at,
    intakeRef.source_ref!,
  );
  const expectedObserverRef = directRef(
    "later_task_result_intake_observer",
    `local-intake-observer:${config.project_id}`,
    receipt.recorded_at,
    intakeRef.source_ref!,
  );
  const sessionEvidenceRef = sessionEvidenceRefs[0]!;
  const expectedSessionEvidenceFingerprint = createProtocolSha256V01(
    canonicalizeProtocolValueV01({
      action: "record_later_task_result",
      workspace_id: config.workspace_id,
      project_id: config.project_id,
      operator_id: config.operator_id,
      session_id: sessionEvidenceRef.external_id,
      intake_request_fingerprint: intakeRef.source_ref,
      observed_at: receipt.recorded_at,
    }),
  );
  const expectedSessionEvidenceRef = directRef(
    "local_operator_session_action",
    sessionEvidenceRef.external_id,
    receipt.recorded_at,
    expectedSessionEvidenceFingerprint,
  );
  const expectedOperatorActorRef: ExternalRefV01 = {
    ref_version: "external_ref.v0.1",
    ref_type: "local_operator_actor",
    external_id: config.operator_id,
    trust_class: "user_declaration",
    observed_at: receipt.recorded_at,
    source_ref: expectedSessionEvidenceFingerprint,
    compatibility_namespace: COMPATIBILITY_NAMESPACE,
  };
  const expectedConsumptionRef: ExternalRefV01 = {
    ref_version: "external_ref.v0.1",
    ref_type: "packet_consumption_report",
    external_id: packetConsumption.reported_payload_use,
    trust_class: "user_declaration",
    observed_at: receipt.recorded_at,
    source_ref: createProtocolSha256V01(
      canonicalizeProtocolValueV01(packetConsumption),
    ),
    compatibility_namespace: COMPATIBILITY_NAMESPACE,
  };
  const expectedCitationRefs: ExternalRefV01[] = cited.map((entry) => ({
    ref_version: "external_ref.v0.1",
    ref_type: "task_context_selected_entry",
    external_id: entry.entry_id,
    trust_class: "user_declaration",
    observed_at: receipt.recorded_at,
    source_ref: entry.state_fingerprint,
    compatibility_namespace: COMPATIBILITY_NAMESPACE,
  }));
  const expectedStateReadRefs = cited.map((entry) =>
    directRef(
      "accepted_semantic_state_read",
      entry.state_ref.external_id,
      receipt.recorded_at,
      entry.state_fingerprint,
    ),
  );
  if (
    !sameCanonicalRef(packetRef, expectedPacketRef) ||
    !sameCanonicalRef(transitionRef, expectedTransitionRef) ||
    !sameCanonicalRef(intakeRef, expectedIntakeRef) ||
    !sameCanonicalRef(operatorActorRefs[0]!, expectedOperatorActorRef) ||
    !sameCanonicalRef(sessionEvidenceRef, expectedSessionEvidenceRef) ||
    !sameCanonicalRef(consumptionRefs[0]!, expectedConsumptionRef) ||
    canonicalRefMultiset(citationRefs) !==
      canonicalRefMultiset(expectedCitationRefs) ||
    canonicalRefMultiset(stateReadRefs) !==
      canonicalRefMultiset(expectedStateReadRefs)
  ) {
    throw intakeError("operator_pilot_later_result_exact_ref_binding_invalid", 422);
  }
  if (
    receipt.reporter_ref.ref_type !== "normalized_codex_result_report_record" ||
    receipt.reporter_ref.trust_class !== "imported_unverified" ||
    receipt.reporter_ref.compatibility_namespace !==
      "augnes.codex-result-report-ingestion.v0.1" ||
    !receipt.reporter_ref.observed_at ||
    !receipt.reporter_ref.source_ref ||
    !/^sha256:[a-f0-9]{64}$/.test(receipt.reporter_ref.source_ref)
  ) {
    throw intakeError("operator_pilot_later_result_reporter_provenance_invalid", 422);
  }
  const consumptionAttestations = receipt.attestations.filter(
    (attestation) => attestation.attestation_kind === "packet_consumption_report",
  );
  const expectedConsumptionSummary =
    `Caller-reported packet payload use: ${packetConsumption.reported_payload_use}; cited accepted-state entries: ${packetConsumption.cited_selected_context.length}.`;
  const consumptionAttestation = consumptionAttestations[0];
  if (
    consumptionAttestations.length !== 1 ||
    !consumptionAttestation ||
    consumptionAttestation.trust_class !== "user_declaration" ||
    consumptionAttestation.reported_at !== receipt.recorded_at ||
    consumptionAttestation.summary !== expectedConsumptionSummary ||
    canonicalizeProtocolValueV01(consumptionAttestation.reporter_ref) !==
      canonicalizeProtocolValueV01(expectedOperatorActorRef) ||
    canonicalRefMultiset(consumptionAttestation.source_refs) !==
      canonicalRefMultiset([
        expectedOperatorActorRef,
        expectedSessionEvidenceRef,
        expectedConsumptionRef,
      ]) ||
    canonicalRefMultiset(consumptionAttestation.subject_refs) !==
      canonicalRefMultiset([
        expectedPacketRef,
        ...expectedCitationRefs,
        ...cited.map((entry) => entry.state_ref),
      ])
  ) {
    throw intakeError("operator_pilot_later_result_consumption_attestation_invalid", 422);
  }
  const exactStateRefs = cited.map((entry) => entry.state_ref);
  if (
    cited.some(
      (entry) =>
        !receipt.external_refs.some(
          (ref) =>
            canonicalizeProtocolValueV01(ref) ===
            canonicalizeProtocolValueV01(entry.state_ref),
        ),
    ) ||
    stateReadRefs.length !== cited.length
  ) {
    throw intakeError("operator_pilot_later_result_state_read_relation_invalid", 422);
  }
  const observerRefs = receipt.observer_refs.filter(
    (ref) =>
      ref.ref_type === "later_task_result_intake_observer" &&
      ref.compatibility_namespace === COMPATIBILITY_NAMESPACE,
  );
  const localObservationKinds = new Set([
    "later_packet_integrity_read",
    "source_transition_receipt_integrity_read",
    "codex_result_record_validation",
  ]);
  if (
    observerRefs.length !== 1 ||
    !sameCanonicalRef(observerRefs[0]!, expectedObserverRef) ||
    receipt.observations.length !== localObservationKinds.size ||
    receipt.observations.some(
      (observation) =>
        !localObservationKinds.has(observation.observation_kind) ||
        observation.trust_class !== "direct_local_observation" ||
        observation.event_at !== receipt.recorded_at ||
        observation.observed_at !== receipt.recorded_at ||
        observation.related_command_ids.length !== 0 ||
        observation.related_check_ids.length !== 0 ||
        canonicalizeProtocolValueV01(observation.observer_ref) !==
          canonicalizeProtocolValueV01(expectedObserverRef),
    ) ||
    receipt.execution.status !== "unknown" ||
    receipt.execution.basis !== "attested" ||
    receipt.verification.status !== "unknown" ||
    receipt.verification.basis !== "attested" ||
    receipt.verification.required_check_ids.length !== 0
  ) {
    throw intakeError("operator_pilot_later_result_observation_boundary_invalid", 422);
  }
  const observationByKind = new Map(
    receipt.observations.map((observation) => [
      observation.observation_kind,
      observation,
    ]),
  );
  const expectedObservationSources = new Map<string, ExternalRefV01[]>([
    ["later_packet_integrity_read", [expectedPacketRef, expectedIntakeRef]],
    ["source_transition_receipt_integrity_read", [expectedTransitionRef, expectedIntakeRef]],
    ["codex_result_record_validation", [expectedIntakeRef]],
  ]);
  if (
    [...expectedObservationSources].some(([kind, refs]) => {
      const observation = observationByKind.get(kind);
      return (
        !observation ||
        canonicalRefMultiset(observation.source_refs) !==
          canonicalRefMultiset(refs)
      );
    })
  ) {
    throw intakeError("operator_pilot_later_result_observation_provenance_invalid", 422);
  }
  const packetObservation = observationByKind.get("later_packet_integrity_read")!;
  const transitionObservation = observationByKind.get(
    "source_transition_receipt_integrity_read",
  )!;
  const validationObservation = observationByKind.get(
    "codex_result_record_validation",
  )!;
  if (
    canonicalRefMultiset(packetObservation.related_artifact_refs) !==
      canonicalRefMultiset(expectedStateReadRefs) ||
    transitionObservation.related_artifact_refs.length !== 0 ||
    validationObservation.related_artifact_refs.length !== 0
  ) {
    throw intakeError("operator_pilot_later_result_observation_subject_invalid", 422);
  }
  const mappedAttestations = receipt.attestations.filter(
    (attestation) => attestation.attestation_kind !== "packet_consumption_report",
  );
  const mappedAttestationIds = new Set(
    mappedAttestations.map((attestation) => attestation.attestation_id),
  );
  const sourceRecordRefSet = canonicalRefMultiset([receipt.reporter_ref]);
  if (
    mappedAttestations.some(
      (attestation) =>
        attestation.trust_class !== "imported_unverified" ||
        canonicalizeProtocolValueV01(attestation.reporter_ref) !==
          canonicalizeProtocolValueV01(receipt.reporter_ref) ||
        attestation.reported_at !== receipt.reporter_ref.observed_at ||
        canonicalRefMultiset(attestation.source_refs) !== sourceRecordRefSet ||
        containsObservationGradeRef(attestation.subject_refs),
    ) ||
    receipt.checks.some(
      (check) =>
        check.required !== false ||
        check.status !== "unknown" ||
        check.basis !== "attested" ||
        canonicalRefMultiset(check.source_refs) !== sourceRecordRefSet,
    ) ||
    receipt.changed_artifacts.some(
      (artifact) =>
        artifact.basis !== "attested" ||
        artifact.change_kind !== "unknown" ||
        artifact.before_hash !== null ||
        artifact.after_hash !== null ||
        artifact.related_observation_ids.length !== 0 ||
        artifact.related_attestation_ids.length !== 1 ||
        !mappedAttestationIds.has(artifact.related_attestation_ids[0]!) ||
        artifact.artifact_ref.trust_class !== "imported_unverified" ||
        canonicalRefMultiset(artifact.source_refs) !== sourceRecordRefSet,
    ) ||
    receipt.commands.length !== 0 ||
    receipt.skipped_checks.length !== 0 ||
    receipt.model_invocations.length !== 0 ||
    receipt.verifier_refs.length !== 0 ||
    receipt.started_at !== null ||
    receipt.finished_at !== null ||
    receipt.host_ref !== null ||
    receipt.worker_ref !== null ||
    receipt.execution_environment.environment_kind !== "unknown" ||
    receipt.execution_environment.host_ref !== null ||
    receipt.execution_environment.worker_ref !== null ||
    receipt.execution_environment.operating_system !== null ||
    canonicalizeProtocolValueV01(
      receipt.execution_environment.runtime_labels,
    ) !== canonicalizeProtocolValueV01(["legacy-result-report-compatibility"]) ||
    canonicalRefMultiset(receipt.execution.source_refs) !== sourceRecordRefSet ||
    canonicalRefMultiset(receipt.verification.source_refs) !== sourceRecordRefSet ||
    canonicalRefMultiset(receipt.execution_environment.source_refs) !==
      sourceRecordRefSet
  ) {
    throw intakeError("operator_pilot_later_result_mapped_claim_trust_invalid", 422);
  }
  if (
    canonicalObservationGradeRefs(receipt.external_refs) !==
      canonicalObservationGradeRefs([
        expectedPacketRef,
        expectedTransitionRef,
        expectedIntakeRef,
        expectedSessionEvidenceRef,
        ...exactStateRefs,
        ...expectedStateReadRefs,
      ]) ||
    canonicalObservationGradeRefs(receipt.source_refs) !==
      canonicalObservationGradeRefs([
        expectedIntakeRef,
        expectedPacketRef,
        expectedTransitionRef,
        expectedSessionEvidenceRef,
        ...expectedStateReadRefs,
      ]) ||
    canonicalObservationGradeRefs(receipt.artifact_refs) !==
      canonicalObservationGradeRefs([
        ...exactStateRefs,
        ...expectedStateReadRefs,
      ]) ||
    canonicalObservationGradeRefs(receipt.compatibility.external_refs) !==
      canonicalObservationGradeRefs([
        expectedIntakeRef,
        expectedPacketRef,
        expectedTransitionRef,
        expectedSessionEvidenceRef,
      ]) ||
    containsObservationGradeRef(
      receipt.blockers.flatMap((issue) => issue.source_refs),
    ) ||
    containsObservationGradeRef(
      receipt.warnings.flatMap((issue) => issue.source_refs),
    ) ||
    containsObservationGradeRef(
      receipt.gaps.flatMap((issue) => issue.source_refs),
    ) ||
    containsObservationGradeRef(receipt.privacy_egress.destination_refs) ||
    containsObservationGradeRef(receipt.privacy_egress.source_refs) ||
    containsObservationGradeRef(receipt.cost_usage.source_refs) ||
    containsObservationGradeRef(
      receipt.capability_coverage.flatMap((entry) =>
        entry.source_ref ? [entry.source_ref] : [],
      ),
    ) ||
    receipt.work_ref !== null
  ) {
    throw intakeError("operator_pilot_later_result_direct_ref_allowlist_invalid", 422);
  }
  return {
    intake_version: VNEXT_OPERATOR_PILOT_LATER_RESULT_INTAKE_VERSION_V01,
    workspace_id: receipt.workspace_id,
    project_id: receipt.project_id,
    receipt,
    source_transition_receipt: {
      transition_receipt_id: transitionRef.external_id,
      transition_receipt_fingerprint: transitionRef.source_ref!,
    },
    packet_consumption: packetConsumption,
    relation: relationFor(packetConsumption),
    proposal_created: false,
    decision_created: false,
    transition_created: false,
    evidence_accepted: false,
    work_closed: false,
  };
}

function isLaterResultReceipt(value: unknown): value is RunReceiptV01 {
  return (
    !!value &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    Array.isArray((value as RunReceiptV01).compatibility?.source_contracts) &&
    (value as RunReceiptV01).compatibility.source_contracts.includes(
      VNEXT_OPERATOR_PILOT_LATER_RESULT_INTAKE_VERSION_V01,
    )
  );
}

function canonicalRefMultiset(refs: ExternalRefV01[]): string {
  return JSON.stringify(
    refs.map((ref) => canonicalizeProtocolValueV01(ref)).sort(),
  );
}

function sameCanonicalRef(left: ExternalRefV01, right: ExternalRefV01): boolean {
  return (
    canonicalizeProtocolValueV01(left) === canonicalizeProtocolValueV01(right)
  );
}

function isObservationGradeRef(ref: ExternalRefV01): boolean {
  return (
    ref.trust_class === "direct_local_observation" ||
    ref.trust_class === "verified_external_observation"
  );
}

function containsObservationGradeRef(refs: ExternalRefV01[]): boolean {
  return refs.some(isObservationGradeRef);
}

function canonicalObservationGradeRefs(refs: ExternalRefV01[]): string {
  return canonicalRefMultiset(refs.filter(isObservationGradeRef));
}

function parseIntakeRequest(value: unknown): ParsedIntakeRequestV01 {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw intakeError("operator_pilot_later_result_body_invalid");
  }
  const record = value as Record<string, unknown>;
  const allowed = new Set([
    "packet_id",
    "packet_fingerprint",
    "transition_receipt_id",
    "transition_receipt_fingerprint",
    "run_id",
    "result_report",
    "packet_consumption",
  ]);
  if (
    Object.keys(record).length !== allowed.size ||
    Object.keys(record).some((key) => !allowed.has(key))
  ) {
    throw intakeError("operator_pilot_later_result_body_unknown_field");
  }
  const consumption = record.packet_consumption;
  if (!consumption || typeof consumption !== "object" || Array.isArray(consumption)) {
    throw intakeError("operator_pilot_packet_consumption_invalid");
  }
  const consumptionRecord = consumption as Record<string, unknown>;
  if (
    Object.keys(consumptionRecord).length !== 2 ||
    Object.keys(consumptionRecord).some(
      (key) => !["reported_payload_use", "cited_selected_context_entry_ids"].includes(key),
    )
  ) {
    throw intakeError("operator_pilot_packet_consumption_unknown_field");
  }
  const reported = normalizeProtocolTextV01(consumptionRecord.reported_payload_use);
  if (!("yes partial no unknown".split(" ").includes(reported))) {
    throw intakeError("operator_pilot_packet_consumption_use_invalid");
  }
  const citations = stringArray(
    consumptionRecord.cited_selected_context_entry_ids,
    "cited_selected_context_entry_ids",
    MAX_CITATIONS,
  );
  if (
    ((reported === "yes" || reported === "partial") && citations.length === 0) ||
    ((reported === "no" || reported === "unknown") && citations.length > 0)
  ) {
    throw intakeError("operator_pilot_packet_consumption_citation_mismatch");
  }
  return {
    packet_id: requiredText(record.packet_id, "packet_id"),
    packet_fingerprint: sha256(record.packet_fingerprint, "packet_fingerprint"),
    transition_receipt_id: requiredText(
      record.transition_receipt_id,
      "transition_receipt_id",
    ),
    transition_receipt_fingerprint: sha256(
      record.transition_receipt_fingerprint,
      "transition_receipt_fingerprint",
    ),
    run_id: requiredText(record.run_id, "run_id", MAX_RUN_ID_CHARACTERS),
    result_report: record.result_report,
    packet_consumption: {
      reported_payload_use: reported as VNextOperatorPilotReportedPayloadUseV01,
      cited_selected_context_entry_ids: citations,
    },
  };
}

function resolveConsumption(
  input: ParsedIntakeRequestV01["packet_consumption"],
  acceptedById: Map<string, TaskContextPacketSelectedEntryV01>,
): VNextOperatorPilotPacketConsumptionV01 {
  const cited = input.cited_selected_context_entry_ids.map((entryId) => {
    const entry = acceptedById.get(entryId);
    if (!entry?.external_ref || !entry.source_ref) {
      throw intakeError("operator_pilot_packet_consumption_entry_missing", 422);
    }
    return {
      entry_id: entry.entry_id,
      state_ref: entry.external_ref,
      state_fingerprint: entry.source_ref,
    };
  });
  return {
    reported_payload_use: input.reported_payload_use,
    cited_selected_context: cited,
  };
}

function relationFor(
  consumption: VNextOperatorPilotPacketConsumptionV01,
): VNextOperatorPilotPacketConsumptionRelationV01 {
  return {
    packet_referenced: true,
    payload_use_reported: true,
    selected_state_refs_cited: consumption.cited_selected_context.length > 0,
    local_integrity_verified: true,
    actual_use_review_required: true,
    helpfulness_established: false,
  };
}

function assertResultReportInputKeys(value: unknown): void {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw intakeError("operator_pilot_later_result_report_invalid", 422);
  }
  if (Object.keys(value).some((key) => !RESULT_REPORT_KEYS.has(key))) {
    throw intakeError("operator_pilot_later_result_report_unknown_field", 422);
  }
}

function directRef(
  refType: string,
  externalId: string,
  observedAt: string,
  sourceRef: string,
): ExternalRefV01 {
  return {
    ref_version: "external_ref.v0.1",
    ref_type: refType,
    external_id: externalId,
    trust_class: "direct_local_observation",
    observed_at: observedAt,
    source_ref: sourceRef,
    compatibility_namespace: COMPATIBILITY_NAMESPACE,
  };
}

function requiredText(value: unknown, field: string, max = 256): string {
  const text = normalizeProtocolTextV01(value);
  if (!text || text !== value || text.length > max) {
    throw intakeError(`operator_pilot_${field}_invalid`);
  }
  return text;
}

function sha256(value: unknown, field: string): string {
  const text = requiredText(value, field);
  if (!/^sha256:[a-f0-9]{64}$/.test(text)) {
    throw intakeError(`operator_pilot_${field}_invalid`);
  }
  return text;
}

function stringArray(value: unknown, field: string, max: number): string[] {
  if (!Array.isArray(value) || value.length > max) {
    throw intakeError(`operator_pilot_${field}_invalid`);
  }
  const values = value.map((item) => requiredText(item, field));
  if (new Set(values).size !== values.length) {
    throw intakeError(`operator_pilot_${field}_duplicate`);
  }
  return values.sort();
}

function intakeError(code: string, status = 400) {
  return new VNextOperatorPilotLaterResultErrorV01(code, status);
}
