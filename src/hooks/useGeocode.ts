"use client";

import { useCallback, useState } from "react";

interface GeocodeResult {
  lat: number;
  lng: number;
  displayName: string;
}

interface GeocodeErrorResponse {
  error: string;
}

export function useGeocode() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const geocode = useCallback(async (query: string): Promise<GeocodeResult | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/geocode?q=${encodeURIComponent(query)}`);
      const data: GeocodeResult | GeocodeErrorResponse = await response.json();

      if (!response.ok || "error" in data) {
        setError("error" in data ? data.error : "Adresse konnte nicht gefunden werden.");
        return null;
      }

      return data;
    } catch {
      setError("Verbindung zum Geocoding-Dienst fehlgeschlagen.");
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { geocode, isLoading, error, setError };
}
