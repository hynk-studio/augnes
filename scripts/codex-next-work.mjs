import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const DEFAULT_SCOPE = "project:augnes";
const RESEARCH_WORK_ID = "AG-DOGFOOD-RESEARCH-001";
const DEFAULT_WORK_ID = "AG-006";
const JSON_BEGIN = "BEGIN_AUGNES_CODEX_NEXT_WORK_JSON";
const JSON_END = "END_AUGNES_CODEX_NEXT_WORK_JSON";

const rootDir = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const seedPath = path.join(rootDir, "scripts", "demo-seed.mjs");
const resultReportTemplatePath = "docs/AUGNES_CODEX_RESULT_REPORT_TEMPLATE_V0_1.md";

const defaultStopConditions = [
  "Stop if the requested work requires paper ingestion, paper fetching, provider/OpenAI calls, embeddings, RAG, vector search, crawlers, indexing, DB migrations, durable research state writes, proof/evidence writes, event/status/state mutation, App/MCP tools, or work_loop_readonly widening.",
  "Stop if no live Work Brief, seeded work item, or repo docs fallback can identify the work item without invention.",
  "Stop if expected files or expected checks are unavailable from the Work Brief, seed, or documented repo fallback.",
];

const bootstrapAuthorityBoundary =
  "Read-only Codex worker work discovery only. No automatic Codex execution, no automatic report generation, no automatic GitHub fetch, no proof/evidence write, no work close/status mutation, no event creation/mutation, no state commit/reject, no paper ingestion, no paper fetching, no provider/OpenAI calls, no embeddings/RAG/vector search, no DB migration, no durable research state write, no automatic work item creation, no shell execution from App/MCP, no branch/PR creation from App/MCP code, no PR review submission, no merge/publish/retry/replay/deploy controls, no new user-facing App/MCP tools, and no widening of the work_loop_readonly Developer Mode tool surface.";

export function parseArgs(argv) {
  const parsed = {
    scope: process.env.CODEX_SCOPE?.trim() || process.env.AUGNES_SCOPE?.trim() || DEFAULT_SCOPE,
    workId: process.env.CODEX_WORK_ID?.trim() || null,
    preferResearch: false,
    runtimeMode: "auto",
    apiBaseUrl: process.env.AUGNES_API_BASE_URL?.trim() || null,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--scope") {
      parsed.scope = requireValue(argv, index, arg);
      index += 1;
      continue;
    }

    if (arg.startsWith("--scope=")) {
      parsed.scope = arg.slice("--scope=".length);
      continue;
    }

    if (arg === "--work-id") {
      parsed.workId = requireValue(argv, index, arg);
      index += 1;
      continue;
    }

    if (arg.startsWith("--work-id=")) {
      parsed.workId = arg.slice("--work-id=".length);
      continue;
    }

    if (arg === "--prefer-research") {
      parsed.preferResearch = true;
      continue;
    }

    if (arg === "--no-runtime") {
      parsed.runtimeMode = "never";
      continue;
    }

    if (arg === "--runtime") {
      parsed.runtimeMode = "force";
      continue;
    }

    if (arg === "--api-base-url") {
      parsed.apiBaseUrl = trimTrailingSlash(requireValue(argv, index, arg));
      parsed.runtimeMode = "force";
      index += 1;
      continue;
    }

    if (arg.startsWith("--api-base-url=")) {
      parsed.apiBaseUrl = trimTrailingSlash(arg.slice("--api-base-url=".length));
      parsed.runtimeMode = "force";
      continue;
    }

    throw new Error(`CODEX_NEXT_WORK_UNKNOWN_ARG ${arg}`);
  }

  parsed.scope = parsed.scope.trim();
  parsed.workId = parsed.workId?.trim() || null;
  parsed.apiBaseUrl = parsed.apiBaseUrl ? trimTrailingSlash(parsed.apiBaseUrl) : null;

  if (!parsed.scope) {
    throw new Error("CODEX_NEXT_WORK_SCOPE_REQUIRED");
  }

  return parsed;
}

export async function buildBootstrapResult(options = {}) {
  const parsed = {
    scope: options.scope || DEFAULT_SCOPE,
    workId: options.workId || null,
    preferResearch: options.preferResearch === true,
    runtimeMode: options.runtimeMode || "auto",
    apiBaseUrl: options.apiBaseUrl || process.env.AUGNES_API_BASE_URL?.trim() || null,
  };

  const seedSource = fs.readFileSync(seedPath, "utf8");
  const selectedWorkId = selectWorkId(parsed, seedSource);
  const fallbackWork = readSeededWorkItem(seedSource, selectedWorkId);
  const runtimeDecision = resolveRuntimeDecision(parsed);

  if (runtimeDecision.attempted) {
    try {
      const workBrief = await readRuntimeWorkBrief({
        apiBaseUrl: runtimeDecision.apiBaseUrl,
        scope: parsed.scope,
        workId: selectedWorkId,
      });
      return buildRuntimeResult({ parsed, selectedWorkId, workBrief });
    } catch (error) {
      const reason = error instanceof Error ? error.message : "CODEX_NEXT_WORK_RUNTIME_UNAVAILABLE";
      return buildFallbackResult({
        parsed,
        selectedWorkId,
        fallbackWork,
        runtimeAttempted: true,
        fallbackReason: reason,
      });
    }
  }

  return buildFallbackResult({
    parsed,
    selectedWorkId,
    fallbackWork,
    runtimeAttempted: false,
    fallbackReason: runtimeDecision.reason,
  });
}

export function formatHumanSummary(result) {
  const lines = [
    "Augnes Codex next work",
    `source: ${result.source}`,
    `runtime_attempted: ${result.runtime_attempted}`,
    `runtime_available: ${result.runtime_available}`,
    `fallback_reason: ${result.fallback_reason}`,
    `work_id: ${result.work_id ?? "not found"}`,
    `scope: ${result.scope}`,
    `title: ${result.title ?? "not found"}`,
    `codex_worker_next_action: ${result.codex_worker_next_action}`,
  ];

  return lines.join("\n");
}

function requireValue(argv, index, arg) {
  const value = argv[index + 1];
  if (!value || value.startsWith("--")) {
    throw new Error(`CODEX_NEXT_WORK_VALUE_REQUIRED ${arg}`);
  }
  return value;
}

function trimTrailingSlash(value) {
  return value.trim().replace(/\/+$/, "");
}

function selectWorkId(parsed, seedSource) {
  if (parsed.workId) return parsed.workId;
  if (parsed.preferResearch) return RESEARCH_WORK_ID;

  for (const workId of readSeededWorkIds(seedSource)) {
    const work = readSeededWorkItem(seedSource, workId);
    if (work && !isCompletedWorkStatus(work.status)) {
      return workId;
    }
  }

  if (findSeededWorkBlock(seedSource, DEFAULT_WORK_ID)) {
    return DEFAULT_WORK_ID;
  }

  const firstWorkId = readSeededWorkIds(seedSource)[0];
  return firstWorkId ?? null;
}

function resolveRuntimeDecision(parsed) {
  const apiBaseUrl = parsed.apiBaseUrl ? trimTrailingSlash(parsed.apiBaseUrl) : null;

  if (parsed.runtimeMode === "never") {
    return { attempted: false, available: false, apiBaseUrl: null, reason: "runtime_disabled_by_flag" };
  }

  if (parsed.runtimeMode === "force") {
    if (!apiBaseUrl) {
      return { attempted: false, available: false, apiBaseUrl: null, reason: "runtime_base_url_missing" };
    }
    return { attempted: true, available: false, apiBaseUrl, reason: "runtime_requested" };
  }

  if (apiBaseUrl) {
    return { attempted: true, available: false, apiBaseUrl, reason: "runtime_configured" };
  }

  return { attempted: false, available: false, apiBaseUrl: null, reason: "runtime_not_configured" };
}

async function readRuntimeWorkBrief({ apiBaseUrl, scope, workId }) {
  if (!apiBaseUrl || !workId) {
    throw new Error("CODEX_NEXT_WORK_RUNTIME_CONFIG_MISSING");
  }

  const url = new URL(`/api/work/${encodeURIComponent(workId)}/brief`, `${apiBaseUrl}/`);
  url.searchParams.set("scope", scope);

  const runtimeFetch = globalThis.fetch;
  if (typeof runtimeFetch !== "function") {
    throw new Error("CODEX_NEXT_WORK_RUNTIME_FETCH_UNAVAILABLE");
  }

  let response;
  try {
    response = await runtimeFetch(url, { method: "GET" });
  } catch {
    throw new Error("CODEX_NEXT_WORK_RUNTIME_UNAVAILABLE");
  }

  if (!response.ok) {
    throw new Error(`CODEX_NEXT_WORK_RUNTIME_BRIEF_FAILED status=${response.status}`);
  }

  try {
    return await response.json();
  } catch {
    throw new Error("CODEX_NEXT_WORK_RUNTIME_INVALID_JSON");
  }
}

function buildRuntimeResult({ parsed, selectedWorkId, workBrief }) {
  const work = objectFromUnknown(workBrief.work);
  const codexHandoff = objectFromUnknown(workBrief.codex_handoff);
  const relatedProof = objectFromUnknown(workBrief.related_proof);
  const links = objectFromUnknown(work.links);
  const expectedFiles = readStringsFromUnknown(
    codexHandoff.expected_files ?? links.expected_files ?? relatedProof.docs,
  );
  const expectedChecks = readStringsFromUnknown(
    codexHandoff.expected_checks ?? codexHandoff.suggested_verification,
  );
  const stopConditions = readStringsFromUnknown(codexHandoff.stop_conditions);
  const constraints = readStringsFromUnknown(codexHandoff.constraints);

  return {
    source: "runtime_work_brief",
    runtime_attempted: true,
    runtime_available: true,
    fallback_reason: "none",
    work_id: stringFromUnknown(workBrief.work_id) || selectedWorkId,
    scope: stringFromUnknown(workBrief.scope) || parsed.scope,
    title: stringFromUnknown(work.title) || "Runtime Work Brief",
    current_task:
      stringFromUnknown(codexHandoff.task_brief) ||
      stringFromUnknown(work.next_action) ||
      stringFromUnknown(workBrief.next_action) ||
      "Read the runtime Work Brief and follow its bounded handoff.",
    next_step:
      stringFromUnknown(workBrief.next_action) ||
      stringFromUnknown(work.next_action) ||
      "Follow the runtime Work Brief.",
    expected_files: expectedFiles,
    expected_checks: expectedChecks,
    stop_conditions: stopConditions.length ? stopConditions : defaultStopConditions,
    authority_boundary_summary: constraints.length ? constraints.join(" ") : bootstrapAuthorityBoundary,
    result_report_template: resultReportTemplatePath,
    next_return_path: "Return through codexResultText or codexResultPaste for Augnes preview review.",
    codex_worker_next_action:
      "Use the runtime Work Brief as source of truth, keep skipped checks honest, and report any unavailable runtime or host observation explicitly.",
  };
}

function buildFallbackResult({
  parsed,
  selectedWorkId,
  fallbackWork,
  runtimeAttempted,
  fallbackReason,
}) {
  if (!selectedWorkId || !fallbackWork) {
    return {
      source: "blocked",
      runtime_attempted: runtimeAttempted,
      runtime_available: false,
      fallback_reason: fallbackReason || "work_item_not_found",
      work_id: selectedWorkId,
      scope: parsed.scope,
      title: null,
      current_task: null,
      next_step: null,
      expected_files: [],
      expected_checks: [],
      stop_conditions: defaultStopConditions,
      authority_boundary_summary: bootstrapAuthorityBoundary,
      result_report_template: resultReportTemplatePath,
      next_return_path: "Stop and report blocked. Do not invent a work item or Work Brief.",
      codex_worker_next_action:
        "Stop and report blocked because no live Work Brief or deterministic repo fallback identified the requested work.",
    };
  }

  const authorityExpectations = fallbackWork.authority_boundary_expectations;
  const docs = fallbackWork.docs;
  const expectedFiles = fallbackWork.expected_files;
  const expectedChecks = fallbackWork.expected_checks;
  const implementationAnchors = fallbackWork.implementation_anchors;
  const isResearchWork = fallbackWork.work_id === RESEARCH_WORK_ID;
  const fallbackDocs = isResearchWork
    ? ["docs/AUGNES_RESEARCH_ACCUMULATION_SCENARIO_PACK_V0_1.md", ...docs]
    : docs;

  return {
    source: "repo_seed_fallback",
    runtime_attempted: runtimeAttempted,
    runtime_available: false,
    fallback_reason: fallbackReason,
    work_id: fallbackWork.work_id,
    scope: parsed.scope,
    title: fallbackWork.title,
    current_task: fallbackWork.summary,
    next_step: fallbackWork.next_action,
    expected_files: expectedFiles,
    expected_checks: expectedChecks,
    stop_conditions: [
      ...defaultStopConditions,
      "Do not treat repo seed/docs fallback as live Work Brief retrieval.",
    ],
    authority_boundary_summary: authorityExpectations.length
      ? authorityExpectations.join("; ")
      : bootstrapAuthorityBoundary,
    result_report_template: resultReportTemplatePath,
    next_return_path: "Paste the field-first report through codexResultText or codexResultPaste for Augnes preview review.",
    codex_worker_next_action: isResearchWork
      ? "Use AG-DOGFOOD-RESEARCH-001 repo seed fallback and related docs only when runtime is unavailable; implement only the bounded preview docs/smoke contract if still requested."
      : "Use the selected seeded work item only as deterministic fallback context when runtime is unavailable; stop if implementation scope is not bounded by repo-backed expected files/checks.",
    repo_fallback_sources: uniqueStrings([seedPathRelative(), ...fallbackDocs, ...implementationAnchors]),
  };
}

function readSeededWorkItem(seedSource, workId) {
  if (!workId) return null;

  const block = findSeededWorkBlock(seedSource, workId);
  if (!block) return null;

  return {
    work_id: workId,
    title: readStringProperty(block, "title"),
    status: readStringProperty(block, "status"),
    priority: readStringProperty(block, "priority"),
    summary: readStringProperty(block, "summary"),
    next_action: readStringProperty(block, "nextAction"),
    docs: readArrayProperty(block, "docs"),
    expected_files: readArrayProperty(block, "expected_files"),
    expected_checks: readArrayProperty(block, "expected_checks"),
    implementation_anchors: readArrayProperty(block, "implementation_anchors"),
    authority_boundary_expectations: readArrayProperty(block, "authority_boundary_expectations"),
  };
}

function readSeededWorkIds(seedSource) {
  const workIds = [...seedSource.matchAll(/workId:\s*"([^"]+)"/g)].map((match) => match[1]);
  return uniqueStrings(workIds);
}

function isCompletedWorkStatus(status) {
  return ["completed", "done", "closed", "cancelled", "canceled"].includes(status);
}

function findSeededWorkBlock(seedSource, workId) {
  const marker = `workId: "${workId}"`;
  const markerIndex = seedSource.indexOf(marker);
  if (markerIndex === -1) return null;

  const openIndex = seedSource.lastIndexOf("{", markerIndex);
  if (openIndex === -1) return null;

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let index = openIndex; index < seedSource.length; index += 1) {
    const char = seedSource[index];

    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === '"') {
        inString = false;
      }
      continue;
    }

    if (char === '"') {
      inString = true;
      continue;
    }

    if (char === "{") {
      depth += 1;
      continue;
    }

    if (char === "}") {
      depth -= 1;
      if (depth === 0) {
        return seedSource.slice(openIndex, index + 1);
      }
    }
  }

  return null;
}

function readStringProperty(block, property) {
  const match = block.match(new RegExp(`${escapeRegExp(property)}:\\s*"([^"]*)"`, "m"));
  if (match) return match[1];

  const multiline = block.match(new RegExp(`${escapeRegExp(property)}:\\s*\\n\\s*"([\\s\\S]*?)"`, "m"));
  return multiline?.[1] ?? "";
}

function readArrayProperty(block, property) {
  const match = block.match(new RegExp(`${escapeRegExp(property)}:\\s*\\[([\\s\\S]*?)\\]`, "m"));
  if (!match) return [];

  return [...match[1].matchAll(/"([^"]+)"/g)].map((entry) => entry[1]);
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function objectFromUnknown(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value) ? value : {};
}

function readStringsFromUnknown(value) {
  return Array.isArray(value) ? value.filter((item) => typeof item === "string") : [];
}

function stringFromUnknown(value) {
  return typeof value === "string" ? value : "";
}

function uniqueStrings(values) {
  return [...new Set(values.filter(Boolean))];
}

function seedPathRelative() {
  return "scripts/demo-seed.mjs";
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const result = await buildBootstrapResult(options);

  console.log(formatHumanSummary(result));
  console.log(JSON_BEGIN);
  console.log(JSON.stringify(result, null, 2));
  console.log(JSON_END);

  if (result.source === "blocked") {
    process.exitCode = 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    const message = error instanceof Error ? error.message : "CODEX_NEXT_WORK_FAILED";
    console.error(message);
    process.exitCode = 1;
  });
}
