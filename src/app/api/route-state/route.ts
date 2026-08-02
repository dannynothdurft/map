import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import type { RouteStopRef } from "@/lib/routeStop";
import { requireUser } from "@/lib/session";

interface RouteStateDocument {
  _id: string;
  stops?: RouteStopRef[];
  /** @deprecated legacy field name from before stops replaced stopIds - kept for reading old documents */
  stopIds?: string[];
}

// The in-progress tour is shared by the whole team (one pharmacy building
// one tour together), so it's stored under a single fixed id rather than
// per-user.
const SHARED_ROUTE_STATE_ID = "current";

export async function GET() {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });

  const db = await getDb();
  const doc = await db
    .collection<RouteStateDocument>("routeState")
    .findOne({ _id: SHARED_ROUTE_STATE_ID });

  return NextResponse.json({ stops: doc?.stops ?? doc?.stopIds ?? [] });
}

export async function PUT(request: NextRequest) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });

  const body = await request.json();
  const stops = Array.isArray(body?.stops) ? (body.stops as RouteStopRef[]) : [];

  const db = await getDb();
  await db
    .collection<RouteStateDocument>("routeState")
    .updateOne(
      { _id: SHARED_ROUTE_STATE_ID },
      { $set: { stops } },
      { upsert: true },
    );

  return NextResponse.json({ stops });
}
