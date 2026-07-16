"use client";

import { useCallback, useEffect, useState } from "react";
import type { DeliveryLocation } from "@/types/location";

export function useAddressBook() {
  const [addresses, setAddresses] = useState<DeliveryLocation[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const refresh = useCallback(async () => {
    const response = await fetch("/api/addresses");
    const data: DeliveryLocation[] = await response.json();
    setAddresses(data);
  }, []);

  useEffect(() => {
    // One-time hydration from the API after mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh().finally(() => setIsLoaded(true));
  }, [refresh]);

  const addAddress = useCallback(async (address: DeliveryLocation) => {
    const response = await fetch("/api/addresses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(address),
    });
    const created: DeliveryLocation = await response.json();
    setAddresses((prev) => [...prev, created]);
  }, []);

  const removeAddress = useCallback(async (id: string) => {
    setAddresses((prev) => prev.filter((address) => address.id !== id));
    await fetch(`/api/addresses/${id}`, { method: "DELETE" });
  }, []);

  const updateAddress = useCallback(
    async (
      id: string,
      fields: Pick<DeliveryLocation, "address" | "lat" | "lng"> & { label?: string },
    ) => {
      const response = await fetch(`/api/addresses/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fields),
      });
      const updated: DeliveryLocation = await response.json();
      setAddresses((prev) => prev.map((address) => (address.id === id ? updated : address)));
    },
    [],
  );

  return { addresses, isLoaded, addAddress, removeAddress, updateAddress };
}
