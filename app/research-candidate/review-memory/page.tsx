import { ResearchCandidateReviewMemoryDbPanel } from "@/components/research-candidate-review-memory-db-panel";

export const metadata = {
  title: "Research Candidate Review Memory DB UI",
};

export default function ResearchCandidateReviewMemoryPage() {
  return (
    <main style={pageShellStyle}>
      <header style={pageHeaderStyle}>
        <p style={eyebrowStyle}>Research Candidate Review Memory DB UI Runtime v0.1</p>
        <h1 style={headingStyle}>Review Memory Operator Panel</h1>
      </header>
      <ResearchCandidateReviewMemoryDbPanel />
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
