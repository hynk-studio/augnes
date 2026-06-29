import type { ReactNode } from "react";

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

export function PromotionReadinessReviewHubCockpitEntrypoint() {
  return (
    <section
      aria-labelledby="promotion-readiness-cockpit-entrypoint-title"
      data-testid="promotion-readiness-review-hub-cockpit-entrypoint"
      style={entrypointStyle}
    >
      <div style={headerStyle}>
        <p style={eyebrowStyle}>Read/display-only</p>
        <h2 id="promotion-readiness-cockpit-entrypoint-title" style={titleStyle}>
          Promotion readiness review
        </h2>
        <div aria-label="Promotion readiness cockpit entrypoint warnings" style={warningGridStyle}>
          <strong style={warningStyle}>Readiness is not promotion</strong>
          <strong style={warningStyle}>
            Validation pass is not truth/proof/approval/product readiness
          </strong>
          <strong style={warningStyle}>Browser validation is not human review</strong>
        </div>
      </div>

      <div style={statusGridStyle} aria-label="Promotion readiness cockpit entrypoint status flags">
        {authorityFlags.map(([label, value]) => (
          <div key={label} style={statusItemStyle}>
            <span style={statusLabelStyle}>{label}: </span>
            <code style={statusValueStyle}>{value}</code>
          </div>
        ))}
      </div>

      <div style={contentGridStyle}>
        <EntrypointBlock title="Promotion readiness review entrypoint">
          <p style={bodyTextStyle}>
            Static home/cockpit entrypoint for the promotion readiness review hub.
          </p>
          <p style={bodyTextStyle}>Basis refs: {basisRefs.join(", ")}</p>
        </EntrypointBlock>

        <EntrypointBlock title="Allowed read/display navigation">
          <p style={bodyTextStyle}>
            Linked route: <code>{linkedRoute}</code>
          </p>
          <p style={bodyTextStyle}>
            Downstream readiness packet route: <code>{downstreamReadinessPacketRoute}</code>
          </p>
          <a href={linkedRoute} style={navigationLinkStyle}>
            Open read/display promotion review hub
          </a>
        </EntrypointBlock>

        <EntrypointBlock title="Blocked authority actions">
          <SimpleList items={blockedAuthorityActions} />
        </EntrypointBlock>

        <EntrypointBlock title="What this entrypoint cannot do">
          <SimpleList items={cannotDoItems} />
        </EntrypointBlock>
      </div>

      <footer style={footerStyle}>
        <strong>No action controls</strong>
        <span>
          This entrypoint is static, read/display-only, and exposes one internal navigation
          link to the existing promotion readiness review hub.
        </span>
        <span>Slice name: {sliceName}</span>
      </footer>
    </section>
  );
}

function EntrypointBlock({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section style={blockStyle}>
      <h3 style={blockTitleStyle}>{title}</h3>
      {children}
    </section>
  );
}

function SimpleList({ items }: { items: readonly string[] }) {
  return (
    <ul style={listStyle}>
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

export const promotionReadinessReviewHubCockpitEntrypointMetadata = {
  slice_name: sliceName,
  home_route: "/",
  linked_route: linkedRoute,
  downstream_readiness_packet_route: downstreamReadinessPacketRoute,
  read_display_only: true,
  no_action_controls: true,
  human_signoff_completed: false,
  human_review_still_required: true,
} as const;

const entrypointStyle = {
  maxWidth: "1180px",
  margin: "0 auto 20px",
  border: "1px solid #cfd6df",
  borderRadius: "8px",
  background: "#ffffff",
  boxShadow: "0 12px 30px rgba(30, 42, 58, 0.08)",
  overflow: "hidden",
} as const;

const headerStyle = {
  padding: "24px",
  borderBottom: "1px solid #d9e0e8",
  background: "#eef4f8",
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
  margin: "0 0 16px",
  color: "#17212f",
  fontSize: "28px",
  lineHeight: 1.18,
  letterSpacing: "0",
} as const;

const warningGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
  gap: "10px",
} as const;

const warningStyle = {
  display: "block",
  padding: "12px",
  border: "1px solid #c6a15b",
  borderRadius: "8px",
  background: "#fff7e3",
  color: "#44320d",
  fontSize: "14px",
  lineHeight: 1.35,
} as const;

const statusGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
  gap: "1px",
  background: "#d9e0e8",
  borderBottom: "1px solid #d9e0e8",
} as const;

const statusItemStyle = {
  padding: "14px 16px",
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

const contentGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
  gap: "1px",
  background: "#d9e0e8",
} as const;

const blockStyle = {
  padding: "20px",
  background: "#ffffff",
  minWidth: 0,
} as const;

const blockTitleStyle = {
  margin: "0 0 12px",
  color: "#17212f",
  fontSize: "17px",
  lineHeight: 1.25,
  letterSpacing: "0",
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
  textDecoration: "underline",
  textUnderlineOffset: "3px",
} as const;

const listStyle = {
  margin: 0,
  paddingLeft: "18px",
  color: "#2d3b4a",
  fontSize: "14px",
  lineHeight: 1.55,
  overflowWrap: "anywhere",
} as const;

const footerStyle = {
  display: "grid",
  gap: "6px",
  padding: "18px 24px",
  borderTop: "1px solid #d9e0e8",
  background: "#f8fafc",
  color: "#2d3b4a",
  fontSize: "14px",
  lineHeight: 1.45,
} as const;
