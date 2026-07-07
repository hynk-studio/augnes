import type {
  ResearchCandidateManualResultDogfoodBridgeCard,
  ResearchCandidateManualResultDogfoodBridgeOutcomeLabel,
  ResearchCandidateManualResultDogfoodBridgePreview,
} from "@/types/research-candidate-manual-result-dogfood-bridge-preview";
import type {
  ResearchCandidateManualResultDogfoodLedgerAuthorizationAuthorityBoundary,
  ResearchCandidateManualResultDogfoodLedgerAuthorizationContract,
  ResearchCandidateManualResultDogfoodLedgerAuthorizationContractInput,
  ResearchCandidateManualResultDogfoodLedgerAuthorizationMode,
  ResearchCandidateManualResultDogfoodLedgerCompatibilityFinding,
} from "@/types/research-candidate-manual-result-dogfood-ledger-authorization-contract";
import {
  RESEARCH_CANDIDATE_MANUAL_RESULT_DOGFOOD_LEDGER_AUTHORIZATION_CONTRACT_KIND,
  RESEARCH_CANDIDATE_MANUAL_RESULT_DOGFOOD_LEDGER_AUTHORIZATION_CONTRACT_VERSION,
} from "@/types/research-candidate-manual-result-dogfood-ledger-authorization-contract";
import type { ResearchCandidateReviewScope } from "@/types/research-candidate-review";

const DEFAULT_SCOPE: ResearchCandidateReviewScope = "project:augnes";
const DEFAULT_OPERATOR_INTENT_LABEL =
  "manual_result_dogfood_ledger_authorization_contract_preview";
const DEFAULT_FUTURE_WRITE_MODE =
  "global_dogfood_ledger_authorization_preview";
const FINGERPRINT_ALGORITHM = "fnv1a32_canonical_json_v0_1" as const;
const SUPPORTED_OUTCOME_LABELS: ResearchCandidateManualResultDogfoodBridgeOutcomeLabel[] =
  ["helpful", "stale", "missing", "noisy", "misleading"];

export function buildResearchCandidateManualResultDogfoodLedgerAuthorizationContract({
  bridge_preview,
  operator_intent_label,
  requested_future_write_mode,
}: ResearchCandidateManualResultDogfoodLedgerAuthorizationContractInput): ResearchCandidateManualResultDogfoodLedgerAuthorizationContract {
  const bridgePreview = normalizeBridgePreview(bridge_preview);
  const primaryEodCard = findPrimaryCard(
    bridgePreview,
    "latest_committed_expected_observed_delta",
  );
  const primaryReuseCard = findPrimaryCard(
    bridgePreview,
    "latest_committed_reuse_outcome",
  );
  const sourceReceiptId = bridgePreview.latest_committed_receipt_id;
  const sourceHandoffSeedFingerprint =
    primaryEodCard?.source_handoff_seed_fingerprint ??
    primaryReuseCard?.source_handoff_seed_fingerprint ??
    null;
  const sourceResultTextFingerprint =
    primaryEodCard?.source_result_text_fingerprint ??
    primaryReuseCard?.source_result_text_fingerprint ??
    null;
  const outcomeLabel = normalizeOutcomeLabel(primaryReuseCard?.outcome_label);
  const bridgeReadOnly = bridgePreviewAuthorityIsReadOnly(bridgePreview);
  const eodReady =
    bridgePreview.expected_observed_delta_alignment
      .can_become_broader_expected_observed_delta_bridge_candidate === true &&
    Boolean(primaryEodCard);
  const reuseReady =
    bridgePreview.reuse_outcome_alignment
      .can_become_broader_reuse_outcome_bridge_candidate === true &&
    Boolean(primaryReuseCard);
  const supportedOutcomeLabel = SUPPORTED_OUTCOME_LABELS.includes(outcomeLabel);
  const compatibilityFindings = buildCompatibilityFindings({
    bridgePreview,
    primaryEodCard,
    primaryReuseCard,
    supportedOutcomeLabel,
    bridgeReadOnly,
  });
  const blockerReasons = buildBlockerReasons({
    bridgePreview,
    primaryEodCard,
    primaryReuseCard,
    sourceHandoffSeedFingerprint,
    sourceResultTextFingerprint,
    eodReady,
    reuseReady,
    supportedOutcomeLabel,
    bridgeReadOnly,
  });
  const warningReasons = uniqueStrings([
    ...bridgePreview.warning_reasons,
    ...compatibilityFindings
      .filter((finding) => finding.severity === "warning")
      .map((finding) => finding.finding_code),
    ...compatibilityFindings
      .filter(
        (finding) =>
          finding.severity === "blocker" &&
          finding.applies_to === "existing_handoff_reuse_outcome_ledger_writer",
      )
      .map((finding) => `existing_writer:${finding.finding_code}`),
  ]);
  const operatorAuthorizationMode = determineMode(blockerReasons);
  const globalMapping = {
    source_manual_receipt_id: sourceReceiptId,
    source_handoff_seed_fingerprint: sourceHandoffSeedFingerprint,
    source_result_text_fingerprint: sourceResultTextFingerprint,
    source_expected_observed_delta_record_ref: primaryEodCard?.record_id ?? null,
    source_reuse_outcome_record_ref: primaryReuseCard?.record_id ?? null,
    bridge_readiness: bridgePreview.dogfood_bridge_readiness,
    selected_context_outcome_label: outcomeLabel,
    selected_candidate_context_refs:
      primaryReuseCard?.selected_candidate_context_refs ?? [],
    expected_summary:
      bridgePreview.expected_observed_delta_alignment.latest_expected_summary,
    observed_summary:
      bridgePreview.expected_observed_delta_alignment.latest_observed_summary,
    mismatch_or_gap_summary:
      bridgePreview.expected_observed_delta_alignment
        .latest_mismatch_or_gap_summary,
    source_line: primaryReuseCard?.summary ?? null,
    warning_reasons: warningReasons,
    manual_only_context_refs: uniqueStrings([
      ...(primaryEodCard?.source_refs ?? []),
      ...(primaryReuseCard?.selected_candidate_context_refs ?? []),
    ]),
    global_ledger_candidate_allowed:
      operatorAuthorizationMode === "ready_for_future_ledger_write_authorization",
    global_metric_candidate_allowed: false,
    field_gaps: buildFieldGaps({
      primaryEodCard,
      primaryReuseCard,
      sourceHandoffSeedFingerprint,
      sourceResultTextFingerprint,
    }),
  };
  const idempotencyKey = `manual-result-dogfood-ledger-auth:${fingerprint({
    contract_version:
      RESEARCH_CANDIDATE_MANUAL_RESULT_DOGFOOD_LEDGER_AUTHORIZATION_CONTRACT_VERSION,
    requested_future_write_mode:
      requested_future_write_mode ?? DEFAULT_FUTURE_WRITE_MODE,
    source_bridge_preview_fingerprint:
      bridgePreview.validation.preview_fingerprint,
    source_manual_receipt_id: sourceReceiptId,
    source_expected_observed_delta_record_ref:
      globalMapping.source_expected_observed_delta_record_ref,
    source_reuse_outcome_record_ref:
      globalMapping.source_reuse_outcome_record_ref,
  })}`;
  const authorityBoundary =
    createResearchCandidateManualResultDogfoodLedgerAuthorizationAuthorityBoundary();
  const nonWriteConfirmation = createNonWriteConfirmation();
  const contractFingerprint = fingerprint({
    contract_kind:
      RESEARCH_CANDIDATE_MANUAL_RESULT_DOGFOOD_LEDGER_AUTHORIZATION_CONTRACT_KIND,
    contract_version:
      RESEARCH_CANDIDATE_MANUAL_RESULT_DOGFOOD_LEDGER_AUTHORIZATION_CONTRACT_VERSION,
    scope: bridgePreview.scope,
    source_bridge_preview_fingerprint:
      bridgePreview.validation.preview_fingerprint,
    source_latest_committed_receipt_id: sourceReceiptId,
    proposed_global_dogfood_mapping: globalMapping,
    idempotency_key: idempotencyKey,
    blocker_reasons: blockerReasons,
    warning_reasons: warningReasons,
    authority_boundary: authorityBoundary,
  });

  return {
    contract_kind:
      RESEARCH_CANDIDATE_MANUAL_RESULT_DOGFOOD_LEDGER_AUTHORIZATION_CONTRACT_KIND,
    contract_version:
      RESEARCH_CANDIDATE_MANUAL_RESULT_DOGFOOD_LEDGER_AUTHORIZATION_CONTRACT_VERSION,
    scope: bridgePreview.scope,
    operator_intent_label: normalizeLabel(operator_intent_label),
    requested_future_write_mode: normalizeLabel(
      requested_future_write_mode,
      DEFAULT_FUTURE_WRITE_MODE,
    ),
    source_bridge_preview_ref: bridgePreview.source_readback_ref,
    source_bridge_preview_fingerprint:
      bridgePreview.validation.preview_fingerprint,
    source_latest_committed_receipt_id: sourceReceiptId,
    source_manual_receipt_ids: bridgePreview.source_receipt_ids,
    operator_authorization_mode: operatorAuthorizationMode,
    proposed_global_dogfood_mapping: globalMapping,
    proposed_reuse_outcome_ledger_mapping: {
      proposed_record_family:
        "future_manual_research_candidate_reuse_outcome_ledger_record",
      source_reuse_outcome_record_ref: primaryReuseCard?.record_id ?? null,
      source_manual_receipt_id: sourceReceiptId,
      outcome_label: outcomeLabel,
      selected_reuse_candidate_refs:
        primaryReuseCard?.selected_candidate_context_refs ?? [],
      source_line: primaryReuseCard?.summary ?? null,
      warning_reasons: primaryReuseCard?.warning_reasons ?? [],
      existing_handoff_reuse_outcome_ledger_writer_compatible: false,
      compatibility_blockers_for_existing_writer: compatibilityFindings
        .filter(
          (finding) =>
            finding.severity === "blocker" &&
            finding.applies_to ===
              "existing_handoff_reuse_outcome_ledger_writer",
        )
        .map((finding) => finding.finding_code),
      writes_now: false,
    },
    proposed_expected_observed_delta_mapping: {
      proposed_record_family:
        "future_manual_research_candidate_expected_observed_delta_global_record",
      source_expected_observed_delta_record_ref: primaryEodCard?.record_id ?? null,
      source_manual_receipt_id: sourceReceiptId,
      expected_summary:
        bridgePreview.expected_observed_delta_alignment.latest_expected_summary,
      observed_summary:
        bridgePreview.expected_observed_delta_alignment.latest_observed_summary,
      mismatch_or_gap_summary:
        bridgePreview.expected_observed_delta_alignment
          .latest_mismatch_or_gap_summary,
      source_handoff_seed_fingerprint: sourceHandoffSeedFingerprint,
      source_result_text_fingerprint: sourceResultTextFingerprint,
      writes_now: false,
    },
    idempotency_contract_preview: {
      proposed_idempotency_key: idempotencyKey,
      fingerprint_algorithm: FINGERPRINT_ALGORITHM,
      would_prevent_duplicate_ledger_write: true,
      durable_id_allocated: false,
      writes_now: false,
    },
    compatibility_findings: compatibilityFindings,
    blocker_reasons: blockerReasons,
    warning_reasons: warningReasons,
    required_future_authorization: [
      "explicit_operator_acceptance_of_this_authorization_contract",
      "separate_future_global_dogfood_ledger_write_slice",
      "separate_future_idempotent_ledger_writer_contract",
      "operator_confirmation_text_for_future_write",
      "no_dogfood_metric_write_without_separate_contract",
      "no_perspective_proof_work_or_memory_write_without_separate_contract",
    ],
    required_future_checks: [
      "confirm_latest_manual_receipt_is_still_active_committed",
      "confirm_manual_eod_and_reuse_records_still_match_contract_fingerprint",
      "review_existing_handoff_reuse_outcome_ledger_writer_shape_mismatch",
      "confirm_manual_context_refs_are_not_proof_or_evidence_refs",
      "confirm_no_raw_manual_note_or_result_text_persistence",
      "run_future_ledger_writer_idempotency_replay_check_before_write",
      "run_global_dogfood_and_metric_non_write_checks_until_write_slice_exists",
    ],
    non_write_confirmation: nonWriteConfirmation,
    validation: {
      passed:
        operatorAuthorizationMode !== "blocked_before_ledger_authorization" &&
        nonWriteConfirmation.global_dogfood_ledger_written === false &&
        authorityBoundary.can_write_global_dogfood_ledger === false,
      contract_fingerprint: contractFingerprint,
      fingerprint_algorithm: FINGERPRINT_ALGORITHM,
      bridge_preview_ready:
        bridgePreview.dogfood_bridge_readiness ===
        "ready_for_operator_bridge_review",
      latest_committed_receipt_present: Boolean(sourceReceiptId),
      expected_observed_delta_ready: eodReady,
      reuse_outcome_ready: reuseReady,
      source_handoff_seed_fingerprint_present: hasText(
        sourceHandoffSeedFingerprint,
      ),
      source_result_text_fingerprint_present: hasText(
        sourceResultTextFingerprint,
      ),
      supported_outcome_label: supportedOutcomeLabel,
      bridge_preview_authority_is_read_only: bridgeReadOnly,
      no_write_authority:
        authorityBoundary.can_write_global_dogfood_ledger === false &&
        authorityBoundary.can_write_dogfood_metrics === false &&
        authorityBoundary.can_write_manual_result_records === false,
      blocker_count: blockerReasons.length,
      warning_count: warningReasons.length,
    },
    authority_boundary: authorityBoundary,
    next_recommended_slice:
      operatorAuthorizationMode === "ready_for_future_ledger_write_authorization"
        ? "If an operator accepts this contract, implement a separate idempotent global dogfood ledger write slice with fresh authorization and row-count non-write checks for every other state family."
        : "Resolve the listed contract blockers before preparing any broader dogfood ledger write authorization.",
  };
}

export function createResearchCandidateManualResultDogfoodLedgerAuthorizationAuthorityBoundary(): ResearchCandidateManualResultDogfoodLedgerAuthorizationAuthorityBoundary {
  return {
    preview_only: true,
    read_only: true,
    source_of_truth: false,
    can_write_global_dogfood_ledger: false,
    can_write_dogfood_metrics: false,
    can_write_expected_observed_delta_global_record: false,
    can_write_reuse_outcome_global_record: false,
    can_write_manual_result_records: false,
    can_mutate_manual_result_records: false,
    can_write_proof_or_evidence: false,
    can_mutate_work: false,
    can_promote_perspective: false,
    can_write_perspective_state: false,
    can_write_perspective_memory: false,
    can_execute_codex: false,
    can_call_github: false,
    can_call_providers_or_openai: false,
    can_fetch_sources: false,
    can_run_retrieval_rag_embeddings_vector_fts_or_crawler: false,
    can_allocate_product_ids: false,
    can_execute_product_write: false,
  };
}

function normalizeBridgePreview(
  value: unknown,
): ResearchCandidateManualResultDogfoodBridgePreview {
  if (
    value &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    "preview_kind" in value &&
    "candidate_bridge_cards" in value
  ) {
    return value as ResearchCandidateManualResultDogfoodBridgePreview;
  }

  return {
    preview_kind: "research_candidate_manual_result_dogfood_bridge_preview",
    preview_version: "research_candidate_manual_result_dogfood_bridge_preview.v0.1",
    scope: DEFAULT_SCOPE,
    operator_view_label: "missing_bridge_preview",
    source_readback_ref: "manual-result-readback:missing",
    source_receipt_ids: [],
    latest_committed_receipt_id: null,
    receipt_status_summary: {
      total_receipts: 0,
      committed_count: 0,
      superseded_count: 0,
      rolled_back_count: 0,
      duplicate_replayed_count: 0,
      active_committed_count: 0,
      context_only_receipt_count: 0,
    },
    expected_observed_delta_alignment: {
      total_manual_expected_observed_delta_records: 0,
      committed_count: 0,
      superseded_count: 0,
      rolled_back_count: 0,
      latest_expected_summary: null,
      latest_observed_summary: null,
      latest_mismatch_or_gap_summary: null,
      observed_summary_present: false,
      source_handoff_seed_fingerprint_present: false,
      source_result_text_fingerprint_present: false,
      can_become_broader_expected_observed_delta_bridge_candidate: false,
      blockers: ["bridge_preview_missing"],
    },
    reuse_outcome_alignment: {
      total_manual_reuse_outcome_records: 0,
      committed_count: 0,
      superseded_count: 0,
      rolled_back_count: 0,
      outcome_label_counts: {
        helpful: 0,
        stale: 0,
        missing: 0,
        noisy: 0,
        misleading: 0,
        not_reported: 0,
      },
      latest_outcome_label: "not_reported",
      selected_candidate_context_ref_count: 0,
      total_selected_candidate_context_ref_count: 0,
      source_line_present: false,
      warning_reason_counts: {},
      can_become_broader_reuse_outcome_bridge_candidate: false,
      blockers: ["bridge_preview_missing"],
    },
    dogfood_bridge_readiness: "blocked_no_manual_result_records",
    candidate_bridge_cards: [],
    blocked_reasons: ["bridge_preview_missing"],
    warning_reasons: [],
    required_future_authorization: [],
    authority_boundary: {
      read_only: true,
      preview_only: true,
      source_of_truth: false,
      writes_global_dogfood_ledger: false,
      writes_dogfood_metrics: false,
      writes_expected_observed_delta_global_record: false,
      writes_reuse_outcome_global_record: false,
      writes_perspective: false,
      writes_perspective_memory: false,
      writes_proof_or_evidence: false,
      mutates_work: false,
      can_call_provider_or_openai: false,
      can_call_github: false,
      can_execute_codex: false,
      can_fetch_sources: false,
      can_run_retrieval_rag_embeddings_vector_fts_or_crawler: false,
    },
    validation: {
      passed: false,
      preview_fingerprint: "fnv1a32:missing",
      fingerprint_algorithm: FINGERPRINT_ALGORITHM,
      readback_is_manual_result_records: false,
      raw_manual_note_text_absent: true,
      raw_result_report_text_absent: true,
      no_proof_evidence_work_or_perspective_rows_written: true,
      latest_committed_receipt_selected: false,
      no_global_dogfood_or_metric_write_authority: true,
      blocker_count: 1,
      warning_count: 0,
    },
    next_recommended_slice: "supply manual bridge preview",
  };
}

function findPrimaryCard(
  preview: ResearchCandidateManualResultDogfoodBridgePreview,
  cardKind:
    | "latest_committed_expected_observed_delta"
    | "latest_committed_reuse_outcome",
) {
  return (
    preview.candidate_bridge_cards.find(
      (card) =>
        card.card_kind === cardKind &&
        card.card_status === "primary_candidate" &&
        card.receipt_id === preview.latest_committed_receipt_id,
    ) ?? null
  );
}

function buildBlockerReasons({
  bridgePreview,
  primaryEodCard,
  primaryReuseCard,
  sourceHandoffSeedFingerprint,
  sourceResultTextFingerprint,
  eodReady,
  reuseReady,
  supportedOutcomeLabel,
  bridgeReadOnly,
}: {
  bridgePreview: ResearchCandidateManualResultDogfoodBridgePreview;
  primaryEodCard: ResearchCandidateManualResultDogfoodBridgeCard | null;
  primaryReuseCard: ResearchCandidateManualResultDogfoodBridgeCard | null;
  sourceHandoffSeedFingerprint: string | null;
  sourceResultTextFingerprint: string | null;
  eodReady: boolean;
  reuseReady: boolean;
  supportedOutcomeLabel: boolean;
  bridgeReadOnly: boolean;
}) {
  return uniqueStrings([
    ...(bridgePreview.dogfood_bridge_readiness !==
    "ready_for_operator_bridge_review"
      ? [`bridge_preview_not_ready:${bridgePreview.dogfood_bridge_readiness}`]
      : []),
    ...(!bridgePreview.latest_committed_receipt_id
      ? ["latest_committed_receipt_missing"]
      : []),
    ...(!eodReady ? ["expected_observed_delta_alignment_not_ready"] : []),
    ...(!primaryEodCard
      ? ["latest_committed_expected_observed_delta_card_missing"]
      : []),
    ...(!reuseReady ? ["reuse_outcome_alignment_not_ready"] : []),
    ...(!primaryReuseCard ? ["latest_committed_reuse_outcome_card_missing"] : []),
    ...(!hasText(sourceHandoffSeedFingerprint)
      ? ["source_handoff_seed_fingerprint_missing"]
      : []),
    ...(!hasText(sourceResultTextFingerprint)
      ? ["source_result_text_fingerprint_missing"]
      : []),
    ...(!supportedOutcomeLabel ? ["reuse_outcome_label_not_supported"] : []),
    ...(!bridgeReadOnly ? ["bridge_preview_authority_boundary_has_write_authority"] : []),
    ...bridgePreview.blocked_reasons.map((reason) => `bridge:${reason}`),
    ...(primaryEodCard?.blockers.map((reason) => `eod_card:${reason}`) ?? []),
    ...(primaryReuseCard?.blockers.map((reason) => `reuse_card:${reason}`) ??
      []),
  ]);
}

function determineMode(
  blockerReasons: string[],
): ResearchCandidateManualResultDogfoodLedgerAuthorizationMode {
  return blockerReasons.length > 0
    ? "blocked_before_ledger_authorization"
    : "ready_for_future_ledger_write_authorization";
}

function buildCompatibilityFindings({
  bridgePreview,
  primaryEodCard,
  primaryReuseCard,
  supportedOutcomeLabel,
  bridgeReadOnly,
}: {
  bridgePreview: ResearchCandidateManualResultDogfoodBridgePreview;
  primaryEodCard: ResearchCandidateManualResultDogfoodBridgeCard | null;
  primaryReuseCard: ResearchCandidateManualResultDogfoodBridgeCard | null;
  supportedOutcomeLabel: boolean;
  bridgeReadOnly: boolean;
}): ResearchCandidateManualResultDogfoodLedgerCompatibilityFinding[] {
  return [
    {
      finding_code: bridgePreview.validation.latest_committed_receipt_selected
        ? "latest_committed_manual_receipt_selected"
        : "latest_committed_manual_receipt_missing",
      severity: bridgePreview.validation.latest_committed_receipt_selected
        ? "ready"
        : "blocker",
      applies_to: "future_manual_dogfood_ledger_contract",
      summary:
        "The contract uses only the active committed manual receipt selected by the bridge preview.",
    },
    {
      finding_code: primaryEodCard
        ? "manual_expected_observed_delta_card_present"
        : "manual_expected_observed_delta_card_missing",
      severity: primaryEodCard ? "ready" : "blocker",
      applies_to: "future_manual_dogfood_ledger_contract",
      summary:
        "Manual ExpectedObservedDelta material must be present before any future global dogfood mapping.",
    },
    {
      finding_code: primaryReuseCard
        ? "manual_reuse_outcome_card_present"
        : "manual_reuse_outcome_card_missing",
      severity: primaryReuseCard ? "ready" : "blocker",
      applies_to: "future_manual_dogfood_ledger_contract",
      summary:
        "Manual Reuse Outcome material must be present before any future global dogfood mapping.",
    },
    {
      finding_code: supportedOutcomeLabel
        ? "reuse_outcome_label_supported"
        : "reuse_outcome_label_not_supported",
      severity: supportedOutcomeLabel ? "ready" : "blocker",
      applies_to: "future_manual_dogfood_ledger_contract",
      summary:
        "Supported labels are helpful, stale, missing, noisy, and misleading.",
    },
    {
      finding_code: bridgeReadOnly
        ? "bridge_preview_authority_read_only"
        : "bridge_preview_authority_has_write_authority",
      severity: bridgeReadOnly ? "ready" : "blocker",
      applies_to: "future_manual_dogfood_ledger_contract",
      summary:
        "The source bridge preview must remain read-only before a contract can be accepted.",
    },
    {
      finding_code: "existing_handoff_reuse_outcome_ledger_writer_shape_mismatch",
      severity: "blocker",
      applies_to: "existing_handoff_reuse_outcome_ledger_writer",
      summary:
        "The existing HandoffReuseOutcomeLedger writer expects operator refs, evidence refs, result/work/handoff refs, and an approved bridge decision shape that manual Research Candidate bridge cards do not honestly provide.",
    },
  ];
}

function buildFieldGaps({
  primaryEodCard,
  primaryReuseCard,
  sourceHandoffSeedFingerprint,
  sourceResultTextFingerprint,
}: {
  primaryEodCard: ResearchCandidateManualResultDogfoodBridgeCard | null;
  primaryReuseCard: ResearchCandidateManualResultDogfoodBridgeCard | null;
  sourceHandoffSeedFingerprint: string | null;
  sourceResultTextFingerprint: string | null;
}) {
  return uniqueStrings([
    ...(!primaryEodCard ? ["manual_expected_observed_delta_card_missing"] : []),
    ...(!primaryReuseCard ? ["manual_reuse_outcome_card_missing"] : []),
    ...(!hasText(sourceHandoffSeedFingerprint)
      ? ["source_handoff_seed_fingerprint_missing"]
      : []),
    ...(!hasText(sourceResultTextFingerprint)
      ? ["source_result_text_fingerprint_missing"]
      : []),
    "existing_handoff_reuse_outcome_ledger_writer_operator_ref_missing",
    "existing_handoff_reuse_outcome_ledger_writer_evidence_refs_missing",
    "existing_handoff_reuse_outcome_ledger_writer_work_ref_missing",
    "existing_handoff_reuse_outcome_ledger_writer_handoff_ref_missing",
  ]);
}

function bridgePreviewAuthorityIsReadOnly(
  preview: ResearchCandidateManualResultDogfoodBridgePreview,
) {
  const boundary = preview.authority_boundary;
  return (
    boundary.read_only === true &&
    boundary.preview_only === true &&
    boundary.source_of_truth === false &&
    boundary.writes_global_dogfood_ledger === false &&
    boundary.writes_dogfood_metrics === false &&
    boundary.writes_expected_observed_delta_global_record === false &&
    boundary.writes_reuse_outcome_global_record === false &&
    boundary.writes_perspective === false &&
    boundary.writes_perspective_memory === false &&
    boundary.writes_proof_or_evidence === false &&
    boundary.mutates_work === false &&
    boundary.can_call_provider_or_openai === false &&
    boundary.can_call_github === false &&
    boundary.can_execute_codex === false &&
    boundary.can_fetch_sources === false &&
    boundary.can_run_retrieval_rag_embeddings_vector_fts_or_crawler === false
  );
}

function createNonWriteConfirmation() {
  return {
    global_dogfood_ledger_written: false,
    dogfood_metrics_written: false,
    expected_observed_delta_global_record_written: false,
    reuse_outcome_global_record_written: false,
    manual_result_records_written: false,
    manual_result_records_mutated: false,
    proof_or_evidence_written: false,
    work_mutated: false,
    perspective_promoted: false,
    perspective_state_written: false,
    perspective_memory_written: false,
    product_write_executed: false,
    api_write_route_added: false,
    db_schema_or_migration_added: false,
    provider_openai_called: false,
    github_called: false,
    codex_executed: false,
    sources_fetched: false,
    retrieval_rag_embeddings_vector_fts_or_crawler_run: false,
  } as const;
}

function normalizeOutcomeLabel(
  value: ResearchCandidateManualResultDogfoodBridgeOutcomeLabel | null | undefined,
): ResearchCandidateManualResultDogfoodBridgeOutcomeLabel {
  return value ?? "not_reported";
}

function normalizeLabel(value: string | null | undefined, fallback = DEFAULT_OPERATOR_INTENT_LABEL) {
  const normalized = value?.trim();
  if (!normalized) return fallback;
  return normalized.slice(0, 140);
}

function hasText(value: string | null | undefined) {
  return typeof value === "string" && value.trim().length > 0;
}

function uniqueStrings(values: string[]) {
  return [...new Set(values.filter((value) => value.trim().length > 0))];
}

function fingerprint(value: unknown) {
  return `fnv1a32:${fnv1a32(stableJson(value))}`;
}

function stableJson(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableJson(item)).join(",")}]`;
  }
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${stableJson(record[key])}`)
    .join(",")}}`;
}

function fnv1a32(value: string) {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}
