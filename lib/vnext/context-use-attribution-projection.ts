import {
  canonicalizeProtocolValueV01,
  compareExternalRefsV01,
  createProtocolSha256V01,
  isProtocolRecordV01,
  normalizeExternalRefPrimitiveV01,
  normalizeProtocolNullableTextV01,
  normalizeProtocolTextV01,
  parseStrictIsoTimestampV01,
  protocolStringValueV01,
  rejectUnknownProtocolKeysV01,
  scanForbiddenProtocolMaterialV01,
  uniqueProtocolStringsV01,
  uniqueProtocolValuesV01,
  validateDuplicateExternalRefsPrimitiveV01,
  validateExternalRefStructureV01,
  type ProtocolJsonRecordV01,
} from "@/lib/vnext/protocol-primitives";
import { validateContextUseReviewRelationsV01 } from "@/lib/vnext/context-use-review";
import {
  CONTEXT_USE_REVIEW_ACTUALLY_USED_VALUES_V01,
  CONTEXT_USE_REVIEW_ASSESSMENTS_V01,
  CONTEXT_USE_REVIEW_PRESENTED_VALUES_V01,
  CONTEXT_USE_REVIEW_USAGE_PROVENANCE_BASES_V01,
  CONTEXT_USE_REVIEW_USAGE_PROVENANCE_VERSION_V01,
  type ContextUseReviewV01,
} from "@/types/vnext/context-use-review";
import {
  CONTEXT_USE_ATTRIBUTION_PROJECTION_CANONICALIZATION_V01,
  CONTEXT_USE_ATTRIBUTION_PROJECTION_MAX_ROWS_V01,
  CONTEXT_USE_ATTRIBUTION_PROJECTION_VERSION_V01,
  type ContextUseAttributionAuthoritySummaryV01,
  type ContextUseAttributionCompletenessV01,
  type ContextUseAttributionMaterialBoundaryV01,
  type ContextUseAttributionMissingLaneV01,
  type ContextUseAttributionProjectionV01,
  type ContextUseAttributionRowV01,
  type ContextUseAttributionValidationIssueV01,
  type ContextUseAttributionValidationResultV01,
} from "@/types/vnext/context-use-attribution-projection";
import {
  EXTERNAL_REF_TRUST_CLASSES_V01,
  type ExternalRefV01,
} from "@/types/vnext/external-ref";
import type { RunReceiptV01 } from "@/types/vnext/run-receipt";
import type { StateTransitionReceiptV01 } from "@/types/vnext/state-transition-receipt";
import {
  TASK_CONTEXT_PACKET_CURRENTNESS_STATUSES_V01,
  type TaskContextPacketSelectedEntryV01,
  type TaskContextPacketV01,
} from "@/types/vnext/task-context-packet";

const PENDING_PROJECTION_ID = "context-use-attribution:pending";
const PENDING_FINGERPRINT = "sha256:pending";
const MAX_SUMMARY_CHARACTERS = 2000;
const MAX_REFS_PER_COLLECTION = 64;

const allowedRootKeys = new Set([
  "projection_version",
  "projection_id",
  "projection_kind",
  "workspace_id",
  "project_id",
  "context_use_review",
  "later_task_run_receipt",
  "later_task_context_packet",
  "source_chain",
  "episode_review_context",
  "collection",
  "completeness",
  "rows",
  "material_boundary",
  "authority_summary",
  "integrity",
]);
const allowedReviewBindingKeys = new Set([
  "review_version",
  "review_id",
  "review_fingerprint",
]);
const allowedRunBindingKeys = new Set([
  "receipt_version",
  "receipt_id",
  "receipt_fingerprint",
]);
const allowedPacketBindingKeys = new Set([
  "packet_version",
  "packet_id",
  "packet_fingerprint",
]);
const allowedTransitionBindingKeys = new Set([
  "transition_receipt_version",
  "transition_receipt_id",
  "transition_receipt_fingerprint",
]);
const allowedSourceChainKeys = new Set([
  "prior_packet",
  "source_transition_receipt",
  "relation_validation",
]);
const allowedEpisodeReviewKeys = new Set([
  "scope",
  "presented",
  "actually_used",
  "assessment",
  "usage_provenance_status",
  "usage_provenance",
  "item_level_judgment",
]);
const allowedUsageProvenanceKeys = new Set([
  "provenance_version",
  "presented",
  "actually_used",
  "assessment",
]);
const allowedUsageProvenanceLaneKeys = new Set(["basis", "source_refs"]);
const allowedCollectionKeys = new Set([
  "bounded",
  "max_rows",
  "selected_entry_count",
  "projected_row_count",
  "truncated",
]);
const allowedCompletenessKeys = new Set([
  "status",
  "missing_lanes",
  "historical_usage_provenance_missing",
]);
const allowedRowKeys = new Set([
  "entry_id",
  "entry_kind",
  "source_ref",
  "external_ref",
  "compatibility_source_ref",
  "why_included",
  "bounded_summary",
  "currentness",
  "trust_class",
  "selected",
  "presentation",
  "actual_use",
  "citation_or_reference",
  "support_validation",
  "outcome_association",
  "causal_contribution",
  "limitations",
]);
const allowedCurrentnessKeys = new Set([
  "status",
  "as_of",
  "basis",
  "source_ref",
]);
const allowedLaneKeys = new Set([
  "status",
  "basis",
  "source_refs",
  "unknown_reason",
]);
const allowedCausalLaneKeys = new Set([
  "status",
  "basis",
  "intervention_refs",
  "unknown_reason",
]);
const allowedMaterialBoundaryKeys = new Set([
  "bounded_summaries_only",
  "max_summary_characters",
  "max_rows",
  "max_refs_per_collection",
  "raw_prompt_included",
  "raw_transcript_included",
  "raw_terminal_output_included",
  "raw_provider_output_included",
  "hidden_reasoning_included",
  "credential_or_secret_included",
  "absolute_local_path_included",
]);
const allowedAuthorityKeys = new Set([
  "is_canonical_core_record",
  "is_context_use_review",
  "is_evidence",
  "is_semantic_state",
  "is_policy",
  "is_proposal",
  "is_review_decision",
  "is_state_transition_receipt",
  "writes_database",
  "mutates_source_records",
  "selects_context",
  "creates_product_surface",
  "authorizes_execution",
  "authorizes_provider_calls",
  "authorizes_network_use",
  "authorizes_external_actuation",
  "authorizes_github_mutation",
  "authorizes_publication",
  "authorizes_merge",
  "notes",
]);
const allowedIntegrityKeys = new Set([
  "algorithm",
  "canonicalization",
  "fingerprint_scope",
  "fingerprint",
]);

const selectedEntryKinds = new Set([
  "accepted_state_ref",
  "memory_ref",
  "evidence_ref",
  "claim_ref",
  "artifact_ref",
  "proof_ref",
  "action_ref",
  "legacy_state_key_ref",
  "source_ref",
  "work_ref",
  "other_ref",
]);
const trustClasses = new Set<string>(EXTERNAL_REF_TRUST_CLASSES_V01);
const currentnessStatuses = new Set<string>(
  TASK_CONTEXT_PACKET_CURRENTNESS_STATUSES_V01,
);
const presentedValues = new Set<string>(
  CONTEXT_USE_REVIEW_PRESENTED_VALUES_V01,
);
const actuallyUsedValues = new Set<string>(
  CONTEXT_USE_REVIEW_ACTUALLY_USED_VALUES_V01,
);
const assessmentValues = new Set<string>(
  CONTEXT_USE_REVIEW_ASSESSMENTS_V01,
);
const usageProvenanceBases = new Set<string>(
  CONTEXT_USE_REVIEW_USAGE_PROVENANCE_BASES_V01,
);
const missingLaneValues = new Set<ContextUseAttributionMissingLaneV01>([
  "item_presentation",
  "item_actual_use",
  "item_citation_or_reference",
  "item_support_validation",
  "item_outcome_association",
  "item_causal_contribution",
]);

interface Accumulator {
  errors: ContextUseAttributionValidationIssueV01[];
  warnings: ContextUseAttributionValidationIssueV01[];
  blocked: boolean;
}

export interface ContextUseAttributionBuilderInputV01 {
  review: ContextUseReviewV01;
  prior_packet: TaskContextPacketV01;
  later_packet: TaskContextPacketV01;
  source_transition_receipt: StateTransitionReceiptV01;
  later_task_run_receipt: RunReceiptV01;
}

export function buildContextUseAttributionProjectionV01(
  input: ContextUseAttributionBuilderInputV01,
): ContextUseAttributionProjectionV01 {
  const relation = validateContextUseReviewRelationsV01(
    input.review,
    input.prior_packet,
    input.later_packet,
    input.source_transition_receipt,
    input.later_task_run_receipt,
  );
  if (relation.status !== "valid") {
    throw new RangeError(
      `context_use_attribution_source_relation_invalid:${relation.errors
        .map((issue) => issue.code)
        .join(",")}`,
    );
  }
  if (
    input.later_packet.selected_context.length >
    CONTEXT_USE_ATTRIBUTION_PROJECTION_MAX_ROWS_V01
  ) {
    throw new RangeError("context_use_attribution_collection_bound_exceeded");
  }

  const receiptRefs = collectRunReceiptReferenceRefsV01(
    input.later_task_run_receipt,
  );
  const rows = input.later_packet.selected_context
    .map((entry) => buildRowV01(entry, input.review, receiptRefs))
    .sort((left, right) =>
      canonicalizeProtocolValueV01(left).localeCompare(
        canonicalizeProtocolValueV01(right),
      ),
    );
  const missingLanes = new Set<ContextUseAttributionMissingLaneV01>([
    "item_actual_use",
    "item_support_validation",
    "item_outcome_association",
    "item_causal_contribution",
  ]);
  if (rows.some((row) => row.presentation.status === "unknown")) {
    missingLanes.add("item_presentation");
  }
  if (rows.some((row) => row.citation_or_reference.status === "unknown")) {
    missingLanes.add("item_citation_or_reference");
  }

  const projection: ContextUseAttributionProjectionV01 = {
    projection_version: CONTEXT_USE_ATTRIBUTION_PROJECTION_VERSION_V01,
    projection_id: PENDING_PROJECTION_ID,
    projection_kind: "derived_rebuildable_research_output",
    workspace_id: normalizeProtocolTextV01(input.review.workspace_id),
    project_id: normalizeProtocolTextV01(input.review.project_id),
    context_use_review: {
      review_version: "context_use_review.v0.1",
      review_id: normalizeProtocolTextV01(input.review.review_id),
      review_fingerprint: normalizeProtocolTextV01(
        input.review.integrity.fingerprint,
      ),
    },
    later_task_run_receipt: {
      receipt_version: "run_receipt.v0.1",
      receipt_id: normalizeProtocolTextV01(
        input.later_task_run_receipt.receipt_id,
      ),
      receipt_fingerprint: normalizeProtocolTextV01(
        input.later_task_run_receipt.integrity.fingerprint,
      ),
    },
    later_task_context_packet: packetBindingV01(input.later_packet),
    source_chain: {
      prior_packet: packetBindingV01(input.prior_packet),
      source_transition_receipt: {
        transition_receipt_version: "state_transition_receipt.v0.1",
        transition_receipt_id: normalizeProtocolTextV01(
          input.source_transition_receipt.transition_receipt_id,
        ),
        transition_receipt_fingerprint: normalizeProtocolTextV01(
          input.source_transition_receipt.integrity.fingerprint,
        ),
      },
      relation_validation: "passed",
    },
    episode_review_context: {
      scope: "packet_level_episode_review_only",
      presented: input.review.usage.presented,
      actually_used: input.review.usage.actually_used,
      assessment: input.review.assessment,
      usage_provenance_status: input.review.usage_provenance
        ? "available"
        : "historical_missing",
      usage_provenance: input.review.usage_provenance
        ? structuredClone(input.review.usage_provenance)
        : null,
      item_level_judgment: false,
    },
    collection: {
      bounded: true,
      max_rows: CONTEXT_USE_ATTRIBUTION_PROJECTION_MAX_ROWS_V01,
      selected_entry_count: input.later_packet.selected_context.length,
      projected_row_count: rows.length,
      truncated: false,
    },
    completeness: {
      status: "partial",
      missing_lanes: [...missingLanes].sort(),
      historical_usage_provenance_missing:
        input.review.usage_provenance === undefined,
    },
    rows,
    material_boundary: createContextUseAttributionMaterialBoundaryV01(),
    authority_summary: createContextUseAttributionAuthoritySummaryV01(),
    integrity: {
      algorithm: "sha256",
      canonicalization:
        CONTEXT_USE_ATTRIBUTION_PROJECTION_CANONICALIZATION_V01,
      fingerprint_scope: "projection_without_integrity_fingerprint",
      fingerprint: PENDING_FINGERPRINT,
    },
  };
  projection.projection_id = deriveContextUseAttributionProjectionIdV01(
    projection,
  );
  projection.integrity.fingerprint =
    createContextUseAttributionProjectionFingerprintV01(projection);
  const validation = validateContextUseAttributionProjectionV01(projection);
  if (validation.status !== "valid") {
    const issue = validation.errors[0];
    throw new RangeError(
      `${issue?.path ?? "$"}:${issue?.code ?? "context_use_attribution_invalid"}`,
    );
  }
  return projection;
}

export function createContextUseAttributionMaterialBoundaryV01(): ContextUseAttributionMaterialBoundaryV01 {
  return {
    bounded_summaries_only: true,
    max_summary_characters: MAX_SUMMARY_CHARACTERS,
    max_rows: CONTEXT_USE_ATTRIBUTION_PROJECTION_MAX_ROWS_V01,
    max_refs_per_collection: MAX_REFS_PER_COLLECTION,
    raw_prompt_included: false,
    raw_transcript_included: false,
    raw_terminal_output_included: false,
    raw_provider_output_included: false,
    hidden_reasoning_included: false,
    credential_or_secret_included: false,
    absolute_local_path_included: false,
  };
}

export function createContextUseAttributionAuthoritySummaryV01(): ContextUseAttributionAuthoritySummaryV01 {
  return {
    is_canonical_core_record: false,
    is_context_use_review: false,
    is_evidence: false,
    is_semantic_state: false,
    is_policy: false,
    is_proposal: false,
    is_review_decision: false,
    is_state_transition_receipt: false,
    writes_database: false,
    mutates_source_records: false,
    selects_context: false,
    creates_product_surface: false,
    authorizes_execution: false,
    authorizes_provider_calls: false,
    authorizes_network_use: false,
    authorizes_external_actuation: false,
    authorizes_github_mutation: false,
    authorizes_publication: false,
    authorizes_merge: false,
    notes: [
      "This projection is derived, rebuildable research output over exact persisted source records.",
      "Packet-level usage and assessment remain episode review context and are not item-level credit or blame.",
      "Unknown item-level use, support, outcome, and causal lanes remain unknown without exact evidence.",
    ],
  };
}

export function canonicalizeContextUseAttributionValueV01(
  value: unknown,
): string {
  return canonicalizeProtocolValueV01(value);
}

export function deriveContextUseAttributionProjectionIdV01(
  projection: ContextUseAttributionProjectionV01,
): string {
  const hash = createProtocolSha256V01(
    canonicalizeProtocolValueV01({
      ...withoutFingerprintV01(projection),
      projection_id: PENDING_PROJECTION_ID,
    }),
  );
  return `context-use-attribution:${hash.slice("sha256:".length, 30)}`;
}

export function createContextUseAttributionProjectionFingerprintV01(
  projection: ContextUseAttributionProjectionV01,
): string {
  return createProtocolSha256V01(
    canonicalizeProtocolValueV01(withoutFingerprintV01(projection)),
  );
}

export function validateContextUseAttributionProjectionV01(
  input: unknown,
): ContextUseAttributionValidationResultV01 {
  const accumulator = createAccumulator();
  const sink = issueSink(accumulator);
  scanForbiddenProtocolMaterialV01(input, "$", sink, {
    secret_material_message:
      "Secret-shaped material is forbidden in ContextUseAttributionProjection.",
    provider_specific_field_message:
      "Provider-native identifiers must remain ExternalRef values in ContextUseAttributionProjection.",
    allowed_false_invariant_fields: new Set([
      "raw_prompt_included",
      "raw_transcript_included",
      "raw_terminal_output_included",
      "raw_provider_output_included",
      "hidden_reasoning_included",
      "credential_or_secret_included",
      "absolute_local_path_included",
    ]),
    additional_forbidden_raw_field_pattern:
      /^(?:raw_provider_output|raw_terminal_(?:output|log)|terminal_(?:dump|log)|stdout|stderr|credential_dump)$/u,
  });
  scanAbsolutePathsV01(input, "$", accumulator);
  if (!isProtocolRecordV01(input)) {
    addError(
      accumulator,
      "projection_not_object",
      "$",
      "ContextUseAttributionProjection must be an object.",
    );
    return result(accumulator, null);
  }
  rejectUnknownProtocolKeysV01(
    input,
    allowedRootKeys,
    "$",
    sink,
    "unknown_core_field",
    true,
  );
  for (const key of allowedRootKeys) {
    if (input[key] === undefined) {
      addError(accumulator, `${key}_missing`, `$.${key}`, `${key} is required.`);
    }
  }
  const version = protocolStringValueV01(input.projection_version);
  if (version !== CONTEXT_USE_ATTRIBUTION_PROJECTION_VERSION_V01) {
    addError(
      accumulator,
      "unsupported_protocol_version",
      "$.projection_version",
      "Unsupported ContextUseAttributionProjection version.",
      true,
    );
  }
  requireStringV01(input.projection_id, "$.projection_id", accumulator);
  requireStringV01(input.workspace_id, "$.workspace_id", accumulator);
  requireStringV01(input.project_id, "$.project_id", accumulator);
  if (input.projection_kind !== "derived_rebuildable_research_output") {
    addError(
      accumulator,
      "projection_kind_invalid",
      "$.projection_kind",
      "Projection kind must remain derived and rebuildable.",
      true,
    );
  }
  validateBindingV01(
    input.context_use_review,
    "$.context_use_review",
    allowedReviewBindingKeys,
    [
      ["review_version", "context_use_review.v0.1"],
      ["review_id", null],
      ["review_fingerprint", "sha256"],
    ],
    accumulator,
  );
  validateBindingV01(
    input.later_task_run_receipt,
    "$.later_task_run_receipt",
    allowedRunBindingKeys,
    [
      ["receipt_version", "run_receipt.v0.1"],
      ["receipt_id", null],
      ["receipt_fingerprint", "sha256"],
    ],
    accumulator,
  );
  validateBindingV01(
    input.later_task_context_packet,
    "$.later_task_context_packet",
    allowedPacketBindingKeys,
    [
      ["packet_version", "task_context_packet.v0.1"],
      ["packet_id", null],
      ["packet_fingerprint", "sha256"],
    ],
    accumulator,
  );
  validateSourceChainV01(input.source_chain, accumulator);
  validateEpisodeReviewContextV01(input.episode_review_context, accumulator);
  validateRowsV01(input.rows, accumulator);
  validateCollectionV01(input.collection, input.rows, accumulator);
  validateCompletenessV01(input.completeness, accumulator);
  validateMaterialBoundaryV01(input.material_boundary, accumulator);
  validateAuthorityV01(input.authority_summary, accumulator);
  validateCrossSectionSemanticsV01(input, accumulator);
  validateAllExternalRefsV01(input, accumulator);
  validateDuplicateExternalRefsPrimitiveV01(input, sink);
  validateBoundsV01(input, accumulator);
  validateIntegrityV01(input, accumulator);
  return result(
    accumulator,
    version === CONTEXT_USE_ATTRIBUTION_PROJECTION_VERSION_V01
      ? CONTEXT_USE_ATTRIBUTION_PROJECTION_VERSION_V01
      : null,
  );
}

function buildRowV01(
  entry: TaskContextPacketSelectedEntryV01,
  review: ContextUseReviewV01,
  receiptRefs: ExternalRefV01[],
): ContextUseAttributionRowV01 {
  const presentationKnown =
    review.usage.presented === "yes" &&
    review.usage_provenance !== undefined &&
    review.usage_provenance.presented.basis !== "unknown" &&
    review.usage_provenance.presented.source_refs.length > 0;
  const itemRefs = [entry.external_ref, entry.compatibility_source_ref].filter(
    (value): value is ExternalRefV01 => value !== null,
  );
  const exactReferences = receiptRefs.filter((receiptRef) =>
    itemRefs.some(
      (itemRef) =>
        canonicalizeProtocolValueV01(receiptRef) ===
        canonicalizeProtocolValueV01(
          normalizeExternalRefPrimitiveV01(itemRef),
        ),
    ),
  );
  const limitations = [
    "packet_level_actual_use_not_item_level",
    "packet_level_assessment_not_item_level",
    "no_item_specific_actual_use_relation",
    "no_exact_item_support_relation",
    "no_exact_item_outcome_relation",
    "no_intervention_relation",
    ...(presentationKnown
      ? []
      : [
          review.usage_provenance
            ? "exact_packet_delivery_not_established"
            : "historical_review_missing_usage_provenance",
        ]),
    ...(exactReferences.length > 0
      ? ["reference_presence_not_support_validation"]
      : ["no_exact_run_receipt_item_reference"]),
  ];
  return {
    entry_id: normalizeProtocolTextV01(entry.entry_id),
    entry_kind: entry.entry_kind,
    source_ref: normalizeProtocolNullableTextV01(entry.source_ref),
    external_ref: entry.external_ref
      ? normalizeExternalRefPrimitiveV01(entry.external_ref)
      : null,
    compatibility_source_ref: entry.compatibility_source_ref
      ? normalizeExternalRefPrimitiveV01(entry.compatibility_source_ref)
      : null,
    why_included: normalizeProtocolTextV01(entry.why_included),
    bounded_summary: normalizeProtocolNullableTextV01(entry.bounded_summary),
    currentness: {
      status: entry.currentness.status,
      as_of: normalizeProtocolNullableTextV01(entry.currentness.as_of),
      basis: normalizeProtocolTextV01(entry.currentness.basis),
      source_ref: entry.currentness.source_ref
        ? normalizeExternalRefPrimitiveV01(entry.currentness.source_ref)
        : null,
    },
    trust_class: entry.trust_class,
    selected: true,
    presentation: presentationKnown
      ? {
          status: "yes",
          basis: "exact_packet_delivery",
          source_refs: normalizeRefsV01(
            review.usage_provenance!.presented.source_refs,
          ),
          unknown_reason: null,
        }
      : {
          status: "unknown",
          basis: "unknown",
          source_refs: [],
          unknown_reason: review.usage_provenance
            ? "exact_packet_delivery_not_established"
            : "historical_review_missing_usage_provenance",
        },
    actual_use: {
      status: "unknown",
      basis: "no_item_specific_relation",
      source_refs: [],
      unknown_reason:
        "The current RunReceipt and ContextUseReview contracts provide no exact item-specific actual-use relation.",
    },
    citation_or_reference:
      exactReferences.length > 0
        ? {
            status: "referenced",
            basis: "exact_run_receipt_reference",
            source_refs: normalizeRefsV01(exactReferences),
            unknown_reason: null,
          }
        : {
            status: "unknown",
            basis: "unknown",
            source_refs: [],
            unknown_reason:
              "No exact selected-item ExternalRef is preserved in a bounded RunReceipt reference lane.",
          },
    support_validation: {
      status: "unknown",
      basis: "no_exact_item_support_relation",
      source_refs: [],
      unknown_reason:
        "Reference presence is not support validation, and no exact item-to-claim or criterion support relation is available.",
    },
    outcome_association: {
      status: "unknown",
      basis: "no_exact_item_outcome_relation",
      source_refs: [],
      unknown_reason:
        "The exact episode binding does not establish an item-specific outcome association.",
    },
    causal_contribution: {
      status: "unknown",
      basis: "no_intervention_relation",
      intervention_refs: [],
      unknown_reason:
        "No intervention, ablation, or counterfactual relation is present.",
    },
    limitations: uniqueProtocolStringsV01(limitations),
  };
}

function collectRunReceiptReferenceRefsV01(
  receipt: RunReceiptV01,
): ExternalRefV01[] {
  return normalizeRefsV01([
    ...receipt.external_refs,
    ...receipt.source_refs,
    ...receipt.artifact_refs,
    ...receipt.observations.flatMap((item) => [
      ...item.source_refs,
      ...item.related_artifact_refs,
    ]),
    ...receipt.attestations.flatMap((item) => [
      ...item.source_refs,
      ...item.subject_refs,
    ]),
    ...receipt.changed_artifacts.flatMap((item) => [
      item.artifact_ref,
      ...item.source_refs,
    ]),
    ...receipt.commands.flatMap((item) => item.source_refs),
    ...receipt.checks.flatMap((item) => item.source_refs),
    ...receipt.skipped_checks.flatMap((item) => item.source_refs),
    ...receipt.blockers.flatMap((item) => item.source_refs),
    ...receipt.warnings.flatMap((item) => item.source_refs),
    ...receipt.gaps.flatMap((item) => item.source_refs),
    ...receipt.compatibility.external_refs,
    ...receipt.capability_coverage.flatMap((item) =>
      item.source_ref ? [item.source_ref] : [],
    ),
  ]);
}

function packetBindingV01(packet: TaskContextPacketV01) {
  return {
    packet_version: "task_context_packet.v0.1" as const,
    packet_id: normalizeProtocolTextV01(packet.packet_id),
    packet_fingerprint: normalizeProtocolTextV01(
      packet.integrity.fingerprint,
    ),
  };
}

function normalizeRefsV01(refs: ExternalRefV01[]): ExternalRefV01[] {
  return uniqueProtocolValuesV01(
    refs.map(normalizeExternalRefPrimitiveV01),
  ).sort(compareExternalRefsV01);
}

function withoutFingerprintV01(
  projection: ContextUseAttributionProjectionV01,
) {
  const copy = structuredClone(projection);
  delete (
    copy.integrity as Partial<ContextUseAttributionProjectionV01["integrity"]>
  ).fingerprint;
  return copy;
}

function createAccumulator(): Accumulator {
  return { errors: [], warnings: [], blocked: false };
}

function issueSink(accumulator: Accumulator) {
  return {
    error(code: string, path: string | null, message: string, blocked = false) {
      addError(accumulator, code, path, message, blocked);
    },
    warning(code: string, path: string | null, message: string) {
      accumulator.warnings.push({ severity: "warning", code, path, message });
    },
  };
}

function addError(
  accumulator: Accumulator,
  code: string,
  path: string | null,
  message: string,
  blocked = false,
) {
  accumulator.errors.push({ severity: "error", code, path, message });
  if (blocked) accumulator.blocked = true;
}

function result(
  accumulator: Accumulator,
  version: typeof CONTEXT_USE_ATTRIBUTION_PROJECTION_VERSION_V01 | null,
): ContextUseAttributionValidationResultV01 {
  return {
    status:
      accumulator.errors.length === 0
        ? "valid"
        : accumulator.blocked
          ? "blocked"
          : "invalid",
    normalized_protocol_version: version,
    errors: accumulator.errors,
    warnings: accumulator.warnings,
  };
}

function recordV01(
  value: unknown,
  path: string,
  accumulator: Accumulator,
): ProtocolJsonRecordV01 | null {
  if (!isProtocolRecordV01(value)) {
    addError(accumulator, "object_expected", path, "Expected an object.");
    return null;
  }
  return value;
}

function rejectNestedV01(
  value: ProtocolJsonRecordV01,
  allowed: Set<string>,
  path: string,
  accumulator: Accumulator,
) {
  rejectUnknownProtocolKeysV01(
    value,
    allowed,
    path,
    issueSink(accumulator),
    "unknown_nested_field",
    true,
  );
}

function requireStringV01(
  value: unknown,
  path: string,
  accumulator: Accumulator,
): string | null {
  const text = protocolStringValueV01(value);
  if (!text) {
    addError(accumulator, "string_missing", path, "Expected a non-empty string.");
    return null;
  }
  return text;
}

function validateShaV01(
  value: unknown,
  path: string,
  accumulator: Accumulator,
) {
  if (!/^sha256:[a-f0-9]{64}$/u.test(protocolStringValueV01(value) ?? "")) {
    addError(accumulator, "sha256_malformed", path, "Expected a SHA-256 fingerprint.");
  }
}

function validateBindingV01(
  value: unknown,
  path: string,
  allowed: Set<string>,
  fields: ReadonlyArray<readonly [string, string | null]>,
  accumulator: Accumulator,
) {
  const binding = recordV01(value, path, accumulator);
  if (!binding) return;
  rejectNestedV01(binding, allowed, path, accumulator);
  for (const [field, expected] of fields) {
    if (expected === "sha256") {
      validateShaV01(binding[field], `${path}.${field}`, accumulator);
    } else if (expected === null) {
      requireStringV01(binding[field], `${path}.${field}`, accumulator);
    } else if (binding[field] !== expected) {
      addError(
        accumulator,
        "binding_version_invalid",
        `${path}.${field}`,
        `Expected ${expected}.`,
      );
    }
  }
}

function validateSourceChainV01(value: unknown, accumulator: Accumulator) {
  const path = "$.source_chain";
  const source = recordV01(value, path, accumulator);
  if (!source) return;
  rejectNestedV01(source, allowedSourceChainKeys, path, accumulator);
  validateBindingV01(
    source.prior_packet,
    `${path}.prior_packet`,
    allowedPacketBindingKeys,
    [
      ["packet_version", "task_context_packet.v0.1"],
      ["packet_id", null],
      ["packet_fingerprint", "sha256"],
    ],
    accumulator,
  );
  validateBindingV01(
    source.source_transition_receipt,
    `${path}.source_transition_receipt`,
    allowedTransitionBindingKeys,
    [
      ["transition_receipt_version", "state_transition_receipt.v0.1"],
      ["transition_receipt_id", null],
      ["transition_receipt_fingerprint", "sha256"],
    ],
    accumulator,
  );
  if (source.relation_validation !== "passed") {
    addError(
      accumulator,
      "source_relation_not_passed",
      `${path}.relation_validation`,
      "Source relation validation must be passed.",
      true,
    );
  }
}

function validateEpisodeReviewContextV01(
  value: unknown,
  accumulator: Accumulator,
) {
  const path = "$.episode_review_context";
  const context = recordV01(value, path, accumulator);
  if (!context) return;
  rejectNestedV01(context, allowedEpisodeReviewKeys, path, accumulator);
  if (context.scope !== "packet_level_episode_review_only") {
    addError(accumulator, "review_scope_invalid", `${path}.scope`, "Review scope must remain packet-level only.", true);
  }
  if (!presentedValues.has(protocolStringValueV01(context.presented) ?? "")) {
    addError(accumulator, "presented_invalid", `${path}.presented`, "Presented value is invalid.");
  }
  if (!actuallyUsedValues.has(protocolStringValueV01(context.actually_used) ?? "")) {
    addError(accumulator, "actually_used_invalid", `${path}.actually_used`, "Actually-used value is invalid.");
  }
  if (!assessmentValues.has(protocolStringValueV01(context.assessment) ?? "")) {
    addError(accumulator, "assessment_invalid", `${path}.assessment`, "Assessment value is invalid.");
  }
  if (context.item_level_judgment !== false) {
    addError(accumulator, "item_level_judgment_forbidden", `${path}.item_level_judgment`, "Packet-level review cannot become item judgment.", true);
  }
  if (context.usage_provenance_status === "historical_missing") {
    if (context.usage_provenance !== null) {
      addError(accumulator, "historical_provenance_conflict", `${path}.usage_provenance`, "Historical missing provenance must remain null.", true);
    }
    return;
  }
  if (context.usage_provenance_status !== "available") {
    addError(accumulator, "usage_provenance_status_invalid", `${path}.usage_provenance_status`, "Usage provenance status is invalid.");
    return;
  }
  validateUsageProvenanceV01(context.usage_provenance, `${path}.usage_provenance`, accumulator);
}

function validateUsageProvenanceV01(
  value: unknown,
  path: string,
  accumulator: Accumulator,
) {
  const provenance = recordV01(value, path, accumulator);
  if (!provenance) return;
  rejectNestedV01(provenance, allowedUsageProvenanceKeys, path, accumulator);
  if (
    provenance.provenance_version !==
    CONTEXT_USE_REVIEW_USAGE_PROVENANCE_VERSION_V01
  ) {
    addError(accumulator, "usage_provenance_version_invalid", `${path}.provenance_version`, "Usage provenance version is invalid.");
  }
  for (const lane of ["presented", "actually_used", "assessment"] as const) {
    const laneValue = recordV01(provenance[lane], `${path}.${lane}`, accumulator);
    if (!laneValue) continue;
    rejectNestedV01(laneValue, allowedUsageProvenanceLaneKeys, `${path}.${lane}`, accumulator);
    const basis = protocolStringValueV01(laneValue.basis) ?? "";
    if (!usageProvenanceBases.has(basis)) {
      addError(accumulator, "usage_provenance_basis_invalid", `${path}.${lane}.basis`, "Usage provenance basis is invalid.");
    }
    validateRefArrayV01(laneValue.source_refs, `${path}.${lane}.source_refs`, accumulator);
  }
  const presented = isProtocolRecordV01(provenance.presented)
    ? provenance.presented
    : null;
  const actual = isProtocolRecordV01(provenance.actually_used)
    ? provenance.actually_used
    : null;
  const assessment = isProtocolRecordV01(provenance.assessment)
    ? provenance.assessment
    : null;
  if (
    presented &&
    ((presented.basis === "unknown" &&
      Array.isArray(presented.source_refs) &&
      presented.source_refs.length !== 0) ||
      (presented.basis !== "unknown" &&
        (!Array.isArray(presented.source_refs) ||
          presented.source_refs.length === 0)))
  ) {
    addError(
      accumulator,
      "presentation_provenance_invalid",
      `${path}.presented`,
      "Presentation provenance requires refs exactly when its basis is known.",
      true,
    );
  }
  if (
    actual &&
    !["unknown", "user_declaration"].includes(
      protocolStringValueV01(actual.basis) ?? "",
    )
  ) {
    addError(
      accumulator,
      "actual_use_provenance_unsupported",
      `${path}.actually_used.basis`,
      "Item attribution preserves actual use only as an episode-level user declaration or unknown.",
      true,
    );
  }
  if (
    assessment &&
    (assessment.basis !== "user_declaration" ||
      !Array.isArray(assessment.source_refs) ||
      assessment.source_refs.length === 0)
  ) {
    addError(
      accumulator,
      "assessment_provenance_invalid",
      `${path}.assessment`,
      "Episode assessment provenance must remain a source-linked user declaration.",
      true,
    );
  }
}

function validateCrossSectionSemanticsV01(
  input: ProtocolJsonRecordV01,
  accumulator: Accumulator,
) {
  const episode = isProtocolRecordV01(input.episode_review_context)
    ? input.episode_review_context
    : null;
  const completeness = isProtocolRecordV01(input.completeness)
    ? input.completeness
    : null;
  const rows = Array.isArray(input.rows)
    ? input.rows.filter(isProtocolRecordV01)
    : [];
  if (!episode || !completeness) return;

  const historical = episode.usage_provenance_status === "historical_missing";
  if (completeness.historical_usage_provenance_missing !== historical) {
    addError(
      accumulator,
      "historical_provenance_flag_conflict",
      "$.completeness.historical_usage_provenance_missing",
      "Completeness must preserve whether the source review omitted usage provenance.",
      true,
    );
  }
  const provenance = isProtocolRecordV01(episode.usage_provenance)
    ? episode.usage_provenance
    : null;
  const presentationProvenance =
    provenance && isProtocolRecordV01(provenance.presented)
      ? provenance.presented
      : null;
  const expectedPresentationRefs = Array.isArray(
    presentationProvenance?.source_refs,
  )
    ? normalizeRefsV01(
        presentationProvenance.source_refs.filter(
          (ref): ref is ExternalRefV01 => isProtocolRecordV01(ref),
        ) as ExternalRefV01[],
      )
    : [];

  for (const [index, row] of rows.entries()) {
    const presentation = isProtocolRecordV01(row.presentation)
      ? row.presentation
      : null;
    if (presentation?.status === "yes") {
      const rowRefs = Array.isArray(presentation.source_refs)
        ? normalizeRefsV01(
            presentation.source_refs.filter(
              (ref): ref is ExternalRefV01 => isProtocolRecordV01(ref),
            ) as ExternalRefV01[],
          )
        : [];
      if (
        historical ||
        episode.presented !== "yes" ||
        !presentationProvenance ||
        presentationProvenance.basis === "unknown" ||
        canonicalizeProtocolValueV01(rowRefs) !==
          canonicalizeProtocolValueV01(expectedPresentationRefs)
      ) {
        addError(
          accumulator,
          "item_presentation_relation_invalid",
          `$.rows[${index}].presentation`,
          "Item presentation requires the exact source review packet-delivery provenance.",
          true,
        );
      }
    }

    const reference = isProtocolRecordV01(row.citation_or_reference)
      ? row.citation_or_reference
      : null;
    if (reference?.status === "referenced") {
      const itemRefs = [row.external_ref, row.compatibility_source_ref]
        .filter(
          (ref): ref is ExternalRefV01 => isProtocolRecordV01(ref),
        )
        .map((ref) =>
          canonicalizeProtocolValueV01(
            normalizeExternalRefPrimitiveV01(ref),
          ),
        );
      const referenceRefs = Array.isArray(reference.source_refs)
        ? reference.source_refs.filter(isProtocolRecordV01)
        : [];
      if (
        referenceRefs.length === 0 ||
        referenceRefs.some(
          (ref) =>
            !itemRefs.includes(
              canonicalizeProtocolValueV01(
                normalizeExternalRefPrimitiveV01(
                  ref as unknown as ExternalRefV01,
                ),
              ),
            ),
        )
      ) {
        addError(
          accumulator,
          "item_reference_relation_invalid",
          `$.rows[${index}].citation_or_reference`,
          "Referenced status requires an exact selected-item ExternalRef.",
          true,
        );
      }
    }
  }

  const missing = Array.isArray(completeness.missing_lanes)
    ? new Set(completeness.missing_lanes)
    : new Set<unknown>();
  for (const [lane, isMissing] of [
    [
      "item_presentation",
      rows.some(
        (row) =>
          isProtocolRecordV01(row.presentation) &&
          row.presentation.status === "unknown",
      ),
    ],
    [
      "item_citation_or_reference",
      rows.some(
        (row) =>
          isProtocolRecordV01(row.citation_or_reference) &&
          row.citation_or_reference.status === "unknown",
      ),
    ],
  ] as const) {
    if (missing.has(lane) !== isMissing) {
      addError(
        accumulator,
        "completeness_lane_conflict",
        "$.completeness.missing_lanes",
        "Completeness lanes must match the derived row missingness.",
        true,
      );
    }
  }
}

function validateRowsV01(value: unknown, accumulator: Accumulator) {
  if (!Array.isArray(value)) {
    addError(accumulator, "rows_not_array", "$.rows", "Rows must be an array.");
    return;
  }
  const ids = new Set<string>();
  value.forEach((candidate, index) => {
    const path = `$.rows[${index}]`;
    const row = recordV01(candidate, path, accumulator);
    if (!row) return;
    rejectNestedV01(row, allowedRowKeys, path, accumulator);
    const entryId = requireStringV01(row.entry_id, `${path}.entry_id`, accumulator);
    if (entryId && ids.has(entryId)) {
      addError(accumulator, "duplicate_entry_id", `${path}.entry_id`, "Projection rows require unique entry IDs.", true);
    }
    if (entryId) ids.add(entryId);
    if (!selectedEntryKinds.has(protocolStringValueV01(row.entry_kind) ?? "")) {
      addError(accumulator, "entry_kind_invalid", `${path}.entry_kind`, "Entry kind is invalid.");
    }
    if (row.source_ref !== null) requireStringV01(row.source_ref, `${path}.source_ref`, accumulator);
    validateExternalRefStructureV01(row.external_ref, `${path}.external_ref`, issueSink(accumulator), true);
    validateExternalRefStructureV01(row.compatibility_source_ref, `${path}.compatibility_source_ref`, issueSink(accumulator), true);
    requireStringV01(row.why_included, `${path}.why_included`, accumulator);
    if (row.bounded_summary !== null) requireStringV01(row.bounded_summary, `${path}.bounded_summary`, accumulator);
    validateCurrentnessV01(row.currentness, `${path}.currentness`, accumulator);
    const trust = protocolStringValueV01(row.trust_class) ?? "";
    if (!trustClasses.has(trust)) addError(accumulator, "trust_class_invalid", `${path}.trust_class`, "Trust class is invalid.");
    if (isProtocolRecordV01(row.external_ref) && row.external_ref.trust_class !== trust) {
      addError(accumulator, "trust_class_conflict", `${path}.trust_class`, "Row trust class must match its ExternalRef.", true);
    }
    if (row.selected !== true) addError(accumulator, "selected_invariant_changed", `${path}.selected`, "Every row must remain selected=true.", true);
    validatePresentationLaneV01(row.presentation, `${path}.presentation`, accumulator);
    validateUnknownLaneV01(row.actual_use, `${path}.actual_use`, "no_item_specific_relation", accumulator);
    validateCitationLaneV01(row.citation_or_reference, `${path}.citation_or_reference`, accumulator);
    validateUnknownLaneV01(row.support_validation, `${path}.support_validation`, "no_exact_item_support_relation", accumulator);
    validateUnknownLaneV01(row.outcome_association, `${path}.outcome_association`, "no_exact_item_outcome_relation", accumulator);
    validateCausalLaneV01(row.causal_contribution, `${path}.causal_contribution`, accumulator);
    validateStringArrayV01(row.limitations, `${path}.limitations`, accumulator);
  });
}

function validateCurrentnessV01(
  value: unknown,
  path: string,
  accumulator: Accumulator,
) {
  const currentness = recordV01(value, path, accumulator);
  if (!currentness) return;
  rejectNestedV01(currentness, allowedCurrentnessKeys, path, accumulator);
  if (!currentnessStatuses.has(protocolStringValueV01(currentness.status) ?? "")) {
    addError(accumulator, "currentness_status_invalid", `${path}.status`, "Currentness status is invalid.");
  }
  if (currentness.as_of !== null && parseStrictIsoTimestampV01(currentness.as_of) === null) {
    addError(accumulator, "timestamp_malformed", `${path}.as_of`, "Currentness timestamp is malformed.");
  }
  requireStringV01(currentness.basis, `${path}.basis`, accumulator);
  validateExternalRefStructureV01(currentness.source_ref, `${path}.source_ref`, issueSink(accumulator), true);
}

function validatePresentationLaneV01(
  value: unknown,
  path: string,
  accumulator: Accumulator,
) {
  const lane = validateLaneShapeV01(value, path, accumulator);
  if (!lane) return;
  const refs = validateRefArrayV01(lane.source_refs, `${path}.source_refs`, accumulator);
  if (lane.status === "yes") {
    if (lane.basis !== "exact_packet_delivery" || refs.length === 0 || lane.unknown_reason !== null) {
      addError(accumulator, "presentation_basis_invalid", path, "Presented=yes requires exact packet-delivery refs and no unknown reason.", true);
    }
  } else if (lane.status === "unknown") {
    if (lane.basis !== "unknown" || refs.length !== 0 || !protocolStringValueV01(lane.unknown_reason)) {
      addError(accumulator, "presentation_unknown_invalid", path, "Unknown presentation requires no refs and an explicit reason.", true);
    }
  } else {
    addError(accumulator, "presentation_status_invalid", `${path}.status`, "Presentation status is invalid.");
  }
}

function validateCitationLaneV01(
  value: unknown,
  path: string,
  accumulator: Accumulator,
) {
  const lane = validateLaneShapeV01(value, path, accumulator);
  if (!lane) return;
  const refs = validateRefArrayV01(lane.source_refs, `${path}.source_refs`, accumulator);
  if (lane.status === "referenced") {
    if (lane.basis !== "exact_run_receipt_reference" || refs.length === 0 || lane.unknown_reason !== null) {
      addError(accumulator, "reference_basis_invalid", path, "Referenced status requires exact RunReceipt refs.", true);
    }
  } else if (lane.status === "unknown") {
    if (lane.basis !== "unknown" || refs.length !== 0 || !protocolStringValueV01(lane.unknown_reason)) {
      addError(accumulator, "reference_unknown_invalid", path, "Unknown reference status requires no refs and an explicit reason.", true);
    }
  } else {
    addError(accumulator, "reference_status_invalid", `${path}.status`, "Reference status is invalid.");
  }
}

function validateUnknownLaneV01(
  value: unknown,
  path: string,
  expectedBasis: string,
  accumulator: Accumulator,
) {
  const lane = validateLaneShapeV01(value, path, accumulator);
  if (!lane) return;
  const refs = validateRefArrayV01(lane.source_refs, `${path}.source_refs`, accumulator);
  if (
    lane.status !== "unknown" ||
    lane.basis !== expectedBasis ||
    refs.length !== 0 ||
    !protocolStringValueV01(lane.unknown_reason)
  ) {
    addError(accumulator, "unsupported_lane_claimed", path, "Unsupported item lane must remain unknown with no refs and an explicit reason.", true);
  }
}

function validateCausalLaneV01(
  value: unknown,
  path: string,
  accumulator: Accumulator,
) {
  const lane = recordV01(value, path, accumulator);
  if (!lane) return;
  rejectNestedV01(lane, allowedCausalLaneKeys, path, accumulator);
  const refs = validateRefArrayV01(lane.intervention_refs, `${path}.intervention_refs`, accumulator);
  if (
    lane.status !== "unknown" ||
    lane.basis !== "no_intervention_relation" ||
    refs.length !== 0 ||
    !protocolStringValueV01(lane.unknown_reason)
  ) {
    addError(accumulator, "causal_contribution_unsupported", path, "Causal contribution requires intervention evidence and otherwise remains unknown.", true);
  }
}

function validateLaneShapeV01(
  value: unknown,
  path: string,
  accumulator: Accumulator,
) {
  const lane = recordV01(value, path, accumulator);
  if (!lane) return null;
  rejectNestedV01(lane, allowedLaneKeys, path, accumulator);
  return lane;
}

function validateCollectionV01(
  value: unknown,
  rowsValue: unknown,
  accumulator: Accumulator,
) {
  const path = "$.collection";
  const collection = recordV01(value, path, accumulator);
  if (!collection) return;
  rejectNestedV01(collection, allowedCollectionKeys, path, accumulator);
  const rows = Array.isArray(rowsValue) ? rowsValue : [];
  if (
    collection.bounded !== true ||
    collection.max_rows !== CONTEXT_USE_ATTRIBUTION_PROJECTION_MAX_ROWS_V01 ||
    collection.truncated !== false
  ) {
    addError(accumulator, "collection_boundary_invalid", path, "Collection boundary must remain bounded and untruncated.", true);
  }
  for (const field of ["selected_entry_count", "projected_row_count"] as const) {
    if (!Number.isSafeInteger(collection[field]) || Number(collection[field]) < 0) {
      addError(accumulator, "collection_count_invalid", `${path}.${field}`, "Collection count must be a nonnegative safe integer.");
    }
  }
  if (
    collection.selected_entry_count !== rows.length ||
    collection.projected_row_count !== rows.length ||
    rows.length > CONTEXT_USE_ATTRIBUTION_PROJECTION_MAX_ROWS_V01
  ) {
    addError(accumulator, "collection_count_mismatch", path, "Collection counts must exactly match bounded rows.", true);
  }
}

function validateCompletenessV01(value: unknown, accumulator: Accumulator) {
  const path = "$.completeness";
  const completeness = recordV01(value, path, accumulator);
  if (!completeness) return;
  rejectNestedV01(completeness, allowedCompletenessKeys, path, accumulator);
  if (completeness.status !== "partial") {
    addError(accumulator, "completeness_status_invalid", `${path}.status`, "Current attribution must remain partial.", true);
  }
  const lanes = validateStringArrayV01(completeness.missing_lanes, `${path}.missing_lanes`, accumulator);
  if (
    lanes.some((lane) => !missingLaneValues.has(lane as ContextUseAttributionMissingLaneV01)) ||
    !lanes.includes("item_actual_use") ||
    !lanes.includes("item_support_validation") ||
    !lanes.includes("item_outcome_association") ||
    !lanes.includes("item_causal_contribution")
  ) {
    addError(accumulator, "completeness_missing_lanes_invalid", `${path}.missing_lanes`, "Unsupported lanes must remain explicitly missing.", true);
  }
  if (typeof completeness.historical_usage_provenance_missing !== "boolean") {
    addError(accumulator, "historical_provenance_flag_invalid", `${path}.historical_usage_provenance_missing`, "Historical provenance flag must be boolean.");
  }
}

function validateMaterialBoundaryV01(value: unknown, accumulator: Accumulator) {
  const path = "$.material_boundary";
  const boundary = recordV01(value, path, accumulator);
  if (!boundary) return;
  rejectNestedV01(boundary, allowedMaterialBoundaryKeys, path, accumulator);
  for (const [key, expected] of Object.entries(
    createContextUseAttributionMaterialBoundaryV01(),
  )) {
    if (boundary[key] !== expected) {
      addError(accumulator, "material_boundary_violation", `${path}.${key}`, "Material boundary invariant changed.", true);
    }
  }
}

function validateAuthorityV01(value: unknown, accumulator: Accumulator) {
  const path = "$.authority_summary";
  const authority = recordV01(value, path, accumulator);
  if (!authority) return;
  rejectNestedV01(authority, allowedAuthorityKeys, path, accumulator);
  validateStringArrayV01(authority.notes, `${path}.notes`, accumulator);
  for (const [key, expected] of Object.entries(
    createContextUseAttributionAuthoritySummaryV01(),
  )) {
    if (key === "notes") continue;
    if (authority[key] !== expected) {
      addError(accumulator, "authority_boundary_violation", `${path}.${key}`, "Authority flag must remain false.", true);
    }
  }
}

function validateRefArrayV01(
  value: unknown,
  path: string,
  accumulator: Accumulator,
): ProtocolJsonRecordV01[] {
  if (!Array.isArray(value)) {
    addError(accumulator, "array_expected", path, "Expected an array.");
    return [];
  }
  value.forEach((item, index) =>
    validateExternalRefStructureV01(item, `${path}[${index}]`, issueSink(accumulator)),
  );
  return value.filter(isProtocolRecordV01);
}

function validateStringArrayV01(
  value: unknown,
  path: string,
  accumulator: Accumulator,
): string[] {
  if (!Array.isArray(value)) {
    addError(accumulator, "array_expected", path, "Expected an array.");
    return [];
  }
  const strings: string[] = [];
  value.forEach((item, index) => {
    const text = requireStringV01(item, `${path}[${index}]`, accumulator);
    if (text) strings.push(text);
  });
  return strings;
}

function validateAllExternalRefsV01(
  value: unknown,
  accumulator: Accumulator,
) {
  walkV01(value, "$", (candidate, path) => {
    if (isProtocolRecordV01(candidate) && candidate.ref_version !== undefined) {
      validateExternalRefStructureV01(candidate, path, issueSink(accumulator));
    }
  });
}

function validateBoundsV01(value: unknown, accumulator: Accumulator) {
  walkV01(value, "$", (candidate, path) => {
    if (Array.isArray(candidate)) {
      const limit = path === "$.rows"
        ? CONTEXT_USE_ATTRIBUTION_PROJECTION_MAX_ROWS_V01
        : /(?:_refs|intervention_refs)$/u.test(lastPathKeyV01(path))
          ? MAX_REFS_PER_COLLECTION
          : CONTEXT_USE_ATTRIBUTION_PROJECTION_MAX_ROWS_V01;
      if (candidate.length > limit) {
        addError(accumulator, "collection_bound_exceeded", path, `Collection exceeds ${limit} items.`, true);
      }
    } else if (
      typeof candidate === "string" &&
      [
        "why_included",
        "bounded_summary",
        "basis",
        "unknown_reason",
        "limitations",
        "notes",
      ].includes(lastPathKeyV01(path)) &&
      candidate.length > MAX_SUMMARY_CHARACTERS
    ) {
      addError(accumulator, "summary_bound_exceeded", path, `Bounded text exceeds ${MAX_SUMMARY_CHARACTERS} characters.`, true);
    }
  });
}

function validateIntegrityV01(
  input: ProtocolJsonRecordV01,
  accumulator: Accumulator,
) {
  const path = "$.integrity";
  const integrity = recordV01(input.integrity, path, accumulator);
  if (!integrity) return;
  rejectNestedV01(integrity, allowedIntegrityKeys, path, accumulator);
  if (
    integrity.algorithm !== "sha256" ||
    integrity.canonicalization !==
      CONTEXT_USE_ATTRIBUTION_PROJECTION_CANONICALIZATION_V01 ||
    integrity.fingerprint_scope !== "projection_without_integrity_fingerprint"
  ) {
    addError(accumulator, "integrity_metadata_invalid", path, "Integrity metadata is invalid.");
  }
  validateShaV01(integrity.fingerprint, `${path}.fingerprint`, accumulator);
  try {
    const projection = input as unknown as ContextUseAttributionProjectionV01;
    if (
      projection.projection_id !==
      deriveContextUseAttributionProjectionIdV01(projection)
    ) {
      addError(accumulator, "projection_identity_mismatch", "$.projection_id", "Deterministic projection ID mismatch.");
    }
    if (
      integrity.fingerprint !==
      createContextUseAttributionProjectionFingerprintV01(projection)
    ) {
      addError(accumulator, "fingerprint_mismatch", `${path}.fingerprint`, "Projection fingerprint mismatch.");
    }
  } catch {
    addError(accumulator, "integrity_computation_failed", path, "Malformed projection could not be fingerprinted.");
  }
}

function scanAbsolutePathsV01(
  value: unknown,
  path: string,
  accumulator: Accumulator,
) {
  walkV01(value, path, (candidate, candidatePath) => {
    if (
      typeof candidate === "string" &&
      /^(?:file:\/\/|\/(?!\/)|[A-Za-z]:[\\/])/u.test(candidate)
    ) {
      addError(accumulator, "absolute_local_path_forbidden", candidatePath, "Absolute local paths are forbidden.", true);
    }
  });
}

function walkV01(
  value: unknown,
  path: string,
  visit: (value: unknown, path: string) => void,
) {
  visit(value, path);
  if (Array.isArray(value)) {
    value.forEach((item, index) => walkV01(item, `${path}[${index}]`, visit));
  } else if (isProtocolRecordV01(value)) {
    Object.entries(value).forEach(([key, child]) =>
      walkV01(child, `${path}.${key}`, visit),
    );
  }
}

function lastPathKeyV01(path: string) {
  return path.replace(/\[\d+\]$/u, "").split(".").at(-1) ?? "";
}
