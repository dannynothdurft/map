import { NextRequest, NextResponse } from "next/server";
import type { WithId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import type { SavedRoute } from "@/types/savedRoute";
import type { RouteStopRef } from "@/lib/routeStop";
import { requireUser } from "@/lib/session";

interface RouteDocument {
  name: string;
  stops?: RouteStopRef[];
  /** @deprecated legacy field name from before stops replaced stopIds - kept for reading old documents */
  stopIds?: string[];
  createdAt: number;
  createdBy?: { id: string; name: string };
}

function toSavedRoute(doc: WithId<RouteDocument>): SavedRoute {
  return {
    id: doc._id.toString(),
    name: doc.name,
    stops: doc.stops ?? doc.stopIds ?? [],
    createdAt: doc.createdAt,
    createdBy: doc.createdBy,
  };
}

export async function GET() {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });

  const db = await getDb();
  const docs = await db
    .collection<RouteDocument>("routes")
    .find({ "createdBy.id": user.id })
    .sort({ createdAt: -1 })
    .toArray();

  return NextResponse.json(docs.map(toSavedRoute));
}

export async function POST(request: NextRequest) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });

  const body = await request.json();
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const stops = Array.isArray(body?.stops) ? (body.stops as RouteStopRef[]) : [];

  if (!name || stops.length === 0) {
    return NextResponse.json(
      { error: "Name und mindestens ein Stopp sind erforderlich." },
      { status: 400 },
    );
  }

  const doc: RouteDocument = { name, stops, createdAt: Date.now(), createdBy: user };

  const db = await getDb();
  const result = await db.collection<RouteDocument>("routes").insertOne(doc);

  return NextResponse.json(
    toSavedRoute({ ...doc, _id: result.insertedId }),
    { status: 201 },
  );
}
