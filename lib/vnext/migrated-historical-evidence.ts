export const MIGRATED_HISTORICAL_EVIDENCE_PREFIX_V01 =
  ".augnes-history/perspective-lab-cutover/historical-evidence/" as const;

export type ArtifactEvidenceReadScopeV01 =
  | "active"
  | "migrated_historical";

export function projectArtifactEvidenceReadPathV01(input: {
  relative_path: string;
  active_prefix: string;
  read_scope?: ArtifactEvidenceReadScopeV01;
}): string | null {
  if (input.read_scope !== "migrated_historical") {
    if (!input.relative_path.startsWith(input.active_prefix)) return null;
    return input.relative_path;
  }
  const migratedPrefix =
    `${MIGRATED_HISTORICAL_EVIDENCE_PREFIX_V01}${input.active_prefix}`;
  if (!input.relative_path.startsWith(migratedPrefix)) return null;
  return input.relative_path.slice(
    MIGRATED_HISTORICAL_EVIDENCE_PREFIX_V01.length,
  );
}
