import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const cockpitPath = "components/augnes-cockpit.tsx";
const cssPath = "app/globals.css";

const cockpit = readFileSync(cockpitPath, "utf8");
const css = readFileSync(cssPath, "utf8");
const packageJson = JSON.parse(readFileSync("package.json", "utf8"));
const comparisonRef = getComparisonRef();
const basePackageJson = JSON.parse(
  execFileSync("git", ["show", `${comparisonRef}:package.json`], {
    encoding: "utf8",
  }),
);

for (const snippet of [
  "const [activeTab, setActiveTab] = useState<CockpitTab>",
  "Overview -> Work -> Ledger -> Proof -> Bridge -> Operator",
  "Overview",
  "Work",
  "Ledger",
  "Proof",
  "Bridge",
  "Operator",
  "AUGNES",
  "Temporal State Runtime",
  "AI work becomes temporal state.",
  "Model proposes. User commits. Runtime records proof.",
  "Conversation",
  "Proposal",
  "Commit Gate",
  "Work IDs anchor traces",
  "Temporal Ledger",
  "Ledger is the source of truth",
  "Pending proposals are not ledger entries",
  "Proof records evidence only",
  "It does not commit, approve, publish, replay, or execute anything",
  "Read-first Bridge",
  "Configured tool surface, not an external system control panel",
  "commit state blocked",
  "execute Codex blocked",
  "publish/mutate GitHub blocked",
  "Operator actions affect the local Augnes runtime only",
  "No publish, merge, retry, backup, live exchange, or external execution controls",
  "Commit local state proposal",
  "Reject local state proposal",
]) {
  assertIncludes(cockpit, snippet);
}

assertOrder(cockpit, ["Overview", "Work", "Ledger", "Proof", "Bridge", "Operator"]);

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
  ".six-tab-cockpit",
  ".cockpit-topbar",
  ".cockpit-tab-nav",
  ".cockpit-tab-button",
  ".cockpit-tab-panel",
  ".cockpit-surface-card",
  ".overview-main-grid",
  ".tab-stat-row",
  ".metric-card",
  ".ledger-grid",
  ".proof-grid",
  ".bridge-grid",
  ".capability-matrix",
  ".operator-layout-grid",
  ".boundary-note",
]) {
  assertIncludes(css, snippet);
}

assert.equal(
  packageJson.scripts["smoke:cockpit-six-tab-shell"],
  "node scripts/smoke-cockpit-six-tab-shell.mjs",
  "package.json should register smoke:cockpit-six-tab-shell",
);

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

const changedFiles = getChangedFiles();
assert.deepEqual(
  changedFiles.filter((file) => file.startsWith("app/api/")),
  [],
  "six-tab shell PR must not add or change app/api files",
);
assert.deepEqual(
  changedFiles.filter((file) => file.startsWith("lib/")),
  [],
  "six-tab shell PR must not change lib runtime files",
);

const changedLockfiles = changedFiles.filter((file) =>
  /(^|\/)(package-lock\.json|pnpm-lock\.yaml|yarn\.lock|bun\.lockb?)$/.test(file),
);
assert.deepEqual(changedLockfiles, [], "lockfiles should not change");

const logoAssetsChanged = changedFiles.filter((file) =>
  /(^|\/)logo[^/]*\.(svg|png|jpg|jpeg|webp|avif)$/i.test(file),
);
assert.deepEqual(logoAssetsChanged, [], "six-tab shell PR must not add logo assets");

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
      smoke: "cockpit-six-tab-shell",
      active_tab_state_present: true,
      tab_order_verified: true,
      text_identity_present: true,
      graphic_logo_mark_recreated: false,
      new_logo_asset_added_or_imported: false,
      existing_graphic_logo_mark_kept_in_shell: false,
      overview_copy_present: true,
      work_boundary_present: true,
      ledger_boundary_present: true,
      proof_boundary_present: true,
      bridge_boundary_present: true,
      operator_boundary_present: true,
      shell_css_present: true,
      package_script_present: true,
      app_api_files_changed: false,
      lib_files_changed: false,
      new_dependencies_added: false,
      forbidden_controls_added: false,
      local_proposal_controls_labelled: true,
      raw_secret_material_present: false,
    },
    null,
    2,
  ),
);

function assertIncludes(value, expected) {
  assert.equal(
    value.includes(expected),
    true,
    `Expected content to include: ${expected}`,
  );
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

function getChangedFiles() {
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
