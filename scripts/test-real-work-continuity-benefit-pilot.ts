import assert from "node:assert/strict";
import {
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";

import {
  REAL_WORK_PILOT_ABBA_SCHEDULE_V01,
  REAL_WORK_PILOT_AUTHORITY_V01,
  REAL_WORK_PILOT_C1_OWNER_V01,
  REAL_WORK_PILOT_METHOD_V01,
  REAL_WORK_PILOT_TASK_FAMILIES_V01,
  aggregateRealWorkContinuityBenefitPilotV01,
  assertRealWorkPilotEpisodeFreezeV01,
  conditionForRealWorkPilotEpisodeV01,
  deriveRealWorkPilotDispositionFromReviewedSignalsV01,
  formatRealWorkContinuityBenefitPilotMarkdownV01,
  freezeRealWorkPilotEpisodeV01,
  recordImmediateRealWorkPilotObservationV01,
  recordLaterRealWorkPilotOutcomeReviewV01,
} from "@/lib/vnext/real-work-continuity-benefit-pilot";
import {
  readRealWorkPilotArtifactsV01,
  writeRealWorkPilotEpisodeFreezeV01,
  writeRealWorkPilotImmediateObservationV01,
  writeRealWorkPilotLaterOutcomeReviewV01,
  writeRealWorkPilotReportArtifactsV01,
} from "@/lib/vnext/real-work-continuity-benefit-pilot-artifact-store";
import { runRealWorkContinuityBenefitPilotCliV01 } from "@/scripts/real-work-continuity-benefit-pilot";
import {
  CODEX_CURRENT_CONTINUITY_ROUTE_MARKER_V01,
  CODEX_CURRENT_CONTINUITY_VERSION_V01,
} from "@/types/vnext/codex-current-continuity";
import type {
  RealWorkPilotEpisodeFreezeInputV01,
  RealWorkPilotSourceRefV01,
  RealWorkPilotTaskFamilyV01,
} from "@/types/vnext/real-work-continuity-benefit-pilot";

const FREEZE_AT = "2026-08-25T00:00:00.000Z";
const OBSERVED_AT = "2026-08-25T00:10:00.000Z";
const REVIEWED_AT = "2026-08-26T00:00:00.000Z";
const REPORT_AT = "2026-08-27T00:00:00.000Z";

async function main(): Promise<void> {
  assert.deepEqual(REAL_WORK_PILOT_ABBA_SCHEDULE_V01, ["B0", "C1", "C1", "B0"]);
  for (const family of REAL_WORK_PILOT_TASK_FAMILIES_V01) {
    assert.deepEqual(
      [1, 2, 3, 4].map((index) => conditionForRealWorkPilotEpisodeV01(index)),
      ["B0", "C1", "C1", "B0"],
      `${family} must use exact ABBA assignment`,
    );
  }
  assert.throws(() => conditionForRealWorkPilotEpisodeV01(5), /family_episode_index_invalid/u);

  const scheduleFreezes = REAL_WORK_PILOT_TASK_FAMILIES_V01.flatMap((family) =>
    ([1, 2, 3, 4] as const).map((index) =>
      freezeRealWorkPilotEpisodeV01(freezeInputV01(family, index)),
    ),
  );
  assert.equal(new Set(scheduleFreezes.map((freeze) => freeze.episode_id)).size, 12);
  assert.equal(scheduleFreezes.every((freeze) => freeze.authenticity === "synthetic_test_only"), true);
  assert.deepEqual(
    scheduleFreezes.filter((freeze) => freeze.task_family === "verify").map((freeze) => freeze.condition),
    ["B0", "C1", "C1", "B0"],
  );

  const stableA = freezeRealWorkPilotEpisodeV01(freezeInputV01("resume", 1));
  const stableB = freezeRealWorkPilotEpisodeV01(freezeInputV01("resume", 1));
  assert.equal(stableA.episode_id, stableB.episode_id);
  assert.equal(stableA.integrity.fingerprint, stableB.integrity.fingerprint);
  const changedSourceInput = freezeInputV01("resume", 1);
  changedSourceInput.source_refs[0] = sourceRefV01("git_revision", "source:main", "d", "different-revision");
  const changedSource = freezeRealWorkPilotEpisodeV01(changedSourceInput);
  assert.notEqual(changedSource.episode_id, stableA.episode_id);
  assert.notEqual(changedSource.source_frame_fingerprint, stableA.source_frame_fingerprint);

  const changedWorkspaceInput = freezeInputV01("resume", 1);
  changedWorkspaceInput.workspace_id = "workspace:other";
  assert.notEqual(
    freezeRealWorkPilotEpisodeV01(changedWorkspaceInput).episode_id,
    stableA.episode_id,
  );
  const changedProjectInput = freezeInputV01("resume", 1);
  changedProjectInput.project_id = "project:other";
  assert.notEqual(
    freezeRealWorkPilotEpisodeV01(changedProjectInput).episode_id,
    stableA.episode_id,
  );
  const changedWorkInput = freezeInputV01("resume", 1);
  changedWorkInput.work_id = "work:other";
  assert.notEqual(
    freezeRealWorkPilotEpisodeV01(changedWorkInput).episode_id,
    stableA.episode_id,
  );

  assert.throws(
    () => freezeRealWorkPilotEpisodeV01({ ...freezeInputV01("resume", 1), condition: "C1" }),
    /freeze_input_keys_invalid/u,
  );
  assert.throws(
    () => freezeRealWorkPilotEpisodeV01({ ...freezeInputV01("resume", 1), outcome_known_at_freeze: true }),
    /hindsight_forbidden/u,
  );
  assert.throws(
    () => freezeRealWorkPilotEpisodeV01({ ...freezeInputV01("resume", 1), continuity_material: continuityMaterialV01("c") }),
    /condition_material_mismatch/u,
  );
  assert.throws(
    () => freezeRealWorkPilotEpisodeV01({ ...freezeInputV01("resume", 2), continuity_material: null }),
    /condition_material_mismatch/u,
  );

  assert.equal(stableA.baseline_material.evaluated_c1_projection_included, false);
  assert.equal(stableA.baseline_material.normal_user_task_text_allowed, true);
  assert.equal(stableA.baseline_material.direct_source_inspection_allowed, true);
  assert.equal(stableA.baseline_material.ordinary_host_capabilities_allowed, true);
  const c1Freeze = freezeRealWorkPilotEpisodeV01(freezeInputV01("resume", 2));
  assert.equal(c1Freeze.continuity_material?.owner.projection_version, CODEX_CURRENT_CONTINUITY_VERSION_V01);
  assert.equal(c1Freeze.continuity_material?.owner.route_marker, CODEX_CURRENT_CONTINUITY_ROUTE_MARKER_V01);
  assert.deepEqual(c1Freeze.continuity_material?.owner, REAL_WORK_PILOT_C1_OWNER_V01);
  assert.equal(c1Freeze.continuity_material?.automatic_injection, false);
  assert.equal(c1Freeze.continuity_material?.hidden_or_unreviewed_material, false);
  assert.equal(c1Freeze.continuity_material?.policy_injection, false);
  const wrongOwner = freezeInputV01("resume", 2);
  wrongOwner.continuity_material = {
    ...wrongOwner.continuity_material!,
    owner: { ...wrongOwner.continuity_material!.owner, producer: "hidden/new-owner" as never },
  };
  assert.throws(() => freezeRealWorkPilotEpisodeV01(wrongOwner), /c1_owner_or_boundary_invalid/u);

  const frozenBytes = JSON.stringify(c1Freeze);
  const mutatedFreeze = structuredClone(c1Freeze);
  mutatedFreeze.condition = "B0";
  assert.throws(() => assertRealWorkPilotEpisodeFreezeV01(mutatedFreeze), /freeze_identity_or_fingerprint_invalid|condition_material_mismatch/u);

  const observation = recordImmediateRealWorkPilotObservationV01(c1Freeze, {
    episode_id: c1Freeze.episode_id,
    workspace_id: c1Freeze.work_identity.workspace_id,
    project_id: c1Freeze.work_identity.project_id,
    work_id: c1Freeze.work_identity.work_id,
    observed_at: OBSERVED_AT,
    measurements: {
      resume_steps_to_first_correct_action: observedNumberV01(0, "direct_observation"),
      cross_manual_interventions_count: observedNumberV01(0, "direct_observation"),
      cross_tool_calls_from_existing_safe_receipts: observedNumberV01(0, "existing_safe_receipt", "run_receipt"),
      cross_provider_calls_from_existing_safe_receipts: observedNumberV01(0, "existing_safe_receipt", "run_receipt"),
    },
  });
  assert.equal(observation.measurements.resume_steps_to_first_correct_action.status, "observed");
  assert.equal(observation.measurements.resume_repeated_explanation_count.status, "unknown");
  assert.equal(observation.measurements.verify_false_success.status, "unknown");
  assert.equal(observation.measurements.resume_first_meaningful_action_later_confirmed_correct.status, "unknown");
  assert.equal(observation.harness_owned_real_provider_calls, 0);
  assert.equal(observation.harness_owned_network_calls, 0);
  assert.throws(
    () => recordImmediateRealWorkPilotObservationV01(c1Freeze, {
      episode_id: c1Freeze.episode_id,
      workspace_id: c1Freeze.work_identity.workspace_id,
      project_id: c1Freeze.work_identity.project_id,
      work_id: c1Freeze.work_identity.work_id,
      observed_at: OBSERVED_AT,
      measurements: {
        cross_manual_interventions_count: {
          status: "observed",
          value: 0,
          basis: "direct_observation",
          source_refs: [],
        },
      },
    }),
    /source_refs_invalid/u,
  );
  assert.throws(
    () => recordImmediateRealWorkPilotObservationV01(c1Freeze, {
      episode_id: c1Freeze.episode_id,
      workspace_id: c1Freeze.work_identity.workspace_id,
      project_id: "project:mismatch",
      work_id: c1Freeze.work_identity.work_id,
      observed_at: OBSERVED_AT,
      measurements: {},
    }),
    /cross_project_or_work_join_refused/u,
  );
  assert.throws(
    () => recordImmediateRealWorkPilotObservationV01(c1Freeze, {
      episode_id: c1Freeze.episode_id,
      workspace_id: c1Freeze.work_identity.workspace_id,
      project_id: c1Freeze.work_identity.project_id,
      work_id: c1Freeze.work_identity.work_id,
      observed_at: OBSERVED_AT,
      measurements: {
        cross_provider_calls_from_existing_safe_receipts: observedNumberV01(0, "direct_observation"),
      },
    }),
    /exact_receipt_measure_unbound/u,
  );

  const review = recordLaterRealWorkPilotOutcomeReviewV01(c1Freeze, observation, {
    episode_id: c1Freeze.episode_id,
    workspace_id: c1Freeze.work_identity.workspace_id,
    project_id: c1Freeze.work_identity.project_id,
    work_id: c1Freeze.work_identity.work_id,
    reviewed_at: REVIEWED_AT,
    label: "misleading",
    source_refs: [sourceRefV01("later_review_material", "review:synthetic", "e", null)],
    later_measurements: {
      resume_first_meaningful_action_later_confirmed_correct: {
        status: "observed",
        value: false,
        basis: "later_source_linked_review",
        source_refs: [sourceRefV01("later_review_material", "review:synthetic", "e", null)],
      },
      cross_stale_or_harmful_transfer: {
        status: "observed",
        value: true,
        basis: "later_source_linked_review",
        source_refs: [sourceRefV01("later_review_material", "review:synthetic", "e", null)],
      },
    },
    limitations: ["Synthetic test-only review; never pilot evidence."],
  });
  assert.equal(review.causal_contribution, "not_inferred_from_presence_or_reference");
  assert.equal(JSON.stringify(c1Freeze), frozenBytes, "later stages must not rewrite freeze identity");
  assert.throws(
    () => recordLaterRealWorkPilotOutcomeReviewV01(c1Freeze, observation, {
      episode_id: c1Freeze.episode_id,
      workspace_id: c1Freeze.work_identity.workspace_id,
      project_id: c1Freeze.work_identity.project_id,
      work_id: c1Freeze.work_identity.work_id,
      reviewed_at: REVIEWED_AT,
      label: "helpful",
      source_refs: [sourceRefV01("later_review_material", "review:synthetic", "e", null)],
      later_measurements: {
        cross_manual_interventions_count: {
          status: "observed",
          value: 1,
          basis: "later_source_linked_review",
          source_refs: [sourceRefV01("later_review_material", "review:synthetic", "e", null)],
        },
      },
      limitations: [],
    }),
    /cannot_rewrite_immediate/u,
  );

  assert.deepEqual(REAL_WORK_PILOT_METHOD_V01, {
    model_as_judge: false,
    scalar_fitness: false,
    rank: false,
    winner: false,
    adaptive_assignment: false,
    causal_contribution_from_presence_or_reference: false,
    harness_owned_real_provider_calls: 0,
    harness_owned_network_calls: 0,
  });
  assert.equal(Object.values(REAL_WORK_PILOT_AUTHORITY_V01).every((value) => value === false), true);
  assert.equal(REAL_WORK_PILOT_AUTHORITY_V01.writes_product_or_core_database, false);
  assert.equal(REAL_WORK_PILOT_AUTHORITY_V01.creates_evidence, false);
  assert.equal(REAL_WORK_PILOT_AUTHORITY_V01.creates_proposal, false);
  assert.equal(REAL_WORK_PILOT_AUTHORITY_V01.creates_review_decision, false);
  assert.equal(REAL_WORK_PILOT_AUTHORITY_V01.creates_or_applies_transition, false);
  assert.equal(REAL_WORK_PILOT_AUTHORITY_V01.creates_or_activates_policy, false);
  assert.equal(REAL_WORK_PILOT_AUTHORITY_V01.creates_stage_7_behavior, false);

  assert.equal(
    deriveRealWorkPilotDispositionFromReviewedSignalsV01({
      complete: true,
      harmful_or_stale_transfer_incidents: 1,
      authority_drift_incidents: 0,
      harmful_transfer_labels: 0,
      positive_family_signals: 3,
      burden_dominant_family_signals: 0,
    }),
    "harm_signal_candidate",
    "one harmful-transfer incident must remain visible regardless of positive family signals",
  );
  assert.equal(
    deriveRealWorkPilotDispositionFromReviewedSignalsV01({
      complete: false,
      harmful_or_stale_transfer_incidents: 0,
      authority_drift_incidents: 0,
      harmful_transfer_labels: 0,
      positive_family_signals: 3,
      burden_dominant_family_signals: 0,
    }),
    "insufficient_real_work",
  );
  assert.equal(
    deriveRealWorkPilotDispositionFromReviewedSignalsV01({
      complete: true,
      harmful_or_stale_transfer_incidents: 0,
      authority_drift_incidents: 0,
      harmful_transfer_labels: 0,
      positive_family_signals: 1,
      burden_dominant_family_signals: 1,
    }),
    "mixed_or_family_specific",
  );

  const syntheticReport = aggregateRealWorkContinuityBenefitPilotV01({
    freezes: [c1Freeze],
    observations: [observation],
    reviews: [review],
    generated_at: REPORT_AT,
  });
  assert.equal(syntheticReport.authentic_episode_count, 0);
  assert.equal(syntheticReport.synthetic_test_only_excluded_count, 1);
  assert.equal(syntheticReport.pilot_complete, false);
  assert.equal(syntheticReport.disposition, "insufficient_real_work");
  assert.deepEqual(syntheticReport.counts_by_family_condition, {
    resume: { B0: 0, C1: 0 },
    verify: { B0: 0, C1: 0 },
    decide: { B0: 0, C1: 0 },
  });
  assert.equal(syntheticReport.family_specific_asymmetries.length, 3);
  assert.deepEqual(syntheticReport.incidents, {
    harmful_or_stale_transfer_episode_ids: [],
    misleading_confidence_or_false_attention_episode_ids: [],
    authority_drift_episode_ids: [],
    harmful_transfer_label_episode_ids: [],
    misleading_label_episode_ids: [],
  });
  assert.equal(syntheticReport.baseline_comparison.scalar_score, false);
  assert.equal(syntheticReport.baseline_comparison.global_winner, false);
  assert.equal(syntheticReport.harness_owned_real_provider_calls, 0);
  const markdown = formatRealWorkContinuityBenefitPilotMarkdownV01(syntheticReport);
  assert.match(markdown, /Synthetic test-only records excluded: 1/u);
  assert.match(markdown, /No significance claim, scalar score, rank, global winner/u);

  assert.throws(
    () => freezeRealWorkPilotEpisodeV01({ ...freezeInputV01("resume", 1), raw_prompt: "forbidden" }),
    /freeze_input_keys_invalid/u,
  );
  assert.throws(
    () => freezeRealWorkPilotEpisodeV01({ ...freezeInputV01("resume", 1), transcript: "forbidden" }),
    /freeze_input_keys_invalid/u,
  );
  assert.throws(
    () => freezeRealWorkPilotEpisodeV01({
      ...freezeInputV01("resume", 1),
      natural_task_goal: "Authorization: Bearer secret-material-must-not-persist",
    }),
    /secret_like_material_refused/u,
  );
  assert.throws(
    () => freezeRealWorkPilotEpisodeV01({
      ...freezeInputV01("resume", 1),
      natural_task_goal: "x".repeat(2_001),
    }),
    /natural_task_goal_out_of_bounds/u,
  );

  const tempRoot = createSyntheticRepositoryV01();
  try {
    const freezePath = writeRealWorkPilotEpisodeFreezeV01(tempRoot, c1Freeze);
    assert.match(freezePath, /^\.augnes-lab\/real-work-continuity-benefit-pilot\//u);
    assert.throws(
      () => writeRealWorkPilotEpisodeFreezeV01(tempRoot, c1Freeze),
      /family_schedule_slot_already_frozen/u,
    );
    const changedSameSlotInput = freezeInputV01("resume", 2);
    changedSameSlotInput.source_refs[0] = sourceRefV01(
      "git_revision",
      "source:changed-same-slot",
      "9",
      "changed-same-slot",
    );
    assert.throws(
      () => writeRealWorkPilotEpisodeFreezeV01(
        tempRoot,
        freezeRealWorkPilotEpisodeV01(changedSameSlotInput),
      ),
      /family_schedule_slot_already_frozen/u,
    );
    writeRealWorkPilotImmediateObservationV01(tempRoot, c1Freeze, observation);
    writeRealWorkPilotLaterOutcomeReviewV01(tempRoot, c1Freeze, observation, review);
    const artifacts = readRealWorkPilotArtifactsV01(tempRoot, c1Freeze.pilot_id);
    assert.equal(artifacts.freezes.length, 1);
    assert.equal(artifacts.observations.length, 1);
    assert.equal(artifacts.reviews.length, 1);
    const paths = writeRealWorkPilotReportArtifactsV01(tempRoot, syntheticReport);
    assert.match(paths.json_path, /report_[a-f0-9]{32}\.json$/u);
    assert.match(paths.markdown_path, /report_[a-f0-9]{32}\.md$/u);
    assert.equal(readFileSync(path.join(tempRoot, paths.markdown_path), "utf8"), markdown);
    assert.equal(
      execFileSync("git", ["-C", tempRoot, "check-ignore", freezePath], { encoding: "utf8" }).trim(),
      freezePath,
    );
    assert.equal(
      listFilesV01(tempRoot).some((file) => /\.(?:db|sqlite|sqlite3)$/u.test(file)),
      false,
      "the harness must not create a product or Core database",
    );
  } finally {
    rmSync(tempRoot, { recursive: true, force: true });
  }

  const missingIgnoreRoot = createSyntheticRepositoryV01(false);
  try {
    assert.throws(
      () => writeRealWorkPilotEpisodeFreezeV01(missingIgnoreRoot, c1Freeze),
      /artifact_namespace_not_ignored/u,
    );
  } finally {
    rmSync(missingIgnoreRoot, { recursive: true, force: true });
  }

  const symlinkRoot = createSyntheticRepositoryV01();
  const outside = mkdtempSync(path.join(os.tmpdir(), "rw1-outside-"));
  try {
    symlinkSync(outside, path.join(symlinkRoot, ".augnes-lab"), "dir");
    assert.throws(
      () => writeRealWorkPilotEpisodeFreezeV01(symlinkRoot, c1Freeze),
      /artifact_directory_unsafe/u,
    );
  } finally {
    rmSync(symlinkRoot, { recursive: true, force: true });
    rmSync(outside, { recursive: true, force: true });
  }

  const cliRoot = createSyntheticRepositoryV01();
  try {
    const cliFreezeInput = freezeInputV01("verify", 1);
    const frozen = await runRealWorkContinuityBenefitPilotCliV01(
      ["freeze", "--repository-root", cliRoot],
      async () => cliFreezeInput,
    );
    assert.equal(frozen.status, "frozen");
    assert.equal(frozen.authenticity, "synthetic_test_only");
    assert.equal(frozen.harness_owned_real_provider_calls, 0);
  } finally {
    rmSync(cliRoot, { recursive: true, force: true });
  }

  process.stdout.write(`${JSON.stringify({
    status: "passed",
    fixture_classification: "synthetic_test_only",
    authentic_pilot_episodes_created: 0,
    schedule: REAL_WORK_PILOT_ABBA_SCHEDULE_V01,
    selected_c1_owner: REAL_WORK_PILOT_C1_OWNER_V01,
    harness_owned_real_provider_calls: 0,
    harness_owned_network_calls: 0,
  })}\n`);
}

function freezeInputV01(
  family: RealWorkPilotTaskFamilyV01,
  index: 1 | 2 | 3 | 4,
): RealWorkPilotEpisodeFreezeInputV01 {
  return {
    authenticity: "synthetic_test_only",
    task_family: family,
    family_episode_index: index,
    workspace_id: "workspace:synthetic-rw1-test-only",
    project_id: "project:synthetic-rw1-test-only",
    work_id: `work:synthetic-rw1-test-only:${family}:${index}`,
    source_refs: [
      sourceRefV01(
        "git_revision",
        "source:main",
        "a",
        "f611bea5a44eb90f6739a27d704953abe2d3c464",
      ),
    ],
    natural_task_goal: `Synthetic test-only ${family} fixture for deterministic harness verification`,
    success_or_verification_criteria: ["Verify bounded deterministic behavior only."],
    known_constraints: ["This fixture is synthetic test-only and never pilot evidence."],
    baseline_material: {
      material_kind: "direct_host_manual_handoff",
      material_ref: `baseline:synthetic-test-only:${family}:${index}`,
      material_fingerprint: shaV01("b"),
      normal_user_task_text_allowed: true,
      direct_source_inspection_allowed: true,
      ordinary_host_capabilities_allowed: true,
      safety_or_authority_critical_material_withheld: false,
      evaluated_c1_projection_included: false,
    },
    continuity_material:
      conditionForRealWorkPilotEpisodeV01(index) === "C1"
        ? continuityMaterialV01("c")
        : null,
    freeze_timestamp: FREEZE_AT,
    outcome_known_at_freeze: false,
  };
}

function continuityMaterialV01(fill: string): NonNullable<RealWorkPilotEpisodeFreezeInputV01["continuity_material"]> {
  return {
    material_kind: "codex_current_continuity_projection",
    owner: { ...REAL_WORK_PILOT_C1_OWNER_V01 },
    source_status: "exact",
    snapshot_status: "exact",
    snapshot_binding: shaV01(fill),
    material_ref: "continuity:synthetic-test-only",
    material_fingerprint: shaV01(fill),
    automatic_injection: false,
    hidden_or_unreviewed_material: false,
    policy_injection: false,
  };
}

function sourceRefV01(
  refKind: RealWorkPilotSourceRefV01["ref_kind"],
  ref: string,
  fill: string,
  revision: string | null,
): RealWorkPilotSourceRefV01 {
  return {
    ref_kind: refKind,
    ref,
    fingerprint: shaV01(fill),
    revision,
  };
}

function observedNumberV01(
  value: number,
  basis: "direct_observation" | "existing_safe_receipt",
  refKind: RealWorkPilotSourceRefV01["ref_kind"] = "direct_observation",
) {
  return {
    status: "observed" as const,
    value,
    basis,
    source_refs: [sourceRefV01(refKind, `observation:${basis}:${value}`, "f", null)],
  };
}

function shaV01(fill: string): string {
  return `sha256:${fill.repeat(64)}`;
}

function createSyntheticRepositoryV01(withIgnore = true): string {
  const root = mkdtempSync(path.join(os.tmpdir(), "rw1-synthetic-repository-"));
  execFileSync("git", ["init", "--quiet", root]);
  writeFileSync(path.join(root, ".gitignore"), withIgnore ? ".augnes-lab/\n" : "dist/\n");
  return root;
}

function listFilesV01(root: string): string[] {
  const result: string[] = [];
  const visit = (current: string) => {
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      if (entry.name === ".git") continue;
      const target = path.join(current, entry.name);
      if (entry.isDirectory()) visit(target);
      else result.push(path.relative(root, target));
    }
  };
  visit(root);
  return result;
}

main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.stack : String(error)}\n`);
  process.exitCode = 1;
});
