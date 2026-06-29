import { AugnesCockpit } from "@/components/augnes-cockpit";
import { PromotionReadinessReviewHubCockpitEntrypoint } from "@/components/promotion-readiness-review-hub-cockpit-entrypoint";

export default function Home() {
  return (
    <>
      <PromotionReadinessReviewHubCockpitEntrypoint />
      <AugnesCockpit />
    </>
  );
}
