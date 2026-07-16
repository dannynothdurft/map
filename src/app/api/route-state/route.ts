import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import type { RouteStopRef } from "@/lib/routeStop";

interface RouteStateDocument {
  _id: string;
  stops: RouteStopRef[];
}

const CURRENT_ROUTE_ID = "current";

export async function GET() {
  const db = await getDb();
  const doc = await db
    .collection<RouteStateDocument>("routeState")
    .findOne({ _id: CURRENT_ROUTE_ID });

  return NextResponse.json({ stops: doc?.stops ?? [] });
}

export async function PUT(request: NextRequest) {
  const body = await request.json();
  const stops = Array.isArray(body?.stops) ? (body.stops as RouteStopRef[]) : [];

  const db = await getDb();
  await db
    .collection<RouteStateDocument>("routeState")
    .updateOne(
      { _id: CURRENT_ROUTE_ID },
      { $set: { stops } },
      { upsert: true },
    );

  return NextResponse.json({ stops });
}
