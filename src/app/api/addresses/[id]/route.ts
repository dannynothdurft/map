import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { toAddress, type AddressDocument } from "@/lib/addressDocument";
import type { DeliveryLocation } from "@/types/location";
import { requireUser } from "@/lib/session";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });

  const { id } = await params;

  if (!ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Ungültige ID." }, { status: 400 });
  }

  const body = await request.json();
  const { label, address, lat, lng } = body as Partial<DeliveryLocation>;

  if (!address || typeof lat !== "number" || typeof lng !== "number") {
    return NextResponse.json(
      { error: "Adresse, lat und lng sind erforderlich." },
      { status: 400 },
    );
  }

  const db = await getDb();
  const result = await db
    .collection<AddressDocument>("addresses")
    .findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: { label: label || undefined, address, lat, lng } },
      { returnDocument: "after" },
    );

  if (!result) {
    return NextResponse.json({ error: "Adresse nicht gefunden." }, { status: 404 });
  }

  return NextResponse.json(toAddress(result));
}

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
  await db.collection("addresses").deleteOne({ _id: new ObjectId(id) });

  return NextResponse.json({ ok: true });
}
