import type { ReactNode } from "react";

const sliceName = "promotion_readiness_packet_review_hub_read_display_v0_1";
const readinessPacketRoute = "/perspective/promotion/readiness-packet";

const basisRefs = [
  "PR #856",
  "PR #857",
  "PR #858",
  "PR #859",
  "PR #860",
  "PR #861",
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

const availableSurfaces = [
  {
    label: "Promotion readiness packet read/display route",
    route: readinessPacketRoute,
    summary:
      "Static fixture-backed panel for orientation around readiness status, source/basis refs, blocking items, missing prerequisites, boundary summary, and non-authority next steps.",
  },
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

const nextNonAuthorityReviewSteps = [
  "Use the read/display readiness packet for operator orientation only.",
  "Continue with the next read/display usability slice if more orientation is needed.",
  "Pause for human spot review before any authority-increasing transition.",
] as const;

const cannotDoItems = [
  "This hub does not perform human review.",
  "This hub does not claim human signoff.",
  "This hub does not execute promotion.",
  "This hub does not write promotion decisions.",
  "This hub does not create proof/evidence.",
  "This hub does not product-write.",
  "The readiness packet link is navigation only, not approval or promotion.",
] as const;

const firstJudgmentItems = [
  [
    "What is this?",
    "Review preparation, not promotion approval. Human review still required.",
  ],
  [
    "What can I safely do here?",
    "This hub only links to read/display surfaces for operator orientation.",
  ],
  [
    "What can I not do here?",
    "No promotion decision is written here. No product-write or release happens here.",
  ],
  [
    "Why no approval button?",
    "No action controls are present because this surface is intentionally locked to read/display navigation.",
  ],
] as const;

export function PromotionReadinessPacketReviewHub() {
  return (
    <section
      aria-labelledby="promotion-review-hub-title"
      data-testid="promotion-readiness-review-hub"
      style={hubStyle}
    >
      <div style={headerStyle}>
        <p style={eyebrowStyle}>Read/display-only</p>
        <h2 id="promotion-review-hub-title" style={titleStyle}>
          Promotion readiness review hub
        </h2>
        <div aria-label="Promotion review hub boundary warnings" style={warningGridStyle}>
          <strong style={warningStyle}>Readiness is not promotion</strong>
          <strong style={warningStyle}>
            Validation pass is not truth/proof/approval/product readiness
          </strong>
          <strong style={warningStyle}>Browser validation is not human review</strong>
        </div>
      </div>

      <div aria-label="Promotion review hub first judgment summary" style={firstJudgmentGridStyle}>
        {firstJudgmentItems.map(([label, value]) => (
          <div key={label} style={firstJudgmentItemStyle}>
            <strong style={firstJudgmentLabelStyle}>{label}</strong>
            <span>{value}</span>
          </div>
        ))}
      </div>

      <div style={statusGridStyle} aria-label="Promotion review hub status flags">
        {authorityFlags.map(([label, value]) => (
          <div key={label} style={statusItemStyle}>
            <span style={statusLabelStyle}>{label}: </span>
            <code style={statusValueStyle}>{value}</code>
          </div>
        ))}
      </div>

      <div style={contentGridStyle}>
        <HubSection title="Available read/display surfaces">
          <p style={calloutTextStyle}>
            Review preparation, not promotion approval. This hub only links to
            read/display surfaces.
          </p>
          <p style={bodyTextStyle}>
            Existing readiness packet route: <code>{readinessPacketRoute}</code>
          </p>
          <a href={readinessPacketRoute} style={navigationLinkStyle}>
            Open read/display readiness packet
          </a>
          <DefinitionList
            items={availableSurfaces.map((surface) => [
              surface.label,
              `${surface.route} - ${surface.summary}`,
            ])}
          />
        </HubSection>

        <HubSection title="Basis refs">
          <p style={bodyTextStyle}>Basis refs: {basisRefs.join(", ")}</p>
        </HubSection>

        <HubSection title="Status flags">
          <DefinitionList items={authorityFlags.map(([label, value]) => [label, value])} />
        </HubSection>

        <HubSection title="Blocked authority actions">
          <p style={bodyTextStyle}>
            Short version: no promotion decision is written here, and no product-write
            or release happens here.
          </p>
          <SimpleList items={blockedAuthorityActions} />
        </HubSection>

        <HubSection title="Next non-authority review steps">
          <SimpleList items={nextNonAuthorityReviewSteps} />
        </HubSection>

        <HubSection title="What this hub cannot do">
          <SimpleList items={cannotDoItems} />
        </HubSection>
      </div>

      <footer style={footerStyle}>
        <strong>No action controls</strong>
        <span>
          This read/display-only hub provides static operator orientation and one internal
          navigation link to the existing readiness packet surface.
        </span>
        <span>Slice name: {sliceName}</span>
      </footer>
    </section>
  );
}

function HubSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section style={sectionStyle}>
      <h3 style={sectionTitleStyle}>{title}</h3>
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

function DefinitionList({ items }: { items: readonly (readonly [string, string])[] }) {
  return (
    <dl style={definitionGridStyle}>
      {items.map(([label, value]) => (
        <div key={label} style={definitionItemStyle}>
          <dt style={definitionLabelStyle}>{label}</dt>
          <dd style={definitionValueStyle}>{value}</dd>
        </div>
      ))}
    </dl>
  );
}

export const promotionReadinessPacketReviewHubMetadata = {
  slice_name: sliceName,
  route_added: "/perspective/promotion",
  linked_route: readinessPacketRoute,
  read_display_only: true,
  no_action_controls: true,
  human_signoff_completed: false,
  human_review_still_required: true,
} as const;

const hubStyle = {
  maxWidth: "1180px",
  margin: "0 auto",
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

const firstJudgmentGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
  gap: "1px",
  background: "#d9e0e8",
  borderBottom: "1px solid #d9e0e8",
} as const;

const firstJudgmentItemStyle = {
  display: "grid",
  gap: "6px",
  padding: "14px 16px",
  background: "#ffffff",
  color: "#263344",
  fontSize: "14px",
  lineHeight: 1.4,
} as const;

const firstJudgmentLabelStyle = {
  color: "#17212f",
  fontSize: "14px",
  lineHeight: 1.25,
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
  gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
  gap: "1px",
  background: "#d9e0e8",
} as const;

const sectionStyle = {
  padding: "20px",
  background: "#ffffff",
  minWidth: 0,
} as const;

const sectionTitleStyle = {
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

const calloutTextStyle = {
  margin: "0 0 12px",
  color: "#17212f",
  fontSize: "14px",
  fontWeight: 700,
  lineHeight: 1.45,
  overflowWrap: "anywhere",
} as const;

const navigationLinkStyle = {
  display: "inline-block",
  margin: "0 0 16px",
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

const definitionGridStyle = {
  display: "grid",
  gap: "10px",
  margin: 0,
} as const;

const definitionItemStyle = {
  padding: "12px",
  border: "1px solid #d9e0e8",
  borderRadius: "8px",
  background: "#f8fafc",
  minWidth: 0,
} as const;

const definitionLabelStyle = {
  margin: "0 0 4px",
  color: "#596879",
  fontSize: "12px",
  fontWeight: 700,
  overflowWrap: "anywhere",
} as const;

const definitionValueStyle = {
  margin: 0,
  color: "#17212f",
  fontSize: "13px",
  lineHeight: 1.45,
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
