// Adapter controls over one real saved assessment captured by the existing
// integration fixture. Transport mutation is injected only at the read seam.
import assert from "node:assert/strict";
import { prepareExecutionChoice } from "../plugins/augnes-operator/mcp/execution-choice.mjs";
import { canonical, digest } from "../plugins/augnes-operator/mcp/review-connection.mjs";

export async function checkExecutionChoiceTransition({ root, snapshot, view, reassessment, connection }) {
  const prefix = "note-ref:execution-choice:";
  const clone = v => structuredClone(v);
  const current = { status: "available", snapshot_binding: snapshot, packet_fingerprint: view.packet,
    work_definition: view.work, sources: view.sources };
  const hits = view.sources.filter(s => s.source_locator?.startsWith(prefix)).map(note => ({
    note, selection: "currently_selected", source: { source_fingerprint: note.source_binding },
  }));
  const lookup = args => ({ status: "available", packet_fingerprint: current.packet_fingerprint,
    lookup: { truncated: false, results: hits.filter(h => h.note.source_locator === args.query) } });
  const reviewed = args => args.action === "connections" ? {status:"available",connections:[{connection_ref:connection}]}
    : args.action === "list" ? view.contribution : reassessment;
  const args = { action: "reconsider", repositoryRoot: root, expectedSnapshotBinding: snapshot,
    judgment: view.choice.judgment, reason: "Retain the suitable arrangement after its checked result" };
  const deps = { readSources: async () => clone(current), review: async a => clone(reviewed(a)), lookupRetained: async a => clone(lookup(a)) };
  const unchanged = canonical({ current, view, reassessment });
  const good = await prepareExecutionChoice(args, deps);
  assert.equal(good.status, "prepared", JSON.stringify(good));
  const sourceOps = good.revision_arguments.changes.sources;
  assert.equal(sourceOps.deselect.length,2); assert.equal(sourceOps.add.length,1);
  const checks = [];
  async function refused(label, input, overrides, reason) {
    const r = await prepareExecutionChoice(input, {...deps,...overrides});
    assert.equal(r.status,"refused",`${label}: ${JSON.stringify(r)}`);
    assert.equal(r.reason,reason,label); assert(!r.revision_arguments); checks.push(label);
  }
  await refused("unavailable eligible history",args,{lookupRetained:async()=>({status:"ineligible",reason:"work_revision_not_eligible"})},"execution_choice_previous_unavailable");
  await refused("bounded lookup truncation",args,{lookupRetained:async a=>{const r=clone(lookup(a));r.lookup.truncated=true;return r;}},"execution_choice_previous_unavailable");
  await refused("ambiguous exact locator",args,{lookupRetained:async a=>{const r=clone(lookup(a));r.lookup.results.push(clone(r.lookup.results[0]));return r;}},"execution_choice_previous_ambiguous");
  await refused("unavailable original project root direction basis",args,{review:async a=>a.action==="reassess"?{status:"refused",reason:"review_project_binding_changed"}:clone(reviewed(a))},"execution_choice_previous_basis_changed");
  await refused("changed source snapshot during original reassessment",args,{review:async a=>{const r=clone(reviewed(a));if(a.action==="reassess")r.current.snapshot_binding="sha256:"+"f".repeat(64);return r;}},"execution_choice_previous_basis_changed");
  const missingResult=clone(current);missingResult.sources=missingResult.sources.filter(s=>!view.followup.assessment.result_refs.includes(s.source_binding));
  await refused("omitted result requires explicit reselection",args,{readSources:async()=>missingResult},"execution_choice_material_missing");
  let reads=0;
  const raced=await prepareExecutionChoice(args,{...deps,readSources:async()=>++reads===1?clone(current):{status:"refresh_required",reason:"snapshot_changed"}});
  assert.equal(raced.status,"refresh_required");assert(!raced.revision_arguments);checks.push("write between preparation reads refuses");
  // A real ordinary writer owns source-binding construction. This controlled
  // projection tests saved-profile interpretation, not persistence correctness.
  function projectedNote(note) {
    return {source_binding:digest(note),source_locator:note.source,excerpt_text:note.text,trust_class:note.provenance,observed_at:note.observed_at};
  }
  const next = {...clone(current),sources:current.sources.filter(s=>!sourceOps.deselect.includes(s.source_binding)).concat(projectedNote(sourceOps.add[0]))};
  const readArgs={action:"read",repositoryRoot:root,expectedSnapshotBinding:snapshot};
  const nextDeps={...deps,readSources:async()=>clone(next)};
  const linked=await prepareExecutionChoice(readArgs,nextDeps);
  assert.equal(linked.status,"available",JSON.stringify(linked));
  assert.equal(linked.previous.unfinished,view.followup.assessment.unfinished);
  // Altering a hash-linked note without updating its locator is malformed.
  const malformed=clone(next);malformed.sources.at(-1).excerpt_text=malformed.sources.at(-1).excerpt_text.replace("Retain the suitable","Rewrite the suitable");
  await refused("malformed saved predecessor profile",readArgs,{readSources:async()=>malformed},"execution_choice_saved_material_unavailable");
  const unrelated=clone(next);
  const profile=JSON.parse(unrelated.sources.at(-1).excerpt_text);
  profile.previous.assessment_note=profile.previous.choice_note;
  unrelated.sources[unrelated.sources.length-1]=projectedNote({source:prefix+digest(profile).slice(7),text:canonical(profile),provenance:"derived_interpretation",observed_at:profile.cutoff});
  await refused("self-linked previous pair",readArgs,{readSources:async()=>unrelated},"execution_choice_saved_material_unavailable");
  const extra=clone(next);extra.sources.push(hits.find(h=>JSON.parse(h.note.excerpt_text).kind==="choice").note);
  await refused("two selected choices remain ambiguous",readArgs,{readSources:async()=>extra},"execution_choice_selection_ambiguous");
  const assessedNext=clone(next), nextChoice=assessedNext.sources.at(-1);
  const followup=clone(view.followup);followup.choice_ref=nextChoice.source_binding;
  assessedNext.sources.push(projectedNote({source:prefix+digest(followup).slice(7),text:canonical(followup),provenance:"derived_interpretation",observed_at:followup.cutoff}));
  await refused("one linked transition only",args,{readSources:async()=>assessedNext},"execution_choice_transition_limit");
  const wrongAssessment=clone(current), entry=wrongAssessment.sources.find(s=>s.source_locator?.startsWith(prefix)&&JSON.parse(s.excerpt_text).kind==="assessment");
  const wrong=JSON.parse(entry.excerpt_text);wrong.choice_ref="sha256:"+"f".repeat(64);
  Object.assign(entry,projectedNote({source:prefix+digest(wrong).slice(7),text:canonical(wrong),provenance:"derived_interpretation",observed_at:wrong.cutoff}));
  await refused("assessment linked to a different choice",readArgs,{readSources:async()=>wrongAssessment},"execution_choice_assessment_ambiguous");
  assert.equal(canonical({ current, view, reassessment }),unchanged);
  return {status:"PASS",checks,read_only:true};
}
