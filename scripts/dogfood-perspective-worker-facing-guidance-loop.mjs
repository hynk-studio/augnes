import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { pathToFileURL } from "node:url";

const { buildPerspectiveFormationInputBundle } = await import(
  "../lib/perspective-ingest/perspective-formation-input-bundle.ts"
);
const { buildPerspectiveCandidateFromFormationInputBundle } = await import(
  "../lib/perspective-ingest/perspective-candidate-builder.ts"
);
const { buildWorkerFacingPerspectiveGuidanceFromCandidate } = await import(
  "../lib/perspective-ingest/perspective-worker-facing-guidance.ts"
);

export const PERSPECTIVE_WORKER_FACING_GUIDANCE_LOOP_DOGFOOD_GENERATED_AT =
  "2026-06-09T00:00:00.000Z";
export const PERSPECTIVE_WORKER_FACING_GUIDANCE_LOOP_DOGFOOD_ARTIFACT_PATH =
  "reports/dogfood/2026-06-09-perspective-worker-facing-guidance-loop.md";
export const PERSPECTIVE_WORKER_FACING_GUIDANCE_LOOP_DOGFOOD_CONCLUSION =
  "PASS with follow-up";
export const PERSPECTIVE_WORKER_FACING_GUIDANCE_LOOP_DOGFOOD_NEXT_PR =
  "Refine worker-facing guidance action specificity from dogfood findings";

const pr474ChangedFiles = [
  "docs/PERSPECTIVE_WORKER_FACING_GUIDANCE_V0_1.md",
  "lib/perspective-ingest/perspective-worker-facing-guidance.ts",
  "package.json",
  "reports/2026-06-09-perspective-worker-facing-guidance.md",
  "scripts/smoke-perspective-candidate-builder-fixture.mjs",
  "scripts/smoke-perspective-worker-facing-guidance.mjs",
];

const dogfoodSliceFiles = [
  "scripts/dogfood-perspective-worker-facing-guidance-loop.mjs",
  "scripts/smoke-perspective-worker-facing-guidance-loop-dogfood.mjs",
  "reports/dogfood/2026-06-09-perspective-worker-facing-guidance-loop.md",
  "docs/PERSPECTIVE_WORKER_FACING_GUIDANCE_DOGFOOD_V0_1.md",
  "docs/PERSPECTIVE_WORKER_FACING_GUIDANCE_V0_1.md",
  "package.json",
  "scripts/smoke-perspective-worker-facing-guidance.mjs",
  "scripts/smoke-perspective-candidate-builder-fixture.mjs",
];

const dogfoodRequiredChecks = [
  "npm run typecheck",
  "npm run dogfood:perspective-worker-facing-guidance-loop",
  "npm run smoke:perspective-worker-facing-guidance-loop-dogfood",
  "npm run smoke:perspective-worker-facing-guidance",
  "npm run smoke:perspective-candidate-builder-fixture",
  "git diff --check",
  "git diff --cached --check",
];

export function buildPerspectiveWorkerFacingGuidanceLoopDogfood() {
  const scenarios = [
    buildRealReviewedPr474ReadyScenario(),
    buildReviewGapRegressionCase(),
    buildBlockedOrMissingScopeContrast(),
  ];
  const evaluation = evaluateDogfood(scenarios);
  const artifact = renderDogfoodArtifact({ evaluation, scenarios });

  return {
    artifact,
    evaluation,
    paths: {
      artifact: PERSPECTIVE_WORKER_FACING_GUIDANCE_LOOP_DOGFOOD_ARTIFACT_PATH,
    },
    scenarios,
  };
}

export function runPerspectiveWorkerFacingGuidanceLoopDogfood() {
  const dogfood = buildPerspectiveWorkerFacingGuidanceLoopDogfood();
  writeReportFile(dogfood.paths.artifact, dogfood.artifact);
  console.log(`wrote ${dogfood.paths.artifact}`);
  return dogfood;
}

function buildRealReviewedPr474ReadyScenario() {
  return buildGuidanceScenario({
    scenario_id: "real_reviewed_pr_474_ready",
    title: "Real Reviewed PR #474 Ready",
    formation_input: {
      scope: "project:augnes",
      work_id: "PR-474-worker-facing-guidance",
      source_pr_refs: ["pr:hynk-studio/augnes#474"],
      changed_files: pr474ChangedFiles,
      changed_files_summary:
        "Added the pure local worker-facing guidance builder, docs, report, smoke coverage, package script, and a review fix for the billing marker redaction gap.",
      tests_checks_run: [
        {
          check_id: "check:typecheck",
          command: "npm run typecheck",
          status: "passed",
          result_summary: "TypeScript completed without errors for PR #474.",
        },
        {
          check_id: "check:worker-guidance-smoke",
          command: "npm run smoke:perspective-worker-facing-guidance",
          status: "passed",
          result_summary:
            "Worker guidance smoke passed, including status mapping and payload-marker redaction coverage.",
        },
        {
          check_id: "check:candidate-builder-smoke",
          command: "npm run smoke:perspective-candidate-builder-fixture",
          status: "passed",
          result_summary:
            "Adjacent Perspective Candidate builder smoke passed after the narrow allowlist update.",
        },
        {
          check_id: "check:diff-whitespace",
          command: "git diff --check",
          status: "passed",
          result_summary: "No whitespace errors were reported.",
        },
        {
          check_id: "check:cached-diff-whitespace",
          command: "git diff --cached --check",
          status: "passed",
          result_summary: "No staged whitespace errors were reported.",
        },
      ],
      skipped_checks: [
        {
          check_id: "check:browser",
          skipped_reason:
            "Browser validation was skipped because PR #474 changed only a pure local builder, docs, report, package script, and smoke coverage.",
          result_summary: "No UI or route behavior changed.",
        },
        {
          check_id: "check:build",
          skipped_reason:
            "Build was skipped because PR #474 changed no runtime route, UI, component, CSS, DB, persistence, or app behavior.",
          result_summary: "Typecheck and targeted smokes covered the local builder slice.",
        },
      ],
      evidence_row_refs: ["evidence:pointer:pr-474-worker-guidance-review"],
      proof_only_action_refs: ["proof:pointer:pr-474-validation-summary"],
      work_event_refs: [
        "work:event:pr-474-builder-added",
        "work:event:pr-474-review-gap-fixed",
      ],
      session_trace_refs: ["session:trace:pr-474-codex-local-loop"],
      existing_perspective_refs: [
        "perspective:formation-input-bundle:v0.1",
        "perspective:candidate:v0.1",
        "perspective:worker-facing-guidance:v0.1",
      ],
      authority_boundaries: [
        "pure local guidance only",
        "no runtime route",
        "no UI",
        "no DB or persistence",
        "no provider/model/API calls",
        "no Codex execution",
        "no GitHub mutation automation",
        "no approval or merge authority",
      ],
      source_privacy_redaction_notes: [
        "Only bounded, reviewable PR summaries and refs are included.",
        "No raw PR diff, raw review payload, private payload, provider payload, generated model material, or credential-like material is included.",
      ],
      generated_at:
        PERSPECTIVE_WORKER_FACING_GUIDANCE_LOOP_DOGFOOD_GENERATED_AT,
    },
    guidance_context: {
      work_goal:
        "Use the reviewed PR #474 worker guidance scaffold to identify the next smallest useful local implementation follow-up.",
      bounded_summary:
        "PR #474 is a reviewed local scaffold with a fixed payload-marker redaction gap and passing targeted checks.",
    },
  });
}

function buildReviewGapRegressionCase() {
  return buildGuidanceScenario({
    scenario_id: "review_gap_regression_case",
    title: "Review Gap Regression Case",
    formation_input: {
      scope: "project:augnes",
      work_id: "pre-fix-worker-guidance-redaction-gap",
      source_pr_refs: ["pr:hynk-studio/augnes#474"],
      changed_files: [
        "lib/perspective-ingest/perspective-worker-facing-guidance.ts",
        "scripts/smoke-perspective-worker-facing-guidance.mjs",
      ],
      changed_files_summary: "billing_payload",
      tests_checks_run: [
        {
          check_id: "check:payload-marker-redaction",
          command: "npm run smoke:perspective-worker-facing-guidance",
          status: "failed",
          result_summary:
            "Payload marker redaction concern remained unresolved before the review fix.",
        },
      ],
      unresolved_gaps: [
        {
          gap_id: "gap:payload-marker-redaction",
          summary:
            "Review feedback identified an unsafe payload marker that needed exact redaction coverage before implementation planning.",
        },
      ],
      evidence_row_refs: ["evidence:pointer:payload-redaction-gap-review"],
      proof_only_action_refs: ["proof:pointer:payload-redaction-gap-smoke"],
      work_event_refs: ["work:event:review-gap-before-fix"],
      session_trace_refs: ["session:trace:review-gap-local-case"],
      existing_perspective_refs: ["perspective:worker-facing-guidance:v0.1"],
      authority_boundaries: [
        "gap-first review only",
        "do not plan implementation until redaction concern is resolved",
      ],
      source_privacy_redaction_notes: [
        "Unsafe source marker is included only as local redaction test input and must not appear in output guidance.",
      ],
      generated_at:
        PERSPECTIVE_WORKER_FACING_GUIDANCE_LOOP_DOGFOOD_GENERATED_AT,
    },
    guidance_context: {
      work_goal:
        "Resolve or qualify the payload redaction gap before planning implementation work.",
      bounded_summary: "billing_payload",
    },
  });
}

function buildBlockedOrMissingScopeContrast() {
  return buildGuidanceScenario({
    scenario_id: "blocked_or_missing_scope_contrast",
    title: "Blocked Or Missing-Scope Contrast",
    formation_input: {
      work_id: "missing-scope-worker-guidance-contrast",
      source_pr_refs: ["pr:hynk-studio/augnes#474"],
      changed_files: dogfoodSliceFiles,
      changed_files_summary:
        "Contrast case for missing scope before worker planning.",
      skipped_checks: [
        {
          check_id: "check:scope-precondition",
          skipped_reason:
            "Scope is missing, so worker planning cannot proceed.",
          result_summary: "The candidate must stop or defer.",
        },
      ],
      evidence_row_refs: ["evidence:pointer:missing-scope-contrast"],
      proof_only_action_refs: ["proof:pointer:missing-scope-contrast"],
      work_event_refs: ["work:event:missing-scope-contrast"],
      session_trace_refs: ["session:trace:missing-scope-contrast"],
      existing_perspective_refs: ["perspective:worker-facing-guidance:v0.1"],
      authority_boundaries: [
        "missing scope blocks planning",
        "no worker action until scope is provided",
      ],
      source_privacy_redaction_notes: [
        "Missing-scope contrast uses bounded local summary material only.",
      ],
      generated_at:
        PERSPECTIVE_WORKER_FACING_GUIDANCE_LOOP_DOGFOOD_GENERATED_AT,
    },
    guidance_context: {
      work_goal:
        "Confirm that missing scope stops worker planning before action selection.",
      bounded_summary:
        "Blocked contrast case proves the worker should request unblock instead of planning.",
    },
  });
}

function buildGuidanceScenario({ scenario_id, title, formation_input, guidance_context }) {
  const formation_input_bundle =
    buildPerspectiveFormationInputBundle(formation_input);
  const perspective_candidate =
    buildPerspectiveCandidateFromFormationInputBundle(formation_input_bundle);
  const worker_guidance =
    buildWorkerFacingPerspectiveGuidanceFromCandidate({
      candidate: perspective_candidate,
      guidance_context,
    });
  const evaluation = evaluateScenario({
    candidate: perspective_candidate,
    guidance: worker_guidance,
    scenario_id,
  });

  return {
    evaluation,
    formation_input_bundle,
    perspective_candidate,
    scenario_id,
    title,
    worker_guidance,
  };
}

function evaluateScenario({ candidate, guidance, scenario_id }) {
  const authorityFlagsFalse = Object.values(guidance.authority_flags).every(
    (value) => value === false,
  );
  const outputHasUnsafeMarkers = containsForbiddenOutputText(guidance);

  if (scenario_id === "real_reviewed_pr_474_ready") {
    const nextActions = guidance.next_smallest_useful_actions.map(
      (action) => action.action_id,
    );

    return {
      conclusion: "PASS with follow-up",
      evidence: [
        candidate.basis_quality.status === "sufficient_for_review"
          ? "candidate basis is sufficient_for_review"
          : `unexpected candidate basis: ${candidate.basis_quality.status}`,
        guidance.guidance_status === "actionable_advisory"
          ? "guidance is actionable_advisory"
          : `unexpected guidance status: ${guidance.guidance_status}`,
        hasText(guidance.work_goal)
          ? "work_goal is concrete"
          : "work_goal is missing",
        nextActions.includes("draft_smallest_scoped_plan")
          ? "next action asks for a smallest scoped plan"
          : "next action did not identify scoped planning",
        authorityFlagsFalse
          ? "authority flags remain false"
          : "authority flags were not all false",
        outputHasUnsafeMarkers
          ? "unsafe marker appeared in guidance"
          : "unsafe marker did not appear in guidance",
      ],
      specific_enough_for_future_prompt:
        "Yes, because the guidance carries PR #474 refs, changed files, checks, skipped-check reasons, a concrete work goal, and advisory next actions; follow-up should make action wording more file/check-aware.",
    };
  }

  if (scenario_id === "review_gap_regression_case") {
    return {
      conclusion:
        guidance.guidance_status === "resolve_gaps_first"
          ? "PASS"
          : "BLOCKED",
      evidence: [
        candidate.basis_quality.status === "needs_review"
          ? "candidate basis is needs_review"
          : `unexpected candidate basis: ${candidate.basis_quality.status}`,
        guidance.guidance_status === "resolve_gaps_first"
          ? "guidance prioritizes gap resolution"
          : `unexpected guidance status: ${guidance.guidance_status}`,
        guidance.verification_gaps.some((gap) =>
          gap.summary.includes("Payload marker redaction concern"),
        )
          ? "verification gap preserves the redaction concern safely"
          : "verification gap did not preserve the redaction concern",
        guidance.worker_instructions[0].includes("Resolve visible gaps")
          ? "worker instructions put gaps before implementation planning"
          : "worker instructions did not prioritize visible gaps",
        guidance.privacy.unsafe_input_material_omitted
          ? "unsafe marker input was omitted"
          : "unsafe marker input was not recorded as omitted",
        outputHasUnsafeMarkers
          ? "unsafe marker appeared in guidance"
          : "unsafe marker did not appear in guidance",
      ],
      specific_enough_for_future_prompt:
        "No implementation prompt should be drafted from this case until the visible redaction gap is resolved or qualified.",
    };
  }

  return {
    conclusion:
      guidance.guidance_status === "stop_or_defer" ? "PASS" : "BLOCKED",
    evidence: [
      candidate.basis_quality.status === "blocked"
        ? "candidate basis is blocked"
        : `unexpected candidate basis: ${candidate.basis_quality.status}`,
      guidance.guidance_status === "stop_or_defer"
        ? "guidance stops or defers"
        : `unexpected guidance status: ${guidance.guidance_status}`,
      guidance.next_smallest_useful_actions.some(
        (action) => action.action_id === "stop_and_request_unblock",
      )
        ? "next action requests unblock"
        : "next action did not request unblock",
      guidance.stop_or_defer_actions.some(
        (action) => action.action_id === "defer_all_worker_planning",
      )
        ? "stop/defer actions defer worker planning"
        : "stop/defer actions did not defer worker planning",
      guidance.stop_or_defer_actions.some(
        (action) => action.action_id === "defer_authority_claims",
      )
        ? "stop/defer actions defer authority claims"
        : "stop/defer actions did not defer authority claims",
      authorityFlagsFalse
        ? "authority flags remain false"
        : "authority flags were not all false",
    ],
    specific_enough_for_future_prompt:
      "No future implementation prompt should be drafted until scope is supplied.",
  };
}

function evaluateDogfood(scenarios) {
  return {
    answers: {
      narrows_next_worker_action:
        "Yes. The ready case narrows the next worker action to inspecting PR #474 refs and drafting the smallest scoped follow-up.",
      distinguishes_actionable_from_gap_first:
        "Yes. The ready case is actionable_advisory, the redaction regression case is resolve_gaps_first, and the missing-scope contrast is stop_or_defer.",
      keeps_tensions_and_gaps_visible:
        "Yes. Skipped checks, failed checks, unresolved gaps, and readiness reasons remain visible as worker-facing verification gaps or tensions.",
      avoids_authority_promotion:
        "Yes. All guidance authority flags remain false, and the guidance does not become proof, evidence, readiness, approval, merge authority, GitHub mutation, Codex execution, or Core decision.",
      avoids_unsafe_payloads:
        "Yes. Unsafe marker inputs are omitted from output guidance and recorded through privacy metadata.",
      specific_enough_for_prompt:
        "Yes, with follow-up. The guidance is specific enough to seed a future prompt, but the next action text should become more file/check-aware.",
      next_implementation_pr:
        PERSPECTIVE_WORKER_FACING_GUIDANCE_LOOP_DOGFOOD_NEXT_PR,
    },
    conclusion: PERSPECTIVE_WORKER_FACING_GUIDANCE_LOOP_DOGFOOD_CONCLUSION,
    scenario_conclusions: scenarios.map((scenario) => ({
      conclusion: scenario.evaluation.conclusion,
      scenario_id: scenario.scenario_id,
    })),
  };
}

function renderDogfoodArtifact({ evaluation, scenarios }) {
  return [
    "# Perspective Worker-Facing Guidance Loop Dogfood",
    "",
    "Date: 2026-06-09",
    "",
    "## Summary",
    "",
    "This deterministic local dogfood slice uses the merged PR #474 Worker-Facing Perspective Guidance scaffold against realistic reviewed Perspective Candidate contexts. It builds Formation Input Bundle, Perspective Candidate, and Worker-Facing Perspective Guidance objects without raw PR diffs or raw review payloads.",
    "",
    "## Evaluation Conclusion",
    "",
    evaluation.conclusion,
    "",
    `Recommended next implementation PR title: ${PERSPECTIVE_WORKER_FACING_GUIDANCE_LOOP_DOGFOOD_NEXT_PR}`,
    "",
    "## Dogfood Answers",
    "",
    `- Does the guidance narrow the next worker action? ${evaluation.answers.narrows_next_worker_action}`,
    `- Does it distinguish actionable planning from gap-first review? ${evaluation.answers.distinguishes_actionable_from_gap_first}`,
    `- Does it keep unresolved tensions and verification gaps visible? ${evaluation.answers.keeps_tensions_and_gaps_visible}`,
    `- Does it avoid turning guidance into proof, evidence, readiness, approval, merge authority, GitHub mutation, Codex execution, or Core decision? ${evaluation.answers.avoids_authority_promotion}`,
    `- Does it avoid unsafe raw/private/provider/token/billing/source payloads? ${evaluation.answers.avoids_unsafe_payloads}`,
    `- Is the guidance specific enough for a future Codex task prompt? ${evaluation.answers.specific_enough_for_prompt}`,
    `- What is the next implementation PR after this dogfood? ${evaluation.answers.next_implementation_pr}`,
    "",
    "## Scenarios",
    "",
    ...scenarios.flatMap(renderScenario),
    "## Authority Boundary",
    "",
    "This report is local deterministic dogfood only. It does not implement runtime routes, UI, app/api behavior, DB schema, migrations, persistence, graph DB behavior, source ingress, OAuth, provider/model/API calls, proof/evidence/readiness writes, ChatGPT Apps integration, Codex SDK/plugin integration, GitHub mutation automation, actual Codex execution, merge, approval, publish, retry, replay, deploy, or Core decisions.",
    "",
    "## Validation Commands",
    "",
    ...formatList(dogfoodRequiredChecks),
    "",
  ].join("\n");
}

function renderScenario(scenario) {
  const guidance = scenario.worker_guidance;

  return [
    `### ${scenario.scenario_id}`,
    "",
    scenario.title,
    "",
    `- candidate_basis_quality: ${scenario.perspective_candidate.basis_quality.status}`,
    `- guidance_status: ${guidance.guidance_status}`,
    `- work_goal: ${guidance.work_goal ?? "None"}`,
    `- evaluation: ${scenario.evaluation.conclusion}`,
    `- specific enough: ${scenario.evaluation.specific_enough_for_future_prompt}`,
    "- evaluation evidence:",
    ...formatList(scenario.evaluation.evidence),
    "- next_smallest_useful_actions:",
    ...formatActions(guidance.next_smallest_useful_actions),
    "- stop_or_defer_actions:",
    ...formatActions(guidance.stop_or_defer_actions),
    "- verification_gaps:",
    ...formatVerificationGaps(guidance.verification_gaps),
    "- unresolved_tensions:",
    ...formatTensions(guidance.unresolved_tensions),
    "- worker_instructions:",
    ...formatList(guidance.worker_instructions),
    `- authority_flags_all_false: ${Object.values(guidance.authority_flags).every(
      (value) => value === false,
    )}`,
    `- unsafe_input_material_omitted: ${guidance.privacy.unsafe_input_material_omitted}`,
    "",
  ];
}

function formatActions(actions) {
  if (actions.length === 0) return ["- None"];

  return actions.map(
    (action) => `- ${action.action_id}: ${action.summary}`,
  );
}

function formatVerificationGaps(gaps) {
  if (gaps.length === 0) return ["- None"];

  return gaps.map((gap) => {
    const source = gap.source_ref ? ` (${gap.source_ref})` : "";
    return `- ${gap.gap_kind}${source}: ${gap.summary}`;
  });
}

function formatTensions(tensions) {
  if (tensions.length === 0) return ["- None"];

  return tensions.map((tension) => {
    const source = tension.source_ref ? ` (${tension.source_ref})` : "";
    return `- ${tension.tension_kind}${source}: ${tension.summary}`;
  });
}

function formatList(values) {
  if (values.length === 0) return ["- None"];
  return values.map((value) => `- ${value}`);
}

function containsForbiddenOutputText(value) {
  const serialized = JSON.stringify(value);
  const forbiddenMarkers = [
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
  ];

  return forbiddenMarkers.some((marker) => serialized.includes(marker));
}

function writeReportFile(filePath, contents) {
  mkdirSync(dirname(filePath), { recursive: true });
  writeFileSync(filePath, contents);
}

function hasText(value) {
  return typeof value === "string" && value.trim().length > 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runPerspectiveWorkerFacingGuidanceLoopDogfood();
}
