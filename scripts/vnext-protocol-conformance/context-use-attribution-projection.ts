import assert from "node:assert/strict";

import {
  contextUseAttributionSourceFixture,
  historicalContextUseAttributionSourceFixture,
} from "@/fixtures/vnext/protocol/context-use-attribution-projection-v0-1";
import {
  buildContextUseAttributionProjectionV01,
  canonicalizeContextUseAttributionValueV01,
  createContextUseAttributionProjectionFingerprintV01,
  deriveContextUseAttributionProjectionIdV01,
  validateContextUseAttributionProjectionV01,
  type ContextUseAttributionBuilderInputV01,
} from "@/lib/vnext/context-use-attribution-projection";
import {
  buildContextUseReviewV01,
  createContextUseReviewFingerprintV01,
  deriveContextUseReviewIdV01,
} from "@/lib/vnext/context-use-review";
import { buildRunReceiptV01 } from "@/lib/vnext/run-receipt";
import type { ContextUseAttributionProjectionV01 } from "@/types/vnext/context-use-attribution-projection";
import type { RunReceiptV01 } from "@/types/vnext/run-receipt";

export interface ContextUseAttributionConformanceSummaryV01 {
  suite: "context-use-attribution-projection-v0.1";
  status: "passed";
  positive_fixture_count: number;
  negative_fixture_count: number;
  relation_negative_fixture_count: number;
  projection_id: string;
  fingerprint: string;
  deterministic_projection_checked: true;
  input_immutability_checked: true;
  historical_review_compatibility_checked: true;
  packet_level_judgment_not_projected_to_items: true;
  presentation_without_use_checked: true;
  reference_without_support_checked: true;
  outcome_and_causality_unknown_checked: true;
  authority_negative_checked: true;
}

export function runContextUseAttributionConformanceV01(): ContextUseAttributionConformanceSummaryV01 {
  const frozenInput = deepFreeze(clone(contextUseAttributionSourceFixture));
  const before = canonicalizeContextUseAttributionValueV01(frozenInput);
  const projection = buildContextUseAttributionProjectionV01(frozenInput);
  const replay = buildContextUseAttributionProjectionV01(frozenInput);
  assert.equal(canonicalizeContextUseAttributionValueV01(frozenInput), before);
  assert.deepEqual(replay, projection);
  assert.equal(validateContextUseAttributionProjectionV01(projection).status, "valid");
  assert.equal(projection.rows.length, frozenInput.later_packet.selected_context.length);
  assert.equal(projection.episode_review_context.scope, "packet_level_episode_review_only");
  assert.equal(projection.episode_review_context.actually_used, "yes");
  assert.equal(projection.episode_review_context.assessment, "helpful");
  assert.equal(projection.episode_review_context.item_level_judgment, false);

  for (const row of projection.rows) {
    assert.equal(row.selected, true);
    assert.equal(row.presentation.status, "yes");
    assert.equal(row.presentation.basis, "exact_packet_delivery");
    assert.equal(row.actual_use.status, "unknown");
    assert.equal(row.actual_use.basis, "no_item_specific_relation");
    assert.equal(row.support_validation.status, "unknown");
    assert.equal(row.outcome_association.status, "unknown");
    assert.equal(row.causal_contribution.status, "unknown");
    assert.deepEqual(row.causal_contribution.intervention_refs, []);
  }
  const referencedRow = projection.rows.find(
    (row) => row.citation_or_reference.status === "referenced",
  );
  assert.ok(referencedRow);
  assert.equal(referencedRow.support_validation.status, "unknown");
  assert.ok(
    referencedRow.limitations.includes(
      "reference_presence_not_support_validation",
    ),
  );
  assert.ok(
    projection.rows.some(
      (row) => row.citation_or_reference.status === "unknown",
    ),
  );

  const historicalProjection = buildContextUseAttributionProjectionV01(
    deepFreeze(clone(historicalContextUseAttributionSourceFixture)),
  );
  assert.equal(
    historicalProjection.episode_review_context.usage_provenance_status,
    "historical_missing",
  );
  assert.equal(historicalProjection.episode_review_context.usage_provenance, null);
  assert.equal(
    historicalProjection.completeness.historical_usage_provenance_missing,
    true,
  );
  assert.ok(
    historicalProjection.rows.every(
      (row) =>
        row.presentation.status === "unknown" &&
        row.actual_use.status === "unknown",
    ),
  );

  const providerResidueRunInput = runReceiptBuilderInput(
    contextUseAttributionSourceFixture.later_task_run_receipt,
  );
  providerResidueRunInput.external_refs.push({
    ref_version: "external_ref.v0.1",
    ref_type: "provider_task_residue",
    external_id: "provider-task-residue:unrelated",
    trust_class: "provider_report",
    provider: "fixture-provider",
    observed_at:
      contextUseAttributionSourceFixture.later_task_run_receipt.recorded_at,
    source_ref: `sha256:${"d".repeat(64)}`,
  });
  const providerResidueRun = buildRunReceiptV01(providerResidueRunInput);
  const providerResidueReviewInput = contextUseReviewBuilderInput(
    contextUseAttributionSourceFixture.review,
  );
  providerResidueReviewInput.later_task_run_receipt = {
    receipt_version: providerResidueRun.receipt_version,
    receipt_id: providerResidueRun.receipt_id,
    receipt_fingerprint: providerResidueRun.integrity.fingerprint,
  };
  const providerResidueReview = buildContextUseReviewV01(
    providerResidueReviewInput,
  );
  const providerResidueProjection = buildContextUseAttributionProjectionV01({
    ...clone(contextUseAttributionSourceFixture),
    review: providerResidueReview,
    later_task_run_receipt: providerResidueRun,
  });
  assert.ok(
    providerResidueProjection.rows.every(
      (row) => row.actual_use.status === "unknown",
    ),
  );

  const validReorderedSource = clone(contextUseAttributionSourceFixture);
  const reorderedReceiptInput = runReceiptBuilderInput(
    validReorderedSource.later_task_run_receipt,
  );
  reorderedReceiptInput.external_refs.reverse();
  reorderedReceiptInput.source_refs.reverse();
  reorderedReceiptInput.verifier_refs.reverse();
  reorderedReceiptInput.checks.reverse();
  validReorderedSource.later_task_run_receipt = buildRunReceiptV01(
    reorderedReceiptInput,
  );
  assert.deepEqual(
    validReorderedSource.later_task_run_receipt,
    contextUseAttributionSourceFixture.later_task_run_receipt,
  );
  const reorderedProjection = buildContextUseAttributionProjectionV01(
    validReorderedSource,
  );
  assert.deepEqual(reorderedProjection, projection);

  const validationCases: Array<{
    name: string;
    expected_code: string;
    mutate: (value: ContextUseAttributionProjectionV01) => void;
  }> = [
    {
      name: "unknown_root",
      expected_code: "unknown_core_field",
      mutate: (value) => {
        (value as unknown as Record<string, unknown>).credit = "forbidden";
      },
    },
    {
      name: "unknown_nested",
      expected_code: "unknown_nested_field",
      mutate: (value) => {
        (value.rows[0]!.actual_use as unknown as Record<string, unknown>).confidence = 1;
      },
    },
    {
      name: "malformed_fingerprint",
      expected_code: "sha256_malformed",
      mutate: (value) => {
        value.context_use_review.review_fingerprint = "sha256:bad";
      },
    },
    {
      name: "malformed_ref",
      expected_code: "unsupported_external_ref_version",
      mutate: (value) => {
        (value.rows[0]!.external_ref as unknown as Record<string, unknown>).ref_version =
          "external_ref.v9";
      },
    },
    {
      name: "malformed_timestamp",
      expected_code: "timestamp_invalid",
      mutate: (value) => {
        value.rows[0]!.external_ref!.observed_at = "not-a-timestamp";
      },
    },
    {
      name: "secret",
      expected_code: "secret_shaped_material",
      mutate: (value) => {
        value.rows[0]!.limitations = [
          "sk-proj-abcdefghijklmnopqrstuvwxyz1234567890",
        ];
      },
    },
    {
      name: "raw_prompt",
      expected_code: "raw_prompt_shaped_field",
      mutate: (value) => {
        (value as unknown as Record<string, unknown>).raw_prompt = "forbidden";
      },
    },
    {
      name: "absolute_path",
      expected_code: "absolute_local_path_forbidden",
      mutate: (value) => {
        value.rows[0]!.limitations = ["/Users/private/work.txt"];
      },
    },
    {
      name: "authority",
      expected_code: "authority_boundary_violation",
      mutate: (value) => {
        (value.authority_summary as unknown as Record<string, unknown>).writes_database =
          true;
      },
    },
    {
      name: "unsupported_actual_use",
      expected_code: "unsupported_lane_claimed",
      mutate: (value) => {
        (value.rows[0]!.actual_use as unknown as Record<string, unknown>).status =
          "yes";
      },
    },
    {
      name: "unsupported_support",
      expected_code: "unsupported_lane_claimed",
      mutate: (value) => {
        (value.rows[0]!.support_validation as unknown as Record<string, unknown>).status =
          "validated";
      },
    },
    {
      name: "unsupported_causality",
      expected_code: "causal_contribution_unsupported",
      mutate: (value) => {
        (value.rows[0]!.causal_contribution as unknown as Record<string, unknown>).status =
          "contributed";
      },
    },
    {
      name: "presentation_relation",
      expected_code: "item_presentation_relation_invalid",
      mutate: (value) => {
        value.rows[0]!.presentation.source_refs[0]!.external_id =
          "delivery:unrelated";
      },
    },
    {
      name: "reference_relation",
      expected_code: "item_reference_relation_invalid",
      mutate: (value) => {
        const row = value.rows.find(
          (candidate) =>
            candidate.citation_or_reference.status === "referenced",
        )!;
        row.citation_or_reference.source_refs[0]!.external_id =
          "reference:unrelated";
      },
    },
    {
      name: "completeness_relation",
      expected_code: "completeness_lane_conflict",
      mutate: (value) => {
        value.completeness.missing_lanes =
          value.completeness.missing_lanes.filter(
            (lane) => lane !== "item_citation_or_reference",
          );
      },
    },
    {
      name: "historical_flag_relation",
      expected_code: "historical_provenance_flag_conflict",
      mutate: (value) => {
        value.completeness.historical_usage_provenance_missing = true;
      },
    },
  ];
  for (const item of validationCases) {
    const mutated = clone(projection);
    item.mutate(mutated);
    resignProjection(mutated);
    const validation = validateContextUseAttributionProjectionV01(mutated);
    assert.notEqual(validation.status, "valid", item.name);
    assert.ok(
      validation.errors.some((issue) => issue.code === item.expected_code),
      `${item.name}: ${JSON.stringify(validation)}`,
    );
  }

  const oversized = clone(projection);
  oversized.rows = Array.from({ length: 129 }, (_, index) => ({
    ...clone(projection.rows[index % projection.rows.length]!),
    entry_id: `context-use-attribution-bound:${index}`,
  }));
  oversized.collection.selected_entry_count = oversized.rows.length;
  oversized.collection.projected_row_count = oversized.rows.length;
  resignProjection(oversized);
  const oversizedValidation = validateContextUseAttributionProjectionV01(oversized);
  assert.equal(oversizedValidation.status, "blocked");
  assert.ok(
    oversizedValidation.errors.some(
      (issue) => issue.code === "collection_bound_exceeded",
    ),
  );

  const relationCases: Array<{
    name: string;
    input: ContextUseAttributionBuilderInputV01;
    expected_code: string;
  }> = [];
  const workspaceMismatch = clone(contextUseAttributionSourceFixture);
  workspaceMismatch.review.workspace_id = "workspace:foreign";
  resignReview(workspaceMismatch.review);
  relationCases.push({
    name: "workspace_mismatch",
    input: workspaceMismatch,
    expected_code: "workspace_mismatch",
  });
  const projectMismatch = clone(contextUseAttributionSourceFixture);
  projectMismatch.review.project_id = "project:foreign";
  resignReview(projectMismatch.review);
  relationCases.push({
    name: "project_mismatch",
    input: projectMismatch,
    expected_code: "project_mismatch",
  });
  const reviewReceiptMismatch = clone(contextUseAttributionSourceFixture);
  reviewReceiptMismatch.review.later_task_run_receipt.receipt_fingerprint =
    `sha256:${"b".repeat(64)}`;
  resignReview(reviewReceiptMismatch.review);
  relationCases.push({
    name: "review_receipt_fingerprint_mismatch",
    input: reviewReceiptMismatch,
    expected_code: "run_receipt_binding_mismatch",
  });
  const receiptPacketMismatch = clone(contextUseAttributionSourceFixture);
  receiptPacketMismatch.review.later_packet.packet_fingerprint =
    `sha256:${"c".repeat(64)}`;
  resignReview(receiptPacketMismatch.review);
  relationCases.push({
    name: "receipt_packet_mismatch",
    input: receiptPacketMismatch,
    expected_code: "later_packet_binding_mismatch",
  });
  const invalidSourceChain = clone(contextUseAttributionSourceFixture);
  invalidSourceChain.prior_packet = clone(
    contextUseAttributionSourceFixture.later_packet,
  );
  invalidSourceChain.review.prior_packet = {
    packet_version: invalidSourceChain.prior_packet.packet_version,
    packet_id: invalidSourceChain.prior_packet.packet_id,
    packet_fingerprint: invalidSourceChain.prior_packet.integrity.fingerprint,
  };
  resignReview(invalidSourceChain.review);
  relationCases.push({
    name: "invalid_source_chain",
    input: invalidSourceChain,
    expected_code: "packet_transition_relation_invalid",
  });
  for (const item of relationCases) {
    assert.throws(
      () => buildContextUseAttributionProjectionV01(item.input),
      new RegExp(item.expected_code),
      item.name,
    );
  }

  for (const [key, flag] of Object.entries(projection.authority_summary)) {
    if (key !== "notes") assert.equal(flag, false, key);
  }
  for (const [key, flag] of Object.entries(projection.material_boundary)) {
    if (typeof flag === "boolean" && key !== "bounded_summaries_only") {
      assert.equal(flag, false, key);
    }
  }

  return {
    suite: "context-use-attribution-projection-v0.1",
    status: "passed",
    positive_fixture_count: 5,
    negative_fixture_count: validationCases.length + 1,
    relation_negative_fixture_count: relationCases.length,
    projection_id: projection.projection_id,
    fingerprint: projection.integrity.fingerprint,
    deterministic_projection_checked: true,
    input_immutability_checked: true,
    historical_review_compatibility_checked: true,
    packet_level_judgment_not_projected_to_items: true,
    presentation_without_use_checked: true,
    reference_without_support_checked: true,
    outcome_and_causality_unknown_checked: true,
    authority_negative_checked: true,
  };
}

function resignProjection(projection: ContextUseAttributionProjectionV01) {
  projection.projection_id = deriveContextUseAttributionProjectionIdV01(projection);
  projection.integrity.fingerprint =
    createContextUseAttributionProjectionFingerprintV01(projection);
  return projection;
}

function resignReview(
  review: ContextUseAttributionBuilderInputV01["review"],
) {
  review.review_id = deriveContextUseReviewIdV01(review);
  review.integrity.fingerprint = createContextUseReviewFingerprintV01(review);
  return review;
}

function runReceiptBuilderInput(receipt: RunReceiptV01) {
  const {
    receipt_version: _version,
    receipt_id: _id,
    trust_summary: _trust,
    authority_summary,
    idempotency_key: _key,
    integrity: _integrity,
    ...input
  } = clone(receipt);
  return { ...input, authority_notes: authority_summary.notes };
}

function contextUseReviewBuilderInput(
  review: ContextUseAttributionBuilderInputV01["review"],
) {
  const {
    review_version: _version,
    review_id: _id,
    material_boundary: _boundary,
    authority_summary,
    integrity: _integrity,
    ...input
  } = clone(review);
  return { ...input, authority_notes: authority_summary.notes };
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value as Record<string, unknown>)) {
      deepFreeze(child);
    }
  }
  return value;
}
