#!/usr/bin/env node

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  AUTHORIZED_GITHUB_REPOSITORY,
  createGitHubMainBranchTransport,
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
      "--method",
      "GET",
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
assert.doesNotMatch(source, /pulls|issues|comments|graphql|search\//iu);
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
