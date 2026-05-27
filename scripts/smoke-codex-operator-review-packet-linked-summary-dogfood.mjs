import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { readFile } from "node:fs/promises";

const dogfoodDocPath = "docs/OPERATOR_REVIEW_PACKET_LINKED_SUMMARY_DOGFOOD_2026_05_26.md";
const helperSourcePath = "apps/augnes_apps/scripts/codex-operator-review-packet.ts";
const smokeSourcePath = "scripts/smoke-codex-operator-review-packet-linked-summary-dogfood.mjs";
const fakeGithubToken = "fake-gh-token-linked-summary-dogfood";
const fakeOpenAiKey = "fake-openai-key-linked-summary-dogfood";
const hiddenMaterialBody = "Hidden linked-summary body/auth/token-like content that must not render.";

const forbiddenOverclaimPhrases = [
  "production-ready",
  "ready_to_execute",
  "execution_ready",
  "evaluates PR quality",
  "detects drift at runtime",
  "repairs context automatically",
  "selects next tasks autonomously",
  "autonomous research agent",
  "benchmark result",
  "quality score",
  "KPI",
  "proof of quality",
  "readiness authority",
];

const samples = [buildSampleA(), buildSampleB()];
const successfulOutputs = [];

for (const sample of samples) {
  const jsonOutput = await runPacket(sample.input, "json");
  const jsonPacket = JSON.parse(jsonOutput.stdout);
  successfulOutputs.push(jsonOutput.stdout);
  assertJsonPacket(jsonPacket, sample);
  assertNoSecretsOrHiddenMaterial(jsonOutput.combined);

  const summaryOutput = await runPacket(sample.input, "summary");
  successfulOutputs.push(summaryOutput.stdout);
  assertSummaryOutput(summaryOutput.stdout, sample);
  assertNoSecretsOrHiddenMaterial(summaryOutput.combined);

  if (sample.id === "sample-a") {
    const bothOutput = await runPacket(sample.input, "both");
    successfulOutputs.push(bothOutput.stdout);
    const bothPacket = parseBothJson(bothOutput.stdout);
    assertJsonPacket(bothPacket, sample);
    assertSummaryOutput(parseBothSummary(bothOutput.stdout), sample);
    assertNoSecretsOrHiddenMaterial(bothOutput.combined);
    assert.ok(bothPacket.warnings.length > 0, "sample-a should warn for missing optional materials");
    assert.equal(bothPacket.blockers.length, 0, "sample-a missing optional materials must not block");
  }
}

const implicitDecisionPacket = JSON.parse((await runPacket(buildImplicitDecisionFixture(), "json")).stdout);
assertNoManualHandoffObservation(implicitDecisionPacket);

await assertInvalidPacket(buildNegatedLinkedFollowUpFixture(), /CODEX_OPERATOR_REVIEW_PACKET_UNRESOLVED_LINK_EVENT/);

const doc = await readFile(dogfoodDocPath, "utf8");
assertRequiredDocSections(doc);
assertNoForbiddenOverclaims(doc, "linked-summary dogfood doc");
for (const output of successfulOutputs) {
  assertNoForbiddenOverclaims(output, "packet output");
}

await assertLocalOnlySource(helperSourcePath, { helper: true });
await assertLocalOnlySource(smokeSourcePath, { helper: false });

console.log("smoke:codex-operator-review-packet-linked-summary-dogfood passed");

function buildSampleA() {
  const reviewEvents = [
    {
      event_id: "pr242-task-opened",
      event_type: "task_opened",
      summary: "Task opened to render linked event IDs in operator packet summaries.",
      result: "opened",
    },
    {
      event_id: "pr242-linked-summary-finding",
      event_type: "dogfood_finding",
      summary: "Dogfood finding: linked IDs were useful but not visible in human-readable summary output.",
      result: "blocking",
    },
    {
      event_id: "pr242-summary-rendering-implementation",
      resolves_event_id: "pr242-linked-summary-finding",
      event_type: "implementation_completed",
      summary: "Implementation resolved the dogfood finding by showing event_id and resolves_event_id in summary timeline rows when present.",
      result: "resolved",
    },
    {
      event_id: "pr242-verification-completed",
      event_type: "verification_completed",
      summary: "Verification completed for JSON shape preservation and summary timeline labels.",
      result: "verified",
    },
    {
      event_id: "pr242-operator-decision",
      event_type: "operator_decision",
      summary: "Operator decision merged with manual local-only follow-up; no posting or actuation.",
      result: "merged_manual_local_only",
    },
  ];

  return {
    id: "sample-a",
    expectedTimeline: reviewEvents.map((event) => event.event_type),
    expectedEventIds: reviewEvents.map((event) => event.event_id),
    followUpEventId: "pr242-summary-rendering-implementation",
    blockingEventId: "pr242-linked-summary-finding",
    expectedSummarySnippets: [
      "dogfood_finding [event_id=pr242-linked-summary-finding]",
      "implementation_completed [event_id=pr242-summary-rendering-implementation resolves_event_id=pr242-linked-summary-finding]",
    ],
    input: {
      task: {
        title: "Render linked event IDs in operator packet summaries",
        intent: "Make linked review-event correction arcs visible in human-readable operator handoff text.",
        scope: "Track B local summary rendering dogfood; no UI, sidecar, posting, schema change, or actuation.",
      },
      pr: {
        number: 242,
        url: "https://github.com/Aurna-code/augnes/pull/242",
        state: "merged",
        head_sha: "2422422422422422422422422422422422422422",
        merge_sha: "242f242f242f242f242f242f242f242f242f242f",
      },
      materials: {
        closeout_pipeline: { helper: "codex:closeout-pipeline", body: hiddenMaterialBody },
        action_plan: { helper: "codex:closeout-action-plan", auth_header: hiddenMaterialBody },
        actuation_gate: null,
        actuation_preview: null,
        github_comment_readiness: { helper: "codex:github-comment-readiness", token: hiddenMaterialBody },
        github_comment_command_preview: null,
      },
      review_events: reviewEvents,
      operator_decision: {
        decision: "merged_manual_local_only_no_actuation",
        reason: "Merged with manual local-only dogfood follow-up; do not post or actuate.",
      },
    },
  };
}

function buildSampleB() {
  const reviewEvents = [
    {
      event_id: "pr240-task-opened",
      event_type: "task_opened",
      summary: "Task opened to add structured review-event links to codex:operator-review-packet.",
      result: "opened",
    },
    {
      event_id: "pr240-implementation-completed",
      event_type: "implementation_completed",
      summary: "Implementation added optional event_id and resolves_event_id fields on review_events.",
      result: "implemented",
    },
    {
      event_id: "pr240-negated-resolution-blocker",
      event_type: "blocking_review_finding",
      summary:
        "Blocking review finding: negated resolution phrases like not fixed and not addressed could pass as resolved.",
      result: "blocking",
    },
    {
      event_id: "pr240-negated-resolution-fix",
      resolves_event_id: "pr240-negated-resolution-blocker",
      event_type: "follow_up_commit",
      summary: "Follow-up resolved the negated-resolution detection gap with explicit negative phrase guards.",
      result: "follow_up_resolved",
    },
    {
      event_id: "pr240-verification-completed",
      event_type: "verification_completed",
      summary: "Verification completed for linked events and negated-resolution fixtures.",
      result: "verified",
    },
    {
      event_id: "pr240-operator-decision",
      event_type: "operator_decision",
      summary: "Operator decision merged with manual local-only follow-up; no posting or actuation.",
      result: "merged_manual_local_only",
    },
  ];

  return {
    id: "sample-b",
    expectedTimeline: reviewEvents.map((event) => event.event_type),
    expectedEventIds: reviewEvents.map((event) => event.event_id),
    followUpEventId: "pr240-negated-resolution-fix",
    blockingEventId: "pr240-negated-resolution-blocker",
    expectedSummarySnippets: [
      "blocking_review_finding [event_id=pr240-negated-resolution-blocker]",
      "follow_up_commit [event_id=pr240-negated-resolution-fix resolves_event_id=pr240-negated-resolution-blocker]",
    ],
    input: {
      task: {
        title: "Add structured review-event links to codex:operator-review-packet",
        intent: "Preserve exact review correction arcs with event_id and resolves_event_id.",
        scope: "Track B local operator packet schema hardening; no UI, sidecar, posting, or actuation.",
      },
      pr: {
        number: 240,
        url: "https://github.com/Aurna-code/augnes/pull/240",
        state: "merged",
        head_sha: "2402402402402402402402402402402402402402",
        merge_sha: "240f240f240f240f240f240f240f240f240f240f",
      },
      materials: fullMaterials(),
      review_events: reviewEvents,
      operator_decision: {
        decision: "merged_manual_local_only_no_actuation",
        reason: "Merged with manual local-only dogfood follow-up; do not post or actuate.",
      },
    },
  };
}

function buildImplicitDecisionFixture() {
  return {
    task: {
      title: "Neutral decision wording fixture",
      intent: "Confirm manual/no-actuation observations require explicit wording.",
      scope: "Local linked-summary dogfood fixture only.",
    },
    pr: {
      number: 242,
      url: "https://github.com/Aurna-code/augnes/pull/242",
      state: "merged",
      head_sha: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      merge_sha: "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
    },
    materials: fullMaterials(),
    review_events: [
      {
        event_id: "neutral-task-opened",
        event_type: "task_opened",
        summary: "Task opened for neutral decision fixture.",
        result: "opened",
      },
    ],
    operator_decision: {
      decision: "defer_review",
      reason: "More review is needed.",
    },
  };
}

function buildNegatedLinkedFollowUpFixture() {
  return {
    task: {
      title: "Reject negated linked follow-up wording",
      intent: "Confirm a linked follow-up with unresolved wording fails.",
      scope: "Local linked-summary dogfood fixture only.",
    },
    pr: {
      number: 240,
      url: "https://github.com/Aurna-code/augnes/pull/240",
      state: "merged",
      head_sha: "cccccccccccccccccccccccccccccccccccccccc",
      merge_sha: "dddddddddddddddddddddddddddddddddddddddd",
    },
    materials: fullMaterials(),
    review_events: [
      {
        event_id: "negated-blocker",
        event_type: "blocking_review_finding",
        summary: "Blocking review finding for unresolved linked follow-up detection.",
        result: "blocking",
      },
      {
        event_id: "negated-fix",
        resolves_event_id: "negated-blocker",
        event_type: "follow_up_commit",
        summary: "Follow-up not fixed; linked event is still failing.",
        result: "updated",
      },
    ],
    operator_decision: {
      decision: "defer_review",
      reason: "More review is needed.",
    },
  };
}

function fullMaterials() {
  return {
    closeout_pipeline: { helper: "codex:closeout-pipeline" },
    action_plan: { helper: "codex:closeout-action-plan" },
    actuation_gate: { helper: "codex:actuation-gate" },
    actuation_preview: { helper: "codex:actuation-preview" },
    github_comment_readiness: { helper: "codex:github-comment-readiness" },
    github_comment_command_preview: { helper: "codex:github-comment-command-preview", body: hiddenMaterialBody },
  };
}

function runPacket(input, outputMode) {
  return new Promise((resolve, reject) => {
    const child = spawn("npm", ["run", "codex:operator-review-packet", "--silent"], {
      cwd: process.cwd(),
      env: {
        ...process.env,
        CODEX_OPERATOR_REVIEW_PACKET_INPUT_JSON: JSON.stringify(input),
        CODEX_OPERATOR_REVIEW_PACKET_OUTPUT: outputMode,
        GITHUB_TOKEN: fakeGithubToken,
        OPENAI_API_KEY: fakeOpenAiKey,
      },
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";
    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk) => {
      stdout += chunk;
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk;
    });
    child.on("close", (status) => {
      const combined = `${stdout}\n${stderr}`;
      try {
        assertNoSecretsOrHiddenMaterial(combined);
      } catch (error) {
        reject(error);
        return;
      }
      if (status !== 0) {
        reject(new Error(`operator review packet failed with ${status}: ${stderr}`));
        return;
      }
      resolve({ stdout, stderr, combined });
    });
  });
}

function assertInvalidPacket(input, expectedPattern) {
  return new Promise((resolve, reject) => {
    const child = spawn("npm", ["run", "codex:operator-review-packet", "--silent"], {
      cwd: process.cwd(),
      env: {
        ...process.env,
        CODEX_OPERATOR_REVIEW_PACKET_INPUT_JSON: JSON.stringify(input),
        CODEX_OPERATOR_REVIEW_PACKET_OUTPUT: "json",
        GITHUB_TOKEN: fakeGithubToken,
        OPENAI_API_KEY: fakeOpenAiKey,
      },
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";
    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk) => {
      stdout += chunk;
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk;
    });
    child.on("close", (status) => {
      const combined = `${stdout}\n${stderr}`;
      try {
        assertNoSecretsOrHiddenMaterial(combined);
        assert.notEqual(status, 0, "expected operator review packet to fail");
        assert.match(stderr, expectedPattern);
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  });
}

function assertJsonPacket(packet, sample) {
  assert.equal(packet.helper, "codex:operator-review-packet", sample.id);
  assert.equal(packet.dry_run_only, true, sample.id);
  assert.equal(packet.would_execute, false, sample.id);
  assert.deepEqual(
    packet.timeline.map((event) => event.event_type),
    sample.expectedTimeline,
    sample.id,
  );
  assert.deepEqual(
    packet.timeline.map((event) => event.event_id),
    sample.expectedEventIds,
    sample.id,
  );
  assert.equal(
    packet.timeline.find((event) => event.event_id === sample.followUpEventId)?.resolves_event_id,
    sample.blockingEventId,
    sample.id,
  );
  assertStructuredResolutionObservation(packet, sample.followUpEventId, sample.blockingEventId);
  assertManualOrLocalOnlyObservation(packet);
}

function assertSummaryOutput(summary, sample) {
  for (const snippet of sample.expectedSummarySnippets) {
    assert.match(summary, new RegExp(escapeRegExp(snippet)), `${sample.id}: ${snippet}`);
  }

  assert.doesNotMatch(summary, /event_id=undefined/);
  assert.doesNotMatch(summary, /resolves_event_id=undefined/);
  assert.doesNotMatch(summary, /event_id=null/);
  assert.doesNotMatch(summary, /resolves_event_id=null/);
  assert.match(
    summary,
    new RegExp(
      escapeRegExp(`Review event ${sample.followUpEventId} resolved blocking event ${sample.blockingEventId}`),
    ),
    sample.id,
  );
  assert.match(summary, /manual handoff\/no actuation/);
}

function parseBothJson(stdout) {
  const begin = "BEGIN_AUGNES_CODEX_OPERATOR_REVIEW_PACKET_JSON";
  const end = "END_AUGNES_CODEX_OPERATOR_REVIEW_PACKET_JSON";
  const beginIndex = stdout.indexOf(begin);
  const endIndex = stdout.indexOf(end);
  assert.notEqual(beginIndex, -1, "missing JSON begin marker");
  assert.notEqual(endIndex, -1, "missing JSON end marker");
  assert.ok(endIndex > beginIndex, "invalid JSON marker order");
  return JSON.parse(stdout.slice(beginIndex + begin.length, endIndex).trim());
}

function parseBothSummary(stdout) {
  const begin = "BEGIN_AUGNES_CODEX_OPERATOR_REVIEW_PACKET_JSON";
  const beginIndex = stdout.indexOf(begin);
  assert.notEqual(beginIndex, -1, "missing JSON begin marker");
  return stdout.slice(0, beginIndex);
}

function assertStructuredResolutionObservation(packet, followUpEventId, blockingEventId) {
  assert.ok(
    packet.perspective_observations.some((observation) =>
      observation.includes(`Review event ${followUpEventId} resolved blocking event ${blockingEventId}`),
    ),
    `${followUpEventId} -> ${blockingEventId}`,
  );
}

function assertManualOrLocalOnlyObservation(packet) {
  assert.ok(
    packet.perspective_observations.some((observation) =>
      observation.includes("manual handoff/no actuation"),
    ),
    packet.pr_summary.number,
  );
}

function assertNoManualHandoffObservation(packet) {
  assert.doesNotMatch(packet.perspective_observations.join("\n"), /manual handoff\/no actuation/i);
}

function assertNoSecretsOrHiddenMaterial(output) {
  assert.doesNotMatch(output, new RegExp(escapeRegExp(fakeGithubToken)));
  assert.doesNotMatch(output, new RegExp(escapeRegExp(fakeOpenAiKey)));
  assert.doesNotMatch(output, /GITHUB_TOKEN/);
  assert.doesNotMatch(output, /OPENAI_API_KEY/);
  assert.doesNotMatch(output, new RegExp(escapeRegExp(hiddenMaterialBody)));
  assert.doesNotMatch(output, /auth_header/i);
  assert.doesNotMatch(output, /bearer/i);
  assert.doesNotMatch(output, /"token"\s*:/i);
  assert.doesNotMatch(output, /"body"\s*:/i);
}

function assertNoForbiddenOverclaims(text, label) {
  for (const phrase of forbiddenOverclaimPhrases) {
    const pattern =
      phrase === "KPI"
        ? /(^|[^A-Za-z0-9_])KPI([^A-Za-z0-9_]|$)/i
        : new RegExp(escapeRegExp(phrase), "i");
    assert.doesNotMatch(text, pattern, `${label}: ${phrase}`);
  }
}

function assertRequiredDocSections(doc) {
  for (const section of [
    "Summary",
    "Scope boundary",
    "Dogfood samples",
    "Cross-sample findings",
    "Linked-summary usefulness observations",
    "Development feedback",
    "UI/UX implications",
    "Sidecar e_t / perspective research implications",
    "Recommended next decision",
  ]) {
    assert.match(doc, new RegExp(`^## ${escapeRegExp(section)}$`, "m"), section);
  }
}

async function assertLocalOnlySource(filePath, { helper }) {
  const source = await readFile(filePath, "utf8");
  assert.doesNotMatch(source, /\bfetch\s*\(/);
  assert.doesNotMatch(source, /from\s+["']node:http["']/);
  assert.doesNotMatch(source, /from\s+["']node:https["']/);
  assert.doesNotMatch(source, /from\s+["']node:http2["']/);
  assert.doesNotMatch(source, /\bcreateServer\s*\(/);
  assert.doesNotMatch(source, /\blisten\s*\(/);
  assert.doesNotMatch(source, /\bOctokit\b/);
  assert.doesNotMatch(source, /\baxios\b/);
  assert.doesNotMatch(source, /api\.github\.com/);
  assert.doesNotMatch(source, /api\.openai\.com/);
  if (helper) {
    assert.doesNotMatch(source, /process\.env\.GITHUB_TOKEN/);
    assert.doesNotMatch(source, /process\.env\.OPENAI_API_KEY/);
  }
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
