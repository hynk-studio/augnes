import {
  canonicalizeProtocolValueV01,
  compareProtocolCanonicalV01,
} from "@/lib/vnext/protocol-primitives";
import {
  canonicalizeRepositoryRelativePathV01,
  externalRefUsesRepositoryRelativePathV01,
} from "@/lib/vnext/repository-relative-path";
import type {
  NativeHostArtifactV01,
  NativeHostChangedFileV01,
  NativeHostObservedCheckV01,
  NativeHostObservedCommandV01,
  NativeHostResultV01,
  NativeHostSkippedCheckV01,
} from "@/types/vnext/native-host-adapter";
import type { ExternalRefV01 } from "@/types/vnext/external-ref";

export class NativeHostResultNormalizationErrorV01 extends Error {
  constructor(readonly code: string) {
    super(code);
    this.name = "NativeHostResultNormalizationErrorV01";
  }
}

export interface NormalizedNativeHostResultResidueV01 {
  result: NativeHostResultV01;
  synthesized_skipped_check_ids: string[];
}

export function normalizeNativeHostResultResidueV01(input: {
  result: NativeHostResultV01;
  required_check_ids: string[];
}): NormalizedNativeHostResultResidueV01 {
  const changedFiles = normalizeIdentityArrayV01(
    input.result.changed_files.map((item) => ({
      ...item,
      repository_relative_path: canonicalizeRepositoryRelativePathV01(
        item.repository_relative_path,
      ),
    })),
    (item) => item.repository_relative_path,
    "native_host_changed_file_conflict",
  );
  const artifacts = normalizeIdentityArrayV01(
    input.result.artifacts.map((artifact) =>
      externalRefUsesRepositoryRelativePathV01(artifact.artifact_ref)
        ? {
            ...artifact,
            artifact_ref: {
              ...artifact.artifact_ref,
              external_id: canonicalizeRepositoryRelativePathV01(
                artifact.artifact_ref.external_id,
              ),
            },
          }
        : artifact,
    ),
    artifactLogicalIdentityV01,
    "native_host_artifact_conflict",
  );
  const commands = normalizeIdentityArrayV01(
    input.result.commands,
    (item) => item.command_id,
    "native_host_command_conflict",
  );
  const checks = normalizeIdentityArrayV01(
    input.result.checks,
    (item) => item.check_id,
    "native_host_check_conflict",
  );
  const skippedChecks = normalizeIdentityArrayV01(
    input.result.skipped_checks,
    (item) => item.check_id,
    "native_host_skipped_check_conflict",
  );
  const checkIds = new Set(checks.map((item) => item.check_id));
  for (const skipped of skippedChecks) {
    if (checkIds.has(skipped.check_id)) {
      throw new NativeHostResultNormalizationErrorV01(
        "native_host_check_result_skip_conflict",
      );
    }
  }
  const accounted = new Set([
    ...checkIds,
    ...skippedChecks.map((item) => item.check_id),
  ]);
  const synthesizedSkippedCheckIds = [...new Set(input.required_check_ids)]
    .filter((checkId) => !accounted.has(checkId))
    .sort();
  const allSkipped = [
    ...skippedChecks,
    ...synthesizedSkippedCheckIds.map(
      (check_id): NativeHostSkippedCheckV01 => ({
        check_id,
        required: true,
        reason:
          "The terminal structured result did not report this required check; it remains unverified.",
      }),
    ),
  ].sort(compareProtocolCanonicalV01);
  const capabilityCoverage = normalizeIdentityArrayV01(
    input.result.capability_coverage,
    (item) => item.capability,
    "native_host_capability_coverage_conflict",
  );
  return {
    result: {
      ...input.result,
      host_refs: uniqueExternalRefsV01(input.result.host_refs),
      changed_files: changedFiles,
      artifacts,
      observed_actions: [...new Set(input.result.observed_actions)].sort(),
      commands,
      checks,
      skipped_checks: allSkipped,
      model_invocation_receipt_refs: uniqueExternalRefsV01(
        input.result.model_invocation_receipt_refs,
      ),
      uncertainty: [...new Set(input.result.uncertainty)].sort(),
      gaps: [...new Set(input.result.gaps)].sort(),
      proposed_next_steps: [
        ...new Set(input.result.proposed_next_steps),
      ].sort(),
      capability_coverage: capabilityCoverage,
    },
    synthesized_skipped_check_ids: synthesizedSkippedCheckIds,
  };
}

function normalizeIdentityArrayV01<T>(
  values: T[],
  identity: (value: T) => string,
  conflictCode: string,
): T[] {
  const normalized = new Map<string, { canonical: string; value: T }>();
  for (const value of values) {
    const key = identity(value);
    const canonical = canonicalizeProtocolValueV01(value);
    const prior = normalized.get(key);
    if (prior && prior.canonical !== canonical) {
      throw new NativeHostResultNormalizationErrorV01(conflictCode);
    }
    if (!prior) normalized.set(key, { canonical, value });
  }
  return [...normalized.values()]
    .map((entry) => entry.value)
    .sort(compareProtocolCanonicalV01);
}

function artifactLogicalIdentityV01(value: NativeHostArtifactV01): string {
  const ref = value.artifact_ref;
  return canonicalizeProtocolValueV01({
    compatibility_namespace: ref.compatibility_namespace ?? null,
    provider: ref.provider ?? null,
    host: ref.host ?? null,
    external_id: ref.external_id,
  });
}

function uniqueExternalRefsV01(values: ExternalRefV01[]): ExternalRefV01[] {
  const byIdentity = new Map<string, ExternalRefV01>();
  for (const value of values) {
    const key = canonicalizeProtocolValueV01(value);
    if (!byIdentity.has(key)) byIdentity.set(key, value);
  }
  return [...byIdentity.values()].sort(compareProtocolCanonicalV01);
}

export type NativeHostNormalizedChangedFileV01 = NativeHostChangedFileV01;
export type NativeHostNormalizedArtifactV01 = NativeHostArtifactV01;
export type NativeHostNormalizedCommandV01 = NativeHostObservedCommandV01;
export type NativeHostNormalizedCheckV01 = NativeHostObservedCheckV01;
