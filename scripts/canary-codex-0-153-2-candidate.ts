import assert from "node:assert/strict";
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

import { extractReviewedCodexCandidateArchiveV01 } from "../lib/vnext/native-host/codex-managed-runtime-store";
import {
  CODEX_0_153_2_CANDIDATE_ENTRY_ID_V01,
  CODEX_0_153_2_CANDIDATE_READY_DISPOSITION_V01,
  evaluateCodex01532CandidateCredentialFreeV01,
  validateCodex01532CandidateQualificationReceiptV01,
} from "../lib/vnext/native-host/codex-ordinary-runtime-candidate";

const REQUIRED_FLAG = "--exact-reviewed-official-0.153.2";
const BASE_COMMIT = "8163fda3d5e63676138e1923f3b9c0e57d9b1e12";
const RELEASE_ID = 382394608;
const RELEASE_TAG = "rust-v0.153.2";
const RELEASE_PUBLISHED_AT = "2026-09-03T23:53:12Z";
const TAG_OBJECT = "79016fcca2c514d9c38643d8b7970a021e829b3b";
const SOURCE_COMMIT = "657a993cbee87acf52d14b758ce49dbd46d1b8eb";
const ASSET_ID = 543503024;
const ASSET_NAME = "codex-aarch64-apple-darwin.tar.gz";
const ARCHIVE_SIZE = 87_314_265;
const ARCHIVE_DIGEST =
  "sha256:91dfc270f0dfbaec16d814f1aa90d4f27e74dc9e3784e64006bef3b79fe9e09c";
const DOWNLOAD_URL =
  "https://github.com/openai/codex/releases/download/rust-v0.153.2/codex-aarch64-apple-darwin.tar.gz";
const PACKAGE_ASSET_ID = 543503001;
const PACKAGE_ASSET_NAME = "codex-package-aarch64-apple-darwin.tar.gz";
const PACKAGE_ASSET_DIGEST =
  "sha256:287e2dd0a9bbfb58581b0a9150399458b4f094ea42caf02860f1e8cb5a202a0b";

async function main(): Promise<void> {
  if (process.argv.length !== 3 || process.argv[2] !== REQUIRED_FLAG)
    throw new Error("codex_0_153_2_candidate_canary_explicit_flag_required");
  if (process.platform !== "darwin" || process.arch !== "arm64")
    throw new Error("codex_0_153_2_candidate_canary_platform_unsupported");

  const source = exactGitSourceV01();
  const disposableRoot = realpathSync.native(
    mkdtempSync(path.join(os.tmpdir(), "augnes-codex-0-153-2-candidate-")),
  );
  chmodSync(disposableRoot, 0o700);
  const extractionRoot = path.join(disposableRoot, "extracted");
  const stateParent = path.join(disposableRoot, "state");
  const poisonPath = path.join(disposableRoot, "poison-path");
  const executionRoot = path.join(disposableRoot, "execution");
  for (const directory of [
    extractionRoot,
    stateParent,
    poisonPath,
    executionRoot,
  ])
    mkdirSync(directory, { mode: 0o700 });
  const poisonCodex = path.join(poisonPath, "codex");
  writeFileSync(poisonCodex, "#!/bin/sh\nexit 91\n", { mode: 0o755 });

  let officialSourceApiReads = 0;
  let binaryArchiveAcquisitions = 0;
  const observedNetworkUrls: string[] = [];
  let report: Record<string, unknown> | null = null;
  try {
    const latest = await githubJsonV01("https://api.github.com/repos/openai/codex/releases/latest");
    officialSourceApiReads += 1;
    assertReleaseV01(latest);
    const release = await githubJsonV01(
      `https://api.github.com/repos/openai/codex/releases/${RELEASE_ID}`,
    );
    officialSourceApiReads += 1;
    assertReleaseV01(release);
    const ref = recordV01(
      await githubJsonV01(
        `https://api.github.com/repos/openai/codex/git/ref/tags/${RELEASE_TAG}`,
      ),
    );
    officialSourceApiReads += 1;
    const refObject = recordV01(ref.object);
    assert.equal(refObject.type, "tag");
    assert.equal(refObject.sha, TAG_OBJECT);
    const tag = recordV01(
      await githubJsonV01(
        `https://api.github.com/repos/openai/codex/git/tags/${TAG_OBJECT}`,
      ),
    );
    officialSourceApiReads += 1;
    const tagObject = recordV01(tag.object);
    assert.equal(tagObject.type, "commit");
    assert.equal(tagObject.sha, SOURCE_COMMIT);
    assert.equal(recordV01(tag.verification).verified, false);
    assert.equal(recordV01(tag.verification).reason, "unsigned");

    binaryArchiveAcquisitions += 1;
    observedNetworkUrls.push(DOWNLOAD_URL);
    const archiveResponse = await fetch(DOWNLOAD_URL, {
      method: "GET",
      redirect: "follow",
      headers: { Accept: "application/octet-stream" },
      signal: AbortSignal.timeout(120_000),
    });
    assert.equal(archiveResponse.ok, true);
    const archive = Buffer.from(await archiveResponse.arrayBuffer());
    assert.equal(archive.length, ARCHIVE_SIZE);
    assert.equal(sha256V01(archive), ARCHIVE_DIGEST);
    const extraction = extractReviewedCodexCandidateArchiveV01({
      entry_id: CODEX_0_153_2_CANDIDATE_ENTRY_ID_V01,
      archive_bytes: archive,
      destination: realpathSync.native(extractionRoot),
      environment: {
        NODE_ENV: "production",
        PATH: poisonPath,
        LANG: "C",
        LC_ALL: "C",
        TZ: "UTC",
        NO_COLOR: "1",
      },
    });
    assert.notEqual(extraction.native_executable, poisonCodex);
    assert.equal(extraction.archive_size_bytes, ARCHIVE_SIZE);
    assert.equal(extraction.archive_digest, ARCHIVE_DIGEST);
    assert.equal(extraction.archive_member_name, "codex-aarch64-apple-darwin");
    assert.equal(extraction.extracted_native_size_bytes, 220_551_344);
    assert.equal(
      extraction.native_executable_sha256,
      "sha256:195ace4100a634a9df39147f493e730e666b5bd87795f3c9f3251d8542400424",
    );
    assert.equal(extraction.cli_version, "0.153.2");

    const receipt = await evaluateCodex01532CandidateCredentialFreeV01({
      command: extraction.native_executable,
      executable_identity_class: "qualification_candidate_codex_0_153_2",
      state_parent: realpathSync.native(stateParent),
      execution_root: realpathSync.native(executionRoot),
      augnes_source: {
        base_commit: BASE_COMMIT,
        head_commit: source.head_commit,
        head_tree: source.head_tree,
      },
      archive_observation: {
        size_bytes: extraction.archive_size_bytes,
        digest: extraction.archive_digest,
        member_name: extraction.archive_member_name,
        extracted_native_size_bytes: extraction.extracted_native_size_bytes,
      },
      external_call_accounting: {
        official_source_api_reads: officialSourceApiReads,
        binary_archive_acquisitions: binaryArchiveAcquisitions,
        other_network_calls: 0,
      },
      base_environment: {
        PATH: poisonPath,
        LANG: "C",
        LC_ALL: "C",
        TZ: "UTC",
        NO_COLOR: "1",
      },
    });
    assert.equal(
      receipt.disposition,
      CODEX_0_153_2_CANDIDATE_READY_DISPOSITION_V01,
    );
    assert.equal(receipt.emulated_input, false);
    assert.deepEqual(receipt.exercised_methods, [
      "initialize",
      "initialized",
      "account/read",
      "config/read",
    ]);
    assert.equal(receipt.credential_free_account_disposition, "unauthenticated_empty_state");
    assert.equal(receipt.process_settlement.remaining_owned_processes, 0);
    assert.equal(receipt.process_settlement.streams_closed, true);
    assert.equal(receipt.process_settlement.disposable_state_removed, true);
    validateCodex01532CandidateQualificationReceiptV01(receipt);
    assert.deepEqual(readdirSync(stateParent), []);
    assert.equal(binaryArchiveAcquisitions, 1);
    assert.equal(observedNetworkUrls.length, 1);

    const receiptDirectory = path.join(
      process.cwd(),
      ".augnes-local-verification",
      "codex-candidate-receipts",
    );
    mkdirSync(receiptDirectory, { recursive: true, mode: 0o700 });
    const receiptPath = path.join(
      receiptDirectory,
      `${source.head_commit}.codex-0.153.2.json`,
    );
    writeFileSync(receiptPath, `${JSON.stringify(receipt, null, 2)}\n`, {
      mode: 0o600,
      flag: "wx",
    });
    report = {
        passed: true,
        disposition: receipt.disposition,
        receipt_path: receiptPath,
        receipt_fingerprint: receipt.receipt_fingerprint,
        observed_archive_size_bytes: archive.length,
        observed_archive_sha256: sha256V01(archive),
        observed_native_size_bytes: lstatSync(extraction.native_executable).size,
        observed_native_sha256: sha256V01(readFileSync(extraction.native_executable)),
        observed_cli_version: extraction.cli_version,
        official_source_api_reads: officialSourceApiReads,
        binary_archive_acquisitions: binaryArchiveAcquisitions,
        other_network_calls: 0,
        provider_model_calls: 0,
        keychain_accesses: 0,
        agent_identity_attempts: 0,
        repository_task_calls: 0,
        repository_writes: 0,
        external_effects: 0,
        remaining_owned_processes: 0,
        streams_closed: true,
        disposable_state_removed: true,
        global_path_fallback_used: false,
        real_application_data_writes: 0,
      };
  } finally {
    makeWritableV01(disposableRoot);
    rmSync(disposableRoot, { recursive: true, force: false });
    assert.equal(existsSync(disposableRoot), false);
  }
  assert.ok(report);
  process.stdout.write(`${JSON.stringify(report)}\n`);
}

async function githubJsonV01(url: string): Promise<unknown> {
  assert.equal(url.startsWith("https://api.github.com/repos/openai/codex/"), true);
  const response = await fetch(url, {
    headers: {
      Accept: "application/vnd.github+json",
      "User-Agent": "augnes-codex-0.153.2-candidate-review",
    },
    signal: AbortSignal.timeout(30_000),
  });
  assert.equal(response.ok, true);
  return await response.json();
}

function assertReleaseV01(value: unknown): void {
  const release = recordV01(value);
  assert.equal(release.id, RELEASE_ID);
  assert.equal(release.tag_name, RELEASE_TAG);
  assert.equal(release.published_at, RELEASE_PUBLISHED_AT);
  assert.equal(release.draft, false);
  assert.equal(release.prerelease, false);
  const assets = arrayV01(release.assets).map(recordV01);
  const asset = assets.find((candidate) => candidate.id === ASSET_ID);
  assert.ok(asset);
  assert.equal(asset.name, ASSET_NAME);
  assert.equal(asset.size, ARCHIVE_SIZE);
  assert.equal(asset.digest, ARCHIVE_DIGEST);
  assert.equal(asset.browser_download_url, DOWNLOAD_URL);
  const packageAsset = assets.find((candidate) => candidate.id === PACKAGE_ASSET_ID);
  assert.ok(packageAsset);
  assert.equal(packageAsset.name, PACKAGE_ASSET_NAME);
  assert.equal(packageAsset.digest, PACKAGE_ASSET_DIGEST);
  assert.notEqual(packageAsset.id, ASSET_ID);
}

function exactGitSourceV01(): { head_commit: string; head_tree: string } {
  const base = gitV01(["rev-parse", BASE_COMMIT]);
  assert.equal(base, BASE_COMMIT);
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
  if (ancestry.status !== 0 || ancestry.signal || ancestry.error)
    throw new Error("codex_candidate_git_base_identity_invalid");
  const head = gitV01(["rev-parse", "HEAD"]);
  const tree = gitV01(["rev-parse", "HEAD^{tree}"]);
  if (!/^[a-f0-9]{40}$/u.test(head) || !/^[a-f0-9]{40}$/u.test(tree))
    throw new Error("codex_candidate_git_identity_invalid");
  return { head_commit: head, head_tree: tree };
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
    throw new Error("codex_candidate_git_identity_invalid");
  return result.stdout.trim();
}

function recordV01(value: unknown): Record<string, unknown> {
  assert.ok(value && typeof value === "object" && !Array.isArray(value));
  return value as Record<string, unknown>;
}

function arrayV01(value: unknown): unknown[] {
  assert.ok(Array.isArray(value));
  return value;
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
    for (const name of readdirSync(target)) makeWritableV01(path.join(target, name));
  } else if (stat.isFile()) chmodSync(target, 0o600);
}

void main();
