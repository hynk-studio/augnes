import { createHash } from "node:crypto";

const TIMING_SUMMARY_VERSION = "browser_e2e_timing.v0.1";
const MAX_EVENTS = 512;
const MAX_LABEL_BYTES = 160;
const PRIVATE_OR_SECRET =
  /(?:\/(?:Users|home|private|var\/folders)\/|[A-Za-z]:\\|(?:api[_-]?key|authorization|bearer|credential|password|secret|token)\s*[:=])/iu;

export function createBrowserE2ETimingRecorder({
  scope,
  now = Date.now,
  maxEvents = MAX_EVENTS,
} = {}) {
  if (!/^(?:core|continuity|complete)$/u.test(scope ?? "")) {
    throw new Error("browser_e2e_timing_scope_invalid");
  }
  if (!Number.isSafeInteger(maxEvents) || maxEvents < 1 || maxEvents > MAX_EVENTS) {
    throw new Error("browser_e2e_timing_event_bound_invalid");
  }
  const startedAt = now();
  const events = [];
  let sequence = 0;

  const append = (kind, label, durationMs = null) => {
    if (events.length >= maxEvents) {
      throw new Error("browser_e2e_timing_event_bound_exceeded");
    }
    sequence += 1;
    const event = {
      sequence,
      kind: publicToken(kind),
      label: publicLabel(label),
      elapsed_ms: boundedDuration(now() - startedAt),
      duration_ms:
        durationMs === null ? null : boundedDuration(durationMs),
    };
    events.push(event);
    return event;
  };

  return Object.freeze({
    duration(kind, label, durationMs, outcome = "pass") {
      return append(
        `${publicToken(kind)}_${outcome === "pass" ? "pass" : "fail"}`,
        label,
        durationMs,
      );
    },
    milestone(label) {
      return append("milestone", label);
    },
    start(kind, label) {
      const eventStartedAt = now();
      let settled = false;
      return (outcome = "pass") => {
        if (settled) throw new Error("browser_e2e_timing_event_already_settled");
        settled = true;
        return append(
          `${publicToken(kind)}_${outcome === "pass" ? "pass" : "fail"}`,
          label,
          now() - eventStartedAt,
        );
      };
    },
    summary() {
      const totals = {};
      for (const event of events) {
        if (event.duration_ms === null) continue;
        const kind = event.kind.replace(/_(?:pass|fail)$/u, "");
        totals[kind] = (totals[kind] ?? 0) + event.duration_ms;
      }
      return {
        timing_version: TIMING_SUMMARY_VERSION,
        scope,
        total_elapsed_ms: boundedDuration(now() - startedAt),
        event_count: events.length,
        totals_ms: Object.fromEntries(
          Object.entries(totals).sort(([left], [right]) =>
            left.localeCompare(right),
          ),
        ),
        events: events.map((event) => ({ ...event })),
      };
    },
  });
}

export function publicTimingLabel(value) {
  return publicLabel(value);
}

function publicToken(value) {
  const token = String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/gu, "_")
    .replace(/^_+|_+$/gu, "")
    .slice(0, 64);
  if (!/^[a-z0-9][a-z0-9_-]{0,63}$/u.test(token)) {
    throw new Error("browser_e2e_timing_token_invalid");
  }
  return token;
}

function publicLabel(value) {
  const label = String(value ?? "").trim();
  if (label.length === 0) throw new Error("browser_e2e_timing_label_missing");
  if (PRIVATE_OR_SECRET.test(label)) {
    return `redacted_${createHash("sha256").update(label).digest("hex").slice(0, 12)}`;
  }
  const bounded = Buffer.from(label, "utf8").subarray(0, MAX_LABEL_BYTES).toString("utf8");
  return bounded.replace(/[\r\n\t]/gu, " ");
}

function boundedDuration(value) {
  if (!Number.isFinite(value)) throw new Error("browser_e2e_timing_duration_invalid");
  return Math.max(0, Math.min(Math.round(value), 24 * 60 * 60 * 1000));
}
