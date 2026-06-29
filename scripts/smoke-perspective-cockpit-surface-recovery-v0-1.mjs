import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const sliceName = "perspective_cockpit_surface_recovery_v0_1";

const paths = {
  home: "app/page.tsx",
  cockpit: "components/augnes-cockpit.tsx",
  entrypoint: "components/promotion-readiness-review-hub-cockpit-entrypoint.tsx",
  hub: "components/promotion-readiness-packet-review-hub.tsx",
  packet: "components/promotion-readiness-packet-panel.tsx",
  packageJson: "package.json",
  smoke: "scripts/smoke-perspective-cockpit-surface-recovery-v0-1.mjs",
  entrypointBrowser:
    "scripts/browser-validate-promotion-readiness-review-hub-cockpit-entrypoint-v0-1.mjs",
  entrypointSmoke:
    "scripts/smoke-promotion-readiness-review-hub-cockpit-entrypoint-v0-1.mjs",
  copyIaSmoke: "scripts/smoke-promotion-readiness-copy-ia-clarity-v0-1.mjs",
};

const home = read(paths.home);
const cockpit = read(paths.cockpit);
const entrypoint = read(paths.entrypoint);
const hub = read(paths.hub);
const packet = read(paths.packet);
const packageJson = JSON.parse(read(paths.packageJson));

assertHomeHierarchy();
assertPerspectiveCockpitIntegration();
assertEntrypointCompactBoundary();
assertPromotionChainStillReadDisplayOnly();
assertChangedFileScope();

console.log(`${sliceName}: PASS`);

function assertHomeHierarchy() {
  assertIncludes(home, 'import { AugnesCockpit }', "home imports AugnesCockpit");
  assertIncludes(home, "return <AugnesCockpit />", "home renders cockpit directly");
  assertDoesNotInclude(
    home,
    "PromotionReadinessReviewHubCockpitEntrypoint",
    "home must not place promotion readiness above cockpit",
  );
}

function assertPerspectiveCockpitIntegration() {
  const navStart = cockpit.indexOf('className="perspective-section-nav"');
  const navEnd = cockpit.indexOf("{/* Research Candidate Review Cockpit Preview Start */");
  assert.ok(navStart >= 0, "Perspective nav block must exist");
  assert.ok(navEnd > navStart, "Perspective nav block end must follow nav start");
  const perspectiveNav = cockpit.slice(navStart, navEnd);

  assertIncludes(
    cockpit,
    'import { PromotionReadinessReviewHubCockpitEntrypoint }',
    "cockpit imports compact promotion readiness lane",
  );
  assertOrdered(
    cockpit,
    [
      'className="cockpit-tab-nav"',
      "<PerspectiveTab",
      "<PageHeader",
      "<PromotionReadinessReviewHubCockpitEntrypoint />",
      'className="perspective-section-nav"',
    ],
    "cockpit hierarchy",
  );
  assertOrdered(
    perspectiveNav,
    [
      "Project constellation",
      "Constellation preview",
      "Promotion readiness review",
      "Research candidate review",
    ],
    "Perspective nav priority",
  );
  assertIncludes(
    cockpit,
    'href="#perspective-constellation-runtime-ui-completion"',
    "Project constellation anchor",
  );
  assertIncludes(
    cockpit,
    'href="#perspective-constellation-preview"',
    "Constellation preview anchor",
  );
}

function assertEntrypointCompactBoundary() {
  for (const phrase of [
    "Read/display-only review-prep lane",
    "Secondary Perspective cockpit lane",
    "without becoming",
    "the primary Augnes surface",
    "Readiness is not promotion",
    "Validation pass is not truth/proof/approval/product readiness",
    "Browser validation is not human review",
    "Human review prep",
    "Read/display-only",
    "Not promotion approval",
    "Open read/display promotion review hub",
    "human_signoff_completed",
    "human_review_still_required",
    "No action controls",
  ]) {
    assertIncludes(entrypoint, phrase, `entrypoint copy ${phrase}`);
  }

  assertIncludes(
    entrypoint,
    'id="promotion-readiness-review-hub-cockpit-entrypoint"',
    "entrypoint anchor id",
  );
  assertIncludes(entrypoint, 'maxWidth: "100%"', "entrypoint no top-banner max width");
  assertIncludes(entrypoint, 'boxShadow: "none"', "entrypoint no dominant shadow");
  assertDoesNotInclude(entrypoint, 'fontSize: "28px"', "entrypoint no hero title size");
  assertDoesNotInclude(
    entrypoint,
    "0 12px 30px",
    "entrypoint no dominant banner shadow",
  );

  for (const forbidden of [
    /<button\b/i,
    /<form\b/i,
    /<input\b/i,
    /\bonClick\s*=/i,
    /role\s*=\s*["']button["']/i,
    /\bfetch\s*\(/i,
    /["'`]\/api(?:\/|["'`])/i,
    /\b(?:POST|PUT|PATCH|DELETE)\b/,
  ]) {
    assert.doesNotMatch(entrypoint, forbidden, `entrypoint forbidden ${forbidden}`);
  }
}

function assertPromotionChainStillReadDisplayOnly() {
  for (const source of [entrypoint, hub, packet]) {
    assertIncludes(source, "human_signoff_completed", "human signoff flag");
    assertIncludes(source, "human_review_still_required", "human review flag");
  }
  assertIncludes(hub, "This hub only links to read/display surfaces", "hub read/display copy");
  assertIncludes(packet, "Static/symbolic read-display preview", "packet static preview copy");
}

function assertChangedFileScope() {
  const expectedChangedFiles = new Set([
    paths.home,
    paths.cockpit,
    paths.entrypoint,
    paths.packageJson,
    paths.smoke,
    paths.entrypointBrowser,
    paths.entrypointSmoke,
    paths.copyIaSmoke,
  ]);
  assert.equal(
    packageJson.scripts?.["smoke:perspective-cockpit-surface-recovery-v0-1"],
    "node scripts/smoke-perspective-cockpit-surface-recovery-v0-1.mjs",
    "package script pointer",
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
    return output.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
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
