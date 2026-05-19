import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const files = {
  snapshot: "lib/perspective/snapshot.ts",
  route: "app/api/perspective/snapshot/route.ts",
  cockpit: "components/augnes-cockpit.tsx",
  perspectiveDoc: "docs/PERSPECTIVE_SNAPSHOT_V0_1.md",
  authorityDoc: "docs/AUTHORITY_MATRIX.md",
  packageJson: "package.json",
};

const snapshot = readFileSync(files.snapshot, "utf8");
const route = readFileSync(files.route, "utf8");
const cockpit = readFileSync(files.cockpit, "utf8");
const perspectiveDoc = readFileSync(files.perspectiveDoc, "utf8");
const authorityDoc = readFileSync(files.authorityDoc, "utf8");
const packageJson = JSON.parse(readFileSync(files.packageJson, "utf8"));

const perspectiveTab = extractFunctionSource(
  cockpit,
  "function PerspectiveTab",
  "function LedgerTab",
);
const refreshRuntime = extractFunctionSource(
  cockpit,
  "async function refreshRuntime",
  "async function refreshWorkBrief",
);
const refreshTemporalPreview = extractFunctionSource(
  cockpit,
  "async function refreshTemporalPreview",
  "async function loadEvidencePack",
);
const researchDiagnosticsPanel = extractFunctionSource(
  cockpit,
  "function ResearchDiagnosticsPanel",
  "function PageHeader",
);

assert.equal(
  packageJson.scripts?.["smoke:perspective-quality"],
  "node scripts/smoke-perspective-quality.mjs",
  "package.json should register smoke:perspective-quality",
);

assertIncludes(
  snapshot,
  'snapshot_version: "perspective_snapshot.v0.1"',
  "PerspectiveSnapshot type must keep the v0.1 version literal.",
);
assertIncludes(
  snapshot,
  'snapshot_version: "perspective_snapshot.v0.1",',
  "PerspectiveSnapshot builder must return the v0.1 version literal.",
);

for (const boundary of [
  "derived_view_only: true",
  "source_of_truth: false",
  "can_commit_or_reject_state: false",
  "can_record_proof: false",
  "can_create_evidence: false",
  "can_update_work: false",
  "can_publish_external: false",
  "can_call_github_or_openai: false",
  "can_write_temporal_review_artifacts: false",
]) {
  assertIncludes(
    snapshot,
    boundary,
    `PerspectiveSnapshot authority_boundaries must keep ${boundary}.`,
  );
}

for (const diagnostic of [
  'mode: "log_only"',
  "sidecar_e_t: null",
  "meta_wm_hint: MetaWmHint",
  'version: "meta_wm_hint.placeholder.v0.1"',
  'status: "placeholder"',
  "computed: false",
  "wm_strength_hat: null",
  "wm_uncertainty_hat: null",
  "history_bias_hat: null",
  "arousal_proxy: null",
  "meta_wm_hat: null",
  "source_refs: []",
  "bsl_hint: null",
  "loopness_hint: LoopnessHint",
  'version: "loopness_hint.v0.1"',
  'mode: "log_only"',
  "source_refs:",
  "comp_index_hint: null",
]) {
  assertIncludes(
    snapshot,
    diagnostic,
    `research_diagnostics must keep log-only shape ${diagnostic}.`,
  );
}

assertIncludes(route, "export function GET", "Snapshot route must remain GET.");
assertIncludes(
  route,
  "buildPerspectiveSnapshot({ scope })",
  "Snapshot route should return the existing read model builder.",
);
assert.equal(
  /export function (POST|PUT|PATCH|DELETE)\b/.test(route),
  false,
  "Snapshot route must not add write handlers.",
);

assertIncludes(
  perspectiveTab,
  "PerspectiveSnapshot is a derived-view-only read model",
  "UI copy must state derived-view-only.",
);
assertIncludes(
  perspectiveTab,
  "It is not source of truth",
  "UI copy must state not source of truth.",
);

for (const section of [
  "current_frame",
  "committed_state_basis",
  "pending_proposal_pressure",
  "evidence_basis",
  "work_trace_basis",
  "action_trace_basis",
  "open_tensions",
  "boundary_next",
  "authority_boundaries",
]) {
  assertIncludes(
    perspectiveTab,
    section,
    `Perspective UI should reference ${section}.`,
  );
}

assertResearchDiagnosticsCopy(researchDiagnosticsPanel);
assertMetaWmPlaceholderBoundaries(snapshot, researchDiagnosticsPanel);
assertLoopnessHintRemainsBoundedLogOnly(snapshot, researchDiagnosticsPanel);

assert.equal(
  /fetchJson\s*</.test(perspectiveTab) || /\bfetch\s*\(/.test(perspectiveTab),
  false,
  "PerspectiveTab rendering must not introduce fetch side effects.",
);
assert.equal(
  /method:\s*"(POST|PUT|PATCH|DELETE)"/.test(perspectiveTab),
  false,
  "PerspectiveTab must not introduce POST/PUT/PATCH/DELETE methods.",
);

for (const forbiddenRoute of [
  "/api/deltas/",
  "/api/actions/run",
  "/api/evidence/records",
  "/api/work/",
  "/api/mailbox/",
  "/api/publications/",
  "/api/temporal-interpretation/review-artifacts/capture",
]) {
  assert.equal(
    perspectiveTab.includes(forbiddenRoute),
    false,
    `PerspectiveTab must not introduce write route ${forbiddenRoute}.`,
  );
}

assertIncludes(
  refreshRuntime,
  "/api/perspective/snapshot?scope=${SCOPE}",
  "Cockpit should load PerspectiveSnapshot through the existing endpoint.",
);
assertIncludes(
  refreshRuntime,
  'method: "GET"',
  "PerspectiveSnapshot load should remain explicit GET.",
);
assert.equal(
  /\/api\/perspective\/snapshot[\s\S]{0,260}method:\s*"(POST|PUT|PATCH|DELETE)"/.test(
    refreshRuntime,
  ),
  false,
  "PerspectiveSnapshot load must not use a write method.",
);

assertIncludes(
  refreshTemporalPreview,
  '"/api/temporal-interpretation/preview"',
  "Existing Temporal Interpretation Preview endpoint should remain wired.",
);
assertIncludes(
  perspectiveTab,
  "Load Temporal Interpretation Preview",
  "Perspective tab should preserve preview load flow.",
);
assertIncludes(
  perspectiveTab,
  "Refresh Temporal Interpretation Preview",
  "Perspective tab should preserve preview refresh flow.",
);
assertIncludes(
  perspectiveTab,
  "onRefreshTemporalPreview",
  "Perspective tab should preserve preview refresh callback.",
);
for (const collapsedDetail of [
  "{title} details",
  "pending_proposal_pressure details",
  "evidence_basis details",
  "action_trace_basis.recent details",
  "boundary_next allowed and forbidden next steps",
  "authority_boundaries lane details and source refs",
]) {
  assertIncludes(
    cockpit,
    collapsedDetail,
    `Perspective tab should retain collapsed detail label: ${collapsedDetail}.`,
  );
}
assert.equal(
  cockpit.includes('<details className="perspective-detail-panel" open>'),
  false,
  "Perspective read-model detail panels should be collapsed by default.",
);

assertIncludes(
  perspectiveDoc,
  "derived read model",
  "PerspectiveSnapshot docs should state derived read model.",
);
assertIncludes(
  perspectiveDoc,
  "not source of truth",
  "PerspectiveSnapshot docs should state not source of truth.",
);
assertIncludes(
  perspectiveDoc,
  "Quality smoke",
  "PerspectiveSnapshot docs should mention the focused quality smoke.",
);
assertIncludes(
  authorityDoc,
  "PerspectiveSnapshot is derived-view-only",
  "Authority matrix should preserve PerspectiveSnapshot derived-view-only note.",
);
assertIncludes(
  authorityDoc,
  "research diagnostic slots are `log_only` placeholders",
  "Authority matrix should preserve research diagnostic placeholder boundary.",
);

console.log(
  JSON.stringify(
    {
      smoke: "perspective-quality",
      files_checked: Object.values(files).filter(
        (file) => file !== files.packageJson,
      ),
      snapshot_version: "perspective_snapshot.v0.1",
      authority_boundaries_preserved: true,
      research_diagnostics_log_only: true,
      meta_wm_placeholder_log_only: true,
      meta_wm_placeholder_not_computed: true,
      loopness_hint_log_only: true,
      cockpit_copy_derived_view_only: true,
      cockpit_copy_not_source_of_truth: true,
      source_ref_oriented_sections_present: true,
      perspective_write_routes_introduced: false,
      perspective_write_methods_introduced: false,
      perspective_fetch_side_effects_introduced: false,
      temporal_preview_flow_preserved: true,
    },
    null,
    2,
  ),
);

function assertResearchDiagnosticsCopy(source) {
  for (const required of [
    "research_diagnostics are log_only diagnostic slots only",
    "Meta-WM",
    "placeholder that is not computed",
    "weak trace-pressure hint",
    "null",
    "not authority",
    "not authority, proof, readiness",
    "Gate input",
    "source of truth",
    "score",
    "signals",
    "source_refs",
    "null values, source_refs, and boundary notes",
    "source refs and non-authority notes",
    "sidecar_e_t",
    "meta_wm_hint",
    "bsl_hint",
    "loopness_hint",
    "comp_index_hint",
  ]) {
    assertIncludes(
      source,
      required,
      `Research diagnostics UI copy should include ${required}.`,
    );
  }

  for (const misleading of [
    "computed metric",
    "computed metrics",
    "readiness metric",
    "proof metric",
    "authority metric",
    "computed sidecar",
    "computed meta-wm",
    "computed bsl",
    "computed loopness",
    "computed compindex",
    "readiness signal",
    "proof signal",
    "authority signal",
  ]) {
    assert.equal(
      source.toLowerCase().includes(misleading),
      false,
      `Research diagnostics UI copy must not present placeholders as ${misleading}.`,
    );
  }
}

function assertMetaWmPlaceholderBoundaries(snapshotSource, panelSource) {
  for (const required of [
    'version: "meta_wm_hint.placeholder.v0.1"',
    'mode: "log_only"',
    'status: "placeholder"',
    "computed: false",
    "wm_strength_hat: null",
    "wm_uncertainty_hat: null",
    "history_bias_hat: null",
    "arousal_proxy: null",
    "meta_wm_hat: null",
    "source_refs: []",
    "Meta-WM is reserved for future working-memory reliability diagnostics.",
    "This placeholder is not computed and has no authority.",
    "It must not affect commit/reject, proposal scoring, Gate/SRF, Claim confidence, Evidence status, publication readiness, or Cockpit actions.",
  ]) {
    assertIncludes(
      snapshotSource,
      required,
      `Meta-WM placeholder shape should include ${required}.`,
    );
  }

  for (const required of [
    "Meta-WM placeholder is not computed",
    "control/view only",
    "not authority, proof, readiness",
    "Gate input",
    "source of truth",
    "Cockpit",
    "action input",
    "computed {String(metaWmHint.computed)}",
  ]) {
    assertIncludes(
      panelSource,
      required,
      `Meta-WM placeholder UI copy should include ${required}.`,
    );
  }

  for (const misleading of [
    "readiness metric",
    "proof metric",
    "authority metric",
    "readiness signal",
    "proof signal",
    "authority signal",
    "publication readiness signal",
    "source of truth metric",
  ]) {
    assert.equal(
      panelSource.toLowerCase().includes(misleading),
      false,
      `Meta-WM placeholder UI must not present it as ${misleading}.`,
    );
  }
}

function assertLoopnessHintRemainsBoundedLogOnly(snapshotSource, panelSource) {
  for (const required of [
    'version: "loopness_hint.v0.1"',
    'mode: "log_only"',
    "score,",
    "level: getLoopnessLevel(score)",
    "signals:",
    "source_refs:",
    "Loopness hint is a weak log-only trace-pressure diagnostic.",
  ]) {
    assertIncludes(
      snapshotSource,
      required,
      `loopness_hint should remain unchanged and log-only: ${required}.`,
    );
  }

  for (const required of [
    "weak trace-pressure hint",
    "loopnessHint.version",
    "loopnessHint.mode",
    "loopnessHint.level",
    "loopnessHint.score",
    "loopness_hint source refs and non-authority notes",
  ]) {
    assertIncludes(
      panelSource,
      required,
      `loopness_hint UI should remain present and log-only: ${required}.`,
    );
  }
}

function assertIncludes(value, expected, message) {
  assert.equal(value.includes(expected), true, message ?? `Missing ${expected}`);
}

function extractFunctionSource(source, startNeedle, endNeedle) {
  const start = source.indexOf(startNeedle);
  assert.notEqual(start, -1, `Missing source start: ${startNeedle}`);
  const end = source.indexOf(endNeedle, start + startNeedle.length);
  assert.notEqual(end, -1, `Missing source end: ${endNeedle}`);
  return source.slice(start, end);
}
