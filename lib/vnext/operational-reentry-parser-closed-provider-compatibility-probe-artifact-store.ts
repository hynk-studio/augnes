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
  projectOperationalReentryParserClosedProviderCompatibilityProbePlanForArtifactV01,
  validateOperationalReentryParserClosedProviderCompatibilityProbeExecutionResultV01,
} from "@/lib/vnext/operational-reentry-parser-closed-provider-compatibility-probe";
import {
  canonicalizeProtocolValueV01,
  createProtocolSha256V01,
} from "@/lib/vnext/protocol-primitives";
import {
  projectArtifactEvidenceReadPathV01,
  type ArtifactEvidenceReadScopeV01,
} from "@/lib/vnext/migrated-historical-evidence";
import type {
  OperationalReentryParserClosedProviderCompatibilityProbeExecutionResultV01,
  OperationalReentryParserClosedProviderCompatibilityProbePreparedV01,
  OperationalReentryParserClosedProviderCompatibilityProbeShapeTerminalV01,
} from "@/types/vnext/operational-reentry-parser-closed-provider-compatibility-probe";

const SAFE_SEGMENT_V01 = /^[A-Za-z0-9._-]{1,200}$/u;
const SAFE_DIAGNOSTIC_TOKEN_V01 = /^[A-Za-z0-9:._/-]{1,160}$/u;
const SHA256_V01 = /^sha256:[0-9a-f]{64}$/u;
const GIT_SHA_V01 = /^[0-9a-f]{40}$/u;
const PROBE_ARTIFACT_PREFIX_V01 =
  ".augnes-lab/operational-reentry-parser-closed-provider-probes/" as const;
const AUTHORIZATION_CONSUMPTION_DIRECTORY_V01 =
  "authorization-consumptions" as const;

export class OperationalReentryParserClosedProviderCompatibilityProbeArtifactErrorV01 extends Error {
  constructor(readonly code: string) {
    super(code);
    this.name =
      "OperationalReentryParserClosedProviderCompatibilityProbeArtifactErrorV01";
  }
}

export interface OperationalReentryParserClosedProviderCompatibilityProbeArtifactJournalV01 {
  run_root: string;
  relative_run_root: string;
  authorization_fingerprint: string;
  consume_authorization(input: {
    authorization_fingerprint: string;
    probe_id: string;
  }): void;
  append_shape(
    shape: OperationalReentryParserClosedProviderCompatibilityProbeShapeTerminalV01,
  ): void;
  finalize(
    result: OperationalReentryParserClosedProviderCompatibilityProbeExecutionResultV01,
  ): OperationalReentryParserClosedProviderCompatibilityProbeArtifactSummaryV01;
}

export interface OperationalReentryParserClosedProviderCompatibilityProbeArtifactSummaryV01 {
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

export function beginOperationalReentryParserClosedProviderCompatibilityProbeAttemptV01(
  input: {
    repository_root: string;
    prepared: OperationalReentryParserClosedProviderCompatibilityProbePreparedV01;
  },
): OperationalReentryParserClosedProviderCompatibilityProbeArtifactJournalV01 {
  const repositoryRoot = requireRepositoryRootV01(input.repository_root);
  assertOperationalReentryParserClosedProviderCompatibilityProbeArtifactPayloadSafeV01(
    input.prepared,
  );
  assertAuthorizationNotPreviouslyConsumedV01(
    repositoryRoot,
    input.prepared.authorization.integrity.fingerprint,
  );
  const relativeRunRoot = `${PROBE_ARTIFACT_PREFIX_V01}${safeSegmentV01(
    input.prepared.manifest.probe_id,
  )}/issue-${input.prepared.authorization.future_live_issue_number}`;
  assertOperationalReentryParserClosedProviderCompatibilityProbeArtifactRootAvailableV01(
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
    projectOperationalReentryParserClosedProviderCompatibilityProbePlanForArtifactV01(
      input.prepared.plan,
    ),
  );
  writeExclusiveV01(runRoot, ["identities.json"], {
    identity_version:
      "operational_reentry_parser_closed_provider_compatibility_probe_identities.v0.1",
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
    request_family_kind: "parser_closed_compatibility_probe",
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
        failV01("parser_closed_probe_authorization_reuse_refused");
      }
      if (
        consumption.authorization_fingerprint !==
          input.prepared.authorization.integrity.fingerprint ||
        consumption.probe_id !== input.prepared.manifest.probe_id
      ) {
        failV01("parser_closed_probe_authorization_consumption_mismatch");
      }
      const consumptionRecord = {
        consumption_version:
          "operational_reentry_parser_closed_provider_compatibility_probe_authorization_consumption.v0.1",
        authorization_fingerprint:
          input.prepared.authorization.integrity.fingerprint,
        probe_id: input.prepared.manifest.probe_id,
        request_family_kind: "parser_closed_compatibility_probe",
        first_provider_egress_consumes_authorization: true,
        second_probe_authorized: false,
        issue_208_authorization_reuse: false,
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
      assertOperationalReentryParserClosedProviderCompatibilityProbeArtifactPayloadSafeV01(
        shape,
      );
      assertBoundedTerminalObservationsV01(shape);
      const expected = input.prepared.plan.entries[nextShape];
      if (
        !expected ||
        shape.canonical_order !== nextShape ||
        shape.shape !== expected.shape ||
        shape.call_slot_id !== expected.call_slot_id ||
        shape.request_family_kind !== "parser_closed_compatibility_probe" ||
        shape.request_family_trace_id !==
          expected.request_family_trace_id ||
        shape.route_fingerprint !==
          input.prepared.manifest.route.integrity_fingerprint ||
        shape.provider_contract_fingerprint !==
          input.prepared.provider_contract.integrity.fingerprint ||
        shape.pricing_fingerprint !==
          input.prepared.pricing.integrity.fingerprint
      ) {
        failV01("parser_closed_probe_artifact_shape_order_invalid");
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
        validateOperationalReentryParserClosedProviderCompatibilityProbeExecutionResultV01(
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
        failV01("parser_closed_probe_artifact_finalize_mismatch");
      }
      assertOperationalReentryParserClosedProviderCompatibilityProbeArtifactPayloadSafeV01(
        result.report,
      );
      writeExclusiveV01(runRoot, ["report.json"], result.report);
      const artifacts = readArtifactFingerprintsV01(runRoot);
      const index = {
        index_version:
          "operational_reentry_parser_closed_provider_compatibility_probe_artifact_index.v0.1",
        probe_id: result.manifest.probe_id,
        probe_fingerprint: result.manifest.integrity.fingerprint,
        report_fingerprint: result.report.integrity.fingerprint,
        source_repository_head_sha:
          result.manifest.source_repository_head_sha,
        future_live_issue_number: result.manifest.future_live_issue_number,
        request_family_kind: "parser_closed_compatibility_probe",
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
      assertOperationalReentryParserClosedProviderCompatibilityProbeArtifactPayloadSafeV01(
        index,
      );
      const indexText = canonicalizeProtocolValueV01(index);
      writeTextExclusiveV01(runRoot, ["artifact-index.json"], indexText);
      return validateOperationalReentryParserClosedProviderCompatibilityProbeArtifactsV01(
        {
          repository_root: repositoryRoot,
          run_root: runRoot,
        },
      );
    },
  };
}

export function assertOperationalReentryParserClosedProviderCompatibilityProbeArtifactRootAvailableV01(
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
    failV01("parser_closed_probe_historical_or_cohort_root_refused");
  }
  const candidate = path.resolve(repositoryRoot, input.relative_run_root);
  assertContainedV01(repositoryRoot, candidate);
  if (existsSync(candidate)) {
    if (lstatSync(candidate).isSymbolicLink()) {
      failV01("parser_closed_probe_artifact_symlink_refused");
    }
    failV01("parser_closed_probe_authorization_collision_refused");
  }
}

export function validateOperationalReentryParserClosedProviderCompatibilityProbeArtifactsV01(
  input: {
    repository_root: string;
    run_root: string;
    read_scope?: ArtifactEvidenceReadScopeV01;
  },
): OperationalReentryParserClosedProviderCompatibilityProbeArtifactSummaryV01 {
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
    failV01("parser_closed_probe_artifact_root_invalid");
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
    failV01("parser_closed_probe_artifact_index_missing");
  }
  const indexText = readFileSync(indexPath, "utf8").trimEnd();
  let index: {
    index_version: string;
    probe_id: string;
    source_repository_head_sha: string;
    future_live_issue_number: number;
    request_family_kind: string;
    outcome: OperationalReentryParserClosedProviderCompatibilityProbeArtifactSummaryV01["outcome"];
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
    failV01("parser_closed_probe_artifact_index_invalid");
  }
  assertOperationalReentryParserClosedProviderCompatibilityProbeArtifactPayloadSafeV01(
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
    failV01("parser_closed_probe_artifact_index_invalid");
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
  for (const shapePath of shapePaths) {
    let shape: OperationalReentryParserClosedProviderCompatibilityProbeShapeTerminalV01;
    try {
      shape = JSON.parse(
        readFileSync(path.join(runRoot, shapePath), "utf8"),
      ) as OperationalReentryParserClosedProviderCompatibilityProbeShapeTerminalV01;
    } catch {
      failV01("parser_closed_probe_artifact_shape_invalid");
    }
    assertSealedArtifactV01(
      shape,
      "parser_closed_probe_artifact_shape_invalid",
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
        "representative_input_fingerprint",
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
      "parser_closed_probe_artifact_shape_invalid",
    );
    assertBoundedTerminalObservationsV01(shape);
  }
  if (
    index.index_version !==
      "operational_reentry_parser_closed_provider_compatibility_probe_artifact_index.v0.1" ||
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
    failV01("parser_closed_probe_artifact_index_invalid");
  }
  let report: {
    probe_id: string;
    outcome: OperationalReentryParserClosedProviderCompatibilityProbeArtifactSummaryV01["outcome"];
    authorization_consumed: boolean;
    integrity: { fingerprint: string };
  };
  try {
    report = JSON.parse(
      readFileSync(path.join(runRoot, "report.json"), "utf8"),
    ) as typeof report;
  } catch {
    failV01("parser_closed_probe_report_invalid");
  }
  assertSealedArtifactV01(report, "parser_closed_probe_report_invalid");
  const manifest = readSealedArtifactV01(runRoot, "manifest.json") as {
    probe_id: string;
    source_repository_head_sha: string;
    future_live_issue_number: number;
    request_family_kind: string;
    integrity: { fingerprint: string };
  };
  const authorization = readSealedArtifactV01(
    runRoot,
    "authorization.json",
  ) as {
    exact_merged_source_head: string;
    future_live_issue_number: number;
    request_family_kind: string;
    integrity: { fingerprint: string };
  };
  if (
    report.integrity.fingerprint !== index.report_fingerprint ||
    index.probe_fingerprint !== manifest.integrity.fingerprint
  ) {
    failV01("parser_closed_probe_report_fingerprint_invalid");
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
    index.request_family_kind !== "parser_closed_compatibility_probe"
  ) {
    failV01("parser_closed_probe_artifact_index_source_mismatch");
  }
  if (
    report.authorization_consumed !== durableAuthorizationConsumed ||
    index.authorization_consumed !== durableAuthorizationConsumed
  ) {
    failV01(
      "parser_closed_probe_authorization_consumption_history_incomplete",
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

export function assertOperationalReentryParserClosedProviderCompatibilityProbeArtifactPayloadSafeV01(
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
        failV01("parser_closed_probe_artifact_secret_or_private_path_refused");
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
        failV01("parser_closed_probe_artifact_forbidden_field_refused");
      }
      if (
        normalizedKey.endsWith("_persisted") ||
        normalizedKey.endsWith("_written") ||
        normalizedKey.endsWith("_modified") ||
        normalizedKey.endsWith("_reused")
      ) {
        if (childValue !== false) {
          failV01("parser_closed_probe_artifact_privacy_flag_invalid");
        }
      }
      visit(childValue);
    }
  };
  visit(value);
}

function assertBoundedTerminalObservationsV01(
  shape: OperationalReentryParserClosedProviderCompatibilityProbeShapeTerminalV01,
): void {
  if (
    !shape ||
    typeof shape !== "object" ||
    shape.request_family_kind !== "parser_closed_compatibility_probe" ||
    (shape.provider_rejection_observation !== null &&
      shape.terminal_category !== "provider_rejected") ||
    (shape.provider_response_invalid_observation !== null &&
      shape.terminal_category !== "provider_response_invalid") ||
    (shape.provider_rejection_observation !== null &&
      shape.provider_response_invalid_observation !== null)
  ) {
    failV01("parser_closed_probe_terminal_observation_invalid");
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
      failV01("parser_closed_probe_response_invalid_observation_malformed");
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
      "parser_closed_probe_rejection_observation_malformed",
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
      failV01("parser_closed_probe_rejection_observation_malformed");
    }
  }
}

function readArtifactFingerprintsV01(runRoot: string) {
  const walk = (directory: string): string[] =>
    readdirSync(directory).flatMap((entry) => {
      const target = path.join(directory, entry);
      const stat = lstatSync(target);
      if (stat.isSymbolicLink()) {
        failV01("parser_closed_probe_artifact_symlink_refused");
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
    failV01("parser_closed_probe_artifact_sealed_record_invalid");
  }
  assertSealedArtifactV01(
    value,
    "parser_closed_probe_artifact_sealed_record_invalid",
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
  code = "parser_closed_probe_artifact_index_invalid",
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
    failV01("parser_closed_probe_repository_root_invalid");
  }
  const root = realpathSync(input);
  const ignore = readFileSync(path.join(root, ".gitignore"), "utf8");
  if (
    !ignore
      .split(/\r?\n/u)
      .map((line) => line.trim())
      .includes(".augnes-lab/")
  ) {
    failV01("parser_closed_probe_artifact_root_not_ignored");
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
    failV01("parser_closed_probe_artifact_segment_invalid");
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
      failV01("parser_closed_probe_artifact_authorization_invalid");
    }
    authorization = JSON.parse(
      readFileSync(authorizationPath, "utf8"),
    ) as typeof authorization;
  } catch (error) {
    if (
      error instanceof
      OperationalReentryParserClosedProviderCompatibilityProbeArtifactErrorV01
    ) {
      throw error;
    }
    failV01("parser_closed_probe_artifact_authorization_invalid");
  }
  if (typeof authorization.integrity?.fingerprint !== "string") {
    failV01("parser_closed_probe_artifact_authorization_invalid");
  }
  return authorization.integrity.fingerprint;
}

function assertAuthorizationConsumptionHistoryCompleteV01(input: {
  repository_root: string;
  run_root: string;
  authorization_fingerprint: string;
}): boolean {
  const globalMarker = readConsumptionRecordV01(
    path.join(
      path.dirname(path.dirname(input.run_root)),
      AUTHORIZATION_CONSUMPTION_DIRECTORY_V01,
      `${safeSegmentV01(input.authorization_fingerprint)}.json`,
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
      "parser_closed_probe_authorization_consumption_history_incomplete",
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
        "parser_closed_probe_authorization_consumption_history_incomplete",
      );
    }
    return readFileSync(target, "utf8").trimEnd();
  } catch (error) {
    if (
      error instanceof
      OperationalReentryParserClosedProviderCompatibilityProbeArtifactErrorV01
    ) {
      throw error;
    }
    failV01(
      "parser_closed_probe_authorization_consumption_history_incomplete",
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
    failV01("parser_closed_probe_authorization_global_collision_refused");
  }
}

function writeAuthorizationConsumptionExclusiveV01(
  repositoryRoot: string,
  authorizationFingerprint: string,
  value: unknown,
): void {
  assertOperationalReentryParserClosedProviderCompatibilityProbeArtifactPayloadSafeV01(
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
      failV01("parser_closed_probe_authorization_global_collision_refused");
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
  assertOperationalReentryParserClosedProviderCompatibilityProbeArtifactPayloadSafeV01(
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
    failV01("parser_closed_probe_artifact_overwrite_refused");
  }
  const temporary = `${target}.tmp`;
  if (existsSync(temporary)) {
    failV01("parser_closed_probe_artifact_stale_temporary");
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
        failV01("parser_closed_probe_artifact_directory_invalid");
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
    failV01("parser_closed_probe_artifact_path_escape");
  }
}

function failV01(code: string): never {
  throw new OperationalReentryParserClosedProviderCompatibilityProbeArtifactErrorV01(
    code,
  );
}
