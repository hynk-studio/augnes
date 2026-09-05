import {
  chmodSync, existsSync, lstatSync, mkdirSync, mkdtempSync, readFileSync,
  readdirSync, realpathSync, renameSync, rmSync, writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";

import { CODEX_APP_SERVER_ADAPTER_VERSION_V01, probeCodexCredentialFreeExactProfileV01 } from "./codex-app-server-adapter";
import { observeReviewedCandidateCodexAppServerUserAgentV01 } from "./codex-app-server-user-agent";
import { extractDiscoveredCodexCandidateArchiveV01 } from "./codex-managed-runtime-store";
import { CANDIDATE_CONFIG_OVERRIDE_ARGS_V01, observeCandidateConfigPolicyV01 } from "./codex-ordinary-runtime-candidate";
import {
  CODEX_QUALIFIED_RUNTIME_REGISTRY_FINGERPRINT_V01,
  CODEX_QUALIFIED_RUNTIME_REGISTRY_V01,
  selectPinnedCodexQualifiedRuntimeV01,
} from "./codex-qualified-runtime-registry";
import { canonicalizeProtocolValueV01, createProtocolSha256V01 } from "../protocol-primitives";

const API = "https://api.github.com/repos/openai/codex";
const SHA = /^[a-f0-9]{40}$/u;
const VERSION = /^(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)$/u;
const ASSET = "codex-aarch64-apple-darwin.tar.gz";
export const CODEX_ROLLING_CANDIDATE_VERSION_V01 = "codex_rolling_stable_candidate.v0.1";
export interface CodexRollingIdentityV01 {
  version: string;
  release_tag: string;
  release_id: number;
  release_published_at: string;
  tag_object: string;
  tagged_source_commit: string;
  source_tree: string;
  platform: "darwin";
  architecture: "arm64";
  upstream_target_triple: "aarch64-apple-darwin";
  qualified_provenance_asset: {
    acquisition_route: "standalone_release_tarball";
    asset_id: number;
    asset_name: string;
    size_bytes: number;
    digest: string;
    digest_mechanism: "official_github_release_asset_digest_sha256";
  };
}

type Probe = Awaited<ReturnType<typeof probeCodexCredentialFreeExactProfileV01>>;
export type CodexRollingDispositionV01 =
  | "NO_NEWER_STABLE" | "CANDIDATE_STAGED_GATE_PENDING"
  | "HOLD_PROVIDER_FREE_CONTRACT" | "HOLD_NONDETERMINISTIC_GATE"
  | "HOLD_CLEANUP" | "HOLD_INTERRUPTED_OR_INCOMPLETE"
  | "HOLD_INCOMPATIBLE_OR_UNCLEAR_DELTA" | "HOLD_EXPLICIT_SEMANTIC_REVIEW_REQUIRED"
  | "AUTHENTICATED_CANARY_REQUIRED";
export interface CodexRollingDeltaV01 {
  classification: "compatible_irrelevant_delta" | "behavior_bearing_review_required" | "incompatible_or_unclear";
  baseline_source_commit: string;
  candidate_source_commit: string;
  baseline_tree: string;
  candidate_tree: string;
  changed_paths: string[];
  reason: string;
}
export interface CodexRollingReceiptV01 {
  receipt_version: string;
  observed_at: string;
  augnes_source: { base_commit: string; head_commit: string; head_tree: string };
  registry_fingerprint: string;
  compatibility_profile_fingerprint: string;
  production_selection: { mode: "pinned_exact"; entry_id: string; version: string; lane: "ordinary_chatgpt_auth" };
  candidate: CodexRollingIdentityV01;
  native: null | { native_executable_sha256: string; extracted_native_size_bytes: number; archive_member_name: string };
  attempts: Probe[];
  delta: CodexRollingDeltaV01 | null;
  disposition: CodexRollingDispositionV01;
  authenticated_canary: "not_reached" | "separate_authorization_required";
  failure_reason: string | null;
  cleanup: { disposable_staging_removed: boolean; process_settled: boolean; streams_closed: boolean };
  authority: { candidate_evidence_only: true; qualified: false; production_adoption: false; provider_turn_authorized: false };
  receipt_fingerprint: string;
}

export function codexRollingFingerprintV01(value: unknown): string {
  return createProtocolSha256V01(canonicalizeProtocolValueV01(value));
}

/** Stable discovery is never an instruction to fall back to another registry candidate. */
export function freezeCodexRollingIdentityV01(input: {
  latest: unknown; release: unknown; ref: unknown; tag: unknown; commit: unknown;
}): CodexRollingIdentityV01 {
  const latest = record(input.latest);
  const release = record(input.release);
  const expectedTag = stableReleaseTagV01(latest);
  const version = expectedTag.slice("rust-v".length);
  for (const entry of [latest, release]) {
    if (entry.tag_name !== expectedTag || entry.draft !== false || entry.prerelease !== false ||
        !positive(entry.id) || entry.html_url !== `https://github.com/openai/codex/releases/tag/${expectedTag}` ||
        typeof entry.published_at !== "string" || !Number.isFinite(Date.parse(entry.published_at)))
      throw new Error("codex_rolling_release_identity_invalid");
  }
  const assets = (entry: Record<string, unknown>) => {
    if (!Array.isArray(entry.assets)) throw new Error("codex_rolling_asset_missing");
    const matched = entry.assets.map(record).filter((asset) => asset.name === ASSET);
    if (matched.length !== 1) throw new Error("codex_rolling_asset_ambiguous");
    const asset = matched[0]!;
    if (!positive(asset.id) || !positive(asset.size) || (asset.size as number) > 512 * 1024 * 1024 ||
        typeof asset.digest !== "string" || !/^sha256:[a-f0-9]{64}$/u.test(asset.digest) ||
        asset.browser_download_url !== `https://github.com/openai/codex/releases/download/${expectedTag}/${ASSET}`)
      throw new Error("codex_rolling_asset_identity_invalid");
    return { asset_id: asset.id as number, asset_name: ASSET, size_bytes: asset.size as number, digest: asset.digest };
  };
  const asset = assets(release);
  if (latest.id !== release.id || latest.published_at !== release.published_at ||
      codexRollingFingerprintV01(assets(latest)) !== codexRollingFingerprintV01(asset))
    throw new Error("codex_rolling_release_changed_during_discovery");
  const ref = record(input.ref), tag = record(input.tag), commit = record(input.commit);
  const refObject = record(ref.object), tagObject = record(tag.object), tree = record(commit.tree);
  if (ref.ref !== `refs/tags/${expectedTag}` || refObject.type !== "tag" ||
      !sha(refObject.sha) || tag.sha !== refObject.sha || tag.tag !== expectedTag ||
      tagObject.type !== "commit" || !sha(tagObject.sha) || commit.sha !== tagObject.sha || !sha(tree.sha))
    throw new Error("codex_rolling_tag_source_identity_invalid");
  // The official metadata and archive digest are provenance; no macOS signature is claimed.
  return Object.freeze({
    version, release_tag: expectedTag, release_id: release.id,
    release_published_at: release.published_at, tag_object: refObject.sha,
    tagged_source_commit: tagObject.sha, source_tree: tree.sha,
    platform: "darwin", architecture: "arm64", upstream_target_triple: "aarch64-apple-darwin",
    qualified_provenance_asset: Object.freeze({ acquisition_route: "standalone_release_tarball", ...asset,
      digest_mechanism: "official_github_release_asset_digest_sha256" }),
  }) as CodexRollingIdentityV01;
}

export function isNewerCodexRollingStableV01(candidate: string, qualified: string): boolean {
  if (!VERSION.test(candidate) || !VERSION.test(qualified)) throw new Error("codex_rolling_version_invalid");
  const left = candidate.split(".").map(BigInt), right = qualified.split(".").map(BigInt);
  for (let index = 0; index < 3; index++) if (left[index] !== right[index]) return left[index]! > right[index]!;
  return false;
}

/** A failed first attempt can never yield READY, including fail-then-pass. */
export async function runCodexRollingCheapGateV01(probe: () => Promise<Probe>): Promise<{
  attempts: Probe[]; disposition: "PASS" | CodexRollingDispositionV01;
}> {
  const attempts = [await probe()];
  if (!settled(attempts[0]!)) return { attempts, disposition: "HOLD_CLEANUP" };
  if (passed(attempts[0]!)) return { attempts, disposition: "PASS" };
  attempts.push(await probe());
  if (!settled(attempts[1]!)) return { attempts, disposition: "HOLD_CLEANUP" };
  return { attempts, disposition: passed(attempts[1]!) ? "HOLD_NONDETERMINISTIC_GATE" : "HOLD_PROVIDER_FREE_CONTRACT" };
}
/** Only a stable first-attempt PASS may reach the exact source comparison. */
export async function runCodexRollingCandidateGatesV01(input: {
  probe: () => Promise<Probe>;
  compare: () => Promise<CodexRollingDeltaV01>;
}): Promise<{ disposition: CodexRollingDispositionV01; attempts: Probe[]; delta: CodexRollingDeltaV01 | null }> {
  const gate = await runCodexRollingCheapGateV01(input.probe);
  if (gate.disposition !== "PASS") return { attempts: gate.attempts, disposition: gate.disposition, delta: null };
  const delta = await input.compare();
  return { attempts: gate.attempts, delta, disposition:
    delta.classification === "compatible_irrelevant_delta" ? "AUTHENTICATED_CANARY_REQUIRED" :
      delta.classification === "behavior_bearing_review_required" ? "HOLD_EXPLICIT_SEMANTIC_REVIEW_REQUIRED" : "HOLD_INCOMPATIBLE_OR_UNCLEAR_DELTA" };
}
function settled(probe: Probe): boolean { return probe.process_settled && probe.streams_closed && probe.cleanup_completed; }
function passed(probe: Probe): boolean {
  return probe.state === "compatible_exact" && settled(probe) && probe.private_environment_observed &&
    probe.account_disposition === "unauthenticated_empty_state" && probe.observed_policy_fingerprint !== null &&
    probe.observed_cli_version !== null && probe.observed_cli_version === probe.cli_reported_version &&
    JSON.stringify(probe.runtime_exercised_methods) === JSON.stringify(["initialize", "initialized", "account/read", "config/read"]);
}

/** Conservative exact-tree classifier. Changed schema or unclassified source never borrows compatibility. */
export function classifyCodexRollingDeltaV01(input: {
  baseline_source_commit: string; candidate_source_commit: string;
  baseline_tree: unknown; candidate_tree: unknown;
}): CodexRollingDeltaV01 {
  const before = treeEntries(input.baseline_tree), after = treeEntries(input.candidate_tree);
  const changed = [...new Set([...before.entries.keys(), ...after.entries.keys()])].filter(
    (name) => before.entries.get(name) !== after.entries.get(name),
  ).sort();
  const irrelevant = (name: string) => /^(?:docs\/|\.github\/ISSUE_TEMPLATE\/|sdk\/|codex-cli\/)/u.test(name) ||
    /^(?:README|CHANGELOG|CONTRIBUTING)\.md$/u.test(name);
  const relevant = (name: string) => /^codex-rs\/(?:app-server(?:-protocol)?|protocol|core|login|exec(?:-server)?|utils|process-hardening|cli|sandboxing)\//u.test(name) ||
    /^codex-rs\/(?:Cargo\.toml|Cargo\.lock|rust-toolchain\.toml)$/u.test(name);
  const schema = changed.some((name) => name.startsWith("codex-rs/app-server-protocol/schema/"));
  const documentationOnly = changed.every(irrelevant);
  const behaviorOnly = changed.every((name) => relevant(name) || irrelevant(name));
  const removed = changed.some((name) => before.entries.has(name) && !after.entries.has(name) && !irrelevant(name));
  return {
    classification: schema || removed || !behaviorOnly && !documentationOnly ? "incompatible_or_unclear" :
      documentationOnly ? "compatible_irrelevant_delta" : "behavior_bearing_review_required",
    baseline_source_commit: input.baseline_source_commit, candidate_source_commit: input.candidate_source_commit,
    baseline_tree: before.sha, candidate_tree: after.sha, changed_paths: changed.filter((name) => !irrelevant(name)),
    reason: schema ? "changed_exact_protocol_schema_requires_review_no_additive_inference" : removed ? "removed_source_requires_review" :
      documentationOnly ? "exact_runtime_and_schema_unchanged" : behaviorOnly ? "changed_runtime_source_requires_explicit_semantic_review" : "unclassified_upstream_delta",
  };
}
function treeEntries(value: unknown): { sha: string; entries: Map<string, string> } {
  const tree = record(value);
  if (!sha(tree.sha) || tree.truncated !== false || !Array.isArray(tree.tree) || tree.tree.length > 100_000)
    throw new Error("codex_rolling_source_tree_incomplete");
  const entries = new Map<string, string>();
  for (const item of tree.tree) {
    const entry = record(item);
    if (typeof entry.path !== "string" || !entry.path || entry.path.startsWith("/") || entry.path.split("/").includes("..") ||
        !sha(entry.sha) || typeof entry.mode !== "string" || !["blob", "tree", "commit"].includes(String(entry.type)) || entries.has(entry.path))
      throw new Error("codex_rolling_source_tree_invalid");
    if (entry.type !== "tree") entries.set(entry.path, `${entry.mode}:${entry.type}:${entry.sha}`);
  }
  if (!entries.has("codex-rs/app-server-protocol/schema/json/codex_app_server_protocol.schemas.json") ||
      !entries.has("codex-rs/app-server/src/lib.rs")) throw new Error("codex_rolling_source_schema_coverage_missing");
  return { sha: tree.sha, entries };
}

/** Exactly one latest read per cycle. Later resolution uses only the selected release ID/tag. */
export async function discoverCodexRollingStableV01(): Promise<CodexRollingIdentityV01> {
  const latest = record(await githubJson(`${API}/releases/latest`));
  return resolveCodexRollingIdentityV01(latest);
}
function stableReleaseTagV01(release: Record<string, unknown>): string {
  if (typeof release.tag_name !== "string" || !release.tag_name.startsWith("rust-v") ||
      !VERSION.test(release.tag_name.slice("rust-v".length)) || release.draft !== false ||
      release.prerelease !== false || !positive(release.id))
    throw new Error("codex_rolling_stable_release_invalid");
  return release.tag_name;
}
async function resolveCodexRollingIdentityV01(latest: Record<string, unknown>): Promise<CodexRollingIdentityV01> {
  const releaseTag = stableReleaseTagV01(latest);
  const release = await githubJson(`${API}/releases/${latest.id}`);
  const ref = record(await githubJson(`${API}/git/ref/tags/${releaseTag}`));
  const refObject = record(ref.object);
  if (refObject.type !== "tag" || !sha(refObject.sha)) throw new Error("codex_rolling_tag_source_identity_invalid");
  const tag = record(await githubJson(`${API}/git/tags/${refObject.sha}`));
  const object = record(tag.object);
  if (object.type !== "commit" || !sha(object.sha)) throw new Error("codex_rolling_tag_source_identity_invalid");
  const commit = await githubJson(`${API}/git/commits/${object.sha}`);
  return freezeCodexRollingIdentityV01({ latest, release, ref, tag, commit });
}
/** Revalidate only this frozen tuple. A new latest release has no bearing on it. */
export async function reverifyCodexRollingIdentityV01(candidate: CodexRollingIdentityV01): Promise<void> {
  const asset = candidate.qualified_provenance_asset;
  const snapshot = {
    id: candidate.release_id, tag_name: candidate.release_tag, draft: false, prerelease: false,
    published_at: candidate.release_published_at,
    html_url: `https://github.com/openai/codex/releases/tag/${candidate.release_tag}`,
    assets: [{ id: asset.asset_id, name: asset.asset_name, size: asset.size_bytes, digest: asset.digest,
      browser_download_url: `https://github.com/openai/codex/releases/download/${candidate.release_tag}/${asset.asset_name}` }],
  };
  if (codexRollingFingerprintV01(await resolveCodexRollingIdentityV01(snapshot)) !== codexRollingFingerprintV01(candidate))
    throw new Error("codex_rolling_frozen_identity_changed");
}

/** One manual invocation, local evidence only. Existing records prevent retry across invocations. */
export async function runCodexRollingStableCandidateV01(input: {
  augnes_source: CodexRollingReceiptV01["augnes_source"];
  evidence_directory: string;
}): Promise<{ receipt: CodexRollingReceiptV01; receipt_path: string; reused: boolean }> {
  if (process.platform !== "darwin" || process.arch !== "arm64") throw new Error("codex_rolling_platform_unsupported");
  if (Object.values(input.augnes_source).some((value) => !SHA.test(value))) throw new Error("codex_rolling_augnes_source_invalid");
  const production = selectPinnedCodexQualifiedRuntimeV01({ lane: "ordinary_chatgpt_auth" });
  const candidate = await discoverCodexRollingStableV01();
  const directory = realpathSync.native(input.evidence_directory);
  const dirStat = lstatSync(input.evidence_directory);
  if (directory !== path.resolve(input.evidence_directory) || !dirStat.isDirectory() || dirStat.isSymbolicLink() || (dirStat.mode & 0o077) !== 0)
    throw new Error("codex_rolling_evidence_directory_invalid");
  const receiptPath = path.join(directory, `${candidate.release_tag}-${candidate.platform}-${candidate.architecture}.json`);
  if (existsSync(receiptPath)) {
    if (!lstatSync(receiptPath).isFile() || lstatSync(receiptPath).isSymbolicLink() || lstatSync(receiptPath).size > 16 * 1024 * 1024) throw new Error("codex_rolling_receipt_invalid");
    const receipt = JSON.parse(readFileSync(receiptPath, "utf8")) as CodexRollingReceiptV01;
    const { receipt_fingerprint, ...material } = receipt;
    if (receipt.receipt_version !== CODEX_ROLLING_CANDIDATE_VERSION_V01 ||
        codexRollingFingerprintV01(receipt.authority) !== codexRollingFingerprintV01({ candidate_evidence_only: true, qualified: false, production_adoption: false, provider_turn_authorized: false }) ||
        !Array.isArray(receipt.attempts) || receipt.attempts.length > 2 ||
        receipt.compatibility_profile_fingerprint !== production.compatibility_profile.fingerprint ||
        receipt_fingerprint !== codexRollingFingerprintV01(material) ||
        codexRollingFingerprintV01(receipt.candidate) !== codexRollingFingerprintV01(candidate) ||
        receipt.registry_fingerprint !== CODEX_QUALIFIED_RUNTIME_REGISTRY_FINGERPRINT_V01)
      throw new Error("codex_rolling_existing_evidence_mismatch_no_retry");
    // Even an interrupted/pending record is terminal for automatic invocation.
    if (receipt.disposition === "CANDIDATE_STAGED_GATE_PENDING")
      throw new Error("codex_rolling_interrupted_candidate_no_retry");
    return { receipt, receipt_path: receiptPath, reused: true };
  }
  let receipt: CodexRollingReceiptV01 = {
    receipt_version: CODEX_ROLLING_CANDIDATE_VERSION_V01, observed_at: new Date().toISOString(),
    augnes_source: input.augnes_source, registry_fingerprint: CODEX_QUALIFIED_RUNTIME_REGISTRY_FINGERPRINT_V01,
    compatibility_profile_fingerprint: production.compatibility_profile.fingerprint,
    production_selection: { mode: "pinned_exact", lane: "ordinary_chatgpt_auth", entry_id: production.artifact.entry_id, version: production.artifact.version },
    candidate, native: null, attempts: [], delta: null, disposition: "HOLD_INTERRUPTED_OR_INCOMPLETE", authenticated_canary: "not_reached", failure_reason: null,
    cleanup: { disposable_staging_removed: false, process_settled: true, streams_closed: true },
    authority: { candidate_evidence_only: true, qualified: false, production_adoption: false, provider_turn_authorized: false }, receipt_fingerprint: "",
  };
  const persist = (initial = false) => {
    const { receipt_fingerprint: ignored, ...material } = receipt;
    void ignored;
    receipt = { ...material, receipt_fingerprint: codexRollingFingerprintV01(material) };
    const target = initial ? receiptPath : `${receiptPath}.pending`;
    writeFileSync(target, `${JSON.stringify(receipt, null, 2)}\n`, { flag: "wx", mode: 0o600 });
    if (!initial) renameSync(target, receiptPath);
  };
  const previousVersions = CODEX_QUALIFIED_RUNTIME_REGISTRY_V01.artifacts
    .filter((artifact) => artifact.platform === candidate.platform && artifact.architecture === candidate.architecture)
    .map((artifact) => artifact.version);
  const records = readdirSync(directory).filter((name) => name.endsWith(".json") && name !== path.basename(receiptPath));
  if (records.length > 1_000) throw new Error("codex_rolling_evidence_inventory_bound_exceeded");
  for (const name of records) {
    const previousPath = path.join(directory, name);
    const stat = lstatSync(previousPath);
    if (!stat.isFile() || stat.isSymbolicLink() || stat.size > 16 * 1024 * 1024)
      throw new Error("codex_rolling_existing_evidence_invalid");
    const previous = JSON.parse(readFileSync(previousPath, "utf8")) as CodexRollingReceiptV01;
    const { receipt_fingerprint, ...material } = previous;
    if (previous.receipt_version !== CODEX_ROLLING_CANDIDATE_VERSION_V01 ||
        receipt_fingerprint !== codexRollingFingerprintV01(material) || !VERSION.test(previous.candidate.version))
      throw new Error("codex_rolling_existing_evidence_invalid");
    if (previous.candidate.platform === candidate.platform && previous.candidate.architecture === candidate.architecture)
      previousVersions.push(previous.candidate.version);
  }
  persist(true); // Exclusive exact-identity claim before any acquisition or launch.
  if (!previousVersions.every((version) => isNewerCodexRollingStableV01(candidate.version, version))) {
    receipt.disposition = "NO_NEWER_STABLE";
    receipt.cleanup.disposable_staging_removed = true;
    persist();
    return { receipt, receipt_path: receiptPath, reused: false };
  }
  let root: string | null = null;
  try {
    root = realpathSync.native(mkdtempSync(path.join(os.tmpdir(), "augnes-codex-rolling-")));
    chmodSync(root, 0o700);
    const extractionRoot = path.join(root, "artifact"), stateParent = path.join(root, "state"), executionRoot = path.join(root, "execution"), emptyPath = path.join(root, "path");
    for (const target of [extractionRoot, stateParent, executionRoot, emptyPath]) mkdirSync(target, { mode: 0o700 });
    await reverifyCodexRollingIdentityV01(candidate);
    const archive = await boundedFetch(`https://github.com/openai/codex/releases/download/${candidate.release_tag}/${ASSET}`,
      candidate.qualified_provenance_asset.size_bytes, "application/octet-stream", 120_000);
    const native = extractDiscoveredCodexCandidateArchiveV01({ artifact: candidate, archive_bytes: archive, destination: extractionRoot });
    receipt.native = { native_executable_sha256: native.native_executable_sha256,
      extracted_native_size_bytes: native.extracted_native_size_bytes, archive_member_name: native.archive_member_name };
    receipt.disposition = "CANDIDATE_STAGED_GATE_PENDING";
    persist();
    const gate = await runCodexRollingCandidateGatesV01({ probe: async () => {
      receipt.disposition = "HOLD_INTERRUPTED_OR_INCOMPLETE";
      persist();
      const probe = await probeCodexCredentialFreeExactProfileV01({
        command: native.native_executable, expected_executable_fingerprint: native.native_executable_sha256,
        executable_identity_class: "qualification_candidate_rolling_stable", accepted_exact_identity: true,
        expected_cli_version: candidate.version, config_override_args: CANDIDATE_CONFIG_OVERRIDE_ARGS_V01,
        run_cli_version_probe: true, require_unauthenticated_account: true,
        allowed_notifications: [...production.compatibility_profile.semantics.notifications.bounded_observed_optional,
          ...production.compatibility_profile.semantics.notifications.ignored_optional],
        observe_semantic_profile: ({ initialized, config }) => {
          const userAgent = observeReviewedCandidateCodexAppServerUserAgentV01({
            raw_user_agent: initialized.userAgent, expected_client_name: "augnes-semantic-preflight",
            expected_client_version: CODEX_APP_SERVER_ADAPTER_VERSION_V01, expected_codex_cli_version: candidate.version,
          });
          return { observed_cli_version: userAgent.codex_cli_version, observed_security_policy_fingerprint: observeCandidateConfigPolicyV01(config) };
        },
        state_parent: stateParent, repository_root: executionRoot,
        base_environment: { PATH: emptyPath, LANG: "C", LC_ALL: "C", TZ: "UTC", NO_COLOR: "1" },
      });
      if (readdirSync(stateParent).length !== 0) probe.cleanup_completed = false;
      receipt.attempts.push(probe);
      receipt.cleanup.process_settled = receipt.attempts.every((attempt) => attempt.process_settled);
      receipt.cleanup.streams_closed = receipt.attempts.every((attempt) => attempt.streams_closed);
      persist(); // A crash cannot lose an attempt and silently grant another budget.
      return probe;
    }, compare: async () => {
      // Fetch no source/schema comparison until the cheap runtime gate passes.
      receipt.disposition = "HOLD_INCOMPATIBLE_OR_UNCLEAR_DELTA";
      const baselineCommit = record(await githubJson(`${API}/git/commits/${production.artifact.tagged_source_commit}`));
      if (baselineCommit.sha !== production.artifact.tagged_source_commit || !sha(record(baselineCommit.tree).sha))
        throw new Error("codex_rolling_baseline_source_invalid");
      const baselineTree = record(baselineCommit.tree).sha as string;
      const before = await githubJson(`${API}/git/trees/${baselineTree}?recursive=1`);
      const after = await githubJson(`${API}/git/trees/${candidate.source_tree}?recursive=1`);
      if (record(before).sha !== baselineTree || record(after).sha !== candidate.source_tree)
        throw new Error("codex_rolling_source_tree_identity_mismatch");
      return classifyCodexRollingDeltaV01({ baseline_source_commit: production.artifact.tagged_source_commit,
        candidate_source_commit: candidate.tagged_source_commit, baseline_tree: before, candidate_tree: after });
    } });
    receipt.disposition = gate.disposition;
    receipt.delta = gate.delta;
    if (gate.disposition === "AUTHENTICATED_CANARY_REQUIRED")
      receipt.authenticated_canary = "separate_authorization_required";
  } catch (error) {
    const reason = error instanceof Error ? error.message : "codex_rolling_unavailable";
    receipt.failure_reason = /^codex_[a-z0-9_]+$/u.test(reason) ? reason : "codex_rolling_unavailable";
    if (receipt.disposition !== "HOLD_INCOMPATIBLE_OR_UNCLEAR_DELTA") receipt.disposition = "HOLD_INTERRUPTED_OR_INCOMPLETE";
  } finally {
    if (root) {
      try { rmSync(root, { recursive: true, force: false }); receipt.cleanup.disposable_staging_removed = !existsSync(root); }
      catch { receipt.cleanup.disposable_staging_removed = false; }
    } else receipt.cleanup.disposable_staging_removed = true;
    if (!receipt.cleanup.disposable_staging_removed || !receipt.cleanup.process_settled || !receipt.cleanup.streams_closed) receipt.disposition = "HOLD_CLEANUP";
    const current = selectPinnedCodexQualifiedRuntimeV01({ lane: "ordinary_chatgpt_auth" });
    if (current.artifact.entry_id !== production.artifact.entry_id || current.compatibility_profile.fingerprint !== production.compatibility_profile.fingerprint)
      throw new Error("codex_rolling_production_selection_changed");
    persist();
  }
  return { receipt, receipt_path: receiptPath, reused: false };
}

async function githubJson(url: string): Promise<unknown> {
  return JSON.parse((await boundedFetch(url, 16 * 1024 * 1024, "application/vnd.github+json", 30_000)).toString("utf8"));
}
async function boundedFetch(url: string, maximumBytes: number, accept: string, timeout: number): Promise<Buffer> {
  const response = await fetch(url, { headers: { Accept: accept }, redirect: "follow", signal: AbortSignal.timeout(timeout) });
  if (!response.ok || !response.body) throw new Error("codex_rolling_official_fetch_failed");
  const reader = response.body.getReader();
  const chunks: Buffer[] = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.length;
      if (total > maximumBytes) throw new Error("codex_rolling_official_response_too_large");
      chunks.push(Buffer.from(value));
    }
  } finally { await reader.cancel().catch(() => undefined); reader.releaseLock(); }
  return Buffer.concat(chunks, total);
}
function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("codex_rolling_shape_invalid");
  return value as Record<string, unknown>;
}
function positive(value: unknown): boolean { return typeof value === "number" && Number.isSafeInteger(value) && value > 0; }
function sha(value: unknown): value is string { return typeof value === "string" && SHA.test(value); }
