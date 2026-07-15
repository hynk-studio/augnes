import type { ZodType } from "zod";
import {
  ActionRecordResultSchema,
  AutonomyContractPreviewResultSchema,
  AutonomyRunnerPreflightPreviewResultSchema,
  CodexLaunchCardPreviewResultSchema,
  CodexResultReviewDraftSchema,
  ConstellationPreviewResultSchema,
  ControlPacketSchema,
  EvidencePackResultSchema,
  GeneratedHandoffDraftSchema,
  GuideBriefResultSchema,
  HandoffCapsulePreviewResultSchema,
  MailboxSummaryResultSchema,
  ObserveResultSchema,
  PendingProposalsResultSchema,
  PlanResultSchema,
  PublicationSummaryResultSchema,
  SessionTraceResultSchema,
  StateBriefSchema,
  StateRuntimeLimitSchema,
  StateRuntimeScopeSchema,
  VerificationEvidenceRecordsResultSchema,
  WorkBriefSchema,
  WorkEventResultSchema,
  WorkListResultSchema,
  type ActionRecordResult,
  type AutonomyContractPreviewResult,
  type AutonomyRunnerPreflightPreviewResult,
  type CodexLaunchCardPreviewResult,
  type CodexResultReviewDraft,
  type ConstellationPreviewResult,
  type ControlPacket,
  type EvidencePackResult,
  type GuideBriefResult,
  type HandoffCapsulePreviewResult,
  type GeneratedHandoffDraft,
  type GenerateHandoffDraftInput,
  type MailboxSummaryResult,
  type ObserveResult,
  type PlanResult,
  type PublicationSummaryResult,
  type SessionTraceResult,
  type StateBrief,
  type StateRuntimeActionResultInput,
  type StateRuntimeAutonomyContractPreviewInput,
  type StateRuntimeAutonomyRunnerPreflightInput,
  type StateRuntimeBridgeAdapter,
  type StateRuntimeCodexLaunchCardPreviewInput,
  type StateRuntimeEvidencePackInput,
  type StateRuntimeHandoffCapsulePreviewInput,
  type StateRuntimeLimit,
  type StateRuntimePlanInput,
  type StateRuntimeObserveInput,
  type StateRuntimeProposal,
  type StateRuntimeScope,
  type StateRuntimeSessionTraceInput,
  type StateRuntimeVerificationEvidenceRecordsInput,
  type StateRuntimeWorkEventInput,
  type ReviewCodexResultDraftInput,
  type VerificationEvidenceRecordsResult,
  type WorkBrief,
  type WorkEventResult,
  type WorkItem,
} from "../lib/state-runtime-types.js";

const DEFAULT_API_BASE_URL = "http://localhost:3000";
const CONSTELLATION_PREVIEW_LOCAL_READ_HEADER = "x-augnes-local-readonly";
const CONSTELLATION_PREVIEW_LOCAL_READ_MARKER = "constellation-preview-v0.1";
const GUIDE_BRIEF_LOCAL_READ_HEADER = "x-augnes-local-readonly";
const GUIDE_BRIEF_LOCAL_READ_MARKER = "guide-brief-v0.1";
const HANDOFF_CAPSULE_LOCAL_READ_HEADER = "x-augnes-local-readonly";
const HANDOFF_CAPSULE_LOCAL_READ_MARKER = "handoff-capsule-v0.1";
const CODEX_LAUNCH_CARD_LOCAL_READ_HEADER = "x-augnes-local-readonly";
const CODEX_LAUNCH_CARD_LOCAL_READ_MARKER = "codex-launch-card-v0.1";
const AUTONOMY_CONTRACT_LOCAL_READ_HEADER = "x-augnes-local-readonly";
const AUTONOMY_CONTRACT_LOCAL_READ_MARKER = "autonomy-contract-v0.1";
const AUTONOMY_RUNNER_PREFLIGHT_LOCAL_READ_HEADER = "x-augnes-local-readonly";
const AUTONOMY_RUNNER_PREFLIGHT_LOCAL_READ_MARKER = "autonomy-runner-preflight-v0.1";

const endpointContract = {
  stateBrief: { method: "GET", path: "/api/state/brief" },
  constellationPreview: { method: "GET", path: "/api/augnes/read/constellation-preview" },
  guideBrief: { method: "GET", path: "/api/augnes/read/guide-brief" },
  handoffCapsulePreview: { method: "GET", path: "/api/augnes/read/handoff-capsule" },
  codexLaunchCardPreview: { method: "GET", path: "/api/augnes/read/codex-launch-card" },
  autonomyContractPreview: { method: "GET", path: "/api/augnes/read/autonomy-contract" },
  autonomyRunnerPreflight: { method: "GET", path: "/api/augnes/read/autonomy-runner-preflight" },
  evidencePack: { method: "GET", path: "/api/evidence-pack" },
  sessionTrace: { method: "GET", path: "/api/sessions/trace" },
  sessionTraceById: { method: "GET", path: "/api/sessions" },
  verificationEvidenceRecords: { method: "GET", path: "/api/evidence/records" },
  observe: { method: "POST", path: "/api/observe" },
  plan: { method: "POST", path: "/api/plan" },
  recordActionResult: { method: "POST", path: "/api/actions/record" },
  pendingProposals: { method: "GET", path: "/api/proposals" },
  workItems: { method: "GET", path: "/api/work" },
  workBrief: { method: "GET", path: "/api/work" },
  recordWorkEvent: { method: "POST", path: "/api/work" },
  generateHandoffDraft: { method: "POST", path: "/api/handoffs/generate" },
  reviewCodexResultDraft: { method: "POST", path: "/api/handoffs/review" },
  mailboxSummary: { method: "GET", path: "/api/mailbox/summary" },
  publicationSummary: { method: "GET", path: "/api/publications/summary" },
  controlPacket: { method: "GET", path: "/api/control/brief" },
} as const;

export class AugnesStateRuntimeHttpError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AugnesStateRuntimeHttpError";
  }
}

interface StateRuntimeHttpAdapterConfig {
  apiBaseUrl?: string;
}

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, "");
}

function resolveApiBaseUrl(configuredBaseUrl?: string): string {
  const rawBaseUrl = configuredBaseUrl ?? process.env.AUGNES_API_BASE_URL ?? DEFAULT_API_BASE_URL;
  const baseUrl = rawBaseUrl.trim() || DEFAULT_API_BASE_URL;

  return trimTrailingSlash(baseUrl);
}

function buildUrl(baseUrl: string, path: string, query?: Record<string, string | undefined>): URL {
  let url: URL;
  try {
    url = new URL(path, `${baseUrl}/`);
  } catch {
    throw new AugnesStateRuntimeHttpError("Invalid Augnes state runtime API base URL.");
  }

  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined) {
        url.searchParams.set(key, value);
      }
    }
  }

  return url;
}

function parseScope(scope: StateRuntimeScope): StateRuntimeScope {
  const parsed = StateRuntimeScopeSchema.safeParse(scope);
  if (!parsed.success) {
    throw new AugnesStateRuntimeHttpError("Augnes state runtime scope is required.");
  }

  return parsed.data;
}

function parseLimit(limit: StateRuntimeLimit | undefined): string | undefined {
  if (limit === undefined) return undefined;

  const parsed = StateRuntimeLimitSchema.safeParse(limit);
  if (!parsed.success) {
    throw new AugnesStateRuntimeHttpError("Augnes state runtime limit must be an integer between 1 and 50.");
  }

  return String(parsed.data);
}

async function readJson(response: Response, label: string): Promise<unknown> {
  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new AugnesStateRuntimeHttpError(`Augnes state runtime returned invalid JSON for ${label}.`);
  }
}

function parseResponse<T>(schema: ZodType<T>, data: unknown, label: string): T {
  const parsed = schema.safeParse(data);
  if (!parsed.success) {
    throw new AugnesStateRuntimeHttpError(`Augnes state runtime returned an invalid ${label} payload.`);
  }

  return parsed.data;
}

function normalizePendingProposals(data: unknown): StateRuntimeProposal[] {
  const parsed = PendingProposalsResultSchema.safeParse(data);
  if (!parsed.success) {
    throw new AugnesStateRuntimeHttpError("Augnes state runtime returned an invalid pending proposals payload.");
  }

  return Array.isArray(parsed.data) ? parsed.data : parsed.data.proposals;
}

export class StateRuntimeHttpAdapter implements StateRuntimeBridgeAdapter {
  private readonly apiBaseUrl: string;

  constructor(config: StateRuntimeHttpAdapterConfig = {}) {
    this.apiBaseUrl = resolveApiBaseUrl(config.apiBaseUrl);
  }

  async getStateBrief(scope: StateRuntimeScope): Promise<StateBrief> {
    return this.requestJson(
      endpointContract.stateBrief.method,
      endpointContract.stateBrief.path,
      StateBriefSchema,
      "state brief",
      {
        query: { scope: parseScope(scope) },
      }
    );
  }

  async getConstellationPreview(scope: StateRuntimeScope): Promise<ConstellationPreviewResult> {
    return this.requestJson(
      endpointContract.constellationPreview.method,
      endpointContract.constellationPreview.path,
      ConstellationPreviewResultSchema,
      "constellation preview",
      {
        query: { scope: parseScope(scope) },
        headers: {
          [CONSTELLATION_PREVIEW_LOCAL_READ_HEADER]: CONSTELLATION_PREVIEW_LOCAL_READ_MARKER,
        },
      }
    );
  }

  async getGuideBrief(scope: StateRuntimeScope): Promise<GuideBriefResult> {
    return this.requestJson(
      endpointContract.guideBrief.method,
      endpointContract.guideBrief.path,
      GuideBriefResultSchema,
      "guide brief",
      {
        query: { scope: parseScope(scope) },
        headers: {
          [GUIDE_BRIEF_LOCAL_READ_HEADER]: GUIDE_BRIEF_LOCAL_READ_MARKER,
        },
      }
    );
  }

  async getHandoffCapsulePreview(input: StateRuntimeHandoffCapsulePreviewInput): Promise<HandoffCapsulePreviewResult> {
    return this.requestJson(
      endpointContract.handoffCapsulePreview.method,
      endpointContract.handoffCapsulePreview.path,
      HandoffCapsulePreviewResultSchema,
      "handoff capsule preview",
      {
        query: {
          scope: parseScope(input.scope),
          target: input.target,
        },
        headers: {
          [HANDOFF_CAPSULE_LOCAL_READ_HEADER]: HANDOFF_CAPSULE_LOCAL_READ_MARKER,
        },
      }
    );
  }

  async getCodexLaunchCardPreview(input: StateRuntimeCodexLaunchCardPreviewInput): Promise<CodexLaunchCardPreviewResult> {
    return this.requestJson(
      endpointContract.codexLaunchCardPreview.method,
      endpointContract.codexLaunchCardPreview.path,
      CodexLaunchCardPreviewResultSchema,
      "codex launch card preview",
      {
        query: { scope: parseScope(input.scope) },
        headers: {
          [CODEX_LAUNCH_CARD_LOCAL_READ_HEADER]: CODEX_LAUNCH_CARD_LOCAL_READ_MARKER,
        },
      }
    );
  }

  async getAutonomyContractPreview(input: StateRuntimeAutonomyContractPreviewInput): Promise<AutonomyContractPreviewResult> {
    return this.requestJson(
      endpointContract.autonomyContractPreview.method,
      endpointContract.autonomyContractPreview.path,
      AutonomyContractPreviewResultSchema,
      "autonomy contract preview",
      {
        query: { scope: parseScope(input.scope) },
        headers: {
          [AUTONOMY_CONTRACT_LOCAL_READ_HEADER]: AUTONOMY_CONTRACT_LOCAL_READ_MARKER,
        },
      }
    );
  }

  async getAutonomyRunnerPreflight(input: StateRuntimeAutonomyRunnerPreflightInput): Promise<AutonomyRunnerPreflightPreviewResult> {
    return this.requestJson(
      endpointContract.autonomyRunnerPreflight.method,
      endpointContract.autonomyRunnerPreflight.path,
      AutonomyRunnerPreflightPreviewResultSchema,
      "autonomy runner preflight preview",
      {
        query: { scope: parseScope(input.scope) },
        headers: {
          [AUTONOMY_RUNNER_PREFLIGHT_LOCAL_READ_HEADER]: AUTONOMY_RUNNER_PREFLIGHT_LOCAL_READ_MARKER,
        },
      }
    );
  }

  async getEvidencePack(input: StateRuntimeEvidencePackInput): Promise<EvidencePackResult> {
    return this.requestJson(
      endpointContract.evidencePack.method,
      endpointContract.evidencePack.path,
      EvidencePackResultSchema,
      "evidence pack",
      {
        query: {
          scope: parseScope(input.scope),
          work_id: input.workId,
          publication_id: input.publicationId,
          delivery_id: input.deliveryId,
          target_ref: input.targetRef,
        },
      }
    );
  }

  async getSessionTrace(input: StateRuntimeSessionTraceInput): Promise<SessionTraceResult> {
    const scope = parseScope(input.scope);
    const limit = parseLimit(input.limit);
    const normalizedSessionId = input.sessionId?.trim();

    if (normalizedSessionId) {
      return this.requestJson(
        endpointContract.sessionTraceById.method,
        `${endpointContract.sessionTraceById.path}/${encodeURIComponent(normalizedSessionId)}/trace`,
        SessionTraceResultSchema,
        "session trace",
        {
          query: { scope, limit },
        }
      );
    }

    return this.requestJson(
      endpointContract.sessionTrace.method,
      endpointContract.sessionTrace.path,
      SessionTraceResultSchema,
      "session trace",
      {
        query: { scope, limit },
      }
    );
  }

  async getVerificationEvidenceRecords(
    input: StateRuntimeVerificationEvidenceRecordsInput
  ): Promise<VerificationEvidenceRecordsResult> {
    return this.requestJson(
      endpointContract.verificationEvidenceRecords.method,
      endpointContract.verificationEvidenceRecords.path,
      VerificationEvidenceRecordsResultSchema,
      "verification evidence records",
      {
        query: {
          scope: parseScope(input.scope),
          work_id: input.workId,
          publication_id: input.publicationId,
          delivery_id: input.deliveryId,
          target_surface: input.targetSurface,
          target_ref: input.targetRef,
          evidence_kind: input.evidenceKind,
          status: input.status,
          limit: parseLimit(input.limit),
        },
      }
    );
  }

  async observe(input: StateRuntimeObserveInput): Promise<ObserveResult> {
    return this.requestJson(endpointContract.observe.method, endpointContract.observe.path, ObserveResultSchema, "observe", {
      body: {
        workspace_id: input.workspaceId,
        project_id: input.projectId,
        expected_active_project_id: input.expectedActiveProjectId,
        expected_active_selection_revision: input.expectedActiveSelectionRevision,
        message: input.message,
        ...(input.projectRoot
          ? {
              project_root: {
                path_flavor: input.projectRoot.pathFlavor,
                normalized_path: input.projectRoot.normalizedPath,
              },
            }
          : {}),
        ...(input.executionMode
          ? { execution_mode: input.executionMode }
          : {}),
      },
    });
  }

  async plan(input: StateRuntimePlanInput): Promise<PlanResult> {
    return this.requestJson(endpointContract.plan.method, endpointContract.plan.path, PlanResultSchema, "plan", {
      body: {
        workspace_id: input.workspaceId,
        project_id: input.projectId,
        expected_active_project_id: input.expectedActiveProjectId,
        expected_active_selection_revision: input.expectedActiveSelectionRevision,
        message: input.message,
        ...(input.projectRoot
          ? {
              project_root: {
                path_flavor: input.projectRoot.pathFlavor,
                normalized_path: input.projectRoot.normalizedPath,
              },
            }
          : {}),
        ...(input.executionMode
          ? { execution_mode: input.executionMode }
          : {}),
      },
    });
  }

  async recordActionResult(input: StateRuntimeActionResultInput): Promise<ActionRecordResult> {
    const body: Record<string, unknown> = {
      scope: parseScope(input.scope),
      source_agent_id: input.sourceAgentId,
      action_name: input.actionName,
      result_summary: input.resultSummary,
      files_changed: input.filesChanged ?? [],
    };

    if (input.resultStatus) {
      body.result_status = input.resultStatus;
    }

    if (input.resultKind) {
      body.result_kind = input.resultKind;
    }

    return this.requestJson(
      endpointContract.recordActionResult.method,
      endpointContract.recordActionResult.path,
      ActionRecordResultSchema,
      "action record",
      { body }
    );
  }

  async listPendingProposals(scope: StateRuntimeScope): Promise<StateRuntimeProposal[]> {
    const url = buildUrl(this.apiBaseUrl, endpointContract.pendingProposals.path, {
      scope: parseScope(scope),
      status: "pending",
    });

    let response: Response;
    try {
      response = await fetch(url, { method: endpointContract.pendingProposals.method });
    } catch {
      throw new AugnesStateRuntimeHttpError(
        "Augnes state runtime pending proposals endpoint is unavailable. Check AUGNES_API_BASE_URL and server status."
      );
    }

    if (!response.ok) {
      throw new AugnesStateRuntimeHttpError(`Augnes state runtime pending proposals request failed with status ${response.status}.`);
    }

    return normalizePendingProposals(await readJson(response, "pending proposals"));
  }

  async listWorkItems(scope: StateRuntimeScope): Promise<WorkItem[]> {
    const result = await this.requestJson(
      endpointContract.workItems.method,
      endpointContract.workItems.path,
      WorkListResultSchema,
      "work list",
      {
        query: { scope: parseScope(scope) },
      }
    );

    return result.work_items;
  }

  async getWorkBrief(scope: StateRuntimeScope, workId: string): Promise<WorkBrief> {
    const normalizedWorkId = workId.trim().toUpperCase();
    if (!normalizedWorkId) {
      throw new AugnesStateRuntimeHttpError("Augnes work_id is required.");
    }

    return this.requestJson(
      endpointContract.workBrief.method,
      `${endpointContract.workBrief.path}/${encodeURIComponent(normalizedWorkId)}/brief`,
      WorkBriefSchema,
      "work brief",
      {
        query: { scope: parseScope(scope) },
      }
    );
  }

  async recordWorkEvent(input: StateRuntimeWorkEventInput): Promise<WorkEventResult> {
    const normalizedWorkId = input.workId.trim().toUpperCase();
    if (!normalizedWorkId) {
      throw new AugnesStateRuntimeHttpError("Augnes work_id is required.");
    }

    const body: Record<string, unknown> = {
      scope: parseScope(input.scope),
      summary: input.summary,
    };

    if (input.actor) body.actor = input.actor;
    if (input.eventType) body.event_type = input.eventType;
    if (input.resultStatus) body.result_status = input.resultStatus;
    if (input.resultKind) body.result_kind = input.resultKind;
    if (input.relatedActionId) body.related_action_id = input.relatedActionId;
    if (input.relatedPr) body.related_pr = input.relatedPr;
    if (input.relatedStateKeys) body.related_state_keys = input.relatedStateKeys;

    return this.requestJson(
      endpointContract.recordWorkEvent.method,
      `${endpointContract.recordWorkEvent.path}/${encodeURIComponent(normalizedWorkId)}/events`,
      WorkEventResultSchema,
      "work event",
      { body }
    );
  }

  async generateHandoffDraft(input: GenerateHandoffDraftInput): Promise<GeneratedHandoffDraft> {
    const normalizedWorkId = input.workId.trim().toUpperCase();
    if (!normalizedWorkId) {
      throw new AugnesStateRuntimeHttpError("Augnes work_id is required.");
    }

    const body: Record<string, unknown> = {
      scope: parseScope(input.scope),
      work_id: normalizedWorkId,
    };

    if (input.targetAgent) body.target_agent = input.targetAgent;
    if (input.createdBy) body.created_by = input.createdBy;

    return this.requestJson(
      endpointContract.generateHandoffDraft.method,
      endpointContract.generateHandoffDraft.path,
      GeneratedHandoffDraftSchema,
      "handoff draft",
      { body }
    );
  }

  async reviewCodexResultDraft(input: ReviewCodexResultDraftInput): Promise<CodexResultReviewDraft> {
    const handoffId = input.handoffId.trim();
    if (!handoffId) {
      throw new AugnesStateRuntimeHttpError("Augnes handoffId is required.");
    }

    const body: Record<string, unknown> = {
      scope: parseScope(input.scope),
      handoff_id: handoffId,
      result_summary: input.resultSummary,
      actual_files_changed: input.actualFilesChanged ?? [],
      actual_state_keys: input.actualStateKeys ?? [],
      actual_checks: input.actualChecks ?? [],
      actual_execution_surfaces: input.actualExecutionSurfaces ?? [],
      blockers_or_failures: input.blockersOrFailures ?? [],
      skipped_checks: input.skippedChecks ?? [],
    };

    if (input.resultStatus) body.result_status = input.resultStatus;
    if (input.resultKind) body.result_kind = input.resultKind;
    if (input.relatedPr) body.related_pr = input.relatedPr;

    return this.requestJson(
      endpointContract.reviewCodexResultDraft.method,
      endpointContract.reviewCodexResultDraft.path,
      CodexResultReviewDraftSchema,
      "Codex result review draft",
      { body }
    );
  }

  async getMailboxSummary(scope: StateRuntimeScope): Promise<MailboxSummaryResult> {
    return this.requestJson(
      endpointContract.mailboxSummary.method,
      endpointContract.mailboxSummary.path,
      MailboxSummaryResultSchema,
      "mailbox summary",
      {
        query: { scope: parseScope(scope) },
      }
    );
  }

  async getPublicationSummary(scope: StateRuntimeScope): Promise<PublicationSummaryResult> {
    return this.requestJson(
      endpointContract.publicationSummary.method,
      endpointContract.publicationSummary.path,
      PublicationSummaryResultSchema,
      "publication summary",
      {
        query: { scope: parseScope(scope) },
      }
    );
  }

  async getControlPacket(scope: StateRuntimeScope): Promise<ControlPacket> {
    return this.requestJson(
      endpointContract.controlPacket.method,
      endpointContract.controlPacket.path,
      ControlPacketSchema,
      "control packet",
      {
        query: { scope: parseScope(scope) },
      }
    );
  }

  private async requestJson<T>(
    method: "GET" | "POST",
    path: string,
    schema: ZodType<T>,
    label: string,
    options?: {
      body?: Record<string, unknown>;
      query?: Record<string, string | undefined>;
      headers?: Record<string, string>;
    }
  ): Promise<T> {
    const url = buildUrl(this.apiBaseUrl, path, options?.query);
    const headers = {
      ...(options?.body ? { "content-type": "application/json" } : {}),
      ...(options?.headers ?? {}),
    };

    let response: Response;
    try {
      response = await fetch(url, {
        method,
        headers: Object.keys(headers).length ? headers : undefined,
        body: options?.body ? JSON.stringify(options.body) : undefined,
      });
    } catch {
      throw new AugnesStateRuntimeHttpError(
        `Augnes state runtime ${label} endpoint is unavailable. Check AUGNES_API_BASE_URL and server status.`
      );
    }

    if (!response.ok) {
      throw new AugnesStateRuntimeHttpError(`Augnes state runtime ${label} request failed with status ${response.status}.`);
    }

    return parseResponse(schema, await readJson(response, label), label);
  }
}
