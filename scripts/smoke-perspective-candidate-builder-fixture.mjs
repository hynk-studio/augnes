import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

const packageFile = "package.json";
const candidateBuilderFile =
  "lib/perspective-ingest/perspective-candidate-builder.ts";
const briefingPreviewBuilderFile =
  "lib/perspective-ingest/perspective-candidate-briefing-preview.ts";
const userJudgmentBuilderFile =
  "lib/perspective-ingest/perspective-user-judgment-capture-packet.ts";
const codexDraftBuilderFile =
  "lib/perspective-ingest/perspective-codex-next-handoff-draft-packet.ts";
const inputBundleBuilderFile =
  "lib/perspective-ingest/perspective-formation-input-bundle.ts";
const docFile =
  "docs/PERSPECTIVE_CANDIDATE_BUILDER_FIXTURE_V0_1.md";
const reportFile =
  "reports/2026-06-08-perspective-candidate-builder-fixture.md";
const smokeFile =
  "scripts/smoke-perspective-candidate-builder-fixture.mjs";
const briefingPreviewDocFile =
  "docs/PERSPECTIVE_CANDIDATE_BRIEFING_PREVIEW_V0_1.md";
const briefingPreviewReportFile =
  "reports/2026-06-08-perspective-candidate-briefing-preview.md";
const briefingPreviewSmokeFile =
  "scripts/smoke-perspective-candidate-briefing-preview.mjs";
const userJudgmentDocFile =
  "docs/PERSPECTIVE_USER_JUDGMENT_CAPTURE_PACKET_V0_1.md";
const userJudgmentReportFile =
  "reports/2026-06-08-perspective-user-judgment-capture-packet.md";
const userJudgmentSmokeFile =
  "scripts/smoke-perspective-user-judgment-capture-packet.mjs";
const codexDraftDocFile =
  "docs/PERSPECTIVE_CODEX_NEXT_HANDOFF_DRAFT_PACKET_V0_1.md";
const codexDraftReportFile =
  "reports/2026-06-09-perspective-codex-next-handoff-draft-packet.md";
const codexDraftSmokeFile =
  "scripts/smoke-perspective-codex-next-handoff-draft-packet.mjs";
const dogfoodScriptFile =
  "scripts/dogfood-perspective-codex-next-handoff-draft.mjs";
const dogfoodSmokeFile =
  "scripts/smoke-perspective-codex-next-handoff-draft-dogfood.mjs";
const dogfoodDocFile =
  "docs/PERSPECTIVE_CODEX_NEXT_HANDOFF_DRAFT_DOGFOOD_V0_1.md";
const dogfoodReportFile =
  "reports/2026-06-09-perspective-codex-next-handoff-draft-dogfood.md";
const copyRefineReportFile =
  "reports/2026-06-09-perspective-codex-next-handoff-draft-copy-refine.md";
const scopeReadabilityDocFile =
  "docs/PERSPECTIVE_CODEX_HANDOFF_EXPECTED_FILE_SCOPE_READABILITY_V0_1.md";
const scopeReadabilityReportFile =
  "reports/2026-06-09-perspective-codex-handoff-expected-file-scope-readability.md";
const scopeReadabilitySmokeFile =
  "scripts/smoke-perspective-codex-handoff-expected-file-scope-readability.mjs";
const manualUsageDocFile =
  "docs/PERSPECTIVE_CODEX_HANDOFF_DRAFT_MANUAL_USAGE_NOTE_V0_1.md";
const manualUsageReportFile =
  "reports/2026-06-09-perspective-codex-handoff-draft-manual-usage-note.md";
const manualUsageSmokeFile =
  "scripts/smoke-perspective-codex-handoff-draft-manual-usage-note.mjs";
const workerGuidanceBuilderFile =
  "lib/perspective-ingest/perspective-worker-facing-guidance.ts";
const workerGuidanceDocFile =
  "docs/PERSPECTIVE_WORKER_FACING_GUIDANCE_V0_1.md";
const workerGuidanceReportFile =
  "reports/2026-06-09-perspective-worker-facing-guidance.md";
const workerGuidanceActionSpecificityReportFile =
  "reports/2026-06-09-perspective-worker-facing-guidance-action-specificity.md";
const workerGuidanceSmokeFile =
  "scripts/smoke-perspective-worker-facing-guidance.mjs";
const workerGuidanceLoopDogfoodScriptFile =
  "scripts/dogfood-perspective-worker-facing-guidance-loop.mjs";
const workerGuidanceLoopDogfoodSmokeFile =
  "scripts/smoke-perspective-worker-facing-guidance-loop-dogfood.mjs";
const workerGuidanceLoopDogfoodReportFile =
  "reports/dogfood/2026-06-09-perspective-worker-facing-guidance-loop.md";
const workerGuidanceLoopDogfoodDocFile =
  "docs/PERSPECTIVE_WORKER_FACING_GUIDANCE_DOGFOOD_V0_1.md";
const codexFormerInputPacketFile =
  "lib/perspective-ingest/perspective-codex-former-input-packet.ts";
const codexCandidateDraftPipelineFile =
  "lib/perspective-ingest/perspective-codex-candidate-draft-pipeline.ts";
const codexFormerPromptContractFile =
  "lib/perspective-ingest/perspective-codex-former-prompt-contract.ts";
const codexFormerPipelineDocFile =
  "docs/PERSPECTIVE_CODEX_FORMER_PIPELINE_V0_1.md";
const codexFormerPipelineReportFile =
  "reports/2026-06-09-perspective-codex-former-pipeline.md";
const codexFormerPipelineSmokeFile =
  "scripts/smoke-perspective-codex-former-pipeline.mjs";
const codexFormerDogfoodScriptFile =
  "scripts/dogfood-perspective-codex-former-pipeline.mjs";
const codexFormerDogfoodSmokeFile =
  "scripts/smoke-perspective-codex-former-pipeline-dogfood.mjs";
const codexFormerDogfoodDocFile =
  "docs/PERSPECTIVE_CODEX_FORMER_PIPELINE_DOGFOOD_V0_1.md";
const codexFormerDogfoodReportFile =
  "reports/dogfood/2026-06-09-perspective-codex-former-pipeline.md";
const codexFormerPromptContractDocFile =
  "docs/PERSPECTIVE_CODEX_FORMER_PROMPT_CONTRACT_V0_1.md";
const codexFormerPromptContractReportFile =
  "reports/2026-06-09-perspective-codex-former-prompt-contract.md";
const codexFormerPromptContractSmokeFile =
  "scripts/smoke-perspective-codex-former-prompt-contract.mjs";
const dogfoodArtifactFile =
  "reports/dogfood/2026-06-09-perspective-codex-next-handoff-draft-packet.md";
const laneDocFile = "docs/PERSPECTIVE_FORMATION_LANE_V0_1.md";
const inputBundleDocFile =
  "docs/PERSPECTIVE_FORMATION_INPUT_BUNDLE_BUILDER_V0_1.md";
const inputBundleSmokeFile =
  "scripts/smoke-perspective-formation-input-bundle-builder.mjs";
const laneSmokeFile = "scripts/smoke-perspective-formation-lane-v0-1.mjs";

const allowedChangedFiles = new Set([
  packageFile,
  candidateBuilderFile,
  briefingPreviewBuilderFile,
  userJudgmentBuilderFile,
  codexDraftBuilderFile,
  docFile,
  briefingPreviewDocFile,
  userJudgmentDocFile,
  codexDraftDocFile,
  dogfoodDocFile,
  reportFile,
  briefingPreviewReportFile,
  userJudgmentReportFile,
  codexDraftReportFile,
  dogfoodReportFile,
  copyRefineReportFile,
  scopeReadabilityDocFile,
  scopeReadabilityReportFile,
  scopeReadabilitySmokeFile,
  manualUsageDocFile,
  manualUsageReportFile,
  manualUsageSmokeFile,
  workerGuidanceBuilderFile,
  workerGuidanceDocFile,
  workerGuidanceReportFile,
  workerGuidanceActionSpecificityReportFile,
  workerGuidanceSmokeFile,
  workerGuidanceLoopDogfoodScriptFile,
  workerGuidanceLoopDogfoodSmokeFile,
  workerGuidanceLoopDogfoodReportFile,
  workerGuidanceLoopDogfoodDocFile,
  codexFormerInputPacketFile,
  codexCandidateDraftPipelineFile,
  codexFormerPromptContractFile,
  codexFormerPipelineDocFile,
  codexFormerPipelineReportFile,
  codexFormerPipelineSmokeFile,
  codexFormerDogfoodScriptFile,
  codexFormerDogfoodSmokeFile,
  codexFormerDogfoodDocFile,
  codexFormerDogfoodReportFile,
  codexFormerPromptContractDocFile,
  codexFormerPromptContractReportFile,
  codexFormerPromptContractSmokeFile,
  dogfoodArtifactFile,
  "docs/PERSPECTIVE_CODEX_HANDOFF_DRAFT_REAL_DOCS_TASK_EVAL_V0_1.md",
  "reports/2026-06-09-perspective-codex-handoff-draft-real-docs-task-eval.md",
  "scripts/smoke-perspective-codex-handoff-draft-real-docs-task-eval.mjs",
  smokeFile,
  briefingPreviewSmokeFile,
  userJudgmentSmokeFile,
  codexDraftSmokeFile,
  dogfoodScriptFile,
  dogfoodSmokeFile,
  laneDocFile,
  inputBundleDocFile,
  inputBundleSmokeFile,
  laneSmokeFile,
  "scripts/smoke-perspective-agent-brief-read-surface.mjs",
  "scripts/smoke-perspective-temporal-spatial-projection-builders.mjs",
]);

const packageJson = JSON.parse(readFileSync(packageFile, "utf8"));
const builderText = readFileSync(candidateBuilderFile, "utf8");
const docText = readFileSync(docFile, "utf8");
const reportText = readFileSync(reportFile, "utf8");
const laneDocText = readFileSync(laneDocFile, "utf8");
const inputBundleDocText = readFileSync(inputBundleDocFile, "utf8");

const { buildPerspectiveFormationInputBundle } = await import(
  "../lib/perspective-ingest/perspective-formation-input-bundle.ts"
);
const { buildPerspectiveCandidateFromFormationInputBundle } = await import(
  "../lib/perspective-ingest/perspective-candidate-builder.ts"
);

assert.equal(existsSync(candidateBuilderFile), true, `${candidateBuilderFile} must exist`);
assert.equal(existsSync(docFile), true, `${docFile} must exist`);
assert.equal(existsSync(reportFile), true, `${reportFile} must exist`);
assert.equal(existsSync(smokeFile), true, `${smokeFile} must exist`);

assert.equal(
  packageJson.scripts["smoke:perspective-candidate-builder-fixture"],
  "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json scripts/smoke-perspective-candidate-builder-fixture.mjs",
  "package.json must register smoke:perspective-candidate-builder-fixture",
);

assertBuilderSourceIsPureLocal();
assertDocsAndReport();
assertReadyCandidate();
assertEmptyPointerRefsAreOmitted();
assertFailedCheckCandidateNeedsReview();
assertGapCandidateNeedsReview();
assertPlaceholderSkippedCheckCandidateNeedsReview();
assertBlockedCandidate();
assertChangedFileBoundary();

console.log("PASS smoke:perspective-candidate-builder-fixture");

function assertReadyCandidate() {
  const bundle = buildPerspectiveFormationInputBundle({
    scope: "project:augnes",
    work_id: "AG-perspective-candidate-builder-fixture",
    source_pr_refs: ["pr:hynk-studio/augnes#464"],
    changed_files: [
      candidateBuilderFile,
      docFile,
    ],
    changed_files_summary:
      "Adds a deterministic pure local Perspective Candidate builder fixture.",
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
          "Browser validation skipped because this pure local builder has no UI or route changes.",
        result_summary: "No browser-facing behavior changed.",
      },
    ],
    evidence_row_refs: ["evidence:row:perspective-candidate-builder-smoke"],
    proof_only_action_refs: ["action:proof:perspective-candidate-builder-closeout"],
    work_event_refs: ["work:event:perspective-candidate-builder-implemented"],
    session_trace_refs: ["session:trace:perspective-candidate-builder-codex"],
    existing_perspective_refs: ["perspective:formation-lane:v0.1"],
    unresolved_gaps: [],
    authority_boundaries: [
      "pure local builder only",
      "no provider/model/API calls",
    ],
    source_privacy_redaction_notes: [
      "bounded summaries and pointer refs only",
      "raw/private payloads excluded",
    ],
    generated_at: "2026-06-08T00:00:00.000Z",
  });

  const candidate = buildPerspectiveCandidateFromFormationInputBundle(bundle);
  const repeated = buildPerspectiveCandidateFromFormationInputBundle(bundle);

  assert.equal(candidate.candidate_version, "perspective_candidate.v0.1");
  assert.equal(candidate.candidate_kind, "perspective_candidate");
  assert.equal(candidate.status, "perspective_candidate");
  assert.equal(candidate.authority, "non_committed");
  assert.equal(candidate.candidate_id, repeated.candidate_id);
  assert.equal(
    candidate.candidate_id.startsWith(
      "perspective-candidate:v0.1:project-augnes-ag-perspective-candidate-builder",
    ),
    true,
  );
  assert.deepEqual(candidate.source_bundle, {
    bundle_version: "perspective_formation_input_bundle.v0.1",
    scope: "project:augnes",
    work_id: "AG-perspective-candidate-builder-fixture",
    source_pr_refs: ["pr:hynk-studio/augnes#464"],
  });
  assert.deepEqual(candidate.selected_material.changed_files, [
    candidateBuilderFile,
    docFile,
  ]);
  assert.match(candidate.thesis, /deterministic pure local Perspective Candidate builder fixture/);
  assert.deepEqual(
    candidate.evidence_pointers.map((pointer) => pointer.pointer_kind),
    [
      "evidence_row_ref",
      "proof_only_action_ref",
      "work_event_ref",
      "session_trace_ref",
      "perspective_ref",
    ],
  );
  assert(
    candidate.evidence_pointers.every(
      (pointer) => pointer.pointer_semantics === "pointer_only",
    ),
    "all evidence pointers must be pointer-only refs",
  );
  assert.deepEqual(candidate.verification_summary.check_statuses, {
    passed: 1,
    failed: 0,
  });
  assert.equal(candidate.verification_summary.checks_run_count, 1);
  assert.deepEqual(candidate.verification_summary.skipped_checks, [
    {
      check_id: "check:browser",
      skipped_reason:
        "Browser validation skipped because this pure local builder has no UI or route changes.",
      result_summary: "No browser-facing behavior changed.",
    },
  ]);
  assert.deepEqual(candidate.basis_quality, {
    status: "sufficient_for_review",
    reasons: [],
  });
  assert.deepEqual(candidate.unresolved_tensions, []);
  assert.deepEqual(
    candidate.next_action_candidates.map((action) => action.action_id),
    ["review_candidate", "prepare_codex_handoff"],
  );
  assert.deepEqual(candidate.user_core_decision_questions, []);
  assertAuthority(candidate);
  assertNoForbiddenPayloadText("ready candidate", candidate);
}

function assertEmptyPointerRefsAreOmitted() {
  const bundle = buildPerspectiveFormationInputBundle({
    scope: "project:augnes",
    work_id: "AG-perspective-candidate-empty-pointer-refs",
    changed_files_summary:
      "Preserves upstream empty refs while omitting them from candidate pointers.",
    evidence_row_refs: ["", "evidence:row:valid"],
    proof_only_action_refs: ["   "],
    work_event_refs: ["work:event:valid"],
    session_trace_refs: [""],
    existing_perspective_refs: ["perspective:valid"],
  });

  assert.deepEqual(bundle.verification_basis.evidence_row_refs, [
    "",
    "evidence:row:valid",
  ]);
  assert.deepEqual(bundle.verification_basis.proof_only_action_refs, ["   "]);
  assert.deepEqual(bundle.trace_basis.work_event_refs, ["work:event:valid"]);
  assert.deepEqual(bundle.trace_basis.session_trace_refs, [""]);
  assert.deepEqual(bundle.perspective_basis.existing_perspective_refs, [
    "perspective:valid",
  ]);

  const candidate = buildPerspectiveCandidateFromFormationInputBundle(bundle);

  assert.deepEqual(
    candidate.evidence_pointers.map((pointer) => pointer.ref),
    [
      "evidence:row:valid",
      "work:event:valid",
      "perspective:valid",
    ],
  );
  assert.deepEqual(
    candidate.evidence_pointers.map((pointer) => pointer.pointer_kind),
    [
      "evidence_row_ref",
      "work_event_ref",
      "perspective_ref",
    ],
  );
  assert(
    candidate.evidence_pointers.every((pointer) => pointer.ref.trim() !== ""),
    "candidate evidence pointers must not include empty or whitespace refs",
  );
  assert.equal(
    candidate.evidence_pointers.some(
      (pointer) =>
        pointer.pointer_kind === "proof_only_action_ref" ||
        pointer.pointer_kind === "session_trace_ref",
    ),
    false,
    "empty proof and session refs must not produce candidate pointers",
  );
}

function assertFailedCheckCandidateNeedsReview() {
  const bundle = buildPerspectiveFormationInputBundle({
    scope: "project:augnes",
    work_id: "AG-perspective-candidate-failed-check",
    tests_checks_run: [
      {
        check_id: "check:smoke",
        command: "npm run smoke:perspective-candidate-builder-fixture",
        status: "failed",
        result_summary: "Fixture smoke failed before the review fix.",
      },
    ],
  });
  assert.equal(bundle.readiness.status, "ready_for_candidate");

  const candidate = buildPerspectiveCandidateFromFormationInputBundle(bundle);

  assert.equal(candidate.basis_quality.status, "needs_review");
  assert(candidate.basis_quality.reasons.includes("failed checks present"));
  assert.deepEqual(candidate.verification_summary.check_statuses, {
    passed: 0,
    failed: 1,
  });
  assert(
    candidate.unresolved_tensions.some(
      (tension) =>
        tension.tension_kind === "failed_check" &&
        tension.source_ref === "check:smoke",
    ),
    "failed checks must become unresolved tensions",
  );
  assert.deepEqual(
    candidate.next_action_candidates.map((action) => action.action_id),
    ["review_candidate", "fix_input_gaps"],
  );
}

function assertGapCandidateNeedsReview() {
  const bundle = buildPerspectiveFormationInputBundle({
    scope: "project:augnes",
    work_id: "AG-perspective-candidate-gap",
    tests_checks_run: [
      {
        check_id: "check:typecheck",
        command: "npm run typecheck",
        status: "passed",
        result_summary: "TypeScript completed without errors.",
      },
    ],
    unresolved_gaps: [
      {
        gap_id: "gap:evidence-row-missing",
        summary: "Evidence row recording was unavailable in this local run.",
      },
    ],
  });
  assert.equal(bundle.readiness.status, "needs_review");

  const candidate = buildPerspectiveCandidateFromFormationInputBundle(bundle);

  assert.equal(candidate.basis_quality.status, "needs_review");
  assert(candidate.basis_quality.reasons.includes("unresolved gaps present"));
  assert(
    candidate.unresolved_tensions.some(
      (tension) =>
        tension.tension_kind === "unresolved_gap" &&
        tension.source_ref === "gap:evidence-row-missing",
    ),
    "unresolved gaps must remain visible tensions",
  );
  assert(
    candidate.unresolved_tensions.some(
      (tension) =>
        tension.tension_kind === "readiness_reason" &&
        tension.summary === "unresolved gaps present",
    ),
    "bundle readiness reasons must remain visible on non-ready candidates",
  );
}

function assertPlaceholderSkippedCheckCandidateNeedsReview() {
  const bundle = buildPerspectiveFormationInputBundle({
    scope: "project:augnes",
    work_id: "AG-perspective-candidate-placeholder-skipped-check",
    skipped_checks: [
      {
        check_id: "browser",
        skipped_reason: "",
      },
    ],
  });

  const candidate = buildPerspectiveCandidateFromFormationInputBundle(bundle);

  assert.equal(candidate.basis_quality.status, "needs_review");
  assert(
    candidate.basis_quality.reasons.includes(
      "skipped checks missing concrete reasons",
    ),
  );
  assert(
    candidate.basis_quality.reasons.includes(
      "missing verification, proof, evidence, or skipped-check material",
    ),
  );
  assert.deepEqual(candidate.verification_summary.skipped_checks, [
    {
      check_id: "browser",
      skipped_reason: "",
    },
  ]);
  assert(
    candidate.unresolved_tensions.some(
      (tension) =>
        tension.tension_kind === "skipped_check_missing_reason" &&
        tension.source_ref === "browser",
    ),
    "placeholder skipped checks must become unresolved tensions",
  );
}

function assertBlockedCandidate() {
  const bundle = buildPerspectiveFormationInputBundle({
    work_id: "AG-perspective-candidate-missing-scope",
    skipped_checks: [
      {
        check_id: "check:runtime",
        skipped_reason: "local runtime unavailable",
      },
    ],
  });
  const candidate = buildPerspectiveCandidateFromFormationInputBundle(bundle);

  assert.equal(candidate.basis_quality.status, "blocked");
  assert.deepEqual(candidate.basis_quality.reasons, ["missing scope"]);
  assert(
    candidate.unresolved_tensions.some(
      (tension) =>
        tension.tension_kind === "readiness_reason" &&
        tension.summary === "missing scope",
    ),
    "blocked readiness reason must remain visible",
  );
}

function assertBuilderSourceIsPureLocal() {
  assertContainsAll(builderText, [
    "buildPerspectiveCandidateFromFormationInputBundle",
    "perspective_candidate.v0.1",
    "perspective_candidate",
    "non_committed",
    "pointer_only",
    "sufficient_for_review",
    "needs_review",
    "blocked",
    "raw_payloads_included: false",
    "provider_model_api_calls: false",
    "proof_evidence_readiness_writes: false",
    "codex_execution: false",
    "merge_publish_approval: false",
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
      `${candidateBuilderFile} must remain pure local and avoid ${forbiddenMarker}`,
    );
  }
}

function assertDocsAndReport() {
  assertContainsAll(docText, [
    "deterministic pure local builder fixture",
    "non-committed Perspective Candidate",
    "pointer-only evidence, proof, trace, and existing Perspective refs",
    "Empty pointer refs may be preserved upstream",
    "omitted from candidate `evidence_pointers`",
    "failed checks become unresolved tensions",
    "skipped checks without concrete reasons remain preserved",
    "does not read files",
    "does not read environment variables",
    "does not call `fetch`",
    "not committed state",
    "not proof",
    "not evidence",
    "not approval",
    "Consumed By",
    "Perspective Candidate briefing preview",
    "not briefing or approval by itself",
    "Add manual ChatGPT user judgment capture packet",
  ]);
  assertContainsAll(reportText, [
    "Summary",
    "Why This Follows PR #464",
    "Review Fix",
    "filters empty refs",
    "candidate pointer material",
    "Files Changed",
    "Authority Boundary",
    "Validation Plan",
    "What Is Not Implemented",
    "Add ChatGPT Perspective Candidate briefing preview",
  ]);
  assertContainsAll(laneDocText, [
    "PR C: deterministic perspective candidate builder fixture",
    "implemented as a pure local builder fixture",
    "PR D: ChatGPT briefing surface preview",
  ]);
  assertContainsAll(inputBundleDocText, [
    "Perspective Candidate builder fixture",
    "Formation Input Bundle remains read-only input material",
  ]);
}

function assertAuthority(candidate) {
  assert.deepEqual(candidate.authority_flags, {
    committed_state: false,
    persistence: false,
    provider_model_api_calls: false,
    proof_evidence_readiness_writes: false,
    codex_execution: false,
    merge_publish_approval: false,
  });
  assert.deepEqual(candidate.privacy, {
    raw_payloads_included: false,
  });
  assert.deepEqual(candidate.forbidden_actions, [
    "no commit/reject state",
    "no proof/evidence/readiness writes",
    "no merge/publish/approval",
    "no Codex execution",
    "no provider/model/API calls",
    "no persistence",
  ]);
}

function assertNoForbiddenPayloadText(label, value) {
  const serialized = JSON.stringify(value);
  for (const forbiddenMarker of [
    "raw_pasted_text",
    "raw_source_payload",
    "raw_candidate_payload",
    "private_payload",
    "provider_payload",
    "oauth_token",
    "api_key",
    "billing_payload",
    "hidden_reasoning",
    "generated_model_payload",
    "secret",
  ]) {
    assert.equal(
      serialized.includes(forbiddenMarker),
      false,
      `${label} must not include raw/private marker field: ${forbiddenMarker}`,
    );
  }
}

function assertChangedFileBoundary() {
  for (const changedFile of collectChangedFiles()) {
    assert(
      allowedChangedFiles.has(changedFile),
      `Perspective Candidate builder fixture changed an out-of-scope file: ${changedFile}`,
    );
    assert(
      !changedFile.startsWith("app/api/") &&
        !changedFile.startsWith("components/") &&
        changedFile !== "app/globals.css" &&
        (!changedFile.startsWith("lib/") ||
          changedFile === candidateBuilderFile ||
          changedFile === briefingPreviewBuilderFile ||
          changedFile === userJudgmentBuilderFile ||
          changedFile === codexDraftBuilderFile ||
          changedFile === workerGuidanceBuilderFile ||
          changedFile === codexFormerInputPacketFile ||
          changedFile === codexCandidateDraftPipelineFile ||
          changedFile === codexFormerPromptContractFile) &&
        !changedFile.startsWith("db/") &&
        !changedFile.startsWith("migrations/") &&
        !changedFile.startsWith("fixtures/") &&
        !changedFile.startsWith("types/") &&
        !changedFile.includes("provider") &&
        !changedFile.includes("oauth") &&
        !changedFile.includes("codex-sdk") &&
        !changedFile.includes("graph-db") &&
        !changedFile.includes("persistence"),
      `Perspective Candidate builder fixture must not change forbidden surfaces: ${changedFile}`,
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
      "Perspective Candidate builder fixture smoke collected no changed files",
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
    "Unable to collect base diff for Perspective Candidate builder fixture smoke",
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
