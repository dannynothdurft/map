"use client";

import { useState, type FormEvent } from "react";
import type { DeliveryLocation } from "@/types/location";
import { useGeocode } from "@/hooks/useGeocode";
import styles from "./AddressForm.module.scss";

interface AddressFormProps {
  onSave: (location: DeliveryLocation) => void;
}

export default function AddressForm({ onSave }: AddressFormProps) {
  const [address, setAddress] = useState("");
  const [label, setLabel] = useState("");
  const { geocode, isLoading, error } = useGeocode();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedAddress = address.trim();
    if (!trimmedAddress) return;

    const result = await geocode(trimmedAddress);
    if (!result) return;

    onSave({
      id:
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random()}`,
      address: result.displayName,
      label: label.trim() || undefined,
      lat: result.lat,
      lng: result.lng,
      createdAt: Date.now(),
    });

    setAddress("");
    setLabel("");
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <label className={styles.field}>
        <span>Adresse</span>
        <input
          type="text"
          value={address}
          onChange={(event) => setAddress(event.target.value)}
          placeholder="z. B. Stephansplatz 1, Wien"
          disabled={isLoading}
          required
        />
      </label>

      <label className={styles.field}>
        <span>Bezeichnung (optional)</span>
        <input
          type="text"
          value={label}
          onChange={(event) => setLabel(event.target.value)}
          placeholder="z. B. Kunde Müller"
          disabled={isLoading}
        />
      </label>

      <button type="submit" className={styles.submit} disabled={isLoading}>
        {isLoading ? "Suche…" : "Adresse speichern"}
      </button>

      {error && <p className={styles.error}>{error}</p>}
    </form>
  );
}
