import assert from "node:assert/strict";

import {
  contextUseReviewInputFixture,
  contextUseReviewLaterTaskRunReceiptFixture,
  contextUseReviewTransitionLoopFixture,
} from "@/fixtures/vnext/protocol/context-use-review-v0-1";
import {
  buildContextUseReviewV01,
  canonicalizeContextUseReviewValueV01,
  createContextUseReviewFingerprintV01,
  deriveContextUseReviewIdV01,
  validateContextUseReviewRelationsV01,
  validateContextUseReviewV01,
  type ContextUseReviewBuilderInputV01,
} from "@/lib/vnext/context-use-review";
import { buildRunReceiptV01 } from "@/lib/vnext/run-receipt";
import type { ContextUseReviewV01 } from "@/types/vnext/context-use-review";
import type { RunReceiptV01 } from "@/types/vnext/run-receipt";

const FIXED_CONTEXT_USE_REVIEW_ID =
  "context-use-review:c0854b99726bb108b66313eb";
const FIXED_CONTEXT_USE_REVIEW_FINGERPRINT =
  "sha256:e31f80b818169e429b55a9e2b95e513ec20e565a00b4009f42ed288ceed686a3";

export interface ContextUseReviewConformanceSummaryV01 {
  suite: "context-use-review-v0.1";
  status: "passed";
  positive_fixture_count: number;
  negative_fixture_count: number;
  relation_negative_fixture_count: number;
  review_id: string;
  fingerprint: string;
  exact_cross_contract_bindings_checked: true;
  reviewer_authentication_not_identity_proof: true;
  deterministic_normalization_checked: true;
  builder_input_immutability_checked: true;
  strict_material_and_authority_boundary_checked: true;
  no_automatic_semantic_mutation: true;
}

export function runContextUseReviewConformanceV01(): ContextUseReviewConformanceSummaryV01 {
  const frozenInput = deepFreeze(clone(contextUseReviewInputFixture));
  const before = canonicalizeContextUseReviewValueV01(frozenInput);
  const review = buildContextUseReviewV01(frozenInput);
  assert.equal(canonicalizeContextUseReviewValueV01(frozenInput), before);
  assert.equal(validateContextUseReviewV01(review).status, "valid");
  assertRelationValid(review);

  const unknownInput = clone(contextUseReviewInputFixture);
  unknownInput.usage = { presented: "unknown", actually_used: "unknown" };
  unknownInput.assessment = "not_applicable";
  unknownInput.corrections = { correction_count: 0, summaries: [] };
  unknownInput.metrics = {
    wrong_context_correction_count: null,
    repeated_explanation_estimate: null,
    missing_critical_context_count: null,
    context_refs_used_count: null,
  };
  const unknown = buildContextUseReviewV01(deepFreeze(unknownInput));
  assert.equal(validateContextUseReviewV01(unknown).status, "valid");
  assertRelationValid(unknown);
  assert.equal(unknown.usage.actually_used, "unknown");

  const maxInput = clone(contextUseReviewInputFixture);
  maxInput.notes = ["x".repeat(2000)];
  const maxReview = buildContextUseReviewV01(deepFreeze(maxInput));
  assert.equal(validateContextUseReviewV01(maxReview).status, "valid");

  const normalizationInput = clone(contextUseReviewInputFixture);
  normalizationInput.notes.push("A second deterministic note.");
  normalizationInput.reviewer_authentication_basis_refs.push({
    ref_version: "external_ref.v0.1",
    ref_type: "local_operator_session_action",
    external_id: "session:context-use-review-secondary",
    trust_class: "direct_local_observation",
    observed_at: normalizationInput.reviewed_at,
    source_ref: `sha256:${"b".repeat(64)}`,
  });
  const normalized = buildContextUseReviewV01(deepFreeze(clone(normalizationInput)));
  normalizationInput.notes.reverse();
  normalizationInput.reviewer_authentication_basis_refs.reverse();
  normalizationInput.compatibility.source_contracts.reverse();
  const reordered = buildContextUseReviewV01(deepFreeze(normalizationInput));
  assert.deepEqual(reordered, normalized);

  const standaloneCases: Array<{
    name: string;
    code: string;
    mutate: (value: ContextUseReviewV01) => unknown;
  }> = [
    caseOf("unsupported_version", "unsupported_protocol_version", (v) => { (v as unknown as Record<string, unknown>).review_version = "context_use_review.v9"; }),
    caseOf("missing_identity", "string_missing", (v) => { v.workspace_id = ""; }),
    caseOf("unknown_root", "unknown_core_field", (v) => { (v as unknown as Record<string, unknown>).github_pr_id = "123"; }),
    caseOf("unknown_nested", "unknown_nested_field", (v) => { (v.usage as unknown as Record<string, unknown>).helpfulness = true; }),
    caseOf("raw_prompt", "raw_prompt_shaped_field", (v) => { (v as unknown as Record<string, unknown>).raw_prompt = "forbidden"; }),
    caseOf("secret", "secret_shaped_material", (v) => { v.notes = ["sk-proj-abcdefghijklmnopqrstuvwxyz1234567890"]; }),
    caseOf("absolute_path", "absolute_local_path_forbidden", (v) => { v.notes = ["/Users/example/private.txt"]; }),
    caseOf("timestamp", "timestamp_malformed", (v) => { v.reviewed_at = "not-a-time"; }),
    caseOf("reviewer_trust", "reviewer_trust_class_invalid", (v) => { v.reviewer_ref.trust_class = "imported_unverified"; }),
    caseOf("basis_trust", "reviewer_authentication_basis_trust_invalid", (v) => { v.reviewer_authentication_basis_refs[0]!.trust_class = "user_declaration"; }),
    caseOf("use_without_presentation", "use_without_presentation", (v) => { v.usage.presented = "unknown"; }),
    caseOf("helpful_without_use", "helpful_without_use", (v) => { v.usage.actually_used = "no"; }),
    caseOf("correction_count", "correction_count_mismatch", (v) => { v.corrections.correction_count = 0; }),
    caseOf("negative_metric", "nonnegative_integer_or_unknown_required", (v) => { v.metrics.wrong_context_correction_count = -1; }),
    caseOf("refs_without_use", "context_refs_used_without_use", (v) => { v.assessment = "not_applicable"; v.usage.actually_used = "no"; }),
    caseOf("authority_claim", "authority_boundary_violation", (v) => { (v.authority_summary as unknown as Record<string, unknown>).writes_database = true; }),
    caseOf("oversized_note", "summary_bound_exceeded", (v) => { v.notes = ["x".repeat(2001)]; }),
    caseOf("malformed_ref", "unsupported_external_ref_version", (v) => { (v as unknown as Record<string, unknown>).reviewer_ref = {}; }),
    caseOf("id_mismatch", "review_identity_mismatch", (v) => { v.review_id = "context-use-review:wrong"; }),
    caseOf("fingerprint_mismatch", "fingerprint_mismatch", (v) => { v.integrity.fingerprint = `sha256:${"f".repeat(64)}`; }),
  ];
  for (const item of standaloneCases) {
    const validation = validateContextUseReviewV01(item.mutate(review));
    assert.notEqual(validation.status, "valid", item.name);
    assert.ok(validation.errors.some((issue) => issue.code === item.code), `${item.name}: ${JSON.stringify(validation)}`);
  }

  const resigned = clone(review);
  (resigned.authority_summary as unknown as Record<string, unknown>).creates_correction_proposal = true;
  resign(resigned);
  const resignedValidation = validateContextUseReviewV01(resigned);
  assert.equal(resignedValidation.status, "blocked");
  assert.ok(resignedValidation.errors.some((issue) => issue.code === "authority_boundary_violation"));

  const relationCases = buildRelationCases(review);
  for (const item of relationCases) {
    const validation = validateContextUseReviewRelationsV01(
      item.review, item.prior, item.later, item.transition, item.run,
    );
    assert.notEqual(validation.status, "valid", item.name);
    assert.ok(validation.errors.some((issue) => issue.code === item.code), `${item.name}: ${JSON.stringify(validation)}`);
  }
  let malformedRelation:
    | ReturnType<typeof validateContextUseReviewRelationsV01>
    | undefined;
  assert.doesNotThrow(() => {
    malformedRelation = validateContextUseReviewRelationsV01(
      {}, {}, {}, {}, {},
    );
  });
  assert.notEqual(malformedRelation!.status, "valid");
  assert.ok(
    malformedRelation!.errors.some(
      (issue) => issue.code === "prior_packet_invalid",
    ),
  );

  assert.equal(review.review_id, FIXED_CONTEXT_USE_REVIEW_ID);
  assert.equal(review.integrity.fingerprint, FIXED_CONTEXT_USE_REVIEW_FINGERPRINT);
  assert.equal(review.authority_summary.contract_validation_authenticates_reviewer, false);
  assert.equal(review.authority_summary.construction_proves_real_review, false);
  assert.equal(review.authority_summary.creates_correction_proposal, false);
  assert.equal(review.authority_summary.applies_state_transition, false);
  assert.equal(review.authority_summary.accepts_evidence, false);
  assert.equal(review.authority_summary.mutates_perspective, false);
  assert.equal(review.authority_summary.promotes_reviewed_memory, false);
  assert.equal(review.authority_summary.closes_work, false);

  return {
    suite: "context-use-review-v0.1",
    status: "passed",
    positive_fixture_count: 4,
    negative_fixture_count: standaloneCases.length + 1,
    relation_negative_fixture_count: relationCases.length + 1,
    review_id: review.review_id,
    fingerprint: review.integrity.fingerprint,
    exact_cross_contract_bindings_checked: true,
    reviewer_authentication_not_identity_proof: true,
    deterministic_normalization_checked: true,
    builder_input_immutability_checked: true,
    strict_material_and_authority_boundary_checked: true,
    no_automatic_semantic_mutation: true,
  };
}

function assertRelationValid(review: ContextUseReviewV01) {
  const validation = validateContextUseReviewRelationsV01(
    review,
    contextUseReviewTransitionLoopFixture.prior_packet,
    contextUseReviewTransitionLoopFixture.later_packet,
    contextUseReviewTransitionLoopFixture.transition_receipt,
    contextUseReviewLaterTaskRunReceiptFixture,
  );
  assert.equal(validation.status, "valid", JSON.stringify(validation));
}

function buildRelationCases(review: ContextUseReviewV01) {
  const chain = contextUseReviewTransitionLoopFixture;
  const base = {
    review, prior: chain.prior_packet, later: chain.later_packet,
    transition: chain.transition_receipt,
    run: contextUseReviewLaterTaskRunReceiptFixture,
  };
  const cases: Array<typeof base & { name: string; code: string }> = [];
  const changedWorkspace = clone(review); changedWorkspace.workspace_id = "workspace:foreign"; resign(changedWorkspace);
  cases.push({ ...base, name: "workspace_mismatch", code: "workspace_mismatch", review: changedWorkspace });
  const changedProject = clone(review); changedProject.project_id = "project:foreign"; resign(changedProject);
  cases.push({ ...base, name: "project_mismatch", code: "project_mismatch", review: changedProject });
  const priorBinding = clone(review); priorBinding.prior_packet.packet_id = "task-context-packet:foreign"; resign(priorBinding);
  cases.push({ ...base, name: "prior_binding", code: "prior_packet_binding_mismatch", review: priorBinding });
  const laterBinding = clone(review); laterBinding.later_packet.packet_fingerprint = `sha256:${"c".repeat(64)}`; resign(laterBinding);
  cases.push({ ...base, name: "later_binding", code: "later_packet_binding_mismatch", review: laterBinding });
  const transitionBinding = clone(review); transitionBinding.source_transition_receipt.transition_receipt_id = "state-transition-receipt:foreign"; resign(transitionBinding);
  cases.push({ ...base, name: "transition_binding", code: "transition_receipt_binding_mismatch", review: transitionBinding });
  const runBinding = clone(review); runBinding.later_task_run_receipt.receipt_id = "run-receipt:foreign"; resign(runBinding);
  cases.push({ ...base, name: "run_binding", code: "run_receipt_binding_mismatch", review: runBinding });

  const packetMismatchRun = rebuildRun((input) => { input.task_context_packet_ref!.source_ref = `sha256:${"d".repeat(64)}`; });
  cases.push(relationCaseForRun("run_packet_mismatch", "later_packet_run_receipt_relation_mismatch", packetMismatchRun, base));
  const packetTrustRun = rebuildRun((input) => { input.task_context_packet_ref!.trust_class = "imported_unverified"; });
  cases.push(relationCaseForRun("run_packet_trust_rewrite", "later_packet_run_receipt_relation_mismatch", packetTrustRun, base));
  const transitionMissingRun = rebuildRun((input) => { input.external_refs = input.external_refs.filter((ref) => ref.ref_type !== "state_transition_receipt"); });
  cases.push(relationCaseForRun("run_transition_missing", "transition_run_receipt_relation_mismatch", transitionMissingRun, base));
  const transitionTrustRun = rebuildRun((input) => {
    for (const refs of [input.external_refs, input.source_refs]) {
      const ref = refs.find(
        (candidate) => candidate.ref_type === "state_transition_receipt",
      )!;
      ref.trust_class = "imported_unverified";
    }
  });
  cases.push(relationCaseForRun("run_transition_trust_rewrite", "transition_run_receipt_relation_mismatch", transitionTrustRun, base));
  const earlyReview = clone(review); earlyReview.reviewed_at = "2026-07-10T13:29:00.000Z"; resign(earlyReview);
  cases.push({ ...base, name: "review_precedes_run", code: "review_precedes_run_receipt", review: earlyReview });
  cases.push({ ...base, name: "malformed_prior", code: "prior_packet_invalid", prior: {} as typeof base.prior });
  cases.push({ ...base, name: "malformed_later", code: "later_packet_invalid", later: {} as typeof base.later });
  cases.push({ ...base, name: "malformed_transition", code: "source_transition_receipt_invalid", transition: {} as typeof base.transition });
  cases.push({ ...base, name: "malformed_run", code: "later_task_run_receipt_invalid", run: {} as RunReceiptV01 });
  const earlyRun = rebuildRun((input) => {
    input.recorded_at = "2026-07-10T13:20:30.000Z";
    input.task_context_packet_ref!.observed_at = input.recorded_at;
    for (const refs of [input.external_refs, input.source_refs]) {
      const ref = refs.find(
        (candidate) => candidate.ref_type === "state_transition_receipt",
      )!;
      ref.observed_at = input.recorded_at;
    }
  });
  cases.push(
    relationCaseForRun(
      "run_precedes_later_packet",
      "run_receipt_precedes_later_packet",
      earlyRun,
      base,
    ),
  );
  return cases;
}

function relationCaseForRun(
  name: string,
  code: string,
  run: RunReceiptV01,
  base: {
    review: ContextUseReviewV01;
    prior: typeof contextUseReviewTransitionLoopFixture.prior_packet;
    later: typeof contextUseReviewTransitionLoopFixture.later_packet;
    transition: typeof contextUseReviewTransitionLoopFixture.transition_receipt;
    run: RunReceiptV01;
  },
) {
  const input = clone(contextUseReviewInputFixture);
  input.later_task_run_receipt = {
    receipt_version: run.receipt_version,
    receipt_id: run.receipt_id,
    receipt_fingerprint: run.integrity.fingerprint,
  };
  return { ...base, name, code, run, review: buildContextUseReviewV01(input) };
}

function rebuildRun(
  mutate: (input: ReturnType<typeof runInput>) => void,
): RunReceiptV01 {
  const input = runInput(contextUseReviewLaterTaskRunReceiptFixture);
  mutate(input);
  return buildRunReceiptV01(input);
}

function runInput(receipt: RunReceiptV01) {
  const {
    receipt_version: _version, receipt_id: _id, trust_summary: _trust,
    authority_summary, idempotency_key: _key, integrity: _integrity,
    ...input
  } = clone(receipt);
  return { ...input, authority_notes: authority_summary.notes };
}

function caseOf(name: string, code: string, mutate: (value: ContextUseReviewV01) => void) {
  return { name, code, mutate: (source: ContextUseReviewV01) => { const value = clone(source); mutate(value); return value; } };
}

function resign(review: ContextUseReviewV01) {
  review.review_id = deriveContextUseReviewIdV01(review);
  review.integrity.fingerprint = createContextUseReviewFingerprintV01(review);
  return review;
}

function clone<T>(value: T): T { return JSON.parse(JSON.stringify(value)) as T; }
function deepFreeze<T>(value: T): T { if (value && typeof value === "object" && !Object.isFrozen(value)) { Object.freeze(value); Object.values(value as Record<string, unknown>).forEach(deepFreeze); } return value; }
