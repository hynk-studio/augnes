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

const SAFE_SEGMENT_PATTERN = /^[A-Za-z0-9._-]{1,200}$/u;

export interface GovernedActorLabArtifactWriteSummaryV01 {
  lab_root: string;
  run_root: string;
  relative_run_root: string;
  artifact_count: number;
  artifact_index_fingerprint: string;
  product_effects: ReturnType<typeof createGovernedActorLabProductEffectLedgerV01>;
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
