import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const cockpitPath = "components/augnes-cockpit.tsx";
const cssPath = "app/globals.css";
const packagePath = "package.json";
const readmePath = "README.md";
const allowedRuntimeLibFiles = new Set([
  "lib/perspective-ingest/episode-to-constellation-packet.ts",
  "lib/perspective-ingest/formation-switch-acknowledgement.ts",
  "lib/perspective-ingest/manual-gravity-preview.ts",
  "lib/perspective-ingest/perspective-unit-preview.ts",
]);

export function runPerspectiveIaSmoke(smokeName) {
  const cockpit = readFileSync(cockpitPath, "utf8");
  const css = readFileSync(cssPath, "utf8");
  const readme = readFileSync(readmePath, "utf8");
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
  assert.equal(
    packageJson.scripts["smoke:cockpit-perspective-evidence-handoff-snapshot"],
    "node scripts/smoke-cockpit-perspective-evidence-handoff-snapshot.mjs",
    "package.json should register smoke:cockpit-perspective-evidence-handoff-snapshot",
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
    "AUGNES / Perspective",
    "Local graph preview for reviewing relationships, tensions, and next steps.",
    "perspective-primary-workbench",
    "workbench-temporal-underlay",
    "Temporal Underlay",
    "PerspectiveCompactAuthority",
    "data-augnes-authority-capsule",
    "Safe preview",
    "Advisory only",
    "Perspective is a read-only interpretation surface",
    "Current Perspective Frame",
    "How this frame was formed",
    "Scan",
    "Bind",
    "Resolve",
    "Anchor",
    "Next",
    "◇ Scan",
    "◇ Bind",
    "◉ Resolve",
    "◇ Anchor",
    "◇ Next",
    "Current interpretation",
    "Active prior context",
    "Transition relation",
    'id="perspective-frame"',
    'id="perspective-ledger-basis"',
    'id="perspective-evidence"',
    'id="perspective-tensions"',
    'id="perspective-boundary-next"',
    "href=\"#perspective-frame\"",
    "href=\"#perspective-ledger-basis\"",
    "href=\"#perspective-evidence\"",
    "href=\"#perspective-tensions\"",
    "href=\"#perspective-boundary-next\"",
    "Frame limits",
    "tensions, counterexamples, alternatives",
    "Ledger Basis is committed runtime state",
    "Perspective interprets it, but does not own it",
    "Pending proposals are not ledger entries",
    "Evidence Pack",
    "Temporal review artifacts",
    "Session Trace",
    "Loaded evidence gaps",
    "from evidence/session/artifacts",
    "Evidence supports or challenges the frame",
    "It does not commit, approve, publish, replay, or execute",
    "Perspective Evidence Handoff Snapshot",
    "Read-only evidence and continuity orientation for the current perspective frame",
    "Evidence records",
    "Temporal Review Artifacts",
    "Evidence anchor refs",
    "Summary refs",
    "Selected temporal review artifact",
    "Review evidence pack, session trace, and temporal review artifacts before treating a frame as grounded",
    "Boundary: Read-only snapshot",
    "No proof creation",
    "Perspective must not become a self-confirming summary",
    "metaChips",
    "Why deferred",
    "Would change",
    "tension-diagnostic-card",
    "tension-card-title",
    "tension-chip-row",
    "tension-chip",
    "tension-card-body",
    "tension-field-label",
    "read-first",
    "commit state blocked outside local runtime gate",
    "execute Codex blocked",
    "publish/mutate GitHub blocked",
    "proof/trace recording gated",
    "Operator actions affect the local Augnes runtime only",
    "Selected Work Handoff Snapshot",
    "Local handoff view for the selected work item",
    "Read-only snapshot",
    "No Codex execution",
    "GitHub posting",
    "PR review creation",
    "approval",
    "merge",
    "publication",
    "provider call",
    "Augnes mutation",
    "state commit/reject",
    "Selected work",
    "Status",
    "Priority",
    "Needs attention",
    "Next action",
    "Related state keys",
    "Recent events",
    "Codex handoff",
    "Suggested verification",
    "Safe next step",
    "Review the selected work brief, related state keys, and suggested verification before delegating or closing out work",
    "Operator Handoff Snapshot",
    "Local review state for the current operator handoff",
    "Read-only snapshot",
    "No GitHub posting",
    "PR review creation",
    "approval",
    "merge",
    "publication",
    "provider call",
    "Augnes mutation",
    "state commit/reject",
    "Pending local proposals",
    "Mailbox review queue",
    "Evidence Pack",
    "Session Trace",
    "Publication review",
    "Approval gate",
    "Safe next step",
    "Review local proposals, handoffs, and dry-run material before any separate authority-gated action",
    "Evidence Pack details",
    "Temporal Review Artifact details",
    "Session Trace details",
    "Temporal Interpretation Preview details",
    "Refresh Evidence Pack",
    "Refresh Temporal Interpretation Preview",
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

  const demoFlow = extractReadmeDemoFlow(readme);
  assertCopyIncludes(
    demoFlow,
    "Open Perspective to inspect the current frame, Ledger Basis, Evidence",
  );
  assertCopyIncludes(demoFlow, "Tensions, and Boundary / Next");
  assertCopyIncludes(
    demoFlow,
    "Open Bridge to review read-first / no direct external-control boundaries",
  );
  assertCopyIncludes(demoFlow, "Open Operator to see safe local runtime controls");
  for (const forbiddenReadmeDemoStep of [
    "Open Ledger",
    "Open Proof",
    "Ledger tab",
    "Proof tab",
  ]) {
    assert.equal(
      demoFlow.includes(forbiddenReadmeDemoStep),
      false,
      `README demo flow must not present old top-level IA step: ${forbiddenReadmeDemoStep}`,
    );
  }

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

  for (const forbidden of [
    "production-ready",
    "ready_to_execute",
    "execution_ready",
    "readiness authority",
    "evaluates PR quality",
    "detects drift at runtime",
    "repairs context automatically",
    "selects next tasks autonomously",
    "autonomous research agent",
    "benchmark result",
    "quality score",
    "proof of quality",
  ]) {
    assert.equal(
      cockpit.toLowerCase().includes(forbidden.toLowerCase()),
      false,
      `Cockpit source must not include forbidden overclaim wording: ${forbidden}`,
    );
  }
  assert.equal(
    /(^|[^A-Za-z0-9_])KPI([^A-Za-z0-9_]|$)/i.test(cockpit),
    false,
    "Cockpit source must not include forbidden overclaim wording: KPI",
  );

  const perspectiveSource = extractFunctionSource(
    cockpit,
    "function PerspectiveTab",
    "function LedgerTab",
  );
  for (const label of [
    "Frame",
    "Ledger Basis",
    "Evidence",
    "Tensions",
    "Boundary / Next",
  ]) {
    assertIncludes(perspectiveSource, label);
  }

  const perspectiveButtonLabels = [
    ...perspectiveSource.matchAll(/<button\b[\s\S]*?<\/button>/g),
  ].map(([button]) =>
    button
      .replace(/<[^>]*>/g, " ")
      .replace(/\{[\s\S]*?\}/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase(),
  );
  for (const forbiddenPerspectiveControl of [
    "commit local state proposal",
    "reject local state proposal",
    "plan next",
    "approve",
    "publish",
    "replay",
    "execute codex",
    "merge",
    "token",
  ]) {
    assert.equal(
      perspectiveButtonLabels.some((label) =>
        label.includes(forbiddenPerspectiveControl),
      ),
      false,
      `mutation control found inside Perspective: ${forbiddenPerspectiveControl}`,
    );
  }

  const snapshotSource = extractFunctionSource(
    cockpit,
    "function OperatorHandoffSnapshot",
    "function PendingProposalQueue",
  );
  for (const snippet of [
    "Pending local proposals",
    "Mailbox review queue",
    "Evidence Pack",
    "Session Trace",
    "Publication review",
    "Approval gate",
    "Safe next step",
    "Read-only snapshot",
    "No GitHub posting",
    "PR review creation",
    "approval",
    "merge",
    "publication",
    "provider call",
    "Augnes mutation",
    "state commit/reject",
  ]) {
    assertIncludes(snapshotSource, snippet);
  }
  assert.equal(
    /<button\b/.test(snapshotSource),
    false,
    "Operator Handoff Snapshot must not add action buttons.",
  );
  for (const forbiddenSnapshotSource of [
    "fetch(",
    "/api/",
    "Octokit",
    "axios",
    "api.github.com",
    "api.openai.com",
    "process.env.GITHUB_TOKEN",
    "process.env.OPENAI_API_KEY",
    "use server",
  ]) {
    assert.equal(
      snapshotSource.includes(forbiddenSnapshotSource),
      false,
      `Operator Handoff Snapshot must not introduce source boundary risk: ${forbiddenSnapshotSource}`,
    );
  }

  const selectedWorkSnapshotSource = extractFunctionSource(
    cockpit,
    "function SelectedWorkHandoffSnapshot",
    "function ProofList",
  );
  for (const snippet of [
    "Selected Work Handoff Snapshot",
    "Local handoff view for the selected work item",
    "Selected work",
    "Status",
    "Priority",
    "Needs attention",
    "Next action",
    "Related state keys",
    "Recent events",
    "Codex handoff",
    "Suggested verification",
    "Safe next step",
    "Read-only snapshot",
    "No Codex execution",
    "GitHub posting",
    "PR review creation",
    "approval",
    "merge",
    "publication",
    "provider call",
    "Augnes mutation",
    "state commit/reject",
  ]) {
    assertIncludes(selectedWorkSnapshotSource, snippet);
  }
  assert.equal(
    /<button\b/.test(selectedWorkSnapshotSource),
    false,
    "Selected Work Handoff Snapshot must not add action buttons.",
  );
  for (const forbiddenSelectedWorkSnapshotSource of [
    "fetch(",
    "/api/",
    "Octokit",
    "axios",
    "api.github.com",
    "api.openai.com",
    "process.env.GITHUB_TOKEN",
    "process.env.OPENAI_API_KEY",
    "use server",
  ]) {
    assert.equal(
      selectedWorkSnapshotSource.includes(forbiddenSelectedWorkSnapshotSource),
      false,
      `Selected Work Handoff Snapshot must not introduce source boundary risk: ${forbiddenSelectedWorkSnapshotSource}`,
    );
  }

  const perspectiveEvidenceSnapshotSource = extractBetween(
    cockpit,
    'className="cockpit-surface-card perspective-evidence-handoff-snapshot"',
    '<div className="perspective-evidence-grid">',
  );
  for (const snippet of [
    "Perspective Evidence Handoff Snapshot",
    "Evidence records",
    "Temporal Review Artifacts",
    "Session Trace",
    "Loaded evidence gaps",
    "Evidence anchor refs",
    "Summary refs",
    "Selected temporal review artifact",
    "Safe next step",
    "Boundary: Read-only snapshot",
  ]) {
    assertIncludes(perspectiveEvidenceSnapshotSource, snippet);
  }
  assert.equal(
    /<button\b/.test(perspectiveEvidenceSnapshotSource),
    false,
    "Perspective Evidence Handoff Snapshot must not add action buttons.",
  );
  for (const forbiddenPerspectiveEvidenceSnapshotSource of [
    "fetch(",
    "/api/",
    "Octokit",
    "axios",
    "api.github.com",
    "api.openai.com",
    "process.env",
    "GITHUB_TOKEN",
    "OPENAI_API_KEY",
    "use server",
  ]) {
    assert.equal(
      perspectiveEvidenceSnapshotSource.includes(
        forbiddenPerspectiveEvidenceSnapshotSource,
      ),
      false,
      `Perspective Evidence Handoff Snapshot must not introduce source boundary risk: ${forbiddenPerspectiveEvidenceSnapshotSource}`,
    );
  }

  const workFocusSource = extractFunctionSource(
    cockpit,
    "function WorkFocusSection",
    "function SelectedWorkHandoffSnapshot",
  );
  assertIncludes(workFocusSource, "WorkFocusSection");
  assertIncludes(workFocusSource, "work-focus-grid");
  assertIncludes(workFocusSource, "Copy Codex handoff");

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

  const perspectiveTraceCss = extractCssRules(css, [
    ".perspective-trace-strip",
    ".perspective-trace-strip article",
    ".perspective-trace-strip article:not(:last-child)::after",
    ".perspective-trace-strip strong",
  ]);
  assertIncludes(perspectiveTraceCss, "min-width: 0");
  assertIncludes(perspectiveTraceCss, "max-width: 100%");
  assertIncludes(perspectiveTraceCss, "grid-template-columns: 1fr");
  assertIncludes(perspectiveTraceCss, "overflow-x: visible");
  assert.equal(
    perspectiveTraceCss.includes("minmax(112px"),
    false,
    "Perspective trace strip must not force horizontally scrolling mobile steps",
  );
  assert.equal(
    perspectiveTraceCss.includes("overflow-x: auto"),
    false,
    "Perspective trace strip must not use internal horizontal scrolling",
  );

  for (const snippet of [
    "Cockpit demo readiness polish",
    ".cockpit-topbar",
    ".cockpit-tab-nav",
    ".cockpit-tab-button:focus-visible",
    ".cockpit-tab-panel",
    ".perspective-grid",
    ".perspective-section",
    ".perspective-anchor-nav",
    "position: sticky",
    ".perspective-trace-strip",
    ".perspective-boundary-card",
    ".perspective-evidence-handoff-snapshot",
    ".perspective-evidence-handoff-grid",
    ".perspective-evidence-handoff-next",
    ".perspective-evidence-grid",
    ".tension-diagnostic-card",
    ".tension-card-header",
    ".tension-card-title",
    ".tension-chip-row",
    ".tension-chip",
    ".tension-card-body",
    ".tension-field-label",
    ".perspective-detail-panel",
    ".bridge-grid",
    ".capability-matrix",
    ".selected-work-handoff-snapshot",
    ".selected-work-handoff-grid",
    ".selected-work-handoff-next",
    ".operator-layout-grid",
    ".operator-handoff-snapshot",
    ".operator-handoff-snapshot-grid",
    ".operator-handoff-next",
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
    changedFiles.filter(
      (file) => file.startsWith("lib/") && !allowedRuntimeLibFiles.has(file),
    ),
    [],
    "Perspective IA PR must not change unrelated lib runtime files",
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
        perspective_evidence_handoff_snapshot_present: true,
        readme_demo_flow_current: true,
        mobile_trace_strip_non_scrolling: true,
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

function extractFunctionSource(value, startMarker, endMarker) {
  const start = value.indexOf(startMarker);
  const end = value.indexOf(endMarker, start + startMarker.length);

  assert.notEqual(start, -1, `Expected function start marker: ${startMarker}`);
  assert.notEqual(end, -1, `Expected function end marker: ${endMarker}`);

  return value.slice(start, end);
}

function extractBetween(value, startMarker, endMarker) {
  const start = value.indexOf(startMarker);
  const end = value.indexOf(endMarker, start + startMarker.length);

  assert.notEqual(start, -1, `Expected start marker: ${startMarker}`);
  assert.notEqual(end, -1, `Expected end marker: ${endMarker}`);

  return value.slice(start, end);
}

function extractReadmeDemoFlow(value) {
  const start = value.indexOf("## Demo flow");
  const end = value.indexOf("\n## ", start + "## Demo flow".length);

  assert.notEqual(start, -1, "README should include Demo flow section");
  assert.notEqual(end, -1, "README Demo flow section should end before next section");

  return value.slice(start, end);
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
