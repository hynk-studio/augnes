import path from "node:path";
import { observeInputFile, digest, classifyInputChange, nonFaultInputChange } from "./local-canonical-inputs.mjs";

export const BROWSER_IDENTITY_CONTRACT = "augnes.local-canonical-browser-use.v2";
export const BROWSER_IDENTITY_PREFIX = "[local-canonical-browser-use] ";
const role = Object.freeze({ classification: "execution", readOnlyExecutable: true });
const versionPattern = /^[A-Za-z][A-Za-z0-9 ._/-]{1,127}$/u;

// Actual launch counts in the accepted Mac workload, including nested children.
// This is evidence coverage, not a new phase, launch owner or test allowance.
const consumers = Object.freeze({
  integration: { "durable-work-surface": 3, "cumulative-work-surface": 2 },
  "e2e-project-experience": { "project-experience": 1, "project-client": 2, "web-planning": 1 },
  "e2e-operator-review-control": { "operator-review-control": 5 },
  "e2e-operator-native-host-execution": { "operator-native-host-execution": 1 },
  "e2e-operator-work-expectation": { "operator-work-expectation": 1 },
  "e2e-operator-multi-candidate": { "operator-multi-candidate": 1 },
  "e2e-continuity": { continuity: 1 },
  "e2e-golden": { "cross-boundary-golden": 1 },
  "e2e-operator-execution": { "operator-review-control": 5, "operator-native-host-execution": 1, "operator-work-expectation": 1, "operator-multi-candidate": 1 },
});
export const browserConsumersForPhase = id => ({ ...(consumers[id] ?? {}) });
export const MAX_BROWSER_USE_RECORDS = 8;

// Called at the actual launch site. The existing process owner still launches,
// supervises and settles the child. No availability probe invents use evidence.
export function beginBrowserUse(executable, { consumer = "unspecified", emit = record => process.stdout.write(`${BROWSER_IDENTITY_PREFIX}${JSON.stringify(record)}\n`) } = {}) {
  const before = observeInputFile(executable, { readOnlyExecutable: true });
  if (!before.present) throw new Error("browser_identity_missing");
  if (!/^[a-z][a-z0-9-]{0,79}$/u.test(consumer)) throw new Error("browser_consumer_invalid");
  const versions = { http: null, cdp: null };
  let completed = false;
  return {
    version(value, source = "http") {
      if (!Object.hasOwn(versions, source) || typeof value !== "string" || !versionPattern.test(value) || (versions[source] !== null && versions[source] !== value)) throw new Error("browser_version_invalid");
      versions[source] = value;
    },
    finish() {
      if (completed) return;
      completed = true;
      let after;
      try { after = observeInputFile(executable, { readOnlyExecutable: true }); } catch { after = { observation: "failed" }; }
      const disposition = after.present === true ? classifyInputChange(before, after, role) : "observer_failure";
      const record = { contract: BROWSER_IDENTITY_CONTRACT, consumer, executable_name: path.basename(executable),
        location_fingerprint: digest(executable), before, after, actual_version: versions.http,
        runtime_versions: { ...versions }, disposition, unchanged: nonFaultInputChange(disposition) };
      emit(record);
      // Never interrupt remaining Browser/runtime cleanup with an evidence error.
      return record;
    },
  };
}

export function validBrowserUse(record, expected = null) {
  if (record?.contract !== BROWSER_IDENTITY_CONTRACT || record.unchanged !== true ||
      !/^[a-z][a-z0-9-]{0,79}$/u.test(record.consumer ?? "") || record.consumer === "unspecified" ||
      record.before?.present !== true || record.after?.present !== true ||
      !/^[0-9a-f]{64}$/u.test(record.before.sha256 ?? "") ||
      !versionPattern.test(record.actual_version ?? "") ||
      record.runtime_versions?.http !== record.actual_version || record.runtime_versions?.cdp !== record.actual_version ||
      !/^[0-9a-f]{64}$/u.test(record.location_fingerprint ?? "")) return false;
  const disposition = classifyInputChange(record.before, record.after, role);
  return nonFaultInputChange(disposition) && disposition === record.disposition &&
    (!expected || (expected.before?.present === true && record.location_fingerprint === expected.location_fingerprint &&
      nonFaultInputChange(classifyInputChange(expected.before, record.before, role)) &&
      (!expected.actual_version || record.actual_version === expected.actual_version)));
}

export function validPhaseBrowserUse(phase, records, expected) {
  const required = browserConsumersForPhase(phase.id);
  if (!Array.isArray(records) || records.length > MAX_BROWSER_USE_RECORDS ||
      (phase.browser && Object.keys(required).length === 0) ||
      records.length !== Object.values(required).reduce((a, b) => a + b, 0)) return false;
  if (records.length && !expected) return false;
  return records.every(record => validBrowserUse(record, expected) && Object.hasOwn(required, record.consumer)) &&
    Object.entries(required).every(([consumer, count]) => records.filter(r => r.consumer === consumer).length === count) &&
    new Set(records.map(r => r.actual_version)).size <= 1;
}

// Wrappers forward only already emitted structured records, never manufacture
// missing records for a failed-before-launch or NOT_RUN path.
export function parseBrowserUseLine(line) {
  if (!line.startsWith(BROWSER_IDENTITY_PREFIX)) return null;
  try { return JSON.parse(line.slice(BROWSER_IDENTITY_PREFIX.length)); }
  catch { return { invalid: true }; }
}
