import { createHash } from "node:crypto";

export type GitHubTokenSource =
  | "env_github_token"
  | "github_app_installation_token";

export type GitHubTokenResolution = {
  available: boolean;
  source: GitHubTokenSource | null;
  token: string | null;
  token_fingerprint: string | null;
  expires_at: string | null;
  unavailable_reason: string | null;
  boundaries: string[];
};

export type PublicGitHubTokenResolution = {
  available: boolean;
  source: GitHubTokenSource | null;
  expires_at: string | null;
  unavailable_reason: string | null;
  boundaries: string[];
};

export const GITHUB_TOKEN_PROVIDER_BOUNDARIES = [
  "Token availability is not approval.",
  "Token availability is not publication readiness.",
  "Token resolution is not publication.",
  "Token resolution happens after Core gates and before adapter execution.",
  "dry_run=true must never require or use a GitHub publish token.",
  "Only env GITHUB_TOKEN is implemented in this provider version.",
  "GitHub App installation-token support is design-only for a later PR.",
  "Resolved raw tokens must not be logged, persisted, returned in API responses, written to evidence records, included in PR bodies, screenshots, or docs.",
];

export function resolveGitHubPublishToken(): GitHubTokenResolution {
  const envToken = cleanNullableString(process.env.GITHUB_TOKEN);

  if (!envToken) {
    return {
      available: false,
      source: null,
      token: null,
      token_fingerprint: null,
      expires_at: null,
      unavailable_reason: "GITHUB_TOKEN is not configured for this runtime.",
      boundaries: GITHUB_TOKEN_PROVIDER_BOUNDARIES,
    };
  }

  return {
    available: true,
    source: "env_github_token",
    token: envToken,
    token_fingerprint: fingerprintToken(envToken),
    expires_at: null,
    unavailable_reason: null,
    boundaries: GITHUB_TOKEN_PROVIDER_BOUNDARIES,
  };
}

export function redactGitHubTokenResolutionForResponse(
  resolution: GitHubTokenResolution,
): PublicGitHubTokenResolution {
  return {
    available: resolution.available,
    source: resolution.source,
    expires_at: resolution.expires_at,
    unavailable_reason: resolution.unavailable_reason,
    boundaries: resolution.boundaries,
  };
}

function fingerprintToken(token: string) {
  return `sha256:${createHash("sha256").update(token).digest("hex").slice(0, 12)}`;
}

function cleanNullableString(value: string | null | undefined) {
  if (typeof value !== "string") {
    return null;
  }

  return value.trim() || null;
}
