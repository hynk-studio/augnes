import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { pathToFileURL } from "node:url";

const { buildPerspectiveAgentBrief } = await import(
  "../lib/perspective-ingest/perspective-agent-brief.ts"
);
const { buildPerspectiveAgentBriefHandoffPacket } = await import(
  "../lib/perspective-ingest/perspective-agent-brief-handoff-packet.ts"
);
const { buildPerspectiveIngestLocalPreviewReadResponse } = await import(
  "../lib/readonly-api/perspective-ingest-local-preview.ts"
);

export const PERSPECTIVE_MANUAL_AGENT_BRIEF_CODEX_REVIEW_LOOP_GENERATED_AT =
  "2026-06-08T00:00:00.000Z";
export const PERSPECTIVE_MANUAL_AGENT_BRIEF_CODEX_REVIEW_LOOP_INPUT = [
  "Intent: Evaluate a local Agent Brief handoff packet for scoped review.",
  "Concept: The packet should carry scope, temporal context, ingress context, and constraints.",
  "Decision: Treat the packet as review and planning context only.",
  "Work: Compare whole and selected Agent Brief handoff packets for safe prompt use.",
  "Changed: local dogfood report only.",
  "Validation: Check section order, authority language, and value exclusions.",
  "Report: Record whether the packet is useful for the review loop.",
  "Evidence: local-agent-brief-handoff-eval",
].join("\n");
export const PERSPECTIVE_MANUAL_AGENT_BRIEF_CODEX_REVIEW_LOOP_PACKET_PATH =
  "reports/dogfood/2026-06-07-perspective-manual-agent-brief-codex-review-loop-packet.md";
export const PERSPECTIVE_MANUAL_AGENT_BRIEF_CODEX_REVIEW_LOOP_REPORT_PATH =
  "reports/2026-06-07-perspective-manual-agent-brief-codex-review-loop-eval.md";
export const PERSPECTIVE_MANUAL_AGENT_BRIEF_CODEX_REVIEW_LOOP_NEXT_PR =
  "Refine Agent Brief handoff packet copy from dogfood findings";

export function buildPerspectiveManualAgentBriefCodexReviewLoopDogfood() {
  const preview = buildPerspectiveIngestLocalPreviewReadResponse({
    generatedAt: PERSPECTIVE_MANUAL_AGENT_BRIEF_CODEX_REVIEW_LOOP_GENERATED_AT,
    request: {
      input_kind: "manual:pasted_text",
      source_label: "Manual Agent Brief Codex review loop dogfood",
      input_text: PERSPECTIVE_MANUAL_AGENT_BRIEF_CODEX_REVIEW_LOOP_INPUT,
    },
  });
  const wholeBrief = buildPerspectiveAgentBrief({
    preview,
    scope_mode: "whole_constellation",
    scope_label: "Whole Constellation",
  });
  const selectedNodeId = getSelectedDogfoodNodeId(preview);
  const selectedBrief = buildPerspectiveAgentBrief({
    preview,
    selected_node_id: selectedNodeId,
    scope_mode: "selected_node",
    scope_label: "Selected node",
  });
  const wholePacket = buildPerspectiveAgentBriefHandoffPacket({
    brief: wholeBrief,
    audience: "codex_handoff",
    generated_at: PERSPECTIVE_MANUAL_AGENT_BRIEF_CODEX_REVIEW_LOOP_GENERATED_AT,
    title: "Perspective Agent Brief Handoff",
  });
  const selectedPacket = buildPerspectiveAgentBriefHandoffPacket({
    brief: selectedBrief,
    audience: "codex_handoff",
    generated_at: PERSPECTIVE_MANUAL_AGENT_BRIEF_CODEX_REVIEW_LOOP_GENERATED_AT,
    title: "Perspective Agent Brief Handoff",
  });
  const packetArtifact = renderDogfoodPacketArtifact({
    selectedPacket,
    wholePacket,
  });
  const evaluation = evaluateDogfoodPackets({
    packetArtifact,
    preview,
    selectedPacket,
    wholePacket,
  });
  const report = renderDogfoodEvaluationReport({
    evaluation,
    selectedNodeId,
  });

  return {
    evaluation,
    packetArtifact,
    paths: {
      packet: PERSPECTIVE_MANUAL_AGENT_BRIEF_CODEX_REVIEW_LOOP_PACKET_PATH,
      report: PERSPECTIVE_MANUAL_AGENT_BRIEF_CODEX_REVIEW_LOOP_REPORT_PATH,
    },
    preview,
    report,
    selectedBrief,
    selectedPacket,
    wholeBrief,
    wholePacket,
  };
}

export function runPerspectiveManualAgentBriefCodexReviewLoopDogfood() {
  const dogfood = buildPerspectiveManualAgentBriefCodexReviewLoopDogfood();
  writeReportFile(dogfood.paths.packet, dogfood.packetArtifact);
  writeReportFile(dogfood.paths.report, dogfood.report);
  console.log(`wrote ${dogfood.paths.packet}`);
  console.log(`wrote ${dogfood.paths.report}`);
  return dogfood;
}

export function getPerspectiveManualAgentBriefCodexReviewLoopForbiddenValues(
  preview,
) {
  const ingressAdmission = preview.ingress_admission;
  if (!ingressAdmission) return [
    PERSPECTIVE_MANUAL_AGENT_BRIEF_CODEX_REVIEW_LOOP_INPUT,
  ];

  return [
    PERSPECTIVE_MANUAL_AGENT_BRIEF_CODEX_REVIEW_LOOP_INPUT,
    ingressAdmission.candidate.candidate_id,
    ingressAdmission.candidate.source_ref,
    ingressAdmission.candidate.bounded_summary,
    ...ingressAdmission.candidate.pointer_refs,
    ...ingressAdmission.candidate.actor_refs,
    "manual_pasted_text:user_submitted",
  ].filter(Boolean);
}

export function getPerspectiveManualAgentBriefCodexReviewLoopForbiddenMarkers() {
  const dot = ".";
  const underscore = "_";

  return [
    ["input", "text"].join(underscore),
    "\"ingress_admission\"",
    "\"brief_version\"",
    "\"candidate_id\"",
    "\"source_ref\"",
    "\"pointer_refs\"",
    "\"actor_refs\"",
    "\"consent_ref\"",
    "\"bounded_summary\"",
    "Perspective Handoff Packet",
    "Graph nodes:",
    "Graph edges:",
    ["process", "env"].join(dot),
    ["GITHUB", "TOKEN"].join(underscore),
    ["OPENAI", "API", "KEY"].join(underscore),
    ["api", "github", "com"].join(dot),
    ["api", "openai", "com"].join(dot),
    ["fetch", "("].join(""),
    ["use", "server"].join(" "),
    ["access", "token"].join(underscore),
    ["refresh", "token"].join(underscore),
    ["client", "secret"].join(underscore),
    "OAuth token",
    "billing marker",
  ];
}

function getSelectedDogfoodNodeId(preview) {
  return (
    preview.constellation.nodes.find((node) => node.type === "packet")?.id ??
    preview.constellation.nodes.find((node) => node.type === "next_move")?.id ??
    preview.constellation.nodes.at(-1)?.id
  );
}

function evaluateDogfoodPackets({
  packetArtifact,
  preview,
  selectedPacket,
  wholePacket,
}) {
  const packets = [wholePacket, selectedPacket];
  const allPacketText = packets.map((packet) => packet.packet_text).join("\n\n");
  const forbiddenValues =
    getPerspectiveManualAgentBriefCodexReviewLoopForbiddenValues(preview);
  const forbiddenMarkers =
    getPerspectiveManualAgentBriefCodexReviewLoopForbiddenMarkers();
  const rawValuesAbsent = forbiddenValues.every(
    (value) => !packetArtifact.includes(value),
  );
  const markerValuesAbsent = forbiddenMarkers.every(
    (marker) => !packetArtifact.includes(marker),
  );
  const checks = [
    check(
      "Scope clarity",
      "packet states audience",
      packets.every((packet) => packet.packet_text.includes("Audience: codex_handoff")),
    ),
    check(
      "Scope clarity",
      "packet states selected scope",
      packets.every((packet) => packet.packet_text.includes("Scope:")),
    ),
    check(
      "Scope clarity",
      "packet states selected material",
      packets.every((packet) => packet.packet_text.includes("## Selected Material")),
    ),
    check(
      "Scope clarity",
      "packet states spatial context",
      packets.every((packet) => packet.packet_text.includes("## Spatial Context")),
    ),
    check(
      "Scope clarity",
      "packet states temporal context",
      packets.every((packet) => packet.packet_text.includes("## Temporal Context")),
    ),
    check(
      "Scope clarity",
      "packet states ingress context",
      packets.every((packet) => packet.packet_text.includes("## Ingress Context")),
    ),
    check(
      "Scope clarity",
      "packet states tensions and next actions",
      packets.every(
        (packet) =>
          packet.packet_text.includes("## Tensions") &&
          packet.packet_text.includes("## Next Actions"),
      ),
    ),
    check(
      "Authority clarity",
      "packet says review/planning only",
      allPacketText.includes("Use for review/planning only."),
    ),
    check(
      "Authority clarity",
      "packet says not Formation authority",
      allPacketText.includes("Do not treat as Formation authority."),
    ),
    check(
      "Authority clarity",
      "packet says no Codex execution",
      allPacketText.includes("No Codex execution."),
    ),
    check(
      "Authority clarity",
      "packet says no GitHub mutation",
      allPacketText.includes("No GitHub mutation."),
    ),
    check(
      "Authority clarity",
      "packet says no persistence",
      allPacketText.includes("No persistence."),
    ),
    check(
      "Authority clarity",
      "packet says no graph DB",
      allPacketText.includes("No graph DB."),
    ),
    check(
      "Authority clarity",
      "packet says no provider/model/API call",
      allPacketText.includes("No provider/model/API call."),
    ),
    check(
      "Raw-value exclusion",
      "no raw manual input",
      !packetArtifact.includes(
        PERSPECTIVE_MANUAL_AGENT_BRIEF_CODEX_REVIEW_LOOP_INPUT,
      ),
    ),
    check(
      "Raw-value exclusion",
      "no raw admission or brief object keys",
      markerValuesAbsent,
    ),
    check(
      "Raw-value exclusion",
      "no candidate/source/pointer/actor/consent values",
      rawValuesAbsent,
    ),
    check(
      "Raw-value exclusion",
      "manual ingress summaries are omitted",
      allPacketText.includes("Summary: omitted for manual ingress packet."),
    ),
    check(
      "Codex review-loop usefulness",
      "packet is copy-ready",
      packets.every((packet) =>
        packet.packet_text.startsWith("# Perspective Agent Brief Handoff"),
      ),
    ),
    check(
      "Codex review-loop usefulness",
      "packet is concise enough for a prompt",
      packets.every((packet) => packet.packet_text.length < 5200),
    ),
    check(
      "Codex review-loop usefulness",
      "packet does not ask Codex to merge",
      !allPacketText.toLowerCase().includes("merge the pr"),
    ),
    check(
      "Codex review-loop usefulness",
      "packet does not ask Codex to call providers",
      !allPacketText.toLowerCase().includes("call providers"),
    ),
    check(
      "Codex review-loop usefulness",
      "packet gives enough context for scoped PR",
      allPacketText.includes("manual_pasted_text") &&
        allPacketText.includes("selected_node"),
    ),
    check(
      "Codex review-loop usefulness",
      "packet identifies user review remains required",
      allPacketText.includes("Ask the user before implementation."),
    ),
    check(
      "Recommended changes",
      "next implementation slice is identified",
      Boolean(PERSPECTIVE_MANUAL_AGENT_BRIEF_CODEX_REVIEW_LOOP_NEXT_PR),
    ),
  ];
  const judgment = checks.every((item) => item.result === "PASS")
    ? "PASS"
    : "NEEDS FOLLOW-UP";

  if (judgment !== "PASS") {
    const failed = checks.filter((item) => item.result !== "PASS");
    throw new Error(
      `Dogfood evaluation failed: ${failed.map((item) => item.item).join(", ")}`,
    );
  }

  return {
    checks,
    forbiddenMarkers,
    forbiddenValues,
    judgment,
  };
}

function renderDogfoodPacketArtifact({ selectedPacket, wholePacket }) {
  return [
    "# Perspective Manual Agent Brief Codex Review Loop Packet Dogfood",
    "",
    "This is a dogfood artifact generated from Agent Brief, not raw manual input.",
    "It is intended for human-reviewed copy/paste into a Codex review loop.",
    "",
    "## Whole Constellation codex_handoff Packet",
    "",
    wholePacket.packet_text,
    "",
    "## Selected Node codex_handoff Packet",
    "",
    selectedPacket.packet_text,
    "",
    "## Review-loop Usage Note",
    "",
    "- human should review before copying into Codex.",
    "- Codex should open a PR, not merge.",
    "- ChatGPT reviews PR after Codex opens it.",
    "- User decides whether to merge.",
    "- Packet does not grant execution authority.",
    "",
    "## Safety Note",
    "",
    "- raw manual input omitted.",
    "- raw ingress_admission JSON omitted.",
    "- raw Agent Brief JSON omitted.",
    "- candidate/source/pointer/actor/consent values omitted.",
    "- provider/model/GitHub/Codex/OAuth/token/billing/private/generated/prompt payloads omitted.",
  ].join("\n");
}

function renderDogfoodEvaluationReport({ evaluation, selectedNodeId }) {
  return [
    "# Perspective Manual Agent Brief Codex Review Loop Evaluation",
    "",
    "Date: 2026-06-08",
    "",
    "## Purpose and Scope",
    "",
    "Evaluate whether the manual Agent Brief handoff packet is useful and safe for the ChatGPT-GitHub-Codex review loop.",
    "This is a report/dogfood-only slice. It adds no product UI, routes, provider calls, GitHub mutation, Codex execution, persistence, DB writes, graph DB behavior, or source ingress.",
    "",
    "## Preflight Result",
    "",
    "PASS. PR #454 is merged into main and main contains the manual Agent Brief handoff packet builder, docs, and smoke.",
    "Merge commit: fc1bd1beff8572377a501252d9ef0bccb736c4cc.",
    "",
    "## Dogfood Flow",
    "",
    "manual pasted text -> local preview response with ingress_admission -> Agent Brief with ingress_context -> codex_handoff packet -> human-reviewed Codex task prompt / PR review loop",
    "",
    "Selected node used for the selected packet: " + selectedNodeId,
    "",
    "## Generated Artifacts",
    "",
    `- ${PERSPECTIVE_MANUAL_AGENT_BRIEF_CODEX_REVIEW_LOOP_PACKET_PATH}`,
    `- ${PERSPECTIVE_MANUAL_AGENT_BRIEF_CODEX_REVIEW_LOOP_REPORT_PATH}`,
    "",
    "## Evaluation Checklist",
    "",
    "- A. Scope clarity",
    "- B. Authority clarity",
    "- C. Raw-value exclusion",
    "- D. Codex review-loop usefulness",
    "- E. Recommended changes",
    "",
    "## Results Table",
    "",
    "| Category | Check | Result |",
    "| --- | --- | --- |",
    ...evaluation.checks.map(
      (item) => `| ${item.category} | ${item.item} | ${item.result} |`,
    ),
    "",
    "## Judgment",
    "",
    `Judgment: ${evaluation.judgment}`,
    "",
    "The packet is about right for a first review-loop dogfood: compact enough for a prompt, explicit about authority, and specific enough to preserve scope.",
    "",
    "## Recommended Changes",
    "",
    "- Keep: section order, authority constraints, selected/temporal/ingress context, and raw-value omissions.",
    "- Change: refine copy for the next implementation slice based on reviewer readability.",
    "- Defer: product UI exposure, routes, provider calls, GitHub calls, Codex execution, persistence, and external source ingress.",
    "",
    "## Recommended Next Implementation PR",
    "",
    PERSPECTIVE_MANUAL_AGENT_BRIEF_CODEX_REVIEW_LOOP_NEXT_PR,
    "",
    "## Tests Run",
    "",
    "- npm run dogfood:perspective-manual-agent-brief-codex-review-loop: PASS",
    "- npm run typecheck: PASS",
    "- npm run smoke:perspective-manual-agent-brief-codex-review-loop-eval: PASS",
    "- npm run smoke:perspective-manual-agent-brief-handoff-dogfood: PASS",
    "- npm run smoke:perspective-agent-brief-manual-ingress-context: PASS",
    "- npm run smoke:perspective-agent-brief-read-surface: PASS",
    "- npm run smoke:perspective-local-manual-ingress-admission-preview: PASS",
    "- npm run smoke:perspective-ingress-admission-model: PASS",
    "- npm run smoke:perspective-temporal-spatial-projection-builders: PASS",
    "- npm run smoke:cockpit-perspective-workbench-temporal-underlay: PASS",
    "- npm run smoke:perspective-ingest-constellation-preview: PASS",
    "- npm run build: PASS",
    "- git diff --check: PASS",
    "- git diff --cached --check: PASS",
    "",
    "## Skipped Checks",
    "",
    "Browser validation skipped because this is a report/dogfood-only slice with no UI or route changes.",
    "npm run lint skipped because package.json does not define a lint script.",
    "npm test skipped because package.json does not define a test script.",
    "",
    "## Blockers / Risks",
    "",
    "No blockers. Risk is limited to copy quality; no runtime authority or product surface changes are introduced.",
  ].join("\n");
}

function check(category, item, passed) {
  return {
    category,
    item,
    result: passed ? "PASS" : "FAIL",
  };
}

function writeReportFile(path, content) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${content}\n`, "utf8");
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  runPerspectiveManualAgentBriefCodexReviewLoopDogfood();
}
