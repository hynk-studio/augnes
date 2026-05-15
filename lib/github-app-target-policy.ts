import type {
  GitHubAppConfigValidation,
  GitHubAppPermissionProfile,
} from "@/lib/github-app-config";
import {
  GITHUB_PR_COMMENT_TARGET_SURFACE,
  parseGitHubPrCommentTargetRef,
} from "@/lib/github-pr-comment-target";

export type GitHubAppTargetPolicyInput = {
  targetSurface: string;
  targetRef: string;
  config: GitHubAppConfigValidation;
  expectedPermissionProfile?: GitHubAppPermissionProfile;
};

export type GitHubAppTargetPolicyDecision = {
  allowed: boolean;
  target_surface: string;
  target_ref: string | null;
  owner: string | null;
  repo: string | null;
  repository: string | null;
  permission_profile: string | null;
  reasons: string[];
  blocked_reasons: string[];
  warnings: string[];
  public_safe: {
    allowed: boolean;
    target_surface: string;
    target_ref_valid: boolean;
    repository_allowed: boolean;
    repository_allowlist_count: number;
    permission_profile: string | null;
    reasons: string[];
    blocked_reasons: string[];
    warnings: string[];
  };
  boundaries: string[];
};

export const GITHUB_APP_TARGET_POLICY_BOUNDARIES = [
  "Target policy is not token resolution.",
  "Target policy is not approval.",
  "Target policy is not readiness.",
  "Target policy is not publication.",
  "Target policy does not sign JWTs.",
  "Target policy does not create installation tokens.",
  "Target policy does not call GitHub.",
  "Target policy does not alter C5 gates.",
  "Target policy must run before future installation-token exchange.",
  "Target policy must not accept request-supplied secrets.",
];

const DEFAULT_PERMISSION_PROFILE = "pr_comment_minimal";

export function evaluateGitHubAppTargetPolicy(
  input: GitHubAppTargetPolicyInput,
): GitHubAppTargetPolicyDecision {
  const reasons: string[] = [];
  const blockedReasons: string[] = [];
  const warnings: string[] = [];
  const expectedPermissionProfile =
    input.expectedPermissionProfile ?? DEFAULT_PERMISSION_PROFILE;
  let targetRef: string | null = null;
  let owner: string | null = null;
  let repo: string | null = null;
  let repository: string | null = null;
  let targetRefValid = false;
  let repositoryAllowed = false;

  if (input.targetSurface !== GITHUB_PR_COMMENT_TARGET_SURFACE) {
    blockedReasons.push("unsupported_target_surface");
  } else {
    reasons.push("target_surface_supported");
  }

  try {
    const parsed = parseGitHubPrCommentTargetRef(input.targetRef);
    targetRefValid = true;
    targetRef = parsed.targetRef;
    owner = parsed.owner;
    repo = parsed.repo;
    repository = `${parsed.owner}/${parsed.repo}`;
    reasons.push("target_ref_valid");
  } catch {
    blockedReasons.push("target_ref_invalid");
  }

  if (input.config.status !== "valid") {
    blockedReasons.push(`config_${input.config.status}`);
  } else {
    reasons.push("config_valid");
  }

  if (input.config.provider_mode !== "installation_token") {
    blockedReasons.push("provider_mode_not_installation_token");
  } else {
    reasons.push("provider_mode_installation_token");
  }

  if (input.config.permission_profile !== expectedPermissionProfile) {
    blockedReasons.push("permission_profile_unsupported");
  } else {
    reasons.push("permission_profile_supported");
  }

  if (input.config.repository_allowlist.length === 0) {
    blockedReasons.push("repository_allowlist_empty");
  } else if (repository) {
    repositoryAllowed = hasAllowlistedRepository(
      input.config.repository_allowlist,
      repository,
    );
    if (repositoryAllowed) {
      reasons.push("repository_allowlist_match");
    } else {
      blockedReasons.push("repository_not_allowlisted");
    }
  }

  if (input.config.warnings.length > 0) {
    warnings.push("config_has_warnings");
  }

  const allowed = blockedReasons.length === 0;

  return {
    allowed,
    target_surface: input.targetSurface,
    target_ref: targetRef,
    owner,
    repo,
    repository,
    permission_profile: input.config.permission_profile,
    reasons,
    blocked_reasons: blockedReasons,
    warnings,
    public_safe: {
      allowed,
      target_surface: input.targetSurface,
      target_ref_valid: targetRefValid,
      repository_allowed: repositoryAllowed,
      repository_allowlist_count: input.config.repository_allowlist.length,
      permission_profile: input.config.permission_profile,
      reasons,
      blocked_reasons: blockedReasons,
      warnings,
    },
    boundaries: GITHUB_APP_TARGET_POLICY_BOUNDARIES,
  };
}

function hasAllowlistedRepository(allowlist: string[], repository: string) {
  const normalizedRepository = repository.toLowerCase();
  return allowlist.some((entry) => entry.toLowerCase() === normalizedRepository);
}
