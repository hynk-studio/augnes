// Injected only into the Browser owner's disposable page. No global fetch patch,
// extra await, Promise handler, request header, timer, or response-body inspection.
export const CONSUMER_DIAGNOSTIC_BINDING_V1 = '__augnesProjectExperienceDiagnosticEventV1';

export function projectExperienceConsumerScriptV1(channel) {
  return `(${install.toString()})(${JSON.stringify(channel)}, ${JSON.stringify(CONSUMER_DIAGNOSTIC_BINDING_V1)});`;
}

function install(channel, binding) {
  try {
    if (!['localhost', '127.0.0.1', '[::1]'].includes(location.hostname) ||
      typeof window[binding] !== 'function') return;
    const documentAlias = crypto.randomUUID();
    const consumers = new WeakMap();
    let consumerCount = 0, generation = 0, emitted = 0;
    const safe = action => { try { return action(); } catch { return null; } };
    const send = fields => safe(() => {
      if (emitted > 1024) return;
      window[binding](JSON.stringify({ channel, document: documentAlias, ordinal: emitted + 1,
        ...(emitted++ === 1024 ? { kind: 'overflow' } : fields) }));
    });
    const authState = value => value === 'authenticated' ? value : value === 'locked' ? 'locked_or_refused' :
      value === 'disabled' ? 'unavailable' : 'unknown';
    function makeRead(consumer, owner, controller, auth, effect) {
      if (generation >= 32) { send({ kind: 'overflow' }); return null; }
      const id = ++generation;
      const emit = (kind, status) => send({ consumer, generation: id, effect,
        kind, owner, auth: auth(), status: Number.isInteger(status) && status >= 100 && status <= 599 ? status : null });
      // The unique frame belongs to this invocation, not to a URL/header label.
      // It calls the existing fetch synchronously and returns that exact Promise.
      const invoke = Function('run', `return function(...args) { return run(...args); };\n//# sourceURL=augnes-pe-diagnostic/${channel}/${documentAlias}/${id}`)(
        (...args) => { emit('fetch_started'); return window.fetch(...args); });
      const aborted = () => emit('signal_aborted');
      emit('read_created');
      if (controller) {
        emit('controller_created');
        controller.signal.addEventListener('abort', aborted, { once: true });
      }
      return Object.freeze({ fetch: invoke, event(kind, status) { safe(() => {
        if (!['response_headers_received', 'body_read_started', 'body_read_completed', 'body_read_failed',
          'consumer_returned', 'consumer_disposed', 'cleanup_observed', 'abort_requested', 'abort_call_returned'].includes(kind)) return;
        emit(kind, status);
        if (kind === 'consumer_returned') controller?.signal.removeEventListener('abort', aborted);
      }); } });
    }
    Object.defineProperty(window, '__augnesProjectExperienceDiagnosticsV1', { value: Object.freeze({
      consumer(instance) { return safe(() => {
        if (consumers.has(instance)) return consumers.get(instance);
        if (consumerCount >= 4) { send({ kind: 'overflow' }); return null; }
        const consumer = ++consumerCount, controllers = new WeakMap();
        let auth = 'unknown', effect = 0, initial = false, cleanupRead = null;
        const emit = (kind, enabled) => send({ consumer, effect, kind, auth,
          enabled: typeof enabled === 'boolean' ? enabled : null });
        const observer = Object.freeze({
          auth(value) { safe(() => { auth = authState(value); emit('auth_transition_requested'); }); },
          mount() { emit('consumer_mounted'); return () => emit('consumer_disposed'); },
          effectActive(enabled) { safe(() => { effect += 1; emit('effect_active', enabled); }); },
          initialRead() { initial = true; },
          beginRead(controller) { return safe(() => {
            const owner = initial ? 'delegated_work_initial_read' : 'delegated_work_refresh_or_poll';
            initial = false;
            const read = makeRead(consumer, owner, controller, () => auth, effect);
            if (read) controllers.set(controller, read);
            return read;
          }); },
          cleanup(controller) { safe(() => {
            emit('effect_cleanup');
            const read = controller && controllers.get(controller);
            cleanupRead = read;
            read?.event('cleanup_observed');
            read?.event('abort_requested');
          }); },
          cleanupFinished() { safe(() => { cleanupRead?.event('abort_call_returned'); cleanupRead = null; }); },
        });
        consumers.set(instance, observer);
        return observer;
      }); },
      // Only the explicit Browser call site obtains this invocation's capability.
      probe() { return safe(() => makeRead(0, 'marked_unavailable_execution_probe', null, () => 'unknown', 0)); },
    }), configurable: false, writable: false });
  } catch { /* Diagnostic installation cannot affect application execution. */ }
}
