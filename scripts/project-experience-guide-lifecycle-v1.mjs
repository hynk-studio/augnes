// The disposable Browser owns this ledger. Public snapshots cannot supply
// verdict evidence: the capability and original failure objects stay private.
import { randomBytes } from 'node:crypto';
export const GUIDE_LIFECYCLE_BINDING_V1 = '__augnesGuideLifecycleEventV1';
const owners = new WeakMap();
export const guideLifecycleEvidenceOwnerV1 = capability => owners.get(capability) ?? null;
const ROUTE = '/api/augnes/read/guide-brief';
const PHASE = 'project_shell_and_locked_entry';
const KINDS = new Set(['effect_setup', 'effect_cleanup', 'refresh_entered', 'read_created',
  'fetch_started', 'abort_requested', 'signal_aborted', 'abort_returned', 'headers',
  'body_started', 'body_completed', 'parsed', 'application_requested', 'committed',
  'stale_blocked', 'read_aborted', 'read_failed', 'returned']);
const KEYS = new Set(['channel', 'documentId', 'ordinal', 'event', 'consumer', 'effect', 'context',
  'target', 'read', 'controller', 'cause', 'already_aborted', 'aborted', 'same_signal',
  'request_valid', 'value', 'current', 'project_matches', 'same_controller', 'context_current']);
const integer = n => Number.isInteger(n) && n > 0 && n <= 2048;
const booleanKeys = ['already_aborted', 'aborted', 'same_signal', 'request_valid', 'current', 'project_matches', 'same_controller', 'context_current'];
const key = (session, id) => JSON.stringify([session ?? null, id]);
const signature = entry => JSON.stringify(entry);

export function createGuideLifecycleV1() {
  const channel = randomBytes(16).toString('hex'), evidence = Object.freeze({});
  const connections = new Map(), documents = new Map(), failures = new WeakMap();
  const events = [], counts = { overflow: 0, invalid: 0, installation: 0 };
  let sequence = 0;
  const stamp = fields => {
    if (events.length >= 4096) { counts.overflow++; return null; }
    const event = { sequence: ++sequence, ...fields }; events.push(event); return event;
  };
  const guard = action => { try { return action(); } catch { counts.invalid++; return null; } };
  const aliases = new Map();
  const alias = (kind, raw) => {
    if (raw == null) return null;
    const k = key(kind, raw);
    if (!aliases.has(k)) {
      if (aliases.size >= 512) { counts.overflow++; return null; }
      aliases.set(k, `${kind}-${aliases.size + 1}`);
    }
    return aliases.get(k);
  };
  const allRequests = () => [...connections.values()].flatMap(c => [...c.requests.values()]);
  const generation = request => {
    if (!request.frame) return null;
    const [documentId, read] = request.frame;
    const doc = documents.get(key(request.connectionNumber, key(request.session, documentId)));
    if (!doc) return null;
    const matches = doc.events.filter(e => e.event === 'read_created' && e.read === read);
    if (matches.length !== 1) return null;
    const created = matches[0];
    return { doc, created, events: doc.events.filter(e => e.read === read),
      consumer: doc.events.filter(e => e.consumer === created.consumer) };
  };
  owners.set(evidence, Object.freeze({ facts(entry) {
    const bound = failures.get(entry);
    if (!bound || signature(entry) !== bound.signature) return null;
    const request = bound.request, g = generation(request);
    if (!g) return null;
    const matches = allRequests().filter(r => r.frame && r.connection === request.connection && r.session === request.session &&
      r.frame[0] === request.frame[0] && r.frame[1] === request.frame[1]);
    return { request, generation: g, counts, uniqueRequest: matches.length === 1,
      candidates: allRequests().map(r => ({ request: r, generation: generation(r) })).filter(x => x.generation),
      events, sequence };
  } }));
  return Object.freeze({
    evidence,
    browserSource: () => `(${installGuideObserver.toString()})(${JSON.stringify(channel)},${JSON.stringify(GUIDE_LIFECYCLE_BINDING_V1)});`,
    installationFailed() { counts.installation++; },
    connection(identity) {
      if (connections.size >= 16 || !identity || typeof identity !== 'object') { counts.invalid++; return null; }
      const token = Object.freeze({});
      connections.set(token, { identity, number: connections.size + 1, requests: new Map(), contexts: new Map(), frames: new Map() });
      return token;
    },
    observe(token, payload, phase) { guard(() => {
      const c = connections.get(token); if (!c) { counts.invalid++; return; }
      const p = payload.params ?? {}, session = payload.sessionId ?? null;
      const protocol = { connectionNumber: c.number, session };
      // Retain this owner's causal window, not an all-phase event ring. Events
      // for an already observed request/document remain eligible after the
      // phase boundary, so a late failure or stale write cannot disappear.
      const active = phase === PHASE;
      if (payload.method === 'Runtime.executionContextCreated') {
        if (!active) return;
        if (c.contexts.size >= 128) { counts.overflow++; return; }
        const x = p.context;
        c.contexts.set(key(session, x.id), { session, frame: x.auxData?.frameId, default: x.auxData?.isDefault === true });
        stamp({ kind: 'context_created', ...protocol, context: x.id, frame: alias('frame', x.auxData?.frameId) });
      } else if (payload.method === 'Page.frameNavigated') {
        if (!active && !c.frames.has(key(session, p.frame.id))) return;
        c.frames.set(key(session, p.frame.id), p.frame.loaderId);
        stamp({ kind: 'navigation', ...protocol, frame: alias('frame', p.frame.id), loader: alias('loader', p.frame.loaderId) });
      } else if (payload.method === 'Runtime.executionContextDestroyed' || payload.method === 'Runtime.executionContextsCleared') {
        if (!active && ![...c.contexts.values()].some(ctx => ctx.session === session)) return;
        stamp({ kind: 'context_destroyed', ...protocol, context: p.executionContextId ?? null });
      } else if (payload.method === 'Runtime.bindingCalled' && p.name === GUIDE_LIFECYCLE_BINDING_V1) {
        const v = JSON.parse(p.payload), ctx = c.contexts.get(key(session, p.executionContextId));
        const id = key(c.number, key(session, v.documentId));
        if (!active && !documents.has(id)) return;
        if (v.channel !== channel || !ctx?.default || !ctx.frame ||
          !/^[a-f0-9-]{36}$/.test(v.documentId) || Object.keys(v).some(k => !KEYS.has(k)) ||
          !KINDS.has(v.event) || !integer(v.ordinal) || !integer(v.consumer) || !integer(v.effect) ||
          !/^(current-project|project-[1-9][0-9]*)$/.test(v.context) ||
          booleanKeys.some(k => v[k] !== undefined && typeof v[k] !== 'boolean') ||
          (v.target != null && !integer(v.target)) ||
          (v.value != null && typeof v.value !== 'boolean' && !(Number.isInteger(v.value) && v.value >= 100 && v.value <= 599)) ||
          (v.cause !== undefined && !['initial_effect', 'explicit_refresh', 'cleanup', 'supersede'].includes(v.cause)) ||
          (v.read !== undefined && (!integer(v.read) || v.controller !== v.read))) { counts.invalid++; return; }
        let doc = documents.get(id);
        if (!doc) {
          if (documents.size >= 32) { counts.overflow++; return; }
          doc = { id, context: p.executionContextId, frame: ctx.frame, loader: c.frames.get(key(session, ctx.frame)),
            ordinal: 0, events: [], invalid: false };
          documents.set(id, doc);
        }
        if (doc.context !== p.executionContextId || doc.frame !== ctx.frame || !doc.loader ||
          v.ordinal !== doc.ordinal + 1 || doc.events.length >= 512) { doc.invalid = true; counts.invalid++; return; }
        doc.ordinal = v.ordinal;
        const { channel: unused, ...fields } = v;
        const event = stamp({ kind: 'consumer', ...protocol, ...fields });
        if (event) doc.events.push(event);
      } else if (payload.method === 'Network.requestWillBeSent') {
        if (!active) return;
        const url = new URL(p.request?.url);
        if (url.pathname !== ROUTE) return;
        if (c.requests.size >= 64) { counts.overflow++; return; }
        const frames = []; let stack = p.initiator?.stack;
        for (let depth = 0; stack && depth < 16; depth++, stack = stack.parent) frames.push(...(stack.callFrames ?? []));
        const prefix = `augnes-guide/${channel}/`;
        const pins = frames.filter(f => f.url?.startsWith(prefix)).map(f => f.url.slice(prefix.length).split('/'));
        const frame = pins.length === 1 && /^[a-f0-9-]{36}$/.test(pins[0][0]) && integer(Number(pins[0][1]))
          ? [pins[0][0], Number(pins[0][1])] : null;
        const requestKey = key(session, p.requestId), existing = c.requests.get(requestKey);
        if (existing) existing.invalid = true;
        const request = { ...protocol, protocolIdentity: { connection: c.identity, session, request: p.requestId },
          connection: token, frame, frameId: p.frameId, loaderId: p.loaderId, phase,
          path: ROUTE, local: ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname), method: p.request.method,
          explicitProject: !!url.searchParams.get('project_id'),
          hook: frames.some(f => /(?:^|\/)components\/guide\/use-project-guide-brief-v0-2\.ts(?:\?|$)/.test(f.url)),
          invalid: !!existing || p.redirectResponse != null || pins.length > 1,
          sequence: stamp({ kind: 'request_start', ...protocol, request: alias('request', key(c.number, requestKey)),
            frame: alias('frame', p.frameId), loader: alias('loader', p.loaderId), owner: frame ? 'guide_hook' : 'unbound_comparison_or_other', phase })?.sequence,
          response: null, finished: null, failure: null };
        c.requests.set(requestKey, request);
      } else if (['Network.responseReceived', 'Network.loadingFinished', 'Network.loadingFailed'].includes(payload.method)) {
        const r = c.requests.get(key(session, p.requestId)); if (!r) return;
        const event = stamp({ kind: payload.method, ...protocol, phase,
          request: alias('request', key(c.number, key(session, p.requestId))), status: p.response?.status ?? null,
          canceled: typeof p.canceled === 'boolean' ? p.canceled : null,
          error: p.errorText == null ? null : p.errorText === 'net::ERR_ABORTED' ? p.errorText : 'other_network_failure' });
        if (!event) return;
        if ((p.frameId && p.frameId !== r.frameId) || (p.loaderId && p.loaderId !== r.loaderId)) r.invalid = true;
        if (payload.method === 'Network.responseReceived') {
          if (r.response || r.failure || new URL(p.response.url).pathname !== ROUTE) r.invalid = true;
          r.response = event;
        } else if (payload.method === 'Network.loadingFinished') {
          if (r.finished || r.failure) r.invalid = true;
          r.finished = event;
        } else {
          if (r.failure || r.finished) r.invalid = true;
          r.failure = event;
        }
      }
    }); },
    bindFailure(token, payload, entry) { guard(() => {
      const c = connections.get(token), r = c?.requests.get(key(payload.sessionId, payload.params?.requestId));
      if (r?.failure) failures.set(entry, { request: r, signature: signature(entry) });
    }); },
    snapshot() { return structuredClone({ schema: 'augnes.guide-lifecycle-observation.v1', authority: 'diagnostic_only_no_verdict',
      scope: 'locked-entry causal window plus later events for retained requests/documents',
      counts, complete: Object.values(counts).every(x => x === 0), events: events.map(e => ({ ...e, session: alias('session', key(e.connectionNumber, e.session)) })) }); },
  });
}

function installGuideObserver(channel, binding) {
  try {
    if (typeof window[binding] !== 'function' || !['localhost', '127.0.0.1', '[::1]'].includes(location.hostname)) return;
    const documentId = crypto.randomUUID(), consumers = new WeakMap(), contexts = new Map();
    let ordinal = 0, consumerCount = 0, readCount = 0;
    const safe = fn => { try { return fn(); } catch { return null; } };
    const context = value => { const k = value ?? null; if (!contexts.has(k)) contexts.set(k, k === null ? 'current-project' : `project-${contexts.size + 1}`); return contexts.get(k); };
    const send = fields => safe(() => {
      if (ordinal < 512) window[binding](JSON.stringify({ channel, documentId, ordinal: ++ordinal, ...fields }));
      else if (ordinal++ === 512) window[binding](JSON.stringify({ channel, documentId, ordinal, event: 'overflow' }));
    });
    Object.defineProperty(window, '__augnesGuideLifecycleV1', { value: Object.freeze({ consumer(instance) {
      if (consumers.has(instance)) return consumers.get(instance);
      const consumer = ++consumerCount, controllers = new WeakMap(), applied = new WeakMap();
      let effect = 0, initial = false, project = null, current = null;
      const emit = (event, fields = {}) => send({ event, consumer, effect, context: project, ...fields });
      const observer = Object.freeze({
        setup(projectId) { safe(() => { effect++; project = context(projectId); emit('effect_setup'); }); },
        initial(active) { initial = active; },
        abort(controller, cause) { safe(() => {
          const r = controller && controllers.get(controller);
          emit(cause === 'cleanup' ? 'effect_cleanup' : 'refresh_entered', { target: r?.id ?? null });
          r?.emit('abort_requested', { cause, already_aborted: controller.signal.aborted });
        }); },
        abortReturned(controller) { safe(() => controllers.get(controller)?.emit('abort_returned', { aborted: controller.signal.aborted })); },
        read(controller, projectId) { return safe(() => {
          const id = ++readCount, readEffect = effect, readContext = context(projectId);
          const emitRead = (event, fields = {}) => emit(event, { read: id, controller: id, effect: readEffect, context: readContext, ...fields });
          const record = { id, controller, emit: emitRead }; controllers.set(controller, record); current = record;
          emitRead('read_created', { cause: initial ? 'initial_effect' : 'explicit_refresh' });
          controller.signal.addEventListener('abort', () => emitRead('signal_aborted'), { once: true });
          // Calls the original fetch synchronously, with identical arguments and
          // receiver, returning its exact Promise; no handler/timer/body reads.
          const invoke = Function('run', `return function(...args) { return run(...args); };\n//# sourceURL=augnes-guide/${channel}/${documentId}/${id}`)(
            (...args) => {
              safe(() => { const url = new URL(args[0], location.href), options = args[1];
                emitRead('fetch_started', { same_signal: options?.signal === controller.signal,
                  request_valid: url.origin === location.origin && url.pathname === '/api/augnes/read/guide-brief' &&
                    url.searchParams.get('scope') === 'project:augnes' && !!projectId && url.searchParams.get('project_id') === projectId &&
                    options.method === 'GET' && options.cache === 'no-store' && options.credentials === 'same-origin' &&
                    options.headers?.['x-augnes-local-readonly'] === 'guide-brief-v0.2' }); });
              return Reflect.apply(window.fetch, undefined, args);
            });
          return Object.freeze({ fetch: invoke,
            event(event, value) { safe(() => emitRead(event, { value: value ?? null })); },
            apply(value) { safe(() => { applied.set(value, record); emitRead('application_requested', {
              current: current === record, aborted: controller.signal.aborted,
              project_matches: !!projectId && value.identity?.project_id === projectId }); }); },
          });
        }); },
        commit(value, controller, projectId) { safe(() => {
          const r = value && applied.get(value);
          if (r) r.emit('committed', { current: r === current, same_controller: controller === r.controller,
            aborted: r.controller.signal.aborted, context_current: project === context(projectId) });
        }); },
      });
      consumers.set(instance, observer); return observer;
    } }), writable: false, configurable: false });
  } catch { /* Observation cannot change the application outcome. */ }
}
