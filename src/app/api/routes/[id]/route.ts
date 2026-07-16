import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  if (!ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Ungültige ID." }, { status: 400 });
  }

  const db = await getDb();
  await db.collection("routes").deleteOne({ _id: new ObjectId(id) });

  return NextResponse.json({ ok: true });
}
