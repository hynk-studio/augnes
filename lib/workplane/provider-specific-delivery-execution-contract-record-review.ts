import {
  PROVIDER_SPECIFIC_DELIVERY_EXECUTION_CONTRACT_PREVIEW_VERSION,
  PROVIDER_SPECIFIC_DELIVERY_EXECUTION_OPERATOR_DECISION_PREVIEW_VERSION,
  PROVIDER_SPECIFIC_DELIVERY_EXECUTION_SCOPE,
  type ProviderSpecificDeliveryExecutionContractPreview,
  type ProviderSpecificDeliveryExecutionOperatorDecisionPreview,
  type ProviderSpecificDeliveryExecutionSurface,
  type ProviderSpecificDeliveryLineageGateSummary,
  type ProviderSpecificDeliveryProviderConfigGateSummary,
} from "@/types/provider-specific-delivery-execution-contract-preview";
import {
  PROVIDER_SPECIFIC_DELIVERY_EXECUTION_CONTRACT_RECORD_REVIEW_SCOPE,
  PROVIDER_SPECIFIC_DELIVERY_EXECUTION_CONTRACT_RECORD_REVIEW_VERSION,
  PROVIDER_SPECIFIC_DELIVERY_EXECUTION_CONTRACT_RECORD_VERSION,
  type ProviderSpecificDeliveryExecutionContractRecordCandidate,
  type ProviderSpecificDeliveryExecutionContractRecordOperatorGateSummary,
  type ProviderSpecificDeliveryExecutionContractRecordReview,
  type ProviderSpecificDeliveryExecutionContractRecordReviewAuthorityBoundary,
  type ProviderSpecificDeliveryExecutionContractRecordReviewInput,
  type ProviderSpecificDeliveryExecutionContractRecordReviewStatus,
} from "@/types/provider-specific-delivery-execution-contract-record-review";
import type { ExternalHandoffDeliveryResidualGateSummary } from "@/types/external-handoff-delivery-contract";
import type { ProviderSpecificExternalDeliverySurface } from "@/types/provider-specific-external-delivery-preview-contract";
import {
  createProviderSpecificDeliveryExecutionNonDeliveryBoundaryV01,
  fingerprintProviderSpecificDeliveryExecutionValueV01,
} from "@/lib/workplane/provider-specific-delivery-execution-contract-preview";

type RecordValue = Record<string, unknown>;

const DEFAULT_AS_OF = "1970-01-01T00:00:00.000Z" as const;
const unsafeRefPattern =
  /raw_text|raw_report|raw_excerpt|raw_manual_note|raw_result_report|raw_email_body|raw_message|raw_payload|raw_provider_payload|secret|token|password|api[_-]?key|bearer|private|credential|webhook\s*url|https?:\/\/|env:|process\.env|\.env/i;
const executionSurfaces = new Set<ProviderSpecificDeliveryExecutionSurface>([
  "manual_operator_delivery_execution_preview",
  "email_delivery_execution_preview",
  "slack_delivery_execution_preview",
  "webhook_delivery_execution_preview",
]);
const providerSurfaces = new Set<ProviderSpecificExternalDeliverySurface>([
  "manual_operator_delivery",
  "email_delivery_preview",
  "slack_delivery_preview",
  "webhook_delivery_preview",
]);
const boundaryFalseFields = [
  "delivery_performed",
  "execution_performed",
  "provider_specific_delivery",
  "provider_delivery_intent_is_delivery",
  "provider_execution_preview_is_delivery",
  "provider_execution_contract_is_delivery",
  "provider_called",
  "external_message_sent",
  "email_sent",
  "slack_sent",
  "webhook_called",
  "network_called",
  "clipboard_written",
  "file_downloaded",
  "local_fulfillment_is_external_delivery",
  "external_contract_is_delivery",
  "provider_specific_preview_is_delivery",
  "provider_specific_intent_is_delivery",
] as const;
const authorityFalseFields = [
  "can_write_db",
  "can_create_schema",
  "can_create_route",
  "can_send_handoff",
  "can_execute_delivery",
  "can_call_send_provider",
  "can_call_email",
  "can_call_slack",
  "can_call_webhook",
  "can_call_network",
  "can_write_clipboard",
  "can_download_file",
  "can_write_arbitrary_file",
  "can_write_memory",
  "can_mutate_cwp",
  "can_mutate_handoff",
  "can_mutate_residual",
  "can_mutate_external_contract",
  "can_mutate_provider_intent",
  "can_mutate_delivery_spine_loop_closure",
  "can_render_workbench_action_button",
] as const;

export function buildProviderSpecificDeliveryExecutionContractRecordReviewV01(
  input: ProviderSpecificDeliveryExecutionContractRecordReviewInput = {},
): ProviderSpecificDeliveryExecutionContractRecordReview {
  const preview = isExecutionPreview(
    input.provider_specific_delivery_execution_contract_preview,
  )
    ? input.provider_specific_delivery_execution_contract_preview
    : null;
  const decisionPreview = isExecutionDecisionPreview(
    input.provider_specific_delivery_execution_operator_decision_preview,
  )
    ? input.provider_specific_delivery_execution_operator_decision_preview
    : null;

  const sourceExecutionPreviewFingerprint = safeRef(preview?.preview_fingerprint);
  const sourceOperatorDecisionPreviewFingerprint = safeRef(
    decisionPreview?.decision_preview_fingerprint,
  );
  const decisionSourcePreviewFingerprint = safeRef(
    decisionPreview?.source_execution_contract_preview_fingerprint,
  );
  const sourceDeliverySpineFingerprint = safeRef(
    preview?.source_delivery_spine_fingerprint,
  );
  const sourceIntentRecordRef = safeRef(
    preview?.source_provider_specific_intent_contract_record_ref,
  );
  const sourceExternalContractRecordRef = safeRef(
    preview?.source_external_handoff_delivery_contract_record_ref,
  );
  const sourceExportedArtifactRef = safeRef(
    preview?.source_exported_artifact_ref,
  );
  const sourceLocalFulfillmentRef = safeRef(
    preview?.source_local_fulfillment_ref,
  );
  const sourceHandoffSendContractRecordRef = safeRef(
    preview?.source_handoff_send_contract_record_ref,
  );
  const requestedProviderSurface = toProviderSurface(
    preview?.requested_provider_surface,
  );
  const requestedExecutionSurface = toExecutionSurface(
    preview?.requested_execution_surface,
  );
  const providerProfileRef = safeNullableRef(preview?.provider_profile_ref);
  const executionProfileRef = safeNullableRef(preview?.execution_profile_ref);
  const recipientRef = safeRef(preview?.requested_recipient_ref);
  const payloadHash = safeRef(preview?.payload_hash);
  const payloadType = safeNullableRef(preview?.payload_type);
  const payloadFormat = safeRef(preview?.requested_payload_format);
  const residualGateSummary =
    preview?.residual_gate_summary ?? emptyResidualGateSummary();
  const lineageGateSummary =
    preview?.lineage_gate_summary ?? emptyLineageGateSummary();
  const providerConfigGateSummary =
    preview?.provider_config_gate_summary ?? emptyProviderConfigGateSummary();
  const operatorGateSummary = buildOperatorGateSummary({
    preview,
    decisionPreview,
    decisionSourcePreviewFingerprint,
    sourceExecutionPreviewFingerprint,
  });
  const requirementSummary = buildRequirementSummary({
    sourceExecutionPreviewFingerprint,
    sourceOperatorDecisionPreviewFingerprint,
    sourceDeliverySpineFingerprint,
    sourceIntentRecordRef,
    sourceExternalContractRecordRef,
    sourceExportedArtifactRef,
    sourceLocalFulfillmentRef,
    requestedExecutionSurface,
    recipientRef,
    payloadHash,
    payloadFormat,
  });
  const sourceFingerprintProblems = sourceFingerprintProblemReasons({
    sourceExecutionPreviewFingerprint,
    sourceOperatorDecisionPreviewFingerprint,
    sourceDeliverySpineFingerprint,
  });
  const sourceRefProblems = sourceRefProblemReasons({
    sourceIntentRecordRef,
    sourceExternalContractRecordRef,
    sourceExportedArtifactRef,
    sourceLocalFulfillmentRef,
    requestedExecutionSurface,
    recipientRef,
    payloadHash,
    payloadFormat,
  });
  const unsafeProblems = unsafeOutputProblemReasons({
    providerProfileRef,
    executionProfileRef,
    recipientRef,
    payloadHash,
    payloadType,
    payloadFormat,
    sourceIntentRecordRef,
    sourceExternalContractRecordRef,
    sourceExportedArtifactRef,
    sourceLocalFulfillmentRef,
    sourceHandoffSendContractRecordRef,
  });
  const previewProblems = previewProblemReasons(preview);
  const decisionProblems = decisionProblemReasons({
    decisionPreview,
    sourceExecutionPreviewFingerprint,
    decisionSourcePreviewFingerprint,
  });
  const residualProblems =
    residualGateSummary.hard_blocker_reasons.length > 0
      ? residualGateSummary.hard_blocker_reasons.map(
          (reason) => `residual_gate_blocked:${reason}`,
        )
      : [];
  const lineageProblems =
    lineageGateSummary.gate_status !== "passed"
      ? [
          `lineage_gate_not_passed:${lineageGateSummary.gate_status}`,
          ...lineageGateSummary.problem_reasons,
        ]
      : [];
  const providerConfigProblems =
    providerConfigGateSummary.problem_reasons.length > 0
      ? providerConfigGateSummary.problem_reasons.map(
          (reason) => `provider_config_gate:${reason}`,
        )
      : [];
  const nonDeliveryProblems = nonDeliveryBoundaryProblemReasons(preview);
  const authorityProblems = authorityBoundaryProblemReasons(preview);
  const operatorProblems = operatorGateProblemReasons(operatorGateSummary);
  const blockerReasons = uniqueStrings([
    ...previewProblems,
    ...decisionProblems,
    ...sourceFingerprintProblems,
    ...sourceRefProblems,
    ...unsafeProblems,
    ...residualProblems,
    ...lineageProblems,
    ...providerConfigProblems,
    ...nonDeliveryProblems,
    ...authorityProblems,
    ...operatorProblems,
  ]);
  const warningReasons = uniqueStrings([
    ...(preview?.warning_reasons ?? []),
    ...(decisionPreview?.warning_reasons ?? []),
    ...residualGateSummary.warning_reasons,
    "execution_contract_record_review_is_not_delivery",
    "execution_preview_is_not_provider_authorization",
    "operator_decision_preview_is_not_send_action",
    "record_candidate_not_persisted",
    "provider_not_called",
    "external_message_not_sent",
  ]);
  const reviewStatus = determineReviewStatus({
    preview,
    decisionPreview,
    sourceFingerprintProblems,
    sourceRefProblems,
    residualProblems,
    lineageProblems,
    providerConfigProblems,
    nonDeliveryProblems,
    authorityProblems,
    operatorProblems,
    blockerReasons,
  });
  const asOf =
    input.as_of ?? preview?.as_of ?? decisionPreview?.as_of ?? DEFAULT_AS_OF;
  const authorityBoundary =
    createProviderSpecificDeliveryExecutionContractRecordReviewAuthorityBoundaryV01();
  const nonDeliveryBoundary =
    createProviderSpecificDeliveryExecutionNonDeliveryBoundaryV01();
  const sourceRefs = uniqueStrings([
    ...(input.source_refs ?? []),
    ...(preview?.source_refs ?? []),
    ...(sourceIntentRecordRef ? [sourceIntentRecordRef] : []),
    ...(sourceExternalContractRecordRef ? [sourceExternalContractRecordRef] : []),
    ...(sourceExportedArtifactRef ? [sourceExportedArtifactRef] : []),
    ...(sourceLocalFulfillmentRef ? [sourceLocalFulfillmentRef] : []),
  ]);
  const evidenceRefs = uniqueStrings([
    ...(input.evidence_refs ?? []),
    ...(preview?.evidence_refs ?? []),
    ...(sourceExecutionPreviewFingerprint
      ? [sourceExecutionPreviewFingerprint]
      : []),
    ...(sourceOperatorDecisionPreviewFingerprint
      ? [sourceOperatorDecisionPreviewFingerprint]
      : []),
    ...(payloadHash ? [payloadHash] : []),
  ]);
  const recordCandidate =
    reviewStatus === "recordable" &&
    sourceExecutionPreviewFingerprint &&
    sourceOperatorDecisionPreviewFingerprint &&
    sourceDeliverySpineFingerprint &&
    sourceIntentRecordRef &&
    sourceExternalContractRecordRef &&
    sourceExportedArtifactRef &&
    sourceLocalFulfillmentRef &&
    requestedExecutionSurface &&
    recipientRef &&
    payloadHash &&
    payloadFormat
      ? buildRecordCandidate({
          asOf,
          sourceExecutionPreviewFingerprint,
          sourceOperatorDecisionPreviewFingerprint,
          sourceDeliverySpineFingerprint,
          sourceIntentRecordRef,
          sourceExternalContractRecordRef,
          sourceExportedArtifactRef,
          sourceLocalFulfillmentRef,
          sourceHandoffSendContractRecordRef,
          requestedProviderSurface,
          requestedExecutionSurface,
          providerProfileRef,
          executionProfileRef,
          recipientRef,
          payloadHash,
          payloadType,
          payloadFormat,
          residualGateSummary,
          lineageGateSummary,
          providerConfigGateSummary,
          operatorGateSummary,
          sourceRefs,
          evidenceRefs,
          authorityBoundary,
          nonDeliveryBoundary,
        })
      : null;
  const reviewBase = {
    review_version:
      PROVIDER_SPECIFIC_DELIVERY_EXECUTION_CONTRACT_RECORD_REVIEW_VERSION,
    scope: PROVIDER_SPECIFIC_DELIVERY_EXECUTION_CONTRACT_RECORD_REVIEW_SCOPE,
    as_of: asOf,
    review_status: reviewStatus,
    source_execution_contract_preview_fingerprint:
      sourceExecutionPreviewFingerprint,
    source_operator_decision_preview_fingerprint:
      sourceOperatorDecisionPreviewFingerprint,
    source_delivery_spine_fingerprint: sourceDeliverySpineFingerprint,
    source_provider_specific_intent_contract_record_ref: sourceIntentRecordRef,
    source_external_handoff_delivery_contract_record_ref:
      sourceExternalContractRecordRef,
    source_exported_handoff_artifact_ref: sourceExportedArtifactRef,
    source_local_fulfillment_ref: sourceLocalFulfillmentRef,
    requested_execution_surface: requestedExecutionSurface,
    payload_hash: payloadHash,
    blocker_reasons: blockerReasons,
  };

  return {
    ...reviewBase,
    review_fingerprint:
      fingerprintProviderSpecificDeliveryExecutionValueV01(reviewBase),
    source_handoff_send_contract_record_ref:
      sourceHandoffSendContractRecordRef,
    requested_provider_surface: requestedProviderSurface,
    provider_profile_ref: providerProfileRef,
    execution_profile_ref: executionProfileRef,
    recipient_ref: recipientRef,
    payload_type: payloadType,
    payload_format: payloadFormat,
    residual_gate_summary: residualGateSummary,
    lineage_gate_summary: lineageGateSummary,
    provider_config_gate_summary: providerConfigGateSummary,
    operator_gate_summary: operatorGateSummary,
    readiness_summary: {
      execution_preview_present: Boolean(preview),
      execution_preview_ready:
        preview?.status === "ready_for_execution_contract_decision",
      operator_decision_preview_present: Boolean(decisionPreview),
      operator_decision_ready:
        decisionPreview?.decision_status ===
          "ready_for_execution_contract_design_review" &&
        decisionPreview.recommended_operator_decision ===
          "prepare_future_execution_contract_record_slice",
      operator_decision_matches_execution_preview:
        Boolean(sourceExecutionPreviewFingerprint) &&
        sourceExecutionPreviewFingerprint === decisionSourcePreviewFingerprint,
      source_execution_contract_preview_fingerprint_present: Boolean(
        sourceExecutionPreviewFingerprint,
      ),
      source_operator_decision_preview_fingerprint_present: Boolean(
        sourceOperatorDecisionPreviewFingerprint,
      ),
      source_delivery_spine_fingerprint_present: Boolean(
        sourceDeliverySpineFingerprint,
      ),
      source_provider_specific_intent_contract_record_ref_present:
        Boolean(sourceIntentRecordRef),
      source_external_handoff_delivery_contract_record_ref_present:
        Boolean(sourceExternalContractRecordRef),
      source_exported_handoff_artifact_ref_present:
        Boolean(sourceExportedArtifactRef),
      source_local_fulfillment_ref_present:
        Boolean(sourceLocalFulfillmentRef),
      residual_gate_passed: residualProblems.length === 0,
      lineage_gate_passed: lineageProblems.length === 0,
      provider_config_gate_passed: providerConfigProblems.length === 0,
      non_delivery_boundary_passed: nonDeliveryProblems.length === 0,
      authority_boundary_passed: authorityProblems.length === 0,
      recordable: reviewStatus === "recordable",
    },
    requirement_summary: requirementSummary,
    warning_reasons: warningReasons,
    insufficient_data_reasons:
      reviewStatus === "source_fingerprint_missing" ||
      reviewStatus === "source_ref_missing" ||
      reviewStatus === "execution_preview_missing" ||
      reviewStatus === "operator_decision_preview_missing"
        ? uniqueStrings([
            ...sourceFingerprintProblems,
            ...sourceRefProblems,
            ...previewProblems,
            ...decisionProblems,
          ])
        : [],
    source_refs: sourceRefs,
    evidence_refs: evidenceRefs,
    would_record_provider_specific_delivery_execution_contract_record:
      recordCandidate,
    explicit_non_delivery_boundary: nonDeliveryBoundary,
    authority_boundary: authorityBoundary,
    would_not_do: [
      "does_not_perform_delivery",
      "does_not_execute_provider_specific_delivery",
      "does_not_call_provider_email_slack_webhook_github_codex_openai_browser_crawler_or_network",
      "does_not_send_external_message",
      "does_not_read_environment_or_provider_secrets",
      "does_not_write_db_schema_route_clipboard_download_file_memory_cwp_handoff_or_work_state",
      "does_not_render_workbench_action_button",
    ],
    non_goals: [
      "actual_delivery_execution",
      "provider_call_or_network_delivery",
      "email_slack_or_webhook_send",
      "durable_db_record_write",
      "route_schema_migration_or_storage_layer",
      "perspective_memory_or_work_state_mutation",
      "proof_or_evidence_write",
      "clipboard_file_download_or_action_button",
    ],
  };
}

export function createProviderSpecificDeliveryExecutionContractRecordReviewAuthorityBoundaryV01():
  ProviderSpecificDeliveryExecutionContractRecordReviewAuthorityBoundary {
  return {
    read_only: true,
    advisory_only: true,
    read_only_record_review: true,
    record_review_only: true,
    source_of_truth: false,
    can_write_db: false,
    can_create_schema: false,
    can_create_route: false,
    can_send_handoff: false,
    can_execute_delivery: false,
    can_call_send_provider: false,
    can_call_email: false,
    can_call_slack: false,
    can_call_webhook: false,
    can_call_network: false,
    can_write_clipboard: false,
    can_download_file: false,
    can_write_arbitrary_file: false,
    can_write_memory: false,
    can_mutate_cwp: false,
    can_mutate_handoff: false,
    can_mutate_residual: false,
    can_mutate_external_contract: false,
    can_mutate_provider_intent: false,
    can_mutate_delivery_spine_loop_closure: false,
    can_render_workbench_action_button: false,
    can_call_provider_openai: false,
    can_call_github: false,
    can_execute_codex: false,
    can_call_browser_or_crawler: false,
    can_create_pr: false,
    can_merge_pr: false,
    can_mutate_work_state: false,
  };
}

function buildRecordCandidate({
  asOf,
  sourceExecutionPreviewFingerprint,
  sourceOperatorDecisionPreviewFingerprint,
  sourceDeliverySpineFingerprint,
  sourceIntentRecordRef,
  sourceExternalContractRecordRef,
  sourceExportedArtifactRef,
  sourceLocalFulfillmentRef,
  sourceHandoffSendContractRecordRef,
  requestedProviderSurface,
  requestedExecutionSurface,
  providerProfileRef,
  executionProfileRef,
  recipientRef,
  payloadHash,
  payloadType,
  payloadFormat,
  residualGateSummary,
  lineageGateSummary,
  providerConfigGateSummary,
  operatorGateSummary,
  sourceRefs,
  evidenceRefs,
  authorityBoundary,
  nonDeliveryBoundary,
}: {
  asOf: string;
  sourceExecutionPreviewFingerprint: string;
  sourceOperatorDecisionPreviewFingerprint: string;
  sourceDeliverySpineFingerprint: string;
  sourceIntentRecordRef: string;
  sourceExternalContractRecordRef: string;
  sourceExportedArtifactRef: string;
  sourceLocalFulfillmentRef: string;
  sourceHandoffSendContractRecordRef: string | null;
  requestedProviderSurface: ProviderSpecificExternalDeliverySurface | null;
  requestedExecutionSurface: ProviderSpecificDeliveryExecutionSurface;
  providerProfileRef: string | null;
  executionProfileRef: string | null;
  recipientRef: string;
  payloadHash: string;
  payloadType: string | null;
  payloadFormat: string;
  residualGateSummary: ExternalHandoffDeliveryResidualGateSummary;
  lineageGateSummary: ProviderSpecificDeliveryLineageGateSummary;
  providerConfigGateSummary: ProviderSpecificDeliveryProviderConfigGateSummary;
  operatorGateSummary:
    ProviderSpecificDeliveryExecutionContractRecordOperatorGateSummary;
  sourceRefs: string[];
  evidenceRefs: string[];
  authorityBoundary:
    ProviderSpecificDeliveryExecutionContractRecordReviewAuthorityBoundary;
  nonDeliveryBoundary: ReturnType<
    typeof createProviderSpecificDeliveryExecutionNonDeliveryBoundaryV01
  >;
}): ProviderSpecificDeliveryExecutionContractRecordCandidate {
  const candidateBase = {
    record_version:
      PROVIDER_SPECIFIC_DELIVERY_EXECUTION_CONTRACT_RECORD_VERSION,
    scope: PROVIDER_SPECIFIC_DELIVERY_EXECUTION_CONTRACT_RECORD_REVIEW_SCOPE,
    as_of: asOf,
    record_status:
      "provider_specific_delivery_execution_contract_candidate_recordable",
    source_execution_contract_preview_fingerprint:
      sourceExecutionPreviewFingerprint,
    source_operator_decision_preview_fingerprint:
      sourceOperatorDecisionPreviewFingerprint,
    source_delivery_spine_fingerprint: sourceDeliverySpineFingerprint,
    source_provider_specific_intent_contract_record_ref: sourceIntentRecordRef,
    source_external_handoff_delivery_contract_record_ref:
      sourceExternalContractRecordRef,
    source_exported_handoff_artifact_ref: sourceExportedArtifactRef,
    source_local_fulfillment_ref: sourceLocalFulfillmentRef,
    source_handoff_send_contract_record_ref:
      sourceHandoffSendContractRecordRef,
    requested_provider_surface: requestedProviderSurface,
    requested_execution_surface: requestedExecutionSurface,
    provider_profile_ref: providerProfileRef,
    execution_profile_ref: executionProfileRef,
    recipient_ref: recipientRef,
    payload_hash: payloadHash,
    payload_type: payloadType,
    payload_format: payloadFormat,
    residual_gate_summary: residualGateSummary,
    lineage_gate_summary: lineageGateSummary,
    provider_config_gate_summary: providerConfigGateSummary,
    operator_gate_summary: operatorGateSummary,
    source_refs: sourceRefs,
    evidence_refs: evidenceRefs,
    explicit_non_delivery_boundary: nonDeliveryBoundary,
    authority_boundary: authorityBoundary,
    no_delivery_performed: true,
    no_execution_performed: true,
    no_provider_call_performed: true,
    no_external_message_sent: true,
  } satisfies Omit<
    ProviderSpecificDeliveryExecutionContractRecordCandidate,
    "record_fingerprint"
  >;

  return {
    ...candidateBase,
    record_fingerprint:
      fingerprintProviderSpecificDeliveryExecutionValueV01(candidateBase),
  };
}

function determineReviewStatus({
  preview,
  decisionPreview,
  sourceFingerprintProblems,
  sourceRefProblems,
  residualProblems,
  lineageProblems,
  providerConfigProblems,
  nonDeliveryProblems,
  authorityProblems,
  operatorProblems,
  blockerReasons,
}: {
  preview: ProviderSpecificDeliveryExecutionContractPreview | null;
  decisionPreview: ProviderSpecificDeliveryExecutionOperatorDecisionPreview | null;
  sourceFingerprintProblems: string[];
  sourceRefProblems: string[];
  residualProblems: string[];
  lineageProblems: string[];
  providerConfigProblems: string[];
  nonDeliveryProblems: string[];
  authorityProblems: string[];
  operatorProblems: string[];
  blockerReasons: string[];
}): ProviderSpecificDeliveryExecutionContractRecordReviewStatus {
  if (!preview) return "execution_preview_missing";
  if (!decisionPreview) return "operator_decision_preview_missing";
  if (nonDeliveryProblems.length > 0) return "non_delivery_boundary_blocked";
  if (authorityProblems.length > 0) return "authority_boundary_blocked";
  if (residualProblems.length > 0) return "residual_gate_blocked";
  if (lineageProblems.length > 0) return "lineage_gate_blocked";
  if (providerConfigProblems.length > 0) return "provider_config_gate_blocked";
  if (preview.status !== "ready_for_execution_contract_decision") {
    return "execution_preview_not_ready";
  }
  if (
    decisionPreview.source_execution_contract_preview_fingerprint !==
    preview.preview_fingerprint
  ) {
    return "operator_decision_lineage_mismatch";
  }
  if (
    decisionPreview.decision_status !==
      "ready_for_execution_contract_design_review" ||
    decisionPreview.recommended_operator_decision !==
      "prepare_future_execution_contract_record_slice"
  ) {
    return "operator_decision_not_ready";
  }
  if (sourceFingerprintProblems.length > 0) {
    return "source_fingerprint_missing";
  }
  if (sourceRefProblems.length > 0) return "source_ref_missing";
  if (operatorProblems.length > 0) return "operator_gate_blocked";
  if (blockerReasons.length > 0) return "blocked";
  return "recordable";
}

function buildOperatorGateSummary({
  preview,
  decisionPreview,
  decisionSourcePreviewFingerprint,
  sourceExecutionPreviewFingerprint,
}: {
  preview: ProviderSpecificDeliveryExecutionContractPreview | null;
  decisionPreview: ProviderSpecificDeliveryExecutionOperatorDecisionPreview | null;
  decisionSourcePreviewFingerprint: string | null;
  sourceExecutionPreviewFingerprint: string | null;
}): ProviderSpecificDeliveryExecutionContractRecordOperatorGateSummary {
  return {
    operator_review_required: true,
    execution_contract_record_slice_required: true,
    execution_authorization_present: false,
    provider_call_authorized: false,
    operator_decision_preview_present: Boolean(decisionPreview),
    operator_decision_preview_status: decisionPreview?.decision_status ?? null,
    operator_decision_matches_execution_preview:
      Boolean(preview && sourceExecutionPreviewFingerprint) &&
      decisionSourcePreviewFingerprint === sourceExecutionPreviewFingerprint,
    operator_decision_ready_for_record_review:
      decisionPreview?.decision_status ===
        "ready_for_execution_contract_design_review" &&
      decisionPreview.recommended_operator_decision ===
        "prepare_future_execution_contract_record_slice",
  };
}

function buildRequirementSummary({
  sourceExecutionPreviewFingerprint,
  sourceOperatorDecisionPreviewFingerprint,
  sourceDeliverySpineFingerprint,
  sourceIntentRecordRef,
  sourceExternalContractRecordRef,
  sourceExportedArtifactRef,
  sourceLocalFulfillmentRef,
  requestedExecutionSurface,
  recipientRef,
  payloadHash,
  payloadFormat,
}: {
  sourceExecutionPreviewFingerprint: string | null;
  sourceOperatorDecisionPreviewFingerprint: string | null;
  sourceDeliverySpineFingerprint: string | null;
  sourceIntentRecordRef: string | null;
  sourceExternalContractRecordRef: string | null;
  sourceExportedArtifactRef: string | null;
  sourceLocalFulfillmentRef: string | null;
  requestedExecutionSurface: ProviderSpecificDeliveryExecutionSurface | null;
  recipientRef: string | null;
  payloadHash: string | null;
  payloadFormat: string | null;
}) {
  const requirements = [
    ["execution_contract_preview_fingerprint", sourceExecutionPreviewFingerprint],
    ["operator_decision_preview_fingerprint", sourceOperatorDecisionPreviewFingerprint],
    ["delivery_spine_fingerprint", sourceDeliverySpineFingerprint],
    ["provider_specific_intent_contract_record_ref", sourceIntentRecordRef],
    [
      "external_handoff_delivery_contract_record_ref",
      sourceExternalContractRecordRef,
    ],
    ["exported_handoff_artifact_ref", sourceExportedArtifactRef],
    ["local_fulfillment_ref", sourceLocalFulfillmentRef],
    ["requested_execution_surface", requestedExecutionSurface],
    ["recipient_ref", recipientRef],
    ["payload_hash", payloadHash],
    ["payload_format", payloadFormat],
  ] as const;
  return {
    required_refs: requirements.map(([name]) => name),
    missing_refs: requirements.flatMap(([name, value]) =>
      value ? [] : [`${name}_missing`],
    ),
    satisfied_requirements: requirements.flatMap(([name, value]) =>
      value ? [name] : [],
    ),
  };
}

function previewProblemReasons(
  preview: ProviderSpecificDeliveryExecutionContractPreview | null,
): string[] {
  if (!preview) return ["execution_contract_preview_missing"];
  return preview.status === "ready_for_execution_contract_decision"
    ? []
    : [
        `execution_contract_preview_not_ready:${preview.status}`,
        ...preview.blocker_reasons,
      ];
}

function decisionProblemReasons({
  decisionPreview,
  sourceExecutionPreviewFingerprint,
  decisionSourcePreviewFingerprint,
}: {
  decisionPreview: ProviderSpecificDeliveryExecutionOperatorDecisionPreview | null;
  sourceExecutionPreviewFingerprint: string | null;
  decisionSourcePreviewFingerprint: string | null;
}): string[] {
  if (!decisionPreview) return ["operator_decision_preview_missing"];
  return uniqueStrings([
    ...(decisionPreview.decision_status !==
    "ready_for_execution_contract_design_review"
      ? [
          `operator_decision_preview_not_ready:${decisionPreview.decision_status}`,
        ]
      : []),
    ...(decisionPreview.recommended_operator_decision !==
    "prepare_future_execution_contract_record_slice"
      ? [
          `operator_decision_not_record_slice:${decisionPreview.recommended_operator_decision}`,
        ]
      : []),
    ...(sourceExecutionPreviewFingerprint &&
    decisionSourcePreviewFingerprint !== sourceExecutionPreviewFingerprint
      ? ["operator_decision_execution_preview_fingerprint_mismatch"]
      : []),
    ...decisionPreview.blocker_reasons,
    ...decisionPreview.next_step_readiness.current_blockers,
    ...decisionPreview.next_step_readiness.current_missing_evidence,
  ]);
}

function sourceFingerprintProblemReasons({
  sourceExecutionPreviewFingerprint,
  sourceOperatorDecisionPreviewFingerprint,
  sourceDeliverySpineFingerprint,
}: {
  sourceExecutionPreviewFingerprint: string | null;
  sourceOperatorDecisionPreviewFingerprint: string | null;
  sourceDeliverySpineFingerprint: string | null;
}): string[] {
  return uniqueStrings([
    ...(!sourceExecutionPreviewFingerprint
      ? ["source_execution_contract_preview_fingerprint_missing"]
      : []),
    ...(!sourceOperatorDecisionPreviewFingerprint
      ? ["source_operator_decision_preview_fingerprint_missing"]
      : []),
    ...(!sourceDeliverySpineFingerprint
      ? ["source_delivery_spine_fingerprint_missing"]
      : []),
  ]);
}

function sourceRefProblemReasons({
  sourceIntentRecordRef,
  sourceExternalContractRecordRef,
  sourceExportedArtifactRef,
  sourceLocalFulfillmentRef,
  requestedExecutionSurface,
  recipientRef,
  payloadHash,
  payloadFormat,
}: {
  sourceIntentRecordRef: string | null;
  sourceExternalContractRecordRef: string | null;
  sourceExportedArtifactRef: string | null;
  sourceLocalFulfillmentRef: string | null;
  requestedExecutionSurface: ProviderSpecificDeliveryExecutionSurface | null;
  recipientRef: string | null;
  payloadHash: string | null;
  payloadFormat: string | null;
}): string[] {
  return uniqueStrings([
    ...(!sourceIntentRecordRef
      ? ["provider_specific_intent_contract_record_ref_missing"]
      : []),
    ...(!sourceExternalContractRecordRef
      ? ["external_handoff_delivery_contract_record_ref_missing"]
      : []),
    ...(!sourceExportedArtifactRef
      ? ["exported_handoff_artifact_ref_missing"]
      : []),
    ...(!sourceLocalFulfillmentRef ? ["local_fulfillment_ref_missing"] : []),
    ...(!requestedExecutionSurface
      ? ["requested_execution_surface_missing_or_unsupported"]
      : []),
    ...(!recipientRef ? ["recipient_ref_missing_or_unsafe"] : []),
    ...(!payloadHash ? ["payload_hash_missing_or_unsafe"] : []),
    ...(!payloadFormat ? ["payload_format_missing_or_unsafe"] : []),
  ]);
}

function unsafeOutputProblemReasons(values: Record<string, string | null>): string[] {
  return Object.entries(values).flatMap(([field, value]) =>
    value && unsafeRefPattern.test(value)
      ? [`${field}_contains_raw_or_secret_material`]
      : [],
  );
}

function nonDeliveryBoundaryProblemReasons(
  preview: ProviderSpecificDeliveryExecutionContractPreview | null,
): string[] {
  if (!preview) return [];
  const boundary = recordOrNull(preview.explicit_non_delivery_boundary);
  if (!boundary) return ["non_delivery_boundary_missing"];
  return boundaryFalseFields.flatMap((field) =>
    boundary[field] === false ? [] : [`non_delivery_boundary_${field}_not_false`],
  );
}

function authorityBoundaryProblemReasons(
  preview: ProviderSpecificDeliveryExecutionContractPreview | null,
): string[] {
  if (!preview) return [];
  const boundary = recordOrNull(preview.authority_boundary);
  if (!boundary) return ["authority_boundary_missing"];
  return uniqueStrings([
    ...(boundary.read_only === true ? [] : ["authority_boundary_read_only_not_true"]),
    ...(boundary.advisory_only === true
      ? []
      : ["authority_boundary_advisory_only_not_true"]),
    ...authorityFalseFields.flatMap((field) =>
      boundary[field] === false ? [] : [`authority_boundary_${field}_not_false`],
    ),
  ]);
}

function operatorGateProblemReasons(
  summary: ProviderSpecificDeliveryExecutionContractRecordOperatorGateSummary,
): string[] {
  return uniqueStrings([
    ...(!summary.operator_decision_preview_present
      ? ["operator_decision_preview_missing"]
      : []),
    ...(!summary.operator_decision_matches_execution_preview
      ? ["operator_decision_preview_fingerprint_not_matched"]
      : []),
    ...(!summary.operator_decision_ready_for_record_review
      ? ["operator_decision_not_ready_for_record_review"]
      : []),
    ...(summary.execution_authorization_present
      ? ["execution_authorization_should_not_be_present"]
      : []),
    ...(summary.provider_call_authorized
      ? ["provider_call_authorization_should_not_be_present"]
      : []),
  ]);
}

function emptyResidualGateSummary(): ExternalHandoffDeliveryResidualGateSummary {
  return {
    gate_status: "insufficient_data",
    hard_blocking_candidate_ids: [],
    warning_candidate_ids: [],
    non_blocking_candidate_ids: [],
    hard_blocker_reasons: ["execution_contract_preview_missing"],
    warning_reasons: [],
  };
}

function emptyLineageGateSummary(): ProviderSpecificDeliveryLineageGateSummary {
  return {
    gate_status: "insufficient_data",
    lineage_refs: {
      source_provider_specific_preview_fingerprint: null,
      intent_record_source_provider_specific_preview_fingerprint: null,
      source_external_handoff_delivery_contract_record_ref: null,
      intent_record_source_external_handoff_delivery_contract_record_ref: null,
      source_local_fulfillment_ref: null,
      intent_record_source_local_fulfillment_ref: null,
      source_exported_artifact_ref: null,
      intent_record_source_exported_artifact_ref: null,
    },
    problem_reasons: ["execution_contract_preview_missing"],
  };
}

function emptyProviderConfigGateSummary():
  ProviderSpecificDeliveryProviderConfigGateSummary {
  return {
    execution_profile_ref: null,
    config_ref_present: false,
    config_ref_status: "missing",
    config_runtime_verified: false,
    provider_call_tested: false,
    future_runtime_provider_gate_required: true,
    problem_reasons: ["execution_contract_preview_missing"],
  };
}

function isExecutionPreview(
  value: unknown,
): value is ProviderSpecificDeliveryExecutionContractPreview {
  return Boolean(
    isRecord(value) &&
      value.preview_version ===
        PROVIDER_SPECIFIC_DELIVERY_EXECUTION_CONTRACT_PREVIEW_VERSION &&
      value.scope === PROVIDER_SPECIFIC_DELIVERY_EXECUTION_SCOPE,
  );
}

function isExecutionDecisionPreview(
  value: unknown,
): value is ProviderSpecificDeliveryExecutionOperatorDecisionPreview {
  return Boolean(
    isRecord(value) &&
      value.decision_preview_version ===
        PROVIDER_SPECIFIC_DELIVERY_EXECUTION_OPERATOR_DECISION_PREVIEW_VERSION &&
      value.scope === PROVIDER_SPECIFIC_DELIVERY_EXECUTION_SCOPE,
  );
}

function toExecutionSurface(
  value: unknown,
): ProviderSpecificDeliveryExecutionSurface | null {
  return typeof value === "string" &&
    executionSurfaces.has(value as ProviderSpecificDeliveryExecutionSurface)
    ? (value as ProviderSpecificDeliveryExecutionSurface)
    : null;
}

function toProviderSurface(
  value: unknown,
): ProviderSpecificExternalDeliverySurface | null {
  return typeof value === "string" &&
    providerSurfaces.has(value as ProviderSpecificExternalDeliverySurface)
    ? (value as ProviderSpecificExternalDeliverySurface)
    : null;
}

function safeNullableRef(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  return safeRef(value);
}

function safeRef(value: unknown): string | null {
  return typeof value === "string" &&
    value.trim().length > 0 &&
    !/[<>{}\n\r\t]/.test(value) &&
    !unsafeRefPattern.test(value)
    ? value
    : null;
}

function uniqueStrings(values: Array<string | null | undefined>): string[] {
  return [...new Set(values.filter((value): value is string => Boolean(value)))];
}

function recordOrNull(value: unknown): RecordValue | null {
  return isRecord(value) ? value : null;
}

function isRecord(value: unknown): value is RecordValue {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
