import Database from "better-sqlite3";

import {
  readAutonomyRunLedgerRecord,
  updateAutonomyRunLedgerFields,
} from "@/lib/autonomy/runner-ledger";
import { isTerminalRunnerStatus } from "@/lib/autonomy/runner-state";

import {
  assertVNextCoreRecordMatchesProtocolPayloadBindingV01,
  assertVNextDurableSemanticStoreSchemaV01,
  listVNextSemanticStateEntriesV01,
  readVNextCoreRecordV01,
  readVNextSemanticTargetHeadV01,
  rebuildVNextPersistedSemanticStateV01,
  type VNextPersistedSemanticStateVersionV01,
  type VNextSemanticStateProjectionEntryV01,
} from "@/lib/vnext/persistence/durable-semantic-store";
import {
  admitEpisodeDeltaProposalV01,
  EpisodeDeltaProposalAdmissionErrorV01,
  readStrategicAdvantageTransferProposalByIdentityV01,
} from "@/lib/vnext/persistence/episode-delta-proposal-admission";
import { readActiveProjectSelectionV01 } from "@/lib/vnext/persistence/project-lifecycle-registry";
import {
  canonicalizeProtocolValueV01,
  compareExternalRefsV01,
  compareProtocolCanonicalV01,
  createProtocolSha256V01,
  normalizeExternalRefPrimitiveV01,
  normalizeProtocolTextV01,
  uniqueProtocolStringsV01,
  uniqueProtocolValuesV01,
} from "@/lib/vnext/protocol-primitives";
import {
  assertStrategicAdvantageTransferSourceTextSafeV01,
  createStrategicAnalysisIdentityV01,
  createStrategicAdvantageTransferBudgetV01,
  createStrategicSourceCatalogFingerprintV01,
  createStrategicSourceKeyV01,
  createStrategicWorkingFrameFingerprintV01,
  normalizeStrategicAdvantageTransferModelOutputV01,
  StrategicAdvantageTransferProtocolErrorV01,
  validateStrategicAdvantageTransferSourceCatalogV01,
  validateStrategicAdvantageTransferWorkingFrameV01,
} from "@/lib/vnext/strategic-advantage-transfer-protocol";
import {
  deriveStrategicAdvantageTransferAdmissionIdentityV01,
  materializeStrategicAdvantageTransferProposalV01,
  packetRefV01,
  receiptRefV01,
  sourceProposalBinding,
  StrategicAdvantageTransferMaterializationErrorV01,
  type StrategicAdvantageTransferMaterializationSourceV01,
} from "@/lib/vnext/strategic-advantage-transfer";
import {
  ModelGatewayInvocationErrorV01,
  MODEL_INVOCATION_ENVELOPE_VERSION_V01,
  STRATEGIC_ADVANTAGE_TRANSFER_MODEL_GATEWAY_PURPOSE_V01,
  type ModelAdapterV01,
} from "@/lib/vnext/model-gateway/contracts";
import {
  invokeStrategicAdvantageTransferModelGatewayV01,
  readDefaultModelGatewayLocalCapabilityV01,
  type StrategicAdvantageTransferModelGatewayDependenciesV01,
} from "@/lib/vnext/model-gateway/model-gateway";
import { validateModelInvocationReceiptV02 } from "@/lib/vnext/model-gateway/model-invocation-receipt";
import { ModelGatewayCostAuthorityErrorV01 } from "@/lib/vnext/model-gateway/cost-authority";
import { validateEpisodeDeltaProposalV01 } from "@/lib/vnext/episode-delta-proposal";
import { materializeRunAssessmentProposalV01 } from "@/lib/vnext/run-assessment-proposal";
import { createEpisodeDeltaCandidateFingerprintV01 } from "@/lib/vnext/review-decision";
import {
  authenticateVNextLocalOperatorSessionV01,
  admitVNextLocalOperatorMutationInsideTransactionV01,
  type VNextLocalOperatorPilotConfigV01,
  type VNextLocalOperatorSecretSourceV01,
  type VNextLocalOperatorSessionCredentialV01,
  type VNextLocalOperatorSessionMutationAdmissionV01,
} from "@/lib/vnext/runtime/local-operator-session";
import type { VNextLocalRuntimeClockV01 } from "@/lib/vnext/runtime/local-runtime-clock";
import { readProjectRunResultSourceBindingV01 } from "@/lib/vnext/runtime/project-run-result-read-model";
import { loadValidatedVNextSemanticTransitionRelationV01 } from "@/lib/vnext/runtime/durable-semantic-transition";
import type { EpisodeDeltaProposalV01 } from "@/types/vnext/episode-delta-proposal";
import type {
  ExternalRefTrustClassV01,
  ExternalRefV01,
} from "@/types/vnext/external-ref";
import {
  STRATEGIC_ADVANTAGE_TRANSFER_LENSES_V01,
  STRATEGIC_ADVANTAGE_TRANSFER_MODEL_SCHEMA_VERSION_V01,
  STRATEGIC_ADVANTAGE_TRANSFER_PROFILE_VERSION_V01,
  STRATEGIC_ADVANTAGE_TRANSFER_SOURCE_CATALOG_VERSION_V01,
  STRATEGIC_ADVANTAGE_TRANSFER_WORKING_FRAME_VERSION_V01,
  type StrategicAdvantageTransferBaseStrategyV01,
  type StrategicAdvantageTransferModelInputV01,
  type StrategicAdvantageTransferModelOutputV01,
  type StrategicAdvantageTransferSourceCatalogEntryV01,
  type StrategicAdvantageTransferSourceCatalogV01,
  type StrategicAdvantageTransferWorkingFrameV01,
} from "@/types/vnext/strategic-advantage-transfer";
import type {
  ModelGatewayCostBudgetV01,
  ModelInvocationReceiptV02,
} from "@/types/vnext/model-invocation-receipt";

export const VNEXT_OPERATOR_STRATEGIC_REQUEST_VERSION_V01 =
  "vnext_operator_strategic_advantage_transfer_request.v0.1" as const;
export const VNEXT_OPERATOR_STRATEGIC_SETTLEMENT_VERSION_V01 =
  "vnext_operator_strategic_advantage_transfer_settlement.v0.1" as const;

interface StrategicModelAttemptReadbackV01 {
  receipt_ref: ExternalRefV01;
  status: ModelInvocationReceiptV02["status"];
  failure_code: ModelInvocationReceiptV02["failure_code"];
  egress_attempted: boolean;
}

const MAX_CONCURRENT_STRATEGIC_ANALYSES_V01 = 32;
const strategicAnalysesInFlightV01 = new Map<
  string,
  {
    consumers: number;
    result: Promise<
      Awaited<
        ReturnType<typeof invokeStrategicAdvantageTransferModelGatewayV01>
      >
    >;
  }
>();

export class VNextOperatorStrategicAdvantageTransferErrorV01 extends Error {
  constructor(readonly code: string, readonly status = 400) {
    super(code);
    this.name = "VNextOperatorStrategicAdvantageTransferErrorV01";
  }
}

export interface VNextOperatorStrategicAdvantageTransferRequestV01 {
  action: "request_strategic_advantage_transfer";
  proposal_id: string;
  proposal_fingerprint: string;
}

export type VNextOperatorStrategicAdvantageTransferReadbackV01 =
  | {
      status: "eligible";
      reason: string | null;
      base_label: string;
      base_fingerprint: string;
      working_frame_fingerprint: string;
      source_catalog_fingerprint: string;
      lenses: typeof STRATEGIC_ADVANTAGE_TRANSFER_LENSES_V01;
      budget: ReturnType<typeof createStrategicAdvantageTransferBudgetV01>;
      model_capability: ReturnType<
        typeof readDefaultModelGatewayLocalCapabilityV01
      >;
      existing_proposal: null;
      model_invocation_required: boolean;
      model_attempt_count: 0 | 1;
      last_model_attempt: StrategicModelAttemptReadbackV01 | null;
      optional: true;
      authoritative: false;
    }
  | {
      status: "available";
      reason: null;
      base_label: string;
      base_fingerprint: string;
      working_frame_fingerprint: string;
      source_catalog_fingerprint: string;
      lenses: typeof STRATEGIC_ADVANTAGE_TRANSFER_LENSES_V01;
      budget: ReturnType<typeof createStrategicAdvantageTransferBudgetV01>;
      model_capability: ReturnType<
        typeof readDefaultModelGatewayLocalCapabilityV01
      >;
      existing_proposal: {
        proposal_id: string;
        proposal_fingerprint: string;
        review_href: string;
      };
      model_attempt_count: 0 | 1;
      last_model_attempt: StrategicModelAttemptReadbackV01 | null;
      optional: true;
      authoritative: false;
    }
  | {
      status: "ineligible" | "unavailable" | "stale";
      reason: string;
      base_label: string | null;
      base_fingerprint: string | null;
      working_frame_fingerprint: string | null;
      source_catalog_fingerprint: string | null;
      lenses: typeof STRATEGIC_ADVANTAGE_TRANSFER_LENSES_V01;
      budget: ReturnType<typeof createStrategicAdvantageTransferBudgetV01>;
      model_capability: ReturnType<
        typeof readDefaultModelGatewayLocalCapabilityV01
      >;
      existing_proposal: null;
      model_attempt_count: 0 | 1;
      last_model_attempt: StrategicModelAttemptReadbackV01 | null;
      optional: true;
      authoritative: false;
    };

export type VNextOperatorStrategicAdvantageTransferResultV01 =
  | {
      status: "inserted" | "exact_replay";
      proposal: EpisodeDeltaProposalV01;
      source_proposal_unchanged: true;
      model_invocation_count: 0 | 1;
      session_cookie: SessionCookieV01;
    }
  | {
      status:
        | "unavailable"
        | "model_denied"
        | "model_timeout"
        | "model_cancelled"
        | "model_failed"
        | "malformed_output"
        | "source_conflict"
        | "stale_base"
        | "proposal_admission_failed";
      reason: string;
      retryable: boolean;
      proposal: null;
      source_proposal_unchanged: true;
      model_invocation_count: 0 | 1;
      session_cookie: SessionCookieV01 | null;
    };

type StrategicFailureStatusV01 =
  | "model_denied"
  | "model_timeout"
  | "model_cancelled"
  | "model_failed"
  | "malformed_output"
  | "source_conflict"
  | "stale_base"
  | "proposal_admission_failed";

interface SessionCookieV01 {
  value: string;
  expires_at: string;
  max_age_seconds: number;
}

interface PreparedStrategicSourceV01
  extends Omit<
    StrategicAdvantageTransferMaterializationSourceV01,
    "model_output" | "model_invocation_receipt"
  > {
  run_id: string;
  identity: ReturnType<
    typeof deriveStrategicAdvantageTransferAdmissionIdentityV01
  >;
  model_input: StrategicAdvantageTransferModelInputV01;
  budget: ReturnType<typeof createStrategicAdvantageTransferBudgetV01>;
}

interface StrategicCompletedModelResultV01 {
  output: StrategicAdvantageTransferModelOutputV01;
  model_invocation_receipt: ModelInvocationReceiptV02;
  normalized_output_fingerprint: string;
  receipt_fingerprint: string;
}

export interface VNextOperatorStrategicAdvantageTransferDependenciesV01 {
  adapter?: ModelAdapterV01;
  read_model_capability?: typeof readDefaultModelGatewayLocalCapabilityV01;
  read_cost_budget?: (input: {
    workspace_id: string;
    project_id: string;
  }) => ModelGatewayCostBudgetV01 | null;
  invoke_model?: typeof invokeStrategicAdvantageTransferModelGatewayV01;
  open_gateway_database?: () => Database.Database;
  read_root_availability?: NonNullable<
    StrategicAdvantageTransferModelGatewayDependenciesV01["read_root_availability"]
  >;
  now?: () => Date;
  before_proposal_insert?: () => void;
}

export function readVNextOperatorStrategicAdvantageTransferV01(
  db: Database.Database,
  input: {
    config: VNextLocalOperatorPilotConfigV01;
    proposal: EpisodeDeltaProposalV01;
    model_capability?: ReturnType<
      typeof readDefaultModelGatewayLocalCapabilityV01
    >;
    cost_budget?: ModelGatewayCostBudgetV01 | null;
  },
): VNextOperatorStrategicAdvantageTransferReadbackV01 {
  const capability =
    input.model_capability ?? readDefaultModelGatewayLocalCapabilityV01();
  if (input.proposal.strategic_advantage_transfer) {
    try {
      const profile = input.proposal.strategic_advantage_transfer;
      const historicalCostBudget =
        profile.budget.model.cost.status === "available"
          ? profile.budget.model.cost.budget
          : null;
      const sourceRecord = readVNextCoreRecordV01(db, {
        record_kind: "episode_delta_proposal",
        record_id:
          input.proposal.strategic_advantage_transfer.source_proposal
            .proposal_id,
        workspace_id: input.config.workspace_id,
        project_id: input.config.project_id,
      });
      if (!sourceRecord) {
        return unavailableReadback("stale", "source_proposal_missing", capability);
      }
      const prepared = prepareStrategicSource(db, {
        config: input.config,
        proposal_id: sourceRecord.record_id,
        proposal_fingerprint: sourceRecord.fingerprint,
        cost_budget:
          input.cost_budget === undefined
            ? historicalCostBudget
            : input.cost_budget,
      });
      if (
        prepared.identity.idempotency_key !==
          createProtocolSha256V01(
            canonicalizeProtocolValueV01({
              purpose: STRATEGIC_ADVANTAGE_TRANSFER_PROFILE_VERSION_V01,
              analysis_identity: profile.analysis_identity,
            }),
          ) ||
        prepared.identity.analysis_identity !== profile.analysis_identity ||
        prepared.base_strategy.base_fingerprint !==
          profile.base_strategy.base_fingerprint ||
        prepared.working_frame.working_frame_fingerprint !==
          profile.working_frame.working_frame_fingerprint ||
        prepared.source_catalog.source_catalog_fingerprint !==
          profile.source_catalog.source_catalog_fingerprint
      ) {
        return unavailableReadback("stale", "stale_base", capability);
      }
      const expected = materializeStrategicAdvantageTransferProposalV01({
        ...prepared,
        model_output: profile.normalized_model_output,
        model_invocation_receipt: profile.model_invocation.receipt,
      });
      let exactStrategicProposal = input.proposal;
      if (input.proposal.operation_revision) {
        const revisionSource = readVNextCoreRecordV01(db, {
          record_kind: "episode_delta_proposal",
          record_id: input.proposal.operation_revision.source.proposal_id,
          workspace_id: input.config.workspace_id,
          project_id: input.config.project_id,
        });
        if (
          !revisionSource ||
          revisionSource.fingerprint !==
            input.proposal.operation_revision.source.proposal_fingerprint ||
          validateEpisodeDeltaProposalV01(revisionSource.payload).status !==
            "valid"
        ) {
          return unavailableReadback(
            "stale",
            "strategic_revision_source_missing_or_conflicted",
            capability,
          );
        }
        exactStrategicProposal =
          revisionSource.payload as EpisodeDeltaProposalV01;
        if (
          canonicalizeProtocolValueV01(
            exactStrategicProposal.strategic_advantage_transfer,
          ) !== canonicalizeProtocolValueV01(profile)
        ) {
          throw strategicError(
            "strategic_advantage_transfer_revision_profile_conflict",
            409,
          );
        }
      }
      if (
        canonicalizeProtocolValueV01(expected.proposal) !==
          canonicalizeProtocolValueV01(exactStrategicProposal)
      ) {
        throw strategicError(
          "strategic_advantage_transfer_material_conflict",
          409,
        );
      }
      return availableReadback(prepared, capability, input.proposal);
    } catch (error) {
      if (
        error instanceof VNextOperatorStrategicAdvantageTransferErrorV01 &&
        isStaleError(error.code)
      ) {
        return unavailableReadback("stale", error.code, capability);
      }
      if (
        error instanceof StrategicAdvantageTransferProtocolErrorV01 ||
        (error instanceof VNextOperatorStrategicAdvantageTransferErrorV01 &&
          isSourceMaterialUnavailableError(error.code))
      ) {
        return unavailableReadback(
          "unavailable",
          error.code,
          capability,
        );
      }
      throw error;
    }
  }
  if (!input.proposal.source_assessment || input.proposal.operation_revision) {
    return unavailableReadback(
      "ineligible",
      "source_proposal_profile_unsupported",
      capability,
    );
  }
  let prepared: PreparedStrategicSourceV01;
  try {
    prepared = prepareStrategicSource(db, {
      config: input.config,
      proposal_id: input.proposal.proposal_id,
      proposal_fingerprint: input.proposal.integrity.fingerprint,
      cost_budget: input.cost_budget ?? null,
    });
  } catch (error) {
    if (
      error instanceof VNextOperatorStrategicAdvantageTransferErrorV01 &&
      isCurrentBaseStaleError(error.code)
    ) {
      return unavailableReadback("stale", error.code, capability);
    }
    if (
      error instanceof VNextOperatorStrategicAdvantageTransferErrorV01 &&
      isEligibilityError(error.code)
    ) {
      return unavailableReadback("ineligible", error.code, capability);
    }
    if (
      error instanceof StrategicAdvantageTransferProtocolErrorV01 ||
      (error instanceof VNextOperatorStrategicAdvantageTransferErrorV01 &&
        isSourceMaterialUnavailableError(error.code))
    ) {
      return unavailableReadback("unavailable", error.code, capability);
    }
    throw error;
  }
  if (prepared.budget.model.cost.status !== "available") {
    return {
      ...eligibleFields(prepared, capability),
      status: "unavailable",
      reason: "cost_authority_unavailable",
      existing_proposal: null,
    };
  }
  const existing = readVerifiedStrategicProposalByIdentityV01(
    db,
    prepared.identity,
  );
  if (existing) {
    const profile = existing.proposal.strategic_advantage_transfer;
    if (!profile) throw strategicError("strategic_advantage_transfer_record_invalid", 409);
    const expected = materializeStrategicAdvantageTransferProposalV01({
      ...prepared,
      model_output: profile.normalized_model_output,
      model_invocation_receipt: profile.model_invocation.receipt,
    });
    if (
      canonicalizeProtocolValueV01(expected.proposal) !==
        canonicalizeProtocolValueV01(existing.proposal)
    ) {
      throw strategicError("strategic_advantage_transfer_material_conflict", 409);
    }
    return availableReadback(prepared, capability, existing.proposal);
  }
  const priorSettlement = readStrategicSettlementV01(db, prepared);
  if (
    priorSettlement.status === "available" ||
    priorSettlement.status === "in_progress" ||
    (priorSettlement.status === "failed" && !priorSettlement.retryable)
  ) {
    const modelAttempt =
      priorSettlement.status === "failed"
        ? modelAttemptReadbackV01(
            priorSettlement.attempt_receipt ??
              priorSettlement.model_result?.model_invocation_receipt ??
              null,
          )
        : null;
    return {
      ...eligibleFields(prepared, capability),
      status: "unavailable",
      reason:
        priorSettlement.status === "available"
          ? "strategic_advantage_transfer_available_proposal_missing"
          : priorSettlement.status === "in_progress"
          ? "strategic_advantage_transfer_in_progress"
          : priorSettlement.error_code,
      existing_proposal: null,
      model_attempt_count: modelAttempt ? 1 : 0,
      last_model_attempt: modelAttempt,
    };
  }
  const retryReason =
    priorSettlement.status === "model_completed"
      ? "strategic_advantage_transfer_model_result_ready"
      : priorSettlement.status === "failed" && priorSettlement.retryable
        ? priorSettlement.error_code
        : null;
  const modelInvocationRequired = !(
    priorSettlement.status === "model_completed" ||
    (priorSettlement.status === "failed" &&
      priorSettlement.retryable &&
      priorSettlement.model_result)
  );
  const settledModelAttempt =
    priorSettlement.status === "model_completed"
      ? modelAttemptReadbackV01(
          priorSettlement.model_result.model_invocation_receipt,
        )
      : priorSettlement.status === "failed"
        ? modelAttemptReadbackV01(
            priorSettlement.attempt_receipt ??
              priorSettlement.model_result?.model_invocation_receipt ??
              null,
          )
        : null;
  const activeSelection = readActiveProjectSelectionV01(
    db,
    input.config.workspace_id,
  );
  if (
    !activeSelection ||
    activeSelection.project_id !== input.config.project_id
  ) {
    return {
      ...eligibleFields(prepared, capability),
      status: "unavailable",
      reason: "active_project_conflict",
      existing_proposal: null,
    };
  }
  if (
    modelInvocationRequired &&
    !permitsStrategicProviderEgress(prepared.packet)
  ) {
    return {
      ...eligibleFields(prepared, capability),
      status: "unavailable",
      reason: "model_egress_disallowed_for_packet_classification",
      existing_proposal: null,
    };
  }
  if (modelInvocationRequired && capability.status !== "available") {
    return {
      ...eligibleFields(prepared, capability),
      status: "unavailable",
      reason: `model_${capability.status}`,
      existing_proposal: null,
    };
  }
  return {
    ...eligibleFields(prepared, capability),
    status: "eligible",
    reason: retryReason,
    existing_proposal: null,
    model_invocation_required: modelInvocationRequired,
    model_attempt_count: settledModelAttempt ? 1 : 0,
    last_model_attempt: settledModelAttempt,
  };
}

export async function requestVNextOperatorStrategicAdvantageTransferV01(
  db: Database.Database,
  input: {
    config: VNextLocalOperatorPilotConfigV01;
    credential: VNextLocalOperatorSessionCredentialV01;
    request: unknown;
    signal: AbortSignal;
    clock?: VNextLocalRuntimeClockV01;
    secret_source?: VNextLocalOperatorSecretSourceV01;
    dependencies?: VNextOperatorStrategicAdvantageTransferDependenciesV01;
  },
): Promise<VNextOperatorStrategicAdvantageTransferResultV01> {
  assertVNextDurableSemanticStoreSchemaV01(db);
  const request = parseRequest(input.request);
  const authentication = authenticateVNextLocalOperatorSessionV01(db, input);
  if (
    authentication.session.workspace_id !== input.config.workspace_id ||
    authentication.session.project_id !== input.config.project_id ||
    authentication.session.operator_id !== input.config.operator_id
  ) {
    throw strategicError("strategic_advantage_transfer_session_scope_conflict", 403);
  }
  let prepared: PreparedStrategicSourceV01;
  try {
    let costBudget: ModelGatewayCostBudgetV01 | null;
    try {
      costBudget =
        input.dependencies?.read_cost_budget?.({
          workspace_id: input.config.workspace_id,
          project_id: input.config.project_id,
        }) ?? null;
    } catch (error) {
      if (error instanceof ModelGatewayCostAuthorityErrorV01) {
        return {
          status: "unavailable",
          reason: strategicCostFailureCodeV01(error.code),
          retryable: false,
          proposal: null,
          source_proposal_unchanged: true,
          model_invocation_count: 0,
          session_cookie: null,
        };
      }
      throw error;
    }
    prepared = prepareStrategicSource(db, {
      config: input.config,
      proposal_id: request.proposal_id,
      proposal_fingerprint: request.proposal_fingerprint,
      cost_budget: costBudget,
    });
  } catch (error) {
    if (
      error instanceof StrategicAdvantageTransferProtocolErrorV01 ||
      error instanceof StrategicAdvantageTransferMaterializationErrorV01
    ) {
      throw strategicError(error.code, 422);
    }
    throw error;
  }
  const existing = readVerifiedStrategicProposalByIdentityV01(
    db,
    prepared.identity,
  );
  const capability =
    input.dependencies?.read_model_capability?.() ??
    readDefaultModelGatewayLocalCapabilityV01();
  const priorSettlement = existing
    ? null
    : readStrategicSettlementV01(db, prepared);
  const modelInvocationRequired =
    priorSettlement === null ||
    priorSettlement.status === "none" ||
    (priorSettlement.status === "failed" &&
      priorSettlement.retryable &&
      !priorSettlement.model_result);
  if (
    !existing &&
    modelInvocationRequired &&
    prepared.budget.model.cost.status !== "available"
  ) {
    return {
      status: "unavailable",
      reason: "cost_authority_unavailable",
      retryable: false,
      proposal: null,
      source_proposal_unchanged: true,
      model_invocation_count: 0,
      session_cookie: null,
    };
  }
  if (
    !existing &&
    modelInvocationRequired &&
    !permitsStrategicProviderEgress(prepared.packet)
  ) {
    return {
      status: "unavailable",
      reason: "model_egress_disallowed_for_packet_classification",
      retryable: false,
      proposal: null,
      source_proposal_unchanged: true,
      model_invocation_count: 0,
      session_cookie: null,
    };
  }
  if (
    !existing &&
    modelInvocationRequired &&
    capability.status !== "available"
  ) {
    return {
      status: "unavailable",
      reason: `model_${capability.status}`,
      retryable: false,
      proposal: null,
      source_proposal_unchanged: true,
      model_invocation_count: 0,
      session_cookie: null,
    };
  }
  if (existing) {
    const admission = consumeMutationNonce(db, input);
    const profile = existing.proposal.strategic_advantage_transfer;
    if (!profile) throw strategicError("strategic_advantage_transfer_record_invalid", 409);
    const expected = materializeStrategicAdvantageTransferProposalV01({
      ...prepared,
      model_output: profile.normalized_model_output,
      model_invocation_receipt: profile.model_invocation.receipt,
    });
    if (
      canonicalizeProtocolValueV01(expected.proposal) !==
        canonicalizeProtocolValueV01(existing.proposal)
    ) {
      throw strategicError("strategic_advantage_transfer_conflicting_replay", 409);
    }
    return {
      status: "exact_replay",
      proposal: existing.proposal,
      source_proposal_unchanged: true,
      model_invocation_count: 0,
      session_cookie: admissionCookie(admission),
    };
  }
  const active = readActiveProjectSelectionV01(
    db,
    input.config.workspace_id,
  );
  if (!active || active.project_id !== input.config.project_id) {
    throw strategicError("strategic_advantage_transfer_active_project_conflict", 409);
  }
  const claim = claimStrategicAnalysisV01(db, input, prepared);
  const admission = claim.admission;
  if (claim.status === "blocked") {
    return {
      status: claim.failure_status,
      reason: claim.error_code,
      retryable: false,
      proposal: null,
      source_proposal_unchanged: true,
      model_invocation_count: 0,
      session_cookie: admissionCookie(admission),
    };
  }
  let modelResult: Pick<
    Awaited<
      ReturnType<typeof invokeStrategicAdvantageTransferModelGatewayV01>
    >,
    "output" | "model_invocation_receipt"
  >;
  let modelInvocationCount: 0 | 1 = 0;
  let releaseModelInvocation: () => void = () => {};
  if (claim.status === "replay_model_result") {
    modelResult = {
      output: claim.model_result.output,
      model_invocation_receipt:
        claim.model_result.model_invocation_receipt,
    };
  } else {
    try {
      const invocation = await invokeStrategicAnalysisOnceV01(
        prepared.identity.analysis_identity,
        () =>
          (
            input.dependencies?.invoke_model ??
            invokeStrategicAdvantageTransferModelGatewayV01
          )(
            {
              envelope_version: MODEL_INVOCATION_ENVELOPE_VERSION_V01,
              invocation_id: `strategic:${prepared.identity.analysis_identity.slice(7, 39)}`,
              workspace_id: input.config.workspace_id,
              project_id: input.config.project_id,
              purpose:
                STRATEGIC_ADVANTAGE_TRANSFER_MODEL_GATEWAY_PURPOSE_V01,
              data_classification:
                prepared.packet.constraints.data_classification,
              provenance_refs:
                strategicInvocationProvenanceV01(prepared),
              privacy: {
                provider_egress: "allow",
                retention_class: "none",
              },
              budget: {
                max_input_bytes:
                  prepared.model_input.budget.model.max_input_bytes,
                max_output_tokens:
                  prepared.model_input.budget.model.max_output_tokens,
                max_provider_calls: 1,
                cost_budget:
                  prepared.budget.model.cost.status === "available"
                    ? prepared.budget.model.cost.budget
                    : undefined,
              },
              timeout_ms: prepared.model_input.budget.model.timeout_ms,
              cancellation: { signal: input.signal },
              execution_mode: "live",
              policy: {
                invocation_origin: "interactive",
                expected_active_project_id: input.config.project_id,
                expected_active_selection_revision:
                  active.selection_revision,
              },
              input: prepared.model_input,
            },
            {
              ...(input.dependencies?.adapter
                ? { adapter: input.dependencies.adapter }
                : {}),
              ...(input.dependencies?.open_gateway_database
                ? {
                    open_database:
                      input.dependencies.open_gateway_database,
                  }
                : {}),
              ...(input.dependencies?.read_root_availability
                ? {
                    read_root_availability:
                      input.dependencies.read_root_availability,
                  }
                : {}),
              ...(input.dependencies?.now
                ? { now: input.dependencies.now }
                : {}),
            },
          ),
        );
      modelResult = invocation.result;
      modelInvocationCount = invocation.invoked ? 1 : 0;
      releaseModelInvocation = invocation.release;
    } catch (error) {
      if (error instanceof ModelGatewayInvocationErrorV01) {
        // v0.1 permits one logical Gateway invocation for one exact analysis
        // identity. A failed provider attempt is therefore final for that
        // identity; only post-model proposal persistence may be reconciled.
        const retryable = false;
        const recordedCode = error.code;
        const failureStatus = classifyStrategicFailureStatusV01(recordedCode);
        recordStrategicFailureWithoutMaskingV01(
          db,
          prepared,
          failureStatus,
          recordedCode,
          retryable,
          error.receipt,
        );
        return {
          status: failureStatus,
          reason: recordedCode,
          retryable,
          proposal: null,
          source_proposal_unchanged: true,
          model_invocation_count: 1,
          session_cookie: admissionCookie(admission),
        };
      }
      if (error instanceof VNextOperatorStrategicAdvantageTransferErrorV01) {
        const retryable =
          error.code ===
          "strategic_advantage_transfer_concurrency_bound_exceeded";
        recordStrategicFailureWithoutMaskingV01(
          db,
          prepared,
          "proposal_admission_failed",
          error.code,
          retryable,
        );
        return {
          status: "proposal_admission_failed",
          reason: error.code,
          retryable,
          proposal: null,
          source_proposal_unchanged: true,
          model_invocation_count: 0,
          session_cookie: admissionCookie(admission),
        };
      }
      recordStrategicFailureWithoutMaskingV01(
        db,
        prepared,
        "proposal_admission_failed",
        "strategic_advantage_transfer_model_failed",
        false,
      );
      throw error;
    }
  }
  try {
    let current: PreparedStrategicSourceV01;
    try {
      current = prepareStrategicSource(db, {
        config: input.config,
        proposal_id: request.proposal_id,
        proposal_fingerprint: request.proposal_fingerprint,
        cost_budget:
          prepared.budget.model.cost.status === "available"
            ? prepared.budget.model.cost.budget
            : null,
      });
    } catch (error) {
      if (error instanceof VNextOperatorStrategicAdvantageTransferErrorV01) {
        return postInvocationFailure(
          db,
          prepared,
          isStaleError(error.code) ? "stale_base" : "source_conflict",
          error.code,
          false,
          admission,
          modelInvocationCount,
          modelResult.model_invocation_receipt,
        );
      }
      if (
        error instanceof StrategicAdvantageTransferProtocolErrorV01 ||
        error instanceof StrategicAdvantageTransferMaterializationErrorV01
      ) {
        return postInvocationFailure(
          db,
          prepared,
          "source_conflict",
          error.code,
          false,
          admission,
          modelInvocationCount,
          modelResult.model_invocation_receipt,
        );
      }
      return postInvocationFailure(
        db,
        prepared,
        "source_conflict",
        sqliteFailureCode(error) ??
          "strategic_advantage_transfer_source_revalidation_failed",
        false,
        admission,
        modelInvocationCount,
        modelResult.model_invocation_receipt,
      );
    }
    if (
      current.identity.analysis_identity !== prepared.identity.analysis_identity
    ) {
      return postInvocationFailure(
        db,
        prepared,
        "source_conflict",
        "strategic_advantage_transfer_source_changed",
        false,
        admission,
        modelInvocationCount,
        modelResult.model_invocation_receipt,
      );
    }
    try {
      materializeStrategicAdvantageTransferProposalV01({
        ...current,
        model_output: modelResult.output,
        model_invocation_receipt: modelResult.model_invocation_receipt,
      });
    } catch (error) {
      if (
        error instanceof StrategicAdvantageTransferMaterializationErrorV01 ||
        error instanceof StrategicAdvantageTransferProtocolErrorV01
      ) {
        return postInvocationFailure(
          db,
          prepared,
          "malformed_output",
          error.code,
          false,
          admission,
          modelInvocationCount,
          modelResult.model_invocation_receipt,
        );
      }
      return postInvocationFailure(
        db,
        prepared,
        "malformed_output",
        sqliteFailureCode(error) ??
          "strategic_advantage_transfer_materialization_failed",
        false,
        admission,
        modelInvocationCount,
        modelResult.model_invocation_receipt,
      );
    }
    try {
      recordStrategicModelResultV01(db, current, modelResult);
    } catch (error) {
      const reason =
        error instanceof VNextOperatorStrategicAdvantageTransferErrorV01
          ? error.code
          : sqliteFailureCode(error) ??
            "strategic_advantage_transfer_model_result_settlement_failed";
      // The Gateway attempt is already complete. Preserve its immutable receipt
      // even when durable normalized-result settlement fails. This bookkeeping
      // remains non-masking: a storage failure may leave the conservative
      // in-progress claim, but it must not replace the original settlement code.
      recordStrategicFailureWithoutMaskingV01(
        db,
        prepared,
        "proposal_admission_failed",
        reason,
        false,
        modelResult.model_invocation_receipt,
      );
      return {
        status: "proposal_admission_failed",
        reason,
        retryable: false,
        proposal: null,
        source_proposal_unchanged: true,
        model_invocation_count: modelInvocationCount,
        session_cookie: admissionCookie(admission),
      };
    }
    let write: ReturnType<typeof admitPreparedStrategicProposalV01>;
    try {
      write = admitPreparedStrategicProposalV01(db, {
        config: input.config,
        source_proposal_id: request.proposal_id,
        source_proposal_fingerprint: request.proposal_fingerprint,
        expected_analysis_identity: current.identity.analysis_identity,
        expected_active_selection_revision: active.selection_revision,
        model_output: modelResult.output,
        model_invocation_receipt: modelResult.model_invocation_receipt,
        before_proposal_insert: input.dependencies?.before_proposal_insert,
      });
    } catch (error) {
      if (error instanceof VNextOperatorStrategicAdvantageTransferErrorV01) {
        return postInvocationFailure(
          db,
          prepared,
          error.code.includes("conflict")
            ? "source_conflict"
            : "proposal_admission_failed",
          error.code,
          false,
          admission,
          modelInvocationCount,
        );
      }
      const code = sqliteFailureCode(error);
      return postInvocationFailure(
        db,
        prepared,
        "proposal_admission_failed",
        code ?? "strategic_advantage_transfer_proposal_admission_failed",
        isRetryableStrategicStorageFailureV01(code),
        admission,
        modelInvocationCount,
      );
    }
    assertSourceProposalUnchanged(db, current.source_proposal);
    return {
      status: write.status,
      proposal: write.proposal,
      source_proposal_unchanged: true,
      model_invocation_count: modelInvocationCount,
      session_cookie: admissionCookie(admission),
    };
  } finally {
    releaseModelInvocation();
  }
}

/**
 * Re-resolves and rematerializes every persisted source inside the immediate
 * transaction, then delegates storage/replay to the canonical proposal writer.
 */
function admitPreparedStrategicProposalV01(
  db: Database.Database,
  input: {
    config: VNextLocalOperatorPilotConfigV01;
    source_proposal_id: string;
    source_proposal_fingerprint: string;
    expected_analysis_identity: string;
    expected_active_selection_revision: number;
    model_output: Parameters<
      typeof materializeStrategicAdvantageTransferProposalV01
    >[0]["model_output"];
    model_invocation_receipt: Parameters<
      typeof materializeStrategicAdvantageTransferProposalV01
    >[0]["model_invocation_receipt"];
    before_proposal_insert?: () => void;
  },
): {
  status: "inserted" | "exact_replay";
  proposal: EpisodeDeltaProposalV01;
} {
  if (db.inTransaction) {
    throw strategicError("strategic_advantage_transfer_nested_transaction", 409);
  }
  db.exec("BEGIN IMMEDIATE");
  try {
    const active = readActiveProjectSelectionV01(
      db,
      input.config.workspace_id,
    );
    if (
      !active ||
      active.project_id !== input.config.project_id ||
      active.selection_revision !== input.expected_active_selection_revision
    ) {
      throw strategicError(
        "strategic_advantage_transfer_active_project_conflict",
        409,
      );
    }
    const current = prepareStrategicSource(db, {
      config: input.config,
      proposal_id: input.source_proposal_id,
      proposal_fingerprint: input.source_proposal_fingerprint,
      cost_budget: input.model_invocation_receipt.budget.cost_budget ?? null,
    });
    if (
      current.identity.analysis_identity !== input.expected_analysis_identity
    ) {
      throw strategicError(
        "strategic_advantage_transfer_source_changed",
        409,
      );
    }
    const source: StrategicAdvantageTransferMaterializationSourceV01 = {
      ...current,
      model_output: input.model_output,
      model_invocation_receipt: input.model_invocation_receipt,
    };
    const material = materializeStrategicAdvantageTransferProposalV01(source);
    const existing = readVerifiedStrategicProposalByIdentityV01(
      db,
      material.identity,
    );
    if (existing) {
      if (
        canonicalizeProtocolValueV01(existing.proposal) !==
        canonicalizeProtocolValueV01(material.proposal)
      ) {
        throw strategicError(
          "strategic_advantage_transfer_conflicting_replay",
          409,
        );
      }
      recordStrategicAvailableInsideTransactionV01(
        db,
        current,
        existing.proposal,
      );
      db.exec("COMMIT");
      return { status: "exact_replay", proposal: existing.proposal };
    }
    input.before_proposal_insert?.();
    const write = admitEpisodeDeltaProposalV01(db, {
      expected: material,
      source,
    });
    recordStrategicAvailableInsideTransactionV01(
      db,
      current,
      write.proposal,
    );
    db.exec("COMMIT");
    return {
      status: write.status,
      proposal: write.proposal,
    };
  } catch (error) {
    if (db.inTransaction) db.exec("ROLLBACK");
    if (error instanceof EpisodeDeltaProposalAdmissionErrorV01) {
      throw strategicError(
        error.code,
        409,
      );
    }
    throw error;
  }
}

function readVerifiedStrategicProposalByIdentityV01(
  db: Database.Database,
  identity: Parameters<
    typeof readStrategicAdvantageTransferProposalByIdentityV01
  >[1],
) {
  try {
    return readStrategicAdvantageTransferProposalByIdentityV01(db, identity);
  } catch (error) {
    if (error instanceof EpisodeDeltaProposalAdmissionErrorV01) {
      throw strategicError(error.code, 409);
    }
    throw error;
  }
}

function prepareStrategicSource(
  db: Database.Database,
  input: {
    config: VNextLocalOperatorPilotConfigV01;
    proposal_id: string;
    proposal_fingerprint: string;
    cost_budget?: ModelGatewayCostBudgetV01 | null;
  },
): PreparedStrategicSourceV01 {
  const record = readVNextCoreRecordV01(db, {
    record_kind: "episode_delta_proposal",
    record_id: input.proposal_id,
    workspace_id: input.config.workspace_id,
    project_id: input.config.project_id,
  });
  if (!record) throw strategicError("strategic_advantage_transfer_source_proposal_missing", 404);
  if (validateEpisodeDeltaProposalV01(record.payload).status !== "valid") {
    throw strategicError("strategic_advantage_transfer_source_proposal_invalid", 422);
  }
  const proposal = record.payload as EpisodeDeltaProposalV01;
  assertVNextCoreRecordMatchesProtocolPayloadBindingV01(record, {
    workspace_id: proposal.workspace_id,
    project_id: proposal.project_id,
    fingerprint: proposal.integrity.fingerprint,
  });
  if (
    record.record_id !== proposal.proposal_id ||
    record.created_at !== proposal.created_at ||
    proposal.integrity.fingerprint !== input.proposal_fingerprint ||
    !proposal.source_assessment ||
    proposal.operation_revision ||
    proposal.strategic_advantage_transfer
  ) {
    throw strategicError("strategic_advantage_transfer_source_proposal_conflict", 409);
  }
  const receiptRef = proposal.source_assessment.receipt_ref;
  const binding = readProjectRunResultSourceBindingV01(db, {
    workspace_id: input.config.workspace_id,
    project_id: input.config.project_id,
    receipt_id: receiptRef.external_id,
  });
  if (
    !binding.packet ||
    binding.criterion_assessment.status !== "available"
  ) {
    throw strategicError("strategic_advantage_transfer_source_binding_unavailable", 422);
  }
  const expectedSourceMaterial = materializeRunAssessmentProposalV01({
    packet: binding.packet,
    receipt: binding.receipt,
    assessment: binding.criterion_assessment.assessment,
  });
  const expectedSourceProposal = expectedSourceMaterial.proposal;
  if (
    record.idempotency_key !==
      expectedSourceMaterial.identity.idempotency_key ||
    canonicalizeProtocolValueV01(expectedSourceProposal) !==
      canonicalizeProtocolValueV01(proposal)
  ) {
    throw strategicError("strategic_advantage_transfer_source_proposal_material_conflict", 409);
  }
  const base = resolveEligibleBaseStrategy(db, {
    config: input.config,
    packet: binding.packet,
  });
  const workingFrame = buildWorkingFrame({
    proposal,
    packet: binding.packet,
    receipt: binding.receipt,
    assessment: binding.criterion_assessment.assessment,
    base,
  });
  const catalog = buildSourceCatalog({
    proposal,
    packet: binding.packet,
    receipt: binding.receipt,
    assessment: binding.criterion_assessment.assessment,
    base,
  });
  const validatedWorkingFrame =
    validateStrategicAdvantageTransferWorkingFrameV01(workingFrame);
  const validatedCatalog =
    validateStrategicAdvantageTransferSourceCatalogV01(catalog);
  const budget = createStrategicAdvantageTransferBudgetV01(
    input.cost_budget ?? null,
  );
  const modelInput = buildModelInput(
    validatedWorkingFrame,
    validatedCatalog,
    budget,
  );
  if (
    new TextEncoder().encode(canonicalizeProtocolValueV01(modelInput))
      .byteLength > modelInput.budget.model.max_input_bytes
  ) {
    throw strategicError(
      "strategic_advantage_transfer_source_material_bound_exceeded",
      422,
    );
  }
  if (
    !binding.run ||
    !isTerminalRunnerStatus(binding.run.status) ||
    binding.run.scope !== input.config.project_id ||
    binding.run.metadata.workspace_id !== input.config.workspace_id ||
    binding.run.metadata.project_id !== input.config.project_id ||
    binding.run.metadata.run_receipt_id !== binding.receipt.receipt_id ||
    binding.run.metadata.run_receipt_fingerprint !==
      binding.receipt.integrity.fingerprint
  ) {
    throw strategicError(
      "strategic_advantage_transfer_source_run_conflict",
      409,
    );
  }
  const identity = deriveStrategicAdvantageTransferAdmissionIdentityV01({
    source_proposal: proposal,
    packet: binding.packet,
    receipt: binding.receipt,
    assessment: binding.criterion_assessment.assessment,
    base_strategy: base,
    working_frame: validatedWorkingFrame,
    source_catalog: validatedCatalog,
    budget,
  });
  return {
    run_id: binding.run.run_id,
    source_proposal: proposal,
    packet: binding.packet,
    receipt: binding.receipt,
    assessment: binding.criterion_assessment.assessment,
    base_strategy: base,
    working_frame: validatedWorkingFrame,
    source_catalog: validatedCatalog,
    budget,
    identity,
    model_input: modelInput,
  };
}

function resolveEligibleBaseStrategy(
  db: Database.Database,
  input: {
    config: VNextLocalOperatorPilotConfigV01;
    packet: PreparedStrategicSourceV01["packet"];
  },
): StrategicAdvantageTransferBaseStrategyV01 {
  const projections = listVNextSemanticStateEntriesV01(db, {
    workspace_id: input.config.workspace_id,
    project_id: input.config.project_id,
  });
  const eligible: Array<{
    projection: VNextSemanticStateProjectionEntryV01;
    state: VNextPersistedSemanticStateVersionV01;
  }> = [];
  for (const entry of input.packet.selected_context) {
    if (
      entry.entry_kind !== "accepted_state_ref" ||
      !entry.external_ref ||
      !entry.source_ref ||
      entry.currentness.status !== "fresh"
    ) {
      continue;
    }
    const projection = projections.find(
      (candidate) =>
        candidate.state_fingerprint === entry.source_ref &&
        canonicalizeProtocolValueV01(candidate.state_ref) ===
          canonicalizeProtocolValueV01(entry.external_ref),
    );
    if (!projection) continue;
    const stateRecord = readVNextCoreRecordV01(db, {
      record_kind: "semantic_state",
      record_id: projection.state_ref.external_id,
      workspace_id: input.config.workspace_id,
      project_id: input.config.project_id,
    });
    if (!stateRecord) {
      throw strategicError("strategic_advantage_transfer_base_strategy_missing", 409);
    }
    const state = rebuildVNextPersistedSemanticStateV01(stateRecord.payload);
    assertVNextCoreRecordMatchesProtocolPayloadBindingV01(stateRecord, {
      workspace_id: state.workspace_id,
      project_id: state.project_id,
      fingerprint: state.integrity.fingerprint,
    });
    const head = readVNextSemanticTargetHeadV01(db, {
      workspace_id: input.config.workspace_id,
      project_id: input.config.project_id,
      target_key: projection.target_key,
    });
    if (
      stateRecord.record_id !== state.semantic_state_record_id ||
      stateRecord.created_at !== state.created_at ||
      state.state_content.delta_type !== "agent_plan_delta" ||
      state.target_key !== projection.target_key ||
      state.state_content_fingerprint !== projection.state_fingerprint ||
      canonicalizeProtocolValueV01(state.state_ref) !==
        canonicalizeProtocolValueV01(projection.state_ref) ||
      !head ||
      head.presence !== "present" ||
      head.revision !== projection.revision ||
      head.current_state_fingerprint !== projection.state_fingerprint ||
      head.source_transition_receipt_id !==
        projection.source_transition_receipt_id ||
      head.source_transition_receipt_fingerprint !==
        projection.source_transition_receipt_fingerprint
    ) {
      if (state.state_content.delta_type === "agent_plan_delta") {
        throw strategicError("strategic_advantage_transfer_base_strategy_stale", 409);
      }
      continue;
    }
    let transition: ReturnType<
      typeof loadValidatedVNextSemanticTransitionRelationV01
    >;
    try {
      transition = loadValidatedVNextSemanticTransitionRelationV01(db, {
        workspace_id: input.config.workspace_id,
        project_id: input.config.project_id,
        transition_receipt_id: projection.source_transition_receipt_id,
        transition_receipt_fingerprint:
          projection.source_transition_receipt_fingerprint,
      });
    } catch {
      throw strategicError(
        "strategic_advantage_transfer_base_strategy_lineage_conflict",
        409,
      );
    }
    const matchingEffect = transition.receipt.effects.find(
      (effect) =>
        effect.after_state.presence === "present" &&
        effect.after_state.state_fingerprint ===
          state.state_content_fingerprint &&
        effect.durable_record_ref.external_id ===
          state.semantic_state_record_id,
    );
    if (
      transition.proposal.proposal_id !== state.source_proposal_id ||
      transition.proposal.integrity.fingerprint !==
        state.source_proposal_fingerprint ||
      transition.decision.decision_id !== state.source_decision_id ||
      transition.decision.integrity.fingerprint !==
        state.source_decision_fingerprint ||
      transition.receipt.source_candidate.candidate_id !==
        state.source_candidate_id ||
      transition.receipt.source_candidate.candidate_fingerprint !==
        state.source_candidate_fingerprint ||
      !matchingEffect
    ) {
      throw strategicError(
        "strategic_advantage_transfer_base_strategy_lineage_conflict",
        409,
      );
    }
    eligible.push({ projection, state });
  }
  const { projection, state } = selectUniqueStrategicBaseV01(eligible);
  const transitionRef: ExternalRefV01 = {
    ref_version: "external_ref.v0.1",
    ref_type: "state_transition_receipt",
    external_id: projection.source_transition_receipt_id,
    trust_class: "direct_local_observation",
    observed_at: projection.updated_at,
    source_ref: projection.source_transition_receipt_fingerprint,
  };
  const sourceRefs = uniqueProtocolValuesV01([
    normalizeExternalRefPrimitiveV01(state.state_ref),
    normalizeExternalRefPrimitiveV01(state.target_ref),
    normalizeExternalRefPrimitiveV01(transitionRef),
  ]).sort(compareExternalRefsV01);
  const withoutFingerprint = {
    basis: "packet_selected_accepted_semantic_state" as const,
    delta_type: "agent_plan_delta" as const,
    semantic_state_record_id: state.semantic_state_record_id,
    semantic_state_record_fingerprint: state.integrity.fingerprint,
    state_content_fingerprint: state.state_content_fingerprint,
    state_ref: normalizeExternalRefPrimitiveV01(state.state_ref),
    target_ref: normalizeExternalRefPrimitiveV01(state.target_ref),
    target_key: state.target_key,
    revision: projection.revision,
    bounded_summary: state.bounded_state_summary,
    source_proposal_id: state.source_proposal_id,
    source_proposal_fingerprint: state.source_proposal_fingerprint,
    source_candidate_id: state.source_candidate_id,
    source_candidate_fingerprint: state.source_candidate_fingerprint,
    source_decision_id: state.source_decision_id,
    source_decision_fingerprint: state.source_decision_fingerprint,
    source_transition_receipt_id: projection.source_transition_receipt_id,
    source_transition_receipt_fingerprint:
      projection.source_transition_receipt_fingerprint,
    currentness: "fresh" as const,
    source_refs: sourceRefs,
  };
  return {
    ...withoutFingerprint,
    base_fingerprint: createProtocolSha256V01(
      canonicalizeProtocolValueV01(withoutFingerprint),
    ),
  };
}

export function selectUniqueStrategicBaseV01<T>(
  eligible: readonly T[],
): T {
  if (eligible.length === 0) {
    throw strategicError("base_strategy_missing", 409);
  }
  if (eligible.length > 1) {
    throw strategicError("base_strategy_ambiguous", 409);
  }
  return eligible[0]!;
}

function buildWorkingFrame(input: {
  proposal: EpisodeDeltaProposalV01;
  packet: PreparedStrategicSourceV01["packet"];
  receipt: PreparedStrategicSourceV01["receipt"];
  assessment: PreparedStrategicSourceV01["assessment"];
  base: StrategicAdvantageTransferBaseStrategyV01;
}): StrategicAdvantageTransferWorkingFrameV01 {
  // R6-A projects task-wide trust into every criterion item. Summing those
  // projections would multiply the exact receipt counts by criterion count.
  const trust = {
    direct_local_observation: input.receipt.trust_summary.direct_observations,
    verified_external_observation:
      input.receipt.trust_summary.verified_external_observations,
    host_attestation: input.receipt.trust_summary.host_attestations,
    provider_report: input.receipt.trust_summary.provider_reports,
    user_declaration: input.receipt.trust_summary.user_declarations,
    imported_unverified:
      input.receipt.trust_summary.imported_unverified_items,
    derived_interpretation:
      input.receipt.trust_summary.derived_interpretations,
  };
  const withoutFingerprint = {
    frame_version:
      STRATEGIC_ADVANTAGE_TRANSFER_WORKING_FRAME_VERSION_V01,
    workspace_id: input.packet.workspace_id,
    project_id: input.packet.project_id,
    packet_ref: packetRefV01(input.packet),
    receipt_ref: receiptRefV01(input.receipt),
    assessment_version: input.assessment.assessment_version,
    assessment_fingerprint: input.assessment.assessment_fingerprint,
    source_proposal: sourceProposalBinding(input.proposal),
    data_classification: input.packet.constraints.data_classification,
    task_goal: input.packet.task.goal,
    success_criteria: input.assessment.criteria.map((criterion) => ({
      criterion_id: criterion.criterion_id,
      criterion: criterion.criterion,
      status: criterion.status,
      basis: criterion.basis,
      uncertainty: [...criterion.uncertainty],
    })),
    required_checks: [...input.packet.constraints.required_checks],
    forbidden_actions: [...input.packet.constraints.forbidden_actions],
    expected_artifacts: [...input.packet.return_contract.expected_artifacts],
    required_return_fields: [
      ...input.packet.return_contract.required_fields,
    ],
    selected_accepted_state_refs: uniqueProtocolValuesV01(
      input.packet.selected_context
        .filter(
          (entry) =>
            entry.entry_kind === "accepted_state_ref" && entry.external_ref,
        )
        .map((entry) =>
          normalizeExternalRefPrimitiveV01(entry.external_ref!),
        ),
    ).sort(compareExternalRefsV01),
    excluded_context_summaries: uniqueProtocolStringsV01(
      input.packet.excluded_context.map(
        (entry) => entry.why_excluded,
      ),
    ),
    gap_summaries: uniqueProtocolStringsV01(
      [
        ...input.packet.gaps.map((gap) => `${gap.code}: ${gap.summary}`),
        "criterion_relation_gap: current TaskContextPacket and RunReceipt contracts establish no criterion-to-residue relation; current unknown/insufficient assessment is preserved.",
      ],
    ),
    base_strategy: structuredClone(input.base),
    trust_summary: trust,
    coverage_summary: uniqueProtocolStringsV01(
      input.receipt.capability_coverage.map(
        (entry) =>
          `${entry.capability}: ${entry.coverage_level}${
            entry.notes.length ? ` (${entry.notes.join("; ")})` : ""
          }`,
      ),
    ),
    authority: {
      authoritative: false as const,
      creates_decision: false as const,
      applies_transition: false as const,
      changes_semantic_state: false as const,
      changes_later_context: false as const,
    },
  };
  assertStrategicAdvantageTransferSourceTextSafeV01(
    withoutFingerprint,
    "$working_frame",
  );
  return {
    ...withoutFingerprint,
    working_frame_fingerprint:
      createStrategicWorkingFrameFingerprintV01(withoutFingerprint),
  };
}

function buildSourceCatalog(input: {
  proposal: EpisodeDeltaProposalV01;
  packet: PreparedStrategicSourceV01["packet"];
  receipt: PreparedStrategicSourceV01["receipt"];
  assessment: PreparedStrategicSourceV01["assessment"];
  base: StrategicAdvantageTransferBaseStrategyV01;
}): StrategicAdvantageTransferSourceCatalogV01 {
  const items: StrategicAdvantageTransferSourceCatalogEntryV01[] = [];
  const add = (
    ref: ExternalRefV01,
    materialKind: string,
    summary: string,
    materialTrustClass?: ExternalRefTrustClassV01,
  ) => {
    const normalizedRef = normalizeExternalRefPrimitiveV01(ref);
    const boundedSummary = boundedCatalogText(summary);
    items.push({
      source_key: createStrategicSourceKeyV01({
        ref: normalizedRef,
        material_kind: materialKind,
        bounded_summary: boundedSummary,
      }),
      ref: normalizedRef,
      material_kind: materialKind,
      // Material-lane trust remains distinct from the exact lineage ref's
      // provenance. An inference anchored by a local ref is still derived.
      trust_class: materialTrustClass ?? normalizedRef.trust_class,
      reference_trust_class: normalizedRef.trust_class,
      bounded_summary: boundedSummary,
      source_fingerprint:
        normalizedRef.source_ref?.startsWith("sha256:")
          ? normalizedRef.source_ref
          : null,
    });
  };
  add(
    input.base.state_ref,
    "accepted_agent_plan_base",
    input.base.bounded_summary,
  );
  add(
    packetRefV01(input.packet),
    "task_context_packet",
    `Exact bounded context packet for task: ${input.packet.task.goal}`,
  );
  add(
    receiptRefV01(input.receipt),
    "persisted_run_receipt",
    "Exact immutable RunReceipt exists; execution completion does not establish task or strategic success.",
  );
  add(
    {
      ref_version: "external_ref.v0.1",
      ref_type: "criterion_assessment",
      external_id: input.assessment.assessment_fingerprint,
      trust_class: "derived_interpretation",
      observed_at: input.receipt.recorded_at,
      source_ref: input.assessment.assessment_fingerprint,
      compatibility_namespace:
        "augnes.vnext.strategic-advantage-transfer.v0.1",
    },
    `criterion_assessment:${
      input.assessment.summary.unknown > 0 ? "unknown" : "resolved"
    }`,
    `Exact ${input.assessment.assessment_version} assessment: ${input.assessment.summary.satisfied} satisfied, ${input.assessment.summary.unsatisfied} unsatisfied, ${input.assessment.summary.unknown} unknown, ${input.assessment.summary.not_applicable} not applicable.`,
  );
  for (const criterion of input.assessment.criteria) {
    add(
      {
        ref_version: "external_ref.v0.1",
        ref_type: "criterion_assessment_item",
        external_id: criterion.criterion_id,
        trust_class: "derived_interpretation",
        observed_at: input.receipt.recorded_at,
        source_ref: input.assessment.assessment_fingerprint,
        compatibility_namespace:
          "augnes.vnext.strategic-advantage-transfer.v0.1",
      },
      `criterion_assessment_item:${criterion.status}:${criterion.basis}`,
      `${criterion.criterion}: status ${criterion.status}, basis ${criterion.basis}; ${criterion.uncertainty.join("; ")}`,
    );
  }
  add(
    {
      ref_version: "external_ref.v0.1",
      ref_type: "episode_delta_proposal",
      external_id: input.proposal.proposal_id,
      trust_class: "direct_local_observation",
      observed_at: input.proposal.created_at,
      source_ref: input.proposal.integrity.fingerprint,
      compatibility_namespace:
        "augnes.vnext.strategic-advantage-transfer.v0.1",
    },
    "source_episode_delta_proposal",
    input.proposal.bounded_summary,
  );
  for (const observation of input.proposal.observations) {
    for (const ref of observation.source_refs) {
      add(
        ref,
        `source_observation:${observation.material_kind}`,
        observation.bounded_summary,
        observation.trust_class,
      );
    }
  }
  for (const attestation of input.proposal.attestations) {
    for (const ref of attestation.source_refs) {
      add(
        ref,
        `source_attestation:${attestation.material_kind}`,
        attestation.bounded_summary,
        attestation.trust_class,
      );
    }
  }
  for (const inference of input.proposal.inferences) {
    for (const ref of inference.source_refs) {
      add(
        ref,
        `source_inference:${inference.material_kind}`,
        inference.bounded_summary,
        inference.trust_class,
      );
    }
  }
  for (const conflict of input.proposal.conflicts) {
    for (const ref of conflict.source_refs) {
      add(
        ref,
        "source_conflict",
        conflict.bounded_summary,
        "derived_interpretation",
      );
    }
  }
  for (const missing of input.proposal.missing_information) {
    for (const ref of missing.source_refs) {
      add(
        ref,
        `source_missing:${missing.code}`,
        missing.bounded_summary,
        "derived_interpretation",
      );
    }
  }
  for (const uncertainty of input.proposal.uncertainties) {
    for (const ref of uncertainty.source_refs) {
      add(
        ref,
        "source_uncertainty",
        uncertainty.bounded_summary,
        "derived_interpretation",
      );
    }
  }
  for (const observation of input.receipt.observations) {
    for (const ref of observation.source_refs) {
      add(
        ref,
        `receipt_observation:${observation.observation_kind}`,
        observation.summary,
        observation.trust_class,
      );
    }
  }
  for (const attestation of input.receipt.attestations) {
    for (const ref of attestation.source_refs) {
      add(
        ref,
        `receipt_attestation:${attestation.attestation_kind}`,
        attestation.summary,
        attestation.trust_class,
      );
    }
  }
  for (const check of input.receipt.checks) {
    for (const ref of check.source_refs) {
      add(ref, `check_${check.status}`, check.summary);
    }
  }
  for (const check of input.receipt.skipped_checks) {
    for (const ref of check.source_refs) {
      add(ref, "skipped_check", `${check.check_id}: ${check.reason}`);
    }
  }
  for (const issue of [
    ...input.receipt.blockers,
    ...input.receipt.warnings,
    ...input.receipt.gaps,
  ]) {
    for (const ref of issue.source_refs) {
      add(ref, `receipt_gap:${issue.code}`, issue.summary);
    }
  }
  for (const coverage of input.receipt.capability_coverage) {
    if (coverage.source_ref) {
      add(
        coverage.source_ref,
        `coverage_${coverage.coverage_level}`,
        `${coverage.capability}: ${coverage.notes.join("; ") || coverage.coverage_level}`,
      );
    }
  }
  const normalized = uniqueProtocolValuesV01(items).sort(
    compareProtocolCanonicalV01,
  );
  if (normalized.length > 64) {
    throw strategicError(
      "strategic_advantage_transfer_source_catalog_bound_exceeded",
      422,
    );
  }
  const withoutFingerprint = {
    catalog_version:
      STRATEGIC_ADVANTAGE_TRANSFER_SOURCE_CATALOG_VERSION_V01,
    workspace_id: input.packet.workspace_id,
    project_id: input.packet.project_id,
    items: normalized,
  };
  assertStrategicAdvantageTransferSourceTextSafeV01(
    withoutFingerprint,
    "$source_catalog",
  );
  return {
    ...withoutFingerprint,
    source_catalog_fingerprint:
      createStrategicSourceCatalogFingerprintV01(withoutFingerprint),
  };
}

function buildModelInput(
  frame: StrategicAdvantageTransferWorkingFrameV01,
  catalog: StrategicAdvantageTransferSourceCatalogV01,
  budget: ReturnType<typeof createStrategicAdvantageTransferBudgetV01>,
): StrategicAdvantageTransferModelInputV01 {
  return {
    input_kind: STRATEGIC_ADVANTAGE_TRANSFER_MODEL_GATEWAY_PURPOSE_V01,
    profile_version: STRATEGIC_ADVANTAGE_TRANSFER_PROFILE_VERSION_V01,
    schema_version: STRATEGIC_ADVANTAGE_TRANSFER_MODEL_SCHEMA_VERSION_V01,
    working_frame: {
      working_frame_fingerprint: frame.working_frame_fingerprint,
      data_classification: frame.data_classification,
      task_goal: frame.task_goal,
      success_criteria: structuredClone(frame.success_criteria),
      required_checks: [...frame.required_checks],
      forbidden_actions: [...frame.forbidden_actions],
      expected_artifacts: [...frame.expected_artifacts],
      required_return_fields: [...frame.required_return_fields],
      base_strategy_summary: frame.base_strategy.bounded_summary,
      excluded_context_summaries: [...frame.excluded_context_summaries],
      gap_summaries: [...frame.gap_summaries],
    },
    source_catalog: {
      source_catalog_fingerprint: catalog.source_catalog_fingerprint,
      items: catalog.items.map((item) => ({
        source_key: item.source_key,
        material_kind: item.material_kind,
        trust_class: item.trust_class,
        bounded_summary: item.bounded_summary,
      })),
    },
    lenses: [...STRATEGIC_ADVANTAGE_TRANSFER_LENSES_V01],
    budget: structuredClone(budget),
  };
}

function strategicInvocationProvenanceV01(
  prepared: PreparedStrategicSourceV01,
): string[] {
  return uniqueProtocolStringsV01([
    prepared.packet.integrity.fingerprint,
    prepared.receipt.integrity.fingerprint,
    prepared.assessment.assessment_fingerprint,
    prepared.base_strategy.base_fingerprint,
    prepared.working_frame.working_frame_fingerprint,
    prepared.source_catalog.source_catalog_fingerprint,
    prepared.source_proposal.integrity.fingerprint,
  ]);
}

type StrategicSettlementReadV01 =
  | { status: "none" }
  | { status: "in_progress" }
  | {
      status: "model_completed";
      model_result: StrategicCompletedModelResultV01;
    }
  | {
      status: "failed";
      failure_status: StrategicFailureStatusV01;
      error_code: string;
      retryable: boolean;
      model_result: StrategicCompletedModelResultV01 | null;
      attempt_receipt: ModelInvocationReceiptV02 | null;
    }
  | {
      status: "available";
      proposal_id: string;
      proposal_fingerprint: string;
    };

function readStrategicSettlementV01(
  db: Database.Database,
  prepared: PreparedStrategicSourceV01,
): StrategicSettlementReadV01 {
  const run = readBoundStrategicRunV01(db, prepared);
  const status = run.metadata.strategic_advantage_transfer_status;
  const analysisIdentity =
    run.metadata.strategic_advantage_transfer_analysis_identity;
  if (status === undefined && analysisIdentity === undefined) {
    if (
      STRATEGIC_SETTLEMENT_METADATA_KEYS_V01.some(
        (key) =>
          run.metadata[key] !== undefined && run.metadata[key] !== null,
      )
    ) {
      throw strategicError(
        "strategic_advantage_transfer_settlement_conflict",
        409,
      );
    }
    return { status: "none" };
  }
  if (
    analysisIdentity !== prepared.identity.analysis_identity ||
    run.metadata.strategic_advantage_transfer_settlement_version !==
      VNEXT_OPERATOR_STRATEGIC_SETTLEMENT_VERSION_V01 ||
    !["in_progress", "model_completed", "failed", "available"].includes(
      String(status),
    )
  ) {
    throw strategicError(
      "strategic_advantage_transfer_settlement_conflict",
      409,
    );
  }
  const modelResult = readPersistedStrategicModelResultV01(
    prepared,
    run.metadata,
  );
  const attemptReceipt = readPersistedStrategicAttemptReceiptV01(
    prepared,
    run.metadata,
  );
  const attemptReceiptStatus =
    run.metadata.strategic_advantage_transfer_model_attempt_receipt_status;
  if (status === "in_progress") {
    if (
      modelResult ||
      attemptReceipt ||
      !isNullishSettlementValueV01(attemptReceiptStatus) ||
      !isNullishSettlementValueV01(
        run.metadata.strategic_advantage_transfer_proposal_id,
      ) ||
      !isNullishSettlementValueV01(
        run.metadata.strategic_advantage_transfer_proposal_fingerprint,
      ) ||
      !isNullishSettlementValueV01(
        run.metadata.strategic_advantage_transfer_error_code,
      ) ||
      !isNullishSettlementValueV01(
        run.metadata.strategic_advantage_transfer_failure_status,
      ) ||
      run.metadata.strategic_advantage_transfer_retry_required !== false ||
      !isNullishSettlementValueV01(
        run.metadata
          .strategic_advantage_transfer_model_invocation_receipt_fingerprint,
      ) ||
      !isNullishSettlementValueV01(
        run.metadata.strategic_advantage_transfer_normalized_output_fingerprint,
      )
    ) {
      throw strategicError(
        "strategic_advantage_transfer_settlement_conflict",
        409,
      );
    }
    return { status };
  }
  if (status === "model_completed") {
    if (
      !modelResult ||
      attemptReceipt ||
      !isNullishSettlementValueV01(attemptReceiptStatus) ||
      !isNullishSettlementValueV01(
        run.metadata.strategic_advantage_transfer_proposal_id,
      ) ||
      !isNullishSettlementValueV01(
        run.metadata.strategic_advantage_transfer_proposal_fingerprint,
      ) ||
      !isNullishSettlementValueV01(
        run.metadata.strategic_advantage_transfer_error_code,
      ) ||
      !isNullishSettlementValueV01(
        run.metadata.strategic_advantage_transfer_failure_status,
      ) ||
      run.metadata.strategic_advantage_transfer_retry_required !== false
    ) {
      throw strategicError(
        "strategic_advantage_transfer_settlement_conflict",
        409,
      );
    }
    return { status, model_result: modelResult };
  }
  if (status === "failed") {
    const errorCode =
      run.metadata.strategic_advantage_transfer_error_code;
    const failureStatus =
      run.metadata.strategic_advantage_transfer_failure_status;
    const retryable =
      run.metadata.strategic_advantage_transfer_retry_required;
    if (
      typeof errorCode !== "string" ||
      errorCode.length === 0 ||
      !isStrategicFailureStatusV01(failureStatus) ||
      typeof retryable !== "boolean" ||
      (errorCode.startsWith("model_gateway_") &&
        failureStatus !== classifyStrategicFailureStatusV01(errorCode)) ||
      (retryable && failureStatus !== "proposal_admission_failed") ||
      (retryable &&
        modelResult === null &&
        errorCode !==
          "strategic_advantage_transfer_concurrency_bound_exceeded") ||
      (retryable &&
        modelResult !== null &&
        !isRetryableStrategicStorageFailureV01(errorCode)) ||
      (attemptReceiptStatus !== "persisted" &&
        attemptReceiptStatus !== "unavailable_before_receipt") ||
      (attemptReceiptStatus === "persisted" && !attemptReceipt) ||
      (attemptReceiptStatus === "unavailable_before_receipt" &&
        attemptReceipt) ||
      (attemptReceipt !== null && retryable) ||
      (attemptReceipt !== null && modelResult !== null) ||
      !isNullishSettlementValueV01(
        run.metadata.strategic_advantage_transfer_proposal_id,
      ) ||
      !isNullishSettlementValueV01(
        run.metadata.strategic_advantage_transfer_proposal_fingerprint,
      ) ||
      (!modelResult &&
        (!isNullishSettlementValueV01(
          run.metadata
            .strategic_advantage_transfer_model_invocation_receipt_fingerprint,
        ) ||
          !isNullishSettlementValueV01(
            run.metadata
              .strategic_advantage_transfer_normalized_output_fingerprint,
          ))) ||
      (attemptReceipt !== null &&
        ((attemptReceipt.status === "completed" &&
          errorCode.startsWith("model_gateway_")) ||
          (attemptReceipt.status !== "completed" &&
            attemptReceipt.failure_code !== errorCode)))
    ) {
      throw strategicError(
        "strategic_advantage_transfer_settlement_conflict",
        409,
      );
    }
    return {
      status,
      failure_status: failureStatus,
      error_code: errorCode,
      retryable,
      model_result: modelResult,
      attempt_receipt: attemptReceipt,
    };
  }
  if (
    modelResult ||
    attemptReceipt ||
    !isNullishSettlementValueV01(attemptReceiptStatus)
  ) {
    throw strategicError(
      "strategic_advantage_transfer_settlement_conflict",
      409,
    );
  }
  const proposalId = run.metadata.strategic_advantage_transfer_proposal_id;
  const proposalFingerprint =
    run.metadata.strategic_advantage_transfer_proposal_fingerprint;
  const receiptFingerprint =
    run.metadata.strategic_advantage_transfer_model_invocation_receipt_fingerprint;
  const outputFingerprint =
    run.metadata.strategic_advantage_transfer_normalized_output_fingerprint;
  if (
    typeof proposalId !== "string" ||
    typeof proposalFingerprint !== "string" ||
    typeof receiptFingerprint !== "string" ||
    typeof outputFingerprint !== "string" ||
    !isNullishSettlementValueV01(
      run.metadata.strategic_advantage_transfer_error_code,
    ) ||
    !isNullishSettlementValueV01(
      run.metadata.strategic_advantage_transfer_failure_status,
    ) ||
    run.metadata.strategic_advantage_transfer_retry_required !== false
  ) {
    throw strategicError(
      "strategic_advantage_transfer_settlement_conflict",
      409,
    );
  }
  return {
    status: "available",
    proposal_id: proposalId,
    proposal_fingerprint: proposalFingerprint,
  };
}

const STRATEGIC_SETTLEMENT_METADATA_KEYS_V01 = [
  "strategic_advantage_transfer_settlement_version",
  "strategic_advantage_transfer_proposal_id",
  "strategic_advantage_transfer_proposal_fingerprint",
  "strategic_advantage_transfer_error_code",
  "strategic_advantage_transfer_failure_status",
  "strategic_advantage_transfer_retry_required",
  "strategic_advantage_transfer_model_invocation_receipt_fingerprint",
  "strategic_advantage_transfer_normalized_output_fingerprint",
  "strategic_advantage_transfer_normalized_model_output",
  "strategic_advantage_transfer_model_invocation_receipt",
  "strategic_advantage_transfer_model_attempt_receipt",
  "strategic_advantage_transfer_model_attempt_receipt_fingerprint",
  "strategic_advantage_transfer_model_attempt_receipt_status",
] as const;

function isNullishSettlementValueV01(value: unknown): boolean {
  return value === undefined || value === null;
}

function claimStrategicAnalysisV01(
  db: Database.Database,
  input: Parameters<
    typeof requestVNextOperatorStrategicAdvantageTransferV01
  >[1],
  prepared: PreparedStrategicSourceV01,
):
  | {
      status: "claimed" | "joined_in_flight";
      admission: VNextLocalOperatorSessionMutationAdmissionV01;
    }
  | {
      status: "replay_model_result";
      model_result: StrategicCompletedModelResultV01;
      admission: VNextLocalOperatorSessionMutationAdmissionV01;
    }
  | {
      status: "blocked";
      failure_status: StrategicFailureStatusV01;
      error_code: string;
      admission: VNextLocalOperatorSessionMutationAdmissionV01;
    } {
  if (db.inTransaction) {
    throw strategicError("strategic_advantage_transfer_nested_transaction", 409);
  }
  db.exec("BEGIN IMMEDIATE");
  try {
    const admission = admitVNextLocalOperatorMutationInsideTransactionV01(db, {
      config: input.config,
      credential: input.credential,
      clock: input.clock,
      secret_source: input.secret_source,
    });
    const prior = readStrategicSettlementV01(db, prepared);
    if (prior.status === "in_progress") {
      const joined = strategicAnalysesInFlightV01.has(
        prepared.identity.analysis_identity,
      );
      db.exec("COMMIT");
      return joined
        ? { status: "joined_in_flight", admission }
        : {
            status: "blocked",
            failure_status: "proposal_admission_failed",
            error_code: "strategic_advantage_transfer_in_progress",
            admission,
          };
    }
    if (prior.status === "available") {
      db.exec("COMMIT");
      return {
        status: "blocked",
        failure_status: "proposal_admission_failed",
        error_code:
          "strategic_advantage_transfer_available_proposal_missing",
        admission,
      };
    }
    if (prior.status === "failed" && !prior.retryable) {
      db.exec("COMMIT");
      return {
        status: "blocked",
        failure_status: prior.failure_status,
        error_code: prior.error_code,
        admission,
      };
    }
    const replayResult =
      prior.status === "model_completed"
        ? prior.model_result
        : prior.status === "failed"
          ? prior.model_result
          : null;
    if (replayResult) {
      db.exec("COMMIT");
      return {
        status: "replay_model_result",
        model_result: replayResult,
        admission,
      };
    }
    const run = readBoundStrategicRunV01(db, prepared);
    updateAutonomyRunLedgerFields(
      run.run_id,
      {
        metadata: {
          ...run.metadata,
          strategic_advantage_transfer_status: "in_progress",
          strategic_advantage_transfer_analysis_identity:
            prepared.identity.analysis_identity,
          strategic_advantage_transfer_proposal_id: null,
          strategic_advantage_transfer_proposal_fingerprint: null,
          strategic_advantage_transfer_error_code: null,
          strategic_advantage_transfer_failure_status: null,
          strategic_advantage_transfer_retry_required: false,
          strategic_advantage_transfer_model_invocation_receipt_fingerprint:
            null,
          strategic_advantage_transfer_normalized_output_fingerprint: null,
          strategic_advantage_transfer_normalized_model_output: null,
          strategic_advantage_transfer_model_invocation_receipt: null,
          strategic_advantage_transfer_model_attempt_receipt: null,
          strategic_advantage_transfer_model_attempt_receipt_fingerprint: null,
          strategic_advantage_transfer_model_attempt_receipt_status: null,
          strategic_advantage_transfer_settlement_version:
            VNEXT_OPERATOR_STRATEGIC_SETTLEMENT_VERSION_V01,
        },
      },
      { db },
    );
    db.exec("COMMIT");
    return { status: "claimed", admission };
  } catch (error) {
    if (db.inTransaction) db.exec("ROLLBACK");
    throw error;
  }
}

function recordStrategicModelResultV01(
  db: Database.Database,
  prepared: PreparedStrategicSourceV01,
  input: Pick<
    Awaited<
      ReturnType<typeof invokeStrategicAdvantageTransferModelGatewayV01>
    >,
    "output" | "model_invocation_receipt"
  >,
): StrategicCompletedModelResultV01 {
  const normalized = normalizeCompletedStrategicModelResultV01(
    prepared,
    input.output,
    input.model_invocation_receipt,
  );
  if (db.inTransaction) {
    throw strategicError("strategic_advantage_transfer_nested_transaction", 409);
  }
  db.exec("BEGIN IMMEDIATE");
  try {
    const run = readBoundStrategicRunV01(db, prepared);
    const prior = readStrategicSettlementV01(db, prepared);
    if (prior.status === "available") {
      const proposal = readVerifiedStrategicProposalByIdentityV01(
        db,
        prepared.identity,
      )?.proposal;
      const profile = proposal?.strategic_advantage_transfer;
      if (
        !profile ||
        canonicalizeProtocolValueV01(profile.normalized_model_output) !==
          canonicalizeProtocolValueV01(normalized.output) ||
        canonicalizeProtocolValueV01(profile.model_invocation.receipt) !==
          canonicalizeProtocolValueV01(
            normalized.model_invocation_receipt,
          )
      ) {
        throw strategicError(
          "strategic_advantage_transfer_settlement_conflict",
          409,
        );
      }
      db.exec("COMMIT");
      return normalized;
    }
    const priorResult =
      prior.status === "model_completed"
        ? prior.model_result
        : prior.status === "failed"
          ? prior.model_result
          : null;
    if (
      priorResult &&
      canonicalizeProtocolValueV01(priorResult) !==
        canonicalizeProtocolValueV01(normalized)
    ) {
      throw strategicError(
        "strategic_advantage_transfer_settlement_conflict",
        409,
      );
    }
    if (
      prior.status !== "in_progress" &&
      prior.status !== "model_completed" &&
      !(prior.status === "failed" && prior.model_result)
    ) {
      throw strategicError(
        "strategic_advantage_transfer_settlement_conflict",
        409,
      );
    }
    updateAutonomyRunLedgerFields(
      run.run_id,
      {
        metadata: {
          ...run.metadata,
          strategic_advantage_transfer_status: "model_completed",
          strategic_advantage_transfer_analysis_identity:
            prepared.identity.analysis_identity,
          strategic_advantage_transfer_proposal_id: null,
          strategic_advantage_transfer_proposal_fingerprint: null,
          strategic_advantage_transfer_error_code: null,
          strategic_advantage_transfer_failure_status: null,
          strategic_advantage_transfer_retry_required: false,
          strategic_advantage_transfer_model_invocation_receipt_fingerprint:
            normalized.receipt_fingerprint,
          strategic_advantage_transfer_normalized_output_fingerprint:
            normalized.normalized_output_fingerprint,
          strategic_advantage_transfer_normalized_model_output:
            normalized.output,
          strategic_advantage_transfer_model_invocation_receipt:
            normalized.model_invocation_receipt,
          strategic_advantage_transfer_model_attempt_receipt: null,
          strategic_advantage_transfer_model_attempt_receipt_fingerprint: null,
          strategic_advantage_transfer_model_attempt_receipt_status: null,
          strategic_advantage_transfer_settlement_version:
            VNEXT_OPERATOR_STRATEGIC_SETTLEMENT_VERSION_V01,
        },
      },
      { db },
    );
    db.exec("COMMIT");
    return normalized;
  } catch (error) {
    if (db.inTransaction) db.exec("ROLLBACK");
    throw error;
  }
}

function recordStrategicAvailableInsideTransactionV01(
  db: Database.Database,
  prepared: PreparedStrategicSourceV01,
  proposal: EpisodeDeltaProposalV01,
): void {
  if (!db.inTransaction) {
    throw strategicError(
      "strategic_advantage_transfer_settlement_transaction_required",
      500,
    );
  }
  const run = readBoundStrategicRunV01(db, prepared);
  const profile = proposal.strategic_advantage_transfer;
  if (
    !profile ||
    profile.analysis_identity !== prepared.identity.analysis_identity
  ) {
    throw strategicError(
      "strategic_advantage_transfer_settlement_proposal_conflict",
      409,
    );
  }
  updateAutonomyRunLedgerFields(
    run.run_id,
    {
      metadata: {
        ...run.metadata,
        strategic_advantage_transfer_status: "available",
        strategic_advantage_transfer_analysis_identity:
          prepared.identity.analysis_identity,
        strategic_advantage_transfer_proposal_id: proposal.proposal_id,
        strategic_advantage_transfer_proposal_fingerprint:
          proposal.integrity.fingerprint,
        strategic_advantage_transfer_error_code: null,
        strategic_advantage_transfer_failure_status: null,
        strategic_advantage_transfer_retry_required: false,
        strategic_advantage_transfer_model_invocation_receipt_fingerprint:
          profile.model_invocation.receipt_fingerprint,
        strategic_advantage_transfer_normalized_output_fingerprint:
          profile.model_invocation.normalized_output_fingerprint,
        strategic_advantage_transfer_normalized_model_output: null,
        strategic_advantage_transfer_model_invocation_receipt: null,
        strategic_advantage_transfer_model_attempt_receipt: null,
        strategic_advantage_transfer_model_attempt_receipt_fingerprint: null,
        strategic_advantage_transfer_model_attempt_receipt_status: null,
        strategic_advantage_transfer_settlement_version:
          VNEXT_OPERATOR_STRATEGIC_SETTLEMENT_VERSION_V01,
      },
    },
    { db },
  );
}

function recordStrategicFailureWithoutMaskingV01(
  db: Database.Database,
  prepared: PreparedStrategicSourceV01,
  failureStatus: StrategicFailureStatusV01,
  errorCode: string,
  retryable: boolean,
  attemptReceiptInput: ModelInvocationReceiptV02 | null = null,
): void {
  try {
    if (db.inTransaction) db.exec("ROLLBACK");
    db.exec("BEGIN IMMEDIATE");
    const run = readBoundStrategicRunV01(db, prepared);
    const prior = readStrategicSettlementV01(db, prepared);
    if (prior.status === "available") {
      db.exec("COMMIT");
      return;
    }
    const priorResult =
      prior.status === "model_completed"
        ? prior.model_result
        : prior.status === "failed"
          ? prior.model_result
          : null;
    const priorAttempt =
      prior.status === "failed" ? prior.attempt_receipt : null;
    const attemptReceipt = attemptReceiptInput
      ? normalizeStrategicAttemptReceiptV01(
          prepared,
          attemptReceiptInput,
        )
      : priorAttempt;
    if (
      priorAttempt &&
      attemptReceipt &&
      canonicalizeProtocolValueV01(priorAttempt) !==
        canonicalizeProtocolValueV01(attemptReceipt)
    ) {
      throw strategicError(
        "strategic_advantage_transfer_attempt_receipt_conflict",
        409,
      );
    }
    if (
      attemptReceipt &&
      ((attemptReceipt.status === "completed" &&
        errorCode.startsWith("model_gateway_")) ||
        (attemptReceipt.status !== "completed" &&
          attemptReceipt.failure_code !== errorCode))
    ) {
      throw strategicError(
        "strategic_advantage_transfer_attempt_receipt_conflict",
        409,
      );
    }
    updateAutonomyRunLedgerFields(
      run.run_id,
      {
        metadata: {
          ...run.metadata,
          strategic_advantage_transfer_status: "failed",
          strategic_advantage_transfer_analysis_identity:
            prepared.identity.analysis_identity,
          strategic_advantage_transfer_proposal_id: null,
          strategic_advantage_transfer_proposal_fingerprint: null,
          strategic_advantage_transfer_error_code: errorCode,
          strategic_advantage_transfer_failure_status: failureStatus,
          strategic_advantage_transfer_retry_required: retryable,
          strategic_advantage_transfer_model_invocation_receipt_fingerprint:
            priorResult?.receipt_fingerprint ?? null,
          strategic_advantage_transfer_normalized_output_fingerprint:
            priorResult?.normalized_output_fingerprint ?? null,
          strategic_advantage_transfer_normalized_model_output:
            priorResult?.output ?? null,
          strategic_advantage_transfer_model_invocation_receipt:
            priorResult?.model_invocation_receipt ?? null,
          strategic_advantage_transfer_model_attempt_receipt:
            attemptReceipt,
          strategic_advantage_transfer_model_attempt_receipt_fingerprint:
            attemptReceipt
              ? createProtocolSha256V01(
                  canonicalizeProtocolValueV01(attemptReceipt),
                )
              : null,
          strategic_advantage_transfer_model_attempt_receipt_status:
            attemptReceipt ? "persisted" : "unavailable_before_receipt",
          strategic_advantage_transfer_settlement_version:
            VNEXT_OPERATOR_STRATEGIC_SETTLEMENT_VERSION_V01,
        },
      },
      { db },
    );
    db.exec("COMMIT");
  } catch {
    try {
      if (db.inTransaction) db.exec("ROLLBACK");
    } catch {
      // The original bounded analysis/admission result remains authoritative.
    }
  }
}

function readPersistedStrategicModelResultV01(
  prepared: PreparedStrategicSourceV01,
  metadata: Record<string, unknown>,
): StrategicCompletedModelResultV01 | null {
  const output = metadata.strategic_advantage_transfer_normalized_model_output;
  const receipt =
    metadata.strategic_advantage_transfer_model_invocation_receipt;
  if (
    (output === null || output === undefined) &&
    (receipt === null || receipt === undefined)
  ) {
    return null;
  }
  if (
    output === null ||
    output === undefined ||
    receipt === null ||
    receipt === undefined
  ) {
    throw strategicError(
      "strategic_advantage_transfer_settlement_conflict",
      409,
    );
  }
  let normalized: StrategicCompletedModelResultV01;
  try {
    normalized = normalizeCompletedStrategicModelResultV01(
      prepared,
      output,
      receipt,
    );
  } catch {
    throw strategicError(
      "strategic_advantage_transfer_settlement_conflict",
      409,
    );
  }
  if (
    metadata.strategic_advantage_transfer_normalized_output_fingerprint !==
      normalized.normalized_output_fingerprint ||
    metadata.strategic_advantage_transfer_model_invocation_receipt_fingerprint !==
      normalized.receipt_fingerprint
  ) {
    throw strategicError(
      "strategic_advantage_transfer_settlement_conflict",
      409,
    );
  }
  return normalized;
}

function readPersistedStrategicAttemptReceiptV01(
  prepared: PreparedStrategicSourceV01,
  metadata: Record<string, unknown>,
): ModelInvocationReceiptV02 | null {
  const receipt =
    metadata.strategic_advantage_transfer_model_attempt_receipt;
  const fingerprint =
    metadata.strategic_advantage_transfer_model_attempt_receipt_fingerprint;
  if (
    (receipt === null || receipt === undefined) &&
    (fingerprint === null || fingerprint === undefined)
  ) {
    return null;
  }
  if (
    receipt === null ||
    receipt === undefined ||
    typeof fingerprint !== "string"
  ) {
    throw strategicError(
      "strategic_advantage_transfer_settlement_conflict",
      409,
    );
  }
  let normalized: ModelInvocationReceiptV02;
  try {
    normalized = normalizeStrategicAttemptReceiptV01(
      prepared,
      receipt,
    );
  } catch {
    throw strategicError(
      "strategic_advantage_transfer_settlement_conflict",
      409,
    );
  }
  if (
    fingerprint !==
    createProtocolSha256V01(canonicalizeProtocolValueV01(normalized))
  ) {
    throw strategicError(
      "strategic_advantage_transfer_settlement_conflict",
      409,
    );
  }
  return normalized;
}

function normalizeStrategicAttemptReceiptV01(
  prepared: PreparedStrategicSourceV01,
  receipt: unknown,
): ModelInvocationReceiptV02 {
  const normalized = validateModelInvocationReceiptV02(receipt);
  const expectedBudget = prepared.budget.model;
  const expectedProvenance = strategicInvocationProvenanceV01(prepared);
  if (
    normalized.purpose !==
      STRATEGIC_ADVANTAGE_TRANSFER_MODEL_GATEWAY_PURPOSE_V01 ||
    normalized.invocation_id !==
      `strategic:${prepared.identity.analysis_identity.slice(7, 39)}` ||
    normalized.workspace_id !== prepared.source_proposal.workspace_id ||
    normalized.project_id !== prepared.source_proposal.project_id ||
    normalized.work_id !== null ||
    normalized.run_id !== null ||
    normalized.invocation_origin !== "interactive" ||
    normalized.requested_mode !== "live" ||
    normalized.execution_mode !== "live" ||
    normalized.data_classification !==
      prepared.packet.constraints.data_classification ||
    canonicalizeProtocolValueV01(normalized.provenance_refs) !==
      canonicalizeProtocolValueV01(expectedProvenance) ||
    normalized.budget.input_bytes_limit !== expectedBudget.max_input_bytes ||
    normalized.budget.output_tokens_limit !==
      expectedBudget.max_output_tokens ||
    normalized.budget.provider_call_limit !== 1 ||
    normalized.budget.timeout_limit_ms !== expectedBudget.timeout_ms ||
    expectedBudget.cost.status !== "available" ||
    canonicalizeProtocolValueV01(normalized.budget.cost_budget) !==
      canonicalizeProtocolValueV01(expectedBudget.cost.budget) ||
    (normalized.status === "completed" &&
      typeof normalized.normalized_output_fingerprint !== "string") ||
    (normalized.status !== "completed" && normalized.failure_code === null) ||
    (normalized.status !== "completed" &&
      normalized.normalized_output_fingerprint !== undefined &&
      normalized.normalized_output_fingerprint !== null)
  ) {
    throw strategicError(
      "strategic_advantage_transfer_attempt_receipt_conflict",
      409,
    );
  }
  return normalized;
}

function normalizeCompletedStrategicModelResultV01(
  prepared: PreparedStrategicSourceV01,
  output: unknown,
  receipt: unknown,
): StrategicCompletedModelResultV01 {
  const normalizedOutput = normalizeStrategicAdvantageTransferModelOutputV01(
    output,
    STRATEGIC_ADVANTAGE_TRANSFER_LENSES_V01,
  );
  const normalizedReceipt = validateModelInvocationReceiptV02(receipt);
  const material = materializeStrategicAdvantageTransferProposalV01({
    ...prepared,
    model_output: normalizedOutput,
    model_invocation_receipt: normalizedReceipt,
  });
  const profile = material.proposal.strategic_advantage_transfer;
  if (!profile) {
    throw strategicError(
      "strategic_advantage_transfer_settlement_conflict",
      409,
    );
  }
  return {
    output: profile.normalized_model_output,
    model_invocation_receipt: profile.model_invocation.receipt,
    normalized_output_fingerprint:
      profile.model_invocation.normalized_output_fingerprint,
    receipt_fingerprint: profile.model_invocation.receipt_fingerprint,
  };
}

function readBoundStrategicRunV01(
  db: Database.Database,
  prepared: PreparedStrategicSourceV01,
) {
  const run = readAutonomyRunLedgerRecord(prepared.run_id, { db });
  if (
    !run ||
    !isTerminalRunnerStatus(run.status) ||
    run.scope !== prepared.source_proposal.project_id ||
    run.metadata.workspace_id !== prepared.source_proposal.workspace_id ||
    run.metadata.project_id !== prepared.source_proposal.project_id ||
    run.metadata.run_receipt_id !== prepared.receipt.receipt_id ||
    run.metadata.run_receipt_fingerprint !==
      prepared.receipt.integrity.fingerprint
  ) {
    throw strategicError(
      "strategic_advantage_transfer_source_run_conflict",
      409,
    );
  }
  return run;
}

function consumeMutationNonce(
  db: Database.Database,
  input: Parameters<
    typeof requestVNextOperatorStrategicAdvantageTransferV01
  >[1],
): VNextLocalOperatorSessionMutationAdmissionV01 {
  if (db.inTransaction) {
    throw strategicError("strategic_advantage_transfer_nested_transaction", 409);
  }
  db.exec("BEGIN IMMEDIATE");
  try {
    const admission = admitVNextLocalOperatorMutationInsideTransactionV01(db, {
      config: input.config,
      credential: input.credential,
      clock: input.clock,
      secret_source: input.secret_source,
    });
    db.exec("COMMIT");
    return admission;
  } catch (error) {
    if (db.inTransaction) db.exec("ROLLBACK");
    throw error;
  }
}

function assertSourceProposalUnchanged(
  db: Database.Database,
  proposal: EpisodeDeltaProposalV01,
): void {
  const record = readVNextCoreRecordV01(db, {
    record_kind: "episode_delta_proposal",
    record_id: proposal.proposal_id,
    workspace_id: proposal.workspace_id,
    project_id: proposal.project_id,
  });
  if (
    !record ||
    canonicalizeProtocolValueV01(record.payload) !==
      canonicalizeProtocolValueV01(proposal)
  ) {
    throw strategicError("strategic_advantage_transfer_source_proposal_mutated", 409);
  }
}

function parseRequest(
  value: unknown,
): VNextOperatorStrategicAdvantageTransferRequestV01 {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw strategicError("strategic_advantage_transfer_body_invalid");
  }
  const record = value as Record<string, unknown>;
  const allowed = ["action", "proposal_id", "proposal_fingerprint"];
  if (
    Object.keys(record).length !== allowed.length ||
    Object.keys(record).some((key) => !allowed.includes(key)) ||
    record.action !== "request_strategic_advantage_transfer"
  ) {
    throw strategicError("strategic_advantage_transfer_body_unknown_field");
  }
  const proposalId = normalizeProtocolTextV01(record.proposal_id);
  const proposalFingerprint = normalizeProtocolTextV01(
    record.proposal_fingerprint,
  );
  if (
    !proposalId.startsWith("episode-delta-proposal:") ||
    !/^sha256:[a-f0-9]{64}$/u.test(proposalFingerprint)
  ) {
    throw strategicError("strategic_advantage_transfer_source_identity_invalid");
  }
  return {
    action: "request_strategic_advantage_transfer",
    proposal_id: proposalId,
    proposal_fingerprint: proposalFingerprint,
  };
}

function modelAttemptReadbackV01(
  receipt: ModelInvocationReceiptV02 | null,
): StrategicModelAttemptReadbackV01 | null {
  if (!receipt) return null;
  const fingerprint = createProtocolSha256V01(
    canonicalizeProtocolValueV01(receipt),
  );
  return {
    receipt_ref: {
      ref_version: "external_ref.v0.1",
      ref_type: "model_invocation_receipt",
      external_id: receipt.invocation_id,
      trust_class: "direct_local_observation",
      observed_at: receipt.finished_at,
      source_ref: fingerprint,
      compatibility_namespace:
        "augnes.vnext.strategic-advantage-transfer.v0.1.model-attempt",
    },
    status: receipt.status,
    failure_code: receipt.failure_code,
    egress_attempted: receipt.egress_attempted,
  };
}

function eligibleFields(
  prepared: PreparedStrategicSourceV01,
  capability: ReturnType<typeof readDefaultModelGatewayLocalCapabilityV01>,
) {
  return {
    base_label: prepared.base_strategy.bounded_summary,
    base_fingerprint: prepared.base_strategy.base_fingerprint,
    working_frame_fingerprint:
      prepared.working_frame.working_frame_fingerprint,
    source_catalog_fingerprint:
      prepared.source_catalog.source_catalog_fingerprint,
    lenses: STRATEGIC_ADVANTAGE_TRANSFER_LENSES_V01,
    budget: structuredClone(prepared.budget),
    model_capability: capability,
    model_attempt_count: 0 as const,
    last_model_attempt: null,
    optional: true as const,
    authoritative: false as const,
  };
}

function availableReadback(
  prepared: PreparedStrategicSourceV01,
  capability: ReturnType<typeof readDefaultModelGatewayLocalCapabilityV01>,
  proposal: EpisodeDeltaProposalV01,
): VNextOperatorStrategicAdvantageTransferReadbackV01 {
  const profile = proposal.strategic_advantage_transfer;
  if (!profile) {
    throw strategicError(
      "strategic_advantage_transfer_available_profile_missing",
      409,
    );
  }
  const modelAttempt = modelAttemptReadbackV01(
    profile.model_invocation.receipt,
  );
  if (!modelAttempt) {
    throw strategicError(
      "strategic_advantage_transfer_model_receipt_missing",
      409,
    );
  }
  return {
    ...eligibleFields(prepared, capability),
    status: "available",
    reason: null,
    existing_proposal: {
      proposal_id: proposal.proposal_id,
      proposal_fingerprint: proposal.integrity.fingerprint,
      review_href: `/workbench/semantic-review/${proposal.proposal_id.replace(":", "~")}`,
    },
    model_attempt_count: 1,
    last_model_attempt: modelAttempt,
  };
}

function unavailableReadback(
  status: "ineligible" | "unavailable" | "stale",
  reason: string,
  capability: ReturnType<typeof readDefaultModelGatewayLocalCapabilityV01>,
): VNextOperatorStrategicAdvantageTransferReadbackV01 {
  return {
    status,
    reason,
    base_label: null,
    base_fingerprint: null,
    working_frame_fingerprint: null,
    source_catalog_fingerprint: null,
    lenses: STRATEGIC_ADVANTAGE_TRANSFER_LENSES_V01,
    budget: createStrategicAdvantageTransferBudgetV01(),
    model_capability: capability,
    existing_proposal: null,
    model_attempt_count: 0,
    last_model_attempt: null,
    optional: true,
    authoritative: false,
  };
}

function admissionCookie(
  admission: VNextLocalOperatorSessionMutationAdmissionV01,
): SessionCookieV01 {
  return {
    value: admission.cookie_value,
    expires_at: admission.cookie_expires_at,
    max_age_seconds: admission.cookie_max_age_seconds,
  };
}

function classifyStrategicFailureStatusV01(
  errorCode: string,
): StrategicFailureStatusV01 {
  if (errorCode === "model_gateway_timeout") return "model_timeout";
  if (errorCode === "model_gateway_cancelled") return "model_cancelled";
  if (
    errorCode === "model_gateway_policy_refused" ||
    errorCode === "model_gateway_egress_refused" ||
    errorCode === "model_gateway_budget_refused"
  ) {
    return "model_denied";
  }
  if (errorCode === "model_gateway_provider_response_invalid") {
    return "malformed_output";
  }
  if (errorCode.startsWith("model_gateway_")) return "model_failed";
  return "proposal_admission_failed";
}

function strategicCostFailureCodeV01(code: string): string {
  if (code === "model_gateway_cost_budget_exceeded") {
    return "strategic_advantage_transfer_cost_budget_exceeded";
  }
  if (code === "model_gateway_pricing_stale") {
    return "strategic_advantage_transfer_pricing_stale";
  }
  if (
    code === "model_gateway_cost_binding_conflict" ||
    code === "model_gateway_cost_route_conflict" ||
    code === "model_gateway_cost_calculation_invalid"
  ) {
    return "strategic_advantage_transfer_cost_binding_conflict";
  }
  return "strategic_advantage_transfer_cost_authority_unavailable";
}

function isStrategicFailureStatusV01(
  value: unknown,
): value is StrategicFailureStatusV01 {
  return [
    "model_denied",
    "model_timeout",
    "model_cancelled",
    "model_failed",
    "malformed_output",
    "source_conflict",
    "stale_base",
    "proposal_admission_failed",
  ].includes(String(value));
}

function postInvocationFailure(
  db: Database.Database,
  prepared: PreparedStrategicSourceV01,
  status:
    | "malformed_output"
    | "source_conflict"
    | "stale_base"
    | "proposal_admission_failed",
  reason: string,
  retryable: boolean,
  admission: VNextLocalOperatorSessionMutationAdmissionV01,
  modelInvocationCount: 0 | 1 = 1,
  attemptReceipt: ModelInvocationReceiptV02 | null = null,
): VNextOperatorStrategicAdvantageTransferResultV01 {
  recordStrategicFailureWithoutMaskingV01(
    db,
    prepared,
    status,
    reason,
    retryable,
    attemptReceipt,
  );
  return {
    status,
    reason,
    retryable,
    proposal: null,
    source_proposal_unchanged: true,
    model_invocation_count: modelInvocationCount,
    session_cookie: admissionCookie(admission),
  };
}

async function invokeStrategicAnalysisOnceV01(
  analysisIdentity: string,
  operation: () => Promise<
    Awaited<
      ReturnType<typeof invokeStrategicAdvantageTransferModelGatewayV01>
    >
  >,
) {
  let entry = strategicAnalysesInFlightV01.get(analysisIdentity);
  const invoked = !entry;
  if (!entry && strategicAnalysesInFlightV01.size >= MAX_CONCURRENT_STRATEGIC_ANALYSES_V01) {
    throw strategicError(
      "strategic_advantage_transfer_concurrency_bound_exceeded",
      503,
    );
  }
  if (!entry) {
    entry = { consumers: 0, result: operation() };
    strategicAnalysesInFlightV01.set(analysisIdentity, entry);
  }
  entry.consumers += 1;
  let released = false;
  const release = () => {
    if (released) return;
    released = true;
    entry!.consumers -= 1;
    if (
      entry!.consumers === 0 &&
      strategicAnalysesInFlightV01.get(analysisIdentity) === entry
    ) {
      strategicAnalysesInFlightV01.delete(analysisIdentity);
    }
  };
  try {
    return {
      result: await entry.result,
      invoked,
      release,
    };
  } catch (error) {
    release();
    throw error;
  }
}

function sqliteFailureCode(error: unknown): string | null {
  if (!error || typeof error !== "object") return null;
  const code = Reflect.get(error, "code");
  return typeof code === "string" ? code : null;
}

function isRetryableStrategicStorageFailureV01(
  code: string | null,
): boolean {
  return Boolean(
    code &&
      (code === "SQLITE_BUSY" ||
        code.startsWith("SQLITE_BUSY_") ||
        code === "SQLITE_LOCKED" ||
        code.startsWith("SQLITE_LOCKED_")),
  );
}

function boundedCatalogText(value: string): string {
  const normalized = normalizeProtocolTextV01(value);
  if (!normalized || normalized.length > 1200) {
    throw strategicError(
      "strategic_advantage_transfer_source_catalog_text_bound_exceeded",
      422,
    );
  }
  assertStrategicAdvantageTransferSourceTextSafeV01(
    normalized,
    "$source_catalog.summary",
  );
  return normalized;
}

function permitsStrategicProviderEgress(
  packet: PreparedStrategicSourceV01["packet"],
): boolean {
  return (
    packet.constraints.data_classification === "public_safe" ||
    packet.constraints.data_classification === "private"
  );
}

function isEligibilityError(code: string): boolean {
  return [
    "base_strategy_missing",
    "base_strategy_ambiguous",
    "strategic_advantage_transfer_source_binding_unavailable",
    "strategic_advantage_transfer_source_proposal_profile_unsupported",
  ].includes(code);
}

function isStaleError(code: string): boolean {
  return code.includes("stale") || code.includes("missing");
}

function isCurrentBaseStaleError(code: string): boolean {
  return [
    "strategic_advantage_transfer_base_strategy_missing",
    "strategic_advantage_transfer_base_strategy_stale",
  ].includes(code);
}

function isSourceMaterialUnavailableError(code: string): boolean {
  return [
    "strategic_advantage_transfer_source_catalog_bound_exceeded",
    "strategic_advantage_transfer_source_catalog_text_bound_exceeded",
    "strategic_advantage_transfer_source_material_bound_exceeded",
  ].includes(code);
}

function strategicError(code: string, status = 400): VNextOperatorStrategicAdvantageTransferErrorV01 {
  return new VNextOperatorStrategicAdvantageTransferErrorV01(code, status);
}
