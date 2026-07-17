import {
  readGuideBriefForRoute,
  validateGuideBriefReadRequest,
} from "@/lib/guide/guide-brief-source";
import guideBriefSample from "@/fixtures/guide-brief.sample.v0.1.json";
import type { GuideBrief } from "@/types/guide-brief";

type GuideBriefWebReadContext = {
  request?: Request;
};

const GUIDE_BRIEF_PUBLIC_SAFE_FALLBACK_SOURCE =
  "public_safe_fixture_fallback" as const;

const GUIDE_BRIEF_PUBLIC_SAFE_FALLBACK_REFS = [
  "fixtures/guide-brief.sample.v0.1.json",
  "docs/GUIDEBRIEF_CONTRACT_V0_1.md",
] as const;

const GUIDE_BRIEF_WEB_NEXT_PHASE_NOTES = [
  "Phase 6C adds read-only Web Guide panel skeleton rendering.",
  "Web Guide display uses a public-safe fallback unless an explicit local read-only request context passes the Phase 6B GuideBrief route guard.",
  "Phase 6D ChatGPT App/MCP Guide tool remains deferred.",
  "Phase 6E Codex Guide alignment remains deferred.",
  "Manual Handoff Capsule / Codex Launch Card transport is retired; Project Home owns automatic native-host execution.",
] as const;

const GUIDE_BRIEF_SAMPLE = guideBriefSample as unknown as GuideBrief;

export function readGuideBriefForWeb(
  context: GuideBriefWebReadContext = {},
): GuideBrief {
  if (context.request) {
    const validation = validateGuideBriefReadRequest(context.request);

    if (validation.ok) {
      return withWebGuideNotes(
        readGuideBriefForRoute({ scope: validation.scope }),
      );
    }

    return buildPublicSafeGuideBriefFallback(
      `Local read-only GuideBrief request validation failed closed with ${validation.code}.`,
    );
  }

  return buildPublicSafeGuideBriefFallback(
    "No explicit local read-only request context was supplied to the Web Guide display.",
  );
}

export function buildPublicSafeGuideBriefFallback(reason: string): GuideBrief {
  return {
    ...GUIDE_BRIEF_SAMPLE,
    observed: [
      {
        observation_id: "observed.web_guide_public_safe_fallback",
        kind: "web_guide_public_safe_fallback",
        summary:
          "Web Guide display is using a public-safe GuideBrief fixture fallback.",
        source_refs: [...GUIDE_BRIEF_PUBLIC_SAFE_FALLBACK_REFS],
        related_delta_ids: [],
        confidence: "observed",
        notes: [
          reason,
          "This is not live Current Working Perspective or Delta Projection runtime state.",
          "Live GuideBrief data remains marker-gated and local-host-gated by the Phase 6B route boundary.",
        ],
      },
      {
        observation_id: "observed.web_guide_local_guard_preserved",
        kind: "web_guide_local_guard_preserved",
        summary:
          "Public Web surfaces do not bypass the GuideBrief local read guard.",
        source_refs: [
          "lib/guide/read-guide-brief-for-web.ts",
          "lib/guide/guide-brief-source.ts",
          "app/api/augnes/read/guide-brief/route.ts",
        ],
        related_delta_ids: [],
        confidence: "observed",
        notes: [
          "readGuideBriefForRoute is called only after validateGuideBriefReadRequest succeeds.",
          "The default Web Guide render path returns fallback data.",
        ],
      },
    ],
    inferred: [
      {
        inference_id: "inferred.web_guide_runtime_state_hidden_by_default",
        summary:
          "Because no validated local read context is present, runtime GuideBrief state should be treated as unavailable to this Web render.",
        basis_observation_ids: [
          "observed.web_guide_public_safe_fallback",
          "observed.web_guide_local_guard_preserved",
        ],
        source_refs: [...GUIDE_BRIEF_PUBLIC_SAFE_FALLBACK_REFS],
        confidence: "high",
        caveats: [
          "This inference describes the Web Guide display boundary, not the underlying runtime database.",
        ],
        non_authority_notes: [
          "The fallback cannot authorize live reads, writes, handoffs, or execution.",
        ],
      },
    ],
    suggested: [
      {
        suggestion_id: "suggested.use_marker_gated_route_for_live_local_reads",
        title: "Use the marker-gated local route for live GuideBrief reads",
        summary:
          "When live GuideBrief data is needed, request the Phase 6B GET-only route with the required local host, scope, and read-only marker.",
        suggested_surface: "agent_workplane",
        suggested_actor: "operator",
        priority: "medium",
        required_checks: [
          "Host must satisfy the local read-only guard.",
          "Header x-augnes-local-readonly must equal guide-brief-v0.1.",
          "Scope must equal project:augnes.",
        ],
        blocked_by: [
          "No validated local read-only request context is available to this Web render.",
        ],
        source_refs: [
          "app/api/augnes/read/guide-brief/route.ts",
          "lib/guide/guide-brief-source.ts",
        ],
        related_delta_ids: [],
        authority_boundary_summary:
          "Suggestion only; it does not call the route, fetch data, mutate state, or execute work.",
      },
      {
        suggestion_id: "suggested.keep_fallback_status_visible",
        title: "Keep fallback/source status visible",
        summary:
          "Render the public-safe fallback source status near GuideBrief sections so the packet is not mistaken for live runtime state.",
        suggested_surface: "human_home",
        suggested_actor: "operator",
        priority: "medium",
        required_checks: [
          "Observed, Inferred, Suggested, and Needs user judgment remain separate.",
          "Authority boundary booleans remain false.",
        ],
        blocked_by: [],
        source_refs: [...GUIDE_BRIEF_PUBLIC_SAFE_FALLBACK_REFS],
        related_delta_ids: [],
        authority_boundary_summary:
          "Display suggestion only; no UI action, write, publish, or handoff authority.",
      },
    ],
    needs_user_judgment: [
      {
        judgment_id: "judgment.web_guide_live_context_needed",
        question:
          "Should this Web Guide render use only the public-safe fallback, or should a separately scoped local-only surface pass an authorized request context?",
        why_it_matters:
          "Public Web surfaces must not expose live Current Working Perspective or Delta Projection-derived GuideBrief content without the Phase 6B local read guard.",
        options: [
          "Keep the public-safe fallback.",
          "Add a separately scoped local-only surface that passes a validated request context.",
          "Defer live Web Guide data until a later explicitly scoped phase.",
        ],
        source_refs: [...GUIDE_BRIEF_PUBLIC_SAFE_FALLBACK_REFS],
        related_delta_ids: [],
        urgency: "medium",
        blocked_until_decided: [
          "Any public Web Guide live runtime data display",
          "Any Web Guide handoff or execution path",
        ],
      },
    ],
    current_perspective_summary: {
      ...GUIDE_BRIEF_SAMPLE.current_perspective_summary,
      current_thesis:
        "Public Web Guide fallback is displayed because no validated local read-only GuideBrief request context was supplied.",
      active_goal_count: 0,
      open_question_count: 1,
      active_risk_count: 0,
      research_pressure_level: GUIDE_BRIEF_PUBLIC_SAFE_FALLBACK_SOURCE,
      staleness_status: "fallback",
      source_status: {
        current_working_perspective: GUIDE_BRIEF_PUBLIC_SAFE_FALLBACK_SOURCE,
        delta_projection: GUIDE_BRIEF_PUBLIC_SAFE_FALLBACK_SOURCE,
      },
      source_refs: [...GUIDE_BRIEF_PUBLIC_SAFE_FALLBACK_REFS],
    },
    delta_summary: {
      ...GUIDE_BRIEF_SAMPLE.delta_summary,
      projected_delta_count: 0,
      batch_count: 0,
      gap_count: 1,
      needs_review_count: 0,
      blocked_count: 0,
      manual_review_count: 0,
      important_delta_refs: [],
      source_refs: [...GUIDE_BRIEF_PUBLIC_SAFE_FALLBACK_REFS],
    },
    workplane_summary: {
      ...GUIDE_BRIEF_SAMPLE.workplane_summary,
      source_fallback_status: [
        `${GUIDE_BRIEF_PUBLIC_SAFE_FALLBACK_SOURCE}: ${reason}`,
        "Live GuideBrief route data remains marker-gated and local-host-gated.",
        "No live Current Working Perspective or Delta Projection runtime state is exposed by default Web Guide rendering.",
      ],
      authority_boundary_summary:
        "Web Guide fallback is read-only public-safe display; it adds no route, UI action, send, apply, approve, reject, or execution authority.",
    },
    review_queue_summary: {
      ...GUIDE_BRIEF_SAMPLE.review_queue_summary,
      needs_review_count: 0,
      blocked_count: 0,
      manual_review_count: 0,
      validation_required_count: 0,
      project_perspective_review_count: 0,
      durable_memory_review_count: 0,
      user_decision_count: 1,
      total_attention_count: 1,
      source_refs: [...GUIDE_BRIEF_PUBLIC_SAFE_FALLBACK_REFS],
    },
    handoff_candidates: [],
    staleness_warnings: [
      {
        warning_id: "staleness.web_guide_public_safe_fallback",
        summary:
          "Web Guide is showing public-safe fallback data, not live runtime GuideBrief state.",
        severity: "medium",
        source_refs: [...GUIDE_BRIEF_PUBLIC_SAFE_FALLBACK_REFS],
        refresh_suggestion:
          "Use the Phase 6B local read-only route with the required marker and local host when live GuideBrief data is explicitly authorized.",
        blocks_handoff: true,
      },
    ],
    source_refs: {
      ...GUIDE_BRIEF_SAMPLE.source_refs,
      current_working_perspective_ref:
        "public_safe_fixture_fallback:current_working_perspective",
      delta_projection_ref: "public_safe_fixture_fallback:delta_projection",
      workplane_ref: "public_safe_fixture_fallback:/workbench",
      perspective_snapshot_refs: [],
      delta_ids: [],
      batch_ids: [],
      evidence_refs: [],
      artifact_refs: [],
      handoff_refs: [],
      diagnostic_refs: ["public_safe_fixture_fallback:web_guide_boundary"],
      route_refs: ["/", "/perspective", "/workbench"],
      docs_refs: [
        ...GUIDE_BRIEF_PUBLIC_SAFE_FALLBACK_REFS,
        "app/api/augnes/read/guide-brief/route.ts",
        "lib/guide/guide-brief-source.ts",
      ],
    },
    gaps: [
      {
        code: "web_guide.public_safe_fallback",
        severity: "medium",
        summary:
          "Live GuideBrief route data is unavailable to this Web render without explicit local read authorization.",
        source_refs: [...GUIDE_BRIEF_PUBLIC_SAFE_FALLBACK_REFS],
        blocks_guide_confidence: true,
      },
    ],
    next_phase_notes: [...GUIDE_BRIEF_WEB_NEXT_PHASE_NOTES],
    public_safety: {
      ...GUIDE_BRIEF_SAMPLE.public_safety,
      fixture_kind: "synthetic_sample",
      contains_private_paths: false,
      contains_secrets: false,
      contains_api_keys: false,
      contains_github_tokens: false,
      contains_raw_private_conversations: false,
      contains_hidden_reasoning: false,
      contains_raw_provider_output: false,
      contains_raw_retrieval_output: false,
      contains_real_external_account_artifacts: false,
    },
  };
}

function withWebGuideNotes(guideBrief: GuideBrief): GuideBrief {
  return {
    ...guideBrief,
    next_phase_notes: [
      ...GUIDE_BRIEF_WEB_NEXT_PHASE_NOTES,
      "Live GuideBrief data was read only after the Phase 6B local read-only request guard validated the request context.",
    ],
  };
}
