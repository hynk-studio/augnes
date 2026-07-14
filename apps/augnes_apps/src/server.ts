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
  CodexLaunchCardPreviewToolInputSchema,
  GuideBriefToolInputSchema,
  HandoffCapsulePreviewToolInputSchema,
  ProjectConstellationPreviewToolInputSchema,
  SessionTraceToolInputSchema,
  StateRuntimeActionResultKindSchema,
  StateRuntimeActionResultStatusSchema,
  VerificationEvidenceRecordsToolInputSchema,
  type AutonomyContractPreviewResult,
  type AutonomyRunnerPreflightPreviewResult,
  type CodexLaunchCardPreviewResult,
  type ConstellationPreviewResult,
  type ControlPacket,
  type GuideBriefResult,
  type HandoffCapsulePreviewResult,
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
export const APP_VERSION = "0.1.0";
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
  "augnes_get_handoff_capsule_preview",
  "augnes_get_codex_launch_card_preview",
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
  "augnes_generate_codex_handoff_draft",
  "augnes_review_codex_result_draft",
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
  };
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
  const agentHandoffSuffix = Object.prototype.hasOwnProperty.call(brief, "agent_handoff")
    ? " Agent handoff is available for current status, next step, blockers, and Codex handoff."
    : "";

  return `State brief for ${brief.scope}: ${stateBlockCount(brief.active_state)} active, ${brief.pending_proposals.length} pending, ${brief.recent_actions.length} recent action(s), ${brief.open_tensions.length} open tension(s).${agentHandoffSuffix}`;
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
    return `Choose a work item for ${card.scope}: no work items found. Check the scope or select/create a work item elsewhere before opening a Codex handoff.`;
  }

  const recommendation = card.recommended_work_id
    ? ` Recommended work: ${card.recommended_work_id}. ${card.selection_reason}`
    : "";
  return `Choose a work item for ${card.scope}: ${card.work_candidates.length} candidate(s).${recommendation} ${card.handoff_tool_hint}`;
}

function describeWorkBrief(brief: WorkBrief): string {
  return `Work brief for ${brief.work_id}: ${brief.work.title}. Status ${brief.work.status}, priority ${brief.work.priority}, ${brief.recent_events.length} recent event(s), ${brief.related_proof.action_ids.length} linked action record(s). work_id is a trace anchor; committed state remains authoritative.`;
}

const BOUNDARY_COPY_DIET_AUTHORITY_MATRIX_REF = "docs/AUTHORITY_MATRIX.md#read-only-response-sections" as const;

type BoundaryCopyDiagnostics = {
  diagnostics_available: true;
  authority_matrix_ref: typeof BOUNDARY_COPY_DIET_AUTHORITY_MATRIX_REF;
  detailed_boundary_text: readonly string[];
  diagnostics_boundary_text: readonly string[];
  detailed_forbidden_actions?: readonly string[];
  detailed_non_authorities?: readonly string[];
};

type BoundaryCopySummary = {
  capability_class: readonly string[];
  default_boundary_summary: string;
  diagnostics_available: true;
  authority_matrix_ref: typeof BOUNDARY_COPY_DIET_AUTHORITY_MATRIX_REF;
  boundary_diagnostics: BoundaryCopyDiagnostics;
};

function compactBoundaryCopy(input: {
  capabilityClass: readonly string[] | string;
  defaultBoundarySummary: string;
  detailedBoundaryText: readonly string[];
  detailedForbiddenActions?: readonly string[];
  detailedNonAuthorities?: readonly string[];
}): BoundaryCopySummary {
  const capabilityClass = Array.isArray(input.capabilityClass)
    ? input.capabilityClass
    : [input.capabilityClass];
  return {
    capability_class: capabilityClass,
    default_boundary_summary: input.defaultBoundarySummary,
    diagnostics_available: true,
    authority_matrix_ref: BOUNDARY_COPY_DIET_AUTHORITY_MATRIX_REF,
    boundary_diagnostics: {
      diagnostics_available: true,
      authority_matrix_ref: BOUNDARY_COPY_DIET_AUTHORITY_MATRIX_REF,
      detailed_boundary_text: input.detailedBoundaryText,
      diagnostics_boundary_text: input.detailedBoundaryText,
      ...(input.detailedForbiddenActions ? { detailed_forbidden_actions: input.detailedForbiddenActions } : {}),
      ...(input.detailedNonAuthorities ? { detailed_non_authorities: input.detailedNonAuthorities } : {}),
    },
  };
}

const WORK_CONTRACT_CARD_BOUNDARY_TEXT = [
  "Work ID is a trace anchor, not committed state authority.",
  "This card is read-only.",
  "This card cannot execute Codex.",
  "This card cannot commit or reject Augnes state.",
  "This card cannot approve, publish, retry, replay, externally post, merge, or enable auto-merge.",
  "Proof is not approval.",
  "A PR is not merge authority.",
  "Durable approval remains user/Core gated.",
] as const;

const WORK_PICKER_CARD_BOUNDARY_TEXT = [
  "Work Picker is read-only.",
  "Work IDs are trace anchors, not committed state authority.",
  "Selecting a work item means choosing what to inspect next; it does not execute Codex.",
  "This card cannot create branches or PRs, call GitHub or providers, record proof or evidence, mutate Augnes state, approve, publish, merge, retry, replay, or deploy.",
] as const;

const WORK_EVENT_SPINE_TIMELINE_EMPTY_STATE = "No coordination events are attached to this work item yet.";
const WORK_EVENT_SPINE_TIMELINE_BOUNDARY_TEXT = [
  "Work event spine timeline is read-only and derived from attached work brief coordination_events.",
  "No event creation.",
  "No event mutation.",
  "No proof/evidence write.",
  "No state commit/reject.",
  "No Codex execution.",
  "No GitHub calls.",
  "No provider/OpenAI calls.",
  "No publish/merge/retry/replay/deploy authority.",
] as const;

const CORE_HANDOFF_AUTHORITY_BOUNDARIES = [
  "Core Handoff is read-only preview/copy packet text.",
  "Core Handoff does not execute Codex.",
  "Core Handoff cannot commit or reject Augnes state.",
  "Core Handoff cannot approve, publish, retry, replay, or externally post.",
  "Core Handoff cannot merge or enable auto-merge.",
  "Evidence is not approval.",
  "Proof is not approval.",
  "A PR is not merge authority.",
  "Durable approval remains user/Core gated.",
] as const;

const CORE_CURRENT_TASK_RESULT_REPORT_TEMPLATE = "docs/AUGNES_CODEX_RESULT_REPORT_TEMPLATE_V0_1.md" as const;
const CORE_CURRENT_TASK_NEXT_RETURN_PATH =
  "Paste through codexResultText / codexResultPaste for preview review." as const;
const CORE_CURRENT_TASK_AUTHORITY_BOUNDARY_SUMMARY = [
  "no Codex execution from App/MCP",
  "no proof/evidence write unless separately authorized",
  "no work close/status mutation",
  "no event/state mutation",
  "no GitHub review/merge/publish/retry/replay/deploy",
] as const;

const CODEX_HANDOFF_PREVIEW_BOUNDARY_TEXT = [
  "This preview is read-only.",
  "This preview cannot execute Codex.",
  "This preview cannot record evidence.",
  "This preview cannot record proof.",
  "This preview cannot commit or reject Augnes state.",
  "This preview cannot approve, publish, retry, replay, or externally post.",
  "This preview cannot merge or enable auto-merge.",
  "Evidence is not approval.",
  "Proof is not approval.",
  "A PR is not merge authority.",
  "Durable approval remains user/Core gated.",
  "Raw DB paths are local-dev fallback only and should not be normal user-facing input.",
] as const;

type WorkPickerCandidate = {
  work_id: string;
  title: string;
  status: string;
  priority: string;
  summary: string;
  next_step: string;
  user_attention_required: boolean;
  related_state_keys_count: number;
  expected_files_count: number;
  expected_checks_count: number;
  linked_docs_count: number;
  is_recommended: boolean;
  handoff_instruction: string;
};

type WorkPickerCard = {
  card_type: "work_picker_card";
  title: "Choose a work item";
  scope: string;
  candidate_count: number;
  recommended_work_id: string | null;
  recommended_work_title: string | null;
  selection_reason: string;
  next_action_hint: string;
  handoff_tool_hint: string;
  empty_state: string | null;
  work_candidates: WorkPickerCandidate[];
  source: {
    tool: "augnes_list_work_items";
    structured_content: "workItems";
    next_tool: "augnes_get_work_brief";
  };
  boundaries: {
    read_only: true;
    state_commit_or_reject: false;
    codex_execution: false;
    branch_or_pr_creation: false;
    proof_recording: false;
    evidence_recording: false;
    provider_calls: false;
    github_calls: false;
    persistence: false;
  };
  capability_class: readonly string[];
  default_boundary_summary: string;
  diagnostics_available: true;
  authority_matrix_ref: typeof BOUNDARY_COPY_DIET_AUTHORITY_MATRIX_REF;
  boundary_text: readonly string[];
  boundary_diagnostics: BoundaryCopyDiagnostics;
};

const CODEX_HANDOFF_PREVIEW_FORBIDDEN_ACTIONS = [
  "No Codex execution from this card.",
  "No commit/reject state.",
  "No approve/publish/retry/replay/external posting.",
  "No merge/auto-merge.",
  "No proof/evidence recording controls.",
] as const;

const CODEX_HANDOFF_PREVIEW_DEFAULT_FORBIDDEN_ACTIONS = [
  "Read-only handoff preparation only.",
  "Execution, write, lifecycle, and external-action authority remain outside this preview.",
] as const;

const CODEX_HANDOFF_PREVIEW_STOP_CONDITIONS = [
  "codex:read-brief fails.",
  "Work ID is missing or unknown.",
  "Scope is missing or ambiguous.",
  "Expected scope or forbidden surfaces are ambiguous.",
  "Forbidden surfaces are required to complete the task.",
  "Evidence or proof recording is requested without explicit user/Core authorization.",
] as const;

const CODEX_HANDOFF_JSON_SCHEMA = "augnes.codex_handoff_preview.v0_1" as const;
const CODEX_HANDOFF_JSON_BEGIN = "BEGIN_AUGNES_CODEX_HANDOFF_JSON" as const;
const CODEX_HANDOFF_JSON_END = "END_AUGNES_CODEX_HANDOFF_JSON" as const;
const FINAL_CODEX_HANDOFF_PACKET_SCHEMA = "augnes.final_codex_handoff_packet.v0_1" as const;
const CORE_CODEX_HANDOFF_PACKET_SCHEMA = "augnes.core_codex_handoff_packet.v0_1" as const;
const NO_CONSTELLATION_CONTEXT_TEXT = "No Project Constellation context is attached to this work contract." as const;

const FINAL_HANDOFF_SKIPPED_CHECK_POLICY =
  "Skipped checks must be reported with concrete reasons; do not claim skipped checks passed." as const;

const FINAL_HANDOFF_FINAL_REPORT_REQUIREMENTS = [
  "Changed files.",
  "Verification commands and results.",
  "Skipped checks with concrete reasons.",
  "Authority boundary statement.",
  "Remaining friction or next recommended step.",
] as const;

const FINAL_HANDOFF_FUTURE_SLOT_BOUNDARY_TEXT = [
  "Future attachment slot only.",
  "Not generated by this surface.",
  "No execution, writes, provider calls, branch creation, PR creation, proof/evidence recording, publication, merge, retry, replay, or deploy authority.",
] as const;

const MEMORY_REUSE_ATTACHMENT_BOUNDARY_TEXT = [
  "Memory Reuse attachment is a read-only proposal preview.",
  "No memory items are created, persisted, or mutated by this surface.",
  "No Perspective Memory Reuse Intake command is run by the App/MCP server.",
  "No execution, writes, provider calls, branch creation, PR creation, proof/evidence recording, publication, merge, retry, replay, or deploy authority.",
] as const;

const MEMORY_REUSE_ATTACHMENT_NO_MATCH_FALLBACK_BRIEF =
  "No persisted perspective-memory items were selected for this Work Contract context; continue without reuse or run Perspective Memory Reuse Intake separately before starting Codex." as const;

const MEMORY_REUSE_ATTACHMENT_UNAVAILABLE_FALLBACK_BRIEF =
  "Memory Reuse attachment proposal is unavailable in this payload; no selected memory IDs were attached or invented." as const;

const MEMORY_REUSE_ATTACHMENT_NOT_CONFIGURED_FALLBACK_BRIEF =
  "Memory Reuse attachment proposal is not configured for this payload; no memory intake was run by this surface." as const;

const PR_BODY_CHECKLIST_REQUIRED_SECTIONS = [
  "Summary",
  "User-facing path added or changed",
  "Files changed",
  "Verification",
  "Skipped checks and caveats",
  "Memory Reuse attachment status",
  "Project Constellation context status",
  "Final handoff preflight status",
  "Authority boundary statement",
  "Remaining caveats",
  "Next recommended step",
] as const;

const PR_BODY_CHECKLIST_BOUNDARY_TEXT = [
  "PR body checklist is preview-only closeout preparation.",
  "The closeout skeleton uses placeholders until a Codex worker replaces them with actual implementation results.",
  "No GitHub PR is created, updated, posted, or merged by this surface.",
  "No execution, writes, provider calls, branch creation, PR creation, proof/evidence recording, publication, merge, retry, replay, or deploy authority.",
] as const;

const PR_BODY_CHECKLIST_FORBIDDEN_CLAIMS = [
  "Do not claim verification passed without actual command results.",
  "Do not claim proof/evidence rows, screenshots, host observations, GitHub PR creation, branch creation, merge, publish, retry, replay, deploy, Codex execution, provider calls, or Augnes state mutation unless they actually happened under explicit authority.",
  "Do not write N/A for skipped checks; give concrete skipped reasons.",
] as const;

const PR_BODY_CHECKLIST_DEFAULT_FORBIDDEN_CLAIMS = [
  "Replace placeholders with observed Codex results.",
  "Keep proof, evidence, GitHub, state, and approval claims tied to explicit external evidence.",
  "Use concrete skipped-check reasons.",
] as const;

const PR_BODY_CHECKLIST_WARNINGS = [
  "Replace placeholders with actual results after implementation.",
  "Expected checks are prompts for later verification, not pass/fail results.",
  "Codex result review packet is preview-only and cannot submit or post review output.",
] as const;

const CODEX_RESULT_REVIEW_PACKET_REQUIRED_INPUTS = [
  "work_id.",
  "scope.",
  "Codex final report text or structured result payload.",
  "Changed files.",
  "Verification commands and results.",
  "Skipped checks with concrete reasons.",
  "Authority boundary statement.",
  "Remaining caveats.",
  "PR URL/number only if a separate read-only GitHub connector/reviewer flow is explicitly run outside the App/MCP server.",
] as const;

const CODEX_RESULT_REVIEW_PACKET_MISSING_RESULT_INPUTS = [
  "Codex final report text or structured result payload.",
  "Changed files.",
  "Verification commands and results.",
  "Skipped checks with concrete reasons or an explicit none-skipped statement.",
  "Authority boundary statement.",
  "Remaining caveats or an explicit none-remaining statement.",
] as const;

const CODEX_RESULT_REVIEW_PACKET_OPTIONAL_INPUTS = [
  "PR URL or PR number, user-provided only.",
  "Result status if Codex reported one.",
] as const;

const CODEX_RESULT_IMPORT_INPUT_SHAPE = {
  work_id: "Work ID for the Augnes work item being reviewed.",
  scope: "Augnes scope for the work item.",
  final_report_text: "Codex final report text or a structured result summary.",
  raw_result_text: "Optional raw pasted Codex final report, PR body, or closeout text for preview-only deterministic normalization.",
  pr_url_or_number: "Optional user-provided PR URL or PR number; this surface does not fetch it.",
  changed_files: "Optional list of files Codex reports changing.",
  verification_commands: "Optional list of verification commands Codex reports running.",
  verification_results: "Optional list of verification results, including command status or summary.",
  skipped_checks: "Optional list of skipped checks with concrete reasons, or an explicit none-skipped statement.",
  remaining_caveats: "Optional list of remaining caveats, or an explicit none-remaining statement.",
  authority_boundary_statement: "Optional closeout boundary statement supplied by Codex.",
  result_status: "Optional Codex-reported status such as completed, partial, blocked, failed, or needs_review.",
} as const;

const CODEX_RESULT_REVIEW_PACKET_BOUNDARY_TEXT = [
  "Codex result review packet is preview-only review preparation.",
  "No GitHub PR data is fetched by the App/MCP server.",
  "No GitHub comments, review submissions, approvals, change requests, labels, status updates, merges, proof/evidence records, Codex execution, provider calls, or Augnes state writes are performed by this surface.",
  "Result review uses only already-present structured payload fields and does not invent changed files, verification results, PR URLs, screenshots, proof IDs, evidence IDs, findings, or host observations.",
] as const;

const CODEX_RESULT_PASTE_NORMALIZER_BOUNDARY_TEXT = [
  "Codex result paste normalizer is preview-only.",
  "No GitHub PR data is fetched.",
  "No proof or evidence is written.",
  "No work status is changed.",
  "No event is created or mutated.",
  "No Codex execution, shell execution, provider call, OpenAI call, branch/PR creation, PR review submission, merge, publish, retry, replay, or deploy is performed.",
] as const;

const CODEX_RESULT_TOP_LEVEL_PASTE_ALIASES = [
  "codexResultText",
  "codex_result_text",
  "codexResultPaste",
  "codex_result_paste",
] as const;

const CODEX_RESULT_STRUCTURED_RAW_TEXT_ALIASES = [
  "raw_result_text",
  "rawResultText",
  "pasted_result_text",
  "pastedResultText",
  "pr_body_text",
  "prBodyText",
  "closeout_text",
  "closeoutText",
] as const;

const RESULT_REVIEW_CLOSURE_PREVIEW_BOUNDARY_TEXT = [
  "Result closure is read-only preview guidance.",
  "No work close.",
  "No work status update.",
  "No event creation.",
  "No event mutation.",
  "No proof/evidence write.",
  "No state commit/reject.",
  "No Codex execution.",
  "No GitHub calls.",
  "No PR review submission.",
  "No branch/PR creation.",
  "No provider/OpenAI calls.",
  "No publish/merge/retry/replay/deploy authority.",
] as const;

const CODEX_RESULT_REVIEW_PACKET_WARNINGS = [
  "Attach a Codex final report or structured result payload before treating this packet as ready for human review.",
  "Run any GitHub PR metadata review through a separate explicitly scoped read-only connector/reviewer flow outside the App/MCP server.",
  "Review recommendations are advisory only and do not submit or post anything.",
] as const;

const CodexResultImportListItemSchema = z.union([z.string().min(1), z.record(z.unknown())]);
const CodexResultImportInputSchema = z
  .object({
    work_id: z.string().min(1).optional(),
    workId: z.string().min(1).optional(),
    scope: z.string().min(1).optional(),
    final_report_text: z.string().min(1).optional(),
    finalReportText: z.string().min(1).optional(),
    codex_final_report_text: z.string().min(1).optional(),
    final_report_summary: z.string().min(1).optional(),
    summary: z.string().min(1).optional(),
    raw_result_text: z.string().min(1).optional(),
    rawResultText: z.string().min(1).optional(),
    pasted_result_text: z.string().min(1).optional(),
    pastedResultText: z.string().min(1).optional(),
    pr_body_text: z.string().min(1).optional(),
    prBodyText: z.string().min(1).optional(),
    closeout_text: z.string().min(1).optional(),
    closeoutText: z.string().min(1).optional(),
    pr_url: z.string().min(1).optional(),
    prUrl: z.string().min(1).optional(),
    pr_number: z.union([z.string().min(1), z.number().int().positive()]).optional(),
    prNumber: z.union([z.string().min(1), z.number().int().positive()]).optional(),
    changed_files: z.array(z.string().min(1)).optional(),
    changedFiles: z.array(z.string().min(1)).optional(),
    verification_commands: z.array(z.string().min(1)).optional(),
    verificationCommands: z.array(z.string().min(1)).optional(),
    verification_results: z.array(CodexResultImportListItemSchema).optional(),
    verificationResults: z.array(CodexResultImportListItemSchema).optional(),
    skipped_checks: z.array(CodexResultImportListItemSchema).optional(),
    skippedChecks: z.array(CodexResultImportListItemSchema).optional(),
    remaining_caveats: z.array(z.string().min(1)).optional(),
    remainingCaveats: z.array(z.string().min(1)).optional(),
    authority_boundary_statement: z.string().min(1).optional(),
    authorityBoundaryStatement: z.string().min(1).optional(),
    result_status: z.string().min(1).optional(),
    resultStatus: z.string().min(1).optional(),
  })
  .passthrough();
type CodexResultImportInput = z.infer<typeof CodexResultImportInputSchema>;

const FINAL_HANDOFF_READINESS_SUMMARY_BOUNDARY_TEXT = [
  "Final handoff readiness summary is display-only status clarification.",
  "It separates pre-run handoff preparation from post-run result review input.",
  "It does not change local preflight semantics or grant execution, write, GitHub, provider, proof, evidence, state, publish, retry, replay, deploy, or merge authority.",
] as const;

const CODEX_EXECUTION_REQUEST_PREVIEW_REQUIRED_CONFIRMATION_FIELDS = [
  "current_runtime_endpoint",
  "confirmed_scope",
  "confirmed_work_id",
  "explicit_user_request_for_separate_codex_session",
  "expected_files_reviewed",
  "expected_checks_reviewed",
  "project_constellation_context_reviewed",
  "memory_reuse_status_reviewed",
  "authority_boundary_reviewed",
  "branch_and_pr_authority_confirmed_separately",
  "proof_and_evidence_recording_authority_confirmed_separately",
  "result_review_packet_return_expected",
] as const;

const CODEX_EXECUTION_REQUEST_PREVIEW_NON_AUTHORITIES = [
  "no Codex execution",
  "no shell spawn",
  "no Node process spawning",
  "no branch creation",
  "no PR creation",
  "no GitHub calls",
  "no proof writes",
  "no evidence writes",
  "no Augnes state mutation",
  "no DB writes",
  "no provider calls",
  "no OpenAI calls",
  "no persistence",
  "no approval, merge, publish, retry, replay, or deploy authority",
] as const;

const CODEX_EXECUTION_REQUEST_PREVIEW_BOUNDARY_TEXT = [
  "This preview does not execute Codex. It only prepares the request shape for later explicit user-confirmed execution.",
  "It is not an execution button, branch creator, PR creator, proof recorder, evidence recorder, state mutation, provider call, or GitHub call.",
  "Any later Codex work still requires an explicit user-started Codex session and separate confirmation of write or recording authority.",
] as const;

const WORK_PICKER_BOUNDARY_COPY = compactBoundaryCopy({
  capabilityClass: ["read_only_work_selection", "boundary_next_review"],
  defaultBoundarySummary:
    "Read-only work selection. It chooses what to inspect next; durable state and external-action authority stay outside this card.",
  detailedBoundaryText: WORK_PICKER_CARD_BOUNDARY_TEXT,
});

const WORK_CONTRACT_BOUNDARY_COPY = compactBoundaryCopy({
  capabilityClass: ["read_only_work_context", "copyable_handoff_draft"],
  defaultBoundarySummary:
    "Read-only work context and handoff preparation. Durable decisions, proof/evidence recording, and external actions stay outside this card.",
  detailedBoundaryText: WORK_CONTRACT_CARD_BOUNDARY_TEXT,
});

const CODEX_HANDOFF_BOUNDARY_COPY = compactBoundaryCopy({
  capabilityClass: ["copyable_handoff_draft", "boundary_next_review"],
  defaultBoundarySummary:
    "Copyable handoff draft for a separate user-started Codex session. This surface prepares context only.",
  detailedBoundaryText: CODEX_HANDOFF_PREVIEW_BOUNDARY_TEXT,
  detailedForbiddenActions: CODEX_HANDOFF_PREVIEW_FORBIDDEN_ACTIONS,
});

const CORE_HANDOFF_BOUNDARY_COPY = compactBoundaryCopy({
  capabilityClass: ["copyable_handoff_draft", "core_context"],
  defaultBoundarySummary:
    "Short copyable handoff packet for Codex planning or scoped implementation context; detailed authority limits are in diagnostics.",
  detailedBoundaryText: CORE_HANDOFF_AUTHORITY_BOUNDARIES,
  detailedForbiddenActions: CODEX_HANDOFF_PREVIEW_FORBIDDEN_ACTIONS,
});

const PR_BODY_CHECKLIST_BOUNDARY_COPY = compactBoundaryCopy({
  capabilityClass: ["preview_only_pr_report_outline", "boundary_next_review"],
  defaultBoundarySummary:
    "Preview-only PR/report drafting checklist. It provides placeholders and review prompts, not GitHub or lifecycle actions.",
  detailedBoundaryText: PR_BODY_CHECKLIST_BOUNDARY_TEXT,
  detailedForbiddenActions: PR_BODY_CHECKLIST_FORBIDDEN_CLAIMS,
});

const CODEX_RESULT_REVIEW_BOUNDARY_COPY = compactBoundaryCopy({
  capabilityClass: ["preview_only_result_review", "boundary_next_review"],
  defaultBoundarySummary:
    "Preview-only result review from user-provided fields. It compares reported facts without fetching or posting externally.",
  detailedBoundaryText: CODEX_RESULT_REVIEW_PACKET_BOUNDARY_TEXT,
});

const CODEX_RESULT_PASTE_NORMALIZER_BOUNDARY_COPY = compactBoundaryCopy({
  capabilityClass: ["preview_only_result_parser"],
  defaultBoundarySummary:
    "Preview-only parser for pasted Codex reports. It extracts candidate fields for human review.",
  detailedBoundaryText: CODEX_RESULT_PASTE_NORMALIZER_BOUNDARY_TEXT,
});

const RESULT_REVIEW_CLOSURE_BOUNDARY_COPY = compactBoundaryCopy({
  capabilityClass: ["read_only_closure_guidance", "boundary_next_review"],
  defaultBoundarySummary:
    "Read-only closeout guidance. Human/Core and GitHub decisions remain outside this preview.",
  detailedBoundaryText: RESULT_REVIEW_CLOSURE_PREVIEW_BOUNDARY_TEXT,
});

const CODEX_EXECUTION_REQUEST_BOUNDARY_COPY = compactBoundaryCopy({
  capabilityClass: ["preview_only_request_shape", "copyable_handoff_draft"],
  defaultBoundarySummary:
    "Preview-only request shape for later explicit user-confirmed Codex work; it does not start that work.",
  detailedBoundaryText: CODEX_EXECUTION_REQUEST_PREVIEW_BOUNDARY_TEXT,
  detailedNonAuthorities: CODEX_EXECUTION_REQUEST_PREVIEW_NON_AUTHORITIES,
});

const FINAL_HANDOFF_READINESS_BOUNDARY_COPY = compactBoundaryCopy({
  capabilityClass: ["display_only_readiness_summary", "boundary_next_review"],
  defaultBoundarySummary:
    "Display-only readiness summary that separates handoff preparation from post-run result review.",
  detailedBoundaryText: FINAL_HANDOFF_READINESS_SUMMARY_BOUNDARY_TEXT,
});

const FINAL_HANDOFF_FORBIDDEN_CONTROL_LABEL_PARTS = [
  ["Run", " ", "Codex"],
  ["Start", " ", "Codex"],
  ["Launch", " ", "Codex"],
  ["Send", " ", "to", " ", "Codex"],
  ["Ex", "ecute"],
  ["Commit", " ", "state"],
  ["Record", " ", "proof"],
  ["Record", " ", "evidence"],
  ["Approve", " ", "publication"],
  ["Publish", " ", "now"],
  ["Merge", " ", "PR"],
  ["Enable", " ", "auto-merge"],
  ["Re", "try"],
  ["Re", "play"],
  ["De", "ploy"],
  ["Post", " ", "externally"],
  ["Create", " ", "PR"],
  ["Open", " ", "PR"],
  ["Submit", " ", "review"],
  ["Request", " ", "changes"],
  ["Approve", " ", "PR"],
] as const;

const WORK_CONTRACT_CONSTELLATION_CONTEXT_BOUNDARY_TEXT = [
  "Project Constellation context is read-only operator context.",
  "Evidence refs remain pointer-only.",
  "Unresolved tensions remain unresolved.",
  "Advisory next action context does not execute Codex.",
  "This context cannot record proof or evidence, mutate Augnes state, create branches or PRs, merge, publish, retry, replay, or deploy.",
] as const;

type WorkContractConstellationContext = {
  context_type: "work_contract_constellation_context";
  status: "attached";
  thesis: string;
  selected_candidate_id: string | null;
  selected_candidate_label: string | null;
  selection_status: string | null;
  selection_fallback_reason: string | null;
  pointer_evidence_ref_count: number;
  pointer_evidence_refs: string[];
  unresolved_tension_count: number;
  unresolved_tensions: string[];
  advisory_next_action_summary: string | null;
  source_refs: string[];
  boundary_text: readonly string[];
};

type WorkContractCard = {
  card_type: "work_contract_card";
  title: "Work Contract Card";
  scope: string;
  work_id: string;
  work_title: string;
  work_status: string;
  priority: string;
  current_or_next_step: string;
  expected_files: string[];
  expected_files_summary: string;
  expected_checks: string[];
  expected_checks_summary: string;
  related_state_keys: string[];
  related_state_keys_summary: string;
  recent_events_count: number;
  linked_proof_action_ids_count: number;
  linked_prs_count: number;
  linked_docs_count: number;
  linked_proof_summary: string;
  proof_evidence_expectation_summary: string;
  skipped_check_expectation_summary: string;
  capability_class: readonly string[];
  default_boundary_summary: string;
  diagnostics_available: true;
  authority_matrix_ref: typeof BOUNDARY_COPY_DIET_AUTHORITY_MATRIX_REF;
  authority_boundary_text: readonly string[];
  boundary_diagnostics: BoundaryCopyDiagnostics;
  constellation_context: WorkContractConstellationContext | null;
  source: {
    tool: "augnes_get_work_brief";
    structured_content: "brief";
    state_brief: "not fetched by this card";
  };
  boundaries: {
    read_only: true;
    state_commit_or_reject: false;
    codex_execution: false;
    approval_authority: false;
    publish_authority: false;
    retry_authority: false;
    replay_authority: false;
    external_posting: false;
    merge_authority: false;
    auto_merge_authority: false;
    proof_recording: false;
    evidence_recording: false;
    durable_approval: "user/Core gated";
  };
};

type WorkEventSpineTimelineStatus = "attached" | "empty";

type WorkEventSpineTimelineEvent = {
  event_id: string | null;
  event_type: string | null;
  scope: string | null;
  work_id: string | null;
  actor: string | null;
  target: string | null;
  source_surface: string | null;
  authority_level: string | null;
  state_keys: string[];
  causal_parent_id: string | null;
  payload_ref: string | null;
  result_status: string | null;
  created_at: string | null;
  payload_summary: string | null;
  summary: string;
  missing_fields: string[];
};

type WorkEventSpineTimeline = {
  timeline_type: "work_event_spine_timeline";
  status: WorkEventSpineTimelineStatus;
  scope: string;
  work_id: string;
  event_count: number;
  sort_order: "created_at_ascending";
  events: WorkEventSpineTimelineEvent[];
  selected_event: WorkEventSpineTimelineEvent | null;
  first_event_summary: string | null;
  empty_state: string;
  warnings: string[];
  boundary_text: readonly string[];
};

type CodexHandoffPreview = {
  preview_type: "codex_handoff_preview";
  title: "Codex Handoff Preview";
  readiness_status: "ready" | "needs_user_core_input" | "blocked";
  readiness_reasons: string[];
  task_profile: "docs" | "tooling" | "ui" | "runtime_high_risk" | "unknown";
  runtime_endpoint_label: string;
  scope: string | null;
  work_id: string | null;
  work_title: string | null;
  work_status: string | null;
  work_next_action: string | null;
  related_state_keys: string[];
  expected_files: string[];
  expected_checks: string[];
  evidence_recording: "recommended" | "needs_user_core_confirmation" | "not_applicable";
  proof_only_closeout: "recommended" | "needs_user_core_confirmation" | "not_applicable";
  browser_verification: "required" | "not_required" | "needs_user_core_confirmation";
  forbidden_actions: readonly string[];
  stop_conditions: readonly string[];
  constellation_context: WorkContractConstellationContext | null;
  copyable_handoff_text: string;
  capability_class: readonly string[];
  default_boundary_summary: string;
  diagnostics_available: true;
  authority_matrix_ref: typeof BOUNDARY_COPY_DIET_AUTHORITY_MATRIX_REF;
  boundary_text: readonly string[];
  boundary_diagnostics: BoundaryCopyDiagnostics;
};

type MemoryReuseAttachmentProposalStatus = "proposed" | "no_match" | "unavailable" | "not_configured";

type MemoryReuseAttachmentSourceContext = "work_contract" | "constellation_context" | "final_handoff_packet";

type FinalHandoffMemoryReuseAttachmentProposal = {
  proposal_type: "memory_reuse_attachment_proposal";
  status: MemoryReuseAttachmentProposalStatus;
  task_summary: string;
  task_ref: string | null;
  source_context: MemoryReuseAttachmentSourceContext;
  selected_memory_ids: string[];
  selected_memory_count: number;
  why_selected: string[];
  reuse_boundary: string[];
  selection_guidance: string[];
  fallback_brief: string;
  warnings: string[];
  boundary_text: readonly string[];
};

type FinalHandoffPrBodyChecklistPreview = {
  checklist_type: "pr_body_checklist_preview";
  status: "preview_only";
  generated: true;
  work_summary_required: true;
  user_facing_path_required: true;
  files_changed_required: true;
  verification_required: true;
  skipped_checks_required: true;
  authority_boundary_required: true;
  remaining_caveats_required: true;
  next_recommended_step_required: true;
  memory_reuse_summary_required: true;
  constellation_context_summary_required: true;
  final_handoff_preflight_summary_required: true;
  forbidden_claims: readonly string[];
  required_sections: readonly string[];
  warnings: readonly string[];
  capability_class: readonly string[];
  default_boundary_summary: string;
  diagnostics_available: true;
  authority_matrix_ref: typeof BOUNDARY_COPY_DIET_AUTHORITY_MATRIX_REF;
  boundary_text: readonly string[];
  boundary_diagnostics: BoundaryCopyDiagnostics;
};

type FinalHandoffCloseoutSkeleton = {
  skeleton_type: "codex_closeout_skeleton";
  status: "preview_only";
  generated: true;
  copyable_closeout_text: string;
  sections: Array<{
    heading: string;
    placeholder: string;
    source_hint: string;
  }>;
  required_sections: readonly string[];
  verification_command_placeholders: string[];
  skipped_check_policy: typeof FINAL_HANDOFF_SKIPPED_CHECK_POLICY;
  memory_reuse_attachment_status: MemoryReuseAttachmentProposalStatus;
  project_constellation_context_status: "attached" | "explicitly_absent";
  final_handoff_preflight_status: "pending_preflight" | "pass" | "warn" | "fail" | "unavailable";
  warnings: readonly string[];
  boundary_text: readonly string[];
};

type CodexResultReviewPacketStatus = "not_provided" | "preview_ready" | "needs_result_input" | "unavailable";
type CodexResultReviewSource = "not_provided" | "pasted_result" | "structured_payload" | "pr_metadata_payload" | "user_provided_input";
type CodexResultReviewRecommendation =
  | "needs_result_input"
  | "ready_for_human_review"
  | "needs_revision"
  | "blocked_by_missing_evidence";
type CodexResultReviewSuggestedResultStatus =
  | "completed"
  | "partial"
  | "blocked"
  | "failed"
  | "needs_human_review"
  | "not_provided";
type CodexResultPasteNormalizerStatus = "not_provided" | "candidate_ready" | "partial_candidate" | "ambiguous";
type CodexResultPasteNormalizerSource =
  | "not_provided"
  | "top_level_paste"
  | "structured_input_raw_text"
  | "structured_input_and_paste";
type CodexResultCombinedSectionLineClassification =
  | "skipped_check"
  | "remaining_caveat"
  | "explicit_none_skipped"
  | "explicit_none_remaining"
  | "ambiguous"
  | "ignored_empty";
type CodexResultReviewNextActionCategory =
  | "close_done"
  | "follow_up_fix_needed"
  | "additional_verification_needed"
  | "new_handoff_needed"
  | "result_incomplete_blocked"
  | "human_decision_needed";

type CodexResultReviewAlignment = {
  status: "aligned" | "missing" | "partial" | "not_provided" | "needs_review";
  summary: string;
  expected: string[];
  reported: string[];
  missing: string[];
};

type NormalizedCodexResultCandidate = {
  work_id?: string;
  scope?: string;
  final_report_text?: string;
  pr_url?: string;
  pr_number?: string;
  changed_files?: string[];
  verification_commands?: string[];
  verification_results?: string[];
  skipped_checks?: string[];
  remaining_caveats?: string[];
  authority_boundary_statement?: string;
  result_status?: string;
};

type CodexResultFieldFirstReportContext = {
  live_host_observation: string | null;
  proof_evidence_rows_written: string | null;
  event_rows_created_or_mutated: string | null;
  work_status_changed: string | null;
  state_committed_or_rejected: string | null;
  next_recommended_step: string | null;
};

type CodexResultPasteNormalizerPreview = {
  normalizer_type: "codex_result_paste_normalizer_preview";
  status: CodexResultPasteNormalizerStatus;
  source: CodexResultPasteNormalizerSource;
  raw_text_length: number;
  detected_fields: string[];
  filled_fields: string[];
  structured_fields_preserved: string[];
  conflict_warnings: string[];
  extraction_warnings: string[];
  ambiguous_combined_section_lines: string[];
  field_first_report_context: CodexResultFieldFirstReportContext;
  candidate: NormalizedCodexResultCandidate;
  capability_class: readonly string[];
  default_boundary_summary: string;
  diagnostics_available: true;
  authority_matrix_ref: typeof BOUNDARY_COPY_DIET_AUTHORITY_MATRIX_REF;
  boundary_text: readonly string[];
  boundary_diagnostics: BoundaryCopyDiagnostics;
};

type CodexResultPasteMergeResult = {
  mergedInput: CodexResultImportInput | null;
  filledFields: string[];
  structuredFieldsPreserved: string[];
  conflictWarnings: string[];
};

type CodexResultReviewPacketPreview = {
  packet_type: "codex_result_review_packet_preview";
  status: CodexResultReviewPacketStatus;
  result_source: CodexResultReviewSource;
  reviewed_against_packet_id: string | null;
  work_id: string | null;
  input_shape: typeof CODEX_RESULT_IMPORT_INPUT_SHAPE;
  provided_result_input_fields: string[];
  missing_result_input_fields: string[];
  optional_result_input_fields: readonly string[];
  result_review_summary: string;
  pr_reference: {
    url: string | null;
    number: string | null;
    source: "user_provided" | "not_provided";
    fetched: false;
  };
  reported_result_status: string | null;
  suggested_result_status: CodexResultReviewSuggestedResultStatus;
  reported_authority_boundary_statement: string | null;
  expected_files: string[];
  reported_changed_files: string[];
  expected_checks: string[];
  reported_verification_commands: string[];
  reported_verification_results: string[];
  skipped_checks: string[];
  remaining_caveats: string[];
  missing_required_closeout_sections: string[];
  required_result_input_fields: readonly string[];
  authority_boundary_issues: string[];
  memory_reuse_alignment: CodexResultReviewAlignment;
  constellation_context_alignment: CodexResultReviewAlignment;
  preflight_alignment: CodexResultReviewAlignment;
  checklist_alignment: CodexResultReviewAlignment;
  file_alignment: CodexResultReviewAlignment;
  verification_alignment: CodexResultReviewAlignment;
  skipped_check_alignment: CodexResultReviewAlignment;
  review_questions: string[];
  review_recommendation: CodexResultReviewRecommendation;
  suggested_next_action: CodexResultReviewNextActionCategory;
  warnings: string[];
  capability_class: readonly string[];
  default_boundary_summary: string;
  diagnostics_available: true;
  authority_matrix_ref: typeof BOUNDARY_COPY_DIET_AUTHORITY_MATRIX_REF;
  boundary_text: readonly string[];
  boundary_diagnostics: BoundaryCopyDiagnostics;
};

type ResultReviewClosureRecommendation =
  | "needs_result_input"
  | "close_ready"
  | "additional_verification_needed"
  | "follow_up_fix_needed"
  | "new_handoff_needed"
  | "result_incomplete_or_blocked"
  | "human_decision_needed";

type ResultReviewClosurePreview = {
  closure_type: "result_review_followup_closure_preview";
  status: ResultReviewClosureRecommendation;
  scope: string | null;
  work_id: string | null;
  result_review_status: CodexResultReviewPacketStatus;
  result_source: CodexResultReviewSource;
  review_recommendation: CodexResultReviewRecommendation;
  suggested_result_status: CodexResultReviewSuggestedResultStatus;
  suggested_next_action: CodexResultReviewNextActionCategory;
  closure_recommendation: ResultReviewClosureRecommendation;
  closure_summary: string;
  reasons: string[];
  missing_before_close: string[];
  verification_still_needed: string[];
  follow_up_seed: string;
  human_decision_items: string[];
  related_event_count: number;
  timeline_status: WorkEventSpineTimelineStatus;
  warnings: string[];
  capability_class: readonly string[];
  default_boundary_summary: string;
  diagnostics_available: true;
  authority_matrix_ref: typeof BOUNDARY_COPY_DIET_AUTHORITY_MATRIX_REF;
  boundary_text: readonly string[];
  boundary_diagnostics: BoundaryCopyDiagnostics;
};

type FinalHandoffAutomationSlot = {
  slot_id: "memory_reuse_attachment" | "pr_body_checklist" | "codex_result_review_packet";
  label: string;
  status:
    | "not_attached"
    | "not_configured"
    | "not_generated"
    | "preview_only"
    | CodexResultReviewPacketStatus
    | MemoryReuseAttachmentProposalStatus;
  inert: boolean;
  generated: boolean;
  summary: string;
  capability_class?: readonly string[];
  default_boundary_summary?: string;
  diagnostics_available?: true;
  authority_matrix_ref?: typeof BOUNDARY_COPY_DIET_AUTHORITY_MATRIX_REF;
  boundary_text: readonly string[];
  boundary_diagnostics?: BoundaryCopyDiagnostics;
  proposal?: FinalHandoffMemoryReuseAttachmentProposal;
  checklist?: FinalHandoffPrBodyChecklistPreview;
  closeout_skeleton?: FinalHandoffCloseoutSkeleton;
  review_packet?: CodexResultReviewPacketPreview;
};

type HandoffAutomationSlots = {
  memory_reuse_attachment: FinalHandoffAutomationSlot;
  pr_body_checklist: FinalHandoffAutomationSlot;
  codex_result_review_packet: FinalHandoffAutomationSlot;
};

type CoreCurrentTaskImplementationAnchorStatus = "attached" | "missing" | "unknown";

type CoreCurrentTaskOnly = {
  work_id: string | null;
  scope: string | null;
  title: string | null;
  current_task: string;
  core_usage: CoreHandoffUsage;
  implementation_anchor_status: CoreCurrentTaskImplementationAnchorStatus;
  implementation_anchor_count: number;
  implementation_anchor_summary: string;
  full_context_required_before_implementation: boolean;
  expected_files: string[];
  expected_checks: string[];
  stop_conditions: string[];
  authority_boundary_summary: string[];
  result_report_template: typeof CORE_CURRENT_TASK_RESULT_REPORT_TEMPLATE;
  next_return_path: typeof CORE_CURRENT_TASK_NEXT_RETURN_PATH;
};

type CoreCodexHandoffPacket = {
  packet_type: "core_codex_handoff_packet";
  schema: typeof CORE_CODEX_HANDOFF_PACKET_SCHEMA;
  title: "Core Codex Handoff Packet";
  source_packet_type: "final_codex_handoff_packet";
  source_packet_schema: typeof FINAL_CODEX_HANDOFF_PACKET_SCHEMA;
  copy_intent: "shorter_packet_for_starting_codex_work";
  core_handoff_usage: CoreHandoffUsage;
  implementation_anchors: string[];
  implementation_anchor_summary: string;
  full_context_required_before_implementation: boolean;
  core_current_task_only: CoreCurrentTaskOnly;
  work_scope: string | null;
  work_id: string | null;
  work_title: string | null;
  user_facing_goal: string;
  work_status: string | null;
  current_or_next_step: string | null;
  expected_files: string[];
  expected_checks: string[];
  related_state_keys: string[];
  constellation_context_summary: string[];
  memory_reuse_summary: string[];
  pr_checklist_summary: string[];
  closeout_report_expectations: string[];
  skipped_check_policy: typeof FINAL_HANDOFF_SKIPPED_CHECK_POLICY;
  forbidden_actions: readonly string[];
  stop_conditions: readonly string[];
  capability_class: readonly string[];
  default_boundary_summary: string;
  diagnostics_available: true;
  authority_matrix_ref: typeof BOUNDARY_COPY_DIET_AUTHORITY_MATRIX_REF;
  authority_boundaries: readonly string[];
  boundary_diagnostics: BoundaryCopyDiagnostics;
  final_report_requirements: readonly string[];
  structured_json_delimiters: {
    begin: typeof CODEX_HANDOFF_JSON_BEGIN;
    end: typeof CODEX_HANDOFF_JSON_END;
  };
  copyable_handoff_text: string;
  copyable_core_handoff_text: string;
  boundaries: {
    read_only: true;
    short_copy_only: true;
    codex_execution: false;
    branch_or_pr_creation: false;
    proof_recording: false;
    evidence_recording: false;
    provider_calls: false;
    github_calls: false;
    openai_calls: false;
    persistence: false;
  };
};

type CoreHandoffUsage = "planning_only" | "implementation_ready" | "implementation_requires_full_context";

type CodexHandoffRecommendationTarget =
  | "core_handoff"
  | "full_context"
  | "full_context_or_implementation_anchors"
  | "unavailable";

type CodexHandoffDecision = {
  decision_type: "codex_handoff_recommendation";
  status: "ready" | "unavailable";
  core_handoff_usage: CoreHandoffUsage | "unavailable";
  implementation_anchor_count: number;
  recommended_for_planning: CodexHandoffRecommendationTarget;
  recommended_for_implementation: CodexHandoffRecommendationTarget;
  recommendation_reason: string;
  user_confirmation_items: readonly string[];
  blocking_reason: string | null;
  boundary_text: readonly string[];
};

type FinalCodexHandoffPacket = {
  packet_type: "final_codex_handoff_packet";
  schema: typeof FINAL_CODEX_HANDOFF_PACKET_SCHEMA;
  title: "Final Codex Handoff Packet";
  composition_status: "composed";
  source_preview_type: "codex_handoff_preview";
  work_scope: string | null;
  work_id: string | null;
  work_title: string | null;
  work_status: string | null;
  current_or_next_step: string | null;
  expected_files: string[];
  expected_checks: string[];
  implementation_anchors: string[];
  implementation_anchor_summary: string;
  related_state_keys: string[];
  proof_evidence_expectation_summary: string;
  skipped_check_policy: typeof FINAL_HANDOFF_SKIPPED_CHECK_POLICY;
  browser_verification_expectation: CodexHandoffPreview["browser_verification"];
  forbidden_actions: readonly string[];
  stop_conditions: readonly string[];
  capability_class: readonly string[];
  default_boundary_summary: string;
  diagnostics_available: true;
  authority_matrix_ref: typeof BOUNDARY_COPY_DIET_AUTHORITY_MATRIX_REF;
  authority_boundaries: readonly string[];
  boundary_diagnostics: BoundaryCopyDiagnostics;
  final_report_requirements: readonly string[];
  constellation_context: WorkContractConstellationContext | null;
  constellation_context_status: "attached" | "explicitly_absent";
  no_constellation_context_fallback: typeof NO_CONSTELLATION_CONTEXT_TEXT;
  memory_reuse_attachment_proposal: FinalHandoffMemoryReuseAttachmentProposal;
  pr_body_checklist_preview: FinalHandoffPrBodyChecklistPreview;
  codex_pr_body_checklist: FinalHandoffPrBodyChecklistPreview;
  codex_closeout_skeleton: FinalHandoffCloseoutSkeleton;
  final_handoff_closeout_skeleton: FinalHandoffCloseoutSkeleton;
  codex_result_review_packet_preview: CodexResultReviewPacketPreview;
  final_handoff_codex_result_review_packet: CodexResultReviewPacketPreview;
  codex_pr_review_packet_preview: CodexResultReviewPacketPreview;
  codex_result_paste_normalizer_preview: CodexResultPasteNormalizerPreview;
  codex_result_normalizer_preview: CodexResultPasteNormalizerPreview;
  normalized_codex_result_candidate: NormalizedCodexResultCandidate;
  structured_json_delimiters: {
    begin: typeof CODEX_HANDOFF_JSON_BEGIN;
    end: typeof CODEX_HANDOFF_JSON_END;
  };
  handoff_automation_slots: HandoffAutomationSlots;
  copyable_handoff_text: string;
  boundaries: {
    read_only: true;
    local_preflight_only: true;
    state_commit_or_reject: false;
    codex_execution: false;
    branch_or_pr_creation: false;
    proof_recording: false;
    evidence_recording: false;
    provider_calls: false;
    github_calls: false;
    openai_calls: false;
    persistence: false;
  };
};

type FinalHandoffPreflightCheck = {
  id: string;
  status: "pass" | "warn" | "fail" | "unavailable";
  message: string;
};

type FinalHandoffPreflight = {
  preflight_type: "final_handoff_preflight";
  status: "pass" | "warn" | "fail" | "unavailable";
  summary: string;
  checks: FinalHandoffPreflightCheck[];
  checked_packet_type: FinalCodexHandoffPacket["packet_type"];
  checker: "app_local_final_handoff_preview_checker";
  local_only: true;
  pure: true;
  did_not_spawn_shell_or_npm: true;
  did_not_call_runtime: true;
  did_not_call_github_openai_or_provider: true;
  did_not_record_proof_or_evidence: true;
  did_not_execute_codex: true;
};

type FinalHandoffReadinessSummary = {
  summary_type: "final_handoff_readiness_summary";
  pre_run_handoff_readiness: "ready" | "needs_attention" | "blocked" | "unavailable";
  post_run_result_review_readiness:
    | "needs_result_input"
    | "ready_for_human_review"
    | "needs_revision"
    | "blocked_by_missing_evidence"
    | "unavailable";
  overall_local_preflight_status: FinalHandoffPreflight["status"];
  result_review_status: CodexResultReviewPacketStatus;
  result_review_source: CodexResultReviewSource;
  explanation: string;
  pre_run_check_ids: string[];
  post_run_check_id: "codex_result_review_packet_state";
  capability_class: readonly string[];
  default_boundary_summary: string;
  diagnostics_available: true;
  authority_matrix_ref: typeof BOUNDARY_COPY_DIET_AUTHORITY_MATRIX_REF;
  boundary_text: readonly string[];
  boundary_diagnostics: BoundaryCopyDiagnostics;
};

type CodexExecutionRequestPreviewStatus = "preview_only" | "awaiting_user_confirmation" | "unavailable";

type CodexExecutionRequestPreview = {
  preview_type: "codex_execution_request_preview";
  status: CodexExecutionRequestPreviewStatus;
  confirmation_status: CodexExecutionRequestPreviewStatus;
  source_final_handoff_packet: {
    packet_type: FinalCodexHandoffPacket["packet_type"];
    schema: typeof FINAL_CODEX_HANDOFF_PACKET_SCHEMA;
    packet_ref: string;
    composition_status: FinalCodexHandoffPacket["composition_status"];
    copyable_handoff_text_unchanged: true;
  };
  work_id: string | null;
  scope: string | null;
  selected_constellation_context_status: FinalCodexHandoffPacket["constellation_context_status"];
  memory_reuse_status: MemoryReuseAttachmentProposalStatus;
  expected_files: string[];
  expected_checks: string[];
  pr_body_checklist_present: boolean;
  closeout_skeleton_present: boolean;
  result_review_packet_expected_after_run: true;
  result_review_packet_status_before_run: CodexResultReviewPacketStatus;
  required_user_confirmation_fields: readonly string[];
  capability_class: readonly string[];
  default_boundary_summary: string;
  diagnostics_available: true;
  authority_matrix_ref: typeof BOUNDARY_COPY_DIET_AUTHORITY_MATRIX_REF;
  non_authorities: readonly string[];
  non_authority_diagnostics: BoundaryCopyDiagnostics;
  boundary_text: readonly string[];
  boundary_diagnostics: BoundaryCopyDiagnostics;
};

type CodexHandoffJsonBlock = {
  schema: typeof CODEX_HANDOFF_JSON_SCHEMA;
  packet_kind: "codex_handoff_preview";
  readiness_status: CodexHandoffPreview["readiness_status"];
  readiness_reasons: string[];
  task_profile: CodexHandoffPreview["task_profile"];
  runtime: {
    endpoint_label: string;
    requires_user_core_confirmation: boolean;
  };
  work: {
    scope: string | null;
    work_id: string | null;
    title: string | null;
    status: string | null;
    next_action: string | null;
    related_state_keys: string[];
  };
  authorization: {
    evidence_recording: CodexHandoffPreview["evidence_recording"];
    proof_only_closeout: CodexHandoffPreview["proof_only_closeout"];
    browser_verification: CodexHandoffPreview["browser_verification"];
  };
  expected_scope: {
    files: string[];
    checks: string[];
  };
  forbidden_actions: readonly string[];
  stop_conditions: readonly string[];
  constellation_context: WorkContractConstellationContext | null;
  capability_class: readonly string[];
  default_boundary_summary: string;
  diagnostics_available: true;
  authority_matrix_ref: typeof BOUNDARY_COPY_DIET_AUTHORITY_MATRIX_REF;
  boundary_diagnostics: {
    diagnostics_available: true;
    authority_matrix_ref: typeof BOUNDARY_COPY_DIET_AUTHORITY_MATRIX_REF;
  };
  authority_boundaries: readonly string[];
  copy_packet: {
    preview_only: true;
    does_not_execute_codex: true;
    does_not_record_evidence: true;
    does_not_record_proof: true;
    does_not_mutate_state: true;
    does_not_merge: true;
  };
};

function nonEmptyString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function stringArrayFromUnknown(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => nonEmptyString(item))
    .filter((item): item is string => Boolean(item));
}

function firstStringArray(...values: unknown[]): string[] {
  for (const value of values) {
    const items = stringArrayFromUnknown(value);
    if (items.length > 0) return items;
  }
  return [];
}

function objectFromUnknown(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function objectArrayFromUnknown(value: unknown): Record<string, unknown>[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item) => item && typeof item === "object" && !Array.isArray(item))
    .map((item) => item as Record<string, unknown>);
}

function firstObject(...values: unknown[]): Record<string, unknown> | null {
  for (const value of values) {
    const object = objectFromUnknown(value);
    if (Object.keys(object).length > 0) return object;
  }
  return null;
}

function stateKeysFromUnknown(value: unknown): string[] {
  const direct = stringArrayFromUnknown(value);
  if (direct.length > 0) return direct;
  const single = nonEmptyString(value);
  return single ? [single] : [];
}

function booleanFromUnknown(...values: unknown[]): boolean | null {
  for (const value of values) {
    if (typeof value === "boolean") return value;
    const text = nonEmptyString(value)?.toLowerCase();
    if (!text) continue;
    if (["yes", "true", "allowed", "recommended"].includes(text)) return true;
    if (["no", "false", "not_allowed", "not applicable", "not_applicable"].includes(text)) return false;
  }
  return null;
}

function handoffSettingFromBoolean(value: boolean | null): CodexHandoffPreview["evidence_recording"] {
  if (value === true) return "recommended";
  if (value === false) return "not_applicable";
  return "needs_user_core_confirmation";
}

function runtimeEndpointLabelFromBrief(brief: WorkBrief, codexHandoff: Record<string, unknown>): string {
  const explicitEndpoint =
    nonEmptyString(codexHandoff.augnes_api_base_url) ??
    nonEmptyString(codexHandoff.runtime_endpoint) ??
    nonEmptyString((brief as WorkBrief & Record<string, unknown>).runtime_endpoint);
  const origin = explicitEndpoint ? safeOrigin(explicitEndpoint) : undefined;
  return origin ?? "provided by current Augnes runtime";
}

function inferTaskProfile(
  expectedFiles: string[],
  expectedChecks: string[],
  nextStep: string | null
): CodexHandoffPreview["task_profile"] {
  const fileText = expectedFiles.join("\n").toLowerCase();
  const haystack = [fileText, expectedChecks.join("\n"), nextStep ?? ""].join("\n").toLowerCase();
  if (!haystack.trim()) return "unknown";
  if (/\b(database|migration|secret|hook|plugin)\b/.test(haystack) || /\/api\//.test(haystack) || /app tool schema|mcp\/app tool schema|runtime behavior|schema change/.test(haystack)) {
    return "runtime_high_risk";
  }
  if (/apps\/augnes_apps\/public|console-widget|work contract card|work_contract_card|widget|cockpit|component|\.tsx\b|\.jsx\b/.test(haystack)) {
    return "ui";
  }
  if (/^docs\//m.test(fileText) || /^reports\//m.test(fileText) || /^readme\.md$/m.test(fileText) || /docs-only|documentation/.test(haystack)) {
    if (expectedFiles.length > 0 && expectedFiles.every((filePath) => /^(docs\/|reports\/|README\.md$)/i.test(filePath))) {
      return "docs";
    }
  }
  if (/^scripts\//m.test(fileText) || /smoke|helper|package\.json|tooling/.test(haystack)) return "tooling";
  return "unknown";
}

function browserVerificationForProfile(
  taskProfile: CodexHandoffPreview["task_profile"]
): CodexHandoffPreview["browser_verification"] {
  if (taskProfile === "ui") return "required";
  if (taskProfile === "docs" || taskProfile === "tooling") return "not_required";
  return "needs_user_core_confirmation";
}

function listForPacket(items: string[], fallback: string): string {
  return items.length ? items.map((item) => `  - ${item}`).join("\n") : `  - ${fallback}`;
}

function uniqueNonEmptyStrings(items: readonly (string | null | undefined)[]): string[] {
  return Array.from(new Set(items.map((item) => nonEmptyString(item)).filter((item): item is string => Boolean(item))));
}

function buildCoreImplementationAnchors(finalPacket: FinalCodexHandoffPacket): string[] {
  return uniqueNonEmptyStrings(finalPacket.expected_files);
}

const FULL_CONTEXT_IMPLEMENTATION_ANCHOR_LINK_KEYS = [
  "implementation_anchors",
  "target_files",
  "schema_paths",
  "schema_modules",
  "storage_modules",
  "api_routes",
  "route_handlers",
  "test_files",
  "smoke_scripts",
] as const;

const FULL_CONTEXT_ANCHORS_BY_STATE_KEY: Record<string, readonly string[]> = {
  "coordination.event_spine": [
    "docs/AUGNES_COORDINATION_SPINE_ROADMAP.md#pr-11-event-spine-schema-and-storage",
    "lib/db/schema.sql#coordination_events",
    "lib/coordination-events.ts",
    "app/api/events/route.ts",
    "app/api/events/[event_id]/route.ts",
    "lib/work.ts#appendCoordinationEvent",
    "app/api/work/[work_id]/route.ts",
    "app/api/work/[work_id]/brief/route.ts",
    "scripts/demo-seed.mjs#AG-006",
    "scripts/smoke-authority-invariants.mjs#coordination_events",
  ],
};

function buildFullContextImplementationAnchors(brief: WorkBrief, card: WorkContractCard): string[] {
  const codexHandoff = brief.codex_handoff as typeof brief.codex_handoff & Record<string, unknown>;
  const workLinks = brief.work.links as Record<string, unknown>;
  const anchors: string[] = [];

  for (const key of FULL_CONTEXT_IMPLEMENTATION_ANCHOR_LINK_KEYS) {
    anchors.push(...stringArrayFromUnknown(codexHandoff[key]));
    anchors.push(...stringArrayFromUnknown(workLinks[key]));
  }

  for (const stateKey of card.related_state_keys) {
    anchors.push(...(FULL_CONTEXT_ANCHORS_BY_STATE_KEY[stateKey] ?? []));
  }

  return uniqueNonEmptyStrings(anchors);
}

function fullContextImplementationAnchorSummary(implementationAnchors: readonly string[]): string {
  if (implementationAnchors.length > 0) {
    return "Concrete implementation anchors are available in Full Context. Core may still be planning-only; use Full Context or verify these anchors before editing.";
  }

  return "Implementation anchors could not be derived from current work metadata. Run codex:read-brief/repo inspection before implementation.";
}

function coreHandoffUsageForAnchors(implementationAnchors: readonly string[]): CoreHandoffUsage {
  return implementationAnchors.length > 0 ? "implementation_ready" : "implementation_requires_full_context";
}

function coreImplementationAnchorSummary(
  coreHandoffUsage: CoreHandoffUsage,
  implementationAnchors: readonly string[]
): string {
  if (implementationAnchors.length > 0) {
    return "Implementation file/schema anchors are attached in Core; confirm them with codex:read-brief before editing.";
  }
  if (coreHandoffUsage === "implementation_requires_full_context") {
    return "No implementation file/schema anchors are attached in Core. Use Core for planning only, or open Full Context before implementation.";
  }
  return "Core is planning-only until implementation anchors are confirmed.";
}

function payloadSummaryFromEventRecord(record: Record<string, unknown>): string | null {
  const payload = objectFromUnknown(record.payload);
  return (
    nonEmptyString(record.payload_summary) ??
    nonEmptyString(record.payloadSummary) ??
    nonEmptyString(record.summary) ??
    nonEmptyString(payload.summary)
  );
}

function sortTimestamp(value: string | null): number {
  if (!value) return Number.POSITIVE_INFINITY;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : Number.POSITIVE_INFINITY;
}

function buildWorkEventSpineTimelineEvent(record: Record<string, unknown>, brief: WorkBrief): WorkEventSpineTimelineEvent {
  const eventId = nonEmptyString(record.event_id);
  const eventType = nonEmptyString(record.event_type);
  const scope = nonEmptyString(record.scope) ?? nonEmptyString(brief.scope);
  const workId = nonEmptyString(record.work_id) ?? nonEmptyString(brief.work_id);
  const actor = nonEmptyString(record.actor);
  const target = nonEmptyString(record.target);
  const sourceSurface = nonEmptyString(record.source_surface);
  const authorityLevel = nonEmptyString(record.authority_level);
  const stateKeys = stateKeysFromUnknown(record.state_keys);
  const causalParentId = nonEmptyString(record.causal_parent_id);
  const payloadRef = nonEmptyString(record.payload_ref);
  const resultStatus = nonEmptyString(record.result_status);
  const createdAt = nonEmptyString(record.created_at);
  const payloadSummary = payloadSummaryFromEventRecord(record);
  const missingFields = ([
    ["event_id", eventId],
    ["event_type", eventType],
    ["scope", scope],
    ["work_id", workId],
    ["actor", actor],
    ["source_surface", sourceSurface],
    ["authority_level", authorityLevel],
    ["created_at", createdAt],
  ] satisfies Array<[string, string | null]>)
    .filter(([, value]) => !value)
    .map(([field]) => field);

  if (stateKeys.length === 0) missingFields.push("state_keys");

  return {
    event_id: eventId,
    event_type: eventType,
    scope,
    work_id: workId,
    actor,
    target,
    source_surface: sourceSurface,
    authority_level: authorityLevel,
    state_keys: stateKeys,
    causal_parent_id: causalParentId,
    payload_ref: payloadRef,
    result_status: resultStatus,
    created_at: createdAt,
    payload_summary: payloadSummary,
    summary: payloadSummary ?? "No payload summary is attached to this coordination event.",
    missing_fields: missingFields,
  };
}

function buildWorkEventSpineTimeline(brief: WorkBrief): WorkEventSpineTimeline {
  const briefRecord = brief as WorkBrief & Record<string, unknown>;
  const coordinationEvents = objectArrayFromUnknown(briefRecord.coordination_events);
  const events = coordinationEvents
    .map((event) => buildWorkEventSpineTimelineEvent(event, brief))
    .sort((left, right) => {
      const timeDelta = sortTimestamp(left.created_at) - sortTimestamp(right.created_at);
      if (timeDelta !== 0) return timeDelta;
      return (left.event_id ?? "").localeCompare(right.event_id ?? "");
    });
  const warnings = events.length
    ? events
        .filter((event) => event.missing_fields.length > 0)
        .map((event) => `Coordination event ${event.event_id ?? event.event_type ?? "unknown"} is missing: ${event.missing_fields.join(", ")}.`)
    : [WORK_EVENT_SPINE_TIMELINE_EMPTY_STATE];

  return {
    timeline_type: "work_event_spine_timeline",
    status: events.length > 0 ? "attached" : "empty",
    scope: brief.scope,
    work_id: brief.work_id,
    event_count: events.length,
    sort_order: "created_at_ascending",
    events,
    selected_event: events[0] ?? null,
    first_event_summary: events[0]?.summary ?? null,
    empty_state: WORK_EVENT_SPINE_TIMELINE_EMPTY_STATE,
    warnings,
    boundary_text: WORK_EVENT_SPINE_TIMELINE_BOUNDARY_TEXT,
  };
}

const CODEX_HANDOFF_DECISION_USER_CONFIRMATION_ITEMS = [
  "I know whether I'm asking Codex for planning or implementation.",
  "I checked whether Full Context is required.",
  "I checked expected checks.",
  "I will paste the selected packet into a separate Codex session.",
] as const;

const CODEX_HANDOFF_DECISION_BOUNDARY_TEXT = [
  "Codex handoff recommendation is read-only guidance for choosing copied packet text.",
  "The recommendation panel does not run Codex.",
  "The recommendation panel does not create branches or PRs.",
  "The recommendation panel does not record proof or evidence.",
  "The recommendation panel does not mutate Augnes state.",
] as const;

function buildCodexHandoffDecision(corePacket: CoreCodexHandoffPacket): CodexHandoffDecision {
  const implementationAnchorCount = corePacket.implementation_anchors.length;
  const base = {
    decision_type: "codex_handoff_recommendation" as const,
    status: "ready" as const,
    core_handoff_usage: corePacket.core_handoff_usage,
    implementation_anchor_count: implementationAnchorCount,
    recommended_for_planning: "core_handoff" as const,
    user_confirmation_items: CODEX_HANDOFF_DECISION_USER_CONFIRMATION_ITEMS,
    boundary_text: CODEX_HANDOFF_DECISION_BOUNDARY_TEXT,
  };

  if (corePacket.core_handoff_usage === "implementation_ready") {
    return {
      ...base,
      recommended_for_implementation: "core_handoff",
      recommendation_reason: "Core includes implementation anchors. Confirm anchors before editing.",
      blocking_reason: null,
    };
  }

  if (corePacket.core_handoff_usage === "planning_only") {
    return {
      ...base,
      recommended_for_implementation: "full_context_or_implementation_anchors",
      recommendation_reason: "Core is enough for planning. For implementation, use Full Context or provide implementation anchors.",
      blocking_reason: "Core is marked planning-only for implementation work.",
    };
  }

  return {
    ...base,
    recommended_for_implementation: "full_context",
    recommendation_reason:
      "Core is enough for planning. Full Context is required before implementation because implementation file/schema anchors are missing.",
    blocking_reason: "Implementation file/schema anchors are missing from Core.",
  };
}

function formatPacketLine(value: string | null, fallback = "missing"): string {
  return value ?? fallback;
}

function sourceRefStringsFromUnknown(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (typeof item === "string") return nonEmptyString(item);
        const object = objectFromUnknown(item);
        return (
          nonEmptyString(object.source_ref) ??
          nonEmptyString(object.target_ref) ??
          nonEmptyString(object.label) ??
          nonEmptyString(object.id)
        );
      })
      .filter((item): item is string => Boolean(item));
  }
  return stringArrayFromUnknown(value);
}

function summarizeConstellationEvidenceRef(item: Record<string, unknown>): string | null {
  const pointerId = nonEmptyString(item.pointer_id) ?? nonEmptyString(item.id);
  const label = nonEmptyString(item.label);
  const targetRef = nonEmptyString(item.target_ref);
  if (!pointerId && !label && !targetRef) return null;
  return [pointerId, label, targetRef ? `-> ${targetRef}` : null].filter(Boolean).join(": ");
}

function summarizeConstellationTension(item: Record<string, unknown>): string | null {
  const tensionId = nonEmptyString(item.tension_id) ?? nonEmptyString(item.id);
  const label = nonEmptyString(item.label);
  const summary = nonEmptyString(item.summary);
  if (!tensionId && !label && !summary) return null;
  return [tensionId, label, summary].filter(Boolean).join(": ");
}

function summarizeConstellationAction(item: Record<string, unknown> | null): string | null {
  if (!item) return null;
  const candidateId = nonEmptyString(item.candidate_id) ?? nonEmptyString(item.id);
  const label = nonEmptyString(item.label);
  const summary = nonEmptyString(item.summary);
  if (!candidateId && !label && !summary) return null;
  return [candidateId, label, summary].filter(Boolean).join(": ");
}

function formatStatus(value: string | null, fallback = "missing"): string {
  return value ?? fallback;
}

function buildWorkContractConstellationContext(source: unknown): WorkContractConstellationContext | null {
  const sourceObject = objectFromUnknown(source);
  if (Object.keys(sourceObject).length === 0) return null;

  const preview = objectFromUnknown(sourceObject.project_constellation_preview ?? sourceObject.constellation_preview);
  const compact = firstObject(
    sourceObject.work_contract_constellation_context,
    sourceObject.constellation_context,
    preview
  );
  if (!compact) return null;

  const project = objectFromUnknown(compact.project_constellation ?? sourceObject.project_constellation);
  const thesis =
    nonEmptyString(compact.thesis) ??
    nonEmptyString(project.thesis) ??
    nonEmptyString(objectFromUnknown(sourceObject.project_constellation).thesis);
  if (!thesis) return null;

  const evidencePointers = objectArrayFromUnknown(
    compact.evidence_pointers ?? sourceObject.evidence_pointers ?? project.evidence_pointers
  );
  const unresolvedTensions = objectArrayFromUnknown(
    compact.unresolved_tensions ?? sourceObject.unresolved_tensions ?? project.unresolved_tensions
  );
  const nextActionCandidates = objectArrayFromUnknown(
    compact.next_action_candidates ?? sourceObject.next_action_candidates ?? project.next_action_candidates
  );
  const selectedCandidateId =
    nonEmptyString(compact.selected_candidate_id) ??
    nonEmptyString(objectFromUnknown(compact.selection).selected_candidate_id) ??
    nonEmptyString(objectFromUnknown(compact.copyable_handoff_seed).selected_candidate_id);
  const selectedCandidate =
    selectedCandidateId ? nextActionCandidates.find((candidate) => nonEmptyString(candidate.candidate_id) === selectedCandidateId) ?? null : null;
  const defaultCandidate = selectedCandidate ?? nextActionCandidates[0] ?? null;
  const pointerRefs = firstStringArray(compact.pointer_evidence_refs, compact.evidence_refs);
  const summarizedPointerRefs =
    pointerRefs.length > 0
      ? pointerRefs
      : evidencePointers.map(summarizeConstellationEvidenceRef).filter((item): item is string => Boolean(item));
  const tensionRefs = firstStringArray(compact.unresolved_tensions, compact.tension_refs);
  const summarizedTensions =
    tensionRefs.length > 0
      ? tensionRefs
      : unresolvedTensions.map(summarizeConstellationTension).filter((item): item is string => Boolean(item));

  return {
    context_type: "work_contract_constellation_context",
    status: "attached",
    thesis,
    selected_candidate_id: selectedCandidateId,
    selected_candidate_label:
      nonEmptyString(compact.selected_candidate_label) ??
      nonEmptyString(objectFromUnknown(compact.selection).selected_candidate_label) ??
      nonEmptyString(objectFromUnknown(compact.copyable_handoff_seed).selected_candidate_label) ??
      nonEmptyString(selectedCandidate?.label),
    selection_status:
      nonEmptyString(compact.selection_status) ??
      nonEmptyString(objectFromUnknown(compact.selection).selection_status) ??
      nonEmptyString(objectFromUnknown(compact.copyable_handoff_seed).selection_status),
    selection_fallback_reason:
      nonEmptyString(compact.selection_fallback_reason) ??
      nonEmptyString(objectFromUnknown(compact.selection).selection_fallback_reason) ??
      nonEmptyString(objectFromUnknown(compact.copyable_handoff_seed).selection_fallback_reason),
    pointer_evidence_ref_count:
      typeof compact.pointer_evidence_ref_count === "number" && Number.isFinite(compact.pointer_evidence_ref_count)
        ? compact.pointer_evidence_ref_count
        : summarizedPointerRefs.length,
    pointer_evidence_refs: summarizedPointerRefs.slice(0, 5),
    unresolved_tension_count:
      typeof compact.unresolved_tension_count === "number" && Number.isFinite(compact.unresolved_tension_count)
        ? compact.unresolved_tension_count
        : summarizedTensions.length,
    unresolved_tensions: summarizedTensions.slice(0, 5),
    advisory_next_action_summary:
      nonEmptyString(compact.advisory_next_action_summary) ??
      nonEmptyString(compact.next_action_summary) ??
      summarizeConstellationAction(defaultCandidate),
    source_refs: sourceRefStringsFromUnknown(compact.source_refs ?? sourceObject.source_refs).slice(0, 5),
    boundary_text: WORK_CONTRACT_CONSTELLATION_CONTEXT_BOUNDARY_TEXT,
  };
}

function buildWorkContractConstellationContextFromBrief(brief: WorkBrief): WorkContractConstellationContext | null {
  const briefRecord = brief as WorkBrief & Record<string, unknown>;
  const codexHandoff = objectFromUnknown(brief.codex_handoff);
  return buildWorkContractConstellationContext({
    work_contract_constellation_context: briefRecord.work_contract_constellation_context,
    constellation_context: briefRecord.constellation_context ?? codexHandoff.constellation_context,
    project_constellation_preview: briefRecord.project_constellation_preview ?? codexHandoff.project_constellation_preview,
    project_constellation: briefRecord.project_constellation,
    evidence_pointers: briefRecord.evidence_pointers,
    unresolved_tensions: briefRecord.unresolved_tensions,
    next_action_candidates: briefRecord.next_action_candidates,
    source_refs: briefRecord.source_refs,
  });
}

function memoryReuseAttachmentStatusFromUnknown(value: unknown): MemoryReuseAttachmentProposalStatus | null {
  const status = nonEmptyString(value);
  if (
    status === "proposed" ||
    status === "no_match" ||
    status === "unavailable" ||
    status === "not_configured"
  ) {
    return status;
  }
  return null;
}

function memoryReuseSourceContextFromUnknown(
  value: unknown,
  fallback: MemoryReuseAttachmentSourceContext
): MemoryReuseAttachmentSourceContext {
  const sourceContext = nonEmptyString(value);
  if (
    sourceContext === "work_contract" ||
    sourceContext === "constellation_context" ||
    sourceContext === "final_handoff_packet"
  ) {
    return sourceContext;
  }
  return fallback;
}

function buildMemoryReuseTaskSummary(card: WorkContractCard, preview: CodexHandoffPreview): string {
  return (
    nonEmptyString(preview.work_next_action) ??
    nonEmptyString(card.current_or_next_step) ??
    nonEmptyString(preview.work_title) ??
    nonEmptyString(card.work_title) ??
    "Work Contract task context."
  );
}

function buildDefaultMemoryReuseSelectionGuidance(status: MemoryReuseAttachmentProposalStatus): string[] {
  if (status === "proposed") {
    return [
      "Review selected persisted memory IDs and reuse boundaries before starting a separate Codex session.",
      "Treat the attachment as prior context only, not runtime authority.",
    ];
  }
  if (status === "no_match") {
    return [
      "No persisted perspective-memory items were selected from the attached Work Contract context.",
      "Continue without reuse or run Perspective Memory Reuse Intake separately before starting Codex if memory context is required.",
    ];
  }
  if (status === "not_configured") {
    return [
      "Memory Reuse proposal data is not configured for this Work Contract payload.",
      "No memory intake was run by this App/MCP surface.",
    ];
  }
  return [
    "Memory Reuse proposal data is unavailable in this Work Contract payload.",
    "No selected memory IDs were attached or invented.",
  ];
}

function fallbackBriefForMemoryReuseStatus(status: MemoryReuseAttachmentProposalStatus): string {
  if (status === "no_match") return MEMORY_REUSE_ATTACHMENT_NO_MATCH_FALLBACK_BRIEF;
  if (status === "not_configured") return MEMORY_REUSE_ATTACHMENT_NOT_CONFIGURED_FALLBACK_BRIEF;
  if (status === "unavailable") return MEMORY_REUSE_ATTACHMENT_UNAVAILABLE_FALLBACK_BRIEF;
  return "Selected persisted memory items are attached as read-only prior context; preserve the listed reuse boundaries.";
}

function memoryReuseProposalSourceFromBrief(brief: WorkBrief): Record<string, unknown> | null {
  const briefRecord = brief as WorkBrief & Record<string, unknown>;
  const codexHandoff = objectFromUnknown(brief.codex_handoff);
  const briefSlots = objectFromUnknown(briefRecord.handoff_automation_slots);
  const codexSlots = objectFromUnknown(codexHandoff.handoff_automation_slots);
  const finalPacket = objectFromUnknown(
    briefRecord.final_codex_handoff_packet ?? briefRecord.codex_final_handoff_packet ?? codexHandoff.final_codex_handoff_packet
  );
  const finalSlots = objectFromUnknown(finalPacket.handoff_automation_slots);
  const slotProposal = (slot: unknown) => {
    const slotRecord = objectFromUnknown(slot);
    return firstObject(slotRecord.proposal, slotRecord);
  };

  return firstObject(
    briefRecord.memory_reuse_attachment_proposal,
    briefRecord.final_handoff_memory_reuse_attachment,
    codexHandoff.memory_reuse_attachment_proposal,
    codexHandoff.final_handoff_memory_reuse_attachment,
    finalPacket.memory_reuse_attachment_proposal,
    finalPacket.final_handoff_memory_reuse_attachment,
    slotProposal(briefSlots.memory_reuse_attachment),
    slotProposal(codexSlots.memory_reuse_attachment),
    slotProposal(finalSlots.memory_reuse_attachment)
  );
}

function memoryReuseSelectedIdsFromSource(source: Record<string, unknown> | null): string[] {
  if (!source) return [];
  const directIds = stringArrayFromUnknown(source.selected_memory_ids);
  const itemIds = objectArrayFromUnknown(source.selected_memory_items)
    .map((item) => nonEmptyString(item.memory_item_id) ?? nonEmptyString(item.item_id) ?? nonEmptyString(item.id))
    .filter((item): item is string => Boolean(item));
  return Array.from(new Set([...directIds, ...itemIds]));
}

function buildMemoryReuseAttachmentProposal(
  brief: WorkBrief,
  card: WorkContractCard,
  preview: CodexHandoffPreview
): FinalHandoffMemoryReuseAttachmentProposal {
  const source = memoryReuseProposalSourceFromBrief(brief);
  const defaultSourceContext: MemoryReuseAttachmentSourceContext = preview.constellation_context
    ? "constellation_context"
    : "work_contract";
  const selectedMemoryIds = memoryReuseSelectedIdsFromSource(source);
  const sourceStatus = memoryReuseAttachmentStatusFromUnknown(source?.status);
  const warnings = source ? firstStringArray(source.warnings) : [];
  let status: MemoryReuseAttachmentProposalStatus = sourceStatus ?? (selectedMemoryIds.length > 0 ? "proposed" : "no_match");

  if (status === "proposed" && selectedMemoryIds.length === 0) {
    status = "no_match";
    warnings.push("Attached Memory Reuse proposal had proposed status without selected memory IDs; no memory IDs were invented.");
  }
  if (selectedMemoryIds.length > 0 && status !== "proposed") {
    status = "proposed";
    warnings.push("Attached Memory Reuse proposal included selected memory IDs; status is surfaced as proposed.");
  }

  const whySelected = selectedMemoryIds.length > 0 ? firstStringArray(source?.why_selected) : [];
  const reuseBoundary = selectedMemoryIds.length > 0 ? firstStringArray(source?.reuse_boundary) : [];
  if (selectedMemoryIds.length === 0 && source && (stringArrayFromUnknown(source.why_selected).length > 0 || stringArrayFromUnknown(source.reuse_boundary).length > 0)) {
    warnings.push("Attached Memory Reuse rationale was ignored because no selected memory IDs were attached.");
  }

  const selectionGuidance = firstStringArray(source?.selection_guidance);
  const taskSummary =
    nonEmptyString(source?.task_summary) ??
    nonEmptyString(source?.task_ref) ??
    buildMemoryReuseTaskSummary(card, preview);
  const fallbackBrief =
    nonEmptyString(source?.fallback_brief) ??
    fallbackBriefForMemoryReuseStatus(status);
  const boundaryText = [
    ...MEMORY_REUSE_ATTACHMENT_BOUNDARY_TEXT,
    ...firstStringArray(source?.boundary_text),
  ];

  return {
    proposal_type: "memory_reuse_attachment_proposal",
    status,
    task_summary: taskSummary,
    task_ref: nonEmptyString(source?.task_ref) ?? nonEmptyString(card.work_id) ?? preview.work_id,
    source_context: memoryReuseSourceContextFromUnknown(source?.source_context, defaultSourceContext),
    selected_memory_ids: selectedMemoryIds,
    selected_memory_count: selectedMemoryIds.length,
    why_selected: whySelected,
    reuse_boundary: reuseBoundary,
    selection_guidance: selectionGuidance.length > 0 ? selectionGuidance : buildDefaultMemoryReuseSelectionGuidance(status),
    fallback_brief: fallbackBrief,
    warnings,
    boundary_text: boundaryText,
  };
}

function runtimeEndpointNeedsConfirmation(label: string): boolean {
  const normalized = label.trim().toLowerCase();
  return (
    normalized === "provided by current augnes runtime" ||
    normalized === "provided by local operator" ||
    /^<[^>]+>$/.test(label.trim()) ||
    normalized.includes("provided-current-runtime")
  );
}

function buildStructuredHandoffJsonBlock(
  preview: Omit<CodexHandoffPreview, "copyable_handoff_text">
): CodexHandoffJsonBlock {
  return {
    schema: CODEX_HANDOFF_JSON_SCHEMA,
    packet_kind: "codex_handoff_preview",
    readiness_status: preview.readiness_status,
    readiness_reasons: preview.readiness_reasons,
    task_profile: preview.task_profile,
    runtime: {
      endpoint_label: preview.runtime_endpoint_label,
      requires_user_core_confirmation: runtimeEndpointNeedsConfirmation(preview.runtime_endpoint_label),
    },
    work: {
      scope: preview.scope,
      work_id: preview.work_id,
      title: preview.work_title,
      status: preview.work_status,
      next_action: preview.work_next_action,
      related_state_keys: preview.related_state_keys,
    },
    authorization: {
      evidence_recording: preview.evidence_recording,
      proof_only_closeout: preview.proof_only_closeout,
      browser_verification: preview.browser_verification,
    },
    expected_scope: {
      files: preview.expected_files,
      checks: preview.expected_checks,
    },
    forbidden_actions: preview.forbidden_actions,
    stop_conditions: preview.stop_conditions,
    constellation_context: preview.constellation_context,
    capability_class: preview.capability_class,
    default_boundary_summary: preview.default_boundary_summary,
    diagnostics_available: preview.diagnostics_available,
    authority_matrix_ref: preview.authority_matrix_ref,
    boundary_diagnostics: {
      diagnostics_available: true,
      authority_matrix_ref: preview.authority_matrix_ref,
    },
    authority_boundaries: preview.boundary_text,
    copy_packet: {
      preview_only: true,
      does_not_execute_codex: true,
      does_not_record_evidence: true,
      does_not_record_proof: true,
      does_not_mutate_state: true,
      does_not_merge: true,
    },
  };
}

function buildCopyableHandoffText(preview: Omit<CodexHandoffPreview, "copyable_handoff_text">): string {
  const runtimeForCommand =
    preview.runtime_endpoint_label === "provided by current Augnes runtime"
      ? "<provided-current-runtime>"
      : preview.runtime_endpoint_label;
  const structuredJson = JSON.stringify(buildStructuredHandoffJsonBlock(preview), null, 2);
  const constellationContext = preview.constellation_context;
  const constellationContextLines = constellationContext
    ? [
        `- Thesis: ${constellationContext.thesis}`,
        `- Selected candidate ID: ${formatPacketLine(constellationContext.selected_candidate_id)}`,
        `- Selected candidate label: ${formatPacketLine(constellationContext.selected_candidate_label)}`,
        `- Selection status: ${formatPacketLine(constellationContext.selection_status)}`,
        constellationContext.selection_fallback_reason
          ? `- Selection fallback: ${constellationContext.selection_fallback_reason}`
          : "- Selection fallback: none",
        `- Pointer-only evidence refs: ${constellationContext.pointer_evidence_ref_count}`,
        listForPacket(constellationContext.pointer_evidence_refs, "No pointer-only evidence refs attached."),
        `- Unresolved tensions: ${constellationContext.unresolved_tension_count}`,
        listForPacket(constellationContext.unresolved_tensions, "No unresolved tensions attached."),
        `- Advisory next action: ${formatPacketLine(constellationContext.advisory_next_action_summary, "No advisory next action summary attached.")}`,
        "- Source refs:",
        listForPacket(constellationContext.source_refs, "No source refs attached."),
      ]
    : [`- ${NO_CONSTELLATION_CONTEXT_TEXT}`];

  return [
    "Codex Handoff Preview",
    "This is a preview/copy packet, not an execution action.",
    "",
    "Readiness",
    `- Status: ${preview.readiness_status}`,
    listForPacket(preview.readiness_reasons, "Required fields are present."),
    "",
    "Current runtime",
    `- AUGNES_API_BASE_URL: ${preview.runtime_endpoint_label}`,
    `- CODEX_SCOPE: ${formatStatus(preview.scope)}`,
    `- CODEX_WORK_ID: ${formatStatus(preview.work_id)}`,
    "",
    "Copyable start command preview",
    `AUGNES_API_BASE_URL=${runtimeForCommand} CODEX_SCOPE=${formatStatus(preview.scope, "<provided-scope>")} CODEX_WORK_ID=${formatStatus(preview.work_id, "<provided-work-id>")} npm run codex:read-brief`,
    "",
    "Work item",
    `- Title: ${formatStatus(preview.work_title, "No work title listed.")}`,
    `- Status: ${formatStatus(preview.work_status, "No work status listed.")}`,
    `- Next action: ${formatStatus(preview.work_next_action, "No next action listed.")}`,
    `- Task profile: ${preview.task_profile}`,
    "",
    "Project Constellation context",
    ...constellationContextLines,
    "",
    "Authorization",
    `- Evidence recording: ${preview.evidence_recording}`,
    `- Proof-only closeout: ${preview.proof_only_closeout}`,
    `- Browser verification: ${preview.browser_verification}`,
    "",
    "Expected scope",
    "- Expected files:",
    listForPacket(preview.expected_files, "No expected files are listed in the work brief."),
    "- Expected checks:",
    listForPacket(preview.expected_checks, "No expected checks are listed in the work brief."),
    "- Related state keys:",
    listForPacket(preview.related_state_keys, "No related state keys are listed in the work brief."),
    "",
    "Stop conditions",
    listForPacket([...preview.stop_conditions], "No stop conditions listed."),
    "",
    "Capability boundary",
    `- Classes: ${preview.capability_class.join(", ")}`,
    `- Summary: ${preview.default_boundary_summary}`,
    `- Detailed diagnostics: available at ${preview.authority_matrix_ref} and structured boundary_diagnostics.`,
    "",
    "Structured JSON",
    CODEX_HANDOFF_JSON_BEGIN,
    structuredJson,
    CODEX_HANDOFF_JSON_END,
  ].join("\n");
}

function summarizeMemoryReuseAttachmentProposal(proposal: FinalHandoffMemoryReuseAttachmentProposal): string {
  if (proposal.status === "proposed") {
    return `Read-only Memory Reuse proposal attached with ${proposal.selected_memory_count} selected persisted memory item(s).`;
  }
  if (proposal.status === "no_match") {
    return "Memory Reuse proposal is explicit no_match; no persisted memory items were selected or invented.";
  }
  if (proposal.status === "not_configured") {
    return "Memory Reuse proposal is not configured for this payload.";
  }
  return "Memory Reuse proposal is unavailable for this payload.";
}

function memoryReuseProposalLines(proposal: FinalHandoffMemoryReuseAttachmentProposal): string[] {
  const lines = [
    `- Status: ${proposal.status}`,
    `- Task summary: ${proposal.task_summary}`,
    `- Task ref: ${formatPacketLine(proposal.task_ref)}`,
    `- Source context: ${proposal.source_context}`,
    `- Selected memory count: ${proposal.selected_memory_count}`,
    "- Selected memory IDs:",
    listForPacket(proposal.selected_memory_ids, "No persisted memory IDs selected."),
  ];

  if (proposal.why_selected.length > 0) {
    lines.push("- Why selected:", listForPacket(proposal.why_selected, "No why_selected entries attached."));
  } else {
    lines.push("- Why selected: not attached because no persisted memory items were selected.");
  }

  if (proposal.reuse_boundary.length > 0) {
    lines.push("- Reuse boundaries:", listForPacket(proposal.reuse_boundary, "No reuse boundaries attached."));
  } else {
    lines.push("- Reuse boundaries: not attached because no persisted memory items were selected.");
  }

  lines.push(
    `- Fallback brief: ${proposal.fallback_brief}`,
    "- Selection guidance:",
    listForPacket(proposal.selection_guidance, "No Memory Reuse selection guidance attached.")
  );

  if (proposal.warnings.length > 0) {
    lines.push("- Warnings:", listForPacket(proposal.warnings, "No Memory Reuse warnings attached."));
  } else {
    lines.push("- Warnings: none");
  }

  lines.push("- Boundary:", listForPacket([...proposal.boundary_text], "No Memory Reuse boundary text attached."));
  return lines;
}

function buildPrBodyChecklistPreview(): FinalHandoffPrBodyChecklistPreview {
  return {
    checklist_type: "pr_body_checklist_preview",
    status: "preview_only",
    generated: true,
    work_summary_required: true,
    user_facing_path_required: true,
    files_changed_required: true,
    verification_required: true,
    skipped_checks_required: true,
    authority_boundary_required: true,
    remaining_caveats_required: true,
    next_recommended_step_required: true,
    memory_reuse_summary_required: true,
    constellation_context_summary_required: true,
    final_handoff_preflight_summary_required: true,
    forbidden_claims: PR_BODY_CHECKLIST_DEFAULT_FORBIDDEN_CLAIMS,
    required_sections: PR_BODY_CHECKLIST_REQUIRED_SECTIONS,
    warnings: PR_BODY_CHECKLIST_WARNINGS,
    ...PR_BODY_CHECKLIST_BOUNDARY_COPY,
    boundary_text: [PR_BODY_CHECKLIST_BOUNDARY_COPY.default_boundary_summary],
  };
}

function summarizeMemoryReuseForCloseout(proposal: FinalHandoffMemoryReuseAttachmentProposal): string {
  if (proposal.status === "proposed") {
    return [
      `Status: proposed.`,
      `Selected memory IDs: ${proposal.selected_memory_ids.join(", ") || "none listed"}.`,
      "Placeholder: summarize how the listed persisted memory context was used, preserving reuse boundaries.",
    ].join(" ");
  }
  if (proposal.status === "no_match") {
    return "Status: no_match. No persisted memory IDs were selected. Placeholder: state that no automatic memory creation or persistence occurred.";
  }
  return `Status: ${proposal.status}. Placeholder: include the explicit fallback reason and state that no selected memory IDs were invented.`;
}

function summarizeConstellationForCloseout(context: WorkContractConstellationContext | null): string {
  if (!context) {
    return `${NO_CONSTELLATION_CONTEXT_TEXT} Placeholder: state that no selected Constellation candidate was attached.`;
  }
  return [
    "Status: attached.",
    `Selected candidate: ${formatPacketLine(context.selected_candidate_label)} (${formatPacketLine(context.selected_candidate_id)}).`,
    `Selection status: ${formatPacketLine(context.selection_status)}.`,
    "Placeholder: summarize how the selected advisory next action informed the work.",
  ].join(" ");
}

function buildCloseoutSkeletonText(sections: FinalHandoffCloseoutSkeleton["sections"]): string {
  return sections
    .map((section) => [`## ${section.heading}`, section.placeholder, `Source hint: ${section.source_hint}`].join("\n"))
    .join("\n\n");
}

function buildCloseoutSkeleton(
  packet: Omit<
    FinalCodexHandoffPacket,
    | "copyable_handoff_text"
    | "pr_body_checklist_preview"
    | "codex_pr_body_checklist"
    | "codex_closeout_skeleton"
    | "final_handoff_closeout_skeleton"
    | "codex_result_review_packet_preview"
    | "final_handoff_codex_result_review_packet"
    | "codex_pr_review_packet_preview"
    | "codex_result_paste_normalizer_preview"
    | "codex_result_normalizer_preview"
    | "normalized_codex_result_candidate"
    | "handoff_automation_slots"
  >,
  memoryReuseAttachmentProposal: FinalHandoffMemoryReuseAttachmentProposal
): FinalHandoffCloseoutSkeleton {
  const verificationCommands = packet.expected_checks.length > 0 ? packet.expected_checks : ["No expected checks are listed in the work brief."];
  const expectedFiles = packet.expected_files.length > 0 ? packet.expected_files.join(", ") : "No expected files are listed in the work brief.";
  const sections: FinalHandoffCloseoutSkeleton["sections"] = [
    {
      heading: "Summary",
      placeholder: `Placeholder: summarize the completed implementation for ${formatPacketLine(packet.work_title, "this work contract")}.`,
      source_hint: "Work Contract title, final packet summary, and actual implementation diff.",
    },
    {
      heading: "User-facing path added or changed",
      placeholder: "Placeholder: describe the operator-visible path after implementation. Do not invent host observations.",
      source_hint: "Final handoff packet plus verified widget/tool behavior after implementation.",
    },
    {
      heading: "Files changed",
      placeholder: `Placeholder: list actual changed files from git diff. Expected files from handoff: ${expectedFiles}.`,
      source_hint: "git diff --name-only after implementation.",
    },
    {
      heading: "Verification",
      placeholder: [
        "Placeholder: replace with actual commands run and observed results.",
        "Expected checks from handoff:",
        listForPacket(verificationCommands, "No expected checks are listed in the work brief."),
        "Do not claim they passed until they have actually run.",
      ].join("\n"),
      source_hint: "Commands executed by the Codex worker after implementation.",
    },
    {
      heading: "Skipped checks and caveats",
      placeholder: `Placeholder: list skipped checks with concrete reasons. ${packet.skipped_check_policy}`,
      source_hint: "Actual validation run and explicit skipped reasons.",
    },
    {
      heading: "Memory Reuse attachment status",
      placeholder: summarizeMemoryReuseForCloseout(memoryReuseAttachmentProposal),
      source_hint: "memory_reuse_attachment_proposal.",
    },
    {
      heading: "Project Constellation context status",
      placeholder: summarizeConstellationForCloseout(packet.constellation_context),
      source_hint: "work_contract_constellation_context or explicit absent fallback.",
    },
    {
      heading: "Final handoff preflight status",
      placeholder: "Status: pending_preflight. Placeholder: replace with final_handoff_preflight status and check summary after the packet is generated.",
      source_hint: "structuredContent.final_handoff_preflight.",
    },
    {
      heading: "Authority boundary statement",
      placeholder: [
        "Placeholder: include the scoped PR authority boundary statement.",
        "Boundary source:",
        listForPacket([...packet.authority_boundaries], "No authority boundary text listed."),
      ].join("\n"),
      source_hint: "Final packet authority boundaries and task prompt.",
    },
    {
      heading: "Remaining caveats",
      placeholder: "Placeholder: name remaining friction, limitations, or host/live checks that were skipped with reasons.",
      source_hint: "Implementation findings and skipped validation.",
    },
    {
      heading: "Next recommended step",
      placeholder: "Placeholder: state one bounded next step after review, without implying merge, publication, execution, or provider authority.",
      source_hint: "Task closeout and reviewer handoff.",
    },
  ];

  return {
    skeleton_type: "codex_closeout_skeleton",
    status: "preview_only",
    generated: true,
    copyable_closeout_text: buildCloseoutSkeletonText(sections),
    sections,
    required_sections: PR_BODY_CHECKLIST_REQUIRED_SECTIONS,
    verification_command_placeholders: verificationCommands,
    skipped_check_policy: FINAL_HANDOFF_SKIPPED_CHECK_POLICY,
    memory_reuse_attachment_status: memoryReuseAttachmentProposal.status,
    project_constellation_context_status: packet.constellation_context_status,
    final_handoff_preflight_status: "pending_preflight",
    warnings: PR_BODY_CHECKLIST_WARNINGS,
    boundary_text: [PR_BODY_CHECKLIST_BOUNDARY_COPY.default_boundary_summary],
  };
}

function includesText(haystack: string, needle: string | null | undefined): boolean {
  const normalizedNeedle = needle?.trim().toLowerCase();
  if (!normalizedNeedle) return false;
  return haystack.toLowerCase().includes(normalizedNeedle);
}

function stringFromUnknownResult(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (value && typeof value === "object") {
    try {
      return JSON.stringify(value);
    } catch {
      return "";
    }
  }
  return "";
}

function collectResultText(...values: unknown[]): string {
  return values
    .map(stringFromUnknownResult)
    .filter(Boolean)
    .join("\n");
}

function stringArrayFromResultObjects(value: unknown, fields: string[]): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (typeof item === "string") return item.trim();
      const record = objectFromUnknown(item);
      for (const field of fields) {
        const text = nonEmptyString(record[field]);
        if (text) return text;
      }
      return stringFromUnknownResult(item);
    })
    .filter(Boolean);
}

function firstRecordValue(record: Record<string, unknown>, fields: string[]): unknown {
  for (const field of fields) {
    if (Object.prototype.hasOwnProperty.call(record, field)) return record[field];
  }
  return undefined;
}

function stringValueFromRecord(record: Record<string, unknown>, fields: string[]): string | null {
  for (const field of fields) {
    const value = record[field];
    const text = nonEmptyString(value);
    if (text) return text;
    if (typeof value === "number" && Number.isFinite(value)) return String(value);
  }
  return null;
}

function stringArrayFromRecordFields(record: Record<string, unknown>, fields: string[]): string[] {
  return firstStringArray(...fields.map((field) => record[field]));
}

function normalizeSkippedCheckResultObjects(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (typeof item === "string") return item.trim();
      const record = objectFromUnknown(item);
      if (Object.keys(record).length === 0) return "";
      const label = stringValueFromRecord(record, ["check", "name", "command", "title"]);
      const detail = uniqueNonEmptyStrings([
        stringValueFromRecord(record, ["reason"]),
        stringValueFromRecord(record, ["summary"]),
        stringValueFromRecord(record, ["details", "detail"]),
      ]).filter((itemDetail) => itemDetail.toLowerCase() !== label?.toLowerCase());

      if (label && detail.length > 0) return `${label}: ${detail.join(" ")}`;
      if (label) return label;
      if (detail.length > 0) return detail.join(" ");
      return stringFromUnknownResult(item);
    })
    .filter(Boolean);
}

function normalizeResultStatus(value: string | null): CodexResultReviewSuggestedResultStatus | null {
  const text = value?.trim().toLowerCase().replace(/\s+/g, "_");
  if (!text) return null;
  if (["completed", "complete", "done", "success", "succeeded", "passed"].includes(text)) return "completed";
  if (["partial", "partially_completed", "incomplete", "needs_followup", "needs_follow_up"].includes(text)) return "partial";
  if (["blocked", "stuck", "waiting"].includes(text)) return "blocked";
  if (["failed", "failure", "error"].includes(text)) return "failed";
  if (["needs_review", "needs_human_review", "human_review", "review_needed"].includes(text)) return "needs_human_review";
  return null;
}

function inferResultStatusFromText(text: string): CodexResultReviewSuggestedResultStatus | null {
  const normalized = text.toLowerCase();
  if (/\b(blocked|waiting on|cannot proceed)\b/.test(normalized)) return "blocked";
  if (/\b(failed|failure|error)\b/.test(normalized)) return "failed";
  if (/\b(partial|incomplete|follow-?up needed)\b/.test(normalized)) return "partial";
  if (/\b(completed|complete|done|implemented)\b/.test(normalized)) return "completed";
  return null;
}

function skippedCheckHasConcreteReason(text: string): boolean {
  const normalized = text.trim();
  if (!normalized) return false;
  if (/\b(no skipped checks|none skipped|nothing skipped)\b/i.test(normalized)) return true;
  const hasReasonWord = /\b(because|reason|due to|unavailable|missing|blocked|not available|not applicable|without|no .{1,40}available)\b/i.test(normalized);
  return normalized.split(/\s+/).length >= 5 && (hasReasonWord || normalized.includes(":"));
}

function hasExplicitNone(text: string, kind: "skipped" | "caveats"): boolean {
  if (kind === "skipped") return /\b(no skipped checks|none skipped|nothing skipped|skipped checks:\s*none)\b/i.test(text);
  return /\b(no remaining caveats|no caveats remain|remaining caveats:\s*none|none remaining)\b/i.test(text);
}

function firstNonEmptyResultText(...values: unknown[]): string | null {
  for (const value of values) {
    const text = stringFromUnknownResult(value);
    if (text) return text;
  }
  return null;
}

function normalizeCodexResultPasteLine(line: string): string {
  let text = line.trim();
  text = text.replace(/^```[a-zA-Z0-9_-]*\s*/, "").replace(/```$/, "").trim();
  text = text.replace(/^\s*(?:[-*+]|\d+\.)\s+/, "").trim();
  text = text.replace(/^\[[ xX]\]\s+/, "").trim();
  const codeSpan = text.match(/^`([^`]+)`$/);
  if (codeSpan) text = codeSpan[1].trim();
  text = text.replace(/^`|`$/g, "").trim();
  return text.replace(/[;,.\s]+$/g, "").trim();
}

function codexResultPasteSectionKey(rawLine: string): { key: string; remainder: string | null } | null {
  const trimmed = rawLine.trim();
  if (!trimmed) return null;
  const markdownHeading = trimmed.match(/^#{1,6}\s+(.+?)\s*$/);
  const boldHeading = trimmed.match(/^\*\*(.+?)\*\*:?\s*$/);
  const colonHeading = trimmed.match(/^(?:[-*+]\s*)?(?:\*\*)?([A-Za-z][A-Za-z0-9 _/-]{1,80}?)(?:\*\*)?\s*:\s*(.*)$/);
  const plainHeading = /^[A-Za-z][A-Za-z0-9 _/-]{1,80}$/.test(trimmed) ? trimmed : "";
  const rawHeading = markdownHeading?.[1] ?? boldHeading?.[1] ?? colonHeading?.[1] ?? plainHeading;
  const normalized = rawHeading.trim().replace(/\s+/g, " ").toLowerCase();
  const remainder = colonHeading ? colonHeading[2].trim() || null : null;
  if (/^(files changed|changed files|files|implementation anchors changed)$/.test(normalized)) {
    return { key: "changed_files", remainder };
  }
  if (/^(verification|verification commands|checks|command results|commands and results|verification commands and results)$/.test(normalized)) {
    return { key: "verification", remainder };
  }
  if (/^(skipped checks|skipped validation)$/.test(normalized)) {
    return { key: "skipped_checks", remainder };
  }
  if (/^(remaining caveats|caveats|limitations)$/.test(normalized)) {
    return { key: "remaining_caveats", remainder };
  }
  if (/^(skipped checks and caveats|skipped validation and caveats|skipped checks \/ remaining caveats|caveats and skipped checks|limitations \/ skipped checks)$/.test(normalized)) {
    return { key: "skipped_checks_and_caveats", remainder };
  }
  if (/^(authority boundary statement|authority boundary|boundary statement)$/.test(normalized)) {
    return { key: "authority_boundary_statement", remainder };
  }
  if (/^(summary|user-facing path added or changed|memory reuse attachment status|project constellation context status|final handoff preflight status|next recommended step)$/.test(normalized)) {
    return { key: "__ignored", remainder };
  }
  return null;
}

function parseCodexResultPasteSections(rawText: string): Map<string, string[]> {
  const sections = new Map<string, string[]>();
  let currentKey: string | null = null;
  for (const rawLine of rawText.split(/\r?\n/)) {
    if (currentKey && /^\s*[-*+]\s+/.test(rawLine)) {
      sections.get(currentKey)?.push(rawLine);
      continue;
    }
    const heading = codexResultPasteSectionKey(rawLine);
    if (heading) {
      if (heading.key === "__ignored") {
        currentKey = null;
        continue;
      }
      currentKey = heading.key;
      if (!sections.has(currentKey)) sections.set(currentKey, []);
      if (heading.remainder) sections.get(currentKey)?.push(heading.remainder);
      continue;
    }
    if (currentKey) sections.get(currentKey)?.push(rawLine);
  }
  return sections;
}

function sectionLines(sections: Map<string, string[]>, keys: string[]): string[] {
  return keys.flatMap((key) => sections.get(key) ?? []);
}

function firstExplicitLineValue(rawText: string, labels: string[]): string | null {
  for (const label of labels) {
    const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const match = rawText.match(new RegExp(`^\\s*(?:[-*+]\\s*)?(?:\\*\\*)?${escaped}(?:\\*\\*)?\\s*(?::|=)\\s*(.+?)\\s*$`, "im"));
    if (match?.[1]) return normalizeCodexResultPasteLine(match[1]);
  }
  return null;
}

function extractCodexResultPastePrReference(rawText: string): { prUrl?: string; prNumber?: string } {
  const urlMatch = rawText.match(/https:\/\/github\.com\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+\/pull\/([0-9]+)/);
  const prUrl = urlMatch?.[0]?.replace(/[).,\]]+$/g, "");
  const numberFromUrl = urlMatch?.[1];
  const explicitNumber = rawText.match(/\b(?:PR|Pull request)\s*#?([0-9]+)\b/i)?.[1];
  return {
    ...(prUrl ? { prUrl } : {}),
    ...(numberFromUrl || explicitNumber ? { prNumber: numberFromUrl ?? explicitNumber } : {}),
  };
}

function fileLookingLine(line: string): string | null {
  let text = normalizeCodexResultPasteLine(line);
  if (!text) return null;
  const markdownLink = text.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
  if (markdownLink) text = markdownLink[2].trim();
  text = text.replace(/^(?:M|A|D|R|AM|MM)\s+/, "").trim();
  const beforeExplanation = text.split(/\s+-\s+/)[0]?.trim() ?? text;
  const token = beforeExplanation.split(/\s+/)[0]?.trim() ?? "";
  const candidate = token.replace(/^`|`$/g, "").replace(/[;,.)\]]+$/g, "");
  const hasPathSeparator = candidate.includes("/");
  const hasKnownFileExtension = /\.[A-Za-z0-9]{1,8}$/.test(candidate);
  const noSpaces = candidate.length > 0 && !/\s/.test(candidate);
  if (!noSpaces) return null;
  if (hasPathSeparator && /^[A-Za-z0-9_@./+-]+$/.test(candidate)) return candidate;
  if (hasKnownFileExtension && /^[A-Za-z0-9_.@+-]+$/.test(candidate)) return candidate;
  return null;
}

function shellLikeCommandLine(line: string): string | null {
  const text = normalizeCodexResultPasteLine(line).replace(/^(?:\$|>)\s*/, "").trim();
  if (!text) return null;
  const commandPattern =
    /^(?:(?:[A-Za-z_][A-Za-z0-9_]*=\S+)\s+)*(?:npm|node|git|pnpm|yarn|npx|tsx|tsc|curl|env|bash|sh|\.\/)\b/;
  return commandPattern.test(text) ? text : null;
}

function resultLikeLine(line: string): string | null {
  const text = normalizeCodexResultPasteLine(line);
  if (!text) return null;
  return /\b(PASS|FAIL|WARN|SKIPPED|passed|failed|warning|warn|skipped|succeeded|exit code 0|exit code 1)\b/.test(text)
    ? text
    : null;
}

function sectionEntryLines(lines: string[]): string[] {
  return lines
    .map(normalizeCodexResultPasteLine)
    .filter((line) => line.length > 0 && !codexResultPasteSectionKey(line));
}

function extractCodexResultPasteAuthorityStatement(sections: Map<string, string[]>): string | undefined {
  const lines = sectionEntryLines(sectionLines(sections, ["authority_boundary_statement"]));
  const statement = lines.join(" ").trim();
  return statement || undefined;
}

function hasExplicitNoneSkippedText(text: string): boolean {
  return /\b(no skipped checks|none skipped|nothing skipped|skipped checks:\s*none|skipped validation:\s*none)\b/i.test(text);
}

function hasExplicitNoneRemainingText(text: string): boolean {
  return /\b(no remaining caveats|no caveats remain|remaining caveats?:\s*none|none remaining|caveats?:\s*none|limitations?:\s*none)\b/i.test(text);
}

function combinedSectionLineClassificationReason(
  line: string,
  classification: CodexResultCombinedSectionLineClassification
): string {
  if (classification === "ignored_empty") return "Line is empty after normalization.";
  if (classification === "explicit_none_skipped") return "Line explicitly reports no skipped checks.";
  if (classification === "explicit_none_remaining") return "Line explicitly reports no remaining caveats.";
  if (classification === "skipped_check") return "Line strongly describes skipped or unavailable validation.";
  if (classification === "remaining_caveat") return "Line strongly describes residual caveat, limitation, or future work.";
  return `Combined skipped/caveat line needs human classification: ${line}`;
}

function classifyCodexResultCombinedSectionLine(line: string): CodexResultCombinedSectionLineClassification {
  const normalizedLine = normalizeCodexResultPasteLine(line);
  if (!normalizedLine) return "ignored_empty";
  if (hasExplicitNoneSkippedText(normalizedLine)) return "explicit_none_skipped";
  if (hasExplicitNoneRemainingText(normalizedLine)) return "explicit_none_remaining";

  const lower = normalizedLine.toLowerCase();
  const caveatClue =
    /\b(remaining friction|candidate only|needs human review|human review|manual|heuristic|limitation|caveat|future work|follow-?up needed|follow-?up remains|not production ready|known limitation|partial extraction|ambiguous lines?|stale connector|still manual|remains manual|residual|needs review)\b/.test(lower);
  const skippedSubjectClue =
    /\b(validation|check|test|browser|host|runtime|command|developer mode|mcp inspector|mobile|clipboard|read-back|proof closeout|codex_read_brief_runtime_unavailable|codex_work_id|tunnel|session)\b/.test(lower);
  const skippedActionClue =
    /\b(skipped|not run|was not run|unavailable|blocked|omitted|not verified|not rechecked|not observed|no tunnel|no trusted host|no live developer mode|no mcp inspector|no runtime available|missing codex_work_id|missing code.?work_id|code.?read_brief_runtime_unavailable)\b/.test(lower);

  if (skippedSubjectClue && skippedActionClue) return "skipped_check";
  if (caveatClue && !skippedActionClue) return "remaining_caveat";
  if (caveatClue && !skippedSubjectClue) return "remaining_caveat";
  return "ambiguous";
}

function splitCodexResultCombinedSectionEntries(entries: string[]): {
  skippedEntries: string[];
  caveatEntries: string[];
  ambiguousEntries: string[];
  hasExplicitNoneSkipped: boolean;
  hasExplicitNoneRemaining: boolean;
  warnings: string[];
} {
  const skippedEntries: string[] = [];
  const caveatEntries: string[] = [];
  const ambiguousEntries: string[] = [];
  let hasExplicitNoneSkipped = false;
  let hasExplicitNoneRemaining = false;
  const warnings: string[] = [];

  for (const rawEntry of entries) {
    const entry = normalizeCodexResultPasteLine(rawEntry);
    if (!entry) continue;

    const entryHasNoneSkipped = hasExplicitNoneSkippedText(entry) || /^(none|no skipped checks|none skipped)$/i.test(entry);
    const entryHasNoneRemaining = hasExplicitNoneRemainingText(entry) || /^(none remaining|no remaining caveats|no caveats remain)$/i.test(entry);
    if (entryHasNoneSkipped) hasExplicitNoneSkipped = true;
    if (entryHasNoneRemaining) hasExplicitNoneRemaining = true;
    if (entryHasNoneSkipped || entryHasNoneRemaining) continue;

    const classification = classifyCodexResultCombinedSectionLine(entry);
    if (classification === "skipped_check") {
      skippedEntries.push(entry);
    } else if (classification === "remaining_caveat") {
      caveatEntries.push(entry);
    } else if (classification === "ambiguous") {
      ambiguousEntries.push(entry);
      warnings.push(combinedSectionLineClassificationReason(entry, classification));
    }
  }

  return {
    skippedEntries: uniqueNonEmptyStrings(skippedEntries),
    caveatEntries: uniqueNonEmptyStrings(caveatEntries),
    ambiguousEntries: uniqueNonEmptyStrings(ambiguousEntries),
    hasExplicitNoneSkipped,
    hasExplicitNoneRemaining,
    warnings: uniqueNonEmptyStrings(warnings),
  };
}

function extractCodexResultCombinedSectionAmbiguity(rawText: string): {
  ambiguousEntries: string[];
  warnings: string[];
} {
  const sections = parseCodexResultPasteSections(rawText);
  const combinedSectionSplit = splitCodexResultCombinedSectionEntries(
    sectionEntryLines(sectionLines(sections, ["skipped_checks_and_caveats"]))
  );
  return {
    ambiguousEntries: combinedSectionSplit.ambiguousEntries,
    warnings: combinedSectionSplit.warnings,
  };
}

type CodexResultFieldFirstLabel =
  | "summary"
  | "work_id"
  | "scope"
  | "result_status"
  | "pr_url"
  | "pr_number"
  | "live_host_observation"
  | "proof_evidence_rows_written"
  | "event_rows_created_or_mutated"
  | "work_status_changed"
  | "state_committed_or_rejected"
  | "changed_files"
  | "verification_commands"
  | "verification_results"
  | "skipped_checks"
  | "remaining_caveats"
  | "ambiguous_combined_section_lines"
  | "authority_boundary_statement"
  | "next_recommended_step";

type CodexResultFieldFirstExtraction = {
  candidate: NormalizedCodexResultCandidate;
  context: CodexResultFieldFirstReportContext;
  ambiguous_combined_section_lines: string[];
};

const CODEX_RESULT_EMPTY_FIELD_FIRST_CONTEXT: CodexResultFieldFirstReportContext = {
  live_host_observation: null,
  proof_evidence_rows_written: null,
  event_rows_created_or_mutated: null,
  work_status_changed: null,
  state_committed_or_rejected: null,
  next_recommended_step: null,
};

const CODEX_RESULT_FIELD_FIRST_LABELS = new Map<string, CodexResultFieldFirstLabel>([
  ["summary", "summary"],
  ["work_id", "work_id"],
  ["scope", "scope"],
  ["result_status", "result_status"],
  ["pr_url", "pr_url"],
  ["pr_number", "pr_number"],
  ["live_host_observation", "live_host_observation"],
  ["proof_evidence_rows_written", "proof_evidence_rows_written"],
  ["event_rows_created_or_mutated", "event_rows_created_or_mutated"],
  ["work_status_changed", "work_status_changed"],
  ["state_committed_or_rejected", "state_committed_or_rejected"],
  ["changed_files", "changed_files"],
  ["verification_commands", "verification_commands"],
  ["verification_results", "verification_results"],
  ["skipped_checks", "skipped_checks"],
  ["remaining_caveats", "remaining_caveats"],
  ["ambiguous_combined_section_lines", "ambiguous_combined_section_lines"],
  ["authority_boundary_statement", "authority_boundary_statement"],
  ["next_recommended_step", "next_recommended_step"],
]);

function emptyCodexResultFieldFirstContext(): CodexResultFieldFirstReportContext {
  return { ...CODEX_RESULT_EMPTY_FIELD_FIRST_CONTEXT };
}

function normalizeCodexResultFieldFirstTextValue(line: string): string {
  let text = line.trim();
  text = text.replace(/^```[a-zA-Z0-9_-]*\s*/, "").replace(/```$/, "").trim();
  text = text.replace(/^\s*(?:[-*+]|\d+\.)\s+/, "").trim();
  text = text.replace(/^\[[ xX]\]\s+/, "").trim();
  const codeSpan = text.match(/^`([^`]+)`$/);
  if (codeSpan) text = codeSpan[1].trim();
  return text.replace(/^`|`$/g, "").trim();
}

function codexResultFieldFirstLineKey(rawLine: string): { key: CodexResultFieldFirstLabel; remainder: string | null } | null {
  const trimmed = rawLine.trim();
  if (!trimmed) return null;
  const match = trimmed.match(/^(?:[-*+]\s*)?(?:\*\*)?([A-Za-z][A-Za-z0-9_]{1,80})(?:\*\*)?\s*:\s*(.*)$/);
  if (!match) return null;
  if (match[1].trim() !== match[1].trim().toLowerCase()) return null;
  const key = CODEX_RESULT_FIELD_FIRST_LABELS.get(match[1].trim().toLowerCase());
  if (!key) return null;
  return { key, remainder: match[2].trim() || null };
}

function codexResultStandaloneLabelLine(rawLine: string): boolean {
  const trimmed = rawLine.trim();
  if (!trimmed || /^[-*+]\s+/.test(trimmed)) return false;
  return /^(?:\*\*)?[A-Za-z][A-Za-z0-9 _/-]{1,80}(?:\*\*)?\s*:\s+/.test(trimmed);
}

function parseCodexResultFieldFirstLabels(rawText: string): Map<CodexResultFieldFirstLabel, string[]> {
  const fields = new Map<CodexResultFieldFirstLabel, string[]>();
  let currentKey: CodexResultFieldFirstLabel | null = null;

  for (const rawLine of rawText.split(/\r?\n/)) {
    const fieldFirstLine = codexResultFieldFirstLineKey(rawLine);
    if (fieldFirstLine) {
      currentKey = fieldFirstLine.key;
      if (!fields.has(currentKey)) fields.set(currentKey, []);
      if (fieldFirstLine.remainder) fields.get(currentKey)?.push(fieldFirstLine.remainder);
      continue;
    }

    if (codexResultStandaloneLabelLine(rawLine)) {
      currentKey = null;
      continue;
    }

    const sectionKey = codexResultPasteSectionKey(rawLine);
    if (sectionKey) {
      currentKey = null;
      continue;
    }

    if (currentKey) fields.get(currentKey)?.push(rawLine);
  }

  return fields;
}

function fieldFirstScalarValue(fields: Map<CodexResultFieldFirstLabel, string[]>, key: CodexResultFieldFirstLabel): string | null {
  const entries = fields.get(key) ?? [];
  const value = entries
    .map(normalizeCodexResultFieldFirstTextValue)
    .filter(Boolean)
    .join(" ")
    .trim();
  return value || null;
}

function parseCodexResultFieldFirstList(
  fields: Map<CodexResultFieldFirstLabel, string[]>,
  key: CodexResultFieldFirstLabel,
  options: { splitCommas?: boolean } = {}
): string[] {
  const entries = fields.get(key) ?? [];
  const values = entries.flatMap((entry) => {
    const text = normalizeCodexResultFieldFirstTextValue(entry);
    if (!text) return [];
    if (options.splitCommas) return text.split(",").map((item) => item.trim()).filter(Boolean);
    return [text];
  });
  return uniqueNonEmptyStrings(values);
}

function parseCodexResultFieldFirstPrUrl(value: string | null): string | undefined {
  if (!value || /^(?:not opened|none|not applicable|n\/a|na|null)$/i.test(value)) return undefined;
  const match = value.match(/https:\/\/github\.com\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+\/pull\/[0-9]+/);
  return match?.[0]?.replace(/[).,\]]+$/g, "");
}

function parseCodexResultFieldFirstPrNumber(value: string | null): string | undefined {
  if (!value || /^(?:not opened|none|not applicable|n\/a|na|null)$/i.test(value)) return undefined;
  const match = value.trim().match(/^#?([0-9]+)$/);
  return match?.[1];
}

function parseCodexResultFieldFirstNoneAwareList(
  fields: Map<CodexResultFieldFirstLabel, string[]>,
  key: "skipped_checks" | "remaining_caveats" | "ambiguous_combined_section_lines"
): string[] {
  const entries = parseCodexResultFieldFirstList(fields, key, { splitCommas: false });
  const combinedText = entries.join("\n");
  if (key === "skipped_checks" && hasExplicitNoneSkippedText(combinedText)) return ["No skipped checks."];
  if (key === "remaining_caveats" && hasExplicitNoneRemainingText(combinedText)) return ["No remaining caveats."];
  if (key === "ambiguous_combined_section_lines" && /\b(no ambiguous combined-section lines|no ambiguous combined section lines|none)\b/i.test(combinedText)) {
    return [];
  }
  return uniqueNonEmptyStrings(entries.map(normalizeCodexResultPasteLine));
}

function extractCodexResultFieldFirstCandidate(rawText: string): CodexResultFieldFirstExtraction {
  const fields = parseCodexResultFieldFirstLabels(rawText);
  const candidate: NormalizedCodexResultCandidate = {};
  const context = emptyCodexResultFieldFirstContext();

  const workId = fieldFirstScalarValue(fields, "work_id");
  const scope = fieldFirstScalarValue(fields, "scope");
  const resultStatus = normalizeResultStatus(fieldFirstScalarValue(fields, "result_status"));
  const prUrl = parseCodexResultFieldFirstPrUrl(fieldFirstScalarValue(fields, "pr_url"));
  const prNumber = parseCodexResultFieldFirstPrNumber(fieldFirstScalarValue(fields, "pr_number"));
  const changedFiles = uniqueNonEmptyStrings(
    parseCodexResultFieldFirstList(fields, "changed_files", { splitCommas: true })
      .map((line) => fileLookingLine(line) ?? normalizeCodexResultPasteLine(line))
  );
  const verificationCommands = parseCodexResultFieldFirstList(fields, "verification_commands", { splitCommas: false });
  const verificationResults = parseCodexResultFieldFirstList(fields, "verification_results", { splitCommas: false });
  const skippedChecks = parseCodexResultFieldFirstNoneAwareList(fields, "skipped_checks");
  const remainingCaveats = parseCodexResultFieldFirstNoneAwareList(fields, "remaining_caveats");
  const ambiguousEntries = parseCodexResultFieldFirstNoneAwareList(fields, "ambiguous_combined_section_lines");
  const authorityBoundaryStatement = fieldFirstScalarValue(fields, "authority_boundary_statement");

  if (workId) candidate.work_id = workId;
  if (scope) candidate.scope = scope;
  if (resultStatus) candidate.result_status = resultStatus;
  if (prUrl) candidate.pr_url = prUrl;
  if (prNumber) candidate.pr_number = prNumber;
  if (changedFiles.length) candidate.changed_files = changedFiles;
  if (verificationCommands.length) candidate.verification_commands = verificationCommands;
  if (verificationResults.length) candidate.verification_results = verificationResults;
  if (skippedChecks.length) candidate.skipped_checks = skippedChecks;
  if (remainingCaveats.length) candidate.remaining_caveats = remainingCaveats;
  if (authorityBoundaryStatement) candidate.authority_boundary_statement = authorityBoundaryStatement;

  context.live_host_observation = fieldFirstScalarValue(fields, "live_host_observation");
  context.proof_evidence_rows_written = fieldFirstScalarValue(fields, "proof_evidence_rows_written");
  context.event_rows_created_or_mutated = fieldFirstScalarValue(fields, "event_rows_created_or_mutated");
  context.work_status_changed = fieldFirstScalarValue(fields, "work_status_changed");
  context.state_committed_or_rejected = fieldFirstScalarValue(fields, "state_committed_or_rejected");
  context.next_recommended_step = fieldFirstScalarValue(fields, "next_recommended_step");

  return {
    candidate,
    context,
    ambiguous_combined_section_lines: ambiguousEntries,
  };
}

function mergeCodexResultFieldFirstCandidate(
  sectionCandidate: NormalizedCodexResultCandidate,
  fieldFirstCandidate: NormalizedCodexResultCandidate
): { candidate: NormalizedCodexResultCandidate; warnings: string[] } {
  const candidate: NormalizedCodexResultCandidate = { ...sectionCandidate };
  const warnings: string[] = [];
  for (const [field, fieldFirstValue] of Object.entries(fieldFirstCandidate) as Array<[keyof NormalizedCodexResultCandidate, NormalizedCodexResultCandidate[keyof NormalizedCodexResultCandidate]]>) {
    if (Array.isArray(fieldFirstValue) ? fieldFirstValue.length === 0 : !fieldFirstValue) continue;
    const sectionValue = candidate[field];
    if (
      sectionValue &&
      normalizeCodexResultCandidateValue(sectionValue) !== normalizeCodexResultCandidateValue(fieldFirstValue)
    ) {
      warnings.push(`Field-first ${field} was used; section-heading extraction suggested a different value.`);
    }
    (candidate as Record<string, unknown>)[field] = fieldFirstValue;
  }
  return { candidate, warnings: uniqueNonEmptyStrings(warnings) };
}

function extractCodexResultPasteSectionCandidate(rawText: string): NormalizedCodexResultCandidate {
  const trimmedText = rawText.trim();
  const sections = parseCodexResultPasteSections(trimmedText);
  const changedFiles = uniqueNonEmptyStrings(
    sectionLines(sections, ["changed_files"])
      .map(fileLookingLine)
      .filter((item): item is string => Boolean(item))
  );
  const verificationLines = sectionLines(sections, ["verification"]);
  const verificationCommands = uniqueNonEmptyStrings(
    verificationLines
      .map(shellLikeCommandLine)
      .filter((item): item is string => Boolean(item))
  );
  const verificationResults = uniqueNonEmptyStrings(
    verificationLines
      .map(resultLikeLine)
      .filter((item): item is string => Boolean(item))
  );
  const combinedSectionSplit = splitCodexResultCombinedSectionEntries(
    sectionEntryLines(sectionLines(sections, ["skipped_checks_and_caveats"]))
  );
  const skippedSectionEntries = [
    ...sectionEntryLines(sectionLines(sections, ["skipped_checks"])),
    ...combinedSectionSplit.skippedEntries,
  ];
  const caveatSectionEntries = [
    ...sectionEntryLines(sectionLines(sections, ["remaining_caveats"])),
    ...combinedSectionSplit.caveatEntries,
  ];
  const skippedSectionText = skippedSectionEntries.join("\n");
  const caveatSectionText = caveatSectionEntries.join("\n");
  const skippedChecks = combinedSectionSplit.hasExplicitNoneSkipped ||
    skippedSectionEntries.some((line) => /^(none|no skipped checks|none skipped)$/i.test(line)) ||
    hasExplicitNone(skippedSectionText || trimmedText, "skipped")
    ? ["No skipped checks."]
    : skippedSectionEntries;
  const remainingCaveats = combinedSectionSplit.hasExplicitNoneRemaining ||
    caveatSectionEntries.some((line) => /^(none|no remaining caveats|none remaining)$/i.test(line)) ||
    hasExplicitNone(caveatSectionText || trimmedText, "caveats")
    ? ["No remaining caveats."]
    : caveatSectionEntries;
  const prReference = extractCodexResultPastePrReference(trimmedText);
  const explicitStatus = firstExplicitLineValue(trimmedText, ["result_status", "Result status", "Status"]);
  const normalizedStatus = normalizeResultStatus(explicitStatus) ?? inferResultStatusFromText(trimmedText) ?? undefined;
  const authorityBoundaryStatement = extractCodexResultPasteAuthorityStatement(sections);
  const candidate: NormalizedCodexResultCandidate = {
    final_report_text: trimmedText,
  };
  const workId = firstExplicitLineValue(trimmedText, ["Work ID", "work_id", "CODEX_WORK_ID"]);
  const scope = firstExplicitLineValue(trimmedText, ["Scope", "scope", "CODEX_SCOPE"]);
  if (workId) candidate.work_id = workId;
  if (scope) candidate.scope = scope;
  if (prReference.prUrl) candidate.pr_url = prReference.prUrl;
  if (prReference.prNumber) candidate.pr_number = prReference.prNumber;
  if (changedFiles.length) candidate.changed_files = changedFiles;
  if (verificationCommands.length) candidate.verification_commands = verificationCommands;
  if (verificationResults.length) candidate.verification_results = verificationResults;
  if (skippedChecks.length) candidate.skipped_checks = skippedChecks;
  if (remainingCaveats.length) candidate.remaining_caveats = remainingCaveats;
  if (authorityBoundaryStatement) candidate.authority_boundary_statement = authorityBoundaryStatement;
  if (normalizedStatus) candidate.result_status = normalizedStatus;
  return candidate;
}

function extractCodexResultPasteCandidateWithFieldFirst(rawText: string): {
  candidate: NormalizedCodexResultCandidate;
  fieldFirstContext: CodexResultFieldFirstReportContext;
  fieldFirstAmbiguousLines: string[];
  fieldFirstWarnings: string[];
} {
  const sectionCandidate = extractCodexResultPasteSectionCandidate(rawText);
  const fieldFirstExtraction = extractCodexResultFieldFirstCandidate(rawText);
  const mergeResult = mergeCodexResultFieldFirstCandidate(sectionCandidate, fieldFirstExtraction.candidate);
  return {
    candidate: mergeResult.candidate,
    fieldFirstContext: fieldFirstExtraction.context,
    fieldFirstAmbiguousLines: fieldFirstExtraction.ambiguous_combined_section_lines,
    fieldFirstWarnings: mergeResult.warnings,
  };
}

function extractCodexResultPasteCandidate(rawText: string): NormalizedCodexResultCandidate {
  return extractCodexResultPasteCandidateWithFieldFirst(rawText).candidate;
}

function detectedCodexResultCandidateFields(candidate: NormalizedCodexResultCandidate): string[] {
  return uniqueNonEmptyStrings(
    Object.entries(candidate)
      .filter(([, value]) => Array.isArray(value) ? value.length > 0 : Boolean(value))
      .map(([field]) => field)
  );
}

function normalizeCodexResultCandidateValue(value: unknown): string {
  if (Array.isArray(value)) return JSON.stringify(uniqueNonEmptyStrings(value.map(stringFromUnknownResult)).sort());
  return stringFromUnknownResult(value).toLowerCase();
}

function structuredCodexResultFieldValue(record: Record<string, unknown>, aliases: string[]): unknown {
  for (const alias of aliases) {
    const value = record[alias];
    if (Array.isArray(value) && value.length > 0) return value;
    if (nonEmptyString(value)) return value;
    if (typeof value === "number" && Number.isFinite(value)) return value;
  }
  return undefined;
}

export function mergeCodexResultInputWithPasteCandidate(
  structuredInput: Record<string, unknown> | null | undefined,
  candidate: NormalizedCodexResultCandidate
): CodexResultPasteMergeResult {
  const structuredRecord = objectFromUnknown(structuredInput);
  const hasStructuredInput = Object.keys(structuredRecord).length > 0;
  const mergedRecord: Record<string, unknown> = hasStructuredInput ? { ...structuredRecord } : {};
  const filledFields: string[] = [];
  const structuredFieldsPreserved: string[] = [];
  const conflictWarnings: string[] = [];
  const fieldAliases: Array<{ canonical: keyof NormalizedCodexResultCandidate; aliases: string[] }> = [
    { canonical: "work_id", aliases: ["work_id", "workId"] },
    { canonical: "scope", aliases: ["scope"] },
    {
      canonical: "final_report_text",
      aliases: [
        "final_report_text",
        "finalReportText",
        "codex_final_report_text",
        "final_report_summary",
        "summary",
        ...CODEX_RESULT_STRUCTURED_RAW_TEXT_ALIASES,
      ],
    },
    { canonical: "pr_url", aliases: ["pr_url", "prUrl"] },
    { canonical: "pr_number", aliases: ["pr_number", "prNumber"] },
    { canonical: "changed_files", aliases: ["changed_files", "changedFiles"] },
    { canonical: "verification_commands", aliases: ["verification_commands", "verificationCommands"] },
    { canonical: "verification_results", aliases: ["verification_results", "verificationResults"] },
    { canonical: "skipped_checks", aliases: ["skipped_checks", "skippedChecks"] },
    { canonical: "remaining_caveats", aliases: ["remaining_caveats", "remainingCaveats"] },
    { canonical: "authority_boundary_statement", aliases: ["authority_boundary_statement", "authorityBoundaryStatement"] },
    { canonical: "result_status", aliases: ["result_status", "resultStatus"] },
  ];

  for (const { canonical, aliases } of fieldAliases) {
    const candidateValue = candidate[canonical];
    if (Array.isArray(candidateValue) ? candidateValue.length === 0 : !candidateValue) continue;
    const structuredValue = structuredCodexResultFieldValue(structuredRecord, aliases);
    if (structuredValue === undefined) {
      mergedRecord[canonical] = candidateValue;
      filledFields.push(canonical);
      continue;
    }
    structuredFieldsPreserved.push(canonical);
    if (normalizeCodexResultCandidateValue(structuredValue) !== normalizeCodexResultCandidateValue(candidateValue)) {
      conflictWarnings.push(`Structured ${canonical} was preserved; pasted text suggested a different value.`);
    }
  }

  const hasMergedInput = Object.keys(mergedRecord).length > 0;
  return {
    mergedInput: hasMergedInput ? (mergedRecord as CodexResultImportInput) : null,
    filledFields: uniqueNonEmptyStrings(filledFields),
    structuredFieldsPreserved: uniqueNonEmptyStrings(structuredFieldsPreserved),
    conflictWarnings: uniqueNonEmptyStrings(conflictWarnings),
  };
}

export function normalizeCodexResultPasteInput(input: {
  structuredInput?: Record<string, unknown> | null;
  topLevelPasteText?: unknown;
}): {
  rawText: string;
  source: CodexResultPasteNormalizerSource;
  conflictWarnings: string[];
} {
  const structuredRecord = objectFromUnknown(input.structuredInput);
  const structuredRawText = firstNonEmptyResultText(
    ...CODEX_RESULT_STRUCTURED_RAW_TEXT_ALIASES.map((field) => structuredRecord[field])
  );
  const topLevelPasteText = firstNonEmptyResultText(input.topLevelPasteText);
  const conflictWarnings =
    topLevelPasteText && structuredRawText && topLevelPasteText !== structuredRawText
      ? ["Top-level paste text and structured-input raw text differ; top-level paste text was used for extraction."]
      : [];
  const rawText = topLevelPasteText ?? structuredRawText ?? "";
  const source: CodexResultPasteNormalizerSource =
    topLevelPasteText && structuredRawText
      ? "structured_input_and_paste"
      : topLevelPasteText
        ? "top_level_paste"
        : structuredRawText
          ? "structured_input_raw_text"
          : "not_provided";
  return { rawText: rawText.trim(), source, conflictWarnings };
}

export function buildCodexResultPasteNormalizerPreview(input: {
  structuredInput?: Record<string, unknown> | null;
  topLevelPasteText?: unknown;
}): CodexResultPasteNormalizerPreview {
  const normalizedInput = normalizeCodexResultPasteInput(input);
  if (!normalizedInput.rawText) {
    const mergeResult = mergeCodexResultInputWithPasteCandidate(input.structuredInput, {});
    return {
      normalizer_type: "codex_result_paste_normalizer_preview",
      status: "not_provided",
      source: "not_provided",
      raw_text_length: 0,
      detected_fields: [],
      filled_fields: mergeResult.filledFields,
      structured_fields_preserved: mergeResult.structuredFieldsPreserved,
      conflict_warnings: [...normalizedInput.conflictWarnings, ...mergeResult.conflictWarnings],
      extraction_warnings: ["No raw Codex result paste text was provided."],
      ambiguous_combined_section_lines: [],
      field_first_report_context: emptyCodexResultFieldFirstContext(),
      candidate: {},
      ...CODEX_RESULT_PASTE_NORMALIZER_BOUNDARY_COPY,
      boundary_text: [CODEX_RESULT_PASTE_NORMALIZER_BOUNDARY_COPY.default_boundary_summary],
    };
  }

  const fieldFirstCandidateExtraction = extractCodexResultPasteCandidateWithFieldFirst(normalizedInput.rawText);
  const candidate = fieldFirstCandidateExtraction.candidate;
  const combinedSectionAmbiguity = extractCodexResultCombinedSectionAmbiguity(normalizedInput.rawText);
  const ambiguousCombinedSectionLines = uniqueNonEmptyStrings([
    ...combinedSectionAmbiguity.ambiguousEntries,
    ...fieldFirstCandidateExtraction.fieldFirstAmbiguousLines,
  ]);
  const hasFieldFirstContext = Object.values(fieldFirstCandidateExtraction.fieldFirstContext).some(Boolean);
  const detectedFields = uniqueNonEmptyStrings([
    ...detectedCodexResultCandidateFields(candidate),
    ...(ambiguousCombinedSectionLines.length ? ["ambiguous_combined_section_lines"] : []),
    ...(hasFieldFirstContext ? ["field_first_report_context"] : []),
  ]);
  const mergeResult = mergeCodexResultInputWithPasteCandidate(input.structuredInput, candidate);
  const candidateHasCoreReviewFields = Boolean(
    candidate.final_report_text &&
      candidate.changed_files?.length &&
      (candidate.verification_commands?.length || candidate.verification_results?.length) &&
      candidate.skipped_checks?.length &&
      candidate.remaining_caveats?.length &&
      candidate.authority_boundary_statement
  );
  const missingWarnings = [
    ...(candidate.work_id ? [] : ["No explicit Work ID was extracted from the paste."]),
    ...(candidate.scope ? [] : ["No explicit scope was extracted from the paste."]),
    ...(candidate.changed_files?.length ? [] : ["No explicit changed-files list was extracted from a supported heading."]),
    ...(candidate.verification_commands?.length || candidate.verification_results?.length
      ? []
      : ["No explicit verification command/result lines were extracted from a supported heading."]),
    ...(candidate.skipped_checks?.length ? [] : ["No skipped-check lines or explicit none-skipped statement were extracted."]),
    ...(candidate.remaining_caveats?.length ? [] : ["No caveat lines or explicit none-remaining statement were extracted."]),
    ...(candidate.authority_boundary_statement ? [] : ["No explicit authority boundary statement section was extracted."]),
  ];
  const allConflictWarnings = uniqueNonEmptyStrings([...normalizedInput.conflictWarnings, ...mergeResult.conflictWarnings]);
  const combinedAmbiguousLineSet = new Set(combinedSectionAmbiguity.ambiguousEntries);
  const fieldFirstAmbiguityWarnings = fieldFirstCandidateExtraction.fieldFirstAmbiguousLines
    .filter((line) => !combinedAmbiguousLineSet.has(line))
    .map((line) => `Field-first ambiguous_combined_section_lines needs human classification: ${line}`);
  const status: CodexResultPasteNormalizerStatus =
    normalizedInput.conflictWarnings.length > 0 || ambiguousCombinedSectionLines.length > 0
      ? "ambiguous"
      : candidateHasCoreReviewFields
        ? "candidate_ready"
        : "partial_candidate";

  return {
    normalizer_type: "codex_result_paste_normalizer_preview",
    status,
    source: normalizedInput.source,
    raw_text_length: normalizedInput.rawText.length,
    detected_fields: detectedFields,
    filled_fields: mergeResult.filledFields,
    structured_fields_preserved: mergeResult.structuredFieldsPreserved,
    conflict_warnings: allConflictWarnings,
    extraction_warnings: uniqueNonEmptyStrings([
      ...missingWarnings,
      ...combinedSectionAmbiguity.warnings,
      ...fieldFirstCandidateExtraction.fieldFirstWarnings,
      ...fieldFirstAmbiguityWarnings,
    ]),
    ambiguous_combined_section_lines: ambiguousCombinedSectionLines,
    field_first_report_context: fieldFirstCandidateExtraction.fieldFirstContext,
    candidate,
    ...CODEX_RESULT_PASTE_NORMALIZER_BOUNDARY_COPY,
    boundary_text: [CODEX_RESULT_PASTE_NORMALIZER_BOUNDARY_COPY.default_boundary_summary],
  };
}

function resultReviewPayloadFromBrief(brief: WorkBrief, resultInput?: CodexResultImportInput | null): {
  source: Record<string, unknown>;
  finalReportText: string;
  resultText: string;
  resultSource: CodexResultReviewSource;
  resultWorkId: string | null;
  resultScope: string | null;
  prUrl: string | null;
  prNumber: string | null;
  reportedResultStatus: string | null;
  suggestedResultStatus: CodexResultReviewSuggestedResultStatus | null;
  authorityBoundaryStatement: string | null;
  providedInputFields: string[];
  missingInputFields: string[];
  changedFiles: string[];
  verificationCommands: string[];
  verificationResults: string[];
  skippedChecks: string[];
  skippedCheckReasonIssues: string[];
  remainingCaveats: string[];
} {
  const briefRecord = brief as WorkBrief & Record<string, unknown>;
  const codexHandoff = objectFromUnknown(brief.codex_handoff);
  const inputRecord = objectFromUnknown(resultInput);
  const hasUserInput = Object.keys(inputRecord).length > 0;
  const prMetadata = objectFromUnknown(briefRecord.codex_pr_metadata ?? codexHandoff.codex_pr_metadata);
  const prDiffSummary = objectFromUnknown(briefRecord.codex_pr_diff_summary ?? codexHandoff.codex_pr_diff_summary);
  const inputPrNumber = stringValueFromRecord(inputRecord, ["pr_number", "prNumber"]);
  const inputVerificationValue = firstRecordValue(inputRecord, ["verification_results", "verificationResults"]);
  const inputSkippedValue = firstRecordValue(inputRecord, ["skipped_checks", "skippedChecks"]);
  const source = {
    codex_result_input: hasUserInput ? inputRecord : undefined,
    codex_result_summary: briefRecord.codex_result_summary ?? codexHandoff.codex_result_summary,
    codex_result_report: briefRecord.codex_result_report ?? codexHandoff.codex_result_report,
    codex_pr_metadata: briefRecord.codex_pr_metadata ?? codexHandoff.codex_pr_metadata,
    codex_pr_diff_summary: briefRecord.codex_pr_diff_summary ?? codexHandoff.codex_pr_diff_summary,
    codex_authority_boundary_statement:
      briefRecord.codex_authority_boundary_statement ?? codexHandoff.codex_authority_boundary_statement,
    codex_verification_results: briefRecord.codex_verification_results ?? codexHandoff.codex_verification_results,
    codex_verification_commands: briefRecord.codex_verification_commands ?? codexHandoff.codex_verification_commands,
    codex_changed_files: briefRecord.codex_changed_files ?? codexHandoff.codex_changed_files,
    codex_skipped_checks: briefRecord.codex_skipped_checks ?? codexHandoff.codex_skipped_checks,
    codex_remaining_caveats: briefRecord.codex_remaining_caveats ?? codexHandoff.codex_remaining_caveats,
    codex_result_status: briefRecord.codex_result_status ?? codexHandoff.codex_result_status,
  };
  const finalReportText = collectResultText(
    stringValueFromRecord(inputRecord, [
      "final_report_text",
      "finalReportText",
      "codex_final_report_text",
      "final_report_summary",
      "summary",
      ...CODEX_RESULT_STRUCTURED_RAW_TEXT_ALIASES,
    ]),
    source.codex_result_summary,
    source.codex_result_report
  );
  const changedFiles = firstStringArray(
    stringArrayFromRecordFields(inputRecord, ["changed_files", "changedFiles"]),
    source.codex_changed_files,
    prDiffSummary.changed_files,
    prMetadata.changed_files,
    prMetadata.files_changed
  );
  const verificationCommands = firstStringArray(
    stringArrayFromRecordFields(inputRecord, ["verification_commands", "verificationCommands"]),
    source.codex_verification_commands,
    prMetadata.verification_commands
  );
  const verificationResults = [
    ...firstStringArray(inputVerificationValue, source.codex_verification_results, prMetadata.verification_results, prMetadata.checks),
    ...stringArrayFromResultObjects(inputVerificationValue, ["command", "check", "name", "summary", "result", "status"]),
    ...stringArrayFromResultObjects(source.codex_verification_results, ["command", "check", "name", "summary", "result", "status"]),
  ];
  const skippedChecks = [
    ...normalizeSkippedCheckResultObjects(inputSkippedValue),
    ...normalizeSkippedCheckResultObjects(source.codex_skipped_checks),
    ...normalizeSkippedCheckResultObjects(prMetadata.skipped_checks),
  ];
  const remainingCaveats = firstStringArray(
    stringArrayFromRecordFields(inputRecord, ["remaining_caveats", "remainingCaveats"]),
    source.codex_remaining_caveats,
    prMetadata.remaining_caveats,
    prMetadata.caveats
  );
  const authorityBoundaryStatement =
    stringValueFromRecord(inputRecord, ["authority_boundary_statement", "authorityBoundaryStatement"]) ??
    nonEmptyString(source.codex_authority_boundary_statement);
  const reportedResultStatus =
    stringValueFromRecord(inputRecord, ["result_status", "resultStatus"]) ??
    nonEmptyString(source.codex_result_status);
  const resultWorkId = stringValueFromRecord(inputRecord, ["work_id", "workId"]);
  const resultScope = stringValueFromRecord(inputRecord, ["scope"]);
  const prUrl = stringValueFromRecord(inputRecord, ["pr_url", "prUrl"]) ?? nonEmptyString(prMetadata.pr_url);
  const prNumber = inputPrNumber ?? stringValueFromRecord(prMetadata, ["pr_number", "number"]);
  const resultText = collectResultText(
    finalReportText,
    authorityBoundaryStatement,
    reportedResultStatus,
    prUrl,
    prNumber ? `PR #${prNumber}` : "",
    changedFiles.join("\n"),
    verificationCommands.join("\n"),
    verificationResults.join("\n"),
    skippedChecks.join("\n"),
    remainingCaveats.join("\n"),
    source.codex_pr_metadata,
    source.codex_pr_diff_summary
  );
  const hasPrMetadata = Object.keys(prMetadata).length > 0 || Object.keys(prDiffSummary).length > 0;
  const hasStructuredPayload =
    changedFiles.length > 0 ||
    verificationCommands.length > 0 ||
    verificationResults.length > 0 ||
    skippedChecks.length > 0 ||
    remainingCaveats.length > 0 ||
    Boolean(authorityBoundaryStatement || reportedResultStatus || prUrl || prNumber);
  const resultSource: CodexResultReviewSource = hasUserInput
    ? "user_provided_input"
    : hasPrMetadata
    ? "pr_metadata_payload"
    : hasStructuredPayload
      ? "structured_payload"
      : finalReportText
        ? "pasted_result"
        : "not_provided";
  const skippedCheckReasonIssues = [...new Set(skippedChecks)].filter((check) => !skippedCheckHasConcreteReason(check));
  const combinedText = resultText || finalReportText;
  const hasSkippedNone = hasExplicitNone(combinedText, "skipped");
  const hasCaveatsNone = hasExplicitNone(combinedText, "caveats");
  const providedInputFields = uniqueNonEmptyStrings([
    resultWorkId ? "work_id" : null,
    resultScope ? "scope" : null,
    finalReportText ? "codex final report text" : null,
    prUrl || prNumber ? "PR URL or PR number" : null,
    changedFiles.length ? "changed files" : null,
    verificationCommands.length || verificationResults.length ? "verification commands and results" : null,
    skippedChecks.length || hasSkippedNone ? "skipped checks" : null,
    remainingCaveats.length || hasCaveatsNone ? "remaining caveats" : null,
    authorityBoundaryStatement || /authority boundary/i.test(combinedText) ? "authority boundary statement" : null,
    reportedResultStatus ? "result status" : null,
  ]);
  const missingInputFields = uniqueNonEmptyStrings([
    finalReportText ? null : "Codex final report text or structured result payload.",
    changedFiles.length ? null : "Changed files.",
    verificationCommands.length || verificationResults.length ? null : "Verification commands and results.",
    skippedChecks.length || hasSkippedNone ? null : "Skipped checks with concrete reasons or an explicit none-skipped statement.",
    authorityBoundaryStatement || /authority boundary/i.test(combinedText) ? null : "Authority boundary statement.",
    remainingCaveats.length || hasCaveatsNone ? null : "Remaining caveats or an explicit none-remaining statement.",
  ]);
  const suggestedResultStatus =
    normalizeResultStatus(reportedResultStatus) ??
    inferResultStatusFromText(combinedText) ??
    (resultSource === "not_provided" ? "not_provided" : null);

  return {
    source,
    finalReportText,
    resultText,
    resultSource,
    resultWorkId,
    resultScope,
    prUrl,
    prNumber,
    reportedResultStatus,
    suggestedResultStatus,
    authorityBoundaryStatement,
    providedInputFields,
    missingInputFields,
    changedFiles: [...new Set(changedFiles)],
    verificationCommands: [...new Set(verificationCommands)],
    verificationResults: [...new Set(verificationResults)],
    skippedChecks: [...new Set(skippedChecks)],
    skippedCheckReasonIssues,
    remainingCaveats,
  };
}

function buildListAlignment(input: {
  expected: string[];
  reported: string[];
  absentSummary: string;
  alignedSummary: string;
  partialSummary: string;
  missingSummary: string;
}): CodexResultReviewAlignment {
  if (input.reported.length === 0) {
    return {
      status: "not_provided",
      summary: input.absentSummary,
      expected: input.expected,
      reported: [],
      missing: input.expected,
    };
  }
  const reportedText = input.reported.join("\n").toLowerCase();
  const missing = input.expected.filter((expected) => !reportedText.includes(expected.toLowerCase()));
  if (missing.length === 0) {
    return {
      status: "aligned",
      summary: input.alignedSummary,
      expected: input.expected,
      reported: input.reported,
      missing,
    };
  }
  return {
    status: missing.length === input.expected.length ? "missing" : "partial",
    summary: missing.length === input.expected.length ? input.missingSummary : input.partialSummary,
    expected: input.expected,
    reported: input.reported,
    missing,
  };
}

function buildPresenceAlignment(input: {
  expected: string[];
  reportedText: string;
  statusWhenAbsent?: CodexResultReviewAlignment["status"];
  alignedSummary: string;
  absentSummary: string;
}): CodexResultReviewAlignment {
  const missing = input.expected.filter((expected) => !includesText(input.reportedText, expected));
  return {
    status: missing.length === 0 ? "aligned" : input.statusWhenAbsent ?? "missing",
    summary: missing.length === 0 ? input.alignedSummary : input.absentSummary,
    expected: input.expected,
    reported: input.reportedText ? ["reported result text attached"] : [],
    missing,
  };
}

function buildCodexResultReviewPacketPreview(
  brief: WorkBrief,
  packet: Omit<
    FinalCodexHandoffPacket,
    | "copyable_handoff_text"
    | "codex_result_review_packet_preview"
    | "final_handoff_codex_result_review_packet"
    | "codex_pr_review_packet_preview"
    | "codex_result_paste_normalizer_preview"
    | "codex_result_normalizer_preview"
    | "normalized_codex_result_candidate"
    | "handoff_automation_slots"
  >,
  resultInput?: CodexResultImportInput | null
): CodexResultReviewPacketPreview {
  const resultPayload = resultReviewPayloadFromBrief(brief, resultInput);
  const resultProvided = resultPayload.resultSource !== "not_provided";
  const expectedFiles = packet.expected_files;
  const expectedChecks = packet.expected_checks;
  const reportedVerification = uniqueNonEmptyStrings([
    ...resultPayload.verificationCommands,
    ...resultPayload.verificationResults,
  ]);
  const resultText = resultPayload.resultText;
  const missingRequiredCloseoutSections = resultProvided
    ? PR_BODY_CHECKLIST_REQUIRED_SECTIONS.filter((section) => !includesText(resultText, section))
    : [...PR_BODY_CHECKLIST_REQUIRED_SECTIONS];
  const authorityBoundaryIssues = resultProvided && !resultPayload.authorityBoundaryStatement && !/authority boundary/i.test(resultText)
    ? ["Authority boundary statement is missing from the reported result payload."]
    : [];
  const contextWarnings = [
    ...(resultPayload.resultWorkId && packet.work_id && resultPayload.resultWorkId !== packet.work_id
      ? [`Result work_id ${resultPayload.resultWorkId} does not match the opened work item ${packet.work_id}.`]
      : []),
    ...(resultPayload.resultScope && packet.work_scope && resultPayload.resultScope !== packet.work_scope
      ? [`Result scope ${resultPayload.resultScope} does not match the opened scope ${packet.work_scope}.`]
      : []),
  ];
  const skippedCheckAlignment: CodexResultReviewAlignment = !resultProvided
    ? {
        status: "not_provided",
        summary: "No skipped-check result payload was provided.",
        expected: [FINAL_HANDOFF_SKIPPED_CHECK_POLICY],
        reported: [],
        missing: [FINAL_HANDOFF_SKIPPED_CHECK_POLICY],
      }
    : resultPayload.skippedChecks.length === 0
      ? resultPayload.providedInputFields.includes("skipped checks")
        ? {
            status: "aligned",
            summary: "Result explicitly reports no skipped checks.",
            expected: [FINAL_HANDOFF_SKIPPED_CHECK_POLICY],
            reported: ["No skipped checks reported."],
            missing: [],
          }
        : {
            status: "needs_review",
            summary: "No skipped checks were reported; confirm whether none were skipped or attach concrete reasons.",
            expected: [FINAL_HANDOFF_SKIPPED_CHECK_POLICY],
            reported: [],
            missing: [],
          }
      : {
          status: resultPayload.skippedCheckReasonIssues.length === 0 ? "aligned" : "partial",
          summary: resultPayload.skippedCheckReasonIssues.length === 0
            ? "Skipped checks were reported with concrete reasons."
            : "Some skipped checks were reported without concrete reasons.",
          expected: [FINAL_HANDOFF_SKIPPED_CHECK_POLICY],
          reported: resultPayload.skippedChecks,
          missing: resultPayload.skippedCheckReasonIssues,
        };

  const fileAlignment = buildListAlignment({
    expected: expectedFiles,
    reported: resultPayload.changedFiles,
    absentSummary: "No changed files were reported.",
    alignedSummary: "Reported changed files cover the expected file list.",
    partialSummary: "Reported changed files cover some expected files; review missing expected paths.",
    missingSummary: "Reported changed files do not cover the expected file list.",
  });
  const verificationAlignment = buildListAlignment({
    expected: expectedChecks,
    reported: reportedVerification,
    absentSummary: "No verification results were reported.",
    alignedSummary: "Reported verification results cover the expected checks.",
    partialSummary: "Reported verification results cover some expected checks; review missing expected checks.",
    missingSummary: "Reported verification results do not cover expected checks.",
  });
  const memoryReuseAlignment = buildPresenceAlignment({
    expected: ["Memory Reuse attachment status", packet.memory_reuse_attachment_proposal.status],
    reportedText: resultText,
    alignedSummary: "Reported result includes Memory Reuse attachment status.",
    absentSummary: "Reported result is missing Memory Reuse attachment status.",
    statusWhenAbsent: resultProvided ? "missing" : "not_provided",
  });
  const constellationContextAlignment = buildPresenceAlignment({
    expected: ["Project Constellation context status", packet.constellation_context_status],
    reportedText: resultText,
    alignedSummary: "Reported result includes Project Constellation context status.",
    absentSummary: "Reported result is missing Project Constellation context status.",
    statusWhenAbsent: resultProvided ? "missing" : "not_provided",
  });
  const preflightAlignment = buildPresenceAlignment({
    expected: ["Final handoff preflight status"],
    reportedText: resultText,
    alignedSummary: "Reported result includes final handoff preflight status.",
    absentSummary: "Reported result is missing final handoff preflight status.",
    statusWhenAbsent: resultProvided ? "missing" : "not_provided",
  });
  const checklistAlignment = buildPresenceAlignment({
    expected: ["PR body checklist", "closeout skeleton"],
    reportedText: resultText,
    alignedSummary: "Reported result references the PR body checklist and closeout skeleton.",
    absentSummary: "Reported result is missing PR body checklist / closeout skeleton context.",
    statusWhenAbsent: resultProvided ? "missing" : "not_provided",
  });

  const missingResultInputQuestions = resultPayload.missingInputFields.map((field) => `Can Codex provide ${field}`);
  const reviewQuestions = resultProvided
    ? [
        ...missingResultInputQuestions,
        ...(contextWarnings.length ? ["Does this imported result belong to the opened work item and scope?"] : []),
        ...(fileAlignment.status === "aligned" ? [] : ["Do reported changed files cover every expected path?"]),
        ...(verificationAlignment.status === "aligned" ? [] : ["Do reported verification results cover every expected check?"]),
        ...(skippedCheckAlignment.status === "aligned" ? [] : ["Are skipped checks either absent by fact or reported with concrete reasons?"]),
        ...(authorityBoundaryIssues.length ? ["Does the closeout include the required authority boundary statement?"] : []),
        ...(resultPayload.remainingCaveats.length || resultPayload.providedInputFields.includes("remaining caveats")
          ? []
          : ["Does the closeout include remaining caveats or explicitly state that none remain?"]),
        ...(memoryReuseAlignment.status === "aligned" ? [] : ["Does the closeout include Memory Reuse attachment status?"]),
        ...(constellationContextAlignment.status === "aligned" ? [] : ["Does the closeout include Project Constellation context status?"]),
        ...(preflightAlignment.status === "aligned" ? [] : ["Does the closeout include final handoff preflight status?"]),
      ]
    : [
        "Attach Codex final report text or a structured result payload before review.",
        "Include changed files, verification commands and results, skipped checks with concrete reasons, authority boundary statement, and remaining caveats.",
      ];
  const blockingMissingEvidence = resultProvided && (reportedVerification.length === 0 || authorityBoundaryIssues.length > 0);
  const needsRevision =
    resultProvided &&
    (contextWarnings.length > 0 ||
      fileAlignment.status === "missing" ||
      fileAlignment.status === "partial" ||
      verificationAlignment.status === "missing" ||
      verificationAlignment.status === "partial" ||
      skippedCheckAlignment.status === "partial" ||
      resultPayload.missingInputFields.length > 0 ||
      memoryReuseAlignment.status === "missing" ||
      constellationContextAlignment.status === "missing" ||
      preflightAlignment.status === "missing" ||
      checklistAlignment.status === "missing");
  const reviewRecommendation: CodexResultReviewRecommendation = !resultProvided
    ? "needs_result_input"
    : blockingMissingEvidence
      ? "blocked_by_missing_evidence"
      : needsRevision
        ? "needs_revision"
        : "ready_for_human_review";
  const reportedOrInferredResultStatus = resultPayload.suggestedResultStatus;
  const hasReviewGaps = blockingMissingEvidence || needsRevision;
  const suggestedResultStatus: CodexResultReviewSuggestedResultStatus = !resultProvided
    ? "not_provided"
    : reportedOrInferredResultStatus === "failed"
      ? "failed"
      : reportedOrInferredResultStatus === "blocked"
        ? "blocked"
        : hasReviewGaps
          ? "partial"
          : reportedOrInferredResultStatus === "partial"
            ? "partial"
            : reportedOrInferredResultStatus === "completed" && reviewRecommendation === "ready_for_human_review"
              ? "completed"
              : "needs_human_review";
  const suggestedNextAction: CodexResultReviewNextActionCategory = !resultProvided
    ? "result_incomplete_blocked"
    : contextWarnings.length > 0
      ? "new_handoff_needed"
      : suggestedResultStatus === "blocked"
        ? "result_incomplete_blocked"
        : suggestedResultStatus === "failed"
          ? "follow_up_fix_needed"
          : blockingMissingEvidence || verificationAlignment.status !== "aligned"
            ? "additional_verification_needed"
            : needsRevision
              ? "follow_up_fix_needed"
              : suggestedResultStatus === "completed" && reviewRecommendation === "ready_for_human_review"
                ? "close_done"
                : "human_decision_needed";
  const status: CodexResultReviewPacketStatus = resultProvided ? "preview_ready" : "needs_result_input";
  const missingInputWarnings = resultProvided && resultPayload.missingInputFields.length
    ? [`Missing result input: ${resultPayload.missingInputFields.join("; ")}`]
    : [];
  const warnings = [
    ...(!resultProvided ? ["No Codex result payload is attached; no changed files, verification results, PR URLs, proof IDs, evidence IDs, screenshots, findings, or host observations were invented."] : []),
    ...contextWarnings,
    ...authorityBoundaryIssues,
    ...resultPayload.skippedCheckReasonIssues.map((check) => `Skipped check needs a concrete reason: ${check}`),
    ...missingInputWarnings,
    ...(!resultProvided || resultPayload.missingInputFields.includes("Codex final report text or structured result payload.")
      ? [CODEX_RESULT_REVIEW_PACKET_WARNINGS[0]]
      : []),
    CODEX_RESULT_REVIEW_PACKET_WARNINGS[1],
    CODEX_RESULT_REVIEW_PACKET_WARNINGS[2],
  ];

  return {
    packet_type: "codex_result_review_packet_preview",
    status,
    result_source: resultPayload.resultSource,
    reviewed_against_packet_id: packet.work_id ? `final_codex_handoff_packet:${packet.work_id}` : null,
    work_id: packet.work_id,
    input_shape: CODEX_RESULT_IMPORT_INPUT_SHAPE,
    provided_result_input_fields: resultPayload.providedInputFields,
    missing_result_input_fields: resultProvided
      ? resultPayload.missingInputFields
      : [...CODEX_RESULT_REVIEW_PACKET_MISSING_RESULT_INPUTS],
    optional_result_input_fields: CODEX_RESULT_REVIEW_PACKET_OPTIONAL_INPUTS,
    result_review_summary: resultProvided
      ? `Codex result import has ${resultPayload.providedInputFields.length} provided field(s) and ${resultPayload.missingInputFields.length} missing field(s).`
      : "Codex result import is waiting for user-provided Codex output; no result data was invented.",
    pr_reference: {
      url: resultPayload.prUrl,
      number: resultPayload.prNumber,
      source: resultPayload.prUrl || resultPayload.prNumber ? "user_provided" : "not_provided",
      fetched: false,
    },
    reported_result_status: resultPayload.reportedResultStatus,
    suggested_result_status: suggestedResultStatus,
    reported_authority_boundary_statement: resultPayload.authorityBoundaryStatement,
    expected_files: expectedFiles,
    reported_changed_files: resultPayload.changedFiles,
    expected_checks: expectedChecks,
    reported_verification_commands: resultPayload.verificationCommands,
    reported_verification_results: resultPayload.verificationResults,
    skipped_checks: resultPayload.skippedChecks,
    remaining_caveats: resultPayload.remainingCaveats,
    missing_required_closeout_sections: missingRequiredCloseoutSections,
    required_result_input_fields: CODEX_RESULT_REVIEW_PACKET_REQUIRED_INPUTS,
    authority_boundary_issues: authorityBoundaryIssues,
    memory_reuse_alignment: memoryReuseAlignment,
    constellation_context_alignment: constellationContextAlignment,
    preflight_alignment: preflightAlignment,
    checklist_alignment: checklistAlignment,
    file_alignment: fileAlignment,
    verification_alignment: verificationAlignment,
    skipped_check_alignment: skippedCheckAlignment,
    review_questions: reviewQuestions,
    review_recommendation: reviewRecommendation,
    suggested_next_action: suggestedNextAction,
    warnings,
    ...CODEX_RESULT_REVIEW_BOUNDARY_COPY,
    boundary_text: [CODEX_RESULT_REVIEW_BOUNDARY_COPY.default_boundary_summary],
  };
}

function resultReviewAlignmentNeedsAttention(alignment: CodexResultReviewAlignment): boolean {
  return alignment.status !== "aligned";
}

function resultReviewHasContextMismatch(packet: CodexResultReviewPacketPreview): boolean {
  return (
    packet.suggested_next_action === "new_handoff_needed" ||
    packet.warnings.some((warning) => /does not match the opened/i.test(warning))
  );
}

function resultReviewVerificationStillNeeded(packet: CodexResultReviewPacketPreview): string[] {
  if (packet.status === "needs_result_input" || packet.result_source === "not_provided") {
    return packet.expected_checks.length
      ? packet.expected_checks.map((check) => `Provide verification command/result coverage for: ${check}`)
      : ["Provide verification commands and results from the Codex run."];
  }

  if (packet.verification_alignment.status === "aligned") return [];

  if (packet.verification_alignment.missing.length) {
    return packet.verification_alignment.missing.map((check) => `Missing expected verification coverage: ${check}`);
  }

  if (packet.reported_verification_commands.length === 0 && packet.reported_verification_results.length === 0) {
    return packet.expected_checks.length
      ? packet.expected_checks.map((check) => `Verification result not reported for expected check: ${check}`)
      : ["Verification commands and results were not reported."];
  }

  return [packet.verification_alignment.summary];
}

function resultReviewMissingBeforeClose(packet: CodexResultReviewPacketPreview): string[] {
  const missingFiles = packet.file_alignment.status === "aligned"
    ? []
    : packet.file_alignment.missing.map((path) => `Expected file not covered by reported changes: ${path}`);
  const skippedCheckGaps = packet.skipped_check_alignment.status === "aligned"
    ? []
    : packet.skipped_check_alignment.missing.map((item) => `Skipped check needs concrete closeout handling: ${item}`);
  const missingSections = packet.missing_required_closeout_sections.map((section) => `Closeout section not found in reported result: ${section}`);

  return uniqueNonEmptyStrings([
    ...packet.missing_result_input_fields.map((field) => `Missing result input: ${field}`),
    ...missingFiles,
    ...skippedCheckGaps,
    ...packet.authority_boundary_issues,
    ...missingSections,
  ]);
}

function resultReviewClosureRecommendation(packet: CodexResultReviewPacketPreview): ResultReviewClosureRecommendation {
  const resultMissing =
    packet.status === "needs_result_input" ||
    packet.status === "not_provided" ||
    packet.result_source === "not_provided";
  if (resultMissing) return "needs_result_input";
  if (resultReviewHasContextMismatch(packet)) return "new_handoff_needed";
  if (packet.suggested_result_status === "blocked" || packet.suggested_next_action === "result_incomplete_blocked") {
    return "result_incomplete_or_blocked";
  }
  if (packet.suggested_result_status === "failed" || packet.suggested_next_action === "follow_up_fix_needed") {
    return "follow_up_fix_needed";
  }

  const verificationMissing =
    resultReviewAlignmentNeedsAttention(packet.verification_alignment) ||
    (packet.reported_verification_commands.length === 0 && packet.reported_verification_results.length === 0) ||
    packet.suggested_next_action === "additional_verification_needed";
  if (verificationMissing) return "additional_verification_needed";

  const closeReady =
    packet.review_recommendation === "ready_for_human_review" &&
    packet.suggested_result_status === "completed" &&
    packet.suggested_next_action === "close_done" &&
    packet.missing_result_input_fields.length === 0 &&
    packet.authority_boundary_issues.length === 0 &&
    packet.file_alignment.status === "aligned" &&
    packet.verification_alignment.status === "aligned" &&
    packet.skipped_check_alignment.status === "aligned";
  if (closeReady) return "close_ready";

  return "human_decision_needed";
}

function resultReviewClosureReasons(
  packet: CodexResultReviewPacketPreview,
  recommendation: ResultReviewClosureRecommendation,
  missingBeforeClose: string[],
  verificationStillNeeded: string[],
  timeline: WorkEventSpineTimeline
): string[] {
  const base = [
    `Result review status is ${packet.status}.`,
    `Result source is ${packet.result_source}.`,
    `Review recommendation is ${packet.review_recommendation}.`,
    `Suggested result status is ${packet.suggested_result_status}.`,
    `Suggested next action is ${packet.suggested_next_action}.`,
    `Related event timeline status is ${timeline.status} with ${timeline.event_count} event(s).`,
  ];

  switch (recommendation) {
    case "needs_result_input":
      return [
        ...base,
        "No complete Codex result input is attached, so Augnes cannot review close readiness.",
      ];
    case "new_handoff_needed":
      return [
        ...base,
        "The imported result appears mismatched to the opened work item or scope.",
      ];
    case "result_incomplete_or_blocked":
      return [
        ...base,
        "The result is reported or inferred as blocked/incomplete.",
      ];
    case "follow_up_fix_needed":
      return [
        ...base,
        "The result is failed or has review gaps that point to a fix-focused follow-up.",
      ];
    case "additional_verification_needed":
      return [
        ...base,
        verificationStillNeeded.length
          ? "Expected verification is missing or only partially covered."
          : "Verification alignment is not ready for close.",
      ];
    case "close_ready":
      return [
        ...base,
        "Reported result input covers required result fields, expected files, expected checks, skipped checks, and authority boundary review.",
      ];
    case "human_decision_needed":
    default:
      return [
        ...base,
        missingBeforeClose.length
          ? "Review gaps remain but do not map cleanly to a single automated follow-up category."
          : "The result is ambiguous; a human decision is needed before close or follow-up.",
      ];
  }
}

function resultReviewHumanDecisionItems(
  packet: CodexResultReviewPacketPreview,
  recommendation: ResultReviewClosureRecommendation
): string[] {
  const closeDecision =
    "Human/Core must decide whether to close the work; GitHub reviewers decide merge/review outside this surface.";
  const base = uniqueNonEmptyStrings([
    ...packet.review_questions,
    ...packet.remaining_caveats.map((caveat) => `Review remaining caveat: ${caveat}`),
  ]);

  switch (recommendation) {
    case "close_ready":
      return uniqueNonEmptyStrings([closeDecision, ...base]);
    case "needs_result_input":
      return ["Decide whether to provide Codex result input now or defer closure review."];
    case "new_handoff_needed":
      return uniqueNonEmptyStrings([
        "Decide whether this result belongs to another work item or should start a new manual handoff.",
        ...base,
      ]);
    case "result_incomplete_or_blocked":
      return uniqueNonEmptyStrings([
        "Decide whether Codex or a human should unblock the reported result.",
        ...base,
      ]);
    case "additional_verification_needed":
      return uniqueNonEmptyStrings([
        "Decide who should run or provide the missing verification before any close decision.",
        ...base,
      ]);
    case "follow_up_fix_needed":
      return uniqueNonEmptyStrings([
        "Decide whether to send a fix-focused follow-up to Codex or handle the gap manually.",
        ...base,
      ]);
    case "human_decision_needed":
    default:
      return uniqueNonEmptyStrings([
        closeDecision,
        "Decide whether the result is enough for close, needs verification, or needs a follow-up.",
        ...base,
      ]);
  }
}

function resultReviewClosureSummary(
  packet: CodexResultReviewPacketPreview,
  recommendation: ResultReviewClosureRecommendation
): string {
  switch (recommendation) {
    case "needs_result_input":
      return "Result closure needs Codex result input before Augnes can review close readiness.";
    case "close_ready":
      return "Result appears ready for a human close, merge, or review decision outside this preview surface.";
    case "additional_verification_needed":
      return "Result needs additional verification evidence before a close decision.";
    case "follow_up_fix_needed":
      return "Result needs a fix-focused follow-up before close.";
    case "new_handoff_needed":
      return "Result appears mismatched or broad enough that a new manual handoff should be considered.";
    case "result_incomplete_or_blocked":
      return "Result appears incomplete or blocked and needs an unblock decision.";
    case "human_decision_needed":
    default:
      return `Result closure is ambiguous after review recommendation ${packet.review_recommendation}; a human decision is needed.`;
  }
}

function resultReviewClosureFollowUpSeed(input: {
  packet: CodexResultReviewPacketPreview;
  recommendation: ResultReviewClosureRecommendation;
  missingBeforeClose: string[];
  verificationStillNeeded: string[];
  humanDecisionItems: string[];
}): string {
  const workLabel = input.packet.work_id ?? "this work item";
  const prefix = `Preview-only follow-up seed for ${workLabel}:`;

  switch (input.recommendation) {
    case "needs_result_input":
      return `${prefix} ask the user to provide Codex final report text, changed files, verification commands/results, skipped checks with concrete reasons or an explicit none-skipped statement, remaining caveats, and an authority boundary statement.`;
    case "additional_verification_needed":
      return `${prefix} run a verification-focused manual follow-up using: ${listForPacket(input.verificationStillNeeded, "the missing expected checks from the result review packet")}`;
    case "follow_up_fix_needed":
      return `${prefix} start a fix-focused manual follow-up using the missing files, partial alignments, caveats, and review questions from the result review packet.`;
    case "new_handoff_needed":
      return `${prefix} open a new manual handoff only if the human confirms the imported result is mismatched or a new task is needed.`;
    case "result_incomplete_or_blocked":
      return `${prefix} summarize the blocker and ask whether Codex or a human should unblock it before any close decision.`;
    case "human_decision_needed":
      return `${prefix} ask a human to decide between close, more verification, a fix follow-up, or a new handoff using: ${listForPacket(input.humanDecisionItems, "the review questions and warnings")}`;
    case "close_ready":
      return `${prefix} result appears ready for human close/merge/review decision, but this surface does not close work, merge PRs, approve, commit state, or record proof.`;
  }
}

function buildResultReviewClosurePreview(input: {
  reviewPacket: CodexResultReviewPacketPreview;
  timeline: WorkEventSpineTimeline;
  scope: string | null;
  workId: string | null;
}): ResultReviewClosurePreview {
  const recommendation = resultReviewClosureRecommendation(input.reviewPacket);
  const missingBeforeClose = resultReviewMissingBeforeClose(input.reviewPacket);
  const verificationStillNeeded = resultReviewVerificationStillNeeded(input.reviewPacket);
  const humanDecisionItems = resultReviewHumanDecisionItems(input.reviewPacket, recommendation);
  const timelineWarnings = input.timeline.status === "empty"
    ? ["No coordination events are attached to this work item; closure guidance has no related event spine anchor."]
    : [];
  const warnings = uniqueNonEmptyStrings([
    ...input.reviewPacket.warnings,
    ...timelineWarnings,
    "Result closure recommendation is advisory preview text only and does not create durable lifecycle state.",
  ]);

  return {
    closure_type: "result_review_followup_closure_preview",
    status: recommendation,
    scope: input.scope,
    work_id: input.workId ?? input.reviewPacket.work_id,
    result_review_status: input.reviewPacket.status,
    result_source: input.reviewPacket.result_source,
    review_recommendation: input.reviewPacket.review_recommendation,
    suggested_result_status: input.reviewPacket.suggested_result_status,
    suggested_next_action: input.reviewPacket.suggested_next_action,
    closure_recommendation: recommendation,
    closure_summary: resultReviewClosureSummary(input.reviewPacket, recommendation),
    reasons: resultReviewClosureReasons(input.reviewPacket, recommendation, missingBeforeClose, verificationStillNeeded, input.timeline),
    missing_before_close: missingBeforeClose,
    verification_still_needed: verificationStillNeeded,
    follow_up_seed: resultReviewClosureFollowUpSeed({
      packet: input.reviewPacket,
      recommendation,
      missingBeforeClose,
      verificationStillNeeded,
      humanDecisionItems,
    }),
    human_decision_items: humanDecisionItems,
    related_event_count: input.timeline.event_count,
    timeline_status: input.timeline.status,
    warnings,
    ...RESULT_REVIEW_CLOSURE_BOUNDARY_COPY,
    boundary_text: [RESULT_REVIEW_CLOSURE_BOUNDARY_COPY.default_boundary_summary],
  };
}

function describeResultReviewClosurePreview(preview: ResultReviewClosurePreview): string {
  return [
    `Result closure preview for ${preview.work_id ?? "unknown work"} recommends ${preview.closure_recommendation}.`,
    preview.closure_summary,
    RESULT_REVIEW_CLOSURE_BOUNDARY_COPY.default_boundary_summary,
  ].join(" ");
}

function summarizeCodexResultReviewPacket(packet: CodexResultReviewPacketPreview): string {
  if (packet.status === "preview_ready") {
    return `Preview-ready Codex result review packet from ${packet.result_source}; recommendation ${packet.review_recommendation}.`;
  }
  if (packet.status === "needs_result_input" || packet.status === "not_provided") {
    return "Codex result review packet needs result input; no result data was attached or invented.";
  }
  return "Codex result review packet is unavailable for this payload.";
}

function codexResultReviewPacketLines(packet: CodexResultReviewPacketPreview): string[] {
  const lines = [
    `- Status: ${packet.status}`,
    `- Result source: ${packet.result_source}`,
    `- Reviewed against: ${formatPacketLine(packet.reviewed_against_packet_id)}`,
    `- Review recommendation: ${packet.review_recommendation}`,
    `- Suggested result status: ${packet.suggested_result_status}`,
    `- Suggested next action: ${packet.suggested_next_action}`,
    `- Result review summary: ${packet.result_review_summary}`,
    `- PR reference: ${packet.pr_reference.url ?? packet.pr_reference.number ?? "not provided"}; fetched=${packet.pr_reference.fetched}`,
    "- What was provided:",
    listForPacket(packet.provided_result_input_fields, "No Codex result input fields were provided."),
    "- Missing result input:",
    listForPacket(packet.missing_result_input_fields, "No required result input fields are missing."),
    "- Required result input fields:",
    listForPacket([...packet.required_result_input_fields], "No required result input fields listed."),
    "- Expected files:",
    listForPacket(packet.expected_files, "No expected files listed."),
    "- Reported changed files:",
    listForPacket(packet.reported_changed_files, "No reported changed files attached."),
    "- Expected checks:",
    listForPacket(packet.expected_checks, "No expected checks listed."),
    "- Reported verification commands:",
    listForPacket(packet.reported_verification_commands, "No reported verification commands attached."),
    "- Reported verification results:",
    listForPacket(packet.reported_verification_results, "No reported verification results attached."),
    "- Skipped checks:",
    listForPacket(packet.skipped_checks, "No skipped checks attached."),
    "- Remaining caveats:",
    listForPacket(packet.remaining_caveats, "No remaining caveats attached."),
    "- Authority boundary statement:",
    listForPacket(packet.reported_authority_boundary_statement ? [packet.reported_authority_boundary_statement] : [], "No authority boundary statement attached."),
    "- Missing required closeout sections:",
    listForPacket(packet.missing_required_closeout_sections, "No required closeout sections missing."),
    "- Authority boundary issues:",
    listForPacket(packet.authority_boundary_issues, "No authority boundary issues reported."),
    `- File alignment: ${packet.file_alignment.status}; ${packet.file_alignment.summary}`,
    `- Verification alignment: ${packet.verification_alignment.status}; ${packet.verification_alignment.summary}`,
    `- Skipped-check alignment: ${packet.skipped_check_alignment.status}; ${packet.skipped_check_alignment.summary}`,
    `- Memory Reuse alignment: ${packet.memory_reuse_alignment.status}; ${packet.memory_reuse_alignment.summary}`,
    `- Project Constellation alignment: ${packet.constellation_context_alignment.status}; ${packet.constellation_context_alignment.summary}`,
    `- Final preflight alignment: ${packet.preflight_alignment.status}; ${packet.preflight_alignment.summary}`,
    `- Checklist alignment: ${packet.checklist_alignment.status}; ${packet.checklist_alignment.summary}`,
    "- Review questions:",
    listForPacket(packet.review_questions, "No review questions listed."),
    "- Warnings:",
    listForPacket(packet.warnings, "No result review warnings listed."),
    "- Boundary:",
    listForPacket([...packet.boundary_text], "No result review boundary text listed."),
    "- Boundary diagnostics:",
    `  - Detailed boundary text: ${packet.boundary_diagnostics.detailed_boundary_text.length} item(s); see ${packet.authority_matrix_ref}.`,
  ];

  return lines;
}

function buildHandoffAutomationSlots(
  memoryReuseAttachmentProposal: FinalHandoffMemoryReuseAttachmentProposal,
  prBodyChecklistPreview: FinalHandoffPrBodyChecklistPreview,
  closeoutSkeleton: FinalHandoffCloseoutSkeleton,
  codexResultReviewPacket: CodexResultReviewPacketPreview
): HandoffAutomationSlots {
  return {
    memory_reuse_attachment: {
      slot_id: "memory_reuse_attachment",
      label: "Memory Reuse attachment",
      status: memoryReuseAttachmentProposal.status,
      inert: memoryReuseAttachmentProposal.status === "not_configured" || memoryReuseAttachmentProposal.status === "unavailable",
      generated: memoryReuseAttachmentProposal.status === "proposed" || memoryReuseAttachmentProposal.status === "no_match",
      summary: summarizeMemoryReuseAttachmentProposal(memoryReuseAttachmentProposal),
      boundary_text: memoryReuseAttachmentProposal.boundary_text,
      proposal: memoryReuseAttachmentProposal,
    },
    pr_body_checklist: {
      slot_id: "pr_body_checklist",
      label: "PR body checklist",
      status: "preview_only",
      inert: true,
      generated: true,
      summary: "Preview-only PR body checklist and closeout skeleton are prepared for later manual PR body drafting; no GitHub PR or branch is created.",
      capability_class: prBodyChecklistPreview.capability_class,
      default_boundary_summary: prBodyChecklistPreview.default_boundary_summary,
      diagnostics_available: true,
      authority_matrix_ref: prBodyChecklistPreview.authority_matrix_ref,
      boundary_text: prBodyChecklistPreview.boundary_text,
      boundary_diagnostics: prBodyChecklistPreview.boundary_diagnostics,
      checklist: prBodyChecklistPreview,
      closeout_skeleton: closeoutSkeleton,
    },
    codex_result_review_packet: {
      slot_id: "codex_result_review_packet",
      label: "Codex result review packet",
      status: codexResultReviewPacket.status,
      inert: true,
      generated: true,
      summary: summarizeCodexResultReviewPacket(codexResultReviewPacket),
      capability_class: codexResultReviewPacket.capability_class,
      default_boundary_summary: codexResultReviewPacket.default_boundary_summary,
      diagnostics_available: true,
      authority_matrix_ref: codexResultReviewPacket.authority_matrix_ref,
      boundary_text: codexResultReviewPacket.boundary_text,
      boundary_diagnostics: codexResultReviewPacket.boundary_diagnostics,
      review_packet: codexResultReviewPacket,
    },
  };
}

function buildFinalCodexHandoffJsonBlock(
  packet: Omit<FinalCodexHandoffPacket, "copyable_handoff_text">
): Record<string, unknown> {
  return {
    schema: CODEX_HANDOFF_JSON_SCHEMA,
    packet_kind: "final_codex_handoff_packet",
    final_packet_schema: packet.schema,
    composition_status: packet.composition_status,
    runtime: {
      endpoint_label: "provided by current Augnes runtime",
      requires_user_core_confirmation: true,
    },
    work: {
      scope: packet.work_scope,
      work_id: packet.work_id,
      title: packet.work_title,
      status: packet.work_status,
      next_action: packet.current_or_next_step,
      related_state_keys: packet.related_state_keys,
    },
    authorization: {
      evidence_recording: "needs_user_core_confirmation",
      proof_only_closeout: "needs_user_core_confirmation",
      browser_verification: packet.browser_verification_expectation,
    },
    expected_scope: {
      files: packet.expected_files,
      checks: packet.expected_checks,
    },
    implementation_anchors: packet.implementation_anchors,
    implementation_anchor_summary: packet.implementation_anchor_summary,
    proof_evidence_expectation_summary: packet.proof_evidence_expectation_summary,
    skipped_check_policy: packet.skipped_check_policy,
    final_report_requirements: packet.final_report_requirements,
    forbidden_actions: CODEX_HANDOFF_PREVIEW_DEFAULT_FORBIDDEN_ACTIONS,
    stop_conditions: packet.stop_conditions,
    constellation_context: packet.constellation_context,
    constellation_context_status: packet.constellation_context_status,
    no_constellation_context_fallback: packet.no_constellation_context_fallback,
    memory_reuse_attachment_proposal: packet.memory_reuse_attachment_proposal,
    pr_body_checklist_preview: packet.pr_body_checklist_preview,
    codex_pr_body_checklist: packet.codex_pr_body_checklist,
    codex_closeout_skeleton: packet.codex_closeout_skeleton,
    final_handoff_closeout_skeleton: packet.final_handoff_closeout_skeleton,
    codex_result_review_packet_preview: packet.codex_result_review_packet_preview,
    final_handoff_codex_result_review_packet: packet.final_handoff_codex_result_review_packet,
    codex_pr_review_packet_preview: packet.codex_pr_review_packet_preview,
    handoff_automation_slots: packet.handoff_automation_slots,
    capability_class: packet.capability_class,
    default_boundary_summary: packet.default_boundary_summary,
    diagnostics_available: packet.diagnostics_available,
    authority_matrix_ref: packet.authority_matrix_ref,
    boundary_diagnostics: {
      diagnostics_available: true,
      authority_matrix_ref: packet.authority_matrix_ref,
    },
    authority_boundaries: packet.authority_boundaries,
    copy_packet: {
      preview_only: true,
      does_not_execute_codex: true,
      does_not_record_evidence: true,
      does_not_record_proof: true,
      does_not_mutate_state: true,
      does_not_create_branch_or_pr: true,
      does_not_merge: true,
      does_not_publish: true,
    },
  };
}

function slotLines(slots: HandoffAutomationSlots): string[] {
  return Object.values(slots).map((slot) => `- ${slot.label}: ${slot.status}; ${slot.summary}`);
}

function constellationSummaryLines(packet: Omit<FinalCodexHandoffPacket, "copyable_handoff_text">): string[] {
  const context = packet.constellation_context;
  if (!context) return [NO_CONSTELLATION_CONTEXT_TEXT];
  return [
    `Thesis: ${context.thesis}`,
    `Selected candidate: ${formatPacketLine(context.selected_candidate_label || context.selected_candidate_id, "No selected candidate attached.")}`,
    `Selection status: ${formatPacketLine(context.selection_status)}`,
    `Advisory next action: ${formatPacketLine(context.advisory_next_action_summary, "No advisory next action summary attached.")}`,
    `Pointer-only evidence refs available in full packet: ${context.pointer_evidence_ref_count}`,
    `Unresolved tensions available in full packet: ${context.unresolved_tension_count}`,
  ];
}

function memoryReuseSummaryLines(proposal: FinalHandoffMemoryReuseAttachmentProposal): string[] {
  return [
    `Status: ${proposal.status}`,
    `Selected memory IDs: ${proposal.selected_memory_ids.length ? proposal.selected_memory_ids.join(", ") : "none"}`,
    `Fallback brief: ${proposal.fallback_brief}`,
    proposal.why_selected.length
      ? `Why selected: ${proposal.why_selected.join(" | ")}`
      : "Why selected: none",
    proposal.reuse_boundary.length
      ? `Reuse boundary: ${proposal.reuse_boundary.join(" | ")}`
      : "Reuse boundary: no persisted memory reuse boundary attached.",
  ];
}

function prChecklistSummaryLines(checklist: FinalHandoffPrBodyChecklistPreview): string[] {
  return [
    `Status: ${checklist.status}`,
    `Required sections: ${checklist.required_sections.join(", ")}`,
    "Use the full packet for the full PR checklist, closeout skeleton, and warnings.",
  ];
}

function buildCoreCodexHandoffJsonBlock(
  packet: Omit<CoreCodexHandoffPacket, "copyable_handoff_text" | "copyable_core_handoff_text">
): Record<string, unknown> {
  return {
    schema: CODEX_HANDOFF_JSON_SCHEMA,
    packet_kind: "core_codex_handoff_packet",
    core_packet_schema: packet.schema,
    source_packet_type: packet.source_packet_type,
    source_packet_schema: packet.source_packet_schema,
    copy_intent: packet.copy_intent,
    core_handoff_usage: packet.core_handoff_usage,
    implementation_anchors: packet.implementation_anchors,
    implementation_anchor_summary: packet.implementation_anchor_summary,
    full_context_required_before_implementation: packet.full_context_required_before_implementation,
    core_current_task_only: packet.core_current_task_only,
    runtime: {
      endpoint_label: "provided by current Augnes runtime",
      requires_user_core_confirmation: true,
    },
    work: {
      scope: packet.work_scope,
      work_id: packet.work_id,
      title: packet.work_title,
      status: packet.work_status,
      next_action: packet.current_or_next_step,
      user_facing_goal: packet.user_facing_goal,
      related_state_keys: packet.related_state_keys,
    },
    authorization: {
      evidence_recording: "needs_user_core_confirmation",
      proof_only_closeout: "needs_user_core_confirmation",
      browser_verification: "needs_user_core_confirmation",
    },
    expected_scope: {
      files: packet.expected_files,
      checks: packet.expected_checks,
    },
    constellation_context_summary: packet.constellation_context_summary,
    memory_reuse_summary: packet.memory_reuse_summary,
    pr_checklist_summary: packet.pr_checklist_summary,
    closeout_report_expectations: packet.closeout_report_expectations,
    skipped_check_policy: packet.skipped_check_policy,
    final_report_requirements: packet.final_report_requirements,
    forbidden_actions: packet.forbidden_actions,
    stop_conditions: packet.stop_conditions,
    capability_class: packet.capability_class,
    default_boundary_summary: packet.default_boundary_summary,
    diagnostics_available: packet.diagnostics_available,
    authority_matrix_ref: packet.authority_matrix_ref,
    boundary_diagnostics: {
      diagnostics_available: true,
      authority_matrix_ref: packet.authority_matrix_ref,
    },
    authority_boundaries: packet.authority_boundaries,
    copy_packet: {
      preview_only: true,
      core_packet: true,
      full_context_available_separately: true,
      does_not_execute_codex: true,
      does_not_record_evidence: true,
      does_not_record_proof: true,
      does_not_mutate_state: true,
      does_not_create_branch_or_pr: true,
      does_not_merge: true,
      does_not_publish: true,
    },
  };
}

function buildCoreCurrentTaskOnly(
  packet: Omit<CoreCodexHandoffPacket, "copyable_handoff_text" | "copyable_core_handoff_text" | "core_current_task_only">
): CoreCurrentTaskOnly {
  const implementationAnchorCount = packet.implementation_anchors.length;
  return {
    work_id: packet.work_id,
    scope: packet.work_scope,
    title: packet.work_title,
    current_task: packet.current_or_next_step || packet.user_facing_goal,
    core_usage: packet.core_handoff_usage,
    implementation_anchor_status: coreCurrentTaskImplementationAnchorStatus(packet),
    implementation_anchor_count: implementationAnchorCount,
    implementation_anchor_summary: packet.implementation_anchor_summary,
    full_context_required_before_implementation: packet.full_context_required_before_implementation,
    expected_files: packet.expected_files,
    expected_checks: packet.expected_checks,
    stop_conditions: [...packet.stop_conditions],
    authority_boundary_summary: [...CORE_CURRENT_TASK_AUTHORITY_BOUNDARY_SUMMARY],
    result_report_template: CORE_CURRENT_TASK_RESULT_REPORT_TEMPLATE,
    next_return_path: CORE_CURRENT_TASK_NEXT_RETURN_PATH,
  };
}

function coreCurrentTaskImplementationAnchorStatus(
  packet: Pick<CoreCodexHandoffPacket, "core_handoff_usage" | "implementation_anchors" | "full_context_required_before_implementation">
): CoreCurrentTaskImplementationAnchorStatus {
  if (packet.implementation_anchors.length > 0) return "attached";
  if (packet.full_context_required_before_implementation || packet.core_handoff_usage === "implementation_requires_full_context") {
    return "missing";
  }
  return "unknown";
}

function buildCoreCodexHandoffText(
  packet: Omit<CoreCodexHandoffPacket, "copyable_handoff_text" | "copyable_core_handoff_text">
): string {
  const structuredJson = JSON.stringify(buildCoreCodexHandoffJsonBlock(packet), null, 2);
  const currentTask = packet.core_current_task_only;
  return [
    "Core Codex Handoff Packet",
    "Shorter packet for starting Codex work. Use Copy Full Context when full appendices are needed.",
    "This is a preview/copy packet, not an execution action.",
    "",
    "Current task only",
    `- Work ID: ${formatStatus(currentTask.work_id, "No work ID listed.")}`,
    `- Scope: ${formatStatus(currentTask.scope)}`,
    `- Task: ${currentTask.current_task}`,
    `- Core usage: ${currentTask.full_context_required_before_implementation ? "planning only / full context needed" : currentTask.core_usage}`,
    `- Implementation anchors: ${
      currentTask.implementation_anchor_status === "attached"
        ? `${currentTask.implementation_anchor_count} attached; ${currentTask.implementation_anchor_summary}`
        : currentTask.implementation_anchor_status === "missing"
          ? "none attached; open Full Context before implementation."
          : `${currentTask.implementation_anchor_count} known; ${currentTask.implementation_anchor_summary}`
    }`,
    "- Expected files:",
    listForPacket(currentTask.expected_files, "No expected files are listed in the work brief."),
    "- Expected checks:",
    listForPacket(currentTask.expected_checks, "No expected checks are listed in the work brief."),
    "- Stop if:",
    listForPacket(currentTask.stop_conditions, "No stop conditions listed."),
    "- Authority boundary:",
    listForPacket(currentTask.authority_boundary_summary, "No authority boundary summary listed."),
    "- Return result using:",
    `  - ${currentTask.result_report_template}`,
    `  - ${currentTask.next_return_path}`,
    "",
    "Immediate task context",
    `- Scope: ${formatStatus(packet.work_scope)}`,
    `- Work ID: ${formatStatus(packet.work_id, "No work ID listed.")}`,
    `- Title: ${formatStatus(packet.work_title, "No work title listed.")}`,
    `- User-facing goal: ${packet.user_facing_goal}`,
    `- Current status: ${formatStatus(packet.work_status, "No work status listed.")}`,
    `- Current / next step: ${formatStatus(packet.current_or_next_step, "No current or next step is listed in the work brief.")}`,
    "",
    "Codex read-brief start preview",
    `AUGNES_API_BASE_URL=<provided-current-runtime> CODEX_SCOPE=${formatStatus(packet.work_scope, "<provided-scope>")} CODEX_WORK_ID=${formatStatus(packet.work_id, "<provided-work-id>")} npm run codex:read-brief`,
    "",
    "Core usage",
    `- Usage state: ${packet.core_handoff_usage}`,
    `- ${packet.implementation_anchor_summary}`,
    "",
    "Implementation anchors",
    listForPacket(packet.implementation_anchors, "No implementation file/schema anchors are attached in Core. Use Core for planning only, or open Full Context before implementation."),
    "",
    "Expected scope",
    "- Expected files:",
    listForPacket(packet.expected_files, "No expected files are listed in the work brief."),
    "- Expected read-only checks:",
    listForPacket(packet.expected_checks, "No expected checks are listed in the work brief."),
    "- Related state keys:",
    listForPacket(packet.related_state_keys, "No related state keys are listed in the work brief."),
    "",
    "Project Constellation summary",
    listForPacket(packet.constellation_context_summary, NO_CONSTELLATION_CONTEXT_TEXT),
    "",
    "Memory Reuse summary",
    listForPacket(packet.memory_reuse_summary, "No Memory Reuse summary attached."),
    "",
    "PR checklist summary",
    listForPacket(packet.pr_checklist_summary, "No PR checklist summary attached."),
    "",
    "Closeout and report expectations",
    listForPacket(packet.closeout_report_expectations, "No closeout expectations listed."),
    "",
    "Skipped check policy",
    `- ${packet.skipped_check_policy}`,
    "",
    "Final report requirements",
    listForPacket([...packet.final_report_requirements], "No final report requirements listed."),
    "",
    "Stop conditions",
    listForPacket([...packet.stop_conditions], "No stop conditions listed."),
    "",
    "Capability boundary",
    `- Classes: ${packet.capability_class.join(", ")}`,
    `- Summary: ${packet.default_boundary_summary}`,
    `- Detailed diagnostics: available at ${packet.authority_matrix_ref} and structured boundary_diagnostics.`,
    "",
    "Structured JSON",
    CODEX_HANDOFF_JSON_BEGIN,
    structuredJson,
    CODEX_HANDOFF_JSON_END,
  ].join("\n");
}

function buildCoreCodexHandoffPacket(finalPacket: FinalCodexHandoffPacket): CoreCodexHandoffPacket {
  const implementationAnchors = buildCoreImplementationAnchors(finalPacket);
  const coreHandoffUsage = coreHandoffUsageForAnchors(implementationAnchors);
  const packetBase = {
    packet_type: "core_codex_handoff_packet",
    schema: CORE_CODEX_HANDOFF_PACKET_SCHEMA,
    title: "Core Codex Handoff Packet",
    source_packet_type: "final_codex_handoff_packet",
    source_packet_schema: finalPacket.schema,
    copy_intent: "shorter_packet_for_starting_codex_work",
    core_handoff_usage: coreHandoffUsage,
    implementation_anchors: implementationAnchors,
    implementation_anchor_summary: coreImplementationAnchorSummary(coreHandoffUsage, implementationAnchors),
    full_context_required_before_implementation: implementationAnchors.length === 0,
    work_scope: finalPacket.work_scope,
    work_id: finalPacket.work_id,
    work_title: finalPacket.work_title,
    user_facing_goal:
      finalPacket.current_or_next_step ||
      finalPacket.work_title ||
      "Use the Work Contract context to complete the requested Augnes task.",
    work_status: finalPacket.work_status,
    current_or_next_step: finalPacket.current_or_next_step,
    expected_files: finalPacket.expected_files,
    expected_checks: finalPacket.expected_checks,
    related_state_keys: finalPacket.related_state_keys,
    constellation_context_summary: constellationSummaryLines(finalPacket),
    memory_reuse_summary: memoryReuseSummaryLines(finalPacket.memory_reuse_attachment_proposal),
    pr_checklist_summary: prChecklistSummaryLines(finalPacket.pr_body_checklist_preview),
    closeout_report_expectations: [
      "Report changed files.",
      "Report verification commands and results.",
      "Report skipped checks with concrete reasons.",
      "Include authority boundary statement.",
      "Name remaining friction or next recommended step.",
    ],
    skipped_check_policy: finalPacket.skipped_check_policy,
    forbidden_actions: finalPacket.forbidden_actions,
    stop_conditions: finalPacket.stop_conditions,
    ...CORE_HANDOFF_BOUNDARY_COPY,
    authority_boundaries: [CORE_HANDOFF_BOUNDARY_COPY.default_boundary_summary],
    final_report_requirements: finalPacket.final_report_requirements,
    structured_json_delimiters: finalPacket.structured_json_delimiters,
    boundaries: {
      read_only: true,
      short_copy_only: true,
      codex_execution: false,
      branch_or_pr_creation: false,
      proof_recording: false,
      evidence_recording: false,
      provider_calls: false,
      github_calls: false,
      openai_calls: false,
      persistence: false,
    },
  } satisfies Omit<CoreCodexHandoffPacket, "copyable_handoff_text" | "copyable_core_handoff_text" | "core_current_task_only">;
  const packetWithoutText = {
    ...packetBase,
    core_current_task_only: buildCoreCurrentTaskOnly(packetBase),
  } satisfies Omit<CoreCodexHandoffPacket, "copyable_handoff_text" | "copyable_core_handoff_text">;
  const copyableHandoffText = buildCoreCodexHandoffText(packetWithoutText);
  return {
    ...packetWithoutText,
    copyable_handoff_text: copyableHandoffText,
    copyable_core_handoff_text: copyableHandoffText,
  };
}

function buildFinalCodexHandoffText(
  packet: Omit<FinalCodexHandoffPacket, "copyable_handoff_text">
): string {
  const structuredJson = JSON.stringify(buildFinalCodexHandoffJsonBlock(packet), null, 2);
  const constellationContext = packet.constellation_context;
  const constellationContextLines = constellationContext
    ? [
        `- Thesis: ${constellationContext.thesis}`,
        `- Selected candidate ID: ${formatPacketLine(constellationContext.selected_candidate_id)}`,
        `- Selected candidate label: ${formatPacketLine(constellationContext.selected_candidate_label)}`,
        `- Selection status: ${formatPacketLine(constellationContext.selection_status)}`,
        constellationContext.selection_fallback_reason
          ? `- Selection fallback: ${constellationContext.selection_fallback_reason}`
          : "- Selection fallback: none",
        `- Pointer-only evidence refs: ${constellationContext.pointer_evidence_ref_count}`,
        listForPacket(constellationContext.pointer_evidence_refs, "No pointer-only evidence refs attached."),
        `- Unresolved tensions: ${constellationContext.unresolved_tension_count}`,
        listForPacket(constellationContext.unresolved_tensions, "No unresolved tensions attached."),
        `- Advisory next action: ${formatPacketLine(constellationContext.advisory_next_action_summary, "No advisory next action summary attached.")}`,
        "- Source refs:",
        listForPacket(constellationContext.source_refs, "No source refs attached."),
      ]
    : [`- ${NO_CONSTELLATION_CONTEXT_TEXT}`];

  return [
    "Final Codex Handoff Packet",
    "Preparation automation only. This packet is local read-only preview text for a separate user-started Codex session.",
    "This is a preview/copy packet, not an execution action.",
    "",
    "Work Contract",
    `- Scope: ${formatStatus(packet.work_scope)}`,
    `- Work ID: ${formatStatus(packet.work_id, "No work ID listed.")}`,
    `- Title: ${formatStatus(packet.work_title, "No work title listed.")}`,
    `- Status: ${formatStatus(packet.work_status, "No work status listed.")}`,
    `- Current / next step: ${formatStatus(packet.current_or_next_step, "No current or next step is listed in the work brief.")}`,
    "",
    "Codex read-brief start preview",
    `AUGNES_API_BASE_URL=<provided-current-runtime> CODEX_SCOPE=${formatStatus(packet.work_scope, "<provided-scope>")} CODEX_WORK_ID=${formatStatus(packet.work_id, "<provided-work-id>")} npm run codex:read-brief`,
    "",
    "Expected scope",
    "- Expected files:",
    listForPacket(packet.expected_files, "No expected files are listed in the work brief."),
    "- Expected read-only checks:",
    listForPacket(packet.expected_checks, "No expected checks are listed in the work brief."),
    "- Related state keys:",
    listForPacket(packet.related_state_keys, "No related state keys are listed in the work brief."),
    "",
    "Implementation anchors",
    `- ${packet.implementation_anchor_summary}`,
    listForPacket(packet.implementation_anchors, "Implementation anchors could not be derived from current work metadata. Run codex:read-brief/repo inspection before implementation."),
    "",
    "Proof, evidence, skipped checks, and browser verification",
    `- Proof/evidence expectation: ${packet.proof_evidence_expectation_summary}`,
    `- Skipped check policy: ${packet.skipped_check_policy}`,
    `- Browser verification expectation: ${packet.browser_verification_expectation}`,
    "",
    "Project Constellation context",
    ...constellationContextLines,
    "",
    "Memory Reuse attachment",
    ...memoryReuseProposalLines(packet.memory_reuse_attachment_proposal),
    "",
    "Codex PR body checklist / closeout skeleton",
    `- Checklist status: ${packet.pr_body_checklist_preview.status}`,
    `- Generated: ${packet.pr_body_checklist_preview.generated}`,
    "- Required sections:",
    listForPacket([...packet.pr_body_checklist_preview.required_sections], "No required PR body sections listed."),
    "- Guardrail summary:",
    `  - ${packet.pr_body_checklist_preview.default_boundary_summary}`,
    `  - Detailed forbidden-claim diagnostics: ${packet.pr_body_checklist_preview.boundary_diagnostics.detailed_forbidden_actions?.length ?? 0} item(s); see ${packet.pr_body_checklist_preview.authority_matrix_ref}.`,
    "- Warnings:",
    listForPacket([...packet.pr_body_checklist_preview.warnings], "No PR body checklist warnings listed."),
    "",
    "Closeout skeleton preview",
    packet.codex_closeout_skeleton.copyable_closeout_text,
    "",
    "Codex result review packet",
    ...codexResultReviewPacketLines(packet.codex_result_review_packet_preview),
    "",
    "Attachment slots",
    ...slotLines(packet.handoff_automation_slots),
    "",
    "Final report requirements",
    listForPacket([...packet.final_report_requirements], "No final report requirements listed."),
    "",
    "Stop conditions",
    listForPacket([...packet.stop_conditions], "No stop conditions listed."),
    "",
    "Capability boundary",
    `- Classes: ${packet.capability_class.join(", ")}`,
    `- Summary: ${packet.default_boundary_summary}`,
    `- Detailed diagnostics: available at ${packet.authority_matrix_ref} and structured boundary_diagnostics.`,
    "",
    "Structured JSON",
    CODEX_HANDOFF_JSON_BEGIN,
    structuredJson,
    CODEX_HANDOFF_JSON_END,
  ].join("\n");
}

function buildFinalCodexHandoffPacket(
  brief: WorkBrief,
  card: WorkContractCard,
  preview: CodexHandoffPreview,
  memoryReuseAttachmentProposal: FinalHandoffMemoryReuseAttachmentProposal,
  resultInput?: CodexResultImportInput | null,
  codexResultPasteNormalizerPreview: CodexResultPasteNormalizerPreview = buildCodexResultPasteNormalizerPreview({})
): FinalCodexHandoffPacket {
  const implementationAnchors = buildFullContextImplementationAnchors(brief, card);
  const basePacketWithoutTextAndSlots = {
    packet_type: "final_codex_handoff_packet",
    schema: FINAL_CODEX_HANDOFF_PACKET_SCHEMA,
    title: "Final Codex Handoff Packet",
    composition_status: "composed",
    source_preview_type: "codex_handoff_preview",
    work_scope: preview.scope,
    work_id: preview.work_id,
    work_title: preview.work_title,
    work_status: preview.work_status,
    current_or_next_step: preview.work_next_action,
    expected_files: preview.expected_files,
    expected_checks: preview.expected_checks,
    implementation_anchors: implementationAnchors,
    implementation_anchor_summary: fullContextImplementationAnchorSummary(implementationAnchors),
    related_state_keys: preview.related_state_keys,
    proof_evidence_expectation_summary: card.proof_evidence_expectation_summary,
    skipped_check_policy: FINAL_HANDOFF_SKIPPED_CHECK_POLICY,
    browser_verification_expectation: preview.browser_verification,
    forbidden_actions: preview.forbidden_actions,
    stop_conditions: preview.stop_conditions,
    ...CODEX_HANDOFF_BOUNDARY_COPY,
    authority_boundaries: [CODEX_HANDOFF_BOUNDARY_COPY.default_boundary_summary],
    final_report_requirements: FINAL_HANDOFF_FINAL_REPORT_REQUIREMENTS,
    constellation_context: preview.constellation_context,
    constellation_context_status: preview.constellation_context ? "attached" : "explicitly_absent",
    no_constellation_context_fallback: NO_CONSTELLATION_CONTEXT_TEXT,
    memory_reuse_attachment_proposal: memoryReuseAttachmentProposal,
    structured_json_delimiters: {
      begin: CODEX_HANDOFF_JSON_BEGIN,
      end: CODEX_HANDOFF_JSON_END,
    },
    boundaries: {
      read_only: true,
      local_preflight_only: true,
      state_commit_or_reject: false,
      codex_execution: false,
      branch_or_pr_creation: false,
      proof_recording: false,
      evidence_recording: false,
      provider_calls: false,
      github_calls: false,
      openai_calls: false,
      persistence: false,
    },
  } satisfies Omit<
    FinalCodexHandoffPacket,
    | "copyable_handoff_text"
    | "pr_body_checklist_preview"
    | "codex_pr_body_checklist"
    | "codex_closeout_skeleton"
    | "final_handoff_closeout_skeleton"
    | "codex_result_review_packet_preview"
    | "final_handoff_codex_result_review_packet"
    | "codex_pr_review_packet_preview"
    | "codex_result_paste_normalizer_preview"
    | "codex_result_normalizer_preview"
    | "normalized_codex_result_candidate"
    | "handoff_automation_slots"
  >;

  const prBodyChecklistPreview = buildPrBodyChecklistPreview();
  const closeoutSkeleton = buildCloseoutSkeleton(basePacketWithoutTextAndSlots, memoryReuseAttachmentProposal);
  const codexResultReviewPacket = buildCodexResultReviewPacketPreview(brief, {
    ...basePacketWithoutTextAndSlots,
    pr_body_checklist_preview: prBodyChecklistPreview,
    codex_pr_body_checklist: prBodyChecklistPreview,
    codex_closeout_skeleton: closeoutSkeleton,
    final_handoff_closeout_skeleton: closeoutSkeleton,
  }, resultInput);
  const packetWithoutText = {
    ...basePacketWithoutTextAndSlots,
    pr_body_checklist_preview: prBodyChecklistPreview,
    codex_pr_body_checklist: prBodyChecklistPreview,
    codex_closeout_skeleton: closeoutSkeleton,
    final_handoff_closeout_skeleton: closeoutSkeleton,
    codex_result_review_packet_preview: codexResultReviewPacket,
    final_handoff_codex_result_review_packet: codexResultReviewPacket,
    codex_pr_review_packet_preview: codexResultReviewPacket,
    codex_result_paste_normalizer_preview: codexResultPasteNormalizerPreview,
    codex_result_normalizer_preview: codexResultPasteNormalizerPreview,
    normalized_codex_result_candidate: codexResultPasteNormalizerPreview.candidate,
    handoff_automation_slots: buildHandoffAutomationSlots(
      memoryReuseAttachmentProposal,
      prBodyChecklistPreview,
      closeoutSkeleton,
      codexResultReviewPacket
    ),
  } satisfies Omit<FinalCodexHandoffPacket, "copyable_handoff_text">;

  return {
    ...packetWithoutText,
    copyable_handoff_text: buildFinalCodexHandoffText(packetWithoutText),
  };
}

function extractStructuredHandoffJsonBlock(text: string): { value?: Record<string, unknown>; error?: string } {
  const beginIndex = text.indexOf(CODEX_HANDOFF_JSON_BEGIN);
  const endIndex = text.indexOf(CODEX_HANDOFF_JSON_END);
  if (beginIndex === -1 && endIndex === -1) return { error: "Structured JSON block is missing." };
  if (beginIndex === -1 || endIndex === -1 || endIndex <= beginIndex) {
    return { error: "Structured JSON block delimiters are missing or out of order." };
  }
  if (text.indexOf(CODEX_HANDOFF_JSON_BEGIN, beginIndex + CODEX_HANDOFF_JSON_BEGIN.length) !== -1) {
    return { error: "Structured JSON block begin delimiter appears more than once." };
  }
  if (text.indexOf(CODEX_HANDOFF_JSON_END, endIndex + CODEX_HANDOFF_JSON_END.length) !== -1) {
    return { error: "Structured JSON block end delimiter appears more than once." };
  }
  const jsonText = text.slice(beginIndex + CODEX_HANDOFF_JSON_BEGIN.length, endIndex).trim();
  if (!jsonText) return { error: "Structured JSON block is empty." };
  try {
    const parsed = JSON.parse(jsonText);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return { error: "Structured JSON block must contain a JSON object." };
    }
    return { value: parsed as Record<string, unknown> };
  } catch (error) {
    return { error: `Structured JSON block is malformed: ${error instanceof Error ? error.message : String(error)}` };
  }
}

function finalPreflightCheck(
  id: string,
  condition: boolean,
  passMessage: string,
  failMessage: string,
  statusWhenFalse: FinalHandoffPreflightCheck["status"] = "fail"
): FinalHandoffPreflightCheck {
  return {
    id,
    status: condition ? "pass" : statusWhenFalse,
    message: condition ? passMessage : failMessage,
  };
}

function hasForbiddenControlLabel(text: string): boolean {
  return FINAL_HANDOFF_FORBIDDEN_CONTROL_LABEL_PARTS.some((parts) => text.includes(parts.join("")));
}

function finalHandoffMemoryReusePreflightCheck(packet: FinalCodexHandoffPacket): FinalHandoffPreflightCheck {
  const proposal = packet.memory_reuse_attachment_proposal;
  const fallbackBriefPresent = Boolean(nonEmptyString(proposal.fallback_brief));
  const selectedCountMatches = proposal.selected_memory_ids.length === proposal.selected_memory_count;
  const packetMentionsAttachment = packet.copyable_handoff_text.includes("Memory Reuse attachment");

  if (proposal.status === "proposed") {
    const proposedValid =
      proposal.selected_memory_count > 0 &&
      selectedCountMatches &&
      proposal.why_selected.length > 0 &&
      proposal.reuse_boundary.length > 0 &&
      packetMentionsAttachment;
    return {
      id: "memory_reuse_attachment_state",
      status: proposedValid ? "pass" : "fail",
      message: proposedValid
        ? "Memory Reuse attachment proposal includes selected memory IDs with reuse rationale and boundaries."
        : "Memory Reuse attachment proposal is marked proposed but selected IDs, rationale, boundaries, or packet text are incomplete.",
    };
  }

  if (proposal.status === "no_match") {
    const noMatchValid =
      proposal.selected_memory_count === 0 &&
      proposal.selected_memory_ids.length === 0 &&
      proposal.why_selected.length === 0 &&
      proposal.reuse_boundary.length === 0 &&
      fallbackBriefPresent &&
      packetMentionsAttachment;
    return {
      id: "memory_reuse_attachment_state",
      status: noMatchValid ? "pass" : "fail",
      message: noMatchValid
        ? "Memory Reuse attachment is explicit no_match with no invented selected memory data."
        : "Memory Reuse attachment no_match state is missing fallback text or includes invented selected memory data.",
    };
  }

  if (proposal.status === "not_configured" || proposal.status === "unavailable") {
    return {
      id: "memory_reuse_attachment_state",
      status: fallbackBriefPresent && packetMentionsAttachment ? "warn" : "fail",
      message:
        fallbackBriefPresent && packetMentionsAttachment
          ? `Memory Reuse attachment is explicitly ${proposal.status}.`
          : "Memory Reuse attachment unavailable/not_configured state is missing explicit fallback text.",
    };
  }

  return {
    id: "memory_reuse_attachment_state",
    status: "fail",
    message: "Memory Reuse attachment state is malformed or ambiguous.",
  };
}

function finalHandoffPrBodyChecklistPreflightCheck(packet: FinalCodexHandoffPacket): FinalHandoffPreflightCheck {
  const checklist = packet.pr_body_checklist_preview;
  const skeleton = packet.codex_closeout_skeleton;
  const slot = packet.handoff_automation_slots.pr_body_checklist;
  const skeletonText = skeleton.copyable_closeout_text;

  if (slot.status === "not_generated" && slot.inert) {
    return {
      id: "pr_body_checklist_state",
      status: "warn",
      message: "PR body checklist slot is explicitly inert and not generated.",
    };
  }

  const requiredSectionsPresent = PR_BODY_CHECKLIST_REQUIRED_SECTIONS.every(
    (section) => checklist.required_sections.includes(section) && skeletonText.includes(`## ${section}`)
  );
  const placeholdersPresent = skeletonText.includes("Placeholder:");
  const packetMentionsChecklist = packet.copyable_handoff_text.includes("Codex PR body checklist / closeout skeleton");
  const slotValid = slot.status === "preview_only" && slot.generated === true && slot.inert === true;
  const noPassedClaims = !/all passed\.|verification passed|all checks passed/i.test(skeletonText);
  const valid =
    checklist.status === "preview_only" &&
    checklist.generated === true &&
    skeleton.status === "preview_only" &&
    skeleton.generated === true &&
    requiredSectionsPresent &&
    placeholdersPresent &&
    packetMentionsChecklist &&
    slotValid &&
    noPassedClaims;

  return {
    id: "pr_body_checklist_state",
    status: valid ? "pass" : "fail",
    message: valid
      ? "Preview-only PR body checklist and closeout skeleton are present with placeholders and no pass claims."
      : "PR body checklist or closeout skeleton is missing, ambiguous, or claims results prematurely.",
  };
}

function finalHandoffCodexResultReviewPacketPreflightCheck(packet: FinalCodexHandoffPacket): FinalHandoffPreflightCheck {
  const reviewPacket = packet.codex_result_review_packet_preview;
  const slot = packet.handoff_automation_slots.codex_result_review_packet;
  const packetMentionsReview = packet.copyable_handoff_text.includes("Codex result review packet");
  const slotValid = slot.generated === true && slot.inert === true && slot.review_packet?.packet_type === "codex_result_review_packet_preview";

  if (reviewPacket.status === "needs_result_input" || reviewPacket.status === "not_provided") {
    const explicit =
      reviewPacket.result_source === "not_provided" &&
      reviewPacket.required_result_input_fields.length > 0 &&
      reviewPacket.reported_changed_files.length === 0 &&
      reviewPacket.reported_verification_results.length === 0 &&
      packetMentionsReview &&
      slotValid;
    return {
      id: "codex_result_review_packet_state",
      status: explicit ? "warn" : "fail",
      message: explicit
        ? "Codex result review packet explicitly needs result input and does not invent reported result data."
        : "Codex result review packet missing-result state is malformed or ambiguous.",
    };
  }

  if (reviewPacket.status === "preview_ready") {
    const ready =
      reviewPacket.result_source !== "not_provided" &&
      reviewPacket.provided_result_input_fields.length > 0 &&
      reviewPacket.review_recommendation !== "needs_result_input" &&
      packetMentionsReview &&
      slotValid;
    const complete = ready && reviewPacket.review_recommendation === "ready_for_human_review";
    return {
      id: "codex_result_review_packet_state",
      status: ready ? complete ? "pass" : "warn" : "fail",
      message: complete
        ? "Codex result review packet has attached result payload for bounded human review."
        : ready
          ? "Codex result review packet has partial attached result input; missing fields are surfaced for bounded human review."
          : "Codex result review packet is preview_ready but lacks provided input fields or bounded recommendation.",
    };
  }

  if (reviewPacket.status === "unavailable") {
    return {
      id: "codex_result_review_packet_state",
      status: reviewPacket.boundary_text.length > 0 && packetMentionsReview ? "warn" : "fail",
      message:
        reviewPacket.boundary_text.length > 0 && packetMentionsReview
          ? "Codex result review packet is explicitly unavailable."
          : "Codex result review packet unavailable state is missing explicit boundary text.",
    };
  }

  return {
    id: "codex_result_review_packet_state",
    status: "fail",
    message: "Codex result review packet state is malformed or ambiguous.",
  };
}

function buildFinalHandoffPreflight(packet: FinalCodexHandoffPacket): FinalHandoffPreflight {
  const packetText = nonEmptyString(packet.copyable_handoff_text);
  if (!packetText) {
    return {
      preflight_type: "final_handoff_preflight",
      status: "unavailable",
      summary: "Final handoff packet text is unavailable.",
      checks: [
        {
          id: "packet_text",
          status: "unavailable",
          message: "Final handoff packet text is unavailable.",
        },
      ],
      checked_packet_type: packet.packet_type,
      checker: "app_local_final_handoff_preview_checker",
      local_only: true,
      pure: true,
      did_not_spawn_shell_or_npm: true,
      did_not_call_runtime: true,
      did_not_call_github_openai_or_provider: true,
      did_not_record_proof_or_evidence: true,
      did_not_execute_codex: true,
    };
  }

  const structuredBlock = extractStructuredHandoffJsonBlock(packetText);
  const workIdOrFallback = Boolean(packet.work_id) || packetText.includes("No work ID listed.");
  const constellationContextState =
    packet.constellation_context_status === "attached" ||
    (packet.constellation_context_status === "explicitly_absent" && packetText.includes(NO_CONSTELLATION_CONTEXT_TEXT));
  const checks: FinalHandoffPreflightCheck[] = [
    finalPreflightCheck("packet_text", true, "Final handoff packet text exists.", "Final handoff packet text is missing."),
    finalPreflightCheck(
      "work_id_or_fallback",
      workIdOrFallback,
      packet.work_id ? "Work ID is present." : "Missing work ID fallback is explicit.",
      "Work ID is missing and no explicit missing-work fallback is present."
    ),
    finalPreflightCheck(
      "authority_boundary",
      packet.authority_boundaries.length > 0 && /read-only|cannot execute Codex|cannot record evidence/i.test(packetText),
      "Authority boundary text exists.",
      "Authority boundary text is missing."
    ),
    finalPreflightCheck(
      "forbidden_actions",
      packet.forbidden_actions.length > 0,
      "Forbidden action boundaries exist.",
      "Forbidden action boundaries are missing."
    ),
    finalPreflightCheck(
      "skipped_check_policy",
      packet.skipped_check_policy.length > 0 && packetText.includes(packet.skipped_check_policy),
      "Skipped check policy exists.",
      "Skipped check policy is missing."
    ),
    finalPreflightCheck(
      "final_report_requirements",
      packet.final_report_requirements.length > 0,
      "Final report or closeout expectations exist.",
      "Final report or closeout expectations are missing."
    ),
    finalPreflightCheck(
      "constellation_context_state",
      constellationContextState,
      packet.constellation_context_status === "attached"
        ? "Project Constellation context is attached."
        : "Missing Project Constellation context fallback is explicit.",
      "Project Constellation context is neither attached nor explicitly absent."
    ),
    finalHandoffMemoryReusePreflightCheck(packet),
    finalHandoffPrBodyChecklistPreflightCheck(packet),
    finalHandoffCodexResultReviewPacketPreflightCheck(packet),
    finalPreflightCheck(
      "no_forbidden_control_labels",
      !hasForbiddenControlLabel(packetText),
      "No execution, send, merge, publish, proof/evidence write, retry, replay, deploy, or external-posting control labels are present.",
      "A forbidden execution/write control label is present."
    ),
    finalPreflightCheck(
      "structured_json_block",
      Boolean(structuredBlock.value) && !structuredBlock.error,
      "Structured JSON block is present and parseable.",
      structuredBlock.error ?? "Structured JSON block is missing or malformed."
    ),
  ];

  if (structuredBlock.value) {
    checks.push(
      finalPreflightCheck(
        "structured_json_schema",
        nonEmptyString(structuredBlock.value.schema) === CODEX_HANDOFF_JSON_SCHEMA,
        "Structured JSON block keeps the existing handoff preview schema for parser compatibility.",
        "Structured JSON block schema is missing or incompatible.",
        "warn"
      )
    );
  }

  const hasFail = checks.some((check) => check.status === "fail");
  const hasWarn = checks.some((check) => check.status === "warn");
  const status = hasFail ? "fail" : hasWarn ? "warn" : "pass";
  return {
    preflight_type: "final_handoff_preflight",
    status,
    summary:
      status === "pass"
        ? "Final handoff packet passes local read-only preflight."
        : status === "warn"
          ? "Final handoff packet has local preflight warnings."
          : "Final handoff packet failed local preflight.",
    checks,
    checked_packet_type: packet.packet_type,
    checker: "app_local_final_handoff_preview_checker",
    local_only: true,
    pure: true,
    did_not_spawn_shell_or_npm: true,
    did_not_call_runtime: true,
    did_not_call_github_openai_or_provider: true,
    did_not_record_proof_or_evidence: true,
    did_not_execute_codex: true,
  };
}

function buildFinalHandoffReadinessSummary(
  packet: FinalCodexHandoffPacket,
  preflight: FinalHandoffPreflight
): FinalHandoffReadinessSummary {
  const preRunChecks = preflight.checks.filter((check) => check.id !== "codex_result_review_packet_state");
  const hasPreRunFail = preRunChecks.some((check) => check.status === "fail" || check.status === "unavailable");
  const hasPreRunWarn = preRunChecks.some((check) => check.status === "warn");
  const preRunReadiness: FinalHandoffReadinessSummary["pre_run_handoff_readiness"] =
    preflight.status === "unavailable"
      ? "unavailable"
      : hasPreRunFail
        ? "blocked"
        : hasPreRunWarn
          ? "needs_attention"
          : "ready";

  const reviewPacket = packet.codex_result_review_packet_preview;
  const postRunReadiness: FinalHandoffReadinessSummary["post_run_result_review_readiness"] =
    reviewPacket.status === "preview_ready"
      ? reviewPacket.review_recommendation
      : reviewPacket.status === "needs_result_input" || reviewPacket.status === "not_provided"
        ? "needs_result_input"
        : "unavailable";

  const explanation =
    preRunReadiness === "ready" && postRunReadiness === "needs_result_input"
      ? "Result review is waiting for a Codex final report or structured result payload. This does not mean the pre-run handoff packet is broken."
      : postRunReadiness === "ready_for_human_review"
        ? "Post-run result review has input and is ready for human review; keep the overall local preflight status visible for any remaining warnings."
        : preRunReadiness === "blocked"
          ? "Pre-run handoff preparation has a blocking local preflight finding; fix that before using the packet."
          : preRunReadiness === "needs_attention"
            ? "Pre-run handoff preparation has local preflight warnings that should be reviewed before using the packet."
            : "Readiness summary separates handoff preparation from post-run result review input while preserving the overall local preflight status.";

  return {
    summary_type: "final_handoff_readiness_summary",
    pre_run_handoff_readiness: preRunReadiness,
    post_run_result_review_readiness: postRunReadiness,
    overall_local_preflight_status: preflight.status,
    result_review_status: reviewPacket.status,
    result_review_source: reviewPacket.result_source,
    explanation,
    pre_run_check_ids: preRunChecks.map((check) => check.id),
    post_run_check_id: "codex_result_review_packet_state",
    ...FINAL_HANDOFF_READINESS_BOUNDARY_COPY,
    boundary_text: [FINAL_HANDOFF_READINESS_BOUNDARY_COPY.default_boundary_summary],
  };
}

function buildCodexExecutionRequestPreview(packet: FinalCodexHandoffPacket): CodexExecutionRequestPreview {
  const prBodyChecklistPresent =
    packet.pr_body_checklist_preview.status === "preview_only" &&
    packet.codex_pr_body_checklist.status === "preview_only" &&
    packet.handoff_automation_slots.pr_body_checklist.generated === true &&
    packet.handoff_automation_slots.pr_body_checklist.inert === true;
  const closeoutSkeletonPresent =
    packet.codex_closeout_skeleton.status === "preview_only" &&
    packet.codex_closeout_skeleton.generated === true &&
    packet.final_handoff_closeout_skeleton.status === "preview_only";

  return {
    preview_type: "codex_execution_request_preview",
    status: "preview_only",
    confirmation_status: "awaiting_user_confirmation",
    source_final_handoff_packet: {
      packet_type: packet.packet_type,
      schema: packet.schema,
      packet_ref: packet.work_id ? `final_codex_handoff_packet:${packet.work_id}` : "final_codex_handoff_packet:missing_work_id",
      composition_status: packet.composition_status,
      copyable_handoff_text_unchanged: true,
    },
    work_id: packet.work_id,
    scope: packet.work_scope,
    selected_constellation_context_status: packet.constellation_context_status,
    memory_reuse_status: packet.memory_reuse_attachment_proposal.status,
    expected_files: packet.expected_files,
    expected_checks: packet.expected_checks,
    pr_body_checklist_present: prBodyChecklistPresent,
    closeout_skeleton_present: closeoutSkeletonPresent,
    result_review_packet_expected_after_run: true,
    result_review_packet_status_before_run: packet.codex_result_review_packet_preview.status,
    required_user_confirmation_fields: CODEX_EXECUTION_REQUEST_PREVIEW_REQUIRED_CONFIRMATION_FIELDS,
    ...CODEX_EXECUTION_REQUEST_BOUNDARY_COPY,
    non_authorities: [CODEX_EXECUTION_REQUEST_BOUNDARY_COPY.default_boundary_summary],
    non_authority_diagnostics: CODEX_EXECUTION_REQUEST_BOUNDARY_COPY.boundary_diagnostics,
    boundary_text: [CODEX_EXECUTION_REQUEST_BOUNDARY_COPY.default_boundary_summary],
  };
}

function isCompletedWorkStatus(status: string): boolean {
  return ["completed", "done", "cancelled", "canceled", "archived"].includes(status.trim().toLowerCase());
}

function countLinkedStrings(record: Record<string, unknown>, key: string): number {
  return stringArrayFromUnknown(record[key]).length;
}

function buildWorkPickerCard(scope: string, workItems: WorkItem[]): WorkPickerCard {
  const recommendedItem = workItems.find((item) => !isCompletedWorkStatus(item.status)) ?? workItems[0] ?? null;
  const hasExactlyOneCandidate = workItems.length === 1;
  const selectionReason = recommendedItem
    ? hasExactlyOneCandidate
      ? "Only work item found for this scope."
      : !isCompletedWorkStatus(recommendedItem.status)
        ? "First active work item for this scope."
        : "First work item returned for this scope."
    : "No work items found for this scope.";
  const handoffToolHint =
    "When a user asks for a project handoff and no workId is known, list work items first, then call augnes_get_work_brief with the selected or recommended workId.";
  const nextActionHint = recommendedItem
    ? `Open the recommended work with augnes_get_work_brief using workId: ${recommendedItem.work_id}.`
    : "No work items found for this scope. Check the scope or select/create a work item elsewhere before opening a handoff card.";

  return {
    card_type: "work_picker_card",
    title: "Choose a work item",
    scope,
    candidate_count: workItems.length,
    recommended_work_id: recommendedItem?.work_id ?? null,
    recommended_work_title: recommendedItem?.title ?? null,
    selection_reason: selectionReason,
    next_action_hint: nextActionHint,
    handoff_tool_hint: handoffToolHint,
    empty_state: workItems.length
      ? null
      : "No work items found for this scope. Check the scope or select/create a work item elsewhere.",
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
        handoff_instruction: `Open this work with augnes_get_work_brief using workId: ${item.work_id}.`,
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
      codex_execution: false,
      branch_or_pr_creation: false,
      proof_recording: false,
      evidence_recording: false,
      provider_calls: false,
      github_calls: false,
      persistence: false,
    },
    ...WORK_PICKER_BOUNDARY_COPY,
    boundary_text: [WORK_PICKER_BOUNDARY_COPY.default_boundary_summary],
  };
}

function buildWorkContractCard(brief: WorkBrief): WorkContractCard {
  const codexHandoff = brief.codex_handoff as typeof brief.codex_handoff & Record<string, unknown>;
  const workLinks = brief.work.links as Record<string, unknown>;
  const constellationContext = buildWorkContractConstellationContextFromBrief(brief);
  const expectedFiles = firstStringArray(codexHandoff.expected_files, workLinks.expected_files);
  const expectedChecks = firstStringArray(
    codexHandoff.expected_checks,
    codexHandoff.suggested_verification,
    codexHandoff.verification_commands,
    workLinks.expected_checks
  );
  const relatedStateKeys = firstStringArray(brief.related_state_keys, brief.work.related_state_keys);
  const actionIds = stringArrayFromUnknown(brief.related_proof.action_ids);
  const prs = stringArrayFromUnknown(brief.related_proof.prs);
  const docs = stringArrayFromUnknown(brief.related_proof.docs);
  const nextStep =
    nonEmptyString(brief.next_action) ??
    nonEmptyString(brief.work.next_action) ??
    nonEmptyString(codexHandoff.task_brief) ??
    "No current or next step is listed in the work brief.";
  const proofSummary =
    actionIds.length || prs.length || docs.length
      ? `${actionIds.length} linked action ID(s), ${prs.length} PR ref(s), ${docs.length} doc ref(s).`
      : "No linked proof/action IDs are listed in the work brief.";
  const proofEvidenceSummary = expectedChecks.length
    ? `Expected verification is listed as ${expectedChecks.length} check(s); proof and evidence remain separate from approval.`
    : "No proof/evidence expectation is listed in the work brief; proof and evidence remain separate from approval.";

  return {
    card_type: "work_contract_card",
    title: "Work Contract Card",
    scope: brief.scope,
    work_id: brief.work_id,
    work_title: brief.work.title,
    work_status: brief.work.status,
    priority: brief.work.priority,
    current_or_next_step: nextStep,
    expected_files: expectedFiles,
    expected_files_summary: expectedFiles.length
      ? `${expectedFiles.length} expected file(s) listed.`
      : "No expected files are listed in the work brief.",
    expected_checks: expectedChecks,
    expected_checks_summary: expectedChecks.length
      ? `${expectedChecks.length} expected check(s) listed.`
      : "No expected checks are listed in the work brief.",
    related_state_keys: relatedStateKeys,
    related_state_keys_summary: relatedStateKeys.length
      ? `${relatedStateKeys.length} related state key(s) listed.`
      : "No related state keys are listed in the work brief.",
    recent_events_count: brief.recent_events.length,
    linked_proof_action_ids_count: actionIds.length,
    linked_prs_count: prs.length,
    linked_docs_count: docs.length,
    linked_proof_summary: proofSummary,
    proof_evidence_expectation_summary: proofEvidenceSummary,
    skipped_check_expectation_summary:
      "Skipped checks must be reported with concrete reasons; no per-check skipped expectation is listed in the work brief.",
    ...WORK_CONTRACT_BOUNDARY_COPY,
    authority_boundary_text: [WORK_CONTRACT_BOUNDARY_COPY.default_boundary_summary],
    constellation_context: constellationContext,
    source: {
      tool: "augnes_get_work_brief",
      structured_content: "brief",
      state_brief: "not fetched by this card",
    },
    boundaries: {
      read_only: true,
      state_commit_or_reject: false,
      codex_execution: false,
      approval_authority: false,
      publish_authority: false,
      retry_authority: false,
      replay_authority: false,
      external_posting: false,
      merge_authority: false,
      auto_merge_authority: false,
      proof_recording: false,
      evidence_recording: false,
      durable_approval: "user/Core gated",
    },
  };
}

function buildCodexHandoffPreview(brief: WorkBrief, card: WorkContractCard): CodexHandoffPreview {
  const codexHandoff = brief.codex_handoff as typeof brief.codex_handoff & Record<string, unknown>;
  const workLinks = brief.work.links as Record<string, unknown>;
  const scope = nonEmptyString(card.scope);
  const workId = nonEmptyString(card.work_id);
  const workTitle = nonEmptyString(card.work_title);
  const workStatus = nonEmptyString(card.work_status);
  const workNextAction = nonEmptyString(card.current_or_next_step);
  const taskProfile = inferTaskProfile(card.expected_files, card.expected_checks, workNextAction);
  const evidenceRecording = handoffSettingFromBoolean(
    booleanFromUnknown(
      codexHandoff.evidence_recording_allowed,
      codexHandoff.evidence_allowed,
      codexHandoff.record_evidence,
      workLinks.evidence_recording_allowed
    )
  );
  const proofOnlyCloseout = handoffSettingFromBoolean(
    booleanFromUnknown(
      codexHandoff.proof_only_closeout_allowed,
      codexHandoff.proof_recording_allowed,
      codexHandoff.record_proof,
      workLinks.proof_only_closeout_allowed
    )
  );
  const browserVerification = browserVerificationForProfile(taskProfile);
  const readinessReasons: string[] = [];
  const blockingReasons: string[] = [];

  if (!scope) blockingReasons.push("Scope is missing.");
  if (!workId) blockingReasons.push("Work ID is missing.");
  if (workStatus && /blocked/i.test(workStatus)) blockingReasons.push("Work item status is blocked.");
  if (taskProfile === "unknown") readinessReasons.push("Task profile needs user/Core confirmation.");
  if (card.expected_files.length === 0) readinessReasons.push("Expected files are not listed in the work brief.");
  if (card.expected_checks.length === 0) readinessReasons.push("Expected checks are not listed in the work brief.");
  if (evidenceRecording === "needs_user_core_confirmation") {
    readinessReasons.push("Evidence recording needs user/Core confirmation.");
  }
  if (proofOnlyCloseout === "needs_user_core_confirmation") {
    readinessReasons.push("Proof-only closeout needs user/Core confirmation.");
  }
  if (browserVerification === "needs_user_core_confirmation") {
    readinessReasons.push("Browser verification needs user/Core confirmation.");
  }

  const readinessStatus =
    blockingReasons.length > 0 ? "blocked" : readinessReasons.length > 0 ? "needs_user_core_input" : "ready";
  const previewWithoutPacket = {
    preview_type: "codex_handoff_preview",
    title: "Codex Handoff Preview",
    readiness_status: readinessStatus,
    readiness_reasons: blockingReasons.length > 0 ? blockingReasons : readinessReasons.length > 0 ? readinessReasons : ["Required handoff fields are present in the work brief."],
    task_profile: taskProfile,
    runtime_endpoint_label: runtimeEndpointLabelFromBrief(brief, codexHandoff),
    scope,
    work_id: workId,
    work_title: workTitle,
    work_status: workStatus,
    work_next_action: workNextAction,
    related_state_keys: card.related_state_keys,
    expected_files: card.expected_files,
    expected_checks: card.expected_checks,
    evidence_recording: evidenceRecording,
    proof_only_closeout: proofOnlyCloseout,
    browser_verification: browserVerification,
    forbidden_actions: CODEX_HANDOFF_PREVIEW_DEFAULT_FORBIDDEN_ACTIONS,
    stop_conditions: CODEX_HANDOFF_PREVIEW_STOP_CONDITIONS,
    constellation_context: card.constellation_context,
    ...CODEX_HANDOFF_BOUNDARY_COPY,
    boundary_text: [CODEX_HANDOFF_BOUNDARY_COPY.default_boundary_summary],
  } satisfies Omit<CodexHandoffPreview, "copyable_handoff_text">;

  return {
    ...previewWithoutPacket,
    copyable_handoff_text: buildCopyableHandoffText(previewWithoutPacket),
  };
}

function describeWorkContractCard(card: WorkContractCard): string {
  return [
    `Work Contract Card for ${card.work_id}: ${card.work_title}. Status ${card.work_status}, priority ${card.priority}, ${card.recent_events_count} recent event(s), ${card.linked_proof_action_ids_count} linked action ID(s).`,
    card.default_boundary_summary,
  ].join(" ");
}

function describeWorkEventSpineTimeline(timeline: WorkEventSpineTimeline): string {
  if (timeline.event_count === 0) {
    return `${WORK_EVENT_SPINE_TIMELINE_EMPTY_STATE} Work event spine timeline is read-only.`;
  }

  return `Work event spine timeline for ${timeline.work_id} has ${timeline.event_count} coordination event(s), sorted ${timeline.sort_order}. Event inspector details are read-only.`;
}

function describeCodexHandoffPreview(preview: CodexHandoffPreview): string {
  return [
    `Codex Handoff Preview for ${preview.work_id ?? "unknown work"} is ${preview.readiness_status}. Task profile ${preview.task_profile}; browser verification ${preview.browser_verification}.`,
    preview.default_boundary_summary,
  ].join(" ");
}

function describeFinalCodexHandoffPacket(packet: FinalCodexHandoffPacket, preflight: FinalHandoffPreflight): string {
  return [
    `Final Codex Handoff Packet for ${packet.work_id ?? "unknown work"} is ${packet.composition_status}; local preflight status ${preflight.status}; Memory Reuse attachment ${packet.memory_reuse_attachment_proposal.status}.`,
    packet.default_boundary_summary,
  ].join(" ");
}

function describeCodexHandoffDraft(workId: string, handoffId: string): string {
  return [
    `Generated Codex handoff draft ${handoffId} for ${workId}.`,
    "This is a guidance packet only: it does not execute Codex, mark the handoff ready or delivered, commit or reject Augnes state, or publish externally.",
  ].join(" ");
}

function describeCodexResultReviewDraft(handoffId: string, status: string, kind: string): string {
  return [
    `Created Codex result review draft for ${handoffId}; recommended ${status}/${kind}.`,
    "This is review/draft only: it does not execute Codex, does not record proof, does not commit or reject Augnes state, and does not publish externally.",
  ].join(" ");
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

const PROJECT_CONSTELLATION_HANDOFF_BOUNDARY_TEXT = [
  "This preview is read-only.",
  "This preview cannot execute Codex.",
  "This preview cannot record proof or evidence.",
  "This preview cannot commit or reject Augnes state.",
  "This preview cannot create branches or PRs.",
  "This preview cannot approve, publish, retry, replay, externally post, merge, deploy, or enable auto-merge.",
  "Evidence pointers are pointer-only.",
  "Next action candidates are advisory.",
  "A copied handoff seed is manual preview text only.",
  "Durable approval remains user/Core gated.",
] as const;

const PROJECT_CONSTELLATION_REQUIRED_CHECKS = [
  "npm run typecheck",
  "npm --prefix apps/augnes_apps run typecheck",
  "npm run smoke:chatgpt-constellation-preview-surface",
  "npm run smoke:chatgpt-work-contract-card",
  "npm run smoke:readonly-api-route-constellation-preview",
  "git diff --check",
] as const;

const PROJECT_CONSTELLATION_FINAL_REPORT_REQUIREMENTS = [
  "Changed files",
  "Verification results",
  "Skipped checks with concrete reasons",
  "Remaining caveats",
] as const;

type ConstellationProject = ConstellationPreviewResult["project_constellation"];
type ConstellationEvidencePointer = ConstellationPreviewResult["evidence_pointers"][number];
type ConstellationTension = ConstellationPreviewResult["unresolved_tensions"][number];
type ConstellationNextAction = ConstellationPreviewResult["next_action_candidates"][number];
type ConstellationSourceRef = ConstellationPreviewResult["source_refs"][number];

type ProjectConstellationSelectionStatus = "selected" | "defaulted" | "requested_not_found" | "unavailable";

type ProjectConstellationHandoffSelection = {
  requested_candidate_id: string | null;
  selected_candidate_id: string | null;
  selected_candidate_label: string | null;
  selection_status: ProjectConstellationSelectionStatus;
  selection_fallback_reason: string | null;
};

type ProjectConstellationHandoffSeed = {
  seed_type: "project_constellation_codex_handoff_seed";
  status: "available" | "unavailable";
  requested_candidate_id: string | null;
  selected_candidate_id: string | null;
  selected_candidate_label: string | null;
  selection_status: ProjectConstellationSelectionStatus;
  selection_fallback_reason: string | null;
  selection: ProjectConstellationHandoffSelection;
  preview_text: string;
  source_refs: string[];
  required_checks: readonly string[];
  skipped_check_policy: string;
  final_report_requirements: readonly string[];
  boundary_text: readonly string[];
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
  selection: ProjectConstellationHandoffSelection;
  copyable_handoff_seed: ProjectConstellationHandoffSeed;
  source_refs: ConstellationSourceRef[];
  missing_data_fallbacks: string[];
  boundaries: {
    read_only: true;
    local_route_read: true;
    state_commit_or_reject: false;
    codex_execution: false;
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

function listForHandoff(items: string[], fallback: string): string {
  return items.length ? items.map((item) => `- ${item}`).join("\n") : `- ${fallback}`;
}

function summarizeEvidencePointer(pointer: ConstellationEvidencePointer): string {
  return `${pointer.pointer_id}: ${pointer.label} -> ${pointer.target_ref}`;
}

function summarizeTension(tension: ConstellationTension): string {
  return `${tension.tension_id}: ${tension.summary}`;
}

function summarizeNextAction(action: ConstellationNextAction): string {
  return `${action.candidate_id}: ${action.summary}`;
}

function normalizeRequestedCandidateId(value?: string | null): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function resolveProjectConstellationHandoffSelection(input: {
  nextActionCandidates: ConstellationNextAction[];
  requestedCandidateId?: string | null;
  fallbackText: string | null;
}): ProjectConstellationHandoffSelection {
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

function buildProjectConstellationHandoffSeed(input: {
  scope: string;
  projectConstellation: ConstellationProject;
  evidencePointers: ConstellationEvidencePointer[];
  unresolvedTensions: ConstellationTension[];
  nextActionCandidates: ConstellationNextAction[];
  sourceRefs: ConstellationSourceRef[];
  requestedCandidateId?: string | null;
  fallbackText: string | null;
}): ProjectConstellationHandoffSeed {
  const selection = resolveProjectConstellationHandoffSelection({
    nextActionCandidates: input.nextActionCandidates,
    requestedCandidateId: input.requestedCandidateId,
    fallbackText: input.fallbackText,
  });
  const selectedCandidate = selection.selected_candidate_id
    ? input.nextActionCandidates.find((candidate) => candidate.candidate_id === selection.selected_candidate_id) ?? null
    : null;
  const status = input.fallbackText ? "unavailable" : "available";
  const sourceRefs = input.sourceRefs.map((sourceRef) => sourceRef.source_ref);
  const previewText = input.fallbackText
    ? [
        "Augnes Project Constellation handoff seed",
        "This is fallback preview text only. It does not invent missing context and does not execute Codex.",
        "",
        `Scope: ${input.scope}`,
        `Fallback: ${input.fallbackText}`,
        "",
        "Selection status",
        `- Status: ${selection.selection_status}`,
        `- Requested candidate: ${selection.requested_candidate_id ?? "none"}`,
        `- Selected candidate: ${selection.selected_candidate_id ?? "none"}`,
        selection.selection_fallback_reason ? `- Fallback: ${selection.selection_fallback_reason}` : "- Fallback: none",
        "",
        "Next step",
        "- Check that the local Augnes runtime is available, then rerun the read-only App/MCP preview tool.",
        "",
        "Authority boundaries",
        listForHandoff([...PROJECT_CONSTELLATION_HANDOFF_BOUNDARY_TEXT], "No boundary text listed."),
      ].join("\n")
    : [
        "Augnes Project Constellation handoff seed",
        "This is manual preview text for a separate user-started Codex task. It does not execute Codex.",
        "",
        "Repository",
        "- hynk-studio/augnes",
        "- Base: main",
        `- Scope: ${input.scope}`,
        "",
        "Project thesis",
        input.projectConstellation.thesis,
        "",
        "Selected/default advisory next action",
        selectedCandidate ? `- ${summarizeNextAction(selectedCandidate)}` : "- No advisory next action candidate was returned.",
        "",
        "Selection status",
        `- Status: ${selection.selection_status}`,
        `- Requested candidate: ${selection.requested_candidate_id ?? "none"}`,
        `- Selected candidate: ${selection.selected_candidate_id ?? "none"}`,
        selection.selection_fallback_reason ? `- Fallback: ${selection.selection_fallback_reason}` : "- Fallback: none",
        "",
        "Bounded node summaries",
        listForHandoff(
          input.projectConstellation.nodes.map((node) => `${node.id}: ${node.label} - ${node.summary}`),
          "No node summaries were returned."
        ),
        "",
        "Bounded edge summaries",
        listForHandoff(
          input.projectConstellation.edges.map((edge) => `${edge.id}: ${edge.source} -> ${edge.target} - ${edge.summary}`),
          "No edge summaries were returned."
        ),
        "",
        "Bounded cluster summaries",
        listForHandoff(
          input.projectConstellation.clusters.map((cluster) => `${cluster.id}: ${cluster.label} - ${cluster.cluster_thesis}`),
          "No cluster summaries were returned."
        ),
        "",
        "Pointer-only evidence refs",
        listForHandoff(input.evidencePointers.map(summarizeEvidencePointer), "No evidence pointers were returned."),
        "",
        "Unresolved tensions",
        listForHandoff(input.unresolvedTensions.map(summarizeTension), "No unresolved tensions were returned."),
        "",
        "Required checks",
        listForHandoff([...PROJECT_CONSTELLATION_REQUIRED_CHECKS], "No required checks listed."),
        "",
        "Skipped check policy",
        "- Report every skipped check with a concrete reason.",
        "",
        "Final report requirements",
        listForHandoff([...PROJECT_CONSTELLATION_FINAL_REPORT_REQUIREMENTS], "No final report requirements listed."),
        "",
        "Authority boundaries",
        listForHandoff([...PROJECT_CONSTELLATION_HANDOFF_BOUNDARY_TEXT], "No boundary text listed."),
        "",
        "Source refs",
        listForHandoff(sourceRefs, "No source refs were returned."),
      ].join("\n");

  return {
    seed_type: "project_constellation_codex_handoff_seed",
    status,
    requested_candidate_id: selection.requested_candidate_id,
    selected_candidate_id: selectedCandidate?.candidate_id ?? null,
    selected_candidate_label: selectedCandidate?.label ?? null,
    selection_status: selection.selection_status,
    selection_fallback_reason: selection.selection_fallback_reason,
    selection,
    preview_text: previewText,
    source_refs: sourceRefs,
    required_checks: PROJECT_CONSTELLATION_REQUIRED_CHECKS,
    skipped_check_policy: "Report every skipped check with a concrete reason.",
    final_report_requirements: PROJECT_CONSTELLATION_FINAL_REPORT_REQUIREMENTS,
    boundary_text: PROJECT_CONSTELLATION_HANDOFF_BOUNDARY_TEXT,
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
  const copyableHandoffSeed = buildProjectConstellationHandoffSeed({
    scope,
    projectConstellation,
    evidencePointers,
    unresolvedTensions,
    nextActionCandidates,
    sourceRefs,
    requestedCandidateId,
    fallbackText,
  });
  const selection = copyableHandoffSeed.selection;

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
    copyable_handoff_seed: copyableHandoffSeed,
    source_refs: sourceRefs,
    missing_data_fallbacks: missingDataFallbacks,
    boundaries: {
      read_only: true,
      local_route_read: true,
      state_commit_or_reject: false,
      codex_execution: false,
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
      PROJECT_CONSTELLATION_HANDOFF_BOUNDARY_TEXT.join(" "),
    ].join(" ");
  }

  return [
    `Project Constellation preview for ${surface.scope}: ${surface.project_constellation.nodes.length} node(s), ${surface.project_constellation.edges.length} edge(s), ${surface.project_constellation.clusters.length} cluster(s), ${surface.evidence_pointers.length} pointer-only evidence ref(s), ${surface.unresolved_tensions.length} unresolved tension(s), and ${surface.next_action_candidates.length} advisory next action candidate(s).`,
    `Thesis: ${surface.project_constellation.thesis}`,
    surface.selection_status === "requested_not_found" && surface.selection_fallback_reason
      ? surface.selection_fallback_reason
      : surface.copyable_handoff_seed.selected_candidate_label
        ? `Handoff seed ${surface.selection_status === "defaulted" ? "defaults to" : "uses"} ${surface.copyable_handoff_seed.selected_candidate_label}.`
        : "No handoff seed action candidate was available.",
    PROJECT_CONSTELLATION_HANDOFF_BOUNDARY_TEXT.join(" "),
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

const HANDOFF_PREVIEW_DEFAULT_TARGET = "codex_handoff" as const;

const HANDOFF_PREVIEW_AUTHORITY_BOUNDARY_FALSE_FIELDS = [
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
  "can_create_mcp_tool",
  "can_create_ui_action",
  "can_post_external_comment",
] as const;

const HANDOFF_PREVIEW_READ_BOUNDARY_FALSE_FIELDS = [
  "handoff_send_authority",
  "codex_execution_authority",
  "codex_launch_authority",
  "branch_pr_creation_authority",
  "github_openai_provider_calls",
  "proof_evidence_writes",
  "state_memory_db_mutation",
  "publish_merge_retry_replay_deploy",
  "external_post_authority",
  "copy_export_authority",
  "suggestions_are_actions",
] as const;

function arrayCount(value: unknown): number {
  return Array.isArray(value) ? value.length : 0;
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function stringField(record: Record<string, unknown>, field: string): string | null {
  const value = record[field];
  return typeof value === "string" ? value : null;
}

function buildHandoffPreviewReadBoundary({
  route,
  marker,
}: {
  route: string;
  marker: string;
}) {
  return {
    source_route: route,
    local_readonly_marker: marker,
    preview_review_preparation_only: true,
    suggestions_are_advisory_only: true,
    unresolved_user_judgment_remains_unresolved: true,
    handoff_send_authority: false,
    codex_execution_authority: false,
    codex_launch_authority: false,
    branch_pr_creation_authority: false,
    github_openai_provider_calls: false,
    proof_evidence_writes: false,
    state_memory_db_mutation: false,
    publish_merge_retry_replay_deploy: false,
    external_post_authority: false,
    copy_export_authority: false,
    suggestions_are_actions: false,
  };
}

function restoreHandoffPreviewAuthorityBoundary(
  sanitizedAuthorityBoundary: unknown,
  sourceAuthorityBoundary: unknown
): Record<string, unknown> {
  return restoreFalseBoundaryFields(
    sanitizedAuthorityBoundary,
    sourceAuthorityBoundary,
    HANDOFF_PREVIEW_AUTHORITY_BOUNDARY_FALSE_FIELDS
  );
}

function restoreHandoffPreviewReadBoundary(
  sanitizedReadBoundary: unknown,
  sourceReadBoundary: unknown
): Record<string, unknown> {
  return restoreFalseBoundaryFields(
    sanitizedReadBoundary,
    sourceReadBoundary,
    HANDOFF_PREVIEW_READ_BOUNDARY_FALSE_FIELDS
  );
}

function summarizeHandoffPreviewSourceStatus(
  result: HandoffCapsulePreviewResult | CodexLaunchCardPreviewResult
): Record<string, unknown> {
  return objectRecord(result.source_status);
}

function summarizeHandoffPreviewAuthorityBoundary(
  sourceAuthorityBoundary: unknown,
  readBoundary: Record<string, unknown>
): Record<string, unknown> {
  return {
    authority_boundary: restoreHandoffPreviewAuthorityBoundary(
      sourceAuthorityBoundary,
      sourceAuthorityBoundary
    ),
    read_boundary: restoreHandoffPreviewReadBoundary(readBoundary, readBoundary),
    summary:
      "Preview/review preparation only: no send, no launch, no execution, no mutation, no branch/PR creation, no GitHub/OpenAI/provider calls, no proof/evidence writes, and no external post.",
  };
}

function buildHandoffCapsulePreviewSummary(result: HandoffCapsulePreviewResult) {
  const capsule = objectRecord(result.capsule);
  const staleness = objectRecord(capsule.staleness);

  return {
    title: stringField(capsule, "title"),
    target_surface: stringField(capsule, "target_surface"),
    target_actor: stringField(capsule, "target_actor"),
    handoff_intent: stringField(capsule, "handoff_intent"),
    status: stringField(capsule, "status"),
    staleness: stringField(staleness, "status"),
    source_status: summarizeHandoffPreviewSourceStatus(result),
    observed_count: arrayCount(capsule.observed_context),
    inferred_count: arrayCount(capsule.inferred_context),
    suggested_count: arrayCount(capsule.suggested_context),
    needs_user_judgment_count: arrayCount(capsule.needs_user_judgment),
    warning_count: arrayCount(result.warnings),
    gap_count: arrayCount(result.gaps),
  };
}

function buildCodexLaunchCardPreviewSummary(result: CodexLaunchCardPreviewResult) {
  const launchCard = objectRecord(result.launch_card);

  return {
    repo: stringField(launchCard, "repo"),
    base_branch: stringField(launchCard, "base_branch"),
    branch_suggestion: stringField(launchCard, "branch_suggestion"),
    expected_pr_title: stringField(launchCard, "expected_pr_title"),
    task_goal: stringField(launchCard, "task_goal"),
    task_summary: stringField(launchCard, "task_summary"),
    status: stringField(launchCard, "status"),
    source_status: summarizeHandoffPreviewSourceStatus(result),
    observed_count: arrayCount(launchCard.observed_context),
    inferred_count: arrayCount(launchCard.inferred_context),
    suggestions_for_codex_count: arrayCount(launchCard.suggestions_for_codex),
    unresolved_user_judgment_count: arrayCount(launchCard.unresolved_user_judgment),
    expected_file_count: arrayCount(launchCard.expected_files),
    forbidden_file_count: arrayCount(launchCard.forbidden_files),
    required_check_count: arrayCount(launchCard.required_checks),
    warning_count: arrayCount(result.warnings),
    gap_count: arrayCount(result.gaps),
  };
}

function buildHandoffCapsulePreviewStructuredContent({
  result,
  compact,
}: {
  result: HandoffCapsulePreviewResult;
  compact: boolean | undefined;
}): Record<string, unknown> {
  const capsule = objectRecord(result.capsule);
  const readBoundary = buildHandoffPreviewReadBoundary({
    route: "GET /api/augnes/read/handoff-capsule",
    marker: "x-augnes-local-readonly: handoff-capsule-v0.1",
  });
  const summary = buildHandoffCapsulePreviewSummary(result);
  const structuredContent = sanitizePayload({
    profile: config.appProfile,
    panel: "handoff_capsule_preview",
    packet_label: "Handoff Capsule preview",
    scope: result.scope,
    route_id: result.route_id,
    route_family: result.route_family,
    compact: compact ?? true,
    capsule: result.capsule,
    handoff_capsule: result.capsule,
    capsule_summary: summary,
    observed_context: capsule.observed_context ?? [],
    inferred_context: capsule.inferred_context ?? [],
    suggested_context: capsule.suggested_context ?? [],
    needs_user_judgment: capsule.needs_user_judgment ?? [],
    selected_delta_refs: capsule.selected_delta_refs ?? [],
    validation_expectations: capsule.validation_expectations ?? {},
    forbidden_actions: capsule.forbidden_actions ?? [],
    source_status: result.source_status,
    public_safety: capsule.public_safety ?? {},
    warnings: result.warnings ?? [],
    gaps: result.gaps ?? [],
    authority_boundary: capsule.authority_boundary,
    route_authority_boundary: result.route_authority_boundary,
    read_boundary: readBoundary,
    route_boundary: readBoundary,
    boundary_summary:
      "No send, no launch, no execution, no mutation, no branch/PR creation, no GitHub/OpenAI/provider calls, no proof/evidence writes, no external post.",
  }) as Record<string, unknown>;

  structuredContent.authority_boundary = restoreHandoffPreviewAuthorityBoundary(
    structuredContent.authority_boundary,
    capsule.authority_boundary
  );
  structuredContent.read_boundary = restoreHandoffPreviewReadBoundary(
    structuredContent.read_boundary,
    readBoundary
  );
  structuredContent.route_boundary = restoreHandoffPreviewReadBoundary(
    structuredContent.route_boundary,
    readBoundary
  );
  structuredContent.authority_boundary_summary = summarizeHandoffPreviewAuthorityBoundary(
    capsule.authority_boundary,
    readBoundary
  );

  for (const capsuleKey of ["capsule", "handoff_capsule"] as const) {
    const sanitizedCapsule = objectRecord(structuredContent[capsuleKey]);
    structuredContent[capsuleKey] = {
      ...sanitizedCapsule,
      authority_boundary: restoreHandoffPreviewAuthorityBoundary(
        sanitizedCapsule.authority_boundary,
        capsule.authority_boundary
      ),
    };
  }

  return structuredContent;
}

function buildCodexLaunchCardPreviewStructuredContent({
  result,
  compact,
}: {
  result: CodexLaunchCardPreviewResult;
  compact: boolean | undefined;
}): Record<string, unknown> {
  const launchCard = objectRecord(result.launch_card);
  const readBoundary = buildHandoffPreviewReadBoundary({
    route: "GET /api/augnes/read/codex-launch-card",
    marker: "x-augnes-local-readonly: codex-launch-card-v0.1",
  });
  const summary = buildCodexLaunchCardPreviewSummary(result);
  const structuredContent = sanitizePayload({
    profile: config.appProfile,
    panel: "codex_launch_card_preview",
    packet_label: "Codex Launch Card preview",
    scope: result.scope,
    route_id: result.route_id,
    route_family: result.route_family,
    compact: compact ?? true,
    launch_card: result.launch_card,
    codex_launch_card: result.launch_card,
    launch_card_summary: summary,
    observed_context: launchCard.observed_context ?? [],
    inferred_context: launchCard.inferred_context ?? [],
    suggestions_for_codex: launchCard.suggestions_for_codex ?? [],
    unresolved_user_judgment: launchCard.unresolved_user_judgment ?? [],
    expected_files: launchCard.expected_files ?? [],
    forbidden_files: launchCard.forbidden_files ?? [],
    required_checks: launchCard.required_checks ?? [],
    optional_checks: launchCard.optional_checks ?? [],
    skipped_check_policy: launchCard.skipped_check_policy ?? [],
    pr_body_requirements: launchCard.pr_body_requirements ?? [],
    final_report_requirements: launchCard.final_report_requirements ?? [],
    proof_evidence_boundary: launchCard.proof_evidence_boundary ?? [],
    source_status: result.source_status,
    public_safety: launchCard.public_safety ?? {},
    warnings: result.warnings ?? [],
    gaps: result.gaps ?? [],
    authority_boundary: launchCard.authority_boundary,
    route_authority_boundary: result.route_authority_boundary,
    read_boundary: readBoundary,
    route_boundary: readBoundary,
    boundary_summary:
      "Not Codex execution, not branch creation, not PR creation, not a launch action, no GitHub/OpenAI/provider calls, no proof/evidence writes, no state/memory/DB mutation.",
  }) as Record<string, unknown>;

  structuredContent.authority_boundary = restoreHandoffPreviewAuthorityBoundary(
    structuredContent.authority_boundary,
    launchCard.authority_boundary
  );
  structuredContent.read_boundary = restoreHandoffPreviewReadBoundary(
    structuredContent.read_boundary,
    readBoundary
  );
  structuredContent.route_boundary = restoreHandoffPreviewReadBoundary(
    structuredContent.route_boundary,
    readBoundary
  );
  structuredContent.authority_boundary_summary = summarizeHandoffPreviewAuthorityBoundary(
    launchCard.authority_boundary,
    readBoundary
  );

  for (const launchCardKey of ["launch_card", "codex_launch_card"] as const) {
    const sanitizedLaunchCard = objectRecord(structuredContent[launchCardKey]);
    structuredContent[launchCardKey] = {
      ...sanitizedLaunchCard,
      authority_boundary: restoreHandoffPreviewAuthorityBoundary(
        sanitizedLaunchCard.authority_boundary,
        launchCard.authority_boundary
      ),
    };
  }

  return structuredContent;
}

function describeHandoffCapsulePreview(result: HandoffCapsulePreviewResult): string {
  const summary = buildHandoffCapsulePreviewSummary(result);

  return [
    `Handoff Capsule preview loaded for scope ${result.scope}: ${summary.observed_count} observed, ${summary.inferred_count} inferred, ${summary.suggested_count} suggested, and ${summary.needs_user_judgment_count} needs_user_judgment item(s).`,
    `${summary.warning_count} warning(s), ${summary.gap_count} gap(s).`,
    `Status: ${summary.status ?? "unknown"}; target: ${summary.target_surface ?? "unknown"}.`,
    "Preview/review preparation only.",
    "Suggestions are advisory only.",
    "Unresolved user judgment remains unresolved.",
    "Read-only tool: no handoff send, no Codex launch or execution, no GitHub/OpenAI/provider calls, no branch/PR creation, no proof/evidence writes, no state/memory/DB/work/Perspective mutation, no publish/merge/retry/replay/deploy/external post.",
  ].join(" ");
}

function describeCodexLaunchCardPreview(result: CodexLaunchCardPreviewResult): string {
  const summary = buildCodexLaunchCardPreviewSummary(result);

  return [
    `Codex Launch Card preview loaded for scope ${result.scope}: repo ${summary.repo ?? "unknown"}, base ${summary.base_branch ?? "unknown"}, ${summary.expected_file_count} expected file hint(s), ${summary.required_check_count} required check hint(s), and ${summary.unresolved_user_judgment_count} unresolved user judgment item(s).`,
    `${summary.warning_count} warning(s), ${summary.gap_count} gap(s).`,
    `Status: ${summary.status ?? "unknown"}; no status may mean executed.`,
    "Suggestions for Codex are advisory only.",
    "Unresolved user judgment remains unresolved.",
    "This is not Codex execution, not branch creation, not PR creation, not a launch action, and not handoff send.",
    "Read-only tool: no GitHub/OpenAI/provider calls, no proof/evidence writes, no state/memory/DB/work/Perspective mutation, no publish/merge/retry/replay/deploy/external post.",
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
        "Show a read-only Work Picker for a project scope so the user can choose a work item before opening the Codex handoff card.",
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
          handoff_tool_hint: workPickerCard.handoff_tool_hint,
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
      description: "Return a ChatGPT-friendly work packet with current metadata, recent events, proof links, Codex handoff, and optional read-only user-provided Codex result import preview.",
      inputSchema: {
        scope: z.string().min(1).optional(),
        workId: z.string().min(1),
        codexResult: CodexResultImportInputSchema.optional(),
        codexResultInput: CodexResultImportInputSchema.optional(),
        codex_result: CodexResultImportInputSchema.optional(),
        codexResultText: z.string().min(1).optional(),
        codex_result_text: z.string().min(1).optional(),
        codexResultPaste: z.string().min(1).optional(),
        codex_result_paste: z.string().min(1).optional(),
      },
      annotations: bridgeReadAnnotations,
      _meta: widgetToolMeta,
    },
    async ({
      scope,
      workId,
      codexResult,
      codexResultInput,
      codex_result,
      codexResultText,
      codex_result_text,
      codexResultPaste,
      codex_result_paste,
    }) => {
      const resolvedScope = scope ?? DEFAULT_STATE_RUNTIME_SCOPE;
      const structuredResultInput = codexResult ?? codexResultInput ?? codex_result ?? null;
      const topLevelPasteText = firstNonEmptyResultText(
        codexResultText,
        codex_result_text,
        codexResultPaste,
        codex_result_paste
      );
      const codexResultPasteNormalizerPreview = buildCodexResultPasteNormalizerPreview({
        structuredInput: structuredResultInput,
        topLevelPasteText,
      });
      const resultInput = mergeCodexResultInputWithPasteCandidate(
        structuredResultInput,
        codexResultPasteNormalizerPreview.candidate
      ).mergedInput;

      try {
        const brief = await stateRuntimeAdapter.getWorkBrief(resolvedScope, workId);
        const workContractCard = buildWorkContractCard(brief);
        const codexHandoffPreview = buildCodexHandoffPreview(brief, workContractCard);
        const memoryReuseAttachmentProposal = buildMemoryReuseAttachmentProposal(
          brief,
          workContractCard,
          codexHandoffPreview
        );
        const finalCodexHandoffPacket = buildFinalCodexHandoffPacket(
          brief,
          workContractCard,
          codexHandoffPreview,
          memoryReuseAttachmentProposal,
          resultInput,
          codexResultPasteNormalizerPreview
        );
        const coreCodexHandoffPacket = buildCoreCodexHandoffPacket(finalCodexHandoffPacket);
        const codexHandoffDecision = buildCodexHandoffDecision(coreCodexHandoffPacket);
        const finalHandoffPreflight = buildFinalHandoffPreflight(finalCodexHandoffPacket);
        const finalHandoffReadinessSummary = buildFinalHandoffReadinessSummary(
          finalCodexHandoffPacket,
          finalHandoffPreflight
        );
        const codexExecutionRequestPreview = buildCodexExecutionRequestPreview(finalCodexHandoffPacket);
        const workEventSpineTimeline = buildWorkEventSpineTimeline(brief);
        const resultReviewClosurePreview = buildResultReviewClosurePreview({
          reviewPacket: finalCodexHandoffPacket.codex_result_review_packet_preview,
          timeline: workEventSpineTimeline,
          scope: finalCodexHandoffPacket.work_scope,
          workId: finalCodexHandoffPacket.work_id,
        });
        const structuredContent = sanitizePayload({
          profile: config.appProfile,
          panel: "work_contract_card",
          brief,
          work_contract_card: workContractCard,
          work_event_spine_timeline: workEventSpineTimeline,
          coordination_event_timeline: workEventSpineTimeline,
          event_spine_timeline: workEventSpineTimeline,
          event_spine_inspector: workEventSpineTimeline.selected_event,
          codex_handoff_preview: codexHandoffPreview,
          core_codex_handoff_packet: coreCodexHandoffPacket,
          codex_core_handoff_packet: coreCodexHandoffPacket,
          core_current_task_only: coreCodexHandoffPacket.core_current_task_only,
          codex_handoff_decision: codexHandoffDecision,
          codex_handoff_recommendation: codexHandoffDecision,
          copyable_core_handoff_text: coreCodexHandoffPacket.copyable_handoff_text,
          final_codex_handoff_packet: finalCodexHandoffPacket,
          codex_final_handoff_packet: finalCodexHandoffPacket,
          full_codex_handoff_packet: finalCodexHandoffPacket,
          copyable_full_handoff_text: finalCodexHandoffPacket.copyable_handoff_text,
          execution_request_preview: codexExecutionRequestPreview,
          codex_execution_request_preview: codexExecutionRequestPreview,
          final_handoff_codex_execution_request_preview: codexExecutionRequestPreview,
          memory_reuse_attachment_proposal: memoryReuseAttachmentProposal,
          final_handoff_memory_reuse_attachment: memoryReuseAttachmentProposal,
          pr_body_checklist_preview: finalCodexHandoffPacket.pr_body_checklist_preview,
          codex_pr_body_checklist: finalCodexHandoffPacket.codex_pr_body_checklist,
          codex_closeout_skeleton: finalCodexHandoffPacket.codex_closeout_skeleton,
          final_handoff_closeout_skeleton: finalCodexHandoffPacket.final_handoff_closeout_skeleton,
          codex_result_review_packet_preview: finalCodexHandoffPacket.codex_result_review_packet_preview,
          final_handoff_codex_result_review_packet: finalCodexHandoffPacket.final_handoff_codex_result_review_packet,
          codex_pr_review_packet_preview: finalCodexHandoffPacket.codex_pr_review_packet_preview,
          codex_result_paste_normalizer_preview: finalCodexHandoffPacket.codex_result_paste_normalizer_preview,
          codex_result_normalizer_preview: finalCodexHandoffPacket.codex_result_normalizer_preview,
          normalized_codex_result_candidate: finalCodexHandoffPacket.normalized_codex_result_candidate,
          codex_result_import_input_shape: CODEX_RESULT_IMPORT_INPUT_SHAPE,
          codex_result_import_review_surface: finalCodexHandoffPacket.codex_result_review_packet_preview,
          result_review_closure_preview: resultReviewClosurePreview,
          work_result_closure_preview: resultReviewClosurePreview,
          next_action_closure: resultReviewClosurePreview,
          followup_closure_preview: resultReviewClosurePreview,
          final_handoff_preflight: finalHandoffPreflight,
          final_handoff_readiness_summary: finalHandoffReadinessSummary,
          pre_run_handoff_readiness: finalHandoffReadinessSummary.pre_run_handoff_readiness,
          post_run_result_review_readiness: finalHandoffReadinessSummary.post_run_result_review_readiness,
          overall_local_preflight_status: finalHandoffReadinessSummary.overall_local_preflight_status,
          handoff_automation_slots: finalCodexHandoffPacket.handoff_automation_slots,
          ...(workContractCard.constellation_context
            ? {
                work_contract_constellation_context: workContractCard.constellation_context,
                constellation_context: workContractCard.constellation_context,
              }
            : {}),
          boundaries: workContractCard.boundaries,
        });
        return {
          structuredContent,
          content: narrative(
            `${describeWorkBrief(brief)} ${describeWorkContractCard(workContractCard)} ${describeWorkEventSpineTimeline(workEventSpineTimeline)} ${describeResultReviewClosurePreview(resultReviewClosurePreview)} ${describeCodexHandoffPreview(codexHandoffPreview)} ${describeFinalCodexHandoffPacket(finalCodexHandoffPacket, finalHandoffPreflight)} ${codexExecutionRequestPreview.boundary_text.join(" ")}`
          ),
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
          const structuredContent = sanitizePayload({ profile: config.appProfile, brief });
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
          "Use this when the user asks to inspect the Augnes Project Constellation preview from ChatGPT. It reads the existing local read-only route and returns compact thesis, node, edge, cluster, evidence-pointer, tension, next-action, and handoff seed data without writing Augnes state or executing Codex.",
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
            copyable_handoff_seed: projectConstellationPreview.copyable_handoff_seed,
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
            copyable_handoff_seed: projectConstellationPreview.copyable_handoff_seed,
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
      "augnes_get_handoff_capsule_preview",
      {
        title: "Get Handoff Capsule preview",
        description:
          "Read-only Handoff Capsule preview tool for preview/review preparation only. It consumes the local marker-gated Handoff Capsule route, preserves Observed/Inferred/Suggested/Needs user judgment separation, treats suggestions as advisory only, leaves unresolved user judgment unresolved, does not send handoffs, does not launch or execute Codex, does not call GitHub/OpenAI/provider services, does not create branches or PRs, does not create proof/evidence records, does not mutate state, memory, DB, work, or Perspective, and does not publish, merge, retry, replay, deploy, or externally post.",
        inputSchema: HandoffCapsulePreviewToolInputSchema.shape,
        annotations: localRouteReadAnnotations,
        _meta: modelOnlyToolMeta,
      },
      async ({ scope, target, compact }) => {
        const resolvedScope = scope ?? DEFAULT_STATE_RUNTIME_SCOPE;
        const resolvedTarget = target ?? HANDOFF_PREVIEW_DEFAULT_TARGET;

        try {
          const result = await stateRuntimeAdapter.getHandoffCapsulePreview({
            scope: resolvedScope,
            target: resolvedTarget,
          });
          const structuredContent = buildHandoffCapsulePreviewStructuredContent({
            result,
            compact: compact ?? true,
          });

          return {
            structuredContent,
            content: narrative(describeHandoffCapsulePreview(result)),
            _meta: structuredContent,
          };
        } catch (error) {
          return buildBridgeToolError("augnes_get_handoff_capsule_preview", error);
        }
      }
    );

    registerAppTool(
      server,
      "augnes_get_codex_launch_card_preview",
      {
        title: "Get Codex Launch Card preview",
        description:
          "Read-only Codex Launch Card preview tool for preview/review preparation only. It consumes the local marker-gated Codex Launch Card route, preserves Observed/Inferred/Suggested/Needs user judgment separation, treats suggestions for Codex as advisory only, leaves unresolved user judgment unresolved, does not send handoffs, does not launch or execute Codex, does not call GitHub/OpenAI/provider services, does not create branches or PRs, does not create proof/evidence records, does not mutate state, memory, DB, work, or Perspective, and does not publish, merge, retry, replay, deploy, or externally post.",
        inputSchema: CodexLaunchCardPreviewToolInputSchema.shape,
        annotations: localRouteReadAnnotations,
        _meta: modelOnlyToolMeta,
      },
      async ({ scope, compact }) => {
        const resolvedScope = scope ?? DEFAULT_STATE_RUNTIME_SCOPE;

        try {
          const result = await stateRuntimeAdapter.getCodexLaunchCardPreview({
            scope: resolvedScope,
          });
          const structuredContent = buildCodexLaunchCardPreviewStructuredContent({
            result,
            compact: compact ?? true,
          });

          return {
            structuredContent,
            content: narrative(describeCodexLaunchCardPreview(result)),
            _meta: structuredContent,
          };
        } catch (error) {
          return buildBridgeToolError("augnes_get_codex_launch_card_preview", error);
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
        description: "Send an observation message to the Augnes runtime and return any pending proposals it produces.",
        inputSchema: {
          scope: z.string().min(1).optional(),
          message: z.string().min(1),
        },
        annotations: bridgeWriteAnnotations,
        _meta: modelOnlyToolMeta,
      },
      async ({ scope, message }) => {
        const resolvedScope = scope ?? DEFAULT_STATE_RUNTIME_SCOPE;

        try {
          const observe = await stateRuntimeAdapter.observe({ scope: resolvedScope, message });
          const structuredContent = sanitizePayload({ profile: config.appProfile, observe });
          return {
            structuredContent,
            content: narrative(
              `Observed message for ${observe.scope}; produced ${observe.proposals.length} pending proposal(s). No proposals were committed or rejected.`
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
        description: "Ask the Augnes runtime planner for state-grounded recommendations without committing state changes.",
        inputSchema: {
          scope: z.string().min(1).optional(),
          message: z.string().min(1),
        },
        annotations: bridgeReadAnnotations,
        _meta: modelOnlyToolMeta,
      },
      async ({ scope, message }) => {
        const resolvedScope = scope ?? DEFAULT_STATE_RUNTIME_SCOPE;

        try {
          const plan = await stateRuntimeAdapter.plan({ scope: resolvedScope, message });
          const firstTitle = plan.recommendations[0]?.title;
          const structuredContent = sanitizePayload({ profile: config.appProfile, plan });
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
      "augnes_generate_codex_handoff_draft",
      {
        title: "Generate Codex handoff draft",
        description:
          "Use this when the user asks for a Codex handoff draft from Augnes state and work context. It creates a durable draft guidance packet only; it does not execute Codex, commit or reject state, mark delivery, or publish externally.",
        inputSchema: {
          scope: z.string().min(1).optional(),
          workId: z.string().min(1),
          targetAgent: z.string().min(1).optional(),
          createdBy: z.string().min(1).optional(),
        },
        annotations: bridgeWriteAnnotations,
        _meta: modelOnlyToolMeta,
      },
      async ({ scope, workId, targetAgent, createdBy }) => {
        const resolvedScope = scope ?? DEFAULT_STATE_RUNTIME_SCOPE;

        try {
          const draft = await stateRuntimeAdapter.generateHandoffDraft({
            scope: resolvedScope,
            workId,
            targetAgent: targetAgent ?? "codex",
            createdBy: createdBy ?? "chatgpt",
          });
          const handoff = draft.handoff;
          const structuredContent = sanitizePayload({
            profile: config.appProfile,
            handoff,
            packet_text: draft.packet_text,
            work_id: handoff.work_id,
            expected_state_keys: handoff.expected_state_keys,
            expected_files: handoff.expected_files,
            expected_checks: handoff.expected_checks,
            expected_execution_surfaces: handoff.expected_execution_surfaces,
            safety_boundaries: handoff.safety_boundaries,
            completion_record_fields: handoff.completion_record_fields,
          });

          return {
            structuredContent,
            content: narrative(describeCodexHandoffDraft(handoff.work_id ?? workId.toUpperCase(), handoff.handoff_id)),
            _meta: sanitizePayload({ profile: config.appProfile }),
          };
        } catch (error) {
          return buildBridgeToolError("augnes_generate_codex_handoff_draft", error);
        }
      }
    );

    registerAppTool(
      server,
      "augnes_review_codex_result_draft",
      {
        title: "Review Codex result draft",
        description:
          "Use this when the user asks to review a reported Codex result against a handoff and prepare Augnes record drafts. It does not execute Codex, record proof, commit or reject state, or publish externally.",
        inputSchema: {
          scope: z.string().min(1).optional(),
          handoffId: z.string().min(1),
          actualFilesChanged: z.array(z.string()).optional(),
          actualStateKeys: z.array(z.string()).optional(),
          actualChecks: z.array(z.string()).optional(),
          actualExecutionSurfaces: z.array(z.string()).optional(),
          resultStatus: StateRuntimeActionResultStatusSchema.optional(),
          resultKind: StateRuntimeActionResultKindSchema.optional(),
          resultSummary: z.string().min(1),
          relatedPr: z.string().min(1).optional(),
          blockersOrFailures: z.array(z.string()).optional(),
          skippedChecks: z
            .array(
              z.union([
                z.string(),
                z.object({
                  check: z.string().min(1),
                  reason: z.string().min(1),
                }),
              ])
            )
            .optional(),
        },
        annotations: bridgeWriteAnnotations,
        _meta: modelOnlyToolMeta,
      },
      async ({
        scope,
        handoffId,
        actualFilesChanged,
        actualStateKeys,
        actualChecks,
        actualExecutionSurfaces,
        resultStatus,
        resultKind,
        resultSummary,
        relatedPr,
        blockersOrFailures,
        skippedChecks,
      }) => {
        const resolvedScope = scope ?? DEFAULT_STATE_RUNTIME_SCOPE;

        try {
          const draft = await stateRuntimeAdapter.reviewCodexResultDraft({
            scope: resolvedScope,
            handoffId,
            actualFilesChanged,
            actualStateKeys,
            actualChecks,
            actualExecutionSurfaces,
            resultStatus,
            resultKind,
            resultSummary,
            relatedPr,
            blockersOrFailures,
            skippedChecks,
          });
          const structuredContent = sanitizePayload({
            profile: config.appProfile,
            handoff: draft.handoff,
            review: draft.review,
            action_record_draft: draft.action_record_draft,
            work_event_draft: draft.work_event_draft,
            boundaries: {
              review_only: true,
              records_are_drafts_only: true,
              codex_execution: false,
              proof_recording: false,
              state_commit_or_reject: false,
              external_publication: false,
            },
          });

          return {
            structuredContent,
            content: narrative(
              describeCodexResultReviewDraft(
                draft.handoff.handoff_id,
                draft.review.recommended_result_status,
                draft.review.recommended_result_kind
              )
            ),
            _meta: sanitizePayload({ profile: config.appProfile }),
          };
        } catch (error) {
          return buildBridgeToolError("augnes_review_codex_result_draft", error);
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
