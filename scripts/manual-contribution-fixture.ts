// Exposed deterministic manual-file exercise; all roles are implementer-authored.
import assert from "node:assert/strict";
import { mkdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { applyCanonicalDatabaseMigrations } from "./canonical-database-migrations.mjs";
import { getOrCreateDefaultWorkspaceIdentityV01, getOrCreateCanonicalProjectForLocalRootV01, normalizeLocalProjectRootRefV01 } from "../lib/vnext/persistence/project-identity-registry";
import { digest } from "../plugins/augnes-operator/mcp/review-connection.mjs";
import { prepareExecutionChoice } from "../plugins/augnes-operator/mcp/execution-choice.mjs";
import { directory, root, db, artifactDirectory, checks, save, raw, call, readCurrent, saveChanges, savePrepared, note, refused, setupServer, finish, choice, find, setSaveFailure } from "./execution-choice-transition-harness";
const burden = { preparation: "explicit excerpts", waiting: "unknown", execution: "unknown", coordination: "manual files", integration: "check before use", switching: "unknown" };
const judgment = { present: "Direct", alternatives: [
  { arrangement: "Direct", benefit: "Read the inventory directly", burden },
  { arrangement: "Manual contribution", benefit: "Ask for a count check", burden, manual_contribution: true },
], recommended: "Manual contribution", chosen: "Manual contribution", expectation: "Checked count informs a printable restock card", uncertainty: "Shelf observation unknown", horizon: new Date(Date.now()+3600000).toISOString(), reconsider_when: "Counts or card purpose change" };

async function produce() {
  applyCanonicalDatabaseMigrations(db); mkdirSync(root); mkdirSync(artifactDirectory);
  const w = getOrCreateDefaultWorkspaceIdentityV01(db);
  getOrCreateCanonicalProjectForLocalRootV01(db, {workspace_id:w.workspace_id, local_root:normalizeLocalProjectRootRefV01(root,{base_path:directory}),display_name:"Synthetic restock card"});
  await saveChanges({goal:"Prepare a restock card from the selected inventory",success_criteria:["Keep reserved units out of available stock"],non_goals:["No order or physical stock claim"]},true);
  const inventory = { revision:"inventory-1", counted:17, reserved:5, target:20, physical_stock:"unknown" };
  await saveChanges({sources:{add:[note("/private/origin/inventory.json",JSON.stringify(inventory)),note("note-ref:hidden-budget","PRIVATE-HIDDEN-NOTE: internal budget") ]}});
  const preChoice = await readCurrent();
  await savePrepared(await choice("choose",{judgment}));
  const inputRef=preChoice.sources.find((s:any)=>s.excerpt_text===JSON.stringify(inventory)).source_binding;
  const p={purpose:"Prepare restock card",question:"How many unreserved units and top-up units?",expected_return:"Counts, arithmetic and limits",checks:"Subtract reserved; do not infer physical stock",check_use_owner:"Origin card maintainer",return_method:"Manually return one UTF-8 JSON file",feedback_method:"Origin manually relays saved feedback JSON",recheck:"Inventory revision or target changes",material_refs:[inputRef]};
  const request=await choice("participate",{participation:p});
  assert.equal(request.status,"prepared");
  assert(!JSON.stringify(request.delivery).includes("PRIVATE-HIDDEN-NOTE"));
  assert(!JSON.stringify(request.delivery).includes("/private/origin"));
  assert(!JSON.stringify(request.delivery).includes(root));
  assert.equal(request.delivery.request.material[0].text,JSON.stringify(inventory));
  assert.equal(request.request_arguments,undefined);
  checks.push("only selected complete bytes delivered; no locators or native review request");
  await refused("request overflow",()=>choice("participate",{participation:{...p,question:"q".repeat(240),purpose:"p".repeat(240),checks:"c".repeat(240),expected_return:"e".repeat(240),check_use_owner:"o".repeat(240),return_method:"r".repeat(240)}},true),"execution_choice_manual_note_budget_exceeded");
  await refused("unavailable selected material",()=>choice("participate",{participation:{...p,material_refs:["sha256:"+"0".repeat(64)]}},true),"execution_choice_manual_material_missing");
  await savePrepared(request);
  // The file is the explicit manual handoff; no outbound transmission occurs.
  save("manual-request",request.delivery);
  const receivedRequest=JSON.parse(readFileSync(path.join(artifactDirectory,"manual-request.json"),"utf8"));
  const disclosed=JSON.parse(receivedRequest.request.material[0].text);
  const answer={available:disclosed.counted-disclosed.reserved,top_up:disclosed.target-(disclosed.counted-disclosed.reserved),physical_stock:"unknown",suggestion:"place order now"};
  const supplied={manual_request_ref:receivedRequest.manual_request_ref,material_ref:receivedRequest.material_ref,source_revision:"fixture-return-1",selection:"Complete UTF-8 JSON file; no excerpt omitted",actor:"Implementer-authored deterministic responder",assistance:"Exposed arithmetic fixture; no model or independent participant",content:JSON.stringify(answer)};
  save("original-return",supplied);
  const original=JSON.parse(readFileSync(path.join(artifactDirectory,"original-return.json"),"utf8"));
  await refused("wrong exact request",()=>choice("receive",{manual_return:{...original,manual_request_ref:"sha256:"+"a".repeat(64)}},true),"execution_choice_manual_request_mismatch");
  await refused("wrong material identity",()=>choice("receive",{manual_return:{...original,material_ref:"sha256:"+"a".repeat(64)}},true),"execution_choice_manual_basis_mismatch");
  await refused("incomplete original",()=>choice("receive",{manual_return:{...original,content:""}},true),"execution_choice_manual_invalid_input");
  await refused("return overflow",()=>choice("receive",{manual_return:{...original,content:"x".repeat(2000)}},true),"execution_choice_manual_note_budget_exceeded");
  const receive=await choice("receive",{manual_return:original});
  const preview=await call(receive.revision_tool,receive.revision_arguments);
  setSaveFailure(true);
  await refused("atomic original-save rollback",()=>raw("augnes_save_repository_work_revision",{...receive.revision_arguments,previewBinding:preview.preview_binding}));
  setSaveFailure(false);
  // Explicit fresh read and a new preparation after the failed transaction.
  await savePrepared(await choice("receive",{manual_return:original}));
  const returned=(await choice("read")).manual_contribution;
  assert.equal(returned.original.value.content,original.content);
  assert.equal((await readCurrent()).sources.find((s:any)=>s.source_binding===returned.original.source_ref).trust_class,"imported_unverified");
  const r=JSON.parse(returned.original.value.content);
  assert.equal(r.available,12); assert.equal(r.top_up,8); // Independent fixture oracle.
  const card={revision:"restock-card-1",available:r.available,top_up:r.top_up,physical_stock:r.physical_stock,order_authorized:false,original:returned.original.ref};
  await saveChanges({sources:{add:[note("note-ref:restock-card",JSON.stringify(card),"derived_interpretation")]}});
  const current=await readCurrent(), cardRef=find(current,"note-ref:restock-card").source_binding;
  const decision={manual_request_ref:returned.request.ref,manual_return_ref:returned.original.ref,disposition:"partly_used",result_refs:[cardRef],checks:"Independent subtraction: 17-5=12; 20-12=8",applicability:"Inventory-1 and target 20 only",reason:"Use counts on the card; decline order advice",uncertainty:"Physical stock unknown",unfinished:"Confirm shelf stock before ordering",next_action:"Print restock card; confirm shelf stock",reconsider_when:"Inventory revision or target changes"};
  await refused("return alone is not downstream use",()=>choice("assess",{assessment:{...decision,result_refs:[inputRef]}},true),"execution_choice_manual_downstream_work_required");
  await refused("decision request mismatch",()=>choice("assess",{assessment:{...decision,manual_return_ref:"sha256:"+"0".repeat(64)}},true),"execution_choice_manual_request_mismatch");
  const prepared=await choice("assess",{assessment:decision});
  const stale=await call(prepared.revision_tool,prepared.revision_arguments);
  await saveChanges({goal:"Prepare a printable restock card from selected inventory"});
  await refused("stale-save refusal",()=>raw("augnes_save_repository_work_revision",{...prepared.revision_arguments,previewBinding:stale.preview_binding}));
  await refused("changed definition requires reassessment",()=>choice("assess",{assessment:decision},true),"execution_choice_manual_reassessment_required");
  await savePrepared(await choice("assess",{assessment:{...decision,reassessment:"Printable wording changed; counts and target remain applicable; no order authority"}}));
  const feedback=await choice("feedback");
  assert(!JSON.stringify(feedback.delivery).includes("PRIVATE-HIDDEN-NOTE"));
  assert(!JSON.stringify(feedback.delivery).includes("/private/origin"));
  assert(!JSON.stringify(feedback.delivery).includes(root));
  await savePrepared(feedback);
  save("manual-feedback-relay",feedback.delivery);
  const final=await choice("read");
  assert.deepEqual(final.manual_contribution.feedback.delivery,feedback.delivery);
  assert.equal(final.manual_contribution.original.value.content,original.content);
  save("saved-cycle",final);
  // The eight-note bound is unchanged; a ninth addition cannot evict history.
  const now=await readCurrent();
  assert.equal(now.sources.length,8);
  await refused("selection overflow is atomic",()=>raw("augnes_preview_repository_work_revision",{repositoryRoot:root,expectedSnapshotBinding:now.snapshot,changes:{sources:{add:[note("note-ref:overflow","must not evict originals")]}}}));
  // Retain feedback; resolve deselected originals/decision by exact bounded lookup.
  await saveChanges({sources:{deselect:[final.manual_contribution.request.source_ref,final.manual_contribution.original.source_ref,final.manual_contribution.decision.source_ref]}});
  const historical=await choice("read");
  assert.equal(historical.manual_contribution.original.selection,"historical_not_selected");
  assert.equal(historical.manual_contribution.original.value.content,original.content);
  assert.deepEqual(historical.manual_contribution.feedback.delivery,feedback.delivery);
  const beforeChange=await readCurrent(),inputSource=beforeChange.sources.find((s:any)=>s.source_binding===inputRef);
  await saveChanges({sources:{replace:[{source_binding:inputRef,note:note("/private/origin/inventory.json",JSON.stringify({...inventory,reserved:6}))}]}});
  const changed=await choice("read");
  assert.equal(changed.manual_contribution.applicability,"request_basis_changed");
  assert.equal(changed.manual_contribution.decision_currentness,"reassessment_required");
  assert.equal(changed.manual_contribution.original.value.content,original.content);
  await refused("changed material cannot prepare current feedback",()=>choice("feedback",{},true),"execution_choice_manual_reassessment_required");
  // Deliberate ordinary revision restores the selected original, preserving both versions.
  const changedSource=(await readCurrent()).sources.find((s:any)=>s.excerpt_text===JSON.stringify({...inventory,reserved:6}));
  await saveChanges({sources:{replace:[{source_binding:changedSource.source_binding,note:note("/private/origin/inventory.json",inputSource.excerpt_text)}]}});
  assert.equal((await choice("read")).manual_contribution.decision_currentness,"saved_basis_retained");
  // Adapter seams cover corrupted/unavailable retained evidence and concurrent reads.
  const snapshot=(await call("augnes_resume_repository",{repositoryRoot:root})).continuity.snapshot.binding;
  const actual=await call("augnes_read_repository_work_sources",{repositoryRoot:root,expectedSnapshotBinding:snapshot,includeWorkDefinition:true});
  const args={action:"read",repositoryRoot:root,expectedSnapshotBinding:snapshot};
  const unavailable=await (prepareExecutionChoice as any)(args,{readSources:async()=>actual,review:async()=>({status:"available",connections:[]}),lookupRetained:async()=>({status:"unavailable"})});
  assert.equal(unavailable.reason,"execution_choice_manual_saved_material_unavailable"); checks.push("missing retained original refuses instead of inventing absence");
  save("producer-results",{checks,card,original_content_digest:digest(original.content),historical_view:historical,manual_request_relay:"local file written/read",manual_feedback_relay:"local file written",recipient_readback:"NOT_YET_OBSERVED",provider_observations:0});
}
void setupServer().then(produce).finally(finish);
