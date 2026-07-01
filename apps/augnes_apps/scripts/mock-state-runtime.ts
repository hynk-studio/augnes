import type {
  ActionRecordResult,
  CodexResultReviewDraft,
  ConstellationPreviewResult,
  ControlPacket,
  EvidencePackResult,
  GuideBriefResult,
  GeneratedHandoffDraft,
  GenerateHandoffDraftInput,
  MailboxSummaryResult,
  ObserveResult,
  PlanResult,
  PublicationSummaryResult,
  SessionTraceResult,
  StateBrief,
  StateRuntimeActionResultInput,
  StateRuntimeBridgeAdapter,
  StateRuntimeEvidencePackInput,
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
