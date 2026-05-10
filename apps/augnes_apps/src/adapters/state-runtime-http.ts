import type { ZodType } from "zod";
import {
  ActionRecordResultSchema,
  CodexResultReviewDraftSchema,
  ControlPacketSchema,
  GeneratedHandoffDraftSchema,
  MailboxSummaryResultSchema,
  ObserveResultSchema,
  PendingProposalsResultSchema,
  PlanResultSchema,
  PublicationSummaryResultSchema,
  StateBriefSchema,
  StateRuntimeScopeSchema,
  WorkBriefSchema,
  WorkEventResultSchema,
  WorkListResultSchema,
  type ActionRecordResult,
  type CodexResultReviewDraft,
  type ControlPacket,
  type GeneratedHandoffDraft,
  type GenerateHandoffDraftInput,
  type MailboxSummaryResult,
  type ObserveResult,
  type PlanResult,
  type PublicationSummaryResult,
  type StateBrief,
  type StateRuntimeActionResultInput,
  type StateRuntimeBridgeAdapter,
  type StateRuntimeMessageInput,
  type StateRuntimeProposal,
  type StateRuntimeScope,
  type StateRuntimeWorkEventInput,
  type ReviewCodexResultDraftInput,
  type WorkBrief,
  type WorkEventResult,
  type WorkItem,
} from "../lib/state-runtime-types.js";

const DEFAULT_API_BASE_URL = "http://localhost:3000";

const endpointContract = {
  stateBrief: { method: "GET", path: "/api/state/brief" },
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

  async observe(input: StateRuntimeMessageInput): Promise<ObserveResult> {
    return this.requestJson(endpointContract.observe.method, endpointContract.observe.path, ObserveResultSchema, "observe", {
      body: {
        scope: parseScope(input.scope),
        message: input.message,
      },
    });
  }

  async plan(input: StateRuntimeMessageInput): Promise<PlanResult> {
    return this.requestJson(endpointContract.plan.method, endpointContract.plan.path, PlanResultSchema, "plan", {
      body: {
        scope: parseScope(input.scope),
        message: input.message,
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
    }
  ): Promise<T> {
    const url = buildUrl(this.apiBaseUrl, path, options?.query);

    let response: Response;
    try {
      response = await fetch(url, {
        method,
        headers: options?.body ? { "content-type": "application/json" } : undefined,
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
