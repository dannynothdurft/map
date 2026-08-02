import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { hashInviteToken, type InviteDocument } from "@/lib/inviteDocument";

export async function GET(_request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  const db = await getDb();
  const invite = await db
    .collection<InviteDocument>("invites")
    .findOne({ tokenHash: hashInviteToken(token) });

  if (!invite) {
    return NextResponse.json({ error: "Einladung nicht gefunden." }, { status: 404 });
  }
  if (invite.usedAt) {
    return NextResponse.json({ error: "Einladung wurde bereits verwendet." }, { status: 410 });
  }
  if (invite.expiresAt < Date.now()) {
    return NextResponse.json({ error: "Einladung ist abgelaufen." }, { status: 410 });
  }

  return NextResponse.json({ email: invite.email, name: invite.name ?? null });
}
