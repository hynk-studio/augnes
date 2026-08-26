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
  ACGC_E2R1_REPLACEMENT_ARTIFACT_NAMESPACE_V01,
  validateOperationalReentryMatchedCohortReplacementExecutionResultV01,
} from "@/lib/vnext/operational-reentry-matched-cohort-replacement";
import {
  ACGC_E2_HISTORICAL_COHORT_ID_V01,
  ACGC_E2_HISTORICAL_RUN_ROOT_V01,
} from "@/lib/vnext/operational-reentry-matched-cohort-artifact-store";
import {
  canonicalizeProtocolValueV01,
  createProtocolSha256V01,
} from "@/lib/vnext/protocol-primitives";
import {
  projectArtifactEvidenceReadPathV01,
  type ArtifactEvidenceReadScopeV01,
} from "@/lib/vnext/migrated-historical-evidence";
import type {
  OperationalReentryMatchedCohortBlockEvaluationV01,
  OperationalReentryMatchedCohortCallTerminalV01,
} from "@/types/vnext/operational-reentry-matched-cohort";
import type {
  OperationalReentryMatchedCohortReplacementExecutionResultV01,
  OperationalReentryMatchedCohortReplacementPreparedV01,
} from "@/types/vnext/operational-reentry-matched-cohort-replacement";

const SAFE_SEGMENT_V01 = /^[A-Za-z0-9._-]{1,200}$/u;
const AUTHORIZATION_CONSUMPTION_DIRECTORY_V01 =
  "authorization-consumptions" as const;

export class OperationalReentryMatchedCohortReplacementArtifactErrorV01 extends Error {
  constructor(readonly code: string) {
    super(code);
    this.name =
      "OperationalReentryMatchedCohortReplacementArtifactErrorV01";
  }
}

export interface OperationalReentryMatchedCohortReplacementArtifactJournalV01 {
  run_root: string;
  relative_run_root: string;
  authorization_fingerprint: string;
  consume_authorization(input: {
    authorization_fingerprint: string;
    replacement_cohort_id: string;
  }): void;
  append_call(call: OperationalReentryMatchedCohortCallTerminalV01): void;
  append_block(
    block: OperationalReentryMatchedCohortBlockEvaluationV01,
  ): void;
  finalize(
    result: OperationalReentryMatchedCohortReplacementExecutionResultV01,
  ): OperationalReentryMatchedCohortReplacementArtifactSummaryV01;
}

export interface OperationalReentryMatchedCohortReplacementArtifactSummaryV01 {
  relative_run_root: string;
  result_kind: "complete" | "incomplete";
  artifact_count: number;
  artifact_index_fingerprint: string;
  report_fingerprint: string;
  replacement_cohort_fingerprint: string;
  authorization_consumed: boolean;
  tracked_repository_files_written: false;
  historical_artifacts_modified: false;
  compatibility_probe_artifacts_modified: false;
  product_database_writes: 0;
  core_writes: 0;
}

export function assertOperationalReentryMatchedCohortReplacementAuthorizationNotConsumedV01(
  input: { repository_root: string; authorization_fingerprint: string },
): void {
  const repositoryRoot = requireRepositoryRootV01(input.repository_root);
  const target = authorizationConsumptionPathV01(
    repositoryRoot,
    input.authorization_fingerprint,
  );
  if (existsSync(target)) {
    failV01("operational_reentry_replacement_authorization_global_collision_refused");
  }
}

export function assertOperationalReentryMatchedCohortReplacementArtifactRootAvailableV01(
  input: { repository_root: string; relative_run_root: string },
): void {
  const repositoryRoot = requireRepositoryRootV01(input.repository_root);
  const normalized = input.relative_run_root.split(path.sep).join("/");
  const lower = normalized.toLowerCase();
  if (
    path.isAbsolute(input.relative_run_root) ||
    !normalized.startsWith(ACGC_E2R1_REPLACEMENT_ARTIFACT_NAMESPACE_V01) ||
    normalized === ACGC_E2_HISTORICAL_RUN_ROOT_V01 ||
    lower.includes("operational-reentry-matched-cohorts/") ||
    lower.includes("operational-reentry-provider-probes/") ||
    lower.includes("/issue-185") ||
    lower.includes(ACGC_E2_HISTORICAL_COHORT_ID_V01.toLowerCase())
  ) {
    failV01("operational_reentry_replacement_historical_or_probe_root_refused");
  }
  const candidate = path.resolve(repositoryRoot, input.relative_run_root);
  assertContainedV01(repositoryRoot, candidate);
  if (existsSync(candidate)) {
    if (lstatSync(candidate).isSymbolicLink()) {
      failV01("operational_reentry_replacement_artifact_symlink_refused");
    }
    failV01("operational_reentry_replacement_artifact_collision_refused");
  }
}

export function beginOperationalReentryMatchedCohortReplacementAttemptV01(
  input: {
    repository_root: string;
    prepared: OperationalReentryMatchedCohortReplacementPreparedV01;
  },
): OperationalReentryMatchedCohortReplacementArtifactJournalV01 {
  const repositoryRoot = requireRepositoryRootV01(input.repository_root);
  assertSafePayloadV01(input.prepared);
  assertOperationalReentryMatchedCohortReplacementAuthorizationNotConsumedV01({
    repository_root: repositoryRoot,
    authorization_fingerprint:
      input.prepared.authorization.integrity.fingerprint,
  });
  const relativeRunRoot =
    `${ACGC_E2R1_REPLACEMENT_ARTIFACT_NAMESPACE_V01}${safeSegmentV01(
      input.prepared.manifest.replacement_cohort_id,
    )}/issue-${input.prepared.authorization.future_live_issue_number}`;
  assertOperationalReentryMatchedCohortReplacementArtifactRootAvailableV01({
    repository_root: repositoryRoot,
    relative_run_root: relativeRunRoot,
  });
  const runRoot = path.join(repositoryRoot, ...relativeRunRoot.split("/"));
  ensureDirectoryChainV01(repositoryRoot, runRoot);

  writeExclusiveV01(
    runRoot,
    ["authorization.json"],
    input.prepared.authorization,
  );
  writeExclusiveV01(runRoot, ["lineage.json"], input.prepared.lineage);
  writeExclusiveV01(
    runRoot,
    ["compatibility-gate.json"],
    input.prepared.compatibility_gate,
  );
  writeExclusiveV01(runRoot, ["manifest.json"], input.prepared.manifest);
  writeExclusiveV01(runRoot, ["route.json"], input.prepared.manifest.route);
  writeExclusiveV01(runRoot, ["pricing.json"], input.prepared.pricing);
  writeExclusiveV01(
    runRoot,
    ["identities.json"],
    buildIdentitiesV01(input.prepared),
  );
  writeExclusiveV01(runRoot, ["call-plan.json"], {
    call_plan_version: input.prepared.call_plan.call_plan_version,
    planned_calls: input.prepared.call_plan.planned_calls,
    repeat_blocks: input.prepared.call_plan.repeat_blocks,
    calls_per_block: input.prepared.call_plan.calls_per_block,
    sealed_order: input.prepared.call_plan.sealed_order,
    max_parallel_provider_calls:
      input.prepared.call_plan.max_parallel_provider_calls,
    retries: input.prepared.call_plan.retries,
    replacement_calls: input.prepared.call_plan.replacement_calls,
    adaptive_stopping: input.prepared.call_plan.adaptive_stopping,
    stateless_invocations: input.prepared.call_plan.stateless_invocations,
    conversation_reuse: input.prepared.call_plan.conversation_reuse,
    thread_reuse: input.prepared.call_plan.thread_reuse,
    previous_response_reuse:
      input.prepared.call_plan.previous_response_reuse,
    entries: input.prepared.call_plan.entries.map((entry) => ({
      call_order: entry.call_order,
      call_slot_id: entry.call_slot_id,
      repeat_block: entry.repeat_block,
      position_in_block: entry.position_in_block,
      arm: entry.arm,
      model_input_fingerprint: entry.model_input_fingerprint,
      provider_visible_input_persisted: false as const,
    })),
    integrity: input.prepared.call_plan.integrity,
  });

  let consumed = false;
  let nextCall = 0;
  let nextBlock = 0;
  return {
    run_root: runRoot,
    relative_run_root: relativeRunRoot,
    authorization_fingerprint:
      input.prepared.authorization.integrity.fingerprint,
    consume_authorization(consumption) {
      if (consumed) {
        failV01("operational_reentry_replacement_authorization_reuse_refused");
      }
      if (
        consumption.authorization_fingerprint !==
          input.prepared.authorization.integrity.fingerprint ||
        consumption.replacement_cohort_id !==
          input.prepared.manifest.replacement_cohort_id
      ) {
        failV01(
          "operational_reentry_replacement_authorization_consumption_mismatch",
        );
      }
      const record = {
        consumption_version:
          "operational_reentry_matched_cohort_replacement_authorization_consumption.v0.1",
        authorization_fingerprint:
          input.prepared.authorization.integrity.fingerprint,
        replacement_cohort_id:
          input.prepared.manifest.replacement_cohort_id,
        request_family_kind: "replacement_cohort",
        first_provider_egress_consumes_authorization: true,
        retries_authorized: false,
        replacement_calls_authorized: false,
        second_replacement_authorized: false,
        further_cohort_authorized: false,
        stage_7_authorized: false,
      };
      writeAuthorizationConsumptionExclusiveV01(
        repositoryRoot,
        input.prepared.authorization.integrity.fingerprint,
        record,
      );
      writeExclusiveV01(runRoot, ["authorization-consumed.json"], record);
      consumed = true;
    },
    append_call(call) {
      assertSafePayloadV01(call);
      const expected = input.prepared.call_plan.entries[nextCall];
      if (
        !expected ||
        call.call_order !== nextCall ||
        call.call_slot_id !== expected.call_slot_id ||
        call.route_fingerprint !==
          input.prepared.manifest.route.integrity_fingerprint ||
        call.pricing_fingerprint !== input.prepared.pricing.integrity.fingerprint ||
        call.operator_intervention.manual_retries !== 0 ||
        call.operator_intervention.replacement_calls !== 0
      ) {
        failV01("operational_reentry_replacement_artifact_call_order_invalid");
      }
      writeExclusiveV01(
        runRoot,
        ["calls", `${String(nextCall).padStart(2, "0")}.json`],
        call,
      );
      nextCall += 1;
    },
    append_block(block) {
      assertSafePayloadV01(block);
      if (
        block.repeat_block !== nextBlock ||
        nextCall < (nextBlock + 1) * 4
      ) {
        failV01("operational_reentry_replacement_artifact_block_order_invalid");
      }
      writeExclusiveV01(
        runRoot,
        ["checkpoints", `block-${nextBlock}.json`],
        block,
      );
      nextBlock += 1;
    },
    finalize(resultInput) {
      const result =
        validateOperationalReentryMatchedCohortReplacementExecutionResultV01(
          resultInput,
        );
      if (
        result.manifest.integrity.fingerprint !==
          input.prepared.manifest.integrity.fingerprint ||
        result.authorization.integrity.fingerprint !==
          input.prepared.authorization.integrity.fingerprint ||
        result.call_plan.integrity.fingerprint !==
          input.prepared.call_plan.integrity.fingerprint ||
        result.pricing.integrity.fingerprint !==
          input.prepared.pricing.integrity.fingerprint ||
        result.calls.length !== nextCall ||
        result.block_evaluations.length !== nextBlock
      ) {
        failV01("operational_reentry_replacement_artifact_finalize_mismatch");
      }
      writeExclusiveV01(runRoot, ["report.json"], result.report);
      writeExclusiveV01(runRoot, ["terminal.json"], {
        terminal_version:
          "operational_reentry_matched_cohort_replacement_terminal.v0.1",
        replacement_cohort_id: result.manifest.replacement_cohort_id,
        result_kind: result.result_kind,
        terminal_calls: result.calls.length,
        completed_blocks: result.block_evaluations.filter(
          (block) => block.status === "complete",
        ).length,
        authorization_consumed: consumed,
        retries: 0,
        replacement_calls: 0,
        second_replacement_authorized: false,
        further_cohort_authorized: false,
        stage_7_authorized: false,
      });
      const artifacts = readArtifactFingerprintsV01(runRoot);
      const index = {
        index_version:
          "operational_reentry_matched_cohort_replacement_artifact_index.v0.1",
        replacement_cohort_id: result.manifest.replacement_cohort_id,
        replacement_cohort_fingerprint: result.manifest.integrity.fingerprint,
        future_live_issue_number:
          result.authorization.future_live_issue_number,
        source_repository_head_sha:
          result.authorization.exact_merged_source_head,
        request_family_kind: "replacement_cohort",
        result_kind: result.result_kind,
        authorization_consumed: consumed,
        report_fingerprint: result.report.integrity.fingerprint,
        artifacts,
        raw_prompt_persisted: false,
        raw_request_body_persisted: false,
        raw_provider_response_persisted: false,
        raw_provider_error_persisted: false,
        hidden_reasoning_persisted: false,
        credentials_or_secrets_persisted: false,
        authorization_header_persisted: false,
        cookies_persisted: false,
        full_headers_persisted: false,
        private_absolute_paths_persisted: false,
        product_database_rows_persisted: false,
        core_records_persisted: false,
        task_context_packet_variants_persisted: false,
        proposals_decisions_transitions_or_policies_persisted: false,
        active_pointer_persisted: false,
        tracked_repository_files_written: false,
        historical_cohort_artifacts_modified: false,
        compatibility_probe_artifacts_modified: false,
      };
      const indexText = canonicalizeProtocolValueV01(index);
      writeTextExclusiveV01(runRoot, ["artifact-index.json"], indexText);
      return validateOperationalReentryMatchedCohortReplacementArtifactsV01({
        repository_root: repositoryRoot,
        run_root: runRoot,
      });
    },
  };
}

export function validateOperationalReentryMatchedCohortReplacementArtifactsV01(
  input: {
    repository_root: string;
    run_root: string;
    read_scope?: ArtifactEvidenceReadScopeV01;
  },
): OperationalReentryMatchedCohortReplacementArtifactSummaryV01 {
  const repositoryRoot = requireRepositoryRootV01(input.repository_root);
  const runRoot = realpathSync(input.run_root);
  assertContainedV01(repositoryRoot, runRoot);
  const physicalRelativeRunRoot = path
    .relative(repositoryRoot, runRoot)
    .split(path.sep)
    .join("/");
  const relativeRunRoot = projectArtifactEvidenceReadPathV01({
    relative_path: physicalRelativeRunRoot,
    active_prefix: ACGC_E2R1_REPLACEMENT_ARTIFACT_NAMESPACE_V01,
    read_scope: input.read_scope,
  });
  if (
    !relativeRunRoot ||
    relativeRunRoot.endsWith("/issue-185") ||
    relativeRunRoot.includes("operational-reentry-provider-probes")
  ) {
    failV01("operational_reentry_replacement_artifact_root_invalid");
  }
  const indexPath = path.join(runRoot, "artifact-index.json");
  if (!existsSync(indexPath)) {
    failV01("operational_reentry_replacement_artifact_index_missing");
  }
  const indexText = readFileSync(indexPath, "utf8").trimEnd();
  const index = JSON.parse(indexText) as {
    result_kind: "complete" | "incomplete";
    authorization_consumed: boolean;
    replacement_cohort_fingerprint: string;
    report_fingerprint: string;
    artifacts: Array<{ path: string; fingerprint: string }>;
    [key: string]: unknown;
  };
  assertSafePayloadV01(index);
  const actual = readArtifactFingerprintsV01(runRoot).filter(
    (entry) => entry.path !== "artifact-index.json",
  );
  if (
    canonicalizeProtocolValueV01(actual) !==
      canonicalizeProtocolValueV01(index.artifacts) ||
    index.request_family_kind !== "replacement_cohort" ||
    index.raw_prompt_persisted !== false ||
    index.raw_request_body_persisted !== false ||
    index.raw_provider_response_persisted !== false ||
    index.raw_provider_error_persisted !== false ||
    index.hidden_reasoning_persisted !== false ||
    index.credentials_or_secrets_persisted !== false ||
    index.authorization_header_persisted !== false ||
    index.cookies_persisted !== false ||
    index.full_headers_persisted !== false ||
    index.private_absolute_paths_persisted !== false ||
    index.product_database_rows_persisted !== false ||
    index.core_records_persisted !== false ||
    index.task_context_packet_variants_persisted !== false ||
    index.proposals_decisions_transitions_or_policies_persisted !== false ||
    index.active_pointer_persisted !== false ||
    index.tracked_repository_files_written !== false ||
    index.historical_cohort_artifacts_modified !== false ||
    index.compatibility_probe_artifacts_modified !== false
  ) {
    failV01("operational_reentry_replacement_artifact_index_invalid");
  }
  const report = JSON.parse(
    readFileSync(path.join(runRoot, "report.json"), "utf8"),
  ) as { integrity: { fingerprint: string } };
  if (report.integrity.fingerprint !== index.report_fingerprint) {
    failV01("operational_reentry_replacement_report_fingerprint_invalid");
  }
  return {
    relative_run_root: relativeRunRoot,
    result_kind: index.result_kind,
    artifact_count: actual.length + 1,
    artifact_index_fingerprint: createProtocolSha256V01(indexText),
    report_fingerprint: index.report_fingerprint,
    replacement_cohort_fingerprint:
      index.replacement_cohort_fingerprint,
    authorization_consumed: index.authorization_consumed,
    tracked_repository_files_written: false,
    historical_artifacts_modified: false,
    compatibility_probe_artifacts_modified: false,
    product_database_writes: 0,
    core_writes: 0,
  };
}

function buildIdentitiesV01(
  prepared: OperationalReentryMatchedCohortReplacementPreparedV01,
) {
  return {
    identity_version:
      "operational_reentry_matched_cohort_replacement_identities.v0.1",
    replacement_cohort_id: prepared.manifest.replacement_cohort_id,
    source_repository_head_sha:
      prepared.manifest.source_repository_head_sha,
    future_live_issue_number: prepared.manifest.future_live_issue_number,
    authorization_fingerprint:
      prepared.authorization.integrity.fingerprint,
    lineage_fingerprint: prepared.lineage.integrity.fingerprint,
    compatibility_gate_fingerprint:
      prepared.compatibility_gate.integrity.fingerprint,
    compatibility_report_fingerprint:
      prepared.compatibility_gate.report_fingerprint,
    compatibility_artifact_index_fingerprint:
      prepared.compatibility_gate.artifact_index_fingerprint,
    case_fingerprint: prepared.case.integrity.fingerprint,
    rubric_fingerprint: prepared.rubric.integrity.fingerprint,
    call_plan_fingerprint: prepared.call_plan.integrity.fingerprint,
    provider_contract_fingerprint:
      prepared.provider_contract.integrity.fingerprint,
    route_fingerprint: prepared.manifest.route.integrity_fingerprint,
    provider_ref: prepared.manifest.route.provider_ref,
    model_ref: prepared.manifest.route.model_ref,
    adapter_implementation_id:
      prepared.manifest.route.adapter_implementation_id,
    adapter_implementation_version:
      prepared.manifest.route.adapter_implementation_version,
    pricing_fingerprint: prepared.pricing.integrity.fingerprint,
    pricing_authority_fingerprint:
      prepared.pricing.gateway_cost_budget.authority.pricing_fingerprint,
    request_family_kind: "replacement_cohort",
    request_family_trace_id: prepared.manifest.request_family_trace_id,
    raw_prompt_persisted: false,
    raw_request_body_persisted: false,
    raw_provider_response_persisted: false,
    hidden_reasoning_persisted: false,
    credentials_or_full_headers_persisted: false,
    private_absolute_paths_persisted: false,
  };
}

function readArtifactFingerprintsV01(runRoot: string) {
  const walk = (directory: string): string[] =>
    readdirSync(directory).flatMap((entry) => {
      const target = path.join(directory, entry);
      const stat = lstatSync(target);
      if (stat.isSymbolicLink()) {
        failV01("operational_reentry_replacement_artifact_symlink_refused");
      }
      return stat.isDirectory() ? walk(target) : [target];
    });
  return walk(runRoot)
    .map((file) => ({
      path: path.relative(runRoot, file).split(path.sep).join("/"),
      fingerprint: createProtocolSha256V01(
        readFileSync(file, "utf8").trimEnd(),
      ),
    }))
    .sort((left, right) => left.path.localeCompare(right.path, "en"));
}

function authorizationConsumptionPathV01(
  repositoryRoot: string,
  authorizationFingerprint: string,
): string {
  const target = path.join(
    repositoryRoot,
    ...ACGC_E2R1_REPLACEMENT_ARTIFACT_NAMESPACE_V01.split("/").filter(Boolean),
    AUTHORIZATION_CONSUMPTION_DIRECTORY_V01,
    `${safeSegmentV01(authorizationFingerprint)}.json`,
  );
  assertContainedV01(repositoryRoot, target);
  return target;
}

function writeAuthorizationConsumptionExclusiveV01(
  repositoryRoot: string,
  authorizationFingerprint: string,
  value: unknown,
): void {
  assertSafePayloadV01(value);
  const target = authorizationConsumptionPathV01(
    repositoryRoot,
    authorizationFingerprint,
  );
  ensureDirectoryChainV01(repositoryRoot, path.dirname(target));
  let descriptor: number;
  try {
    descriptor = openSync(target, "wx", 0o600);
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "EEXIST"
    ) {
      failV01(
        "operational_reentry_replacement_authorization_global_collision_refused",
      );
    }
    throw error;
  }
  try {
    writeFileSync(
      descriptor,
      `${canonicalizeProtocolValueV01(value)}\n`,
      { encoding: "utf8" },
    );
    fsyncSync(descriptor);
  } finally {
    closeSync(descriptor);
  }
}

function writeExclusiveV01(
  runRoot: string,
  segments: string[],
  value: unknown,
): void {
  assertSafePayloadV01(value);
  writeTextExclusiveV01(
    runRoot,
    segments,
    canonicalizeProtocolValueV01(value),
  );
}

function writeTextExclusiveV01(
  runRoot: string,
  segments: string[],
  text: string,
): void {
  segments.forEach(safeSegmentV01);
  const target = path.join(runRoot, ...segments);
  assertContainedV01(runRoot, target);
  ensureDirectoryChainV01(runRoot, path.dirname(target));
  if (existsSync(target)) {
    failV01("operational_reentry_replacement_artifact_overwrite_refused");
  }
  const temporary = `${target}.tmp`;
  if (existsSync(temporary)) {
    failV01("operational_reentry_replacement_artifact_stale_temporary");
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
        failV01("operational_reentry_replacement_artifact_directory_invalid");
      }
    } else {
      mkdirSync(current, { mode: 0o700 });
    }
  }
}

function requireRepositoryRootV01(input: string): string {
  if (!path.isAbsolute(input)) {
    failV01("operational_reentry_replacement_repository_root_invalid");
  }
  const root = realpathSync(input);
  const ignore = readFileSync(path.join(root, ".gitignore"), "utf8");
  if (
    !ignore
      .split(/\r?\n/u)
      .map((line) => line.trim())
      .includes(".augnes-lab/")
  ) {
    failV01("operational_reentry_replacement_artifact_root_not_ignored");
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
    failV01("operational_reentry_replacement_artifact_segment_invalid");
  }
  return segment;
}

function assertContainedV01(baseInput: string, targetInput: string): void {
  const relative = path.relative(baseInput, targetInput);
  if (
    relative === ".." ||
    relative.startsWith(`..${path.sep}`) ||
    path.isAbsolute(relative)
  ) {
    failV01("operational_reentry_replacement_artifact_path_escape");
  }
}

function assertSafePayloadV01(value: unknown): void {
  const visit = (candidate: unknown): void => {
    if (typeof candidate === "string") {
      const lower = candidate.toLowerCase();
      if (
        lower.includes("/users/") ||
        lower.includes("/home/") ||
        /\bsk-[a-z0-9]{8,}/iu.test(candidate) ||
        lower.includes("authorization: bearer") ||
        lower.includes("cookie:")
      ) {
        failV01("operational_reentry_replacement_private_material_refused");
      }
      return;
    }
    if (Array.isArray(candidate)) {
      candidate.forEach(visit);
      return;
    }
    if (typeof candidate !== "object" || candidate === null) return;
    for (const [key, child] of Object.entries(candidate)) {
      const normalized = key.toLowerCase();
      if (
        [
          "request_body",
          "raw_prompt",
          "raw_request",
          "raw_response",
          "raw_provider_message",
          "hidden_reasoning",
          "cookie",
          "cookies",
          "headers",
          "full_headers",
          "credential",
          "credentials",
          "product_rows",
          "core_records",
          "task_context_packet_variants",
          "proposals",
          "decisions",
          "transitions",
          "policies",
          "active_pointer",
        ].includes(normalized)
      ) {
        failV01("operational_reentry_replacement_forbidden_field_refused");
      }
      if (
        (normalized.endsWith("_persisted") ||
          normalized.endsWith("_written") ||
          normalized.endsWith("_modified")) &&
        child !== false
      ) {
        failV01("operational_reentry_replacement_privacy_flag_invalid");
      }
      visit(child);
    }
  };
  visit(value);
}

function failV01(code: string): never {
  throw new OperationalReentryMatchedCohortReplacementArtifactErrorV01(code);
}
