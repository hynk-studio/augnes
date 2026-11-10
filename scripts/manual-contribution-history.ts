// A new process reconstructs the reassessed different task, then checks legacy
// profile notes using ordinary preview/save and retained reads, never DB edits.
import assert from "node:assert/strict";
import { canonical, digest } from "../plugins/augnes-operator/mcp/review-connection.mjs";
import { prepareExecutionChoice } from "../plugins/augnes-operator/mcp/execution-choice.mjs";
import { root, save, call, readCurrent, saveChanges, setupServer, finish, choice, note, refused } from "./execution-choice-transition-harness";
async function checkHistory() {
  const fresh = await choice("read"), m = fresh.manual_contribution;
  assert.equal(m.decision_currentness,"saved_basis_retained");
  assert.equal(m.request_task,"different_task");
  assert.equal(m.original.selection,"historical_not_selected");
  assert.equal(m.decision.selection,"historical_not_selected");
  assert.match(m.decision.value.reassessment,/Different task/);
  const card = JSON.parse(m.downstream[0].text);
  assert.equal(card.available,12);assert.equal(card.top_up,8);assert.equal(card.order_authorized,false);
  assert.equal(m.feedback.delivery.decision_ref,m.decision.ref);
  save("fresh-different-task",fresh);
  const now = await readCurrent();
  const actual = await call("augnes_read_repository_work_sources",{repositoryRoot:root,expectedSnapshotBinding:now.snapshot,includeWorkDefinition:true});
  // Older/unrecoverable current reader identity is not replaced with packet or
  // definition equality. This seam complements the actual saved legacy route.
  const missing = {...actual};delete missing.task_identity;
  const unavailable = await (prepareExecutionChoice as any)({action:"read",repositoryRoot:root,expectedSnapshotBinding:now.snapshot},{
    readSources:async()=>missing,review:async()=>({status:"available",connections:[]}),
    lookupRetained:(args:any)=>call("augnes_lookup_repository_retained_sources",args),
  });
  assert.equal(unavailable.manual_contribution.task_identity,null);
  assert.equal(unavailable.manual_contribution.decision_currentness,"task_identity_unknown");
  // Compatibility fixture: encode the previous accepted profile without task
  // identity. Originals remain attributed; no identity is guessed from content.
  const request = {...m.request.value};delete request.task;
  const original = {...m.original.value,request:digest(request)};
  const decision = {...m.decision.value,request:digest(request),original:digest(original),basis:{...m.decision.value.basis}};
  delete decision.basis.task;
  const feedback = {profile:request.profile,kind:"feedback",decision:digest(decision)};
  const legacy = [request,original,decision,feedback].map(v=>note("note-ref:manual-contribution:"+digest(v).slice(7),canonical(v),v.kind==="return"?"imported_unverified":"derived_interpretation"));
  await saveChanges({sources:{deselect:[m.feedback.source_ref],add:legacy}});
  const loaded = await choice("read"), l = loaded.manual_contribution;
  assert.equal(l.request_task,"unknown");assert.equal(l.decision_task,"unknown");
  assert.equal(l.decision_currentness,"task_identity_unknown");
  assert.equal(l.original.value.content,m.original.value.content);
  await refused("legacy identity cannot prepare current feedback",()=>choice("feedback",{},true),"execution_choice_manual_reassessment_required");
  await saveChanges({sources:{deselect:[l.request.source_ref,l.original.source_ref,l.decision.source_ref]}});
  const historical = await choice("read");
  assert.equal(historical.manual_contribution.original.selection,"historical_not_selected");
  assert.equal(historical.manual_contribution.decision_currentness,"task_identity_unknown");
  assert.deepEqual(historical.manual_contribution.decision.value,decision);
  save("legacy-history",{legacy,loaded,historical,unavailable});
}
void setupServer().then(checkHistory).finally(finish);
