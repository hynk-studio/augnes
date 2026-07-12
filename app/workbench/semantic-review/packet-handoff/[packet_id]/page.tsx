import { PacketHandoffSurface } from "@/components/workbench/semantic-review/packet-handoff-surface";
import { notFound } from "next/navigation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = {
  title: "TaskContextPacket Handoff | Augnes",
  description:
    "Authenticated local read-only export for one exact bounded TaskContextPacket.",
};

export default async function PacketHandoffPage({
  params,
  searchParams,
}: {
  params: Promise<{ packet_id: string }>;
  searchParams: Promise<{ packet_fingerprint?: string | string[] }>;
}) {
  const [{ packet_id: packetSlug }, query] = await Promise.all([
    params,
    searchParams,
  ]);
  if (!/^task-context-packet~[a-f0-9]{24}$/.test(packetSlug)) {
    notFound();
  }
  const packetId = packetSlug.replace("~", ":");
  const packetFingerprint =
    typeof query.packet_fingerprint === "string"
      ? query.packet_fingerprint
      : "";
  return (
    <PacketHandoffSurface
      packetId={packetId}
      packetFingerprint={packetFingerprint}
    />
  );
}
