import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const helperPath = "lib/empty-runtime-startup-fallback.ts";
const routePaths = [
  "app/api/state/brief/route.ts",
  "app/api/state/snapshot/route.ts",
  "app/api/state/trajectory/route.ts",
  "app/api/work/route.ts",
  "app/api/proposals/route.ts",
];
const indexPath = "docs/00_INDEX_LATEST.md";
const packagePath = "package.json";
const smokePath = "scripts/smoke-cockpit-empty-runtime-startup-fallback-v0-1.mjs";

for (const filePath of [helperPath, ...routePaths, indexPath, packagePath, smokePath]) {
  assert.ok(existsSync(filePath), `${filePath} must exist`);
}

const helper = readFileSync(helperPath, "utf8");
const routes = Object.fromEntries(
  routePaths.map((filePath) => [filePath, readFileSync(filePath, "utf8")]),
);
const index = readFileSync(indexPath, "utf8");
const packageJson = JSON.parse(readFileSync(packagePath, "utf8"));

assertHelperContract();
assertRouteFallbacks();
assertForbiddenPatternsAbsent();
assertDocsAndPackagePointers();

console.log(
  JSON.stringify(
    {
      smoke: "cockpit-empty-runtime-startup-fallback-v0-1",
      helper_contract_checked: true,
      routes_checked: routePaths.length,
      recognized_optional_runtime_tables_checked: true,
      bounded_empty_envelopes_checked: true,
      unexpected_errors_rethrown_checked: true,
      no_write_patterns_checked: true,
      docs_pointer_checked: true,
      package_script_checked: true,
    },
    null,
    2,
  ),
);

function assertHelperContract() {
  for (const requiredText of [
    "EMPTY_RUNTIME_OPTIONAL_TABLES",
    '"state_entries"',
    '"work_items"',
    '"state_transitions"',
    '"state_delta_proposals"',
    "getMissingEmptyRuntimeOptionalTables",
    "isMissingEmptyRuntimeOptionalTableError",
    "buildEmptyRuntimeStartupFallbackMetadata",
    "missing_optional_runtime_table",
    "empty_runtime: true",
    "items: []",
    "count: 0",
    "returned_count: 0",
    "runtime_boundary",
    "no_side_effects",
    "read_only_route: true",
    "db_writes: false",
    "schema_mutation: false",
    "fake_seed_data_created: false",
    "provider_or_openai_calls: false",
    "retrieval_or_rag: false",
    "source_fetching: false",
    "proof_or_evidence_writes: false",
    "perspective_promotion: false",
    "canonical_graph_write: false",
    "work_item_creation: false",
    "codex_execution: false",
    "external_handoff_sending: false",
    "browser_persistence: false",
    "missing_table_errors_bounded_to_recognized_optional_runtime_tables: true",
    "unexpected_db_errors_rethrown: true",
  ]) {
    assert.ok(helper.includes(requiredText), `helper must include ${requiredText}`);
  }

  assert.match(
    helper,
    /no such table:\\s\*/,
    "helper must recognize SQLite no-such-table errors",
  );
  assert.doesNotMatch(
    helper,
    /\b(?:INSERT|UPDATE|DELETE|CREATE TABLE|ALTER TABLE|DROP TABLE)\b/i,
    "helper must not write or mutate schema",
  );
  assert.doesNotMatch(helper, /\bfetch\s*\(/, "helper must not fetch");
  assert.doesNotMatch(helper, /\bsqlite_master\b/i, "helper must not inspect DB schema");
}

function assertRouteFallbacks() {
  assertRoute({
    routePath: "app/api/state/brief/route.ts",
    routeLabel: "GET /api/state/brief",
    expectedFields: [
      "active_state: []",
      "future_state: []",
      "completed_state: []",
      "deprecated_state: []",
      "open_tensions: []",
      "pending_proposals: []",
      "recent_actions: []",
      "agent_handoff",
    ],
  });
  assertRoute({
    routePath: "app/api/state/snapshot/route.ts",
    routeLabel: "GET /api/state/snapshot",
    expectedFields: [
      "active_state: []",
      "future_state: []",
      "deprecated_state: []",
      "completed_state: []",
      "open_tensions: []",
    ],
  });
  assertRoute({
    routePath: "app/api/state/trajectory/route.ts",
    routeLabel: "GET /api/state/trajectory",
    expectedFields: ["trajectories: {}"],
  });
  assertRoute({
    routePath: "app/api/work/route.ts",
    routeLabel: "GET /api/work",
    expectedFields: ["work_items: []"],
  });
  assertRoute({
    routePath: "app/api/proposals/route.ts",
    routeLabel: "GET /api/proposals",
    expectedFields: ["proposals: []"],
  });
}

function assertRoute({ routePath, routeLabel, expectedFields }) {
  const source = routes[routePath];

  for (const requiredText of [
    "buildEmptyRuntimeStartupFallbackMetadata",
    "getMissingEmptyRuntimeOptionalTables",
    "try {",
    "} catch (error) {",
    "const missingTables = getMissingEmptyRuntimeOptionalTables(error)",
    "if (missingTables.length === 0) {",
    "throw error;",
    routeLabel,
    "missingTables,",
  ]) {
    assert.ok(source.includes(requiredText), `${routePath} must include ${requiredText}`);
  }

  for (const expectedField of expectedFields) {
    assert.ok(
      source.includes(expectedField),
      `${routePath} must preserve empty response field ${expectedField}`,
    );
  }

  assert.doesNotMatch(
    source,
    /\b(?:INSERT|UPDATE|DELETE|CREATE TABLE|ALTER TABLE|DROP TABLE)\b/i,
    `${routePath} must not write or mutate schema`,
  );
  assert.doesNotMatch(source, /\bfetch\s*\(/, `${routePath} must not fetch`);
}

function assertForbiddenPatternsAbsent() {
  const checkedSources = {
    [helperPath]: helper,
    ...routes,
  };
  const forbiddenImportPattern =
    /(?:openai|provider|retriev|rag|source-fetch|crawler|scraper|embedding|vector|proof|evidence|perspective.*promotion|canonical.*graph|work-item.*create|codex.*execution|handoff.*send|mcp|plugin)/i;
  const forbiddenPersistencePattern =
    /\b(?:localStorage|sessionStorage|indexedDB|document\.cookie)\b/;

  for (const [filePath, source] of Object.entries(checkedSources)) {
    const imports = source
      .split("\n")
      .filter((line) => /^\s*import\b/.test(line))
      .join("\n");

    assert.doesNotMatch(
      imports,
      forbiddenImportPattern,
      `${filePath} must not import forbidden provider/retrieval/proof/evidence/work/promotion modules`,
    );
    assert.doesNotMatch(
      source,
      forbiddenPersistencePattern,
      `${filePath} must not add browser persistence`,
    );
    assert.doesNotMatch(
      source,
      /\bfake seed data\b/i,
      `${filePath} must not create fake seed data`,
    );
  }
}

function assertDocsAndPackagePointers() {
  assert.equal(
    packageJson.scripts["smoke:cockpit-empty-runtime-startup-fallback-v0-1"],
    "node scripts/smoke-cockpit-empty-runtime-startup-fallback-v0-1.mjs",
    "package.json must expose the empty-runtime startup fallback smoke",
  );

  for (const requiredText of [
    "Cockpit empty-runtime startup fallback lane",
    "missing_optional_runtime_table",
    "GET /api/state/brief",
    "GET /api/state/snapshot",
    "GET /api/state/trajectory",
    "GET /api/work",
    "GET /api/proposals",
    "smoke:cockpit-empty-runtime-startup-fallback-v0-1",
  ]) {
    assert.ok(index.includes(requiredText), `docs index must include ${requiredText}`);
  }
}
