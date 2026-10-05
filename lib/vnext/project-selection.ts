/** Historical records may contain the original numeric observation. New live
 * selections use opaque durable revisions, including the cleared selection.
 * Numeric observations remain historical data, never current write authority. */
export type ProjectSelectionRevision = number | string;

export function isCurrentProjectSelectionRevision(value: unknown): value is string {
  return typeof value === "string" && /^selection:[0-9a-f]{32}$/u.test(value);
}

export function isHistoricalProjectSelectionRevision(value: unknown, minimum = 1): value is ProjectSelectionRevision {
  return isCurrentProjectSelectionRevision(value) ||
    typeof value === "number" && Number.isSafeInteger(value) && value >= minimum;
}
