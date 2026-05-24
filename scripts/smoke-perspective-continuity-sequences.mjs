import assert from "node:assert/strict";
import { execSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();

const allowedFamilies = new Set([
  "stable_continuity",
  "minor_revision",
  "missing_raw_anchors",
  "misleading_summary",
  "boundary_blocked",
  "source_ref_temptation",
  "merged_but_review_gaps_remained",
]);

const allowedT2Results = new Set([
  "maintained",
  "revised",
  "repair_needed",
  "boundary_blocked",
  "gaps_recorded",
]);

const allowedOutcomeLabels = new Set([
  "useful",
  "partially_useful",
  "ambiguous",
  "misleading",
  "blocked",
  "needs_repair",
  "merged_with_gaps",
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
];

const textByFile = new Map();
for (const file of [
  "package.json",
  "docs/PERSPECTIVE_CONTINUITY_SMOKE_DESIGN_V0_1.md",
  "docs/VERIFICATION_EVIDENCE_PACK.md",
  "docs/00_INDEX_LATEST.md",
  "scripts/smoke-perspective-continuity-sequences.mjs",
]) {
  assert(existsSync(resolve(file)), `Expected ${file} to exist`);
  textByFile.set(file, read(file));
}

assertFixtureShape();
assertFixtureFamilies();
assertRuntimeDisabledBoundary();
assertRawAnchorGapBoundary();
assertSourceRefTemptationBoundary();
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
      score_benchmark_boundary_checked: true,
      static_no_runtime_import_checked: true,
      package_script_checked: true,
      design_doc_pointer_checked: true,
      verification_evidence_pointer_checked: true,
      index_pointer_checked: true,
      changed_files_boundary_checked: changedFilesBoundary.checked,
      changed_files_boundary_skipped: changedFilesBoundary.skipped,
      changed_files_checked: changedFilesBoundary.files,
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
        Object.hasOwn(fixture, field),
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
    assert(!Object.hasOwn(fixture, "sidecar_e_t"));
    assert(!Object.hasOwn(fixture, "runtime_source_refs"));
    assert(!serialized.includes("source of truth"));
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

function assertScoreBenchmarkBoundary() {
  for (const fixture of fixtures) {
    assert.equal(Object.hasOwn(fixture, "score"), false);
    assert.equal(Object.hasOwn(fixture, "benchmark_result"), false);
    assert.equal(Object.hasOwn(fixture, "KPI"), false);
    assert.equal(Object.hasOwn(fixture, "proof_status"), false);
    assert.equal(Object.hasOwn(fixture, "readiness_status"), false);
  }
}

function assertStaticNoRuntimeImport() {
  const self = textByFile.get("scripts/smoke-perspective-continuity-sequences.mjs");
  const importLines = self
    .split("\n")
    .filter((line) => line.trim().startsWith("import "));
  const forbiddenImports = [
    "../lib/",
    "./lib/",
    "lib/perspective",
    "app/",
    "components/",
    "better-sqlite3",
    "next",
    "openai",
    "octokit",
  ];

  for (const line of importLines) {
    for (const forbiddenImport of forbiddenImports) {
      assert(
        !line.includes(forbiddenImport),
        `Smoke must not import runtime module: ${forbiddenImport}`,
      );
    }
  }
  assert(
    !/\bfetch\s*\(/.test(self),
    "Smoke must not perform or reference fetch calls",
  );
}

function assertPackageScript() {
  const pkg = JSON.parse(textByFile.get("package.json"));
  assert.equal(
    pkg.scripts?.["smoke:perspective-continuity-sequences"],
    "node scripts/smoke-perspective-continuity-sequences.mjs",
  );
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
  try {
    const output = execSync("git diff --name-only HEAD", {
      cwd: repoRoot,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
    const files = output
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
    const allowedChangedFiles = new Set([
      "scripts/smoke-perspective-continuity-sequences.mjs",
      "package.json",
      "docs/PERSPECTIVE_CONTINUITY_SMOKE_DESIGN_V0_1.md",
      "docs/VERIFICATION_EVIDENCE_PACK.md",
      "docs/00_INDEX_LATEST.md",
      "scripts/smoke-perspective-continuity-boundaries.mjs",
    ]);

    for (const file of files) {
      assert(
        allowedChangedFiles.has(file),
        `Unexpected changed file for sequence smoke: ${file}`,
      );
    }

    return { checked: true, skipped: false, files };
  } catch (error) {
    if (error.status === undefined) {
      return { checked: false, skipped: true, files: [] };
    }
    throw error;
  }
}

function assertContainsAll(file, requiredPhrases) {
  const normalizedText = normalizeText(textByFile.get(file));
  for (const phrase of requiredPhrases) {
    assert(
      normalizedText.includes(normalizeText(phrase)),
      `${file} must contain: ${phrase}`,
    );
  }
}

function getFixture(family) {
  const fixture = fixtures.find((candidate) => candidate.family === family);
  assert(fixture, `Expected fixture family ${family}`);
  return fixture;
}

function read(file) {
  return readFileSync(resolve(file), "utf8");
}

function resolve(file) {
  return path.join(repoRoot, file);
}

function normalizeText(text) {
  return text.replace(/\s+/g, " ").trim();
}
