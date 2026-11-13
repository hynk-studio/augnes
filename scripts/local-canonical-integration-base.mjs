import { spawnSync } from "node:child_process";

import { CANONICAL_REPOSITORY_ID } from "./canonical-repository-identity.mjs";
import { createGitHubMainBranchTransport } from "./github-main-branch-transport.mjs";
import { assertExactSha } from "./local-canonical-environment.mjs";

export const LEGACY_INTEGRATION_BASE_CONTRACT = "augnes.local-canonical-integration-base.v1";
export const INTEGRATION_BASE_CONTRACT = "augnes.local-canonical-integration-base.v2";
export const INTEGRATION_BASE_SOURCE = "github_authenticated_main_branch_get";

// Shared by receipt validation and prospective continuation readers. A contract
// name alone cannot turn malformed provenance into declared-range applicability.
export function validAdmittedIntegrationBase(value, repository) {
  const iso = value => typeof value === "string" && Number.isFinite(Date.parse(value)) && new Date(value).toISOString() === value;
  const observation = value?.observation;
  const observed = observation &&
    observation.source === INTEGRATION_BASE_SOURCE &&
    observation.repository_id === CANONICAL_REPOSITORY_ID &&
    observation.repository_id === repository?.repository_id && observation.branch === "main" &&
    /^[a-f0-9]{40}$/u.test(observation.sha ?? "") && iso(observation.observed_at) &&
    Date.parse(value?.checked_at) >= Date.parse(observation.observed_at) &&
    value?.base_matches_current_main === (observation.sha === repository?.base_sha);
  return [INTEGRATION_BASE_CONTRACT, LEGACY_INTEGRATION_BASE_CONTRACT].includes(value?.contract) &&
    repository?.repository_id === CANONICAL_REPOSITORY_ID &&
    value?.status === "admitted" && value?.reason_code === null &&
    value?.requested_base_sha === repository?.base_sha && value?.tested_head_sha === repository?.head_sha &&
    value?.requested_base_sha !== value?.tested_head_sha && value?.base_is_ancestor_of_head === true && iso(value?.checked_at) &&
    (value.contract === LEGACY_INTEGRATION_BASE_CONTRACT
      ? observed && value.base_matches_current_main === true
      : observed || observation === null && value.base_matches_current_main === null);
}

export function usesDeclaredIntegrationBase(receipt) {
  const value = receipt?.integration_base;
  return receipt?.receipt_version === 4 && value?.contract === INTEGRATION_BASE_CONTRACT &&
    validAdmittedIntegrationBase(value, receipt.repository) &&
    Date.parse(value.checked_at) >= Date.parse(receipt.run?.started_at) &&
    Date.parse(value.checked_at) <= Date.parse(receipt.run?.finished_at) &&
    (!value.observation || Date.parse(value.observation.observed_at) >= Date.parse(receipt.run?.started_at));
}

// No tracking-ref fallback and no fetch/write: this is an observation, not a
// reservation of GitHub main through the eventual merge.
export async function admitIntegrationBase({
  repositoryRoot,
  baseSha,
  headSha,
  transport = createGitHubMainBranchTransport(),
  now = () => new Date().toISOString(),
  contract = INTEGRATION_BASE_CONTRACT,
}) {
  assertExactSha(baseSha, "base");
  assertExactSha(headSha, "head");
  if (![INTEGRATION_BASE_CONTRACT, LEGACY_INTEGRATION_BASE_CONTRACT].includes(contract))
    throw Object.assign(new Error("integration_base_contract_unsupported"), { code: "integration_base_contract_unsupported" });
  const admission = {
    contract,
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
  if (admission.observation)
    admission.base_matches_current_main = baseSha === admission.observation.sha;
  if (admission.observation || contract === INTEGRATION_BASE_CONTRACT) {
    // The declared base selects the exact source comparison. Current main is
    // observed for applicability, not a requirement to rewrite the candidate.
    // Retained v1 receipts keep their original current-main requirement.
    if (contract === LEGACY_INTEGRATION_BASE_CONTRACT && !admission.base_matches_current_main) {
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
