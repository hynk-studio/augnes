import {
  closeSync,
  existsSync,
  fsyncSync,
  linkSync,
  lstatSync,
  mkdirSync,
  openSync,
  readFileSync,
  readdirSync,
  realpathSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";

import {
  assertSafeCommissionedWorkOutputV01,
  assertValidCommissionedWorkFinalReportV01,
  createCommissionedWorkIntegrityV01,
  createCommissionedWorkRecordRefV01,
} from "@/lib/vnext/commissioned-controlled-workbench";
import {
  canonicalizeProtocolValueV01,
  compareProtocolCodeUnitsV01,
  createProtocolSha256V01,
} from "@/lib/vnext/protocol-primitives";
import {
  COMMISSIONED_WORK_ARTIFACT_INDEX_VERSION_V01,
  type CommissionedWorkArtifactIndexV01,
  type CommissionedWorkEpisodeArtifactV01,
  type CommissionedWorkFinalReportV01,
  type CommissionedWorkRecordRefV01,
} from "@/types/vnext/commissioned-controlled-workbench";

export const COMMISSIONED_WORKBENCH_ARTIFACT_NAMESPACE_V01 =
  ".augnes-lab/commissioned-controlled-workbench" as const;

const SAFE_SEGMENT_V01 = /^[A-Za-z0-9._-]{1,200}$/u;
const EXPECTED_ARTIFACT_COUNT_V01 = 25;

export interface CommissionedWorkArtifactWriteSummaryV01 {
  namespace_root: string;
  run_root: string;
  relative_run_root: string;
  artifact_count: number;
  report_fingerprint: string;
  candidate_fingerprint: string;
  artifact_index_fingerprint: string;
  append_only: true;
  product_database_writes: 0;
  core_writes: 0;
  proposal_writes: 0;
  review_decision_writes: 0;
  transition_writes: 0;
  policy_activations: 0;
}

export class CommissionedWorkArtifactStoreErrorV01 extends Error {
  constructor(readonly code: string) {
    super(code);
    this.name = "CommissionedWorkArtifactStoreErrorV01";
  }
}

export function resolveCommissionedWorkArtifactNamespaceV01(
  repositoryRootInput: string,
): string {
  if (!path.isAbsolute(repositoryRootInput)) {
    failV01("commissioned_work_artifact_repository_root_must_be_absolute");
  }
  const repositoryRoot = realpathSync(repositoryRootInput);
  const ignorePath = path.join(repositoryRoot, ".gitignore");
  if (!existsSync(ignorePath)) {
    failV01("commissioned_work_artifact_gitignore_missing");
  }
  const ignoreLines = readFileSync(ignorePath, "utf8")
    .split(/\r?\n/u)
    .map((line) => line.trim());
  if (!ignoreLines.includes(".augnes-lab/")) {
    failV01("commissioned_work_artifact_namespace_not_ignored");
  }
  const namespaceRoot = path.join(
    repositoryRoot,
    ...COMMISSIONED_WORKBENCH_ARTIFACT_NAMESPACE_V01.split("/"),
  );
  ensureDirectoryChainWithoutSymlinksV01(repositoryRoot, namespaceRoot);
  const resolved = realpathSync(namespaceRoot);
  assertContainedV01(repositoryRoot, resolved);
  if (resolved !== namespaceRoot) {
    failV01("commissioned_work_artifact_namespace_identity_mismatch");
  }
  return resolved;
}

export function writeCommissionedWorkArtifactsV01(input: {
  repository_root: string;
  run_label: string;
  report: CommissionedWorkFinalReportV01;
}): CommissionedWorkArtifactWriteSummaryV01 {
  assertValidCommissionedWorkFinalReportV01(input.report);
  requireSafeSegmentV01(input.run_label);
  const namespaceRoot = resolveCommissionedWorkArtifactNamespaceV01(
    input.repository_root,
  );
  const familySegment = safeIdentifierSegmentV01(input.report.family.family_id);
  const familyRoot = resolveArtifactPathV01(namespaceRoot, familySegment);
  ensureDirectoryChainWithoutSymlinksV01(namespaceRoot, familyRoot);
  const runRoot = resolveArtifactPathV01(
    namespaceRoot,
    familySegment,
    input.run_label,
  );
  if (existsSync(runRoot)) {
    const stat = lstatSync(runRoot);
    if (stat.isSymbolicLink()) {
      failV01("commissioned_work_artifact_run_root_symlink_refused");
    }
    if (!stat.isDirectory() || readdirSync(runRoot).length > 0) {
      failV01("commissioned_work_artifact_run_root_not_clean");
    }
  } else {
    ensureDirectoryChainWithoutSymlinksV01(namespaceRoot, runRoot);
  }
  const artifacts: CommissionedWorkArtifactIndexV01["artifacts"] = [];
  writeArtifactV01(
    runRoot,
    ["family-manifest.json"],
    input.report.family,
    {
      slot_kind: "family_manifest",
      record_ref: createCommissionedWorkRecordRefV01({
        record_version: input.report.family.family_version,
        record_id: input.report.family.family_id,
        record_fingerprint: input.report.family.integrity.fingerprint,
      }),
      artifact_version: input.report.family.family_version,
      case_id: null,
      episode_id: null,
      condition: null,
      holdout_variant: null,
    },
    artifacts,
  );
  writeArtifactV01(
    runRoot,
    ["training-result.json"],
    input.report.training,
    {
      slot_kind: "training_result",
      record_ref: createCommissionedWorkRecordRefV01({
        record_version: input.report.training.result_version,
        record_id: `training:${input.report.family.family_id}`,
        record_fingerprint: input.report.training.integrity.fingerprint,
      }),
      artifact_version: input.report.training.result_version,
      case_id: null,
      episode_id: null,
      condition: null,
      holdout_variant: null,
    },
    artifacts,
  );
  const episodes = [
    ...input.report.training.predecessor_episodes,
    ...input.report.training.successor_episodes,
    input.report.holdout.predecessor_episode,
    ...input.report.holdout.arms,
  ].sort((left, right) =>
    compareProtocolCodeUnitsV01(left.episode_id, right.episode_id),
  );
  for (const episode of episodes) {
    writeArtifactV01(
      runRoot,
      ["episodes", `${safeIdentifierSegmentV01(episode.episode_id)}.json`],
      episode,
      episodeIndexMetadataV01(episode),
      artifacts,
    );
  }
  writeArtifactV01(
    runRoot,
    ["consolidation-candidate.json"],
    input.report.consolidation_candidate,
    {
      slot_kind: "consolidation_candidate",
      record_ref: createCommissionedWorkRecordRefV01({
        record_version: input.report.consolidation_candidate.candidate_version,
        record_id: input.report.consolidation_candidate.candidate_id,
        record_fingerprint:
          input.report.consolidation_candidate.integrity.fingerprint,
      }),
      artifact_version: input.report.consolidation_candidate.candidate_version,
      case_id: null,
      episode_id: null,
      condition: null,
      holdout_variant: null,
    },
    artifacts,
  );
  writeArtifactV01(
    runRoot,
    ["holdout-evaluation.json"],
    input.report.holdout,
    {
      slot_kind: "holdout_evaluation",
      record_ref: createCommissionedWorkRecordRefV01({
        record_version: input.report.holdout.holdout_version,
        record_id: input.report.holdout.holdout_id,
        record_fingerprint: input.report.holdout.integrity.fingerprint,
      }),
      artifact_version: input.report.holdout.holdout_version,
      case_id: input.report.family.holdout_case.case_id,
      episode_id: null,
      condition: null,
      holdout_variant: null,
    },
    artifacts,
  );
  writeArtifactV01(
    runRoot,
    ["final-report.json"],
    input.report,
    {
      slot_kind: "final_report",
      record_ref: createCommissionedWorkRecordRefV01({
        record_version: input.report.report_version,
        record_id: input.report.report_id,
        record_fingerprint: input.report.integrity.fingerprint,
      }),
      artifact_version: input.report.report_version,
      case_id: null,
      episode_id: null,
      condition: null,
      holdout_variant: null,
    },
    artifacts,
  );
  if (artifacts.length !== EXPECTED_ARTIFACT_COUNT_V01) {
    failV01("commissioned_work_artifact_slot_count_invalid");
  }
  const indexWithoutIntegrity = {
    index_version: COMMISSIONED_WORK_ARTIFACT_INDEX_VERSION_V01,
    family_id: input.report.family.family_id,
    report_fingerprint: input.report.integrity.fingerprint,
    candidate_fingerprint:
      input.report.consolidation_candidate.integrity.fingerprint,
    run_label: input.run_label,
    append_only: true as const,
    complete_frozen_slots: true as const,
    expected_artifact_count: EXPECTED_ARTIFACT_COUNT_V01,
    artifacts: [...artifacts].sort((left, right) =>
      compareProtocolCodeUnitsV01(left.relative_path, right.relative_path),
    ),
    raw_prompt_persisted: false as const,
    raw_transcript_persisted: false as const,
    hidden_reasoning_persisted: false as const,
    credential_or_secret_persisted: false as const,
    absolute_local_path_persisted: false as const,
    production_project_content_persisted: false as const,
    writes_outside_cw1_root: false as const,
    product_database_writes: 0 as const,
    core_writes: 0 as const,
    proposal_writes: 0 as const,
    review_decision_writes: 0 as const,
    transition_writes: 0 as const,
    policy_activations: 0 as const,
  };
  const index: CommissionedWorkArtifactIndexV01 = {
    ...indexWithoutIntegrity,
    integrity: createCommissionedWorkIntegrityV01(
      indexWithoutIntegrity,
      "commissioned_work_artifact_index_without_integrity_fingerprint",
    ),
  };
  assertSafeCommissionedWorkOutputV01(index);
  writeTextExclusiveV01(
    runRoot,
    ["artifact-index.json"],
    canonicalizeProtocolValueV01(index),
  );
  const validated = validateCommissionedWorkArtifactsV01({
    repository_root: input.repository_root,
    relative_run_root: path.relative(realpathSync(input.repository_root), runRoot),
  });
  return {
    namespace_root: namespaceRoot,
    run_root: runRoot,
    relative_run_root: path.relative(realpathSync(input.repository_root), runRoot),
    artifact_count: EXPECTED_ARTIFACT_COUNT_V01 + 1,
    report_fingerprint: input.report.integrity.fingerprint,
    candidate_fingerprint:
      input.report.consolidation_candidate.integrity.fingerprint,
    artifact_index_fingerprint: validated.integrity.fingerprint,
    append_only: true,
    product_database_writes: 0,
    core_writes: 0,
    proposal_writes: 0,
    review_decision_writes: 0,
    transition_writes: 0,
    policy_activations: 0,
  };
}

export function validateCommissionedWorkArtifactsV01(input: {
  repository_root: string;
  relative_run_root: string;
}): CommissionedWorkArtifactIndexV01 {
  const repositoryRoot = realpathSync(input.repository_root);
  const runRoot = path.resolve(repositoryRoot, input.relative_run_root);
  assertContainedV01(repositoryRoot, runRoot);
  assertExistingAncestorsNotSymlinksV01(repositoryRoot, runRoot);
  if (!existsSync(runRoot) || !lstatSync(runRoot).isDirectory()) {
    failV01("commissioned_work_artifact_run_root_missing");
  }
  const indexPath = resolveArtifactPathV01(runRoot, "artifact-index.json");
  if (!existsSync(indexPath) || !lstatSync(indexPath).isFile()) {
    failV01("commissioned_work_artifact_index_missing");
  }
  let index: CommissionedWorkArtifactIndexV01;
  try {
    index = JSON.parse(readFileSync(indexPath, "utf8")) as CommissionedWorkArtifactIndexV01;
  } catch {
    failV01("commissioned_work_artifact_index_invalid_json");
  }
  const { integrity, ...withoutIntegrity } = index;
  const expectedIntegrity = createCommissionedWorkIntegrityV01(
    withoutIntegrity,
    "commissioned_work_artifact_index_without_integrity_fingerprint",
  );
  if (
    index.index_version !== COMMISSIONED_WORK_ARTIFACT_INDEX_VERSION_V01 ||
    integrity?.fingerprint !== expectedIntegrity.fingerprint ||
    index.append_only !== true ||
    index.complete_frozen_slots !== true ||
    index.expected_artifact_count !== EXPECTED_ARTIFACT_COUNT_V01 ||
    !Array.isArray(index.artifacts) ||
    index.artifacts.length !== EXPECTED_ARTIFACT_COUNT_V01 ||
    new Set(index.artifacts.map((artifact) => artifact.relative_path)).size !==
      EXPECTED_ARTIFACT_COUNT_V01
  ) {
    failV01("commissioned_work_artifact_index_integrity_invalid");
  }
  if (
    canonicalizeProtocolValueV01({
      raw_prompt_persisted: index.raw_prompt_persisted,
      raw_transcript_persisted: index.raw_transcript_persisted,
      hidden_reasoning_persisted: index.hidden_reasoning_persisted,
      credential_or_secret_persisted: index.credential_or_secret_persisted,
      absolute_local_path_persisted: index.absolute_local_path_persisted,
      production_project_content_persisted:
        index.production_project_content_persisted,
      writes_outside_cw1_root: index.writes_outside_cw1_root,
      product_database_writes: index.product_database_writes,
      core_writes: index.core_writes,
      proposal_writes: index.proposal_writes,
      review_decision_writes: index.review_decision_writes,
      transition_writes: index.transition_writes,
      policy_activations: index.policy_activations,
    }) !==
      canonicalizeProtocolValueV01({
        raw_prompt_persisted: false,
        raw_transcript_persisted: false,
        hidden_reasoning_persisted: false,
        credential_or_secret_persisted: false,
        absolute_local_path_persisted: false,
        production_project_content_persisted: false,
        writes_outside_cw1_root: false,
        product_database_writes: 0,
        core_writes: 0,
        proposal_writes: 0,
        review_decision_writes: 0,
        transition_writes: 0,
        policy_activations: 0,
      })
  ) {
    failV01("commissioned_work_artifact_index_boundary_invalid");
  }

  const reportPath = resolveArtifactPathV01(runRoot, "final-report.json");
  if (!existsSync(reportPath) || !lstatSync(reportPath).isFile()) {
    failV01("commissioned_work_artifact_final_report_missing");
  }
  let report: CommissionedWorkFinalReportV01;
  try {
    report = JSON.parse(readFileSync(reportPath, "utf8")) as CommissionedWorkFinalReportV01;
  } catch {
    failV01("commissioned_work_artifact_final_report_invalid_json");
  }
  assertValidCommissionedWorkFinalReportV01(report);
  assertSafeCommissionedWorkOutputV01(report);

  const expectedSlots = expectedArtifactSlotsFromReportV01(report);
  if (expectedSlots.length !== EXPECTED_ARTIFACT_COUNT_V01) {
    failV01("commissioned_work_artifact_slot_count_invalid");
  }
  requireSafeSegmentV01(index.run_label);
  const expectedRelativeRunRoot = path.join(
    ...COMMISSIONED_WORKBENCH_ARTIFACT_NAMESPACE_V01.split("/"),
    safeIdentifierSegmentV01(report.family.family_id),
    index.run_label,
  );
  if (
    path.relative(repositoryRoot, runRoot) !== expectedRelativeRunRoot ||
    path.resolve(repositoryRoot, expectedRelativeRunRoot) !== runRoot
  ) {
    failV01("commissioned_work_artifact_namespace_binding_invalid");
  }
  const expectedArtifacts = expectedSlots.map((slot) => slot.index_entry);
  if (
    index.family_id !== report.family.family_id ||
    index.report_fingerprint !== report.integrity.fingerprint ||
    index.candidate_fingerprint !==
      report.consolidation_candidate.integrity.fingerprint ||
    canonicalizeProtocolValueV01(index.artifacts) !==
      canonicalizeProtocolValueV01(expectedArtifacts)
  ) {
    failV01("commissioned_work_artifact_frozen_slot_binding_invalid");
  }

  const files = listFilesRecursivelyV01(runRoot).sort(compareProtocolCodeUnitsV01);
  const expectedFiles = [
    "artifact-index.json",
    ...expectedArtifacts.map((artifact) => artifact.relative_path),
  ].sort(compareProtocolCodeUnitsV01);
  if (
    canonicalizeProtocolValueV01(files) !==
    canonicalizeProtocolValueV01(expectedFiles)
  ) {
    failV01("commissioned_work_artifact_file_set_invalid");
  }
  for (const slot of expectedSlots) {
    const artifact = slot.index_entry;
    const target = resolveArtifactPathV01(
      runRoot,
      ...artifact.relative_path.split("/"),
    );
    if (!existsSync(target) || !lstatSync(target).isFile()) {
      failV01("commissioned_work_artifact_missing");
    }
    const text = readFileSync(target, "utf8").trimEnd();
    const expectedText = canonicalizeProtocolValueV01(slot.value);
    if (
      text !== expectedText ||
      createProtocolSha256V01(text) !== artifact.content_fingerprint
    ) {
      failV01("commissioned_work_artifact_content_fingerprint_invalid");
    }
  }
  assertSafeCommissionedWorkOutputV01(index);
  return index;
}

interface ExpectedCommissionedWorkArtifactSlotV01 {
  index_entry: CommissionedWorkArtifactIndexV01["artifacts"][number];
  value: unknown;
}

function expectedArtifactSlotsFromReportV01(
  report: CommissionedWorkFinalReportV01,
): ExpectedCommissionedWorkArtifactSlotV01[] {
  const slots: ExpectedCommissionedWorkArtifactSlotV01[] = [];
  addExpectedArtifactSlotV01(
    slots,
    ["family-manifest.json"],
    report.family,
    {
      slot_kind: "family_manifest",
      record_ref: createCommissionedWorkRecordRefV01({
        record_version: report.family.family_version,
        record_id: report.family.family_id,
        record_fingerprint: report.family.integrity.fingerprint,
      }),
      artifact_version: report.family.family_version,
      case_id: null,
      episode_id: null,
      condition: null,
      holdout_variant: null,
    },
  );
  addExpectedArtifactSlotV01(
    slots,
    ["training-result.json"],
    report.training,
    {
      slot_kind: "training_result",
      record_ref: createCommissionedWorkRecordRefV01({
        record_version: report.training.result_version,
        record_id: `training:${report.family.family_id}`,
        record_fingerprint: report.training.integrity.fingerprint,
      }),
      artifact_version: report.training.result_version,
      case_id: null,
      episode_id: null,
      condition: null,
      holdout_variant: null,
    },
  );

  const episodes = [
    ...report.training.predecessor_episodes,
    ...report.training.successor_episodes,
    report.holdout.predecessor_episode,
    ...report.holdout.arms,
  ].sort((left, right) =>
    compareProtocolCodeUnitsV01(left.episode_id, right.episode_id),
  );
  for (const episode of episodes) {
    addExpectedArtifactSlotV01(
      slots,
      ["episodes", `${safeIdentifierSegmentV01(episode.episode_id)}.json`],
      episode,
      episodeIndexMetadataV01(episode),
    );
  }

  addExpectedArtifactSlotV01(
    slots,
    ["consolidation-candidate.json"],
    report.consolidation_candidate,
    {
      slot_kind: "consolidation_candidate",
      record_ref: createCommissionedWorkRecordRefV01({
        record_version: report.consolidation_candidate.candidate_version,
        record_id: report.consolidation_candidate.candidate_id,
        record_fingerprint:
          report.consolidation_candidate.integrity.fingerprint,
      }),
      artifact_version: report.consolidation_candidate.candidate_version,
      case_id: null,
      episode_id: null,
      condition: null,
      holdout_variant: null,
    },
  );
  addExpectedArtifactSlotV01(
    slots,
    ["holdout-evaluation.json"],
    report.holdout,
    {
      slot_kind: "holdout_evaluation",
      record_ref: createCommissionedWorkRecordRefV01({
        record_version: report.holdout.holdout_version,
        record_id: report.holdout.holdout_id,
        record_fingerprint: report.holdout.integrity.fingerprint,
      }),
      artifact_version: report.holdout.holdout_version,
      case_id: report.family.holdout_case.case_id,
      episode_id: null,
      condition: null,
      holdout_variant: null,
    },
  );
  addExpectedArtifactSlotV01(
    slots,
    ["final-report.json"],
    report,
    {
      slot_kind: "final_report",
      record_ref: createCommissionedWorkRecordRefV01({
        record_version: report.report_version,
        record_id: report.report_id,
        record_fingerprint: report.integrity.fingerprint,
      }),
      artifact_version: report.report_version,
      case_id: null,
      episode_id: null,
      condition: null,
      holdout_variant: null,
    },
  );

  return slots.sort((left, right) =>
    compareProtocolCodeUnitsV01(
      left.index_entry.relative_path,
      right.index_entry.relative_path,
    ),
  );
}

function addExpectedArtifactSlotV01(
  slots: ExpectedCommissionedWorkArtifactSlotV01[],
  segments: string[],
  value: unknown,
  metadata: Omit<
    CommissionedWorkArtifactIndexV01["artifacts"][number],
    "relative_path" | "content_fingerprint"
  >,
): void {
  const text = canonicalizeProtocolValueV01(value);
  slots.push({
    index_entry: {
      ...metadata,
      relative_path: segments.join("/"),
      content_fingerprint: createProtocolSha256V01(text),
    },
    value,
  });
}

function episodeIndexMetadataV01(
  episode: CommissionedWorkEpisodeArtifactV01,
): Omit<
  CommissionedWorkArtifactIndexV01["artifacts"][number],
  "relative_path" | "content_fingerprint"
> {
  return {
    slot_kind: "episode",
    record_ref: createCommissionedWorkRecordRefV01({
      record_version: episode.episode_version,
      record_id: episode.episode_id,
      record_fingerprint: episode.integrity.fingerprint,
    }),
    artifact_version: episode.episode_version,
    case_id: episode.case_id,
    episode_id: episode.episode_id,
    condition: episode.condition,
    holdout_variant: episode.holdout_variant,
  };
}

function writeArtifactV01(
  runRoot: string,
  segments: string[],
  value: unknown,
  metadata: Omit<
    CommissionedWorkArtifactIndexV01["artifacts"][number],
    "relative_path" | "content_fingerprint"
  >,
  artifacts: CommissionedWorkArtifactIndexV01["artifacts"],
): void {
  assertSafeCommissionedWorkOutputV01(value);
  const text = canonicalizeProtocolValueV01(value);
  writeTextExclusiveV01(runRoot, segments, text);
  artifacts.push({
    ...metadata,
    relative_path: segments.join("/"),
    content_fingerprint: createProtocolSha256V01(text),
  });
}

function writeTextExclusiveV01(
  runRoot: string,
  segments: string[],
  text: string,
): void {
  const target = resolveArtifactPathV01(runRoot, ...segments);
  ensureDirectoryChainWithoutSymlinksV01(runRoot, path.dirname(target));
  if (existsSync(target)) {
    failV01("commissioned_work_artifact_overwrite_refused");
  }
  const temporary = `${target}.tmp`;
  if (existsSync(temporary)) {
    failV01("commissioned_work_artifact_stale_temporary_refused");
  }
  const descriptor = openSync(temporary, "wx", 0o600);
  try {
    writeFileSync(descriptor, `${text}\n`, { encoding: "utf8" });
    fsyncSync(descriptor);
  } finally {
    closeSync(descriptor);
  }
  try {
    linkSync(temporary, target);
  } catch {
    unlinkSync(temporary);
    failV01("commissioned_work_artifact_atomic_publish_refused");
  }
  unlinkSync(temporary);
  fsyncDirectoryV01(path.dirname(target));
}

function resolveArtifactPathV01(baseInput: string, ...segments: string[]): string {
  const base = realpathSync(baseInput);
  segments.forEach(requireSafeSegmentV01);
  const target = path.join(base, ...segments);
  assertContainedV01(base, target);
  assertExistingAncestorsNotSymlinksV01(base, target);
  return target;
}

function ensureDirectoryChainWithoutSymlinksV01(
  baseInput: string,
  targetInput: string,
): void {
  const base = realpathSync(baseInput);
  assertContainedV01(base, targetInput);
  const relative = path.relative(base, targetInput);
  let current = base;
  for (const segment of relative.split(path.sep).filter(Boolean)) {
    requireSafeSegmentV01(segment);
    current = path.join(current, segment);
    if (existsSync(current)) {
      const stat = lstatSync(current);
      if (stat.isSymbolicLink()) {
        failV01("commissioned_work_artifact_symlink_refused");
      }
      if (!stat.isDirectory()) {
        failV01("commissioned_work_artifact_directory_component_invalid");
      }
    } else {
      mkdirSync(current, { mode: 0o700 });
      fsyncDirectoryV01(path.dirname(current));
    }
  }
}

function assertExistingAncestorsNotSymlinksV01(base: string, target: string): void {
  assertContainedV01(base, target);
  const relative = path.relative(base, target);
  let current = base;
  for (const segment of relative.split(path.sep).filter(Boolean)) {
    current = path.join(current, segment);
    if (!existsSync(current)) break;
    if (lstatSync(current).isSymbolicLink()) {
      failV01("commissioned_work_artifact_symlink_refused");
    }
  }
}

function assertContainedV01(base: string, target: string): void {
  const relative = path.relative(base, target);
  if (
    relative === ".." ||
    relative.startsWith(`..${path.sep}`) ||
    path.isAbsolute(relative)
  ) {
    failV01("commissioned_work_artifact_path_escape");
  }
}

function listFilesRecursivelyV01(root: string): string[] {
  const files: string[] = [];
  const visit = (directory: string): void => {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const target = path.join(directory, entry.name);
      if (entry.isSymbolicLink()) {
        failV01("commissioned_work_artifact_symlink_refused");
      }
      if (entry.isDirectory()) visit(target);
      else if (entry.isFile()) files.push(path.relative(root, target).split(path.sep).join("/"));
      else failV01("commissioned_work_artifact_special_file_refused");
    }
  };
  visit(root);
  return files;
}

function fsyncDirectoryV01(directory: string): void {
  const descriptor = openSync(directory, "r");
  try {
    fsyncSync(descriptor);
  } finally {
    closeSync(descriptor);
  }
}

function requireSafeSegmentV01(value: string): void {
  if (!SAFE_SEGMENT_V01.test(value) || value === "." || value === "..") {
    failV01("commissioned_work_artifact_segment_invalid");
  }
}

function safeIdentifierSegmentV01(value: string): string {
  const segment = value.replaceAll(":", "_");
  requireSafeSegmentV01(segment);
  return segment;
}

function failV01(code: string): never {
  throw new CommissionedWorkArtifactStoreErrorV01(code);
}
