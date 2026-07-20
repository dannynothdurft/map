"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { routeStopId, type RouteStopRef } from "@/lib/routeStop";

function persistStops(stops: RouteStopRef[]) {
  fetch("/api/route-state", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ stops }),
  });
}

export function useRoutePlan() {
  const [stops, setStopsState] = useState<RouteStopRef[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const isLoadedRef = useRef(false);

  useEffect(() => {
    fetch("/api/route-state")
      .then((response) => response.json())
      .then((data: { stops?: RouteStopRef[] }) => {
        setStopsState(data.stops ?? []);
      })
      .finally(() => {
        isLoadedRef.current = true;
        setIsLoaded(true);
      });
  }, []);

  const mutate = useCallback((updater: (prev: RouteStopRef[]) => RouteStopRef[]) => {
    setStopsState((prev) => {
      const next = updater(prev);
      if (isLoadedRef.current) persistStops(next);
      return next;
    });
  }, []);

  const addStop = useCallback(
    (id: string) =>
      mutate((prev) => (prev.some((ref) => routeStopId(ref) === id) ? prev : [...prev, id])),
    [mutate],
  );

  const addAdHocStop = useCallback(
    (stop: { label?: string; address: string; lat: number; lng: number }) => {
      const id =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `adhoc-${Date.now()}-${Math.random()}`;

      mutate((prev) => [...prev, { id, isAdHoc: true, ...stop }]);
    },
    [mutate],
  );

  const removeStop = useCallback(
    (id: string) => mutate((prev) => prev.filter((ref) => routeStopId(ref) !== id)),
    [mutate],
  );

  const reorderStops = useCallback(
    (fromIndex: number, toIndex: number) =>
      mutate((prev) => {
        if (
          fromIndex === toIndex ||
          fromIndex < 0 ||
          fromIndex >= prev.length ||
          toIndex < 0 ||
          toIndex >= prev.length
        ) {
          return prev;
        }

        const next = [...prev];
        const [moved] = next.splice(fromIndex, 1);
        next.splice(toIndex, 0, moved);
        return next;
      }),
    [mutate],
  );

  const clearStops = useCallback(() => mutate(() => []), [mutate]);

  const setAllStops = useCallback((refs: RouteStopRef[]) => mutate(() => refs), [mutate]);

  return {
    stops,
    isLoaded,
    addStop,
    addAdHocStop,
    removeStop,
    reorderStops,
    clearStops,
    setStops: setAllStops,
  };
}
