import { readFile } from "node:fs/promises";
import type { ZodType } from "zod";
import {
  BoundaryPacketSchema,
  CasefileSchema,
  ContinuityReportSchema,
  FetchResultSchema,
  GovernanceAuditSchema,
  RepoNavigationResultSchema,
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
import { MockAugnesCoreAdapter } from "./mock-core.js";

export class FileAugnesCoreAdapter implements AugnesCoreAdapter {
  private readonly fallback = new MockAugnesCoreAdapter();

  constructor(
    private readonly config: {
      workingViewFile?: string;
      casefileFile?: string;
      evidenceIndexFile?: string;
      continuityReportFile?: string;
      boundaryPacketFile?: string;
      strategyRationaleFile?: string;
      governanceAuditFile?: string;
      repoNavigationFile?: string;
    }
  ) {}

  async search(query: string, scope?: SearchScope[], timeRange?: string): Promise<SearchResult[]> {
    void timeRange;
    const records = await this.readEvidenceIndex();
    const rawQuery = query.toLowerCase();
    const normalizedQuery = normalizeForSearch(query);
    const queryTerms = normalizedQuery.split(" ").filter(Boolean);

    return records
      .filter((record) => this.matchesScope(record, scope))
      .filter((record) => this.matchesQuery(record, rawQuery, normalizedQuery, queryTerms))
      .slice(0, 10)
      .map((record) => ({
        id: record.id,
        title: record.title,
        url: record.url,
      }));
  }

  async fetch(id: string): Promise<FetchResult | null> {
    const records = await this.readEvidenceIndex();
    return records.find((record) => record.id === id) ?? null;
  }

  async openCasefile(subjectOrQuery: string): Promise<Casefile> {
    void subjectOrQuery;
    return this.readValidatedJsonFile("AUGNES_CASEFILE_FILE", this.config.casefileFile, CasefileSchema, "Casefile");
  }

  async getWorkingView(scope?: string): Promise<WorkingView> {
    void scope;

    return this.readValidatedJsonFile("AUGNES_WORKING_VIEW_FILE", this.config.workingViewFile, WorkingViewSchema, "WorkingView");
  }

  private async readEvidenceIndex(): Promise<FetchResult[]> {
    return this.readValidatedJsonFile(
      "AUGNES_EVIDENCE_INDEX_FILE",
      this.config.evidenceIndexFile,
      FetchResultSchema.array(),
      "EvidenceIndex"
    );
  }

  private searchableText(record: FetchResult): string {
    const metadataValues = Object.entries(record.metadata ?? {}).flatMap(([key, value]) => [key, String(value)]);
    return [record.id, record.title, record.text, ...metadataValues].join(" ");
  }

  private matchesQuery(record: FetchResult, rawQuery: string, normalizedQuery: string, queryTerms: string[]): boolean {
    const rawBlob = this.searchableText(record).toLowerCase();
    if (rawBlob.includes(rawQuery)) return true;

    const normalizedBlob = normalizeForSearch(rawBlob);
    if (normalizedQuery && normalizedBlob.includes(normalizedQuery)) return true;

    return queryTerms.length > 0 && queryTerms.every((term) => normalizedBlob.includes(term));
  }

  private matchesScope(record: FetchResult, scope?: SearchScope[]): boolean {
    if (!scope?.length) return true;

    const kind = String(record.metadata?.kind ?? "");
    const source = String(record.metadata?.source ?? "");
    return scope.some((candidate) => candidate === kind || candidate === source || (candidate === "repo" && source === "repo"));
  }

  private async readValidatedJsonFile<T>(envName: string, filePath: string | undefined, schema: ZodType<T>, label: string): Promise<T> {
    if (!filePath) {
      throw new Error(`${envName} is required when AUGNES_CORE_MODE=file.`);
    }

    let raw: string;
    try {
      raw = await readFile(filePath, "utf8");
    } catch (error) {
      const message = error instanceof Error ? error.message : "unknown file error";
      throw new Error(`Unable to read ${envName} (${filePath}): ${message}`);
    }

    let json: unknown;
    try {
      json = JSON.parse(raw);
    } catch {
      throw new Error(`${envName} (${filePath}) is not valid JSON.`);
    }

    const parsed = schema.safeParse(json);
    if (!parsed.success) {
      throw new Error(`${envName} (${filePath}) does not match the ${label} schema.`);
    }

    return parsed.data;
  }

  async explainStrategy(subject?: string): Promise<StrategyRationale> {
    void subject;
    return this.readValidatedJsonFile(
      "AUGNES_STRATEGY_RATIONALE_FILE",
      this.config.strategyRationaleFile,
      StrategyRationaleSchema,
      "StrategyRationale"
    );
  }

  async getBoundaryPacket(boundaryId?: string): Promise<BoundaryPacket> {
    const packet = await this.readValidatedJsonFile(
      "AUGNES_BOUNDARY_PACKET_FILE",
      this.config.boundaryPacketFile,
      BoundaryPacketSchema,
      "BoundaryPacket"
    );

    if (boundaryId && !boundaryIdMatches(packet.boundaryId, boundaryId)) {
      throw new Error(`Requested boundaryId ${boundaryId} does not match file-backed boundary packet ${packet.boundaryId}.`);
    }

    return packet;
  }

  async getContinuityReport(): Promise<ContinuityReport> {
    return this.readValidatedJsonFile(
      "AUGNES_CONTINUITY_REPORT_FILE",
      this.config.continuityReportFile,
      ContinuityReportSchema,
      "ContinuityReport"
    );
  }

  async navigateRepo(queryOrNodeId: string): Promise<RepoNavigationResult> {
    const fixture = await this.readValidatedJsonFile(
      "AUGNES_REPO_NAVIGATION_FILE",
      this.config.repoNavigationFile,
      RepoNavigationResultSchema,
      "RepoNavigationResult"
    );
    const queryTerms = normalizeForSearch(queryOrNodeId).split(" ").filter(Boolean);

    if (!queryTerms.length) {
      return { ...fixture, query: queryOrNodeId };
    }

    const search = fixture.search.filter((node) => repoNodeMatches(node, queryTerms, fixture.guidance));
    const explore = fixture.explore.filter((node) => repoNodeMatches(node, queryTerms, fixture.guidance));

    return {
      query: queryOrNodeId,
      search,
      explore,
      guidance: fixture.guidance,
    };
  }

  async getGovernanceAudit(): Promise<GovernanceAudit> {
    return this.readValidatedJsonFile(
      "AUGNES_GOVERNANCE_AUDIT_FILE",
      this.config.governanceAuditFile,
      GovernanceAuditSchema,
      "GovernanceAudit"
    );
  }
}

function normalizeForSearch(value: string): string {
  return value
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .toLowerCase()
    .replace(/[-_/:.]+/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function boundaryIdMatches(fixtureId: string, requestedId: string): boolean {
  return fixtureId === requestedId || stripBoundaryPrefix(fixtureId) === stripBoundaryPrefix(requestedId);
}

function stripBoundaryPrefix(value: string): string {
  return value.startsWith("boundary:") ? value.slice("boundary:".length) : value;
}

function repoNodeMatches(
  node: { nodeId: string; title: string; kind: string; fetchable: boolean },
  queryTerms: string[],
  guidance: string[]
): boolean {
  const searchable = normalizeForSearch([node.nodeId, node.title, node.kind, node.fetchable ? "fetchable" : "", ...guidance].join(" "));
  return queryTerms.every((term) => searchable.includes(term));
}
