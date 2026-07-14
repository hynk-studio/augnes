import { ProjectOnboardingHome } from "@/components/project-onboarding-home";
import { openDatabase } from "@/lib/db";
import { listRecentProjectsV01 } from "@/lib/vnext/onboarding/local-project-onboarding";

export const dynamic = "force-dynamic";

export default async function Home() {
  const db = openDatabase();
  try { return <ProjectOnboardingHome initialRecent={await listRecentProjectsV01(db)} />; }
  finally { db.close(); }
}
