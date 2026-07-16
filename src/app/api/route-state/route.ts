import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";

interface RouteStateDocument {
  _id: string;
  stopIds: string[];
}

const CURRENT_ROUTE_ID = "current";

export async function GET() {
  const db = await getDb();
  const doc = await db
    .collection<RouteStateDocument>("routeState")
    .findOne({ _id: CURRENT_ROUTE_ID });

  return NextResponse.json({ stopIds: doc?.stopIds ?? [] });
}

export async function PUT(request: NextRequest) {
  const body = await request.json();
  const stopIds = Array.isArray(body?.stopIds) ? (body.stopIds as string[]) : [];

  const db = await getDb();
  await db
    .collection<RouteStateDocument>("routeState")
    .updateOne(
      { _id: CURRENT_ROUTE_ID },
      { $set: { stopIds } },
      { upsert: true },
    );

  return NextResponse.json({ stopIds });
}
