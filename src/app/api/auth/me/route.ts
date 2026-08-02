import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { getSession } from "@/lib/session";
import { toUserSummary, type UserDocument } from "@/lib/userDocument";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });
  }

  const db = await getDb();
  const doc = await db
    .collection<UserDocument>("users")
    .findOne({ _id: new ObjectId(session.id) });

  if (!doc) {
    return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });
  }

  return NextResponse.json(toUserSummary(doc));
}
