import type { TemporalPreviewReviewArtifactInput } from "@/lib/temporal-review-artifacts";

export type TemporalPreviewReviewArtifactForbiddenPersistenceFixture = {
  name: string;
  description: string;
  mutate: (
    base: TemporalPreviewReviewArtifactInput,
  ) => TemporalPreviewReviewArtifactInput;
  expected_error_includes: string;
  forbidden_reason: string;
};

export function buildValidTemporalPreviewReviewArtifactFixture(
  overrides: Partial<TemporalPreviewReviewArtifactInput> = {},
): TemporalPreviewReviewArtifactInput {
  const base: TemporalPreviewReviewArtifactInput = {
    artifact_id: "temporal-review:fixture-valid",
    scope: "project:augnes",
    work_id: "AG-TEMPORAL-INTERPRETATION",
    source_route: "/api/temporal-interpretation/preview",
    source_surface: "local_runtime",
    source_ref: "lib/temporal-review-artifact-fixtures.ts",
    generator: "mock",
    model: null,
    as_of: "2026-05-14T00:00:00.000Z",
    capture_mode: "route_capture",
    preview_excerpt:
      "Bounded fixture preview excerpt for TemporalPreviewReviewArtifact validation.",
    bounded_preview_json: {
      current_interpretation: "Bounded Temporal Interpretation preview fixture.",
      non_authority_boundary:
        "Review artifact only; no approval, publish, replay, memory admission, or state commit.",
    },
    preview_hash: "sha256:temporal-review-artifact-fixture",
    source_refs: ["state:implementation.stack", "summary:agent_handoff.current_status"],
    evidence_anchor_refs: ["state:implementation.stack"],
    summary_refs: ["summary:agent_handoff.current_status"],
    counterexample_refs: ["boundary:summary_refs"],
    residual_tension_refs: ["tension:tension:unsafe-api-key-handling"],
    admission_decisions_json: [
      {
        candidate_id: "summary:agent_handoff.current_status",
        category: "exclude_summary_only",
      },
    ],
    guardrail_passed: true,
    guardrail_warnings_json: [],
    reviewer_verdict: "pass_with_notes",
    reviewer_notes: "Fixture validates bounded review-artifact persistence only.",
    manual_review_report_path:
      "docs/TEMPORAL_INTERPRETATION_MANUAL_REVIEW_REPORT_ROUTE_CAPTURE_V0_1.md",
    linked_evidence_record_ids: [],
    linked_session_id: null,
    linked_pr_url: null,
    redaction_status: "bounded",
    created_by: "codex-fixture",
    created_at: "2026-05-14T00:00:00.000Z",
    updated_at: "2026-05-14T00:00:00.000Z",
  };

  return {
    ...cloneTemporalReviewArtifactInput(base),
    ...overrides,
  };
}

const topLevelForbiddenFixtures = [
  "raw_openai_response",
  "approval_status",
  "publish_status",
  "replay_status",
  "commit_status",
  "memory_admission_status",
  "durable_perspective_snapshot_id",
  "secret_material",
  "cockpit_dom_as_truth",
  "safe_next_step_instruction",
  "user_preference_as_readiness",
  "summary_only_ref_as_evidence",
].map(
  (field): TemporalPreviewReviewArtifactForbiddenPersistenceFixture => ({
    name: `top_level_${field}`,
    description: `Reject top-level forbidden field ${field}.`,
    mutate: (base) => ({
      ...base,
      [field]: "forbidden",
    }),
    expected_error_includes: `${field} is forbidden`,
    forbidden_reason:
      "TemporalPreviewReviewArtifact rows must not store authority, raw model, secret, DOM-truth, readiness, or evidence-confusion fields.",
  }),
);

export const TEMPORAL_REVIEW_ARTIFACT_FORBIDDEN_PERSISTENCE_FIXTURES: TemporalPreviewReviewArtifactForbiddenPersistenceFixture[] =
  [
    ...topLevelForbiddenFixtures,
    {
      name: "nested_bounded_preview_raw_openai_response",
      description: "Reject raw OpenAI response nested in bounded_preview_json.",
      mutate: (base) => ({
        ...base,
        bounded_preview_json: {
          ...asRecord(base.bounded_preview_json),
          raw_openai_response: "forbidden raw response",
        },
      }),
      expected_error_includes: "raw_openai_response is forbidden",
      forbidden_reason:
        "The bounded preview field must not preserve raw full model responses.",
    },
    {
      name: "nested_bounded_preview_deep_memory_admission_status",
      description: "Reject deep memory admission status in bounded_preview_json.",
      mutate: (base) => ({
        ...base,
        bounded_preview_json: {
          ...asRecord(base.bounded_preview_json),
          deep: {
            memory_admission_status: "admitted",
          },
        },
      }),
      expected_error_includes: "memory_admission_status is forbidden",
      forbidden_reason:
        "Preview review artifacts cannot encode durable memory admission.",
    },
    {
      name: "nested_admission_decision_raw_openai_response",
      description: "Reject raw OpenAI response nested in admission decisions.",
      mutate: (base) => ({
        ...base,
        admission_decisions_json: [
          {
            candidate_id: "state:implementation.stack",
            category: "primary_active_context",
            raw_openai_response: "forbidden raw response",
          },
        ],
      }),
      expected_error_includes: "raw_openai_response is forbidden",
      forbidden_reason:
        "Admission decision records are bounded review data, not raw model payload storage.",
    },
    {
      name: "nested_admission_decision_approval_status",
      description: "Reject approval status nested in admission decisions.",
      mutate: (base) => ({
        ...base,
        admission_decisions_json: [
          {
            candidate_id: "state:implementation.stack",
            category: "primary_active_context",
            approval_status: "approved",
          },
        ],
      }),
      expected_error_includes: "approval_status is forbidden",
      forbidden_reason:
        "Admission decisions must not become approval-gated authority fields.",
    },
    {
      name: "nested_guardrail_warning_publish_status",
      description: "Reject publish status nested in guardrail warnings.",
      mutate: (base) => ({
        ...base,
        guardrail_warnings_json: [
          {
            code: "bounded-warning",
            publish_status: "ready",
          },
        ],
      }),
      expected_error_includes: "publish_status is forbidden",
      forbidden_reason:
        "Guardrail warnings cannot encode publication authority or readiness.",
    },
    {
      name: "nested_guardrail_warning_commit_status",
      description: "Reject commit status nested in guardrail warnings.",
      mutate: (base) => ({
        ...base,
        guardrail_warnings_json: [
          {
            code: "bounded-warning",
            commit_status: "committed",
          },
        ],
      }),
      expected_error_includes: "commit_status is forbidden",
      forbidden_reason:
        "Guardrail warnings cannot encode state commit authority.",
    },
    {
      name: "evidence_anchor_duplicates_summary_ref",
      description: "Reject evidence anchors that duplicate summary refs.",
      mutate: (base) => ({
        ...base,
        evidence_anchor_refs: ["summary:agent_handoff.current_status"],
        summary_refs: ["summary:agent_handoff.current_status"],
      }),
      expected_error_includes:
        "summary_refs must not be stored as evidence_anchor_refs",
      forbidden_reason:
        "Summary-only refs must remain separate from evidence anchors.",
    },
    {
      name: "evidence_anchor_uses_summary_namespace",
      description: "Reject summary namespace refs stored as evidence anchors.",
      mutate: (base) => ({
        ...base,
        evidence_anchor_refs: [
          "state:implementation.stack",
          "summary:agent_handoff.current_status",
        ],
      }),
      expected_error_includes:
        "summary_refs must not be stored as evidence_anchor_refs",
      forbidden_reason:
        "A summary-prefixed ref is not an evidence anchor even when not repeated in summary_refs.",
    },
    {
      name: "authority_reviewer_verdict_approved",
      description: "Reject reviewer verdict values that imply approval.",
      mutate: (base) => ({
        ...base,
        reviewer_verdict: "approved",
      }),
      expected_error_includes: "reviewer_verdict must be one of",
      forbidden_reason:
        "Reviewer verdict is manual review metadata, not approval authority.",
    },
    {
      name: "authority_capture_mode_approval",
      description: "Reject capture mode values that imply approval.",
      mutate: (base) => ({
        ...base,
        capture_mode: "approval",
      }),
      expected_error_includes: "capture_mode must be one of",
      forbidden_reason:
        "Capture mode identifies source capture mechanics, not approval workflow.",
    },
    {
      name: "authority_redaction_status_raw",
      description: "Reject raw redaction status.",
      mutate: (base) => ({
        ...base,
        redaction_status: "raw",
      }),
      expected_error_includes: "redaction_status must be one of",
      forbidden_reason:
        "Review artifacts may store only redacted, bounded, or raw-disallowed content.",
    },
    {
      name: "authority_guardrail_passed_approved",
      description: "Reject guardrail_passed values that imply approval.",
      mutate: (base) => ({
        ...base,
        guardrail_passed: "approved" as unknown as boolean,
      }),
      expected_error_includes: "guardrail_passed must be boolean-shaped",
      forbidden_reason:
        "Guardrail pass/fail is a boolean-shaped local check, not approval.",
    },
    {
      name: "authority_work_id_ag_004",
      description: "Reject generic Codex work anchor AG-004.",
      mutate: (base) => ({
        ...base,
        work_id: "AG-004",
      }),
      expected_error_includes: "work_id must be AG-TEMPORAL-INTERPRETATION",
      forbidden_reason:
        "Temporal Interpretation review artifacts must bind to the dedicated Temporal work anchor.",
    },
    {
      name: "authority_work_id_unseeded",
      description: "Reject missing or unseeded Temporal work anchors.",
      mutate: (base) => ({
        ...base,
        work_id: "AG-TEMPORAL-MISSING",
      }),
      expected_error_includes: "work_id must be AG-TEMPORAL-INTERPRETATION",
      forbidden_reason:
        "The current helper accepts only the seeded Temporal Interpretation work anchor.",
    },
    {
      name: "link_missing_session_id",
      description: "Reject linked_session_id when the session row is missing.",
      mutate: (base) => ({
        ...base,
        linked_session_id: "session:missing-temporal-review-fixture",
      }),
      expected_error_includes: "Unknown linked_session_id",
      forbidden_reason:
        "Review artifacts may link only to existing sessions and must not create sessions automatically.",
    },
    {
      name: "link_missing_evidence_record_id",
      description: "Reject linked_evidence_record_ids when evidence rows are missing.",
      mutate: (base) => ({
        ...base,
        linked_evidence_record_ids: ["evidence:missing-temporal-review-fixture"],
      }),
      expected_error_includes: "Unknown linked evidence_id",
      forbidden_reason:
        "Review artifacts may link only to existing structured evidence records.",
    },
    {
      name: "route_source_route_not_api",
      description: "Reject source routes that are not API route strings.",
      mutate: (base) => ({
        ...base,
        source_route: "scripts/capture-temporal-preview",
      }),
      expected_error_includes: "source_route must be a route string",
      forbidden_reason:
        "source_route records a route path, not a command, action, or invocation.",
    },
    {
      name: "route_bounded_preview_json_null",
      description: "Reject missing bounded_preview_json.",
      mutate: (base) => ({
        ...base,
        bounded_preview_json: null,
      }),
      expected_error_includes: "bounded_preview_json is required",
      forbidden_reason:
        "Review artifacts must store a bounded preview subset before persistence.",
    },
    {
      name: "route_source_refs_object",
      description: "Reject source_refs arrays containing non-string values.",
      mutate: (base) => ({
        ...base,
        source_refs: [{ ref: "state:implementation.stack" }],
      }),
      expected_error_includes:
        "source_refs must be a JSON array of non-empty strings",
      forbidden_reason:
        "Source refs must remain typed string refs rather than embedded objects.",
    },
  ];

function cloneTemporalReviewArtifactInput(
  input: TemporalPreviewReviewArtifactInput,
): TemporalPreviewReviewArtifactInput {
  return JSON.parse(JSON.stringify(input)) as TemporalPreviewReviewArtifactInput;
}

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return value as Record<string, unknown>;
}
