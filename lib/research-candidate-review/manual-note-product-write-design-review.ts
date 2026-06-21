export const MANUAL_NOTE_PRODUCT_WRITE_DESIGN_REVIEW_VERSION =
  "manual_note_product_write_design_review.v0.1" as const;

type JsonRecord = Record<string, unknown>;

type BuildManualNoteProductWriteDesignReviewInput = {
  transactionPlan: unknown;
  abortResult: unknown;
  repoInventory?: unknown | null;
  contractTestReport?: unknown | null;
  generated_at?: string | null;
};

type CandidateProductWriteTarget = {
  target_group:
    | "claims"
    | "evidence_or_proof_records"
    | "perspective_records"
    | "canonical_graph_edges"
    | "source_verification_records"
    | "work_items"
    | "audit_records"
    | "idempotency_records"
    | "rollback_records";
  source_operation_group: string;
  future_product_record_kind: string;
  existing_repo_surface_candidates: string[];
  required_authority_before_write: string[];
  schema_status:
    | "existing_surface_candidate"
    | "requires_schema_design"
    | "unknown_requires_inventory";
  future_write_allowed_in_this_pr: false;
  product_ids_allocated_now: false;
  open_design_questions: string[];
};

type ProductWriteBoundary = {
  design_review_only: true;
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
  provider_or_openai_calls: false;
  retrieval_or_rag: false;
  source_fetching: false;
  external_handoff_sent: false;
  durable_persistence: false;
  browser_persistence: false;
};

export type ManualNoteProductWriteDesignReview = {
  review_kind: "manual_note_product_write_design_review";
  review_version: typeof MANUAL_NOTE_PRODUCT_WRITE_DESIGN_REVIEW_VERSION;
  review_fingerprint: string;
  source_transaction_plan: {
    plan_version: string | null;
    plan_fingerprint: string | null;
    plan_status: string | null;
    operation_count: number;
    commit_allowed: false;
  };
  source_abort_result: {
    result_version: string | null;
    result_fingerprint: string | null;
    result_status: string | null;
    product_write_attempted: false;
    product_write_performed: false;
  };
  design_status: "write_design_review_only";
  review_summary: string;
  candidate_product_write_targets: CandidateProductWriteTarget[];
  repo_inventory_summary: {
    scanned_paths: string[];
    likely_existing_surfaces: string[];
    likely_missing_surfaces: string[];
    ambiguous_surfaces: string[];
    inventory_limitations: string[];
  };
  required_authority_contracts: {
    explicit_operator_promotion_decision_contract: true;
    source_verification_authority_contract: true;
    proof_evidence_write_authority_contract: true;
    canonical_perspective_write_authority_contract: true;
    idempotency_storage_contract: true;
    rollback_storage_contract: true;
    review_audit_record_contract: true;
    product_write_route_contract: true;
    disabled_to_enabled_adapter_review_contract: true;
  };
  proposed_future_schema_or_migration_work: {
    idempotency_storage_surface: string;
    rollback_ledger_or_reversible_operation_log: string;
    promotion_audit_record: string;
    source_evidence_verification_records: string;
    preview_candidate_to_product_id_mapping: string;
    existing_table_candidates_discovered_by_inventory: string[];
  };
  smallest_safe_future_write_prototype: {
    prototype_name: "single_claim_candidate_fixture_write_dry_run";
    still_requires_schema_review: true;
    still_requires_operator_gate: true;
    still_requires_temp_db_only_first: true;
    still_no_normal_product_write_until_approved: true;
    allowed_future_scope: [
      "one selected claim candidate",
      "temp DB only",
      "disabled-by-default execution flag",
      "explicit rollback/idempotency/audit report",
    ];
    forbidden_future_scope: [
      "bulk promotion",
      "proof/evidence creation",
      "Perspective graph mutation",
      "work item creation",
      "provider/retrieval/source fetch",
      "external handoff",
    ];
  };
  product_write_boundary: ProductWriteBoundary;
  next_recommended_slice: "temp_db_single_claim_write_prototype_design";
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
};

type ManualNoteProductWriteDesignReviewCopySource = Omit<
  ManualNoteProductWriteDesignReview,
  "local_copy_packet"
>;

const TARGET_GROUPS: Array<{
  target_group: CandidateProductWriteTarget["target_group"];
  source_operation_group: string;
  future_product_record_kind: string;
  authority: string[];
  schema_status: CandidateProductWriteTarget["schema_status"];
  questions: string[];
  surface_terms: string[];
}> = [
  {
    target_group: "claims",
    source_operation_group: "claim_operations",
    future_product_record_kind: "canonical claim or claim-candidate product record",
    authority: [
      "explicit_operator_promotion_decision_contract",
      "canonical_perspective_write_authority_contract",
      "product_write_route_contract",
      "idempotency_storage_contract",
      "rollback_storage_contract",
      "review_audit_record_contract",
    ],
    schema_status: "unknown_requires_inventory",
    questions: [
      "Which canonical claim table or product record owns promoted manual-note claims?",
      "Which operator decision record allocates a future claim product id?",
    ],
    surface_terms: ["canonical", "claim", "promotion"],
  },
  {
    target_group: "evidence_or_proof_records",
    source_operation_group: "evidence_operations",
    future_product_record_kind: "proof/evidence product record",
    authority: [
      "source_verification_authority_contract",
      "proof_evidence_write_authority_contract",
      "product_write_route_contract",
      "idempotency_storage_contract",
      "rollback_storage_contract",
      "review_audit_record_contract",
    ],
    schema_status: "requires_schema_design",
    questions: [
      "What verified source material may become proof or evidence?",
      "Which write contract allocates proof and evidence ids after verification?",
    ],
    surface_terms: ["proof", "evidence", "source verification"],
  },
  {
    target_group: "perspective_records",
    source_operation_group: "perspective_operations",
    future_product_record_kind: "Perspective or canonical Perspective product record",
    authority: [
      "explicit_operator_promotion_decision_contract",
      "canonical_perspective_write_authority_contract",
      "product_write_route_contract",
      "idempotency_storage_contract",
      "rollback_storage_contract",
      "review_audit_record_contract",
    ],
    schema_status: "existing_surface_candidate",
    questions: [
      "Which Perspective surface owns promoted claim framing?",
      "How should preview candidates map to a future Perspective id allocation contract?",
    ],
    surface_terms: ["perspective", "canonical", "promotion"],
  },
  {
    target_group: "canonical_graph_edges",
    source_operation_group: "perspective_operations",
    future_product_record_kind: "canonical graph edge product record",
    authority: [
      "canonical_perspective_write_authority_contract",
      "product_write_route_contract",
      "idempotency_storage_contract",
      "rollback_storage_contract",
      "review_audit_record_contract",
    ],
    schema_status: "requires_schema_design",
    questions: [
      "Which graph edge kinds are allowed for promoted manual-note candidates?",
      "How are reversible graph mutations represented before normal product writes?",
    ],
    surface_terms: ["graph", "canonical", "perspective"],
  },
  {
    target_group: "source_verification_records",
    source_operation_group: "source_verification_operations",
    future_product_record_kind: "source verification authority record",
    authority: [
      "source_verification_authority_contract",
      "product_write_route_contract",
      "idempotency_storage_contract",
      "rollback_storage_contract",
      "review_audit_record_contract",
    ],
    schema_status: "requires_schema_design",
    questions: [
      "Which lane verifies source references without fetching inside this lane?",
      "What record proves source verification before proof/evidence writes?",
    ],
    surface_terms: ["source verification", "source", "evidence"],
  },
  {
    target_group: "work_items",
    source_operation_group: "work_item_operations",
    future_product_record_kind: "separate work item lane record",
    authority: [
      "explicit_operator_promotion_decision_contract",
      "product_write_route_contract",
      "review_audit_record_contract",
    ],
    schema_status: "existing_surface_candidate",
    questions: [
      "Which separate lane may create work items from follow-up candidates?",
      "How does the promotion lane prove it did not create work items directly?",
    ],
    surface_terms: ["work item", "work_item", "work"],
  },
  {
    target_group: "audit_records",
    source_operation_group: "transaction_plan_control_plane",
    future_product_record_kind: "promotion review audit record",
    authority: [
      "review_audit_record_contract",
      "explicit_operator_promotion_decision_contract",
      "product_write_route_contract",
    ],
    schema_status: "requires_schema_design",
    questions: [
      "Which audit record distinguishes preview activity from operator promotion decision history?",
      "What fields are required to replay or inspect a future product write decision?",
    ],
    surface_terms: ["audit", "promotion"],
  },
  {
    target_group: "idempotency_records",
    source_operation_group: "transaction_plan_control_plane",
    future_product_record_kind: "durable idempotency record",
    authority: [
      "idempotency_storage_contract",
      "product_write_route_contract",
      "review_audit_record_contract",
    ],
    schema_status: "requires_schema_design",
    questions: [
      "Where is the future idempotency key stored before any product write?",
      "How are preview draft, selected candidate, and operator decision inputs bound?",
    ],
    surface_terms: ["idempotency", "promotion"],
  },
  {
    target_group: "rollback_records",
    source_operation_group: "transaction_plan_control_plane",
    future_product_record_kind: "rollback ledger or reversible operation log",
    authority: [
      "rollback_storage_contract",
      "product_write_route_contract",
      "review_audit_record_contract",
    ],
    schema_status: "requires_schema_design",
    questions: [
      "Which reversible operation log is required before any future product write?",
      "How does rollback identify all product ids allocated by a future write contract?",
    ],
    surface_terms: ["rollback", "audit", "promotion"],
  },
];

export function buildManualNoteProductWriteDesignReview(
  input: BuildManualNoteProductWriteDesignReviewInput,
): ManualNoteProductWriteDesignReview {
  const transactionPlan = asRecord(input.transactionPlan);
  const abortResult = asRecord(input.abortResult);
  const inventory = normalizeRepoInventory(input.repoInventory);
  const sourceTransactionPlan = {
    plan_version: asString(transactionPlan.plan_version),
    plan_fingerprint: asString(transactionPlan.plan_fingerprint),
    plan_status: asString(transactionPlan.plan_status),
    operation_count: countOperations(transactionPlan.operation_groups),
    commit_allowed: false as const,
  };
  const sourceAbortResult = {
    result_version: asString(abortResult.result_version),
    result_fingerprint: asString(abortResult.result_fingerprint),
    result_status: asString(abortResult.result_status),
    product_write_attempted: false as const,
    product_write_performed: false as const,
  };
  const candidateTargets = TARGET_GROUPS.map((target) =>
    buildTargetRow(target, inventory),
  );
  const reviewCore: ManualNoteProductWriteDesignReviewCopySource = {
    review_kind: "manual_note_product_write_design_review",
    review_version: MANUAL_NOTE_PRODUCT_WRITE_DESIGN_REVIEW_VERSION,
    review_fingerprint: "",
    source_transaction_plan: sourceTransactionPlan,
    source_abort_result: sourceAbortResult,
    design_status: "write_design_review_only",
    review_summary:
      "Design review only: maps disabled transaction-plan operations to future product-write surfaces and authority contracts without enabling or performing writes.",
    candidate_product_write_targets: candidateTargets,
    repo_inventory_summary: inventory,
    required_authority_contracts: {
      explicit_operator_promotion_decision_contract: true,
      source_verification_authority_contract: true,
      proof_evidence_write_authority_contract: true,
      canonical_perspective_write_authority_contract: true,
      idempotency_storage_contract: true,
      rollback_storage_contract: true,
      review_audit_record_contract: true,
      product_write_route_contract: true,
      disabled_to_enabled_adapter_review_contract: true,
    },
    proposed_future_schema_or_migration_work: {
      idempotency_storage_surface:
        "Design durable idempotency storage keyed by preview draft, selected candidate ids, transaction plan fingerprint, and a future operator decision id.",
      rollback_ledger_or_reversible_operation_log:
        "Design rollback ledger or reversible operation log before enabling any product write adapter.",
      promotion_audit_record:
        "Design promotion review audit records that are distinct from preview draft activity metadata.",
      source_evidence_verification_records:
        "Design source/evidence verification records in a separate authority lane before proof/evidence writes.",
      preview_candidate_to_product_id_mapping:
        "Design mapping from preview draft and candidate ids to product ids allocated only by a future authorized write contract.",
      existing_table_candidates_discovered_by_inventory:
        inventory.likely_existing_surfaces.slice(0, 12),
    },
    smallest_safe_future_write_prototype: {
      prototype_name: "single_claim_candidate_fixture_write_dry_run",
      still_requires_schema_review: true,
      still_requires_operator_gate: true,
      still_requires_temp_db_only_first: true,
      still_no_normal_product_write_until_approved: true,
      allowed_future_scope: [
        "one selected claim candidate",
        "temp DB only",
        "disabled-by-default execution flag",
        "explicit rollback/idempotency/audit report",
      ],
      forbidden_future_scope: [
        "bulk promotion",
        "proof/evidence creation",
        "Perspective graph mutation",
        "work item creation",
        "provider/retrieval/source fetch",
        "external handoff",
      ],
    },
    product_write_boundary: productWriteBoundary(),
    next_recommended_slice: "temp_db_single_claim_write_prototype_design",
  };
  const reviewFingerprint = createManualNoteProductWriteDesignReviewFingerprint({
    ...reviewCore,
    source_transaction_plan: sourceTransactionPlan,
    source_abort_result: sourceAbortResult,
    contract_test_final_status: valueAt(input.contractTestReport, [
      "final_status",
    ]),
  });
  const review = {
    ...reviewCore,
    review_fingerprint: reviewFingerprint,
  };
  return {
    ...review,
    local_copy_packet: {
      markdown: buildManualNoteProductWriteDesignReviewMarkdown(review),
      json: buildManualNoteProductWriteDesignReviewJson(review),
      fingerprint: reviewFingerprint,
      fingerprint_algorithm: "fnv1a32_canonical_json",
      local_clipboard_only: true,
      external_handoff_sent: false,
      packet_persisted: false,
      product_write_authority_granted: false,
      actual_promotion_allowed: false,
    },
  };
}

export function buildManualNoteProductWriteDesignReviewMarkdown(
  review: ManualNoteProductWriteDesignReviewCopySource,
): string {
  const targetLines = review.candidate_product_write_targets.map(
    (target) =>
      `- ${target.target_group}: ${target.future_product_record_kind}; schema_status=${target.schema_status}; future_write_allowed_in_this_pr=false`,
  );
  return [
    "# Manual Note Product-Write Design Review",
    "",
    "Design review only.",
    "This does not perform normal product writes.",
    "This does not perform actual promotion.",
    `review_fingerprint: ${review.review_fingerprint}`,
    `source_plan_fingerprint: ${review.source_transaction_plan.plan_fingerprint}`,
    "",
    "## Candidate Product Write Targets",
    ...targetLines,
    "",
    "## Smallest Safe Future Prototype",
    review.smallest_safe_future_write_prototype.prototype_name,
    "",
    "## Boundary",
    "normal_product_write_enabled=false",
    "product_db_write=false",
    "product_ids_created=false",
  ].join("\n");
}

export function buildManualNoteProductWriteDesignReviewJson(
  review: ManualNoteProductWriteDesignReviewCopySource,
): string {
  return JSON.stringify(
    {
      review_kind: review.review_kind,
      review_version: review.review_version,
      review_fingerprint: review.review_fingerprint,
      design_status: review.design_status,
      target_groups: review.candidate_product_write_targets.map(
        (target) => target.target_group,
      ),
      product_write_boundary: review.product_write_boundary,
      next_recommended_slice: review.next_recommended_slice,
    },
    null,
    2,
  );
}

export function createManualNoteProductWriteDesignReviewFingerprint(
  input: unknown,
): string {
  return `fnv1a32:${fnv1a32(canonicalJson(stripGeneratedFields(input)))}`;
}

function buildTargetRow(
  target: (typeof TARGET_GROUPS)[number],
  inventory: ManualNoteProductWriteDesignReview["repo_inventory_summary"],
): CandidateProductWriteTarget {
  const candidates = findSurfaceCandidates(target.surface_terms, inventory);
  return {
    target_group: target.target_group,
    source_operation_group: target.source_operation_group,
    future_product_record_kind: target.future_product_record_kind,
    existing_repo_surface_candidates: candidates,
    required_authority_before_write: target.authority,
    schema_status:
      candidates.length > 0 ? target.schema_status : "unknown_requires_inventory",
    future_write_allowed_in_this_pr: false,
    product_ids_allocated_now: false,
    open_design_questions: target.questions,
  };
}

function normalizeRepoInventory(
  inventory: unknown,
): ManualNoteProductWriteDesignReview["repo_inventory_summary"] {
  const record = asRecord(inventory);
  return {
    scanned_paths: stringArray(record.scanned_paths),
    likely_existing_surfaces: stringArray(record.likely_existing_surfaces),
    likely_missing_surfaces: stringArray(record.likely_missing_surfaces),
    ambiguous_surfaces: stringArray(record.ambiguous_surfaces),
    inventory_limitations: stringArray(record.inventory_limitations),
  };
}

function findSurfaceCandidates(
  terms: string[],
  inventory: ManualNoteProductWriteDesignReview["repo_inventory_summary"],
): string[] {
  const normalizedTerms = terms.map((term) => term.toLowerCase());
  const candidates = [
    ...inventory.likely_existing_surfaces,
    ...inventory.ambiguous_surfaces,
  ].filter((surface) => {
    const normalizedSurface = surface.toLowerCase();
    return normalizedTerms.some((term) => normalizedSurface.includes(term));
  });
  return Array.from(new Set(candidates)).slice(0, 8);
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
    design_review_only: true,
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

function stringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
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
