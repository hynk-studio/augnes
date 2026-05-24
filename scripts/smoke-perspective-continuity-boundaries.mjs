import assert from "node:assert/strict";
import {
  assertChangedFilesWithin,
  assertContainsAll as assertTextContainsAll,
  assertNoForbiddenPositivePhrases,
  assertPackageScript as assertPackageJsonScript,
  loadTextByFile,
} from "./smoke-boundary-common.mjs";

const docs = [
  "docs/AUGNES_DOGFOODING_RESEARCH_DIRECTION_V0_1.md",
  "docs/AUGNES_PERSPECTIVE_CONTINUITY_RESEARCH_NOTE_V0_1.md",
  "docs/RAW_EPISODE_CAPTURE_V0_1.md",
  "docs/CODEX_HANDOFF_V0_1.md",
  "docs/DOGFOODING_EPISODE_LOG_V0_1.md",
  "docs/DOGFOODING_EVALUATION_CRITERIA_V0_1.md",
  "docs/DOGFOODING_EVALUATION_CASEBOOK_V0_1.md",
  "docs/PERSPECTIVE_CONTINUITY_SMOKE_DESIGN_V0_1.md",
  "docs/PERSPECTIVE_SNAPSHOT_V0_1.md",
  "docs/VERIFICATION_EVIDENCE_PACK.md",
  "docs/00_INDEX_LATEST.md",
];

const inspectedFiles = [
  ...docs,
  "package.json",
  "scripts/smoke-perspective-continuity-boundaries.mjs",
];

const continuityPublicDocs = [
  "docs/AUGNES_DOGFOODING_RESEARCH_DIRECTION_V0_1.md",
  "docs/AUGNES_PERSPECTIVE_CONTINUITY_RESEARCH_NOTE_V0_1.md",
  "docs/RAW_EPISODE_CAPTURE_V0_1.md",
  "docs/CODEX_HANDOFF_V0_1.md",
  "docs/DOGFOODING_EPISODE_LOG_V0_1.md",
  "docs/DOGFOODING_EVALUATION_CRITERIA_V0_1.md",
  "docs/DOGFOODING_EVALUATION_CASEBOOK_V0_1.md",
  "docs/PERSPECTIVE_CONTINUITY_SMOKE_DESIGN_V0_1.md",
];

const allowedChangedFiles = new Set([
  "scripts/smoke-perspective-continuity-boundaries.mjs",
  "package.json",
  "docs/PERSPECTIVE_CONTINUITY_SMOKE_DESIGN_V0_1.md",
  "docs/VERIFICATION_EVIDENCE_PACK.md",
  "docs/00_INDEX_LATEST.md",
  "docs/AUGNES_PERSPECTIVE_CONTINUITY_RESEARCH_NOTE_V0_1.md",
  "docs/DOGFOODING_EVALUATION_CASEBOOK_V0_1.md",
  "scripts/smoke-perspective-continuity-sequences.mjs",
  "scripts/smoke-boundary-common.mjs",
]);

const textByFile = loadTextByFile(inspectedFiles);

assertPackageScript();
assertPublicWordingBoundary();
assertProtocolNamingBoundary();
assertNonAuthorityStatus();
assertRawAnchorSummaryBoundary();
assertEvaluationScoringBoundary();
assertSidecarPlaceholderBoundary();
assertIndexPointerBoundary();
const changedFilesBoundary = assertChangedFilesBoundary();

const summary = {
  smoke: "perspective-continuity-boundaries",
  required_docs_exist: true,
  package_script_checked: true,
  public_wording_boundary_checked: true,
  protocol_naming_boundary_checked: true,
  non_authority_status_checked: true,
  raw_anchor_summary_boundary_checked: true,
  evaluation_scoring_boundary_checked: true,
  sidecar_placeholder_boundary_checked: true,
  index_pointer_boundary_checked: true,
  changed_files_boundary_checked: changedFilesBoundary.checked,
  changed_files_boundary_skipped: changedFilesBoundary.skipped,
  changed_files_checked: changedFilesBoundary.files,
  runtime_behavior_changed: false,
  perspective_snapshot_shape_changed: false,
  smoke_type: "documentation-boundary-only",
};

console.log(JSON.stringify(summary, null, 2));

function assertPackageScript() {
  assertPackageJsonScript({
    packageJsonText: textByFile.get("package.json"),
    scriptName: "smoke:perspective-continuity-boundaries",
    expectedCommand: "node scripts/smoke-perspective-continuity-boundaries.mjs",
  });
}

function assertPublicWordingBoundary() {
  const forbiddenPositivePhrases = [
    "already improves",
    "evaluates PR quality",
    "detects drift at runtime",
    "repairs context automatically",
    "selects next tasks autonomously",
    "autonomous research agent",
    "production-ready",
    "production ready",
    "self-continuity substrate",
    "cognitive substrate",
    "agent self-model",
    "consciousness",
    "metacognitive",
  ];

  assertNoForbiddenPositivePhrases({
    files: continuityPublicDocs,
    textByFile,
    phrases: forbiddenPositivePhrases,
  });
}

function assertProtocolNamingBoundary() {
  const forbiddenProtocolNames = [
    "Perspective continuity protocol",
    "AUGNES_PERSPECTIVE_CONTINUITY_PROTOCOL",
    "PERSPECTIVE_CONTINUITY_PROTOCOL",
  ];

  const files = [
    "docs/AUGNES_PERSPECTIVE_CONTINUITY_RESEARCH_NOTE_V0_1.md",
    "docs/PERSPECTIVE_CONTINUITY_SMOKE_DESIGN_V0_1.md",
    "docs/00_INDEX_LATEST.md",
  ];

  for (const file of files) {
    const text = textByFile.get(file);
    for (const phrase of forbiddenProtocolNames) {
      assert(
        !text.includes(phrase),
        `${file} must not introduce public protocol naming: ${phrase}`,
      );
    }
  }
}

function assertNonAuthorityStatus() {
  assertContainsAll(
    "docs/AUGNES_PERSPECTIVE_CONTINUITY_RESEARCH_NOTE_V0_1.md",
    [
      "research-note-only",
      "non-SSOT",
      "no runtime behavior",
      "no schema authority",
      "no implementation authority",
      "no diagnostic authority",
      "no evaluation authority",
      "no production-readiness claim",
    ],
  );

  assertContainsAll("docs/PERSPECTIVE_CONTINUITY_SMOKE_DESIGN_V0_1.md", [
    "smoke-design-only",
    "non-SSOT",
    "no runtime behavior",
    "no schema authority",
    "no implementation authority",
    "no diagnostic authority",
    "no evaluation authority",
    "no evidence/proof authority",
    "no benchmark authority",
    "no scoring authority",
    "no smoke script implemented by PR #187",
    "smoke:perspective-continuity-boundaries",
    "documentation-boundary-only",
  ]);
}

function assertRawAnchorSummaryBoundary() {
  assertContainsAll("docs/RAW_EPISODE_CAPTURE_V0_1.md", [
    "Summaries are review aids over raw anchors",
  ]);
  assertContainsAll("docs/DOGFOODING_EPISODE_LOG_V0_1.md", [
    "Episode summaries are review aids",
  ]);
  assertContainsAll("docs/DOGFOODING_EVALUATION_CASEBOOK_V0_1.md", [
    "Case summaries are review aids over raw anchors",
    "Missing anchors should not be invented",
  ]);
  assertContainsAll("docs/DOGFOODING_EVALUATION_CRITERIA_V0_1.md", [
    "Case-based before metrics",
    "Raw anchors before summaries",
    "Gaps before fabrication",
  ]);
}

function assertEvaluationScoringBoundary() {
  for (const file of [
    "docs/DOGFOODING_EVALUATION_CRITERIA_V0_1.md",
    "docs/DOGFOODING_EVALUATION_CASEBOOK_V0_1.md",
  ]) {
    assertContainsAll(file, [
      "no benchmark",
      "no KPI",
      "no score system",
      "no runtime evaluation",
      "no proof",
      "no evidence status",
      "no readiness claim",
    ]);
  }
}

function assertSidecarPlaceholderBoundary() {
  assertContainsAll("docs/PERSPECTIVE_CONTINUITY_SMOKE_DESIGN_V0_1.md", [
    "sidecar_e_t",
    "structured placeholders",
    "no runtime Sidecar e_t computation",
    "no `sidecar_e_t.computed=true`",
    "no runtime `sidecar_e_t.source_refs` emission",
    "no QP evidence",
    "no z_t commit",
  ]);

  assertContainsAll("docs/PERSPECTIVE_SNAPSHOT_V0_1.md", [
    "`loopness_hint` is the only bounded `log_only` diagnostic object",
    "sidecar_e_t",
    "structured placeholder",
  ]);
}

function assertIndexPointerBoundary() {
  const index = "docs/00_INDEX_LATEST.md";
  assertContainsAll(index, [
    "PERSPECTIVE_CONTINUITY_SMOKE_DESIGN_V0_1.md",
    "Active set을 확장하지 않고",
    "runtime/schema/implementation",
    "scoring/benchmark authority",
    "smoke:perspective-continuity-boundaries",
    "documentation-boundary-only",
    "`PerspectiveSnapshot` behavior",
    "Sidecar e_t placeholder status",
    "runtime sequence fixture behavior",
  ]);
}

function assertChangedFilesBoundary() {
  return assertChangedFilesWithin({
    allowedChangedFiles,
    label: "docs boundary smoke",
  });
}

function assertContainsAll(file, requiredPhrases) {
  assertTextContainsAll(file, requiredPhrases, { textByFile });
}
