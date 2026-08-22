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
  MODEL_PROVIDER_INCOMPLETE_REASONS_V01,
  MODEL_PROVIDER_RESPONSE_INVALID_OBSERVATION_VERSION_V01,
  MODEL_PROVIDER_RESPONSE_INVALID_STAGES_V01,
  MODEL_PROVIDER_RESPONSE_STATUSES_V01,
} from "@/lib/vnext/model-gateway/provider-response-invalid-observation";

import {
  projectOperationalReentryV04ProviderCompatibilityProbePlanForArtifactV01,
  validateOperationalReentryV04ProviderCompatibilityProbeExecutionResultV01,
} from "@/lib/vnext/operational-reentry-v0-4-provider-compatibility-probe";
import {
  canonicalizeProtocolValueV01,
  createProtocolSha256V01,
} from "@/lib/vnext/protocol-primitives";
import type {
  OperationalReentryV04ProviderCompatibilityProbeExecutionResultV01,
  OperationalReentryV04ProviderCompatibilityProbePlanArtifactEntryV01,
  OperationalReentryV04ProviderCompatibilityProbePreparedV01,
  OperationalReentryV04ProviderCompatibilityProbeShapeTerminalV01,
} from "@/types/vnext/operational-reentry-v0-4-provider-compatibility-probe";

const SAFE_SEGMENT_V01 = /^[A-Za-z0-9._-]{1,200}$/u;
const SAFE_DIAGNOSTIC_TOKEN_V01 = /^[A-Za-z0-9:._/-]{1,160}$/u;
const SHA256_V01 = /^sha256:[0-9a-f]{64}$/u;
const GIT_SHA_V01 = /^[0-9a-f]{40}$/u;
const PROBE_ARTIFACT_PREFIX_V01 =
  ".augnes-lab/operational-reentry-v04-provider-probes/" as const;
const AUTHORIZATION_CONSUMPTION_DIRECTORY_V01 =
  "authorization-consumptions" as const;

export class OperationalReentryV04ProviderCompatibilityProbeArtifactErrorV01 extends Error {
  constructor(readonly code: string) {
    super(code);
    this.name =
      "OperationalReentryV04ProviderCompatibilityProbeArtifactErrorV01";
  }
}

export interface OperationalReentryV04ProviderCompatibilityProbeArtifactJournalV01 {
  run_root: string;
  relative_run_root: string;
  authorization_fingerprint: string;
  consume_authorization(input: {
    authorization_fingerprint: string;
    probe_id: string;
  }): void;
  append_shape(
    shape: OperationalReentryV04ProviderCompatibilityProbeShapeTerminalV01,
  ): void;
  finalize(
    result: OperationalReentryV04ProviderCompatibilityProbeExecutionResultV01,
  ): OperationalReentryV04ProviderCompatibilityProbeArtifactSummaryV01;
}

export interface OperationalReentryV04ProviderCompatibilityProbeArtifactSummaryV01 {
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

export function beginOperationalReentryV04ProviderCompatibilityProbeAttemptV01(
  input: {
    repository_root: string;
    prepared: OperationalReentryV04ProviderCompatibilityProbePreparedV01;
  },
): OperationalReentryV04ProviderCompatibilityProbeArtifactJournalV01 {
  const repositoryRoot = requireRepositoryRootV01(input.repository_root);
  assertOperationalReentryV04ProviderCompatibilityProbeArtifactPayloadSafeV01(
    input.prepared,
  );
  assertAuthorizationNotPreviouslyConsumedV01(
    repositoryRoot,
    input.prepared.authorization.integrity.fingerprint,
  );
  const relativeRunRoot = `${PROBE_ARTIFACT_PREFIX_V01}${safeSegmentV01(
    input.prepared.manifest.probe_id,
  )}/issue-${input.prepared.authorization.future_live_issue_number}`;
  assertOperationalReentryV04ProviderCompatibilityProbeArtifactRootAvailableV01(
    {
      repository_root: repositoryRoot,
      relative_run_root: relativeRunRoot,
    },
  );
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
    projectOperationalReentryV04ProviderCompatibilityProbePlanForArtifactV01(
      input.prepared.plan,
    ),
  );
  writeExclusiveV01(runRoot, ["identities.json"], {
    identity_version:
      "operational_reentry_v04_provider_compatibility_probe_identities.v0.1",
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
    twin_b_zero_egress_witness_fingerprint:
      input.prepared.representative_shape_plan.twin_b_identity_separation_witness
        .integrity.fingerprint,
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
    adapter_request_route_fingerprint:
      input.prepared.manifest.adapter_request_route_fingerprint,
    codec_version: input.prepared.authorization.codec_version,
    response_schema_version:
      input.prepared.authorization.response_schema_version,
    parser_version: input.prepared.authorization.parser_version,
    response_invalid_observation_version:
      input.prepared.authorization.response_invalid_observation_version,
    response_bytes: input.prepared.authorization.response_bytes,
    max_output_tokens: input.prepared.authorization.max_output_tokens,
    final_request_bytes: input.prepared.authorization.final_request_bytes,
    pricing_fingerprint: input.prepared.pricing.integrity.fingerprint,
    pricing_snapshot_evaluated_at:
      input.prepared.pricing.evaluated_at,
    pricing_authority_fingerprint:
      input.prepared.pricing.gateway_cost_budget.authority
        .pricing_fingerprint,
    pricing_source_version:
      input.prepared.pricing.pricing_source_version,
    exact_cost_basis: input.prepared.pricing.exact_cost_basis,
    missing_usage_or_exact_cost:
      input.prepared.pricing.missing_usage_or_exact_cost,
    pricing_effective_at:
      input.prepared.pricing.pricing_effective_at,
    pricing_expires_at: input.prepared.pricing.pricing_expires_at,
    aggregate_worst_case_cost_nano_usd:
      input.prepared.pricing.aggregate_worst_case_cost_nano_usd,
    aggregate_ceiling_nano_usd:
      input.prepared.pricing.aggregate_ceiling_nano_usd,
    request_family_kind: "operational_reentry_v04_compatibility_probe",
    shapes: input.prepared.plan.entries.map((entry) => ({
      canonical_order: entry.canonical_order,
      shape: entry.shape,
      call_slot_id: entry.call_slot_id,
      local_invocation_identity_fingerprint:
        entry.local_invocation_identity_fingerprint,
      common_task_evidence_fingerprint:
        entry.common_task_evidence_fingerprint,
      provider_material_fingerprint:
        entry.provider_material_fingerprint,
      schema_fingerprint: entry.schema_fingerprint,
      provider_visible_request_fingerprint:
        entry.provider_visible_request_fingerprint,
      route_fingerprint: entry.route_fingerprint,
      provider_contract_fingerprint: entry.provider_contract_fingerprint,
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
        failV01("operational_reentry_v04_probe_authorization_reuse_refused");
      }
      if (
        consumption.authorization_fingerprint !==
          input.prepared.authorization.integrity.fingerprint ||
        consumption.probe_id !== input.prepared.manifest.probe_id
      ) {
        failV01("operational_reentry_v04_probe_authorization_consumption_mismatch");
      }
      const consumptionRecord = {
        consumption_version:
          "operational_reentry_v04_provider_compatibility_probe_authorization_consumption.v0.1",
        authorization_fingerprint:
          input.prepared.authorization.integrity.fingerprint,
        probe_id: input.prepared.manifest.probe_id,
        request_family_kind: "operational_reentry_v04_compatibility_probe",
        first_provider_egress_consumes_authorization: true,
        second_probe_authorized: false,
        historical_authorization_reuse: false,
        retries_authorized: false,
        replacements_authorized: false,
        behavioral_cohort_authorized: false,
        replication_authorized: false,
        policy_authorized: false,
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
      assertOperationalReentryV04ProviderCompatibilityProbeArtifactPayloadSafeV01(
        shape,
      );
      assertBoundedTerminalObservationsV01(shape);
      const expected = input.prepared.plan.entries[nextShape];
      if (
        !expected ||
        shape.canonical_order !== nextShape ||
        shape.shape !== expected.shape ||
        shape.call_slot_id !== expected.call_slot_id ||
        shape.request_family_kind !== "operational_reentry_v04_compatibility_probe" ||
        shape.request_family_trace_id !==
          expected.request_family_trace_id ||
        shape.route_fingerprint !==
          input.prepared.manifest.route.integrity_fingerprint ||
        shape.provider_contract_fingerprint !==
          input.prepared.provider_contract.integrity.fingerprint ||
        shape.pricing_fingerprint !==
          input.prepared.pricing.integrity.fingerprint
      ) {
        failV01("operational_reentry_v04_probe_artifact_shape_order_invalid");
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
        validateOperationalReentryV04ProviderCompatibilityProbeExecutionResultV01(
          resultInput,
        );
      const durableAuthorizationConsumed =
        assertAuthorizationConsumptionHistoryCompleteV01({
          repository_root: repositoryRoot,
          run_root: runRoot,
          authorization_fingerprint:
            input.prepared.authorization.integrity.fingerprint,
        });
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
        durableAuthorizationConsumed !== consumed ||
        result.report.authorization_consumed !== durableAuthorizationConsumed
      ) {
        failV01("operational_reentry_v04_probe_artifact_finalize_mismatch");
      }
      assertOperationalReentryV04ProviderCompatibilityProbeArtifactPayloadSafeV01(
        result.report,
      );
      writeExclusiveV01(runRoot, ["report.json"], result.report);
      const artifacts = readArtifactFingerprintsV01(runRoot);
      const index = {
        index_version:
          "operational_reentry_v04_provider_compatibility_probe_artifact_index.v0.1",
        probe_id: result.manifest.probe_id,
        probe_fingerprint: result.manifest.integrity.fingerprint,
        report_fingerprint: result.report.integrity.fingerprint,
        source_repository_head_sha:
          result.manifest.source_repository_head_sha,
        future_live_issue_number: result.manifest.future_live_issue_number,
        request_family_kind: "operational_reentry_v04_compatibility_probe",
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
      assertOperationalReentryV04ProviderCompatibilityProbeArtifactPayloadSafeV01(
        index,
      );
      const indexText = canonicalizeProtocolValueV01(index);
      writeTextExclusiveV01(runRoot, ["artifact-index.json"], indexText);
      return validateOperationalReentryV04ProviderCompatibilityProbeArtifactsV01(
        {
          repository_root: repositoryRoot,
          run_root: runRoot,
        },
      );
    },
  };
}

export function assertOperationalReentryV04ProviderCompatibilityProbeArtifactRootAvailableV01(
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
    !/^\.augnes-lab\/operational-reentry-v04-provider-probes\/operational-reentry-v04-provider-probe_[0-9a-f]{32}\/issue-[1-9][0-9]*$/u.test(
      normalized,
    ) ||
    lower.includes("/operational-reentry-provider-probes/") ||
    lower.includes("/operational-reentry-clean-control-provider-probes/") ||
    lower.includes("operational-reentry-matched-cohorts") ||
    lower.includes("operational-reentry-matched-cohort-replacements") ||
    lower.includes("replacement_cohort") ||
    lower.includes("cohort_attempt") ||
    lower.includes("behavioral_cohort") ||
    lower.includes("issue-185") ||
    lower.includes("issue-193") ||
    lower.includes("issue-199") ||
    lower.includes("issue-208")
  ) {
    failV01("operational_reentry_v04_probe_historical_or_cohort_root_refused");
  }
  const candidate = path.resolve(repositoryRoot, input.relative_run_root);
  assertContainedV01(repositoryRoot, candidate);
  if (existsSync(candidate)) {
    if (lstatSync(candidate).isSymbolicLink()) {
      failV01("operational_reentry_v04_probe_artifact_symlink_refused");
    }
    failV01("operational_reentry_v04_probe_authorization_collision_refused");
  }
}

export function validateOperationalReentryV04ProviderCompatibilityProbeArtifactsV01(
  input: { repository_root: string; run_root: string },
): OperationalReentryV04ProviderCompatibilityProbeArtifactSummaryV01 {
  const repositoryRoot = requireRepositoryRootV01(input.repository_root);
  const runRoot = realpathSync(input.run_root);
  assertContainedV01(repositoryRoot, runRoot);
  const relativeRunRoot = path
    .relative(repositoryRoot, runRoot)
    .split(path.sep)
    .join("/");
  if (!relativeRunRoot.startsWith(PROBE_ARTIFACT_PREFIX_V01)) {
    failV01("operational_reentry_v04_probe_artifact_root_invalid");
  }
  const authorizationFingerprint = readAuthorizationFingerprintV01(runRoot);
  const durableAuthorizationConsumed =
    assertAuthorizationConsumptionHistoryCompleteV01({
      repository_root: repositoryRoot,
      run_root: runRoot,
      authorization_fingerprint: authorizationFingerprint,
    });
  const indexPath = path.join(runRoot, "artifact-index.json");
  if (!existsSync(indexPath)) {
    failV01("operational_reentry_v04_probe_artifact_index_missing");
  }
  const indexText = readFileSync(indexPath, "utf8").trimEnd();
  let index: {
    index_version: string;
    probe_id: string;
    source_repository_head_sha: string;
    future_live_issue_number: number;
    request_family_kind: string;
    outcome: OperationalReentryV04ProviderCompatibilityProbeArtifactSummaryV01["outcome"];
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
    failV01("operational_reentry_v04_probe_artifact_index_invalid");
  }
  assertOperationalReentryV04ProviderCompatibilityProbeArtifactPayloadSafeV01(
    index,
  );
  assertExactKeysV01(index, [
    "index_version",
    "probe_id",
    "probe_fingerprint",
    "report_fingerprint",
    "source_repository_head_sha",
    "future_live_issue_number",
    "request_family_kind",
    "outcome",
    "authorization_consumed",
    "artifacts",
    "raw_prompt_persisted",
    "raw_request_body_persisted",
    "raw_provider_response_persisted",
    "raw_provider_error_persisted",
    "hidden_reasoning_persisted",
    "credentials_or_secrets_persisted",
    "authorization_header_persisted",
    "cookies_persisted",
    "full_headers_persisted",
    "private_absolute_paths_persisted",
    "product_database_rows_persisted",
    "core_records_persisted",
    "task_context_packet_variants_persisted",
    "proposals_decisions_transitions_or_policies_persisted",
    "behavioral_evaluation_persisted",
    "normalized_outputs_reused_as_behavioral_evidence",
    "tracked_repository_files_written",
    "historical_probe_artifacts_modified",
    "historical_cohort_artifacts_modified",
    "replacement_cohort_artifacts_modified",
  ]);
  if (indexText !== canonicalizeProtocolValueV01(index)) {
    failV01("operational_reentry_v04_probe_artifact_index_invalid");
  }
  const actual = readArtifactFingerprintsV01(runRoot).filter(
    (entry) => entry.path !== "artifact-index.json",
  );
  const expectedArtifactPaths = [
    "authorization.json",
    ...(durableAuthorizationConsumed ? ["authorization-consumed.json"] : []),
    "identities.json",
    "manifest.json",
    "plan.json",
    "report.json",
    "shapes/00.json",
    "shapes/01.json",
    "shapes/02.json",
    "shapes/03.json",
  ].sort((left, right) => left.localeCompare(right, "en"));
  const shapePaths = actual
    .map((entry) => entry.path)
    .filter((entry) => entry.startsWith("shapes/"));
  const storedShapes: OperationalReentryV04ProviderCompatibilityProbeShapeTerminalV01[] = [];
  for (const shapePath of shapePaths) {
    let shape: OperationalReentryV04ProviderCompatibilityProbeShapeTerminalV01;
    try {
      shape = JSON.parse(
        readFileSync(path.join(runRoot, shapePath), "utf8"),
      ) as OperationalReentryV04ProviderCompatibilityProbeShapeTerminalV01;
    } catch {
      failV01("operational_reentry_v04_probe_artifact_shape_invalid");
    }
    assertSealedArtifactV01(
      shape,
      "operational_reentry_v04_probe_artifact_shape_invalid",
    );
    assertExactKeysV01(
      shape,
      [
        "canonical_order",
        "shape",
        "call_slot_id",
        "terminal_category",
        "egress_attempted",
        "request_family_kind",
        "request_family_trace_id",
        "client_request_id",
        "local_invocation_identity_fingerprint",
        "schema_fingerprint",
        "provider_visible_request_fingerprint",
        "route_fingerprint",
        "adapter_request_route_fingerprint",
        "provider_contract_fingerprint",
        "pricing_fingerprint",
        "input_bytes",
        "usage",
        "latency_ms",
        "normalized_output",
        "normalized_output_fingerprint",
        "receipt",
        "provider_rejection_observation",
        "provider_response_invalid_observation",
        "terminal_failure_code",
        "exact_cost",
        "worst_case_cost_nano_usd",
        "operator_intervention",
        "integrity",
      ],
      "operational_reentry_v04_probe_artifact_shape_invalid",
    );
    assertBoundedTerminalObservationsV01(shape);
    storedShapes.push(shape);
  }
  if (
    index.index_version !==
      "operational_reentry_v04_provider_compatibility_probe_artifact_index.v0.1" ||
    typeof index.probe_id !== "string" ||
    !SHA256_V01.test(index.probe_fingerprint) ||
    !SHA256_V01.test(index.report_fingerprint) ||
    !GIT_SHA_V01.test(index.source_repository_head_sha) ||
    !Number.isSafeInteger(index.future_live_issue_number) ||
    index.future_live_issue_number <= 214 ||
    typeof index.request_family_kind !== "string" ||
    ![
      "accepted_all_shapes",
      "provider_rejected",
      "provider_response_invalid",
      "transport_or_runtime_incomplete",
      "not_run",
    ].includes(index.outcome) ||
    typeof index.authorization_consumed !== "boolean" ||
    !Array.isArray(index.artifacts) ||
    index.artifacts.some(
      (entry) =>
        !entry ||
        typeof entry !== "object" ||
        canonicalizeProtocolValueV01(Object.keys(entry).sort()) !==
          canonicalizeProtocolValueV01(["fingerprint", "path"]) ||
        typeof entry.path !== "string" ||
        !SHA256_V01.test(entry.fingerprint),
    ) ||
    canonicalizeProtocolValueV01(actual) !==
      canonicalizeProtocolValueV01(index.artifacts) ||
    canonicalizeProtocolValueV01(
      actual.map(({ path: artifactPath }) => artifactPath),
    ) !==
      canonicalizeProtocolValueV01(expectedArtifactPaths) ||
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
    failV01("operational_reentry_v04_probe_artifact_index_invalid");
  }
  let report: {
    probe_id: string;
    outcome: OperationalReentryV04ProviderCompatibilityProbeArtifactSummaryV01["outcome"];
    planned_shapes: number;
    shape_records: number;
    terminal_shape_count: number;
    attempted_provider_calls: number;
    accepted_and_normalized_shapes: number;
    not_attempted_after_terminal_failure: number;
    authorization_consumed: boolean;
    first_terminal_failure: string | null;
    terminal_category_counts: Record<string, number>;
    exact_cost: {
      aggregate_worst_case_cost_nano_usd: number;
      aggregate_ceiling_nano_usd: number;
      exact_cost_basis: string;
      missing_usage_or_exact_cost: string;
    };
    integrity: { fingerprint: string };
  };
  try {
    report = JSON.parse(
      readFileSync(path.join(runRoot, "report.json"), "utf8"),
    ) as typeof report;
  } catch {
    failV01("operational_reentry_v04_probe_report_invalid");
  }
  assertSealedArtifactV01(report, "operational_reentry_v04_probe_report_invalid");
  const manifest = readSealedArtifactV01(runRoot, "manifest.json") as {
    probe_id: string;
    source_repository_head_sha: string;
    future_live_issue_number: number;
    request_family_kind: string;
    authorization_fingerprint: string;
    case_fingerprint: string;
    common_task_evidence_fingerprint: string;
    representative_shape_plan_fingerprint: string;
    twin_b_zero_egress_witness_fingerprint: string;
    plan_fingerprint: string;
    route: {
      integrity_fingerprint: string;
      provider_ref: unknown;
      model_ref: unknown;
      adapter_implementation_id: string;
      adapter_implementation_version: string;
      provider_contract_version: string;
    };
    provider_contract_fingerprint: string;
    adapter_request_route_fingerprint: string;
    pricing_fingerprint: string;
    pricing_authority_fingerprint: string;
    integrity: { fingerprint: string };
  };
  const authorization = readSealedArtifactV01(
    runRoot,
    "authorization.json",
  ) as {
    exact_merged_source_head: string;
    future_live_issue_number: number;
    request_family_kind: string;
    repository_slug: string;
    authorized_origin: string;
    project_root_fingerprint: string;
    case_fingerprint: string;
    common_task_evidence_fingerprint: string;
    representative_shape_plan_fingerprint: string;
    twin_b_zero_egress_witness_fingerprint: string;
    route_fingerprint: string;
    provider_contract_fingerprint: string;
    adapter_request_route_fingerprint: string;
    adapter_implementation_id: string;
    adapter_implementation_version: string;
    provider_contract_version: string;
    codec_version: string;
    response_schema_version: string;
    parser_version: string;
    response_invalid_observation_version: string;
    response_bytes: number;
    max_output_tokens: number;
    final_request_bytes: number;
    pricing_fingerprint: string;
    pricing_snapshot_evaluated_at: string;
    pricing_authority_fingerprint: string;
    pricing_authority_expires_at: string;
    integrity: { fingerprint: string };
  };
  let plan: {
    plan_version: string;
    plan_fingerprint: string;
    authorization_fingerprint: string;
    source_repository_head_sha: string;
    future_live_issue_number: number;
    request_family_kind: string;
    request_family_basis_fingerprint: string;
    representative_shape_plan_fingerprint: string;
    canonical_order: string[];
    planned_shapes: number;
    maximum_provider_calls: number;
    maximum_parallel_calls: number;
    retries: number;
    replacement_calls: number;
    fresh_stateless_request_per_shape: boolean;
    conversation_reuse: boolean;
    thread_reuse: boolean;
    previous_response_reuse: boolean;
    adaptive_prompt_schema_or_input_changes: boolean;
    stop_after_first_non_success_terminal_result: boolean;
    remaining_shapes_after_terminal_failure: string;
    entries: OperationalReentryV04ProviderCompatibilityProbePlanArtifactEntryV01[];
  };
  let identities: Record<string, unknown> & {
    shapes: Array<Record<string, unknown>>;
  };
  try {
    plan = JSON.parse(
      readFileSync(path.join(runRoot, "plan.json"), "utf8"),
    ) as typeof plan;
    identities = JSON.parse(
      readFileSync(path.join(runRoot, "identities.json"), "utf8"),
    ) as typeof identities;
  } catch {
    failV01("operational_reentry_v04_probe_artifact_cross_link_invalid");
  }
  assertOperationalReentryV04ProviderCompatibilityProbeArtifactPayloadSafeV01(
    plan,
  );
  assertOperationalReentryV04ProviderCompatibilityProbeArtifactPayloadSafeV01(
    identities,
  );
  assertExactKeysV01(plan, [
    "plan_version",
    "plan_fingerprint",
    "authorization_fingerprint",
    "source_repository_head_sha",
    "future_live_issue_number",
    "request_family_kind",
    "request_family_basis_fingerprint",
    "representative_shape_plan_fingerprint",
    "canonical_order",
    "planned_shapes",
    "maximum_provider_calls",
    "maximum_parallel_calls",
    "retries",
    "replacement_calls",
    "fresh_stateless_request_per_shape",
    "conversation_reuse",
    "thread_reuse",
    "previous_response_reuse",
    "adaptive_prompt_schema_or_input_changes",
    "stop_after_first_non_success_terminal_result",
    "remaining_shapes_after_terminal_failure",
    "entries",
  ], "operational_reentry_v04_probe_artifact_cross_link_invalid");
  const identityKeys = [
    "identity_version", "probe_id", "source_repository_head_sha",
    "future_live_issue_number", "repository_slug", "authorized_origin",
    "project_root_fingerprint", "source_ref", "case_fingerprint",
    "common_task_evidence_fingerprint", "representative_shape_plan_fingerprint",
    "twin_b_zero_egress_witness_fingerprint", "plan_fingerprint",
    "route_fingerprint", "provider_ref", "model_ref",
    "adapter_implementation_id", "adapter_implementation_version",
    "provider_contract_version", "provider_contract_fingerprint",
    "adapter_request_route_fingerprint", "codec_version",
    "response_schema_version", "parser_version",
    "response_invalid_observation_version", "response_bytes",
    "max_output_tokens", "final_request_bytes", "pricing_fingerprint",
    "pricing_snapshot_evaluated_at", "pricing_authority_fingerprint",
    "pricing_source_version", "exact_cost_basis",
    "missing_usage_or_exact_cost", "pricing_effective_at",
    "pricing_expires_at", "aggregate_worst_case_cost_nano_usd",
    "aggregate_ceiling_nano_usd", "request_family_kind", "shapes",
    "raw_prompt_persisted", "raw_request_body_persisted",
    "raw_provider_response_persisted", "raw_provider_error_persisted",
    "hidden_reasoning_persisted", "credentials_or_full_headers_persisted",
    "private_absolute_paths_persisted", "behavioral_evaluation_persisted",
  ];
  assertExactKeysV01(
    identities,
    identityKeys,
    "operational_reentry_v04_probe_artifact_cross_link_invalid",
  );
  if (
    report.integrity.fingerprint !== index.report_fingerprint ||
    index.probe_fingerprint !== manifest.integrity.fingerprint
  ) {
    failV01("operational_reentry_v04_probe_report_fingerprint_invalid");
  }
  const planEntryKeys = [
    "canonical_order",
    "shape",
    "call_slot_id",
    "local_invocation_identity_fingerprint",
    "common_task_evidence_fingerprint",
    "provider_material_fingerprint",
    "schema_fingerprint",
    "provider_visible_request_fingerprint",
    "route_fingerprint",
    "provider_contract_fingerprint",
    "adapter_request_route_fingerprint",
    "strict_schema_preflight",
    "request_family_trace_id",
    "client_request_id",
    "provider_visible_input_persisted",
    "raw_request_body_persisted",
  ];
  const identityShapesFromPlan = plan.entries.map((entry, position) => {
    assertExactKeysV01(
      entry,
      planEntryKeys,
      "operational_reentry_v04_probe_artifact_cross_link_invalid",
    );
    const {
      strict_schema_preflight: strictSchemaPreflight,
      provider_visible_input_persisted: providerVisibleInputPersisted,
      raw_request_body_persisted: rawRequestBodyPersisted,
      ...identityShape
    } = entry;
    const storedShape = storedShapes[position];
    if (
      entry.canonical_order !== position ||
      entry.shape !== ["A", "B", "C", "D"][position] ||
      strictSchemaPreflight !== "passed" ||
      providerVisibleInputPersisted !== false ||
      rawRequestBodyPersisted !== false ||
      !storedShape ||
      storedShape.canonical_order !== entry.canonical_order ||
      storedShape.shape !== entry.shape ||
      storedShape.call_slot_id !== entry.call_slot_id ||
      storedShape.local_invocation_identity_fingerprint !==
        entry.local_invocation_identity_fingerprint ||
      storedShape.schema_fingerprint !== entry.schema_fingerprint ||
      storedShape.provider_visible_request_fingerprint !==
        entry.provider_visible_request_fingerprint ||
      storedShape.route_fingerprint !== entry.route_fingerprint ||
      storedShape.provider_contract_fingerprint !==
        entry.provider_contract_fingerprint ||
      storedShape.adapter_request_route_fingerprint !==
        entry.adapter_request_route_fingerprint ||
      storedShape.request_family_trace_id !== entry.request_family_trace_id ||
      storedShape.client_request_id !== entry.client_request_id
    ) {
      failV01("operational_reentry_v04_probe_artifact_cross_link_invalid");
    }
    return identityShape;
  });
  const terminalCategories = [
    "accepted_and_normalized",
    "provider_rejected",
    "provider_response_invalid",
    "transport_failed",
    "timed_out",
    "cancelled",
    "blocked_before_egress",
    "internal_failure",
    "not_attempted_after_terminal_failure",
  ];
  const terminalCategoryCounts = Object.fromEntries(
    terminalCategories.map((category) => [
      category,
      storedShapes.filter((shape) => shape.terminal_category === category).length,
    ]),
  );
  const firstTerminalFailure = storedShapes.find(
    (shape) =>
      shape.terminal_category !== "accepted_and_normalized" &&
      shape.terminal_category !== "not_attempted_after_terminal_failure",
  )?.terminal_category ?? null;
  const expectedOutcome = storedShapes.every(
    (shape) => shape.terminal_category === "accepted_and_normalized",
  )
    ? "accepted_all_shapes"
    : firstTerminalFailure === "provider_rejected"
      ? "provider_rejected"
      : firstTerminalFailure === "provider_response_invalid"
        ? "provider_response_invalid"
        : "transport_or_runtime_incomplete";
  if (
    plan.plan_version !==
      "operational_reentry_v04_provider_compatibility_probe_plan.v0.1" ||
    plan.plan_fingerprint !== manifest.plan_fingerprint ||
    plan.authorization_fingerprint !== authorization.integrity.fingerprint ||
    manifest.authorization_fingerprint !== authorization.integrity.fingerprint ||
    plan.source_repository_head_sha !== authorization.exact_merged_source_head ||
    plan.future_live_issue_number !== authorization.future_live_issue_number ||
    plan.request_family_kind !== "operational_reentry_v04_compatibility_probe" ||
    plan.representative_shape_plan_fingerprint !==
      authorization.representative_shape_plan_fingerprint ||
    manifest.representative_shape_plan_fingerprint !==
      authorization.representative_shape_plan_fingerprint ||
    manifest.twin_b_zero_egress_witness_fingerprint !==
      authorization.twin_b_zero_egress_witness_fingerprint ||
    canonicalizeProtocolValueV01(plan.canonical_order) !==
      canonicalizeProtocolValueV01(["A", "B", "C", "D"]) ||
    plan.planned_shapes !== 4 ||
    plan.maximum_provider_calls !== 4 ||
    plan.maximum_parallel_calls !== 1 ||
    plan.retries !== 0 ||
    plan.replacement_calls !== 0 ||
    plan.fresh_stateless_request_per_shape !== true ||
    plan.conversation_reuse !== false ||
    plan.thread_reuse !== false ||
    plan.previous_response_reuse !== false ||
    plan.adaptive_prompt_schema_or_input_changes !== false ||
    plan.stop_after_first_non_success_terminal_result !== true ||
    plan.remaining_shapes_after_terminal_failure !==
      "not_attempted_after_terminal_failure" ||
    plan.entries.length !== 4 ||
    !Array.isArray(identities.shapes) ||
    canonicalizeProtocolValueV01(identities.shapes) !==
      canonicalizeProtocolValueV01(identityShapesFromPlan) ||
    identities["identity_version"] !==
      "operational_reentry_v04_provider_compatibility_probe_identities.v0.1" ||
    identities["probe_id"] !== manifest.probe_id ||
    identities["source_repository_head_sha"] !==
      manifest.source_repository_head_sha ||
    identities["future_live_issue_number"] !==
      manifest.future_live_issue_number ||
    identities["repository_slug"] !== authorization.repository_slug ||
    identities["authorized_origin"] !== authorization.authorized_origin ||
    identities["project_root_fingerprint"] !==
      authorization.project_root_fingerprint ||
    identities["case_fingerprint"] !== authorization.case_fingerprint ||
    identities["common_task_evidence_fingerprint"] !==
      authorization.common_task_evidence_fingerprint ||
    identities["representative_shape_plan_fingerprint"] !==
      authorization.representative_shape_plan_fingerprint ||
    identities["twin_b_zero_egress_witness_fingerprint"] !==
      authorization.twin_b_zero_egress_witness_fingerprint ||
    identities["plan_fingerprint"] !== plan.plan_fingerprint ||
    identities["route_fingerprint"] !== authorization.route_fingerprint ||
    canonicalizeProtocolValueV01(identities["provider_ref"]) !==
      canonicalizeProtocolValueV01(manifest.route.provider_ref) ||
    canonicalizeProtocolValueV01(identities["model_ref"]) !==
      canonicalizeProtocolValueV01(manifest.route.model_ref) ||
    identities["adapter_implementation_id"] !==
      authorization.adapter_implementation_id ||
    identities["adapter_implementation_version"] !==
      authorization.adapter_implementation_version ||
    identities["provider_contract_version"] !==
      authorization.provider_contract_version ||
    identities["provider_contract_fingerprint"] !==
      authorization.provider_contract_fingerprint ||
    identities["adapter_request_route_fingerprint"] !==
      authorization.adapter_request_route_fingerprint ||
    identities["codec_version"] !== authorization.codec_version ||
    identities["response_schema_version"] !==
      authorization.response_schema_version ||
    identities["parser_version"] !== authorization.parser_version ||
    identities["response_invalid_observation_version"] !==
      authorization.response_invalid_observation_version ||
    identities["response_bytes"] !== authorization.response_bytes ||
    identities["max_output_tokens"] !== authorization.max_output_tokens ||
    identities["final_request_bytes"] !== authorization.final_request_bytes ||
    identities["pricing_fingerprint"] !== authorization.pricing_fingerprint ||
    identities["pricing_snapshot_evaluated_at"] !==
      authorization.pricing_snapshot_evaluated_at ||
    identities["pricing_authority_fingerprint"] !==
      authorization.pricing_authority_fingerprint ||
    identities["pricing_expires_at"] !==
      authorization.pricing_authority_expires_at ||
    identities["exact_cost_basis"] !==
      "validated_provider_reported_token_usage" ||
    identities["missing_usage_or_exact_cost"] !== "unknown_never_zero" ||
    identities["request_family_kind"] !==
      "operational_reentry_v04_compatibility_probe" ||
    report.planned_shapes !== 4 ||
    report.shape_records !== storedShapes.length ||
    report.terminal_shape_count !==
      storedShapes.filter(
        (shape) =>
          shape.terminal_category !== "not_attempted_after_terminal_failure",
      ).length ||
    report.attempted_provider_calls !==
      storedShapes.filter((shape) => shape.egress_attempted).length ||
    report.accepted_and_normalized_shapes !==
      terminalCategoryCounts["accepted_and_normalized"] ||
    report.not_attempted_after_terminal_failure !==
      terminalCategoryCounts["not_attempted_after_terminal_failure"] ||
    report.first_terminal_failure !== firstTerminalFailure ||
    canonicalizeProtocolValueV01(report.terminal_category_counts) !==
      canonicalizeProtocolValueV01(terminalCategoryCounts) ||
    report.outcome !== expectedOutcome ||
    report.exact_cost.aggregate_worst_case_cost_nano_usd !==
      identities["aggregate_worst_case_cost_nano_usd"] ||
    report.exact_cost.aggregate_ceiling_nano_usd !==
      identities["aggregate_ceiling_nano_usd"] ||
    report.exact_cost.exact_cost_basis !==
      "validated_provider_reported_token_usage" ||
    report.exact_cost.missing_usage_or_exact_cost !== "unknown_never_zero"
  ) {
    failV01("operational_reentry_v04_probe_artifact_cross_link_invalid");
  }
  if (
    index.probe_id !== manifest.probe_id ||
    index.probe_id !== report.probe_id ||
    index.outcome !== report.outcome ||
    index.source_repository_head_sha !==
      manifest.source_repository_head_sha ||
    index.source_repository_head_sha !==
      authorization.exact_merged_source_head ||
    index.future_live_issue_number !== manifest.future_live_issue_number ||
    index.future_live_issue_number !==
      authorization.future_live_issue_number ||
    index.request_family_kind !== manifest.request_family_kind ||
    index.request_family_kind !== authorization.request_family_kind ||
    index.request_family_kind !== "operational_reentry_v04_compatibility_probe"
  ) {
    failV01("operational_reentry_v04_probe_artifact_index_source_mismatch");
  }
  if (
    report.authorization_consumed !== durableAuthorizationConsumed ||
    index.authorization_consumed !== durableAuthorizationConsumed
  ) {
    failV01(
      "operational_reentry_v04_probe_authorization_consumption_history_incomplete",
    );
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

export function assertOperationalReentryV04ProviderCompatibilityProbeArtifactPayloadSafeV01(
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
        failV01("operational_reentry_v04_probe_artifact_secret_or_private_path_refused");
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
        failV01("operational_reentry_v04_probe_artifact_forbidden_field_refused");
      }
      if (
        normalizedKey.endsWith("_persisted") ||
        normalizedKey.endsWith("_written") ||
        normalizedKey.endsWith("_modified") ||
        normalizedKey.endsWith("_reused")
      ) {
        if (childValue !== false) {
          failV01("operational_reentry_v04_probe_artifact_privacy_flag_invalid");
        }
      }
      visit(childValue);
    }
  };
  visit(value);
}

function assertBoundedTerminalObservationsV01(
  shape: OperationalReentryV04ProviderCompatibilityProbeShapeTerminalV01,
): void {
  if (
    !shape ||
    typeof shape !== "object" ||
    shape.request_family_kind !== "operational_reentry_v04_compatibility_probe" ||
    (shape.provider_rejection_observation !== null &&
      shape.terminal_category !== "provider_rejected") ||
    (shape.provider_response_invalid_observation !== null &&
      shape.terminal_category !== "provider_response_invalid") ||
    (shape.provider_rejection_observation !== null &&
      shape.provider_response_invalid_observation !== null)
  ) {
    failV01("operational_reentry_v04_probe_terminal_observation_invalid");
  }
  const observation = shape.provider_response_invalid_observation;
  if (observation) {
    const expectedKeys = [
      "observation_version",
      "stage",
      "provider_status",
      "incomplete_reason",
      "output_text_present",
      "provider_request_id",
      "client_request_id",
      "route_fingerprint",
      "request_fingerprint",
      "schema_fingerprint",
    ].sort();
    if (
      canonicalizeProtocolValueV01(Object.keys(observation).sort()) !==
        canonicalizeProtocolValueV01(expectedKeys) ||
      observation.observation_version !==
        MODEL_PROVIDER_RESPONSE_INVALID_OBSERVATION_VERSION_V01 ||
      !MODEL_PROVIDER_RESPONSE_INVALID_STAGES_V01.includes(observation.stage) ||
      (observation.provider_status !== null &&
        !MODEL_PROVIDER_RESPONSE_STATUSES_V01.includes(
          observation.provider_status,
        )) ||
      (observation.incomplete_reason !== null &&
        !MODEL_PROVIDER_INCOMPLETE_REASONS_V01.includes(
          observation.incomplete_reason,
        )) ||
      typeof observation.output_text_present !== "boolean" ||
      observation.client_request_id !== shape.client_request_id ||
      observation.route_fingerprint !==
        shape.adapter_request_route_fingerprint ||
      observation.request_fingerprint !==
        shape.provider_visible_request_fingerprint ||
      observation.schema_fingerprint !== shape.schema_fingerprint
    ) {
      failV01("operational_reentry_v04_probe_response_invalid_observation_malformed");
    }
  }
  const rejection = shape.provider_rejection_observation;
  if (rejection) {
    assertExactKeysV01(
      rejection,
      [
        "observation_version",
        "http_status",
        "error_type",
        "error_code",
        "error_param",
        "provider_request_id",
        "client_request_id",
        "route_fingerprint",
        "request_fingerprint",
        "schema_fingerprint",
      ],
      "operational_reentry_v04_probe_rejection_observation_malformed",
    );
    if (
      rejection.observation_version !==
      "model_provider_rejection_observation.v0.1" ||
      !Number.isSafeInteger(rejection.http_status) ||
      rejection.http_status < 400 ||
      rejection.http_status > 599 ||
      [
        rejection.error_type,
        rejection.error_code,
        rejection.error_param,
        rejection.provider_request_id,
      ].some(
          (token) =>
            token !== null &&
            (typeof token !== "string" ||
              !SAFE_DIAGNOSTIC_TOKEN_V01.test(token)),
        ) ||
      rejection.client_request_id !== shape.client_request_id ||
      rejection.route_fingerprint !== shape.adapter_request_route_fingerprint ||
      rejection.request_fingerprint !==
        shape.provider_visible_request_fingerprint ||
      rejection.schema_fingerprint !== shape.schema_fingerprint
    ) {
      failV01("operational_reentry_v04_probe_rejection_observation_malformed");
    }
  }
}

function readArtifactFingerprintsV01(runRoot: string) {
  const walk = (directory: string): string[] =>
    readdirSync(directory).flatMap((entry) => {
      const target = path.join(directory, entry);
      const stat = lstatSync(target);
      if (stat.isSymbolicLink()) {
        failV01("operational_reentry_v04_probe_artifact_symlink_refused");
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

function readSealedArtifactV01(
  runRoot: string,
  relativePath: string,
): { integrity: { fingerprint: string } } {
  let value: unknown;
  try {
    value = JSON.parse(readFileSync(path.join(runRoot, relativePath), "utf8"));
  } catch {
    failV01("operational_reentry_v04_probe_artifact_sealed_record_invalid");
  }
  assertSealedArtifactV01(
    value,
    "operational_reentry_v04_probe_artifact_sealed_record_invalid",
  );
  return value as { integrity: { fingerprint: string } };
}

function assertSealedArtifactV01(value: unknown, code: string): void {
  if (
    typeof value !== "object" ||
    value === null ||
    Array.isArray(value) ||
    !("integrity" in value) ||
    typeof value.integrity !== "object" ||
    value.integrity === null ||
    Array.isArray(value.integrity)
  ) {
    failV01(code);
  }
  const record = value as Record<string, unknown>;
  const integrity = record.integrity as Record<string, unknown>;
  const { integrity: _integrity, ...withoutIntegrity } = record;
  if (
    integrity.algorithm !== "sha256" ||
    integrity.canonicalization !== "augnes-json-c14n-v0_1" ||
    typeof integrity.fingerprint_scope !== "string" ||
    !SHA256_V01.test(integrity.fingerprint as string) ||
    integrity.fingerprint !==
      createProtocolSha256V01(canonicalizeProtocolValueV01(withoutIntegrity))
  ) {
    failV01(code);
  }
}

function assertExactKeysV01(
  value: unknown,
  expected: string[],
  code = "operational_reentry_v04_probe_artifact_index_invalid",
): void {
  if (
    typeof value !== "object" ||
    value === null ||
    Array.isArray(value) ||
    canonicalizeProtocolValueV01(Object.keys(value).sort()) !==
      canonicalizeProtocolValueV01([...expected].sort())
  ) {
    failV01(code);
  }
}

function requireRepositoryRootV01(input: string): string {
  if (!path.isAbsolute(input)) {
    failV01("operational_reentry_v04_probe_repository_root_invalid");
  }
  const root = realpathSync(input);
  const ignore = readFileSync(path.join(root, ".gitignore"), "utf8");
  if (
    !ignore
      .split(/\r?\n/u)
      .map((line) => line.trim())
      .includes(".augnes-lab/")
  ) {
    failV01("operational_reentry_v04_probe_artifact_root_not_ignored");
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
    failV01("operational_reentry_v04_probe_artifact_segment_invalid");
  }
  return segment;
}

function authorizationConsumptionPathV01(
  repositoryRoot: string,
  authorizationFingerprint: string,
): string {
  const target = path.join(
    repositoryRoot,
    ...PROBE_ARTIFACT_PREFIX_V01.split("/").filter(Boolean),
    AUTHORIZATION_CONSUMPTION_DIRECTORY_V01,
    `${safeSegmentV01(authorizationFingerprint)}.json`,
  );
  assertContainedV01(repositoryRoot, target);
  return target;
}

function readAuthorizationFingerprintV01(runRoot: string): string {
  const authorizationPath = path.join(runRoot, "authorization.json");
  let authorization: { integrity?: { fingerprint?: unknown } };
  try {
    const stat = lstatSync(authorizationPath);
    if (stat.isSymbolicLink() || !stat.isFile()) {
      failV01("operational_reentry_v04_probe_artifact_authorization_invalid");
    }
    authorization = JSON.parse(
      readFileSync(authorizationPath, "utf8"),
    ) as typeof authorization;
  } catch (error) {
    if (
      error instanceof
      OperationalReentryV04ProviderCompatibilityProbeArtifactErrorV01
    ) {
      throw error;
    }
    failV01("operational_reentry_v04_probe_artifact_authorization_invalid");
  }
  if (typeof authorization.integrity?.fingerprint !== "string") {
    failV01("operational_reentry_v04_probe_artifact_authorization_invalid");
  }
  return authorization.integrity.fingerprint;
}

function assertAuthorizationConsumptionHistoryCompleteV01(input: {
  repository_root: string;
  run_root: string;
  authorization_fingerprint: string;
}): boolean {
  const globalMarker = readConsumptionRecordV01(
    authorizationConsumptionPathV01(
      input.repository_root,
      input.authorization_fingerprint,
    ),
  );
  const runLocalRecord = readConsumptionRecordV01(
    path.join(input.run_root, "authorization-consumed.json"),
  );
  if (
    (globalMarker === null) !== (runLocalRecord === null) ||
    (globalMarker !== null && globalMarker !== runLocalRecord)
  ) {
    failV01(
      "operational_reentry_v04_probe_authorization_consumption_history_incomplete",
    );
  }
  return globalMarker !== null;
}

function readConsumptionRecordV01(target: string): string | null {
  if (!existsSync(target)) return null;
  try {
    const stat = lstatSync(target);
    if (stat.isSymbolicLink() || !stat.isFile()) {
      failV01(
        "operational_reentry_v04_probe_authorization_consumption_history_incomplete",
      );
    }
    return readFileSync(target, "utf8").trimEnd();
  } catch (error) {
    if (
      error instanceof
      OperationalReentryV04ProviderCompatibilityProbeArtifactErrorV01
    ) {
      throw error;
    }
    failV01(
      "operational_reentry_v04_probe_authorization_consumption_history_incomplete",
    );
  }
}

function assertAuthorizationNotPreviouslyConsumedV01(
  repositoryRoot: string,
  authorizationFingerprint: string,
): void {
  if (
    existsSync(
      authorizationConsumptionPathV01(
        repositoryRoot,
        authorizationFingerprint,
      ),
    )
  ) {
    failV01("operational_reentry_v04_probe_authorization_global_collision_refused");
  }
}

function writeAuthorizationConsumptionExclusiveV01(
  repositoryRoot: string,
  authorizationFingerprint: string,
  value: unknown,
): void {
  assertOperationalReentryV04ProviderCompatibilityProbeArtifactPayloadSafeV01(
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
      failV01("operational_reentry_v04_probe_authorization_global_collision_refused");
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

function writeExclusiveV01(
  runRoot: string,
  segments: string[],
  value: unknown,
): void {
  assertOperationalReentryV04ProviderCompatibilityProbeArtifactPayloadSafeV01(
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
    failV01("operational_reentry_v04_probe_artifact_overwrite_refused");
  }
  const temporary = `${target}.tmp`;
  if (existsSync(temporary)) {
    failV01("operational_reentry_v04_probe_artifact_stale_temporary");
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
        failV01("operational_reentry_v04_probe_artifact_directory_invalid");
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
    failV01("operational_reentry_v04_probe_artifact_path_escape");
  }
}

function failV01(code: string): never {
  throw new OperationalReentryV04ProviderCompatibilityProbeArtifactErrorV01(
    code,
  );
}
