import { ResearchCandidateManualNotePreviewPanel } from "@/components/research-candidate-manual-note-preview-panel";

export const metadata = {
  title: "Research Candidate Review",
  description:
    "Candidate-only manual research note preview for Research Candidate Review.",
};

export default function ResearchCandidateReviewPage() {
  return (
    <main
      className="human-surface-home operator-dogfood-review-surface"
      data-surface-role="operator-dogfood-review"
    >
      <section className="human-surface-shell">
        <ResearchCandidateManualNotePreviewPanel />
      </section>
    </main>
  );
}
