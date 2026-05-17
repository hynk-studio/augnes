import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const cockpitPath = "components/augnes-cockpit.tsx";
const cssPath = "app/globals.css";
const packagePath = "package.json";

export function runPerspectiveIaSmoke(smokeName) {
  const cockpit = readFileSync(cockpitPath, "utf8");
  const css = readFileSync(cssPath, "utf8");
  const packageJson = JSON.parse(readFileSync(packagePath, "utf8"));
  const comparisonRef = getComparisonRef();
  const basePackageJson = JSON.parse(
    execFileSync("git", ["show", `${comparisonRef}:package.json`], {
      encoding: "utf8",
    }),
  );

  assert.equal(
    packageJson.scripts["smoke:cockpit-demo-readiness"],
    "node scripts/smoke-cockpit-demo-readiness.mjs",
    "package.json should register smoke:cockpit-demo-readiness",
  );
  assert.equal(
    packageJson.scripts["smoke:cockpit-perspective-ia"],
    "node scripts/smoke-cockpit-perspective-ia.mjs",
    "package.json should register smoke:cockpit-perspective-ia",
  );

  assertIncludes(
    cockpit,
    'type CockpitTab = "overview" | "work" | "perspective" | "bridge" | "operator"',
  );
  assertOrder(cockpit, ["Overview", "Work", "Perspective", "Bridge", "Operator"]);
  assert.equal(
    cockpit.includes('label: "Ledger"'),
    false,
    "Ledger must not remain a top-level tab label",
  );
  assert.equal(
    cockpit.includes('label: "Proof"'),
    false,
    "Proof must not remain a top-level tab label",
  );

  for (const snippet of [
    "Temporal Perspective",
    "How the current interpretive frame was formed",
    "Perspective is a read-only interpretation surface",
    "Current Perspective Frame",
    "How this frame was formed",
    "Scan",
    "Bind",
    "Resolve",
    "Anchor",
    "Next",
    "Ledger Basis is committed runtime state",
    "Perspective interprets it, but does not own it",
    "Pending proposals are not ledger entries",
    "Evidence Pack",
    "Temporal review artifacts",
    "Session Trace",
    "Evidence supports or challenges the frame",
    "It does not commit, approve, publish, replay, or execute",
    "Perspective must not become a self-confirming summary",
    "read-first",
    "commit state blocked outside local runtime gate",
    "execute Codex blocked",
    "publish/mutate GitHub blocked",
    "proof/trace recording gated",
    "Operator actions affect the local Augnes runtime only",
    "Commit local state proposal",
    "Reject local state proposal",
  ]) {
    assertIncludes(cockpit, snippet);
  }
  assertCopyIncludes(
    cockpit,
    "Perspective shows the Ledger Basis and Evidence behind the current frame",
  );
  assertCopyIncludes(cockpit, "Operator owns local proposal decisions");

  for (const forbidden of [
    "Overview -> Work -> Ledger -> Proof -> Bridge -> Operator",
    "Ledger and Proof tabs",
    'label: "Ledger"',
    'label: "Proof"',
  ]) {
    assert.equal(
      cockpit.includes(forbidden),
      false,
      `old six-tab top-level IA should be superseded: ${forbidden}`,
    );
  }

  const brandMarkup = extractCockpitBrandMarkup(cockpit);
  assertIncludes(brandMarkup, "<strong>AUGNES</strong>");
  assertIncludes(brandMarkup, "<span>Temporal State Runtime</span>");
  assertNoBrandArtwork(brandMarkup);

  const brandCss = extractCssRules(css, [
    ".cockpit-brand",
    ".cockpit-brand strong",
    ".cockpit-brand span",
  ]);
  assertNoBrandArtwork(brandCss);

  for (const snippet of [
    "Cockpit demo readiness polish",
    ".cockpit-topbar",
    ".cockpit-tab-nav",
    ".cockpit-tab-button:focus-visible",
    ".cockpit-tab-panel",
    ".perspective-grid",
    ".perspective-section",
    ".perspective-trace-strip",
    ".perspective-boundary-card",
    ".perspective-evidence-grid",
    ".bridge-grid",
    ".capability-matrix",
    ".operator-layout-grid",
    ".operator-tab .panel-control-row",
    ".operator-tab .action-controls",
  ]) {
    assertIncludes(css, snippet);
  }

  for (const field of [
    "dependencies",
    "devDependencies",
    "optionalDependencies",
    "peerDependencies",
  ]) {
    assert.deepEqual(
      packageJson[field] ?? {},
      basePackageJson[field] ?? {},
      `${field} should not change`,
    );
  }

  const changedFiles = getChangedFiles(comparisonRef);
  assert.deepEqual(
    changedFiles.filter((file) => file.startsWith("app/api/")),
    [],
    "Perspective IA PR must not add or change app/api files",
  );
  assert.deepEqual(
    changedFiles.filter((file) => file.startsWith("lib/")),
    [],
    "Perspective IA PR must not change lib runtime files",
  );

  const changedLockfiles = changedFiles.filter((file) =>
    /(^|\/)(package-lock\.json|pnpm-lock\.yaml|yarn\.lock|bun\.lockb?)$/.test(file),
  );
  assert.deepEqual(changedLockfiles, [], "lockfiles should not change");

  const logoAssetsChanged = changedFiles.filter((file) =>
    /(^|\/)logo[^/]*\.(svg|png|jpg|jpeg|webp|avif)$/i.test(file),
  );
  assert.deepEqual(logoAssetsChanged, [], "Perspective IA PR must not add logo assets");

  const sourceImportLines = cockpit
    .split("\n")
    .filter((line) => line.trim().startsWith("import "));
  for (const line of sourceImportLines) {
    assert.equal(
      /logo|\.svg|\.png|\.jpg|\.jpeg|\.webp|\.avif/i.test(line),
      false,
      `Cockpit shell must not import or reference logo/image assets: ${line}`,
    );
  }

  const buttonLabels = [...cockpit.matchAll(/<button\b[\s\S]*?<\/button>/g)].map(
    ([button]) =>
      button
        .replace(/<[^>]*>/g, " ")
        .replace(/\{[\s\S]*?\}/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .toLowerCase(),
  );

  for (const forbidden of [
    "publish",
    "merge",
    "retry",
    "github token",
    "installation token exchange",
    "live exchange",
    "backup",
    "execute codex",
  ]) {
    assert.equal(
      buttonLabels.some((label) => label.includes(forbidden)),
      false,
      `forbidden active control found: ${forbidden}`,
    );
  }

  for (const tokenSnippet of [
    "sk-",
    "ghp_",
    "gho_",
    "github_pat_",
    "BEGIN PRIVATE KEY",
    "BEGIN RSA PRIVATE KEY",
    "eyJhbGci",
  ]) {
    assert.equal(
      cockpit.includes(tokenSnippet),
      false,
      `Cockpit source should not contain raw token/JWT/private-key material: ${tokenSnippet}`,
    );
  }

  console.log(
    JSON.stringify(
      {
        smoke: smokeName,
        top_level_tabs: ["Overview", "Work", "Perspective", "Bridge", "Operator"],
        old_six_tab_top_level_ia_superseded: true,
        perspective_copy_present: true,
        ledger_basis_boundary_present: true,
        evidence_boundary_present: true,
        bridge_boundary_present: true,
        operator_controls_preserved: true,
        app_api_files_changed: false,
        lib_files_changed: false,
        lockfiles_changed: false,
        new_dependencies_added: false,
        forbidden_controls_added: false,
        raw_secret_material_present: false,
      },
      null,
      2,
    ),
  );
}

function assertIncludes(value, expected) {
  assert.equal(
    value.includes(expected),
    true,
    `Expected content to include: ${expected}`,
  );
}

function assertCopyIncludes(value, expected) {
  assert.equal(
    normalizeCopy(value).includes(normalizeCopy(expected)),
    true,
    `Expected user-facing copy to include: ${expected}`,
  );
}

function normalizeCopy(value) {
  return value.replace(/\s+/g, " ").trim();
}

function assertOrder(value, labels) {
  let cursor = -1;

  for (const label of labels) {
    const next = value.indexOf(`label: "${label}"`, cursor + 1);
    assert.notEqual(next, -1, `Expected tab label in order: ${label}`);
    assert.equal(next > cursor, true, `Expected ${label} after prior tab label`);
    cursor = next;
  }
}

function assertNoBrandArtwork(value) {
  for (const forbidden of [
    "<svg",
    "<img",
    "background-image",
    "clip-path",
    "polygon",
    "mask-image",
    "logo",
  ]) {
    assert.equal(
      value.toLowerCase().includes(forbidden),
      false,
      `Top-left Cockpit identity must be text-only; found ${forbidden}`,
    );
  }
}

function extractCockpitBrandMarkup(value) {
  const match = value.match(
    /<div className="cockpit-brand" aria-label="Augnes">[\s\S]*?<\/div>/,
  );
  assert.notEqual(match, null, "Cockpit shell should include cockpit-brand block");
  return match[0];
}

function extractCssRules(value, selectors) {
  return selectors
    .map((selector) => {
      const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      return value.match(new RegExp(`${escaped}\\s*\\{[\\s\\S]*?\\}`, "g")) ?? [];
    })
    .flat()
    .join("\n");
}

function getChangedFiles(comparisonRef) {
  const workingTreeFiles = execFileSync("git", ["status", "--short"], {
    encoding: "utf8",
  })
    .split("\n")
    .map((line) => line.slice(3).trim())
    .filter(Boolean);
  const branchFiles = execFileSync(
    "git",
    ["diff", "--name-only", `${comparisonRef}...HEAD`],
    { encoding: "utf8" },
  )
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  return Array.from(new Set([...branchFiles, ...workingTreeFiles]));
}

function getComparisonRef() {
  try {
    return execFileSync("git", ["merge-base", "origin/main", "HEAD"], {
      encoding: "utf8",
    }).trim();
  } catch {
    return "HEAD";
  }
}
