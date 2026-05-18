import { buildPerspectiveSnapshot } from "@/lib/perspective/snapshot";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const scope = searchParams.get("scope");

    return NextResponse.json(buildPerspectiveSnapshot({ scope }));
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to build PerspectiveSnapshot.",
      },
      { status: 400 },
    );
  }
}
