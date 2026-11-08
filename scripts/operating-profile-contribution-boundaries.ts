import assert from 'node:assert/strict';
import { root, save, raw, call, readCurrent, saveChanges, savePrepared, setupServer, finish, choice, lookup, refused } from './execution-choice-transition-harness';
async function boundaries(){
 const before=await choice('read'),m=before.manual_contribution;
 await saveChanges({sources:{deselect:[m.feedback.source_ref]}});
 const refs=[];
 for(const [prefix,ref] of [['manual-contribution',m.request.ref],['manual-contribution',m.original.ref],['manual-contribution',m.decision.ref],['operating-profile',m.operating_profile.fingerprint]]){
  const found=await lookup(`note-ref:${prefix}:${ref.slice(7)}`);
  assert.equal(found.lookup.results.length,1);refs.push(found.lookup.results[0].source);
 }
 await saveChanges({sources:{retained_source_refs:refs}});
 const same=await choice('read');assert.equal(same.manual_contribution.decision_currentness,'saved_basis_retained');
 const c=await readCurrent();assert.equal(c.sources.length,8);
 const args={repositoryRoot:root,expectedSnapshotBinding:c.snapshot,changes:{...same.work,sources:{keep:c.sources.map((s:any)=>s.source_binding),omitted_sources:[]}}};
 const preview=await call('augnes_preview_repository_new_work',args);
 await call('augnes_prepare_repository_new_work',{...args,previewBinding:preview.preview_binding});
 const changed=await choice('read');assert.deepEqual(changed.work,same.work);
 assert.notEqual(changed.manual_contribution.task_identity,same.manual_contribution.task_identity);
 assert.equal(changed.manual_contribution.applicability,'request_task_changed');
 assert.equal(changed.manual_contribution.decision_currentness,'reassessment_required');
 assert.equal(changed.manual_contribution.operating_profile.fingerprint,m.operating_profile.fingerprint);
 assert.equal(changed.manual_contribution.original.value.content,m.original.value.content);
 await refused('identical-text different task cannot use prior feedback',()=>choice('feedback',{},true),'execution_choice_manual_reassessment_required');
 // Keep exact originals. Deliberate non-use is a supported fresh interpretation.
 await saveChanges({sources:{deselect:[changed.manual_contribution.decision.source_ref]}});
 const assessment={manual_request_ref:m.request.ref,manual_return_ref:m.original.ref,result_refs:m.decision.value.results.map((s:any)=>s.source_ref),disposition:'deferred',checks:'Re-read exact manifest and prior comparison',applicability:'Different task; pending identity check',reason:'Retain original; defer further use',uncertainty:'Actor still unknown',unfinished:'Verify actor identity and approval',next_action:'Wait for permitted evidence',reconsider_when:'New identity evidence'};
 await refused('new task requires deliberate reassessment',()=>choice('assess',{assessment},true),'execution_choice_manual_reassessment_required');
 await savePrepared(await choice('assess',{assessment:{...assessment,reassessment:'Explicit new task; defer after reviewing unchanged original context'}}));
 const decision=(await choice('read')).manual_contribution;
 await saveChanges({sources:{deselect:[decision.original.source_ref,decision.operating_profile.source_ref]}});
 const feedback=await choice('feedback');const held=await call(feedback.revision_tool,feedback.revision_arguments);
 await saveChanges({goal:'Wait for permitted identity evidence'});
 await refused('stale feedback save is atomic',()=>raw('augnes_save_repository_work_revision',{...feedback.revision_arguments,previewBinding:held.preview_binding}));
 await refused('changed decision basis prevents feedback',()=>choice('feedback',{},true),'execution_choice_manual_reassessment_required');
 const final=await choice('read');assert.equal(final.manual_contribution.original.value.content,m.original.value.content);
 const old=await lookup('note-ref:manual-contribution:'+m.decision.ref.slice(7));
 assert.deepEqual(JSON.parse(old.lookup.results[0].note.excerpt_text),m.decision.value);
 save('boundary-results',{same,changed,final,old_decision:old.lookup.results[0],different_task:true,explicit_deferral:true,original_preserved:true});
}
void setupServer().then(boundaries).finally(finish);
