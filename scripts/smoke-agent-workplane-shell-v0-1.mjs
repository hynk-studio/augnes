#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const failures = [];

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), "utf8");
}

function exists(relativePath) {
  return fs.existsSync(path.join(repoRoot, relativePath));
}

function assert(condition, message) {
  if (!condition) failures.push(message);
}

function includesAll(text, tokens) {
  return tokens.every((token) => text.includes(token));
}

const requiredFiles = [
  "app/workbench/page.tsx",
  "components/workplane/agent-workplane.tsx",
  "components/workplane/workplane-header.tsx",
  "components/workplane/workplane-overview.tsx",
  "components/workplane/workplane-boundary-card.tsx",
  "components/workplane/legacy-cockpit-compatibility-panel.tsx",
  "lib/workplane/read-workplane-context.ts",
  "docs/AGENT_WORKPLANE_V0_1.md",
];

for (const file of requiredFiles) {
  assert(exists(file), `required file missing: ${file}`);
}

const packageJson = JSON.parse(read("package.json"));
assert(
  packageJson.scripts?.["smoke:agent-workplane-shell-v0-1"] ===
    "node scripts/smoke-agent-workplane-shell-v0-1.mjs",
  "package.json must expose smoke:agent-workplane-shell-v0-1",
);

const workbenchPage = read("app/workbench/page.tsx");
const agentShell = read("components/workplane/agent-workplane.tsx");
const header = read("components/workplane/workplane-header.tsx");
const overview = read("components/workplane/workplane-overview.tsx");
const boundary = read("components/workplane/workplane-boundary-card.tsx");
const compatibility = read(
  "components/workplane/legacy-cockpit-compatibility-panel.tsx",
);
const contextReader = read("lib/workplane/read-workplane-context.ts");
const doc = read("docs/AGENT_WORKPLANE_V0_1.md");
const implementationText = [
  workbenchPage,
  agentShell,
  header,
  overview,
  boundary,
  compatibility,
  contextReader,
].join("\n");

assert(exists("app/workbench/page.tsx"), "/workbench route must remain present");
assert(
  includesAll(workbenchPage, ["AgentWorkplane", "@/components/workplane/agent-workplane"]),
  "/workbench must render the AgentWorkplane shell",
);
assert(
  includesAll(agentShell, ["AugnesCockpit", "LegacyCockpitCompatibilityPanel"]),
  "Agent Workplane must preserve AugnesCockpit through compatibility content",
);
assert(
  includesAll(header, [
    "Agent Workplane",
    "Backend work surface",
    "read-only operator view",
    "no hidden execution authority",
    'href="/"',
    'href="/perspective"',
  ]),
  "Workplane header must include name, backend/read-only boundary, and Home/Perspective links",
);
assert(
  includesAll(overview, [
    "Current Working Perspective",
    "Augnes Delta Projection",
    "Review queue",
    "Source / fallback status",
    "Fixture fallback is not live runtime state",
  ]),
  "Workplane overview must expose Current Perspective, Delta Projection, review queue, and fallback disclosure",
);
assert(
  includesAll(boundary, [
    "Read-only UI; no hidden execution authority",
    "does not",
    "execute agents",
    "apply deltas",
    "write DB rows",
    "launch Codex",
  ]),
  "Workplane boundary card must deny execution and mutation authority",
);
assert(
  includesAll(compatibility, [
    "Existing Cockpit compatibility content",
    "Legacy Cockpit remains reachable",
    "deferred to Phase 5B",
  ]),
  "Legacy Cockpit compatibility panel must explain preservation and Phase 5B deferral",
);
assert(
  includesAll(contextReader, [
    "readCurrentPerspectiveForHumanSurface",
    "readDeltaProjectionForHumanSurface",
    "current_perspective_read",
    "delta_projection_read",
    "source_status",
    "fallback_reason",
    "no_hidden_execution_authority",
  ]),
  "Workplane context reader must use existing read-only helpers and expose source/fallback/boundary context",
);
assert(
  includesAll(doc, [
    "Agent Workplane v0.1",
    "Existing Cockpit Preservation",
    "Data Sources and Fallback",
    "Authority Boundary",
    "smoke:agent-workplane-shell-v0-1",
  ]),
  "Agent Workplane doc must cover preservation, fallback, authority, and smoke plan",
);

const forbiddenPatterns = [
  [/method:\s*["'](?:POST|PUT|PATCH|DELETE)["']/, "mutating HTTP method"],
  [/from\s+["']@\/lib\/db["']/, "direct DB import"],
  [/from\s+["']@\/app\/api\//, "API route import"],
  [/new\s+OpenAI\b|OPENAI_API_KEY/, "provider/OpenAI usage"],
  [/@octokit|GITHUB_TOKEN/, "GitHub runtime usage"],
  [/executeCodex|codex_execute|launchCodex/, "Codex execution hook"],
  [/commitStateUpdate|recordProof|recordEvidence|createEvidence/, "state/proof/evidence write helper"],
  [/scheduler|autonomyRunner|autonomy_runner/, "scheduler/autonomy runner"],
];

for (const [pattern, label] of forbiddenPatterns) {
  assert(!pattern.test(implementationText), `forbidden Agent Workplane implementation pattern found: ${label}`);
}

if (failures.length > 0) {
  console.error("smoke-agent-workplane-shell-v0-1 failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("smoke-agent-workplane-shell-v0-1 passed");
