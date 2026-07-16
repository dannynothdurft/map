import { NextRequest, NextResponse } from "next/server";
import type { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import type { DeliveryLocation } from "@/types/location";
import { toAddress, type AddressDocument } from "@/lib/addressDocument";

export async function GET() {
  const db = await getDb();
  const docs = await db
    .collection<AddressDocument>("addresses")
    .find()
    .sort({ createdAt: 1 })
    .toArray();

  return NextResponse.json(docs.map(toAddress));
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { label, address, lat, lng } = body as Partial<DeliveryLocation>;

  if (!address || typeof lat !== "number" || typeof lng !== "number") {
    return NextResponse.json(
      { error: "Adresse, lat und lng sind erforderlich." },
      { status: 400 },
    );
  }

  const doc: AddressDocument = {
    label: label || undefined,
    address,
    lat,
    lng,
    createdAt: Date.now(),
  };

  const db = await getDb();
  const result = await db.collection<AddressDocument>("addresses").insertOne(doc);

  return NextResponse.json(
    toAddress({ ...doc, _id: result.insertedId as ObjectId }),
    { status: 201 },
  );
}
