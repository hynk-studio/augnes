import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

const packageFile = "package.json";
const agentBriefBuilderFile =
  "lib/perspective-ingest/perspective-agent-brief.ts";
const agentBriefReadHelperFile = "lib/readonly-api/perspective-agent-brief.ts";
const agentBriefRouteFile =
  "app/api/augnes/read/perspective-agent-brief/route.ts";
const localPreviewHelperFile =
  "lib/readonly-api/perspective-ingest-local-preview.ts";
const localPreviewRouteFile =
  "app/api/augnes/read/perspective-ingest-local-preview/route.ts";
const docFile =
  "docs/PERSPECTIVE_AGENT_BRIEF_MANUAL_INGRESS_CONTEXT_V0_1.md";
const smokeFile =
  "scripts/smoke-perspective-agent-brief-manual-ingress-context.mjs";
const reportFile =
  "reports/2026-06-07-perspective-agent-brief-manual-ingress-context.md";
const readSurfaceSmokeFile =
  "scripts/smoke-perspective-agent-brief-read-surface.mjs";
const localManualSmokeFile =
  "scripts/smoke-perspective-local-manual-ingress-admission-preview.mjs";
const observatorySummarySmokeFile =
  "scripts/smoke-cockpit-perspective-ingress-admission-observatory-summary.mjs";
const ingressModelSmokeFile =
  "scripts/smoke-perspective-ingress-admission-model.mjs";
const projectionBuildersSmokeFile =
  "scripts/smoke-perspective-temporal-spatial-projection-builders.mjs";
const workbenchSmokeFile =
  "scripts/smoke-cockpit-perspective-workbench-temporal-underlay.mjs";
const handoffDogfoodBuilderFile =
  "lib/perspective-ingest/perspective-agent-brief-handoff-packet.ts";
const handoffDogfoodDocFile =
  "docs/PERSPECTIVE_MANUAL_AGENT_BRIEF_HANDOFF_DOGFOOD_V0_1.md";
const handoffDogfoodSmokeFile =
  "scripts/smoke-perspective-manual-agent-brief-handoff-dogfood.mjs";
const handoffDogfoodReportFile =
  "reports/2026-06-07-perspective-manual-agent-brief-handoff-dogfood.md";
const cockpitFile = "components/augnes-cockpit.tsx";

const packageJson = JSON.parse(readFileSync(packageFile, "utf8"));
const agentBriefBuilderText = readFileSync(agentBriefBuilderFile, "utf8");
const agentBriefReadHelperText = readFileSync(agentBriefReadHelperFile, "utf8");
const agentBriefRouteText = readFileSync(agentBriefRouteFile, "utf8");
const localPreviewHelperText = readFileSync(localPreviewHelperFile, "utf8");
const localPreviewRouteText = readFileSync(localPreviewRouteFile, "utf8");
const docText = readFileSync(docFile, "utf8");
const cockpitText = readFileSync(cockpitFile, "utf8");

const { buildPerspectiveAgentBrief, buildPerspectiveAgentBriefIngressContext } =
  await import("../lib/perspective-ingest/perspective-agent-brief.ts");
const {
  buildPerspectiveAgentBriefReadResponse,
  buildPerspectiveAgentBriefSourcePreview,
  validatePerspectiveAgentBriefReadRequest,
} = await import("../lib/readonly-api/perspective-agent-brief.ts");
const { buildPerspectiveIngestLocalPreviewReadResponse } = await import(
  "../lib/readonly-api/perspective-ingest-local-preview.ts"
);

const allowedChangedFiles = new Set([
  packageFile,
  agentBriefBuilderFile,
  docFile,
  smokeFile,
  reportFile,
  readSurfaceSmokeFile,
  localManualSmokeFile,
  observatorySummarySmokeFile,
  ingressModelSmokeFile,
  projectionBuildersSmokeFile,
  workbenchSmokeFile,
  handoffDogfoodBuilderFile,
  handoffDogfoodDocFile,
  handoffDogfoodSmokeFile,
  handoffDogfoodReportFile,
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
  "scripts/dogfood-perspective-reviewed-codex-template-mock-pr-task.mjs",
  "scripts/smoke-perspective-reviewed-codex-template-mock-pr-eval.mjs",
  "docs/PERSPECTIVE_REVIEWED_CODEX_TEMPLATE_MOCK_PR_EVAL_V0_1.md",
  "reports/2026-06-07-perspective-reviewed-codex-template-mock-pr-eval.md",
  "reports/dogfood/2026-06-07-perspective-reviewed-codex-template-mock-pr-task.md",
  "scripts/smoke-perspective-reviewed-codex-template-copy-refine.mjs",
  "docs/PERSPECTIVE_REVIEWED_CODEX_TEMPLATE_COPY_REFINE_V0_1.md",
  "reports/2026-06-07-perspective-reviewed-codex-template-copy-refine.md",
  "docs/PERSPECTIVE_REVIEWED_CODEX_TEMPLATE_FIRST_REAL_DOCS_PR_V0_1.md",
  "reports/2026-06-07-perspective-reviewed-codex-template-first-real-docs-pr.md",
  "scripts/smoke-perspective-reviewed-codex-template-first-real-docs-pr.mjs",
  "docs/PERSPECTIVE_REVIEWED_CODEX_TEMPLATE_PROMOTION_PATH_V0_1.md",
  "reports/2026-06-07-perspective-reviewed-codex-template-promotion-path.md",
  "scripts/smoke-perspective-reviewed-codex-template-promotion-path.mjs",
  "docs/PERSPECTIVE_REVIEWED_CODEX_TEMPLATE_DOCS_ONLY_MAINTENANCE_CHECKLIST_V0_1.md",
  "reports/2026-06-07-perspective-reviewed-codex-template-second-docs-maintenance.md",
  "scripts/smoke-perspective-reviewed-codex-template-second-docs-maintenance.mjs",
]);

assert.equal(
  packageJson.scripts["smoke:perspective-agent-brief-manual-ingress-context"],
  "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json scripts/smoke-perspective-agent-brief-manual-ingress-context.mjs",
  "package.json must register smoke:perspective-agent-brief-manual-ingress-context",
);

for (const file of [
  agentBriefBuilderFile,
  agentBriefReadHelperFile,
  agentBriefRouteFile,
  localPreviewHelperFile,
  localPreviewRouteFile,
  docFile,
  smokeFile,
]) {
  assert.equal(existsSync(file), true, `${file} must exist`);
}

assertContainsAll(docText, [
  "# Perspective Agent Brief Manual Ingress Context v0.1",
  "extends the Perspective Agent Brief with optional `ingress_context`",
  "preview already has `ingress_admission`",
  "follows PR #451",
  "PR #452",
  "Human Workbench remains the compact human UI",
  "Observatory details remain the human-readable details surface",
  "Agent Brief remains a structured read surface",
  "source=sample:chatgpt",
  "source=sample:codex",
  "omits `ingress_context`",
  "does not add `source=manual:pasted_text` support",
  "does not add a POST Agent Brief route",
  "raw pasted text",
  "raw `ingress_admission` JSON",
  "candidate id value",
  "source ref value",
  "pointer refs values",
  "actor refs values",
  "consent ref",
  "bounded summary",
  "packet text",
  "FormationReceipt body",
  "provider/model/API data",
  "GitHub data or mutation",
  "Codex execution data",
  "OAuth/token/billing data",
  "Agent consumption remains separate from ingress",
  "Ingress remains separate from Formation",
  "Prototype manual Agent Brief handoff packet dogfood",
]);

assertContainsAll(agentBriefBuilderText, [
  "ingress_context?: PerspectiveAgentBriefIngressContextV0",
  "context_version: \"perspective_agent_brief_ingress_context.v0.1\"",
  "mode: \"local_read_only_ingress_candidate\"",
  "buildPerspectiveAgentBriefIngressContext",
  "preview.ingress_admission",
  "pointer_count: ingressAdmission.candidate.pointer_refs.length",
  "source_ref_available: Boolean(ingressAdmission.candidate.source_ref)",
  "candidate_id_available: Boolean(ingressAdmission.candidate.candidate_id)",
  "reason_count: ingressAdmission.readiness.reasons.length",
]);

for (const forbidden of [
  "candidate_id: ingressAdmission.candidate.candidate_id",
  "source_ref: ingressAdmission.candidate.source_ref",
  "pointer_refs: ingressAdmission.candidate.pointer_refs",
  "actor_refs: ingressAdmission.candidate.actor_refs",
  "bounded_summary: ingressAdmission.candidate.bounded_summary",
  "consent_ref",
]) {
  assert.equal(
    agentBriefBuilderText.includes(forbidden),
    false,
    `${agentBriefBuilderFile} must not expose raw ingress context value: ${forbidden}`,
  );
}

const chatGptPreview = buildPerspectiveAgentBriefSourcePreview({
  source: "sample:chatgpt",
});
const codexPreview = buildPerspectiveAgentBriefSourcePreview({
  source: "sample:codex",
});
const chatGptBrief = buildPerspectiveAgentBrief({ preview: chatGptPreview });
const codexBrief = buildPerspectiveAgentBrief({ preview: codexPreview });
assert.equal(
  Object.hasOwn(chatGptBrief, "ingress_context"),
  false,
  "sample:chatgpt Agent Brief must omit ingress_context",
);
assert.equal(
  Object.hasOwn(codexBrief, "ingress_context"),
  false,
  "sample:codex Agent Brief must omit ingress_context",
);
assert.equal(
  buildPerspectiveAgentBriefIngressContext(chatGptPreview),
  null,
  "sample previews without ingress_admission must not produce ingress context",
);

const chatGptRouteBrief = buildPerspectiveAgentBriefReadResponse({
  source: "sample:chatgpt",
  generatedAt: "2026-06-08T00:00:00.000Z",
});
const codexRouteBrief = buildPerspectiveAgentBriefReadResponse({
  source: "sample:codex",
  generatedAt: "2026-06-08T00:00:00.000Z",
});
assert.equal(Object.hasOwn(chatGptRouteBrief.brief, "ingress_context"), false);
assert.equal(Object.hasOwn(codexRouteBrief.brief, "ingress_context"), false);

const manualRawInput = [
  "Intent: Let agents read a compact manual ingress context after local preview.",
  "Concept: Agent Brief ingress context is categorical and pointer-count only.",
  "Decision: Keep the sample read route unchanged and do not add manual route input.",
  "Work: Extend only the Agent Brief projection builder.",
  "Changed: lib/perspective-ingest/perspective-agent-brief.ts",
  "Validation: Run manual ingress context smoke without browser dependency.",
  "Report: Record builder validation and route non-change.",
  "Tension: Agents need admission status but not raw pasted text.",
  "Next: Prototype manual Agent Brief handoff packet dogfood.",
  "Evidence: manual-agent-brief-ingress-context-smoke",
  "Detail: " + "compact ingress context only ".repeat(28),
].join("\n");
const manualPreview = buildPerspectiveIngestLocalPreviewReadResponse({
  generatedAt: "2026-06-08T00:00:00.000Z",
  request: {
    input_kind: "manual:pasted_text",
    source_label: "Manual Agent Brief ingress context smoke",
    input_text: manualRawInput,
  },
});
assert(manualPreview.ingress_admission, "manual preview must have ingress_admission");

const manualBrief = buildPerspectiveAgentBrief({
  preview: manualPreview,
  scope_mode: "whole_constellation",
  scope_label: "Whole Constellation",
});
assert(manualBrief.ingress_context, "manual Agent Brief must include ingress_context");
assertManualIngressContext(
  manualBrief.ingress_context,
  manualPreview.ingress_admission,
);

const manualSelectedNodeId =
  manualPreview.constellation.nodes.find((node) => node.type === "work_context")
    ?.id ?? manualPreview.constellation.nodes[0].id;
const selectedManualBrief = buildPerspectiveAgentBrief({
  preview: manualPreview,
  selected_node_id: manualSelectedNodeId,
  scope_mode: "selected_node",
  scope_label: "Selected node",
});
assert.equal(selectedManualBrief.scope.mode, "selected_node");
assert.equal(selectedManualBrief.scope.label, "Selected node");
assert.equal(selectedManualBrief.selected.id, manualSelectedNodeId);
assert(selectedManualBrief.ingress_context);
assertManualIngressContext(
  selectedManualBrief.ingress_context,
  manualPreview.ingress_admission,
);

const serializedManualBrief = JSON.stringify(manualBrief);
assert.equal(
  serializedManualBrief.includes(manualRawInput),
  false,
  "manual Agent Brief must not contain raw manual input verbatim",
);
assertNoForbiddenSerializedBrief(
  "manual Agent Brief",
  manualBrief,
  manualPreview.ingress_admission,
);
assertNoForbiddenSerializedBrief(
  "selected manual Agent Brief",
  selectedManualBrief,
  manualPreview.ingress_admission,
);
assertNoForbiddenIngressContext(
  manualBrief.ingress_context,
  manualPreview.ingress_admission,
);

assert.equal(
  validatePerspectiveAgentBriefReadRequest(makeReadRequest("manual:pasted_text")).ok,
  false,
  "Agent Brief read route must not accept manual:pasted_text",
);
const unsupportedManual = validatePerspectiveAgentBriefReadRequest(
  makeReadRequest("manual:pasted_text"),
);
assert.equal(unsupportedManual.code, "unsupported_source");
assert.equal(unsupportedManual.status, 400);

assertContainsAll(agentBriefReadHelperText, [
  "source === \"sample:chatgpt\"",
  "source === \"sample:codex\"",
  "source must be sample:chatgpt or sample:codex",
]);
assert.equal(
  agentBriefReadHelperText.includes("buildPerspectiveIngestLocalPreviewReadResponse"),
  false,
  "Agent Brief read helper must not import local manual preview input handling",
);
assert.equal(
  agentBriefRouteText.includes("export async function POST") ||
    agentBriefRouteText.includes("export function POST"),
  false,
  "Agent Brief route must not add POST handling",
);
assert.equal(
  agentBriefRouteText.includes("manual:pasted_text"),
  false,
  "Agent Brief route must remain sample-only",
);
assertContainsAll(localPreviewRouteText, [
  "export async function POST",
  "buildPerspectiveIngestLocalPreviewReadResult",
]);
assertContainsAll(localPreviewHelperText, [
  "buildPerspectiveIngestLocalPreviewReadResponse",
  "PerspectiveIngestLocalPastedTextPreviewRequest",
  "buildPerspectiveManualPastedTextIngressAdmission",
]);

assert.equal(
  /\bingress_context\b/i.test(cockpitText),
  false,
  "Cockpit must not expose Agent Brief ingress_context in product DOM",
);
assert.equal(
  /perspective_agent_brief_read|perspective-agent-brief/.test(cockpitText),
  false,
  "Cockpit must not include a hidden Agent Brief dump or route hook",
);
assert.equal(
  /\brulecraft\b/i.test(cockpitText),
  false,
  "Rulecraft must remain unexposed in product-facing Cockpit UI",
);

assert.equal(chatGptPreview.constellation.nodes.length, 7);
assert.equal(chatGptPreview.constellation.edges.length, 8);
assert.equal(chatGptPreview.unresolved_tensions.length, 2);
assert.deepEqual(
  chatGptPreview.constellation.nodes.map((node) => [node.id, node.type]),
  [
    ["node.sample_chatgpt.source", "source"],
    ["node.sample_chatgpt.user_intent", "user_intent"],
    ["node.sample_chatgpt.product_concept", "product_concept"],
    ["node.sample_chatgpt.decision", "decision"],
    ["node.sample_chatgpt.unresolved_tension", "unresolved_tension"],
    ["node.sample_chatgpt.next_move", "next_move"],
    ["node.sample_chatgpt.packet", "packet"],
  ],
);

assertChangedFileBoundary();
assertNoForbiddenRuntimePlumbing();

console.log("PASS smoke:perspective-agent-brief-manual-ingress-context");

function assertManualIngressContext(context, ingressAdmission) {
  assert.equal(
    context.context_version,
    "perspective_agent_brief_ingress_context.v0.1",
  );
  assert.equal(context.present, true);
  assert.equal(context.ingress_kind, "manual_pasted_text");
  assert.equal(context.trust_level, "user_provided_local");
  assert.equal(context.admission_state, "episode_candidate");
  assert.equal(context.redaction_state, "not_applicable");
  assert.deepEqual(context.decision, {
    to_state: "accepted_for_preview",
    allowed: true,
  });
  assert.equal(context.readiness.eligible_for_episode_candidate, true);
  assert.equal(context.readiness.eligible_for_preview, true);
  assert.equal(context.readiness.eligible_for_research_archive, false);
  assert.equal(
    context.readiness.reason_count,
    ingressAdmission.readiness.reasons.length,
  );
  assert.deepEqual(context.authority, {
    mode: "local_read_only_ingress_candidate",
    local_only: true,
    read_only: true,
    external_calls_performed: false,
    persistence_performed: false,
    graph_db_write_performed: false,
    proof_evidence_readiness_write_performed: false,
    codex_execution_performed: false,
    github_mutation_performed: false,
    oauth_token_stored: false,
    raw_private_content_stored: false,
  });
  assert.equal(typeof context.refs.pointer_count, "number");
  assert.equal(
    context.refs.pointer_count,
    ingressAdmission.candidate.pointer_refs.length,
  );
  assert.equal(context.refs.source_ref_available, true);
  assert.equal(context.refs.candidate_id_available, true);
}

function assertNoForbiddenIngressContext(context, ingressAdmission) {
  const serialized = JSON.stringify(context);
  const forbiddenValues = [
    ingressAdmission.candidate.candidate_id,
    ingressAdmission.candidate.source_ref,
    ingressAdmission.candidate.bounded_summary,
    ...ingressAdmission.candidate.pointer_refs,
    ...ingressAdmission.candidate.actor_refs,
  ].filter(Boolean);

  for (const forbiddenValue of forbiddenValues) {
    assert.equal(
      serialized.includes(forbiddenValue),
      false,
      `ingress_context must not include raw candidate/source/pointer value: ${forbiddenValue}`,
    );
  }

  for (const forbiddenKey of [
    "\"candidate_id\":",
    "\"source_ref\":",
    "\"pointer_refs\":",
    "\"actor_refs\":",
    "\"consent_ref\":",
    "\"bounded_summary\":",
    "raw pasted text",
    "input_text",
    "Perspective Handoff Packet",
    "Graph nodes:",
    "Graph edges:",
  ]) {
    assert.equal(
      serialized.includes(forbiddenKey),
      false,
      `ingress_context must not include forbidden key/text: ${forbiddenKey}`,
    );
  }
}

function assertNoForbiddenSerializedBrief(label, brief, ingressAdmission) {
  const serialized = JSON.stringify(brief);
  const forbiddenValues = [
    ingressAdmission.candidate.candidate_id,
    ingressAdmission.candidate.source_ref,
    ...ingressAdmission.candidate.pointer_refs,
    ...ingressAdmission.candidate.actor_refs,
  ].filter(Boolean);

  for (const forbiddenValue of forbiddenValues) {
    assert.equal(
      serialized.includes(forbiddenValue),
      false,
      `${label} must not include forbidden ingress value: ${forbiddenValue}`,
    );
  }

  for (const forbidden of [
    "input_text",
    "bounded_summary",
    "pointer_refs",
    "actor_refs",
    "consent_ref",
    "Perspective Handoff Packet",
    "Graph nodes:",
    "Graph edges:",
    "Boundary reminders:",
    "packet_text",
    "packet textarea",
    "process.env",
    "GITHUB_TOKEN",
    "OPENAI_API_KEY",
    "api.github.com",
    "api.openai.com",
    "access_token",
    "refresh_token",
    "client_secret",
    "billing",
    "OAuth token",
  ]) {
    assert.equal(
      serialized.includes(forbidden),
      false,
      `${label} must not include forbidden payload marker: ${forbidden}`,
    );
  }
}

function makeReadRequest(source) {
  const url = new URL(
    "http://127.0.0.1/api/augnes/read/perspective-agent-brief",
  );
  url.searchParams.set("scope", "project:augnes");
  url.searchParams.set("source", source);

  return new Request(url.toString(), {
    method: "GET",
    headers: {
      "x-augnes-local-readonly": "perspective-agent-brief-v0.1",
    },
  });
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

function assertChangedFileBoundary() {
  for (const changedFile of collectChangedFiles()) {
    assert(
      allowedChangedFiles.has(changedFile),
      `Agent Brief manual ingress context changed an out-of-scope file: ${changedFile}`,
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
      `Agent Brief manual ingress context must not change forbidden surfaces: ${changedFile}`,
    );
  }
}

function assertNoForbiddenRuntimePlumbing() {
  for (const [file, text] of [
    [agentBriefBuilderFile, agentBriefBuilderText],
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
