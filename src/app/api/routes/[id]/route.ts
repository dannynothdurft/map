import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { requireUser } from "@/lib/session";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });

  const { id } = await params;

  if (!ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Ungültige ID." }, { status: 400 });
  }

  const db = await getDb();
  const result = await db
    .collection("routes")
    .deleteOne({ _id: new ObjectId(id), "createdBy.id": user.id });

  if (result.deletedCount === 0) {
    return NextResponse.json({ error: "Route nicht gefunden." }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
