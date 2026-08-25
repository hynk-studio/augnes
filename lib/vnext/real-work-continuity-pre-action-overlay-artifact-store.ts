import { execFileSync } from "node:child_process";
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

import {
  RealWorkContinuityPreActionOverlayErrorV01,
  assertRealWorkContinuityPreActionOverlayV01,
  formatRealWorkContinuityPreActionOverlayMarkdownV01,
} from "@/lib/vnext/real-work-continuity-pre-action-overlay";
import {
  readRealWorkPilotArtifactsV01,
  readRealWorkPilotEpisodeArtifactsV01,
} from "@/lib/vnext/real-work-continuity-benefit-pilot-artifact-store";
import type { RealWorkPilotEpisodeFreezeV01 } from "@/types/vnext/real-work-continuity-benefit-pilot";
import type {
  RealWorkContinuityPreActionOverlayReportV01,
  RealWorkContinuityPreActionOverlayV01,
} from "@/types/vnext/real-work-continuity-pre-action-overlay";

export const REAL_WORK_PRE_ACTION_OVERLAY_ARTIFACT_NAMESPACE_V01 =
  ".augnes-lab/real-work-continuity-pre-action-overlay" as const;

const PILOT_ID = /^rw1-pilot_[a-f0-9]{32}$/u;
const EPISODE_ID = /^rw1-episode_[a-f0-9]{32}$/u;
const REPORT_FILE = /^overlay-report_[a-f0-9]{32}\.(?:json|md)$/u;
const MAX_EPISODES = 12;
const MAX_OVERLAY_BYTES = 96 * 1_024;
const MAX_REPORT_BYTES = 2 * 1_024 * 1_024;

export function writeRealWorkContinuityPreActionOverlayV01(
  repositoryRoot: string,
  freeze: RealWorkPilotEpisodeFreezeV01,
  overlay: RealWorkContinuityPreActionOverlayV01,
): string {
  const persisted = readRealWorkPilotEpisodeArtifactsV01(
    repositoryRoot,
    freeze.pilot_id,
    freeze.episode_id,
  );
  if (
    persisted.freeze.integrity.fingerprint !== freeze.integrity.fingerprint
  ) {
    refuse("real_work_pre_action_overlay_persisted_freeze_mismatch");
  }
  assertRealWorkContinuityPreActionOverlayV01(persisted.freeze, overlay);
  if (persisted.observation || persisted.review) {
    refuse("real_work_pre_action_overlay_core_later_artifact_exists");
  }
  const root = ensureOverlayPilotRootV01(repositoryRoot, freeze.pilot_id);
  const episodeRoot = ensureDirectoryV01(root, [
    "episodes",
    freeze.episode_id,
  ]);
  const target = path.join(episodeRoot, "pre-action-overlay.json");
  writeExclusiveV01(
    target,
    `${JSON.stringify(overlay, null, 2)}\n`,
    MAX_OVERLAY_BYTES,
  );
  return repositoryRelativePathV01(repositoryRoot, target);
}

export function readRealWorkContinuityPreActionOverlayV01(
  repositoryRoot: string,
  pilotId: string,
  episodeId: string,
): RealWorkContinuityPreActionOverlayV01 {
  if (!PILOT_ID.test(pilotId)) refuse("real_work_pre_action_overlay_pilot_id_invalid");
  if (!EPISODE_ID.test(episodeId)) {
    refuse("real_work_pre_action_overlay_episode_id_invalid");
  }
  const core = readRealWorkPilotEpisodeArtifactsV01(
    repositoryRoot,
    pilotId,
    episodeId,
  );
  const root = existingOverlayPilotRootV01(repositoryRoot, pilotId);
  const episodeRoot = path.join(root, "episodes", episodeId);
  assertDirectoryNoSymlinkV01(episodeRoot);
  assertExpectedOverlayEpisodeFilesV01(episodeRoot);
  const value = readJsonV01(
    path.join(episodeRoot, "pre-action-overlay.json"),
    MAX_OVERLAY_BYTES,
  );
  assertRealWorkContinuityPreActionOverlayV01(core.freeze, value);
  return value;
}

export function readRealWorkContinuityPreActionOverlaysV01(
  repositoryRoot: string,
  pilotId: string,
): RealWorkContinuityPreActionOverlayV01[] {
  if (!PILOT_ID.test(pilotId)) refuse("real_work_pre_action_overlay_pilot_id_invalid");
  const repository = validateRepositoryRootV01(repositoryRoot);
  const namespaceRoot = path.join(
    repository,
    ".augnes-lab",
    "real-work-continuity-pre-action-overlay",
  );
  if (!existsSync(namespaceRoot)) return [];
  assertDirectoryNoSymlinkV01(namespaceRoot);
  const pilotRoot = path.join(namespaceRoot, pilotId);
  if (!existsSync(pilotRoot)) return [];
  assertDirectoryNoSymlinkV01(pilotRoot);
  const core = readRealWorkPilotArtifactsV01(repositoryRoot, pilotId);
  const freezeIds = new Set(core.freezes.map((freeze) => freeze.episode_id));
  const episodesRoot = path.join(pilotRoot, "episodes");
  if (!existsSync(episodesRoot)) return [];
  assertDirectoryNoSymlinkV01(episodesRoot);
  const episodeIds = readdirSync(episodesRoot, { withFileTypes: true })
    .map((entry) => {
      if (
        !entry.isDirectory() ||
        entry.isSymbolicLink() ||
        !EPISODE_ID.test(entry.name) ||
        !freezeIds.has(entry.name)
      ) {
        refuse("real_work_pre_action_overlay_unexpected_episode_artifact");
      }
      return entry.name;
    })
    .sort();
  if (episodeIds.length > MAX_EPISODES) {
    refuse("real_work_pre_action_overlay_episode_limit_exceeded");
  }
  return episodeIds.map((episodeId) =>
    readRealWorkContinuityPreActionOverlayV01(
      repositoryRoot,
      pilotId,
      episodeId,
    ),
  );
}

export function writeRealWorkContinuityPreActionOverlayReportArtifactsV01(
  repositoryRoot: string,
  report: RealWorkContinuityPreActionOverlayReportV01,
): { json_path: string; markdown_path: string } {
  if (!PILOT_ID.test(report.pilot_id)) {
    refuse("real_work_pre_action_overlay_report_pilot_id_invalid");
  }
  readRealWorkPilotArtifactsV01(repositoryRoot, report.pilot_id);
  const pilotRoot = ensureOverlayPilotRootV01(
    repositoryRoot,
    report.pilot_id,
  );
  const reportsRoot = ensureDirectoryV01(pilotRoot, ["reports"]);
  const suffix = report.integrity.fingerprint.slice("sha256:".length, 39);
  const jsonTarget = path.join(
    reportsRoot,
    `overlay-report_${suffix}.json`,
  );
  const markdownTarget = path.join(
    reportsRoot,
    `overlay-report_${suffix}.md`,
  );
  writeExclusiveOrVerifyV01(
    jsonTarget,
    `${JSON.stringify(report, null, 2)}\n`,
    MAX_REPORT_BYTES,
  );
  writeExclusiveOrVerifyV01(
    markdownTarget,
    formatRealWorkContinuityPreActionOverlayMarkdownV01(report),
    MAX_REPORT_BYTES,
  );
  assertExpectedReportFilesV01(reportsRoot);
  return {
    json_path: repositoryRelativePathV01(repositoryRoot, jsonTarget),
    markdown_path: repositoryRelativePathV01(repositoryRoot, markdownTarget),
  };
}

function ensureOverlayPilotRootV01(
  repositoryRoot: string,
  pilotId: string,
): string {
  if (!PILOT_ID.test(pilotId)) refuse("real_work_pre_action_overlay_pilot_id_invalid");
  const root = validateRepositoryRootV01(repositoryRoot);
  const pilotRoot = ensureDirectoryV01(root, [
    ".augnes-lab",
    "real-work-continuity-pre-action-overlay",
    pilotId,
  ]);
  ensureDirectoryV01(pilotRoot, ["episodes"]);
  return pilotRoot;
}

function existingOverlayPilotRootV01(
  repositoryRoot: string,
  pilotId: string,
): string {
  if (!PILOT_ID.test(pilotId)) refuse("real_work_pre_action_overlay_pilot_id_invalid");
  const root = validateRepositoryRootV01(repositoryRoot);
  const pilotRoot = path.join(
    root,
    ".augnes-lab",
    "real-work-continuity-pre-action-overlay",
    pilotId,
  );
  assertDirectoryNoSymlinkV01(pilotRoot);
  assertInsideRootV01(root, realpathSync(pilotRoot));
  return pilotRoot;
}

function validateRepositoryRootV01(repositoryRoot: string): string {
  if (!path.isAbsolute(repositoryRoot)) {
    refuse("real_work_pre_action_overlay_repository_root_must_be_absolute");
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
    refuse("real_work_pre_action_overlay_repository_root_not_git");
  }
  if (realpathSync(gitRoot) !== root) {
    refuse("real_work_pre_action_overlay_repository_root_not_toplevel");
  }
  const ignorePath = path.join(root, ".gitignore");
  if (!existsSync(ignorePath)) {
    refuse("real_work_pre_action_overlay_gitignore_missing");
  }
  const ignored = readFileSync(ignorePath, "utf8")
    .split(/\r?\n/u)
    .map((line) => line.trim())
    .includes(".augnes-lab/");
  if (!ignored) {
    refuse("real_work_pre_action_overlay_artifact_namespace_not_ignored");
  }
  return root;
}

function ensureDirectoryV01(root: string, components: readonly string[]): string {
  let current = root;
  for (const component of components) {
    if (
      !component ||
      component === "." ||
      component === ".." ||
      component.includes(path.sep)
    ) {
      refuse("real_work_pre_action_overlay_path_component_invalid");
    }
    current = path.join(current, component);
    if (existsSync(current)) assertDirectoryNoSymlinkV01(current);
    else mkdirSync(current, { mode: 0o700 });
  }
  assertInsideRootV01(realpathSync(root), realpathSync(current));
  return current;
}

function assertDirectoryNoSymlinkV01(target: string): void {
  if (!existsSync(target)) {
    refuse("real_work_pre_action_overlay_artifact_directory_missing");
  }
  const stat = lstatSync(target);
  if (stat.isSymbolicLink() || !stat.isDirectory()) {
    refuse("real_work_pre_action_overlay_artifact_directory_unsafe");
  }
}

function assertInsideRootV01(root: string, target: string): void {
  const relative = path.relative(root, target);
  if (!relative || relative === ".") return;
  if (
    relative.startsWith(`..${path.sep}`) ||
    relative === ".." ||
    path.isAbsolute(relative)
  ) {
    refuse("real_work_pre_action_overlay_artifact_path_escape");
  }
}

function writeExclusiveV01(
  target: string,
  text: string,
  maximumBytes: number,
): void {
  if (Buffer.byteLength(text, "utf8") > maximumBytes) {
    refuse("real_work_pre_action_overlay_artifact_size_bound_exceeded");
  }
  let descriptor: number;
  try {
    descriptor = openSync(target, "wx", 0o600);
  } catch (error) {
    if (isAlreadyExistsErrorV01(error)) {
      refuse("real_work_pre_action_overlay_append_only_artifact_exists");
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
      refuse("real_work_pre_action_overlay_report_artifact_conflict");
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
    refuse("real_work_pre_action_overlay_artifact_json_invalid");
  }
}

function readBoundedTextV01(target: string, maximumBytes: number): string {
  const stat = lstatSync(target);
  if (stat.isSymbolicLink() || !stat.isFile() || stat.size > maximumBytes) {
    refuse("real_work_pre_action_overlay_artifact_file_unsafe_or_oversized");
  }
  return readFileSync(target, "utf8");
}

function assertExpectedOverlayEpisodeFilesV01(episodeRoot: string): void {
  const entries = readdirSync(episodeRoot, { withFileTypes: true });
  if (
    entries.length !== 1 ||
    entries[0]?.name !== "pre-action-overlay.json" ||
    !entries[0].isFile() ||
    entries[0].isSymbolicLink()
  ) {
    refuse("real_work_pre_action_overlay_episode_artifact_set_invalid");
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
    refuse("real_work_pre_action_overlay_report_artifact_set_invalid");
  }
}

function repositoryRelativePathV01(
  repositoryRoot: string,
  target: string,
): string {
  const root = realpathSync(repositoryRoot);
  const relative = path.relative(root, target).split(path.sep).join("/");
  if (
    !relative.startsWith(
      `${REAL_WORK_PRE_ACTION_OVERLAY_ARTIFACT_NAMESPACE_V01}/`,
    )
  ) {
    refuse("real_work_pre_action_overlay_relative_path_invalid");
  }
  return relative;
}

function isAlreadyExistsErrorV01(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "EEXIST"
  );
}

function refuse(code: string): never {
  throw new RealWorkContinuityPreActionOverlayErrorV01(code);
}
