import { createHmac, timingSafeEqual } from "node:crypto";

import type Database from "better-sqlite3";

import {
  assertVNextCoreRecordMatchesProtocolPayloadBindingV01,
  assertVNextDurableSemanticStoreSchemaV01,
  readVNextCoreRecordV01,
} from "@/lib/vnext/persistence/durable-semantic-store";
import {
  canonicalizeProtocolValueV01,
  normalizeProtocolTextV01,
  parseStrictIsoTimestampV01,
} from "@/lib/vnext/protocol-primitives";
import { validateTaskContextPacketV01 } from "@/lib/vnext/task-context-packet";
import {
  createStateTransitionReceiptLineageRefV01,
  validateSemanticTransitionFullChainV01,
} from "@/lib/vnext/state-transition-eligibility";
import {
  VNEXT_SEMANTIC_COMMIT_PREVIEW_MAX_AGE_MS_V01,
  commitVNextSemanticTransitionInsideTransactionV01,
  loadValidatedVNextSemanticTransitionRelationV01,
  prepareVNextSemanticCommitPreviewV01,
  recordVNextSemanticCommitAuthorizationInsideTransactionV01,
  type VNextSemanticCommitGateRecordV01,
  type VNextSemanticCommitPreviewV01,
  type VNextSemanticTransitionCommitResultV01,
} from "@/lib/vnext/runtime/durable-semantic-transition";
import {
  VNEXT_PERSISTED_SEMANTIC_CONTEXT_COMPILER_VERSION_V01,
  compileTaskContextPacketFromPersistedSemanticStateInsideTransactionV01,
  type CompileTaskContextPacketFromPersistedSemanticStateResultV01,
} from "@/lib/vnext/runtime/persisted-semantic-context-compiler";
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
  readVNextOperatorPilotSemanticReviewV01,
  validateVNextOperatorPilotReviewDecisionProvenanceV01,
} from "@/lib/vnext/runtime/operator-pilot-review-material";
import type { ReviewDecisionV01 } from "@/types/vnext/review-decision";
import type { TaskContextPacketV01 } from "@/types/vnext/task-context-packet";

export const VNEXT_OPERATOR_PILOT_TRANSITION_RUNTIME_VERSION_V01 =
  "vnext_operator_pilot_semantic_transition.v0.1" as const;
export const VNEXT_OPERATOR_PILOT_GATE_TTL_MS_V01 = 10 * 60 * 1000;
export const VNEXT_OPERATOR_PILOT_LATER_PACKET_TTL_MS_V01 =
  8 * 60 * 60 * 1000;
export const VNEXT_OPERATOR_PILOT_PREVIEW_COOKIE_V01 =
  "augnes_vnext_operator_preview_v01" as const;
export const VNEXT_OPERATOR_PILOT_PREVIEW_COOKIE_PATH_V01 =
  "/api/vnext/operator" as const;

const MAX_ID_CHARACTERS = 256;
const MAX_COOKIE_CHARACTERS = 4096;

export class VNextOperatorPilotTransitionErrorV01 extends Error {
  readonly code: string;
  readonly status: number;

  constructor(code: string, status = 400) {
    super(code);
    this.name = "VNextOperatorPilotTransitionErrorV01";
    this.code = code;
    this.status = status;
  }
}

interface ExactDecisionBindingV01 {
  proposal_id: string;
  proposal_fingerprint: string;
  decision_id: string;
  decision_fingerprint: string;
}

interface ConfirmRequestV01 extends ExactDecisionBindingV01 {
  confirmation_digest: string;
}

interface CommitRequestV01 extends ExactDecisionBindingV01 {
  gate_record_id: string;
  gate_record_fingerprint: string;
}

interface CompileRequestV01 {
  transition_receipt_id: string;
  transition_receipt_fingerprint: string;
  prior_packet_id: string;
  prior_packet_fingerprint: string;
}

interface PreviewBindingPayloadV01 extends ExactDecisionBindingV01 {
  binding_version: typeof VNEXT_OPERATOR_PILOT_TRANSITION_RUNTIME_VERSION_V01;
  session_id: string;
  workspace_id: string;
  project_id: string;
  current_state_observed_at: string;
  previewed_at: string;
  confirmation_digest: string;
}

export interface VNextOperatorPilotPreviewResultV01 {
  preview: VNextSemanticCommitPreviewV01;
  preview_binding_cookie: string;
  pilot_policy: {
    single_target: true;
    accept_create_only: true;
    current_state_required: "absent";
    authorized_applier_derived_by_server: true;
    gate_ttl_ms: typeof VNEXT_OPERATOR_PILOT_GATE_TTL_MS_V01;
  };
  preview_is_write: false;
}

export interface VNextOperatorPilotAuthorizationResultV01 {
  status: "inserted" | "exact_replay";
  gate_record: VNextSemanticCommitGateRecordV01;
  eligibility_status: "eligible";
  eligibility: ReturnType<
    typeof recordVNextSemanticCommitAuthorizationInsideTransactionV01
  >["eligibility"];
  state_applied: false;
  session_admission: VNextLocalOperatorSessionMutationAdmissionV01;
}

export interface VNextOperatorPilotCommitResultV01 {
  status: VNextSemanticTransitionCommitResultV01["status"];
  transition_receipt: VNextSemanticTransitionCommitResultV01["transition_receipt"];
  eligibility_status: "eligible";
  eligibility: VNextSemanticTransitionCommitResultV01["eligibility"];
  packet_compiled: false;
  session_admission: VNextLocalOperatorSessionMutationAdmissionV01;
}

export interface VNextOperatorPilotCompileResultV01 {
  status: CompileTaskContextPacketFromPersistedSemanticStateResultV01["status"];
  later_packet: TaskContextPacketV01;
  transition_receipt_id: string;
  transition_receipt_fingerprint: string;
  transition_applied: false;
  session_admission: VNextLocalOperatorSessionMutationAdmissionV01;
}

export function prepareVNextOperatorPilotSemanticCommitPreviewV01(
  db: Database.Database,
  input: {
    config: VNextLocalOperatorPilotConfigV01;
    credential: VNextLocalOperatorSessionCredentialV01;
    request: unknown;
    clock?: VNextLocalRuntimeClockV01;
  },
): VNextOperatorPilotPreviewResultV01 {
  assertVNextDurableSemanticStoreSchemaV01(db);
  const request = parseExactDecisionBinding(input.request);
  const authentication = authenticateVNextLocalOperatorSessionV01(db, input);
  const material = requirePilotAcceptCreateMaterial(db, input.config, request, {
    require_absent: true,
    required_session_id: authentication.session.session_id,
  });
  const preview = prepareVNextSemanticCommitPreviewV01(db, {
    workspace_id: input.config.workspace_id,
    project_id: input.config.project_id,
    ...request,
    authorized_applier_identity: authorizedApplierIdentity(input.config),
    gate_ttl_ms: VNEXT_OPERATOR_PILOT_GATE_TTL_MS_V01,
    clock: input.clock,
  });
  assertPilotPreview(preview, material.decision);
  const binding = createPreviewBinding(
    input.config,
    authentication.credential,
    preview,
  );
  return {
    preview,
    preview_binding_cookie: binding,
    pilot_policy: {
      single_target: true,
      accept_create_only: true,
      current_state_required: "absent",
      authorized_applier_derived_by_server: true,
      gate_ttl_ms: VNEXT_OPERATOR_PILOT_GATE_TTL_MS_V01,
    },
    preview_is_write: false,
  };
}

export function confirmVNextOperatorPilotSemanticCommitV01(
  db: Database.Database,
  input: {
    config: VNextLocalOperatorPilotConfigV01;
    credential: VNextLocalOperatorSessionCredentialV01;
    preview_binding_cookie: string;
    request: unknown;
    clock?: VNextLocalRuntimeClockV01;
    secret_source?: VNextLocalOperatorSecretSourceV01;
  },
): VNextOperatorPilotAuthorizationResultV01 {
  assertVNextDurableSemanticStoreSchemaV01(db);
  const request = parseConfirmRequest(input.request);
  authenticateVNextLocalOperatorSessionV01(db, input);
  const binding = readPreviewBinding(
    input.preview_binding_cookie,
    input.config,
    input.credential,
    request,
  );
  const prevalidated = rebuildBoundPreview(db, input.config, binding);
  requirePilotAcceptCreateMaterial(db, input.config, request, {
    require_absent: true,
    required_session_id: input.credential.session_id,
  });
  assertPilotPreview(prevalidated.preview, prevalidated.decision);
  if (db.inTransaction) throw transitionError("operator_pilot_nested_transaction", 409);
  db.exec("BEGIN IMMEDIATE");
  try {
    const admission = admitVNextLocalOperatorMutationInsideTransactionV01(db, input);
    const material = requirePilotAcceptCreateMaterial(db, input.config, request, {
      require_absent: true,
      required_session_id: admission.session.session_id,
    });
    const exact = rebuildBoundPreview(db, input.config, binding);
    assertPilotPreview(exact.preview, material.decision);
    const result = recordVNextSemanticCommitAuthorizationInsideTransactionV01(
      db,
      {
        preview: exact.preview,
        confirmation_digest: request.confirmation_digest,
        operator_actor_ref: material.decision.actor_ref,
        clock: input.clock,
      },
    );
    if (result.eligibility.status !== "eligible") {
      throw transitionError("operator_pilot_gate_not_eligible", 409);
    }
    db.exec("COMMIT");
    return {
      status: result.status,
      gate_record: result.gate_record,
      eligibility_status: "eligible",
      eligibility: result.eligibility,
      state_applied: false,
      session_admission: admission,
    };
  } catch (error) {
    if (db.inTransaction) db.exec("ROLLBACK");
    throw error;
  }
}

export function commitVNextOperatorPilotSemanticTransitionV01(
  db: Database.Database,
  input: {
    config: VNextLocalOperatorPilotConfigV01;
    credential: VNextLocalOperatorSessionCredentialV01;
    request: unknown;
    clock?: VNextLocalRuntimeClockV01;
    secret_source?: VNextLocalOperatorSecretSourceV01;
  },
): VNextOperatorPilotCommitResultV01 {
  assertVNextDurableSemanticStoreSchemaV01(db);
  const request = parseCommitRequest(input.request);
  authenticateVNextLocalOperatorSessionV01(db, input);
  assertPilotGateAndDecision(
    db,
    input.config,
    request,
    input.credential.session_id,
  );
  if (db.inTransaction) throw transitionError("operator_pilot_nested_transaction", 409);
  db.exec("BEGIN IMMEDIATE");
  try {
    const admission = admitVNextLocalOperatorMutationInsideTransactionV01(db, input);
    assertPilotGateAndDecision(
      db,
      input.config,
      request,
      admission.session.session_id,
    );
    const result = commitVNextSemanticTransitionInsideTransactionV01(db, {
      workspace_id: input.config.workspace_id,
      project_id: input.config.project_id,
      proposal_id: request.proposal_id,
      proposal_fingerprint: request.proposal_fingerprint,
      decision_id: request.decision_id,
      decision_fingerprint: request.decision_fingerprint,
      gate_record_id: request.gate_record_id,
      gate_record_fingerprint: request.gate_record_fingerprint,
      clock: input.clock,
    });
    if (result.eligibility.status !== "eligible") {
      throw transitionError("operator_pilot_transition_not_eligible", 409);
    }
    db.exec("COMMIT");
    return {
      status: result.status,
      transition_receipt: result.transition_receipt,
      eligibility_status: "eligible",
      eligibility: result.eligibility,
      packet_compiled: false,
      session_admission: admission,
    };
  } catch (error) {
    if (db.inTransaction) db.exec("ROLLBACK");
    throw error;
  }
}

export function compileVNextOperatorPilotLaterContextV01(
  db: Database.Database,
  input: {
    config: VNextLocalOperatorPilotConfigV01;
    credential: VNextLocalOperatorSessionCredentialV01;
    request: unknown;
    clock?: VNextLocalRuntimeClockV01;
    secret_source?: VNextLocalOperatorSecretSourceV01;
  },
): VNextOperatorPilotCompileResultV01 {
  assertVNextDurableSemanticStoreSchemaV01(db);
  const request = parseCompileRequest(input.request);
  authenticateVNextLocalOperatorSessionV01(db, input);
  const transition = requirePilotAppliedCreate(db, input.config, request);
  const priorPacket = readPersistedPriorPacket(db, input.config, request);
  assertPriorPacketBindsSourceProposal(transition.proposal.task_context_packet_ref, priorPacket);
  if (db.inTransaction) throw transitionError("operator_pilot_nested_transaction", 409);
  db.exec("BEGIN IMMEDIATE");
  try {
    const admission = admitVNextLocalOperatorMutationInsideTransactionV01(db, input);
    const exactTransition = requirePilotAppliedCreate(db, input.config, request);
    const exactPriorPacket = readPersistedPriorPacket(db, input.config, request);
    assertPriorPacketBindsSourceProposal(
      exactTransition.proposal.task_context_packet_ref,
      exactPriorPacket,
    );
    const existing = findExistingCompiledPacket(
      db,
      exactTransition,
      exactPriorPacket,
    );
    if (existing) {
      const replay =
        compileTaskContextPacketFromPersistedSemanticStateInsideTransactionV01(
          db,
          {
            workspace_id: input.config.workspace_id,
            project_id: input.config.project_id,
            prior_packet: exactPriorPacket,
            transition_receipt_id: request.transition_receipt_id,
            transition_receipt_fingerprint:
              request.transition_receipt_fingerprint,
            expiry_policy: {
              mode: "explicit",
              expires_at: existing.expires_at,
            },
            clock: { now: () => existing.generated_at },
          },
        );
      if (
        replay.status !== "exact_replay" ||
        canonicalizeProtocolValueV01(replay.later_packet) !==
          canonicalizeProtocolValueV01(existing)
      ) {
        throw transitionError("operator_pilot_compiled_packet_replay_conflict", 409);
      }
      db.exec("COMMIT");
      return {
        status: "exact_replay",
        later_packet: replay.later_packet,
        transition_receipt_id: request.transition_receipt_id,
        transition_receipt_fingerprint: request.transition_receipt_fingerprint,
        transition_applied: false,
        session_admission: admission,
      };
    }
    const generatedAt = readVNextLocalRuntimeClockNowV01(
      input.clock,
      "operator_pilot_later_packet_generated_at",
    );
    const expiresAt = new Date(
      parseStrictIsoTimestampV01(generatedAt)! +
        VNEXT_OPERATOR_PILOT_LATER_PACKET_TTL_MS_V01,
    ).toISOString();
    const result =
      compileTaskContextPacketFromPersistedSemanticStateInsideTransactionV01(
        db,
        {
          workspace_id: input.config.workspace_id,
          project_id: input.config.project_id,
          prior_packet: exactPriorPacket,
          transition_receipt_id: request.transition_receipt_id,
          transition_receipt_fingerprint:
            request.transition_receipt_fingerprint,
          expiry_policy: { mode: "explicit", expires_at: expiresAt },
          clock: { now: () => generatedAt },
        },
      );
    db.exec("COMMIT");
    return {
      status: result.status,
      later_packet: result.later_packet,
      transition_receipt_id: request.transition_receipt_id,
      transition_receipt_fingerprint: request.transition_receipt_fingerprint,
      transition_applied: false,
      session_admission: admission,
    };
  } catch (error) {
    if (db.inTransaction) db.exec("ROLLBACK");
    throw error;
  }
}

export function serializeVNextOperatorPilotPreviewBindingCookieV01(input: {
  value: string;
  expires_at: string;
  secure: boolean;
}): string {
  if (!input.value || input.value.length > MAX_COOKIE_CHARACTERS) {
    throw transitionError("operator_pilot_preview_binding_invalid", 500);
  }
  const expires = parseStrictIsoTimestampV01(input.expires_at);
  if (expires === null) {
    throw transitionError("operator_pilot_preview_binding_invalid", 500);
  }
  return [
    `${VNEXT_OPERATOR_PILOT_PREVIEW_COOKIE_V01}=${input.value}`,
    `Path=${VNEXT_OPERATOR_PILOT_PREVIEW_COOKIE_PATH_V01}`,
    "HttpOnly",
    "SameSite=Strict",
    `Expires=${new Date(expires).toUTCString()}`,
    `Max-Age=${Math.floor(VNEXT_SEMANTIC_COMMIT_PREVIEW_MAX_AGE_MS_V01 / 1000)}`,
    input.secure ? "Secure" : null,
  ].filter(Boolean).join("; ");
}

export function serializeVNextOperatorPilotPreviewBindingCookieClearV01(
  secure: boolean,
): string {
  return [
    `${VNEXT_OPERATOR_PILOT_PREVIEW_COOKIE_V01}=`,
    `Path=${VNEXT_OPERATOR_PILOT_PREVIEW_COOKIE_PATH_V01}`,
    "HttpOnly",
    "SameSite=Strict",
    "Expires=Thu, 01 Jan 1970 00:00:00 GMT",
    "Max-Age=0",
    secure ? "Secure" : null,
  ].filter(Boolean).join("; ");
}

export function readVNextOperatorPilotPreviewBindingCookieFromRequestV01(
  request: Request,
): string {
  const header = request.headers.get("cookie");
  if (!header || header.length > MAX_COOKIE_CHARACTERS) {
    throw transitionError("operator_pilot_preview_binding_missing", 409);
  }
  const values = header
    .split(";")
    .map((part) => part.trim())
    .filter((part) => part.startsWith(`${VNEXT_OPERATOR_PILOT_PREVIEW_COOKIE_V01}=`))
    .map((part) => part.slice(VNEXT_OPERATOR_PILOT_PREVIEW_COOKIE_V01.length + 1));
  if (values.length !== 1 || !values[0]) {
    throw transitionError("operator_pilot_preview_binding_missing", 409);
  }
  return values[0];
}

function createPreviewBinding(
  config: VNextLocalOperatorPilotConfigV01,
  credential: VNextLocalOperatorSessionCredentialV01,
  preview: VNextSemanticCommitPreviewV01,
): string {
  const payload: PreviewBindingPayloadV01 = {
    binding_version: VNEXT_OPERATOR_PILOT_TRANSITION_RUNTIME_VERSION_V01,
    session_id: credential.session_id,
    workspace_id: config.workspace_id,
    project_id: config.project_id,
    proposal_id: preview.proposal_id,
    proposal_fingerprint: preview.proposal_fingerprint,
    decision_id: preview.decision_id,
    decision_fingerprint: preview.decision_fingerprint,
    current_state_observed_at:
      preview.current_state_observations[0]!.observed_at,
    previewed_at: preview.previewed_at,
    confirmation_digest: preview.confirmation_digest,
  };
  const encoded = Buffer.from(canonicalizeProtocolValueV01(payload)).toString(
    "base64url",
  );
  const signature = previewBindingSignature(encoded, credential.session_secret);
  return `${encoded}.${signature}`;
}

function readPreviewBinding(
  value: string,
  config: VNextLocalOperatorPilotConfigV01,
  credential: VNextLocalOperatorSessionCredentialV01,
  request: ReturnType<typeof parseConfirmRequest>,
): PreviewBindingPayloadV01 {
  if (!value || value.length > MAX_COOKIE_CHARACTERS) {
    throw transitionError("operator_pilot_preview_binding_invalid", 409);
  }
  const parts = value.split(".");
  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    throw transitionError("operator_pilot_preview_binding_invalid", 409);
  }
  const expected = previewBindingSignature(parts[0], credential.session_secret);
  const actual = parts[1];
  if (!constantTimeTextEqual(actual, expected)) {
    throw transitionError("operator_pilot_preview_binding_invalid", 409);
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(Buffer.from(parts[0], "base64url").toString("utf8"));
  } catch {
    throw transitionError("operator_pilot_preview_binding_invalid", 409);
  }
  const payload = parsePreviewBindingPayload(parsed);
  if (
    payload.session_id !== credential.session_id ||
    payload.workspace_id !== config.workspace_id ||
    payload.project_id !== config.project_id ||
    payload.proposal_id !== request.proposal_id ||
    payload.proposal_fingerprint !== request.proposal_fingerprint ||
    payload.decision_id !== request.decision_id ||
    payload.decision_fingerprint !== request.decision_fingerprint ||
    payload.confirmation_digest !== request.confirmation_digest
  ) {
    throw transitionError("operator_pilot_preview_binding_mismatch", 409);
  }
  return payload;
}

function rebuildBoundPreview(
  db: Database.Database,
  config: VNextLocalOperatorPilotConfigV01,
  binding: PreviewBindingPayloadV01,
): { preview: VNextSemanticCommitPreviewV01; decision: ReviewDecisionV01 } {
  const decision = requirePilotAcceptCreateMaterial(db, config, binding, {
    require_absent: true,
    required_session_id: binding.session_id,
  }).decision;
  const values = [binding.current_state_observed_at, binding.previewed_at];
  let index = 0;
  const clock: VNextLocalRuntimeClockV01 = {
    now: () => values[Math.min(index++, values.length - 1)]!,
  };
  const preview = prepareVNextSemanticCommitPreviewV01(db, {
    workspace_id: config.workspace_id,
    project_id: config.project_id,
    proposal_id: binding.proposal_id,
    proposal_fingerprint: binding.proposal_fingerprint,
    decision_id: binding.decision_id,
    decision_fingerprint: binding.decision_fingerprint,
    authorized_applier_identity: authorizedApplierIdentity(config),
    gate_ttl_ms: VNEXT_OPERATOR_PILOT_GATE_TTL_MS_V01,
    clock,
  });
  if (preview.confirmation_digest !== binding.confirmation_digest) {
    throw transitionError("operator_pilot_preview_stale", 409);
  }
  return { preview, decision };
}

function requirePilotAcceptCreateMaterial(
  db: Database.Database,
  config: VNextLocalOperatorPilotConfigV01,
  binding: ExactDecisionBindingV01,
  options: { require_absent: boolean; required_session_id?: string },
): { decision: ReviewDecisionV01 } {
  const detail = readVNextOperatorPilotSemanticReviewV01(db, {
    config,
    proposal_id: binding.proposal_id,
  });
  if (detail.proposal_fingerprint !== binding.proposal_fingerprint) {
    throw transitionError("operator_pilot_proposal_fingerprint_mismatch", 409);
  }
  const decision = detail.decisions.find(
    (item) =>
      item.decision_id === binding.decision_id &&
      item.integrity.fingerprint === binding.decision_fingerprint,
  );
  if (!decision) throw transitionError("operator_pilot_decision_missing", 404);
  const provenance = validateVNextOperatorPilotReviewDecisionProvenanceV01(
    db,
    { config, proposal: detail.proposal, decision },
  );
  if (provenance.status !== "valid") {
    throw transitionError(
      `operator_pilot_decision_session_provenance_invalid:${provenance.errors.join(",")}`,
      409,
    );
  }
  if (
    options.required_session_id &&
    provenance.session_id !== options.required_session_id
  ) {
    throw transitionError("operator_pilot_decision_session_mismatch", 409);
  }
  if (
    decision.decision !== "accept" ||
    !decision.requested_transition_intent ||
    decision.requested_transition_intent.transition_kind !==
      "semantic_candidate_apply" ||
    decision.requested_transition_intent.target_refs.length !== 1
  ) {
    throw transitionError("operator_pilot_accept_create_only", 409);
  }
  const candidate = detail.candidates.find(
    (item) =>
      item.candidate.candidate_id === decision.candidate.candidate_id &&
      item.candidate_fingerprint === decision.candidate.candidate_fingerprint,
  );
  if (!candidate || candidate.candidate.target_refs.length !== 1) {
    throw transitionError("operator_pilot_single_target_required", 409);
  }
  if (
    options.require_absent &&
    (!candidate.pilot_admission.decision_allowed.accept ||
      candidate.pilot_admission.accept_operation !== "create" ||
      candidate.pilot_admission.current_state_status !== "absent")
  ) {
    throw transitionError("operator_pilot_absent_create_required", 409);
  }
  if (
    canonicalizeProtocolValueV01(candidate.candidate.target_refs) !==
    canonicalizeProtocolValueV01(
      decision.requested_transition_intent.target_refs,
    )
  ) {
    throw transitionError("operator_pilot_decision_target_mismatch", 409);
  }
  return { decision };
}

function assertPilotPreview(
  preview: VNextSemanticCommitPreviewV01,
  decision: ReviewDecisionV01,
): void {
  if (
    decision.decision !== "accept" ||
    preview.intended_effects.length !== 1 ||
    preview.current_state_observations.length !== 1 ||
    preview.intended_effects[0]?.operation !== "create" ||
    preview.intended_effects[0]?.before_presence !== "absent" ||
    preview.current_state_observations[0]?.presence !== "absent" ||
    preview.gate_ttl_ms !== VNEXT_OPERATOR_PILOT_GATE_TTL_MS_V01
  ) {
    throw transitionError("operator_pilot_preview_policy_mismatch", 409);
  }
}

function assertPilotGateAndDecision(
  db: Database.Database,
  config: VNextLocalOperatorPilotConfigV01,
  request: ReturnType<typeof parseCommitRequest>,
  requiredSessionId: string,
): void {
  requirePilotAcceptCreateMaterial(db, config, request, {
    require_absent: false,
    required_session_id: requiredSessionId,
  });
  const record = readVNextCoreRecordV01(db, {
    record_kind: "semantic_commit_gate",
    record_id: request.gate_record_id,
    workspace_id: config.workspace_id,
    project_id: config.project_id,
  });
  if (!record) throw transitionError("operator_pilot_gate_missing", 404);
  if (record.fingerprint !== request.gate_record_fingerprint) {
    throw transitionError("operator_pilot_gate_fingerprint_mismatch", 409);
  }
  const gate = record.payload as Partial<VNextSemanticCommitGateRecordV01>;
  if (!gate || typeof gate !== "object" || Array.isArray(gate)) {
    throw transitionError("operator_pilot_gate_invalid", 422);
  }
  if (
    !gate.integrity ||
    gate.integrity.fingerprint !== record.fingerprint ||
    gate.workspace_id !== config.workspace_id ||
    gate.project_id !== config.project_id ||
    record.record_id !== gate.gate_record_id ||
    record.created_at !== gate.confirmed_at ||
    record.idempotency_key !== gate.confirmation_digest
  ) {
    throw transitionError("operator_pilot_gate_envelope_mismatch", 422);
  }
  assertVNextCoreRecordMatchesProtocolPayloadBindingV01(record, {
    workspace_id: config.workspace_id,
    project_id: config.project_id,
    fingerprint: gate.integrity.fingerprint,
  });
  if (
    gate.proposal_id !== request.proposal_id ||
    gate.proposal_fingerprint !== request.proposal_fingerprint ||
    gate.decision_id !== request.decision_id ||
    gate.decision_fingerprint !== request.decision_fingerprint ||
    !Array.isArray(gate.intended_effects) ||
    gate.intended_effects.length !== 1 ||
    gate.intended_effects[0]?.operation !== "create" ||
    gate.intended_effects[0]?.before_presence !== "absent" ||
    gate.current_state_observations?.length !== 1 ||
    gate.current_state_observations[0]?.presence !== "absent" ||
    gate.semantic_commit_gate_evaluation?.authorized_applier_ref.ref_type !==
      authorizedApplierIdentity(config).ref_type ||
    gate.semantic_commit_gate_evaluation?.authorized_applier_ref.external_id !==
      authorizedApplierIdentity(config).external_id
  ) {
    throw transitionError("operator_pilot_gate_policy_mismatch", 409);
  }
}

function requirePilotAppliedCreate(
  db: Database.Database,
  config: VNextLocalOperatorPilotConfigV01,
  request: ReturnType<typeof parseCompileRequest>,
): ReturnType<typeof loadValidatedVNextSemanticTransitionRelationV01> {
  const transition = loadValidatedVNextSemanticTransitionRelationV01(db, {
    workspace_id: config.workspace_id,
    project_id: config.project_id,
    transition_receipt_id: request.transition_receipt_id,
    transition_receipt_fingerprint: request.transition_receipt_fingerprint,
  });
  const provenance = validateVNextOperatorPilotReviewDecisionProvenanceV01(
    db,
    {
      config,
      proposal: transition.proposal,
      decision: transition.decision,
    },
  );
  if (
    provenance.status !== "valid" ||
    transition.decision.decision !== "accept" ||
    transition.receipt.effects.length !== 1 ||
    transition.receipt.effects[0]?.operation !== "create" ||
    transition.receipt.effects[0]?.before_state.presence !== "absent" ||
    transition.receipt.effects[0]?.after_state.presence !== "present"
  ) {
    throw transitionError("operator_pilot_receipt_policy_mismatch", 409);
  }
  return transition;
}

function assertPriorPacketBindsSourceProposal(
  sourceRef: ReturnType<
    typeof loadValidatedVNextSemanticTransitionRelationV01
  >["proposal"]["task_context_packet_ref"],
  packet: TaskContextPacketV01,
): void {
  if (
    !sourceRef ||
    sourceRef.ref_type !== "task_context_packet" ||
    sourceRef.external_id !== packet.packet_id ||
    sourceRef.source_ref !== packet.integrity.fingerprint
  ) {
    throw transitionError("operator_pilot_prior_packet_proposal_binding_mismatch", 409);
  }
}

function findExistingCompiledPacket(
  db: Database.Database,
  transition: ReturnType<typeof loadValidatedVNextSemanticTransitionRelationV01>,
  priorPacket: TaskContextPacketV01,
): TaskContextPacketV01 | null {
  const rows = db.prepare(
    `SELECT record_id FROM vnext_core_records
     WHERE record_kind = 'task_context_packet'
       AND workspace_id = ? AND project_id = ?
       AND record_id <> ?
     ORDER BY created_at, record_id
     LIMIT 130`,
  ).all(
    transition.receipt.workspace_id,
    transition.receipt.project_id,
    priorPacket.packet_id,
  ) as Array<{ record_id: string }>;
  if (rows.length > 128) {
    throw transitionError("operator_pilot_packet_history_bound_exceeded", 422);
  }
  const matches: TaskContextPacketV01[] = [];
  const expectedPriorRef = {
    ref_version: "external_ref.v0.1" as const,
    ref_type: "task_context_packet",
    external_id: priorPacket.packet_id,
    trust_class: "derived_interpretation" as const,
    observed_at: priorPacket.generated_at,
    source_ref: priorPacket.integrity.fingerprint,
    compatibility_namespace:
      VNEXT_PERSISTED_SEMANTIC_CONTEXT_COMPILER_VERSION_V01,
  };
  const expectedReceiptRef = createStateTransitionReceiptLineageRefV01(
    transition.receipt,
  );
  for (const row of rows) {
    const record = readVNextCoreRecordV01(db, {
      record_kind: "task_context_packet",
      record_id: row.record_id,
      workspace_id: transition.receipt.workspace_id,
      project_id: transition.receipt.project_id,
    });
    if (!record) continue;
    const packet = record.payload as TaskContextPacketV01;
    if (
      validateTaskContextPacketV01(packet, {
        evaluated_at: packet?.generated_at ?? "",
      }).status !== "valid"
    ) {
      throw transitionError("operator_pilot_compiled_packet_invalid", 422);
    }
    const hasPrior = packet.compatibility.source_refs.some(
      (ref) =>
        canonicalizeProtocolValueV01(ref) ===
        canonicalizeProtocolValueV01(expectedPriorRef),
    );
    const hasReceipt = packet.compatibility.source_refs.some(
      (ref) =>
        canonicalizeProtocolValueV01(ref) ===
        canonicalizeProtocolValueV01(expectedReceiptRef),
    );
    if (!hasPrior || !hasReceipt) continue;
    const relation = validateSemanticTransitionFullChainV01({
      ...transition.eligibility_input,
      receipt: transition.receipt,
      prior_packet: priorPacket,
      later_packet: packet,
    });
    if (relation.status !== "valid") {
      throw transitionError("operator_pilot_compiled_packet_relation_invalid", 422);
    }
    assertVNextCoreRecordMatchesProtocolPayloadBindingV01(record, {
      workspace_id: packet.workspace_id,
      project_id: packet.project_id,
      fingerprint: packet.integrity.fingerprint,
    });
    if (record.record_id !== packet.packet_id || record.created_at !== packet.generated_at) {
      throw transitionError("operator_pilot_compiled_packet_envelope_mismatch", 422);
    }
    matches.push(packet);
  }
  if (matches.length > 1) {
    throw transitionError("operator_pilot_compiled_packet_replay_conflict", 409);
  }
  return matches[0] ?? null;
}

function readPersistedPriorPacket(
  db: Database.Database,
  config: VNextLocalOperatorPilotConfigV01,
  request: ReturnType<typeof parseCompileRequest>,
): TaskContextPacketV01 {
  const record = readVNextCoreRecordV01(db, {
    record_kind: "task_context_packet",
    record_id: request.prior_packet_id,
    workspace_id: config.workspace_id,
    project_id: config.project_id,
  });
  if (!record) throw transitionError("operator_pilot_prior_packet_missing", 404);
  if (record.fingerprint !== request.prior_packet_fingerprint) {
    throw transitionError("operator_pilot_prior_packet_fingerprint_mismatch", 409);
  }
  const packet = record.payload as TaskContextPacketV01;
  const validation = validateTaskContextPacketV01(packet, {
    evaluated_at: packet.generated_at,
  });
  if (validation.status !== "valid") {
    throw transitionError("operator_pilot_prior_packet_invalid", 422);
  }
  assertVNextCoreRecordMatchesProtocolPayloadBindingV01(record, {
    workspace_id: packet.workspace_id,
    project_id: packet.project_id,
    fingerprint: packet.integrity.fingerprint,
  });
  if (
    packet.packet_id !== request.prior_packet_id ||
    packet.workspace_id !== config.workspace_id ||
    packet.project_id !== config.project_id ||
    record.created_at !== packet.generated_at
  ) {
    throw transitionError("operator_pilot_prior_packet_envelope_mismatch", 422);
  }
  return packet;
}

function authorizedApplierIdentity(config: VNextLocalOperatorPilotConfigV01) {
  return {
    ref_type: "local_operator_pilot_semantic_applier",
    external_id: config.operator_id,
  };
}

function parseExactDecisionBinding(value: unknown): ExactDecisionBindingV01 {
  const parsed = parseAllowedObject(value, [
    "proposal_id",
    "proposal_fingerprint",
    "decision_id",
    "decision_fingerprint",
  ]);
  return {
    proposal_id: parsed.proposal_id!,
    proposal_fingerprint: parsed.proposal_fingerprint!,
    decision_id: parsed.decision_id!,
    decision_fingerprint: parsed.decision_fingerprint!,
  };
}

function parseConfirmRequest(value: unknown): ConfirmRequestV01 {
  const parsed = parseAllowedObject(value, [
    "proposal_id",
    "proposal_fingerprint",
    "decision_id",
    "decision_fingerprint",
    "confirmation_digest",
  ]);
  return {
    proposal_id: parsed.proposal_id!,
    proposal_fingerprint: parsed.proposal_fingerprint!,
    decision_id: parsed.decision_id!,
    decision_fingerprint: parsed.decision_fingerprint!,
    confirmation_digest: parsed.confirmation_digest!,
  };
}

function parseCommitRequest(value: unknown): CommitRequestV01 {
  const parsed = parseAllowedObject(value, [
    "proposal_id",
    "proposal_fingerprint",
    "decision_id",
    "decision_fingerprint",
    "gate_record_id",
    "gate_record_fingerprint",
  ]);
  return {
    proposal_id: parsed.proposal_id!,
    proposal_fingerprint: parsed.proposal_fingerprint!,
    decision_id: parsed.decision_id!,
    decision_fingerprint: parsed.decision_fingerprint!,
    gate_record_id: parsed.gate_record_id!,
    gate_record_fingerprint: parsed.gate_record_fingerprint!,
  };
}

function parseCompileRequest(value: unknown): CompileRequestV01 {
  const parsed = parseAllowedObject(value, [
    "transition_receipt_id",
    "transition_receipt_fingerprint",
    "prior_packet_id",
    "prior_packet_fingerprint",
  ]);
  return {
    transition_receipt_id: parsed.transition_receipt_id!,
    transition_receipt_fingerprint: parsed.transition_receipt_fingerprint!,
    prior_packet_id: parsed.prior_packet_id!,
    prior_packet_fingerprint: parsed.prior_packet_fingerprint!,
  };
}

function parseAllowedObject(
  value: unknown,
  keys: readonly string[],
): Record<string, string> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw transitionError("operator_pilot_transition_body_invalid", 400);
  }
  const record = value as Record<string, unknown>;
  if (
    Object.keys(record).length !== keys.length ||
    Object.keys(record).some((key) => !keys.includes(key))
  ) {
    throw transitionError("operator_pilot_transition_body_unknown_field", 400);
  }
  return Object.fromEntries(
    keys.map((key) => {
      const text = normalizeProtocolTextV01(record[key]);
      if (
        !text ||
        text !== record[key] ||
        text.length > MAX_ID_CHARACTERS ||
        ((key.endsWith("fingerprint") || key.endsWith("digest")) &&
          !/^sha256:[a-f0-9]{64}$/.test(text))
      ) {
        throw transitionError(`operator_pilot_${key}_invalid`, 400);
      }
      return [key, text];
    }),
  );
}

function parsePreviewBindingPayload(value: unknown): PreviewBindingPayloadV01 {
  const keys = [
    "binding_version",
    "session_id",
    "workspace_id",
    "project_id",
    "proposal_id",
    "proposal_fingerprint",
    "decision_id",
    "decision_fingerprint",
    "current_state_observed_at",
    "previewed_at",
    "confirmation_digest",
  ] as const;
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw transitionError("operator_pilot_preview_binding_invalid", 409);
  }
  const record = value as Record<string, unknown>;
  if (
    Object.keys(record).length !== keys.length ||
    Object.keys(record).some((key) => !keys.includes(key as (typeof keys)[number]))
  ) {
    throw transitionError("operator_pilot_preview_binding_invalid", 409);
  }
  const payload = record as unknown as PreviewBindingPayloadV01;
  if (
    payload.binding_version !== VNEXT_OPERATOR_PILOT_TRANSITION_RUNTIME_VERSION_V01 ||
    [payload.current_state_observed_at, payload.previewed_at].some(
      (value) => parseStrictIsoTimestampV01(value) === null,
    ) ||
    !/^sha256:[a-f0-9]{64}$/.test(payload.confirmation_digest)
  ) {
    throw transitionError("operator_pilot_preview_binding_invalid", 409);
  }
  return payload;
}

function previewBindingSignature(value: string, secret: string): string {
  return createHmac("sha256", secret).update(value).digest("base64url");
}

function constantTimeTextEqual(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return (
    leftBuffer.length === rightBuffer.length &&
    timingSafeEqual(leftBuffer, rightBuffer)
  );
}

function transitionError(code: string, status = 400) {
  return new VNextOperatorPilotTransitionErrorV01(code, status);
}
