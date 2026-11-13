import path from "node:path";
import { digest, inputEventIdentity, classifyInputChange, nonFaultInputChange } from "./local-canonical-inputs.mjs";
import { PROJECT_EXPERIENCE_SERIAL, PROJECT_EXPERIENCE_COMMITMENT, PROJECT_EXPERIENCE_ENVELOPE_MS, projectExperienceElapsed } from "./project-experience-serial-budget.mjs";
import { validProjectExperienceConnection } from "./project-experience-connection.mjs";
import { BROWSER_IDENTITY_PREFIX, parseBrowserUseLine, validBrowserUse } from "./local-canonical-browser-identity.mjs";
import { usesDeclaredIntegrationBase } from "./local-canonical-integration-base.mjs";

export const MATERIAL_STOCK_PREDECESSOR = "settled-browser-timeout-stock-verifier-v1";
const phaseId = "e2e-project-experience", outerOwner = "[canonical:local-full] ";
const equal = (a,b) => a !== undefined && b !== undefined && digest(a) === digest(b);
const sha = value => /^[a-f0-9]{64}$/u.test(value ?? "");
const keys = (value,names) => value && !Array.isArray(value) && equal(Object.keys(value).sort(),[...names].sort());
const finite = value => Number.isFinite(value) && value >= 0;
const fail = () => { throw Object.assign(new Error("revision_stock_predecessor_invalid"), {code:"revision_stock_predecessor_invalid"}); };
const checked = new WeakMap();

export const isStockVerifierRevision = p => p?.schema === "augnes.local-canonical-source-correction.v7" && p.kind === "reviewed_revision" &&
  p.commission?.source_revision === "material-source-correction-v1" && p.commission.evidence_kind === "git-config-stock-verifier-repair-v1";

// This transient result carries no execution authority. A proof cannot supply
// an unchecked boolean to relax the historical phase reader.
export function verifiedStockPredecessor(value,receipt,stock) {
  const bound = value && checked.get(value);
  return !!bound && bound.receipt === digest(receipt) && bound.stock === digest(stock);
}

function only(lines,prefix) {
  const found = lines.filter(line=>line.startsWith(prefix));
  if(found.length!==1)fail();
  return found[0];
}

function accounting(value,phase,childResult=false) {
  const children=PROJECT_EXPERIENCE_SERIAL.children;
  if(value?.contract!==PROJECT_EXPERIENCE_SERIAL.contract || value.commitment!==PROJECT_EXPERIENCE_COMMITMENT ||
    value.completed_children!==3 || value.complete!==false ||
    value.failure_code!==(childResult?"serial_child_execution_budget_exceeded":"serial_execution_incomplete") ||
    !Array.isArray(value.execution_ms)||value.execution_ms.length!==4||!Array.isArray(value.natural_settlement_ms)||value.natural_settlement_ms.length!==4||
    value.execution_ms.some((n,i)=>!finite(n)||(i<3?n<=0:n!==0)||(i<2&&n>children[i].timeoutMs))||
    value.natural_settlement_ms.some((n,i)=>!finite(n)||n>PROJECT_EXPERIENCE_SERIAL.naturalSettlementPerChildMs||(i===3&&n!==0))||
    !finite(value.coordinator_ms)||value.coordinator_ms>PROJECT_EXPERIENCE_SERIAL.coordinatorMs||
    value.envelope_elapsed_ms!==projectExperienceElapsed(value)||value.envelope_elapsed_ms>PROJECT_EXPERIENCE_ENVELOPE_MS)fail();
  // The serial and process owners start separate monotonic clocks. Keep their
  // observations separate; summing them need not equal the rounded runner time.
  if(!childResult && (value.parent_forced_terminal_cleanup_ms!==null||!finite(value.parent_post_exit_settlement_ms)))fail();
}

// One bounded original capture is needed to establish the native truncated
// prefix. Only this selected historical case reads up to 5 MiB. The separate
// <=64 KiB terminal slice is an exact byte range, never reconstructed output.
function terminalOriginal(p,original,incident,{bytes,git}) {
  if(!keys(incident,["contract","receipt","cause","interrupted_operation","native_log","outer_capture","terminal_slice","git_metadata"])||
    incident.contract!==MATERIAL_STOCK_PREDECESSOR||incident.receipt!==p.prior_receipt_fingerprint||
    incident.cause!=="UNKNOWN"||incident.interrupted_operation!=="UNKNOWN")fail();
  const phase=original.phases.find(v=>v.id===phaseId),native=incident.native_log,outer=incident.outer_capture,slice=incident.terminal_slice;
  if(!keys(native,["artifact","relative_path","bytes","truncated"])||!keys(outer,["artifact","original_path","bytes"])||
    !keys(slice,["artifact","offset","bytes"])||
    native.relative_path!==`.augnes-local-verification/logs/${original.run.id}/${phaseId}.log`||
    phase?.log?.relative_path!==native.relative_path||phase.log.truncated!==true||native.truncated!==true||
    phase.log.bytes!==native.bytes||native.bytes!==2*1024*1024||phase.label!=="Canonical project experience Browser owner"||
    phase.command!=="node scripts/run-canonical-test-suite.mjs e2e-project-experience"||phase.cwd_scope!=="root"||phase.browser!==true||phase.exclusive!==true||
    typeof outer.original_path!=="string"||!path.isAbsolute(outer.original_path)||outer.original_path.length>4096||
    !Number.isSafeInteger(outer.bytes)||outer.bytes<=native.bytes||outer.bytes>5*1024*1024||
    !Number.isSafeInteger(slice.offset)||slice.offset<0||!Number.isSafeInteger(slice.bytes)||slice.bytes<1||slice.bytes>64*1024)fail();
  const capture=bytes(outer.artifact,5*1024*1024),capped=bytes(native.artifact,2*1024*1024),tail=bytes(slice.artifact,64*1024);
  if(capture.length!==outer.bytes||capped.length!==native.bytes||tail.length!==slice.bytes||slice.offset+tail.length!==capture.length||
    !tail.equals(capture.subarray(slice.offset))||slice.offset>0&&capture[slice.offset-1]!==10)fail();
  const text=capture.toString("utf8");
  if(!Buffer.from(text).equals(capture))fail();
  const lines=text.split("\n"),label=JSON.stringify(phase.label),inner=`[canonical:${phaseId}] `;
  const start=only(lines,`[local-canonical] phase_start id=${phaseId} `),finish=only(lines,`[local-canonical] phase_result id=${phaseId} `);
  const begin=lines.indexOf(start),end=lines.indexOf(finish);
  if(start!==`[local-canonical] phase_start id=${phaseId} timeout_ms=${PROJECT_EXPERIENCE_ENVELOPE_MS}`||
    finish!==`[local-canonical] phase_result id=${phaseId} status=failure duration_ms=${phase.duration_ms}`||begin>=end||
    only(lines,"[local-canonical] start ")!=="[local-canonical] start mode=full selected_plan=full-canonical"||
    only(lines,"[local-canonical] base=")!==`[local-canonical] base=${original.repository.base_sha}`||
    only(lines,"[local-canonical] head=")!==`[local-canonical] head=${original.repository.head_sha}`||
    only(lines,"[local-canonical] receipt=")!==`[local-canonical] receipt=.augnes-local-verification/receipts/${original.run.id}.json fingerprint=${original.integrity.content_fingerprint}`||
    original.run.invocation_id!==phase.invocation_id||phase.head_sha!==original.repository.head_sha||phase.base_sha!==original.repository.base_sha)fail();
  const observed=original.phases.filter(value=>value.status!=="not_run"),phaseStarts=lines.filter(line=>line.startsWith("[local-canonical] phase_start "));
  const phaseEnds=lines.filter(line=>line.startsWith("[local-canonical] phase_result "));
  if(phaseStarts.length!==observed.length||phaseEnds.length!==observed.length)fail();
  let previousPhase=-1;
  for(const [i,value]of observed.entries()){
    const at=lines.indexOf(phaseStarts[i]),done=lines.indexOf(phaseEnds[i]);
    if(!phaseStarts[i].startsWith(`[local-canonical] phase_start id=${value.id} timeout_ms=`)||
      phaseEnds[i]!==`[local-canonical] phase_result id=${value.id} status=${value.status} duration_ms=${value.duration_ms}`||
      !(previousPhase<at&&at<done))fail();
    previousPhase=done;
  }
  const part=lines.slice(begin+1,end),owners=part.filter(line=>line.startsWith(outerOwner));
  const fixed=owners.filter(line=>!line.startsWith(outerOwner+"child_active "));
  const outerExit=Number(fixed[2]?.match(/ elapsed_ms=(\d+) /u)?.[1]);
  if(fixed.length!==6||fixed[0]!==`${outerOwner}child_start label=${label} timeout_ms=${PROJECT_EXPERIENCE_ENVELOPE_MS}`||
    !Number.isSafeInteger(outerExit)||outerExit<0||outerExit>phase.duration_ms||
    !new RegExp(`^\\[canonical:local-full\\] child_spawn label=${label} pid=[1-9]\\d* wait=process_exit$`,"u").test(fixed[1])||
    fixed[2]!==`${outerOwner}child_exit label=${label} elapsed_ms=${Number(fixed[2]?.match(/ elapsed_ms=(\d+) /u)?.[1])} exit_code=1 signal=null stdout_closed=true stderr_closed=true`||
    fixed[3]!==`${outerOwner}child_cleanup_start label=${label} elapsed_ms=${Number(fixed[2]?.match(/ elapsed_ms=(\d+) /u)?.[1])} reason=post_exit_settlement exit_observed=true stdout_closed=true stderr_closed=true`||
    fixed[4]!==`${outerOwner}child_cleanup_result label=${label} elapsed_ms=${phase.duration_ms} reason=post_exit_settlement term_sent=false kill_sent=false streams_closed=true remaining_owned_processes=0`||
    fixed[5]!==`${outerOwner}child_result label=${label} duration_ms=${phase.duration_ms} exit_code=1 signal=null timed_out=false exit_observed=true streams_closed=true cleanup_completed=true remaining_owned_processes=0 termination_reason=natural_exit`)fail();
  if(owners[0]!==fixed[0]||owners[1]!==fixed[1]||!equal(owners.slice(owners.indexOf(fixed[2])),fixed.slice(2)))fail();
  let activeAt=-1;
  for(const row of owners.filter(line=>line.startsWith(outerOwner+"child_active "))){
    const at=Number(row.match(/ elapsed_ms=(\d+) /u)?.[1]);
    if(!Number.isSafeInteger(at)||at<=activeAt||at>=phase.duration_ms||row!==`${outerOwner}child_active label=${label} elapsed_ms=${at} timeout_ms=${PROJECT_EXPERIENCE_ENVELOPE_MS} exit_observed=false stdout_closed=false stderr_closed=false wait=process_exit`)fail();
    activeAt=at;
  }
  if(part.some(line=>line.startsWith("[local-canonical] ")))fail();
  const projected=Buffer.from(part.filter(line=>!line.startsWith(outerOwner)).join("\n")+"\n");
  if(!projected.subarray(0,capped.length).equals(capped)||projected.length<=capped.length)fail();
  const starts=part.filter(line=>line.startsWith(inner+"child_start ")),results=part.filter(line=>line.startsWith(inner+"child_result "));
  if(starts.length!==3||results.length!==3)fail();
  let previous=-1;
  const durations=[];
  for(let i=0;i<3;i++){
    const child=PROJECT_EXPERIENCE_SERIAL.children[i],q=JSON.stringify(child.label),duration=Number(results[i].match(/ duration_ms=(\d+) /u)?.[1]);
    const a=part.indexOf(starts[i]),b=part.indexOf(results[i]);durations.push(duration);
    if(starts[i]!==`${inner}child_start label=${q} timeout_ms=${child.timeoutMs}`||!(previous<a&&a<b)||!Number.isSafeInteger(duration)||duration<=0||
      (i<2?duration>child.timeoutMs:duration<child.timeoutMs)||results[i]!==`${inner}child_result label=${q} duration_ms=${duration} exit_code=${i<2?0:143} signal=null timed_out=${i===2} exit_observed=true streams_closed=true cleanup_completed=true remaining_owned_processes=0 termination_reason=${i<2?"natural_exit":"bounded_timeout"}`)fail();
    const section=part.slice(a,b+1),cleanStart=only(section,inner+"child_cleanup_start "),cleanEnd=only(section,inner+"child_cleanup_result ");
    const cleanAt=Number(cleanStart.match(/ elapsed_ms=(\d+) /u)?.[1]),cleanDone=Number(cleanEnd.match(/ elapsed_ms=(\d+) /u)?.[1]),reason=i<2?"post_exit_settlement":"bounded_timeout";
    if(!Number.isSafeInteger(cleanAt)||!Number.isSafeInteger(cleanDone)||cleanAt<0||cleanDone<cleanAt||cleanDone>duration||
      cleanDone-cleanAt>PROJECT_EXPERIENCE_SERIAL.naturalSettlementPerChildMs||duration-cleanDone>PROJECT_EXPERIENCE_SERIAL.naturalSettlementPerChildMs||
      cleanStart!==`${inner}child_cleanup_start label=${q} elapsed_ms=${cleanAt} reason=${reason} exit_observed=${i<2} stdout_closed=${i<2} stderr_closed=${i<2}`||
      cleanEnd!==`${inner}child_cleanup_result label=${q} elapsed_ms=${cleanDone} reason=${reason} ${i<2?"term_sent=false kill_sent=false ":""}streams_closed=true remaining_owned_processes=0`||
      section.indexOf(cleanStart)>=section.indexOf(cleanEnd))fail();
    previous=b;
  }
  const terminalStart=only(part,inner+`child_cleanup_start label=${JSON.stringify(PROJECT_EXPERIENCE_SERIAL.children[2].label)} `);
  if(slice.offset!==capture.indexOf(Buffer.from(terminalStart+"\n")))fail();
  const budgetLines=part.filter(line=>line.startsWith('{"serial_budget":')),budgets=budgetLines.map(line=>JSON.parse(line).serial_budget);
  if(budgets.length!==1)fail();accounting(budgets[0],phase,true);accounting(phase.serial_budget,phase);
  if(budgets[0].execution_ms[2]<PROJECT_EXPERIENCE_SERIAL.children[2].timeoutMs||budgets[0].execution_ms[2]>durations[2])fail();
  const uses=part.filter(line=>line.startsWith(BROWSER_IDENTITY_PREFIX)).map(parseBrowserUseLine);
  const browser=original.inputs.resources.find(v=>v.id==="browser-executable");
  if(!equal(uses,phase.browser_use)||!equal(uses.map(v=>v?.consumer),["project-experience","project-client","project-client"])||uses.some(v=>!validBrowserUse(v,browser)))fail();
  const cleanupLines=part.filter(line=>line.startsWith('{"suite":"'+phaseId+'","resource_cleanup":'));
  const cleanups=cleanupLines.map(line=>JSON.parse(line).resource_cleanup);
  if(cleanups.length!==1||cleanups[0].length!==5||new Set(cleanups[0].map(v=>v.root)).size!==5||cleanups[0].some(v=>
    !path.isAbsolute(v.root??"")||v.completed!==true||v.failure_count!==0||!equal(v.failures,[])))fail();
  const suiteLines=part.filter(line=>line.startsWith('{"suite_resource_owned":'));
  const childLines=part.filter(line=>line.startsWith('{"child_resource_owned":'));
  if(suiteLines.length!==1||childLines.length!==4)fail();
  const suite=JSON.parse(suiteLines[0]),children=childLines.map(line=>JSON.parse(line));
  if(!keys(suite,["suite_resource_owned","root","device","inode"])||suite.suite_resource_owned!==phaseId||
    !path.isAbsolute(suite.root??"")||path.normalize(suite.root)!==suite.root||!/^ag-suite-/u.test(path.basename(suite.root))||
    !/^\d+$/u.test(suite.device??"")||!/^\d+$/u.test(suite.inode??"")||
    !equal(children.map(v=>v.child_resource_owned),PROJECT_EXPERIENCE_SERIAL.children.map(v=>v.id))||
    children.some((v,i)=>!keys(v,["child_resource_owned","root","device","inode"])||!path.isAbsolute(v.root??"")||path.normalize(v.root)!==v.root||
      path.dirname(v.root)!==path.dirname(suite.root)||!path.basename(v.root).startsWith("ag-c0"+(i+1)+"-")||
      v.device!==suite.device||!/^\d+$/u.test(v.inode??""))||
    new Set([suite,...children].map(v=>v.inode)).size!==5||
    !equal(cleanups[0].map(v=>v.root),[...children.map(v=>v.root),suite.root]))fail();
  const ownedOrder=[suiteLines[0],...childLines].map(line=>part.indexOf(line));
  if(ownedOrder.some((at,i)=>at<0||(i>0&&at<=ownedOrder[i-1])||at>=part.indexOf(starts[0]))||
    !(previous<part.indexOf(cleanupLines[0])&&part.indexOf(cleanupLines[0])<part.indexOf(budgetLines[0])&&part.indexOf(budgetLines[0])<part.indexOf(fixed[2])))fail();
  const after=lines.slice(end);
  if(after.filter(line=>line.startsWith("[local-canonical] phase_")).length!==1||after[1]!==`[local-canonical] failure phase=${phaseId} code=serial_execution_incomplete`||
    after[2]!=="[local-canonical] cleanup_start"||
    after[3]!=="[local-canonical] cleanup_result completed=true remaining_owned_processes=0 generated_next_present_after_execution_cleanup=false generated_next_present_after_service_restore=false generated_windows_helper_present=false"||
    after[4]!==`[local-canonical] receipt=.augnes-local-verification/receipts/${original.run.id}.json fingerprint=${original.integrity.content_fingerprint}`||
    after[5]!==`[local-canonical] final result=failure deciding=false duration_ms=${original.run.duration_ms}`||after.slice(6).some(Boolean))fail();
  if(!validProjectExperienceConnection(git(["show",original.repository.head_sha+":scripts/run-canonical-test-suite.mjs"]).toString(),
    git(["show",original.repository.head_sha+":scripts/run-local-canonical-verification.mjs"]).toString())||
    !equal(git(["show",original.repository.head_sha+":scripts/project-experience-serial-budget.mjs"]),git(["show",p.head+":scripts/project-experience-serial-budget.mjs"])))fail();
}

export function verifyStockVerifierPredecessor(p,prior,focused,{original,stock,bytes,git,inventory,stockComparison,stockContract}) {
  if(!isStockVerifierRevision(p)||!usesDeclaredIntegrationBase(original)||p.base!==original.repository.base_sha||
    typeof inventory!=="function"||typeof stockComparison!=="function"||stockContract!=="complete-git-config-current-stock-v1"||
    prior.source_correction?.commission?.source_revision!=="material-source-correction-v1"||
    prior.source_correction.commission.ordinal!==1||prior.source_correction.commission.maximum_invocations!==1||
    original.phases?.find(v=>v.status==="failure")?.id!==phaseId)fail();
  const incident=focused.predecessor;
  terminalOriginal(p,original,incident,{bytes,git});
  const rows=original.inputs.events.filter(e=>e.resource==="git-config"),observed=rows.at(-1),before=original.inputs.resources.find(v=>v.id==="git-config");
  if(rows.length!==1||!keys(incident.git_metadata,["resource","event_identity","before_inventory_sha256","observed_inventory_sha256"])||
    incident.git_metadata.resource!=="git-config"||observed.disposition!=="ambient_observation"||observed.identity!==inputEventIdentity(observed)||
    observed.classification!==before.classification||classifyInputChange(before.before,observed.after,before,original.inputs)!==observed.disposition)fail();
  let last=-1n;
  for(const event of original.inputs.events){
    const role=original.inputs.resources.find(v=>v.id===event.resource);
    if(!role||!nonFaultInputChange(event.disposition)||event.identity!==inputEventIdentity(event)||event.classification!==role.classification||
      classifyInputChange(role.before,event.after,role,original.inputs)!==event.disposition||!/^\d+$/u.test(event.monotonic_ns)||BigInt(event.monotonic_ns)<=last||
      !(Date.parse(original.run.started_at)<=Date.parse(event.observed_at)&&Date.parse(event.observed_at)<=Date.parse(original.run.finished_at)))fail();
    last=BigInt(event.monotonic_ns);
  }
  const current=structuredClone(original.inputs);current.resources.find(v=>v.id==="git-config").before=observed.after;
  const comparison=stockComparison(original.inputs,current,stockContract);
  if(!comparison.equivalent||comparison.exact||inventory(original.inputs)!==prior.source_correction.inputs.inventory_sha256||
    incident.git_metadata.event_identity!==observed.identity||incident.git_metadata.before_inventory_sha256!==comparison.expected_inventory_sha256||
    incident.git_metadata.observed_inventory_sha256!==comparison.current_inventory_sha256||!stock.issues?.includes("receipt_attempt_records_unverified"))fail();
  const value=Object.freeze({contract:MATERIAL_STOCK_PREDECESSOR,receipt:original.integrity.content_fingerprint});
  checked.set(value,{receipt:digest(original),stock:digest(stock)});return value;
}
