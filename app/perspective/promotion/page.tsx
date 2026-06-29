import { PromotionReadinessPacketReviewHub } from "@/components/promotion-readiness-packet-review-hub";

export const metadata = {
  title: "Promotion Readiness Review Hub",
};

export default function PromotionReadinessReviewHubPage() {
  return (
    <main style={pageShellStyle}>
      <header style={pageHeaderStyle}>
        <p style={eyebrowStyle}>promotion_readiness_packet_review_hub_read_display_v0_1</p>
        <h1 style={headingStyle}>Promotion readiness review hub</h1>
      </header>
      <PromotionReadinessPacketReviewHub />
    </main>
  );
}

const pageShellStyle = {
  minHeight: "100vh",
  padding: "clamp(16px, 4vw, 32px)",
  background: "#f3f6f8",
  color: "#17212f",
} as const;

const pageHeaderStyle = {
  maxWidth: "1180px",
  margin: "0 auto 20px",
} as const;

const eyebrowStyle = {
  margin: "0 0 8px",
  color: "#526073",
  fontSize: "13px",
  fontWeight: 700,
  letterSpacing: "0",
  textTransform: "uppercase",
  overflowWrap: "anywhere",
} as const;

const headingStyle = {
  margin: 0,
  fontSize: "32px",
  lineHeight: 1.16,
  letterSpacing: "0",
} as const;
