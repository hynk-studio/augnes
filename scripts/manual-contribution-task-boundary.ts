import assert from "node:assert/strict";
import { digest } from "../plugins/augnes-operator/mcp/review-connection.mjs";
import { root, save, call, readCurrent, saveChanges, savePrepared, setupServer, finish, choice, lookup, refused } from "./execution-choice-transition-harness";

async function checkBoundary() {
  const before = await choice("read"), manual = before.manual_contribution;
  const refs = [];
  for (const record of [manual.request, manual.original, manual.decision]) {
    const result = await lookup("note-ref:manual-contribution:" + record.ref.slice(7));
    refs.push(result.lookup.results.find((r:any) => r.note.source_binding === record.source_ref).source);
  }
  await saveChanges({sources:{retained_source_refs:refs}});
  const restored = await choice("read");
  assert.equal(restored.manual_contribution.decision_currentness,"saved_basis_retained");
  assert.equal(restored.manual_contribution.task_identity,manual.task_identity);
  assert.notEqual(restored.packet,before.packet,"profile reselection changes packet, not task identity");
  // Restore the original definition in this same task, deliberately replace the
  // prior decision, and prove assessment needs no different-task acknowledgement.
  const assessment = {
    manual_request_ref:manual.request.ref,manual_return_ref:manual.original.ref,
    result_refs:manual.decision.value.results.map((r:any)=>r.source_ref),disposition:"partly_used",
    checks:"Independent subtraction: 17-5=12; 20-12=8",applicability:"Inventory-1 and target 20 only",
    reason:"Keep checked card; decline order advice",uncertainty:"Physical stock unknown",
    unfinished:"Confirm shelf stock before ordering",next_action:"Print restock card; confirm shelf stock",
    reconsider_when:"Inventory revision or target changes",
  };
  await saveChanges({goal:"Prepare a restock card from the selected inventory",sources:{deselect:[manual.decision.source_ref,manual.feedback.source_ref]}});
  const sameTaskRevision = await choice("read");
  assert.equal(sameTaskRevision.manual_contribution.task_identity,manual.task_identity);
  assert.equal(sameTaskRevision.manual_contribution.applicability,"original_material_selected");
  assert.equal(digest(sameTaskRevision.work),manual.request.value.definition);
  await savePrepared(await choice("assess",{assessment}));
  await savePrepared(await choice("feedback"));
  const sameTask = await choice("read"), prior = sameTask.manual_contribution;
  const current = await readCurrent();
  const args = {repositoryRoot:root,expectedSnapshotBinding:current.snapshot,changes:{...sameTask.work,sources:{
    keep:current.sources.filter((s:any)=>s.source_binding!==prior.feedback.source_ref).map((s:any)=>s.source_binding),
    omitted_sources:[{source_binding:prior.feedback.source_ref,reason:"Different task; retain original and prior decision, omit old feedback"}],
  }}};
  const preview = await call("augnes_preview_repository_new_work",args);
  const saved = await call("augnes_prepare_repository_new_work",{...args,previewBinding:preview.preview_binding});
  const fresh = await choice("read");
  assert.deepEqual(fresh.work,sameTask.work);
  assert.notEqual(fresh.packet,sameTask.packet);
  assert.equal(saved.preparation.prior_work_marked_complete,false);
  assert.equal(fresh.manual_contribution.decision.ref,prior.decision.ref);
  assert.equal(fresh.manual_contribution.original.value.content,manual.original.value.content);
  assert.notEqual(fresh.manual_contribution.task_identity,prior.task_identity);
  assert.equal(fresh.manual_contribution.request_task,"different_task");
  assert.equal(fresh.manual_contribution.decision_task,"different_task");
  assert.equal(fresh.manual_contribution.applicability,"request_task_changed");
  assert.equal(fresh.manual_contribution.decision_currentness,"reassessment_required");
  const refusal = await refused("different task cannot prepare prior feedback",()=>choice("feedback",{},true),"execution_choice_manual_reassessment_required");
  await saveChanges({sources:{deselect:[prior.decision.source_ref]}});
  await refused("different task requires deliberate reassessment",()=>choice("assess",{assessment},true),"execution_choice_manual_reassessment_required");
  const selected = await readCurrent();
  const inventory = JSON.parse(selected.sources.find((s:any)=>s.source_binding===prior.request.value.material[0].source_ref).excerpt_text);
  const card = JSON.parse(selected.sources.find((s:any)=>s.source_binding===assessment.result_refs[0]).excerpt_text);
  assert.equal(card.available,inventory.counted-inventory.reserved);
  assert.equal(card.top_up,inventory.target-card.available);
  assert.equal(card.order_authorized,false);
  const newDecision = await choice("assess",{assessment:{...assessment,reassessment:"Different task: rechecked inventory, card counts and no-order boundary; retain the original as historical input"}});
  await savePrepared(newDecision);
  const feedback = await choice("feedback");
  await savePrepared(feedback);
  const reassessed = await choice("read");
  assert.equal(reassessed.manual_contribution.decision_task,"same_task");
  assert.equal(reassessed.manual_contribution.request_task,"different_task");
  assert.equal(reassessed.manual_contribution.decision_currentness,"saved_basis_retained");
  assert.notEqual(reassessed.manual_contribution.decision.ref,prior.decision.ref);
  const priorLookup = await lookup("note-ref:manual-contribution:" + prior.decision.ref.slice(7));
  assert.equal(priorLookup.lookup.results[0].selection,"historical_not_selected");
  assert.deepEqual(JSON.parse(priorLookup.lookup.results[0].note.excerpt_text),prior.decision.value);
  await saveChanges({sources:{deselect:[prior.request.source_ref,prior.original.source_ref,reassessed.manual_contribution.decision.source_ref]}});
  save("different-task-correction",{before,restored,sameTaskRevision,sameTask,args,preview,saved,fresh,refusal,newDecision,feedback,reassessed,priorLookup});
}
void setupServer().then(checkBoundary).finally(finish);
