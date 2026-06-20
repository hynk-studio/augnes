import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const componentPath = "components/cockpit-startup-readiness-readout.tsx";
const renderPath = "components/research-candidate-manual-note-preview-panel.tsx";
const cssPath = "app/globals.css";
const indexPath = "docs/00_INDEX_LATEST.md";
const packagePath = "package.json";
const smokePath = "scripts/smoke-cockpit-startup-readiness-readout-v0-1.mjs";

for (const filePath of [
  componentPath,
  renderPath,
  cssPath,
  indexPath,
  packagePath,
  smokePath,
]) {
  assert.ok(existsSync(filePath), `${filePath} must exist`);
}

const component = readFileSync(componentPath, "utf8");
const renderSource = readFileSync(renderPath, "utf8");
const css = readFileSync(cssPath, "utf8");
const index = readFileSync(indexPath, "utf8");
const packageJson = JSON.parse(readFileSync(packagePath, "utf8"));

assertComponentContract();
assertClassificationContract();
assertSameOriginReadOnlyBoundary();
assertRenderHook();
assertCss();
assertDocsAndPackagePointers();

console.log(
  JSON.stringify(
    {
      smoke: "cockpit-startup-readiness-readout-v0-1",
      component_checked: true,
      startup_surfaces_checked: 8,
      classifications_checked: true,
      same_origin_fetch_only_checked: true,
      readout_copy_checked: true,
      forbidden_actions_absent: true,
      render_hook_checked: true,
      docs_pointer_checked: true,
      package_script_checked: true,
    },
    null,
    2,
  ),
);

function assertComponentContract() {
  for (const requiredText of [
    '"use client"',
    "STARTUP_READINESS_SURFACES",
    "CockpitStartupReadinessReadout",
    "Startup readiness",
    "Refresh readiness",
    "last_checked_at",
    "Initialized:",
    "Empty runtime:",
    "Validation bounded:",
    "Unavailable:",
    "http_status",
    "fallback_reason",
    "missing_tables",
    "Readiness is informational only.",
    "No setup, migration, seed, proof/evidence, work item, or promotion",
    "Controlled empty-runtime means the local DB may not be initialized for that surface.",
  ]) {
    assert.ok(component.includes(requiredText), `${componentPath} must include ${requiredText}`);
  }

  for (const route of [
    "/api/state/brief?scope=project:augnes",
    "/api/state/snapshot?scope=project:augnes",
    "/api/state/trajectory?scope=project:augnes",
    "/api/work?scope=project:augnes",
    "/api/proposals?scope=project:augnes",
    "/api/publications/summary?scope=project:augnes",
    "/api/approval-gate-state/summary?scope=project:augnes",
    "/api/research-candidate-review/manual-note-preview-drafts?limit=10&lifecycle=active&sort=created_desc&warnings=all&candidates=all",
  ]) {
    assert.ok(component.includes(route), `${componentPath} must include ${route}`);
  }

  for (const expectedShape of [
    '"state_brief"',
    '"state_snapshot"',
    '"state_trajectory"',
    '"work_list"',
    '"proposal_list"',
    '"publication_summary"',
    '"approval_gate_summary"',
    '"manual_note_preview_drafts"',
  ]) {
    assert.ok(
      component.includes(expectedShape),
      `${componentPath} must define expected shape ${expectedShape}`,
    );
  }
}

function assertClassificationContract() {
  for (const status of [
    '"initialized"',
    '"empty_runtime"',
    '"validation_bounded"',
    '"unavailable"',
  ]) {
    assert.ok(component.includes(status), `${componentPath} must include ${status}`);
  }

  for (const requiredText of [
    "classifyStartupReadinessSurface",
    "httpStatus === 200",
    "payload.empty_runtime === true",
    'payload.fallback_reason === "missing_optional_runtime_table"',
    "hasExpectedStartupReadinessShape",
    "httpStatus === 400",
    "isControlledJsonError",
    "ExpectedStartupReadinessShape",
    "Network, JSON parsing, or unexpected runtime failure",
    "route-compatible initialized shape",
    "controlled empty-runtime fallback",
    "bounded validation error",
  ]) {
    assert.ok(component.includes(requiredText), `${componentPath} must include ${requiredText}`);
  }

  for (const shapeField of [
    "agent_handoff",
    "active_state",
    "future_state",
    "trajectories",
    "work_items",
    "proposals",
    "summary",
    "counts",
    "items",
    "limit",
  ]) {
    assert.ok(component.includes(shapeField), `${componentPath} must check ${shapeField}`);
  }
}

function assertSameOriginReadOnlyBoundary() {
  assert.match(
    component,
    /fetch\(surface\.route,\s*\{\s*method:\s*"GET"/s,
    "readiness component must fetch fixed same-origin route strings with GET",
  );
  assert.ok(
    component.includes('cache: "no-store"'),
    "readiness checks must avoid browser cache reuse",
  );
  assert.doesNotMatch(
    component,
    /\b(?:localStorage|sessionStorage|indexedDB|document\.cookie)\b/,
    "readiness component must not use browser persistence",
  );
  assert.doesNotMatch(
    component,
    /\bfetch\s*\(\s*["'`]https?:\/\//,
    "readiness component must not fetch external origins",
  );
  assert.doesNotMatch(
    component,
    /\b(?:POST|PATCH|PUT|DELETE)\b/,
    "readiness component must not define write methods",
  );

  const imports = component
    .split("\n")
    .filter((line) => /^\s*import\b/.test(line))
    .join("\n");
  assert.doesNotMatch(
    imports,
    /(?:openai|provider|retriev|rag|source-fetch|crawler|scraper|embedding|vector|proof|evidence|promotion|canonical|work-item|codex|handoff|mcp|plugin|db|sqlite)/i,
    "readiness component must not import provider/retrieval/proof/evidence/work/promotion/db modules",
  );

  const buttonText = Array.from(component.matchAll(/<button\b[\s\S]*?<\/button>/g))
    .map((match) => match[0].replace(/<[^>]*>/g, " "))
    .join("\n");
  assert.doesNotMatch(
    buttonText,
    /\b(?:setup|migrate|migration|seed|fix all|initialize|repair|create workflow|promote|approve|reject|defer)\b/i,
    "readiness buttons must not offer setup/migration/seed/fix/promote workflow actions",
  );
}

function assertRenderHook() {
  assert.ok(
    renderSource.includes(
      'import { CockpitStartupReadinessReadout } from "@/components/cockpit-startup-readiness-readout";',
    ),
    "manual note panel must import CockpitStartupReadinessReadout",
  );
  assert.ok(
    renderSource.includes("<CockpitStartupReadinessReadout />"),
    "manual note panel must render CockpitStartupReadinessReadout",
  );

  const authorityIndex = renderSource.indexOf("Authority boundary");
  const readinessIndex = renderSource.indexOf("<CockpitStartupReadinessReadout />");
  const recentDraftsIndex = renderSource.indexOf("<RecentPreviewDraftsPanel");
  assert.ok(authorityIndex > 0, "manual note authority boundary must remain present");
  assert.ok(
    readinessIndex > authorityIndex,
    "startup readiness readout should render after the manual note authority boundary",
  );
  assert.ok(
    readinessIndex < recentDraftsIndex,
    "startup readiness readout should render before recent preview drafts",
  );
}

function assertCss() {
  for (const requiredText of [
    ".cockpit-startup-readiness",
    ".cockpit-startup-readiness-header",
    ".cockpit-startup-readiness-counts",
    ".cockpit-startup-readiness-grid",
    ".cockpit-startup-readiness-card",
    ".startup-readiness-status-empty_runtime",
    ".startup-readiness-status-validation_bounded",
    ".startup-readiness-status-unavailable",
    "@media (max-width: 480px)",
  ]) {
    assert.ok(css.includes(requiredText), `${cssPath} must include ${requiredText}`);
  }
}

function assertDocsAndPackagePointers() {
  assert.equal(
    packageJson.scripts["smoke:cockpit-startup-readiness-readout-v0-1"],
    "node scripts/smoke-cockpit-startup-readiness-readout-v0-1.mjs",
    "package.json must expose the startup readiness readout smoke",
  );

  for (const existingSmokeScript of [
    "smoke:cockpit-empty-runtime-startup-fallback-v0-1",
    "smoke:approval-publication-empty-runtime-startup-fallback-v0-1",
    "smoke:research-candidate-manual-note-preview-ui-v0-1",
    "smoke:research-candidate-preview-draft-lifecycle-summary-v0-1",
  ]) {
    assert.ok(
      packageJson.scripts[existingSmokeScript],
      `package.json must retain ${existingSmokeScript}`,
    );
  }

  for (const requiredText of [
    "Cockpit startup readiness readout lane",
    "Startup readiness",
    "initialized",
    "empty_runtime",
    "validation_bounded",
    "unavailable",
    "Readiness is informational only.",
    "Controlled empty-runtime means the local DB may not be initialized for that surface.",
    "smoke:cockpit-startup-readiness-readout-v0-1",
  ]) {
    assert.ok(index.includes(requiredText), `docs index must include ${requiredText}`);
  }
}
