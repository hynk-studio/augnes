// Diagnostics for the real Web Planning Browser owner. No interception error
// is accepted or ignored here, and no request, command or transition is retried.
const terminalMethods = new Set(['Fetch.continueRequest', 'Fetch.failRequest', 'Fetch.fulfillRequest', 'Fetch.continueResponse']);

function safeUrl(value) {
  try {
    const url = new URL(value);
    url.username = ''; url.password = '';
    for (const key of url.searchParams.keys()) {
      if (/token|secret|password|authorization|cookie|api.?key|code/i.test(key)) url.searchParams.set(key, '[redacted]');
    }
    return url.href;
  } catch { return String(value); }
}

function requestKind(p, origin) {
  const url = new URL(p.request.url);
  if (!p.request.url.startsWith(origin + '/')) return 'external';
  if (p.resourceType === 'Document') return 'navigation';
  if (!url.pathname.startsWith('/api/')) return 'static_asset';
  if (url.pathname.endsWith('/capacity')) return 'background_capacity';
  if (['GET', 'HEAD'].includes(p.request.method) || /\/(context|scene-context|compare|resolve|preview|[^/]*-(preview|resolve))$/.test(url.pathname)) return 'api_read';
  return 'api_write'; // Unknown API POSTs are conservatively write-dependent.
}

export function observeWebPlanningInterceptions(c, { targetId, origin, emit = record => console.log(JSON.stringify(record)) }) {
  const send = c.send.bind(c), close = c.close.bind(c);
  let sequence = 0, fetchGeneration = 0, navigationGeneration = 0, targetGeneration = 0;
  let currentUrl = 'about:blank', pauses = 0, commands = 0, latestHarnessAction = null;
  const requests = new Map(), observations = [], transitions = [], errors = [];
  const event = (kind, detail = {}) => {
    const value = { sequence: ++sequence, kind, ...detail };
    transitions.push(value); return value;
  };
  const state = () => ({ fetch_pattern_generation: fetchGeneration, navigation_generation: navigationGeneration, target_generation: targetGeneration, current_target_url: safeUrl(currentUrl) });
  const mark = (kind, detail = {}) => {
    const value = event(kind, { owner: 'harness', ...state(), ...detail });
    latestHarnessAction = value; return value;
  };
  c.handlers.push(m => {
    if (m.method === 'Page.frameNavigated' && !m.params.frame.parentId) {
      navigationGeneration++; currentUrl = m.params.frame.url;
      event('document_committed', { owner: 'browser_observation', ...state(), frame_id: m.params.frame.id, loader_id: m.params.frame.loaderId });
    }
    if (m.method === 'Page.frameRequestedNavigation' || m.method === 'Page.frameStartedNavigating') {
      event(m.method, { owner: 'browser_observation', ...state(), frame_id: m.params.frameId,
        url: safeUrl(m.params.url), reason: m.params.reason ?? null, navigation_type: m.params.navigationType ?? null });
    }
    if (m.method === 'Fetch.requestPaused') {
      const p = m.params, kind = requestKind(p, origin);
      const previous = requests.get(p.requestId);
      const value = { pause_sequence: ++sequence, target_id: targetId, request_id: p.requestId, network_id: p.networkId ?? null,
        url: safeUrl(p.request.url), http_method: p.request.method, resource_type: p.resourceType,
        stage: p.responseStatusCode === undefined && p.responseErrorReason === undefined ? 'request' : 'response',
        response_status: p.responseStatusCode ?? null, response_error_reason: p.responseErrorReason ?? null,
        request_kind: kind, product_result_depended_on_request: ['api_write', 'api_read', 'navigation'].includes(kind) ? true : null,
        acknowledgement_depended_on_request: kind === 'api_write' || /\/[^/]*resolve$/.test(new URL(p.request.url).pathname),
        dependency_basis: kind === 'background_capacity' ? 'background or explicitly inspected capacity; dependency not established by URL' : 'conservative route classification; full product assertions remain authoritative',
        at_pause: state(), latest_harness_action: latestHarnessAction, previous_pause_sequence: previous?.pause_sequence ?? null,
        terminal_commands: [], network_failures: [] };
      requests.set(p.requestId, value); observations.push(value); pauses++;
    }
    if (m.method === 'Network.loadingFailed') {
      for (const p of observations) if (p.network_id === m.params.requestId) {
        p.network_failures.push({ sequence: ++sequence, error_text: m.params.errorText, canceled: m.params.canceled ?? false });
      }
    }
  });
  c.send = (method, params = {}) => {
    const callStack = new Error('interception caller').stack;
    let transition;
    if (method === 'Fetch.enable' || method === 'Fetch.disable') {
      fetchGeneration++; transition = mark('fetch_patterns_changed', { method, patterns: params.patterns ?? [] });
    }
    if (method === 'Page.navigate') {
      navigationGeneration++; transition = mark('navigation_requested', { url: safeUrl(params.url) });
    }
    const paused = terminalMethods.has(method) ? requests.get(params.requestId) : null;
    const operation = terminalMethods.has(method) ? { sequence: ++sequence, method, action: callStack?.split('\n')[2]?.trim(), status: 'pending', at_command: state() } : null;
    if (operation) { commands++; paused?.terminal_commands.push(operation); }
    return send(method, params).then(result => {
      if (operation) { operation.status = 'completed'; operation.finished_sequence = ++sequence; }
      if (transition) mark('transition_command_completed', { transition_sequence: transition.sequence, method });
      return result;
    }, error => {
      if (operation) {
        operation.status = 'failed'; operation.finished_sequence = ++sequence;
        const afterPause = transitions.filter(t => t.sequence > (paused?.pause_sequence ?? Infinity));
        const record = { web_planning_interception_failure: {
          ...paused, target_id: targetId, request_id: params.requestId ?? null, method,
          chrome_error: error.cdp ?? { code: null, message: error.message, data: null },
          at_failure: state(), handler_call_stack: callStack, command_call_stack: error.commandStack ?? null,
          request_pause_history: observations.filter(p => p.request_id === params.requestId),
          transitions_since_pause: afterPause,
          harness_transition_after_pause: afterPause.some(t => t.owner === 'harness'),
          harness_changes_after_pause: Object.fromEntries(['navigation_requested', 'fetch_patterns_changed', 'runtime_close_requested', 'target_session_close_requested', 'response_barrier_release'].map(kind => [kind, afterPause.some(t => t.owner === 'harness' && t.kind === kind)])),
          ignored: false,
        } };
        errors.push(record); error.interceptionRecord = record; emit(record);
      }
      throw error;
    });
  };
  c.close = async () => {
    targetGeneration++; mark('target_session_close_requested');
    return close();
  };
  return { mark, summary: () => ({ target_id: targetId, pauses, commands, failures: errors.length, ignored_errors: 0,
    pending_commands: observations.flatMap(p => p.terminal_commands).filter(p => p.status === 'pending').length,
    ...state() }) };
}
