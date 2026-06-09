import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

const packageFile = "package.json";
const promptContractFile =
  "lib/perspective-ingest/perspective-codex-former-prompt-contract.ts";
const canonicalDogfoodScriptFile =
  "scripts/dogfood-perspective-codex-former-prompt-contract-canonical-schema.mjs";
const smokeFile =
  "scripts/smoke-perspective-codex-former-prompt-contract-canonical-schema.mjs";
const docFile =
  "docs/PERSPECTIVE_CODEX_FORMER_PROMPT_CONTRACT_CANONICAL_SCHEMA_V0_1.md";
const reportFile =
  "reports/2026-06-09-perspective-codex-former-prompt-contract-canonical-schema.md";
const promptContractSmokeFile =
  "scripts/smoke-perspective-codex-former-prompt-contract.mjs";
const manualCopyPacketSmokeFile =
  "scripts/smoke-perspective-codex-former-manual-copy-packet.mjs";
const draftSchemaAlignmentDogfoodScriptFile =
  "scripts/dogfood-perspective-codex-former-draft-schema-alignment.mjs";
const draftSchemaAlignmentSmokeFile =
  "scripts/smoke-perspective-codex-former-draft-schema-alignment.mjs";
const draftSchemaAlignmentDocFile =
  "docs/PERSPECTIVE_CODEX_FORMER_DRAFT_SCHEMA_ALIGNMENT_V0_1.md";
const draftSchemaAlignmentReportFile =
  "reports/2026-06-09-perspective-codex-former-draft-schema-alignment.md";
const realTranscriptDogfoodSmokeFile =
  "scripts/smoke-perspective-codex-former-manual-copy-real-transcript.mjs";
const captureInstructionsSmokeFile =
  "scripts/smoke-perspective-codex-former-real-transcript-capture-instructions.mjs";
const transcriptDogfoodSmokeFile =
  "scripts/smoke-perspective-codex-former-manual-copy-transcript.mjs";
const pipelineSmokeFile =
  "scripts/smoke-perspective-codex-former-pipeline.mjs";
const workerGuidanceSmokeFile =
  "scripts/smoke-perspective-worker-facing-guidance.mjs";
const candidateBuilderSmokeFile =
  "scripts/smoke-perspective-candidate-builder-fixture.mjs";
const pipelineDogfoodSmokeFile =
  "scripts/smoke-perspective-codex-former-pipeline-dogfood.mjs";

const expectedTsxCommand =
  "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json";
const allowedChangedFiles = new Set([
  packageFile,
  promptContractFile,
  canonicalDogfoodScriptFile,
  smokeFile,
  docFile,
  reportFile,
  promptContractSmokeFile,
  manualCopyPacketSmokeFile,
  draftSchemaAlignmentDogfoodScriptFile,
  draftSchemaAlignmentSmokeFile,
  draftSchemaAlignmentDocFile,
  draftSchemaAlignmentReportFile,
  realTranscriptDogfoodSmokeFile,
  captureInstructionsSmokeFile,
  transcriptDogfoodSmokeFile,
  pipelineSmokeFile,
  workerGuidanceSmokeFile,
  candidateBuilderSmokeFile,
  pipelineDogfoodSmokeFile,
]);

const canonicalPromptSnippets = [
  "Canonical schema only:",
  "selected_material must be exactly { changed_files: string[], changed_files_summary: string|null, work_id: string|null, source_pr_refs: string[] }",
  "Do not emit selected_material aliases changed_file_paths, plain_summary_facts, or neutral_perspective_basis",
  "Fold plain summary facts into selected_material.changed_files_summary",
  "Put neutral perspective basis in thesis or qualification_notes",
  'evidence_pointer_refs entries must be exactly { pointer_kind, pointer_semantics: "pointer_only", ref }',
  "Do not emit evidence pointer aliases ref_type or pointer_only",
  "Each evidence pointer ref must match one former input packet pointer ref",
  "authority_flags must use only committed_state, persistence, provider_model_api_calls, proof_evidence_readiness_writes, codex_execution, github_mutation, merge_publish_approval, and core_decision, with every value false",
  "Do not emit model-friendly authority aliases creates_augnes_state, creates_proof, creates_evidence, creates_readiness_record, approves, merges, publishes, retries, replays, deploys, mutates_github, executes_codex, calls_codex_sdk, calls_provider_model_api, or makes_core_decision",
  "privacy_flags must use only raw_payloads_included: false, unsafe_input_material_omitted: boolean, and omitted_unsafe_fields: string[]",
  "Do not emit privacy inclusion aliases raw_diffs_included, raw_review_material_included, raw_source_material_included, private_material_included, provider_material_included, token_material_included, billing_material_included, api_credentials_included, or hidden[_]reasoning_included",
  "user_core_decision_questions must be string[]",
  "next_action_candidates entries must be exactly { action_id, summary } using local action ids review_candidate, fix_input_gaps, or prepare_codex_handoff",
  "Do not emit next-action aliases id or why_next",
  "unresolved_tensions entries must be exactly { tension_kind, summary, source_ref? }",
  "Do not emit unresolved tension aliases id or why_it_matters",
];

const packageJson = JSON.parse(readFileSync(packageFile, "utf8"));
const promptContractText = readFileSync(promptContractFile, "utf8");
const dogfoodText = readFileSync(canonicalDogfoodScriptFile, "utf8");
const smokeText = readFileSync(smokeFile, "utf8");
const docText = readFileSync(docFile, "utf8");

const {
  CANONICAL_SCHEMA_ARTIFACT_PATH,
  CANONICAL_SCHEMA_DOC_PATH,
  CANONICAL_SCHEMA_RECOMMENDED_NEXT_PR,
  buildPerspectiveCodexFormerPromptContractCanonicalSchemaDogfood,
  deriveCanonicalSchemaConclusion,
  runPerspectiveCodexFormerPromptContractCanonicalSchemaDogfood,
} = await import(
  "./dogfood-perspective-codex-former-prompt-contract-canonical-schema.mjs"
);

assert.equal(existsSync(promptContractFile), true, `${promptContractFile} must exist`);
assert.equal(existsSync(canonicalDogfoodScriptFile), true, `${canonicalDogfoodScriptFile} must exist`);
assert.equal(existsSync(smokeFile), true, `${smokeFile} must exist`);
assert.equal(existsSync(docFile), true, `${docFile} must exist`);
assert.equal(existsSync(reportFile), true, `${reportFile} must exist`);

assert.equal(
  packageJson.scripts[
    "dogfood:perspective-codex-former-prompt-contract-canonical-schema"
  ],
  `${expectedTsxCommand} ${canonicalDogfoodScriptFile}`,
  "package.json must register canonical schema dogfood",
);
assert.equal(
  packageJson.scripts[
    "smoke:perspective-codex-former-prompt-contract-canonical-schema"
  ],
  `${expectedTsxCommand} ${smokeFile}`,
  "package.json must register canonical schema smoke",
);

assertPromptContractCanonicalSource();
assertDogfoodBuildAndReport();
assertPromptContractCanonicalSchemaText();
assertManualCopyPacketPromptUsesCanonicalContract();
assertCanonicalDraftFixturePassesWithoutAlignment();
assertOldAliasDraftStillAligns();
assertAliasFreePromptDogfoodReport();
assertUnsafeAuthorityRegression();
assertConclusionRules();
assertDocsAndReport();
assertNoForbiddenSurfaces();
assertChangedFileBoundary();

console.log("PASS smoke:perspective-codex-former-prompt-contract-canonical-schema");

function assertPromptContractCanonicalSource() {
  assertContainsAll(
    promptContractText,
    canonicalPromptSnippets.map((snippet) =>
      snippet.replace('"pointer_only"', '\\"pointer_only\\"'),
    ),
  );
  assert.equal(
    promptContractText.includes("hidden_reasoning_included"),
    false,
    "prompt contract source must keep unsafe marker alias in split display form",
  );
  assertContainsAll(promptContractText, [
    "Use privacy_flags only as { raw_payloads_included: false, unsafe_input_material_omitted: boolean, omitted_unsafe_fields: string[] }.",
    "Required fields:",
    "draft_version",
    "draft_kind",
    "source_former_input_packet",
    "selected_material",
    "evidence_pointer_refs",
    "unresolved_tensions",
    "basis_quality_suggestion",
    "next_action_candidates",
    "user_core_decision_questions",
    "qualification_notes",
    "privacy_flags",
    "authority_flags",
  ]);
}

function assertDogfoodBuildAndReport() {
  const first =
    buildPerspectiveCodexFormerPromptContractCanonicalSchemaDogfood();
  const second =
    buildPerspectiveCodexFormerPromptContractCanonicalSchemaDogfood();

  assert.equal(first.artifact, second.artifact);
  assert.equal(first.paths.artifact, CANONICAL_SCHEMA_ARTIFACT_PATH);
  assert.equal(first.paths.doc, CANONICAL_SCHEMA_DOC_PATH);
  assert.equal(first.evaluation.conclusion, "PASS with follow-up");
  assert.equal(first.scenarios.length, 6);
  assert.equal(first.artifact.includes("Conclusion: PASS with follow-up"), true);
  assert.equal(first.artifact.includes(CANONICAL_SCHEMA_RECOMMENDED_NEXT_PR), true);

  const written = runPerspectiveCodexFormerPromptContractCanonicalSchemaDogfood();
  assert.equal(written.artifact, first.artifact);
  assert.equal(readFileSync(reportFile, "utf8"), first.artifact);
}

function assertPromptContractCanonicalSchemaText() {
  const scenario = requireScenario(
    buildPerspectiveCodexFormerPromptContractCanonicalSchemaDogfood(),
    "prompt_contract_canonical_schema_text",
  );

  assert.equal(scenario.conclusion, "PASS");
  assert.equal(scenario.missing_snippets.length, 0);
  assert.equal(scenario.canonical_snippet_count, 16);
  assertContainsAll(scenario.prompt_contract_required_fields, [
    "draft_version",
    "draft_kind",
    "source_former_input_packet",
    "thesis",
    "selected_material",
    "evidence_pointer_refs",
    "unresolved_tensions",
    "basis_quality_suggestion",
    "next_action_candidates",
    "user_core_decision_questions",
    "qualification_notes",
    "privacy_flags",
    "authority_flags",
    "forbidden_actions",
  ]);
}

function assertManualCopyPacketPromptUsesCanonicalContract() {
  const scenario = requireScenario(
    buildPerspectiveCodexFormerPromptContractCanonicalSchemaDogfood(),
    "manual_copy_packet_prompt_uses_canonical_contract",
  );

  assert.equal(scenario.conclusion, "PASS");
  assert.equal(scenario.copy_status, "needs_review");
  assert.equal(scenario.evaluation_status, "passes");
  assert.equal(scenario.missing_snippets.length, 0);
  assert.equal(scenario.browser_or_computer_use_validation.required, false);
  assert.equal(scenario.browser_or_computer_use_validation.status, "not_required");
  assertAuthorityFalse(scenario.authority_flags);
}

function assertCanonicalDraftFixturePassesWithoutAlignment() {
  const scenario = requireScenario(
    buildPerspectiveCodexFormerPromptContractCanonicalSchemaDogfood(),
    "canonical_draft_fixture_passes_without_alignment",
  );

  assert.equal(scenario.conclusion, "PASS");
  assert.equal(scenario.alignment_required, false);
  assert.equal(scenario.contract_fit.status, "fits_contract");
  assert.equal(scenario.validation_result.status, "needs_review");
  assert.equal(scenario.candidate_review_material.authority, "non_committed");
  assert.equal(
    scenario.candidate_review_material.basis_quality.status,
    "needs_review",
  );
  assertAuthorityFalse(scenario.validation_result.authority_flags);
}

function assertOldAliasDraftStillAligns() {
  const scenario = requireScenario(
    buildPerspectiveCodexFormerPromptContractCanonicalSchemaDogfood(),
    "old_alias_draft_still_aligns",
  );

  assert.equal(scenario.conclusion, "PASS with follow-up");
  assert.equal(scenario.original_contract_fit.status, "violates_contract");
  assert.equal(scenario.alignment.alignment_status, "aligned");
  assertContainsAll(scenario.alignment.applied_mappings, [
    "selected_material_changed_file_paths",
    "pointer_ref_type_pointer_only",
    "authority_model_friendly_false_flags",
    "privacy_false_alias_flags",
  ]);
  assert.equal(scenario.aligned_contract_fit.status, "fits_contract");
  assert.equal(scenario.validation_result.status, "needs_review");
  assert.equal(scenario.candidate_review_material.authority, "non_committed");
}

function assertAliasFreePromptDogfoodReport() {
  const scenario = requireScenario(
    buildPerspectiveCodexFormerPromptContractCanonicalSchemaDogfood(),
    "alias_free_prompt_dogfood_report",
  );

  assert.equal(scenario.conclusion, "PASS with follow-up");
  assert.equal(scenario.new_real_transcript_captured, false);
  assert.equal(scenario.browser_or_computer_use_validation.required, false);
  assert.equal(scenario.browser_or_computer_use_validation.status, "not_required");
}

function assertUnsafeAuthorityRegression() {
  const scenario = requireScenario(
    buildPerspectiveCodexFormerPromptContractCanonicalSchemaDogfood(),
    "unsafe_authority_regression",
  );

  assert.equal(scenario.conclusion, "PASS");
  assert.equal(scenario.true_authority_contract_fit.status, "violates_contract");
  assert.equal(scenario.true_authority_validation.status, "blocked");
  assert.equal(scenario.unsafe_contract_fit.status, "violates_contract");
  assert.equal(scenario.unsafe_validation.status, "blocked");
  assert.equal(scenario.split_marker_validation.status, "blocked");
  assert.equal(scenario.non_pointer_alignment.alignment_status, "blocked");
  assert.equal(scenario.privacy_inclusion_validation.status, "blocked");
  assert.equal(scenario.privacy_alias_alignment.alignment_status, "blocked");
  assertNoUnsafeMarkerText("unsafe authority scenario", scenario);
}

function assertConclusionRules() {
  assert.equal(
    deriveCanonicalSchemaConclusion([
      {
        scenario_id: "prompt_contract_canonical_schema_text",
        conclusion: "PASS",
      },
      {
        scenario_id: "manual_copy_packet_prompt_uses_canonical_contract",
        conclusion: "PASS",
      },
      {
        scenario_id: "canonical_draft_fixture_passes_without_alignment",
        conclusion: "PASS",
      },
      { scenario_id: "old_alias_draft_still_aligns", conclusion: "PASS" },
      { scenario_id: "unsafe_authority_regression", conclusion: "PASS" },
    ]),
    "PASS with follow-up",
  );
  assert.equal(
    deriveCanonicalSchemaConclusion([
      {
        scenario_id: "prompt_contract_canonical_schema_text",
        conclusion: "BLOCKED",
      },
      {
        scenario_id: "manual_copy_packet_prompt_uses_canonical_contract",
        conclusion: "PASS",
      },
      {
        scenario_id: "canonical_draft_fixture_passes_without_alignment",
        conclusion: "PASS",
      },
      { scenario_id: "old_alias_draft_still_aligns", conclusion: "PASS" },
      { scenario_id: "unsafe_authority_regression", conclusion: "PASS" },
    ]),
    "BLOCKED",
  );
}

function assertDocsAndReport() {
  const reportText = readFileSync(reportFile, "utf8");

  assertContainsAll(docText, [
    "Perspective Codex Former Prompt Contract Canonical Schema v0.1",
    "PR #483",
    "PR #484",
    "CodexPerspectiveCandidateDraft",
    "selected_material",
    "evidence_pointer_refs",
    "authority_flags",
    "privacy_flags",
    "hidden[_]reasoning inclusion alias",
    "PASS with follow-up",
    CANONICAL_SCHEMA_RECOMMENDED_NEXT_PR,
  ]);
  assertContainsAll(reportText, [
    "Perspective Codex Former Prompt Contract Canonical Schema",
    "Conclusion: PASS with follow-up",
    "What PR #483 Found",
    "What PR #484 Aligned",
    "Prompt Canonical Schema Changes",
    "Aliases Future Responses Should Stop Emitting",
    "What Alignment Still Supports",
    "Canonical contract fit: fits_contract",
    "Canonical validation status: needs_review",
    "Old alias original contract fit: violates_contract",
    "Old alias alignment status: aligned",
    "New Real Transcript Captured",
    "No.",
    "Browser/Computer-Use Validation",
    CANONICAL_SCHEMA_RECOMMENDED_NEXT_PR,
  ]);
  assertNoUnsafeMarkerText("canonical schema doc", docText);
  assertNoUnsafeMarkerText("canonical schema report", reportText);
}

function assertNoForbiddenSurfaces() {
  const reportText = readFileSync(reportFile, "utf8");

  for (const [label, text] of [
    ["prompt contract", promptContractText],
    ["dogfood", dogfoodText],
    ["smoke", smokeText],
    ["doc", docText],
    ["report", reportText],
  ]) {
    for (const forbidden of [
      ["process", "env"].join("."),
      ["fetch", "("].join(""),
      ["api.github", ".com"].join(""),
      ["api.openai", ".com"].join(""),
      ["OPENAI", "_API_KEY"].join(""),
      ["GITHUB", "_TOKEN"].join(""),
      ["navigator", ".clipboard"].join(""),
      ["app", "/api/"].join(""),
      ["pris", "ma"].join(""),
      ["migr", "ations"].join(""),
    ]) {
      assert.equal(
        text.includes(forbidden),
        false,
        `${label} must not introduce forbidden surface ${forbidden}`,
      );
    }
  }
}

function assertChangedFileBoundary() {
  for (const changedFile of collectChangedFiles()) {
    assert(
      allowedChangedFiles.has(changedFile),
      `Canonical schema prompt contract changed an out-of-scope file: ${changedFile}`,
    );
    assert(
      !changedFile.startsWith(["app", "/api/"].join("")) &&
        !changedFile.startsWith("components/") &&
        changedFile !== "app/globals.css" &&
        (!changedFile.startsWith("lib/") ||
          changedFile === promptContractFile) &&
        !changedFile.startsWith("db/") &&
        !changedFile.startsWith(["migr", "ations/"].join("")) &&
        !changedFile.startsWith("fixtures/") &&
        !changedFile.startsWith("types/") &&
        !changedFile.includes("codex-sdk") &&
        !changedFile.includes("graph-db") &&
        !changedFile.includes("persistence"),
      `Canonical schema prompt contract must not change forbidden surfaces: ${changedFile}`,
    );
  }
}

function requireScenario(dogfood, scenarioId) {
  const scenario = dogfood.scenarios.find(
    (candidate) => candidate.scenario_id === scenarioId,
  );
  assert(scenario, `missing scenario ${scenarioId}`);
  return scenario;
}

function assertContainsAll(value, expectedSnippets) {
  for (const snippet of expectedSnippets) {
    assert(
      value.includes(snippet),
      `Expected text to include ${JSON.stringify(snippet)}`,
    );
  }
}

function assertAuthorityFalse(flags) {
  assert(flags, "authority flags must exist");
  assert(
    Object.values(flags).every((value) => value === false),
    "authority flags must remain false",
  );
}

function assertNoUnsafeMarkerText(label, value) {
  const serialized = typeof value === "string" ? value : JSON.stringify(value);
  for (const forbiddenMarker of [
    ["billing", "_payload"].join(""),
    ["token", "_payload"].join(""),
    ["oauth", "_payload"].join(""),
    ["raw_pasted", "_text"].join(""),
    ["raw_source", "_payload"].join(""),
    ["raw_candidate", "_payload"].join(""),
    ["raw_private", "_payload"].join(""),
    ["private", "_payload"].join(""),
    ["provider", "_payload"].join(""),
    ["oauth", "_token"].join(""),
    ["access", "_token"].join(""),
    ["refresh", "_token"].join(""),
    ["api", "_key"].join(""),
    ["hidden", "_reasoning"].join(""),
    ["generated_model", "_payload"].join(""),
    ["sk-proj", "-"].join(""),
    ["ghp", "_"].join(""),
    ["gho", "_"].join(""),
    ["ghu", "_"].join(""),
    ["ghs", "_"].join(""),
    ["ghr", "_"].join(""),
  ]) {
    assert.equal(
      serialized.includes(forbiddenMarker),
      false,
      `${label} must not include unsafe marker: ${forbiddenMarker}`,
    );
  }
  assert.equal(
    new RegExp(`\\b${["secr", "et"].join("")}\\b`, "i").test(serialized),
    false,
    `${label} must not include unsafe marker: ${["secr", "et"].join("")}`,
  );
}

function collectChangedFiles() {
  const workingTreeFiles = gitLinesOrEmpty(["diff", "--name-only", "HEAD"]);
  const branchFiles = collectBranchChangedFiles();
  const untrackedFiles = gitLinesOrEmpty([
    "ls-files",
    "--others",
    "--exclude-standard",
  ]);
  const changedFiles = Array.from(
    new Set([...workingTreeFiles, ...branchFiles, ...untrackedFiles]),
  ).filter(Boolean);

  if (changedFiles.length === 0 && isCommittedBranch()) {
    throw new Error("Canonical schema prompt contract smoke collected no changed files");
  }

  return changedFiles;
}

function collectBranchChangedFiles() {
  const originMainFiles = gitLinesStrict([
    "diff",
    "--name-only",
    "origin/main...HEAD",
  ]);
  if (originMainFiles) {
    return originMainFiles;
  }

  return gitLinesOrEmpty(["diff", "--name-only", "HEAD"]);
}

function isCommittedBranch() {
  try {
    execFileSync("git", ["rev-parse", "--verify", "HEAD^"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    });
    return true;
  } catch {
    return false;
  }
}

function gitLinesStrict(args) {
  return parseGitLines(
    execFileSync("git", args, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    }),
  );
}

function gitLinesOrEmpty(args) {
  try {
    return gitLinesStrict(args);
  } catch {
    return [];
  }
}

function parseGitLines(output) {
  return output
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}
