import { canonicalBytes } from '../apps/web_planning/src/capacity.ts';
import { exportWork, headBinding, makeRevision, normalizePayload } from '../apps/web_planning/src/contract.ts';

// Entirely synthetic; contains no private research, source IDs or exports.
export const capacityDefinition={goal:'Determine whether a toy queue scheduling result survives a changed arrival pattern',success_criteria:['Keep the question, assumptions and competing explanations','Record numerical results and a discriminating next check'],non_goals:['No production rollout or general performance claim']};
export const essentialNotes=[
 'Question: does the toy queue policy still reduce waiting time after the arrival pattern changes? The comparison is conditional on the specified load and service rule.',
 'Assumptions: synthetic arrivals, one server, fixed service duration, no dropped jobs, equal compute budget, and exact enumeration of the finite fixture. The oracle knows the full fixture; it is not an online learner.',
 'Competing explanations: gains may come from the schedule rather than reuse, or from the chosen arrival pattern. Exact enumeration removes sampling error but not model misspecification. No claim about real queues follows.',
 'Baseline observation: mean wait is 3.0 fixture time units. Uncertainty: this is one constructed case. Next judgment: keep the conditions and compare both policies under a changed arrival pattern before expanding the claim.'
];
export function capacityNotes(scope,target=11_947){
 const notes=essentialNotes.map((text,i)=>({text,source:`Synthetic queue study / authored note ${i+1}`,label:i===0?'Open question':i===2?'Rejection reason':'Next check',provenance:'user_declaration',observed_at:'2026-09-20T12:00:00.000Z'}));
 // Explicitly redundant fixture detail lets a later author replace detail with
 // its aggregate while retaining every necessary condition above.
 let remaining=target-canonicalBytes(normalizePayload(scope,capacityDefinition,notes).sources);
 for(const [index,note] of notes.entries()){const room=2_000-[...note.text].length,add=Math.min(room,Math.ceil(remaining/(notes.length-index)));note.text+=(' Synthetic audit detail: same finite fixture; no additional condition.').repeat(32).slice(0,Math.max(0,add-1))+(add?'.':'');remaining-=add;}
 if(remaining!==0)throw Error('fixture_capacity');
 return notes;
}
export const subsequentObservation='New synthetic observation: under changed arrivals, mean waits are 2.5 for reuse and 2.0 for replanning, versus 3.0 baseline. The oracle uses the complete finite model. Test another load before preferring reuse.';
export function revisedCapacityNote(){return essentialNotes[3]+' '+subsequentObservation;}

// Component-ceiling arithmetic, not admission of hypothetical larger Web data.
export function capacityEnvelopeEstimates(scope){
 const minimal=normalizePayload(scope,{goal:'g',success_criteria:['c'],non_goals:[]},[]);
 minimal.relations={origin:null,materials:[],review:null};
 let prior;const chain=[];
 for(let i=0;i<32;i++){
   prior=makeRevision(scope,'11111111-1111-4111-8111-111111111111',headBinding(prior),'22222222-2222-4222-8222-'+String(i).padStart(12,'0'),minimal,'2026-09-20T00:00:00.000Z');chain.push(prior);
 }
 const envelope=canonicalBytes({workspace_id:scope.workspace_id,project_id:scope.project_id,export:exportWork(chain),confirm:'reconstruct-empty-store'});
 const components=canonicalBytes(minimal.definition)+canonicalBytes(minimal.sources)+canonicalBytes(minimal.relations);
 return [12_000,16_000,32_000].map(source_limit=>({source_limit,request_bytes_upper_bound:envelope+32*(12_000+source_limit+12_000-components),additional_source_bytes_per_history:32*(source_limit-12_000)}));
}
