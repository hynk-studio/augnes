import { existsSync, readFileSync } from "node:fs";
import { access } from "node:fs/promises";
import { resolve } from "node:path";
import dotenv from "dotenv";

export const FILE_MODE_FIXTURE_ENV_KEYS = [
  "AUGNES_WORKING_VIEW_FILE",
  "AUGNES_CASEFILE_FILE",
  "AUGNES_EVIDENCE_INDEX_FILE",
  "AUGNES_CONTINUITY_REPORT_FILE",
  "AUGNES_BOUNDARY_PACKET_FILE",
  "AUGNES_STRATEGY_RATIONALE_FILE",
  "AUGNES_GOVERNANCE_AUDIT_FILE",
  "AUGNES_REPO_NAVIGATION_FILE",
] as const;

export type FileModeFixtureEnvKey = (typeof FILE_MODE_FIXTURE_ENV_KEYS)[number];

const DEFAULT_FILE_MODE_ENV: Record<string, string> = {
  AUGNES_CORE_MODE: "file",
  AUGNES_APP_PROFILE: "public",
  AUGNES_WORKING_VIEW_FILE: "./data/working-view.example.json",
  AUGNES_CASEFILE_FILE: "./data/casefile.example.json",
  AUGNES_EVIDENCE_INDEX_FILE: "./data/evidence-index.example.json",
  AUGNES_CONTINUITY_REPORT_FILE: "./data/continuity-report.example.json",
  AUGNES_BOUNDARY_PACKET_FILE: "./data/boundary-packet.example.json",
  AUGNES_STRATEGY_RATIONALE_FILE: "./data/strategy-rationale.example.json",
  AUGNES_GOVERNANCE_AUDIT_FILE: "./data/governance-audit.example.json",
  AUGNES_REPO_NAVIGATION_FILE: "./data/repo-navigation.example.json",
};

export function resolveFileModeEnvPath(cwd = process.cwd()): string {
  const localEnvPath = resolve(cwd, ".env.file");
  return existsSync(localEnvPath) ? localEnvPath : resolve(cwd, ".env.file.example");
}

export function readFileModeEnv(cwd = process.cwd()): {
  envPath: string;
  values: Record<string, string>;
} {
  const envPath = resolveFileModeEnvPath(cwd);
  const values = existsSync(envPath) ? dotenv.parse(readFileSync(envPath)) : DEFAULT_FILE_MODE_ENV;
  return { envPath, values };
}

export function loadFileModeEnv(cwd = process.cwd()): {
  envPath: string;
  values: Record<string, string>;
} {
  const { envPath, values } = readFileModeEnv(cwd);

  for (const [key, value] of Object.entries(values)) {
    process.env[key] ??= value;
  }

  process.env.AUGNES_FILE_ENV_PATH = envPath;
  return { envPath, values };
}

export async function assertFileModeFixturePaths(
  values: Record<string, string>,
  cwd = process.cwd()
): Promise<Record<FileModeFixtureEnvKey, string>> {
  const resolvedPaths = {} as Record<FileModeFixtureEnvKey, string>;

  for (const key of FILE_MODE_FIXTURE_ENV_KEYS) {
    const configuredPath = values[key];
    if (!configuredPath) {
      throw new Error(`${key} is required in file-mode env.`);
    }

    const resolvedPath = resolve(cwd, configuredPath);
    await access(resolvedPath);
    resolvedPaths[key] = resolvedPath;
  }

  return resolvedPaths;
}
