import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

const typePath =
  "types/research-candidate-manual-note-handoff-result-intake.ts";
const builderPath =
  "lib/research-candidate-review/manual-note-handoff-result-intake.ts";
const componentPath =
  "components/research-candidate-manual-note-handoff-result-intake-panel.tsx";
const seedComponentPath =
  "components/research-candidate-manual-note-handoff-seed-preview.tsx";
const seedTypePath = "types/research-candidate-manual-note-handoff-seed.ts";
const seedBuilderPath =
  "lib/research-candidate-review/manual-note-handoff-seed.ts";
const parserPath = "lib/research-candidate-review/manual-note-parser.ts";
const routePath = "app/research-candidate-review/page.tsx";
const humanSurfaceLinkGridPath =
  "components/human-surface/surface-link-grid.tsx";
const agentWorkplanePath = "components/workplane/agent-workplane.tsx";
const seedSmokePath =
  "scripts/smoke-research-candidate-manual-note-handoff-seed-v0-1.mjs";
const previewUiSmokePath =
  "scripts/smoke-research-candidate-manual-note-preview-ui-v0-1.mjs";
const smokePath =
  "scripts/smoke-research-candidate-manual-note-handoff-result-intake-v0-1.mjs";
const packagePath = "package.json";

for (const filePath of [
  typePath,
  builderPath,
  componentPath,
  seedComponentPath,
  seedTypePath,
  seedBuilderPath,
  parserPath,
  routePath,
  humanSurfaceLinkGridPath,
  agentWorkplanePath,
  seedSmokePath,
  previewUiSmokePath,
  smokePath,
  packagePath,
]) {
  assert.ok(existsSync(filePath), `${filePath} must exist`);
}

const typeSource = readFileSync(typePath, "utf8");
const builderSource = readFileSync(builderPath, "utf8");
const componentSource = readFileSync(componentPath, "utf8");
const seedComponentSource = readFileSync(seedComponentPath, "utf8");
const routeSource = readFileSync(routePath, "utf8");
const humanSurfaceLinkGridSource = readFileSync(humanSurfaceLinkGridPath, "utf8");
const agentWorkplaneSource = readFileSync(agentWorkplanePath, "utf8");
const packageJson = JSON.parse(readFileSync(packagePath, "utf8"));

assertTypeContract();
assertBuilderStaticBoundaries();
assertComponentStaticBoundaries();
assertCurrentSurfaceStillDiscoverable();
const sample = buildSampleIntake();
assertIntakeShape(sample.intake);
assertExpectedObservedDeltaDraft(sample.intake);
assertReuseOutcomeDrafts(sample.outcomes);
assertMissingReuseOutcome(sample.missingReuseOutcomeIntake);
assertExistingManualNoteSmokesPass();
assertPackageScript();

console.log(
  JSON.stringify(
    {
      smoke: "research-candidate-manual-note-handoff-result-intake-v0-1",
      pass: true,
      type_contract_checked: true,
      builder_executed_with_manual_parser_and_handoff_seed: true,
      expected_observed_delta_draft_checked: true,
      reuse_outcome_draft_checked: true,
      missing_reuse_outcome_incomplete_checked: true,
      component_local_only_checked: true,
      existing_seed_and_manual_note_ui_smokes_passed: true,
      package_script_checked: true,
    },
    null,
    2,
  ),
);

function assertTypeContract() {
  for (const requiredText of [
    "ResearchCandidateManualNoteHandoffResultIntakeInput",
    "ResearchCandidateManualNoteHandoffSeed",
    'intake_kind: ResearchCandidateManualNoteHandoffResultIntakeKind',
    'intake_version: ResearchCandidateManualNoteHandoffResultIntakeVersion',
    "source_handoff_seed_fingerprint",
    "result_text_fingerprint",
    "parsed_result_summary",
    "changed_files",
    "verification_items",
    "skipped_checks",
    "remaining_friction",
    "expected_return_field_coverage",
    "expected_observed_delta_draft",
    "reuse_outcome_draft",
    "missing_required_return_fields",
    "authority_boundary",
    "validation",
    "recommendation_status",
  ]) {
    assert.ok(typeSource.includes(requiredText), `type contract must include ${requiredText}`);
  }

  for (const falseBoundary of [
    "source_of_truth: false",
    "can_write_db: false",
    "can_record_proof: false",
    "can_create_evidence: false",
    "can_update_work: false",
    "can_commit_or_reject_state: false",
    "can_promote_perspective: false",
    "can_create_work_item: false",
    "can_call_github: false",
    "can_execute_codex: false",
    "can_call_providers_or_openai: false",
    "can_fetch_sources: false",
    "can_run_retrieval_rag_embeddings_vector_fts_or_crawler: false",
    "can_send_external_handoff: false",
    "can_allocate_product_ids: false",
    "can_execute_product_write: false",
  ]) {
    assert.ok(
      typeSource.includes(falseBoundary),
      `authority boundary must declare ${falseBoundary}`,
    );
  }
}

function assertBuilderStaticBoundaries() {
  assert.match(
    builderSource,
    /export function buildResearchCandidateManualNoteHandoffResultIntake/,
    "builder must export buildResearchCandidateManualNoteHandoffResultIntake",
  );
  assert.match(
    builderSource,
    /handoff_seed/,
    "builder must accept a handoff seed input",
  );
  assert.match(
    builderSource,
    /codex_result_report_text/,
    "builder must accept pasted Codex result report text",
  );
  assert.match(
    builderSource,
    /fnv1a32/,
    "builder must use deterministic browser-safe fingerprinting",
  );
  assert.doesNotMatch(
    builderSource,
    /node:crypto|createHash|crypto\.subtle/,
    "builder must not use server or browser crypto side effects",
  );
  assert.doesNotMatch(
    builderSource,
    /\bfetch\s*\(|XMLHttpRequest|WebSocket|EventSource|NextResponse|Request\(|Response\(|CREATE\s+TABLE|ALTER\s+TABLE|INSERT\s+INTO|UPDATE\s+\w+\s+SET|DELETE\s+FROM/i,
    "builder must not add network, route, DB, SQL, or server behavior",
  );
  assert.doesNotMatch(
    builderSource,
    /\bnew\s+OpenAI\b|api\.openai\.com|GITHUB_TOKEN|octokit|createPullRequest|mergePullRequest|executeCodex|runCodex|launchCodex|retrieveSources|ragIndex|vectorStore|scrapeSource|navigator\.sendBeacon/i,
    "builder must not add provider/OpenAI, GitHub automation, Codex execution, retrieval, source-fetch, or external send behavior",
  );
  assert.doesNotMatch(
    builderSource,
    /writeExpectedObservedDelta|writeReuseOutcome|write.*Proof|write.*Evidence|createWorkItem|promotePerspective|commitState|rejectState|allocateProductId/i,
    "builder must not introduce proof, evidence, work, Perspective, state, or product-write behavior",
  );
}

function assertComponentStaticBoundaries() {
  assert.match(
    componentSource,
    /export function ResearchCandidateManualNoteHandoffResultIntakePanel/,
    "component must export the result intake panel",
  );
  assert.match(
    componentSource,
    /buildResearchCandidateManualNoteHandoffResultIntake/,
    "component must call the local deterministic builder",
  );
  assert.match(componentSource, /<textarea\b/, "component must render a textarea");
  assert.match(
    componentSource,
    /Preview result intake/,
    "component must expose a local preview action",
  );
  assert.match(
    componentSource,
    /Clear result intake/,
    "component must expose a local clear action",
  );
  assert.match(
    componentSource,
    /useState/,
    "component must keep pasted text in local React state",
  );
  assert.doesNotMatch(
    componentSource,
    /\bfetch\s*\(|navigator\.clipboard|writeText|localStorage|sessionStorage|indexedDB|document\.cookie|NextResponse|Request\(|Response\(|OPENAI_API_KEY|api\.openai\.com|new\s+OpenAI|GITHUB_TOKEN|octokit|executeCodex|runCodex|launchCodex/i,
    "component must not add network, storage, clipboard, provider, GitHub, or Codex behavior",
  );
  assert.doesNotMatch(
    componentSource,
    /writeExpectedObservedDelta|writeReuseOutcome|write.*Proof|write.*Evidence|createWorkItem|promotePerspective|commitState|rejectState|allocateProductId/i,
    "component must not add durable write or approval behavior",
  );
  assert.match(
    seedComponentSource,
    /ResearchCandidateManualNoteHandoffResultIntakePanel/,
    "handoff seed preview must render the result intake panel under the copyable prompt",
  );
}

function assertCurrentSurfaceStillDiscoverable() {
  assert.match(
    routeSource,
    /<ResearchCandidateManualNotePreviewPanel \/>/,
    "current route must remain /research-candidate-review",
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

function buildSampleIntake() {
  const code = `
import { parseManualResearchNoteToPreview } from "./lib/research-candidate-review/manual-note-parser";
import { buildResearchCandidateManualNoteHandoffSeed } from "./lib/research-candidate-review/manual-note-handoff-seed";
import { buildResearchCandidateManualNoteHandoffResultIntake } from "./lib/research-candidate-review/manual-note-handoff-result-intake";

const note = [
  "Research Question: Can manual Research Candidate context return as a result intake draft?",
  "Operator Intent: Use candidate-only context to seed a future Codex task and review the returned report.",
  "Source Title: Manual result intake note",
  "Source Origin: local operator note",
  "Source Identifier: local-manual-result-intake-001",
  "Claim: A pasted Codex result report can be parsed into candidate-only result intake material.",
  "Evidence: supports: The handoff seed asks for changed files, verification, skipped checks, observed outcome, remaining friction, reuse outcome, and expected vs observed delta.",
  "Tension: A PR URL or smoke pass can be mistaken for proof or durable completion.",
  "Gap: Need missing-return-field warnings for incomplete reports. next: browser validation",
  "Perspective Delta: Keep reuse feedback as draft material until a later authorized ledger slice.",
  "Next: Implement local result intake preview. files: types/research-candidate-manual-note-handoff-result-intake.ts, lib/research-candidate-review/manual-note-handoff-result-intake.ts, components/research-candidate-manual-note-handoff-result-intake-panel.tsx",
  "Next: Validate local result intake preview. checks: npm run smoke:research-candidate-manual-note-handoff-result-intake-v0-1, npm run smoke:research-candidate-manual-note-handoff-seed-v0-1"
].join("\\n");

const parserResult = parseManualResearchNoteToPreview(note);
const seed = buildResearchCandidateManualNoteHandoffSeed({
  preview: parserResult.preview,
  warnings: parserResult.warnings,
  source_metadata: {
    result_source: "local_parse",
    parser_version: parserResult.parser_version,
    input_fingerprint: "fnv1a32:sample-result-intake",
    persisted_preview_draft: false
  },
  target_label: "Manual handoff result intake smoke sample"
});

const report = [
  "# Summary",
  "result_status: complete",
  "pr_url: https://github.com/hynk-studio/augnes/pull/1000",
  "pr_number: 1000",
  "live_host_observation: /research-candidate-review rendered the local result intake panel.",
  "proof_evidence_rows_written: false",
  "event_rows_created_or_mutated: false",
  "work_status_changed: false",
  "state_committed_or_rejected: false",
  "observed_outcome: The local result intake preview produced a draft without creating durable state.",
  "",
  "## Files changed",
  "- types/research-candidate-manual-note-handoff-result-intake.ts",
  "- lib/research-candidate-review/manual-note-handoff-result-intake.ts",
  "- components/research-candidate-manual-note-handoff-result-intake-panel.tsx",
  "",
  "## Verification",
  "- npm run typecheck passed",
  "- npm run smoke:research-candidate-manual-note-handoff-result-intake-v0-1 passed",
  "",
  "## Skipped checks",
  "- node scripts/browser-validate-research-candidate-manual-note-lane-v0-1.mjs skipped: repo-local Playwright unavailable",
  "",
  "## Remaining caveats",
  "- Repo-local Playwright resolution remains a separate tooling issue.",
  "",
  "## Skipped checks and caveats",
  "- No ambiguous combined-section lines.",
  "",
  "selected candidate context outcome: helpful",
  "expected vs observed delta summary: Candidate context helped identify the exact return binding fields and the local-only result-intake boundary.",
  "",
  "## Authority boundary statement",
  "Candidate-only local preview; no proof/evidence rows, no work status change, and no state commit."
].join("\\n");

const missingReuseOutcomeReport = report
  .replace("selected candidate context outcome: helpful\\n", "")
  .replace("expected vs observed delta summary: Candidate context helped identify the exact return binding fields and the local-only result-intake boundary.", "expected vs observed delta summary: The expected delta was partially observed.");

const outcomeReports = ["helpful", "stale", "missing", "noisy", "misleading"].map((label) => ({
  label,
  intake: buildResearchCandidateManualNoteHandoffResultIntake({
    handoff_seed: seed,
    codex_result_report_text: report.replace("selected candidate context outcome: helpful", "selected candidate context outcome: " + label),
    source_metadata: { result_source: "sample_smoke" }
  })
}));

const intake = buildResearchCandidateManualNoteHandoffResultIntake({
  handoff_seed: seed,
  codex_result_report_text: report,
  source_metadata: { result_source: "sample_smoke" }
});
const missingReuseOutcomeIntake = buildResearchCandidateManualNoteHandoffResultIntake({
  handoff_seed: seed,
  codex_result_report_text: missingReuseOutcomeReport,
  source_metadata: { result_source: "sample_smoke" }
});

console.log(JSON.stringify({ seed, intake, outcomes: outcomeReports, missingReuseOutcomeIntake }));
`;
  const output = execFileSync("node", ["--import", "tsx", "--eval", code], {
    encoding: "utf8",
  });
  return JSON.parse(output);
}

function assertIntakeShape(intake) {
  assert.equal(
    intake.intake_kind,
    "research_candidate_manual_note_handoff_result_intake",
  );
  assert.equal(
    intake.intake_version,
    "research_candidate_manual_note_handoff_result_intake.v0.1",
  );
  assert.match(intake.source_handoff_seed_fingerprint, /^fnv1a32:[0-9a-f]{8}$/);
  assert.match(intake.result_text_fingerprint, /^fnv1a32:[0-9a-f]{8}$/);
  assert.equal(intake.fingerprint_algorithm, "fnv1a32_text_v0_1");
  assert.equal(intake.recommendation_status, "ready_for_operator_review");
  assert.equal(intake.validation.passed, true);
  assert.equal(intake.validation.raw_result_text_retained, false);
  assert.equal(Object.hasOwn(intake, "codex_result_report_text"), false);
  assert.equal(Object.hasOwn(intake, "raw_result_text"), false);
  assert.deepEqual(intake.changed_files, [
    "components/research-candidate-manual-note-handoff-result-intake-panel.tsx",
    "lib/research-candidate-review/manual-note-handoff-result-intake.ts",
    "types/research-candidate-manual-note-handoff-result-intake.ts",
  ]);
  assert.equal(intake.verification_items.length, 2);
  assert.equal(intake.verification_items[0].status, "passed");
  assert.equal(intake.skipped_checks.length, 1);
  assert.ok(
    intake.skipped_checks.includes(
      "node scripts/browser-validate-research-candidate-manual-note-lane-v0-1.mjs skipped: repo-local Playwright unavailable",
    ),
    "template report must still preserve the real skipped check",
  );
  assert.equal(intake.remaining_friction.length, 1);
  assert.ok(
    intake.remaining_friction.includes(
      "Repo-local Playwright resolution remains a separate tooling issue.",
    ),
    "template report must preserve real remaining caveat text",
  );
  assert.equal(
    intake.remaining_friction.includes("Skipped checks and caveats"),
    false,
    "template heading must not leak into remaining_friction",
  );
  assert.equal(
    intake.remaining_friction.includes("No ambiguous combined-section lines."),
    false,
    "template skipped-checks-and-caveats bullet must not leak into remaining_friction",
  );
  assert.equal(intake.parsed_result_summary.result_status, "complete");
  assert.equal(intake.parsed_result_summary.pr_number, 1000);
  assert.equal(
    intake.parsed_result_summary.pr_url,
    "https://github.com/hynk-studio/augnes/pull/1000",
  );
  assert.equal(intake.parsed_result_summary.proof_evidence_rows_written, false);
  assert.equal(intake.parsed_result_summary.event_rows_created_or_mutated, false);
  assert.equal(intake.parsed_result_summary.work_status_changed, false);
  assert.equal(intake.parsed_result_summary.state_committed_or_rejected, false);
  assert.equal(
    intake.authority_boundary_findings.pr_url_is_not_requirement_completion,
    true,
  );
  assert.equal(
    intake.authority_boundary_findings.verification_is_not_proof_or_evidence,
    true,
  );
  assert.deepEqual(intake.missing_required_return_fields, []);
  assert.deepEqual(
    intake.warning_reasons,
    [],
    "documented Skipped checks and caveats heading must not create warnings",
  );
  for (const [key, value] of Object.entries(intake.authority_boundary)) {
    if (["candidate_only", "preview_only", "local_parse_only"].includes(key)) {
      assert.equal(value, true, `authority boundary ${key} must be true`);
    } else {
      assert.equal(value, false, `authority boundary ${key} must be false`);
    }
  }
}

function assertExpectedObservedDeltaDraft(intake) {
  assert.equal(
    intake.expected_observed_delta_draft.expected_summary,
    "Future Codex work should report whether the selected manual Research Candidate context materially improved the bounded implementation result.",
  );
  assert.equal(
    intake.expected_observed_delta_draft.observed_summary,
    "Candidate context helped identify the exact return binding fields and the local-only result-intake boundary.",
  );
  assert.equal(
    intake.expected_observed_delta_draft.status,
    "ready_for_operator_review",
  );
  assert.equal(intake.expected_observed_delta_draft.draft_only, true);
  assert.equal(intake.expected_observed_delta_draft.source_of_truth, false);
  assert.equal(intake.expected_observed_delta_draft.creates_record, false);
  assert.equal(intake.expected_observed_delta_draft.creates_proof_or_evidence, false);
  assert.equal(intake.expected_observed_delta_draft.approves_or_commits_state, false);

  for (const requiredField of [
    "changed files",
    "verification run",
    "skipped checks with concrete reasons",
    "observed outcome",
    "remaining friction",
    "whether selected candidate context was helpful/stale/missing/noisy/misleading",
    "expected vs observed delta summary",
  ]) {
    const coverage = intake.expected_return_field_coverage.find(
      (field) => field.field === requiredField,
    );
    assert.ok(coverage, `coverage must include ${requiredField}`);
    assert.equal(coverage.present, true, `${requiredField} must be present`);
  }
}

function assertReuseOutcomeDrafts(outcomes) {
  assert.equal(outcomes.length, 5);
  for (const { label, intake } of outcomes) {
    assert.equal(
      intake.reuse_outcome_draft.outcome_label,
      label,
      `reuse outcome must parse ${label}`,
    );
    assert.equal(intake.reuse_outcome_draft.draft_only, true);
    assert.equal(intake.reuse_outcome_draft.source_of_truth, false);
    assert.equal(intake.reuse_outcome_draft.writes_ledger, false);
    assert.equal(intake.reuse_outcome_draft.updates_salience, false);
    assert.equal(intake.reuse_outcome_draft.activates_perspective, false);
    assert.ok(
      intake.reuse_outcome_draft.selected_candidate_context_refs.length > 0,
      "reuse outcome must carry selected candidate context refs",
    );
  }
}

function assertMissingReuseOutcome(intake) {
  assert.equal(intake.reuse_outcome_draft.outcome_label, "not_reported");
  assert.ok(
    intake.reuse_outcome_draft.warning_reasons.includes("missing_reuse_outcome"),
    "missing reuse outcome must produce a warning",
  );
  assert.ok(
    intake.missing_required_return_fields.includes(
      "whether selected candidate context was helpful/stale/missing/noisy/misleading",
    ),
    "missing reuse outcome must leave required return field incomplete",
  );
  assert.notEqual(
    intake.recommendation_status,
    "ready_for_operator_review",
    "missing reuse outcome must not be treated as success",
  );
}

function assertExistingManualNoteSmokesPass() {
  execFileSync("node", [seedSmokePath], { encoding: "utf8", stdio: "pipe" });
  execFileSync("node", [previewUiSmokePath], {
    encoding: "utf8",
    stdio: "pipe",
  });
}

function assertPackageScript() {
  assert.equal(
    packageJson.scripts?.[
      "smoke:research-candidate-manual-note-handoff-result-intake-v0-1"
    ],
    `node ${smokePath}`,
    "package.json must include the result intake smoke script",
  );
}
