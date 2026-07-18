import assert from "node:assert/strict";

import Database from "better-sqlite3";

import {
  genericCliDirectObservationInputFixture,
  mixedProvenanceInputFixture,
} from "@/fixtures/vnext/protocol/run-receipt-v0-1";
import { genericCliBuilderInputFixture } from "@/fixtures/vnext/protocol/task-context-packet-v0-1";
import {
  createEpisodeDeltaProposalFingerprintV01,
  collectRunAssessmentProposalSourceMaterialBoundViolationsV01,
  deriveEpisodeDeltaProposalIdV01,
  validateEpisodeDeltaProposalV01,
} from "@/lib/vnext/episode-delta-proposal";
import { evaluateCriterionAssessmentV01 } from "@/lib/vnext/criterion-assessment";
import {
  countVNextCoreRecordsV01,
  ensureVNextDurableSemanticStoreSchemaV01,
} from "@/lib/vnext/persistence/durable-semantic-store";
import {
  EpisodeDeltaProposalAdmissionErrorV01,
  admitEpisodeDeltaProposalV01,
} from "@/lib/vnext/persistence/episode-delta-proposal-admission";
import {
  materializeRunAssessmentProposalV01,
  RunAssessmentProposalMaterializationErrorV01,
} from "@/lib/vnext/run-assessment-proposal";
import { classifyRunAssessmentProposalAdmissionErrorV01 } from "@/lib/vnext/runtime/run-assessment-proposal-admission";
import {
  buildRunReceiptV01,
  validateRunReceiptV01,
  type RunReceiptBuilderInputV01,
} from "@/lib/vnext/run-receipt";
import {
  buildTaskContextPacketV01,
  type TaskContextPacketBuilderInputV01,
} from "@/lib/vnext/task-context-packet";
import type { CriterionAssessmentV01 } from "@/types/vnext/criterion-assessment";
import {
  RUN_ASSESSMENT_PROPOSAL_SOURCE_MAX_CANONICAL_UTF8_BYTES_V01,
  RUN_ASSESSMENT_PROPOSAL_SOURCE_MAX_TEXT_CHARACTERS_V01,
  type EpisodeDeltaProposalV01,
} from "@/types/vnext/episode-delta-proposal";
import type { ExternalRefV01 } from "@/types/vnext/external-ref";

const WORKSPACE_ID = "workspace-run-assessment-proposal";
const PROJECT_ID = "project-run-assessment-proposal";
const RECORDED_AT = "2026-07-18T02:30:00.000Z";

export interface RunAssessmentProposalConformanceSummaryV01 {
  suite: "run-assessment-proposal-v0.1";
  status: "passed";
  deterministic_materialization_checked: true;
  typed_assessment_snapshot_checked: true;
  no_relation_policy_checked: true;
  execution_residue_distinctions_checked: true;
  source_derived_time_checked: true;
  identity_and_fingerprint_checked: true;
  exact_replay_checked: true;
  conflicting_replay_refused: true;
  transaction_rollback_checked: true;
  non_authority_checked: true;
  zero_model_checked: true;
  neutral_receipt_basis_checked: true;
  exact_source_material_checked: true;
  source_material_bounds_checked: true;
}

export function runRunAssessmentProposalConformanceV01(): RunAssessmentProposalConformanceSummaryV01 {
  const packet = packetV01();
  const receipt = receiptV01(packet);
  const assessment = evaluateCriterionAssessmentV01({ packet, receipt });
  const first = materializeRunAssessmentProposalV01({
    packet,
    receipt,
    assessment,
  });
  const second = materializeRunAssessmentProposalV01({
    packet: clone(packet),
    receipt: clone(receipt),
    assessment: clone(assessment),
  });
  assert.deepEqual(second, first);
  assert.equal(first.proposal.proposal_id, second.proposal.proposal_id);
  assert.equal(
    first.proposal.integrity.fingerprint,
    second.proposal.integrity.fingerprint,
  );
  assert.equal(first.identity.idempotency_key, second.identity.idempotency_key);
  assert.equal(first.proposal.created_at, receipt.recorded_at);
  assert.equal(validateEpisodeDeltaProposalV01(first.proposal).status, "valid");
  const source = first.proposal.source_assessment;
  assert(source);
  assert.equal(source.assessment.assessment_fingerprint, assessment.assessment_fingerprint);
  assert.deepEqual(source.assessment.criteria, assessment.criteria);
  assert.equal(source.expected.task_goal, packet.task.goal);
  assert.equal(source.expected.success_criteria.length, packet.task.success_criteria.length);
  assert.equal(source.observed.execution.status, "completed");
  assert.equal(source.comparison.task_success_status, "unknown");
  assert.equal(source.comparison.execution_status_is_task_success, false);
  assert.equal(source.comparison.criterion_specific_relations_available, false);
  assert.equal(
    source.assessment.criteria.every(
      (criterion) =>
        criterion.status === "unknown" &&
        criterion.basis === "insufficient" &&
        criterion.supporting_refs.length === 0 &&
        criterion.opposing_refs.length === 0 &&
        criterion.missing_refs.length === 0,
    ),
    true,
  );
  assert.equal(source.observed.checks.some((check) => check.status === "passed"), true);
  assert.equal(source.observed.skipped_checks.length, 1);
  assert.equal(
    source.observed.capability_coverage.some(
      (entry) =>
        entry.capability === "repository_command_execution" &&
        entry.coverage_level === "outside_coverage",
    ),
    true,
  );
  assert.equal(first.proposal.proposed_deltas.length, assessment.criteria.length);
  assert.equal(
    first.proposal.proposed_deltas.every(
      (candidate) =>
        candidate.delta_type === "validation_delta" &&
        candidate.operation === "unknown" &&
        candidate.review_required,
    ),
    true,
  );
  assert.equal(first.proposal.status, "pending_review");
  assert.equal(first.proposal.authority_summary.performs_durable_transition, false);
  assert.equal(first.proposal.authority_summary.creates_evidence, false);
  assert.equal(source.authority.creates_decision, false);
  assert.equal(source.authority.changes_later_context, false);
  const neutralMaterial = first.proposal.observations.filter(
    (item) => item.material_kind === "persisted_run_receipt",
  );
  assert.equal(neutralMaterial.length, 1);
  const actualObservationIds = new Set(
    first.proposal.observations
      .filter((item) => item.material_kind !== "persisted_run_receipt")
      .map((item) => item.material_id),
  );
  for (const inference of first.proposal.inferences.filter(
    (item) => item.material_kind === "criterion_assessment_item",
  )) {
    assert.deepEqual(inference.basis_material_ids, [
      neutralMaterial[0]!.material_id,
    ]);
    assert.equal(
      inference.basis_material_ids.some((id) => actualObservationIds.has(id)),
      false,
    );
  }

  const zeroObservationInput = receiptInputV01(packet);
  zeroObservationInput.observations = [];
  zeroObservationInput.changed_artifacts = [];
  zeroObservationInput.artifact_refs = [];
  zeroObservationInput.execution = {
    status: "unknown",
    basis: "unknown",
    source_refs: [],
  };
  const zeroObservationReceipt = buildRunReceiptV01(zeroObservationInput);
  assert.deepEqual(validateRunReceiptV01(zeroObservationReceipt).errors, []);
  const zeroObservationProposal = materializeRunAssessmentProposalV01({
    packet,
    receipt: zeroObservationReceipt,
    assessment: evaluateCriterionAssessmentV01({
      packet,
      receipt: zeroObservationReceipt,
    }),
  }).proposal;
  assert.equal(
    zeroObservationProposal.observations.filter(
      (item) => item.material_kind === "persisted_run_receipt",
    ).length,
    1,
  );
  assert.equal(
    zeroObservationProposal.observations.filter(
      (item) => item.material_kind !== "persisted_run_receipt",
    ).length,
    0,
  );

  const orderedInput = receiptInputV01(packet);
  orderedInput.observations.push({
    ...clone(orderedInput.observations[0]!),
    observation_id: "observation:unrelated:second",
    observation_kind: "unrelated_local_observation",
    summary: "A second unrelated observation remains separate material.",
  });
  const reversedInput = clone(orderedInput);
  reversedInput.observations.reverse();
  const orderedReceipt = buildRunReceiptV01(orderedInput);
  const reversedReceipt = buildRunReceiptV01(reversedInput);
  assert.deepEqual(reversedReceipt, orderedReceipt);
  const orderedMaterial = materializeRunAssessmentProposalV01({
    packet,
    receipt: orderedReceipt,
    assessment: evaluateCriterionAssessmentV01({
      packet,
      receipt: orderedReceipt,
    }),
  });
  const reversedMaterial = materializeRunAssessmentProposalV01({
    packet,
    receipt: reversedReceipt,
    assessment: evaluateCriterionAssessmentV01({
      packet,
      receipt: reversedReceipt,
    }),
  });
  assert.deepEqual(reversedMaterial, orderedMaterial);
  assert.equal(
    orderedMaterial.proposal.observations.filter(
      (item) => item.material_kind === "persisted_run_receipt",
    ).length,
    1,
  );
  const orderedNeutralId = orderedMaterial.proposal.observations.find(
    (item) => item.material_kind === "persisted_run_receipt",
  )!.material_id;
  const orderedActualIds = new Set(
    orderedMaterial.proposal.observations
      .filter((item) => item.material_kind !== "persisted_run_receipt")
      .map((item) => item.material_id),
  );
  assert.equal(orderedActualIds.size, orderedReceipt.observations.length);
  assert.equal(orderedActualIds.size > 1, true);
  assert.equal(
    orderedMaterial.proposal.inferences
      .filter((item) => item.material_kind === "criterion_assessment_item")
      .every(
        (item) =>
          item.basis_material_ids.length === 1 &&
          item.basis_material_ids[0] === orderedNeutralId &&
          !item.basis_material_ids.some((id) => orderedActualIds.has(id)),
      ),
    true,
  );

  const mixedReceipt = mixedTrustReceiptV01(packet);
  const mixedAssessment = evaluateCriterionAssessmentV01({
    packet,
    receipt: mixedReceipt,
  });
  const mixed = materializeRunAssessmentProposalV01({
    packet,
    receipt: mixedReceipt,
    assessment: mixedAssessment,
  }).proposal;
  assert.equal(
    mixed.observations.some(
      (item) => item.trust_class === "direct_local_observation",
    ),
    true,
  );
  assert.equal(
    mixed.observations.some(
      (item) => item.trust_class === "verified_external_observation",
    ),
    true,
  );
  assert.equal(
    mixed.attestations.some(
      (item) => item.trust_class === "host_attestation",
    ),
    true,
  );
  assert.equal(
    mixed.attestations.some(
      (item) => item.trust_class === "provider_report",
    ),
    true,
  );
  assert.equal(
    mixed.inferences.some(
      (item) =>
        item.trust_class === "derived_interpretation" &&
        item.material_kind === "derived_result_interpretation",
    ),
    true,
  );
  const mixedNeutralId = mixed.observations.find(
    (item) => item.material_kind === "persisted_run_receipt",
  )!.material_id;
  assert.equal(
    mixed.inferences
      .filter((item) => item.material_kind === "derived_result_interpretation")
      .every(
        (item) =>
          item.basis_material_ids.length === 1 &&
          item.basis_material_ids[0] === mixedNeutralId,
      ),
    true,
  );
  assert.equal(
    mixed.source_assessment?.observed.trust_summary.provider_reports,
    1,
  );
  assert.equal(validateEpisodeDeltaProposalV01(mixed).status, "valid");

  const sourceConflict = clone(first.proposal);
  sourceConflict.source_assessment!.packet_ref.source_ref =
    `sha256:${"e".repeat(64)}`;
  recomputeProposalV01(sourceConflict);
  const sourceConflictValidation = validateEpisodeDeltaProposalV01(
    sourceConflict,
  );
  assert.equal(sourceConflictValidation.status, "blocked");
  assert.equal(
    sourceConflictValidation.errors.some(
      (issue) =>
        issue.code === "run_assessment_proposal_source_binding_conflict",
    ),
    true,
  );

  const provenanceChange = clone(first.proposal);
  const coverageSource =
    provenanceChange.source_assessment!.observed.capability_coverage.find(
      (entry) => entry.source_ref,
    )?.source_ref;
  assert(coverageSource);
  const originalProposalFingerprint = provenanceChange.integrity.fingerprint;
  coverageSource.observed_at = "2026-07-18T02:31:00.000Z";
  assert.equal(
    validateEpisodeDeltaProposalV01(provenanceChange).errors.some(
      (issue) => issue.code === "fingerprint_mismatch",
    ),
    true,
  );
  recomputeProposalV01(provenanceChange);
  assert.notEqual(
    provenanceChange.integrity.fingerprint,
    originalProposalFingerprint,
  );
  assert.equal(validateEpisodeDeltaProposalV01(provenanceChange).status, "valid");

  const staleAssessment = clone(assessment);
  staleAssessment.assessment_fingerprint = `sha256:${"f".repeat(64)}`;
  assert.throws(
    () =>
      materializeRunAssessmentProposalV01({
        packet,
        receipt,
        assessment: staleAssessment,
      }),
    (error) =>
      error instanceof RunAssessmentProposalMaterializationErrorV01 &&
      [
        "run_assessment_proposal_assessment_invalid",
        "run_assessment_proposal_assessment_conflict",
      ].includes(error.code),
  );

  const exactBoundProposal = clone(first.proposal);
  fitSourceAssessmentCanonicalBytesV01(
    exactBoundProposal,
    RUN_ASSESSMENT_PROPOSAL_SOURCE_MAX_CANONICAL_UTF8_BYTES_V01,
  );
  recomputeProposalV01(exactBoundProposal);
  assert.deepEqual(
    collectRunAssessmentProposalSourceMaterialBoundViolationsV01(
      exactBoundProposal.source_assessment,
    ),
    [],
  );
  assert.equal(
    validateEpisodeDeltaProposalV01(exactBoundProposal).status,
    "valid",
  );
  const overBoundProposal = clone(exactBoundProposal);
  const lastGap = overBoundProposal.source_assessment!.comparison.gaps.at(-1);
  assert(lastGap);
  assert.equal(
    lastGap.length < RUN_ASSESSMENT_PROPOSAL_SOURCE_MAX_TEXT_CHARACTERS_V01,
    true,
  );
  overBoundProposal.source_assessment!.comparison.gaps[
    overBoundProposal.source_assessment!.comparison.gaps.length - 1
  ] = `${lastGap}x`;
  recomputeProposalV01(overBoundProposal);
  assert.equal(
    validateEpisodeDeltaProposalV01(overBoundProposal).errors.some(
      (issue) =>
        issue.code === "run_assessment_proposal_source_material_bound_exceeded",
    ),
    true,
  );

  for (const oversizedPacket of [
    packetV01({
      goal: "g".repeat(
        RUN_ASSESSMENT_PROPOSAL_SOURCE_MAX_TEXT_CHARACTERS_V01 + 1,
      ),
    }),
    packetV01({
      criteria: [
        "c".repeat(RUN_ASSESSMENT_PROPOSAL_SOURCE_MAX_TEXT_CHARACTERS_V01 + 1),
      ],
    }),
  ]) {
    const oversizedReceipt = receiptV01(oversizedPacket);
    assertMaterialBoundRefusalV01(oversizedPacket, oversizedReceipt);
  }

  for (const mutate of [
    (input: RunReceiptBuilderInputV01) => {
      const check = input.checks[0];
      assert(check);
      check.summary = "k".repeat(
        RUN_ASSESSMENT_PROPOSAL_SOURCE_MAX_TEXT_CHARACTERS_V01 + 1,
      );
    },
    (input: RunReceiptBuilderInputV01) => {
      const skipped = input.skipped_checks[0];
      assert(skipped);
      skipped.reason = "s".repeat(
        RUN_ASSESSMENT_PROPOSAL_SOURCE_MAX_TEXT_CHARACTERS_V01 + 1,
      );
    },
    (input: RunReceiptBuilderInputV01) => {
      const gap = input.gaps[0];
      assert(gap);
      gap.summary = "p".repeat(
        RUN_ASSESSMENT_PROPOSAL_SOURCE_MAX_TEXT_CHARACTERS_V01 + 1,
      );
    },
  ]) {
    const oversizedInput = receiptInputV01(packet);
    mutate(oversizedInput);
    assertMaterialBoundRefusalV01(packet, buildRunReceiptV01(oversizedInput));
  }

  const aggregateInput = receiptInputV01(packet);
  aggregateInput.gaps = Array.from({ length: 70 }, (_, index) => ({
    code: `aggregate-gap-${index}`,
    summary: `${index}:`.padEnd(1900, "n"),
    source_refs: [aggregateInput.reporter_ref],
  }));
  const aggregateReceipt = buildRunReceiptV01(aggregateInput);
  assert.equal(validateRunReceiptV01(aggregateReceipt).status, "valid");
  assertMaterialBoundRefusalV01(packet, aggregateReceipt);
  assert.deepEqual(
    classifyRunAssessmentProposalAdmissionErrorV01({
      code: "run_assessment_proposal_transient_writer_failure",
    }),
    {
      error_code: "run_assessment_proposal_transient_writer_failure",
      retryable: true,
    },
  );
  for (const code of [
    "run_assessment_proposal_packet_missing",
    "run_assessment_proposal_protocol_unsupported",
    "run_assessment_proposal_assessment_unavailable",
    "run_assessment_proposal_packet_invalid",
    "run_assessment_proposal_receipt_invalid",
    "run_assessment_proposal_assessment_invalid",
    "run_assessment_proposal_source_binding_conflict",
    "project_result_proposal_material_conflict",
    "run_assessment_proposal_source_material_bound_exceeded",
    "run_assessment_proposal_unknown_failure",
  ]) {
    assert.deepEqual(classifyRunAssessmentProposalAdmissionErrorV01({ code }), {
      error_code: code,
      retryable: false,
    });
  }

  const db = new Database(":memory:");
  try {
    ensureVNextDurableSemanticStoreSchemaV01(db);
    const inserted = admitEpisodeDeltaProposalV01(
      db,
      persistenceInputV01(first, packet, receipt, assessment),
    );
    assert.equal(inserted.status, "inserted");
    assert.equal(
      countVNextCoreRecordsV01(db, {
        workspace_id: WORKSPACE_ID,
        project_id: PROJECT_ID,
        record_kind: "episode_delta_proposal",
      }),
      1,
    );
    assert.throws(
      () =>
        admitEpisodeDeltaProposalV01(db, {
          expected: first,
          source: {
            packet,
            receipt: aggregateReceipt,
            assessment: evaluateCriterionAssessmentV01({
              packet,
              receipt: aggregateReceipt,
            }),
          },
        }),
      (error) =>
        error instanceof RunAssessmentProposalMaterializationErrorV01 &&
        error.code === "run_assessment_proposal_source_material_bound_exceeded",
    );
    assert.equal(db.inTransaction, false);
    assert.equal(
      countVNextCoreRecordsV01(db, {
        workspace_id: WORKSPACE_ID,
        project_id: PROJECT_ID,
        record_kind: "episode_delta_proposal",
      }),
      1,
    );
    const replay = admitEpisodeDeltaProposalV01(
      db,
      persistenceInputV01(second, packet, receipt, assessment),
    );
    assert.equal(replay.status, "exact_replay");
    assert.deepEqual(replay.proposal, inserted.proposal);
    assert.equal(
      countVNextCoreRecordsV01(db, {
        workspace_id: WORKSPACE_ID,
        project_id: PROJECT_ID,
        record_kind: "episode_delta_proposal",
      }),
      1,
    );

    const materialMutations: Array<
      [string, (proposal: EpisodeDeltaProposalV01) => void]
    > = [
      [
        "passed check",
        (proposal) => {
          const check = proposal.source_assessment!.observed.checks.find(
            (item) => item.status === "passed",
          );
          assert(check);
          check.status = "failed";
        },
      ],
      [
        "skipped reason",
        (proposal) => {
          const skipped =
            proposal.source_assessment!.observed.skipped_checks[0];
          assert(skipped);
          skipped.reason = "A forged skipped-check reason.";
        },
      ],
      [
        "artifact hash",
        (proposal) => {
          const artifact =
            proposal.source_assessment!.observed.changed_artifacts[0];
          assert(artifact);
          artifact.after_hash = `sha256:${"d".repeat(64)}`;
        },
      ],
      [
        "capability coverage",
        (proposal) => {
          const coverage =
            proposal.source_assessment!.observed.capability_coverage[0];
          assert(coverage);
          coverage.coverage_level = "advisory";
        },
      ],
      [
        "trust count",
        (proposal) => {
          proposal.source_assessment!.observed.trust_summary.direct_observations += 1;
        },
      ],
      [
        "expected task goal",
        (proposal) => {
          proposal.source_assessment!.expected.task_goal =
            "A forged task goal.";
        },
      ],
      [
        "expected criterion",
        (proposal) => {
          const criterion =
            proposal.source_assessment!.expected.success_criteria[0];
          assert(criterion);
          criterion.criterion = "A forged criterion.";
        },
      ],
      [
        "comparison gap",
        (proposal) => {
          proposal.source_assessment!.comparison.gaps.push(
            "A forged comparison gap.",
          );
        },
      ],
      [
        "embedded receipt provenance",
        (proposal) => {
          proposal.source_assessment!.receipt_ref.observed_at =
            "2026-07-18T02:31:00.000Z";
        },
      ],
    ];
    for (const [label, mutate] of materialMutations) {
      const forged = clone(first);
      mutate(forged.proposal);
      recomputeProposalV01(forged.proposal);
      assert.throws(
        () =>
          admitEpisodeDeltaProposalV01(
            db,
            persistenceInputV01(forged, packet, receipt, assessment),
          ),
        (error) =>
          error instanceof EpisodeDeltaProposalAdmissionErrorV01 &&
          error.code === "project_result_proposal_material_conflict",
        label,
      );
    }

    const conflicting = clone(first);
    conflicting.proposal.bounded_summary =
      "Changed normalized content for the exact same source purpose.";
    recomputeProposalV01(conflicting.proposal);
    assert.equal(
      validateEpisodeDeltaProposalV01(conflicting.proposal).status,
      "valid",
    );
    assert.throws(
      () =>
        admitEpisodeDeltaProposalV01(
          db,
          persistenceInputV01(conflicting, packet, receipt, assessment),
        ),
      (error) =>
        error instanceof EpisodeDeltaProposalAdmissionErrorV01 &&
        error.code === "project_result_proposal_material_conflict",
    );
    assert.equal(db.inTransaction, false);
    assert.equal(
      countVNextCoreRecordsV01(db, {
        workspace_id: WORKSPACE_ID,
        project_id: PROJECT_ID,
        record_kind: "episode_delta_proposal",
      }),
      1,
    );
  } finally {
    db.close();
  }

  return {
    suite: "run-assessment-proposal-v0.1",
    status: "passed",
    deterministic_materialization_checked: true,
    typed_assessment_snapshot_checked: true,
    no_relation_policy_checked: true,
    execution_residue_distinctions_checked: true,
    source_derived_time_checked: true,
    identity_and_fingerprint_checked: true,
    exact_replay_checked: true,
    conflicting_replay_refused: true,
    transaction_rollback_checked: true,
    non_authority_checked: true,
    zero_model_checked: true,
    neutral_receipt_basis_checked: true,
    exact_source_material_checked: true,
    source_material_bounds_checked: true,
  };
}

function packetV01(overrides: { goal?: string; criteria?: string[] } = {}) {
  const input = clone(
    genericCliBuilderInputFixture,
  ) as TaskContextPacketBuilderInputV01;
  input.workspace_id = WORKSPACE_ID;
  input.project_id = PROJECT_ID;
  input.generated_at = "2026-07-18T02:00:00.000Z";
  input.expires_at = null;
  input.work_ref = refV01(
    "work",
    "work:r6-b-conformance",
    "direct_local_observation",
  );
  input.task.goal =
    overrides.goal ??
    "Create one reviewable proposal from an exact run assessment.";
  input.task.success_criteria = overrides.criteria ?? [
    "Preserve exact packet and receipt lineage.",
    "Keep execution completion distinct from task success.",
  ];
  input.task.non_goals = ["Do not create a ReviewDecision or Transition."];
  input.constraints.required_checks = ["check:repository"];
  input.return_contract.required_checks = ["check:repository"];
  return buildTaskContextPacketV01(input);
}

function receiptV01(packet: ReturnType<typeof packetV01>) {
  return buildRunReceiptV01(receiptInputV01(packet));
}

function receiptInputV01(
  packet: ReturnType<typeof packetV01>,
): RunReceiptBuilderInputV01 {
  const input = clone(
    genericCliDirectObservationInputFixture,
  ) as RunReceiptBuilderInputV01;
  input.workspace_id = WORKSPACE_ID;
  input.project_id = PROJECT_ID;
  input.run_id = "run-r6-b-conformance";
  input.work_ref = clone(packet.work_ref as ExternalRefV01);
  input.task_context_packet_ref = {
    ref_version: "external_ref.v0.1",
    ref_type: "task_context_packet",
    external_id: packet.packet_id,
    trust_class: "direct_local_observation",
    observed_at: packet.generated_at,
    source_ref: packet.integrity.fingerprint,
    compatibility_namespace: packet.packet_version,
  };
  input.recorded_at = RECORDED_AT;
  input.verification = {
    status: "partial",
    basis: "observed",
    required_check_ids: ["check:typecheck", "check:repository"],
    source_refs: input.verification.source_refs,
  };
  input.skipped_checks = [
    {
      check_id: "check:repository",
      required: true,
      reason: "Repository command execution is unsupported by this fixture.",
      basis: "observed",
      source_refs: [input.verifier_refs[0]!],
    },
  ];
  input.gaps = [
    {
      code: "repository_command_execution_unavailable",
      summary: "Repository commands were not executed.",
      source_refs: [input.reporter_ref],
    },
  ];
  input.capability_coverage = [
    ...input.capability_coverage,
    {
      capability: "repository_command_execution",
      coverage_level: "outside_coverage",
      source_ref: null,
      notes: ["Unsupported remains unavailable."],
    },
  ];
  input.result_summary = {
    summary: "Execution completed while task success remains unknown.",
    outcome: "completed",
    limitations: ["No criterion relation is present."],
  };
  return input;
}

function mixedTrustReceiptV01(packet: ReturnType<typeof packetV01>) {
  const input = clone(mixedProvenanceInputFixture) as RunReceiptBuilderInputV01;
  input.workspace_id = WORKSPACE_ID;
  input.project_id = PROJECT_ID;
  input.run_id = "run-r6-b-mixed-trust";
  input.work_ref = clone(packet.work_ref as ExternalRefV01);
  input.task_context_packet_ref = {
    ref_version: "external_ref.v0.1",
    ref_type: "task_context_packet",
    external_id: packet.packet_id,
    trust_class: "direct_local_observation",
    observed_at: packet.generated_at,
    source_ref: packet.integrity.fingerprint,
    compatibility_namespace: packet.packet_version,
  };
  input.recorded_at = RECORDED_AT;
  const providerReporter = refV01(
    "provider_reporter",
    "provider-reporter:r6-b",
    "provider_report",
  );
  const derivedInterpreter = refV01(
    "receipt_interpreter",
    "receipt-interpreter:r6-b",
    "derived_interpretation",
  );
  input.attestations.push(
    {
      attestation_id: "attestation:provider:r6-b",
      attestation_kind: "provider_execution_report",
      summary: "A provider report remains attested provider material.",
      reported_at: input.finished_at ?? RECORDED_AT,
      reporter_ref: providerReporter,
      trust_class: "provider_report",
      source_refs: [providerReporter],
      subject_refs: [],
    },
    {
      attestation_id: "attestation:derived:r6-b",
      attestation_kind: "derived_result_interpretation",
      summary: "A derived interpretation remains inference material.",
      reported_at: input.finished_at ?? RECORDED_AT,
      reporter_ref: derivedInterpreter,
      trust_class: "derived_interpretation",
      source_refs: [derivedInterpreter],
      subject_refs: [],
    },
  );
  input.source_refs.push(providerReporter, derivedInterpreter);
  input.external_refs.push(providerReporter, derivedInterpreter);
  return buildRunReceiptV01(input);
}

function refV01(
  refType: string,
  externalId: string,
  trustClass: ExternalRefV01["trust_class"],
): ExternalRefV01 {
  return {
    ref_version: "external_ref.v0.1",
    ref_type: refType,
    external_id: externalId,
    trust_class: trustClass,
    observed_at: "2026-07-18T02:00:00.000Z",
  };
}

function recomputeProposalV01(proposal: EpisodeDeltaProposalV01): void {
  proposal.proposal_id = deriveEpisodeDeltaProposalIdV01(proposal);
  proposal.integrity.fingerprint =
    createEpisodeDeltaProposalFingerprintV01(proposal);
}

function persistenceInputV01(
  expected: ReturnType<typeof materializeRunAssessmentProposalV01>,
  packet: ReturnType<typeof packetV01>,
  receipt: ReturnType<typeof receiptV01>,
  assessment: CriterionAssessmentV01,
) {
  return {
    expected,
    source: { packet, receipt, assessment },
  };
}

function assertMaterialBoundRefusalV01(
  packet: ReturnType<typeof packetV01>,
  receipt: ReturnType<typeof receiptV01>,
): void {
  const assessment = evaluateCriterionAssessmentV01({ packet, receipt });
  assert.throws(
    () => materializeRunAssessmentProposalV01({ packet, receipt, assessment }),
    (error) =>
      error instanceof RunAssessmentProposalMaterializationErrorV01 &&
      error.code === "run_assessment_proposal_source_material_bound_exceeded",
  );
}

function fitSourceAssessmentCanonicalBytesV01(
  proposal: EpisodeDeltaProposalV01,
  targetBytes: number,
): void {
  const source = proposal.source_assessment;
  assert(source);
  for (let count = 1; count <= 128; count += 1) {
    source.comparison.gaps = Array.from({ length: count }, (_, index) => {
      const prefix = `${index}:`;
      return index === count - 1
        ? prefix
        : prefix.padEnd(
            RUN_ASSESSMENT_PROPOSAL_SOURCE_MAX_TEXT_CHARACTERS_V01,
            "x",
          );
    });
    const currentBytes = canonicalUtf8BytesV01(source);
    const remaining = targetBytes - currentBytes;
    const last = source.comparison.gaps[count - 1]!;
    const available =
      RUN_ASSESSMENT_PROPOSAL_SOURCE_MAX_TEXT_CHARACTERS_V01 - last.length;
    if (remaining < 0 || remaining > available) continue;
    source.comparison.gaps[count - 1] = `${last}${"x".repeat(remaining)}`;
    assert.equal(canonicalUtf8BytesV01(source), targetBytes);
    return;
  }
  assert.fail(`Unable to fit source assessment to ${targetBytes} bytes.`);
}

function canonicalUtf8BytesV01(value: unknown): number {
  return new TextEncoder().encode(JSON.stringify(value)).byteLength;
}

function clone<T>(value: T): T {
  return structuredClone(value);
}
