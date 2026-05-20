import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const cockpitPath = "components/augnes-cockpit.tsx";
const packagePath = "package.json";

const cockpit = readFileSync(cockpitPath, "utf8");
const packageJson = JSON.parse(readFileSync(packagePath, "utf8"));
const perspectiveSource = extractFunctionSource(
  cockpit,
  "function PerspectiveTab",
  "function LedgerTab",
);
const refreshRuntimeSource = extractFunctionSource(
  cockpit,
  "async function refreshRuntime",
  "async function refreshWorkBrief",
);
const metaWmHintPanelSource = extractFunctionSource(
  cockpit,
  "function MetaWmHintPanel",
  "function BslHintPanel",
);
const bslHintPanelSource = extractFunctionSource(
  cockpit,
  "function BslHintPanel",
  "function CompIndexHintPanel",
);
const compIndexHintPanelSource = extractFunctionSource(
  cockpit,
  "function CompIndexHintPanel",
  "function LoopnessHintPanel",
);

assert.equal(
  packageJson.scripts?.["smoke:cockpit-perspective-snapshot"],
  "node scripts/smoke-cockpit-perspective-snapshot.mjs",
  "package.json should register smoke:cockpit-perspective-snapshot",
);

for (const snippet of [
  'import type { PerspectiveSnapshot } from "@/lib/perspective/snapshot"',
  "/api/perspective/snapshot?scope=${SCOPE}",
  'method: "GET"',
]) {
  assertIncludes(cockpit, snippet);
}

assertIncludes(
  refreshRuntimeSource,
  "fetchJson<PerspectiveSnapshot>",
  "Cockpit should load PerspectiveSnapshot through the typed GET read model.",
);
assertIncludes(
  refreshRuntimeSource,
  "/api/perspective/snapshot?scope=${SCOPE}",
  "Cockpit should reference the existing PerspectiveSnapshot endpoint.",
);
assert.equal(
  /\/api\/perspective\/snapshot[\s\S]{0,220}method:\s*"POST"/.test(
    refreshRuntimeSource,
  ),
  false,
  "PerspectiveSnapshot wiring must not POST to the snapshot endpoint.",
);

for (const snippet of [
  "PerspectiveSnapshot is a derived-view-only read model",
  "It is not source of truth",
  "PerspectiveSnapshot current_frame.summary",
  "PerspectiveSnapshot committed_state_basis",
  "PerspectiveSnapshot pending_proposal_pressure",
  "PerspectiveSnapshot evidence_basis",
  "PerspectiveSnapshot work_trace_basis.active and action_trace_basis.recent",
  "{title} details",
  "pending_proposal_pressure details",
  "evidence_basis details",
  "action_trace_basis.recent details",
  "PerspectiveSnapshot open_tensions",
  "PerspectiveSnapshot boundary_next",
  "authority_boundaries",
  "authority_boundaries lane details and source refs",
  "research_diagnostics",
  "research_diagnostics are log_only diagnostic slots only",
  "Meta-WM placeholder is not computed",
  "BSL placeholder is not computed",
  "CompIndex placeholder is not computed",
  "control/view only",
  "computed {String(metaWmHint.computed)}",
  "computed {String(bslHint.computed)}",
  "computed {String(compIndexHint.computed)}",
  "meta_wm_hint null values, source_refs, and boundary notes",
  "No meta_wm_hint source refs",
  "bsl_hint null values, source_refs, and boundary notes",
  "No bsl_hint source refs",
  "comp_index_hint null values, source_refs, and boundary notes",
  "No comp_index_hint source refs",
  "weak trace-pressure hint",
  "loopness_hint source refs and non-authority notes",
  "loopnessHint.version",
  "sidecar_e_t",
  "meta_wm_hint",
  "bsl_hint",
  "loopness_hint",
  "comp_index_hint",
]) {
  assertIncludes(cockpit, snippet);
}

assertIncludes(
  perspectiveSource,
  "proof recording, evidence creation, work",
  "Perspective copy should state the read-only authority boundary.",
);
assertIncludes(
  perspectiveSource,
  "GitHub/OpenAI",
  "Perspective copy should state that snapshot rendering cannot call external adapters.",
);
assertIncludes(
  perspectiveSource,
  "review artifact write authority",
  "Perspective copy should state that snapshot rendering cannot write review artifacts.",
);
assert.equal(
  perspectiveSource.includes(
    '<details className="perspective-detail-panel" open>',
  ),
  false,
  "Perspective read-model detail panels should be collapsed by default.",
);

assert.equal(
  /fetchJson\s*</.test(perspectiveSource),
  false,
  "PerspectiveTab rendering must not introduce direct API writes or reads; loading stays in refreshRuntime.",
);
assert.equal(
  /method:\s*"POST"|method:\s*"PUT"|method:\s*"PATCH"|method:\s*"DELETE"/.test(
    perspectiveSource,
  ),
  false,
  "PerspectiveTab source must not introduce write methods.",
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
    perspectiveSource.includes(forbiddenRoute),
    false,
    `PerspectiveSnapshot UI wiring must not introduce write route: ${forbiddenRoute}`,
  );
}

const perspectiveButtonLabels = [
  ...perspectiveSource.matchAll(/<button\b[\s\S]*?<\/button>/g),
].map(([button]) =>
  button
    .replace(/<[^>]*>/g, " ")
    .replace(/\{[\s\S]*?\}/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase(),
);

for (const forbiddenControl of [
  "approve",
  "publish",
  "retry",
  "proof",
  "create evidence",
  "update work",
  "commit",
  "reject",
  "mailbox",
  "github",
  "openai",
]) {
  assert.equal(
    perspectiveButtonLabels.some((label) => label.includes(forbiddenControl)),
    false,
    `PerspectiveSnapshot UI wiring must not add mutation control: ${forbiddenControl}`,
  );
}

assert.equal(
  /<button\b/.test(metaWmHintPanelSource),
  false,
  "Meta-WM placeholder UI must not introduce action buttons.",
);
assert.equal(
  /<button\b/.test(bslHintPanelSource),
  false,
  "BSL placeholder UI must not introduce action buttons.",
);
assert.equal(
  /<button\b/.test(compIndexHintPanelSource),
  false,
  "CompIndex placeholder UI must not introduce action buttons.",
);

console.log(
  JSON.stringify(
    {
      smoke: "cockpit-perspective-snapshot",
      endpoint_referenced: true,
      endpoint_method: "GET",
      derived_view_only_copy_present: true,
      research_diagnostics_log_only_present: true,
      meta_wm_placeholder_boundary_copy_present: true,
      bsl_placeholder_boundary_copy_present: true,
      comp_index_placeholder_boundary_copy_present: true,
      perspective_write_routes_introduced: false,
      perspective_mutation_controls_introduced: false,
    },
    null,
    2,
  ),
);

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
