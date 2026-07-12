export const TASK_CONTEXT_PACKET_ID_HEX_LENGTH_V01 = 23 as const;

const TASK_CONTEXT_PACKET_ID_PREFIX_V01 = "task-context-packet:";
const TASK_CONTEXT_PACKET_HANDOFF_SLUG_PREFIX_V01 = "task-context-packet~";
const TASK_CONTEXT_PACKET_HANDOFF_PATH_V01 =
  "/workbench/semantic-review/packet-handoff";
const TASK_CONTEXT_PACKET_FINGERPRINT_PATTERN_V01 = /^sha256:[a-f0-9]{64}$/;
const LOWERCASE_HEX_PATTERN = /^[a-f0-9]+$/;

export function isTaskContextPacketIdV01(value: unknown): value is string {
  if (
    typeof value !== "string" ||
    !value.startsWith(TASK_CONTEXT_PACKET_ID_PREFIX_V01)
  ) {
    return false;
  }
  const suffix = value.slice(TASK_CONTEXT_PACKET_ID_PREFIX_V01.length);
  return (
    suffix.length === TASK_CONTEXT_PACKET_ID_HEX_LENGTH_V01 &&
    LOWERCASE_HEX_PATTERN.test(suffix)
  );
}

export function encodeTaskContextPacketHandoffSlugV01(
  packetId: string,
): string | null {
  if (!isTaskContextPacketIdV01(packetId)) return null;
  return `${TASK_CONTEXT_PACKET_HANDOFF_SLUG_PREFIX_V01}${packetId.slice(
    TASK_CONTEXT_PACKET_ID_PREFIX_V01.length,
  )}`;
}

export function decodeTaskContextPacketHandoffSlugV01(
  packetSlug: string,
): string | null {
  if (!packetSlug.startsWith(TASK_CONTEXT_PACKET_HANDOFF_SLUG_PREFIX_V01)) {
    return null;
  }
  const suffix = packetSlug.slice(
    TASK_CONTEXT_PACKET_HANDOFF_SLUG_PREFIX_V01.length,
  );
  if (
    suffix.length !== TASK_CONTEXT_PACKET_ID_HEX_LENGTH_V01 ||
    !LOWERCASE_HEX_PATTERN.test(suffix)
  ) {
    return null;
  }
  return `${TASK_CONTEXT_PACKET_ID_PREFIX_V01}${suffix}`;
}

export function buildTaskContextPacketHandoffHrefV01(input: {
  packet_id: string;
  packet_fingerprint: string;
}): string | null {
  const packetSlug = encodeTaskContextPacketHandoffSlugV01(input.packet_id);
  if (
    !packetSlug ||
    !TASK_CONTEXT_PACKET_FINGERPRINT_PATTERN_V01.test(input.packet_fingerprint)
  ) {
    return null;
  }
  return `${TASK_CONTEXT_PACKET_HANDOFF_PATH_V01}/${packetSlug}?${new URLSearchParams({
    packet_fingerprint: input.packet_fingerprint,
  }).toString()}`;
}
