// Disposable producer. Expected values here are checks, never fresh-consumer inputs.
import assert from "node:assert/strict";
import {randomBytes} from "node:crypto";
import {mkdirSync,readFileSync,writeFileSync} from "node:fs";
import {applyCanonicalDatabaseMigrations} from "./canonical-database-migrations.mjs";
import {REVIEW_MARKER,digest} from "../plugins/augnes-operator/mcp/review-connection.mjs";
import {getOrCreateDefaultWorkspaceIdentityV01,getOrCreateCanonicalProjectForLocalRootV01,normalizeLocalProjectRootRefV01} from "../lib/vnext/persistence/project-identity-registry";
import { mode,directory,root,db,artifactDirectory,configPath,started,checks,save,raw,call,op,reviewer,readCurrent,saveChanges,savePrepared,note,replyArgs,refused,setupServer,finish,choice,lookup,find,setSaveFailure } from "./execution-choice-transition-harness";
let connections:any[];
const configure=()=>writeFileSync(configPath,JSON.stringify({version:REVIEW_MARKER,connections}),{mode:0o600});
const legacy = mode.startsWith("existing-");
const burden = { preparation: "small", waiting: "unknown", execution: "unknown", coordination: "small", integration: "small", switching: "small" };
function judgment(connection: string, present = "Direct", chosen = "Reviewer A") {
    return { present, alternatives: [
        { arrangement: present, benefit: "Retain checked work", burden, ...(present === "Reviewer A" ? {review_connection: connections[0].id} : {}) },
        { arrangement: chosen, benefit: "Check remaining packing rule", burden, review_connection: connection },
    ], recommended: chosen, chosen, expectation: "Checked count and separate-batch tray plan", uncertainty: "Physical stock unknown", horizon: new Date(Date.now()+3600000).toISOString(), reconsider_when: "Rule, stock or need changes" };
}
async function participation(connection: any, question: string) {
    const c = await readCurrent();
    const prepared = await choice("participate", {participation: {
        purpose: "Finish checked packing plan", question,
        success: "Count every item; obey separate-batch rule; leave stock unknown",
        checks: "Recompute from delivered rows; do not infer physical stock",
        dependency_order: "Read material, calculate, reply; origin checks then creates labels",
        material_refs: c.sources.filter((s: any) => ["note-ref:packing-input", "note-ref:packing-output"].includes(s.source_locator)).map((s: any) => s.source_binding),
        recheck: "Changed material or physical stock needs another check",
    }});
    assert.equal(prepared.request_arguments.connection_ref, connection.id);
    return call(prepared.request_tool, prepared.request_arguments);
}
async function produce() {
    applyCanonicalDatabaseMigrations(db); mkdirSync(root); mkdirSync(artifactDirectory);
    const workspace = getOrCreateDefaultWorkspaceIdentityV01(db);
    const project = getOrCreateCanonicalProjectForLocalRootV01(db, {workspace_id:workspace.workspace_id, local_root:normalizeLocalProjectRootRefV01(root,{base_path:directory}),display_name:"Synthetic packing"});
    const scope = {workspace_id:workspace.workspace_id,project_id:project.project.project_id};
    connections = ["A", "B"].map(label => ({ id:`review:${randomBytes(16).toString("hex")}`, project_key:digest({purpose:"codex-current-continuity-public-project-key.v0.1",...scope}),repository_root:root,destination:"disposable-local-fixture",reviewer_label:`Synthetic reviewer ${label}`,expires_at:new Date(Date.now()+3600000).toISOString(),secret:randomBytes(32).toString("base64url"),storage_key:randomBytes(32).toString("base64url"),callback_origins:[] }));
    configure(); const configBytes = readFileSync(configPath); const [a,b] = connections;
    await saveChanges({goal:"Make a checked tray plan and printable labels for separate sample batches",success_criteria:["Every item counted once, capacity respected, batches never mixed","Physical stock remains an explicit check before dispatch"],non_goals:["No physical observation, dispatch or external execution"]},true);
    await saveChanges({sources:{add:[note("note-ref:packing-input",{batches:[{id:"red",count:12},{id:"blue",count:6},{id:"green",count:5}],capacity:10,rule:"Never mix batches in a tray; a batch may be split",physical_stock:"unknown"})]}});
    await savePrepared(await choice("choose",{judgment:judgment(a.id)}));
    const first = await choice("read"), originalChoice = first.sources.find((s:any)=>s.source_locator?.startsWith("note-ref:execution-choice:"));
    const ar = await participation(a,"Check total items and required trays");
    const lateRequest = await participation(a,"Return any later check on the same original packing need");
    const aRead = await reviewer(a,"augnes_read_review_request",{request_ref:ar.request_ref});
    const lateRead = await reviewer(a,"augnes_read_review_request",{request_ref:lateRequest.request_ref});
    const input = JSON.parse(aRead.sources.find((s:any)=>s.source_locator==="note-ref:packing-input").excerpt_text);
    const aAnswer = {total_items:input.batches.reduce((n:number,b:any)=>n+b.count,0),unresolved:"Does separate-batch packing need more than the pooled tray count?",physical_stock:"unknown"};
    assert.equal((await reviewer(a,"augnes_reply_to_review",replyArgs(aRead,aAnswer))).status,"saved");
    const aBack = await op({action:"readback",connection_ref:a.id,request_ref:ar.request_ref});
    const receivedA = JSON.parse(aBack.response.answer);
    assert.equal(receivedA.total_items,23); // Independent oracle stays in the producer/checker, never consumer input.
    const partial = {total_items:receivedA.total_items,pooled_lower_bound:Math.ceil(receivedA.total_items/input.capacity),unresolved:receivedA.unresolved,physical_stock:"unknown",response_ref:aBack.response_ref};
    save("original-contribution",aBack); save("checked-partial-output",partial);
    const aUse = await op({action:"prepare_use",connection_ref:a.id,request_ref:ar.request_ref,choice:"retain",reasoning:"Use checked total only. Tray rule/count is unfinished; physical stock remains unknown."});
    aUse.revision_arguments.changes.sources.add.push(note("note-ref:packing-output",partial));
    await savePrepared(aUse);
    let current=await readCurrent();
    const originalPartial=structuredClone(find(current,"note-ref:packing-output"));
    await savePrepared(await choice("assess",{assessment:{disposition:"partly_used",result_refs:[find(current,"note-ref:packing-output").source_binding],request_ref:ar.request_ref,compared_with_expectation:"Count checked; packing interpretation still unresolved",decision:"continue",next_action:"Retain valid count; determine separate-batch trays",reconsider_when:"Available reviewer can settle the packing rule",unfinished:"Resolve separate-batch tray count; physical stock unknown"}}));
    const assessed = await choice("read");
    const oldAssessment = assessed.sources.find((s:any)=>s.source_locator?.startsWith("note-ref:execution-choice:") && JSON.parse(s.excerpt_text).kind==="assessment");
    save("original-arrangement",{choice:originalChoice,assessment:oldAssessment,view:assessed});
    const unchanged = await choice("read"); assert.equal(unchanged.followup.assessment.decision,"continue");
    assert.equal((await choice("choose",{judgment:judgment(b.id,"Reviewer A","Reviewer B")},true)).reason,"execution_choice_already_selected");
    const reason="A's count is valid; the packing question remains. B is configured for this bounded check; direct work and the existing rule remain alternatives.";
    if (legacy) {
        // Existing public composition, intentionally no product adapter change.
        const aUseNote=assessed.sources.find((s:any)=>s.excerpt_text===aUse.revision_arguments.changes.sources.add[1].text);
        await saveChanges({sources:{deselect:[originalChoice.source_binding,oldAssessment.source_binding,aUseNote.source_binding]}});
        const priorChoice = await lookup(originalChoice.source_locator), priorAssessment = await lookup(oldAssessment.source_locator);
        assert.equal(priorChoice.lookup.results.find((x:any)=>x.note.source_binding===originalChoice.source_binding).selection,"historical_not_selected");
        assert.equal(priorAssessment.lookup.results.find((x:any)=>x.note.source_binding===oldAssessment.source_binding).note.excerpt_text,oldAssessment.excerpt_text);
        const next=await choice("choose",{judgment:judgment(b.id,"Reviewer A","Reviewer B")});
        next.revision_arguments.changes.sources.add.push(note("note-ref:manual-arrangement-link",{choice_locator:originalChoice.source_locator,assessment_locator:oldAssessment.source_locator,choice_ref:originalChoice.source_binding,assessment_ref:oldAssessment.source_binding,reason,unfinished:assessed.followup.assessment.unfinished},"derived_interpretation"));
        await savePrepared(next);
        const composed=await choice("read");
        assert.equal(composed.followup,null); assert.equal(composed.contribution.requests.length,0); assert(!composed.previous);
        save("existing-path-finding",{old_choice_recovered:priorChoice,old_assessment_recovered:priorAssessment,view_after_manual_transition:composed,manual_work:["Explicitly deselect original pair and one use note for the eight-note budget","Lookup each original by its retained locator","Author and validate the link/reason/unfinished text manually","Choose replacement and preview/save the authored continuity note"],adapter_previous_link:false});
    } else {
        // Retaining the arrangement and direct work are real preparation alternatives.
        const retainedJudgment = judgment(b.id,"Reviewer A","Reviewer B");
        retainedJudgment.chosen = "Reviewer A";
        assert.equal((await choice("reconsider",{judgment:retainedJudgment,reason:"A remains suitable; retain the arrangement"})).status,"prepared");
        const direct = judgment(b.id,"Direct","Reviewer B"); direct.chosen = "Direct";
        const directPrepared=await choice("reconsider",{judgment:direct,reason:"Finish directly with retained input and result"});
        assert.equal(directPrepared.status,"prepared");
        const directPreview=await call(directPrepared.revision_tool,directPrepared.revision_arguments);
        const prepared=await choice("reconsider",{judgment:judgment(b.id,"Reviewer A","Reviewer B"),reason});
        assert.deepEqual(prepared.revision_arguments.changes.sources.deselect,[originalChoice.source_binding,oldAssessment.source_binding]);
        const preview=await call(prepared.revision_tool,prepared.revision_arguments);
        setSaveFailure(true);
        try { await refused("failed transition save is atomic",()=>raw("augnes_save_repository_work_revision",{...prepared.revision_arguments,previewBinding:preview.preview_binding})); }
        finally { setSaveFailure(false); }
        await savePrepared(prepared);
        await refused("stale transition preview cannot write",()=>raw("augnes_save_repository_work_revision",{...directPrepared.revision_arguments,previewBinding:directPreview.preview_binding}));
        const linked=await choice("read");
        assert.equal(linked.previous.choice.note.excerpt_text,originalChoice.excerpt_text);
        assert.equal(linked.previous.assessment.note.excerpt_text,oldAssessment.excerpt_text);
        assert.equal(linked.previous.choice.selection,"historical_not_selected");
        assert.equal(linked.previous.unfinished,assessed.followup.assessment.unfinished);
        assert.equal(linked.previous.result_material.status,"selected");
        assert(!linked.sources.some((s:any)=>s.source_locator==="note-ref:manual-arrangement-link"));
        save("linked-transition",{prepared,preview,readback:linked});
    }
    const br=await participation(b,"Resolve the remaining separate-batch tray count using checked total and original rule");
    const bRead=await reviewer(b,"augnes_read_review_request",{request_ref:br.request_ref});
    if(!legacy) assert(bRead.question.includes("Unfinished: Resolve separate-batch tray count; physical stock unknown"));
    const bInput=JSON.parse(bRead.sources.find((s:any)=>s.source_locator==="note-ref:packing-input").excerpt_text);
    const bPartial=JSON.parse(bRead.sources.find((s:any)=>s.source_locator==="note-ref:packing-output").excerpt_text);
    assert.equal(bPartial.total_items,bInput.batches.reduce((n:number,b:any)=>n+b.count,0));
    const allocations=bInput.batches.map((batch:any)=>{let n=batch.count;const trays=[];while(n>0){const count=Math.min(n,bInput.capacity);trays.push(count);n-=count;}return {batch:batch.id,trays};});
    const bAnswer={total_items:bPartial.total_items,allocations,tray_count:allocations.reduce((n:number,b:any)=>n+b.trays.length,0),suggestion:"Dispatch immediately"};
    save("replacement-delivery",bRead);
    // A's pending response belongs to the old choice/request even after replacement.
    const lateArgs={...replyArgs(lateRead,{total_items:aAnswer.total_items,unfinished:aAnswer.unresolved}),receipt_mode:"historical_v1"};
    assert.equal((await reviewer(a,"augnes_reply_to_review",lateArgs)).status,"saved");
    await refused("earlier reviewer cannot answer replacement request",()=>reviewer(a,"augnes_reply_to_review",{...lateArgs,request_ref:br.request_ref}),"review_access_refused");
    const lateBack=await op({action:"readback",connection_ref:a.id,request_ref:lateRequest.request_ref});
    const reassessment=await op({action:"reassess",connection_ref:a.id,request_ref:lateRequest.request_ref});
    const lateUse=await op({action:"prepare_reassessed_use",connection_ref:a.id,request_ref:lateRequest.request_ref,expected_response_ref:reassessment.response_ref,expected_reassessment_binding:reassessment.reassessment_binding,choice:"defer",reasoning:"Retain A's original-basis total; this late answer does not settle B's request or physical stock."});
    save("late-original-response",{lateBack,reassessment,prepared_not_saved:lateUse});
    assert.equal((await choice("read")).contribution.requests.find((r:any)=>r.request_ref===br.request_ref).response_ref,null);
    assert.equal((await reviewer(b,"augnes_reply_to_review",replyArgs(bRead,bAnswer))).status,"saved");
    const bBack=await op({action:"readback",connection_ref:b.id,request_ref:br.request_ref});
    const accepted=JSON.parse(bBack.response.answer); assert.equal(accepted.tray_count,4);
    assert.deepEqual(accepted.allocations,[{batch:"red",trays:[10,2]},{batch:"blue",trays:[6]},{batch:"green",trays:[5]}]);
    const final={total_items:bPartial.total_items,tray_count:accepted.tray_count,allocations:accepted.allocations,capacity:bInput.capacity,original_response_ref:aBack.response_ref,replacement_response_ref:bBack.response_ref,resolved:bPartial.unresolved,physical_stock:"unknown",next_check:"Confirm physical tray stock before dispatch",dispatch_authorized:false,non_use:accepted.suggestion};
    const bUse=await op({action:"prepare_use",connection_ref:b.id,request_ref:br.request_ref,choice:"revise",reasoning:"Use independently checked separate-batch allocation. Retain A's count; reject dispatch advice because physical stock is unknown."});
    current=await readCurrent(); bUse.revision_arguments.changes.sources.replace=[{source_binding:find(current,"note-ref:packing-output").source_binding,note:note("note-ref:packing-output",final)}];
    await savePrepared(bUse); save("replacement-contribution",bBack); save("checked-output",final);
    current=await readCurrent();
    const evaluation={disposition:"partly_used",result_refs:[find(current,"note-ref:packing-output").source_binding],request_ref:br.request_ref,compared_with_expectation:"Allocation checked against rows/rule; original count retained; dispatch advice rejected",decision:"end_role",next_action:"Print labels; check physical stock before any dispatch",reconsider_when:"Rule, batch counts or stock change",unfinished:"Physical tray stock remains unknown"};
    await refused("old request cannot assess replacement",()=>choice("assess",{assessment:{...evaluation,request_ref:lateRequest.request_ref}},true),"execution_choice_request_mismatch");
    await savePrepared(await choice("assess",{assessment:evaluation}));
    const oldC=await lookup(originalChoice.source_locator),oldA=await lookup(oldAssessment.source_locator);
    assert.equal(oldC.lookup.results.find((x:any)=>x.note.source_binding===originalChoice.source_binding).note.excerpt_text,originalChoice.excerpt_text);
    assert.equal(oldA.lookup.results.find((x:any)=>x.note.source_binding===oldAssessment.source_binding).note.excerpt_text,oldAssessment.excerpt_text);
    const oldOutput=await lookup(originalPartial.source_locator);
    const retainedPartial=oldOutput.lookup.results.find((x:any)=>x.note.source_binding===originalPartial.source_binding);
    assert.equal(retainedPartial.selection,"historical_not_selected");
    assert.deepEqual(retainedPartial.note,originalPartial);
    assert(Buffer.from(retainedPartial.note.excerpt_text,"utf8").equals(Buffer.from(originalPartial.excerpt_text,"utf8")));
    save("post-final-partial-output",{original:originalPartial,retained_lookup:oldOutput,complete_note_equal:true,excerpt_bytes_equal:true});
    assert(configBytes.equals(readFileSync(configPath)),"logical replacement/closure cannot revoke credentials");
    save("producer-results",{checks,final_view:await choice("read"),original_choice:oldC,original_assessment:oldA,credential_bytes_preserved:true,elapsed_ms:Date.now()-started});
}
void setupServer().then(produce).finally(finish);
