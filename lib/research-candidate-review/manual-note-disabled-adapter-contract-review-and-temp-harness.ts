import type { ManualNoteDisabledPromotionWriteAdapterReadiness } from "@/lib/research-candidate-review/manual-note-disabled-promotion-write-adapter";

export const MANUAL_NOTE_DISABLED_ADAPTER_CONTRACT_REVIEW_VERSION =
  "manual_note_disabled_adapter_contract_review.v0.1" as const;

export const MANUAL_NOTE_DISABLED_ADAPTER_TEMP_HARNESS_VERSION =
  "manual_note_disabled_adapter_temp_harness.v0.1" as const;

type BuildManualNoteDisabledAdapterContractReviewInput = {
  readiness: ManualNoteDisabledPromotionWriteAdapterReadiness;
  tempHarnessLabel?: string | null;
  generated_at?: string | null;
};

type BuildManualNoteDisabledAdapterTempHarnessInput = {
  readiness: ManualNoteDisabledPromotionWriteAdapterReadiness;
  contractReview: ManualNoteDisabledAdapterContractReview;
  tempHarnessLabel?: string | null;
  generated_at?: string | null;
};

type ContractCheckId =
  | "disabled_adapter_status_present"
  | "write_execution_status_not_executable"
  | "normal_product_write_disabled"
  | "actual_promotion_false"
  | "proof_evidence_write_false"
  | "perspective_canonical_write_false"
  | "canonical_graph_write_false"
  | "work_item_creation_false"
  | "provider_retrieval_source_fetch_false"
  | "external_handoff_false"
  | "persistence_false"
  | "idempotency_skeleton_present"
  | "rollback_skeleton_present"
  | "review_audit_skeleton_present"
  | "write_target_mapping_skeleton_present";

type RequiredContractChecks = Record<ContractCheckId, boolean>;

type PreservedBoundaries = {
  normal_product_write_enabled: false;
  actual_promotion_performed: false;
  proof_or_evidence_writes: false;
  perspective_or_canonical_writes: false;
  canonical_graph_write: false;
  work_item_creation: false;
  provider_or_openai_calls: false;
  retrieval_or_rag: false;
  source_fetching: false;
  external_handoff_sent: false;
  durable_persistence: false;
  browser_persistence: false;
};

type SimulatedWriteIntent = {
  simulated_intent_id: `temp-intent:${string}`;
  source_candidate_id?: string;
  source_ref_id?: string;
  target_kind: string;
  product_record_id: null;
  canonical_id: null;
  proof_id: null;
  evidence_id: null;
  work_item_id: null;
  write_performed_now: false;
  product_write_allowed: false;
  temp_harness_only: true;
};

export type ManualNoteDisabledAdapterContractReview = {
  review_kind: "manual_note_disabled_adapter_contract_review";
  review_version: typeof MANUAL_NOTE_DISABLED_ADAPTER_CONTRACT_REVIEW_VERSION;
  review_fingerprint: string;
  preview_draft_id: string;
  temp_harness_label: string | null;
  source_readiness: {
    adapter_kind: string;
    adapter_version: string;
    adapter_status: string;
    write_execution_status: string;
    local_copy_fingerprint: string;
    source_authority_design_packet_fingerprint: string;
  };
  contract_status: "ready_for_temp_harness" | "blocked_by_contract_gap";
  contract_summary: string;
  required_contract_checks: RequiredContractChecks;
  contract_gaps: Array<{
    check_id: ContractCheckId;
    severity: "blocker";
    message: string;
  }>;
  preserved_boundaries: PreservedBoundaries;
  next_recommended_slice: "temp_harness_review_and_fixture_only_write_adapter_contract";
};

export type ManualNoteDisabledAdapterTempHarness = {
  harness_kind: "manual_note_disabled_adapter_temp_harness";
  harness_version: typeof MANUAL_NOTE_DISABLED_ADAPTER_TEMP_HARNESS_VERSION;
  harness_fingerprint: string;
  preview_draft_id: string;
  source_contract_review_fingerprint: string;
  temp_harness_label: string | null;
  harness_status: "temp_harness_ready" | "blocked_by_contract_gap";
  execution_mode: "temp_non_product_simulation";
  product_write_mode: "disabled";
  temp_execution_summary: string;
  simulated_write_intents: {
    claim_intents: SimulatedWriteIntent[];
    evidence_intents: SimulatedWriteIntent[];
    perspective_intents: SimulatedWriteIntent[];
    source_verification_intents: SimulatedWriteIntent[];
    work_item_intents: SimulatedWriteIntent[];
  };
  idempotency_temp_harness: {
    idempotency_required: true;
    idempotency_key_generated_now: true;
    idempotency_key_kind: "temp_harness_only";
    idempotency_storage_added: false;
    product_idempotency_storage_added: false;
    future_contract_required: true;
  };
  rollback_temp_harness: {
    rollback_required: true;
    rollback_simulated: true;
    rollback_storage_added: false;
    product_rollback_performed: false;
    future_contract_required: true;
  };
  review_audit_temp_harness: {
    audit_required: true;
    audit_simulated: true;
    audit_record_created_now: false;
    approval_history_created_now: false;
    product_audit_storage_added: false;
    future_contract_required: true;
  };
  temp_harness_boundary: {
    temp_harness_only: true;
    normal_product_write_enabled: false;
    product_db_write: false;
    actual_promotion_performed: false;
    proof_or_evidence_writes: false;
    perspective_or_canonical_writes: false;
    canonical_graph_write: false;
    work_item_creation: false;
    provider_or_openai_calls: false;
    retrieval_or_rag: false;
    source_fetching: false;
    external_handoff_sent: false;
    durable_persistence: false;
    browser_persistence: false;
  };
  local_copy_packet: {
    markdown: string;
    json: string;
    fingerprint: string;
    fingerprint_algorithm: "fnv1a32_canonical_json";
    local_clipboard_only: true;
    external_handoff_sent: false;
    packet_persisted: false;
    product_write_authority_granted: false;
    actual_promotion_allowed: false;
  };
  next_recommended_slice: "fixture_only_disabled_write_adapter_contract_tests";
};

type ManualNoteDisabledAdapterTempHarnessCopySource = Omit<
  ManualNoteDisabledAdapterTempHarness,
  "local_copy_packet"
>;

const MAX_TEMP_HARNESS_LABEL_LENGTH = 120;

export function buildManualNoteDisabledAdapterContractReview(
  input: BuildManualNoteDisabledAdapterContractReviewInput,
): ManualNoteDisabledAdapterContractReview {
  const tempHarnessLabel = normalizeDisplayLabel(input.tempHarnessLabel);
  const requiredContractChecks = buildRequiredContractChecks(input.readiness);
  const contractGaps = buildContractGaps(requiredContractChecks);
  const contractStatus =
    contractGaps.length === 0
      ? "ready_for_temp_harness"
      : "blocked_by_contract_gap";
  const reviewWithoutFingerprint = {
    review_kind: "manual_note_disabled_adapter_contract_review",
    review_version: MANUAL_NOTE_DISABLED_ADAPTER_CONTRACT_REVIEW_VERSION,
    preview_draft_id: input.readiness.preview_draft_id,
    temp_harness_label: tempHarnessLabel,
    source_readiness: {
      adapter_kind: input.readiness.adapter_kind,
      adapter_version: input.readiness.adapter_version,
      adapter_status: input.readiness.adapter_status,
      write_execution_status: input.readiness.write_execution_status,
      local_copy_fingerprint: input.readiness.local_copy_packet.fingerprint,
      source_authority_design_packet_fingerprint:
        input.readiness.source_authority_design.packet_fingerprint,
    },
    contract_status: contractStatus,
    contract_summary:
      contractStatus === "ready_for_temp_harness"
        ? "Disabled adapter readiness preserves the required no product write contract for a temp harness simulation."
        : "Disabled adapter readiness has contract gaps and cannot move into the temp harness simulation.",
    required_contract_checks: requiredContractChecks,
    contract_gaps: contractGaps,
    preserved_boundaries: buildPreservedBoundaries(),
    next_recommended_slice:
      "temp_harness_review_and_fixture_only_write_adapter_contract",
  } satisfies Omit<ManualNoteDisabledAdapterContractReview, "review_fingerprint">;

  return {
    ...reviewWithoutFingerprint,
    review_fingerprint: createManualNoteDisabledAdapterContractReviewFingerprint(
      {
        readiness: input.readiness,
        tempHarnessLabel,
        generated_at: input.generated_at,
      },
    ),
  };
}

export function buildManualNoteDisabledAdapterTempHarness(
  input: BuildManualNoteDisabledAdapterTempHarnessInput,
): ManualNoteDisabledAdapterTempHarness {
  const tempHarnessLabel = normalizeDisplayLabel(input.tempHarnessLabel);
  const harnessStatus =
    input.contractReview.contract_status === "ready_for_temp_harness"
      ? "temp_harness_ready"
      : "blocked_by_contract_gap";
  const simulatedWriteIntents =
    harnessStatus === "temp_harness_ready"
      ? buildSimulatedWriteIntents(input.readiness)
      : {
          claim_intents: [],
          evidence_intents: [],
          perspective_intents: [],
          source_verification_intents: [],
          work_item_intents: [],
        };
  const harnessWithoutCopy: ManualNoteDisabledAdapterTempHarnessCopySource = {
    harness_kind: "manual_note_disabled_adapter_temp_harness",
    harness_version: MANUAL_NOTE_DISABLED_ADAPTER_TEMP_HARNESS_VERSION,
    harness_fingerprint: createManualNoteDisabledAdapterTempHarnessFingerprint({
      readiness: input.readiness,
      contractReview: input.contractReview,
      tempHarnessLabel,
      generated_at: input.generated_at,
    }),
    preview_draft_id: input.readiness.preview_draft_id,
    source_contract_review_fingerprint: input.contractReview.review_fingerprint,
    temp_harness_label: tempHarnessLabel,
    harness_status: harnessStatus,
    execution_mode: "temp_non_product_simulation",
    product_write_mode: "disabled",
    temp_execution_summary:
      harnessStatus === "temp_harness_ready"
        ? "Sandbox simulation produced temp-only write intents and performed no product write."
        : "Sandbox simulation is blocked because the disabled adapter contract review has gaps.",
    simulated_write_intents: simulatedWriteIntents,
    idempotency_temp_harness: {
      idempotency_required: true,
      idempotency_key_generated_now: true,
      idempotency_key_kind: "temp_harness_only",
      idempotency_storage_added: false,
      product_idempotency_storage_added: false,
      future_contract_required: true,
    },
    rollback_temp_harness: {
      rollback_required: true,
      rollback_simulated: true,
      rollback_storage_added: false,
      product_rollback_performed: false,
      future_contract_required: true,
    },
    review_audit_temp_harness: {
      audit_required: true,
      audit_simulated: true,
      audit_record_created_now: false,
      approval_history_created_now: false,
      product_audit_storage_added: false,
      future_contract_required: true,
    },
    temp_harness_boundary: {
      temp_harness_only: true,
      normal_product_write_enabled: false,
      product_db_write: false,
      actual_promotion_performed: false,
      proof_or_evidence_writes: false,
      perspective_or_canonical_writes: false,
      canonical_graph_write: false,
      work_item_creation: false,
      provider_or_openai_calls: false,
      retrieval_or_rag: false,
      source_fetching: false,
      external_handoff_sent: false,
      durable_persistence: false,
      browser_persistence: false,
    },
    next_recommended_slice: "fixture_only_disabled_write_adapter_contract_tests",
  };

  return {
    ...harnessWithoutCopy,
    local_copy_packet: {
      markdown: buildManualNoteDisabledAdapterTempHarnessMarkdown(
        harnessWithoutCopy,
      ),
      json: buildManualNoteDisabledAdapterTempHarnessJson(harnessWithoutCopy),
      fingerprint: harnessWithoutCopy.harness_fingerprint,
      fingerprint_algorithm: "fnv1a32_canonical_json",
      local_clipboard_only: true,
      external_handoff_sent: false,
      packet_persisted: false,
      product_write_authority_granted: false,
      actual_promotion_allowed: false,
    },
  };
}

export function buildManualNoteDisabledAdapterContractReviewMarkdown(
  review: ManualNoteDisabledAdapterContractReview,
) {
  return [
    "# Manual Note Disabled Adapter Contract Review",
    "",
    "Temp harness only.",
    "This does not perform normal product writes.",
    "This does not perform actual promotion.",
    "No provider, retrieval, source fetch, or external handoff is performed.",
    "No durable persistence is added.",
    "",
    `review_version: ${review.review_version}`,
    `preview_draft_id: ${review.preview_draft_id}`,
    `contract_status: ${review.contract_status}`,
    `review_fingerprint: ${review.review_fingerprint}`,
    "",
    "## Source Readiness",
    formatMixedMap(review.source_readiness),
    "",
    "## Required Contract Checks",
    formatMixedMap(review.required_contract_checks),
    "",
    "## Contract Gaps",
    review.contract_gaps.length === 0
      ? "none"
      : review.contract_gaps
          .map((gap) => `${gap.check_id}: ${gap.severity} - ${gap.message}`)
          .join("\n"),
    "",
    "## Preserved Boundaries",
    formatMixedMap(review.preserved_boundaries),
    "",
    `next_recommended_slice: ${review.next_recommended_slice}`,
  ].join("\n");
}

export function buildManualNoteDisabledAdapterContractReviewJson(
  review: ManualNoteDisabledAdapterContractReview,
) {
  return JSON.stringify(review, null, 2);
}

export function buildManualNoteDisabledAdapterTempHarnessMarkdown(
  harness: ManualNoteDisabledAdapterTempHarnessCopySource,
) {
  return [
    "# Manual Note Disabled Adapter Temp Harness",
    "",
    "Temp harness only.",
    "This does not perform normal product writes.",
    "This does not perform actual promotion.",
    "Simulated write intents are not proof/evidence, Perspective, canonical graph, or work item records.",
    "No provider, retrieval, source fetch, or external handoff is performed.",
    "No durable persistence is added.",
    "",
    `harness_version: ${harness.harness_version}`,
    `preview_draft_id: ${harness.preview_draft_id}`,
    `harness_status: ${harness.harness_status}`,
    `execution_mode: ${harness.execution_mode}`,
    `product_write_mode: ${harness.product_write_mode}`,
    `harness_fingerprint: ${harness.harness_fingerprint}`,
    "",
    "## Simulated Write Intent Counts",
    formatMixedMap(countSimulatedWriteIntents(harness.simulated_write_intents)),
    "",
    "## Idempotency Temp Harness",
    formatMixedMap(harness.idempotency_temp_harness),
    "",
    "## Rollback Temp Harness",
    formatMixedMap(harness.rollback_temp_harness),
    "",
    "## Review Audit Temp Harness",
    formatMixedMap(harness.review_audit_temp_harness),
    "",
    "## Temp Harness Boundary",
    formatMixedMap(harness.temp_harness_boundary),
    "",
    `next_recommended_slice: ${harness.next_recommended_slice}`,
  ].join("\n");
}

export function buildManualNoteDisabledAdapterTempHarnessJson(
  harness: ManualNoteDisabledAdapterTempHarnessCopySource,
) {
  return JSON.stringify(harness, null, 2);
}

export function createManualNoteDisabledAdapterContractReviewFingerprint(input: {
  readiness: ManualNoteDisabledPromotionWriteAdapterReadiness;
  tempHarnessLabel?: string | null;
  generated_at?: string | null;
}) {
  return createFingerprint({
    review_kind: "manual_note_disabled_adapter_contract_review",
    review_version: MANUAL_NOTE_DISABLED_ADAPTER_CONTRACT_REVIEW_VERSION,
    preview_draft_id: input.readiness.preview_draft_id,
    readiness_local_copy_fingerprint:
      input.readiness.local_copy_packet.fingerprint,
    readiness_source_authority_design_fingerprint:
      input.readiness.source_authority_design.packet_fingerprint,
    temp_harness_label: input.tempHarnessLabel ?? null,
    false_boundary_flags: buildPreservedBoundaries(),
    generated_at: input.generated_at ?? null,
  });
}

export function createManualNoteDisabledAdapterTempHarnessFingerprint(input: {
  readiness: ManualNoteDisabledPromotionWriteAdapterReadiness;
  contractReview: ManualNoteDisabledAdapterContractReview;
  tempHarnessLabel?: string | null;
  generated_at?: string | null;
}) {
  const simulatedWriteIntents = buildSimulatedWriteIntents(input.readiness);
  return createFingerprint({
    harness_kind: "manual_note_disabled_adapter_temp_harness",
    harness_version: MANUAL_NOTE_DISABLED_ADAPTER_TEMP_HARNESS_VERSION,
    preview_draft_id: input.readiness.preview_draft_id,
    readiness_local_copy_fingerprint:
      input.readiness.local_copy_packet.fingerprint,
    contract_review_fingerprint: input.contractReview.review_fingerprint,
    temp_harness_label: input.tempHarnessLabel ?? null,
    simulated_intent_ids: Object.values(simulatedWriteIntents)
      .flat()
      .map((intent) => intent.simulated_intent_id)
      .sort(),
    false_boundary_flags: {
      ...buildPreservedBoundaries(),
      product_db_write: false,
    },
    generated_at: input.generated_at ?? null,
  });
}

function buildRequiredContractChecks(
  readiness: ManualNoteDisabledPromotionWriteAdapterReadiness,
): RequiredContractChecks {
  const mapping = readiness.write_target_mapping_skeleton;
  return {
    disabled_adapter_status_present:
      readiness.adapter_status === "disabled_by_default",
    write_execution_status_not_executable:
      readiness.write_execution_status === "not_executable",
    normal_product_write_disabled:
      readiness.disabled_write_contract.normal_product_write_enabled === false &&
      readiness.execution_boundary.normal_product_write_enabled === false &&
      readiness.authority.normal_product_write_enabled === false,
    actual_promotion_false:
      readiness.execution_boundary.actual_promotion_performed === false &&
      readiness.local_copy_packet.actual_promotion_allowed === false,
    proof_evidence_write_false:
      readiness.execution_boundary.proof_or_evidence_writes === false &&
      readiness.runtime_boundary.proof_or_evidence_writes === false &&
      readiness.authority.proof_or_evidence_writes === false,
    perspective_canonical_write_false:
      readiness.execution_boundary.perspective_or_canonical_writes === false &&
      readiness.runtime_boundary.perspective_or_canonical_writes === false &&
      readiness.authority.perspective_or_canonical_writes === false,
    canonical_graph_write_false:
      readiness.execution_boundary.canonical_graph_write === false &&
      readiness.runtime_boundary.canonical_graph_write === false &&
      readiness.authority.canonical_graph_write === false,
    work_item_creation_false:
      readiness.execution_boundary.work_item_creation === false &&
      readiness.runtime_boundary.work_item_creation === false &&
      readiness.authority.work_item_creation === false,
    provider_retrieval_source_fetch_false:
      readiness.execution_boundary.provider_or_openai_calls === false &&
      readiness.execution_boundary.retrieval_or_rag === false &&
      readiness.execution_boundary.source_fetching === false &&
      readiness.runtime_boundary.provider_or_openai_calls === false &&
      readiness.runtime_boundary.retrieval_or_rag === false &&
      readiness.runtime_boundary.source_fetching === false,
    external_handoff_false:
      readiness.execution_boundary.external_handoff_sent === false &&
      readiness.local_copy_packet.external_handoff_sent === false,
    persistence_false:
      readiness.execution_boundary.adapter_readiness_persisted === false &&
      readiness.execution_boundary.browser_persistence === false &&
      readiness.local_copy_packet.packet_persisted === false,
    idempotency_skeleton_present:
      readiness.idempotency_skeleton.idempotency_required === true &&
      readiness.idempotency_skeleton.future_contract_required === true,
    rollback_skeleton_present:
      readiness.rollback_skeleton.rollback_required === true &&
      readiness.rollback_skeleton.future_contract_required === true,
    review_audit_skeleton_present:
      readiness.review_audit_skeleton.audit_record_required === true &&
      readiness.review_audit_skeleton.future_contract_required === true,
    write_target_mapping_skeleton_present:
      Array.isArray(mapping.claim_write_targets) &&
      Array.isArray(mapping.evidence_write_targets) &&
      Array.isArray(mapping.perspective_write_targets) &&
      Array.isArray(mapping.source_verification_targets) &&
      Array.isArray(mapping.work_item_targets),
  };
}

function buildContractGaps(requiredContractChecks: RequiredContractChecks) {
  return Object.entries(requiredContractChecks)
    .filter(([, passed]) => !passed)
    .map(([checkId]) => ({
      check_id: checkId as ContractCheckId,
      severity: "blocker" as const,
      message: `${checkId} failed; temp harness simulation remains blocked.`,
    }));
}

function buildPreservedBoundaries(): PreservedBoundaries {
  return {
    normal_product_write_enabled: false,
    actual_promotion_performed: false,
    proof_or_evidence_writes: false,
    perspective_or_canonical_writes: false,
    canonical_graph_write: false,
    work_item_creation: false,
    provider_or_openai_calls: false,
    retrieval_or_rag: false,
    source_fetching: false,
    external_handoff_sent: false,
    durable_persistence: false,
    browser_persistence: false,
  };
}

function buildSimulatedWriteIntents(
  readiness: ManualNoteDisabledPromotionWriteAdapterReadiness,
): ManualNoteDisabledAdapterTempHarness["simulated_write_intents"] {
  return {
    claim_intents:
      readiness.write_target_mapping_skeleton.claim_write_targets.map(
        (target, index) =>
          createSimulatedWriteIntent({
            intentKind: "claim",
            index,
            sourceCandidateId: target.source_claim_candidate_id,
            targetKind: target.target_table_or_kind_placeholder,
          }),
      ),
    evidence_intents:
      readiness.write_target_mapping_skeleton.evidence_write_targets.map(
        (target, index) =>
          createSimulatedWriteIntent({
            intentKind: "evidence",
            index,
            sourceCandidateId: target.source_evidence_candidate_id,
            targetKind: target.target_table_or_kind_placeholder,
          }),
      ),
    perspective_intents:
      readiness.write_target_mapping_skeleton.perspective_write_targets.map(
        (target, index) =>
          createSimulatedWriteIntent({
            intentKind: "perspective",
            index,
            sourceCandidateId: target.source_perspective_delta_candidate_id,
            targetKind: target.target_table_or_kind_placeholder,
          }),
      ),
    source_verification_intents:
      readiness.write_target_mapping_skeleton.source_verification_targets.map(
        (target, index) =>
          createSimulatedWriteIntent({
            intentKind: "source",
            index,
            sourceRefId: target.source_ref_id,
            targetKind: target.target_table_or_kind_placeholder,
          }),
      ),
    work_item_intents:
      readiness.write_target_mapping_skeleton.work_item_targets.map(
        (target, index) =>
          createSimulatedWriteIntent({
            intentKind: "work",
            index,
            sourceCandidateId: target.source_follow_up_work_candidate_id,
            targetKind: target.target_table_or_kind_placeholder,
          }),
      ),
  };
}

function createSimulatedWriteIntent({
  intentKind,
  index,
  sourceCandidateId,
  sourceRefId,
  targetKind,
}: {
  intentKind: string;
  index: number;
  sourceCandidateId?: string;
  sourceRefId?: string;
  targetKind: string;
}): SimulatedWriteIntent {
  return {
    simulated_intent_id: `temp-intent:${intentKind}:${String(index + 1).padStart(
      3,
      "0",
    )}` as `temp-intent:${string}`,
    ...(sourceCandidateId ? { source_candidate_id: sourceCandidateId } : {}),
    ...(sourceRefId ? { source_ref_id: sourceRefId } : {}),
    target_kind: targetKind,
    product_record_id: null,
    canonical_id: null,
    proof_id: null,
    evidence_id: null,
    work_item_id: null,
    write_performed_now: false,
    product_write_allowed: false,
    temp_harness_only: true,
  };
}

function countSimulatedWriteIntents(
  intents: ManualNoteDisabledAdapterTempHarness["simulated_write_intents"],
) {
  return {
    claim_intents: intents.claim_intents.length,
    evidence_intents: intents.evidence_intents.length,
    perspective_intents: intents.perspective_intents.length,
    source_verification_intents: intents.source_verification_intents.length,
    work_item_intents: intents.work_item_intents.length,
    total: Object.values(intents).reduce((sum, group) => sum + group.length, 0),
  };
}

function normalizeDisplayLabel(value: string | null | undefined) {
  if (!value) return null;
  const trimmed = value.trim();
  if (trimmed.length === 0) return null;
  return trimmed.slice(0, MAX_TEMP_HARNESS_LABEL_LENGTH);
}

function createFingerprint(value: unknown) {
  const canonical = canonicalJson(value);
  let hash = 0x811c9dc5;
  for (let index = 0; index < canonical.length; index += 1) {
    hash ^= canonical.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return `fnv1a32:${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

function canonicalJson(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map((item) => canonicalJson(item)).join(",")}]`;
  }

  return `{${Object.entries(value as Record<string, unknown>)
    .filter(([key]) => key !== "generated_at" && key !== "selected_at")
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, item]) => `${JSON.stringify(key)}:${canonicalJson(item)}`)
    .join(",")}}`;
}

function formatMixedMap(values: Record<string, unknown>) {
  return Object.entries(values)
    .map(([key, value]) => `${key}: ${formatValue(value)}`)
    .join("\n");
}

function formatValue(value: unknown): string {
  if (value === null || typeof value === "undefined") return "none";
  if (Array.isArray(value)) return value.length > 0 ? value.join(", ") : "none";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}
