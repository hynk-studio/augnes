import { spawnSync } from "node:child_process";

export const AUTHORIZED_GITHUB_REPOSITORY =
  "hynk-studio/augnes-perspective-lab";
export const GITHUB_TRANSPORT_TIMEOUT_MS = 30_000;
export const GITHUB_TRANSPORT_MAX_BYTES = 2 * 1024 * 1024;

export function createGitHubTransport({ runner = runGhApi } = {}) {
  return Object.freeze({
    async fetchBranchHead(branch) {
      assertBranch(branch);
      const value = await invoke(runner, {
        operation: "fetch_branch_head",
        args: [
          "api",
          `repos/${AUTHORIZED_GITHUB_REPOSITORY}/branches/${branch}`,
          "--method",
          "GET",
        ],
      });
      return normalizeBranchHead(value, branch);
    },

    async fetchPullRequest(prNumber) {
      assertPrNumber(prNumber);
      const value = await invoke(runner, {
        operation: "fetch_pull_request",
        args: [
          "api",
          `repos/${AUTHORIZED_GITHUB_REPOSITORY}/pulls/${prNumber}`,
          "--method",
          "GET",
        ],
      });
      return normalizePullRequest(value);
    },

    async listPullRequestComments(prNumber) {
      assertPrNumber(prNumber);
      const value = await invoke(runner, {
        operation: "list_pull_request_comments",
        args: [
          "api",
          `repos/${AUTHORIZED_GITHUB_REPOSITORY}/issues/${prNumber}/comments?per_page=100`,
          "--method",
          "GET",
          "--paginate",
          "--slurp",
        ],
      });
      const pages =
        Array.isArray(value) && value.every((page) => Array.isArray(page))
          ? value
          : [value];
      const comments = pages.flat();
      if (
        !Array.isArray(comments) ||
        comments.length > 1_000
      ) {
        throw transportError(
          "github_comment_inventory_unbounded",
          "GitHub comment inventory is invalid or exceeds its bound",
        );
      }
      return comments.map(normalizeComment);
    },

    async fetchIssueComment(commentId) {
      assertRemoteCommentId(commentId);
      const value = await invoke(runner, {
        operation: "fetch_issue_comment",
        args: [
          "api",
          `repos/${AUTHORIZED_GITHUB_REPOSITORY}/issues/comments/${commentId}`,
          "--method",
          "GET",
        ],
      });
      return normalizeComment(value);
    },

    async createIssueComment(prNumber, body) {
      assertPrNumber(prNumber);
      assertCommentBody(body);
      const value = await invoke(runner, {
        operation: "create_issue_comment",
        args: [
          "api",
          `repos/${AUTHORIZED_GITHUB_REPOSITORY}/issues/${prNumber}/comments`,
          "--method",
          "POST",
          "--input",
          "-",
        ],
        input: JSON.stringify({ body }),
      });
      return normalizeComment(value);
    },

    async updateIssueComment(commentId, body) {
      assertRemoteCommentId(commentId);
      assertCommentBody(body);
      const value = await invoke(runner, {
        operation: "update_issue_comment",
        args: [
          "api",
          `repos/${AUTHORIZED_GITHUB_REPOSITORY}/issues/comments/${commentId}`,
          "--method",
          "PATCH",
          "--input",
          "-",
        ],
        input: JSON.stringify({ body }),
      });
      return normalizeComment(value);
    },
  });
}

export function runGhApi({ operation, args, input = undefined }) {
  if (
    typeof operation !== "string" ||
    !Array.isArray(args) ||
    args.some((arg) => typeof arg !== "string")
  ) {
    throw transportError(
      "invalid_github_transport_request",
      "GitHub transport request is invalid",
    );
  }
  const result = spawnSync("gh", args, {
    cwd: process.cwd(),
    encoding: "utf8",
    input,
    timeout: GITHUB_TRANSPORT_TIMEOUT_MS,
    maxBuffer: GITHUB_TRANSPORT_MAX_BYTES,
    windowsHide: true,
    shell: false,
    stdio: ["pipe", "pipe", "pipe"],
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

export function assertPrNumber(value) {
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw transportError(
      "invalid_pull_request_number",
      "pull request number must be a positive integer",
    );
  }
  return value;
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

function normalizePullRequest(value) {
  if (!value || typeof value !== "object") {
    throw transportError(
      "github_pull_request_response_invalid",
      "GitHub pull request response is invalid",
    );
  }
  const normalized = {
    repository_id: value.base?.repo?.full_name ?? null,
    number: value.number,
    state: value.state,
    draft: value.draft,
    merged:
      value.merged === true ||
      (typeof value.merged_at === "string" &&
        value.merged_at.length > 0),
    base_branch: value.base?.ref ?? null,
    base_sha: value.base?.sha ?? null,
    head_branch: value.head?.ref ?? null,
    head_sha: value.head?.sha ?? null,
    head_repository_id: value.head?.repo?.full_name ?? null,
    url: value.html_url ?? null,
  };
  if (
    normalized.repository_id !== AUTHORIZED_GITHUB_REPOSITORY ||
    !Number.isSafeInteger(normalized.number) ||
    normalized.number <= 0 ||
    !["open", "closed"].includes(normalized.state) ||
    typeof normalized.draft !== "boolean" ||
    typeof normalized.merged !== "boolean" ||
    typeof normalized.base_branch !== "string" ||
    !isSha(normalized.base_sha) ||
    typeof normalized.head_branch !== "string" ||
    !isSha(normalized.head_sha) ||
    typeof normalized.head_repository_id !== "string" ||
    !isAuthorizedUrl(normalized.url)
  ) {
    throw transportError(
      "github_pull_request_response_invalid",
      "GitHub pull request identity response is invalid",
    );
  }
  return normalized;
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

function normalizeComment(value) {
  if (!value || typeof value !== "object") {
    throw transportError(
      "github_comment_response_invalid",
      "GitHub comment response is invalid",
    );
  }
  const normalized = {
    id: value.id,
    body: value.body,
    url: value.html_url,
    created_at: value.created_at,
    updated_at: value.updated_at,
  };
  if (
    !Number.isSafeInteger(normalized.id) ||
    normalized.id <= 0 ||
    typeof normalized.body !== "string" ||
    Buffer.byteLength(normalized.body, "utf8") >
      GITHUB_TRANSPORT_MAX_BYTES ||
    !isAuthorizedUrl(normalized.url) ||
    !isIsoTimestamp(normalized.created_at) ||
    !isIsoTimestamp(normalized.updated_at)
  ) {
    throw transportError(
      "github_comment_response_invalid",
      "GitHub comment response is invalid",
    );
  }
  return normalized;
}

function assertRemoteCommentId(value) {
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw transportError(
      "invalid_remote_comment_id",
      "remote comment ID is invalid",
    );
  }
}

function assertCommentBody(value) {
  if (
    typeof value !== "string" ||
    value.length === 0 ||
    Buffer.byteLength(value, "utf8") > GITHUB_TRANSPORT_MAX_BYTES
  ) {
    throw transportError(
      "invalid_github_comment_body",
      "GitHub comment body is invalid or unbounded",
    );
  }
}

function isAuthorizedUrl(value) {
  if (typeof value !== "string") return false;
  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      url.hostname === "github.com" &&
      url.pathname.startsWith(`/${AUTHORIZED_GITHUB_REPOSITORY}/`)
    );
  } catch {
    return false;
  }
}

function isSha(value) {
  return typeof value === "string" && /^[0-9a-f]{40}$/u.test(value);
}

function isIsoTimestamp(value) {
  return (
    typeof value === "string" &&
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/u.test(value) &&
    Number.isFinite(Date.parse(value))
  );
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
