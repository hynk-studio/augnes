import { POST as interpretGuideBrief } from "@/app/api/augnes/guide-brief/interpretation/route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  return interpretGuideBrief(request);
}
