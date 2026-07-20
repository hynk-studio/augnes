import { createHmac, timingSafeEqual } from "node:crypto";

import type Database from "better-sqlite3";

import {
  assertVNextCoreRecordMatchesProtocolPayloadBindingV01,
  assertVNextDurableSemanticStoreSchemaV01,
  readVNextCoreRecordV01,
} from "@/lib/vnext/persistence/durable-semantic-store";
import {
  canonicalizeProtocolValueV01,
  createProtocolSha256V01,
  normalizeProtocolTextV01,
  parseStrictIsoTimestampV01,
} from "@/lib/vnext/protocol-primitives";
import { validateTaskContextPacketV01 } from "@/lib/vnext/task-context-packet";
import {
  createStateTransitionReceiptLineageRefV01,
  validateSemanticTransitionFullChainV01,
} from "@/lib/vnext/state-transition-eligibility";
import {
  assertVNextSemanticCommitGateMatchesOperatorPilotCapabilityV01,
  commitVNextSemanticTransitionWithOperatorPilotCapabilityInsideTransactionV01,
  loadValidatedVNextSemanticTransitionRelationV01,
  prepareVNextSemanticCommitPreviewWithOperatorPilotCapabilityV01,
  recordVNextSemanticCommitAuthorizationWithOperatorPilotCapabilityInsideTransactionV01,
  type VNextSemanticCommitGateRecordV01,
  type VNextSemanticCommitPreviewV01,
  type VNextSemanticTransitionTestOptionsV01,
  type VNextSemanticTransitionCommitResultV01,
} from "@/lib/vnext/runtime/durable-semantic-transition";
import {
  VNEXT_OPERATOR_PILOT_DEFAULT_REVIEW_WINDOW_CONFIG_V01,
  VNEXT_OPERATOR_PILOT_GATE_TTL_DEFAULT_MS_V01,
  VNEXT_OPERATOR_PILOT_GATE_TTL_MAX_MS_V01,
  VNEXT_OPERATOR_PILOT_GATE_TTL_MIN_MS_V01,
  VNEXT_OPERATOR_PILOT_PREVIEW_MAX_AGE_MAX_MS_V01,
  VNEXT_OPERATOR_PILOT_PREVIEW_MAX_AGE_MIN_MS_V01,
  VNEXT_OPERATOR_PILOT_REVIEW_WINDOW_CONFIG_VERSION_V01,
  assertVNextOperatorPilotReviewWindowConfigV01,
  createVNextOperatorPilotReviewWindowCapabilityV01,
  type VNextOperatorPilotReviewWindowCapabilityV01,
  type VNextOperatorPilotReviewWindowConfigV01,
} from "@/lib/vnext/runtime/operator-pilot-review-window-config-v0-1";
import {
  VNEXT_PERSISTED_SEMANTIC_CONTEXT_COMPILER_VERSION_V01,
  compileTaskContextPacketFromPersistedSemanticStateInsideTransactionV01,
  type CompileTaskContextPacketFromPersistedSemanticStateResultV01,
} from "@/lib/vnext/runtime/persisted-semantic-context-compiler";
import {
  admitVNextLocalOperatorMutationInsideTransactionV01,
  authenticateVNextLocalOperatorSessionV01,
  readVNextLocalOperatorSessionHistoryV01,
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
  resolveVNextOperatorPilotApplyingDecisionV01,
  validateVNextOperatorPilotReviewDecisionProvenanceV01,
  type VNextOperatorPilotReviewDetailV01,
} from "@/lib/vnext/runtime/operator-pilot-review-material";
import type { ReviewDecisionV01 } from "@/types/vnext/review-decision";
import type { TaskContextPacketV01 } from "@/types/vnext/task-context-packet";
import {
  EXTERNAL_REF_VERSION_V01,
  type ExternalRefV01,
} from "@/types/vnext/external-ref";

export const VNEXT_OPERATOR_PILOT_TRANSITION_RUNTIME_VERSION_V01 =
  "vnext_operator_pilot_semantic_transition.v0.1" as const;
export const VNEXT_OPERATOR_PILOT_GATE_TTL_MS_V01 =
  VNEXT_OPERATOR_PILOT_GATE_TTL_DEFAULT_MS_V01;
export const VNEXT_OPERATOR_PILOT_LATER_PACKET_TTL_MS_V01 =
  8 * 60 * 60 * 1000;
export const VNEXT_OPERATOR_PILOT_PREVIEW_COOKIE_V01 =
  "augnes_vnext_operator_preview_v01" as const;
export const VNEXT_OPERATOR_PILOT_PREVIEW_COOKIE_PATH_V01 =
  "/api/vnext/operator" as const;

const MAX_ID_CHARACTERS = 256;
const MAX_COOKIE_CHARACTERS = 4096;
const VNEXT_LOCAL_OPERATOR_SESSION_NAMESPACE_V01 =
  "augnes.vnext.local-operator-session.v0.1";

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

interface ApplyRequestV01 extends CommitRequestV01 {
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
  review_window_config: VNextOperatorPilotReviewWindowConfigV01;
}

export interface VNextOperatorPilotPreviewResultV01 {
  preview: VNextSemanticCommitPreviewV01;
  preview_binding_cookie: string;
  pilot_policy: {
    operation_aware: true;
    candidate_operation: "create" | "replace" | "supersede" | "retract";
    current_state_required: "absent" | "present";
    atomic_transition_and_packet_supported: true;
    authorized_applier_derived_by_server: true;
    review_window_config_version: typeof VNEXT_OPERATOR_PILOT_REVIEW_WINDOW_CONFIG_VERSION_V01;
    preview_max_age_ms: number;
    preview_source: VNextOperatorPilotReviewWindowConfigV01["preview_source"];
    gate_ttl_ms: number;
    gate_source: VNextOperatorPilotReviewWindowConfigV01["gate_source"];
    preview_binding_expires_at: string;
  };
  preview_is_write: false;
}

export interface VNextOperatorPilotAuthorizationResultV01 {
  status: "inserted" | "exact_replay";
  gate_record: VNextSemanticCommitGateRecordV01;
  eligibility_status: "eligible";
  eligibility: ReturnType<
    typeof recordVNextSemanticCommitAuthorizationWithOperatorPilotCapabilityInsideTransactionV01
  >["eligibility"];
  state_applied: false;
  session_admission: VNextLocalOperatorSessionMutationAdmissionV01;
}

export interface VNextOperatorPilotApplyResultV01 {
  status: "applied" | "exact_replay";
  packet_status: CompileTaskContextPacketFromPersistedSemanticStateResultV01["status"];
  gate_record: VNextSemanticCommitGateRecordV01;
  transition_receipt: VNextSemanticTransitionCommitResultV01["transition_receipt"];
  later_packet: TaskContextPacketV01;
  eligibility_status: "eligible";
  eligibility: VNextSemanticTransitionCommitResultV01["eligibility"];
  packet_compiled: true;
  session_admission: VNextLocalOperatorSessionMutationAdmissionV01;
}

export interface VNextOperatorPilotGateProvenanceValidationV01 {
  status: "valid" | "invalid";
  session_id: string | null;
  errors: string[];
}

export function assertVNextOperatorPilotGateReviewWindowConfigV01(
  gate: VNextSemanticCommitGateRecordV01,
  config: VNextOperatorPilotReviewWindowConfigV01,
): void {
  try {
    const exactConfig = reviewWindowConfigOrDefault(config);
    const capability = createVNextOperatorPilotReviewWindowCapabilityV01({
      config: exactConfig,
      workspace_id: gate.workspace_id,
      project_id: gate.project_id,
    });
    assertVNextSemanticCommitGateMatchesOperatorPilotCapabilityV01(
      gate,
      capability,
    );
  } catch {
    throw transitionError("operator_pilot_review_window_config_mismatch", 409);
  }
}

export function prepareVNextOperatorPilotSemanticCommitPreviewV01(
  db: Database.Database,
  input: {
    config: VNextLocalOperatorPilotConfigV01;
    credential: VNextLocalOperatorSessionCredentialV01;
    request: unknown;
    review_window_config?: VNextOperatorPilotReviewWindowConfigV01;
    clock?: VNextLocalRuntimeClockV01;
  },
): VNextOperatorPilotPreviewResultV01 {
  assertVNextDurableSemanticStoreSchemaV01(db);
  const request = parseExactDecisionBinding(input.request);
  const reviewWindowConfig = reviewWindowConfigOrDefault(
    input.review_window_config,
  );
  const reviewWindowCapability = reviewWindowCapabilityFor(
    input.config,
    reviewWindowConfig,
  );
  const authentication = authenticateVNextLocalOperatorSessionV01(db, input);
  const material = requirePilotAcceptedOperationMaterial(db, input.config, request, {
    require_current_admission: true,
    required_session_id: authentication.session.session_id,
  });
  const preview =
    prepareVNextSemanticCommitPreviewWithOperatorPilotCapabilityV01(db, {
    workspace_id: input.config.workspace_id,
    project_id: input.config.project_id,
    ...request,
    authorized_applier_identity: authorizedApplierIdentity(input.config),
    review_window_capability: reviewWindowCapability,
    clock: input.clock,
  });
  assertPilotPreview(preview, material, reviewWindowConfig);
  const binding = createPreviewBinding(
    input.config,
    authentication.credential,
    preview,
    reviewWindowConfig,
  );
  const previewBindingExpiresAt = addReviewWindowMilliseconds(
    preview.previewed_at,
    reviewWindowConfig.preview_max_age_ms,
  );
  return {
    preview,
    preview_binding_cookie: binding,
    pilot_policy: {
      operation_aware: true,
      candidate_operation: material.admission.mapped_operation!,
      current_state_required:
        material.admission.mapped_operation === "create"
          ? "absent"
          : "present",
      atomic_transition_and_packet_supported: true,
      authorized_applier_derived_by_server: true,
      review_window_config_version: reviewWindowConfig.config_version,
      preview_max_age_ms: reviewWindowConfig.preview_max_age_ms,
      preview_source: reviewWindowConfig.preview_source,
      gate_ttl_ms: reviewWindowConfig.gate_ttl_ms,
      gate_source: reviewWindowConfig.gate_source,
      preview_binding_expires_at: previewBindingExpiresAt,
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
    review_window_config?: VNextOperatorPilotReviewWindowConfigV01;
    clock?: VNextLocalRuntimeClockV01;
    secret_source?: VNextLocalOperatorSecretSourceV01;
    test_options?: VNextSemanticTransitionTestOptionsV01;
  },
): VNextOperatorPilotAuthorizationResultV01 {
  assertVNextDurableSemanticStoreSchemaV01(db);
  const request = parseConfirmRequest(input.request);
  const reviewWindowConfig = reviewWindowConfigOrDefault(
    input.review_window_config,
  );
  const reviewWindowCapability = reviewWindowCapabilityFor(
    input.config,
    reviewWindowConfig,
  );
  authenticateVNextLocalOperatorSessionV01(db, input);
  const binding = readPreviewBinding(
    input.preview_binding_cookie,
    input.config,
    input.credential,
    request,
    reviewWindowConfig,
  );
  const prevalidated = rebuildBoundPreview(
    db,
    input.config,
    binding,
    reviewWindowCapability,
  );
  requirePilotAcceptedOperationMaterial(db, input.config, request, {
    require_current_admission: true,
    required_session_id: input.credential.session_id,
  });
  assertPilotPreview(prevalidated.preview, prevalidated.material, reviewWindowConfig);
  if (db.inTransaction) throw transitionError("operator_pilot_nested_transaction", 409);
  db.exec("BEGIN IMMEDIATE");
  try {
    const admission = admitVNextLocalOperatorMutationInsideTransactionV01(db, input);
    const material = requirePilotAcceptedOperationMaterial(db, input.config, request, {
      require_current_admission: true,
      required_session_id: admission.session.session_id,
    });
    const exact = rebuildBoundPreview(
      db,
      input.config,
      binding,
      reviewWindowCapability,
    );
    assertPilotPreview(exact.preview, material, reviewWindowConfig);
    const confirmationBasisRef =
      createVNextOperatorPilotSemanticConfirmationBasisRefV01({
        config: input.config,
        session_id: admission.session.session_id,
        proposal_id: exact.preview.proposal_id,
        proposal_fingerprint: exact.preview.proposal_fingerprint,
        decision_id: exact.preview.decision_id,
        decision_fingerprint: exact.preview.decision_fingerprint,
        confirmation_digest: exact.preview.confirmation_digest,
        authorized_applier_identity:
          exact.preview.authorized_applier_identity,
        gate_ttl_ms: exact.preview.gate_ttl_ms,
        confirmed_at: admission.action_observed_at,
      });
    const result =
      recordVNextSemanticCommitAuthorizationWithOperatorPilotCapabilityInsideTransactionV01(
        db,
        {
        preview: exact.preview,
        confirmation_digest: request.confirmation_digest,
        operator_actor_ref: material.decision.actor_ref,
        operator_confirmation_basis_refs: [confirmationBasisRef],
        review_window_capability: reviewWindowCapability,
        clock: pinFirstClockValue(
          admission.action_observed_at,
          input.clock,
        ),
        },
      );
    if (result.eligibility.status !== "eligible") {
      throw transitionError("operator_pilot_gate_not_eligible", 409);
    }
    const gateProvenance =
      validateVNextOperatorPilotSemanticGateConfirmationProvenanceV01(db, {
        config: input.config,
        proposal: material.proposal,
        decision: material.decision,
        gate: result.gate_record,
        required_session_id: admission.session.session_id,
        review_window_config: reviewWindowConfig,
      });
    if (gateProvenance.status !== "valid") {
      throw transitionError(
        `operator_pilot_gate_confirmation_provenance_invalid:${gateProvenance.errors.join(",")}`,
        409,
      );
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

/**
 * Applies the independently revalidated semantic transition and compiles its
 * exact later packet in one immediate transaction. The ReviewDecision and gate
 * remain separately persisted authorities created before this call.
 */
export function applyVNextOperatorPilotReviewedSemanticTransitionV01(
  db: Database.Database,
  input: {
    config: VNextLocalOperatorPilotConfigV01;
    credential: VNextLocalOperatorSessionCredentialV01;
    request: unknown;
    review_window_config?: VNextOperatorPilotReviewWindowConfigV01;
    clock?: VNextLocalRuntimeClockV01;
    secret_source?: VNextLocalOperatorSecretSourceV01;
    test_options?: VNextSemanticTransitionTestOptionsV01;
  },
): VNextOperatorPilotApplyResultV01 {
  assertVNextDurableSemanticStoreSchemaV01(db);
  const request = parseApplyRequest(input.request);
  const reviewWindowConfig = reviewWindowConfigOrDefault(
    input.review_window_config,
  );
  const reviewWindowCapability = reviewWindowCapabilityFor(
    input.config,
    reviewWindowConfig,
  );
  authenticateVNextLocalOperatorSessionV01(db, input);
  const material = requirePilotAcceptedOperationMaterial(
    db,
    input.config,
    request,
    {
      require_current_admission: false,
      required_session_id: input.credential.session_id,
    },
  );
  assertPilotGateAndDecision(
    db,
    input.config,
    request,
    input.credential.session_id,
    reviewWindowConfig,
  );
  const priorPacket = readPersistedPriorPacket(db, input.config, request);
  assertPriorPacketBindsSourceProposal(
    material.proposal.task_context_packet_ref,
    priorPacket,
  );
  if (db.inTransaction) {
    throw transitionError("operator_pilot_nested_transaction", 409);
  }
  db.exec("BEGIN IMMEDIATE");
  try {
    const admission = admitVNextLocalOperatorMutationInsideTransactionV01(
      db,
      input,
    );
    const exactMaterial = requirePilotAcceptedOperationMaterial(
      db,
      input.config,
      request,
      {
        require_current_admission: false,
        required_session_id: admission.session.session_id,
      },
    );
    const gate = assertPilotGateAndDecision(
      db,
      input.config,
      request,
      admission.session.session_id,
      reviewWindowConfig,
    );
    const exactPriorPacket = readPersistedPriorPacket(
      db,
      input.config,
      request,
    );
    assertPriorPacketBindsSourceProposal(
      exactMaterial.proposal.task_context_packet_ref,
      exactPriorPacket,
    );
    const transition =
      commitVNextSemanticTransitionWithOperatorPilotCapabilityInsideTransactionV01(
        db,
        {
          workspace_id: input.config.workspace_id,
          project_id: input.config.project_id,
          proposal_id: request.proposal_id,
          proposal_fingerprint: request.proposal_fingerprint,
          decision_id: request.decision_id,
          decision_fingerprint: request.decision_fingerprint,
          gate_record_id: request.gate_record_id,
          gate_record_fingerprint: request.gate_record_fingerprint,
          review_window_capability: reviewWindowCapability,
          clock: input.clock,
          test_options: input.test_options,
        },
      );
    if (transition.eligibility.status !== "eligible") {
      throw transitionError("operator_pilot_transition_not_eligible", 409);
    }
    const exactTransition = requirePilotAppliedOperation(db, input.config, {
      transition_receipt_id:
        transition.transition_receipt.transition_receipt_id,
      transition_receipt_fingerprint:
        transition.transition_receipt.integrity.fingerprint,
      prior_packet_id: request.prior_packet_id,
      prior_packet_fingerprint: request.prior_packet_fingerprint,
    });
    const packet = compileLaterPacketInsideTransactionV01(db, {
      config: input.config,
      transition: exactTransition,
      prior_packet: exactPriorPacket,
      transition_receipt_id:
        transition.transition_receipt.transition_receipt_id,
      transition_receipt_fingerprint:
        transition.transition_receipt.integrity.fingerprint,
      clock: input.clock,
    });
    db.exec("COMMIT");
    return {
      status: transition.status,
      packet_status: packet.status,
      gate_record: gate,
      transition_receipt: transition.transition_receipt,
      later_packet: packet.later_packet,
      eligibility_status: "eligible",
      eligibility: transition.eligibility,
      packet_compiled: true,
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
  max_age_ms?: number;
  secure: boolean;
}): string {
  if (!input.value || input.value.length > MAX_COOKIE_CHARACTERS) {
    throw transitionError("operator_pilot_preview_binding_invalid", 500);
  }
  const expires = parseStrictIsoTimestampV01(input.expires_at);
  const maxAgeMs =
    input.max_age_ms ??
    VNEXT_OPERATOR_PILOT_DEFAULT_REVIEW_WINDOW_CONFIG_V01.preview_max_age_ms;
  if (
    expires === null ||
    !Number.isSafeInteger(maxAgeMs) ||
    maxAgeMs < VNEXT_OPERATOR_PILOT_PREVIEW_MAX_AGE_MIN_MS_V01 ||
    maxAgeMs > VNEXT_OPERATOR_PILOT_PREVIEW_MAX_AGE_MAX_MS_V01
  ) {
    throw transitionError("operator_pilot_preview_binding_invalid", 500);
  }
  return [
    `${VNEXT_OPERATOR_PILOT_PREVIEW_COOKIE_V01}=${input.value}`,
    `Path=${VNEXT_OPERATOR_PILOT_PREVIEW_COOKIE_PATH_V01}`,
    "HttpOnly",
    "SameSite=Strict",
    `Expires=${new Date(expires).toUTCString()}`,
    `Max-Age=${Math.floor(maxAgeMs / 1000)}`,
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
  reviewWindowConfig: VNextOperatorPilotReviewWindowConfigV01,
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
    review_window_config: reviewWindowConfig,
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
  reviewWindowConfig: VNextOperatorPilotReviewWindowConfigV01,
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
    payload.confirmation_digest !== request.confirmation_digest ||
    canonicalizeProtocolValueV01(payload.review_window_config) !==
      canonicalizeProtocolValueV01(reviewWindowConfig)
  ) {
    throw transitionError("operator_pilot_preview_binding_mismatch", 409);
  }
  return payload;
}

function rebuildBoundPreview(
  db: Database.Database,
  config: VNextLocalOperatorPilotConfigV01,
  binding: PreviewBindingPayloadV01,
  reviewWindowCapability: VNextOperatorPilotReviewWindowCapabilityV01,
): {
  preview: VNextSemanticCommitPreviewV01;
  material: ReturnType<typeof requirePilotAcceptedOperationMaterial>;
} {
  const material = requirePilotAcceptedOperationMaterial(db, config, binding, {
    require_current_admission: true,
    required_session_id: binding.session_id,
  });
  const values = [binding.current_state_observed_at, binding.previewed_at];
  let index = 0;
  const clock: VNextLocalRuntimeClockV01 = {
    now: () => values[Math.min(index++, values.length - 1)]!,
  };
  const preview =
    prepareVNextSemanticCommitPreviewWithOperatorPilotCapabilityV01(db, {
    workspace_id: config.workspace_id,
    project_id: config.project_id,
    proposal_id: binding.proposal_id,
    proposal_fingerprint: binding.proposal_fingerprint,
    decision_id: binding.decision_id,
    decision_fingerprint: binding.decision_fingerprint,
    authorized_applier_identity: authorizedApplierIdentity(config),
    review_window_capability: reviewWindowCapability,
    clock,
  });
  if (preview.confirmation_digest !== binding.confirmation_digest) {
    throw transitionError("operator_pilot_preview_stale", 409);
  }
  return { preview, material };
}

function requirePilotAcceptedOperationMaterial(
  db: Database.Database,
  config: VNextLocalOperatorPilotConfigV01,
  binding: ExactDecisionBindingV01,
  options: { require_current_admission: boolean; required_session_id?: string },
): {
  decision: ReviewDecisionV01;
  proposal: VNextOperatorPilotReviewDetailV01["proposal"];
  candidate: VNextOperatorPilotReviewDetailV01["candidates"][number];
  admission: VNextOperatorPilotReviewDetailV01["candidate_admissions"][number];
} {
  const detail = readVNextOperatorPilotSemanticReviewV01(db, {
    config,
    proposal_id: binding.proposal_id,
    authenticated_session_id: options.required_session_id ?? null,
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
    {
      config,
      proposal: detail.proposal,
      decision,
      authenticated_session_id: options.required_session_id ?? null,
    },
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
  const candidate = detail.candidates.find(
    (item) =>
      item.candidate.candidate_id === decision.candidate.candidate_id &&
      item.candidate_fingerprint === decision.candidate.candidate_fingerprint,
  );
  if (!candidate || candidate.candidate.target_refs.length === 0) {
    throw transitionError("operator_pilot_transition_target_required", 409);
  }
  const applying = resolveVNextOperatorPilotApplyingDecisionV01(
    detail.proposal,
    candidate.candidate,
  );
  if (
    decision.decision !== applying.decision ||
    !decision.requested_transition_intent ||
    decision.requested_transition_intent.transition_kind !==
      applying.transition_kind ||
    canonicalizeProtocolValueV01(
      decision.requested_transition_intent.target_refs,
    ) !== canonicalizeProtocolValueV01(applying.target_refs)
  ) {
    throw transitionError("operator_pilot_applying_operation_required", 409);
  }
  if (
    options.require_current_admission &&
    (!candidate.pilot_admission.decision_allowed.accept ||
      candidate.pilot_admission.accept_operation === null)
  ) {
    throw transitionError(
      candidate.pilot_admission.blocking_reasons[0] ??
        "operator_pilot_operation_not_admitted",
      409,
    );
  }
  if (candidate.pilot_admission.mapped_operation === null) {
    throw transitionError("operator_pilot_candidate_operation_not_transitionable", 409);
  }
  if (
    canonicalizeProtocolValueV01(candidate.candidate.target_refs) !==
    canonicalizeProtocolValueV01(
      decision.requested_transition_intent.target_refs,
    )
  ) {
    throw transitionError("operator_pilot_decision_target_mismatch", 409);
  }
  return {
    decision,
    proposal: detail.proposal,
    candidate,
    admission: candidate.pilot_admission,
  };
}

function assertPilotPreview(
  preview: VNextSemanticCommitPreviewV01,
  material: ReturnType<typeof requirePilotAcceptedOperationMaterial>,
  reviewWindowConfig: VNextOperatorPilotReviewWindowConfigV01,
): void {
  const expectedOperation = material.admission.mapped_operation;
  const applying = resolveVNextOperatorPilotApplyingDecisionV01(
    material.proposal,
    material.candidate.candidate,
  );
  if (
    material.decision.decision !== applying.decision ||
    !expectedOperation ||
    preview.intended_effects.length !== material.candidate.candidate.target_refs.length ||
    preview.current_state_observations.length !== material.candidate.candidate.target_refs.length ||
    preview.intended_effects.some(
      (effect) =>
        effect.operation !== expectedOperation ||
        effect.before_presence !==
          (expectedOperation === "create" ? "absent" : "present"),
    ) ||
    preview.current_state_observations.some(
      (observation) =>
        observation.presence !==
          (expectedOperation === "create" ? "absent" : "present"),
    ) ||
    preview.gate_ttl_ms !== reviewWindowConfig.gate_ttl_ms
  ) {
    throw transitionError("operator_pilot_preview_policy_mismatch", 409);
  }
}

export function createVNextOperatorPilotSemanticConfirmationBasisRefV01(
  input: {
    config: VNextLocalOperatorPilotConfigV01;
    session_id: string;
    proposal_id: string;
    proposal_fingerprint: string;
    decision_id: string;
    decision_fingerprint: string;
    confirmation_digest: string;
    authorized_applier_identity: {
      ref_type: string;
      external_id: string;
    };
    gate_ttl_ms: number;
    confirmed_at: string;
  },
): ExternalRefV01 {
  const sourceRef = createProtocolSha256V01(
    canonicalizeProtocolValueV01({
      action: "confirm_semantic_commit",
      workspace_id: input.config.workspace_id,
      project_id: input.config.project_id,
      operator_id: input.config.operator_id,
      session_id: input.session_id,
      proposal_id: input.proposal_id,
      proposal_fingerprint: input.proposal_fingerprint,
      decision_id: input.decision_id,
      decision_fingerprint: input.decision_fingerprint,
      confirmation_digest: input.confirmation_digest,
      authorized_applier_identity: input.authorized_applier_identity,
      gate_ttl_ms: input.gate_ttl_ms,
      confirmed_at: input.confirmed_at,
    }),
  );
  return {
    ref_version: EXTERNAL_REF_VERSION_V01,
    ref_type: "local_operator_session_action",
    external_id: input.session_id,
    trust_class: "direct_local_observation",
    observed_at: input.confirmed_at,
    source_ref: sourceRef,
    compatibility_namespace: VNEXT_LOCAL_OPERATOR_SESSION_NAMESPACE_V01,
  };
}

export function validateVNextOperatorPilotSemanticGateConfirmationProvenanceV01(
  db: Database.Database,
  input: {
    config: VNextLocalOperatorPilotConfigV01;
    proposal: VNextOperatorPilotReviewDetailV01["proposal"];
    decision: ReviewDecisionV01;
    gate: VNextSemanticCommitGateRecordV01;
    required_session_id?: string;
    review_window_config?: VNextOperatorPilotReviewWindowConfigV01;
  },
): VNextOperatorPilotGateProvenanceValidationV01 {
  const { config, proposal, decision, gate } = input;
  const errors: string[] = [];
  const add = (code: string) => {
    if (!errors.includes(code)) errors.push(code);
  };
  const decisionProvenance =
    validateVNextOperatorPilotReviewDecisionProvenanceV01(db, {
      config,
      proposal,
      decision,
      authenticated_session_id: input.required_session_id ?? null,
    });
  if (decisionProvenance.status !== "valid") {
    add("operator_pilot_gate_decision_provenance_invalid");
  }

  const bases = gate.operator_confirmation_basis_refs ?? [];
  const actionBases = bases.filter(
    (ref) => ref.ref_type === "local_operator_session_action",
  );
  const basis = actionBases.length === 1 ? actionBases[0]! : null;
  if (!basis) add("operator_pilot_gate_confirmation_basis_required");
  if (
    !basis ||
    basis.ref_type !== "local_operator_session_action" ||
    basis.trust_class !== "direct_local_observation" ||
    basis.compatibility_namespace !== VNEXT_LOCAL_OPERATOR_SESSION_NAMESPACE_V01 ||
    basis.observed_at !== gate.confirmed_at ||
    !basis.source_ref
  ) {
    add("operator_pilot_gate_confirmation_basis_invalid");
  }
  const sessionId = basis?.external_id ?? null;
  if (
    !sessionId ||
    sessionId !== decisionProvenance.session_id ||
    (input.required_session_id !== undefined &&
      sessionId !== input.required_session_id)
  ) {
    add("operator_pilot_gate_session_continuity_mismatch");
  }
  const session = sessionId
    ? readVNextLocalOperatorSessionHistoryV01(db, { session_id: sessionId })
    : null;
  if (!session) {
    add("operator_pilot_gate_confirmation_session_missing");
  } else {
    if (
      session.workspace_id !== config.workspace_id ||
      session.project_id !== config.project_id ||
      session.operator_id !== config.operator_id
    ) {
      add("operator_pilot_gate_confirmation_session_scope_mismatch");
    }
    if (!session.bootstrap_consumed_at) {
      add("operator_pilot_gate_confirmation_session_unconsumed");
    }
    const issuedAt = parseStrictIsoTimestampV01(session.issued_at);
    const expiresAt = parseStrictIsoTimestampV01(session.expires_at);
    const confirmedAt = parseStrictIsoTimestampV01(gate.confirmed_at);
    const consumedAt = session.bootstrap_consumed_at
      ? parseStrictIsoTimestampV01(session.bootstrap_consumed_at)
      : null;
    const revokedAt = session.revoked_at
      ? parseStrictIsoTimestampV01(session.revoked_at)
      : null;
    if (
      issuedAt === null ||
      expiresAt === null ||
      confirmedAt === null ||
      (session.bootstrap_consumed_at !== null && consumedAt === null) ||
      (session.revoked_at !== null && revokedAt === null)
    ) {
      add("operator_pilot_gate_confirmation_session_timestamp_invalid");
    } else {
      if (confirmedAt < issuedAt || confirmedAt > expiresAt) {
        add("operator_pilot_gate_confirmation_outside_session_lifetime");
      }
      if (consumedAt !== null && consumedAt > confirmedAt) {
        add("operator_pilot_gate_confirmation_before_bootstrap_consumption");
      }
      if (revokedAt !== null && revokedAt < confirmedAt) {
        add("operator_pilot_gate_confirmation_after_session_revocation");
      }
    }
  }

  const gateEvaluatedAt = parseStrictIsoTimestampV01(
    gate.semantic_commit_gate_evaluation?.evaluated_at,
  );
  const gateExpiresAt = parseStrictIsoTimestampV01(
    gate.semantic_commit_gate_evaluation?.expires_at,
  );
  const storedGateTtlMs =
    gateEvaluatedAt === null || gateExpiresAt === null
      ? null
      : gateExpiresAt - gateEvaluatedAt;
  if (
    gateEvaluatedAt === null ||
    gateExpiresAt === null ||
    storedGateTtlMs === null ||
    storedGateTtlMs < VNEXT_OPERATOR_PILOT_GATE_TTL_MIN_MS_V01 ||
    storedGateTtlMs > VNEXT_OPERATOR_PILOT_GATE_TTL_MAX_MS_V01 ||
    (input.review_window_config === undefined &&
      !bases.some(
        (ref) => ref.ref_type === "semantic_commit_confirmation_context",
      ) &&
      storedGateTtlMs !== VNEXT_OPERATOR_PILOT_GATE_TTL_MS_V01) ||
    (input.review_window_config !== undefined &&
      storedGateTtlMs !== input.review_window_config.gate_ttl_ms)
  ) {
    add("operator_pilot_gate_ttl_mismatch");
  }
  const expectedApplier = authorizedApplierIdentity(config);
  const actualApplier =
    gate.semantic_commit_gate_evaluation?.authorized_applier_ref;
  if (
    !actualApplier ||
    actualApplier.ref_type !== expectedApplier.ref_type ||
    actualApplier.external_id !== expectedApplier.external_id
  ) {
    add("operator_pilot_gate_authorized_applier_mismatch");
  }
  if (
    gate.workspace_id !== config.workspace_id ||
    gate.project_id !== config.project_id ||
    gate.proposal_id !== proposal.proposal_id ||
    gate.proposal_fingerprint !== proposal.integrity.fingerprint ||
    gate.decision_id !== decision.decision_id ||
    gate.decision_fingerprint !== decision.integrity.fingerprint ||
    canonicalizeProtocolValueV01(gate.operator_actor_ref) !==
      canonicalizeProtocolValueV01(decision.actor_ref)
  ) {
    add("operator_pilot_gate_decision_binding_mismatch");
  }
  if (basis && sessionId && storedGateTtlMs !== null) {
    const expectedBasis =
      createVNextOperatorPilotSemanticConfirmationBasisRefV01({
        config,
        session_id: sessionId,
        proposal_id: gate.proposal_id,
        proposal_fingerprint: gate.proposal_fingerprint,
        decision_id: gate.decision_id,
        decision_fingerprint: gate.decision_fingerprint,
        confirmation_digest: gate.confirmation_digest,
        authorized_applier_identity: expectedApplier,
        gate_ttl_ms: storedGateTtlMs,
        confirmed_at: gate.confirmed_at,
      });
    if (
      canonicalizeProtocolValueV01(basis) !==
      canonicalizeProtocolValueV01(expectedBasis)
    ) {
      add("operator_pilot_gate_confirmation_basis_mismatch");
    }
  }
  if (input.review_window_config === undefined) {
    validateHistoricalReviewWindowConfirmationBasis(
      bases,
      gate.confirmed_at,
      add,
    );
  } else {
    try {
      assertVNextSemanticCommitGateMatchesOperatorPilotCapabilityV01(
        gate,
        reviewWindowCapabilityFor(config, input.review_window_config),
      );
    } catch {
      add("operator_pilot_review_window_confirmation_basis_mismatch");
    }
  }
  const valid = errors.length === 0;
  return {
    status: valid ? "valid" : "invalid",
    session_id: valid ? sessionId : null,
    errors,
  };
}

function pinFirstClockValue(
  first: string,
  clock: VNextLocalRuntimeClockV01 | undefined,
): VNextLocalRuntimeClockV01 {
  let firstRead = true;
  return {
    now: () => {
      if (firstRead) {
        firstRead = false;
        return first;
      }
      return readVNextLocalRuntimeClockNowV01(
        clock,
        "operator_pilot_confirmation_followup_time",
      );
    },
  };
}

function reviewWindowConfigOrDefault(
  value: VNextOperatorPilotReviewWindowConfigV01 | undefined,
): VNextOperatorPilotReviewWindowConfigV01 {
  if (value === undefined) {
    return VNEXT_OPERATOR_PILOT_DEFAULT_REVIEW_WINDOW_CONFIG_V01;
  }
  try {
    return assertVNextOperatorPilotReviewWindowConfigV01(value);
  } catch {
    throw transitionError("operator_pilot_review_window_config_invalid", 503);
  }
}

function assertSerializedReviewWindowConfig(
  value: unknown,
): VNextOperatorPilotReviewWindowConfigV01 {
  const keys = [
    "config_version",
    "preview_max_age_ms",
    "gate_ttl_ms",
    "preview_source",
    "gate_source",
  ] as const;
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw transitionError("operator_pilot_preview_binding_invalid", 409);
  }
  const config = value as Record<string, unknown>;
  if (
    Object.keys(config).length !== keys.length ||
    Object.keys(config).some(
      (key) => !keys.includes(key as (typeof keys)[number]),
    ) ||
    config.config_version !==
      VNEXT_OPERATOR_PILOT_REVIEW_WINDOW_CONFIG_VERSION_V01 ||
    !Number.isSafeInteger(config.preview_max_age_ms) ||
    Number(config.preview_max_age_ms) <
      VNEXT_OPERATOR_PILOT_PREVIEW_MAX_AGE_MIN_MS_V01 ||
    Number(config.preview_max_age_ms) >
      VNEXT_OPERATOR_PILOT_PREVIEW_MAX_AGE_MAX_MS_V01 ||
    !Number.isSafeInteger(config.gate_ttl_ms) ||
    Number(config.gate_ttl_ms) < VNEXT_OPERATOR_PILOT_GATE_TTL_MIN_MS_V01 ||
    Number(config.gate_ttl_ms) > VNEXT_OPERATOR_PILOT_GATE_TTL_MAX_MS_V01 ||
    Number(config.gate_ttl_ms) > Number(config.preview_max_age_ms) ||
    !(config.preview_source === "default" ||
      config.preview_source === "explicit_environment") ||
    !(config.gate_source === "default" ||
      config.gate_source === "explicit_environment")
  ) {
    throw transitionError("operator_pilot_preview_binding_invalid", 409);
  }
  return config as unknown as VNextOperatorPilotReviewWindowConfigV01;
}

function reviewWindowCapabilityFor(
  pilotConfig: VNextLocalOperatorPilotConfigV01,
  config: VNextOperatorPilotReviewWindowConfigV01,
): VNextOperatorPilotReviewWindowCapabilityV01 {
  return createVNextOperatorPilotReviewWindowCapabilityV01({
    config: reviewWindowConfigOrDefault(config),
    workspace_id: pilotConfig.workspace_id,
    project_id: pilotConfig.project_id,
  });
}

function validateHistoricalReviewWindowConfirmationBasis(
  refs: ExternalRefV01[],
  confirmedAt: string,
  add: (code: string) => void,
): void {
  const contexts = refs.filter(
    (ref) => ref.ref_type === "semantic_commit_confirmation_context",
  );
  if (contexts.length > 1) {
    add("operator_pilot_review_window_confirmation_basis_ambiguous");
    return;
  }
  const actual = contexts[0] ?? null;
  if (
    actual &&
    (actual.ref_version !== EXTERNAL_REF_VERSION_V01 ||
      actual.external_id !==
        VNEXT_OPERATOR_PILOT_REVIEW_WINDOW_CONFIG_VERSION_V01 ||
      actual.trust_class !== "direct_local_observation" ||
      actual.observed_at !== confirmedAt ||
      actual.compatibility_namespace !==
        "augnes.vnext.semantic-commit-confirmation-context.v0.1" ||
      !actual.source_ref ||
      !/^sha256:[a-f0-9]{64}$/.test(actual.source_ref))
  ) {
    add("operator_pilot_review_window_confirmation_basis_invalid");
  }
}

function addReviewWindowMilliseconds(value: string, milliseconds: number): string {
  const parsed = parseStrictIsoTimestampV01(value);
  if (parsed === null || !Number.isSafeInteger(milliseconds)) {
    throw transitionError("operator_pilot_review_window_config_invalid", 503);
  }
  return new Date(parsed + milliseconds).toISOString();
}

function assertPilotGateAndDecision(
  db: Database.Database,
  config: VNextLocalOperatorPilotConfigV01,
  request: CommitRequestV01,
  requiredSessionId: string,
  reviewWindowConfig: VNextOperatorPilotReviewWindowConfigV01,
): VNextSemanticCommitGateRecordV01 {
  const material = requirePilotAcceptedOperationMaterial(db, config, request, {
    require_current_admission: false,
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
    gate.intended_effects.length !== material.candidate.candidate.target_refs.length ||
    gate.intended_effects.some(
      (effect) =>
        effect.operation !== material.admission.mapped_operation ||
        effect.before_presence !==
          (material.admission.mapped_operation === "create"
            ? "absent"
            : "present"),
    ) ||
    gate.current_state_observations?.length !== material.candidate.candidate.target_refs.length ||
    gate.current_state_observations.some(
      (observation) =>
        observation.presence !==
          (material.admission.mapped_operation === "create"
            ? "absent"
            : "present"),
    ) ||
    gate.semantic_commit_gate_evaluation?.authorized_applier_ref.ref_type !==
      authorizedApplierIdentity(config).ref_type ||
    gate.semantic_commit_gate_evaluation?.authorized_applier_ref.external_id !==
      authorizedApplierIdentity(config).external_id
  ) {
    throw transitionError("operator_pilot_gate_policy_mismatch", 409);
  }
  assertVNextOperatorPilotGateReviewWindowConfigV01(
    gate as VNextSemanticCommitGateRecordV01,
    reviewWindowConfig,
  );
  const provenance =
    validateVNextOperatorPilotSemanticGateConfirmationProvenanceV01(db, {
      config,
      proposal: material.proposal,
      decision: material.decision,
      gate: gate as VNextSemanticCommitGateRecordV01,
      required_session_id: requiredSessionId,
      review_window_config: reviewWindowConfig,
    });
  if (provenance.status !== "valid") {
    throw transitionError(
      `operator_pilot_gate_confirmation_provenance_invalid:${provenance.errors.join(",")}`,
      409,
    );
  }
  return gate as VNextSemanticCommitGateRecordV01;
}

function requirePilotAppliedOperation(
  db: Database.Database,
  config: VNextLocalOperatorPilotConfigV01,
  request: CompileRequestV01,
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
      authenticated_session_id: null,
    },
  );
  const gateProvenance =
    validateVNextOperatorPilotSemanticGateConfirmationProvenanceV01(db, {
      config,
      proposal: transition.proposal,
      decision: transition.decision,
      gate: transition.gate_record,
    });
  const candidate = transition.proposal.proposed_deltas.find(
    (item) =>
      item.candidate_id === transition.decision.candidate.candidate_id &&
      createProtocolSha256V01(canonicalizeProtocolValueV01(item)) ===
        transition.decision.candidate.candidate_fingerprint,
  );
  const mappedOperation = candidate
    ? candidate.operation === "add"
      ? "create"
      : candidate.operation === "revise"
        ? "replace"
        : candidate.operation === "supersede"
          ? "supersede"
          : candidate.operation === "retract" || candidate.operation === "remove"
            ? "retract"
            : null
    : null;
  const applying = candidate
    ? resolveVNextOperatorPilotApplyingDecisionV01(
        transition.proposal,
        candidate,
      )
    : null;
  if (
    provenance.status !== "valid" ||
    gateProvenance.status !== "valid" ||
    !applying ||
    transition.decision.decision !== applying.decision ||
    !mappedOperation ||
    transition.receipt.effects.length === 0 ||
    transition.receipt.effects.some(
      (effect) =>
        effect.operation !== mappedOperation ||
        effect.before_state.presence !==
          (mappedOperation === "create" ? "absent" : "present") ||
        effect.after_state.presence !==
          (mappedOperation === "retract" ? "absent" : "present"),
    )
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

function compileLaterPacketInsideTransactionV01(
  db: Database.Database,
  input: {
    config: VNextLocalOperatorPilotConfigV01;
    transition: ReturnType<
      typeof loadValidatedVNextSemanticTransitionRelationV01
    >;
    prior_packet: TaskContextPacketV01;
    transition_receipt_id: string;
    transition_receipt_fingerprint: string;
    clock?: VNextLocalRuntimeClockV01;
  },
): CompileTaskContextPacketFromPersistedSemanticStateResultV01 {
  if (!db.inTransaction) {
    throw transitionError("operator_pilot_compile_transaction_required", 500);
  }
  const existing = findExistingCompiledPacket(
    db,
    input.transition,
    input.prior_packet,
  );
  if (existing) {
    const replay =
      compileTaskContextPacketFromPersistedSemanticStateInsideTransactionV01(
        db,
        {
          workspace_id: input.config.workspace_id,
          project_id: input.config.project_id,
          prior_packet: input.prior_packet,
          transition_receipt_id: input.transition_receipt_id,
          transition_receipt_fingerprint:
            input.transition_receipt_fingerprint,
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
      throw transitionError(
        "operator_pilot_compiled_packet_replay_conflict",
        409,
      );
    }
    return replay;
  }
  const generatedAt = readVNextLocalRuntimeClockNowV01(
    input.clock,
    "operator_pilot_later_packet_generated_at",
  );
  const parsedGeneratedAt = parseStrictIsoTimestampV01(generatedAt);
  if (parsedGeneratedAt === null) {
    throw transitionError("operator_pilot_later_packet_time_invalid", 500);
  }
  const expiresAt = new Date(
    parsedGeneratedAt + VNEXT_OPERATOR_PILOT_LATER_PACKET_TTL_MS_V01,
  ).toISOString();
  return compileTaskContextPacketFromPersistedSemanticStateInsideTransactionV01(
    db,
    {
      workspace_id: input.config.workspace_id,
      project_id: input.config.project_id,
      prior_packet: input.prior_packet,
      transition_receipt_id: input.transition_receipt_id,
      transition_receipt_fingerprint: input.transition_receipt_fingerprint,
      expiry_policy: { mode: "explicit", expires_at: expiresAt },
      clock: { now: () => generatedAt },
    },
  );
}

function readPersistedPriorPacket(
  db: Database.Database,
  config: VNextLocalOperatorPilotConfigV01,
  request: Pick<
    CompileRequestV01,
    "prior_packet_id" | "prior_packet_fingerprint"
  >,
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

function parseApplyRequest(value: unknown): ApplyRequestV01 {
  const parsed = parseAllowedObject(value, [
    "proposal_id",
    "proposal_fingerprint",
    "decision_id",
    "decision_fingerprint",
    "gate_record_id",
    "gate_record_fingerprint",
    "prior_packet_id",
    "prior_packet_fingerprint",
  ]);
  return {
    proposal_id: parsed.proposal_id!,
    proposal_fingerprint: parsed.proposal_fingerprint!,
    decision_id: parsed.decision_id!,
    decision_fingerprint: parsed.decision_fingerprint!,
    gate_record_id: parsed.gate_record_id!,
    gate_record_fingerprint: parsed.gate_record_fingerprint!,
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
    "review_window_config",
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
  assertSerializedReviewWindowConfig(payload.review_window_config);
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
