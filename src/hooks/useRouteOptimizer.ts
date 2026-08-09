"use client";

import { useCallback, useState } from "react";
import { DEPOT_ADDRESS, DEPOT_LABEL, DEPOT_LAT, DEPOT_LNG } from "@/lib/depot";
import { routeStopId, type RouteStopRef } from "@/lib/routeStop";
import type { DeliveryLocation } from "@/types/location";

interface OptimizeApiResponse {
  order?: string[];
  error?: string;
}

export function useRouteOptimizer() {
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const optimize = useCallback(
    async (
      stops: RouteStopRef[],
      stopLocations: DeliveryLocation[],
    ): Promise<RouteStopRef[] | null> => {
      if (stopLocations.length < 2) return null;

      setIsOptimizing(true);
      setError(null);

      try {
        const response = await fetch("/api/optimize-route", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            depot: {
              label: DEPOT_LABEL,
              address: DEPOT_ADDRESS,
              lat: DEPOT_LAT,
              lng: DEPOT_LNG,
            },
            stops: stopLocations.map((location) => ({
              id: location.id,
              label: location.label,
              address: location.address,
              openingHours: location.openingHours,
              lat: location.lat,
              lng: location.lng,
            })),
          }),
        });

        const data: OptimizeApiResponse = await response.json();

        if (!response.ok || data.error || !data.order) {
          setError(data.error ?? "Route konnte nicht optimiert werden.");
          return null;
        }

        const refsById = new Map(stops.map((ref) => [routeStopId(ref), ref]));
        const reordered = data.order
          .map((id) => refsById.get(id))
          .filter((ref): ref is RouteStopRef => Boolean(ref));

        if (reordered.length !== stops.length) {
          setError("Route konnte nicht optimiert werden.");
          return null;
        }

        return reordered;
      } catch {
        setError("Verbindung zur KI fehlgeschlagen.");
        return null;
      } finally {
        setIsOptimizing(false);
      }
    },
    [],
  );

  return { optimize, isOptimizing, error };
}
