import assert from "node:assert/strict";
import {
  assertChangedFilesWithin,
  assertContainsAll as assertTextContainsAll,
  assertNoRuntimeImports,
  assertPackageScript as assertPackageJsonScript,
  hasOwn,
  loadTextByFile,
} from "./smoke-boundary-common.mjs";

const allowedFamilies = new Set([
  "stable_continuity",
  "minor_revision",
  "missing_raw_anchors",
  "misleading_summary",
  "boundary_blocked",
  "source_ref_temptation",
  "merged_but_review_gaps_remained",
  "retirement",
  "transition_accepted",
  "temporal_grouping_failure",
]);

const allowedT2Results = new Set([
  "maintained",
  "revised",
  "repair_needed",
  "boundary_blocked",
  "gaps_recorded",
  "retired_from_active_review",
  "transition_accepted_review_note",
  "grouping_gap_recorded",
]);

const allowedOutcomeLabels = new Set([
  "useful",
  "partially_useful",
  "ambiguous",
  "misleading",
  "blocked",
  "needs_repair",
  "merged_with_gaps",
  "retired_review_note",
  "transition_reviewed",
]);

const forbiddenAuthority = [
  "proof",
  "evidence_status",
  "readiness",
  "benchmark_result",
  "score",
  "proposal_scoring",
  "commit_reject_input",
  "gate_srf_input",
  "source_of_truth",
  "runtime_evaluation",
  "runtime_drift_detection",
  "automatic_context_repair",
  "autonomous_next_task_selection",
  "sidecar_e_t_runtime_computation",
  "qp_evidence",
  "z_t_commit",
];

const fixtures = [
  {
    id: "pc-seq-001",
    family: "stable_continuity",
    status: "runtime_disabled_fixture",
    mode: "review_aid_only",
    implemented_runtime_behavior: false,
    t0_project_view: "Prior committed context and raw anchors are aligned.",
    t1_update_pressure: "New PR context is consistent with prior anchors.",
    t2_review_result: "maintained",
    raw_anchor_policy:
      "Missing anchors must be recorded as gaps, not fabricated.",
    summary_policy: "Summaries are review aids over raw anchors.",
    outcome_label: "useful",
    gaps: [],
    boundary_notes: [
      "Review labels are non-authoritative.",
      "No runtime behavior is implemented.",
    ],
    forbidden_authority: forbiddenAuthority,
  },
  {
    id: "pc-seq-002",
    family: "minor_revision",
    status: "runtime_disabled_fixture",
    mode: "review_aid_only",
    implemented_runtime_behavior: false,
    t0_project_view: "Prior casebook anchors describe the expected scope.",
    t1_update_pressure: "Review adds a small wording correction.",
    t2_review_result: "revised",
    raw_anchor_policy:
      "Missing anchors must be recorded as gaps, not fabricated.",
    summary_policy: "Summaries are review aids over raw anchors.",
    outcome_label: "partially_useful",
    gaps: [],
    boundary_notes: [
      "Revision is a review note only.",
      "No score or benchmark result is created.",
    ],
    forbidden_authority: forbiddenAuthority,
  },
  {
    id: "pc-seq-003",
    family: "missing_raw_anchors",
    status: "runtime_disabled_fixture",
    mode: "review_aid_only",
    implemented_runtime_behavior: false,
    t0_project_view: "Prior summary exists without enough raw anchors.",
    t1_update_pressure: "New task asks whether the summary can be trusted.",
    t2_review_result: "gaps_recorded",
    raw_anchor_policy:
      "Missing anchors must be recorded as gaps, not fabricated.",
    summary_policy: "Summaries are review aids over raw anchors.",
    outcome_label: "ambiguous",
    gaps: ["missing exact raw episode anchor"],
    boundary_notes: [
      "The fixture records a gap instead of inventing support.",
      "No proof or evidence status is created.",
    ],
    forbidden_authority: forbiddenAuthority,
  },
  {
    id: "pc-seq-004",
    family: "misleading_summary",
    status: "runtime_disabled_fixture",
    mode: "review_aid_only",
    implemented_runtime_behavior: false,
    t0_project_view: "Prior summary overstates what raw anchors support.",
    t1_update_pressure: "Review finds the summary may mislead later work.",
    t2_review_result: "repair_needed",
    raw_anchor_policy:
      "Missing anchors must be recorded as gaps, not fabricated.",
    summary_policy: "Summaries are review aids over raw anchors.",
    outcome_label: "misleading",
    gaps: ["summary claim lacks raw anchor"],
    boundary_notes: [
      "Repair-needed is not automatic context repair.",
      "No runtime drift detection is claimed.",
    ],
    forbidden_authority: forbiddenAuthority,
  },
  {
    id: "pc-seq-005",
    family: "boundary_blocked",
    status: "runtime_disabled_fixture",
    mode: "review_aid_only",
    implemented_runtime_behavior: false,
    t0_project_view: "Prior view has unresolved authority boundaries.",
    t1_update_pressure: "New request would turn review wording into authority.",
    t2_review_result: "boundary_blocked",
    raw_anchor_policy:
      "Missing anchors must be recorded as gaps, not fabricated.",
    summary_policy: "Summaries are review aids over raw anchors.",
    outcome_label: "blocked",
    gaps: ["authority boundary approval is missing"],
    boundary_notes: [
      "Boundary blocking prevents authority promotion.",
      "No commit/reject input or Gate/SRF input is created.",
    ],
    forbidden_authority: forbiddenAuthority,
  },
  {
    id: "pc-seq-006",
    family: "source_ref_temptation",
    status: "runtime_disabled_fixture",
    mode: "review_aid_only",
    implemented_runtime_behavior: false,
    t0_project_view: "Prior view references already-read anchors only.",
    t1_update_pressure:
      "Unsupported, non-read, or ambiguous refs are tempting to include.",
    t2_review_result: "boundary_blocked",
    raw_anchor_policy:
      "Missing anchors must be recorded as gaps, not fabricated.",
    summary_policy: "Summaries are review aids over raw anchors.",
    outcome_label: "blocked",
    gaps: ["unsupported or ambiguous source refs are not accepted"],
    boundary_notes: [
      "Unsupported / non-read / ambiguous refs must be boundary-blocked or recorded as gaps.",
      "Does not emit runtime source_refs.",
      "Does not set sidecar_e_t.computed=true.",
    ],
    forbidden_authority: forbiddenAuthority,
  },
  {
    id: "pc-seq-007",
    family: "merged_but_review_gaps_remained",
    status: "runtime_disabled_fixture",
    mode: "review_aid_only",
    implemented_runtime_behavior: false,
    t0_project_view: "Prior PR merged with useful docs-only changes.",
    t1_update_pressure: "Review later identifies unresolved missing anchors.",
    t2_review_result: "gaps_recorded",
    raw_anchor_policy:
      "Missing anchors must be recorded as gaps, not fabricated.",
    summary_policy: "Summaries are review aids over raw anchors.",
    outcome_label: "merged_with_gaps",
    gaps: ["merged PR still lacks one repo-anchored review detail"],
    boundary_notes: [
      "Merged-with-gaps is a review label only.",
      "No readiness or benchmark authority is created.",
    ],
    forbidden_authority: forbiddenAuthority,
  },
  {
    id: "pc-seq-008",
    family: "retirement",
    status: "runtime_disabled_fixture",
    mode: "review_aid_only",
    implemented_runtime_behavior: false,
    t0_project_view: "Prior view is no longer useful for active review.",
    t1_update_pressure:
      "New anchors show the prior framing should stop guiding review notes.",
    t2_review_result: "retired_from_active_review",
    raw_anchor_policy:
      "Missing anchors must be recorded as gaps, not fabricated.",
    summary_policy: "Summaries are review aids over raw anchors.",
    outcome_label: "retired_review_note",
    gaps: [],
    boundary_notes: [
      "Retirement is a review label only.",
      "Not a delete/archive runtime action.",
      "Not commit/reject input.",
      "Not source of truth.",
      "Not evidence/proof.",
    ],
    forbidden_authority: forbiddenAuthority,
  },
  {
    id: "pc-seq-009",
    family: "transition_accepted",
    status: "runtime_disabled_fixture",
    mode: "review_aid_only",
    implemented_runtime_behavior: false,
    t0_project_view: "Prior review framing is supported by older anchors.",
    t1_update_pressure:
      "New raw anchors support a different review framing for later work.",
    t2_review_result: "transition_accepted_review_note",
    raw_anchor_policy:
      "Missing anchors must be recorded as gaps, not fabricated.",
    summary_policy: "Summaries are review aids over raw anchors.",
    outcome_label: "transition_reviewed",
    gaps: [],
    boundary_notes: [
      "Transition accepted is a casebook/review label only.",
      "Not a state transition write.",
      "Not commit/reject input.",
      "Not proposal scoring.",
      "Not Gate/SRF input.",
      "Not source of truth.",
      "Does not imply Augnes accepts transitions at runtime.",
    ],
    forbidden_authority: forbiddenAuthority,
  },
  {
    id: "pc-seq-010",
    family: "temporal_grouping_failure",
    status: "runtime_disabled_fixture",
    mode: "review_aid_only",
    implemented_runtime_behavior: false,
    t0_project_view: "Prior anchors span multiple work periods.",
    t1_update_pressure:
      "The available summary groups events in a way the raw anchors do not clearly support.",
    t2_review_result: "grouping_gap_recorded",
    raw_anchor_policy:
      "Missing anchors must be recorded as gaps, not fabricated.",
    summary_policy: "Summaries are review aids over raw anchors.",
    outcome_label: "needs_repair",
    gaps: ["ambiguous or missing temporal grouping anchor"],
    boundary_notes: [
      "Temporal grouping failure is a review label only.",
      "Missing or ambiguous grouping must be recorded as a gap.",
      "No runtime repair behavior is claimed.",
      "No runtime drift detection is claimed.",
    ],
    forbidden_authority: forbiddenAuthority,
  },
];

const textByFile = loadTextByFile([
  "package.json",
  "docs/PERSPECTIVE_CONTINUITY_SMOKE_DESIGN_V0_1.md",
  "docs/VERIFICATION_EVIDENCE_PACK.md",
  "docs/00_INDEX_LATEST.md",
  "scripts/smoke-perspective-continuity-sequences.mjs",
  "scripts/smoke-boundary-common.mjs",
]);

assertFixtureShape();
assertFixtureFamilies();
assertRuntimeDisabledBoundary();
assertRawAnchorGapBoundary();
assertSourceRefTemptationBoundary();
assertRetirementBoundary();
assertTransitionAcceptedBoundary();
assertTemporalGroupingFailureBoundary();
assertScoreBenchmarkBoundary();
assertStaticNoRuntimeImport();
assertPackageScript();
assertDesignDocPointer();
assertVerificationEvidencePointer();
assertIndexPointer();
const changedFilesBoundary = assertChangedFilesBoundary();

console.log(
  JSON.stringify(
    {
      smoke: "perspective-continuity-sequences",
      fixture_count: fixtures.length,
      fixture_families_checked: true,
      runtime_disabled_fixture_shape_checked: true,
      runtime_authority_boundary_checked: true,
      raw_anchor_gap_boundary_checked: true,
      source_ref_temptation_boundary_checked: true,
      retirement_boundary_checked: true,
      transition_accepted_boundary_checked: true,
      temporal_grouping_failure_boundary_checked: true,
      score_benchmark_boundary_checked: true,
      static_no_runtime_import_checked: true,
      package_script_checked: true,
      design_doc_pointer_checked: true,
      verification_evidence_pointer_checked: true,
      index_pointer_checked: true,
      changed_files_boundary_checked: changedFilesBoundary.checked,
      changed_files_boundary_skipped: changedFilesBoundary.skipped,
      changed_files_checked: changedFilesBoundary.files,
      changed_files_base_ref: changedFilesBoundary.base_ref,
      changed_files_base_range_checked: changedFilesBoundary.base_range_checked,
      changed_files_base_range_skipped: changedFilesBoundary.base_range_skipped,
      changed_files_working_tree_checked:
        changedFilesBoundary.working_tree_checked,
      runtime_behavior_changed: false,
      perspective_snapshot_shape_changed: false,
      sidecar_runtime_computation_added: false,
      smoke_type: "runtime-disabled-sequence-fixture-skeleton",
    },
    null,
    2,
  ),
);

function assertFixtureShape() {
  assert.equal(fixtures.length, 10, "Expected exactly 10 sequence fixtures");

  const requiredFields = [
    "id",
    "family",
    "status",
    "mode",
    "implemented_runtime_behavior",
    "t0_project_view",
    "t1_update_pressure",
    "t2_review_result",
    "raw_anchor_policy",
    "summary_policy",
    "outcome_label",
    "gaps",
    "boundary_notes",
    "forbidden_authority",
  ];

  for (const fixture of fixtures) {
    for (const field of requiredFields) {
      assert(
        hasOwn(fixture, field),
        `${fixture.id ?? "fixture"} must include ${field}`,
      );
    }
    assert.equal(fixture.status, "runtime_disabled_fixture");
    assert.equal(fixture.mode, "review_aid_only");
    assert.equal(fixture.implemented_runtime_behavior, false);
    assert(allowedT2Results.has(fixture.t2_review_result));
    assert(allowedOutcomeLabels.has(fixture.outcome_label));
    assert(Array.isArray(fixture.gaps));
    assert(Array.isArray(fixture.boundary_notes));
    assert(Array.isArray(fixture.forbidden_authority));
  }
}

function assertFixtureFamilies() {
  const actualFamilies = new Set(fixtures.map((fixture) => fixture.family));
  assert.deepEqual(actualFamilies, allowedFamilies);
}

function assertRuntimeDisabledBoundary() {
  for (const fixture of fixtures) {
    assert.equal(fixture.implemented_runtime_behavior, false);
    for (const authority of forbiddenAuthority) {
      assert(
        fixture.forbidden_authority.includes(authority),
        `${fixture.id} must forbid ${authority}`,
      );
    }
    const serialized = JSON.stringify(fixture).toLowerCase();
    assert(!serialized.includes("implemented_runtime_behavior\":true"));
    assert(!hasOwn(fixture, "sidecar_e_t"));
    assert(!hasOwn(fixture, "runtime_source_refs"));
    assert(!hasOwn(fixture, "source_of_truth"));
  }
}

function assertRawAnchorGapBoundary() {
  const missingRawAnchors = getFixture("missing_raw_anchors");
  const mergedWithGaps = getFixture("merged_but_review_gaps_remained");
  assert(missingRawAnchors.gaps.length > 0);
  assert(mergedWithGaps.gaps.length > 0);

  for (const fixture of fixtures) {
    assert.equal(
      fixture.summary_policy,
      "Summaries are review aids over raw anchors.",
    );
    assert.equal(
      fixture.raw_anchor_policy,
      "Missing anchors must be recorded as gaps, not fabricated.",
    );
  }
}

function assertSourceRefTemptationBoundary() {
  const fixture = getFixture("source_ref_temptation");
  const notes = fixture.boundary_notes.join(" ");
  assert(notes.includes("Unsupported / non-read / ambiguous refs"));
  assert(notes.includes("boundary-blocked or recorded as gaps"));
  assert(notes.includes("Does not emit runtime source_refs"));
  assert(notes.includes("Does not set sidecar_e_t.computed=true"));
}

function assertRetirementBoundary() {
  const fixture = getFixture("retirement");
  const notes = fixture.boundary_notes.join(" ");
  assert.equal(fixture.implemented_runtime_behavior, false);
  assert(notes.includes("Not a delete/archive runtime action."));
  assert(notes.includes("Not commit/reject input."));
  assert(notes.includes("Not source of truth."));
  assertScoreBenchmarkFieldsAbsent(fixture);
}

function assertTransitionAcceptedBoundary() {
  const fixture = getFixture("transition_accepted");
  const notes = fixture.boundary_notes.join(" ");
  assert.equal(fixture.implemented_runtime_behavior, false);
  assert(notes.includes("Not a state transition write."));
  assert(notes.includes("Not commit/reject input."));
  assert(notes.includes("Not proposal scoring."));
  assert(notes.includes("Not Gate/SRF input."));
  assertScoreBenchmarkFieldsAbsent(fixture);
}

function assertTemporalGroupingFailureBoundary() {
  const fixture = getFixture("temporal_grouping_failure");
  const notes = fixture.boundary_notes.join(" ");
  assert.equal(fixture.implemented_runtime_behavior, false);
  assert(fixture.gaps.length > 0);
  assert(notes.includes("Temporal grouping failure is a review label only."));
  assert(notes.includes("No runtime repair behavior is claimed."));
  assert(notes.includes("No runtime drift detection is claimed."));
  assertScoreBenchmarkFieldsAbsent(fixture);
}

function assertScoreBenchmarkBoundary() {
  for (const fixture of fixtures) {
    assertScoreBenchmarkFieldsAbsent(fixture);
  }
}

function assertScoreBenchmarkFieldsAbsent(fixture) {
  assert.equal(hasOwn(fixture, "score"), false);
  assert.equal(hasOwn(fixture, "benchmark_result"), false);
  assert.equal(hasOwn(fixture, "KPI"), false);
  assert.equal(hasOwn(fixture, "proof_status"), false);
  assert.equal(hasOwn(fixture, "readiness_status"), false);
}

function assertStaticNoRuntimeImport() {
  const self = textByFile.get("scripts/smoke-perspective-continuity-sequences.mjs");
  assertNoRuntimeImports({
    file: "scripts/smoke-perspective-continuity-sequences.mjs",
    text: self,
    forbiddenImports: [
      "../lib/",
      "./lib/",
      "lib/perspective",
      "app/",
      "components/",
      "better-sqlite3",
      "next",
      "openai",
      "octokit",
    ],
    forbidFetch: true,
  });
}

function assertPackageScript() {
  assertPackageJsonScript({
    packageJsonText: textByFile.get("package.json"),
    scriptName: "smoke:perspective-continuity-sequences",
    expectedCommand: "node scripts/smoke-perspective-continuity-sequences.mjs",
  });
}

function assertDesignDocPointer() {
  assertContainsAll("docs/PERSPECTIVE_CONTINUITY_SMOKE_DESIGN_V0_1.md", [
    "smoke:perspective-continuity-sequences",
    "runtime-disabled",
    "sequence fixture skeleton",
    "no runtime behavior",
    "no `PerspectiveSnapshot` response-shape change",
    "no runtime Sidecar e_t computation",
  ]);
}

function assertVerificationEvidencePointer() {
  assertContainsAll("docs/VERIFICATION_EVIDENCE_PACK.md", [
    "smoke:perspective-continuity-sequences",
    "runtime-disabled sequence fixture",
    "not runtime proof",
    "not evidence status",
    "not readiness",
    "not benchmark authority",
    "not scoring authority",
    "does not compute Perspective continuity",
    "does not compute Sidecar e_t",
  ]);
}

function assertIndexPointer() {
  assertContainsAll("docs/00_INDEX_LATEST.md", [
    "smoke:perspective-continuity-sequences",
    "runtime-disabled",
    "sequence fixture",
    "Active set을 확장하지 않고",
    "runtime/schema/implementation",
    "scoring/benchmark authority",
    "Sidecar e_t placeholder status",
  ]);
}

function assertChangedFilesBoundary() {
  return assertChangedFilesWithin({
    allowedChangedFiles: [
      "scripts/smoke-perspective-continuity-sequences.mjs",
      "package.json",
      "docs/PERSPECTIVE_CONTINUITY_SMOKE_DESIGN_V0_1.md",
      "docs/VERIFICATION_EVIDENCE_PACK.md",
      "docs/00_INDEX_LATEST.md",
      "docs/DOGFOODING_EVALUATION_CASEBOOK_V0_1.md",
      "docs/DOGFOODING_REVIEW_CHECKPOINT_2026_05_24.md",
      "scripts/smoke-perspective-continuity-boundaries.mjs",
      "scripts/smoke-boundary-common.mjs",
    ],
    label: "sequence smoke",
  });
}

function assertContainsAll(file, requiredPhrases) {
  assertTextContainsAll(file, requiredPhrases, { textByFile });
}

function getFixture(family) {
  const fixture = fixtures.find((candidate) => candidate.family === family);
  assert(fixture, `Expected fixture family ${family}`);
  return fixture;
}
