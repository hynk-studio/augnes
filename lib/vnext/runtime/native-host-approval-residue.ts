import {
  canonicalizeProtocolValueV01,
} from "@/lib/vnext/protocol-primitives";
import { validateExternalRefV01 } from "@/lib/vnext/task-context-packet";
import type {
  NativeHostApprovalDecisionV01,
  NativeHostApprovalRequestV01,
} from "@/types/vnext/native-host-adapter";

export const MAX_NATIVE_HOST_APPROVAL_RESIDUE_V01 = 32;

export class NativeHostApprovalResidueErrorV01 extends Error {
  constructor(readonly code: string) {
    super(code);
    this.name = "NativeHostApprovalResidueErrorV01";
  }
}

export function readNativeHostApprovalRequestResidueV01(
  value: unknown,
): NativeHostApprovalRequestV01[] {
  if (value === undefined || value === null) return [];
  if (
    !Array.isArray(value) ||
    value.length > MAX_NATIVE_HOST_APPROVAL_RESIDUE_V01 ||
    value.some((entry) => !isApprovalRequestV01(entry))
  ) {
    throw new NativeHostApprovalResidueErrorV01(
      "native_host_approval_request_residue_invalid",
    );
  }
  return value.map((entry) => structuredClone(entry));
}

export function readNativeHostApprovalDecisionResidueV01(
  value: unknown,
): NativeHostApprovalDecisionV01[] {
  if (value === undefined || value === null) return [];
  if (
    !Array.isArray(value) ||
    value.length > MAX_NATIVE_HOST_APPROVAL_RESIDUE_V01 ||
    value.some((entry) => !isApprovalDecisionV01(entry))
  ) {
    throw new NativeHostApprovalResidueErrorV01(
      "native_host_approval_decision_residue_invalid",
    );
  }
  return value.map((entry) => structuredClone(entry));
}

export function appendNativeHostApprovalRequestResidueV01(
  value: unknown,
  request: NativeHostApprovalRequestV01,
): NativeHostApprovalRequestV01[] {
  if (!isApprovalRequestV01(request)) {
    throw new NativeHostApprovalResidueErrorV01(
      "native_host_approval_request_residue_invalid",
    );
  }
  const existing = readNativeHostApprovalRequestResidueV01(value);
  const prior = existing.find(
    (entry) => entry.approval_id === request.approval_id,
  );
  if (prior) {
    if (
      canonicalizeProtocolValueV01(prior) !==
      canonicalizeProtocolValueV01(request)
    ) {
      throw new NativeHostApprovalResidueErrorV01(
        "native_host_approval_request_residue_conflict",
      );
    }
    return existing;
  }
  if (existing.length >= MAX_NATIVE_HOST_APPROVAL_RESIDUE_V01) {
    throw new NativeHostApprovalResidueErrorV01(
      "native_host_approval_request_residue_bound_exceeded",
    );
  }
  return [...existing, structuredClone(request)];
}

export function appendNativeHostApprovalDecisionResidueV01(
  value: unknown,
  decision: NativeHostApprovalDecisionV01,
): NativeHostApprovalDecisionV01[] {
  if (!isApprovalDecisionV01(decision)) {
    throw new NativeHostApprovalResidueErrorV01(
      "native_host_approval_decision_residue_invalid",
    );
  }
  const existing = readNativeHostApprovalDecisionResidueV01(value);
  const prior = existing.find(
    (entry) => entry.approval_id === decision.approval_id,
  );
  if (prior) {
    if (
      canonicalizeProtocolValueV01(prior) !==
      canonicalizeProtocolValueV01(decision)
    ) {
      throw new NativeHostApprovalResidueErrorV01(
        "native_host_approval_decision_residue_conflict",
      );
    }
    return existing;
  }
  if (existing.length >= MAX_NATIVE_HOST_APPROVAL_RESIDUE_V01) {
    throw new NativeHostApprovalResidueErrorV01(
      "native_host_approval_decision_residue_bound_exceeded",
    );
  }
  return [...existing, structuredClone(decision)];
}

function isApprovalRequestV01(
  value: unknown,
): value is NativeHostApprovalRequestV01 {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const candidate = value as Partial<NativeHostApprovalRequestV01>;
  return Boolean(
    candidate.approval_version === "native_host_approval.v0.1" &&
      typeof candidate.approval_id === "string" &&
      typeof candidate.idempotency_fingerprint === "string" &&
      /^sha256:[a-f0-9]{64}$/u.test(candidate.idempotency_fingerprint) &&
      typeof candidate.workspace_id === "string" &&
      typeof candidate.project_id === "string" &&
      typeof candidate.run_id === "string" &&
      typeof candidate.packet_id === "string" &&
      typeof candidate.packet_fingerprint === "string" &&
      typeof candidate.operation_class === "string" &&
      Array.isArray(candidate.repository_relative_paths) &&
      Array.isArray(candidate.network_resources) &&
      Array.isArray(candidate.available_decisions) &&
      typeof candidate.resource_summary === "string" &&
      typeof candidate.public_reason === "string" &&
      typeof candidate.public_risk_summary === "string" &&
      typeof candidate.issued_at === "string" &&
      (candidate.expires_at === null ||
        typeof candidate.expires_at === "string") &&
      [
        candidate.host_thread_ref,
        candidate.host_turn_ref,
        candidate.host_item_ref,
        candidate.host_request_ref,
      ].every((ref) => validateExternalRefV01(ref).status === "valid")
  );
}

function isApprovalDecisionV01(
  value: unknown,
): value is NativeHostApprovalDecisionV01 {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const candidate = value as Partial<NativeHostApprovalDecisionV01>;
  return Boolean(
    typeof candidate.approval_id === "string" &&
      typeof candidate.idempotency_fingerprint === "string" &&
      /^sha256:[a-f0-9]{64}$/u.test(candidate.idempotency_fingerprint) &&
      ["approve_once", "decline", "cancel_run"].includes(
        candidate.decision ?? "",
      ) &&
      [
        "explicit_local_operator",
        "bounded_capability_grant",
        "run_cancellation",
      ].includes(candidate.decision_source ?? "") &&
      typeof candidate.decided_at === "string" &&
      Number.isSafeInteger(candidate.control_revision) &&
      (candidate.control_revision ?? -1) >= 0
  );
}
