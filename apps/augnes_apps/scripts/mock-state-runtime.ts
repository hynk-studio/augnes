import type {
  ActionRecordResult,
  AutonomyContractPreviewResult,
  AutonomyRunnerPreflightPreviewResult,
  CodexLaunchCardPreviewResult,
  CodexResultReviewDraft,
  ConstellationPreviewResult,
  ControlPacket,
  EvidencePackResult,
  GuideBriefResult,
  HandoffCapsulePreviewResult,
  GeneratedHandoffDraft,
  GenerateHandoffDraftInput,
  MailboxSummaryResult,
  ObserveResult,
  PlanResult,
  PublicationSummaryResult,
  SessionTraceResult,
  StateBrief,
  StateRuntimeActionResultInput,
  StateRuntimeAutonomyContractPreviewInput,
  StateRuntimeAutonomyRunnerPreflightInput,
  StateRuntimeBridgeAdapter,
  StateRuntimeCodexLaunchCardPreviewInput,
  StateRuntimeEvidencePackInput,
  StateRuntimeHandoffCapsulePreviewInput,
  StateRuntimeMessageInput,
  StateRuntimeProposal,
  StateRuntimeScope,
  StateRuntimeSessionTraceInput,
  StateRuntimeVerificationEvidenceRecordsInput,
  StateRuntimeWorkEventInput,
  ReviewCodexResultDraftInput,
  VerificationEvidenceRecordsResult,
  WorkBrief,
  WorkEventResult,
  WorkItem,
} from "../src/lib/state-runtime-types.js";

const proposal: StateRuntimeProposal = {
  id: "proposal-smoke-1",
  scope: "project:augnes",
  status: "pending",
  title: "Keep bridge read surface narrow",
};

const workItem: WorkItem = {
  work_id: "AG-001",
  scope: "project:augnes",
  title: "Work Trace Spine v0 and Work Focus View",
  status: "in_progress",
  priority: "now",
  summary: "Expose focused work trace packets without changing durable state authority.",
  next_action: "Verify work bridge read tools and gated event recording.",
  user_attention_required: false,
  related_state_keys: ["current_focus"],
  links: {
    issue: "https://github.com/Aurna-code/augnes/issues/37",
    docs: ["docs/OPS_PLAYBOOK.md"],
  },
  created_at: "2026-05-07T00:00:00.000Z",
  updated_at: "2026-05-07T00:05:00.000Z",
};

const verificationEvidenceRecord = {
  evidence_id: "evidence:smoke-1",
  scope: "project:augnes",
  work_id: "AG-001",
  publication_id: null,
  delivery_id: null,
  target_surface: "chatgpt_developer_mode",
  target_ref: "local-bridge",
  evidence_kind: "check_passed",
  status: "passed",
  label: "Bridge smoke verification",
  summary: "Mock verification evidence record for cross-session read tooling.",
  created_at: "2026-05-08T00:00:00.000Z",
  updated_at: "2026-05-08T00:00:00.000Z",
} as const;

const handoffPreviewAuthorityBoundary = {
  source_of_truth: false,
  can_commit_or_reject_state: false,
  can_record_proof: false,
  can_create_evidence: false,
  can_update_work: false,
  can_mutate_memory: false,
  can_apply_project_perspective: false,
  can_publish_external: false,
  can_merge: false,
  can_retry_replay_deploy: false,
  can_call_github: false,
  can_call_openai_or_provider: false,
  can_execute_codex: false,
  can_create_branch_or_pr: false,
  can_send_handoff: false,
  can_launch_codex: false,
  can_launch_autonomy: false,
  can_create_mcp_tool: false,
  can_create_ui_action: false,
  can_post_external_comment: false,
  notes: [
    "Mock Handoff Capsule and Codex Launch Card previews are read-only.",
    "Suggestions are advisory only.",
    "Unresolved user judgment remains unresolved.",
    "No status may mean executed.",
  ],
} as const;

const handoffPreviewRouteAuthorityBoundary = [
  "GET-only local read-only Handoff Capsule / Codex Launch Card route",
  "preview JSON only",
  "no handoff send authority",
  "no Codex execution authority",
  "no GitHub actuation authority",
  "no provider/OpenAI authority",
  "no branch/PR creation authority from Augnes product code",
  "no proof/evidence write authority",
  "no state, memory, DB, work, or Perspective mutation authority",
] as const;

const autonomyPreviewAuthorityBoundary = {
  source_of_truth: false,
  can_commit_or_reject_state: false,
  can_record_proof: false,
  can_create_evidence: false,
  can_update_work: false,
  can_mutate_memory: false,
  can_apply_project_perspective: false,
  can_publish_external: false,
  can_merge: false,
  can_retry_replay_deploy: false,
  can_call_github: false,
  can_call_openai_or_provider: false,
  can_execute_codex: false,
  can_create_branch_or_pr: false,
  can_send_handoff: false,
  can_launch_codex: false,
  can_launch_autonomy: false,
  can_schedule_background_work: false,
  can_create_mcp_tool: false,
  can_create_ui_action: false,
  can_post_external_comment: false,
  can_write_db: false,
  can_start_daemon: false,
  notes: [
    "Mock Autonomy Contract preview is read-only.",
    "Contract is preview-only.",
    "Contract does not run.",
    "Contract does not schedule.",
    "Contract does not launch Codex.",
    "Contract does not call GitHub or providers.",
    "Contract does not mutate state/memory/work/Perspective.",
    "Contract does not send handoffs.",
    "Contract does not create proof/evidence.",
    "Future runner requires separate Phase 9 scope and explicit approval.",
  ],
} as const;

const autonomyPreviewRouteAuthorityBoundary = [
  "GET-only local read-only Autonomy Contract route",
  "fail-closed scope and local marker validation",
  "preview JSON only",
  "no autonomy runner authority",
  "no scheduler authority",
  "no daemon authority",
  "no background work authority",
  "no DB schema or migration authority",
  "no DB write authority",
  "no proof/evidence write authority",
  "no memory mutation authority",
  "no durable Perspective apply authority",
  "no provider/OpenAI authority",
  "no GitHub actuation authority",
  "no Codex execution authority",
  "no Codex launch authority",
  "no branch/PR creation authority from Augnes product code",
  "no MCP/App write tool authority",
  "no UI action authority",
  "no handoff send authority",
  "no external side effect authority",
] as const;

const autonomyRunnerPreflightAuthorityBoundary = {
  source_of_truth: false,
  can_start_runner: false,
  can_schedule_runner: false,
  can_start_daemon: false,
  can_start_background_work: false,
  can_commit_or_reject_state: false,
  can_record_proof: false,
  can_create_evidence: false,
  can_update_work: false,
  can_mutate_memory: false,
  can_apply_project_perspective: false,
  can_publish_external: false,
  can_merge: false,
  can_retry_replay_deploy: false,
  can_call_github: false,
  can_call_openai_or_provider: false,
  can_execute_codex: false,
  can_create_branch_or_pr: false,
  can_send_handoff: false,
  can_launch_codex: false,
  can_launch_autonomy: false,
  can_schedule_background_work: false,
  can_create_mcp_tool: false,
  can_create_ui_action: false,
  can_post_external_comment: false,
  can_write_db: false,
  can_spend_budget: false,
  can_auto_apply_delta: false,
  notes: [
    "Mock Autonomy Runner Preflight preview is read-only.",
    "Preflight does not start a runner.",
    "Dry-run plan does not execute.",
    "No scheduler, daemon, or background work is created.",
    "No Codex, GitHub, OpenAI, provider, DB, proof, evidence, memory, Perspective, handoff, auto-apply, budget spend, publish, merge, retry, replay, deploy, or external side effect authority is granted.",
  ],
} as const;

const autonomyRunnerPreflightPublicSafety = {
  fixture_kind: "synthetic_sample",
  contains_private_conversation: false,
  contains_hidden_reasoning: false,
  contains_local_private_paths: false,
  contains_secrets_or_tokens: false,
  contains_raw_provider_output: false,
  contains_raw_retrieval_output: false,
  contains_real_account_artifacts: false,
  notes: [
    "Synthetic public-safe mock preview.",
    "No private conversation.",
    "No hidden reasoning.",
    "No local private paths.",
    "No secrets/tokens.",
    "No raw provider output.",
    "No raw retrieval output.",
    "No real account artifacts.",
  ],
} as const;

function buildMockHandoffCapsulePreviewRouteResponse(
  scope: StateRuntimeScope,
  target = "codex_handoff",
): HandoffCapsulePreviewResult {
  return {
    response_version: "handoff_capsule_route_response.v0.1",
    runtime: "augnes",
    scope,
    route_id: "augnes.read.handoff_capsule.v0.1",
    route_family: "handoff_capsule",
    capsule: {
      runtime: "augnes",
      capsule_version: "handoff_capsule.v0.1",
      scope,
      capsule_id: "handoff_capsule.mock.chatgpt_app.v0.1.preview",
      created_at: "2026-05-10T00:00:00.000Z",
      source_guide_brief_ref: "guide_brief:mock:2026-05-10T00:00:00.000Z",
      source_snapshot_refs: ["snapshot:handoff-capsule-smoke"],
      target_surface: target,
      target_actor: "codex",
      handoff_intent: "implementation_preparation",
      status: "preview_only",
      title: "Mock Codex handoff capsule preview",
      summary: "Synthetic App/MCP preview response; not sent, launched, executed, or persisted.",
      thesis: "Mock preview packets prepare context while preserving read-only authority boundaries.",
      observed_context: [
        {
          context_id: "handoff.mock.observed.1",
          kind: "current_thesis",
          summary: "Mock observed context stays source-backed in the preview packet.",
          source_refs: ["docs/HANDOFF_CAPSULE_CONTRACT_V0_1.md"],
          related_delta_ids: ["delta:handoff-smoke"],
          confidence: "observed",
          notes: ["Mock route response for App/MCP smoke."],
        },
      ],
      inferred_context: [
        {
          context_id: "handoff.mock.inferred.1",
          summary: "Mock inferred context remains derived and caveated.",
          basis_observation_ids: ["handoff.mock.observed.1"],
          source_refs: ["docs/HANDOFF_CAPSULE_CONTRACT_V0_1.md"],
          confidence: "medium",
          caveats: ["Synthetic preview only."],
          non_authority_notes: ["Inference is not a source fact."],
        },
      ],
      suggested_context: [
        {
          context_id: "handoff.mock.suggested.1",
          title: "Review preview packet",
          summary: "Advisory only; not a command and not executed by the tool.",
          suggested_surface: "chatgpt_app",
          suggested_actor: "operator",
          priority: "next",
          required_checks: ["npm run smoke:chatgpt-app-handoff-capsule-tool-v0-1"],
          blocked_by: [],
          source_refs: ["docs/HANDOFF_CAPSULE_CONTRACT_V0_1.md"],
          related_delta_ids: ["delta:handoff-smoke"],
          advisory_only: true,
          authority_boundary_summary: "Suggestions are advisory only.",
        },
      ],
      needs_user_judgment: [
        {
          context_id: "handoff.mock.judgment.1",
          question: "Should a future operator prompt authorize Codex work?",
          why_it_matters: "The preview tool cannot decide or launch work.",
          options: ["Explicitly scope a future Codex task", "Hold"],
          source_refs: ["docs/HANDOFF_CAPSULE_CONTRACT_V0_1.md"],
          related_delta_ids: [],
          urgency: "medium",
          blocked_until_decided: ["No launch or send authority exists in this tool."],
          decided_by_packet: false,
        },
      ],
      source_refs: {
        guide_brief_ref: "guide_brief:mock:2026-05-10T00:00:00.000Z",
        current_working_perspective_ref: "/api/perspective/current?scope=project%3Aaugnes",
        delta_projection_ref: "/api/augnes/read/deltas?scope=project%3Aaugnes",
        workplane_ref: "/workbench",
        perspective_snapshot_refs: ["snapshot:handoff-capsule-smoke"],
        delta_ids: ["delta:handoff-smoke"],
        batch_ids: ["batch:handoff-smoke"],
        evidence_refs: [],
        artifact_refs: [],
        handoff_refs: ["handoff:mock-preview"],
        diagnostic_refs: ["diagnostic:handoff-smoke"],
        route_refs: [
          "/api/augnes/read/handoff-capsule?scope=project:augnes&target=codex_handoff",
          "/api/augnes/read/codex-launch-card?scope=project:augnes",
        ],
        docs_refs: [
          "docs/HANDOFF_CAPSULE_CONTRACT_V0_1.md",
          "docs/CHATGPT_APP_MCP_READONLY_SURFACE_BOUNDARY_V0_1.md",
        ],
        repo_refs: ["hynk-studio/augnes"],
      },
      selected_delta_refs: [
        {
          delta_id: "delta:handoff-smoke",
          reason: "Mock selected delta ref for preview smoke.",
          source_refs: ["docs/HANDOFF_CAPSULE_CONTRACT_V0_1.md"],
        },
      ],
      evidence_refs: [],
      artifact_refs: [],
      diagnostic_refs: ["diagnostic:handoff-smoke"],
      constraints: {
        allowed_change_scope: ["Read-only preview inspection only."],
        boundary_notes: ["No send, launch, execution, post, merge, publish, or state mutation."],
        skipped_check_policy: ["Skipped checks must be reported with concrete reasons."],
        public_safety: ["Synthetic mock preview contains no private account artifacts."],
        non_goals: ["Codex execution", "GitHub actuation", "proof/evidence writes"],
      },
      forbidden_actions: [
        "No handoff send.",
        "No Codex launch or execution.",
        "No GitHub/OpenAI/provider calls.",
        "No branch/PR creation.",
        "No proof/evidence writes.",
        "No state, memory, DB, work, or Perspective mutation.",
      ],
      expected_inputs: ["Marker-gated local read request."],
      expected_outputs: ["Preview JSON only."],
      validation_expectations: {
        required_checks: ["npm run smoke:chatgpt-app-handoff-capsule-tool-v0-1"],
        optional_checks: [],
        skipped_check_policy: ["Report skipped checks honestly."],
        success_criteria: ["Preview remains read-only and model-only."],
      },
      staleness: {
        status: "unknown",
        as_of: "2026-05-10T00:00:00.000Z",
        warnings: ["Synthetic mock preview."],
        refresh_suggestion: "Use the Phase 7B route through the App adapter.",
      },
      authority_boundary: handoffPreviewAuthorityBoundary,
      target_rendering: {
        primary_sections: ["Observed", "Inferred", "Suggested", "Needs user judgment"],
        preserve_separation: true,
        compact_summary: "Mock Handoff Capsule preview.",
        copy_behavior: "not_copyable",
        action_controls: false,
        notes: ["Model-only App/MCP tool response."],
      },
      gaps: [],
      next_phase_notes: ["Phase 7D App/MCP read-only preview tool smoke."],
      public_safety: {
        fixture_kind: "synthetic_sample",
        contains_private_conversations: false,
        contains_hidden_reasoning: false,
        contains_local_private_paths: false,
        contains_secrets: false,
        contains_tokens: false,
        contains_raw_provider_output: false,
        contains_raw_retrieval_output: false,
        contains_real_account_artifacts: false,
        notes: ["Synthetic public-safe mock preview."],
      },
    },
    route_authority_boundary: [...handoffPreviewRouteAuthorityBoundary],
    source_status: {
      guide_brief: "synthetic_mock_guide_brief",
      capsule: "synthetic_mock_handoff_capsule_preview",
      synthetic_operator_supplied_fields: ["repo", "base_branch", "expected_files", "required_checks"],
      source_disclosure: "Synthetic mock preview for App/MCP smoke; does not claim live runtime state.",
    },
    warnings: ["Mock Handoff Capsule preview is synthetic.", "Launch Card status never means executed."],
    gaps: [],
  };
}

function buildMockCodexLaunchCardPreviewRouteResponse(
  scope: StateRuntimeScope,
): CodexLaunchCardPreviewResult {
  const capsuleResponse = buildMockHandoffCapsulePreviewRouteResponse(scope);

  return {
    response_version: "codex_launch_card_route_response.v0.1",
    runtime: "augnes",
    scope,
    route_id: "augnes.read.codex_launch_card.v0.1",
    route_family: "codex_launch_card",
    launch_card: {
      runtime: "augnes",
      card_version: "codex_launch_card.v0.1",
      scope,
      launch_card_id: "codex_launch_card.mock.chatgpt_app.v0.1.preview",
      created_at: "2026-05-10T00:00:00.000Z",
      source_capsule_id: capsuleResponse.capsule.capsule_id,
      source_guide_brief_ref: capsuleResponse.capsule.source_guide_brief_ref,
      repo: "hynk-studio/augnes",
      base_branch: "main",
      branch_suggestion: "operator-scoped-branch-required-before-any-codex-work",
      expected_pr_title: "Operator-scoped task required before PR title",
      task_goal: "Review the mock Launch Card preview; do not execute or launch Codex.",
      task_summary: "Synthetic preview-only Launch Card for App/MCP smoke validation.",
      context_anchors: [capsuleResponse.capsule.capsule_id, "docs/HANDOFF_CAPSULE_CONTRACT_V0_1.md"],
      observed_context: capsuleResponse.capsule.observed_context,
      inferred_context: capsuleResponse.capsule.inferred_context,
      suggestions_for_codex: [
        {
          suggestion_id: "codex_launch_card.mock.suggestion.1",
          title: "Treat preview suggestions as advisory",
          summary: "Do not treat Launch Card suggestions as commands.",
          source_refs: ["docs/HANDOFF_CAPSULE_CONTRACT_V0_1.md"],
          related_delta_ids: ["delta:handoff-smoke"],
          required_checks: ["npm run smoke:chatgpt-app-handoff-capsule-tool-v0-1"],
          blocked_by: ["Explicit future operator prompt"],
          advisory_only: true,
          active_operator_prompt_required: true,
        },
      ],
      unresolved_user_judgment: capsuleResponse.capsule.needs_user_judgment,
      expected_files: ["Operator prompt must supply expected files before Codex work."],
      forbidden_files: ["migrations/**", "lib/db.ts", "provider/**", "proof/**", "evidence/**", "autonomy/**"],
      allowed_change_scope: ["None from this App/MCP preview tool."],
      forbidden_actions: capsuleResponse.capsule.forbidden_actions,
      required_checks: ["Operator prompt must supply required checks before Codex work."],
      optional_checks: [],
      skipped_check_policy: ["Skipped checks must be reported with concrete reasons."],
      pr_body_requirements: ["Summary", "Files changed", "Validation", "Skipped checks", "Authority boundary statement"],
      final_report_requirements: ["PR URL", "Commit SHA", "Validation results", "No merge statement"],
      proof_evidence_boundary: ["No proof/evidence write authority in this preview tool."],
      source_refs: capsuleResponse.capsule.source_refs,
      staleness: capsuleResponse.capsule.staleness,
      authority_boundary: handoffPreviewAuthorityBoundary,
      status: "preview_only",
      next_phase_notes: capsuleResponse.capsule.next_phase_notes,
      public_safety: capsuleResponse.capsule.public_safety,
    },
    route_authority_boundary: [...handoffPreviewRouteAuthorityBoundary],
    source_status: {
      guide_brief: "synthetic_mock_guide_brief",
      capsule: "synthetic_mock_handoff_capsule_preview",
      launch_card: "synthetic_mock_codex_launch_card_preview",
      synthetic_operator_supplied_fields: ["repo", "base_branch", "expected_files", "required_checks"],
      source_disclosure: "Synthetic mock preview for App/MCP smoke; does not claim live runtime state.",
    },
    warnings: ["Mock Codex Launch Card preview is synthetic.", "No status may mean executed."],
    gaps: [],
  };
}

function buildMockAutonomyContractPreviewRouteResponse(
  scope: StateRuntimeScope,
): AutonomyContractPreviewResult {
  return {
    response_version: "autonomy_contract_route_response.v0.1",
    runtime: "augnes",
    scope,
    route_id: "augnes.read.autonomy_contract.v0.1",
    route_family: "autonomy_contract",
    contract: {
      runtime: "augnes",
      contract_version: "autonomy_contract.v0.1",
      scope,
      contract_id: "autonomy_contract.mock.chatgpt_app.v0.1.preview",
      created_at: "2026-05-10T00:00:00.000Z",
      status: "preview_only",
      autonomy_mode: "scheduled_hunt_preview",
      title: "Mock Autonomy Contract preview",
      goal: "Preview a future bounded autonomy delegation contract for Augnes without running autonomy.",
      bounded_context_summary:
        "Synthetic App/MCP preview response; not live autonomy state, not active run state, not budget approval, and not spend permission.",
      source_refs: {
        guide_brief_refs: ["guide_brief:mock:2026-05-10T00:00:00.000Z"],
        handoff_capsule_refs: ["handoff_capsule.mock.chatgpt_app.v0.1.preview"],
        codex_launch_card_refs: ["codex_launch_card.mock.chatgpt_app.v0.1.preview"],
        current_working_perspective_refs: ["/api/perspective/current?scope=project%3Aaugnes"],
        delta_projection_refs: ["/api/augnes/read/deltas?scope=project%3Aaugnes"],
        workplane_refs: ["/workbench"],
        delta_ids: ["delta:autonomy-contract-smoke"],
        batch_ids: ["batch:autonomy-contract-smoke"],
        evidence_refs: [],
        artifact_refs: [],
        handoff_refs: ["handoff:mock-preview"],
        diagnostic_refs: ["diagnostic:autonomy-contract-smoke"],
        route_refs: ["/api/augnes/read/autonomy-contract?scope=project:augnes"],
        docs_refs: [
          "docs/AUTONOMY_CONTRACT_V0_1.md",
          "docs/CHATGPT_APP_MCP_READONLY_SURFACE_BOUNDARY_V0_1.md",
          "docs/GUIDEBRIEF_CONTRACT_V0_1.md",
          "docs/HANDOFF_CAPSULE_CONTRACT_V0_1.md",
          "docs/CODEX_HANDOFF_CAPSULE_CONSUMPTION_V0_1.md",
          "docs/AUGNES_DELTA_CONTRACT_V0_1.md",
          "docs/AUTHORITY_MATRIX.md",
          "docs/AGENT_WORKPLANE_V0_1.md",
        ],
        repo_refs: ["hynk-studio/augnes"],
      },
      guide_brief_ref: "guide_brief:mock:2026-05-10T00:00:00.000Z",
      handoff_capsule_refs: ["handoff_capsule.mock.chatgpt_app.v0.1.preview"],
      codex_launch_card_refs: ["codex_launch_card.mock.chatgpt_app.v0.1.preview"],
      current_working_perspective_ref: "/api/perspective/current?scope=project%3Aaugnes",
      delta_projection_ref: "/api/augnes/read/deltas?scope=project%3Aaugnes",
      context_scope: {
        includes: ["GuideBrief preview", "Handoff Capsule preview", "Codex Launch Card preview"],
        excludes: ["Active runner state", "Active schedule", "Provider output", "Private account artifacts"],
      },
      allowed_agents: ["chatgpt", "codex"],
      allowed_surfaces: ["chatgpt_review", "agent_workplane_preview", "codex_handoff"],
      allowed_actions: [
        "read_current_perspective",
        "read_delta_projection",
        "read_guide_brief",
        "read_handoff_capsule_preview",
        "read_codex_launch_card_preview",
        "summarize_context",
        "rank_candidate_deltas",
        "prepare_review_packet",
        "prepare_codex_handoff_preview",
        "draft_report_preview",
      ],
      forbidden_actions: [
        "execute_codex",
        "call_github",
        "call_openai_or_provider",
        "create_branch_or_pr",
        "send_handoff",
        "write_db",
        "record_proof",
        "create_evidence",
        "mutate_memory",
        "apply_project_perspective",
        "publish_external",
        "merge",
        "retry_replay_deploy",
        "start_background_work",
        "schedule_background_work",
      ],
      budget: {
        budget_id: "autonomy_budget.mock.no_spend.preview",
        time_limit_minutes: 0,
        wall_clock_window: "not scheduled; no active window",
        max_iterations: 0,
        max_tool_calls: 0,
        max_codex_tasks: 0,
        max_prs: 0,
        max_file_changes: 0,
        allowed_file_globs: [],
        forbidden_file_globs: ["**/*"],
        token_or_compute_budget: { tokens: 0, compute_units: 0, notes: "No provider or tool execution." },
        cost_budget: { amount: 0, currency: "USD", notes: "Boundary only; not spend permission." },
        retry_limit: 0,
        failure_threshold: 0,
        reporting_interval: "manual preview only",
        requires_budget_refresh_after: "before any future Phase 9 runner scope",
        budget_boundary_notes: [
          "Budget is boundary only.",
          "Budget is not spend permission.",
          "Missing budget blocks future autonomy.",
          "Phase 8D does not charge, call providers, execute tools, or run background work.",
        ],
      },
      reporting_cadence: {
        mode: "manual",
        interval_description: "Manual preview response only.",
        minimum_report_fields: ["summary", "budget_used", "checks_run", "blocked_actions"],
        report_target_surface: "chatgpt_model_only",
      },
      stop_conditions: [
        {
          stop_condition_id: "stop.mock.budget_exhausted",
          kind: "budget_exhausted",
          summary: "Stop if any future budget is exhausted.",
          severity: "blocking",
          source_refs: ["docs/AUTONOMY_CONTRACT_V0_1.md"],
          blocks_future_run: true,
          recovery_hint: "Require a new reviewed budget.",
        },
        {
          stop_condition_id: "stop.mock.stale_context",
          kind: "stale_context",
          summary: "Stop if source context is stale.",
          severity: "blocking",
          source_refs: ["docs/AUTONOMY_CONTRACT_V0_1.md"],
          blocks_future_run: true,
          recovery_hint: "Refresh GuideBrief and Handoff Capsule previews.",
        },
        {
          stop_condition_id: "stop.mock.user_judgment_required",
          kind: "user_judgment_required",
          summary: "Stop when user judgment is required.",
          severity: "blocking",
          source_refs: ["docs/AUTONOMY_CONTRACT_V0_1.md"],
          blocks_future_run: true,
          recovery_hint: "Escalate to operator review.",
        },
      ],
      delta_merge_policy: {
        policy_id: "delta_merge_policy.mock.no_auto_apply.preview",
        default_delta_status: "needs_review",
        auto_apply_allowed: false,
        auto_apply_targets: [],
        review_required_targets: [
          "working_memory_candidate",
          "project_perspective_candidate",
          "durable_memory_candidate",
          "codex_launch_candidate",
          "handoff_send_candidate",
        ],
        blocked_targets: [
          "proof_evidence_write",
          "external_publication",
          "github_actuation",
          "provider_call",
          "branch_pr_creation",
          "durable_apply_without_review",
        ],
        durable_memory_policy: "requires_review",
        project_perspective_policy: "requires_review",
        external_side_effect_policy: "blocked",
        codex_launch_policy: "blocked_in_phase_8",
        proof_evidence_policy: "blocked",
        stale_context_policy: "requires_fresh_snapshot",
        user_judgment_policy: "escalate",
        policy_notes: ["Phase 8D may preview future policy only; no state apply implementation exists."],
      },
      review_escalation_policy: {
        escalation_id: "review_escalation.mock.preview",
        requires_user_judgment_when: ["needs_user_judgment item exists", "ambiguous authority boundary"],
        requires_operator_review_when: [
          "stale GuideBrief or stale Handoff Capsule",
          "budget exceeded",
          "forbidden file touched in future run",
          "required check skipped",
          "required check failed",
          "external side effect requested",
          "durable memory change requested",
          "project perspective change requested",
          "proof/evidence write requested",
          "Codex launch requested",
          "GitHub/provider call requested",
        ],
        requires_fresh_snapshot_when: ["stale context", "source gap high"],
        requires_new_budget_when: ["budget exceeded", "scope changes"],
        blocks_run_when: ["forbidden action requested", "authority boundary unclear"],
        review_queue_target: "operator_review",
        escalation_summary_template: "Autonomy preview requires review: {{reason}}",
        notes: ["Review escalation is preview-only and does not create a queue item."],
      },
      output_policy: {
        output_surfaces: ["chatgpt_model_only"],
        required_report_sections: [
          "summary",
          "source_refs",
          "deltas_created",
          "delta_batch_summary",
          "budget_used",
          "checks_run",
          "skipped_checks",
          "blocked_actions",
          "user_judgment_items",
          "known_risks",
          "next_phase_readiness",
        ],
        delta_batch_required: true,
        skipped_check_reporting_required: true,
        proof_evidence_status_required: true,
        no_background_work_statement_required: true,
        no_merge_statement_required: true,
        next_phase_readiness_required: true,
      },
      staleness_policy: {
        status: "preview_only",
        stale_after: "before any future Phase 9 runner",
        refresh_required_before_future_run: true,
      },
      validation_policy: {
        required_checks: ["npm run smoke:chatgpt-app-autonomy-contract-tool-v0-1"],
        skipped_checks_require_reason: true,
        failed_checks_block_future_run: true,
      },
      run_preview: {
        preview_id: "autonomy_run_preview.mock.no_execution",
        title: "Mock Autonomy Contract run preview",
        planned_steps: ["Read preview inputs", "Summarize contract boundaries", "Prepare review packet"],
        allowed_read_sources: ["GuideBrief preview", "Handoff Capsule preview", "Codex Launch Card preview"],
        proposed_delta_outputs: ["needs_review delta candidates only"],
        proposed_reports: ["Autonomy Contract preview report"],
        blocked_steps: ["run autonomy", "schedule autonomy", "launch Codex", "send handoff"],
        required_preconditions: ["Separate Phase 9 scope and explicit approval"],
        not_implemented_notes: ["No runner, scheduler, daemon, background job, active schedule, or active execution exists."],
        status: "preview_only",
      },
      authority_boundary: autonomyPreviewAuthorityBoundary,
      gaps: ["Synthetic mock route response; live local route data depends on running state runtime."],
      public_safety: {
        fixture_kind: "synthetic_sample",
        contains_private_conversations: false,
        contains_hidden_reasoning: false,
        contains_local_private_paths: false,
        contains_secrets: false,
        contains_tokens: false,
        contains_raw_provider_output: false,
        contains_raw_retrieval_output: false,
        contains_real_account_artifacts: false,
        notes: ["Synthetic public-safe mock preview."],
      },
      next_phase_notes: [
        "Phase 8E Codex skill alignment remains deferred.",
        "Phase 8F copy/export remains deferred.",
        "Phase 9 runner remains deferred and requires separate explicit scope and approval.",
      ],
    },
    route_authority_boundary: [...autonomyPreviewRouteAuthorityBoundary],
    source_status: {
      guide_brief: "synthetic_mock_guide_brief",
      handoff_capsule: "synthetic_mock_handoff_capsule_preview",
      codex_launch_card: "synthetic_mock_codex_launch_card_preview",
      autonomy_contract: "synthetic_mock_autonomy_contract_preview",
      budget: "synthetic_operator_supplied_preview_defaults",
      delta_merge_policy: "phase_8a_default_no_auto_apply_policy",
      run_preview: "preview_only_no_runner",
      source_disclosure:
        "Synthetic mock preview for App/MCP smoke; preview contract data only, not active autonomy state.",
      synthetic_operator_supplied_fields: [
        "title",
        "goal",
        "autonomy_mode",
        "allowed_agents",
        "allowed_surfaces",
        "budget",
        "reporting_cadence",
        "run_preview",
      ],
    },
    warnings: [
      "Mock Autonomy Contract preview is synthetic.",
      "Budget is not spend permission.",
      "AutonomyRunPreview is not execution.",
    ],
    gaps: ["Live route-composed fields may remain synthetic/operator-supplied preview defaults."],
  };
}

function buildMockAutonomyRunnerPreflightRouteResponse(
  scope: StateRuntimeScope,
): AutonomyRunnerPreflightPreviewResult {
  const sourceRefs = {
    route_refs: [
      "/api/augnes/read/autonomy-runner-preflight?scope=project:augnes",
      "/api/augnes/read/autonomy-contract?scope=project:augnes",
    ],
    docs_refs: [
      "docs/AUTONOMY_RUNNER_PREFLIGHT_V0_1.md",
      "docs/AUTONOMY_CONTRACT_V0_1.md",
      "docs/CHATGPT_APP_MCP_READONLY_SURFACE_BOUNDARY_V0_1.md",
      "docs/AUTHORITY_MATRIX.md",
    ],
    repo_refs: ["hynk-studio/augnes"],
  };
  const blockers = [
    {
      blocker_id: "blocker.mock.operator_budget_review",
      severity: "blocking",
      summary: "Synthetic mock preflight requires operator budget review before any future runner.",
      source_refs: ["docs/AUTONOMY_RUNNER_PREFLIGHT_V0_1.md"],
    },
  ];
  const warnings = [
    {
      warning_id: "warning.mock.preview_source",
      severity: "review",
      summary: "Mock Autonomy Runner Preflight preview is synthetic public-safe route data.",
      source_refs: ["docs/AUTONOMY_RUNNER_PREFLIGHT_V0_1.md"],
    },
  ];
  const plannedSteps = [
    {
      step_id: "dry_run_step.mock.read_contract",
      title: "Read Autonomy Contract preview",
      summary: "Inspect the source Autonomy Contract preview packet without collecting new data.",
      action_kind: "read_contract",
      allowed_by_contract: true,
      blocked_by: ["blocker.mock.operator_budget_review"],
      source_refs: sourceRefs.route_refs,
      expected_output: "Contract boundary summary.",
      would_require_review: true,
      would_execute: false as const,
    },
    {
      step_id: "dry_run_step.mock.build_report_preview",
      title: "Draft preflight report preview",
      summary: "Summarize readiness, blockers, warnings, and dry-run-only steps.",
      action_kind: "draft_report_preview",
      allowed_by_contract: true,
      blocked_by: ["blocker.mock.operator_budget_review"],
      source_refs: sourceRefs.docs_refs,
      expected_output: "Read-only Autonomy Runner Preflight preview report.",
      would_require_review: true,
      would_execute: false as const,
    },
  ];
  const dryRunPlan = {
    runtime: "augnes" as const,
    dry_run_version: "autonomy_dry_run_plan.v0.1",
    dry_run_id: "autonomy_dry_run_plan.mock.chatgpt_app.v0.1.preview",
    source_contract_id: "autonomy_contract.mock.chatgpt_app.v0.1.preview",
    status: "dry_run_only" as const,
    planned_steps: plannedSteps,
    planned_read_sources: [
      "Autonomy Contract preview route",
      "Autonomy Runner Preflight source helper",
      "Phase 9A/9B docs",
    ],
    proposed_delta_outputs: ["needs_review delta candidates only"],
    proposed_delta_batches: ["preview-only delta batch summary"],
    proposed_reports: ["Autonomy Runner Preflight / Dry-Run preview report"],
    proposed_review_queue_items: ["operator_review_required.preview_only"],
    blocked_steps: [
      "start_runner",
      "schedule_runner",
      "launch_codex",
      "call_github_or_provider",
      "write_db",
      "record_proof_or_create_evidence",
      "mutate_memory_or_perspective",
      "send_handoff",
      "create_branch_or_pr",
      "auto_apply_delta",
      "spend_budget",
    ],
    required_preconditions: [
      "Separate explicit future runner scope.",
      "Operator-approved budget.",
      "Resolved user judgment items.",
      "Fresh source snapshots.",
      "Phase 9D remains read-only preview only.",
    ],
    required_checks: [
      "npm run smoke:autonomy-runner-preflight-v0-1",
      "npm run smoke:autonomy-runner-preflight-route-v0-1",
      "npm run smoke:chatgpt-app-autonomy-runner-preflight-tool-v0-1",
    ],
    stop_conditions: [
      "stop.forbidden_action_requested",
      "stop.budget_not_approved",
      "stop.user_judgment_required",
      "stop.stale_context",
      "stop.authority_boundary_unclear",
    ],
    budget_projection: {
      budget_id: "autonomy_budget.mock.no_spend.preview",
      time_limit_minutes: 0,
      max_iterations: 0,
      max_tool_calls: 0,
      max_codex_tasks: 0,
      max_prs: 0,
      max_file_changes: 0,
      would_spend_budget: false as const,
      budget_boundary_notes: [
        "Budget is boundary only.",
        "Budget is not spend permission.",
        "Dry-run plan does not spend budget.",
      ],
    },
    no_run_boundary: autonomyRunnerPreflightAuthorityBoundary,
    next_phase_notes: [
      "Phase 9D adds a ChatGPT App/MCP read-only preview tool.",
      "Recommended next phase: Phase 9E - Codex Autonomy Runner Preflight consumption alignment v0.1.",
    ],
  };
  const preflight = {
    runtime: "augnes" as const,
    preflight_version: "autonomy_runner_preflight.v0.1" as const,
    scope,
    preflight_id: "autonomy_runner_preflight.mock.chatgpt_app.v0.1.preview",
    created_at: "2026-07-02T00:00:00.000Z",
    source_contract_id: "autonomy_contract.mock.chatgpt_app.v0.1.preview",
    source_contract_version: "autonomy_contract.v0.1",
    readiness: "blocked",
    readiness_summary:
      "Mock preflight is blocked for operator budget review; no run starts and the dry-run plan remains non-executing.",
    contract_status: "preview_only",
    autonomy_mode: "scheduled_hunt_preview",
    budget_assessment: {
      status: "needs_review",
      budget_present: true,
      budget_complete: true,
      budget_approved: false,
      budget_exceeded: false,
      would_spend_budget: false,
      blocks_run: false,
      requires_review: true,
      summary: "Budget is present but not approved; future runner requires review.",
      source_refs: ["AutonomyBudget"],
    },
    action_scope_assessment: {
      status: "ready",
      requested_forbidden_actions: [],
      forbidden_execution_terms: [],
      run_preview_status: "preview_only",
      blocks_run: false,
      requires_review: false,
      summary: "Mock action scope remains read/evaluate/report dry-run only.",
      source_refs: ["AutonomyContract.allowed_actions"],
    },
    delta_merge_assessment: {
      status: "ready",
      auto_apply_allowed: false,
      auto_apply_targets: [],
      blocks_run: false,
      requires_review: false,
      summary: "Auto-apply is denied and no auto-apply targets exist.",
      source_refs: ["AutonomyContract.delta_merge_policy"],
    },
    review_escalation_assessment: {
      status: "needs_review",
      requires_user_judgment: false,
      requires_operator_review: true,
      blocks_run: false,
      requires_review: true,
      summary: "Operator review remains required before any future runner phase.",
      source_refs: ["AutonomyContract.review_escalation_policy"],
    },
    stop_condition_assessment: {
      status: "ready",
      triggered_stop_conditions: [],
      blocks_run: false,
      requires_review: false,
      summary: "No mock stop condition is currently triggered.",
      source_refs: ["AutonomyContract.stop_conditions"],
    },
    staleness_assessment: {
      status: "needs_review",
      stale_context_blocks_run: false,
      refresh_required: true,
      blocks_run: false,
      requires_review: true,
      summary: "Mock source freshness is preview-only and refreshable before future runner scope.",
      source_refs: ["AutonomyContract.staleness_policy"],
    },
    authority_assessment: {
      status: "ready",
      authority_boundary_clear: true,
      execution_authority_denied: true,
      write_authority_denied: true,
      schedule_authority_denied: true,
      external_authority_denied: true,
      blocks_run: false,
      requires_review: false,
      summary: "All runner/write/schedule/external authority is denied for Phase 9D.",
      source_refs: ["AutonomyRunnerAuthorityBoundary"],
    },
    blockers,
    warnings,
    required_user_judgment: [],
    required_operator_review: ["phase_9d_chatgpt_app_preview_review"],
    dry_run_plan: dryRunPlan,
    source_refs: sourceRefs,
    authority_boundary: autonomyRunnerPreflightAuthorityBoundary,
    public_safety: autonomyRunnerPreflightPublicSafety,
    next_phase_notes: [
      "Phase 9D returns read-only App/MCP preview data.",
      "The tool is not approval to run.",
      "Recommended next phase: Phase 9E - Codex Autonomy Runner Preflight consumption alignment v0.1.",
    ],
  };

  return {
    response_version: "autonomy_runner_preflight_route_response.v0.1",
    runtime: "augnes",
    scope,
    route_id: "augnes.read.autonomy_runner_preflight.v0.1",
    route_family: "autonomy_runner_preflight",
    preflight,
    dry_run_plan: dryRunPlan,
    readiness: preflight.readiness,
    blockers,
    warnings,
    source_refs: sourceRefs,
    authority_boundary: autonomyRunnerPreflightAuthorityBoundary,
    public_safety: autonomyRunnerPreflightPublicSafety,
    route_authority_boundary: [
      "GET-only local read-only Autonomy Runner Preflight route",
      "preview JSON only",
      "no runner, scheduler, daemon, background work, Codex, GitHub, provider, DB, proof, evidence, memory, Perspective, handoff, auto-apply, budget spend, or external side effect authority",
    ],
    source_status: {
      autonomy_contract: "synthetic_mock_autonomy_contract_preview",
      autonomy_runner_preflight: "synthetic_mock_phase_9d_app_preview",
      dry_run_plan: "dry_run_only_no_runner",
      source_disclosure:
        "Synthetic mock preview for App/MCP smoke; preview data only, not active autonomy state.",
      synthetic_operator_supplied_fields: [
        "preflight_id",
        "dry_run_id",
        "readiness_summary",
        "operator_review_notes",
      ],
    },
    route_notes: [
      "App/MCP mock output is local/read-only preview data.",
      "Dry-run plan status remains dry_run_only.",
      "Every planned step has would_execute false.",
      "Authority boundary denies execution/write/schedule/external behavior.",
    ],
  };
}

export async function handleMockStateRuntimeReadRoute(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const scope = url.searchParams.get("scope");
  const marker = request.headers.get("x-augnes-local-readonly");

  if (request.method !== "GET") {
    return Response.json({ error: "method_not_allowed" }, { status: 405 });
  }

  if (scope !== "project:augnes") {
    return Response.json({ error: "invalid_scope" }, { status: 400 });
  }

  if (url.pathname === "/api/augnes/read/handoff-capsule") {
    const target = url.searchParams.get("target");
    if (target !== "codex_handoff") {
      return Response.json({ error: "invalid_target" }, { status: 400 });
    }
    if (marker !== "handoff-capsule-v0.1") {
      return Response.json({ error: marker ? "invalid_marker" : "missing_marker" }, { status: 403 });
    }
    return Response.json(buildMockHandoffCapsulePreviewRouteResponse(scope, target), { status: 200 });
  }

  if (url.pathname === "/api/augnes/read/codex-launch-card") {
    if (marker !== "codex-launch-card-v0.1") {
      return Response.json({ error: marker ? "invalid_marker" : "missing_marker" }, { status: 403 });
    }
    return Response.json(buildMockCodexLaunchCardPreviewRouteResponse(scope), { status: 200 });
  }

  if (url.pathname === "/api/augnes/read/autonomy-contract") {
    if (marker !== "autonomy-contract-v0.1") {
      return Response.json({ error: marker ? "invalid_marker" : "missing_marker" }, { status: 403 });
    }
    return Response.json(buildMockAutonomyContractPreviewRouteResponse(scope), { status: 200 });
  }

  if (url.pathname === "/api/augnes/read/autonomy-runner-preflight") {
    if (marker !== "autonomy-runner-preflight-v0.1") {
      return Response.json({ error: marker ? "invalid_marker" : "missing_marker" }, { status: 403 });
    }
    return Response.json(buildMockAutonomyRunnerPreflightRouteResponse(scope), { status: 200 });
  }

  return Response.json({ error: "not_found" }, { status: 404 });
}

export class MockStateRuntimeBridgeAdapter implements StateRuntimeBridgeAdapter {
  async getStateBrief(scope: StateRuntimeScope): Promise<StateBrief> {
    return {
      runtime: "augnes",
      scope,
      as_of: "2026-05-03T00:00:00.000Z",
      active_state: [
        {
          key: "current_focus",
          value: "Expose Augnes state runtime through MCP bridge tools.",
        },
      ],
      future_state: [],
      deprecated_state: [],
      completed_state: [],
      open_tensions: [
        {
          id: "tension-smoke-1",
          summary: "Bridge tools write runtime observations but do not commit deltas.",
        },
      ],
      pending_proposals: [proposal],
      recent_actions: [
        {
          id: "action-smoke-1",
          action_name: "smoke_check",
        },
      ],
      agent_instructions: ["Use Augnes runtime state as external context."],
      agent_handoff: {
        current_status: {
          summary: "The bridge smoke state is ready for user-facing status and next-step answers.",
          notable_state_keys: ["current_focus"],
          state_counts: {
            active: 1,
            pending: 1,
            recent_actions: 1,
            open_tensions: 1,
          },
        },
        next_recommended_action: {
          title: "Verify bridge tool surface",
          rationale: "The MCP app should expose runtime state without adding commit or reject tools.",
          related_state_keys: ["current_focus"],
        },
        codex_handoff: {
          task_brief: "Confirm agent_handoff is preserved and summarized without dumping raw state.",
          constraints: ["Keep the public default tool surface read-only."],
          verification_commands: ["npm run smoke"],
          action_record_template: {
            scope,
            source_agent_id: "codex-smoke",
            action_name: "smoke_agent_handoff_preserved",
            result_summary: "Summarize bridge smoke validation and preservation results.",
            files_changed: [],
            result_status: "completed",
            result_kind: "verification",
          },
        },
        blockers_or_tensions: [
          {
            summary: "Bridge tools may record observations but must not commit or reject proposals.",
            related_state_keys: ["bridge_surface"],
          },
        ],
      },
    };
  }

  async getConstellationPreview(scope: StateRuntimeScope): Promise<ConstellationPreviewResult> {
    const evidencePointer = {
      pointer_id: "pointer.smoke.constellation",
      label: "smoke constellation pointer",
      target_ref: "fixtures/project-constellation.sample.sidecar-strategy-c-v0.1.json",
      pointer_kind: "evidence_pointer",
      pointer_semantics: "pointer_only",
      bounded_summary: "Mock pointer-only evidence for the Project Constellation preview surface.",
      proof_evidence_write_authority: false,
      readiness_write_authority: false,
    } as const;
    const nextAction = {
      candidate_id: "project_constellation.smoke.next_action.1",
      label: "Advisory next action 1",
      summary: "Use the preview to draft a bounded read-only Codex handoff seed.",
      source_refs: ["fixtures/project-constellation.sample.sidecar-strategy-c-v0.1.json"],
      boundary_class: "read_only_local_static_preview",
    };
    const tension = {
      tension_id: "project_constellation.smoke.tension.1",
      label: "Unresolved tension 1",
      summary: "The preview must remain read-only while still being useful for handoff review.",
      source_refs: ["fixtures/project-constellation.sample.sidecar-strategy-c-v0.1.json"],
      evidence_pointers: [evidencePointer],
    };

    return {
      response_version: "readonly_api_route_response.v0.1",
      boundary_class: "read_only_local_static_preview",
      meta: {
        generated_at: "2026-05-09T00:00:00.000Z",
        route_family: "project_constellation",
        workspace_scope: scope,
        project_scope: scope,
        request_scope_ref: scope,
        boundary_class: "read_only_local_static_preview",
        response_shape_boundary: "type_only",
        runtime_schema: false,
        api_route_implementation: false,
        auth_implementation: false,
        external_calls: false,
        source_of_truth: false,
      },
      source_refs: [
        {
          source_ref: "fixtures/project-constellation.sample.sidecar-strategy-c-v0.1.json",
          source_kind: "static_fixture",
          source_label: "Project Constellation public-safe sample fixture",
          source_scope: scope,
          provenance_note: "Mock fixture pointer for MCP/App preview smoke.",
        },
      ],
      project_constellation: {
        constellation_id: "project_constellation.mock.smoke",
        boundary_class: "read_only_local_static_preview",
        thesis: "Mock Project Constellation preview for ChatGPT/App smoke validation.",
        nodes: [
          {
            id: "node.smoke.chatgpt_contact_surface",
            type: "surface",
            label: "ChatGPT contact surface",
            summary: "A read-only App/MCP preview helps the operator inspect Constellation context.",
            source_refs: ["fixtures/project-constellation.sample.sidecar-strategy-c-v0.1.json"],
            evidence_pointers: [evidencePointer],
            unresolved_tensions: [tension],
            next_action_candidates: [nextAction],
          },
        ],
        edges: [
          {
            id: "edge.smoke.preview_to_handoff",
            type: "supports",
            source: "node.smoke.chatgpt_contact_surface",
            target: "node.smoke.codex_handoff_seed",
            summary: "The preview can feed copyable handoff seed text without executing Codex.",
            source_refs: ["fixtures/project-constellation.sample.sidecar-strategy-c-v0.1.json"],
            evidence_pointers: [evidencePointer],
          },
        ],
        clusters: [
          {
            id: "cluster.smoke.operator_review",
            label: "Operator review",
            node_ids: ["node.smoke.chatgpt_contact_surface"],
            edge_ids: ["edge.smoke.preview_to_handoff"],
            cluster_thesis: "Keep the ChatGPT contact surface compact, read-only, and copy-friendly.",
            unresolved_tensions: [tension],
            next_action_candidates: [nextAction],
          },
        ],
        evidence_pointers: [evidencePointer],
        unresolved_tensions: [tension],
        next_action_candidates: [nextAction],
      },
      evidence_pointers: [evidencePointer],
      unresolved_tensions: [tension],
      next_action_candidates: [nextAction],
    };
  }

  async getGuideBrief(scope: StateRuntimeScope): Promise<GuideBriefResult> {
    const sourceRefs = {
      current_working_perspective_ref: "/api/perspective/current?scope=project%3Aaugnes",
      delta_projection_ref: "/api/augnes/read/deltas?scope=project%3Aaugnes",
      workplane_ref: "/workbench",
      perspective_snapshot_refs: ["snapshot:guide-brief-smoke"],
      delta_ids: ["delta:guide-brief-smoke"],
      batch_ids: ["batch:guide-brief-smoke"],
      evidence_refs: [],
      artifact_refs: [],
      handoff_refs: ["handoff:guide-brief-smoke-preview"],
      diagnostic_refs: ["diagnostic:guide-brief-smoke"],
      route_refs: ["/", "/perspective", "/workbench"],
      docs_refs: [
        "docs/GUIDEBRIEF_CONTRACT_V0_1.md",
        "docs/CHATGPT_APP_MCP_READONLY_SURFACE_BOUNDARY_V0_1.md",
      ],
    };

    return {
      runtime: "augnes",
      guide_version: "guide_brief.v0.1",
      scope,
      as_of: "2026-05-09T00:00:00.000Z",
      source_surfaces: [
        "current_working_perspective",
        "delta_projection",
        "agent_workplane",
        "chatgpt_app",
      ],
      observed: [
        {
          observation_id: "guide_brief.smoke.observed.1",
          kind: "current_thesis",
          summary: "Mock GuideBrief observed item for App/MCP smoke validation.",
          source_refs: [sourceRefs.current_working_perspective_ref],
          related_delta_ids: ["delta:guide-brief-smoke"],
          confidence: "observed",
          notes: ["Source-backed read-model observation in the mock adapter."],
        },
      ],
      inferred: [
        {
          inference_id: "guide_brief.smoke.inferred.1",
          summary: "Mock inference derived from the observed GuideBrief item.",
          basis_observation_ids: ["guide_brief.smoke.observed.1"],
          source_refs: [sourceRefs.current_working_perspective_ref],
          confidence: "medium",
          caveats: ["Mock inference only."],
          non_authority_notes: ["Derived interpretation; not a source fact."],
        },
      ],
      suggested: [
        {
          suggestion_id: "guide_brief.smoke.suggested.1",
          title: "Review GuideBrief route output",
          summary: "Candidate read-only review suggestion for smoke validation.",
          suggested_surface: "chatgpt_app",
          suggested_actor: "user",
          priority: "next",
          required_checks: ["npm run smoke:chatgpt-app-guide-brief-tool-v0-1"],
          blocked_by: [],
          source_refs: [sourceRefs.delta_projection_ref],
          related_delta_ids: ["delta:guide-brief-smoke"],
          authority_boundary_summary: "Suggestion only; not an action.",
        },
      ],
      needs_user_judgment: [
        {
          judgment_id: "guide_brief.smoke.judgment.1",
          question: "Should the next scoped phase proceed after smoke validation?",
          why_it_matters: "The guide must not decide roadmap sequencing.",
          options: ["Proceed only after explicit operator scope", "Hold"],
          source_refs: ["docs/GUIDEBRIEF_CONTRACT_V0_1.md"],
          related_delta_ids: [],
          urgency: "medium",
          blocked_until_decided: ["Phase 6E remains deferred."],
        },
      ],
      current_perspective_summary: {
        current_thesis: "Mock GuideBrief smoke thesis.",
        active_goal_count: 1,
        open_question_count: 1,
        active_risk_count: 1,
        research_pressure_level: "medium",
        staleness_status: "mock_current",
        source_status: ["mock adapter"],
        source_refs: [sourceRefs.current_working_perspective_ref],
      },
      delta_summary: {
        projected_delta_count: 1,
        batch_count: 1,
        gap_count: 0,
        needs_review_count: 1,
        blocked_count: 0,
        manual_review_count: 1,
        important_delta_refs: ["delta:guide-brief-smoke"],
        source_refs: [sourceRefs.delta_projection_ref],
      },
      workplane_summary: {
        route: "/workbench",
        surface_role: "agent_workplane",
        panels_available: ["Work Queue", "Trace / Diagnostics"],
        legacy_cockpit_reachable: true,
        source_fallback_status: ["mock adapter"],
        trace_diagnostics_bounded: true,
        authority_boundary_summary: "Read-only mock workplane summary.",
      },
      review_queue_summary: {
        needs_review_count: 1,
        blocked_count: 0,
        manual_review_count: 1,
        validation_required_count: 1,
        project_perspective_review_count: 1,
        durable_memory_review_count: 0,
        user_decision_count: 1,
        total_attention_count: 2,
        source_refs: [sourceRefs.delta_projection_ref],
      },
      handoff_candidates: [
        {
          handoff_candidate_id: "guide_brief.smoke.handoff.1",
          target_surface: "codex_handoff",
          title: "Mock handoff candidate",
          summary: "Preview-only candidate; not sent by the guide.",
          source_refs: ["handoff:guide-brief-smoke-preview"],
          related_delta_ids: ["delta:guide-brief-smoke"],
          required_context: ["GuideBrief sections"],
          blocked_by: ["Explicit handoff scope"],
          authority_boundary: "preview_only",
          status: "preview_only",
        },
      ],
      staleness_warnings: [
        {
          warning_id: "guide_brief.smoke.staleness.1",
          summary: "Mock staleness warning for App/MCP smoke.",
          severity: "low",
          source_refs: [sourceRefs.current_working_perspective_ref],
          refresh_suggestion: "Use the marker-gated GuideBrief route.",
          blocks_handoff: false,
        },
      ],
      surface_rendering_notes: {
        human_surface: "Compact summary and user judgment prompts.",
        perspective_timeline: "Preserve delta chronology.",
        agent_workplane: "Show bounded trace and diagnostic refs.",
        chatgpt_app: "Keep Observed/Inferred/Suggested/Judgment separated.",
        codex: "Preserve repo/task boundaries and authority boundary.",
        future_agent_surface: "Render as read-only context unless separately scoped.",
      },
      source_refs: sourceRefs,
      gaps: [],
      authority_boundary: {
        source_of_truth: false,
        can_commit_or_reject_state: false,
        can_record_proof: false,
        can_create_evidence: false,
        can_update_work: false,
        can_mutate_memory: false,
        can_apply_project_perspective: false,
        can_publish_external: false,
        can_merge: false,
        can_retry_replay_deploy: false,
        can_call_github: false,
        can_call_openai_or_provider: false,
        can_execute_codex: false,
        can_create_branch_or_pr: false,
        can_send_handoff: false,
        can_launch_autonomy: false,
        can_create_mcp_tool: false,
        can_create_ui_action: false,
        notes: [
          "GuideBrief is read-only.",
          "Observed items are read-model observations only.",
          "Inferred items are derived interpretations only.",
          "Suggested items are candidate next actions only.",
          "Needs user judgment items must not be decided by the guide.",
          "Handoff candidates are preview-only.",
        ],
      },
      next_phase_notes: [
        "Phase 6D adds ChatGPT App/MCP read-only GuideBrief tool.",
        "Phase 6E Codex Guide alignment remains deferred.",
        "Phase 7 Handoff Capsule / Codex Launch Card remains deferred.",
      ],
    };
  }

  async getHandoffCapsulePreview(input: StateRuntimeHandoffCapsulePreviewInput): Promise<HandoffCapsulePreviewResult> {
    return buildMockHandoffCapsulePreviewRouteResponse(input.scope, input.target);
  }

  async getCodexLaunchCardPreview(input: StateRuntimeCodexLaunchCardPreviewInput): Promise<CodexLaunchCardPreviewResult> {
    return buildMockCodexLaunchCardPreviewRouteResponse(input.scope);
  }

  async getAutonomyContractPreview(input: StateRuntimeAutonomyContractPreviewInput): Promise<AutonomyContractPreviewResult> {
    return buildMockAutonomyContractPreviewRouteResponse(input.scope);
  }

  async getAutonomyRunnerPreflight(input: StateRuntimeAutonomyRunnerPreflightInput): Promise<AutonomyRunnerPreflightPreviewResult> {
    return buildMockAutonomyRunnerPreflightRouteResponse(input.scope);
  }

  async getEvidencePack(input: StateRuntimeEvidencePackInput): Promise<EvidencePackResult> {
    return {
      scope: input.scope,
      generated_at: "2026-05-08T00:00:00.000Z",
      source_refs: {
        state_brief: `/api/state/brief?scope=${encodeURIComponent(input.scope)}`,
        work_brief: input.workId
          ? `/api/work/${input.workId.toUpperCase()}/brief?scope=${encodeURIComponent(input.scope)}`
          : null,
      },
      filters: {
        work_id: input.workId ?? null,
        publication_id: input.publicationId ?? null,
        delivery_id: input.deliveryId ?? null,
        target_ref: input.targetRef ?? null,
      },
      records: [verificationEvidenceRecord],
      boundaries: [
        "Read-only derived evidence pack.",
        "Does not create evidence records, bind sessions, publish externally, or mutate Augnes state.",
      ],
    };
  }

  async getSessionTrace(input: StateRuntimeSessionTraceInput): Promise<SessionTraceResult> {
    const session = {
      session_id: input.sessionId ?? "session:smoke-1",
      surface: "chatgpt_developer_mode",
      actor: "chatgpt",
      title: "Bridge smoke session",
      summary: "Mock cross-session continuity view for bridge smoke validation.",
      related_work_id: "AG-001",
      related_pr: null,
      handoff_ref: "handoff:smoke-draft-1",
      evidence_pack_ref: "/api/evidence-pack?scope=project%3Aaugnes&work_id=AG-001",
      started_at: "2026-05-08T00:00:00.000Z",
      ended_at: "2026-05-08T00:10:00.000Z",
      message_count: 4,
      latest_message: {
        role: "assistant",
        created_at: "2026-05-08T00:10:00.000Z",
        summary: "Summarized the current state of the bridge smoke task.",
      },
      work_event_counts: {
        total: 2,
        verification: 1,
        handoff: 1,
      },
      action_records_by_session_count: 1,
      verification_evidence_records_total: 1,
      latest_work_event: {
        summary: "Recorded bridge smoke verification.",
        result_status: "completed",
        result_kind: "verification",
        created_at: "2026-05-08T00:11:00.000Z",
      },
      latest_evidence_record: {
        evidence_id: verificationEvidenceRecord.evidence_id,
        kind: verificationEvidenceRecord.evidence_kind,
        status: verificationEvidenceRecord.status,
        label: verificationEvidenceRecord.label,
        created_at: verificationEvidenceRecord.created_at,
      },
      gaps: [],
    };

    if (input.sessionId) {
      return {
        ...session,
        scope: input.scope,
        generated_at: "2026-05-08T00:12:00.000Z",
        boundaries: [
          "Read-only session trace view.",
          "Does not bind, create, or update sessions.",
        ],
      };
    }

    return {
      scope: input.scope,
      generated_at: "2026-05-08T00:12:00.000Z",
      sessions: [session],
      session_count: 1,
      action_records_by_session: {
        [session.session_id]: 1,
      },
      gaps: [],
      boundaries: [
        "Read-only session trace view.",
        "Does not bind, create, or update sessions.",
      ],
    };
  }

  async getVerificationEvidenceRecords(
    input: StateRuntimeVerificationEvidenceRecordsInput
  ): Promise<VerificationEvidenceRecordsResult> {
    return {
      scope: input.scope,
      generated_at: "2026-05-08T00:00:00.000Z",
      count: 1,
      records: [
        {
          ...verificationEvidenceRecord,
          work_id: input.workId ?? verificationEvidenceRecord.work_id,
          publication_id: input.publicationId ?? verificationEvidenceRecord.publication_id,
          delivery_id: input.deliveryId ?? verificationEvidenceRecord.delivery_id,
          target_surface: input.targetSurface ?? verificationEvidenceRecord.target_surface,
          target_ref: input.targetRef ?? verificationEvidenceRecord.target_ref,
          evidence_kind: input.evidenceKind ?? verificationEvidenceRecord.evidence_kind,
          status: input.status ?? verificationEvidenceRecord.status,
        },
      ],
      boundaries: [
        "Read-only verification evidence record list.",
        "Does not create evidence rows, publish externally, or mutate state.",
      ],
    };
  }

  async observe(input: StateRuntimeMessageInput): Promise<ObserveResult> {
    return {
      scope: input.scope,
      session_id: "session-smoke-1",
      message_id: "message-smoke-1",
      compiler: "mock",
      proposals: [{ ...proposal, scope: input.scope }],
    };
  }

  async plan(input: StateRuntimeMessageInput): Promise<PlanResult> {
    return {
      scope: input.scope,
      planner: "mock",
      message: input.message,
      recommendations: [
        {
          title: "Verify bridge tool surface",
          rationale: "The MCP app should expose runtime state without adding commit or reject tools.",
          tool_name: null,
          priority: "now",
          grounded_state_keys: ["current_focus"],
        },
      ],
      agent_instructions: ["Do not commit or reject proposals from the MCP bridge."],
    };
  }

  async recordActionResult(input: StateRuntimeActionResultInput): Promise<ActionRecordResult> {
    return {
      id: "action-record-smoke-1",
      scope: input.scope,
      source_agent_id: input.sourceAgentId,
      action_name: input.actionName,
      result_summary: input.resultSummary,
      files_changed: input.filesChanged ?? [],
      ...(input.resultStatus ? { result_status: input.resultStatus } : {}),
      ...(input.resultKind ? { result_kind: input.resultKind } : {}),
    };
  }

  async listPendingProposals(scope: StateRuntimeScope): Promise<StateRuntimeProposal[]> {
    return [{ ...proposal, scope }];
  }

  async listWorkItems(scope: StateRuntimeScope): Promise<WorkItem[]> {
    return [{ ...workItem, scope }];
  }

  async getWorkBrief(scope: StateRuntimeScope, workId: string): Promise<WorkBrief> {
    return {
      runtime: "augnes",
      scope,
      work_id: workId.toUpperCase(),
      as_of: "2026-05-07T00:05:00.000Z",
      framing: {
        work_id: "Trace anchor only; not canonical project state.",
        state_authority: "Durable state authority remains Augnes committed state.",
        execution_proof: "Official execution proof remains action_records.",
        temporal_proof: "Temporal State Graph remains proof over time.",
      },
      work: { ...workItem, scope, work_id: workId.toUpperCase() },
      next_action: workItem.next_action,
      user_attention_required: false,
      recent_events: [
        {
          id: "work-event-smoke-1",
          work_id: workId.toUpperCase(),
          scope,
          actor: "chatgpt",
          event_type: "handoff",
          summary: "Smoke work brief preserves trace-anchor framing.",
          result_status: null,
          result_kind: "handoff",
          related_action_id: null,
          related_pr: null,
          related_state_keys: ["current_focus"],
          created_at: "2026-05-07T00:05:00.000Z",
        },
      ],
      related_state_keys: ["current_focus"],
      related_proof: {
        action_ids: [],
        prs: [],
        docs: ["docs/OPS_PLAYBOOK.md"],
        links: workItem.links,
      },
      codex_handoff: {
        task_brief: "Verify AG-001 work trace bridge tools.",
        constraints: ["work_id is a trace anchor, not state authority."],
        suggested_verification: ["npm run smoke"],
        work_event_template: {
          work_id: workId.toUpperCase(),
          scope,
          actor: "codex",
          event_type: "verification",
          summary: "Summarize bridge smoke validation.",
        },
      },
    };
  }

  async recordWorkEvent(input: StateRuntimeWorkEventInput): Promise<WorkEventResult> {
    return {
      scope: input.scope,
      event: {
        id: "work-event-recorded-smoke-1",
        work_id: input.workId.toUpperCase(),
        scope: input.scope,
        actor: input.actor ?? "codex",
        event_type: input.eventType ?? "note",
        summary: input.summary,
        result_status: input.resultStatus ?? null,
        result_kind: input.resultKind ?? null,
        related_action_id: input.relatedActionId ?? null,
        related_pr: input.relatedPr ?? null,
        related_state_keys: input.relatedStateKeys ?? [],
        created_at: "2026-05-07T00:10:00.000Z",
      },
    };
  }

  async generateHandoffDraft(input: GenerateHandoffDraftInput): Promise<GeneratedHandoffDraft> {
    const workId = input.workId.toUpperCase();
    const scope = input.scope;

    return {
      scope,
      handoff: {
        handoff_id: "handoff:smoke-draft-1",
        scope,
        work_id: workId,
        source_state_brief_ref: `/api/state/brief?scope=${encodeURIComponent(scope)}`,
        source_work_brief_ref: `/api/work/${workId}/brief?scope=${encodeURIComponent(scope)}`,
        target_agent: input.targetAgent ?? "codex",
        status: "draft",
        current_committed_state_summary:
          "Mock committed state summary for bridge handoff draft validation.",
        task_brief: "Draft a Codex handoff packet without executing Codex.",
        expected_files: ["src/server.ts"],
        expected_state_keys: ["current_focus"],
        expected_checks: ["npm run smoke"],
        expected_execution_surfaces: ["local_runtime", "github"],
        safety_boundaries: [
          "Do not execute Codex.",
          "Do not commit or reject Augnes state.",
        ],
        completion_record_fields: {
          CODEX_WORK_ID: workId,
          CODEX_SCOPE: scope,
          CODEX_RESULT_STATUS: "completed",
          CODEX_RESULT_KIND: "implementation",
        },
        created_by: input.createdBy ?? "chatgpt",
        created_at: "2026-05-07T00:15:00.000Z",
        updated_at: "2026-05-07T00:15:00.000Z",
        supersedes_handoff_id: null,
      },
      packet_text: [
        "Codex Handoff Packet",
        "",
        "Augnes Work ID:",
        workId,
        "",
        "Task for Codex:",
        "- Draft guidance only; do not execute Codex.",
      ].join("\n"),
    };
  }

  async reviewCodexResultDraft(input: ReviewCodexResultDraftInput): Promise<CodexResultReviewDraft> {
    const handoffDraft = await this.generateHandoffDraft({
      scope: input.scope,
      workId: "AG-001",
      targetAgent: "codex",
      createdBy: "chatgpt",
    });
    const actualFiles = input.actualFilesChanged ?? [];
    const actualStateKeys = input.actualStateKeys ?? [];
    const actualChecks = input.actualChecks ?? [];
    const actualSurfaces = input.actualExecutionSurfaces ?? [];
    const recommendedStatus =
      input.resultStatus === "completed" &&
      actualChecks.includes("npm run smoke")
        ? "completed"
        : "partial";
    const recommendedKind = input.resultKind ?? "implementation";

    return {
      scope: input.scope,
      handoff: {
        ...handoffDraft.handoff,
        handoff_id: input.handoffId,
      },
      review: {
        review_id: `review:${input.handoffId}:smoke`,
        handoff_id: input.handoffId,
        files: {
          expected: ["src/server.ts"],
          actual: actualFiles,
          missing: actualFiles.includes("src/server.ts") ? [] : ["src/server.ts"],
          unexpected: actualFiles.filter((file) => file !== "src/server.ts"),
          match: actualFiles.includes("src/server.ts") ? "yes" : "partial",
        },
        state_keys: {
          expected: ["current_focus"],
          actual: actualStateKeys,
          missing: actualStateKeys.includes("current_focus") ? [] : ["current_focus"],
          unexpected: actualStateKeys.filter((key) => key !== "current_focus"),
          match: actualStateKeys.includes("current_focus") ? "yes" : "partial",
        },
        checks: {
          expected: ["npm run smoke"],
          actual: actualChecks,
          missing: actualChecks.includes("npm run smoke") ? [] : ["npm run smoke"],
          unexpected: actualChecks.filter((check) => check !== "npm run smoke"),
          match: actualChecks.includes("npm run smoke") ? "yes" : "partial",
          skipped: [],
        },
        execution_surfaces: {
          expected: ["local_runtime", "github"],
          actual: actualSurfaces,
          missing: [],
          unexpected: actualSurfaces.filter((surface) => !["local_runtime", "github"].includes(surface)),
          match: "partial",
        },
        status: {
          expected: "completed",
          actual: input.resultStatus ?? null,
          match: input.resultStatus === "completed" ? "yes" : "partial",
        },
        kind: {
          expected: "implementation",
          actual: input.resultKind ?? null,
          match: input.resultKind === "implementation" ? "yes" : "partial",
        },
        files_match: actualFiles.includes("src/server.ts") ? "yes" : "partial",
        state_keys_match: actualStateKeys.includes("current_focus") ? "yes" : "partial",
        checks_match: actualChecks.includes("npm run smoke") ? "yes" : "partial",
        execution_surfaces_match: "partial",
        mismatch_or_follow_up: ["Smoke review draft keeps proof recording separate."],
        recommended_result_status: recommendedStatus,
        recommended_result_kind: recommendedKind,
        safety_boundary_notes: [
          "Review/draft only: no Codex execution was requested by this helper.",
          "No action proof or work event proof was recorded; only record drafts were produced.",
          "No Augnes state commit/reject or handoff status update was performed.",
        ],
      },
      action_record_draft: {
        scope: input.scope,
        source_agent_id: "agent:codex",
        action_name: "smoke_agent_handoff_preserved",
        result_summary: input.resultSummary,
        files_changed: actualFiles,
        result_status: recommendedStatus,
        result_kind: recommendedKind,
        work_id: "AG-001",
        related_state_keys: actualStateKeys,
        ...(input.relatedPr ? { related_pr: input.relatedPr } : {}),
      },
      work_event_draft: {
        scope: input.scope,
        work_id: "AG-001",
        actor: "codex",
        event_type: "review",
        summary: input.resultSummary,
        result_status: recommendedStatus,
        result_kind: recommendedKind,
        related_action_id: null,
        ...(input.relatedPr ? { related_pr: input.relatedPr } : {}),
        related_state_keys: actualStateKeys,
      },
    };
  }

  async getMailboxSummary(scope: StateRuntimeScope): Promise<MailboxSummaryResult> {
    return {
      scope,
      as_of: "2026-05-07T00:20:00.000Z",
      summary: {
        pending_handoffs: [
          {
            message_id: "mailbox:smoke-ready-handoff",
            scope,
            work_id: "AG-001",
            from_agent: "chatgpt",
            to_agent: "codex",
            message_type: "handoff",
            summary: "AG-001 handoff for codex: verify bridge summary behavior.",
            payload_ref: "handoff:smoke-draft-1",
            requires_ack: true,
            status: "ready",
            created_at: "2026-05-07T00:18:00.000Z",
            updated_at: "2026-05-07T00:18:00.000Z",
            acknowledged_at: null,
            supersedes_message_id: null,
            summary_reason: "handoff message is ready or delivered",
          },
        ],
        needs_review: [
          {
            message_id: "mailbox:smoke-review-request",
            scope,
            work_id: "AG-001",
            from_agent: "codex",
            to_agent: "chatgpt",
            message_type: "verification_needed",
            summary: "Verify the mailbox summary bridge output against runtime state.",
            payload_ref: null,
            requires_ack: false,
            status: "delivered",
            created_at: "2026-05-07T00:19:00.000Z",
            updated_at: "2026-05-07T00:19:00.000Z",
            acknowledged_at: null,
            supersedes_message_id: null,
            summary_reason: "message_type is verification_needed",
          },
        ],
        approval_needed: [],
        blocked_or_partial: [],
        inactive: {
          superseded_count: 1,
          expired_count: 0,
        },
      },
      boundaries: [
        "Mailbox summaries are derived read-only views, not sources of truth.",
        "Summaries do not approve, reject, commit, execute Codex, publish, or record proof.",
        "Superseded and expired messages are excluded from active summary buckets.",
      ],
    };
  }

  async getPublicationSummary(scope: StateRuntimeScope): Promise<PublicationSummaryResult> {
    return {
      scope,
      as_of: "2026-05-07T00:25:00.000Z",
      summary: {
        drafts: [
          {
            publication_id: "publication:smoke-draft",
            scope,
            work_id: "AG-001",
            source_event_id: null,
            target_surface: "github_pr_comment",
            target_ref: "Aurna-code/augnes#62",
            status: "draft",
            preview_excerpt: "Draft preview for smoke validation.",
            created_by: "chatgpt",
            approved_by: null,
            created_at: "2026-05-07T00:21:00.000Z",
            updated_at: "2026-05-07T00:21:00.000Z",
            sent_at: null,
            latest_delivery_status: null,
            latest_delivery_id: null,
            latest_delivery_error: null,
            delivery_count: 0,
            publish_eligibility: {
              dry_run: true,
              actual_publish: false,
              reason:
                "GitHub PR comment target can dry-run, but actual publish requires approved status",
            },
            summary_reason: "publication status draft; no delivery rows",
          },
        ],
        approved_previews: [
          {
            publication_id: "publication:smoke-approved",
            scope,
            work_id: "AG-001",
            source_event_id: null,
            target_surface: "github_pr_comment",
            target_ref: "Aurna-code/augnes#63",
            status: "approved",
            preview_excerpt: "Approved preview for smoke validation.",
            created_by: "chatgpt",
            approved_by: "user",
            created_at: "2026-05-07T00:22:00.000Z",
            updated_at: "2026-05-07T00:22:30.000Z",
            sent_at: null,
            latest_delivery_status: "pending",
            latest_delivery_id: "delivery:smoke-pending",
            latest_delivery_error: null,
            delivery_count: 1,
            publish_eligibility: {
              dry_run: true,
              actual_publish: true,
              reason:
                "approved GitHub PR comment preview meets stored-state preconditions for the explicit backend publish route; this view cannot publish",
            },
            summary_reason: "publication status approved; latest delivery pending",
          },
        ],
        sent: [],
        failed: [],
        cancelled: [],
        delivery_status: {
          pending_count: 1,
          sent_count: 1,
          failed_count: 1,
          acknowledged_count: 1,
        },
        failed_deliveries: [
          {
            delivery_id: "delivery:smoke-failed",
            publication_id: "publication:smoke-approved",
            scope,
            target_surface: "github_pr_comment",
            target_ref: "Aurna-code/augnes#63",
            status: "failed",
            error_message: "GitHub publish failed: mock token unavailable.",
            created_at: "2026-05-07T00:23:00.000Z",
            updated_at: "2026-05-07T00:23:10.000Z",
            sent_at: null,
            acknowledged_at: null,
            publication_status: "approved",
            work_id: "AG-001",
            summary_reason: "failed delivery includes stored error_message",
          },
        ],
      },
      limits: {
        bounded_view: true,
        publication_limit: 200,
        delivery_limit: 200,
      },
      boundaries: [
        "Publication summaries are derived read-only views.",
        "This view does not approve, publish, retry, post to GitHub, post to Discord, record proof, or commit state.",
        "Actual GitHub posting remains backend-adapter gated by approved publication status, explicit dry_run=false, backend replay guard, stored target_ref, and token availability.",
      ],
    };
  }

  async getControlPacket(scope: StateRuntimeScope): Promise<ControlPacket> {
    const publicationSummary = await this.getPublicationSummary(scope);
    const mailboxSummary = await this.getMailboxSummary(scope);

    return {
      runtime: "augnes",
      packet_version: "control_packet.v1",
      scope,
      as_of: "2026-05-07T00:30:00.000Z",
      source_refs: {
        state_brief_as_of: "2026-05-03T00:00:00.000Z",
        state_brief_generated_at: "2026-05-07T00:30:00.000Z",
        included_work_item_ids: ["AG-001"],
        included_coordination_event_ids: ["coordination-event-smoke-1"],
        mailbox_summary_as_of: mailboxSummary.as_of,
        mailbox_message_ids: [
          "mailbox:smoke-ready-handoff",
          "mailbox:smoke-review-request",
        ],
        publication_summary_as_of: publicationSummary.as_of,
        publication_ids: [
          "publication:smoke-draft",
          "publication:smoke-approved",
        ],
        delivery_ids: [
          "delivery:smoke-pending",
          "delivery:smoke-failed",
        ],
        state_keys: ["current_focus"],
      },
      current_phase: {
        value: null,
        status: "unknown",
        related_state_keys: [],
        summary_reason:
          "No durable runtime state entry with a phase-like key was found; repo docs are intentionally not treated as Core truth.",
      },
      current_work_items: [{ ...workItem, recent_event_ids: [], related_prs: [], summary_reason: "mock current work" }],
      recent_completed_prs: {
        items: [],
        summary_reason:
          "Runtime work links/events included no completed PR refs in the bounded read window.",
      },
      active_open_loops: [],
      pending_user_decisions: [
        {
          ref_type: "publication",
          ref_id: "publication:smoke-draft",
          summary: "github_pr_comment Aurna-code/augnes#62",
          summary_reason:
            "draft publication may require a future explicit approval decision; this packet cannot approve it",
        },
        {
          ref_type: "publication",
          ref_id: "publication:smoke-approved",
          summary: "github_pr_comment Aurna-code/augnes#63",
          summary_reason:
            "approved preview may require a separate explicit publish decision; approval is not publication",
        },
      ],
      active_risks: [
        {
          ref_type: "publication",
          ref_id: "publication:smoke-approved",
          summary: "github_pr_comment Aurna-code/augnes#63",
          summary_reason:
            "approved publication preview is near an external side-effect boundary; publish remains separately gated",
        },
        {
          ref_type: "delivery",
          ref_id: "delivery:smoke-failed",
          summary: "GitHub publish failed: mock token unavailable.",
          summary_reason: "failed delivery includes stored error_message",
        },
      ],
      allowed_actions: [],
      forbidden_actions: [
        {
          action: "Approve, publish, retry, commit/reject state, record proof, or acknowledge mailbox messages.",
          surface: "all",
          summary_reason: "The control packet API is read-only and exposes no write routes.",
        },
      ],
      required_verification: [],
      relevant_publication_state: {
        summary_reason:
          "Derived from existing publication summary buckets; this packet cannot approve, publish, retry, or mutate publication records.",
        drafts: publicationSummary.summary.drafts,
        approved_previews: publicationSummary.summary.approved_previews,
        sent: publicationSummary.summary.sent,
        failed: publicationSummary.summary.failed,
        cancelled: publicationSummary.summary.cancelled,
      },
      relevant_delivery_state: {
        summary_reason:
          "Derived from existing delivery ledger summary counts and failed delivery refs; this packet does not create delivery rows.",
        status_counts: {
          pending_count: publicationSummary.summary.delivery_status.pending_count,
          sent_count: publicationSummary.summary.delivery_status.sent_count,
          failed_count: publicationSummary.summary.delivery_status.failed_count,
          acknowledged_count: publicationSummary.summary.delivery_status.acknowledged_count,
        },
        failed_deliveries: publicationSummary.summary.failed_deliveries,
        delivery_refs: ["delivery:smoke-pending", "delivery:smoke-failed"],
      },
      relevant_mailbox_state: {
        summary_reason:
          "Derived from mailbox summary buckets; this packet cannot acknowledge, reactivate, or update mailbox messages.",
        pending_handoffs: mailboxSummary.summary.pending_handoffs,
        needs_review: mailboxSummary.summary.needs_review,
        approval_needed: mailboxSummary.summary.approval_needed,
        blocked_or_partial: mailboxSummary.summary.blocked_or_partial,
        inactive: mailboxSummary.summary.inactive,
      },
      related_event_refs: [],
      authority_boundaries: {
        chatgpt_apps: [
          "Primary user decision surface.",
          "Does not own durable approval, publication, proof, commit/reject, GitHub mutation, or Codex execution.",
        ],
        augnes_core: ["Source of truth and durable authority runtime."],
        github_publication: [
          "PR #67 does not authorize automatic future posting.",
        ],
      },
      next_suggested_goal: {
        title: "Review publication decision-card behavior",
        rationale: "Decision-card output should clarify consequences without granting authority.",
        suggested_actor: "chatgpt_apps",
        priority: "next",
        related_state_keys: ["coordination.publication"],
        summary_reason:
          "Derived from mock state runtime context for bridge validation.",
      },
      surface_rendering_hints: {
        chatgpt_apps: ["Render as a user-facing decision summary or decision-card input."],
        codex: ["Render as PR-readiness context."],
        cockpit: ["Render as observability context."],
      },
      boundaries: {
        derived_view_only: true,
        approval_authority: false,
        publish_authority: false,
        retry_authority: false,
        proof_recording: false,
        state_commit_or_reject: false,
        codex_execution: false,
        source_of_truth: false,
        creates_durable_records: false,
        external_side_effects: false,
      },
    };
  }
}
