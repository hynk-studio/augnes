export type GitHubAppTokenProviderMode =
  | "env_github_token"
  | "installation_token";

export type GitHubAppPrivateKeySource =
  | "none"
  | "file_path"
  | "env_plaintext"
  | "env_base64";

export type GitHubAppPermissionProfile = "pr_comment_minimal";

export type GitHubAppConfigValidationStatus =
  | "valid"
  | "unavailable"
  | "invalid";

export type GitHubAppConfigEnv = Record<string, string | undefined>;

export type GitHubAppConfig = {
  provider_mode_raw: string | null;
  app_id_present: boolean;
  client_id_present: boolean;
  installation_id: string | null;
  private_key_sources: GitHubAppPrivateKeySource[];
  repository_allowlist_raw: string | null;
  permission_profile_raw: string | null;
};

export type GitHubAppConfigValidation = {
  status: GitHubAppConfigValidationStatus;
  provider_mode: GitHubAppTokenProviderMode | null;
  app_id_present: boolean;
  client_id_present: boolean;
  issuer_kind: "app_id" | "client_id" | null;
  installation_id_present: boolean;
  installation_id: string | null;
  private_key_source: GitHubAppPrivateKeySource;
  private_key_present: boolean;
  repository_allowlist: string[];
  permission_profile: GitHubAppPermissionProfile | null;
  missing: string[];
  invalid: string[];
  warnings: string[];
  public_safe: {
    provider_mode: GitHubAppTokenProviderMode | null;
    issuer_kind: "app_id" | "client_id" | null;
    installation_id_present: boolean;
    private_key_source: GitHubAppPrivateKeySource;
    private_key_present: boolean;
    repository_allowlist_count: number;
    permission_profile: GitHubAppPermissionProfile | null;
    missing: string[];
    invalid: string[];
    warnings: string[];
  };
  boundaries: string[];
};

export const GITHUB_APP_CONFIG_BOUNDARIES = [
  "Config validation is not token resolution.",
  "Config validation is not approval.",
  "Config validation is not readiness.",
  "Config validation is not publication.",
  "Config validation does not sign JWTs.",
  "Config validation does not parse private keys.",
  "Config validation does not call GitHub.",
  "Config validation does not create installation tokens.",
  "Config validation does not alter C5 gates.",
  "Config validation must not accept request-supplied secrets.",
];

const ENV = {
  tokenProvider: "AUGNES_GITHUB_APP_TOKEN_PROVIDER",
  appId: "AUGNES_GITHUB_APP_ID",
  clientId: "AUGNES_GITHUB_APP_CLIENT_ID",
  privateKeyPath: "AUGNES_GITHUB_APP_PRIVATE_KEY_PATH",
  privateKeyBase64: "AUGNES_GITHUB_APP_PRIVATE_KEY_BASE64",
  privateKey: "AUGNES_GITHUB_APP_PRIVATE_KEY",
  installationId: "AUGNES_GITHUB_APP_INSTALLATION_ID",
  repositoryAllowlist: "AUGNES_GITHUB_APP_REPOSITORY_ALLOWLIST",
  permissionProfile: "AUGNES_GITHUB_APP_PERMISSION_PROFILE",
} as const;

export function readGitHubAppConfig(
  env?: GitHubAppConfigEnv,
): GitHubAppConfig {
  const sourceEnv = env ?? readRuntimeGitHubAppConfigEnv();

  return {
    provider_mode_raw: cleanNullableString(sourceEnv[ENV.tokenProvider]),
    app_id_present: cleanNullableString(sourceEnv[ENV.appId]) !== null,
    client_id_present: cleanNullableString(sourceEnv[ENV.clientId]) !== null,
    installation_id: cleanNullableString(sourceEnv[ENV.installationId]),
    private_key_sources: detectPrivateKeySources(sourceEnv),
    repository_allowlist_raw: cleanNullableString(
      sourceEnv[ENV.repositoryAllowlist],
    ),
    permission_profile_raw: cleanNullableString(sourceEnv[ENV.permissionProfile]),
  };
}

export function validateGitHubAppConfig(
  env?: GitHubAppConfigEnv,
): GitHubAppConfigValidation {
  const config = readGitHubAppConfig(env);
  const missing: string[] = [];
  const invalid: string[] = [];
  const warnings: string[] = [];
  const providerMode = parseProviderMode(config.provider_mode_raw, invalid);

  let issuerKind: "app_id" | "client_id" | null = null;
  let privateKeySource: GitHubAppPrivateKeySource = "none";
  let repositoryAllowlist: string[] = [];
  let permissionProfile: GitHubAppPermissionProfile | null = null;

  if (providerMode === null && config.provider_mode_raw === null) {
    return buildValidation({
      status: "unavailable",
      providerMode: null,
      config,
      issuerKind,
      privateKeySource,
      repositoryAllowlist,
      permissionProfile,
      missing,
      invalid,
      warnings,
    });
  }

  if (providerMode === "env_github_token") {
    warnings.push(
      "env_github_token provider mode is valid config, but resolveGitHubPublishToken() owns env GITHUB_TOKEN provider behavior.",
    );
    return buildValidation({
      status: invalid.length > 0 ? "invalid" : "valid",
      providerMode,
      config,
      issuerKind,
      privateKeySource,
      repositoryAllowlist,
      permissionProfile,
      missing,
      invalid,
      warnings,
    });
  }

  if (providerMode === "installation_token") {
    if (!config.client_id_present && !config.app_id_present) {
      missing.push("AUGNES_GITHUB_APP_CLIENT_ID or AUGNES_GITHUB_APP_ID");
    } else if (config.client_id_present) {
      issuerKind = "client_id";
      if (config.app_id_present) {
        warnings.push(
          "Both GitHub App client ID and app ID are present; client ID will be preferred for future JWT issuer handling.",
        );
      }
    } else {
      issuerKind = "app_id";
    }

    if (!config.installation_id) {
      missing.push("AUGNES_GITHUB_APP_INSTALLATION_ID");
    } else if (!/^\d+$/.test(config.installation_id)) {
      invalid.push("AUGNES_GITHUB_APP_INSTALLATION_ID must be a numeric string");
    }

    if (config.private_key_sources.length === 0) {
      missing.push("one GitHub App private key source");
    } else if (config.private_key_sources.length > 1) {
      invalid.push("Exactly one GitHub App private key source must be present");
      privateKeySource = config.private_key_sources[0] ?? "none";
    } else {
      privateKeySource = config.private_key_sources[0] ?? "none";
    }

    repositoryAllowlist = parseRepositoryAllowlist(
      config.repository_allowlist_raw,
      invalid,
    );
    if (repositoryAllowlist.length === 0) {
      invalid.push(
        "AUGNES_GITHUB_APP_REPOSITORY_ALLOWLIST must include at least one owner/repo entry for installation_token mode",
      );
    }

    permissionProfile = parsePermissionProfile(
      config.permission_profile_raw,
      invalid,
      warnings,
    );
  }

  return buildValidation({
    status: missing.length === 0 && invalid.length === 0 ? "valid" : "invalid",
    providerMode,
    config,
    issuerKind,
    privateKeySource,
    repositoryAllowlist,
    permissionProfile,
    missing,
    invalid,
    warnings,
  });
}

export function readRuntimeGitHubAppConfig() {
  return readGitHubAppConfig(readRuntimeGitHubAppConfigEnv());
}

export function validateRuntimeGitHubAppConfig() {
  return validateGitHubAppConfig(readRuntimeGitHubAppConfigEnv());
}

function readRuntimeGitHubAppConfigEnv(): GitHubAppConfigEnv {
  return process.env;
}

function buildValidation({
  status,
  providerMode,
  config,
  issuerKind,
  privateKeySource,
  repositoryAllowlist,
  permissionProfile,
  missing,
  invalid,
  warnings,
}: {
  status: GitHubAppConfigValidationStatus;
  providerMode: GitHubAppTokenProviderMode | null;
  config: GitHubAppConfig;
  issuerKind: "app_id" | "client_id" | null;
  privateKeySource: GitHubAppPrivateKeySource;
  repositoryAllowlist: string[];
  permissionProfile: GitHubAppPermissionProfile | null;
  missing: string[];
  invalid: string[];
  warnings: string[];
}): GitHubAppConfigValidation {
  const privateKeyPresent = privateKeySource !== "none";
  const installationIdPresent = config.installation_id !== null;

  return {
    status,
    provider_mode: providerMode,
    app_id_present: config.app_id_present,
    client_id_present: config.client_id_present,
    issuer_kind: issuerKind,
    installation_id_present: installationIdPresent,
    installation_id: config.installation_id,
    private_key_source: privateKeySource,
    private_key_present: privateKeyPresent,
    repository_allowlist: repositoryAllowlist,
    permission_profile: permissionProfile,
    missing,
    invalid,
    warnings,
    public_safe: {
      provider_mode: providerMode,
      issuer_kind: issuerKind,
      installation_id_present: installationIdPresent,
      private_key_source: privateKeySource,
      private_key_present: privateKeyPresent,
      repository_allowlist_count: repositoryAllowlist.length,
      permission_profile: permissionProfile,
      missing,
      invalid,
      warnings,
    },
    boundaries: GITHUB_APP_CONFIG_BOUNDARIES,
  };
}

function parseProviderMode(
  value: string | null,
  invalid: string[],
): GitHubAppTokenProviderMode | null {
  if (!value) {
    return null;
  }
  if (value === "env_github_token" || value === "installation_token") {
    return value;
  }

  invalid.push("AUGNES_GITHUB_APP_TOKEN_PROVIDER is unsupported");
  return null;
}

function detectPrivateKeySources(env: GitHubAppConfigEnv) {
  const sources: GitHubAppPrivateKeySource[] = [];
  if (cleanNullableString(env[ENV.privateKeyPath])) {
    sources.push("file_path");
  }
  if (cleanNullableString(env[ENV.privateKey])) {
    sources.push("env_plaintext");
  }
  if (cleanNullableString(env[ENV.privateKeyBase64])) {
    sources.push("env_base64");
  }

  return sources;
}

function parseRepositoryAllowlist(value: string | null, invalid: string[]) {
  if (!value) {
    return [];
  }

  const entries = value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
  const deduped: string[] = [];
  const seen = new Set<string>();

  for (const entry of entries) {
    if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(entry)) {
      invalid.push("AUGNES_GITHUB_APP_REPOSITORY_ALLOWLIST entries must use owner/repo format");
      continue;
    }
    const key = entry.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      deduped.push(entry);
    }
  }

  return deduped;
}

function parsePermissionProfile(
  value: string | null,
  invalid: string[],
  warnings: string[],
): GitHubAppPermissionProfile | null {
  if (!value) {
    warnings.push(
      "AUGNES_GITHUB_APP_PERMISSION_PROFILE is absent; defaulting to pr_comment_minimal.",
    );
    return "pr_comment_minimal";
  }
  if (value === "pr_comment_minimal") {
    return value;
  }

  invalid.push("AUGNES_GITHUB_APP_PERMISSION_PROFILE is unsupported");
  return null;
}

function cleanNullableString(value: string | null | undefined) {
  if (typeof value !== "string") {
    return null;
  }

  return value.trim() || null;
}
