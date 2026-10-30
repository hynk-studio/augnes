import { spawnSync } from "node:child_process";

export const AUTHORIZED_GITHUB_REPOSITORY =
  "hynk-studio/augnes";
export const GITHUB_TRANSPORT_TIMEOUT_MS = 30_000;
export const GITHUB_TRANSPORT_MAX_BYTES = 2 * 1024 * 1024;

export function createGitHubMainBranchTransport({ runner = runGhApi } = {}) {
  return Object.freeze({
    async fetchBranchHead(branch) {
      assertBranch(branch);
      const value = await invoke(runner, {
        operation: "fetch_branch_head",
        args: [
          "api",
          `repos/${AUTHORIZED_GITHUB_REPOSITORY}/branches/${branch}`,
          "--hostname",
          "github.com",
          "--method",
          "GET",
          "--header",
          "Cache-Control: no-cache",
        ],
      });
      return normalizeBranchHead(value, branch);
    },
  });
}

// The same authenticated, bounded, GET-only transport is used for this single
// repository's Browser replacement review/grant. No caller-supplied URL, shell,
// bearer value or local approval flag is accepted.
export function createGitHubBrowserAuthorizationTransport({ runner = runGhApi } = {}) {
  const get = endpoint => invoke(runner, { operation: "fetch_browser_authority", args: ["api", `repos/${AUTHORIZED_GITHUB_REPOSITORY}/${endpoint}`, "--hostname", "github.com", "--method", "GET", "--header", "Cache-Control: no-cache"] });
  return Object.freeze({
    review(id) { if (!Number.isSafeInteger(id) || id <= 0) throw transportError("github_review_id_invalid", "Invalid review identity"); return get(`pulls/1546/reviews/${id}`); },
    grant(id) { if (!Number.isSafeInteger(id) || id <= 0) throw transportError("github_grant_id_invalid", "Invalid grant identity"); return get(`issues/comments/${id}`); },
    permission(login) { if (!/^[A-Za-z0-9-]{1,39}$/u.test(login ?? "")) throw transportError("github_author_invalid", "Invalid author identity"); return get(`collaborators/${login}/permission`); },
  });
}

// Same bounded GET-only authenticated transport, with an exact case PR binding.
export function createGitHubObserverAuthorizationTransport(pullRequest, { runner = runGhApi } = {}) {
  if (!Number.isSafeInteger(pullRequest) || pullRequest <= 0) throw transportError("github_pull_request_invalid", "Invalid pull request identity");
  const get = endpoint => invoke(runner, { operation: "fetch_browser_authority", args: ["api", `repos/${AUTHORIZED_GITHUB_REPOSITORY}/${endpoint}`, "--hostname", "github.com", "--method", "GET", "--header", "Cache-Control: no-cache"] });
  const id = value => { if (!Number.isSafeInteger(value) || value <= 0) throw transportError("github_authority_id_invalid", "Invalid authority identity"); return value; };
  return Object.freeze({
    pullRequest() { return get(`pulls/${pullRequest}`); },
    review(value) { return get(`pulls/${pullRequest}/reviews/${id(value)}`); },
    grant(value) { return get(`issues/comments/${id(value)}`); },
    permission(login) { if (!/^[A-Za-z0-9-]{1,39}$/u.test(login ?? "")) throw transportError("github_author_invalid", "Invalid author identity"); return get(`collaborators/${login}/permission`); },
  });
}

function runGhApi({ operation, args }) {
  if (
    !["fetch_branch_head", "fetch_browser_authority"].includes(operation) ||
    !Array.isArray(args) ||
    args.some((arg) => typeof arg !== "string")
  ) {
    throw transportError(
      "invalid_github_transport_request",
      "GitHub source-attestation request is invalid",
    );
  }
  const result = spawnSync("gh", args, {
    cwd: process.cwd(),
    encoding: "utf8",
    timeout: GITHUB_TRANSPORT_TIMEOUT_MS,
    maxBuffer: GITHUB_TRANSPORT_MAX_BYTES,
    windowsHide: true,
    shell: false,
    stdio: ["ignore", "pipe", "pipe"],
  });
  if (result.error?.code === "ETIMEDOUT" || result.signal) {
    throw transportError(
      "github_transport_timeout",
      `GitHub ${safeOperation(operation)} request timed out`,
    );
  }
  if (result.status === 4) {
    throw transportError(
      "github_authentication_unavailable",
      `GitHub ${safeOperation(operation)} authentication is unavailable`,
    );
  }
  if (result.error || result.status !== 0) {
    throw transportError(
      "github_transport_failed",
      `GitHub ${safeOperation(operation)} request failed closed`,
    );
  }
  if (
    typeof result.stdout !== "string" ||
    Buffer.byteLength(result.stdout, "utf8") > GITHUB_TRANSPORT_MAX_BYTES
  ) {
    throw transportError(
      "github_transport_response_unbounded",
      `GitHub ${safeOperation(operation)} response exceeded its bound`,
    );
  }
  try {
    return JSON.parse(result.stdout);
  } catch {
    throw transportError(
      "github_transport_invalid_json",
      `GitHub ${safeOperation(operation)} response was not valid JSON`,
    );
  }
}

function assertBranch(value) {
  if (value !== "main") {
    throw transportError(
      "invalid_github_branch",
      "GitHub branch must be the exact authorized main branch",
    );
  }
}

async function invoke(runner, request) {
  try {
    return await runner(request);
  } catch (error) {
    if (error?.code && String(error.code).startsWith("github_")) throw error;
    throw transportError(
      "github_transport_failed",
      `GitHub ${safeOperation(request.operation)} request failed closed`,
    );
  }
}

function normalizeBranchHead(value, expectedBranch) {
  if (!value || typeof value !== "object") {
    throw transportError(
      "github_branch_head_response_invalid",
      "GitHub branch-head response is invalid",
    );
  }
  const normalized = {
    repository_id: AUTHORIZED_GITHUB_REPOSITORY,
    branch: value.name ?? null,
    sha: value.commit?.sha ?? null,
  };
  if (
    normalized.branch !== expectedBranch ||
    !isSha(normalized.sha)
  ) {
    throw transportError(
      "github_branch_head_response_invalid",
      "GitHub branch-head identity response is invalid",
    );
  }
  return normalized;
}

function isSha(value) {
  return typeof value === "string" && /^[0-9a-f]{40}$/u.test(value);
}

function safeOperation(value) {
  return typeof value === "string" &&
    /^[a-z0-9_]{1,64}$/u.test(value)
    ? value
    : "api";
}

function transportError(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}
