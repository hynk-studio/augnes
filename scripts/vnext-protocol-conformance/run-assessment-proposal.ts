import assert from "node:assert/strict";

import Database from "better-sqlite3";

import {
  genericCliDirectObservationInputFixture,
  mixedProvenanceInputFixture,
} from "@/fixtures/vnext/protocol/run-receipt-v0-1";
import { genericCliBuilderInputFixture } from "@/fixtures/vnext/protocol/task-context-packet-v0-1";
import {
  createEpisodeDeltaProposalFingerprintV01,
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
import {
  buildRunReceiptV01,
  type RunReceiptBuilderInputV01,
} from "@/lib/vnext/run-receipt";
import {
  buildTaskContextPacketV01,
  type TaskContextPacketBuilderInputV01,
} from "@/lib/vnext/task-context-packet";
import type { CriterionAssessmentV01 } from "@/types/vnext/criterion-assessment";
import type { EpisodeDeltaProposalV01 } from "@/types/vnext/episode-delta-proposal";
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

  const db = new Database(":memory:");
  try {
    ensureVNextDurableSemanticStoreSchemaV01(db);
    const inserted = admitEpisodeDeltaProposalV01(db, first);
    assert.equal(inserted.status, "inserted");
    assert.equal(
      countVNextCoreRecordsV01(db, {
        workspace_id: WORKSPACE_ID,
        project_id: PROJECT_ID,
        record_kind: "episode_delta_proposal",
      }),
      1,
    );
    const replay = admitEpisodeDeltaProposalV01(db, second);
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

    const identityConflicts = [
      {
        ...clone(first.identity),
        project_id: "project-run-assessment-proposal-foreign",
      },
      {
        ...clone(first.identity),
        packet_fingerprint: `sha256:${"a".repeat(64)}`,
      },
      {
        ...clone(first.identity),
        receipt_fingerprint: `sha256:${"b".repeat(64)}`,
      },
      {
        ...clone(first.identity),
        run_id: "run-r6-b-conflicting-relation",
      },
      {
        ...clone(first.identity),
        assessment_fingerprint: `sha256:${"c".repeat(64)}`,
      },
      (() => {
        const changed = clone(first.identity);
        assert(changed.work_ref);
        changed.work_ref.observed_at = "2026-07-18T02:01:00.000Z";
        return changed;
      })(),
    ];
    for (const identity of identityConflicts) {
      assert.throws(
        () =>
          admitEpisodeDeltaProposalV01(db, {
            identity,
            proposal: first.proposal,
          }),
        (error) =>
          error instanceof EpisodeDeltaProposalAdmissionErrorV01 &&
          error.code === "episode_delta_proposal_source_binding_conflict",
      );
    }

    const conflicting = clone(first.proposal);
    conflicting.bounded_summary =
      "Changed normalized content for the exact same source purpose.";
    recomputeProposalV01(conflicting);
    assert.equal(validateEpisodeDeltaProposalV01(conflicting).status, "valid");
    assert.throws(
      () =>
        admitEpisodeDeltaProposalV01(db, {
          identity: first.identity,
          proposal: conflicting,
        }),
      (error) =>
        error instanceof EpisodeDeltaProposalAdmissionErrorV01 &&
        error.code === "episode_delta_proposal_conflicting_replay",
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
  };
}

function packetV01() {
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
  input.task.goal = "Create one reviewable proposal from an exact run assessment.";
  input.task.success_criteria = [
    "Preserve exact packet and receipt lineage.",
    "Keep execution completion distinct from task success.",
  ];
  input.task.non_goals = [
    "Do not create a ReviewDecision or Transition.",
  ];
  input.constraints.required_checks = ["check:repository"];
  input.return_contract.required_checks = ["check:repository"];
  return buildTaskContextPacketV01(input);
}

function receiptV01(packet: ReturnType<typeof packetV01>) {
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
  return buildRunReceiptV01(input);
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

function clone<T>(value: T): T {
  return structuredClone(value);
}
