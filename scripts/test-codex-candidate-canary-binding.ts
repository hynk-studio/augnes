import assert from "node:assert/strict";
import { chmodSync, existsSync, lstatSync, mkdirSync, readFileSync, readdirSync, renameSync, statSync, symlinkSync, unlinkSync, writeFileSync } from "node:fs";
import path from "node:path";
import { genericCliBuilderInputFixture } from "../fixtures/vnext/protocol/task-context-packet-v0-1";
import { buildTaskContextPacketV01 } from "../lib/vnext/task-context-packet";
import { createCodexAppServerAdapterV01 } from "../lib/vnext/native-host/codex-app-server-adapter";
import { CANDIDATE_CONFIG_OVERRIDE_ARGS_V01, observeCandidateConfigPolicyV01 } from "../lib/vnext/native-host/codex-ordinary-runtime-candidate";
import {
  codexRollingFingerprintV01, prepareCodexCandidateCanaryV01, disposeCodexCandidateCanaryV01,
  emulateCodexCandidateCanaryForTestV01, type CodexRollingReceiptV01,
  consumeCodexCandidateCanaryV01, claimCodexCandidateOrdinaryBrokerContextV01,
} from "../lib/vnext/native-host/codex-rolling-stable-candidate";
import { codexCandidateOrdinaryBrokerProfileFingerprintV01, provisionCodexCandidateOrdinaryAuthV01, containsCodexCredentialSecretShapeV01 } from "../lib/vnext/native-host/codex-credential-broker";
import { assertCurrentCodexQualifiedRuntimeSelectionV01, CODEX_QUALIFIED_RUNTIME_REGISTRY_FINGERPRINT_V01, selectPinnedCodexQualifiedRuntimeV01 } from "../lib/vnext/native-host/codex-qualified-runtime-registry";
import type { NativeHostInvocationControlV01, NativeHostRequestV01 } from "../types/vnext/native-host-adapter";

// Called by the existing rolling-candidate Canonical owner with only synthetic
// metadata/archive bytes and a mocked official HTTP route. No live discovery.
export async function testCodexCandidateCanaryBindingV01(root: string, initial: CodexRollingReceiptV01, archive: Buffer): Promise<void> {
  const selected = selectPinnedCodexQualifiedRuntimeV01({ lane: "ordinary_chatgpt_auth" });
  const originalSelection = JSON.stringify(selected);
  const originalTestMode = process.env.AUGNES_CODEX_ORDINARY_CANDIDATE_TEST_MODE;
  const originalCodexHome = process.env.CODEX_HOME;
  const sourceHome = path.join(root, "synthetic-ordinary-home");
  mkdirSync(sourceHome, { mode: 0o700 });
  process.env.CODEX_HOME = sourceHome;
  const sourceAuth = path.join(sourceHome, "auth.json");
  const syntheticAuth = syntheticOrdinaryAuth();
  const resetAuth = () => writeFileSync(sourceAuth, JSON.stringify(syntheticAuth, null, 2), { mode: 0o600 });
  resetAuth();
  writeFileSync(path.join(sourceHome, "config.toml"), "# synthetic private config\n", { mode: 0o600 });
  for (const name of ["sessions", "archived_sessions", "rules", "skills", "plugins", "apps", "memories"]) {
    mkdirSync(path.join(sourceHome, name), { mode: 0o700 });
    // Metadata cardinality, not timing, models a non-empty historical home.
    for (let i = 0; i < (name === "sessions" ? 250 : 1); i++)
      writeFileSync(path.join(sourceHome, name, `synthetic-${i}`), "synthetic private state\n");
  }
  process.env.AUGNES_CODEX_ORDINARY_CANDIDATE_TEST_MODE = "1";
  const receipt = structuredClone(initial);
  receipt.registry_fingerprint = CODEX_QUALIFIED_RUNTIME_REGISTRY_FINGERPRINT_V01;
  receipt.attempts = [{ ...receipt.attempts[0]!, state: "compatible_exact", observed_cli_version: receipt.candidate.version,
    cli_reported_version: receipt.candidate.version, observed_policy_fingerprint: policyFingerprint(),
    runtime_exercised_methods: ["initialize", "initialized", "account/read", "config/read"], private_environment_observed: true,
    account_disposition: "unauthenticated_empty_state", executable_fingerprint: receipt.native!.native_executable_sha256 }];
  receipt.disposition = "HOLD_INCOMPATIBLE_OR_UNCLEAR_DELTA";
  receipt.delta = { classification: "incompatible_or_unclear", baseline_source_commit: selected.artifact.tagged_source_commit,
    candidate_source_commit: receipt.candidate.tagged_source_commit, baseline_tree: "4".repeat(40),
    candidate_tree: receipt.candidate.source_tree, changed_paths: ["codex-rs/app-server-protocol/schema/json/v2/ThreadStartResponse.json"], reason: "synthetic_review" };
  const { receipt_fingerprint: ignored, ...material } = receipt;
  void ignored;
  receipt.receipt_fingerprint = codexRollingFingerprintV01(material);
  const review = { decision: "COMPATIBLE_PROFILE_REUSE_SUPPORTED" as const, receipt_fingerprint: receipt.receipt_fingerprint,
    compatibility_profile_fingerprint: receipt.compatibility_profile_fingerprint, config_policy_fingerprint: policyFingerprint(),
    credential_profile_fingerprint: codexCandidateOrdinaryBrokerProfileFingerprintV01() };
  let index = 0;
  const prepare = async () => {
    const directory = path.join(root, `canary-${index++}`); mkdirSync(directory, { mode: 0o700 });
    const receiptPath = path.join(directory, `${receipt.candidate.release_tag}-darwin-arm64.json`);
    writeFileSync(receiptPath, JSON.stringify(receipt), { mode: 0o600 });
    return { binding: await prepareCodexCandidateCanaryV01({ receipt_path: receiptPath, review, archive_bytes: archive }), receiptPath };
  };
  try {
    const invalidPath = path.join(root, `${receipt.candidate.release_tag}-darwin-arm64.json`);
    writeFileSync(invalidPath, JSON.stringify(receipt), { mode: 0o600 });
    await assert.rejects(prepareCodexCandidateCanaryV01({ receipt_path: invalidPath, review: { ...review, receipt_fingerprint: "wrong" }, archive_bytes: archive }));
    await assert.rejects(prepareCodexCandidateCanaryV01({ receipt_path: invalidPath, review: { ...review, credential_profile_fingerprint: "wrong" }, archive_bytes: archive }));
    await assert.rejects(prepareCodexCandidateCanaryV01({ receipt_path: invalidPath, review: { ...review, config_policy_fingerprint: "wrong" }, archive_bytes: archive }));
    await assert.rejects(prepareCodexCandidateCanaryV01({ receipt_path: invalidPath, review, archive_bytes: Buffer.from("wrong archive") }));
    const forged = Object.freeze({ kind: "ordinary_candidate_canary.v0.1" as const, execution_root: root, receipt_fingerprint: receipt.receipt_fingerprint });
    assert.throws(() => provisionCodexCandidateOrdinaryAuthV01(forged), /broker_admission_refused/);
    const forgedInvocation = createCodexAppServerAdapterV01({ candidate_canary: forged }).invoke(request(root), control());
    assert.notEqual((await forgedInvocation.result).outcome, "completed");
    await forgedInvocation.settled;

    const mismatch = await prepare();
    const native = path.join(path.dirname(mismatch.binding.execution_root), "artifact", receipt.native!.archive_member_name);
    chmodSync(native, 0o700); writeFileSync(native, "changed exact bytes");
    const mismatchInvocation = createCodexAppServerAdapterV01({ candidate_canary: mismatch.binding }).invoke(request(mismatch.binding.execution_root), control());
    assert.notEqual((await mismatchInvocation.result).outcome, "completed");
    await mismatchInvocation.settled;
    assert.equal(existsSync(mismatch.binding.execution_root), false);

    const unused = await prepare();
    assert.throws(() => provisionCodexCandidateOrdinaryAuthV01(unused.binding), /broker_admission_refused/);
    assert.throws(() => assertCurrentCodexQualifiedRuntimeSelectionV01(unused.binding as never));
    assert.throws(() => createCodexAppServerAdapterV01({ candidate_canary: unused.binding, launch: { command: process.execPath } }), /parallel_authority/);
    assert.throws(() => createCodexAppServerAdapterV01({ candidate_canary: unused.binding, isolated_authenticated_execution: {} as never }), /parallel_authority/);
    assert.throws(() => createCodexAppServerAdapterV01({ candidate_canary: unused.binding }).invoke(request(unused.binding.execution_root), { ...control(), resume_binding: {} as never }), /resume_refused/);
    const widened = request(unused.binding.execution_root); widened.policy.max_commands = 1;
    assert.throws(() => createCodexAppServerAdapterV01({ candidate_canary: unused.binding }).invoke(widened, control()), /scope_refused/);
    disposeCodexCandidateCanaryV01(unused.binding);
    assert.equal(existsSync(unused.binding.execution_root), false);

    // Every credential-bearing fixture uses this synthetic source. Malformed,
    // API-key-only and Agent-Identity-only stores fail before any app-server.
    for (const material of [
      { auth_mode: "apikey", OPENAI_API_KEY: "sk-synthetic-secret-must-not-escape" },
      { auth_mode: "agentIdentity", agent_identity: "synthetic-agent-only" },
      { agent_identity: "synthetic-agent-only" },
      { ...syntheticAuth, tokens: null },
      { ...syntheticAuth, tokens: { ...syntheticAuth.tokens, id_token: "malformed" } },
      { ...syntheticAuth, tokens: { ...syntheticAuth.tokens, refresh_token: "" } },
      { ...syntheticAuth, tokens: { ...syntheticAuth.tokens, access_token: "" } },
      { ...syntheticAuth, tokens: { ...syntheticAuth.tokens, account_id: {} } },
      { ...syntheticAuth, last_refresh: "1" },
      { ...syntheticAuth, tokens: { ...syntheticAuth.tokens, account_id: null, id_token: jwt({}) } },
      { ...syntheticAuth, OPENAI_API_KEY: "sk-synthetic-conflicting-authority" },
      "invalid-json",
    ]) {
      writeFileSync(sourceAuth, typeof material === "string" ? material : JSON.stringify(material));
      const { binding, receiptPath } = await prepare();
      emulateCodexCandidateCanaryForTestV01(binding, "success");
      assert.throws(() => consumeCodexCandidateCanaryV01(binding), /^CodexCredentialBrokerErrorV01: codex_candidate_ordinary_auth_projection_refused$/);
      assert.equal(existsSync(binding.execution_root), false);
      assert.equal(existsSync(`${receiptPath}.ordinary-canary-claimed`), true);
    }
    resetAuth();
    const originalAuth = path.join(sourceHome, "synthetic-original-auth");
    renameSync(sourceAuth, originalAuth); symlinkSync(originalAuth, sourceAuth);
    const symlinked = await prepare(); emulateCodexCandidateCanaryForTestV01(symlinked.binding, "success");
    assert.throws(() => consumeCodexCandidateCanaryV01(symlinked.binding), /projection_refused/);
    assert.equal(existsSync(symlinked.binding.execution_root), false);
    unlinkSync(sourceAuth); renameSync(originalAuth, sourceAuth);
    chmodSync(sourceAuth, 0o644);
    const permissive = await prepare(); emulateCodexCandidateCanaryForTestV01(permissive.binding, "success");
    assert.throws(() => consumeCodexCandidateCanaryV01(permissive.binding), /projection_refused/);
    assert.equal(existsSync(permissive.binding.execution_root), false);
    chmodSync(sourceAuth, 0o600);
    const profileDrift = await prepare(); emulateCodexCandidateCanaryForTestV01(profileDrift.binding, "success");
    const args = CANDIDATE_CONFIG_OVERRIDE_ARGS_V01 as unknown as string[];
    const identityIndex = args.indexOf("features.use_agent_identity=false");
    try {
      args[identityIndex] = "features.use_agent_identity=true";
      assert.throws(() => consumeCodexCandidateCanaryV01(profileDrift.binding), /credential_profile_changed/);
    } finally { args[identityIndex] = "features.use_agent_identity=false"; }
    assert.equal(existsSync(profileDrift.binding.execution_root), false);
    const beforeSource = metadata(sourceAuth);
    const beforeConfig = metadata(path.join(sourceHome, "config.toml"));
    const projected = await prepare(); emulateCodexCandidateCanaryForTestV01(projected.binding, "success");
    const launch = consumeCodexCandidateCanaryV01(projected.binding);
    const privateRoot = path.dirname(projected.binding.execution_root);
    for (const key of ["HOME", "CODEX_HOME", "CODEX_SQLITE_HOME", "TMPDIR"]) {
      assert.equal(path.dirname(launch.environment[key]!), privateRoot);
      assert.notEqual(launch.environment[key], sourceHome);
    }
    const snapshotPath = path.join(launch.environment.CODEX_HOME!, "auth.json");
    assert.deepEqual(readdirSync(launch.environment.CODEX_HOME!), ["auth.json"]);
    assert.equal(lstatSync(snapshotPath).isSymbolicLink(), false);
    assert.equal(lstatSync(snapshotPath).mode & 0o777, 0o600);
    assert.notEqual(lstatSync(snapshotPath).ino, lstatSync(sourceAuth).ino);
    const stored = JSON.parse(readFileSync(snapshotPath, "utf8"));
    assert.deepEqual(stored, { auth_mode: "chatgpt", OPENAI_API_KEY: null, tokens: syntheticAuth.tokens, last_refresh: syntheticAuth.last_refresh });
    assert.notEqual(readFileSync(snapshotPath, "utf8"), readFileSync(sourceAuth, "utf8"), "not a wholesale auth-file copy");
    assert.equal(launch.args.includes("features.use_agent_identity=false"), true);
    assert.equal(launch.args.includes("features.use_agent_identity=true"), false);
    assert.deepEqual(launch.args.slice(1), [...CANDIDATE_CONFIG_OVERRIDE_ARGS_V01, "app-server", "--stdio"]);
    assert.throws(() => claimCodexCandidateOrdinaryBrokerContextV01(projected.binding), /broker_admission_refused/);
    assert.throws(() => consumeCodexCandidateCanaryV01(projected.binding), /consumed/);
    assert.equal(containsCodexCredentialSecretShapeV01(JSON.stringify(launch)), false);
    assert.equal(JSON.stringify(launch).includes(sourceHome), false);
    // AuthManager may replace/refresh its private file; no writeback or inode
    // retention requirement prevents removal of refreshed private credentials.
    unlinkSync(snapshotPath); writeFileSync(snapshotPath, '{"synthetic_refreshed":true}', { mode: 0o600 });
    launch.cleanup();
    assert.equal(existsSync(privateRoot), false);
    assert.equal(metadata(sourceAuth), beforeSource);
    assert.equal(metadata(path.join(sourceHome, "config.toml")), beforeConfig);
    const drift = await prepare(); emulateCodexCandidateCanaryForTestV01(drift.binding, "success");
    const driftLaunch = consumeCodexCandidateCanaryV01(drift.binding);
    resetAuth(); // synthetic concurrent source change must not retain private auth
    assert.throws(() => driftLaunch.cleanup(), /source_integrity_failed/);
    assert.equal(existsSync(drift.binding.execution_root), false);
    const configDrift = await prepare(); emulateCodexCandidateCanaryForTestV01(configDrift.binding, "success");
    const configLaunch = consumeCodexCandidateCanaryV01(configDrift.binding);
    writeFileSync(path.join(sourceHome, "config.toml"), "# synthetic concurrent config change\n");
    assert.throws(() => configLaunch.cleanup(), /source_integrity_failed/);
    assert.equal(existsSync(configDrift.binding.execution_root), false);
    // Legacy ordinary files omit auth_mode. An unrelated Agent Identity field
    // is never projected, and cannot replace ordinary TokenData.
    const { auth_mode: ignoredMode, ...legacy } = syntheticAuth; void ignoredMode;
    writeFileSync(sourceAuth, JSON.stringify({ ...legacy, agent_identity: "synthetic-unused-agent-material" }));
    const legacyBinding = await prepare(); emulateCodexCandidateCanaryForTestV01(legacyBinding.binding, "success");
    const legacyLaunch = consumeCodexCandidateCanaryV01(legacyBinding.binding);
    assert.equal(JSON.parse(readFileSync(path.join(legacyLaunch.environment.CODEX_HOME!, "auth.json"), "utf8")).agent_identity, undefined);
    legacyLaunch.cleanup(); resetAuth();

    for (const scenario of ["success", "config_mismatch", "user_agent_mismatch", "server_request", "effect", "descendant_cleanup", "prethread_request", "provider_mismatch", "sqlite_mismatch"] as const) {
      const { binding, receiptPath } = await prepare();
      emulateCodexCandidateCanaryForTestV01(binding, scenario);
      const observations: string[] = [];
      const adapter = createCodexAppServerAdapterV01({ candidate_canary: binding, observe: (o) => observations.push(o.kind) });
      assert.equal(adapter.resume_capability?.resumable_after_detach, false);
      const invocation = adapter.invoke(request(binding.execution_root), control());
      const result = await invocation.result.catch(() => null);
      await invocation.settled;
      assert.equal(result?.outcome === "completed", ["success", "descendant_cleanup"].includes(scenario), scenario);
      assert.equal(observations.includes("settled"), true);
      assert.equal(existsSync(path.dirname(binding.execution_root)), false);
      const claim = `${receiptPath}.ordinary-canary-claimed`;
      const trace = readFileSync(`${claim}.synthetic-trace`, "utf8").trim().split("\n").map((line) => JSON.parse(line));
      const received = trace.filter((r) => r.kind === "received").map((r) => r.value.method);
      const privateObservation = trace.find((r) => r.kind === "candidate_private_auth");
      assert.ok(privateObservation && Object.values(privateObservation.value).every((value) => value === true));
      assert.equal(containsCodexCredentialSecretShapeV01(JSON.stringify({ result, trace, observations })), false);
      assert.equal(received.includes("getAuthStatus"), false, "no Strict Agent Identity preflight");
      assert.equal(received.includes("thread/resume"), false);
      if (["config_mismatch", "user_agent_mismatch", "prethread_request", "provider_mismatch", "sqlite_mismatch"].includes(scenario)) {
        assert.equal(received.includes("thread/start"), false, scenario);
        assert.equal(received.includes("turn/start"), false, scenario);
      } else {
        assert.deepEqual(received.slice(0, 6), ["initialize", "initialized", "account/read", "config/read", "thread/start", "turn/start"]);
        assert.equal(received.filter((m) => m === "turn/start").length, 1);
      }
      if (scenario === "success") {
        assert.equal(result?.summary, "AUGNES_CANARY_OK");
        const evidence = result!.adapter_extension!.bounded_metadata;
        assert.equal(evidence.candidate_evidence_only, true);
        assert.equal(evidence.runtime_qualified, false);
        assert.equal(evidence.production_selected, false);
        assert.equal(evidence.synthetic_fixture, true);
        assert.equal(evidence.compatibility_profile_fingerprint, selected.compatibility_profile.fingerprint);
        assert.equal(evidence.packet_delivery_initiated, false);
        assert.equal(result!.checks.some((check) => check.check_id === "validated_packet_delivery"), false);
      }
      if (scenario === "server_request") assert.ok(trace.some((r) => r.kind === "received" && r.value.has_error));
      assert.equal(readFileSync(`${claim}.synthetic-network`, "utf8"), "0\n");
      assert.equal(readFileSync(`${claim}.synthetic-cleanup`, "utf8"), "settled\n");
      for (const row of trace.filter((r) => r.kind === "descendant_started"))
        assert.throws(() => process.kill(row.value.pid, 0), /ESRCH/);
      assert.equal(JSON.stringify(selectPinnedCodexQualifiedRuntimeV01()), originalSelection);
      // A second adapter cannot reuse the token, or a new token renew the persisted receipt claim.
      const replay = adapter.invoke(request(root, binding.execution_root), control());
      assert.notEqual((await replay.result).outcome, "completed"); await replay.settled;
      const reminted = await prepareCodexCandidateCanaryV01({ receipt_path: receiptPath, review, archive_bytes: archive });
      emulateCodexCandidateCanaryForTestV01(reminted, "success");
      const retry = createCodexAppServerAdapterV01({ candidate_canary: reminted }).invoke(request(reminted.execution_root), control());
      assert.notEqual((await retry.result).outcome, "completed"); await retry.settled;
      assert.equal(existsSync(reminted.execution_root), false);
    }
    // Normal launch admission is still production-qualified, never candidate.
    const fakeQualified = structuredClone(selected);
    fakeQualified.artifact.version = receipt.candidate.version;
    const ordinary = createCodexAppServerAdapterV01({ launch: { command: process.execPath, qualified_runtime_selection: fakeQualified } });
    const refused = ordinary.invoke(request(root), control());
    assert.notEqual((await refused.result).outcome, "completed"); await refused.settled;
    assert.equal(JSON.stringify(selectPinnedCodexQualifiedRuntimeV01()), originalSelection);
  } finally {
    if (originalCodexHome === undefined) delete process.env.CODEX_HOME;
    else process.env.CODEX_HOME = originalCodexHome;
    if (originalTestMode === undefined) delete process.env.AUGNES_CODEX_ORDINARY_CANDIDATE_TEST_MODE;
    else process.env.AUGNES_CODEX_ORDINARY_CANDIDATE_TEST_MODE = originalTestMode;
  }
}

function jwt(payload: unknown): string {
  return `${Buffer.from('{"alg":"RS256","typ":"JWT"}').toString("base64url")}.${Buffer.from(JSON.stringify(payload)).toString("base64url")}.${Buffer.from("synthetic-signature-not-a-credential").toString("base64url")}`;
}
function syntheticOrdinaryAuth() {
  return { auth_mode: "chatgpt", OPENAI_API_KEY: null,
    tokens: { id_token: jwt({ "https://api.openai.com/auth": { chatgpt_account_id: "synthetic-account", chatgpt_user_id: "synthetic-user" } }),
      access_token: jwt({ sub: "synthetic-user" }), refresh_token: "synthetic-refresh-not-a-real-credential", account_id: "synthetic-account" },
    last_refresh: "2026-09-05T00:00:00Z", unused_private_source_field: "must-not-be-copied" };
}
function metadata(file: string): string {
  const s = lstatSync(file, { bigint: true });
  return [s.dev, s.ino, s.mode, s.size, s.mtimeNs, s.ctimeNs].join(":");
}

function policyFingerprint(): string {
  const config: Record<string, any> = { features: { background_paginated_rollout_migration: false, remote_control: false } };
  for (let i = 0; i < CANDIDATE_CONFIG_OVERRIDE_ARGS_V01.length; i++) {
    if (CANDIDATE_CONFIG_OVERRIDE_ARGS_V01[i] !== "-c") continue;
    const entry = CANDIDATE_CONFIG_OVERRIDE_ARGS_V01[++i]!;
    const separator = entry.indexOf("=");
    const keys = entry.slice(0, separator).split(".");
    let owner = config;
    for (const key of keys.slice(0, -1)) owner = owner[key] ??= {};
    owner[keys.at(-1)!] = JSON.parse(entry.slice(separator + 1));
  }
  return observeCandidateConfigPolicyV01({ config });
}
function control(): NativeHostInvocationControlV01 {
  return { cancellation_signal: new AbortController().signal, timeout_ms: 10_000, stop_settle_timeout_ms: 3_000, resume_binding: null,
    lifecycle_sink: { async report_event() {}, async request_approval() { assert.fail("candidate approval authority escaped"); } } };
}
function request(physicalRoot: string, executionRoot = physicalRoot): NativeHostRequestV01 {
  const packet = buildTaskContextPacketV01(structuredClone(genericCliBuilderInputFixture));
  const stat = statSync(physicalRoot);
  const fingerprint = codexRollingFingerprintV01(executionRoot);
  const ref = (ref_type: string) => ({ ref_version: "external_ref.v0.1" as const, ref_type, external_id: `synthetic:${ref_type}`,
    observed_at: "2026-09-05T00:00:00Z", trust_class: "direct_local_observation" as const });
  return {
    request_version: "native_host_request.v0.1", request_id: "synthetic:canary", run_id: "synthetic:canary", idempotency_key: fingerprint,
    workspace_id: packet.workspace_id, project_id: packet.project_id, work_ref: ref("work"), task_ref: ref("task"),
    task_context_packet_ref: ref("task_context_packet"), packet,
    packet_lineage: { source_transition_receipt_ref: ref("state_transition_receipt"), packet_source_refs: [], selected_context_refs: [] },
    mode: "interactive", root_scope: { canonical_root: executionRoot, path_flavor: "posix", root_kind: "plain_folder", root_fingerprint: fingerprint,
      physical_root_identity: { identity_version: "native_host_physical_root_identity.v0.1", canonical_realpath_fingerprint: fingerprint,
        device: String(stat.dev), inode: String(stat.ino) }, root_scope_ref: ref("project_root_scope"), repository_ref: null, selected_worktree_ref: null },
    requested_capability: "project_scoped_structured_task_round_trip.v0.1", allowed_operation_categories: ["return_bounded_structured_result"],
    forbidden_operation_categories: ["external_state_mutation"], packet_capability_grant: null, execution_grant_ref: null, automation_context: null,
    policy: { filesystem: "selected_project_root_only", network: "forbidden", commands: "approval_required", model: "native_host_managed",
      host_egress: "explicit_interactive_start", max_changed_files: 0, max_artifacts: 0, max_commands: 0, max_checks: 4,
      timeout_ms: 10_000, stop_settle_timeout_ms: 3_000, stop_conditions: ["timeout"] },
    result_return: { return_version: "native_host_result_return.v0.1", structured_result_required: true, legacy_result_text_allowed: false,
      raw_output_allowed: false, max_result_bytes: 16 * 1024 },
  };
}
