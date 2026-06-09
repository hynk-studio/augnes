import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

const packageFile = "package.json";
const workerGuidanceBuilderFile =
  "lib/perspective-ingest/perspective-worker-facing-guidance.ts";
const docFile =
  "docs/PERSPECTIVE_WORKER_FACING_GUIDANCE_V0_1.md";
const reportFile =
  "reports/2026-06-09-perspective-worker-facing-guidance.md";
const smokeFile =
  "scripts/smoke-perspective-worker-facing-guidance.mjs";
const candidateBuilderSmokeFile =
  "scripts/smoke-perspective-candidate-builder-fixture.mjs";

const allowedChangedFiles = new Set([
  packageFile,
  workerGuidanceBuilderFile,
  docFile,
  reportFile,
  smokeFile,
  candidateBuilderSmokeFile,
]);

const packageJson = JSON.parse(readFileSync(packageFile, "utf8"));
const builderText = readFileSync(workerGuidanceBuilderFile, "utf8");
const docText = readFileSync(docFile, "utf8");
const reportText = readFileSync(reportFile, "utf8");

const { buildPerspectiveFormationInputBundle } = await import(
  "../lib/perspective-ingest/perspective-formation-input-bundle.ts"
);
const { buildPerspectiveCandidateFromFormationInputBundle } = await import(
  "../lib/perspective-ingest/perspective-candidate-builder.ts"
);
const { buildWorkerFacingPerspectiveGuidanceFromCandidate } = await import(
  "../lib/perspective-ingest/perspective-worker-facing-guidance.ts"
);

assert.equal(
  existsSync(workerGuidanceBuilderFile),
  true,
  `${workerGuidanceBuilderFile} must exist`,
);
assert.equal(existsSync(docFile), true, `${docFile} must exist`);
assert.equal(existsSync(reportFile), true, `${reportFile} must exist`);
assert.equal(existsSync(smokeFile), true, `${smokeFile} must exist`);

assert.equal(
  packageJson.scripts["smoke:perspective-worker-facing-guidance"],
  "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json scripts/smoke-perspective-worker-facing-guidance.mjs",
  "package.json must register smoke:perspective-worker-facing-guidance",
);

assertBuilderSourceIsPureLocal();
assertDocsAndReport();
assertSufficientCandidateGuidance();
assertNeedsReviewCandidateGuidance();
assertBlockedCandidateGuidance();
assertUnsafeSourceMaterialIsOmitted();
assertBillingPayloadMaterialIsOmitted();
assertChangedFileBoundary();

console.log("PASS smoke:perspective-worker-facing-guidance");

function assertSufficientCandidateGuidance() {
  const candidate = buildCandidate({
    scope: "project:augnes",
    work_id: "AG-perspective-worker-guidance-ready",
    source_pr_refs: ["pr:hynk-studio/augnes#worker-guidance"],
    changed_files: [
      workerGuidanceBuilderFile,
      docFile,
      reportFile,
      smokeFile,
    ],
    changed_files_summary:
      "Adds worker-facing neutral guidance for the next smallest useful Codex-side planning step.",
    tests_checks_run: [
      {
        check_id: "check:typecheck",
        command: "npm run typecheck",
        status: "passed",
        result_summary: "TypeScript completed without errors.",
      },
    ],
    skipped_checks: [
      {
        check_id: "check:browser",
        skipped_reason:
          "Browser validation is not required for this pure local builder slice.",
        result_summary: "No browser-facing behavior changed.",
      },
    ],
    evidence_row_refs: ["evidence:row:worker-guidance-ready"],
    proof_only_action_refs: ["action:proof:worker-guidance-smoke"],
  });

  assert.equal(candidate.basis_quality.status, "sufficient_for_review");

  const guidance = buildWorkerFacingPerspectiveGuidanceFromCandidate({
    candidate,
    guidance_context: {
      bounded_summary:
        "Explicit bounded summary: local guidance only, no execution.",
    },
  });

  assert.equal(
    guidance.guidance_version,
    "worker_facing_perspective_guidance.v0.1",
  );
  assert.equal(
    guidance.guidance_kind,
    "worker_facing_perspective_guidance",
  );
  assert.equal(guidance.guidance_status, "actionable_advisory");
  assert.equal(
    guidance.scope_alignment.status,
    "aligned_for_advisory_planning",
  );
  assert.equal(
    guidance.source_candidate.candidate_id,
    candidate.candidate_id,
  );
  assert.equal(
    guidance.source_candidate.refs.work_id,
    "AG-perspective-worker-guidance-ready",
  );
  assert.deepEqual(guidance.source_candidate.refs.source_pr_refs, [
    "pr:hynk-studio/augnes#worker-guidance",
  ]);
  assert.deepEqual(
    guidance.source_candidate.refs.evidence_pointer_refs.map(
      (pointer) => pointer.pointer_semantics,
    ),
    ["pointer_only", "pointer_only"],
  );
  assert.match(
    guidance.work_goal,
    /worker-facing neutral guidance/,
  );
  assert(
    guidance.neutral_observations.some(
      (observation) =>
        observation.observation_id === "explicit_bounded_summary" &&
        observation.summary.includes("Explicit bounded summary"),
    ),
    "explicit bounded summaries must be allowed when safe and reviewable",
  );
  assert(
    guidance.verification_gaps.some(
      (gap) => gap.gap_kind === "skipped_check",
    ),
    "skipped checks must remain visible as verification gaps",
  );
  assert.deepEqual(
    guidance.next_smallest_useful_actions.map((action) => action.action_id),
    [
      "inspect_source_candidate_refs",
      "draft_smallest_scoped_plan",
      "carry_forward_verification_gaps",
    ],
  );
  assert.deepEqual(
    guidance.stop_or_defer_actions.map((action) => action.action_id),
    ["defer_execution_until_user_task", "defer_authority_claims"],
  );
  assert(
    guidance.user_decision_questions.some((question) =>
      question.includes("future Codex worker"),
    ),
    "sufficient candidates still require user decision before future worker use",
  );
  assert.equal(guidance.privacy.raw_payloads_included, false);
  assert.equal(guidance.privacy.unsafe_input_material_omitted, false);
  assertAuthority(guidance);
  assertNoForbiddenPayloadText("ready guidance", guidance);
}

function assertNeedsReviewCandidateGuidance() {
  const candidate = buildCandidate({
    scope: "project:augnes",
    work_id: "AG-perspective-worker-guidance-needs-review",
    changed_files_summary:
      "Adds worker-facing guidance but still has review gaps to resolve.",
    tests_checks_run: [
      {
        check_id: "check:smoke",
        command: "npm run smoke:perspective-worker-facing-guidance",
        status: "failed",
        result_summary: "Smoke failed before the gap fix.",
      },
    ],
    unresolved_gaps: [
      {
        gap_id: "gap:verification-retry-needed",
        summary: "The failed smoke needs a rerun after the fix.",
      },
    ],
    evidence_row_refs: ["evidence:row:worker-guidance-needs-review"],
  });

  assert.equal(candidate.basis_quality.status, "needs_review");

  const guidance = buildWorkerFacingPerspectiveGuidanceFromCandidate({
    candidate,
  });

  assert.equal(guidance.guidance_status, "resolve_gaps_first");
  assert.equal(
    guidance.scope_alignment.status,
    "resolve_gaps_before_planning",
  );
  assert(
    guidance.scope_alignment.reasons.includes("unresolved gaps present"),
    "needs-review basis reasons must remain visible",
  );
  assert(
    guidance.verification_gaps.some(
      (gap) =>
        gap.gap_kind === "failed_check" &&
        gap.source_ref === "check:smoke",
    ),
    "failed checks must become visible verification gaps",
  );
  assert(
    guidance.verification_gaps.some(
      (gap) =>
        gap.gap_kind === "unresolved_gap" &&
        gap.source_ref === "gap:verification-retry-needed",
    ),
    "unresolved candidate gaps must remain visible",
  );
  assert(
    guidance.unresolved_tensions.some(
      (tension) =>
        tension.tension_kind === "readiness_reason" &&
        tension.summary === "unresolved gaps present",
    ),
    "readiness reasons must remain visible unresolved tensions",
  );
  assert.deepEqual(
    guidance.next_smallest_useful_actions.map((action) => action.action_id),
    [
      "resolve_verification_gaps",
      "preserve_unresolved_tensions",
      "ask_user_decision_questions",
    ],
  );
  assert.deepEqual(
    guidance.stop_or_defer_actions.map((action) => action.action_id),
    ["defer_implementation_planning", "defer_authority_claims"],
  );
  assert.match(
    guidance.worker_instructions[0],
    /Resolve visible gaps/,
  );
  assertAuthority(guidance);
  assertNoForbiddenPayloadText("needs-review guidance", guidance);
}

function assertBlockedCandidateGuidance() {
  const candidate = buildCandidate({
    work_id: "AG-perspective-worker-guidance-blocked",
    skipped_checks: [
      {
        check_id: "check:scope",
        skipped_reason: "Scope is missing, so worker planning cannot proceed.",
      },
    ],
  });

  assert.equal(candidate.basis_quality.status, "blocked");

  const guidance = buildWorkerFacingPerspectiveGuidanceFromCandidate({
    candidate,
  });

  assert.equal(guidance.guidance_status, "stop_or_defer");
  assert.equal(
    guidance.scope_alignment.status,
    "blocked_stop_or_defer",
  );
  assert.deepEqual(
    guidance.next_smallest_useful_actions.map((action) => action.action_id),
    ["stop_and_request_unblock"],
  );
  assert.deepEqual(
    guidance.stop_or_defer_actions.map((action) => action.action_id),
    ["defer_all_worker_planning", "defer_authority_claims"],
  );
  assert.match(guidance.worker_instructions[0], /Stop and defer/);
  assert(
    guidance.user_decision_questions.some((question) =>
      question.includes("blocked candidate"),
    ),
    "blocked guidance must ask for the unblock decision",
  );
  assertAuthority(guidance);
  assertNoForbiddenPayloadText("blocked guidance", guidance);
}

function assertUnsafeSourceMaterialIsOmitted() {
  const candidate = buildCandidate({
    scope: "project:augnes",
    work_id: "AG-perspective-worker-guidance-redaction",
    source_pr_refs: ["pr:hynk-studio/augnes#redaction"],
    changed_files_summary:
      "raw_source_payload sk-proj-unsafe hidden_reasoning generated_model_payload api_key oauth_token ghp_unsafe secret",
    tests_checks_run: [
      {
        check_id: "check:redaction",
        command: "npm run smoke:perspective-worker-facing-guidance",
        status: "failed",
        result_summary:
          "private_payload provider_payload access_token refresh_token raw_candidate_payload",
      },
    ],
    unresolved_gaps: [
      {
        gap_id: "gap:redaction",
        summary:
          "generated_model_payload hidden_reasoning raw_pasted_text secret",
      },
    ],
    evidence_row_refs: ["evidence:row:worker-guidance-redaction"],
  });

  const guidance = buildWorkerFacingPerspectiveGuidanceFromCandidate({
    candidate,
    guidance_context: {
      work_goal: "raw_private_payload sk-proj-unsafe",
      bounded_summary: "provider_payload secret",
    },
  });

  assert.equal(guidance.privacy.unsafe_input_material_omitted, true);
  assert(
    guidance.privacy.omitted_unsafe_fields.includes(
      "candidate.selected_material.changed_files_summary",
    ),
    "unsafe selected summary field must be recorded as omitted",
  );
  assert.equal(guidance.work_goal, null);
  assert(
    guidance.verification_gaps.some(
      (gap) => gap.summary === "Failed check remains unresolved.",
    ),
    "unsafe failed-check detail must be replaced with a generic gap",
  );
  assert(
    guidance.unresolved_tensions.some(
      (tension) =>
        tension.summary === "Unresolved candidate tension was omitted from detail.",
    ),
    "unsafe tension detail must be replaced with a generic summary",
  );
  assertNoForbiddenPayloadText("redacted guidance", guidance);
}

function assertBillingPayloadMaterialIsOmitted() {
  const candidate = buildCandidate({
    scope: "project:augnes",
    work_id: "AG-perspective-worker-guidance-billing-redaction",
    changed_files_summary: "billing_payload",
    tests_checks_run: [
      {
        check_id: "check:billing-redaction",
        command: "npm run smoke:perspective-worker-facing-guidance",
        status: "failed",
        result_summary: "billing_payload",
      },
    ],
    unresolved_gaps: [
      {
        gap_id: "gap:billing-redaction",
        summary: "billing_payload",
      },
    ],
    evidence_row_refs: ["evidence:row:worker-guidance-billing-redaction"],
  });

  const guidance = buildWorkerFacingPerspectiveGuidanceFromCandidate({
    candidate,
    guidance_context: {
      work_goal: "billing_payload",
      bounded_summary: "billing_payload",
    },
  });

  assert.equal(guidance.privacy.unsafe_input_material_omitted, true);
  for (const omittedField of [
    "guidance_context.work_goal",
    "guidance_context.bounded_summary",
    "candidate.selected_material.changed_files_summary",
    "candidate.thesis",
    "candidate.verification_summary.checks_run.result_summary",
    "candidate.unresolved_tensions.summary",
  ]) {
    assert(
      guidance.privacy.omitted_unsafe_fields.includes(omittedField),
      `billing payload redaction must record omitted field: ${omittedField}`,
    );
  }
  assert.equal(guidance.work_goal, null);
  assert.equal(
    JSON.stringify(guidance.neutral_observations).includes("billing_payload"),
    false,
    "billing payload must be omitted from neutral observations",
  );
  assert.equal(
    JSON.stringify(guidance.verification_gaps).includes("billing_payload"),
    false,
    "billing payload must be omitted from verification gaps",
  );
  assert.equal(
    JSON.stringify(guidance.unresolved_tensions).includes("billing_payload"),
    false,
    "billing payload must be omitted from unresolved tensions",
  );
  assert(
    guidance.verification_gaps.some(
      (gap) => gap.summary === "Failed check remains unresolved.",
    ),
    "billing payload failed-check detail must be replaced with a generic gap",
  );
  assert(
    guidance.unresolved_tensions.some(
      (tension) =>
        tension.summary === "Unresolved candidate tension was omitted from detail.",
    ),
    "billing payload tension detail must be replaced with a generic summary",
  );
  assertNoForbiddenPayloadText("billing redacted guidance", guidance);
}

function buildCandidate(input) {
  return buildPerspectiveCandidateFromFormationInputBundle(
    buildPerspectiveFormationInputBundle(input),
  );
}

function assertBuilderSourceIsPureLocal() {
  assertContainsAll(builderText, [
    "buildWorkerFacingPerspectiveGuidanceFromCandidate",
    "worker_facing_perspective_guidance.v0.1",
    "worker_facing_perspective_guidance",
    "sufficient_for_review",
    "needs_review",
    "blocked",
    "actionable_advisory",
    "resolve_gaps_first",
    "stop_or_defer",
    "raw_payloads_included: false",
    "provider_model_api_calls: false",
    "proof_evidence_readiness_writes: false",
    "codex_execution: false",
    "github_mutation: false",
    "merge_publish_approval: false",
    "chatgpt_app_integration: false",
    "core_decision: false",
  ]);

  for (const forbiddenMarker of [
    ["read", "File"].join(""),
    ["process", "env"].join("."),
    ["fetch", "("].join(""),
    ["Date", "now"].join("."),
    ["new", "Date"].join(" "),
    "app/api/",
    "db/",
    "migrations/",
    "api.github.com",
    "api.openai.com",
    "GITHUB_TOKEN",
    "OPENAI_API_KEY",
  ]) {
    assert.equal(
      builderText.includes(forbiddenMarker),
      false,
      `${workerGuidanceBuilderFile} must remain pure local and avoid ${forbiddenMarker}`,
    );
  }
}

function assertDocsAndReport() {
  assertContainsAll(docText, [
    "pure local Codex-side worker guidance scaffold",
    "buildWorkerFacingPerspectiveGuidanceFromCandidate(input)",
    "Perspective Candidate",
    "neutral, worker-facing guidance",
    "guidance_version",
    "guidance_kind",
    "source_candidate",
    "work_goal",
    "neutral_observations",
    "scope_alignment",
    "verification_gaps",
    "next_smallest_useful_actions",
    "stop_or_defer_actions",
    "user_decision_questions",
    "worker_instructions",
    "authority_boundary",
    "sufficient_for_review",
    "needs_review",
    "blocked",
    "raw/private/provider",
    "hidden reasoning",
    "secrets",
    "no runtime route",
    "no UI",
    "no DB schema",
    "no provider/model/API call",
    "no ChatGPT Apps integration",
    "no Codex SDK/plugin integration",
    "no GitHub mutation automation",
    "no actual Codex execution",
    "no Core decision",
  ]);
  assertContainsAll(reportText, [
    "Summary",
    "Why This Follows The Completed Local Packet Chain",
    "Files Changed",
    "Authority Boundary",
    "Behavior Covered",
    "Validation Plan",
    "What Is Not Implemented",
    "Skipped Checks",
    "pure local guidance only",
    "sufficient_for_review",
    "needs_review",
    "blocked",
    "no runtime route",
    "no UI",
    "no DB/schema/persistence",
    "no provider/model/API call",
    "no proof/evidence/readiness write",
    "no ChatGPT Apps integration",
    "no Codex SDK/plugin integration",
    "no GitHub mutation automation",
    "no actual Codex execution",
    "no merge",
    "no approval",
    "no Core decision",
  ]);
}

function assertAuthority(guidance) {
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
  assert.equal(guidance.authority_boundary.includes("approval"), true);
  assert.equal(guidance.authority_boundary.includes("Codex execution"), true);
  assert(
    guidance.next_smallest_useful_actions.every(
      (action) =>
        action.advisory_only === true &&
        action.codex_execution === false,
    ),
    "next actions must stay advisory and non-executing",
  );
  assert(
    guidance.stop_or_defer_actions.every(
      (action) =>
        action.advisory_only === true &&
        action.codex_execution === false,
    ),
    "stop/defer actions must stay advisory and non-executing",
  );
}

function assertNoForbiddenPayloadText(label, value) {
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
    "sk-proj-unsafe",
    "ghp_unsafe",
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
      `Perspective worker-facing guidance changed an out-of-scope file: ${changedFile}`,
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
      `Perspective worker-facing guidance must not change forbidden surfaces: ${changedFile}`,
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
      "Perspective worker-facing guidance smoke collected no changed files",
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
    "Unable to collect base diff for Perspective worker-facing guidance smoke",
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
