#!/usr/bin/env node

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  AUTHORIZED_GITHUB_REPOSITORY,
  createGitHubTransport,
} from "./local-canonical-github-transport.mjs";
import {
  buildPublicationEnvelope,
  renderPublicationComment,
} from "./local-canonical-pr-evidence-envelope.mjs";
import {
  reconcilePublicationComment,
} from "./local-canonical-pr-evidence.mjs";

const timestamp = "2026-07-24T12:00:00Z";
const requests = [];
const pullResponse = {
  number: 77,
  state: "open",
  draft: true,
  merged: false,
  merged_at: null,
  base: {
    ref: "main",
    sha: "1".repeat(40),
    repo: { full_name: AUTHORIZED_GITHUB_REPOSITORY },
  },
  head: {
    ref: "codex/local-canonical-pr-evidence",
    sha: "2".repeat(40),
    repo: { full_name: AUTHORIZED_GITHUB_REPOSITORY },
  },
  html_url:
    "https://github.com/hynk-studio/augnes-perspective-lab/pull/77",
};
const commentResponse = {
  id: 7001,
  body: "fixture body",
  html_url:
    "https://github.com/hynk-studio/augnes-perspective-lab/pull/77#issuecomment-7001",
  created_at: timestamp,
  updated_at: timestamp,
};
const branchResponse = {
  name: "main",
  commit: { sha: "3".repeat(40) },
};
const runner = async (request) => {
  requests.push(structuredClone(request));
  if (request.operation === "fetch_branch_head") return branchResponse;
  if (request.operation === "fetch_pull_request") return pullResponse;
  if (request.operation === "list_pull_request_comments") {
    return [[commentResponse]];
  }
  if (
    request.operation === "fetch_issue_comment" ||
    request.operation === "create_issue_comment" ||
    request.operation === "update_issue_comment"
  ) {
    return {
      ...commentResponse,
      body: request.input
        ? JSON.parse(request.input).body
        : commentResponse.body,
    };
  }
  throw new Error("unexpected fixture operation");
};
const transport = createGitHubTransport({ runner });

const pullRequest = await transport.fetchPullRequest(77);
assert.equal(pullRequest.repository_id, AUTHORIZED_GITHUB_REPOSITORY);
assert.equal(pullRequest.head_repository_id, AUTHORIZED_GITHUB_REPOSITORY);
assert.equal(pullRequest.merged, false);
assert.equal((await transport.listPullRequestComments(77)).length, 1);
assert.equal((await transport.fetchIssueComment(7001)).id, 7001);
assert.equal((await transport.createIssueComment(77, "created")).body, "created");
assert.equal((await transport.updateIssueComment(7001, "updated")).body, "updated");
const branchHead = await transport.fetchBranchHead("main");
assert.deepEqual(branchHead, {
  repository_id: AUTHORIZED_GITHUB_REPOSITORY,
  branch: "main",
  sha: "3".repeat(40),
});

for (const request of requests) {
  assert.equal(Array.isArray(request.args), true);
  assert.equal(request.args[0], "api");
  assert.equal(
    request.args[1].startsWith(
      `repos/${AUTHORIZED_GITHUB_REPOSITORY}/`,
    ),
    true,
  );
  assert.equal(request.args.some((arg) => /graphql|search\//u.test(arg)), false);
}
assert.deepEqual(requests[0].args, [
  "api",
  `repos/${AUTHORIZED_GITHUB_REPOSITORY}/pulls/77`,
  "--method",
  "GET",
]);
assert.deepEqual(requests[1].args, [
  "api",
  `repos/${AUTHORIZED_GITHUB_REPOSITORY}/issues/77/comments?per_page=100`,
  "--method",
  "GET",
  "--paginate",
  "--slurp",
]);
assert.deepEqual(requests[2].args, [
  "api",
  `repos/${AUTHORIZED_GITHUB_REPOSITORY}/issues/comments/7001`,
  "--method",
  "GET",
]);
assert.deepEqual(requests[3].args, [
  "api",
  `repos/${AUTHORIZED_GITHUB_REPOSITORY}/issues/77/comments`,
  "--method",
  "POST",
  "--input",
  "-",
]);
assert.deepEqual(requests[4].args, [
  "api",
  `repos/${AUTHORIZED_GITHUB_REPOSITORY}/issues/comments/7001`,
  "--method",
  "PATCH",
  "--input",
  "-",
]);
assert.deepEqual(requests[5].args, [
  "api",
  `repos/${AUTHORIZED_GITHUB_REPOSITORY}/branches/main`,
  "--method",
  "GET",
]);

await assert.rejects(
  transport.fetchBranchHead("develop"),
  hasCode("invalid_github_branch"),
);
await assert.rejects(
  createGitHubTransport({
    runner: async () => ({ name: "main", commit: { sha: "invalid" } }),
  }).fetchBranchHead("main"),
  hasCode("github_branch_head_response_invalid"),
);

const failingTransport = createGitHubTransport({
  runner: async () => {
    const error = new Error("private transport detail");
    error.code = "ECONNRESET";
    throw error;
  },
});
await assert.rejects(
  failingTransport.fetchPullRequest(77),
  hasCode("github_transport_failed"),
);
await assert.rejects(
  failingTransport.fetchBranchHead("main"),
  hasCode("github_transport_failed"),
);
await assert.rejects(
  failingTransport.createIssueComment(77, "body"),
  hasCode("github_transport_failed"),
);

const receipt = buildReceipt();
const preparedEnvelope = buildPublicationEnvelope({
  receipt,
  pullRequest,
  publicationCreatedAt: "2026-07-24T12:10:00.000Z",
});
const prepared = {
  envelope: preparedEnvelope,
  body: renderPublicationComment(preparedEnvelope),
};
const context = { receipt, pullRequest };

const createFixture = createStatefulTransport([]);
const createResult = await reconcilePublicationComment({
  prNumber: 77,
  replaceExisting: null,
  prepared,
  context,
  transport: createFixture.transport,
  now: () => "2026-07-24T12:11:00.000Z",
  writeArtifacts: false,
});
assert.equal(createResult.action, "created");
assert.equal(createFixture.calls.create, 1);
assert.equal(createFixture.calls.update, 0);
assert.equal(createFixture.comments.length, 1);

const noopFixture = createStatefulTransport([
  fixtureComment(7002, prepared.body, timestamp),
]);
const noopResult = await reconcilePublicationComment({
  prNumber: 77,
  replaceExisting: null,
  prepared,
  context,
  transport: noopFixture.transport,
  now: () => "2026-07-24T12:11:00.000Z",
  writeArtifacts: false,
});
assert.equal(noopResult.action, "idempotent_noop");
assert.equal(noopFixture.calls.create, 0);
assert.equal(noopFixture.calls.update, 0);
assert.equal(noopFixture.comments[0].updated_at, timestamp);

const priorEnvelope = buildPublicationEnvelope({
  receipt,
  pullRequest,
  publicationCreatedAt: "2026-07-24T12:05:00.000Z",
});
const priorBody = renderPublicationComment(priorEnvelope);
const refusalFixture = createStatefulTransport([
  fixtureComment(7003, priorBody, timestamp),
]);
await assert.rejects(
  reconcilePublicationComment({
    prNumber: 77,
    replaceExisting: null,
    prepared,
    context,
    transport: refusalFixture.transport,
    now: () => "2026-07-24T12:12:00.000Z",
    writeArtifacts: false,
  }),
  hasCode("replacement_authority_required"),
);
assert.equal(refusalFixture.calls.update, 0);

await assert.rejects(
  reconcilePublicationComment({
    prNumber: 77,
    replaceExisting: "9".repeat(64),
    prepared,
    context,
    transport: refusalFixture.transport,
    now: () => "2026-07-24T12:12:00.000Z",
    writeArtifacts: false,
  }),
  hasCode("replacement_authority_required"),
);
assert.equal(refusalFixture.calls.update, 0);

const replacementFixture = createStatefulTransport([
  fixtureComment(7004, priorBody, timestamp),
]);
const replacementResult = await reconcilePublicationComment({
  prNumber: 77,
  replaceExisting: priorEnvelope.integrity.content_fingerprint,
  prepared,
  context,
  transport: replacementFixture.transport,
  now: () => "2026-07-24T12:12:00.000Z",
  writeArtifacts: false,
});
assert.equal(replacementResult.action, "updated");
assert.equal(replacementFixture.calls.create, 0);
assert.equal(replacementFixture.calls.update, 1);
assert.equal(
  replacementResult.prepared.envelope.publication
    .superseded_publication_fingerprint,
  priorEnvelope.integrity.content_fingerprint,
);

const repeatedReplacement = await reconcilePublicationComment({
  prNumber: 77,
  replaceExisting: null,
  prepared: replacementResult.prepared,
  context,
  transport: replacementFixture.transport,
  now: () => "2026-07-24T12:13:00.000Z",
  writeArtifacts: false,
});
assert.equal(repeatedReplacement.action, "idempotent_noop");
assert.equal(replacementFixture.calls.update, 1);

const concurrentFixture = createStatefulTransport([
  fixtureComment(7005, priorBody, timestamp),
], {
  fetchOverride: () =>
    fixtureComment(
      7005,
      renderPublicationComment(
        buildPublicationEnvelope({
          receipt,
          pullRequest,
          publicationCreatedAt: "2026-07-24T12:06:00.000Z",
        }),
      ),
      "2026-07-24T12:00:01.000Z",
    ),
});
await assert.rejects(
  reconcilePublicationComment({
    prNumber: 77,
    replaceExisting: priorEnvelope.integrity.content_fingerprint,
    prepared,
    context,
    transport: concurrentFixture.transport,
    now: () => "2026-07-24T12:12:00.000Z",
    writeArtifacts: false,
  }),
  hasCode("publication_comment_changed_before_update"),
);
assert.equal(concurrentFixture.calls.update, 0);

const unrelatedComment = fixtureComment(
  7999,
  "unrelated review comment",
  timestamp,
);
const unrelatedFixture = createStatefulTransport([
  unrelatedComment,
  fixtureComment(7006, prepared.body, timestamp),
]);
await reconcilePublicationComment({
  prNumber: 77,
  replaceExisting: null,
  prepared,
  context,
  transport: unrelatedFixture.transport,
  now: () => "2026-07-24T12:13:00.000Z",
  writeArtifacts: false,
});
assert.equal(unrelatedFixture.comments[0].body, "unrelated review comment");
assert.equal(unrelatedFixture.calls.update, 0);

const source = readFileSync(
  new URL("./local-canonical-github-transport.mjs", import.meta.url),
  "utf8",
);
assert.match(source, /spawnSync\("gh", args/u);
assert.match(source, /shell: false/u);
assert.match(source, /result\.status === 4/u);
assert.match(source, /github_authentication_unavailable/u);
assert.doesNotMatch(
  source,
  /repos\/\$\{[^}]*\}\/(?:statuses|check-runs|deployments|actions\/workflows)/u,
);
assert.doesNotMatch(source, /GITHUB_TOKEN|GH_TOKEN|auth status|credential/iu);
assert.doesNotMatch(source, /\bdeleteIssueComment\b|\bdeleteComment\b/u);

console.log(
  JSON.stringify(
    {
      test: "local_canonical_pr_evidence_transport",
      status: "pass",
      fixed_repository_endpoints: true,
      argument_safe_gh_spawn: true,
      exact_main_branch_read_bounded: true,
      authentication_unavailable_normalized: true,
      token_and_auth_output_not_logged: true,
      transport_errors_fail_closed: true,
      write_responses_confirmed: true,
      create_and_update_paths_bounded: true,
      idempotent_noop_zero_writes: true,
      replacement_requires_exact_prior_fingerprint: true,
      changed_remote_body_refused: true,
      replacement_records_superseded_fingerprint: true,
      unrelated_comments_unchanged: true,
      no_delete_status_check_deployment_or_workflow_path: true,
    },
    null,
    2,
  ),
);

function createStatefulTransport(initialComments, { fetchOverride = null } = {}) {
  const comments = structuredClone(initialComments);
  const calls = { list: 0, fetch: 0, create: 0, update: 0 };
  const transport = {
    async listPullRequestComments() {
      calls.list += 1;
      return structuredClone(comments);
    },
    async fetchIssueComment(id) {
      calls.fetch += 1;
      if (fetchOverride) return structuredClone(fetchOverride(id));
      const comment = comments.find((candidate) => candidate.id === id);
      assert(comment);
      return structuredClone(comment);
    },
    async createIssueComment(_prNumber, body) {
      calls.create += 1;
      const comment = fixtureComment(8000, body, timestamp);
      comments.push(comment);
      return structuredClone(comment);
    },
    async updateIssueComment(id, body) {
      calls.update += 1;
      const comment = comments.find((candidate) => candidate.id === id);
      assert(comment);
      comment.body = body;
      comment.updated_at = "2026-07-24T12:12:01.000Z";
      return structuredClone(comment);
    },
  };
  return { transport, comments, calls };
}

function fixtureComment(id, body, updatedAt) {
  return {
    id,
    body,
    url:
      `https://github.com/hynk-studio/augnes-perspective-lab/pull/77#issuecomment-${id}`,
    created_at: timestamp,
    updated_at: updatedAt,
  };
}

function buildReceipt() {
  const commands = {
    "dependencies-root": "npm ci --no-audit --no-fund",
    "dependencies-nested": "npm ci --no-audit --no-fund",
    typecheck: "npm run typecheck",
    build: "npm run build",
    unit: "npm test",
    authority: "npm run test:authority",
    integration: "npm run test:integration",
    operability: "npm run test:operability",
    "e2e-project-experience": "npm run test:e2e:project-experience",
    "e2e-operator-review-control":
      "node scripts/run-canonical-test-suite.mjs e2e-operator-review-control",
    "e2e-operator-native-host-execution":
      "node scripts/run-canonical-test-suite.mjs e2e-operator-native-host-execution",
    "e2e-operator-multi-candidate":
      "node scripts/run-canonical-test-suite.mjs e2e-operator-multi-candidate",
    "e2e-continuity": "npm run test:e2e:continuity",
    "e2e-golden": "npm run test:e2e:golden",
  };
  return {
    schema: "augnes.local-canonical-receipt.v1",
    repository: {
      repository_id: AUTHORIZED_GITHUB_REPOSITORY,
      origin:
        "https://github.com/hynk-studio/augnes-perspective-lab.git",
      base_sha: pullRequest.base_sha,
      head_sha: pullRequest.head_sha,
      branch: pullRequest.head_branch,
      worktree_before: "clean",
      worktree_after: "clean",
    },
    dependencies: {
      root_lock_sha256: "3".repeat(64),
      nested_lock_sha256: "4".repeat(64),
    },
    environment: {
      operating_system: "macOS",
      operating_system_version: "26.5.2",
      architecture: "arm64",
      npm_version: "11.16.0",
      node: {
        canonical_version: "24.18.0",
        actual_version: "24.18.0",
        canonical_match: true,
      },
    },
    executor: { source_fingerprint: "5".repeat(64) },
    evidence: {
      mode: "full",
      planner_event: "pull_request",
      selected_plan: "full-canonical",
      deciding: true,
      transferable: true,
    },
    run: {
      started_at: "2026-07-24T11:00:00.000Z",
      finished_at: "2026-07-24T11:20:00.000Z",
      duration_ms: 1_200_000,
    },
    phases: Object.entries(commands).map(([id, command]) => ({
      id,
      command,
      status: "pass",
      duration_ms: 1_000,
      timed_out: false,
      cleanup: { completed: true, remaining_owned_processes: 0 },
    })),
    cleanup: { completed: true, remaining_owned_processes: 0 },
    final: { result: "pass" },
    integrity: { content_fingerprint: "6".repeat(64) },
  };
}

function hasCode(code) {
  return (error) => error?.code === code;
}
