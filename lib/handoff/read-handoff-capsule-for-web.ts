import capsuleSample from "@/fixtures/handoff-capsule.sample.v0.1.json";
import launchCardSample from "@/fixtures/codex-launch-card.sample.v0.1.json";
import {
  CODEX_LAUNCH_CARD_ROUTE_ID,
  HANDOFF_CAPSULE_ROUTE_AUTHORITY_BOUNDARY,
  HANDOFF_CAPSULE_ROUTE_ID,
  readCodexLaunchCardForRoute,
  readHandoffCapsuleForRoute,
  validateCodexLaunchCardReadRequest,
  validateHandoffCapsuleReadRequest,
} from "@/lib/handoff/handoff-capsule-source";
import type {
  CodexLaunchCard,
  HandoffCapsule,
} from "@/types/handoff-capsule";

export const HANDOFF_PREVIEW_PUBLIC_SAFE_FALLBACK_SOURCE =
  "public_safe_fixture_fallback" as const;

export const HANDOFF_PREVIEW_PUBLIC_SAFE_FALLBACK_REFS = [
  "fixtures/handoff-capsule.sample.v0.1.json",
  "fixtures/codex-launch-card.sample.v0.1.json",
  "docs/HANDOFF_CAPSULE_CONTRACT_V0_1.md",
] as const;

export type HandoffPreviewPublicSafety =
  | typeof HANDOFF_PREVIEW_PUBLIC_SAFE_FALLBACK_SOURCE
  | "local_readonly_route_context"
  | "validation_failed_fallback";

export type HandoffCapsulePreviewForWeb = {
  capsule: HandoffCapsule;
  launch_card: CodexLaunchCard;
  source_status: {
    source: HandoffPreviewPublicSafety;
    capsule: string;
    launch_card: string;
    source_disclosure: string;
    synthetic_operator_supplied_fields: string[];
  };
  fallback_reasons: string[];
  boundary_notes: string[];
  public_safety: HandoffPreviewPublicSafety;
  route_refs: string[];
  docs_refs: string[];
  warnings: string[];
  gaps: string[];
};

export type HandoffCapsuleWebReadContext = {
  handoffRequest?: Request;
  codexLaunchCardRequest?: Request;
};

const HANDOFF_ROUTE_REF =
  "/api/augnes/read/handoff-capsule?scope=project:augnes&target=codex_handoff";
const CODEX_LAUNCH_CARD_ROUTE_REF =
  "/api/augnes/read/codex-launch-card?scope=project:augnes";

const HANDOFF_PREVIEW_ROUTE_REFS = [
  HANDOFF_ROUTE_REF,
  CODEX_LAUNCH_CARD_ROUTE_REF,
] as const;

const HANDOFF_PREVIEW_DOC_REFS = [
  "docs/HANDOFF_CAPSULE_CONTRACT_V0_1.md",
  "docs/GUIDEBRIEF_CONTRACT_V0_1.md",
  "docs/AUTHORITY_MATRIX.md",
] as const;

const HANDOFF_PREVIEW_BOUNDARY_NOTES = [
  "Read-only Web preview display only.",
  "Preview only; no send, no launch, no execution, and no mutation.",
  "No action buttons or form controls are provided.",
  "No copy/export behavior is provided in Phase 7C.",
  "No Codex execution, GitHub actuation, branch/PR creation, provider/OpenAI calls, DB writes, proof/evidence writes, memory mutation, durable Perspective apply, scheduler/autonomy, handoff send, or external side effects.",
] as const;

const HANDOFF_PREVIEW_NEXT_PHASE_NOTES = [
  "Phase 7C adds read-only Web preview UI for Handoff Capsule / Codex Launch Card.",
  "Phase 7D ChatGPT App/MCP tool remains deferred.",
  "Phase 7E Codex skill alignment remains deferred.",
  "Phase 7F copy/export remains deferred.",
] as const;

const CAPSULE_SAMPLE = capsuleSample as unknown as HandoffCapsule;
const LAUNCH_CARD_SAMPLE = launchCardSample as unknown as CodexLaunchCard;

export function readHandoffCapsulePreviewForWeb(
  context: HandoffCapsuleWebReadContext = {},
): HandoffCapsulePreviewForWeb {
  if (context.handoffRequest && context.codexLaunchCardRequest) {
    const handoffValidation = validateHandoffCapsuleReadRequest(
      context.handoffRequest,
    );
    const launchCardValidation = validateCodexLaunchCardReadRequest(
      context.codexLaunchCardRequest,
    );

    if (handoffValidation.ok && launchCardValidation.ok) {
      const capsuleResponse = readHandoffCapsuleForRoute({
        scope: handoffValidation.scope,
        target: handoffValidation.target,
      });
      const launchCardResponse = readCodexLaunchCardForRoute({
        scope: launchCardValidation.scope,
      });

      return {
        capsule: withPreviewNotes(capsuleResponse.capsule),
        launch_card: withLaunchCardPreviewNotes(
          launchCardResponse.launch_card,
        ),
        source_status: {
          source: "local_readonly_route_context",
          capsule: capsuleResponse.source_status.capsule,
          launch_card:
            launchCardResponse.source_status.launch_card ??
            "preview_composed_from_handoff_capsule",
          source_disclosure: [
            capsuleResponse.source_status.source_disclosure,
            "Live route-composed data was read only after both Phase 7B local read-only request validators passed.",
          ].join(" "),
          synthetic_operator_supplied_fields: uniqueSorted([
            ...capsuleResponse.source_status.synthetic_operator_supplied_fields,
            ...launchCardResponse.source_status
              .synthetic_operator_supplied_fields,
          ]),
        },
        fallback_reasons: [],
        boundary_notes: [
          ...HANDOFF_PREVIEW_BOUNDARY_NOTES,
          ...HANDOFF_CAPSULE_ROUTE_AUTHORITY_BOUNDARY,
        ],
        public_safety: "local_readonly_route_context",
        route_refs: [...HANDOFF_PREVIEW_ROUTE_REFS],
        docs_refs: [...HANDOFF_PREVIEW_DOC_REFS],
        warnings: uniqueSorted([
          ...capsuleResponse.warnings,
          ...launchCardResponse.warnings,
          "Launch Card status never means executed.",
        ]),
        gaps: uniqueSorted([...capsuleResponse.gaps, ...launchCardResponse.gaps]),
      };
    }

    return buildFallbackPreview({
      reason:
        "Local read-only Handoff Capsule / Codex Launch Card request validation failed closed.",
      publicSafety: "validation_failed_fallback",
      validationFailures: [
        handoffValidation.ok
          ? null
          : `Handoff Capsule validation failed: ${handoffValidation.code}.`,
        launchCardValidation.ok
          ? null
          : `Codex Launch Card validation failed: ${launchCardValidation.code}.`,
      ].filter((failure): failure is string => Boolean(failure)),
    });
  }

  if (context.handoffRequest || context.codexLaunchCardRequest) {
    return buildFallbackPreview({
      reason:
        "Both Handoff Capsule and Codex Launch Card local read-only request contexts are required before Web preview can use route-composed data.",
      publicSafety: "validation_failed_fallback",
      validationFailures: [],
    });
  }

  return buildFallbackPreview({
    reason:
      "No explicit local read-only request context was supplied to the Handoff Capsule Web preview.",
    publicSafety: HANDOFF_PREVIEW_PUBLIC_SAFE_FALLBACK_SOURCE,
    validationFailures: [],
  });
}

export function buildPublicSafeHandoffCapsulePreviewFallback(
  reason: string,
): HandoffCapsule {
  return withPreviewNotes({
    ...CAPSULE_SAMPLE,
    title: "Public-safe Handoff Capsule preview fallback",
    summary:
      "Public-safe fixture fallback for reviewing Handoff Capsule sections without exposing live route data.",
    thesis:
      "Handoff Capsule preview can show transfer packet structure while preserving local read guards and denying execution, send, write, and external authority.",
    status: "preview_only",
    observed_context: [
      {
        context_id: "handoff.observed.web_preview_public_safe_fallback",
        source_observation_id:
          "observed.web_preview_public_safe_fallback",
        kind: "web_preview_public_safe_fallback",
        summary:
          "Handoff Capsule Web preview is using a public-safe fixture fallback.",
        source_refs: [...HANDOFF_PREVIEW_PUBLIC_SAFE_FALLBACK_REFS],
        related_delta_ids: [],
        confidence: "observed",
        notes: [
          reason,
          "This is not live GuideBrief, Handoff Capsule route, or Codex Launch Card route state.",
          "Live route-composed preview data remains marker-gated and local-host-gated by the Phase 7B route validators.",
        ],
      },
      ...CAPSULE_SAMPLE.observed_context.slice(0, 2),
    ],
    inferred_context: CAPSULE_SAMPLE.inferred_context,
    suggested_context: CAPSULE_SAMPLE.suggested_context,
    needs_user_judgment: CAPSULE_SAMPLE.needs_user_judgment,
    source_refs: {
      ...CAPSULE_SAMPLE.source_refs,
      guide_brief_ref: "public_safe_fixture_fallback:guide_brief",
      current_working_perspective_ref:
        "public_safe_fixture_fallback:current_working_perspective",
      delta_projection_ref:
        "public_safe_fixture_fallback:augnes_delta_projection",
      workplane_ref: "public_safe_fixture_fallback:/workbench",
      perspective_snapshot_refs: [],
      delta_ids: [],
      batch_ids: [],
      evidence_refs: [],
      artifact_refs: [],
      handoff_refs: [],
      diagnostic_refs: ["public_safe_fixture_fallback:handoff_preview"],
      route_refs: [...HANDOFF_PREVIEW_ROUTE_REFS],
      docs_refs: uniqueSorted([
        ...HANDOFF_PREVIEW_DOC_REFS,
        ...CAPSULE_SAMPLE.source_refs.docs_refs,
      ]),
      repo_refs: ["hynk-studio/augnes"],
    },
    selected_delta_refs: [],
    evidence_refs: [],
    artifact_refs: [],
    diagnostic_refs: ["public_safe_fixture_fallback:handoff_preview"],
    expected_outputs: [
      "Read-only Web preview only.",
      "No sent handoff, launch, execution, write, copy/export, or external side effect.",
    ],
    staleness: {
      status: "unknown",
      as_of: CAPSULE_SAMPLE.created_at,
      warnings: [
        "Handoff Capsule Web preview is showing public-safe fallback data.",
        reason,
      ],
      refresh_suggestion:
        "Use the Phase 7B local read-only routes with required markers and local host when live preview data is explicitly authorized.",
    },
    gaps: [
      {
        code: "handoff_preview.public_safe_fallback",
        severity: "medium",
        summary:
          "Live Handoff Capsule / Codex Launch Card route-composed data is unavailable to this Web render without validated local read authorization.",
        source_refs: [...HANDOFF_PREVIEW_PUBLIC_SAFE_FALLBACK_REFS],
        blocks_transfer_confidence: true,
      },
    ],
    next_phase_notes: [...HANDOFF_PREVIEW_NEXT_PHASE_NOTES],
    public_safety: {
      ...CAPSULE_SAMPLE.public_safety,
      fixture_kind: "synthetic_sample",
      notes: [
        reason,
        "Public-safe fallback does not expose live runtime state.",
        "Fallback source status must remain visible in Web preview UI.",
      ],
    },
  });
}

export function buildPublicSafeCodexLaunchCardPreviewFallback(
  reason: string,
): CodexLaunchCard {
  return withLaunchCardPreviewNotes({
    ...LAUNCH_CARD_SAMPLE,
    source_capsule_id: "public_safe_fixture_fallback:handoff_capsule",
    source_guide_brief_ref: "public_safe_fixture_fallback:guide_brief",
    branch_suggestion:
      "operator-scoped-branch-required-before-any-codex-work",
    expected_pr_title: "Operator-scoped task required before PR title",
    task_goal:
      "Review the public-safe Codex Launch Card preview and provide an explicit operator prompt before any Codex implementation work.",
    task_summary:
      "Public-safe fixture fallback. It is not Codex execution, branch creation, PR creation, launch action, copy/export, or handoff send.",
    context_anchors: [
      "fixtures/codex-launch-card.sample.v0.1.json",
      "docs/HANDOFF_CAPSULE_CONTRACT_V0_1.md",
      "docs/AUTHORITY_MATRIX.md",
    ],
    observed_context: [
      {
        context_id: "handoff.observed.launch_card_web_preview_fallback",
        source_observation_id:
          "observed.launch_card_web_preview_fallback",
        kind: "web_preview_public_safe_fallback",
        summary:
          "Codex Launch Card Web preview is using a public-safe fixture fallback.",
        source_refs: [...HANDOFF_PREVIEW_PUBLIC_SAFE_FALLBACK_REFS],
        related_delta_ids: [],
        confidence: "observed",
        notes: [
          reason,
          "This is not live task assignment, branch creation, PR creation, or Codex execution state.",
        ],
      },
      ...LAUNCH_CARD_SAMPLE.observed_context.slice(0, 2),
    ],
    source_refs: {
      ...LAUNCH_CARD_SAMPLE.source_refs,
      guide_brief_ref: "public_safe_fixture_fallback:guide_brief",
      current_working_perspective_ref:
        "public_safe_fixture_fallback:current_working_perspective",
      delta_projection_ref:
        "public_safe_fixture_fallback:augnes_delta_projection",
      workplane_ref: "public_safe_fixture_fallback:/workbench",
      perspective_snapshot_refs: [],
      delta_ids: [],
      batch_ids: [],
      evidence_refs: [],
      artifact_refs: [],
      handoff_refs: [],
      diagnostic_refs: ["public_safe_fixture_fallback:codex_launch_card"],
      route_refs: [...HANDOFF_PREVIEW_ROUTE_REFS],
      docs_refs: uniqueSorted([
        ...HANDOFF_PREVIEW_DOC_REFS,
        ...LAUNCH_CARD_SAMPLE.source_refs.docs_refs,
      ]),
      repo_refs: ["hynk-studio/augnes"],
    },
    expected_files: [
      "Operator prompt must supply expected files before Codex work.",
      "The Web preview does not create file authorization.",
    ],
    forbidden_files: [
      "app/** unless explicitly scoped by a future operator prompt",
      "components/** unless explicitly scoped by a future operator prompt",
      "app/api/** unless explicitly scoped by a future operator prompt",
      "apps/augnes_apps/** unless explicitly scoped by a future operator prompt",
      "migrations/**",
      "lib/db.ts",
      "provider/**",
      "proof/**",
      "evidence/**",
      "autonomy/**",
    ],
    required_checks: [
      "Operator prompt must supply required checks before Codex work.",
      "Report every skipped check with a concrete reason.",
    ],
    optional_checks: [],
    status: "preview_only",
    next_phase_notes: [...HANDOFF_PREVIEW_NEXT_PHASE_NOTES],
    public_safety: {
      ...LAUNCH_CARD_SAMPLE.public_safety,
      fixture_kind: "synthetic_sample",
      notes: [
        reason,
        "Public-safe fallback does not expose live route-composed runtime state.",
        "No status may mean executed.",
      ],
    },
  });
}

function buildFallbackPreview({
  reason,
  publicSafety,
  validationFailures,
}: {
  reason: string;
  publicSafety: HandoffPreviewPublicSafety;
  validationFailures: string[];
}): HandoffCapsulePreviewForWeb {
  const capsule = buildPublicSafeHandoffCapsulePreviewFallback(reason);
  const launchCard = buildPublicSafeCodexLaunchCardPreviewFallback(reason);

  return {
    capsule,
    launch_card: launchCard,
    source_status: {
      source: publicSafety,
      capsule: "public_safe_fixture_fallback",
      launch_card: "public_safe_fixture_fallback",
      source_disclosure:
        "Web preview is using committed public-safe fixture fallback data and is not displaying live route-composed runtime state.",
      synthetic_operator_supplied_fields: [
        "repo",
        "base_branch",
        "branch_suggestion",
        "expected_pr_title",
        "task_goal",
        "expected_files",
        "required_checks",
      ],
    },
    fallback_reasons: [reason, ...validationFailures],
    boundary_notes: [...HANDOFF_PREVIEW_BOUNDARY_NOTES],
    public_safety: publicSafety,
    route_refs: [...HANDOFF_PREVIEW_ROUTE_REFS],
    docs_refs: [...HANDOFF_PREVIEW_DOC_REFS],
    warnings: [
      "Handoff Capsule / Codex Launch Card Web preview is showing public-safe fallback data.",
      "Route-composed repo/task fields may be synthetic or operator-supplied preview defaults.",
      "Launch Card status never means executed.",
    ],
    gaps: [
      "Live route-composed preview data is unavailable without validated local read authorization.",
    ],
  };
}

function withPreviewNotes(capsule: HandoffCapsule): HandoffCapsule {
  return {
    ...capsule,
    next_phase_notes: uniqueSorted([
      ...capsule.next_phase_notes,
      ...HANDOFF_PREVIEW_NEXT_PHASE_NOTES,
    ]),
  };
}

function withLaunchCardPreviewNotes(
  launchCard: CodexLaunchCard,
): CodexLaunchCard {
  return {
    ...launchCard,
    next_phase_notes: uniqueSorted([
      ...launchCard.next_phase_notes,
      ...HANDOFF_PREVIEW_NEXT_PHASE_NOTES,
    ]),
  };
}

function uniqueSorted(values: readonly string[]): string[] {
  return [...new Set(values)].sort((left, right) => left.localeCompare(right));
}
