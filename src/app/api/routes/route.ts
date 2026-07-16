import { NextRequest, NextResponse } from "next/server";
import type { WithId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import type { SavedRoute } from "@/types/savedRoute";
import type { RouteStopRef } from "@/lib/routeStop";

interface RouteDocument {
  name: string;
  stops: RouteStopRef[];
  createdAt: number;
}

function toSavedRoute(doc: WithId<RouteDocument>): SavedRoute {
  return {
    id: doc._id.toString(),
    name: doc.name,
    stops: doc.stops,
    createdAt: doc.createdAt,
  };
}

export async function GET() {
  const db = await getDb();
  const docs = await db
    .collection<RouteDocument>("routes")
    .find()
    .sort({ createdAt: -1 })
    .toArray();

  return NextResponse.json(docs.map(toSavedRoute));
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const stops = Array.isArray(body?.stops) ? (body.stops as RouteStopRef[]) : [];

  if (!name || stops.length === 0) {
    return NextResponse.json(
      { error: "Name und mindestens ein Stopp sind erforderlich." },
      { status: 400 },
    );
  }

  const doc: RouteDocument = { name, stops, createdAt: Date.now() };

  const db = await getDb();
  const result = await db.collection<RouteDocument>("routes").insertOne(doc);

  return NextResponse.json(
    toSavedRoute({ ...doc, _id: result.insertedId }),
    { status: 201 },
  );
}
