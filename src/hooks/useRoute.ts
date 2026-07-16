"use client";

import { useEffect, useState } from "react";
import type { DeliveryLocation } from "@/types/location";

interface RouteApiResponse {
  coordinates?: [number, number][];
  distanceMeters?: number;
  durationSeconds?: number;
  error?: string;
}

interface RouteResult {
  geometry: [number, number][] | null;
  distanceKm: number | null;
  durationMin: number | null;
  isLoading: boolean;
  error: string | null;
}

export function useRoute(locations: DeliveryLocation[]): RouteResult {
  const [geometry, setGeometry] = useState<[number, number][] | null>(null);
  const [distanceKm, setDistanceKm] = useState<number | null>(null);
  const [durationMin, setDurationMin] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Stable key derived from coordinates only, so the route is re-fetched
  // exactly when the actual stops or their order change.
  const routeKey = locations.map((location) => `${location.lat},${location.lng}`).join(";");

  useEffect(() => {
    if (locations.length < 2) {
      // Clear any previous route immediately once there's nothing to route between.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setGeometry(null);
      setDistanceKm(null);
      setDurationMin(null);
      setError(null);
      return;
    }

    const controller = new AbortController();
    setIsLoading(true);
    setError(null);

    fetch("/api/route", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        points: locations.map((location) => ({ lat: location.lat, lng: location.lng })),
      }),
      signal: controller.signal,
    })
      .then((response) => response.json())
      .then((data: RouteApiResponse) => {
        if (data.error || !data.coordinates) {
          setError(data.error ?? "Route konnte nicht berechnet werden.");
          setGeometry(null);
          setDistanceKm(null);
          setDurationMin(null);
          return;
        }

        setGeometry(data.coordinates);
        setDistanceKm((data.distanceMeters ?? 0) / 1000);
        setDurationMin((data.durationSeconds ?? 0) / 60);
      })
      .catch(() => {
        if (controller.signal.aborted) return;
        setError("Routing-Dienst nicht erreichbar.");
        setGeometry(null);
        setDistanceKm(null);
        setDurationMin(null);
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });

    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- routeKey is the intentional dependency, not the locations array reference
  }, [routeKey]);

  return { geometry, distanceKm, durationMin, isLoading, error };
}
