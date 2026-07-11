import {
  normalizeProtocolTextV01,
  parseStrictIsoTimestampV01,
} from "@/lib/vnext/protocol-primitives";

export interface VNextLocalRuntimeClockV01 {
  now(): string;
}

export const VNEXT_LOCAL_RUNTIME_SYSTEM_CLOCK_V01: VNextLocalRuntimeClockV01 =
  Object.freeze({
    now: () => new Date().toISOString(),
  });

export function readVNextLocalRuntimeClockNowV01(
  clock: VNextLocalRuntimeClockV01 | undefined,
  field: string,
): string {
  const value = normalizeProtocolTextV01(
    (clock ?? VNEXT_LOCAL_RUNTIME_SYSTEM_CLOCK_V01).now(),
  );
  if (!value || parseStrictIsoTimestampV01(value) === null) {
    throw new Error(`${field}_clock_timestamp_invalid`);
  }
  return value;
}
