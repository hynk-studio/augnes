import { redirect } from "next/navigation";

export const metadata = {
  title: "Augnes AI Workplane",
  description: "Current work, results, suggested changes, and protected project decisions.",
};

export default function WorkbenchPage() {
  redirect("/workbench/semantic-review");
}
