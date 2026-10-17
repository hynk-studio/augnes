import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import { CDP } from './web-planning-cdp.mjs';
import { observeWebPlanningInterceptions } from './web-planning-interception.mjs';

// Pure constructed transport controls. These test diagnostic fidelity; they do
// not reproduce or establish the cause of a real Chrome interception failure.
export async function checkWebPlanningInterceptionDiagnostics() {
  const originalSocket = globalThis.WebSocket;
  class Socket extends EventTarget {
    constructor() { super(); queueMicrotask(() => this.dispatchEvent(new Event('open'))); }
    send(raw) {
      const { id } = JSON.parse(raw);
      queueMicrotask(() => this.dispatchEvent(new MessageEvent('message', { data: JSON.stringify({ id,
        error: { code: -32602, message: 'Invalid InterceptionId.', data: 'constructed Chrome detail' } }) })));
    }
    close() { queueMicrotask(() => this.dispatchEvent(new Event('close'))); }
  }
  try {
    globalThis.WebSocket = Socket;
    const c = await new CDP('ws://constructed.invalid').open();
    await assert.rejects(c.send('Fetch.fulfillRequest', { requestId: 'paused', responseHeaders: [{ name: 'cookie', value: 'do-not-log' }], body: 'private-body' }), error => {
      assert.deepEqual(error.cdp, { method: 'Fetch.fulfillRequest', code: -32602, message: 'Invalid InterceptionId.', data: 'constructed Chrome detail', request_id: 'paused' });
      assert.match(error.commandStack, /checkWebPlanningInterceptionDiagnostics/);
      assert(!JSON.stringify(error).includes('do-not-log')); assert(!JSON.stringify(error).includes('private-body'));
      return true;
    });
    await c.close();
  } finally { globalThis.WebSocket = originalSocket; }

  const origin = 'https://127.0.0.1:12345', emitted = [];
  let rejectCommand;
  const c = { handlers: [], send(method) {
    return method === 'Fetch.continueRequest' ? new Promise((resolve, reject) => { rejectCommand = reject; }) : Promise.resolve({});
  }, close: async () => {} };
  const observation = observeWebPlanningInterceptions(c, { targetId: 'target-A', origin, emit: record => emitted.push(record) });
  const emit = (method, params) => c.handlers.forEach(fn => fn({ method, params }));
  await c.send('Fetch.enable', { patterns: [{ urlPattern: '*', requestStage: 'Request' }] });
  emit('Page.frameNavigated', { frame: { id: 'frame-A', loaderId: 'loader-A', url: origin + '/' } });
  emit('Fetch.requestPaused', { requestId: 'paused-A', networkId: 'network-A', resourceType: 'Fetch',
    request: { url: origin + '/api/work/synthetic/capacity?token=do-not-log', method: 'POST', headers: { authorization: 'do-not-log' }, postData: 'private-body' } });
  const command = c.send('Fetch.continueRequest', { requestId: 'paused-A' });
  const rejected = assert.rejects(command, error => error.message === 'Invalid InterceptionId.');
  await c.send('Fetch.enable', { patterns: [{ urlPattern: '*', requestStage: 'Response' }] });
  await c.send('Page.navigate', { url: 'about:blank' });
  observation.mark('runtime_close_requested', { runtime_origin: origin });
  emit('Network.loadingFailed', { requestId: 'network-A', errorText: 'net::ERR_ABORTED', canceled: true });
  rejectCommand(Object.assign(new Error('Invalid InterceptionId.'), { cdp: { method: 'Fetch.continueRequest', code: -32602, message: 'Invalid InterceptionId.', data: null } }));
  await rejected;
  assert.equal(emitted.length, 1);
  const e = emitted[0].web_planning_interception_failure;
  assert.equal(e.method, 'Fetch.continueRequest'); assert.equal(e.target_id, 'target-A');
  assert.equal(e.request_id, 'paused-A'); assert.equal(e.network_id, 'network-A');
  assert.equal(e.stage, 'request'); assert.equal(e.response_status, null);
  assert.equal(e.request_kind, 'background_capacity');
  assert.equal(e.acknowledgement_depended_on_request, false); assert.equal(e.product_result_depended_on_request, null);
  assert.match(e.dependency_basis, /not established by URL/);
  assert.equal(e.at_pause.fetch_pattern_generation, 1); assert.equal(e.at_failure.fetch_pattern_generation, 2);
  assert.equal(e.at_pause.current_target_url, origin + '/');
  assert(e.harness_changes_after_pause.navigation_requested && e.harness_changes_after_pause.fetch_patterns_changed && e.harness_changes_after_pause.runtime_close_requested);
  assert.equal(e.terminal_commands.length, 1); assert.equal(e.terminal_commands[0].status, 'failed');
  assert.equal(e.network_failures[0].canceled, true); assert.equal(e.ignored, false);
  assert.match(e.handler_call_stack, /checkWebPlanningInterceptionDiagnostics/);
  assert(!JSON.stringify(emitted).includes('do-not-log')); assert(!JSON.stringify(emitted).includes('private-body'));
  assert.equal(observation.summary().failures, 1); assert.equal(observation.summary().ignored_errors, 0);
  assert.equal(observation.summary().pending_commands, 0);
  await c.close(); assert.equal(observation.summary().target_generation, 1);
  return { constructed: true, chrome_failure_rethrown: true, exact_context: true, lifecycle_transitions: true, private_headers_and_bodies_excluded: true, ignored_errors: 0 };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  console.log(JSON.stringify({ web_planning_interception_diagnostics_contract: await checkWebPlanningInterceptionDiagnostics() }));
}
