import { mkdir, open } from "node:fs/promises";
import path from "node:path";

import {
  canonicalizeProtocolValueV01,
  createProtocolSha256V01,
} from "@/lib/vnext/protocol-primitives";
import {
  createOperationalReentryStaleResetCrossCaseLocalInvocationIdentityFingerprintV01,
  type ModelGatewayInteractiveAdmissionV01,
} from "@/lib/vnext/model-gateway/model-gateway";
import { validateModelInvocationReceiptV02 } from "@/lib/vnext/model-gateway/model-invocation-receipt";
import {
  validateOperationalReentryStaleResetCrossCaseCompatibilityAuthorizationContextV01,
  validateOperationalReentryStaleResetCrossCaseCompatibilityAuthorizationV01,
  validateOperationalReentryStaleResetCrossCaseNormalizedOutputV01,
} from "@/lib/vnext/operational-reentry-stale-reset-cross-case-replication";
import type {
  OperationalReentryStaleResetCrossCaseIntegrityV01,
  OperationalReentryStaleResetCrossCaseModelOutputV01,
  OperationalReentryStaleResetCrossCaseRouteV01,
} from "@/types/vnext/operational-reentry-stale-reset-cross-case-replication";

const NAMESPACE =
  "operational-reentry-stale-reset-cross-case-compatibility-probes" as const;
const SHA256 = /^sha256:[0-9a-f]{64}$/u;

export class OperationalReentryStaleResetCrossCaseCompatibilityArtifactErrorV01 extends Error {
  constructor(readonly code: string) {
    super(code);
    this.name =
      "OperationalReentryStaleResetCrossCaseCompatibilityArtifactErrorV01";
  }
}

export function buildOperationalReentryStaleResetCrossCaseCompatibilityArtifactFamilyContractV01() {
  return seal("cross_case_compatibility_artifact_family_without_integrity_fingerprint", {
    artifact_family_version:
      "operational_reentry_stale_reset_cross_case_compatibility_artifact_family.v0.1" as const,
    namespace: `.augnes-lab/${NAMESPACE}/` as const,
    candidate_authorizations:
      "candidate-authorizations/issue-<future-compatibility-issue>/" as const,
    authorization_consumptions:
      "authorization-consumptions/<authorization-fingerprint>.json" as const,
    run_roots: "<probe-id>/issue-<future-compatibility-issue>/" as const,
    append_only: true as const,
    canonical_json: true as const,
    integrity_sealed: true as const,
    replication_authorization_substitution: false as const,
    historical_v04_compatibility_namespace_reuse: false as const,
    raw_or_private_material_persisted: false as const,
    creates_real_artifacts_during_p6l: false as const,
    live_compatibility_result: "none" as const,
    real_provider_calls: 0 as const,
  });
}

export async function consumeOperationalReentryStaleResetCrossCaseCompatibilityAuthorizationV01(
  input: {
    lab_root: string;
    authorization: Record<string, unknown> & {
      integrity: OperationalReentryStaleResetCrossCaseIntegrityV01;
    };
    probe_id: string;
    consumed_at: string;
  },
) {
  validateOperationalReentryStaleResetCrossCaseCompatibilityAuthorizationV01(
    input.authorization,
  );
  assertSealed(input.authorization);
  if (!/^[A-Za-z0-9:._-]{1,200}$/u.test(input.probe_id)) {
    fail("cross_case_compatibility_probe_id_invalid");
  }
  const authorizationFingerprint = input.authorization.integrity.fingerprint;
  const issue = input.authorization.future_compatibility_issue_number;
  if (!Number.isSafeInteger(issue) || (issue as number) <= 0) {
    fail("cross_case_compatibility_authorization_invalid");
  }
  const marker = seal("cross_case_compatibility_consumption_without_integrity_fingerprint", {
    marker_version:
      "operational_reentry_stale_reset_cross_case_compatibility_consumption.v0.1" as const,
    authorization_fingerprint: authorizationFingerprint,
    probe_id: input.probe_id,
    future_compatibility_issue_number: issue as number,
    consumed_at: input.consumed_at,
    single_use: true as const,
  });
  const root = path.resolve(input.lab_root, NAMESPACE);
  const consumptionDirectory = path.join(root, "authorization-consumptions");
  await mkdir(consumptionDirectory, { recursive: true });
  const globalMarkerPath = path.join(
    consumptionDirectory,
    `${authorizationFingerprint.slice("sha256:".length)}.json`,
  );
  await writeNew(globalMarkerPath, marker, "cross_case_compatibility_authorization_consumed");
  const runRoot = path.join(root, input.probe_id, `issue-${issue}`);
  await mkdir(runRoot, { recursive: true });
  const localMarkerPath = path.join(runRoot, "authorization-consumption.json");
  await writeNew(localMarkerPath, marker, "cross_case_compatibility_run_root_collision");
  return {
    global_marker_path: globalMarkerPath,
    run_root: runRoot,
    local_marker_path: localMarkerPath,
    marker,
  };
}

export function validateOperationalReentryStaleResetCrossCaseCompatibilityArtifactsV01(
  bundle: unknown,
  context: {
    admission: ModelGatewayInteractiveAdmissionV01;
    route: OperationalReentryStaleResetCrossCaseRouteV01;
  },
) {
  const value = record(bundle);
  exactKeys(value, [
    "authorization",
    "plan",
    "pricing",
    "manifest",
    "shape_records",
    "report",
    "terminal",
    "artifact_index",
    "global_consumption_marker",
    "run_local_consumption_marker",
  ]);
  assertPrivacy(value);
  const pricing = assertSealed(value.pricing);
  const validated =
    validateOperationalReentryStaleResetCrossCaseCompatibilityAuthorizationContextV01(
      value.authorization,
      {
        ...context,
        pricing: value.pricing,
        pricing_evaluated_at: String(pricing.pricing_snapshot_evaluated_at),
      },
    );
  const authorization = assertSealed(validated.authorization);
  const plan = assertSealed(value.plan);
  const manifest = assertSealed(value.manifest);
  const report = assertSealed(value.report);
  const terminal = assertSealed(value.terminal);
  const index = assertSealed(value.artifact_index);
  const globalMarker = assertSealed(value.global_consumption_marker);
  const localMarker = assertSealed(value.run_local_consumption_marker);
  if (
    canonicalizeProtocolValueV01(plan) !==
      canonicalizeProtocolValueV01(validated.plan) ||
    canonicalizeProtocolValueV01(manifest.route) !==
      canonicalizeProtocolValueV01(context.route)
  ) fail("cross_case_compatibility_canonical_owner_drift");
  if (!Array.isArray(value.shape_records) || value.shape_records.length !== 6) {
    fail("cross_case_compatibility_shape_count_invalid");
  }
  const shapes = value.shape_records.map((shape, indexValue) => {
    const item = assertSealed(shape);
    const entry = validated.plan.entries[indexValue]!;
    const expectedLabel = `${entry.case_id.includes(":r1-") ? "R1" : "R2"}-${entry.provider_shape}`;
    validateShapeTerminal(item, entry);
    if (
      item.call_order !== indexValue ||
      item.case_id !== entry.case_id ||
      item.arm !== entry.provider_shape ||
      item.repeat_block !== 0 ||
      item.call_id !== entry.invocation.local_invocation_context.call_slot_id ||
      item.shape_label !== expectedLabel ||
      item.manifest_fingerprint !== manifest.integrity.fingerprint
    ) {
      fail("cross_case_compatibility_shape_order_invalid");
    }
    return item;
  });
  const expectedOrder = ["R1-A", "R1-B", "R1-C", "R2-A", "R2-B", "R2-C"];
  let failureSeen = false;
  for (const shape of shapes) {
    if (failureSeen && shape.terminal_category !== "not_attempted_after_hard_stop") {
      fail("cross_case_compatibility_stop_semantics_invalid");
    }
    if (shape.terminal_category === "not_attempted_after_hard_stop" && !failureSeen) {
      fail("cross_case_compatibility_stop_semantics_invalid");
    }
    if (shape.terminal_category === "terminal_failure") failureSeen = true;
  }
  const attemptedProviderCalls = shapes.reduce(
    (total, shape) => total + Number(shape.provider_calls_used),
    0,
  );
  const compatible = shapes.every(
    (shape) => shape.terminal_category === "completed_live",
  );
  const expectedReport = {
    manifest_fingerprint: manifest.integrity.fingerprint,
    completion_status: compatible
      ? "compatible"
      : "not_compatible_or_incomplete",
    planned_shapes: 6,
    terminal_shape_records: 6,
    attempted_provider_calls: attemptedProviderCalls,
    retries: 0,
    replacements: 0,
    behavioral_replication: false,
  };
  const { integrity: _reportIntegrity, ...reportPayload } = report;
  if (
    canonicalizeProtocolValueV01(shapes.map((shape) => shape.shape_label)) !==
      canonicalizeProtocolValueV01(expectedOrder) ||
    manifest.authorization_fingerprint !== authorization.integrity.fingerprint ||
    manifest.plan_fingerprint !== plan.integrity.fingerprint ||
    manifest.pricing_fingerprint !== pricing.integrity.fingerprint ||
    manifest.route_fingerprint !== context.route.integrity_fingerprint ||
    manifest.provider_contract_fingerprint !==
      context.route.provider_contract_fingerprint ||
    canonicalizeProtocolValueV01(reportPayload) !==
      canonicalizeProtocolValueV01(expectedReport) ||
    terminal.report_fingerprint !== report.integrity.fingerprint ||
    terminal.terminal !== true ||
    index.report_fingerprint !== report.integrity.fingerprint ||
    index.terminal_fingerprint !== terminal.integrity.fingerprint ||
    index.shape_record_count !== 6 ||
    globalMarker.authorization_fingerprint !== authorization.integrity.fingerprint ||
    localMarker.authorization_fingerprint !== authorization.integrity.fingerprint ||
    canonicalizeProtocolValueV01(globalMarker) !==
      canonicalizeProtocolValueV01(localMarker)
  ) fail("cross_case_compatibility_semantic_cross_link_drift");
  exactKeys(manifest, [
    "compatibility_version", "probe_id", "future_compatibility_issue_number",
    "source_repository_head_sha", "authorization_fingerprint", "plan_fingerprint",
    "provider_contract_fingerprint", "route_fingerprint", "route",
    "pricing_fingerprint", "behavioral_replication",
    "raw_or_private_material_persisted", "integrity",
  ]);
  exactKeys(terminal, ["report_fingerprint", "terminal", "integrity"]);
  exactKeys(index, [
    "report_fingerprint", "terminal_fingerprint", "shape_record_count",
    "integrity",
  ]);
  exactKeys(globalMarker, [
    "marker_version", "authorization_fingerprint", "probe_id",
    "future_compatibility_issue_number", "consumed_at", "single_use",
    "integrity",
  ]);
  if (
    manifest.compatibility_version !==
      "operational_reentry_stale_reset_cross_case_compatibility_probe.v0.1" ||
    manifest.future_compatibility_issue_number !==
      authorization.future_compatibility_issue_number ||
    manifest.source_repository_head_sha !==
      authorization.exact_merged_source_head ||
    manifest.probe_id !== globalMarker.probe_id ||
    manifest.behavioral_replication !== false ||
    manifest.raw_or_private_material_persisted !== false ||
    globalMarker.marker_version !==
      "operational_reentry_stale_reset_cross_case_compatibility_consumption.v0.1" ||
    globalMarker.future_compatibility_issue_number !==
      authorization.future_compatibility_issue_number ||
    globalMarker.single_use !== true
  ) fail("cross_case_compatibility_semantic_cross_link_drift");
  return Object.freeze({
    valid: true as const,
    shape_records: 6 as const,
    authorization_fingerprint: authorization.integrity.fingerprint,
    report_fingerprint: report.integrity.fingerprint,
    artifact_index_fingerprint: index.integrity.fingerprint,
    attempted_provider_calls: attemptedProviderCalls,
  });
}

function validateShapeTerminal(
  shape: Record<string, unknown> & {
    integrity: OperationalReentryStaleResetCrossCaseIntegrityV01;
  },
  entry: {
    invocation: Parameters<
      typeof createOperationalReentryStaleResetCrossCaseLocalInvocationIdentityFingerprintV01
    >[0];
  },
): void {
  exactKeys(shape, [
    "call_order", "repeat_block", "arm", "case_id", "call_id",
    "terminal_category", "normalized_output", "model_invocation_receipt",
    "receipt_fingerprint", "egress_attempted", "provider_calls_used",
    "failure_code", "raw_prompt_persisted", "raw_request_body_persisted",
    "raw_provider_response_persisted", "raw_provider_error_persisted",
    "hidden_reasoning_persisted", "shape_label", "manifest_fingerprint",
    "integrity",
  ]);
  const receipt = shape.model_invocation_receipt === null
    ? null
    : validateModelInvocationReceiptV02(shape.model_invocation_receipt);
  const output = shape.normalized_output as
    | OperationalReentryStaleResetCrossCaseModelOutputV01
    | null;
  if (output !== null) {
    validateOperationalReentryStaleResetCrossCaseNormalizedOutputV01(
      entry.invocation,
      output,
    );
  }
  const category = shape.terminal_category;
  const expectedLocalIdentity =
    createOperationalReentryStaleResetCrossCaseLocalInvocationIdentityFingerprintV01(
      entry.invocation,
    );
  if (
    (receipt === null
      ? shape.receipt_fingerprint !== null ||
        shape.egress_attempted !== false ||
        shape.provider_calls_used !== 0
      : shape.receipt_fingerprint !== hash(receipt) ||
        shape.egress_attempted !== receipt.egress_attempted ||
        shape.provider_calls_used !== receipt.budget.provider_calls_used ||
        receipt.purpose !==
          "operational_reentry_stale_reset_cross_case_replication_v01" ||
        receipt.invocation_id !==
          entry.invocation.local_invocation_context.call_slot_id ||
        receipt.local_invocation_identity_fingerprint !== expectedLocalIdentity ||
        (output !== null &&
          receipt.normalized_output_fingerprint !== hash(output))) ||
    (category === "completed_live" &&
      (output === null ||
        receipt === null ||
        receipt.status !== "completed" ||
        receipt.outcome !== "live_success" ||
        receipt.execution_mode !== "live" ||
        shape.failure_code !== null ||
        receipt.budget.provider_calls_used !== 1)) ||
    (category === "terminal_failure" &&
      (output !== null || shape.failure_code === null || receipt?.status === "completed")) ||
    (category === "not_attempted_after_hard_stop" &&
      (output !== null || receipt !== null || shape.failure_code === null)) ||
    !["completed_live", "terminal_failure", "not_attempted_after_hard_stop"].includes(
      String(category),
    ) ||
    shape.raw_prompt_persisted !== false ||
    shape.raw_request_body_persisted !== false ||
    shape.raw_provider_response_persisted !== false ||
    shape.raw_provider_error_persisted !== false ||
    shape.hidden_reasoning_persisted !== false
  ) fail("cross_case_compatibility_shape_terminal_invalid");
}

export async function appendOperationalReentryStaleResetCrossCaseCompatibilityArtifactV01(input: {
  run_root: string;
  relative_path: string;
  artifact: unknown;
}): Promise<string> {
  if (!/^(?:authorization|plan|pricing|manifest|report|terminal|artifact-index|shape-[0-5])\.json$/u.test(input.relative_path)) {
    fail("cross_case_compatibility_artifact_path_invalid");
  }
  assertSealed(input.artifact);
  assertPrivacy(input.artifact);
  const target = path.join(path.resolve(input.run_root), input.relative_path);
  await writeNew(target, input.artifact, "cross_case_compatibility_artifact_collision");
  return target;
}

export function sealOperationalReentryStaleResetCrossCaseCompatibilityArtifactV01<
  T extends object,
>(scope: string, value: T) {
  return seal(scope, value);
}

async function writeNew(target: string, value: unknown, collisionCode: string) {
  let handle;
  try {
    handle = await open(target, "wx", 0o600);
    await handle.writeFile(`${canonicalizeProtocolValueV01(value)}\n`, "utf8");
    await handle.sync();
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "EEXIST") {
      fail(collisionCode);
    }
    throw error;
  } finally {
    await handle?.close();
  }
}

function assertSealed(value: unknown) {
  const item = record(value);
  const integrity = record(item.integrity);
  const { integrity: _ignored, ...withoutIntegrity } = item;
  if (
    !SHA256.test(String(integrity.fingerprint)) ||
    integrity.fingerprint !== hash(withoutIntegrity)
  ) fail("cross_case_compatibility_artifact_integrity_invalid");
  return item as Record<string, unknown> & {
    integrity: OperationalReentryStaleResetCrossCaseIntegrityV01;
  };
}

function assertPrivacy(value: unknown): void {
  const forbiddenKeys = /(?:raw_prompt|raw_request|raw_response|hidden_reasoning|secret|api_key|authorization_header)/iu;
  const forbiddenValues = /(?:sk-[A-Za-z0-9_-]{8,}|-----BEGIN [A-Z ]+PRIVATE KEY-----)/u;
  const visit = (item: unknown) => {
    if (Array.isArray(item)) return item.forEach(visit);
    if (typeof item !== "object" || item === null) {
      if (typeof item === "string" && forbiddenValues.test(item)) {
        fail("cross_case_compatibility_privacy_invalid");
      }
      return;
    }
    for (const [key, child] of Object.entries(item)) {
      if (forbiddenKeys.test(key) && child !== false) {
        fail("cross_case_compatibility_privacy_invalid");
      }
      visit(child);
    }
  };
  visit(value);
}

function seal<T extends object>(scope: string, value: T): T & {
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

function hash(value: unknown) {
  return createProtocolSha256V01(canonicalizeProtocolValueV01(value));
}

function exactKeys(value: Record<string, unknown>, expected: readonly string[]) {
  if (
    canonicalizeProtocolValueV01(Object.keys(value).sort()) !==
    canonicalizeProtocolValueV01([...expected].sort())
  ) fail("cross_case_compatibility_artifact_shape_invalid");
}

function record(value: unknown): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    fail("cross_case_compatibility_artifact_shape_invalid");
  }
  return value as Record<string, unknown>;
}

function fail(code: string): never {
  throw new OperationalReentryStaleResetCrossCaseCompatibilityArtifactErrorV01(
    code,
  );
}
