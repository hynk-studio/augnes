import { timingSafeEqual } from "node:crypto";
import { createServer } from "node:http";
import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import {
  registerAppResource,
  registerAppTool,
  RESOURCE_MIME_TYPE,
} from "@modelcontextprotocol/ext-apps/server";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { z } from "zod";
import { createAugnesCoreAdapter } from "./adapters/index.js";
import { StateRuntimeHttpAdapter } from "./adapters/state-runtime-http.js";
import { config, type AugnesAppToolSurface } from "./lib/config.js";
import { withPresentation } from "./lib/profile.js";
import { sanitizeValue } from "./lib/sanitize.js";
import {
  AutonomyContractPreviewToolInputSchema,
  AutonomyRunnerPreflightToolInputSchema,
  EvidencePackToolInputSchema,
  GuideBriefToolInputSchema,
  ModelInvocationReceiptSchema,
  ProjectConstellationPreviewToolInputSchema,
  SessionTraceToolInputSchema,
  StateRuntimeActionResultKindSchema,
  StateRuntimeActionResultStatusSchema,
  VerificationEvidenceRecordsToolInputSchema,
  type AutonomyContractPreviewResult,
  type AutonomyRunnerPreflightPreviewResult,
  type ConstellationPreviewResult,
  type ControlPacket,
  type GuideBriefResult,
  type PublicationSummaryResult,
  type SessionTraceResult,
  type StateBrief,
  type StateRuntimeBridgeAdapter,
  type VerificationEvidenceRecordsResult,
  type WorkBrief,
  type WorkItem,
} from "./lib/state-runtime-types.js";
import type { AugnesCoreAdapter, SearchScope } from "./lib/types.js";

const widgetHtml = readFileSync(new URL("../public/console-widget.html", import.meta.url), "utf8");
export const WIDGET_URI = "ui://widget/augnes-console.v2.html";
export const APP_NAME = "augnes-console";
export const APP_VERSION = config.applicationVersion ?? "0.1.0";
const DEFAULT_STATE_RUNTIME_SCOPE = "project:augnes";
export const LEGACY_PUBLIC_TOOL_NAMES = [
  "search",
  "fetch",
  "open_casefile",
  "get_working_view",
  "explain_strategy",
  "get_boundary_packet",
  "get_continuity_report",
  "navigate_repo",
  "get_governance_audit",
] as const;
export const AUGNES_BRIDGE_TOOL_NAMES = [
  "augnes_get_state_brief",
  "augnes_get_project_constellation_preview",
  "augnes_get_guide_brief",
  "augnes_get_autonomy_contract_preview",
  "augnes_get_autonomy_runner_preflight",
  "augnes_get_evidence_pack",
  "augnes_get_session_trace",
  "augnes_get_verification_evidence_records",
  "augnes_observe",
  "augnes_plan",
  "augnes_record_action_result",
  "augnes_list_pending_proposals",
  "augnes_record_work_event",
  "augnes_get_mailbox_summary",
  "augnes_get_publication_summary",
  "augnes_get_publication_decision_card",
] as const;
export const AUGNES_WORK_READ_TOOL_NAMES = [
  "augnes_list_work_items",
  "augnes_get_work_brief",
] as const;
export const PUBLIC_TOOL_NAMES = [
  ...LEGACY_PUBLIC_TOOL_NAMES,
  ...AUGNES_WORK_READ_TOOL_NAMES,
] as const;
const readOnlyAnnotations = {
  readOnlyHint: true,
  destructiveHint: false,
  openWorldHint: false,
} as const;
const bridgeReadAnnotations = {
  readOnlyHint: true,
  destructiveHint: false,
  openWorldHint: true,
} as const;
const localRouteReadAnnotations = {
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: false,
} as const;
const bridgeWriteAnnotations = {
  readOnlyHint: false,
  destructiveHint: false,
  openWorldHint: true,
} as const;
const crossSessionReadBoundaries = {
  read_only: true,
  approval_authority: false,
  publish_authority: false,
  replay_authority: false,
  state_commit_or_reject: false,
  session_bind_create_or_update: false,
  evidence_record_creation: false,
  github_calls: false,
  openai_calls: false,
  codex_execution: false,
  source_of_truth: false,
} as const;
export const WIDGET_CSP = {
  connectDomains: [],
  resourceDomains: [],
  frameDomains: [],
  baseUriDomains: [],
} as const;
const legacyWidgetCsp = {
  connect_domains: WIDGET_CSP.connectDomains,
  resource_domains: WIDGET_CSP.resourceDomains,
} as const;
const widgetToolMeta = { ui: { resourceUri: WIDGET_URI }, profile: config.appProfile } as const;
const modelOnlyToolMeta = { ui: { visibility: ["model"] } } as const;

function narrative(text: string) {
  return [{ type: "text" as const, text }];
}

function asSummaryList(items: string[]): string {
  return items.length ? items.join(", ") : "none";
}

function safeOrigin(rawUrl: string): string | undefined {
  try {
    return new URL(rawUrl).origin;
  } catch {
    return undefined;
  }
}

function sanitizePayload<T>(value: T): T {
  return sanitizeValue(value);
}

function sanitizeModelGatewayBridgeResult<
  T extends {
    workspace_id: string;
    project_id: string;
    model_invocation_receipt: unknown;
  },
>(
  result: T,
  purpose: "observe_delta_compile" | "planner_plan",
): T {
  const receipt = ModelInvocationReceiptSchema.parse(
    result.model_invocation_receipt,
  );
  if (
    receipt.purpose !== purpose ||
    receipt.workspace_id !== result.workspace_id ||
    receipt.project_id !== result.project_id
  ) {
    throw new Error("Model invocation receipt scope is invalid.");
  }
  return {
    ...sanitizePayload(result),
    workspace_id: receipt.workspace_id,
    project_id: receipt.project_id,
    model_invocation_receipt: receipt,
  };
}

function buildToolError(tool: string, error: unknown, panel?: string) {
  const message = error instanceof Error ? error.message : "Unexpected error.";
  const errorPayload = sanitizePayload({
    tool,
    mode: config.coreMode,
    profile: config.appProfile,
    readOnly: true,
    message,
  });

  return {
    structuredContent: panel ? { panel, profile: config.appProfile, error: errorPayload } : { profile: config.appProfile, error: errorPayload },
    content: narrative(`${tool} failed: ${message}`),
    _meta: panel ? sanitizePayload({ panel, profile: config.appProfile, error: errorPayload }) : sanitizePayload({ profile: config.appProfile, error: errorPayload }),
  };
}

function buildBridgeToolError(tool: string, error: unknown) {
  const message = error instanceof Error ? error.message : "Unexpected error.";
  const errorPayload = sanitizePayload({
    tool,
    source: "state_runtime",
    profile: config.appProfile,
    message,
  });

  return {
    structuredContent: { profile: config.appProfile, error: errorPayload },
    content: narrative(`${tool} failed: ${errorPayload.message}`),
    _meta: sanitizePayload({ profile: config.appProfile, error: errorPayload }),
  };
}

export function buildHealthPayload() {
  return {
    ok: true,
    name: APP_NAME,
    version: APP_VERSION,
    mode: config.coreMode,
    readOnly: true,
    profile: config.appProfile,
    ...(config.runtimeInstanceId
      ? { runtime_instance_id: config.runtimeInstanceId }
      : {}),
    ...(config.distributionMode
      ? {
          distribution_mode: config.distributionMode,
          application_version: config.applicationVersion ?? null,
          package_contract: config.packageContract ?? null,
          package_contract_version: config.packageContractVersion,
          build_identity: config.buildIdentity ?? null,
          package_platform: config.packagePlatform ?? null,
          runtime_contract: config.runtimeContract ?? null,
          runtime_schema_version: config.runtimeSchemaVersion,
          database_schema_compatibility:
            config.databaseSchemaCompatibility ?? null,
        }
      : {}),
  };
}

function buildPrivateOwnershipPayload(suppliedToken: string | undefined) {
  if (!constantTimeEqual(suppliedToken, config.runtimeOwnershipToken)) {
    return null;
  }
  return {
    ownership_verified: true,
    schema_version: config.runtimeSchemaVersion,
    contract: config.runtimeContract ?? null,
    generation_version: config.runtimeGenerationVersion,
    generation_id: config.runtimeGenerationId ?? null,
    repository_fingerprint: config.runtimeRepositoryFingerprint ?? null,
    instance_id: config.runtimeInstanceId ?? null,
    role: config.runtimeChildRole ?? null,
    child_root_pid: config.runtimeChildRootPid,
    process_pid: process.pid,
    loopback_port: config.runtimeChildPort,
  };
}

function constantTimeEqual(left: string | undefined, right: string | undefined) {
  if (!left || !right) return false;
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return (
    leftBuffer.length === rightBuffer.length &&
    timingSafeEqual(leftBuffer, rightBuffer)
  );
}

function describeCasefile(casefile: Awaited<ReturnType<AugnesCoreAdapter["openCasefile"]>>): string {
  if (config.appProfile === "chrono_lab") {
    return `Opened casefile for ${casefile.subject}. Supporting evidence: ${casefile.supportingEvidence.length}. Contradicting evidence: ${casefile.contradictingEvidence.length}. Unresolved questions: ${casefile.unresolvedQuestions.length}.`;
  }

  return `Opened ${casefile.subject}: ${casefile.supportingEvidence.length} supporting, ${casefile.contradictingEvidence.length} contradicting, ${casefile.unresolvedQuestions.length} unresolved.`;
}

function describeWorkingView(workingView: Awaited<ReturnType<AugnesCoreAdapter["getWorkingView"]>>): string {
  return `Working view loaded: ${workingView.claimIds.length} claims, ${workingView.topEvidenceIds.length} top evidence refs, ${workingView.activePointers.length} active pointers.`;
}

function describeStrategy(strategy: Awaited<ReturnType<AugnesCoreAdapter["explainStrategy"]>>): string {
  if (config.appProfile === "chrono_lab") {
    return `Loaded strategy rationale for ${strategy.subject}. Recommended action: ${strategy.recommendedAction}. Why: ${strategy.why.join(" ")}`.trim();
  }

  return `Strategy rationale for ${strategy.subject}: ${strategy.recommendedAction}. Control/View context only; not evidence or truth.`;
}

function describeBoundary(packet: Awaited<ReturnType<AugnesCoreAdapter["getBoundaryPacket"]>>): string {
  if (config.appProfile === "chrono_lab") {
    return `Loaded boundary packet ${packet.boundaryId}. Carry-forward candidates: ${packet.carryForwardCandidates.length}. Trace capsules: ${packet.traceCapsuleCandidates.length}.`;
  }

  return `Boundary ${packet.boundaryId}: ${packet.carryForwardCandidates.length} carry-forward candidates, ${packet.lineageNotes.length} lineage notes.`;
}

function describeContinuity(continuity: Awaited<ReturnType<AugnesCoreAdapter["getContinuityReport"]>>): string {
  if (config.appProfile === "chrono_lab") {
    return `Loaded continuity report. Baseline: ${continuity.baselineClass}. Canary status: ${continuity.canaryStatus}. Latest boundary: ${continuity.latestBoundaryId}.`;
  }

  return `Continuity: ${continuity.baselineClass}, canary ${continuity.canaryStatus}, latest boundary ${continuity.latestBoundaryId}.`;
}

function describeRepo(repo: Awaited<ReturnType<AugnesCoreAdapter["navigateRepo"]>>, query: string): string {
  return `Repo navigation for ${query}: ${repo.search.length} search hits, ${repo.explore.length} explore hits. Fetch before treating any repo node as evidence.`;
}

function describeAudit(audit: Awaited<ReturnType<AugnesCoreAdapter["getGovernanceAudit"]>>): string {
  const gateSummary = audit.gateStatus.map((gate) => `${gate.gate}:${gate.status}`).join(", ");
  if (config.appProfile === "chrono_lab") {
    return `Loaded governance audit. Read-only tools: ${audit.readOnlyTools.length}. Promotion bans: ${audit.promotionBans.length}. Gates: ${gateSummary}.`;
  }

  return `Governance summary: ${audit.readOnlyTools.length} read-only tools, ${audit.promotionBans.length} promotion bans, gates ${gateSummary}.`;
}

function stateBlockCount(block: StateBrief["active_state"]): number {
  return Array.isArray(block) ? block.length : Object.keys(block).length;
}

function describeStateBrief(brief: StateBrief): string {
  return `State brief for ${brief.scope}: ${stateBlockCount(brief.active_state)} active, ${brief.pending_proposals.length} pending, ${brief.recent_actions.length} recent action(s), ${brief.open_tensions.length} open tension(s).`;
}

function summarizeNamedFilters(entries: Array<[string, string | undefined]>): string {
  const parts = entries.filter(([, value]) => value).map(([label, value]) => `${label}=${value}`);
  return parts.length ? parts.join(", ") : "no additional filters";
}

function describeEvidencePack(
  scope: string,
  filters: {
    workId?: string;
    publicationId?: string;
    deliveryId?: string;
    targetRef?: string;
  }
): string {
  return [
    `Read-only evidence pack for ${scope} with ${summarizeNamedFilters([
      ["work_id", filters.workId],
      ["publication_id", filters.publicationId],
      ["delivery_id", filters.deliveryId],
      ["target_ref", filters.targetRef],
    ])}.`,
    "This tool does not create evidence rows, bind sessions, publish, replay, approve, mutate state, call GitHub or OpenAI, or execute Codex.",
  ].join(" ");
}

function isSessionTraceListResult(trace: SessionTraceResult): trace is Extract<SessionTraceResult, { sessions: unknown[] }> {
  return Object.prototype.hasOwnProperty.call(trace, "sessions") && Array.isArray((trace as { sessions?: unknown }).sessions);
}

function describeSessionTrace(scope: string, trace: SessionTraceResult, sessionId?: string): string {
  if (isSessionTraceListResult(trace)) {
    const sessionCount = trace.session_count ?? trace.sessions.length;
    const gapCount = trace.gaps?.length ?? 0;
    return [
      `Read-only session trace for ${scope}: ${sessionCount} session(s), ${gapCount} top-level gap(s).`,
      "This tool does not bind, create, or update sessions; create evidence; publish, replay, approve, mutate state, call GitHub or OpenAI, or execute Codex.",
    ].join(" ");
  }

  const resolvedSessionId = sessionId ?? trace.session_id;
  const gapCount = trace.gaps?.length ?? 0;
  return [
    `Read-only session trace for ${resolvedSessionId} in ${scope}: ${gapCount} gap(s) in this bounded view.`,
    "This tool does not bind, create, or update sessions; create evidence; publish, replay, approve, mutate state, call GitHub or OpenAI, or execute Codex.",
  ].join(" ");
}

function countVerificationEvidenceRecords(result: VerificationEvidenceRecordsResult): number {
  if (Array.isArray(result)) {
    return result.length;
  }

  return result.records?.length ?? result.items?.length ?? result.count ?? 0;
}

function describeVerificationEvidenceRecords(
  scope: string,
  result: VerificationEvidenceRecordsResult,
  filters: {
    workId?: string;
    publicationId?: string;
    deliveryId?: string;
    targetSurface?: string;
    targetRef?: string;
    evidenceKind?: string;
    status?: string;
    limit?: number;
  }
): string {
  return [
    `Read-only verification evidence records for ${scope}: ${countVerificationEvidenceRecords(result)} record(s) with ${summarizeNamedFilters([
      ["work_id", filters.workId],
      ["publication_id", filters.publicationId],
      ["delivery_id", filters.deliveryId],
      ["target_surface", filters.targetSurface],
      ["target_ref", filters.targetRef],
      ["evidence_kind", filters.evidenceKind],
      ["status", filters.status],
      ["limit", filters.limit === undefined ? undefined : String(filters.limit)],
    ])}.`,
    "This tool does not create evidence rows, bind sessions, publish, replay, approve, mutate state, call GitHub or OpenAI, or execute Codex.",
  ].join(" ");
}

function describeWorkItems(scope: string, workItems: WorkItem[]): string {
  const attentionCount = workItems.filter((item) => item.user_attention_required).length;
  return `Found ${workItems.length} work item(s) for ${scope}; ${attentionCount} require user attention. Work IDs are trace anchors, not state authority.`;
}

function describeWorkPickerCard(card: WorkPickerCard): string {
  if (!card.work_candidates.length) {
    return `Choose a work item for ${card.scope}: no work items found. Check the scope or select or create a work item in Augnes.`;
  }

  const recommendation = card.recommended_work_id
    ? ` Recommended work: ${card.recommended_work_id}. ${card.selection_reason}`
    : "";
  return `Choose a work item for ${card.scope}: ${card.work_candidates.length} candidate(s).${recommendation}`;
}

function describeWorkBrief(brief: WorkBrief): string {
  return `Work brief for ${brief.work_id}: ${brief.work.title}. Status ${brief.work.status}, priority ${brief.work.priority}, ${brief.recent_events.length} recent event(s), ${brief.related_proof.action_ids.length} linked action record(s). work_id is a trace anchor; committed state remains authoritative.`;
}

type WorkPickerCandidate = {
  work_id: string;
  title: string;
  status: string;
  priority: string;
  summary: string;
  next_step: string | null;
  user_attention_required: boolean;
  related_state_keys_count: number;
  expected_files_count: number;
  expected_checks_count: number;
  linked_docs_count: number;
  is_recommended: boolean;
  open_instruction: string;
};

type WorkPickerCard = {
  card_type: "work_picker_card";
  title: string;
  scope: string;
  candidate_count: number;
  recommended_work_id: string | null;
  recommended_work_title: string | null;
  selection_reason: string;
  next_action_hint: string;
  work_candidates: WorkPickerCandidate[];
  empty_state: string | null;
  source: {
    tool: "augnes_list_work_items";
    structured_content: "workItems";
    next_tool: "augnes_get_work_brief";
  };
  boundaries: {
    read_only: true;
    state_commit_or_reject: false;
    native_host_execution: false;
    branch_or_pr_creation: false;
    proof_recording: false;
    evidence_recording: false;
    provider_calls: false;
    github_calls: false;
    persistence: false;
  };
};

function isCompletedWorkStatus(status: string): boolean {
  return ["completed", "done", "cancelled", "canceled", "archived"].includes(status.trim().toLowerCase());
}

function stringArrayFromUnknown(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    : [];
}

function arrayCount(value: unknown): number {
  return Array.isArray(value) ? value.length : 0;
}

function stringField(record: Record<string, unknown>, field: string): string | null {
  const value = record[field];
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function countLinkedStrings(record: Record<string, unknown>, key: string): number {
  return stringArrayFromUnknown(record[key]).length;
}

function buildWorkPickerCard(scope: string, workItems: WorkItem[]): WorkPickerCard {
  const recommendedItem = workItems.find((item) => !isCompletedWorkStatus(item.status)) ?? workItems[0] ?? null;
  const selectionReason = recommendedItem
    ? workItems.length === 1
      ? "Only work item found for this scope."
      : !isCompletedWorkStatus(recommendedItem.status)
        ? "First active work item for this scope."
        : "First work item returned for this scope."
    : "No work items found for this scope.";

  return {
    card_type: "work_picker_card",
    title: "Choose a work item",
    scope,
    candidate_count: workItems.length,
    recommended_work_id: recommendedItem?.work_id ?? null,
    recommended_work_title: recommendedItem?.title ?? null,
    selection_reason: selectionReason,
    next_action_hint: recommendedItem
      ? `Open the recommended work with augnes_get_work_brief using workId: ${recommendedItem.work_id}.`
      : "No work items found for this scope. Check the scope or select or create a work item in Augnes.",
    empty_state: workItems.length
      ? null
      : "No work items found for this scope. Check the scope or select or create a work item in Augnes.",
    work_candidates: workItems.map((item) => {
      const links = item.links as Record<string, unknown>;
      return {
        work_id: item.work_id,
        title: item.title,
        status: item.status,
        priority: item.priority,
        summary: item.summary,
        next_step: item.next_action,
        user_attention_required: item.user_attention_required === true,
        related_state_keys_count: item.related_state_keys.length,
        expected_files_count: countLinkedStrings(links, "expected_files"),
        expected_checks_count: countLinkedStrings(links, "expected_checks"),
        linked_docs_count: countLinkedStrings(links, "docs"),
        is_recommended: item.work_id === recommendedItem?.work_id,
        open_instruction: `Open this work with augnes_get_work_brief using workId: ${item.work_id}.`,
      };
    }),
    source: {
      tool: "augnes_list_work_items",
      structured_content: "workItems",
      next_tool: "augnes_get_work_brief",
    },
    boundaries: {
      read_only: true,
      state_commit_or_reject: false,
      native_host_execution: false,
      branch_or_pr_creation: false,
      proof_recording: false,
      evidence_recording: false,
      provider_calls: false,
      github_calls: false,
      persistence: false,
    },
  };
}

function describeMailboxSummary(summary: Awaited<ReturnType<StateRuntimeBridgeAdapter["getMailboxSummary"]>>): string {
  const activeCount =
    summary.summary.pending_handoffs.length +
    summary.summary.needs_review.length +
    summary.summary.approval_needed.length +
    summary.summary.blocked_or_partial.length;

  return [
    `Mailbox summary for ${summary.scope}: ${summary.summary.pending_handoffs.length} pending handoff(s), ${summary.summary.needs_review.length} needs-review item(s), ${summary.summary.approval_needed.length} approval-needed item(s), ${summary.summary.blocked_or_partial.length} blocked/partial item(s), ${activeCount} active categorization(s).`,
    "This is a read-only derived view: it does not acknowledge messages, approve or reject state, execute Codex, publish externally, or record proof.",
  ].join(" ");
}

function describePublicationSummary(summary: Awaited<ReturnType<StateRuntimeBridgeAdapter["getPublicationSummary"]>>): string {
  const publicationCount =
    summary.summary.drafts.length +
    summary.summary.approved_previews.length +
    summary.summary.sent.length +
    summary.summary.failed.length +
    summary.summary.cancelled.length;
  const deliveryStatus = summary.summary.delivery_status;

  return [
    `Publication summary for ${summary.scope}: bounded to latest ${summary.limits.publication_limit} publication preview(s) and latest ${summary.limits.delivery_limit} delivery row(s); ${publicationCount} publication preview(s), ${summary.summary.approved_previews.length} approved preview(s), ${summary.summary.failed_deliveries.length} failed delivery item(s). Bounded delivery ledger counts: ${deliveryStatus.pending_count} pending, ${deliveryStatus.sent_count} sent, ${deliveryStatus.failed_count} failed, ${deliveryStatus.acknowledged_count} acknowledged.`,
    "This is a derived read-only view: it does not approve, publish, retry, post to GitHub or Discord, record proof, commit or reject state, or execute Codex.",
  ].join(" ");
}

type PublicationSummaryItem = PublicationSummaryResult["summary"]["drafts"][number];
type FailedDeliverySummaryItem = PublicationSummaryResult["summary"]["failed_deliveries"][number];

type PublicationDecisionCardItem = {
  publication_id: string;
  target_surface: string;
  target_ref: string;
  status: string;
  preview_excerpt: string;
  latest_delivery_status: string | null;
  latest_delivery_error: string | null;
  publish_eligibility: PublicationSummaryItem["publish_eligibility"];
  decision_state: string;
  user_facing_implication: string;
  required_user_decision: string;
  safe_next_step: string;
  source_refs: {
    publication_id: string;
    work_id: string | null;
    source_event_id: string | null;
    latest_delivery_id: string | null;
    failed_delivery_ids: string[];
    publication_summary_as_of: unknown;
    control_packet_as_of: string;
  };
};

type PublicationDecisionCard = {
  scope: string;
  as_of: string;
  title: string;
  status_summary: {
    draft_count: number;
    approved_preview_count: number;
    sent_count: number;
    failed_count: number;
    cancelled_count: number;
    failed_delivery_count: number;
    approved_previews_near_external_side_effect_boundary: boolean;
  };
  publication_items: PublicationDecisionCardItem[];
  delivery_status: {
    status_counts: Record<string, number>;
    failed_deliveries: Array<{
      delivery_id: string;
      publication_id: string;
      status: string;
      error_message: string | null;
      target_surface: string;
      target_ref: string;
      summary_reason: string;
    }>;
  };
  pending_user_decisions: ControlPacket["pending_user_decisions"];
  active_risks: ControlPacket["active_risks"];
  authority_boundaries: ControlPacket["authority_boundaries"];
  forbidden_actions: NonNullable<ControlPacket["forbidden_actions"]>;
  safe_next_steps: string[];
  boundaries: ControlPacket["boundaries"];
};

function buildPublicationDecisionCard(packet: ControlPacket): PublicationDecisionCard {
  const publicationState = packet.relevant_publication_state;
  const failedDeliveries = packet.relevant_delivery_state.failed_deliveries;
  const failedDeliveriesByPublication = failedDeliveries.reduce((map, delivery) => {
    const existing = map.get(delivery.publication_id) ?? [];
    existing.push(delivery);
    map.set(delivery.publication_id, existing);
    return map;
  }, new Map<string, FailedDeliverySummaryItem[]>());

  const publicationItems = [
    ...publicationState.drafts.map((item) => buildPublicationDecisionCardItem(item, packet, failedDeliveriesByPublication)),
    ...publicationState.approved_previews.map((item) => buildPublicationDecisionCardItem(item, packet, failedDeliveriesByPublication)),
    ...publicationState.sent.map((item) => buildPublicationDecisionCardItem(item, packet, failedDeliveriesByPublication)),
    ...publicationState.failed.map((item) => buildPublicationDecisionCardItem(item, packet, failedDeliveriesByPublication)),
    ...publicationState.cancelled.map((item) => buildPublicationDecisionCardItem(item, packet, failedDeliveriesByPublication)),
  ];

  return {
    scope: packet.scope,
    as_of: packet.as_of,
    title: "Read-only publication decision card",
    status_summary: {
      draft_count: publicationState.drafts.length,
      approved_preview_count: publicationState.approved_previews.length,
      sent_count: publicationState.sent.length,
      failed_count: publicationState.failed.length,
      cancelled_count: publicationState.cancelled.length,
      failed_delivery_count: failedDeliveries.length,
      approved_previews_near_external_side_effect_boundary: publicationState.approved_previews.length > 0,
    },
    publication_items: publicationItems,
    delivery_status: {
      status_counts: packet.relevant_delivery_state.status_counts,
      failed_deliveries: failedDeliveries.map((delivery) => ({
        delivery_id: delivery.delivery_id,
        publication_id: delivery.publication_id,
        status: delivery.status,
        error_message: delivery.error_message,
        target_surface: delivery.target_surface,
        target_ref: delivery.target_ref,
        summary_reason: delivery.summary_reason,
      })),
    },
    pending_user_decisions: packet.pending_user_decisions,
    active_risks: packet.active_risks,
    authority_boundaries: packet.authority_boundaries,
    forbidden_actions: packet.forbidden_actions ?? [],
    safe_next_steps: [
      "Review publication previews, target refs, delivery state, and active risks.",
      "Treat approved previews as near an external side-effect boundary; approval is not publication.",
      "Use a separately scoped Core-gated workflow for any future approval, publish, retry, or proof-recording action.",
      "Do not treat PR #67 as automatic posting permission.",
    ],
    boundaries: packet.boundaries,
  };
}

function buildPublicationDecisionCardItem(
  item: PublicationSummaryItem,
  packet: ControlPacket,
  failedDeliveriesByPublication: Map<string, FailedDeliverySummaryItem[]>
): PublicationDecisionCardItem {
  const failedDeliveries = failedDeliveriesByPublication.get(item.publication_id) ?? [];
  const mapping = publicationDecisionMapping(item.status);
  const latestFailedDelivery = failedDeliveries[0];

  return {
    publication_id: item.publication_id,
    target_surface: item.target_surface,
    target_ref: item.target_ref,
    status: item.status,
    preview_excerpt: item.preview_excerpt,
    latest_delivery_status: item.latest_delivery_status ?? latestFailedDelivery?.status ?? null,
    latest_delivery_error: item.latest_delivery_error ?? latestFailedDelivery?.error_message ?? null,
    publish_eligibility: item.publish_eligibility,
    decision_state: mapping.decision_state,
    user_facing_implication: mapping.user_facing_implication,
    required_user_decision: mapping.required_user_decision,
    safe_next_step: mapping.safe_next_step,
    source_refs: {
      publication_id: item.publication_id,
      work_id: item.work_id,
      source_event_id: item.source_event_id,
      latest_delivery_id: item.latest_delivery_id,
      failed_delivery_ids: failedDeliveries.map((delivery) => delivery.delivery_id),
      publication_summary_as_of: packet.source_refs.publication_summary_as_of,
      control_packet_as_of: packet.as_of,
    },
  };
}

function publicationDecisionMapping(status: string) {
  switch (status) {
    case "draft":
      return {
        decision_state: "needs_preview_or_approval_decision",
        user_facing_implication: "A draft preview exists, but this card cannot approve it or create any external side effect.",
        required_user_decision: "Review whether this draft should be approved later; this tool cannot approve it.",
        safe_next_step: "Review the preview and scope any later approval through a separate Core-gated workflow.",
      };
    case "approved":
      return {
        decision_state: "approved_preview_needs_separate_publish_decision",
        user_facing_implication: "This approved preview is near an external side-effect boundary; approval is not publication.",
        required_user_decision: "Decide separately whether to publish to the stored target; approval is not publication.",
        safe_next_step: "Confirm target approval, delivery freshness, token availability, idempotency, and replay/no-duplicate evidence before any separate publish workflow.",
      };
    case "sent":
      return {
        decision_state: "already_sent",
        user_facing_implication: "The publication is already recorded as sent; this card is only review context.",
        required_user_decision: "No publish decision needed unless follow-up acknowledgement/review is separately scoped.",
        safe_next_step: "Review acknowledgement or follow-up only if separately scoped.",
      };
    case "failed":
      return {
        decision_state: "failed_delivery_needs_review",
        user_facing_implication: "A delivery failed and may need diagnosis; this card cannot retry it.",
        required_user_decision: "Review failure context; retry is not available from this tool.",
        safe_next_step: "Inspect failure context and scope any retry through a separate Core-gated workflow.",
      };
    case "cancelled":
      return {
        decision_state: "cancelled",
        user_facing_implication: "The draft was cancelled; no publish flow is active from this item.",
        required_user_decision: "No publish decision needed unless a new draft is separately created.",
        safe_next_step: "Create or review a new draft only through a separately scoped workflow.",
      };
    default:
      return {
        decision_state: "unknown_publication_status_needs_review",
        user_facing_implication: "The publication status is not recognized by this card; no write action is available.",
        required_user_decision: "Review this status in Augnes Core/Cockpit before scoping any follow-up.",
        safe_next_step: "Use read-only source refs to inspect the publication state.",
      };
  }
}

function describePublicationDecisionCard(card: PublicationDecisionCard): string {
  const summary = card.status_summary;

  return [
    `Read-only publication decision card for ${card.scope}: ${summary.draft_count} draft(s), ${summary.approved_preview_count} approved preview(s), ${summary.sent_count} sent, ${summary.failed_count} failed, ${summary.cancelled_count} cancelled, and ${summary.failed_delivery_count} failed delivery item(s).`,
    summary.approved_preview_count > 0
      ? "Approved previews are near an external side-effect boundary; actual GitHub posting remains separately gated."
      : "No approved preview is currently near the publish boundary in this bounded view.",
    "This tool does not approve, publish, retry, record proof, commit or reject state, execute Codex, mutate GitHub, or post to Discord.",
  ].join(" ");
}

const PROJECT_CONSTELLATION_BOUNDARY_TEXT = [
  "This preview is read-only.",
  "Evidence pointers are pointer-only.",
  "Next action candidates are advisory.",
  "The preview cannot execute a native host, admit a receipt, mutate state, or perform an external action.",
  "Durable approval remains user/Core gated.",
] as const;

type ConstellationProject = ConstellationPreviewResult["project_constellation"];
type ConstellationEvidencePointer = ConstellationPreviewResult["evidence_pointers"][number];
type ConstellationTension = ConstellationPreviewResult["unresolved_tensions"][number];
type ConstellationNextAction = ConstellationPreviewResult["next_action_candidates"][number];
type ConstellationSourceRef = ConstellationPreviewResult["source_refs"][number];

type ProjectConstellationSelectionStatus = "selected" | "defaulted" | "requested_not_found" | "unavailable";

type ProjectConstellationSelection = {
  requested_candidate_id: string | null;
  selected_candidate_id: string | null;
  selected_candidate_label: string | null;
  selection_status: ProjectConstellationSelectionStatus;
  selection_fallback_reason: string | null;
};

type ProjectConstellationPreviewSurface = {
  preview_type: "project_constellation_preview_surface";
  title: "Project Constellation Preview";
  scope: string;
  status: "available" | "unavailable";
  fallback_text: string | null;
  project_constellation: ConstellationProject;
  evidence_pointers: ConstellationEvidencePointer[];
  unresolved_tensions: ConstellationTension[];
  next_action_candidates: ConstellationNextAction[];
  requested_candidate_id: string | null;
  selected_candidate_id: string | null;
  selected_candidate_label: string | null;
  selection_status: ProjectConstellationSelectionStatus;
  selection_fallback_reason: string | null;
  selection: ProjectConstellationSelection;
  selected_context: {
    candidate_id: string | null;
    candidate_label: string | null;
    advisory_only: true;
  };
  source_refs: ConstellationSourceRef[];
  missing_data_fallbacks: string[];
  boundaries: {
    read_only: true;
    local_route_read: true;
    state_commit_or_reject: false;
    native_host_execution: false;
    receipt_admission: false;
    proof_recording: false;
    evidence_recording: false;
    branch_or_pr_creation: false;
    approval_authority: false;
    publish_authority: false;
    retry_authority: false;
    replay_authority: false;
    deploy_authority: false;
    merge_authority: false;
    github_calls: false;
    openai_calls: false;
    provider_calls: false;
    persistence: false;
    source_of_truth: false;
  };
};

function fallbackProjectConstellation(reason: string): ConstellationProject {
  return {
    constellation_id: "project_constellation.unavailable",
    boundary_class: "read_only_local_static_preview",
    thesis: `Project Constellation preview unavailable: ${reason}`,
    nodes: [],
    edges: [],
    clusters: [],
    evidence_pointers: [],
    unresolved_tensions: [],
    next_action_candidates: [],
  };
}

function normalizeRequestedCandidateId(value?: string | null): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function resolveProjectConstellationSelection(input: {
  nextActionCandidates: ConstellationNextAction[];
  requestedCandidateId?: string | null;
  fallbackText: string | null;
}): ProjectConstellationSelection {
  const requestedCandidateId = normalizeRequestedCandidateId(input.requestedCandidateId);

  if (input.fallbackText || !input.nextActionCandidates.length) {
    return {
      requested_candidate_id: requestedCandidateId,
      selected_candidate_id: null,
      selected_candidate_label: null,
      selection_status: "unavailable",
      selection_fallback_reason: requestedCandidateId
        ? `Requested candidate ${requestedCandidateId} could not be selected because the Project Constellation preview is unavailable. No missing context was invented.`
        : "No advisory next action candidate was returned. No missing context was invented.",
    };
  }

  const requestedCandidate = requestedCandidateId
    ? input.nextActionCandidates.find((candidate) => candidate.candidate_id === requestedCandidateId)
    : null;
  if (requestedCandidate) {
    return {
      requested_candidate_id: requestedCandidateId,
      selected_candidate_id: requestedCandidate.candidate_id,
      selected_candidate_label: requestedCandidate.label,
      selection_status: "selected",
      selection_fallback_reason: null,
    };
  }

  const defaultCandidate = input.nextActionCandidates[0];
  if (requestedCandidateId) {
    return {
      requested_candidate_id: requestedCandidateId,
      selected_candidate_id: defaultCandidate.candidate_id,
      selected_candidate_label: defaultCandidate.label,
      selection_status: "requested_not_found",
      selection_fallback_reason: `Requested candidate ${requestedCandidateId} was not returned; using default candidate ${defaultCandidate.candidate_id}. No missing context was invented.`,
    };
  }

  return {
    requested_candidate_id: null,
    selected_candidate_id: defaultCandidate.candidate_id,
    selected_candidate_label: defaultCandidate.label,
    selection_status: "defaulted",
    selection_fallback_reason: null,
  };
}

function buildProjectConstellationPreviewSurface({
  scope,
  routePreview,
  requestedCandidateId = null,
  fallbackText = null,
}: {
  scope: string;
  routePreview?: ConstellationPreviewResult;
  requestedCandidateId?: string | null;
  fallbackText?: string | null;
}): ProjectConstellationPreviewSurface {
  const projectConstellation = routePreview?.project_constellation ?? fallbackProjectConstellation(fallbackText ?? "missing route payload");
  const evidencePointers = routePreview?.evidence_pointers ?? projectConstellation.evidence_pointers;
  const unresolvedTensions = routePreview?.unresolved_tensions ?? projectConstellation.unresolved_tensions;
  const nextActionCandidates = routePreview?.next_action_candidates ?? projectConstellation.next_action_candidates;
  const sourceRefs = routePreview?.source_refs ?? [];
  const missingDataFallbacks = [
    ...(projectConstellation.nodes.length ? [] : ["No node summaries were returned."]),
    ...(projectConstellation.edges.length ? [] : ["No edge summaries were returned."]),
    ...(projectConstellation.clusters.length ? [] : ["No cluster summaries were returned."]),
    ...(evidencePointers.length ? [] : ["No evidence pointers were returned."]),
    ...(unresolvedTensions.length ? [] : ["No unresolved tensions were returned."]),
    ...(nextActionCandidates.length ? [] : ["No advisory next action candidates were returned."]),
    ...(fallbackText ? [fallbackText, "Fallback text is explicit; no missing Project Constellation context was invented."] : []),
  ];
  const selection = resolveProjectConstellationSelection({
    nextActionCandidates,
    requestedCandidateId,
    fallbackText,
  });

  return {
    preview_type: "project_constellation_preview_surface",
    title: "Project Constellation Preview",
    scope,
    status: fallbackText ? "unavailable" : "available",
    fallback_text: fallbackText,
    project_constellation: projectConstellation,
    evidence_pointers: evidencePointers,
    unresolved_tensions: unresolvedTensions,
    next_action_candidates: nextActionCandidates,
    requested_candidate_id: selection.requested_candidate_id,
    selected_candidate_id: selection.selected_candidate_id,
    selected_candidate_label: selection.selected_candidate_label,
    selection_status: selection.selection_status,
    selection_fallback_reason: selection.selection_fallback_reason,
    selection,
    selected_context: {
      candidate_id: selection.selected_candidate_id,
      candidate_label: selection.selected_candidate_label,
      advisory_only: true,
    },
    source_refs: sourceRefs,
    missing_data_fallbacks: missingDataFallbacks,
    boundaries: {
      read_only: true,
      local_route_read: true,
      state_commit_or_reject: false,
      native_host_execution: false,
      receipt_admission: false,
      proof_recording: false,
      evidence_recording: false,
      branch_or_pr_creation: false,
      approval_authority: false,
      publish_authority: false,
      retry_authority: false,
      replay_authority: false,
      deploy_authority: false,
      merge_authority: false,
      github_calls: false,
      openai_calls: false,
      provider_calls: false,
      persistence: false,
      source_of_truth: false,
    },
  };
}

function describeProjectConstellationPreviewSurface(surface: ProjectConstellationPreviewSurface): string {
  if (surface.status === "unavailable") {
    return [
      `Project Constellation preview for ${surface.scope} is unavailable.`,
      surface.fallback_text ?? "No route payload was returned.",
      "No missing context was invented.",
      PROJECT_CONSTELLATION_BOUNDARY_TEXT.join(" "),
    ].join(" ");
  }

  const selectionSummary = surface.selected_candidate_label
    ? `Advisory selection ${surface.selection_status === "defaulted" ? "defaults to" : "uses"} ${surface.selected_candidate_label}.`
    : "No advisory action candidate was available.";

  return [
    `Project Constellation preview for ${surface.scope}: ${surface.project_constellation.nodes.length} node(s), ${surface.project_constellation.edges.length} edge(s), ${surface.project_constellation.clusters.length} cluster(s), ${surface.evidence_pointers.length} pointer-only evidence ref(s), ${surface.unresolved_tensions.length} unresolved tension(s), and ${surface.next_action_candidates.length} advisory next action candidate(s).`,
    `Thesis: ${surface.project_constellation.thesis}`,
    surface.selection_status === "requested_not_found" && surface.selection_fallback_reason
      ? surface.selection_fallback_reason
      : selectionSummary,
    PROJECT_CONSTELLATION_BOUNDARY_TEXT.join(" "),
  ].join(" ");
}

function guideBriefItemCount(value: unknown): number {
  return Array.isArray(value) ? value.length : 0;
}

function summarizeGuideBriefSourceRefs(guideBrief: GuideBriefResult): Record<string, unknown> {
  const sourceRefs =
    guideBrief.source_refs && typeof guideBrief.source_refs === "object"
      ? (guideBrief.source_refs as Record<string, unknown>)
      : {};

  return {
    current_working_perspective_ref: sourceRefs.current_working_perspective_ref ?? null,
    delta_projection_ref: sourceRefs.delta_projection_ref ?? null,
    workplane_ref: sourceRefs.workplane_ref ?? null,
    perspective_snapshot_ref_count: guideBriefItemCount(sourceRefs.perspective_snapshot_refs),
    delta_id_count: guideBriefItemCount(sourceRefs.delta_ids),
    batch_id_count: guideBriefItemCount(sourceRefs.batch_ids),
    evidence_ref_count: guideBriefItemCount(sourceRefs.evidence_refs),
    artifact_ref_count: guideBriefItemCount(sourceRefs.artifact_refs),
    handoff_ref_count: guideBriefItemCount(sourceRefs.handoff_refs),
    diagnostic_ref_count: guideBriefItemCount(sourceRefs.diagnostic_refs),
    route_refs: Array.isArray(sourceRefs.route_refs) ? sourceRefs.route_refs : [],
    docs_refs: Array.isArray(sourceRefs.docs_refs) ? sourceRefs.docs_refs : [],
  };
}

function buildGuideBriefSummary(guideBrief: GuideBriefResult) {
  const observedCount = guideBrief.observed.length;
  const inferredCount = guideBrief.inferred.length;
  const suggestedCount = guideBrief.suggested.length;
  const needsUserJudgmentCount = guideBrief.needs_user_judgment.length;
  const stalenessWarningCount = guideBriefItemCount(guideBrief.staleness_warnings);
  const handoffCandidateCount = guideBriefItemCount(guideBrief.handoff_candidates);

  return {
    scope: guideBrief.scope,
    guide_version: guideBrief.guide_version,
    observed_count: observedCount,
    inferred_count: inferredCount,
    suggested_count: suggestedCount,
    needs_user_judgment_count: needsUserJudgmentCount,
    staleness_warning_count: stalenessWarningCount,
    handoff_candidate_count: handoffCandidateCount,
    read_boundary: {
      source_route: "GET /api/augnes/read/guide-brief",
      local_readonly_marker: "x-augnes-local-readonly: guide-brief-v0.1",
      guide_brief_read_only: true,
      suggestions_are_actions: false,
      handoff_execution_authority: false,
      codex_execution_authority: false,
      github_openai_provider_calls: false,
      proof_evidence_writes: false,
      state_memory_db_mutation: false,
    },
  };
}

const GUIDE_BRIEF_AUTHORITY_BOUNDARY_FALSE_FIELDS = [
  "source_of_truth",
  "can_commit_or_reject_state",
  "can_record_proof",
  "can_create_evidence",
  "can_update_work",
  "can_mutate_memory",
  "can_apply_project_perspective",
  "can_publish_external",
  "can_merge",
  "can_retry_replay_deploy",
  "can_call_github",
  "can_call_openai_or_provider",
  "can_execute_codex",
  "can_create_branch_or_pr",
  "can_send_handoff",
  "can_launch_autonomy",
  "can_create_mcp_tool",
  "can_create_ui_action",
] as const;

const GUIDE_BRIEF_READ_BOUNDARY_FALSE_FIELDS = [
  "github_openai_provider_calls",
  "codex_execution_authority",
  "handoff_execution_authority",
  "proof_evidence_writes",
  "state_memory_db_mutation",
  "suggestions_are_actions",
] as const;

function objectRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function restoreFalseBoundaryFields(
  sanitizedBoundary: unknown,
  sourceBoundary: unknown,
  falseFields: readonly string[]
): Record<string, unknown> {
  const restored = { ...objectRecord(sanitizedBoundary) };
  const source = objectRecord(sourceBoundary);

  for (const field of falseFields) {
    if (source[field] === false) {
      restored[field] = false;
    }
  }

  return restored;
}

function restoreGuideBriefAuthorityBoundary(
  sanitizedAuthorityBoundary: unknown,
  guideBrief: GuideBriefResult
): Record<string, unknown> {
  return restoreFalseBoundaryFields(
    sanitizedAuthorityBoundary,
    guideBrief.authority_boundary,
    GUIDE_BRIEF_AUTHORITY_BOUNDARY_FALSE_FIELDS
  );
}

function restoreGuideBriefReadBoundary(
  sanitizedReadBoundary: unknown,
  guideBriefSummary: ReturnType<typeof buildGuideBriefSummary>
): Record<string, unknown> {
  return restoreFalseBoundaryFields(
    sanitizedReadBoundary,
    guideBriefSummary.read_boundary,
    GUIDE_BRIEF_READ_BOUNDARY_FALSE_FIELDS
  );
}

function buildGuideBriefStructuredContent({
  guideBrief,
  guideBriefSummary,
  compact,
}: {
  guideBrief: GuideBriefResult;
  guideBriefSummary: ReturnType<typeof buildGuideBriefSummary>;
  compact: boolean | undefined;
}): Record<string, unknown> {
  const structuredContent = sanitizePayload({
    profile: config.appProfile,
    guideBrief,
    guide_brief: guideBrief,
    guideBriefSummary,
    guide_summary: guideBriefSummary,
    compact: compact ?? true,
    observed_count: guideBriefSummary.observed_count,
    inferred_count: guideBriefSummary.inferred_count,
    suggested_count: guideBriefSummary.suggested_count,
    needs_user_judgment_count: guideBriefSummary.needs_user_judgment_count,
    staleness_warning_count: guideBriefSummary.staleness_warning_count,
    handoff_candidate_count: guideBriefSummary.handoff_candidate_count,
    authority_boundary: guideBrief.authority_boundary,
    surface_rendering_notes: guideBrief.surface_rendering_notes ?? {},
    read_boundary: guideBriefSummary.read_boundary,
    route_boundary: guideBriefSummary.read_boundary,
    source_refs: summarizeGuideBriefSourceRefs(guideBrief),
  }) as Record<string, unknown>;

  structuredContent.authority_boundary = restoreGuideBriefAuthorityBoundary(
    structuredContent.authority_boundary,
    guideBrief
  );
  structuredContent.read_boundary = restoreGuideBriefReadBoundary(
    structuredContent.read_boundary,
    guideBriefSummary
  );
  structuredContent.route_boundary = restoreGuideBriefReadBoundary(
    structuredContent.route_boundary,
    guideBriefSummary
  );

  for (const guideBriefKey of ["guideBrief", "guide_brief"] as const) {
    const sanitizedGuideBrief = objectRecord(structuredContent[guideBriefKey]);
    structuredContent[guideBriefKey] = {
      ...sanitizedGuideBrief,
      authority_boundary: restoreGuideBriefAuthorityBoundary(
        sanitizedGuideBrief.authority_boundary,
        guideBrief
      ),
    };
  }

  return structuredContent;
}

function describeGuideBrief(guideBrief: GuideBriefResult): string {
  const summary = buildGuideBriefSummary(guideBrief);

  return [
    `GuideBrief loaded for scope ${guideBrief.scope}: ${summary.observed_count} observed, ${summary.inferred_count} inferred, ${summary.suggested_count} suggested, and ${summary.needs_user_judgment_count} needs_user_judgment item(s).`,
    `${summary.staleness_warning_count} staleness warning(s); ${summary.handoff_candidate_count} handoff candidate(s).`,
    "Handoff candidates are preview-only.",
    "Suggestions are not actions.",
    "Needs user judgment items are not decided by the guide.",
    "Read-only tool: no writes, no Codex execution, no GitHub/OpenAI/provider calls, no handoff send.",
  ].join(" ");
}

const AUTONOMY_PREVIEW_AUTHORITY_BOUNDARY_FALSE_FIELDS = [
  "source_of_truth",
  "can_commit_or_reject_state",
  "can_record_proof",
  "can_create_evidence",
  "can_update_work",
  "can_mutate_memory",
  "can_apply_project_perspective",
  "can_publish_external",
  "can_merge",
  "can_retry_replay_deploy",
  "can_call_github",
  "can_call_openai_or_provider",
  "can_execute_codex",
  "can_create_branch_or_pr",
  "can_send_handoff",
  "can_launch_codex",
  "can_launch_autonomy",
  "can_schedule_background_work",
  "can_create_mcp_tool",
  "can_create_ui_action",
  "can_post_external_comment",
  "can_write_db",
  "can_start_daemon",
] as const;

const AUTONOMY_PREVIEW_READ_BOUNDARY_FALSE_FIELDS = [
  "autonomy_runner_authority",
  "scheduler_authority",
  "daemon_authority",
  "background_work_authority",
  "codex_execution_authority",
  "codex_launch_authority",
  "branch_pr_creation_authority",
  "github_openai_provider_calls",
  "proof_evidence_writes",
  "state_memory_db_mutation",
  "handoff_send_authority",
  "publish_merge_retry_replay_deploy",
  "external_post_authority",
  "auto_apply_authority",
  "budget_spend_permission",
  "run_preview_is_execution",
] as const;

function buildAutonomyPreviewReadBoundary() {
  return {
    source_route: "GET /api/augnes/read/autonomy-contract",
    local_readonly_marker: "x-augnes-local-readonly: autonomy-contract-v0.1",
    preview_review_planning_only: true,
    suggestions_are_advisory_only: true,
    unresolved_user_judgment_remains_unresolved: true,
    autonomy_runner_authority: false,
    scheduler_authority: false,
    daemon_authority: false,
    background_work_authority: false,
    codex_execution_authority: false,
    codex_launch_authority: false,
    branch_pr_creation_authority: false,
    github_openai_provider_calls: false,
    proof_evidence_writes: false,
    state_memory_db_mutation: false,
    handoff_send_authority: false,
    publish_merge_retry_replay_deploy: false,
    external_post_authority: false,
    auto_apply_authority: false,
    budget_spend_permission: false,
    run_preview_is_execution: false,
  };
}

function restoreAutonomyPreviewAuthorityBoundary(
  sanitizedAuthorityBoundary: unknown,
  sourceAuthorityBoundary: unknown
): Record<string, unknown> {
  return restoreFalseBoundaryFields(
    sanitizedAuthorityBoundary,
    sourceAuthorityBoundary,
    AUTONOMY_PREVIEW_AUTHORITY_BOUNDARY_FALSE_FIELDS
  );
}

function restoreAutonomyPreviewReadBoundary(
  sanitizedReadBoundary: unknown,
  sourceReadBoundary: unknown
): Record<string, unknown> {
  return restoreFalseBoundaryFields(
    sanitizedReadBoundary,
    sourceReadBoundary,
    AUTONOMY_PREVIEW_READ_BOUNDARY_FALSE_FIELDS
  );
}

function summarizeAutonomyPreviewSourceStatus(result: AutonomyContractPreviewResult): Record<string, unknown> {
  return objectRecord(result.source_status);
}

function summarizeAutonomyPreviewAuthorityBoundary(
  sourceAuthorityBoundary: unknown,
  readBoundary: Record<string, unknown>
): Record<string, unknown> {
  return {
    authority_boundary: restoreAutonomyPreviewAuthorityBoundary(
      sourceAuthorityBoundary,
      sourceAuthorityBoundary
    ),
    read_boundary: restoreAutonomyPreviewReadBoundary(readBoundary, readBoundary),
    summary:
      "Read-only preview only: no autonomy runner, no scheduler, no daemon, no background work, no Codex execution, no Codex launch, no GitHub/OpenAI/provider calls, no DB writes, no proof/evidence writes, no memory/state/work/Perspective mutation, no handoff send, no branch/PR creation, no merge/publish/retry/replay/deploy, no external posting, auto_apply_allowed remains false, run_preview.status remains preview_only, and budget is not spend permission.",
  };
}

function autonomyRefsFromSource(
  sourceRefs: Record<string, unknown>,
  pluralField: string,
  fallback: unknown
): unknown[] {
  const refs = sourceRefs[pluralField];
  if (Array.isArray(refs)) return refs;
  if (fallback === undefined || fallback === null) return [];
  return Array.isArray(fallback) ? fallback : [fallback];
}

function buildAutonomyContractPreviewSummary(result: AutonomyContractPreviewResult) {
  const contract = objectRecord(result.contract);
  const deltaMergePolicy = objectRecord(contract.delta_merge_policy);
  const runPreview = objectRecord(contract.run_preview);
  const budget = objectRecord(contract.budget);

  return {
    contract_id: stringField(contract, "contract_id"),
    status: stringField(contract, "status"),
    autonomy_mode: stringField(contract, "autonomy_mode"),
    title: stringField(contract, "title"),
    goal: stringField(contract, "goal"),
    run_preview_status: stringField(runPreview, "status"),
    auto_apply_allowed: deltaMergePolicy.auto_apply_allowed === true ? true : false,
    auto_apply_target_count: arrayCount(deltaMergePolicy.auto_apply_targets),
    budget_id: stringField(budget, "budget_id"),
    source_status: summarizeAutonomyPreviewSourceStatus(result),
    allowed_action_count: arrayCount(contract.allowed_actions),
    forbidden_action_count: arrayCount(contract.forbidden_actions),
    stop_condition_count: arrayCount(contract.stop_conditions),
    warning_count: arrayCount(result.warnings),
    gap_count: arrayCount(result.gaps),
  };
}

function buildAutonomyContractPreviewStructuredContent({
  result,
  compact,
}: {
  result: AutonomyContractPreviewResult;
  compact: boolean | undefined;
}): Record<string, unknown> {
  const contract = objectRecord(result.contract);
  const sourceRefs = objectRecord(contract.source_refs);
  const readBoundary = buildAutonomyPreviewReadBoundary();
  const summary = buildAutonomyContractPreviewSummary(result);
  const structuredContent = sanitizePayload({
    profile: config.appProfile,
    panel: "autonomy_contract_preview",
    packet_label: "Autonomy Contract preview",
    scope: result.scope,
    route_id: result.route_id,
    route_family: result.route_family,
    compact: compact ?? true,
    contract: result.contract,
    autonomy_contract: result.contract,
    contract_summary: summary,
    autonomy_contract_summary: summary,
    bounded_context_summary: contract.bounded_context_summary ?? "",
    source_refs: sourceRefs,
    guide_brief_refs: autonomyRefsFromSource(
      sourceRefs,
      "guide_brief_refs",
      contract.guide_brief_ref
    ),
    handoff_capsule_refs: autonomyRefsFromSource(
      sourceRefs,
      "handoff_capsule_refs",
      contract.handoff_capsule_refs
    ),
    codex_launch_card_refs: autonomyRefsFromSource(
      sourceRefs,
      "codex_launch_card_refs",
      contract.codex_launch_card_refs
    ),
    current_working_perspective_refs: autonomyRefsFromSource(
      sourceRefs,
      "current_working_perspective_refs",
      contract.current_working_perspective_ref
    ),
    delta_projection_refs: autonomyRefsFromSource(
      sourceRefs,
      "delta_projection_refs",
      contract.delta_projection_ref
    ),
    allowed_agents: contract.allowed_agents ?? [],
    allowed_surfaces: contract.allowed_surfaces ?? [],
    allowed_actions: contract.allowed_actions ?? [],
    forbidden_actions: contract.forbidden_actions ?? [],
    budget: contract.budget ?? {},
    reporting_cadence: contract.reporting_cadence ?? {},
    stop_conditions: contract.stop_conditions ?? [],
    delta_merge_policy: contract.delta_merge_policy ?? {},
    review_escalation_policy: contract.review_escalation_policy ?? {},
    output_policy: contract.output_policy ?? {},
    staleness_policy: contract.staleness_policy ?? {},
    validation_policy: contract.validation_policy ?? {},
    run_preview: contract.run_preview ?? {},
    authority_boundary: contract.authority_boundary,
    route_authority_boundary: result.route_authority_boundary,
    read_boundary: readBoundary,
    route_boundary: readBoundary,
    source_status: result.source_status,
    warnings: result.warnings ?? [],
    gaps: result.gaps ?? [],
    public_safety: contract.public_safety ?? {},
    boundary_summary:
      "Read-only preview only: no autonomy runner, no scheduler, no daemon, no background work, no Codex execution, no Codex launch, no GitHub/OpenAI/provider calls, no DB writes, no proof/evidence writes, no memory/state/work/Perspective mutation, no handoff send, no branch/PR creation, no merge/publish/retry/replay/deploy, no external posting, auto_apply_allowed remains false, run_preview.status remains preview_only, and budget is not spend permission.",
  }) as Record<string, unknown>;

  structuredContent.authority_boundary = restoreAutonomyPreviewAuthorityBoundary(
    structuredContent.authority_boundary,
    contract.authority_boundary
  );
  structuredContent.read_boundary = restoreAutonomyPreviewReadBoundary(
    structuredContent.read_boundary,
    readBoundary
  );
  structuredContent.route_boundary = restoreAutonomyPreviewReadBoundary(
    structuredContent.route_boundary,
    readBoundary
  );
  structuredContent.authority_boundary_summary = summarizeAutonomyPreviewAuthorityBoundary(
    contract.authority_boundary,
    readBoundary
  );

  for (const contractKey of ["contract", "autonomy_contract"] as const) {
    const sanitizedContract = objectRecord(structuredContent[contractKey]);
    structuredContent[contractKey] = {
      ...sanitizedContract,
      authority_boundary: restoreAutonomyPreviewAuthorityBoundary(
        sanitizedContract.authority_boundary,
        contract.authority_boundary
      ),
    };
  }

  return structuredContent;
}

function describeAutonomyContractPreview(result: AutonomyContractPreviewResult): string {
  const summary = buildAutonomyContractPreviewSummary(result);

  return [
    `Autonomy Contract preview loaded for scope ${result.scope}: contract ${summary.contract_id ?? "unknown"}, status ${summary.status ?? "unknown"}, mode ${summary.autonomy_mode ?? "unknown"}, ${summary.allowed_action_count} allowed action(s), ${summary.forbidden_action_count} forbidden action(s), and ${summary.stop_condition_count} stop condition(s).`,
    `${summary.warning_count} warning(s), ${summary.gap_count} gap(s).`,
    `Run preview status: ${summary.run_preview_status ?? "unknown"}; auto_apply_allowed: ${String(summary.auto_apply_allowed)}; auto_apply_targets: ${summary.auto_apply_target_count}.`,
    "Read-only Autonomy Contract preview tool for preview/review planning only.",
    "Budget is not spend permission.",
    "Suggestions or candidate actions are advisory/planning only.",
    "Unresolved user judgment remains unresolved.",
    "Read-only tool: no autonomy runner, no scheduler, no daemon, no background work, no Codex execution, no Codex launch, no GitHub/OpenAI/provider calls, no branch/PR creation, no proof/evidence writes, no state/memory/DB/work/Perspective mutation, no handoff send, no publish/merge/retry/replay/deploy/external post.",
  ].join(" ");
}

const AUTONOMY_RUNNER_PREFLIGHT_AUTHORITY_BOUNDARY_FALSE_FIELDS = [
  "source_of_truth",
  "can_start_runner",
  "can_schedule_runner",
  "can_start_daemon",
  "can_start_background_work",
  "can_commit_or_reject_state",
  "can_record_proof",
  "can_create_evidence",
  "can_update_work",
  "can_mutate_memory",
  "can_apply_project_perspective",
  "can_publish_external",
  "can_merge",
  "can_retry_replay_deploy",
  "can_call_github",
  "can_call_openai_or_provider",
  "can_execute_codex",
  "can_create_branch_or_pr",
  "can_send_handoff",
  "can_launch_codex",
  "can_launch_autonomy",
  "can_schedule_background_work",
  "can_create_mcp_tool",
  "can_create_ui_action",
  "can_post_external_comment",
  "can_write_db",
  "can_spend_budget",
  "can_auto_apply_delta",
] as const;

const AUTONOMY_RUNNER_PREFLIGHT_READ_BOUNDARY_FALSE_FIELDS = [
  "runner_authority",
  "scheduler_authority",
  "daemon_authority",
  "background_work_authority",
  "codex_execution_authority",
  "codex_launch_authority",
  "github_provider_call_authority",
  "db_write_authority",
  "proof_evidence_write_authority",
  "memory_perspective_mutation_authority",
  "handoff_send_authority",
  "branch_pr_creation_authority",
  "auto_apply_authority",
  "budget_spend_authority",
  "external_side_effect_authority",
  "dry_run_plan_is_execution",
] as const;

const AUTONOMY_RUNNER_PREFLIGHT_PUBLIC_SAFETY_FALSE_FIELDS = [
  "contains_private_conversation",
  "contains_hidden_reasoning",
  "contains_local_private_paths",
  "contains_secrets_or_tokens",
  "contains_raw_provider_output",
  "contains_raw_retrieval_output",
  "contains_real_account_artifacts",
] as const;

function buildAutonomyRunnerPreflightBoundaryNotes() {
  return {
    read_only: true,
    preview_only: true,
    no_run_started: true,
    no_scheduler_started: true,
    no_daemon_started: true,
    no_background_work_started: true,
    no_codex_execution: true,
    no_github_or_provider_call: true,
    no_db_write: true,
    no_proof_or_evidence_write: true,
    no_memory_or_perspective_mutation: true,
    no_handoff_send: true,
    no_branch_or_pr_creation: true,
    no_auto_apply: true,
    no_budget_spend: true,
    no_external_side_effect: true,
  };
}

function buildAutonomyRunnerPreflightReadBoundary() {
  return {
    source_route: "GET /api/augnes/read/autonomy-runner-preflight",
    local_readonly_marker: "x-augnes-local-readonly: autonomy-runner-preflight-v0.1",
    read_only_preview_only: true,
    dry_run_only: true,
    runner_authority: false,
    scheduler_authority: false,
    daemon_authority: false,
    background_work_authority: false,
    codex_execution_authority: false,
    codex_launch_authority: false,
    github_provider_call_authority: false,
    db_write_authority: false,
    proof_evidence_write_authority: false,
    memory_perspective_mutation_authority: false,
    handoff_send_authority: false,
    branch_pr_creation_authority: false,
    auto_apply_authority: false,
    budget_spend_authority: false,
    external_side_effect_authority: false,
    dry_run_plan_is_execution: false,
  };
}

function restoreAutonomyRunnerPreflightAuthorityBoundary(
  sanitizedAuthorityBoundary: unknown,
  sourceAuthorityBoundary: unknown
): Record<string, unknown> {
  return restoreFalseBoundaryFields(
    sanitizedAuthorityBoundary,
    sourceAuthorityBoundary,
    AUTONOMY_RUNNER_PREFLIGHT_AUTHORITY_BOUNDARY_FALSE_FIELDS
  );
}

function restoreAutonomyRunnerPreflightReadBoundary(
  sanitizedReadBoundary: unknown,
  sourceReadBoundary: unknown
): Record<string, unknown> {
  return restoreFalseBoundaryFields(
    sanitizedReadBoundary,
    sourceReadBoundary,
    AUTONOMY_RUNNER_PREFLIGHT_READ_BOUNDARY_FALSE_FIELDS
  );
}

function restoreAutonomyRunnerPreflightPublicSafety(
  sanitizedPublicSafety: unknown,
  sourcePublicSafety: unknown
): Record<string, unknown> {
  return restoreFalseBoundaryFields(
    sanitizedPublicSafety,
    sourcePublicSafety,
    AUTONOMY_RUNNER_PREFLIGHT_PUBLIC_SAFETY_FALSE_FIELDS
  );
}

function summarizeAutonomyRunnerPreflightAuthorityBoundary(
  sourceAuthorityBoundary: unknown,
  readBoundary: Record<string, unknown>
): Record<string, unknown> {
  return {
    authority_boundary: restoreAutonomyRunnerPreflightAuthorityBoundary(
      sourceAuthorityBoundary,
      sourceAuthorityBoundary
    ),
    read_boundary: restoreAutonomyRunnerPreflightReadBoundary(readBoundary, readBoundary),
    summary:
      "Read-only preview only: no runner starts, no scheduler starts, no daemon starts, no background work starts, no Codex execution, no GitHub/provider/OpenAI call, no DB write, no proof/evidence write, no memory mutation, no durable Perspective apply, no handoff send, no branch/PR creation, no auto-apply, no budget spend, and no external side effect.",
  };
}

function buildAutonomyRunnerPreflightSummary(result: AutonomyRunnerPreflightPreviewResult) {
  const preflight = objectRecord(result.preflight);
  const dryRunPlan = objectRecord(result.dry_run_plan);
  const budgetAssessment = objectRecord(preflight.budget_assessment);
  const actionScopeAssessment = objectRecord(preflight.action_scope_assessment);
  const deltaMergeAssessment = objectRecord(preflight.delta_merge_assessment);
  const reviewEscalationAssessment = objectRecord(preflight.review_escalation_assessment);
  const stopConditionAssessment = objectRecord(preflight.stop_condition_assessment);
  const stalenessAssessment = objectRecord(preflight.staleness_assessment);
  const authorityAssessment = objectRecord(preflight.authority_assessment);

  return {
    preflight_id: stringField(preflight, "preflight_id"),
    preflight_version: stringField(preflight, "preflight_version"),
    source_contract_id: stringField(preflight, "source_contract_id"),
    source_contract_version: stringField(preflight, "source_contract_version"),
    readiness: stringField(preflight, "readiness") ?? result.readiness,
    readiness_summary: stringField(preflight, "readiness_summary"),
    dry_run_status: stringField(dryRunPlan, "status"),
    planned_step_count: arrayCount(dryRunPlan.planned_steps),
    blocker_count: arrayCount(result.blockers),
    warning_count: arrayCount(result.warnings),
    required_user_judgment_count: arrayCount(preflight.required_user_judgment),
    required_operator_review_count: arrayCount(preflight.required_operator_review),
    budget_status: stringField(budgetAssessment, "status"),
    action_scope_status: stringField(actionScopeAssessment, "status"),
    delta_merge_status: stringField(deltaMergeAssessment, "status"),
    review_escalation_status: stringField(reviewEscalationAssessment, "status"),
    stop_condition_status: stringField(stopConditionAssessment, "status"),
    staleness_status: stringField(stalenessAssessment, "status"),
    authority_status: stringField(authorityAssessment, "status"),
    every_planned_step_would_execute_false: Array.isArray(dryRunPlan.planned_steps)
      ? dryRunPlan.planned_steps.every((step) => objectRecord(step).would_execute === false)
      : false,
  };
}

function resolveAutonomyRunnerPreflightScope(scope: string | undefined): typeof DEFAULT_STATE_RUNTIME_SCOPE {
  const resolvedScope = scope ?? DEFAULT_STATE_RUNTIME_SCOPE;
  if (resolvedScope !== DEFAULT_STATE_RUNTIME_SCOPE) {
    throw new Error("Autonomy Runner Preflight preview scope must be project:augnes.");
  }

  return DEFAULT_STATE_RUNTIME_SCOPE;
}

function buildAutonomyRunnerPreflightStructuredContent({
  result,
  includeDryRunPlan,
  includeBoundary,
}: {
  result: AutonomyRunnerPreflightPreviewResult;
  includeDryRunPlan: boolean | undefined;
  includeBoundary: boolean | undefined;
}): Record<string, unknown> {
  const preflight = objectRecord(result.preflight);
  const dryRunPlan = objectRecord(result.dry_run_plan);
  const readBoundary = buildAutonomyRunnerPreflightReadBoundary();
  const noRunBoundaryNotes = buildAutonomyRunnerPreflightBoundaryNotes();
  const summary = buildAutonomyRunnerPreflightSummary(result);
  const structuredContent = sanitizePayload({
    profile: config.appProfile,
    panel: "autonomy_runner_preflight_preview",
    packet_label: "Autonomy Runner Preflight / Dry-Run preview",
    scope: result.scope,
    route_id: result.route_id,
    route_family: result.route_family,
    include_dry_run_plan: includeDryRunPlan ?? true,
    include_boundary: includeBoundary ?? true,
    preflight: result.preflight,
    autonomy_runner_preflight: result.preflight,
    preflight_summary: summary,
    readiness: result.readiness,
    readiness_summary: preflight.readiness_summary ?? "",
    blockers: result.blockers ?? [],
    warnings: result.warnings ?? [],
    required_user_judgment: preflight.required_user_judgment ?? [],
    required_operator_review: preflight.required_operator_review ?? [],
    assessments: {
      budget_assessment: preflight.budget_assessment ?? {},
      action_scope_assessment: preflight.action_scope_assessment ?? {},
      delta_merge_assessment: preflight.delta_merge_assessment ?? {},
      review_escalation_assessment: preflight.review_escalation_assessment ?? {},
      stop_condition_assessment: preflight.stop_condition_assessment ?? {},
      staleness_assessment: preflight.staleness_assessment ?? {},
      authority_assessment: preflight.authority_assessment ?? {},
    },
    budget_assessment: preflight.budget_assessment ?? {},
    action_scope_assessment: preflight.action_scope_assessment ?? {},
    delta_merge_assessment: preflight.delta_merge_assessment ?? {},
    review_escalation_assessment: preflight.review_escalation_assessment ?? {},
    stop_condition_assessment: preflight.stop_condition_assessment ?? {},
    staleness_assessment: preflight.staleness_assessment ?? {},
    authority_assessment: preflight.authority_assessment ?? {},
    dry_run_plan: result.dry_run_plan,
    dry_run_plan_summary: {
      status: dryRunPlan.status,
      planned_step_count: arrayCount(dryRunPlan.planned_steps),
      blocked_step_count: arrayCount(dryRunPlan.blocked_steps),
      required_precondition_count: arrayCount(dryRunPlan.required_preconditions),
      required_check_count: arrayCount(dryRunPlan.required_checks),
      stop_condition_count: arrayCount(dryRunPlan.stop_conditions),
      every_planned_step_would_execute_false: summary.every_planned_step_would_execute_false,
    },
    dry_run_status: dryRunPlan.status,
    planned_steps: dryRunPlan.planned_steps ?? [],
    planned_read_sources: dryRunPlan.planned_read_sources ?? [],
    blocked_steps: dryRunPlan.blocked_steps ?? [],
    required_preconditions: dryRunPlan.required_preconditions ?? [],
    required_checks: dryRunPlan.required_checks ?? [],
    stop_conditions: dryRunPlan.stop_conditions ?? [],
    budget_projection: dryRunPlan.budget_projection ?? {},
    source_refs: result.source_refs,
    authority_boundary: result.authority_boundary,
    no_run_boundary: dryRunPlan.no_run_boundary ?? {},
    read_boundary: readBoundary,
    route_boundary: readBoundary,
    no_run_boundary_notes: noRunBoundaryNotes,
    route_authority_boundary: result.route_authority_boundary,
    source_status: result.source_status,
    route_notes: result.route_notes,
    public_safety: result.public_safety,
    boundary_summary:
      "Read-only preview only: no runner starts, no scheduler starts, no daemon starts, no background work starts, no Codex execution, no GitHub/provider/OpenAI call, no DB write, no proof/evidence write, no memory mutation, no durable Perspective apply, no handoff send, no branch/PR creation, no auto-apply, no budget spend, and no external side effect.",
  }) as Record<string, unknown>;

  structuredContent.no_run_boundary_notes = noRunBoundaryNotes;
  structuredContent.public_safety = restoreAutonomyRunnerPreflightPublicSafety(
    structuredContent.public_safety,
    result.public_safety
  );
  structuredContent.authority_boundary = restoreAutonomyRunnerPreflightAuthorityBoundary(
    structuredContent.authority_boundary,
    result.authority_boundary
  );
  structuredContent.no_run_boundary = restoreAutonomyRunnerPreflightAuthorityBoundary(
    structuredContent.no_run_boundary,
    dryRunPlan.no_run_boundary
  );
  structuredContent.read_boundary = restoreAutonomyRunnerPreflightReadBoundary(
    structuredContent.read_boundary,
    readBoundary
  );
  structuredContent.route_boundary = restoreAutonomyRunnerPreflightReadBoundary(
    structuredContent.route_boundary,
    readBoundary
  );
  structuredContent.authority_boundary_summary = summarizeAutonomyRunnerPreflightAuthorityBoundary(
    result.authority_boundary,
    readBoundary
  );

  for (const preflightKey of ["preflight", "autonomy_runner_preflight"] as const) {
    const sanitizedPreflight = objectRecord(structuredContent[preflightKey]);
    structuredContent[preflightKey] = {
      ...sanitizedPreflight,
      authority_boundary: restoreAutonomyRunnerPreflightAuthorityBoundary(
        sanitizedPreflight.authority_boundary,
        preflight.authority_boundary
      ),
      dry_run_plan: {
        ...objectRecord(sanitizedPreflight.dry_run_plan),
        no_run_boundary: restoreAutonomyRunnerPreflightAuthorityBoundary(
          objectRecord(sanitizedPreflight.dry_run_plan).no_run_boundary,
          dryRunPlan.no_run_boundary
        ),
      },
      public_safety: restoreAutonomyRunnerPreflightPublicSafety(
        sanitizedPreflight.public_safety,
        preflight.public_safety
      ),
    };
  }

  return structuredContent;
}

function describeAutonomyRunnerPreflight(result: AutonomyRunnerPreflightPreviewResult): string {
  const summary = buildAutonomyRunnerPreflightSummary(result);

  return [
    `Autonomy Runner Preflight preview loaded for scope ${result.scope}: preflight ${summary.preflight_id ?? "unknown"}, readiness ${summary.readiness ?? "unknown"}, dry-run status ${summary.dry_run_status ?? "unknown"}, ${summary.planned_step_count} planned dry-run step(s), ${summary.blocker_count} blocker(s), and ${summary.warning_count} warning(s).`,
    `Readiness summary: ${summary.readiness_summary ?? "not provided"}.`,
    `Every planned step would_execute false: ${String(summary.every_planned_step_would_execute_false)}.`,
    "Read-only Autonomy Runner Preflight / Dry-Run preview tool.",
    "The tool is not approval to run.",
    "Read-only tool: no runner starts, no scheduler starts, no daemon starts, no background work starts, no Codex execution, no GitHub/provider/OpenAI call, no DB write, no proof/evidence write, no memory mutation, no durable Perspective apply, no handoff send, no branch/PR creation, no auto-apply, no budget spend, and no external side effect.",
  ].join(" ");
}

export type McpAppServerOptions = {
  enableAgentBridge?: boolean;
  toolSurface?: AugnesAppToolSurface;
};

export function createMcpAppServer(
  adapter: AugnesCoreAdapter = createAugnesCoreAdapter(),
  stateRuntimeAdapter: StateRuntimeBridgeAdapter = new StateRuntimeHttpAdapter(),
  options: McpAppServerOptions = {}
) {
  const enableAgentBridge = options.enableAgentBridge ?? config.enableAgentBridge;
  const toolSurface = options.toolSurface ?? config.appToolSurface;
  const enableLegacyPublicTools = toolSurface !== "work_loop_readonly";
  const enableBridgeTools = enableAgentBridge && toolSurface !== "work_loop_readonly";
  const server = new McpServer({ name: APP_NAME, version: APP_VERSION });

  registerAppResource(
    server,
    "augnes-console-widget-v2",
    WIDGET_URI,
    {
      _meta: {
        ui: {
          domain: safeOrigin(config.resourceDomain),
          csp: WIDGET_CSP,
        },
        "openai/widgetDomain": safeOrigin(config.resourceDomain),
        "openai/widgetCSP": legacyWidgetCsp,
      },
    },
    async () => ({
      contents: [
        {
          uri: WIDGET_URI,
          mimeType: RESOURCE_MIME_TYPE,
          text: widgetHtml,
          _meta: {
            ui: {
              prefersBorder: true,
              domain: safeOrigin(config.resourceDomain),
              csp: WIDGET_CSP,
            },
            "openai/widgetDomain": safeOrigin(config.resourceDomain),
            "openai/widgetCSP": legacyWidgetCsp,
            "openai/widgetDescription":
              "Augnes Console shows evidence-backed casefiles, working view, rationale, boundary packets, repo navigation, and continuity status.",
          },
        },
      ],
    })
  );

  if (enableLegacyPublicTools) {
    registerAppTool(
      server,
      "search",
      {
        title: "Search Augnes knowledge",
        description: "Search evidence-backed Augnes knowledge, casefiles, working pointers, boundary packets, continuity records, and repo nodes.",
        inputSchema: {
          query: z.string().min(1),
          scope: z
            .array(z.enum(["evidence", "casefile", "working_view", "boundary", "continuity", "repo"]))
            .optional(),
          timeRange: z.string().optional(),
        },
        annotations: readOnlyAnnotations,
        _meta: modelOnlyToolMeta,
      },
      async ({ query, scope, timeRange }) => {
        try {
          const results = await adapter.search(query, scope as SearchScope[] | undefined, timeRange);
          const structuredContent = sanitizePayload({ profile: config.appProfile, results });
          return {
            structuredContent,
            content: narrative(
              results.length
                ? `Found ${results.length} result(s) for "${query}" in ${scope?.length ? asSummaryList(scope) : "all scopes"}.`
                : `No results found for "${query}".`
            ),
            _meta: sanitizePayload({ profile: config.appProfile }),
          };
        } catch (error) {
          return buildToolError("search", error);
        }
      }
    );

  registerAppTool(
    server,
    "fetch",
    {
      title: "Fetch Augnes document",
      description: "Fetch the full content for a specific Augnes document, casefile, repo node, or boundary packet.",
      inputSchema: { id: z.string().min(1) },
      annotations: readOnlyAnnotations,
      _meta: modelOnlyToolMeta,
    },
    async ({ id }) => {
      try {
        const result = await adapter.fetch(id);
        if (!result) {
          const structuredContent: Record<string, unknown> = sanitizePayload({
            profile: config.appProfile,
            id,
            title: "Not found",
            text: "",
            url: "",
            metadata: { status: "not_found" },
          });
          return {
            structuredContent,
            content: narrative(`No fetch result exists for ${id}.`),
            _meta: sanitizePayload({ profile: config.appProfile }),
          };
        }

        const structuredContent: Record<string, unknown> = sanitizePayload({ profile: config.appProfile, ...result });
        return {
          structuredContent,
          content: narrative(config.appProfile === "chrono_lab" ? `Fetched ${result.title}. ${result.text}` : `Fetched ${result.title}.`),
          _meta: sanitizePayload({ profile: config.appProfile }),
        };
      } catch (error) {
        return buildToolError("fetch", error);
      }
    }
  );

  registerAppTool(
    server,
    "open_casefile",
    {
      title: "Open casefile",
      description: "Show a structured casefile with supporting evidence, contradicting evidence, unresolved questions, and recent changes.",
      inputSchema: { subject: z.string().min(1) },
      annotations: readOnlyAnnotations,
      _meta: widgetToolMeta,
    },
    async ({ subject }) => {
      try {
        const casefile = await adapter.openCasefile(subject);
        const structuredContent = sanitizePayload(withPresentation(config.appProfile, "casefile", { casefile }));
        return {
          structuredContent,
          content: narrative(describeCasefile(casefile)),
          _meta: structuredContent,
        };
      } catch (error) {
        return buildToolError("open_casefile", error, "casefile");
      }
    }
  );

  registerAppTool(
    server,
    "get_working_view",
    {
      title: "Get working view",
      description: "Return the current working view summary, active pointers, and top evidence refs without exposing raw logs.",
      inputSchema: { scope: z.string().optional() },
      annotations: readOnlyAnnotations,
      _meta: widgetToolMeta,
    },
    async ({ scope }) => {
      try {
        const workingView = await adapter.getWorkingView(scope);
        const structuredContent = sanitizePayload(withPresentation(config.appProfile, "working_view", { workingView }));
        return {
          structuredContent,
          content: narrative(describeWorkingView(workingView)),
          _meta: structuredContent,
        };
      } catch (error) {
        return buildToolError("get_working_view", error, "working_view");
      }
    }
  );

  registerAppTool(
    server,
    "explain_strategy",
    {
      title: "Explain strategy",
      description: "Explain why Augnes recommends verify, retrieve, ask, or proceed using Meta-WM, rubric, and expected-outcome context.",
      inputSchema: { subject: z.string().optional() },
      annotations: readOnlyAnnotations,
      _meta: widgetToolMeta,
    },
    async ({ subject }) => {
      try {
        const strategy = await adapter.explainStrategy(subject);
        const structuredContent = sanitizePayload(withPresentation(config.appProfile, "strategy", { strategy }));
        return {
          structuredContent,
          content: narrative(describeStrategy(strategy)),
          _meta: structuredContent,
        };
      } catch (error) {
        return buildToolError("explain_strategy", error, "strategy");
      }
    }
  );

  registerAppTool(
    server,
    "get_boundary_packet",
    {
      title: "Get boundary packet",
      description: "Return the latest or requested boundary packet with carry-forward candidates, trace capsule candidates, and revision lineage.",
      inputSchema: { boundaryId: z.string().optional() },
      annotations: readOnlyAnnotations,
      _meta: widgetToolMeta,
    },
    async ({ boundaryId }) => {
      try {
        const packet = await adapter.getBoundaryPacket(boundaryId);
        const structuredContent = sanitizePayload(withPresentation(config.appProfile, "boundary", { packet }));
        return {
          structuredContent,
          content: narrative(describeBoundary(packet)),
          _meta: structuredContent,
        };
      } catch (error) {
        return buildToolError("get_boundary_packet", error, "boundary");
      }
    }
  );

  registerAppTool(
    server,
    "get_continuity_report",
    {
      title: "Get continuity report",
      description: "Return self-succession baseline status, same-self vs branch status, and recent continuity canary results.",
      inputSchema: {},
      annotations: readOnlyAnnotations,
      _meta: widgetToolMeta,
    },
    async () => {
      try {
        const continuity = await adapter.getContinuityReport();
        const structuredContent = sanitizePayload(withPresentation(config.appProfile, "continuity", { continuity }));
        return {
          structuredContent,
          content: narrative(describeContinuity(continuity)),
          _meta: structuredContent,
        };
      } catch (error) {
        return buildToolError("get_continuity_report", error, "continuity");
      }
    }
  );

  registerAppTool(
    server,
    "navigate_repo",
    {
      title: "Navigate repo",
      description: "Search and explore the Augnes repo graph. Search and explore are view-only; fetch the source before treating it as evidence.",
      inputSchema: { query: z.string().min(1) },
      annotations: readOnlyAnnotations,
      _meta: widgetToolMeta,
    },
    async ({ query }) => {
      try {
        const repo = await adapter.navigateRepo(query);
        const structuredContent = sanitizePayload(withPresentation(config.appProfile, "repo", { repo }));
        return {
          structuredContent,
          content: narrative(describeRepo(repo, query)),
          _meta: structuredContent,
        };
      } catch (error) {
        return buildToolError("navigate_repo", error, "repo");
      }
    }
  );

  registerAppTool(
    server,
    "get_governance_audit",
    {
      title: "Get governance audit",
      description: "Show raw-first trace handling, promotion bans, and Gate-18/19/20 status for the current app profile.",
      inputSchema: {},
      annotations: readOnlyAnnotations,
      _meta: widgetToolMeta,
    },
    async () => {
      try {
        const audit = await adapter.getGovernanceAudit();
        const structuredContent = sanitizePayload(withPresentation(config.appProfile, "audit", { audit }));
        return {
          structuredContent,
          content: narrative(describeAudit(audit)),
          _meta: structuredContent,
        };
      } catch (error) {
        return buildToolError("get_governance_audit", error, "audit");
      }
    }
  );
  }

  registerAppTool(
    server,
    "augnes_list_work_items",
    {
      title: "List Augnes work items",
      description:
        "Show a read-only Work Picker for a project scope so the user can choose a work item before opening its current brief.",
      inputSchema: { scope: z.string().min(1).optional() },
      annotations: bridgeReadAnnotations,
      _meta: widgetToolMeta,
    },
    async ({ scope }) => {
      const resolvedScope = scope ?? DEFAULT_STATE_RUNTIME_SCOPE;

      try {
        const workItems = await stateRuntimeAdapter.listWorkItems(resolvedScope);
        const workPickerCard = buildWorkPickerCard(resolvedScope, workItems);
        const structuredContent = sanitizePayload({
          profile: config.appProfile,
          panel: "work_picker_card",
          scope: resolvedScope,
          workItems,
          work_picker_card: workPickerCard,
          work_candidates: workPickerCard.work_candidates,
          recommended_work_id: workPickerCard.recommended_work_id,
          selection_reason: workPickerCard.selection_reason,
          next_action_hint: workPickerCard.next_action_hint,
          boundaries: workPickerCard.boundaries,
        });
        return {
          structuredContent,
          content: narrative(`${describeWorkItems(resolvedScope, workItems)} ${describeWorkPickerCard(workPickerCard)}`),
          _meta: structuredContent,
        };
      } catch (error) {
        return buildBridgeToolError("augnes_list_work_items", error);
      }
    }
  );

  registerAppTool(
    server,
    "augnes_get_work_brief",
    {
      title: "Get Augnes work brief",
      description: "Return a read-only current work brief with metadata, recent events, and proof links.",
      inputSchema: {
        scope: z.string().min(1).optional(),
        workId: z.string().min(1),
      },
      annotations: bridgeReadAnnotations,
      _meta: widgetToolMeta,
    },
    async ({ scope, workId }) => {
      const resolvedScope = scope ?? DEFAULT_STATE_RUNTIME_SCOPE;

      try {
        const brief = await stateRuntimeAdapter.getWorkBrief(resolvedScope, workId);
        const structuredContent = sanitizePayload({
          profile: config.appProfile,
          panel: "work_brief",
          brief,
          boundaries: {
            read_only: true,
            native_host_execution: false,
            receipt_admission: false,
            state_commit_or_reject: false,
            provider_calls: false,
          },
        });
        return {
          structuredContent,
          content: narrative(describeWorkBrief(brief)),
          _meta: structuredContent,
        };
      } catch (error) {
        return buildBridgeToolError("augnes_get_work_brief", error);
      }
    }
  );

  if (enableBridgeTools) {
    registerAppTool(
      server,
      "augnes_get_state_brief",
      {
        title: "Get Augnes state brief",
        description: "Read-only: return a compact Augnes runtime state brief for an agent scope.",
        inputSchema: { scope: z.string().min(1).optional() },
        annotations: bridgeReadAnnotations,
        _meta: modelOnlyToolMeta,
      },
      async ({ scope }) => {
        const resolvedScope = scope ?? DEFAULT_STATE_RUNTIME_SCOPE;

        try {
          const brief = await stateRuntimeAdapter.getStateBrief(resolvedScope);
          const { agent_handoff: _retiredAgentHandoff, ...readOnlyBrief } = brief;
          const structuredContent = sanitizePayload({ profile: config.appProfile, brief: readOnlyBrief });
          return {
            structuredContent,
            content: narrative(describeStateBrief(brief)),
            _meta: sanitizePayload({ profile: config.appProfile }),
          };
        } catch (error) {
          return buildBridgeToolError("augnes_get_state_brief", error);
        }
      }
    );

    registerAppTool(
      server,
      "augnes_get_project_constellation_preview",
      {
        title: "Get Project Constellation preview",
        description:
          "Use this when the user asks to inspect the Augnes Project Constellation preview. It reads the existing local read-only route and returns compact thesis, node, edge, cluster, evidence-pointer, tension, and advisory next-action data without writing Augnes state or executing a native host.",
        inputSchema: ProjectConstellationPreviewToolInputSchema.shape,
        annotations: localRouteReadAnnotations,
        _meta: widgetToolMeta,
      },
      async ({ scope, selected_candidate_id }) => {
        const resolvedScope = scope ?? DEFAULT_STATE_RUNTIME_SCOPE;
        const requestedCandidateId = selected_candidate_id ?? null;

        try {
          const routePreview = await stateRuntimeAdapter.getConstellationPreview(resolvedScope);
          const projectConstellationPreview = buildProjectConstellationPreviewSurface({
            scope: resolvedScope,
            routePreview,
            requestedCandidateId,
          });
          const structuredContent = sanitizePayload({
            profile: config.appProfile,
            panel: "project_constellation_preview",
            project_constellation_preview: projectConstellationPreview,
            requested_candidate_id: projectConstellationPreview.requested_candidate_id,
            selected_candidate_id: projectConstellationPreview.selected_candidate_id,
            selected_candidate_label: projectConstellationPreview.selected_candidate_label,
            selection_status: projectConstellationPreview.selection_status,
            selection_fallback_reason: projectConstellationPreview.selection_fallback_reason,
            selection: projectConstellationPreview.selection,
            project_constellation: projectConstellationPreview.project_constellation,
            evidence_pointers: projectConstellationPreview.evidence_pointers,
            unresolved_tensions: projectConstellationPreview.unresolved_tensions,
            next_action_candidates: projectConstellationPreview.next_action_candidates,
            selected_context: projectConstellationPreview.selected_context,
            missing_data_fallbacks: projectConstellationPreview.missing_data_fallbacks,
            boundaries: projectConstellationPreview.boundaries,
          });

          return {
            structuredContent,
            content: narrative(describeProjectConstellationPreviewSurface(projectConstellationPreview)),
            _meta: structuredContent,
          };
        } catch (error) {
          const message = error instanceof Error ? error.message : "Augnes Project Constellation preview route is unavailable.";
          const projectConstellationPreview = buildProjectConstellationPreviewSurface({
            scope: resolvedScope,
            requestedCandidateId,
            fallbackText: message,
          });
          const structuredContent = sanitizePayload({
            profile: config.appProfile,
            panel: "project_constellation_preview",
            project_constellation_preview: projectConstellationPreview,
            requested_candidate_id: projectConstellationPreview.requested_candidate_id,
            selected_candidate_id: projectConstellationPreview.selected_candidate_id,
            selected_candidate_label: projectConstellationPreview.selected_candidate_label,
            selection_status: projectConstellationPreview.selection_status,
            selection_fallback_reason: projectConstellationPreview.selection_fallback_reason,
            selection: projectConstellationPreview.selection,
            project_constellation: projectConstellationPreview.project_constellation,
            evidence_pointers: projectConstellationPreview.evidence_pointers,
            unresolved_tensions: projectConstellationPreview.unresolved_tensions,
            next_action_candidates: projectConstellationPreview.next_action_candidates,
            selected_context: projectConstellationPreview.selected_context,
            missing_data_fallbacks: projectConstellationPreview.missing_data_fallbacks,
            boundaries: projectConstellationPreview.boundaries,
          });

          return {
            structuredContent,
            content: narrative(describeProjectConstellationPreviewSurface(projectConstellationPreview)),
            _meta: structuredContent,
          };
        }
      }
    );

    registerAppTool(
      server,
      "augnes_get_guide_brief",
      {
        title: "Get GuideBrief",
        description:
          "Read-only GuideBrief tool. It consumes the local GuideBrief route, keeps Observed/Inferred/Suggested/Needs user judgment separated, treats suggestions as not actions, keeps handoff candidates preview-only, does not decide needs_user_judgment items, does not execute Codex, does not call GitHub/OpenAI/provider services, does not create proof/evidence records, and does not mutate state, memory, or DB records.",
        inputSchema: GuideBriefToolInputSchema.shape,
        annotations: localRouteReadAnnotations,
        _meta: modelOnlyToolMeta,
      },
      async ({ scope, compact }) => {
        const resolvedScope = scope ?? DEFAULT_STATE_RUNTIME_SCOPE;

        try {
          const guideBrief = await stateRuntimeAdapter.getGuideBrief(resolvedScope);
          const guideBriefSummary = buildGuideBriefSummary(guideBrief);
          const structuredContent = buildGuideBriefStructuredContent({
            guideBrief,
            guideBriefSummary,
            compact: compact ?? true,
          });

          return {
            structuredContent,
            content: narrative(describeGuideBrief(guideBrief)),
            _meta: structuredContent,
          };
        } catch (error) {
          return buildBridgeToolError("augnes_get_guide_brief", error);
        }
      }
    );

    registerAppTool(
      server,
      "augnes_get_autonomy_contract_preview",
      {
        title: "Get Autonomy Contract preview",
        description:
          "Read-only Autonomy Contract preview tool for preview/review planning only. It consumes the local marker-gated Autonomy Contract route, preserves budget boundaries, delta merge policy, review escalation policy, stop conditions, output policy, run preview, and authority boundary. It adds no autonomy runner, no scheduler, no daemon, no background work, no Codex execution, no Codex launch, no GitHub/OpenAI/provider calls, no branch/PR creation, no proof/evidence record creation, no state, memory, DB, work, or Perspective mutation, no handoff send, no copy/export behavior, and no publish/merge/retry/replay/deploy/external post. Budget is not spend permission, auto_apply_allowed remains false, run_preview is not execution, suggestions or candidate actions are advisory/planning only, and unresolved user judgment remains unresolved.",
        inputSchema: AutonomyContractPreviewToolInputSchema.shape,
        annotations: localRouteReadAnnotations,
        _meta: modelOnlyToolMeta,
      },
      async ({ scope, compact }) => {
        const resolvedScope = scope ?? DEFAULT_STATE_RUNTIME_SCOPE;

        try {
          const result = await stateRuntimeAdapter.getAutonomyContractPreview({
            scope: resolvedScope,
          });
          const structuredContent = buildAutonomyContractPreviewStructuredContent({
            result,
            compact: compact ?? true,
          });

          return {
            structuredContent,
            content: narrative(describeAutonomyContractPreview(result)),
            _meta: structuredContent,
          };
        } catch (error) {
          return buildBridgeToolError("augnes_get_autonomy_contract_preview", error);
        }
      }
    );

    registerAppTool(
      server,
      "augnes_get_autonomy_runner_preflight",
      {
        title: "Get Autonomy Runner Preflight / Dry-Run preview",
        description:
          "Read-only Autonomy Runner Preflight / Dry-Run preview tool. It consumes the local marker-gated Autonomy Runner Preflight route/source path, preserves readiness, blockers, warnings, assessment summaries, dry-run plan status, planned steps, source refs, public safety, and the no-run authority boundary. It adds no actual runner execution, no scheduler, no daemon, no background work, no Codex execution, no Codex launch, no GitHub/OpenAI/provider calls, no DB writes, no proof/evidence writes, no state, memory, work, or Perspective mutation, no handoff send, no branch/PR creation, no auto-apply behavior, no budget spending, no copy/export/download behavior, and no publish/merge/retry/replay/deploy/external side effect. The dry-run plan remains dry_run_only, every planned step keeps would_execute false, and the tool is not approval to run.",
        inputSchema: AutonomyRunnerPreflightToolInputSchema.shape,
        annotations: localRouteReadAnnotations,
        _meta: modelOnlyToolMeta,
      },
      async ({ scope, include_dry_run_plan, include_boundary }) => {
        try {
          const resolvedScope = resolveAutonomyRunnerPreflightScope(scope);
          const result = await stateRuntimeAdapter.getAutonomyRunnerPreflight({
            scope: resolvedScope,
          });
          const structuredContent = buildAutonomyRunnerPreflightStructuredContent({
            result,
            includeDryRunPlan: include_dry_run_plan ?? true,
            includeBoundary: include_boundary ?? true,
          });

          return {
            structuredContent,
            content: narrative(describeAutonomyRunnerPreflight(result)),
            _meta: structuredContent,
          };
        } catch (error) {
          return buildBridgeToolError("augnes_get_autonomy_runner_preflight", error);
        }
      }
    );

    registerAppTool(
      server,
      "augnes_get_evidence_pack",
      {
        title: "Get Augnes evidence pack",
        description:
          "Read-only: return the derived Augnes Evidence Pack view for a scope and optional work/publication/delivery/target filters. This tool does not create evidence records, bind sessions, publish, replay, approve, mutate state, call GitHub or OpenAI, or execute Codex.",
        inputSchema: EvidencePackToolInputSchema.shape,
        annotations: bridgeReadAnnotations,
        _meta: modelOnlyToolMeta,
      },
      async ({ scope, workId, publicationId, deliveryId, targetRef }) => {
        const resolvedScope = scope ?? DEFAULT_STATE_RUNTIME_SCOPE;

        try {
          const evidencePack = await stateRuntimeAdapter.getEvidencePack({
            scope: resolvedScope,
            workId,
            publicationId,
            deliveryId,
            targetRef,
          });
          const structuredContent = {
            profile: config.appProfile,
            evidence_pack: evidencePack,
            boundaries: crossSessionReadBoundaries,
          };

          return {
            structuredContent,
            content: narrative(
              describeEvidencePack(resolvedScope, {
                workId,
                publicationId,
                deliveryId,
                targetRef,
              })
            ),
            _meta: sanitizePayload({ profile: config.appProfile }),
          };
        } catch (error) {
          return buildBridgeToolError("augnes_get_evidence_pack", error);
        }
      }
    );

    registerAppTool(
      server,
      "augnes_get_session_trace",
      {
        title: "Get Augnes session trace",
        description:
          "Read-only: return the bounded Augnes Session Trace continuity view for a scope or one bound session. This tool does not bind, create, or update sessions; create evidence records; publish, replay, approve, mutate state, call GitHub or OpenAI, or execute Codex.",
        inputSchema: SessionTraceToolInputSchema.shape,
        annotations: bridgeReadAnnotations,
        _meta: modelOnlyToolMeta,
      },
      async ({ scope, sessionId, limit }) => {
        const resolvedScope = scope ?? DEFAULT_STATE_RUNTIME_SCOPE;

        try {
          const sessionTrace = await stateRuntimeAdapter.getSessionTrace({
            scope: resolvedScope,
            sessionId,
            limit,
          });
          const structuredContent = {
            profile: config.appProfile,
            session_trace: sessionTrace,
            boundaries: crossSessionReadBoundaries,
          };

          return {
            structuredContent,
            content: narrative(describeSessionTrace(resolvedScope, sessionTrace, sessionId)),
            _meta: sanitizePayload({ profile: config.appProfile }),
          };
        } catch (error) {
          return buildBridgeToolError("augnes_get_session_trace", error);
        }
      }
    );

    registerAppTool(
      server,
      "augnes_get_verification_evidence_records",
      {
        title: "Get Augnes verification evidence records",
        description:
          "Read-only: return structured Augnes verification evidence records for a scope and optional work/publication/delivery/target filters. This tool does not create evidence records, bind sessions, publish, replay, approve, mutate state, call GitHub or OpenAI, or execute Codex.",
        inputSchema: VerificationEvidenceRecordsToolInputSchema.shape,
        annotations: bridgeReadAnnotations,
        _meta: modelOnlyToolMeta,
      },
      async ({ scope, workId, publicationId, deliveryId, targetSurface, targetRef, evidenceKind, status, limit }) => {
        const resolvedScope = scope ?? DEFAULT_STATE_RUNTIME_SCOPE;

        try {
          const verificationEvidenceRecords = await stateRuntimeAdapter.getVerificationEvidenceRecords({
            scope: resolvedScope,
            workId,
            publicationId,
            deliveryId,
            targetSurface,
            targetRef,
            evidenceKind,
            status,
            limit,
          });
          const structuredContent = {
            profile: config.appProfile,
            verification_evidence_records: verificationEvidenceRecords,
            boundaries: crossSessionReadBoundaries,
          };

          return {
            structuredContent,
            content: narrative(
              describeVerificationEvidenceRecords(resolvedScope, verificationEvidenceRecords, {
                workId,
                publicationId,
                deliveryId,
                targetSurface,
                targetRef,
                evidenceKind,
                status,
                limit,
              })
            ),
            _meta: sanitizePayload({ profile: config.appProfile }),
          };
        } catch (error) {
          return buildBridgeToolError("augnes_get_verification_evidence_records", error);
        }
      }
    );

    registerAppTool(
      server,
      "augnes_observe",
      {
        title: "Observe Augnes state message",
        description: "Send a canonically project-scoped observation to the Augnes runtime and return pending proposals plus its privacy-safe model invocation receipt.",
        inputSchema: {
          workspaceId: z
            .string()
            .regex(/^workspace:[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i),
          projectId: z
            .string()
            .regex(/^project:[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i),
          expectedActiveProjectId: z
            .string()
            .regex(/^project:[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i),
          expectedActiveSelectionRevision: z.number().int().positive(),
          message: z.string().min(1),
          projectRoot: z
            .object({
              pathFlavor: z.enum(["posix", "win32"]),
              normalizedPath: z.string().min(1),
            })
            .optional(),
          executionMode: z.enum(["live", "deterministic"]).optional(),
        },
        annotations: bridgeWriteAnnotations,
        _meta: modelOnlyToolMeta,
      },
      async ({
        workspaceId,
        projectId,
        expectedActiveProjectId,
        expectedActiveSelectionRevision,
        message,
        projectRoot,
        executionMode,
      }) => {
        try {
          const observe = await stateRuntimeAdapter.observe({
            workspaceId,
            projectId,
            expectedActiveProjectId,
            expectedActiveSelectionRevision,
            message,
            projectRoot,
            executionMode,
          });
          const structuredContent = {
            profile: config.appProfile,
            observe: sanitizeModelGatewayBridgeResult(
              observe,
              "observe_delta_compile",
            ),
          };
          return {
            structuredContent,
            content: narrative(
              `Observed message for canonical project ${observe.project_id}; produced ${observe.proposals.length} pending proposal(s). No proposals were committed or rejected.`
            ),
            _meta: sanitizePayload({ profile: config.appProfile }),
          };
        } catch (error) {
          return buildBridgeToolError("augnes_observe", error);
        }
      }
    );

    registerAppTool(
      server,
      "augnes_plan",
      {
        title: "Plan from Augnes state",
        description: "Ask the canonically project-scoped Augnes runtime planner for state-grounded recommendations and a privacy-safe invocation receipt without committing state changes.",
        inputSchema: {
          workspaceId: z
            .string()
            .regex(/^workspace:[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i),
          projectId: z
            .string()
            .regex(/^project:[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i),
          expectedActiveProjectId: z
            .string()
            .regex(/^project:[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i),
          expectedActiveSelectionRevision: z.number().int().positive(),
          message: z.string().min(1),
          projectRoot: z
            .object({
              pathFlavor: z.enum(["posix", "win32"]),
              normalizedPath: z.string().min(1),
            })
            .optional(),
          executionMode: z.enum(["live", "deterministic"]).optional(),
        },
        annotations: bridgeReadAnnotations,
        _meta: modelOnlyToolMeta,
      },
      async ({
        workspaceId,
        projectId,
        expectedActiveProjectId,
        expectedActiveSelectionRevision,
        message,
        projectRoot,
        executionMode,
      }) => {
        try {
          const plan = await stateRuntimeAdapter.plan({
            workspaceId,
            projectId,
            expectedActiveProjectId,
            expectedActiveSelectionRevision,
            message,
            projectRoot,
            executionMode,
          });
          const firstTitle = plan.recommendations[0]?.title;
          const structuredContent = {
            profile: config.appProfile,
            plan: sanitizeModelGatewayBridgeResult(plan, "planner_plan"),
          };
          return {
            structuredContent,
            content: narrative(
              firstTitle
                ? `Plan for ${plan.scope}: ${plan.recommendations.length} recommendation(s). First: ${firstTitle}.`
                : `Plan for ${plan.scope}: 0 recommendation(s).`
            ),
            _meta: sanitizePayload({ profile: config.appProfile }),
          };
        } catch (error) {
          return buildBridgeToolError("augnes_plan", error);
        }
      }
    );

    registerAppTool(
      server,
      "augnes_record_action_result",
      {
        title: "Record Augnes action result",
        description: "Record an external action result in the Augnes runtime without committing or rejecting state deltas.",
        inputSchema: {
          scope: z.string().min(1).optional(),
          sourceAgentId: z.string().min(1),
          actionName: z.string().min(1),
          resultSummary: z.string().min(1),
          filesChanged: z.array(z.string()).optional(),
          resultStatus: StateRuntimeActionResultStatusSchema.optional(),
          resultKind: StateRuntimeActionResultKindSchema.optional(),
        },
        annotations: bridgeWriteAnnotations,
        _meta: modelOnlyToolMeta,
      },
      async ({ scope, sourceAgentId, actionName, resultSummary, filesChanged, resultStatus, resultKind }) => {
        const resolvedScope = scope ?? DEFAULT_STATE_RUNTIME_SCOPE;

        try {
          const actionRecord = await stateRuntimeAdapter.recordActionResult({
            scope: resolvedScope,
            sourceAgentId,
            actionName,
            resultSummary,
            filesChanged,
            resultStatus,
            resultKind,
          });
          const changedFileCount = filesChanged?.length ?? 0;
          const structuredContent = sanitizePayload({ profile: config.appProfile, actionRecord });
          return {
            structuredContent,
            content: narrative(
              `Recorded action result from ${sourceAgentId} for ${actionName}; ${changedFileCount} changed file(s). No state deltas were committed or rejected.`
            ),
            _meta: sanitizePayload({ profile: config.appProfile }),
          };
        } catch (error) {
          return buildBridgeToolError("augnes_record_action_result", error);
        }
      }
    );

    registerAppTool(
      server,
      "augnes_list_pending_proposals",
      {
        title: "List Augnes pending proposals",
        description: "List pending Augnes runtime proposals for an agent scope without committing or rejecting them.",
        inputSchema: { scope: z.string().min(1).optional() },
        annotations: bridgeReadAnnotations,
        _meta: modelOnlyToolMeta,
      },
      async ({ scope }) => {
        const resolvedScope = scope ?? DEFAULT_STATE_RUNTIME_SCOPE;

        try {
          const proposals = await stateRuntimeAdapter.listPendingProposals(resolvedScope);
          const structuredContent = sanitizePayload({ profile: config.appProfile, proposals });
          return {
            structuredContent,
            content: narrative(`Found ${proposals.length} pending proposal(s) for ${resolvedScope}.`),
            _meta: sanitizePayload({ profile: config.appProfile }),
          };
        } catch (error) {
          return buildBridgeToolError("augnes_list_pending_proposals", error);
        }
      }
    );

    registerAppTool(
      server,
      "augnes_record_work_event",
      {
        title: "Record Augnes work event",
        description: "Record a human-readable event on an existing work trace anchor without committing state deltas.",
        inputSchema: {
          scope: z.string().min(1).optional(),
          workId: z.string().min(1),
          actor: z.enum(["user", "chatgpt", "codex", "augnes_runtime"]).optional(),
          eventType: z.enum(["note", "implementation", "verification", "review", "handoff", "blocked", "decision"]).optional(),
          summary: z.string().min(1),
          resultStatus: StateRuntimeActionResultStatusSchema.optional(),
          resultKind: StateRuntimeActionResultKindSchema.optional(),
          relatedActionId: z.string().min(1).optional(),
          relatedPr: z.string().min(1).optional(),
          relatedStateKeys: z.array(z.string()).optional(),
        },
        annotations: bridgeWriteAnnotations,
        _meta: modelOnlyToolMeta,
      },
      async ({ scope, workId, actor, eventType, summary, resultStatus, resultKind, relatedActionId, relatedPr, relatedStateKeys }) => {
        const resolvedScope = scope ?? DEFAULT_STATE_RUNTIME_SCOPE;

        try {
          const eventResult = await stateRuntimeAdapter.recordWorkEvent({
            scope: resolvedScope,
            workId,
            actor,
            eventType,
            summary,
            resultStatus,
            resultKind,
            relatedActionId,
            relatedPr,
            relatedStateKeys,
          });
          const structuredContent = sanitizePayload({ profile: config.appProfile, eventResult });
          return {
            structuredContent,
            content: narrative(
              `Recorded work event for ${eventResult.event.work_id}; no state deltas were committed or rejected.`
            ),
            _meta: sanitizePayload({ profile: config.appProfile }),
          };
        } catch (error) {
          return buildBridgeToolError("augnes_record_work_event", error);
        }
      }
    );

    registerAppTool(
      server,
      "augnes_get_mailbox_summary",
      {
        title: "Get mailbox summary",
        description:
          "Read the Augnes mailbox summary buckets for pending handoffs, review needs, approval needs, and blocked or partial results. This is a derived read-only view and does not update mailbox, handoff, state, proof, Codex, or publication surfaces.",
        inputSchema: { scope: z.string().min(1).optional() },
        annotations: bridgeReadAnnotations,
        _meta: modelOnlyToolMeta,
      },
      async ({ scope }) => {
        const resolvedScope = scope ?? DEFAULT_STATE_RUNTIME_SCOPE;

        try {
          const mailboxSummary = await stateRuntimeAdapter.getMailboxSummary(resolvedScope);
          const structuredContent = sanitizePayload({
            profile: config.appProfile,
            mailbox_summary: mailboxSummary,
            boundaries: {
              derived_view_only: true,
              mailbox_status_update: false,
              mailbox_status_update_authority: false,
              handoff_status_update: false,
              codex_execution: false,
              codex_execution_authority: false,
              proof_recording: false,
              proof_recording_authority: false,
              state_commit_or_reject: false,
              state_commit_or_reject_authority: false,
              external_publication: false,
              publisher_authority: false,
            },
          });

          return {
            structuredContent,
            content: narrative(describeMailboxSummary(mailboxSummary)),
            _meta: sanitizePayload({ profile: config.appProfile }),
          };
        } catch (error) {
          return buildBridgeToolError("augnes_get_mailbox_summary", error);
        }
      }
    );

    registerAppTool(
      server,
      "augnes_get_publication_summary",
      {
        title: "Get publication summary",
        description:
          "Read Augnes publication preview and delivery ledger summary buckets. This is a bridge-gated derived read-only view and does not approve, publish, retry, post externally, record proof, commit or reject state, or execute Codex.",
        inputSchema: { scope: z.string().min(1).optional() },
        annotations: bridgeReadAnnotations,
        _meta: modelOnlyToolMeta,
      },
      async ({ scope }) => {
        const resolvedScope = scope ?? DEFAULT_STATE_RUNTIME_SCOPE;

        try {
          const publicationSummary = await stateRuntimeAdapter.getPublicationSummary(resolvedScope);
          const structuredContent = sanitizePayload({
            profile: config.appProfile,
            publication_summary: publicationSummary,
            boundaries: {
              derived_view_only: true,
              approval_authority: false,
              publish_authority: false,
              retry_authority: false,
              github_posting: false,
              discord_posting: false,
              proof_recording: false,
              state_commit_or_reject: false,
              codex_execution: false,
              source_of_truth: false,
            },
          });

          return {
            structuredContent,
            content: narrative(describePublicationSummary(publicationSummary)),
            _meta: sanitizePayload({ profile: config.appProfile }),
          };
        } catch (error) {
          return buildBridgeToolError("augnes_get_publication_summary", error);
        }
      }
    );

    registerAppTool(
      server,
      "augnes_get_publication_decision_card",
      {
        title: "Get publication decision card",
        description:
          "Read a ChatGPT-facing publication decision card derived from the Augnes Control Packet. This is bridge-gated and read-only; it does not approve, publish, retry, record proof, commit or reject state, execute Codex, mutate GitHub, or post externally.",
        inputSchema: { scope: z.string().min(1).optional() },
        annotations: bridgeReadAnnotations,
        _meta: modelOnlyToolMeta,
      },
      async ({ scope }) => {
        const resolvedScope = scope ?? DEFAULT_STATE_RUNTIME_SCOPE;

        try {
          const controlPacket = await stateRuntimeAdapter.getControlPacket(resolvedScope);
          const decisionCard = buildPublicationDecisionCard(controlPacket);
          const structuredContent = sanitizePayload({
            profile: config.appProfile,
            decision_card: decisionCard,
            boundaries: decisionCard.boundaries,
          });

          return {
            structuredContent,
            content: narrative(describePublicationDecisionCard(decisionCard)),
            _meta: sanitizePayload({ profile: config.appProfile }),
          };
        } catch (error) {
          return buildBridgeToolError("augnes_get_publication_decision_card", error);
        }
      }
    );
  }

  return server;
}

export function createHttpServer(
  adapter: AugnesCoreAdapter = createAugnesCoreAdapter(),
  stateRuntimeAdapter: StateRuntimeBridgeAdapter = new StateRuntimeHttpAdapter(),
  options: McpAppServerOptions = {}
) {
  return createServer(async (req, res) => {
    if (!req.url) {
      res.writeHead(400).end("Missing URL");
      return;
    }

    const url = new URL(req.url, `http://${req.headers.host ?? "localhost"}`);

    if (req.method === "OPTIONS" && url.pathname === config.mcpPath) {
      res.writeHead(204, {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, GET, OPTIONS, DELETE",
        "Access-Control-Allow-Headers": "content-type, mcp-session-id",
        "Access-Control-Expose-Headers": "Mcp-Session-Id",
      });
      res.end();
      return;
    }

    if (req.method === "GET" && url.pathname === "/") {
      res.writeHead(200, { "content-type": "text/plain" }).end("Augnes MCP server");
      return;
    }

    if (req.method === "GET" && url.pathname === "/healthz") {
      if (url.searchParams.get("ownership") === "1") {
        const suppliedToken = Array.isArray(
          req.headers["x-augnes-child-ownership"]
        )
          ? req.headers["x-augnes-child-ownership"][0]
          : req.headers["x-augnes-child-ownership"];
        const payload = buildPrivateOwnershipPayload(suppliedToken);
        res
          .writeHead(payload ? 200 : 403, {
            "content-type": "application/json",
            "cache-control": "no-store",
          })
          .end(
            JSON.stringify(
              payload ?? {
                ownership_verified: false,
                reason: "ownership_unverified",
              }
            )
          );
        return;
      }
      res.writeHead(200, { "content-type": "application/json" }).end(
        JSON.stringify(buildHealthPayload())
      );
      return;
    }

    const mcpMethods = new Set(["POST", "GET", "DELETE"]);
    if (url.pathname === config.mcpPath && req.method && mcpMethods.has(req.method)) {
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Expose-Headers", "Mcp-Session-Id");

      const server = createMcpAppServer(adapter, stateRuntimeAdapter, options);
      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: undefined,
        enableJsonResponse: true,
      });

      res.on("close", () => {
        transport.close();
        server.close();
      });

      try {
        await server.connect(transport);
        await transport.handleRequest(req, res);
      } catch (error) {
        console.error("Error handling MCP request:", error);
        if (!res.headersSent) res.writeHead(500).end("Internal server error");
      }
      return;
    }

    res.writeHead(404).end("Not Found");
  });
}

function isDirectExecution(): boolean {
  return Boolean(process.argv[1]) && pathToFileURL(process.argv[1]).href === import.meta.url;
}

if (isDirectExecution()) {
  const httpServer = createHttpServer();
  httpServer.listen(
    { host: "127.0.0.1", port: config.port, exclusive: true },
    () => {
      console.log(
        `Augnes MCP server listening on http://127.0.0.1:${config.port}${config.mcpPath}`,
      );
    },
  );
}
