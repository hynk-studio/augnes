import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import http from "node:http";

const codexScope = "project:custom-scope";
const legacyAugnesScope = "project:legacy-scope";
let expectedScope = codexScope;
const workId = "AG-001";
const calls = [];

let workMode = "valid";

const server = http.createServer((req, res) => {
  calls.push({ method: req.method, url: req.url });

  if (req.method !== "GET") {
    sendJson(res, 405, { error: "method not allowed" });
    return;
  }

  const url = new URL(req.url ?? "/", "http://localhost");

  if (url.pathname === "/api/state/brief") {
    assert.equal(url.searchParams.get("scope"), expectedScope);
    sendJson(res, 200, stateBriefFixture());
    return;
  }

  if (url.pathname === `/api/work/${workId}/brief`) {
    assert.equal(url.searchParams.get("scope"), expectedScope);

    if (workMode === "invalid") {
      sendJson(res, 200, { runtime: "augnes", scope: expectedScope, work_id: workId });
      return;
    }

    if (workMode === "missing") {
      sendJson(res, 404, { error: "unknown work_id" });
      return;
    }

    sendJson(res, 200, workBriefFixture());
    return;
  }

  sendJson(res, 404, { error: "not found" });
});

try {
  await listen(server);
  const { port } = server.address();
  const apiBaseUrl = `http://127.0.0.1:${port}`;

  const stateOnly = await runReadBrief({ apiBaseUrl });
  assert.equal(stateOnly.status, 0, stateOnly.stderr);
  assert.match(stateOnly.stdout, /Augnes state brief/);
  assert.doesNotMatch(stateOnly.stdout, /Augnes work brief/);
  assert.equal(countCalls("/api/state/brief"), 1);
  assert.equal(countCalls(`/api/work/${workId}/brief`), 0);

  resetCalls();

  expectedScope = legacyAugnesScope;
  const legacyScopeFallback = await runReadBrief({
    apiBaseUrl,
    scopeMode: "augnes-only",
    workId,
  });
  assert.equal(legacyScopeFallback.status, 0, legacyScopeFallback.stderr);
  assert.match(legacyScopeFallback.stdout, new RegExp(`scope: ${legacyAugnesScope}`));
  assert.equal(countCalls("/api/state/brief"), 1);
  assert.equal(countCalls(`/api/work/${workId}/brief`), 1);
  assertNoMutationCalls();

  resetCalls();
  expectedScope = codexScope;

  const withWork = await runReadBrief({ apiBaseUrl, workId });
  assert.equal(withWork.status, 0, withWork.stderr);
  assert.match(withWork.stdout, /Augnes state brief/);
  assert.match(withWork.stdout, /Augnes work brief/);
  assert.match(withWork.stdout, /work_id: AG-001/);
  assert.match(withWork.stdout, /title: Review anchor handoff follow-through/);
  assert.match(withWork.stdout, /status: planned/);
  assert.match(withWork.stdout, /next_action: Use Work Brief context in Codex start helper\./);
  assert.match(withWork.stdout, /user_attention_required: false/);
  assert.match(withWork.stdout, /related_state_keys count: 2/);
  assert.match(withWork.stdout, /coordination.work_brief/);
  assert.match(withWork.stdout, /codex_handoff\.task_brief:/);
  assert.match(withWork.stdout, /codex_handoff\.constraints:/);
  assert.match(withWork.stdout, /docs\/PR_REVIEW_ANCHOR_CONVENTION_V0_1\.md/);
  assert.match(withWork.stdout, /codex_handoff\.suggested_verification:/);
  assert.match(withWork.stdout, /npm run smoke:temporal-work-seed/);
  assert.match(withWork.stdout, /related_proof\.action_ids:/);
  assert.match(withWork.stdout, /related_proof\.prs:/);
  assert.match(withWork.stdout, /related_proof\.docs:/);
  assert.equal(countCalls("/api/state/brief"), 1);
  assert.equal(countCalls(`/api/work/${workId}/brief`), 1);
  assertNoMutationCalls();

  resetCalls();
  workMode = "invalid";

  const invalidWork = await runReadBrief({ apiBaseUrl, workId });
  assert.notEqual(invalidWork.status, 0);
  assert.match(invalidWork.stderr, /CODEX_READ_BRIEF_INVALID_WORK_RESPONSE/);
  assert.equal(countCalls("/api/state/brief"), 1);
  assert.equal(countCalls(`/api/work/${workId}/brief`), 1);
  assertNoMutationCalls();

  resetCalls();
  workMode = "missing";

  const missingWork = await runReadBrief({ apiBaseUrl, workId });
  assert.notEqual(missingWork.status, 0);
  assert.match(missingWork.stderr, /CODEX_READ_BRIEF_WORK_REQUEST_FAILED status=404/);
  assert.equal(countCalls("/api/state/brief"), 1);
  assert.equal(countCalls(`/api/work/${workId}/brief`), 1);
  assertNoMutationCalls();

  console.log(
    JSON.stringify(
      {
        smoke: "codex-read-brief-work",
        state_only_calls_state_brief: true,
        state_only_calls_work_brief: false,
        codex_scope_precedence_checked: true,
        augnes_scope_fallback_checked: true,
        work_id_calls_state_and_work_brief: true,
        work_output_includes_constraints: true,
        work_output_includes_review_anchor_convention: true,
        work_output_includes_suggested_verification: true,
        invalid_work_response_failed_closed: true,
        missing_work_response_failed_closed: true,
        openai_calls: 0,
        github_calls: 0,
        mutation_routes_called: false,
      },
      null,
      2,
    ),
  );
} finally {
  await close(server);
}

function runReadBrief({ apiBaseUrl, workId: maybeWorkId, scopeMode = "codex-preferred" }) {
  const env = {
    ...process.env,
    AUGNES_API_BASE_URL: apiBaseUrl,
    AUGNES_SCOPE: legacyAugnesScope,
    OPENAI_API_KEY: "smoke-openai-key-must-not-be-used",
  };

  if (scopeMode === "codex-preferred") {
    env.CODEX_SCOPE = codexScope;
  } else {
    delete env.CODEX_SCOPE;
  }

  if (maybeWorkId) {
    env.CODEX_WORK_ID = maybeWorkId;
  } else {
    delete env.CODEX_WORK_ID;
  }

  return new Promise((resolve) => {
    const child = spawn("npm", ["--prefix", "apps/augnes_apps", "run", "codex:read-brief"], {
      cwd: process.cwd(),
      env,
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
      resolve({ status, stdout, stderr });
    });
  });
}

function stateBriefFixture() {
  return {
    runtime: "augnes",
    scope: expectedScope,
    active_state: [{ state_id: "state:1" }],
    pending_proposals: [],
    recent_actions: [{ action_id: "action:1" }],
    open_tensions: [],
    agent_instructions: ["Use repo-local context before implementation."],
  };
}

function workBriefFixture() {
  return {
    runtime: "augnes",
    scope: expectedScope,
    work_id: workId,
    as_of: "2026-05-24T00:00:00.000Z",
    work: {
      work_id: workId,
      title: "Review anchor handoff follow-through",
      status: "planned",
      priority: "normal",
      summary: "Use Work Brief context in Codex start helper.",
      next_action: "Use Work Brief context in Codex start helper.",
      user_attention_required: false,
      related_state_keys: ["coordination.work_brief"],
      links: {},
      created_at: "2026-05-24T00:00:00.000Z",
      updated_at: "2026-05-24T00:00:00.000Z",
    },
    next_action: "Use Work Brief context in Codex start helper.",
    user_attention_required: false,
    recent_events: [],
    related_state_keys: ["coordination.work_brief", "coordination.review_anchor"],
    related_proof: {
      action_ids: ["action:work-brief"],
      prs: ["https://github.com/Aurna-code/augnes/pull/198"],
      docs: ["docs/PR_REVIEW_ANCHOR_CONVENTION_V0_1.md"],
      links: {},
    },
    codex_handoff: {
      task_brief: "AG-001: Review anchor handoff follow-through.",
      constraints: [
        "Treat work_id as a trace anchor, not a second source of truth.",
        "For boundary-relevant PR review findings, use PR comments or review comments as repo-anchored review anchors per docs/PR_REVIEW_ANCHOR_CONVENTION_V0_1.md.",
        "Treat review anchors as review aids only, not source of truth, proof, evidence status, readiness, score, benchmark, runtime authority, or implementation approval.",
      ],
      suggested_verification: [
        "npm run smoke:temporal-work-seed",
        "npm run smoke:codex-read-brief-work",
      ],
      work_event_template: {
        work_id: workId,
        scope: expectedScope,
        actor: "codex",
        event_type: "implementation",
        summary: "Summarize the human-readable work result.",
        related_action_id: null,
        related_pr: null,
        related_state_keys: ["coordination.work_brief"],
      },
    },
  };
}

function sendJson(res, status, body) {
  res.writeHead(status, { "content-type": "application/json" });
  res.end(JSON.stringify(body));
}

function countCalls(pathname) {
  return calls.filter((call) => new URL(call.url ?? "/", "http://localhost").pathname === pathname)
    .length;
}

function resetCalls() {
  calls.length = 0;
}

function assertNoMutationCalls() {
  assert.ok(
    calls.every((call) => call.method === "GET"),
    "codex:read-brief smoke should only observe GET calls",
  );
  assert.ok(
    calls.every((call) => {
      const pathname = new URL(call.url ?? "/", "http://localhost").pathname;
      return pathname === "/api/state/brief" || pathname === `/api/work/${workId}/brief`;
    }),
    "codex:read-brief smoke should not call mutation or provider routes",
  );
}

function listen(target) {
  return new Promise((resolve) => {
    target.listen(0, "127.0.0.1", resolve);
  });
}

function close(target) {
  return new Promise((resolve, reject) => {
    target.close((error) => {
      if (error) reject(error);
      else resolve();
    });
  });
}
