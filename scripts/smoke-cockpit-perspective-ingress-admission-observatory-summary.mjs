import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

const packageFile = "package.json";
const cockpitFile = "components/augnes-cockpit.tsx";
const cssFile = "app/globals.css";
const docFile =
  "docs/PERSPECTIVE_INGRESS_ADMISSION_OBSERVATORY_SUMMARY_V0_1.md";
const smokeFile =
  "scripts/smoke-cockpit-perspective-ingress-admission-observatory-summary.mjs";
const browserReportFile =
  "reports/browser/2026-06-07-perspective-ingress-admission-observatory-summary.md";
const workbenchSmokeFile =
  "scripts/smoke-cockpit-perspective-workbench-temporal-underlay.mjs";
const localManualIngressSmokeFile =
  "scripts/smoke-perspective-local-manual-ingress-admission-preview.mjs";
const localPastedTextSmokeFile =
  "scripts/smoke-perspective-ingest-local-pasted-text-preview.mjs";
const ingressModelSmokeFile =
  "scripts/smoke-perspective-ingress-admission-model.mjs";
const agentBriefSmokeFile =
  "scripts/smoke-perspective-agent-brief-read-surface.mjs";
const projectionBuildersSmokeFile =
  "scripts/smoke-perspective-temporal-spatial-projection-builders.mjs";
const typeFile = "types/perspective-ingest-constellation-preview.ts";
const agentBriefRouteFile =
  "app/api/augnes/read/perspective-agent-brief/route.ts";
const agentBriefHelperFile = "lib/readonly-api/perspective-agent-brief.ts";
const agentBriefBuilderFile =
  "lib/perspective-ingest/perspective-agent-brief.ts";

const packageJson = JSON.parse(readFileSync(packageFile, "utf8"));
const cockpitText = readFileSync(cockpitFile, "utf8");
const cssText = readFileSync(cssFile, "utf8");
const docText = readFileSync(docFile, "utf8");
const typeText = readFileSync(typeFile, "utf8");
const agentBriefRouteBefore = gitShowHead(agentBriefRouteFile);
const agentBriefHelperBefore = gitShowHead(agentBriefHelperFile);

const allowedChangedFiles = new Set([
  cockpitFile,
  cssFile,
  docFile,
  smokeFile,
  browserReportFile,
  packageFile,
  workbenchSmokeFile,
  localManualIngressSmokeFile,
  localPastedTextSmokeFile,
  ingressModelSmokeFile,
  agentBriefSmokeFile,
  projectionBuildersSmokeFile,
  agentBriefBuilderFile,
  "docs/PERSPECTIVE_AGENT_BRIEF_MANUAL_INGRESS_CONTEXT_V0_1.md",
  "reports/2026-06-07-perspective-agent-brief-manual-ingress-context.md",
  "scripts/smoke-perspective-agent-brief-manual-ingress-context.mjs",
]);

assert.equal(
  packageJson.scripts[
    "smoke:cockpit-perspective-ingress-admission-observatory-summary"
  ],
  "node scripts/smoke-cockpit-perspective-ingress-admission-observatory-summary.mjs",
  "package.json must register smoke:cockpit-perspective-ingress-admission-observatory-summary",
);

for (const file of [
  cockpitFile,
  cssFile,
  docFile,
  smokeFile,
  typeFile,
  localManualIngressSmokeFile,
]) {
  assert.equal(existsSync(file), true, `${file} must exist`);
}

assertContainsAll(docText, [
  "# Perspective Ingress Admission Observatory Summary v0.1",
  "displays compact ingress admission metadata in Perspective Observatory details",
  "manual pasted-text previews that include `ingress_admission`",
  "not a raw JSON dump",
  "not raw pasted text",
  "does not appear in the default Human Workbench first view",
  "Sample fixture previews that do not include `ingress_admission` simply omit the summary",
  "status: admitted for preview",
  "source: manual pasted text",
  "trust: user provided local",
  "candidate state: episode candidate",
  "decision: accepted for preview",
  "readiness: preview ready",
  "boundary: local / read-only",
  "Data attributes must not contain candidate id",
  "Agent Brief read route behavior",
  "Ingress admission model behavior",
  "Graph topology",
  "Event Rail structure",
  "Packet section order",
  "FormationReceipt",
  "does not add OAuth",
  "external API ingress",
  "provider/model calls",
  "GitHub calls or mutation",
  "Codex execution",
  "DB schema or migrations",
  "persistence",
  "graph DB behavior",
  "proof/evidence/readiness writes",
  "Add local manual ingress admission to Agent Brief context",
]);

assertContainsAll(cockpitText, [
  "const [perspectiveObservatoryDetailsOpen, setPerspectiveObservatoryDetailsOpen]",
  "perspectiveIngestConstellationPreview?.ingress_admission ?? null",
  "perspectiveObservatoryDetailsOpen ? (",
  "perspectiveIngressAdmission ? (",
  "data-augnes-region=\"perspective-ingress-admission-summary\"",
  "data-augnes-ingress-admission-version=\"perspective_ingress_admission_preview.v0.1\"",
  "data-augnes-ingress-kind=\"manual_pasted_text\"",
  "data-augnes-ingress-trust=\"user_provided_local\"",
  "data-augnes-ingress-readiness={perspectiveIngressAdmissionReadinessHook}",
  "data-augnes-ingress-authority=\"local-read-only-candidate\"",
  "Ingress admission",
  "Admitted for preview",
  "manual pasted text",
  "user provided local",
  "episode candidate",
  "accepted for preview",
  "preview ready",
  "local / read-only",
  "not Formation authority",
  "no persistence",
  "no graph DB",
  "no Codex",
  "no GitHub",
  "getPerspectiveIngressAdmissionStatusLabel",
  "getPerspectiveIngressAdmissionDecisionLabel",
  "formatPerspectiveIngressAdmissionBoundaryLabel",
  "data-augnes-region=\"perspective-primary-workbench\"",
  "data-augnes-perspective-view=\"workbench-temporal-underlay\"",
  "open={perspectiveTemporalDetailsOpen}",
  "open={perspectiveAdvancedPreviewControlsOpen}",
]);

assertContainsAll(cssText, [
  ".perspective-ingress-admission-summary",
  ".perspective-ingress-admission-grid",
  ".perspective-ingress-admission-chip",
  ".perspective-ingress-admission-boundary",
  ".perspective-ingress-admission-muted",
  "grid-template-columns: repeat(auto-fit, minmax(150px, 1fr))",
  "overflow-wrap: anywhere",
]);

assertContainsAll(typeText, [
  "ingress_admission?: PerspectiveIngestAdmissionPreviewV0",
  "admission_version: \"perspective_ingress_admission_preview.v0.1\"",
]);

for (const forbidden of [
  "JSON.stringify(perspectiveIngestConstellationPreview.ingress_admission",
  "JSON.stringify(perspectiveIngressAdmission",
  "JSON.stringify(ingress_admission",
  "dangerouslySetInnerHTML",
  "perspectiveIngressAdmission.candidate.bounded_summary}",
  "data-augnes-ingress-candidate",
  "data-augnes-ingress-source-ref",
  "data-augnes-ingress-bounded-summary",
  "data-augnes-ingress-pointer",
  "data-augnes-ingress-actor",
  "data-augnes-ingress-consent",
]) {
  assert.equal(
    cockpitText.includes(forbidden),
    false,
    `${cockpitFile} must not include forbidden ingress summary source: ${forbidden}`,
  );
}

const ingressSummarySource = extractBetween(
  cockpitText,
  "className=\"perspective-ingress-admission-summary\"",
  "<details className=\"perspective-formation-receipt-details\">",
);
assert.equal(
  /<textarea\b/i.test(ingressSummarySource),
  false,
  "Ingress summary must not render a textarea",
);
assert.equal(
  /input_text|raw_private|OPENAI_API_KEY|GITHUB_TOKEN|api\.github\.com|api\.openai\.com/i.test(
    ingressSummarySource,
  ),
  false,
  "Ingress summary source must not render raw/private/provider/token fields",
);

assert.equal(
  /perspective_agent_brief_read|perspective-agent-brief/.test(cockpitText),
  false,
  "Cockpit must not expose Agent Brief in product DOM",
);
assert.equal(
  /\brulecraft\b/i.test(cockpitText),
  false,
  "Rulecraft must remain unexposed in product-facing Cockpit UI",
);

assert.equal(
  gitShowHead(agentBriefRouteFile),
  agentBriefRouteBefore,
  "Agent Brief route file must remain unchanged in this smoke run",
);
assert.equal(
  gitShowHead(agentBriefHelperFile),
  agentBriefHelperBefore,
  "Agent Brief helper file must remain unchanged in this smoke run",
);

for (const changedFile of collectChangedFiles()) {
  assert(
    allowedChangedFiles.has(changedFile),
    `Ingress admission Observatory summary changed an out-of-scope file: ${changedFile}`,
  );
  assert(
    !changedFile.startsWith("app/api/") &&
      !changedFile.startsWith("db/") &&
      !changedFile.startsWith("migrations/") &&
      !changedFile.includes("persistence") &&
      !changedFile.includes("provider") &&
      !changedFile.includes("github") &&
      !changedFile.includes("codex-execution") &&
      !changedFile.includes("oauth"),
    `Ingress admission Observatory summary must not change forbidden surfaces: ${changedFile}`,
  );
}

console.log("PASS smoke:cockpit-perspective-ingress-admission-observatory-summary");

function assertContainsAll(text, snippets) {
  const normalized = normalize(text);
  for (const snippet of snippets) {
    assert(
      normalized.includes(normalize(snippet)),
      `Expected source to contain: ${snippet}`,
    );
  }
}

function extractBetween(text, start, end) {
  const startIndex = text.indexOf(start);
  assert.notEqual(startIndex, -1, `Expected start marker: ${start}`);
  const endIndex = text.indexOf(end, startIndex);
  assert.notEqual(endIndex, -1, `Expected end marker after ${start}: ${end}`);
  return text.slice(startIndex, endIndex);
}

function normalize(text) {
  return text.replace(/\s+/g, " ").trim();
}

function collectChangedFiles() {
  const workingTreeFiles = gitLines(["diff", "--name-only", "HEAD"]);
  const branchFiles = gitLines(["diff", "--name-only", "origin/main...HEAD"]);
  const untrackedFiles = gitLines(["ls-files", "--others", "--exclude-standard"]);
  return Array.from(
    new Set([...workingTreeFiles, ...branchFiles, ...untrackedFiles]),
  ).filter(Boolean);
}

function gitLines(args) {
  try {
    return execFileSync("git", args, { encoding: "utf8" })
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
  } catch {
    return [];
  }
}

function gitShowHead(file) {
  try {
    return execFileSync("git", ["show", `HEAD:${file}`], { encoding: "utf8" });
  } catch {
    return "";
  }
}
