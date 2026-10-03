import type { StatelessFailureReview } from "@/lib/vnext/stateless-review-failure";

const reasons: Record<string, string> = {
  one_judgment_required: "The response did not contain exactly one supported judgment.",
  choice_not_allowed: "The proposed action is not available at this stage.",
  rationale_bound_exceeded: "The public rationale exceeded the 1,200-byte host limit.",
  rationale_empty: "The public rationale was empty.",
  source_anchor_missing: "The judgment did not cite the required source binding.",
  observation_unavailable: "The judgment claimed to use an observation that was unavailable.",
  result_persistence_failed: "The returned judgment could not be committed as a step result.",
  receipt_persistence_failed: "The saved steps could not be projected to a completed work receipt.",
  generation_fenced: "A response arrived for a controller that no longer owns this step.",
  work_ended: "A response arrived after further work was ended locally.",
};
/** Shared with the ordinary saved-review panel. Public model text is escaped
 * text, never HTML, instructions, accepted state or permission to retry. */
export function StatelessReviewFailure({ review }: { review: StatelessFailureReview }) {
  if (review.availability === "unavailable") return <div data-stateless-failure="unavailable">
    <p>Detailed rejection evidence is unavailable ({review.reason}). No missing public judgment or exact predicate has been reconstructed.</p>
  </div>;
  const e = review.evidence, p = e.public_result;
  return <div data-stateless-failure={e.layer} style={{ overflowWrap: "anywhere" }}>
    <p>{reasons[e.code] ?? "The invocation stopped before its result could be accepted by this profile."} Stage: {e.stage}; layer: {e.layer}; reason: {e.code}.</p>
    <p>This evidence is non-authoritative. It does not establish successful work, provider settlement or permission to retry.</p>
    {p.availability === "complete" ? <details><summary>Returned public judgment (not accepted)</summary>
      {p.recommendations!.map((r, i) => <div key={i}>
        <p>{r.title} — {r.tool_name ?? "no action specified"}; priority: {r.priority}</p>
        <p style={{ whiteSpace: "pre-wrap" }}>{r.rationale}</p>
        <p>Reported source anchors: {r.grounded_state_keys.join(", ") || "none"}</p>
      </div>)}
    </details> : <p>{p.availability === "omitted_bound"
      ? `Complete public content was not retained: ${p.bytes} bytes / ${p.recommendation_count} recommendations exceeded the storage bound. No shortened version is presented.`
      : "Normalized public content is unavailable. The invocation receipt alone does not reveal the judgment."}</p>}
    <details><summary>Validation and source attribution</summary>
      <pre style={{ whiteSpace: "pre-wrap" }}>{JSON.stringify({ host_rejection_code: e.host_rejection_code, validation: e.validation, binding: e.binding,
        public_content: p.availability === "unavailable" ? p : { availability: p.availability, bytes: p.bytes, fingerprint: p.fingerprint }, evidence_fingerprint: e.fingerprint }, null, 2)}</pre>
    </details>
  </div>;
}
