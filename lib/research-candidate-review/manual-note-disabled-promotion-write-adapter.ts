import type { ManualNoteAuthorityGatedPromotionDesignPacket } from "@/lib/research-candidate-review/manual-note-dry-run-candidate-review-and-authority-design";

export const MANUAL_NOTE_DISABLED_PROMOTION_WRITE_ADAPTER_VERSION =
  "manual_note_disabled_promotion_write_adapter.v0.1" as const;

export const MANUAL_NOTE_DISABLED_PROMOTION_WRITE_ADAPTER_READINESS_KIND =
  "manual_note_disabled_promotion_write_adapter_readiness" as const;

type DisabledAdapterValidationSummary = {
  design_packet_present: true;
  preview_draft_id_matches_route: true;
  proposed_write_contract_present: true;
  execution_boundary_present: true;
  all_required_false_write_flags_present: true;
  blocking_requirements_present: true;
  idempotency_design_present: true;
  rollback_design_present: true;
  review_audit_design_present: true;
  source_evidence_authority_design_present: true;
};

type BuildManualNoteDisabledPromotionWriteAdapterReadinessInput = {
  previewDraftId: string;
  route: string;
  authorityDesignPacket: unknown;
  candidateReviewPacketFingerprint?: string | null;
  operatorIntentLabel?: string | null;
};

type ValidateManualNoteAuthorityDesignPacketForDisabledAdapterInput = {
  previewDraftId: string;
  authorityDesignPacket: unknown;
  candidateReviewPacketFingerprint?: string | null;
};

type ManualNoteDisabledPromotionWriteAdapterReadinessCopySource = Omit<
  ManualNoteDisabledPromotionWriteAdapterReadiness,
  "local_copy_packet"
>;

export type ManualNoteDisabledPromotionWriteAdapterReadiness = {
  ok: true;
  adapter_kind: typeof MANUAL_NOTE_DISABLED_PROMOTION_WRITE_ADAPTER_READINESS_KIND;
  adapter_version: typeof MANUAL_NOTE_DISABLED_PROMOTION_WRITE_ADAPTER_VERSION;
  preview_draft_id: string;
  adapter_status: "disabled_by_default";
  write_execution_status: "not_executable";
  disabled_reason: "Actual promotion write execution is intentionally disabled in this skeleton.";
  operator_intent_label: string | null;
  source_authority_design: {
    packet_kind: string;
    packet_version: string;
    packet_fingerprint: string;
    design_status: string;
    next_recommended_slice: string;
  };
  validation_summary: DisabledAdapterValidationSummary;
  disabled_write_contract: {
    actual_write_route_added: true;
    actual_write_route_enabled: false;
    write_adapter_implemented: "disabled_skeleton_only";
    write_execution_enabled: false;
    normal_product_write_enabled: false;
    requires_future_explicit_operator_decision: true;
    requires_future_source_verification_authority: true;
    requires_future_proof_evidence_write_authority: true;
    requires_future_canonical_perspective_write_authority: true;
    requires_future_idempotency_contract: true;
    requires_future_rollback_contract: true;
    requires_future_audit_record_contract: true;
  };
  write_target_mapping_skeleton: {
    claim_write_targets: Array<{
      source_claim_candidate_id: string;
      target_table_or_kind_placeholder: "future_canonical_claim";
      canonical_claim_id: null;
      write_performed_now: false;
    }>;
    evidence_write_targets: Array<{
      source_evidence_candidate_id: string;
      source_claim_candidate_id: string;
      target_table_or_kind_placeholder: "future_proof_evidence_record";
      proof_id: null;
      evidence_id: null;
      write_performed_now: false;
    }>;
    perspective_write_targets: Array<{
      source_perspective_delta_candidate_id: string;
      target_table_or_kind_placeholder: "future_perspective_canonical_graph";
      perspective_id: null;
      canonical_graph_edge_id: null;
      write_performed_now: false;
    }>;
    source_verification_targets: Array<{
      source_ref_id: string;
      target_table_or_kind_placeholder: "future_source_verification_record";
      fetched: false;
      verified: false;
      indexed: false;
    }>;
    work_item_targets: Array<{
      source_follow_up_work_candidate_id: string;
      target_table_or_kind_placeholder: "future_separate_work_item_lane";
      work_item_id: null;
      write_performed_now: false;
    }>;
  };
  idempotency_skeleton: {
    idempotency_required: true;
    idempotency_key_generated_now: false;
    idempotency_storage_added: false;
    proposed_key_inputs: string[];
    future_contract_required: true;
  };
  rollback_skeleton: {
    rollback_required: true;
    rollback_implemented_now: false;
    rollback_storage_added: false;
    future_contract_required: true;
  };
  review_audit_skeleton: {
    audit_record_required: true;
    audit_record_created_now: false;
    approval_history_created_now: false;
    future_contract_required: true;
  };
  execution_boundary: {
    disabled_adapter_only: true;
    design_packet_read_only: true;
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
    adapter_readiness_persisted: false;
    browser_persistence: false;
  };
  runtime_boundary: ReturnType<
    typeof buildManualNoteDisabledPromotionWriteAdapterBoundary
  >;
  authority: ReturnType<typeof buildManualNoteDisabledPromotionWriteAdapterAuthority>;
  local_copy_packet: {
    markdown: string;
    json: string;
    fingerprint: string;
    fingerprint_algorithm: "fnv1a32_canonical_json";
    local_clipboard_only: true;
    external_handoff_sent: false;
    packet_persisted: false;
    promotion_authority_granted: false;
    actual_promotion_allowed: false;
  };
  next_recommended_slice: "disabled_adapter_contract_review_and_temp_execution_harness";
};

export function buildManualNoteDisabledPromotionWriteAdapterReadiness(
  input: BuildManualNoteDisabledPromotionWriteAdapterReadinessInput,
): ManualNoteDisabledPromotionWriteAdapterReadiness {
  const validation = validateManualNoteAuthorityDesignPacketForDisabledAdapter({
    previewDraftId: input.previewDraftId,
    authorityDesignPacket: input.authorityDesignPacket,
    candidateReviewPacketFingerprint: input.candidateReviewPacketFingerprint,
  });
  const packet = validation.authorityDesignPacket;
  const readinessWithoutCopy: ManualNoteDisabledPromotionWriteAdapterReadinessCopySource =
    {
      ok: true,
      adapter_kind:
        MANUAL_NOTE_DISABLED_PROMOTION_WRITE_ADAPTER_READINESS_KIND,
      adapter_version: MANUAL_NOTE_DISABLED_PROMOTION_WRITE_ADAPTER_VERSION,
      preview_draft_id: input.previewDraftId,
      adapter_status: "disabled_by_default",
      write_execution_status: "not_executable",
      disabled_reason:
        "Actual promotion write execution is intentionally disabled in this skeleton.",
      operator_intent_label: input.operatorIntentLabel ?? null,
      source_authority_design: {
        packet_kind: packet.packet_kind,
        packet_version: packet.packet_version,
        packet_fingerprint: packet.packet_fingerprint,
        design_status: packet.design_status,
        next_recommended_slice: packet.next_recommended_slice,
      },
      validation_summary: validation.validationSummary,
      disabled_write_contract: {
        actual_write_route_added: true,
        actual_write_route_enabled: false,
        write_adapter_implemented: "disabled_skeleton_only",
        write_execution_enabled: false,
        normal_product_write_enabled: false,
        requires_future_explicit_operator_decision: true,
        requires_future_source_verification_authority: true,
        requires_future_proof_evidence_write_authority: true,
        requires_future_canonical_perspective_write_authority: true,
        requires_future_idempotency_contract: true,
        requires_future_rollback_contract: true,
        requires_future_audit_record_contract: true,
      },
      write_target_mapping_skeleton: buildWriteTargetMappingSkeleton(packet),
      idempotency_skeleton: {
        idempotency_required: true,
        idempotency_key_generated_now: false,
        idempotency_storage_added: false,
        proposed_key_inputs: [...packet.idempotency_design.proposed_key_inputs],
        future_contract_required: true,
      },
      rollback_skeleton: {
        rollback_required: true,
        rollback_implemented_now: false,
        rollback_storage_added: false,
        future_contract_required: true,
      },
      review_audit_skeleton: {
        audit_record_required: true,
        audit_record_created_now: false,
        approval_history_created_now: false,
        future_contract_required: true,
      },
      execution_boundary: {
        disabled_adapter_only: true,
        design_packet_read_only: true,
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
        adapter_readiness_persisted: false,
        browser_persistence: false,
      },
      runtime_boundary: buildManualNoteDisabledPromotionWriteAdapterBoundary(
        input.route,
      ),
      authority: buildManualNoteDisabledPromotionWriteAdapterAuthority(),
      next_recommended_slice:
        "disabled_adapter_contract_review_and_temp_execution_harness",
    };
  const fingerprint = createManualNoteDisabledPromotionWriteAdapterFingerprint({
    previewDraftId: input.previewDraftId,
    authorityDesignPacket: packet,
    candidateReviewPacketFingerprint:
      input.candidateReviewPacketFingerprint ?? null,
  });

  return {
    ...readinessWithoutCopy,
    local_copy_packet: {
      markdown: buildManualNoteDisabledPromotionWriteAdapterMarkdown(
        readinessWithoutCopy,
      ),
      json: buildManualNoteDisabledPromotionWriteAdapterJson(
        readinessWithoutCopy,
      ),
      fingerprint,
      fingerprint_algorithm: "fnv1a32_canonical_json",
      local_clipboard_only: true,
      external_handoff_sent: false,
      packet_persisted: false,
      promotion_authority_granted: false,
      actual_promotion_allowed: false,
    },
  };
}

export function buildManualNoteDisabledPromotionWriteAdapterBoundary(
  route: string,
) {
  return {
    route,
    route_kind: "disabled_promotion_write_adapter_readiness",
    disabled_readiness_route_only: true,
    actual_write_route_enabled: false,
    write_execution_enabled: false,
    normal_product_write_enabled: false,
    adapter_readiness_persisted: false,
    proof_or_evidence_writes: false,
    perspective_or_canonical_writes: false,
    canonical_graph_write: false,
    work_item_creation: false,
    provider_or_openai_calls: false,
    retrieval_or_rag: false,
    source_fetching: false,
    external_handoff_sent: false,
    browser_persistence: false,
  } as const;
}

export function buildManualNoteDisabledPromotionWriteAdapterAuthority() {
  return {
    disabled_adapter_only: true,
    readiness_is_not_approval: true,
    readiness_is_not_write_authority: true,
    actual_promotion_allowed: false,
    promotion_authority_granted: false,
    normal_product_write_enabled: false,
    write_execution_enabled: false,
    proof_or_evidence_writes: false,
    perspective_or_canonical_writes: false,
    canonical_graph_write: false,
    work_item_creation: false,
    provider_or_openai_calls: false,
    retrieval_or_rag: false,
    source_fetching: false,
    external_handoff_sent: false,
    adapter_readiness_persisted: false,
    browser_persistence: false,
  } as const;
}

export function buildManualNoteDisabledPromotionWriteAdapterMarkdown(
  readiness: ManualNoteDisabledPromotionWriteAdapterReadinessCopySource,
) {
  return [
    "# Research Candidate Disabled Promotion Write Adapter Readiness",
    "",
    "Disabled adapter skeleton only.",
    "This does not perform actual promotion.",
    "Normal product writes are disabled.",
    "No proof/evidence, Perspective, canonical graph, or work item records are created.",
    "No provider, retrieval, source fetch, or external handoff is performed.",
    "Adapter readiness is not approval and not write authority.",
    "",
    `adapter_version: ${readiness.adapter_version}`,
    `preview_draft_id: ${readiness.preview_draft_id}`,
    `adapter_status: ${readiness.adapter_status}`,
    `write_execution_status: ${readiness.write_execution_status}`,
    `disabled_reason: ${readiness.disabled_reason}`,
    "",
    "## Source Authority Design",
    formatMixedMap(readiness.source_authority_design),
    "",
    "## Validation Summary",
    formatMixedMap(readiness.validation_summary),
    "",
    "## Disabled Write Contract",
    formatMixedMap(readiness.disabled_write_contract),
    "",
    "## Write Target Mapping Skeleton",
    `claim_write_targets: ${readiness.write_target_mapping_skeleton.claim_write_targets.length}`,
    `evidence_write_targets: ${readiness.write_target_mapping_skeleton.evidence_write_targets.length}`,
    `perspective_write_targets: ${readiness.write_target_mapping_skeleton.perspective_write_targets.length}`,
    `source_verification_targets: ${readiness.write_target_mapping_skeleton.source_verification_targets.length}`,
    `work_item_targets: ${readiness.write_target_mapping_skeleton.work_item_targets.length}`,
    "",
    "## Idempotency Skeleton",
    formatMixedMap(readiness.idempotency_skeleton),
    "",
    "## Rollback Skeleton",
    formatMixedMap(readiness.rollback_skeleton),
    "",
    "## Review Audit Skeleton",
    formatMixedMap(readiness.review_audit_skeleton),
    "",
    "## Execution Boundary",
    formatMixedMap(readiness.execution_boundary),
    "",
    `next_recommended_slice: ${readiness.next_recommended_slice}`,
  ].join("\n");
}

export function buildManualNoteDisabledPromotionWriteAdapterJson(
  readiness: ManualNoteDisabledPromotionWriteAdapterReadinessCopySource,
) {
  return JSON.stringify(readiness, null, 2);
}

export function createManualNoteDisabledPromotionWriteAdapterFingerprint(input: {
  previewDraftId: string;
  authorityDesignPacket: ManualNoteAuthorityGatedPromotionDesignPacket;
  candidateReviewPacketFingerprint?: string | null;
}) {
  return createFingerprint({
    adapter_kind:
      MANUAL_NOTE_DISABLED_PROMOTION_WRITE_ADAPTER_READINESS_KIND,
    adapter_version: MANUAL_NOTE_DISABLED_PROMOTION_WRITE_ADAPTER_VERSION,
    preview_draft_id: input.previewDraftId,
    source_authority_design_packet_fingerprint:
      input.authorityDesignPacket.packet_fingerprint,
    candidate_review_packet_fingerprint:
      input.candidateReviewPacketFingerprint ?? null,
    adapter_false_flags: {
      actual_write_route_enabled: false,
      write_execution_enabled: false,
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
      adapter_readiness_persisted: false,
      browser_persistence: false,
    },
  });
}

export function validateManualNoteAuthorityDesignPacketForDisabledAdapter(
  input: ValidateManualNoteAuthorityDesignPacketForDisabledAdapterInput,
) {
  if (!isRecord(input.authorityDesignPacket)) {
    throw new ManualNoteDisabledPromotionWriteAdapterValidationError({
      errorCode: "invalid_authority_design_packet",
      message: "authority_design_packet must be a JSON object.",
    });
  }

  const packet = input.authorityDesignPacket;
  if (packet.packet_kind !== "manual_note_authority_gated_promotion_design_packet") {
    throw new ManualNoteDisabledPromotionWriteAdapterValidationError({
      errorCode: "invalid_authority_design_packet",
      message: "authority_design_packet.packet_kind is not supported.",
    });
  }

  const sourceCandidateReviewPacket = packet.source_candidate_review_packet;
  if (!isRecord(sourceCandidateReviewPacket)) {
    throw new ManualNoteDisabledPromotionWriteAdapterValidationError({
      errorCode: "invalid_authority_design_packet",
      message:
        "authority_design_packet.source_candidate_review_packet must be a JSON object.",
    });
  }

  if (sourceCandidateReviewPacket.preview_draft_id !== input.previewDraftId) {
    throw new ManualNoteDisabledPromotionWriteAdapterValidationError({
      errorCode: "preview_draft_id_mismatch",
      message:
        "authority_design_packet source preview_draft_id must match the route preview_draft_id.",
    });
  }

  if (
    input.candidateReviewPacketFingerprint &&
    sourceCandidateReviewPacket.packet_fingerprint !==
      input.candidateReviewPacketFingerprint
  ) {
    throw new ManualNoteDisabledPromotionWriteAdapterValidationError({
      errorCode: "candidate_review_packet_fingerprint_mismatch",
      message:
        "candidate_review_packet_fingerprint must match the authority design packet source.",
    });
  }

  assertRequiredDesignPacketSections(packet);
  assertFalseWriteFlags(packet);

  return {
    authorityDesignPacket:
      packet as unknown as ManualNoteAuthorityGatedPromotionDesignPacket,
    validationSummary: {
      design_packet_present: true,
      preview_draft_id_matches_route: true,
      proposed_write_contract_present: true,
      execution_boundary_present: true,
      all_required_false_write_flags_present: true,
      blocking_requirements_present: true,
      idempotency_design_present: true,
      rollback_design_present: true,
      review_audit_design_present: true,
      source_evidence_authority_design_present: true,
    } satisfies DisabledAdapterValidationSummary,
  };
}

export class ManualNoteDisabledPromotionWriteAdapterValidationError extends Error {
  readonly errorCode: string;

  constructor({ errorCode, message }: { errorCode: string; message: string }) {
    super(message);
    this.name = "ManualNoteDisabledPromotionWriteAdapterValidationError";
    this.errorCode = errorCode;
  }
}

function buildWriteTargetMappingSkeleton(
  packet: ManualNoteAuthorityGatedPromotionDesignPacket,
): ManualNoteDisabledPromotionWriteAdapterReadiness["write_target_mapping_skeleton"] {
  return {
    claim_write_targets:
      packet.canonical_target_mapping_design.selected_claim_targets.map(
        (target) => ({
          source_claim_candidate_id: target.source_claim_candidate_id,
          target_table_or_kind_placeholder: "future_canonical_claim",
          canonical_claim_id: null,
          write_performed_now: false,
        }),
      ),
    evidence_write_targets:
      packet.canonical_target_mapping_design.selected_evidence_targets.map(
        (target) => ({
          source_evidence_candidate_id: target.source_evidence_candidate_id,
          source_claim_candidate_id: target.source_claim_candidate_id,
          target_table_or_kind_placeholder: "future_proof_evidence_record",
          proof_id: null,
          evidence_id: null,
          write_performed_now: false,
        }),
      ),
    perspective_write_targets:
      packet.canonical_target_mapping_design.selected_perspective_delta_targets.map(
        (target) => ({
          source_perspective_delta_candidate_id:
            target.source_perspective_delta_candidate_id,
          target_table_or_kind_placeholder:
            "future_perspective_canonical_graph",
          perspective_id: null,
          canonical_graph_edge_id: null,
          write_performed_now: false,
        }),
      ),
    source_verification_targets:
      packet.canonical_target_mapping_design.selected_source_reference_targets.map(
        (target) => ({
          source_ref_id: target.source_ref_id,
          target_table_or_kind_placeholder: "future_source_verification_record",
          fetched: false,
          verified: false,
          indexed: false,
        }),
      ),
    work_item_targets:
      packet.canonical_target_mapping_design.selected_follow_up_work_targets.map(
        (target) => ({
          source_follow_up_work_candidate_id:
            target.source_follow_up_work_candidate_id,
          target_table_or_kind_placeholder: "future_separate_work_item_lane",
          work_item_id: null,
          write_performed_now: false,
        }),
      ),
  };
}

function assertRequiredDesignPacketSections(value: Record<string, unknown>) {
  for (const [key, expectedKind] of [
    ["source_candidate_review_packet", "object"],
    ["proposed_write_contract", "object"],
    ["canonical_target_mapping_design", "object"],
    ["idempotency_design", "object"],
    ["rollback_design", "object"],
    ["review_audit_design", "object"],
    ["source_evidence_authority_design", "object"],
    ["execution_boundary", "object"],
  ] as const) {
    if (!isRecord(value[key])) {
      throw new ManualNoteDisabledPromotionWriteAdapterValidationError({
        errorCode: "invalid_authority_design_packet",
        message: `authority_design_packet.${key} must be a JSON ${expectedKind}.`,
      });
    }
  }

  if (!Array.isArray(value.blocking_requirements_before_any_write)) {
    throw new ManualNoteDisabledPromotionWriteAdapterValidationError({
      errorCode: "invalid_authority_design_packet",
      message:
        "authority_design_packet.blocking_requirements_before_any_write must be an array.",
    });
  }
}

function assertFalseWriteFlags(value: Record<string, unknown>) {
  const proposedWriteContract = value.proposed_write_contract;
  const executionBoundary = value.execution_boundary;
  if (!isRecord(proposedWriteContract) || !isRecord(executionBoundary)) {
    throw new ManualNoteDisabledPromotionWriteAdapterValidationError({
      errorCode: "invalid_authority_design_packet",
      message: "authority_design_packet write boundary sections are invalid.",
    });
  }

  assertFalseFlag(proposedWriteContract, "actual_write_route_added");
  assertFalseFlag(proposedWriteContract, "write_adapter_implemented");
  assertFalseFlag(proposedWriteContract, "write_execution_enabled");
  for (const field of [
    "actual_promotion_allowed",
    "write_authority_granted",
    "actual_write_route_added",
    "write_adapter_implemented",
    "proof_or_evidence_writes",
    "perspective_or_canonical_writes",
    "canonical_graph_write",
    "work_item_creation",
    "provider_or_openai_calls",
    "retrieval_or_rag",
    "source_fetching",
    "external_handoff_sent",
    "design_packet_persisted",
    "browser_persistence",
  ]) {
    assertFalseFlag(executionBoundary, field);
  }
}

function assertFalseFlag(record: Record<string, unknown>, key: string) {
  if (record[key] !== false) {
    throw new ManualNoteDisabledPromotionWriteAdapterValidationError({
      errorCode: "invalid_authority_design_packet",
      message: `authority_design_packet requires ${key} to be false.`,
    });
  }
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
