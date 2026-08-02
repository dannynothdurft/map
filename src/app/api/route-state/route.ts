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

export async function GET() {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });

  const db = await getDb();
  const doc = await db
    .collection<RouteStateDocument>("routeState")
    .findOne({ _id: user.id });

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
      { _id: user.id },
      { $set: { stops } },
      { upsert: true },
    );

  return NextResponse.json({ stops });
}
