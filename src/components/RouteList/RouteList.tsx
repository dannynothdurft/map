"use client";

import type { DeliveryLocation } from "@/types/location";
import styles from "./RouteList.module.scss";

interface RouteListProps {
  locations: DeliveryLocation[];
  selectedId?: string | null;
  onRemove: (id: string) => void;
  onMove: (index: number, direction: -1 | 1) => void;
  onClear: () => void;
  onSelect: (location: DeliveryLocation) => void;
}

export default function RouteList({
  locations,
  selectedId,
  onRemove,
  onMove,
  onClear,
  onSelect,
}: RouteListProps) {
  if (locations.length === 0) {
    return (
      <div className={styles.empty}>
        Noch keine Stopps in der Route. Füge Adressen aus dem Adressbuch hinzu.
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <span>{locations.length} Stopp(s) in Routenreihenfolge</span>
        <button type="button" className={styles.clearButton} onClick={onClear}>
          Route leeren
        </button>
      </div>

      <ol className={styles.list}>
        {locations.map((location, index) => (
          <li
            key={location.id}
            className={`${styles.item} ${selectedId === location.id ? styles.itemSelected : ""}`}
          >
            <span className={styles.badge}>{index + 1}</span>

            <div className={styles.details}>
              {location.label && (
                <span className={styles.label}>{location.label}</span>
              )}
              <span className={styles.address}>{location.address}</span>
            </div>

            <div className={styles.actions}>
              <button
                type="button"
                title="Auf Karte zeigen"
                onClick={() => onSelect(location)}
              >
                📍
              </button>
              <button
                type="button"
                title="Nach oben"
                disabled={index === 0}
                onClick={() => onMove(index, -1)}
              >
                ↑
              </button>
              <button
                type="button"
                title="Nach unten"
                disabled={index === locations.length - 1}
                onClick={() => onMove(index, 1)}
              >
                ↓
              </button>
              <button
                type="button"
                title="Aus Route entfernen"
                className={styles.removeButton}
                onClick={() => onRemove(location.id)}
              >
                ✕
              </button>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
