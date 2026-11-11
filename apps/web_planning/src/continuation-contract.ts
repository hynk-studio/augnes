import { boundedText, exact, fail, FINGERPRINT, UUID } from './contract';

export const CONTINUATION_FORMAT = 'web_planning_revision.v0.10';
export const CONTINUATION_EXPORT = 'web_planning_export.v0.10';
export const CONTINUATION_COMPATIBILITY = 'web-planning/10';
// An attributed update, never a replacement author, execution receipt or grant.
export interface Continuation {
  grant_id:string; principal_ref:string; issuer_ref:string;
  authentication:'verified_ingress_email'|'local_fixture_email';
  obligation:string; report:string; next_action:string;
}
export function continuationRecord(value:unknown):Continuation {
  exact(value,'grant_id,principal_ref,issuer_ref,authentication,obligation,report,next_action');
  if(!UUID.test(value.grant_id)||!FINGERPRINT.test(value.principal_ref)||!FINGERPRINT.test(value.issuer_ref)||
    value.principal_ref===value.issuer_ref||!['verified_ingress_email','local_fixture_email'].includes(value.authentication))fail('invalid_continuation');
  for(const key of ['obligation','report','next_action'])if(boundedText(value[key],true)!==value[key])fail('invalid_continuation');
  return value as Continuation;
}
