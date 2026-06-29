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

const authorityFlags = [
  ["human_signoff_completed", "false"],
  ["human_review_still_required", "true"],
  ["promotion_execution", "false"],
  ["promotion_decision_write", "false"],
  ["product_write", "false"],
  ["proof_or_evidence_creation", "false"],
  ["durable_state_apply", "false"],
  ["formation_receipt_write", "false"],
  ["accepted_evidence_ref_write", "false"],
  ["product_id_allocation", "false"],
] as const;

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

const cannotDoItems = [
  "This entrypoint does not perform human review.",
  "This entrypoint does not claim human signoff.",
  "This entrypoint does not execute promotion.",
  "This entrypoint does not write promotion decisions.",
  "This entrypoint does not create proof/evidence.",
  "This entrypoint does not product-write.",
  "The /perspective/promotion link is navigation only, not approval, promotion, write, or release.",
] as const;

const clarityItems = [
  ["Human review prep", "Use this chain to prepare a human review, not to grant approval."],
  ["Read/display-only", "It shows the existing review surfaces without writing decisions."],
  ["Not promotion approval", "No promotion, product-write, release, or authority transition starts here."],
] as const;

export function PromotionReadinessReviewHubCockpitEntrypoint() {
  return (
    <section
      id="promotion-readiness-review-hub-cockpit-entrypoint"
      aria-labelledby="promotion-readiness-cockpit-entrypoint-title"
      data-testid="promotion-readiness-review-hub-cockpit-entrypoint"
      style={entrypointStyle}
    >
      <div style={headerStyle}>
        <div>
          <p style={eyebrowStyle}>Read/display-only review-prep lane</p>
          <h2 id="promotion-readiness-cockpit-entrypoint-title" style={titleStyle}>
            Promotion readiness review
          </h2>
          <p style={bodyTextStyle}>
            Secondary Perspective cockpit lane for reviewing existing promotion
            readiness surfaces. It keeps the hub discoverable without becoming
            the primary Augnes surface.
          </p>
        </div>
        <a href={linkedRoute} style={navigationLinkStyle}>
          Open read/display promotion review hub
        </a>
      </div>

      <div aria-label="Promotion readiness cockpit entrypoint boundary badges" style={badgeRailStyle}>
        <strong style={warningStyle}>Readiness is not promotion</strong>
        <strong style={warningStyle}>
          Validation pass is not truth/proof/approval/product readiness
        </strong>
        <strong style={warningStyle}>Browser validation is not human review</strong>
        {clarityItems.map(([label]) => (
          <strong key={label} style={clarityBadgeStyle}>
            {label}
          </strong>
        ))}
      </div>

      <div
        style={statusGridStyle}
        aria-label="Promotion readiness cockpit entrypoint status and boundary"
      >
        {authorityFlags.slice(0, 2).map(([label, value]) => (
          <span key={label} style={statusItemStyle}>
            <span style={statusLabelStyle}>{label}: </span>
            <code style={statusValueStyle}>{value}</code>
          </span>
        ))}
        <strong style={compactBoundaryStyle}>No action controls</strong>
        <span>
          Navigation-only route <code>{linkedRoute}</code>; packet route{" "}
          <code>{downstreamReadinessPacketRoute}</code>.
        </span>
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
  cannot_do_items: cannotDoItems,
  read_display_only: true,
  no_action_controls: true,
  human_signoff_completed: false,
  human_review_still_required: true,
} as const;

const entrypointStyle = {
  maxWidth: "100%",
  margin: "0 0 18px",
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

const badgeRailStyle = {
  display: "flex",
  flexWrap: "wrap",
  gap: "8px",
  padding: "12px 16px 0",
} as const;

const warningStyle = {
  display: "inline-flex",
  alignItems: "center",
  padding: "7px 9px",
  border: "1px solid #c6a15b",
  borderRadius: "6px",
  background: "#fff7e3",
  color: "#44320d",
  fontSize: "13px",
  lineHeight: 1.35,
} as const;

const clarityBadgeStyle = {
  display: "inline-flex",
  alignItems: "center",
  padding: "7px 9px",
  border: "1px solid #cfd6df",
  borderRadius: "6px",
  background: "#ffffff",
  color: "#17212f",
  fontSize: "13px",
  lineHeight: 1.35,
} as const;

const statusGridStyle = {
  display: "flex",
  flexWrap: "wrap",
  alignItems: "center",
  gap: "8px",
  padding: "12px 16px 14px",
  background: "transparent",
  color: "#2d3b4a",
  fontSize: "13px",
  lineHeight: 1.45,
} as const;

const statusItemStyle = {
  display: "inline-flex",
  gap: "4px",
  alignItems: "baseline",
  padding: "7px 9px",
  border: "1px solid #d9e0e8",
  borderRadius: "6px",
  background: "#f8fafc",
  minWidth: 0,
} as const;

const statusLabelStyle = {
  color: "#596879",
  fontSize: "13px",
  fontWeight: 700,
  overflowWrap: "anywhere",
} as const;

const statusValueStyle = {
  color: "#17212f",
  fontSize: "13px",
  fontWeight: 700,
  background: "transparent",
  overflowWrap: "anywhere",
} as const;

const compactBoundaryStyle = {
  padding: "7px 9px",
  border: "1px solid #cfd6df",
  borderRadius: "6px",
  background: "#ffffff",
  color: "#17212f",
  fontSize: "13px",
} as const;

const bodyTextStyle = {
  margin: "0 0 12px",
  color: "#2d3b4a",
  fontSize: "14px",
  lineHeight: 1.55,
  overflowWrap: "anywhere",
} as const;

const navigationLinkStyle = {
  display: "inline-block",
  margin: "0",
  color: "#0f5d7a",
  fontSize: "14px",
  fontWeight: 700,
  justifySelf: "start",
  textDecoration: "underline",
  textUnderlineOffset: "3px",
} as const;
