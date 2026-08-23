import { mkdir, open, readFile } from "node:fs/promises";
import path from "node:path";

import {
  canonicalizeProtocolValueV01,
  createProtocolSha256V01,
} from "@/lib/vnext/protocol-primitives";
import { readOperationalReentryStaleResetCrossCaseV01 } from "@/fixtures/vnext/research/operational-reentry-stale-reset-cross-case-replication-v0-1";
import {
  buildOperationalReentryStaleResetCrossCaseCallTerminalV01,
  buildOperationalReentryStaleResetCrossCaseEvaluatorBindingV01,
  buildOperationalReentryStaleResetCrossCaseGateContractV01,
  deriveOperationalReentryStaleResetReplicationCasePatternStatusV01,
  evaluateOperationalReentryStaleResetCrossCaseBlockV01,
  validateOperationalReentryStaleResetCrossCaseReplicationAuthorizationContextV01,
  validateOperationalReentryStaleResetCrossCaseReplicationAuthorizationV01,
} from "@/lib/vnext/operational-reentry-stale-reset-cross-case-replication";
import type { ModelGatewayInteractiveAdmissionV01 } from "@/lib/vnext/model-gateway/model-gateway";
import {
  OPERATIONAL_REENTRY_V04_STALE_RESET_REPLICATION_ARTIFACT_INDEX_VERSION_V01,
  OPERATIONAL_REENTRY_V04_STALE_RESET_REPLICATION_MANIFEST_VERSION_V01,
  OPERATIONAL_REENTRY_V04_STALE_RESET_REPLICATION_REPORT_VERSION_V01,
  type OperationalReentryStaleResetCrossCaseAuthorizationV01,
  type OperationalReentryStaleResetCrossCaseIntegrityV01,
  type OperationalReentryStaleResetCrossCaseModelOutputV01,
  type OperationalReentryStaleResetCrossCaseRouteV01,
} from "@/types/vnext/operational-reentry-stale-reset-cross-case-replication";

const NAMESPACE =
  "operational-reentry-v04-stale-reset-cross-case-replications" as const;
const SHA256 = /^sha256:[0-9a-f]{64}$/u;

export class OperationalReentryStaleResetCrossCaseArtifactErrorV01 extends Error {
  constructor(readonly code: string) {
    super(code);
    this.name = "OperationalReentryStaleResetCrossCaseArtifactErrorV01";
  }
}

export function buildOperationalReentryStaleResetCrossCaseReplicationArtifactFamilyContractV01() {
  return sealArtifactV01(
    "cross_case_replication_artifact_family_without_integrity_fingerprint",
    {
      artifact_family_version:
        "operational_reentry_v04_stale_reset_replication_artifact_family.v0.1" as const,
      namespace: `.augnes-lab/${NAMESPACE}/` as const,
      candidate_authorization_namespace:
        "candidate-authorizations/issue-<future-live-issue>/" as const,
      global_consumption_namespace:
        "authorization-consumptions/<authorization-fingerprint>.json" as const,
      run_namespace:
        "<case-id>/<cohort-id>/issue-<future-live-issue>/" as const,
      manifest_version:
        OPERATIONAL_REENTRY_V04_STALE_RESET_REPLICATION_MANIFEST_VERSION_V01,
      report_version:
        OPERATIONAL_REENTRY_V04_STALE_RESET_REPLICATION_REPORT_VERSION_V01,
      artifact_index_version:
        OPERATIONAL_REENTRY_V04_STALE_RESET_REPLICATION_ARTIFACT_INDEX_VERSION_V01,
      append_only: true as const,
      canonical_json: true as const,
      integrity_sealed: true as const,
      one_case_per_candidate_authorization_marker_and_run_root: true as const,
      historical_namespace_reuse: false as const,
      raw_prompt_persisted: false as const,
      raw_request_body_persisted: false as const,
      raw_provider_response_persisted: false as const,
      raw_provider_error_persisted: false as const,
      hidden_reasoning_persisted: false as const,
      product_or_core_write: false as const,
      creates_real_artifacts_during_p6l: false as const,
      real_provider_calls: 0 as const,
    },
  );
}

export async function consumeOperationalReentryStaleResetCrossCaseAuthorizationV01(
  input: {
    lab_root: string;
    authorization: OperationalReentryStaleResetCrossCaseAuthorizationV01;
    cohort_id: string;
    consumed_at: string;
  },
) {
  assertAuthorization(input.authorization);
  if (!/^[A-Za-z0-9._-]{1,160}$/u.test(input.cohort_id)) {
    fail("cross_case_replication_cohort_id_invalid");
  }
  const root = path.resolve(input.lab_root, NAMESPACE);
  const authorizationFingerprint = input.authorization.integrity.fingerprint;
  const markerName = `${authorizationFingerprint.slice("sha256:".length)}.json`;
  const globalDirectory = path.join(root, "authorization-consumptions");
  await mkdir(globalDirectory, { recursive: true });
  const marker = sealArtifactV01(
    "cross_case_replication_consumption_marker_without_integrity_fingerprint",
    {
      marker_version:
        "operational_reentry_v04_stale_reset_replication_consumption.v0.1" as const,
      authorization_fingerprint: authorizationFingerprint,
      authorization_id: input.authorization.authorization_id,
      case_id: input.authorization.case_id,
      case_fingerprint: input.authorization.case_fingerprint,
      cohort_id: input.cohort_id,
      future_live_issue_number:
        input.authorization.future_live_issue_number,
      consumed_at: input.consumed_at,
      single_use: true as const,
    },
  );
  const globalPath = path.join(globalDirectory, markerName);
  await writeNewCanonical(globalPath, marker, "cross_case_replication_authorization_consumed");
  const runRoot = path.join(
    root,
    input.authorization.case_id,
    input.cohort_id,
    `issue-${input.authorization.future_live_issue_number}`,
  );
  await mkdir(runRoot, { recursive: false }).catch((error: unknown) => {
    if (isNodeError(error, "ENOENT")) {
      return mkdir(runRoot, { recursive: true });
    }
    fail("cross_case_replication_run_root_collision");
  });
  const localPath = path.join(runRoot, "authorization-consumption.json");
  await writeNewCanonical(localPath, marker, "cross_case_replication_run_root_collision");
  return { global_marker_path: globalPath, run_root: runRoot, local_marker_path: localPath, marker };
}

export async function readCanonicalOperationalReentryStaleResetCrossCaseArtifactV01(
  artifactPath: string,
): Promise<unknown> {
  const text = await readFile(artifactPath, "utf8");
  const parsed = JSON.parse(text) as unknown;
  if (text !== `${canonicalizeProtocolValueV01(parsed)}\n`) {
    fail("cross_case_replication_artifact_noncanonical");
  }
  return parsed;
}

export async function appendOperationalReentryStaleResetCrossCaseArtifactV01(input: {
  run_root: string;
  relative_path: string;
  artifact: unknown;
}): Promise<string> {
  if (!/^(?:authorization|case-specification|plan|gate-contract|evaluator-binding|pricing|manifest|attempt|case-status|report|terminal|artifact-index|call-[0-9]{2}|block-[0-3])\.json$/u.test(input.relative_path)) {
    fail("cross_case_replication_artifact_path_invalid");
  }
  sealedRecord(input.artifact);
  assertPrivacy(input.artifact);
  const target = path.join(path.resolve(input.run_root), input.relative_path);
  await writeNewCanonical(target, input.artifact, "cross_case_replication_artifact_collision");
  return target;
}

export function validateOperationalReentryStaleResetCrossCaseReplicationArtifactsV01(
  bundle: unknown,
  context: {
    admission: ModelGatewayInteractiveAdmissionV01;
    route: OperationalReentryStaleResetCrossCaseRouteV01;
  },
) {
  const value = record(bundle);
  exactKeys(value, [
    "authorization",
    "case_specification",
    "plan",
    "gate_contract",
    "evaluator_binding",
    "pricing",
    "manifest",
    "attempt",
    "call_records",
    "block_records",
    "case_status",
    "report",
    "terminal",
    "artifact_index",
    "global_consumption_marker",
    "run_local_consumption_marker",
  ]);
  assertPrivacy(value);
  const pricingRecord = sealedRecord(value.pricing);
  const pricingEvaluatedAt = String(pricingRecord.pricing_snapshot_evaluated_at);
  const validated =
    validateOperationalReentryStaleResetCrossCaseReplicationAuthorizationContextV01(
      value.authorization,
      {
        ...context,
        pricing: value.pricing,
        pricing_evaluated_at: pricingEvaluatedAt,
      },
    );
  const authorization = sealedRecord(validated.authorization);
  const caseSpec = sealedRecord(value.case_specification);
  const plan = sealedRecord(value.plan);
  const gate = sealedRecord(value.gate_contract);
  const evaluator = sealedRecord(value.evaluator_binding);
  const pricing = sealedRecord(validated.pricing);
  const manifest = sealedRecord(value.manifest);
  const attempt = sealedRecord(value.attempt);
  const caseStatus = sealedRecord(value.case_status);
  const report = sealedRecord(value.report);
  const terminal = sealedRecord(value.terminal);
  const index = sealedRecord(value.artifact_index);
  const globalMarker = sealedRecord(value.global_consumption_marker);
  const localMarker = sealedRecord(value.run_local_consumption_marker);
  const canonicalCase = readOperationalReentryStaleResetCrossCaseV01(
    validated.authorization.case_id,
  );
  const canonicalGate =
    buildOperationalReentryStaleResetCrossCaseGateContractV01(
      validated.authorization.case_id,
    );
  const canonicalEvaluator =
    buildOperationalReentryStaleResetCrossCaseEvaluatorBindingV01(
      validated.authorization.case_id,
    );
  if (
    canonicalizeProtocolValueV01(caseSpec) !==
      canonicalizeProtocolValueV01(canonicalCase) ||
    canonicalizeProtocolValueV01(plan) !==
      canonicalizeProtocolValueV01(validated.plan) ||
    canonicalizeProtocolValueV01(gate) !==
      canonicalizeProtocolValueV01(canonicalGate) ||
    canonicalizeProtocolValueV01(evaluator) !==
      canonicalizeProtocolValueV01(canonicalEvaluator) ||
    canonicalizeProtocolValueV01(manifest.route) !==
      canonicalizeProtocolValueV01(context.route)
  ) fail("cross_case_replication_canonical_owner_drift");
  if (!Array.isArray(value.call_records) || value.call_records.length !== 16) {
    fail("cross_case_replication_call_count_invalid");
  }
  if (!Array.isArray(value.block_records) || value.block_records.length !== 4) {
    fail("cross_case_replication_block_count_invalid");
  }
  const calls = value.call_records.map((call, indexValue) => {
    const recordValue = sealedRecord(call);
    const entry = validated.plan.entries[indexValue]!;
    if (
      recordValue.call_order !== indexValue ||
      recordValue.repeat_block !== entry.repeat_block ||
      recordValue.arm !== entry.arm ||
      recordValue.case_id !== entry.case_id ||
      recordValue.call_id !== entry.call_slot_id ||
      recordValue.manifest_fingerprint !== manifest.integrity.fingerprint
    ) {
      fail("cross_case_replication_call_reorder_invalid");
    }
    const expectedTerminal =
      buildOperationalReentryStaleResetCrossCaseCallTerminalV01(
        entry,
        recordValue.terminal_category as
          | "completed_live"
          | "terminal_failure"
          | "not_attempted_after_hard_stop",
        recordValue.normalized_output as
          | OperationalReentryStaleResetCrossCaseModelOutputV01
          | null,
        recordValue.model_invocation_receipt,
        recordValue.failure_code as string | null,
      );
    const { integrity: _terminalIntegrity, ...terminalPayload } = expectedTerminal;
    const {
      integrity: _recordIntegrity,
      manifest_fingerprint: _manifestFingerprint,
      ...persistedPayload
    } = recordValue;
    if (
      canonicalizeProtocolValueV01(persistedPayload) !==
      canonicalizeProtocolValueV01(terminalPayload)
    ) fail("cross_case_replication_call_terminal_drift");
    return recordValue;
  });
  const reconstructedBlocks = ([0, 1, 2, 3] as const).map((repeatBlock) => {
    const observed = calls
      .filter(
        (call) =>
          call.repeat_block === repeatBlock && call.normalized_output !== null,
      )
      .map((call) => ({
        entry: validated.plan.entries[Number(call.call_order)]!,
        normalized_output:
          call.normalized_output as OperationalReentryStaleResetCrossCaseModelOutputV01,
      }));
    return evaluateOperationalReentryStaleResetCrossCaseBlockV01(
      repeatBlock,
      observed,
    );
  });
  const blocks = value.block_records.map((block, indexValue) => {
    const recordValue = sealedRecord(block);
    const reconstructed = reconstructedBlocks[indexValue]!;
    const { integrity: _blockIntegrity, ...blockPayload } = reconstructed;
    const expectedPayload = {
      ...blockPayload,
      case_id: validated.authorization.case_id,
      direct_pair_records: reconstructed.pair_evaluations,
    };
    const { integrity: _persistedIntegrity, ...persistedPayload } = recordValue;
    if (
      recordValue.repeat_block !== indexValue ||
      !Array.isArray(recordValue.direct_pair_records) ||
      recordValue.direct_pair_records.length !== reconstructed.pair_evaluations.length ||
      canonicalizeProtocolValueV01(persistedPayload) !==
        canonicalizeProtocolValueV01(expectedPayload)
    ) fail("cross_case_replication_block_reorder_invalid");
    return recordValue;
  });
  const reconstructedCaseStatus =
    deriveOperationalReentryStaleResetReplicationCasePatternStatusV01(
      reconstructedBlocks,
    );
  if (
    canonicalizeProtocolValueV01(caseStatus) !==
    canonicalizeProtocolValueV01(reconstructedCaseStatus)
  ) fail("cross_case_replication_case_status_drift");
  const authFingerprint = authorization.integrity.fingerprint;
  const caseFingerprint = caseSpec.integrity.fingerprint;
  const planFingerprint = plan.integrity.fingerprint;
  const expected = {
    authorization_fingerprint: authFingerprint,
    case_fingerprint: caseFingerprint,
    plan_fingerprint: planFingerprint,
    gate_contract_fingerprint: gate.integrity.fingerprint,
    evaluator_binding_fingerprint: evaluator.integrity.fingerprint,
    pricing_fingerprint: pricing.integrity.fingerprint,
  };
  for (const [key, expectedValue] of Object.entries(expected)) {
    if (manifest[key] !== expectedValue) {
      fail("cross_case_replication_semantic_cross_link_drift");
    }
  }
  const caseId = caseSpec.case_id;
  const attemptedProviderCalls = calls.reduce(
    (total, call) => total + Number(call.provider_calls_used),
    0,
  );
  const expectedReport = {
    report_version: OPERATIONAL_REENTRY_V04_STALE_RESET_REPLICATION_REPORT_VERSION_V01,
    manifest_fingerprint: manifest.integrity.fingerprint,
    case_status_fingerprint: reconstructedCaseStatus.integrity.fingerprint,
    case_status: reconstructedCaseStatus.status,
    planned_calls: 16,
    terminal_call_records: calls.length,
    complete_blocks: reconstructedBlocks.filter(
      (block) => block.status === "complete",
    ).length,
    direct_pair_records: reconstructedBlocks.reduce(
      (count, block) => count + block.pair_evaluations.length,
      0,
    ),
    attempted_provider_calls: attemptedProviderCalls,
    retries: 0,
    replacements: 0,
    product_or_core_writes: 0,
    policy: false,
    stage_7: false,
  };
  const { integrity: _reportIntegrity, ...reportPayload } = report;
  if (
    authorization.case_id !== caseId ||
    authorization.case_fingerprint !== caseFingerprint ||
    plan.case_id !== caseId ||
    plan.case_fingerprint !== caseFingerprint ||
    manifest.case_id !== caseId ||
    attempt.manifest_fingerprint !== manifest.integrity.fingerprint ||
    calls.some(
      (call) =>
        call.case_id !== caseId ||
        call.manifest_fingerprint !== manifest.integrity.fingerprint,
    ) ||
    blocks.some(
      (block) => block.case_id !== caseId,
    ) ||
    canonicalizeProtocolValueV01(reportPayload) !==
      canonicalizeProtocolValueV01(expectedReport) ||
    terminal.report_fingerprint !== report.integrity.fingerprint ||
    terminal.terminal !== true ||
    index.report_fingerprint !== report.integrity.fingerprint ||
    index.terminal_fingerprint !== terminal.integrity.fingerprint ||
    index.artifact_index_version !==
      OPERATIONAL_REENTRY_V04_STALE_RESET_REPLICATION_ARTIFACT_INDEX_VERSION_V01 ||
    index.call_record_count !== 16 ||
    index.block_record_count !== 4 ||
    globalMarker.authorization_fingerprint !== authFingerprint ||
    localMarker.authorization_fingerprint !== authFingerprint ||
    canonicalizeProtocolValueV01(globalMarker) !==
      canonicalizeProtocolValueV01(localMarker)
  ) fail("cross_case_replication_semantic_cross_link_drift");
  exactKeys(manifest, [
    "manifest_version", "cohort_id", "case_id", "future_live_issue_number",
    "source_repository_head_sha", "authorization_fingerprint", "case_fingerprint",
    "plan_fingerprint", "gate_contract_fingerprint", "evaluator_binding_fingerprint",
    "pricing_fingerprint", "route_fingerprint", "provider_contract_fingerprint",
    "route", "request_family", "public_safe", "raw_or_private_material_persisted",
    "integrity",
  ]);
  exactKeys(attempt, [
    "manifest_fingerprint", "retries", "replacements",
    "maximum_parallel_provider_calls", "integrity",
  ]);
  exactKeys(terminal, ["report_fingerprint", "terminal", "integrity"]);
  exactKeys(index, [
    "artifact_index_version", "report_fingerprint", "terminal_fingerprint",
    "call_record_count", "block_record_count", "integrity",
  ]);
  exactKeys(globalMarker, [
    "marker_version", "authorization_fingerprint", "authorization_id",
    "case_id", "case_fingerprint", "cohort_id", "future_live_issue_number",
    "consumed_at", "single_use", "integrity",
  ]);
  if (
    manifest.manifest_version !==
      OPERATIONAL_REENTRY_V04_STALE_RESET_REPLICATION_MANIFEST_VERSION_V01 ||
    manifest.cohort_id !== globalMarker.cohort_id ||
    manifest.future_live_issue_number !==
      authorization.future_live_issue_number ||
    manifest.source_repository_head_sha !==
      authorization.exact_merged_source_head ||
    manifest.route_fingerprint !== context.route.integrity_fingerprint ||
    manifest.provider_contract_fingerprint !==
      context.route.provider_contract_fingerprint ||
    manifest.request_family !== validated.plan.request_family_kind ||
    manifest.public_safe !== true ||
    manifest.raw_or_private_material_persisted !== false ||
    attempt.manifest_fingerprint !== manifest.integrity.fingerprint ||
    attempt.retries !== 0 ||
    attempt.replacements !== 0 ||
    attempt.maximum_parallel_provider_calls !== 1 ||
    globalMarker.authorization_id !== authorization.authorization_id ||
    globalMarker.marker_version !==
      "operational_reentry_v04_stale_reset_replication_consumption.v0.1" ||
    globalMarker.case_id !== authorization.case_id ||
    globalMarker.case_fingerprint !== authorization.case_fingerprint ||
    globalMarker.future_live_issue_number !==
      authorization.future_live_issue_number ||
    globalMarker.single_use !== true
  ) fail("cross_case_replication_semantic_cross_link_drift");
  const callIds = calls.map((call) => call.call_id);
  if (new Set(callIds).size !== 16) {
    fail("cross_case_replication_call_duplication_invalid");
  }
  return Object.freeze({
    valid: true as const,
    case_id: caseId,
    authorization_fingerprint: authFingerprint,
    manifest_fingerprint: manifest.integrity.fingerprint,
    report_fingerprint: report.integrity.fingerprint,
    terminal_fingerprint: terminal.integrity.fingerprint,
    artifact_index_fingerprint: index.integrity.fingerprint,
    call_records: 16 as const,
    block_records: 4 as const,
    attempted_provider_calls: attemptedProviderCalls,
  });
}

export function sealOperationalReentryStaleResetCrossCaseArtifactV01<
  T extends object,
>(scope: string, value: T) {
  return sealArtifactV01(scope, value);
}

function assertAuthorization(
  value: OperationalReentryStaleResetCrossCaseAuthorizationV01,
): void {
  validateOperationalReentryStaleResetCrossCaseReplicationAuthorizationV01(
    value,
  );
}

async function writeNewCanonical(
  target: string,
  value: unknown,
  collisionCode: string,
): Promise<void> {
  let handle;
  try {
    handle = await open(target, "wx", 0o600);
    await handle.writeFile(`${canonicalizeProtocolValueV01(value)}\n`, "utf8");
    await handle.sync();
  } catch (error) {
    if (isNodeError(error, "EEXIST")) fail(collisionCode);
    throw error;
  } finally {
    await handle?.close();
  }
}

function sealedRecord(value: unknown): Record<string, unknown> & {
  integrity: OperationalReentryStaleResetCrossCaseIntegrityV01;
} {
  const item = record(value);
  const integrityValue = record(item.integrity);
  exactKeys(integrityValue, [
    "algorithm",
    "canonicalization",
    "fingerprint_scope",
    "fingerprint",
  ]);
  const { integrity: _ignored, ...withoutIntegrity } = item;
  if (
    integrityValue.algorithm !== "sha256" ||
    integrityValue.canonicalization !== "augnes-json-c14n-v0_1" ||
    typeof integrityValue.fingerprint_scope !== "string" ||
    !SHA256.test(String(integrityValue.fingerprint)) ||
    integrityValue.fingerprint !== hash(withoutIntegrity)
  ) fail("cross_case_replication_artifact_integrity_invalid");
  return item as Record<string, unknown> & {
    integrity: OperationalReentryStaleResetCrossCaseIntegrityV01;
  };
}

function assertPrivacy(value: unknown): void {
  const forbiddenKeys = /(?:raw_prompt|raw_request|raw_response|hidden_reasoning|secret|api_key|authorization_header)/iu;
  const forbiddenValues = /(?:sk-[A-Za-z0-9_-]{8,}|-----BEGIN [A-Z ]+PRIVATE KEY-----)/u;
  const visit = (item: unknown) => {
    if (Array.isArray(item)) {
      for (const child of item) visit(child);
      return;
    }
    if (typeof item !== "object" || item === null) {
      if (typeof item === "string" && forbiddenValues.test(item)) {
        fail("cross_case_replication_privacy_invalid");
      }
      return;
    }
    for (const [key, child] of Object.entries(item)) {
      if (forbiddenKeys.test(key) && child !== false) {
        fail("cross_case_replication_privacy_invalid");
      }
      visit(child);
    }
  };
  visit(value);
}

function sealArtifactV01<T extends object>(scope: string, value: T): T & {
  integrity: OperationalReentryStaleResetCrossCaseIntegrityV01;
} {
  return {
    ...structuredClone(value),
    integrity: {
      algorithm: "sha256",
      canonicalization: "augnes-json-c14n-v0_1",
      fingerprint_scope: scope,
      fingerprint: hash(value),
    },
  };
}

function hash(value: unknown): string {
  return createProtocolSha256V01(canonicalizeProtocolValueV01(value));
}

function exactKeys(value: Record<string, unknown>, expected: readonly string[]) {
  if (
    canonicalizeProtocolValueV01(Object.keys(value).sort()) !==
    canonicalizeProtocolValueV01([...expected].sort())
  ) fail("cross_case_replication_artifact_shape_invalid");
}

function record(value: unknown): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    fail("cross_case_replication_artifact_shape_invalid");
  }
  return value as Record<string, unknown>;
}

function isNodeError(error: unknown, code: string): boolean {
  return error instanceof Error && "code" in error && error.code === code;
}

function fail(code: string): never {
  throw new OperationalReentryStaleResetCrossCaseArtifactErrorV01(code);
}
