import { buildControlPacket } from "@/lib/control-packet";
import { normalizeScope } from "@/lib/work";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const scope = normalizeScope(searchParams.get("scope"));

    return NextResponse.json(buildControlPacket({ scope }));
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to build control packet.",
      },
      { status: 400 },
    );
  }
}
