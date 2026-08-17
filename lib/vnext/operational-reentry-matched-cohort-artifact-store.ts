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
  validateOperationalReentryMatchedCohortExecutionResultV01,
} from "@/lib/vnext/operational-reentry-matched-cohort";
import {
  canonicalizeProtocolValueV01,
  createProtocolSha256V01,
} from "@/lib/vnext/protocol-primitives";
import type {
  OperationalReentryMatchedCohortBlockEvaluationV01,
  OperationalReentryMatchedCohortCallPlanV01,
  OperationalReentryMatchedCohortCallTerminalV01,
  OperationalReentryMatchedCohortExecutionResultV01,
  OperationalReentryMatchedCohortManifestV01,
  OperationalReentryMatchedCohortPricingV01,
} from "@/types/vnext/operational-reentry-matched-cohort";

const SAFE_SEGMENT = /^[A-Za-z0-9._-]{1,200}$/u;
export const ACGC_E2_HISTORICAL_COHORT_ID_V01 =
  "operational-reentry-cohort:48331280ed7ead6dbad2d12105208dfb" as const;
export const ACGC_E2_HISTORICAL_RUN_ROOT_V01 =
  ".augnes-lab/operational-reentry-matched-cohorts/operational-reentry-cohort_48331280ed7ead6dbad2d12105208dfb/issue-185" as const;

export class OperationalReentryMatchedCohortArtifactErrorV01 extends Error {
  constructor(readonly code: string) {
    super(code);
    this.name = "OperationalReentryMatchedCohortArtifactErrorV01";
  }
}

export interface OperationalReentryMatchedCohortAttemptJournalV01 {
  run_root: string;
  relative_run_root: string;
  attempt_fingerprint: string;
  consume_authorization(): void;
  append_call(call: OperationalReentryMatchedCohortCallTerminalV01): void;
  append_block(block: OperationalReentryMatchedCohortBlockEvaluationV01): void;
  finalize(result: OperationalReentryMatchedCohortExecutionResultV01): OperationalReentryMatchedCohortArtifactSummaryV01;
}

export interface OperationalReentryMatchedCohortArtifactSummaryV01 {
  relative_run_root: string;
  result_kind: "complete" | "incomplete";
  artifact_count: number;
  artifact_index_fingerprint: string;
  report_fingerprint: string;
  cohort_fingerprint: string;
  authorization_consumed: boolean;
  tracked_repository_files_written: false;
  product_database_writes: 0;
  core_writes: 0;
}

export function beginOperationalReentryMatchedCohortAttemptV01(input: {
  repository_root: string;
  manifest: OperationalReentryMatchedCohortManifestV01;
  call_plan: OperationalReentryMatchedCohortCallPlanV01;
  pricing: OperationalReentryMatchedCohortPricingV01;
}): OperationalReentryMatchedCohortAttemptJournalV01 {
  const repositoryRoot = requireRepositoryRootV01(input.repository_root);
  const artifactRoot = path.join(
    repositoryRoot,
    ".augnes-lab",
    "operational-reentry-matched-cohorts",
  );
  ensureDirectoryChainV01(repositoryRoot, artifactRoot);
  const runRoot = path.join(
    artifactRoot,
    safeSegmentV01(input.manifest.cohort_id),
    "issue-185",
  );
  if (existsSync(runRoot)) {
    if (lstatSync(runRoot).isSymbolicLink()) failV01("operational_reentry_artifact_symlink_refused");
    if (!lstatSync(runRoot).isDirectory()) failV01("operational_reentry_artifact_root_invalid");
    if (readdirSync(runRoot).length > 0) failV01("operational_reentry_historical_cohort_exists");
  } else {
    ensureDirectoryChainV01(repositoryRoot, runRoot);
  }
  const attempt = {
    attempt_version: "operational_reentry_matched_cohort_attempt.v0.1",
    cohort_id: input.manifest.cohort_id,
    source_repository_head_sha: input.manifest.source_repository_head_sha,
    authorization_fingerprint: input.manifest.authorization.integrity.fingerprint,
    manifest_fingerprint: input.manifest.integrity.fingerprint,
    call_plan_fingerprint: input.call_plan.integrity.fingerprint,
    route_fingerprint: input.manifest.route.integrity_fingerprint,
    pricing_fingerprint: input.pricing.integrity.fingerprint,
    issue_number: 185,
    planned_calls: 16,
    retries: 0,
    replacement_calls: 0,
    attempt_status: "prepared_zero_egress",
  };
  const attemptText = canonicalizeProtocolValueV01(attempt);
  writeExclusiveV01(runRoot, ["authorization.json"], input.manifest.authorization);
  writeTextExclusiveV01(runRoot, ["cohort-attempt.json"], attemptText);
  writeExclusiveV01(runRoot, ["manifest.json"], input.manifest);
  writeExclusiveV01(runRoot, ["call-plan.json"], input.call_plan);
  writeExclusiveV01(runRoot, ["route.json"], input.manifest.route);
  writeExclusiveV01(runRoot, ["pricing.json"], input.pricing);

  let consumed = false;
  let nextCall = 0;
  let nextBlock = 0;
  return {
    run_root: runRoot,
    relative_run_root: path.relative(repositoryRoot, runRoot).split(path.sep).join("/"),
    attempt_fingerprint: createProtocolSha256V01(attemptText),
    consume_authorization() {
      if (consumed) return;
      writeExclusiveV01(runRoot, ["authorization-consumed.json"], {
        consumption_version: "operational_reentry_matched_cohort_authorization_consumption.v0.1",
        cohort_id: input.manifest.cohort_id,
        authorization_fingerprint: input.manifest.authorization.integrity.fingerprint,
        first_provider_egress_attempt_consumes_authorization: true,
        retries_authorized: false,
        replacements_authorized: false,
        further_cohort_authorized: false,
      });
      consumed = true;
    },
    append_call(call) {
      if (
        call.call_order !== nextCall ||
        input.call_plan.entries[nextCall]?.call_slot_id !== call.call_slot_id ||
        call.route_fingerprint !== input.manifest.route.integrity_fingerprint ||
        call.pricing_fingerprint !== input.pricing.integrity.fingerprint
      ) failV01("operational_reentry_artifact_call_order_invalid");
      writeExclusiveV01(
        runRoot,
        ["calls", `${String(nextCall).padStart(2, "0")}.json`],
        call,
      );
      nextCall += 1;
    },
    append_block(block) {
      if (
        block.repeat_block !== nextBlock ||
        nextCall < (nextBlock + 1) * 4
      ) failV01("operational_reentry_artifact_block_order_invalid");
      writeExclusiveV01(
        runRoot,
        ["checkpoints", `block-${nextBlock}.json`],
        block,
      );
      nextBlock += 1;
    },
    finalize(resultInput) {
      const result = validateOperationalReentryMatchedCohortExecutionResultV01(resultInput);
      if (
        result.manifest.integrity.fingerprint !== input.manifest.integrity.fingerprint ||
        result.call_plan.integrity.fingerprint !== input.call_plan.integrity.fingerprint ||
        result.pricing.integrity.fingerprint !== input.pricing.integrity.fingerprint ||
        result.calls.length !== nextCall ||
        result.block_evaluations.length !== nextBlock
      ) failV01("operational_reentry_artifact_finalize_prefix_invalid");
      writeExclusiveV01(runRoot, ["report.json"], result.report);
      writeExclusiveV01(runRoot, ["terminal.json"], {
        terminal_version: "operational_reentry_matched_cohort_terminal.v0.1",
        cohort_id: result.manifest.cohort_id,
        result_kind: result.result_kind,
        terminal_calls: result.calls.length,
        completed_blocks: result.block_evaluations.filter((block) => block.status === "complete").length,
        authorization_consumed: consumed,
        retry_authorized: false,
        replacement_authorized: false,
        further_cohort_authorized: false,
      });
      const artifacts = readArtifactFingerprintsV01(runRoot);
      const index = {
        index_version: "operational_reentry_matched_cohort_artifact_index.v0.1",
        cohort_id: result.manifest.cohort_id,
        cohort_fingerprint: result.manifest.integrity.fingerprint,
        source_repository_head_sha: result.manifest.source_repository_head_sha,
        result_kind: result.result_kind,
        authorization_consumed: consumed,
        artifacts,
        raw_prompt_persisted: false,
        raw_provider_response_persisted: false,
        hidden_reasoning_persisted: false,
        credentials_or_secrets_persisted: false,
        private_absolute_paths_persisted: false,
        product_database_rows_persisted: false,
        core_records_persisted: false,
        task_context_packet_variants_persisted: false,
        proposals_decisions_transitions_or_policy_persisted: false,
        tracked_repository_files_written: false,
      };
      const indexText = canonicalizeProtocolValueV01(index);
      const indexFingerprint = createProtocolSha256V01(indexText);
      writeTextExclusiveV01(runRoot, ["artifact-index.json"], indexText);
      const summary = validateOperationalReentryMatchedCohortArtifactsV01({
        repository_root: repositoryRoot,
        run_root: runRoot,
      });
      if (summary.artifact_index_fingerprint !== indexFingerprint) {
        failV01("operational_reentry_artifact_index_fingerprint_invalid");
      }
      return {
        ...summary,
        report_fingerprint: result.report.integrity.fingerprint,
        cohort_fingerprint: result.manifest.integrity.fingerprint,
      };
    },
  };
}

export function assertOperationalReentryMatchedCohortReplacementIdentityAvailableV02(input: {
  repository_root: string;
  cohort_id: string;
  relative_run_root: string;
}): void {
  const repositoryRoot = requireRepositoryRootV01(input.repository_root);
  if (
    input.cohort_id === ACGC_E2_HISTORICAL_COHORT_ID_V01 ||
    input.relative_run_root === ACGC_E2_HISTORICAL_RUN_ROOT_V01 ||
    input.relative_run_root.endsWith("/issue-185")
  ) {
    failV01("operational_reentry_historical_cohort_identity_reuse_refused");
  }
  const candidate = path.resolve(repositoryRoot, input.relative_run_root);
  assertContainedV01(repositoryRoot, candidate);
  if (
    !input.relative_run_root.startsWith(
      ".augnes-lab/operational-reentry-matched-cohorts/",
    ) ||
    existsSync(candidate)
  ) {
    failV01("operational_reentry_replacement_identity_collision_refused");
  }
}

export function validateOperationalReentryMatchedCohortArtifactsV01(input: {
  repository_root: string;
  run_root: string;
}): OperationalReentryMatchedCohortArtifactSummaryV01 {
  const repositoryRoot = requireRepositoryRootV01(input.repository_root);
  const runRoot = realpathSync(input.run_root);
  assertContainedV01(repositoryRoot, runRoot);
  if (!runRoot.includes(`${path.sep}.augnes-lab${path.sep}operational-reentry-matched-cohorts${path.sep}`)) {
    failV01("operational_reentry_artifact_root_invalid");
  }
  const indexPath = path.join(runRoot, "artifact-index.json");
  if (!existsSync(indexPath)) failV01("operational_reentry_artifact_index_missing");
  const indexText = readFileSync(indexPath, "utf8").trimEnd();
  const index = JSON.parse(indexText) as {
    result_kind: "complete" | "incomplete";
    authorization_consumed: boolean;
    cohort_fingerprint: string;
    artifacts: Array<{ path: string; fingerprint: string }>;
    raw_prompt_persisted: false;
    raw_provider_response_persisted: false;
    hidden_reasoning_persisted: false;
    credentials_or_secrets_persisted: false;
    private_absolute_paths_persisted: false;
    product_database_rows_persisted: false;
    core_records_persisted: false;
    task_context_packet_variants_persisted: false;
    proposals_decisions_transitions_or_policy_persisted: false;
    tracked_repository_files_written: false;
  };
  const actual = readArtifactFingerprintsV01(runRoot).filter(
    (entry) => entry.path !== "artifact-index.json",
  );
  if (
    canonicalizeProtocolValueV01(actual) !== canonicalizeProtocolValueV01(index.artifacts) ||
    index.raw_prompt_persisted !== false ||
    index.raw_provider_response_persisted !== false ||
    index.hidden_reasoning_persisted !== false ||
    index.credentials_or_secrets_persisted !== false ||
    index.private_absolute_paths_persisted !== false ||
    index.product_database_rows_persisted !== false ||
    index.core_records_persisted !== false ||
    index.task_context_packet_variants_persisted !== false ||
    index.proposals_decisions_transitions_or_policy_persisted !== false ||
    index.tracked_repository_files_written !== false
  ) failV01("operational_reentry_artifact_index_invalid");
  const report = JSON.parse(readFileSync(path.join(runRoot, "report.json"), "utf8")) as {
    integrity: { fingerprint: string };
  };
  return {
    relative_run_root: path.relative(repositoryRoot, runRoot).split(path.sep).join("/"),
    result_kind: index.result_kind,
    artifact_count: actual.length + 1,
    artifact_index_fingerprint: createProtocolSha256V01(indexText),
    report_fingerprint: report.integrity.fingerprint,
    cohort_fingerprint: index.cohort_fingerprint,
    authorization_consumed: index.authorization_consumed,
    tracked_repository_files_written: false,
    product_database_writes: 0,
    core_writes: 0,
  };
}

function readArtifactFingerprintsV01(runRoot: string) {
  const walk = (directory: string): string[] => readdirSync(directory).flatMap((entry) => {
    const target = path.join(directory, entry);
    const stat = lstatSync(target);
    if (stat.isSymbolicLink()) failV01("operational_reentry_artifact_symlink_refused");
    return stat.isDirectory() ? walk(target) : [target];
  });
  return walk(runRoot).map((file) => {
    const text = readFileSync(file, "utf8").trimEnd();
    return {
      path: path.relative(runRoot, file).split(path.sep).join("/"),
      fingerprint: createProtocolSha256V01(text),
    };
  }).sort((left, right) => left.path.localeCompare(right.path, "en"));
}

function requireRepositoryRootV01(input: string): string {
  if (!path.isAbsolute(input)) failV01("operational_reentry_repository_root_invalid");
  const root = realpathSync(input);
  const ignore = readFileSync(path.join(root, ".gitignore"), "utf8");
  if (!ignore.split(/\r?\n/u).map((line) => line.trim()).includes(".augnes-lab/")) {
    failV01("operational_reentry_artifact_root_not_ignored");
  }
  return root;
}

function safeSegmentV01(value: string): string {
  const segment = value.replaceAll(":", "_");
  if (!SAFE_SEGMENT.test(segment) || segment === "." || segment === "..") {
    failV01("operational_reentry_artifact_segment_invalid");
  }
  return segment;
}

function writeExclusiveV01(runRoot: string, segments: string[], value: unknown): void {
  writeTextExclusiveV01(runRoot, segments, canonicalizeProtocolValueV01(value));
}

function writeTextExclusiveV01(runRoot: string, segments: string[], text: string): void {
  for (const segment of segments) safeSegmentV01(segment);
  const target = path.join(runRoot, ...segments);
  assertContainedV01(runRoot, target);
  ensureDirectoryChainV01(runRoot, path.dirname(target));
  if (existsSync(target)) failV01("operational_reentry_artifact_overwrite_refused");
  const temporary = `${target}.tmp`;
  if (existsSync(temporary)) failV01("operational_reentry_artifact_stale_temporary");
  const descriptor = openSync(temporary, "wx", 0o600);
  try {
    writeFileSync(descriptor, `${text}\n`, { encoding: "utf8" });
    fsyncSync(descriptor);
  } finally {
    closeSync(descriptor);
  }
  renameSync(temporary, target);
}

function ensureDirectoryChainV01(baseInput: string, targetInput: string): void {
  const base = realpathSync(baseInput);
  assertContainedV01(base, targetInput);
  let current = base;
  for (const segment of path.relative(base, targetInput).split(path.sep).filter(Boolean)) {
    safeSegmentV01(segment);
    current = path.join(current, segment);
    if (existsSync(current)) {
      const stat = lstatSync(current);
      if (stat.isSymbolicLink() || !stat.isDirectory()) {
        failV01("operational_reentry_artifact_directory_invalid");
      }
    } else {
      mkdirSync(current, { mode: 0o700 });
    }
  }
}

function assertContainedV01(baseInput: string, targetInput: string): void {
  const relative = path.relative(baseInput, targetInput);
  if (
    relative === ".." ||
    relative.startsWith(`..${path.sep}`) ||
    path.isAbsolute(relative)
  ) failV01("operational_reentry_artifact_path_escape");
}

function failV01(code: string): never {
  throw new OperationalReentryMatchedCohortArtifactErrorV01(code);
}
