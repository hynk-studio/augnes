import { createHash } from "node:crypto";
import {
  chmodSync,
  existsSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

import { extractReviewedCodexCandidateArchiveV01 } from "@/lib/vnext/native-host/codex-managed-runtime-store";
import {
  CODEX_0_153_2_ORDINARY_CANARY_ENTRY_ID_V01,
} from "@/lib/vnext/native-host/codex-ordinary-authenticated-candidate";
import {
  protectedCodexConfigurationFingerprintV01,
  runCodex01532InitializeDiagnosticSequenceV01,
  runCodex01532InitializeOnlyProbeV01,
  type Codex01532InitializeDiagnosticProbeLabelV01,
} from "@/lib/vnext/native-host/codex-ordinary-initialize-diagnostic";
import {
  CODEX_QUALIFIED_RUNTIME_REGISTRY_V01,
  getCodexReviewedRuntimeArtifactV01,
  selectPinnedCodexQualifiedRuntimeV01,
} from "@/lib/vnext/native-host/codex-qualified-runtime-registry";

const REQUIRED_FLAG = "--exact-reviewed-initialize-diagnostic-0.153.2-once";
const BASE_COMMIT = "8eb6b7af220fe8d7e244bb616205c797d7965142";
const DOWNLOAD_TIMEOUT_MS = 120_000;

async function mainV01(): Promise<void> {
  let disposableRoot: string | null = null;
  let archiveAcquisitions = 0;
  let disposableRootRemoved = false;
  try {
    if (process.argv.length !== 3 || process.argv[2] !== REQUIRED_FLAG)
      throw new DiagnosticSetupErrorV01(
        "initialize_diagnostic_explicit_flag_required",
      );
    if (process.platform !== "darwin" || process.arch !== "arm64")
      throw new DiagnosticSetupErrorV01(
        "initialize_diagnostic_platform_unsupported",
      );
    const source = exactGitSourceV01();
    if (gitV01(["status", "--short"]) !== "")
      throw new DiagnosticSetupErrorV01(
        "initialize_diagnostic_worktree_not_clean",
      );
    const reviewed = assertReviewedCandidateAndProductionV01();
    const releaseRepository = reviewed.artifact.official_release.repository;
    const releaseTag = reviewed.artifact.release_tag;
    const asset = reviewed.artifact.qualified_provenance_asset;
    const downloadUrl = `https://github.com/${releaseRepository}/releases/download/${releaseTag}/${asset.asset_name}`;
    if (
      releaseRepository !== "openai/codex" ||
      releaseTag !== "rust-v0.153.2" ||
      reviewed.artifact.tagged_source_commit !==
        "657a993cbee87acf52d14b758ce49dbd46d1b8eb" ||
      asset.acquisition_route !== "standalone_release_tarball" ||
      asset.asset_id !== 543503024 ||
      asset.size_bytes !== 87_314_265 ||
      asset.digest !==
        "sha256:91dfc270f0dfbaec16d814f1aa90d4f27e74dc9e3784e64006bef3b79fe9e09c"
    )
      throw new DiagnosticSetupErrorV01(
        "initialize_diagnostic_reviewed_identity_mismatch",
      );

    disposableRoot = realpathSync.native(
      mkdtempSync(path.join(os.tmpdir(), "augnes-codex-01532-init-diagnostic-")),
    );
    chmodSync(disposableRoot, 0o700);
    const extractionRoot = privateDirectoryV01(disposableRoot, "extracted");
    const executionRoot = privateDirectoryV01(disposableRoot, "execution");
    const privateHome = privateDirectoryV01(disposableRoot, "home");
    const privateCodexHome = privateDirectoryV01(
      disposableRoot,
      "codex-home",
    );
    const sqliteHome = privateDirectoryV01(disposableRoot, "sqlite-home");
    const tmp = privateDirectoryV01(disposableRoot, "tmp");
    const poisonPath = privateDirectoryV01(disposableRoot, "poison-path");
    writeFileSync(path.join(poisonPath, "codex"), "#!/bin/sh\nexit 91\n", {
      mode: 0o755,
    });

    archiveAcquisitions += 1;
    const response = await fetch(downloadUrl, {
      method: "GET",
      redirect: "follow",
      headers: { Accept: "application/octet-stream" },
      signal: AbortSignal.timeout(DOWNLOAD_TIMEOUT_MS),
    });
    if (!response.ok)
      throw new DiagnosticSetupErrorV01(
        "initialize_diagnostic_archive_acquisition_failed",
      );
    const archive = Buffer.from(await response.arrayBuffer());
    if (
      archive.byteLength !== asset.size_bytes ||
      sha256V01(archive) !== asset.digest
    )
      throw new DiagnosticSetupErrorV01(
        "initialize_diagnostic_archive_identity_mismatch",
      );
    const extraction = extractReviewedCodexCandidateArchiveV01({
      entry_id: CODEX_0_153_2_ORDINARY_CANARY_ENTRY_ID_V01,
      archive_bytes: archive,
      destination: extractionRoot,
      environment: {
        NODE_ENV: "production",
        PATH: poisonPath,
        LANG: "C",
        LC_ALL: "C",
        TZ: "UTC",
        NO_COLOR: "1",
      },
    });
    if (
      extraction.cli_version !== "0.153.2" ||
      lstatSync(extraction.native_executable).size !== 220_551_344 ||
      sha256V01(readFileSync(extraction.native_executable)) !==
        reviewed.artifact.native_executable_sha256
    )
      throw new DiagnosticSetupErrorV01(
        "initialize_diagnostic_native_identity_mismatch",
      );

    const realHome = realpathSync.native(os.homedir());
    const realCodexHome = realpathSync.native(
      process.env.CODEX_HOME ?? path.join(realHome, ".codex"),
    );
    const protectedBefore = protectedCodexConfigurationFingerprintV01(
      realCodexHome,
    );
    const result = await runCodex01532InitializeDiagnosticSequenceV01({
      run_probe: async (probe) => {
        const environment = diagnosticEnvironmentV01({
          probe,
          privateHome,
          privateCodexHome,
          realHome,
          realCodexHome,
          sqliteHome,
          tmp,
          poisonPath,
        });
        const observed = await runCodex01532InitializeOnlyProbeV01({
          probe,
          command: extraction.native_executable,
          expected_native_sha256: reviewed.artifact.native_executable_sha256,
          private_root: disposableRoot!,
          execution_root: executionRoot,
          environment,
          protected_surfaces_unchanged: true,
        });
        const protectedUnchanged =
          probe === "A_private_control" ||
          protectedCodexConfigurationFingerprintV01(realCodexHome) ===
            protectedBefore;
        return Object.freeze({
          ...observed,
          protected_surfaces_unchanged: protectedUnchanged,
        });
      },
    });
    const protectedAfter = protectedCodexConfigurationFingerprintV01(
      realCodexHome,
    );
    const protectedUnchanged = protectedAfter === protectedBefore;
    makeWritableV01(disposableRoot);
    rmSync(disposableRoot, { recursive: true, force: false });
    disposableRootRemoved = !existsSync(disposableRoot);
    disposableRoot = null;
    const report = {
      diagnostic_version: result.diagnostic_version,
      disposition: result.disposition,
      diagnostic_fingerprint: result.diagnostic_fingerprint,
      augnes_head: source.head_commit,
      augnes_tree: source.head_tree,
      candidate_entry_id: reviewed.artifact.entry_id,
      candidate_version: reviewed.artifact.version,
      tagged_source_commit: reviewed.artifact.tagged_source_commit,
      native_sha256: reviewed.artifact.native_executable_sha256,
      archive_acquisitions: archiveAcquisitions,
      probes: result.probes,
      skipped_probes: result.skipped_probes,
      initialize_requests_sent: result.initialize_requests_sent,
      initialized_notifications_sent: 0,
      account_requests_sent: 0,
      config_requests_sent: 0,
      thread_requests_sent: 0,
      turn_requests_sent: 0,
      provider_bearing_requests_sent: 0,
      tool_command_write_effect_requests_sent: 0,
      agent_identity_requests_sent: 0,
      protected_surfaces_unchanged: protectedUnchanged,
      auth_manager_or_keychain_access_count: "not_observed",
      os_network_destination_count: "not_observed",
      provider_backend_request_count: "not_observed",
      disposable_root_removed: disposableRootRemoved,
    };
    process.stdout.write(`${JSON.stringify(report)}\n`);
    if (
      result.disposition === "BASELINE_INITIALIZE_FAILURE" ||
      result.disposition === "UNEXPECTED_DIAGNOSTIC_FAILURE" ||
      !protectedUnchanged ||
      !disposableRootRemoved
    )
      process.exitCode = 2;
  } catch (error) {
    if (disposableRoot && existsSync(disposableRoot)) {
      try {
        makeWritableV01(disposableRoot);
        rmSync(disposableRoot, { recursive: true, force: false });
        disposableRootRemoved = !existsSync(disposableRoot);
      } catch {
        disposableRootRemoved = false;
      }
    }
    process.stdout.write(
      `${JSON.stringify({
        disposition: "HOLD_DIAGNOSTIC_SETUP_FAILED",
        public_error_class: publicSetupErrorV01(error),
        archive_acquisitions: archiveAcquisitions,
        initialized_notifications_sent: 0,
        account_requests_sent: 0,
        config_requests_sent: 0,
        thread_requests_sent: 0,
        turn_requests_sent: 0,
        provider_bearing_requests_sent: 0,
        agent_identity_requests_sent: 0,
        auth_manager_or_keychain_access_count: "not_observed",
        os_network_destination_count: "not_observed",
        provider_backend_request_count: "not_observed",
        disposable_root_removed: disposableRootRemoved,
      })}\n`,
    );
    process.exitCode = 2;
  }
}

function assertReviewedCandidateAndProductionV01() {
  const reviewed = getCodexReviewedRuntimeArtifactV01({
    entry_id: CODEX_0_153_2_ORDINARY_CANARY_ENTRY_ID_V01,
  });
  const production = selectPinnedCodexQualifiedRuntimeV01({
    lane: "ordinary_chatgpt_auth",
  });
  if (
    CODEX_QUALIFIED_RUNTIME_REGISTRY_V01.production_selection.mode !==
      "pinned_exact" ||
    production.artifact.version !== "0.152.1" ||
    reviewed.artifact.lanes.ordinary_chatgpt_auth.status !== "candidate" ||
    reviewed.artifact.lanes.ordinary_chatgpt_auth.qualified_at !== null ||
    reviewed.artifact.lanes.strict_agent_identity.status !== "hold"
  )
    throw new DiagnosticSetupErrorV01(
      "initialize_diagnostic_registry_state_invalid",
    );
  return reviewed;
}

function diagnosticEnvironmentV01(input: {
  probe: Codex01532InitializeDiagnosticProbeLabelV01;
  privateHome: string;
  privateCodexHome: string;
  realHome: string;
  realCodexHome: string;
  sqliteHome: string;
  tmp: string;
  poisonPath: string;
}): NodeJS.ProcessEnv {
  return {
    NODE_ENV: "production",
    HOME:
      input.probe === "C_real_home_real_codex_home"
        ? input.realHome
        : input.privateHome,
    CODEX_HOME:
      input.probe === "A_private_control"
        ? input.privateCodexHome
        : input.realCodexHome,
    CODEX_SQLITE_HOME: input.sqliteHome,
    TMPDIR: input.tmp,
    PATH: input.poisonPath,
    LANG: "C",
    LC_ALL: "C",
    TZ: "UTC",
    NO_COLOR: "1",
  };
}

function exactGitSourceV01(): { head_commit: string; head_tree: string } {
  if (gitV01(["rev-parse", BASE_COMMIT]) !== BASE_COMMIT)
    throw new DiagnosticSetupErrorV01(
      "initialize_diagnostic_base_identity_invalid",
    );
  const ancestry = spawnSync(
    "git",
    ["merge-base", "--is-ancestor", BASE_COMMIT, "HEAD"],
    {
      cwd: process.cwd(),
      encoding: "utf8",
      timeout: 5_000,
      env: {
        NODE_ENV: "production",
        PATH: process.env.PATH,
        LANG: "C",
        LC_ALL: "C",
      },
    },
  );
  if (ancestry.status !== 0)
    throw new DiagnosticSetupErrorV01(
      "initialize_diagnostic_base_identity_invalid",
    );
  return {
    head_commit: gitV01(["rev-parse", "HEAD"]),
    head_tree: gitV01(["rev-parse", "HEAD^{tree}"]),
  };
}

function gitV01(args: string[]): string {
  const result = spawnSync("git", args, {
    cwd: process.cwd(),
    encoding: "utf8",
    timeout: 5_000,
    env: {
      NODE_ENV: "production",
      PATH: process.env.PATH,
      LANG: "C",
      LC_ALL: "C",
    },
  });
  if (result.status !== 0 || result.signal || result.error)
    throw new DiagnosticSetupErrorV01("initialize_diagnostic_git_failed");
  return result.stdout.trim();
}

function privateDirectoryV01(parent: string, name: string): string {
  const target = path.join(parent, name);
  mkdirSync(target, { mode: 0o700 });
  chmodSync(target, 0o700);
  return realpathSync.native(target);
}

function sha256V01(value: Buffer): string {
  return `sha256:${createHash("sha256").update(value).digest("hex")}`;
}

function makeWritableV01(target: string): void {
  if (!existsSync(target)) return;
  const stat = lstatSync(target);
  if (stat.isSymbolicLink()) return;
  if (stat.isDirectory()) {
    chmodSync(target, 0o700);
    for (const name of readdirSync(target))
      makeWritableV01(path.join(target, name));
  } else if (stat.isFile()) chmodSync(target, 0o600);
}

class DiagnosticSetupErrorV01 extends Error {
  constructor(readonly code: string) {
    super(code);
  }
}

function publicSetupErrorV01(error: unknown): string {
  if (
    error instanceof DiagnosticSetupErrorV01 &&
    /^[a-z0-9_]{1,160}$/u.test(error.code)
  )
    return error.code;
  return "initialize_diagnostic_setup_failed";
}

void mainV01();
