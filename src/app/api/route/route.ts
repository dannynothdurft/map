import { NextRequest, NextResponse } from "next/server";

interface RoutePoint {
  lat: number;
  lng: number;
}

interface OsrmResponse {
  code: string;
  routes?: {
    geometry: { coordinates: [number, number][] };
    distance: number;
    duration: number;
  }[];
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const points: RoutePoint[] = Array.isArray(body?.points) ? body.points : [];

  if (points.length < 2) {
    return NextResponse.json(
      { error: "Mindestens zwei Punkte für eine Route erforderlich." },
      { status: 400 },
    );
  }

  const coordinates = points.map((point) => `${point.lng},${point.lat}`).join(";");
  const url = `https://router.project-osrm.org/route/v1/driving/${coordinates}?overview=full&geometries=geojson`;

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

  return NextResponse.json({
    // OSRM returns [lng, lat]; Leaflet expects [lat, lng].
    coordinates: route.geometry.coordinates.map(([lng, lat]) => [lat, lng]),
    distanceMeters: route.distance,
    durationSeconds: route.duration,
  });
}
