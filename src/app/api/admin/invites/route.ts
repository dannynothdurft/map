import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/session";
import { createInviteToken, toInviteSummary, type InviteDocument } from "@/lib/inviteDocument";
import { sendInviteEmail } from "@/lib/mailer";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Nur für Admins." }, { status: 403 });

  const db = await getDb();
  const docs = await db
    .collection<InviteDocument>("invites")
    .find()
    .sort({ createdAt: -1 })
    .toArray();

  return NextResponse.json(docs.map(toInviteSummary));
}

export async function POST(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Nur für Admins." }, { status: 403 });

  const body = await request.json();
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const name = typeof body?.name === "string" ? body.name.trim() : undefined;

  if (!email) {
    return NextResponse.json({ error: "E-Mail ist erforderlich." }, { status: 400 });
  }

  const db = await getDb();
  const existingUser = await db.collection("users").findOne({ email });
  if (existingUser) {
    return NextResponse.json(
      { error: "Für diese E-Mail-Adresse existiert bereits ein Konto." },
      { status: 409 },
    );
  }

  const { token, tokenHash, expiresAt } = createInviteToken();
  const doc: InviteDocument = {
    email,
    name,
    tokenHash,
    invitedBy: admin,
    createdAt: Date.now(),
    expiresAt,
  };

  await db.collection<InviteDocument>("invites").insertOne(doc);

  const baseUrl = process.env.APP_URL || request.url;
  const inviteUrl = new URL(`/signup?token=${token}`, baseUrl).toString();

  try {
    await sendInviteEmail({ to: email, name, inviteUrl, invitedByName: admin.name });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Einladung wurde gespeichert, E-Mail-Versand ist fehlgeschlagen.",
      },
      { status: 502 },
    );
  }

  return NextResponse.json(toInviteSummary(doc), { status: 201 });
}
