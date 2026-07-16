import { NextRequest, NextResponse } from "next/server";

interface NominatimResult {
  lat: string;
  lon: string;
  display_name: string;
}

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim();

  if (!query) {
    return NextResponse.json(
      { error: "Query-Parameter 'q' fehlt." },
      { status: 400 },
    );
  }

  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("format", "json");
  url.searchParams.set("q", query);
  url.searchParams.set("limit", "1");

  const response = await fetch(url, {
    headers: {
      // Nominatim usage policy requires an identifying User-Agent.
      "User-Agent": "map-delivery-route-app (personal/local use)",
      "Accept-Language": "de",
    },
  });

  if (!response.ok) {
    return NextResponse.json(
      { error: "Geocoding-Dienst nicht erreichbar." },
      { status: 502 },
    );
  }

  const results: NominatimResult[] = await response.json();

  if (results.length === 0) {
    return NextResponse.json(
      { error: "Adresse wurde nicht gefunden." },
      { status: 404 },
    );
  }

  const [result] = results;

  return NextResponse.json({
    lat: parseFloat(result.lat),
    lng: parseFloat(result.lon),
    displayName: result.display_name,
  });
}
