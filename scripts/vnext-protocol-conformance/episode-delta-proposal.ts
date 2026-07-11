import assert from "node:assert/strict";

import {
  attestationInferenceProposalInputFixture,
  conflictingSourceProposalInputFixture,
  genericCliDirectObservationProposalInputFixture,
  hostAttestationOnlyProposalInputFixture,
  invalidEpisodeDeltaProposalFixtureCases,
  maxBoundedTextProposalInputFixture,
  mixedProvenanceProposalInputFixture,
  observationInferenceChainProposalInputFixture,
  staleSourceReviewProposalInputFixture,
  unknownAndMissingProposalInputFixture,
} from "@/fixtures/vnext/protocol/episode-delta-proposal-v0-1";
import {
  buildEpisodeDeltaProposalV01,
  canonicalizeEpisodeDeltaProposalValueV01,
  createEpisodeDeltaProposalFingerprintV01,
  deriveEpisodeDeltaProposalIdV01,
  EPISODE_DELTA_PROPOSAL_REQUIRED_CORE_FIELDS_V01,
  validateEpisodeDeltaProposalV01,
  type EpisodeDeltaProposalBuilderInputV01,
} from "@/lib/vnext/episode-delta-proposal";
import type { EpisodeDeltaProposalV01 } from "@/types/vnext/episode-delta-proposal";

const FIXED_GENERIC_PROPOSAL_ID =
  "episode-delta-proposal:85eca7dbdac56b9fe199c9d2";
const FIXED_GENERIC_FINGERPRINT =
  "sha256:f12e192a95b785a2de8d95349b4d510f6d2b3e0a67f5dedc4262e3f6c6a30135";

const positiveFixtures = [
  [
    "generic_cli_direct_observation",
    genericCliDirectObservationProposalInputFixture,
  ],
  ["host_attestation_only", hostAttestationOnlyProposalInputFixture],
  ["mixed_provenance", mixedProvenanceProposalInputFixture],
  ["conflicting_sources_preserved", conflictingSourceProposalInputFixture],
  ["unknown_and_missing_preserved", unknownAndMissingProposalInputFixture],
  ["stale_source_requires_review", staleSourceReviewProposalInputFixture],
  ["max_bounded_text_2000", maxBoundedTextProposalInputFixture],
  [
    "observation_inference_chain",
    observationInferenceChainProposalInputFixture,
  ],
  ["attestation_inference", attestationInferenceProposalInputFixture],
] as const;

export interface EpisodeDeltaProposalConformanceSummaryV01 {
  suite: "episode-delta-proposal-v0.1";
  status: "passed";
  positive_fixtures: string[];
  positive_fixture_count: number;
  negative_fixture_count: number;
  deterministic_proposal_identity: true;
  generic_proposal_id: string;
  generic_fingerprint: string;
  required_openai_specific_core_fields: number;
  required_chatgpt_specific_core_fields: number;
  required_codex_specific_core_fields: number;
  generic_cli_valid_without_provider: true;
  source_task_context_packet_ref_checked: true;
  source_run_receipt_refs_checked: true;
  observation_attestation_inference_proposal_separation_checked: true;
  trust_preservation_checked: true;
  conflicts_preserved_unresolved_checked: true;
  unknown_missing_non_coercion_checked: true;
  stale_source_review_checked: true;
  strict_root_and_nested_schema_checked: true;
  relation_integrity_checked: true;
  all_false_authority_summary_checked: true;
  bounded_material_boundary_checked: true;
  builder_input_immutability_checked: true;
  unordered_collection_normalization_checked: true;
  resigned_malformed_proposal_rejected: true;
  exact_text_bounds_checked: true;
  plural_collection_text_bounds_checked: true;
  inference_acyclic_chains_checked: true;
  inference_cycle_detection_checked: true;
  resigned_oversized_proposal_rejected: true;
  resigned_inference_cycle_rejected: true;
}

export function runEpisodeDeltaProposalConformanceV01(): EpisodeDeltaProposalConformanceSummaryV01 {
  const proposals = new Map<string, EpisodeDeltaProposalV01>();
  for (const [name, input] of positiveFixtures) {
    const frozenInput = deepFreeze(clone(input));
    const before = canonicalizeEpisodeDeltaProposalValueV01(frozenInput);
    const proposal = buildEpisodeDeltaProposalV01(frozenInput);
    assert.equal(
      canonicalizeEpisodeDeltaProposalValueV01(frozenInput),
      before,
      `${name} builder input must not mutate`,
    );
    const validation = validateEpisodeDeltaProposalV01(proposal);
    assert.equal(validation.status, "valid", `${name}: ${format(validation)}`);
    proposals.set(name, proposal);
  }

  const generic = requiredProposal(
    proposals,
    "generic_cli_direct_observation",
  );
  assert.equal(generic.observations.length, 1);
  assert.equal(generic.attestations.length, 0);
  assert.equal(generic.inferences.length, 0);
  assert.equal(generic.proposed_deltas.length, 1);
  assert.ok(generic.task_context_packet_ref);
  assert.ok(generic.run_receipt_refs.length > 0);
  assert.equal(generic.proposal_id, FIXED_GENERIC_PROPOSAL_ID);
  assert.equal(generic.integrity.fingerprint, FIXED_GENERIC_FINGERPRINT);
  assert.equal(
    JSON.stringify(generic).match(/openai|chatgpt|codex|anthropic|gemini/gi),
    null,
  );
  assertAllFalseAuthority(generic);
  assertMaterialBoundary(generic);

  const host = requiredProposal(proposals, "host_attestation_only");
  assert.equal(host.observations.length, 0);
  assert.equal(host.attestations.length, 1);
  assert.equal(host.inferences.length, 0);
  assert.equal(host.attestations[0]?.trust_class, "host_attestation");
  assert.equal(host.trust_summary.host_attestations, 1);
  assert.equal(host.trust_summary.direct_observations, 0);
  assertProviderNativeFieldsOnlyInExternalRefs(host);

  const mixed = requiredProposal(proposals, "mixed_provenance");
  assert.equal(mixed.observations.length, 1);
  assert.equal(mixed.attestations.length, 1);
  assert.equal(mixed.inferences.length, 1);
  assert.equal(mixed.trust_summary.direct_observations, 1);
  assert.equal(mixed.trust_summary.host_attestations, 1);
  assert.equal(mixed.trust_summary.derived_interpretations, 1);
  assert.equal(
    mixed.inferences[0]?.trust_class,
    "derived_interpretation",
  );

  const conflicted = requiredProposal(
    proposals,
    "conflicting_sources_preserved",
  );
  assert.equal(conflicted.conflicts.length, 1);
  assert.equal(conflicted.conflicts[0]?.resolution_status, "unresolved");
  assert.equal(conflicted.conflicts[0]?.automatically_resolved, false);
  assert.ok((conflicted.conflicts[0]?.material_ids.length ?? 0) >= 2);

  const unknownAndMissing = requiredProposal(
    proposals,
    "unknown_and_missing_preserved",
  );
  const unknownState = unknownAndMissing.proposed_deltas.find(
    (item) => item.current_state.knowledge_status === "unknown",
  );
  const missingState = unknownAndMissing.proposed_deltas.find(
    (item) => item.current_state.knowledge_status === "missing",
  );
  assert.ok(unknownState);
  assert.ok(missingState);
  assert.equal(unknownState.current_state.bounded_summary, null);
  assert.equal(missingState.current_state.bounded_summary, null);
  assert.ok(
    unknownAndMissing.missing_information.some(
      (item) => item.knowledge_status === "unknown",
    ),
  );
  assert.ok(
    unknownAndMissing.missing_information.some(
      (item) => item.knowledge_status === "missing",
    ),
  );
  assert.equal(unknownAndMissing.source_status.currentness, "unknown");
  assert.equal(unknownAndMissing.source_status.as_of, null);

  const stale = requiredProposal(proposals, "stale_source_requires_review");
  assert.equal(stale.source_status.currentness, "stale");
  assert.equal(stale.source_status.review_required, true);
  assert.equal(stale.status, "pending_review");

  const maxBoundedText = requiredProposal(
    proposals,
    "max_bounded_text_2000",
  );
  assert.equal(maxBoundedText.limitations[0]?.length, 2000);

  const observationInferenceChain = requiredProposal(
    proposals,
    "observation_inference_chain",
  );
  assert.equal(observationInferenceChain.inferences.length, 2);
  assert.ok(
    observationInferenceChain.inferences.some((item) =>
      item.basis_material_ids.includes("material:observation:protocol-file"),
    ),
  );
  assert.ok(
    observationInferenceChain.inferences.some((item) =>
      item.basis_material_ids.includes(
        "material:inference:observation-rooted-a",
      ),
    ),
  );

  const attestationInference = requiredProposal(
    proposals,
    "attestation_inference",
  );
  assert.equal(attestationInference.inferences.length, 1);
  assert.deepEqual(attestationInference.inferences[0]?.basis_material_ids, [
    "material:attestation:host-result",
  ]);

  const repeated = buildEpisodeDeltaProposalV01(
    deepFreeze(clone(genericCliDirectObservationProposalInputFixture)),
  );
  assert.deepEqual(repeated, generic);
  assert.equal(repeated.proposal_id, generic.proposal_id);
  assert.equal(repeated.integrity.fingerprint, generic.integrity.fingerprint);

  const reorderedInput = clone(mixedProvenanceProposalInputFixture);
  reverseAllArrays(reorderedInput);
  const reordered = buildEpisodeDeltaProposalV01(deepFreeze(reorderedInput));
  assert.deepEqual(
    reordered,
    mixed,
    "Semantically unordered collections must normalize deterministically.",
  );

  const unknownFieldInput = clone(
    genericCliDirectObservationProposalInputFixture,
  ) as EpisodeDeltaProposalBuilderInputV01 & Record<string, unknown>;
  unknownFieldInput.unrecognized_runtime_hint = "drop-before-fingerprint";
  (
    unknownFieldInput.proposed_deltas[0] as unknown as Record<string, unknown>
  ).accepted_evidence = true;
  assert.deepEqual(
    buildEpisodeDeltaProposalV01(deepFreeze(unknownFieldInput)),
    generic,
    "Builder must project only allowed contract fields.",
  );

  for (const invalidCase of invalidEpisodeDeltaProposalFixtureCases) {
    const validation = validateEpisodeDeltaProposalV01(
      invalidCase.mutate(generic),
    );
    assert.equal(
      validation.status,
      invalidCase.expected_status,
      `${invalidCase.name}: ${format(validation)}`,
    );
    assert.ok(
      validation.errors.some(
        (issue) => issue.code === invalidCase.expected_error_code,
      ),
      `${invalidCase.name} must report ${invalidCase.expected_error_code}: ${format(validation)}`,
    );
  }

  const resignedMalformed = clone(generic);
  (
    resignedMalformed.proposed_deltas[0]!
      .current_state as unknown as Record<string, unknown>
  ).bounded_summary = { payload: "malformed" };
  resignedMalformed.proposal_id = deriveEpisodeDeltaProposalIdV01(
    resignedMalformed,
  );
  resignedMalformed.integrity.fingerprint =
    createEpisodeDeltaProposalFingerprintV01(resignedMalformed);
  const resignedValidation = validateEpisodeDeltaProposalV01(
    resignedMalformed,
  );
  assert.equal(resignedValidation.status, "invalid", format(resignedValidation));
  assert.ok(
    resignedValidation.errors.some(
      (issue) =>
        issue.code === "nullable_string_malformed" &&
        issue.path ===
          "$.proposed_deltas[0].current_state.bounded_summary",
    ),
    "Re-signed malformed proposal must fail semantic shape validation.",
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

  const resignedOversized = clone(generic);
  resignedOversized.limitations = ["x".repeat(2001)];
  resignedOversized.proposal_id = deriveEpisodeDeltaProposalIdV01(
    resignedOversized,
  );
  resignedOversized.integrity.fingerprint =
    createEpisodeDeltaProposalFingerprintV01(resignedOversized);
  const resignedOversizedValidation = validateEpisodeDeltaProposalV01(
    resignedOversized,
  );
  assert.equal(
    resignedOversizedValidation.status,
    "blocked",
    format(resignedOversizedValidation),
  );
  assert.ok(
    resignedOversizedValidation.errors.some(
      (issue) => issue.code === "summary_bound_exceeded",
    ),
    "Re-signed oversized proposal must remain blocked by semantic bounds.",
  );
  assertIntegrityChecksPassed(resignedOversizedValidation);

  const resignedCycle = clone(observationInferenceChain);
  const cycleFirst = resignedCycle.inferences.find(
    (item) => item.material_id === "material:inference:observation-rooted-a",
  );
  const cycleSecond = resignedCycle.inferences.find(
    (item) => item.material_id === "material:inference:observation-rooted-b",
  );
  assert.ok(cycleFirst);
  assert.ok(cycleSecond);
  cycleFirst.basis_material_ids = [cycleSecond.material_id];
  cycleSecond.basis_material_ids = [cycleFirst.material_id];
  resignedCycle.proposal_id = deriveEpisodeDeltaProposalIdV01(resignedCycle);
  resignedCycle.integrity.fingerprint =
    createEpisodeDeltaProposalFingerprintV01(resignedCycle);
  const resignedCycleValidation = validateEpisodeDeltaProposalV01(
    resignedCycle,
  );
  assert.equal(
    resignedCycleValidation.status,
    "blocked",
    format(resignedCycleValidation),
  );
  assert.ok(
    resignedCycleValidation.errors.some(
      (issue) => issue.code === "inference_basis_cycle",
    ),
    "Re-signed inference cycle must remain blocked by relation semantics.",
  );
  assertIntegrityChecksPassed(resignedCycleValidation);

  const requiredOpenAiSpecificFields =
    EPISODE_DELTA_PROPOSAL_REQUIRED_CORE_FIELDS_V01.filter((field) =>
      /openai/i.test(field),
    );
  const requiredChatGptSpecificFields =
    EPISODE_DELTA_PROPOSAL_REQUIRED_CORE_FIELDS_V01.filter((field) =>
      /chatgpt/i.test(field),
    );
  const requiredCodexSpecificFields =
    EPISODE_DELTA_PROPOSAL_REQUIRED_CORE_FIELDS_V01.filter((field) =>
      /codex/i.test(field),
    );
  assert.deepEqual(
    [
      ...requiredOpenAiSpecificFields,
      ...requiredChatGptSpecificFields,
      ...requiredCodexSpecificFields,
    ],
    [],
  );

  return {
    suite: "episode-delta-proposal-v0.1",
    status: "passed",
    positive_fixtures: positiveFixtures.map(([name]) => name),
    positive_fixture_count: positiveFixtures.length,
    negative_fixture_count: invalidEpisodeDeltaProposalFixtureCases.length,
    deterministic_proposal_identity: true,
    generic_proposal_id: generic.proposal_id,
    generic_fingerprint: generic.integrity.fingerprint,
    required_openai_specific_core_fields:
      requiredOpenAiSpecificFields.length,
    required_chatgpt_specific_core_fields:
      requiredChatGptSpecificFields.length,
    required_codex_specific_core_fields: requiredCodexSpecificFields.length,
    generic_cli_valid_without_provider: true,
    source_task_context_packet_ref_checked: true,
    source_run_receipt_refs_checked: true,
    observation_attestation_inference_proposal_separation_checked: true,
    trust_preservation_checked: true,
    conflicts_preserved_unresolved_checked: true,
    unknown_missing_non_coercion_checked: true,
    stale_source_review_checked: true,
    strict_root_and_nested_schema_checked: true,
    relation_integrity_checked: true,
    all_false_authority_summary_checked: true,
    bounded_material_boundary_checked: true,
    builder_input_immutability_checked: true,
    unordered_collection_normalization_checked: true,
    resigned_malformed_proposal_rejected: true,
    exact_text_bounds_checked: true,
    plural_collection_text_bounds_checked: true,
    inference_acyclic_chains_checked: true,
    inference_cycle_detection_checked: true,
    resigned_oversized_proposal_rejected: true,
    resigned_inference_cycle_rejected: true,
  };
}

function assertIntegrityChecksPassed(value: {
  errors: Array<{ code: string }>;
}) {
  for (const integrityCode of [
    "proposal_identity_mismatch",
    "fingerprint_mismatch",
  ]) {
    assert.equal(
      value.errors.some((issue) => issue.code === integrityCode),
      false,
      `Re-signed semantic rejection must not rely on ${integrityCode}.`,
    );
  }
}

function requiredProposal(
  proposals: Map<string, EpisodeDeltaProposalV01>,
  name: string,
): EpisodeDeltaProposalV01 {
  const proposal = proposals.get(name);
  assert.ok(proposal, `Missing EpisodeDeltaProposal fixture ${name}.`);
  return proposal;
}

function assertAllFalseAuthority(proposal: EpisodeDeltaProposalV01) {
  for (const [key, value] of Object.entries(proposal.authority_summary)) {
    if (key === "notes") continue;
    assert.equal(value, false, `${key} must remain false`);
  }
}

function assertMaterialBoundary(proposal: EpisodeDeltaProposalV01) {
  assert.equal(proposal.material_boundary.bounded_summaries_only, true);
  for (const [key, value] of Object.entries(proposal.material_boundary)) {
    if (key.startsWith("raw_") || key === "hidden_reasoning_persisted" || key === "credential_or_secret_persisted") {
      assert.equal(value, false, `${key} must remain false`);
    }
  }
}

function assertProviderNativeFieldsOnlyInExternalRefs(value: unknown) {
  walk(value, "$", false);

  function walk(candidate: unknown, path: string, insideExternalRef: boolean) {
    if (Array.isArray(candidate)) {
      candidate.forEach((child, index) =>
        walk(child, `${path}[${index}]`, insideExternalRef),
      );
      return;
    }
    if (!candidate || typeof candidate !== "object") return;
    const record = candidate as Record<string, unknown>;
    const isExternalRef = record.ref_version === "external_ref.v0.1";
    for (const [key, child] of Object.entries(record)) {
      if (!insideExternalRef && !isExternalRef) {
        assert.doesNotMatch(
          key,
          /^(?:provider|host|model|session|thread|task|run)_id$|^(?:provider|host|model)$/,
          `Provider-native Core field escaped ExternalRef at ${path}.${key}`,
        );
      }
      walk(child, `${path}.${key}`, insideExternalRef || isExternalRef);
    }
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
