import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { readFile } from "node:fs/promises";

const dogfoodDocPath = "docs/OPERATOR_REVIEW_PACKET_DOGFOOD_2026_05_26.md";
const helperSourcePath = "apps/augnes_apps/scripts/codex-operator-review-packet.ts";
const smokeSourcePath = "scripts/smoke-codex-operator-review-packet-dogfood.mjs";
const fakeGithubToken = "fake-gh-token-operator-packet-dogfood";
const fakeOpenAiKey = "fake-openai-key-operator-packet-dogfood";
const hiddenMaterialBody = "Hidden dogfood body/auth/token content that must not render.";

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

const samples = [buildSampleA(), buildSampleB(), buildSampleC()];
const outputs = [];

for (const sample of samples) {
  const packet = await runPacket(sample.input);
  outputs.push(JSON.stringify(packet));
  assert.equal(packet.helper, "codex:operator-review-packet", sample.id);
  assert.equal(packet.dry_run_only, true, sample.id);
  assert.equal(packet.would_execute, false, sample.id);
  assert.deepEqual(
    packet.timeline.map((event) => event.event_type),
    sample.expectedTimeline,
    sample.id,
  );
  assertNoSecretsOrHiddenMaterial(JSON.stringify(packet));

  if (sample.id === "sample-a") {
    assertNoBlockingResolvedObservation(packet);
    assert.ok(packet.warnings.length > 0, "sample-a should warn for missing optional materials");
    assert.equal(packet.blockers.length, 0, "sample-a missing optional materials must not block");
  }

  if (sample.id === "sample-b" || sample.id === "sample-c") {
    assertBlockingResolvedObservation(packet, sample.expectedResolvedEventIndex);
    assertManualOrLocalOnlyObservation(packet);
  }
}

const doc = await readFile(dogfoodDocPath, "utf8");
assertRequiredDocSections(doc);
assertNoForbiddenOverclaims(doc, "dogfood doc");
for (const output of outputs) {
  assertNoForbiddenOverclaims(output, "packet output");
}

await assertLocalOnlySource(helperSourcePath, { helper: true });
await assertLocalOnlySource(smokeSourcePath, { helper: false });

console.log("smoke:codex-operator-review-packet-dogfood passed");

function buildSampleA() {
  return {
    id: "sample-a",
    expectedTimeline: ["task_opened", "preflight_consistency", "operator_decision"],
    input: {
      task: {
        title: "Add codex:github-comment-readiness",
        intent: "Check local preflight consistency for GitHub comment material.",
        scope: "Track B local preflight consistency helper; no posting or actuation.",
      },
      pr: {
        number: 214,
        url: "https://github.com/Aurna-code/augnes/pull/214",
        state: "merged",
        head_sha: "2142142142142142142142142142142142142142",
        merge_sha: "214f214f214f214f214f214f214f214f214f214f",
      },
      materials: {
        closeout_pipeline: { helper: "codex:closeout-pipeline" },
        action_plan: { helper: "codex:closeout-action-plan" },
        actuation_gate: null,
        actuation_preview: null,
        github_comment_readiness: {
          helper: "codex:github-comment-readiness",
          body: hiddenMaterialBody,
          auth_header: hiddenMaterialBody,
        },
        github_comment_command_preview: null,
      },
      review_events: [
        {
          event_type: "task_opened",
          summary: "Local readiness helper task was opened for preflight consistency review.",
          result: "opened",
        },
        {
          event_type: "preflight_consistency",
          summary: "Preflight consistency material stayed local and did not attempt posting.",
          result: "local_preflight_only",
        },
        {
          event_type: "operator_decision",
          summary: "Operator decision kept the material local for review.",
          result: "manual_handoff_no_actuation",
        },
      ],
      operator_decision: {
        decision: "manual_handoff_no_actuation",
        reason: "Use this as local preflight material for operator review only; do not post or actuate.",
      },
    },
  };
}

function buildSampleB() {
  return {
    id: "sample-b",
    expectedTimeline: ["task_opened", "review_finding", "follow_up_commit", "operator_decision"],
    expectedResolvedEventIndex: 3,
    input: {
      task: {
        title: "Add codex:github-comment-posting-command-preview",
        intent: "Render a local command preview envelope from readiness material.",
        scope: "Track B command preview handoff; no real posting or actuation.",
      },
      pr: {
        number: 215,
        url: "https://github.com/Aurna-code/augnes/pull/215",
        state: "merged",
        head_sha: "2152152152152152152152152152152152152152",
        merge_sha: "215f215f215f215f215f215f215f215f215f215f",
      },
      materials: {
        closeout_pipeline: { helper: "codex:closeout-pipeline" },
        action_plan: { helper: "codex:closeout-action-plan" },
        actuation_gate: { helper: "codex:actuation-gate" },
        actuation_preview: { helper: "codex:actuation-preview" },
        github_comment_readiness: { helper: "codex:github-comment-readiness" },
        github_comment_command_preview: {
          helper: "codex:github-comment-command-preview",
          token: hiddenMaterialBody,
        },
      },
      review_events: [
        {
          event_type: "task_opened",
          summary: "Initial dry-run command preview task was prepared.",
          result: "opened",
        },
        {
          event_type: "review_finding",
          summary: "Blocking review finding noted target_ref consistency was not revalidated.",
          result: "blocking",
        },
        {
          event_type: "follow_up_commit",
          summary: "Follow-up resolved target_ref parsing and pull/issue consistency.",
          result: "follow_up_resolved",
        },
        {
          event_type: "operator_decision",
          summary: "Final merge kept real posting out of scope.",
          result: "manual_handoff_no_actuation",
        },
      ],
      operator_decision: {
        decision: "manual_handoff_no_actuation",
        reason: "Use the preview for operator review only; no real posting and do not actuate.",
      },
    },
  };
}

function buildSampleC() {
  return {
    id: "sample-c",
    expectedTimeline: ["task_opened", "review_finding", "follow_up_commit", "operator_decision"],
    expectedResolvedEventIndex: 3,
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
        github_comment_command_preview: { helper: "codex:github-comment-command-preview" },
      },
      review_events: [
        {
          event_type: "task_opened",
          summary: "Initial packet helper task was opened for local operator handoff review.",
          result: "opened",
        },
        {
          event_type: "review_finding",
          summary: "Blocking review finding said perspective predicates overclaimed resolved follow-up and manual handoff.",
          result: "blocking",
        },
        {
          event_type: "follow_up_commit",
          summary: "Follow-up addressed predicate logic with explicit resolution and actuation-proceed guards.",
          result: "follow_up_resolved",
        },
        {
          event_type: "operator_decision",
          summary: "Final decision moved to local dogfood before any UI, sidecar, or actuation work.",
          result: "dogfood_next_local_only",
        },
      ],
      operator_decision: {
        decision: "dogfood_next_manual_handoff_no_actuation",
        reason: "Dogfood next with operator review only; do not post or actuate.",
      },
    },
  };
}

function runPacket(input) {
  const childEnv = {
    ...process.env,
    CODEX_OPERATOR_REVIEW_PACKET_INPUT_JSON: JSON.stringify(input),
    CODEX_OPERATOR_REVIEW_PACKET_OUTPUT: "json",
    GITHUB_TOKEN: fakeGithubToken,
    OPENAI_API_KEY: fakeOpenAiKey,
  };

  return new Promise((resolve, reject) => {
    const child = spawn("npm", ["run", "codex:operator-review-packet", "--silent"], {
      cwd: process.cwd(),
      env: childEnv,
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

function assertBlockingResolvedObservation(packet, expectedResolvedEventIndex) {
  assert.ok(
    packet.perspective_observations.some((observation) =>
      observation.includes("was blocking") && observation.includes(`later event ${expectedResolvedEventIndex}`),
    ),
    packet.pr_summary.number,
  );
}

function assertNoBlockingResolvedObservation(packet) {
  const observations = packet.perspective_observations.join("\n");
  assert.doesNotMatch(observations, /recorded a resolved follow-up/i);
  assert.doesNotMatch(observations, /was blocking/i);
}

function assertManualOrLocalOnlyObservation(packet) {
  assert.ok(
    packet.perspective_observations.some((observation) =>
      observation.includes("manual handoff/no actuation"),
    ),
    packet.pr_summary.number,
  );
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
    "Perspective usefulness observations",
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
