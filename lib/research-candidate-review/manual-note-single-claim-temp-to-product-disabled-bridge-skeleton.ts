export const MANUAL_NOTE_SINGLE_CLAIM_TEMP_TO_PRODUCT_DISABLED_BRIDGE_SKELETON_VERSION =
  "manual_note_single_claim_temp_to_product_disabled_bridge_skeleton.v0.1" as const;

type JsonRecord = Record<string, unknown>;

type DisabledBridgeSkeletonInput = {
  tempToProductBridgeDesign: unknown;
  generated_at?: string | null;
};

type DisabledBridgeSkeletonStatus =
  | "single_claim_disabled_bridge_skeleton_only"
  | "blocked_before_disabled_bridge_skeleton";

type DisabledBridgeSkeletonRecommendationStatus =
  | "ready_for_disabled_bridge_skeleton_contract_tests"
  | "blocked_before_disabled_bridge_skeleton_contract_tests";

type DisabledBridgeSkeletonNextSlice =
  | "single_claim_temp_to_product_disabled_bridge_skeleton_contract_tests"
  | "single_claim_temp_to_product_bridge_design_recheck";

type ExplicitForbiddenSurfaces = {
  product_db_write: false;
  product_id_allocation: false;
  product_route: false;
  product_write_adapter_enabled: false;
  sql_execution: false;
  db_open: false;
  schema_or_migration_change: false;
  proof_evidence_write: false;
  perspective_or_canonical_graph_write: false;
  work_item_creation: false;
  source_fetch: false;
  provider_or_openai_call: false;
  retrieval_or_rag: false;
  external_handoff: false;
  browser_persistence: false;
  ui_write_action: false;
};

type DisabledBridgeSkeletonCopySource = Omit<
  ManualNoteSingleClaimTempToProductDisabledBridgeSkeleton,
  "local_copy_packet"
>;

export type ManualNoteSingleClaimTempToProductDisabledBridgeSkeleton = {
  skeleton_kind: "manual_note_single_claim_temp_to_product_disabled_bridge_skeleton";
  skeleton_version: typeof MANUAL_NOTE_SINGLE_CLAIM_TEMP_TO_PRODUCT_DISABLED_BRIDGE_SKELETON_VERSION;
  skeleton_fingerprint: string;
  source_evidence: {
    temp_to_product_bridge_design: {
      design_fingerprint: string | null;
      bridge_design_status: string | null;
      recommendation_status: string | null;
      next_recommended_slice: string | null;
      bridge_input_contract_summary: {
        selected_temp_claim_record_id: string | null;
        source_operation_id: string | null;
        source_temp_intent_id: string | null;
        temp_idempotency_key: string | null;
        gate_design_fingerprint: string | null;
        result_contract_evidence_fingerprint: string | null;
        operator_decision_status: string | null;
      };
      future_product_claim_draft_summary: {
        candidate_kind: string | null;
        source_temp_claim_record_id: string | null;
        source_operation_id: string | null;
        source_temp_intent_id: string | null;
        product_claim_id: null;
        product_claim_id_allocation_status: string | null;
        raw_manual_note_text_included: false;
        proof_id: null;
        evidence_id: null;
        perspective_id: null;
        work_item_id: null;
      };
      idempotency_design_summary: {
        key_inputs: JsonRecord;
        storage_status: string | null;
        product_idempotency_record_id: null;
        idempotency_write_executed_now: false;
      };
      rollback_design_summary: {
        strategy: string | null;
        rollback_storage_status: string | null;
        product_rollback_record_id: null;
        rollback_write_executed_now: false;
      };
      audit_design_summary: {
        records_operator_decision: string | null;
        records_gate_evidence: boolean;
        records_bridge_design_inputs: boolean;
        product_audit_record_id: null;
        audit_write_executed_now: false;
      };
      explicit_forbidden_surfaces: Record<string, boolean>;
    };
  };
  disabled_bridge_skeleton_status: DisabledBridgeSkeletonStatus;
  bridge_adapter_enabled: false;
  bridge_execution_allowed_now: false;
  product_write_allowed_now: false;
  product_db_write: false;
  product_id_allocation: false;
  disabled_adapter_boundary: {
    adapter_kind: "manual_note_single_claim_temp_to_product_disabled_bridge";
    adapter_enabled: false;
    adapter_invocation_allowed_now: false;
    adapter_execution_mode: "disabled_dry_boundary_only";
    adapter_would_accept_candidate_kind: "manual_note_single_claim";
    adapter_would_accept_one_selected_claim_only: true;
    adapter_rejects_blocked_bridge_design: true;
    adapter_rejects_missing_operator_decision: true;
    adapter_rejects_missing_product_schema_contract: true;
    adapter_rejects_missing_idempotency_storage_contract: true;
    adapter_rejects_missing_rollback_storage_contract: true;
    adapter_rejects_missing_audit_storage_contract: true;
  };
  future_product_write_intent: {
    product_claim_id: null;
    product_write_statement_count: 0;
    sql_statement_count: 0;
    db_opened: false;
    route_added: false;
    ui_action_added: false;
    execution_status: "blocked_disabled_skeleton_only";
  };
  placeholder_record_mapping: {
    product_idempotency_record_id: null;
    product_rollback_record_id: null;
    product_audit_record_id: null;
    idempotency_write_executed_now: false;
    rollback_write_executed_now: false;
    audit_write_executed_now: false;
  };
  explicit_forbidden_surfaces: ExplicitForbiddenSurfaces;
  recommendation_status: DisabledBridgeSkeletonRecommendationStatus;
  next_recommended_slice: DisabledBridgeSkeletonNextSlice;
  local_copy_packet: {
    markdown: string;
    json: string;
    fingerprint: string;
    fingerprint_algorithm: "fnv1a32_canonical_json";
    local_clipboard_only: true;
    external_handoff_sent: false;
    packet_persisted_to_product_db: false;
    adapter_enabled: false;
    bridge_execution_allowed_now: false;
    product_write_allowed_now: false;
    product_write_authority_granted: false;
  };
};

export function buildManualNoteSingleClaimTempToProductDisabledBridgeSkeleton(
  input: DisabledBridgeSkeletonInput,
): ManualNoteSingleClaimTempToProductDisabledBridgeSkeleton {
  const bridgeDesign = asRecord(input.tempToProductBridgeDesign);
  const bridgeInputContract = asRecord(bridgeDesign.bridge_input_contract);
  const futureProductClaimDraft = asRecord(bridgeDesign.future_product_claim_draft);
  const futureProductIdempotencyDesign = asRecord(
    bridgeDesign.future_product_idempotency_design,
  );
  const futureProductRollbackDesign = asRecord(
    bridgeDesign.future_product_rollback_design,
  );
  const futureProductAuditDesign = asRecord(bridgeDesign.future_product_audit_design);
  const sourceBridgeReady =
    bridgeDesign.recommendation_status === "ready_for_disabled_bridge_skeleton";
  const disabledBridgeSkeletonStatus: DisabledBridgeSkeletonStatus = sourceBridgeReady
    ? "single_claim_disabled_bridge_skeleton_only"
    : "blocked_before_disabled_bridge_skeleton";
  const recommendationStatus: DisabledBridgeSkeletonRecommendationStatus =
    sourceBridgeReady
      ? "ready_for_disabled_bridge_skeleton_contract_tests"
      : "blocked_before_disabled_bridge_skeleton_contract_tests";
  const nextRecommendedSlice: DisabledBridgeSkeletonNextSlice = sourceBridgeReady
    ? "single_claim_temp_to_product_disabled_bridge_skeleton_contract_tests"
    : "single_claim_temp_to_product_bridge_design_recheck";

  const skeletonCore: DisabledBridgeSkeletonCopySource = {
    skeleton_kind:
      "manual_note_single_claim_temp_to_product_disabled_bridge_skeleton",
    skeleton_version:
      MANUAL_NOTE_SINGLE_CLAIM_TEMP_TO_PRODUCT_DISABLED_BRIDGE_SKELETON_VERSION,
    skeleton_fingerprint: "",
    source_evidence: {
      temp_to_product_bridge_design: {
        design_fingerprint: asString(bridgeDesign.design_fingerprint),
        bridge_design_status: asString(bridgeDesign.bridge_design_status),
        recommendation_status: asString(bridgeDesign.recommendation_status),
        next_recommended_slice: asString(bridgeDesign.next_recommended_slice),
        bridge_input_contract_summary: {
          selected_temp_claim_record_id: asString(
            bridgeInputContract.selected_temp_claim_record_id,
          ),
          source_operation_id: asString(bridgeInputContract.source_operation_id),
          source_temp_intent_id: asString(
            bridgeInputContract.source_temp_intent_id,
          ),
          temp_idempotency_key: asString(bridgeInputContract.temp_idempotency_key),
          gate_design_fingerprint: asString(
            bridgeInputContract.gate_design_fingerprint,
          ),
          result_contract_evidence_fingerprint: asString(
            bridgeInputContract.result_contract_evidence_fingerprint,
          ),
          operator_decision_status: asString(
            bridgeInputContract.operator_decision_status,
          ),
        },
        future_product_claim_draft_summary: {
          candidate_kind: asString(futureProductClaimDraft.candidate_kind),
          source_temp_claim_record_id: asString(
            futureProductClaimDraft.source_temp_claim_record_id,
          ),
          source_operation_id: asString(
            futureProductClaimDraft.source_operation_id,
          ),
          source_temp_intent_id: asString(
            futureProductClaimDraft.source_temp_intent_id,
          ),
          product_claim_id: null,
          product_claim_id_allocation_status: asString(
            futureProductClaimDraft.product_claim_id_allocation_status,
          ),
          raw_manual_note_text_included: false,
          proof_id: null,
          evidence_id: null,
          perspective_id: null,
          work_item_id: null,
        },
        idempotency_design_summary: {
          key_inputs: asRecord(futureProductIdempotencyDesign.key_inputs),
          storage_status: asString(futureProductIdempotencyDesign.storage_status),
          product_idempotency_record_id: null,
          idempotency_write_executed_now: false,
        },
        rollback_design_summary: {
          strategy: asString(futureProductRollbackDesign.strategy),
          rollback_storage_status: asString(
            futureProductRollbackDesign.rollback_storage_status,
          ),
          product_rollback_record_id: null,
          rollback_write_executed_now: false,
        },
        audit_design_summary: {
          records_operator_decision: asString(
            futureProductAuditDesign.records_operator_decision,
          ),
          records_gate_evidence:
            futureProductAuditDesign.records_gate_evidence === true,
          records_bridge_design_inputs:
            futureProductAuditDesign.records_bridge_design_inputs === true,
          product_audit_record_id: null,
          audit_write_executed_now: false,
        },
        explicit_forbidden_surfaces: readBooleanRecord(
          bridgeDesign.explicit_forbidden_surfaces,
        ),
      },
    },
    disabled_bridge_skeleton_status: disabledBridgeSkeletonStatus,
    bridge_adapter_enabled: false,
    bridge_execution_allowed_now: false,
    product_write_allowed_now: false,
    product_db_write: false,
    product_id_allocation: false,
    disabled_adapter_boundary: disabledAdapterBoundary(),
    future_product_write_intent: {
      product_claim_id: null,
      product_write_statement_count: 0,
      sql_statement_count: 0,
      db_opened: false,
      route_added: false,
      ui_action_added: false,
      execution_status: "blocked_disabled_skeleton_only",
    },
    placeholder_record_mapping: {
      product_idempotency_record_id: null,
      product_rollback_record_id: null,
      product_audit_record_id: null,
      idempotency_write_executed_now: false,
      rollback_write_executed_now: false,
      audit_write_executed_now: false,
    },
    explicit_forbidden_surfaces: explicitForbiddenSurfaces(),
    recommendation_status: recommendationStatus,
    next_recommended_slice: nextRecommendedSlice,
  };
  const fingerprint =
    createManualNoteSingleClaimTempToProductDisabledBridgeSkeletonFingerprint(
      skeletonCore,
    );
  const skeleton = {
    ...skeletonCore,
    skeleton_fingerprint: fingerprint,
  };
  return {
    ...skeleton,
    local_copy_packet: {
      markdown:
        buildManualNoteSingleClaimTempToProductDisabledBridgeSkeletonMarkdown(
          skeleton,
        ),
      json: buildManualNoteSingleClaimTempToProductDisabledBridgeSkeletonJson(
        skeleton,
      ),
      fingerprint,
      fingerprint_algorithm: "fnv1a32_canonical_json",
      local_clipboard_only: true,
      external_handoff_sent: false,
      packet_persisted_to_product_db: false,
      adapter_enabled: false,
      bridge_execution_allowed_now: false,
      product_write_allowed_now: false,
      product_write_authority_granted: false,
    },
  };
}

export function buildManualNoteSingleClaimTempToProductDisabledBridgeSkeletonMarkdown(
  skeleton: DisabledBridgeSkeletonCopySource,
): string {
  return [
    "# Manual Note Single-Claim Temp-to-Product Disabled Bridge Skeleton",
    "",
    "Disabled skeleton only. It does not implement product write, enable an adapter, open DB, execute SQL, allocate product IDs, add a route, or add a UI action.",
    `disabled_bridge_skeleton_status: ${skeleton.disabled_bridge_skeleton_status}`,
    `recommendation_status: ${skeleton.recommendation_status}`,
    `source_bridge_recommendation_status: ${skeleton.source_evidence.temp_to_product_bridge_design.recommendation_status}`,
    "",
    "## Adapter Boundary",
    "adapter_kind=manual_note_single_claim_temp_to_product_disabled_bridge",
    "adapter_enabled=false",
    "adapter_invocation_allowed_now=false",
    "adapter_execution_mode=disabled_dry_boundary_only",
    "",
    "## Future Product Write Intent",
    "product_claim_id=null",
    "product_write_statement_count=0",
    "sql_statement_count=0",
    "db_opened=false",
    "route_added=false",
    "ui_action_added=false",
    "execution_status=blocked_disabled_skeleton_only",
    "",
    "## Boundary",
    "bridge_execution_allowed_now=false",
    "product_write_allowed_now=false",
    "product_db_write=false",
    "product_id_allocation=false",
    "product_route=false",
    "product_write_adapter_enabled=false",
    "sql_execution=false",
    "db_open=false",
    "schema_or_migration_change=false",
    "proof_evidence_write=false",
    "perspective_or_canonical_graph_write=false",
    "work_item_creation=false",
    "source_fetch=false",
    "provider_or_openai_call=false",
    "retrieval_or_rag=false",
    "external_handoff=false",
    "browser_persistence=false",
    "ui_write_action=false",
    "",
    "## Next",
    skeleton.next_recommended_slice,
  ].join("\n");
}

export function buildManualNoteSingleClaimTempToProductDisabledBridgeSkeletonJson(
  skeleton: DisabledBridgeSkeletonCopySource,
): string {
  return JSON.stringify(
    {
      skeleton_kind: skeleton.skeleton_kind,
      skeleton_version: skeleton.skeleton_version,
      skeleton_fingerprint: skeleton.skeleton_fingerprint,
      source_evidence: skeleton.source_evidence,
      disabled_bridge_skeleton_status:
        skeleton.disabled_bridge_skeleton_status,
      bridge_adapter_enabled: skeleton.bridge_adapter_enabled,
      bridge_execution_allowed_now: skeleton.bridge_execution_allowed_now,
      product_write_allowed_now: skeleton.product_write_allowed_now,
      disabled_adapter_boundary: skeleton.disabled_adapter_boundary,
      future_product_write_intent: skeleton.future_product_write_intent,
      placeholder_record_mapping: skeleton.placeholder_record_mapping,
      explicit_forbidden_surfaces: skeleton.explicit_forbidden_surfaces,
      recommendation_status: skeleton.recommendation_status,
      next_recommended_slice: skeleton.next_recommended_slice,
    },
    null,
    2,
  );
}

export function createManualNoteSingleClaimTempToProductDisabledBridgeSkeletonFingerprint(
  input: unknown,
): string {
  return `fnv1a32:${fnv1a32(canonicalJson(stripGeneratedFields(input)))}`;
}

function disabledAdapterBoundary() {
  return {
    adapter_kind:
      "manual_note_single_claim_temp_to_product_disabled_bridge" as const,
    adapter_enabled: false as const,
    adapter_invocation_allowed_now: false as const,
    adapter_execution_mode: "disabled_dry_boundary_only" as const,
    adapter_would_accept_candidate_kind: "manual_note_single_claim" as const,
    adapter_would_accept_one_selected_claim_only: true as const,
    adapter_rejects_blocked_bridge_design: true as const,
    adapter_rejects_missing_operator_decision: true as const,
    adapter_rejects_missing_product_schema_contract: true as const,
    adapter_rejects_missing_idempotency_storage_contract: true as const,
    adapter_rejects_missing_rollback_storage_contract: true as const,
    adapter_rejects_missing_audit_storage_contract: true as const,
  };
}

function explicitForbiddenSurfaces(): ExplicitForbiddenSurfaces {
  return {
    product_db_write: false,
    product_id_allocation: false,
    product_route: false,
    product_write_adapter_enabled: false,
    sql_execution: false,
    db_open: false,
    schema_or_migration_change: false,
    proof_evidence_write: false,
    perspective_or_canonical_graph_write: false,
    work_item_creation: false,
    source_fetch: false,
    provider_or_openai_call: false,
    retrieval_or_rag: false,
    external_handoff: false,
    browser_persistence: false,
    ui_write_action: false,
  };
}

function readBooleanRecord(value: unknown): Record<string, boolean> {
  return Object.fromEntries(
    Object.entries(asRecord(value)).map(([key, nestedValue]) => [
      key,
      nestedValue === true,
    ]),
  );
}

function stripGeneratedFields(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => stripGeneratedFields(item));
  }
  if (value && typeof value === "object") {
    const entries = Object.entries(value as JsonRecord)
      .filter(([key]) => key !== "generated_at" && key !== "local_copy_packet")
      .map(([key, nestedValue]) => [key, stripGeneratedFields(nestedValue)]);
    return Object.fromEntries(entries);
  }
  return value;
}

function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map((item) => canonicalJson(item)).join(",")}]`;
  }
  if (value && typeof value === "object") {
    const record = value as JsonRecord;
    return `{${Object.keys(record)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonicalJson(record[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

function fnv1a32(input: string): string {
  let hash = 0x811c9dc5;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

function asRecord(value: unknown): JsonRecord {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as JsonRecord;
}

function asString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}
