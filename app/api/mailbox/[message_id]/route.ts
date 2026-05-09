import { getMailboxMessage } from "@/lib/mailbox";
import { normalizeScope } from "@/lib/work";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ message_id: string }> },
) {
  const { message_id } = await params;
  const { searchParams } = new URL(request.url);
  const scopeParam = searchParams.get("scope");
  const scope = scopeParam ? normalizeScope(scopeParam) : null;
  const mailboxMessage = getMailboxMessage(decodeURIComponent(message_id), scope);

  if (!mailboxMessage) {
    return NextResponse.json(
      { error: `Unknown mailbox message ${message_id}.` },
      { status: 404 },
    );
  }

  return NextResponse.json({
    scope: mailboxMessage.scope,
    mailbox_message: mailboxMessage,
  });
}
