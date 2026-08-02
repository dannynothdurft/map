import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { requireUser } from "@/lib/session";

const client = new Anthropic();

interface StopInput {
  id: string;
  label?: string;
  address: string;
  lat: number;
  lng: number;
}

interface DepotInput {
  label?: string;
  address: string;
  lat: number;
  lng: number;
}

export async function POST(request: NextRequest) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });

  const body = await request.json();
  const depot: DepotInput | undefined = body?.depot;
  const stops: StopInput[] = Array.isArray(body?.stops) ? body.stops : [];

  if (!depot || stops.length < 2) {
    return NextResponse.json(
      { error: "Depot und mindestens zwei Stopps sind erforderlich." },
      { status: 400 },
    );
  }

  const stopIds = stops.map((stop) => stop.id);

  const message = await client.messages.create({
    model: "claude-opus-5",
    max_tokens: 4096,
    thinking: { type: "adaptive" },
    output_config: { effort: "high" },
    system:
      "Du bist Experte für Tourenplanung im Lieferverkehr. Du bekommst einen festen Start-/Zielpunkt (Depot) sowie eine Liste von Lieferstopps mit Adresse und Koordinaten (Breitengrad, Längengrad).\n\n" +
      "Aufgabe: Bestimme die Besuchsreihenfolge der Stopps so, dass die gesamte Tour - vom Depot durch alle Stopps und zurück zum Depot - so kurz wie möglich ist.\n\n" +
      "Vorgehen:\n" +
      "- Schätze Distanzen anhand der Koordinaten ab und plane wie bei einem klassischen Rundreiseproblem (TSP): vermeide Zickzack-Fahrten und unnötige Umwege, fasse geografisch nahe Stopps zu zusammenhängenden Abschnitten der Route zusammen.\n" +
      "- Denke die Route in Ruhe durch und vergleiche gedanklich mehrere Reihenfolgen, bevor du dich für die kürzeste entscheidest.\n" +
      "- Jeder übergebene Stopp muss GENAU EINMAL in der Reihenfolge vorkommen - keine ausgelassenen, doppelten oder erfundenen IDs.\n\n" +
      "Rufe abschließend immer das Werkzeug set_stop_order mit der optimierten Reihenfolge auf - genau einmal pro Stopp-ID.",
    tools: [
      {
        name: "set_stop_order",
        description: "Legt die optimierte Besuchsreihenfolge der Lieferstopps fest.",
        input_schema: {
          type: "object",
          properties: {
            order: {
              type: "array",
              description: "Die Stopp-IDs in der optimalen Besuchsreihenfolge.",
              items: { type: "string", enum: stopIds },
            },
          },
          required: ["order"],
        },
      },
    ],
    messages: [
      {
        role: "user",
        content: `Depot (Start und Ziel der Tour): ${depot.label ?? ""} - ${depot.address} (${depot.lat}, ${depot.lng})\n\nStopps:\n${stops
          .map(
            (stop) =>
              `- id=${stop.id} | ${stop.label ?? ""} ${stop.address} (${stop.lat}, ${stop.lng})`,
          )
          .join("\n")}`,
      },
    ],
  });

  const toolUse = message.content.find(
    (block): block is Anthropic.ToolUseBlock =>
      block.type === "tool_use" && block.name === "set_stop_order",
  );

  if (!toolUse) {
    return NextResponse.json(
      { error: "Die KI konnte keine Reihenfolge bestimmen." },
      { status: 502 },
    );
  }

  const input = toolUse.input as { order?: string[] };
  const proposedOrder = Array.isArray(input.order) ? input.order : [];

  // Guard against hallucinated/duplicate ids and silently drop any stop the
  // model missed back in at the end, so a route never loses a stop.
  const validOrder = [...new Set(proposedOrder)].filter((id) => stopIds.includes(id));
  const missing = stopIds.filter((id) => !validOrder.includes(id));

  return NextResponse.json({ order: [...validOrder, ...missing] });
}
