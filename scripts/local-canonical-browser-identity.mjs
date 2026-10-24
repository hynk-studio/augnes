import path from "node:path";
import { observeInputFile, digest } from "./local-canonical-inputs.mjs";

export const BROWSER_IDENTITY_CONTRACT = "augnes.local-canonical-browser-use.v1";
export const BROWSER_IDENTITY_PREFIX = "[local-canonical-browser-use] ";

// Called at the actual launch site, not by probing an unused browser process.
export function beginBrowserUse(executable) {
  const before = observeInputFile(executable, { readOnlyExecutable: true });
  if (!before.present) throw new Error("browser_identity_missing");
  let version = null, completed = false;
  return {
    version(value) {
      if (typeof value !== "string" || !/^[A-Za-z][A-Za-z0-9 ._/-]{1,127}$/u.test(value)) throw new Error("browser_version_invalid");
      version = value;
    },
    finish() {
      if (completed) return;
      completed = true;
      let after;
      try { after = observeInputFile(executable, { readOnlyExecutable: true }); } catch { after = { observation: "failed" }; }
      const record = { contract: BROWSER_IDENTITY_CONTRACT, executable_name: path.basename(executable),
        location_fingerprint: digest(executable), before, after, actual_version: version,
        unchanged: JSON.stringify(before) === JSON.stringify(after) };
      process.stdout.write(`${BROWSER_IDENTITY_PREFIX}${JSON.stringify(record)}\n`);
      // Evidence failure is visible to the outer validator. Do not throw here
      // and skip the remaining Browser/runtime cleanup on a failure path.
      return record;
    },
  };
}

export function validBrowserUse(record, expectedLocation = null) {
  return record?.contract === BROWSER_IDENTITY_CONTRACT && record.unchanged === true &&
    record.before?.present === true && /^[0-9a-f]{64}$/u.test(record.before.sha256 ?? "") &&
    JSON.stringify(record.before) === JSON.stringify(record.after) &&
    typeof record.actual_version === "string" && /^[A-Za-z][A-Za-z0-9 ._/-]{1,127}$/u.test(record.actual_version) &&
    /^[0-9a-f]{64}$/u.test(record.location_fingerprint ?? "") &&
    (expectedLocation === null || record.location_fingerprint === expectedLocation);
}
