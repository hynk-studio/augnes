#!/usr/bin/env node
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const pagePath = "app/perspective/page.tsx";
const componentPath = "components/perspective/perspective-public-constellation-surface.tsx";
const homePath = "app/page.tsx";
const packagePath = "package.json";
const cssPath = "app/globals.css";
const smokePath = "scripts/smoke-perspective-public-surface-visual-reset-v0-1.mjs";
const packageScriptName = "smoke:perspective-public-surface-visual-reset-v0-1";
const packageScriptValue = "node scripts/smoke-perspective-public-surface-visual-reset-v0-1.mjs";

const allowedChangedFiles = new Set([
  pagePath,
  componentPath,
  packagePath,
  smokePath,
  cssPath,
]);

const page = readText(pagePath);
const component = readText(componentPath);
const home = readText(homePath);
const packageJson = JSON.parse(readText(packagePath));
const publicSource = `${page}\n${component}`;
const renderedSource = extractBetween(component, "return (", "\n  );\n}");

assert.equal(
  packageJson.scripts?.[packageScriptName],
  packageScriptValue,
  `${packageScriptName} package script must exist`,
);

assert(home.includes("AugnesCockpit"), "/ must still render AugnesCockpit directly in app/page.tsx");
assert(!page.includes("AugnesCockpit"), "/perspective page must not import AugnesCockpit");
assert(!component.includes("AugnesCockpit"), "public surface component must not import AugnesCockpit");
assert(
  component.includes('data-testid="perspective-public-constellation-surface"'),
  "public surface test id must be present",
);

const headerSource = extractBetween(
  component,
  '<header className="perspective-public-header">',
  "</header>",
);
assertContainsAll(headerSource, [
  "Augnes",
  "<h1 id=\"perspective-public-title\">Perspective</h1>",
  "A public view of the current project shape, tensions, and review surfaces.",
  "Open cockpit workbench",
  'href="/"',
]);
assert(!headerSource.includes("<h1 id=\"perspective-public-title\">Project constellation</h1>"));
assertBefore(renderedSource, "<h1 id=\"perspective-public-title\">Perspective</h1>", "Project constellation");
assertContainsAll(publicSource, [
  "A public view of the current project shape, tensions, and review surfaces.",
  "Current project shape",
  "Start with the constellation: it shows the current project shape before you open review surfaces.",
  "Tensions",
  "Next review surfaces",
  "review prep, not approval",
  "Human review still required",
  "Open cockpit workbench",
  "Detailed workbench view remains in the cockpit.",
]);

assertBefore(component, "Project constellation", "Promotion readiness");

assertNoElementsOrHandlers(publicSource);
assertForbiddenPublicSourceAbsent(renderedSource);
assertCompactPromotionReadiness(component);
assertWorkbenchPointer(component);
assertChangedFilesWithinScope();

console.log(
  JSON.stringify(
    {
      smoke: "perspective-public-surface-visual-reset-v0-1",
      pass: true,
      route: "/perspective",
      page_checked: pagePath,
      component_checked: componentPath,
      home_cockpit_left_unchanged: true,
      package_script_checked: true,
      public_surface_testid_checked: true,
      no_augnes_cockpit_import_on_perspective: true,
      page_h1_checked: "Perspective",
      cockpit_workbench_anchor_checked: true,
      no_action_controls_checked: true,
      static_fixture_backed: true,
      changed_file_scope_checked: true,
    },
    null,
    2,
  ),
);
console.log("PASS smoke:perspective-public-surface-visual-reset-v0-1");

function readText(filePath) {
  return readFileSync(filePath, "utf8");
}

function normalize(text) {
  return text.replace(/\s+/g, " ").trim();
}

function assertContainsAll(text, requiredPhrases) {
  const normalized = normalize(text);
  for (const phrase of requiredPhrases) {
    assert(
      normalized.includes(normalize(phrase)),
      `Expected public source to include ${JSON.stringify(phrase)}`,
    );
  }
}

function assertBefore(text, first, second) {
  const firstIndex = text.indexOf(first);
  const secondIndex = text.indexOf(second);
  assert(firstIndex >= 0, `Missing ${JSON.stringify(first)}`);
  assert(secondIndex >= 0, `Missing ${JSON.stringify(second)}`);
  assert(
    firstIndex < secondIndex,
    `${JSON.stringify(first)} must appear before ${JSON.stringify(second)}`,
  );
}

function extractBetween(text, start, end) {
  const startIndex = text.indexOf(start);
  assert(startIndex >= 0, `Missing start marker ${JSON.stringify(start)}`);
  const endIndex = text.indexOf(end, startIndex);
  assert(endIndex >= 0, `Missing end marker ${JSON.stringify(end)}`);
  return text.slice(startIndex, endIndex + end.length);
}

function assertNoElementsOrHandlers(text) {
  const deniedPatterns = [
    /<button\b/i,
    /<form\b/i,
    /<input\b/i,
    /\bonClick\s*=/,
    /\bfetch\s*\(/,
    /["']\/api\//,
    /\bPOST\b/,
    /\bPUT\b/,
    /\bPATCH\b/,
    /\bDELETE\b/,
  ];

  for (const pattern of deniedPatterns) {
    assert(!pattern.test(text), `Public source must not match ${pattern}`);
  }

  const deniedControlLabels = [
    /\bapprove\b/i,
    /\bpromote\b/i,
    /\bpublish\b/i,
    /\brelease\b/i,
    /\bwrite\b/i,
    /\bcommit\b/i,
    /\baccept\b/i,
    /\bsend\b/i,
  ];

  const jsxTextOnly = text.replace(/import[^\n]+\n/g, "");
  for (const pattern of deniedControlLabels) {
    assert(!pattern.test(jsxTextOnly), `Public surface must not expose action label ${pattern}`);
  }
}

function assertForbiddenPublicSourceAbsent(text) {
  const forbiddenPhrases = [
    "human_signoff_completed",
    "promotion_execution",
    "promotion_decision_write",
    "product_write",
    "proof_or_evidence_creation",
    "durable_state_apply",
    "formation_receipt_write",
    "accepted_evidence_ref_write",
    "product_id_allocation",
    "Validation pass is not truth/proof/approval/product readiness",
    "authority boundary",
    "product-write parked",
    "DB path",
    "route names",
    "raw fixture dump",
    "fixture",
    "smoke",
    "diagnostic",
    "machine-readable",
    "non-authoritative",
    "Codex execution",
    "same-origin runtime",
    "runtime route",
    "query input",
    "inspector",
  ];

  const lowerText = text.toLowerCase();
  for (const phrase of forbiddenPhrases) {
    assert(
      !lowerText.includes(phrase.toLowerCase()),
      `Public source must not include first-screen/internal phrase: ${phrase}`,
    );
  }
}

function assertCompactPromotionReadiness(text) {
  const promotionIndex = text.indexOf("Promotion readiness");
  assert(promotionIndex > 0, "Promotion readiness secondary card must be present");
  const promotionSource = text.slice(promotionIndex, promotionIndex + 420);
  assert(
    promotionSource.includes("review prep, not approval"),
    "Promotion readiness must stay review prep, not approval",
  );
  assert(
    promotionSource.includes("Human review still required"),
    "Promotion readiness must include compact human review statement",
  );
  assert(
    !/<ul\b|<ol\b/i.test(promotionSource),
    "Promotion readiness must not become a long list",
  );
}

function assertWorkbenchPointer(text) {
  const firstWorkbenchIndex = text.indexOf("Open cockpit workbench");
  const lowerWorkbenchIndex = text.lastIndexOf("Open cockpit workbench");
  assert(firstWorkbenchIndex > 0, "Open cockpit workbench pointer must be present");
  assert(
    text.includes('href="/"'),
    "Open cockpit workbench must use a normal internal anchor to /",
  );
  assert(
    firstWorkbenchIndex !== lowerWorkbenchIndex,
    "Open cockpit workbench should appear in the page header and lower context",
  );
  assert(
    lowerWorkbenchIndex > text.indexOf("Next review surfaces"),
    "Lower cockpit workbench pointer must be after the public review surface sections",
  );
}

function assertChangedFilesWithinScope() {
  const changedFiles = collectChangedFiles();
  for (const filePath of changedFiles) {
    assert(
      allowedChangedFiles.has(filePath),
      `Unexpected changed file for perspective public surface visual reset: ${filePath}`,
    );
  }
}

function collectChangedFiles() {
  const outputs = [
    execFileSync("git", ["diff", "--name-only", "HEAD"], { encoding: "utf8" }),
    execFileSync("git", ["ls-files", "--others", "--exclude-standard"], { encoding: "utf8" }),
  ];
  return [...new Set(outputs.flatMap((output) => output.split(/\r?\n/).filter(Boolean)))].sort();
}
