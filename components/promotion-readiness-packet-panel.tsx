import type { ReactNode } from "react";

const sliceName = "promotion_readiness_packet_ui_read_display_binding_v0_1";

const readinessPacket = {
  readiness_packet_id: "promotion-readiness-packet:symbolic-ui-preview",
  review_memory_record_ref: "review-memory:symbolic-final-answer-candidate",
  candidate_ref: "final-rag-answer-candidate:symbolic-review-target",
  readiness_status: "needs_human_review_before_authority_transition",
  blocking_items: [
    "human spot review remains required",
    "promotion decision is not authorized",
    "product-write is not authorized",
  ],
  missing_prerequisites: [
    "human review signoff",
    "separate promotion decision authority",
    "separate proof/evidence authority",
    "separate product-write authority",
  ],
  evidence_summary_public_safe:
    "Public-safe summary only: Review Memory and readiness checks can guide later review, but they are not proof, evidence, approval, truth, product readiness, or promotion authority.",
  boundary_summary:
    "Read/display-only UI. No promotion execution, promotion decision write, proof/evidence creation, durable state apply, Formation Receipt write, product-write, accepted evidence ref write, product ID allocation, provider call, source fetch, retrieval expansion, GitHub actuation, or release execution.",
  next_allowed_non_authority_actions: [
    "browser/static smoke validation of this read/display UI",
    "narrow usability follow-up for readability only",
    "human spot review of assisted/manual QA artifacts",
  ],
  blocked_authority_actions: [
    "promotion execution",
    "promotion decision write",
    "product-write",
    "proof/evidence creation",
    "durable Perspective state apply",
    "Formation Receipt write",
    "accepted evidence ref write",
    "product ID allocation",
    "GitHub actuation",
    "release execution",
  ],
} as const;

const sourceBasisRefs = [
  "PR #856 operator_path_backend_safety_validation_bundle_v0_1",
  "PR #857 operator_path_human_review_packet_v0_1",
  "PR #858 operator_path_backend_remaining_gap_inventory_v0_1",
  "PR #859 operator_path_public_safe_artifact_index_v0_1",
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

const displayedSections = [
  "readiness summary",
  "source/basis refs",
  "blocking items",
  "missing prerequisites",
  "public-safe evidence summary",
  "boundary summary",
  "next allowed non-authority actions",
  "blocked authority actions",
] as const;

export function PromotionReadinessPacketPanel() {
  return (
    <section aria-labelledby="promotion-readiness-packet-title" style={panelStyle}>
      <div style={headerStyle}>
        <p style={eyebrowStyle}>Promotion readiness packet read/display</p>
        <h2 id="promotion-readiness-packet-title" style={titleStyle}>
          Promotion Readiness Packet Read/Display Binding
        </h2>
        <div style={warningGridStyle} aria-label="Read/display authority warnings">
          <strong style={warningStyle}>Readiness is not promotion</strong>
          <strong style={warningStyle}>
            Validation pass is not truth/proof/approval/product readiness
          </strong>
        </div>
      </div>

      <div style={statusGridStyle} aria-label="Read/display status flags">
        {authorityFlags.map(([label, value]) => (
          <div key={label} style={statusItemStyle}>
            <span style={statusLabelStyle}>{label}</span>
            <code style={statusValueStyle}>{value}</code>
          </div>
        ))}
      </div>

      <div style={contentGridStyle}>
        <ReadinessSection title="Readiness summary">
          <dl style={definitionGridStyle}>
            <Definition label="readiness_packet_id" value={readinessPacket.readiness_packet_id} />
            <Definition
              label="review_memory_record_ref"
              value={readinessPacket.review_memory_record_ref}
            />
            <Definition label="candidate_ref" value={readinessPacket.candidate_ref} />
            <Definition label="readiness_status" value={readinessPacket.readiness_status} />
          </dl>
        </ReadinessSection>

        <ReadinessSection title="Source/basis refs">
          <SimpleList items={sourceBasisRefs} />
        </ReadinessSection>

        <ReadinessSection title="Blocking items">
          <SimpleList items={readinessPacket.blocking_items} />
        </ReadinessSection>

        <ReadinessSection title="Missing prerequisites">
          <SimpleList items={readinessPacket.missing_prerequisites} />
        </ReadinessSection>

        <ReadinessSection title="Public-safe evidence summary">
          <p style={bodyTextStyle}>{readinessPacket.evidence_summary_public_safe}</p>
        </ReadinessSection>

        <ReadinessSection title="Boundary summary">
          <p style={bodyTextStyle}>{readinessPacket.boundary_summary}</p>
        </ReadinessSection>

        <ReadinessSection title="Next allowed non-authority actions">
          <SimpleList items={readinessPacket.next_allowed_non_authority_actions} />
        </ReadinessSection>

        <ReadinessSection title="Blocked authority actions">
          <SimpleList items={readinessPacket.blocked_authority_actions} />
        </ReadinessSection>
      </div>

      <footer style={footerStyle}>
        <strong>No action controls</strong>
        <span>
          This panel is read/display-only and renders static public-safe preview data for
          later inspection.
        </span>
        <span>Displayed sections: {displayedSections.join(", ")}.</span>
      </footer>
    </section>
  );
}

function ReadinessSection({
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

function Definition({ label, value }: { label: string; value: string }) {
  return (
    <div style={definitionItemStyle}>
      <dt style={definitionLabelStyle}>{label}</dt>
      <dd style={definitionValueStyle}>{value}</dd>
    </div>
  );
}

export const promotionReadinessPacketPanelMetadata = {
  slice_name: sliceName,
  read_display_only: true,
  no_action_controls: true,
  human_signoff_completed: false,
  human_review_still_required: true,
} as const;

const panelStyle = {
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
  color: "#4d3712",
  fontSize: "14px",
  lineHeight: 1.35,
} as const;

const statusGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
  gap: "1px",
  background: "#d9e0e8",
  borderBottom: "1px solid #d9e0e8",
} as const;

const statusItemStyle = {
  minHeight: "82px",
  padding: "14px",
  background: "#f8fafc",
} as const;

const statusLabelStyle = {
  display: "block",
  marginBottom: "8px",
  color: "#526073",
  fontSize: "12px",
  fontWeight: 700,
  lineHeight: 1.3,
  overflowWrap: "anywhere",
} as const;

const statusValueStyle = {
  display: "inline-block",
  padding: "4px 7px",
  borderRadius: "6px",
  background: "#e8edf2",
  color: "#16202d",
  fontSize: "13px",
} as const;

const contentGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
  gap: "16px",
  padding: "20px",
} as const;

const sectionStyle = {
  minHeight: "180px",
  padding: "16px",
  border: "1px solid #d9e0e8",
  borderRadius: "8px",
  background: "#ffffff",
} as const;

const sectionTitleStyle = {
  margin: "0 0 12px",
  color: "#17212f",
  fontSize: "17px",
  lineHeight: 1.25,
  letterSpacing: "0",
} as const;

const definitionGridStyle = {
  display: "grid",
  gap: "10px",
  margin: 0,
} as const;

const definitionItemStyle = {
  display: "grid",
  gap: "4px",
} as const;

const definitionLabelStyle = {
  color: "#526073",
  fontSize: "12px",
  fontWeight: 700,
  overflowWrap: "anywhere",
} as const;

const definitionValueStyle = {
  margin: 0,
  color: "#17212f",
  fontFamily:
    "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, Courier New, monospace",
  fontSize: "13px",
  lineHeight: 1.4,
  overflowWrap: "anywhere",
} as const;

const listStyle = {
  display: "grid",
  gap: "8px",
  margin: 0,
  paddingLeft: "18px",
  color: "#263344",
  fontSize: "14px",
  lineHeight: 1.45,
} as const;

const bodyTextStyle = {
  margin: 0,
  color: "#263344",
  fontSize: "14px",
  lineHeight: 1.5,
} as const;

const footerStyle = {
  display: "grid",
  gap: "8px",
  padding: "18px 20px",
  borderTop: "1px solid #d9e0e8",
  background: "#f8fafc",
  color: "#263344",
  fontSize: "14px",
  lineHeight: 1.45,
} as const;
