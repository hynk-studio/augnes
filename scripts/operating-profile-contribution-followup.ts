// A separate process. Input is only the registered fixture root and persisted DB.
// No producer artifact, profile file, expected output or in-memory object is read.
import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import path from 'node:path';
import { artifactDirectory, save, setupServer, finish, choice } from './execution-choice-transition-harness';
async function consume(){
 const view=await choice('read'),m=view.manual_contribution,p=m.operating_profile;
 assert(m.request&&m.original&&m.decision&&m.feedback&&p);
 const original=JSON.parse(m.original.value.content),result=JSON.parse(m.downstream[0].text);
 assert.equal(result.job,original.job);assert.equal(result.command,original.command);
 const content=`# Follow-up for ${result.job}\n\nSelected step: ${p.selected_step.id} — ${p.selected_step.purpose}\nManifest: ${result.command}, declared owner ${result.owner}.\nRetained explanations: ${p.profile.explanations.map((e:any)=>e.description).join('; ')}.\nNext check: ${m.decision.value.unfinished}.\nReconsider: ${m.feedback.delivery.next_check}.\nNo execution authorized.\n`;
 writeFileSync(path.join(artifactDirectory,'fresh-followup.md'),content);
 save('fresh-followup',{content,task_identity:m.task_identity,profile_fingerprint:p.fingerprint,step_id:p.selected_step.id,request:m.request.ref,original:m.original.ref,decision:m.decision.ref,source_selection:p.selection,execution_authorized:result.execution_authorized});
 save('fresh-read',view);
}
void setupServer().then(consume).finally(finish);
