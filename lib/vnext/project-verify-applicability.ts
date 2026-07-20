import {
  canonicalizeProtocolValueV01,
  parseStrictIsoTimestampV01,
} from "@/lib/vnext/protocol-primitives";
import type { ClaimApplicabilityScopeV01 } from "@/types/vnext/project-verify-material";
import type {
  ProjectVerifyApplicabilityComparisonBasisV01,
  ProjectVerifyApplicabilityComparisonStatusV01,
  ProjectVerifyApplicabilityComparisonV01,
} from "@/types/vnext/project-verify-reconciliation";

type TemporalScopeV01 = ClaimApplicabilityScopeV01["temporal_scope"];

/**
 * Compares only applicability environment, condition, and temporal material.
 * The caller must first prove exact subject identity. In particular, this
 * helper never reads proposition text and never infers scope from prose.
 */
export function compareProjectVerifyApplicabilityScopesV01(
  left: ClaimApplicabilityScopeV01,
  right: ClaimApplicabilityScopeV01,
): ProjectVerifyApplicabilityComparisonV01 {
  if (
    (left.condition.kind === "constant" &&
      left.condition.value === "not_applicable") ||
    (right.condition.kind === "constant" &&
      right.condition.value === "not_applicable")
  ) {
    return resultV01(left, right, "not_applicable", "constant_not_applicable");
  }

  if (left.scope_fingerprint === right.scope_fingerprint) {
    return resultV01(left, right, "overlap", "exact_scope_fingerprint");
  }

  if (!canonicalEqualV01(left.environment_refs, right.environment_refs)) {
    return resultV01(left, right, "unknown", "environment_identity_unknown");
  }

  if (!conditionsExactlyCompatibleV01(left.condition, right.condition)) {
    return resultV01(left, right, "unknown", "condition_identity_unknown");
  }

  const temporal = compareTemporalScopesV01(
    left.temporal_scope,
    right.temporal_scope,
  );
  return resultV01(left, right, temporal.status, temporal.basis);
}

function conditionsExactlyCompatibleV01(
  left: ClaimApplicabilityScopeV01["condition"],
  right: ClaimApplicabilityScopeV01["condition"],
): boolean {
  if (left.kind !== right.kind) return false;
  if (left.value !== right.value) return false;
  return canonicalEqualV01(left.context_refs, right.context_refs);
}

function compareTemporalScopesV01(
  left: TemporalScopeV01,
  right: TemporalScopeV01,
): {
  status: ProjectVerifyApplicabilityComparisonStatusV01;
  basis: ProjectVerifyApplicabilityComparisonBasisV01;
} {
  if (!validTemporalScopeV01(left) || !validTemporalScopeV01(right)) {
    return { status: "unknown", basis: "temporal_scope_invalid" };
  }
  if (left.kind === "unbounded" || right.kind === "unbounded") {
    return { status: "overlap", basis: "unbounded_temporal_scope" };
  }

  const leftStart = timestampValueV01(
    left.valid_from,
    Number.NEGATIVE_INFINITY,
  );
  const rightStart = timestampValueV01(
    right.valid_from,
    Number.NEGATIVE_INFINITY,
  );
  const leftEnd = timestampValueV01(left.valid_until, Number.POSITIVE_INFINITY);
  const rightEnd = timestampValueV01(
    right.valid_until,
    Number.POSITIVE_INFINITY,
  );
  const latestStart = Math.max(leftStart, rightStart);
  const earliestEnd = Math.min(leftEnd, rightEnd);

  if (latestStart < earliestEnd) {
    return { status: "overlap", basis: "interval_overlap" };
  }
  if (latestStart > earliestEnd) {
    return { status: "disjoint", basis: "interval_disjoint" };
  }
  return { status: "unknown", basis: "touching_interval_endpoint" };
}

function validTemporalScopeV01(scope: TemporalScopeV01): boolean {
  if (scope.kind === "unbounded") {
    return scope.valid_from === null && scope.valid_until === null;
  }
  if (scope.valid_from === null && scope.valid_until === null) return false;
  const from = timestampValueOrNullV01(scope.valid_from);
  const until = timestampValueOrNullV01(scope.valid_until);
  if (scope.valid_from !== null && from === null) return false;
  if (scope.valid_until !== null && until === null) return false;
  return from === null || until === null || from < until;
}

function timestampValueOrNullV01(value: string | null): number | null {
  if (value === null) return null;
  return parseStrictIsoTimestampV01(value);
}

function timestampValueV01(value: string | null, fallback: number): number {
  if (value === null) return fallback;
  return parseStrictIsoTimestampV01(value) ?? Number.NaN;
}

function canonicalEqualV01(left: unknown, right: unknown): boolean {
  return (
    canonicalizeProtocolValueV01(left) === canonicalizeProtocolValueV01(right)
  );
}

function resultV01(
  left: ClaimApplicabilityScopeV01,
  right: ClaimApplicabilityScopeV01,
  status: ProjectVerifyApplicabilityComparisonStatusV01,
  basis: ProjectVerifyApplicabilityComparisonBasisV01,
): ProjectVerifyApplicabilityComparisonV01 {
  return {
    status,
    basis,
    left_scope_fingerprint: left.scope_fingerprint,
    right_scope_fingerprint: right.scope_fingerprint,
    subjects_compared: false,
    caller_must_prove_exact_subject_identity: true,
  };
}
