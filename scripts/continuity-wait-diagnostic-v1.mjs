// Continuity-test observation only: no application requests or acceptance authority.
import { createHash } from "node:crypto";
const LIMIT = 96, BODY_LIMIT = 1024 * 1024, BODY_DEADLINE_MS = 1000;
const CAPTURE_DEADLINE_MS = 2000;
const SCHEMA = "continuity.imported-proposal-wait-diagnostic.v1";
const REFUSAL_CODES = new Set([
  "not_found", "operator_pilot_disabled", "operator_pilot_config_invalid",
  "operator_session_cookie_missing", "operator_session_cookie_invalid",
  "operator_session_expired", "operator_session_revoked", "operator_session_scope_mismatch",
  "operator_session_invalid", "operator_pilot_review_scope_mismatch",
  "operator_pilot_proposal_missing", "operator_pilot_proposal_invalid",
  "operator_pilot_proposal_fingerprint_mismatch", "operator_pilot_transition_receipt_invalid",
  "operator_pilot_review_request_failed",
]);
const pick = (value, allowed) => allowed.includes(value) ? value : null;
const boolean = value => typeof value === "boolean" ? value : null;
const integer = value => Number.isSafeInteger(value) && value >= 0 ? value : null;
const PHASE = "final_r8_portability_reconciliation";
const knownErrors = ["Execution context was destroyed", "Cannot find context", "No resource with given identifier found", "No data found for resource with given identifier", "Timed out waiting for CDP method Network.getResponseBody.", "diagnostic_collection_timeout", "diagnostic_body_missing", "diagnostic_body_overflow"];
const digest = value => createHash("sha256").update(String(value)).digest("hex");
function safeError(error, codes = REFUSAL_CODES) {
  try {
    const message = String(error?.message ?? error ?? "").slice(0, 4096);
    const code = codes.has(error?.code) ? error.code : codes.has(message) ? message : null;
    return {
      code, category: /TypeError/.test(message) ? "TypeError" : /ReferenceError/.test(message) ? "ReferenceError" : /SyntaxError/.test(message) ? "SyntaxError" : "error",
      known_message: knownErrors.find(value => message.includes(value)) ?? null,
      message_sha256: message ? digest(message) : null,
    };
  } catch { return { code: null, category: "unreadable_error", known_message: null, message_sha256: null }; }
}
export function createContinuityWaitDiagnostic({ origin, project, proposal, fingerprint, path, send, emit = () => {}, now = () => performance.now() }) {
  const originTime = now(), allowedCodes = REFUSAL_CODES, requests = new Map(), pending = new Set(), identities = new Map();
  let sealed = false, terminal = null, fixture = null, emitted = 0;
  let open = true, navigation = 0, waiting = false, lastSignature = null, lastSampleTime = -Infinity, lastSample = null;
  const counts = { true_results: 0, false_results: 0, evaluation_errors: 0, collection_errors: 0,
    omitted_events: 0, omitted_log_events: 0, evicted_requests: 0 };
  const events = [];
  const elapsed = () => Math.round(now() - originTime);
  const id = raw => {
    if (!raw) return null;
    if (identities.size >= 256 && !identities.has(raw)) return "identity_limit_redacted";
    if (!identities.has(raw)) identities.set(raw, "local-" + (identities.size + 1));
    return identities.get(raw);
  };
  const error = value => safeError(value, allowedCodes);
  const add = (kind, detail) => {
    if (sealed) return;
    const event = { at_ms: elapsed(), phase: PHASE, kind, interval: waiting ? "condition_wait" : "navigation_or_terminal", ...detail };
    if (events.length === LIMIT) { events.shift(); counts.omitted_events++; }
    events.push(event);
    if (emitted < LIMIT || kind === "terminal_outcome" || kind === "fixture_read") {
      emitted++;
      try { emit(event); } catch { counts.collection_errors++; }
    } else counts.omitted_log_events++;
    return event;
  };
  const guard = action => { try { return action(); } catch (failure) { counts.collection_errors++; add("collection_error", { error: error(failure) }); } };
  const classify = raw => {
    try {
      const u = new URL(raw);
      return { same_origin: u.origin === origin,
        destination: u.pathname === path ? "expected_proposal_detail" : ({
          "/api/vnext/operator/session": "session_api", "/api/vnext/operator/semantic-review": "review_api",
          "/workbench/semantic-review": "review_list", "/portability": "portability", "/": "home",
        })[u.pathname] ?? "other_redacted",
        project_query: !u.searchParams.has("project_id") ? "absent" : u.searchParams.get("project_id") === project ? "expected" : "other_redacted",
        expected_proposal_query: u.searchParams.has("proposal_id") ? u.searchParams.get("proposal_id") === proposal : null };
    } catch { return { same_origin: false, destination: "non_url", project_query: "unavailable", expected_proposal_query: null }; }
  };
  const bodyFields = body => ({
    result: ["authenticated", "locked", "disabled", "proposal_detail", "proposal_list", "error", "refused"].includes(body?.status) ? body.status : null,
    refusal_code: typeof body?.error_code === "string" ? (allowedCodes.has(body.error_code) ? body.error_code : "unrecognized_redacted") : null,
    refusal_code_sha256: typeof body?.error_code === "string" && !allowedCodes.has(body.error_code) ? digest(body.error_code) : null,
    project_matches: body?.project ? body.project.project_id === project : body?.session ? body.session.project_id === project : null,
    proposal_matches: body?.proposal?.proposal ? body.proposal.proposal.proposal_id === proposal : null,
    fingerprint_matches: body?.proposal?.proposal ? body.proposal.proposal.integrity?.fingerprint === fingerprint : null,
    transition: ["applied", "not_applied"].includes(body?.proposal?.transition?.status) ? body.proposal.transition.status : null,
    expected_refusal: "not_asserted_by_observer",
  });
  const beginBodyRead = request => {
    if (request.body_started) return;
    request.body_started = true;
    if (pending.size >= 8) { counts.collection_errors++; add("body_read_skipped", { request: request.id, reason: "pending_limit" }); return; }
    // CDP reads an already completed real-flow response; this does not fetch a route.
    const work = (async () => {
      try {
        const result = await withDeadline(() => send("Network.getResponseBody", { requestId: request.raw_id }, BODY_DEADLINE_MS), BODY_DEADLINE_MS);
        if (sealed) return;
        if (typeof result?.body !== "string") throw new Error("diagnostic_body_missing");
        if (result.body.length > BODY_LIMIT * 2) throw new Error("diagnostic_body_overflow");
        const text = result.base64Encoded ? Buffer.from(result.body ?? "", "base64").toString("utf8") : result.body;
        if (Buffer.byteLength(text) > BODY_LIMIT) throw new Error("diagnostic_body_overflow");
        add("response_body", { request: request.id, navigation: request.navigation, ...bodyFields(JSON.parse(text)) });
      } catch (failure) { if (sealed) return; counts.collection_errors++; add("body_read_error", { request: request.id, navigation: request.navigation, error: error(failure) }); }
    })();
    pending.add(work); work.finally(() => pending.delete(work));
  };
  add("observation_started", { observation_only: true, body_limit_bytes: BODY_LIMIT, event_limit: LIMIT, body_deadline_ms: BODY_DEADLINE_MS });
  const api = {
    expression(original) {
      // The original expression is still evaluated first and alone decides acceptance.
      return `(() => {
        const accepted = Boolean(${original});
        try {
          const url = new URL(location.href);
          const detail = document.querySelector('[data-vnext-semantic-review-detail="v0.1"]');
          const applied = document.querySelector('[data-vnext-transition-status="applied"]') !== null;
          const session = document.querySelector('[data-vnext-operator-session]')?.getAttribute('data-vnext-operator-session');
          const transition = detail?.getAttribute('data-vnext-transition-status');
          return { accepted, observation: {
            destination: url.pathname === ${JSON.stringify(path)} ? 'expected_proposal_detail' :
              ['/', '/portability', '/workbench/semantic-review'].includes(url.pathname) ? url.pathname : 'other_redacted',
            same_origin: url.origin === ${JSON.stringify(origin)},
            project_query: !url.searchParams.has('project_id') ? 'absent' : url.searchParams.get('project_id') === ${JSON.stringify(project)} ? 'expected' : 'other_redacted',
            ready_state: document.readyState, detail_present: detail !== null, applied_marker_present: applied,
            transition: ['applied', 'not_applied'].includes(transition) ? transition : null,
            session: ['checking', 'disabled', 'authenticated', 'locked'].includes(session) ? session : null,
            next_error_present: document.querySelector('#__next_error__') !== null
          }};
        } catch { return { accepted, collection_error: true }; }
      })()`;
    },
    conditionResult(value) {
      const accepted = value?.accepted === true;
      guard(() => {
        counts[accepted ? "true_results" : "false_results"]++;
        if (value?.collection_error) { counts.collection_errors++; add("dom_collection_error", {}); return; }
        const raw = value?.observation;
        const observation = {
          destination: pick(raw?.destination, ["expected_proposal_detail", "/", "/portability", "/workbench/semantic-review", "other_redacted"]),
          same_origin: boolean(raw?.same_origin), project_query: pick(raw?.project_query, ["absent", "expected", "other_redacted"]),
          ready_state: pick(raw?.ready_state, ["loading", "interactive", "complete"]),
          detail_present: boolean(raw?.detail_present), applied_marker_present: boolean(raw?.applied_marker_present),
          transition: pick(raw?.transition, ["applied", "not_applied"]),
          session: pick(raw?.session, ["checking", "disabled", "authenticated", "locked"]),
          next_error_present: boolean(raw?.next_error_present),
        };
        lastSample = { at_ms: elapsed(), ...observation };
        const signature = JSON.stringify(observation);
        if (signature !== lastSignature || elapsed() - lastSampleTime >= 5000 || accepted) {
          add("condition_sample", { accepted, observation: lastSample });
          lastSignature = signature; lastSampleTime = elapsed();
        }
      });
      return accepted;
    },
    evaluationError(failure) { guard(() => { counts.evaluation_errors++; add("condition_evaluation_error", { error: error(failure) }); }); },
    waitStarted() { waiting = true; guard(() => add("condition_wait_started", { timeout_ms: 45000 })); },
    navigationStarted(url) { guard(() => { navigation++; const entry = { navigation, ...classify(url) }; add("navigation_started", entry); }); },
    navigationResult(value) { guard(() => add("navigation_result", { navigation, frame: id(value?.frameId), loader: id(value?.loaderId), error: value?.errorText ? error(value.errorText) : null })); },
    observe(event, phase) {
      if (!open || sealed || phase !== PHASE) return;
      guard(() => {
        const p = event.params ?? {}, method = event.method, requestId = p.requestId;
        if (method === "Network.requestWillBeSent") {
          const route = classify(p.request?.url), relevant = p.type === "Document" || ["session_api", "review_api"].includes(route.destination);
          if (!relevant || !route.same_origin) return;
          if (requests.size >= 32 && !requests.has(requestId)) { requests.delete(requests.keys().next().value); counts.evicted_requests++; }
          const r = { raw_id: requestId, id: id(requestId), navigation, route: route.destination, started: true };
          requests.set(requestId, r);
          const headers = p.request?.headers ?? {}, projectHeader = Object.entries(headers).find(([key]) => key.toLowerCase() === "augnes-project-id")?.[1];
          add("request", { request: r.id, navigation, frame: id(p.frameId), loader: id(p.loaderId), type: p.type === "Document" ? "Document" : "API",
            method: ["GET", "POST"].includes(p.request?.method) ? p.request.method : "other", ...route,
            project_header: projectHeader === undefined ? "absent" : projectHeader === project ? "expected" : "other_redacted",
            redirect_status: integer(p.redirectResponse?.status) });
        } else if (method === "Network.responseReceived") {
          const route = classify(p.response?.url);
          if (!route.same_origin || !(p.type === "Document" || ["session_api", "review_api"].includes(route.destination))) return;
          let r = requests.get(requestId);
          if (!r && requests.size < 32) { r = { raw_id: requestId, id: id(requestId), navigation, route: route.destination, started: false }; requests.set(requestId, r); }
          if (!r) return;
          r.status = integer(p.response?.status); r.body_allowed = ["session_api", "review_api"].includes(route.destination);
          add("response", { request: r.id, navigation: r.navigation, request_start_observed: r.started, frame: id(p.frameId), loader: id(p.loaderId), ...route, status: r.status });
        } else if (method === "Network.loadingFinished") {
          const r = requests.get(requestId); if (r?.body_allowed) beginBodyRead(r);
        } else if (method === "Network.loadingFailed" && p.type !== "WebSocket") {
          const r = requests.get(requestId);
          add("request_failure", { request: r?.id ?? id(requestId), navigation: r?.navigation ?? null, request_start_observed: r?.started ?? false, error: error(p.errorText), cancelled: p.canceled === true });
        } else if (method === "Runtime.exceptionThrown") {
          const details = p.exceptionDetails ?? {};
          add("page_error", { navigation, error: error(details.exception?.description ?? details.text), frames: (details.stackTrace?.callFrames ?? []).slice(0, 3).map(f => ({ source: classify(f.url).destination, line: integer(f.lineNumber), column: integer(f.columnNumber) })) });
        } else if (method === "Runtime.consoleAPICalled" && p.type === "error") {
          add("console_error", { navigation, attribution: "phase_and_time_only", error: error((p.args ?? []).slice(0, 3).map(a => String(a.value ?? a.description ?? "").slice(0, 1024)).join(" ")) });
        } else if (method === "Log.entryAdded" && p.entry?.level === "error") {
          const r = requests.get(p.entry.networkRequestId);
          add("console_error", { request: r?.id ?? null, navigation: r?.navigation ?? navigation, attribution: r ? "request" : "phase_and_time_only", error: error(p.entry.text) });
        }
      });
    },
    snapshot() {
      return structuredClone({ schema: SCHEMA, phase: PHASE, terminal, fixture, counts, events, active_application_probes: 0 });
    },
    stop() { open = false; sealed = true; },
    collectionError(failure) { guard(() => { counts.collection_errors++; add("collection_error", { error: error(failure) }); }); },
    async finish({ failed, failure, readFixture }) {
      open = false; waiting = false;
      terminal = add("terminal_outcome", { outcome: failed ? "failure" : "pass", original_error: failed ? error(failure) : null, last_condition_sample: lastSample });
      for (const request of requests.values()) if (request.body_allowed && !request.body_started) {
        counts.collection_errors++;
        add("body_read_unavailable", { request: request.id, reason: "response_not_completed_before_terminal_outcome" });
      }
      await Promise.allSettled([...pending]);
      fixture = { status: "not_collected_after_pass" };
      if (failed) {
        const at_ms = elapsed();
        try {
          const raw = await withDeadline(readFixture, BODY_DEADLINE_MS);
          fixture = { status: "observed", at_ms, completed_at_ms: elapsed(), observation_order: "read_only_after_terminal_outcome",
            proposal_present: boolean(raw?.proposal_present), project_matches: boolean(raw?.project_matches),
            fingerprint_matches: boolean(raw?.fingerprint_matches) };
        } catch (failure) {
          counts.collection_errors++;
          fixture = { status: "collection_error", at_ms, completed_at_ms: elapsed(), observation_order: "read_only_after_terminal_outcome", error: error(failure) };
        }
        add("fixture_read", { fixture });
      }
      return api.snapshot();
    },
  };
  return api;
}
// The original outcome is rethrown unchanged, including when collection rejects,
// never settles, exceeds its bounds or cannot publish. Caller cleanup stays in control.
export async function withContinuityWaitDiagnostic(observer, run, readFixture, publish) {
  let failure, failed = false;
  try { return await run(); }
  catch (error) { failure = error; failed = true; throw error; }
  finally {
    let diagnostic;
    try {
      diagnostic = await withDeadline(() => observer.finish({ failed, failure, readFixture }), CAPTURE_DEADLINE_MS);
    } catch (captureError) {
      diagnostic = { schema: SCHEMA, collection_error: safeError(captureError) };
      try { observer.collectionError(captureError); diagnostic = observer.snapshot(); } catch {}
    } finally { try { observer.stop(); } catch {} }
    try { publish(diagnostic); } catch { /* A result sink is never acceptance or cleanup authority. */ }
  }
}

async function withDeadline(action, timeoutMs) {
  let timer;
  try {
    return await Promise.race([
      Promise.resolve().then(action),
      new Promise((_, reject) => { timer = setTimeout(() => reject(new Error("diagnostic_collection_timeout")), timeoutMs); }),
    ]);
  } finally { clearTimeout(timer); }
}
