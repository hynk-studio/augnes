#!/usr/bin/env node

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  AUTHORIZED_GITHUB_REPOSITORY,
  createGitHubMainBranchTransport,
  createGitHubObserverAuthorizationTransport,
} from "./github-main-branch-transport.mjs";

const requests = [];
const transport = createGitHubMainBranchTransport({
  runner: async (request) => {
    requests.push(structuredClone(request));
    return {
      name: "main",
      commit: { sha: "3".repeat(40) },
    };
  },
});

assert.deepEqual(Object.keys(transport), ["fetchBranchHead"]);
assert.deepEqual(await transport.fetchBranchHead("main"), {
  repository_id: AUTHORIZED_GITHUB_REPOSITORY,
  branch: "main",
  sha: "3".repeat(40),
});
assert.deepEqual(requests, [
  {
    operation: "fetch_branch_head",
    args: [
      "api",
      `repos/${AUTHORIZED_GITHUB_REPOSITORY}/branches/main`,
      "--hostname",
      "github.com",
      "--method",
      "GET",
      "--header",
      "Cache-Control: no-cache",
    ],
  },
]);

await assert.rejects(
  transport.fetchBranchHead("develop"),
  hasCode("invalid_github_branch"),
);
await assert.rejects(
  createGitHubMainBranchTransport({
    runner: async () => ({ name: "main", commit: { sha: "invalid" } }),
  }).fetchBranchHead("main"),
  hasCode("github_branch_head_response_invalid"),
);
await assert.rejects(
  createGitHubMainBranchTransport({
    runner: async () => {
      const error = new Error("private transport detail");
      error.code = "ECONNRESET";
      throw error;
    },
  }).fetchBranchHead("main"),
  hasCode("github_transport_failed"),
);
await assert.rejects(
  createGitHubMainBranchTransport({
    runner: async () => {
      const error = new Error("authentication detail");
      error.code = "github_authentication_unavailable";
      throw error;
    },
  }).fetchBranchHead("main"),
  hasCode("github_authentication_unavailable"),
);

const source = readFileSync(
  new URL("./github-main-branch-transport.mjs", import.meta.url),
  "utf8",
);
assert.match(source, /spawnSync\("gh", args/u);
assert.match(source, /shell: false/u);
assert.match(source, /result\.status === 4/u);
assert.match(source, /github_authentication_unavailable/u);
assert.match(
  source,
  /repos\/\$\{AUTHORIZED_GITHUB_REPOSITORY\}\/branches\/\$\{branch\}/u,
);
const mainSurface = source.slice(source.indexOf("export function createGitHubMainBranchTransport"), source.indexOf("export function createGitHubObserverAuthorizationTransport"));
assert.doesNotMatch(mainSurface, /pulls|issues|comments|graphql|search\//iu);
assert.doesNotMatch(source, /graphql|search\//iu);
const authorityRequests = [];
const authority = createGitHubObserverAuthorizationTransport(1700, { runner: async request => { authorityRequests.push(request); return {}; } });
await authority.pullRequest(); await authority.review(101); await authority.grant(202); await authority.permission("fixture-owner");
assert.deepEqual(authorityRequests.map(request => request.args[1]), ["repos/hynk-studio/augnes/pulls/1700", "repos/hynk-studio/augnes/pulls/1700/reviews/101", "repos/hynk-studio/augnes/issues/comments/202", "repos/hynk-studio/augnes/collaborators/fixture-owner/permission"]);
assert(authorityRequests.every(request => request.operation === "fetch_browser_authority" && request.args.includes("GET") && request.args.includes("Cache-Control: no-cache")));
for (const value of [-1, 0, "1700", "https://other.example", Infinity]) {
  assert.throws(() => createGitHubObserverAuthorizationTransport(value));
  assert.throws(() => authority.review(value)); assert.throws(() => authority.grant(value));
}
assert.throws(() => authority.permission("../outside"));
assert.doesNotMatch(source, /--input|"POST"|"PATCH"|"DELETE"/u);
assert.doesNotMatch(
  source,
  /GITHUB_TOKEN|GH_TOKEN|auth status|credential/iu,
);

console.log(
  JSON.stringify(
    {
      test: "github_main_branch_transport",
      status: "pass",
      fixed_repository_and_main_branch: true,
      argument_safe_gh_spawn: true,
      authentication_unavailable_normalized: true,
      transport_errors_fail_closed: true,
      read_only_api_surface: true,
      pull_request_comment_write_surface_absent: true,
    },
    null,
    2,
  ),
);

function hasCode(code) {
  return (error) => error?.code === code;
}
