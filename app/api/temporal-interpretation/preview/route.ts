import { createTemporalPreviewPostHandlerV01 } from "@/lib/temporal-interpretation/preview-route-handler";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const POST = createTemporalPreviewPostHandlerV01();
