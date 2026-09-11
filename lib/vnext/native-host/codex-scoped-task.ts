import { AUTHORED_SUCCESSOR_TASK_V01, assertAuthoredSuccessorInventoryV01 } from "@/lib/vnext/authored-successor-task";
import { createHash } from "node:crypto";
import { chmodSync, closeSync, constants, existsSync, fstatSync, lstatSync, mkdtempSync, openSync, readSync, readdirSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { parse } from "smol-toml";

import { canonicalizeProtocolValueV01, createProtocolSha256V01 } from "@/lib/vnext/protocol-primitives";
import { inspectNativeHostPhysicalRootIdentityV01 } from "@/lib/vnext/native-host/project-root-identity";
import { selectPinnedCodexQualifiedRuntimeV01 } from "./codex-qualified-runtime-registry";
import { CODEX_SCOPED_CODE_MODE_PROFILE_FINGERPRINT_V01 } from "./codex-managed-runtime-store";
import type { NativeHostPhysicalRootIdentityV01, NativeHostRequestV01, NativeHostRootScopeV01 } from "@/types/vnext/native-host-adapter";
import type { NativeHostTimeoutSchedulerV01 } from "@/lib/vnext/runtime/direct-native-host-round-trip";
import type Database from "better-sqlite3";
import type { TaskContextPacketV01 } from "@/types/vnext/task-context-packet";
import { preparePersistedCodexContinuationV01, type PersistedCodexContinuationInputV01 } from "@/lib/vnext/runtime/persisted-codex-continuation";

// An application-local restriction. It is never serialized as an authority
// grant, accepted from an HTTP body, or used by the default desktop route.
export interface CodexScopedTaskV01 {
  readonly fingerprint: string;
  readonly stage: 1 | 2;
}
interface StageMaterial {
  stage: 1 | 2;
  root: string;
  physical: NativeHostPhysicalRootIdentityV01;
  packet_id: string;
  packet_fingerprint: string;
  guide_brief_fingerprint: string;
  files: readonly Readonly<{ relative_path: string; sha256: string }>[];
  historical_files?: readonly Readonly<{ relative_path: string; sha256: string }>[];
  approved_instruction_files: readonly Readonly<{ path: string; sha256: string }>[];
  snapshot: CodexScopedSnapshotV01;
}
/** Application-local input representation, not a registered project root or
 * Core grant. The trusted controller owns it; the worker has read access only.
 * Independent hostile host writers and OS-enforced immutability are excluded. */
export interface CodexScopedSnapshotV01 {
  readonly profile: "trusted_local_read_snapshot.v0.1";
  readonly root: string;
  readonly physical: NativeHostPhysicalRootIdentityV01;
  readonly files: readonly Readonly<{ relative_path: string; sha256: string }>[];
  readonly prepared_at: string;
  readonly fingerprint: string;
}
const scopes = new WeakMap<CodexScopedTaskV01, Readonly<StageMaterial>>();
const consumed = new WeakSet<CodexScopedTaskV01>();
const unsettled = new WeakSet<CodexScopedTaskV01>();
const requestBindings = new WeakMap<CodexScopedTaskV01, Readonly<{ request_fingerprint: string; fingerprint: string }>>();
export const SCOPED_CODEX_MODEL_V01 = "gpt-6-astra";
export const SCOPED_CODEX_EFFORT_V01 = "max";
export const SCOPED_CODEX_CONTRACT_V01 = "codex_synthetic_read_snapshot_scope.v0.2";

/** Extension compatibility, not ordinary qualification or execution authority.
 * The ordinary adapter still requires the separate qualified managed selector;
 * credential-free candidate checks may exercise these exact artifact tuples. */
export interface CodexScopedRuntimeArtifactV01 {
  version: string;
  native_executable_sha256: string;
  tagged_source_commit: string;
  compatibility_profile_fingerprint: string;
}
export function assertCodexScopedRuntimeArtifactV01(artifact: CodexScopedRuntimeArtifactV01): void {
  const tuples = [
    ["0.152.1", "sha256:8194ea3181f330e63023b234b0b231855e5874e0331c5ef7cbc490591497a7bf", "5adb68a49933ae446bf11935662c83dba55a0804"],
    ["0.153.4", "sha256:b973d440acac501fd2594a43e7ca9ce41e0a65b9dfb28d0d7a7837c99e1261e3", "3d2ee51ca2d5db578f328aa75e20aa22c0197c9a"],
  ];
  if (artifact.compatibility_profile_fingerprint !== "sha256:a4cfb0e38fd6a2af0d29a467c2c5db2579cdc784e93a820f3482fa2c8a1d663a" ||
      !tuples.some(([version, hash, source]) => artifact.version === version &&
        artifact.native_executable_sha256 === hash && artifact.tagged_source_commit === source))
    refuse("runtime_extension_unqualified");
}

export class CodexScopedTaskErrorV01 extends Error {
  constructor(readonly code: string) { super(code); this.name = "CodexScopedTaskErrorV01"; }
}
function refuse(code: string): never { throw new CodexScopedTaskErrorV01(`codex_scoped_${code}`); }
function digest(bytes: Uint8Array): string { return createHash("sha256").update(bytes).digest("hex"); }
function equal(a: unknown, b: unknown): boolean { return canonicalizeProtocolValueV01(a) === canonicalizeProtocolValueV01(b); }
function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) refuse("object_invalid");
  return value as Record<string, unknown>;
}
function optionalRecord(value: unknown): Record<string, unknown> { return value == null ? {} : record(value); }
function freeze<T>(value: T): T {
  if (value && typeof value === "object") {
    Object.values(value).forEach(freeze); Object.freeze(value);
  }
  return value;
}
function material(scope: CodexScopedTaskV01): Readonly<StageMaterial> {
  const result = scopes.get(scope); if (!result) refuse("scope_not_source_owned"); return result;
}
function fileBytes(filename: string, limit = 128 * 1024): Buffer {
  let fd: number | undefined;
  try {
    // Reject the opened object without waiting for a writer if a FIFO is
    // supplied or replaces an approved path before this open.
    fd = openSync(filename, constants.O_RDONLY | constants.O_NOFOLLOW | constants.O_NONBLOCK);
    const stat = fstatSync(fd);
    if (!stat.isFile() || stat.isSymbolicLink() || stat.nlink !== 1 || stat.size > limit || realpathSync(filename) !== filename)
      refuse("file_identity_invalid");
    const buffer = Buffer.alloc(limit + 1); let length = 0;
    while (length < buffer.length) {
      const count = readSync(fd, buffer, length, buffer.length - length, null);
      if (!count) break;
      length += count;
    }
    if (length > limit) refuse("file_bound_exceeded");
    const bytes = buffer.subarray(0, length);
    const after = fstatSync(fd), named = lstatSync(filename);
    if (bytes.length !== stat.size || stat.dev !== named.dev || stat.ino !== named.ino || named.isSymbolicLink() ||
        stat.size !== after.size || stat.mtimeMs !== after.mtimeMs || stat.ctimeMs !== after.ctimeMs) refuse("file_changed");
    return bytes;
  } catch { return refuse("file_unavailable_or_changed"); }
  finally { if (fd !== undefined) closeSync(fd); }
}

/** The trusted disposable operator supplies reviewed hashes, not worker flags. */
export interface CodexScopedTaskInputV01 {
  stage: 1 | 2;
  canonical_root: string;
  packet_id: string;
  packet_fingerprint: string;
  guide_brief_fingerprint: string;
  files: readonly Readonly<{ relative_path: string; sha256: string }>[];
  /** Authored successor only: retained source material excluded from execution. */
  historical_files?: readonly Readonly<{ relative_path: string; sha256: string }>[];
  approved_instruction_files?: readonly Readonly<{ path: string; sha256: string }>[];
}

/** Read-only input inspection; returns no scope, snapshot or execution grant. */
export async function inspectCodexScopedTaskSourceV01(input: CodexScopedTaskInputV01) {
  if (![1, 2].includes(input.stage) || !input.packet_id || !/^sha256:[a-f0-9]{64}$/u.test(input.packet_fingerprint) ||
    !/^sha256:[a-f0-9]{64}$/u.test(input.guide_brief_fingerprint) ||
    input.files.length < 1 || input.files.length > 8) refuse("stage_invalid");
  const source = {
    stage: input.stage, root: input.canonical_root,
    physical: await inspectNativeHostPhysicalRootIdentityV01(input.canonical_root),
    packet_id: input.packet_id, packet_fingerprint: input.packet_fingerprint,
    guide_brief_fingerprint: input.guide_brief_fingerprint,
    files: structuredClone(input.files),
    ...(input.historical_files ? { historical_files: structuredClone(input.historical_files) } : {}),
    approved_instruction_files: structuredClone(input.approved_instruction_files ?? []),
  };
  // Flat, exact files are sufficient for this case and exclude config/skill
  // directories and symlink traversal. No parent-directory read grant is made.
  const sourceFiles = [...source.files, ...(source.historical_files ?? [])];
  if (sourceFiles.length > 8 || sourceFiles.some(f => !/^[A-Za-z0-9][A-Za-z0-9_-]*\.(?:json|md|txt)$/u.test(f.relative_path) ||
    /^(?:AGENTS|CLAUDE)\./iu.test(f.relative_path) || !/^[a-f0-9]{64}$/u.test(f.sha256)) ||
    new Set(sourceFiles.map(f => f.relative_path)).size !== sourceFiles.length ||
    source.approved_instruction_files.length > 4 || source.approved_instruction_files.some(f =>
      !path.isAbsolute(f.path) || !/^[a-f0-9]{64}$/u.test(f.sha256))) refuse("files_invalid");
  assertInventory(source.root, sourceFiles);
  for (const f of source.approved_instruction_files) if (digest(fileBytes(f.path)) !== f.sha256) refuse("instruction_hash_changed");
  return source;
}

export async function createCodexScopedTaskV01(input: CodexScopedTaskInputV01): Promise<CodexScopedTaskV01> {
  const source = await inspectCodexScopedTaskSourceV01(input);
  const root = realpathSync(mkdtempSync(path.join(os.tmpdir(), "augnes-scoped-input-")));
  let scope: CodexScopedTaskV01 | undefined;
  try {
    chmodSync(root, 0o700);
    for (const file of source.files) {
      const bytes = fileBytes(path.join(source.root, file.relative_path));
      if (digest(bytes) !== file.sha256) refuse("stage_hash_changed");
      // Independent regular files, exclusive writes, and all descriptors closed
      // before admission. chmod is hygiene; native permissions constrain workers.
      writeFileSync(path.join(root, file.relative_path), bytes, { flag: "wx", mode: 0o400 });
    }
    chmodSync(root, 0o500);
    assertInventory(root, source.files);
    const snapshotMaterial = { profile: "trusted_local_read_snapshot.v0.1" as const, root,
      physical: await inspectNativeHostPhysicalRootIdentityV01(root), files: source.files, prepared_at: new Date().toISOString() };
    const value: StageMaterial = { ...source, snapshot: { ...snapshotMaterial,
      fingerprint: createProtocolSha256V01(canonicalizeProtocolValueV01(snapshotMaterial)) } };
    scope = freeze({ fingerprint: createProtocolSha256V01(canonicalizeProtocolValueV01(value)), stage: input.stage });
    scopes.set(scope, freeze(value));
    await assertCodexScopedTaskCurrentV01(scope);
    return scope;
  } catch (error) {
    if (scope) scopes.delete(scope);
    chmodSync(root, 0o700); rmSync(root, { recursive: true });
    throw error;
  }
}

function assertInventory(root: string, files: StageMaterial["files"]): void {
  if (!equal(readdirSync(root).sort(), files.map(f => f.relative_path).sort())) refuse("stage_inventory_changed");
  for (const f of files) if (digest(fileBytes(path.join(root, f.relative_path))) !== f.sha256) refuse("stage_hash_changed");
}

export function readCodexScopedSnapshotV01(scope: CodexScopedTaskV01): Readonly<CodexScopedSnapshotV01> {
  return material(scope).snapshot;
}
export async function assertCodexScopedSnapshotCurrentV01(scope: CodexScopedTaskV01): Promise<void> {
  const s = material(scope).snapshot;
  if (!equal(await inspectNativeHostPhysicalRootIdentityV01(s.root), s.physical)) refuse("snapshot_root_changed");
  try { assertInventory(s.root, s.files); } catch { refuse("snapshot_content_changed"); }
}
/** Called only after all consumers settle (or before any invocation). Never
 * traverse a replacement root. A refusal retains the evidence for reconciliation. */
export async function releaseCodexScopedTaskV01(scope: CodexScopedTaskV01): Promise<void> {
  const m = scopes.get(scope); if (!m) return;
  if (unsettled.has(scope)) refuse("snapshot_consumers_unsettled");
  if (!equal(await inspectNativeHostPhysicalRootIdentityV01(m.snapshot.root), m.snapshot.physical)) refuse("snapshot_cleanup_root_changed");
  chmodSync(m.snapshot.root, 0o700);
  rmSync(m.snapshot.root, { recursive: true });
  scopes.delete(scope); requestBindings.delete(scope);
}
/** Invoked by the adapter only after transport and every owned child settle. */
export function settleCodexScopedTaskV01(scope: CodexScopedTaskV01): void { unsettled.delete(scope); }

/** Local request construction extension. Source root/reference, packet, cutoff
 * and expiry remain in the unchanged admitted request; only execution uses the
 * separately observed snapshot. No HTTP/worker-supplied mapping is accepted. */
export async function bindCodexScopedRequestV01(scope: CodexScopedTaskV01, request: NativeHostRequestV01): Promise<void> {
  await assertCodexScopedTaskCurrentV01(scope, request);
  const request_fingerprint = createProtocolSha256V01(canonicalizeProtocolValueV01(request));
  const prior = requestBindings.get(scope);
  if (prior && prior.request_fingerprint !== request_fingerprint) refuse("snapshot_request_changed");
  requestBindings.set(scope, freeze({ request_fingerprint, fingerprint: createProtocolSha256V01(canonicalizeProtocolValueV01({
    profile: material(scope).snapshot.profile, scope: scope.fingerprint, request_fingerprint,
    source_root_ref: request.root_scope.root_scope_ref, snapshot: material(scope).snapshot.fingerprint,
  })) }));
}
/** Read-only handoff admission, before the executor records a new run claim. */
export async function assertCodexAuthoredSuccessorScopeV01(scope: CodexScopedTaskV01, packet: TaskContextPacketV01, root: NativeHostRootScopeV01): Promise<void> {
  await assertCodexScopedTaskCurrentV01(scope);
  const m = material(scope);
  if (m.packet_id !== packet.packet_id || m.packet_fingerprint !== packet.integrity.fingerprint ||
    m.root !== root.canonical_root || !equal(m.physical, root.physical_root_identity)) refuse("request_binding_mismatch");
  assertAuthoredSuccessorInventoryV01(packet, { files: m.files, historical_files: m.historical_files ?? [],
    approved_instruction_hashes: m.approved_instruction_files.map(f => f.sha256) });
}
export function readCodexScopedRequestBindingV01(scope: CodexScopedTaskV01, request: NativeHostRequestV01): string {
  const binding = requestBindings.get(scope);
  if (!binding || binding.request_fingerprint !== createProtocolSha256V01(canonicalizeProtocolValueV01(request))) refuse("snapshot_request_binding_missing");
  return binding.fingerprint;
}

export async function assertCodexScopedTaskCurrentV01(scope: CodexScopedTaskV01, request?: NativeHostRequestV01): Promise<void> {
  await assertCodexScopedSnapshotCurrentV01(scope);
  await assertCodexScopedSourceCurrentV01(scope, request);
}
export async function assertCodexScopedSourceCurrentV01(scope: CodexScopedTaskV01, request?: NativeHostRequestV01): Promise<void> {
  const m = material(scope);
  if (!equal(await inspectNativeHostPhysicalRootIdentityV01(m.root), m.physical)) refuse("root_changed");
  assertInventory(m.root, [...m.files, ...(m.historical_files ?? [])]);
  for (const f of m.approved_instruction_files) if (digest(fileBytes(f.path)) !== f.sha256) refuse("instruction_hash_changed");
  if (!request) return;
  const authored = request.packet.compatibility.source_contracts.includes(AUTHORED_SUCCESSOR_TASK_V01);
  if (authored || m.historical_files) {
    assertAuthoredSuccessorInventoryV01(request.packet, { files: m.files, historical_files: m.historical_files ?? [], approved_instruction_hashes: m.approved_instruction_files.map(f => f.sha256) });
    if (!("source_transition_receipt_ref" in request.packet_lineage) &&
      (!("lineage_kind" in request.packet_lineage) || request.packet_lineage.lineage_kind !== "authored_successor_task")) refuse("request_binding_mismatch");
  }
  if (request.mode !== "interactive" || request.automation_context || request.repository_delegation_context ||
    request.repository_resume_context || request.execution_grant_ref || request.packet_capability_grant ||
    request.root_scope.root_kind !== "plain_folder" || request.root_scope.canonical_root !== m.root ||
    !equal(request.root_scope.physical_root_identity, m.physical) ||
    request.packet.packet_id !== m.packet_id || request.packet.integrity.fingerprint !== m.packet_fingerprint ||
    createProtocolSha256V01(canonicalizeProtocolValueV01(request.guide_brief ?? null)) !== m.guide_brief_fingerprint ||
    request.task_context_packet_ref.external_id !== m.packet_id ||
    request.policy.filesystem !== "selected_project_root_only" || request.policy.model !== "native_host_managed" ||
    !request.allowed_operation_categories.includes("read_validated_task_context") ||
    !request.allowed_operation_categories.includes("return_bounded_structured_result") ||
    (m.stage === 2 && !authored && (!("source_transition_receipt_ref" in request.packet_lineage) || !request.packet_lineage.source_transition_receipt_ref))) refuse("request_binding_mismatch");
}

// Pin only the small extension's controls, not the historical qualification
// fingerprint. The host supports these at tagged source 5adb68a... (0.152.1).
const DISABLED_FEATURES = [
  "memories", "external_agent_memory_import", "chronicle", "background_paginated_rollout_migration",
  "apps", "plugins", "remote_plugin", "plugin_hooks", "hooks", "recommended_plugins",
  "executor_capability_discovery", "enable_mcp_apps", "tool_search", "tool_suggest", "skill_search",
  "skill_mcp_dependency_install", "skill_env_var_dependency_prompt", "mentions_v2", "mcp_2026_07_28",
  "multi_agent", "multi_agent_v2", "enable_fanout", "goals", "sleep_tool", "send_async_message",
  "computer_use", "browser_use", "browser_use_external", "browser_use_full_cdp_access", "in_app_browser",
  "in_app_chat", "in_app_local_automation", "image_generation", "workspace_dependencies",
  "request_permissions_tool", "network_proxy", "remote_control", "realtime_conversation",
  "auth_elicitation", "use_agent_identity", "shell_snapshot", "shell_snapshot_v2",
  "web_search_request", "web_search_cached", "standalone_web_search", "guardian_approval", "guardianv2",
  "guardian_ext", "step_model_switching",
  "view_image", "code_mode", "code_mode_prewarm", "code_mode_only", "js_repl", "js_repl_tools_only",
  "deferred_executor", "local_thread_store_compression", "local_thread_store_shared_compression",
  "tool_call_mcp_elicitation", "unavailable_dummy_tools",
] as const;

function configFiles(codexHome: string, root: string): string[] {
  const files = new Set(["/etc/codex/config.toml", path.join(codexHome, "config.toml")]);
  for (let current = root; ; current = path.dirname(current)) {
    files.add(path.join(current, ".codex", "config.toml"));
    if (current === path.dirname(current)) break;
  }
  return [...files].sort();
}
function readConfig(filename: string): Record<string, unknown> {
  if (!existsSync(filename)) return {};
  try { return record(parse(fileBytes(filename).toString("utf8"))); }
  catch { refuse("configuration_unreadable"); }
}
const UNAPPROVED_CONFIG_MATERIAL = [
  "instructions", "developer_instructions", "model_instructions_file", "compact_prompt", "experimental_compact_prompt_file",
  "model_catalog_json", "profile", "chatgpt_base_url", "openai_base_url", "experimental_thread_store_endpoint", "experimental_thread_store",
] as const;
function assertNoUnapprovedConfiguration(c: Record<string, unknown>): void {
  for (const key of UNAPPROVED_CONFIG_MATERIAL) {
    // Config/read materializes the pinned built-in subscription endpoint.
    if (key === "chatgpt_base_url" && ["https://chatgpt.com/backend-api", "https://chatgpt.com/backend-api/"].includes(String(c[key]))) continue;
    if (c[key] != null && c[key] !== "") refuse(`unapproved_configuration_material_${key}`);
  }
  for (const key of ["model_providers", "profiles", "responses_api_metadata", "otel"])
    if (Object.keys(optionalRecord(c[key])).length) refuse(`unapproved_configuration_material_${key}`);
}

const SCOPED_COMMAND_PATH = "/usr/bin:/bin:/usr/sbin:/sbin";
const SHELL_POLICY_FIELDS = new Set([
  "inherit", "ignore_default_excludes", "set", "exclude", "include_only", "filters", "experimental_use_profile",
]);

/** Inspect shape and surviving names, never return or copy private set values. */
function assertShellEnvironmentPolicy(value: unknown, effective = false): void {
  const p = optionalRecord(value);
  if (Object.keys(p).some(k => !SHELL_POLICY_FIELDS.has(k)) ||
    (p.inherit != null && (typeof p.inherit !== "string" || !["none", "core", "all"].includes(p.inherit))) ||
    ["ignore_default_excludes", "experimental_use_profile"].some(k => p[k] != null && typeof p[k] !== "boolean"))
    refuse("shell_environment_policy_invalid");
  for (const field of ["exclude", "include_only"])
    if (p[field] != null && (!Array.isArray(p[field]) || p[field].some(v => typeof v !== "string")))
      refuse("shell_environment_policy_invalid");
  const filters = p.filters == null ? null : record(p.filters);
  if (filters && (p.exclude != null || p.include_only != null ||
    Object.values(filters).some(v => v !== "include" && v !== "exclude") ||
    new Set(Object.keys(filters).map(k => k.toLowerCase())).size !== Object.keys(filters).length))
    refuse("shell_environment_policy_invalid");
  const set = optionalRecord(p.set);
  for (const [key, value] of Object.entries(set)) {
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/u.test(key) || typeof value !== "string")
      refuse("shell_environment_policy_invalid");
    // Pinned patterns match without case sensitivity, while macOS set keys
    // merge case-sensitively. PATH does not replace a surviving Path/path alias.
    if (key.toLowerCase() === "path" && key !== "PATH") refuse("shell_environment_path_alias");
  }
  if (!effective) return;
  // The loader may return canonical keyed filters instead of legacy arrays.
  // Accept only the same closed final filter, including normalized key case.
  const closedFilter = filters
    ? Object.keys(filters).length === 1 && Object.entries(filters).every(([k, v]) => k.toLowerCase() === "path" && v === "include")
    : equal(p.include_only, ["PATH"]) && equal(p.exclude ?? [], []);
  if (p.inherit !== "none" || p.ignore_default_excludes !== false || p.experimental_use_profile !== false ||
    set.PATH !== SCOPED_COMMAND_PATH || !closedFilter) refuse("effective_shell_environment_mismatch");
}

// A fixed predicate executed by the pinned command/exec consumer. It emits no
// names or values on failure. These optional flags have specific runtime
// producers; this is deliberately not a CODEX_* wildcard or a thread env claim.
const COMMAND_ENVIRONMENT_PREDICATE = `BEGIN {
  for (name in ENVIRON) {
    if (name == "PATH") continue;
    if (name == "CODEX_SANDBOX" && ENVIRON[name] == "seatbelt") continue;
    if (name == "CODEX_SANDBOX_NETWORK_DISABLED" && ENVIRON[name] == "1") continue;
    if (name == "CODEX_APPLY_PATCH_PRESERVE_LINE_ENDINGS" && ENVIRON[name] == "1") continue;
    exit 61;
  }
  if (ENVIRON["PATH"] != "${SCOPED_COMMAND_PATH}") exit 62;
  print "augnes-scoped-environment-ok";
}`;
function inline(value: unknown): string {
  if (typeof value === "string") return JSON.stringify(value);
  if (typeof value === "boolean" || typeof value === "number") return String(value);
  if (Array.isArray(value)) return `[${value.map(inline).join(",")}]`;
  return `{${Object.entries(record(value)).map(([key, val]) => `${JSON.stringify(key)}=${inline(val)}`).join(",")}}`;
}
function permissionProjection(value: unknown): Record<string, unknown> {
  const p = structuredClone(record(value));
  // Pinned PermissionProfileToml serializes these Option fields as null.
  // Normalize only those known absent defaults; every non-null addition,
  // inherited root, network rule, or unknown field still fails equality.
  for (const key of ["description", "extends", "workspace_roots"]) if (p[key] === null) delete p[key];
  const fs = record(p.filesystem), net = record(p.network);
  if (fs.glob_scan_max_depth === null) delete fs.glob_scan_max_depth;
  for (const key of ["proxy_url", "enable_socks5", "socks_url", "enable_socks5_udp", "allow_upstream_proxy",
    "dangerously_allow_non_loopback_proxy", "dangerously_allow_all_unix_sockets", "mode", "domains", "unix_sockets", "allow_local_binding", "mitm"])
    if (net[key] === null) delete net[key];
  return p;
}
export interface ScopedCodexLaunchV01 {
  readonly args: readonly string[];
  readonly profile_name: string;
  readonly settings: Readonly<Record<string, unknown>>;
  readonly configuration_fingerprint: string;
  readonly code_mode_profile_fingerprint: string | null;
  assert_sources_current(): void;
  assert_configuration(response: unknown): void;
  readonly command_environment_check: Readonly<{ command: readonly string[]; cwd: string; permissionProfile: string; timeoutMs: number; outputBytesCap: number }>;
  assert_command_environment(response: unknown): void;
  assert_mcp_catalog(response: unknown): void;
  assert_thread(response: unknown): void;
  assert_settings(response: unknown): void;
}

/** Reads local configuration only to suppress sources before process startup.
 * Never returns config contents, credentials, prompts, or personal memory. */
export function prepareScopedCodexLaunchV01(scope: CodexScopedTaskV01, environment: NodeJS.ProcessEnv,
  runtime: CodexScopedRuntimeArtifactV01 = selectPinnedCodexQualifiedRuntimeV01().artifact): ScopedCodexLaunchV01 {
  const m = material(scope);
  return prepareRestrictedCodexLaunchV01({ ...m, source_root: m.root, root: m.snapshot.root }, scope.fingerprint, environment, runtime, false);
}

/** Candidate-only narrowing projection. This is configuration, not an execution
 * grant or a fabricated TaskContextPacket scope. Only the existing candidate
 * owner may bind it to an exact artifact and its single-use canary. */
export function prepareCodexNativeCanaryLaunchV01(input: {
  root: string; fingerprint: string;
  approved_instruction_files: readonly Readonly<{ path: string; sha256: string }>[];
}, environment: NodeJS.ProcessEnv, runtime: CodexScopedRuntimeArtifactV01): ScopedCodexLaunchV01 {
  if (runtime.version !== "0.153.4" || !/^sha256:[a-f0-9]{64}$/u.test(input.fingerprint) ||
      input.approved_instruction_files.length > 4 || input.approved_instruction_files.some(f =>
        !path.isAbsolute(f.path) || !/^[a-f0-9]{64}$/u.test(f.sha256) || digest(fileBytes(f.path)) !== f.sha256))
    refuse("native_canary_inputs_invalid");
  return prepareRestrictedCodexLaunchV01({ ...structuredClone(input), files: [] }, input.fingerprint, environment, runtime, true);
}

function prepareRestrictedCodexLaunchV01(m: Pick<StageMaterial, "root" | "files" | "approved_instruction_files"> & { source_root?: string },
  fingerprint: string, environment: NodeJS.ProcessEnv, runtime: CodexScopedRuntimeArtifactV01,
  nativeCanary: boolean): ScopedCodexLaunchV01 {
  assertCodexScopedRuntimeArtifactV01(runtime);
  const runtimeVersion = runtime.version; // Detached; no mutable caller binding retained.
  // Model metadata still owns tool-mode routing. Only the exact task extension
  // selects the process provider; it neither forces code mode nor changes the
  // catalog. Scalar false on the other routes replaces inherited host tables.
  const processCodeMode = runtimeVersion === "0.153.4" && !nativeCanary;
  const codeModeHost = processCodeMode ? { enabled: true, disable_in_process_fallback: true } : false;
  const disabledFeatures = [
    ...DISABLED_FEATURES,
    ...(runtimeVersion === "0.153.4" ? ["context_management", "mcp_oauth_refresh_coordination"] : []),
    ...(nativeCanary ? ["shell_tool", "unified_exec"] : []),
  ];
  const codexHome = path.resolve(environment.CODEX_HOME ?? path.join(environment.HOME ?? os.homedir(), ".codex"));
  const paths = [...new Set([...configFiles(codexHome, m.root), ...configFiles(codexHome, m.source_root ?? m.root)])].sort();
  const servers = new Set<string>();
  const nativeAuthInputs = new Map<string, unknown>();
  const sourceHashes = new Map<string, string | null>();
  // These managed sources can override session controls. This bounded opt-in
  // refuses their presence; it never disables or rewrites managed policy.
  for (const p of ["/etc/codex/requirements.toml", "/etc/codex/managed_config.toml",
    path.join(codexHome, "managed_config.toml"), "/Library/Managed Preferences/com.openai.codex.plist",
    path.join(environment.HOME ?? os.homedir(), "Library/Managed Preferences/com.openai.codex.plist")]) {
    if (existsSync(p)) refuse("managed_configuration_requires_review");
    sourceHashes.set(p, null);
  }
  for (const p of paths) {
    sourceHashes.set(p, existsSync(p) ? digest(fileBytes(p)) : null);
    const c = readConfig(p);
    assertNoUnapprovedConfiguration(c);
    if (nativeCanary) {
      if (c.sqlite_home != null) refuse("native_canary_state_redirected");
      // Let official AuthManager own selection/refresh. Only compare explicit
      // source settings with effective readback; never project their values to
      // argv, evidence or task context. Conflicting source layers fail closed.
      for (const key of ["cli_auth_credentials_store", "forced_login_method", "forced_chatgpt_workspace_id"]) {
        if (c[key] == null) continue;
        if (nativeAuthInputs.has(key) && !equal(nativeAuthInputs.get(key), c[key])) refuse("native_auth_source_conflict");
        nativeAuthInputs.set(key, c[key]);
      }
      const secretStorage = optionalRecord(c.features).secret_auth_storage;
      if (secretStorage != null) {
        if (nativeAuthInputs.has("secret_auth_storage") && !equal(nativeAuthInputs.get("secret_auth_storage"), secretStorage)) refuse("native_auth_source_conflict");
        nativeAuthInputs.set("secret_auth_storage", secretStorage);
      }
    }
    if (c["shell-environment-policy"] != null) refuse("shell_environment_policy_invalid");
    assertShellEnvironmentPolicy(c.shell_environment_policy);
    Object.keys(optionalRecord(c.mcp_servers)).forEach(name => servers.add(name));
  }
  if (servers.size > 32) refuse("configuration_bound_exceeded");
  for (const name of ["AGENTS.md", "AGENTS.override.md"]) {
    const p = path.join(codexHome, name);
    const hash = existsSync(p) ? digest(fileBytes(p)) : null;
    sourceHashes.set(p, hash);
    if (hash && !m.approved_instruction_files.some(f => f.path === p && f.sha256 === hash)) refuse("unapproved_instructions");
  }
  const profileName = `augnes_synthetic_${fingerprint.slice(7)}`;
  // The pinned :minimal preset also supplies required macOS startup syscalls.
  // Keep those OS mechanics, but explicitly deny its unrelated configuration,
  // database, third-party library and terminal read exceptions. The preset by
  // itself is NOT an approved synthetic data boundary.
  const runtimeDataDenials = ["/etc", "/private/etc", "/var/db", "/private/var/db", "/Library/Preferences",
    "/Library/Filesystems/NetFSPlugins", "/opt/homebrew/lib", "/usr/local/lib", "/dev/tty", "/dev/ttys*"];
  const profile = { filesystem: { ":minimal": "read", ...Object.fromEntries(runtimeDataDenials.map(p => [p, "deny"])),
    ...Object.fromEntries(m.files.map(f => [path.join(m.root, f.relative_path), "read"])) }, network: { enabled: false } };
  const settings: Record<string, unknown> = {
    model: SCOPED_CODEX_MODEL_V01, model_provider: "openai", model_reasoning_effort: SCOPED_CODEX_EFFORT_V01,
    default_permissions: profileName, permissions: { [profileName]: profile }, web_search: "disabled",
    approval_policy: "never", approvals_reviewer: "user",
    // Metadata can select multi-agent v2 despite both feature flags being off.
    // This pinned Config consumer overrides that selection without a catalog edit.
    ...(processCodeMode ? { agents: { enabled: false } } : {}),
    features: { ...Object.fromEntries(disabledFeatures.map(f => [f, false])), code_mode_host: codeModeHost, skip_host_skill_discovery: true },
    memories: { use_memories: false, generate_memories: false },
    mcp_servers: Object.fromEntries([...servers].sort().map(name => [name, { enabled: false }])),
    skills: { bundled: { enabled: false }, include_instructions: false },
    orchestrator: { mcp: { enabled: false }, skills: { enabled: false } },
    project_doc_max_bytes: 0, project_doc_fallback_filenames: [], allow_login_shell: false,
    check_for_update_on_startup: false, notify: [],
    // Pinned merge replaces these arrays and displaces inherited keyed filters.
    // set remains privately merged; final include_only runs AFTER every set.
    shell_environment_policy: { inherit: "none", ignore_default_excludes: false, set: { PATH: SCOPED_COMMAND_PATH },
      include_only: ["PATH"], exclude: [], experimental_use_profile: false },
  };
  const args = ["--strict-config", ...Object.entries(settings).flatMap(([key, value]) => ["-c", `${key}=${inline(value)}`])];
  const assertSources = () => {
    for (const [p, hash] of sourceHashes) if ((existsSync(p) ? digest(fileBytes(p)) : null) !== hash) refuse("configuration_changed");
  };
  const assertConfiguration = (response: unknown) => {
    assertSources();
    const r = record(response), c = record(r.config);
    assertNoUnapprovedConfiguration(c);
    if (nativeCanary && c.sqlite_home != null) refuse("native_canary_state_redirected");
    assertShellEnvironmentPolicy(c.shell_environment_policy, true);
    for (const key of ["model", "model_provider", "model_reasoning_effort", "default_permissions", "web_search", "project_doc_max_bytes", "allow_login_shell"])
      if (!equal(c[key], settings[key])) refuse("effective_configuration_mismatch");
    const features = record(c.features);
    // This typed host setting chooses a different executable. Checking only
    // enabled (or accepting scalar true) would not establish the backend.
    if (!equal(features.code_mode_host, codeModeHost)) refuse("code_mode_backend_mismatch");
    // A disabled typed CodeMode table can still change nested/direct-only
    // namespaces and yield behavior. Our scalar override must replace it, not
    // merely turn off its feature bit. Metadata remains the routing owner.
    if (features.code_mode !== false || features.code_mode_only !== false) refuse("code_mode_routing_override");
    if (processCodeMode && optionalRecord(c.agents).enabled !== false) refuse("agents_enabled");
    if (processCodeMode && features.shell_tool != null && features.shell_tool !== true)
      refuse("nested_command_tool_disabled");
    if (nativeCanary) for (const [key, expected] of nativeAuthInputs) {
      const actual = key === "secret_auth_storage" ? features[key] : c[key];
      if (!equal(actual, expected)) refuse("native_auth_effective_source_mismatch");
    }
    for (const key of disabledFeatures) {
      const val = features[key];
      if (val !== false && (val == null || typeof val !== "object" || record(val).enabled !== false)) refuse("ambient_feature_enabled");
    }
    const checks: [string, boolean][] = [
      ["skill_discovery", features.skip_host_skill_discovery === true],
      ["memories", record(c.memories).use_memories === false && record(c.memories).generate_memories === false],
      ["skills", record(record(c.skills).bundled).enabled === false && record(c.skills).include_instructions === false],
      ["orchestrator", record(record(c.orchestrator).mcp).enabled === false && record(record(c.orchestrator).skills).enabled === false],
      ["mcp", Object.values(optionalRecord(c.mcp_servers)).every(v => record(v).enabled === false)],
      ["permissions", equal(permissionProjection(record(c.permissions)[profileName]), profile)],
      ["provider", Object.keys(optionalRecord(c.model_providers)).length === 0],
    ];
    for (const [key, valid] of checks) if (!valid) refuse(`effective_${key}_mismatch`);
    if (!Array.isArray(r.layers)) refuse("configuration_provenance_missing");
    for (const layer of r.layers) {
      const name = record(record(layer).name);
      if (name.type === "sessionFlags") continue;
      if (name.type === "user" || name.type === "system") {
        if (typeof name.file !== "string" || !sourceHashes.has(name.file)) refuse("configuration_source_unknown");
      } else if (name.type === "project") {
        if (typeof name.dotCodexFolder !== "string" || !sourceHashes.has(path.join(name.dotCodexFolder, "config.toml"))) refuse("configuration_source_unknown");
      } else if (name.type !== "packagedDefaults") refuse("configuration_source_unknown");
    }
  };
  const assertProfile = (r: Record<string, unknown>) => {
    const active = record(r.activePermissionProfile);
    if (active.id !== profileName || active.extends != null) refuse("permission_profile_mismatch");
  };
  const assertThread = (response: unknown) => {
    assertSources();
    const r = record(response), thread = record(r.thread);
    assertProfile(r);
    if (r.model !== SCOPED_CODEX_MODEL_V01 || r.modelProvider !== "openai" || r.reasoningEffort !== SCOPED_CODEX_EFFORT_V01 ||
      r.cwd !== m.root || thread.cwd !== m.root || thread.modelProvider !== "openai" || thread.cliVersion !== runtimeVersion ||
      r.approvalPolicy !== "never" || r.approvalsReviewer !== "user" ||
      record(r.sandbox).type !== "readOnly" || record(r.sandbox).networkAccess !== false ||
      thread.ephemeral !== true || !Array.isArray(thread.turns) || thread.turns.length ||
      !Array.isArray(r.instructionSources) || r.instructionSources.some(p => !m.approved_instruction_files.some(f => f.path === p)))
      refuse("thread_binding_mismatch");
  };
  return freeze({
    args, profile_name: profileName, settings,
    command_environment_check: { command: ["/usr/bin/awk", COMMAND_ENVIRONMENT_PREDICATE], cwd: m.root,
      permissionProfile: profileName, timeoutMs: 10_000, outputBytesCap: 128 },
    assert_command_environment(response: unknown) {
      assertSources();
      const r = record(response);
      if (r.exitCode !== 0 || r.stdout !== "augnes-scoped-environment-ok\n" || r.stderr !== "")
        refuse("command_environment_mismatch");
    },
    configuration_fingerprint: createProtocolSha256V01(canonicalizeProtocolValueV01({ settings, source_hashes: [...sourceHashes] })),
    code_mode_profile_fingerprint: processCodeMode ? CODEX_SCOPED_CODE_MODE_PROFILE_FINGERPRINT_V01 : null,
    assert_sources_current: assertSources, assert_configuration: assertConfiguration, assert_thread: assertThread,
    assert_mcp_catalog(response: unknown) {
      const r = record(response);
      if (!Array.isArray(r.data) || r.data.length > servers.size || r.nextCursor !== null) refuse("mcp_catalog_invalid");
      for (const value of r.data) {
        const server = record(value);
        if (typeof server.name !== "string" || !servers.has(server.name) || server.pluginId != null || server.runtimeStatus != null || server.serverInfo != null ||
          Object.keys(record(server.tools)).length || !equal(server.resources, []) || !equal(server.resourceTemplates, [])) refuse("mcp_capability_present");
      }
    },
    assert_settings(response: unknown) {
      const r = record(response); assertProfile(r);
      if (r.model !== SCOPED_CODEX_MODEL_V01 || r.modelProvider !== "openai" || r.effort !== SCOPED_CODEX_EFFORT_V01 ||
        r.cwd !== m.root || r.approvalPolicy !== "never" || r.approvalsReviewer !== "user") refuse("settings_binding_mismatch");
    },
  });
}

export async function consumeScopedCodexTaskV01(scope: CodexScopedTaskV01, request: NativeHostRequestV01): Promise<void> {
  if (consumed.has(scope)) refuse("scope_already_consumed");
  consumed.add(scope);
  readCodexScopedRequestBindingV01(scope, request);
  await assertCodexScopedTaskCurrentV01(scope, request);
  unsettled.add(scope);
}

export interface CodexFeasibilityWindowV01 {
  begin(scope: CodexScopedTaskV01, timeout_ms: number, settle_ms: number): CodexScopedAttemptV01;
  snapshot(): Readonly<{ attempts: number; active: boolean; stopped: boolean; remaining_window_ms: number | null }>;
}
const windows = new WeakSet<CodexFeasibilityWindowV01>();
export function assertCodexScopedExecutionV01(input: { scope: CodexScopedTaskV01; window: CodexFeasibilityWindowV01 }): void {
  material(input.scope);
  if (!windows.has(input.window)) refuse("window_not_source_owned");
}
export interface CodexScopedAttemptV01 {
  readonly scope: CodexScopedTaskV01;
  readonly timeout_ms: number;
  readonly stop_settle_timeout_ms: number;
  before_invoke(request: NativeHostRequestV01): Promise<void>;
  schedule(scheduler: NativeHostTimeoutSchedulerV01): NativeHostTimeoutSchedulerV01;
  finish(completed: boolean): void;
}

/** One disposable case, one shared clock, no timer or durable/global budget. */
export function createCodexFeasibilityWindowV01(now_ms: () => number = () => performance.now()): CodexFeasibilityWindowV01 {
  return createWindow(now_ms).window;
}

/** Trusted local study coordinator. Preparation is read-only. revise() arms
 * immediately before the first normal authenticated semantic write; every
 * subsequent write passes the same guard. Neither the clock nor the local
 * disposition creates a Decision or grants semantic authority. No HTTP route
 * accepts this object. The third argument is the existing fake-clock test seam,
 * never a historical timestamp or serialized start value. */
export async function createPersistedCodexFeasibilityContinuationV01(
  db: Database.Database, input: PersistedCodexContinuationInputV01,
  now_ms: () => number = () => performance.now(),
) {
  const owner = await preparePersistedCodexContinuationV01(db, input);
  const clock = createWindow(now_ms, owner);
  let scope: CodexScopedTaskV01 | undefined, preparing = false;
  const close = async (primary?: unknown) => {
    const errors: unknown[] = primary === undefined ? [] : [primary];
    try { clock.stop(); } catch (error) { errors.push(error); }
    try { if (scope) await releaseCodexScopedTaskV01(scope); } catch (error) { errors.push(error); }
    if (errors.length === 1) throw errors[0];
    if (errors.length > 1) throw new AggregateError(errors, "codex_scoped_continuation_cleanup_failed");
  };
  return Object.freeze({
    predecessor: freeze(structuredClone(owner.predecessor)),
    disposition_path: owner.dispositionPath,
    window: clock.window,
    revise: (input: Parameters<typeof owner.revise>[0]) => clock.modify(() => owner.revise(input), true),
    decide: (input: Parameters<typeof owner.decide>[0]) => clock.modify(() => owner.decide(input)),
    preview: (input: Parameters<typeof owner.preview>[0]) => { clock.check(); return owner.preview(input); },
    confirm: (input: Parameters<typeof owner.confirm>[0]) => clock.modify(() => owner.confirm(input)),
    apply: (input: Parameters<typeof owner.apply>[0]) => clock.modify(() => owner.apply(input)),
    async prepareStage2(input: Pick<Parameters<typeof createCodexScopedTaskV01>[0], "files" | "approved_instruction_files">) {
      clock.check();
      if (scope || preparing) refuse("continuation_scope_already_prepared");
      preparing = true;
      try {
        const prepared = await owner.admitB(); clock.check();
        scope = await createCodexScopedTaskV01({ ...input, stage: 2,
          canonical_root: prepared.admission.root_scope.canonical_root,
          packet_id: prepared.admission.packet.packet_id, packet_fingerprint: prepared.admission.packet.integrity.fingerprint,
          guide_brief_fingerprint: createProtocolSha256V01(canonicalizeProtocolValueV01(prepared.guide)) });
        clock.check(); clock.bind(scope, prepared.admission);
        return { scope, window: clock.window, admission: prepared.admission, guide: prepared.guide };
      } catch (error) {
        await close(error);
        throw error;
      } finally { preparing = false; }
    },
    // Finite coordinator cleanup. The service must settle/release any submitted
    // scope first; the ordinary scope owner refuses unsettled consumers.
    close: () => close(),
  });
}

type ContinuationOwner = Awaited<ReturnType<typeof preparePersistedCodexContinuationV01>>;
function createWindow(now_ms: () => number, continuation?: ContinuationOwner) {
  let deadline: number | null = null, last = -Infinity, count = 0, active = false, failed = false;
  let prior: Readonly<StageMaterial> | null = null;
  let preparedScope: CodexScopedTaskV01 | undefined;
  let preparedAdmission: Parameters<ContinuationOwner["assertBStart"]>[0] | undefined;
  let dispositionStopped = false;
  let terminalDispositionError: unknown;
  const now = () => {
    const n = now_ms(); if (!Number.isFinite(n) || n < last) refuse("clock_invalid"); last = n; return n;
  };
  const stop = () => {
    failed = true;
    if (terminalDispositionError) throw terminalDispositionError;
    if (continuation && deadline !== null && !dispositionStopped) {
      dispositionStopped = true; continuation.append("stopped");
    }
  };
  const check = () => {
    if (failed || active || count !== 0 || deadline === null || now() >= deadline) {
      stop(); refuse("continuation_window_unavailable");
    }
    continuation?.assertPredecessor();
  };
  const modify = <T>(action: () => T, arm = false): T => {
    try {
      if (arm && deadline === null && !failed) {
        continuation!.assertPredecessor();
        // Start at the first modifying coordinator action, including claim I/O.
        deadline = now() + 600_000; continuation!.append("armed");
      }
      check();
      const result = action(); continuation!.append("semantic_action"); return result;
    } catch (error) { try { stop(); } catch { /* Preserve the original refusal; disposition remains fail-closed. */ } throw error; }
  };
  const window = Object.freeze({
    snapshot() {
      const remaining = deadline === null ? null : Math.max(0, Math.floor(deadline - now()));
      if (remaining === 0) failed = true;
      return Object.freeze({ attempts: count, active, stopped: failed, remaining_window_ms: remaining });
    },
    begin(scope: CodexScopedTaskV01, timeout: number, settle: number): CodexScopedAttemptV01 {
      const time = now(); if (!continuation) deadline ??= time + 600_000;
      const m = material(scope);
      if (continuation) {
        try {
          if (failed || active || count !== 0 || deadline === null || m.stage !== 2 || scope !== preparedScope || !preparedAdmission)
            refuse("window_start_refused");
          // Zero new attempts until this first actual Start. Historical X is
          // predecessor evidence, not a fictitious local attempt/finish.
          count += 1;
          continuation.assertBStart(preparedAdmission);
        } catch (error) { try { stop(); } catch { /* Refusal preserved. */ } throw error; }
      } else if (failed || active || count >= 2 || m.stage !== count + 1 ||
        (prior && (m.root !== prior.root || !equal(m.physical, prior.physical) || m.packet_id === prior.packet_id || m.packet_fingerprint === prior.packet_fingerprint))) {
        failed = true; refuse("window_start_refused");
      }
      if (!continuation) count += 1;
      if (!Number.isInteger(timeout) || timeout <= 0 || !Number.isInteger(settle) || settle <= 0) { failed = true; refuse("limit_invalid"); }
      const settleLimit = Math.min(settle, 10_000);
      const allowance = Math.floor(Math.min(timeout, 180_000, deadline! - time - settleLimit));
      if (allowance <= 0) { failed = true; refuse("window_expired"); }
      active = true; prior = m;
      let finished = false;
      const remaining = () => Math.floor(Math.min(allowance, deadline! - now() - settleLimit));
      return Object.freeze({
        scope, timeout_ms: allowance, stop_settle_timeout_ms: settleLimit,
        async before_invoke(request: NativeHostRequestV01) {
          if (remaining() <= 0) { failed = true; refuse("window_expired"); }
          if (continuation) {
            readCodexScopedRequestBindingV01(scope, request);
            await continuation.assertBRequest(request, preparedAdmission!);
          }
          await assertCodexScopedTaskCurrentV01(scope, request);
          if (remaining() <= 0) { failed = true; refuse("window_expired"); }
        },
        schedule(scheduler: NativeHostTimeoutSchedulerV01): NativeHostTimeoutSchedulerV01 {
          return input => {
            const ms = Math.min(input.timeout_ms, remaining());
            const on_timeout = () => { failed = true; input.on_timeout(); };
            if (ms <= 0) { on_timeout(); return () => undefined; }
            return scheduler({ ...input, timeout_ms: ms, on_timeout });
          };
        },
        finish(completed: boolean) {
          if (finished) return; finished = true; active = false;
          if (!completed || now() > deadline!) failed = true;
          if (continuation) {
            dispositionStopped = true;
            try { continuation.append(failed ? "stopped" : "completed"); }
            catch (error) {
              // The normal result/receipt has already settled. Local disposition
              // failure is reported by close(), never a new host outcome.
              failed = true; terminalDispositionError = error;
            }
          }
        },
      });
    },
  });
  windows.add(window);
  return { window, check, modify, stop,
    bind(scope: CodexScopedTaskV01, admission: NonNullable<typeof preparedAdmission>) {
      check(); preparedScope = scope; preparedAdmission = structuredClone(admission);
    } };
}
