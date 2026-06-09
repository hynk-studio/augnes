import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

const packageFile = "package.json";
const dogfoodScriptFile =
  "scripts/dogfood-perspective-worker-facing-guidance-loop.mjs";
const smokeFile =
  "scripts/smoke-perspective-worker-facing-guidance-loop-dogfood.mjs";
const artifactFile =
  "reports/dogfood/2026-06-09-perspective-worker-facing-guidance-loop.md";
const dogfoodDocFile =
  "docs/PERSPECTIVE_WORKER_FACING_GUIDANCE_DOGFOOD_V0_1.md";
const workerGuidanceDocFile =
  "docs/PERSPECTIVE_WORKER_FACING_GUIDANCE_V0_1.md";
const workerGuidanceBuilderFile =
  "lib/perspective-ingest/perspective-worker-facing-guidance.ts";
const workerGuidanceSmokeFile =
  "scripts/smoke-perspective-worker-facing-guidance.mjs";
const candidateBuilderSmokeFile =
  "scripts/smoke-perspective-candidate-builder-fixture.mjs";
const actionSpecificityReportFile =
  "reports/2026-06-09-perspective-worker-facing-guidance-action-specificity.md";

const expectedTsxCommand =
  "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json";
const allowedChangedFiles = new Set([
  packageFile,
  dogfoodScriptFile,
  smokeFile,
  artifactFile,
  dogfoodDocFile,
  actionSpecificityReportFile,
  workerGuidanceBuilderFile,
  workerGuidanceDocFile,
  workerGuidanceSmokeFile,
  candidateBuilderSmokeFile,
]);

const packageJson = JSON.parse(readFileSync(packageFile, "utf8"));
const dogfoodScriptText = readFileSync(dogfoodScriptFile, "utf8");
const docText = readFileSync(dogfoodDocFile, "utf8");
const workerGuidanceDocText = readFileSync(workerGuidanceDocFile, "utf8");

const {
  buildPerspectiveWorkerFacingGuidanceLoopDogfood,
  deriveDogfoodConclusion,
  runPerspectiveWorkerFacingGuidanceLoopDogfood,
} = await import("./dogfood-perspective-worker-facing-guidance-loop.mjs");

assert.equal(existsSync(dogfoodScriptFile), true, `${dogfoodScriptFile} must exist`);
assert.equal(existsSync(smokeFile), true, `${smokeFile} must exist`);
assert.equal(existsSync(dogfoodDocFile), true, `${dogfoodDocFile} must exist`);

assert.equal(
  packageJson.scripts["dogfood:perspective-worker-facing-guidance-loop"],
  `${expectedTsxCommand} ${dogfoodScriptFile}`,
  "package.json must register dogfood:perspective-worker-facing-guidance-loop",
);
assert.equal(
  packageJson.scripts["smoke:perspective-worker-facing-guidance-loop-dogfood"],
  `${expectedTsxCommand} ${smokeFile}`,
  "package.json must register smoke:perspective-worker-facing-guidance-loop-dogfood",
);

assertDogfoodScriptBoundary();
assertDocs();
assertDerivedConclusionHelper();

const dogfood = runPerspectiveWorkerFacingGuidanceLoopDogfood();
const rebuiltDogfood = buildPerspectiveWorkerFacingGuidanceLoopDogfood();
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
assertArtifactCoverage(dogfood.artifact);
assertNoForbiddenOutputText("dogfood artifact", dogfood.artifact);
for (const scenario of dogfood.scenarios) {
  assertNoForbiddenOutputText(
    `${scenario.scenario_id} guidance`,
    scenario.worker_guidance,
  );
  assertAuthorityFlags(scenario.worker_guidance);
}
assertChangedFileBoundary();

console.log("PASS smoke:perspective-worker-facing-guidance-loop-dogfood");

function assertDogfoodScriptBoundary() {
  assertContainsAll(dogfoodScriptText, [
    "buildPerspectiveFormationInputBundle",
    "buildPerspectiveCandidateFromFormationInputBundle",
    "buildWorkerFacingPerspectiveGuidanceFromCandidate",
    "buildPerspectiveWorkerFacingGuidanceLoopDogfood",
    "deriveDogfoodConclusion",
    "runPerspectiveWorkerFacingGuidanceLoopDogfood",
    "real_reviewed_pr_474_ready",
    "review_gap_regression_case",
    "blocked_or_missing_scope_contrast",
    "PASS with follow-up",
    "Add local Codex perspective former pipeline scaffold",
    "writeFileSync",
    "billing_payload",
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
      { conclusion: "PASS", scenario_id: "synthetic_a" },
      { conclusion: "PASS with follow-up", scenario_id: "synthetic_b" },
    ]),
    "PASS with follow-up",
    "object-shaped scenario conclusions must also be supported",
  );
}

function assertDocs() {
  assertContainsAll(docText, [
    "Perspective Worker-Facing Guidance Dogfood v0.1",
    "after PR #474",
    "deterministic local dogfood",
    "real_reviewed_pr_474_ready",
    "review_gap_regression_case",
    "blocked_or_missing_scope_contrast",
    "PASS with follow-up",
    "Add local Codex perspective former pipeline scaffold",
    "does not execute Codex",
    "does not mutate GitHub",
    "does not implement runtime routes",
    "does not implement UI",
    "does not implement DB schema",
    "does not implement persistence",
    "does not implement provider/model/API calls",
    "does not write proof/evidence/readiness",
    "does not implement ChatGPT Apps",
    "does not implement Codex SDK/plugin integration",
    "does not make Core decisions",
  ]);
  assertContainsAll(workerGuidanceDocText, [
    "Dogfooded By",
    "reports/dogfood/2026-06-09-perspective-worker-facing-guidance-loop.md",
    "Add local Codex perspective former pipeline scaffold",
  ]);
}

function assertScenarioCoverage(scenarios) {
  const byId = new Map(
    scenarios.map((scenario) => [scenario.scenario_id, scenario]),
  );
  const ready = byId.get("real_reviewed_pr_474_ready");
  const reviewGap = byId.get("review_gap_regression_case");
  const blocked = byId.get("blocked_or_missing_scope_contrast");

  assert(ready, "ready dogfood scenario must exist");
  assert(reviewGap, "review-gap dogfood scenario must exist");
  assert(blocked, "blocked dogfood scenario must exist");

  assert.equal(
    ready.perspective_candidate.basis_quality.status,
    "sufficient_for_review",
  );
  assert.equal(ready.worker_guidance.guidance_status, "actionable_advisory");
  assert.match(
    ready.worker_guidance.work_goal,
    /next smallest useful local implementation follow-up/,
  );
  assert(
    ready.worker_guidance.next_smallest_useful_actions.some(
      (action) => action.action_id === "draft_smallest_scoped_plan",
    ),
    "ready guidance must identify scoped planning as the next useful action",
  );

  assert.equal(
    reviewGap.perspective_candidate.basis_quality.status,
    "needs_review",
  );
  assert.equal(
    reviewGap.worker_guidance.guidance_status,
    "resolve_gaps_first",
  );
  assert(
    reviewGap.worker_guidance.verification_gaps.some((gap) =>
      gap.summary.includes("Payload marker redaction concern"),
    ),
    "review-gap guidance must preserve the redaction concern safely",
  );
  assert.match(
    reviewGap.worker_guidance.worker_instructions[0],
    /Resolve visible gaps/,
  );
  assert.equal(
    reviewGap.worker_guidance.privacy.unsafe_input_material_omitted,
    true,
  );
  assert(
    reviewGap.worker_guidance.privacy.omitted_unsafe_fields.includes(
      "candidate.selected_material.changed_files_summary",
    ),
    "review-gap guidance must record the unsafe selected summary omission",
  );
  assert(
    reviewGap.worker_guidance.privacy.omitted_unsafe_fields.includes(
      "guidance_context.bounded_summary",
    ),
    "review-gap guidance must record the unsafe bounded summary omission",
  );

  assert.equal(blocked.perspective_candidate.basis_quality.status, "blocked");
  assert.equal(blocked.worker_guidance.guidance_status, "stop_or_defer");
  assert(
    blocked.worker_guidance.next_smallest_useful_actions.some(
      (action) => action.action_id === "stop_and_request_unblock",
    ),
    "blocked guidance must tell the worker to stop and request unblock",
  );
  assert(
    blocked.worker_guidance.stop_or_defer_actions.some(
      (action) => action.action_id === "defer_all_worker_planning",
    ),
    "blocked guidance must defer worker planning",
  );
  assert(
    blocked.worker_guidance.stop_or_defer_actions.some(
      (action) => action.action_id === "defer_authority_claims",
    ),
    "blocked guidance must defer authority claims",
  );
}

function assertArtifactCoverage(artifactText) {
  assertContainsAll(artifactText, [
    "# Perspective Worker-Facing Guidance Loop Dogfood",
    "Evaluation Conclusion",
    "PASS with follow-up",
    "Does the guidance narrow the next worker action?",
    "Does it distinguish actionable planning from gap-first review?",
    "Does it keep unresolved tensions and verification gaps visible?",
    "Does it avoid turning guidance into proof, evidence, readiness, approval, merge authority, GitHub mutation, Codex execution, or Core decision?",
    "Does it avoid unsafe raw/private/provider/token/billing/source payloads?",
    "Is the guidance specific enough for a future Codex task prompt?",
    "What is the next implementation PR after this dogfood?",
    "real_reviewed_pr_474_ready",
    "candidate_basis_quality: sufficient_for_review",
    "guidance_status: actionable_advisory",
    "review_gap_regression_case",
    "guidance_status: resolve_gaps_first",
    "Payload marker redaction concern remained unresolved before the review fix.",
    "blocked_or_missing_scope_contrast",
    "guidance_status: stop_or_defer",
    "stop_and_request_unblock",
    "defer_all_worker_planning",
    "defer_authority_claims",
    "Authority Boundary",
    "Validation Commands",
  ]);
}

function assertAuthorityFlags(guidance) {
  assert.deepEqual(guidance.authority_flags, {
    committed_state: false,
    persistence: false,
    provider_model_api_calls: false,
    proof_evidence_readiness_writes: false,
    codex_execution: false,
    github_mutation: false,
    merge_publish_approval: false,
    chatgpt_app_integration: false,
    core_decision: false,
  });
}

function assertNoForbiddenOutputText(label, value) {
  const serialized = JSON.stringify(value);
  for (const forbiddenMarker of [
    "raw_pasted_text",
    "raw_source_payload",
    "raw_candidate_payload",
    "raw_private_payload",
    "private_payload",
    "provider_payload",
    "billing_payload",
    "token_payload",
    "oauth_payload",
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
      `${label} must not include unsafe source marker: ${forbiddenMarker}`,
    );
  }
}

function assertChangedFileBoundary() {
  for (const changedFile of collectChangedFiles()) {
    assert(
      allowedChangedFiles.has(changedFile),
      `Perspective worker-facing guidance dogfood changed an out-of-scope file: ${changedFile}`,
    );
    assert(
      !changedFile.startsWith("app/api/") &&
        !changedFile.startsWith("components/") &&
        changedFile !== "app/globals.css" &&
        (!changedFile.startsWith("lib/") ||
          changedFile === workerGuidanceBuilderFile) &&
        !changedFile.startsWith("db/") &&
        !changedFile.startsWith("migrations/") &&
        !changedFile.startsWith("fixtures/") &&
        !changedFile.startsWith("types/") &&
        !changedFile.includes("codex-sdk") &&
        !changedFile.includes("graph-db") &&
        !changedFile.includes("persistence"),
      `Perspective worker-facing guidance dogfood must not change forbidden surfaces: ${changedFile}`,
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
      "Perspective worker-facing guidance dogfood smoke collected no changed files",
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
    "Unable to collect base diff for Perspective worker-facing guidance dogfood smoke",
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
