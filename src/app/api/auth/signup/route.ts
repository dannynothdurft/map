import { NextRequest, NextResponse } from "next/server";
import type { ObjectId } from "mongodb";
import bcrypt from "bcryptjs";
import { getDb } from "@/lib/mongodb";
import { createSession } from "@/lib/session";
import { toUserSummary, type UserDocument } from "@/lib/userDocument";
import { hashInviteToken, type InviteDocument } from "@/lib/inviteDocument";
import { isAdminEmail } from "@/lib/admin";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body?.password === "string" ? body.password : "";
  const token = typeof body?.token === "string" ? body.token.trim() : "";

  if (!name || !email || password.length < 8) {
    return NextResponse.json(
      { error: "Name, E-Mail und ein Passwort mit mindestens 8 Zeichen sind erforderlich." },
      { status: 400 },
    );
  }

  const db = await getDb();
  const users = db.collection<UserDocument>("users");
  await users.createIndex({ email: 1 }, { unique: true });

  const existing = await users.findOne({ email });
  if (existing) {
    return NextResponse.json(
      { error: "Für diese E-Mail-Adresse existiert bereits ein Konto." },
      { status: 409 },
    );
  }

  const isAdmin = isAdminEmail(email);
  const invites = db.collection<InviteDocument>("invites");
  let invite: (InviteDocument & { _id: ObjectId }) | null = null;

  if (token) {
    invite = await invites.findOne({ tokenHash: hashInviteToken(token) });

    if (!invite || invite.email !== email) {
      return NextResponse.json({ error: "Einladung ungültig." }, { status: 400 });
    }
    if (invite.usedAt) {
      return NextResponse.json({ error: "Einladung wurde bereits verwendet." }, { status: 410 });
    }
    if (invite.expiresAt < Date.now()) {
      return NextResponse.json({ error: "Einladung ist abgelaufen." }, { status: 410 });
    }
  } else if (!isAdmin) {
    return NextResponse.json(
      { error: "Registrierung ist nur mit einer gültigen Einladung möglich." },
      { status: 403 },
    );
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const doc: UserDocument = {
    name,
    email,
    passwordHash,
    role: isAdmin ? "admin" : "member",
    createdAt: Date.now(),
  };
  const result = await users.insertOne(doc);
  const user = toUserSummary({ ...doc, _id: result.insertedId });

  if (invite) {
    await invites.updateOne({ _id: invite._id }, { $set: { usedAt: Date.now() } });
  }

  await createSession({ id: user.id, name: user.name, role: user.role });

  return NextResponse.json(user, { status: 201 });
}
