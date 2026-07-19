import {
  canonicalizeProtocolValueV01,
  createProtocolSha256V01,
  normalizeProtocolTextV01,
} from "@/lib/vnext/protocol-primitives";

const CRITERION_ID_VERSION_V01 = "criterion_identity.v0.1" as const;
const CRITERION_ID_PREFIX_V01 = "criterion:" as const;

export function deriveCriterionIdentityV01(criterion: string): string {
  const normalizedCriterion = normalizeProtocolTextV01(criterion);
  if (!normalizedCriterion) {
    throw new Error("criterion_identity_empty");
  }
  return `${CRITERION_ID_PREFIX_V01}${createProtocolSha256V01(
    canonicalizeProtocolValueV01({
      criterion_identity_version: CRITERION_ID_VERSION_V01,
      criterion: normalizedCriterion,
    }),
  )}`;
}
