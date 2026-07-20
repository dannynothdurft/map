"use client";

import { useState, type DragEvent } from "react";
import type { DeliveryLocation } from "@/types/location";
import styles from "./RouteList.module.scss";

interface RouteListProps {
  locations: DeliveryLocation[];
  selectedId?: string | null;
  onRemove: (id: string) => void;
  onReorder: (fromIndex: number, toIndex: number) => void;
  onClear: () => void;
  onSelect: (location: DeliveryLocation) => void;
  onOptimize: () => void;
  isOptimizing: boolean;
  optimizeError: string | null;
}

export default function RouteList({
  locations,
  selectedId,
  onRemove,
  onReorder,
  onClear,
  onSelect,
  onOptimize,
  isOptimizing,
  optimizeError,
}: RouteListProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  if (locations.length === 0) {
    return (
      <div className={styles.empty}>
        Noch keine Stopps in der Route. Füge Adressen aus dem Adressbuch hinzu.
      </div>
    );
  }

  function handleDragOver(event: DragEvent<HTMLLIElement>, index: number) {
    event.preventDefault();
    if (index !== dragOverIndex) setDragOverIndex(index);
  }

  function handleDrop(index: number) {
    if (draggedIndex !== null && draggedIndex !== index) {
      onReorder(draggedIndex, index);
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
  }

  function handleRemove(location: DeliveryLocation) {
    const name = location.label || location.address;
    if (window.confirm(`"${name}" wirklich aus der Route entfernen?`)) {
      onRemove(location.id);
    }
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <span>{locations.length} Stopp(s) in Routenreihenfolge</span>
        <button type="button" className={styles.clearButton} onClick={onClear}>
          Route leeren
        </button>
      </div>

      {locations.length > 1 && (
        <button
          type="button"
          className={styles.optimizeButton}
          onClick={onOptimize}
          disabled={isOptimizing}
        >
          {isOptimizing ? "KI optimiert Route…" : "✨ Route mit KI optimieren"}
        </button>
      )}

      {optimizeError && <p className={styles.optimizeError}>{optimizeError}</p>}

      <ol className={styles.list}>
        {locations.map((location, index) => (
          <li
            key={location.id}
            draggable
            onDragStart={() => setDraggedIndex(index)}
            onDragOver={(event) => handleDragOver(event, index)}
            onDrop={() => handleDrop(index)}
            onDragEnd={() => {
              setDraggedIndex(null);
              setDragOverIndex(null);
            }}
            className={`${styles.item} ${selectedId === location.id ? styles.itemSelected : ""} ${
              draggedIndex === index ? styles.itemDragging : ""
            } ${dragOverIndex === index && draggedIndex !== index ? styles.itemDragOver : ""}`}
          >
            <span className={styles.dragHandle} aria-hidden="true" title="Ziehen, um Reihenfolge zu ändern">
              ⠿
            </span>

            <span className={styles.badge}>{index + 1}</span>

            <button
              type="button"
              className={styles.details}
              title="Auf Karte zeigen"
              onClick={() => onSelect(location)}
            >
              {location.label && (
                <span className={styles.label}>{location.label}</span>
              )}
              <span className={styles.address}>{location.address}</span>
            </button>

            <div className={styles.actions}>
              <button
                type="button"
                title="Aus Route entfernen"
                className={styles.removeButton}
                onClick={() => handleRemove(location)}
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
