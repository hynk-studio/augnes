import { listCoordinationEvents } from "@/lib/coordination-events";
import {
  type StateDeltaProposal,
  type StateEntry,
  type StateTension,
} from "@/lib/db";
import {
  type MailboxSummaryItem,
  buildMailboxSummary,
} from "@/lib/mailbox-summary";
import {
  type FailedDeliverySummaryItem,
  type PublicationSummaryItem,
  buildPublicationSummary,
} from "@/lib/publication-summary";
import { buildStateBrief } from "@/lib/state/brief";
import {
  type WorkEvent,
  type WorkItem,
  listWorkEvents,
  listWorkItems,
  normalizeScope,
} from "@/lib/work";

const DEFAULT_EVENT_LIMIT = 25;
const WORK_ITEM_LIMIT = 12;
const WORK_EVENT_LIMIT = 8;
const SUMMARY_ITEM_LIMIT = 10;

type ControlPacketSourceRefs = {
  state_brief_as_of: string;
  state_brief_generated_at: string;
  included_work_item_ids: string[];
  included_coordination_event_ids: string[];
  mailbox_summary_as_of: string;
  mailbox_message_ids: string[];
  publication_summary_as_of: string;
  publication_ids: string[];
  delivery_ids: string[];
  state_keys: string[];
};

type SummaryRef = {
  ref_type: string;
  ref_id: string;
  summary: string;
  summary_reason: string;
};

type BoundaryFlags = {
  derived_view_only: true;
  approval_authority: false;
  publish_authority: false;
  retry_authority: false;
  proof_recording: false;
  state_commit_or_reject: false;
  codex_execution: false;
  source_of_truth: false;
  creates_durable_records: false;
  external_side_effects: false;
};

type PacketAction = {
  action: string;
  surface: string;
  summary_reason: string;
};

type CurrentPhase = {
  value: string | null;
  status: "derived" | "unknown";
  related_state_keys: string[];
  summary_reason: string;
};

type CurrentWorkItem = Pick<
  WorkItem,
  | "work_id"
  | "title"
  | "status"
  | "priority"
  | "summary"
  | "next_action"
  | "user_attention_required"
  | "related_state_keys"
  | "updated_at"
> & {
  recent_event_ids: string[];
  related_prs: string[];
  summary_reason: string;
};

type RecentCompletedPr = {
  pr: string;
  work_ids: string[];
  event_ids: string[];
  summary_reason: string;
};

export type AugnesControlPacket = {
  runtime: "augnes";
  packet_version: "control_packet.v1";
  scope: string;
  as_of: string;
  source_refs: ControlPacketSourceRefs;
  current_phase: CurrentPhase;
  current_work_items: CurrentWorkItem[];
  recent_completed_prs: {
    items: RecentCompletedPr[];
    summary_reason: string;
  };
  active_open_loops: SummaryRef[];
  pending_user_decisions: SummaryRef[];
  active_risks: SummaryRef[];
  allowed_actions: PacketAction[];
  forbidden_actions: PacketAction[];
  required_verification: PacketAction[];
  relevant_publication_state: {
    summary_reason: string;
    drafts: PublicationSummaryItem[];
    approved_previews: PublicationSummaryItem[];
    failed: PublicationSummaryItem[];
    sent: PublicationSummaryItem[];
    cancelled: PublicationSummaryItem[];
  };
  relevant_delivery_state: {
    summary_reason: string;
    status_counts: Record<string, number>;
    failed_deliveries: FailedDeliverySummaryItem[];
    delivery_refs: string[];
  };
  relevant_mailbox_state: {
    summary_reason: string;
    pending_handoffs: MailboxSummaryItem[];
    needs_review: MailboxSummaryItem[];
    approval_needed: MailboxSummaryItem[];
    blocked_or_partial: MailboxSummaryItem[];
    inactive: {
      superseded_count: number;
      expired_count: number;
    };
  };
  related_event_refs: SummaryRef[];
  authority_boundaries: {
    chatgpt_apps: string[];
    codex: string[];
    cockpit: string[];
    augnes_core: string[];
    github_publication: string[];
  };
  next_suggested_goal: {
    title: string;
    rationale: string;
    suggested_actor: string;
    priority: string;
    related_state_keys: string[];
    summary_reason: string;
  };
  surface_rendering_hints: {
    chatgpt_apps: string[];
    codex: string[];
    cockpit: string[];
  };
  boundaries: BoundaryFlags;
};

export function buildControlPacket({
  scope,
}: {
  scope?: string | null;
} = {}): AugnesControlPacket {
  const normalizedScope = normalizeScope(scope);
  const stateBrief = buildStateBrief(normalizedScope);
  const workItems = listWorkItems(normalizedScope);
  const workEventsById = new Map(
    workItems.map((work) => [
      work.work_id,
      listWorkEvents({
        workId: work.work_id,
        scope: normalizedScope,
        limit: WORK_EVENT_LIMIT,
      }),
    ]),
  );
  const coordinationEvents = listCoordinationEvents({
    scope: normalizedScope,
    limit: DEFAULT_EVENT_LIMIT,
  });
  const mailboxSummary = buildMailboxSummary({
    scope: normalizedScope,
    limit: SUMMARY_ITEM_LIMIT,
  });
  const publicationSummary = buildPublicationSummary({
    scope: normalizedScope,
  });
  const asOf = new Date().toISOString();
  const currentWorkItems = buildCurrentWorkItems(workItems, workEventsById);
  const recentCompletedPrs = buildRecentCompletedPrs(workItems, workEventsById);
  const mailboxRefs = collectMailboxRefs(mailboxSummary.summary);
  const publicationRefs = collectPublicationRefs(publicationSummary.summary);
  const deliveryRefs = collectDeliveryRefs(publicationSummary.summary);

  return {
    runtime: "augnes",
    packet_version: "control_packet.v1",
    scope: normalizedScope,
    as_of: asOf,
    source_refs: {
      state_brief_as_of: stateBrief.as_of,
      state_brief_generated_at: stateBrief.generated_at,
      included_work_item_ids: workItems
        .slice(0, WORK_ITEM_LIMIT)
        .map((work) => work.work_id),
      included_coordination_event_ids: coordinationEvents.map(
        (event) => event.event_id,
      ),
      mailbox_summary_as_of: mailboxSummary.as_of,
      mailbox_message_ids: mailboxRefs,
      publication_summary_as_of: publicationSummary.as_of,
      publication_ids: publicationRefs,
      delivery_ids: deliveryRefs,
      state_keys: collectStateKeysFromBrief(stateBrief),
    },
    current_phase: buildCurrentPhase(stateBrief),
    current_work_items: currentWorkItems,
    recent_completed_prs: {
      items: recentCompletedPrs,
      summary_reason:
        recentCompletedPrs.length > 0
          ? "Derived from work item links and recent work events with PR refs."
          : "Runtime work links/events included no completed PR refs in the bounded read window.",
    },
    active_open_loops: buildActiveOpenLoops({
      openTensions: stateBrief.open_tensions,
      workItems,
      mailboxItems: mailboxSummary.summary,
      publicationItems: publicationSummary.summary,
    }),
    pending_user_decisions: buildPendingUserDecisions({
      pendingProposals: stateBrief.pending_proposals,
      mailboxApprovalItems: mailboxSummary.summary.approval_needed,
      publicationItems: publicationSummary.summary,
      workItems,
    }),
    active_risks: buildActiveRisks({
      openTensions: stateBrief.open_tensions,
      publicationItems: publicationSummary.summary,
    }),
    allowed_actions: buildAllowedActions(),
    forbidden_actions: buildForbiddenActions(),
    required_verification: buildRequiredVerification(),
    relevant_publication_state: {
      summary_reason:
        "Derived from existing publication summary buckets; this packet cannot approve, publish, retry, or mutate publication records.",
      drafts: publicationSummary.summary.drafts.slice(0, SUMMARY_ITEM_LIMIT),
      approved_previews: publicationSummary.summary.approved_previews.slice(
        0,
        SUMMARY_ITEM_LIMIT,
      ),
      failed: publicationSummary.summary.failed.slice(0, SUMMARY_ITEM_LIMIT),
      sent: publicationSummary.summary.sent.slice(0, SUMMARY_ITEM_LIMIT),
      cancelled: publicationSummary.summary.cancelled.slice(0, SUMMARY_ITEM_LIMIT),
    },
    relevant_delivery_state: {
      summary_reason:
        "Derived from existing delivery ledger summary counts and failed delivery refs; this packet does not create delivery rows.",
      status_counts: publicationSummary.summary.delivery_status,
      failed_deliveries: publicationSummary.summary.failed_deliveries.slice(
        0,
        SUMMARY_ITEM_LIMIT,
      ),
      delivery_refs: deliveryRefs,
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
    related_event_refs: coordinationEvents.map((event) => ({
      ref_type: "coordination_event",
      ref_id: event.event_id,
      summary: `${event.event_type} from ${event.source_surface}`,
      summary_reason: event.payload_ref
        ? `payload_ref ${event.payload_ref}`
        : "coordination event included in bounded recent event read",
    })),
    authority_boundaries: buildAuthorityBoundaries(),
    next_suggested_goal: {
      title: stateBrief.agent_handoff.next_recommended_action.title,
      rationale: stateBrief.agent_handoff.next_recommended_action.rationale,
      suggested_actor:
        stateBrief.agent_handoff.next_recommended_action.suggested_actor,
      priority: stateBrief.agent_handoff.next_recommended_action.priority,
      related_state_keys:
        stateBrief.agent_handoff.next_recommended_action.related_state_keys,
      summary_reason:
        "Derived from the existing state brief agent_handoff next_recommended_action.",
    },
    surface_rendering_hints: {
      chatgpt_apps: [
        "Render as a user-facing decision summary or decision-card input.",
        "Lead with pending_user_decisions, active_risks, authority_boundaries, and next_suggested_goal.",
        "Explain external side effects before any future approval collection.",
      ],
      codex: [
        "Render as task scope, changed-files expectation, verification, risk, blocker, and PR-readiness context.",
        "Use source_refs, current_work_items, required_verification, and forbidden_actions as PR evidence scaffolding.",
        "Do not treat this packet as proof recording, merge approval, publication approval, or Codex execution authority.",
      ],
      cockpit: [
        "Render as observability context for open loops, gates, mailbox, publication, delivery, and event refs.",
        "Keep any future write controls separately scoped, explicit, auditable, and Core-gated.",
        "Do not treat this packet as hidden authority or a second timeline.",
      ],
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

function buildCurrentPhase(stateBrief: ReturnType<typeof buildStateBrief>): CurrentPhase {
  const phaseEntry = [
    ...stateBrief.active_state,
    ...stateBrief.future_state,
    ...stateBrief.completed_state,
  ].find(isPhaseEntry);

  if (!phaseEntry) {
    return {
      value: null,
      status: "unknown",
      related_state_keys: [],
      summary_reason:
        "No durable runtime state entry with a phase-like key was found; repo docs are intentionally not treated as Core truth.",
    };
  }

  return {
    value: stringifyStateValue(phaseEntry.value),
    status: "derived",
    related_state_keys: [phaseEntry.state_key],
    summary_reason: `Derived from runtime state entry ${phaseEntry.state_key}.`,
  };
}

function buildCurrentWorkItems(
  workItems: WorkItem[],
  workEventsById: Map<string, WorkEvent[]>,
): CurrentWorkItem[] {
  return workItems
    .filter((work) => !["completed", "archived"].includes(work.status))
    .slice(0, WORK_ITEM_LIMIT)
    .map((work) => {
      const events = workEventsById.get(work.work_id) ?? [];

      return {
        work_id: work.work_id,
        title: work.title,
        status: work.status,
        priority: work.priority,
        summary: work.summary,
        next_action: work.next_action,
        user_attention_required: work.user_attention_required,
        related_state_keys: work.related_state_keys,
        updated_at: work.updated_at,
        recent_event_ids: events.map((event) => event.id),
        related_prs: collectPrsForWork(work, events),
        summary_reason:
          "Included because work status is not completed or archived in runtime work storage.",
      };
    });
}

function buildRecentCompletedPrs(
  workItems: WorkItem[],
  workEventsById: Map<string, WorkEvent[]>,
): RecentCompletedPr[] {
  const prs = new Map<string, RecentCompletedPr>();

  for (const work of workItems) {
    const events = workEventsById.get(work.work_id) ?? [];
    const workPrs = collectPrsForWork(work, events);
    const completedEvents = events.filter(
      (event) => event.result_status === "completed",
    );
    const shouldIncludeWorkPrs =
      work.status === "completed" || completedEvents.length > 0;

    for (const pr of workPrs) {
      if (!shouldIncludeWorkPrs && !completedEvents.some((event) => event.related_pr === pr)) {
        continue;
      }

      const existing = prs.get(pr) ?? {
        pr,
        work_ids: [],
        event_ids: [],
        summary_reason:
          "Derived from completed work item links or completed work events.",
      };

      existing.work_ids = uniqueStrings([...existing.work_ids, work.work_id]);
      existing.event_ids = uniqueStrings([
        ...existing.event_ids,
        ...completedEvents
          .filter((event) => !event.related_pr || event.related_pr === pr)
          .map((event) => event.id),
      ]);
      prs.set(pr, existing);
    }
  }

  return Array.from(prs.values()).slice(0, SUMMARY_ITEM_LIMIT);
}

function buildActiveOpenLoops({
  openTensions,
  workItems,
  mailboxItems,
  publicationItems,
}: {
  openTensions: StateTension[];
  workItems: WorkItem[];
  mailboxItems: ReturnType<typeof buildMailboxSummary>["summary"];
  publicationItems: ReturnType<typeof buildPublicationSummary>["summary"];
}): SummaryRef[] {
  return [
    ...openTensions.map((tension) => ({
      ref_type: "state_tension",
      ref_id: tension.id,
      summary: tension.title,
      summary_reason: `open tension with ${tension.severity} severity`,
    })),
    ...workItems
      .filter((work) =>
        ["blocked", "needs_review", "in_progress", "planned"].includes(
          work.status,
        ),
      )
      .map((work) => ({
        ref_type: "work_item",
        ref_id: work.work_id,
        summary: work.next_action || work.summary,
        summary_reason: `work status is ${work.status}`,
      })),
    ...mailboxItems.pending_handoffs.map(mailboxSummaryRef),
    ...mailboxItems.needs_review.map(mailboxSummaryRef),
    ...mailboxItems.blocked_or_partial.map(mailboxSummaryRef),
    ...publicationItems.drafts.map(publicationSummaryRef),
    ...publicationItems.failed.map(publicationSummaryRef),
  ].slice(0, SUMMARY_ITEM_LIMIT);
}

function buildPendingUserDecisions({
  pendingProposals,
  mailboxApprovalItems,
  publicationItems,
  workItems,
}: {
  pendingProposals: StateDeltaProposal[];
  mailboxApprovalItems: MailboxSummaryItem[];
  publicationItems: ReturnType<typeof buildPublicationSummary>["summary"];
  workItems: WorkItem[];
}): SummaryRef[] {
  return [
    ...pendingProposals.map((proposal) => ({
      ref_type: "state_delta_proposal",
      ref_id: proposal.id,
      summary: `${proposal.operation} ${proposal.state_key}`,
      summary_reason:
        "pending proposal requires explicit user commit/reject decision before durable state changes",
    })),
    ...mailboxApprovalItems.map(mailboxSummaryRef),
    ...publicationItems.drafts.map((publication) => ({
      ref_type: "publication",
      ref_id: publication.publication_id,
      summary: `${publication.target_surface} ${publication.target_ref}`,
      summary_reason:
        "draft publication may require a future explicit approval decision; this packet cannot approve it",
    })),
    ...publicationItems.approved_previews.map((publication) => ({
      ref_type: "publication",
      ref_id: publication.publication_id,
      summary: `${publication.target_surface} ${publication.target_ref}`,
      summary_reason:
        "approved preview may require a separate explicit publish decision; approval is not publication",
    })),
    ...workItems
      .filter((work) => work.user_attention_required)
      .map((work) => ({
        ref_type: "work_item",
        ref_id: work.work_id,
        summary: work.next_action || work.summary,
        summary_reason: "work item has user_attention_required=true",
      })),
  ].slice(0, SUMMARY_ITEM_LIMIT);
}

function buildActiveRisks({
  openTensions,
  publicationItems,
}: {
  openTensions: StateTension[];
  publicationItems: ReturnType<typeof buildPublicationSummary>["summary"];
}): SummaryRef[] {
  return [
    ...openTensions
      .filter(isHighSeverityTension)
      .map((tension) => ({
        ref_type: "state_tension",
        ref_id: tension.id,
        summary: tension.description,
        summary_reason: `open ${tension.severity} severity tension`,
      })),
    ...publicationItems.approved_previews.map((publication) => ({
      ref_type: "publication",
      ref_id: publication.publication_id,
      summary: `${publication.target_surface} ${publication.target_ref}`,
      summary_reason:
        "approved publication preview is near an external side-effect boundary; publish remains separately gated",
    })),
    ...publicationItems.failed.map(publicationSummaryRef),
    ...publicationItems.failed_deliveries.map((delivery) => ({
      ref_type: "delivery",
      ref_id: delivery.delivery_id,
      summary: delivery.error_message ?? delivery.status,
      summary_reason: delivery.summary_reason,
    })),
  ].slice(0, SUMMARY_ITEM_LIMIT);
}

function buildAllowedActions(): PacketAction[] {
  return [
    {
      action: "Read the control packet and source refs.",
      surface: "all",
      summary_reason: "Read and summary access can be broad.",
    },
    {
      action: "Inspect state, work, coordination events, mailbox summaries, and publication summaries.",
      surface: "all",
      summary_reason: "These are existing read-only runtime surfaces.",
    },
    {
      action: "Use the packet as Codex task scope, verification, risk, and PR-readiness context.",
      surface: "codex",
      summary_reason: "Codex is the implementation/work execution control surface.",
    },
    {
      action: "Use the packet as ChatGPT Apps decision-summary or decision-card input.",
      surface: "chatgpt_apps",
      summary_reason: "ChatGPT Apps are the primary user decision surface, but not durable authority.",
    },
    {
      action: "Use the packet as Cockpit observability context for open loops and gates.",
      surface: "cockpit",
      summary_reason: "Cockpit is observability and coordination, not hidden authority.",
    },
  ];
}

function buildForbiddenActions(): PacketAction[] {
  return [
    {
      action: "Treat the packet as source of truth or durable state.",
      surface: "all",
      summary_reason: "Augnes Core records remain the source of truth; the packet is generated and unstored.",
    },
    {
      action: "Approve, publish, retry, commit/reject state, record proof, or acknowledge mailbox messages.",
      surface: "all",
      summary_reason: "The control packet API is read-only and exposes no write routes.",
    },
    {
      action: "Execute Codex, merge PRs, enable auto-merge, submit PR reviews, request reviewers, or mutate PR title/body/labels.",
      surface: "all",
      summary_reason: "Control visibility does not grant GitHub or Codex execution authority.",
    },
    {
      action: "Treat the PR #67 live GitHub comment test as future automatic posting permission.",
      surface: "github",
      summary_reason: "PR #67 was one explicit target-specific live test and did not authorize automatic posting.",
    },
  ];
}

function buildRequiredVerification(): PacketAction[] {
  return [
    {
      action: "Run root and ChatGPT App typechecks/build/smoke/invariants as scoped by the PR.",
      surface: "local_runtime",
      summary_reason: "Implementation PRs must leave command evidence.",
    },
    {
      action: "Verify repeated GET reads do not mutate state, events, mailbox, publication, delivery, proof, or proposals.",
      surface: "local_runtime",
      summary_reason: "The packet must remain a derived read-only view.",
    },
    {
      action: "Verify Cockpit panels still render and no approve/publish/retry/proof/Codex execution controls were added.",
      surface: "browser",
      summary_reason: "Runtime UI should remain observational unless separately scoped.",
    },
    {
      action: "Confirm no ChatGPT App tool was added for the control packet in this PR.",
      surface: "chatgpt_developer_mode",
      summary_reason: "ChatGPT App decision-card/tool work is explicitly out of scope.",
    },
  ];
}

function buildAuthorityBoundaries() {
  return {
    chatgpt_apps: [
      "Primary user decision surface.",
      "May collect intent in future scoped work.",
      "Does not own durable approval, publication, proof, commit/reject, GitHub mutation, or Codex execution.",
    ],
    codex: [
      "Implementation and work-execution control surface.",
      "May implement, verify, and open PRs through the PR-centered workflow.",
      "Does not merge, publish externally, approve durable state, record proof without explicit instruction, or override user approval.",
    ],
    cockpit: [
      "Observability and agent coordination surface.",
      "Shows event, mailbox, handoff, publication, delivery, proof, and gate state.",
      "Must not become hidden authority; future write controls must be separately scoped and Core-gated.",
    ],
    augnes_core: [
      "Source of truth and durable authority runtime.",
      "Owns committed state, proof records, event spine, mailbox, publication drafts, delivery ledger, and gate validation.",
      "Validates side-effectful actions and records durable outcomes.",
    ],
    github_publication: [
      "GitHub live posting is an external side effect.",
      "Requires explicit user/PM target approval, approved publication status, dry_run=false, stored target_ref, required idempotency_key, fresh delivery row, token availability, and replay/no-duplicate evidence.",
      "PR #67 does not authorize automatic future posting.",
    ],
  };
}

function isPhaseEntry(entry: StateEntry) {
  const normalizedKey = entry.state_key.toLowerCase();

  // Generic "phase" is intentionally not enough: historical keys such as
  // phase_1_complete or publication.phase_gate are not current phase sources.
  return (
    normalizedKey === "current_phase" ||
    normalizedKey === "roadmap_phase" ||
    normalizedKey === "roadmap_current_phase" ||
    normalizedKey.endsWith(".current_phase") ||
    normalizedKey.endsWith(".roadmap_phase")
  );
}

function isHighSeverityTension(tension: StateTension) {
  return ["critical", "high", "blocker", "severe"].includes(
    tension.severity.toLowerCase(),
  );
}

function stringifyStateValue(value: StateEntry["value"]) {
  if (typeof value === "string") {
    return value;
  }

  return JSON.stringify(value);
}

function collectStateKeysFromBrief(stateBrief: ReturnType<typeof buildStateBrief>) {
  return uniqueStrings([
    ...stateBrief.active_state.map((entry) => entry.state_key),
    ...stateBrief.future_state.map((entry) => entry.state_key),
    ...stateBrief.completed_state.map((entry) => entry.state_key),
    ...stateBrief.deprecated_state.map((entry) => entry.state_key),
    ...stateBrief.open_tensions
      .map((tension) => tension.state_key)
      .filter((value): value is string => Boolean(value)),
    ...stateBrief.pending_proposals.map((proposal) => proposal.state_key),
    ...stateBrief.recent_actions
      .map((action) => action.state_key)
      .filter((value): value is string => Boolean(value)),
  ]);
}

function collectPrsForWork(work: WorkItem, events: WorkEvent[]) {
  return uniqueStrings([
    ...extractStringArray(work.links.prs),
    ...extractStringArray(work.links.github_prs),
    ...events
      .map((event) => event.related_pr)
      .filter((value): value is string => Boolean(value)),
  ]);
}

function collectMailboxRefs(summary: ReturnType<typeof buildMailboxSummary>["summary"]) {
  return uniqueStrings([
    ...summary.pending_handoffs.map((item) => item.message_id),
    ...summary.needs_review.map((item) => item.message_id),
    ...summary.approval_needed.map((item) => item.message_id),
    ...summary.blocked_or_partial.map((item) => item.message_id),
  ]);
}

function collectPublicationRefs(
  summary: ReturnType<typeof buildPublicationSummary>["summary"],
) {
  return uniqueStrings([
    ...summary.drafts.map((item) => item.publication_id),
    ...summary.approved_previews.map((item) => item.publication_id),
    ...summary.sent.map((item) => item.publication_id),
    ...summary.failed.map((item) => item.publication_id),
    ...summary.cancelled.map((item) => item.publication_id),
    ...summary.failed_deliveries.map((item) => item.publication_id),
  ]);
}

function collectDeliveryRefs(
  summary: ReturnType<typeof buildPublicationSummary>["summary"],
) {
  return uniqueStrings([
    ...summary.drafts
      .map((item) => item.latest_delivery_id)
      .filter((value): value is string => Boolean(value)),
    ...summary.approved_previews
      .map((item) => item.latest_delivery_id)
      .filter((value): value is string => Boolean(value)),
    ...summary.sent
      .map((item) => item.latest_delivery_id)
      .filter((value): value is string => Boolean(value)),
    ...summary.failed
      .map((item) => item.latest_delivery_id)
      .filter((value): value is string => Boolean(value)),
    ...summary.cancelled
      .map((item) => item.latest_delivery_id)
      .filter((value): value is string => Boolean(value)),
    ...summary.failed_deliveries.map((item) => item.delivery_id),
  ]);
}

function mailboxSummaryRef(item: MailboxSummaryItem): SummaryRef {
  return {
    ref_type: "mailbox_message",
    ref_id: item.message_id,
    summary: item.summary,
    summary_reason: item.summary_reason,
  };
}

function publicationSummaryRef(item: PublicationSummaryItem): SummaryRef {
  return {
    ref_type: "publication",
    ref_id: item.publication_id,
    summary: `${item.target_surface} ${item.target_ref}`,
    summary_reason: item.summary_reason,
  };
}

function extractStringArray(value: unknown) {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string");
  }

  if (typeof value === "string") {
    return [value];
  }

  return [];
}

function uniqueStrings(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}
