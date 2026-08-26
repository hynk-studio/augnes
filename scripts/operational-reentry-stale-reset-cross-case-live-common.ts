import { execFileSync } from "node:child_process";
import { readFileSync, realpathSync } from "node:fs";
import path from "node:path";

import {
  readDefaultModelGatewayLocalCapabilityV01,
  readModelGatewayInteractiveAdmissionForRootV01,
  type ModelGatewayInteractiveAdmissionV01,
} from "@/lib/vnext/model-gateway/model-gateway";
import {
  canonicalizeProtocolValueV01,
  createProtocolSha256V01,
} from "@/lib/vnext/protocol-primitives";
import { validateOperationalReentryStaleResetCrossCasePricingV01 } from "@/lib/vnext/operational-reentry-stale-reset-cross-case-replication";
import { createGitHubTransport } from "@/scripts/local-canonical-github-transport.mjs";
import { matchCanonicalRepositoryIdentity } from "./canonical-repository-identity.mjs";

const REPOSITORY = "hynk-studio/augnes" as const;
const ORIGINS = new Set([
  "https://github.com/hynk-studio/augnes.git",
]);
const GIT_SHA = /^[0-9a-f]{40}$/u;

export type CrossCaseSourceReadinessStatusV01 =
  | "ready"
  | "repository_or_origin_mismatch"
  | "authentication_unavailable"
  | "transport_timeout"
  | "transport_unavailable_or_failed"
  | "fresh_remote_identity_invalid"
  | "fresh_remote_source_mismatch";

export type CrossCaseSourceReadinessV01 = Readonly<{
  source_readiness_version: "operational_reentry_source_readiness.v0.1";
  status: CrossCaseSourceReadinessStatusV01;
  repository_id: typeof REPOSITORY;
  branch: "main";
  expected_origin: string | null;
  expected_source_sha: string | null;
  fresh_remote_main_sha: string | null;
  local_head_sha: string | null;
  local_head_matches_fresh_remote_main: boolean;
  observation_transport: "authenticated_github_api";
  observed_at: string;
  live_authority: false;
  real_provider_calls: 0;
}>;

type CrossCaseSourceReadinessDependenciesV01 = {
  transport?: {
    fetchBranchHead(branch: "main"): Promise<unknown>;
  };
  git?: (repositoryRoot: string, args: string[]) => string;
  realpath?: (value: string) => string;
  matchIdentity?: (input: {
    resolvedRoot: string;
    originUrl: string;
  }) => unknown;
  now?: () => Date;
};

export function readCrossCaseLiveJsonV01(filePath: string): unknown {
  const text = readFileSync(filePath, "utf8");
  const value = JSON.parse(text) as unknown;
  if (text !== `${canonicalizeProtocolValueV01(value)}\n`) {
    fail("cross_case_live_file_noncanonical");
  }
  return value;
}

export async function preflightCrossCaseLiveRepositoryV01(input: {
  repository_root: string;
  authorization: Record<string, unknown>;
  authorization_file: string;
  pricing: unknown;
  candidate_namespace: string;
  issue_field: "future_live_issue_number" | "future_compatibility_issue_number";
}): Promise<{
  admission: ModelGatewayInteractiveAdmissionV01;
  source_attestation: CrossCaseSourceReadinessV01;
}> {
  const root = realpathSync(input.repository_root);
  const sourceAttestation = await requireCrossCaseLiveSourceAttestationV01({
    repository_root: root,
    repository_id: input.authorization.repository_slug,
    expected_origin: input.authorization.authorized_origin,
    expected_source_sha: input.authorization.exact_merged_source_head,
  });
  if (git(root, ["status", "--porcelain", "--untracked-files=all"]) !== "") {
    fail("cross_case_live_worktree_not_clean");
  }
  const issue = input.authorization[input.issue_field];
  if (!Number.isSafeInteger(issue) || Number(issue) <= 0) {
    fail("cross_case_live_issue_identity_invalid");
  }
  const expectedCandidateRoot = path.resolve(
    root,
    ".augnes-lab",
    input.candidate_namespace,
    "candidate-authorizations",
    `issue-${issue}`,
  );
  const actualCandidate = path.resolve(input.authorization_file);
  if (path.dirname(actualCandidate) !== expectedCandidateRoot) {
    fail("cross_case_live_candidate_not_current");
  }
  const admission = readModelGatewayInteractiveAdmissionForRootV01(root);
  validateCrossCaseLiveAdmissionBindingV01(input.authorization, admission);
  const capability = readDefaultModelGatewayLocalCapabilityV01();
  if (capability.status !== "available") {
    fail(`cross_case_live_model_gateway_${capability.status}`);
  }
  validatePricing(
    input.authorization,
    input.pricing,
    input.issue_field === "future_live_issue_number" ? 16 : 6,
  );
  return { admission, source_attestation: sourceAttestation };
}

export async function attestCrossCaseSourceReadinessV01(
  input: {
    repository_root: string;
    repository_id: unknown;
    expected_origin: unknown;
    expected_source_sha: unknown;
  },
  dependencies: CrossCaseSourceReadinessDependenciesV01 = {},
): Promise<CrossCaseSourceReadinessV01> {
  const observedAt = (dependencies.now ?? (() => new Date()))().toISOString();
  const expectedOrigin =
    typeof input.expected_origin === "string" && ORIGINS.has(input.expected_origin)
      ? input.expected_origin
      : null;
  const expectedSourceSha =
    typeof input.expected_source_sha === "string" &&
    GIT_SHA.test(input.expected_source_sha)
      ? input.expected_source_sha
      : null;
  const result = (
    status: CrossCaseSourceReadinessStatusV01,
    localHeadSha: string | null = null,
    freshRemoteMainSha: string | null = null,
  ): CrossCaseSourceReadinessV01 => Object.freeze({
    source_readiness_version: "operational_reentry_source_readiness.v0.1",
    status,
    repository_id: REPOSITORY,
    branch: "main",
    expected_origin: expectedOrigin,
    expected_source_sha: expectedSourceSha,
    fresh_remote_main_sha: freshRemoteMainSha,
    local_head_sha: localHeadSha,
    local_head_matches_fresh_remote_main:
      localHeadSha !== null && localHeadSha === freshRemoteMainSha,
    observation_transport: "authenticated_github_api",
    observed_at: observedAt,
    live_authority: false,
    real_provider_calls: 0,
  });

  if (input.repository_id !== REPOSITORY || expectedOrigin === null) {
    return result("repository_or_origin_mismatch");
  }
  if (expectedSourceSha === null) {
    return result("fresh_remote_identity_invalid");
  }

  const readGit = dependencies.git ?? git;
  const resolveRealpath = dependencies.realpath ?? realpathSync;
  let root: string;
  let localHead: string;
  try {
    root = resolveRealpath(input.repository_root);
    if (resolveRealpath(readGit(root, ["rev-parse", "--show-toplevel"])) !== root) {
      return result("repository_or_origin_mismatch");
    }
    const observedOrigin = readGit(root, ["remote", "get-url", "origin"]);
    (dependencies.matchIdentity ?? matchCanonicalRepositoryIdentity)({
      resolvedRoot: root,
      originUrl: observedOrigin,
    });
    if (observedOrigin !== expectedOrigin) {
      return result("repository_or_origin_mismatch");
    }
    localHead = readGit(root, ["rev-parse", "HEAD"]);
  } catch {
    return result("repository_or_origin_mismatch");
  }
  if (!GIT_SHA.test(localHead)) {
    return result("fresh_remote_identity_invalid");
  }

  let remote: unknown;
  try {
    remote = await (dependencies.transport ?? createGitHubTransport())
      .fetchBranchHead("main");
  } catch (error) {
    const code = error && typeof error === "object" && "code" in error
      ? String(error.code)
      : "";
    if (code === "github_authentication_unavailable") {
      return result("authentication_unavailable", localHead);
    }
    if (code === "github_transport_timeout") {
      return result("transport_timeout", localHead);
    }
    if (code === "github_branch_head_response_invalid") {
      return result("fresh_remote_identity_invalid", localHead);
    }
    return result("transport_unavailable_or_failed", localHead);
  }

  if (
    !remote ||
    typeof remote !== "object" ||
    !("repository_id" in remote) ||
    remote.repository_id !== REPOSITORY ||
    !("branch" in remote) ||
    remote.branch !== "main" ||
    !("sha" in remote) ||
    typeof remote.sha !== "string" ||
    !GIT_SHA.test(remote.sha)
  ) {
    return result("fresh_remote_identity_invalid", localHead);
  }
  if (remote.sha !== expectedSourceSha || localHead !== remote.sha) {
    return result("fresh_remote_source_mismatch", localHead, remote.sha);
  }
  return result("ready", localHead, remote.sha);
}

export async function requireCrossCaseLiveSourceAttestationV01(
  input: Parameters<typeof attestCrossCaseSourceReadinessV01>[0],
  dependencies: CrossCaseSourceReadinessDependenciesV01 = {},
): Promise<CrossCaseSourceReadinessV01> {
  const result = await attestCrossCaseSourceReadinessV01(input, dependencies);
  if (result.status !== "ready") {
    fail({
      repository_or_origin_mismatch:
        "cross_case_live_repository_or_origin_mismatch",
      authentication_unavailable:
        "cross_case_live_source_authentication_unavailable",
      transport_timeout: "cross_case_live_source_transport_timeout",
      transport_unavailable_or_failed:
        "cross_case_live_source_transport_unavailable_or_failed",
      fresh_remote_identity_invalid:
        "cross_case_live_fresh_remote_identity_invalid",
      fresh_remote_source_mismatch:
        "cross_case_live_fresh_remote_source_mismatch",
    }[result.status]);
  }
  return result;
}

export function validateCrossCaseLiveAdmissionBindingV01(
  authorization: Record<string, unknown>,
  admission: ModelGatewayInteractiveAdmissionV01,
): void {
  if (
    authorization.gateway_authorization_project_is_lab_experiment_meaning !== false ||
    admission.gateway_authorization_project_is_lab_experiment_meaning !== false
  ) fail("cross_case_live_lab_meaning_invalid");
  if (
    admission.workspace_id !== authorization.workspace_id ||
    admission.project_id !== authorization.project_id ||
    admission.expected_active_selection_revision !==
      authorization.expected_active_selection_revision ||
    authorization.project_root_fingerprint !== hash(admission.project_root)
  ) fail("cross_case_live_gateway_admission_drift");
}

export function assertCrossCaseLiveExecutionStateV01(
  repositoryRoot: string,
  authorization: Record<string, unknown>,
  sourceAttestation: CrossCaseSourceReadinessV01,
): void {
  const head = git(repositoryRoot, ["rev-parse", "HEAD"]);
  if (sourceAttestation.status !== "ready" ||
      sourceAttestation.repository_id !== REPOSITORY ||
      sourceAttestation.fresh_remote_main_sha !== authorization.exact_merged_source_head ||
      head !== authorization.exact_merged_source_head ||
      head !== sourceAttestation.fresh_remote_main_sha ||
      git(repositoryRoot, ["status", "--porcelain", "--untracked-files=all"]) !== "") {
    fail("cross_case_live_execution_state_drift");
  }
}

function validatePricing(
  authorization: Record<string, unknown>,
  value: unknown,
  plannedCalls: 6 | 16,
): void {
  const pricing = validateOperationalReentryStaleResetCrossCasePricingV01(
    value,
    plannedCalls,
  );
  const authorizationPricingFingerprint = plannedCalls === 16
    ? authorization.pricing_snapshot_fingerprint
    : authorization.pricing_fingerprint;
  if (
    pricing.integrity.fingerprint !== authorizationPricingFingerprint ||
    pricing.pricing_authority_fingerprint !==
      authorization.pricing_authority_fingerprint ||
    pricing.pricing_authority_expires_at !==
      authorization.pricing_authority_expires_at ||
    canonicalizeProtocolValueV01(pricing.gateway_cost_budget) !==
      canonicalizeProtocolValueV01(authorization.gateway_cost_budget)
  ) fail("cross_case_live_pricing_fingerprint_mismatch");
}

function git(repositoryRoot: string, args: string[]): string {
  return execFileSync("git", ["-C", repositoryRoot, ...args], {
    encoding: "utf8", stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}

function hash(value: unknown): string {
  return createProtocolSha256V01(canonicalizeProtocolValueV01(value));
}

export function boundedCrossCaseLiveErrorV01(error: unknown): string {
  if (error instanceof Error && /^[a-z0-9_]{1,180}$/u.test(error.message)) return error.message;
  return "cross_case_live_runtime_failure";
}

function fail(code: string): never {
  throw new Error(code);
}
