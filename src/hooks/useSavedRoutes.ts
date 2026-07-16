"use client";

import { useCallback, useEffect, useState } from "react";
import type { SavedRoute } from "@/types/savedRoute";
import type { RouteStopRef } from "@/lib/routeStop";

interface SaveRouteError {
  error: string;
}

export function useSavedRoutes() {
  const [routes, setRoutes] = useState<SavedRoute[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const refresh = useCallback(async () => {
    const response = await fetch("/api/routes");
    const data: SavedRoute[] = await response.json();
    setRoutes(data);
  }, []);

  useEffect(() => {
    // One-time hydration from the API after mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh().finally(() => setIsLoaded(true));
  }, [refresh]);

  const saveRoute = useCallback(async (name: string, stops: RouteStopRef[]) => {
    const response = await fetch("/api/routes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, stops }),
    });
    const data: SavedRoute | SaveRouteError = await response.json();

    if (!response.ok || "error" in data) {
      throw new Error("error" in data ? data.error : "Route konnte nicht gespeichert werden.");
    }

    setRoutes((prev) => [data, ...prev]);
    return data;
  }, []);

  const deleteRoute = useCallback(async (id: string) => {
    setRoutes((prev) => prev.filter((route) => route.id !== id));
    await fetch(`/api/routes/${id}`, { method: "DELETE" });
  }, []);

  return { routes, isLoaded, saveRoute, deleteRoute };
}
