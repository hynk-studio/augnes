import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const closeoutDocPath = "docs/RESEARCH_CANDIDATE_REVIEW_V0_1_CLOSEOUT.md";
const surfaceDocPath = "docs/RESEARCH_CANDIDATE_REVIEW_SURFACE_V0_1.md";
const gateDocPath =
  "docs/RESEARCH_CANDIDATE_CANONICAL_PROMOTION_GATES_V0_1.md";
const indexPath = "docs/00_INDEX_LATEST.md";
const packagePath = "package.json";

const chainFiles = [
  "docs/RESEARCH_CANDIDATE_REVIEW_SURFACE_V0_1.md",
  "docs/RESEARCH_CANDIDATE_CANONICAL_PROMOTION_GATES_V0_1.md",
  "types/research-candidate-review.ts",
  "types/research-candidate-constellation-overlay.ts",
  "types/research-candidate-ai-context-packet.ts",
  "types/research-candidate-formation-receipt.ts",
  "lib/research-candidate-review/manual-note-parser.ts",
  "lib/research-candidate-review/constellation-overlay.ts",
  "lib/research-candidate-review/ai-context-packet.ts",
  "lib/research-candidate-review/formation-receipt.ts",
  "components/augnes-cockpit.tsx",
  "components/research-candidate-constellation-overlay-preview.tsx",
  "components/research-candidate-ai-context-packet-preview.tsx",
  "components/research-candidate-formation-receipt-preview.tsx",
  "fixtures/research-candidate-canonical-promotion-gates.sample.v0.1.json",
  "fixtures/research-candidate-review.sample.v0.1.json",
  "fixtures/research-candidate-review.manual-note.sample.v0.1.txt",
  "fixtures/research-candidate-review.manual-note-preview.sample.v0.1.json",
  "fixtures/research-candidate-review.constellation-overlay.sample.v0.1.json",
  "fixtures/research-candidate-review.manual-note-constellation-overlay.sample.v0.1.json",
  "fixtures/research-candidate-review.ai-context-packet.sample.v0.1.json",
  "fixtures/research-candidate-review.manual-note-ai-context-packet.sample.v0.1.json",
  "fixtures/research-candidate-review.formation-receipt.sample.v0.1.json",
  "fixtures/research-candidate-review.manual-note-formation-receipt.sample.v0.1.json",
  "scripts/smoke-research-candidate-review-surface-v0-1.mjs",
  "scripts/smoke-research-candidate-review-types-v0-1.mjs",
  "scripts/smoke-research-candidate-canonical-promotion-gates-v0-1.mjs",
  "scripts/smoke-research-candidate-review-cockpit-preview-v0-1.mjs",
  "scripts/smoke-research-candidate-review-manual-parser-v0-1.mjs",
  "scripts/smoke-research-candidate-review-parser-output-cockpit-preview-v0-1.mjs",
  "scripts/smoke-research-candidate-review-constellation-overlay-v0-1.mjs",
  "scripts/smoke-research-candidate-review-ai-context-packet-v0-1.mjs",
  "scripts/smoke-research-candidate-review-formation-receipt-v0-1.mjs",
];

const existingSmokePaths = [
  "scripts/smoke-research-candidate-review-formation-receipt-v0-1.mjs",
  "scripts/smoke-research-candidate-review-ai-context-packet-v0-1.mjs",
  "scripts/smoke-research-candidate-review-constellation-overlay-v0-1.mjs",
  "scripts/smoke-research-candidate-review-parser-output-cockpit-preview-v0-1.mjs",
  "scripts/smoke-research-candidate-review-manual-parser-v0-1.mjs",
  "scripts/smoke-research-candidate-review-cockpit-preview-v0-1.mjs",
  "scripts/smoke-research-candidate-review-types-v0-1.mjs",
  "scripts/smoke-research-candidate-canonical-promotion-gates-v0-1.mjs",
];

for (const filePath of [
  closeoutDocPath,
  surfaceDocPath,
  gateDocPath,
  indexPath,
  packagePath,
  ...chainFiles,
  ...existingSmokePaths,
]) {
  assert.ok(existsSync(filePath), `${filePath} must exist`);
}

const closeoutDoc = readFileSync(closeoutDocPath, "utf8");
const surfaceDoc = readFileSync(surfaceDocPath, "utf8");
const gateDoc = readFileSync(gateDocPath, "utf8");
const index = readFileSync(indexPath, "utf8");
const closeoutSmoke = readFileSync(
  "scripts/smoke-research-candidate-review-v0-1-closeout.mjs",
  "utf8",
);
const existingSmokes = existingSmokePaths.map((filePath) => [
  filePath,
  readFileSync(filePath, "utf8"),
]);
const packageJson = JSON.parse(readFileSync(packagePath, "utf8"));

assertCloseoutHeadings();
assertChainCoverage();
assertFilePointerCoverage();
assertBoundaryCoverage();
assertNextLane();
assertPreviewBoundaryWording();
assertIndexPointer();
assertSurfaceGateNextStep();
assertExistingSmokeAlignment();
assertPackageScript();
assertNoForbiddenImplementationPatterns();

console.log(
  JSON.stringify(
    {
      smoke: "research-candidate-review-v0-1-closeout",
      required_files_present: true,
      closeout_headings_checked: true,
      chain_coverage_checked: true,
      file_pointer_coverage_checked: true,
      boundary_coverage_checked: true,
      next_lane_checked: true,
      preview_boundary_wording_checked: true,
      index_pointer_checked: true,
      surface_gate_next_step_checked: true,
      existing_smoke_alignment_checked: true,
      package_script_checked: true,
      forbidden_implementation_patterns_absent: true,
    },
    null,
    2,
  ),
);

function assertCloseoutHeadings() {
  for (const heading of [
    "# Research Candidate Review v0.1 Closeout",
    "## Purpose",
    "## Milestone Summary",
    "## Completed Preview Chain",
    "## What v0.1 Enables",
    "## What v0.1 Does Not Implement",
    "## Verification Chain",
    "## Authority Boundary",
    "## Known Gaps And Caveats",
    "## Next Implementation Lane",
    "## Stop Conditions For The Next Lane",
    "## Recommended Next Work",
  ]) {
    assert.ok(closeoutDoc.includes(heading), `closeout doc must include ${heading}`);
  }
}

function assertChainCoverage() {
  for (const sliceName of [
    "Research Candidate Review Surface",
    "Type-only Research Candidate Review contract",
    "Canonical promotion gates",
    "Cockpit/Perspective static fixture preview",
    "Manual pasted note parser preview",
    "Parser output Cockpit/Perspective static preview",
    "Candidate Constellation Overlay preview",
    "Research Candidate AI Context Packet preview",
    "Formation Receipt preview",
  ]) {
    assert.ok(closeoutDoc.includes(sliceName), `closeout doc must mention ${sliceName}`);
  }
}

function assertFilePointerCoverage() {
  for (const requiredText of [
    "docs/RESEARCH_CANDIDATE_REVIEW_SURFACE_V0_1.md",
    "fixtures/research-candidate-review.sample.v0.1.json",
    "types/research-candidate-review.ts",
    "docs/RESEARCH_CANDIDATE_CANONICAL_PROMOTION_GATES_V0_1.md",
    "fixtures/research-candidate-canonical-promotion-gates.sample.v0.1.json",
    "components/augnes-cockpit.tsx",
    "lib/research-candidate-review/manual-note-parser.ts",
    "fixtures/research-candidate-review.manual-note.sample.v0.1.txt",
    "fixtures/research-candidate-review.manual-note-preview.sample.v0.1.json",
    "types/research-candidate-constellation-overlay.ts",
    "lib/research-candidate-review/constellation-overlay.ts",
    "fixtures/research-candidate-review.constellation-overlay.sample.v0.1.json",
    "fixtures/research-candidate-review.manual-note-constellation-overlay.sample.v0.1.json",
    "components/research-candidate-constellation-overlay-preview.tsx",
    "types/research-candidate-ai-context-packet.ts",
    "lib/research-candidate-review/ai-context-packet.ts",
    "fixtures/research-candidate-review.ai-context-packet.sample.v0.1.json",
    "fixtures/research-candidate-review.manual-note-ai-context-packet.sample.v0.1.json",
    "components/research-candidate-ai-context-packet-preview.tsx",
    "types/research-candidate-formation-receipt.ts",
    "lib/research-candidate-review/formation-receipt.ts",
    "fixtures/research-candidate-review.formation-receipt.sample.v0.1.json",
    "fixtures/research-candidate-review.manual-note-formation-receipt.sample.v0.1.json",
    "components/research-candidate-formation-receipt-preview.tsx",
    "scripts/smoke-research-candidate-review-surface-v0-1.mjs",
    "scripts/smoke-research-candidate-review-types-v0-1.mjs",
    "scripts/smoke-research-candidate-canonical-promotion-gates-v0-1.mjs",
    "scripts/smoke-research-candidate-review-cockpit-preview-v0-1.mjs",
    "scripts/smoke-research-candidate-review-manual-parser-v0-1.mjs",
    "scripts/smoke-research-candidate-review-parser-output-cockpit-preview-v0-1.mjs",
    "scripts/smoke-research-candidate-review-constellation-overlay-v0-1.mjs",
    "scripts/smoke-research-candidate-review-ai-context-packet-v0-1.mjs",
    "scripts/smoke-research-candidate-review-formation-receipt-v0-1.mjs",
  ]) {
    assert.ok(closeoutDoc.includes(requiredText), `closeout doc must mention ${requiredText}`);
  }
}

function assertBoundaryCoverage() {
  for (const requiredText of [
    "no runtime manual input UX",
    "no live parser execution in Cockpit",
    "no runtime API route",
    "no durable candidate/review storage",
    "no durable receipt storage",
    "no event log",
    "no proof/evidence writes",
    "no provider/OpenAI calls",
    "no source fetching",
    "no retrieval/RAG",
    "no embeddings/vector search",
    "no graph DB",
    "no layout algorithm",
    "no perspective promotion",
    "no review/promote/reject/defer workflow",
    "no work item creation",
    "no Codex execution",
    "no external handoff sending",
  ]) {
    assert.ok(closeoutDoc.includes(requiredText), `closeout doc must include ${requiredText}`);
  }
}

function assertNextLane() {
  for (const requiredText of [
    "Manual Research Candidate Preview Lane",
    "Cockpit manual pasted note preview UI shell",
    "existing deterministic parser",
    "preview-only",
    "read-only",
    "without storage",
    "promotion",
    "provider calls",
    "retrieval",
    "proof/evidence writes",
    "work item creation",
    "Codex execution",
  ]) {
    assert.ok(closeoutDoc.includes(requiredText), `closeout doc next lane must include ${requiredText}`);
  }
}

function assertPreviewBoundaryWording() {
  for (const regex of [
    /preview boundaries, not permanent product bans/i,
    /future lanes may add\s+runtime input, preview routes, durable storage, retrieval,\s+provider-assisted\s+extraction, or promotion/i,
    /each future lane must be introduced as a bounded\s+lane with explicit scope/i,
    /v0\.1 preview chain itself remains non-authoritative/i,
  ]) {
    assert.match(closeoutDoc, regex, `closeout doc must include ${regex}`);
  }
}

function assertIndexPointer() {
  const pointer = extractAround(index, "RESEARCH_CANDIDATE_REVIEW_V0_1_CLOSEOUT", 1800);
  for (const requiredText of [
    "docs/RESEARCH_CANDIDATE_REVIEW_V0_1_CLOSEOUT.md",
    "smoke:research-candidate-review-v0-1-closeout",
    "v0.1 preview milestone closeout",
    "next implementation lane",
    "Cockpit manual pasted note preview UI shell",
    "no runtime/durable behavior",
  ]) {
    assert.ok(pointer.includes(requiredText), `index closeout pointer must include ${requiredText}`);
  }
}

function assertSurfaceGateNextStep() {
  const expected = /Cockpit manual pasted note preview UI shell/i;
  assert.match(
    extractSection(surfaceDoc, "## Next Recommended Step"),
    expected,
    "surface doc next step must mention Cockpit manual pasted note preview UI shell",
  );
  assert.match(
    extractSection(gateDoc, "## Next Recommended Step"),
    expected,
    "gate doc next step must mention Cockpit manual pasted note preview UI shell",
  );
}

function assertExistingSmokeAlignment() {
  for (const [filePath, source] of existingSmokes) {
    assert.match(
      source,
      /Cockpit manual pasted note preview UI shell/i,
      `${filePath} must expect Cockpit manual pasted note preview UI shell`,
    );
  }
}

function assertPackageScript() {
  assert.equal(
    packageJson.scripts["smoke:research-candidate-review-v0-1-closeout"],
    "node scripts/smoke-research-candidate-review-v0-1-closeout.mjs",
    "package.json must expose the closeout smoke script",
  );
}

function assertNoForbiddenImplementationPatterns() {
  const combinedStaticText = [
    closeoutDoc,
    extractAround(index, "RESEARCH_CANDIDATE_REVIEW_V0_1_CLOSEOUT", 1800),
    closeoutSmoke,
  ].join("\n");

  const forbiddenPatterns = [
    pattern(["child", "_process"]),
    pattern(["spawn"], "\\b", "\\s*\\("),
    pattern(["exec"], "\\b", "\\s*\\("),
    pattern(["exec", "File"], "\\b", "\\s*\\("),
    pattern(["api", ".github", ".com"]),
    pattern(["api", ".open", "ai", ".com"]),
    pattern(["GITHUB", "_TOKEN"]),
    pattern(["OPEN", "AI", "_API", "_KEY"]),
    pattern(["record", "-proof"]),
    pattern(["record", "-evidence"]),
    pattern(["commit", "State", "Update"]),
    pattern(["fetch"], "\\b", "\\s*\\("),
    pattern(["XML", "Http", "Request"], "\\b", "\\b"),
    pattern(["Web", "Socket"], "\\b", "\\b"),
    pattern(["Event", "Source"], "\\b", "\\b"),
    pattern(["CREATE", " TABLE"], "\\b", "\\b", "i"),
    pattern(["ALTER", " TABLE"], "\\b", "\\b", "i"),
    pattern(["INSERT", " INTO"], "\\b", "\\b", "i"),
    pattern(["Next", "Response"], "\\b", "\\b"),
    pattern(["route", ".ts"], "\\b", "\\b"),
    pattern(["use", " client"], "\\b", "\\b"),
    pattern(["pri", "sma"], "\\b", "\\b", "i"),
    pattern(["sql", "ite"], "\\b", "\\b", "i"),
    pattern(["driz", "zle"], "\\b", "\\b", "i"),
    pattern(["supa", "base"], "\\b", "\\b", "i"),
    pattern(["open", "ai", " implementation"], "\\b", "\\b", "i"),
    pattern(["embed", "dings", " implementation"], "\\b", "\\b", "i"),
    pattern(["vec", "tor", " search", " implementation"], "\\b", "\\b", "i"),
    pattern(["r", "ag", " implementation"], "\\b", "\\b", "i"),
    pattern(["write", "Receipt", " implementation"], "\\b", "\\b"),
    pattern(["write", "Event", "Log", " implementation"], "\\b", "\\b"),
    pattern(["send", "Handoff", " implementation"], "\\b", "\\b"),
    pattern(["execute", "Codex", " implementation"], "\\b", "\\b"),
    pattern(["call", "Provider", " implementation"], "\\b", "\\b"),
    pattern(["run", "Retrieval", " implementation"], "\\b", "\\b"),
    pattern(["create", "WorkItem", " implementation"], "\\b", "\\b"),
    pattern(["promote", "Perspective", " implementation"], "\\b", "\\b"),
  ];

  for (const { label, regex } of forbiddenPatterns) {
    assert.doesNotMatch(
      combinedStaticText,
      regex,
      `closeout static text must not include ${label}`,
    );
  }
}

function extractSection(source, heading) {
  const start = source.indexOf(heading);
  assert.notEqual(start, -1, `missing section ${heading}`);
  const next = source.indexOf("\n## ", start + heading.length);
  return source.slice(start, next === -1 ? source.length : next);
}

function extractAround(source, marker, radius) {
  const index = source.indexOf(marker);
  assert.notEqual(index, -1, `missing marker ${marker}`);
  return source.slice(Math.max(0, index - radius), index + marker.length + radius);
}

function pattern(parts, before = "", after = "", flags = "") {
  const label = parts.join("");
  return {
    label,
    regex: new RegExp(`${before}${parts.map(escapeRegExp).join("")}${after}`, flags),
  };
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
