#!/usr/bin/env node
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

const files = {
  homePage: "app/page.tsx",
  workbenchPage: "app/workbench/page.tsx",
  perspectivePage: "app/perspective/page.tsx",
  publicHome: "components/augnes-public-home-surface.tsx",
  perspectiveSurface: "components/perspective/perspective-public-constellation-surface.tsx",
  css: "app/globals.css",
  packageJson: "package.json",
  publicSmoke: "scripts/smoke-augnes-public-surface-workflow-preservation-ia-v0-1.mjs",
  perspectiveSmoke: "scripts/smoke-perspective-public-surface-visual-reset-v0-1.mjs",
};

const packageScripts = {
  "smoke:augnes-public-surface-workflow-preservation-ia-v0-1":
    "node scripts/smoke-augnes-public-surface-workflow-preservation-ia-v0-1.mjs",
  "smoke:perspective-public-surface-visual-reset-v0-1":
    "node scripts/smoke-perspective-public-surface-visual-reset-v0-1.mjs",
};

const allowedChangedFiles = new Set(Object.values(files));

for (const filePath of Object.values(files)) {
  assert(existsSync(filePath), `${filePath} must exist`);
}

const homePage = readText(files.homePage);
const workbenchPage = readText(files.workbenchPage);
const perspectivePage = readText(files.perspectivePage);
const publicHome = readText(files.publicHome);
const perspectiveSurface = readText(files.perspectiveSurface);
const packageJson = JSON.parse(readText(files.packageJson));

for (const [scriptName, scriptValue] of Object.entries(packageScripts)) {
  assert.equal(packageJson.scripts?.[scriptName], scriptValue, `${scriptName} must exist`);
}

assert(homePage.includes("AugnesPublicHomeSurface"), "/ must render AugnesPublicHomeSurface");
assert(!homePage.includes("AugnesCockpit"), "/ must not render AugnesCockpit directly");
assert(workbenchPage.includes("AugnesCockpit"), "/workbench must render AugnesCockpit");
assert(!perspectivePage.includes("AugnesCockpit"), "/perspective must not import AugnesCockpit");
assert(!perspectiveSurface.includes("AugnesCockpit"), "Perspective public surface must not import AugnesCockpit");

const publicHomeRender = extractReturnSource(publicHome);
const perspectiveRender = extractReturnSource(perspectiveSurface);
const publicVisibleSource = `${publicHomeRender}\n${perspectiveRender}`;

assertContainsAll(publicHome, [
  "AUGNES",
  "<h1 id=\"augnes-public-title\">Augnes</h1>",
  "Understand the current project shape, tensions, and review surfaces.",
  "Current project shape",
  "What needs attention",
  "Continue review",
  "Open Perspective",
  "Research candidate review",
  "Review memory",
  "Promotion readiness",
  "Open workbench",
  'href: "/perspective"',
  'href: "/workbench#research-candidate-review-preview"',
  'href: "/workbench"',
  'href: "/perspective/promotion"',
]);

assertContainsAll(perspectiveRender, [
  "Perspective",
  "Project constellation",
  "Current project shape",
  "Tensions",
  "Next review surfaces",
  "Promotion readiness",
  'href="/workbench"',
]);

assertBefore(
  perspectiveRender,
  '<h2 id="perspective-public-shape">Project constellation</h2>',
  "Promotion readiness",
);

assertNoPublicControls(publicVisibleSource);
assertForbiddenPublicTextAbsent(publicVisibleSource);
assertChangedFilesWithinScope();

console.log(
  JSON.stringify(
    {
      smoke: "augnes-public-surface-workflow-preservation-ia-v0-1",
      pass: true,
      route_model: {
        "/": "public Augnes surface",
        "/perspective": "Perspective detail",
        "/workbench": "cockpit workbench",
      },
      public_home_checked: true,
      perspective_detail_checked: true,
      workbench_route_checked: true,
      no_public_action_controls_checked: true,
      no_forbidden_public_terms_checked: true,
      changed_file_scope_checked: true,
    },
    null,
    2,
  ),
);
console.log("PASS smoke:augnes-public-surface-workflow-preservation-ia-v0-1");

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
      `Expected source to include ${JSON.stringify(phrase)}`,
    );
  }
}

function assertBefore(text, first, second) {
  const firstIndex = text.indexOf(first);
  const secondIndex = text.indexOf(second);
  assert(firstIndex >= 0, `Missing ${JSON.stringify(first)}`);
  assert(secondIndex >= 0, `Missing ${JSON.stringify(second)}`);
  assert(firstIndex < secondIndex, `${first} must appear before ${second}`);
}

function extractReturnSource(text) {
  const start = text.indexOf("return (");
  assert(start >= 0, "Missing return source");
  const end = text.indexOf("\n  );\n}", start);
  assert(end >= 0, "Missing return close");
  return text.slice(start, end);
}

function assertNoPublicControls(text) {
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
    assert(!pattern.test(text), `Public routes must not match ${pattern}`);
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

  for (const pattern of deniedControlLabels) {
    assert(!pattern.test(text), `Public routes must not expose control label ${pattern}`);
  }
}

function assertForbiddenPublicTextAbsent(text) {
  const forbiddenPhrases = [
    "human_signoff_completed",
    "human_review_still_required",
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
      `Public route source must not expose ${phrase}`,
    );
  }
}

function assertChangedFilesWithinScope() {
  const changedFiles = collectChangedFiles();
  for (const filePath of changedFiles) {
    assert(
      allowedChangedFiles.has(filePath),
      `Unexpected changed file for Augnes public surface route split: ${filePath}`,
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
