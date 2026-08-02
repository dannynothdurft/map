import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/session";

interface RoutePoint {
  lat: number;
  lng: number;
}

interface OsrmStep {
  geometry: { coordinates: [number, number][] };
}

interface OsrmLeg {
  distance: number;
  duration: number;
  steps: OsrmStep[];
}

interface OsrmResponse {
  code: string;
  routes?: {
    distance: number;
    duration: number;
    legs: OsrmLeg[];
  }[];
}

export async function POST(request: NextRequest) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });

  const body = await request.json();
  const points: RoutePoint[] = Array.isArray(body?.points) ? body.points : [];

  if (points.length < 2) {
    return NextResponse.json(
      { error: "Mindestens zwei Punkte für eine Route erforderlich." },
      { status: 400 },
    );
  }

  const coordinates = points.map((point) => `${point.lng},${point.lat}`).join(";");
  // steps=true gives per-leg step geometry, which lets us draw and color
  // each leg (stop-to-stop) separately instead of one long combined line.
  const url = `https://router.project-osrm.org/route/v1/driving/${coordinates}?overview=full&geometries=geojson&steps=true`;

  const response = await fetch(url);

  if (!response.ok) {
    return NextResponse.json(
      { error: "Routing-Dienst nicht erreichbar." },
      { status: 502 },
    );
  }

  const data: OsrmResponse = await response.json();

  if (data.code !== "Ok" || !data.routes || data.routes.length === 0) {
    return NextResponse.json(
      { error: "Für diese Standorte konnte keine Route berechnet werden." },
      { status: 404 },
    );
  }

  const [route] = data.routes;

  const legs = route.legs.map((leg) => {
    const coordinates: [number, number][] = [];

    leg.steps.forEach((step, stepIndex) => {
      // Consecutive steps share their boundary point - skip it on every
      // step but the first to avoid a duplicate coordinate in the leg line.
      const startIndex = stepIndex === 0 ? 0 : 1;
      for (let i = startIndex; i < step.geometry.coordinates.length; i++) {
        const [lng, lat] = step.geometry.coordinates[i];
        coordinates.push([lat, lng]);
      }
    });

    return {
      coordinates,
      distanceMeters: leg.distance,
      durationSeconds: leg.duration,
    };
  });

  return NextResponse.json({
    legs,
    distanceMeters: route.distance,
    durationSeconds: route.duration,
  });
}
