// A fresh process with normal persisted-material entry only. No fixture inputs,
// producer artifacts, expected answer or coordinator-derived state are imported.
import assert from "node:assert/strict";
import {mode,save,readCurrent,setupServer,finish,choice,lookup,find,jsonNote} from "./execution-choice-transition-harness";
const legacy=mode.startsWith("existing-");
async function consume() {
    // Only normal persisted entry is used. No producer artifacts or expected result are read.
    const c=await readCurrent(), view=await choice("read");
    const input=jsonNote(c,"note-ref:packing-input"),output=jsonNote(c,"note-ref:packing-output");
    let prior:any;
    if(legacy){
        const link=jsonNote(c,"note-ref:manual-arrangement-link");
        const cs=await lookup(link.choice_locator),as=await lookup(link.assessment_locator);
        const original=cs.lookup.results.find((r:any)=>r.note.source_binding===link.choice_ref);
        const assessment=as.lookup.results.find((r:any)=>r.note.source_binding===link.assessment_ref);
        assert.equal(JSON.parse(assessment.note.excerpt_text).choice_ref,original.note.source_binding);
        prior={choice:original,assessment,reason:link.reason};
    }else prior=view.previous;
    const labels=output.allocations.flatMap((b:any)=>b.trays.map((count:number,i:number)=>({label:`${b.batch}-${i+1}`,batch:b.batch,count})));
    for(const batch of input.batches) assert.equal(labels.filter((l:any)=>l.batch===batch.id).reduce((n:number,l:any)=>n+l.count,0),batch.count);
    assert(labels.every((l:any)=>l.count>0&&l.count<=input.capacity));
    const followup={labels,total_items:labels.reduce((n:number,l:any)=>n+l.count,0),tray_count:labels.length,current_arrangement:view.choice.judgment.chosen,prior_arrangement:JSON.parse(prior.choice.note.excerpt_text).judgment.chosen,transition_reason:prior.reason,source_refs:[find(c,"note-ref:packing-input").source_binding,find(c,"note-ref:packing-output").source_binding],response_refs:[output.original_response_ref,output.replacement_response_ref],next_check:output.next_check,dispatch_authorized:output.dispatch_authorized,physical_stock:output.physical_stock};
    assert.equal(followup.total_items,output.total_items);assert.equal(followup.tray_count,output.tray_count);
    save("fresh-followup",followup);save("fresh-entry",{current:c,view,prior});
}
void setupServer().then(consume).finally(finish);
