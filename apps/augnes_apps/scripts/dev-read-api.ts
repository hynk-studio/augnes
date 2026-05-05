import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import {
  BoundaryPacketSchema,
  CasefileSchema,
  ContinuityReportSchema,
  FetchResultSchema,
  GovernanceAuditSchema,
  RepoNavigationResultSchema,
  SearchResultSchema,
  SearchScopeSchema,
  StrategyRationaleSchema,
} from "../src/lib/schemas.js";
import type { BoundaryPacket, FetchResult } from "../src/lib/types.js";
import { loadReadModelSnapshot } from "../src/read-model-projection/load-snapshot.js";
import { projectWorkingView } from "../src/read-model-projection/working-view.js";

const port = Number(process.env.AUGNES_READ_API_PORT ?? 3000);
const readModelSnapshotFile = resolve(process.env.AUGNES_READ_MODEL_SNAPSHOT_FILE ?? "./data/read-model-snapshot.example.json");
const casefileFile = resolve(process.env.AUGNES_CASEFILE_FILE ?? "./data/casefile.example.json");
const evidenceIndexFile = resolve(process.env.AUGNES_EVIDENCE_INDEX_FILE ?? "./data/evidence-index.example.json");
const continuityReportFile = resolve(process.env.AUGNES_CONTINUITY_REPORT_FILE ?? "./data/continuity-report.example.json");
const boundaryPacketFile = resolve(process.env.AUGNES_BOUNDARY_PACKET_FILE ?? "./data/boundary-packet.example.json");
const strategyRationaleFile = resolve(process.env.AUGNES_STRATEGY_RATIONALE_FILE ?? "./data/strategy-rationale.example.json");
const governanceAuditFile = resolve(process.env.AUGNES_GOVERNANCE_AUDIT_FILE ?? "./data/governance-audit.example.json");
const repoNavigationFile = resolve(process.env.AUGNES_REPO_NAVIGATION_FILE ?? "./data/repo-navigation.example.json");
const maxBodyBytes = 64 * 1024;

function writeJson(res: ServerResponse, status: number, payload: unknown) {
  res.writeHead(status, {
    "content-type": "application/json",
    "cache-control": "no-store",
  });
  res.end(JSON.stringify(payload));
}

function writeNotFound(res: ServerResponse) {
  writeJson(res, 404, {
    error: {
      code: "NOT_FOUND",
      message: "Endpoint not found.",
      retryable: false,
    },
  });
}

function writeBadRequest(res: ServerResponse, message: string) {
  writeJson(res, 400, {
    error: {
      code: "BAD_REQUEST",
      message,
      retryable: false,
    },
  });
}

async function readJsonFile(path: string): Promise<unknown> {
  const text = await readFile(path, "utf8");
  return JSON.parse(text) as unknown;
}

async function readRequestBody(req: IncomingMessage): Promise<string> {
  const chunks: Buffer[] = [];
  let totalBytes = 0;

  for await (const chunk of req) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    totalBytes += buffer.byteLength;

    if (totalBytes > maxBodyBytes) {
      throw new Error(`Request body exceeds ${maxBodyBytes} bytes.`);
    }

    chunks.push(buffer);
  }

  return Buffer.concat(chunks).toString("utf8");
}

async function readJsonBody(req: IncomingMessage): Promise<unknown> {
  const body = await readRequestBody(req);
  if (!body.trim()) return {};

  try {
    return JSON.parse(body) as unknown;
  } catch {
    throw new Error("Request body must be valid JSON.");
  }
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isCasefileRequest(value: unknown): value is { subject?: string } {
  if (!isPlainObject(value)) return false;
  const subject = value.subject;
  return subject === undefined || typeof subject === "string";
}

function isStrategyRequest(value: unknown): value is { subject?: string } {
  if (!isPlainObject(value)) return false;
  const subject = value.subject;
  return subject === undefined || typeof subject === "string";
}

function parseSearchRequest(value: unknown): { query: string; scope?: string[]; timeRange?: string } | null {
  if (!isPlainObject(value)) return null;

  const { query, scope, timeRange } = value;
  if (typeof query !== "string" || !query.trim()) return null;
  if (timeRange !== undefined && typeof timeRange !== "string") return null;

  if (scope !== undefined) {
    if (!Array.isArray(scope)) return null;
    if (!scope.every((candidate) => SearchScopeSchema.safeParse(candidate).success)) return null;
    return { query, scope: scope as string[], timeRange };
  }

  return { query, timeRange };
}

function parseRepoNavigateRequest(value: unknown): { query: string } | null {
  if (!isPlainObject(value)) return null;
  const { query } = value;
  if (typeof query !== "string" || !query.trim()) return null;
  return { query };
}

async function readWorkingView() {
  return projectWorkingView(await loadReadModelSnapshot(readModelSnapshotFile));
}

async function readCasefile() {
  return CasefileSchema.parse(await readJsonFile(casefileFile));
}

async function readEvidenceIndex() {
  return FetchResultSchema.array().parse(await readJsonFile(evidenceIndexFile));
}

async function readContinuityReport() {
  return ContinuityReportSchema.parse(await readJsonFile(continuityReportFile));
}

async function readBoundaryPacket() {
  return BoundaryPacketSchema.parse(await readJsonFile(boundaryPacketFile));
}

async function readStrategyRationale() {
  return StrategyRationaleSchema.parse(await readJsonFile(strategyRationaleFile));
}

async function readGovernanceAudit() {
  return GovernanceAuditSchema.parse(await readJsonFile(governanceAuditFile));
}

async function readRepoNavigation() {
  return RepoNavigationResultSchema.parse(await readJsonFile(repoNavigationFile));
}

function searchableText(record: FetchResult): string {
  const metadataValues = Object.entries(record.metadata ?? {}).flatMap(([key, value]) => [key, String(value)]);
  return [record.id, record.title, record.text, ...metadataValues].join(" ");
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

function matchesScope(record: FetchResult, scope?: string[]): boolean {
  if (!scope?.length) return true;

  const kind = String(record.metadata?.kind ?? "");
  const source = String(record.metadata?.source ?? "");
  return scope.some((candidate) => candidate === kind || candidate === source || (candidate === "repo" && source === "repo"));
}

function matchesQuery(record: FetchResult, query: string): boolean {
  const rawQuery = query.toLowerCase();
  const normalizedQuery = normalizeForSearch(query);
  const queryTerms = normalizedQuery.split(" ").filter(Boolean);
  const rawBlob = searchableText(record).toLowerCase();

  if (rawBlob.includes(rawQuery)) return true;

  const normalizedBlob = normalizeForSearch(rawBlob);
  if (normalizedQuery && normalizedBlob.includes(normalizedQuery)) return true;

  return queryTerms.length > 0 && queryTerms.every((term) => normalizedBlob.includes(term));
}

async function searchEvidenceIndex(query: string, scope?: string[]) {
  const records = await readEvidenceIndex();
  const results = records
    .filter((record) => matchesScope(record, scope))
    .filter((record) => matchesQuery(record, query))
    .slice(0, 10)
    .map((record) => ({
      id: record.id,
      title: record.title,
      url: record.url,
    }));

  return SearchResultSchema.array().parse(results);
}

async function fetchRecord(id: string) {
  const records = await readEvidenceIndex();
  return records.find((record) => record.id === id) ?? null;
}

function boundaryIdMatches(fixtureId: string, requestedId: string): boolean {
  return fixtureId === requestedId || stripBoundaryPrefix(fixtureId) === stripBoundaryPrefix(requestedId);
}

function stripBoundaryPrefix(value: string): string {
  return value.startsWith("boundary:") ? value.slice("boundary:".length) : value;
}

function boundaryMatchesRequest(packet: BoundaryPacket, requestedId: string | null): boolean {
  return !requestedId || boundaryIdMatches(packet.boundaryId, requestedId);
}

function repoNodeMatches(
  node: { nodeId: string; title: string; kind: string; fetchable: boolean },
  queryTerms: string[],
  guidance: string[]
): boolean {
  const searchable = normalizeForSearch([node.nodeId, node.title, node.kind, node.fetchable ? "fetchable" : "", ...guidance].join(" "));
  return queryTerms.every((term) => searchable.includes(term));
}

async function navigateRepo(query: string) {
  const fixture = await readRepoNavigation();
  const queryTerms = normalizeForSearch(query).split(" ").filter(Boolean);

  if (!queryTerms.length) {
    return { ...fixture, query };
  }

  return RepoNavigationResultSchema.parse({
    query,
    search: fixture.search.filter((node) => repoNodeMatches(node, queryTerms, fixture.guidance)),
    explore: fixture.explore.filter((node) => repoNodeMatches(node, queryTerms, fixture.guidance)),
    guidance: fixture.guidance,
  });
}

export function createDevReadApiServer() {
  return createServer(async (req, res) => {
    if (!req.url) {
      writeBadRequest(res, "Missing request URL.");
      return;
    }

    const url = new URL(req.url, `http://${req.headers.host ?? "localhost"}`);

    if (req.method === "GET" && url.pathname === "/healthz") {
      writeJson(res, 200, {
        ok: true,
        name: "augnes-dev-read-api",
        readOnly: true,
        endpoints: [
          "GET /working-view",
          "POST /casefile",
          "POST /search",
          "GET /fetch/:id",
          "GET /continuity-report",
          "GET /boundary-packet",
          "POST /strategy",
          "GET /governance-audit",
          "POST /repo/navigate",
        ],
      });
      return;
    }

    if (req.method === "GET" && url.pathname === "/working-view") {
      try {
        writeJson(res, 200, await readWorkingView());
      } catch (error) {
        const message = error instanceof Error ? error.message : "Working view is unavailable.";
        writeJson(res, 503, {
          error: {
            code: "AUGNES_READ_API_UNAVAILABLE",
            message,
            retryable: true,
          },
        });
      }
      return;
    }

    if (req.method === "POST" && url.pathname === "/casefile") {
      let requestBody: unknown;
      try {
        requestBody = await readJsonBody(req);
      } catch (error) {
        writeBadRequest(res, error instanceof Error ? error.message : "Invalid request body.");
        return;
      }

      if (!isCasefileRequest(requestBody)) {
        writeBadRequest(res, "Casefile request must be a JSON object with an optional string subject.");
        return;
      }

      try {
        writeJson(res, 200, await readCasefile());
      } catch (error) {
        const message = error instanceof Error ? error.message : "Casefile is unavailable.";
        writeJson(res, 503, {
          error: {
            code: "AUGNES_READ_API_UNAVAILABLE",
            message,
            retryable: true,
          },
        });
      }
      return;
    }

    if (req.method === "POST" && url.pathname === "/search") {
      let requestBody: unknown;
      try {
        requestBody = await readJsonBody(req);
      } catch (error) {
        writeBadRequest(res, error instanceof Error ? error.message : "Invalid request body.");
        return;
      }

      const parsedRequest = parseSearchRequest(requestBody);
      if (!parsedRequest) {
        writeBadRequest(res, "Search request must include a non-empty string query, optional scope array, and optional string timeRange.");
        return;
      }

      try {
        void parsedRequest.timeRange;
        writeJson(res, 200, await searchEvidenceIndex(parsedRequest.query, parsedRequest.scope));
      } catch (error) {
        const message = error instanceof Error ? error.message : "Search is unavailable.";
        writeJson(res, 503, {
          error: {
            code: "AUGNES_READ_API_UNAVAILABLE",
            message,
            retryable: true,
          },
        });
      }
      return;
    }

    if (req.method === "GET" && url.pathname.startsWith("/fetch/")) {
      const rawId = url.pathname.slice("/fetch/".length);
      let id: string;
      try {
        id = decodeURIComponent(rawId);
      } catch {
        writeBadRequest(res, "Fetch id must be URI-decodable.");
        return;
      }

      if (!id) {
        writeBadRequest(res, "Fetch id is required.");
        return;
      }

      try {
        const record = await fetchRecord(id);
        if (!record) {
          writeNotFound(res);
          return;
        }

        writeJson(res, 200, FetchResultSchema.parse(record));
      } catch (error) {
        const message = error instanceof Error ? error.message : "Fetch is unavailable.";
        writeJson(res, 503, {
          error: {
            code: "AUGNES_READ_API_UNAVAILABLE",
            message,
            retryable: true,
          },
        });
      }
      return;
    }

    if (req.method === "GET" && url.pathname === "/continuity-report") {
      try {
        writeJson(res, 200, await readContinuityReport());
      } catch (error) {
        const message = error instanceof Error ? error.message : "Continuity report is unavailable.";
        writeJson(res, 503, {
          error: {
            code: "AUGNES_READ_API_UNAVAILABLE",
            message,
            retryable: true,
          },
        });
      }
      return;
    }

    if (req.method === "GET" && url.pathname === "/boundary-packet") {
      try {
        const packet = await readBoundaryPacket();
        const requestedId = url.searchParams.get("boundaryId");
        if (!boundaryMatchesRequest(packet, requestedId)) {
          writeJson(res, 404, {
            error: {
              code: "BOUNDARY_NOT_FOUND",
              message: `Boundary packet ${requestedId} was not found.`,
              retryable: false,
            },
          });
          return;
        }

        writeJson(res, 200, packet);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Boundary packet is unavailable.";
        writeJson(res, 503, {
          error: {
            code: "AUGNES_READ_API_UNAVAILABLE",
            message,
            retryable: true,
          },
        });
      }
      return;
    }

    if (req.method === "POST" && url.pathname === "/strategy") {
      let requestBody: unknown;
      try {
        requestBody = await readJsonBody(req);
      } catch (error) {
        writeBadRequest(res, error instanceof Error ? error.message : "Invalid request body.");
        return;
      }

      if (!isStrategyRequest(requestBody)) {
        writeBadRequest(res, "Strategy request must be a JSON object with an optional string subject.");
        return;
      }

      try {
        writeJson(res, 200, await readStrategyRationale());
      } catch (error) {
        const message = error instanceof Error ? error.message : "Strategy rationale is unavailable.";
        writeJson(res, 503, {
          error: {
            code: "AUGNES_READ_API_UNAVAILABLE",
            message,
            retryable: true,
          },
        });
      }
      return;
    }

    if (req.method === "GET" && url.pathname === "/governance-audit") {
      try {
        writeJson(res, 200, await readGovernanceAudit());
      } catch (error) {
        const message = error instanceof Error ? error.message : "Governance audit is unavailable.";
        writeJson(res, 503, {
          error: {
            code: "AUGNES_READ_API_UNAVAILABLE",
            message,
            retryable: true,
          },
        });
      }
      return;
    }

    if (req.method === "POST" && url.pathname === "/repo/navigate") {
      let requestBody: unknown;
      try {
        requestBody = await readJsonBody(req);
      } catch (error) {
        writeBadRequest(res, error instanceof Error ? error.message : "Invalid request body.");
        return;
      }

      const parsedRequest = parseRepoNavigateRequest(requestBody);
      if (!parsedRequest) {
        writeBadRequest(res, "Repo navigation request must include a non-empty string query.");
        return;
      }

      try {
        writeJson(res, 200, await navigateRepo(parsedRequest.query));
      } catch (error) {
        const message = error instanceof Error ? error.message : "Repo navigation is unavailable.";
        writeJson(res, 503, {
          error: {
            code: "AUGNES_READ_API_UNAVAILABLE",
            message,
            retryable: true,
          },
        });
      }
      return;
    }

    writeNotFound(res);
  });
}

function isDirectExecution(): boolean {
  return Boolean(process.argv[1]) && pathToFileURL(process.argv[1]).href === import.meta.url;
}

if (isDirectExecution()) {
  const server = createDevReadApiServer();
  server.listen(port, () => {
    console.log(`Augnes dev read API listening on http://127.0.0.1:${port}`);
    console.log(`GET /working-view -> ${readModelSnapshotFile} (App Read Projection Model)`);
    console.log(`POST /casefile -> ${casefileFile}`);
    console.log(`POST /search + GET /fetch/:id -> ${evidenceIndexFile}`);
    console.log(`GET /continuity-report -> ${continuityReportFile}`);
    console.log(`GET /boundary-packet -> ${boundaryPacketFile}`);
    console.log(`POST /strategy -> ${strategyRationaleFile}`);
    console.log(`GET /governance-audit -> ${governanceAuditFile}`);
    console.log(`POST /repo/navigate -> ${repoNavigationFile}`);
  });
}
