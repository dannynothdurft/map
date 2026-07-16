"use client";

import { useCallback, useEffect, useRef, useState } from "react";

function persistStopIds(stopIds: string[]) {
  fetch("/api/route-state", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ stopIds }),
  });
}

export function useRoutePlan() {
  const [stopIds, setStopIds] = useState<string[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const isLoadedRef = useRef(false);

  useEffect(() => {
    fetch("/api/route-state")
      .then((response) => response.json())
      .then((data: { stopIds?: string[] }) => {
        setStopIds(data.stopIds ?? []);
      })
      .finally(() => {
        isLoadedRef.current = true;
        setIsLoaded(true);
      });
  }, []);

  const mutate = useCallback((updater: (prev: string[]) => string[]) => {
    setStopIds((prev) => {
      const next = updater(prev);
      if (isLoadedRef.current) persistStopIds(next);
      return next;
    });
  }, []);

  const addStop = useCallback(
    (id: string) => mutate((prev) => (prev.includes(id) ? prev : [...prev, id])),
    [mutate],
  );

  const removeStop = useCallback(
    (id: string) => mutate((prev) => prev.filter((stopId) => stopId !== id)),
    [mutate],
  );

  const moveStop = useCallback(
    (index: number, direction: -1 | 1) =>
      mutate((prev) => {
        const targetIndex = index + direction;
        if (targetIndex < 0 || targetIndex >= prev.length) return prev;

        const next = [...prev];
        [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
        return next;
      }),
    [mutate],
  );

  const clearStops = useCallback(() => mutate(() => []), [mutate]);

  const setStops = useCallback((ids: string[]) => mutate(() => ids), [mutate]);

  return { stopIds, isLoaded, addStop, removeStop, moveStop, clearStops, setStops };
}
