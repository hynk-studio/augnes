import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import {
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";

import { canonicalizeProtocolValueV01 } from "@/lib/vnext/protocol-primitives";
import {
  REAL_WORK_PRE_ACTION_AMBIENT_OVERLAPS_V01,
  REAL_WORK_PRE_ACTION_CLASSIFICATION_BASES_V01,
  REAL_WORK_PRE_ACTION_CONDITION_INTEGRITIES_V01,
  REAL_WORK_PRE_ACTION_OVERLAY_METHOD_V01,
  REAL_WORK_PRE_ACTION_PRESENTATION_CHANNELS_V01,
  REAL_WORK_PRE_ACTION_PRESENTATION_TARGETS_V01,
  REAL_WORK_PRE_ACTION_WORK_DOMAINS_V01,
  REAL_WORK_PRE_ACTION_WORK_PHASES_V01,
  aggregateRealWorkContinuityPreActionOverlayV01,
  assertRealWorkContinuityPreActionOverlayV01,
  createRealWorkContinuityPreActionOverlayV01,
  deriveRealWorkPreActionTaskMixDiagnosticV01,
  formatRealWorkContinuityPreActionOverlayMarkdownV01,
} from "@/lib/vnext/real-work-continuity-pre-action-overlay";
import {
  readRealWorkContinuityPreActionOverlayV01,
  readRealWorkContinuityPreActionOverlaysV01,
  writeRealWorkContinuityPreActionOverlayReportArtifactsV01,
  writeRealWorkContinuityPreActionOverlayV01,
} from "@/lib/vnext/real-work-continuity-pre-action-overlay-artifact-store";
import {
  REAL_WORK_PILOT_ABBA_SCHEDULE_V01,
  REAL_WORK_PILOT_AUTHORITY_V01,
  REAL_WORK_PILOT_C1_OWNER_V01,
  REAL_WORK_PILOT_TASK_FAMILIES_V01,
  aggregateRealWorkContinuityBenefitPilotV01,
  conditionForRealWorkPilotEpisodeV01,
  freezeRealWorkPilotEpisodeV01,
  recordImmediateRealWorkPilotObservationV01,
  recordLaterRealWorkPilotOutcomeReviewV01,
} from "@/lib/vnext/real-work-continuity-benefit-pilot";
import {
  readRealWorkPilotArtifactsV01,
  writeRealWorkPilotEpisodeFreezeV01,
  writeRealWorkPilotImmediateObservationV01,
  writeRealWorkPilotLaterOutcomeReviewV01,
} from "@/lib/vnext/real-work-continuity-benefit-pilot-artifact-store";
import { runRealWorkContinuityPreActionOverlayCliV01 } from "@/scripts/real-work-continuity-pre-action-overlay";
import type {
  RealWorkPilotEpisodeFreezeInputV01,
  RealWorkPilotEpisodeFreezeV01,
  RealWorkPilotImmediateObservationV01,
  RealWorkPilotSourceRefV01,
  RealWorkPilotTaskFamilyV01,
} from "@/types/vnext/real-work-continuity-benefit-pilot";
import type {
  RealWorkContinuityPreActionOverlayInputV01,
  RealWorkPreActionClassificationBasisV01,
  RealWorkPreActionWorkDomainV01,
  RealWorkPreActionWorkPhaseV01,
} from "@/types/vnext/real-work-continuity-pre-action-overlay";

const FREEZE_AT = "2026-08-25T00:00:00.000Z";
const OVERLAY_AT = "2026-08-25T00:01:00.000Z";
const OBSERVED_AT = "2026-08-25T00:10:00.000Z";
const REVIEWED_AT = "2026-08-26T00:00:00.000Z";
const REPORT_AT = "2026-08-27T00:00:00.000Z";

async function main(): Promise<void> {
  assert.deepEqual(REAL_WORK_PILOT_ABBA_SCHEDULE_V01, ["B0", "C1", "C1", "B0"]);
  assert.deepEqual(REAL_WORK_PRE_ACTION_WORK_DOMAINS_V01, [
    "software_engineering",
    "research_synthesis",
    "long_form_writing",
    "general_planning",
    "design_context_maintenance",
    "investigation_open_ended",
    "data_analysis_modeling",
    "operational_casework",
    "learning_skill_development",
    "long_running_selection_procurement",
    "mixed",
    "other_bounded",
    "unknown",
  ]);
  assert.deepEqual(REAL_WORK_PRE_ACTION_WORK_PHASES_V01, [
    "orientation",
    "exploration",
    "convergence",
    "production",
    "validation_review",
    "closure_handoff",
    "mixed_or_unknown",
  ]);
  assert.deepEqual(REAL_WORK_PRE_ACTION_CLASSIFICATION_BASES_V01, [
    "user_declared",
    "source_artifact_bound",
    "bounded_reviewer",
    "unknown",
  ]);
  assert.deepEqual(REAL_WORK_PRE_ACTION_CONDITION_INTEGRITIES_V01, [
    "valid_for_comparison",
    "confounded",
    "continuity_unavailable",
    "source_currentness_invalid",
    "exposure_unknown",
  ]);
  assert.equal(REAL_WORK_PRE_ACTION_PRESENTATION_TARGETS_V01.length, 5);
  assert.equal(REAL_WORK_PRE_ACTION_PRESENTATION_CHANNELS_V01.length, 6);
  assert.equal(REAL_WORK_PRE_ACTION_AMBIENT_OVERLAPS_V01.length, 5);

  const b0Freeze = freezeRealWorkPilotEpisodeV01(freezeInputV01("resume", 1));
  const c1Freeze = freezeRealWorkPilotEpisodeV01(freezeInputV01("resume", 2));
  const coreB0Bytes = JSON.stringify(b0Freeze);
  const coreC1Bytes = JSON.stringify(c1Freeze);
  const coreB0Identity = {
    episode_id: b0Freeze.episode_id,
    freeze_fingerprint: b0Freeze.integrity.fingerprint,
  };
  const coreC1Identity = {
    episode_id: c1Freeze.episode_id,
    freeze_fingerprint: c1Freeze.integrity.fingerprint,
  };

  const exactC1 = createRealWorkContinuityPreActionOverlayV01(
    c1Freeze,
    overlayInputV01(c1Freeze),
  );
  assert.equal(exactC1.condition_integrity, "valid_for_comparison");
  assert.equal(
    exactC1.retrieved_snapshot_fingerprint,
    c1Freeze.continuity_material?.material_fingerprint,
  );
  assert.equal(exactC1.observed_before_first_meaningful_action, true);
  assert.deepEqual(exactC1.authority, REAL_WORK_PILOT_AUTHORITY_V01);
  assert.deepEqual(exactC1.method, REAL_WORK_PRE_ACTION_OVERLAY_METHOD_V01);
  assert.equal(exactC1.method.overlay_owned_provider_calls, 0);
  assert.equal(exactC1.method.overlay_owned_model_calls, 0);
  assert.equal(exactC1.method.overlay_owned_network_calls, 0);
  assert.equal(exactC1.method.overlay_owned_github_calls, 0);
  assert.equal(JSON.stringify(b0Freeze), coreB0Bytes);
  assert.equal(JSON.stringify(c1Freeze), coreC1Bytes);
  assert.deepEqual(coreB0Identity, {
    episode_id: b0Freeze.episode_id,
    freeze_fingerprint: b0Freeze.integrity.fingerprint,
  });
  assert.deepEqual(coreC1Identity, {
    episode_id: c1Freeze.episode_id,
    freeze_fingerprint: c1Freeze.integrity.fingerprint,
  });

  for (const domain of REAL_WORK_PRE_ACTION_WORK_DOMAINS_V01) {
    const basis: RealWorkPreActionClassificationBasisV01 =
      domain === "unknown" ? "unknown" : "bounded_reviewer";
    const overlay = createRealWorkContinuityPreActionOverlayV01(
      b0Freeze,
      overlayInputV01(b0Freeze, {
        work_domain: domain,
        work_domain_classification_basis: basis,
      }),
    );
    assert.equal(overlay.work_domain, domain);
  }
  for (const phase of REAL_WORK_PRE_ACTION_WORK_PHASES_V01) {
    const basis: RealWorkPreActionClassificationBasisV01 =
      phase === "mixed_or_unknown" ? "unknown" : "source_artifact_bound";
    const overlay = createRealWorkContinuityPreActionOverlayV01(
      b0Freeze,
      overlayInputV01(b0Freeze, {
        work_phase: phase,
        work_phase_classification_basis: basis,
      }),
    );
    assert.equal(overlay.work_phase, phase);
  }
  assert.throws(
    () =>
      createRealWorkContinuityPreActionOverlayV01(
        b0Freeze,
        overlayInputV01(b0Freeze, { work_domain: "unbounded_new_domain" as never }),
      ),
    /work_domain_invalid/u,
  );
  assert.throws(
    () =>
      createRealWorkContinuityPreActionOverlayV01(
        b0Freeze,
        overlayInputV01(b0Freeze, { work_phase: "resume_phase" as never }),
      ),
    /work_phase_invalid/u,
  );
  assert.throws(
    () =>
      createRealWorkContinuityPreActionOverlayV01(
        b0Freeze,
        overlayInputV01(b0Freeze, {
          work_domain_classification_basis: "model_inferred" as never,
        }),
      ),
    /classification_basis_invalid/u,
  );
  assert.equal(
    createRealWorkContinuityPreActionOverlayV01(
      b0Freeze,
      overlayInputV01(b0Freeze, {
        work_domain: "mixed",
        work_phase: "mixed_or_unknown",
        work_phase_classification_basis: "unknown",
      }),
    ).work_domain,
    "mixed",
  );

  const orthogonalExamples: Array<
    [RealWorkPilotTaskFamilyV01, 1 | 2 | 3 | 4, RealWorkPreActionWorkPhaseV01]
  > = [
    ["resume", 1, "production"],
    ["verify", 2, "exploration"],
    ["decide", 2, "validation_review"],
  ];
  for (const [family, index, phase] of orthogonalExamples) {
    const freeze = freezeRealWorkPilotEpisodeV01(freezeInputV01(family, index));
    const overlay = createRealWorkContinuityPreActionOverlayV01(
      freeze,
      overlayInputV01(freeze, { work_phase: phase }),
    );
    assert.equal(overlay.task_family, family);
    assert.equal(overlay.work_phase, phase);
  }

  const changedDomain = createRealWorkContinuityPreActionOverlayV01(
    c1Freeze,
    overlayInputV01(c1Freeze, { work_domain: "research_synthesis" }),
  );
  const changedPhase = createRealWorkContinuityPreActionOverlayV01(
    c1Freeze,
    overlayInputV01(c1Freeze, { work_phase: "exploration" }),
  );
  assert.notEqual(changedDomain.integrity.fingerprint, exactC1.integrity.fingerprint);
  assert.notEqual(changedPhase.integrity.fingerprint, exactC1.integrity.fingerprint);
  assert.deepEqual(coreC1Identity, {
    episode_id: c1Freeze.episode_id,
    freeze_fingerprint: c1Freeze.integrity.fingerprint,
  });
  assert.throws(
    () =>
      createRealWorkContinuityPreActionOverlayV01(c1Freeze, {
        ...overlayInputV01(c1Freeze),
        condition_integrity: "valid_for_comparison",
      }),
    /input_keys_invalid/u,
  );

  assert.equal(
    c1OverlayV01(c1Freeze, {
      c1_retrieval: "unavailable",
      evaluated_snapshot_presented: "no",
      retrieved_snapshot_fingerprint: null,
      presentation_target: "unknown",
      presentation_channel: "unknown",
      exposure_observation_basis: "unknown",
    }).condition_integrity,
    "continuity_unavailable",
  );
  assert.equal(
    c1OverlayV01(c1Freeze, {
      c1_retrieval: "unknown",
      evaluated_snapshot_presented: "unknown",
      retrieved_snapshot_fingerprint: null,
      presentation_target: "unknown",
      presentation_channel: "unknown",
      exposure_observation_basis: "unknown",
    }).condition_integrity,
    "exposure_unknown",
  );
  assert.equal(
    c1OverlayV01(c1Freeze, {
      evaluated_snapshot_presented: "no",
    }).condition_integrity,
    "exposure_unknown",
  );
  assert.equal(
    c1OverlayV01(c1Freeze, {
      presentation_target: "unknown",
    }).condition_integrity,
    "exposure_unknown",
  );
  assert.equal(
    c1OverlayV01(c1Freeze, {
      presentation_channel: "unknown",
    }).condition_integrity,
    "exposure_unknown",
  );
  for (const sourceCurrentness of ["stale", "partial", "unknown"] as const) {
    assert.equal(
      c1OverlayV01(c1Freeze, { source_currentness: sourceCurrentness })
        .condition_integrity,
      "source_currentness_invalid",
    );
  }
  assert.throws(
    () =>
      c1OverlayV01(c1Freeze, {
        retrieved_snapshot_fingerprint: shaV01("9"),
      }),
    /c1_snapshot_mismatch/u,
  );
  assert.throws(
    () =>
      c1OverlayV01(c1Freeze, {
        retrieved_snapshot_fingerprint: null,
      }),
    /c1_snapshot_binding_required/u,
  );
  assert.throws(
    () =>
      c1OverlayV01(c1Freeze, {
        exposure_observation_basis: "unknown",
      }),
    /exact_exposure_basis_required/u,
  );

  const validB0 = createRealWorkContinuityPreActionOverlayV01(
    b0Freeze,
    overlayInputV01(b0Freeze),
  );
  assert.equal(validB0.condition_integrity, "valid_for_comparison");
  assert.equal(b0Freeze.baseline_material.normal_user_task_text_allowed, true);
  assert.equal(b0Freeze.baseline_material.direct_source_inspection_allowed, true);
  assert.equal(b0Freeze.baseline_material.ordinary_host_capabilities_allowed, true);
  for (const ambientOverlap of [
    "exact_same_snapshot",
    "source_bound_material_overlap",
  ] as const) {
    assert.equal(
      createRealWorkContinuityPreActionOverlayV01(
        b0Freeze,
        overlayInputV01(b0Freeze, { ambient_overlap: ambientOverlap }),
      ).condition_integrity,
      "confounded",
    );
  }
  assert.equal(
    createRealWorkContinuityPreActionOverlayV01(
      b0Freeze,
      overlayInputV01(b0Freeze, {
        ambient_overlap: "semantic_overlap_candidate",
      }),
    ).condition_integrity,
    "exposure_unknown",
  );
  assert.equal(
    createRealWorkContinuityPreActionOverlayV01(
      b0Freeze,
      overlayInputV01(b0Freeze, {
        ambient_overlap: "unknown",
        exposure_observation_basis: "unknown",
      }),
    ).condition_integrity,
    "exposure_unknown",
  );
  assert.equal(
    createRealWorkContinuityPreActionOverlayV01(
      b0Freeze,
      overlayInputV01(b0Freeze, { source_currentness: "stale" }),
    ).condition_integrity,
    "source_currentness_invalid",
  );

  assert.throws(
    () =>
      createRealWorkContinuityPreActionOverlayV01(
        b0Freeze,
        overlayInputV01(b0Freeze, { observed_at: "not-a-timestamp" }),
      ),
    /observed_at_invalid/u,
  );
  assert.throws(
    () =>
      createRealWorkContinuityPreActionOverlayV01(
        b0Freeze,
        overlayInputV01(b0Freeze, {
          observed_at: "2026-08-24T23:59:59.000Z",
        }),
      ),
    /observation_precedes_freeze/u,
  );
  assert.throws(
    () =>
      createRealWorkContinuityPreActionOverlayV01(b0Freeze, {
        ...overlayInputV01(b0Freeze),
        observed_before_first_meaningful_action: false,
      }),
    /not_before_first_meaningful_action/u,
  );
  assert.throws(
    () =>
      createRealWorkContinuityPreActionOverlayV01(
        b0Freeze,
        overlayInputV01(b0Freeze, {
          pre_action_timing_basis: "inferred_from_cognition" as never,
        }),
      ),
    /timing_basis_invalid/u,
  );

  for (const changed of [
    { workspace_id: "workspace:other" },
    { project_id: "project:other" },
    { work_id: "work:other" },
    { episode_id: "rw1-episode_00000000000000000000000000000000" },
    { freeze_fingerprint: shaV01("8") },
    { pilot_id: "rw1-pilot_00000000000000000000000000000000" },
    { task_family: "verify" as const },
    { condition: "B0" as const },
  ]) {
    assert.throws(
      () =>
        createRealWorkContinuityPreActionOverlayV01(
          c1Freeze,
          overlayInputV01(c1Freeze, changed),
        ),
      /freeze_join_refused/u,
    );
  }
  assert.throws(
    () =>
      createRealWorkContinuityPreActionOverlayV01(c1Freeze, {
        ...overlayInputV01(c1Freeze),
        raw_prompt: "forbidden",
      }),
    /input_keys_invalid/u,
  );
  assert.throws(
    () =>
      createRealWorkContinuityPreActionOverlayV01(c1Freeze, {
        ...overlayInputV01(c1Freeze),
        raw_transcript: "forbidden",
      }),
    /input_keys_invalid/u,
  );
  assert.throws(
    () =>
      createRealWorkContinuityPreActionOverlayV01(c1Freeze, {
        ...overlayInputV01(c1Freeze),
        hidden_reasoning: "forbidden",
      }),
    /input_keys_invalid/u,
  );
  assert.throws(
    () =>
      createRealWorkContinuityPreActionOverlayV01(c1Freeze, {
        ...overlayInputV01(c1Freeze),
        provider_response: "forbidden",
      }),
    /input_keys_invalid/u,
  );
  assert.throws(
    () =>
      createRealWorkContinuityPreActionOverlayV01(
        c1Freeze,
        overlayInputV01(c1Freeze, {
          work_id: "Authorization: Bearer secret-material-must-not-persist",
        }),
      ),
    /secret_like_material_refused/u,
  );

  const overlapMix = deriveRealWorkPreActionTaskMixDiagnosticV01([
    mixObservationV01("b0-overlap", "B0", "software_engineering", "production"),
    mixObservationV01("c1-overlap", "C1", "software_engineering", "production"),
  ]);
  assert.equal(overlapMix.label, "observed_overlap");
  assert.deepEqual(overlapMix.work_domains.overlap, ["software_engineering"]);
  assert.deepEqual(overlapMix.work_phases.overlap, ["production"]);
  assert.equal(overlapMix.causal_comparability_claim, false);
  assert.equal(overlapMix.statistical_equivalence_claim, false);
  const partialMix = deriveRealWorkPreActionTaskMixDiagnosticV01([
    mixObservationV01("b0-partial", "B0", "software_engineering", "production"),
    mixObservationV01("c1-partial", "C1", "software_engineering", "exploration"),
  ]);
  assert.equal(partialMix.label, "partial_overlap");
  const disjointMix = deriveRealWorkPreActionTaskMixDiagnosticV01([
    mixObservationV01("b0-disjoint", "B0", "software_engineering", "production"),
    mixObservationV01("c1-disjoint", "C1", "research_synthesis", "exploration"),
  ]);
  assert.equal(disjointMix.label, "no_observed_overlap");
  assert.equal(
    deriveRealWorkPreActionTaskMixDiagnosticV01([
      mixObservationV01("b0-only", "B0", "software_engineering", "production"),
    ]).label,
    "unknown",
  );
  assert.equal(
    deriveRealWorkPreActionTaskMixDiagnosticV01([
      mixObservationV01("b0-unknown", "B0", "unknown", "production", "unknown"),
      mixObservationV01("c1-known", "C1", "software_engineering", "production"),
    ]).label,
    "unknown",
  );

  const coreReportBefore = aggregateRealWorkContinuityBenefitPilotV01({
    freezes: [c1Freeze],
    observations: [],
    reviews: [],
    generated_at: REPORT_AT,
  });
  const overlayReport = aggregateRealWorkContinuityPreActionOverlayV01({
    freezes: [c1Freeze],
    overlays: [exactC1],
    generated_at: REPORT_AT,
  });
  const coreReportAfter = aggregateRealWorkContinuityBenefitPilotV01({
    freezes: [c1Freeze],
    observations: [],
    reviews: [],
    generated_at: REPORT_AT,
  });
  assert.equal(
    canonicalizeProtocolValueV01(coreReportBefore),
    canonicalizeProtocolValueV01(coreReportAfter),
  );
  assert.equal(coreReportAfter.disposition, "insufficient_real_work");
  assert.equal(overlayReport.overlay_coverage.authentic_real_work.frozen_episode_count, 0);
  assert.equal(overlayReport.overlay_coverage.authentic_real_work.overlay_count, 0);
  assert.equal(overlayReport.overlay_coverage.synthetic_test_only.frozen_episode_count, 1);
  assert.equal(overlayReport.overlay_coverage.synthetic_test_only.overlay_count, 1);
  assert.equal(overlayReport.domain_coverage.synthetic_test_only.software_engineering, 1);
  assert.equal(overlayReport.phase_coverage.synthetic_test_only.production, 1);
  assert.equal(
    overlayReport.condition_integrity_counts_by_condition.synthetic_test_only.C1
      .valid_for_comparison,
    1,
  );
  assert.deepEqual(
    overlayReport.episode_ids_by_validity_state.synthetic_test_only
      .valid_for_comparison,
    [c1Freeze.episode_id],
  );
  assert.equal(overlayReport.task_mix_diagnostic.resume.label, "unknown");
  assert.equal(overlayReport.core_rw1_report_or_disposition_rewrite, false);
  for (const forbiddenReportField of [
    "disposition",
    "usefulness_score",
    "rank",
    "winner",
    "significance_claim",
    "domain_winner",
    "policy_fitness",
    "promotion_recommendation",
  ]) {
    assert.equal(forbiddenReportField in overlayReport, false);
  }
  const markdown = formatRealWorkContinuityPreActionOverlayMarkdownV01(overlayReport);
  assert.match(markdown, /Authentic overlays: 0\/0/u);
  assert.match(markdown, /creates no usefulness disposition/u);

  const artifactRoot = createSyntheticRepositoryV01();
  try {
    const freezePath = writeRealWorkPilotEpisodeFreezeV01(artifactRoot, c1Freeze);
    const freezeBytesBefore = readFileSync(path.join(artifactRoot, freezePath));
    const overlayPath = writeRealWorkContinuityPreActionOverlayV01(
      artifactRoot,
      c1Freeze,
      exactC1,
    );
    const freezeBytesAfter = readFileSync(path.join(artifactRoot, freezePath));
    assert.equal(freezeBytesAfter.equals(freezeBytesBefore), true);
    assert.match(
      overlayPath,
      /^\.augnes-lab\/real-work-continuity-pre-action-overlay\//u,
    );
    assert.equal(
      execFileSync("git", ["-C", artifactRoot, "check-ignore", overlayPath], {
        encoding: "utf8",
      }).trim(),
      overlayPath,
    );
    assert.deepEqual(
      readRealWorkContinuityPreActionOverlayV01(
        artifactRoot,
        c1Freeze.pilot_id,
        c1Freeze.episode_id,
      ),
      exactC1,
    );
    assert.equal(
      readRealWorkContinuityPreActionOverlaysV01(
        artifactRoot,
        c1Freeze.pilot_id,
      ).length,
      1,
    );
    assert.throws(
      () =>
        writeRealWorkContinuityPreActionOverlayV01(
          artifactRoot,
          c1Freeze,
          exactC1,
        ),
      /append_only_artifact_exists/u,
    );
    const overlayBytesBeforeLater = readFileSync(path.join(artifactRoot, overlayPath));
    const observation = immediateObservationV01(c1Freeze);
    writeRealWorkPilotImmediateObservationV01(
      artifactRoot,
      c1Freeze,
      observation,
    );
    const review = laterReviewV01(c1Freeze, observation);
    writeRealWorkPilotLaterOutcomeReviewV01(
      artifactRoot,
      c1Freeze,
      observation,
      review,
    );
    assert.throws(
      () =>
        writeRealWorkContinuityPreActionOverlayV01(
          artifactRoot,
          c1Freeze,
          exactC1,
        ),
      /core_later_artifact_exists/u,
    );
    assert.equal(
      readFileSync(path.join(artifactRoot, overlayPath)).equals(
        overlayBytesBeforeLater,
      ),
      true,
    );
    const coreArtifacts = readRealWorkPilotArtifactsV01(
      artifactRoot,
      c1Freeze.pilot_id,
    );
    assert.equal(coreArtifacts.freezes.length, 1);
    assert.equal(coreArtifacts.observations.length, 1);
    assert.equal(coreArtifacts.reviews.length, 1);
    const reportPaths =
      writeRealWorkContinuityPreActionOverlayReportArtifactsV01(
        artifactRoot,
        overlayReport,
      );
    assert.match(reportPaths.json_path, /overlay-report_[a-f0-9]{32}\.json$/u);
    assert.equal(
      readFileSync(path.join(artifactRoot, reportPaths.markdown_path), "utf8"),
      markdown,
    );
    assert.equal(
      listFilesV01(artifactRoot).some((value) => /\.(?:db|sqlite|sqlite3)$/u.test(value)),
      false,
      "the overlay must not create a product or Core database",
    );
  } finally {
    rmSync(artifactRoot, { recursive: true, force: true });
  }

  const observationFirstRoot = createSyntheticRepositoryV01();
  try {
    writeRealWorkPilotEpisodeFreezeV01(observationFirstRoot, b0Freeze);
    writeRealWorkPilotImmediateObservationV01(
      observationFirstRoot,
      b0Freeze,
      immediateObservationV01(b0Freeze),
    );
    assert.throws(
      () =>
        writeRealWorkContinuityPreActionOverlayV01(
          observationFirstRoot,
          b0Freeze,
          validB0,
        ),
      /core_later_artifact_exists/u,
    );
  } finally {
    rmSync(observationFirstRoot, { recursive: true, force: true });
  }

  const missingFreezeRoot = createSyntheticRepositoryV01();
  try {
    assert.throws(
      () =>
        writeRealWorkContinuityPreActionOverlayV01(
          missingFreezeRoot,
          b0Freeze,
          validB0,
        ),
      /artifact_directory_missing/u,
    );
  } finally {
    rmSync(missingFreezeRoot, { recursive: true, force: true });
  }

  const zeroOverlayReportRoot = createSyntheticRepositoryV01();
  try {
    writeRealWorkPilotEpisodeFreezeV01(zeroOverlayReportRoot, c1Freeze);
    const zeroOverlayReport = aggregateRealWorkContinuityPreActionOverlayV01({
      freezes: [c1Freeze],
      overlays: [],
      generated_at: REPORT_AT,
    });
    const zeroOverlayPaths =
      writeRealWorkContinuityPreActionOverlayReportArtifactsV01(
        zeroOverlayReportRoot,
        zeroOverlayReport,
      );
    assert.match(
      zeroOverlayPaths.json_path,
      /^\.augnes-lab\/real-work-continuity-pre-action-overlay\//u,
    );
    assert.equal(
      zeroOverlayReport.overlay_coverage.synthetic_test_only.overlay_count,
      0,
    );
  } finally {
    rmSync(zeroOverlayReportRoot, { recursive: true, force: true });
  }

  const cliRoot = createSyntheticRepositoryV01();
  try {
    writeRealWorkPilotEpisodeFreezeV01(cliRoot, c1Freeze);
    const recorded = await runRealWorkContinuityPreActionOverlayCliV01(
      [
        "record",
        "--repository-root",
        cliRoot,
        "--pilot-id",
        c1Freeze.pilot_id,
        "--episode-id",
        c1Freeze.episode_id,
      ],
      async () => overlayInputV01(c1Freeze),
    );
    assert.equal(recorded.status, "pre_action_overlay_recorded");
    assert.equal(recorded.condition_integrity, "valid_for_comparison");
    assert.equal(recorded.overlay_owned_provider_calls, 0);
    assert.equal(recorded.overlay_owned_model_calls, 0);
    assert.equal(recorded.overlay_owned_network_calls, 0);
    assert.equal(recorded.overlay_owned_github_calls, 0);
    const reported = await runRealWorkContinuityPreActionOverlayCliV01([
      "report",
      "--repository-root",
      cliRoot,
      "--pilot-id",
      c1Freeze.pilot_id,
      "--generated-at",
      REPORT_AT,
    ]);
    assert.equal(reported.status, "pre_action_overlay_report_written");
    assert.equal(reported.authentic_frozen_episode_count, 0);
    assert.equal(reported.authentic_overlay_count, 0);
    assert.equal(reported.synthetic_test_only_overlay_count, 1);
  } finally {
    rmSync(cliRoot, { recursive: true, force: true });
  }

  assertRealWorkContinuityPreActionOverlayV01(c1Freeze, exactC1);
  const tampered = structuredClone(exactC1);
  tampered.condition_integrity = "confounded";
  assert.throws(
    () => assertRealWorkContinuityPreActionOverlayV01(c1Freeze, tampered),
    /identity_or_fingerprint_invalid/u,
  );

  process.stdout.write(
    `${JSON.stringify({
      status: "passed",
      fixture_classification: "synthetic_test_only",
      authentic_pilot_episodes_created: 0,
      core_rw1_schedule: REAL_WORK_PILOT_ABBA_SCHEDULE_V01,
      core_rw1_files_modified: 0,
      overlay_owned_provider_calls: 0,
      overlay_owned_model_calls: 0,
      overlay_owned_network_calls: 0,
      overlay_owned_github_calls: 0,
      all_authority: false,
    })}\n`,
  );
}

function overlayInputV01(
  freeze: RealWorkPilotEpisodeFreezeV01,
  overrides: Partial<RealWorkContinuityPreActionOverlayInputV01> = {},
): RealWorkContinuityPreActionOverlayInputV01 {
  const isC1 = freeze.condition === "C1";
  return {
    pilot_id: freeze.pilot_id,
    episode_id: freeze.episode_id,
    freeze_fingerprint: freeze.integrity.fingerprint,
    workspace_id: freeze.work_identity.workspace_id,
    project_id: freeze.work_identity.project_id,
    work_id: freeze.work_identity.work_id,
    task_family: freeze.task_family,
    condition: freeze.condition,
    work_domain: "software_engineering",
    work_domain_classification_basis: "source_artifact_bound",
    work_phase: "production",
    work_phase_classification_basis: "bounded_reviewer",
    source_currentness: "exact",
    c1_retrieval: isC1 ? "exact" : "not_applicable",
    evaluated_snapshot_presented: isC1 ? "yes" : "not_applicable",
    retrieved_snapshot_fingerprint: isC1
      ? freeze.continuity_material!.material_fingerprint
      : null,
    presentation_target: "both",
    presentation_channel: isC1 ? "exact_tool_projection" : "user_supplied",
    ambient_overlap: isC1 ? "exact_same_snapshot" : "none_observed",
    exposure_observation_basis: "direct_observation",
    observed_at: OVERLAY_AT,
    observed_before_first_meaningful_action: true,
    pre_action_timing_basis: "bounded_pre_action_source_record",
    ...overrides,
  };
}

function c1OverlayV01(
  freeze: RealWorkPilotEpisodeFreezeV01,
  overrides: Partial<RealWorkContinuityPreActionOverlayInputV01>,
) {
  return createRealWorkContinuityPreActionOverlayV01(
    freeze,
    overlayInputV01(freeze, overrides),
  );
}

function mixObservationV01(
  episodeId: string,
  condition: "B0" | "C1",
  domain: RealWorkPreActionWorkDomainV01,
  phase: RealWorkPreActionWorkPhaseV01,
  domainBasis: RealWorkPreActionClassificationBasisV01 = "source_artifact_bound",
) {
  return {
    episode_id: episodeId,
    condition,
    work_domain: domain,
    work_domain_classification_basis: domainBasis,
    work_phase: phase,
    work_phase_classification_basis: "bounded_reviewer" as const,
  };
}

function freezeInputV01(
  family: RealWorkPilotTaskFamilyV01,
  index: 1 | 2 | 3 | 4,
): RealWorkPilotEpisodeFreezeInputV01 {
  return {
    authenticity: "synthetic_test_only",
    task_family: family,
    family_episode_index: index,
    workspace_id: "workspace:synthetic-rw1a-test-only",
    project_id: "project:synthetic-rw1a-test-only",
    work_id: `work:synthetic-rw1a-test-only:${family}:${index}`,
    source_refs: [
      sourceRefV01(
        "git_revision",
        "source:main",
        "a",
        "1a1aa94abe31a4335858bffe2a7bc4938bec66a6",
      ),
    ],
    natural_task_goal: `Synthetic test-only ${family} fixture for RW1A verification`,
    success_or_verification_criteria: [
      "Verify bounded deterministic overlay behavior only.",
    ],
    known_constraints: [
      "This fixture is synthetic test-only and never pilot evidence.",
    ],
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

function continuityMaterialV01(
  fill: string,
): NonNullable<RealWorkPilotEpisodeFreezeInputV01["continuity_material"]> {
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

function immediateObservationV01(
  freeze: RealWorkPilotEpisodeFreezeV01,
): RealWorkPilotImmediateObservationV01 {
  return recordImmediateRealWorkPilotObservationV01(freeze, {
    episode_id: freeze.episode_id,
    workspace_id: freeze.work_identity.workspace_id,
    project_id: freeze.work_identity.project_id,
    work_id: freeze.work_identity.work_id,
    observed_at: OBSERVED_AT,
    measurements: {},
  });
}

function laterReviewV01(
  freeze: RealWorkPilotEpisodeFreezeV01,
  observation: RealWorkPilotImmediateObservationV01,
) {
  return recordLaterRealWorkPilotOutcomeReviewV01(freeze, observation, {
    episode_id: freeze.episode_id,
    workspace_id: freeze.work_identity.workspace_id,
    project_id: freeze.work_identity.project_id,
    work_id: freeze.work_identity.work_id,
    reviewed_at: REVIEWED_AT,
    label: "insufficient_unknown",
    source_refs: [
      sourceRefV01(
        "later_review_material",
        "review:synthetic-test-only",
        "d",
        null,
      ),
    ],
    later_measurements: {},
    limitations: ["Synthetic test-only later review."],
  });
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

function shaV01(fill: string): string {
  return `sha256:${fill.repeat(64)}`;
}

function createSyntheticRepositoryV01(): string {
  const root = mkdtempSync(path.join(os.tmpdir(), "rw1a-synthetic-repository-"));
  execFileSync("git", ["init", "--quiet", root]);
  writeFileSync(path.join(root, ".gitignore"), ".augnes-lab/\n");
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
