// Deterministic native predecessor, supported successor preview/save, then the
// public ordinary MCP manual cycle. No CLI consumer, provider or installed state.
import assert from "node:assert/strict";
import { mkdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { applyCanonicalDatabaseMigrations } from "./canonical-database-migrations.mjs";
import { getOrCreateDefaultWorkspaceIdentityV01, getOrCreateCanonicalProjectForLocalRootV01, normalizeLocalProjectRootRefV01 } from "../lib/vnext/persistence/project-identity-registry";
import { selectActiveProjectV01 } from "../lib/vnext/persistence/project-lifecycle-registry";
import { issueVNextLocalOperatorBootstrapV01, consumeVNextLocalOperatorBootstrapV01, readVNextLocalOperatorCredentialFromRequestV01, VNEXT_LOCAL_OPERATOR_SESSION_COOKIE_V01 } from "../lib/vnext/runtime/local-operator-session";
import { defineInitialProjectWorkV01, readProjectWorkInitializationSnapshotV01 } from "../lib/vnext/runtime/project-work-initialization";
import { runDirectNativeHostRoundTripV01 } from "../lib/vnext/runtime/direct-native-host-round-trip";
import { createDeterministicCodexAdapterV01 } from "../lib/vnext/native-host/deterministic-codex-adapter";
import { readResultWorkPreparationV01, compareResultWorkSourcesV01, previewResultWorkV01, defineAuthoredSuccessorTaskV01 } from "../lib/vnext/runtime/authored-successor-task";
import { directory, root, db, artifactDirectory, save, call, readCurrent, saveChanges, savePrepared, note, refused, setupServer, finish, choice } from "./execution-choice-transition-harness";

const reproduction = process.argv.includes("--reproduce");
const definition = { goal:"Prepare a restock card from the selected inventory", success_criteria:["Keep reserved units out of available stock"], non_goals:["No order or physical stock claim"] };
async function produce() {
  applyCanonicalDatabaseMigrations(db); mkdirSync(root); mkdirSync(artifactDirectory);
  const w=getOrCreateDefaultWorkspaceIdentityV01(db);
  const registration=getOrCreateCanonicalProjectForLocalRootV01(db,{workspace_id:w.workspace_id,local_root:normalizeLocalProjectRootRefV01(root,{base_path:directory}),display_name:"Authored successor manual fixture"});
  const scope={workspace_id:w.workspace_id,project_id:registration.project.project_id};
  const config={...scope,enabled:true as const,operator_id:"deterministic-successor-fixture",database_path:db.name};
  const operatorEnvironment={AUGNES_VNEXT_OPERATOR_PILOT_ENABLED:"1",AUGNES_VNEXT_OPERATOR_WORKSPACE_ID:scope.workspace_id,AUGNES_VNEXT_OPERATOR_PROJECT_ID:scope.project_id,AUGNES_VNEXT_OPERATOR_ID:config.operator_id};
  Object.assign(process.env,operatorEnvironment);save("fixture-operator-environment",operatorEnvironment);
  const start=Date.now()-60_000, at=(ms:number)=>new Date(start+ms).toISOString(), clock=(ms:number)=>({now:()=>at(ms)});
  const selected=selectActiveProjectV01(db,{...scope,expected_project_id:null,expected_revision:null,now:at(0)});
  const bootstrap=issueVNextLocalOperatorBootstrapV01(db,{config,clock:clock(0)});
  const session=consumeVNextLocalOperatorBootstrapV01(db,{config,bootstrap_token:bootstrap.bootstrap_token,clock:clock(1000)});
  const credential=(cookie:string)=>readVNextLocalOperatorCredentialFromRequestV01(new Request("http://127.0.0.1/",{headers:{cookie:`${VNEXT_LOCAL_OPERATOR_SESSION_COOKIE_V01}=${cookie}`}}));
  // Same definition deliberately: the successor boundary cannot be inferred from text.
  const initial=defineInitialProjectWorkV01(db,{config,credential:session.credential,request:{action:"define_initial_project_work",...scope,expected_active_project_id:scope.project_id,expected_active_selection_revision:selected.selection_revision,expected_initialization_state:"not_defined",...definition},clock:clock(2000)});
  const initialIdentity=readProjectWorkInitializationSnapshotV01(db,scope).task_origin_fingerprint;
  let tick=4000;const now=()=>at(tick+=100);
  const first=await runDirectNativeHostRoundTripV01(db,{config,mode:"interactive",operator_mutation:{credential:credential(initial.session_admission.cookie_value),clock:clock(3000)}},{adapter:createDeterministicCodexAdapterV01({now}),now});
  assert.equal(first.receipt.execution.status,"completed");
  const before=db.serialize();
  const preparation=readResultWorkPreparationV01(db,{config,receipt_id:first.receipt.receipt_id,clock:clock(20000)});
  const comparison=compareResultWorkSourcesV01(db,{config,binding:preparation.binding,notes:[],clock:clock(20000)});
  const preview=previewResultWorkV01(db,{config,session_id:credential(first.session_admission!.cookie_value).session_id,binding:preparation.binding,clock:clock(20000),definition,selected_sources:{selected_source_context:comparison.entries,expected_source_comparison:comparison.fingerprint,omitted_sources:[]}});
  assert(before.equals(db.serialize()),"successor preparation and preview are read only");
  const successor=await defineAuthoredSuccessorTaskV01(db,{config,credential:credential(first.session_admission!.cookie_value),request:preview.request,clock:clock(20000)});
  const origin=successor.packet.integrity.fingerprint;
  assert.equal(readProjectWorkInitializationSnapshotV01(db,scope).task_origin_fingerprint,origin);
  assert.notEqual(origin,initialIdentity,"the actual successor is a different task despite identical definition");
  save("successor-creation",{initial:initial.packet,initialIdentity,receipt:first.receipt,preparation,preview,successor:successor.packet,origin});
  const identities:any[]=[];
  async function observe(label:string) {
    const c=await readCurrent(); assert(!("task_identity" in c),"default source projection unchanged");
    const full=await call("augnes_read_repository_work_sources",{repositoryRoot:root,expectedSnapshotBinding:c.snapshot,includeWorkDefinition:true});
    identities.push({label,task_identity:full.task_identity,packet:full.packet_fingerprint});
    save("successor-identities",identities);
    if(!reproduction)assert.equal(full.task_identity,origin,label);
    return full;
  }
  const inventory={revision:"inventory-1",counted:17,reserved:5,target:20,physical_stock:"unknown"};
  await saveChanges({sources:{add:[note("/private/origin/inventory.json",JSON.stringify(inventory))]}});
  await observe("ordinary source save");
  const burden={preparation:"selected bytes",waiting:"unknown",execution:"unknown",coordination:"manual file",integration:"check before use",switching:"unknown"};
  await savePrepared(await choice("choose",{judgment:{present:"Direct",alternatives:[{arrangement:"Direct",benefit:"Read counts",burden},{arrangement:"Manual contribution",benefit:"Check counts",burden,manual_contribution:true}],recommended:"Manual contribution",chosen:"Manual contribution",expectation:"Checked counts inform restock card",uncertainty:"Physical stock unknown",horizon:new Date(Date.now()+3600000).toISOString(),reconsider_when:"Counts or purpose change"}}));
  const chosen=await observe("choice profile save"),input=chosen.sources.find((s:any)=>s.excerpt_text===JSON.stringify(inventory)).source_binding;
  const request=await choice("participate",{participation:{purpose:"Prepare restock card",question:"How many unreserved and top-up units?",expected_return:"Counts, arithmetic, limits",checks:"Subtract reserved; no physical stock inference",check_use_owner:"Origin card maintainer",return_method:"One manually supplied UTF-8 file",feedback_method:"Manually relay saved feedback",recheck:"Inventory or target changes",material_refs:[input]}});
  await savePrepared(request);save("manual-request",request.delivery);
  await observe("request profile save");
  const requestRead=await choice("read");
  assert.equal(requestRead.manual_contribution.request_task,reproduction?"different_task":"same_task");
  const delivered=JSON.parse(readFileSync(path.join(artifactDirectory,"manual-request.json"),"utf8"));
  const i=JSON.parse(delivered.request.material[0].text);
  const original={manual_request_ref:delivered.manual_request_ref,material_ref:delivered.material_ref,source_revision:"successor-return-1",selection:"Complete JSON file",actor:"Implementer-authored deterministic responder",assistance:"Arithmetic fixture; no independent participant or model",content:JSON.stringify({available:i.counted-i.reserved,top_up:i.target-i.counted+i.reserved,physical_stock:"unknown",suggestion:"place order now"})};
  save("original-return",original);
  await savePrepared(await choice("receive",{manual_return:JSON.parse(readFileSync(path.join(artifactDirectory,"original-return.json"),"utf8"))}));
  await observe("original return save");
  const returned=(await choice("read")).manual_contribution;
  const answer=JSON.parse(returned.original.value.content);
  assert.equal(answer.available,12);assert.equal(answer.top_up,8);
  const card={available:answer.available,top_up:answer.top_up,physical_stock:answer.physical_stock,order_authorized:false,original:returned.original.ref};
  await saveChanges({sources:{add:[note("note-ref:restock-card",JSON.stringify(card),"derived_interpretation")]}});
  const current=await observe("downstream source save"),cardRef=current.sources.find((s:any)=>s.source_locator==="note-ref:restock-card").source_binding;
  assert.equal(current.sources.find((s:any)=>s.source_binding===returned.original.source_ref).trust_class,"imported_unverified");
  const assessment={manual_request_ref:returned.request.ref,manual_return_ref:returned.original.ref,disposition:"partly_used",result_refs:[cardRef],checks:"17-5=12; 20-12=8; order suggestion refused",applicability:"Inventory-1 and target 20",reason:"Use checked counts on the card; decline order advice",uncertainty:"Physical stock unknown",unfinished:"Confirm shelf stock before ordering",next_action:"Print card; confirm shelf stock",reconsider_when:"Inventory or target changes",...(reproduction?{reassessment:"Explicitly checked same authored successor and unchanged inventory"}:{})};
  await savePrepared(await choice("assess",{assessment}));
  await observe("assessment own save");
  const assessed=await choice("read");save("saved-assessment",assessed);
  if(reproduction){
    assert.equal(assessed.manual_contribution.decision_task,"different_task");
    assert.equal(assessed.manual_contribution.decision_currentness,"reassessment_required");
    const refusal=await refused("newly saved successor assessment falsely stale",()=>choice("feedback",{},true),"execution_choice_manual_reassessment_required");
    save("successor-reproduction",{requestRead,assessed,refusal,identities});return;
  }
  assert.equal(assessed.manual_contribution.decision_currentness,"saved_basis_retained");
  assert.equal(assessed.manual_contribution.decision_task,"same_task");
  const feedback=await choice("feedback");await savePrepared(feedback);save("manual-feedback-relay",feedback.delivery);
  await observe("feedback save");
  const complete=await choice("read");save("saved-cycle",complete);
  assert.equal(complete.manual_contribution.decision_currentness,"saved_basis_retained");
  // Historical attribution remains recoverable after ordinary profile deselection.
  await saveChanges({sources:{deselect:[returned.request.source_ref,returned.original.source_ref,complete.manual_contribution.decision.source_ref]}});
  await observe("profile deselection");
  const historical=await choice("read");save("historical-cycle",historical);
  assert.equal(historical.manual_contribution.original.selection,"historical_not_selected");
  assert.equal(historical.manual_contribution.original.value.content,original.content);
  assert.equal(historical.manual_contribution.decision_currentness,"saved_basis_retained");
}
void setupServer().then(produce).finally(finish);
