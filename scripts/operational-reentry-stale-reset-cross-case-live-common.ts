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

const REPOSITORY = "hynk-studio/augnes-perspective-lab" as const;
const ORIGINS = new Set([
  "https://github.com/hynk-studio/augnes-perspective-lab.git",
  "git@github.com:hynk-studio/augnes-perspective-lab.git",
]);

export function readCrossCaseLiveJsonV01(filePath: string): unknown {
  const text = readFileSync(filePath, "utf8");
  const value = JSON.parse(text) as unknown;
  if (text !== `${canonicalizeProtocolValueV01(value)}\n`) {
    fail("cross_case_live_file_noncanonical");
  }
  return value;
}

export function preflightCrossCaseLiveRepositoryV01(input: {
  repository_root: string;
  authorization: Record<string, unknown>;
  authorization_file: string;
  pricing: unknown;
  candidate_namespace: string;
  issue_field: "future_live_issue_number" | "future_compatibility_issue_number";
}): ModelGatewayInteractiveAdmissionV01 {
  const root = realpathSync(input.repository_root);
  if (realpathSync(git(root, ["rev-parse", "--show-toplevel"])) !== root) {
    fail("cross_case_live_repository_root_mismatch");
  }
  if (input.authorization.repository_slug !== REPOSITORY ||
      typeof input.authorization.authorized_origin !== "string" ||
      !ORIGINS.has(input.authorization.authorized_origin)) {
    fail("cross_case_live_repository_identity_invalid");
  }
  const observedOrigin = git(root, ["remote", "get-url", "origin"]);
  if (observedOrigin !== input.authorization.authorized_origin) {
    fail("cross_case_live_repository_origin_mismatch");
  }
  refreshOriginMain(root);
  const head = git(root, ["rev-parse", "HEAD"]);
  const originMain = git(root, ["rev-parse", "--verify", "refs/remotes/origin/main^{commit}"]);
  if (head !== input.authorization.exact_merged_source_head || head !== originMain) {
    fail("cross_case_live_source_drift");
  }
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
  validatePricing(input.authorization, input.pricing);
  if (input.authorization.gateway_authorization_project_is_lab_experiment_meaning !== false) {
    fail("cross_case_live_lab_meaning_invalid");
  }
  if (input.authorization.project_root_fingerprint !== hash(root)) {
    fail("cross_case_live_project_root_fingerprint_mismatch");
  }
  const capability = readDefaultModelGatewayLocalCapabilityV01();
  if (capability.status !== "available") {
    fail(`cross_case_live_model_gateway_${capability.status}`);
  }
  const admission = readModelGatewayInteractiveAdmissionForRootV01(root);
  if (admission.workspace_id !== input.authorization.workspace_id ||
      admission.project_id !== input.authorization.project_id ||
      admission.expected_active_selection_revision !== input.authorization.expected_active_selection_revision ||
      admission.gateway_authorization_project_is_lab_experiment_meaning !== false) {
    fail("cross_case_live_gateway_admission_drift");
  }
  return admission;
}

export function refreshOriginMainV01(repositoryRoot: string): string {
  refreshOriginMain(repositoryRoot);
  return git(repositoryRoot, ["rev-parse", "--verify", "refs/remotes/origin/main^{commit}"]);
}

export function assertCrossCaseLiveExecutionStateV01(
  repositoryRoot: string,
  authorization: Record<string, unknown>,
): void {
  const head = git(repositoryRoot, ["rev-parse", "HEAD"]);
  const originMain = git(repositoryRoot, ["rev-parse", "--verify", "refs/remotes/origin/main^{commit}"]);
  if (head !== authorization.exact_merged_source_head || head !== originMain ||
      git(repositoryRoot, ["status", "--porcelain", "--untracked-files=all"]) !== "") {
    fail("cross_case_live_execution_state_drift");
  }
}

function validatePricing(authorization: Record<string, unknown>, pricing: unknown): void {
  if (typeof pricing !== "object" || pricing === null || Array.isArray(pricing) ||
      !("integrity" in pricing) || typeof pricing.integrity !== "object" ||
      pricing.integrity === null || !("fingerprint" in pricing.integrity)) {
    fail("cross_case_live_pricing_invalid");
  }
  const pricingFingerprint = String(pricing.integrity.fingerprint);
  const { integrity: _ignored, ...withoutIntegrity } = pricing as Record<string, unknown>;
  if (pricingFingerprint !== hash(withoutIntegrity) ||
      pricingFingerprint !== authorization.pricing_snapshot_fingerprint &&
      pricingFingerprint !== authorization.pricing_fingerprint) {
    fail("cross_case_live_pricing_fingerprint_mismatch");
  }
  const expiry = Date.parse(String(authorization.pricing_authority_expires_at));
  if (!Number.isFinite(expiry) || Date.now() >= expiry) {
    fail("cross_case_live_pricing_expired");
  }
}

function refreshOriginMain(repositoryRoot: string): void {
  try {
    execFileSync("git", ["-C", repositoryRoot, "fetch", "--no-tags", "--no-recurse-submodules", "--no-write-fetch-head", "origin", "+refs/heads/main:refs/remotes/origin/main"], {
      encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], timeout: 60_000,
      maxBuffer: 1024 * 1024,
    });
  } catch {
    fail("cross_case_live_origin_main_refresh_failed");
  }
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
