// Test-owner diagnostics only. The production runner still owns process exit,
// timeout/cancellation and settlement; these controls consume its actual result.
import assert from "node:assert/strict";

export const REVIEW_CHILD_RESULT_PREFIX = "AUGNES_REVIEW_CHILD_RESULT ";
const progressPrefix = "AUGNES_OBSERVER_FIXTURE_PROGRESS ";
const progressStages = new Set([
  "setup_start", "setup_history_complete", "setup_witnesses_complete", "setup_complete",
  "control_complete", "race_start", "race_complete", "stock_start", "stock_complete",
  "cleanup_start", "cleanup_complete",
]);
const nestedControlIds = new Set([
  "observer-regression-before", "observer-regression-after",
  "observer-race-1", "observer-race-2", "observer-stock",
]);
const terminationReasons = new Set([
  "natural_exit", "bounded_timeout", "operator_cancelled",
  "exited_with_owned_descendant_cleanup", "closed_with_owned_descendant_cleanup",
]);
const integer = (value, minimum, maximum) => Number.isSafeInteger(value) && value >= minimum && value <= maximum ? value : null;
const boolean = value => typeof value === "boolean" ? value : null;
const identifier = (value, expression) => typeof value === "string" && expression.test(value) ? value : null;
const projectProgress = progress => progress && progressStages.has(progress.stage) &&
  integer(progress.completed_controls, 0, 59) !== null
  ? { stage: progress.stage, completed_controls: progress.completed_controls } : null;

export function projectReviewChildResult(result, { controlId, progress = null }) {
  return {
    control_id: identifier(controlId, /^[a-z][a-z0-9-]{0,63}$/u) ?? "unclassified-control",
    exit_code: integer(result?.exit_code, -2147483648, 2147483647),
    signal: identifier(result?.signal, /^SIG[A-Z0-9]{1,16}$/u),
    timed_out: boolean(result?.timed_out),
    cancelled: boolean(result?.cancelled),
    spawn_error_code: identifier(result?.spawn_error_code, /^E[A-Z0-9_]{1,31}$/u),
    duration_ms: integer(result?.duration_ms, 0, Number.MAX_SAFE_INTEGER),
    termination_reason: terminationReasons.has(result?.termination_reason) ? result.termination_reason : null,
    exit_observed: boolean(result?.exit_observed),
    streams_closed: boolean(result?.streams_closed),
    cleanup_started: boolean(result?.cleanup_started),
    cleanup_completed: boolean(result?.cleanup_completed),
    remaining_owned_processes: integer(result?.remaining_owned_processes, 0, Number.MAX_SAFE_INTEGER),
    last_progress: projectProgress(progress),
  };
}

// Exit 1 is intentional in before/cosmetic witnesses, so the caller retains
// its existing expected-code assertion. Every ordinary witness must still exit
// naturally; the alias-mutation control explicitly expects cancellation.
export function assertReviewChildLifecycle(result, options) {
  const complete = result?.cleanup_completed === true && result?.cleanup_started === true &&
    result?.exit_observed === true && result?.streams_closed === true && result?.remaining_owned_processes === 0;
  const disposition = options.expectedCancellation === true
    ? result?.cancelled === true && result?.timed_out === false && result?.spawn_error_code === null &&
      result?.termination_reason === "operator_cancelled"
    : result?.timed_out === false && result?.cancelled === false && result?.signal === null &&
      result?.spawn_error_code === null && result?.termination_reason === "natural_exit";
  assert(complete && disposition, JSON.stringify(projectReviewChildResult(result, options)));
}

function projectNestedFixtureChild(value) {
  if (!value || !nestedControlIds.has(value.control_id)) return null;
  const projected = projectReviewChildResult(value, { controlId: value.control_id, progress: value.last_progress });
  const nullable = new Set(["exit_code", "signal", "spawn_error_code"]);
  for (const [key, field] of Object.entries(projected)) {
    if (key === "last_progress") {
      if (value.last_progress !== null && field === null) return null;
    } else if (value[key] !== field || (field === null && !nullable.has(key))) return null;
  }
  return projected;
}

// Ignore arbitrary output and deliberately synthetic Browser witness lines.
// Retain the latest fixed-stage/count pair and at most one validated lifecycle
// record for each of the five inner fixture controls, across bounded chunks.
export function createObserverFixtureProgressReader() {
  let pending = "", discarding = false, latest = null;
  const children = new Map();
  return {
    write(chunk) {
      for (const character of chunk.toString()) {
        if (character === "\n") {
          if (!discarding && pending.startsWith(progressPrefix)) {
            try { latest = projectProgress(JSON.parse(pending.slice(progressPrefix.length))) ?? latest; } catch { /* Ignore non-progress output. */ }
          } else if (!discarding && pending.startsWith(REVIEW_CHILD_RESULT_PREFIX)) {
            try {
              const child = projectNestedFixtureChild(JSON.parse(pending.slice(REVIEW_CHILD_RESULT_PREFIX.length)));
              if (child) children.set(child.control_id, child);
            } catch { /* Ignore malformed or unrelated output. */ }
          }
          pending = ""; discarding = false;
        } else if (!discarding) {
          pending += character;
          if (pending.length > 1024) { pending = ""; discarding = true; }
        }
      }
    },
    snapshot() { return latest && { ...latest }; },
    childResults() { return [...children.values()].map(child => ({ ...child, last_progress: child.last_progress && { ...child.last_progress } })); },
  };
}
