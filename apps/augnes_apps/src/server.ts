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
import { config } from "./lib/config.js";
import { withPresentation } from "./lib/profile.js";
import { sanitizeValue } from "./lib/sanitize.js";
import {
  EvidencePackToolInputSchema,
  ProjectConstellationPreviewToolInputSchema,
  SessionTraceToolInputSchema,
  StateRuntimeActionResultKindSchema,
  StateRuntimeActionResultStatusSchema,
  VerificationEvidenceRecordsToolInputSchema,
  type ConstellationPreviewResult,
  type ControlPacket,
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

function describeWorkBrief(brief: WorkBrief): string {
  return `Work brief for ${brief.work_id}: ${brief.work.title}. Status ${brief.work.status}, priority ${brief.work.priority}, ${brief.recent_events.length} recent event(s), ${brief.related_proof.action_ids.length} linked action record(s). work_id is a trace anchor; committed state remains authoritative.`;
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

const CODEX_HANDOFF_PREVIEW_FORBIDDEN_ACTIONS = [
  "No Codex execution from this card.",
  "No commit/reject state.",
  "No approve/publish/retry/replay/external posting.",
  "No merge/auto-merge.",
  "No proof/evidence recording controls.",
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
const NO_CONSTELLATION_CONTEXT_TEXT = "No Project Constellation context is attached to this work contract." as const;

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
  authority_boundary_text: readonly string[];
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
  boundary_text: readonly string[];
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
    "Forbidden actions",
    listForPacket([...preview.forbidden_actions], "No forbidden actions listed."),
    "",
    "Stop conditions",
    listForPacket([...preview.stop_conditions], "No stop conditions listed."),
    "",
    "Authority boundaries",
    listForPacket([...preview.boundary_text], "No boundary text listed."),
    "",
    "Structured JSON",
    CODEX_HANDOFF_JSON_BEGIN,
    structuredJson,
    CODEX_HANDOFF_JSON_END,
  ].join("\n");
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
    authority_boundary_text: WORK_CONTRACT_CARD_BOUNDARY_TEXT,
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
    forbidden_actions: CODEX_HANDOFF_PREVIEW_FORBIDDEN_ACTIONS,
    stop_conditions: CODEX_HANDOFF_PREVIEW_STOP_CONDITIONS,
    constellation_context: card.constellation_context,
    boundary_text: CODEX_HANDOFF_PREVIEW_BOUNDARY_TEXT,
  } satisfies Omit<CodexHandoffPreview, "copyable_handoff_text">;

  return {
    ...previewWithoutPacket,
    copyable_handoff_text: buildCopyableHandoffText(previewWithoutPacket),
  };
}

function describeWorkContractCard(card: WorkContractCard): string {
  return [
    `Work Contract Card for ${card.work_id}: ${card.work_title}. Status ${card.work_status}, priority ${card.priority}, ${card.recent_events_count} recent event(s), ${card.linked_proof_action_ids_count} linked action ID(s).`,
    WORK_CONTRACT_CARD_BOUNDARY_TEXT.join(" "),
  ].join(" ");
}

function describeCodexHandoffPreview(preview: CodexHandoffPreview): string {
  return [
    `Codex Handoff Preview for ${preview.work_id ?? "unknown work"} is ${preview.readiness_status}. Task profile ${preview.task_profile}; browser verification ${preview.browser_verification}.`,
    CODEX_HANDOFF_PREVIEW_BOUNDARY_TEXT.join(" "),
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

export type McpAppServerOptions = {
  enableAgentBridge?: boolean;
};

export function createMcpAppServer(
  adapter: AugnesCoreAdapter = createAugnesCoreAdapter(),
  stateRuntimeAdapter: StateRuntimeBridgeAdapter = new StateRuntimeHttpAdapter(),
  options: McpAppServerOptions = {}
) {
  const enableAgentBridge = options.enableAgentBridge ?? config.enableAgentBridge;
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

  registerAppTool(
    server,
    "augnes_list_work_items",
    {
      title: "List Augnes work items",
      description: "List focused Augnes work trace anchors without treating work_id as durable project state.",
      inputSchema: { scope: z.string().min(1).optional() },
      annotations: bridgeReadAnnotations,
      _meta: modelOnlyToolMeta,
    },
    async ({ scope }) => {
      const resolvedScope = scope ?? DEFAULT_STATE_RUNTIME_SCOPE;

      try {
        const workItems = await stateRuntimeAdapter.listWorkItems(resolvedScope);
        const structuredContent = sanitizePayload({ profile: config.appProfile, scope: resolvedScope, workItems });
        return {
          structuredContent,
          content: narrative(describeWorkItems(resolvedScope, workItems)),
          _meta: sanitizePayload({ profile: config.appProfile }),
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
      description: "Return a ChatGPT-friendly work packet with current metadata, recent events, proof links, and Codex handoff.",
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
        const workContractCard = buildWorkContractCard(brief);
        const codexHandoffPreview = buildCodexHandoffPreview(brief, workContractCard);
        const structuredContent = sanitizePayload({
          profile: config.appProfile,
          panel: "work_contract_card",
          brief,
          work_contract_card: workContractCard,
          codex_handoff_preview: codexHandoffPreview,
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
            `${describeWorkBrief(brief)} ${describeWorkContractCard(workContractCard)} ${describeCodexHandoffPreview(codexHandoffPreview)}`
          ),
          _meta: structuredContent,
        };
      } catch (error) {
        return buildBridgeToolError("augnes_get_work_brief", error);
      }
    }
  );

  if (enableAgentBridge) {
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
  httpServer.listen(config.port, () => {
    console.log(`Augnes MCP server listening on http://localhost:${config.port}${config.mcpPath}`);
  });
}
