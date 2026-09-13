import { createHmac, randomBytes } from "node:crypto";
import { realpathSync, statSync } from "node:fs";
import path from "node:path";
import { StringDecoder } from "node:string_decoder";

// Test evidence only: no raw output, response bodies, messages or credentials.
// The supervisor's optional forwarding can drop bytes. These intervals cannot
// establish completeness or link a server exception causally to a CDP response.
export const OPERATOR_FAILURE_SNAPSHOT_LIMITS_V1 = Object.freeze({
  input_bytes: 128 * 1024,
  line_characters: 2_048,
  events: 6,
  frames_per_event: 3,
  serialized_bytes: 24 * 1024,
});
const PHASES = new Set([
  "setup", "cleanup", "browser_navigation_diagnostics",
  "project_controls_and_automation", "operator_session_bootstrap",
  "strategic_analysis_and_proposal_review", "result_review_and_inspector",
  "review_decision_and_transition", "operator_session_refusal_recovery",
  "first_work_definition_and_start", "direct_native_host_round_trip",
  "work_expectation_recording",
  "live_native_host_approval_lifecycle", "executed_reviewed_follow_up",
  "bounded_automation_execution", "multi_candidate_session_and_scope",
  "multi_candidate_guidebrief_read_only", "multi_candidate_decisions_and_preview",
  "multi_candidate_transition_application", "multi_candidate_return_and_handoff",
  "project_connection", "first_work_definition", "explicit_deterministic_start_to_result",
  "proposal_visible_for_review",
]);
const ROUTES = new Set([
  "workbench_result", "semantic_review", "workbench_inspector", "project",
  "runtime_root", "operator_page",
]);
const CATEGORIES = new Set([
  "http_error_document", "document_response_missing", "browser_navigation_failure",
  "expected_selector_missing_on_successful_document", "runtime_start_failure",
]);
const ERROR_CLASSES = new Set([
  "Error", "TypeError", "ReferenceError", "SyntaxError", "RangeError",
  "AggregateError", "URIError", "EvalError",
]);
const ERROR_CODES = new Set([
  "MODULE_NOT_FOUND", "ERR_MODULE_NOT_FOUND", "ERR_REQUIRE_ESM",
  "ERR_PACKAGE_PATH_NOT_EXPORTED", "ERR_INVALID_ARG_TYPE", "ERR_INVALID_ARG_VALUE",
  "ERR_HTTP_HEADERS_SENT", "ENOENT", "EACCES", "EPERM", "EADDRINUSE",
  "ECONNREFUSED", "ECONNRESET", "EPIPE", "ETIMEDOUT",
]);
const SUPERVISOR_VALUES = {
  last_supervisor_result_code: new Set(["none", "started", "ready", "running", "stopped", "failed"]),
  last_public_reason_code: new Set([
    "none", "signal_sigterm", "signal_sigint", "required_child_exit",
    "shutdown_timeout", "owned_cleanup_failed", "runtime_startup_failed",
  ]),
  database_state: new Set(["none", "preparing", "ready", "failed", "recovery_required"]),
  bootstrap_recovery_phase: new Set(["none", "runtime_startup", "database_bootstrap", "recovery_mode"]),
  supervisor_signal: new Set(["SIGTERM", "SIGINT", "SIGKILL"]),
};
const allowed = (set, value) => set.has(value) ? value : null;
const ordinal = (value) => Number.isSafeInteger(value) && value >= 0 ? value : null;
const httpStatus = (value) => Number.isInteger(value) && value >= 100 && value <= 599 ? value : null;
const clone = (value) => JSON.parse(JSON.stringify(value));

export function createOperatorBrowserFailureSnapshotV1({ repository_root }) {
  const key = randomBytes(32);
  const root = realpathSync(repository_root);
  let runtime = null;
  let navigation = null;
  let parser = null;
  let primary = null;
  const captureFailures = new Set();
  const subsequent = { supervisor_shutdown: null, server_output: null, cleanup: null };
  const pseudonym = (value) => {
    if (typeof value !== "string" || value.length === 0 || value.length > 256 || /[\x00-\x20\x7f]/u.test(value)) return null;
    return `local:${createHmac("sha256", key).update(value).digest("hex").slice(0, 24)}`;
  };
  const guard = (stage, callback) => {
    try { return callback(); } catch {
      captureFailures.add(stage);
      return null;
    }
  };
  const supervisor = (read) => guard("supervisor_capture_failed", () => {
    const value = read?.();
    if (!value) return null;
    const result = { unclassifiable_fields: false };
    for (const [field, values] of Object.entries(SUPERVISOR_VALUES)) {
      result[field] = allowed(values, value[field]);
      if (value[field] != null && result[field] === null) result.unclassifiable_fields = true;
    }
    for (const field of ["child_exit_code", "supervisor_exit_code"]) {
      result[field] = Number.isInteger(value[field]) && value[field] >= 0 && value[field] <= 255 ? value[field] : null;
    }
    return result;
  });
  const snapshot = () => primary === null ? null : ({
    snapshot_version: "operator_browser_failure_snapshot.v1",
    primary: clone(primary),
    subsequent: clone(subsequent),
    capture_failures: [...captureFailures],
  });

  return Object.freeze({
    beginRuntime(generation) {
      if (primary) return;
      guard("runtime_capture_failed", () => {
        runtime = {
          generation: ordinal(generation), start_invoked_at: new Date().toISOString(),
          start_mode: "source_next_dev_webpack", generated_build_state: "unavailable",
        };
        navigation = null;
        parser = createServerInterval(root, pseudonym);
      });
    },
    append(generation, channel, chunk) {
      if (subsequent.server_output || generation !== runtime?.generation) return;
      guard("server_capture_failed", () => parser?.append(channel, chunk));
    },
    beginNavigation({ epoch, phase, route, runtime_origin }) {
      if (primary) return;
      guard("navigation_capture_failed", () => {
        // Discard earlier intervals, including a partial line spanning navigation.
        parser?.nextInterval();
        navigation = {
          epoch: ordinal(epoch), phase: allowed(PHASES, phase), route: allowed(ROUTES, route),
          started_at: new Date().toISOString(),
          runtime_origin: runtime_origin === true,
          expected: { frame_id: null, loader_id: null },
          document: null, correlation: "unavailable",
        };
      });
    },
    document({ frame_id, loader_id, response = null, request = null }) {
      if (primary) return;
      guard("navigation_capture_failed", () => {
        if (!navigation) return;
        navigation.expected = { frame_id: pseudonym(frame_id), loader_id: pseudonym(loader_id) };
        const matches = (value) => value?.type === "Document" &&
          value.navigation_epoch === navigation.epoch && value.phase === navigation.phase &&
          typeof frame_id === "string" && frame_id.length > 0 &&
          typeof loader_id === "string" && loader_id.length > 0 &&
          value.frame_id === frame_id && value.loader_id === loader_id;
        if (!matches(response)) return;
        navigation.runtime_origin &&= response.runtime_origin === true;
        const ids = (value) => ({ request_id: pseudonym(value.request_id), frame_id: pseudonym(value.frame_id), loader_id: pseudonym(value.loader_id) });
        const boundRequest = matches(request) && request.request_id === response.request_id;
        navigation.document = {
          http_status: httpStatus(response.status), response: ids(response),
          request: boundRequest ? ids(request) : null,
        };
        navigation.document.identifiers = Object.values(navigation.document.response).every((value) => value !== null)
          ? "available_local_pseudonyms" : "partially_unavailable_or_redacted";
        navigation.correlation = boundRequest ? "request_response_and_navigation" : "response_and_navigation_request_unavailable";
      });
    },
    capture({ phase, diagnostic, readSupervisor }) {
      if (primary) return snapshot();
      const server = guard("server_capture_failed", () => parser?.finish()) ?? null;
      // Freeze the first failure before shutdown changes the public supervisor
      // result or cleanup clears the existing credential-audit runtime buffer.
      primary = {
        phase: allowed(PHASES, phase),
        failure: {
          category: allowed(CATEGORIES, diagnostic?.category),
          route: allowed(ROUTES, diagnostic?.route),
          http_status: httpStatus(diagnostic?.http_status),
        },
        runtime: runtime ? { ...runtime, captured_at: new Date().toISOString() } : null,
        navigation: clone(navigation),
        server: {
          association: navigation?.runtime_origin === true
            ? "runtime_navigation_capture_interval_only"
            : navigation ? "unavailable_foreign_or_non_http_origin" : "runtime_start_capture_interval_only",
          direct_request_correlation: "unavailable",
          upstream_delivery: "completeness_unavailable",
          evidence: navigation && !navigation.runtime_origin ? null : server,
        },
        supervisor_at_failure: supervisor(readSupervisor),
      };
      // Later forwarded output may supplement the frozen failure, but occupies
      // a separate bounded interval and never becomes its asserted cause.
      parser?.nextInterval();
      return snapshot();
    },
    shutdown(generation, readSupervisor) {
      if (!primary || generation !== primary.runtime?.generation) return;
      subsequent.supervisor_shutdown ??= supervisor(readSupervisor);
      subsequent.server_output ??= {
        association: "same_runtime_after_failure_capture_only",
        direct_request_correlation: "unavailable",
        evidence: guard("server_capture_failed", () => parser?.finish()) ?? null,
      };
    },
    cleanup(observation) {
      if (!primary) return;
      // Only actual lifecycle observations qualify; absent telemetry stays null.
      subsequent.cleanup = {
        runtime_shutdown_complete: typeof observation?.runtime_shutdown_complete === "boolean" ? observation.runtime_shutdown_complete : null,
        chrome_cdp_shutdown_complete: typeof observation?.chrome_cdp_shutdown_complete === "boolean" ? observation.chrome_cdp_shutdown_complete : null,
        owned_process_residue_count: ordinal(observation?.owned_process_residue_count),
        listener_residue_count: ordinal(observation?.listener_residue_count),
      };
    },
    snapshot,
  });
}

function createServerInterval(root, pseudonym) {
  const limits = OPERATOR_FAILURE_SNAPSHOT_LIMITS_V1;
  let inputBytes = 0;
  let events = [];
  let flags;
  const channels = new Map(["stdout", "stderr"].map((name) => [name, {
    decoder: new StringDecoder("utf8"), line: "", dropping: false, event: null,
  }]));
  const reset = () => {
    inputBytes = 0;
    events = [];
    flags = { input_truncated: false, line_truncated: false, events_truncated: false, frames_truncated: false, partial_line_unavailable: false, frames_redacted: false, unclassifiable_error: false, prior_interval_excluded: false };
  };
  reset();
  const accept = (channel, text) => {
    // Only the fixed supervisor role prefix and terminal color escapes are
    // removed. Messages and arbitrary supervisor JSON never enter the result.
    const line = text.replace(/\u001b\[[0-9;]*m/gu, "").replace(/\[augnes:(?:ui|bridge)\] /gu, "").trim();
    const error = /^(?:[⨯×]\s*)?\[?([A-Za-z_$][A-Za-z0-9_$]{0,63})(?: \[([A-Z_]{1,64})\])?:/u.exec(line);
    if (error && (error[1] === "Error" || error[1].endsWith("Error"))) {
      channel.event = null;
      if (events.length === limits.events) { flags.events_truncated = true; return; }
      const errorClass = allowed(ERROR_CLASSES, error[1]);
      const code = allowed(ERROR_CODES, error[2]);
      if (!errorClass || (error[2] && !code)) flags.unclassifiable_error = true;
      const event = { error_class: errorClass, error_code: code, digest: null, frames: [] };
      events.push(event);
      channel.event = event;
      return;
    }
    if (!channel.event) return;
    const code = /^code:\s*['"]([A-Z_]{1,64})['"],?$/u.exec(line);
    if (code) {
      channel.event.error_code = allowed(ERROR_CODES, code[1]);
      if (!channel.event.error_code) flags.unclassifiable_error = true;
      return;
    }
    const digest = /^digest:\s*['"]([^'"\s]{1,256})['"],?$/u.exec(line);
    if (digest) { channel.event.digest = pseudonym(digest[1]); return; }
    if (line.startsWith("at ")) {
      if (channel.event.frames.length === limits.frames_per_event) { flags.frames_truncated = true; return; }
      const frame = normalizeFrame(root, line);
      if (!frame) { flags.frames_redacted = true; return; }
      channel.event.frames.push(frame);
      return;
    }
    if (line && line !== "{" && line !== "}") channel.event = null;
  };
  return {
    nextInterval() {
      const excluded = inputBytes > 0;
      reset();
      flags.prior_interval_excluded = excluded;
      for (const channel of channels.values()) {
        channel.dropping ||= channel.line.length > 0 || channel.decoder.lastNeed > 0;
        channel.line = "";
        channel.event = null;
        channel.decoder = new StringDecoder("utf8");
      }
    },
    append(name, chunk) {
      const channel = channels.get(name);
      if (!channel || (!Buffer.isBuffer(chunk) && typeof chunk !== "string")) return;
      const remaining = limits.input_bytes - inputBytes;
      // Slice before conversion/allocation, including for a single huge chunk.
      const bounded = typeof chunk === "string" ? Buffer.from(chunk.slice(0, remaining)) : chunk.subarray(0, remaining);
      const bytes = bounded.subarray(0, remaining);
      if (chunk.length > bytes.length || bounded.length > remaining) flags.input_truncated = true;
      inputBytes += bytes.length;
      for (const character of channel.decoder.write(bytes)) {
        if (character === "\n") {
          if (!channel.dropping) accept(channel, channel.line);
          channel.line = "";
          channel.dropping = false;
        } else if (!channel.dropping) {
          if (channel.line.length === limits.line_characters) {
            flags.line_truncated = true;
            channel.dropping = true;
            channel.line = "";
            channel.event = null;
          } else channel.line += character;
        }
      }
    },
    finish() {
      for (const channel of channels.values()) {
        if (channel.line || channel.dropping || channel.decoder.lastNeed > 0) flags.partial_line_unavailable = true;
        // A partial line is not an independently valid error record.
        channel.dropping ||= channel.line.length > 0 || channel.decoder.lastNeed > 0;
        channel.line = "";
        channel.event = null;
      }
      return {
        availability: events.length ? "classified_or_unclassifiable_events" : "unavailable",
        ambiguous: events.length > 1 || flags.unclassifiable_error,
        input_bytes: inputBytes, ...flags, events,
      };
    },
  };
}

function normalizeFrame(root, line) {
  const match = /\((.*):(\d{1,7}):(\d{1,7})\)$/u.exec(line) ?? /^at (.*):(\d{1,7}):(\d{1,7})$/u.exec(line);
  if (!match) return null;
  let filename = match[1];
  filename = filename.replace(/^webpack-internal:\/\/\/\((?:rsc|ssr|app-pages-browser)\)\//u, "").replace(/^file:\/\//u, "");
  if (filename.length > 400 || /[%?#\\\x00-\x20]/u.test(filename) || filename.split("/").includes("..")) return null;
  try {
    const absolute = realpathSync(path.resolve(root, filename));
    const relative = path.relative(root, absolute);
    if (relative.length > 240 || !/^(?:app|components|lib|scripts|\.next)\/[A-Za-z0-9_./@()[\]-]+\.(?:[cm]?[jt]sx?)$/u.test(relative) || !statSync(absolute).isFile()) return null;
    const lineNumber = Number(match[2]);
    const column = Number(match[3]);
    if (lineNumber === 0 || column === 0) return null;
    return { path: relative, line: lineNumber, column };
  } catch { return null; }
}
