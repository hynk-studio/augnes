import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import Database from "better-sqlite3";

import { contextUseAttributionSourceFixture } from "@/fixtures/vnext/protocol/context-use-attribution-projection-v0-1";
import {
  buildContinuityDynamicsDigestV01,
  buildWorkContinuityStateFrameV01,
  canonicalizeContinuityDynamicsValueV01,
  createContinuityDynamicsDigestFingerprintV01,
  createWorkContinuityStateFrameFingerprintV01,
  deriveContinuityDynamicsDigestIdV01,
  deriveWorkContinuityStateFrameIdV01,
  assertValidContinuityDynamicsDigestV01,
  assertValidWorkContinuityStateFrameV01,
  type BuildContextUseReviewFrameInputV01,
} from "@/lib/vnext/continuity-dynamics";
import { buildPersonalPerspectiveShadowProjectionV01 } from "@/lib/vnext/context-shadow-navigation";
import { buildContextUseAttributionProjectionV01 } from "@/lib/vnext/context-use-attribution-projection";
import {
  buildContextUseReviewV01,
  deriveContextUseReviewPresentationProvenanceV01,
} from "@/lib/vnext/context-use-review";
import {
  countVNextCoreRecordsV01,
  ensureVNextDurableSemanticStoreSchemaV01,
  insertVNextCoreRecordV01,
  type VNextCoreRecordEnvelopeV01,
} from "@/lib/vnext/persistence/durable-semantic-store";
import { createPersonalPerspectiveScopeLineageRefV01 } from "@/lib/vnext/project-controls/project-controls";
import { canonicalizeProtocolValueV01 } from "@/lib/vnext/protocol-primitives";
import { readContinuityDynamicsV01 } from "@/lib/vnext/runtime/continuity-dynamics-read-model";
import { buildRunReceiptV01, validateRunReceiptV01 } from "@/lib/vnext/run-receipt";
import { buildTaskContextPacketV01 } from "@/lib/vnext/task-context-packet";
import { runContinuityDynamicsReportV01 } from "@/scripts/continuity-dynamics-report";
import type { ContextUseReviewV01 } from "@/types/vnext/context-use-review";
import type {
  ContinuityDynamicsDigestV01,
  WorkContinuityStateFrameV01,
} from "@/types/vnext/continuity-dynamics";
import type { PersonalPerspectiveContextCandidateV01 } from "@/types/vnext/project-controls";
import type { RunReceiptV01 } from "@/types/vnext/run-receipt";
import type { TaskContextPacketV01 } from "@/types/vnext/task-context-packet";

type SourceChainV01 = typeof contextUseAttributionSourceFixture;

const temporaryRoot = mkdtempSync(
  path.join(tmpdir(), "augnes-continuity-dynamics-"),
);
const databasePath = path.join(temporaryRoot, "product-state.sqlite");
const originalFetch = globalThis.fetch;
let fetchCalls = 0;
globalThis.fetch = (async () => {
  fetchCalls += 1;
  throw new Error("continuity dynamics must not call fetch");
}) as typeof fetch;

try {
  const base = buildPersonalPerspectiveSourceChainV01();
  const attribution = buildContextUseAttributionProjectionV01(base);
  const shadow = buildShadowProjectionV01(base);
  const input = frameInputV01(base, attribution, shadow);
  const inputBefore = canonicalizeProtocolValueV01(input);
  const frozenInput = deepFreeze(clone(input));
  const frame = buildWorkContinuityStateFrameV01(frozenInput);
  assert.equal(canonicalizeProtocolValueV01(frozenInput), inputBefore);
  assertValidWorkContinuityStateFrameV01(frame);
  const replay = buildWorkContinuityStateFrameV01(clone(input));
  assert.deepEqual(replay, frame);
  assert.equal(frame.boundary.kind, "context_use_review_recorded");
  assert.equal(frame.boundary.boundary_timestamp, base.review.reviewed_at);
  assert.equal(frame.boundary.caller_timestamp_used, false);
  assert.equal(frame.source_completeness.fabricated_historical_frames, false);
  assert.equal(
    frame.dimensions.verification_resolution.observation
      ?.execution_completed_is_semantic_success,
    false,
  );
  assert.equal(
    frame.dimensions.context_evidence_quality.observation
      ?.packet_level_assessment_is_item_judgment,
    false,
  );
  assert.equal(
    frame.dimensions.context_selection_pressure.observation
      ?.shadow_only_count,
    0,
  );
  assert.equal(
    frame.dimensions.context_selection_pressure.observation
      ?.selection_difference_is_omission_harm,
    false,
  );
  assert.equal(
    frame.dimensions.context_selection_pressure.observation
      ?.critical_omission_candidate_is_causal,
    false,
  );
  assert.ok(
    frame.source_bindings.some(
      (binding) =>
        binding.source_kind === "context_use_attribution_projection",
    ),
  );
  assert.ok(
    frame.source_bindings.some(
      (binding) =>
        binding.source_kind === "personal_perspective_paired_evaluation",
    ),
  );
  assertAllAuthorityFalseV01(frame.authority_summary);
  assertNoNumericGlobalAggregateV01(frame);

  const missingFrame = buildWorkContinuityStateFrameV01({
    ...frameInputV01(base, null, null),
    context_use_attribution: null,
    context_shadow_projection: null,
  });
  assert.equal(
    missingFrame.dimensions.context_evidence_quality.completeness.status,
    "unavailable",
  );
  assert.equal(
    missingFrame.dimensions.context_selection_pressure.completeness.status,
    "unavailable",
  );
  assert.ok(
    missingFrame.source_completeness.missing.includes(
      "exact_acgc1_context_use_attribution_not_supplied",
    ),
  );

  const transitionFrame = buildWorkContinuityStateFrameV01({
    boundary_kind: "semantic_transition_later_packet",
    workspace_id: base.review.workspace_id,
    project_id: base.review.project_id,
    prior_task_context_packet: base.prior_packet,
    later_task_context_packet: base.later_packet,
    source_transition_receipt: base.source_transition_receipt,
  });
  assert.equal(
    transitionFrame.boundary.boundary_timestamp,
    base.later_packet.generated_at,
  );
  assert.equal(
    transitionFrame.boundary.semantic_discontinuity?.transition_receipt_id,
    base.source_transition_receipt.transition_receipt_id,
  );

  assert.throws(
    () =>
      buildWorkContinuityStateFrameV01({
        ...clone(input),
        project_id: "project:foreign",
      }),
    /continuity_dynamics_workspace_project_mismatch/,
  );
  assert.throws(
    () =>
      buildWorkContinuityStateFrameV01({
        ...clone(input),
        unknown_field: true,
      } as BuildContextUseReviewFrameInputV01),
    /continuity_dynamics_unknown_field/,
  );
  const mismatchedShadow = buildPersonalPerspectiveShadowProjectionV01({
    ...shadowInputV01(base),
    baseline_task_context_packet: {
      packet_version: "task_context_packet.v0.1",
      packet_id: "packet:wrong",
      packet_fingerprint: `sha256:${"f".repeat(64)}`,
    },
  });
  assert.throws(
    () =>
      buildWorkContinuityStateFrameV01({
        ...clone(input),
        context_shadow_projection: mismatchedShadow,
      }),
    /context_shadow_navigation_attribution_packet_mismatch/,
  );
  const malformedChain = clone(input);
  malformedChain.context_use_review.later_packet.packet_id =
    "task-context-packet:malformed-chain";
  assert.throws(
    () => buildWorkContinuityStateFrameV01(malformedChain),
    /continuity_dynamics_context_use_review_relation_invalid/,
  );

  const unknownFieldFrame = clone(frame) as WorkContinuityStateFrameV01 & {
    global_health_score?: number;
  };
  unknownFieldFrame.global_health_score = 1;
  assert.throws(
    () => assertValidWorkContinuityStateFrameV01(unknownFieldFrame),
    /continuity_dynamics_unknown_field/,
  );
  const nestedScalar = clone(frame) as WorkContinuityStateFrameV01 & {
    source_completeness: WorkContinuityStateFrameV01["source_completeness"] & {
      weighted_sum?: number;
    };
  };
  nestedScalar.source_completeness.weighted_sum = 0;
  resignFrameV01(nestedScalar);
  assert.throws(
    () => assertValidWorkContinuityStateFrameV01(nestedScalar),
    /continuity_dynamics_scalar_aggregate_forbidden/,
  );
  const mismatchedBoundarySource = clone(frame);
  mismatchedBoundarySource.boundary.boundary_source.source_id =
    "context-use-review:mismatched-source";
  resignFrameV01(mismatchedBoundarySource);
  assert.throws(
    () => assertValidWorkContinuityStateFrameV01(mismatchedBoundarySource),
    /continuity_dynamics_boundary_source_mismatch/,
  );
  const malformedFingerprint = clone(frame);
  malformedFingerprint.source_bindings[0]!.source_fingerprint = "sha256:bad";
  resignFrameV01(malformedFingerprint);
  assert.throws(
    () => assertValidWorkContinuityStateFrameV01(malformedFingerprint),
    /continuity_dynamics_source_binding_invalid/,
  );
  const malformedTimestamp = clone(frame);
  malformedTimestamp.boundary.boundary_timestamp = "not-a-timestamp";
  resignFrameV01(malformedTimestamp);
  assert.throws(
    () => assertValidWorkContinuityStateFrameV01(malformedTimestamp),
    /continuity_dynamics_frame_invalid/,
  );
  const privatePath = clone(frame);
  privatePath.source_completeness.missing.push(
    "/Users/example/private/continuity.json",
  );
  resignFrameV01(privatePath);
  assert.throws(
    () => assertValidWorkContinuityStateFrameV01(privatePath),
    /continuity_dynamics_material_refused:private_absolute_path/,
  );
  const secretShaped = clone(frame);
  secretShaped.source_completeness.missing.push(
    `sk-proj-${"x".repeat(48)}`,
  );
  resignFrameV01(secretShaped);
  assert.throws(
    () => assertValidWorkContinuityStateFrameV01(secretShaped),
    /continuity_dynamics_material_refused:secret_shaped_material/,
  );
  for (const rawField of [
    "raw_prompt",
    "raw_transcript",
    "raw_provider_output",
    "raw_terminal_output",
    "hidden_reasoning",
  ]) {
    const rawMaterial = clone(frame) as WorkContinuityStateFrameV01 & {
      source_completeness: Record<string, unknown>;
    };
    rawMaterial.source_completeness[rawField] = "forbidden material";
    resignFrameV01(rawMaterial);
    assert.throws(
      () => assertValidWorkContinuityStateFrameV01(rawMaterial),
      /continuity_dynamics_material_refused:/,
      rawField,
    );
  }
  const oversizedText = clone(frame);
  oversizedText.source_completeness.missing.push("x".repeat(2001));
  resignFrameV01(oversizedText);
  assert.throws(
    () => assertValidWorkContinuityStateFrameV01(oversizedText),
    /continuity_dynamics_text_bound_exceeded/,
  );
  const oversizedCollection = clone(frame);
  oversizedCollection.source_completeness.missing = Array.from(
    { length: 65 },
    (_, index) => `missing:${index}`,
  );
  resignFrameV01(oversizedCollection);
  assert.throws(
    () => assertValidWorkContinuityStateFrameV01(oversizedCollection),
    /continuity_dynamics_collection_bound_exceeded/,
  );

  const convergingFrames = buildFramesV01(base, [3, 2, 1]);
  const converging = digestV01(convergingFrames, "recent_3");
  assert.equal(
    converging.dynamics.verification_resolution.status,
    "converging",
  );
  assert.deepEqual(
    converging.dynamics.verification_resolution.step_comparisons.map(
      (step) => step.direction,
    ),
    ["improving", "improving"],
  );
  assert.match(
    converging.dynamics.verification_resolution.step_comparisons[0]!
      .exact_basis,
    /unresolved_required_check_count:3->2/,
  );
  const diverging = digestV01(buildFramesV01(base, [1, 2, 3]), "recent_3");
  assert.equal(diverging.dynamics.verification_resolution.status, "diverging");
  assert.deepEqual(
    diverging.dynamics.verification_resolution.step_comparisons.map(
      (step) => step.direction,
    ),
    ["worsening", "worsening"],
  );
  const stalled = digestV01(buildFramesV01(base, [2, 2, 2]), "recent_3");
  assert.equal(stalled.dynamics.verification_resolution.status, "stalled");
  const volatile = digestV01(buildFramesV01(base, [3, 1, 2]), "recent_3");
  assert.equal(volatile.dynamics.verification_resolution.status, "volatile");
  assert.deepEqual(
    volatile.dynamics.verification_resolution.step_comparisons.map(
      (step) => step.direction,
    ),
    ["improving", "worsening"],
  );
  const resolvedStable = digestV01(buildFramesV01(base, [0, 0]), "recent_3");
  assert.equal(
    resolvedStable.dynamics.verification_resolution.status,
    "insufficient",
  );

  const fiveFrames = buildFramesV01(base, [3, 2, 2, 1, 1]);
  const currentOnly = digestV01(fiveFrames, "current_only");
  assert.equal(currentOnly.window.selected_frame_count, 1);
  assert.equal(
    currentOnly.dynamics.verification_resolution.status,
    "current_only",
  );
  const recentThree = digestV01(fiveFrames, "recent_3");
  assert.equal(recentThree.window.selected_frame_count, 3);
  assert.equal(recentThree.window.truncated_to_bound, true);
  const recentFive = digestV01(fiveFrames, "recent_5");
  assert.equal(recentFive.window.selected_frame_count, 5);
  assert.equal(recentFive.window.truncated_to_bound, false);
  assert.ok(
    recentFive.warnings.includes(
      "intermediate_chronology_not_proven_no_interpolation",
    ),
  );
  const sinceTransition = digestV01(
    [transitionFrame, ...fiveFrames.slice(0, 4)],
    "since_last_transition",
  );
  assert.equal(
    sinceTransition.window.since_last_transition,
    "found_in_bounded_input",
  );
  assert.equal(
    sinceTransition.dynamics.verification_resolution.status,
    "regime_shift",
  );
  assert.ok(
    sinceTransition.dynamics.verification_resolution.limitations.includes(
      "transition_is_not_improvement_or_success",
    ),
  );
  assertAllAuthorityFalseV01(sinceTransition.authority_summary);
  assertNoNumericGlobalAggregateV01(sinceTransition);
  assertValidContinuityDynamicsDigestV01(sinceTransition);
  assert.deepEqual(
    digestV01(clone(fiveFrames), "recent_5"),
    recentFive,
  );
  assert.throws(
    () => digestV01([fiveFrames[1]!, fiveFrames[0]!], "recent_3"),
    /continuity_dynamics_frame_chronology_invalid/,
  );
  assert.throws(
    () => digestV01([fiveFrames[0]!, fiveFrames[0]!], "recent_3"),
    /continuity_dynamics_duplicate_frame_refused/,
  );
  const equalTimestampSources = [
    buildSourceChainV01(base, 3, 0),
    buildSourceChainV01(base, 2, 0),
  ];
  const equalTimestampFrames = equalTimestampSources.map((source) =>
    buildWorkContinuityStateFrameV01(
      frameInputV01(
        source,
        buildContextUseAttributionProjectionV01(source),
        null,
      ),
    ),
  );
  assert.throws(
    () => digestV01(equalTimestampFrames, "recent_3"),
    /continuity_dynamics_frame_chronology_invalid/,
  );
  const scalarDigest = clone(recentFive) as ContinuityDynamicsDigestV01 & {
    overall_convergence_percentage?: number;
  };
  scalarDigest.overall_convergence_percentage = 100;
  resignDigestV01(scalarDigest);
  assert.throws(
    () => assertValidContinuityDynamicsDigestV01(scalarDigest),
    /continuity_dynamics_unknown_field/,
  );

  const persistedChains = buildSourceChainsV01(base, [3, 2, 2, 1, 1]);
  const db = new Database(databasePath);
  try {
    ensureVNextDurableSemanticStoreSchemaV01(db);
    for (const chain of persistedChains) persistSourceChainV01(db, chain);
    const before = snapshotStateV01(db);
    const requests = persistedChains.map((chain, index) => ({
      review_id: chain.review.review_id,
      review_fingerprint: chain.review.integrity.fingerprint,
      ...(index === persistedChains.length - 1
        ? { context_shadow_projection: shadow }
        : {}),
    }));

    assert.throws(
      () =>
        readContinuityDynamicsV01(db, {
          workspace_id: base.review.workspace_id,
          project_id: base.review.project_id,
          frames: requests,
          window_kind: "recent_5",
        }),
      /continuity_dynamics_sqlite_query_only_required/,
    );
    db.pragma("query_only = ON");
    const read = readContinuityDynamicsV01(db, {
      workspace_id: base.review.workspace_id,
      project_id: base.review.project_id,
      frames: requests,
      window_kind: "recent_5",
    });
    const readReplay = readContinuityDynamicsV01(db, {
      workspace_id: base.review.workspace_id,
      project_id: base.review.project_id,
      frames: requests,
      window_kind: "recent_5",
    });
    assert.deepEqual(readReplay, read);
    assert.equal(read.frames.length, 5);
    assert.equal(read.digest.window.selected_frame_count, 5);
    assert.equal(read.persistence_boundary.inserts, 0);
    assert.equal(read.persistence_boundary.schema_changes, 0);
    assert.equal(read.persistence_boundary.provider_calls, 0);
    assert.equal(read.persistence_boundary.network_calls, 0);
    assert.throws(
      () =>
        readContinuityDynamicsV01(db, {
          workspace_id: base.review.workspace_id,
          project_id: "project:foreign",
          frames: requests,
          window_kind: "recent_5",
        }),
      /context_use_attribution_review_missing/,
    );
    assert.throws(
      () =>
        readContinuityDynamicsV01(db, {
          workspace_id: base.review.workspace_id,
          project_id: base.review.project_id,
          frames: [
            {
              ...requests[0]!,
              review_fingerprint: `sha256:${"f".repeat(64)}`,
            },
          ],
          window_kind: "current_only",
        }),
      /context_use_attribution_review_fingerprint_mismatch/,
    );

    const jsonReport = runContinuityDynamicsReportV01({
      database_path: databasePath,
      workspace_id: base.review.workspace_id,
      project_id: base.review.project_id,
      frames: requests,
      window_kind: "recent_5",
      format: "json",
    });
    const parsedReport = JSON.parse(jsonReport) as {
      result: typeof read;
    };
    assert.deepEqual(parsedReport.result, read);
    const markdownReport = runContinuityDynamicsReportV01({
      database_path: databasePath,
      workspace_id: base.review.workspace_id,
      project_id: base.review.project_id,
      frames: requests,
      window_kind: "recent_5",
      format: "markdown",
    });
    assert.match(markdownReport, /# Continuity Dynamics Observer/);
    assert.match(markdownReport, /Dimension dynamics/);
    assert.equal(markdownReport.includes(databasePath), false);
    assert.equal(jsonReport.includes(databasePath), false);
    assert.equal(markdownReport.includes(temporaryRoot), false);
    assert.equal(jsonReport.includes(temporaryRoot), false);

    const cli = spawnSync(
      process.execPath,
      [
        "--import",
        "tsx",
        "scripts/continuity-dynamics-report.ts",
        "--format",
        "markdown",
        "--window",
        "recent_5",
      ],
      {
        cwd: process.cwd(),
        encoding: "utf8",
        input: JSON.stringify({
          workspace_id: base.review.workspace_id,
          project_id: base.review.project_id,
          frames: requests,
        }),
        env: {
          AUGNES_DB_PATH: databasePath,
          NODE_ENV: "test",
          PATH: process.env.PATH ?? "",
        },
        timeout: 15_000,
      },
    );
    assert.equal(cli.status, 0, cli.stderr);
    assert.equal(cli.signal, null);
    assert.match(cli.stdout, /# Continuity Dynamics Observer/);
    assert.equal(cli.stdout.includes(databasePath), false);
    assert.equal(cli.stderr, "");

    const after = snapshotStateV01(db);
    assert.deepEqual(after, before);
    for (const kind of [
      "automation_work_item",
      "capability_grant",
      "evidence_record",
      "claim_record",
      "claim_evidence_relation",
      "episode_delta_proposal",
      "review_decision",
      "semantic_commit_gate",
      "semantic_state",
    ] as const) {
      assert.equal(
        countVNextCoreRecordsV01(db, {
          workspace_id: base.review.workspace_id,
          project_id: base.review.project_id,
          record_kind: kind,
        }),
        0,
        kind,
      );
    }
  } finally {
    db.close();
  }

  assert.equal(fetchCalls, 0);
  console.log(
    JSON.stringify(
      {
        suite: "continuity-dynamics-observer-v0.1",
        status: "passed",
        deterministic_frame_identity: true,
        canonical_rebuild: true,
        exact_source_boundary_timestamp: true,
        explicit_missing_dimensions: true,
        exact_acgc1_join: true,
        exact_acgc2_join: true,
        current_only: true,
        recent_3: true,
        recent_5: true,
        since_last_transition: true,
        converging: true,
        diverging: true,
        stalled: true,
        volatile: true,
        regime_shift: true,
        insufficient: true,
        global_scalar_aggregates: 0,
        core_record_counts_unchanged: true,
        schema_unchanged: true,
        semantic_state_unchanged: true,
        packet_writes: 0,
        proposal_writes: 0,
        policy_writes: 0,
        decision_writes: 0,
        transition_writes: 0,
        provider_calls: 0,
        network_calls: 0,
        external_calls: 0,
        owned_processes: 0,
      },
      null,
      2,
    ),
  );
} finally {
  globalThis.fetch = originalFetch;
  rmSync(temporaryRoot, { recursive: true, force: true });
  assert.equal(existsSync(temporaryRoot), false);
}

function buildPersonalPerspectiveSourceChainV01(): SourceChainV01 {
  const source = clone(contextUseAttributionSourceFixture);
  const personalEntries = [personalEntryV01("a"), personalEntryV01("b")];
  const priorInput = taskContextPacketBuilderInputV01(source.prior_packet);
  priorInput.selected_context.push(...clone(personalEntries));
  assert.notEqual(
    priorInput.constraints.context_budget.max_selected_entries,
    null,
  );
  priorInput.constraints.context_budget.max_selected_entries =
    priorInput.constraints.context_budget.max_selected_entries! +
    personalEntries.length;
  const priorPacket = buildTaskContextPacketV01(priorInput);
  const laterInput = taskContextPacketBuilderInputV01(source.later_packet);
  laterInput.selected_context.push(...clone(personalEntries));
  assert.notEqual(
    laterInput.constraints.context_budget.max_selected_entries,
    null,
  );
  laterInput.constraints.context_budget.max_selected_entries =
    laterInput.constraints.context_budget.max_selected_entries! +
    personalEntries.length;
  const laterPacket = buildTaskContextPacketV01(laterInput);

  const runInput = runReceiptBuilderInputV01(source.later_task_run_receipt);
  runInput.task_context_packet_ref = {
    ...runInput.task_context_packet_ref!,
    external_id: laterPacket.packet_id,
    source_ref: laterPacket.integrity.fingerprint,
  };
  const replacementDeliveryRef = {
    ...runInput.checks.find(
      (check) => check.check_id === "deterministic_packet_delivery",
    )!.source_refs[0]!,
    external_id: laterPacket.packet_id,
    source_ref: laterPacket.integrity.fingerprint,
  };
  for (const ref of runInput.verifier_refs) {
    if (ref.ref_type === "task_context_packet_delivery") {
      Object.assign(ref, replacementDeliveryRef);
    }
  }
  for (const check of runInput.checks) {
    if (check.check_id === "deterministic_packet_delivery") {
      check.source_refs = [replacementDeliveryRef];
    }
  }
  runInput.external_refs.push(
    ...personalEntries.flatMap((entry) =>
      entry.external_ref ? [clone(entry.external_ref)] : [],
    ),
  );
  const runReceipt = buildRunReceiptV01(runInput);

  const reviewInput = contextUseReviewBuilderInputV01(source.review);
  reviewInput.prior_packet = {
    packet_version: priorPacket.packet_version,
    packet_id: priorPacket.packet_id,
    packet_fingerprint: priorPacket.integrity.fingerprint,
  };
  reviewInput.later_packet = {
    packet_version: laterPacket.packet_version,
    packet_id: laterPacket.packet_id,
    packet_fingerprint: laterPacket.integrity.fingerprint,
  };
  reviewInput.later_task_run_receipt = {
    receipt_version: runReceipt.receipt_version,
    receipt_id: runReceipt.receipt_id,
    receipt_fingerprint: runReceipt.integrity.fingerprint,
  };
  const presentation = deriveContextUseReviewPresentationProvenanceV01(
    runReceipt,
  );
  reviewInput.usage.presented = presentation.presented;
  reviewInput.usage_provenance!.presented = presentation.provenance;
  const review = buildContextUseReviewV01(reviewInput);
  return {
    prior_packet: priorPacket,
    later_packet: laterPacket,
    source_transition_receipt: source.source_transition_receipt,
    later_task_run_receipt: runReceipt,
    review,
  };
}

function buildSourceChainsV01(
  base: SourceChainV01,
  unresolvedCounts: number[],
): SourceChainV01[] {
  return unresolvedCounts.map((unresolved, index) =>
    buildSourceChainV01(base, unresolved, index),
  );
}

function buildSourceChainV01(
  base: SourceChainV01,
  unresolvedCount: number,
  index: number,
): SourceChainV01 {
  const runInput = runReceiptBuilderInputV01(base.later_task_run_receipt);
  runInput.recorded_at = new Date(
    Date.parse("2026-07-10T14:00:00.000Z") + index * 10 * 60_000,
  ).toISOString();
  runInput.checks = runInput.checks.filter(
    (check) => !check.check_id.startsWith("dynamics-required-"),
  );
  runInput.verification.required_check_ids =
    runInput.verification.required_check_ids.filter(
      (checkId) => !checkId.startsWith("dynamics-required-"),
    );
  for (let checkIndex = 0; checkIndex < 3; checkIndex += 1) {
    const checkId = `dynamics-required-${checkIndex}`;
    runInput.checks.push({
      check_id: checkId,
      required: true,
      status: checkIndex < unresolvedCount ? "failed" : "passed",
      basis: "observed",
      summary: `Exact deterministic dynamics check ${checkIndex}.`,
      source_refs: [clone(runInput.verifier_refs[0]!)],
    });
    runInput.verification.required_check_ids.push(checkId);
  }
  runInput.verification.status = unresolvedCount > 0 ? "partial" : "passed";
  runInput.verification.basis = "observed";
  const runReceipt = buildRunReceiptV01(runInput);
  const runValidation = validateRunReceiptV01(runReceipt);
  assert.equal(
    runValidation.status,
    "valid",
    JSON.stringify(runValidation.errors, null, 2),
  );
  const reviewInput = contextUseReviewBuilderInputV01(base.review);
  reviewInput.reviewed_at = new Date(
    Date.parse(runReceipt.recorded_at) + 60_000,
  ).toISOString();
  reviewInput.later_task_run_receipt = {
    receipt_version: runReceipt.receipt_version,
    receipt_id: runReceipt.receipt_id,
    receipt_fingerprint: runReceipt.integrity.fingerprint,
  };
  const presentation = deriveContextUseReviewPresentationProvenanceV01(
    runReceipt,
  );
  reviewInput.usage.presented = presentation.presented;
  reviewInput.usage_provenance!.presented = presentation.provenance;
  const review = buildContextUseReviewV01(reviewInput);
  return {
    ...base,
    later_task_run_receipt: runReceipt,
    review,
  };
}

function buildFramesV01(
  base: SourceChainV01,
  unresolvedCounts: number[],
): WorkContinuityStateFrameV01[] {
  return buildSourceChainsV01(base, unresolvedCounts).map((source) =>
    buildWorkContinuityStateFrameV01(
      frameInputV01(
        source,
        buildContextUseAttributionProjectionV01(source),
        null,
      ),
    ),
  );
}

function frameInputV01(
  source: SourceChainV01,
  attribution: ReturnType<typeof buildContextUseAttributionProjectionV01> | null,
  shadow: ReturnType<typeof buildPersonalPerspectiveShadowProjectionV01> | null,
): BuildContextUseReviewFrameInputV01 {
  return {
    boundary_kind: "context_use_review_recorded",
    workspace_id: source.review.workspace_id,
    project_id: source.review.project_id,
    prior_task_context_packet: source.prior_packet,
    later_task_context_packet: source.later_packet,
    source_transition_receipt: source.source_transition_receipt,
    later_task_run_receipt: source.later_task_run_receipt,
    context_use_review: source.review,
    context_use_attribution: attribution,
    context_shadow_projection: shadow,
  };
}

function buildShadowProjectionV01(source: SourceChainV01) {
  return buildPersonalPerspectiveShadowProjectionV01(shadowInputV01(source));
}

function shadowInputV01(source: SourceChainV01) {
  const candidates: PersonalPerspectiveContextCandidateV01[] =
    source.later_packet.selected_context
      .filter((entry) => entry.entry_kind === "memory_ref")
      .map((entry) => ({
        candidate_scope: {
          scope_kind: "canonical_project" as const,
          workspace_id: source.review.workspace_id,
          project_id: source.review.project_id,
        },
        review_status: "reviewed" as const,
        trust_policy_status: "eligible" as const,
        entry: clone(entry),
      }));
  return {
    workspace_id: source.review.workspace_id,
    project_id: source.review.project_id,
    scope: personalScopeV01(),
    candidates,
    baseline_task_context_packet: {
      packet_version: source.later_packet.packet_version,
      packet_id: source.later_packet.packet_id,
      packet_fingerprint: source.later_packet.integrity.fingerprint,
    },
    max_shadow_selected: 1,
  };
}

function personalEntryV01(suffix: string) {
  const externalRef = {
    ref_version: "external_ref.v0.1" as const,
    ref_type: "reviewed_memory",
    external_id: `memory:continuity-dynamics:${suffix}`,
    observed_at: "2026-07-10T00:00:00.000Z",
    trust_class: "direct_local_observation" as const,
    compatibility_namespace: "augnes.continuity-dynamics.fixture.v0.1",
  };
  return {
    entry_id: `memory-entry:continuity-dynamics:${suffix}`,
    entry_kind: "memory_ref" as const,
    source_ref: `memory-source:continuity-dynamics:${suffix}`,
    external_ref: externalRef,
    why_included:
      "Included because this project explicitly permits Personal Perspective and the material passed project scope, review, currentness, trust, and context-selection checks.",
    currentness: {
      status: "fresh" as const,
      as_of: "2026-07-10T00:00:00.000Z",
      basis: "Exact synthetic currentness for bounded observer conformance.",
      source_ref: {
        ...externalRef,
        external_id: `memory-currentness:continuity-dynamics:${suffix}`,
      },
    },
    trust_class: "direct_local_observation" as const,
    compatibility_source_ref: createPersonalPerspectiveScopeLineageRefV01(
      personalScopeV01(),
    )!,
    bounded_summary: `Bounded reviewed memory ${suffix}.`,
  };
}

function personalScopeV01() {
  return {
    effective_scope_version: "personal_perspective_effective_scope.v0.1" as const,
    workspace_id: contextUseAttributionSourceFixture.review.workspace_id,
    project_id: contextUseAttributionSourceFixture.review.project_id,
    status: "included" as const,
    configured: true,
    effectively_included: true,
    scope_revision: 1,
    created_at: "2026-07-10T00:00:00.000Z",
    updated_at: "2026-07-10T00:01:00.000Z",
    effective_context_behavior: "eligible_for_normal_context_selection" as const,
    explanation: "Exact project-scoped ACGC3A fixture reuse of ACGC2.",
  };
}

function digestV01(
  frames: WorkContinuityStateFrameV01[],
  windowKind: "current_only" | "recent_3" | "recent_5" | "since_last_transition",
) {
  const first = frames[0]!;
  return buildContinuityDynamicsDigestV01({
    workspace_id: first.workspace_id,
    project_id: first.project_id,
    frames,
    window_kind: windowKind,
  });
}

function persistSourceChainV01(db: Database.Database, input: SourceChainV01) {
  const records: VNextCoreRecordEnvelopeV01[] = [
    {
      record_kind: "task_context_packet",
      record_id: input.prior_packet.packet_id,
      workspace_id: input.prior_packet.workspace_id,
      project_id: input.prior_packet.project_id,
      fingerprint: input.prior_packet.integrity.fingerprint,
      idempotency_key: null,
      payload: input.prior_packet,
      created_at: input.prior_packet.generated_at,
    },
    {
      record_kind: "task_context_packet",
      record_id: input.later_packet.packet_id,
      workspace_id: input.later_packet.workspace_id,
      project_id: input.later_packet.project_id,
      fingerprint: input.later_packet.integrity.fingerprint,
      idempotency_key: null,
      payload: input.later_packet,
      created_at: input.later_packet.generated_at,
    },
    {
      record_kind: "state_transition_receipt",
      record_id: input.source_transition_receipt.transition_receipt_id,
      workspace_id: input.source_transition_receipt.workspace_id,
      project_id: input.source_transition_receipt.project_id,
      fingerprint: input.source_transition_receipt.integrity.fingerprint,
      idempotency_key: input.source_transition_receipt.idempotency_key,
      payload: input.source_transition_receipt,
      created_at: input.source_transition_receipt.recorded_at,
    },
    {
      record_kind: "run_receipt",
      record_id: input.later_task_run_receipt.receipt_id,
      workspace_id: input.later_task_run_receipt.workspace_id,
      project_id: input.later_task_run_receipt.project_id,
      fingerprint: input.later_task_run_receipt.integrity.fingerprint,
      idempotency_key: input.later_task_run_receipt.idempotency_key,
      payload: input.later_task_run_receipt,
      created_at: input.later_task_run_receipt.recorded_at,
    },
    {
      record_kind: "context_use_review",
      record_id: input.review.review_id,
      workspace_id: input.review.workspace_id,
      project_id: input.review.project_id,
      fingerprint: input.review.integrity.fingerprint,
      idempotency_key: null,
      payload: input.review,
      created_at: input.review.reviewed_at,
    },
  ];
  for (const record of records) insertVNextCoreRecordV01(db, record);
}

function snapshotStateV01(db: Database.Database) {
  const schema = db
    .prepare(
      `SELECT type, name, tbl_name, sql
       FROM sqlite_master
       WHERE name LIKE 'vnext_%' OR tbl_name LIKE 'vnext_%'
       ORDER BY type, name`,
    )
    .all();
  return {
    core_record_count: countVNextCoreRecordsV01(db),
    semantic_state_entry_count: rowCountV01(
      db,
      "vnext_semantic_state_entries",
    ),
    semantic_target_head_count: rowCountV01(db, "vnext_semantic_target_heads"),
    schema: canonicalizeProtocolValueV01(schema),
  };
}

function rowCountV01(db: Database.Database, table: string): number {
  const row = db.prepare(`SELECT COUNT(*) AS count FROM ${table}`).get() as {
    count: number;
  };
  return row.count;
}

function taskContextPacketBuilderInputV01(packet: TaskContextPacketV01) {
  const {
    packet_version: _version,
    packet_id: _id,
    authority_summary,
    integrity: _integrity,
    ...input
  } = clone(packet);
  return { ...input, authority_notes: authority_summary.notes };
}

function runReceiptBuilderInputV01(receipt: RunReceiptV01) {
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

function contextUseReviewBuilderInputV01(review: ContextUseReviewV01) {
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

function resignFrameV01(frame: WorkContinuityStateFrameV01): void {
  frame.frame_id = deriveWorkContinuityStateFrameIdV01(frame);
  frame.integrity.fingerprint = createWorkContinuityStateFrameFingerprintV01(
    frame,
  );
}

function resignDigestV01(digest: ContinuityDynamicsDigestV01): void {
  digest.digest_id = deriveContinuityDynamicsDigestIdV01(digest);
  digest.integrity.fingerprint = createContinuityDynamicsDigestFingerprintV01(
    digest,
  );
}

function assertAllAuthorityFalseV01(value: object): void {
  for (const [key, item] of Object.entries(value)) {
    if (key === "notes") continue;
    assert.equal(item, false, key);
  }
}

function assertNoNumericGlobalAggregateV01(value: unknown): void {
  visitV01(value, (key, item) => {
    if (
      typeof item === "number" &&
      /(?:global|overall|health|fitness|weighted).*(?:score|percentage)|(?:score|percentage).*(?:global|overall|health|fitness|weighted)/iu.test(
        key,
      )
    ) {
      assert.fail(`forbidden numeric aggregate: ${key}`);
    }
  });
}

function visitV01(
  value: unknown,
  visit: (key: string, value: unknown) => void,
): void {
  if (Array.isArray(value)) {
    value.forEach((item) => visitV01(item, visit));
  } else if (value && typeof value === "object") {
    for (const [key, item] of Object.entries(value)) {
      visit(key, item);
      visitV01(item, visit);
    }
  }
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
