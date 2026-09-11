import { appendFileSync, writeFileSync } from "node:fs";
import path from "node:path";

import {
  createCodexAppServerAdapterV01,
  type CodexAppServerAdapterObservationV01,
  type CodexAppServerAdapterOptionsV01,
} from "../lib/vnext/native-host/codex-app-server-adapter";

const MAX_OBSERVATIONS = 64;
const MAX_OBSERVATION_BYTES = 16_384;

// The P5.1 disposable operator's event('adapter', { stage, ...observation })
// JSONL consumer, factored into a reviewable finite recorder. This factory
// only connects observation: invoke/admission, authority and shutdown still
// belong to the adapter/service caller. Never import or rewrite an old attempt.
export function createRecordedCodexAppServerAdapterV01(input: {
  directory: string;
  stage: 1 | 2;
  adapter_options?: CodexAppServerAdapterOptionsV01;
}) {
  const eventsPath = path.join(input.directory, "events.jsonl");
  const statusPath = path.join(input.directory, "adapter-capture-status.json");
  let closed = false;
  let observationsWritten = 0;
  let diagnosticWritten = false;
  let admissionDiagnosticWritten = false;
  let captureFailure: "artifact_create_failed" | "artifact_write_failed" | "observation_limit" | "observation_too_large" | "capture_closed" | null = null;
  let statusWriteFailed = false;
  try { writeFileSync(eventsPath, "", { flag: "wx", mode: 0o600 }); }
  catch { captureFailure = "artifact_create_failed"; }

  function capture(observation: CodexAppServerAdapterObservationV01): void {
    if (captureFailure) return;
    if (closed) { captureFailure = "capture_closed"; return; }
    if (observationsWritten >= MAX_OBSERVATIONS) { captureFailure = "observation_limit"; return; }
    try {
      const line = JSON.stringify({ at: new Date().toISOString(), category: "adapter", stage: input.stage, ...observation }) + "\n";
      if (Buffer.byteLength(line) > MAX_OBSERVATION_BYTES) { captureFailure = "observation_too_large"; return; }
      appendFileSync(eventsPath, line, { mode: 0o600 });
      observationsWritten++;
      diagnosticWritten ||= observation.failed_terminal_diagnostic !== undefined;
      admissionDiagnosticWritten ||= observation.result_admission_diagnostic !== undefined;
    } catch { captureFailure = "artifact_write_failed"; }
  }
  function readCaptureStatus() {
    return {
      closed, observations_written: observationsWritten,
      failed_terminal_diagnostic_written: diagnosticWritten,
      result_admission_diagnostic_written: admissionDiagnosticWritten,
      capture_failure: captureFailure, status_write_failed: statusWriteFailed,
      // Closing a recorder says nothing about host settlement or remote usage.
    };
  }
  return {
    adapter: createCodexAppServerAdapterV01({
      ...input.adapter_options,
      observe(observation) {
        capture(observation);
        // Preserve existing observer error/control policy. Only recorder I/O
        // failures are contained; never swallow the operator's own callback.
        input.adapter_options?.observe?.(observation);
      },
    }),
    readCaptureStatus,
    closeCapture() {
      if (!closed) {
        closed = true;
        try { writeFileSync(statusPath, JSON.stringify(readCaptureStatus()) + "\n", { flag: "wx", mode: 0o600 }); }
        catch { statusWriteFailed = true; }
      }
      return readCaptureStatus();
    },
  };
}
