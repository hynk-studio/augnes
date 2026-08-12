import {
  closeSync,
  existsSync,
  fsyncSync,
  lstatSync,
  mkdirSync,
  openSync,
  readFileSync,
  readdirSync,
  realpathSync,
  renameSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";

import {
  canonicalizeGovernedActorLabValueV01,
  createGovernedActorLabProductEffectLedgerV01,
  assertValidGovernedActorLabPilotResultV01,
} from "@/lib/vnext/governed-actor-lab";
import { createProtocolSha256V01 } from "@/lib/vnext/protocol-primitives";
import {
  GOVERNED_ACTOR_LAB_ROOT_V01,
  type GovernedActorLabPilotResultV01,
} from "@/types/vnext/governed-actor-lab";
import { validateGovernedActorLabLiveCohortResultV01 } from "@/lib/vnext/governed-actor-lab-live";
import type { GovernedActorLabLiveCohortResultV01 } from "@/types/vnext/governed-actor-lab-live";

const SAFE_SEGMENT_PATTERN = /^[A-Za-z0-9._-]{1,200}$/u;

export interface GovernedActorLabArtifactWriteSummaryV01 {
  lab_root: string;
  run_root: string;
  relative_run_root: string;
  artifact_count: number;
  artifact_index_fingerprint: string;
  product_effects: ReturnType<typeof createGovernedActorLabProductEffectLedgerV01>;
}

export interface GovernedActorLabLiveArtifactWriteSummaryV01 {
  lab_root: string;
  run_root: string;
  relative_run_root: string;
  artifact_count: number;
  artifact_index_fingerprint: string;
  report_fingerprint: string;
  cohort_fingerprint: string;
  product_database_writes: 0;
  core_writes: 0;
  tracked_repository_files_written: false;
}

export class GovernedActorLabArtifactStoreErrorV01 extends Error {
  constructor(readonly code: string) {
    super(code);
    this.name = "GovernedActorLabArtifactStoreErrorV01";
  }
}

export function resolveGovernedActorLabRootV01(repositoryRootInput: string): string {
  if (!path.isAbsolute(repositoryRootInput)) failV01("actor_lab_repository_root_must_be_absolute");
  const repositoryRoot = realpathSync(repositoryRootInput);
  const ignorePath = path.join(repositoryRoot, ".gitignore");
  if (!existsSync(ignorePath)) failV01("actor_lab_gitignore_missing");
  const ignoreText = readFileSync(ignorePath, "utf8");
  if (!ignoreText.split(/\r?\n/u).map((line) => line.trim()).includes(".augnes-lab/")) {
    failV01("actor_lab_root_not_ignored");
  }
  const root = path.join(repositoryRoot, ...GOVERNED_ACTOR_LAB_ROOT_V01.split("/"));
  ensureDirectoryChainWithoutSymlinksV01(repositoryRoot, root);
  const resolved = realpathSync(root);
  assertContainedV01(repositoryRoot, resolved, "actor_lab_root_escape");
  if (resolved !== root) failV01("actor_lab_root_physical_identity_mismatch");
  return resolved;
}

export function resolveGovernedActorLabArtifactPathV01(
  labRootInput: string,
  ...segments: string[]
): string {
  const labRoot = realpathSync(labRootInput);
  for (const segment of segments) {
    if (!SAFE_SEGMENT_PATTERN.test(segment) || segment === "." || segment === "..") {
      failV01("actor_lab_artifact_segment_invalid");
    }
  }
  const target = path.join(labRoot, ...segments);
  assertContainedV01(labRoot, target, "actor_lab_artifact_path_escape");
  assertExistingAncestorsNotSymlinksV01(labRoot, target);
  return target;
}

export function writeGovernedActorLabPilotArtifactsV01(input: {
  repository_root: string;
  run_label: string;
  result: GovernedActorLabPilotResultV01;
}): GovernedActorLabArtifactWriteSummaryV01 {
  assertValidGovernedActorLabPilotResultV01(input.result);
  if (!SAFE_SEGMENT_PATTERN.test(input.run_label) || input.run_label === "." || input.run_label === "..") {
    failV01("actor_lab_run_label_invalid");
  }
  const labRoot = resolveGovernedActorLabRootV01(input.repository_root);
  const experimentSegment = safeIdentifierSegmentV01(input.result.manifest.experiment_id);
  const experimentRoot = resolveGovernedActorLabArtifactPathV01(labRoot, experimentSegment);
  ensureDirectoryChainWithoutSymlinksV01(labRoot, experimentRoot);
  const runRoot = resolveGovernedActorLabArtifactPathV01(labRoot, experimentSegment, input.run_label);
  if (existsSync(runRoot)) {
    if (lstatSync(runRoot).isSymbolicLink()) failV01("actor_lab_run_root_symlink_refused");
    if (!lstatSync(runRoot).isDirectory()) failV01("actor_lab_run_root_not_directory");
    if (readdirSync(runRoot).length > 0) failV01("actor_lab_run_root_not_clean");
  } else {
    ensureDirectoryChainWithoutSymlinksV01(labRoot, runRoot);
  }

  const artifacts: Array<{ path: string; fingerprint: string }> = [];
  writeArtifactV01(runRoot, ["manifest.json"], input.result.manifest, artifacts);
  for (const generation of input.result.generations) {
    const generationSegment = `generation-${generation.generation}`;
    for (const actor of generation.actors_at_episode_start) {
      writeArtifactV01(
        runRoot,
        [generationSegment, "actors", `${safeIdentifierSegmentV01(actor.lab_actor_id)}.json`],
        actor,
        artifacts,
      );
    }
    for (const memory of generation.memories_at_episode_start) {
      writeArtifactV01(
        runRoot,
        [generationSegment, "memory-at-episode-start", `${safeIdentifierSegmentV01(memory.lab_actor_id)}.json`],
        memory,
        artifacts,
      );
    }
    for (const memory of generation.post_episode_memories) {
      writeArtifactV01(
        runRoot,
        [generationSegment, "post-episode-memory", `${safeIdentifierSegmentV01(memory.lab_actor_id)}.json`],
        memory,
        artifacts,
      );
    }
  }
  for (const episode of input.result.episodes) {
    writeArtifactV01(
      runRoot,
      ["episodes", `generation-${episode.generation}.json`],
      episode,
      artifacts,
    );
  }
  for (const transition of input.result.transitions) {
    writeArtifactV01(
      runRoot,
      ["transitions", `generation-${transition.from_generation}-to-${transition.to_generation}.json`],
      transition,
      artifacts,
    );
  }
  writeArtifactV01(runRoot, ["report.json"], input.result.report, artifacts);
  writeArtifactV01(
    runRoot,
    ["product-zero-effect-ledger.json"],
    createGovernedActorLabProductEffectLedgerV01(),
    artifacts,
  );
  const index = {
    index_version: "governed_actor_lab_artifact_index.v0.1",
    experiment_id: input.result.manifest.experiment_id,
    run_label: input.run_label,
    artifacts: [...artifacts].sort((left, right) => left.path.localeCompare(right.path, "en")),
    absolute_paths_persisted: false,
    tracked_repository_files_written: false,
    writes_outside_lab_root: false,
    product_effects: createGovernedActorLabProductEffectLedgerV01(),
  };
  const indexText = canonicalizeGovernedActorLabValueV01(index);
  const indexFingerprint = createProtocolSha256V01(indexText);
  atomicWriteV01(runRoot, ["artifact-index.json"], indexText);
  return {
    lab_root: labRoot,
    run_root: runRoot,
    relative_run_root: path.relative(realpathSync(input.repository_root), runRoot),
    artifact_count: artifacts.length + 1,
    artifact_index_fingerprint: indexFingerprint,
    product_effects: createGovernedActorLabProductEffectLedgerV01(),
  };
}

export function prepareGovernedActorLabLiveArtifactRunV01(input: {
  repository_root: string;
  cohort_id: string;
  run_label: string;
}): { lab_root: string; run_root: string; relative_run_root: string } {
  if (
    !SAFE_SEGMENT_PATTERN.test(input.run_label) ||
    input.run_label === "." ||
    input.run_label === ".."
  ) failV01("actor_lab_run_label_invalid");
  const labRoot = resolveGovernedActorLabRootV01(input.repository_root);
  const liveRoot = resolveGovernedActorLabArtifactPathV01(labRoot, "live-cohorts");
  ensureDirectoryChainWithoutSymlinksV01(labRoot, liveRoot);
  const cohortRoot = resolveGovernedActorLabArtifactPathV01(
    labRoot,
    "live-cohorts",
    safeIdentifierSegmentV01(input.cohort_id),
  );
  ensureDirectoryChainWithoutSymlinksV01(labRoot, cohortRoot);
  const runRoot = resolveGovernedActorLabArtifactPathV01(
    labRoot,
    "live-cohorts",
    safeIdentifierSegmentV01(input.cohort_id),
    input.run_label,
  );
  if (existsSync(runRoot)) {
    if (lstatSync(runRoot).isSymbolicLink()) failV01("actor_lab_run_root_symlink_refused");
    if (!lstatSync(runRoot).isDirectory()) failV01("actor_lab_run_root_not_directory");
    if (readdirSync(runRoot).length > 0) failV01("actor_lab_run_root_not_clean");
  } else {
    ensureDirectoryChainWithoutSymlinksV01(labRoot, runRoot);
  }
  return {
    lab_root: labRoot,
    run_root: runRoot,
    relative_run_root: path.relative(realpathSync(input.repository_root), runRoot),
  };
}

export function beginGovernedActorLabLiveCohortAttemptV01(input: {
  repository_root: string;
  run_label: string;
  result_identity: Pick<GovernedActorLabLiveCohortResultV01, "manifest" | "call_plan">;
}): { lab_root: string; run_root: string; relative_run_root: string; attempt_fingerprint: string } {
  const prepared = prepareGovernedActorLabLiveArtifactRunV01({
    repository_root: input.repository_root,
    cohort_id: input.result_identity.manifest.cohort_id,
    run_label: input.run_label,
  });
  const attempt = {
    attempt_version: "governed_actor_lab_live_cohort_attempt.v0.1",
    cohort_id: input.result_identity.manifest.cohort_id,
    cohort_fingerprint: input.result_identity.manifest.integrity.fingerprint,
    source_repository_head_sha:
      input.result_identity.manifest.source_repository_head_sha,
    call_plan_fingerprint: input.result_identity.call_plan.integrity.fingerprint,
    authorized_cohort_count: 1,
    attempt_status: "started",
    holdout_content_included: false,
    retry_or_second_cohort_authorized: false,
  };
  const text = canonicalizeGovernedActorLabValueV01(attempt);
  atomicWriteV01(prepared.run_root, ["cohort-attempt.json"], text);
  return {
    ...prepared,
    attempt_fingerprint: createProtocolSha256V01(text),
  };
}

export function writeGovernedActorLabLiveCohortArtifactsV01(input: {
  repository_root: string;
  run_label: string;
  result: GovernedActorLabLiveCohortResultV01;
}): GovernedActorLabLiveArtifactWriteSummaryV01 {
  const result = validateGovernedActorLabLiveCohortResultV01(input.result);
  let prepared: { lab_root: string; run_root: string; relative_run_root: string };
  let existingAttempt: { path: string; fingerprint: string } | null = null;
  try {
    prepared = prepareGovernedActorLabLiveArtifactRunV01({
      repository_root: input.repository_root,
      cohort_id: result.manifest.cohort_id,
      run_label: input.run_label,
    });
  } catch (error) {
    if (
      !(error instanceof GovernedActorLabArtifactStoreErrorV01) ||
      error.code !== "actor_lab_run_root_not_clean"
    ) throw error;
    prepared = resolveGovernedActorLabLiveRunV01({
      repository_root: input.repository_root,
      cohort_id: result.manifest.cohort_id,
      run_label: input.run_label,
    });
    const entries = readdirSync(prepared.run_root);
    if (entries.length !== 1 || entries[0] !== "cohort-attempt.json") {
      failV01("actor_lab_run_root_not_clean");
    }
    const attemptText = readFileSync(
      path.join(prepared.run_root, "cohort-attempt.json"),
      "utf8",
    ).trimEnd();
    const attempt = JSON.parse(attemptText) as Record<string, unknown>;
    if (
      attempt.cohort_id !== result.manifest.cohort_id ||
      attempt.cohort_fingerprint !== result.manifest.integrity.fingerprint ||
      attempt.source_repository_head_sha !==
        result.manifest.source_repository_head_sha ||
      attempt.call_plan_fingerprint !== result.call_plan.integrity.fingerprint ||
      attempt.authorized_cohort_count !== 1 ||
      attempt.attempt_status !== "started" ||
      attempt.holdout_content_included !== false ||
      attempt.retry_or_second_cohort_authorized !== false
    ) failV01("actor_lab_live_attempt_binding_invalid");
    existingAttempt = {
      path: "cohort-attempt.json",
      fingerprint: createProtocolSha256V01(attemptText),
    };
  }
  const artifacts: Array<{ path: string; fingerprint: string }> = [];
  if (existingAttempt) artifacts.push(existingAttempt);
  writeArtifactV01(prepared.run_root, ["cohort-manifest.json"], result.manifest, artifacts);
  writeArtifactV01(prepared.run_root, ["call-plan.json"], result.call_plan, artifacts);
  for (const binding of result.invocation_bindings) {
    writeArtifactV01(
      prepared.run_root,
      ["invocations", `${String(binding.call_order).padStart(3, "0")}.json`],
      binding,
      artifacts,
    );
  }
  writeArtifactV01(prepared.run_root, ["live-report.json"], result.report, artifacts);
  const effectLedger = {
    ledger_version: "governed_actor_lab_live_effect_ledger.v0.1",
    cohort_id: result.manifest.cohort_id,
    bounded_provider_egress_attempts:
      result.report.accounting.attempted_provider_calls,
    provider_egress_owner: "existing_model_gateway",
    product_database_writes: 0,
    core_writes: 0,
    task_context_writes: 0,
    proposal_writes: 0,
    review_decision_writes: 0,
    transition_writes: 0,
    policy_activations: 0,
    personal_perspective_mutations: 0,
    git_or_github_runtime_mutations: 0,
    any_other_external_effects: 0,
  };
  writeArtifactV01(
    prepared.run_root,
    ["bounded-effect-ledger.json"],
    effectLedger,
    artifacts,
  );
  const index = {
    index_version: "governed_actor_lab_live_artifact_index.v0.1",
    cohort_id: result.manifest.cohort_id,
    cohort_fingerprint: result.manifest.integrity.fingerprint,
    source_repository_head_sha: result.manifest.source_repository_head_sha,
    run_label: input.run_label,
    artifacts: [...artifacts].sort((left, right) => left.path.localeCompare(right.path, "en")),
    raw_provider_request_persisted: false,
    raw_http_response_persisted: false,
    raw_provider_response_persisted: false,
    hidden_reasoning_persisted: false,
    credential_or_authorization_material_persisted: false,
    absolute_paths_persisted: false,
    tracked_repository_files_written: false,
    writes_outside_lab_root: false,
    product_database_writes: 0,
    core_writes: 0,
  };
  const indexText = canonicalizeGovernedActorLabValueV01(index);
  const indexFingerprint = createProtocolSha256V01(indexText);
  atomicWriteV01(prepared.run_root, ["artifact-index.json"], indexText);
  return {
    ...prepared,
    artifact_count: artifacts.length + 1,
    artifact_index_fingerprint: indexFingerprint,
    report_fingerprint: result.report.integrity.fingerprint,
    cohort_fingerprint: result.manifest.integrity.fingerprint,
    product_database_writes: 0,
    core_writes: 0,
    tracked_repository_files_written: false,
  };
}

function resolveGovernedActorLabLiveRunV01(input: {
  repository_root: string;
  cohort_id: string;
  run_label: string;
}) {
  const labRoot = resolveGovernedActorLabRootV01(input.repository_root);
  const runRoot = resolveGovernedActorLabArtifactPathV01(
    labRoot,
    "live-cohorts",
    safeIdentifierSegmentV01(input.cohort_id),
    input.run_label,
  );
  if (!existsSync(runRoot) || !lstatSync(runRoot).isDirectory()) {
    failV01("actor_lab_run_root_not_directory");
  }
  if (lstatSync(runRoot).isSymbolicLink()) failV01("actor_lab_run_root_symlink_refused");
  return {
    lab_root: labRoot,
    run_root: runRoot,
    relative_run_root: path.relative(realpathSync(input.repository_root), runRoot),
  };
}

function writeArtifactV01(
  runRoot: string,
  segments: string[],
  value: unknown,
  artifacts: Array<{ path: string; fingerprint: string }>,
): void {
  const text = canonicalizeGovernedActorLabValueV01(value);
  atomicWriteV01(runRoot, segments, text);
  artifacts.push({
    path: segments.join("/"),
    fingerprint: createProtocolSha256V01(text),
  });
}

function atomicWriteV01(runRoot: string, segments: string[], text: string): void {
  const target = resolveGovernedActorLabArtifactPathV01(runRoot, ...segments);
  ensureDirectoryChainWithoutSymlinksV01(runRoot, path.dirname(target));
  assertContainedV01(runRoot, target, "actor_lab_write_escape");
  if (existsSync(target)) failV01("actor_lab_artifact_overwrite_refused");
  const temporary = `${target}.tmp`;
  if (existsSync(temporary)) failV01("actor_lab_stale_temporary_artifact");
  const descriptor = openSync(temporary, "wx", 0o600);
  try {
    writeFileSync(descriptor, `${text}\n`, { encoding: "utf8" });
    fsyncSync(descriptor);
  } finally {
    closeSync(descriptor);
  }
  renameSync(temporary, target);
}

function ensureDirectoryChainWithoutSymlinksV01(baseInput: string, targetInput: string): void {
  const base = realpathSync(baseInput);
  assertContainedV01(base, targetInput, "actor_lab_directory_escape");
  const relative = path.relative(base, targetInput);
  let current = base;
  for (const segment of relative.split(path.sep).filter(Boolean)) {
    if (!SAFE_SEGMENT_PATTERN.test(segment)) failV01("actor_lab_directory_segment_invalid");
    current = path.join(current, segment);
    if (existsSync(current)) {
      const stat = lstatSync(current);
      if (stat.isSymbolicLink()) failV01("actor_lab_symlink_escape_refused");
      if (!stat.isDirectory()) failV01("actor_lab_directory_component_not_directory");
    } else {
      mkdirSync(current, { mode: 0o700 });
    }
  }
}

function assertExistingAncestorsNotSymlinksV01(baseInput: string, targetInput: string): void {
  const base = realpathSync(baseInput);
  assertContainedV01(base, targetInput, "actor_lab_artifact_path_escape");
  const relative = path.relative(base, targetInput);
  let current = base;
  for (const segment of relative.split(path.sep).filter(Boolean)) {
    current = path.join(current, segment);
    if (!existsSync(current)) break;
    if (lstatSync(current).isSymbolicLink()) failV01("actor_lab_symlink_escape_refused");
  }
}

function assertContainedV01(baseInput: string, targetInput: string, code: string): void {
  const relative = path.relative(baseInput, targetInput);
  if (relative === "" || (!relative.startsWith(`..${path.sep}`) && relative !== ".." && !path.isAbsolute(relative))) return;
  failV01(code);
}

function safeIdentifierSegmentV01(value: string): string {
  const segment = value.replaceAll(":", "_");
  if (!SAFE_SEGMENT_PATTERN.test(segment)) failV01("actor_lab_identifier_segment_invalid");
  return segment;
}

function failV01(code: string): never {
  throw new GovernedActorLabArtifactStoreErrorV01(code);
}
