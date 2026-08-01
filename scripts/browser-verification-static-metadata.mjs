import { createHash } from "node:crypto";

const RESULT_DECLARATION = "const result = {";

export function extractBrowserVerificationStaticMetadata(source) {
  if (typeof source !== "string" || source.length === 0) {
    throw new Error("browser verification source must be non-empty");
  }

  const resultStart = source.indexOf(RESULT_DECLARATION);
  const resultEnd = source.indexOf("\n};", resultStart);
  if (resultStart < 0 || resultEnd <= resultStart) {
    throw new Error("browser verification result declaration is missing");
  }

  const declaredResultFields = uniqueInOrder(
    [...source.slice(resultStart, resultEnd).matchAll(/^  ([a-z0-9_]+):/gmu)].map(
      (match) => match[1],
    ),
  );
  const directlyReferencedResultFields = uniqueInOrder(
    [...source.matchAll(/^\s*result\.([a-z0-9_]+)\b/gmu)].map(
      (match) => match[1],
    ),
  );
  const outputResultFields = uniqueInOrder([
    ...declaredResultFields,
    ...directlyReferencedResultFields,
  ]);
  const dynamicallyDeclaredResultFields = outputResultFields.filter(
    (field) => !declaredResultFields.includes(field),
  );

  const scopeMatch = source.match(
    /assert\(\s*\[([^\]]+)\]\.includes\(VALIDATION_SCOPE\)/u,
  );
  if (!scopeMatch) {
    throw new Error("browser verification scope declaration is missing");
  }
  const scopes = [...scopeMatch[1].matchAll(/"([a-z0-9_-]+)"/gu)].map(
    (match) => match[1],
  );

  const phaseIds = uniqueInOrder(
    [...source.matchAll(/runPhase\(\s*"([^"]+)"/gu)].map(
      (match) => match[1],
    ),
  );
  const recordMarkers = [...source.matchAll(/record\("([^"]+)"\)/gu)].map(
    (match) => match[1],
  );
  const timingStartKinds = uniqueInOrder(
    [...source.matchAll(/timing\.start\(\s*"([^"]+)"/gu)].map(
      (match) => match[1],
    ),
  );
  const directTimingDurationKinds = uniqueInOrder(
    [...source.matchAll(/timing\.duration\(\s*"([^"]+)"/gu)].map(
      (match) => match[1],
    ),
  );
  const longWaitTimingKinds = uniqueInOrder(
    [...source.matchAll(/recordLongWait\(\s*"([^"]+)"/gu)].map(
      (match) => match[1],
    ),
  );
  const timingKinds = uniqueInOrder([
    ...timingStartKinds,
    ...directTimingDurationKinds,
    ...longWaitTimingKinds,
  ]);
  const timingMilestones = [
    ...source.matchAll(/timing\.milestone\(\s*"([^"]+)"/gu),
  ].map((match) => match[1]);
  const assertionCallCount = [
    ...source.matchAll(/\bassert(?:\.[A-Za-z]+)?\s*\(/gu),
  ].length;

  return {
    source_sha256: createHash("sha256").update(source).digest("hex"),
    declared_result_fields: declaredResultFields,
    dynamically_declared_result_fields: dynamicallyDeclaredResultFields,
    output_result_fields: outputResultFields,
    scopes,
    phase_ids: phaseIds,
    record_markers: recordMarkers,
    timing_kinds: timingKinds,
    timing_milestones: timingMilestones,
    assertion_call_count: assertionCallCount,
  };
}

export function hashStringInventory(values) {
  return createHash("sha256")
    .update(JSON.stringify([...values].sort(compareCodeUnits)))
    .digest("hex");
}

function uniqueInOrder(values) {
  return [...new Set(values)];
}

function compareCodeUnits(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}
