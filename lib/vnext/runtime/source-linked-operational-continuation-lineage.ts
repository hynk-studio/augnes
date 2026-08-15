import type Database from "better-sqlite3";

import {
  validateOperationalContinuationAdmissionIdentityV01,
} from "@/lib/vnext/operational-context-selection";
import {
  assertVNextCoreRecordMatchesProtocolPayloadBindingV01,
  assertVNextDurableSemanticStoreSchemaV01,
  listVNextCoreRecordsV01,
  readVNextCoreRecordV01,
  type VNextCoreRecordEnvelopeV01,
} from "@/lib/vnext/persistence/durable-semantic-store";
import {
  canonicalizeProtocolValueV01,
  createProtocolSha256V01,
  isProtocolRecordV01,
  parseStrictIsoTimestampV01,
  scanForbiddenProtocolMaterialV01,
} from "@/lib/vnext/protocol-primitives";
import { validateTaskContextPacketV01 } from "@/lib/vnext/task-context-packet";
import {
  readVNextLocalOperatorSessionHistoryV01,
  type VNextLocalOperatorSessionMutationAdmissionV01,
} from "@/lib/vnext/runtime/local-operator-session";
import {
  OPERATIONAL_CONTINUATION_ADMISSION_VERSION_V01,
  SOURCE_LINKED_OPERATIONAL_CONTINUATION_LINEAGE_V01,
  type OperationalContinuationAdmissionAuthorityV01,
  type OperationalContinuationAdmissionV01,
  type SourceLinkedOperationalContinuationLineageInspectionV01,
} from "@/types/vnext/operational-continuation-admission";
import {
  SOURCE_LINKED_OPERATIONAL_CONTINUATION_VERSION_V01,
  type SourceLinkedOperationalContinuationV01,
} from "@/types/vnext/operational-context-selection";
import type { TaskContextPacketV01 } from "@/types/vnext/task-context-packet";

export const OPERATIONAL_CONTINUATION_ADMISSION_ACTION_NAMESPACE_V01 =
  "augnes.vnext.operational-continuation-admission.v0.1" as const;

const SHA256 = /^sha256:[a-f0-9]{64}$/u;
const MAX_ADMISSIONS_PER_PROJECT = 2;

export class SourceLinkedOperationalContinuationLineageErrorV01 extends Error {
  constructor(readonly code: string, readonly status = 409) {
    super(code);
    this.name = "SourceLinkedOperationalContinuationLineageErrorV01";
  }
}

export function createOperationalContinuationAdmissionV01(input: {
  continuation: SourceLinkedOperationalContinuationV01;
  operator_id: string;
  session_admission: VNextLocalOperatorSessionMutationAdmissionV01;
  request_fingerprint: string;
}): OperationalContinuationAdmissionV01 {
  const continuation = input.continuation;
  const identity = continuation.materialization_identity;
  const selection = continuation.selection;
  const packetB = continuation.candidate_task_context_packet_b;
  const admittedAt = input.session_admission.action_observed_at;
  const sessionId = input.session_admission.session.session_id;
  const requestFingerprint = requiredFingerprint(
    input.request_fingerprint,
    "operational_continuation_admission_request_fingerprint_invalid",
  );
  const authenticationFingerprint = createProtocolSha256V01(
    canonicalizeProtocolValueV01({
      action: "admit_source_linked_operational_continuation",
      workspace_id: identity.workspace_id,
      project_id: identity.project_id,
      operator_id: input.operator_id,
      session_id: sessionId,
      materialization_id: identity.materialization_id,
      materialization_fingerprint: identity.materialization_fingerprint,
      request_fingerprint: requestFingerprint,
      admitted_at: admittedAt,
    }),
  );
  const requestIdHash = createProtocolSha256V01(
    canonicalizeProtocolValueV01({
      purpose: "operational_continuation_admission_request",
      request_fingerprint: requestFingerprint,
    }),
  );
  const admissionIdHash = createProtocolSha256V01(
    canonicalizeProtocolValueV01({
      purpose: OPERATIONAL_CONTINUATION_ADMISSION_VERSION_V01,
      idempotency_key: identity.future_admission_idempotency_key,
    }),
  );
  const core: Omit<OperationalContinuationAdmissionV01, "integrity"> = {
    admission_version: OPERATIONAL_CONTINUATION_ADMISSION_VERSION_V01,
    admission_id: `operational-continuation-admission:${admissionIdHash.slice("sha256:".length, 38)}`,
    workspace_id: identity.workspace_id,
    project_id: identity.project_id,
    work_ref: structuredClone(packetB.work_ref),
    lineage: {
      lineage_kind: SOURCE_LINKED_OPERATIONAL_CONTINUATION_LINEAGE_V01,
      packet_a: {
        packet_version: packetB.packet_version,
        packet_id: identity.packet_a_id,
        packet_fingerprint: identity.packet_a_fingerprint,
      },
      packet_b: {
        packet_version: packetB.packet_version,
        packet_id: packetB.packet_id,
        packet_fingerprint: packetB.integrity.fingerprint,
      },
      packet_a_was_exact_current_at_admission: true,
      packet_b_is_non_semantic_current_work: true,
      same_workspace_project_and_work: true,
      continuation_hop: 1,
      semantic_transition_created: false,
    },
    acgc5a_materialization_identity: structuredClone(identity),
    operational_context_selection: {
      selection_id: selection.selection_id,
      selection_fingerprint: selection.integrity.fingerprint,
    },
    acgc4_binding: {
      source_bundle_id: selection.acgc4_source_bundle.record_id,
      source_bundle_fingerprint:
        selection.acgc4_source_bundle.record_fingerprint,
      profile_id: selection.acgc4_profile.record_id,
      profile_fingerprint: selection.acgc4_profile.record_fingerprint,
      proposal_id: selection.acgc4_proposal.record_id,
      proposal_fingerprint: selection.acgc4_proposal.record_fingerprint,
      canonical_admission_idempotency_key:
        selection.acgc4_canonical_admission.idempotency_key,
    },
    effective_proposal_only_decisions: structuredClone(
      selection.effective_decisions,
    ),
    authenticated_action: {
      action: "admit_source_linked_operational_continuation",
      operator_actor_ref: {
        ref_version: "external_ref.v0.1",
        ref_type: "local_operator_actor",
        external_id: input.operator_id,
        trust_class: "user_declaration",
        observed_at: admittedAt,
        source_ref: authenticationFingerprint,
        compatibility_namespace:
          OPERATIONAL_CONTINUATION_ADMISSION_ACTION_NAMESPACE_V01,
      },
      local_session_action_ref: {
        ref_version: "external_ref.v0.1",
        ref_type: "local_operator_session_action",
        external_id: sessionId,
        trust_class: "direct_local_observation",
        observed_at: admittedAt,
        source_ref: authenticationFingerprint,
        compatibility_namespace: "augnes.vnext.local-operator-session.v0.1",
      },
      request_ref: {
        ref_version: "external_ref.v0.1",
        ref_type: "operational_continuation_admission_request",
        external_id: `operational-continuation-admission-request:${requestIdHash.slice("sha256:".length, 38)}`,
        trust_class: "user_declaration",
        observed_at: admittedAt,
        source_ref: requestFingerprint,
        compatibility_namespace:
          OPERATIONAL_CONTINUATION_ADMISSION_ACTION_NAMESPACE_V01,
      },
      admitted_at: admittedAt,
    },
    idempotency_key: identity.future_admission_idempotency_key,
    effect_summary: continuationAdmissionEffectSummaryV01(),
    authority_boundary: continuationAdmissionAuthorityV01(),
  };
  const admission: OperationalContinuationAdmissionV01 = {
    ...core,
    integrity: {
      algorithm: "sha256",
      canonicalization: "augnes-json-c14n-v0_1",
      fingerprint_scope:
        "operational_continuation_admission_without_integrity_fingerprint",
      fingerprint: createProtocolSha256V01(
        canonicalizeProtocolValueV01(core),
      ),
    },
  };
  assertOperationalContinuationAdmissionV01(admission);
  return admission;
}

export function assertOperationalContinuationAdmissionV01(
  value: unknown,
): asserts value is OperationalContinuationAdmissionV01 {
  if (!isProtocolRecordV01(value)) {
    refuse("operational_continuation_admission_invalid");
  }
  const admission = value as unknown as OperationalContinuationAdmissionV01;
  const topKeys = [
    "admission_version",
    "admission_id",
    "workspace_id",
    "project_id",
    "work_ref",
    "lineage",
    "acgc5a_materialization_identity",
    "operational_context_selection",
    "acgc4_binding",
    "effective_proposal_only_decisions",
    "authenticated_action",
    "idempotency_key",
    "effect_summary",
    "authority_boundary",
    "integrity",
  ].sort();
  if (
    canonicalizeProtocolValueV01(Object.keys(admission).sort()) !==
      canonicalizeProtocolValueV01(topKeys) ||
    admission.admission_version !==
      OPERATIONAL_CONTINUATION_ADMISSION_VERSION_V01 ||
    !admission.admission_id.startsWith(
      "operational-continuation-admission:",
    ) ||
    !admission.workspace_id ||
    !admission.project_id ||
    !SHA256.test(admission.idempotency_key) ||
    validateOperationalContinuationAdmissionIdentityV01(
      admission.acgc5a_materialization_identity,
    ).status !== "valid"
  ) {
    refuse("operational_continuation_admission_invalid");
  }
  const identity = admission.acgc5a_materialization_identity;
  const lineage = admission.lineage;
  if (
    admission.workspace_id !== identity.workspace_id ||
    admission.project_id !== identity.project_id ||
    admission.idempotency_key !== identity.future_admission_idempotency_key ||
    createProtocolSha256V01(canonicalizeProtocolValueV01(admission.work_ref)) !==
      identity.work_ref_fingerprint ||
    lineage.lineage_kind !==
      SOURCE_LINKED_OPERATIONAL_CONTINUATION_LINEAGE_V01 ||
    lineage.packet_a.packet_id !== identity.packet_a_id ||
    lineage.packet_a.packet_fingerprint !== identity.packet_a_fingerprint ||
    lineage.packet_b.packet_id !== identity.candidate_packet_b_id ||
    lineage.packet_b.packet_fingerprint !==
      identity.candidate_packet_b_fingerprint ||
    lineage.packet_a_was_exact_current_at_admission !== true ||
    lineage.packet_b_is_non_semantic_current_work !== true ||
    lineage.same_workspace_project_and_work !== true ||
    lineage.continuation_hop !== 1 ||
    lineage.semantic_transition_created !== false ||
    admission.operational_context_selection.selection_id !==
      identity.selection_id ||
    admission.operational_context_selection.selection_fingerprint !==
      identity.selection_fingerprint ||
    admission.acgc4_binding.source_bundle_id !==
      identity.acgc4_source_bundle_id ||
    admission.acgc4_binding.source_bundle_fingerprint !==
      identity.acgc4_source_bundle_fingerprint ||
    admission.acgc4_binding.profile_id !== identity.acgc4_profile_id ||
    admission.acgc4_binding.profile_fingerprint !==
      identity.acgc4_profile_fingerprint ||
    admission.acgc4_binding.proposal_id !== identity.acgc4_proposal_id ||
    admission.acgc4_binding.proposal_fingerprint !==
      identity.acgc4_proposal_fingerprint ||
    admission.acgc4_binding.canonical_admission_idempotency_key !==
      identity.acgc4_admission_idempotency_key ||
    createProtocolSha256V01(
      canonicalizeProtocolValueV01(
        admission.effective_proposal_only_decisions,
      ),
    ) !== identity.effective_decisions_fingerprint ||
    admission.effective_proposal_only_decisions.some(
      (decision) =>
        decision.review_mode !== "proposal_only_no_activation" ||
        decision.requested_transition_intent_present !== false,
    )
  ) {
    refuse("operational_continuation_admission_binding_invalid");
  }
  const expectedAdmissionIdHash = createProtocolSha256V01(
    canonicalizeProtocolValueV01({
      purpose: OPERATIONAL_CONTINUATION_ADMISSION_VERSION_V01,
      idempotency_key: admission.idempotency_key,
    }),
  );
  if (
    admission.admission_id !==
      `operational-continuation-admission:${expectedAdmissionIdHash.slice("sha256:".length, 38)}` ||
    canonicalizeProtocolValueV01(admission.effect_summary) !==
      canonicalizeProtocolValueV01(continuationAdmissionEffectSummaryV01()) ||
    canonicalizeProtocolValueV01(admission.authority_boundary) !==
      canonicalizeProtocolValueV01(continuationAdmissionAuthorityV01())
  ) {
    refuse("operational_continuation_admission_effect_or_authority_invalid");
  }
  assertAuthenticatedActionV01(admission);
  const { integrity, ...core } = admission;
  if (
    integrity.algorithm !== "sha256" ||
    integrity.canonicalization !== "augnes-json-c14n-v0_1" ||
    integrity.fingerprint_scope !==
      "operational_continuation_admission_without_integrity_fingerprint" ||
    integrity.fingerprint !==
      createProtocolSha256V01(canonicalizeProtocolValueV01(core))
  ) {
    refuse("operational_continuation_admission_fingerprint_invalid");
  }
  scanForbiddenProtocolMaterialV01(
    admission,
    "$",
    {
      error: (code) =>
        refuse(`operational_continuation_admission_material_refused:${code}`),
      warning: () => undefined,
    },
    {
      secret_material_message:
        "Secret-shaped material is forbidden in continuation admission.",
      provider_specific_field_message:
        "Provider identity must remain inside an ExternalRef.",
    },
  );
}

export function inspectSourceLinkedOperationalContinuationLineageV01(
  db: Database.Database,
  input: {
    workspace_id: string;
    project_id: string;
    packet_id: string;
    packet_fingerprint: string;
  },
): SourceLinkedOperationalContinuationLineageInspectionV01 {
  const state = readOperationalContinuationLineageStateV01(db, input);
  if (!state) refuse("operational_continuation_admission_missing", 404);
  if (
    state.packet_b.packet_id !== input.packet_id ||
    state.packet_b.integrity.fingerprint !== input.packet_fingerprint
  ) {
    refuse("operational_continuation_packet_not_admitted", 409);
  }
  return {
    lineage_kind: SOURCE_LINKED_OPERATIONAL_CONTINUATION_LINEAGE_V01,
    packet: structuredClone(state.packet_b),
    prior_packet: structuredClone(state.packet_a),
    admission: structuredClone(state.admission),
    projection_current: true,
    exact_source_rematerialization_reperformed: false,
    historical_canonical_writer_invocation_proven: false,
    authenticated_admission_provenance_bound: true,
    semantic_transition_created: false,
  };
}

export function readOperationalContinuationLineageStateV01(
  db: Database.Database,
  input: { workspace_id: string; project_id: string },
): {
  admission: OperationalContinuationAdmissionV01;
  record: VNextCoreRecordEnvelopeV01;
  packet_a: TaskContextPacketV01;
  packet_b: TaskContextPacketV01;
} | null {
  assertVNextDurableSemanticStoreSchemaV01(db);
  const records = listVNextCoreRecordsV01(db, {
    workspace_id: input.workspace_id,
    project_id: input.project_id,
    record_kinds: ["operational_continuation_admission"],
    limit: MAX_ADMISSIONS_PER_PROJECT,
  });
  if (records.length === 0) return null;
  if (records.length !== 1) {
    refuse("operational_continuation_admission_ambiguous");
  }
  const record = records[0]!;
  assertOperationalContinuationAdmissionV01(record.payload);
  const admission = record.payload;
  assertVNextCoreRecordMatchesProtocolPayloadBindingV01(record, {
    workspace_id: admission.workspace_id,
    project_id: admission.project_id,
    fingerprint: admission.integrity.fingerprint,
  });
  if (
    record.record_id !== admission.admission_id ||
    record.idempotency_key !== admission.idempotency_key ||
    record.created_at !== admission.authenticated_action.admitted_at ||
    record.fingerprint !== admission.integrity.fingerprint
  ) {
    refuse("operational_continuation_admission_envelope_invalid");
  }
  const packetA = readPacketV01(db, input, admission.lineage.packet_a);
  const packetB = readPacketV01(db, input, admission.lineage.packet_b);
  if (
    packetA.compatibility.source_contracts.includes(
      SOURCE_LINKED_OPERATIONAL_CONTINUATION_VERSION_V01,
    ) ||
    !packetB.compatibility.source_contracts.includes(
      SOURCE_LINKED_OPERATIONAL_CONTINUATION_VERSION_V01,
    ) ||
    canonicalizeProtocolValueV01(packetA.work_ref) !==
      canonicalizeProtocolValueV01(packetB.work_ref) ||
    canonicalizeProtocolValueV01(packetB.work_ref) !==
      canonicalizeProtocolValueV01(admission.work_ref) ||
    canonicalizeProtocolValueV01(packetA.task) !==
      canonicalizeProtocolValueV01(packetB.task) ||
    canonicalizeProtocolValueV01(packetA.constraints.required_checks) !==
      canonicalizeProtocolValueV01(packetB.constraints.required_checks) ||
    canonicalizeProtocolValueV01(packetA.constraints.forbidden_actions) !==
      canonicalizeProtocolValueV01(packetB.constraints.forbidden_actions) ||
    packetB.capability_grant !== null
  ) {
    refuse("operational_continuation_packet_relation_invalid");
  }
  validateHistoricalSessionV01(db, admission);
  return {
    admission: structuredClone(admission),
    record,
    packet_a: packetA,
    packet_b: packetB,
  };
}

export function operationalContinuationPacketIdempotencyKeyV01(
  db: Database.Database,
  input: { workspace_id: string; project_id: string; packet: TaskContextPacketV01 },
): string | null {
  if (
    !input.packet.compatibility.source_contracts.includes(
      SOURCE_LINKED_OPERATIONAL_CONTINUATION_VERSION_V01,
    )
  ) {
    return null;
  }
  const state = readOperationalContinuationLineageStateV01(db, input);
  if (
    !state ||
    state.packet_b.packet_id !== input.packet.packet_id ||
    state.packet_b.integrity.fingerprint !== input.packet.integrity.fingerprint
  ) {
    return null;
  }
  return state.admission.idempotency_key;
}

export function packetHasOperationalContinuationSuccessorV01(
  db: Database.Database,
  input: {
    workspace_id: string;
    project_id: string;
    packet_id: string;
    packet_fingerprint: string;
  },
): boolean {
  const state = readOperationalContinuationLineageStateV01(db, input);
  return Boolean(
    state &&
      state.packet_a.packet_id === input.packet_id &&
      state.packet_a.integrity.fingerprint === input.packet_fingerprint,
  );
}

function readPacketV01(
  db: Database.Database,
  scope: { workspace_id: string; project_id: string },
  binding: { packet_id: string; packet_fingerprint: string },
): TaskContextPacketV01 {
  const record = readVNextCoreRecordV01(db, {
    record_kind: "task_context_packet",
    record_id: binding.packet_id,
    workspace_id: scope.workspace_id,
    project_id: scope.project_id,
  });
  if (!record) refuse("operational_continuation_packet_missing", 404);
  if (record.fingerprint !== binding.packet_fingerprint) {
    refuse("operational_continuation_packet_resealed");
  }
  const packet = record.payload as TaskContextPacketV01;
  if (
    validateTaskContextPacketV01(packet, {
      evaluated_at: packet?.generated_at ?? "",
    }).status !== "valid" ||
    packet.workspace_id !== scope.workspace_id ||
    packet.project_id !== scope.project_id ||
    packet.packet_id !== record.record_id ||
    packet.integrity.fingerprint !== record.fingerprint ||
    record.created_at !== packet.generated_at
  ) {
    refuse("operational_continuation_packet_invalid");
  }
  if (
    packet.compatibility.source_contracts.includes(
      SOURCE_LINKED_OPERATIONAL_CONTINUATION_VERSION_V01,
    ) &&
    (record.idempotency_key === null ||
      record.idempotency_key !==
        readAdmissionIdempotencyWithoutPacketTraversalV01(db, scope, packet))
  ) {
    refuse("operational_continuation_packet_envelope_invalid");
  }
  return packet;
}

function readAdmissionIdempotencyWithoutPacketTraversalV01(
  db: Database.Database,
  scope: { workspace_id: string; project_id: string },
  packet: TaskContextPacketV01,
): string | null {
  const rows = listVNextCoreRecordsV01(db, {
    ...scope,
    record_kinds: ["operational_continuation_admission"],
    limit: MAX_ADMISSIONS_PER_PROJECT,
  });
  const matches = rows.flatMap((record) => {
    try {
      assertOperationalContinuationAdmissionV01(record.payload);
      return record.payload.lineage.packet_b.packet_id === packet.packet_id &&
        record.payload.lineage.packet_b.packet_fingerprint ===
          packet.integrity.fingerprint
        ? [record.payload.idempotency_key]
        : [];
    } catch {
      return [];
    }
  });
  return matches.length === 1 ? matches[0]! : null;
}

function assertAuthenticatedActionV01(
  admission: OperationalContinuationAdmissionV01,
): void {
  const action = admission.authenticated_action;
  const actor = action.operator_actor_ref;
  const session = action.local_session_action_ref;
  const request = action.request_ref;
  if (
    action.action !== "admit_source_linked_operational_continuation" ||
    parseStrictIsoTimestampV01(action.admitted_at) === null ||
    actor.ref_type !== "local_operator_actor" ||
    actor.trust_class !== "user_declaration" ||
    actor.compatibility_namespace !==
      OPERATIONAL_CONTINUATION_ADMISSION_ACTION_NAMESPACE_V01 ||
    session.ref_type !== "local_operator_session_action" ||
    session.trust_class !== "direct_local_observation" ||
    session.compatibility_namespace !==
      "augnes.vnext.local-operator-session.v0.1" ||
    request.ref_type !== "operational_continuation_admission_request" ||
    request.trust_class !== "user_declaration" ||
    request.compatibility_namespace !==
      OPERATIONAL_CONTINUATION_ADMISSION_ACTION_NAMESPACE_V01 ||
    actor.observed_at !== action.admitted_at ||
    session.observed_at !== action.admitted_at ||
    request.observed_at !== action.admitted_at ||
    !actor.source_ref ||
    actor.source_ref !== session.source_ref ||
    !request.source_ref ||
    !SHA256.test(request.source_ref)
  ) {
    refuse("operational_continuation_admission_provenance_invalid");
  }
  const expectedAuthenticationFingerprint = createProtocolSha256V01(
    canonicalizeProtocolValueV01({
      action: action.action,
      workspace_id: admission.workspace_id,
      project_id: admission.project_id,
      operator_id: actor.external_id,
      session_id: session.external_id,
      materialization_id:
        admission.acgc5a_materialization_identity.materialization_id,
      materialization_fingerprint:
        admission.acgc5a_materialization_identity.materialization_fingerprint,
      request_fingerprint: request.source_ref,
      admitted_at: action.admitted_at,
    }),
  );
  const requestIdHash = createProtocolSha256V01(
    canonicalizeProtocolValueV01({
      purpose: "operational_continuation_admission_request",
      request_fingerprint: request.source_ref,
    }),
  );
  if (
    actor.source_ref !== expectedAuthenticationFingerprint ||
    request.external_id !==
      `operational-continuation-admission-request:${requestIdHash.slice("sha256:".length, 38)}`
  ) {
    refuse("operational_continuation_admission_provenance_invalid");
  }
}

function validateHistoricalSessionV01(
  db: Database.Database,
  admission: OperationalContinuationAdmissionV01,
): void {
  const sessionRef = admission.authenticated_action.local_session_action_ref;
  const actorRef = admission.authenticated_action.operator_actor_ref;
  const session = readVNextLocalOperatorSessionHistoryV01(db, {
    session_id: sessionRef.external_id,
  });
  const admittedAt = Date.parse(admission.authenticated_action.admitted_at);
  if (
    !session ||
    session.workspace_id !== admission.workspace_id ||
    session.project_id !== admission.project_id ||
    session.operator_id !== actorRef.external_id ||
    !session.bootstrap_consumed_at ||
    Date.parse(session.issued_at) > admittedAt ||
    Date.parse(session.bootstrap_consumed_at) > admittedAt ||
    Date.parse(session.expires_at) < admittedAt ||
    (session.revoked_at !== null && Date.parse(session.revoked_at) < admittedAt)
  ) {
    refuse("operational_continuation_admission_session_provenance_invalid");
  }
}

function continuationAdmissionEffectSummaryV01(): OperationalContinuationAdmissionV01["effect_summary"] {
  return {
    task_context_packet_b_persisted: true,
    continuation_admission_persisted: true,
    packet_b_became_current_work: true,
    attachment_prepared: false,
    start_decision_created: false,
    resume_decision_created: false,
    grant_issued: false,
    run_created: false,
    semantic_state_changed: false,
    semantic_target_head_changed: false,
    state_transition_receipt_created: false,
    proposal_changed: false,
    review_decision_changed: false,
  };
}

function continuationAdmissionAuthorityV01(): OperationalContinuationAdmissionAuthorityV01 {
  return {
    is_operational_policy: false,
    activates_policy: false,
    performs_semantic_transition: false,
    changes_accepted_semantic_state: false,
    grants_execution_authority: false,
    grants_external_effect_authority: false,
    grants_scheduling_authority: false,
    inherits_run_a_grant: false,
    inherits_run_a_capability_summary: false,
    inherits_run_a_attachment: false,
    creates_attachment: false,
    creates_start_decision: false,
    creates_resume_decision: false,
    creates_managed_run: false,
    calls_provider: false,
    calls_model: false,
    calls_network: false,
    calls_github: false,
    writes_project_files: false,
    executes_project_commands: false,
    closes_work: false,
  };
}

function requiredFingerprint(value: string, code: string): string {
  if (!SHA256.test(value)) refuse(code, 400);
  return value;
}

function refuse(code: string, status = 409): never {
  throw new SourceLinkedOperationalContinuationLineageErrorV01(code, status);
}
