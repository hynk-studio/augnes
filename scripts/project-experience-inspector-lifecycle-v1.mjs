// Bounded observation of the Inspector's initial-session effect replay only.
// The private capability binds original CDP failures; snapshots grant no verdict.
import { randomBytes } from 'node:crypto';
export const INSPECTOR_LIFECYCLE_BINDING_V1 = '__augnesInspectorLifecycleEventV1';
export const INSPECTOR_REPLAY_PHASES_V1 = Object.freeze(['project_shell_and_locked_entry', 'rendered_state_responsive_matrix']);
const owners = new WeakMap();
export const inspectorLifecycleEvidenceOwnerV1 = evidence => owners.get(evidence) ?? null;
const key = (...values) => JSON.stringify(values);
const signature = value => JSON.stringify(value);
const route = '/api/vnext/operator/session';
const kinds = new Set(['setup', 'fetch_started', 'headers', 'body_started', 'body_completed', 'stale_blocked',
  'session_applied', 'inspector_body', 'inspector_applied', 'inspector_refusal_applied', 'inspector_failed', 'read_aborted', 'read_failed',
  'returned', 'cleanup', 'abort_requested', 'signal_aborted', 'abort_returned', 'committed']);

export function createInspectorLifecycleV1({ phases = INSPECTOR_REPLAY_PHASES_V1 } = {}) {
  const observedPhases = Object.freeze([...phases]);
  const channel = randomBytes(16).toString('hex'), evidence = Object.freeze({});
  const connections = new Map(), documents = new Map(), failures = new WeakMap(), events = [];
  const counts = { invalid: 0, overflow: 0, installation: 0 };
  let sequence = 0;
  const stamp = fields => {
    if (events.length >= 2048) { counts.overflow++; return null; }
    const event = { sequence: ++sequence, ...fields }; events.push(event); return event;
  };
  const guard = action => { try { return action(); } catch { counts.invalid++; return null; } };
  const requests = () => [...connections.values()].flatMap(c => [...c.requests.values()]);
  const generation = request => {
    if (!request.pin) return null;
    const doc = documents.get(key(request.connection, request.session, request.pin[0]));
    const setup = doc?.events.filter(e => e.read === request.pin[1] && e.kind === 'setup');
    if (setup?.length !== 1) return null;
    return { doc, setup: setup[0], events: doc.events.filter(e => e.read === request.pin[1]) };
  };
  owners.set(evidence, { facts(entry) {
    const bound = failures.get(entry);
    if (!bound || signature(entry) !== bound.signature) return null;
    return { request: bound.request, generation: generation(bound.request), counts,
      candidates: requests().map(request => ({ request, generation: generation(request) })) };
  } });
  return Object.freeze({
    evidence,
    browserSource: () => `(${installInspectorObserver.toString()})(${JSON.stringify(channel)},${JSON.stringify(INSPECTOR_LIFECYCLE_BINDING_V1)});`,
    installationFailed() { counts.installation++; },
    connection(identity) {
      if (!identity || typeof identity !== 'object' || connections.size >= 16) { counts.invalid++; return null; }
      const token = Object.freeze({});
      connections.set(token, { identity, number: connections.size + 1, requests: new Map(), contexts: new Map(), frames: new Map() });
      return token;
    },
    observe(token, payload, phase) { guard(() => {
      const c = connections.get(token); if (!c) { counts.invalid++; return; }
      const p = payload.params ?? {}, session = payload.sessionId ?? null;
      const active = observedPhases.includes(phase);
      if (payload.method === 'Page.frameNavigated') {
        if (active || c.frames.has(key(session, p.frame.id))) c.frames.set(key(session, p.frame.id), p.frame.loaderId);
      } else if (payload.method === 'Runtime.executionContextCreated') {
        if (!active) return;
        if (c.contexts.size >= 64) { counts.overflow++; return; }
        const x = p.context;
        c.contexts.set(key(session, x.id), { frame: x.auxData?.frameId, default: x.auxData?.isDefault === true });
      } else if (payload.method === 'Runtime.bindingCalled' && p.name === INSPECTOR_LIFECYCLE_BINDING_V1) {
        const v = JSON.parse(p.payload), ctx = c.contexts.get(key(session, p.executionContextId));
        const id = key(c.number, session, v.document);
        if (!active && !documents.has(id)) return;
        if (v.channel !== channel || !ctx?.default || !ctx.frame || !/^[a-f0-9-]{36}$/.test(v.document) ||
          !kinds.has(v.kind) || !['ordinal','consumer','effect','read','target'].every(k => Number.isInteger(v[k]) && v[k] > 0 && v[k] <= 512) ||
          Object.keys(v).some(k => !['channel','document','ordinal','consumer','effect','read','target','kind','value','current','aborted','project_matches','inspector_current','session_state','refusal'].includes(k)) ||
          ['current','aborted','project_matches','inspector_current'].some(k => v[k] !== undefined && typeof v[k] !== 'boolean') ||
          (v.value !== undefined && v.value !== null && typeof v.value !== 'boolean' && !(Number.isInteger(v.value) && v.value >= 100 && v.value <= 599)) ||
          (v.refusal !== undefined && !['missing','conflict','other'].includes(v.refusal)) ||
          (v.session_state !== undefined && !['checking','locked','disabled','authenticated','invalid'].includes(v.session_state))) { counts.invalid++; return; }
        let doc = documents.get(id);
        if (!doc) {
          if (documents.size >= 16) { counts.overflow++; return; }
          doc = { id, context: p.executionContextId, frame: ctx.frame, loader: c.frames.get(key(session, ctx.frame)), ordinal: 0, events: [], invalid: false };
          documents.set(id, doc);
        }
        if (doc.context !== p.executionContextId || doc.frame !== ctx.frame || !doc.loader || v.ordinal !== doc.ordinal + 1 || doc.events.length >= 512) {
          doc.invalid = true; counts.invalid++; return;
        }
        doc.ordinal = v.ordinal;
        const { channel: unused, ...fields } = v;
        const event = stamp(fields); if (event) doc.events.push(event);
      } else if (payload.method === 'Network.requestWillBeSent') {
        if (!active || new URL(p.request?.url).pathname !== route) return;
        if (c.requests.size >= 64) { counts.overflow++; return; }
        const frames = []; let stack = p.initiator?.stack;
        for (let depth = 0; stack && depth < 16; depth++, stack = stack.parent) frames.push(...(stack.callFrames ?? []));
        const prefix = `augnes-inspector/${channel}/`;
        const pins = frames.filter(f => f.url?.startsWith(prefix)).map(f => f.url.slice(prefix.length).split('/'));
        const pin = pins.length === 1 && /^[a-f0-9-]{36}$/.test(pins[0][0]) && /^\d+$/.test(pins[0][1]) ? [pins[0][0], Number(pins[0][1])] : null;
        const requestKey = key(session, p.requestId), previous = c.requests.get(requestKey);
        if (previous) previous.invalid = true;
        const url = new URL(p.request.url);
        c.requests.set(requestKey, { connection: c.number, identity: c.identity, session, requestId: p.requestId,
          frame: p.frameId, loader: p.loaderId, phase, pin, method: p.request.method,
          local: ['localhost','127.0.0.1','[::1]'].includes(url.hostname),
          loaderCallsite: frames.some(f => /(?:^|\/)components\/workbench\/inspector\/shared-project-inspector-loader\.tsx(?:\?|$)/.test(f.url)),
          invalid: !!previous || !!p.redirectResponse || pins.length > 1,
          start: stamp({ kind: 'request', phase })?.sequence, response: null, finished: null, failed: null });
      } else if (['Network.responseReceived','Network.loadingFinished','Network.loadingFailed'].includes(payload.method)) {
        const r = c.requests.get(key(session, p.requestId)); if (!r) return;
        const seq = stamp({ kind: payload.method, phase })?.sequence;
        if (!seq) return;
        if ((p.frameId && p.frameId !== r.frame) || (p.loaderId && p.loaderId !== r.loader)) r.invalid = true;
        if (payload.method === 'Network.responseReceived') {
          if (r.response || r.finished || r.failed || new URL(p.response.url).pathname !== route) r.invalid = true;
          r.response = { sequence: seq, status: p.response.status };
        } else if (payload.method === 'Network.loadingFinished') {
          if (r.finished || r.failed) r.invalid = true; r.finished = seq;
        } else {
          if (r.finished || r.failed) r.invalid = true;
          r.failed = { sequence: seq, canceled: p.canceled === true, error: p.errorText, phase };
        }
      }
    }); },
    bindFailure(token, payload, entry) { guard(() => {
      const r = connections.get(token)?.requests.get(key(payload.sessionId ?? null, payload.params?.requestId));
      if (r?.failed) failures.set(entry, { request: r, signature: signature(entry) });
    }); },
    snapshot() { return structuredClone({ schema: 'augnes.inspector-lifecycle-observation.v1', authority: 'diagnostic_only_no_verdict',
      scope: { phases: observedPhases, later_events_for_retained_requests: true }, counts, complete: Object.values(counts).every(n => n === 0), events }); },
  });
}

function installInspectorObserver(channel, binding) {
  try {
    if (typeof window[binding] !== 'function' || !['localhost','127.0.0.1','[::1]'].includes(location.hostname)) return;
    const document = crypto.randomUUID(), consumers = new WeakMap(), targets = new Map();
    let ordinal = 0, consumerCount = 0, readCount = 0;
    const safe = fn => { try { return fn(); } catch { return null; } };
    const send = fields => safe(() => window[binding](JSON.stringify({ channel, document, ordinal: ++ordinal, ...fields })));
    Object.defineProperty(window, '__augnesInspectorLifecycleV1', { value: Object.freeze({ consumer(instance) {
      if (consumers.has(instance)) return consumers.get(instance);
      const consumer = ++consumerCount, applied = new WeakMap(), inspected = new WeakMap();
      let effect = 0, current = null;
      const observer = Object.freeze({
        effect(controller, project, query, fetch) { return safe(() => {
          const id = ++readCount, identity = JSON.stringify([project, query]);
          if (!targets.has(identity)) targets.set(identity, targets.size + 1);
          const fields = { consumer, effect: ++effect, read: id, target: targets.get(identity) };
          const record = { controller, fields }; current = record;
          const emit = (kind, extra = {}) => send({ ...fields, kind, ...extra });
          emit('setup'); controller.signal.addEventListener('abort', () => emit('signal_aborted'), { once: true });
          const invoke = Function('run', `return function(...args) { return run(...args); };\n//# sourceURL=augnes-inspector/${channel}/${document}/${id}`)(
            (...args) => { safe(() => {
              const url = new URL(args[0], location.href), options = args[1];
              emit('fetch_started', { value: url.origin === location.origin && url.pathname === '/api/vnext/operator/session' &&
                options?.signal === controller.signal && options.method === 'GET' && options.cache === 'no-store' && options.credentials === 'same-origin' });
            }); return Reflect.apply(fetch, undefined, args); });
          return Object.freeze({ fetch: invoke,
            event(kind, value) { safe(() => emit(kind, { value: value ?? null })); },
            cleanup(active) { safe(() => { emit('cleanup', { value: active }); emit('abort_requested', { aborted: controller.signal.aborted }); }); },
            applySession(value) { safe(() => { record.session = value; applied.set(value, record); emit('session_applied', {
              current: current === record, aborted: controller.signal.aborted, session_state: value.status,
              project_matches: value.status !== 'authenticated' || (project === null || value.session?.project_id === project) }); }); },
            applyInspectorRefusal(code) { safe(() => {
              record.refusalCode = code;
              record.refusal = code === 'shared_inspector_target_missing' ? 'missing'
                : code === 'shared_inspector_target_fingerprint_conflict' ? 'conflict' : 'other';
              emit('inspector_refusal_applied', { current: current === record, aborted: controller.signal.aborted, refusal: record.refusal });
            }); },
            applyInspector(value) { safe(() => { inspected.set(value, record); emit('inspector_applied', {
              current: current === record, aborted: controller.signal.aborted,
              project_matches: typeof record.session?.session?.project_id === 'string' &&
                value.inspector?.project_id === record.session.session.project_id }); }); },
          });
        }); },
        commit(session, inspector, errorCode) { safe(() => {
          const r = applied.get(session); if (!r) return;
          send({ ...r.fields, kind: 'committed', current: current === r, aborted: r.controller.signal.aborted,
            session_state: session.status, ...(r.refusal && errorCode === r.refusalCode ? {refusal:r.refusal} : {}),
            inspector_current: session.status !== 'authenticated' || inspected.get(inspector) === r ||
              (inspector === null && !!r.refusal && errorCode === r.refusalCode) });
        }); },
      });
      consumers.set(instance, observer); return observer;
    } }), writable: false, configurable: false });
  } catch { /* Observation must not change application behavior. */ }
}
