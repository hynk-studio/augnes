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
          "--method",
          "GET",
        ],
      });
      return normalizeBranchHead(value, branch);
    },
  });
}

function runGhApi({ operation, args }) {
  if (
    operation !== "fetch_branch_head" ||
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
