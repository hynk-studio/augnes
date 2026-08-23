import { mkdir, open } from "node:fs/promises";
import path from "node:path";

import {
  canonicalizeProtocolValueV01,
  createProtocolSha256V01,
} from "@/lib/vnext/protocol-primitives";
import { validateOperationalReentryStaleResetCrossCaseCompatibilityAuthorizationV01 } from "@/lib/vnext/operational-reentry-stale-reset-cross-case-replication";
import type { OperationalReentryStaleResetCrossCaseIntegrityV01 } from "@/types/vnext/operational-reentry-stale-reset-cross-case-replication";

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
) {
  const value = record(bundle);
  exactKeys(value, [
    "authorization",
    "plan",
    "manifest",
    "shape_records",
    "report",
    "terminal",
    "artifact_index",
    "global_consumption_marker",
    "run_local_consumption_marker",
  ]);
  assertPrivacy(value);
  validateOperationalReentryStaleResetCrossCaseCompatibilityAuthorizationV01(value.authorization);
  const authorization = assertSealed(value.authorization);
  const plan = assertSealed(value.plan);
  const manifest = assertSealed(value.manifest);
  const report = assertSealed(value.report);
  const terminal = assertSealed(value.terminal);
  const index = assertSealed(value.artifact_index);
  const globalMarker = assertSealed(value.global_consumption_marker);
  const localMarker = assertSealed(value.run_local_consumption_marker);
  if (!Array.isArray(value.shape_records) || value.shape_records.length !== 6) {
    fail("cross_case_compatibility_shape_count_invalid");
  }
  const shapes = value.shape_records.map((shape, indexValue) => {
    const item = assertSealed(shape);
    if (item.call_order !== indexValue) {
      fail("cross_case_compatibility_shape_order_invalid");
    }
    return item;
  });
  const expectedOrder = ["R1-A", "R1-B", "R1-C", "R2-A", "R2-B", "R2-C"];
  if (
    canonicalizeProtocolValueV01(shapes.map((shape) => shape.shape_label)) !==
      canonicalizeProtocolValueV01(expectedOrder) ||
    manifest.authorization_fingerprint !== authorization.integrity.fingerprint ||
    manifest.plan_fingerprint !== plan.integrity.fingerprint ||
    report.manifest_fingerprint !== manifest.integrity.fingerprint ||
    terminal.report_fingerprint !== report.integrity.fingerprint ||
    index.report_fingerprint !== report.integrity.fingerprint ||
    index.terminal_fingerprint !== terminal.integrity.fingerprint ||
    index.shape_record_count !== 6 ||
    globalMarker.authorization_fingerprint !== authorization.integrity.fingerprint ||
    localMarker.authorization_fingerprint !== authorization.integrity.fingerprint ||
    canonicalizeProtocolValueV01(globalMarker) !==
      canonicalizeProtocolValueV01(localMarker)
  ) fail("cross_case_compatibility_semantic_cross_link_drift");
  return Object.freeze({
    valid: true as const,
    shape_records: 6 as const,
    authorization_fingerprint: authorization.integrity.fingerprint,
    report_fingerprint: report.integrity.fingerprint,
    artifact_index_fingerprint: index.integrity.fingerprint,
  });
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
