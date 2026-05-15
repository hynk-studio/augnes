import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const cockpitPath = "components/augnes-cockpit.tsx";
const cssPath = "app/globals.css";

const cockpit = readFileSync(cockpitPath, "utf8");
const css = readFileSync(cssPath, "utf8");
const packageJson = JSON.parse(readFileSync("package.json", "utf8"));
const headPackageJson = JSON.parse(
  execFileSync("git", ["show", "HEAD:package.json"], { encoding: "utf8" }),
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
    headPackageJson[field] ?? {},
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

function getChangedFiles() {
  return execFileSync("git", ["status", "--short"], { encoding: "utf8" })
    .split("\n")
    .map((line) => line.slice(3).trim())
    .filter(Boolean);
}
