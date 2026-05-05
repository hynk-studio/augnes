import type { ZodType } from "zod";
import {
  ActionRecordResultSchema,
  ObserveResultSchema,
  PendingProposalsResultSchema,
  PlanResultSchema,
  StateBriefSchema,
  StateRuntimeScopeSchema,
  type ActionRecordResult,
  type ObserveResult,
  type PlanResult,
  type StateBrief,
  type StateRuntimeActionResultInput,
  type StateRuntimeBridgeAdapter,
  type StateRuntimeMessageInput,
  type StateRuntimeProposal,
  type StateRuntimeScope,
} from "../lib/state-runtime-types.js";

const DEFAULT_API_BASE_URL = "http://localhost:3000";

const endpointContract = {
  stateBrief: { method: "GET", path: "/api/state/brief" },
  observe: { method: "POST", path: "/api/observe" },
  plan: { method: "POST", path: "/api/plan" },
  recordActionResult: { method: "POST", path: "/api/actions/record" },
  pendingProposals: { method: "GET", path: "/api/proposals" },
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
