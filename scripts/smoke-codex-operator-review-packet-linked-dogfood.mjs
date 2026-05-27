import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { readFile } from "node:fs/promises";

const dogfoodDocPath = "docs/OPERATOR_REVIEW_PACKET_LINKED_EVENT_DOGFOOD_2026_05_26.md";
const helperSourcePath = "apps/augnes_apps/scripts/codex-operator-review-packet.ts";
const smokeSourcePath = "scripts/smoke-codex-operator-review-packet-linked-dogfood.mjs";
const fakeGithubToken = "fake-gh-token-linked-operator-packet-dogfood";
const fakeOpenAiKey = "fake-openai-key-linked-operator-packet-dogfood";
const hiddenMaterialBody = "Hidden linked dogfood body/auth/token-like content that must not render.";

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
  const packet = await runPacketJson(sample.input);
  successfulOutputs.push(JSON.stringify(packet));
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
  assertStructuredResolutionLink(packet, sample.followUpEventId, sample.blockingEventId);
  assertStructuredResolutionObservation(packet, sample.followUpEventId, sample.blockingEventId);
  assertManualOrLocalOnlyObservation(packet);
  assertNoSecretsOrHiddenMaterial(JSON.stringify(packet));

  if (sample.id === "sample-a") {
    assert.ok(packet.warnings.length > 0, "sample-a should warn for missing optional materials");
    assert.equal(packet.blockers.length, 0, "sample-a missing optional materials must not block");
  }
}

const disambiguation = await runPacketJson(buildDisambiguationNegativeFixture());
assertStructuredResolutionLink(disambiguation, "fix-earlier-blocker", "earlier-blocker");
assertStructuredResolutionObservation(disambiguation, "fix-earlier-blocker", "earlier-blocker");
assert.doesNotMatch(disambiguation.perspective_observations.join("\n"), /resolved blocking event later-blocker/);
assertNoManualHandoffObservation(disambiguation);
successfulOutputs.push(JSON.stringify(disambiguation));

await assertInvalidPacket(buildNegatedLinkedFollowUpFixture(), /CODEX_OPERATOR_REVIEW_PACKET_UNRESOLVED_LINK_EVENT/);

const doc = await readFile(dogfoodDocPath, "utf8");
assertRequiredDocSections(doc);
assertNoForbiddenOverclaims(doc, "linked-event dogfood doc");
for (const output of successfulOutputs) {
  assertNoForbiddenOverclaims(output, "packet output");
}

await assertLocalOnlySource(helperSourcePath, { helper: true });
await assertLocalOnlySource(smokeSourcePath, { helper: false });

console.log("smoke:codex-operator-review-packet-linked-dogfood passed");

function buildSampleA() {
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
        "Blocking review finding: negated resolution phrases like not fixed and not addressed could pass as resolved follow-up observations.",
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
    id: "sample-a",
    expectedTimeline: reviewEvents.map((event) => event.event_type),
    expectedEventIds: reviewEvents.map((event) => event.event_id),
    followUpEventId: "pr240-negated-resolution-fix",
    blockingEventId: "pr240-negated-resolution-blocker",
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
        reason: "Merged with local-only dogfood follow-up; do not post or actuate.",
      },
    },
  };
}

function buildSampleB() {
  const reviewEvents = [
    {
      event_id: "pr238-task-opened",
      event_type: "task_opened",
      summary: "Task opened to add codex:operator-review-packet.",
      result: "opened",
    },
    {
      event_id: "pr238-implementation-completed",
      event_type: "implementation_completed",
      summary: "Implementation completed for the local operator review packet helper.",
      result: "implemented",
    },
    {
      event_id: "pr238-predicate-blocker",
      event_type: "blocking_review_finding",
      summary: "Blocking review finding: broad predicates overclaimed resolved follow-up and manual handoff.",
      result: "blocking",
    },
    {
      event_id: "pr238-predicate-fix",
      resolves_event_id: "pr238-predicate-blocker",
      event_type: "follow_up_commit",
      summary: "Follow-up resolved predicate overclaiming with tighter follow-up and actuation-proceed guards.",
      result: "follow_up_resolved",
    },
    {
      event_id: "pr238-verification-completed",
      event_type: "verification_completed",
      summary: "Verification completed for packet shape, local-only boundaries, and predicate fixtures.",
      result: "verified",
    },
    {
      event_id: "pr238-operator-decision",
      event_type: "operator_decision",
      summary: "Operator decision merged and kept dogfood-next local-only before UI, sidecar, or actuation work.",
      result: "merged_dogfood_next_local_only",
    },
  ];

  return {
    id: "sample-b",
    expectedTimeline: reviewEvents.map((event) => event.event_type),
    expectedEventIds: reviewEvents.map((event) => event.event_id),
    followUpEventId: "pr238-predicate-fix",
    blockingEventId: "pr238-predicate-blocker",
    input: {
      task: {
        title: "Add codex:operator-review-packet",
        intent: "Render local operator handoff material from explicit task and review events.",
        scope: "Track B review handoff packet; no UI, sidecar, posting, or actuation.",
      },
      pr: {
        number: 238,
        url: "https://github.com/Aurna-code/augnes/pull/238",
        state: "merged",
        head_sha: "2382382382382382382382382382382382382382",
        merge_sha: "238f238f238f238f238f238f238f238f238f238f",
      },
      materials: {
        closeout_pipeline: { helper: "codex:closeout-pipeline" },
        action_plan: { helper: "codex:closeout-action-plan" },
        actuation_gate: { helper: "codex:actuation-gate" },
        actuation_preview: { helper: "codex:actuation-preview" },
        github_comment_readiness: { helper: "codex:github-comment-readiness" },
        github_comment_command_preview: {
          helper: "codex:github-comment-command-preview",
          body: hiddenMaterialBody,
        },
      },
      review_events: reviewEvents,
      operator_decision: {
        decision: "merged_dogfood_next_local_only_no_actuation",
        reason: "Dogfood before UI, sidecar, or actuation work; keep this as operator review only.",
      },
    },
  };
}

function buildDisambiguationNegativeFixture() {
  return {
    task: {
      title: "Disambiguate linked follow-up from nearest blocking event",
      intent: "Confirm resolves_event_id beats timeline proximity.",
      scope: "Local linked-event dogfood fixture only.",
    },
    pr: {
      number: 240,
      url: "https://github.com/Aurna-code/augnes/pull/240",
      state: "merged",
      head_sha: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      merge_sha: "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
    },
    materials: fullMaterials(),
    review_events: [
      {
        event_id: "earlier-blocker",
        event_type: "blocking_review_finding",
        summary: "Blocking review finding for event-link validation.",
        result: "blocking",
      },
      {
        event_id: "later-blocker",
        event_type: "blocking_review_finding",
        summary: "Blocking review finding for a separate output wording issue.",
        result: "blocking",
      },
      {
        event_id: "fix-earlier-blocker",
        resolves_event_id: "earlier-blocker",
        event_type: "follow_up_commit",
        summary: "Follow-up resolved event-link validation while output wording remains separate.",
        result: "follow_up_resolved",
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
      scope: "Local linked-event dogfood fixture only.",
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
    github_comment_command_preview: { helper: "codex:github-comment-command-preview" },
  };
}

function runPacketJson(input) {
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
      } catch (error) {
        reject(error);
        return;
      }
      if (status !== 0) {
        reject(new Error(`operator review packet failed with ${status}: ${stderr}`));
        return;
      }
      try {
        resolve(JSON.parse(stdout));
      } catch (error) {
        reject(error);
      }
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

function assertStructuredResolutionObservation(packet, followUpEventId, blockingEventId) {
  assert.ok(
    packet.perspective_observations.some((observation) =>
      observation.includes(`Review event ${followUpEventId} resolved blocking event ${blockingEventId}`),
    ),
    `${followUpEventId} -> ${blockingEventId}`,
  );
}

function assertStructuredResolutionLink(packet, followUpEventId, blockingEventId) {
  assert.ok(Array.isArray(packet.resolution_links), "resolution_links should be present");
  assert.ok(
    packet.resolution_links.some(
      (link) =>
        link.link_kind === "review_event_resolution" &&
        link.source === "structured_resolves_event_id" &&
        link.resolving_event_id === followUpEventId &&
        link.blocking_event_id === blockingEventId,
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
    "Linked-event usefulness observations",
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
