import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const sliceName = "perspective_public_surface_mode_v0_1";

const paths = {
  home: "app/page.tsx",
  cockpit: "components/augnes-cockpit.tsx",
  entrypoint: "components/promotion-readiness-review-hub-cockpit-entrypoint.tsx",
  packageJson: "package.json",
  smoke: "scripts/smoke-perspective-public-surface-mode-v0-1.mjs",
  entrypointBrowser:
    "scripts/browser-validate-promotion-readiness-review-hub-cockpit-entrypoint-v0-1.mjs",
  copyBrowser: "scripts/browser-validate-promotion-readiness-copy-ia-clarity-v0-1.mjs",
  entrypointSmoke:
    "scripts/smoke-promotion-readiness-review-hub-cockpit-entrypoint-v0-1.mjs",
  copyIaSmoke: "scripts/smoke-promotion-readiness-copy-ia-clarity-v0-1.mjs",
};

const home = read(paths.home);
const cockpit = read(paths.cockpit);
const entrypoint = read(paths.entrypoint);
const packageJson = JSON.parse(read(paths.packageJson));

assertHome();
assertPublicPerspectiveSurface();
assertPromotionSecondary();
assertWorkbenchDemoted();
assertNoAuthorityExpansion();
assertChangedFileScope();

console.log(`${sliceName}: PASS`);

function assertHome() {
  assertIncludes(home, 'import { AugnesCockpit }', "home imports cockpit");
  assertIncludes(home, "return <AugnesCockpit />", "home renders cockpit directly");
  assertDoesNotInclude(
    home,
    "PromotionReadinessReviewHubCockpitEntrypoint",
    "home must not render promotion readiness above cockpit",
  );
}

function assertPublicPerspectiveSurface() {
  assertOrdered(
    cockpit,
    [
      "<PerspectiveTab",
      "<PageHeader",
      'title="Perspective / Project constellation"',
      'description="Augnes shows the current project shape, tensions, and review surfaces."',
      'id="perspective-public-surface"',
      "Start with the constellation",
      'title="Current project shape"',
      'title="Tensions"',
      'title="Next review surfaces"',
      "<PromotionReadinessReviewHubCockpitEntrypoint />",
    ],
    "Perspective public reading order",
  );

  const publicStart = cockpit.indexOf('id="perspective-public-surface"');
  const promotionStart = cockpit.indexOf("<PromotionReadinessReviewHubCockpitEntrypoint />");
  assert.ok(publicStart >= 0, "public Perspective surface must exist");
  assert.ok(promotionStart > publicStart, "promotion readiness must follow public surface");
  const publicSurface = cockpit.slice(publicStart, promotionStart);
  for (const phrase of [
    "Perspective public project constellation surface",
    "Augnes shows the current project shape, tensions, and review",
    "Current project shape",
    "Tensions",
    "Next review surfaces",
    "Project constellation preview",
    "Promotion readiness is secondary review prep, not approval.",
    "Human review still required",
    "Agent workbench details are below",
  ]) {
    assertIncludes(publicSurface, phrase, `public surface copy ${phrase}`);
  }
  assertIncludes(
    publicSurface,
    "constellationPreview.nodes.map",
    "public surface must render fixture-backed project nodes",
  );
  assertIncludes(
    publicSurface,
    "constellationPreview.cluster.unresolvedTensions",
    "public surface must render fixture-backed tensions",
  );
  assertOrdered(
    publicSurface,
    [
      'title="Current project shape"',
      'title="Tensions"',
      'title="Next review surfaces"',
      "Promotion readiness",
      "Agent workbench details are below",
    ],
    "public surface hierarchy",
  );
  for (const forbidden of [
    "human_signoff_completed",
    "human_review_still_required",
    "Validation pass is not truth/proof/approval/product readiness",
    "Blocked authority actions",
    "What this entrypoint cannot do",
  ]) {
    assertDoesNotInclude(
      publicSurface,
      forbidden,
      `first public surface must not be boundary-wall copy ${forbidden}`,
    );
  }
}

function assertPromotionSecondary() {
  assertIncludes(
    cockpit,
    'href="#promotion-readiness-review-hub-cockpit-entrypoint"',
    "Perspective nav links to secondary promotion card",
  );
  assertIncludes(
    entrypoint,
    'id="promotion-readiness-review-hub-cockpit-entrypoint"',
    "entrypoint has anchor id",
  );
  assertIncludes(entrypoint, "Secondary review prep", "secondary promotion eyebrow");
  assertIncludes(
    normalize(entrypoint),
    normalize("Promotion readiness is secondary review prep, not approval"),
    "secondary promotion copy",
  );
  assertIncludes(
    normalize(entrypoint),
    normalize("Human review still required"),
    "human review copy",
  );
  assertIncludes(entrypoint, "Read/display-only", "read/display marker");
  assertIncludes(entrypoint, "Readiness is not promotion", "readiness boundary");
  assertIncludes(entrypoint, "No action controls", "no action marker");
  assertIncludes(entrypoint, 'maxWidth: "100%"', "entrypoint is not a home hero card");
  assertIncludes(entrypoint, 'boxShadow: "none"', "entrypoint has no dominant shadow");
  assertDoesNotInclude(entrypoint, "Blocked authority actions", "no boundary wall");
  assertDoesNotInclude(entrypoint, "What this entrypoint cannot do", "no cannot-do wall");
  assertDoesNotInclude(entrypoint, 'fontSize: "28px"', "entrypoint is not hero sized");
}

function assertWorkbenchDemoted() {
  const publicStart = cockpit.indexOf('id="perspective-public-surface"');
  const promotionStart = cockpit.indexOf("<PromotionReadinessReviewHubCockpitEntrypoint />");
  const workbenchStart = cockpit.indexOf('id="perspective-agent-workbench-details"');
  const researchStart = cockpit.indexOf("{/* Research Candidate Review Cockpit Preview Start */");
  assert.ok(workbenchStart > promotionStart, "workbench marker must follow promotion card");
  assert.ok(researchStart > workbenchStart, "dense research panel must follow workbench marker");
  assertOrdered(
    cockpit.slice(publicStart, researchStart),
    [
      'id="perspective-public-surface"',
      "Current project shape",
      "<PromotionReadinessReviewHubCockpitEntrypoint />",
      'id="perspective-agent-workbench-details"',
      "<h2>Detailed machine-readable workbench</h2>",
    ],
    "dense workbench demotion order",
  );
}

function assertNoAuthorityExpansion() {
  const publicStart = cockpit.indexOf('id="perspective-public-surface"');
  const promotionStart = cockpit.indexOf("<PromotionReadinessReviewHubCockpitEntrypoint />");
  const publicSurface = cockpit.slice(publicStart, promotionStart);
  for (const source of [publicSurface, entrypoint]) {
    for (const forbidden of [
      /\/api\/.*(?:promotion|proof|evidence|product|release|github)/i,
      /\b(?:POST|PUT|PATCH|DELETE)\b/,
      /\bfetch\s*\(/i,
    ]) {
      assert.doesNotMatch(source, forbidden, `forbidden runtime/write surface ${forbidden}`);
    }
  }
  for (const forbidden of [
    /<button\b/i,
    /<form\b/i,
    /<input\b/i,
    /\bonClick\s*=/i,
    /role\s*=\s*["']button["']/i,
  ]) {
    assert.doesNotMatch(entrypoint, forbidden, `promotion card forbidden control ${forbidden}`);
  }
  for (const phrase of [
    "human_signoff_completed: false",
    "human_review_still_required: true",
    "promotion_execution: false",
    "promotion_decision_write: false",
    "product_write: false",
  ]) {
    assertIncludes(normalize(entrypoint), normalize(phrase), `authority flag ${phrase}`);
  }
}

function assertChangedFileScope() {
  const expectedChangedFiles = new Set([
    paths.home,
    paths.cockpit,
    paths.entrypoint,
    paths.packageJson,
    paths.smoke,
    paths.entrypointBrowser,
    paths.copyBrowser,
    paths.entrypointSmoke,
    paths.copyIaSmoke,
  ]);
  assert.equal(
    packageJson.scripts?.["smoke:perspective-public-surface-mode-v0-1"],
    "node scripts/smoke-perspective-public-surface-mode-v0-1.mjs",
    "package smoke script pointer",
  );
  const changed = changedFiles();
  const unexpected = [...changed]
    .filter((filePath) => !expectedChangedFiles.has(filePath))
    .sort();
  assert.deepEqual(unexpected, [], `Unexpected changed file(s): ${unexpected.join(", ")}`);
}

function changedFiles() {
  const changed = new Set();
  for (const args of [
    ["diff", "--name-only"],
    ["ls-files", "--others", "--exclude-standard"],
  ]) {
    for (const filePath of runGitLines(args)) changed.add(filePath);
  }
  for (const args of [
    ["diff", "--name-only", "origin/main...HEAD"],
    ["diff", "--name-only", "main...HEAD"],
  ]) {
    const lines = runGitLines(args, { allowFailure: true });
    for (const filePath of lines) changed.add(filePath);
    if (lines.length > 0) break;
  }
  return changed;
}

function read(filePath) {
  return readFileSync(filePath, "utf8");
}

function runGitLines(args, { allowFailure = false } = {}) {
  try {
    const output = execFileSync("git", args, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", allowFailure ? "ignore" : "pipe"],
    });
    return output
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
  } catch (error) {
    if (allowFailure) return [];
    throw error;
  }
}

function assertIncludes(source, phrase, label) {
  assert.ok(source.includes(phrase), `${label}: expected to include ${phrase}`);
}

function assertDoesNotInclude(source, phrase, label) {
  assert.ok(!source.includes(phrase), `${label}: expected not to include ${phrase}`);
}

function assertOrdered(source, phrases, label) {
  let lastIndex = -1;
  for (const phrase of phrases) {
    const nextIndex = source.indexOf(phrase);
    assert.ok(nextIndex >= 0, `${label}: missing ${phrase}`);
    assert.ok(nextIndex > lastIndex, `${label}: ${phrase} is out of order`);
    lastIndex = nextIndex;
  }
}

function normalize(value) {
  return String(value).replace(/\s+/g, " ").trim().toLowerCase();
}
