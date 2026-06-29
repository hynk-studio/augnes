const sliceName = "promotion_readiness_review_hub_cockpit_entrypoint_v0_1";
const linkedRoute = "/perspective/promotion";
const downstreamReadinessPacketRoute = "/perspective/promotion/readiness-packet";

const basisRefs = [
  "PR #856",
  "PR #857",
  "PR #858",
  "PR #859",
  "PR #860",
  "PR #861",
  "PR #862",
] as const;

const authorityFlags = {
  human_signoff_completed: false,
  human_review_still_required: true,
  promotion_execution: false,
  promotion_decision_write: false,
  product_write: false,
  proof_or_evidence_creation: false,
  durable_state_apply: false,
  formation_receipt_write: false,
  accepted_evidence_ref_write: false,
  product_id_allocation: false,
} as const;

const blockedAuthorityActions = [
  "promotion execution",
  "promotion decision write",
  "promotion decision store usage/write",
  "promotion decision controls",
  "proof/evidence creation",
  "durable Perspective state apply",
  "Formation Receipt write",
  "product-write",
  "accepted evidence ref write",
  "product ID allocation",
  "GitHub actuation",
  "release execution",
  "live provider validation",
  "source fetching/retrieval expansion",
  "broad all-route audit instrumentation",
  "API write routes",
  "DB schema/migrations",
] as const;

export function PromotionReadinessReviewHubCockpitEntrypoint() {
  return (
    <section
      id="promotion-readiness-review-hub-cockpit-entrypoint"
      aria-labelledby="promotion-readiness-cockpit-entrypoint-title"
      data-testid="promotion-readiness-review-hub-cockpit-entrypoint"
      data-human-signoff-completed="false"
      data-human-review-still-required="true"
      style={entrypointStyle}
    >
      <div style={headerStyle}>
        <div>
          <p style={eyebrowStyle}>Secondary review prep</p>
          <h2 id="promotion-readiness-cockpit-entrypoint-title" style={titleStyle}>
            Promotion readiness review
          </h2>
          <p style={bodyTextStyle}>
            Promotion readiness is secondary review prep, not approval. Human
            review still required.
          </p>
        </div>
        <a href={linkedRoute} style={navigationLinkStyle}>
          Open read/display promotion review hub
        </a>
      </div>

      <div aria-label="Promotion readiness secondary boundary" style={statusRowStyle}>
        <span style={statusPillStyle}>Read/display-only</span>
        <span style={statusPillStyle}>Readiness is not promotion</span>
        <span style={statusPillStyle}>No action controls</span>
      </div>
    </section>
  );
}

export const promotionReadinessReviewHubCockpitEntrypointMetadata = {
  slice_name: sliceName,
  home_route: "/",
  linked_route: linkedRoute,
  downstream_readiness_packet_route: downstreamReadinessPacketRoute,
  basis_refs: basisRefs,
  blocked_authority_actions: blockedAuthorityActions,
  read_display_only: true,
  no_action_controls: true,
  ...authorityFlags,
} as const;

const entrypointStyle = {
  maxWidth: "100%",
  margin: "0",
  border: "1px solid #cfd6df",
  borderRadius: "8px",
  background: "#fbfcfe",
  boxShadow: "none",
  overflow: "hidden",
} as const;

const headerStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
  alignItems: "start",
  gap: "14px",
  padding: "16px",
  borderBottom: "1px solid #d9e0e8",
  background: "#f6f8fb",
} as const;

const eyebrowStyle = {
  margin: "0 0 8px",
  color: "#516171",
  fontSize: "13px",
  fontWeight: 700,
  letterSpacing: "0",
  textTransform: "uppercase",
} as const;

const titleStyle = {
  margin: "0 0 8px",
  color: "#17212f",
  fontSize: "20px",
  lineHeight: 1.18,
  letterSpacing: "0",
} as const;

const bodyTextStyle = {
  margin: "0",
  color: "#3e4c5c",
  fontSize: "14px",
  lineHeight: 1.45,
} as const;

const navigationLinkStyle = {
  justifySelf: "start",
  display: "inline-flex",
  alignItems: "center",
  minHeight: "38px",
  padding: "8px 12px",
  border: "1px solid #b8c4d0",
  borderRadius: "6px",
  background: "#ffffff",
  color: "#17212f",
  fontSize: "14px",
  fontWeight: 700,
  lineHeight: 1.2,
  textDecoration: "none",
} as const;

const statusRowStyle = {
  display: "flex",
  flexWrap: "wrap",
  gap: "8px",
  padding: "12px 16px",
} as const;

const statusPillStyle = {
  display: "inline-flex",
  alignItems: "center",
  padding: "6px 9px",
  border: "1px solid #d5dce4",
  borderRadius: "6px",
  background: "#ffffff",
  color: "#2d3b4a",
  fontSize: "13px",
  lineHeight: 1.3,
} as const;
