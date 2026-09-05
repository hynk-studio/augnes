import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, realpathSync, rmSync, symlinkSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { gzipSync } from "node:zlib";
import {
  classifyCodexRollingDeltaV01, codexRollingFingerprintV01, freezeCodexRollingIdentityV01,
  isNewerCodexRollingStableV01, runCodexRollingCheapGateV01, runCodexRollingCandidateGatesV01, runCodexRollingStableCandidateV01,
} from "../lib/vnext/native-host/codex-rolling-stable-candidate";
import { extractDiscoveredCodexCandidateArchiveV01 } from "../lib/vnext/native-host/codex-managed-runtime-store";
import { CODEX_QUALIFIED_RUNTIME_REGISTRY_V01, selectPinnedCodexQualifiedRuntimeV01 } from "../lib/vnext/native-host/codex-qualified-runtime-registry";

const hash = (bytes: Buffer) => `sha256:${createHash("sha256").update(bytes).digest("hex")}`;
const root = realpathSync.native(mkdtempSync(path.join(os.tmpdir(), "augnes-rolling-test-")));
const originalFetch = globalThis.fetch;
const originalRegistry = JSON.stringify(CODEX_QUALIFIED_RUNTIME_REGISTRY_V01);
const protocol = "codex-rs/app-server-protocol/schema/json/codex_app_server_protocol.schemas.json";
const baseEntries = [{ path: protocol, type: "blob", mode: "100644", sha: "a".repeat(40) },
  { path: "codex-rs/app-server/src/lib.rs", type: "blob", mode: "100644", sha: "b".repeat(40) }];
function metadata(version = "9.8.7", archive = tar()) {
  const tagName = `rust-v${version}`;
  const release = { id: 123, tag_name: tagName, draft: false, prerelease: false,
    published_at: "2026-09-05T00:00:00Z", html_url: `https://github.com/openai/codex/releases/tag/${tagName}`,
    assets: [{ id: 456, name: "codex-aarch64-apple-darwin.tar.gz", size: archive.length, digest: hash(archive),
      browser_download_url: `https://github.com/openai/codex/releases/download/${tagName}/codex-aarch64-apple-darwin.tar.gz` }] };
  return { latest: structuredClone(release), release,
    ref: { ref: `refs/tags/${tagName}`, object: { type: "tag", sha: "1".repeat(40) } },
    tag: { sha: "1".repeat(40), tag: tagName, object: { type: "commit", sha: "2".repeat(40) } },
    commit: { sha: "2".repeat(40), tree: { sha: "3".repeat(40) } } };
}
function tar(name = "codex-aarch64-apple-darwin", type = "0", native = true): Buffer {
  const data = Buffer.alloc(32);
  if (native) { data.set([0xcf, 0xfa, 0xed, 0xfe]); data.writeUInt32LE(0x0100000c, 4); data.writeUInt32LE(2, 12); }
  const header = Buffer.alloc(512);
  header.write(name, 0, 100, "ascii");
  header.write("0000755\0", 100, 8, "ascii");
  header.write("0000000\0", 108, 8, "ascii"); header.write("0000000\0", 116, 8, "ascii");
  header.write(`${data.length.toString(8).padStart(11, "0")}\0`, 124, 12, "ascii");
  header.write("00000000000\0", 136, 12, "ascii"); header.fill(32, 148, 156);
  header.write(type, 156, 1, "ascii"); header.write("ustar\0", 257, 6, "ascii"); header.write("00", 263, 2, "ascii");
  header.write(`${header.reduce((sum, byte) => sum + byte, 0).toString(8).padStart(6, "0")}\0 `, 148, 8, "ascii");
  return gzipSync(Buffer.concat([header, data, Buffer.alloc(512 - data.length), Buffer.alloc(1024)]));
}
const pass = () => ({ state: "compatible_exact" as const, observed_cli_version: "9.8.7", cli_reported_version: "9.8.7",
  observed_policy_fingerprint: `sha256:${"1".repeat(64)}`, runtime_exercised_methods: ["initialize", "initialized", "account/read", "config/read"],
  observed_notifications: [], executable_fingerprint: `sha256:${"2".repeat(64)}`, private_environment_observed: true,
  account_disposition: "unauthenticated_empty_state" as const, process_settled: true, streams_closed: true, cleanup_completed: true, observed_at: "2026-09-05T00:00:00Z" });
const fail = () => ({ ...pass(), state: "unavailable" as const, runtime_exercised_methods: ["initialize"] });
async function main(): Promise<void> {
  try {
    const frozen = freezeCodexRollingIdentityV01(metadata());
    assert.equal(frozen.version, "9.8.7");
    assert.equal(Object.isFrozen(frozen), true);
    assert.equal(Object.isFrozen(frozen.qualified_provenance_asset), true);
    assert.equal(isNewerCodexRollingStableV01("0.153.3", "0.152.1"), true);
    assert.equal(isNewerCodexRollingStableV01("0.152.1", "0.152.1"), false);
    assert.equal(isNewerCodexRollingStableV01("0.9.0", "0.10.0"), false);
    assert.throws(() => isNewerCodexRollingStableV01("1.0.0-beta", "0.1.0"));
    for (const mutate of [
      (m: ReturnType<typeof metadata>) => { m.latest.tag_name = "rust-v9.8.8"; },
      (m: ReturnType<typeof metadata>) => { m.latest.prerelease = true; },
      (m: ReturnType<typeof metadata>) => { m.release.draft = true; },
      (m: ReturnType<typeof metadata>) => { m.release.id++; },
      (m: ReturnType<typeof metadata>) => { m.release.assets[0]!.digest = "sha256:" + "0".repeat(64); },
      (m: ReturnType<typeof metadata>) => { m.release.assets[0]!.name = "codex-package-aarch64-apple-darwin.tar.gz"; },
      (m: ReturnType<typeof metadata>) => { m.release.assets[0]!.name = "codex-app-server-aarch64-apple-darwin.tar.gz"; },
      (m: ReturnType<typeof metadata>) => { m.release.assets.push(m.release.assets[0]!); },
      (m: ReturnType<typeof metadata>) => { m.tag.object.sha = "9".repeat(40); },
      (m: ReturnType<typeof metadata>) => { m.tag.tag = "rust-v1.1.1"; },
      (m: ReturnType<typeof metadata>) => { m.ref.object.type = "commit"; },
    ]) { const m = metadata(); mutate(m); assert.throws(() => freezeCodexRollingIdentityV01(m)); }

    for (const [sequence, expected] of [
      [[pass()], "PASS"], [[fail(), fail()], "HOLD_PROVIDER_FREE_CONTRACT"],
      [[fail(), pass()], "HOLD_NONDETERMINISTIC_GATE"],
      [[{ ...fail(), process_settled: false }], "HOLD_CLEANUP"],
      [[{ ...pass(), streams_closed: false }], "HOLD_CLEANUP"],
      [[fail(), { ...pass(), cleanup_completed: false }], "HOLD_CLEANUP"],
    ] as const) {
      let calls = 0;
      const result = await runCodexRollingCheapGateV01(async () => {
        assert.ok(calls < sequence.length, "no third or unnecessary attempt");
        return structuredClone(sequence[calls++]!);
      });
      assert.equal(result.disposition, expected); assert.equal(calls, sequence.length);
    }
    const before = { sha: "4".repeat(40), truncated: false, tree: baseEntries };
    function classify(entries = baseEntries) {
      return classifyCodexRollingDeltaV01({ baseline_source_commit: "1".repeat(40), candidate_source_commit: "2".repeat(40),
        baseline_tree: before, candidate_tree: { sha: "5".repeat(40), truncated: false, tree: entries } });
    }
    assert.equal(classify().classification, "compatible_irrelevant_delta");
    assert.equal(classify([...baseEntries, { path: "docs/new.md", type: "blob", mode: "100644", sha: "6".repeat(40) }]).classification, "compatible_irrelevant_delta");
    assert.equal(classify(baseEntries.map((e) => e.path === protocol ? e : { ...e, sha: "6".repeat(40) })).classification, "behavior_bearing_review_required");
    assert.equal(classify(baseEntries.map((e) => e.path === protocol ? { ...e, sha: "6".repeat(40) } : e)).classification, "incompatible_or_unclear");
    assert.equal(classify([...baseEntries, { path: "unknown-launcher.js", type: "blob", mode: "100644", sha: "6".repeat(40) }]).classification, "incompatible_or_unclear");
    assert.throws(() => classifyCodexRollingDeltaV01({ baseline_source_commit: "1".repeat(40), candidate_source_commit: "2".repeat(40), baseline_tree: before, candidate_tree: { ...before, truncated: true } }));
    assert.throws(() => classify([]));
    for (const sequence of [[pass()], [fail(), fail()], [fail(), pass()]]) {
      let probes = 0, comparisons = 0;
      const result = await runCodexRollingCandidateGatesV01({
        probe: async () => sequence[probes++]!,
        compare: async () => { comparisons++; return classify(); },
      });
      assert.equal(comparisons, sequence.length === 1 ? 1 : 0);
      assert.equal(result.disposition, sequence.length === 1 ? "AUTHENTICATED_CANARY_REQUIRED" :
        sequence[1]!.state === "compatible_exact" ? "HOLD_NONDETERMINISTIC_GATE" : "HOLD_PROVIDER_FREE_CONTRACT");
    }


    if (process.platform === "darwin" && process.arch === "arm64") {
      for (const [name, archive] of [["traversal", tar("../codex")], ["symlink-member", tar(undefined, "2")], ["wrong-native", tar(undefined, "0", false)]] as const) {
        const destination = path.join(root, name); mkdirSync(destination, { mode: 0o700 });
        assert.throws(() => extractDiscoveredCodexCandidateArchiveV01({ artifact: freezeCodexRollingIdentityV01(metadata("9.8.7", archive)), archive_bytes: archive, destination }));
      }
      const destination = path.join(root, "digest"); mkdirSync(destination, { mode: 0o700 });
      assert.throws(() => extractDiscoveredCodexCandidateArchiveV01({ artifact: frozen, archive_bytes: Buffer.from("corrupt"), destination }));
      assert.deepEqual(readdirSync(destination), []);
      const redirected = path.join(root, "redirected"); symlinkSync(destination, redirected);
      assert.throws(() => extractDiscoveredCodexCandidateArchiveV01({ artifact: frozen, archive_bytes: tar(), destination: redirected }));
      await fullFailureAndReplay();
    }
    assert.equal(JSON.stringify(CODEX_QUALIFIED_RUNTIME_REGISTRY_V01), originalRegistry);
    const production = selectPinnedCodexQualifiedRuntimeV01();
    assert.equal(production.artifact.version, "0.152.1");
    assert.equal(production.artifact.lanes.strict_agent_identity.status, "hold");
    assert.equal(CODEX_QUALIFIED_RUNTIME_REGISTRY_V01.artifacts.find((entry) => entry.version === "0.153.2")!.lanes.ordinary_chatgpt_auth.status, "candidate");
  } finally { globalThis.fetch = originalFetch; rmSync(root, { recursive: true, force: false }); }
  assert.equal(existsSync(root), false);
  console.log(JSON.stringify({ status: "passed", contract: "codex_rolling_stable_candidate.v0.1", synthetic_only: true, live_candidate_attempts: 0,
    provider_model_calls: 0, external_network_calls: 0, owned_process_residue: 0, disposable_state_removed: true, production: "0.152.1 pinned_exact" }));
}
async function fullFailureAndReplay(): Promise<void> {
  const archive = tar(); // Deliberately non-runnable synthetic Mach-O; never an upstream release.
  let reads: string[] = [];
  let selectedVersion = "9.8.7", latestVersion = selectedVersion;
  let releaseReads = 0, commitReads = 0;
  let conflict: "none" | "release_tag" | "source_tree" | "tag_peel" | "asset" | "bytes" = "none";
  globalThis.fetch = async (input) => {
    const url = String(input); reads.push(url);
    const m = metadata(selectedVersion, archive);
    if (url === "https://api.github.com/repos/openai/codex/releases/latest")
      return new Response(JSON.stringify(metadata(latestVersion, archive).latest));
    if (url === "https://api.github.com/repos/openai/codex/releases/123") {
      releaseReads++;
      if (releaseReads > 1 && conflict === "release_tag") m.release.tag_name = "rust-v1.1.1";
      if (releaseReads > 1 && conflict === "asset") m.release.assets[0]!.digest = "sha256:" + "9".repeat(64);
      return new Response(JSON.stringify(m.release));
    }
    if (url === `https://api.github.com/repos/openai/codex/git/commits/${m.commit.sha}`) {
      commitReads++;
      // The next stable appears after discovery's exact tuple resolves. It must never be reread in this cycle.
      latestVersion = "9.8.8";
      if (commitReads > 1 && conflict === "source_tree") m.commit.tree.sha = "9".repeat(40);
      return new Response(JSON.stringify(m.commit));
    }
    if (releaseReads > 1 && conflict === "tag_peel") m.tag.object.sha = "9".repeat(40);
    const responses = new Map<string, unknown>([
      [`https://api.github.com/repos/openai/codex/git/ref/tags/rust-v${selectedVersion}`, m.ref],
      [`https://api.github.com/repos/openai/codex/git/tags/${m.tag.sha}`, m.tag],
    ]);
    if (responses.has(url)) return new Response(JSON.stringify(responses.get(url)));
    if (url === m.release.assets[0]!.browser_download_url)
      return new Response(new Uint8Array(conflict === "bytes" ? Buffer.from("invalid") : archive));
    throw new Error("test_unexpected_network_or_post_failure_source_comparison");
  };
  const evidence = path.join(root, "evidence"); mkdirSync(evidence, { mode: 0o700 });
  const input = { augnes_source: { base_commit: "0".repeat(40), head_commit: "1".repeat(40), head_tree: "2".repeat(40) }, evidence_directory: evidence };
  const first = await runCodexRollingStableCandidateV01(input);
  assert.equal(first.receipt.candidate.version, "9.8.7");
  assert.equal(latestVersion, "9.8.8");
  assert.equal(reads.filter((url) => url.endsWith("/releases/latest")).length, 1);
  assert.equal(first.receipt.disposition, "HOLD_PROVIDER_FREE_CONTRACT");
  assert.equal(first.receipt.attempts.length, 2);
  assert.equal(first.receipt.delta, null); assert.equal(first.receipt.authenticated_canary, "not_reached");
  assert.deepEqual(first.receipt.cleanup, { disposable_staging_removed: true, process_settled: true, streams_closed: true });
  assert.equal(reads.filter((url) => url.includes("/releases/download/")).length, 1);
  assert.equal(reads.some((url) => url.includes("9.8.8")), false);
  const { receipt_fingerprint, ...material } = first.receipt;
  assert.equal(receipt_fingerprint, codexRollingFingerprintV01(material));
  assert.equal(JSON.parse(readFileSync(first.receipt_path, "utf8")).receipt_fingerprint, receipt_fingerprint);
  reads = []; latestVersion = selectedVersion; releaseReads = commitReads = 0;
  const replay = await runCodexRollingStableCandidateV01(input);
  assert.equal(replay.reused, true); assert.deepEqual(replay.receipt, first.receipt);
  assert.equal(reads.some((url) => url.includes("/releases/download/")), false);
  assert.equal(reads.some((url) => url.includes("0.153.2")), false);
  for (const olderVersion of ["0.1.0", "0.153.2", "9.8.6"]) {
    selectedVersion = latestVersion = olderVersion; reads = []; releaseReads = commitReads = 0;
    const older = await runCodexRollingStableCandidateV01(input);
    assert.equal(older.receipt.disposition, "NO_NEWER_STABLE"); assert.equal(older.receipt.attempts.length, 0);
    assert.equal(reads.some((url) => url.includes("/releases/download/")), false);
    const { receipt_fingerprint: olderHash, ...olderMaterial } = older.receipt;
    assert.equal(olderHash, codexRollingFingerprintV01(olderMaterial));
  }
  selectedVersion = "9.8.7";
  for (const mutation of ["release_tag", "source_tree", "tag_peel", "asset", "bytes"] as const) {
    conflict = mutation; latestVersion = selectedVersion; reads = []; releaseReads = commitReads = 0;
    const isolated = path.join(root, `conflict-${mutation}`); mkdirSync(isolated, { mode: 0o700 });
    const result = await runCodexRollingStableCandidateV01({ ...input, evidence_directory: isolated });
    assert.equal(result.receipt.disposition, "HOLD_INTERRUPTED_OR_INCOMPLETE", mutation);
    assert.equal(result.receipt.attempts.length, 0, mutation);
    assert.equal(result.receipt.authority.qualified, false);
    assert.equal(result.receipt.authority.production_adoption, false);
    assert.equal(result.receipt.cleanup.disposable_staging_removed, true);
    assert.equal(reads.filter((url) => url.includes("/releases/download/")).length, mutation === "bytes" ? 1 : 0);
    assert.equal(reads.filter((url) => url.endsWith("/releases/latest")).length, 1);
  }
}
main().catch((error: unknown) => { console.error(error); process.exitCode = 1; });
