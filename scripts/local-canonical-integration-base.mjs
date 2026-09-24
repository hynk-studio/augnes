import { spawnSync } from "node:child_process";

import { CANONICAL_REPOSITORY_ID } from "./canonical-repository-identity.mjs";
import { createGitHubMainBranchTransport } from "./github-main-branch-transport.mjs";
import { assertExactSha } from "./local-canonical-environment.mjs";

export const INTEGRATION_BASE_CONTRACT = "augnes.local-canonical-integration-base.v1";
export const INTEGRATION_BASE_SOURCE = "github_authenticated_main_branch_get";

// No tracking-ref fallback and no fetch/write: this is an observation, not a
// reservation of GitHub main through the eventual merge.
export async function admitIntegrationBase({
  repositoryRoot,
  baseSha,
  headSha,
  transport = createGitHubMainBranchTransport(),
  now = () => new Date().toISOString(),
}) {
  assertExactSha(baseSha, "base");
  assertExactSha(headSha, "head");
  const admission = {
    contract: INTEGRATION_BASE_CONTRACT,
    requested_base_sha: baseSha,
    tested_head_sha: headSha,
    status: "refused",
    observation: null,
    base_matches_current_main: null,
    base_is_ancestor_of_head: null,
    checked_at: null,
    reason_code: null,
  };
  try {
    const observed = await transport.fetchBranchHead("main");
    if (observed?.repository_id !== CANONICAL_REPOSITORY_ID ||
        observed?.branch !== "main" || !/^[0-9a-f]{40}$/u.test(observed?.sha ?? "")) {
      throw new Error("invalid integration-base observation");
    }
    admission.observation = {
      source: INTEGRATION_BASE_SOURCE,
      repository_id: observed.repository_id,
      branch: observed.branch,
      sha: observed.sha,
      observed_at: now(),
    };
  } catch {
    admission.reason_code = "integration_base_observation_unavailable";
  }
  if (admission.observation) {
    admission.base_matches_current_main = baseSha === admission.observation.sha;
    if (!admission.base_matches_current_main) {
      admission.reason_code = "integration_base_mismatch";
    } else if (baseSha === headSha) {
      admission.reason_code = "identical_base_and_head";
    } else {
      try {
        admission.base_is_ancestor_of_head = isIntegrationBaseAncestor({ repositoryRoot, baseSha, headSha });
        admission.reason_code = admission.base_is_ancestor_of_head
          ? null : "integration_base_not_ancestor";
        if (admission.base_is_ancestor_of_head) admission.status = "admitted";
      } catch {
        admission.reason_code = "integration_base_ancestry_unavailable";
      }
    }
  }
  admission.checked_at = now();
  return admission;
}

export function isIntegrationBaseAncestor({ repositoryRoot, baseSha, headSha }) {
  assertExactSha(baseSha, "base");
  assertExactSha(headSha, "head");
  const result = spawnSync("git", ["--no-replace-objects", "merge-base", "--is-ancestor", baseSha, headSha], {
    cwd: repositoryRoot,
    encoding: "utf8",
    timeout: 30_000,
    maxBuffer: 64 * 1024,
    shell: false,
    windowsHide: true,
    stdio: ["ignore", "pipe", "pipe"],
  });
  if (result.error || result.signal || ![0, 1].includes(result.status)) {
    throw Object.assign(new Error("integration-base ancestry could not be established"), {
      code: "integration_base_ancestry_unavailable",
    });
  }
  return result.status === 0;
}
