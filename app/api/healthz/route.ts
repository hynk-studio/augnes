import { timingSafeEqual } from "node:crypto";

export const dynamic = "force-dynamic";

export function GET(request: Request) {
  const requestUrl = new URL(request.url);
  if (requestUrl.searchParams.get("ownership") === "1") {
    const suppliedToken = request.headers.get("x-augnes-child-ownership");
    const expectedToken = process.env.AUGNES_RUNTIME_OWNERSHIP_TOKEN;
    if (!constantTimeEqual(suppliedToken, expectedToken)) {
      return Response.json(
        { ownership_verified: false, reason: "ownership_unverified" },
        { status: 403, headers: { "cache-control": "no-store" } },
      );
    }

    return Response.json(
      {
        ownership_verified: true,
        schema_version: integerEnvironment("AUGNES_RUNTIME_SCHEMA_VERSION"),
        contract: process.env.AUGNES_RUNTIME_CONTRACT ?? null,
        generation_version: integerEnvironment(
          "AUGNES_RUNTIME_GENERATION_VERSION",
        ),
        generation_id: process.env.AUGNES_RUNTIME_GENERATION_ID ?? null,
        repository_fingerprint:
          process.env.AUGNES_RUNTIME_REPOSITORY_FINGERPRINT ?? null,
        instance_id: process.env.AUGNES_RUNTIME_INSTANCE_ID ?? null,
        role: process.env.AUGNES_RUNTIME_CHILD_ROLE ?? null,
        child_root_pid: integerEnvironment("AUGNES_RUNTIME_CHILD_ROOT_PID"),
        process_pid: process.pid,
        loopback_port: integerEnvironment("AUGNES_RUNTIME_CHILD_PORT"),
      },
      { headers: { "cache-control": "no-store" } },
    );
  }

  return Response.json(
    {
      ok: true,
      service: "augnes-ui",
      schema_version: 1,
      status: "ready",
      runtime_instance_id: process.env.AUGNES_RUNTIME_INSTANCE_ID ?? null,
    },
    {
      headers: {
        "cache-control": "no-store",
      },
    },
  );
}

function integerEnvironment(name: string): number | null {
  const value = Number(process.env[name]);
  return Number.isInteger(value) ? value : null;
}

function constantTimeEqual(left: string | null, right: string | undefined): boolean {
  if (!left || !right) return false;
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return (
    leftBuffer.length === rightBuffer.length &&
    timingSafeEqual(leftBuffer, rightBuffer)
  );
}
