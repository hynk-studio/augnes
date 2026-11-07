import { boundedText, exact, fail, FINGERPRINT, UUID } from "./contract";

// Only new attributed returns or deliberately shared decisions use v0.8.
// Existing revision and export seals remain byte-for-byte unchanged.
export const PARTICIPATION_FORMAT = "web_planning_revision.v0.8";
export const PARTICIPATION_EXPORT = "web_planning_export.v0.8";
export const PARTICIPATION_COMPATIBILITY = "web-planning/8";
export interface Contributor {
  grant_id:string; principal_ref:string; authentication:"verified_ingress_email"|"local_fixture_email";
}
export interface ParticipantFeedback { explanation:string; next_action:string }
export function contributor(value:unknown):Contributor {
  exact(value,"grant_id,principal_ref,authentication");
  if(!UUID.test(value.grant_id)||!FINGERPRINT.test(value.principal_ref)||
    !["verified_ingress_email","local_fixture_email"].includes(value.authentication))fail("invalid_contributor");
  return value as Contributor;
}
export function participantFeedback(value:unknown):ParticipantFeedback {
  exact(value,"explanation,next_action");
  for(const key of ["explanation","next_action"])if(boundedText(value[key],true)!==value[key])fail("invalid_participant_feedback");
  return value as ParticipantFeedback;
}
