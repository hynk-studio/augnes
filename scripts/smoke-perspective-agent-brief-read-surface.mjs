import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

const packageFile = "package.json";
const typeFile = "types/perspective-agent-brief.ts";
const helperFile = "lib/readonly-api/perspective-agent-brief.ts";
const routeFile = "app/api/augnes/read/perspective-agent-brief/route.ts";
const docFile = "docs/PERSPECTIVE_AGENT_BRIEF_READ_SURFACE_V0_1.md";
const smokeFile = "scripts/smoke-perspective-agent-brief-read-surface.mjs";
const reportFile = "reports/2026-06-07-perspective-agent-brief-read-surface.md";
const cockpitFile = "components/augnes-cockpit.tsx";
const temporalMapFile =
  "lib/perspective-ingest/perspective-temporal-spatial-map.ts";
const workbenchProjectionFile =
  "lib/perspective-ingest/perspective-workbench-projection.ts";
const agentBriefBuilderFile =
  "lib/perspective-ingest/perspective-agent-brief.ts";
const projectionBuilderSmokeFile =
  "scripts/smoke-perspective-temporal-spatial-projection-builders.mjs";
const workbenchSmokeFile =
  "scripts/smoke-cockpit-perspective-workbench-temporal-underlay.mjs";
const capsuleContractSmokeFile =
  "scripts/smoke-perspective-capsule-contract.mjs";
const readonlyAccessGuardSmokeFile =
  "scripts/smoke-readonly-api-route-access-guard.mjs";
const readonlyResponseShapeSmokeFile =
  "scripts/smoke-readonly-api-route-response-shape-boundary.mjs";
const readonlyAuthScopeAdapterSmokeFile =
  "scripts/smoke-readonly-api-route-auth-scope-adapter-boundary.mjs";
const readonlyAuthSourceSelectionSmokeFile =
  "scripts/smoke-readonly-api-route-auth-source-selection.mjs";

const packageJson = JSON.parse(readFileSync(packageFile, "utf8"));
const typeText = readFileSync(typeFile, "utf8");
const helperText = readFileSync(helperFile, "utf8");
const routeText = readFileSync(routeFile, "utf8");
const docText = readFileSync(docFile, "utf8");
const cockpitText = readFileSync(cockpitFile, "utf8");
const temporalMapText = readFileSync(temporalMapFile, "utf8");
const workbenchProjectionText = readFileSync(workbenchProjectionFile, "utf8");
const agentBriefBuilderText = readFileSync(agentBriefBuilderFile, "utf8");

const helperModule = await import("../lib/readonly-api/perspective-agent-brief.ts");
const routeModule = await import(
  "../app/api/augnes/read/perspective-agent-brief/route.ts"
);

const {
  PERSPECTIVE_AGENT_BRIEF_BOUNDARY_CLASS,
  PERSPECTIVE_AGENT_BRIEF_LOCAL_READ_HEADER,
  PERSPECTIVE_AGENT_BRIEF_LOCAL_READ_MARKER,
  PERSPECTIVE_AGENT_BRIEF_SCOPE,
  buildPerspectiveAgentBriefReadResponse,
  buildPerspectiveAgentBriefSourcePreview,
  validatePerspectiveAgentBriefReadRequest,
} = helperModule;
const { GET } = routeModule;

const allowedChangedFiles = new Set([
  packageFile,
  typeFile,
  helperFile,
  routeFile,
  docFile,
  smokeFile,
  reportFile,
  projectionBuilderSmokeFile,
  workbenchSmokeFile,
  capsuleContractSmokeFile,
  readonlyAccessGuardSmokeFile,
  readonlyResponseShapeSmokeFile,
  readonlyAuthScopeAdapterSmokeFile,
  readonlyAuthSourceSelectionSmokeFile,
]);

assert.equal(
  packageJson.scripts["smoke:perspective-agent-brief-read-surface"],
  "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json scripts/smoke-perspective-agent-brief-read-surface.mjs",
  "package.json must register smoke:perspective-agent-brief-read-surface",
);

for (const file of [typeFile, helperFile, routeFile, docFile, smokeFile]) {
  assert.equal(existsSync(file), true, `${file} must exist`);
}

assertContainsAll(docText, [
  "# Perspective Agent Brief Read Surface v0.1",
  "Agent Brief surface for Perspective",
  "consumption surface, not ingress",
  "buildPerspectiveAgentBrief",
  "does not alter the Human Workbench UI",
  "source=sample:chatgpt",
  "source=sample:codex",
  "selected_node_id is optional",
  "Unknown selected node ids fail closed",
  "Response Shape Summary",
  "Authority Boundary",
  "External API, OAuth, and import sources remain future ingress providers",
  "ChatGPT Apps, Codex plugins, and agents remain future consumers or handoff surfaces",
  "Augnes internal formation remains responsible for constellation construction, Event Rail structure, temporal placement, research perspective, and projection generation",
  "full packet text",
  "raw source text",
  "packet textarea content",
  "full diagnostics",
  "FormationReceipt body",
  "provider/model/API calls",
  "GitHub calls or mutation",
  "Codex execution",
  "Design Perspective ingress admission model for external/OAuth sources",
]);

assertContainsAll(typeText, [
  "PerspectiveAgentBriefReadResponseV0",
  "PerspectiveAgentBriefReadErrorBodyV0",
  "PerspectiveAgentBriefReadSourceQuery",
  "PerspectiveAgentBriefReadRouteId",
  "PerspectiveAgentBriefReadBoundaryClass",
  "response_version: \"perspective_agent_brief_read.v0.1\"",
  "boundary_class: PerspectiveAgentBriefReadBoundaryClass",
  "brief: PerspectiveAgentBriefV0",
  "source_refs: PerspectiveIngestConstellationPreviewResponse[\"source_refs\"]",
  "external_calls: false",
  "persistence: false",
  "graph_db: false",
  "proof_evidence_readiness_writes: false",
  "codex_execution: false",
]);

assertContainsAll(helperText, [
  "augnes.read.perspective-agent-brief.v0.1",
  "perspective_agent_brief",
  "read_only_local_perspective_agent_brief",
  "x-augnes-local-readonly",
  "perspective-agent-brief-v0.1",
  "PERSPECTIVE_AGENT_BRIEF_ACCESS_POLICY",
  "READONLY_LOCAL_HOSTS",
  "validateReadonlyApiLocalAccess",
  "validateReadonlyApiLocalDevAuthAdapter",
  "source === \"sample:chatgpt\"",
  "source === \"sample:codex\"",
  "unknown_selected_node",
  "selected_node_id must match an existing preview node",
  "buildPerspectiveAgentBrief({",
  "scope_mode: \"whole_constellation\"",
  "scope_label: \"Whole Constellation\"",
  "no provider/model/API calls",
  "no OAuth/import source ingress",
]);

assertContainsAll(routeText, [
  "export const runtime = \"nodejs\"",
  "export const dynamic = \"force-dynamic\"",
  "export function GET(request: Request)",
  "validatePerspectiveAgentBriefReadRequest(request)",
  "buildPerspectiveAgentBriefReadResponse({",
  "source: validation.source",
  "selectedNodeId: validation.selected_node_id",
  "buildPerspectiveAgentBriefReadError({",
]);
assert(
  routeText.includes("searchParams.get(\"source\")") ||
    helperText.includes("searchParams.get(\"source\")"),
  "route/helper must support source query param",
);
assert(
  routeText.includes("selected_node_id") ||
    helperText.includes("selected_node_id"),
  "route/helper must support selected_node_id query param",
);

assert.equal(PERSPECTIVE_AGENT_BRIEF_SCOPE, "project:augnes");
assert.equal(
  PERSPECTIVE_AGENT_BRIEF_BOUNDARY_CLASS,
  "read_only_local_perspective_agent_brief",
);
assert.equal(PERSPECTIVE_AGENT_BRIEF_LOCAL_READ_HEADER, "x-augnes-local-readonly");
assert.equal(
  PERSPECTIVE_AGENT_BRIEF_LOCAL_READ_MARKER,
  "perspective-agent-brief-v0.1",
);

const chatGptWhole = buildPerspectiveAgentBriefReadResponse({
  source: "sample:chatgpt",
  generatedAt: "2026-06-08T00:00:00.000Z",
});
const chatGptPreview = buildPerspectiveAgentBriefSourcePreview({
  source: "sample:chatgpt",
});
assertAgentBriefEnvelope(chatGptWhole, {
  expectedSource: "sample:chatgpt",
  expectedSelectedNodeId: null,
});
assert.equal(chatGptWhole.brief.brief_version, "perspective_brief.v0.1");
assert.equal(chatGptWhole.brief.surface, "Perspective");
assert.equal(chatGptWhole.brief.selected.id, "whole_constellation");
assert.equal(chatGptWhole.brief.spatial_context.node_count, 7);
assert.equal(chatGptWhole.brief.spatial_context.edge_count, 8);
assert.equal(chatGptWhole.brief.tensions.length, 2);
assert.deepEqual(chatGptWhole.brief.temporal_context.primary_spine, [
  "session",
  "decision",
  "handoff",
  "current_view",
  "next_perspective",
]);
assert.deepEqual(chatGptWhole.brief.temporal_context.satellites, {
  parent: "handoff",
  items: ["pr", "review", "closeout"],
});
assert(Array.isArray(chatGptWhole.brief.surface_context.related_surfaces));
assert(Array.isArray(chatGptWhole.brief.next_actions));
assert.equal(chatGptWhole.brief.handoff.chatgpt_review_available, true);
assert.equal(chatGptWhole.brief.handoff.codex_handoff_available, true);
assert.deepEqual(chatGptWhole.brief.authority, {
  mode: "advisory_local_preview",
  external_calls: false,
  persistence: false,
  codex_execution: false,
});
assert.equal(chatGptWhole.brief.refs.full_refs_available, true);
assert.equal(typeof chatGptWhole.brief.refs.evidence_pointer_count, "number");
assertNoForbiddenPayloadText("ChatGPT whole response", chatGptWhole);

const productConcept = buildPerspectiveAgentBriefReadResponse({
  source: "sample:chatgpt",
  selectedNodeId: "node.sample_chatgpt.product_concept",
  generatedAt: "2026-06-08T00:00:00.000Z",
});
assertAgentBriefEnvelope(productConcept, {
  expectedSource: "sample:chatgpt",
  expectedSelectedNodeId: "node.sample_chatgpt.product_concept",
});
assert.equal(productConcept.brief.selected.id, "node.sample_chatgpt.product_concept");
assert.deepEqual(productConcept.brief.temporal_context.related_temporal_nodes, [
  "decision",
  "current_view",
]);

const packetBrief = buildPerspectiveAgentBriefReadResponse({
  source: "sample:chatgpt",
  selectedNodeId: "node.sample_chatgpt.packet",
  generatedAt: "2026-06-08T00:00:00.000Z",
});
assert.equal(packetBrief.brief.selected.id, "node.sample_chatgpt.packet");
assert.deepEqual(packetBrief.brief.temporal_context.related_temporal_nodes, [
  "handoff",
  "review",
  "pr",
]);
assertNoForbiddenPayloadText("ChatGPT packet response", packetBrief);

const codexWhole = buildPerspectiveAgentBriefReadResponse({
  source: "sample:codex",
  generatedAt: "2026-06-08T00:00:00.000Z",
});
assertAgentBriefEnvelope(codexWhole, {
  expectedSource: "sample:codex",
  expectedSelectedNodeId: null,
});
assert.equal(codexWhole.brief.brief_version, "perspective_brief.v0.1");
assert.equal(codexWhole.brief.surface, "Perspective");
assert(codexWhole.brief.spatial_context.node_count > 0);
assert(codexWhole.brief.spatial_context.edge_count > 0);
assertNoForbiddenPayloadText("Codex whole response", codexWhole);

assert.deepEqual(
  validatePerspectiveAgentBriefReadRequest(
    makeReadRequest({ source: "sample:chatgpt" }),
  ),
  {
    ok: true,
    scope: "project:augnes",
    source: "sample:chatgpt",
    selected_node_id: null,
    route_id: "augnes.read.perspective-agent-brief.v0.1",
    route_family: "perspective_agent_brief",
    local_authorized: true,
  },
);

const unknownSelectedValidation = validatePerspectiveAgentBriefReadRequest(
  makeReadRequest({
    source: "sample:chatgpt",
    selectedNodeId: "node.sample_chatgpt.missing",
  }),
);
assert.equal(unknownSelectedValidation.ok, false);
assert.equal(unknownSelectedValidation.code, "unknown_selected_node");
assert.equal(unknownSelectedValidation.status, 400);

const unsupportedSourceValidation = validatePerspectiveAgentBriefReadRequest(
  makeReadRequest({ source: "manual:pasted_text" }),
);
assert.equal(unsupportedSourceValidation.ok, false);
assert.equal(unsupportedSourceValidation.code, "unsupported_source");
assert.equal(unsupportedSourceValidation.status, 400);

const successJson = await getJson(
  makeReadRequest({
    source: "sample:chatgpt",
    selectedNodeId: "node.sample_chatgpt.product_concept",
  }),
);
assert.equal(successJson.status, 200);
assert.equal(successJson.body.response_version, "perspective_agent_brief_read.v0.1");
assert.equal(successJson.body.meta.selected_node_id, "node.sample_chatgpt.product_concept");
assert.deepEqual(successJson.body.brief.temporal_context.related_temporal_nodes, [
  "decision",
  "current_view",
]);

const routeUnsupportedJson = await getJson(
  makeReadRequest({ source: "unknown:source" }),
);
assert.equal(routeUnsupportedJson.status, 400);
assert.equal(routeUnsupportedJson.body.error.code, "unsupported_source");

const routeUnknownNodeJson = await getJson(
  makeReadRequest({
    source: "sample:chatgpt",
    selectedNodeId: "node.sample_chatgpt.not_real",
  }),
);
assert.equal(routeUnknownNodeJson.status, 400);
assert.equal(routeUnknownNodeJson.body.error.code, "unknown_selected_node");

assertContainsAll(temporalMapText, [
  "node.sample_chatgpt.product_concept",
  "node.sample_chatgpt.packet",
  "work_context",
  "validation_report",
]);
assertContainsAll(workbenchProjectionText, [
  "buildPerspectiveWorkbenchProjection",
  "getPerspectiveWorkbenchSelectedMaterial",
]);
assertContainsAll(agentBriefBuilderText, [
  "export function buildPerspectiveAgentBrief",
  "brief_version: \"perspective_brief.v0.1\"",
  "surface: \"Perspective\"",
]);

assert.deepEqual(
  chatGptPreview.constellation.nodes.map((node) => [node.id, node.type]),
  [
    ["node.sample_chatgpt.source", "source"],
    ["node.sample_chatgpt.user_intent", "user_intent"],
    ["node.sample_chatgpt.product_concept", "product_concept"],
    ["node.sample_chatgpt.decision", "decision"],
    ["node.sample_chatgpt.unresolved_tension", "unresolved_tension"],
    ["node.sample_chatgpt.next_move", "next_move"],
    ["node.sample_chatgpt.packet", "packet"],
  ],
  "sample ChatGPT node ids and types must remain unchanged",
);
assert.deepEqual(
  chatGptPreview.constellation.edges.map((edge) => [
    edge.id,
    edge.type,
    edge.source,
    edge.target,
  ]),
  [
    [
      "edge.sample_chatgpt.source.to.user_intent",
      "derived_from",
      "node.sample_chatgpt.source",
      "node.sample_chatgpt.user_intent",
    ],
    [
      "edge.sample_chatgpt.user_intent.to.product_concept",
      "refines",
      "node.sample_chatgpt.user_intent",
      "node.sample_chatgpt.product_concept",
    ],
    [
      "edge.sample_chatgpt.product_concept.to.decision",
      "supports",
      "node.sample_chatgpt.product_concept",
      "node.sample_chatgpt.decision",
    ],
    [
      "edge.sample_chatgpt.decision.to.unresolved_tension",
      "conflicts_with",
      "node.sample_chatgpt.decision",
      "node.sample_chatgpt.unresolved_tension",
    ],
    [
      "edge.sample_chatgpt.unresolved_tension.to.next_move",
      "warns_against",
      "node.sample_chatgpt.unresolved_tension",
      "node.sample_chatgpt.next_move",
    ],
    [
      "edge.sample_chatgpt.decision.to.next_move",
      "next_candidate",
      "node.sample_chatgpt.decision",
      "node.sample_chatgpt.next_move",
    ],
    [
      "edge.sample_chatgpt.next_move.to.packet",
      "depends_on",
      "node.sample_chatgpt.next_move",
      "node.sample_chatgpt.packet",
    ],
    [
      "edge.sample_chatgpt.source.to.packet",
      "evidence_for",
      "node.sample_chatgpt.source",
      "node.sample_chatgpt.packet",
    ],
  ],
  "sample ChatGPT edge ids and types must remain unchanged",
);

assert.equal(
  /\bbuildPerspectiveAgentBrief\b/.test(cockpitText),
  false,
  "Cockpit must not render or import the Agent Brief builder",
);
assert.equal(
  /perspective_agent_brief_read|perspective-agent-brief/.test(cockpitText),
  false,
  "Cockpit must not include a hidden Agent Brief dump or route hook",
);
assert.equal(
  /\brulecraft\b/i.test(cockpitText),
  false,
  "Rulecraft must remain unexposed in product-facing Cockpit UI",
);

for (const changedFile of collectChangedFiles()) {
  assert(
    allowedChangedFiles.has(changedFile),
    `Agent Brief read surface changed an out-of-scope file: ${changedFile}`,
  );
  assert(
    !changedFile.startsWith("db/") &&
      !changedFile.startsWith("migrations/") &&
      !changedFile.includes("provider") &&
      !changedFile.includes("model"),
    `Agent Brief read surface must not touch DB/migrations/provider/model files: ${changedFile}`,
  );
}

for (const [file, text] of [
  [typeFile, typeText],
  [helperFile, helperText],
  [routeFile, routeText],
  [docFile, docText],
]) {
  for (const forbidden of [
    "fetch(",
    "api.github.com",
    "api.openai.com",
    "process.env",
    "GITHUB_TOKEN",
    "OPENAI_API_KEY",
    "use server",
  ]) {
    assert.equal(
      text.includes(forbidden),
      false,
      `${file} must not add runtime/provider/GitHub plumbing: ${forbidden}`,
    );
  }
}

console.log("PASS smoke:perspective-agent-brief-read-surface");

function makeReadRequest({ source, selectedNodeId = null }) {
  const url = new URL(
    "http://127.0.0.1/api/augnes/read/perspective-agent-brief",
  );
  url.searchParams.set("scope", "project:augnes");
  url.searchParams.set("source", source);
  if (selectedNodeId) {
    url.searchParams.set("selected_node_id", selectedNodeId);
  }

  return new Request(url.toString(), {
    method: "GET",
    headers: {
      [PERSPECTIVE_AGENT_BRIEF_LOCAL_READ_HEADER]:
        PERSPECTIVE_AGENT_BRIEF_LOCAL_READ_MARKER,
    },
  });
}

async function getJson(request) {
  const response = await GET(request);
  return {
    status: response.status,
    body: await response.json(),
  };
}

function assertAgentBriefEnvelope(response, {
  expectedSource,
  expectedSelectedNodeId,
}) {
  assert.equal(response.response_version, "perspective_agent_brief_read.v0.1");
  assert.equal(response.boundary_class, "read_only_local_perspective_agent_brief");
  assert.equal(response.meta.route_id, "augnes.read.perspective-agent-brief.v0.1");
  assert.equal(response.meta.route_family, "perspective_agent_brief");
  assert.equal(response.meta.workspace_scope, "project:augnes");
  assert.equal(response.meta.project_scope, "project:augnes");
  assert.equal(response.meta.request_scope_ref, "project:augnes");
  assert.equal(response.meta.source_query, expectedSource);
  assert.equal(response.meta.selected_node_id, expectedSelectedNodeId);
  assert.equal(response.meta.local_only, true);
  assert.equal(response.meta.read_only, true);
  assert.equal(response.meta.external_calls, false);
  assert.equal(response.meta.persistence, false);
  assert.equal(response.meta.graph_db, false);
  assert.equal(response.meta.proof_evidence_readiness_writes, false);
  assert.equal(response.meta.codex_execution, false);
  assert(Array.isArray(response.source_refs));
  assert(Array.isArray(response.authority_boundary));
}

function assertNoForbiddenPayloadText(label, value) {
  const serialized = JSON.stringify(value);
  for (const forbidden of [
    "Perspective Handoff Packet",
    "Graph nodes:",
    "Graph edges:",
    "Boundary reminders:",
    "packet textarea",
    "raw pasted text",
    "packet_text",
    "process.env",
    "GITHUB_TOKEN",
    "OPENAI_API_KEY",
    "api.github.com",
    "api.openai.com",
  ]) {
    assert.equal(
      serialized.includes(forbidden),
      false,
      `${label} must not include forbidden payload text: ${forbidden}`,
    );
  }
}

function assertContainsAll(text, snippets) {
  const normalized = normalize(text);
  for (const snippet of snippets) {
    assert(
      normalized.includes(normalize(snippet)),
      `Expected source to contain: ${snippet}`,
    );
  }
}

function normalize(text) {
  return text.replace(/\s+/g, " ").trim();
}

function collectChangedFiles() {
  const workingTreeFiles = gitLines(["diff", "--name-only", "HEAD"]);
  const branchFiles = gitLines(["diff", "--name-only", "origin/main...HEAD"]);
  const untrackedFiles = gitLines(["ls-files", "--others", "--exclude-standard"]);
  return Array.from(
    new Set([...workingTreeFiles, ...branchFiles, ...untrackedFiles]),
  ).filter(Boolean);
}

function gitLines(args) {
  try {
    return execFileSync("git", args, { encoding: "utf8" })
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
  } catch {
    return [];
  }
}
