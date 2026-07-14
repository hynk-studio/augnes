export const dynamic = "force-dynamic";

export function GET() {
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
