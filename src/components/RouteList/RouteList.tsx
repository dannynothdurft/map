"use client";

import { useRef, useState, type DragEvent, type TouchEvent } from "react";
import type { DeliveryLocation } from "@/types/location";
import styles from "./RouteList.module.scss";

interface RouteListProps {
  locations: DeliveryLocation[];
  selectedId?: string | null;
  onRemove: (id: string) => void;
  onReorder: (fromId: string, toId: string) => void;
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
  const [touchOffsetY, setTouchOffsetY] = useState(0);
  const itemRefs = useRef<(HTMLLIElement | null)[]>([]);
  const touchStartY = useRef(0);
  const originalRectsRef = useRef<(DOMRect | null)[]>([]);

  if (locations.length === 0) {
    return (
      <div className={styles.empty}>
        Noch keine Stopps in der Route. Füge Adressen aus dem Adressbuch hinzu.
      </div>
    );
  }

  function captureOriginalRects() {
    originalRectsRef.current = itemRefs.current.map((el) => el?.getBoundingClientRect() ?? null);
  }

  function getStepHeight(): number {
    const rects = originalRectsRef.current;
    for (let i = 0; i < rects.length - 1; i++) {
      if (rects[i] && rects[i + 1]) {
        return rects[i + 1]!.top - rects[i]!.top;
      }
    }
    return rects[0]?.height ?? 0;
  }

  function getShiftOffset(index: number): number {
    if (draggedIndex === null || dragOverIndex === null || index === draggedIndex) return 0;
    const step = getStepHeight();
    if (draggedIndex < dragOverIndex && index > draggedIndex && index <= dragOverIndex) {
      return -step;
    }
    if (draggedIndex > dragOverIndex && index >= dragOverIndex && index < draggedIndex) {
      return step;
    }
    return 0;
  }

  function handleDragOver(event: DragEvent<HTMLLIElement>, index: number) {
    event.preventDefault();
    if (index !== dragOverIndex) setDragOverIndex(index);
  }

  function handleDrop(index: number) {
    // Resolve by id rather than passing the raw indices straight through -
    // the rendered list here can momentarily drift out of sync with the
    // underlying stops array (e.g. a re-render mid-drag), which would
    // otherwise reorder the wrong item.
    if (draggedIndex !== null && draggedIndex !== index) {
      const fromId = locations[draggedIndex]?.id;
      const toId = locations[index]?.id;
      if (fromId && toId) onReorder(fromId, toId);
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
  }

  function findIndexAtY(clientY: number, excludeIndex: number | null): number | null {
    const rects = originalRectsRef.current;
    for (let i = 0; i < rects.length; i++) {
      if (i === excludeIndex) continue;
      const rect = rects[i];
      if (!rect) continue;
      if (clientY >= rect.top && clientY <= rect.bottom) {
        return i;
      }
    }
    return null;
  }

  function handleTouchStart(event: TouchEvent<HTMLSpanElement>, index: number) {
    captureOriginalRects();
    setDraggedIndex(index);
    touchStartY.current = event.touches[0].clientY;
    setTouchOffsetY(0);
  }

  function handleTouchMove(event: TouchEvent<HTMLSpanElement>) {
    if (draggedIndex === null) return;
    const touch = event.touches[0];
    setTouchOffsetY(touch.clientY - touchStartY.current);

    const hoveredIndex = findIndexAtY(touch.clientY, draggedIndex);
    if (hoveredIndex !== null && hoveredIndex !== dragOverIndex) {
      setDragOverIndex(hoveredIndex);
    }
  }

  function handleTouchEnd() {
    if (draggedIndex !== null && dragOverIndex !== null && draggedIndex !== dragOverIndex) {
      const fromId = locations[draggedIndex]?.id;
      const toId = locations[dragOverIndex]?.id;
      if (fromId && toId) onReorder(fromId, toId);
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
    setTouchOffsetY(0);
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
            ref={(el) => {
              itemRefs.current[index] = el;
            }}
            draggable
            onDragStart={() => {
              captureOriginalRects();
              setDraggedIndex(index);
            }}
            onDragOver={(event) => handleDragOver(event, index)}
            onDrop={() => handleDrop(index)}
            onDragEnd={() => {
              setDraggedIndex(null);
              setDragOverIndex(null);
            }}
            style={
              draggedIndex === index && touchOffsetY !== 0
                ? { transform: `translateY(${touchOffsetY}px)`, transition: "none" }
                : getShiftOffset(index) !== 0
                  ? { transform: `translateY(${getShiftOffset(index)}px)` }
                  : undefined
            }
            className={`${styles.item} ${selectedId === location.id ? styles.itemSelected : ""} ${
              draggedIndex === index
                ? touchOffsetY !== 0
                  ? styles.itemTouchDragging
                  : styles.itemDragging
                : ""
            }`}
          >
            <span
              className={styles.dragHandle}
              aria-hidden="true"
              title="Ziehen, um Reihenfolge zu ändern"
              onTouchStart={(event) => handleTouchStart(event, index)}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
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
