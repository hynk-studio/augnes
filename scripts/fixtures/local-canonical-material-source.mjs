// Disposable synthetic authority. Real readers, physical ledger, behavioral
// subprocesses and fresh stock; these records never authorize host qualification.
import assert from 'node:assert/strict';
import {readFileSync,existsSync,rmSync,readdirSync,writeFileSync} from 'node:fs';
import {syncBuiltinESMExports} from 'node:module';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {resolveCompanionServiceLayout} from '../../plugins/augnes-operator/mcp/companion-service-core.mjs';
import {setTimeout as delay} from 'node:timers/promises';
import {fixtureNow} from './local-canonical-authority-clock.mjs';
import {digest} from '../local-canonical-inputs.mjs';
import {CANONICAL_NODE_VERSION} from '../local-canonical-environment.mjs';
import {beginAttempt,finishAttempt,readSourceCorrectionProof,inspectGitRevisionPreparation,inspectAttemptRecords,reconstructAttemptTip,reviewedRevisionAuthorityObservation,
 materialRecoveryPreservationGuard,prepareAcceptedMainIntegrationCandidate,integrationMaterial,integrationTarget,authorizeIntegration,INTEGRATION_ACCEPT,INTEGRATION_GRANT,
 observeMaterialIntegrationPredecessorAuthority,readReviewedIntegration} from '../local-canonical-attempts.mjs';
import {MATERIAL_SOURCE_CORRECTION,MATERIAL_HISTORY_BOUNDARY,gitReviewTarget,verifyGitRevisionFailure,verifyGitRevisionSuccess,
 GIT_CURRENT_STOCK_COMPARISON,gitRevisionInventory,gitRevisionStockComparison} from '../local-canonical-git-observation.mjs';
import {REVIEWED_REVISION_PHASES} from '../local-canonical-attempts.mjs';
import {executeFixture,dependencyRecords} from './local-canonical-browser-successor.mjs';
import {createPrivateReviewExport,inspectPrivateReviewExport} from '../local-canonical-review-export.mjs';
import {browserConsumersForPhase,validPhaseBrowserUse} from '../local-canonical-browser-identity.mjs';
import {runMaterialStockPredecessorControls} from './local-canonical-material-stock-predecessor.mjs';
import {MATERIAL_CURRENT_STOCK_GIT_MISMATCH,verifyMaterialCurrentStockMismatchPredecessor,
 verifiedMaterialCurrentStockMismatchPredecessor,materialCurrentStockHistoricalRuntime} from '../local-canonical-material-stock-predecessor.mjs';
import {finalizeReceipt,inspectReceiptForDecision,canonicalSerialize} from '../local-canonical-receipt.mjs';
import {inspectIntegrationStock,usesLegacyRevisionSettlement} from '../run-local-canonical-verification.mjs';
import {checkoutVerificationFingerprint} from '../local-canonical-checkout-ownership.mjs';
import {seedFailedIntegrationFixtureSources} from './local-canonical-failed-integration-maintenance.mjs';
const clone=structuredClone,now=()=>new Date(fixtureNow()).toISOString();
const driver='scripts/material-source-behavior.mjs',product='apps/web_planning/src/exchange-client.js.txt';
const predecessorDriver='scripts/material-predecessor.mjs';
const decision='Source review decision: ACCEPT / RETAIN for prospective qualification.';
const recoveryPaths=['scripts/augnes-companion-service.mjs','plugins/augnes-operator/mcp/companion-service-core.mjs',
 'plugins/augnes-operator/mcp/checkout-identity.mjs','plugins/augnes-operator/mcp/node-runtime-policy.mjs',
 'plugins/augnes-operator/mcp/checkout-identity-darwin.py'];
function materialRecoveryEnvironment(c) {
 if(!c.recoveryRoot)return;
 for(const [key,value] of Object.entries({AUGNES_COMPANION_SERVICE_TEST_MODE:'1',AUGNES_COMPANION_SERVICE_TEST_SCOPE:'material-recovery-fixture',
  AUGNES_COMPANION_SERVICE_TEST_ROOT:c.recoveryRoot})){process.env[key]=value;c.env[key]=value;}
}
function recoveryProjection(m){return{status:m.status,reason:m.reason,updated_at:m.updated_at,manager_pid:m.manager_pid,
 manager_process_identity:m.manager_process_identity,supervisor_pid:m.supervisor_pid,supervisor_process_identity:m.supervisor_process_identity,
 restart_count:m.restart_count,generation_id:m.runtime_ownership?.generation_id??null,instance_id:m.runtime_ownership?.instance_id??null};}
function seedMaterialRecoveryIdentity(c,h){
 c.recoveryRoot=path.join(c.root,'synthetic-service');materialRecoveryEnvironment(c);
 const layout=resolveCompanionServiceLayout({repositoryRoot:c.checkout});
 c.recoveryConfiguration={contract:'augnes-companion-service.v0.1',schema_version:2,service_identity:layout.service_identity,
  repository_root:c.checkout,repository_fingerprint:layout.repository.repository_fingerprint,configuration_path:layout.configuration_path,
  test_scope:layout.test.scope,test_root:layout.test.root,service_source_fingerprint:digest(Buffer.concat(recoveryPaths.flatMap(name=>[Buffer.from(name+'\0'),readFileSync(path.join(c.checkout,name)),Buffer.from('\0')])))};
 c.recoveryManager={contract:'augnes-companion-service.v0.1',schema_version:1,service_identity:layout.service_identity,
  repository_fingerprint:layout.repository.repository_fingerprint,status:'live',reason:'companion_service_live',updated_at:now(),
  manager_pid:42,manager_process_identity:digest('fixture manager birth'),supervisor_pid:43,
  supervisor_process_identity:digest('fixture supervisor birth'),restart_count:0,restart_after:null,
  runtime_ownership:{generation_id:'fixture-generation',instance_id:'fixture-instance'}};
 const live=c.live?.service??c.live;if(!live)return;live.state.service_identity='sha256:'+layout.service_identity;
 live.diagnostics.manager_before=live.diagnostics.manager_after=recoveryProjection(c.recoveryManager);
}
function materialRecoverySettlement(c,h,p){
 const ref=(name,value)=>h.artifact(c,name,value), m=c.recoveryManager, configuration=c.recoveryConfiguration;
 const source=digest(Buffer.concat(recoveryPaths.flatMap(name=>[Buffer.from(name+'\0'),c.git(['show',p.head+':'+name]),Buffer.from('\0')])));
 const recorded=now(), configurationRef=ref('recovery-configuration.json',configuration),
  evidence={repository_binding:digest('post-recovery repository binding'),recovery_source:source,
   installed_source:configuration.service_source_fingerprint,manager:m,desired:{desired_state:'running'},
   manager_lock:{service_identity:configuration.service_identity,repository_fingerprint:configuration.repository_fingerprint},
   material:{configuration_path:{sha256:configurationRef.sha256}}};
 const target={desired:{...evidence.desired,desired_state:'stopped',updated_at:recorded},
  manager:{...m,status:'installed_stopped',reason:'companion_service_explicitly_stopped',supervisor_pid:null,
   supervisor_process_identity:null,runtime_ownership:null,restart_after:null,updated_at:recorded}};
 const review=ref('recovery-source-review.log',['Synthetic independent model source review. No installed operation.',
  'ACCEPT_SOURCE_FOR_SCOPED_RECOVERY_PREPARATION',p.head,p.tree,source].join('\n'));
 const authority=ref('recovery-authority.json',{recorded_at:recorded,human_instruction:'synthetic apply',
  scope:'Apply reviewed '+p.head+' on '+configuration.repository_root,receiving_record:'https://chatgpt.com/space/page_00000000000000000000000000000000',source_review_sha256:review.sha256});
 const human=ref('recovery-human-source.json',{threadId:'synthetic-task-thread',turns:[{human_messages:[{type:'userMessage',id:'synthetic-message',content:[{type:'text',text:'synthetic apply'}]}]}]});
 const decision={contract:'augnes-companion-stale-manager-recovery.v0.1',service_identity:configuration.service_identity,
  expected_binding:digest(JSON.stringify(evidence)),recovery_source:source,expires_at:new Date(Date.parse(recorded)+60000).toISOString()};
 const operation={contract:decision.contract,service_identity:configuration.service_identity,status:'settled',created_at:recorded,
  evidence,target,operation_binding:digest(JSON.stringify([evidence,target,recorded])),decision_binding:digest(JSON.stringify(decision)),
  lifecycle_owners:[{owner_pid:44,service_identity:configuration.service_identity,repository_fingerprint:configuration.repository_fingerprint}]};
 const old=clone(c.prior.cleanup.companion_service.after), current=clone(c.live);
 current.service.state={...old,status:'installed_stopped',preservation_binding:digest('synthetic settled recovery binding')};
 Object.assign(current.service.diagnostics,{coherent:true,live_identity_valid:true,loaded_job:null,
  manager_before:recoveryProjection(target.manager),manager_after:recoveryProjection(target.manager),
  before_binding:current.service.state.preservation_binding,after_binding:current.service.state.preservation_binding,
  repository_binding_before:evidence.repository_binding,repository_binding_after:evidence.repository_binding,
  material_states:Object.fromEntries(['maintenance_lease_path','runtime_manifest_path','runtime_token_path','runtime_access_path','runtime_lock_path'].map(key=>[key,'missing'])),finished_at:recorded});
 const observed=ref('recovery-observation.json',{source:evidence.installed_source,observation:current.service});
 const settlement={prior:{family_id:c.prior.attempt.family_id,number:c.prior.attempt.number,attempt_id:c.prior.attempt.attempt_id,
  receipt_fingerprint:p.prior_receipt_fingerprint,head:c.prior.attempt.head,tree:c.prior.attempt.tree,
  grant_comment_id:c.prior.attempt.source_correction.authorization.grant_comment_id},historical_state:old,
  target:{base:p.base,head:p.head,tree:p.tree,runtime_inputs_sha256:p.inputs.identity_sha256,inventory_sha256:p.inputs.inventory_sha256},
  recorded_at:recorded,recovery_source:{head:p.head,tree:p.tree,review},authority,human_source:human,
  decision:ref('recovery-decision.json',decision),operation:ref('recovery-operation.json',operation),
  application:ref('recovery-application.json',{command:['node','stale-manager-recovery-apply',configuration.repository_root],started_at:recorded,finished_at:recorded,exit_code:0}),
  applied:ref('recovery-applied.json',{command:'stale-manager-recovery-apply',result:'settled',operation_binding:operation.operation_binding,
   remaining_owned_processes:0,authority:{runtime_lifecycle_effect:true,repository_execution_authority:false}}),restored_observation:observed,configuration:configurationRef};
 h.write(configuration.configuration_path,readFileSync(path.join(c.artifacts,configurationRef.artifact)));
 const operationRef=settlement.operation;h.write(path.join(path.dirname(configuration.configuration_path),'stale-manager-recovery.json'),readFileSync(path.join(c.artifacts,operationRef.artifact)));
 p.settlement=ref('material-settlement.json',settlement);c.live=current;c.materialSettlement=settlement;
}

// Synthetic continuation and Start records are isolated fixture inputs. No
// installed lifecycle call is made; the original stopped recovery stays sealed.
function materialRecoveryStart(c,h,p,inspect) {
 const ref=(name,value)=>h.artifact(c,name,value), read=r=>h.read(path.join(c.artifacts,r.artifact));
 const stopped=clone(c.live), original=clone(c.materialSettlement), current=clone(stopped), configuration=c.recoveryConfiguration;
 const recorded=now(), head=c.git(['rev-parse','HEAD']).toString().trim(), tree=c.git(['rev-parse','HEAD^{tree}']).toString().trim();
 const manager={...c.recoveryManager,manager_pid:52,manager_process_identity:digest('synthetic newly started manager'),
  supervisor_pid:53,supervisor_process_identity:digest('synthetic newly started supervisor'),updated_at:recorded,
  runtime_ownership:{generation_id:'synthetic-start-generation',instance_id:'synthetic-start-instance'}};
 current.service.state={...stopped.service.state,status:'live',preservation_binding:digest('synthetic supported started binding')};
 Object.assign(current.service.diagnostics,{started_at:recorded,finished_at:recorded,manager_before:recoveryProjection(manager),manager_after:recoveryProjection(manager),
  before_binding:current.service.state.preservation_binding,after_binding:current.service.state.preservation_binding,
  runtime:{verified:true,supervisor_pid:manager.supervisor_pid,generation_id:manager.runtime_ownership.generation_id,instance_id:manager.runtime_ownership.instance_id,
   probe_available:Object.fromEntries(['ui_health','bridge_health','ui_ownership','bridge_ownership'].map(key=>[key,true])),
   probe_valid:Object.fromEntries(['ui_health','bridge_health','ui_ownership','bridge_ownership'].map(key=>[key,true]))},
  material_states:{maintenance_lease_path:'missing',...Object.fromEntries(['configuration_path','desired_state_path','manager_state_path','manager_lock_path','runtime_manifest_path','runtime_token_path','runtime_access_path','runtime_lock_path'].map(key=>[key,'valid']))},
  loaded_job:{pid:manager.manager_pid,label:'com.augnes.companion.test.'+configuration.service_identity.slice(0,16),fingerprint:digest('synthetic started job')}});
 const origin=fileURLToPath(new URL('../../plugins/augnes-operator/skills/augnes-live-repository-continuity/SKILL.md',import.meta.url));
 const contract=ref('start-continuation-contract.log',readFileSync(origin));
 const call={type:'mcpToolCall',id:'synthetic-supported-start',server:'augnes-live-companion',tool:'augnes_start_companion_service',
  arguments:{repositoryRoot:configuration.repository_root},status:'completed',durationMs:1};
 const message={type:'userMessage',id:'synthetic-continuation-request',content:[{type:'text',text:'Continue https://github.com/hynk-studio/augnes/pull/999 exact source '+head}]};
 const source={thread:{id:'synthetic-continuation-thread'},turn:{id:'synthetic-continuation-turn',startedAt:Date.parse(recorded)/1000},
  items:[message,{type:'commandExecution',id:'synthetic-contract-read',command:'read '+origin,status:'completed',exitCode:0},call]};
 const operation=read(original.operation), corroboration={observed_at:recorded,files:{
  'desired-state.json':{bytes:100,sha256:digest('synthetic running intent'),fields:{desired_state:'running',updated_at:recorded}},
  'manager-state.json':{fields:recoveryProjection(manager)},
  'stale-manager-recovery.json':{sha256:original.operation.sha256,fields:{status:'settled',operation_binding:operation.operation_binding}}}};
 const edge={human_source:ref('start-human-source.json',source),human_message_id:message.id,call_id:call.id,
  continuation_contract:contract,continuation_contract_origin:origin,source:{head,tree},
  decision:ref('start-budget.json',{recorded_at:recorded,repository:'hynk-studio/augnes',root:c.checkout,head,tree,base:p.base,branch:c.branch}),
  other_owner:ref('start-other-owner.json',{observed_at:recorded,thread:source.thread,turn:source.turn,items:[call]}),
  corroboration:ref('start-corroboration.json',corroboration),live_observation:ref('start-live-observation.json',current.service)};
 const transition={...original,recorded_at:recorded,start:ref('supported-start.json',edge)}, before=digest({original,stopped});
 p.settlement=ref('material-settlement-start.json',transition);c.live=current;c.materialSettlement=transition;
 assert.equal(inspect(p).reserved,false);let refused=0;
 const missing=clone(transition);delete missing.start;
 assert.throws(()=>inspect({...p,settlement:ref('start-missing-settlement.json',missing)}));refused++;
 for(const [key,change]of [['human_source',q=>q.items.shift()],['human_source',q=>q.items[0].content[0].text='acknowledgment'],
  ['human_source',q=>q.items.reverse()],['human_source',q=>q.items[2].status='running'],
  ['human_source',q=>q.items[2].arguments.repositoryRoot=c.anchor],['human_source',q=>q.items.push(clone(q.items[2]))],
  ['other_owner',q=>q.items[0].id='different call'],['corroboration',q=>q.files['stale-manager-recovery.json'].fields.status='retiring'],
  ['corroboration',q=>q.files['desired-state.json'].fields.updated_at=new Date(0).toISOString()],
  ['live_observation',q=>q.state.service_identity='sha256:'+digest('wrong service')],
  ['live_observation',q=>q.diagnostics.coherent=false],['live_observation',q=>q.diagnostics.runtime.verified=false],
  ['decision',q=>q.recorded_at=new Date(0).toISOString()]]){
  const value=clone(read(edge[key]));change(value);const altered={...edge,[key]:ref('invalid-start-evidence-'+(++refused)+'.json',value)};
  const proposed={...transition,start:ref('invalid-start-edge-'+refused+'.json',altered)};
  assert.throws(()=>inspect({...p,settlement:ref('invalid-start-settlement-'+refused+'.json',proposed)}));
 }
 for(const change of [q=>q.source.tree=digest('unsupported source tree').slice(0,40),q=>q.continuation_contract=ref('unscoped-start-contract.log','Unscoped read-only continuation'),q=>q.call_id='wrong call']){
  const altered=clone(edge);change(altered);const proposed={...transition,start:ref('invalid-start-scope-'+(++refused)+'.json',altered)};
  assert.throws(()=>inspect({...p,settlement:ref('invalid-start-scope-settlement-'+refused+'.json',proposed)}));
 }
 assert.equal(digest({original,stopped}),before);assert.equal(inspect(p).reserved,false);
 console.log(JSON.stringify({material_supported_start:{preparation_pass:true,prior_stopped_path_pass:true,missing_start_live_refused:true,
  refused,synthetic_only:true,installed_lifecycle_calls:0,prior_stopped_and_recovery_unchanged:true}}));
}


const integrationTransport=records=>({review:async()=>clone(records.acceptance),grant:async()=>clone(records.grant),
 permission:async login=>clone([records.acceptance_permission,records.grant_permission].find(v=>v.user.login===login)),
 pullRequest:async()=>clone(records.pull_request)});

async function materialHistoricalPrefix(c,prior,context) {
 let callbacks=0,validated=false;
 const currentAttemptRecordsValid=await inspectAttemptRecords({anchorRoot:c.anchor,repositoryRoot:c.checkout,receipt:prior,
  onHistoricalPrefix(){validated=true;},observeRevision:async()=>{callbacks++;throw Error('historical prefix must not project current authority');}});
 assert.equal(currentAttemptRecordsValid,true);assert.equal(callbacks,0);assert.equal(validated,true);
 const current={...context,expectedRunId:prior.run.id,currentExecutorFingerprint:digest('changed current executor'),
  currentLocks:{root:digest('changed current root lock'),nested:digest('changed current nested lock'),webPlanning:digest('changed current web lock')}};
 const historical=inspectReceiptForDecision(prior,{...current,currentAttemptRecordsValid,historicalMaterialIntegrationPrefix:validated});
 assert(historical.issues.includes('receipt_historical_material_integration_prefix'));assert(historical.issues.includes('receipt_stale_executor'));
 assert(historical.issues.includes('receipt_stale_lockfiles'));assert(historical.issues.includes('receipt_stale_head'));
 assert.equal(historical.dimensions.evidence_validity,'valid_in_recorded_context');assert.equal(historical.dimensions.current_merge_applicability,'blocked');assert.equal(historical.valid_deciding_evidence,false);
 const changed=clone(prior);changed.phases.pop();const malformed=finalizeReceipt(changed);let wronglyValidated=false;
 const invalid=await inspectAttemptRecords({anchorRoot:c.anchor,repositoryRoot:c.checkout,receipt:malformed,onHistoricalPrefix(){wronglyValidated=true;}});
 assert.equal(invalid,false);assert.equal(wronglyValidated,false);
 const refused=inspectReceiptForDecision(malformed,{...current,currentAttemptRecordsValid:invalid,historicalMaterialIntegrationPrefix:wronglyValidated});
 assert.equal(refused.dimensions.evidence_validity,'invalid_or_incomplete');assert.equal(refused.valid_deciding_evidence,false);
}

// Reuse the owned fresh reader; neither this hook nor its records are host QA.
export async function inspectMaterialIntegrationCold(c) {
 const receipt=JSON.parse(readFileSync(path.join(c.checkout,'.augnes-local-verification/receipts',c.stockContext.expectedRunId+'.json')));
 const observed=await inspectIntegrationStock({anchorRoot:c.anchor,repositoryRoot:c.checkout,receipt,assertCurrent(){},transport:integrationTransport(c.integrationRecords)});
 assert.equal(observed.currentAttemptRecordsValid,true);
 const result=inspectReceiptForDecision(receipt,{...c.stockContext,...observed});
 assert.equal(result.valid_deciding_evidence,true,JSON.stringify(result.issues));
 await materialHistoricalPrefix(c,c.materialPredecessor,c.stockContext);
 const tip=reconstructAttemptTip({anchorRoot:c.anchor,repositoryRoot:c.checkout,branch:receipt.repository.branch});
 assert.equal(tip.attempt_id,receipt.run.id);assert.equal(tip.reviewed_revision_consumed,1);
 assert.deepEqual(tip.revision_grants,c.materialGrants);
 writeFileSync(c.stockOutput,JSON.stringify(result),{mode:0o600});
}

// Reuse the already-built, physical material-v7 lineage for this separate
// selected-case owner. Existing preparation/admission campaigns keep their own
// controls and limits; this mode constructs only their positive predecessor.
export async function runMaintenanceReaderIntegrationFixture(c,h,callback,{seedSources,prepareDependencies}={}) {
 assert.equal(typeof callback,'function');
 assert(seedSources===undefined||typeof seedSources==='function');
 assert(prepareDependencies===undefined||typeof prepareDependencies==='function');
 return materialIntegrationControls(c,h,'maintenance-reader',callback,seedSources,prepareDependencies);
}

async function materialIntegrationControls(c,h,mode,callback,seedSources,prepareDependencies) {
 const readerMode=mode==='maintenance-reader';
 const started=performance.now(),stage=name=>console.log(JSON.stringify({material_integration_stage:name,elapsed_ms:Math.round(performance.now()-started),synthetic_only:true}));
 const prior=c.materialFinalReceipt,a=prior.attempt,successStock=h.read(path.join(c.artifacts,'fresh-stock.json'));
 const git=(...args)=>c.git(args).toString().trim(),commit=()=>git('-c','user.name=Fixture','-c','user.email=fixture@example.invalid','commit','--quiet','-m','synthetic reviewed material integration');
 const families=path.join(c.anchor,'.augnes-local-verification/families'),ledger=path.join(families,a.family_id),edge=path.join(ledger,'correction-successor.json');
 const originalFiles=new Map(),capture=folder=>{for(const entry of readdirSync(folder,{withFileTypes:true})){const file=path.join(folder,entry.name);if(entry.isDirectory())capture(file);else originalFiles.set(file,readFileSync(file));}};
 capture(families);capture(c.artifacts);
 const priorPath=path.join(c.checkout,'.augnes-local-verification/receipts',prior.run.id+'.json');originalFiles.set(priorPath,readFileSync(priorPath));
 const ledgerFiles=[...originalFiles].filter(([file])=>file.startsWith(families+path.sep));
 const restoreLedger=()=>{rmSync(families,{recursive:true,force:true});for(const [file,bytes]of ledgerFiles)h.write(file,bytes);};
 const preserved=()=>{for(const [file,bytes]of originalFiles)assert(readFileSync(file).equals(bytes),file+' remains unchanged');};
 const oldMain=git('rev-parse','refs/remotes/origin/main'),exclude=path.join(c.checkout,'.git/info/exclude'),excludeBytes=readFileSync(exclude);
 const folder=path.join(c.checkout,'.augnes-local-verification/material-reviewed-integration'),file=path.join(folder,'proof.json');
 const handoff=path.join(c.root,'material-integration-context.json'),stored=mode==='admit'?h.read(handoff):null;
 const ref=(name,value)=>{h.write(path.join(folder,name),typeof value==='object'&&!Buffer.isBuffer(value)?canonicalSerialize(value):value);return{artifact:name,sha256:digest(readFileSync(path.join(folder,name)))}};
 const delta=(before,after,files=[])=>digest(c.git(['diff','--binary','--no-ext-diff','--no-textconv','--no-renames',before,after,'--',...files]));
 const beforeTip=reconstructAttemptTip({anchorRoot:c.anchor,repositoryRoot:c.checkout,branch:c.branch});
 assert.deepEqual(beforeTip.revision_grants,[11,32,62,72]);assert.equal(beforeTip.reviewed_revision_consumed,1);
 assert.equal(a.source_correction.commission.source_revision,MATERIAL_SOURCE_CORRECTION);
 assert.deepEqual(a.budget,{initial:1,recovery:0});assert.equal(a.source_correction.commission.maximum_invocations,1);
 assert.doesNotThrow(()=>verifyGitRevisionSuccess(prior,successStock,c.inputs,REVIEWED_REVISION_PHASES));
 let receipt,proof,p,review,records,main,head,tree,packages,declaration,inputInventory,live,preparation,authority,priorTransport,partitionSources;
 let retain=false,createdMain=false,refusals=stored?.refusals??0;
 const noEdge=()=>assert(!existsSync(edge));
 try {
  if(stored){
   p=stored.p;review=stored.review;preparation=stored.preparation;({head,tree}=p);main=p.base;
   git('reset','--hard',head);git('update-ref','refs/remotes/origin/main',main);h.write(exclude,Buffer.concat([excludeBytes,Buffer.from('\nnode_modules/\n')]));
   packages=dependencyRecords(c,c.checkout).map(v=>({...v,prerequisite:preparation.dependencies.find(x=>x.phase_id===v.phase_id)}));
   declaration={...clone(stored.declaration),resources:clone(c.gitDeclaration.resources),binding:{...clone(stored.declaration.binding),runtime_inputs:clone(c.inputs)}};
   inputInventory={...declaration,fingerprint:digest(declaration),checks:1,events:[],first_fault:null,secondary_faults:[],prepared_dependencies:packages};
   live={...clone(c.live),inventory:gitRevisionInventory(inputInventory),inputInventory};
  }else{
  const overlap='scripts/fixture.mjs',oldSource=c.git(['show',a.head+':'+overlap]);
  git('checkout','-b','material-accepted-main',c.base);createdMain=true;
  h.write(path.join(c.checkout,overlap),'export const incoming=true;\n');
  if(readerMode){partitionSources=seedFailedIntegrationFixtureSources(c);seedSources?.();}
  git('add',overlap);commit();main=git('rev-parse','HEAD');
  git('checkout',c.branch);try{git('merge','--no-ff','--no-commit',main);}catch{/* The retained source and incoming main deliberately differ. */}
  h.write(path.join(c.checkout,overlap),Buffer.concat([oldSource,Buffer.from('\nexport const incoming=true;\n')]));git('add',overlap);commit();
  const merge=git('rev-parse','HEAD'),mergeTree=git('rev-parse','HEAD^{tree}'),mergeBase=git('merge-base',a.head,main);
  h.write(exclude,Buffer.concat([excludeBytes,Buffer.from('\nnode_modules/\n')]));
  packages=dependencyRecords(c,c.checkout).map(v=>({...v,prerequisite:v.before}));
  // Only the selected reader's disposable ancestry needs an inert loader/source
  // binding for its later direct-capture parser controls. Observe it before the
  // correction commit; all other groups retain their original dependency path.
  if(readerMode&&prepareDependencies)packages=prepareDependencies(packages);
  const compatibility='scripts/verifier-fixture.mjs';h.write(path.join(c.checkout,compatibility),'export const reviewedCompatibility=true;\n');
  const corrections=[compatibility,...['','apps/augnes_apps','apps/web_planning'].flatMap(dir=>['package.json','package-lock.json'].map(name=>path.posix.join(dir,name)))].sort();
  git('add',...corrections);commit();head=git('rev-parse','HEAD');tree=git('rev-parse','HEAD^{tree}');git('update-ref','refs/remotes/origin/main',main);
  const entry=rev=>{const row=git('ls-tree',rev,'--',overlap);return row.slice(0,row.indexOf('\t'));};
  p={schema:'augnes.local-canonical-source-correction.v2',kind:'accepted_main_integration',integration_case:'reviewed',branch:c.branch,base:main,accepted_main:main,head,tree,pull_request:999,
   prior_family_id:a.family_id,prior_number:1,prior_attempt_id:a.attempt_id,prior_receipt_fingerprint:prior.integrity.content_fingerprint,prior_receipt_path:path.relative(c.checkout,priorPath),
   integration:{commit:merge,tree:mergeTree,merge_base:mergeBase,overlaps:[{path:overlap,base:entry(mergeBase),predecessor:entry(a.head),main:entry(main),result:entry(merge)}],
    delta_sha256:delta(a.head,merge),resolution_delta_sha256:delta(a.head,merge,[overlap]),correction_delta_sha256:delta(merge,head),correction_paths:corrections},
   planner:ref('planner.json',{base:main,head,selected_plan:'full-canonical',phases:[...REVIEWED_REVISION_PHASES],owners:['local-canonical-integrity']}),review:null,budget:{initial:1,recovery:0},authorization:null};
  declaration={contract:prior.inputs.contract,path_kind:prior.inputs.path_kind,binding:{...clone(prior.inputs.binding),head,tree},resources:clone(prior.inputs.resources)};
  inputInventory={...declaration,fingerprint:digest(declaration),checks:1,events:[],first_fault:null,secondary_faults:[],prepared_dependencies:packages};
  live={...clone(c.live),inventory:gitRevisionInventory(inputInventory),inputInventory};
  let historicalPrReads=0;
  priorTransport={review:async id=>{assert.equal(id,c.authority.review.id);return clone(c.authority.review);},
   grant:async id=>clone([c.authority.grant,...Object.values(c.authority.linked)].find(v=>v.id===id)),
   permission:async login=>({permission:'admin',user:clone([c.authority.review,c.authority.grant,...Object.values(c.authority.linked)].find(v=>v.user.login===login).user)}),
   pullRequest:async()=>{historicalPrReads++;throw Error('a historical PR projection is forbidden');}};
  authority=await observeMaterialIntegrationPredecessorAuthority(a,{transport:priorTransport});assert.equal(historicalPrReads,0);
  preparation={schema:'augnes.local-canonical-integration-preparation.v1',target:integrationTarget(p),checkout_fingerprint:checkoutVerificationFingerprint(c.checkout),runtime_inputs:clone(c.inputs),
   input_inventory:inputInventory,inventory_sha256:live.inventory,dependencies:packages.map(v=>v.before)};
  review={schema:'augnes.local-canonical-candidate-review.v1',kind:p.kind,head,tree,predecessor_head:a.head,predecessor_tree:a.tree,source_review:'complete',
   delta_sha256:delta(a.head,head),changed_paths:git('diff','--name-only',a.head,head,'--').split('\n').sort(),authority_reference:'https://github.com/hynk-studio/augnes/pull/999',reviewed_at:new Date().toISOString(),
   integration_sha256:digest(p.integration),planner_sha256:p.planner.sha256,reviewer:'synthetic-separate-reviewer',implementation_actor:'synthetic-implementer',no_write:true,disposition:'accept',
   judgments:Object.fromEntries('complete_integration complete_overlaps complete_corrections verifier_policy_adjustments_only affected_consumers authority_and_lineage no_weakened_contract'.split(' ').map(k=>[k,true])),
   material_predecessor:{stock:ref('successful-stock.json',successStock),authority:ref('original-authority.json',authority)},preparation:ref('preparation.json',preparation),report:null};
  }
  const rebuild=()=>{review.report=ref('review.md',`Synthetic separate review ${p.head} ${p.tree} ${digest(p.integration)} ${review.delta_sha256}\n`);p.review=ref('review.json',review);h.write(file,canonicalSerialize(p));proof=readSourceCorrectionProof(file,c.checkout);};
  const prepare=()=>prepareAcceptedMainIntegrationCandidate({anchorRoot:c.anchor,repositoryRoot:c.checkout,proof,acceptedMain:main,runtimeInputs:c.inputs,live});
  const request=extra=>({anchorRoot:c.anchor,repositoryRoot:c.checkout,checkoutOwner:c.owner,branch:c.branch,head,tree,acceptedMain:main,runId:'material-reviewed-integration',
   contractFingerprint:digest(declaration),sourceCorrection:proof,revisionInputs:c.inputs,revisionLive:live,assertCurrent(){},...extra});
  rebuild();
  if(!stored){
  const prepared=prepare();assert.equal(prepared.eligible_evidence,true);assert.equal(prepared.authorized,false);assert.equal(prepared.reserved,false);assert.deepEqual(prepared.budget,{initial:1,recovery:0});noEdge();stage('prepared');
  }
  if(!stored&&!readerMode){
  // These direct reader mutations isolate complete-Full predicates instead of
  // allowing an unrelated artifact hash mismatch to hide the safety refusal.
  for(const mutate of [r=>r.phases=[],r=>r.phases.pop(),r=>r.outcome.safety='blocked',r=>r.outcome.disposition='product_failure',
   r=>r.cleanup.completed=false,r=>r.phases[0].cleanup.streams_closed=false,r=>r.phases[0].timed_out=true,r=>r.phases.find(v=>v.browser_use.length).browser_use.pop(),
   r=>r.attempt.source_correction.commission.ordinal=2]){
   const r=clone(prior);mutate(r);assert.throws(()=>verifyGitRevisionSuccess(r,successStock,c.inputs,REVIEWED_REVISION_PHASES));refusals++;
  }
  for(const mutate of [v=>v.source_correction.commission.maximum_invocations=2,v=>v.source_correction.commission.source_revision='unknown',
   v=>v.source_correction.commission.reviewed_workload='spent-terminal-git-successor-workload-v1']){
   const changed=clone(a);mutate(changed);await assert.rejects(()=>observeMaterialIntegrationPredecessorAuthority(changed,{transport:priorTransport}));noEdge();refusals++;
  }
  for(const badTransport of [{...priorTransport,permission:async login=>({permission:'read',user:{login}})},
   {...priorTransport,review:async id=>({...await priorTransport.review(id),commit_id:main})},
   {...priorTransport,grant:async id=>({...await priorTransport.grant(id),body:'unrelated or edited old commission'})}]){
   await assert.rejects(()=>observeMaterialIntegrationPredecessorAuthority(a,{transport:badTransport}));noEdge();refusals++;
  }
  const originalP=clone(p),originalReview=clone(review);
  const resetProof=()=>{p=clone(originalP);review=clone(originalReview);rebuild();};
  for(const mutate of [()=>p.prior_attempt_id='older',()=>delete p.integration_case,()=>p.integration_case='unknown',()=>p.kind='verifier_correction']){
   let error;try{mutate();rebuild();prepare();}catch(e){error=e;}assert(error);noEdge();refusals++;resetProof();
  }
  const completionFile=path.join(ledger,'completion-1.json'),completion=readFileSync(completionFile);
  for(const mutate of [()=>delete review.material_predecessor,()=>delete review.preparation,()=>review.material_predecessor.stock=ref('invalid-stock.json',{...successStock,valid_deciding_evidence:false}),
   ()=>review.material_predecessor.authority=ref('invalid-authority.json',{...clone(authority),observations:{}}),
   ()=>review.preparation=ref('invalid-preparation.json',{...preparation,inventory_sha256:digest('unbound current inputs')})]){
   let error;try{mutate();rebuild();readReviewedIntegration(c.checkout,proof,a,JSON.parse(completion));}catch(e){error=e;}assert(error);noEdge();refusals++;resetProof();
  }
  for(const patch of [{disposition:'product_failure'},{cleanup_complete:false}]){h.write(completionFile,{...JSON.parse(completion),...patch});try{assert.throws(prepare);noEdge();refusals++;}finally{h.write(completionFile,completion);}}
  stage('read_only_refusals');
  }
  await delay(2);
  const user={login:'synthetic-owner',id:1,type:'User'},at=new Date().toISOString();await delay(2);const later=new Date().toISOString(),url='https://api.github.com/repos/hynk-studio/augnes';
  const common={target:integrationTarget(p),review_sha256:p.review.sha256};
  const acceptance={id:3001,user,body:INTEGRATION_ACCEPT+'\n'+canonicalSerialize({...common,independent_report_sha256:review.report.sha256,scope:'reviewed_integration'}),state:'COMMENTED',commit_id:head,pull_request_url:url+'/pulls/999',author_association:'OWNER',submitted_at:at};
  const acceptanceObservation={id:3001,author:user.login,author_id:1,body_sha256:digest(acceptance.body),timestamp:at,role:'accepted_integration',commit_id:head};
  const grant={id:3002,user,body:INTEGRATION_GRANT+'\n'+canonicalSerialize({...common,acceptance_sha256:digest(acceptanceObservation),planner_sha256:p.planner.sha256,maximum_invocations:1,recovery:0,unchanged_retry:0,
   stop_on_failure_or_interruption:true,fresh_validation:true,independent_result_audit:true,owned_cleanup:true,cumulative_cost_and_timing_risk:'accept_once_under_unchanged_bounds'}),issue_url:url+'/issues/999',author_association:'OWNER',created_at:later,updated_at:later};
  const permission={permission:'admin',user},branch=(sha,ref)=>({sha,ref,repo:{full_name:'hynk-studio/augnes'}});
  records={acceptance,grant,acceptance_permission:permission,grant_permission:permission,pull_request:{number:999,state:'open',draft:true,auto_merge:null,head:branch(head,c.branch),base:branch(main,'main')}};
  const bindAuthority=()=>{p.authorization={acceptance_review_id:3001,acceptance_review_sha256:digest(acceptanceObservation),grant_comment_id:grant.id,
   grant_comment_sha256:digest({id:grant.id,author:user.login,author_id:1,body_sha256:digest(grant.body),timestamp:later,role:'prospective_grant',commit_id:null})};rebuild();};
  bindAuthority();await delay(2);
  const reserve=async extra=>beginAttempt(request({observeRevision:async()=>({authorization:await authorizeIntegration(proof,integrationMaterial(c.checkout,proof,c.anchor),integrationTransport(records)),live}),...extra}));
  if(!stored&&!readerMode){
  grant.id=72;bindAuthority();await assert.rejects(()=>reserve());noEdge();grant.id=3002;bindAuthority();refusals++;
  await assert.rejects(()=>reserve({assertCurrent(){throw Error('synthetic unsafe current preparation');}}),/unsafe/);noEdge();refusals++;
  const preparationFile=path.join(folder,'preparation.json'),preparationBytes=readFileSync(preparationFile);
  try{await assert.rejects(()=>reserve({observeRevision:async()=>{const authorization=await authorizeIntegration(proof,integrationMaterial(c.checkout,proof,c.anchor),integrationTransport(records));h.write(preparationFile,{changed:true});return{authorization,live};}}));noEdge();refusals++;}
  finally{h.write(preparationFile,preparationBytes);}
  stage('admission_refusals');
  // Only immutable evidence and source objects cross this serial boundary.
  // The later group rebuilds live inputs and new invocation-local authority.
  p.authorization=null;rebuild();h.write(handoff,{p,review,preparation,declaration,refusals});retain=true;return;
  }
  let admitted;
  if(readerMode)admitted=await reserve();
  else{
   const outcomes=await Promise.allSettled([reserve(),reserve()]);assert.equal(outcomes.filter(v=>v.status==='fulfilled').length,1);assert.equal(outcomes.filter(v=>v.status==='rejected').length,1);
   admitted=outcomes.find(v=>v.status==='fulfilled').value;
  }
  assert.deepEqual(admitted.budget,{initial:1,recovery:0});
  const start=admitted.started_at,finish=new Date().toISOString(),r=clone(prior),own={...r.checkout_ownership,checkout_fingerprint:preparation.checkout_fingerprint,acquired_at:start,released_at:finish};
  Object.assign(r.repository,{base_sha:main,head_sha:head,tree_sha:tree});Object.assign(r.integration_base,{requested_base_sha:main,tested_head_sha:head,checked_at:start});Object.assign(r.integration_base.observation,{sha:main,observed_at:start});
  r.run={id:admitted.attempt_id,invocation_id:digest(admitted.attempt_id).slice(0,32),started_at:start,finished_at:finish,duration_ms:Date.parse(finish)-Date.parse(start)};
  r.attempt=admitted;r.inputs=inputInventory;r.checkout_ownership=own;r.capacity_ownership={...r.capacity_ownership,...own,invocation_id:r.run.invocation_id};r.verification_context.checkout_fingerprint=preparation.checkout_fingerprint;
  for(const [i,key]of ['root_lock_sha256','nested_lock_sha256','web_planning_lock_sha256'].entries())r.dependencies[key]=packages[i].before.sources.find(v=>v.name==='package-lock.json').sha256;
  r.cleanup.isolated_resources.invocation_id=r.run.invocation_id;r.historical_inputs.invocation_id=r.run.invocation_id;
  for(const role of ['before','after'])Object.assign(r.cleanup.companion_service.observations[role],{started_at:start,finished_at:finish});
  for(const phase of r.phases)Object.assign(phase,{base_sha:main,head_sha:head,invocation_id:r.run.invocation_id,started_at:start,finished_at:finish,duration_ms:0});
  receipt=finalizeReceipt(r);h.storeReceipt(c,receipt);finishAttempt(admitted,{receiptFingerprint:receipt.integrity.content_fingerprint,disposition:'completed_success',cleanupComplete:true});stage('settled_success');
  const context={...h.read(path.join(c.artifacts,'cold-packet.json')).stockContext,expectedRunId:receipt.run.id,currentVerificationContext:r.verification_context,currentCheckoutFingerprint:own.checkout_fingerprint,currentInputStateValid:true,
   currentIdentity:{...h.read(path.join(c.artifacts,'cold-packet.json')).stockContext.currentIdentity,head_sha:head,branch:c.branch},
   currentIntegrationBase:{...r.integration_base,checked_at:finish,observation:{...r.integration_base.observation,observed_at:finish}},
   currentLocks:Object.fromEntries(['root','nested','webPlanning'].map((name,i)=>[name,packages[i].before.sources.find(v=>v.name==='package-lock.json').sha256]))};
  if(readerMode){
   assert(await inspectAttemptRecords({anchorRoot:c.anchor,repositoryRoot:c.checkout,receipt}));
   await callback({receipt,context,partitionSources});preserved();return;
  }
  // The owned cold process below supplies the success stock, exact tip and
  // historical-prefix checks once. Keep this local observation for the distinct
  // current-input failure, which must preserve the recorded successful result.
  const drift=await inspectIntegrationStock({anchorRoot:c.anchor,repositoryRoot:c.checkout,receipt,assertCurrent(){throw Error('current inputs changed');},transport:integrationTransport(records)});
  const driftResult=inspectReceiptForDecision(receipt,{...context,...drift});assert.equal(drift.currentAttemptRecordsValid,true);assert.equal(driftResult.dimensions.evidence_validity,'valid_in_recorded_context');assert.equal(driftResult.valid_deciding_evidence,false);
  const packet=path.join(folder,'cold-packet.json'),stockOutput=path.join(folder,'fresh-stock.json');
  h.write(packet,{anchor:c.anchor,checkout:c.checkout,inputs:c.inputs,live,materialPredecessor:prior,materialGrants:beforeTip.revision_grants,integrationRecords:records,stockContext:context,stockOutput});
  await h.fresh(packet);assert.equal(h.read(stockOutput).valid_deciding_evidence,true);stage('cold_stock');
  await assert.rejects(()=>reserve());assert.throws(prepare);assert.throws(()=>beginAttempt(request({sourceCorrection:null})));preserved();
  // Reconstruct the same synthetic reservation boundary to test interruption;
  // restore only this fixture's saved bytes, never a real commission or ledger.
  restoreLedger();
  const originalWrite=writeFileSync;
  try{
   const fs=await import('node:fs');fs.default.writeFileSync=function(target,...args){if(String(target).endsWith('attempt-1.json')&&!originalFiles.has(String(target)))throw Error('synthetic interruption after material integration edge');return originalWrite(target,...args);};syncBuiltinESMExports();
   await assert.rejects(()=>reserve(),/synthetic interruption/);assert(existsSync(edge));assert.throws(()=>reconstructAttemptTip({anchorRoot:c.anchor,repositoryRoot:c.checkout,branch:c.branch}));await assert.rejects(()=>reserve());
  }finally{const fs=await import('node:fs');fs.default.writeFileSync=originalWrite;syncBuiltinESMExports();}
  console.log(JSON.stringify({material_integration:{synthetic_only:true,eligible_successful_exhausted_material_v7:true,refusals,full_phases:receipt.phases.length,
   budget:{initial:1,recovery:0},historical_grants:beforeTip.revision_grants,historical_consumption:1,old_prefix_without_current_authority:true,fresh_stock:true,competing_and_interrupted_edges_retained:true,originals_unchanged:true}}));
 } finally {
  restoreLedger();git('reset','--hard',a.head);git('update-ref','refs/remotes/origin/main',oldMain);if(createdMain)git('branch','-D','material-accepted-main');h.write(exclude,excludeBytes);
  for(const dir of ['','apps/augnes_apps','apps/web_planning'])rmSync(path.join(c.checkout,dir,'node_modules'),{recursive:true,force:true});
  if(!retain){rmSync(folder,{recursive:true,force:true});rmSync(handoff,{force:true});}if(receipt)rmSync(path.join(c.checkout,'.augnes-local-verification/receipts',receipt.run.id+'.json'),{force:true});preserved();
  assert.deepEqual(reconstructAttemptTip({anchorRoot:c.anchor,repositoryRoot:c.checkout,branch:c.branch}),beforeTip);
 }
}

// The real attempt reader replays disposable authenticated evidence and physical
// settlement. Current stock compatibility never edits those historical records.
async function currentGitStockControls(c,p,cap,receipt) {
 const inventory=clone(receipt.inputs),changed=clone(inventory),git=changed.resources.find(r=>r.id==='git-config');
 for(const key of ['inode','mtime_ns','ctime_ns'])git.before.metadata[key]=String(BigInt(git.before.metadata[key])+1n);
 assert.equal(gitRevisionInventory(inventory),p.inputs.inventory_sha256);
 const live={...clone(c.live),inputInventory:changed,inventory:gitRevisionInventory(changed)};
 const family=path.join(c.anchor,'.augnes-local-verification/families',receipt.attempt.family_id);
 const files=[c.file,...['attempt-1.json','completion-1.json'].map(name=>path.join(family,name)),
  path.join(c.checkout,'.augnes-local-verification/receipts',receipt.run.id+'.json')];
 const originals=files.map(file=>digest(readFileSync(file))),receiptHash=digest(receipt),tipHash=digest(reconstructAttemptTip({anchorRoot:c.anchor,repositoryRoot:c.checkout,branch:c.branch}));
 const inspect=(current,contract=GIT_CURRENT_STOCK_COMPARISON,r=receipt)=>inspectAttemptRecords({
  anchorRoot:c.anchor,repositoryRoot:c.checkout,receipt:r,revisionInputs:c.inputs,gitCurrentStockContract:contract,
  observeRevision:()=>({authorization:cap,live:current}),assertCurrent(){}});
 assert.equal(await inspect(live,null),false);assert.equal(await inspect(live,'unsupported'),false);
 assert.equal(await inspect(live),true);
 const same={...clone(c.live),inputInventory:inventory,inventory:gitRevisionInventory(inventory)};
 assert.equal(await inspect(same),true);
 const different=clone(live);different.inputInventory.resources.find(r=>r.id==='git-config').before.sha256=digest('different full config bytes');
 different.inventory=gitRevisionInventory(different.inputInventory);assert.equal(await inspect(different),false);
 assert.equal(await inspect({...live,inventory:digest('unbound inventory claim')}),false);
 assert.equal(await inspect({...live,inputInventory:undefined}),false);
 const tampered=clone(receipt);tampered.inputs=changed;
 assert(gitRevisionStockComparison(tampered.inputs,live.inputInventory,GIT_CURRENT_STOCK_COMPARISON).equivalent);
 assert.equal(await inspect(live,GIT_CURRENT_STOCK_COMPARISON,tampered),false,'historical receipt catalogue must still match the proof raw pin');
 assert.deepEqual(files.map(file=>digest(readFileSync(file))),originals);assert.equal(digest(receipt),receiptHash);
 assert.equal(digest(reconstructAttemptTip({anchorRoot:c.anchor,repositoryRoot:c.checkout,branch:c.branch})),tipHash);
 console.log(JSON.stringify({git_current_stock:{contract:GIT_CURRENT_STOCK_COMPARISON,synthetic_only:true,
  historical_inventory_sha256:gitRevisionInventory(inventory),current_inventory_sha256:live.inventory,
  allowed_metadata_stock:true,legacy_and_unknown_strict:true,full_content_and_hash_claim_refused:true,historical_pin_exact:true,physical_accounting_unchanged:true}}));
}

// Pure variants complement the actual integration-failure/fresh-stock/physical
// successor sequence below; none is authority or an observation of host QA.
function materialPredecessorCompatibility(c) {
 const receipt=clone(c.prior),failed=REVIEWED_REVISION_PHASES.indexOf('integration');
 const cleanup=clone(receipt.phases.find(v=>v.status==='failure').cleanup);
 const exe=receipt.inputs.resources.find(v=>v.id==='browser-executable');
 const browser={contract:'augnes.local-canonical-browser-use.v2',executable_name:'Fixture',location_fingerprint:exe.location_fingerprint,
  before:exe.before,after:exe.before,actual_version:'Chrome/1',runtime_versions:{http:'Chrome/1',cdp:'Chrome/1'},disposition:'unchanged',unchanged:true};
 const sequence=Object.entries(browserConsumersForPhase('integration')).flatMap(([consumer,count])=>Array.from({length:count},()=>({...browser,consumer})));
 receipt.integration_base.contract='augnes.local-canonical-integration-base.v2';
 for(const [i,phase]of receipt.phases.entries())Object.assign(phase,{
  status:i<failed?'pass':i===failed?'failure':'not_run',exit_status:i<failed?0:i===failed?1:null,
  failure_code:i<failed?null:i===failed?'phase_failed':'phase_not_run',
  started_at:i>failed?null:receipt.run.started_at,finished_at:i>failed?null:receipt.run.finished_at,
  environment_fingerprint:i>failed?null:receipt.inputs.binding.phase_environment_fingerprints[i].fingerprint,
  cleanup:i>failed?null:clone(cleanup),browser_use:[]});
 const stockFor=r=>({...clone(c.materialStock),dimensions:{...c.materialStock.dimensions,current_merge_applicability:'different_current_main'},
  issues:['receipt_classified_outcome_not_passing','receipt_final_result_not_pass','receipt_non_deciding',
   ...r.phases.filter(p=>p.status!=='pass').map(p=>'phase_not_passing:'+p.id),'receipt_phase_environment_binding_invalid',
   ...r.phases.filter(p=>p.status!=='not_run'&&!validPhaseBrowserUse(p,p.browser_use,exe)).map(p=>'receipt_browser_identity_invalid:'+p.id)].sort()});
 const verify=(r,s=stockFor(r),material=true)=>verifyGitRevisionFailure(r,s,c.inputs,REVIEWED_REVISION_PHASES,2,false,false,false,material);
 let accepted=0,refused=0;
 for(let n=0;n<=sequence.length;n++){const r=clone(receipt);r.phases[failed].browser_use=sequence.slice(0,n);assert.doesNotThrow(()=>verify(r));accepted++;}
 const unknown=stockFor(receipt);unknown.dimensions.current_merge_applicability='current_main_unobserved';assert.doesNotThrow(()=>verify(receipt,unknown));accepted++;
 assert.throws(()=>verify(receipt,stockFor(receipt),false));refused++;
 // A dedicated Browser failure must not inherit integration's partial prefix.
 const dedicated=clone(receipt),browserFailed=REVIEWED_REVISION_PHASES.indexOf('e2e-project-experience');
 for(let i=failed;i<=browserFailed;i++)Object.assign(dedicated.phases[i],{
  status:i<browserFailed?'pass':'failure',exit_status:i<browserFailed?0:1,failure_code:i<browserFailed?null:'phase_failed',
  started_at:receipt.run.started_at,finished_at:receipt.run.finished_at,cleanup:clone(cleanup),
  environment_fingerprint:receipt.inputs.binding.phase_environment_fingerprints[i].fingerprint,
  browser_use:i===failed?sequence:[]});
 assert.throws(()=>verify(dedicated));refused++;
 for(const mutate of [
  r=>r.integration_base.contract='augnes.local-canonical-integration-base.v1',r=>r.integration_base.contract='unsupported',
  r=>r.receipt_version=3,r=>r.integration_base.tested_head_sha='0'.repeat(40),r=>r.integration_base.base_is_ancestor_of_head=false,
  r=>r.integration_base.checked_at=new Date(0).toISOString(),r=>r.integration_base.observation.source='untrusted',
  r=>r.phases[failed].browser_use=[{...sequence[0],actual_version:'Chrome/other'}],
  r=>r.phases[failed].browser_use=Array(4).fill(sequence[0]),r=>r.phases[failed].browser_use=[sequence[3]],
  r=>r.phases[failed].browser_use=[sequence[0],sequence[3],sequence[0]],
  r=>r.phases[failed+1].browser_use=[sequence[0]],r=>r.phases[failed-1].status='not_run',
  r=>r.phases[failed].cleanup.termination_reason='cancelled',r=>r.phases[failed].cleanup.remaining_owned_processes=1,
  r=>r.outcome.safety='blocked',r=>r.phases[failed].timed_out=true,
 ]){const r=clone(receipt);mutate(r);assert.throws(()=>verify(r));refused++;}
 for(const mutate of [s=>s.dimensions.current_merge_applicability='blocked',s=>s.dimensions.safety='blocked',
  s=>s.issues=s.issues.filter(v=>!v.startsWith('receipt_browser_identity_invalid:')),s=>s.issues.push('unexplained')]){
  const s=stockFor(receipt);mutate(s);assert.throws(()=>verify(receipt,s));refused++;
 }
 runMaterialCurrentStockMismatchControls(c,receipt,stockFor);
 console.log(JSON.stringify({material_predecessor_compatibility:{accepted,refused,legacy_requires_complete_browser:true,synthetic_only:true}}));
}

export function runMaterialCurrentStockMismatchControls(c,base,stockFor,{quiet=false}={}) {
 const r=clone(base),failed=r.phases.findIndex(v=>v.id==='integration');
 Object.assign(r.attempt.source_correction.commission,{source_revision:MATERIAL_SOURCE_CORRECTION,ordinal:1,maximum_invocations:1});
 r.attempt.source_correction.inputs.inventory_sha256=gitRevisionInventory(r.inputs);
 const original=finalizeReceipt(r),prior=original.attempt,resources=clone(original.inputs.resources);
 const git=resources.find(v=>v.id==='git-config');git.before.sha256=digest('different complete Git file, identical scoped projection');
 git.before.metadata.bytes=String(BigInt(git.before.metadata.bytes)+1n);
 const current={contract:original.inputs.contract,path_kind:original.inputs.path_kind,binding:{},resources};
 current.fingerprint=digest(current);
 const snapshot={observed_at:new Date(Date.parse(original.run.finished_at)+1).toISOString(),runtime:clone(c.inputs),
  inventory:gitRevisionInventory(current),service:{historical_only:true},inputInventory:current};
 const stock={...stockFor(original),content_fingerprint:original.integrity.content_fingerprint,
  current_stock_input_comparison:gitRevisionStockComparison(original.inputs,current,GIT_CURRENT_STOCK_COMPARISON)};
 stock.issues.push('receipt_attempt_records_unverified');stock.issues.sort();
 const p={schema:'augnes.local-canonical-source-correction.v7',kind:'reviewed_revision',
  commission:{source_revision:MATERIAL_SOURCE_CORRECTION,ordinal:1,maximum_invocations:1},
  inputs:{identity_sha256:digest(c.inputs)},
  prior_family_id:prior.family_id,prior_number:prior.number,prior_attempt_id:prior.attempt_id,prior_receipt_fingerprint:original.integrity.content_fingerprint};
 const ref={artifact:'retained-complete-observation.json',sha256:digest(JSON.stringify(snapshot))};
 const focused={finished_at:new Date(Date.parse(original.run.finished_at)+2).toISOString(),
  predecessor_stock:{contract:MATERIAL_CURRENT_STOCK_GIT_MISMATCH,observation:ref}};
 const check=(receipt=original,observation=snapshot,s=stock,f=focused,q=p,prospective=c.inputs)=>{
  const observedRef={artifact:ref.artifact,sha256:digest(JSON.stringify(observation))};
  const focus=f===focused&&observation!==snapshot?{...f,predecessor_stock:{...f.predecessor_stock,observation:observedRef}}:f;
  const parse=reference=>{assert.deepEqual(reference,observedRef);return observation;};
  const token=verifyMaterialCurrentStockMismatchPredecessor(q,receipt.attempt,focus,{original:receipt,stock:s,parse,
   inventory:gitRevisionInventory,stockComparison:gitRevisionStockComparison,stockContract:GIT_CURRENT_STOCK_COMPARISON});
  assert(verifiedMaterialCurrentStockMismatchPredecessor(token,receipt,s));
  verifyGitRevisionFailure(receipt,s,prospective,REVIEWED_REVISION_PHASES,1,false,false,false,true,null,null,token);return token;
 };
 const token=check();let accepted=1,refused=0;
 assert.throws(()=>verifyGitRevisionFailure(original,stock,c.inputs,REVIEWED_REVISION_PHASES,1,false,false,false,true));refused++;
 assert.throws(()=>verifyGitRevisionFailure(original,stock,c.inputs,REVIEWED_REVISION_PHASES,1,false,false,false,true,null,null,{...token}));refused++;
 for(const mutate of [o=>o.current_stock_input_comparison.equivalent=true,o=>o.current_stock_input_comparison.current_inventory_sha256=digest('other sample'),
  o=>o.issues.pop(),o=>o.issues.push('unexplained'),o=>o.content_fingerprint=digest('other receipt')]){
  const s=clone(stock);mutate(s);assert.throws(()=>check(original,snapshot,s));
  assert(!verifiedMaterialCurrentStockMismatchPredecessor(token,original,s));refused++;
 }
 for(const mutate of [o=>o.outcome.first_fault={invented:true},o=>o.attempt.source_correction.commission.ordinal=2,
  o=>o.phases[failed].browser_use=[o.phases[failed].browser_use[0],{...o.phases[failed].browser_use[0],consumer:'foreign'}],
  o=>o.phases[failed].cleanup.remaining_owned_processes=1,o=>o.integration_base.contract='unsupported']){
  const changed=clone(original);mutate(changed);assert.throws(()=>check(changed));refused++;
 }
 for(const [index,mutate] of [o=>delete o.inputInventory,o=>o.inventory=digest('other inventory'),o=>o.runtime={substituted:true},
  o=>o.observed_at=original.run.started_at,o=>o.inputInventory.resources.pop(),
  o=>o.inputInventory.resources.find(v=>v.id==='node-executable').before.sha256=digest('other executable'),
  o=>o.inputInventory.resources.find(v=>v.id==='git-config').before.git_projection.effective_sha256=digest('other scoped projection'),
  o=>o.inputInventory.resources.find(v=>v.id==='git-config').before.permission_identity=digest('other permissions'),
  o=>o.inputInventory.resources.find(v=>v.id==='git-config').before.sha256=original.inputs.resources.find(v=>v.id==='git-config').before.sha256,
  o=>o.inputInventory.resources.find(v=>v.id==='git-config').before.metadata.bytes=original.inputs.resources.find(v=>v.id==='git-config').before.metadata.bytes].entries()){
  const observation=clone(snapshot);mutate(observation);
  let s=stock;
  if(index>=4&&observation.inputInventory){
   const {contract,path_kind,binding,resources}=observation.inputInventory;
   observation.inputInventory.fingerprint=digest({contract,path_kind,binding,resources});
   try{observation.inventory=gitRevisionInventory(observation.inputInventory);s={...stock,
    current_stock_input_comparison:gitRevisionStockComparison(original.inputs,observation.inputInventory,GIT_CURRENT_STOCK_COMPARISON)};}catch{}
  }
  assert.throws(()=>check(original,observation,s));refused++;
 }
 for(const mutate of [f=>delete f.predecessor_stock,f=>f.predecessor_stock.contract='unsupported',f=>delete f.predecessor_stock.observation,
  f=>f.predecessor_stock.observation.sha256=digest('substituted artifact')]){
  const f=clone(focused);mutate(f);assert.throws(()=>check(original,snapshot,stock,f));refused++;
 }
 for(const mutate of [q=>q.prior_family_id=digest('stale tip'),q=>q.prior_number=2,q=>q.prior_attempt_id='replayed tip',
  q=>q.commission.ordinal=2,q=>q.commission.maximum_invocations=2,q=>delete q.commission.source_revision,
  q=>q.authorization={grant_comment_id:prior.source_correction.authorization.grant_comment_id}]){
  const q=clone(p);mutate(q);assert.throws(()=>check(original,snapshot,stock,focused,q));refused++;
 }
 assert.throws(()=>verifyGitRevisionFailure(original,stock,c.inputs,REVIEWED_REVISION_PHASES,1,false,false,false,false,null,null,token));refused++;
 assert.throws(()=>verifyGitRevisionFailure(original,stock,c.inputs,REVIEWED_REVISION_PHASES,1,true,false,false,true,null,null,token));refused++;
 const prospective=clone(c.inputs);prospective.node.observation.metadata.device=String(BigInt(prospective.node.observation.metadata.device)+1n);
 prospective.headers.observation.inventory_sha256=digest('new prospective physical header inventory, unchanged content');
 const prospectiveProof={...clone(p),inputs:{identity_sha256:digest(prospective)}};
 const prospectiveToken=check(original,snapshot,stock,focused,prospectiveProof,prospective);accepted++;
 const historical=materialCurrentStockHistoricalRuntime(prospectiveToken,original,stock,prospective);
 assert.deepEqual(historical,c.inputs);historical.node.observation.metadata.device='0';
 assert.deepEqual(materialCurrentStockHistoricalRuntime(prospectiveToken,original,stock,prospective),c.inputs);
 assert.throws(()=>verifyGitRevisionFailure(original,stock,c.inputs,REVIEWED_REVISION_PHASES,1,false,false,false,true,null,null,prospectiveToken));refused++;
 const tamperedProspective=clone(prospective);tamperedProspective.headers.observation.inventory_sha256=digest('unbound prospective identity');
 assert.throws(()=>verifyGitRevisionFailure(original,stock,tamperedProspective,REVIEWED_REVISION_PHASES,1,false,false,false,true,null,null,prospectiveToken));refused++;
 assert.throws(()=>verifyGitRevisionFailure(original,stock,prospective,REVIEWED_REVISION_PHASES,1,false,false,false,true));refused++;
 for(const mutate of [q=>delete q.inputs,q=>q.inputs.identity_sha256='invalid']){
  const q=clone(p);mutate(q);assert.throws(()=>check(original,snapshot,stock,focused,q));refused++;
 }
 for(const mutate of [r=>r.inputs.binding.runtime_inputs.node.observation.metadata.device='0',
  r=>delete r.attempt.source_correction.inputs.identity_sha256,r=>delete r.attempt.source_correction.authorization.grant_sha256]){
  const changed=clone(original);mutate(changed);
  const {contract,path_kind,binding,resources}=changed.inputs;changed.inputs.fingerprint=digest({contract,path_kind,binding,resources});
  changed.attempt.contract_fingerprint=changed.inputs.fingerprint;const sealed=finalizeReceipt(changed);
  const q={...clone(p),prior_receipt_fingerprint:sealed.integrity.content_fingerprint},s={...stock,content_fingerprint:sealed.integrity.content_fingerprint};
  assert.throws(()=>check(sealed,snapshot,s,focused,q));refused++;
 }
 const invalidRuntime={...prospective,headers:{...prospective.headers,observation:{...prospective.headers.observation,inventory_sha256:'invalid'}}};
 assert.throws(()=>check(original,snapshot,stock,focused,{...clone(p),inputs:{identity_sha256:digest(invalidRuntime)}},invalidRuntime));refused++;
 assert.equal(stock.valid_deciding_evidence,false);assert.equal(stock.current_stock_input_comparison.equivalent,false);
 assert.deepEqual(original,finalizeReceipt(r));
 const summary={accepted,refused,synthetic_only:true,historical_false_stock_retained:true,current_runtime_bound_independently:true,
  complete_git_comparison_strict:true,unverified_not_relabelled:true};
 if(!quiet)console.log(JSON.stringify({material_current_stock_git_mismatch:summary}));return summary;
}

export function seedMaterialSourceFiles(c,write) {
 for(const name of recoveryPaths)write(path.join(c.checkout,name),'// Disposable synthetic recovery source; no service operation.\n');
 c.git(['add','plugins']);
 seedMaterialRecoveryIdentity(c,{});
 write(path.join(c.checkout,product),JSON.stringify({primary:false,journal:false})+'\n');
 write(path.join(c.checkout,driver),'import assert from "node:assert/strict"; import {readFileSync} from "node:fs"; const state=JSON.parse(readFileSync(new URL("../apps/web_planning/src/exchange-client.js.txt",import.meta.url))); assert.equal(state[process.argv[2]??"primary"],true); console.log("corrected "+(process.argv[2]??"primary"));\n');
 write(path.join(c.checkout,predecessorDriver),'import assert from "node:assert/strict"; assert.fail("synthetic prior defect");\n');
}

// Spend the supported acquisition commission through its ordinary two-slot
// path. Reusable material-source controls need no retired workload controller.
export async function prepareMaterialSourcePredecessor(c,h,initial,firstAttempt,initialAuthority) {
 const authority=clone(c.authority),dependencies=dependencyRecords(c);
 seedMaterialRecoveryIdentity(c,h);
 c.behaviorPath=predecessorDriver;
 const first=await executeFixture(c,{...h,begin:()=>firstAttempt},initial,initialAuthority,null,dependencies);
 assert.equal(first.stock.valid_deciding_evidence,false);assert.equal(first.child.result.exit_code,1);
 const priorHead=c.head,red=await h.behavior(c);
 h.write(path.join(c.checkout,predecessorDriver),'console.log("corrected synthetic predecessor");\n');
 c.git(['add',predecessorDriver]);c.git(['-c','user.name=Fixture','-c','user.email=fixture@example.invalid','commit','--quiet','-m','correct synthetic predecessor']);
 c.prior=first.receipt;h.prepare(c,2);const p=c.proof;
 p.commission=clone({...initial.commission,ordinal:2});p.accepted=clone(initial.accepted);
 p.inputs.inventory_sha256=initial.inputs.inventory_sha256;
 p.originals.stock=h.artifact(c,'prior-stock.log',JSON.stringify(first.stock));
 const green=await h.behavior(c);assert.equal(red.result.exit_code,1);assert.equal(green.result.exit_code,0);
 const source=c.git(['show',p.head+':'+predecessorDriver]);
 const witness=(label,run,head)=>h.artifact(c,label+'.json',{...run,node_version:CANONICAL_NODE_VERSION,runtime_inputs_sha256:p.inputs.identity_sha256,
  file_sha256:digest(c.git(['show',head+':'+predecessorDriver])),stdout:h.artifact(c,label+'.log',run.output)});
 const before=witness('red',red,priorHead),after=witness('green',green,p.head);
 const focused=h.read(path.join(c.artifacts,p.focused.artifact));
 Object.assign(focused,{finished_at:now(),failed_phase:'authority',diagnosis:'Natural predecessor failure followed by its directly implicated behavioral correction.',
  implicated_paths:[predecessorDriver],source_files:[{path:predecessorDriver,byte_size:source.length,sha256:digest(source)}],input_remedy_resources:[],
  regression:{path:predecessorDriver,args:[],before,after},commands:[{command:green.command,tested_source_head:p.head,result:green.result,record:after,stdout:h.read(path.join(c.artifacts,after.artifact)).stdout}]});
 p.focused=h.artifact(c,'focused.json',focused);p.source=h.artifact(c,'source.json',{...h.read(path.join(c.artifacts,p.source.artifact)),reviewed_at:now()});
 c.authority=authority;c.authority.pr.head.sha=p.head;
 const review={...authority.review,id:33,commit_id:p.head,submitted_at:now(),body:[decision,p.base,p.head,p.tree,p.prior_receipt_fingerprint,gitReviewTarget(p)].join('\n')};
 c.authority.contractReview=review;c.authority.contractPr=999;
 p.authorization={...clone(initial.authorization),contract_review:{pull_request:999,id:33,head:p.head,sha256:digest(reviewedRevisionAuthorityObservation(review,'contract_review'))}};
 h.write(c.file,p);const parsed=h.proof(c),cap=await h.auth(c,parsed);
 c.behaviorPath=driver;
 const second=await executeFixture(c,{...h,begin:(subject,proof,auth,extra)=>h.begin(subject,proof,auth,{...extra,runId:'acquisition-second'})},parsed,cap,null,dependencies);
 assert.equal(second.stock.valid_deciding_evidence,false);assert.equal(second.child.result.exit_code,1);
 c.prior=second.receipt;c.materialStock=second.stock;
 const tip=reconstructAttemptTip({anchorRoot:c.anchor,repositoryRoot:c.checkout,branch:c.branch});
 assert.equal(tip.reviewed_revision_consumed,2);assert.deepEqual(tip.revision_grants,[11,32]);
}

export async function runMaterialSourceControls(c,h,group) {
 materialRecoveryEnvironment(c);
 const ref=(name,value)=>h.artifact(c,name,value),read=r=>h.read(path.join(c.artifacts,r.artifact));
 const inspect=(p,live=c.live)=>{const material=clone(p);delete material.authorization;delete material.accepted.review;delete material.local_relative_path;
  const file=path.join(c.artifacts,'material.json');h.write(file,material);
  return inspectGitRevisionPreparation({file,repositoryRoot:c.checkout,predecessorRoot:c.checkout,anchorRoot:c.anchor,runtimeInputs:c.inputs,live});};
 const tip=()=>reconstructAttemptTip({anchorRoot:c.anchor,repositoryRoot:c.checkout,branch:c.branch});
 const bind=()=>h.write(c.file,c.proof);
 const execute=(p,cap,browser=null,options={})=>executeFixture(c,{...h,...options,begin:(subject,proof,authority,extra)=>h.begin(subject,proof,authority,{...extra,runId:'material-grant-'+proof.authorization.grant_comment_id})},p,cap,browser,dependencyRecords(c));
 const preserve=()=>{
  const result=[];let r=c.prior.attempt;
  while(r){const dir=path.join(c.anchor,'.augnes-local-verification/families',r.family_id);
   for(const name of ['attempt-1.json','completion-1.json','correction-successor.json'])if(existsSync(path.join(dir,name)))result.push([path.join(dir,name),digest(readFileSync(path.join(dir,name)))]);
   const receipt=path.join(c.checkout,'.augnes-local-verification/receipts',r.attempt_id+'.json');
   if(existsSync(receipt))result.push([receipt,digest(readFileSync(receipt))]);
   const p=r.source_correction;
   if(p?.local_relative_path){const folder=path.dirname(path.join(c.checkout,p.local_relative_path));for(const name of readdirSync(folder)){const f=path.join(folder,name);result.push([f,digest(readFileSync(f))]);}}
   r=p?h.read(path.join(c.anchor,'.augnes-local-verification/families',p.prior_family_id,'attempt-'+p.prior_number+'.json')):null;
  }return result;
 };
 const unchanged=()=>{for(const [file,sha]of c.materialPreserved)assert.equal(digest(readFileSync(file)),sha);};
 async function correct(field,id) {
  const priorHead=c.head,authority=clone(c.authority);
  c.behaviorPath=driver;c.behaviorArgs=[field];
  const red=await h.behavior(c);assert.equal(red.result.exit_code,1);
  const content=JSON.parse(readFileSync(path.join(c.checkout,product)));content[field]=true;h.write(path.join(c.checkout,product),JSON.stringify(content)+'\n');
  c.git(['add',product]);c.git(['-c','user.name=Fixture','-c','user.email=fixture@example.invalid','commit','--quiet','-m','correct synthetic '+field]);
  c.head=c.git(['rev-parse','HEAD']).toString().trim();c.tree=c.git(['rev-parse','HEAD^{tree}']).toString().trim();
  const green=await h.behavior(c);assert.equal(green.result.exit_code,0);
  if(field==='primary'){
   h.write(path.join(c.checkout,'docs/material-source-note.md'),'Document the tested correction without changing consumed bytes.\n');
   c.git(['add','docs']);c.git(['-c','user.name=Fixture','-c','user.email=fixture@example.invalid','commit','--quiet','-m','document synthetic correction']);
  }
  c.acceptedHead=c.git(['rev-parse','HEAD']).toString().trim();c.acceptedTree=c.git(['rev-parse','HEAD^{tree}']).toString().trim();c.grantId=id+2;
  h.prepare(c);const p=c.proof;
  Object.assign(p.commission,{source_revision:MATERIAL_SOURCE_CORRECTION,maximum_invocations:1,input_acquisition:c.prior.attempt.source_correction.commission.input_acquisition});
  p.inputs.inventory_sha256=c.prior.attempt.source_correction.inputs.inventory_sha256;
  p.originals.stock=ref('prior-stock.log',JSON.stringify(c.materialStock));
  p.source=ref('source.json',{...read(p.source),reviewed_at:now()});
  const witness=(label,run,head)=>{
   const source_files=[driver,product].map(name=>{const b=c.git(['show',head+':'+name]);return{path:name,byte_size:b.length,sha256:digest(b)};});
   return ref(label+'.json',{...run,output:undefined,dirty:'',environment:digest({runtime:c.inputs,environment:'owned fixture environment'}),
    modules:[{path:product,sha256:source_files[1].sha256}],source_files,node_version:CANONICAL_NODE_VERSION,
    file_sha256:source_files[0].sha256,runtime_inputs_sha256:digest(c.inputs),stdout:ref(label+'.log',run.output)});
  };
  const before=witness('before',red,priorHead),after=witness('after',green,green.tested_source_head);
  const equivalence=green.tested_source_head===p.head?{}:{after_equivalence:{target:p.head,classification:'documentation-only',delta:read(p.source).accepted_to_final}};
  if(equivalence.after_equivalence){const from=green.tested_source_head,patch=c.git(['diff','--binary','--full-index','--no-ext-diff','--no-textconv',from,p.head,'--']);equivalence.after_equivalence.delta={bytes:patch.length,sha256:digest(patch),paths:c.git(['diff','--name-only',from,p.head,'--']).toString().trim().split('\n').filter(Boolean).sort()};}
  const focused={...read(p.focused),finished_at:now(),implicated_paths:[product],source_files:read(after).source_files,input_remedy_resources:[],failed_phase:c.prior.phases.find(phase=>phase.status==='failure').id,
   remedy:'Preserve the selected view lifetime without replacing the primary operation error.',diagnosis:'The actual behavioral subprocess read the wrong controlled owner state and failed its unchanged assertion.',
   regression:{path:driver,args:[field],before,after,...equivalence},commands:[{command:green.command,tested_source_head:green.tested_source_head,result:green.result,record:after,stdout:read(after).stdout}]};
  p.focused=ref('focused.json',focused);
  const delegation={...authority.grant,id,created_at:now(),body:[
   'Authorize one materially corrected-source qualification assignment on '+p.branch+' in Draft PR #999. Adopt the reusable material-source-correction-v1 transition within the existing inventory-bound v7 owners for the observed in-scope product defect.',
   'Predecessor: '+p.prior_family_id+' / '+p.prior_attempt_id+' / '+p.prior_receipt_fingerprint+'.',MATERIAL_HISTORY_BOUNDARY,
   'After separate independent acceptance of the actual correction, policy controls, exact published source and real preparation commitment, authorize the operator to record that decision faithfully and publish a separate new prospective commission through the authenticated maintainer identity. Each commission permits exactly one deciding invocation total; reservation or interruption consumes it. No ordinal two, recovery or unchanged-target retry under that commission. A further in-scope material correction requires fresh evidence, independent acceptance and new authenticated authority. Complete planner-selected qualification, separate fresh-process stock, owned cleanup and independent result audit remain required.'
  ].join('\n\n')};delegation.updated_at=delegation.created_at;
  p.commission.delegation={id,sha256:digest(reviewedRevisionAuthorityObservation(delegation,'task_delegation'))};
  if(field==='primary'){
   const ordinary=inspect(p);assert.equal(ordinary.authorized,false);assert.equal(ordinary.reserved,false);
   materialRecoverySettlement(c,h,p);
   assert.equal(inspect(p).reserved,false);
   materialRecoveryStart(c,h,p,inspect);
  }
  const prepared=inspect(p);assert.equal(prepared.authorized,false);assert.equal(prepared.reserved,false);assert.equal(prepared.consumed,c.prior.attempt.source_correction.commission.maximum_invocations);
  await delay(2);const review={...authority.review,id:id+1,commit_id:p.head,submitted_at:now(),body:[decision,p.head,p.tree,p.base,gitReviewTarget(p),p.prior_receipt_fingerprint,MATERIAL_HISTORY_BOUNDARY].join('\n')};
  p.accepted.review={id:review.id,sha256:digest(reviewedRevisionAuthorityObservation(review,'accepted_revision'))};
  await delay(2);const grant={...authority.grant,id:id+2,created_at:now(),body:[
   'Authorize one NEW prospective v7 reviewed_revision commission for a material source correction.',p.schema,p.branch,p.head,p.tree,p.base,gitReviewTarget(p),p.prior_receipt_fingerprint,
   'https://github.com/hynk-studio/augnes/pull/999#issuecomment-'+id,'https://github.com/hynk-studio/augnes/pull/999#pullrequestreview-'+review.id,MATERIAL_HISTORY_BOUNDARY,
   'The old commission remains spent. Exactly one admitted deciding invocation total; demonstrated material correction and focused support; zero unchanged-target retry; zero extra recovery. Reservation/interruption consumes. No ordinal two, recovery or unchanged-target retry under this commission. Require separate fresh-process stock and independent result audit.'
  ].join('\n')};grant.updated_at=grant.created_at;
  p.authorization={grant_comment_id:grant.id,grant_sha256:digest(reviewedRevisionAuthorityObservation(grant,'execution_commission'))};
  c.authority={...c.authority,review,grant,linked:{['repos/hynk-studio/augnes/issues/comments/'+id]:delegation}};delete c.authority.contractReview;
  bind();assert.equal(inspect(p).target,prepared.target);await h.auth(c,h.proof(c));
 }
 if(group==='material-source') {
  c.behaviorPath=driver;c.behaviorArgs=['primary'];
  c.materialPreserved=preserve();
  assert.equal(tip().reviewed_revision_consumed,2);assert.deepEqual(tip().revision_grants,[11,32]);
  await correct('primary',60);unchanged();
  console.log(JSON.stringify({material_source_controls:['spent acquisition predecessor remains immutable','real natural before failure and corrected after pass through production readers','non-reserving preparation binds complete inventory and a distinct one-slot grant'],synthetic_only:true}));return;
 }
 const p=c.proof,focused=read(p.focused);let n=0;
 if(group==='material-controls') {
  materialPredecessorCompatibility(c);
  const settlement=read(p.settlement), baseline=clone(c.live), originalTarget=gitReviewTarget(p);
  assert.equal(usesLegacyRevisionSettlement(p),false);
  assert.equal(usesLegacyRevisionSettlement({schema:'augnes.local-canonical-source-correction.v7',kind:'reviewed_revision',settlement:{sha256:digest('legacy')}}),true);
  assert.equal(usesLegacyRevisionSettlement({...clone(p),settlement:undefined}),false);
  const runner=readFileSync(new URL('../run-local-canonical-verification.mjs',import.meta.url),'utf8');
  assert(runner.includes('usesLegacyRevisionSettlement(sourceCorrection) ? await observeReviewedRevisionSettlementState'));
  assert(runner.includes('if (usesLegacyRevisionSettlement(proof)) live = await observeReviewedRevisionSettlementState'));
  assert(runner.includes('recoveryPreservationGuard?.({service:observed});'));
  const guard=materialRecoveryPreservationGuard(h.proof(c));guard({service:baseline.service});
  assert.throws(()=>materialRecoveryPreservationGuard(clone(p)),/revision_material_settlement_guard_missing/);
  for(const change of [q=>delete q.settlement,q=>q.settlement.sha256=digest('tampered original')]){
   const q=clone(p);change(q);assert.throws(()=>inspect(q));assert.notEqual(gitReviewTarget(q),originalTarget);n++;
  }
  for(const [key,change]of [['operation',q=>q.status='retiring'],['operation',q=>q.service_identity=digest('wrong service')],
   ['operation',q=>q.evidence.manager.manager_process_identity=digest('wrong birth')],
   ['decision',q=>q.recovery_source=digest('unsupported source')],['authority',q=>q.scope='unscoped apply'],
   ['authority',q=>q.source_review_sha256=digest('unreviewed')],['human_source',q=>q.turns=[]],
   ['restored_observation',q=>q.observation.diagnostics.coherent=false],['configuration',q=>q.repository_root=c.anchor]]){
   const altered=clone(settlement),value=clone(read(altered[key]));change(value);altered[key]=ref('invalid-recovery-'+(++n)+'.json',value);
   assert.throws(()=>inspect({...p,settlement:ref('invalid-settlement-'+n+'.json',altered)}));
  }
  for(const change of [q=>q.service.state.service_identity='sha256:'+digest('other service'),q=>{
   q.service.state.preservation_binding=digest('other current binding');q.service.diagnostics.before_binding=q.service.diagnostics.after_binding=q.service.state.preservation_binding;
  },q=>q.service.diagnostics.finished_at=new Date(fixtureNow()-61000).toISOString()]){
   const current=clone(baseline);change(current);assert.throws(()=>inspect(p,current));assert.throws(()=>guard({service:current.service}));n++;
  }
  const sidecar=path.join(path.dirname(c.recoveryConfiguration.configuration_path),'stale-manager-recovery.json'),originalSidecar=readFileSync(sidecar);
  h.write(sidecar,JSON.stringify({...read(settlement.operation),status:'retiring'}));
  try{assert.throws(()=>inspect(p));assert.throws(()=>guard({service:baseline.service}));n++;}finally{h.write(sidecar,originalSidecar);}
  assert.equal(inspect(p).target,originalTarget);guard({service:baseline.service});
  console.log(JSON.stringify({material_recovery_transition:{preparation_pass:true,ordinary_no_transition_pass:true,missing_transition_refused:true,cleanup_guard_pass:true,refusals:n,
   exact_originals_preserved:true,installed_operation:false,synthetic_only:true,actual_cli_legacy_selectors_checked:true}}));

  const tracking=c.git(['rev-parse','refs/remotes/origin/main']).toString().trim();
  const divergent=c.git(['commit-tree',c.tree,'-p',c.head,'-m','synthetic current main']).toString().trim();
  c.git(['update-ref','refs/remotes/origin/main',divergent]);
  try{assert.throws(()=>inspect(p),/revision_preparation_target_changed/);}finally{c.git(['update-ref','refs/remotes/origin/main',tracking]);}
  for(const mutate of [q=>q.commission.ordinal=2,q=>q.commission.maximum_invocations=2,q=>delete q.commission.source_revision,q=>delete q.commission.input_acquisition,
   q=>q.commission.reviewed_workload='spent-terminal-git-successor-workload-v1',q=>q.commission.root_family_id=digest('reset'),q=>q.branch+='-reset',q=>q.prior_attempt_id='stale',
   q=>delete q.inputs.inventory_sha256,q=>q.inputs.inventory_sha256=digest('missing input'),q=>q.head=c.prior.repository.head_sha]){
   const q=clone(p);mutate(q);assert.throws(()=>inspect(q));
  }
  for(const [key,mutate]of [['after',q=>q.runtime_inputs_sha256=digest('other runtime')],['after',q=>q.environment=digest('other environment')],['before',q=>q.file_sha256=digest('reduced assertions')],
   ['after',q=>q.source_files.pop()],['after',q=>q.modules[0].sha256=digest('wrong owner')],['after',q=>q.result.cleanup_completed=false],['after',q=>q.tested_source_head=c.prior.repository.head_sha]]){
   const f=clone(focused),original=f.regression[key],w=clone(read(original));mutate(w);f.regression[key]=ref('bad-witness-'+(++n)+'.json',w);
   // Keep the command bound to the altered witness so the named predicate,
   // rather than an earlier stale-reference check, is what refuses it.
   if(key==='after')f.commands=f.commands.map(command=>command.record.artifact===original.artifact&&command.record.sha256===original.sha256
    ? {...command,record:f.regression.after,stdout:w.stdout,result:w.result,tested_source_head:w.tested_source_head}:command);
   assert.throws(()=>inspect({...p,focused:ref('bad-focus-'+n+'.json',f)}));
  }
  // The complete Browser stdout uses the already supported 2 MiB focused-log
  // bound. It must be read intact, and one byte beyond that bound still refuses.
  for(const [size,accepted]of [[1024*1024,true],[2*1024*1024+1,false]]){
   const f=clone(focused),w=clone(read(f.regression.after));w.stdout=ref('bounded-output-'+size+'.log','synthetic bounded output\n'.padEnd(size,' '));
   f.regression.after=ref('bounded-witness-'+size+'.json',w);
   f.commands=f.commands.map(command=>({...command,record:f.regression.after,stdout:w.stdout}));
   const q={...p,focused:ref('bounded-focus-'+size+'.json',f)};
   if(accepted)assert.equal(inspect(q).reserved,false);else assert.throws(()=>inspect(q),/revision_artifact_unsafe/);
  }
  for(const node_args of [null,'--import tsx',['--inspect'],['--import','tsx','--no-warnings']]){
   const f=clone(focused);f.regression.node_args=node_args;assert.throws(()=>inspect({...p,focused:ref('bad-loader-'+(++n)+'.json',f)}));
  }
  for(const mutate of [f=>f.regression.after_equivalence.target=c.prior.repository.head_sha,f=>f.regression.after_equivalence.delta.paths=[],f=>delete f.regression.after_equivalence]){
   const f=clone(focused);mutate(f);assert.throws(()=>inspect({...p,focused:ref('bad-equivalence-'+(++n)+'.json',f)}));
  }
  assert.throws(()=>inspect(p,{...c.live,inventory:digest('different live input')}));
  for(const original of Object.values(p.originals)) {const file=path.join(c.artifacts,original.artifact),bytes=readFileSync(file);h.write(file,Buffer.concat([bytes,Buffer.from('\n')]));try{assert.throws(()=>inspect(p));}finally{h.write(file,bytes);}}
  // Prove the ordinal-two acquisition predecessor is accepted before mutating
  // it, so an unrelated ordinal refusal cannot mask these negative controls.
  assert.equal(c.prior.attempt.source_correction.commission.ordinal,2);
  const verifyPredecessor=r=>verifyGitRevisionFailure(r,c.materialStock,c.inputs,REVIEWED_REVISION_PHASES,2,false);
  assert.doesNotThrow(()=>verifyPredecessor(c.prior));
  for(const mutate of [r=>r.outcome.disposition='completed_success',r=>r.outcome.disposition='unknown_relevance',r=>r.outcome.safety='blocked',r=>r.cleanup.completed=false,r=>r.phases.find(v=>v.status==='failure').cleanup.termination_reason='cancelled']) {
   const r=clone(c.prior);mutate(r);assert.throws(()=>verifyPredecessor(r),/revision_browser_failure_invalid/);
  }
  for(const role of ['review','grant','delegation']) {
   const rec=role==='delegation'?Object.values(c.authority.linked)[0]:c.authority[role],original=clone(rec);
   for(const mutate of [r=>r.body='generic approval',r=>r.user={...r.user,type:'Bot'},r=>{if(role==='review')r.pull_request_url='https://api.github.com/repos/hynk-studio/augnes/pulls/1';else r.issue_url='https://api.github.com/repos/hynk-studio/augnes/issues/1';},r=>{if(role==='review')r.submitted_at=new Date(0).toISOString();else r.created_at=new Date(Date.parse(r.updated_at)-1).toISOString();}]) {
    mutate(rec);
    const obs=reviewedRevisionAuthorityObservation(rec,role==='review'?'accepted_revision':role==='grant'?'execution_commission':'task_delegation');
    if(role==='review')p.accepted.review.sha256=digest(obs);else if(role==='grant')p.authorization.grant_sha256=digest(obs);else p.commission.delegation.sha256=digest(obs);
    bind();await assert.rejects(h.auth(c,h.proof(c)));Object.assign(rec,clone(original));
   }
   const hash=digest(reviewedRevisionAuthorityObservation(rec,role==='review'?'accepted_revision':role==='grant'?'execution_commission':'task_delegation'));
   if(role==='review')p.accepted.review.sha256=hash;else if(role==='grant')p.authorization.grant_sha256=hash;else p.commission.delegation.sha256=hash;
  }
  {
   const delegation=Object.values(c.authority.linked)[0],original=clone(delegation),oldReview=c.authority.review.body,oldGrant=c.authority.grant.body,oldTarget=gitReviewTarget(p);
   delegation.created_at=delegation.updated_at=new Date(Date.parse(read(p.originals.completion).finished_at)-1).toISOString();
   p.commission.delegation.sha256=digest(reviewedRevisionAuthorityObservation(delegation,'task_delegation'));
   const target=gitReviewTarget(p);c.authority.review.body=oldReview.replaceAll(oldTarget,target);c.authority.grant.body=oldGrant.replaceAll(oldTarget,target);
   p.accepted.review.sha256=digest(reviewedRevisionAuthorityObservation(c.authority.review,'accepted_revision'));
   p.authorization.grant_sha256=digest(reviewedRevisionAuthorityObservation(c.authority.grant,'execution_commission'));bind();
   await assert.rejects(h.auth(c,h.proof(c)),/revision_material_fresh_authority_required/);
   Object.assign(delegation,original);c.authority.review.body=oldReview;c.authority.grant.body=oldGrant;
   p.commission.delegation.sha256=digest(reviewedRevisionAuthorityObservation(delegation,'task_delegation'));
   p.accepted.review.sha256=digest(reviewedRevisionAuthorityObservation(c.authority.review,'accepted_revision'));
   p.authorization.grant_sha256=digest(reviewedRevisionAuthorityObservation(c.authority.grant,'execution_commission'));
  }
  bind();unchanged();console.log(JSON.stringify({material_refusals:['ordinal two, provenance removal, alternate route and reset','stale or changed originals and incomplete live inventory','wrong runtime, source, driver, reduced witnesses and cleanup','success, observer and safety predecessors','absent, edited, spoofed and wrong-scope authority'],synthetic_only:true}));return;
 }
 if(group==='material-successor'){
 const parsed=h.proof(c),cap=await h.auth(c,parsed);
 const edge=path.join(c.anchor,'.augnes-local-verification/families',parsed.prior_family_id,'correction-successor.json');
 const emptyEdge=existsSync(edge);let recoveryAdmissionRefusals=0;
 if(parsed.settlement){
  for(const change of [q=>q.service.state.service_identity='sha256:'+digest('other current service'),q=>{
   q.service.state.preservation_binding=digest('changed current binding');q.service.diagnostics.before_binding=q.service.diagnostics.after_binding=q.service.state.preservation_binding;
  },q=>q.service.diagnostics.finished_at=new Date(fixtureNow()-61000).toISOString()]){
   const current=clone(c.live);change(current);assert.throws(()=>h.begin(c,parsed,cap,{revisionLive:current}));
   assert.equal(existsSync(edge),emptyEdge);recoveryAdmissionRefusals++;
  }
  const saved=c.proof.authorization, replay={...clone(saved),grant_comment_id:c.prior.attempt.source_correction.authorization.grant_comment_id};
  c.proof.authorization=replay;bind();assert.throws(()=>h.proof(c),/revision_commission_lineage_invalid/);c.proof.authorization=saved;bind();recoveryAdmissionRefusals++;
 }

 // Its focused primary correction passes, but a distinct in-scope journal
 // condition fails naturally. It needs its own complete correction and grant.
 c.behaviorArgs=['journal'];c.failurePhase='integration';
 const currentMain=c.git(['commit-tree',c.tree,'-p',c.head,'-m','synthetic main movement']).toString().trim();
 c.git(['update-ref','refs/remotes/origin/main',currentMain]);
 const failed=await execute(parsed,cap,null,{decorateReceipt(r){
  Object.assign(r.integration_base,{contract:'augnes.local-canonical-integration-base.v2',base_matches_current_main:false});
  r.integration_base.observation.sha=currentMain;
  r.phases.find(p=>p.id==='integration').browser_use=[];
 }});delete c.failurePhase;
 assert.equal(failed.stock.valid_deciding_evidence,false);assert.equal(failed.child.result.exit_code,1);
 if(parsed.settlement){
  assert.equal(h.stock(c,failed.receipt,cap),true);
  const valid=clone(c.live), cleanup=materialRecoveryPreservationGuard(parsed);cleanup({service:valid.service});
  for(const change of [q=>{q.service.state.preservation_binding=digest('stock changed binding');q.service.diagnostics.before_binding=q.service.diagnostics.after_binding=q.service.state.preservation_binding;},
   q=>q.service.diagnostics.finished_at=new Date(fixtureNow()-61000).toISOString(),q=>q.service.diagnostics.coherent=false]){
   c.live=clone(valid);change(c.live);assert.equal(h.stock(c,failed.receipt,cap),false);assert.throws(()=>cleanup({service:c.live.service}));
  }
  c.live=valid;console.log(JSON.stringify({material_start_stock_cleanup:{stock_record_valid:true,invalid_current_stock_refused:3,cleanup_refused:3,synthetic_only:true}}));
 }
 if(parsed.settlement)console.log(JSON.stringify({material_recovery_actual_admission:{accepted:true,refusals:recoveryAdmissionRefusals,synthetic_only:true,installed_operation:false,consumed_once:true}}));
 assert.equal(failed.stock.dimensions.current_merge_applicability,'different_current_main');
 assert(failed.stock.issues.includes('receipt_browser_identity_invalid:integration'));
 assert.throws(()=>h.begin(c,parsed,cap),/attempt_latest_tip_required/);unchanged();
 c.prior=failed.receipt;c.materialStock=failed.stock;c.materialPreserved=preserve();
 await correct('journal',70);unchanged();
 console.log(JSON.stringify({material_second_preparation:{new_grant:72,spent_grant:62,distinct_material_correction:true,unchanged_retry:false,
  failed_integration_browser_prefix:0,declared_base_retained:true,different_tracking_main:true,fresh_stock_false:true},synthetic_only:true}));return;
 }
 if(group==='material-integration-preparation'||group==='material-integration-reservation'){
 await materialIntegrationControls(c,h,group==='material-integration-preparation'?'prepare':'admit');unchanged();return;
 }
 const final=h.proof(c),finalCap=await h.auth(c,final);
 if(group==='material-stock'){
 await currentGitStockControls(c,final,finalCap,c.materialFinalReceipt);
 runMaterialStockPredecessorControls(c,c.materialFinalReceipt);unchanged();return;
 }
 if(group==='material-final'){
 assert.deepEqual(tip().revision_grants,[11,32,62]);
 const exe=c.gitDeclaration.resources.find(v=>v.id==='browser-executable');
 const browser={contract:'augnes.local-canonical-browser-use.v2',executable_name:'Fixture',location_fingerprint:exe.location_fingerprint,
  before:exe.before,after:exe.before,actual_version:'Chrome/1',runtime_versions:{http:'Chrome/1',cdp:'Chrome/1'},disposition:'unchanged',unchanged:true};
 const complete=await execute(final,finalCap,browser);
 assert.equal(complete.stock.valid_deciding_evidence,true);assert.equal(tip().reviewed_revision_consumed,1);
 assert.deepEqual(tip().revision_grants,[11,32,62,72]);unchanged();
 const exported=createPrivateReviewExport(complete.receipt);assert(inspectPrivateReviewExport(exported).structurally_valid);
 assert.equal(exported.attempt.source_correction.commission.source_revision,MATERIAL_SOURCE_CORRECTION);
 assert.throws(()=>h.begin(c,final,finalCap),/attempt_latest_tip_required/);
 c.materialFinalReceipt=complete.receipt;
 let consumed=0,r=complete.receipt.attempt;while(r){if(r.source_correction?.kind==='reviewed_revision')consumed++;const prior=r.source_correction;r=prior?h.read(path.join(c.anchor,'.augnes-local-verification/families',prior.prior_family_id,'attempt-'+prior.prior_number+'.json')):null;}
 assert.equal(consumed,6);
 console.log(JSON.stringify({material_successor:{distinct_grants:[62,72],historical_grants:[11,32],historical_consumed:4,total_reviewed_consumed:consumed,commission_allowance:1,first_stock:false,second_stock:true,unchanged_retry:false},synthetic_only:true}));return;
 }
 // A genuinely separate process reobserves stock, then tries the late exact
 // reservation while holding its own checkout lease. The parent's lease is
 // released only around that owned child and reacquired after settlement.
 const packet=path.join(c.artifacts,'cold-packet.json');h.write(packet,{...h.read(packet),lateContender:true});
 h.releaseOwner();try{await h.fresh(packet);}finally{h.acquireOwner();}
 // An interrupted reservation remains consumed even without the attempt body.
 const edge=path.join(c.anchor,'.augnes-local-verification/families',final.prior_family_id,'correction-successor.json');
 const attemptFile=path.join(c.anchor,'.augnes-local-verification/families',c.materialFinalReceipt.attempt.family_id,'attempt-1.json'),attemptBytes=readFileSync(attemptFile);
 try{
  rmSync(attemptFile);
  assert.throws(()=>h.begin(c,final,finalCap));assert(existsSync(edge));
 }finally{h.write(attemptFile,attemptBytes);}
 console.log(JSON.stringify({material_reservation:{fresh_late_contender_refused:true,interruption_consumes:true,unchanged_retry:false},synthetic_only:true}));
}
