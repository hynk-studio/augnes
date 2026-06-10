import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

const packageFile = "package.json";
const manualCopyPacketFile =
  "lib/perspective-ingest/perspective-codex-former-manual-copy-packet.ts";
const alignmentHelperFile =
  "lib/perspective-ingest/perspective-codex-candidate-draft-schema-alignment.ts";
const dogfoodScriptFile =
  "scripts/dogfood-perspective-codex-former-draft-schema-alignment.mjs";
const smokeFile =
  "scripts/smoke-perspective-codex-former-draft-schema-alignment.mjs";
const docFile =
  "docs/PERSPECTIVE_CODEX_FORMER_DRAFT_SCHEMA_ALIGNMENT_V0_1.md";
const reportFile =
  "reports/2026-06-09-perspective-codex-former-draft-schema-alignment.md";
const promptContractFile =
  "lib/perspective-ingest/perspective-codex-former-prompt-contract.ts";
const realTranscriptDogfoodScriptFile =
  "scripts/dogfood-perspective-codex-former-manual-copy-real-transcript.mjs";
const realTranscriptDogfoodSmokeFile =
  "scripts/smoke-perspective-codex-former-manual-copy-real-transcript.mjs";
const realTranscriptDogfoodDocFile =
  "docs/PERSPECTIVE_CODEX_FORMER_MANUAL_COPY_REAL_TRANSCRIPT_DOGFOOD_V0_1.md";
const realTranscriptDogfoodReportFile =
  "reports/dogfood/2026-06-09-perspective-codex-former-manual-copy-real-transcript.md";
const captureInstructionsDocFile =
  "docs/PERSPECTIVE_CODEX_FORMER_REAL_TRANSCRIPT_CAPTURE_INSTRUCTIONS_V0_1.md";
const captureInstructionsReportFile =
  "reports/2026-06-09-perspective-codex-former-real-transcript-capture-instructions.md";
const captureInstructionsSmokeFile =
  "scripts/smoke-perspective-codex-former-real-transcript-capture-instructions.mjs";
const transcriptDogfoodScriptFile =
  "scripts/dogfood-perspective-codex-former-manual-copy-transcript.mjs";
const transcriptDogfoodSmokeFile =
  "scripts/smoke-perspective-codex-former-manual-copy-transcript.mjs";
const manualCopyPacketSmokeFile =
  "scripts/smoke-perspective-codex-former-manual-copy-packet.mjs";
const promptContractSmokeFile =
  "scripts/smoke-perspective-codex-former-prompt-contract.mjs";
const pipelineSmokeFile =
  "scripts/smoke-perspective-codex-former-pipeline.mjs";
const pipelineDogfoodSmokeFile =
  "scripts/smoke-perspective-codex-former-pipeline-dogfood.mjs";
const workerGuidanceSmokeFile =
  "scripts/smoke-perspective-worker-facing-guidance.mjs";
const candidateBuilderSmokeFile =
  "scripts/smoke-perspective-candidate-builder-fixture.mjs";
const canonicalPromptContractDogfoodScriptFile =
  "scripts/dogfood-perspective-codex-former-prompt-contract-canonical-schema.mjs";
const canonicalPromptContractSmokeFile =
  "scripts/smoke-perspective-codex-former-prompt-contract-canonical-schema.mjs";
const canonicalPromptContractDocFile =
  "docs/PERSPECTIVE_CODEX_FORMER_PROMPT_CONTRACT_CANONICAL_SCHEMA_V0_1.md";
const canonicalPromptContractReportFile =
  "reports/2026-06-09-perspective-codex-former-prompt-contract-canonical-schema.md";
const refinedPromptRealTranscriptDogfoodScriptFile =
  "scripts/dogfood-perspective-codex-former-refined-prompt-real-transcript.mjs";
const refinedPromptRealTranscriptSmokeFile =
  "scripts/smoke-perspective-codex-former-refined-prompt-real-transcript.mjs";
const refinedPromptRealTranscriptDocFile =
  "docs/PERSPECTIVE_CODEX_FORMER_REFINED_PROMPT_REAL_TRANSCRIPT_DOGFOOD_V0_1.md";
const refinedPromptRealTranscriptReportFile =
  "reports/dogfood/2026-06-09-perspective-codex-former-refined-prompt-real-transcript.md";
const secondRefinedTranscriptDogfoodScriptFile =
  "scripts/dogfood-perspective-codex-former-second-refined-transcript.mjs";
const secondRefinedTranscriptSmokeFile =
  "scripts/smoke-perspective-codex-former-second-refined-transcript.mjs";
const secondRefinedTranscriptDocFile =
  "docs/PERSPECTIVE_CODEX_FORMER_SECOND_REFINED_TRANSCRIPT_DOGFOOD_V0_1.md";
const secondRefinedTranscriptReportFile =
  "reports/dogfood/2026-06-09-perspective-codex-former-second-refined-transcript.md";
const provenanceStaleWordingDogfoodScriptFile =
  "scripts/dogfood-perspective-codex-former-provenance-stale-wording.mjs";
const provenanceStaleWordingSmokeFile =
  "scripts/smoke-perspective-codex-former-provenance-stale-wording.mjs";
const provenanceStaleWordingDocFile =
  "docs/PERSPECTIVE_CODEX_FORMER_PROVENANCE_STALE_WORDING_V0_1.md";
const provenanceStaleWordingReportFile =
  "reports/2026-06-09-perspective-codex-former-provenance-stale-wording.md";
const refinedFindingsContractDogfoodScriptFile =
  "scripts/dogfood-perspective-codex-former-refined-findings-contract.mjs";
const refinedFindingsContractSmokeFile =
  "scripts/smoke-perspective-codex-former-refined-findings-contract.mjs";
const refinedFindingsContractDocFile =
  "docs/PERSPECTIVE_CODEX_FORMER_REFINED_FINDINGS_CONTRACT_V0_1.md";
const refinedFindingsContractReportFile =
  "reports/2026-06-09-perspective-codex-former-refined-findings-contract.md";

const expectedTsxCommand =
  "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json";
const allowedChangedFiles = new Set([
  packageFile,
  manualCopyPacketFile,
  alignmentHelperFile,
  dogfoodScriptFile,
  smokeFile,
  docFile,
  reportFile,
  promptContractFile,
  realTranscriptDogfoodScriptFile,
  realTranscriptDogfoodSmokeFile,
  realTranscriptDogfoodDocFile,
  realTranscriptDogfoodReportFile,
  captureInstructionsDocFile,
  captureInstructionsReportFile,
  captureInstructionsSmokeFile,
  transcriptDogfoodScriptFile,
  transcriptDogfoodSmokeFile,
  manualCopyPacketSmokeFile,
  promptContractSmokeFile,
  pipelineSmokeFile,
  pipelineDogfoodSmokeFile,
  workerGuidanceSmokeFile,
  candidateBuilderSmokeFile,
  canonicalPromptContractDogfoodScriptFile,
  canonicalPromptContractSmokeFile,
  canonicalPromptContractDocFile,
  canonicalPromptContractReportFile,
  refinedPromptRealTranscriptDogfoodScriptFile,
  refinedPromptRealTranscriptSmokeFile,
  refinedPromptRealTranscriptDocFile,
  refinedPromptRealTranscriptReportFile,
  secondRefinedTranscriptDogfoodScriptFile,
  secondRefinedTranscriptSmokeFile,
  secondRefinedTranscriptDocFile,
  secondRefinedTranscriptReportFile,
  provenanceStaleWordingDogfoodScriptFile,
  provenanceStaleWordingSmokeFile,
  provenanceStaleWordingDocFile,
  provenanceStaleWordingReportFile,
  refinedFindingsContractDogfoodScriptFile,
  refinedFindingsContractSmokeFile,
  refinedFindingsContractDocFile,
  refinedFindingsContractReportFile,
]);

const packageJson = JSON.parse(readFileSync(packageFile, "utf8"));

const {
  DRAFT_SCHEMA_ALIGNMENT_ARTIFACT_PATH,
  DRAFT_SCHEMA_ALIGNMENT_DOC_PATH,
  DRAFT_SCHEMA_ALIGNMENT_FOLLOW_UP_PROMPT_CONTRACT_DOC,
  DRAFT_SCHEMA_ALIGNMENT_FOLLOW_UP_PROMPT_CONTRACT_REPORT,
  DRAFT_SCHEMA_ALIGNMENT_NEXT_AFTER_PROMPT_REFINEMENT,
  DRAFT_SCHEMA_ALIGNMENT_RECOMMENDED_NEXT_PR,
  buildPerspectiveCodexFormerDraftSchemaAlignmentDogfood,
  deriveDraftSchemaAlignmentConclusion,
  runPerspectiveCodexFormerDraftSchemaAlignmentDogfood,
} = await import("./dogfood-perspective-codex-former-draft-schema-alignment.mjs");

assert.equal(existsSync(alignmentHelperFile), true, `${alignmentHelperFile} must exist`);
assert.equal(existsSync(dogfoodScriptFile), true, `${dogfoodScriptFile} must exist`);
assert.equal(existsSync(smokeFile), true, `${smokeFile} must exist`);
assert.equal(existsSync(docFile), true, `${docFile} must exist`);

assert.equal(
  packageJson.scripts["dogfood:perspective-codex-former-draft-schema-alignment"],
  `${expectedTsxCommand} ${dogfoodScriptFile}`,
  "package.json must register dogfood:perspective-codex-former-draft-schema-alignment",
);
assert.equal(
  packageJson.scripts["smoke:perspective-codex-former-draft-schema-alignment"],
  `${expectedTsxCommand} ${smokeFile}`,
  "package.json must register smoke:perspective-codex-former-draft-schema-alignment",
);

assertDogfoodBuild();
assertCapturedRealTranscriptAlignment();
assertPointerAliasFixture();
assertAuthorityAliasFixture();
assertSelectedMaterialAliasFixture();
assertUnsafeRegressionFixture();
assertDownstreamGuidanceAfterAlignment();
assertConclusionRules();
assertDocsAndReport();
assertNoForbiddenSurfaces();
assertChangedFileBoundary();

console.log("PASS smoke:perspective-codex-former-draft-schema-alignment");

function assertDogfoodBuild() {
  const first = buildPerspectiveCodexFormerDraftSchemaAlignmentDogfood();
  const second = buildPerspectiveCodexFormerDraftSchemaAlignmentDogfood();

  assert.equal(first.artifact, second.artifact);
  assert.equal(first.paths.artifact, DRAFT_SCHEMA_ALIGNMENT_ARTIFACT_PATH);
  assert.equal(first.paths.doc, DRAFT_SCHEMA_ALIGNMENT_DOC_PATH);
  assert.equal(first.evaluation.conclusion, "PASS with follow-up");
  assert.equal(first.scenarios.length, 6);
  assert.equal(first.artifact.includes("Conclusion: PASS with follow-up"), true);
  assert.equal(
    first.artifact.includes(DRAFT_SCHEMA_ALIGNMENT_RECOMMENDED_NEXT_PR),
    true,
  );

  const written = runPerspectiveCodexFormerDraftSchemaAlignmentDogfood();
  assert.equal(written.artifact, first.artifact);
  assert.equal(readFileSync(reportFile, "utf8"), first.artifact);
}

function assertCapturedRealTranscriptAlignment() {
  const scenario = requireScenario(
    buildPerspectiveCodexFormerDraftSchemaAlignmentDogfood(),
    "captured_real_transcript_schema_alignment",
  );

  assert.equal(scenario.conclusion, "PASS with follow-up");
  assert.equal(scenario.extraction.extraction_status, "extracted");
  assert.equal(scenario.extraction.extracted_candidate_count, 1);
  assert.equal(scenario.original_contract_fit.status, "violates_contract");
  assert.equal(scenario.alignment.alignment_status, "aligned");
  assertContainsMappings(scenario.alignment.applied_mappings, [
    "selected_material_changed_file_paths",
    "pointer_ref_type_pointer_only",
    "authority_model_friendly_false_flags",
    "privacy_false_alias_flags",
  ]);
  assert.equal(scenario.aligned_contract_fit.status, "fits_contract");
  assert.equal(scenario.validation_result.status, "needs_review");
  assert.equal(scenario.candidate_review_material.authority, "non_committed");
  assert.equal(scenario.candidate_review_material.basis_quality.status, "needs_review");
  assertAuthorityFalse(scenario.validation_result.authority_flags);
}

function assertPointerAliasFixture() {
  const scenario = requireScenario(
    buildPerspectiveCodexFormerDraftSchemaAlignmentDogfood(),
    "pointer_alias_alignment_fixture",
  );

  assert.equal(scenario.conclusion, "PASS");
  assert.equal(scenario.alignment.alignment_status, "aligned");
  assertContainsMappings(scenario.alignment.applied_mappings, [
    "pointer_ref_type_pointer_only",
  ]);
  assert.equal(scenario.negative_alignment.alignment_status, "blocked");
  assert(
    scenario.alignment.aligned_draft.evidence_pointer_refs.every(
      (pointer) => pointer.pointer_semantics === "pointer_only",
    ),
    "aligned pointers must remain pointer-only",
  );
}

function assertAuthorityAliasFixture() {
  const scenario = requireScenario(
    buildPerspectiveCodexFormerDraftSchemaAlignmentDogfood(),
    "authority_alias_alignment_fixture",
  );

  assert.equal(scenario.conclusion, "PASS");
  assert.equal(scenario.alignment.alignment_status, "aligned");
  assertContainsMappings(scenario.alignment.applied_mappings, [
    "authority_model_friendly_false_flags",
  ]);
  assertAuthorityFalse(scenario.alignment.authority_flags);
  assert.equal(scenario.negative_alignment.alignment_status, "blocked");
  assert.equal(scenario.canonical_negative_alignment.alignment_status, "blocked");
}

function assertSelectedMaterialAliasFixture() {
  const scenario = requireScenario(
    buildPerspectiveCodexFormerDraftSchemaAlignmentDogfood(),
    "selected_material_alias_alignment_fixture",
  );

  assert.equal(scenario.conclusion, "PASS");
  assert.equal(scenario.alignment.alignment_status, "aligned");
  assertContainsMappings(scenario.alignment.applied_mappings, [
    "selected_material_changed_file_paths",
    "selected_material_plain_summary_facts",
    "selected_material_neutral_perspective_basis_to_qualification_notes",
  ]);
  assert(
    scenario.alignment.aligned_draft.selected_material.changed_files.includes(
      "docs/example.md",
    ),
    "changed_file_paths must map to changed_files",
  );
  assert.equal(scenario.negative_alignment.alignment_status, "blocked");
}

function assertUnsafeRegressionFixture() {
  const scenario = requireScenario(
    buildPerspectiveCodexFormerDraftSchemaAlignmentDogfood(),
    "unsafe_or_private_material_regression",
  );

  assert.equal(scenario.conclusion, "PASS");
  assert.equal(scenario.alignment.alignment_status, "blocked");
  assert.equal(scenario.privacy_negative_alignment.alignment_status, "blocked");
  assertNoUnsafeMarkerText("unsafe regression scenario", scenario);
}

function assertDownstreamGuidanceAfterAlignment() {
  const scenario = requireScenario(
    buildPerspectiveCodexFormerDraftSchemaAlignmentDogfood(),
    "downstream_guidance_after_alignment",
  );

  assert.equal(scenario.conclusion, "PASS");
  assert.equal(scenario.validation_result.status, "needs_review");
  assert.equal(scenario.candidate_review_material.authority, "non_committed");
  assert.equal(scenario.worker_guidance.advisory_only, true);
  assert(
    ["resolve_gaps_first", "actionable_advisory"].includes(
      scenario.worker_guidance.guidance_status,
    ),
    "guidance status must be an advisory planning status",
  );
  assert(
    scenario.worker_guidance.next_action_count > 0,
    "guidance must include next actions",
  );
  assertAuthorityFalse(scenario.worker_guidance.authority_flags);
}

function assertConclusionRules() {
  assert.equal(
    deriveDraftSchemaAlignmentConclusion([
      {
        scenario_id: "captured_real_transcript_schema_alignment",
        extraction: { extraction_status: "blocked" },
      },
    ]),
    "BLOCKED",
  );
  assert.equal(
    deriveDraftSchemaAlignmentConclusion([
      {
        scenario_id: "captured_real_transcript_schema_alignment",
        extraction: { extraction_status: "extracted" },
        alignment: { alignment_status: "aligned" },
        validation_result: { status: "needs_review" },
        candidate_review_material: {
          basis_quality: { status: "needs_review" },
        },
      },
      { scenario_id: "downstream_guidance_after_alignment", conclusion: "PASS" },
    ]),
    "PASS with follow-up",
  );
}

function assertDocsAndReport() {
  const docText = readFileSync(docFile, "utf8");
  const reportText = readFileSync(reportFile, "utf8");

  assertContainsAll(docText, [
    "Perspective Codex Former Draft Schema Alignment v0.1",
    "PR #483",
    "alignCodexPerspectiveCandidateDraftSchemaFromModelOutput",
    "selected_material.changed_file_paths",
    "pointer_only: true",
    "model-friendly false authority flags",
    "Worker-Facing Guidance",
    "PASS with follow-up",
    DRAFT_SCHEMA_ALIGNMENT_RECOMMENDED_NEXT_PR,
    DRAFT_SCHEMA_ALIGNMENT_FOLLOW_UP_PROMPT_CONTRACT_DOC,
    DRAFT_SCHEMA_ALIGNMENT_FOLLOW_UP_PROMPT_CONTRACT_REPORT,
    DRAFT_SCHEMA_ALIGNMENT_NEXT_AFTER_PROMPT_REFINEMENT,
  ]);
  assertContainsAll(reportText, [
    "Perspective Codex Former Draft Schema Alignment",
    "Conclusion: PASS with follow-up",
    "Original contract fit: violates_contract",
    "Aligned contract fit: fits_contract",
    "Validation status: needs_review",
    "Candidate authority: non_committed",
    "Worker-Facing Guidance ran",
    DRAFT_SCHEMA_ALIGNMENT_RECOMMENDED_NEXT_PR,
    "Follow-Up Prompt Contract Refinement",
    DRAFT_SCHEMA_ALIGNMENT_FOLLOW_UP_PROMPT_CONTRACT_DOC,
    DRAFT_SCHEMA_ALIGNMENT_FOLLOW_UP_PROMPT_CONTRACT_REPORT,
    DRAFT_SCHEMA_ALIGNMENT_NEXT_AFTER_PROMPT_REFINEMENT,
  ]);
  assertNoUnsafeMarkerText("schema alignment doc", docText);
  assertNoUnsafeMarkerText("schema alignment report", reportText);
}

function assertNoForbiddenSurfaces() {
  const helperText = readFileSync(alignmentHelperFile, "utf8");
  const dogfoodText = readFileSync(dogfoodScriptFile, "utf8");
  const smokeText = readFileSync(smokeFile, "utf8");
  const docText = readFileSync(docFile, "utf8");
  const reportText = readFileSync(reportFile, "utf8");

  for (const [label, text] of [
    ["helper", helperText],
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
      `Draft schema alignment changed an out-of-scope file: ${changedFile}`,
    );
    assert(
      !changedFile.startsWith(["app", "/api/"].join("")) &&
        !changedFile.startsWith("components/") &&
        !changedFile.startsWith("db/") &&
        !changedFile.startsWith(["migr", "ations/"].join("")) &&
        !changedFile.includes("codex-sdk") &&
        !changedFile.includes("graph-db") &&
        !changedFile.includes("persistence"),
      `Draft schema alignment must not change forbidden surfaces: ${changedFile}`,
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

function assertContainsMappings(actual, expected) {
  for (const mapping of expected) {
    assert(actual.includes(mapping), `expected mapping ${mapping}`);
  }
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
    throw new Error("Draft schema alignment smoke collected no changed files");
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
