import type { GitHubAppTargetPolicyDecision } from "@/lib/github-app-target-policy";

export type GitHubAppInstallationTokenExchangeInput = {
  installationId: string;
  jwt: string;
  targetPolicy: GitHubAppTargetPolicyDecision;
  permissionProfile: "pr_comment_minimal";
  enabled?: boolean;
  fetchImpl?: typeof fetch;
};

export type GitHubAppInstallationTokenRequest = {
  url: string;
  method: "POST";
  headers: {
    accept: "application/vnd.github+json";
    authorization: "Bearer <redacted>";
    "x-github-api-version": "2022-11-28";
  };
  body: {
    repositories?: string[];
    permissions?: Record<string, string>;
  };
  public_safe: {
    installation_id_present: boolean;
    repository_scope_count: number;
    permission_profile: "pr_comment_minimal";
    permissions: Record<string, string>;
    jwt_present: boolean;
  };
};

export type GitHubAppInstallationTokenExchangeResult = {
  exchanged: boolean;
  token: string | null;
  expires_at: string | null;
  permissions: Record<string, unknown> | null;
  repositories: Array<Record<string, unknown>> | null;
  public_safe: {
    exchanged: boolean;
    token_present: boolean;
    expires_at: string | null;
    permission_keys: string[];
    repository_count: number | null;
    provider_source: "github_app_installation_token";
  };
  boundaries: string[];
};

type GitHubInstallationTokenResponse = {
  token: string;
  expires_at: string;
  permissions: Record<string, unknown> | null;
  repositories: Array<Record<string, unknown>> | null;
};

export const GITHUB_APP_INSTALLATION_TOKEN_EXCHANGE_BOUNDARIES = [
  "Installation-token exchange boundary is not approval.",
  "Installation-token exchange boundary is not readiness.",
  "Installation-token exchange boundary is not publication.",
  "Installation-token exchange boundary is not proof.",
  "Installation-token exchange boundary is not C5 integration.",
  "Installation-token exchange boundary does not alter C5 gates.",
  "Installation-token exchange boundary does not create delivery rows.",
  "Installation-token exchange boundary does not call GitHub unless explicitly enabled with an injected fetch implementation.",
  "Installation-token exchange boundary does not perform live publish.",
  "Installation-token exchange boundary does not persist tokens.",
];

const GITHUB_API_VERSION = "2022-11-28";
const GITHUB_API_BASE_URL = "https://api.github.com";
const PR_COMMENT_MINIMAL_PERMISSIONS = {
  issues: "write",
  pull_requests: "read",
} as const;

export function buildGitHubAppInstallationTokenRequest(
  input: GitHubAppInstallationTokenExchangeInput,
): GitHubAppInstallationTokenRequest {
  const installationId = requireNumericString(
    input.installationId,
    "installation_id",
  );
  const jwt = requireNonEmptyString(input.jwt, "jwt");
  const repository = requireAllowedTargetPolicy(input.targetPolicy);
  const permissions = resolvePermissionProfile(input.permissionProfile);

  return {
    url: `${GITHUB_API_BASE_URL}/app/installations/${installationId}/access_tokens`,
    method: "POST",
    headers: {
      accept: "application/vnd.github+json",
      authorization: "Bearer <redacted>",
      "x-github-api-version": GITHUB_API_VERSION,
    },
    body: {
      repositories: [repository],
      permissions,
    },
    public_safe: {
      installation_id_present: true,
      repository_scope_count: 1,
      permission_profile: "pr_comment_minimal",
      permissions,
      jwt_present: jwt.length > 0,
    },
  };
}

export async function exchangeGitHubAppInstallationToken(
  input: GitHubAppInstallationTokenExchangeInput,
): Promise<GitHubAppInstallationTokenExchangeResult> {
  const request = buildGitHubAppInstallationTokenRequest(input);

  if (input.enabled !== true) {
    throw new Error("GITHUB_APP_INSTALLATION_TOKEN_EXCHANGE_DISABLED");
  }
  if (!input.fetchImpl) {
    throw new Error("GITHUB_APP_INSTALLATION_TOKEN_EXCHANGE_FETCH_IMPL_REQUIRED");
  }

  const response = await input.fetchImpl(request.url, {
    method: request.method,
    headers: {
      accept: request.headers.accept,
      authorization: `Bearer ${requireNonEmptyString(input.jwt, "jwt")}`,
      "content-type": "application/json",
      "x-github-api-version": request.headers["x-github-api-version"],
    },
    body: JSON.stringify(request.body),
  });

  if (!response.ok) {
    throw new Error("GITHUB_APP_INSTALLATION_TOKEN_EXCHANGE_REQUEST_FAILED");
  }

  const payload = await readJson(response);
  const validated = validateGitHubInstallationTokenResponse(payload);

  return {
    exchanged: true,
    token: validated.token,
    expires_at: validated.expires_at,
    permissions: validated.permissions,
    repositories: validated.repositories,
    public_safe: {
      exchanged: true,
      token_present: true,
      expires_at: validated.expires_at,
      permission_keys: Object.keys(validated.permissions ?? {}).sort(),
      repository_count: validated.repositories?.length ?? null,
      provider_source: "github_app_installation_token",
    },
    boundaries: GITHUB_APP_INSTALLATION_TOKEN_EXCHANGE_BOUNDARIES,
  };
}

export function redactGitHubAppInstallationTokenExchangeResult(
  result: GitHubAppInstallationTokenExchangeResult,
) {
  return {
    ...result.public_safe,
    boundaries: result.boundaries,
  };
}

function validateGitHubInstallationTokenResponse(
  payload: unknown,
): GitHubInstallationTokenResponse {
  if (typeof payload !== "object" || payload === null || Array.isArray(payload)) {
    throw new Error("GITHUB_APP_INSTALLATION_TOKEN_EXCHANGE_INVALID_RESPONSE");
  }

  const record = payload as Record<string, unknown>;
  const token = record.token;
  const expiresAt = record.expires_at;
  const permissions = record.permissions;
  const repositories = record.repositories;

  if (typeof token !== "string" || token.trim().length === 0) {
    throw new Error("GITHUB_APP_INSTALLATION_TOKEN_EXCHANGE_MISSING_TOKEN");
  }
  if (typeof expiresAt !== "string" || !isFutureDateString(expiresAt)) {
    throw new Error("GITHUB_APP_INSTALLATION_TOKEN_EXCHANGE_INVALID_EXPIRES_AT");
  }
  if (
    permissions !== null &&
    (typeof permissions !== "object" || Array.isArray(permissions))
  ) {
    throw new Error("GITHUB_APP_INSTALLATION_TOKEN_EXCHANGE_INVALID_PERMISSIONS");
  }
  if (
    repositories !== null &&
    (!Array.isArray(repositories) ||
      repositories.some(
        (repository) =>
          typeof repository !== "object" ||
          repository === null ||
          Array.isArray(repository),
      ))
  ) {
    throw new Error("GITHUB_APP_INSTALLATION_TOKEN_EXCHANGE_INVALID_REPOSITORIES");
  }

  return {
    token: token.trim(),
    expires_at: new Date(expiresAt).toISOString(),
    permissions: permissions as Record<string, unknown> | null,
    repositories: repositories as Array<Record<string, unknown>> | null,
  };
}

async function readJson(response: Response) {
  try {
    return await response.json();
  } catch {
    throw new Error("GITHUB_APP_INSTALLATION_TOKEN_EXCHANGE_INVALID_JSON");
  }
}

function requireAllowedTargetPolicy(policy: GitHubAppTargetPolicyDecision) {
  if (policy.allowed !== true) {
    throw new Error("GITHUB_APP_INSTALLATION_TOKEN_EXCHANGE_TARGET_POLICY_BLOCKED");
  }
  if (!policy.repository) {
    throw new Error("GITHUB_APP_INSTALLATION_TOKEN_EXCHANGE_TARGET_REPOSITORY_REQUIRED");
  }

  return policy.repository;
}

function resolvePermissionProfile(profile: string) {
  if (profile !== "pr_comment_minimal") {
    throw new Error("GITHUB_APP_INSTALLATION_TOKEN_EXCHANGE_PERMISSION_PROFILE_UNSUPPORTED");
  }

  return { ...PR_COMMENT_MINIMAL_PERMISSIONS };
}

function requireNumericString(value: string, label: string) {
  const clean = requireNonEmptyString(value, label);
  if (!/^\d+$/.test(clean)) {
    throw new Error("GITHUB_APP_INSTALLATION_TOKEN_EXCHANGE_INSTALLATION_ID_INVALID");
  }

  return clean;
}

function requireNonEmptyString(value: string, label: string) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`GITHUB_APP_INSTALLATION_TOKEN_EXCHANGE_${label.toUpperCase()}_REQUIRED`);
  }

  return value.trim();
}

function isFutureDateString(value: string) {
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) && timestamp > Date.now();
}
