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
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

import {
  RealWorkContinuityBenefitPilotErrorV01,
  assertRealWorkPilotEpisodeFreezeV01,
  assertRealWorkPilotImmediateObservationV01,
  assertRealWorkPilotLaterOutcomeReviewV01,
  formatRealWorkContinuityBenefitPilotMarkdownV01,
} from "@/lib/vnext/real-work-continuity-benefit-pilot";
import type {
  RealWorkContinuityBenefitPilotReportV01,
  RealWorkPilotEpisodeFreezeV01,
  RealWorkPilotImmediateObservationV01,
  RealWorkPilotLaterOutcomeReviewV01,
} from "@/types/vnext/real-work-continuity-benefit-pilot";

export const REAL_WORK_PILOT_ARTIFACT_NAMESPACE_V01 =
  ".augnes-lab/real-work-continuity-benefit-pilot" as const;

const PILOT_ID = /^rw1-pilot_[a-f0-9]{32}$/u;
const EPISODE_ID = /^rw1-episode_[a-f0-9]{32}$/u;
const REPORT_FILE = /^report_[a-f0-9]{32}\.(?:json|md)$/u;
const MAX_EPISODES = 12;
const MAX_FREEZE_BYTES = 64 * 1_024;
const MAX_OBSERVATION_BYTES = 128 * 1_024;
const MAX_REVIEW_BYTES = 96 * 1_024;
const MAX_REPORT_BYTES = 2 * 1_024 * 1_024;

export interface RealWorkPilotArtifactSetV01 {
  freezes: RealWorkPilotEpisodeFreezeV01[];
  observations: RealWorkPilotImmediateObservationV01[];
  reviews: RealWorkPilotLaterOutcomeReviewV01[];
}

export function writeRealWorkPilotEpisodeFreezeV01(
  repositoryRoot: string,
  freeze: RealWorkPilotEpisodeFreezeV01,
): string {
  assertRealWorkPilotEpisodeFreezeV01(freeze);
  const root = ensurePilotRootV01(repositoryRoot, freeze.pilot_id);
  assertFreezeSlotAvailableV01(root, freeze);
  const episodeRoot = ensureDirectoryV01(root, ["episodes", freeze.episode_id]);
  const target = path.join(episodeRoot, "freeze.json");
  writeExclusiveJsonV01(target, freeze, MAX_FREEZE_BYTES);
  return repositoryRelativePathV01(repositoryRoot, target);
}

export function writeRealWorkPilotImmediateObservationV01(
  repositoryRoot: string,
  freeze: RealWorkPilotEpisodeFreezeV01,
  observation: RealWorkPilotImmediateObservationV01,
): string {
  assertRealWorkPilotEpisodeFreezeV01(freeze);
  assertRealWorkPilotImmediateObservationV01(freeze, observation);
  const episodeRoot = existingEpisodeRootV01(
    repositoryRoot,
    freeze.pilot_id,
    freeze.episode_id,
  );
  const persistedFreeze = readJsonV01(
    path.join(episodeRoot, "freeze.json"),
    MAX_FREEZE_BYTES,
  );
  assertRealWorkPilotEpisodeFreezeV01(persistedFreeze);
  if (persistedFreeze.integrity.fingerprint !== freeze.integrity.fingerprint) {
    refuse("real_work_pilot_persisted_freeze_mismatch");
  }
  const target = path.join(episodeRoot, "immediate-observation.json");
  writeExclusiveJsonV01(target, observation, MAX_OBSERVATION_BYTES);
  return repositoryRelativePathV01(repositoryRoot, target);
}

export function writeRealWorkPilotLaterOutcomeReviewV01(
  repositoryRoot: string,
  freeze: RealWorkPilotEpisodeFreezeV01,
  observation: RealWorkPilotImmediateObservationV01,
  review: RealWorkPilotLaterOutcomeReviewV01,
): string {
  assertRealWorkPilotEpisodeFreezeV01(freeze);
  assertRealWorkPilotImmediateObservationV01(freeze, observation);
  assertRealWorkPilotLaterOutcomeReviewV01(freeze, observation, review);
  const episodeRoot = existingEpisodeRootV01(
    repositoryRoot,
    freeze.pilot_id,
    freeze.episode_id,
  );
  const persistedObservation = readJsonV01(
    path.join(episodeRoot, "immediate-observation.json"),
    MAX_OBSERVATION_BYTES,
  );
  assertRealWorkPilotImmediateObservationV01(freeze, persistedObservation);
  if (
    persistedObservation.integrity.fingerprint !==
    observation.integrity.fingerprint
  ) {
    refuse("real_work_pilot_persisted_observation_mismatch");
  }
  const target = path.join(episodeRoot, "later-outcome-review.json");
  writeExclusiveJsonV01(target, review, MAX_REVIEW_BYTES);
  return repositoryRelativePathV01(repositoryRoot, target);
}

export function readRealWorkPilotEpisodeArtifactsV01(
  repositoryRoot: string,
  pilotId: string,
  episodeId: string,
): {
  freeze: RealWorkPilotEpisodeFreezeV01;
  observation: RealWorkPilotImmediateObservationV01 | null;
  review: RealWorkPilotLaterOutcomeReviewV01 | null;
} {
  const episodeRoot = existingEpisodeRootV01(
    repositoryRoot,
    pilotId,
    episodeId,
  );
  assertExpectedEpisodeFilesV01(episodeRoot);
  const freezeValue = readJsonV01(
    path.join(episodeRoot, "freeze.json"),
    MAX_FREEZE_BYTES,
  );
  assertRealWorkPilotEpisodeFreezeV01(freezeValue);
  const observationPath = path.join(episodeRoot, "immediate-observation.json");
  const reviewPath = path.join(episodeRoot, "later-outcome-review.json");
  let observation: RealWorkPilotImmediateObservationV01 | null = null;
  let review: RealWorkPilotLaterOutcomeReviewV01 | null = null;
  if (existsSync(observationPath)) {
    const value = readJsonV01(observationPath, MAX_OBSERVATION_BYTES);
    assertRealWorkPilotImmediateObservationV01(freezeValue, value);
    observation = value;
  }
  if (existsSync(reviewPath)) {
    if (!observation) refuse("real_work_pilot_review_without_observation_file");
    const value = readJsonV01(reviewPath, MAX_REVIEW_BYTES);
    assertRealWorkPilotLaterOutcomeReviewV01(
      freezeValue,
      observation,
      value,
    );
    review = value;
  }
  return { freeze: freezeValue, observation, review };
}

export function readRealWorkPilotArtifactsV01(
  repositoryRoot: string,
  pilotId: string,
): RealWorkPilotArtifactSetV01 {
  const pilotRoot = existingPilotRootV01(repositoryRoot, pilotId);
  const episodesRoot = path.join(pilotRoot, "episodes");
  if (!existsSync(episodesRoot)) {
    return { freezes: [], observations: [], reviews: [] };
  }
  assertDirectoryNoSymlinkV01(episodesRoot);
  const episodeIds = readdirSync(episodesRoot, { withFileTypes: true })
    .map((entry) => {
      if (!entry.isDirectory() || entry.isSymbolicLink() || !EPISODE_ID.test(entry.name)) {
        refuse("real_work_pilot_unexpected_episode_artifact");
      }
      return entry.name;
    })
    .sort();
  if (episodeIds.length > MAX_EPISODES) {
    refuse("real_work_pilot_episode_artifact_limit_exceeded");
  }
  const result: RealWorkPilotArtifactSetV01 = {
    freezes: [],
    observations: [],
    reviews: [],
  };
  for (const episodeId of episodeIds) {
    const episode = readRealWorkPilotEpisodeArtifactsV01(
      repositoryRoot,
      pilotId,
      episodeId,
    );
    result.freezes.push(episode.freeze);
    if (episode.observation) result.observations.push(episode.observation);
    if (episode.review) result.reviews.push(episode.review);
  }
  return result;
}

export function writeRealWorkPilotReportArtifactsV01(
  repositoryRoot: string,
  report: RealWorkContinuityBenefitPilotReportV01,
): { json_path: string; markdown_path: string } {
  if (!PILOT_ID.test(report.pilot_id)) {
    refuse("real_work_pilot_report_pilot_id_invalid");
  }
  const pilotRoot = existingPilotRootV01(repositoryRoot, report.pilot_id);
  const reportsRoot = ensureDirectoryV01(pilotRoot, ["reports"]);
  const suffix = report.integrity.fingerprint.slice("sha256:".length, 39);
  const jsonTarget = path.join(reportsRoot, `report_${suffix}.json`);
  const markdownTarget = path.join(reportsRoot, `report_${suffix}.md`);
  writeExclusiveOrVerifyV01(
    jsonTarget,
    `${JSON.stringify(report, null, 2)}\n`,
    MAX_REPORT_BYTES,
  );
  writeExclusiveOrVerifyV01(
    markdownTarget,
    formatRealWorkContinuityBenefitPilotMarkdownV01(report),
    MAX_REPORT_BYTES,
  );
  assertExpectedReportFilesV01(reportsRoot);
  return {
    json_path: repositoryRelativePathV01(repositoryRoot, jsonTarget),
    markdown_path: repositoryRelativePathV01(repositoryRoot, markdownTarget),
  };
}

function ensurePilotRootV01(repositoryRoot: string, pilotId: string): string {
  if (!PILOT_ID.test(pilotId)) refuse("real_work_pilot_id_invalid");
  const root = validateRepositoryRootV01(repositoryRoot);
  const pilotRoot = ensureDirectoryV01(root, [
    ".augnes-lab",
    "real-work-continuity-benefit-pilot",
    pilotId,
  ]);
  ensureDirectoryV01(pilotRoot, ["episodes"]);
  return pilotRoot;
}

function assertFreezeSlotAvailableV01(
  pilotRoot: string,
  freeze: RealWorkPilotEpisodeFreezeV01,
): void {
  const episodesRoot = path.join(pilotRoot, "episodes");
  const entries = readdirSync(episodesRoot, { withFileTypes: true });
  if (entries.length >= MAX_EPISODES) {
    refuse("real_work_pilot_episode_artifact_limit_exceeded");
  }
  for (const entry of entries) {
    if (
      !entry.isDirectory() ||
      entry.isSymbolicLink() ||
      !EPISODE_ID.test(entry.name)
    ) {
      refuse("real_work_pilot_unexpected_episode_artifact");
    }
    const freezePath = path.join(episodesRoot, entry.name, "freeze.json");
    if (!existsSync(freezePath)) {
      refuse("real_work_pilot_incomplete_freeze_artifact");
    }
    const existing = readJsonV01(freezePath, MAX_FREEZE_BYTES);
    assertRealWorkPilotEpisodeFreezeV01(existing);
    if (
      existing.task_family === freeze.task_family &&
      existing.family_episode_index === freeze.family_episode_index
    ) {
      refuse("real_work_pilot_family_schedule_slot_already_frozen");
    }
  }
}

function existingPilotRootV01(repositoryRoot: string, pilotId: string): string {
  if (!PILOT_ID.test(pilotId)) refuse("real_work_pilot_id_invalid");
  const root = validateRepositoryRootV01(repositoryRoot);
  const pilotRoot = path.join(
    root,
    ".augnes-lab",
    "real-work-continuity-benefit-pilot",
    pilotId,
  );
  assertDirectoryNoSymlinkV01(pilotRoot);
  assertInsideRootV01(root, realpathSync(pilotRoot));
  return pilotRoot;
}

function existingEpisodeRootV01(
  repositoryRoot: string,
  pilotId: string,
  episodeId: string,
): string {
  if (!EPISODE_ID.test(episodeId)) refuse("real_work_pilot_episode_id_invalid");
  const pilotRoot = existingPilotRootV01(repositoryRoot, pilotId);
  const episodeRoot = path.join(pilotRoot, "episodes", episodeId);
  assertDirectoryNoSymlinkV01(episodeRoot);
  assertInsideRootV01(realpathSync(repositoryRoot), realpathSync(episodeRoot));
  return episodeRoot;
}

function validateRepositoryRootV01(repositoryRoot: string): string {
  if (!path.isAbsolute(repositoryRoot)) {
    refuse("real_work_pilot_repository_root_must_be_absolute");
  }
  const root = realpathSync(repositoryRoot);
  let gitRoot: string;
  try {
    gitRoot = execFileSync(
      "git",
      ["-C", root, "rev-parse", "--show-toplevel"],
      { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] },
    ).trim();
  } catch {
    refuse("real_work_pilot_repository_root_not_git");
  }
  if (realpathSync(gitRoot) !== root) {
    refuse("real_work_pilot_repository_root_not_toplevel");
  }
  const ignorePath = path.join(root, ".gitignore");
  if (!existsSync(ignorePath)) refuse("real_work_pilot_gitignore_missing");
  const ignored = readFileSync(ignorePath, "utf8")
    .split(/\r?\n/u)
    .map((line) => line.trim())
    .includes(".augnes-lab/");
  if (!ignored) refuse("real_work_pilot_artifact_namespace_not_ignored");
  return root;
}

function ensureDirectoryV01(root: string, components: readonly string[]): string {
  let current = root;
  for (const component of components) {
    if (!component || component === "." || component === ".." || component.includes(path.sep)) {
      refuse("real_work_pilot_artifact_path_component_invalid");
    }
    current = path.join(current, component);
    if (existsSync(current)) {
      assertDirectoryNoSymlinkV01(current);
    } else {
      mkdirSync(current, { mode: 0o700 });
    }
  }
  assertInsideRootV01(realpathSync(root), realpathSync(current));
  return current;
}

function assertDirectoryNoSymlinkV01(target: string): void {
  if (!existsSync(target)) refuse("real_work_pilot_artifact_directory_missing");
  const stat = lstatSync(target);
  if (stat.isSymbolicLink() || !stat.isDirectory()) {
    refuse("real_work_pilot_artifact_directory_unsafe");
  }
}

function assertInsideRootV01(root: string, target: string): void {
  const relative = path.relative(root, target);
  if (!relative || relative === ".") return;
  if (relative.startsWith(`..${path.sep}`) || relative === ".." || path.isAbsolute(relative)) {
    refuse("real_work_pilot_artifact_path_escape");
  }
}

function writeExclusiveJsonV01(
  target: string,
  value: unknown,
  maximumBytes: number,
): void {
  writeExclusiveV01(target, `${JSON.stringify(value, null, 2)}\n`, maximumBytes);
}

function writeExclusiveV01(
  target: string,
  text: string,
  maximumBytes: number,
): void {
  if (Buffer.byteLength(text, "utf8") > maximumBytes) {
    refuse("real_work_pilot_artifact_size_bound_exceeded");
  }
  let descriptor: number;
  try {
    descriptor = openSync(target, "wx", 0o600);
  } catch (error) {
    if (isAlreadyExistsErrorV01(error)) {
      refuse("real_work_pilot_append_only_artifact_exists");
    }
    throw error;
  }
  try {
    writeFileSync(descriptor, text, { encoding: "utf8" });
    fsyncSync(descriptor);
  } finally {
    closeSync(descriptor);
  }
}

function writeExclusiveOrVerifyV01(
  target: string,
  text: string,
  maximumBytes: number,
): void {
  if (existsSync(target)) {
    if (readBoundedTextV01(target, maximumBytes) !== text) {
      refuse("real_work_pilot_report_artifact_conflict");
    }
    return;
  }
  writeExclusiveV01(target, text, maximumBytes);
}

function readJsonV01(target: string, maximumBytes: number): unknown {
  const text = readBoundedTextV01(target, maximumBytes);
  try {
    return JSON.parse(text) as unknown;
  } catch {
    refuse("real_work_pilot_artifact_json_invalid");
  }
}

function readBoundedTextV01(target: string, maximumBytes: number): string {
  const stat = lstatSync(target);
  if (stat.isSymbolicLink() || !stat.isFile() || stat.size > maximumBytes) {
    refuse("real_work_pilot_artifact_file_unsafe_or_oversized");
  }
  return readFileSync(target, "utf8");
}

function assertExpectedEpisodeFilesV01(episodeRoot: string): void {
  const allowed = new Set([
    "freeze.json",
    "immediate-observation.json",
    "later-outcome-review.json",
  ]);
  const entries = readdirSync(episodeRoot, { withFileTypes: true });
  if (
    !entries.some((entry) => entry.name === "freeze.json") ||
    entries.some(
      (entry) =>
        !allowed.has(entry.name) ||
        !entry.isFile() ||
        entry.isSymbolicLink(),
    )
  ) {
    refuse("real_work_pilot_episode_artifact_set_invalid");
  }
}

function assertExpectedReportFilesV01(reportsRoot: string): void {
  const entries = readdirSync(reportsRoot, { withFileTypes: true });
  if (
    entries.some(
      (entry) =>
        !entry.isFile() ||
        entry.isSymbolicLink() ||
        !REPORT_FILE.test(entry.name),
    )
  ) {
    refuse("real_work_pilot_report_artifact_set_invalid");
  }
}

function repositoryRelativePathV01(repositoryRoot: string, target: string): string {
  const root = realpathSync(repositoryRoot);
  const relative = path.relative(root, target).split(path.sep).join("/");
  if (!relative.startsWith(`${REAL_WORK_PILOT_ARTIFACT_NAMESPACE_V01}/`)) {
    refuse("real_work_pilot_artifact_relative_path_invalid");
  }
  return relative;
}

function isAlreadyExistsErrorV01(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === "EEXIST";
}

function refuse(code: string): never {
  throw new RealWorkContinuityBenefitPilotErrorV01(code);
}
