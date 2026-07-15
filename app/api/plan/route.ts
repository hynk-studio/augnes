import { createPlannerPostHandlerV01 } from "@/lib/planner/planner-route-handler";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const POST = createPlannerPostHandlerV01();
