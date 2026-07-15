import { createObservePostHandlerV01 } from "@/lib/observe/observe-route-handler";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const POST = createObservePostHandlerV01();
