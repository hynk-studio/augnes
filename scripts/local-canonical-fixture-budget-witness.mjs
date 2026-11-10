import { createRequire } from "node:module";
import { readFileSync, lstatSync, realpathSync, existsSync } from "node:fs";
import path from "node:path";
import { comparePreparedDependencyInputs, digest, observePreparedDependencyInputs, preparedDependencyIdentity } from "./local-canonical-inputs.mjs";
import { CANONICAL_NODE_VERSION } from "./local-canonical-environment.mjs";
import { buildCanonicalChildEnvironment } from "./canonical-test-environment.mjs";
import { observePureContractSource, observePureContractLoader, pureContractGitSource } from "./local-canonical-pure-contract-witness.mjs";
import { gitRevisionInventory } from "./local-canonical-git-observation.mjs";

export const REGISTERED_FIXTURE_BUDGET = "registered-fixture-aggregate-budget-v1";
export const FIXTURE_BUDGET_CLAIM = "Measured prospective development-fixture allowance; historical cause remains UNKNOWN; neither demonstrated cure nor qualification PASS.";
export const REGISTERED_INTEGRATION_BUDGET = "registered-integration-child-budget-v1";
export const INTEGRATION_BUDGET_CLAIM = "Measured prospective external-response workload allowance. The historical timeout cause remains UNKNOWN.";
export const fixtureBudgetEvidenceClaim = kind => kind === REGISTERED_FIXTURE_BUDGET ? FIXTURE_BUDGET_CLAIM :
  kind === REGISTERED_INTEGRATION_BUDGET ? INTEGRATION_BUDGET_CLAIM : null;
export const fixtureBudgetFailurePhase = kind => kind === REGISTERED_FIXTURE_BUDGET ? "authority" :
  kind === REGISTERED_INTEGRATION_BUDGET ? "integration" : null;
export const FIXTURE_BUDGET_COLLECTOR = "scripts/capture-local-canonical-fixture-budget.mjs";
export const FIXTURE_BUDGET_PATHS = Object.freeze({
  wrapper: "scripts/test-local-canonical-review-corrections.mjs",
  suite: "scripts/run-canonical-test-suite.mjs",
  budgets: "scripts/local-canonical-closeout-budgets.mjs",
});
// Each admitted workload needs its own substantive completion grammar. This
// catalog names reusable test owners, never incidents, branches or commissions.
const owners = { "serial-aggregate": { file:"scripts/fixtures/local-canonical-serial-aggregate.mjs", tail:"serial_aggregate_controls", stages:[
  "before_imports", "setup_start", "setup_complete", "controls_start", "v2_history_complete", "immutable_setup_complete",
  "serial_driver_complete", "preparation_controls_complete", "incident_controls_complete", "publication_and_original_controls_complete",
  "execution_and_fresh_reader_start", "execution_and_fresh_reader_complete", "phase_probe_start", "phase_probe_complete",
  "tail_start", "tail_tip_complete", "tail_duplicate_complete", "tail_export_complete", "tail_original_preservation_complete",
  "tail_interrupted_reservation_complete", "cleanup_start", "cleanup_complete",
] } };
export const fixtureBudgetMeasurementStages = group => [...(owners[group]?.stages ?? [])];
// These are the existing admission owners and their controls, not workload
// exemptions. Their exact delta is separately committed for independent review.
const evidencePaths = new Set([
  "scripts/local-canonical-fixture-budget-witness.mjs", FIXTURE_BUDGET_COLLECTOR,
  "scripts/local-canonical-git-observation.mjs", "scripts/local-canonical-attempts.mjs",
  "scripts/local-canonical-pure-contract-witness.mjs", "scripts/run-local-canonical-verification.mjs",
  "scripts/local-canonical-review-export.mjs", "scripts/local-canonical-receipt.mjs",
  "scripts/fixtures/local-canonical-fixture-budget.mjs", "scripts/fixtures/local-canonical-serial-material.mjs",
  "scripts/test-local-canonical-executor.mjs", "scripts/test-local-canonical-verification-contract.mjs",
  ".github/LOCAL_CANONICAL_VERIFICATION.md",
]);
const equal = (a,b) => a !== undefined && b !== undefined && digest(a) === digest(b);
const fail = () => { throw Object.assign(new Error("revision_fixture_budget_invalid"), {code:"revision_fixture_budget_invalid"}); };
const keys = (v, expected) => v && equal(Object.keys(v).sort(), [...expected].sort());
const integer = v => Number.isSafeInteger(v) && v > 0;
let compiler;
const ts = () => compiler ??= createRequire(import.meta.url)("typescript");
const ast = source => ts().createSourceFile("owner.mjs", source, ts().ScriptTarget.Latest, true, ts().ScriptKind.JS);
function nodes(root, predicate) {
  const result=[]; const visit=n=>{if(predicate(n))result.push(n);ts().forEachChild(n,visit);};visit(root);return result;
}
function one(values) { if(values.length!==1)fail();return values[0]; }
function syntax(source) {
  const tree=ast(source);if(tree.parseDiagnostics.length)fail();
  return ts().createPrinter({removeComments:true,newLine:ts().NewLineKind.LineFeed}).printFile(tree);
}
function variable(tree,name) { return one(nodes(tree,n=>ts().isVariableDeclaration(n)&&n.name.getText(tree)===name)).initializer; }
// Parse only the owner's finite literal/conditional registration grammar. No
// historical module, callback, imported code or arbitrary expression is run.
function value(n, tree, group, constants) {
  const T=ts();
  if(T.isNumericLiteral(n))return Number(n.text);
  if(T.isStringLiteral(n))return n.text;
  if(n.kind===T.SyntaxKind.TrueKeyword)return true;
  if(n.kind===T.SyntaxKind.FalseKeyword)return false;
  if(T.isIdentifier(n)&&["name","group"].includes(n.text))return group;
  if(T.isParenthesizedExpression(n))return value(n.expression,tree,group,constants);
  if(T.isArrayLiteralExpression(n))return n.elements.map(e=>value(e,tree,group,constants));
  if(T.isPropertyAccessExpression(n)&&n.expression.getText(tree)==="AUXILIARY_EXECUTION_BUDGETS"&&Object.hasOwn(constants,n.name.text))return constants[n.name.text];
  if(T.isConditionalExpression(n))return value(value(n.condition,tree,group,constants)?n.whenTrue:n.whenFalse,tree,group,constants);
  if(T.isBinaryExpression(n)&&n.operatorToken.kind===T.SyntaxKind.EqualsEqualsEqualsToken)return value(n.left,tree,group,constants)===value(n.right,tree,group,constants);
  if(T.isPrefixUnaryExpression(n)&&n.operator===T.SyntaxKind.ExclamationToken)return !value(n.operand,tree,group,constants);
  if(T.isCallExpression(n)&&T.isPropertyAccessExpression(n.expression)&&n.expression.name.text==="includes"&&n.arguments.length===1) {
    const list=value(n.expression.expression,tree,group,constants);if(!Array.isArray(list))fail();return list.includes(value(n.arguments[0],tree,group,constants));
  }
  fail();
}
const sourceAt=(git,head,file)=>git(["show",head+":"+file]).toString();
const replaceNode=(source,tree,n,replacement)=>source.slice(0,n.getStart(tree))+replacement+source.slice(n.end);

export function registeredFixtureBudget(git,head,group) {
  if(!Object.hasOwn(owners,group))fail();
  const source=Object.fromEntries(Object.entries(FIXTURE_BUDGET_PATHS).map(([role,file])=>[role,sourceAt(git,head,file)]));
  const trees=Object.fromEntries(Object.entries(source).map(([role,text])=>[role,ast(text)]));
  const constantsNode=variable(trees.budgets,"AUXILIARY_EXECUTION_BUDGETS");
  if(!ts().isCallExpression(constantsNode)||constantsNode.expression.getText(trees.budgets)!=="Object.freeze"||constantsNode.arguments.length!==1||!ts().isObjectLiteralExpression(constantsNode.arguments[0]))fail();
  const constants={};for(const property of constantsNode.arguments[0].properties) {
    if(!ts().isPropertyAssignment(property)||!ts().isIdentifier(property.name)||!ts().isNumericLiteral(property.initializer))fail();
    if(Object.hasOwn(constants,property.name.text))fail();constants[property.name.text]=Number(property.initializer.text);
  }
  const groups=value(variable(trees.wrapper,"groups"),trees.wrapper,null,constants);
  const mapped=variable(trees.suite,"reviewedRevisionSteps");
  if(!ts().isCallExpression(mapped)||!ts().isPropertyAccessExpression(mapped.expression)||mapped.expression.name.text!=="map")fail();
  if(!equal(groups,value(mapped.expression.expression,trees.suite,null,constants))||!groups.includes(group)||new Set(groups).size!==groups.length)fail();
  const expression=(tree,identifier)=>one(nodes(tree,n=>ts().isPropertyAssignment(n)&&n.name.getText(tree)==="timeoutMs"&&n.initializer.getText(tree).includes(identifier))).initializer;
  const inner=expression(trees.wrapper,"name ==="),outer=expression(trees.suite,"group ===");
  const limits=Object.fromEntries(groups.map(name=>[name,{inner:value(inner,trees.wrapper,name,constants),outer:value(outer,trees.suite,name,constants)}]));
  if(Object.values(limits).some(v=>!integer(v.inner)||!integer(v.outer)||v.inner>=v.outer||v.outer>300000))fail();
  const mapping=mapped.getText(trees.suite);
  if(!mapping.includes('...rootNode("'+FIXTURE_BUDGET_PATHS.wrapper+'", "--reviewed-revision-controls", group)')||!mapping.includes("requireNaturalExit: true")||
      !source.wrapper.includes('await child([fixture, "--run-" + name + "-fixtures"')||
      !source.wrapper.includes('const fixture = path.join(repository, "scripts/fixtures/local-canonical-reviewed-revision.mjs")')||
      !source.wrapper.includes("assert.equal(result.exit_code, 0, lastChildDiagnostic)")||
      !source.wrapper.includes("assertReviewChildLifecycle(result, diagnostic)")||
      !source.suite.includes("revisionFocus ? suites.authority.filter(step => reviewedRevisionSteps.includes(step))")||
      !source.suite.includes("...reviewedRevisionSteps,"))fail();
  const budgetReferences=[...nodes(inner,n=>ts().isPropertyAccessExpression(n)&&n.expression.getText(trees.wrapper)==="AUXILIARY_EXECUTION_BUDGETS"),
    ...nodes(outer,n=>ts().isPropertyAccessExpression(n)&&n.expression.getText(trees.suite)==="AUXILIARY_EXECUTION_BUDGETS")].map(n=>n.name.text);
  return {group,groups,limits,source,constants,budgetReferences,normalized:{
    wrapper:syntax(replaceNode(source.wrapper,trees.wrapper,inner,"0")),
    suite:syntax(replaceNode(source.suite,trees.suite,outer,"0")),
    budgets:syntax(replaceNode(source.budgets,trees.budgets,constantsNode,"0")),
  }};
}

export function fixtureBudgetSourceDelta(git,before,after,group) {
  const old=registeredFixtureBudget(git,before,group),next=registeredFixtureBudget(git,after,group);
  if(!equal(old.normalized,next.normalized)||!equal(old.groups,next.groups))fail();
  for(const name of old.groups)if(name!==group&&!equal(old.limits[name],next.limits[name]))fail();
  const a=old.limits[group],b=next.limits[group];
  if(b.inner<=a.inner||b.outer<=a.outer||b.outer-b.inner<13000)fail();
  // A changed shared constant must be consumed by the selected registration;
  // unchanged groups above and unchanged tokens below retain their limits.
  const changedConstants=[...new Set([...Object.keys(old.constants),...Object.keys(next.constants)])].filter(key=>old.constants[key]!==next.constants[key]);
  // v1 admits newly dedicated allowances only. It cannot enlarge an existing
  // shared constant whose other consumers may have independent limits.
  if(changedConstants.some(key=>Object.hasOwn(old.constants,key)||!Object.hasOwn(next.constants,key)||
    !next.budgetReferences.includes(key)))fail();
  const paths=git(["diff","--name-only",before,after,"--"]).toString().trim().split("\n").filter(Boolean).sort();
  const workload=Object.values(FIXTURE_BUDGET_PATHS).filter(file=>paths.includes(file)).sort(), evidence=paths.filter(file=>evidencePaths.has(file));
  if(workload.length!==3||paths.some(file=>!workload.includes(file)&&!evidencePaths.has(file)))fail();
  const executor="scripts/run-local-canonical-verification.mjs";
  if(paths.includes(executor)) {
    const a=sourceAt(git,before,executor),b=sourceAt(git,after,executor),at=ast(a),bt=ast(b);
    const av=variable(at,"EXECUTOR_SOURCE_FILES"),bv=variable(bt,"EXECUTOR_SOURCE_FILES");
    if(!equal(syntax(replaceNode(a,at,av,"0")),syntax(replaceNode(b,bt,bv,"0"))))fail();
    const list=(n,tree)=>value(n.arguments[0],tree,null,{});
    if(!equal(list(av,at),list(bv,bt).filter(file=>!["scripts/local-canonical-fixture-budget-witness.mjs",FIXTURE_BUDGET_COLLECTOR].includes(file))))fail();
  }
  const delta=files=>({paths:files,sha256:digest(files.length?git(["diff","--binary","--full-index","--no-ext-diff","--no-textconv",before,after,"--",...files]):Buffer.alloc(0))});
  return {before:a,after:b,groups:next.groups,workload:delta(workload),evidence:delta(evidence)};
}

const clean = r => r?.exit_observed===true&&r.streams_closed===true&&r.cleanup_completed===true&&r.remaining_owned_processes===0;
const natural = (r,code=0) => clean(r)&&r.exit_code===code&&r.signal===null&&r.spawn_error_code===null&&r.timed_out===false&&r.cancelled===false&&r.termination_reason==="natural_exit";
const jsonLines=text=>text.split("\n").filter(line=>line.startsWith("{")&&line.endsWith("}")).map(line=>{try{return JSON.parse(line);}catch{return null;}}).filter(Boolean);

// Reconcile every observation from one real runner, not just its final summary.
// Both natural exit paths are supported; forced settlement is never natural.
function naturalLifecycle(text,{suite,label,timeout,duration,code=0}) {
  const prefix=`[canonical:${suite}] `, quoted=JSON.stringify(label);
  const selected=text.split("\n").filter(line=>line.startsWith(prefix)&&line.includes(" label="+quoted+" "));
  const events=selected.map(line=>{
    const match=line.slice(prefix.length).match(/^(child_[a-z_]+) label=("(?:[^"\\]|\\.)*") (.+)$/u);
    if(!match||match[2]!==quoted)fail();
    const fields={};for(const item of match[3].split(" ")) {
      const pair=item.match(/^([a-z_]+)=([a-zA-Z0-9_]+)$/u);
      if(!pair||Object.hasOwn(fields,pair[1]))fail();fields[pair[1]]=pair[2];
    }
    return {kind:match[1],fields};
  });
  const essential=events.filter(v=>v.kind!=="child_active"),postExit=essential.some(v=>v.kind==="child_exit");
  if(!equal(essential.map(v=>v.kind),["child_start","child_spawn",...(postExit?["child_exit"]:[]),"child_cleanup_start","child_cleanup_result","child_result"]))fail();
  let elapsed=0,stage="start",exited=false,stdoutClosed=false,stderrClosed=false;
  const bool=v=>v==="true"||v==="false";
  for(const {kind,fields:f}of events) {
    if(f.elapsed_ms!==undefined) {
      if(!/^(0|[1-9][0-9]*)$/u.test(f.elapsed_ms)||Number(f.elapsed_ms)<elapsed||Number(f.elapsed_ms)>duration)fail();elapsed=Number(f.elapsed_ms);
    }
    if(f.stdout_closed!==undefined) {
      if(!bool(f.stdout_closed)||!bool(f.stderr_closed)||stdoutClosed&&f.stdout_closed!=="true"||stderrClosed&&f.stderr_closed!=="true")fail();
      stdoutClosed=f.stdout_closed==="true";stderrClosed=f.stderr_closed==="true";
    }
    if(kind==="child_start") {if(!equal(f,{timeout_ms:String(timeout)}))fail();stage="spawn";}
    else if(kind==="child_spawn") {if(!keys(f,["pid","wait"])||!/^[1-9][0-9]*$/u.test(f.pid)||f.wait!=="process_exit")fail();stage="execution";}
    else if(kind==="child_active") {
      if(!["execution","settlement"].includes(stage)||!keys(f,["elapsed_ms","timeout_ms","exit_observed","stdout_closed","stderr_closed","wait"])||
        f.timeout_ms!==String(timeout)||f.exit_observed!==String(exited)||f.wait!==(exited?"stream_close_or_cleanup":"process_exit"))fail();
    } else if(kind==="child_exit") {
      if(!keys(f,["elapsed_ms","exit_code","signal","stdout_closed","stderr_closed"])||f.exit_code!==String(code)||f.signal!=="null")fail();exited=true;
    } else if(kind==="child_cleanup_start") {
      if(!keys(f,["elapsed_ms","reason","exit_observed","stdout_closed","stderr_closed"])||f.reason!==(postExit?"post_exit_settlement":"post_close_settlement")||
        f.exit_observed!=="true"||!postExit&&(!stdoutClosed||!stderrClosed))fail();exited=true;stage="settlement";
    } else if(kind==="child_cleanup_result") {
      if(!equal(f,{elapsed_ms:String(elapsed),reason:postExit?"post_exit_settlement":"post_close_settlement",term_sent:"false",kill_sent:"false",streams_closed:"true",remaining_owned_processes:"0"}))fail();stage="result";
    } else if(kind==="child_result") {
      if(!equal(f,{duration_ms:String(duration),exit_code:String(code),signal:"null",timed_out:"false",exit_observed:"true",streams_closed:"true",cleanup_completed:"true",remaining_owned_processes:"0",termination_reason:"natural_exit"}))fail();stage="done";
    } else fail();
  }
  return {start:selected[0],terminal:selected.find(line=>line.includes(postExit?" child_exit ":" child_cleanup_start ")),result:selected.at(-1)};
}

// Reconstruct a bounded textual instrumentation patch in memory. This is not
// git apply, checkout mutation or execution of historical diagnostic code.
function instrumentationPatch(text,git,head) {
  const parts=text.split(/(?=^diff --git )/mu).filter(Boolean), result=[];
  if(!parts.length||parts.length>4)fail();
  for(const part of parts) {
    const lines=part.split("\n"),header=lines[0].match(/^diff --git a\/(scripts\/fixtures\/[a-z0-9-]+\.mjs) b\/\1$/u);
    if(!header)fail();const file=header[1],original=sourceAt(git,head,file),old=original.split("\n"),out=[];
    let cursor=0,index=lines.findIndex(line=>line.startsWith("@@ "));
    if(index<0)fail();
    while(index<lines.length&&lines[index]) {
      const h=lines[index++].match(/^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/u);if(!h)fail();
      const start=Number(h[1])-1; if(start<cursor)fail();out.push(...old.slice(cursor,start));cursor=start;
      let removed=0,added=0;
      while(index<lines.length&&!lines[index].startsWith("@@ ")) {
        const line=lines[index++];if(line===""&&index===lines.length)break;
        if(line.startsWith(" ")) {if(old[cursor++]!==line.slice(1))fail();out.push(line.slice(1));removed++;added++;}
        else if(line.startsWith("-")){if(old[cursor++]!==line.slice(1))fail();removed++;}
        else if(line.startsWith("+")){out.push(line.slice(1));added++;}
        else fail();
      }
      if(removed!==Number(h[2]??1)||added!==Number(h[4]??1))fail();
    }
    out.push(...old.slice(cursor));result.push({file,original,instrumented:out.join("\n")});
  }
  return result;
}

export function fixtureBudgetMeasurement(reg,prior,{git,parse,bytes,completedAt}) {
  const m=reg.rationale.measurement;
  if(!keys(m,["record","stdout","lifecycle","patch","collector","observer","prefix","source_head"])||m.source_head!==prior.head||
    !/^[A-Z][A-Z0-9_]{2,39} $/u.test(m.prefix))fail();
  const record=parse(m.record),output=bytes(m.stdout,2*1024*1024).toString(),collector=bytes(m.collector,128*1024).toString(),observer=bytes(m.observer,128*1024).toString();
  if(!natural(record.result)||record.output_sha256!==digest(output)||!record.cleanup?.length||record.cleanup.some(v=>!v.completed||v.failure_count||v.failures.length)||
    !(Date.parse(completedAt)<Date.parse(record.started_at)&&Date.parse(record.started_at)<Date.parse(record.finished_at))||
    !collector.includes("scripts/fixtures/local-canonical-reviewed-revision.mjs")||!collector.includes("--run-"+reg.owner.group+"-fixtures")||!observer.includes(m.prefix.trim())||
    !bytes(m.lifecycle,128*1024).toString().includes("termination_reason=natural_exit"))fail();
  const stages=output.split("\n").filter(line=>line.startsWith(m.prefix)).map(line=>JSON.parse(line.slice(m.prefix.length)));
  const expectedStages=fixtureBudgetMeasurementStages(reg.owner.group);
  if(!expectedStages.length||!equal(stages.map(v=>v.stage),expectedStages)||stages.some((v,i)=>!keys(v,["stage","at"])||
    !/^[a-z][a-z0-9_]{1,79}$/u.test(v.stage)||!Number.isFinite(v.at)||v.at<0||i&&v.at<=stages[i-1].at)||stages.at(-1).at-stages[0].at>record.result.duration_ms)fail();
  const changed=instrumentationPatch(bytes(m.patch,128*1024).toString(),git,prior.head);
  if(!equal(record.source_instrumentation,changed.map(v=>({path:v.file,original_sha256:digest(v.original),diagnostic_sha256:digest(v.instrumented)}))))fail();
  const observedNames=new Set();
  for(const v of changed) {
    const tree=ast(v.instrumented),markers=nodes(tree,n=>ts().isExpressionStatement(n)&&n.getText(tree).startsWith("console.error("));
    let stripped=v.instrumented;
    for(const n of markers.reverse()) {
      const wanted=n.getText(tree).match(/^console\.error\("([A-Z][A-Z0-9_]{2,39} )"\s*\+\s*JSON\.stringify\(\{stage:\s*"([a-z0-9_]+)",at:\s*performance\.now\(\)\}\)\);$/u);
      if(!wanted||wanted[1]!==m.prefix)continue;
      if(observedNames.has(wanted[2]))fail();observedNames.add(wanted[2]);stripped=replaceNode(stripped,tree,n,"");
    }
    if(!equal(syntax(v.original),syntax(stripped)))fail();
  }
  if(!equal([...observedNames].sort(),expectedStages.slice(1).sort())||
    !observer.includes('stage:"'+expectedStages[0]+'"')&&!observer.includes("stage:'"+expectedStages[0]+"'"))fail();
  return {total_ms:stages.at(-1).at-stages[0].at,stages,finished_at:record.finished_at};
}
export function fixtureBudgetIncident(p,prior,focused,{git,bytes,original,completion,repositoryRoot}) {
  const reg=focused.regression,incident=reg.incident,phase=original.phases.find(v=>v.id===focused.failed_phase);
  if(focused.failed_phase!=="authority"||reg.owner?.phase!=="authority"||reg.owner?.suite!=="authority"||
      !keys(reg.owner,["phase","suite","group"])||
      original.outcome.disposition!=="product_failure"||completion.disposition!=="product_failure"||completion.cleanup_complete!==true||completion.infrastructure_code!==null||
      phase?.status!=="failure"||phase.exit_status!==1||phase.timed_out!==false||phase.cleanup?.termination_reason!=="natural_exit"||
      phase.command!=="npm run test:authority"||phase.log?.truncated!==false||
      !keys(incident,["receipt","log","log_identity","cause"])||incident.receipt!==p.prior_receipt_fingerprint||incident.cause!=="UNKNOWN")fail();
  const logBytes=bytes(incident.log,2*1024*1024),identity=incident.log_identity;
  if(!equal(identity,{relative_path:phase.log.relative_path,bytes:phase.log.bytes,sha256:digest(logBytes)})||logBytes.length!==phase.log.bytes||
      phase.log.relative_path!==`.augnes-local-verification/logs/${prior.attempt_id}/authority.log`)fail();
  const file=path.join(repositoryRoot,phase.log.relative_path),s=lstatSync(file);
  if(!s.isFile()||s.isSymbolicLink()||s.nlink!==1||(s.mode&0o022)||realpathSync(file)!==file||s.size!==logBytes.length||!readFileSync(file).equals(logBytes))fail();
  const registration=registeredFixtureBudget(git,prior.head,reg.owner.group),limit=registration.limits[reg.owner.group];
  const text=logBytes.toString(),label=JSON.stringify("reviewed revision controls: "+reg.owner.group);
  const starts=text.split("\n").filter(line=>line.startsWith("[canonical:authority] child_start label="+label+" "));
  if(!equal(starts,[`[canonical:authority] child_start label=${label} timeout_ms=${limit.outer}`]))fail();
  const records=text.split("\n").filter(line=>line.startsWith("AUGNES_REVIEW_CHILD_RESULT ")).map(line=>JSON.parse(line.slice(26)));
  const inner=one(records.filter(r=>r.control_id==="reviewed-revision-"+reg.owner.group));
  if(!clean(inner)||inner.timed_out!==true||inner.cancelled!==false||inner.spawn_error_code!==null||inner.termination_reason!=="bounded_timeout"||
      !["SIGTERM","SIGKILL"].includes(inner.signal)||inner.exit_code!==null||inner.cleanup_started!==true||inner.duration_ms<limit.inner)fail();
  const outer=one(text.split("\n").filter(line=>line.startsWith("[canonical:authority] child_result label="+label+" ")));
  if(!new RegExp('^\\[canonical:authority\\] child_result label='+label+' duration_ms=([0-9]+) exit_code=1 signal=null timed_out=false exit_observed=true streams_closed=true cleanup_completed=true remaining_owned_processes=0 termination_reason=natural_exit$','u').test(outer)||
      text.indexOf(starts[0])>=text.indexOf("AUGNES_REVIEW_CHILD_RESULT "+JSON.stringify(inner))||text.indexOf(outer)<=text.indexOf("AUGNES_REVIEW_CHILD_RESULT "+JSON.stringify(inner)))fail();
  const lifecycle=naturalLifecycle(text,{suite:"authority",label:"reviewed revision controls: "+reg.owner.group,timeout:limit.outer,duration:Number(outer.match(/ duration_ms=([0-9]+) /u)[1]),code:1});
  if(text.indexOf(lifecycle.terminal)<=text.indexOf("AUGNES_REVIEW_CHILD_RESULT "+JSON.stringify(inner)))fail();
  const failed=text.split("\n").filter(line=>line.startsWith("[canonical:authority] child_result ")&&!line.includes(" exit_code=0 "));
  const cleanup=one(jsonLines(text).filter(v=>v.suite==="authority"&&Array.isArray(v.resource_cleanup)));
  if(!equal(failed,[outer])||!cleanup.resource_cleanup.length||cleanup.resource_cleanup.some(v=>v.completed!==true||v.failure_count!==0||v.failures.length)||
      !text.includes("assertReviewChildLifecycle")||!text.includes("canonical child failed: suite=authority label=reviewed revision controls: "+reg.owner.group+" exit_code=1 signal=null"))fail();
  return {inner,limit};
}

export function fixtureBudgetEnvironment(root,ambient=process.env) { return buildCanonicalChildEnvironment({temporaryRoot:root,ambientEnvironment:ambient}); }
export function inspectCurrentFixtureBudgetInputs(root,w) {
  if(!equal(observePureContractSource(root),w.source_after)||!equal(observePureContractLoader(root),w.loader_after)||
      !equal(observePreparedDependencyInputs({repositoryRoot:root,phaseId:"dependencies-root"}),w.dependencies_after)||
      !equal(fixtureBudgetEnvironment(w.resource_root),w.environment_after)||existsSync(w.resource_root))fail();
}

export function verifyRegisteredFixtureBudget(p,prior,focused,options) {
  const {git,parse,bytes,completedAt}=options,reg=focused.regression;
  if(!keys(reg,["kind","claim","owner","incident","source_partition","rationale","after","registration"])||reg.kind!==REGISTERED_FIXTURE_BUDGET||
      p.commission.evidence_kind!==reg.kind||reg.claim!==FIXTURE_BUDGET_CLAIM||!equal(focused.input_remedy_resources,[]))fail();
  fixtureBudgetIncident(p,prior,focused,options);
  const delta=fixtureBudgetSourceDelta(git,prior.head,p.head,reg.owner.group);
  if(!equal(reg.source_partition,delta)||!keys(reg.rationale,["execution_reserve_ms","termination_grace_ms","parent_remaining_ms","judgment","contradictory_observations","measurement"])||
      reg.rationale.execution_reserve_ms!==delta.after.inner-delta.before.inner||reg.rationale.termination_grace_ms!==13000||
      reg.rationale.parent_remaining_ms!==delta.after.outer-delta.after.inner-13000||reg.rationale.parent_remaining_ms<0||
      typeof reg.rationale.judgment!=="string"||reg.rationale.judgment.length<80||reg.rationale.judgment.length>4000||
      !Array.isArray(reg.rationale.contradictory_observations)||!reg.rationale.contradictory_observations.length)fail();
  for(const historical of reg.rationale.contradictory_observations) {
    if(!keys(historical,["record","limitations"])||typeof historical.limitations!=="string"||historical.limitations.length<20)fail();
    const observation=parse(historical.record);
    const allowed=["node "+FIXTURE_BUDGET_PATHS.wrapper+" --reviewed-revision-controls "+reg.owner.group,
      "node --import tsx "+FIXTURE_BUDGET_PATHS.wrapper+" --reviewed-revision-controls "+reg.owner.group,
      "node "+FIXTURE_BUDGET_PATHS.suite+" authority --reviewed-revision-only"];
    if(observation.tested_source_head!==prior.head||!natural(observation.result)||Date.parse(observation.finished_at)<=Date.parse(completedAt)||
      !allowed.includes(observation.command)||!bytes(observation.stdout,2*1024*1024).length||!observation.source_files?.length||
      observation.source_files.some(v=>typeof v.path!=="string"||!/^([A-Za-z0-9_.-]+\/)*[A-Za-z0-9_.-]+$/u.test(v.path)||
        v.path.split("/").includes("..")||digest(git(["show",prior.head+":"+v.path]))!==v.sha256||git(["show",prior.head+":"+v.path]).length!==v.byte_size))fail();
  }
  const measured=fixtureBudgetMeasurement(reg,prior,options);
  if(measured.total_ms>=delta.after.inner)fail();
  const expected=pureContractGitSource(git,p.head).summary;
  const config=["package.json","package-lock.json","tsconfig.json","scripts/browser-verification-owners.v1.json","scripts/local-canonical-change-owners.v1.json","scripts/canonical-research-tests.v1.json"].map(file=>({path:file,sha256:digest(git(["show",p.head+":"+file]))}));
  for(const [role,ref]of [["direct",reg.after],["registered",reg.registration]]) {
    const w=parse(ref),{root_generated,...source}=w.source_before??{};
    const args=role==="direct"?["--import","tsx",FIXTURE_BUDGET_PATHS.wrapper,"--reviewed-revision-controls",reg.owner.group]:[FIXTURE_BUDGET_PATHS.suite,"authority","--reviewed-revision-only"];
    if(w.contract!=="augnes.registered-fixture-budget-witness.v1"||w.basis!=="actual-owned-development-invocation"||w.synthetic_only!==undefined||w.capture_error!==undefined||w.role!==role||w.tested_source_head!==p.head||w.tree!==p.tree||w.dirty!==""||w.command!==["node",...args].join(" ")||
        !equal(source,expected)||!Array.isArray(root_generated)||root_generated.length>1||root_generated.some(v=>!keys(v,["path","sha256"])||v.path!=="next-env.d.ts"||!/^[a-f0-9]{64}$/u.test(v.sha256))||!equal(w.source_before,w.source_after)||!equal(w.config,config)||
        !equal(w.environment_before,w.environment_after)||w.environment!==digest(w.environment_before)||!equal(w.environment_before,fixtureBudgetEnvironment(w.resource_root,w.environment_before))||
        !path.isAbsolute(w.resource_root)||!natural(w.result)||!integer(w.result.duration_ms)||
        !Array.isArray(w.owned_cleanup)||w.owned_cleanup.length!==1||w.owned_cleanup[0].root!==w.resource_root||w.owned_cleanup[0].completed!==true||w.owned_cleanup[0].failure_count!==0||w.owned_cleanup[0].failures.length||
        gitRevisionInventory(w.input_inventory_before)!==p.inputs.inventory_sha256||gitRevisionInventory(w.input_inventory_after)!==p.inputs.inventory_sha256||
        w.runtime_inputs_sha256!==p.inputs.identity_sha256||digest(w.runtime_before)!==p.inputs.identity_sha256||!equal(w.runtime_before,w.runtime_after)||w.node_version!==CANONICAL_NODE_VERSION||
        !equal(w.dependencies_before,w.dependencies_after)||preparedDependencyIdentity(w.dependencies_before).phase_id!=="dependencies-root"||
        !equal(w.loader_before,w.loader_after)||w.loader_before.path!=="node_modules/tsx/dist/loader.mjs"||
        w.loader_before.version!==JSON.parse(sourceAt(git,p.head,"package-lock.json")).packages["node_modules/tsx"].version||
        bytes(w.collector,128*1024).toString()!==sourceAt(git,p.head,FIXTURE_BUDGET_COLLECTOR)||
        !(Date.parse(measured.finished_at)<Date.parse(w.started_at)&&Date.parse(w.started_at)<Date.parse(w.finished_at)&&Date.parse(w.finished_at)<=Date.parse(focused.finished_at)))fail();
    const lifecycle=bytes(w.lifecycle,128*1024).toString();
    const limit=role==="direct"?delta.after.outer:300000;
    if(lifecycle.trimEnd().split("\n").some(line=>!line.startsWith("[canonical:fixture-budget-capture] ")||!line.includes(" label="+JSON.stringify(role+" registered fixture allowance")+" ")))fail();
    naturalLifecycle(lifecycle,{suite:"fixture-budget-capture",label:role+" registered fixture allowance",timeout:limit,duration:w.result.duration_ms});
    const output=bytes(w.stdout,2*1024*1024).toString();
    if(output.split("\n").some(line=>line.startsWith("[local-canonical-browser-use] ")))fail();
    const inner=one(output.split("\n").filter(line=>line.startsWith("AUGNES_REVIEW_CHILD_RESULT ")).map(line=>JSON.parse(line.slice(26))).filter(r=>r.control_id==="reviewed-revision-"+reg.owner.group));
    if(!natural(inner)||inner.duration_ms>=delta.after.inner)fail();
    const selected=owners[reg.owner.group],fixtureSource=sourceAt(git,p.head,selected.file),fixtureTree=ast(fixtureSource);
    const findings=nodes(fixtureTree,n=>ts().isCallExpression(n)&&n.expression.getText(fixtureTree)==="findings.push").map(n=>value(n.arguments[0],fixtureTree,null,{}));
    const tailRecord=one(jsonLines(output).filter(v=>Object.hasOwn(v,selected.tail)));
    if(!equal(tailRecord,{[selected.tail]:findings,synthetic_only:true,cleanup_owned_by_fixture:true})||!findings.length||
      output.indexOf(JSON.stringify(tailRecord))>=output.indexOf("AUGNES_REVIEW_CHILD_RESULT "+JSON.stringify(inner)))fail();
    if(role==="direct") {
      const tail=one(jsonLines(output).filter(v=>Array.isArray(v.checks)));
      if(tail.status!=="pass"||tail.cleanup_complete!==true||!tail.checks.includes("reviewed revision controls: "+reg.owner.group))fail();
    } else {
      const index=output.lastIndexOf('\n{\n  "suite":');if(index<0)fail();const tail=JSON.parse(output.slice(index));
      if(tail.status!=="pass"||tail.suite!=="authority"||tail.coverage!=="focused_reviewed_revision_children_only"||
          !equal(tail.results.map(v=>v.id),delta.groups.map(group=>"local-canonical-reviewed-revision-"+group))||
          tail.results.some(v=>v.status!==0||v.signal!==null||v.timed_out!==false||!clean(v)||v.termination_reason!=="natural_exit")||
          tail.companion_service_maintenance?.acquired===true)fail();
      const lines=output.split("\n"),starts=lines.filter(line=>line.startsWith("[canonical:authority] child_start "));
      const results=lines.filter(line=>line.startsWith("[canonical:authority] child_result "));
      if(starts.length!==delta.groups.length||results.length!==delta.groups.length)fail();
      const inventory=registeredFixtureBudget(git,p.head,reg.owner.group);
      for(const [i,group]of delta.groups.entries()) {
        const label=JSON.stringify("reviewed revision controls: "+group),result=tail.results[i];
        if(starts[i]!==`[canonical:authority] child_start label=${label} timeout_ms=${inventory.limits[group].outer}`||
          results[i]!==`[canonical:authority] child_result label=${label} duration_ms=${result.duration_ms} exit_code=0 signal=null timed_out=false exit_observed=true streams_closed=true cleanup_completed=true remaining_owned_processes=0 termination_reason=natural_exit`||
          lines.indexOf(starts[i])>=lines.indexOf(results[i])||i&&lines.indexOf(results[i-1])>=lines.indexOf(starts[i]))fail();
        naturalLifecycle(output,{suite:"authority",label:"reviewed revision controls: "+group,timeout:inventory.limits[group].outer,duration:result.duration_ms});
      }
      if(lines.some(line=>line.startsWith("[canonical:authority] ")&&!delta.groups.some(group=>line.includes(" label="+JSON.stringify("reviewed revision controls: "+group)+" "))))fail();
    }
    if(!focused.commands.some(c=>c.command===w.command&&c.tested_source_head===p.head&&equal(c.record,ref)&&equal(c.stdout,w.stdout)))fail();
  }
  return p.head;
}

const integrationChild = "scripts/test-external-response.ts";
const integrationExecutor = "scripts/run-local-canonical-verification.mjs";
const integrationCommand = "npm run test:integration -- --external-response-only";
const integrationOwner = { phase: "integration", suite: "integration", group: "external-response" };
const integrationEvidencePaths = new Set([
  "scripts/local-canonical-fixture-budget-witness.mjs", FIXTURE_BUDGET_COLLECTOR,
  "scripts/local-canonical-git-observation.mjs", "scripts/local-canonical-attempts.mjs",
  "scripts/test-local-canonical-verification-contract.mjs", ".github/LOCAL_CANONICAL_VERIFICATION.md",
]);
const recoveryOperations = [
  "populated_store_copy", "older_store_setup", "staged_migration_rollback", "rollback_and_migration_assertions",
  "recovery_backup", "recovery_restore", "restored_store_preparation", "restored_store_invariants", "restored_suspension_and_history",
];
const withdrawalCheckpoint = "withdrawn_binding_original_receipt_fresh_read_check_use_and_scoped_authority";
const recoveryCheckpoint = "nonempty_older_store_recovery_and_suspension";
const terminationGraceMs = 13000;

// A measured run may add only this reversible instrumentation. The entire
// reconstructed source must equal the accepted Git blob. These substitutions
// name the test and suite owners, not any branch, incident, or commit.
const integrationObservationEdits = {
  [FIXTURE_BUDGET_PATHS.suite]: [
    [`const projectWorkFocus = process.argv[3] === "--project-work-only";
const revisionFocus = process.argv[3] === "--reviewed-revision-only";
if (process.argv.length > 3 && (process.argv.length !== 4 ||
    !(projectWorkFocus && suiteName === "integration" || revisionFocus && suiteName === "authority")))
  throw new Error("unsupported canonical suite focus");
`, `const projectWorkFocus = process.argv[3] === "--project-work-only";
const externalResponseFocus = process.argv[3] === "--external-response-only";
const integrationFocus = projectWorkFocus || externalResponseFocus;
const revisionFocus = process.argv[3] === "--reviewed-revision-only";
if (process.argv.length > 3 && (process.argv.length !== 4 ||
    !(integrationFocus && suiteName === "integration" || revisionFocus && suiteName === "authority")))
  throw new Error("unsupported canonical suite focus");
`],
    [`    ? suites[suiteName].filter(step => ["project-work-initialization", "project-work-scoped-host"].includes(step.id))
    : revisionFocus ? suites.authority.filter(step => reviewedRevisionSteps.includes(step)) : suites[suiteName];
  const preparedSteps = selectedSteps.map((step, index) => {
`, `    ? suites[suiteName].filter(step => ["project-work-initialization", "project-work-scoped-host"].includes(step.id))
    : externalResponseFocus ? integrationInventory.filter(step => step.id === "external-response")
    : revisionFocus ? suites.authority.filter(step => reviewedRevisionSteps.includes(step)) : suites[suiteName];
  if (externalResponseFocus && selectedSteps.length !== 1)
    throw new Error("external-response integration registration is incomplete");
  const preparedSteps = selectedSteps.map((step, index) => {
`],
    [`    if (
      operator.length !== (projectWorkFocus ? 0 : 1) ||
      supporting.length !== preparedSteps.length - operator.length
`, `    if (
      operator.length !== (integrationFocus ? 0 : 1) ||
      supporting.length !== preparedSteps.length - operator.length
`],
    [`      suite: suiteName,
      maxConcurrency: projectWorkFocus ? 1 : 2,
      groups: [
        ...(projectWorkFocus ? [] : [{ id: "operator-process", children: operator }]),
        { id: "supporting-serial", children: supporting },
`, `      suite: suiteName,
      maxConcurrency: integrationFocus ? 1 : 2,
      groups: [
        ...(integrationFocus ? [] : [{ id: "operator-process", children: operator }]),
        { id: "supporting-serial", children: supporting },
`],
    [`        suite: suiteName,
        coverage: projectWorkFocus ? "focused_project_work_children_only" : revisionFocus ? "focused_reviewed_revision_children_only" : "complete_suite",
        status: "pass",
`, `        suite: suiteName,
        coverage: projectWorkFocus ? "focused_project_work_children_only" : externalResponseFocus ? "focused_external_response_child_only"
          : revisionFocus ? "focused_reviewed_revision_children_only" : "complete_suite",
        status: "pass",
`],
    [`          ? {
              concurrency_bound: projectWorkFocus ? 1 : 2,
              integration_groups: projectWorkFocus ? ["supporting-serial"] : ["operator-process", "supporting-serial"],
              child_resource_isolation: [
`, `          ? {
              concurrency_bound: integrationFocus ? 1 : 2,
              integration_groups: integrationFocus ? ["supporting-serial"] : ["operator-process", "supporting-serial"],
              child_resource_isolation: [
`],
  ],
  [integrationChild]: [
    [`let recoveryOperation: string | null = null;
const recoveryProgress = (operation: string, event: "start" | "finish") => {
  recoveryOperation = event === "start" ? operation : null;
  console.log(JSON.stringify({ recovery_operation: operation, event, elapsed_ms: Date.now() - started }));
};
function databaseState(database = db) {
`, `let recoveryOperation: string | null = null;
function recoveryObservation(fields: Record<string, unknown>) {
  const { user, system } = process.threadCpuUsage();
  console.log(JSON.stringify({
    ...fields,
    process_elapsed_ms: Math.floor(performance.now()),
    thread_cpu_us: user + system,
  }));
}
const recoveryProgress = (operation: string, event: "start" | "finish") => {
  recoveryOperation = event === "start" ? operation : null;
  recoveryObservation({ recovery_operation: operation, event, elapsed_ms: Date.now() - started });
};
let journalObservations = 0;
function observeRecoveryJournal({ phase }: { phase: string }) {
  if (++journalObservations > 32 || !/^[a-z_]{1,48}$/u.test(phase)) return;
  recoveryObservation({ recovery_operation: recoveryOperation, journal_phase: phase });
}
let backupInspections = 0;
function observeRecoveryBackupInspection(...args: Parameters<typeof inspectRecoveryDatabaseFile>) {
  const ordinal = ++backupInspections;
  if (ordinal <= 16) recoveryObservation({ recovery_validation: "backup", ordinal, event: "start" });
  const result = inspectRecoveryDatabaseFile(...args);
  if (ordinal <= 16) {
    recoveryObservation({ recovery_validation: "backup", ordinal, event: "finish", records: result.canonical_record_count });
  }
  return result;
}
function databaseState(database = db) {
`],
    [`  process.env.AUGNES_EXTERNAL_CONFIG_FILE = configPath;
  for (const p of projects) {
`, `  process.env.AUGNES_EXTERNAL_CONFIG_FILE = configPath;
  recoveryObservation({ external_response_lifecycle: "setup_complete" });
  for (const p of projects) {
`],
    [`  // remains byte-preserved until the explicit staged lifecycle prepares it.
  recoveryProgress("populated_store_copy", "start");
`, `  // remains byte-preserved until the explicit staged lifecycle prepares it.
  const cardinality = db.prepare(
    \`SELECT (SELECT count(*) FROM vnext_core_records) AS core_records,
            (SELECT count(*) FROM vnext_external_records) AS external_records\`,
  ).get() as { core_records: number; external_records: number };
  recoveryObservation({
    recovery_fixture: cardinality,
    page_count: db.pragma("page_count", { simple: true }),
    page_size: db.pragma("page_size", { simple: true }),
  });
  recoveryProgress("populated_store_copy", "start");
`],
    [`      dependencies: {
        beforeReplacement() {
`, `      dependencies: {
        afterJournalPhase: observeRecoveryJournal,
        beforeReplacement() {
`],
    [`    databaseOverrideActive: true,
  };
`, `    databaseOverrideActive: true,
    dependencies: { afterJournalPhase: observeRecoveryJournal },
  };
`],
    [`    reason: "manual_recovery",
    inspectDatabase: inspectRecoveryDatabaseFile,
  } as any);
`, `    reason: "manual_recovery",
    inspectDatabase: observeRecoveryBackupInspection,
  } as any);
`],
    [`  );
  assert.equal(validateRecoveryCanonicalDatabaseV01(db).status, "valid");
  recoveryProgress("restored_store_invariants", "finish");
`, `  );
  recoveryObservation({ recovery_validation: "restored", event: "start" });
  const validation = validateRecoveryCanonicalDatabaseV01(db);
  assert.equal(validation.status, "valid");
  recoveryObservation({ recovery_validation: "restored", event: "finish", records: validation.record_count });
  recoveryProgress("restored_store_invariants", "finish");
`],
    [`  try {
    await main();
`, `  try {
    recoveryObservation({ external_response_lifecycle: "main_start" });
    await main();
`],
    [`  } finally {
    Database.prototype.prepare = prepare;
`, `  } finally {
    recoveryObservation({ external_response_lifecycle: "cleanup_start" });
    Database.prototype.prepare = prepare;
`],
    [`    );
  }
`, `    );
    recoveryObservation({ external_response_lifecycle: "cleanup_complete" });
  }
`],
  ],
};

export function verifyIntegrationBudgetMeasurementSource(git, accepted, measured) {
  for (const [file, edits] of Object.entries(integrationObservationEdits)) {
    let source = sourceAt(git, measured, file);
    for (const [original, observed] of edits) {
      const first = source.indexOf(observed);
      if (first < 0 || first !== source.lastIndexOf(observed)) fail();
      source = source.slice(0, first) + original + source.slice(first + observed.length);
    }
    if (source !== sourceAt(git, accepted, file)) fail();
  }
}

// Historical registration is data. Never import or run the predecessor's
// executable. Normalizing the one literal leaves all other suite behavior in
// the source comparison, including the command and complete group inventory.
export function integrationBudgetRegistration(git, head) {
  const file = FIXTURE_BUDGET_PATHS.suite, source = sourceAt(git, head, file), tree = ast(source);
  const prop = (node, name) => node.properties.find(v => ts().isPropertyAssignment(v) && v.name.getText(tree) === name)?.initializer;
  const suites = variable(tree, "suites"), steps = prop(suites, "integration");
  if (!steps || !ts().isArrayLiteralExpression(steps) || steps.elements.some(v => !ts().isObjectLiteralExpression(v))) fail();
  const child = one(steps.elements.filter(v => prop(v,"id")?.getText(tree) === '"external-response"'));
  const operator = one(steps.elements.filter(v => prop(v,"group")?.getText(tree) === '"operator-process"'));
  const timeout = prop(child,"timeoutMs");
  if (!timeout || !ts().isNumericLiteral(timeout) || child.properties.some(v => !ts().isPropertyAssignment(v) && !ts().isSpreadAssignment(v)) ||
      !equal(child.properties.filter(ts().isSpreadAssignment).map(n => n.expression.getText(tree)),
      ['rootNode("' + integrationChild + '")']) || prop(child,"group")?.getText(tree) !== '"supporting-serial"' ||
      prop(child,"requireNaturalExit")?.kind !== ts().SyntaxKind.TrueKeyword ||
      !equal(child.properties.filter(ts().isPropertyAssignment).map(n => n.name.getText(tree)).sort(),
        ["group", "id", "label", "requireNaturalExit", "requirements", "timeoutMs"]) ||
      variable(tree,"rootNode").getText(tree).replace(/\s+/gu,"") !== '(...args)=>({command:process.execPath,args:["--import","tsx",...args],cwd:repoRoot,})' ||
      JSON.parse(sourceAt(git,head,"package.json")).scripts["test:integration"] !== "node " + file + " integration") fail();
  const executor = ast(sourceAt(git,head,integrationExecutor));
  const outer = nodes(executor,n => ts().isCallExpression(n) && n.expression.getText(executor) === "npmPhase" &&
    n.arguments[0]?.getText(executor) === '"integration"');
  if (outer.length !== 2 || outer.some(n => n.arguments.length !== 4 ||
      !equal(value(n.arguments[2],executor,null,{}),["run","test:integration"]) || !ts().isNumericLiteral(n.arguments[3]))) fail();
  const childMs = Number(timeout.text), parentMs = Number(outer[0].arguments[3].text);
  if (!integer(childMs) || childMs > 300000 || !integer(parentMs) ||
      Number(outer[1].arguments[3].text) !== parentMs || parentMs <= childMs + terminationGraceMs) fail();
  return {
    childMs, parentMs, label: value(prop(child,"label"),tree,null,{}), requirements: value(prop(child,"requirements"),tree,null,{}),
    operatorLabel: value(prop(operator,"label"),tree,null,{}), operatorMs: value(prop(operator,"timeoutMs"),tree,null,{}),
    normalized: syntax(replaceNode(source,tree,timeout,"0")),
  };
}

const childResultLine = (label, duration) => `[canonical:integration] child_result label=${JSON.stringify(label)} duration_ms=${duration} exit_code=0 signal=null timed_out=false exit_observed=true streams_closed=true cleanup_completed=true remaining_owned_processes=0 termination_reason=natural_exit`;
const cleanupComplete = entries => Array.isArray(entries) && entries.length > 0 &&
  entries.every(v => v.completed === true && v.failure_count === 0 && equal(v.failures,[]));
const integrationLifecycle = (lines, label, event) => lines.filter(l =>
  l.startsWith(`[canonical:integration] ${event} label=${JSON.stringify(label)} `));

export function integrationBudgetIncident(p,prior,reg,{git,bytes,original,completion}) {
  const phase = original.phases.find(v => v.id === "integration"), incident = reg.incident;
  if (original.outcome.disposition !== "product_failure" || completion.disposition !== "product_failure" ||
      completion.cleanup_complete !== true || completion.infrastructure_code !== null ||
      phase?.status !== "failure" || phase.exit_status !== 1 || phase.timed_out !== false ||
      phase.cleanup?.termination_reason !== "natural_exit" || phase.command !== "npm run test:integration" ||
      phase.log?.truncated !== false || !keys(incident,["receipt","log","log_identity","cause"]) ||
      incident.receipt !== p.prior_receipt_fingerprint || incident.cause !== "UNKNOWN") fail();
  const log = bytes(incident.log,2 * 1024 * 1024), relative = `.augnes-local-verification/logs/${prior.attempt_id}/integration.log`;
  if (phase.log.relative_path !== relative || phase.log.bytes !== log.length ||
      !equal(incident.log_identity,{relative_path:relative,bytes:log.length,sha256:digest(log)})) fail();
  const registration = integrationBudgetRegistration(git,prior.head), {label,childMs,operatorLabel,operatorMs} = registration;
  const text = log.toString(), lines = text.split("\n"), event = kind => one(integrationLifecycle(lines,label,kind));
  const start = event("child_start"), spawn = event("child_spawn"), stop = event("child_cleanup_start");
  const end = event("child_cleanup_result"), result = event("child_result");
  const stopMs = Number(stop.match(/ elapsed_ms=(\d+) reason=bounded_timeout exit_observed=false stdout_closed=false stderr_closed=false$/u)?.[1]);
  const endMs = Number(end.match(/ elapsed_ms=(\d+) reason=bounded_timeout streams_closed=true remaining_owned_processes=0$/u)?.[1]);
  if (!start.endsWith(" timeout_ms="+childMs) || !/ pid=[1-9]\d* wait=process_exit$/u.test(spawn) ||
      !(childMs <= stopMs && stopMs <= endMs && endMs <= childMs + terminationGraceMs) ||
      !["SIGTERM","SIGKILL"].some(signal => result === `[canonical:integration] child_result label=${JSON.stringify(label)} duration_ms=${endMs} exit_code=null signal=${signal} timed_out=true exit_observed=true streams_closed=true cleanup_completed=true remaining_owned_processes=0 termination_reason=bounded_timeout`) ||
      [start,spawn,stop,end,result].some((line,i,all) => i && lines.indexOf(line) <= lines.indexOf(all[i-1])) ||
      integrationLifecycle(lines,label,"child_exit").length ||
      !equal(lines.filter(l => l.startsWith("[canonical:integration] child_result ") && !l.includes(" exit_code=0 ")),[result])) fail();
  const operatorResult = one(integrationLifecycle(lines,operatorLabel,"child_result"));
  const operatorDuration = Number(operatorResult.match(/ duration_ms=(\d+) /u)?.[1]);
  naturalLifecycle(text,{suite:"integration",label:operatorLabel,timeout:operatorMs,duration:operatorDuration});
  if (lines.indexOf(operatorResult) >= lines.indexOf(start)) fail();
  const selected = lines.slice(lines.indexOf(spawn)+1,lines.indexOf(stop)).join("\n");
  const checkpoint = one(jsonLines(selected).filter(v => v.label === withdrawalCheckpoint));
  const inventory = JSON.parse(one(lines.filter(l => l.startsWith("[canonical:integration] group_inventory "))).slice("[canonical:integration] group_inventory ".length));
  const cleanup = one(jsonLines(text).filter(v => v.suite === "integration" && Array.isArray(v.resource_cleanup)));
  if (!integer(checkpoint.elapsed_ms) || checkpoint.elapsed_ms >= childMs ||
      jsonLines(selected).some(v => v.label === recoveryCheckpoint || v.test === "external-response" || v.recovery_operation && v.event === "failed") ||
      inventory.failed_count !== 1 || inventory.started_count !== inventory.settled_count ||
      !equal(inventory.children.filter(v => v.outcome === "failed"),[{group:"supporting-serial",label,started:true,settled:true,completed:true,outcome:"failed"}]) ||
      !cleanupComplete(cleanup.resource_cleanup) ||
      !text.includes("child_timed_out:supporting-serial:" + label)) fail();
  return { registration, child_duration_ms:endMs, checkpoint_ms:checkpoint.elapsed_ms, phase_duration_ms:phase.duration_ms };
}

export function integrationBudgetMeasurement(log, duration) {
  const rows = jsonLines(log).filter(v => v.process_elapsed_ms !== undefined);
  const lifecycle = rows.filter(v => v.external_response_lifecycle);
  const bounds = rows.filter(v => v.recovery_operation && v.event);
  if (!equal(lifecycle.map(v => v.external_response_lifecycle),["main_start","setup_complete","cleanup_start","cleanup_complete"]) ||
      !equal(bounds.map(v => [v.recovery_operation,v.event]), recoveryOperations.flatMap(op => [[op,"start"],[op,"finish"]])) ||
      rows.some((v,i) => !integer(v.process_elapsed_ms) || v.process_elapsed_ms > duration || !integer(v.thread_cpu_us) ||
        i && (v.process_elapsed_ms < rows[i-1].process_elapsed_ms || v.thread_cpu_us < rows[i-1].thread_cpu_us))) fail();
  const first = bounds[0], last = bounds.at(-1), fixture = one(rows.filter(v => v.recovery_fixture));
  const wall = last.process_elapsed_ms - first.process_elapsed_ms, cpu = last.thread_cpu_us - first.thread_cpu_us;
  if (!(rows.indexOf(lifecycle[1]) < rows.indexOf(fixture) && rows.indexOf(fixture) < rows.indexOf(first) &&
      rows.indexOf(last) < rows.indexOf(lifecycle[2])) || !integer(wall) || cpu < wall * 800 || cpu > (wall+1)*1000 ||
      !keys(fixture.recovery_fixture,["core_records","external_records"]) ||
      ![...Object.values(fixture.recovery_fixture),fixture.page_count,fixture.page_size].every(integer)) fail();
  const journal = rows.filter(v => v.journal_phase);
  for (const [op,checkpoints] of [
    ["staged_migration_rollback",["acquired","backup_ready","staging_ready"]],
    ["recovery_restore",["acquired","backup_ready","staging_ready","published_verified","cleanup_complete"]],
    ["restored_store_preparation",["acquired"]],
  ]) {
    const [a,b] = bounds.filter(v => v.recovery_operation === op);
    const steps = journal.filter(v => v.recovery_operation === op);
    let seen = 0;
    for (const step of steps) {
      if (rows.indexOf(step) <= rows.indexOf(a) || rows.indexOf(step) >= rows.indexOf(b)) fail();
      if (step.journal_phase === checkpoints[seen]) seen++;
    }
    if (seen !== checkpoints.length) fail();
  }
  const validation = rows.filter(v => v.recovery_validation);
  const backup = validation.filter(v => v.recovery_validation === "backup");
  const restored = validation.filter(v => v.recovery_validation === "restored");
  if (!backup.length || backup.length%2 || backup.length > 32 ||
      !equal(restored.map(v => v.event),["start","finish"]) || restored[1].records !== fixture.recovery_fixture.core_records ||
      backup.some((v,i) => v.ordinal !== Math.floor(i/2)+1 || v.event !== (i%2?"finish":"start") ||
        i%2 && v.records !== fixture.recovery_fixture.core_records)) fail();
  return {wall_ms:wall,thread_cpu_us:cpu,fixture:fixture.recovery_fixture,backup_inspections:backup.length/2};
}

function integrationCapture(ref, head, registration, p, {git,parse,bytes}) {
  const w = parse(ref), {before,after,environment} = w, root = environment?.AUGNES_CANONICAL_TEMP_ROOT;
  if (w.contract !== "augnes.registered-integration-budget-witness.v1" || w.basis !== "actual-owned-development-invocation" ||
      w.synthetic_only !== undefined || w.capture_error !== undefined || w.truncated !== false ||
      w.group !== integrationOwner.group || w.command !== integrationCommand || !natural(w.result) ||
      !cleanupComplete([w.cleanup]) || w.ownership?.capacity?.released !== true || w.ownership?.checkout?.released !== true ||
      !integer(w.result.duration_ms) || !path.isAbsolute(root ?? "") || !equal(before?.source,after?.source) ||
      !equal(before?.loader,after?.loader) || !equal(before?.runtime,after?.runtime) ||
      comparePreparedDependencyInputs(before?.dependencies,after?.dependencies) !== "unchanged" ||
      preparedDependencyIdentity(before.dependencies).phase_id !== "dependencies-root") fail();
  const expected = pureContractGitSource(git,head).summary, {root_generated,...source} = before.source;
  if (!equal(source,expected) || !Array.isArray(root_generated) || root_generated.length > 1 ||
      root_generated.some(v => !keys(v,["path","sha256"]) || v.path !== "next-env.d.ts" || !/^[a-f0-9]{64}$/u.test(v.sha256)) ||
      before.loader.path !== "node_modules/tsx/dist/loader.mjs" ||
      before.loader.version !== JSON.parse(sourceAt(git,head,"package-lock.json")).packages["node_modules/tsx"].version ||
      digest(before.runtime) !== p.inputs.identity_sha256 ||
      ![before,after].every(v => v.target.inventory === gitRevisionInventory(v.target.inputInventory) &&
        v.target.service.state.preservation_valid === true && v.target.service.diagnostics.coherent === true) ||
      before.target.inventory !== after.target.inventory ||
      !equal(before.target.service.state,after.target.service.state)) fail();
  const expectedEnvironment = fixtureBudgetEnvironment(root,environment);
  delete expectedEnvironment.NODE_ENV;
  Object.assign(expectedEnvironment,{npm_config_cache:path.join(root,"npm-cache"),npm_config_devdir:path.join(root,"node-gyp")});
  if (!equal(environment,expectedEnvironment) ||
      environment.AUGNES_CANONICAL_NODE_HEADERS_FINGERPRINT !== digest(before.runtime.headers.observation) ||
      bytes(w.collector,128*1024).toString() !== sourceAt(git,head,FIXTURE_BUDGET_COLLECTOR)) fail();
  const lifecycle = bytes(w.lifecycle,128*1024).toString(), log = bytes(w.stdout,2*1024*1024).toString();
  naturalLifecycle(lifecycle,{suite:"fixture-budget-capture",label:"integration registered fixture allowance",timeout:300000,duration:w.result.duration_ms});
  const summaryStart = log.lastIndexOf('\n{\n  "suite":');
  if (summaryStart < 0) fail();
  const tail = JSON.parse(log.slice(summaryStart+1).split("\n}",1)[0]+"\n}");
  const child = one(tail.results);
  const owned = jsonLines(log).filter(v => v.suite_resource_owned === "integration" || v.child_resource_owned === integrationOwner.group);
  const cleanup = one(jsonLines(log).filter(v => v.suite === "integration" && v.resource_cleanup));
  if (tail.suite !== "integration" || tail.coverage !== "focused_external_response_child_only" ||
      tail.status !== "pass" || tail.environment_isolation_verified !== true || tail.forbidden_environment_keys_forwarded !== 0 ||
      tail.canonical_children_checked !== 1 || tail.concurrency_bound !== 1 || !equal(tail.integration_groups,["supporting-serial"]) ||
      tail.companion_service_maintenance?.acquired !== false || tail.companion_service_maintenance?.release_completed !== true ||
      child.id !== integrationOwner.group || child.label !== registration.label || !equal(child.requirements,registration.requirements) ||
      child.group !== "supporting-serial" || child.status !== 0 || child.timed_out !== false || child.signal !== null || !clean(child) ||
      child.termination_reason !== "natural_exit" || !integer(child.duration_ms) || child.duration_ms >= registration.childMs ||
      !equal(log.split("\n").filter(l => l.startsWith("[canonical:integration] child_result ")),[childResultLine(child.label,child.duration_ms)]) ||
      owned.length !== 2 || new Set(owned.map(v => v.root)).size !== 2 ||
      owned.some(v => typeof v.root !== "string" || path.dirname(v.root) !== root) ||
      !cleanupComplete(cleanup.resource_cleanup) ||
      !equal(cleanup.resource_cleanup.map(v => v.root).sort(),owned.map(v => v.root).sort())) fail();
  naturalLifecycle(log,{suite:"integration",label:child.label,timeout:registration.childMs,duration:child.duration_ms});
  const completed = one(jsonLines(log).filter(v => v.test === "external-response"));
  if (completed.status !== "PASS" || completed.phases?.at(-1) !== recoveryCheckpoint || !completed.phases.includes(withdrawalCheckpoint) ||
      !equal(jsonLines(log).filter(v => v.recovery_operation && v.event).map(v => [v.recovery_operation,v.event]),
        recoveryOperations.flatMap(op => [[op,"start"],[op,"finish"]])) ||
      log.split("\n").some(l => l.startsWith("[local-canonical-browser-use] "))) fail();
  return {w,log,child};
}

export function verifyRegisteredIntegrationBudget(p,prior,focused,options) {
  const {git,parse,completedAt} = options, reg = focused.regression, baseline = reg.accepted_baseline;
  if (!keys(reg,["kind","claim","owner","incident","accepted_baseline","before","after"]) ||
      reg.kind !== REGISTERED_INTEGRATION_BUDGET || p.commission.evidence_kind !== reg.kind || reg.claim !== INTEGRATION_BUDGET_CLAIM ||
      !equal(reg.owner,integrationOwner) || focused.failed_phase !== "integration" || !equal(focused.input_remedy_resources,[]) ||
      !keys(baseline,["base","head","tree","receiving_review"]) || !keys(baseline.receiving_review,["id","sha256"]) ||
      !integer(baseline.receiving_review.id) || !/^[a-f0-9]{64}$/u.test(baseline.receiving_review.sha256) ||
      ![baseline.base,baseline.head,baseline.tree].every(s => /^[a-f0-9]{40}$/u.test(s)) ||
      git(["rev-parse",baseline.head+"^{tree}"]).toString().trim() !== baseline.tree) fail();
  const incident = integrationBudgetIncident(p,prior,reg,options);
  const measuredHead = parse(reg.before).before?.source.head;
  if (!/^[a-f0-9]{40}$/u.test(measuredHead ?? "") || measuredHead === p.head) fail();
  for (const [a,b] of [[prior.head,baseline.head],[baseline.base,p.base],[p.base,measuredHead],[baseline.head,measuredHead],[measuredHead,p.head]])
    git(["merge-base","--is-ancestor",a,b]);
  verifyIntegrationBudgetMeasurementSource(git,baseline.head,measuredHead);
  const original = integrationBudgetRegistration(git,measuredHead), final = integrationBudgetRegistration(git,p.head);
  const {normalized,...historical} = incident.registration;
  const {normalized:measuredSyntax,...measuredRegistration} = original;
  if (!equal(historical,measuredRegistration) || measuredSyntax !== final.normalized ||
      original.parentMs !== final.parentMs || final.childMs <= original.childMs ||
      !git(["ls-tree",p.head,"--",integrationChild]).equals(git(["ls-tree",baseline.head,"--",integrationChild])) ||
      !equal(git(["diff","--name-only",measuredHead,p.head,"--"]).toString().trim().split("\n").filter(Boolean)
        .filter(file => !integrationEvidencePaths.has(file) && file !== integrationChild),[FIXTURE_BUDGET_PATHS.suite])) fail();
  // Changes outside the workload, diagnostics and evidence owners must be
  // exact adopted-main entries, including their Git modes and deletions.
  for (const head of [measuredHead,p.head]) {
    const paths = git(["diff","--name-only",baseline.head,head,"--"]).toString().trim().split("\n").filter(Boolean);
    for (const file of paths.filter(file => !integrationEvidencePaths.has(file) && file !== integrationChild && file !== FIXTURE_BUDGET_PATHS.suite))
      if (!git(["ls-tree",head,"--",file]).equals(git(["ls-tree",p.base,"--",file]))) fail();
  }
  const before = integrationCapture(reg.before,measuredHead,original,p,options);
  const after = integrationCapture(reg.after,p.head,final,p,options);
  const measure = integrationBudgetMeasurement(before.log,before.child.duration_ms);
  if (final.childMs !== Math.ceil((original.childMs+measure.wall_ms)/10000)*10000 ||
      !integer(incident.phase_duration_ms) || incident.phase_duration_ms-incident.child_duration_ms+final.childMs+terminationGraceMs >= final.parentMs ||
      comparePreparedDependencyInputs(before.w.after.dependencies,after.w.before.dependencies) !== "unchanged" ||
      !equal(before.w.after.loader,after.w.before.loader) || after.w.after.target.inventory !== p.inputs.inventory_sha256 ||
      after.w.tested_source_head !== p.head || after.w.tree !== p.tree ||
      !(Date.parse(completedAt) < Date.parse(before.w.started_at) && Date.parse(before.w.started_at) < Date.parse(before.w.finished_at) &&
        Date.parse(before.w.finished_at) < Date.parse(after.w.started_at) && Date.parse(after.w.started_at) < Date.parse(after.w.finished_at) &&
        Date.parse(after.w.finished_at) <= Date.parse(focused.finished_at)) ||
      !focused.commands.some(c => c.command === integrationCommand && c.tested_source_head === p.head &&
        equal(c.record,reg.after) && equal(c.stdout,after.w.stdout))) fail();
  return p.head;
}

export function inspectCurrentIntegrationBudgetInputs(root, witness) {
  if (!equal(observePureContractSource(root),witness.after.source) ||
      !equal(observePureContractLoader(root),witness.after.loader) ||
      comparePreparedDependencyInputs(observePreparedDependencyInputs({repositoryRoot:root,phaseId:"dependencies-root"}),
        witness.after.dependencies) !== "unchanged" || existsSync(witness.environment.AUGNES_CANONICAL_TEMP_ROOT)) fail();
}
