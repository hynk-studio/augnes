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
  projectOperationalReentryProviderCompatibilityProbePlanForArtifactV01,
  validateOperationalReentryProviderCompatibilityProbeExecutionResultV01,
} from "@/lib/vnext/operational-reentry-provider-compatibility-probe";
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
  OperationalReentryProviderCompatibilityProbeExecutionResultV01,
  OperationalReentryProviderCompatibilityProbeShapeTerminalV01,
} from "@/types/vnext/operational-reentry-provider-compatibility-probe";

const SAFE_SEGMENT_V01 = /^[A-Za-z0-9._-]{1,200}$/u;
const PROBE_ARTIFACT_PREFIX_V01 =
  ".augnes-lab/operational-reentry-provider-probes/" as const;
const AUTHORIZATION_CONSUMPTION_DIRECTORY_V01 =
  "authorization-consumptions" as const;

export class OperationalReentryProviderCompatibilityProbeArtifactErrorV01 extends Error {
  constructor(readonly code: string) {
    super(code);
    this.name =
      "OperationalReentryProviderCompatibilityProbeArtifactErrorV01";
  }
}

export interface OperationalReentryProviderCompatibilityProbeArtifactJournalV01 {
  run_root: string;
  relative_run_root: string;
  authorization_fingerprint: string;
  consume_authorization(input: {
    authorization_fingerprint: string;
    probe_id: string;
  }): void;
  append_shape(
    shape: OperationalReentryProviderCompatibilityProbeShapeTerminalV01,
  ): void;
  finalize(
    result: OperationalReentryProviderCompatibilityProbeExecutionResultV01,
  ): OperationalReentryProviderCompatibilityProbeArtifactSummaryV01;
}

export interface OperationalReentryProviderCompatibilityProbeArtifactSummaryV01 {
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
  product_database_writes: 0;
  core_writes: 0;
}

export function beginOperationalReentryProviderCompatibilityProbeAttemptV01(
  input: {
    repository_root: string;
    prepared: Omit<
      OperationalReentryProviderCompatibilityProbeExecutionResultV01,
      "result_kind" | "shapes" | "report"
    >;
  },
): OperationalReentryProviderCompatibilityProbeArtifactJournalV01 {
  const repositoryRoot = requireRepositoryRootV01(input.repository_root);
  assertOperationalReentryProviderCompatibilityProbeArtifactPayloadSafeV01(
    input.prepared,
  );
  assertAuthorizationNotPreviouslyConsumedV01(
    repositoryRoot,
    input.prepared.authorization.integrity.fingerprint,
  );
  const relativeRunRoot = `${PROBE_ARTIFACT_PREFIX_V01}${safeSegmentV01(
    input.prepared.manifest.probe_id,
  )}/issue-${input.prepared.authorization.future_live_issue_number}`;
  assertOperationalReentryProviderCompatibilityProbeArtifactRootAvailableV01({
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
  writeExclusiveV01(runRoot, ["manifest.json"], input.prepared.manifest);
  writeExclusiveV01(
    runRoot,
    ["plan.json"],
    projectOperationalReentryProviderCompatibilityProbePlanForArtifactV01(
      input.prepared.plan,
    ),
  );
  writeExclusiveV01(runRoot, ["identities.json"], {
    identity_version:
      "operational_reentry_provider_compatibility_probe_identities.v0.1",
    probe_id: input.prepared.manifest.probe_id,
    source_repository_head_sha:
      input.prepared.manifest.source_repository_head_sha,
    future_live_issue_number:
      input.prepared.manifest.future_live_issue_number,
    source_ref: input.prepared.case.source_ref,
    case_fingerprint: input.prepared.case.integrity.fingerprint,
    plan_fingerprint: input.prepared.plan.integrity.fingerprint,
    route_fingerprint:
      input.prepared.manifest.route.integrity_fingerprint,
    provider_ref: input.prepared.manifest.route.provider_ref,
    model_ref: input.prepared.manifest.route.model_ref,
    adapter_implementation_id:
      input.prepared.manifest.route.adapter_implementation_id,
    adapter_implementation_version:
      input.prepared.manifest.route.adapter_implementation_version,
    provider_contract_fingerprint:
      input.prepared.provider_contract.integrity.fingerprint,
    pricing_fingerprint: input.prepared.pricing.integrity.fingerprint,
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
    request_family_kind: "compatibility_probe",
    request_family_trace_id:
      input.prepared.plan.request_family_trace_id,
    shapes: input.prepared.plan.entries.map((entry) => ({
      canonical_order: entry.canonical_order,
      shape: entry.shape,
      representative_input_fingerprint:
        entry.representative_input_fingerprint,
      schema_fingerprint: entry.schema_fingerprint,
      provider_visible_request_fingerprint:
        entry.provider_visible_request_fingerprint,
      adapter_request_route_fingerprint:
        entry.adapter_request_route_fingerprint,
      client_request_id: entry.client_request_id,
    })),
    raw_prompt_persisted: false,
    raw_request_body_persisted: false,
    raw_provider_response_persisted: false,
    hidden_reasoning_persisted: false,
    credentials_or_full_headers_persisted: false,
    private_absolute_paths_persisted: false,
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
        failV01("operational_reentry_probe_authorization_reuse_refused");
      }
      if (
        consumption.authorization_fingerprint !==
          input.prepared.authorization.integrity.fingerprint ||
        consumption.probe_id !== input.prepared.manifest.probe_id
      ) {
        failV01("operational_reentry_probe_authorization_consumption_mismatch");
      }
      const consumptionRecord = {
        consumption_version:
          "operational_reentry_provider_compatibility_probe_authorization_consumption.v0.1",
        authorization_fingerprint:
          input.prepared.authorization.integrity.fingerprint,
        probe_id: input.prepared.manifest.probe_id,
        request_family_kind: "compatibility_probe",
        first_provider_egress_consumes_authorization: true,
        second_probe_authorized: false,
        retries_authorized: false,
        replacements_authorized: false,
        replacement_cohort_authorized: false,
        stage_7_authorized: false,
      };
      writeAuthorizationConsumptionExclusiveV01(
        repositoryRoot,
        input.prepared.authorization.integrity.fingerprint,
        consumptionRecord,
      );
      writeExclusiveV01(
        runRoot,
        ["authorization-consumed.json"],
        consumptionRecord,
      );
      consumed = true;
    },
    append_shape(shape) {
      assertOperationalReentryProviderCompatibilityProbeArtifactPayloadSafeV01(
        shape,
      );
      const expected = input.prepared.plan.entries[nextShape];
      if (
        !expected ||
        shape.canonical_order !== nextShape ||
        shape.shape !== expected.shape ||
        shape.call_slot_id !== expected.call_slot_id ||
        shape.request_family_kind !== "compatibility_probe" ||
        shape.request_family_trace_id !==
          input.prepared.plan.request_family_trace_id ||
        shape.route_fingerprint !==
          input.prepared.manifest.route.integrity_fingerprint ||
        shape.provider_contract_fingerprint !==
          input.prepared.provider_contract.integrity.fingerprint ||
        shape.pricing_fingerprint !==
          input.prepared.pricing.integrity.fingerprint
      ) {
        failV01("operational_reentry_probe_artifact_shape_order_invalid");
      }
      writeExclusiveV01(
        runRoot,
        ["shapes", `${String(nextShape).padStart(2, "0")}.json`],
        shape,
      );
      nextShape += 1;
    },
    finalize(resultInput) {
      const result =
        validateOperationalReentryProviderCompatibilityProbeExecutionResultV01(
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
        failV01("operational_reentry_probe_artifact_finalize_mismatch");
      }
      assertOperationalReentryProviderCompatibilityProbeArtifactPayloadSafeV01(
        result.report,
      );
      writeExclusiveV01(runRoot, ["report.json"], result.report);
      const artifacts = readArtifactFingerprintsV01(runRoot);
      const index = {
        index_version:
          "operational_reentry_provider_compatibility_probe_artifact_index.v0.1",
        probe_id: result.manifest.probe_id,
        probe_fingerprint: result.manifest.integrity.fingerprint,
        report_fingerprint: result.report.integrity.fingerprint,
        source_repository_head_sha:
          result.manifest.source_repository_head_sha,
        future_live_issue_number: result.manifest.future_live_issue_number,
        request_family_kind: "compatibility_probe",
        outcome: result.report.outcome,
        authorization_consumed: consumed,
        artifacts,
        raw_prompt_persisted: false,
        raw_request_body_persisted: false,
        raw_provider_response_persisted: false,
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
        tracked_repository_files_written: false,
        historical_cohort_artifacts_modified: false,
        replacement_cohort_artifacts_written: false,
      };
      assertOperationalReentryProviderCompatibilityProbeArtifactPayloadSafeV01(
        index,
      );
      const indexText = canonicalizeProtocolValueV01(index);
      writeTextExclusiveV01(
        runRoot,
        ["artifact-index.json"],
        indexText,
      );
      return validateOperationalReentryProviderCompatibilityProbeArtifactsV01({
        repository_root: repositoryRoot,
        run_root: runRoot,
      });
    },
  };
}

export function assertOperationalReentryProviderCompatibilityProbeArtifactRootAvailableV01(
  input: {
    repository_root: string;
    relative_run_root: string;
  },
): void {
  const repositoryRoot = requireRepositoryRootV01(input.repository_root);
  const normalized = input.relative_run_root.split(path.sep).join("/");
  const lower = normalized.toLowerCase();
  if (
    path.isAbsolute(input.relative_run_root) ||
    !normalized.startsWith(PROBE_ARTIFACT_PREFIX_V01) ||
    normalized === ACGC_E2_HISTORICAL_RUN_ROOT_V01 ||
    lower.includes("operational-reentry-matched-cohorts") ||
    lower.includes("replacement") ||
    lower.includes("issue-185") ||
    lower.includes(ACGC_E2_HISTORICAL_COHORT_ID_V01.toLowerCase())
  ) {
    failV01("operational_reentry_probe_historical_or_replacement_root_refused");
  }
  const candidate = path.resolve(repositoryRoot, input.relative_run_root);
  assertContainedV01(repositoryRoot, candidate);
  if (existsSync(candidate)) {
    if (lstatSync(candidate).isSymbolicLink()) {
      failV01("operational_reentry_probe_artifact_symlink_refused");
    }
    failV01("operational_reentry_probe_authorization_collision_refused");
  }
}

export function validateOperationalReentryProviderCompatibilityProbeArtifactsV01(
  input: {
    repository_root: string;
    run_root: string;
    read_scope?: ArtifactEvidenceReadScopeV01;
  },
): OperationalReentryProviderCompatibilityProbeArtifactSummaryV01 {
  const repositoryRoot = requireRepositoryRootV01(input.repository_root);
  const runRoot = realpathSync(input.run_root);
  assertContainedV01(repositoryRoot, runRoot);
  const physicalRelativeRunRoot = path
    .relative(repositoryRoot, runRoot)
    .split(path.sep)
    .join("/");
  const relativeRunRoot = projectArtifactEvidenceReadPathV01({
    relative_path: physicalRelativeRunRoot,
    active_prefix: PROBE_ARTIFACT_PREFIX_V01,
    read_scope: input.read_scope,
  });
  if (!relativeRunRoot) {
    failV01("operational_reentry_probe_artifact_root_invalid");
  }
  const indexPath = path.join(runRoot, "artifact-index.json");
  if (!existsSync(indexPath)) {
    failV01("operational_reentry_probe_artifact_index_missing");
  }
  const indexText = readFileSync(indexPath, "utf8").trimEnd();
  const index = JSON.parse(indexText) as {
    outcome: OperationalReentryProviderCompatibilityProbeArtifactSummaryV01["outcome"];
    probe_fingerprint: string;
    report_fingerprint: string;
    authorization_consumed: boolean;
    artifacts: Array<{ path: string; fingerprint: string }>;
    raw_prompt_persisted: false;
    raw_request_body_persisted: false;
    raw_provider_response_persisted: false;
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
    tracked_repository_files_written: false;
    historical_cohort_artifacts_modified: false;
    replacement_cohort_artifacts_written: false;
  };
  assertOperationalReentryProviderCompatibilityProbeArtifactPayloadSafeV01(
    index,
  );
  const actual = readArtifactFingerprintsV01(runRoot).filter(
    (entry) => entry.path !== "artifact-index.json",
  );
  if (
    canonicalizeProtocolValueV01(actual) !==
      canonicalizeProtocolValueV01(index.artifacts) ||
    index.raw_prompt_persisted !== false ||
    index.raw_request_body_persisted !== false ||
    index.raw_provider_response_persisted !== false ||
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
    index.tracked_repository_files_written !== false ||
    index.historical_cohort_artifacts_modified !== false ||
    index.replacement_cohort_artifacts_written !== false
  ) {
    failV01("operational_reentry_probe_artifact_index_invalid");
  }
  const report = JSON.parse(
    readFileSync(path.join(runRoot, "report.json"), "utf8"),
  ) as { integrity: { fingerprint: string } };
  if (report.integrity.fingerprint !== index.report_fingerprint) {
    failV01("operational_reentry_probe_report_fingerprint_invalid");
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
    product_database_writes: 0,
    core_writes: 0,
  };
}

export function assertOperationalReentryProviderCompatibilityProbeArtifactPayloadSafeV01(
  value: unknown,
): void {
  const visit = (candidate: unknown, key: string | null): void => {
    if (typeof candidate === "string") {
      const lower = candidate.toLowerCase();
      if (
        lower.includes("/users/") ||
        lower.includes("/home/") ||
        /\bsk-[a-z0-9]{8,}/iu.test(candidate) ||
        lower.includes("authorization: bearer") ||
        lower.includes("cookie:")
      ) {
        failV01("operational_reentry_probe_artifact_secret_or_private_path_refused");
      }
      return;
    }
    if (Array.isArray(candidate)) {
      candidate.forEach((entry) => visit(entry, key));
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
        ].includes(normalizedKey)
      ) {
        failV01("operational_reentry_probe_artifact_forbidden_field_refused");
      }
      if (
        normalizedKey.endsWith("_persisted") ||
        normalizedKey.endsWith("_written") ||
        normalizedKey.endsWith("_modified")
      ) {
        if (childValue !== false) {
          failV01("operational_reentry_probe_artifact_privacy_flag_invalid");
        }
      }
      visit(childValue, childKey);
    }
  };
  visit(value, null);
}

function readArtifactFingerprintsV01(runRoot: string) {
  const walk = (directory: string): string[] =>
    readdirSync(directory).flatMap((entry) => {
      const target = path.join(directory, entry);
      const stat = lstatSync(target);
      if (stat.isSymbolicLink()) {
        failV01("operational_reentry_probe_artifact_symlink_refused");
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

function requireRepositoryRootV01(input: string): string {
  if (!path.isAbsolute(input)) {
    failV01("operational_reentry_probe_repository_root_invalid");
  }
  const root = realpathSync(input);
  const ignore = readFileSync(path.join(root, ".gitignore"), "utf8");
  if (
    !ignore
      .split(/\r?\n/u)
      .map((line) => line.trim())
      .includes(".augnes-lab/")
  ) {
    failV01("operational_reentry_probe_artifact_root_not_ignored");
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
    failV01("operational_reentry_probe_artifact_segment_invalid");
  }
  return segment;
}

function authorizationConsumptionPathV01(
  repositoryRoot: string,
  authorizationFingerprint: string,
): string {
  const fingerprintSegment = safeSegmentV01(authorizationFingerprint);
  const target = path.join(
    repositoryRoot,
    ...PROBE_ARTIFACT_PREFIX_V01.split("/").filter(Boolean),
    AUTHORIZATION_CONSUMPTION_DIRECTORY_V01,
    `${fingerprintSegment}.json`,
  );
  assertContainedV01(repositoryRoot, target);
  return target;
}

function assertAuthorizationNotPreviouslyConsumedV01(
  repositoryRoot: string,
  authorizationFingerprint: string,
): void {
  const target = authorizationConsumptionPathV01(
    repositoryRoot,
    authorizationFingerprint,
  );
  if (existsSync(target)) {
    failV01(
      "operational_reentry_probe_authorization_global_collision_refused",
    );
  }
}

function writeAuthorizationConsumptionExclusiveV01(
  repositoryRoot: string,
  authorizationFingerprint: string,
  value: unknown,
): void {
  assertOperationalReentryProviderCompatibilityProbeArtifactPayloadSafeV01(
    value,
  );
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
        "operational_reentry_probe_authorization_global_collision_refused",
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
  assertOperationalReentryProviderCompatibilityProbeArtifactPayloadSafeV01(
    value,
  );
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
    failV01("operational_reentry_probe_artifact_overwrite_refused");
  }
  const temporary = `${target}.tmp`;
  if (existsSync(temporary)) {
    failV01("operational_reentry_probe_artifact_stale_temporary");
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
        failV01("operational_reentry_probe_artifact_directory_invalid");
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
  ) {
    failV01("operational_reentry_probe_artifact_path_escape");
  }
}

function failV01(code: string): never {
  throw new OperationalReentryProviderCompatibilityProbeArtifactErrorV01(code);
}
