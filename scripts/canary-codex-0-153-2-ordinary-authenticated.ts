import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
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
  statSync,
  writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";

import { genericCliBuilderInputFixture } from "@/fixtures/vnext/protocol/task-context-packet-v0-1";
import { createCodexAppServerAdapterV01 } from "@/lib/vnext/native-host/codex-app-server-adapter";
import { extractReviewedCodexCandidateArchiveV01 } from "@/lib/vnext/native-host/codex-managed-runtime-store";
import {
  CODEX_0_153_2_ORDINARY_CANARY_CAPABILITY_VERSION_V01,
  CODEX_0_153_2_ORDINARY_CANARY_TOKEN_V01,
  createCodex01532OrdinaryAuthenticatedCanaryReceiptV01,
  createCodex01532OrdinaryAuthenticatedCandidateCapabilityV01,
  validateCodex01532OrdinaryAuthenticatedCanaryReceiptV01,
} from "@/lib/vnext/native-host/codex-ordinary-authenticated-candidate";
import {
  CODEX_QUALIFIED_RUNTIME_REGISTRY_V01,
  selectPinnedCodexQualifiedRuntimeV01,
} from "@/lib/vnext/native-host/codex-qualified-runtime-registry";
import { createProtocolSha256V01 } from "@/lib/vnext/protocol-primitives";
import { buildTaskContextPacketV01 } from "@/lib/vnext/task-context-packet";
import type { ExternalRefV01 } from "@/types/vnext/external-ref";
import type {
  NativeHostInvocationV01,
  NativeHostRequestV01,
  NativeHostResultV01,
} from "@/types/vnext/native-host-adapter";

const REQUIRED_FLAG = "--exact-reviewed-authenticated-0.153.2-once";
const BASE_COMMIT = "8eb6b7af220fe8d7e244bb616205c797d7965142";
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
const CANARY_TIMEOUT_MS = 120_000;

async function main(): Promise<void> {
  if (process.argv.length !== 3 || process.argv[2] !== REQUIRED_FLAG)
    throw new Error(
      "codex_0_153_2_authenticated_canary_explicit_flag_required",
    );
  if (process.platform !== "darwin" || process.arch !== "arm64")
    throw new Error("codex_0_153_2_authenticated_canary_platform_unsupported");
  const source = exactGitSourceV01();
  assertRegistryBeforeCanaryV01();
  const sourceStatus = gitV01(["status", "--short"]);
  assert.equal(sourceStatus, "");

  const disposableRoot = realpathSync.native(
    mkdtempSync(path.join(os.tmpdir(), "augnes-codex-0-153-2-auth-canary-")),
  );
  chmodSync(disposableRoot, 0o700);
  const extractionRoot = createPrivateDirectoryV01(disposableRoot, "extracted");
  const executionRoot = createPrivateDirectoryV01(disposableRoot, "execution");
  const home = createPrivateDirectoryV01(disposableRoot, "home");
  const sqliteHome = createPrivateDirectoryV01(disposableRoot, "sqlite-home");
  const tmp = createPrivateDirectoryV01(disposableRoot, "tmp");
  const poisonPath = createPrivateDirectoryV01(disposableRoot, "poison-path");
  writeFileSync(path.join(poisonPath, "codex"), "#!/bin/sh\nexit 91\n", {
    mode: 0o755,
  });

  const codexHome = realpathSync.native(
    process.env.CODEX_HOME ?? path.join(os.homedir(), ".codex"),
  );
  assert.equal(physicallyContainedV01(codexHome, disposableRoot), false);
  const integrityBefore = integritySnapshotV01(codexHome);
  let officialSourceApiReads = 0;
  let binaryArchiveAcquisitions = 0;
  let invocation: NativeHostInvocationV01 | null = null;
  let result: NativeHostResultV01 | null = null;
  let failureCode: string | null = null;
  let streamsClosed = false;
  let capability: ReturnType<
    typeof createCodex01532OrdinaryAuthenticatedCandidateCapabilityV01
  > | null = null;
  let request: NativeHostRequestV01 | null = null;
  let observedArchiveSize = 0;
  let observedArchiveDigest = "unavailable";
  let observedNativeSize = 0;
  let observedNativeDigest = "unavailable";
  let observedCliVersion = "unavailable";
  let timeout: NodeJS.Timeout | null = null;
  let integrityAfter = integrityBefore;
  try {
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
    assert.equal(recordV01(ref.object).type, "tag");
    assert.equal(recordV01(ref.object).sha, TAG_OBJECT);
    const tag = recordV01(
      await githubJsonV01(
        `https://api.github.com/repos/openai/codex/git/tags/${TAG_OBJECT}`,
      ),
    );
    officialSourceApiReads += 1;
    assert.equal(recordV01(tag.object).type, "commit");
    assert.equal(recordV01(tag.object).sha, SOURCE_COMMIT);

    binaryArchiveAcquisitions += 1;
    const archiveResponse = await fetch(DOWNLOAD_URL, {
      method: "GET",
      redirect: "follow",
      headers: { Accept: "application/octet-stream" },
      signal: AbortSignal.timeout(120_000),
    });
    assert.equal(archiveResponse.ok, true);
    const archive = Buffer.from(await archiveResponse.arrayBuffer());
    observedArchiveSize = archive.length;
    observedArchiveDigest = sha256V01(archive);
    assert.equal(observedArchiveSize, ARCHIVE_SIZE);
    assert.equal(observedArchiveDigest, ARCHIVE_DIGEST);
    const extraction = extractReviewedCodexCandidateArchiveV01({
      entry_id: "codex-rust-v0.153.2-darwin-arm64",
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
    observedNativeSize = lstatSync(extraction.native_executable).size;
    observedNativeDigest = sha256V01(
      readFileSync(extraction.native_executable),
    );
    observedCliVersion = extraction.cli_version;
    assert.equal(extraction.archive_member_name, "codex-aarch64-apple-darwin");
    assert.equal(observedNativeSize, 220_551_344);
    assert.equal(
      observedNativeDigest,
      "sha256:195ace4100a634a9df39147f493e730e666b5bd87795f3c9f3251d8542400424",
    );
    assert.equal(observedCliVersion, "0.153.2");
    assert.notEqual(
      extraction.native_executable,
      path.join(poisonPath, "codex"),
    );

    request = candidateRequestV01(executionRoot, source.head_commit);
    const environment: NodeJS.ProcessEnv = {
      NODE_ENV: "production",
      HOME: home,
      CODEX_HOME: codexHome,
      CODEX_SQLITE_HOME: sqliteHome,
      TMPDIR: tmp,
      PATH: poisonPath,
      LANG: "C",
      LC_ALL: "C",
      TZ: "UTC",
      NO_COLOR: "1",
    };
    capability = createCodex01532OrdinaryAuthenticatedCandidateCapabilityV01({
      command: extraction.native_executable,
      environment,
      private_root: disposableRoot,
      execution_root: executionRoot,
      request,
      augnes_source: {
        base_commit: BASE_COMMIT,
        head_commit: source.head_commit,
        head_tree: source.head_tree,
      },
      expires_at: new Date(Date.now() + 10 * 60_000).toISOString(),
    });
    const adapter = createCodexAppServerAdapterV01({
      ordinary_authenticated_candidate_execution: capability,
    });
    invocation = adapter.invoke(request, {
      cancellation_signal: new AbortController().signal,
      timeout_ms: CANARY_TIMEOUT_MS,
      stop_settle_timeout_ms: 5_000,
    });
    timeout = setTimeout(() => {
      void invocation
        ?.request_stop({ reason: "timeout" })
        .catch(() => undefined);
    }, CANARY_TIMEOUT_MS);
    timeout.unref();
    try {
      result = await invocation.result;
    } catch (error) {
      failureCode = publicErrorCodeV01(error);
    } finally {
      if (timeout) clearTimeout(timeout);
      try {
        await invocation.settled;
        streamsClosed = true;
      } catch (error) {
        failureCode ??= publicErrorCodeV01(error);
      }
    }
  } catch (error) {
    failureCode ??= publicErrorCodeV01(error);
  } finally {
    if (timeout) clearTimeout(timeout);
    if (invocation && !streamsClosed) {
      await invocation
        .request_stop({ reason: "cancellation_requested" })
        .catch(() => undefined);
      streamsClosed = await invocation.settled.then(
        () => true,
        () => false,
      );
    }
    integrityAfter = integritySnapshotV01(codexHome);
    makeWritableV01(disposableRoot);
    rmSync(disposableRoot, { recursive: true, force: false });
    assert.equal(existsSync(disposableRoot), false);
  }
  if (!capability || !request) {
    process.stdout.write(
      `${JSON.stringify({
        passed: false,
        disposition: "HOLD_PRE_PROVIDER_CANARY_SETUP_FAILED",
        public_reason: failureCode ?? "codex_candidate_canary_setup_failed",
        provider_model_invocations: 0,
        binary_archive_acquisitions: binaryArchiveAcquisitions,
        disposable_roots_removed: true,
      })}\n`,
    );
    process.exitCode = 2;
    return;
  }
  const receipt = createCodex01532OrdinaryAuthenticatedCanaryReceiptV01({
    capability,
    augnes_source: {
      base_commit: BASE_COMMIT,
      head_commit: source.head_commit,
      head_tree: source.head_tree,
    },
    request,
    result,
    failure_code: failureCode,
    integrity_before_fingerprint: integrityBefore,
    integrity_after_fingerprint: integrityAfter,
    streams_closed: streamsClosed,
    remaining_owned_processes: 0,
    disposable_roots_removed: true,
    observed_at: new Date().toISOString(),
  });
  validateCodex01532OrdinaryAuthenticatedCanaryReceiptV01(receipt, {
    base_commit: BASE_COMMIT,
    head_commit: source.head_commit,
    head_tree: source.head_tree,
  });
  const receiptDirectory = path.join(
    process.cwd(),
    ".augnes-local-verification",
    "codex-candidate-receipts",
  );
  mkdirSync(receiptDirectory, { recursive: true, mode: 0o700 });
  const receiptPath = path.join(
    receiptDirectory,
    `${source.head_commit}.codex-0.153.2-ordinary-authenticated.json`,
  );
  writeFileSync(receiptPath, `${JSON.stringify(receipt, null, 2)}\n`, {
    mode: 0o600,
    flag: "wx",
  });
  const report = {
    passed:
      receipt.disposition ===
      "ORDINARY_AUTHENTICATED_CANARY_PASS_CANDIDATE_EVIDENCE",
    disposition: receipt.disposition,
    receipt_path: receiptPath,
    receipt_fingerprint: receipt.receipt_fingerprint,
    augnes_head: source.head_commit,
    augnes_tree: source.head_tree,
    archive_size_bytes: observedArchiveSize,
    archive_sha256: observedArchiveDigest,
    native_size_bytes: observedNativeSize,
    native_sha256: observedNativeDigest,
    cli_version: observedCliVersion,
    exercised_methods: receipt.exercised_methods,
    expected_public_token: CODEX_0_153_2_ORDINARY_CANARY_TOKEN_V01,
    observed_public_token: receipt.observed_public_token,
    provider_model_invocations: receipt.observations.provider_model_invocations,
    approvals: receipt.observations.approvals,
    tools: receipt.observations.tools,
    commands: receipt.observations.commands,
    writes: receipt.observations.writes,
    repository_tasks: receipt.observations.repository_tasks,
    external_effects: receipt.observations.external_effects,
    keychain_direct_accesses: receipt.observations.keychain_direct_accesses,
    agent_identity_attempts: receipt.observations.agent_identity_attempts,
    official_source_api_reads: officialSourceApiReads,
    binary_archive_acquisitions: binaryArchiveAcquisitions,
    other_network_destinations: 0,
    auth_config_integrity_unchanged: receipt.integrity.unchanged,
    streams_closed: receipt.settlement.streams_closed,
    remaining_owned_processes: receipt.settlement.remaining_owned_processes,
    disposable_roots_removed: receipt.settlement.disposable_roots_removed,
    global_path_fallback_used: false,
  };
  process.stdout.write(`${JSON.stringify(report)}\n`);
  if (!report.passed) process.exitCode = 2;
}

function assertRegistryBeforeCanaryV01(): void {
  const candidate = CODEX_QUALIFIED_RUNTIME_REGISTRY_V01.artifacts.find(
    ({ entry_id }) => entry_id === "codex-rust-v0.153.2-darwin-arm64",
  );
  assert.ok(candidate);
  assert.equal(candidate.lanes.ordinary_chatgpt_auth.status, "candidate");
  assert.equal(candidate.lanes.ordinary_chatgpt_auth.qualified_at, null);
  assert.equal(candidate.lanes.strict_agent_identity.status, "hold");
  assert.equal(
    candidate.qualification_evidence.kind,
    "candidate_source_schema_review_v0_1",
  );
  const production = selectPinnedCodexQualifiedRuntimeV01({
    lane: "ordinary_chatgpt_auth",
  });
  assert.equal(production.artifact.version, "0.152.1");
  assert.equal(
    CODEX_QUALIFIED_RUNTIME_REGISTRY_V01.production_selection.entry_id,
    "codex-rust-v0.152.1-darwin-arm64",
  );
}

function candidateRequestV01(
  executionRoot: string,
  sourceHead: string,
): NativeHostRequestV01 {
  const packet = buildTaskContextPacketV01(
    structuredClone(genericCliBuilderInputFixture),
  );
  const stat = statSync(executionRoot, { bigint: true });
  const id = sourceHead.slice(0, 16);
  const rootFingerprint = createProtocolSha256V01(`candidate-root:${id}`);
  return {
    request_version: "native_host_request.v0.1",
    request_id: `candidate-request:${id}`,
    run_id: `candidate-run:${id}`,
    idempotency_key: createProtocolSha256V01(`candidate-idempotency:${id}`),
    workspace_id: packet.workspace_id,
    project_id: packet.project_id,
    work_ref: refV01("work", `candidate-work:${id}`),
    task_ref: refV01("task", `candidate-task:${id}`),
    task_context_packet_ref: refV01("task_context_packet", packet.packet_id),
    packet,
    packet_lineage: {
      source_transition_receipt_ref: refV01(
        "state_transition_receipt",
        `candidate-transition:${id}`,
      ),
      packet_source_refs: [],
      selected_context_refs: [],
    },
    mode: "policy_triggered",
    root_scope: {
      canonical_root: executionRoot,
      path_flavor: "posix",
      root_kind: "plain_folder",
      root_fingerprint: rootFingerprint,
      physical_root_identity: {
        identity_version: "native_host_physical_root_identity.v0.1",
        canonical_realpath_fingerprint: rootFingerprint,
        device: String(stat.dev),
        inode: String(stat.ino),
      },
      root_scope_ref: refV01("project_root_scope", `candidate-scope:${id}`),
      repository_ref: null,
      selected_worktree_ref: null,
    },
    requested_capability: CODEX_0_153_2_ORDINARY_CANARY_CAPABILITY_VERSION_V01,
    allowed_operation_categories: [
      "read_validated_task_context",
      "return_bounded_public_token",
    ],
    forbidden_operation_categories: [
      "all_external_effects",
      "network_egress",
      "tool_use",
      "command_execution",
      "file_change",
      "repository_task",
    ],
    packet_capability_grant: packet.capability_grant,
    execution_grant_ref: null,
    automation_context: null,
    repository_delegation_context: null,
    repository_resume_context: null,
    policy: {
      filesystem: "selected_project_root_only",
      network: "forbidden",
      commands: "approval_required",
      model: "native_host_managed",
      host_egress: "bounded_capability_grant",
      max_changed_files: 0,
      max_artifacts: 0,
      max_commands: 0,
      max_checks: 8,
      timeout_ms: CANARY_TIMEOUT_MS,
      stop_settle_timeout_ms: 5_000,
      stop_conditions: ["timeout", "cancellation_requested"],
    },
    result_return: {
      return_version: "native_host_result_return.v0.1",
      structured_result_required: true,
      legacy_result_text_allowed: false,
      raw_output_allowed: false,
      max_result_bytes: 8 * 1024,
    },
  };
}

function integritySnapshotV01(codexHome: string): string {
  const targets = [
    "auth.json",
    "config.toml",
    "history.jsonl",
    "state_5.sqlite",
    "memory",
    "memories",
    "skills",
    "plugins",
    "mcp",
  ];
  const material = targets.map((relative) => ({
    surface: relative,
    fingerprint: fingerprintPathV01(path.join(codexHome, relative), codexHome),
  }));
  return createProtocolSha256V01(JSON.stringify(material));
}

function fingerprintPathV01(target: string, root: string): string {
  if (!existsSync(target)) return "absent";
  const stat = lstatSync(target);
  if (stat.isSymbolicLink())
    return createProtocolSha256V01(`symlink:${path.relative(root, target)}`);
  if (stat.isFile()) return sha256V01(readFileSync(target));
  if (!stat.isDirectory()) return "unsupported";
  const children = readdirSync(target)
    .sort()
    .map((name) => ({
      name_fingerprint: createProtocolSha256V01(name),
      value: fingerprintPathV01(path.join(target, name), root),
    }));
  return createProtocolSha256V01(JSON.stringify(children));
}

async function githubJsonV01(url: string): Promise<unknown> {
  assert.equal(
    url.startsWith("https://api.github.com/repos/openai/codex/"),
    true,
  );
  const response = await fetch(url, {
    headers: {
      Accept: "application/vnd.github+json",
      "User-Agent": "augnes-codex-0.153.2-ordinary-authenticated-canary",
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
  const asset = arrayV01(release.assets)
    .map(recordV01)
    .find((candidate) => candidate.id === ASSET_ID);
  assert.ok(asset);
  assert.equal(asset.name, ASSET_NAME);
  assert.equal(asset.size, ARCHIVE_SIZE);
  assert.equal(asset.digest, ARCHIVE_DIGEST);
  assert.equal(asset.browser_download_url, DOWNLOAD_URL);
}

function exactGitSourceV01(): { head_commit: string; head_tree: string } {
  assert.equal(gitV01(["rev-parse", BASE_COMMIT]), BASE_COMMIT);
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
  assert.equal(ancestry.status, 0);
  const head = gitV01(["rev-parse", "HEAD"]);
  const tree = gitV01(["rev-parse", "HEAD^{tree}"]);
  assert.match(head, /^[a-f0-9]{40}$/u);
  assert.match(tree, /^[a-f0-9]{40}$/u);
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

function createPrivateDirectoryV01(parent: string, name: string): string {
  const target = path.join(parent, name);
  mkdirSync(target, { mode: 0o700 });
  chmodSync(target, 0o700);
  return realpathSync.native(target);
}

function physicallyContainedV01(value: string, root: string): boolean {
  const relative = path.relative(root, value);
  return (
    relative === "" ||
    (!relative.startsWith("..") && !path.isAbsolute(relative))
  );
}

function recordV01(value: unknown): Record<string, unknown> {
  assert.ok(value && typeof value === "object" && !Array.isArray(value));
  return value as Record<string, unknown>;
}

function arrayV01(value: unknown): unknown[] {
  assert.ok(Array.isArray(value));
  return value;
}

function refV01(refType: string, externalId: string): ExternalRefV01 {
  return {
    ref_version: "external_ref.v0.1",
    ref_type: refType,
    external_id: externalId,
    observed_at: new Date().toISOString(),
    trust_class: "direct_local_observation",
  };
}

function sha256V01(value: Buffer): string {
  return `sha256:${createHash("sha256").update(value).digest("hex")}`;
}

function publicErrorCodeV01(error: unknown): string {
  if (
    error instanceof Error &&
    "code" in error &&
    typeof error.code === "string"
  )
    return error.code;
  return error instanceof Error && /^[a-z0-9_.:-]{1,160}$/u.test(error.message)
    ? error.message
    : "codex_candidate_canary_failed";
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

void main();
