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
  projectOperationalReentryCleanControlProviderCompatibilityProbePlanForArtifactV02,
  validateOperationalReentryCleanControlProviderCompatibilityProbeExecutionResultV02,
} from "@/lib/vnext/operational-reentry-clean-control-provider-compatibility-probe";
import {
  canonicalizeProtocolValueV01,
  createProtocolSha256V01,
} from "@/lib/vnext/protocol-primitives";
import type {
  OperationalReentryCleanControlProviderCompatibilityProbeExecutionResultV02,
  OperationalReentryCleanControlProviderCompatibilityProbePreparedV02,
  OperationalReentryCleanControlProviderCompatibilityProbeShapeTerminalV02,
} from "@/types/vnext/operational-reentry-clean-control-provider-compatibility-probe";

const SAFE_SEGMENT_V02 = /^[A-Za-z0-9._-]{1,200}$/u;
const PROBE_ARTIFACT_PREFIX_V02 =
  ".augnes-lab/operational-reentry-clean-control-provider-probes/" as const;
const AUTHORIZATION_CONSUMPTION_DIRECTORY_V02 =
  "authorization-consumptions" as const;

export class OperationalReentryCleanControlProviderCompatibilityProbeArtifactErrorV02 extends Error {
  constructor(readonly code: string) {
    super(code);
    this.name =
      "OperationalReentryCleanControlProviderCompatibilityProbeArtifactErrorV02";
  }
}

export interface OperationalReentryCleanControlProviderCompatibilityProbeArtifactJournalV02 {
  run_root: string;
  relative_run_root: string;
  authorization_fingerprint: string;
  consume_authorization(input: {
    authorization_fingerprint: string;
    probe_id: string;
  }): void;
  append_shape(
    shape: OperationalReentryCleanControlProviderCompatibilityProbeShapeTerminalV02,
  ): void;
  finalize(
    result: OperationalReentryCleanControlProviderCompatibilityProbeExecutionResultV02,
  ): OperationalReentryCleanControlProviderCompatibilityProbeArtifactSummaryV02;
}

export interface OperationalReentryCleanControlProviderCompatibilityProbeArtifactSummaryV02 {
  relative_run_root: string;
  outcome:
    | "accepted_all_shapes"
    | "provider_rejected"
    | "provider_response_invalid"
    | "transport_or_runtime_incomplete"
    | "not_run";
  artifact_count: number;
  artifact_index_fingerprint: string;
  report_fingerprint: string;
  probe_fingerprint: string;
  authorization_consumed: boolean;
  tracked_repository_files_written: false;
  historical_probe_artifacts_modified: false;
  replacement_cohort_artifacts_modified: false;
  product_database_writes: 0;
  core_writes: 0;
}

export function beginOperationalReentryCleanControlProviderCompatibilityProbeAttemptV02(
  input: {
    repository_root: string;
    prepared: OperationalReentryCleanControlProviderCompatibilityProbePreparedV02;
  },
): OperationalReentryCleanControlProviderCompatibilityProbeArtifactJournalV02 {
  const repositoryRoot = requireRepositoryRootV02(input.repository_root);
  assertOperationalReentryCleanControlProviderCompatibilityProbeArtifactPayloadSafeV02(
    input.prepared,
  );
  assertAuthorizationNotPreviouslyConsumedV02(
    repositoryRoot,
    input.prepared.authorization.integrity.fingerprint,
  );
  const relativeRunRoot = `${PROBE_ARTIFACT_PREFIX_V02}${safeSegmentV02(
    input.prepared.manifest.probe_id,
  )}/issue-${input.prepared.authorization.future_live_issue_number}`;
  assertOperationalReentryCleanControlProviderCompatibilityProbeArtifactRootAvailableV02(
    {
      repository_root: repositoryRoot,
      relative_run_root: relativeRunRoot,
    },
  );
  const runRoot = path.join(repositoryRoot, ...relativeRunRoot.split("/"));
  ensureDirectoryChainV02(repositoryRoot, runRoot);

  writeExclusiveV02(
    runRoot,
    ["authorization.json"],
    input.prepared.authorization,
  );
  writeExclusiveV02(runRoot, ["manifest.json"], input.prepared.manifest);
  writeExclusiveV02(
    runRoot,
    ["plan.json"],
    projectOperationalReentryCleanControlProviderCompatibilityProbePlanForArtifactV02(
      input.prepared.plan,
    ),
  );
  writeExclusiveV02(runRoot, ["identities.json"], {
    identity_version:
      "operational_reentry_clean_control_provider_compatibility_probe_identities.v0.2",
    probe_id: input.prepared.manifest.probe_id,
    source_repository_head_sha:
      input.prepared.manifest.source_repository_head_sha,
    future_live_issue_number:
      input.prepared.manifest.future_live_issue_number,
    repository_slug: input.prepared.authorization.repository_slug,
    authorized_origin: input.prepared.authorization.authorized_origin,
    project_root_fingerprint:
      input.prepared.authorization.project_root_fingerprint,
    source_ref: input.prepared.case.source_ref,
    case_fingerprint: input.prepared.case.integrity.fingerprint,
    common_task_evidence_fingerprint:
      input.prepared.manifest.common_task_evidence_fingerprint,
    representative_shape_plan_fingerprint:
      input.prepared.representative_shape_plan.integrity.fingerprint,
    plan_fingerprint: input.prepared.plan.integrity.fingerprint,
    route_fingerprint:
      input.prepared.manifest.route.integrity_fingerprint,
    provider_ref: input.prepared.manifest.route.provider_ref,
    model_ref: input.prepared.manifest.route.model_ref,
    adapter_implementation_id:
      input.prepared.manifest.route.adapter_implementation_id,
    adapter_implementation_version:
      input.prepared.manifest.route.adapter_implementation_version,
    provider_contract_version:
      input.prepared.manifest.route.provider_contract_version,
    provider_contract_fingerprint:
      input.prepared.provider_contract.integrity.fingerprint,
    codec_version: input.prepared.authorization.codec_version,
    response_schema_version:
      input.prepared.authorization.response_schema_version,
    parser_version: input.prepared.authorization.parser_version,
    pricing_fingerprint: input.prepared.pricing.integrity.fingerprint,
    pricing_snapshot_evaluated_at:
      input.prepared.pricing.evaluated_at,
    pricing_authority_fingerprint:
      input.prepared.pricing.gateway_cost_budget.authority
        .pricing_fingerprint,
    pricing_source_version:
      input.prepared.pricing.pricing_source_version,
    pricing_effective_at:
      input.prepared.pricing.pricing_effective_at,
    pricing_expires_at: input.prepared.pricing.pricing_expires_at,
    aggregate_worst_case_cost_nano_usd:
      input.prepared.pricing.aggregate_worst_case_cost_nano_usd,
    aggregate_ceiling_nano_usd:
      input.prepared.pricing.aggregate_ceiling_nano_usd,
    request_family_kind: "clean_control_compatibility_probe",
    shapes: input.prepared.plan.entries.map((entry) => ({
      canonical_order: entry.canonical_order,
      shape: entry.shape,
      call_slot_id: entry.call_slot_id,
      representative_input_fingerprint:
        entry.representative_input_fingerprint,
      common_task_evidence_fingerprint:
        entry.common_task_evidence_fingerprint,
      non_target_continuation_fingerprint:
        entry.non_target_continuation_fingerprint,
      treatment_material_fingerprint:
        entry.treatment_material_fingerprint,
      schema_fingerprint: entry.schema_fingerprint,
      provider_visible_request_fingerprint:
        entry.provider_visible_request_fingerprint,
      adapter_request_route_fingerprint:
        entry.adapter_request_route_fingerprint,
      request_family_trace_id: entry.request_family_trace_id,
      client_request_id: entry.client_request_id,
    })),
    raw_prompt_persisted: false,
    raw_request_body_persisted: false,
    raw_provider_response_persisted: false,
    raw_provider_error_persisted: false,
    hidden_reasoning_persisted: false,
    credentials_or_full_headers_persisted: false,
    private_absolute_paths_persisted: false,
    behavioral_evaluation_persisted: false,
  });

  let consumed = false;
  let nextShape = 0;
  return {
    run_root: runRoot,
    relative_run_root: relativeRunRoot,
    authorization_fingerprint:
      input.prepared.authorization.integrity.fingerprint,
    consume_authorization(consumption) {
      if (consumed) {
        failV02("clean_control_probe_authorization_reuse_refused");
      }
      if (
        consumption.authorization_fingerprint !==
          input.prepared.authorization.integrity.fingerprint ||
        consumption.probe_id !== input.prepared.manifest.probe_id
      ) {
        failV02("clean_control_probe_authorization_consumption_mismatch");
      }
      const consumptionRecord = {
        consumption_version:
          "operational_reentry_clean_control_provider_compatibility_probe_authorization_consumption.v0.2",
        authorization_fingerprint:
          input.prepared.authorization.integrity.fingerprint,
        probe_id: input.prepared.manifest.probe_id,
        request_family_kind: "clean_control_compatibility_probe",
        first_provider_egress_consumes_authorization: true,
        second_probe_authorized: false,
        retries_authorized: false,
        replacements_authorized: false,
        behavioral_cohort_authorized: false,
        replication_authorized: false,
        policy_authorized: false,
        stage_7_authorized: false,
      };
      writeAuthorizationConsumptionExclusiveV02(
        repositoryRoot,
        input.prepared.authorization.integrity.fingerprint,
        consumptionRecord,
      );
      writeExclusiveV02(
        runRoot,
        ["authorization-consumed.json"],
        consumptionRecord,
      );
      consumed = true;
    },
    append_shape(shape) {
      assertOperationalReentryCleanControlProviderCompatibilityProbeArtifactPayloadSafeV02(
        shape,
      );
      const expected = input.prepared.plan.entries[nextShape];
      if (
        !expected ||
        shape.canonical_order !== nextShape ||
        shape.shape !== expected.shape ||
        shape.call_slot_id !== expected.call_slot_id ||
        shape.request_family_kind !== "clean_control_compatibility_probe" ||
        shape.request_family_trace_id !==
          expected.request_family_trace_id ||
        shape.route_fingerprint !==
          input.prepared.manifest.route.integrity_fingerprint ||
        shape.provider_contract_fingerprint !==
          input.prepared.provider_contract.integrity.fingerprint ||
        shape.pricing_fingerprint !==
          input.prepared.pricing.integrity.fingerprint
      ) {
        failV02("clean_control_probe_artifact_shape_order_invalid");
      }
      writeExclusiveV02(
        runRoot,
        ["shapes", `${String(nextShape).padStart(2, "0")}.json`],
        shape,
      );
      nextShape += 1;
    },
    finalize(resultInput) {
      const result =
        validateOperationalReentryCleanControlProviderCompatibilityProbeExecutionResultV02(
          resultInput,
        );
      if (
        result.manifest.integrity.fingerprint !==
          input.prepared.manifest.integrity.fingerprint ||
        result.authorization.integrity.fingerprint !==
          input.prepared.authorization.integrity.fingerprint ||
        result.plan.integrity.fingerprint !==
          input.prepared.plan.integrity.fingerprint ||
        result.pricing.integrity.fingerprint !==
          input.prepared.pricing.integrity.fingerprint ||
        result.shapes.length !== nextShape ||
        nextShape !== 4 ||
        result.report.authorization_consumed !== consumed
      ) {
        failV02("clean_control_probe_artifact_finalize_mismatch");
      }
      assertOperationalReentryCleanControlProviderCompatibilityProbeArtifactPayloadSafeV02(
        result.report,
      );
      writeExclusiveV02(runRoot, ["report.json"], result.report);
      const artifacts = readArtifactFingerprintsV02(runRoot);
      const index = {
        index_version:
          "operational_reentry_clean_control_provider_compatibility_probe_artifact_index.v0.2",
        probe_id: result.manifest.probe_id,
        probe_fingerprint: result.manifest.integrity.fingerprint,
        report_fingerprint: result.report.integrity.fingerprint,
        source_repository_head_sha:
          result.manifest.source_repository_head_sha,
        future_live_issue_number: result.manifest.future_live_issue_number,
        request_family_kind: "clean_control_compatibility_probe",
        outcome: result.report.outcome,
        authorization_consumed: consumed,
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
        behavioral_evaluation_persisted: false,
        normalized_outputs_reused_as_behavioral_evidence: false,
        tracked_repository_files_written: false,
        historical_probe_artifacts_modified: false,
        historical_cohort_artifacts_modified: false,
        replacement_cohort_artifacts_modified: false,
      };
      assertOperationalReentryCleanControlProviderCompatibilityProbeArtifactPayloadSafeV02(
        index,
      );
      const indexText = canonicalizeProtocolValueV01(index);
      writeTextExclusiveV02(runRoot, ["artifact-index.json"], indexText);
      return validateOperationalReentryCleanControlProviderCompatibilityProbeArtifactsV02(
        {
          repository_root: repositoryRoot,
          run_root: runRoot,
        },
      );
    },
  };
}

export function assertOperationalReentryCleanControlProviderCompatibilityProbeArtifactRootAvailableV02(
  input: {
    repository_root: string;
    relative_run_root: string;
  },
): void {
  const repositoryRoot = requireRepositoryRootV02(input.repository_root);
  const normalized = input.relative_run_root.split(path.sep).join("/");
  const lower = normalized.toLowerCase();
  if (
    path.isAbsolute(input.relative_run_root) ||
    !normalized.startsWith(PROBE_ARTIFACT_PREFIX_V02) ||
    lower.includes("/operational-reentry-provider-probes/") ||
    lower.includes("operational-reentry-matched-cohorts") ||
    lower.includes("operational-reentry-matched-cohort-replacements") ||
    lower.includes("replacement_cohort") ||
    lower.includes("cohort_attempt") ||
    lower.includes("issue-185") ||
    lower.includes("issue-193") ||
    lower.includes("issue-199")
  ) {
    failV02("clean_control_probe_historical_or_cohort_root_refused");
  }
  const candidate = path.resolve(repositoryRoot, input.relative_run_root);
  assertContainedV02(repositoryRoot, candidate);
  if (existsSync(candidate)) {
    if (lstatSync(candidate).isSymbolicLink()) {
      failV02("clean_control_probe_artifact_symlink_refused");
    }
    failV02("clean_control_probe_authorization_collision_refused");
  }
}

export function validateOperationalReentryCleanControlProviderCompatibilityProbeArtifactsV02(
  input: { repository_root: string; run_root: string },
): OperationalReentryCleanControlProviderCompatibilityProbeArtifactSummaryV02 {
  const repositoryRoot = requireRepositoryRootV02(input.repository_root);
  const runRoot = realpathSync(input.run_root);
  assertContainedV02(repositoryRoot, runRoot);
  const relativeRunRoot = path
    .relative(repositoryRoot, runRoot)
    .split(path.sep)
    .join("/");
  if (!relativeRunRoot.startsWith(PROBE_ARTIFACT_PREFIX_V02)) {
    failV02("clean_control_probe_artifact_root_invalid");
  }
  const indexPath = path.join(runRoot, "artifact-index.json");
  if (!existsSync(indexPath)) {
    failV02("clean_control_probe_artifact_index_missing");
  }
  const indexText = readFileSync(indexPath, "utf8").trimEnd();
  let index: {
    outcome: OperationalReentryCleanControlProviderCompatibilityProbeArtifactSummaryV02["outcome"];
    probe_fingerprint: string;
    report_fingerprint: string;
    authorization_consumed: boolean;
    artifacts: Array<{ path: string; fingerprint: string }>;
    raw_prompt_persisted: false;
    raw_request_body_persisted: false;
    raw_provider_response_persisted: false;
    raw_provider_error_persisted: false;
    hidden_reasoning_persisted: false;
    credentials_or_secrets_persisted: false;
    authorization_header_persisted: false;
    cookies_persisted: false;
    full_headers_persisted: false;
    private_absolute_paths_persisted: false;
    product_database_rows_persisted: false;
    core_records_persisted: false;
    task_context_packet_variants_persisted: false;
    proposals_decisions_transitions_or_policies_persisted: false;
    behavioral_evaluation_persisted: false;
    normalized_outputs_reused_as_behavioral_evidence: false;
    tracked_repository_files_written: false;
    historical_probe_artifacts_modified: false;
    historical_cohort_artifacts_modified: false;
    replacement_cohort_artifacts_modified: false;
  };
  try {
    index = JSON.parse(indexText) as typeof index;
  } catch {
    failV02("clean_control_probe_artifact_index_invalid");
  }
  assertOperationalReentryCleanControlProviderCompatibilityProbeArtifactPayloadSafeV02(
    index,
  );
  const actual = readArtifactFingerprintsV02(runRoot).filter(
    (entry) => entry.path !== "artifact-index.json",
  );
  const shapePaths = actual
    .map((entry) => entry.path)
    .filter((entry) => entry.startsWith("shapes/"));
  if (
    canonicalizeProtocolValueV01(actual) !==
      canonicalizeProtocolValueV01(index.artifacts) ||
    canonicalizeProtocolValueV01(shapePaths) !==
      canonicalizeProtocolValueV01([
        "shapes/00.json",
        "shapes/01.json",
        "shapes/02.json",
        "shapes/03.json",
      ]) ||
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
    index.behavioral_evaluation_persisted !== false ||
    index.normalized_outputs_reused_as_behavioral_evidence !== false ||
    index.tracked_repository_files_written !== false ||
    index.historical_probe_artifacts_modified !== false ||
    index.historical_cohort_artifacts_modified !== false ||
    index.replacement_cohort_artifacts_modified !== false
  ) {
    failV02("clean_control_probe_artifact_index_invalid");
  }
  const report = JSON.parse(
    readFileSync(path.join(runRoot, "report.json"), "utf8"),
  ) as { integrity: { fingerprint: string } };
  if (report.integrity.fingerprint !== index.report_fingerprint) {
    failV02("clean_control_probe_report_fingerprint_invalid");
  }
  return {
    relative_run_root: relativeRunRoot,
    outcome: index.outcome,
    artifact_count: actual.length + 1,
    artifact_index_fingerprint: createProtocolSha256V01(indexText),
    report_fingerprint: index.report_fingerprint,
    probe_fingerprint: index.probe_fingerprint,
    authorization_consumed: index.authorization_consumed,
    tracked_repository_files_written: false,
    historical_probe_artifacts_modified: false,
    replacement_cohort_artifacts_modified: false,
    product_database_writes: 0,
    core_writes: 0,
  };
}

export function assertOperationalReentryCleanControlProviderCompatibilityProbeArtifactPayloadSafeV02(
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
        failV02("clean_control_probe_artifact_secret_or_private_path_refused");
      }
      return;
    }
    if (Array.isArray(candidate)) {
      candidate.forEach(visit);
      return;
    }
    if (typeof candidate !== "object" || candidate === null) return;
    for (const [childKey, childValue] of Object.entries(candidate)) {
      const normalizedKey = childKey.toLowerCase();
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
          "task_context_packet_variants",
          "proposals",
          "decisions",
          "transitions",
          "policies",
          "e1_evaluation",
          "pairwise_relations",
          "conditioning_disposition",
          "reset_disposition",
        ].includes(normalizedKey)
      ) {
        failV02("clean_control_probe_artifact_forbidden_field_refused");
      }
      if (
        normalizedKey.endsWith("_persisted") ||
        normalizedKey.endsWith("_written") ||
        normalizedKey.endsWith("_modified") ||
        normalizedKey.endsWith("_reused")
      ) {
        if (childValue !== false) {
          failV02("clean_control_probe_artifact_privacy_flag_invalid");
        }
      }
      visit(childValue);
    }
  };
  visit(value);
}

function readArtifactFingerprintsV02(runRoot: string) {
  const walk = (directory: string): string[] =>
    readdirSync(directory).flatMap((entry) => {
      const target = path.join(directory, entry);
      const stat = lstatSync(target);
      if (stat.isSymbolicLink()) {
        failV02("clean_control_probe_artifact_symlink_refused");
      }
      return stat.isDirectory() ? walk(target) : [target];
    });
  return walk(runRoot)
    .map((file) => {
      const text = readFileSync(file, "utf8").trimEnd();
      return {
        path: path.relative(runRoot, file).split(path.sep).join("/"),
        fingerprint: createProtocolSha256V01(text),
      };
    })
    .sort((left, right) => left.path.localeCompare(right.path, "en"));
}

function requireRepositoryRootV02(input: string): string {
  if (!path.isAbsolute(input)) {
    failV02("clean_control_probe_repository_root_invalid");
  }
  const root = realpathSync(input);
  const ignore = readFileSync(path.join(root, ".gitignore"), "utf8");
  if (
    !ignore
      .split(/\r?\n/u)
      .map((line) => line.trim())
      .includes(".augnes-lab/")
  ) {
    failV02("clean_control_probe_artifact_root_not_ignored");
  }
  return root;
}

function safeSegmentV02(value: string): string {
  const segment = value.replaceAll(":", "_");
  if (
    !SAFE_SEGMENT_V02.test(segment) ||
    segment === "." ||
    segment === ".."
  ) {
    failV02("clean_control_probe_artifact_segment_invalid");
  }
  return segment;
}

function authorizationConsumptionPathV02(
  repositoryRoot: string,
  authorizationFingerprint: string,
): string {
  const target = path.join(
    repositoryRoot,
    ...PROBE_ARTIFACT_PREFIX_V02.split("/").filter(Boolean),
    AUTHORIZATION_CONSUMPTION_DIRECTORY_V02,
    `${safeSegmentV02(authorizationFingerprint)}.json`,
  );
  assertContainedV02(repositoryRoot, target);
  return target;
}

function assertAuthorizationNotPreviouslyConsumedV02(
  repositoryRoot: string,
  authorizationFingerprint: string,
): void {
  if (
    existsSync(
      authorizationConsumptionPathV02(
        repositoryRoot,
        authorizationFingerprint,
      ),
    )
  ) {
    failV02("clean_control_probe_authorization_global_collision_refused");
  }
}

function writeAuthorizationConsumptionExclusiveV02(
  repositoryRoot: string,
  authorizationFingerprint: string,
  value: unknown,
): void {
  assertOperationalReentryCleanControlProviderCompatibilityProbeArtifactPayloadSafeV02(
    value,
  );
  const target = authorizationConsumptionPathV02(
    repositoryRoot,
    authorizationFingerprint,
  );
  ensureDirectoryChainV02(repositoryRoot, path.dirname(target));
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
      failV02("clean_control_probe_authorization_global_collision_refused");
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

function writeExclusiveV02(
  runRoot: string,
  segments: string[],
  value: unknown,
): void {
  assertOperationalReentryCleanControlProviderCompatibilityProbeArtifactPayloadSafeV02(
    value,
  );
  writeTextExclusiveV02(
    runRoot,
    segments,
    canonicalizeProtocolValueV01(value),
  );
}

function writeTextExclusiveV02(
  runRoot: string,
  segments: string[],
  text: string,
): void {
  segments.forEach(safeSegmentV02);
  const target = path.join(runRoot, ...segments);
  assertContainedV02(runRoot, target);
  ensureDirectoryChainV02(runRoot, path.dirname(target));
  if (existsSync(target)) {
    failV02("clean_control_probe_artifact_overwrite_refused");
  }
  const temporary = `${target}.tmp`;
  if (existsSync(temporary)) {
    failV02("clean_control_probe_artifact_stale_temporary");
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

function ensureDirectoryChainV02(baseInput: string, targetInput: string): void {
  const base = realpathSync(baseInput);
  assertContainedV02(base, targetInput);
  let current = base;
  for (const segment of path
    .relative(base, targetInput)
    .split(path.sep)
    .filter(Boolean)) {
    safeSegmentV02(segment);
    current = path.join(current, segment);
    if (existsSync(current)) {
      const stat = lstatSync(current);
      if (stat.isSymbolicLink() || !stat.isDirectory()) {
        failV02("clean_control_probe_artifact_directory_invalid");
      }
    } else {
      mkdirSync(current, { mode: 0o700 });
    }
  }
}

function assertContainedV02(baseInput: string, targetInput: string): void {
  const relative = path.relative(baseInput, targetInput);
  if (
    relative === ".." ||
    relative.startsWith(`..${path.sep}`) ||
    path.isAbsolute(relative)
  ) {
    failV02("clean_control_probe_artifact_path_escape");
  }
}

function failV02(code: string): never {
  throw new OperationalReentryCleanControlProviderCompatibilityProbeArtifactErrorV02(
    code,
  );
}
