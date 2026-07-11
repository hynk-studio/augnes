import assert from "node:assert/strict";

import {
  canonicalCodexReviewSourceRecord,
  codexReviewDistinctCandidateRelationsInputFixture,
  codexReviewProposalMapperInputFixture,
  codexReviewTaskContextPacketRefFixture,
} from "@/fixtures/vnext/protocol/episode-delta-proposal-codex-review-v0-1";
import {
  createEpisodeDeltaProposalFingerprintV01,
  deriveEpisodeDeltaProposalIdV01,
  validateEpisodeDeltaProposalV01,
} from "@/lib/vnext/episode-delta-proposal";
import {
  createExpectedObservedDeltaPreviewFingerprintV01,
  deriveExpectedObservedDeltaPreviewCompatibilityIdV01,
  mapCodexSemanticReviewToEpisodeDeltaProposalV01,
  type CodexReviewEpisodeDeltaProposalInputV01,
  type CodexReviewEpisodeDeltaProposalMappingResultV01,
} from "@/lib/vnext/compat/episode-delta-proposal-from-codex-review";
import { canonicalizeProtocolValueV01 } from "@/lib/vnext/protocol-primitives";
import type { EpisodeDeltaProposalV01 } from "@/types/vnext/episode-delta-proposal";

const FIXED_SOURCE_RECORD_FINGERPRINT =
  "sha256:85db515845f9512f3542e1e5e6f3b6e786c5d3d82ca365c509f863917be7d77b";
const FIXED_MAPPED_RECEIPT_ID = "run-receipt:b5122120a1a997a69ff6b703";
const FIXED_MAPPED_RECEIPT_IDEMPOTENCY_KEY =
  "sha256:115764af9ded4e331a86c111644d2552d24ee8e3e0cae7b1c14b5a9ad3b3a32a";
const FIXED_MAPPED_RECEIPT_FINGERPRINT =
  "sha256:4fddb2a3f8c82d6650d18f2bc942ff6efd4973d17e3fde1e3ca2646d8648588f";
const FIXED_CODEX_PROPOSAL_ID =
  "episode-delta-proposal:945ffd50876d66ed96cd64ee";
const FIXED_CODEX_PROPOSAL_FINGERPRINT =
  "sha256:b12207b1688011114403e13b8fd532be17e7d8da7a8291375ee6de623c4a353d";

export interface CodexReviewEpisodeDeltaProposalConformanceSummaryV01 {
  suite: "codex-review-episode-delta-proposal-compat-v0.1";
  status: "passed";
  positive_fixture_count: number;
  negative_fixture_count: number;
  source_record_fingerprint: string;
  mapped_receipt_id: string;
  mapped_receipt_idempotency_key: string;
  mapped_receipt_fingerprint: string;
  preview_id: string;
  preview_fingerprint: string;
  mapped_proposal_id: string;
  mapped_proposal_fingerprint: string;
  direct_observations_from_codex_material: 0;
  verified_external_observations_from_codex_material: 0;
  all_proposed_deltas_review_required: true;
  canonical_current_state_unknown_preserved: true;
  missing_information_explicit: true;
  skipped_checks_not_passed: true;
  changed_files_not_completion: true;
  no_review_decision_generated: true;
  source_record_binding_checked: true;
  receipt_binding_checked: true;
  preview_identity_binding_checked: true;
  optional_task_context_binding_checked: true;
  stale_source_review_checked: true;
  unknown_currentness_non_coercion_checked: true;
  deterministic_mapping: true;
  unordered_preview_normalization_checked: true;
  mapper_input_immutability_checked: true;
  strict_source_validation_checked: true;
  candidate_specific_provenance_checked: true;
  blanket_receipt_attestation_basis_count: 0;
  distinct_candidate_source_relations_checked: true;
  insufficient_material_produced_proposals: 0;
  resigned_malformed_proposal_rejected: true;
}

export function runCodexReviewEpisodeDeltaProposalConformanceV01(): CodexReviewEpisodeDeltaProposalConformanceSummaryV01 {
  assert.equal(
    canonicalCodexReviewSourceRecord.report_fingerprint,
    FIXED_SOURCE_RECORD_FINGERPRINT,
  );
  const input = deepFreeze(clone(codexReviewProposalMapperInputFixture()));
  const before = canonicalizeProtocolValueV01(input);
  const result = mapCodexSemanticReviewToEpisodeDeltaProposalV01(input);
  assert.equal(
    canonicalizeProtocolValueV01(input),
    before,
    "Codex semantic review mapper input must not mutate",
  );
  const { receipt, proposal } = requireMapped("canonical", result);
  assert.equal(receipt.receipt_id, FIXED_MAPPED_RECEIPT_ID);
  assert.equal(
    receipt.idempotency_key,
    FIXED_MAPPED_RECEIPT_IDEMPOTENCY_KEY,
  );
  assert.equal(
    receipt.integrity.fingerprint,
    FIXED_MAPPED_RECEIPT_FINGERPRINT,
  );
  assert.equal(proposal.proposal_id, FIXED_CODEX_PROPOSAL_ID);
  assert.equal(
    proposal.integrity.fingerprint,
    FIXED_CODEX_PROPOSAL_FINGERPRINT,
  );
  assert.equal(proposal.workspace_id, input.workspace_id);
  assert.equal(proposal.project_id, input.project_id);
  assert.equal(proposal.observations.length, 0);
  assert.equal(proposal.trust_summary.direct_observations, 0);
  assert.equal(proposal.trust_summary.verified_external_observations, 0);
  assert.ok(proposal.attestations.length > 0);
  assert.ok(
    proposal.attestations.every(
      (item) => item.trust_class === "imported_unverified",
    ),
  );
  assert.ok(proposal.inferences.length > 0);
  assert.ok(
    proposal.inferences.every(
      (item) => item.trust_class === "derived_interpretation",
    ),
  );
  assert.ok(proposal.proposed_deltas.length > 0);
  assert.ok(proposal.proposed_deltas.every((item) => item.review_required));
  assert.ok(
    proposal.proposed_deltas.every(
      (item) =>
        item.current_state.knowledge_status === "unknown" &&
        item.current_state.bounded_summary === null,
    ),
  );
  assert.equal(
    proposal.missing_information.length,
    proposal.proposed_deltas.length,
  );
  assert.ok(
    proposal.missing_information.every(
      (item) =>
        item.knowledge_status === "unknown" && item.review_required === true,
    ),
  );
  assert.equal(receipt.verification.status, "unknown");
  assert.ok(receipt.checks.every((check) => check.status === "unknown"));
  assert.ok(
    receipt.attestations.some(
      (item) => item.attestation_kind === "skipped_check_claim",
    ),
  );
  assert.ok(receipt.gaps.some((gap) => gap.code.includes("skipped_check")));
  assert.ok(receipt.gaps.some((gap) => gap.code === "legacy_not_done"));
  assert.ok(
    proposal.limitations.some((limitation) =>
      limitation.includes("Changed files and check claims"),
    ),
  );
  assert.equal(
    Object.prototype.hasOwnProperty.call(proposal, "review_decision"),
    false,
  );
  assert.equal(proposal.authority_summary.proposal_is_review_decision, false);
  assert.equal(proposal.authority_summary.performs_durable_transition, false);
  assert.equal(proposal.authority_summary.creates_evidence, false);
  assert.equal(proposal.authority_summary.applies_perspective, false);
  assert.equal(proposal.authority_summary.promotes_reviewed_memory, false);
  assert.equal(proposal.authority_summary.closes_work, false);
  assert.equal(
    proposal.authority_summary.selects_next_context_automatically,
    false,
  );
  assert.equal(
    result.preview_id,
    deriveExpectedObservedDeltaPreviewCompatibilityIdV01(
      input.expected_observed_delta_preview,
    ),
  );
  assert.equal(
    result.preview_fingerprint,
    createExpectedObservedDeltaPreviewFingerprintV01(
      input.expected_observed_delta_preview,
    ),
  );
  assert.ok(
    proposal.compatibility.external_refs.some(
      (ref) =>
        ref.ref_type === "expected_observed_delta_preview" &&
        ref.external_id === result.preview_id &&
        ref.source_ref === result.preview_fingerprint,
    ),
  );
  assert.ok(
    proposal.compatibility.external_refs.some(
      (ref) =>
        ref.ref_type === "normalized_codex_result_report_record" &&
        ref.external_id === canonicalCodexReviewSourceRecord.report_id &&
        ref.source_ref === canonicalCodexReviewSourceRecord.report_fingerprint,
    ),
  );
  assert.ok(
    proposal.run_receipt_refs.some(
      (ref) =>
        ref.external_id === receipt.receipt_id &&
        ref.source_ref === receipt.integrity.fingerprint,
    ),
  );
  assertProviderNativeIdsRemainExternalRefs(proposal);
  const previewMaterial = proposal.attestations.find(
    (item) =>
      item.material_kind === "expected_observed_delta_preview_import",
  );
  assert.ok(previewMaterial);
  assert.ok(
    proposal.inferences.every((inference) =>
      inference.basis_material_ids.includes(previewMaterial.material_id),
    ),
  );
  assert.ok(
    proposal.inferences.every(
      (inference) =>
        inference.basis_material_ids.length < receipt.attestations.length,
    ),
    "No candidate inference may claim the full receipt attestation set as its basis.",
  );
  const candidateTargetFingerprints = proposal.proposed_deltas.map(
    (delta) => delta.target_refs[0]?.source_ref,
  );
  assert.equal(
    new Set(candidateTargetFingerprints).size,
    proposal.proposed_deltas.length,
    "Every mapped candidate must retain its own candidate fingerprint.",
  );
  assert.ok(
    proposal.inferences.every((inference) =>
      inference.source_refs.some(
        (ref) => ref.ref_type === "legacy_candidate_result_ref",
      ),
    ),
  );

  const withTaskContext = requireMapped(
    "optional_task_context",
    mapCodexSemanticReviewToEpisodeDeltaProposalV01(
      codexReviewProposalMapperInputFixture({
        task_context_packet_ref: codexReviewTaskContextPacketRefFixture,
      }),
    ),
  );
  assert.deepEqual(
    withTaskContext.receipt.task_context_packet_ref,
    codexReviewTaskContextPacketRefFixture,
  );
  assert.deepEqual(
    withTaskContext.proposal.task_context_packet_ref,
    codexReviewTaskContextPacketRefFixture,
  );

  const staleInput = clone(codexReviewProposalMapperInputFixture());
  staleInput.source_currentness.status = "stale";
  const stale = requireMapped(
    "stale_source",
    mapCodexSemanticReviewToEpisodeDeltaProposalV01(staleInput),
  );
  assert.equal(stale.proposal.source_status.currentness, "stale");
  assert.equal(stale.proposal.source_status.review_required, true);
  assert.ok(
    stale.proposal.uncertainties.some((item) =>
      item.bounded_summary.includes("stale source"),
    ),
  );

  const unknownInput = clone(codexReviewProposalMapperInputFixture());
  unknownInput.source_currentness = {
    status: "unknown",
    as_of: null,
    basis: "Source currentness is not known.",
  };
  const unknown = requireMapped(
    "unknown_currentness",
    mapCodexSemanticReviewToEpisodeDeltaProposalV01(unknownInput),
  );
  assert.equal(unknown.proposal.source_status.currentness, "unknown");
  assert.equal(unknown.proposal.source_status.as_of, null);

  const distinctRelations = requireMapped(
    "distinct_candidate_relations",
    mapCodexSemanticReviewToEpisodeDeltaProposalV01(
      codexReviewDistinctCandidateRelationsInputFixture(),
    ),
  );
  const distinctPreviewMaterial = distinctRelations.proposal.attestations.find(
    (item) =>
      item.material_kind === "expected_observed_delta_preview_import",
  )!;
  const inferenceByKind = (kind: string) => {
    const inference = distinctRelations.proposal.inferences.find(
      (item) => item.material_kind === kind,
    );
    assert.ok(inference, `Expected ${kind} inference material.`);
    return inference;
  };
  const changedFileInference = inferenceByKind(
    "expected_observed_changed_file_delta",
  );
  const skippedCheckInference = inferenceByKind(
    "expected_observed_skipped_or_unverified_check",
  );
  const notDoneInference = inferenceByKind("expected_observed_not_done");
  const followupInference = distinctRelations.proposal.inferences.find(
    (item) =>
      item.material_kind === "expected_observed_followup_delta" &&
      item.basis_material_ids.length === 1,
  );
  assert.ok(
    followupInference,
    "Expected an expected-only followup inference with preview-only basis.",
  );
  const requirementInference = inferenceByKind(
    "expected_observed_requirement_progress_delta",
  );
  assert.ok(changedFileInference.basis_material_ids.length > 1);
  assert.ok(skippedCheckInference.basis_material_ids.length > 1);
  assert.ok(notDoneInference.basis_material_ids.length > 1);
  assert.deepEqual(followupInference.basis_material_ids, [
    distinctPreviewMaterial.material_id,
  ]);
  assert.deepEqual(requirementInference.basis_material_ids, [
    distinctPreviewMaterial.material_id,
  ]);
  assert.ok(
    [
      changedFileInference,
      skippedCheckInference,
      notDoneInference,
      followupInference,
      requirementInference,
    ].every((inference) =>
      inference.source_refs.some(
        (ref) => ref.ref_type === "expected_observed_delta_candidate",
      ),
    ),
  );
  assert.equal(distinctRelations.proposal.observations.length, 0);
  assert.ok(
    distinctRelations.proposal.proposed_deltas.every(
      (delta) => delta.review_required,
    ),
  );

  const repeated = requireMapped(
    "repeated",
    mapCodexSemanticReviewToEpisodeDeltaProposalV01(
      deepFreeze(clone(codexReviewProposalMapperInputFixture())),
    ),
  );
  assert.deepEqual(repeated.receipt, receipt);
  assert.deepEqual(repeated.proposal, proposal);

  const reorderedInput = clone(codexReviewProposalMapperInputFixture());
  reverseAllArrays(reorderedInput.expected_observed_delta_preview);
  const reordered = requireMapped(
    "reordered_preview",
    mapCodexSemanticReviewToEpisodeDeltaProposalV01(
      deepFreeze(reorderedInput),
    ),
  );
  assert.deepEqual(reordered.proposal, proposal);
  assert.equal(reordered.result.preview_id, result.preview_id);
  assert.equal(reordered.result.preview_fingerprint, result.preview_fingerprint);

  const negativeCases = buildNegativeCases();
  const forgedCandidateCase = negativeCases.find(
    (item) => item.name === "candidate_label_without_canonical_derivation",
  );
  assert.ok(forgedCandidateCase);
  const forgedCandidate = firstCandidate(
    forgedCandidateCase.input as CodexReviewEpisodeDeltaProposalInputV01,
  );
  assert.equal(forgedCandidate.review_required, true);
  assert.equal(forgedCandidate.candidate_only, true);
  for (const negative of negativeCases) {
    const mapping = mapCodexSemanticReviewToEpisodeDeltaProposalV01(
      negative.input,
    );
    assert.equal(
      mapping.status,
      negative.expectedStatus,
      `${negative.name}: ${format(mapping)}`,
    );
    assert.equal(
      mapping.proposal,
      null,
      `${negative.name} must not produce a proposal`,
    );
    assert.ok(
      mapping.errors.some((issue) => issue.code === negative.expectedCode),
      `${negative.name} must report ${negative.expectedCode}: ${format(mapping)}`,
    );
  }

  const resignedMalformed = clone(proposal);
  resignedMalformed.authority_summary.creates_evidence = true as false;
  resignedMalformed.proposal_id = deriveEpisodeDeltaProposalIdV01(
    resignedMalformed,
  );
  resignedMalformed.integrity.fingerprint =
    createEpisodeDeltaProposalFingerprintV01(resignedMalformed);
  const resignedValidation = validateEpisodeDeltaProposalV01(
    resignedMalformed,
  );
  assert.equal(resignedValidation.status, "blocked", format(resignedValidation));
  assert.ok(
    resignedValidation.errors.some(
      (issue) => issue.code === "authority_boundary_violation",
    ),
  );
  for (const integrityCode of [
    "proposal_identity_mismatch",
    "fingerprint_mismatch",
  ]) {
    assert.equal(
      resignedValidation.errors.some((issue) => issue.code === integrityCode),
      false,
      `Re-signed malformed proposal must not rely on ${integrityCode}.`,
    );
  }

  return {
    suite: "codex-review-episode-delta-proposal-compat-v0.1",
    status: "passed",
    positive_fixture_count: 5,
    negative_fixture_count: negativeCases.length,
    source_record_fingerprint: canonicalCodexReviewSourceRecord.report_fingerprint,
    mapped_receipt_id: receipt.receipt_id,
    mapped_receipt_idempotency_key: receipt.idempotency_key,
    mapped_receipt_fingerprint: receipt.integrity.fingerprint,
    preview_id: requiredString(result.preview_id),
    preview_fingerprint: requiredString(result.preview_fingerprint),
    mapped_proposal_id: proposal.proposal_id,
    mapped_proposal_fingerprint: proposal.integrity.fingerprint,
    direct_observations_from_codex_material: 0,
    verified_external_observations_from_codex_material: 0,
    all_proposed_deltas_review_required: true,
    canonical_current_state_unknown_preserved: true,
    missing_information_explicit: true,
    skipped_checks_not_passed: true,
    changed_files_not_completion: true,
    no_review_decision_generated: true,
    source_record_binding_checked: true,
    receipt_binding_checked: true,
    preview_identity_binding_checked: true,
    optional_task_context_binding_checked: true,
    stale_source_review_checked: true,
    unknown_currentness_non_coercion_checked: true,
    deterministic_mapping: true,
    unordered_preview_normalization_checked: true,
    mapper_input_immutability_checked: true,
    strict_source_validation_checked: true,
    candidate_specific_provenance_checked: true,
    blanket_receipt_attestation_basis_count: 0,
    distinct_candidate_source_relations_checked: true,
    insufficient_material_produced_proposals: 0,
    resigned_malformed_proposal_rejected: true,
  };
}

function requireMapped(
  name: string,
  result: CodexReviewEpisodeDeltaProposalMappingResultV01,
): {
  result: CodexReviewEpisodeDeltaProposalMappingResultV01;
  receipt: NonNullable<CodexReviewEpisodeDeltaProposalMappingResultV01["receipt"]>;
  proposal: EpisodeDeltaProposalV01;
} {
  assert.equal(result.status, "mapped", `${name}: ${format(result)}`);
  assert.ok(result.receipt, `${name} must return a mapped RunReceipt`);
  assert.ok(result.proposal, `${name} must return an EpisodeDeltaProposal`);
  return { result, receipt: result.receipt, proposal: result.proposal };
}

function buildNegativeCases() {
  const cases: Array<{
    name: string;
    input: unknown;
    expectedStatus: "invalid" | "blocked";
    expectedCode: string;
  }> = [];
  const add = (
    name: string,
    expectedStatus: "invalid" | "blocked",
    expectedCode: string,
    mutate: (
      input: CodexReviewEpisodeDeltaProposalInputV01 &
        Record<string, unknown>,
    ) => void,
  ) => {
    const input = clone(codexReviewProposalMapperInputFixture()) as
      CodexReviewEpisodeDeltaProposalInputV01 & Record<string, unknown>;
    mutate(input);
    cases.push({ name, input, expectedStatus, expectedCode });
  };
  add("missing_workspace", "invalid", "workspace_id_missing", (input) => {
    input.workspace_id = "";
  });
  add("missing_project", "invalid", "project_id_missing", (input) => {
    input.project_id = "";
  });
  add("unknown_mapping_field", "blocked", "mapping_input_unknown_field", (input) => {
    input.automatic_transition = true;
  });
  add("preview_unknown_root", "blocked", "preview_unknown_field", (input) => {
    (
      input.expected_observed_delta_preview as unknown as Record<string, unknown>
    ).canonical_state = true;
  });
  add("preview_unknown_candidate_field", "blocked", "preview_unknown_candidate_field", (input) => {
    firstCandidate(input).accepted_evidence = true;
  });
  add("preview_candidate_authority", "blocked", "preview_candidate_authority_invalid", (input) => {
    const candidate = firstCandidate(input);
    (candidate.authority_profile as Record<string, unknown>).can_write_memory = true;
  });
  add("preview_candidate_source_kind", "blocked", "preview_candidate_source_kind_invalid", (input) => {
    firstCandidate(input).source_kind = "manual_operator_digest";
  });
  add("candidate_source_ref_replaced", "blocked", "preview_candidate_source_ref_mismatch", (input) => {
    firstCandidate(input).source_ref = "source:forged-candidate-ref";
  });
  add("candidate_result_ref_mismatch", "blocked", "preview_candidate_result_ref_mismatch", (input) => {
    firstCandidate(input).result_ref = "codex-result-report:other-record";
  });
  add("candidate_source_refs_omit_preview_relation", "blocked", "preview_candidate_source_refs_mismatch", (input) => {
    const candidate = firstCandidate(input);
    candidate.source_refs = (candidate.source_refs as string[]).filter(
      (ref) => ref !== "expected_observed_delta_preview.v0.1",
    );
  });
  add("candidate_label_without_canonical_derivation", "blocked", "preview_candidate_derivation_mismatch", (input) => {
    firstCandidate(input).label = "Forged but still review-required candidate";
  });
  add("candidate_summary_without_canonical_derivation", "blocked", "preview_candidate_derivation_mismatch", (input) => {
    firstCandidate(input).summary =
      "A replaced candidate summary remains candidate-only but lacks canonical derivation.";
  });
  add("candidate_unrelated_evidence_injected", "blocked", "preview_candidate_evidence_refs_mismatch", (input) => {
    const candidate = firstCandidate(input);
    candidate.evidence_refs = [
      ...(candidate.evidence_refs as string[]),
      "evidence:unrelated-forged-source",
    ];
  });
  add("preview_raw_prompt", "blocked", "forbidden_raw_material_field", (input) => {
    (
      input.expected_observed_delta_preview as unknown as Record<string, unknown>
    ).raw_prompt = "synthetic raw prompt";
  });
  add("preview_secret", "blocked", "secret_shaped_material", (input) => {
    firstCandidate(input).summary =
      "OPENAI_API_KEY=SAFE_MARKER_SECRET_TOKEN";
  });
  add("preview_absolute_path", "blocked", "absolute_local_path_forbidden", (input) => {
    firstCandidate(input).summary = "/Users/example/private/result.txt";
  });
  add("preview_scope_mismatch", "blocked", "preview_source_scope_mismatch", (input) => {
    input.expected_observed_delta_preview.scope = "project:other-legacy-scope";
  });
  add("preview_source_id_missing", "blocked", "preview_source_record_id_missing", (input) => {
    input.expected_observed_delta_preview.source_refs =
      input.expected_observed_delta_preview.source_refs.filter(
        (ref) => ref !== input.source_record.report_id,
      );
  });
  add("preview_source_fingerprint_missing", "blocked", "preview_source_record_fingerprint_missing", (input) => {
    input.expected_observed_delta_preview.source_refs =
      input.expected_observed_delta_preview.source_refs.filter(
        (ref) => ref !== input.source_record.report_fingerprint,
      );
  });
  add("preview_insufficient_status", "invalid", "semantic_material_insufficient", (input) => {
    input.expected_observed_delta_preview.delta_preview_status =
      "insufficient_observed_material";
    input.expected_observed_delta_preview.recommended_next_action =
      "review_expected_observed_delta_candidates";
  });
  add("preview_blocked", "blocked", "preview_blocked_for_mapping", (input) => {
    input.expected_observed_delta_preview.delta_preview_status =
      "keep_preview_only";
    input.expected_observed_delta_preview.recommended_next_action =
      "keep_preview_only";
    input.expected_observed_delta_preview.blocked_reasons = [
      "synthetic_source_conflict_requires_review",
    ];
    input.expected_observed_delta_preview.input_summary.blocked_reason_count = 1;
  });
  add("preview_candidates_missing", "invalid", "semantic_delta_candidates_missing", (input) => {
    for (const bucket of Object.keys(
      input.expected_observed_delta_preview.delta_candidates,
    ) as Array<
      keyof typeof input.expected_observed_delta_preview.delta_candidates
    >) {
      input.expected_observed_delta_preview.delta_candidates[bucket] = [];
    }
    input.expected_observed_delta_preview.input_summary.delta_candidate_count = 0;
  });
  add("preview_evidence_material_missing", "invalid", "semantic_material_insufficient", (input) => {
    input.expected_observed_delta_preview.evidence_summary.has_observed_material =
      false;
  });
  add("currentness_time_mismatch", "invalid", "source_currentness_preview_time_mismatch", (input) => {
    input.source_currentness.as_of = "2026-07-10T12:40:00.000Z";
  });
  add("unknown_currentness_with_time", "invalid", "unknown_currentness_has_time", (input) => {
    input.source_currentness.status = "unknown";
  });
  add("malformed_task_context_ref", "invalid", "ref_type_missing", (input) => {
    input.task_context_packet_ref = {
      ref_version: "external_ref.v0.1",
    } as never;
  });
  add("source_fingerprint_mismatch", "invalid", "source_fingerprint_mismatch", (input) => {
    const previous = input.source_record.report_fingerprint;
    const mismatched = `sha256:${"0".repeat(64)}`;
    input.source_record.report_fingerprint = mismatched;
    input.expected_observed_delta_preview.source_refs =
      input.expected_observed_delta_preview.source_refs.map((ref) =>
        ref === previous ? mismatched : ref,
      );
    for (const candidates of Object.values(
      input.expected_observed_delta_preview.delta_candidates,
    )) {
      for (const candidate of candidates) {
        candidate.source_refs = candidate.source_refs.map((ref: string) =>
          ref === previous ? mismatched : ref,
        );
      }
    }
  });
  return cases;
}

function firstCandidate(
  input: CodexReviewEpisodeDeltaProposalInputV01,
): Record<string, unknown> {
  for (const bucket of Object.values(
    input.expected_observed_delta_preview.delta_candidates,
  )) {
    if (bucket[0]) return bucket[0] as unknown as Record<string, unknown>;
  }
  throw new Error("Expected a candidate fixture.");
}

function assertProviderNativeIdsRemainExternalRefs(
  value: unknown,
  path = "$",
  insideExternalRef = false,
) {
  if (Array.isArray(value)) {
    value.forEach((item, index) =>
      assertProviderNativeIdsRemainExternalRefs(
        item,
        `${path}[${index}]`,
        insideExternalRef,
      ),
    );
    return;
  }
  if (!value || typeof value !== "object") return;
  const record = value as Record<string, unknown>;
  const currentIsExternalRef = record.ref_version === "external_ref.v0.1";
  for (const [key, child] of Object.entries(record)) {
    if (!insideExternalRef && !currentIsExternalRef) {
      assert.doesNotMatch(
        key,
        /^(?:provider|host|model|session|thread|task|run)_id$|^(?:provider|host|model)$/,
        `Provider-native Core field escaped ExternalRef at ${path}.${key}`,
      );
    }
    assertProviderNativeIdsRemainExternalRefs(
      child,
      `${path}.${key}`,
      insideExternalRef || currentIsExternalRef,
    );
  }
}

function reverseAllArrays(value: unknown) {
  if (Array.isArray(value)) {
    value.reverse();
    value.forEach(reverseAllArrays);
    return;
  }
  if (!value || typeof value !== "object") return;
  Object.values(value as Record<string, unknown>).forEach(reverseAllArrays);
}

function requiredString(value: string | null): string {
  assert.ok(value);
  return value;
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function deepFreeze<T>(value: T): T {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  Object.values(value as Record<string, unknown>).forEach(deepFreeze);
  return Object.freeze(value);
}

function format(value: {
  status: string;
  errors: Array<{ code: string; path: string | null; message: string }>;
  warnings: Array<{ code: string; path: string | null; message: string }>;
}) {
  return JSON.stringify(value, null, 2);
}
