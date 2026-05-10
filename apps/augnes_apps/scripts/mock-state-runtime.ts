import type {
  ActionRecordResult,
  CodexResultReviewDraft,
  ControlPacket,
  GeneratedHandoffDraft,
  GenerateHandoffDraftInput,
  MailboxSummaryResult,
  ObserveResult,
  PlanResult,
  PublicationSummaryResult,
  StateBrief,
  StateRuntimeActionResultInput,
  StateRuntimeBridgeAdapter,
  StateRuntimeMessageInput,
  StateRuntimeProposal,
  StateRuntimeScope,
  StateRuntimeWorkEventInput,
  ReviewCodexResultDraftInput,
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
