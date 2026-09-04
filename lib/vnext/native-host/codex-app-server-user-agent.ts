import {
  canonicalizeProtocolValueV01,
  createProtocolSha256V01,
} from "@/lib/vnext/protocol-primitives";
import {
  CODEX_0_152_1_SUPPORTED_CLI_VERSION_V01,
  CODEX_0_152_1_UPSTREAM_SOURCE_COMMIT_V01,
  CODEX_APP_SERVER_USER_AGENT_CONTRACT_VERSION_0_152_1_V01,
  CODEX_APP_SERVER_USER_AGENT_CONTRACT_VERSION_V01,
  CODEX_APP_SERVER_CLIENT_VERSION_V01,
  CODEX_ISOLATED_AUTH_SUPPORTED_CLI_VERSION_V01,
  CODEX_ISOLATED_AUTH_UPSTREAM_SOURCE_COMMIT_V01,
  type CodexIsolatedAuthIntegrityV01,
} from "@/types/vnext/codex-isolated-auth-projection";

export const CODEX_APP_SERVER_USER_AGENT_MAX_LENGTH_V01 = 512;

const USER_AGENT_CONTRACT_COMMON_MATERIAL_V01 = {
  grammar:
    "originator/cli-version (Mac OS os-semver; arm64|x86_64) terminal-token (client-name; client-version)",
  max_length: CODEX_APP_SERVER_USER_AGENT_MAX_LENGTH_V01,
  character_policy: "printable_ascii_only",
  terminal_token_policy: "ascii_alphanumeric_dot_dash_underscore_slash",
  originator_binding: "exact_initialize_client_info_name",
  client_suffix_binding: "exact_initialize_client_info_name_and_version",
} as const;

const USER_AGENT_CONTRACT_MATERIAL_V01 = {
  contract_version: CODEX_APP_SERVER_USER_AGENT_CONTRACT_VERSION_V01,
  upstream_source_commit: CODEX_ISOLATED_AUTH_UPSTREAM_SOURCE_COMMIT_V01,
  supported_cli_version: CODEX_ISOLATED_AUTH_SUPPORTED_CLI_VERSION_V01,
  ...USER_AGENT_CONTRACT_COMMON_MATERIAL_V01,
} as const;

const USER_AGENT_CONTRACT_MATERIAL_0_152_1_V01 = {
  contract_version: CODEX_APP_SERVER_USER_AGENT_CONTRACT_VERSION_0_152_1_V01,
  upstream_source_commit: CODEX_0_152_1_UPSTREAM_SOURCE_COMMIT_V01,
  supported_cli_version: CODEX_0_152_1_SUPPORTED_CLI_VERSION_V01,
  ...USER_AGENT_CONTRACT_COMMON_MATERIAL_V01,
} as const;

export const CODEX_APP_SERVER_USER_AGENT_CONTRACT_FINGERPRINT_V01 =
  createProtocolSha256V01(
    canonicalizeProtocolValueV01(USER_AGENT_CONTRACT_MATERIAL_V01),
  );

export const CODEX_APP_SERVER_USER_AGENT_CONTRACT_FINGERPRINT_0_152_1_V01 =
  createProtocolSha256V01(
    canonicalizeProtocolValueV01(USER_AGENT_CONTRACT_MATERIAL_0_152_1_V01),
  );

export interface CodexAppServerUserAgentObservationV01 {
  contract_version: typeof CODEX_APP_SERVER_USER_AGENT_CONTRACT_VERSION_V01;
  contract_fingerprint: string;
  codex_cli_version: typeof CODEX_ISOLATED_AUTH_SUPPORTED_CLI_VERSION_V01;
  expected_originator_match: true;
  expected_client_version_match: true;
  platform_shape: "macos_semver_supported_arch";
  platform_shape_fingerprint: string;
  terminal_shape: "bounded_sanitized_terminal_token";
  terminal_shape_fingerprint: string;
  suffix_shape: "exact_client_info_name_and_version";
  suffix_shape_fingerprint: string;
  integrity: CodexIsolatedAuthIntegrityV01;
}

export interface CodexAppServerUserAgentObservation01521V01 {
  contract_version: typeof CODEX_APP_SERVER_USER_AGENT_CONTRACT_VERSION_0_152_1_V01;
  contract_fingerprint: string;
  codex_cli_version: typeof CODEX_0_152_1_SUPPORTED_CLI_VERSION_V01;
  expected_originator_match: true;
  expected_client_version_match: true;
  platform_shape: "macos_semver_supported_arch";
  platform_shape_fingerprint: string;
  terminal_shape: "bounded_sanitized_terminal_token";
  terminal_shape_fingerprint: string;
  suffix_shape: "exact_client_info_name_and_version";
  suffix_shape_fingerprint: string;
  integrity: CodexIsolatedAuthIntegrityV01;
}

export class CodexAppServerUserAgentErrorV01 extends Error {
  constructor(readonly code: string) {
    super(code);
    this.name = "CodexAppServerUserAgentErrorV01";
  }
}

export interface CodexReviewedCandidateUserAgentObservationV01 {
  codex_cli_version: string;
  architecture: "arm64" | "x86_64";
  exact_originator_match: true;
  exact_client_version_match: true;
  fingerprint: string;
}

/**
 * Parse one reviewed candidate's runtime-bound user agent without granting
 * qualification or production-selection authority.
 */
export function observeReviewedCandidateCodexAppServerUserAgentV01(input: {
  raw_user_agent: unknown;
  expected_client_name:
    | "augnes-semantic-preflight"
    | "augnes-ordinary-canary"
    | "augnes-initialize-diagnostic";
  expected_client_version: typeof CODEX_APP_SERVER_CLIENT_VERSION_V01;
  expected_codex_cli_version: string;
}): CodexReviewedCandidateUserAgentObservationV01 {
  const parsed = parseCodexAppServerUserAgentV01(input);
  const material = {
    codex_cli_version: input.expected_codex_cli_version,
    architecture: parsed.architecture,
    exact_originator_match: true,
    exact_client_version_match: true,
  } as const;
  return Object.freeze({
    ...material,
    fingerprint: createProtocolSha256V01(
      canonicalizeProtocolValueV01(material),
    ),
  });
}

export function observeCodexAppServerUserAgentV01(input: {
  raw_user_agent: unknown;
  expected_client_name: "augnes" | "augnes-semantic-preflight";
  expected_client_version: typeof CODEX_APP_SERVER_CLIENT_VERSION_V01;
  expected_codex_cli_version: typeof CODEX_ISOLATED_AUTH_SUPPORTED_CLI_VERSION_V01;
}): CodexAppServerUserAgentObservationV01 {
  const parsed = parseCodexAppServerUserAgentV01(input);
  return userAgentObservationV01({
    contract_version: CODEX_APP_SERVER_USER_AGENT_CONTRACT_VERSION_V01,
    contract_fingerprint:
      CODEX_APP_SERVER_USER_AGENT_CONTRACT_FINGERPRINT_V01,
    codex_cli_version: CODEX_ISOLATED_AUTH_SUPPORTED_CLI_VERSION_V01,
    expected_client_name: input.expected_client_name,
    expected_client_version: input.expected_client_version,
    architecture: parsed.architecture,
  });
}

export function observeCodexAppServerUserAgent01521V01(input: {
  raw_user_agent: unknown;
  expected_client_name: "augnes" | "augnes-semantic-preflight";
  expected_client_version: typeof CODEX_APP_SERVER_CLIENT_VERSION_V01;
  expected_codex_cli_version: typeof CODEX_0_152_1_SUPPORTED_CLI_VERSION_V01;
}): CodexAppServerUserAgentObservation01521V01 {
  const parsed = parseCodexAppServerUserAgentV01(input);
  return userAgentObservationV01({
    contract_version:
      CODEX_APP_SERVER_USER_AGENT_CONTRACT_VERSION_0_152_1_V01,
    contract_fingerprint:
      CODEX_APP_SERVER_USER_AGENT_CONTRACT_FINGERPRINT_0_152_1_V01,
    codex_cli_version: CODEX_0_152_1_SUPPORTED_CLI_VERSION_V01,
    expected_client_name: input.expected_client_name,
    expected_client_version: input.expected_client_version,
    architecture: parsed.architecture,
  });
}

function parseCodexAppServerUserAgentV01(input: {
  raw_user_agent: unknown;
  expected_client_name:
    | "augnes"
    | "augnes-semantic-preflight"
    | "augnes-ordinary-canary"
    | "augnes-initialize-diagnostic";
  expected_client_version: typeof CODEX_APP_SERVER_CLIENT_VERSION_V01;
  expected_codex_cli_version: string;
}): { architecture: "arm64" | "x86_64" } {
  if (
    typeof input.raw_user_agent !== "string" ||
    input.raw_user_agent.length === 0 ||
    input.raw_user_agent.length > CODEX_APP_SERVER_USER_AGENT_MAX_LENGTH_V01 ||
    !/^[\x20-\x7e]+$/u.test(input.raw_user_agent)
  )
    throw new CodexAppServerUserAgentErrorV01(
      "codex_app_server_user_agent_invalid",
    );
  if (
    !/^[a-z][a-z0-9-]{0,63}$/u.test(input.expected_client_name) ||
    !/^[A-Za-z0-9._-]{1,128}$/u.test(input.expected_client_version) ||
    !/^[0-9]+\.[0-9]+\.[0-9]+$/u.test(input.expected_codex_cli_version)
  )
    throw new CodexAppServerUserAgentErrorV01(
      "codex_app_server_user_agent_expectation_invalid",
    );

  const match = input.raw_user_agent.match(
    /^([a-z][a-z0-9-]{0,63})\/([0-9]+\.[0-9]+\.[0-9]+) \(Mac OS ([0-9]+\.[0-9]+\.[0-9]+); (arm64|x86_64)\) ([A-Za-z0-9._/-]{1,128}) \(([a-z][a-z0-9-]{0,63}); ([A-Za-z0-9._-]{1,128})\)$/u,
  );
  if (!match)
    throw new CodexAppServerUserAgentErrorV01(
      "codex_app_server_user_agent_shape_mismatch",
    );
  const [, originator, cliVersion, , rawArchitecture, , suffixName, suffixVersion] =
    match;
  if (cliVersion !== input.expected_codex_cli_version)
    throw new CodexAppServerUserAgentErrorV01(
      "codex_app_server_user_agent_cli_version_mismatch",
    );
  if (
    originator !== input.expected_client_name ||
    suffixName !== input.expected_client_name
  )
    throw new CodexAppServerUserAgentErrorV01(
      "codex_app_server_user_agent_originator_mismatch",
    );
  if (suffixVersion !== input.expected_client_version)
    throw new CodexAppServerUserAgentErrorV01(
      "codex_app_server_user_agent_client_version_mismatch",
    );

  return { architecture: rawArchitecture as "arm64" | "x86_64" };
}

function userAgentObservationV01<
  ContractVersion extends
    | typeof CODEX_APP_SERVER_USER_AGENT_CONTRACT_VERSION_V01
    | typeof CODEX_APP_SERVER_USER_AGENT_CONTRACT_VERSION_0_152_1_V01,
  CliVersion extends
    | typeof CODEX_ISOLATED_AUTH_SUPPORTED_CLI_VERSION_V01
    | typeof CODEX_0_152_1_SUPPORTED_CLI_VERSION_V01,
>(input: {
  contract_version: ContractVersion;
  contract_fingerprint: string;
  codex_cli_version: CliVersion;
  expected_client_name: "augnes" | "augnes-semantic-preflight";
  expected_client_version: typeof CODEX_APP_SERVER_CLIENT_VERSION_V01;
  architecture: "arm64" | "x86_64";
}): {
  contract_version: ContractVersion;
  contract_fingerprint: string;
  codex_cli_version: CliVersion;
  expected_originator_match: true;
  expected_client_version_match: true;
  platform_shape: "macos_semver_supported_arch";
  platform_shape_fingerprint: string;
  terminal_shape: "bounded_sanitized_terminal_token";
  terminal_shape_fingerprint: string;
  suffix_shape: "exact_client_info_name_and_version";
  suffix_shape_fingerprint: string;
  integrity: CodexIsolatedAuthIntegrityV01;
} {
  const material = {
    contract_version: input.contract_version,
    contract_fingerprint: input.contract_fingerprint,
    codex_cli_version: input.codex_cli_version,
    expected_originator_match: true,
    expected_client_version_match: true,
    platform_shape: "macos_semver_supported_arch",
    platform_shape_fingerprint: createProtocolSha256V01(
      canonicalizeProtocolValueV01({
        platform: "Mac OS",
        os_version: "semantic_version_triplet",
        architecture: input.architecture,
      }),
    ),
    terminal_shape: "bounded_sanitized_terminal_token",
    terminal_shape_fingerprint: createProtocolSha256V01(
      canonicalizeProtocolValueV01({
        grammar: "ascii_alphanumeric_dot_dash_underscore_slash",
        max_length: 128,
      }),
    ),
    suffix_shape: "exact_client_info_name_and_version",
    suffix_shape_fingerprint: createProtocolSha256V01(
      canonicalizeProtocolValueV01({
        client_name: input.expected_client_name,
        client_version: input.expected_client_version,
      }),
    ),
  } as const;
  return Object.freeze({
    ...material,
    integrity: {
      algorithm: "sha256" as const,
      fingerprint: createProtocolSha256V01(
        canonicalizeProtocolValueV01(material),
      ),
    },
  });
}
