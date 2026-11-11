// Shared Web Planning adapter. Each reply or terminal event settles the
// original command. Touch observations exclude command params and payloads.
const touchMethod = 'Input.dispatchTouchEvent';
const touchTypes = new Set(['touchStart', 'touchEnd', 'touchMove', 'touchCancel']);
const targetTerminals = new Set(['Inspector.detached', 'Inspector.targetCrashed']);
const commandTimeoutMs = 15000;

export class CDP {
  #terminal = null;
  #opened = null;
  #abortOpen = null;
  #closing = null;
  #observeTouch;

  constructor(url, { observeTouch } = {}) {
    this.ws = new WebSocket(url);
    this.next = 1;
    this.pending = new Map();
    this.handlers = [];
    this.#observeTouch = observeTouch;
    this.ws.addEventListener('close', event => this.#stop('socket_closed', event.code));
    this.ws.addEventListener('error', () => this.#stop('socket_error'));
    this.ws.addEventListener('message', event => this.#receive(event.data));
  }

  open() {
    if (this.#terminal) return Promise.reject(new Error('cdp_' + this.#terminal.event));
    return this.#opened ??= new Promise((resolve, reject) => {
      if (this.ws.readyState === WebSocket.OPEN) { resolve(this); return; }
      const opened = () => { this.#abortOpen = null; resolve(this); };
      this.#abortOpen = event => {
        this.ws.removeEventListener('open', opened);
        this.#abortOpen = null;
        reject(new Error('cdp_' + event));
      };
      this.ws.addEventListener('open', opened, { once: true });
    });
  }

  #receive(raw) {
    if (this.#terminal) return;
    let message;
    try { message = JSON.parse(raw); }
    catch { this.#stop('invalid_message'); return; }
    if (!message || typeof message !== 'object') { this.#stop('invalid_message'); return; }
    if (message.id) {
      this.#settle(message.id, message.error ? 'protocol_error' : 'acknowledged', message);
      return;
    }
    if (targetTerminals.has(message.method)) this.#stop(message.method);
    for (const fn of this.handlers) fn(message);
  }

  #reportTouch(command, stage, extra = {}) {
    if (!command.subtype || !this.#observeTouch) return;
    this.#observeTouch({
      id: command.id, method: touchMethod, subtype: command.subtype, stage,
      elapsed_ms: Math.round(performance.now() - command.started), ...extra,
    });
  }

  #settle(id, stage, response = null) {
    const command = this.pending.get(id);
    if (!command) return;
    clearTimeout(command.timer);
    this.pending.delete(id);
    if (stage === 'acknowledged') {
      this.#reportTouch(command, stage);
      command.resolve(response.result);
      return;
    }
    const terminal = stage === 'terminal' ? this.#terminal : null;
    const protocol = response?.error;
    const error = new Error(protocol && command.method !== touchMethod
      ? protocol.message : `cdp_${terminal?.event ?? stage}:${command.method}`);
    error.commandStack = command.commandStack;
    if (protocol && command.method !== touchMethod)
      error.cdp = { method: command.method, code: protocol.code, message: protocol.message,
        data: protocol.data ?? null, request_id: command.requestId ?? null };
    if (terminal) error.cdpTerminal = terminal;
    this.#reportTouch(command, stage, {
      ...(terminal ? { terminal } : {}),
      ...(Number.isInteger(protocol?.code) ? { protocol_code: protocol.code } : {}),
    });
    command.reject(error);
  }

  #stop(event, closeCode) {
    if (this.#terminal) return;
    this.#terminal = { event, ...(Number.isInteger(closeCode) ? { close_code: closeCode } : {}) };
    this.#abortOpen?.(event);
    for (const id of this.pending.keys()) this.#settle(id, 'terminal');
  }

  send(method, params = {}) {
    const commandStack = new Error('CDP command ' + method).stack;
    if (this.#terminal || this.ws.readyState !== WebSocket.OPEN)
      return Promise.reject(Object.assign(new Error(`cdp_${this.#terminal?.event ?? 'not_open'}:${method}`),
        { commandStack, cdpTerminal: this.#terminal }));
    const id = this.next++;
    return new Promise((resolve, reject) => {
      const command = { id, method, requestId: params.requestId, commandStack, resolve, reject,
        subtype: method === touchMethod ? (touchTypes.has(params.type) ? params.type : 'unknown') : null,
        started: performance.now(), timer: setTimeout(() => this.#settle(id, 'timeout'), commandTimeoutMs) };
      this.pending.set(id, command);
      try { this.ws.send(JSON.stringify({ id, method, params })); }
      catch { this.#settle(id, 'send_failed'); return; }
      this.#reportTouch(command, 'sent', { caller: commandStack?.split('\n').slice(1, 7).map(line => line.trim()) ?? [] });
    });
  }

  async eval(expression) {
    const r = await this.send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
    if (r.exceptionDetails) throw new Error(r.exceptionDetails.text);
    return r.result.value;
  }

  close() {
    this.#stop('closed');
    if (this.ws.readyState === WebSocket.CLOSED) return Promise.resolve();
    return this.#closing ??= new Promise(resolve => {
      this.ws.addEventListener('close', resolve, { once: true });
      if (this.ws.readyState !== WebSocket.CLOSING) this.ws.close();
    });
  }
}
