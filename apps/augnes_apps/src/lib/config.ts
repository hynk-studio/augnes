import "dotenv/config";

export type AugnesCoreMode = "mock" | "http" | "file";
export type AugnesAppProfile = "public" | "chrono_lab";
export type AugnesAppToolSurface = "public" | "work_loop_readonly";

function optionalIntegerEnv(name: string): number | null {
  const value = process.env[name];
  if (!value) return null;
  const parsed = Number(value);
  return Number.isInteger(parsed) ? parsed : null;
}

function requiredEnv(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return value;
}

function resolveCoreMode(): AugnesCoreMode {
  const rawMode = process.env.AUGNES_CORE_MODE;
  if (rawMode) {
    if (rawMode === "mock" || rawMode === "http" || rawMode === "file") {
      return rawMode;
    }

    throw new Error(`Invalid AUGNES_CORE_MODE: ${rawMode}`);
  }

  return (process.env.AUGNES_USE_MOCK ?? "true") === "true" ? "mock" : "http";
}

function resolveAppProfile(): AugnesAppProfile {
  const rawProfile = process.env.AUGNES_APP_PROFILE;
  if (!rawProfile) return "public";

  if (rawProfile === "public" || rawProfile === "chrono_lab") {
    return rawProfile;
  }

  throw new Error(`Invalid AUGNES_APP_PROFILE: ${rawProfile}`);
}

function resolveAppToolSurface(): AugnesAppToolSurface {
  const rawSurface = process.env.AUGNES_APP_TOOL_SURFACE;
  if (!rawSurface) return "public";

  if (rawSurface === "public" || rawSurface === "work_loop_readonly") {
    return rawSurface;
  }

  throw new Error(`Invalid AUGNES_APP_TOOL_SURFACE: ${rawSurface}`);
}

const coreMode = resolveCoreMode();
const appProfile = resolveAppProfile();
const appToolSurface = resolveAppToolSurface();

export const config = {
  port: Number(process.env.PORT ?? 8787),
  mcpPath: "/mcp",
  appDomain: requiredEnv("AUGNES_APP_DOMAIN", "https://app.augnes.dev"),
  connectDomain: requiredEnv("AUGNES_CONNECT_DOMAIN", "https://app.augnes.dev"),
  resourceDomain: requiredEnv("AUGNES_RESOURCE_DOMAIN", "https://persistent.oaistatic.com"),
  apiBaseUrl: requiredEnv("AUGNES_API_BASE_URL", "http://localhost:3000"),
  workingViewFile: process.env.AUGNES_WORKING_VIEW_FILE,
  casefileFile: process.env.AUGNES_CASEFILE_FILE,
  evidenceIndexFile: process.env.AUGNES_EVIDENCE_INDEX_FILE,
  continuityReportFile: process.env.AUGNES_CONTINUITY_REPORT_FILE,
  boundaryPacketFile: process.env.AUGNES_BOUNDARY_PACKET_FILE,
  strategyRationaleFile: process.env.AUGNES_STRATEGY_RATIONALE_FILE,
  governanceAuditFile: process.env.AUGNES_GOVERNANCE_AUDIT_FILE,
  repoNavigationFile: process.env.AUGNES_REPO_NAVIGATION_FILE,
  enableAgentBridge: process.env.AUGNES_ENABLE_AGENT_BRIDGE === "true",
  runtimeInstanceId: process.env.AUGNES_RUNTIME_INSTANCE_ID,
  runtimeContract: process.env.AUGNES_RUNTIME_CONTRACT,
  runtimeSchemaVersion: Number(process.env.AUGNES_RUNTIME_SCHEMA_VERSION ?? "0"),
  runtimeRepositoryFingerprint:
    process.env.AUGNES_RUNTIME_REPOSITORY_FINGERPRINT,
  runtimeGenerationId: process.env.AUGNES_RUNTIME_GENERATION_ID,
  runtimeGenerationVersion: Number(
    process.env.AUGNES_RUNTIME_GENERATION_VERSION ?? "0",
  ),
  runtimeChildRole: process.env.AUGNES_RUNTIME_CHILD_ROLE,
  runtimeChildPort: Number(process.env.AUGNES_RUNTIME_CHILD_PORT ?? "0"),
  runtimeChildRootPid: Number(
    process.env.AUGNES_RUNTIME_CHILD_ROOT_PID ?? "0",
  ),
  runtimeOwnershipToken: process.env.AUGNES_RUNTIME_OWNERSHIP_TOKEN,
  distributionMode: process.env.AUGNES_DISTRIBUTION_MODE,
  applicationVersion: process.env.AUGNES_APPLICATION_VERSION,
  packageContract: process.env.AUGNES_PACKAGE_CONTRACT,
  packageContractVersion: optionalIntegerEnv(
    "AUGNES_PACKAGE_CONTRACT_VERSION",
  ),
  buildIdentity: process.env.AUGNES_BUILD_IDENTITY,
  packagePlatform: process.env.AUGNES_PACKAGE_PLATFORM,
  databaseSchemaCompatibility:
    process.env.AUGNES_DATABASE_SCHEMA_COMPATIBILITY,
  coreMode,
  appProfile,
  appToolSurface,
  useMock: coreMode === "mock",
};
