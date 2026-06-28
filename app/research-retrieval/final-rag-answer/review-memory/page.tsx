import { FinalRagAnswerReviewMemoryPanel } from "@/components/final-rag-answer-review-memory-panel";

export const metadata = {
  title: "Final Answer Candidate Review Memory",
};

export default function FinalRagAnswerReviewMemoryPage() {
  return (
    <main style={pageShellStyle}>
      <header style={pageHeaderStyle}>
        <p style={eyebrowStyle}>Final Answer Candidate Review UI Binding v0.1</p>
        <h1 style={headingStyle}>Final Answer Candidate Review Memory</h1>
      </header>
      <FinalRagAnswerReviewMemoryPanel />
    </main>
  );
}

const pageShellStyle = {
  minHeight: "100vh",
  padding: "clamp(16px, 4vw, 32px)",
  background: "#f7f8fa",
  color: "#18212f",
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
} as const;

const headingStyle = {
  margin: 0,
  fontSize: "32px",
  lineHeight: 1.16,
  letterSpacing: "0",
} as const;
