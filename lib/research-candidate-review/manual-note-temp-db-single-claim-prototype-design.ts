export const MANUAL_NOTE_TEMP_DB_SINGLE_CLAIM_PROTOTYPE_DESIGN_VERSION =
  "manual_note_temp_db_single_claim_prototype_design.v0.1" as const;

type JsonRecord = Record<string, unknown>;

type BuildManualNoteTempDbSingleClaimPrototypeDesignInput = {
  productWriteDesignReview: unknown;
  transactionPlan: unknown;
  abortResult: unknown;
  contractTestReport?: unknown | null;
  generated_at?: string | null;
};

type PrototypeStatus =
  | "design_only_ready_for_temp_execution_spec"
  | "blocked_by_missing_single_claim_operation"
  | "blocked_by_source_design_gap";

type GateStatus = {
  gate_id: string;
  status: "pass" | "block";
  message: string;
};

type TempSchemaObjectDefinition = {
  name:
    | "temp_claim_records"
    | "temp_idempotency_records"
    | "temp_rollback_records"
    | "temp_review_audit_records";
  purpose: string;
  required_fields: string[];
  forbidden_fields: string[];
  product_table_mirror: false;
  migration_required_now: false;
  repo_schema_changed_now: false;
};

type ProductWriteBoundary = {
  design_only: true;
  temp_db_execution_now: false;
  normal_product_write_enabled: false;
  product_db_write: false;
  actual_promotion_performed: false;
  proof_or_evidence_writes: false;
  perspective_or_canonical_writes: false;
  canonical_graph_write: false;
  work_item_creation: false;
  product_ids_created: false;
  schema_changed: false;
  migration_added: false;
  executable_sql_included: false;
  sql_executed_now: false;
  provider_or_openai_calls: false;
  retrieval_or_rag: false;
  source_fetching: false;
  external_handoff_sent: false;
  durable_persistence: false;
  browser_persistence: false;
};

type SelectedClaimOperation = {
  operation_id: string | null;
  source_temp_intent_id: string | null;
  operation_kind: string | null;
  target_kind: string | null;
  selection_rule: "first_claim_operation_from_disabled_transaction_plan_fixture";
  product_record_id: null;
  future_temp_record_id_placeholder: "temp-claim:pending";
  product_write_allowed_now: false;
  temp_write_executed_now: false;
};

export type ManualNoteTempDbSingleClaimPrototypeDesign = {
  design_kind: "manual_note_temp_db_single_claim_prototype_design";
  design_version: typeof MANUAL_NOTE_TEMP_DB_SINGLE_CLAIM_PROTOTYPE_DESIGN_VERSION;
  design_fingerprint: string;
  source_product_write_design_review: {
    review_version: string | null;
    review_fingerprint: string | null;
    design_status: string | null;
    next_recommended_slice: string | null;
  };
  source_transaction_plan: {
    plan_version: string | null;
    plan_fingerprint: string | null;
    plan_status: string | null;
    operation_count: number;
    claim_operation_count: number;
    commit_allowed: false;
  };
  source_abort_result: {
    result_version: string | null;
    result_fingerprint: string | null;
    result_status: string | null;
    product_write_attempted: false;
    product_write_performed: false;
  };
  prototype_status: PrototypeStatus;
  prototype_name: "single_claim_candidate_fixture_write_dry_run";
  selected_claim_operation: SelectedClaimOperation;
  temp_db_design: {
    temp_db_only: true;
    temp_db_file_created_now: false;
    future_temp_db_path_pattern: "/tmp/augnes-single-claim-write-prototype-v0-1/*.sqlite";
    product_db_allowed: false;
    schema_objects: [
      "temp_claim_records",
      "temp_idempotency_records",
      "temp_rollback_records",
      "temp_review_audit_records",
    ];
    schema_object_definitions: TempSchemaObjectDefinition[];
    executable_sql_included: false;
    sql_executed_now: false;
  };
  temp_claim_write_shape: {
    temp_claim_record_kind: "manual_note_single_claim_temp_record";
    source_preview_draft_id: string | null;
    source_operation_id: string | null;
    source_temp_intent_id: string | null;
    claim_candidate_text_source: "fixture_operation_metadata_only";
    raw_manual_note_text_included: false;
    product_claim_id: null;
    canonical_claim_id: null;
    proof_id: null;
    evidence_id: null;
    perspective_id: null;
    work_item_id: null;
    created_in_product_db: false;
    created_in_temp_db_now: false;
  };
  temp_idempotency_design: {
    required: true;
    idempotency_key_kind: "temp_db_single_claim_only";
    key_inputs: [
      "preview_draft_id",
      "selected_claim_operation_id",
      "transaction_plan_fingerprint",
      "product_write_design_review_fingerprint",
    ];
    storage_object: "temp_idempotency_records";
    storage_created_now: false;
    product_idempotency_storage_created_now: false;
  };
  temp_rollback_design: {
    required: true;
    rollback_object: "temp_rollback_records";
    rollback_strategy: "delete_temp_claim_record_by_temp_idempotency_key";
    rollback_executed_now: false;
    product_rollback_performed_now: false;
    storage_created_now: false;
  };
  temp_review_audit_design: {
    required: true;
    audit_object: "temp_review_audit_records";
    records_operator_decision: false;
    records_prototype_design_inputs: true;
    audit_record_created_now: false;
    product_audit_record_created_now: false;
  };
  source_evidence_authority_gap: {
    source_fetching_performed_now: false;
    source_verification_performed_now: false;
    proof_evidence_write_authority_present: false;
    required_before_any_proof_evidence_write: true;
  };
  required_gates_before_temp_execution: [
    "contract_test_report_passed",
    "transaction_plan_ready_for_abort_only_harness",
    "abort_result_aborted_before_product_write",
    "product_write_design_review_present",
    "exactly_one_claim_operation_selected",
    "temp_db_path_is_under_tmp",
    "product_db_path_absent",
    "raw_manual_note_text_absent",
    "no_provider_retrieval_source_fetch",
    "no_external_handoff",
  ];
  gates_status: GateStatus[];
  future_temp_execution_harness_spec: {
    runner_name: "run-research-candidate-temp-db-single-claim-write-prototype-v0-1.mjs";
    allowed_future_behavior: [
      "create one temp DB file under /tmp",
      "create temp-only schema objects",
      "insert one temp claim record",
      "insert one temp idempotency record",
      "insert one temp rollback record",
      "insert one temp review audit record",
      "write report JSON under /tmp",
    ];
    forbidden_future_behavior: [
      "product DB writes",
      "repo schema/migration changes",
      "proof/evidence writes",
      "Perspective/canonical graph writes",
      "work item creation",
      "provider/retrieval/source fetch",
      "external handoff",
      "normal product write",
    ];
  };
  product_write_boundary: ProductWriteBoundary;
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
  next_recommended_slice: "temp_db_single_claim_write_prototype_harness";
};

type ManualNoteTempDbSingleClaimPrototypeDesignCopySource = Omit<
  ManualNoteTempDbSingleClaimPrototypeDesign,
  "local_copy_packet"
>;

const REQUIRED_GATES = [
  "contract_test_report_passed",
  "transaction_plan_ready_for_abort_only_harness",
  "abort_result_aborted_before_product_write",
  "product_write_design_review_present",
  "exactly_one_claim_operation_selected",
  "temp_db_path_is_under_tmp",
  "product_db_path_absent",
  "raw_manual_note_text_absent",
  "no_provider_retrieval_source_fetch",
  "no_external_handoff",
] as const;

export function buildManualNoteTempDbSingleClaimPrototypeDesign(
  input: BuildManualNoteTempDbSingleClaimPrototypeDesignInput,
): ManualNoteTempDbSingleClaimPrototypeDesign {
  const productWriteDesignReview = asRecord(input.productWriteDesignReview);
  const transactionPlan = asRecord(input.transactionPlan);
  const abortResult = asRecord(input.abortResult);
  const claimOperations = arrayAt(transactionPlan, [
    "operation_groups",
    "claim_operations",
  ]);
  const selectedClaim = asRecord(claimOperations[0]);
  const contractTestPassed =
    valueAt(input.contractTestReport, ["final_status"]) === "pass" ||
    valueAt(transactionPlan, ["source_chain", "contract_test_final_status"]) ===
      "pass";
  const sourceProductWriteDesignReview = {
    review_version: asString(productWriteDesignReview.review_version),
    review_fingerprint: asString(productWriteDesignReview.review_fingerprint),
    design_status: asString(productWriteDesignReview.design_status),
    next_recommended_slice: asString(productWriteDesignReview.next_recommended_slice),
  };
  const sourceTransactionPlan = {
    plan_version: asString(transactionPlan.plan_version),
    plan_fingerprint: asString(transactionPlan.plan_fingerprint),
    plan_status: asString(transactionPlan.plan_status),
    operation_count: countOperations(transactionPlan.operation_groups),
    claim_operation_count: claimOperations.length,
    commit_allowed: false as const,
  };
  const sourceAbortResult = {
    result_version: asString(abortResult.result_version),
    result_fingerprint: asString(abortResult.result_fingerprint),
    result_status: asString(abortResult.result_status),
    product_write_attempted: false as const,
    product_write_performed: false as const,
  };
  const selectedClaimOperation: SelectedClaimOperation = {
    operation_id: asString(selectedClaim.operation_id),
    source_temp_intent_id: asString(selectedClaim.source_temp_intent_id),
    operation_kind: asString(selectedClaim.operation_kind),
    target_kind: asString(selectedClaim.target_kind),
    selection_rule: "first_claim_operation_from_disabled_transaction_plan_fixture",
    product_record_id: null,
    future_temp_record_id_placeholder: "temp-claim:pending",
    product_write_allowed_now: false,
    temp_write_executed_now: false,
  };
  const gates = buildGates({
    contractTestPassed,
    productWriteDesignReview,
    transactionPlan,
    abortResult,
    claimOperations,
  });
  const prototypeStatus = derivePrototypeStatus({
    gatesStatus: gates,
    claimOperations,
  });
  const designCore: ManualNoteTempDbSingleClaimPrototypeDesignCopySource = {
    design_kind: "manual_note_temp_db_single_claim_prototype_design",
    design_version: MANUAL_NOTE_TEMP_DB_SINGLE_CLAIM_PROTOTYPE_DESIGN_VERSION,
    design_fingerprint: "",
    source_product_write_design_review: sourceProductWriteDesignReview,
    source_transaction_plan: sourceTransactionPlan,
    source_abort_result: sourceAbortResult,
    prototype_status: prototypeStatus,
    prototype_name: "single_claim_candidate_fixture_write_dry_run",
    selected_claim_operation: selectedClaimOperation,
    temp_db_design: {
      temp_db_only: true,
      temp_db_file_created_now: false,
      future_temp_db_path_pattern:
        "/tmp/augnes-single-claim-write-prototype-v0-1/*.sqlite",
      product_db_allowed: false,
      schema_objects: [
        "temp_claim_records",
        "temp_idempotency_records",
        "temp_rollback_records",
        "temp_review_audit_records",
      ],
      schema_object_definitions: tempSchemaObjectDefinitions(),
      executable_sql_included: false,
      sql_executed_now: false,
    },
    temp_claim_write_shape: {
      temp_claim_record_kind: "manual_note_single_claim_temp_record",
      source_preview_draft_id: asString(transactionPlan.preview_draft_id),
      source_operation_id: selectedClaimOperation.operation_id,
      source_temp_intent_id: selectedClaimOperation.source_temp_intent_id,
      claim_candidate_text_source: "fixture_operation_metadata_only",
      raw_manual_note_text_included: false,
      product_claim_id: null,
      canonical_claim_id: null,
      proof_id: null,
      evidence_id: null,
      perspective_id: null,
      work_item_id: null,
      created_in_product_db: false,
      created_in_temp_db_now: false,
    },
    temp_idempotency_design: {
      required: true,
      idempotency_key_kind: "temp_db_single_claim_only",
      key_inputs: [
        "preview_draft_id",
        "selected_claim_operation_id",
        "transaction_plan_fingerprint",
        "product_write_design_review_fingerprint",
      ],
      storage_object: "temp_idempotency_records",
      storage_created_now: false,
      product_idempotency_storage_created_now: false,
    },
    temp_rollback_design: {
      required: true,
      rollback_object: "temp_rollback_records",
      rollback_strategy: "delete_temp_claim_record_by_temp_idempotency_key",
      rollback_executed_now: false,
      product_rollback_performed_now: false,
      storage_created_now: false,
    },
    temp_review_audit_design: {
      required: true,
      audit_object: "temp_review_audit_records",
      records_operator_decision: false,
      records_prototype_design_inputs: true,
      audit_record_created_now: false,
      product_audit_record_created_now: false,
    },
    source_evidence_authority_gap: {
      source_fetching_performed_now: false,
      source_verification_performed_now: false,
      proof_evidence_write_authority_present: false,
      required_before_any_proof_evidence_write: true,
    },
    required_gates_before_temp_execution: [...REQUIRED_GATES],
    gates_status: gates,
    future_temp_execution_harness_spec: {
      runner_name:
        "run-research-candidate-temp-db-single-claim-write-prototype-v0-1.mjs",
      allowed_future_behavior: [
        "create one temp DB file under /tmp",
        "create temp-only schema objects",
        "insert one temp claim record",
        "insert one temp idempotency record",
        "insert one temp rollback record",
        "insert one temp review audit record",
        "write report JSON under /tmp",
      ],
      forbidden_future_behavior: [
        "product DB writes",
        "repo schema/migration changes",
        "proof/evidence writes",
        "Perspective/canonical graph writes",
        "work item creation",
        "provider/retrieval/source fetch",
        "external handoff",
        "normal product write",
      ],
    },
    product_write_boundary: productWriteBoundary(),
    next_recommended_slice: "temp_db_single_claim_write_prototype_harness",
  };
  const designFingerprint = createManualNoteTempDbSingleClaimPrototypeDesignFingerprint(
    {
      ...designCore,
      contract_test_final_status: valueAt(input.contractTestReport, [
        "final_status",
      ]),
    },
  );
  const design = {
    ...designCore,
    design_fingerprint: designFingerprint,
  };
  return {
    ...design,
    local_copy_packet: {
      markdown: buildManualNoteTempDbSingleClaimPrototypeDesignMarkdown(design),
      json: buildManualNoteTempDbSingleClaimPrototypeDesignJson(design),
      fingerprint: designFingerprint,
      fingerprint_algorithm: "fnv1a32_canonical_json",
      local_clipboard_only: true,
      external_handoff_sent: false,
      packet_persisted: false,
      product_write_authority_granted: false,
      actual_promotion_allowed: false,
    },
  };
}

export function buildManualNoteTempDbSingleClaimPrototypeDesignMarkdown(
  design: ManualNoteTempDbSingleClaimPrototypeDesignCopySource,
): string {
  return [
    "# Manual Note Temp DB Single-Claim Prototype Design",
    "",
    "Design only. No temp DB file is created now.",
    "No normal product write is enabled.",
    `prototype_status: ${design.prototype_status}`,
    `design_fingerprint: ${design.design_fingerprint}`,
    `selected_claim_operation: ${
      design.selected_claim_operation.operation_id ?? "missing"
    }`,
    "",
    "## Temp Schema Objects",
    ...design.temp_db_design.schema_object_definitions.map(
      (object) => `- ${object.name}: ${object.purpose}`,
    ),
    "",
    "## Boundary",
    "temp_db_execution_now=false",
    "product_db_write=false",
    "executable_sql_included=false",
    "sql_executed_now=false",
  ].join("\n");
}

export function buildManualNoteTempDbSingleClaimPrototypeDesignJson(
  design: ManualNoteTempDbSingleClaimPrototypeDesignCopySource,
): string {
  return JSON.stringify(
    {
      design_kind: design.design_kind,
      design_version: design.design_version,
      design_fingerprint: design.design_fingerprint,
      prototype_status: design.prototype_status,
      selected_claim_operation: design.selected_claim_operation,
      temp_db_design: {
        temp_db_only: design.temp_db_design.temp_db_only,
        temp_db_file_created_now:
          design.temp_db_design.temp_db_file_created_now,
        schema_objects: design.temp_db_design.schema_objects,
        executable_sql_included: design.temp_db_design.executable_sql_included,
        sql_executed_now: design.temp_db_design.sql_executed_now,
      },
      product_write_boundary: design.product_write_boundary,
      next_recommended_slice: design.next_recommended_slice,
    },
    null,
    2,
  );
}

export function createManualNoteTempDbSingleClaimPrototypeDesignFingerprint(
  input: unknown,
): string {
  return `fnv1a32:${fnv1a32(canonicalJson(stripGeneratedFields(input)))}`;
}

function derivePrototypeStatus({
  gatesStatus,
  claimOperations,
}: {
  gatesStatus: GateStatus[];
  claimOperations: unknown[];
}): PrototypeStatus {
  if (claimOperations.length === 0) {
    return "blocked_by_missing_single_claim_operation";
  }
  if (claimOperations.length > 1) {
    return "blocked_by_source_design_gap";
  }
  if (!gatesStatus.every((gateStatus) => gateStatus.status === "pass")) {
    return "blocked_by_source_design_gap";
  }
  return "design_only_ready_for_temp_execution_spec";
}

function buildGates({
  contractTestPassed,
  productWriteDesignReview,
  transactionPlan,
  abortResult,
  claimOperations,
}: {
  contractTestPassed: boolean;
  productWriteDesignReview: JsonRecord;
  transactionPlan: JsonRecord;
  abortResult: JsonRecord;
  claimOperations: unknown[];
}): GateStatus[] {
  return [
    gate(
      "contract_test_report_passed",
      contractTestPassed,
      "Contract-test report or source transaction-plan chain reports pass.",
    ),
    gate(
      "transaction_plan_ready_for_abort_only_harness",
      transactionPlan.plan_status === "ready_for_abort_only_harness",
      "Disabled transaction plan is ready only for abort-only harness modeling.",
    ),
    gate(
      "abort_result_aborted_before_product_write",
      abortResult.result_status === "aborted_before_product_write",
      "Abort result confirms no product write was attempted or performed.",
    ),
    gate(
      "product_write_design_review_present",
      productWriteDesignReview.design_status === "write_design_review_only",
      "Product-write design review exists and remains design-only.",
    ),
    gate(
      "exactly_one_claim_operation_selected",
      claimOperations.length === 1,
      "The prototype selects the first and only claim operation from the fixture transaction plan.",
    ),
    gate(
      "temp_db_path_is_under_tmp",
      true,
      "Future temp DB path pattern is constrained under /tmp.",
    ),
    gate(
      "product_db_path_absent",
      true,
      "No product DB path is accepted or emitted by this design.",
    ),
    gate(
      "raw_manual_note_text_absent",
      true,
      "The temp claim shape references fixture operation metadata only.",
    ),
    gate(
      "no_provider_retrieval_source_fetch",
      true,
      "The design performs no provider, retrieval, RAG, or source fetching.",
    ),
    gate(
      "no_external_handoff",
      true,
      "The design sends no external handoff.",
    ),
  ];
}

function gate(gateId: string, passed: boolean, message: string): GateStatus {
  return {
    gate_id: gateId,
    status: passed ? "pass" : "block",
    message,
  };
}

function tempSchemaObjectDefinitions(): TempSchemaObjectDefinition[] {
  return [
    {
      name: "temp_claim_records",
      purpose:
        "Hold one future temp-only claim record derived from the selected disabled transaction-plan claim operation.",
      required_fields: [
        "temp_claim_record_id",
        "preview_draft_id",
        "source_operation_id",
        "source_temp_intent_id",
        "temp_idempotency_key",
        "created_at",
      ],
      forbidden_fields: [
        "raw_manual_note_text",
        "product_claim_id",
        "canonical_claim_id",
        "proof_id",
        "evidence_id",
        "perspective_id",
        "work_item_id",
      ],
      product_table_mirror: false,
      migration_required_now: false,
      repo_schema_changed_now: false,
    },
    {
      name: "temp_idempotency_records",
      purpose:
        "Bind the selected claim operation to a temp-only idempotency key before any future temp record write.",
      required_fields: [
        "temp_idempotency_key",
        "preview_draft_id",
        "selected_claim_operation_id",
        "transaction_plan_fingerprint",
        "product_write_design_review_fingerprint",
      ],
      forbidden_fields: ["product_idempotency_key", "product_record_id"],
      product_table_mirror: false,
      migration_required_now: false,
      repo_schema_changed_now: false,
    },
    {
      name: "temp_rollback_records",
      purpose:
        "Describe how a future temp-only claim record would be removed by temp idempotency key.",
      required_fields: [
        "temp_rollback_record_id",
        "temp_idempotency_key",
        "target_temp_claim_record_id",
        "rollback_strategy",
      ],
      forbidden_fields: ["product_rollback_id", "product_record_id"],
      product_table_mirror: false,
      migration_required_now: false,
      repo_schema_changed_now: false,
    },
    {
      name: "temp_review_audit_records",
      purpose:
        "Record prototype design inputs for future temp harness inspection without recording operator promotion approval.",
      required_fields: [
        "temp_review_audit_record_id",
        "preview_draft_id",
        "selected_claim_operation_id",
        "design_fingerprint",
        "records_operator_decision",
      ],
      forbidden_fields: [
        "operator_promotion_decision_id",
        "approval_history_id",
        "product_audit_record_id",
      ],
      product_table_mirror: false,
      migration_required_now: false,
      repo_schema_changed_now: false,
    },
  ];
}

function countOperations(operationGroups: unknown): number {
  const groups = asRecord(operationGroups);
  let total = 0;
  for (const value of Object.values(groups)) {
    if (Array.isArray(value)) total += value.length;
  }
  return total;
}

function productWriteBoundary(): ProductWriteBoundary {
  return {
    design_only: true,
    temp_db_execution_now: false,
    normal_product_write_enabled: false,
    product_db_write: false,
    actual_promotion_performed: false,
    proof_or_evidence_writes: false,
    perspective_or_canonical_writes: false,
    canonical_graph_write: false,
    work_item_creation: false,
    product_ids_created: false,
    schema_changed: false,
    migration_added: false,
    executable_sql_included: false,
    sql_executed_now: false,
    provider_or_openai_calls: false,
    retrieval_or_rag: false,
    source_fetching: false,
    external_handoff_sent: false,
    durable_persistence: false,
    browser_persistence: false,
  };
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

function arrayAt(value: unknown, path: string[]): unknown[] {
  const found = valueAt(value, path);
  return Array.isArray(found) ? found : [];
}

function valueAt(value: unknown, path: string[]): unknown {
  let current = value;
  for (const key of path) {
    if (!current || typeof current !== "object" || Array.isArray(current)) {
      return undefined;
    }
    current = (current as JsonRecord)[key];
  }
  return current;
}
