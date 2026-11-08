// Execute the actual checkSession callback and its owning effect from source.
// Other SemanticReviewSurface rendering is outside this focused regression.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import vm from 'node:vm';
const ts = createRequire(import.meta.url)('typescript');
const text = readFileSync(new URL('../components/workbench/semantic-review/semantic-review-surface.tsx', import.meta.url), 'utf8');
const source = ts.createSourceFile('component.tsx', text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
const component = source.statements.find(n => ts.isFunctionDeclaration(n) && n.name?.text === 'ScopedSemanticReviewSurface');
const statements = component.body.statements;
const index = statements.findIndex(n => ts.isVariableStatement(n) && n.declarationList.declarations.some(d => d.name.getText(source) === 'checkSession'));
assert(index >= 0);
assert.match(statements[index + 1].getText(source), /^useEffect\(/);
const code = ts.transpileModule(statements[index].getText(source) + '\n' + statements[index + 1].getText(source),
  { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText;
const tick = () => new Promise(resolve => setImmediate(resolve));
function fixture() {
  const requests = [], states = []; let effect, privateReads = 0;
  vm.runInNewContext(code, {
    useCallback: fn => fn, useEffect: fn => { effect = fn; }, queueMicrotask,
    SESSION_ROUTE: '/api/vnext/operator/session',
    updateSessionState: value => states.push(value), setPrivateView() {}, setPrivateError() {},
    publicErrorCode: value => value ?? 'unknown', loadPrivateView: async () => { privateReads++; },
    fetch(url, init) {
      let resolve, reject; const promise = new Promise((a,b) => {resolve=a;reject=b;});
      requests.push({url,init,resolve,reject}); return promise;
    },
  });
  return { requests, states, setup:()=>effect(), privateReads:()=>privateReads };
}
const response = (status=200, body={status:'authenticated',session:{project_id:'current'}}) =>
  ({status,ok:status===200,json:async()=>body});
const replay = fixture();
replay.setup()?.(); replay.setup(); await tick();
assert.equal(replay.requests.length,1,'disposed replay effect must not issue a redundant session request');
replay.requests[0].resolve(response(403,{error_code:'operator_session_project_mismatch'})); await tick();
assert.equal(replay.states.at(-1).status,'locked'); assert.equal(replay.privateReads(),0);
const disposed = fixture(); disposed.setup()?.(); await tick();
assert.equal(disposed.requests.length,0,'unmounted queued effect must perform no read');
for (const obsoleteError of [false,true]) {
  const f=fixture(); const cleanup=f.setup(); await tick(); cleanup(); f.setup(); await tick();
  const before=f.states.length;
  if(obsoleteError) f.requests[0].reject(Error('obsolete network failure'));
  else f.requests[0].resolve(response(200,{status:'authenticated',session:{project_id:'obsolete'}}));
  await tick(); assert.equal(f.states.length,before,'disposed result/error must not change current state'); assert.equal(f.privateReads(),0);
  f.requests[1].resolve(response()); await tick();
  assert.equal(f.states.at(-1).session.project_id,'current'); assert.equal(f.privateReads(),1);
}
for (const kind of ['network','body','body_abort']) {
  const f=fixture(); f.setup(); await tick();
  if(kind==='network')f.requests[0].reject(Error('current network failure'));
  else f.requests[0].resolve({...response(),json:async()=>{throw kind==='body_abort' ? new DOMException('current body failure','AbortError') : Error('current body failure');}});
  await tick(); assert.equal(f.states.at(-1).error_code,'operator_session_request_failed'); assert.equal(f.privateReads(),0);
}
console.log(JSON.stringify({test:'operator-session-request-boundary-v1',status:'pass',actual_callback_and_effect:true,
  replay_reads:1,disposed_before_read:0,obsolete_result_and_error_controls:2,current_failure_controls:3,
  scope:'selected source callback/effect; complete Browser owner remains required'}));
