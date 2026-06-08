import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

const packageFile = "package.json";
const builderFile =
  "lib/perspective-ingest/perspective-agent-brief-handoff-packet.ts";
const agentBriefBuilderFile =
  "lib/perspective-ingest/perspective-agent-brief.ts";
const localPreviewHelperFile =
  "lib/readonly-api/perspective-ingest-local-preview.ts";
const agentBriefReadHelperFile = "lib/readonly-api/perspective-agent-brief.ts";
const agentBriefRouteFile =
  "app/api/augnes/read/perspective-agent-brief/route.ts";
const docFile =
  "docs/PERSPECTIVE_MANUAL_AGENT_BRIEF_HANDOFF_DOGFOOD_V0_1.md";
const smokeFile =
  "scripts/smoke-perspective-manual-agent-brief-handoff-dogfood.mjs";
const reportFile =
  "reports/2026-06-07-perspective-manual-agent-brief-handoff-dogfood.md";
const manualIngressContextSmokeFile =
  "scripts/smoke-perspective-agent-brief-manual-ingress-context.mjs";
const localManualSmokeFile =
  "scripts/smoke-perspective-local-manual-ingress-admission-preview.mjs";
const readSurfaceSmokeFile =
  "scripts/smoke-perspective-agent-brief-read-surface.mjs";
const observatorySummarySmokeFile =
  "scripts/smoke-cockpit-perspective-ingress-admission-observatory-summary.mjs";
const ingressModelSmokeFile =
  "scripts/smoke-perspective-ingress-admission-model.mjs";
const projectionBuildersSmokeFile =
  "scripts/smoke-perspective-temporal-spatial-projection-builders.mjs";
const workbenchSmokeFile =
  "scripts/smoke-cockpit-perspective-workbench-temporal-underlay.mjs";
const cockpitFile = "components/augnes-cockpit.tsx";

const packageJson = JSON.parse(readFileSync(packageFile, "utf8"));
const builderText = readFileSync(builderFile, "utf8");
const agentBriefBuilderText = readFileSync(agentBriefBuilderFile, "utf8");
const localPreviewHelperText = readFileSync(localPreviewHelperFile, "utf8");
const agentBriefReadHelperText = readFileSync(agentBriefReadHelperFile, "utf8");
const agentBriefRouteText = readFileSync(agentBriefRouteFile, "utf8");
const docText = readFileSync(docFile, "utf8");
const cockpitText = readFileSync(cockpitFile, "utf8");

const { buildPerspectiveAgentBrief } = await import(
  "../lib/perspective-ingest/perspective-agent-brief.ts"
);
const { buildPerspectiveAgentBriefHandoffPacket } = await import(
  "../lib/perspective-ingest/perspective-agent-brief-handoff-packet.ts"
);
const { buildPerspectiveIngestLocalPreviewReadResponse } = await import(
  "../lib/readonly-api/perspective-ingest-local-preview.ts"
);
const { buildPerspectiveAgentBriefSourcePreview } = await import(
  "../lib/readonly-api/perspective-agent-brief.ts"
);

const allowedChangedFiles = new Set([
  packageFile,
  builderFile,
  docFile,
  smokeFile,
  reportFile,
  manualIngressContextSmokeFile,
  localManualSmokeFile,
  readSurfaceSmokeFile,
  observatorySummarySmokeFile,
  ingressModelSmokeFile,
  projectionBuildersSmokeFile,
  workbenchSmokeFile,
  "scripts/dogfood-perspective-manual-agent-brief-codex-review-loop.mjs",
  "scripts/smoke-perspective-manual-agent-brief-codex-review-loop-eval.mjs",
  "docs/PERSPECTIVE_MANUAL_AGENT_BRIEF_CODEX_REVIEW_LOOP_EVAL_V0_1.md",
  "reports/2026-06-07-perspective-manual-agent-brief-codex-review-loop-eval.md",
  "reports/dogfood/2026-06-07-perspective-manual-agent-brief-codex-review-loop-packet.md",
  "docs/PERSPECTIVE_AGENT_BRIEF_HANDOFF_COPY_REFINE_V0_1.md",
  "reports/2026-06-07-perspective-agent-brief-handoff-copy-refine.md",
  "scripts/smoke-perspective-agent-brief-handoff-copy-refine.mjs",
  "lib/perspective-ingest/perspective-agent-brief-codex-prompt-template.ts",
  "scripts/dogfood-perspective-reviewed-manual-agent-brief-codex-template.mjs",
  "scripts/smoke-perspective-reviewed-manual-agent-brief-codex-template.mjs",
  "docs/PERSPECTIVE_REVIEWED_MANUAL_AGENT_BRIEF_CODEX_TEMPLATE_V0_1.md",
  "reports/2026-06-07-perspective-reviewed-manual-agent-brief-codex-template.md",
  "reports/dogfood/2026-06-07-perspective-reviewed-manual-agent-brief-codex-template.md",
]);

assert.equal(
  packageJson.scripts["smoke:perspective-manual-agent-brief-handoff-dogfood"],
  "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json scripts/smoke-perspective-manual-agent-brief-handoff-dogfood.mjs",
  "package.json must register smoke:perspective-manual-agent-brief-handoff-dogfood",
);

for (const file of [
  builderFile,
  agentBriefBuilderFile,
  localPreviewHelperFile,
  agentBriefReadHelperFile,
  agentBriefRouteFile,
  docFile,
  smokeFile,
]) {
  assert.equal(existsSync(file), true, `${file} must exist`);
}

assertContainsAll(docText, [
  "# Perspective Manual Agent Brief Handoff Dogfood v0.1",
  "dogfoods copy-ready handoff packet generation",
  "follows PR #453",
  "generated from the Agent Brief, not from raw manual input",
  "consumption artifact",
  "not execution authority",
  "does not change the Human Workbench UI",
  "does not change the Agent Brief read route behavior",
  "does not add manual Agent Brief route support",
  "does not add a POST Agent Brief route",
  "raw pasted text",
  "raw `ingress_admission` JSON",
  "candidate id value",
  "source ref value",
  "pointer refs values",
  "actor refs values",
  "consent ref",
  "bounded summary",
  "packet textarea content",
  "FormationReceipt body",
  "preserves graph topology",
  "existing Perspective packet section order",
  "Evaluate manual Agent Brief handoff packet in Codex review loop",
]);

assertContainsAll(builderText, [
  "PerspectiveAgentBriefHandoffPacketAudienceV0",
  "PerspectiveAgentBriefHandoffPacketV0",
  "BuildPerspectiveAgentBriefHandoffPacketInput",
  "buildPerspectiveAgentBriefHandoffPacket",
  "packet_version: \"perspective_agent_brief_handoff_packet.v0.1\"",
  "\"chatgpt_review\"",
  "\"codex_handoff\"",
  "\"agent_context\"",
  "## Purpose",
  "## Selected Material",
  "## Spatial Context",
  "## Temporal Context",
  "## Ingress Context",
  "## Tensions",
  "## Next Actions",
  "## Handoff Constraints",
  "## Authority",
  "## Exclusions",
  "formatSelectedMaterialSummaryForHandoff",
  "Summary: omitted for manual ingress packet.",
]);
for (const forbidden of [
  "JSON.stringify(brief",
  "JSON.stringify(brief.ingress_context",
  "JSON.stringify(preview.ingress_admission",
  "JSON.stringify(",
  "candidate_id: ingressContext",
  "source_ref: ingressContext",
  "pointer_refs",
  "actor_refs",
  "consent_ref",
  "bounded_summary",
]) {
  assert.equal(
    builderText.includes(forbidden),
    false,
    `${builderFile} must not dump or expose forbidden raw fields: ${forbidden}`,
  );
}

const generatedAt = "2026-06-08T00:00:00.000Z";
const rawManualInput = [
  "Intent: Dogfood an Agent Brief handoff packet from a local manual preview.",
  "Concept: A concise packet carries selected, spatial, temporal, and ingress context.",
  "Decision: Build a local-only copy-ready packet without routes or execution.",
  "Work: Add a pure handoff packet builder.",
  "Changed: lib/perspective-ingest/perspective-agent-brief-handoff-packet.ts",
  "Validation: Smoke the manual preview to Agent Brief to packet chain.",
  "Report: Record raw-value exclusion checks.",
  "Tension: The packet must help follow-up without exposing raw pasted text.",
  "Next: Evaluate the packet in a Codex review loop.",
  "Evidence: manual-agent-brief-handoff-dogfood-smoke",
  "Detail: " + "handoff packet dogfood context ".repeat(28),
].join("\n");
const manualPreview = buildPerspectiveIngestLocalPreviewReadResponse({
  generatedAt,
  request: {
    input_kind: "manual:pasted_text",
    source_label: "Manual Agent Brief handoff dogfood smoke",
    input_text: rawManualInput,
  },
});
assert(manualPreview.ingress_admission, "manual preview must have ingress_admission");

const manualBrief = buildPerspectiveAgentBrief({
  preview: manualPreview,
  scope_mode: "whole_constellation",
  scope_label: "Whole Constellation",
});
assert(manualBrief.ingress_context, "manual brief must have ingress_context");

const chatGptPacket = buildPerspectiveAgentBriefHandoffPacket({
  brief: manualBrief,
  audience: "chatgpt_review",
  generated_at: generatedAt,
});
const codexPacket = buildPerspectiveAgentBriefHandoffPacket({
  brief: manualBrief,
  audience: "codex_handoff",
  generated_at: generatedAt,
});
for (const packet of [chatGptPacket, codexPacket]) {
  assertManualPacket(packet, manualPreview, rawManualInput);
}
assert.equal(chatGptPacket.audience, "chatgpt_review");
assert.equal(codexPacket.audience, "codex_handoff");

const samplePreview = buildPerspectiveAgentBriefSourcePreview({
  source: "sample:chatgpt",
});
const sampleBrief = buildPerspectiveAgentBrief({ preview: samplePreview });
assert.equal(Object.hasOwn(sampleBrief, "ingress_context"), false);
const samplePacket = buildPerspectiveAgentBriefHandoffPacket({
  brief: sampleBrief,
  audience: "agent_context",
  generated_at: generatedAt,
});
assert.equal(samplePacket.packet_version, "perspective_agent_brief_handoff_packet.v0.1");
assert(samplePacket.packet_text.includes("No ingress context present."));
assert(
  samplePacket.packet_text.includes(`Summary: ${sampleBrief.selected.summary}`),
  "sample fixture packet may still include selected summary",
);
assertSectionOrder(samplePacket.packet_text);

const manualSourceNode = manualPreview.constellation.nodes.find(
  (node) => node.type === "source",
);
assert(manualSourceNode, "manual preview should have a selectable source node");
const selectedSourceManualBrief = buildPerspectiveAgentBrief({
  preview: manualPreview,
  selected_node_id: manualSourceNode.id,
  scope_mode: "selected_node",
  scope_label: "Selected node",
});
assert.equal(selectedSourceManualBrief.selected.id, manualSourceNode.id);
assert.equal(selectedSourceManualBrief.selected.summary, manualSourceNode.summary);
assert(selectedSourceManualBrief.ingress_context);
const selectedSourceManualPacket = buildPerspectiveAgentBriefHandoffPacket({
  brief: selectedSourceManualBrief,
  audience: "codex_handoff",
  generated_at: generatedAt,
});
assert(selectedSourceManualPacket.packet_text.includes("Scope: selected_node / Selected node"));
assertManualPacket(selectedSourceManualPacket, manualPreview, rawManualInput);
assert(
  selectedSourceManualPacket.packet_text.includes(
    "Summary: omitted for manual ingress packet.",
  ),
  "manual selected-source packet must render the summary omission placeholder",
);
assert.equal(
  selectedSourceManualPacket.packet_text.includes(manualSourceNode.summary),
  false,
  "manual selected-source packet must not render selected source node summary",
);
assertSelectedSourceLeakRegression({
  packetText: selectedSourceManualPacket.packet_text,
  preview: manualPreview,
  rawInput: rawManualInput,
  selectedSourceSummary: manualSourceNode.summary,
});

const manualPacketNodeId =
  manualPreview.constellation.nodes.find((node) => node.type === "packet")?.id ??
  manualPreview.constellation.nodes.at(-1)?.id;
assert(manualPacketNodeId, "manual preview should have a selectable packet node");
const selectedManualBrief = buildPerspectiveAgentBrief({
  preview: manualPreview,
  selected_node_id: manualPacketNodeId,
  scope_mode: "selected_node",
  scope_label: "Selected node",
});
assert.equal(selectedManualBrief.scope.mode, "selected_node");
assert.equal(selectedManualBrief.scope.label, "Selected node");
assert(selectedManualBrief.ingress_context);
const selectedManualPacket = buildPerspectiveAgentBriefHandoffPacket({
  brief: selectedManualBrief,
  audience: "codex_handoff",
  generated_at: generatedAt,
});
assert(selectedManualPacket.packet_text.includes("Scope: selected_node / Selected node"));
assertManualPacket(selectedManualPacket, manualPreview, rawManualInput);

assertContainsAll(agentBriefBuilderText, [
  "ingress_context?: PerspectiveAgentBriefIngressContextV0",
  "buildPerspectiveAgentBriefIngressContext",
]);
assertContainsAll(localPreviewHelperText, [
  "buildPerspectiveIngestLocalPreviewReadResponse",
  "buildPerspectiveManualPastedTextIngressAdmission",
]);
assertContainsAll(agentBriefReadHelperText, [
  "source === \"sample:chatgpt\"",
  "source === \"sample:codex\"",
  "source must be sample:chatgpt or sample:codex",
]);
assert.equal(agentBriefRouteText.includes("manual:pasted_text"), false);
assert.equal(agentBriefRouteText.includes("export async function POST"), false);
assert.equal(agentBriefRouteText.includes("export function POST"), false);

assert.equal(
  /\bperspective_agent_brief_handoff_packet\b/i.test(cockpitText),
  false,
  "Cockpit must not expose Agent Brief handoff packet in product DOM",
);
assert.equal(
  /\bingress_context\b/i.test(cockpitText),
  false,
  "Cockpit must not expose Agent Brief JSON in product DOM",
);
assert.equal(
  /\brulecraft\b/i.test(cockpitText),
  false,
  "Rulecraft must remain unexposed in product-facing Cockpit UI",
);
assert.equal(samplePreview.constellation.nodes.length, 7);
assert.equal(samplePreview.constellation.edges.length, 8);
assert.equal(samplePreview.unresolved_tensions.length, 2);
assertChangedFileBoundary();
assertNoForbiddenRuntimePlumbing();

console.log("PASS smoke:perspective-manual-agent-brief-handoff-dogfood");

function assertManualPacket(packet, preview, rawInput) {
  assert.equal(
    packet.packet_version,
    "perspective_agent_brief_handoff_packet.v0.1",
  );
  assert.equal(packet.generated_at, generatedAt);
  assert(packet.title.length > 0);
  assertSectionOrder(packet.packet_text);
  assertContainsAll(packet.packet_text, [
    "Purpose",
    "Selected Material",
    "Spatial Context",
    "Temporal Context",
    "Ingress Context",
    "Tensions",
    "Next Actions",
    "Handoff Constraints",
    "Authority",
    "Exclusions",
    "manual_pasted_text",
    "user_provided_local",
    "episode_candidate",
    "accepted_for_preview",
    "preview ready",
    "local/read-only",
    "Summary: omitted for manual ingress packet.",
    "No merge/deploy/publish authority.",
    "No persistence",
    "No graph DB",
  ]);
  if (packet.audience === "codex_handoff") {
    assertContainsAll(packet.packet_text, [
      "Codex may code, test, and open a PR only when the surrounding prompt explicitly scopes that task.",
      "Packet does not grant Codex execution authority by itself.",
      "No GitHub mutation outside explicitly scoped PR creation.",
      "ChatGPT reviews the PR.",
      "User decides whether to merge.",
    ]);
  }
  assert.equal(
    packet.packet_text.includes("- Do not execute Codex."),
    false,
    "manual handoff packet must not include the ambiguous standalone Codex execution ban",
  );
  assert.deepEqual(Object.keys(packet.sections), [
    "purpose",
    "selected_material",
    "spatial_context",
    "temporal_context",
    "ingress_context",
    "tensions",
    "next_actions",
    "handoff_constraints",
    "authority",
  ]);
  assert(packet.sections.ingress_context.some((line) => line.includes("manual_pasted_text")));
  assert(packet.exclusions.includes("raw pasted text omitted"));
  assert(packet.exclusions.includes("raw ingress_admission JSON omitted"));
  assert(packet.exclusions.includes("raw Agent Brief JSON omitted"));
  assert(packet.exclusions.includes("candidate/source/pointer/actor/consent values omitted"));
  assert(packet.exclusions.includes("bounded summary omitted from ingress_context"));
  assert(packet.exclusions.includes("packet text does not grant authority"));
  assertNoForbiddenPacketText(packet.packet_text, preview, rawInput);
}

function assertNoForbiddenPacketText(packetText, preview, rawInput) {
  assert.equal(
    packetText.includes(rawInput),
    false,
    "packet must not include raw manual input verbatim",
  );
  const ingressAdmission = preview.ingress_admission;
  const forbiddenValues = [
    ingressAdmission.candidate.candidate_id,
    ingressAdmission.candidate.source_ref,
    ingressAdmission.candidate.bounded_summary,
    ...ingressAdmission.candidate.pointer_refs,
    ...ingressAdmission.candidate.actor_refs,
    "manual_pasted_text:user_submitted",
  ].filter(Boolean);

  for (const forbiddenValue of forbiddenValues) {
    assert.equal(
      packetText.includes(forbiddenValue),
      false,
      `packet must not include forbidden raw ingress value: ${forbiddenValue}`,
    );
  }

  for (const forbidden of [
    "input_text",
    "\"ingress_admission\"",
    "\"candidate\"",
    "\"candidate_id\"",
    "\"source_ref\"",
    "\"pointer_refs\"",
    "\"actor_refs\"",
    "\"consent_ref\"",
    "\"bounded_summary\"",
    "Perspective Handoff Packet",
    "Graph nodes:",
    "Graph edges:",
    "process.env",
    "GITHUB_TOKEN",
    "OPENAI_API_KEY",
    "api.github.com",
    "api.openai.com",
    "access_token",
    "refresh_token",
    "client_secret",
  ]) {
    assert.equal(
      packetText.includes(forbidden),
      false,
      `packet must not include forbidden marker: ${forbidden}`,
    );
  }
}

function assertSelectedSourceLeakRegression({
  packetText,
  preview,
  rawInput,
  selectedSourceSummary,
}) {
  const ingressAdmission = preview.ingress_admission;
  const forbiddenValues = [
    rawInput,
    selectedSourceSummary,
    ingressAdmission.candidate.bounded_summary,
    ingressAdmission.candidate.candidate_id,
    ingressAdmission.candidate.source_ref,
    ...ingressAdmission.candidate.pointer_refs,
    ...ingressAdmission.candidate.actor_refs,
    "manual_pasted_text:user_submitted",
  ].filter(Boolean);

  for (const forbiddenValue of forbiddenValues) {
    assert.equal(
      packetText.includes(forbiddenValue),
      false,
      `selected-source manual packet must not include leaked value: ${forbiddenValue}`,
    );
  }

  assert.equal(packetText.includes("input_text"), false);
}

function assertSectionOrder(packetText) {
  const headings = [
    "## Purpose",
    "## Selected Material",
    "## Spatial Context",
    "## Temporal Context",
    "## Ingress Context",
    "## Tensions",
    "## Next Actions",
    "## Handoff Constraints",
    "## Authority",
    "## Exclusions",
  ];
  let previousIndex = -1;
  for (const heading of headings) {
    const index = packetText.indexOf(heading);
    assert.notEqual(index, -1, `packet must include heading ${heading}`);
    assert(index > previousIndex, `packet heading must be ordered: ${heading}`);
    previousIndex = index;
  }
}

function assertChangedFileBoundary() {
  for (const changedFile of collectChangedFiles()) {
    assert(
      allowedChangedFiles.has(changedFile),
      `Manual Agent Brief handoff dogfood changed an out-of-scope file: ${changedFile}`,
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
      `Manual Agent Brief handoff dogfood must not change forbidden surfaces: ${changedFile}`,
    );
  }
}

function assertNoForbiddenRuntimePlumbing() {
  for (const [file, text] of [
    [builderFile, builderText],
    [agentBriefReadHelperFile, agentBriefReadHelperText],
    [agentBriefRouteFile, agentBriefRouteText],
    [docFile, docText],
  ]) {
    for (const forbidden of [
      "fetch(",
      "api.github.com",
      "api.openai.com",
      "process.env",
      "GITHUB_TOKEN",
      "OPENAI_API_KEY",
      "use server",
      "access_token",
      "refresh_token",
      "client_secret",
    ]) {
      assert.equal(
        text.includes(forbidden),
        false,
        `${file} must not add runtime/provider/GitHub/OpenAI/token plumbing: ${forbidden}`,
      );
    }
  }
}

function assertContainsAll(text, snippets) {
  const normalized = normalize(text);
  for (const snippet of snippets) {
    assert(
      normalized.includes(normalize(snippet)),
      `Expected source to contain: ${snippet}`,
    );
  }
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

function normalize(text) {
  return text.replace(/\s+/g, " ").trim();
}
