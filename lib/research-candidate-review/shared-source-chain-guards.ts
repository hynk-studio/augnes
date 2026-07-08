export const STABLE_FINGERPRINT_ALGORITHM =
  "fnv1a32_canonical_json_v0_1" as const;

export function stableJson(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableJson(item)).join(",")}]`;
  }
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${stableJson(record[key])}`)
    .join(",")}}`;
}

export function fnv1a32(input: string): string {
  let hash = 0x811c9dc5;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

export function fingerprint(
  value: unknown,
  options: { algorithmPrefix?: string } = {},
): string {
  const algorithmPrefix =
    options.algorithmPrefix ?? STABLE_FINGERPRINT_ALGORITHM;
  return `${algorithmPrefix}:${fnv1a32(stableJson(value))}`;
}

export function stripFingerprintPrefix(value: string): string {
  const prefix = `${STABLE_FINGERPRINT_ALGORITHM}:`;
  return value.startsWith(prefix) ? value.slice(prefix.length) : value;
}

export function uniqueStrings(
  values: Array<string | null | undefined>,
): string[] {
  return [
    ...new Set(
      values.filter((value): value is string => Boolean(value?.trim())),
    ),
  ];
}

const FORBIDDEN_RAW_MATERIAL_KEYS = [
  "raw",
  "payload",
  "manual_note",
  "result_report",
  "operator_note",
  "note_text",
  "prompt_text",
  "raw_text",
  "raw_result",
  "result_text",
  "codex_result_text",
  "secret",
  "token",
  "credential",
  "api_key",
  "authorization",
  "cookie",
  "url",
  "uri",
  "env",
  "environment",
  "provider_payload",
  "callback_url",
  "environment_variable",
  "password",
] as const;

export function findForbiddenRawMaterialFields(
  value: unknown,
  options: { allowFingerprintKeys?: boolean } = {},
): string[] {
  const forbiddenFields: string[] = [];
  collectForbiddenRawMaterialFields(
    value,
    [],
    forbiddenFields,
    options.allowFingerprintKeys ?? true,
  );
  return uniqueStrings(forbiddenFields).sort();
}

export function containsForbiddenRawMaterial(value: unknown): boolean {
  return findForbiddenRawMaterialFields(value).length > 0;
}

export function isForbiddenRawMaterialKey(key: string): boolean {
  return isForbiddenRawMaterialKeyWithOptions(key, true);
}

function isForbiddenRawMaterialKeyWithOptions(
  key: string,
  allowFingerprintKeys: boolean,
): boolean {
  const normalizedKey = key.toLowerCase();
  if (isAllowedSourceReferenceKey(normalizedKey, allowFingerprintKeys)) {
    return false;
  }
  return FORBIDDEN_RAW_MATERIAL_KEYS.some((forbiddenKey) => {
    if (forbiddenKey === "url" || forbiddenKey === "uri") {
      return (
        normalizedKey === forbiddenKey ||
        normalizedKey.endsWith(`_${forbiddenKey}`) ||
        normalizedKey.includes(`${forbiddenKey}_`)
      );
    }
    if (forbiddenKey === "env") {
      return (
        normalizedKey === "env" ||
        normalizedKey.startsWith("env_") ||
        normalizedKey.endsWith("_env") ||
        normalizedKey.includes("environment")
      );
    }
    if (forbiddenKey === "raw" || forbiddenKey === "payload") {
      return (
        normalizedKey === forbiddenKey ||
        normalizedKey.startsWith(`${forbiddenKey}_`) ||
        normalizedKey.endsWith(`_${forbiddenKey}`) ||
        normalizedKey.includes(`_${forbiddenKey}_`)
      );
    }
    return normalizedKey.includes(forbiddenKey);
  });
}

function collectForbiddenRawMaterialFields(
  value: unknown,
  path: string[],
  forbiddenFields: string[],
  allowFingerprintKeys: boolean,
) {
  if (value === null || typeof value !== "object") return;
  if (Array.isArray(value)) {
    value.forEach((item, index) =>
      collectForbiddenRawMaterialFields(
        item,
        [...path, String(index)],
        forbiddenFields,
        allowFingerprintKeys,
      ),
    );
    return;
  }

  for (const [key, nestedValue] of Object.entries(
    value as Record<string, unknown>,
  )) {
    const normalizedKey = key.toLowerCase();
    const fieldPath = [...path, key].join(".");
    if (
      !(allowFingerprintKeys && normalizedKey.includes("fingerprint")) &&
      isForbiddenRawMaterialKeyWithOptions(key, allowFingerprintKeys)
    ) {
      forbiddenFields.push(fieldPath);
    }
    collectForbiddenRawMaterialFields(
      nestedValue,
      [...path, key],
      forbiddenFields,
      allowFingerprintKeys,
    );
  }
}

function isAllowedSourceReferenceKey(
  normalizedKey: string,
  allowFingerprintKeys: boolean,
): boolean {
  return (
    (allowFingerprintKeys && normalizedKey.includes("fingerprint")) ||
    normalizedKey === "source_ref" ||
    normalizedKey === "source_refs" ||
    normalizedKey.endsWith("_source_ref") ||
    normalizedKey.endsWith("_source_refs") ||
    normalizedKey.endsWith("_ref") ||
    normalizedKey.endsWith("_refs") ||
    normalizedKey.includes("_ref_") ||
    normalizedKey.includes("_refs_")
  );
}

export function allValuesFalse(value: object): boolean {
  return Object.values(value).every((entry) => entry === false);
}

export function listNonFalseKeys(value: object): string[] {
  return Object.entries(value)
    .filter(([, entry]) => entry !== false)
    .map(([key]) => key)
    .sort();
}

export function assertAllFalseBoundary(
  value: object,
  label: string,
): { passed: boolean; failing_keys: string[]; reason?: string } {
  const failingKeys = listNonFalseKeys(value);
  return failingKeys.length === 0
    ? { passed: true, failing_keys: [] }
    : {
        passed: false,
        failing_keys: failingKeys,
        reason: `${label}_not_all_false`,
      };
}

export function requiredStringFieldsPresent(
  record: Record<string, unknown>,
  fields: string[],
): { passed: boolean; missing_fields: string[] } {
  const missingFields = fields.filter((field) => {
    const value = record[field];
    return typeof value !== "string" || value.trim().length === 0;
  });
  return {
    passed: missingFields.length === 0,
    missing_fields: missingFields,
  };
}

export type SourceBindingPair = {
  field: string;
  expected: string | null | undefined;
  actual: string | null | undefined;
  reason: string;
};

export function validateSourceBindingPairs(
  pairs: SourceBindingPair[],
): {
  passed: boolean;
  missing_pairs: SourceBindingPair[];
  mismatched_pairs: SourceBindingPair[];
} {
  const missingPairs = pairs.filter(
    (pair) =>
      !pair.expected?.trim() ||
      !pair.actual?.trim(),
  );
  const mismatchedPairs = pairs.filter(
    (pair) =>
      pair.expected?.trim() &&
      pair.actual?.trim() &&
      pair.expected !== pair.actual,
  );
  return {
    passed: missingPairs.length === 0 && mismatchedPairs.length === 0,
    missing_pairs: missingPairs,
    mismatched_pairs: mismatchedPairs,
  };
}

export function normalizeCount(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    return 0;
  }
  return Math.trunc(value);
}

export function buildRowCountObservations<TableName extends string>(
  tableNames: readonly TableName[],
  beforeCounts: Record<string, unknown> | null | undefined,
  afterCounts: Record<string, unknown> | null | undefined,
): Array<{
  table_name: TableName;
  before_count: number;
  after_count: number;
  delta: number;
  changed: boolean;
}> {
  return tableNames.map((tableName) => {
    const beforeCount = normalizeCount(beforeCounts?.[tableName]);
    const afterCount = normalizeCount(afterCounts?.[tableName]);
    const delta = afterCount - beforeCount;
    return {
      table_name: tableName,
      before_count: beforeCount,
      after_count: afterCount,
      delta,
      changed: delta !== 0,
    };
  });
}

export function summarizeTargetOnlyRowCountWrite({
  targetTable,
  tableNames,
  beforeCounts,
  afterCounts,
  expectedTargetDelta = 1,
}: {
  targetTable: string;
  tableNames: readonly string[];
  beforeCounts: Record<string, unknown>;
  afterCounts: Record<string, unknown>;
  expectedTargetDelta?: number;
}) {
  const rows = buildRowCountObservations(
    uniqueStrings([targetTable, ...tableNames.filter((name) => name !== targetTable)]),
    beforeCounts,
    afterCounts,
  );
  const targetRow = rows[0] ?? {
    table_name: targetTable,
    before_count: 0,
    after_count: 0,
    delta: 0,
    changed: false,
  };
  const nonTargetRows = rows.slice(1);

  return {
    target_table_name: targetTable,
    target_before_count: targetRow.before_count,
    target_after_count: targetRow.after_count,
    target_delta: targetRow.delta,
    target_table_changed: targetRow.changed,
    expected_target_delta: expectedTargetDelta,
    target_delta_matches_expected: targetRow.delta === expectedTargetDelta,
    non_target_table_count: nonTargetRows.length,
    non_target_changed_table_count: nonTargetRows.filter((row) => row.changed)
      .length,
    all_non_target_row_counts_unchanged: nonTargetRows.every(
      (row) => !row.changed && row.delta === 0,
    ),
    rows,
  };
}

export function isTargetOnlyRowCountWrite(summary: {
  target_delta: number;
  target_table_changed: boolean;
  expected_target_delta?: number;
  all_non_target_row_counts_unchanged: boolean;
  non_target_changed_table_count: number;
}, options: { expectedTargetDelta?: number } = {}): boolean {
  const expectedTargetDelta =
    options.expectedTargetDelta ?? summary.expected_target_delta ?? 1;
  const targetTableChangedMatchesExpected =
    expectedTargetDelta === 0
      ? summary.target_table_changed === false
      : summary.target_table_changed === true;
  return (
    summary.target_delta === expectedTargetDelta &&
    targetTableChangedMatchesExpected &&
    summary.all_non_target_row_counts_unchanged === true &&
    summary.non_target_changed_table_count === 0
  );
}

export function buildDeterministicIdempotencyKey({
  kind,
  version,
  source,
}: {
  kind: string;
  version: string;
  source: Record<string, unknown>;
}): string {
  return fingerprint({
    kind,
    version,
    ...source,
  });
}
