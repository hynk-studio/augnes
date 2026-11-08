/** Provider-neutral reference to a legacy or external identifier. */

export const EXTERNAL_REF_VERSION_V01 = "external_ref.v0.1" as const;

export const EXTERNAL_REF_TRUST_CLASSES_V01 = [
  "direct_local_observation",
  "verified_external_observation",
  "host_attestation",
  "provider_report",
  "user_declaration",
  "imported_unverified",
  "derived_interpretation",
] as const;

export type ExternalRefTrustClassV01 =
  (typeof EXTERNAL_REF_TRUST_CLASSES_V01)[number];

export interface ExternalRefV01 {
  ref_version: typeof EXTERNAL_REF_VERSION_V01;
  ref_type: string;
  external_id: string;
  provider?: string | null;
  host?: string | null;
  observed_at?: string | null;
  source_ref?: string | null;
  compatibility_namespace?: string | null;
  trust_class: ExternalRefTrustClassV01;
}
