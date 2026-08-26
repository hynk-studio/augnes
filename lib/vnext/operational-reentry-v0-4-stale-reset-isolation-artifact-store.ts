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
  ACGC_E2R2P6H_ADAPTER_REQUEST_ROUTE_FINGERPRINT_V01,
  ACGC_E2R2P6H_CASE_FINGERPRINT_V01,
  ACGC_E2R2P6H_COMMON_TASK_EVIDENCE_FINGERPRINT_V01,
  ACGC_E2R2P6H_PROVIDER_CONTRACT_FINGERPRINT_V01,
  ACGC_E2R2P6H_REQUEST_FAMILY_KIND_V01,
  ACGC_E2R2P6H_ROUTE_FINGERPRINT_V01,
  buildOperationalReentryV04StaleResetIsolationEvaluatorContractV01,
  buildOperationalReentryV04StaleResetIsolationGateContractV01,
  buildOperationalReentryV04StaleResetIsolationHarnessContractV01,
  buildOperationalReentryV04StaleResetIsolationPlanV01,
  evaluateOperationalReentryV04StaleResetIsolationBlockV01,
  projectOperationalReentryV04StaleResetIsolationPlanForArtifactV01,
} from "@/lib/vnext/operational-reentry-v0-4-stale-reset-isolation-cohort";
import {
  canonicalizeProtocolValueV01,
  createProtocolSha256V01,
} from "@/lib/vnext/protocol-primitives";
import {
  OPERATIONAL_REENTRY_V04_STALE_RESET_ISOLATION_AUTHORIZATION_VERSION_V01,
  OPERATIONAL_REENTRY_V04_STALE_RESET_ISOLATION_ARTIFACT_INDEX_VERSION_V01,
  OPERATIONAL_REENTRY_V04_STALE_RESET_ISOLATION_COHORT_VERSION_V01,
  OPERATIONAL_REENTRY_V04_STALE_RESET_ISOLATION_EVALUATOR_VERSION_V01,
  OPERATIONAL_REENTRY_V04_STALE_RESET_ISOLATION_MANIFEST_VERSION_V01,
  OPERATIONAL_REENTRY_V04_STALE_RESET_ISOLATION_PLAN_VERSION_V01,
  OPERATIONAL_REENTRY_V04_STALE_RESET_ISOLATION_PRICING_VERSION_V01,
  OPERATIONAL_REENTRY_V04_STALE_RESET_ISOLATION_REPORT_VERSION_V01,
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
const GIT_SHA_V01 = /^[0-9a-f]{40}$/u;
const AUTHORIZED_REPOSITORY_SLUG_V01 =
  "hynk-studio/augnes" as const;
const AUTHORIZED_ORIGINS_V01 = new Set([
  "https://github.com/hynk-studio/augnes.git",
]);
const ATTEMPT_VERSION_V01 =
  "operational_reentry_v04_stale_reset_isolation_attempt.v0.1" as const;
const TERMINAL_VERSION_V01 =
  "operational_reentry_v04_stale_reset_isolation_terminal.v0.1" as const;

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
    canonical_sealed_index: true as const,
    sealed_member_integrity_recomputed: true as const,
    coherent_bundle_cross_links_required: true as const,
    global_and_run_local_consumption_agreement_required: true as const,
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
  const attempt = sealArtifactV01(
    "operational_reentry_v04_stale_reset_isolation_attempt_without_integrity_fingerprint",
    {
    attempt_version: ATTEMPT_VERSION_V01,
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
    authorization_consumed: false as const,
    },
  );
  writeExclusiveV01(runRoot, ["authorization.json"], input.authorization);
  writeExclusiveV01(runRoot, ["attempt.json"], attempt);
  writeExclusiveV01(runRoot, ["manifest.json"], input.manifest);
  writeExclusiveV01(
    runRoot,
    ["plan.json"],
    buildPlanArtifactV01(input.plan),
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
      writeExclusiveV01(runRoot, ["terminal.json"], sealArtifactV01(
        "operational_reentry_v04_stale_reset_isolation_terminal_without_integrity_fingerprint",
        {
        terminal_version: TERMINAL_VERSION_V01,
        cohort_id: input.manifest.cohort_id,
        completion_status: result.report.completion_status,
        terminal_calls: result.calls.length,
        completed_blocks: result.report.complete_blocks,
        authorization_consumed: consumed,
        retry_authorized: false,
        replacement_authorized: false,
        second_cohort_authorized: false as const,
        },
      ));
      const artifacts = readArtifactFingerprintsV01(runRoot);
      const index = sealArtifactV01(
        "operational_reentry_v04_stale_reset_isolation_artifact_index_without_integrity_fingerprint",
        {
        index_version:
          OPERATIONAL_REENTRY_V04_STALE_RESET_ISOLATION_ARTIFACT_INDEX_VERSION_V01,
        cohort_id: input.manifest.cohort_id,
        cohort_fingerprint: input.manifest.integrity.fingerprint,
        authorization_fingerprint:
          input.authorization.integrity.fingerprint,
        source_repository_head_sha: input.manifest.source_repository_head_sha,
        report_fingerprint: result.report.integrity.fingerprint,
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
        },
      );
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
  const index = readCanonicalRecordV01(
    indexPath,
    "operational_reentry_v04_stale_reset_artifact_index_invalid",
  );
  assertSealedArtifactV01(
    index,
    "operational_reentry_v04_stale_reset_artifact_index_invalid",
  );
  assertExactKeysV01(
    index,
    INDEX_KEYS_V01,
    "operational_reentry_v04_stale_reset_artifact_index_invalid",
  );
  if (
    index.index_version !==
      OPERATIONAL_REENTRY_V04_STALE_RESET_ISOLATION_ARTIFACT_INDEX_VERSION_V01 ||
    typeof index.cohort_id !== "string" ||
    !SHA256_V01.test(index.cohort_fingerprint as string) ||
    !SHA256_V01.test(index.authorization_fingerprint as string) ||
    !GIT_SHA_V01.test(index.source_repository_head_sha as string) ||
    !SHA256_V01.test(index.report_fingerprint as string) ||
    !["complete", "incomplete"].includes(index.completion_status as string) ||
    typeof index.authorization_consumed !== "boolean" ||
    !Array.isArray(index.artifacts) ||
    index.artifacts.some(
      (entry: unknown) =>
        !isRecordV01(entry) ||
        !hasExactKeysV01(entry, ["path", "fingerprint"]) ||
        typeof entry.path !== "string" ||
        !SHA256_V01.test(entry.fingerprint as string),
    ) ||
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
  const actual = readArtifactFingerprintsV01(runRoot).filter(
    (entry) => entry.path !== "artifact-index.json",
  );
  const expectedArtifactPaths = [
    "attempt.json",
    "authorization.json",
    ...(index.authorization_consumed ? ["authorization-consumed.json"] : []),
    ...Array.from({ length: 16 }, (_, call) =>
      `calls/${String(call).padStart(2, "0")}.json`),
    ...Array.from({ length: 4 }, (_, block) =>
      `checkpoints/block-${String(block)}.json`),
    "manifest.json",
    "plan.json",
    "pricing.json",
    "report.json",
    "terminal.json",
  ].sort((left, right) => left.localeCompare(right, "en"));
  if (
    canonicalizeProtocolValueV01(actual) !==
      canonicalizeProtocolValueV01(index.artifacts) ||
    canonicalizeProtocolValueV01(actual.map((entry) => entry.path)) !==
      canonicalizeProtocolValueV01(expectedArtifactPaths)
  ) {
    failV01("operational_reentry_v04_stale_reset_artifact_index_invalid");
  }

  const authorization = readSealedMemberV01(
    runRoot,
    "authorization.json",
    AUTHORIZATION_KEYS_V01,
  );
  const manifest = readSealedMemberV01(
    runRoot,
    "manifest.json",
    MANIFEST_KEYS_V01,
  );
  const plan = readSealedMemberV01(runRoot, "plan.json", PLAN_ARTIFACT_KEYS_V01);
  const pricing = readSealedMemberV01(
    runRoot,
    "pricing.json",
    PRICING_KEYS_V01,
  );
  const attempt = readSealedMemberV01(
    runRoot,
    "attempt.json",
    ATTEMPT_KEYS_V01,
  );
  const report = readSealedMemberV01(
    runRoot,
    "report.json",
    REPORT_KEYS_V01,
  );
  const terminal = readSealedMemberV01(
    runRoot,
    "terminal.json",
    TERMINAL_KEYS_V01,
  );

  const staticPlan = buildOperationalReentryV04StaleResetIsolationPlanV01();
  const expectedPlanArtifact = buildPlanArtifactV01(staticPlan);
  const gate = buildOperationalReentryV04StaleResetIsolationGateContractV01();
  const evaluator =
    buildOperationalReentryV04StaleResetIsolationEvaluatorContractV01();
  const harness = buildOperationalReentryV04StaleResetIsolationHarnessContractV01();

  if (
    canonicalizeProtocolValueV01(plan) !==
      canonicalizeProtocolValueV01(expectedPlanArtifact) ||
    plan.source_plan_fingerprint !== staticPlan.integrity.fingerprint ||
    manifest.manifest_version !==
      OPERATIONAL_REENTRY_V04_STALE_RESET_ISOLATION_MANIFEST_VERSION_V01 ||
    manifest.cohort_version !==
      OPERATIONAL_REENTRY_V04_STALE_RESET_ISOLATION_COHORT_VERSION_V01 ||
    manifest.cohort_id !== index.cohort_id ||
    manifest.integrity.fingerprint !== index.cohort_fingerprint ||
    manifest.authorization_fingerprint !== index.authorization_fingerprint ||
    manifest.source_repository_head_sha !== index.source_repository_head_sha ||
    manifest.future_live_issue_number !== authorization.future_live_issue_number ||
    manifest.source_repository_head_sha !== authorization.exact_merged_source_head ||
    manifest.plan_fingerprint !== staticPlan.integrity.fingerprint ||
    manifest.plan_fingerprint !== authorization.sealed_plan_fingerprint ||
    manifest.gate_contract_fingerprint !== gate.integrity.fingerprint ||
    manifest.gate_contract_fingerprint !==
      authorization.g_gate_provenance_contract_fingerprint ||
    manifest.evaluator_fingerprint !== evaluator.integrity.fingerprint ||
    manifest.evaluator_fingerprint !== authorization.evaluator_fingerprint ||
    manifest.bg_static_conformance_witness_fingerprint !==
      harness.bg_static_conformance_witness_fingerprint ||
    manifest.bg_static_conformance_witness_fingerprint !==
      authorization.bg_static_conformance_witness_fingerprint ||
    manifest.case_fingerprint !== ACGC_E2R2P6H_CASE_FINGERPRINT_V01 ||
    manifest.case_fingerprint !== authorization.case_fingerprint ||
    manifest.common_task_evidence_fingerprint !==
      ACGC_E2R2P6H_COMMON_TASK_EVIDENCE_FINGERPRINT_V01 ||
    manifest.common_task_evidence_fingerprint !==
      authorization.common_task_evidence_fingerprint ||
    manifest.request_family_kind !== ACGC_E2R2P6H_REQUEST_FAMILY_KIND_V01 ||
    manifest.request_family_kind !== authorization.request_family_kind ||
    manifest.route?.integrity_fingerprint !== ACGC_E2R2P6H_ROUTE_FINGERPRINT_V01 ||
    authorization.route_fingerprint !== ACGC_E2R2P6H_ROUTE_FINGERPRINT_V01 ||
    manifest.provider_contract_fingerprint !==
      ACGC_E2R2P6H_PROVIDER_CONTRACT_FINGERPRINT_V01 ||
    authorization.provider_contract_fingerprint !==
      ACGC_E2R2P6H_PROVIDER_CONTRACT_FINGERPRINT_V01 ||
    manifest.adapter_request_route_fingerprint !==
      ACGC_E2R2P6H_ADAPTER_REQUEST_ROUTE_FINGERPRINT_V01 ||
    authorization.adapter_request_route_fingerprint !==
      ACGC_E2R2P6H_ADAPTER_REQUEST_ROUTE_FINGERPRINT_V01 ||
    manifest.pricing_fingerprint !== pricing.integrity.fingerprint ||
    manifest.provider_egress !==
      "allow_only_with_supplied_future_authorization" ||
    manifest.data_classification !== "public_safe" ||
    manifest.retention_class !== "none" ||
    [
      manifest.raw_prompt_persisted,
      manifest.raw_request_body_persisted,
      manifest.raw_provider_response_persisted,
      manifest.raw_provider_error_persisted,
      manifest.hidden_reasoning_persisted,
      manifest.credentials_or_full_headers_persisted,
    ].some((value) => value !== false)
  ) {
    failV01("operational_reentry_v04_stale_reset_artifact_cross_link_invalid");
  }

  assertAuthorizationBundleLinksV01({ authorization, manifest, pricing });
  assertPricingStructureV01(pricing);
  if (
    pricing.pricing_version !==
      OPERATIONAL_REENTRY_V04_STALE_RESET_ISOLATION_PRICING_VERSION_V01 ||
    pricing.pricing_snapshot_authority !==
      "future_live_issue_must_refresh_official_pricing" ||
    pricing.static_harness_is_live_pricing_authority !== false ||
    pricing.missing_exact_usage_or_cost !== "unknown_never_zero" ||
    pricing.aggregate_conservative_worst_case_nano_usd !==
      pricing.per_call_conservative_worst_case_nano_usd * 16 ||
    pricing.aggregate_conservative_worst_case_nano_usd !==
      authorization.aggregate_worst_case_cost_nano_usd ||
    pricing.maximum_total_cost_nano_usd !==
      authorization.maximum_total_cost_nano_usd
  ) {
    failV01("operational_reentry_v04_stale_reset_artifact_pricing_invalid");
  }

  if (
    attempt.attempt_version !== ATTEMPT_VERSION_V01 ||
    attempt.cohort_id !== manifest.cohort_id ||
    attempt.future_live_issue_number !== manifest.future_live_issue_number ||
    attempt.source_repository_head_sha !== manifest.source_repository_head_sha ||
    attempt.authorization_fingerprint !== authorization.integrity.fingerprint ||
    attempt.manifest_fingerprint !== manifest.integrity.fingerprint ||
    attempt.plan_fingerprint !== staticPlan.integrity.fingerprint ||
    attempt.pricing_fingerprint !== pricing.integrity.fingerprint ||
    attempt.planned_calls !== 16 ||
    attempt.maximum_parallel_provider_calls !== 1 ||
    attempt.retries !== 0 ||
    attempt.replacement_calls !== 0 ||
    attempt.attempt_status !== "prepared_zero_egress" ||
    attempt.authorization_consumed !== false
  ) {
    failV01("operational_reentry_v04_stale_reset_artifact_attempt_invalid");
  }

  const calls = Array.from({ length: 16 }, (_, callOrder) =>
    readSealedMemberV01(
      runRoot,
      `calls/${String(callOrder).padStart(2, "0")}.json`,
      CALL_KEYS_V01,
    ),
  );
  assertCallRecordsV01(calls, staticPlan);
  const blocks = Array.from({ length: 4 }, (_, block) =>
    readSealedMemberV01(
      runRoot,
      `checkpoints/block-${String(block)}.json`,
      BLOCK_KEYS_V01,
    ),
  );
  assertBlockRecordsV01(blocks, calls, staticPlan);

  const attemptedProviderCalls = calls.filter(
    (call) => call.egress_attempted === true,
  ).length;
  const completeBlocks = blocks.filter((block) => block.status === "complete").length;
  const allSixPairRecords = blocks.reduce(
    (total, block) => total + (block.pair_evaluations as unknown[]).length,
    0,
  );
  const reconstructedCompletion = completeBlocks === 4 ? "complete" : "incomplete";
  if (
    report.report_version !==
      OPERATIONAL_REENTRY_V04_STALE_RESET_ISOLATION_REPORT_VERSION_V01 ||
    report.integrity.fingerprint !== index.report_fingerprint ||
    report.cohort_id !== manifest.cohort_id ||
    report.completion_status !== reconstructedCompletion ||
    report.completion_status !== index.completion_status ||
    report.planned_calls !== 16 ||
    report.terminal_call_records !== 16 ||
    report.attempted_provider_calls !== attemptedProviderCalls ||
    report.real_provider_calls !== attemptedProviderCalls ||
    report.complete_blocks !== completeBlocks ||
    report.all_six_pair_records !== allSixPairRecords ||
    report.authorization_consumed !== index.authorization_consumed ||
    report.behavioral_result !==
      (completeBlocks === 4 ? "bounded_structured_observations_only" : "none") ||
    report.retries !== 0 ||
    report.replacement_calls !== 0 ||
    report.replication_authorized !== false ||
    report.policy_authorized !== false ||
    report.stage_7_authorized !== false ||
    report.product_database_writes !== 0 ||
    report.core_writes !== 0
  ) {
    failV01("operational_reentry_v04_stale_reset_artifact_report_invalid");
  }

  if (
    terminal.terminal_version !== TERMINAL_VERSION_V01 ||
    terminal.cohort_id !== manifest.cohort_id ||
    terminal.completion_status !== reconstructedCompletion ||
    terminal.terminal_calls !== 16 ||
    terminal.completed_blocks !== completeBlocks ||
    terminal.authorization_consumed !== index.authorization_consumed ||
    terminal.retry_authorized !== false ||
    terminal.replacement_authorized !== false ||
    terminal.second_cohort_authorized !== false
  ) {
    failV01("operational_reentry_v04_stale_reset_artifact_terminal_invalid");
  }

  assertConsumptionHistoryV01({
    repository_root: repositoryRoot,
    run_root: runRoot,
    authorization,
    manifest,
    consumed: index.authorization_consumed as boolean,
  });

  const indexText = canonicalizeProtocolValueV01(index);
  return {
    relative_run_root: relative,
    completion_status: index.completion_status as "complete" | "incomplete",
    artifact_count: actual.length + 1,
    artifact_index_fingerprint: createProtocolSha256V01(indexText),
    report_fingerprint: report.integrity.fingerprint as string,
    cohort_fingerprint: index.cohort_fingerprint as string,
    authorization_consumed: index.authorization_consumed as boolean,
    tracked_repository_files_written: false,
    product_database_writes: 0,
    core_writes: 0,
  };
}

type ArtifactRecordV01 = Record<string, any>;

const INDEX_KEYS_V01 = [
  "index_version", "cohort_id", "cohort_fingerprint",
  "authorization_fingerprint", "source_repository_head_sha",
  "report_fingerprint", "completion_status", "authorization_consumed",
  "artifacts", "raw_prompt_persisted", "raw_request_body_persisted",
  "raw_provider_response_persisted", "raw_provider_error_persisted",
  "hidden_reasoning_persisted", "credentials_or_full_headers_persisted",
  "private_absolute_paths_persisted", "product_database_rows_persisted",
  "core_records_persisted", "task_context_packet_variants_persisted",
  "proposals_decisions_transitions_or_policy_persisted",
  "scalar_rank_winner_persisted", "tracked_repository_files_written",
  "integrity",
] as const;
const AUTHORIZATION_KEYS_V01 = [
  "authorization_version", "authorization_id", "authorization_kind",
  "request_family_kind", "future_live_issue_number", "exact_merged_source_head",
  "repository_slug", "authorized_origin", "issued_at", "expires_at",
  "workspace_id", "project_id", "expected_active_selection_revision",
  "project_root_fingerprint",
  "gateway_authorization_project_is_lab_experiment_meaning",
  "case_fingerprint", "common_task_evidence_fingerprint",
  "g_gate_provenance_contract_fingerprint", "sealed_plan_fingerprint",
  "evaluator_fingerprint", "bg_static_conformance_witness_fingerprint",
  "route_fingerprint", "provider_contract_fingerprint",
  "adapter_request_route_fingerprint", "codec_version",
  "response_schema_version", "parser_version", "adapter_implementation_id",
  "adapter_implementation_version", "model", "response_bytes",
  "max_output_tokens", "final_request_bytes", "request_family",
  "planned_calls", "repeat_blocks", "calls_per_arm",
  "maximum_parallel_provider_calls", "retries", "replacements",
  "adaptive_changes", "fresh_stateless_invocation_per_call",
  "conversation_reuse", "thread_reuse", "previous_response_reuse",
  "pricing_snapshot_fingerprint", "pricing_snapshot_evaluated_at",
  "pricing_authority_fingerprint", "pricing_authority_expires_at",
  "aggregate_worst_case_cost_nano_usd", "maximum_total_cost_nano_usd",
  "historical_authorization_reuse", "second_cohort_under_same_authorization",
  "replication", "policy", "stage_7", "integrity",
] as const;
const MANIFEST_KEYS_V01 = [
  "manifest_version", "cohort_version", "cohort_id",
  "future_live_issue_number", "source_repository_head_sha",
  "authorization_fingerprint", "case_fingerprint",
  "common_task_evidence_fingerprint", "gate_contract_fingerprint",
  "plan_fingerprint", "evaluator_fingerprint",
  "bg_static_conformance_witness_fingerprint", "route",
  "provider_contract_fingerprint", "adapter_request_route_fingerprint",
  "pricing_fingerprint", "request_family_kind", "provider_egress",
  "data_classification", "retention_class", "raw_prompt_persisted",
  "raw_request_body_persisted", "raw_provider_response_persisted",
  "raw_provider_error_persisted", "hidden_reasoning_persisted",
  "credentials_or_full_headers_persisted", "integrity",
] as const;
const PLAN_ARTIFACT_KEYS_V01 = [
  "plan_version", "cohort_version", "case_fingerprint",
  "common_task_evidence_fingerprint", "gate_contract_fingerprint",
  "request_family_kind", "planned_calls", "repeat_blocks",
  "calls_per_block", "calls_per_arm", "sealed_order",
  "each_arm_once_per_ordinal_position", "maximum_parallel_provider_calls",
  "retries", "replacement_calls", "adaptive_stopping",
  "fresh_stateless_invocation_per_call", "conversation_reuse",
  "thread_reuse", "previous_response_reuse", "entries",
  "bg_conformance_witnesses", "source_plan_fingerprint", "integrity",
] as const;
const PRICING_KEYS_V01 = [
  "pricing_version", "pricing_snapshot_authority", "pricing_source_version",
  "pricing_snapshot_evaluated_at", "pricing_authority_expires_at",
  "pricing_authority_fingerprint", "input_nano_usd_per_token",
  "cached_input_nano_usd_per_token", "output_nano_usd_per_token",
  "exact_cost_basis", "missing_exact_usage_or_cost", "gateway_cost_budget",
  "per_call_conservative_worst_case_nano_usd",
  "aggregate_conservative_worst_case_nano_usd",
  "maximum_total_cost_nano_usd", "static_harness_is_live_pricing_authority",
  "integrity",
] as const;
const ATTEMPT_KEYS_V01 = [
  "attempt_version", "cohort_id", "future_live_issue_number",
  "source_repository_head_sha", "authorization_fingerprint",
  "manifest_fingerprint", "plan_fingerprint", "pricing_fingerprint",
  "planned_calls", "maximum_parallel_provider_calls", "retries",
  "replacement_calls", "attempt_status", "authorization_consumed",
  "integrity",
] as const;
const REPORT_KEYS_V01 = [
  "report_version", "cohort_id", "completion_status", "planned_calls",
  "terminal_call_records", "attempted_provider_calls", "complete_blocks",
  "all_six_pair_records", "authorization_consumed", "behavioral_result",
  "real_provider_calls", "retries", "replacement_calls",
  "replication_authorized", "policy_authorized", "stage_7_authorized",
  "product_database_writes", "core_writes", "integrity",
] as const;
const TERMINAL_KEYS_V01 = [
  "terminal_version", "cohort_id", "completion_status", "terminal_calls",
  "completed_blocks", "authorization_consumed", "retry_authorized",
  "replacement_authorized", "second_cohort_authorized", "integrity",
] as const;
const CALL_KEYS_V01 = [
  "call_order", "call_slot_id", "repeat_block", "position_in_block", "arm",
  "terminal_category", "egress_attempted", "request_family_kind",
  "request_family_trace_id", "client_request_id",
  "local_invocation_identity_fingerprint", "provider_material_fingerprint",
  "provider_visible_request_fingerprint", "normalized_output",
  "normalized_output_fingerprint", "receipt", "exact_cost_nano_usd",
  "failure_code", "retries", "replacement_calls", "integrity",
] as const;
const BLOCK_KEYS_V01 = [
  "evaluator_version", "repeat_block", "status", "layer_a", "layer_b",
  "pair_evaluations", "all_six_pairs_evaluated_directly",
  "pair_results_inferred_transitively", "deterministic_no_score_aggregation",
  "integrity",
] as const;
const CONSUMPTION_KEYS_V01 = [
  "consumption_version", "authorization_fingerprint", "cohort_id",
  "future_live_issue_number",
  "first_future_provider_egress_attempt_consumes_globally",
  "partial_consumption_remains_consumed", "retries_authorized",
  "replacements_authorized", "second_cohort_authorized",
  "replication_authorized", "policy_authorized", "stage_7_authorized",
] as const;

function buildPlanArtifactV01(
  plan: OperationalReentryV04StaleResetIsolationPlanV01,
): ArtifactRecordV01 {
  const projected =
    projectOperationalReentryV04StaleResetIsolationPlanForArtifactV01(plan);
  const { integrity, ...payload } = projected;
  return sealArtifactV01(
    "operational_reentry_v04_stale_reset_isolation_plan_artifact_without_integrity_fingerprint",
    {
      ...payload,
      source_plan_fingerprint: integrity.fingerprint,
    },
  );
}

function sealArtifactV01<const T extends ArtifactRecordV01>(
  scope: string,
  payload: T,
): T & { integrity: { algorithm: "sha256"; canonicalization: "augnes-json-c14n-v0_1"; fingerprint_scope: string; fingerprint: string } } {
  return {
    ...payload,
    integrity: {
      algorithm: "sha256",
      canonicalization: "augnes-json-c14n-v0_1",
      fingerprint_scope: scope,
      fingerprint: createProtocolSha256V01(
        canonicalizeProtocolValueV01(payload),
      ),
    },
  };
}

function readCanonicalRecordV01(target: string, code: string): ArtifactRecordV01 {
  try {
    const stat = lstatSync(target);
    if (stat.isSymbolicLink() || !stat.isFile()) failV01(code);
    const text = readFileSync(target, "utf8");
    const value = JSON.parse(text) as unknown;
    if (
      !isRecordV01(value) ||
      text !== `${canonicalizeProtocolValueV01(value)}\n`
    ) {
      failV01(code);
    }
    assertOperationalReentryV04StaleResetIsolationPublicSafeArtifactV01(value);
    return value;
  } catch (error) {
    if (error instanceof OperationalReentryV04StaleResetIsolationArtifactErrorV01) {
      throw error;
    }
    failV01(code);
  }
}

function readSealedMemberV01(
  runRoot: string,
  relativePath: string,
  keys: readonly string[],
): ArtifactRecordV01 {
  const value = readCanonicalRecordV01(
    path.join(runRoot, relativePath),
    "operational_reentry_v04_stale_reset_artifact_member_invalid",
  );
  assertExactKeysV01(
    value,
    keys,
    "operational_reentry_v04_stale_reset_artifact_member_invalid",
  );
  assertSealedArtifactV01(
    value,
    "operational_reentry_v04_stale_reset_artifact_member_invalid",
  );
  return value;
}

function assertSealedArtifactV01(value: unknown, code: string): void {
  if (!isRecordV01(value) || !isRecordV01(value.integrity)) failV01(code);
  const { integrity, ...payload } = value;
  if (
    !hasExactKeysV01(integrity, [
      "algorithm", "canonicalization", "fingerprint_scope", "fingerprint",
    ]) ||
    integrity.algorithm !== "sha256" ||
    integrity.canonicalization !== "augnes-json-c14n-v0_1" ||
    typeof integrity.fingerprint_scope !== "string" ||
    !SHA256_V01.test(integrity.fingerprint as string) ||
    integrity.fingerprint !==
      createProtocolSha256V01(canonicalizeProtocolValueV01(payload))
  ) {
    failV01(code);
  }
}

function assertExactKeysV01(
  value: unknown,
  expected: readonly string[],
  code: string,
): void {
  if (!isRecordV01(value) || !hasExactKeysV01(value, expected)) failV01(code);
}

function hasExactKeysV01(
  value: ArtifactRecordV01,
  expected: readonly string[],
): boolean {
  return canonicalizeProtocolValueV01(Object.keys(value).sort()) ===
    canonicalizeProtocolValueV01([...expected].sort());
}

function isRecordV01(value: unknown): value is ArtifactRecordV01 {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function assertAuthorizationBundleLinksV01(input: {
  authorization: ArtifactRecordV01;
  manifest: ArtifactRecordV01;
  pricing: ArtifactRecordV01;
}): void {
  const { authorization, manifest, pricing } = input;
  if (
    authorization.authorization_version !==
      OPERATIONAL_REENTRY_V04_STALE_RESET_ISOLATION_AUTHORIZATION_VERSION_V01 ||
    authorization.authorization_kind !==
      "one_bounded_operational_reentry_v04_stale_reset_isolation_cohort" ||
    authorization.request_family_kind !== ACGC_E2R2P6H_REQUEST_FAMILY_KIND_V01 ||
    authorization.request_family !== ACGC_E2R2P6H_REQUEST_FAMILY_KIND_V01 ||
    !Number.isSafeInteger(authorization.future_live_issue_number) ||
    authorization.future_live_issue_number <= 237 ||
    !GIT_SHA_V01.test(authorization.exact_merged_source_head as string) ||
    authorization.repository_slug !== AUTHORIZED_REPOSITORY_SLUG_V01 ||
    !AUTHORIZED_ORIGINS_V01.has(authorization.authorized_origin as string) ||
    authorization.future_live_issue_number !== manifest.future_live_issue_number ||
    authorization.exact_merged_source_head !== manifest.source_repository_head_sha ||
    authorization.case_fingerprint !== ACGC_E2R2P6H_CASE_FINGERPRINT_V01 ||
    authorization.common_task_evidence_fingerprint !==
      ACGC_E2R2P6H_COMMON_TASK_EVIDENCE_FINGERPRINT_V01 ||
    authorization.route_fingerprint !== ACGC_E2R2P6H_ROUTE_FINGERPRINT_V01 ||
    authorization.provider_contract_fingerprint !==
      ACGC_E2R2P6H_PROVIDER_CONTRACT_FINGERPRINT_V01 ||
    authorization.adapter_request_route_fingerprint !==
      ACGC_E2R2P6H_ADAPTER_REQUEST_ROUTE_FINGERPRINT_V01 ||
    authorization.codec_version !==
      "operational_reentry_matched_cohort_codec.v0.5" ||
    authorization.response_schema_version !==
      "operational_reentry_matched_cohort_response_schema.v0.4" ||
    authorization.parser_version !==
      "operational_reentry_matched_cohort_parser.v0.4" ||
    authorization.adapter_implementation_id !==
      "openai_responses.operational_reentry_matched_cohort" ||
    authorization.adapter_implementation_version !==
      "openai_responses_operational_reentry_matched_cohort_adapter.v0.6" ||
    authorization.model !== "gpt-4.1-mini-2025-04-14" ||
    authorization.response_bytes !== 1168 ||
    authorization.max_output_tokens !== 1168 ||
    authorization.final_request_bytes !== 24576 ||
    authorization.planned_calls !== 16 ||
    authorization.repeat_blocks !== 4 ||
    authorization.calls_per_arm !== 4 ||
    authorization.maximum_parallel_provider_calls !== 1 ||
    authorization.retries !== 0 ||
    authorization.replacements !== 0 ||
    authorization.adaptive_changes !== 0 ||
    authorization.fresh_stateless_invocation_per_call !== true ||
    authorization.conversation_reuse !== false ||
    authorization.thread_reuse !== false ||
    authorization.previous_response_reuse !== false ||
    authorization.gateway_authorization_project_is_lab_experiment_meaning !== false ||
    authorization.historical_authorization_reuse !== false ||
    authorization.second_cohort_under_same_authorization !== false ||
    authorization.replication !== false ||
    authorization.policy !== false ||
    authorization.stage_7 !== false ||
    authorization.pricing_snapshot_fingerprint !== pricing.integrity.fingerprint ||
    authorization.pricing_snapshot_evaluated_at !==
      pricing.pricing_snapshot_evaluated_at ||
    authorization.pricing_authority_fingerprint !==
      pricing.pricing_authority_fingerprint ||
    authorization.pricing_authority_expires_at !==
      pricing.pricing_authority_expires_at
  ) {
    failV01("operational_reentry_v04_stale_reset_artifact_authorization_invalid");
  }
}

function assertPricingStructureV01(pricing: ArtifactRecordV01): void {
  const budget = pricing.gateway_cost_budget;
  if (!isRecordV01(budget) || !isRecordV01(budget.authority)) {
    failV01("operational_reentry_v04_stale_reset_artifact_pricing_invalid");
  }
  assertExactKeysV01(budget, [
    "budget_version", "authority", "maximum_input_units",
    "maximum_output_units", "maximum_invocation_count", "timeout_ms",
    "evaluated_at", "maximum_permitted_cost", "calculated_worst_case_cost",
    "within_ceiling",
  ], "operational_reentry_v04_stale_reset_artifact_pricing_invalid");
  assertExactKeysV01(budget.authority, [
    "authority_version", "authority_kind", "workspace_id", "project_id",
    "purpose", "provider_ref", "model_ref", "cost_unit", "input_rate",
    "output_rate", "pricing_source_version", "pricing_effective_at",
    "pricing_expires_at", "project_model_policy_fingerprint",
    "pricing_fingerprint",
  ], "operational_reentry_v04_stale_reset_artifact_pricing_invalid");
  if (
    budget.budget_version !== "model_gateway_cost_budget.v0.1" ||
    budget.authority.authority_version !== "model_gateway_cost_authority.v0.1" ||
    budget.authority.authority_kind !== "provider_model_pricing_snapshot" ||
    budget.authority.purpose !== "operational_reentry_matched_cohort_v04" ||
    budget.authority.cost_unit !== "nano_usd" ||
    budget.authority.project_model_policy_fingerprint !==
      ACGC_E2R2P6H_ROUTE_FINGERPRINT_V01 ||
    budget.authority.pricing_fingerprint !== pricing.pricing_authority_fingerprint ||
    budget.maximum_input_units !== 24576 ||
    budget.maximum_output_units !== 1168 ||
    budget.maximum_invocation_count !== 1 ||
    budget.timeout_ms !== 30000 ||
    budget.evaluated_at !== pricing.pricing_snapshot_evaluated_at ||
    budget.maximum_permitted_cost !== pricing.maximum_total_cost_nano_usd ||
    budget.calculated_worst_case_cost !==
      pricing.per_call_conservative_worst_case_nano_usd ||
    budget.within_ceiling !== true
  ) {
    failV01("operational_reentry_v04_stale_reset_artifact_pricing_invalid");
  }
}

function assertCallRecordsV01(
  calls: ArtifactRecordV01[],
  plan: OperationalReentryV04StaleResetIsolationPlanV01,
): void {
  let hardStop = false;
  for (let index = 0; index < 16; index += 1) {
    const call = calls[index]!;
    const entry = plan.entries[index]!;
    if (
      call.call_order !== index ||
      call.call_slot_id !== entry.call_slot_id ||
      call.repeat_block !== entry.repeat_block ||
      call.position_in_block !== entry.position_in_block ||
      call.arm !== entry.arm ||
      call.request_family_kind !== ACGC_E2R2P6H_REQUEST_FAMILY_KIND_V01 ||
      call.request_family_trace_id !== entry.request_family_trace_id ||
      call.client_request_id !== entry.client_request_id ||
      call.local_invocation_identity_fingerprint !==
        entry.local_invocation_identity_fingerprint ||
      call.provider_material_fingerprint !== entry.provider_material_fingerprint ||
      call.provider_visible_request_fingerprint !==
        entry.provider_visible_request_fingerprint ||
      call.retries !== 0 ||
      call.replacement_calls !== 0 ||
      typeof call.egress_attempted !== "boolean" ||
      ![
        "completed_live", "provider_rejected", "provider_response_invalid",
        "transport_failed", "timed_out", "cancelled", "blocked_before_egress",
        "authority_or_source_route_drift", "internal_failure",
        "not_attempted_after_hard_stop",
      ].includes(call.terminal_category as string) ||
      (call.normalized_output === null) !==
        (call.normalized_output_fingerprint === null) ||
      (call.normalized_output !== null &&
        call.normalized_output_fingerprint !==
          createProtocolSha256V01(
            canonicalizeProtocolValueV01(call.normalized_output),
          )) ||
      (isRecordV01(call.receipt) &&
        call.receipt.egress_attempted !== call.egress_attempted)
    ) {
      failV01("operational_reentry_v04_stale_reset_artifact_call_invalid");
    }
    if (hardStop) {
      if (
        call.terminal_category !== "not_attempted_after_hard_stop" ||
        call.egress_attempted !== false ||
        call.normalized_output !== null ||
        call.receipt !== null ||
        call.failure_code !== "operational_reentry_v04_stale_reset_hard_stop"
      ) {
        failV01("operational_reentry_v04_stale_reset_artifact_call_invalid");
      }
      continue;
    }
    if (call.terminal_category === "not_attempted_after_hard_stop") {
      failV01("operational_reentry_v04_stale_reset_artifact_call_invalid");
    }
    if (call.terminal_category === "completed_live") {
      if (call.normalized_output === null || call.failure_code !== null) {
        failV01("operational_reentry_v04_stale_reset_artifact_call_invalid");
      }
    } else {
      if (call.normalized_output !== null || typeof call.failure_code !== "string") {
        failV01("operational_reentry_v04_stale_reset_artifact_call_invalid");
      }
      hardStop = true;
    }
  }
}

function assertBlockRecordsV01(
  blocks: ArtifactRecordV01[],
  calls: ArtifactRecordV01[],
  plan: OperationalReentryV04StaleResetIsolationPlanV01,
): void {
  for (const block of [0, 1, 2, 3] as const) {
    const observed = calls
      .filter(
        (call) => call.repeat_block === block && call.normalized_output !== null,
      )
      .map((call) => ({
        entry: plan.entries[call.call_order]!,
        normalized_output: call.normalized_output,
      }));
    const expected = evaluateOperationalReentryV04StaleResetIsolationBlockV01(
      block,
      observed,
    );
    const actual = blocks[block]!;
    if (
      canonicalizeProtocolValueV01(actual) !==
        canonicalizeProtocolValueV01(expected) ||
      actual.evaluator_version !==
        OPERATIONAL_REENTRY_V04_STALE_RESET_ISOLATION_EVALUATOR_VERSION_V01 ||
      actual.repeat_block !== block ||
      actual.pair_results_inferred_transitively !== false ||
      actual.deterministic_no_score_aggregation !== true ||
      (actual.status === "complete" &&
        (actual.all_six_pairs_evaluated_directly !== true ||
          !Array.isArray(actual.pair_evaluations) ||
          actual.pair_evaluations.length !== 6)) ||
      (actual.status === "incomplete" &&
        (actual.all_six_pairs_evaluated_directly !== false ||
          !Array.isArray(actual.pair_evaluations) ||
          actual.pair_evaluations.length !== 0))
    ) {
      failV01("operational_reentry_v04_stale_reset_artifact_block_invalid");
    }
  }
}

function assertConsumptionHistoryV01(input: {
  repository_root: string;
  run_root: string;
  authorization: ArtifactRecordV01;
  manifest: ArtifactRecordV01;
  consumed: boolean;
}): void {
  const globalPath = consumptionMarkerPathV01(
    input.repository_root,
    input.authorization.integrity.fingerprint,
  );
  const localPath = path.join(input.run_root, "authorization-consumed.json");
  if (!input.consumed) {
    if (existsSync(globalPath) || existsSync(localPath)) {
      failV01("operational_reentry_v04_stale_reset_consumption_history_invalid");
    }
    return;
  }
  if (!existsSync(globalPath) || !existsSync(localPath)) {
    failV01("operational_reentry_v04_stale_reset_consumption_history_invalid");
  }
  const globalMarker = readCanonicalRecordV01(
    globalPath,
    "operational_reentry_v04_stale_reset_consumption_history_invalid",
  );
  const localMarker = readCanonicalRecordV01(
    localPath,
    "operational_reentry_v04_stale_reset_consumption_history_invalid",
  );
  assertExactKeysV01(
    globalMarker,
    CONSUMPTION_KEYS_V01,
    "operational_reentry_v04_stale_reset_consumption_history_invalid",
  );
  assertExactKeysV01(
    localMarker,
    CONSUMPTION_KEYS_V01,
    "operational_reentry_v04_stale_reset_consumption_history_invalid",
  );
  if (
    canonicalizeProtocolValueV01(globalMarker) !==
      canonicalizeProtocolValueV01(localMarker) ||
    globalMarker.consumption_version !==
      OPERATIONAL_REENTRY_V04_STALE_RESET_ISOLATION_CONSUMPTION_VERSION_V01 ||
    globalMarker.authorization_fingerprint !==
      input.authorization.integrity.fingerprint ||
    globalMarker.cohort_id !== input.manifest.cohort_id ||
    globalMarker.future_live_issue_number !==
      input.manifest.future_live_issue_number ||
    globalMarker.first_future_provider_egress_attempt_consumes_globally !== true ||
    globalMarker.partial_consumption_remains_consumed !== true ||
    globalMarker.retries_authorized !== false ||
    globalMarker.replacements_authorized !== false ||
    globalMarker.second_cohort_authorized !== false ||
    globalMarker.replication_authorized !== false ||
    globalMarker.policy_authorized !== false ||
    globalMarker.stage_7_authorized !== false
  ) {
    failV01("operational_reentry_v04_stale_reset_consumption_history_invalid");
  }
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
