import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

const beginMarker = "BEGIN_AUGNES_CODEX_OPERATOR_REVIEW_PACKET_JSON";
const endMarker = "END_AUGNES_CODEX_OPERATOR_REVIEW_PACKET_JSON";
const inputBeginMarker = "BEGIN_AUGNES_CODEX_OPERATOR_REVIEW_PACKET_INPUT_JSON";
const inputEndMarker = "END_AUGNES_CODEX_OPERATOR_REVIEW_PACKET_INPUT_JSON";
const fakeGithubToken = "fake-gh-token-operator-review-packet";
const fakeOpenAiKey = "fake-openai-key-operator-review-packet";
const hiddenBody = "Hidden comment body that must not be rendered by the packet.";
const forbiddenPublicOverclaimPhrases = [
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

const successfulOutputs = [];

const both = await runPacket({
  env: {
    CODEX_OPERATOR_REVIEW_PACKET_INPUT_JSON: JSON.stringify(buildPr215LikeInput()),
    CODEX_OPERATOR_REVIEW_PACKET_OUTPUT: "both",
  },
});
assert.equal(both.status, 0, both.stderr);
assert.match(both.stdout, /Codex operator review packet/);
assert.match(both.stdout, new RegExp(`${beginMarker}\\n`));
assert.match(both.stdout, new RegExp(`\\n${endMarker}\\n?$`));
const bothJson = extractPacketJson(both.stdout);
assertPacketShape(bothJson);
assert.equal(bothJson.helper, "codex:operator-review-packet");
assert.equal(bothJson.packet_kind, "review_handoff");
assert.equal(bothJson.dry_run_only, true);
assert.equal(bothJson.would_execute, false);
assert.deepEqual(
  bothJson.timeline.map((event) => event.event_type),
  ["task_opened", "review_finding", "follow_up_commit", "operator_decision"],
);
assert.ok(
  bothJson.perspective_observations.some((observation) =>
    observation.includes("Review event 2 was blocking") && observation.includes("later event 3"),
  ),
);
assert.ok(
  bothJson.perspective_observations.some((observation) =>
    observation.includes("manual handoff/no actuation"),
  ),
);
assertNoSecretsOrPayload(both.stdout + both.stderr);
successfulOutputs.push(both.stdout);

const jsonOnly = await runPacket({
  env: {
    CODEX_OPERATOR_REVIEW_PACKET_INPUT_JSON: JSON.stringify(buildPr215LikeInput()),
    CODEX_OPERATOR_REVIEW_PACKET_OUTPUT: "json",
  },
});
assert.equal(jsonOnly.status, 0, jsonOnly.stderr);
assert.equal(JSON.parse(jsonOnly.stdout).helper, "codex:operator-review-packet");
assert.doesNotMatch(jsonOnly.stdout, /Codex operator review packet/);
assertNoSecretsOrPayload(jsonOnly.stdout + jsonOnly.stderr);
successfulOutputs.push(jsonOnly.stdout);

const summaryOnly = await runPacket({
  env: {
    CODEX_OPERATOR_REVIEW_PACKET_INPUT_JSON: JSON.stringify(buildPr215LikeInput()),
    CODEX_OPERATOR_REVIEW_PACKET_OUTPUT: "summary",
  },
});
assert.equal(summaryOnly.status, 0, summaryOnly.stderr);
assert.match(summaryOnly.stdout, /Codex operator review packet/);
assert.doesNotMatch(summaryOnly.stdout, new RegExp(beginMarker));
assert.doesNotMatch(summaryOnly.stdout, /event_id=undefined/);
assert.doesNotMatch(summaryOnly.stdout, /resolves_event_id=undefined/);
assert.doesNotMatch(summaryOnly.stdout, /event_id=null/);
assert.doesNotMatch(summaryOnly.stdout, /resolves_event_id=null/);
assertNoSecretsOrPayload(summaryOnly.stdout + summaryOnly.stderr);
successfulOutputs.push(summaryOnly.stdout);

const linkedSummaryInput = buildLinkedReviewEventsInput();
const linkedSummary = await runPacket({
  env: {
    CODEX_OPERATOR_REVIEW_PACKET_INPUT_JSON: JSON.stringify(linkedSummaryInput),
    CODEX_OPERATOR_REVIEW_PACKET_OUTPUT: "summary",
  },
});
assert.equal(linkedSummary.status, 0, linkedSummary.stderr);
assert.match(linkedSummary.stdout, /Codex operator review packet/);
assert.doesNotMatch(linkedSummary.stdout, new RegExp(beginMarker));
assert.match(
  linkedSummary.stdout,
  /- 1\. review_finding \[event_id=finding-target-ref\]: Blocking review finding noted target_ref consistency needed correction\. \(blocking\)/,
);
assert.match(
  linkedSummary.stdout,
  /- 2\. follow_up_commit \[event_id=fix-target-ref resolves_event_id=finding-target-ref\]: Follow-up resolved target_ref parsing and pull\/issue consistency\. \(follow_up_resolved\)/,
);
assert.match(linkedSummary.stdout, /event_id=finding-target-ref/);
assert.match(linkedSummary.stdout, /event_id=fix-target-ref/);
assert.match(linkedSummary.stdout, /resolves_event_id=finding-target-ref/);
assertNoSecretsOrPayload(linkedSummary.stdout + linkedSummary.stderr);
successfulOutputs.push(linkedSummary.stdout);

const linkedBoth = await runPacket({
  env: {
    CODEX_OPERATOR_REVIEW_PACKET_INPUT_JSON: JSON.stringify(linkedSummaryInput),
    CODEX_OPERATOR_REVIEW_PACKET_OUTPUT: "both",
  },
});
assert.equal(linkedBoth.status, 0, linkedBoth.stderr);
assert.match(linkedBoth.stdout, new RegExp(`${beginMarker}\\n`));
const linkedBothSummary = extractSummaryText(linkedBoth.stdout);
assert.match(linkedBothSummary, /event_id=finding-target-ref/);
assert.match(linkedBothSummary, /event_id=fix-target-ref/);
assert.match(linkedBothSummary, /resolves_event_id=finding-target-ref/);
const linkedBothJson = extractPacketJson(linkedBoth.stdout);
assert.equal(linkedBothJson.timeline[0].event_id, "finding-target-ref");
assert.equal(linkedBothJson.timeline[1].event_id, "fix-target-ref");
assert.equal(linkedBothJson.timeline[1].resolves_event_id, "finding-target-ref");
assert.equal(linkedBothJson.resolution_links, undefined);
assertNoSecretsOrPayload(linkedBoth.stdout + linkedBoth.stderr);
successfulOutputs.push(linkedBoth.stdout);

const rawJsonEnv = await runPacketJson({
  CODEX_OPERATOR_REVIEW_PACKET_INPUT_JSON: JSON.stringify(buildPr215LikeInput()),
});
assert.equal(rawJsonEnv.pr_summary.number, 215);

const markedJsonEnv = await runPacketJson({
  CODEX_OPERATOR_REVIEW_PACKET_INPUT_JSON: markedInput(buildPr215LikeInput()),
});
assert.equal(markedJsonEnv.timeline[1].result, "blocking");

const inputFilePath = path.join(tmpdir(), `augnes-operator-review-packet-${process.pid}.json`);
await writeFile(inputFilePath, markedInput(buildPr215LikeInput()), "utf8");
const fileInput = await runPacket({
  env: {
    CODEX_OPERATOR_REVIEW_PACKET_INPUT_JSON_FILE: inputFilePath,
    CODEX_OPERATOR_REVIEW_PACKET_OUTPUT: "json",
  },
});
assert.equal(fileInput.status, 0, fileInput.stderr);
assert.equal(JSON.parse(fileInput.stdout).helper, "codex:operator-review-packet");
assertNoSecretsOrPayload(fileInput.stdout + fileInput.stderr);
successfulOutputs.push(fileInput.stdout);

const stdinInput = await runPacket({
  stdin: JSON.stringify(buildPr215LikeInput()),
  env: {
    CODEX_OPERATOR_REVIEW_PACKET_OUTPUT: "json",
  },
});
assert.equal(stdinInput.status, 0, stdinInput.stderr);
assert.equal(JSON.parse(stdinInput.stdout).helper, "codex:operator-review-packet");
assertNoSecretsOrPayload(stdinInput.stdout + stdinInput.stderr);
successfulOutputs.push(stdinInput.stdout);

const missingMaterialsInput = buildPr215LikeInput({
  materials: {
    closeout_pipeline: null,
    action_plan: { helper: "codex:closeout-action-plan" },
    actuation_gate: null,
    actuation_preview: null,
    github_comment_readiness: { helper: "codex:github-comment-readiness" },
    github_comment_command_preview: null,
  },
});
const missingMaterials = await runPacketJson({
  CODEX_OPERATOR_REVIEW_PACKET_INPUT_JSON: JSON.stringify(missingMaterialsInput),
});
assert.deepEqual(missingMaterials.material_summary.present, ["action_plan", "github_comment_readiness"]);
assert.deepEqual(missingMaterials.material_summary.missing_optional, [
  "closeout_pipeline",
  "actuation_gate",
  "actuation_preview",
  "github_comment_command_preview",
]);
assert.ok(missingMaterials.warnings.every((warning) => warning.startsWith("Missing optional material:")));
assert.equal(missingMaterials.blockers.length, 0);

const structuredLink = await runPacketJson({
  CODEX_OPERATOR_REVIEW_PACKET_INPUT_JSON: JSON.stringify(linkedSummaryInput),
});
assert.equal(structuredLink.timeline[0].event_id, "finding-target-ref");
assert.equal(structuredLink.timeline[1].event_id, "fix-target-ref");
assert.equal(structuredLink.timeline[1].resolves_event_id, "finding-target-ref");
assert.ok(
  structuredLink.perspective_observations.some((observation) =>
    observation.includes("Review event fix-target-ref resolved blocking event finding-target-ref") &&
    observation.includes("Follow-up resolved target_ref parsing and pull/issue consistency."),
  ),
);

const structuredDisambiguation = await runPacketJson({
  CODEX_OPERATOR_REVIEW_PACKET_INPUT_JSON: JSON.stringify(
    buildPr215LikeInput({
      review_events: [
        {
          event_id: "first-blocker",
          event_type: "review_finding",
          summary: "Blocking review finding for target_ref consistency.",
          result: "blocking",
        },
        {
          event_id: "second-blocker",
          event_type: "review_finding",
          summary: "Blocking review finding for command body redaction.",
          result: "blocking",
        },
        {
          event_id: "fix-first-blocker",
          resolves_event_id: "first-blocker",
          event_type: "follow_up_commit",
          summary: "Follow-up resolved target_ref consistency while body redaction remains separate.",
          result: "follow_up_resolved",
        },
      ],
      operator_decision: {
        decision: "defer_review",
        reason: "More review is needed.",
      },
    }),
  ),
});
assert.ok(
  structuredDisambiguation.perspective_observations.some((observation) =>
    observation.includes("Review event fix-first-blocker resolved blocking event first-blocker"),
  ),
);
assert.doesNotMatch(structuredDisambiguation.perspective_observations.join("\n"), /resolved blocking event second-blocker/);

const unresolvedFollowUpOnly = await runPacketJson({
  CODEX_OPERATOR_REVIEW_PACKET_INPUT_JSON: JSON.stringify(
    buildPr215LikeInput({
      review_events: [
        {
          event_type: "review_finding",
          summary: "Blocking review finding noted target_ref consistency needed correction.",
          result: "blocking",
        },
        {
          event_type: "follow_up_required",
          summary: "Follow-up still required; issue not resolved.",
          result: "needs_review",
        },
      ],
      operator_decision: {
        decision: "defer_review",
        reason: "More review is needed.",
      },
    }),
  ),
});
assertRawTimelinePreserved(unresolvedFollowUpOnly, ["review_finding", "follow_up_required"]);
assertNoResolvedFollowUpObservation(unresolvedFollowUpOnly);
assertNoManualHandoffObservation(unresolvedFollowUpOnly);

const negatedFallbackFollowUp = await runPacketJson({
  CODEX_OPERATOR_REVIEW_PACKET_INPUT_JSON: JSON.stringify(
    buildPr215LikeInput({
      review_events: [
        {
          event_type: "review_finding",
          summary: "Blocking review finding noted target_ref consistency needed correction.",
          result: "blocking",
        },
        {
          event_type: "follow_up_commit",
          summary: "Follow-up not fixed and not addressed; issue remains.",
          result: "updated",
        },
      ],
      operator_decision: {
        decision: "defer_review",
        reason: "More review is needed.",
      },
    }),
  ),
});
assertRawTimelinePreserved(negatedFallbackFollowUp, ["review_finding", "follow_up_commit"]);
assertNoResolvedFollowUpObservation(negatedFallbackFollowUp);

const unresolvedThenResolvedFollowUp = await runPacketJson({
  CODEX_OPERATOR_REVIEW_PACKET_INPUT_JSON: JSON.stringify(
    buildPr215LikeInput({
      review_events: [
        {
          event_type: "review_finding",
          summary: "Blocking review finding noted target_ref consistency needed correction.",
          result: "blocking",
        },
        {
          event_type: "follow_up_required",
          summary: "Follow-up still required; issue not resolved.",
          result: "needs_review",
        },
        {
          event_type: "follow_up_commit",
          summary: "Follow-up resolved the target_ref consistency issue.",
          result: "follow_up_resolved",
        },
      ],
      operator_decision: {
        decision: "defer_review",
        reason: "More review is needed.",
      },
    }),
  ),
});
assertRawTimelinePreserved(unresolvedThenResolvedFollowUp, [
  "review_finding",
  "follow_up_required",
  "follow_up_commit",
]);
assert.ok(
  unresolvedThenResolvedFollowUp.perspective_observations.some((observation) =>
    observation.includes("Review event 1 was blocking") &&
    observation.includes("later event 3") &&
    observation.includes("Follow-up resolved the target_ref consistency issue."),
  ),
);
assert.doesNotMatch(unresolvedThenResolvedFollowUp.perspective_observations.join("\n"), /later event 2/);

const actuationApprovedDecision = await runPacketJson({
  CODEX_OPERATOR_REVIEW_PACKET_INPUT_JSON: JSON.stringify(
    buildPr215LikeInput({
      review_events: [
        {
          event_type: "operator_decision",
          summary: "Operator approved separate actuation helper.",
          result: "approved",
        },
      ],
      operator_decision: {
        decision: "operator_approved_actuation",
        reason: "Operator approved a separate actuation helper.",
      },
    }),
  ),
});
assertNoManualHandoffObservation(actuationApprovedDecision);

const explicitManualDecision = await runPacketJson({
  CODEX_OPERATOR_REVIEW_PACKET_INPUT_JSON: JSON.stringify(
    buildPr215LikeInput({
      review_events: [
        {
          event_type: "operator_decision",
          summary: "Manual handoff preserved.",
          result: "manual_handoff",
        },
      ],
      operator_decision: {
        decision: "manual_handoff_no_actuation",
        reason: "Use the material for operator review only; do not post or actuate.",
      },
    }),
  ),
});
assertManualHandoffObservation(explicitManualDecision);

await assertInvalid({
  env: {
    CODEX_OPERATOR_REVIEW_PACKET_INPUT_JSON: JSON.stringify(buildPr215LikeInput({ task: { title: "", intent: "x", scope: "x" } })),
  },
  expected: /CODEX_OPERATOR_REVIEW_PACKET_INVALID_TASK_SHAPE/,
});
await assertInvalid({
  env: {
    CODEX_OPERATOR_REVIEW_PACKET_INPUT_JSON: JSON.stringify(buildPr215LikeInput({ pr: { number: 0, url: "x", state: "open", head_sha: "x" } })),
  },
  expected: /CODEX_OPERATOR_REVIEW_PACKET_INVALID_PR_SHAPE/,
});
await assertInvalid({
  env: {
    CODEX_OPERATOR_REVIEW_PACKET_INPUT_JSON: JSON.stringify(buildPr215LikeInput({ review_events: [{ event_type: "x", summary: "x" }] })),
  },
  expected: /CODEX_OPERATOR_REVIEW_PACKET_INVALID_REVIEW_EVENTS_SHAPE/,
});
await assertInvalid({
  env: {
    CODEX_OPERATOR_REVIEW_PACKET_INPUT_JSON: JSON.stringify(
      buildPr215LikeInput({
        review_events: [
          { event_id: "dup", event_type: "review_finding", summary: "Blocking finding one.", result: "blocking" },
          { event_id: "dup", event_type: "review_finding", summary: "Blocking finding two.", result: "blocking" },
        ],
      }),
    ),
  },
  expected: /CODEX_OPERATOR_REVIEW_PACKET_DUPLICATE_REVIEW_EVENT_ID/,
});
await assertInvalid({
  env: {
    CODEX_OPERATOR_REVIEW_PACKET_INPUT_JSON: JSON.stringify(
      buildPr215LikeInput({
        review_events: [
          {
            event_id: "fix-unknown",
            resolves_event_id: "missing-finding",
            event_type: "follow_up_commit",
            summary: "Follow-up resolved a missing finding.",
            result: "follow_up_resolved",
          },
        ],
      }),
    ),
  },
  expected: /CODEX_OPERATOR_REVIEW_PACKET_UNKNOWN_RESOLVED_EVENT/,
});
await assertInvalid({
  env: {
    CODEX_OPERATOR_REVIEW_PACKET_INPUT_JSON: JSON.stringify(
      buildPr215LikeInput({
        review_events: [
          {
            event_id: "fix-before-finding",
            resolves_event_id: "future-finding",
            event_type: "follow_up_commit",
            summary: "Follow-up resolved a future finding.",
            result: "follow_up_resolved",
          },
          {
            event_id: "future-finding",
            event_type: "review_finding",
            summary: "Blocking finding appears later.",
            result: "blocking",
          },
        ],
      }),
    ),
  },
  expected: /CODEX_OPERATOR_REVIEW_PACKET_FORWARD_RESOLUTION_LINK/,
});
await assertInvalid({
  env: {
    CODEX_OPERATOR_REVIEW_PACKET_INPUT_JSON: JSON.stringify(
      buildPr215LikeInput({
        review_events: [
          {
            event_id: "same-event",
            resolves_event_id: "same-event",
            event_type: "follow_up_commit",
            summary: "Follow-up resolved itself.",
            result: "follow_up_resolved",
          },
        ],
      }),
    ),
  },
  expected: /CODEX_OPERATOR_REVIEW_PACKET_FORWARD_RESOLUTION_LINK/,
});
await assertInvalid({
  env: {
    CODEX_OPERATOR_REVIEW_PACKET_INPUT_JSON: JSON.stringify(
      buildPr215LikeInput({
        review_events: [
          { event_id: "not-blocking", event_type: "task_opened", summary: "Task opened.", result: "opened" },
          {
            event_id: "fix-not-blocking",
            resolves_event_id: "not-blocking",
            event_type: "follow_up_commit",
            summary: "Follow-up resolved a non-blocking event.",
            result: "follow_up_resolved",
          },
        ],
      }),
    ),
  },
  expected: /CODEX_OPERATOR_REVIEW_PACKET_NON_BLOCKING_RESOLUTION_TARGET/,
});
await assertInvalid({
  env: {
    CODEX_OPERATOR_REVIEW_PACKET_INPUT_JSON: JSON.stringify(
      buildPr215LikeInput({
        review_events: [
          { event_id: "finding", event_type: "review_finding", summary: "Blocking finding.", result: "blocking" },
          {
            event_id: "unresolved-fix",
            resolves_event_id: "finding",
            event_type: "follow_up_required",
            summary: "Follow-up still required; issue not resolved.",
            result: "needs_review",
          },
        ],
      }),
    ),
  },
  expected: /CODEX_OPERATOR_REVIEW_PACKET_UNRESOLVED_LINK_EVENT/,
});
await assertInvalid({
  env: {
    CODEX_OPERATOR_REVIEW_PACKET_INPUT_JSON: JSON.stringify(
      buildPr215LikeInput({
        review_events: [
          { event_id: "finding", event_type: "review_finding", summary: "Blocking finding.", result: "blocking" },
          {
            event_id: "non-resolving-follow-up",
            resolves_event_id: "finding",
            event_type: "follow_up_commit",
            summary: "Follow-up commit updated the helper.",
            result: "updated",
          },
        ],
      }),
    ),
  },
  expected: /CODEX_OPERATOR_REVIEW_PACKET_UNRESOLVED_LINK_EVENT/,
});
await assertUnresolvedLinkedFollowUp("Follow-up not fixed; target_ref consistency is still open.", "updated");
await assertUnresolvedLinkedFollowUp("Follow-up not addressed; target_ref consistency remains open.", "updated");
await assertUnresolvedLinkedFollowUp("Follow-up not resolving target_ref consistency yet.", "updated");
await assertUnresolvedLinkedFollowUp("Follow-up still broken after the attempted change.", "updated");
await assertUnresolvedLinkedFollowUp("Follow-up still failing after the attempted change.", "updated");
await assertInvalid({
  env: {
    CODEX_OPERATOR_REVIEW_PACKET_INPUT_JSON: "{nope",
  },
  expected: /CODEX_OPERATOR_REVIEW_PACKET_INVALID_JSON/,
});
await assertInvalid({
  env: {
    CODEX_OPERATOR_REVIEW_PACKET_INPUT_JSON: "[]",
  },
  expected: /CODEX_OPERATOR_REVIEW_PACKET_INVALID_INPUT_SHAPE/,
});

for (const output of successfulOutputs) {
  for (const phrase of forbiddenPublicOverclaimPhrases) {
    assertNoForbiddenPhrase(output, phrase);
  }
}

await assertLocalOnlySource();

console.log("smoke:codex-operator-review-packet passed");

function buildPr215LikeInput(overrides = {}) {
  const input = {
    task: {
      title: "Initial dry-run command preview task",
      intent: "Render a local GitHub comment command preview from readiness material.",
      scope: "Track B dogfood helper review; no real posting or actuation.",
    },
    pr: {
      number: 215,
      url: "https://github.com/Aurna-code/augnes/pull/215",
      state: "merged",
      head_sha: "1111111111111111111111111111111111111111",
      merge_sha: "2222222222222222222222222222222222222222",
    },
    materials: {
      closeout_pipeline: { helper: "codex:closeout-pipeline" },
      action_plan: { helper: "codex:closeout-action-plan" },
      actuation_gate: { helper: "codex:actuation-gate" },
      actuation_preview: { helper: "codex:actuation-preview" },
      github_comment_readiness: { helper: "codex:github-comment-readiness" },
      github_comment_command_preview: { helper: "codex:github-comment-command-preview", body: hiddenBody },
    },
    review_events: [
      {
        event_type: "task_opened",
        summary: "Initial dry-run command preview task was prepared for local review.",
        result: "created",
      },
      {
        event_type: "review_finding",
        summary: "Blocking review finding noted target_ref consistency needed correction.",
        result: "blocking",
      },
      {
        event_type: "follow_up_commit",
        summary: "Follow-up commit resolved the target_ref consistency issue.",
        result: "resolved",
      },
      {
        event_type: "operator_decision",
        summary: "Final merged state preserved manual handoff for any real posting.",
        result: "merged_manual_handoff",
      },
    ],
    operator_decision: {
      decision: "manual_handoff_no_actuation",
      reason: "Use the material for operator review only after merge; do not post or actuate.",
    },
  };

  return deepMerge(input, overrides);
}

function deepMerge(base, overrides) {
  if (!isPlainObject(base) || !isPlainObject(overrides)) return overrides;
  const result = { ...base };
  for (const [key, value] of Object.entries(overrides)) {
    result[key] = deepMerge(result[key], value);
  }
  return result;
}

function isPlainObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function markedInput(value) {
  return `${inputBeginMarker}\n${JSON.stringify(value, null, 2)}\n${inputEndMarker}\n`;
}

function extractPacketJson(output) {
  const begin = output.indexOf(beginMarker);
  const end = output.indexOf(endMarker);
  assert.notEqual(begin, -1);
  assert.notEqual(end, -1);
  return JSON.parse(output.slice(begin + beginMarker.length, end).trim());
}

function extractSummaryText(output) {
  const begin = output.indexOf(beginMarker);
  assert.notEqual(begin, -1);
  return output.slice(0, begin);
}

function buildLinkedReviewEventsInput() {
  return buildPr215LikeInput({
    review_events: [
      {
        event_id: "finding-target-ref",
        event_type: "review_finding",
        summary: "Blocking review finding noted target_ref consistency needed correction.",
        result: "blocking",
      },
      {
        event_id: "fix-target-ref",
        resolves_event_id: "finding-target-ref",
        event_type: "follow_up_commit",
        summary: "Follow-up resolved target_ref parsing and pull/issue consistency.",
        result: "follow_up_resolved",
      },
    ],
    operator_decision: {
      decision: "defer_review",
      reason: "More review is needed.",
    },
  });
}

async function runPacketJson(env) {
  const result = await runPacket({
    env: {
      ...env,
      CODEX_OPERATOR_REVIEW_PACKET_OUTPUT: "json",
    },
  });
  assert.equal(result.status, 0, result.stderr);
  assertNoSecretsOrPayload(result.stdout + result.stderr);
  successfulOutputs.push(result.stdout);
  return JSON.parse(result.stdout);
}

function runPacket({ env = {}, stdin = "" } = {}) {
  const childEnv = {
    ...process.env,
    GITHUB_TOKEN: fakeGithubToken,
    OPENAI_API_KEY: fakeOpenAiKey,
  };

  delete childEnv.CODEX_OPERATOR_REVIEW_PACKET_INPUT_JSON;
  delete childEnv.CODEX_OPERATOR_REVIEW_PACKET_INPUT_JSON_FILE;
  delete childEnv.CODEX_OPERATOR_REVIEW_PACKET_OUTPUT;

  for (const [key, value] of Object.entries(env)) {
    childEnv[key] = value;
  }

  return new Promise((resolve) => {
    const child = spawn("npm", ["run", "codex:operator-review-packet", "--silent"], {
      cwd: process.cwd(),
      env: childEnv,
      stdio: ["pipe", "pipe", "pipe"],
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
      resolve({ status, stdout, stderr });
    });
    child.stdin.end(stdin);
  });
}

async function assertInvalid({ env, expected }) {
  const result = await runPacket({ env });
  assert.notEqual(result.status, 0, result.stdout);
  assert.match(result.stderr, expected);
  assertNoSecretsOrPayload(result.stdout + result.stderr);
}

async function assertUnresolvedLinkedFollowUp(summary, result) {
  await assertInvalid({
    env: {
      CODEX_OPERATOR_REVIEW_PACKET_INPUT_JSON: JSON.stringify(
        buildPr215LikeInput({
          review_events: [
            {
              event_id: "finding",
              event_type: "review_finding",
              summary: "Blocking review finding.",
              result: "blocking",
            },
            {
              event_id: "negated-follow-up",
              resolves_event_id: "finding",
              event_type: "follow_up_commit",
              summary,
              result,
            },
          ],
        }),
      ),
    },
    expected: /CODEX_OPERATOR_REVIEW_PACKET_UNRESOLVED_LINK_EVENT/,
  });
}

function assertPacketShape(value) {
  assert.equal(value.helper, "codex:operator-review-packet");
  assert.equal(value.version, 1);
  assert.equal(value.operation_mode, "human_assisted");
  assert.equal(value.packet_kind, "review_handoff");
  assert.equal(typeof value.task_summary.title, "string");
  assert.equal(value.pr_summary.number, 215);
  assert.ok(Array.isArray(value.material_summary.present));
  assert.ok(Array.isArray(value.material_summary.missing_optional));
  assert.ok(Array.isArray(value.boundary_summary));
  assert.ok(Array.isArray(value.timeline));
  assert.ok(Array.isArray(value.perspective_observations));
  assert.ok(Array.isArray(value.operator_questions));
  assert.equal(typeof value.recommended_next_decision.decision, "string");
  assert.ok(Array.isArray(value.warnings));
  assert.ok(Array.isArray(value.blockers));
  assert.equal(value.dry_run_only, true);
  assert.equal(value.would_execute, false);
  assert.equal(typeof value.authority_boundary, "string");
}

function assertRawTimelinePreserved(packet, expectedEventTypes) {
  assert.deepEqual(
    packet.timeline.map((event) => event.event_type),
    expectedEventTypes,
  );
}

function assertNoResolvedFollowUpObservation(packet) {
  const observations = packet.perspective_observations.join("\n");
  assert.doesNotMatch(observations, /recorded a resolved follow-up/i);
  assert.doesNotMatch(observations, /resolved follow-up/i);
}

function assertManualHandoffObservation(packet) {
  assert.ok(
    packet.perspective_observations.some((observation) =>
      observation.includes("manual handoff/no actuation"),
    ),
  );
}

function assertNoManualHandoffObservation(packet) {
  assert.ok(
    packet.perspective_observations.every((observation) =>
      !observation.includes("manual handoff/no actuation"),
    ),
  );
}

function assertNoSecretsOrPayload(output) {
  assert.doesNotMatch(output, new RegExp(escapeRegExp(fakeGithubToken)));
  assert.doesNotMatch(output, new RegExp(escapeRegExp(fakeOpenAiKey)));
  assert.doesNotMatch(output, /GITHUB_TOKEN/);
  assert.doesNotMatch(output, /OPENAI_API_KEY/);
  assert.doesNotMatch(output, new RegExp(escapeRegExp(hiddenBody)));
  assert.doesNotMatch(output, /"body"\s*:/);
  assert.doesNotMatch(output, /authorization/i);
  assert.doesNotMatch(output, /bearer/i);
  assert.doesNotMatch(output, /token/i);
}

function assertNoForbiddenPhrase(output, phrase) {
  const pattern =
    phrase === "KPI"
      ? /(^|[^A-Za-z0-9_])KPI([^A-Za-z0-9_]|$)/i
      : new RegExp(escapeRegExp(phrase), "i");
  assert.doesNotMatch(output, pattern, phrase);
}

async function assertLocalOnlySource() {
  const source = await readFile("apps/augnes_apps/scripts/codex-operator-review-packet.ts", "utf8");
  assert.doesNotMatch(source, /from\s+["']node:http/);
  assert.doesNotMatch(source, /from\s+["']node:https/);
  assert.doesNotMatch(source, /from\s+["']node:http2/);
  assert.doesNotMatch(source, /\bfetch\s*\(/);
  assert.doesNotMatch(source, /\bXMLHttpRequest\b/);
  assert.doesNotMatch(source, /\bWebSocket\b/);
  assert.doesNotMatch(source, /\bcreateServer\s*\(/);
  assert.doesNotMatch(source, /\blisten\s*\(/);
  assert.doesNotMatch(source, /\bOctokit\b/);
  assert.doesNotMatch(source, /\baxios\b/);
  assert.doesNotMatch(source, /api\.github\.com/);
  assert.doesNotMatch(source, /api\.openai\.com/);
  assert.doesNotMatch(source, /\/api\/run/);
  assert.doesNotMatch(source, /\/mcp/);
  assert.doesNotMatch(source, /process\.env\.GITHUB_TOKEN/);
  assert.doesNotMatch(source, /process\.env\.OPENAI_API_KEY/);
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
