"use client";

import { useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
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

// Reordering is driven entirely by Pointer Events (one unified path for
// mouse, touch and pen) instead of the native HTML5 Drag and Drop API.
// Safari (desktop and iOS) is unreliable with native DnD once the draggable
// element contains other interactive children like our buttons - it lets
// the drag start and preview visually, but silently refuses to commit the
// drop, snapping the row back with no error. Pointer Events + explicit
// pointer capture sidestep that entirely and behave the same everywhere.
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
  const [dragOffsetY, setDragOffsetY] = useState(0);
  const itemRefs = useRef<(HTMLLIElement | null)[]>([]);
  const dragStartY = useRef(0);
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

  function endDrag(commit: boolean) {
    if (commit && draggedIndex !== null && dragOverIndex !== null && draggedIndex !== dragOverIndex) {
      onReorder(draggedIndex, dragOverIndex);
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
    setDragOffsetY(0);
  }

  function handlePointerDown(event: ReactPointerEvent<HTMLSpanElement>, index: number) {
    event.preventDefault();
    // Pointer capture keeps move/up events targeted at the handle even once
    // the finger/cursor leaves it - no need to track the pointer globally.
    event.currentTarget.setPointerCapture(event.pointerId);
    captureOriginalRects();
    setDraggedIndex(index);
    setDragOverIndex(index);
    dragStartY.current = event.clientY;
    setDragOffsetY(0);
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLSpanElement>) {
    if (draggedIndex === null) return;
    event.preventDefault();
    setDragOffsetY(event.clientY - dragStartY.current);

    const hoveredIndex = findIndexAtY(event.clientY, draggedIndex);
    if (hoveredIndex !== null && hoveredIndex !== dragOverIndex) {
      setDragOverIndex(hoveredIndex);
    }
  }

  function releaseCapture(event: ReactPointerEvent<HTMLSpanElement>) {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  function handlePointerUp(event: ReactPointerEvent<HTMLSpanElement>) {
    releaseCapture(event);
    endDrag(true);
  }

  function handlePointerCancel(event: ReactPointerEvent<HTMLSpanElement>) {
    releaseCapture(event);
    endDrag(false);
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
            style={
              draggedIndex === index && dragOffsetY !== 0
                ? { transform: `translateY(${dragOffsetY}px)`, transition: "none" }
                : getShiftOffset(index) !== 0
                  ? { transform: `translateY(${getShiftOffset(index)}px)` }
                  : undefined
            }
            className={`${styles.item} ${selectedId === location.id ? styles.itemSelected : ""} ${
              draggedIndex === index ? styles.itemTouchDragging : ""
            }`}
          >
            <span
              className={styles.dragHandle}
              aria-hidden="true"
              title="Ziehen, um Reihenfolge zu ändern"
              onPointerDown={(event) => handlePointerDown(event, index)}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerCancel}
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
