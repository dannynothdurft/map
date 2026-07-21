"use client";

import { useState, type FormEvent } from "react";
import type { DeliveryLocation } from "@/types/location";
import { useGeocode } from "@/hooks/useGeocode";
import styles from "./AddressBook.module.scss";

interface UpdateFields {
  label?: string;
  address: string;
  lat: number;
  lng: number;
}

interface AddressBookProps {
  addresses: DeliveryLocation[];
  routeStopIds: string[];
  selectedId?: string | null;
  onAddToRoute: (id: string) => void;
  onRemoveFromRoute: (id: string) => void;
  onDelete: (id: string) => void;
  onSelect: (address: DeliveryLocation) => void;
  onUpdate: (id: string, fields: UpdateFields) => void;
}

export default function AddressBook({
  addresses,
  routeStopIds,
  selectedId,
  onAddToRoute,
  onRemoveFromRoute,
  onDelete,
  onSelect,
  onUpdate,
}: AddressBookProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  if (addresses.length === 0) {
    return (
      <div className={styles.empty}>
        Noch keine Adressen gespeichert. Füge oben eine Adresse hinzu.
      </div>
    );
  }

  const normalizedQuery = query.trim().toLowerCase();
  const filteredAddresses = (
    normalizedQuery
      ? addresses.filter((address) =>
          `${address.label ?? ""} ${address.address}`.toLowerCase().includes(normalizedQuery),
        )
      : addresses
  )
    .slice()
    .sort((a, b) =>
      (a.label || a.address).localeCompare(b.label || b.address, "de", { sensitivity: "base" }),
    );

  return (
    <>
      <input
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Adresse suchen…"
        className={styles.search}
      />

      {filteredAddresses.length === 0 && (
        <div className={styles.empty}>Keine Treffer für &quot;{query}&quot;.</div>
      )}

      <ul className={styles.list}>
      {filteredAddresses.map((address) => {
        if (editingId === address.id) {
          return (
            <AddressEditItem
              key={address.id}
              address={address}
              onCancel={() => setEditingId(null)}
              onSave={(fields) => {
                onUpdate(address.id, fields);
                setEditingId(null);
              }}
              onDelete={() => {
                onDelete(address.id);
                setEditingId(null);
              }}
            />
          );
        }

        const inRoute = routeStopIds.includes(address.id);
        const isSelected = selectedId === address.id;

        return (
          <li
            key={address.id}
            className={`${styles.item} ${isSelected ? styles.itemSelected : ""}`}
          >
            <button
              type="button"
              className={styles.details}
              title="Auf Karte zeigen"
              onClick={() => onSelect(address)}
            >
              {address.label && <span className={styles.label}>{address.label}</span>}
              <span className={styles.address}>{address.address}</span>
            </button>

            <div className={styles.actions}>
              <button
                type="button"
                className={styles.editButton}
                title="Bearbeiten"
                onClick={() => setEditingId(address.id)}
              >
                ✏️
              </button>
              <button
                type="button"
                className={inRoute ? styles.inRouteButton : styles.addButton}
                title={inRoute ? "Aus Route entfernen" : "Zur Route hinzufügen"}
                onClick={() =>
                  inRoute ? onRemoveFromRoute(address.id) : onAddToRoute(address.id)
                }
              >
                {inRoute ? "✓" : "+"}
              </button>
            </div>
          </li>
        );
      })}
      </ul>
    </>
  );
}

interface AddressEditItemProps {
  address: DeliveryLocation;
  onCancel: () => void;
  onSave: (fields: UpdateFields) => void;
  onDelete: () => void;
}

function AddressEditItem({ address, onCancel, onSave, onDelete }: AddressEditItemProps) {
  const [addressText, setAddressText] = useState(address.address);
  const [label, setLabel] = useState(address.label ?? "");
  const { geocode, isLoading, error } = useGeocode();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedAddress = addressText.trim();
    if (!trimmedAddress) return;

    const trimmedLabel = label.trim() || undefined;

    // Only re-geocode when the address text actually changed - saves an
    // unnecessary Nominatim lookup when someone is just fixing the label.
    if (trimmedAddress === address.address) {
      onSave({ label: trimmedLabel, address: address.address, lat: address.lat, lng: address.lng });
      return;
    }

    const result = await geocode(trimmedAddress);
    if (!result) return;

    onSave({ label: trimmedLabel, address: result.displayName, lat: result.lat, lng: result.lng });
  }

  return (
    <li className={styles.editItem}>
      <form className={styles.editForm} onSubmit={handleSubmit}>
        <input
          type="text"
          value={addressText}
          onChange={(event) => setAddressText(event.target.value)}
          disabled={isLoading}
          required
        />
        <input
          type="text"
          value={label}
          onChange={(event) => setLabel(event.target.value)}
          placeholder="Bezeichnung (optional)"
          disabled={isLoading}
        />
        <div className={styles.editActions}>
          <button type="submit" className={styles.saveButton} disabled={isLoading}>
            {isLoading ? "Speichern…" : "Speichern"}
          </button>
          <button
            type="button"
            className={styles.cancelButton}
            onClick={onCancel}
            disabled={isLoading}
          >
            Abbrechen
          </button>
          <button
            type="button"
            className={styles.deleteButton}
            onClick={onDelete}
            disabled={isLoading}
          >
            Löschen
          </button>
        </div>
        {error && <p className={styles.error}>{error}</p>}
      </form>
    </li>
  );
}
