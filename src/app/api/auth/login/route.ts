import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getDb } from "@/lib/mongodb";
import { createSession } from "@/lib/session";
import { toUserSummary, type UserDocument } from "@/lib/userDocument";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body?.password === "string" ? body.password : "";

  if (!email || !password) {
    return NextResponse.json(
      { error: "E-Mail und Passwort sind erforderlich." },
      { status: 400 },
    );
  }

  const db = await getDb();
  const doc = await db.collection<UserDocument>("users").findOne({ email });

  if (!doc || !(await bcrypt.compare(password, doc.passwordHash))) {
    return NextResponse.json(
      { error: "E-Mail oder Passwort ist falsch." },
      { status: 401 },
    );
  }

  const user = toUserSummary(doc);
  await createSession({ id: user.id, name: user.name, role: user.role });

  return NextResponse.json(user);
}
