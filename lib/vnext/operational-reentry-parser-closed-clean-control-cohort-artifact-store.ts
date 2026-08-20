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
  projectOperationalReentryParserClosedCleanControlCohortPlanForArtifactV01,
} from "@/lib/vnext/operational-reentry-parser-closed-clean-control-cohort";
import {
  canonicalizeProtocolValueV01,
  createProtocolSha256V01,
} from "@/lib/vnext/protocol-primitives";
import {
  OPERATIONAL_REENTRY_PARSER_CLOSED_CLEAN_CONTROL_COHORT_ARTIFACT_INDEX_VERSION_V01,
  type OperationalReentryParserClosedCleanControlCohortCallTerminalV01,
  type OperationalReentryParserClosedCleanControlCohortExecutionResultV01,
  type OperationalReentryParserClosedCleanControlCohortPreparedV01,
} from "@/types/vnext/operational-reentry-parser-closed-clean-control-cohort";

export const OPERATIONAL_REENTRY_PARSER_CLOSED_CLEAN_CONTROL_COHORT_ARTIFACT_PREFIX_V01 =
  ".augnes-lab/operational-reentry-parser-closed-clean-control-cohorts/" as const;
const AUTHORIZATION_CONSUMPTION_DIRECTORY_V01 =
  "authorization-consumptions" as const;
const SAFE_SEGMENT_V01 = /^[A-Za-z0-9._-]{1,200}$/u;
const SHA256_V01 = /^sha256:[0-9a-f]{64}$/u;

export class OperationalReentryParserClosedCleanControlCohortArtifactErrorV01 extends Error {
  constructor(readonly code: string) {
    super(code);
    this.name =
      "OperationalReentryParserClosedCleanControlCohortArtifactErrorV01";
  }
}

export interface OperationalReentryParserClosedCleanControlCohortArtifactJournalV01 {
  run_root: string;
  relative_run_root: string;
  consume_authorization(input: {
    authorization_fingerprint: string;
    cohort_id: string;
  }): void;
  append_call(
    call: OperationalReentryParserClosedCleanControlCohortCallTerminalV01,
  ): void;
  append_block(
    block: OperationalReentryParserClosedCleanControlCohortExecutionResultV01["block_evaluations"][number],
  ): void;
  finalize(
    result: OperationalReentryParserClosedCleanControlCohortExecutionResultV01,
  ): OperationalReentryParserClosedCleanControlCohortArtifactSummaryV01;
}

export interface OperationalReentryParserClosedCleanControlCohortArtifactSummaryV01 {
  relative_run_root: string;
  completion_status: "complete" | "incomplete";
  artifact_count: number;
  artifact_index_fingerprint: string;
  report_fingerprint: string;
  cohort_fingerprint: string;
  authorization_consumed: boolean;
  tracked_repository_files_written: false;
  historical_artifacts_modified: false;
  product_database_writes: 0;
  core_writes: 0;
}

export function beginOperationalReentryParserClosedCleanControlCohortAttemptV01(
  input: {
    repository_root: string;
    prepared: OperationalReentryParserClosedCleanControlCohortPreparedV01;
    write_run_local_consumption?: (input: {
      run_root: string;
      record: unknown;
    }) => void;
  },
): OperationalReentryParserClosedCleanControlCohortArtifactJournalV01 {
  const repositoryRoot = requireRootV01(input.repository_root);
  assertOperationalReentryParserClosedCleanControlCohortArtifactPayloadSafeV01(
    input.prepared,
  );
  assertOperationalReentryParserClosedCleanControlCohortAuthorizationNotConsumedV01(
    repositoryRoot,
    input.prepared.authorization.integrity.fingerprint,
  );
  const cohortSegment = safeSegmentV01(
    input.prepared.manifest.cohort_id.replaceAll(":", "_"),
  );
  const relativeRunRoot =
    `${OPERATIONAL_REENTRY_PARSER_CLOSED_CLEAN_CONTROL_COHORT_ARTIFACT_PREFIX_V01}${cohortSegment}/issue-${input.prepared.authorization.future_live_issue_number}`;
  assertOperationalReentryParserClosedCleanControlCohortArtifactRootAvailableV01(
    { repository_root: repositoryRoot, relative_run_root: relativeRunRoot },
  );
  const runRoot = path.join(repositoryRoot, ...relativeRunRoot.split("/"));
  ensureDirectoryV01(repositoryRoot, runRoot);
  writeExclusiveV01(runRoot, ["authorization.json"], input.prepared.authorization);
  writeExclusiveV01(runRoot, ["manifest.json"], input.prepared.manifest);
  writeExclusiveV01(
    runRoot,
    ["plan.json"],
    projectOperationalReentryParserClosedCleanControlCohortPlanForArtifactV01(
      input.prepared.plan,
    ),
  );
  writeExclusiveV01(runRoot, ["evaluator-bridge.json"], input.prepared.evaluator_bridge);
  writeExclusiveV01(runRoot, ["identities.json"], {
    identity_version:
      "operational_reentry_parser_closed_clean_control_matched_cohort_identities.v0.1",
    cohort_id: input.prepared.manifest.cohort_id,
    source_repository_head_sha:
      input.prepared.manifest.source_repository_head_sha,
    future_live_issue_number:
      input.prepared.manifest.future_live_issue_number,
    case_fingerprint: input.prepared.plan.case_fingerprint,
    common_task_evidence_fingerprint:
      input.prepared.plan.common_task_evidence_fingerprint,
    plan_fingerprint: input.prepared.plan.integrity.fingerprint,
    evaluator_bridge_fingerprint:
      input.prepared.evaluator_bridge.integrity.fingerprint,
    route_fingerprint: input.prepared.manifest.route.integrity_fingerprint,
    provider_contract_fingerprint:
      input.prepared.provider_contract.integrity.fingerprint,
    adapter_request_route_fingerprint:
      input.prepared.manifest.adapter_request_route_fingerprint,
    pricing_fingerprint: input.prepared.pricing.integrity.fingerprint,
    request_family_kind: "parser_closed_clean_control_cohort",
    issue_216_compatibility_outputs_reused_behaviorally: false,
    raw_prompt_persisted: false,
    raw_request_body_persisted: false,
    raw_provider_response_persisted: false,
    raw_provider_error_persisted: false,
    hidden_reasoning_persisted: false,
    credentials_or_full_headers_persisted: false,
    private_absolute_paths_persisted: false,
  });

  let consumed = false;
  let nextCall = 0;
  let nextBlock = 0;
  return {
    run_root: runRoot,
    relative_run_root: relativeRunRoot,
    consume_authorization(consumption) {
      if (consumed) failV01("parser_closed_clean_control_authorization_reuse_refused");
      if (
        consumption.authorization_fingerprint !==
          input.prepared.authorization.integrity.fingerprint ||
        consumption.cohort_id !== input.prepared.manifest.cohort_id
      ) {
        failV01("parser_closed_clean_control_authorization_consumption_mismatch");
      }
      const record = {
        consumption_version:
          "operational_reentry_parser_closed_clean_control_matched_cohort_authorization_consumption.v0.1",
        authorization_fingerprint:
          input.prepared.authorization.integrity.fingerprint,
        cohort_id: input.prepared.manifest.cohort_id,
        request_family_kind: "parser_closed_clean_control_cohort",
        first_provider_egress_consumes_authorization: true,
        second_transport_authorized: false,
        retries_authorized: false,
        replacements_authorized: false,
        replication_authorized: false,
        policy_authorized: false,
        stage_7_authorized: false,
      };
      // The durable family-global marker is intentionally first. Any later
      // local-journal failure leaves reuse permanently blocked.
      writeAuthorizationConsumptionExclusiveV01(
        repositoryRoot,
        input.prepared.authorization.integrity.fingerprint,
        record,
      );
      if (input.write_run_local_consumption) {
        input.write_run_local_consumption({ run_root: runRoot, record });
      } else {
        writeExclusiveV01(runRoot, ["authorization-consumed.json"], record);
      }
      consumed = true;
    },
    append_call(call) {
      assertOperationalReentryParserClosedCleanControlCohortArtifactPayloadSafeV01(
        call,
      );
      const expected = input.prepared.plan.entries[nextCall];
      if (
        !expected ||
        call.call_order !== nextCall ||
        call.call_slot_id !== expected.call_slot_id ||
        call.arm !== expected.arm ||
        call.repeat_block !== expected.repeat_block ||
        call.request_family_kind !== "parser_closed_clean_control_cohort"
      ) {
        failV01("parser_closed_clean_control_artifact_call_order_invalid");
      }
      writeExclusiveV01(
        runRoot,
        ["calls", `${String(nextCall).padStart(2, "0")}.json`],
        call,
      );
      nextCall += 1;
    },
    append_block(block) {
      if (block.repeat_block !== nextBlock) {
        failV01("parser_closed_clean_control_artifact_block_order_invalid");
      }
      assertOperationalReentryParserClosedCleanControlCohortArtifactPayloadSafeV01(
        block,
      );
      writeExclusiveV01(
        runRoot,
        ["blocks", `${String(nextBlock).padStart(2, "0")}.json`],
        block,
      );
      nextBlock += 1;
    },
    finalize(result) {
      const durableConsumed =
        assertOperationalReentryParserClosedCleanControlCohortAuthorizationConsumptionHistoryCompleteV01(
          {
            repository_root: repositoryRoot,
            run_root: runRoot,
            authorization_fingerprint:
              input.prepared.authorization.integrity.fingerprint,
          },
        );
      if (
        result.manifest.integrity.fingerprint !==
          input.prepared.manifest.integrity.fingerprint ||
        result.plan.integrity.fingerprint !==
          input.prepared.plan.integrity.fingerprint ||
        result.calls.length !== 16 ||
        nextCall !== 16 ||
        result.block_evaluations.length !== 4 ||
        nextBlock !== 4 ||
        result.report.authorization_consumed !== durableConsumed ||
        consumed !== durableConsumed
      ) {
        failV01("parser_closed_clean_control_artifact_finalize_mismatch");
      }
      writeExclusiveV01(runRoot, ["report.json"], result.report);
      const artifacts = readArtifactFingerprintsV01(runRoot);
      const index = {
        index_version:
          OPERATIONAL_REENTRY_PARSER_CLOSED_CLEAN_CONTROL_COHORT_ARTIFACT_INDEX_VERSION_V01,
        cohort_id: result.manifest.cohort_id,
        cohort_fingerprint: result.manifest.integrity.fingerprint,
        report_fingerprint: result.report.integrity.fingerprint,
        source_repository_head_sha:
          result.manifest.source_repository_head_sha,
        future_live_issue_number: result.manifest.future_live_issue_number,
        request_family_kind: "parser_closed_clean_control_cohort",
        completion_status: result.report.completion_status,
        authorization_consumed: durableConsumed,
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
        proposals_decisions_transitions_or_policies_persisted: false,
        scalar_rank_winner_or_promotion_persisted: false,
        issue_216_normalized_outputs_reused_behaviorally: false,
        tracked_repository_files_written: false,
        historical_artifacts_modified: false,
      };
      assertOperationalReentryParserClosedCleanControlCohortArtifactPayloadSafeV01(
        index,
      );
      writeTextExclusiveV01(
        runRoot,
        ["artifact-index.json"],
        canonicalizeProtocolValueV01(index),
      );
      return validateOperationalReentryParserClosedCleanControlCohortArtifactsV01(
        { repository_root: repositoryRoot, run_root: runRoot },
      );
    },
  };
}

export function assertOperationalReentryParserClosedCleanControlCohortAuthorizationNotConsumedV01(
  repositoryRootInput: string,
  authorizationFingerprint: string,
): void {
  const repositoryRoot = requireRootV01(repositoryRootInput);
  if (!SHA256_V01.test(authorizationFingerprint)) {
    failV01("parser_closed_clean_control_authorization_fingerprint_invalid");
  }
  if (existsSync(globalConsumptionPathV01(repositoryRoot, authorizationFingerprint))) {
    failV01("parser_closed_clean_control_authorization_global_collision_refused");
  }
}

export function assertOperationalReentryParserClosedCleanControlCohortArtifactRootAvailableV01(
  input: { repository_root: string; relative_run_root: string },
): void {
  const repositoryRoot = requireRootV01(input.repository_root);
  const normalized = input.relative_run_root.split(path.sep).join("/");
  const lower = normalized.toLowerCase();
  if (
    path.isAbsolute(input.relative_run_root) ||
    !normalized.startsWith(
      OPERATIONAL_REENTRY_PARSER_CLOSED_CLEAN_CONTROL_COHORT_ARTIFACT_PREFIX_V01,
    ) ||
    lower.includes("operational-reentry-parser-closed-provider-probes") ||
    lower.includes("operational-reentry-clean-control-provider-probes") ||
    lower.includes("operational-reentry-matched-cohorts/") ||
    lower.includes("operational-reentry-matched-cohort-replacements") ||
    lower.includes("issue-185") ||
    lower.includes("issue-193") ||
    lower.includes("issue-199") ||
    lower.includes("issue-202") ||
    lower.includes("issue-208") ||
    lower.includes("issue-216")
  ) {
    failV01("parser_closed_clean_control_historical_root_refused");
  }
  const candidate = path.resolve(repositoryRoot, input.relative_run_root);
  assertContainedV01(repositoryRoot, candidate);
  if (existsSync(candidate)) {
    if (lstatSync(candidate).isSymbolicLink()) {
      failV01("parser_closed_clean_control_artifact_symlink_refused");
    }
    failV01("parser_closed_clean_control_artifact_collision_refused");
  }
}

export function assertOperationalReentryParserClosedCleanControlCohortAuthorizationConsumptionHistoryCompleteV01(
  input: {
    repository_root: string;
    run_root: string;
    authorization_fingerprint: string;
  },
): boolean {
  const repositoryRoot = requireRootV01(input.repository_root);
  const runRoot = realpathSync(input.run_root);
  assertContainedV01(repositoryRoot, runRoot);
  const globalExists = existsSync(
    globalConsumptionPathV01(repositoryRoot, input.authorization_fingerprint),
  );
  const localExists = existsSync(path.join(runRoot, "authorization-consumed.json"));
  if (globalExists !== localExists) {
    failV01(
      "parser_closed_clean_control_authorization_consumption_history_incomplete",
    );
  }
  if (globalExists) {
    const globalRecord = readFileSync(
      globalConsumptionPathV01(repositoryRoot, input.authorization_fingerprint),
      "utf8",
    ).trimEnd();
    const localRecord = readFileSync(
      path.join(runRoot, "authorization-consumed.json"),
      "utf8",
    ).trimEnd();
    if (globalRecord !== localRecord) {
      failV01(
        "parser_closed_clean_control_authorization_consumption_history_incomplete",
      );
    }
  }
  return globalExists;
}

export function validateOperationalReentryParserClosedCleanControlCohortArtifactsV01(
  input: { repository_root: string; run_root: string },
): OperationalReentryParserClosedCleanControlCohortArtifactSummaryV01 {
  const repositoryRoot = requireRootV01(input.repository_root);
  const runRoot = realpathSync(input.run_root);
  assertContainedV01(repositoryRoot, runRoot);
  const relativeRunRoot = path.relative(repositoryRoot, runRoot).split(path.sep).join("/");
  if (
    !relativeRunRoot.startsWith(
      OPERATIONAL_REENTRY_PARSER_CLOSED_CLEAN_CONTROL_COHORT_ARTIFACT_PREFIX_V01,
    )
  ) {
    failV01("parser_closed_clean_control_artifact_root_invalid");
  }
  const authorization = readJsonV01(runRoot, "authorization.json") as {
    future_live_issue_number: number;
    exact_merged_source_head: string;
    request_family_kind: string;
    integrity: { fingerprint: string };
  };
  const durableConsumed =
    assertOperationalReentryParserClosedCleanControlCohortAuthorizationConsumptionHistoryCompleteV01(
      {
        repository_root: repositoryRoot,
        run_root: runRoot,
        authorization_fingerprint: authorization.integrity.fingerprint,
      },
    );
  const manifest = readJsonV01(runRoot, "manifest.json") as {
    cohort_id: string;
    future_live_issue_number: number;
    source_repository_head_sha: string;
    request_family_kind: string;
    integrity: { fingerprint: string };
  };
  const report = readJsonV01(runRoot, "report.json") as {
    cohort_id: string;
    completion_status: "complete" | "incomplete";
    authorization_consumed: boolean;
    integrity: { fingerprint: string };
  };
  const indexPath = path.join(runRoot, "artifact-index.json");
  if (!existsSync(indexPath)) failV01("parser_closed_clean_control_artifact_index_missing");
  const indexText = readFileSync(indexPath, "utf8").trimEnd();
  let index: Record<string, any>;
  try {
    index = JSON.parse(indexText) as Record<string, any>;
  } catch {
    failV01("parser_closed_clean_control_artifact_index_invalid");
  }
  assertOperationalReentryParserClosedCleanControlCohortArtifactPayloadSafeV01(index);
  const actual = readArtifactFingerprintsV01(runRoot).filter(
    (artifact) => artifact.path !== "artifact-index.json",
  );
  if (
    indexText !== canonicalizeProtocolValueV01(index) ||
    index.index_version !==
      OPERATIONAL_REENTRY_PARSER_CLOSED_CLEAN_CONTROL_COHORT_ARTIFACT_INDEX_VERSION_V01 ||
    index.cohort_id !== manifest.cohort_id ||
    index.cohort_id !== report.cohort_id ||
    index.cohort_fingerprint !== manifest.integrity.fingerprint ||
    index.report_fingerprint !== report.integrity.fingerprint ||
    index.source_repository_head_sha !== manifest.source_repository_head_sha ||
    index.source_repository_head_sha !== authorization.exact_merged_source_head ||
    index.future_live_issue_number !== manifest.future_live_issue_number ||
    index.future_live_issue_number !== authorization.future_live_issue_number ||
    index.request_family_kind !== "parser_closed_clean_control_cohort" ||
    authorization.request_family_kind !== "parser_closed_clean_control_cohort" ||
    index.completion_status !== report.completion_status ||
    index.authorization_consumed !== durableConsumed ||
    report.authorization_consumed !== durableConsumed ||
    canonicalizeProtocolValueV01(index.artifacts) !==
      canonicalizeProtocolValueV01(actual) ||
    actual.filter((artifact) => artifact.path.startsWith("calls/")).length !== 16 ||
    actual.filter((artifact) => artifact.path.startsWith("blocks/")).length !== 4 ||
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
    index.proposals_decisions_transitions_or_policies_persisted !== false ||
    index.scalar_rank_winner_or_promotion_persisted !== false ||
    index.issue_216_normalized_outputs_reused_behaviorally !== false ||
    index.tracked_repository_files_written !== false ||
    index.historical_artifacts_modified !== false
  ) {
    failV01("parser_closed_clean_control_artifact_index_invalid");
  }
  return {
    relative_run_root: relativeRunRoot,
    completion_status: report.completion_status,
    artifact_count: actual.length + 1,
    artifact_index_fingerprint: createProtocolSha256V01(indexText),
    report_fingerprint: report.integrity.fingerprint,
    cohort_fingerprint: manifest.integrity.fingerprint,
    authorization_consumed: durableConsumed,
    tracked_repository_files_written: false,
    historical_artifacts_modified: false,
    product_database_writes: 0,
    core_writes: 0,
  };
}

export function assertOperationalReentryParserClosedCleanControlCohortArtifactPayloadSafeV01(
  value: unknown,
): void {
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
        failV01("parser_closed_clean_control_secret_or_private_path_refused");
      }
      return;
    }
    if (Array.isArray(candidate)) {
      candidate.forEach(visit);
      return;
    }
    if (typeof candidate !== "object" || candidate === null) return;
    for (const [key, child] of Object.entries(candidate)) {
      const normalizedKey = key.toLowerCase();
      if (
        [
          "request_body",
          "raw_prompt",
          "raw_request",
          "raw_response",
          "raw_provider_error",
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
        ].includes(normalizedKey)
      ) {
        failV01("parser_closed_clean_control_forbidden_field_refused");
      }
      if (
        (normalizedKey.endsWith("_persisted") ||
          normalizedKey.endsWith("_written") ||
          normalizedKey.endsWith("_modified") ||
          normalizedKey.endsWith("_reused")) &&
        child !== false
      ) {
        failV01("parser_closed_clean_control_privacy_flag_invalid");
      }
      visit(child);
    }
  };
  visit(value);
}

function writeAuthorizationConsumptionExclusiveV01(
  repositoryRoot: string,
  authorizationFingerprint: string,
  record: unknown,
): void {
  const familyRoot = path.join(
    repositoryRoot,
    ...OPERATIONAL_REENTRY_PARSER_CLOSED_CLEAN_CONTROL_COHORT_ARTIFACT_PREFIX_V01.split(
      "/",
    ).filter(Boolean),
  );
  ensureDirectoryV01(repositoryRoot, familyRoot);
  const directory = path.join(familyRoot, AUTHORIZATION_CONSUMPTION_DIRECTORY_V01);
  ensureDirectoryV01(repositoryRoot, directory);
  writeTextExclusivePathV01(
    globalConsumptionPathV01(repositoryRoot, authorizationFingerprint),
    canonicalizeProtocolValueV01(record),
    "parser_closed_clean_control_authorization_global_collision_refused",
  );
}

function globalConsumptionPathV01(
  repositoryRoot: string,
  authorizationFingerprint: string,
): string {
  return path.join(
    repositoryRoot,
    ...OPERATIONAL_REENTRY_PARSER_CLOSED_CLEAN_CONTROL_COHORT_ARTIFACT_PREFIX_V01.split(
      "/",
    ).filter(Boolean),
    AUTHORIZATION_CONSUMPTION_DIRECTORY_V01,
    `${authorizationFingerprint.replaceAll(":", "_")}.json`,
  );
}

function readArtifactFingerprintsV01(root: string): Array<{ path: string; fingerprint: string }> {
  const result: Array<{ path: string; fingerprint: string }> = [];
  const visit = (directory: string): void => {
    for (const name of readdirSync(directory).sort()) {
      const candidate = path.join(directory, name);
      const stat = lstatSync(candidate);
      if (stat.isSymbolicLink()) failV01("parser_closed_clean_control_artifact_symlink_refused");
      if (stat.isDirectory()) visit(candidate);
      else if (stat.isFile()) {
        const relative = path.relative(root, candidate).split(path.sep).join("/");
        result.push({
          path: relative,
          fingerprint: createProtocolSha256V01(readFileSync(candidate, "utf8").trimEnd()),
        });
      }
    }
  };
  visit(root);
  return result.sort((left, right) => left.path.localeCompare(right.path, "en"));
}

function readJsonV01(root: string, file: string): unknown {
  try {
    return JSON.parse(readFileSync(path.join(root, file), "utf8")) as unknown;
  } catch {
    failV01("parser_closed_clean_control_artifact_invalid");
  }
}

function writeExclusiveV01(root: string, segments: string[], value: unknown): void {
  assertOperationalReentryParserClosedCleanControlCohortArtifactPayloadSafeV01(value);
  writeTextExclusiveV01(root, segments, canonicalizeProtocolValueV01(value));
}

function writeTextExclusiveV01(root: string, segments: string[], text: string): void {
  const target = path.join(root, ...segments);
  ensureDirectoryV01(root, path.dirname(target));
  writeTextExclusivePathV01(target, text, "parser_closed_clean_control_artifact_collision_refused");
}

function writeTextExclusivePathV01(target: string, text: string, collisionCode: string): void {
  let descriptor: number;
  try {
    descriptor = openSync(target, "wx", 0o600);
  } catch {
    failV01(collisionCode);
  }
  try {
    writeFileSync(descriptor, `${text}\n`, "utf8");
    fsyncSync(descriptor);
  } finally {
    closeSync(descriptor);
  }
}

function requireRootV01(root: string): string {
  const resolved = realpathSync(root);
  if (!lstatSync(resolved).isDirectory()) failV01("parser_closed_clean_control_root_invalid");
  return resolved;
}

function ensureDirectoryV01(root: string, directory: string): void {
  assertContainedV01(root, directory);
  const relative = path.relative(root, directory);
  let current = root;
  for (const segment of relative.split(path.sep).filter(Boolean)) {
    current = path.join(current, segment);
    if (existsSync(current)) {
      const currentStat = lstatSync(current);
      if (currentStat.isSymbolicLink() || !currentStat.isDirectory()) {
        failV01("parser_closed_clean_control_artifact_symlink_refused");
      }
      continue;
    }
    mkdirSync(current, { mode: 0o700 });
  }
}

function assertContainedV01(root: string, candidate: string): void {
  const relative = path.relative(root, candidate);
  if (relative === ".." || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
    failV01("parser_closed_clean_control_artifact_escape_refused");
  }
}

function safeSegmentV01(value: string): string {
  if (!SAFE_SEGMENT_V01.test(value)) failV01("parser_closed_clean_control_artifact_segment_invalid");
  return value;
}

function failV01(code: string): never {
  throw new OperationalReentryParserClosedCleanControlCohortArtifactErrorV01(code);
}
