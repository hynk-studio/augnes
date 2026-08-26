import { notFound } from "next/navigation";

import { RunResultReviewLoader } from "@/components/workbench/result-review/run-result-review-loader";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = {
  title: "Result review | Augnes",
  description: "Review a project result, its verification, open questions, and next action.",
};

export default async function RunResultReviewPage({
  params,
}: {
  params: Promise<{ receipt_id: string }>;
}) {
  const { receipt_id: receiptSlug } = await params;
  if (!/^run-receipt~[a-f0-9]{24}$/u.test(receiptSlug)) notFound();
  const receiptId = receiptSlug.replace("~", ":");
  return <RunResultReviewLoader receiptId={receiptId} />;
}
