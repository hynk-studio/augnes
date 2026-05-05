import type { ZodType } from "zod";
import {
  BoundaryPacketSchema,
  CasefileSchema,
  ContinuityReportSchema,
  FetchResultSchema,
  GovernanceAuditSchema,
  RepoNavigationResultSchema,
  SearchResultSchema,
  StrategyRationaleSchema,
  WorkingViewSchema,
} from "../lib/schemas.js";
import type {
  AugnesCoreAdapter,
  BoundaryPacket,
  Casefile,
  ContinuityReport,
  FetchResult,
  GovernanceAudit,
  RepoNavigationResult,
  SearchResult,
  SearchScope,
  StrategyRationale,
  WorkingView,
} from "../lib/types.js";

export class AugnesCoreHttpError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AugnesCoreHttpError";
  }
}

const endpointContract = {
  search: { method: "POST", path: "/search" },
  fetch: { method: "GET", path: (id: string) => `/fetch/${encodeURIComponent(id)}` },
  casefile: { method: "POST", path: "/casefile" },
  workingView: { method: "GET", path: "/working-view" },
  strategy: { method: "POST", path: "/strategy" },
  boundaryPacket: { method: "GET", path: "/boundary-packet" },
  continuityReport: { method: "GET", path: "/continuity-report" },
  repoNavigate: { method: "POST", path: "/repo/navigate" },
  governanceAudit: { method: "GET", path: "/governance-audit" },
} as const;

interface HttpAdapterConfig {
  apiBaseUrl: string;
}

function trimTrailingSlash(value: string): string {
  return value.endsWith("/") ? value.slice(0, -1) : value;
}

function buildUrl(baseUrl: string, path: string, query?: Record<string, string | undefined>): URL {
  const url = new URL(path, `${trimTrailingSlash(baseUrl)}/`);

  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value) {
        url.searchParams.set(key, value);
      }
    }
  }

  return url;
}

async function readJson(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new AugnesCoreHttpError("Augnes Core returned invalid JSON.");
  }
}

function parseResponse<T>(schema: ZodType<T>, data: unknown, label: string): T {
  const parsed = schema.safeParse(data);
  if (!parsed.success) {
    throw new AugnesCoreHttpError(`Augnes Core returned an invalid ${label} payload.`);
  }

  return parsed.data;
}

export class HttpAugnesCoreAdapter implements AugnesCoreAdapter {
  constructor(private readonly config: HttpAdapterConfig) {}

  async search(query: string, scope?: SearchScope[], timeRange?: string): Promise<SearchResult[]> {
    return this.requestJson(
      endpointContract.search.method,
      endpointContract.search.path,
      SearchResultSchema.array(),
      "search results",
      {
        body: { query, scope, timeRange },
      }
    );
  }

  async fetch(id: string): Promise<FetchResult | null> {
    const url = buildUrl(this.config.apiBaseUrl, endpointContract.fetch.path(id));

    let response: Response;
    try {
      response = await fetch(url, { method: endpointContract.fetch.method });
    } catch {
      throw new AugnesCoreHttpError("Augnes Core fetch is unavailable. Check the API base URL and server status.");
    }

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new AugnesCoreHttpError(`Augnes Core fetch failed with status ${response.status}.`);
    }

    return parseResponse(FetchResultSchema.nullable(), await readJson(response), "fetch");
  }

  async openCasefile(subjectOrQuery: string): Promise<Casefile> {
    return this.requestJson(
      endpointContract.casefile.method,
      endpointContract.casefile.path,
      CasefileSchema,
      "casefile",
      {
        body: { subject: subjectOrQuery },
      }
    );
  }

  async getWorkingView(scope?: string): Promise<WorkingView> {
    return this.requestJson(
      endpointContract.workingView.method,
      endpointContract.workingView.path,
      WorkingViewSchema,
      "working view",
      {
        query: { scope },
      }
    );
  }

  async explainStrategy(subject?: string): Promise<StrategyRationale> {
    return this.requestJson(
      endpointContract.strategy.method,
      endpointContract.strategy.path,
      StrategyRationaleSchema,
      "strategy rationale",
      {
        body: { subject },
      }
    );
  }

  async getBoundaryPacket(boundaryId?: string): Promise<BoundaryPacket> {
    return this.requestJson(
      endpointContract.boundaryPacket.method,
      endpointContract.boundaryPacket.path,
      BoundaryPacketSchema,
      "boundary packet",
      {
        query: { boundaryId },
      }
    );
  }

  async getContinuityReport(): Promise<ContinuityReport> {
    return this.requestJson(
      endpointContract.continuityReport.method,
      endpointContract.continuityReport.path,
      ContinuityReportSchema,
      "continuity report"
    );
  }

  async navigateRepo(queryOrNodeId: string): Promise<RepoNavigationResult> {
    return this.requestJson(
      endpointContract.repoNavigate.method,
      endpointContract.repoNavigate.path,
      RepoNavigationResultSchema,
      "repo navigation",
      {
        body: { query: queryOrNodeId },
      }
    );
  }

  async getGovernanceAudit(): Promise<GovernanceAudit> {
    return this.requestJson(
      endpointContract.governanceAudit.method,
      endpointContract.governanceAudit.path,
      GovernanceAuditSchema,
      "governance audit"
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
    const url = buildUrl(this.config.apiBaseUrl, path, options?.query);

    let response: Response;
    try {
      response = await fetch(url, {
        method,
        headers: options?.body ? { "content-type": "application/json" } : undefined,
        body: options?.body ? JSON.stringify(options.body) : undefined,
      });
    } catch {
      throw new AugnesCoreHttpError(`Augnes Core ${label} endpoint is unavailable. Check the API base URL and server status.`);
    }

    if (!response.ok) {
      throw new AugnesCoreHttpError(`Augnes Core ${label} request failed with status ${response.status}.`);
    }

    return parseResponse(schema, await readJson(response), label);
  }
}
