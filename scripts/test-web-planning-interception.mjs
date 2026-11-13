import assert from 'node:assert/strict';
import { mock } from 'node:test';
import { pathToFileURL } from 'node:url';
import { CDP, downloadBrowserFiles } from './web-planning-cdp.mjs';
import { observeWebPlanningInterceptions } from './web-planning-interception.mjs';

class ControlledSocket extends EventTarget {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;
  readyState = ControlledSocket.CONNECTING;
  sent = [];
  constructor() {
    super();
    queueMicrotask(() => {
      if (this.readyState !== ControlledSocket.CONNECTING) return;
      this.readyState = ControlledSocket.OPEN;
      this.dispatchEvent(new Event('open'));
    });
  }
  send(raw) {
    if (this.failSend) throw new Error('private socket detail');
    this.sent.push(JSON.parse(raw));
  }
  message(data) {
    this.dispatchEvent(new MessageEvent('message', { data: JSON.stringify(data) }));
  }
  remoteClose(code) {
    this.readyState = ControlledSocket.CLOSED;
    this.dispatchEvent(Object.assign(new Event('close'), { code, reason: 'private socket detail' }));
  }
  close() {
    if (this.readyState >= ControlledSocket.CLOSING) return;
    this.readyState = ControlledSocket.CLOSING;
    queueMicrotask(() => this.remoteClose(1000));
  }
}

export async function checkWebPlanningTouchTransport() {
  const originalSocket = globalThis.WebSocket;
  const commands = [], method = 'Input.dispatchTouchEvent';
  const create = () => new CDP('ws://constructed.invalid', { observeTouch: event => commands.push(event) });
  const outcome = promise => promise.then(value => ({ value }), error => ({ error }));
  const nextTurn = () => new Promise(resolve => setImmediate(() => resolve({ pending: true })));
  globalThis.WebSocket = ControlledSocket;
  mock.timers.enable({ apis: ['setTimeout'] });
  try {
    const remote = await create().open();
    const pending = outcome(remote.send(method, { type: 'touchStart', touchPoints: [{ x: 1, y: 1 }] }));
    const id = remote.ws.sent[0].id;
    remote.ws.remoteClose(1001);
    const closed = await Promise.race([pending, nextTurn()]);
    assert.equal(closed.error?.message, 'cdp_socket_closed:' + method, 'peer close must settle the original command before the response timeout');
    assert.deepEqual(closed.error.cdpTerminal, { event: 'socket_closed', close_code: 1001 });
    assert.match(closed.error.commandStack, /checkWebPlanningTouchTransport/);
    await Promise.all([remote.close(), remote.close()]);
    remote.ws.message({ id, result: {} });
    assert.equal(remote.pending.size, 0);
    assert.deepEqual(commands.splice(0).map(e => [e.subtype, e.stage]), [['touchStart', 'sent'], ['touchStart', 'terminal']]);

    const target = await create().open();
    for (const subtype of ['touchStart', 'touchEnd']) {
      const reply = target.send(method, { type: subtype, private: 'private touch params' });
      const sent = target.ws.sent.at(-1);
      target.ws.message({ id: sent.id + 100, result: {} });
      assert.equal(target.pending.size, 1, 'a response with another id cannot acknowledge a touch');
      target.ws.message({ id: sent.id, result: {} });
      await reply;
    }
    assert.deepEqual(commands.splice(0).map(e => [e.subtype, e.stage]), [
      ['touchStart','sent'],['touchStart','acknowledged'],['touchEnd','sent'],['touchEnd','acknowledged'],
    ]);
    const protocol = outcome(target.send(method, { type: 'touchStart' }));
    target.ws.message({ id: target.ws.sent.at(-1).id,
      error: { code: -32602, message: 'private touch detail', data: 'private target detail' } });
    assert.equal((await protocol).error.message, 'cdp_protocol_error:' + method);
    assert.equal(commands.at(-1).protocol_code, -32602);
    const lost = outcome(target.send(method, { type: 'touchEnd' }));
    mock.timers.tick(14999);
    assert.equal(target.pending.size, 1);
    mock.timers.tick(1);
    const timedOut = (await lost).error;
    assert.equal(timedOut.message, 'cdp_timeout:' + method);
    assert.match(timedOut.commandStack, /checkWebPlanningTouchTransport/);
    target.ws.message({ id: target.ws.sent.at(-1).id, result: {} });
    assert.equal(commands.at(-1).stage, 'timeout');
    await target.close();

    for (const terminal of ['Inspector.detached', 'Inspector.targetCrashed', 'socket_error']) {
      const tab = await create().open();
      const command = outcome(tab.send(method, { type: 'touchEnd', private: 'private touch params' }));
      if (terminal === 'socket_error') tab.ws.dispatchEvent(new Event('error'));
      else tab.ws.message({ method: terminal, params: { reason: 'private target detail' } });
      assert.equal((await command).error.cdpTerminal.event, terminal);
      assert.equal(tab.pending.size, 0);
      await tab.close();
    }
    const neverOpened = create();
    const opened = outcome(neverOpened.open());
    neverOpened.ws.remoteClose(1006);
    assert.equal((await opened).error.message, 'cdp_socket_closed');
    await neverOpened.close();
    const cannotSend = await create().open();
    cannotSend.ws.failSend = true;
    await assert.rejects(cannotSend.send(method, { type: 'touchStart' }), { message: 'cdp_send_failed:' + method });
    assert.equal(cannotSend.pending.size, 0);
    await cannotSend.close();
    assert.doesNotMatch(JSON.stringify(commands), /private (socket|target|touch)/u);
    return { constructed: true, response_timeout_ms: 15000, reply_id_matched: true, peer_close: true,
      target_detach_and_crash: true, socket_error: true, close_before_open: true, failed_send: true,
      late_reply_ignored: true, private_payloads_excluded: true, touch_protocol_error_sanitized: true, cleanup_complete: true };
  } finally {
    mock.timers.tick(15000);
    mock.timers.reset();
    globalThis.WebSocket = originalSocket;
  }
}

// Pure constructed transport controls. These test diagnostic fidelity; they do
// not reproduce or establish the cause of a real Chrome interception failure.
export async function checkWebPlanningInterceptionDiagnostics() {
  const originalSocket = globalThis.WebSocket;
  class Socket extends ControlledSocket {
    send(raw) {
      const { id } = JSON.parse(raw);
      queueMicrotask(() => this.dispatchEvent(new MessageEvent('message', { data: JSON.stringify({ id,
        error: { code: -32602, message: 'Invalid InterceptionId.', data: 'constructed Chrome detail' } }) })));
    }
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

// Constructed download protocol controls, paired with the retained real Chrome
// byte-read failure and focused four-file run. These are not historical replay.
export async function checkWebPlanningDownloadCompletion() {
  const other=()=>{},client={handlers:[other],async send(method,params){
    assert.equal(method,'Browser.setDownloadBehavior');assert.equal(params.eventsEnabled,true);
  }};
  const emit=(method,params)=>client.handlers.forEach(fn=>fn({method,params}));
  const begin=(guid,name)=>emit('Browser.downloadWillBegin',{guid,suggestedFilename:name});
  const progress=(guid,state)=>emit('Browser.downloadProgress',{guid,state});
  let checks=0;
  await downloadBrowserFiles(client,'constructed-downloads',['a.txt','b.txt'],async predicate=>{
    assert.equal(predicate(),false,'file creation/in-progress is not completion');checks++;
    progress('foreign','completed');assert.equal(predicate(),false,'unmatched GUID cannot settle an expected name');checks++;
    progress('a','completed');assert.equal(predicate(),false,'every requested download must complete');checks++;
    progress('b','completed');assert.equal(predicate(),true);checks++;
  },async()=>{begin('a','a.txt');begin('b','b.txt');progress('a','inProgress');},'constructed pair');
  assert.deepEqual(client.handlers,[other]);
  await downloadBrowserFiles(client,'constructed-downloads',['a.txt'],async predicate=>{
    assert.equal(predicate(),false,'a previous operation cannot satisfy a new download of the same name');checks++;
    progress('new-a','completed');assert.equal(predicate(),true);
  },async()=>begin('new-a','a.txt'),'fresh operation');
  await assert.rejects(downloadBrowserFiles(client,'constructed-downloads',['a.txt'],async predicate=>predicate(),
    async()=>{begin('cancelled','a.txt');progress('cancelled','canceled');},'cancelled'),/browser_download_canceled:a.txt/);
  assert.deepEqual(client.handlers,[other]);
  const fault=new Error('constructed trigger failure');
  await assert.rejects(downloadBrowserFiles(client,'constructed-downloads',['a.txt'],async()=>{},async()=>{throw fault;},'trigger'),e=>e===fault);
  assert.deepEqual(client.handlers,[other]);
  client.send=async()=>{throw fault;};
  await assert.rejects(downloadBrowserFiles(client,'constructed-downloads',['a.txt'],async()=>{},async()=>{},'setup'),e=>e===fault);
  assert.deepEqual(client.handlers,[other]);
  return {constructed:true,real_browser:false,readiness_checks:checks,exact_guid_and_all_names:true,
    cancellation_refused:true,fresh_operation:true,setup_and_trigger_failures_preserved:true,handlers_released:true};
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  console.log(JSON.stringify({ web_planning_touch_transport_contract: await checkWebPlanningTouchTransport() }));
  console.log(JSON.stringify({ web_planning_interception_diagnostics_contract: await checkWebPlanningInterceptionDiagnostics() }));
  console.log(JSON.stringify({ web_planning_download_completion_contract: await checkWebPlanningDownloadCompletion() }));
}
