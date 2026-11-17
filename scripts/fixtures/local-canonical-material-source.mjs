import { NO_REMEDY_REQUALIFICATION, NO_REMEDY_DECISION, NO_REMEDY_GRANT, NO_REMEDY_HISTORY, NO_REMEDY_LIMIT, noRemedyDelegation, verifyNoRemedySourceDelta } from "../local-canonical-no-remedy.mjs";
// Disposable synthetic authority. Real readers, physical ledger, behavioral
// subprocesses and fresh stock; these records never authorize host qualification.
import assert from 'node:assert/strict';
import {readFileSync,existsSync,rmSync,readdirSync,writeFileSync,chmodSync,cpSync,mkdirSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {syncBuiltinESMExports} from 'node:module';
import path from 'node:path';
import {setTimeout as delay} from 'node:timers/promises';
import {fixtureNow} from './local-canonical-authority-clock.mjs';
import {digest} from '../local-canonical-inputs.mjs';
import {CANONICAL_NODE_VERSION} from '../local-canonical-environment.mjs';
import {prepareNoRemedyRequalification,beginAttempt,finishAttempt,readSourceCorrectionProof,inspectGitRevisionPreparation,inspectAttemptRecords,reconstructAttemptTip,reviewedRevisionAuthorityObservation,
 prepareAcceptedMainIntegrationCandidate,integrationMaterial,integrationTarget,authorizeIntegration,INTEGRATION_ACCEPT,INTEGRATION_GRANT,
 observeMaterialIntegrationPredecessorAuthority,observeReviewedIntegrationPredecessorAuthority,
 observeReviewedIntegrationSource,REVIEWED_INTEGRATION_DELIVERY,readReviewedIntegration} from '../local-canonical-attempts.mjs';
import {MATERIAL_SOURCE_CORRECTION,MATERIAL_HISTORY_BOUNDARY,gitReviewTarget,verifyGitRevisionFailure,verifyGitRevisionSuccess,
 GIT_CURRENT_STOCK_COMPARISON,gitRevisionInventory,gitRevisionStockComparison} from '../local-canonical-git-observation.mjs';
import {REVIEWED_REVISION_PHASES} from '../local-canonical-attempts.mjs';
import {executeFixture,dependencyRecords} from './local-canonical-browser-successor.mjs';
import {createPrivateReviewExport,inspectPrivateReviewExport} from '../local-canonical-review-export.mjs';
import {browserConsumersForPhase,validPhaseBrowserUse} from '../local-canonical-browser-identity.mjs';
import {verifyOrdinaryInitialFailure} from '../local-canonical-browser-revision.mjs';
import {runMaterialStockPredecessorControls} from './local-canonical-material-stock-predecessor.mjs';
import {finalizeReceipt,inspectReceiptForDecision,canonicalSerialize} from '../local-canonical-receipt.mjs';
import {inspectIntegrationStock} from '../run-local-canonical-verification.mjs';
import {checkoutVerificationFingerprint,acquireCheckoutVerificationOwnership,releaseCheckoutVerificationOwnership} from '../local-canonical-checkout-ownership.mjs';
import {seedFailedIntegrationFixtureSources} from './local-canonical-failed-integration-maintenance.mjs';
import {isProspectiveRequalification} from '../local-canonical-prospective-requalification.mjs';
const clone=structuredClone,now=()=>new Date(fixtureNow()).toISOString();
const driver='scripts/material-source-behavior.mjs',product='apps/web_planning/src/exchange-client.js.txt';
const predecessorDriver='scripts/material-predecessor.mjs';
const decision='Source review decision: ACCEPT / RETAIN for prospective qualification.';

const integrationTransport=records=>({review:async()=>clone(records.acceptance),grant:async()=>clone(records.grant),
 permission:async login=>clone([records.acceptance_permission,records.grant_permission].find(v=>v.user.login===login)),
 pullRequest:async()=>clone(records.pull_request)});

async function materialHistoricalPrefix(c,prior,context) {
 let callbacks=0,validated=false;
 const prospective=isProspectiveRequalification(prior.attempt.source_correction),prefix=prospective?'receipt_historical_prospective_integration_prefix':'receipt_historical_material_integration_prefix';
 const currentAttemptRecordsValid=await inspectAttemptRecords({anchorRoot:c.anchor,repositoryRoot:c.checkout,receipt:prior,
  onHistoricalPrefix(kind){if(prospective)assert.equal(kind,'successful_prospective_integration');validated=true;},observeRevision:async()=>{callbacks++;throw Error('historical prefix must not project current authority');}});
 assert.equal(currentAttemptRecordsValid,true);assert.equal(callbacks,0);assert.equal(validated,true);
 const current={...context,expectedRunId:prior.run.id,currentExecutorFingerprint:digest('changed current executor'),
  currentLocks:{root:digest('changed current root lock'),nested:digest('changed current nested lock'),webPlanning:digest('changed current web lock')}};
 const prefixState=prospective?{historicalProspectiveIntegrationPrefix:validated}:{historicalMaterialIntegrationPrefix:validated};
 const historical=inspectReceiptForDecision(prior,{...current,currentAttemptRecordsValid,...prefixState});
 assert(historical.issues.includes(prefix));assert(historical.issues.includes('receipt_stale_executor'));
 assert(historical.issues.includes('receipt_stale_lockfiles'));assert(historical.issues.includes('receipt_stale_head'));
 assert.equal(historical.dimensions.evidence_validity,'valid_in_recorded_context');assert.equal(historical.dimensions.current_merge_applicability,'blocked');assert.equal(historical.valid_deciding_evidence,false);
 const changed=clone(prior);changed.phases.pop();const malformed=finalizeReceipt(changed);let wronglyValidated=false;
 const invalid=await inspectAttemptRecords({anchorRoot:c.anchor,repositoryRoot:c.checkout,receipt:malformed,onHistoricalPrefix(){wronglyValidated=true;}});
 assert.equal(invalid,false);assert.equal(wronglyValidated,false);
 const refused=inspectReceiptForDecision(malformed,{...current,currentAttemptRecordsValid:invalid,
  ...(prospective?{historicalProspectiveIntegrationPrefix:wronglyValidated}:{historicalMaterialIntegrationPrefix:wronglyValidated})});
 assert.equal(refused.dimensions.evidence_validity,'invalid_or_incomplete');assert.equal(refused.valid_deciding_evidence,false);
}

// Reuse the owned fresh reader; neither this hook nor its records are host QA.
export async function inspectMaterialIntegrationCold(c) {
 const receipt=JSON.parse(readFileSync(path.join(c.checkout,'.augnes-local-verification/receipts',c.stockContext.expectedRunId+'.json')));
 const observed=await inspectIntegrationStock({anchorRoot:c.anchor,repositoryRoot:c.checkout,receipt,assertCurrent(){},transport:integrationTransport(c.integrationRecords)});
 assert.equal(observed.currentAttemptRecordsValid,true);
 const result=inspectReceiptForDecision(receipt,{...c.stockContext,...observed});
 assert.equal(result.valid_deciding_evidence,true,JSON.stringify(result.issues));
 await materialHistoricalPrefix(c,c.reviewedPredecessor??c.materialPredecessor,c.stockContext);
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

// Continue the real successful prospective fixture; its proof and commission
// remain prospective throughout original-authority and historical-prefix reads.
export async function runProspectiveReviewedIntegrationFixture(c,h,complete) {
 assert(isProspectiveRequalification(complete.receipt.attempt.source_correction));
 assert.equal(complete.stock.valid_deciding_evidence,true);
 return materialIntegrationControls(c,h,'accounted-prospective',null,null,null,complete);
}

async function materialIntegrationControls(c,h,mode,callback,seedSources,prepareDependencies,complete=null) {
 const readerMode=mode==='maintenance-reader',accounted=mode==='accounted-prospective';
 let currentStage='source_setup';
 const started=performance.now(),stage=name=>{currentStage=name;console.log(JSON.stringify({material_integration_stage:name,elapsed_ms:Math.round(performance.now()-started),synthetic_only:true}));};
 const prior=accounted?complete.receipt:c.materialFinalReceipt,a=prior.attempt,successStock=accounted?complete.stock:h.read(path.join(c.artifacts,'fresh-stock.json'));
 const git=(...args)=>c.git(args).toString().trim(),commit=()=>git('-c','user.name=Fixture','-c','user.email=fixture@example.invalid','commit','--quiet','-m',accounted?'synthetic reviewed prospective integration':'synthetic reviewed material integration');
 const families=path.join(c.anchor,'.augnes-local-verification/families'),ledger=path.join(families,a.family_id),edge=path.join(ledger,'correction-successor.json');
 const originalFiles=new Map(),capture=folder=>{for(const entry of readdirSync(folder,{withFileTypes:true})){const file=path.join(folder,entry.name);if(entry.isDirectory())capture(file);else originalFiles.set(file,readFileSync(file));}};
 capture(families);capture(c.artifacts);
 const priorPath=path.join(c.checkout,'.augnes-local-verification/receipts',prior.run.id+'.json');originalFiles.set(priorPath,readFileSync(priorPath));
 const ledgerFiles=[...originalFiles].filter(([file])=>file.startsWith(families+path.sep));
 const restoreLedger=()=>{rmSync(families,{recursive:true,force:true});for(const [file,bytes]of ledgerFiles)h.write(file,bytes);};
 const preserved=()=>{for(const [file,bytes]of originalFiles)assert(readFileSync(file).equals(bytes),file+' remains unchanged');};
 const oldMain=git('rev-parse','refs/remotes/origin/main'),exclude=path.join(c.checkout,'.git/info/exclude'),excludeBytes=readFileSync(exclude);
 const folder=path.join(c.checkout,accounted?'.augnes-local-verification/prospective-reviewed-integration':'.augnes-local-verification/material-reviewed-integration'),file=path.join(folder,'proof.json');
 const handoff=path.join(c.root,'material-integration-context.json'),stored=mode==='admit'?h.read(handoff):null;
 const ref=(name,value)=>{h.write(path.join(folder,name),typeof value==='object'&&!Buffer.isBuffer(value)?canonicalSerialize(value):value);return{artifact:name,sha256:digest(readFileSync(path.join(folder,name)))}};
 const delta=(before,after,files=[])=>digest(c.git(['diff','--binary','--no-ext-diff','--no-textconv','--no-renames',before,after,'--',...files]));
 const beforeTip=reconstructAttemptTip({anchorRoot:c.anchor,repositoryRoot:c.checkout,branch:c.branch});
 assert.deepEqual(beforeTip.revision_grants,accounted?[11,32,62,82]:c.noRemedy?[11,32,62,65,72]:[11,32,62,72]);assert.equal(beforeTip.reviewed_revision_consumed,1);
 if(accounted)assert(isProspectiveRequalification(a.source_correction));
 else assert.equal(a.source_correction.commission.source_revision,MATERIAL_SOURCE_CORRECTION);
 assert.deepEqual(a.budget,{initial:1,recovery:0});assert.equal(a.source_correction.commission.maximum_invocations,1);
 if(!accounted)assert.doesNotThrow(()=>verifyGitRevisionSuccess(prior,successStock,c.inputs,REVIEWED_REVISION_PHASES));
 let receipt,proof,p,review,records,main,head,tree,packages,declaration,inputInventory,live,preparation,authority,priorTransport,partitionSources;
 let retain=false,createdMain=false,refusals=stored?.refusals??0;
 const noEdge=()=>assert(!existsSync(edge));
 const collectPriorAuthority=accounted?observeReviewedIntegrationPredecessorAuthority:observeMaterialIntegrationPredecessorAuthority;
 const predecessorKey=accounted?'revision_predecessor':'material_predecessor';
 try {
  if(stored){
   p=stored.p;review=stored.review;preparation=stored.preparation;({head,tree}=p);main=p.base;
   git('reset','--hard',head);git('update-ref','refs/remotes/origin/main',main);h.write(exclude,Buffer.concat([excludeBytes,Buffer.from('\nnode_modules/\n')]));
   packages=dependencyRecords(c,c.checkout).map(v=>({...v,prerequisite:preparation.dependencies.find(x=>x.phase_id===v.phase_id)}));
   declaration={...clone(stored.declaration),resources:clone(c.gitDeclaration.resources),binding:{...clone(stored.declaration.binding),runtime_inputs:clone(c.inputs)}};
   inputInventory={...declaration,fingerprint:digest(declaration),checks:1,events:[],first_fault:null,secondary_faults:[],prepared_dependencies:packages};
   live={...clone(c.live),inventory:gitRevisionInventory(inputInventory),inputInventory};
  }else{
  const overlap=accounted?'scripts/test-local-canonical-prospective-requalification.mjs':'scripts/fixture.mjs',oldSource=c.git(['show',a.head+':'+overlap]);
  const dependencyPaths=['','apps/augnes_apps','apps/web_planning'].flatMap(dir=>['package.json','package-lock.json'].map(name=>path.posix.join(dir,name)));
  const adjustmentPaths=accounted?['scripts/local-canonical-integration-adjustment-fixture.mjs','scripts/local-canonical-integration-deleted-fixture.mjs','scripts/local-canonical-integration-mode-fixture.mjs']:[];
  git('checkout','-b','material-accepted-main',c.base);createdMain=true;
  h.write(path.join(c.checkout,overlap),'export const incoming=true;\n');
  if(accounted){
   // Safe dependency sources enter through accepted main's ordinary union;
   // only verifier adjustments belong to the new merge/correction accounting.
   h.write(exclude,Buffer.concat([excludeBytes,Buffer.from('\nnode_modules/\n')]));
   dependencyRecords(c,c.checkout);
   for(const name of adjustmentPaths)h.write(path.join(c.checkout,name),'export const integrated=false;\n');
  }
  if(readerMode){partitionSources=seedFailedIntegrationFixtureSources(c);seedSources?.();}
  git('add',overlap,...(accounted?[...dependencyPaths,...adjustmentPaths]:[]));commit();main=git('rev-parse','HEAD');
  git('checkout',c.branch);try{git('merge','--no-ff','--no-commit',main);}catch{/* The retained source and incoming main deliberately differ. */}
  h.write(path.join(c.checkout,overlap),Buffer.concat([oldSource,Buffer.from('\nexport const incoming=true;\n')]));
  if(accounted){
   h.write(path.join(c.checkout,adjustmentPaths[0]),'export const integrated=true;\n');
   rmSync(path.join(c.checkout,adjustmentPaths[1]));
   chmodSync(path.join(c.checkout,adjustmentPaths[2]),0o755);
  }
  git('add',overlap,...adjustmentPaths);commit();
  const merge=git('rev-parse','HEAD'),mergeTree=git('rev-parse','HEAD^{tree}'),mergeBase=git('merge-base',a.head,main);
  h.write(exclude,Buffer.concat([excludeBytes,Buffer.from('\nnode_modules/\n')]));
  packages=dependencyRecords(c,c.checkout).map(v=>({...v,prerequisite:v.before}));
  // Only the selected reader's disposable ancestry needs an inert loader/source
  // binding for its later direct-capture parser controls. Observe it before the
  // correction commit; all other groups retain their original dependency path.
  if(readerMode&&prepareDependencies)packages=prepareDependencies(packages);
  const compatibility=accounted?'scripts/local-canonical-integration-compatibility-fixture.mjs':'scripts/verifier-fixture.mjs';h.write(path.join(c.checkout,compatibility),'export const reviewedCompatibility=true;\n');
  const corrections=[compatibility,...(accounted?[]:dependencyPaths)].sort();
  git('add',...corrections);commit();
  if(accounted){
   const support='scripts/local-canonical-integration-support-fixture.mjs';
   h.write(path.join(c.checkout,support),'export const completeSupport=true;\n');
   h.write(path.join(c.checkout,compatibility),'export const reviewedCompatibility="complete";\n');
   git('add',support,compatibility);
  }
  if(accounted)commit();
  head=git('rev-parse','HEAD');tree=git('rev-parse','HEAD^{tree}');git('update-ref','refs/remotes/origin/main',main);
  const entry=rev=>{const row=git('ls-tree',rev,'--',overlap);return row.slice(0,row.indexOf('\t'));};
  p={schema:'augnes.local-canonical-source-correction.v2',kind:'accepted_main_integration',integration_case:'reviewed',branch:c.branch,base:main,accepted_main:main,head,tree,pull_request:999,
   prior_family_id:a.family_id,prior_number:1,prior_attempt_id:a.attempt_id,prior_receipt_fingerprint:prior.integrity.content_fingerprint,prior_receipt_path:path.relative(c.checkout,priorPath),
   integration:accounted?observeReviewedIntegrationSource(c.checkout,{predecessor:a.head,acceptedMain:main,commit:merge,head}):{commit:merge,tree:mergeTree,merge_base:mergeBase,overlaps:[{path:overlap,base:entry(mergeBase),predecessor:entry(a.head),main:entry(main),result:entry(merge)}],
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
  authority=await collectPriorAuthority(a,{transport:priorTransport});assert.equal(historicalPrReads,0);
  preparation={schema:'augnes.local-canonical-integration-preparation.v1',target:integrationTarget(p),checkout_fingerprint:checkoutVerificationFingerprint(c.checkout),runtime_inputs:clone(c.inputs),
   input_inventory:inputInventory,inventory_sha256:live.inventory,dependencies:packages.map(v=>v.before)};
  review={schema:'augnes.local-canonical-candidate-review.v1',kind:p.kind,head,tree,predecessor_head:a.head,predecessor_tree:a.tree,source_review:'complete',
   delta_sha256:delta(a.head,head),changed_paths:git('diff','--name-only',a.head,head,'--').split('\n').sort(),authority_reference:'https://github.com/hynk-studio/augnes/pull/999',reviewed_at:new Date().toISOString(),
   integration_sha256:digest(p.integration),planner_sha256:p.planner.sha256,reviewer:'synthetic-separate-reviewer',implementation_actor:'synthetic-implementer',no_write:true,disposition:'accept',
   judgments:Object.fromEntries(('complete_integration complete_overlaps complete_corrections verifier_policy_adjustments_only affected_consumers authority_and_lineage no_weakened_contract'+
    (accounted?' complete_nonoverlap_adjustments complete_correction_chain successful_predecessor_evidence':'')).split(' ').map(k=>[k,true])),
   [predecessorKey]:{stock:ref('successful-stock.json',successStock),authority:ref('original-authority.json',authority)},preparation:ref('preparation.json',preparation),report:null};
  if(accounted){
   assert.equal(p.integration.delivery_revision,REVIEWED_INTEGRATION_DELIVERY);
   assert.equal(p.integration.correction_chain.length,2);assert.equal(p.integration.adjustments.length,3);
   assert(p.integration.adjustments.some(row=>row.result===null));
   assert(p.integration.adjustments.some(row=>row.expected?.startsWith('100644 ')&&row.result?.startsWith('100755 ')));
   const sourceRequest={predecessor:a.head,acceptedMain:main,commit:merge,head},objects=git('count-objects','-v');
   assert.deepEqual(observeReviewedIntegrationSource(c.checkout,sourceRequest),p.integration);
   assert.equal(git('count-objects','-v'),objects,'source capture must only read existing Git objects');
   const objectCommit=(sourceTree,parent)=>git('-c','user.name=Fixture','-c','user.email=fixture@example.invalid','commit-tree',sourceTree,'-p',parent,'-m','synthetic refused integration topology');
   const outside=objectCommit(a.tree,head),empty=objectCommit(p.tree,head);
   assert.throws(()=>observeReviewedIntegrationSource(c.checkout,{...sourceRequest,head:outside}),{code:'integration_verifier_scope_invalid'});refusals++;
   assert.throws(()=>observeReviewedIntegrationSource(c.checkout,{...sourceRequest,head:empty}),{code:'integration_verifier_scope_invalid'});refusals++;
   let longHead=head;
   for(let index=0;index<15;index++)longHead=objectCommit(index%2===0?p.integration.correction_chain[0].tree:p.tree,longHead);
   assert.throws(()=>observeReviewedIntegrationSource(c.checkout,{...sourceRequest,head:longHead}),{code:'integration_correction_chain_unbounded'});refusals++;
  }
  }
  const rebuild=()=>{review.report=ref('review.md',`Synthetic separate review ${p.head} ${p.tree} ${digest(p.integration)} ${review.delta_sha256}\n`);p.review=ref('review.json',review);h.write(file,canonicalSerialize(p));proof=readSourceCorrectionProof(file,c.checkout);};
  const prepare=()=>prepareAcceptedMainIntegrationCandidate({anchorRoot:c.anchor,repositoryRoot:c.checkout,proof,acceptedMain:main,runtimeInputs:c.inputs,live});
  const request=extra=>({anchorRoot:c.anchor,repositoryRoot:c.checkout,checkoutOwner:c.owner,branch:c.branch,head,tree,acceptedMain:main,runId:'material-reviewed-integration',
   contractFingerprint:digest(declaration),sourceCorrection:proof,revisionInputs:c.inputs,revisionLive:live,assertCurrent(){},...extra});
  rebuild();
  if(accounted){
   assert.equal(successStock.dimensions.current_merge_applicability,'different_current_main');
   assert.throws(()=>verifyGitRevisionSuccess(prior,successStock,c.inputs,REVIEWED_REVISION_PHASES),{code:'revision_positive_stock_invalid'});refusals++;
   assert.doesNotThrow(()=>verifyGitRevisionSuccess(prior,successStock,c.inputs,REVIEWED_REVISION_PHASES,p));
  }
  if(!stored){
  const prepared=prepare();assert.equal(prepared.eligible_evidence,true);assert.equal(prepared.authorized,false);assert.equal(prepared.reserved,false);assert.deepEqual(prepared.budget,{initial:1,recovery:0});noEdge();stage('prepared');
  }
  if(!stored&&!readerMode){
  // These direct reader mutations isolate complete-Full predicates instead of
  // allowing an unrelated artifact hash mismatch to hide the safety refusal.
  for(const mutate of [r=>r.phases=[],r=>r.phases.pop(),r=>r.outcome.safety='blocked',r=>r.outcome.disposition='product_failure',
   r=>r.cleanup.completed=false,r=>r.phases[0].cleanup.streams_closed=false,r=>r.phases[0].timed_out=true,r=>r.phases.find(v=>v.browser_use.length).browser_use.pop(),
   r=>r.attempt.source_correction.commission.ordinal=2]){
   const r=clone(prior);mutate(r);assert.throws(()=>verifyGitRevisionSuccess(r,successStock,c.inputs,REVIEWED_REVISION_PHASES,...(accounted?[p]:[])));refusals++;
  }
  for(const mutate of [v=>v.source_correction.commission.maximum_invocations=2,v=>v.source_correction.commission.source_revision='unknown',
   v=>v.source_correction.commission.reviewed_workload='spent-terminal-git-successor-workload-v1']){
   const changed=clone(a);mutate(changed);await assert.rejects(()=>collectPriorAuthority(changed,{transport:priorTransport}));noEdge();refusals++;
  }
  for(const badTransport of [{...priorTransport,permission:async login=>({permission:'read',user:{login}})},
   {...priorTransport,review:async id=>({...await priorTransport.review(id),commit_id:main})},
   {...priorTransport,grant:async id=>({...await priorTransport.grant(id),body:'unrelated or edited old commission'})}]){
   await assert.rejects(()=>collectPriorAuthority(a,{transport:badTransport}));noEdge();refusals++;
  }
  const originalP=clone(p),originalReview=clone(review);
  const resetProof=()=>{p=clone(originalP);review=clone(originalReview);rebuild();};
  for(const mutate of [()=>p.prior_attempt_id='older',()=>delete p.integration_case,()=>p.integration_case='unknown',()=>p.kind='verifier_correction']){
   let error;try{mutate();rebuild();prepare();}catch(e){error=e;}assert(error);noEdge();refusals++;resetProof();
  }
  const completionFile=path.join(ledger,'completion-1.json'),completion=readFileSync(completionFile);
  for(const mutate of [()=>delete review[predecessorKey],()=>delete review.preparation,()=>review[predecessorKey].stock=ref('invalid-stock.json',{...successStock,valid_deciding_evidence:false}),
   ()=>review[predecessorKey].authority=ref('invalid-authority.json',{...clone(authority),observations:{}}),
   ()=>review.preparation=ref('invalid-preparation.json',{...preparation,inventory_sha256:digest('unbound current inputs')})]){
   let error;try{mutate();rebuild();readReviewedIntegration(c.checkout,proof,a,JSON.parse(completion));}catch(e){error=e;}assert(error);noEdge();refusals++;resetProof();
  }
  for(const patch of [{disposition:'product_failure'},{cleanup_complete:false}]){h.write(completionFile,{...JSON.parse(completion),...patch});try{assert.throws(prepare);noEdge();refusals++;}finally{h.write(completionFile,completion);}}
  if(accounted){
   // Rebind the complete review after each deliberate manifest change. A stale
   // review digest must not hide an actual accounting or selector refusal.
   for(const mutate of [
    ()=>p.schema='augnes.local-canonical-source-correction.v1',()=>p.schema='unknown',
    ()=>p.commission={source_revision:'prospective-requalification-v1'},
    ()=>delete p.integration.delivery_revision,()=>p.integration.delivery_revision='unknown',()=>p.integration.delivery_revision=null,
    ()=>p.integration.delivery_revision=false,()=>p.integration.overlaps.pop(),()=>p.integration.overlaps[0].result=p.integration.overlaps[0].main,
    ()=>p.integration.adjustments.pop(),()=>p.integration.adjustments.push(clone(p.integration.adjustments[0])),
    ()=>p.integration.adjustments[0].expected=null,()=>p.integration.adjustments[0].result=null,
    ()=>p.integration.adjustments.find(row=>row.result===null).result=p.integration.adjustments[0].result,
    ()=>p.integration.adjustments.find(row=>row.result?.startsWith('100755 ')).result=p.integration.adjustments.find(row=>row.result?.startsWith('100755 ')).expected,
    ()=>p.integration.adjustment_delta_sha256=digest('unaccounted adjustment bytes'),
    ()=>p.integration.correction_chain=[],()=>p.integration.correction_chain.reverse(),()=>p.integration.correction_chain.pop(),
    ()=>p.integration.correction_chain.push(clone(p.integration.correction_chain[0])),
    ()=>p.integration.correction_chain=Array.from({length:17},()=>clone(p.integration.correction_chain[0])),
    ()=>p.integration.correction_chain[0].parent=p.base,()=>p.integration.correction_chain[0].parent_tree=p.tree,
    ()=>p.integration.correction_chain[0].tree=a.tree,()=>p.integration.correction_chain[0].delta_sha256=digest('wrong step delta'),
    ()=>p.integration.correction_chain[1].paths.pop(),()=>p.integration.correction_chain[1].entries.pop(),
    ()=>p.integration.correction_chain[1].entries[0].before=null,()=>p.integration.correction_chain[1].entries[0].result=null,
    ()=>p.integration.correction_delta_sha256=digest('incomplete aggregate delta'),()=>p.integration.correction_paths.pop(),
    ()=>review.material_predecessor=clone(review.revision_predecessor),
    ()=>review.judgments.complete_nonoverlap_adjustments=false,()=>review.judgments.complete_correction_chain=false,
    ()=>review.judgments.successful_predecessor_evidence=false,
   ]){
    mutate();let error;try{rebuild();prepare();}catch(e){error=e;}assert(error);noEdge();refusals++;resetProof();
   }
   for(const stock of [{...clone(successStock),issues:['unverified']},{...clone(successStock),dimensions:{}}]){
    assert.throws(()=>verifyGitRevisionSuccess(prior,stock,c.inputs,REVIEWED_REVISION_PHASES,p));refusals++;
   }
   for(const mutate of [q=>q.schema='augnes.local-canonical-source-correction.v1',q=>q.kind='source_revision',
    q=>delete q.integration_case,q=>delete q.integration.delivery_revision,q=>q.integration.delivery_revision='unknown',
    q=>q.prior_family_id=digest('other family'),q=>q.prior_number=2,q=>q.prior_attempt_id='other attempt',
    q=>q.prior_receipt_fingerprint=digest('other receipt'),q=>q.branch+='-other',q=>q.pull_request++,q=>q.accepted_main=a.head]){
    const context=clone(p);mutate(context);
    assert.throws(()=>verifyGitRevisionSuccess(prior,successStock,c.inputs,REVIEWED_REVISION_PHASES,context),{code:'revision_positive_integration_context_invalid'});refusals++;
   }
   for(const mutate of [r=>r.integration_base.contract='augnes.local-canonical-integration-base.v1',
    r=>{r.integration_base.observation=null;r.integration_base.base_matches_current_main=null;},
    r=>r.integration_base.base_matches_current_main=true,r=>r.integration_base.observation.sha=r.repository.base_sha,
    r=>r.integration_base.requested_base_sha=a.head,r=>r.integration_base.tested_head_sha=p.head,
    r=>r.integration_base.checked_at=new Date(0).toISOString(),r=>r.integration_base.observation.source='unobserved']){
    const malformed=clone(prior);mutate(malformed);
    assert.throws(()=>verifyGitRevisionSuccess(malformed,successStock,c.inputs,REVIEWED_REVISION_PHASES,p),{code:'revision_positive_stock_invalid'});refusals++;
   }
   for(const applicability of ['unknown','unobserved','blocked']){
    const stock=clone(successStock);stock.dimensions.current_merge_applicability=applicability;
    assert.throws(()=>verifyGitRevisionSuccess(prior,stock,c.inputs,REVIEWED_REVISION_PHASES,p),{code:'revision_positive_stock_invalid'});refusals++;
   }
   // The material-only entry point must retain its original closed meaning.
   await assert.rejects(()=>observeMaterialIntegrationPredecessorAuthority(a,{transport:priorTransport}));refusals++;noEdge();
  }
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
  grant.id=beforeTip.revision_grants.at(-1);bindAuthority();await assert.rejects(()=>reserve());noEdge();grant.id=3002;bindAuthority();refusals++;
  await assert.rejects(()=>reserve({assertCurrent(){throw Error('synthetic unsafe current preparation');}}),/unsafe/);noEdge();refusals++;
  const preparationFile=path.join(folder,'preparation.json'),preparationBytes=readFileSync(preparationFile);
  try{await assert.rejects(()=>reserve({observeRevision:async()=>{const authorization=await authorizeIntegration(proof,integrationMaterial(c.checkout,proof,c.anchor),integrationTransport(records));h.write(preparationFile,{changed:true});return{authorization,live};}}));noEdge();refusals++;}
  finally{h.write(preparationFile,preparationBytes);}
  stage('admission_refusals');
  // Only immutable evidence and source objects cross this serial boundary.
  // The later group rebuilds live inputs and new invocation-local authority.
  if(!accounted){p.authorization=null;rebuild();h.write(handoff,{p,review,preparation,declaration,refusals});retain=true;return;}
  }
  let admitted;
  if(readerMode)admitted=await reserve();
  else{
   const outcomes=await Promise.allSettled([reserve(),reserve()]);assert.equal(outcomes.filter(v=>v.status==='fulfilled').length,1);assert.equal(outcomes.filter(v=>v.status==='rejected').length,1);
   admitted=outcomes.find(v=>v.status==='fulfilled').value;
  }
  assert.deepEqual(admitted.budget,{initial:1,recovery:0});
  const start=admitted.started_at,finish=new Date().toISOString(),r=clone(prior),own={...r.checkout_ownership,checkout_fingerprint:preparation.checkout_fingerprint,acquired_at:start,released_at:finish};
  Object.assign(r.repository,{base_sha:main,head_sha:head,tree_sha:tree});Object.assign(r.integration_base,{requested_base_sha:main,tested_head_sha:head,checked_at:start,base_matches_current_main:true});Object.assign(r.integration_base.observation,{sha:main,observed_at:start});
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
  h.write(packet,{anchor:c.anchor,checkout:c.checkout,inputs:c.inputs,live,
   ...(accounted?{reviewedPredecessor:prior}:{materialPredecessor:prior}),materialGrants:beforeTip.revision_grants,integrationRecords:records,stockContext:context,stockOutput});
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
  console.log(JSON.stringify({[accounted?'prospective_reviewed_integration':'material_integration']:{synthetic_only:true,
   ...(accounted?{eligible_successful_exhausted_prospective_v7:true,registered_owner:a.source_correction.commission.registered_owner??null,
    delivery_revision:p.integration.delivery_revision,nonoverlap_adjustments:p.integration.adjustments.length,linear_correction_commits:p.integration.correction_chain.length}:
    {eligible_successful_exhausted_material_v7:true}),refusals,full_phases:receipt.phases.length,
   budget:{initial:1,recovery:0},historical_grants:beforeTip.revision_grants,historical_consumption:1,old_prefix_without_current_authority:true,fresh_stock:true,competing_and_interrupted_edges_retained:true,originals_unchanged:true}}));
 } catch(error) {
  if(accounted)try{console.error(JSON.stringify({prospective_reviewed_integration_error:{stage:currentStage,
    name:typeof error?.name==='string'?error.name.slice(0,80):'unknown',
    code:typeof error?.code==='string'?error.code.slice(0,120):null,
    message:typeof error?.message==='string'?error.message.replace(/[\x00-\x1f\x7f]/gu,' ').slice(0,512):null,
    elapsed_ms:Math.round(performance.now()-started),synthetic_only:true}}));}catch{/* Diagnostics never replace the original error. */}
  throw error;
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
 console.log(JSON.stringify({material_predecessor_compatibility:{accepted,refused,legacy_requires_complete_browser:true,synthetic_only:true}}));
}

export function seedMaterialSourceFiles(c,write) {
 write(path.join(c.checkout,product),JSON.stringify({primary:false,journal:false})+'\n');
 write(path.join(c.checkout,driver),'import assert from "node:assert/strict"; import {readFileSync} from "node:fs"; const state=JSON.parse(readFileSync(new URL("../apps/web_planning/src/exchange-client.js.txt",import.meta.url))); assert.equal(state[process.argv[2]??"primary"],true); console.log("corrected "+(process.argv[2]??"primary"));\n');
 write(path.join(c.checkout,predecessorDriver),'import assert from "node:assert/strict"; assert.fail("synthetic prior defect");\n');
}

// Spend the supported acquisition commission through its ordinary two-slot
// path. Reusable material-source controls need no retired workload controller.
export async function prepareMaterialSourcePredecessor(c,h,initial,firstAttempt,initialAuthority) {
 const authority=clone(c.authority),dependencies=dependencyRecords(c);
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

export async function runMaterialSourceControls(c,h,group,{noRemedyPredecessor=false,ordinaryDetour=false}={}) {
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
 if(ordinaryDetour){
  const noRemedy=c.noRemedy.proof;
  await correct('journal',70);
  const final=h.proof(c),cap=await h.auth(c,final),exe=c.gitDeclaration.resources.find(v=>v.id==='browser-executable');
  const browser={contract:'augnes.local-canonical-browser-use.v2',executable_name:'Fixture',location_fingerprint:exe.location_fingerprint,
   before:exe.before,after:exe.before,actual_version:'Chrome/1',runtime_versions:{http:'Chrome/1',cdp:'Chrome/1'},disposition:'unchanged',unchanged:true};
  // The demonstrated journal repair does not make a different, unimplemented
  // behavioral case pass. Preserve that natural failure as the latest tip.
  c.behaviorArgs=['unresolved'];c.failurePhase='authority';
  const completed=await execute(final,cap,browser);
  delete c.failurePhase;assert.equal(completed.stock.valid_deciding_evidence,false);assert.equal(completed.child.result.exit_code,1);
  assert.equal(tip().no_remedy_requalification_consumed,1);assert.deepEqual(tip().revision_grants,[65,72]);
  assert.throws(()=>h.begin(c,noRemedy,null),/attempt_requalification_consumed/);
  c.prior=completed.receipt;c.materialStock=completed.stock;
  await assert.rejects(runNoRemedyControls(c,h,'source',{delegation:163,review:164,grant:165}),/attempt_requalification_consumed/);
  console.log(JSON.stringify({ordinary_no_remedy_material_detour:{material_grant_consumed:72,new_delegation:163,repeat_refused:true},synthetic_only:true}));return;
 }
 if(group==='material-source') {
  c.behaviorPath=driver;c.behaviorArgs=['primary'];
  c.materialPreserved=preserve();
  assert.equal(tip().reviewed_revision_consumed,2);assert.deepEqual(tip().revision_grants,[11,32]);
  await correct('primary',60);unchanged();
  console.log(JSON.stringify({material_source_controls:['spent acquisition predecessor remains immutable','real natural before failure and corrected after pass through production readers','non-reserving preparation binds complete inventory and a distinct one-slot grant'],synthetic_only:true}));return;
 }
 if(group.startsWith('material-no-remedy-')) {
  const stage=group.slice('material-no-remedy-'.length);
  if(stage==='source')await runMaterialSourceControls(c,h,'material-successor',{noRemedyPredecessor:true});
  await runNoRemedyControls(c,h,stage);unchanged();
  await runOrdinaryNoRemedyControls(c,h,stage);
  if(stage==='successor') {c.materialPreserved=preserve();await correct('journal',70);unchanged();}
  return;
 }
 const p=c.proof,focused=read(p.focused);let n=0;
 if(group==='material-controls') {
  materialPredecessorCompatibility(c);
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
 if(c.noRemedy)return; // This same failure and correction already ran in the explicit no-remedy scenario.
 const parsed=h.proof(c),cap=await h.auth(c,parsed);
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
 assert.equal(failed.stock.dimensions.current_merge_applicability,'different_current_main');
 assert(failed.stock.issues.includes('receipt_browser_identity_invalid:integration'));
 assert.throws(()=>h.begin(c,parsed,cap),/attempt_latest_tip_required/);unchanged();
 c.prior=failed.receipt;c.materialStock=failed.stock;c.materialPreserved=preserve();
 console.log(JSON.stringify({material_failed_predecessor:{spent_grant:62,failed_integration_browser_prefix:0,declared_base_retained:true,different_tracking_main:true,fresh_stock_false:true},synthetic_only:true}));
 if(!noRemedyPredecessor){await correct('journal',70);unchanged();}
 return;
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
 assert.deepEqual(tip().revision_grants,c.noRemedy?[11,32,62,65]:[11,32,62]);
 if(c.noRemedy)assert.equal(tip().no_remedy_requalification_consumed,1);
 const exe=c.gitDeclaration.resources.find(v=>v.id==='browser-executable');
 const browser={contract:'augnes.local-canonical-browser-use.v2',executable_name:'Fixture',location_fingerprint:exe.location_fingerprint,
  before:exe.before,after:exe.before,actual_version:'Chrome/1',runtime_versions:{http:'Chrome/1',cdp:'Chrome/1'},disposition:'unchanged',unchanged:true};
 const complete=await execute(final,finalCap,browser);
 assert.equal(complete.stock.valid_deciding_evidence,true);assert.equal(tip().reviewed_revision_consumed,1);
 assert.deepEqual(tip().revision_grants,c.noRemedy?[11,32,62,65,72]:[11,32,62,72]);unchanged();
 if(c.noRemedy){
  assert.equal(tip().no_remedy_requalification_consumed,1);
  assert.throws(()=>h.begin(c,c.noRemedy.proof,null),/attempt_requalification_consumed/);
 }
 const exported=createPrivateReviewExport(complete.receipt);assert(inspectPrivateReviewExport(exported).structurally_valid);
 assert.equal(exported.attempt.source_correction.commission.source_revision,MATERIAL_SOURCE_CORRECTION);
 assert.throws(()=>h.begin(c,final,finalCap),/attempt_latest_tip_required/);
 c.materialFinalReceipt=complete.receipt;
 let consumed=0,r=complete.receipt.attempt;while(r){if(r.source_correction?.kind==='reviewed_revision')consumed++;const prior=r.source_correction;r=prior?h.read(path.join(c.anchor,'.augnes-local-verification/families',prior.prior_family_id,'attempt-'+prior.prior_number+'.json')):null;}
 assert.equal(consumed,c.noRemedy?7:6);
 console.log(JSON.stringify({material_successor:{distinct_grants:c.noRemedy?[62,65,72]:[62,72],historical_grants:[11,32],historical_consumed:c.noRemedy?5:4,total_reviewed_consumed:consumed,commission_allowance:1,first_stock:false,second_stock:true,unchanged_retry:false},synthetic_only:true}));return;
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


// A separate disposable checkout starts its own genuine ordinary ledger. No
// reviewed receipt is stripped or relabelled to manufacture this predecessor.
// Retain the context between the existing three bounded fixture groups.
async function runOrdinaryNoRemedyControls(parent,h,stage) {
 const root=path.join(parent.root,'ordinary-no-remedy'),context=path.join(root,'context.json');
 let c;
 if(stage==='source'){
  mkdirSync(root,{mode:0o700});
  const checkout=path.join(root,'checkout'),anchor=path.join(root,'anchor');
  cpSync(parent.checkout,checkout,{recursive:true,filter:file=>path.basename(file)!=='.augnes-local-verification'});
  mkdirSync(anchor,{mode:0o700});
  c={root,checkout,anchor,branch:parent.branch,base:parent.base,head:parent.head,tree:parent.tree,
   inputs:clone(parent.inputs),authority:clone(parent.authority),live:clone(parent.live),gitDeclaration:clone(parent.gitDeclaration),
   behaviorPath:driver,behaviorArgs:['journal'],failurePhase:'authority',ordinaryNoRemedy:true};
  c.artifacts=path.join(checkout,'.augnes-local-verification/ordinary-initial');c.file=path.join(c.artifacts,'not-a-reviewed-proof.json');
 }else c=h.read(context);
 c.env=parent.env;
 c.git=args=>execFileSync('git',args,{cwd:c.checkout,env:c.env,timeout:5000,maxBuffer:1024*1024,stdio:['ignore','pipe','pipe']});
 c.owner=acquireCheckoutVerificationOwnership({repositoryRoot:c.checkout});
 c.live.service.diagnostics.finished_at=now();
 const refresh=()=>{c.live.service.diagnostics.finished_at=now();};
 let pending=0;
 const tracked=operation=>async(...args)=>{pending++;const value=await operation(...args);pending--;return value;};
 const local={...h,releaseOwner:()=>releaseCheckoutVerificationOwnership(c.owner,c.checkout),
  acquireOwner:()=>c.owner=acquireCheckoutVerificationOwnership({repositoryRoot:c.checkout}),
  behavior:tracked(h.behavior),fresh:tracked(h.fresh),run:tracked(async options=>{const result=await h.run(options);
   assert(result.exit_observed&&result.streams_closed&&result.cleanup_completed&&result.remaining_owned_processes===0);return result;})};
 try{
  if(stage==='source'){
   const attemptsURL=new URL('../local-canonical-attempts.mjs',import.meta.url).href;
   const receiptURL=new URL('../local-canonical-receipt.mjs',import.meta.url).href;
   const inputsURL=new URL('../local-canonical-inputs.mjs',import.meta.url).href;
   const stockScript=`import assert from 'node:assert/strict';import{readFileSync,writeFileSync}from'node:fs';import path from'node:path';
import{inspectAttemptRecords}from ${JSON.stringify(attemptsURL)};import{inspectReceiptForDecision}from ${JSON.stringify(receiptURL)};import{digest}from ${JSON.stringify(inputsURL)};
const c=JSON.parse(readFileSync(process.argv[1]));const r=JSON.parse(readFileSync(path.join(c.checkout,'.augnes-local-verification/receipts',c.stockContext.expectedRunId+'.json')));
assert.equal(r.attempt.source_correction,null);const records=await inspectAttemptRecords({anchorRoot:c.anchor,repositoryRoot:c.checkout,receipt:r});assert.equal(records,true);
const node=r.inputs.resources.find(v=>v.id==='node-executable');assert.equal(digest(node.before),digest(c.inputs.node.observation));
const result=inspectReceiptForDecision(r,{...c.stockContext,currentAttemptRecordsValid:records,currentInputStateValid:true});assert.equal(result.valid_deciding_evidence,false);
writeFileSync(c.stockOutput,JSON.stringify(result));`;
   const original=await executeFixture(c,{...local,
    prepareInput(input){input.binding.runtime_inputs=null;input.resources=input.resources.filter(v=>v.id!=='node-headers');},
    begin(subject,_proof,_authority,extra){return beginAttempt({anchorRoot:subject.anchor,repositoryRoot:subject.checkout,checkoutOwner:subject.owner,
     branch:subject.branch,head:subject.head,tree:subject.tree,runId:'ordinary-initial-failure',...extra});},
    decorateReceipt(r){delete r.inputs.prepared_dependencies;r.evidence.mode='changed';Object.assign(r.integration_base,{contract:'augnes.local-canonical-integration-base.v2',base_matches_current_main:false});
     r.integration_base.observation.sha=c.git(['rev-parse','refs/remotes/origin/main']).toString().trim();},
    async fresh(packet){const result=await local.run({command:process.execPath,args:['--input-type=module','-e',stockScript,packet],cwd:c.checkout,env:c.env,
     suite:'reviewed-revision',label:'ordinary initial fresh stock',timeoutMs:15000,stdout:process.stdout,stderr:process.stderr});
     assert(result.exit_observed&&result.streams_closed&&result.cleanup_completed&&result.remaining_owned_processes===0);assert.equal(result.exit_code,0);}
   },null,null,null,dependencyRecords(c));
   delete c.failurePhase;
   assert.equal(original.child.result.exit_code,1);assert.equal(original.receipt.attempt.source_correction,null);
   assert.deepEqual(original.receipt.phases.map(v=>v.status),[...Array(6).fill('pass'),'failure',...Array(9).fill('not_run')]);
   assert.equal(original.receipt.phases[6].id,'authority');assert.equal(original.stock.issues.length,14,JSON.stringify(original.stock));
   assert.equal(original.receipt.attempt.recovery,null);assert.deepEqual(original.receipt.attempt.budget,{initial:1,recovery:1});
   assert.equal(original.receipt.inputs.binding.runtime_inputs,null);
   assert(!original.receipt.inputs.resources.some(v=>v.id==='node-headers'));
   verifyOrdinaryInitialFailure(original.receipt,original.stock,c.inputs,REVIEWED_REVISION_PHASES);
   const full=clone(original.receipt);full.evidence.mode='full';const fullReceipt=finalizeReceipt(full);
   verifyOrdinaryInitialFailure(fullReceipt,{...original.stock,content_fingerprint:fullReceipt.integrity.content_fingerprint},c.inputs,REVIEWED_REVISION_PHASES);
   const omitted=clone(original.receipt);delete omitted.inputs.binding.runtime_inputs;
   const {contract,path_kind,binding,resources}=omitted.inputs;
   omitted.inputs.fingerprint=omitted.attempt.contract_fingerprint=digest({contract,path_kind,binding,resources});
   const omittedReceipt=finalizeReceipt(omitted);
   verifyOrdinaryInitialFailure(omittedReceipt,{...original.stock,content_fingerprint:omittedReceipt.integrity.content_fingerprint},c.inputs,REVIEWED_REVISION_PHASES);
   c.prior=original.receipt;c.materialStock=original.stock;c.live.inventory=gitRevisionInventory(c.gitDeclaration);
   c.ordinaryOriginals=[path.join(c.anchor,'.augnes-local-verification/families',original.receipt.attempt.family_id,'attempt-1.json'),
    path.join(c.anchor,'.augnes-local-verification/families',original.receipt.attempt.family_id,'completion-1.json'),
    path.join(c.checkout,'.augnes-local-verification/receipts',original.receipt.run.id+'.json'),path.join(c.artifacts,'fresh-stock.json')]
    .map(file=>[file,digest(readFileSync(file))]);
  }
  refresh();await runNoRemedyControls(c,local,stage);
  if(stage==='successor'){
   refresh();await runMaterialSourceControls(c,local,'material-final',{ordinaryDetour:true});
  }
  for(const [file,hash]of c.ordinaryOriginals)assert.equal(digest(readFileSync(file)),hash);
  const {env,owner,git,...state}=c;h.write(context,state);
  console.log(JSON.stringify({ordinary_no_remedy_stage:stage,genuine_initial_ledger:true,historical_originals_unchanged:true,synthetic_only:true}));
 }finally{if(pending===0)releaseCheckoutVerificationOwnership(c.owner,c.checkout);}
}

// The same real preparation, authority, reservation and fresh-process stock
// owners operate on a disposable unchanged-source candidate. Synthetic review
// decisions test attribution and binding; they do not diagnose a host failure.
async function runNoRemedyControls(c,h,stage,ids={delegation:63,review:64,grant:65}) {
 if(stage==='source'){
 const oldAuthority=clone(c.authority), priorHead=c.head, priorTree=c.tree;
 const prior=c.prior, completed=h.read(path.join(c.anchor,'.augnes-local-verification/families',prior.attempt.family_id,'completion-1.json'));
 c.acceptedHead=c.head;c.acceptedTree=c.tree;c.grantId=ids.grant;
 h.prepare(c);const p=c.proof,ref=(name,value)=>h.artifact(c,name,value),read=r=>h.read(path.join(c.artifacts,r.artifact));
 const inherited=prior.attempt.source_correction?.commission??{};
 Object.assign(p.commission,{requalification:NO_REMEDY_REQUALIFICATION,maximum_invocations:1,
  ...(inherited.input_acquisition?{input_acquisition:inherited.input_acquisition}:{}),
  ...(inherited.inherited_serial?{inherited_serial:clone(inherited.inherited_serial)}:{})});
 p.inputs.inventory_sha256=prior.attempt.source_correction?.inputs.inventory_sha256??c.live.inventory;
 if(prior.attempt.source_correction===null)p.inputs.predecessor_sha256=digest(prior.inputs.resources.filter(v=>['node-executable','node-headers'].includes(v.id)));
 p.originals.stock=ref('prior-stock.log',JSON.stringify(c.materialStock));
 // A naturally completed synthetic diagnostic is kept distinct from the
 // previous full phase projection; its result never repairs that false stock.
 await delay(2);const started_at=now();c.behaviorArgs=['primary'];
 const observed=await h.behavior(c);assert.equal(observed.result.exit_code,0);
 const source_files=[driver,product].map(file=>{const bytes=c.git(['show',p.head+':'+file]);return{path:file,sha256:digest(bytes),byte_size:bytes.length};});
 const stdout=ref('diagnostic-stdout.log',observed.output),stderr=ref('diagnostic-stderr.log','');
 const original=ref('diagnostic-original.json',{...observed,output:undefined});
 const observation=ref('diagnostic-observation.json',{contract:'augnes.local-canonical-nondeciding-diagnosis.v1',author:'synthetic operator',
  head:priorHead,tree:priorTree,command:observed.command,started_at,finished_at:observed.finished_at,result:observed.result,
  runtime_inputs_sha256:null,inventory_sha256:null,
  observed_inputs:ref('diagnostic-inputs.json',{scope:'node-and-headers',runtime_before:{contract:'augnes.local-canonical-runtime-inputs.v1',node:c.inputs.node,headers:c.inputs.headers},runtime_after:{contract:'augnes.local-canonical-runtime-inputs.v1',node:c.inputs.node,headers:c.inputs.headers},record:original}),
  source_files:source_files.map(({path,sha256})=>({path,sha256})),instrumentation:null,
  stdout,stderr,originals:[original,p.inputs.current]});
 const assessment=ref('diagnostic-assessment.json',{contract:'augnes.local-canonical-no-remedy-assessment.v1',author:'separate synthetic reviewer',
  decision:NO_REMEDY_DECISION,observation_sha256:observation.sha256,finished_at:now(),historical_cause:'UNKNOWN',qualification:false,
  record:ref('diagnostic-review.log',NO_REMEDY_DECISION+'\nSynthetic source-bound assessment; not human authority or actual qualification.\n')});
 const diagnosis=ref('no-remedy.json',{contract:NO_REMEDY_REQUALIFICATION,
  predecessor:{family_id:p.prior_family_id,attempt_id:p.prior_attempt_id,receipt_fingerprint:p.prior_receipt_fingerprint,head:priorHead,tree:priorTree},observation,assessment});
 p.source=ref('source.json',{...read(p.source),reviewed_at:now()});
 const command=ref('diagnostic-command.json',{...observed,output:undefined});
 const focused={schema:'augnes.local-canonical-reviewed-revision-focused.v1',basis:'implementation_owner_not_independent_review',
  predecessor_receipt_fingerprint:p.prior_receipt_fingerprint,runtime_inputs_sha256:p.inputs.identity_sha256,finished_at:now(),
  failed_phase:prior.phases.find(v=>v.status==='failure')?.id??null,diagnosis:'The retained separate diagnostic assessment justifies no remedy; the historical failure cause remains UNKNOWN.',
  remedy:'none',implicated_paths:[],input_remedy_resources:[],source_files,no_remedy:diagnosis,
  commands:[{command:observed.command,tested_source_head:p.head,result:observed.result,record:command,stdout}]};
 p.focused=ref('focused.json',focused);
 await delay(2);const delegation={...oldAuthority.grant,id:ids.delegation,created_at:now(),body:noRemedyDelegation(p)};delegation.updated_at=delegation.created_at;
 p.commission.delegation={id:ids.delegation,sha256:digest(reviewedRevisionAuthorityObservation(delegation,'task_delegation'))};
 const material=()=>{const q=clone(p);delete q.authorization;delete q.accepted.review;delete q.local_relative_path;return q;};
 const file=path.join(c.artifacts,'preparation.json'),published={...oldAuthority.pr,head:{...oldAuthority.pr.head,sha:p.head}};
 if(prior.attempt.source_correction===null){
  published.base={...published.base,sha:c.git(['rev-parse','refs/remotes/origin/main']).toString().trim()};
  assert.notEqual(published.base.sha,p.base);
 }
 const live=()=>{const value=clone(c.live);value.service.diagnostics.finished_at=now();return value;};
 const args={file,repositoryRoot:c.checkout,predecessorRoot:c.checkout,anchorRoot:c.anchor,runtimeInputs:c.inputs,live};
 const transport={pullRequest:async()=>published,grant:async()=>delegation,permission:async()=>({permission:'admin',user:{login:delegation.user.login}})};
 const prepare=async q=>{h.write(file,q??material());return prepareNoRemedyRequalification(args,{transport});};
 const edge=path.join(c.anchor,'.augnes-local-verification/families',p.prior_family_id,'correction-successor.json');
 const preserved=['attempt-1.json','completion-1.json'].map(name=>[path.join(path.dirname(edge),name),digest(readFileSync(path.join(path.dirname(edge),name)))]);
 const prepared=await prepare();assert.equal(prepared.authorized,false);assert.equal(prepared.reserved,false);assert.equal(prepared.consumed,prior.attempt.source_correction===null?0:1);assert(!existsSync(edge));
 if(prior.attempt.source_correction===null){assert.equal(prepared.original_consumed,1);assert.equal(prepared.recovery_consumed,0);}
 await delay(2);const review={...oldAuthority.review,id:ids.review,commit_id:p.head,submitted_at:now(),body:[decision,
  'COMPLETE: exact source, policy, diagnosis, controls and actual preparation accepted.',NO_REMEDY_REQUALIFICATION,NO_REMEDY_HISTORY,
  p.base,p.head,p.tree,p.focused.sha256,p.prior_receipt_fingerprint,prepared.target].join('\n')};
 p.accepted.review={id:ids.review,sha256:digest(reviewedRevisionAuthorityObservation(review,'accepted_revision'))};
 await delay(2);const grant={...oldAuthority.grant,id:ids.grant,created_at:now(),body:[NO_REMEDY_GRANT,NO_REMEDY_REQUALIFICATION,NO_REMEDY_HISTORY,NO_REMEDY_LIMIT,
  p.schema,p.branch,p.base,p.head,p.tree,p.focused.sha256,p.prior_receipt_fingerprint,prepared.target,
  'https://github.com/hynk-studio/augnes/pull/999#issuecomment-'+ids.delegation,'https://github.com/hynk-studio/augnes/pull/999#pullrequestreview-'+ids.review].join('\n')};grant.updated_at=grant.created_at;
 p.authorization={grant_comment_id:ids.grant,grant_sha256:digest(reviewedRevisionAuthorityObservation(grant,'execution_commission'))};
 c.authority={...oldAuthority,pr:published,review,grant,linked:{['repos/hynk-studio/augnes/issues/comments/'+ids.delegation]:delegation}};
 const bind=()=>h.write(c.file,p);bind();const parsed=h.proof(c),cap=await h.auth(c,parsed);
 c.noRemedy={prepared,preserved,proof:clone(parsed)};
 console.log(JSON.stringify({no_remedy_preparation:{unchanged_source:true,target:prepared.target,consumed:prepared.consumed,authorized:false,reserved:false},synthetic_only:true}));return;
 }
 const p=c.proof,ref=(name,value)=>h.artifact(c,name,value),read=r=>h.read(path.join(c.artifacts,r.artifact));
 const focused=read(p.focused),diagnosis=focused.no_remedy,prior=c.prior;
 const completed=read(p.originals.completion),prepared=c.noRemedy.prepared;
 const material=()=>{const q=clone(p);delete q.authorization;delete q.accepted.review;delete q.local_relative_path;return q;};
 const file=path.join(c.artifacts,'preparation.json'),published=c.authority.pr;
 const live=()=>{const value=clone(c.live);value.service.diagnostics.finished_at=now();return value;};
 const delegation=c.authority.linked['repos/hynk-studio/augnes/issues/comments/63'];
 const args={file,repositoryRoot:c.checkout,predecessorRoot:c.checkout,anchorRoot:c.anchor,runtimeInputs:c.inputs,live};
 const transport={pullRequest:async()=>published,grant:async()=>delegation,permission:async()=>({permission:'admin',user:{login:delegation.user.login}})};
 const prepare=async q=>{h.write(file,q??material());return prepareNoRemedyRequalification(args,{transport});};
 const edge=path.join(c.anchor,'.augnes-local-verification/families',p.prior_family_id,'correction-successor.json'),preserved=c.noRemedy.preserved;
 const bind=()=>h.write(c.file,p),parsed=h.proof(c),cap=await h.auth(c,parsed);
 if(stage==='controls'){
 let refused=0;
 if(c.ordinaryNoRemedy){
  // These are independently sealed malformed ordinary variants for the pure
  // reader, never substitutions for the retained physical original.
  for(const mutate of [r=>r.attempt.number=2,r=>r.attempt.recovery={},r=>r.attempt.source_correction={schema:'augnes.local-canonical-source-correction.v2',kind:'source_revision'},
   r=>r.attempt.prior_attempt_id='unrelated',r=>r.attempt.budget.initial=2,r=>r.repository.head_sha=c.base,
   r=>r.evidence.selected_plan='quick-feedback',r=>r.cleanup.completed=false,r=>r.outcome.safety='blocked',
   r=>r.inputs.resources.find(v=>v.id==='node-executable').before.sha256=digest('changed node')]){
   const changed=clone(prior);mutate(changed);const sealed=finalizeReceipt(changed);
   assert.throws(()=>verifyOrdinaryInitialFailure(sealed,{...c.materialStock,content_fingerprint:sealed.integrity.content_fingerprint},c.inputs,REVIEWED_REVISION_PHASES));refused++;
  }
  for(const mutate of [s=>s.content_fingerprint=digest('different stock'),s=>s.valid_deciding_evidence=true,s=>s.issues.push('unaccounted')]){
   const changed=clone(c.materialStock);mutate(changed);assert.throws(()=>verifyOrdinaryInitialFailure(prior,changed,c.inputs,REVIEWED_REVISION_PHASES));refused++;
  }
  // No original, no terminal completion, or changed retained receipt can
  // establish a consumed/settled predecessor. Every failed preparation is
  // non-reserving, and these disposable originals are restored byte for byte.
  for(const file of c.ordinaryOriginals.slice(0,3).map(([file])=>file)){
   const bytes=readFileSync(file);
   try{rmSync(file);await assert.rejects(prepare());refused++;}finally{h.write(file,bytes);}
  }
  const wrongBase=material();wrongBase.base=wrongBase.accepted.base=published.base.sha;
  await assert.rejects(prepare(wrongBase));refused++;
 }
 // Exercise the same source-delta reader used by real preparation. The only
 // new registration entries are additive; an existing group or executor
 // identity cannot change under this no-remedy action.
 for(const name of c.ordinaryNoRemedy?[]:['scripts/run-canonical-test-suite.mjs','scripts/test-local-canonical-review-corrections.mjs',
  'scripts/fixtures/local-canonical-reviewed-revision.mjs','scripts/test-local-canonical-verification-contract.mjs',
  'scripts/run-local-canonical-verification.mjs']){
  const candidate=readFileSync(new URL('../../'+name,import.meta.url),'utf8');
  let before=candidate;
  for(const group of ['source','controls','successor'])before=before.replaceAll(new RegExp(', ?"material-no-remedy-'+group+'"','gu'),'');
  before=before.replace('  "scripts/local-canonical-no-remedy.mjs",\n','');
  const delta={predecessor_to_final:{paths:[name]}},readSource=after=>([,target])=>Buffer.from(target.startsWith('prior:')?before:after);
  assert.doesNotThrow(()=>verifyNoRemedySourceDelta({head:'candidate'},{head:'prior'},delta,readSource(candidate)));
  const changed=candidate.replace(name==='scripts/run-local-canonical-verification.mjs'?'"scripts/local-canonical-git-observation.mjs"':'"material-source"','"changed-existing-owner"');
  assert.notEqual(changed,candidate);assert.throws(()=>verifyNoRemedySourceDelta({head:'candidate'},{head:'prior'},delta,readSource(changed)),/requalification_(workload|executor)_changed/);refused++;
 }
 for(const change of [q=>delete q.commission.requalification,q=>q.commission.requalification='unknown',q=>q.commission.source_revision=MATERIAL_SOURCE_CORRECTION,
  q=>q.commission.evidence_kind='invented',q=>q.commission.ordinal=2,q=>q.commission.maximum_invocations=2,q=>q.prior_attempt_id='older-tip',
  q=>q.head=c.base,q=>q.inputs.inventory_sha256=digest('other complete inputs'),q=>q.inputs.identity_sha256=digest('other runtime')]){
  const q=material();change(q);await assert.rejects(prepare(q));refused++;
 }
 for(const [part,change]of c.ordinaryNoRemedy?[]:[['evidence',v=>v.predecessor.receipt_fingerprint=digest('different receipt')],
  ['observation',v=>v.head=c.base],['observation',v=>v.inventory_sha256=digest('stale inputs')],
  ['observation',v=>v.result.cleanup_completed=false],['observation',v=>v.result.streams_closed=false],
  ['observation',v=>v.result.timed_out=true],['observation',v=>v.source_files[0].sha256=digest('other source')],
  ['assessment',v=>v.author='synthetic operator'],['assessment',v=>v.qualification=true],
  ['assessment',v=>v.historical_cause='infrastructure'],['assessment',v=>v.decision='PASS']]){
  const e=read(diagnosis),f=clone(focused);
  if(part==='evidence')change(e);else{const v=read(e[part]);change(v);e[part]=ref('bad-'+part+'-'+refused+'.json',v);}
  f.no_remedy=ref('bad-diagnosis-'+refused+'.json',e);
  const q=material();q.focused=ref('bad-focus-'+refused+'.json',f);await assert.rejects(prepare(q));refused++;
 }
 h.write(file,material());
 const before=clone(delegation);
 for(const change of [d=>d.body='diagnostic received; not accepted',d=>d.user={...d.user,type:'Bot'},
  d=>d.created_at=d.updated_at=completed.finished_at,d=>d.updated_at=new Date(Date.parse(d.created_at)+1).toISOString()]){
  change(delegation);const q=material();q.commission.delegation.sha256=digest(reviewedRevisionAuthorityObservation(delegation,'task_delegation'));
  await assert.rejects(prepare(q));Object.assign(delegation,clone(before));refused++;
 }
 assert.equal((await prepare()).target,prepared.target);
 for(const [role,change]of [['review',v=>v.body=v.body.replace('COMPLETE:','INCOMPLETE:')],['grant',v=>v.body=v.body.replace(NO_REMEDY_GRANT,'Approval')],
  ['grant',v=>v.created_at=v.updated_at=c.authority.review.submitted_at],['grant',v=>v.updated_at=new Date(Date.parse(v.created_at)+1).toISOString()]]){
  const saved=clone(c.authority[role]),r=c.authority[role];change(r);
  const hash=digest(reviewedRevisionAuthorityObservation(r,role==='review'?'accepted_revision':'execution_commission'));
  if(role==='review')p.accepted.review.sha256=hash;else p.authorization.grant_sha256=hash;
  bind();await assert.rejects(h.auth(c,h.proof(c)));c.authority[role]=saved;
  p.accepted.review.sha256=digest(reviewedRevisionAuthorityObservation(c.authority.review,'accepted_revision'));
  p.authorization.grant_sha256=digest(reviewedRevisionAuthorityObservation(c.authority.grant,'execution_commission'));refused++;
 }
 const authority=clone(p.authorization);p.authorization.grant_comment_id=prior.attempt.source_correction?.authorization.grant_comment_id??p.commission.delegation.id;
 bind();if(c.ordinaryNoRemedy)await assert.rejects(async()=>h.auth(c,h.proof(c)));else assert.throws(()=>h.proof(c),/revision_commission_lineage_invalid/);
 p.authorization=authority;bind();refused++;
 assert.throws(()=>h.begin(c,parsed,{observations:{}}),/revision_authenticated_authority_required/);refused++;
 assert.throws(()=>h.begin(c,parsed,cap,{revisionLive:{...live(),inventory:digest('changed live')}}));refused++;
 assert(!existsSync(edge));for(const [f,hash]of preserved)assert.equal(digest(readFileSync(f)),hash);
 c.noRemedy.refused=refused;console.log(JSON.stringify({no_remedy_refusals:refused,synthetic_only:true}));return;
 }
 // A failed deciding fixture remains failed. Its fresh stock is read by the
 // existing separate process; the one allowance is consumed regardless.
 c.behaviorArgs=['journal'];c.failurePhase='integration';c.live=live();
 const contender=c.ordinaryNoRemedy?await h.auth(c,parsed):cap;
 const result=await executeFixture(c,{...h,decorateReceipt(r){
  Object.assign(r.integration_base,{contract:'augnes.local-canonical-integration-base.v2',base_matches_current_main:false});
  r.integration_base.observation.sha=c.git(['rev-parse','refs/remotes/origin/main']).toString().trim();
  r.phases.find(p=>p.id==='integration').browser_use=[];
 },begin:(subject,proof,authority,extra)=>{
  const owned=h.begin(subject,proof,authority,{...extra,runId:'no-remedy-once'});
  assert.throws(()=>h.begin(subject,proof,contender,{...extra,runId:'no-remedy-duplicate'}));return owned;
 }},parsed,cap,null,dependencyRecords(c));delete c.failurePhase;
 assert.equal(result.stock.valid_deciding_evidence,false);assert.equal(result.child.result.exit_code,1);
 const tip=reconstructAttemptTip({anchorRoot:c.anchor,repositoryRoot:c.checkout,branch:c.branch});
 assert.equal(tip.no_remedy_requalification_consumed,1);assert.equal(tip.reviewed_revision_consumed,1);
 assert.deepEqual(tip.revision_grants,c.ordinaryNoRemedy?[65]:[11,32,62,65]);
 assert.throws(()=>h.begin(c,parsed,cap),/attempt_requalification_consumed/);
 const record=path.join(c.anchor,'.augnes-local-verification/families',result.receipt.attempt.family_id,'attempt-1.json'),saved=readFileSync(record);
 try{const stripped=JSON.parse(saved);delete stripped.source_correction.commission.requalification;h.write(record,stripped);
  assert.throws(()=>reconstructAttemptTip({anchorRoot:c.anchor,repositoryRoot:c.checkout,branch:c.branch}));}finally{h.write(record,saved);}
 try{rmSync(record);assert.throws(()=>h.begin(c,parsed,cap));assert(existsSync(edge));}finally{h.write(record,saved);}
 for(const [f,hash]of preserved)assert.equal(digest(readFileSync(f)),hash);
 c.prior=result.receipt;c.materialStock=result.stock;
 console.log(JSON.stringify({no_remedy_requalification:{unchanged_source:true,actual_preparation:true,authorized:false,reserved:false,
  focused_refusals:c.noRemedy.refused,distinct_synthetic_grant:65,consumed_once:true,fresh_stock:false,unknown_preserved:true,
  duplicate_partial_downgrade_refused:true,historical_records_unchanged:true},synthetic_only:true,deciding:false}));
}
