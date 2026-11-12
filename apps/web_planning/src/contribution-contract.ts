import { boundedText, canonical, exact, fail, FINGERPRINT, UUID, workRef, type WorkRef } from './contract';
import { fileManifest } from './files';
import { mediaType, type ExchangeFile } from './exchange';

export const CONTRIBUTION_FORMAT='web_planning_revision.v0.11';
export const CONTRIBUTION_EXPORT='web_planning_export.v0.11';
export const CONTRIBUTION_COMPATIBILITY='web-planning/11';
// Historical disclosure, never an operational grant or permission to read A.
export interface ContributionRequest {
  workspace_id:string; project_id:string; author_ref:string; grant_id:string;
  request:WorkRef; disclosure_fingerprint:string; brief:string; next_action:string;
  expires:number; files:{index:number;original:ExchangeFile}[];
}
export interface ContributionSource { project_id:string; author_ref:string; work:WorkRef; indices:number[] }
export function contributionIndices(value:unknown):number[] {
  if(!Array.isArray(value)||!value.length||value.length>8||new Set(value).size!==value.length||
    value.some(n=>!Number.isSafeInteger(n)||n<0||n>7))fail('invalid_contribution_selection');
  return value;
}
export function contributionSource(value:unknown):ContributionSource {
  exact(value,'project_id,author_ref,work,indices');
  if(!UUID.test(value.project_id)||!UUID.test(value.author_ref))fail('invalid_contribution_source');
  workRef(value.work);contributionIndices(value.indices);return value as ContributionSource;
}
export function contributionRequest(value:unknown):ContributionRequest {
  exact(value,'workspace_id,project_id,author_ref,grant_id,request,disclosure_fingerprint,brief,next_action,expires,files');
  for(const k of ['workspace_id','project_id','author_ref','grant_id'])if(!UUID.test(value[k]))fail('invalid_contribution_request');
  workRef(value.request);
  if(!FINGERPRINT.test(value.disclosure_fingerprint)||!Number.isSafeInteger(value.expires)||value.expires<1||
    boundedText(value.brief,true)!==value.brief||boundedText(value.next_action)!==value.next_action||!Array.isArray(value.files))fail('invalid_contribution_request');
  contributionIndices(value.files.map((f:any)=>f.index));
  for(const f of value.files){exact(f,'index,original');exact(f.original,'file,media_type');mediaType(f.original.media_type);}
  fileManifest(value.files.map((f:any)=>f.original.file));
  return value as ContributionRequest;
}
export function sameContributionFiles(value:ContributionRequest,files:unknown){
  if(canonical(value.files.map(f=>f.original.file))!==canonical(files))fail('contribution_file_mismatch');
}
