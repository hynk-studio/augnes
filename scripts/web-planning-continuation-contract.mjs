// Development contract only; no judgment generation or attachment execution.
import assert from 'node:assert/strict';
import { readFile, lstat, realpath, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { canonical, hash } from '../apps/web_planning/src/contract.ts';
import { validateFileExport, digestBytes, FILE_EXPORT_REQUEST_BYTES, FILE_LIMIT } from '../apps/web_planning/src/files.ts';
import { fixtureScope } from './web-planning-local-runtime.mjs';
export { canonical, hash, digestBytes };
const refuse=code=>Object.assign(new Error(code),{code});
export function requireValue(condition,code){if(!condition)throw refuse(code);}
export async function readRegular(file,limit){const st=await lstat(file);requireValue(st.isFile()&&!st.isSymbolicLink()&&st.size<=limit,'input_regular_file_limit');const b=await readFile(file);requireValue(b.length<=limit,'input_file_limit');return b;}
export function validateIdentity(i){requireValue(i&&Object.keys(i).sort().join(',')==='bytes,digest,fingerprint,revision,work_id','expected_identity_fields');requireValue(Number.isSafeInteger(i.bytes)&&i.bytes>0&&i.bytes<=FILE_EXPORT_REQUEST_BYTES,'expected_bytes');requireValue(Number.isSafeInteger(i.revision)&&i.revision>0,'expected_revision');requireValue(/^[0-9a-f-]{36}$/.test(i.work_id)&&/^sha256:[0-9a-f]{64}$/.test(i.digest)&&/^sha256:[0-9a-f]{64}$/.test(i.fingerprint),'expected_identity');return i;}
export function admitInput(bytes,expected){validateIdentity(expected);requireValue(bytes.length===expected.bytes&&digestBytes(bytes)===expected.digest,'input_bytes_binding');const data=JSON.parse(bytes);const validated=validateFileExport(fixtureScope,data),current=validated.chain.at(-1);requireValue(current.work_id===expected.work_id&&current.revision===expected.revision&&current.fingerprint===expected.fingerprint,'input_head_binding');return {data,...validated,current};}
export async function bundlePaths(bundle,operation){requireValue(['read','save'].includes(operation),'operation');await mkdir(bundle,{recursive:true});const st=await lstat(bundle);requireValue(st.isDirectory()&&!st.isSymbolicLink()&&await realpath(bundle)===path.resolve(bundle),'bundle_not_regular');const output=path.join(bundle,operation);requireValue(!(await lstat(output).catch(e=>{if(e.code==='ENOENT')return null;throw e;})),'operation_output_exists');return {bundle,output,checkpoint:path.join(bundle,'checkpoint.json'),bundle_binding:hash(path.resolve(bundle))};}
export function checkpointMaterial(input,current,dom,chain){const {disclosures,...authenticated_dom}=dom;return {input,current,authenticated_dom,history:chain.map(r=>({revision:r.revision,fingerprint:r.fingerprint}))};}
export function validateCheckpoint(c,input,bundle_binding){requireValue(c?.format==='web_planning_development_checkpoint.v1'&&c.complete===true&&c.cleanup?.complete===true,'checkpoint_incomplete');requireValue(c.bundle_binding===bundle_binding,'checkpoint_bundle_mismatch');requireValue(canonical(c.material.input)===canonical(input),'checkpoint_input_mismatch');requireValue(c.binding_hash===hash(canonical(c.material)),'checkpoint_content_integrity');return c;}
export function validateAssessment(a,c){requireValue(a?.format==='web_planning_development_assessment.v1','assessment_format');requireValue(canonical(a.input)===canonical(c.material.input)&&a.checkpoint_hash===c.binding_hash&&a.bundle_id===c.bundle_id,'assessment_binding');requireValue(['reuse','non-use','insufficient-context'].includes(a.conclusion),'assessment_conclusion');requireValue(Array.isArray(a.reasons)&&a.reasons.length>0&&a.reasons.length<=8&&a.reasons.every(x=>typeof x==='string'&&x.length>0&&x.length<=2000),'assessment_reasons');requireValue(Array.isArray(a.recovered_refs)&&a.recovered_refs.every(ref=>c.material.current.sources.some(s=>s.source_ref===ref)),'assessment_unseen_reference');requireValue(Number.isFinite(Date.parse(a.authored_at))&&Date.parse(a.authored_at)>=Date.parse(c.observed_at),'assessment_authored_time');requireValue(a.attribution&&typeof a.attribution.author==='string'&&a.exposure_limits&&typeof a.exposure_limits.synthetic==='boolean','assessment_attribution');return a;}
export function requireCleanup(c){
  const r=c?.resources;
  requireValue(r&&['worker','browser','listener','cdp','operations'].every(k=>['not-created','observed-settled'].includes(r[k])),'fixture_cleanup_incomplete');
  const matches=(state,flags)=>flags.every(flag=>state==='not-created'?flag===null:flag===true);
  requireValue(matches(r.worker,[c.worker_disposed])&&matches(r.browser,[c.browser_exit_observed,c.browser_streams_closed])&&matches(r.listener,[c.debug_listener_closed])&&matches(r.cdp,[c.cdp_closed])&&c.owned_browser_records===0&&Array.isArray(c.failures)&&c.failures.length===0,'fixture_cleanup_incomplete');
}
export async function loadSpec(operation,file){const spec=JSON.parse(await readRegular(file,16384)),dir=path.dirname(path.resolve(file));requireValue(Object.keys(spec).sort().join(',')===(operation==='save'?'assessment_file,bundle,expected,input_export':'bundle,expected,input_export'),'spec_fields');for(const k of ['bundle','input_export',...(operation==='save'?['assessment_file']:[])]){requireValue(typeof spec[k]==='string'&&spec[k].length>0,'spec_path');spec[k]=path.resolve(dir,spec[k]);}validateIdentity(spec.expected);const bytes=await readRegular(spec.input_export,FILE_EXPORT_REQUEST_BYTES);const admitted=admitInput(bytes,spec.expected);return {spec,bytes,admitted};}

// Runs in the authenticated selected-context DOM. No expected values enter it.
export function extractContextDom(root){
  if(!root)return {present:false};
  const text=e=>e?.textContent??null;
  const dl=e=>e?Object.fromEntries([...e.querySelectorAll(':scope > dt')].map(k=>[text(k),text(k.nextElementSibling)])):{};
  const disclosures=[...root.querySelectorAll('details')].map(e=>{const summary=e.querySelector(':scope > summary'),was_open=e.open;
    const before_ref_visible=e.querySelector(':scope > code')?e.innerText.includes(e.querySelector(':scope > code').textContent):null;
    if(!e.open)summary?.click();return {summary:text(summary),was_open,open:e.open,before_ref_visible,after_ref_visible:e.querySelector(':scope > code')?e.innerText.includes(e.querySelector(':scope > code').textContent):null};});
  const article=root.querySelector(':scope > article.saved-context');if(!article)return {present:false,disclosures};
  const list=label=>{const h=[...article.querySelectorAll(':scope > h3')].find(e=>text(e)===label),n=h?.nextElementSibling;
    return n?.tagName==='UL'?[...n.children].map(text):n?.tagName==='P'&&text(n)==='None recorded.'?[]:null;};
  const details=[...article.querySelectorAll(':scope > details')],material=details.find(e=>text(e.querySelector(':scope > summary'))==='Material provenance and required context');
  return {present:true,revision:article.dataset.revision??null,fingerprint:article.dataset.fingerprint??null,
    definition:{goal:text(article.querySelector(':scope > h2')),success_criteria:list('Success criteria'),non_goals:list('Non-goals')},
    notes:[...article.querySelectorAll(':scope > .context-note')].map(e=>({heading:text(e.querySelector(':scope > h4')),summary:text(e.querySelector(':scope > .note-text')),source_ref:text(e.querySelector(':scope > details > code')),binding_node_count:e.querySelectorAll(':scope > details > code').length,attribution:dl(e.querySelector(':scope > dl'))})),
    dependencies:material?[...material.querySelectorAll(':scope > p')].slice(0,-1).map(text):[],
    files:[...article.querySelectorAll('section[aria-label="Saved files"] [data-file-url]')].map(e=>({name:e.dataset.fileName??null,digest:e.dataset.fileDigest??null,bytes:e.dataset.fileBytes??null,url:e.dataset.fileUrl??null,description:text(e.parentElement.querySelector(':scope > p'))})),
    identities:dl(details.find(e=>text(e.querySelector(':scope > summary'))==='Exact saved details')?.querySelector(':scope > dl')),disclosures};
}
export function contextFieldObservations(observed,current){
  const rows=[];
  const metric=v=>{if(v===undefined||v===null)return {present:false,bytes:null,sha256:null};const b=Buffer.from(typeof v==='string'?v:canonical(v));return {present:true,bytes:b.length,sha256:digestBytes(b)};};
  const add=(id,expected,actual,source_ref=null)=>{const a=metric(expected),b=metric(actual);rows.push({check_id:id,source_ref,expected:a,observed:b,match:a.present&&b.present&&a.bytes===b.bytes&&a.sha256===b.sha256});};
  add('context.present',true,observed.present);add('context.revision',String(current.revision),observed.revision);add('context.fingerprint',current.fingerprint,observed.fingerprint);
  for(const k of ['goal','success_criteria','non_goals'])add('definition.'+k,current.definition[k],observed.definition?.[k]);
  add('notes.count',current.sources.length,observed.notes?.length);
  current.sources.forEach((s,i)=>{const n=observed.notes?.[i];for(const [k,v] of Object.entries({heading:`${i+1}. ${s.why_included}`,summary:s.bounded_summary,source_ref:s.source_ref,binding_node_count:1}))add(`notes.${i}.${k}`,v,n?.[k],s.source_ref);
    for(const [k,v] of Object.entries({'Source / attribution':s.compatibility_source_ref?.external_id??'','Provenance':s.trust_class,'Observed':s.external_ref?.observed_at??'Unknown','Currentness':'Unknown — original source completeness, availability and currentness have not been verified.'}))add(`notes.${i}.attribution.${k}`,v,n?.attribution?.[k],s.source_ref);});
  const materials=current.relations?.materials??[];add('dependencies.count',materials.length,observed.dependencies?.length);
  materials.forEach((m,i)=>{const ref=m.from?` from Work ${m.from.work_id} · revision ${m.from.revision} · ${m.from.fingerprint}; material ${m.from.source_ref}`:' in this work';
    const text=`Note ${current.sources.findIndex(s=>s.source_ref===m.source_ref)+1}: ${m.kind}${ref}. Required notes: ${m.dependencies.map(d=>current.sources.findIndex(s=>s.source_ref===d)+1).join(', ')||'none explicitly linked'}.`;
    add(`dependencies.${i}`,text,observed.dependencies?.[i],m.source_ref);
    for(const d of m.dependencies)add(`dependencies.${i}.selected.${d}`,true,current.sources.some(s=>s.source_ref===d),m.source_ref);});
  add('files.count',current.files?.length??0,observed.files?.length);
  (current.files??[]).forEach((f,i)=>{const v={name:f.name,digest:f.digest,bytes:String(f.bytes),url:`/api/work/${current.work_id}/files/${current.revision}/${current.fingerprint.slice(7)}/${i}`,description:`${f.role} · ${f.bytes.toLocaleString('en-US')} bytes · ${f.digest}`};for(const [k,e] of Object.entries(v))add(`files.${i}.${k}`,e,observed.files?.[i]?.[k]);});
  for(const k of ['work_id','workspace_id','project_id','author_ref','fingerprint','predecessor','format','compatibility'])add('identity.'+k,String(current[k]??''),observed.identities?.[k]);
  return rows;
}
export function requireContextFields(rows){const bad=rows.find(r=>!r.match);if(bad)throw Object.assign(new Error('selected_context_field_mismatch'),{code:'CONTEXT_FIELD_MISMATCH',check_id:bad.check_id,source_ref:bad.source_ref});}
