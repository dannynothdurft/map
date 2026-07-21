import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

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
    model: "claude-opus-4-8",
    max_tokens: 4096,
    thinking: { type: "adaptive" },
    output_config: { effort: "low" },
    system:
      "Du planst Lieferrouten. Du bekommst einen festen Start-/Zielpunkt (Depot) und eine Liste von Lieferstopps mit Koordinaten. Bestimme die Reihenfolge, in der die Stopps besucht werden sollten, um die gesamte Fahrstrecke ab dem Depot, durch alle Stopps und zurück zum Depot möglichst kurz zu halten. Rufe danach immer das Werkzeug set_stop_order mit der optimierten Reihenfolge auf - genau einmal pro Stopp-ID.",
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
