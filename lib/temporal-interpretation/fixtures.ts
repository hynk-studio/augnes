import { buildActiveContextAdmission } from "@/lib/temporal-interpretation/admission";
import { buildMockTemporalPreview } from "@/lib/temporal-interpretation/mock";
import {
  type ActiveContextAdmissionCategory,
  type TemporalInterpretationPreview,
  type TemporalPreviewContext,
} from "@/lib/temporal-interpretation/types";

export type TemporalHardeningFixture = {
  name: string;
  input_context: TemporalPreviewContext;
  output_preview: TemporalInterpretationPreview;
  expected_admission_categories: ActiveContextAdmissionCategory[];
  expected_guardrail_passed: boolean;
  expected_warning_text: string[];
};

const validContext = buildFixtureContext();
const validPreview = buildMockTemporalPreview(validContext);

export const TEMPORAL_HARDENING_FIXTURES: TemporalHardeningFixture[] = [
  {
    name: "valid_review_bounded_preview",
    input_context: validContext,
    output_preview: validPreview,
    expected_admission_categories: [
      "admit_primary_active",
      "exclude_summary_only",
      "admit_tension_active",
      "admit_boundary_active",
      "retain_recallable",
    ],
    expected_guardrail_passed: true,
    expected_warning_text: [],
  },
  {
    name: "summary_only_evidence_misuse",
    input_context: validContext,
    output_preview: {
      ...validPreview,
      evidence_anchors: [
        ...validPreview.evidence_anchors,
        {
          ref: "summary:agent_handoff.current_status",
          claim: "The summary proves implementation readiness.",
          source_type: "doc",
        },
      ],
      active_context_admission: {
        ...validPreview.active_context_admission!,
        decisions: [
          ...validPreview.active_context_admission!.decisions,
          {
            candidate_id: "summary:agent_handoff.current_status",
            category: "admit_primary_active",
            reason: "Incorrectly admitted summary as primary evidence.",
            source_authority: "summary_only",
            evidence_refs: ["summary:agent_handoff.current_status"],
            counterexample_refs: [],
            residual_tension_refs: [],
          },
        ],
      },
    },
    expected_admission_categories: ["admit_primary_active"],
    expected_guardrail_passed: false,
    expected_warning_text: [
      "summary-only support cannot be used as evidence anchors",
      "summary-only candidate cannot be admitted as primary evidence",
    ],
  },
  {
    name: "missing_counterexample",
    input_context: validContext,
    output_preview: {
      ...validPreview,
      counterexamples: [],
      active_context_admission: {
        ...validPreview.active_context_admission!,
        decisions: validPreview.active_context_admission!.decisions.map(
          (decision) => ({
            ...decision,
            counterexample_refs: [],
          }),
        ),
      },
    },
    expected_admission_categories: [],
    expected_guardrail_passed: false,
    expected_warning_text: [
      "counterexamples from context were not preserved",
      "active_context_admission omitted counterexample_refs",
    ],
  },
  {
    name: "user_preference_treated_as_factual_readiness",
    input_context: validContext,
    output_preview: {
      ...validPreview,
      user_context_vs_factuality:
        "User preference proves this is factually ready and preference grants implementation approval.",
    },
    expected_admission_categories: ["retain_recallable"],
    expected_guardrail_passed: false,
    expected_warning_text: [
      "User preference must not be treated as factual readiness",
    ],
  },
  {
    name: "overconfident_safe_next_step",
    input_context: validContext,
    output_preview: {
      ...validPreview,
      safe_next_step:
        "Approve and publish this result because it is ready to ship and fully verified.",
    },
    expected_admission_categories: [],
    expected_guardrail_passed: false,
    expected_warning_text: [
      "current_interpretation and safe_next_step must not imply approval",
    ],
  },
  {
    name: "full_p4_readiness_claim",
    input_context: validContext,
    output_preview: {
      ...validPreview,
      current_interpretation:
        "The preview is full P4 ready and complete for durable PerspectiveSnapshot runtime use.",
    },
    expected_admission_categories: [],
    expected_guardrail_passed: false,
    expected_warning_text: [
      "Preview must not claim full P4 implementation readiness by default.",
    ],
  },
  {
    name: "suppressed_residual_tension",
    input_context: validContext,
    output_preview: {
      ...validPreview,
      current_interpretation:
        "The preview has no residual tensions and is tension-free.",
      residual_tensions: [],
    },
    expected_admission_categories: ["admit_tension_active"],
    expected_guardrail_passed: false,
    expected_warning_text: [
      "residual tensions from context were not preserved",
      "must not claim there are no residual tensions",
    ],
  },
  {
    name: "duplicate_prior_context_excluded",
    input_context: validContext,
    output_preview: {
      ...validPreview,
      active_context_admission: {
        ...validPreview.active_context_admission!,
        decisions: [
          ...validPreview.active_context_admission!.decisions,
          {
            candidate_id: "state:product.name#duplicate",
            category: "exclude_duplicate",
            reason: "Duplicate of state:product.name already admitted.",
            source_authority: "committed_state",
            evidence_refs: ["state:product.name"],
            counterexample_refs: ["boundary:summary_refs"],
            residual_tension_refs: [],
          },
        ],
      },
    },
    expected_admission_categories: ["exclude_duplicate"],
    expected_guardrail_passed: true,
    expected_warning_text: [],
  },
  {
    name: "out_of_scope_prior_context_excluded",
    input_context: validContext,
    output_preview: {
      ...validPreview,
      active_context_admission: {
        ...validPreview.active_context_admission!,
        decisions: [
          ...validPreview.active_context_admission!.decisions,
          {
            candidate_id: "prior:unrelated-hosted-auth-plan",
            category: "exclude_out_of_scope",
            reason: "Hosted auth planning is outside this preview hardening slice.",
            source_authority: "out_of_scope",
            evidence_refs: [],
            counterexample_refs: ["boundary:summary_refs"],
            residual_tension_refs: [],
          },
        ],
      },
    },
    expected_admission_categories: ["exclude_out_of_scope"],
    expected_guardrail_passed: true,
    expected_warning_text: [],
  },
  {
    name: "stale_readiness_treated_as_active",
    input_context: validContext,
    output_preview: {
      ...validPreview,
      active_context_admission: {
        ...validPreview.active_context_admission!,
        decisions: [
          ...validPreview.active_context_admission!.decisions,
          {
            candidate_id: "readiness:stale-prior-demo",
            category: "admit_primary_active",
            reason: "Incorrectly treats stale readiness as active evidence.",
            source_authority: "stale_readiness",
            evidence_refs: ["readiness:stale-prior-demo"],
            counterexample_refs: ["boundary:summary_refs"],
            residual_tension_refs: [],
          },
        ],
      },
    },
    expected_admission_categories: ["admit_primary_active"],
    expected_guardrail_passed: false,
    expected_warning_text: [
      "non-authoritative or stale candidate cannot be admitted as active authority",
    ],
  },
];

function buildFixtureContext(): TemporalPreviewContext {
  const evidence_anchors = [
    {
      ref: "state:product.name",
      claim: "product.name is committed active state.",
      source_type: "committed_state" as const,
    },
    {
      ref: "action:temporal-preview-baseline",
      claim: "Temporal preview baseline route exists.",
      source_type: "action_record" as const,
    },
  ];
  const summary_refs = [
    {
      ref: "summary:agent_handoff.current_status",
      summary: "Summary says temporal preview exists.",
    },
    {
      ref: "summary:agent_handoff.next_recommended_action",
      summary: "Summary suggests reviewing hardening output.",
    },
  ];
  const counterexamples = [
    {
      ref: "boundary:summary_refs",
      description:
        "Summary-only refs can guide review but cannot be evidence anchors.",
    },
  ];
  const residual_tensions = [
    {
      ref: "tension:secret-handling",
      description:
        "Secret handling remains a boundary tension for runtime work.",
    },
  ];
  const user_preferences = [
    "Prefer a small hardening slice over broad PerspectiveSnapshot runtime.",
  ];

  return {
    scope: "project:augnes",
    as_of: "2026-05-14T00:00:00.000Z",
    current_interpretation:
      "Temporal preview can be reviewed as a read-only semantic interpretation layer while residual tension remains visible.",
    active_prior_context:
      "Committed state is evidence; summaries are guidance; pending readiness claims remain bounded.",
    evidence_anchors,
    summary_refs,
    source_authority_profile: {
      committed_state_authority: ["product.name"],
      summary_only_refs: summary_refs.map((item) => item.ref),
      allowed_now: ["render_preview", "run_local_guardrails"],
      blocked_now: [
        "commit_state",
        "publish_proof",
        "approve_work",
        "claim_full_p4_readiness",
      ],
    },
    counterexamples,
    residual_tensions,
    user_preferences,
    safe_next_step:
      "Review the preview with fixtures, preserve counterexamples and tensions, and keep durable runtime work out of scope.",
    non_authority_boundary:
      "This preview is non-authoritative: it does not commit state, approve work, publish proof, replay, or claim full P4 readiness.",
    active_context_admission_rationale: [
      {
        context_ref: "state:product.name",
        admission_role: "primary_active",
        why_admitted: "Committed state can anchor the preview.",
        why_not_merely_summary:
          "The ref is a committed state anchor, not a summary-only ref.",
      },
      {
        context_ref: "tension:secret-handling",
        admission_role: "tension_active",
        why_admitted: "Residual tension must constrain interpretation.",
        why_not_merely_summary:
          "The tension is preserved as a constraint rather than proof.",
      },
    ],
    active_context_admission: buildActiveContextAdmission({
      evidenceAnchors: evidence_anchors,
      summaryRefs: summary_refs,
      counterexamples,
      residualTensions: residual_tensions,
      userPreferences: user_preferences,
    }),
    suppressed_alternatives: [
      {
        alternative: "Persist durable PerspectiveSnapshot rows.",
        why_deferred: "Persistence is out of scope for this hardening slice.",
        what_would_change_status:
          "A separate runtime authority review approves persistence semantics.",
        status: "deferred",
      },
    ],
    temporal_hierarchy_view: {
      raw_observation_level: "Committed state and action records.",
      work_or_session_level: "This fixture is manual review context.",
      project_status_level: "Temporal preview remains a read-only demo layer.",
      current_interpretive_stance:
        "Reviewer-visible interpretation, not durable state.",
      hierarchy_caution:
        "Summaries organize context but cannot override evidence anchors.",
    },
    memory_lifecycle_view: {
      active_context: ["state:product.name"],
      retrieved_context: ["action:temporal-preview-baseline"],
      summary_or_view: summary_refs.map((item) => item.ref),
      stale_or_deferred_context: ["readiness:stale-prior-demo"],
      lifecycle_caution:
        "Lifecycle labels are review hints only and do not admit memory automatically.",
    },
    interpretive_drivers: [
      {
        axis: "factuality",
        driver: "Summary/evidence separation is under review.",
        effect: "Fixture checks reject summary-as-evidence drift.",
      },
      {
        axis: "boundary",
        driver: "The preview must remain non-authoritative.",
        effect: "Unsafe approval or publish language is rejected.",
      },
    ],
    axis_pressures: [
      {
        axis: "factuality",
        pressure: "high",
        reason: "Semantic fidelity depends on explicit evidence refs.",
      },
      {
        axis: "boundary",
        pressure: "high",
        reason: "The preview must not become a runtime authority.",
      },
    ],
  };
}
