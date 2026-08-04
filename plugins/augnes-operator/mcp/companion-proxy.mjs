#!/usr/bin/env node

import { createHash } from "node:crypto";
import { lstatSync, readFileSync, readdirSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";

const TOOL_NAME = "augnes_resume_repository";
const PREPARE_TOOL_NAME = "augnes_prepare_repository_execution";
const ADOPT_TOOL_NAME = "augnes_adopt_repository_execution_root";
const VALIDATE_TOOL_NAME = "augnes_validate_repository_execution_attachment";
const PREVIEW_REBIND_TOOL_NAME = "augnes_preview_repository_execution_root_rebind";
const REBIND_TOOL_NAME = "augnes_rebind_repository_execution_root";
const REVOKE_TOOL_NAME = "augnes_revoke_repository_execution_attachment";
const MAX_RUNTIME_FILE_BYTES = 64 * 1024;
const MAX_CONTINUITY_RESPONSE_BYTES = 256 * 1024;
const REQUEST_TIMEOUT_MS = 2_000;
const ROUTE_MARKER = "codex-repository-continuity-v0.1";
const EXECUTION_ROUTE_MARKER = "repository-execution-attachment-v0.1";
const PROXY_ACCESS_VERSION = "augnes-companion-proxy-access.v0.1";

export async function discoverVerifiedCompanionV01(environment = process.env) {
  const verified = [];
  for (const manifestPath of candidateManifestPathsV01(environment)) {
    const companion = await verifyManifestV01(manifestPath);
    if (companion) verified.push(companion);
  }
  return verified.length === 1
    ? { status: "resolved", companion: verified[0] }
    : verified.length === 0
      ? { status: "companion_unavailable", companion: null }
      : { status: "companion_ambiguous", companion: null };
}

export function candidateManifestPathsV01(environment = process.env) {
  const explicit = environment.AUGNES_COMPANION_RUNTIME_MANIFEST;
  if (explicit) {
    return environment.AUGNES_COMPANION_TEST_MODE === "1" && path.isAbsolute(explicit)
      ? [path.resolve(explicit)]
      : [];
  }
  const configuredRuntimeDirectory = environment.AUGNES_RUNTIME_STATE_DIR;
  if (configuredRuntimeDirectory) {
    return path.isAbsolute(configuredRuntimeDirectory)
      ? [path.join(path.resolve(configuredRuntimeDirectory), "runtime.json")]
      : [];
  }
  const home = os.homedir();
  const roots = process.platform === "darwin"
    ? [path.join(home, "Library", "Application Support", "Augnes", "runtime")]
    : process.platform === "win32"
      ? [path.join(environment.LOCALAPPDATA ?? path.join(home, "AppData", "Local"), "Augnes", "runtime")]
      : [
          ...(environment.XDG_RUNTIME_DIR ? [environment.XDG_RUNTIME_DIR] : []),
          path.join(environment.XDG_STATE_HOME ?? path.join(home, ".local", "state"), "augnes", "runtime"),
        ];
  const candidates = [];
  for (const root of roots) {
    try {
      for (const entry of readdirSync(root, { withFileTypes: true })) {
        if (entry.isDirectory() && !entry.isSymbolicLink() && /^checkout-[a-f0-9]{16}$/u.test(entry.name)) {
          candidates.push(path.join(root, entry.name, "runtime.json"));
        }
      }
    } catch {
      // A missing platform runtime root means no Companion at that location.
    }
  }
  return [...new Set(candidates)].sort();
}

async function verifyManifestV01(manifestPath) {
  const manifest = readBoundedJsonV01(manifestPath);
  const access = readBoundedJsonV01(path.join(path.dirname(manifestPath), "companion-access.json"));
  if (!validManifestV01(manifest) || !validCompanionAccessV01(access, manifest) || !processAliveV01(manifest.supervisor_pid)) {
    return null;
  }
  const children = new Map(manifest.children.map((child) => [child.role, child]));
  const ui = children.get("ui");
  const bridge = children.get("bridge");
  if (!validChildV01(ui, manifest.ui_port) || !validChildV01(bridge, manifest.bridge_port)) return null;

  const [uiPublic, bridgePublic] = await Promise.all([
    fetchJsonV01(`${manifest.effective_url}/api/healthz`),
    fetchJsonV01(`http://127.0.0.1:${manifest.bridge_port}/healthz`),
  ]);
  if (
    !samePublicUiV01(uiPublic, manifest) ||
    !samePublicBridgeV01(bridgePublic, manifest)
  ) {
    return null;
  }
  return {
    ui_url: manifest.effective_url,
    proxy_token: access.proxy_token,
    instance_id: manifest.instance_id,
    generation_id: manifest.generation_id,
    repository_fingerprint: manifest.repository_fingerprint,
    binding: `sha256:${createHash("sha256").update(JSON.stringify({
      instance: manifest.instance_id,
      generation: manifest.generation_id,
      repository: manifest.repository_fingerprint,
    })).digest("hex")}`,
  };
}

function validManifestV01(value) {
  return Boolean(value) &&
    value.schema_version === 2 &&
    value.contract === "augnes-local-runtime-supervisor-v1" &&
    value.generation_version === 1 &&
    typeof value.generation_id === "string" && value.generation_id.length > 0 &&
    typeof value.instance_id === "string" && value.instance_id.length > 0 &&
    /^[a-f0-9]{64}$/u.test(value.repository_fingerprint ?? "") &&
    Number.isInteger(value.supervisor_pid) && value.supervisor_pid > 0 &&
    value.lifecycle_state === "ready" &&
    value.database_state !== "recovery_required" &&
    typeof value.effective_url === "string" && /^http:\/\/127\.0\.0\.1:[0-9]+$/u.test(value.effective_url) &&
    Number.isInteger(value.ui_port) && value.ui_port > 0 &&
    Number.isInteger(value.bridge_port) && value.bridge_port > 0 &&
    Array.isArray(value.children);
}

function validCompanionAccessV01(access, manifest) {
  return Boolean(access) &&
    access.schema_version === manifest.schema_version &&
    access.contract === manifest.contract &&
    access.generation_version === manifest.generation_version &&
    access.generation_id === manifest.generation_id &&
    access.instance_id === manifest.instance_id &&
    access.repository_fingerprint === manifest.repository_fingerprint &&
    access.access_version === PROXY_ACCESS_VERSION &&
    typeof access.proxy_token === "string" && access.proxy_token.length >= 32;
}

function validChildV01(child, port) {
  return Boolean(child) && child.state === "ready" && child.port === port &&
    Number.isInteger(child.pid) && child.pid > 0 && processAliveV01(child.pid);
}

function samePublicUiV01(body, manifest) {
  return body?.ok === true && body?.service === "augnes-ui" && body?.status === "ready" &&
    body?.recovery_mode === false && body?.runtime_instance_id === manifest.instance_id &&
    body?.runtime_generation_id === manifest.generation_id &&
    body?.runtime_repository_fingerprint === manifest.repository_fingerprint;
}

function samePublicBridgeV01(body, manifest) {
  return body?.ok === true && body?.name === "augnes-console" && body?.mode === "http" &&
    body?.live_core_status === "ready" && body?.runtime_instance_id === manifest.instance_id &&
    body?.runtime_generation_id === manifest.generation_id &&
    body?.runtime_repository_fingerprint === manifest.repository_fingerprint;
}

function readBoundedJsonV01(file) {
  try {
    const stat = lstatSync(file);
    if (!stat.isFile() || stat.isSymbolicLink() || stat.size > MAX_RUNTIME_FILE_BYTES) return null;
    return JSON.parse(readFileSync(file, "utf8"));
  } catch {
    return null;
  }
}

function processAliveV01(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return error?.code === "EPERM";
  }
}

async function fetchJsonV01(url, headers = {}) {
  try {
    const response = await fetch(url, {
      method: "GET",
      headers,
      cache: "no-store",
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    return response.ok ? await response.json() : null;
  } catch {
    return null;
  }
}

async function readRepositoryContinuityV01(companion, repositoryRoot) {
  const route = new URL("/api/augnes/read/codex-repository-continuity", `${companion.ui_url}/`);
  route.searchParams.set("scope", "repository:local");
  const response = await fetch(route, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      accept: "application/json",
      "x-augnes-local-readonly": ROUTE_MARKER,
      "x-augnes-companion-proxy": companion.proxy_token,
    },
    body: JSON.stringify({ repository_root: repositoryRoot }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) throw new Error(`live_companion_route_status_${response.status}`);
  if (
    response.headers.get("x-augnes-local-readonly") !== ROUTE_MARKER ||
    response.headers.get("x-augnes-runtime-instance") !== companion.instance_id ||
    response.headers.get("x-augnes-runtime-generation") !== companion.generation_id ||
    response.headers.get("x-augnes-runtime-repository") !== companion.repository_fingerprint
  ) {
    throw new Error("live_companion_route_identity_invalid");
  }
  const text = await response.text();
  if (Buffer.byteLength(text, "utf8") > MAX_CONTINUITY_RESPONSE_BYTES) {
    throw new Error("live_companion_route_response_too_large");
  }
  return parseRepositoryContinuityResponseV01(JSON.parse(text));
}

async function callRepositoryExecutionV01(companion, body) {
  const route = new URL("/api/augnes/repository-execution", `${companion.ui_url}/`);
  const response = await fetch(route, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      accept: "application/json",
      "x-augnes-repository-execution": EXECUTION_ROUTE_MARKER,
      "x-augnes-companion-proxy": companion.proxy_token,
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) throw new Error(`live_companion_execution_route_status_${response.status}`);
  if (
    response.headers.get("x-augnes-repository-execution") !== EXECUTION_ROUTE_MARKER ||
    response.headers.get("x-augnes-runtime-instance") !== companion.instance_id ||
    response.headers.get("x-augnes-runtime-generation") !== companion.generation_id ||
    response.headers.get("x-augnes-runtime-repository") !== companion.repository_fingerprint
  ) throw new Error("live_companion_execution_route_identity_invalid");
  const text = await response.text();
  if (Buffer.byteLength(text, "utf8") > MAX_CONTINUITY_RESPONSE_BYTES) {
    throw new Error("live_companion_execution_route_response_too_large");
  }
  return parseRepositoryExecutionResponseV01(JSON.parse(text), body.action);
}

function parseRepositoryExecutionResponseV01(value, action) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("live_companion_execution_route_contract_invalid");
  }
  const keysByAction = {
    prepare: ["admission", "attachment", "authority", "ordinary_text", "preparation_version", "project", "reason", "status"],
    adopt_legacy_baseline: ["authority", "baseline_fingerprint", "ordinary_text", "project_id", "status"],
    validate: ["attachment", "status"],
    preview_rebind_root: ["authority", "expected_new_observation_fingerprint", "expected_old_baseline_fingerprint", "expected_old_root_binding_fingerprint", "ordinary_text", "preview_version", "project_id", "reason", "status", "workspace_id"],
    rebind_root: ["authority", "baseline_fingerprint", "ordinary_text", "project_id", "status"],
    revoke: ["attachment", "status"],
  };
  const expectedKeys = keysByAction[action];
  if (!expectedKeys || !exactKeysV01(value, expectedKeys)) invalidExecutionContractV01();
  rejectPrivatePhysicalMaterialV01(value);
  if (["prepare", "adopt_legacy_baseline", "preview_rebind_root", "rebind_root"].includes(action)) {
    repositoryExecutionAuthorityV01(value.authority);
  }
  if (action === "prepare") {
    if (value.preparation_version !== "repository_execution_preparation.v0.1") invalidExecutionContractV01();
    if (!["prepared", "baseline_adoption_required", "blocked"].includes(value.status)) invalidExecutionContractV01();
    stringV01(value.ordinary_text);
  } else if (action === "adopt_legacy_baseline") {
    if (!["adopted", "exact_replay"].includes(value.status)) invalidExecutionContractV01();
    stringV01(value.project_id);
    stringV01(value.baseline_fingerprint);
    stringV01(value.ordinary_text);
  } else if (action === "validate") {
    if (value.status !== "validated") invalidExecutionContractV01();
  } else if (action === "preview_rebind_root") {
    if (value.preview_version !== "repository_execution_root_rebind_preview.v0.1") invalidExecutionContractV01();
    if (!["ready", "blocked"].includes(value.status)) invalidExecutionContractV01();
    stringV01(value.ordinary_text);
  } else if (action === "rebind_root") {
    if (!["rebound", "exact_replay"].includes(value.status)) invalidExecutionContractV01();
    stringV01(value.project_id);
    stringV01(value.baseline_fingerprint);
    stringV01(value.ordinary_text);
  } else if (action === "revoke" && value.status !== "revoked") {
    invalidExecutionContractV01();
  }
  return value;
}

function repositoryExecutionAuthorityV01(value) {
  const keys = [
    "branch_or_commit_created",
    "execution_authority_granted",
    "execution_started",
    "external_effect_authority_granted",
    "github_called",
    "managed_run_created",
    "project_commands_executed",
    "project_files_written",
    "provider_called",
    "semantic_authority_granted",
  ];
  if (!exactKeysV01(value, keys)) invalidExecutionContractV01();
  for (const key of keys) if (value[key] !== false) invalidExecutionContractV01();
}

function rejectPrivatePhysicalMaterialV01(value) {
  const forbidden = new Set([
    "canonical_realpath_fingerprint",
    "credential",
    "database_path",
    "device",
    "filesystem_object_identity",
    "filesystem_volume_identity",
    "inode",
    "local_root",
    "normalized_path",
    "password",
    "secret",
  ]);
  const visit = (candidate) => {
    if (Array.isArray(candidate)) {
      for (const item of candidate) visit(item);
      return;
    }
    if (!candidate || typeof candidate !== "object") return;
    for (const [key, nested] of Object.entries(candidate)) {
      if (forbidden.has(key)) invalidExecutionContractV01();
      visit(nested);
    }
  };
  visit(value);
}

function invalidExecutionContractV01() {
  throw new Error("live_companion_execution_route_contract_invalid");
}

export function parseRepositoryContinuityResponseV01(value) {
  exactObjectV01(value, [
    "authority",
    "browser_deep_link",
    "continuity",
    "current_situation",
    "generated_at",
    "next_meaningful_action",
    "projection_version",
    "repository_resolution",
  ], "repository continuity");
  if (value.projection_version !== "codex_repository_continuity.v0.1") invalidContractV01();
  isoTimestampV01(value.generated_at);
  exactObjectV01(value.repository_resolution, ["display_name", "message", "project_key", "status"], "repository resolution");
  if (!["resolved_exact", "project_not_registered", "project_ambiguous", "root_unavailable", "repository_input_invalid", "companion_unavailable"].includes(value.repository_resolution.status)) invalidContractV01();
  nullableStringV01(value.repository_resolution.project_key);
  nullableStringV01(value.repository_resolution.display_name);
  stringV01(value.repository_resolution.message);
  stringV01(value.current_situation);
  exactObjectV01(value.next_meaningful_action, ["executes", "label", "reason"], "next meaningful action");
  stringV01(value.next_meaningful_action.label);
  stringV01(value.next_meaningful_action.reason);
  if (value.next_meaningful_action.executes !== false) invalidContractV01();
  if (value.browser_deep_link !== null) {
    stringV01(value.browser_deep_link);
    const link = new URL(value.browser_deep_link);
    if (
      link.protocol !== "http:" ||
      !["127.0.0.1", "localhost", "[::1]"].includes(link.hostname)
    ) invalidContractV01();
  }
  authorityV01(value.authority);
  if (value.continuity !== null) continuityV01(value.continuity);
  if (value.repository_resolution.status === "resolved_exact" && value.continuity === null) invalidContractV01();
  if (value.repository_resolution.status !== "resolved_exact" && value.continuity !== null) invalidContractV01();
  return value;
}

function continuityV01(value) {
  exactObjectV01(value, ["authority", "current_work", "gaps", "generated_at", "latest_result", "managed_execution", "next_action", "project", "projection_version", "review_continuity", "snapshot", "source_status"], "current continuity");
  if (value.projection_version !== "codex_current_continuity.v0.1") invalidContractV01();
  isoTimestampV01(value.generated_at);
  if (!["exact", "partial", "unavailable"].includes(value.source_status)) invalidContractV01();
  exactObjectV01(value.snapshot, ["algorithm", "binding", "binding_version", "status"], "snapshot");
  if (value.snapshot.binding_version !== "codex_current_continuity_snapshot.v0.1" || value.snapshot.algorithm !== "sha256" || !["exact", "unavailable"].includes(value.snapshot.status)) invalidContractV01();
  nullableStringV01(value.snapshot.binding);
  exactObjectV01(value.project, ["active", "display_name", "project_key", "root_availability", "selection_revision", "status"], "project");
  booleanV01(value.project.active);
  nullableStringV01(value.project.display_name);
  nullableStringV01(value.project.project_key);
  nullableIntegerV01(value.project.selection_revision);
  stringV01(value.project.root_availability);
  stringV01(value.project.status);
  exactObjectV01(value.current_work, ["currentness", "goal", "lineage_kind", "non_goals", "revision_blocker", "revision_eligible", "start_blocker", "start_eligible", "status", "success_criteria"], "current work");
  for (const key of ["currentness", "status"]) stringV01(value.current_work[key]);
  for (const key of ["goal", "lineage_kind", "revision_blocker", "start_blocker"]) nullableStringV01(value.current_work[key]);
  for (const key of ["revision_eligible", "start_eligible"]) booleanV01(value.current_work[key]);
  stringArrayV01(value.current_work.non_goals);
  stringArrayV01(value.current_work.success_criteria);
  exactObjectV01(value.managed_execution, ["attention_required", "blocker_or_attention", "latest_checkpoint", "mode", "reconciliation_required", "result_available", "stage", "updated_at"], "managed execution");
  stringV01(value.managed_execution.stage);
  for (const key of ["blocker_or_attention", "latest_checkpoint", "mode", "updated_at"]) nullableStringV01(value.managed_execution[key]);
  for (const key of ["attention_required", "reconciliation_required", "result_available"]) booleanV01(value.managed_execution[key]);
  exactObjectV01(value.latest_result, ["artifacts", "blockers", "checks", "currentness", "execution_status", "gaps", "incomplete_historical_fields", "outcome", "proposed_next_steps", "recorded_at", "review_attention", "skipped_checks", "state", "summary", "verification_status", "warnings"], "latest result");
  for (const key of ["currentness", "state"]) stringV01(value.latest_result[key]);
  for (const key of ["execution_status", "outcome", "recorded_at", "review_attention", "summary", "verification_status"]) nullableStringV01(value.latest_result[key]);
  for (const key of ["blockers", "gaps", "incomplete_historical_fields", "proposed_next_steps", "warnings"]) stringArrayV01(value.latest_result[key]);
  if (!Array.isArray(value.latest_result.artifacts) || !Array.isArray(value.latest_result.checks) || !Array.isArray(value.latest_result.skipped_checks)) invalidContractV01();
  for (const artifact of value.latest_result.artifacts) {
    exactObjectV01(artifact, ["basis", "change_kind", "kind", "repository_relative_path", "summary"], "artifact");
    stringV01(artifact.kind);
    nullableStringV01(artifact.repository_relative_path);
    nullableStringV01(artifact.summary);
    nullableStringV01(artifact.change_kind);
    stringV01(artifact.basis);
  }
  for (const check of value.latest_result.checks) {
    exactObjectV01(check, ["check", "required", "status", "summary"], "check");
    stringV01(check.check);
    booleanV01(check.required);
    stringV01(check.status);
    stringV01(check.summary);
  }
  for (const skipped of value.latest_result.skipped_checks) {
    exactObjectV01(skipped, ["check", "reason", "required"], "skipped check");
    stringV01(skipped.check);
    booleanV01(skipped.required);
    stringV01(skipped.reason);
  }
  exactObjectV01(value.review_continuity, ["decision_kind", "state", "summary", "transition_currentness"], "review continuity");
  nullableStringV01(value.review_continuity.decision_kind);
  for (const key of ["state", "summary", "transition_currentness"]) stringV01(value.review_continuity[key]);
  exactObjectV01(value.next_action, ["executes", "kind", "label", "reason", "user_action_required"], "next action");
  for (const key of ["kind", "label", "reason"]) stringV01(value.next_action[key]);
  booleanV01(value.next_action.user_action_required);
  if (value.next_action.executes !== false) invalidContractV01();
  authorityV01(value.authority);
  stringArrayV01(value.gaps);
}

const AUTHORITY_KEYS = ["approves_host_action", "calls_github", "calls_provider", "cancels_or_resumes_run", "changes_operator_session", "changes_project_selection", "creates_branch_or_pr", "creates_or_admits_result", "creates_or_applies_transition", "creates_proof_or_evidence", "creates_proposal", "creates_review_decision", "creates_run", "merges_releases_or_deploys", "mutates_accepted_state", "retries_or_replays", "starts_background_work", "starts_codex_or_native_host", "writes_database", "writes_project_files"];

function authorityV01(value) {
  exactObjectV01(value, AUTHORITY_KEYS, "authority");
  for (const key of AUTHORITY_KEYS) if (value[key] !== false) invalidContractV01();
}

function exactObjectV01(value, keys, _label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) invalidContractV01();
  if (JSON.stringify(Object.keys(value).sort()) !== JSON.stringify([...keys].sort())) invalidContractV01();
}

function stringV01(value) { if (typeof value !== "string") invalidContractV01(); }
function nullableStringV01(value) { if (value !== null) stringV01(value); }
function booleanV01(value) { if (typeof value !== "boolean") invalidContractV01(); }
function nullableIntegerV01(value) { if (value !== null && (!Number.isSafeInteger(value) || value < 0)) invalidContractV01(); }
function stringArrayV01(value) { if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) invalidContractV01(); }
function isoTimestampV01(value) { stringV01(value); if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/u.test(value) || Number.isNaN(Date.parse(value))) invalidContractV01(); }
function invalidContractV01() { throw new Error("live_companion_route_contract_invalid"); }

function repositoryToolResultV01(companion, projection) {
  const structuredContent = {
    companion: { status: "live", mode: "http", binding: companion.binding },
    ...projection,
  };
  return {
    structuredContent,
    content: [{
      type: "text",
      text: `${projection.current_situation} Next: ${projection.next_meaningful_action.label}.`,
    }],
  };
}

function toolDescriptionV01() {
  return {
    name: TOOL_NAME,
    title: "Resume this repository with Augnes",
    description: "Resolve the current local repository through the live supervised Augnes Companion and return exact read-only project/work/run/result/review continuity.",
    inputSchema: {
      type: "object",
      additionalProperties: false,
      required: ["repositoryRoot"],
      properties: { repositoryRoot: { type: "string", minLength: 1 } },
    },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  };
}

function repositoryExecutionToolDescriptionsV01() {
  const mutationAnnotations = {
    readOnlyHint: false,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false,
  };
  const explicitIdentityDecisionAnnotations = {
    ...mutationAnnotations,
    destructiveHint: true,
  };
  return [
    {
      name: PREPARE_TOOL_NAME,
      title: "Prepare repository execution",
      description: "Prepare or return one exact project-scoped repository execution attachment through the verified live Augnes Companion. This does not start execution or create a managed run.",
      inputSchema: {
        type: "object", additionalProperties: false, required: ["repositoryRoot"],
        properties: { repositoryRoot: { type: "string", minLength: 1 } },
      },
      annotations: mutationAnnotations,
    },
    {
      name: ADOPT_TOOL_NAME,
      title: "Adopt a legacy repository root",
      description: "Explicitly record the currently observed folder as a legacy project's trusted execution root using exact expected-state fingerprints. This grants no execution authority.",
      inputSchema: {
        type: "object", additionalProperties: false,
        required: ["repositoryRoot", "expectedAdmissionFingerprint", "expectedObservationFingerprint", "userIntent"],
        properties: {
          repositoryRoot: { type: "string", minLength: 1 },
          expectedAdmissionFingerprint: { type: "string", minLength: 1 },
          expectedObservationFingerprint: { type: "string", minLength: 1 },
          userIntent: { type: "string", const: "adopt_current_root" },
        },
      },
      annotations: explicitIdentityDecisionAnnotations,
    },
    {
      name: VALIDATE_TOOL_NAME,
      title: "Validate repository execution attachment",
      description: "Revalidate one prepared attachment against current canonical project, root, work, managed-run, and bounded worktree state. This does not start execution.",
      inputSchema: {
        type: "object", additionalProperties: false, required: ["attachmentId"],
        properties: { attachmentId: { type: "string", minLength: 1 } },
      },
      annotations: mutationAnnotations,
    },
    {
      name: PREVIEW_REBIND_TOOL_NAME,
      title: "Preview repository root rebind",
      description: "Inspect an intended new root and return the exact expected-state material for one explicit rebind decision. This preview does not mutate the project.",
      inputSchema: {
        type: "object", additionalProperties: false,
        required: ["workspaceId", "projectId", "newRepositoryRoot"],
        properties: {
          workspaceId: { type: "string", minLength: 1 },
          projectId: { type: "string", minLength: 1 },
          newRepositoryRoot: { type: "string", minLength: 1 },
        },
      },
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    },
    {
      name: REBIND_TOOL_NAME,
      title: "Rebind a moved repository root",
      description: "Explicitly rebind one canonical project to an exactly observed new local root. Git remote equality alone is insufficient and this grants no execution authority.",
      inputSchema: {
        type: "object", additionalProperties: false,
        required: ["workspaceId", "projectId", "newRepositoryRoot", "expectedOldRootBindingFingerprint", "expectedOldBaselineFingerprint", "expectedNewObservationFingerprint", "userIntent"],
        properties: {
          workspaceId: { type: "string", minLength: 1 },
          projectId: { type: "string", minLength: 1 },
          newRepositoryRoot: { type: "string", minLength: 1 },
          expectedOldRootBindingFingerprint: { type: "string", minLength: 1 },
          expectedOldBaselineFingerprint: { anyOf: [{ type: "string", minLength: 1 }, { type: "null" }] },
          expectedNewObservationFingerprint: { type: "string", minLength: 1 },
          userIntent: { type: "string", const: "rebind_project_root" },
        },
      },
      annotations: explicitIdentityDecisionAnnotations,
    },
    {
      name: REVOKE_TOOL_NAME,
      title: "Revoke repository execution attachment",
      description: "Explicitly revoke one prepared repository execution attachment using its expected binding. This does not cancel or change any managed run.",
      inputSchema: {
        type: "object", additionalProperties: false,
        required: ["attachmentId", "expectedBindingFingerprint", "userIntent"],
        properties: {
          attachmentId: { type: "string", minLength: 1 },
          expectedBindingFingerprint: { type: "string", minLength: 1 },
          userIntent: { type: "string", const: "revoke_repository_execution_attachment" },
        },
      },
      annotations: explicitIdentityDecisionAnnotations,
    },
  ];
}

function unavailableToolResultV01(reason) {
  const structuredContent = {
    companion: { status: "unavailable", mode: "http", binding: null },
    repository_resolution: {
      status: "companion_unavailable",
      project_key: null,
      display_name: null,
      message: reason,
    },
    continuity: null,
    current_situation: "Exact repository continuity is unavailable because one verified live Augnes Companion could not be selected.",
    next_meaningful_action: { label: "Start or disambiguate the local Augnes Companion", reason, executes: false },
    browser_deep_link: null,
  };
  return {
    isError: true,
    structuredContent,
    content: [{ type: "text", text: structuredContent.current_situation }],
  };
}

async function handleMessageV01(message) {
  if (message.method === "initialize") {
    return { jsonrpc: "2.0", id: message.id, result: {
      protocolVersion: message.params?.protocolVersion ?? "2025-06-18",
      capabilities: { tools: { listChanged: false } },
      serverInfo: { name: "augnes-live-companion-proxy", version: "0.1.0" },
    } };
  }
  if (message.method === "notifications/initialized" || message.method === "notifications/cancelled") return null;
  if (message.method === "ping") return { jsonrpc: "2.0", id: message.id, result: {} };
  if (message.method === "tools/list") {
    return { jsonrpc: "2.0", id: message.id, result: { tools: [toolDescriptionV01(), ...repositoryExecutionToolDescriptionsV01()] } };
  }
  if (message.method === "tools/call") {
    const args = message.params?.arguments;
    const toolName = message.params?.name;
    if (!args || typeof args !== "object" || Array.isArray(args)) {
      return { jsonrpc: "2.0", id: message.id, error: { code: -32602, message: "invalid_repository_tool_request" } };
    }
    const discovery = await discoverVerifiedCompanionV01();
    if (discovery.status !== "resolved") {
      const reason = discovery.status === "companion_ambiguous"
        ? "Multiple verified live Augnes Companions were found; no runtime was selected."
        : "No verified live Augnes Companion was found.";
      return { jsonrpc: "2.0", id: message.id, result: unavailableToolResultV01(reason) };
    }
    try {
      if (toolName === TOOL_NAME && exactKeysV01(args, ["repositoryRoot"]) && typeof args.repositoryRoot === "string") {
        const projection = await readRepositoryContinuityV01(discovery.companion, args.repositoryRoot);
        return {
          jsonrpc: "2.0", id: message.id,
          result: repositoryToolResultV01(discovery.companion, projection),
        };
      }
      let body;
      if (toolName === PREPARE_TOOL_NAME && exactKeysV01(args, ["repositoryRoot"])) {
        body = { action: "prepare", repository_root: args.repositoryRoot };
      } else if (toolName === ADOPT_TOOL_NAME && exactKeysV01(args, ["repositoryRoot", "expectedAdmissionFingerprint", "expectedObservationFingerprint", "userIntent"])) {
        body = {
          action: "adopt_legacy_baseline",
          repository_root: args.repositoryRoot,
          expected_admission_fingerprint: args.expectedAdmissionFingerprint,
          expected_observation_fingerprint: args.expectedObservationFingerprint,
          user_intent: args.userIntent,
        };
      } else if (toolName === VALIDATE_TOOL_NAME && exactKeysV01(args, ["attachmentId"])) {
        body = { action: "validate", attachment_id: args.attachmentId };
      } else if (toolName === PREVIEW_REBIND_TOOL_NAME && exactKeysV01(args, ["workspaceId", "projectId", "newRepositoryRoot"])) {
        body = {
          action: "preview_rebind_root", workspace_id: args.workspaceId,
          project_id: args.projectId, new_repository_root: args.newRepositoryRoot,
        };
      } else if (toolName === REBIND_TOOL_NAME && exactKeysV01(args, ["workspaceId", "projectId", "newRepositoryRoot", "expectedOldRootBindingFingerprint", "expectedOldBaselineFingerprint", "expectedNewObservationFingerprint", "userIntent"])) {
        body = {
          action: "rebind_root", workspace_id: args.workspaceId, project_id: args.projectId,
          new_repository_root: args.newRepositoryRoot,
          expected_old_root_binding_fingerprint: args.expectedOldRootBindingFingerprint,
          expected_old_baseline_fingerprint: args.expectedOldBaselineFingerprint,
          expected_new_observation_fingerprint: args.expectedNewObservationFingerprint,
          user_intent: args.userIntent,
        };
      } else if (toolName === REVOKE_TOOL_NAME && exactKeysV01(args, ["attachmentId", "expectedBindingFingerprint", "userIntent"])) {
        body = {
          action: "revoke", attachment_id: args.attachmentId,
          expected_binding_fingerprint: args.expectedBindingFingerprint,
          user_intent: args.userIntent,
        };
      } else {
        return { jsonrpc: "2.0", id: message.id, error: { code: -32602, message: "invalid_repository_tool_request" } };
      }
      const projection = await callRepositoryExecutionV01(discovery.companion, body);
      const structuredContent = {
        companion: { status: "live", mode: "http", binding: discovery.companion.binding },
        ...projection,
      };
      return {
        jsonrpc: "2.0",
        id: message.id,
        result: {
          structuredContent,
          content: [{ type: "text", text: projection.ordinary_text ?? "Augnes updated the repository execution attachment metadata." }],
        },
      };
    } catch {
      return { jsonrpc: "2.0", id: message.id, result: unavailableToolResultV01("The verified Companion became unavailable before the continuity read completed.") };
    }
  }
  return { jsonrpc: "2.0", id: message.id ?? null, error: { code: -32601, message: "method_not_found" } };
}

function exactKeysV01(value, keys) {
  return JSON.stringify(Object.keys(value).sort()) === JSON.stringify([...keys].sort());
}

async function runStdioV01() {
  let buffered = "";
  process.stdin.setEncoding("utf8");
  for await (const chunk of process.stdin) {
    buffered += chunk;
    for (;;) {
      const newline = buffered.indexOf("\n");
      if (newline < 0) break;
      const line = buffered.slice(0, newline).trim();
      buffered = buffered.slice(newline + 1);
      if (!line) continue;
      let response;
      try {
        response = await handleMessageV01(JSON.parse(line));
      } catch {
        response = { jsonrpc: "2.0", id: null, error: { code: -32700, message: "parse_error" } };
      }
      if (response) process.stdout.write(`${JSON.stringify(response)}\n`);
    }
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runStdioV01().catch(() => { process.exitCode = 1; });
}
