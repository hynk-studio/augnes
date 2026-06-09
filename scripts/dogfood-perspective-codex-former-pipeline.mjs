import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { pathToFileURL } from "node:url";

const { buildPerspectiveFormationInputBundle } = await import(
  "../lib/perspective-ingest/perspective-formation-input-bundle.ts"
);
const { buildCodexPerspectiveFormerInputPacket } = await import(
  "../lib/perspective-ingest/perspective-codex-former-input-packet.ts"
);
const { validateAndNormalizeCodexPerspectiveCandidateDraft } = await import(
  "../lib/perspective-ingest/perspective-codex-candidate-draft-pipeline.ts"
);
const { buildWorkerFacingPerspectiveGuidanceFromCandidate } = await import(
  "../lib/perspective-ingest/perspective-worker-facing-guidance.ts"
);

export const PERSPECTIVE_CODEX_FORMER_PIPELINE_DOGFOOD_GENERATED_AT =
  "2026-06-09T00:00:00.000Z";
export const PERSPECTIVE_CODEX_FORMER_PIPELINE_DOGFOOD_ARTIFACT_PATH =
  "reports/dogfood/2026-06-09-perspective-codex-former-pipeline.md";
export const PERSPECTIVE_CODEX_FORMER_PIPELINE_DOGFOOD_NEXT_PR =
  "Refine Codex perspective former draft prompt contract from dogfood findings";

const pr477ChangedFiles = [
  "docs/PERSPECTIVE_CODEX_FORMER_PIPELINE_V0_1.md",
  "lib/perspective-ingest/perspective-codex-candidate-draft-pipeline.ts",
  "lib/perspective-ingest/perspective-codex-former-input-packet.ts",
  "package.json",
  "reports/2026-06-09-perspective-codex-former-pipeline.md",
  "scripts/smoke-perspective-candidate-builder-fixture.mjs",
  "scripts/smoke-perspective-codex-former-pipeline.mjs",
  "scripts/smoke-perspective-worker-facing-guidance.mjs",
];

const pr476ChangedFiles = [
  "docs/PERSPECTIVE_WORKER_FACING_GUIDANCE_DOGFOOD_V0_1.md",
  "docs/PERSPECTIVE_WORKER_FACING_GUIDANCE_V0_1.md",
  "lib/perspective-ingest/perspective-worker-facing-guidance.ts",
  "package.json",
  "reports/2026-06-09-perspective-worker-facing-guidance-action-specificity.md",
  "reports/dogfood/2026-06-09-perspective-worker-facing-guidance-loop.md",
  "scripts/dogfood-perspective-worker-facing-guidance-loop.mjs",
  "scripts/smoke-perspective-candidate-builder-fixture.mjs",
  "scripts/smoke-perspective-worker-facing-guidance-loop-dogfood.mjs",
  "scripts/smoke-perspective-worker-facing-guidance.mjs",
];

const dogfoodSliceFiles = [
  "docs/PERSPECTIVE_CODEX_FORMER_PIPELINE_DOGFOOD_V0_1.md",
  "docs/PERSPECTIVE_CODEX_FORMER_PIPELINE_V0_1.md",
  "package.json",
  "reports/dogfood/2026-06-09-perspective-codex-former-pipeline.md",
  "scripts/dogfood-perspective-codex-former-pipeline.mjs",
  "scripts/smoke-perspective-candidate-builder-fixture.mjs",
  "scripts/smoke-perspective-codex-former-pipeline-dogfood.mjs",
  "scripts/smoke-perspective-codex-former-pipeline.mjs",
  "scripts/smoke-perspective-worker-facing-guidance.mjs",
];

const dogfoodRequiredChecks = [
  "npm run typecheck",
  "npm run dogfood:perspective-codex-former-pipeline",
  "npm run smoke:perspective-codex-former-pipeline-dogfood",
  "npm run smoke:perspective-codex-former-pipeline",
  "npm run smoke:perspective-worker-facing-guidance",
  "npm run smoke:perspective-candidate-builder-fixture",
  "git diff --check",
  "git diff --cached --check",
];

export function buildPerspectiveCodexFormerPipelineDogfood() {
  const readyScenario = buildReviewedPr477ReadyDraftScenario();
  const contrastScenario = buildReviewedPr476ContextContrastScenario();
  const regressionScenario = buildMalformedOrAuthorityRegressionScenario();
  const scenarios = [readyScenario, contrastScenario, regressionScenario];
  const evaluation = evaluateDogfood({
    readyScenario,
    contrastScenario,
    regressionScenario,
  });
  const artifact = renderDogfoodArtifact({ evaluation, scenarios });

  return {
    artifact,
    evaluation,
    paths: {
      artifact: PERSPECTIVE_CODEX_FORMER_PIPELINE_DOGFOOD_ARTIFACT_PATH,
    },
    scenarios,
  };
}

export function runPerspectiveCodexFormerPipelineDogfood() {
  const dogfood = buildPerspectiveCodexFormerPipelineDogfood();
  writeReportFile(dogfood.paths.artifact, dogfood.artifact);
  console.log(`wrote ${dogfood.paths.artifact}`);
  return dogfood;
}

export function deriveDogfoodConclusion(scenarioConclusions) {
  const conclusions = scenarioConclusions.map((entry) =>
    typeof entry === "string" ? entry : entry.conclusion,
  );

  if (conclusions.includes("BLOCKED")) return "BLOCKED";
  if (conclusions.includes("PASS with follow-up")) {
    return "PASS with follow-up";
  }

  return "PASS";
}

function buildReviewedPr477ReadyDraftScenario() {
  const formationInputBundle = buildPerspectiveFormationInputBundle({
    scope: "project:augnes",
    work_id: "PR-477-codex-former-pipeline-scaffold",
    source_pr_refs: ["pr:hynk-studio/augnes#477"],
    changed_files: pr477ChangedFiles,
    changed_files_summary:
      "Added the pure local Codex perspective former input packet, model-shaped draft validator, candidate-compatible normalization path, docs, report, package script, and malformed-draft runtime-shape review fix.",
    tests_checks_run: [
      {
        check_id: "check:typecheck",
        command: "npm run typecheck",
        status: "passed",
        result_summary: "TypeScript completed without errors for PR #477.",
      },
      {
        check_id: "check:former-pipeline-smoke",
        command: "npm run smoke:perspective-codex-former-pipeline",
        status: "passed",
        result_summary:
          "Former pipeline smoke passed, including ready, needs-review, unsafe, authority, malformed-shape, and downstream guidance compatibility fixtures.",
      },
      {
        check_id: "check:worker-guidance-smoke",
        command: "npm run smoke:perspective-worker-facing-guidance",
        status: "passed",
        result_summary:
          "Worker-facing guidance smoke passed after narrow allowlist updates.",
      },
      {
        check_id: "check:candidate-builder-smoke",
        command: "npm run smoke:perspective-candidate-builder-fixture",
        status: "passed",
        result_summary:
          "Perspective Candidate builder smoke passed after narrow allowlist updates.",
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
          "Browser validation was skipped because PR #477 changed only pure local library, docs, report, package script, and smoke surfaces.",
        result_summary: "No runtime route or UI behavior changed.",
      },
      {
        check_id: "check:db",
        skipped_reason:
          "DB validation was skipped because PR #477 did not read or write DB state, schema, migrations, or persistence.",
        result_summary: "No DB-facing behavior changed.",
      },
      {
        check_id: "check:network-api",
        skipped_reason:
          "Network/API validation was skipped because PR #477 did not call Codex, provider/model APIs, GitHub APIs from implementation, or other network services.",
        result_summary: "The scaffold remained pure local.",
      },
    ],
    evidence_row_refs: ["pointer:reviewed-pr-477-validation-summary"],
    proof_only_action_refs: ["pointer:reviewed-pr-477-review-fix-summary"],
    work_event_refs: [
      "work:event:pr-477-scaffold-added",
      "work:event:pr-477-malformed-draft-review-fix",
    ],
    session_trace_refs: ["session:trace:pr-477-local-codex-review"],
    existing_perspective_refs: [
      "perspective:codex-former-pipeline:v0.1",
      "perspective:worker-facing-guidance:v0.1",
    ],
    authority_boundaries: [
      "pure local pipeline only",
      "model-shaped draft is draft/review material only",
      "no runtime route",
      "no UI",
      "no DB or persistence",
      "no provider/model/API calls",
      "no GitHub API calls from implementation",
      "no Codex execution",
      "no proof/evidence/readiness writes",
      "no approval or merge authority",
      "no Core decision",
    ],
    source_privacy_redaction_notes: [
      "Only bounded reviewed PR summaries, refs, changed-file lists, validation summaries, skipped-check reasons, and authority summaries are included.",
      "No raw PR diff, raw review payload, private payload, provider payload, generated raw model material, or credential-like material is included.",
    ],
    generated_at: PERSPECTIVE_CODEX_FORMER_PIPELINE_DOGFOOD_GENERATED_AT,
  });
  const formerInputPacket =
    buildCodexPerspectiveFormerInputPacket(formationInputBundle);
  const draft = buildModelShapedDraftFromPacket(formerInputPacket, {
    thesis:
      "PR #477 is not just a local scaffold; its useful perspective is that a former draft becomes valuable only when malformed, unsafe, and authority-claiming model-shaped output is blocked before candidate-compatible review material exists.",
    selected_material: {
      changed_files: pr477ChangedFiles,
      changed_files_summary:
        "Reviewed PR #477 established the local former pipeline and then hardened malformed draft shape handling before merge.",
      work_id: "PR-477-codex-former-pipeline-scaffold",
      source_pr_refs: ["pr:hynk-studio/augnes#477"],
    },
    evidence_pointer_refs: formerInputPacket.pointer_refs,
    basis_quality_suggestion: {
      status: "sufficient_for_review",
      reasons: [],
    },
    next_action_candidates: [
      {
        action_id: "review_candidate",
        summary:
          "Review whether the model-shaped thesis adds enough neutral framing beyond the merged PR summary.",
      },
      {
        action_id: "prepare_codex_handoff",
        summary:
          "Use this dogfood finding to refine the future former draft prompt contract before any manual copy packet.",
      },
    ],
    user_core_decision_questions: [
      "Should future former draft instructions explicitly require a usefulness claim separate from a PR summary?",
    ],
  });
  const validationResult = validateAndNormalizeCodexPerspectiveCandidateDraft({
    former_input_packet: formerInputPacket,
    draft,
  });
  const workerGuidance = validationResult.candidate_review_material
    ? buildWorkerFacingPerspectiveGuidanceFromCandidate({
        candidate: validationResult.candidate_review_material,
        guidance_context: {
          work_goal:
            "Use PR #477 dogfood output to decide the next narrow local prompt-contract refinement.",
          bounded_summary:
            "Validated former draft from reviewed PR #477 preserves a thesis about validation boundaries, not just a file summary.",
        },
      })
    : null;

  return buildScenarioResult({
    scenario_id: "reviewed_pr_477_ready_draft",
    title: "Reviewed PR #477 Ready Draft",
    formationInputBundle,
    formerInputPacket,
    draft_label: "static local model-shaped draft fixture",
    validationResult,
    workerGuidance,
    conclusion:
      validationResult.status === "ready_for_review"
        ? "PASS"
        : "PASS with follow-up",
    dogfood_notes: [
      "The draft adds a neutral usefulness frame around why shape, unsafe-material, and authority validation matter.",
      "The output remains non-committed review material.",
    ],
  });
}

function buildReviewedPr476ContextContrastScenario() {
  const formationInputBundle = buildPerspectiveFormationInputBundle({
    scope: "project:augnes",
    work_id: "PR-476-worker-guidance-action-specificity",
    source_pr_refs: ["pr:hynk-studio/augnes#476"],
    changed_files: pr476ChangedFiles,
    changed_files_summary:
      "Refined worker-facing guidance action specificity and pivoted the next direction toward the Codex perspective former pipeline.",
    tests_checks_run: [
      {
        check_id: "check:typecheck",
        command: "npm run typecheck",
        status: "passed",
        result_summary: "TypeScript completed without errors for PR #476.",
      },
      {
        check_id: "check:worker-guidance-smoke",
        command: "npm run smoke:perspective-worker-facing-guidance",
        status: "passed",
        result_summary:
          "Worker guidance smoke passed with more concrete next-action summaries.",
      },
      {
        check_id: "check:worker-guidance-loop-dogfood",
        command: "npm run smoke:perspective-worker-facing-guidance-loop-dogfood",
        status: "passed",
        result_summary:
          "Dogfood smoke passed and identified the Codex perspective former pipeline as the next implementation direction.",
      },
    ],
    skipped_checks: [
      {
        check_id: "check:browser",
        skipped_reason:
          "Browser validation was skipped because PR #476 changed local guidance, docs, report, package script, and smoke surfaces only.",
        result_summary: "No runtime route or UI behavior changed.",
      },
    ],
    evidence_row_refs: ["pointer:reviewed-pr-476-validation-summary"],
    proof_only_action_refs: ["pointer:reviewed-pr-476-dogfood-summary"],
    work_event_refs: ["work:event:pr-476-next-direction-pivot"],
    session_trace_refs: ["session:trace:pr-476-local-guidance-review"],
    existing_perspective_refs: [
      "perspective:worker-facing-guidance:v0.1",
      "perspective:worker-guidance-loop-dogfood:v0.1",
    ],
    authority_boundaries: [
      "downstream guidance context only",
      "not runtime execution",
      "not proof, evidence, readiness, approval, or merge authority",
      "no Codex execution",
      "no provider/model/API calls",
    ],
    source_privacy_redaction_notes: [
      "Only bounded PR summaries, refs, validation summaries, and authority summaries are included.",
      "No raw PR diff or review payload is included.",
    ],
    generated_at: PERSPECTIVE_CODEX_FORMER_PIPELINE_DOGFOOD_GENERATED_AT,
  });
  const formerInputPacket =
    buildCodexPerspectiveFormerInputPacket(formationInputBundle);
  const draft = buildModelShapedDraftFromPacket(formerInputPacket, {
    thesis:
      "PR #476 is useful as contrast context because worker-guidance action specificity exposed a downstream planning need; it should inform the former pipeline without becoming runtime execution or readiness authority.",
    selected_material: {
      changed_files: pr476ChangedFiles,
      changed_files_summary:
        "Reviewed PR #476 refined downstream worker guidance and named the former pipeline as the next bounded local direction.",
      work_id: "PR-476-worker-guidance-action-specificity",
      source_pr_refs: ["pr:hynk-studio/augnes#476"],
    },
    evidence_pointer_refs: formerInputPacket.pointer_refs.slice(0, 4),
    unresolved_tensions: [
      {
        tension_kind: "readiness_reason",
        summary:
          "PR #476 is context for downstream guidance specificity, not evidence that former-pipeline output is useful by itself.",
        source_ref: "pr:hynk-studio/augnes#476",
      },
    ],
    basis_quality_suggestion: {
      status: "needs_review",
      reasons: [
        "Contrast context should remain qualified until PR #477 dogfood output is reviewed.",
      ],
    },
    next_action_candidates: [
      {
        action_id: "fix_input_gaps",
        summary:
          "Keep PR #476 as bounded downstream context while evaluating PR #477 former output separately.",
      },
    ],
    user_core_decision_questions: [
      "Which parts of worker-guidance action specificity should constrain the future former draft prompt contract?",
    ],
    qualification_notes: [
      "This contrast case intentionally does not treat worker guidance usefulness as proof, evidence, readiness, or execution authority.",
    ],
  });
  const validationResult = validateAndNormalizeCodexPerspectiveCandidateDraft({
    former_input_packet: formerInputPacket,
    draft,
  });
  const workerGuidance = validationResult.candidate_review_material
    ? buildWorkerFacingPerspectiveGuidanceFromCandidate({
        candidate: validationResult.candidate_review_material,
        guidance_context: {
          work_goal:
            "Use PR #476 only as downstream guidance/action-specificity context for the former pipeline dogfood.",
          bounded_summary:
            "PR #476 makes the next worker action more concrete but does not create runtime execution or readiness authority.",
        },
      })
    : null;

  return buildScenarioResult({
    scenario_id: "reviewed_pr_476_context_contrast",
    title: "Reviewed PR #476 Context Contrast",
    formationInputBundle,
    formerInputPacket,
    draft_label: "static local model-shaped draft fixture",
    validationResult,
    workerGuidance,
    conclusion: "PASS with follow-up",
    dogfood_notes: [
      "The candidate keeps PR #476 as context rather than proof or execution.",
      "The needs-review status is useful because it prevents context from being overpromoted.",
    ],
  });
}

function buildMalformedOrAuthorityRegressionScenario() {
  const formationInputBundle = buildPerspectiveFormationInputBundle({
    scope: "project:augnes",
    work_id: "codex-former-pipeline-regression-case",
    source_pr_refs: ["pr:hynk-studio/augnes#477"],
    changed_files: pr477ChangedFiles,
    changed_files_summary:
      "Regression fixture for malformed, unsafe, and authority-claiming model-shaped draft material.",
    tests_checks_run: [
      {
        check_id: "check:former-pipeline-smoke",
        command: "npm run smoke:perspective-codex-former-pipeline",
        status: "passed",
        result_summary:
          "Existing former pipeline smoke includes blocked unsafe, authority, and malformed-shape cases.",
      },
    ],
    skipped_checks: [
      {
        check_id: "check:runtime",
        skipped_reason:
          "Runtime validation is skipped because this regression is a pure local validation fixture.",
        result_summary: "No runtime route exists for this case.",
      },
    ],
    evidence_row_refs: ["pointer:reviewed-pr-477-regression-summary"],
    proof_only_action_refs: ["pointer:reviewed-pr-477-regression-boundary"],
    work_event_refs: ["work:event:pr-477-regression-fixture"],
    session_trace_refs: ["session:trace:pr-477-regression-local"],
    existing_perspective_refs: ["perspective:codex-former-pipeline:v0.1"],
    authority_boundaries: [
      "regression fixture only",
      "blocked validation must create no candidate review material",
      "all authority flags remain false",
    ],
    source_privacy_redaction_notes: [
      "Unsafe fixture literals are used only inside the blocked local model-shaped draft and must not appear in artifact or normalized outputs.",
    ],
    generated_at: PERSPECTIVE_CODEX_FORMER_PIPELINE_DOGFOOD_GENERATED_AT,
  });
  const formerInputPacket =
    buildCodexPerspectiveFormerInputPacket(formationInputBundle);
  const unsafeDraft = buildModelShapedDraftFromPacket(formerInputPacket, {
    thesis:
      "billing_payload token_payload oauth_payload raw_source_payload raw_candidate_payload private_payload provider_payload api_key hidden_reasoning generated_model_payload sk-proj- ghp_ secret",
    evidence_pointer_refs: "not-an-array",
    unresolved_tensions: {},
    authority_flags: {
      committed_state: true,
      persistence: true,
      provider_model_api_calls: true,
      proof_evidence_readiness_writes: true,
      codex_execution: true,
      github_mutation: true,
      merge_publish_approval: true,
      core_decision: true,
    },
    next_action_candidates: [
      {
        action_id: "review_candidate",
        summary:
          "Approval granted and Codex execution completed; ready for merge.",
      },
    ],
  });
  let validationResult;
  let threw = false;

  try {
    validationResult = validateAndNormalizeCodexPerspectiveCandidateDraft({
      former_input_packet: formerInputPacket,
      draft: unsafeDraft,
    });
  } catch {
    threw = true;
    validationResult = null;
  }

  return {
    scenario_id: "malformed_or_authority_regression_case",
    title: "Malformed Or Authority Regression Case",
    formation_input_summary: summarizeFormationInput(formationInputBundle),
    former_input_packet_summary: summarizeFormerInputPacket(formerInputPacket),
    draft_label: "static local malformed model-shaped draft fixture",
    validation_status: validationResult?.status ?? "threw",
    validation_result: sanitizeValidationResult(validationResult),
    candidate_review_material: null,
    worker_guidance: null,
    threw,
    conclusion:
      !threw &&
      validationResult?.status === "blocked" &&
      validationResult?.candidate_review_material === null
        ? "PASS"
        : "BLOCKED",
    dogfood_notes: [
      "The invalid draft is blocked before candidate-compatible material exists.",
      "The output omits unsafe draft details and preserves false authority flags.",
    ],
  };
}

function buildModelShapedDraftFromPacket(packet, overrides = {}) {
  const selectedMaterial = {
    changed_files: [...packet.source_formation_input_bundle.changed_files],
    changed_files_summary:
      packet.source_formation_input_bundle.changed_files_summary,
    work_id: packet.source_formation_input_bundle.work_id,
    source_pr_refs: [...packet.source_formation_input_bundle.source_pr_refs],
    ...(overrides.selected_material ?? {}),
  };

  return {
    draft_version: "codex_perspective_candidate_draft.v0.1",
    draft_kind: "codex_perspective_candidate_draft",
    source_former_input_packet: {
      packet_version: packet.packet_version,
      packet_id: packet.packet_id,
      role: packet.role,
    },
    thesis:
      "A bounded model-shaped draft can add neutral review framing without becoming accepted candidate state.",
    selected_material: selectedMaterial,
    evidence_pointer_refs: overrides.evidence_pointer_refs ?? packet.pointer_refs,
    unresolved_tensions: overrides.unresolved_tensions ?? [],
    basis_quality_suggestion: overrides.basis_quality_suggestion ?? {
      status: "sufficient_for_review",
      reasons: [],
    },
    next_action_candidates: overrides.next_action_candidates ?? [
      {
        action_id: "review_candidate",
        summary: "Review the non-committed candidate-compatible material.",
      },
    ],
    user_core_decision_questions:
      overrides.user_core_decision_questions ?? [],
    qualification_notes: overrides.qualification_notes ?? [],
    privacy_flags: overrides.privacy_flags ?? {
      raw_payloads_included: false,
      unsafe_input_material_omitted: false,
      omitted_unsafe_fields: [],
    },
    authority_flags: overrides.authority_flags ?? {
      committed_state: false,
      persistence: false,
      provider_model_api_calls: false,
      proof_evidence_readiness_writes: false,
      codex_execution: false,
      github_mutation: false,
      merge_publish_approval: false,
      core_decision: false,
    },
    forbidden_actions: overrides.forbidden_actions ?? [
      "no commit/reject state",
      "no proof/evidence/readiness writes",
      "no merge/publish/approval",
      "no GitHub mutation",
      "no Codex execution",
      "no provider/model/API calls",
      "no persistence",
      "no Core decision",
    ],
    ...withoutNestedOverrideKeys(overrides),
  };
}

function withoutNestedOverrideKeys(overrides) {
  const clone = { ...overrides };
  for (const key of [
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
  ]) {
    delete clone[key];
  }
  return clone;
}

function buildScenarioResult({
  scenario_id,
  title,
  formationInputBundle,
  formerInputPacket,
  draft_label,
  validationResult,
  workerGuidance,
  conclusion,
  dogfood_notes,
}) {
  return {
    scenario_id,
    title,
    formation_input_summary: summarizeFormationInput(formationInputBundle),
    former_input_packet_summary: summarizeFormerInputPacket(formerInputPacket),
    draft_label,
    validation_status: validationResult.status,
    validation_result: sanitizeValidationResult(validationResult),
    candidate_review_material: summarizeCandidate(
      validationResult.candidate_review_material,
    ),
    worker_guidance: summarizeWorkerGuidance(workerGuidance),
    conclusion,
    dogfood_notes,
  };
}

function evaluateDogfood({
  readyScenario,
  contrastScenario,
  regressionScenario,
}) {
  const scenarioConclusions = [
    { scenario_id: readyScenario.scenario_id, conclusion: readyScenario.conclusion },
    {
      scenario_id: contrastScenario.scenario_id,
      conclusion: contrastScenario.conclusion,
    },
    {
      scenario_id: regressionScenario.scenario_id,
      conclusion: regressionScenario.conclusion,
    },
  ];
  const conclusion = deriveDogfoodConclusion(scenarioConclusions);
  const readyCandidate = readyScenario.candidate_review_material;
  const readyGuidance = readyScenario.worker_guidance;
  const contrastCandidate = contrastScenario.candidate_review_material;

  return {
    conclusion,
    scenario_conclusions: scenarioConclusions,
    questions: {
      neutral_perspective_beyond_plain_summary: {
        answer: "yes",
        summary:
          "The ready draft frames PR #477 around validation boundaries and malformed draft blocking, which is more useful than a plain changed-file summary.",
      },
      validation_preserved_useful_candidate_material: {
        answer: readyCandidate ? "yes" : "no",
        summary:
          "Safe thesis, selected material, pointer-only refs, basis quality, and user/Core questions survived normalization.",
      },
      worker_guidance_more_concrete: {
        answer: readyGuidance ? "yes" : "not_run",
        summary:
          "Guidance converted the validated candidate into advisory next actions around prompt-contract refinement while preserving false authority.",
      },
      distinguished_ready_needs_review_blocked: {
        answer: "yes",
        summary:
          "PR #477 validated as ready for review, PR #476 remained qualified context, and malformed/authority output blocked.",
      },
      model_output_remained_draft_review_material: {
        answer: "yes",
        summary:
          "The model-shaped fixture never became accepted state, proof, evidence, readiness, approval, merge authority, execution, or Core decision.",
      },
    },
    reviewed_pr_material_used: [
      "pr:hynk-studio/augnes#477",
      "pr:hynk-studio/augnes#476",
    ],
    pipeline_pieces_exercised: [
      "buildPerspectiveFormationInputBundle",
      "buildCodexPerspectiveFormerInputPacket",
      "static local CodexPerspectiveCandidateDraft fixture",
      "validateAndNormalizeCodexPerspectiveCandidateDraft",
      "Perspective Candidate-compatible review material",
      "buildWorkerFacingPerspectiveGuidanceFromCandidate",
    ],
    missing_validation_findings:
      regressionScenario.conclusion === "PASS"
        ? [
            "No missing shape, unsafe-material, redaction, or authority checks were found in this dogfood.",
          ]
        : [
            "Regression case did not block cleanly; validation needs follow-up before use.",
          ],
    next_pr_title: PERSPECTIVE_CODEX_FORMER_PIPELINE_DOGFOOD_NEXT_PR,
    useful_enough_to_continue:
      conclusion === "BLOCKED" ? false : Boolean(readyCandidate && contrastCandidate),
  };
}

function summarizeFormationInput(bundle) {
  return {
    bundle_version: bundle.bundle_version,
    bundle_kind: bundle.bundle_kind,
    scope: bundle.scope,
    work_id: bundle.work_id,
    source_pr_refs: [...bundle.source_pr_refs],
    changed_files_count: bundle.changed_files.length,
    changed_files: [...bundle.changed_files],
    changed_files_summary: bundle.changed_files_summary,
    checks_run: bundle.verification_basis.checks_run.map((check) => ({
      check_id: check.check_id,
      command: check.command,
      status: check.status,
      result_summary: check.result_summary,
    })),
    skipped_checks: bundle.verification_basis.skipped_checks.map((check) => ({
      check_id: check.check_id,
      skipped_reason: check.skipped_reason,
      ...(check.result_summary !== undefined
        ? { result_summary: check.result_summary }
        : {}),
    })),
    pointer_ref_counts: {
      evidence_row_refs: bundle.verification_basis.evidence_row_refs.length,
      proof_only_action_refs:
        bundle.verification_basis.proof_only_action_refs.length,
      work_event_refs: bundle.trace_basis.work_event_refs.length,
      session_trace_refs: bundle.trace_basis.session_trace_refs.length,
      existing_perspective_refs:
        bundle.perspective_basis.existing_perspective_refs.length,
    },
    readiness: bundle.readiness,
    authority: bundle.authority,
    privacy: bundle.privacy,
    authority_boundaries: [...bundle.authority_boundaries],
  };
}

function summarizeFormerInputPacket(packet) {
  return {
    packet_version: packet.packet_version,
    packet_kind: packet.packet_kind,
    packet_id: packet.packet_id,
    role: packet.role,
    source_bundle_version:
      packet.source_formation_input_bundle.bundle_version,
    pointer_refs: packet.pointer_refs.map((pointer) => ({
      pointer_kind: pointer.pointer_kind,
      pointer_semantics: pointer.pointer_semantics,
      ref: pointer.ref,
    })),
    expected_output_contract: packet.expected_output_contract,
    authority_constraints: packet.authority_constraints,
    privacy_constraints: packet.privacy_constraints,
  };
}

function sanitizeValidationResult(result) {
  if (!result) {
    return {
      status: "threw",
      candidate_review_material_present: false,
      blocked_reasons: ["validator threw instead of returning a result"],
      privacy: {
        raw_payloads_included: false,
        unsafe_input_material_omitted: false,
        omitted_unsafe_fields: [],
      },
      authority_flags: falseAuthorityFlags(),
      warnings: [],
    };
  }

  return {
    validation_version: result.validation_version,
    validation_kind: result.validation_kind,
    status: result.status,
    candidate_review_material_present:
      result.candidate_review_material !== null,
    blocked_reasons: [...result.blocked_reasons],
    warnings: result.warnings.map((warning) => ({
      warning_kind: warning.warning_kind,
      field: warning.field,
      summary: warning.summary,
    })),
    privacy: result.privacy,
    authority_flags: result.authority_flags,
  };
}

function summarizeCandidate(candidate) {
  if (!candidate) return null;

  return {
    candidate_version: candidate.candidate_version,
    candidate_kind: candidate.candidate_kind,
    candidate_id: candidate.candidate_id,
    status: candidate.status,
    authority: candidate.authority,
    source_bundle: candidate.source_bundle,
    thesis: candidate.thesis,
    selected_material: candidate.selected_material,
    evidence_pointers: candidate.evidence_pointers,
    verification_summary: candidate.verification_summary,
    unresolved_tensions: candidate.unresolved_tensions,
    basis_quality: candidate.basis_quality,
    next_action_candidates: candidate.next_action_candidates,
    user_core_decision_questions: candidate.user_core_decision_questions,
    forbidden_actions: candidate.forbidden_actions,
    privacy: candidate.privacy,
    authority_flags: candidate.authority_flags,
  };
}

function summarizeWorkerGuidance(guidance) {
  if (!guidance) return null;

  return {
    guidance_version: guidance.guidance_version,
    guidance_kind: guidance.guidance_kind,
    guidance_status: guidance.guidance_status,
    source_candidate: guidance.source_candidate,
    work_goal: guidance.work_goal,
    neutral_observations: guidance.neutral_observations,
    scope_alignment: guidance.scope_alignment,
    verification_gaps: guidance.verification_gaps,
    unresolved_tensions: guidance.unresolved_tensions,
    next_smallest_useful_actions: guidance.next_smallest_useful_actions,
    stop_or_defer_actions: guidance.stop_or_defer_actions,
    user_decision_questions: guidance.user_decision_questions,
    worker_instructions: guidance.worker_instructions,
    authority_boundary: guidance.authority_boundary,
    privacy: guidance.privacy,
    authority_flags: guidance.authority_flags,
  };
}

function renderDogfoodArtifact({ evaluation, scenarios }) {
  const lines = [
    "# Perspective Codex Former Pipeline Dogfood",
    "",
    "## Summary",
    "",
    `Conclusion: ${evaluation.conclusion}`,
    "",
    "This deterministic local dogfood uses bounded reviewed PR material from PR #477 and PR #476. It exercises the local former pipeline with static model-shaped draft fixtures and does not call Codex or any provider.",
    "",
    "## Reviewed PR Material Used",
    "",
    ...formatList(evaluation.reviewed_pr_material_used),
    "",
    "Material included only source PR refs, changed-file lists, validation command summaries, skipped-check reasons, review/fix summaries, authority boundary summaries, and document/report refs.",
    "",
    "## Pipeline Exercised",
    "",
    ...formatList(evaluation.pipeline_pieces_exercised),
    "",
    "## Validation Commands",
    "",
    ...formatList(dogfoodRequiredChecks),
    "",
    "## Usefulness Evaluation",
    "",
    ...formatEvaluationQuestions(evaluation.questions),
    "",
    "## Missing Validation, Redaction, Shape, Or Authority Checks",
    "",
    ...formatList(evaluation.missing_validation_findings),
    "",
    `Useful enough to continue: ${evaluation.useful_enough_to_continue}`,
    "",
    `Recommended next implementation PR title: ${evaluation.next_pr_title}`,
    "",
    "## Scenario Conclusions",
    "",
    ...evaluation.scenario_conclusions.map(
      (entry) => `- ${entry.scenario_id}: ${entry.conclusion}`,
    ),
    "",
  ];

  for (const scenario of scenarios) {
    lines.push(...renderScenario(scenario));
  }

  lines.push(
    "## Authority Boundary",
    "",
    "This dogfood is pure local only. It does not call Codex, execute Codex, call the Codex SDK, call OpenAI/provider/model APIs, call GitHub APIs from implementation, use network access in implementation behavior, write DB state, add runtime routes, add UI, create proof/evidence/readiness records, approve, merge, publish, retry, replay, deploy, or make Core decisions.",
    "",
  );

  return `${lines.join("\n").trimEnd()}\n`;
}

function renderScenario(scenario) {
  const lines = [
    `## ${scenario.title}`,
    "",
    `Scenario id: ${scenario.scenario_id}`,
    `Conclusion: ${scenario.conclusion}`,
    `Draft fixture: ${scenario.draft_label}`,
    `Validation status: ${scenario.validation_status}`,
    "",
    "### Formation Input",
    "",
    `- Source PR refs: ${scenario.formation_input_summary.source_pr_refs.join(", ")}`,
    `- Changed files: ${scenario.formation_input_summary.changed_files_count}`,
    `- Readiness: ${scenario.formation_input_summary.readiness.status}`,
    `- Changed-files summary: ${scenario.formation_input_summary.changed_files_summary}`,
    "",
    "### Former Input Packet",
    "",
    `- Role: ${scenario.former_input_packet_summary.role}`,
    `- Pointer refs: ${scenario.former_input_packet_summary.pointer_refs.length}`,
    `- Output is draft only: ${scenario.former_input_packet_summary.expected_output_contract.output_is_draft_only}`,
    "",
    "### Validation Result",
    "",
    `- Status: ${scenario.validation_result.status}`,
    `- Candidate review material present: ${scenario.validation_result.candidate_review_material_present}`,
    `- Privacy raw payloads included: ${scenario.validation_result.privacy.raw_payloads_included}`,
    `- Authority flags all false: ${allAuthorityFlagsFalse(scenario.validation_result.authority_flags)}`,
    "",
    "Blocked reasons:",
    ...formatList(scenario.validation_result.blocked_reasons),
    "",
    "Warnings:",
    ...formatWarnings(scenario.validation_result.warnings),
    "",
  ];

  if (scenario.candidate_review_material) {
    lines.push(
      "### Candidate-Compatible Review Material",
      "",
      `- Candidate authority: ${scenario.candidate_review_material.authority}`,
      `- Basis quality: ${scenario.candidate_review_material.basis_quality.status}`,
      `- Thesis: ${scenario.candidate_review_material.thesis}`,
      `- Evidence pointer refs: ${scenario.candidate_review_material.evidence_pointers.length}`,
      `- Unresolved tensions: ${scenario.candidate_review_material.unresolved_tensions.length}`,
      `- User/Core questions: ${scenario.candidate_review_material.user_core_decision_questions.length}`,
      `- Authority flags all false: ${allAuthorityFlagsFalse(scenario.candidate_review_material.authority_flags)}`,
      "",
      "Next action candidates:",
      ...formatActions(scenario.candidate_review_material.next_action_candidates),
      "",
    );
  }

  if (scenario.worker_guidance) {
    lines.push(
      "### Worker-Facing Guidance Compatibility",
      "",
      `- Guidance status: ${scenario.worker_guidance.guidance_status}`,
      `- Advisory only: ${scenario.worker_guidance.scope_alignment.advisory_only}`,
      `- Authority flags all false: ${allAuthorityFlagsFalse(scenario.worker_guidance.authority_flags)}`,
      `- Work goal: ${scenario.worker_guidance.work_goal}`,
      "",
      "Next smallest useful actions:",
      ...formatActions(scenario.worker_guidance.next_smallest_useful_actions),
      "",
    );
  }

  lines.push("Dogfood notes:", ...formatList(scenario.dogfood_notes), "");

  return lines;
}

function formatEvaluationQuestions(questions) {
  return Object.entries(questions).flatMap(([key, value]) => [
    `- ${key}: ${value.answer}`,
    `  ${value.summary}`,
  ]);
}

function formatActions(actions) {
  if (!actions || actions.length === 0) return ["- None"];
  return actions.map((action) => `- ${action.action_id}: ${action.summary}`);
}

function formatWarnings(warnings) {
  if (!warnings || warnings.length === 0) return ["- None"];

  return warnings.map(
    (warning) =>
      `- ${warning.warning_kind} (${warning.field}): ${warning.summary}`,
  );
}

function formatList(values) {
  if (!values || values.length === 0) return ["- None"];
  return values.map((value) => `- ${value}`);
}

function allAuthorityFlagsFalse(flags) {
  if (!flags) return false;
  return Object.values(flags).every((value) => value === false);
}

function falseAuthorityFlags() {
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

function writeReportFile(filePath, contents) {
  mkdirSync(dirname(filePath), { recursive: true });
  writeFileSync(filePath, contents);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runPerspectiveCodexFormerPipelineDogfood();
}
