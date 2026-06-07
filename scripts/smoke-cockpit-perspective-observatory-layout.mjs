import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const cockpitFile = "components/augnes-cockpit.tsx";
const cssFile = "app/globals.css";
const packageFile = "package.json";
const docFile = "docs/PERSPECTIVE_OBSERVATORY_LAYOUT_RESTORE_V0_1.md";
const smokeFile = "scripts/smoke-cockpit-perspective-observatory-layout.mjs";

const cockpit = readFileSync(cockpitFile, "utf8");
const css = readFileSync(cssFile, "utf8");
const packageJson = JSON.parse(readFileSync(packageFile, "utf8"));
const doc = readFileSync(docFile, "utf8");

assert.equal(
  packageJson.scripts["smoke:cockpit-perspective-observatory-layout"],
  "node scripts/smoke-cockpit-perspective-observatory-layout.mjs",
  "package.json must register smoke:cockpit-perspective-observatory-layout",
);

assertContainsAll(cockpit, [
  'useState<CockpitTab>("perspective")',
  "AUGNES / Perspective Observatory",
  "Perspective Observatory",
  "Current perspective sky",
  "Perspective Constellation identity strip",
  "Viewing",
  "Basis",
  "Source",
  "Status",
  "Observatory Controls",
  "Formation Basis",
  "Current",
  "Manual Selection",
  "Historical Snapshot",
  "Auto Proposal",
  "Experimental",
  "Lens",
  "Whole Constellation",
  "Connected Nodes",
  "Open Tensions",
  "Next Candidates",
  "Codex Handoff",
  "Scope",
  "Whole",
  "Connected Node",
  "Cluster",
  "Manual Selection",
  "Perspective Starmap",
  "Current Perspective Starmap",
  "Selected",
  "Why here",
  "Evidence / Tensions / Next",
  "Actions",
  "Open Handoff Packet",
  "Preview Handoff Packet",
  "Advanced preview controls",
  "Manual Gravity Preview",
  "Event Rail",
  "Archive / Present / Future",
  "Archive",
  "Present",
  "Future",
  "Session",
  "Decision",
  "Handoff",
  "PR",
  "Review",
  "Closeout",
  "Current View",
  "Next Perspective",
  "Archive Entry Card",
  "Current View Card",
  "Future Candidate Card",
  "read-only",
  "local-only",
  "preview-only",
  "no external calls",
  "no persistence",
  "no graph DB",
  "No Codex execution",
  "No provider, model, API call, billing",
]);

assertContainsAll(css, [
  "grid-template-areas: \"controls starmap inspector\"",
  "grid-area: controls",
  "grid-area: starmap",
  "grid-area: inspector",
  "perspective-control-group",
  "perspective-scope-option-list",
  "perspective-inspector-evidence-next",
  "perspective-inspector-advanced-details",
  "perspective-event-rail-role-row",
]);

assertContainsAll(doc, [
  "# Perspective Observatory Layout Restore v0.1",
  "layout restoration",
  "Compact identity",
  "Left controls",
  "Center starmap",
  "Right inspector",
  "Bottom event rail",
  "Rulecraft remains unexposed",
  "Auto Proposal remains future/disabled",
  "Historical Snapshot remains archive-card-only",
]);

assert(
  !/Central Game Window|Central Constellation Game Window|Game-window shell/.test(
    cockpit,
  ),
  "old Game Window product labels must not remain in Cockpit source",
);

assert(
  !/\brulecraft\b/i.test(cockpit),
  "Rulecraft must not be exposed in product-facing Cockpit UI",
);

assertContainsAll(cockpit, [
  "const [handoffPacketOpen, setHandoffPacketOpen] = useState(false)",
  "openPerspectiveConstellationHandoffPacket",
  "open={handoffPacketOpen}",
]);

for (const changedFile of collectChangedFiles()) {
  assert(
    !changedFile.startsWith("app/api/"),
    `layout restore must not introduce or edit API routes: ${changedFile}`,
  );
}

console.log("cockpit perspective observatory layout smoke passed");

function assertContainsAll(text, snippets) {
  const normalized = normalize(text);
  for (const snippet of snippets) {
    assert(
      normalized.includes(normalize(snippet)),
      `Expected source to contain: ${snippet}`,
    );
  }
}

function normalize(text) {
  return text.replace(/\s+/g, " ").trim();
}

function collectChangedFiles() {
  const workingTreeFiles = gitLines(["diff", "--name-only", "HEAD"]);
  const branchFiles = gitLines(["diff", "--name-only", "origin/main...HEAD"]);
  return Array.from(new Set([...workingTreeFiles, ...branchFiles])).filter(Boolean);
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
