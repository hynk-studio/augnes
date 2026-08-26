import { SemanticReviewSurface } from "@/components/workbench/semantic-review/semantic-review-surface";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = {
  title: "Augnes AI Workplane",
  description: "Review current work, results, suggested changes, and protected project decisions.",
};

export default function SemanticReviewPage() {
  return <SemanticReviewSurface />;
}
