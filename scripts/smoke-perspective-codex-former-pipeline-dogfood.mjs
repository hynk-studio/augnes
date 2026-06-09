import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

const packageFile = "package.json";
const dogfoodScriptFile =
  "scripts/dogfood-perspective-codex-former-pipeline.mjs";
const smokeFile =
  "scripts/smoke-perspective-codex-former-pipeline-dogfood.mjs";
const artifactFile =
  "reports/dogfood/2026-06-09-perspective-codex-former-pipeline.md";
const dogfoodDocFile =
  "docs/PERSPECTIVE_CODEX_FORMER_PIPELINE_DOGFOOD_V0_1.md";
const formerPipelineDocFile =
  "docs/PERSPECTIVE_CODEX_FORMER_PIPELINE_V0_1.md";
const formerPipelineSmokeFile =
  "scripts/smoke-perspective-codex-former-pipeline.mjs";
const workerGuidanceSmokeFile =
  "scripts/smoke-perspective-worker-facing-guidance.mjs";
const candidateBuilderSmokeFile =
  "scripts/smoke-perspective-candidate-builder-fixture.mjs";
const promptContractFile =
  "lib/perspective-ingest/perspective-codex-former-prompt-contract.ts";
const manualCopyPacketFile =
  "lib/perspective-ingest/perspective-codex-former-manual-copy-packet.ts";
const promptContractDocFile =
  "docs/PERSPECTIVE_CODEX_FORMER_PROMPT_CONTRACT_V0_1.md";
const promptContractReportFile =
  "reports/2026-06-09-perspective-codex-former-prompt-contract.md";
const promptContractSmokeFile =
  "scripts/smoke-perspective-codex-former-prompt-contract.mjs";
const manualCopyPacketDocFile =
  "docs/PERSPECTIVE_CODEX_FORMER_MANUAL_COPY_PACKET_V0_1.md";
const manualCopyPacketReportFile =
  "reports/2026-06-09-perspective-codex-former-manual-copy-packet.md";
const manualCopyPacketSmokeFile =
  "scripts/smoke-perspective-codex-former-manual-copy-packet.mjs";
const manualCopyTranscriptDogfoodScriptFile =
  "scripts/dogfood-perspective-codex-former-manual-copy-transcript.mjs";
const manualCopyTranscriptDogfoodSmokeFile =
  "scripts/smoke-perspective-codex-former-manual-copy-transcript.mjs";
const manualCopyTranscriptDogfoodDocFile =
  "docs/PERSPECTIVE_CODEX_FORMER_MANUAL_COPY_TRANSCRIPT_DOGFOOD_V0_1.md";
const manualCopyTranscriptDogfoodReportFile =
  "reports/dogfood/2026-06-09-perspective-codex-former-manual-copy-transcript.md";

const expectedTsxCommand =
  "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json";
const allowedChangedFiles = new Set([
  packageFile,
  dogfoodScriptFile,
  smokeFile,
  artifactFile,
  dogfoodDocFile,
  formerPipelineDocFile,
  formerPipelineSmokeFile,
  workerGuidanceSmokeFile,
  candidateBuilderSmokeFile,
  promptContractFile,
  manualCopyPacketFile,
  promptContractDocFile,
  promptContractReportFile,
  promptContractSmokeFile,
  manualCopyPacketDocFile,
  manualCopyPacketReportFile,
  manualCopyPacketSmokeFile,
  manualCopyTranscriptDogfoodScriptFile,
  manualCopyTranscriptDogfoodSmokeFile,
  manualCopyTranscriptDogfoodDocFile,
  manualCopyTranscriptDogfoodReportFile,
]);

const packageJson = JSON.parse(readFileSync(packageFile, "utf8"));
const dogfoodScriptText = readFileSync(dogfoodScriptFile, "utf8");
const docText = readFileSync(dogfoodDocFile, "utf8");
const formerPipelineDocText = readFileSync(formerPipelineDocFile, "utf8");

const {
  buildPerspectiveCodexFormerPipelineDogfood,
  deriveDogfoodConclusion,
  evaluateContrastScenario,
  evaluateReadyDraftScenario,
  evaluateRegressionScenario,
  runPerspectiveCodexFormerPipelineDogfood,
} = await import("./dogfood-perspective-codex-former-pipeline.mjs");

assert.equal(existsSync(dogfoodScriptFile), true, `${dogfoodScriptFile} must exist`);
assert.equal(existsSync(smokeFile), true, `${smokeFile} must exist`);
assert.equal(existsSync(dogfoodDocFile), true, `${dogfoodDocFile} must exist`);

assert.equal(
  packageJson.scripts["dogfood:perspective-codex-former-pipeline"],
  `${expectedTsxCommand} ${dogfoodScriptFile}`,
  "package.json must register dogfood:perspective-codex-former-pipeline",
);
assert.equal(
  packageJson.scripts["smoke:perspective-codex-former-pipeline-dogfood"],
  `${expectedTsxCommand} ${smokeFile}`,
  "package.json must register smoke:perspective-codex-former-pipeline-dogfood",
);

assertDogfoodScriptBoundary();
assertDocs();
assertDerivedConclusionHelper();
assertScenarioEvaluatorHelpers();

const dogfood = runPerspectiveCodexFormerPipelineDogfood();
const rebuiltDogfood = buildPerspectiveCodexFormerPipelineDogfood();
assert.equal(
  dogfood.artifact,
  rebuiltDogfood.artifact,
  "dogfood artifact generation must be deterministic",
);
assert.equal(existsSync(artifactFile), true, "dogfood artifact must exist");
assert.equal(
  readFileSync(artifactFile, "utf8"),
  dogfood.artifact,
  "written dogfood artifact must match generated artifact",
);

assert.equal(
  dogfood.evaluation.conclusion,
  deriveDogfoodConclusion(dogfood.evaluation.scenario_conclusions),
  "top-level dogfood conclusion must be derived from scenario conclusions",
);
assertScenarioCoverage(dogfood.scenarios);
assertEvaluationCoverage(dogfood.evaluation);
assertArtifactCoverage(dogfood.artifact);
assertNoForbiddenOutputText("dogfood artifact", dogfood.artifact);
for (const scenario of dogfood.scenarios) {
  assertNoForbiddenOutputText(`${scenario.scenario_id} output`, scenario);
  assertScenarioAuthority(scenario);
}
assertChangedFileBoundary();

console.log("PASS smoke:perspective-codex-former-pipeline-dogfood");

function assertDogfoodScriptBoundary() {
  assertContainsAll(dogfoodScriptText, [
    "buildPerspectiveFormationInputBundle",
    "buildCodexPerspectiveFormerInputPacket",
    "validateAndNormalizeCodexPerspectiveCandidateDraft",
    "buildWorkerFacingPerspectiveGuidanceFromCandidate",
    "buildPerspectiveCodexFormerPipelineDogfood",
    "deriveDogfoodConclusion",
    "evaluateReadyDraftScenario",
    "evaluateContrastScenario",
    "evaluateRegressionScenario",
    "runPerspectiveCodexFormerPipelineDogfood",
    "reviewed_pr_477_ready_draft",
    "reviewed_pr_476_context_contrast",
    "malformed_or_authority_regression_case",
    "PASS with follow-up",
    "Refine Codex perspective former draft prompt contract from dogfood findings",
    "static local model-shaped draft fixture",
    "writeFileSync",
  ]);

  for (const forbiddenMarker of [
    ["read", "File"].join(""),
    ["process", "env"].join("."),
    ["fetch", "("].join(""),
    ["Date", "now"].join("."),
    ["new", "Date"].join(" "),
    "api.github.com",
    "api.openai.com",
    "GITHUB_TOKEN",
    "OPENAI_API_KEY",
  ]) {
    assert.equal(
      dogfoodScriptText.includes(forbiddenMarker),
      false,
      `${dogfoodScriptFile} must remain deterministic and local-only`,
    );
  }
}

function assertDocs() {
  assertContainsAll(docText, [
    "Perspective Codex Former Pipeline Dogfood v0.1",
    "after PR #477",
    "deterministic local dogfood",
    "reviewed_pr_477_ready_draft",
    "reviewed_pr_476_context_contrast",
    "malformed_or_authority_regression_case",
    "static local model-shaped draft fixture",
    "PASS with follow-up",
    "Refine Codex perspective former draft prompt contract from dogfood findings",
    "does not execute Codex",
    "does not mutate GitHub",
    "does not implement runtime routes",
    "does not implement UI",
    "does not implement DB schema",
    "does not implement persistence",
    "does not implement provider/model/API calls",
    "does not write proof/evidence/readiness",
    "does not implement Codex SDK/plugin integration",
    "does not make Core decisions",
  ]);
  assertContainsAll(formerPipelineDocText, [
    "Dogfooded By",
    "reports/dogfood/2026-06-09-perspective-codex-former-pipeline.md",
    "Refine Codex perspective former draft prompt contract from dogfood findings",
  ]);
}

function assertDerivedConclusionHelper() {
  assert.equal(
    deriveDogfoodConclusion(["PASS", "PASS"]),
    "PASS",
    "[PASS, PASS] must derive PASS",
  );
  assert.equal(
    deriveDogfoodConclusion(["PASS with follow-up", "PASS"]),
    "PASS with follow-up",
    "[PASS with follow-up, PASS] must derive PASS with follow-up",
  );
  assert.equal(
    deriveDogfoodConclusion(["PASS", "BLOCKED"]),
    "BLOCKED",
    "[PASS, BLOCKED] must derive BLOCKED",
  );
  assert.equal(
    deriveDogfoodConclusion([
      { scenario_id: "synthetic_a", conclusion: "PASS" },
      { scenario_id: "synthetic_b", conclusion: "PASS with follow-up" },
    ]),
    "PASS with follow-up",
    "object-shaped scenario conclusions must also be supported",
  );
}

function assertScenarioEvaluatorHelpers() {
  assert.equal(
    evaluateReadyDraftScenario({
      validationResult: {
        status: "blocked",
        candidate_review_material: null,
      },
      workerGuidance: null,
    }),
    "BLOCKED",
    "ready scenario must block when validation is blocked",
  );
  assert.equal(
    evaluateReadyDraftScenario({
      validationResult: {
        status: "ready_for_review",
        candidate_review_material: null,
      },
      workerGuidance: {},
    }),
    "BLOCKED",
    "ready scenario must block when candidate material is null",
  );
  assert.equal(
    evaluateContrastScenario({
      validationResult: {
        status: "ready_for_review",
        candidate_review_material: null,
      },
      workerGuidance: null,
    }),
    "BLOCKED",
    "contrast scenario must block when validation is not needs_review",
  );
  assert.equal(
    evaluateContrastScenario({
      validationResult: {
        status: "needs_review",
        candidate_review_material: buildContrastCandidateForEvaluator(),
      },
      workerGuidance: null,
    }),
    "BLOCKED",
    "contrast scenario must block when worker guidance is missing",
  );
  assert.equal(
    evaluateRegressionScenario({
      threw: false,
      validationResult: {
        status: "blocked",
        candidate_review_material: null,
        blocked_reasons: [
          "invalid draft field shape: unresolved_tensions must be an array",
          "draft includes forbidden authority claims",
        ],
        privacy: {
          raw_payloads_included: false,
        },
        authority_flags: buildFalseAuthorityFlags(),
      },
    }),
    "PASS",
    "regression scenario must pass only for blocked malformed authority output",
  );
  assert.equal(
    evaluateRegressionScenario({
      threw: false,
      validationResult: {
        status: "needs_review",
        candidate_review_material: {},
        blocked_reasons: [],
        privacy: {
          raw_payloads_included: false,
        },
        authority_flags: buildFalseAuthorityFlags(),
      },
    }),
    "BLOCKED",
    "regression scenario must block if validation is not blocked",
  );
}

function assertScenarioCoverage(scenarios) {
  const byId = new Map(
    scenarios.map((scenario) => [scenario.scenario_id, scenario]),
  );
  const ready = byId.get("reviewed_pr_477_ready_draft");
  const contrast = byId.get("reviewed_pr_476_context_contrast");
  const regression = byId.get("malformed_or_authority_regression_case");

  assert(ready, "reviewed PR #477 ready scenario must exist");
  assert(contrast, "reviewed PR #476 contrast scenario must exist");
  assert(regression, "regression scenario must exist");

  assert.equal(ready.former_input_packet_summary.role, "codex_perspective_former");
  assert.equal(ready.validation_status, "ready_for_review");
  assert.equal(
    ready.candidate_review_material.basis_quality.status,
    "sufficient_for_review",
  );
  assert.match(
    ready.candidate_review_material.thesis,
    /malformed, unsafe, and authority-claiming/,
  );
  assert(
    ready.candidate_review_material.evidence_pointers.every(
      (pointer) => pointer.pointer_semantics === "pointer_only",
    ),
    "ready candidate must preserve pointer-only refs",
  );
  assert.equal(ready.worker_guidance.guidance_status, "actionable_advisory");
  assert.equal(ready.worker_guidance.scope_alignment.advisory_only, true);
  assert(
    ready.worker_guidance.next_smallest_useful_actions.some((action) =>
      action.summary.includes("prompt-contract refinement"),
    ),
    "ready guidance must become concrete enough for prompt-contract refinement",
  );

  assert.equal(contrast.validation_status, "needs_review");
  assert.equal(
    contrast.candidate_review_material.basis_quality.status,
    "needs_review",
  );
  assert.match(contrast.candidate_review_material.thesis, /PR #476/);
  assert(
    contrast.candidate_review_material.unresolved_tensions.some((tension) =>
      tension.summary.includes("not evidence that former-pipeline output is useful"),
    ),
    "contrast scenario must preserve #476 as context, not proof/readiness",
  );
  assert.equal(contrast.worker_guidance.guidance_status, "resolve_gaps_first");

  assert.equal(regression.threw, false);
  assert.equal(regression.validation_status, "blocked");
  assert.equal(regression.candidate_review_material, null);
  assert(
    regression.validation_result.blocked_reasons.some((reason) =>
      reason.includes("invalid draft field shape"),
    ),
    "regression blocked reasons must include malformed shape",
  );
  assert(
    regression.validation_result.blocked_reasons.includes(
      "draft includes forbidden authority claims",
    ),
    "regression blocked reasons must include authority claims",
  );
  assert.equal(
    regression.validation_result.privacy.raw_payloads_included,
    false,
  );
  assert.equal(
    allAuthorityFlagsFalse(regression.validation_result.authority_flags),
    true,
  );
}

function assertEvaluationCoverage(evaluation) {
  assert.equal(evaluation.conclusion, "PASS with follow-up");
  assert.equal(evaluation.useful_enough_to_continue, true);
  assert.deepEqual(evaluation.reviewed_pr_material_used, [
    "pr:hynk-studio/augnes#477",
    "pr:hynk-studio/augnes#476",
  ]);
  assert.equal(
    evaluation.questions.neutral_perspective_beyond_plain_summary.answer,
    "yes",
  );
  assert.equal(
    evaluation.questions.validation_preserved_useful_candidate_material.answer,
    "yes",
  );
  assert.equal(evaluation.questions.worker_guidance_more_concrete.answer, "yes");
  assert.equal(
    evaluation.questions.distinguished_ready_needs_review_blocked.answer,
    "yes",
  );
  assert.equal(
    evaluation.questions.model_output_remained_draft_review_material.answer,
    "yes",
  );
  assert(
    evaluation.missing_validation_findings.some((finding) =>
      finding.includes("No missing shape"),
    ),
    "dogfood should report no new missing validation checks",
  );
}

function assertArtifactCoverage(artifact) {
  assertContainsAll(artifact, [
    "Perspective Codex Former Pipeline Dogfood",
    "Conclusion: PASS with follow-up",
    "reviewed_pr_477_ready_draft",
    "reviewed_pr_476_context_contrast",
    "malformed_or_authority_regression_case",
    "Candidate-Compatible Review Material",
    "Worker-Facing Guidance Compatibility",
    "Recommended next implementation PR title: Refine Codex perspective former draft prompt contract from dogfood findings",
    "This dogfood is pure local only.",
  ]);
}

function assertScenarioAuthority(scenario) {
  assert.equal(
    allAuthorityFlagsFalse(scenario.validation_result.authority_flags),
    true,
    `${scenario.scenario_id} validation authority flags must remain false`,
  );

  if (scenario.candidate_review_material) {
    assert.equal(
      allAuthorityFlagsFalse(scenario.candidate_review_material.authority_flags),
      true,
      `${scenario.scenario_id} candidate authority flags must remain false`,
    );
    assert.equal(scenario.candidate_review_material.authority, "non_committed");
    assert.equal(
      scenario.candidate_review_material.privacy.raw_payloads_included,
      false,
    );
  }

  if (scenario.worker_guidance) {
    assert.equal(
      allAuthorityFlagsFalse(scenario.worker_guidance.authority_flags),
      true,
      `${scenario.scenario_id} guidance authority flags must remain false`,
    );
    assert(
      scenario.worker_guidance.next_smallest_useful_actions.every(
        (action) =>
          action.advisory_only === true &&
          action.codex_execution === false,
      ),
      `${scenario.scenario_id} guidance actions must remain advisory-only`,
    );
  }
}

function assertNoForbiddenOutputText(label, value) {
  const serialized = JSON.stringify(value);
  for (const forbiddenMarker of [
    "billing_payload",
    "token_payload",
    "oauth_payload",
    "raw_pasted_text",
    "raw_source_payload",
    "raw_candidate_payload",
    "raw_private_payload",
    "private_payload",
    "provider_payload",
    "oauth_token",
    "access_token",
    "refresh_token",
    "api_key",
    "hidden_reasoning",
    "generated_model_payload",
    "sk-proj-",
    "ghp_",
    "gho_",
    "ghu_",
    "ghs_",
    "ghr_",
    "secret",
  ]) {
    assert.equal(
      serialized.includes(forbiddenMarker),
      false,
      `${label} must not include unsafe marker: ${forbiddenMarker}`,
    );
  }
}

function assertChangedFileBoundary() {
  for (const changedFile of collectChangedFiles()) {
    assert(
      allowedChangedFiles.has(changedFile),
      `Perspective Codex former pipeline dogfood changed an out-of-scope file: ${changedFile}`,
    );
    assert(
      !changedFile.startsWith("app/api/") &&
        !changedFile.startsWith("components/") &&
        changedFile !== "app/globals.css" &&
        !changedFile.startsWith("db/") &&
        !changedFile.startsWith("migrations/") &&
        !changedFile.startsWith("fixtures/") &&
        !changedFile.startsWith("types/") &&
        (!changedFile.startsWith("lib/") ||
          changedFile === promptContractFile ||
          changedFile === manualCopyPacketFile) &&
        !changedFile.includes("provider") &&
        !changedFile.includes("oauth") &&
        !changedFile.includes("codex-sdk") &&
        !changedFile.includes("graph-db") &&
        !changedFile.includes("persistence"),
      `Perspective Codex former pipeline dogfood must not change forbidden surfaces: ${changedFile}`,
    );
  }
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
    throw new Error(
      "Perspective Codex former pipeline dogfood smoke collected no changed files",
    );
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

  const localMainFiles = gitLinesStrict(["diff", "--name-only", "main...HEAD"]);
  if (localMainFiles) {
    return localMainFiles;
  }

  const originMergeBase = gitLineStrict(["merge-base", "HEAD", "origin/main"]);
  if (originMergeBase) {
    const originMergeBaseFiles = gitLinesStrict([
      "diff",
      "--name-only",
      `${originMergeBase}...HEAD`,
    ]);
    if (originMergeBaseFiles) {
      return originMergeBaseFiles;
    }
  }

  const localMergeBase = gitLineStrict(["merge-base", "HEAD", "main"]);
  if (localMergeBase) {
    const localMergeBaseFiles = gitLinesStrict([
      "diff",
      "--name-only",
      `${localMergeBase}...HEAD`,
    ]);
    if (localMergeBaseFiles) {
      return localMergeBaseFiles;
    }
  }

  throw new Error(
    "Unable to collect base diff for Perspective Codex former pipeline dogfood smoke",
  );
}

function gitLinesOrEmpty(args) {
  return gitLinesStrict(args) ?? [];
}

function gitLinesStrict(args) {
  const output = tryGitOutput(args);
  return output === null ? null : parseGitLines(output);
}

function gitLineStrict(args) {
  const lines = gitLinesStrict(args);
  return lines?.[0] ?? null;
}

function isCommittedBranch() {
  return gitLineStrict(["rev-parse", "--verify", "HEAD"]) !== null;
}

function tryGitOutput(args) {
  try {
    return execFileSync("git", args, { encoding: "utf8" });
  } catch {
    return null;
  }
}

function parseGitLines(output) {
  return output
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function buildContrastCandidateForEvaluator() {
  return {
    basis_quality: {
      status: "needs_review",
    },
    unresolved_tensions: [
      {
        summary:
          "PR #476 is context for downstream guidance specificity, not evidence that former-pipeline output is useful by itself.",
      },
      {
        summary:
          "This contrast does not treat worker guidance usefulness as proof, evidence, readiness, or execution authority.",
      },
    ],
    authority_flags: buildFalseAuthorityFlags(),
  };
}

function buildFalseAuthorityFlags() {
  return {
    committed_state: false,
    persistence: false,
    provider_model_api_calls: false,
    proof_evidence_readiness_writes: false,
    codex_execution: false,
    github_mutation: false,
    merge_publish_approval: false,
    core_decision: false,
  };
}

function allAuthorityFlagsFalse(flags) {
  if (!flags) return false;
  return Object.values(flags).every((value) => value === false);
}

function assertContainsAll(text, snippets) {
  const normalizedText = normalize(text);
  for (const snippet of snippets) {
    assert(
      normalizedText.includes(normalize(snippet)),
      `Expected source to contain: ${snippet}`,
    );
  }
}

function normalize(text) {
  return text.replace(/\s+/g, " ").trim();
}
