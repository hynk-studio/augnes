import { createHash } from "node:crypto";

const CONDITION = `document.querySelector('[data-blank-state="v0.1"][data-blank-state-active="true"][data-blank-state-project-management-hydrated="true"]') !== null`;
const SAMPLE_LIMIT = 16;
const CONTEXT_LIMIT = 64;
const identity = (value) => value == null ? null : createHash("sha256").update(String(value)).digest("hex").slice(0, 24);

// Verifier-only observation of one synchronous condition. It neither selects an
// execution context nor changes the original Boolean, exception, or wait policy.
export function createOperatorProjectHomeReadinessObservationV1({ project_id }) {
  const expectedPath = `/projects/${encodeURIComponent(project_id)}`;
  const contexts = new Map();
  let navigation = null, frame = null, loader = null;
  let started = null, finished = false, record = null, lastKey = null;
  let eventErrors = 0, contextOverflow = 0;

  const noteError = (code) => {
    if (!record) { eventErrors++; return; }
    record.observation_error_count++;
    if (!record.observation_error_codes.includes(code)) record.observation_error_codes.push(code);
  };
  const navigationEvidence = () => ({
    epoch: navigation?.epoch ?? null,
    intended_path_matches: navigation?.intended_path_matches ?? null,
    expected_frame: identity(navigation?.frame_id),
    expected_loader: identity(navigation?.loader_id),
    observed_frame: identity(frame),
    observed_loader: identity(loader),
    frame_matches_expected: frame !== null && frame === navigation?.frame_id,
    loader_matches_expected: loader !== null && loader === navigation?.loader_id,
    document_http_status: navigation?.http_status ?? null,
    document_response_matches_navigation: navigation?.response_matches ?? null,
    default_contexts_for_frame: [...contexts].filter(([, value]) => value === frame).map(([id]) => identity(id)),
    // Runtime.evaluate uses the existing default context; its response does not
    // return a per-evaluation context identity. Do not claim stronger binding.
    evaluation_context_binding: "implicit_default_context",
  });
  const sample = (value) => {
    const captured = { ...value, navigation: navigationEvidence() };
    const key = JSON.stringify(captured);
    record.last_sample = {
      elapsed_wait_ms: Date.now() - started,
      elapsed_navigation_ms: navigation ? Date.now() - navigation.started_at : null,
      ...captured,
    };
    if (key !== lastKey) {
      record.changed_sample_count++;
      if (record.samples.length < SAMPLE_LIMIT) record.samples.push(record.last_sample);
      else record.omitted_sample_count++;
      lastKey = key;
    }
  };

  const observer = {
    navigationStarted({ epoch, url }) {
      if (finished) return;
      try {
        navigation = { epoch, started_at: Date.now(), intended_path_matches: new URL(url).pathname === expectedPath };
        frame = null; loader = null;
      } catch { noteError("navigation_capture_failed"); }
    },
    navigationExpected(value) {
      if (finished || !navigation) return;
      try {
        navigation.frame_id = value.frameId ?? null;
        navigation.loader_id = value.loaderId ?? null;
      } catch { noteError("navigation_capture_failed"); }
    },
    documentResponse(value) {
      if (finished || !navigation) return;
      try {
        navigation.http_status = value?.status ?? null;
        navigation.response_matches = value?.frame_id === navigation.frame_id && value?.loader_id === navigation.loader_id;
      } catch { noteError("document_capture_failed"); }
    },
    observe(payload) {
      if (finished) return;
      try {
        const { method, params = {} } = payload;
        if (method === "Runtime.executionContextCreated" && params.context.auxData?.isDefault) {
          if (contexts.size < CONTEXT_LIMIT) contexts.set(params.context.id, params.context.auxData.frameId);
          else contextOverflow++;
        } else if (method === "Runtime.executionContextDestroyed") contexts.delete(params.executionContextId);
        else if (method === "Runtime.executionContextsCleared") contexts.clear();
        else if (method === "Page.frameNavigated" && !params.frame.parentId) {
          frame = params.frame.id; loader = params.frame.loaderId;
        }
      } catch { noteError("event_capture_failed"); }
    },
    begin({ expression, timeout_ms }) {
      if (record) return null;
      started = Date.now();
      record = {
        observation_version: "operator_project_home_readiness_observation.v1",
        status: "in_progress", condition_outcome: null, condition_deadline_ms: timeout_ms,
        evaluation_count: 0, document_observation_count: 0,
        javascript_exception_count: 0, cdp_rejection_count: 0,
        observation_error_count: eventErrors, observation_error_codes: eventErrors ? ["prior_event_capture_failed"] : [],
        context_overflow_count: 0, changed_sample_count: 0, omitted_sample_count: 0,
        sample_limit: SAMPLE_LIMIT, samples: [], last_sample: null,
      };
      if (expression !== CONDITION) {
        noteError("unsupported_condition");
        observer.finish("not_observed");
        return null;
      }
      return observer;
    },
    async evaluate(send, params) {
      record.evaluation_count++;
      // The original predicate runs exactly once, before observational reads.
      // Even observation-side exceptions return its unchanged original value.
      const expression = `(() => {
        const original_value = (${CONDITION});
        let observation = null;
        try {
          const roots = [...document.querySelectorAll('[data-blank-state="v0.1"]')];
          const flag = (element, name) => {
            const value = element.getAttribute(name);
            return value === 'true' ? true : value === 'false' ? false : null;
          };
          observation = {
            intended_path_matches: location.pathname === ${JSON.stringify(expectedPath)},
            ready_state: ['loading', 'interactive', 'complete'].includes(document.readyState) ? document.readyState : null,
            root_count: roots.length,
            active_count: roots.filter(x => flag(x, 'data-blank-state-active') === true).length,
            hydrated_count: roots.filter(x => flag(x, 'data-blank-state-project-management-hydrated') === true).length,
            roots: roots.slice(0, 2).map(x => ({ active: flag(x, 'data-blank-state-active'), hydrated: flag(x, 'data-blank-state-project-management-hydrated') })),
            bound_work_link_matches: [...document.querySelectorAll('[data-project-bound-work-link]')].slice(0, 2).map(x => new URL(x.href, location.href).searchParams.get('project_id') === ${JSON.stringify(project_id)}),
            loading_surface_present: document.querySelector('main.product-route-state[aria-busy="true"]') !== null,
            error_surface_present: document.querySelector('[data-blank-state-primary-action="retry"]') !== null,
            next_error_present: document.querySelector('meta[name="next-error"]') !== null
          };
        } catch { /* Missing observation is explicit; the predicate stays authoritative. */ }
        return { original_value, observation };
      })()`;
      let response;
      try { response = await send("Runtime.evaluate", { ...params, expression }); }
      catch (error) {
        record.cdp_rejection_count++;
        try { sample({ evaluation: "cdp_rejection" }); } catch { noteError("sample_capture_failed"); }
        throw error;
      }
      if (response.exceptionDetails) {
        record.javascript_exception_count++;
        try { sample({ evaluation: "javascript_exception" }); } catch { noteError("sample_capture_failed"); }
        return response;
      }
      const value = response.result?.value;
      const originalValue = value?.original_value;
      try {
        if (typeof originalValue !== "boolean") noteError("predicate_value_unavailable");
        const document = boundedDocumentObservation(value?.observation);
        if (!document) noteError("document_observation_unavailable");
        else record.document_observation_count++;
        sample({
          evaluation: typeof originalValue === "boolean" ? originalValue ? "true" : "false" : "unavailable",
          document,
        });
      } catch { noteError("sample_capture_failed"); }
      return { ...response, result: typeof originalValue === "boolean" ? { type: "boolean", value: originalValue } : { type: "undefined" } };
    },
    finish(outcome) {
      if (!record || finished) return;
      finished = true;
      record.condition_outcome = outcome;
      record.context_overflow_count = contextOverflow;
      const document = record.last_sample?.navigation;
      if (!document?.expected_frame || !document.expected_loader || !document.observed_frame ||
          !document.observed_loader || document.default_contexts_for_frame.length === 0) noteError("navigation_evidence_unavailable");
      record.status = record.observation_error_count || !record.document_observation_count || contextOverflow ? "incomplete" : "complete";
    },
    snapshot() { return record ? structuredClone(record) : null; },
  };
  return Object.freeze(observer);
}

function boundedDocumentObservation(value) {
  const valid = value !== null && typeof value === "object" &&
    typeof value.intended_path_matches === "boolean" &&
    ["loading", "interactive", "complete"].includes(value.ready_state) &&
    [value.root_count, value.active_count, value.hydrated_count].every(number => Number.isSafeInteger(number) && number >= 0) &&
    Array.isArray(value.roots) && value.roots.length <= 2 &&
    value.roots.every(root => [true, false, null].includes(root.active) && [true, false, null].includes(root.hydrated)) &&
    Array.isArray(value.bound_work_link_matches) && value.bound_work_link_matches.length <= 2 &&
    value.bound_work_link_matches.every(entry => typeof entry === "boolean") &&
    [value.loading_surface_present, value.error_surface_present, value.next_error_present].every(entry => typeof entry === "boolean");
  if (!valid) return null;
  return {
    intended_path_matches: value.intended_path_matches, ready_state: value.ready_state,
    root_count: value.root_count, active_count: value.active_count, hydrated_count: value.hydrated_count,
    roots: value.roots.map(({ active, hydrated }) => ({ active, hydrated })),
    bound_work_link_matches: [...value.bound_work_link_matches],
    loading_surface_present: value.loading_surface_present, error_surface_present: value.error_surface_present,
    next_error_present: value.next_error_present,
  };
}
