import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

const typePath = "types/research-candidate-manual-note-handoff-seed.ts";
const builderPath =
  "lib/research-candidate-review/manual-note-handoff-seed.ts";
const componentPath =
  "components/research-candidate-manual-note-handoff-seed-preview.tsx";
const panelPath =
  "components/research-candidate-manual-note-preview-panel.tsx";
const parserPath = "lib/research-candidate-review/manual-note-parser.ts";
const routePath = "app/research-candidate-review/page.tsx";
const humanSurfaceLinkGridPath =
  "components/human-surface/surface-link-grid.tsx";
const agentWorkplanePath = "components/workplane/agent-workplane.tsx";
const previewUiSmokePath =
  "scripts/smoke-research-candidate-manual-note-preview-ui-v0-1.mjs";
const smokePath =
  "scripts/smoke-research-candidate-manual-note-handoff-seed-v0-1.mjs";
const packagePath = "package.json";

for (const filePath of [
  typePath,
  builderPath,
  componentPath,
  panelPath,
  parserPath,
  routePath,
  humanSurfaceLinkGridPath,
  agentWorkplanePath,
  previewUiSmokePath,
  smokePath,
  packagePath,
]) {
  assert.ok(existsSync(filePath), `${filePath} must exist`);
}

const typeSource = readFileSync(typePath, "utf8");
const builderSource = readFileSync(builderPath, "utf8");
const componentSource = readFileSync(componentPath, "utf8");
const panelSource = readFileSync(panelPath, "utf8");
const routeSource = readFileSync(routePath, "utf8");
const humanSurfaceLinkGridSource = readFileSync(humanSurfaceLinkGridPath, "utf8");
const agentWorkplaneSource = readFileSync(agentWorkplanePath, "utf8");
const packageJson = JSON.parse(readFileSync(packagePath, "utf8"));

assertTypeContract();
assertBuilderStaticBoundaries();
assertComponentIntegration();
assertCurrentSurfaceDiscoverability();
const seed = buildSampleSeed();
assertSeedShape(seed);
assertCopyablePrompt(seed.copyable_prompt);
assertAuthorityBoundary(seed);
assertExistingManualNoteUiSmokePasses();
assertPackageScript();

console.log(
  JSON.stringify(
    {
      smoke: "research-candidate-manual-note-handoff-seed-v0-1",
      pass: true,
      type_contract_checked: true,
      builder_executed_with_parser_output: true,
      copyable_prompt_plain_text_checked: true,
      authority_boundary_checked: true,
      component_integration_checked: true,
      existing_manual_note_ui_smoke_passed: true,
      current_route_and_surface_links_checked: true,
      package_script_checked: true,
    },
    null,
    2,
  ),
);

function assertTypeContract() {
  for (const requiredText of [
    "ResearchCandidateManualNoteHandoffSeedInput",
    "ResearchCandidateReviewPreviewResponse",
    'seed_kind: ResearchCandidateManualNoteHandoffSeedKind',
    'seed_version: ResearchCandidateManualNoteHandoffSeedVersion',
    "selected_context_cards",
    "candidate_summary",
    "copyable_prompt",
    "expected_return_report_fields",
    "expected_observed_delta_seed",
    "reuse_outcome_review_seed",
    "stop_conditions",
    "forbidden_actions",
    "authority_boundary",
    "validation",
    "recommendation_status",
    "next_recommended_slice",
  ]) {
    assert.ok(typeSource.includes(requiredText), `type contract must include ${requiredText}`);
  }
}

function assertBuilderStaticBoundaries() {
  assert.match(
    builderSource,
    /export function buildResearchCandidateManualNoteHandoffSeed/,
    "builder must export buildResearchCandidateManualNoteHandoffSeed",
  );
  assert.match(
    builderSource,
    /ResearchCandidateReviewPreviewResponse/,
    "builder must accept ResearchCandidateReviewPreviewResponse-shaped parser output",
  );
  assert.match(
    builderSource,
    /fnv1a32/,
    "builder must use a deterministic browser-safe fingerprint helper",
  );
  assert.doesNotMatch(
    builderSource,
    /node:crypto|createHash|crypto\.subtle/,
    "builder must not import node crypto or use browser crypto side effects",
  );
  assert.doesNotMatch(
    builderSource,
    /\bfetch\s*\(|XMLHttpRequest|WebSocket|EventSource|NextResponse|CREATE\s+TABLE|ALTER\s+TABLE|INSERT\s+INTO|UPDATE\s+\w+\s+SET/i,
    "builder must not add network, route, DB, SQL, or server behavior",
  );
  assert.doesNotMatch(
    builderSource,
    /\bnew\s+OpenAI\b|api\.openai\.com|GITHUB_TOKEN|octokit|createPullRequest|executeCodex|runCodex|launchCodex|navigator\.sendBeacon/i,
    "builder must not add provider/OpenAI, GitHub automation, Codex execution, or external send behavior",
  );
}

function assertComponentIntegration() {
  assert.match(
    componentSource,
    /export function ResearchCandidateManualNoteHandoffSeedPreview/,
    "handoff seed preview component must be exported",
  );
  assert.match(
    componentSource,
    /Candidate-only handoff seed preview/,
    "component must render the handoff seed preview heading",
  );
  assert.match(
    componentSource,
    /textarea[\s\S]*readOnly/,
    "copyable prompt must render in a read-only textarea",
  );
  assert.doesNotMatch(
    componentSource,
    /navigator\.clipboard|writeText|executeCodex|runCodex|launchCodex|fetch\s*\(|<button\b/i,
    "component must not add clipboard-write, Codex execution, network, or button actions",
  );
  assert.match(
    panelSource,
    /buildResearchCandidateManualNoteHandoffSeed/,
    "manual note panel must build the seed from displayResult",
  );
  assert.match(
    panelSource,
    /ResearchCandidateManualNoteHandoffSeedPreview seed=\{handoffSeed\}/,
    "manual note panel must render the seed preview when displayResult exists",
  );
  assert.match(
    panelSource,
    /preview:\s*displayResult\.preview/,
    "seed must derive from the visible preview, not fabricated lineage",
  );
  assert.match(
    panelSource,
    /warnings:\s*displayResult\.warnings/,
    "seed must include parser warnings",
  );
}

function assertCurrentSurfaceDiscoverability() {
  assert.match(
    routeSource,
    /<ResearchCandidateManualNotePreviewPanel \/>/,
    "current route must remain /research-candidate-review and render the manual note panel",
  );
  assert.match(
    humanSurfaceLinkGridSource,
    /href:\s*"\/research-candidate-review"/,
    "Human Surface link must remain discoverable",
  );
  assert.match(
    agentWorkplaneSource,
    /href="\/research-candidate-review"/,
    "Agent Workplane link must remain discoverable",
  );
}

function buildSampleSeed() {
  const code = `
import { parseManualResearchNoteToPreview } from "./lib/research-candidate-review/manual-note-parser";
import { buildResearchCandidateManualNoteHandoffSeed } from "./lib/research-candidate-review/manual-note-handoff-seed";

const sample = [
  "Research Question: Should manual Research Candidate previews compile into a copyable Codex handoff seed?",
  "Operator Intent: Turn visible candidate-only review output into a bounded future Codex task seed.",
  "Source Title: Manual handoff seed design note",
  "Source Origin: local operator note",
  "Source Identifier: local-manual-handoff-seed-001",
  "Claim: Manual Research Candidate Review output can be used as advisory context for a future Codex task.",
  "Evidence: supports: The parser exposes source refs, claims, evidence, tensions, gaps, perspective deltas, and follow-up candidates.",
  "Tension: The handoff seed could be mistaken for execution authority.",
  "Gap: Need a return binding that asks whether candidate context was helpful or misleading. next: report field review",
  "Perspective Delta: Keep candidate context separate from durable Perspective promotion.",
  "Next: Implement candidate-only handoff seed preview. files: types/research-candidate-manual-note-handoff-seed.ts, lib/research-candidate-review/manual-note-handoff-seed.ts",
  "Next: Validate handoff seed preview. checks: npm run smoke:research-candidate-manual-note-handoff-seed-v0-1, npm run smoke:research-candidate-manual-note-preview-ui-v0-1"
].join("\\n");

const parserResult = parseManualResearchNoteToPreview(sample);
const seed = buildResearchCandidateManualNoteHandoffSeed({
  preview: parserResult.preview,
  warnings: parserResult.warnings,
  source_metadata: {
    result_source: "local_parse",
    parser_version: parserResult.parser_version,
    input_fingerprint: "fnv1a32:sample",
    persisted_preview_draft: false
  },
  target_label: "Manual note handoff seed smoke sample"
});

console.log(JSON.stringify(seed));
`;
  const output = execFileSync("node", ["--import", "tsx", "--eval", code], {
    encoding: "utf8",
  });
  return JSON.parse(output);
}

function assertSeedShape(seed) {
  assert.equal(seed.seed_kind, "research_candidate_manual_note_handoff_seed");
  assert.equal(
    seed.seed_version,
    "research_candidate_manual_note_handoff_seed.v0.1",
  );
  assert.equal(seed.scope, "project:augnes");
  assert.match(seed.seed_fingerprint, /^fnv1a32:[0-9a-f]{8}$/);
  assert.equal(seed.recommendation_status, "ready_for_human_operator_copy_review");
  assert.equal(seed.validation.passed, true);
  assert.equal(seed.validation.no_fabricated_geometry_or_substrate_lineage, true);
  assert.ok(seed.source_refs.includes("source_ref_manual_note_001"));
  assert.deepEqual(seed.selected_claim_candidate_ids, ["claim_candidate_001"]);
  assert.deepEqual(seed.selected_evidence_candidate_ids, ["evidence_candidate_001"]);
  assert.deepEqual(seed.unresolved_tension_candidate_ids, ["tension_candidate_001"]);
  assert.deepEqual(seed.knowledge_gap_candidate_ids, ["knowledge_gap_candidate_001"]);
  assert.deepEqual(seed.perspective_delta_candidate_ids, [
    "perspective_delta_candidate_001",
  ]);
  assert.deepEqual(seed.follow_up_work_candidate_ids, [
    "follow_up_work_candidate_001",
    "follow_up_work_candidate_002",
  ]);
  assert.equal(seed.candidate_summary.claim_count, 1);
  assert.equal(seed.candidate_summary.evidence_count, 1);
  assert.equal(seed.candidate_summary.tension_count, 1);
  assert.equal(seed.candidate_summary.knowledge_gap_count, 1);
  assert.equal(seed.candidate_summary.perspective_delta_count, 1);
  assert.equal(seed.candidate_summary.follow_up_work_count, 2);
  assert.ok(seed.selected_context_cards.length >= 7);
  assert.equal(seed.expected_observed_delta_seed.observed_delta_required, true);
  assert.deepEqual(seed.reuse_outcome_review_seed.allowed_outcomes, [
    "helpful",
    "stale",
    "missing",
    "noisy",
    "misleading",
  ]);
}

function assertCopyablePrompt(prompt) {
  assert.equal(prompt.includes("```"), false, "copyable prompt must not be fenced");
  for (const requiredText of [
    "Mission brief:",
    "Selected source refs:",
    "Candidate claims summary:",
    "Candidate evidence summary:",
    "Unresolved tensions:",
    "Knowledge gaps:",
    "Perspective delta candidates:",
    "Follow-up work candidates:",
    "Expected files from follow-up candidates:",
    "Expected checks from follow-up candidates:",
    "Explicit non-goals:",
    "Return binding fields:",
    "Final report requirements:",
    "docs/AUGNES_CODEX_RESULT_REPORT_TEMPLATE_V0_1.md",
    "changed files",
    "verification run",
    "skipped checks with concrete reasons",
    "observed outcome",
    "remaining friction",
    "whether selected candidate context was helpful/stale/missing/noisy/misleading",
    "expected vs observed delta summary",
    "Do not execute Codex automatically from this preview.",
    "Do not create branch/PR unless a human explicitly uses the copied prompt as a Codex task.",
    "Do not call GitHub automation from Augnes runtime.",
    "Do not call providers/OpenAI.",
    "Do not fetch sources.",
    "Do not run retrieval/RAG/embeddings/vector/FTS/crawler behavior.",
    "Do not write DB, proof, evidence, work item, or canonical Perspective state.",
    "Do not promote Perspective.",
    "Do not allocate product IDs or execute product writes.",
  ]) {
    assert.ok(prompt.includes(requiredText), `copyable prompt must include ${requiredText}`);
  }
}

function assertAuthorityBoundary(seed) {
  assert.equal(seed.authority_boundary.candidate_only, true);
  assert.equal(seed.authority_boundary.preview_only, true);
  assert.equal(seed.authority_boundary.copyable_text_only, true);
  for (const [key, value] of Object.entries(seed.authority_boundary)) {
    if (["candidate_only", "preview_only", "copyable_text_only"].includes(key)) {
      continue;
    }
    assert.equal(value, false, `authority boundary ${key} must be false`);
  }
}

function assertExistingManualNoteUiSmokePasses() {
  execFileSync("node", [previewUiSmokePath], {
    encoding: "utf8",
    stdio: "pipe",
  });
}

function assertPackageScript() {
  assert.equal(
    packageJson.scripts?.["smoke:research-candidate-manual-note-handoff-seed-v0-1"],
    `node ${smokePath}`,
    "package.json must include the handoff seed smoke script",
  );
}
