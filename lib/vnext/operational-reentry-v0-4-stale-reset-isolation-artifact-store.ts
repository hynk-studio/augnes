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
  projectOperationalReentryV04StaleResetIsolationPlanForArtifactV01,
} from "@/lib/vnext/operational-reentry-v0-4-stale-reset-isolation-cohort";
import {
  canonicalizeProtocolValueV01,
  createProtocolSha256V01,
} from "@/lib/vnext/protocol-primitives";
import {
  OPERATIONAL_REENTRY_V04_STALE_RESET_ISOLATION_ARTIFACT_INDEX_VERSION_V01,
  type OperationalReentryV04StaleResetIsolationAuthorizationV01,
  type OperationalReentryV04StaleResetIsolationBlockEvaluationV01,
  type OperationalReentryV04StaleResetIsolationCallTerminalV01,
  type OperationalReentryV04StaleResetIsolationExecutionResultV01,
  type OperationalReentryV04StaleResetIsolationManifestV01,
  type OperationalReentryV04StaleResetIsolationPlanV01,
  type OperationalReentryV04StaleResetIsolationPricingV01,
} from "@/types/vnext/operational-reentry-v0-4-stale-reset-isolation-cohort";

const SAFE_SEGMENT_V01 = /^[A-Za-z0-9._-]{1,200}$/u;
const SHA256_V01 = /^sha256:[0-9a-f]{64}$/u;

export const OPERATIONAL_REENTRY_V04_STALE_RESET_ISOLATION_ARTIFACT_NAMESPACE_V01 =
  ".augnes-lab/operational-reentry-v04-stale-reset-isolation-cohorts" as const;
export const OPERATIONAL_REENTRY_V04_STALE_RESET_ISOLATION_CONSUMPTION_VERSION_V01 =
  "operational_reentry_v04_stale_reset_isolation_authorization_consumption.v0.1" as const;

export class OperationalReentryV04StaleResetIsolationArtifactErrorV01 extends Error {
  constructor(readonly code: string) {
    super(code);
    this.name = "OperationalReentryV04StaleResetIsolationArtifactErrorV01";
  }
}

export interface OperationalReentryV04StaleResetIsolationAttemptJournalV01 {
  readonly run_root: string;
  readonly relative_run_root: string;
  readonly consumption_marker_path: string;
  readonly authorization_consumed: boolean;
  consume_authorization(): void;
  append_call(call: OperationalReentryV04StaleResetIsolationCallTerminalV01): void;
  append_block(block: OperationalReentryV04StaleResetIsolationBlockEvaluationV01): void;
  finalize(
    result: OperationalReentryV04StaleResetIsolationExecutionResultV01,
  ): OperationalReentryV04StaleResetIsolationArtifactSummaryV01;
}

export interface OperationalReentryV04StaleResetIsolationArtifactSummaryV01 {
  relative_run_root: string;
  completion_status: "complete" | "incomplete";
  artifact_count: number;
  artifact_index_fingerprint: string;
  report_fingerprint: string;
  cohort_fingerprint: string;
  authorization_consumed: boolean;
  tracked_repository_files_written: false;
  product_database_writes: 0;
  core_writes: 0;
}

export function buildOperationalReentryV04StaleResetIsolationArtifactFamilyContractV01() {
  const payload = {
    artifact_index_version:
      OPERATIONAL_REENTRY_V04_STALE_RESET_ISOLATION_ARTIFACT_INDEX_VERSION_V01,
    namespace:
      OPERATIONAL_REENTRY_V04_STALE_RESET_ISOLATION_ARTIFACT_NAMESPACE_V01,
    consumption_version:
      OPERATIONAL_REENTRY_V04_STALE_RESET_ISOLATION_CONSUMPTION_VERSION_V01,
    preparation_consumes_authorization: false as const,
    first_provider_egress_consumes_globally_before_transport: true as const,
    partial_consumption_remains_consumed: true as const,
    retries: 0 as const,
    replacements: 0 as const,
    second_cohort_under_same_authorization: false as const,
    historical_namespaces_rejected: true as const,
    append_only: true as const,
    public_safe_structured_material_only: true as const,
    product_database_writes: 0 as const,
    core_writes: 0 as const,
  };
  return {
    ...payload,
    integrity: {
      algorithm: "sha256" as const,
      canonicalization: "augnes-json-c14n-v0_1" as const,
      fingerprint_scope:
        "operational_reentry_v04_stale_reset_isolation_artifact_family_contract_without_integrity_fingerprint",
      fingerprint: createProtocolSha256V01(
        canonicalizeProtocolValueV01(payload),
      ),
    },
  };
}

export function assertOperationalReentryV04StaleResetIsolationAuthorizationUnusedV01(
  input: {
    repository_root: string;
    authorization_fingerprint: string;
  },
): void {
  if (!SHA256_V01.test(input.authorization_fingerprint)) {
    failV01("operational_reentry_v04_stale_reset_authorization_fingerprint_invalid");
  }
  const repositoryRoot = requireRepositoryRootV01(input.repository_root);
  const marker = consumptionMarkerPathV01(
    repositoryRoot,
    input.authorization_fingerprint,
  );
  if (existsSync(marker)) {
    failV01("operational_reentry_v04_stale_reset_authorization_already_consumed");
  }
}

export function assertOperationalReentryV04StaleResetIsolationIdentityAvailableV01(
  input: {
    repository_root: string;
    cohort_id: string;
    future_live_issue_number: number;
  },
): void {
  const repositoryRoot = requireRepositoryRootV01(input.repository_root);
  if (
    !Number.isSafeInteger(input.future_live_issue_number) ||
    input.future_live_issue_number <= 237
  ) {
    failV01("operational_reentry_v04_stale_reset_future_live_issue_invalid");
  }
  const cohortSegment = safeSegmentV01(input.cohort_id);
  const issueSegment = safeSegmentV01(`issue-${input.future_live_issue_number}`);
  const relative = path.posix.join(
    OPERATIONAL_REENTRY_V04_STALE_RESET_ISOLATION_ARTIFACT_NAMESPACE_V01,
    cohortSegment,
    issueSegment,
  );
  assertHistoricalNamespaceNotReusedV01(relative);
  const runRoot = path.resolve(repositoryRoot, ...relative.split("/"));
  assertContainedV01(repositoryRoot, runRoot);
  if (existsSync(runRoot)) {
    failV01("operational_reentry_v04_stale_reset_artifact_collision");
  }
}

export function beginOperationalReentryV04StaleResetIsolationAttemptV01(input: {
  repository_root: string;
  authorization: OperationalReentryV04StaleResetIsolationAuthorizationV01;
  manifest: OperationalReentryV04StaleResetIsolationManifestV01;
  plan: OperationalReentryV04StaleResetIsolationPlanV01;
  pricing: OperationalReentryV04StaleResetIsolationPricingV01;
}): OperationalReentryV04StaleResetIsolationAttemptJournalV01 {
  const repositoryRoot = requireRepositoryRootV01(input.repository_root);
  if (
    input.authorization.integrity.fingerprint !==
      input.manifest.authorization_fingerprint ||
    input.authorization.future_live_issue_number !==
      input.manifest.future_live_issue_number ||
    input.authorization.exact_merged_source_head !==
      input.manifest.source_repository_head_sha ||
    input.plan.integrity.fingerprint !== input.manifest.plan_fingerprint ||
    input.pricing.integrity.fingerprint !== input.manifest.pricing_fingerprint
  ) {
    failV01("operational_reentry_v04_stale_reset_artifact_cross_link_invalid");
  }
  assertOperationalReentryV04StaleResetIsolationAuthorizationUnusedV01({
    repository_root: repositoryRoot,
    authorization_fingerprint: input.authorization.integrity.fingerprint,
  });
  assertOperationalReentryV04StaleResetIsolationIdentityAvailableV01({
    repository_root: repositoryRoot,
    cohort_id: input.manifest.cohort_id,
    future_live_issue_number: input.manifest.future_live_issue_number,
  });

  const artifactRoot = path.join(
    repositoryRoot,
    ...OPERATIONAL_REENTRY_V04_STALE_RESET_ISOLATION_ARTIFACT_NAMESPACE_V01.split(
      "/",
    ),
  );
  ensureDirectoryChainV01(repositoryRoot, artifactRoot);
  const runRoot = path.join(
    artifactRoot,
    safeSegmentV01(input.manifest.cohort_id),
    safeSegmentV01(`issue-${input.manifest.future_live_issue_number}`),
  );
  ensureDirectoryChainV01(repositoryRoot, runRoot);
  const marker = consumptionMarkerPathV01(
    repositoryRoot,
    input.authorization.integrity.fingerprint,
  );
  const attempt = {
    attempt_version:
      "operational_reentry_v04_stale_reset_isolation_attempt.v0.1",
    cohort_id: input.manifest.cohort_id,
    future_live_issue_number: input.manifest.future_live_issue_number,
    source_repository_head_sha: input.manifest.source_repository_head_sha,
    authorization_fingerprint: input.authorization.integrity.fingerprint,
    manifest_fingerprint: input.manifest.integrity.fingerprint,
    plan_fingerprint: input.plan.integrity.fingerprint,
    pricing_fingerprint: input.pricing.integrity.fingerprint,
    planned_calls: 16,
    maximum_parallel_provider_calls: 1,
    retries: 0,
    replacement_calls: 0,
    attempt_status: "prepared_zero_egress",
    authorization_consumed: false,
  } as const;
  writeExclusiveV01(runRoot, ["authorization.json"], input.authorization);
  writeExclusiveV01(runRoot, ["attempt.json"], attempt);
  writeExclusiveV01(runRoot, ["manifest.json"], input.manifest);
  writeExclusiveV01(
    runRoot,
    ["plan.json"],
    projectOperationalReentryV04StaleResetIsolationPlanForArtifactV01(
      input.plan,
    ),
  );
  writeExclusiveV01(runRoot, ["pricing.json"], input.pricing);

  let consumed = false;
  let nextCall = 0;
  let nextBlock = 0;
  return {
    run_root: runRoot,
    relative_run_root: normalizeRelativeV01(repositoryRoot, runRoot),
    consumption_marker_path: normalizeRelativeV01(repositoryRoot, marker),
    get authorization_consumed() {
      return consumed;
    },
    consume_authorization() {
      if (consumed || existsSync(marker)) {
        failV01("operational_reentry_v04_stale_reset_authorization_already_consumed");
      }
      const markerValue = {
        consumption_version:
          OPERATIONAL_REENTRY_V04_STALE_RESET_ISOLATION_CONSUMPTION_VERSION_V01,
        authorization_fingerprint:
          input.authorization.integrity.fingerprint,
        cohort_id: input.manifest.cohort_id,
        future_live_issue_number: input.manifest.future_live_issue_number,
        first_future_provider_egress_attempt_consumes_globally: true,
        partial_consumption_remains_consumed: true,
        retries_authorized: false,
        replacements_authorized: false,
        second_cohort_authorized: false,
        replication_authorized: false,
        policy_authorized: false,
        stage_7_authorized: false,
      } as const;
      writeAtomicConsumptionMarkerV01(repositoryRoot, marker, markerValue);
      consumed = true;
      writeExclusiveV01(runRoot, ["authorization-consumed.json"], markerValue);
    },
    append_call(call) {
      if (
        call.call_order !== nextCall ||
        input.plan.entries[nextCall]?.call_slot_id !== call.call_slot_id ||
        call.request_family_kind !==
          "operational_reentry_v04_stale_reset_isolation_cohort"
      ) {
        failV01("operational_reentry_v04_stale_reset_artifact_call_order_invalid");
      }
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
      ) {
        failV01("operational_reentry_v04_stale_reset_artifact_block_order_invalid");
      }
      writeExclusiveV01(
        runRoot,
        ["checkpoints", `block-${nextBlock}.json`],
        block,
      );
      nextBlock += 1;
    },
    finalize(result) {
      if (
        result.manifest.integrity.fingerprint !==
          input.manifest.integrity.fingerprint ||
        result.plan.integrity.fingerprint !== input.plan.integrity.fingerprint ||
        result.pricing.integrity.fingerprint !==
          input.pricing.integrity.fingerprint ||
        result.calls.length !== nextCall ||
        result.blocks.length !== nextBlock ||
        result.report.authorization_consumed !== consumed
      ) {
        failV01("operational_reentry_v04_stale_reset_artifact_finalize_prefix_invalid");
      }
      writeExclusiveV01(runRoot, ["report.json"], result.report);
      writeExclusiveV01(runRoot, ["terminal.json"], {
        terminal_version:
          "operational_reentry_v04_stale_reset_isolation_terminal.v0.1",
        cohort_id: input.manifest.cohort_id,
        completion_status: result.report.completion_status,
        terminal_calls: result.calls.length,
        completed_blocks: result.report.complete_blocks,
        authorization_consumed: consumed,
        retry_authorized: false,
        replacement_authorized: false,
        second_cohort_authorized: false,
      });
      const artifacts = readArtifactFingerprintsV01(runRoot);
      const index = {
        index_version:
          OPERATIONAL_REENTRY_V04_STALE_RESET_ISOLATION_ARTIFACT_INDEX_VERSION_V01,
        cohort_id: input.manifest.cohort_id,
        cohort_fingerprint: input.manifest.integrity.fingerprint,
        authorization_fingerprint:
          input.authorization.integrity.fingerprint,
        source_repository_head_sha: input.manifest.source_repository_head_sha,
        completion_status: result.report.completion_status,
        authorization_consumed: consumed,
        artifacts,
        raw_prompt_persisted: false,
        raw_request_body_persisted: false,
        raw_provider_response_persisted: false,
        raw_provider_error_persisted: false,
        hidden_reasoning_persisted: false,
        credentials_or_full_headers_persisted: false,
        private_absolute_paths_persisted: false,
        product_database_rows_persisted: false,
        core_records_persisted: false,
        task_context_packet_variants_persisted: false,
        proposals_decisions_transitions_or_policy_persisted: false,
        scalar_rank_winner_persisted: false,
        tracked_repository_files_written: false,
      } as const;
      writeExclusiveV01(runRoot, ["artifact-index.json"], index);
      return validateOperationalReentryV04StaleResetIsolationArtifactsV01({
        repository_root: repositoryRoot,
        run_root: runRoot,
      });
    },
  };
}

export function validateOperationalReentryV04StaleResetIsolationArtifactsV01(
  input: { repository_root: string; run_root: string },
): OperationalReentryV04StaleResetIsolationArtifactSummaryV01 {
  const repositoryRoot = requireRepositoryRootV01(input.repository_root);
  const runRoot = realpathSync(input.run_root);
  assertContainedV01(repositoryRoot, runRoot);
  const relative = normalizeRelativeV01(repositoryRoot, runRoot);
  if (
    !relative.startsWith(
      `${OPERATIONAL_REENTRY_V04_STALE_RESET_ISOLATION_ARTIFACT_NAMESPACE_V01}/`,
    )
  ) {
    failV01("operational_reentry_v04_stale_reset_artifact_root_invalid");
  }
  assertHistoricalNamespaceNotReusedV01(relative);
  const indexPath = path.join(runRoot, "artifact-index.json");
  if (!existsSync(indexPath)) {
    failV01("operational_reentry_v04_stale_reset_artifact_index_missing");
  }
  const indexText = readFileSync(indexPath, "utf8").trimEnd();
  assertOperationalReentryV04StaleResetIsolationPublicSafeArtifactV01(
    JSON.parse(indexText),
  );
  const index = JSON.parse(indexText) as {
    completion_status: "complete" | "incomplete";
    authorization_consumed: boolean;
    cohort_fingerprint: string;
    authorization_fingerprint: string;
    artifacts: Array<{ path: string; fingerprint: string }>;
    raw_prompt_persisted: false;
    raw_request_body_persisted: false;
    raw_provider_response_persisted: false;
    raw_provider_error_persisted: false;
    hidden_reasoning_persisted: false;
    credentials_or_full_headers_persisted: false;
    private_absolute_paths_persisted: false;
    product_database_rows_persisted: false;
    core_records_persisted: false;
    task_context_packet_variants_persisted: false;
    proposals_decisions_transitions_or_policy_persisted: false;
    scalar_rank_winner_persisted: false;
    tracked_repository_files_written: false;
  };
  const actual = readArtifactFingerprintsV01(runRoot).filter(
    (entry) => entry.path !== "artifact-index.json",
  );
  if (
    canonicalizeProtocolValueV01(actual) !==
      canonicalizeProtocolValueV01(index.artifacts) ||
    index.raw_prompt_persisted !== false ||
    index.raw_request_body_persisted !== false ||
    index.raw_provider_response_persisted !== false ||
    index.raw_provider_error_persisted !== false ||
    index.hidden_reasoning_persisted !== false ||
    index.credentials_or_full_headers_persisted !== false ||
    index.private_absolute_paths_persisted !== false ||
    index.product_database_rows_persisted !== false ||
    index.core_records_persisted !== false ||
    index.task_context_packet_variants_persisted !== false ||
    index.proposals_decisions_transitions_or_policy_persisted !== false ||
    index.scalar_rank_winner_persisted !== false ||
    index.tracked_repository_files_written !== false
  ) {
    failV01("operational_reentry_v04_stale_reset_artifact_index_invalid");
  }
  const manifest = JSON.parse(
    readFileSync(path.join(runRoot, "manifest.json"), "utf8"),
  ) as {
    authorization_fingerprint: string;
    integrity: { fingerprint: string };
  };
  const report = JSON.parse(
    readFileSync(path.join(runRoot, "report.json"), "utf8"),
  ) as { integrity: { fingerprint: string } };
  if (
    manifest.integrity.fingerprint !== index.cohort_fingerprint ||
    manifest.authorization_fingerprint !== index.authorization_fingerprint
  ) {
    failV01("operational_reentry_v04_stale_reset_artifact_cross_link_invalid");
  }
  return {
    relative_run_root: relative,
    completion_status: index.completion_status,
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

export function assertOperationalReentryV04StaleResetIsolationPublicSafeArtifactV01(
  value: unknown,
): void {
  const forbiddenKeys = new Set([
    "api_key",
    "authorization",
    "cookie",
    "cookies",
    "full_headers",
    "headers",
    "raw_prompt",
    "raw_prompts",
    "raw_request",
    "raw_request_body",
    "raw_response",
    "raw_provider_response",
    "raw_provider_error",
    "raw_output_text",
    "hidden_reasoning",
    "environment",
    "environment_dump",
    "private_absolute_path",
    "product_row",
    "core_record",
    "task_context_packet",
    "proposal",
    "review_decision",
    "transition",
    "policy",
    "score",
    "scalar_fitness",
    "rank",
    "winner",
    "promotion_state",
  ]);
  const scan = (candidate: unknown, key: string | null): void => {
    if (
      key !== null &&
      forbiddenKeys.has(key.toLowerCase()) &&
      candidate !== false &&
      candidate !== null &&
      candidate !== 0
    ) {
      failV01("operational_reentry_v04_stale_reset_forbidden_artifact_material");
    }
    if (typeof candidate === "string") {
      if (
        /(?:^|\s)(?:sk-[A-Za-z0-9_-]{16,}|Bearer\s+[A-Za-z0-9._-]{8,})/u.test(
          candidate,
        ) ||
        /(?:^|[\s"'])(?:\/Users\/|\/home\/|[A-Za-z]:\\Users\\)/u.test(
          candidate,
        )
      ) {
        failV01("operational_reentry_v04_stale_reset_forbidden_artifact_material");
      }
      return;
    }
    if (Array.isArray(candidate)) {
      candidate.forEach((entry) => scan(entry, null));
      return;
    }
    if (candidate && typeof candidate === "object") {
      for (const [childKey, childValue] of Object.entries(candidate)) {
        scan(childValue, childKey);
      }
    }
  };
  scan(value, null);
}

function consumptionMarkerPathV01(
  repositoryRoot: string,
  authorizationFingerprint: string,
): string {
  const segment = safeSegmentV01(
    authorizationFingerprint.replace("sha256:", "sha256_"),
  );
  const marker = path.join(
    repositoryRoot,
    ...OPERATIONAL_REENTRY_V04_STALE_RESET_ISOLATION_ARTIFACT_NAMESPACE_V01.split(
      "/",
    ),
    "authorization-consumptions",
    `${segment}.json`,
  );
  assertContainedV01(repositoryRoot, marker);
  return marker;
}

function writeAtomicConsumptionMarkerV01(
  repositoryRoot: string,
  marker: string,
  value: unknown,
): void {
  assertOperationalReentryV04StaleResetIsolationPublicSafeArtifactV01(value);
  ensureDirectoryChainV01(repositoryRoot, path.dirname(marker));
  let descriptor: number;
  try {
    descriptor = openSync(marker, "wx", 0o600);
  } catch (error) {
    if (existsSync(marker)) {
      failV01("operational_reentry_v04_stale_reset_authorization_already_consumed");
    }
    throw error;
  }
  try {
    writeFileSync(descriptor, `${canonicalizeProtocolValueV01(value)}\n`, {
      encoding: "utf8",
    });
    fsyncSync(descriptor);
  } finally {
    closeSync(descriptor);
  }
}

function readArtifactFingerprintsV01(runRoot: string) {
  const walk = (directory: string): string[] =>
    readdirSync(directory).flatMap((entry) => {
      const target = path.join(directory, entry);
      const stat = lstatSync(target);
      if (stat.isSymbolicLink()) {
        failV01("operational_reentry_v04_stale_reset_artifact_symlink_refused");
      }
      return stat.isDirectory() ? walk(target) : [target];
    });
  return walk(runRoot)
    .map((file) => {
      const text = readFileSync(file, "utf8").trimEnd();
      assertOperationalReentryV04StaleResetIsolationPublicSafeArtifactV01(
        JSON.parse(text),
      );
      return {
        path: normalizeRelativeV01(runRoot, file),
        fingerprint: createProtocolSha256V01(text),
      };
    })
    .sort((left, right) => left.path.localeCompare(right.path, "en"));
}

function writeExclusiveV01(
  runRoot: string,
  segments: string[],
  value: unknown,
): void {
  assertOperationalReentryV04StaleResetIsolationPublicSafeArtifactV01(value);
  const text = canonicalizeProtocolValueV01(value);
  for (const segment of segments) safeSegmentV01(segment);
  const target = path.join(runRoot, ...segments);
  assertContainedV01(runRoot, target);
  ensureDirectoryChainV01(runRoot, path.dirname(target));
  if (existsSync(target)) {
    failV01("operational_reentry_v04_stale_reset_artifact_overwrite_refused");
  }
  const temporary = `${target}.tmp`;
  if (existsSync(temporary)) {
    failV01("operational_reentry_v04_stale_reset_artifact_stale_temporary");
  }
  const descriptor = openSync(temporary, "wx", 0o600);
  try {
    writeFileSync(descriptor, `${text}\n`, { encoding: "utf8" });
    fsyncSync(descriptor);
  } finally {
    closeSync(descriptor);
  }
  renameSync(temporary, target);
}

function requireRepositoryRootV01(input: string): string {
  if (!path.isAbsolute(input)) {
    failV01("operational_reentry_v04_stale_reset_repository_root_invalid");
  }
  const root = realpathSync(input);
  const ignore = readFileSync(path.join(root, ".gitignore"), "utf8");
  if (
    !ignore
      .split(/\r?\n/u)
      .map((line) => line.trim())
      .includes(".augnes-lab/")
  ) {
    failV01("operational_reentry_v04_stale_reset_artifact_root_not_ignored");
  }
  return root;
}

function safeSegmentV01(value: string): string {
  const segment = value.replaceAll(":", "_");
  if (
    !SAFE_SEGMENT_V01.test(segment) ||
    segment === "." ||
    segment === ".."
  ) {
    failV01("operational_reentry_v04_stale_reset_artifact_segment_invalid");
  }
  return segment;
}

function ensureDirectoryChainV01(baseInput: string, targetInput: string): void {
  const base = realpathSync(baseInput);
  assertContainedV01(base, targetInput);
  let current = base;
  for (const segment of path
    .relative(base, targetInput)
    .split(path.sep)
    .filter(Boolean)) {
    safeSegmentV01(segment);
    current = path.join(current, segment);
    if (existsSync(current)) {
      const stat = lstatSync(current);
      if (stat.isSymbolicLink() || !stat.isDirectory()) {
        failV01("operational_reentry_v04_stale_reset_artifact_directory_invalid");
      }
    } else {
      mkdirSync(current, { mode: 0o700 });
    }
  }
}

function assertHistoricalNamespaceNotReusedV01(relative: string): void {
  if (
    relative.includes("operational-reentry-matched-cohorts/") ||
    relative.includes("operational-reentry-v04-provider-compatibility-probes/") ||
    relative.includes("operational-reentry-v04-provider-compatibility-probe/") ||
    relative.includes("issue-185") ||
    relative.includes("issue-232") ||
    !relative.startsWith(
      `${OPERATIONAL_REENTRY_V04_STALE_RESET_ISOLATION_ARTIFACT_NAMESPACE_V01}/`,
    )
  ) {
    failV01("operational_reentry_v04_stale_reset_historical_namespace_refused");
  }
}

function assertContainedV01(baseInput: string, targetInput: string): void {
  const relative = path.relative(baseInput, targetInput);
  if (
    relative === ".." ||
    relative.startsWith(`..${path.sep}`) ||
    path.isAbsolute(relative)
  ) {
    failV01("operational_reentry_v04_stale_reset_artifact_path_escape");
  }
}

function normalizeRelativeV01(base: string, target: string): string {
  return path.relative(base, target).split(path.sep).join("/");
}

function failV01(code: string): never {
  throw new OperationalReentryV04StaleResetIsolationArtifactErrorV01(code);
}
