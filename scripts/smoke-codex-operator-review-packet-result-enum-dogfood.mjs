import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { readFile } from "node:fs/promises";

const dogfoodDocPath = "docs/OPERATOR_REVIEW_PACKET_RESULT_ENUM_DOGFOOD_2026_05_27.md";
const helperSourcePath = "apps/augnes_apps/scripts/codex-operator-review-packet.ts";
const smokeSourcePath = "scripts/smoke-codex-operator-review-packet-result-enum-dogfood.mjs";
const fakeGithubToken = "fake-gh-token-result-enum-dogfood";
const fakeOpenAiKey = "fake-openai-key-result-enum-dogfood";
const hiddenMaterialBody = "Hidden result-enum body/auth/token-like content that must not render.";

const beginMarker = "BEGIN_AUGNES_CODEX_OPERATOR_REVIEW_PACKET_JSON";
const endMarker = "END_AUGNES_CODEX_OPERATOR_REVIEW_PACKET_JSON";

const allowedResults = new Set([
  "opened",
  "implemented",
  "blocking",
  "needs_review",
  "follow_up_required",
  "follow_up_resolved",
  "resolved",
  "updated",
  "verified",
  "deferred",
  "local_preflight_only",
  "manual_handoff_no_actuation",
  "merged_local_only",
  "dogfood_next_local_only",
  "approved_actuation",
]);

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

const sampleAJsonOutput = await runPacket(samples[0].input, "json");
const sampleAJsonPacket = JSON.parse(sampleAJsonOutput.stdout);
successfulOutputs.push(sampleAJsonOutput.stdout);
assertJsonPacket(sampleAJsonPacket, samples[0]);
assertMissingOptionalWarnings(sampleAJsonPacket);
assertNoSecretsOrHiddenMaterial(sampleAJsonOutput.combined);

const sampleASummaryOutput = await runPacket(samples[0].input, "summary");
successfulOutputs.push(sampleASummaryOutput.stdout);
assertSummaryOutput(sampleASummaryOutput.stdout, samples[0]);
assertNoSecretsOrHiddenMaterial(sampleASummaryOutput.combined);

const sampleABothOutput = await runPacket(samples[0].input, "both");
successfulOutputs.push(sampleABothOutput.stdout);
assertJsonPacket(parseBothJson(sampleABothOutput.stdout), samples[0]);
assertSummaryOutput(parseBothSummary(sampleABothOutput.stdout), samples[0]);
assertNoSecretsOrHiddenMaterial(sampleABothOutput.combined);

const sampleBJsonOutput = await runPacket(samples[1].input, "json");
const sampleBJsonPacket = JSON.parse(sampleBJsonOutput.stdout);
successfulOutputs.push(sampleBJsonOutput.stdout);
assertJsonPacket(sampleBJsonPacket, samples[1]);
assertNoSecretsOrHiddenMaterial(sampleBJsonOutput.combined);

const sampleBBothOutput = await runPacket(samples[1].input, "both");
successfulOutputs.push(sampleBBothOutput.stdout);
assertJsonPacket(parseBothJson(sampleBBothOutput.stdout), samples[1]);
assertSummaryOutput(parseBothSummary(sampleBBothOutput.stdout), samples[1]);
assertNoSecretsOrHiddenMaterial(sampleBBothOutput.combined);

const implicitDecisionPacket = JSON.parse((await runPacket(buildImplicitDecisionFixture(), "json")).stdout);
assertNoManualHandoffObservation(implicitDecisionPacket);

await assertInvalidPacket(buildLegacyResultFixture(), /CODEX_OPERATOR_REVIEW_PACKET_INVALID_REVIEW_EVENT_RESULT/);
await assertInvalidPacket(buildUpdatedResolvedProseFixture(), /CODEX_OPERATOR_REVIEW_PACKET_UNRESOLVED_LINK_EVENT/);
await assertInvalidPacket(buildNonBlockingTargetFixture(), /CODEX_OPERATOR_REVIEW_PACKET_NON_BLOCKING_RESOLUTION_TARGET/);

const doc = await readFile(dogfoodDocPath, "utf8");
assertRequiredDocSections(doc);
assertNoForbiddenOverclaims(doc, "result-enum dogfood doc");
for (const output of successfulOutputs) {
  assertNoForbiddenOverclaims(output, "packet output");
}

await assertLocalOnlySource(helperSourcePath, { helper: true });
await assertLocalOnlySource(smokeSourcePath, { helper: false });

console.log("smoke:codex-operator-review-packet-result-enum-dogfood passed");

function buildSampleA() {
  const reviewEvents = [
    {
      event_id: "pr245-task-opened",
      event_type: "task_opened",
      summary: "Task opened to add controlled review event result values to operator review packets.",
      result: "opened",
    },
    {
      event_id: "pr245-result-enum-dogfood-finding",
      event_type: "dogfood_finding",
      summary: "Resolution links provide structure, but free-form review_events.result remained ambiguous.",
      result: "blocking",
    },
    {
      event_id: "pr245-result-enum-implementation",
      resolves_event_id: "pr245-result-enum-dogfood-finding",
      event_type: "implementation_completed",
      summary: "Result values are now validated against the controlled enum.",
      result: "follow_up_resolved",
    },
    {
      event_id: "pr245-verification-completed",
      event_type: "verification_completed",
      summary: "Verification completed for controlled result validation and boundary smokes.",
      result: "verified",
    },
    {
      event_id: "pr245-operator-decision",
      event_type: "operator_decision",
      summary: "Operator decision preserves manual handoff and no actuation.",
      result: "manual_handoff_no_actuation",
    },
  ];

  return {
    id: "sample-a",
    expectedTimeline: reviewEvents.map((event) => event.event_type),
    expectedEventIds: reviewEvents.map((event) => event.event_id),
    expectedResults: reviewEvents.map((event) => event.result),
    followUpEventId: "pr245-result-enum-implementation",
    blockingEventId: "pr245-result-enum-dogfood-finding",
    expectedResolvingResult: "follow_up_resolved",
    input: {
      task: {
        title: "Add controlled review event result values to operator review packets",
        intent: "Reduce ambiguity in operator packet review events by validating result against a controlled enum.",
        scope:
          "Track B local input-schema tightening; no UI, sidecar, posting, runtime, provider, durable perspective state, or actuation.",
      },
      pr: {
        number: 245,
        url: "https://github.com/Aurna-code/augnes/pull/245",
        state: "merged",
        head_sha: "2452452452452452452452452452452452452452",
        merge_sha: "245f245f245f245f245f245f245f245f245f245f",
      },
      materials: {
        closeout_pipeline: null,
        action_plan: null,
        actuation_gate: null,
        actuation_preview: null,
        github_comment_readiness: null,
        github_comment_command_preview: null,
      },
      review_events: reviewEvents,
      operator_decision: {
        decision: "manual_handoff_no_actuation",
        reason: "Local schema dogfood only; do not post, actuate, change UI, or call providers.",
      },
    },
  };
}

function buildSampleB() {
  const reviewEvents = [
    {
      event_id: "pr244-task-opened",
      event_type: "task_opened",
      summary: "Task opened to add structured resolution links output to operator review packets.",
      result: "opened",
    },
    {
      event_id: "pr244-resolution-links-finding",
      event_type: "dogfood_finding",
      summary: "Linked-summary dogfood showed downstream consumers needed structured resolution links.",
      result: "blocking",
    },
    {
      event_id: "pr244-resolution-links-implementation",
      resolves_event_id: "pr244-resolution-links-finding",
      event_type: "implementation_completed",
      summary: "Operator packet output now includes structured resolution_links.",
      result: "follow_up_resolved",
    },
    {
      event_id: "pr244-verification-completed",
      event_type: "verification_completed",
      summary: "Verification completed for linked structured output and boundary smokes.",
      result: "verified",
    },
    {
      event_id: "pr244-operator-decision",
      event_type: "operator_decision",
      summary: "Operator decision preserves manual handoff and no actuation.",
      result: "manual_handoff_no_actuation",
    },
  ];

  return {
    id: "sample-b",
    expectedTimeline: reviewEvents.map((event) => event.event_type),
    expectedEventIds: reviewEvents.map((event) => event.event_id),
    expectedResults: reviewEvents.map((event) => event.result),
    followUpEventId: "pr244-resolution-links-implementation",
    blockingEventId: "pr244-resolution-links-finding",
    expectedResolvingResult: "follow_up_resolved",
    input: {
      task: {
        title: "Add structured resolution_links output to operator review packets",
        intent:
          "Expose explicit review-event resolution relationships as structured JSON so downstream consumers do not parse timeline or observation prose.",
        scope: "Track B local packet output schema improvement; no UI, sidecar, posting, runtime, provider, or actuation.",
      },
      pr: {
        number: 244,
        url: "https://github.com/Aurna-code/augnes/pull/244",
        state: "merged",
        head_sha: "2442442442442442442442442442442442442442",
        merge_sha: "244f244f244f244f244f244f244f244f244f244f",
      },
      materials: {
        closeout_pipeline: { helper: "codex:closeout-pipeline", body: hiddenMaterialBody },
        action_plan: { helper: "codex:closeout-action-plan", auth_header: hiddenMaterialBody },
        actuation_gate: { helper: "codex:actuation-gate" },
        actuation_preview: null,
        github_comment_readiness: { helper: "codex:github-comment-readiness", token: hiddenMaterialBody },
        github_comment_command_preview: { helper: "codex:github-comment-command-preview", body: hiddenMaterialBody },
      },
      review_events: reviewEvents,
      operator_decision: {
        decision: "manual_handoff_no_actuation",
        reason: "Local output dogfood only; do not post, actuate, change UI, or call providers.",
      },
    },
  };
}

function buildImplicitDecisionFixture() {
  return {
    task: {
      title: "Neutral decision wording fixture",
      intent: "Confirm manual/no-actuation observations require explicit wording.",
      scope: "Local result-enum dogfood fixture only.",
    },
    pr: {
      number: 245,
      url: "https://github.com/Aurna-code/augnes/pull/245",
      state: "merged",
      head_sha: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      merge_sha: "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
    },
    materials: emptyMaterials(),
    review_events: [
      {
        event_id: "neutral-task-opened",
        event_type: "task_opened",
        summary: "Task opened for neutral decision fixture.",
        result: "opened",
      },
    ],
    operator_decision: {
      decision: "deferred",
      reason: "More review is needed.",
    },
  };
}

function buildLegacyResultFixture() {
  return {
    ...buildSampleA().input,
    review_events: [
      {
        event_id: "legacy-created-result",
        event_type: "task_opened",
        summary: "Legacy result string should be rejected.",
        result: "created",
      },
    ],
  };
}

function buildUpdatedResolvedProseFixture() {
  return {
    ...buildSampleA().input,
    review_events: [
      {
        event_id: "blocking-target",
        event_type: "dogfood_finding",
        summary: "Blocking dogfood finding.",
        result: "blocking",
      },
      {
        event_id: "updated-prose-fix",
        resolves_event_id: "blocking-target",
        event_type: "follow_up_commit",
        summary: "Follow-up says resolved in prose but keeps the updated result.",
        result: "updated",
      },
    ],
  };
}

function buildNonBlockingTargetFixture() {
  return {
    ...buildSampleA().input,
    review_events: [
      {
        event_id: "needs-review-target",
        event_type: "dogfood_finding",
        summary: "Dogfood finding uses needs_review instead of blocking.",
        result: "needs_review",
      },
      {
        event_id: "fix-needs-review-target",
        resolves_event_id: "needs-review-target",
        event_type: "follow_up_commit",
        summary: "Follow-up resolved a non-blocking target.",
        result: "follow_up_resolved",
      },
    ],
  };
}

function emptyMaterials() {
  return {
    closeout_pipeline: null,
    action_plan: null,
    actuation_gate: null,
    actuation_preview: null,
    github_comment_readiness: null,
    github_comment_command_preview: null,
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
  assert.deepEqual(
    packet.timeline.map((event) => event.result),
    sample.expectedResults,
    sample.id,
  );
  for (const event of packet.timeline) {
    assert.ok(allowedResults.has(event.result), `${sample.id}: ${event.result}`);
  }
  assert.equal(
    packet.timeline.find((event) => event.event_id === sample.followUpEventId)?.resolves_event_id,
    sample.blockingEventId,
    sample.id,
  );
  assert.equal(packet.resolution_links.length, 1, sample.id);
  assert.deepEqual(packet.resolution_links[0], {
    link_kind: "review_event_resolution",
    source: "structured_resolves_event_id",
    blocking_event_id: sample.blockingEventId,
    resolving_event_id: sample.followUpEventId,
    blocking_event_index: 2,
    resolving_event_index: 3,
    blocking_event_type: "dogfood_finding",
    resolving_event_type: "implementation_completed",
    resolving_event_result: sample.expectedResolvingResult,
  });
  assertStructuredResolutionObservation(packet, sample.followUpEventId, sample.blockingEventId);
  assertManualHandoffObservation(packet);
}

function assertSummaryOutput(summary, sample) {
  for (const eventId of sample.expectedEventIds) {
    assert.match(summary, new RegExp(escapeRegExp(`event_id=${eventId}`)), `${sample.id}: ${eventId}`);
  }
  assert.match(summary, new RegExp(escapeRegExp(`resolves_event_id=${sample.blockingEventId}`)), sample.id);
  assert.match(summary, /^Resolution links:$/m);
  assert.match(summary, new RegExp(escapeRegExp(`- ${sample.followUpEventId} -> ${sample.blockingEventId}`)), sample.id);
  assert.match(
    summary,
    new RegExp(escapeRegExp(`Review event ${sample.followUpEventId} resolved blocking event ${sample.blockingEventId}`)),
    sample.id,
  );
  assert.doesNotMatch(summary, /event_id=undefined/);
  assert.doesNotMatch(summary, /resolves_event_id=undefined/);
  assert.doesNotMatch(summary, /event_id=null/);
  assert.doesNotMatch(summary, /resolves_event_id=null/);
}

function assertMissingOptionalWarnings(packet) {
  assert.equal(packet.material_summary.present.length, 0);
  assert.equal(packet.material_summary.missing_optional.length, 6);
  assert.equal(packet.warnings.length, 6);
  assert.equal(packet.blockers.length, 0);
}

function parseBothJson(stdout) {
  const beginIndex = stdout.indexOf(beginMarker);
  const endIndex = stdout.indexOf(endMarker);
  assert.notEqual(beginIndex, -1, "missing JSON begin marker");
  assert.notEqual(endIndex, -1, "missing JSON end marker");
  assert.ok(endIndex > beginIndex, "invalid JSON marker order");
  return JSON.parse(stdout.slice(beginIndex + beginMarker.length, endIndex).trim());
}

function parseBothSummary(stdout) {
  const beginIndex = stdout.indexOf(beginMarker);
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

function assertManualHandoffObservation(packet) {
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
    "Controlled-result usefulness observations",
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
