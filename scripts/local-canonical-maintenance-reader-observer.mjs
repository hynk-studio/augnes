// Closed source grammar for retained read-only operation diagnostics.
// Legacy private observer identifiers preserve original bytes, not task authority.
import {createRequire} from "node:module";
let compiler;
const typescript=()=>compiler??=createRequire(import.meta.url)("typescript");
const literal=value=>"\'"+value.replaceAll("\\","\\\\").replaceAll("\'","\\\'")+"\'";
const loaderTemplate=String.raw`import fs from 'node:fs';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
const root=__READER_ROOT_LITERAL__;
const T=createRequire(root+'/package.json')('typescript');
const targets=new Map([
  ['test-local-canonical-maintenance.mjs',['reviewedIntegrationControls','failedIntegrationMaintenanceControls','successfulMaintenanceIntegrationControls','authorityTimestampControls','prepareTrees']],
  ['local-canonical-maintenance.mjs',['readMaintenanceEvidence']],
  ['local-canonical-failed-integration-fixture.mjs',['readFailedIntegrationFixtureIncident','partitionSource','partitionPositives','retainedFailure']],
  ['local-canonical-fixture-budget-witness.mjs',['registeredFixtureBudget','maintenanceFixtureBudgetRegistration','syntax','ast']],
]);
const hash=x=>createHash('sha256').update(x).digest('hex');
let sample;
export function initialize(data){sample=data.sample;}
export async function load(url,context,nextLoad){
  const result=await nextLoad(url,context);
  const prefix='file://'+root+'/scripts/';
  if(!url.startsWith(prefix)||!targets.has(url.slice(prefix.length)))return result;
  const name=url.slice(prefix.length),source=String(result.source),tree=T.createSourceFile(name,source,T.ScriptTarget.Latest,true,T.ScriptKind.JS),edits=[],found=[];
  function visit(n){
    let identifier,body;
    if(T.isFunctionDeclaration(n)&&n.name){identifier=n.name.text;body=n.body;}
    if(T.isVariableDeclaration(n)&&T.isIdentifier(n.name)&&n.initializer&&T.isArrowFunction(n.initializer)){identifier=n.name.text;body=n.initializer.body;}
    if(targets.get(name).includes(identifier)){
      if(!body)throw Error('missing profile body '+identifier);
      found.push(identifier);
      const label=JSON.stringify(identifier);
      if(T.isBlock(body)){
        edits.push([body.getStart(tree)+1,body.getStart(tree)+1,'const __r15Frame=globalThis.__r15Profiler.enter('+label+');try{']);
        edits.push([body.end-1,body.end-1,'}finally{globalThis.__r15Profiler.leave(__r15Frame);}']);
      }else{
        edits.push([body.getStart(tree),body.end,'globalThis.__r15Profiler.sync('+label+',()=>('+source.slice(body.getStart(tree),body.end)+'))']);
      }
    }
    T.forEachChild(n,visit);
  }
  visit(tree);
  if(found.length!==targets.get(name).length)throw Error('profile target mismatch '+name);
  let transformed=source;
  for(const [start,end,text]of edits.sort((a,b)=>b[0]-a[0]))transformed=transformed.slice(0,start)+text+transformed.slice(end);
  fs.appendFileSync(new URL('./'+sample+'.profile-transform.jsonl',import.meta.url),JSON.stringify({url,original_sha256:hash(source),transformed_sha256:hash(transformed),functions:found})+'\n');
  return {...result,source:transformed};
}
`;
const observerTemplate=String.raw`import fs from 'node:fs';
import cp from 'node:child_process';
import {register,syncBuiltinESMExports} from 'node:module';
const sample=process.argv.at(-1),trace=new URL('./'+sample+'.profile.jsonl',import.meta.url);
const now=()=>performance.now();
const emit=row=>fs.appendFileSync(trace,JSON.stringify({...row,elapsed_ms:now()})+'\n');
const stack=[],totals=new Map();let id=0;
const activeOperation=()=>[...stack].reverse().find(x=>x.name==='readMaintenanceEvidence');
const publicFrame=f=>({id:f.id,parent_id:f.parent_id,name:f.name,operation_id:f.operation_id,duration_ms:now()-f.started,child_ms:f.child_ms});
globalThis.__r15Profiler={
  enter(name){
    const parent=stack.at(-1),f={id:++id,parent_id:parent?.id??null,name,started:now(),child_ms:0,operation_id:activeOperation()?.id??null};
    if(name==='readMaintenanceEvidence'){f.operation_id=f.id;f.git=new Map();f.metrics=new Map();}
    stack.push(f);
    if(name==='readMaintenanceEvidence'||name.endsWith('Controls'))emit({event:'start',...publicFrame(f)});
    return f;
  },
  leave(f){
    if(stack.pop()!==f)throw Error('profile stack mismatch');
    const duration=now()-f.started,parent=stack.at(-1);if(parent)parent.child_ms+=duration;
    const target=totals.get(f.name)??{count:0,duration_ms:0};target.count++;target.duration_ms+=duration;totals.set(f.name,target);
    const op=f.name==='readMaintenanceEvidence'?f:activeOperation();
    if(op){const metric=op.metrics.get(f.name)??{count:0,duration_ms:0};metric.count++;metric.duration_ms+=duration;op.metrics.set(f.name,metric);}
    if(f.name==='readMaintenanceEvidence'||f.name.endsWith('Controls'))emit({event:'end',...publicFrame(f),...(f.git?{git:[...f.git.values()],metrics:Object.fromEntries(f.metrics)}:{})});
  },
  sync(name,fn){const f=this.enter(name);try{return fn();}finally{this.leave(f);}},
};
const original=cp.execFileSync;
cp.execFileSync=function(command,args,options){
  const op=activeOperation(),start=now();
  try{return original.apply(this,arguments);}
  finally{
    if(command==='git'&&op){
      const key=JSON.stringify([options?.cwd,args]),row=op.git.get(key)??{cwd:options?.cwd,args,count:0,duration_ms:0,immutable_blob:args?.at(-2)==='show'&&/^[a-f0-9]{40}:.+/u.test(args?.at(-1)??'')};
      row.count++;row.duration_ms+=now()-start;op.git.set(key,row);
    }
  }
};
syncBuiltinESMExports();
register(new URL(__READER_LOADER_LITERAL__,import.meta.url),{data:{sample}});
emit({event:'bootstrap',pid:process.pid,node:process.version,scope:'current process only; cold children remain independent and uninstrumented'});
process.on('exit',code=>emit({event:'exit',code,totals:Object.fromEntries(totals),open_frames:stack.map(publicFrame)}));
`;
export const maintenanceReaderProfileLoader=root=>loaderTemplate.replace("__READER_ROOT_LITERAL__",literal(root));
export const maintenanceReaderProfileObserver=loader=>observerTemplate.replace("__READER_LOADER_LITERAL__",literal("./"+loader));

export const maintenanceReaderProfileTargets=Object.freeze({
  "test-local-canonical-maintenance.mjs":["reviewedIntegrationControls","failedIntegrationMaintenanceControls","successfulMaintenanceIntegrationControls","authorityTimestampControls","prepareTrees"],
  "local-canonical-maintenance.mjs":["readMaintenanceEvidence"],
  "local-canonical-failed-integration-fixture.mjs":["readFailedIntegrationFixtureIncident","partitionSource","partitionPositives","retainedFailure"],
  "local-canonical-fixture-budget-witness.mjs":["registeredFixtureBudget","maintenanceFixtureBudgetRegistration","syntax","ast"],
});

// Reconstruct only the retained timing transform, never execute old source.
export function transformMaintenanceReaderProfile(name,source){
  const T=typescript();
  if(!Object.hasOwn(maintenanceReaderProfileTargets,name))throw Error("maintenance_reader_profile_target_invalid");
  const tree=T.createSourceFile(name,source,T.ScriptTarget.Latest,true,T.ScriptKind.JS),edits=[],found=[];
  function visit(n){
    let identifier,body;
    if(T.isFunctionDeclaration(n)&&n.name){identifier=n.name.text;body=n.body;}
    if(T.isVariableDeclaration(n)&&T.isIdentifier(n.name)&&n.initializer&&T.isArrowFunction(n.initializer)){identifier=n.name.text;body=n.initializer.body;}
    if(maintenanceReaderProfileTargets[name].includes(identifier)){
      if(!body)throw Error("maintenance_reader_profile_body_invalid");found.push(identifier);const label=JSON.stringify(identifier);
      if(T.isBlock(body)){
        edits.push([body.getStart(tree)+1,body.getStart(tree)+1,'const __r15Frame=globalThis.__r15Profiler.enter('+label+');try{']);
        edits.push([body.end-1,body.end-1,'}finally{globalThis.__r15Profiler.leave(__r15Frame);}']);
      }else edits.push([body.getStart(tree),body.end,'globalThis.__r15Profiler.sync('+label+',()=>('+source.slice(body.getStart(tree),body.end)+'))']);
    }
    T.forEachChild(n,visit);
  }
  visit(tree);
  if(found.length!==maintenanceReaderProfileTargets[name].length)throw Error("maintenance_reader_profile_target_invalid");
  let transformed=source;for(const[start,end,text]of edits.sort((a,b)=>b[0]-a[0]))transformed=transformed.slice(0,start)+text+transformed.slice(end);
  return {transformed,functions:found};
}

// Finite accepted source transformation; all other bytes remain identical.
// It separates immutable-work reuse, checkout-domain repair and added controls.
const remedyChanges={
  "scripts/local-canonical-attempts.mjs": [
    [
      "stockReceipt.verification_context?.checkout_fingerprint",
      "stockReceipt.checkout_ownership?.checkout_fingerprint"
    ]
  ],
  "scripts/local-canonical-failed-integration-fixture.mjs": [
    [
      "function partitionPositives(part,receipt,p,runtime,{read,git}) {\n",
      "function partitionPositives(part,receipt,p,runtime,actual,{read,git}) {\n"
    ],
    [
      "  const actual=registeredFixtureBudget(git,part.source_head,\"serial-aggregate\");\n  keys(registration,\"group_count groups limits old25_preserved\");\n",
      "  keys(registration,\"group_count groups limits old25_preserved\");\n"
    ],
    [
      "  let latest=partitionPositives(part,receipt,p,runtime,{read,git});\n",
      "  // partitionSource already validated this immutable registration in this read.\n  let latest=partitionPositives(part,receipt,p,runtime,registrations.after,{read,git});\n"
    ]
  ],
  "scripts/local-canonical-maintenance.mjs": [
    [
      "  const git=args=>execFileSync(\"git\",[\"--no-replace-objects\",...args],{cwd:root,timeout:10000,maxBuffer:16*1024*1024,stdio:[\"ignore\",\"pipe\",\"pipe\"]});\n",
      "  // Reuse only immutable full-commit blob bytes in this one reader operation.\n  // Mutable Git queries, artifact seals, live inputs and the next reader still\n  // observe afresh. Copies prevent a consumer from modifying retained bytes.\n  const blobs=new Map();let retainedBytes=0;\n  const git=args=>{\n    const spec=args.length===2&&args[0]===\"show\"&&/^[a-f0-9]{40}:.+/u.test(args[1])?args[1]:null;\n    if(spec&&blobs.has(spec))return Buffer.from(blobs.get(spec));\n    const bytes=execFileSync(\"git\",[\"--no-replace-objects\",...args],{cwd:root,timeout:10000,maxBuffer:16*1024*1024,stdio:[\"ignore\",\"pipe\",\"pipe\"]});\n    if(spec&&blobs.size<128&&retainedBytes+bytes.length<=16*1024*1024){blobs.set(spec,Buffer.from(bytes));retainedBytes+=bytes.length;}\n    return bytes;\n  };\n"
    ]
  ],
  "scripts/test-local-canonical-maintenance.mjs": [
    [
      "import { createHash } from \"node:crypto\";\nimport { syncBuiltinESMExports } from \"node:module\";\nimport { createCanonicalTestResourceRoot, buildCanonicalChildEnvironment, cleanupCanonicalTestResources } from \"./canonical-test-environment.mjs\";\nimport { releaseCheckoutVerificationOwnership } from \"./local-canonical-checkout-ownership.mjs\";\nimport { ATTEMPT_CONTRACT, beginAttempt, finishAttempt, prepareAttemptDependencies, inspectAttemptRecords, reconstructAttemptTip, readSourceCorrectionProof, supportsSourceCorrection, maintenanceMaterial, prepareMaintenanceCandidate, prepareAcceptedMainIntegrationCandidate, integrationMaterial, integrationTarget, authorizeIntegration, validateIntegrationAuthorityRecords, validReviewedIntegrationAttempt, INTEGRATION_ACCEPT, INTEGRATION_GRANT, REVIEWED_REVISION_PHASES } from \"./local-canonical-attempts.mjs\";\nimport { authorizeMaintenance, assertMaintenanceAuthorization, validateMaintenanceAuthorityRecords, maintenanceAuthorityObservation, MAINTENANCE_GRANT, validMaintenanceAttempt, observeMaintenanceSetup, maintenanceFaults } from \"./local-canonical-maintenance.mjs\";\n",
      "import { createHash } from \"node:crypto\";\nimport { syncBuiltinESMExports } from \"node:module\";\nimport childProcess from \"node:child_process\";\nimport { createCanonicalTestResourceRoot, buildCanonicalChildEnvironment, cleanupCanonicalTestResources } from \"./canonical-test-environment.mjs\";\nimport { releaseCheckoutVerificationOwnership } from \"./local-canonical-checkout-ownership.mjs\";\nimport { physicalFingerprint } from \"./local-canonical-verification-context.mjs\";\nimport { ATTEMPT_CONTRACT, beginAttempt, finishAttempt, prepareAttemptDependencies, inspectAttemptRecords, reconstructAttemptTip, readSourceCorrectionProof, supportsSourceCorrection, maintenanceMaterial, prepareMaintenanceCandidate, prepareAcceptedMainIntegrationCandidate, integrationMaterial, integrationTarget, authorizeIntegration, validateIntegrationAuthorityRecords, validReviewedIntegrationAttempt, INTEGRATION_ACCEPT, INTEGRATION_GRANT, REVIEWED_REVISION_PHASES } from \"./local-canonical-attempts.mjs\";\nimport { authorizeMaintenance, assertMaintenanceAuthorization, validateMaintenanceAuthorityRecords, maintenanceAuthorityObservation, MAINTENANCE_GRANT, validMaintenanceAttempt, observeMaintenanceSetup, maintenanceFaults } from \"./local-canonical-maintenance.mjs\";\n"
    ],
    [
      "    assert.deepEqual(f.preparation.input_inventory.binding,{});assert(!Object.hasOwn(f.preparation.input_inventory,\"prepared_dependencies\"));\n    assert.deepEqual(f.fullInputInventory.resources,f.preparation.input_inventory.resources);assert.notEqual(f.fullInputInventory.fingerprint,f.preparation.input_inventory.fingerprint);\n    const original=material();assert.equal(original.fixture.preparation_sha256,f.incident.preparation.sha256);noEdge();\n    f.rebuild(false);\n    const prepared=await prepare();assert.equal(prepared.eligible_evidence,true);assert.equal(prepared.live_inputs_ready,true);assert.equal(prepared.admission,false);assert.equal(prepared.reserved,false);\n",
      "    assert.deepEqual(f.preparation.input_inventory.binding,{});assert(!Object.hasOwn(f.preparation.input_inventory,\"prepared_dependencies\"));\n    assert.deepEqual(f.fullInputInventory.resources,f.preparation.input_inventory.resources);assert.notEqual(f.fullInputInventory.fingerprint,f.preparation.input_inventory.fingerprint);\n    // Each reader observes mutable queries again; immutable source bytes are\n    // reused only inside that reader, never across independent operations.\n    const sourceGit=childProcess.execFileSync,reads=[];\n    childProcess.execFileSync=function(command,args,options){if(command===\"git\")reads.push([...args]);return sourceGit.apply(this,arguments);};syncBuiltinESMExports();\n    let original;\n    try{\n      original=material();const split=reads.length;material();\n      const first=reads.slice(0,split),second=reads.slice(split),blobs=rows=>rows.filter(args=>args.length===3&&args[0]===\"--no-replace-objects\"&&args[1]===\"show\"&&/^[a-f0-9]{40}:.+/u.test(args[2])).map(args=>args[2]);\n      assert(blobs(first).length>0);assert.equal(new Set(blobs(first)).size,blobs(first).length,\"one immutable blob read per reader\");\n      assert.deepEqual(blobs(second),blobs(first),\"independent readers reread immutable bytes\");\n      assert.deepEqual(second,first,\"mutable Git queries also reread in the next operation\");\n    }finally{childProcess.execFileSync=sourceGit;syncBuiltinESMExports();}\n    assert.equal(original.fixture.preparation_sha256,f.incident.preparation.sha256);noEdge();\n    f.rebuild(false);\n    const prepared=await prepare();assert.equal(prepared.eligible_evidence,true);assert.equal(prepared.live_inputs_ready,true);assert.equal(prepared.admission,false);assert.equal(prepared.reserved,false);\n"
    ],
    [
      "    // Finish constructing only this new synthetic success with its full,\n    // admitted declaration. No retained failed or provider record is rewritten.\n    const checkout=f.preparation.checkout_fingerprint;\n    const success=finalizeReceipt({...assembled,inputs:structuredClone(f.fullInputInventory),\n      verification_context:{...assembled.verification_context,checkout_fingerprint:checkout},\n      checkout_ownership:{...assembled.checkout_ownership,checkout_fingerprint:checkout},capacity_ownership:{...assembled.capacity_ownership,checkout_fingerprint:checkout}});\n    Object.assign(successContext,{currentVerificationContext:success.verification_context,currentCheckoutFingerprint:checkout});\n    assert.equal(success.inputs.binding.head,f.head);assert.equal(success.inputs.binding.tree,f.tree);assert.deepEqual(success.inputs.binding.runtime_inputs,f.inputs);\n",
      "    // Finish constructing only this new synthetic success with its full,\n    // admitted declaration. No retained failed or provider record is rewritten.\n    const checkout=f.preparation.checkout_fingerprint,verification=physicalFingerprint(c.checkout);\n    const success=finalizeReceipt({...assembled,inputs:structuredClone(f.fullInputInventory),\n      verification_context:{...assembled.verification_context,checkout_fingerprint:verification},\n      checkout_ownership:{...assembled.checkout_ownership,checkout_fingerprint:checkout}});\n    assert.notEqual(verification,checkout);assert.notEqual(success.capacity_ownership.checkout_fingerprint,checkout);assert.notEqual(success.capacity_ownership.checkout_fingerprint,verification);\n    Object.assign(successContext,{currentVerificationContext:success.verification_context,currentCheckoutFingerprint:checkout});\n    assert.equal(success.inputs.binding.head,f.head);assert.equal(success.inputs.binding.tree,f.tree);assert.deepEqual(success.inputs.binding.runtime_inputs,f.inputs);\n"
    ],
    [
      "    const completionFile=path.join(families,success.attempt.family_id,\"completion-1.json\"),completion=JSON.parse(fs.readFileSync(completionFile));\n    write(completionFile,{...completion,receipt_fingerprint:success.integrity.content_fingerprint});\n    assert(validMaintenanceAttempt(success.attempt));assert.deepEqual(success.attempt.budget,{initial:1,recovery:0});\n    const tip=reconstructAttemptTip({anchorRoot:c.anchor,repositoryRoot:c.checkout,branch:c.branch});\n",
      "    const completionFile=path.join(families,success.attempt.family_id,\"completion-1.json\"),completion=JSON.parse(fs.readFileSync(completionFile));\n    write(completionFile,{...completion,receipt_fingerprint:success.integrity.content_fingerprint});\n    for(const [name,fingerprint]of [[\"verification-context fingerprint is not checkout ownership\",verification],[\"capacity fingerprint is not checkout ownership\",success.capacity_ownership.checkout_fingerprint],[\"missing recorded checkout ownership\",null]]){\n      const changed=structuredClone(success);\n      if(fingerprint===null)delete changed.checkout_ownership.checkout_fingerprint;else changed.checkout_ownership.checkout_fingerprint=fingerprint;\n      const bad=finalizeReceipt(changed);\n      try{write(completionFile,{...completion,receipt_fingerprint:bad.integrity.content_fingerprint});assert.equal(await inspectAttemptRecords({anchorRoot:c.anchor,repositoryRoot:c.checkout,receipt:bad}),false,name);recordRefusal(name,{code:\"attempt_records_refused\"});}\n      finally{write(completionFile,{...completion,receipt_fingerprint:success.integrity.content_fingerprint});}\n    }\n    assert(validMaintenanceAttempt(success.attempt));assert.deepEqual(success.attempt.budget,{initial:1,recovery:0});\n    const tip=reconstructAttemptTip({anchorRoot:c.anchor,repositoryRoot:c.checkout,branch:c.branch});\n"
    ]
  ]
};
export const maintenanceReaderRemedyPaths=Object.freeze(Object.keys(remedyChanges).sort());
export function maintenanceReaderRemedySource(file,source,{reverse=false}={}){
  if(!Object.hasOwn(remedyChanges,file))throw Error("maintenance_reader_remedy_path_invalid");
  for(const pair of remedyChanges[file]){const [before,after]=reverse?[...pair].reverse():pair,parts=source.split(before);
    if(parts.length!==2)throw Error("maintenance_reader_remedy_source_invalid");source=parts.join(after);}
  return source;
}

// Literal substitutions must be real executable reader changes, not text in
// comments or strings. All unchanged bytes remain bound by the finite delta.
export function validateMaintenanceReaderRemedyPlacement(before,after){
  const T=typescript();
  const trees=Object.fromEntries([before,after].map((sources,i)=>[i,Object.fromEntries(Object.entries(sources).map(([file,source])=>{
    const tree=T.createSourceFile(file,source,T.ScriptTarget.Latest,true,T.ScriptKind.JS);
    if(tree.parseDiagnostics.length)throw Error("maintenance_reader_remedy_syntax_invalid");return[file,tree];
  }))]));
  const nodes=(tree,predicate)=>{const result=[];const visit=n=>{if(predicate(n))result.push(n);T.forEachChild(n,visit);};visit(tree);return result;};
  const body=(tree,name)=>{const found=nodes(tree,n=>T.isFunctionDeclaration(n)&&n.name?.text===name);if(found.length!==1)throw Error("maintenance_reader_remedy_function_invalid");return found[0].body;};
  const fixture="scripts/local-canonical-failed-integration-fixture.mjs",maintenance="scripts/local-canonical-maintenance.mjs",attempts="scripts/local-canonical-attempts.mjs";
  for(const[i,expected]of [[0,1],[1,0]]){
    const tree=trees[i][fixture],part=body(tree,"partitionPositives");
    if(nodes(part,n=>T.isCallExpression(n)&&n.expression.getText(tree)==="registeredFixtureBudget").length!==expected)throw Error("maintenance_reader_registration_reuse_invalid");
    const at=trees[i][attempts],expression=i?"stockReceipt.checkout_ownership?.checkout_fingerprint":"stockReceipt.verification_context?.checkout_fingerprint";
    if(nodes(body(at,"prepareSourceCorrection"),n=>T.isPropertyAccessExpression(n)&&n.getText(at)===expression).length!==1)throw Error("maintenance_reader_domain_repair_invalid");
  }
  const tree=trees[1][fixture],calls=nodes(body(tree,"readFailedIntegrationFixtureIncident"),n=>T.isCallExpression(n)&&n.expression.getText(tree)==="partitionPositives");
  if(calls.length!==1||calls[0].arguments[4]?.getText(tree)!=="registrations.after")throw Error("maintenance_reader_registration_reuse_invalid");
  const mt=trees[1][maintenance],owner=body(mt,"readMaintenanceEvidence");
  if(nodes(owner,n=>T.isVariableDeclaration(n)&&n.name.getText(mt)==="blobs"&&T.isNewExpression(n.initializer)&&n.initializer.expression.getText(mt)==="Map").length!==1)throw Error("maintenance_reader_cache_scope_invalid");
}

export function maintenanceReaderContractRegistration(source){
  const T=typescript();
  const tree=T.createSourceFile("suite.mjs",source,T.ScriptTarget.Latest,true,T.ScriptKind.JS),matches=[];
  const visit=n=>{if(T.isObjectLiteralExpression(n)&&n.properties.some(p=>T.isSpreadAssignment(p)&&T.isCallExpression(p.expression)&&
    p.expression.expression.getText(tree)==="rootNode"&&p.expression.arguments.length===1&&T.isStringLiteral(p.expression.arguments[0])&&
    p.expression.arguments[0].text==="scripts/test-local-canonical-verification-contract.mjs"))matches.push(n);T.forEachChild(n,visit);};visit(tree);
  if(tree.parseDiagnostics.length||matches.length!==1)throw Error("maintenance_reader_contract_registration_invalid");
  const properties=matches[0].properties.filter(T.isPropertyAssignment),label=properties.find(p=>p.name.getText(tree)==="label"),bound=properties.find(p=>p.name.getText(tree)==="timeoutMs");
  if(properties.length!==2||!label||!bound||!T.isStringLiteral(label.initializer)||!T.isNumericLiteral(bound.initializer)||Number(bound.initializer.text)!==30000)
    throw Error("maintenance_reader_contract_registration_invalid");
  return {label:label.initializer.text,bound_ms:Number(bound.initializer.text)};
}

// Closed vocabulary of the existing synthetic selected controls, not real
// commission identities. Preserve its names/codes, not just its cardinality.
const selectedRefusals=[
  {
    "name": "unauthorized admission",
    "code": "maintenance_shape_invalid"
  },
  {
    "name": "UNKNOWN cause retained",
    "code": "maintenance_fixture_incident_invalid"
  },
  {
    "name": "UNKNOWN operation retained",
    "code": "maintenance_fixture_incident_invalid"
  },
  {
    "name": "whole stock issue set",
    "code": "maintenance_fixture_stock_invalid"
  },
  {
    "name": "same-count stock meanings",
    "code": "maintenance_fixture_stock_invalid"
  },
  {
    "name": "stock dimensions retained",
    "code": "maintenance_fixture_stock_invalid"
  },
  {
    "name": "complete ordered positive groups",
    "code": "maintenance_fixture_positive_registration_invalid"
  },
  {
    "name": "positive swap refused",
    "code": "maintenance_fixture_positive_registration_invalid"
  },
  {
    "name": "existing inner deadline retained",
    "code": "maintenance_fixture_positive_binding_invalid"
  },
  {
    "name": "positive cleanup required",
    "code": "maintenance_fixture_positive_not_natural"
  },
  {
    "name": "full source inventory",
    "code": "maintenance_fixture_positive_source_invalid"
  },
  {
    "name": "actual partition parent",
    "code": "maintenance_fixture_partition_source_invalid"
  },
  {
    "name": "prepared source bound",
    "code": "maintenance_fixture_preparation_invalid"
  },
  {
    "name": "prepared inventory bound",
    "code": "maintenance_fixture_preparation_invalid"
  },
  {
    "name": "caller-invented preparation binding",
    "code": "maintenance_fixture_preparation_invalid"
  },
  {
    "name": "contract creates no grant",
    "code": "maintenance_fixture_positive_contract_invalid"
  },
  {
    "name": "physical incident log substitution",
    "code": "improvement_artifact_changed"
  },
  {
    "name": "live prepared inventory drift",
    "code": "integration_prepared_inputs_changed"
  },
  {
    "name": "live runtime drift",
    "code": "maintenance_current_runtime_invalid"
  },
  {
    "name": "unsafe input preparation",
    "code": "dependency_input_entry_unsafe"
  },
  {
    "name": "unsafe input admission",
    "code": "dependency_input_entry_unsafe"
  },
  {
    "name": "old grant reuse 3002",
    "code": "maintenance_grant_reused"
  },
  {
    "name": "old grant reuse 102",
    "code": "maintenance_grant_reused"
  },
  {
    "name": "current PR authority unavailable",
    "code": "wrong synthetic current PR"
  },
  {
    "name": "evidence drift during authority observation",
    "code": "improvement_artifact_changed"
  },
  {
    "name": "interruption after exclusive edge",
    "code": "synthetic selected-case interruption"
  },
  {
    "name": "interrupted cold lineage",
    "code": "improvement_reserved_unsettled"
  },
  {
    "name": "interrupted commission replay",
    "code": "improvement_reserved_unsettled"
  },
  {
    "name": "competing reservation",
    "code": "revision_material_changed_during_validation"
  },
  {
    "name": "cold malformed failure prefix",
    "code": "attempt_records_refused"
  },
  {
    "name": "spent commission admission",
    "code": "attempt_latest_tip_required"
  },
  {
    "name": "spent commission preparation",
    "code": "maintenance_latest_tip_required"
  }
];
export function maintenanceReaderSelectedRefusals(after=false){
  const rows=structuredClone(selectedRefusals);
  if(after)rows.splice(rows.findIndex(row=>row.name==="cold malformed failure prefix"),0,...["verification-context fingerprint is not checkout ownership","capacity fingerprint is not checkout ownership","missing recorded checkout ownership"].map(name=>({name,code:"attempt_records_refused"})));
  return rows;
}
