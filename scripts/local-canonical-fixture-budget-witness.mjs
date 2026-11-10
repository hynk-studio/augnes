import { createRequire } from "node:module";
import { readFileSync, lstatSync, realpathSync, existsSync } from "node:fs";
import path from "node:path";
import { digest, observePreparedDependencyInputs, preparedDependencyIdentity } from "./local-canonical-inputs.mjs";
import { CANONICAL_NODE_VERSION } from "./local-canonical-environment.mjs";
import { buildCanonicalChildEnvironment } from "./canonical-test-environment.mjs";
import { observePureContractSource, observePureContractLoader, pureContractGitSource } from "./local-canonical-pure-contract-witness.mjs";
import { gitRevisionInventory } from "./local-canonical-git-observation.mjs";

export const REGISTERED_FIXTURE_BUDGET = "registered-fixture-aggregate-budget-v1";
export const FIXTURE_BUDGET_CLAIM = "Measured prospective development-fixture allowance; historical cause remains UNKNOWN; neither demonstrated cure nor qualification PASS.";
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
  return compareFixtureBudgetSource(git,before,after,
    registeredFixtureBudget(git,before,group),registeredFixtureBudget(git,after,group));
}

function compareFixtureBudgetSource(git,before,after,old,next) {
  const group=old.group;
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
  return {inner,limit,registration};
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
  const {registration:historical}=fixtureBudgetIncident(p,prior,focused,options);
  // Each registration is pinned to its Git commit. Share these observations
  // within this verification and reread them on the next invocation.
  const candidate=registeredFixtureBudget(git,p.head,reg.owner.group);
  const delta=compareFixtureBudgetSource(git,prior.head,p.head,historical,candidate);
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
      for(const [i,group]of delta.groups.entries()) {
        const label=JSON.stringify("reviewed revision controls: "+group),result=tail.results[i];
        if(starts[i]!==`[canonical:authority] child_start label=${label} timeout_ms=${candidate.limits[group].outer}`||
          results[i]!==`[canonical:authority] child_result label=${label} duration_ms=${result.duration_ms} exit_code=0 signal=null timed_out=false exit_observed=true streams_closed=true cleanup_completed=true remaining_owned_processes=0 termination_reason=natural_exit`||
          lines.indexOf(starts[i])>=lines.indexOf(results[i])||i&&lines.indexOf(results[i-1])>=lines.indexOf(starts[i]))fail();
        naturalLifecycle(output,{suite:"authority",label:"reviewed revision controls: "+group,timeout:candidate.limits[group].outer,duration:result.duration_ms});
      }
      if(lines.some(line=>line.startsWith("[canonical:authority] ")&&!delta.groups.some(group=>line.includes(" label="+JSON.stringify("reviewed revision controls: "+group)+" "))))fail();
    }
    if(!focused.commands.some(c=>c.command===w.command&&c.tested_source_head===p.head&&equal(c.record,ref)&&equal(c.stdout,w.stdout)))fail();
  }
  return p.head;
}
