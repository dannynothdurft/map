"use client";

import { useState } from "react";
import type { DeliveryLocation } from "@/types/location";
import type { SavedRoute } from "@/types/savedRoute";
import { resolveRouteStop, type RouteStopRef } from "@/lib/routeStop";
import Modal from "@/components/Modal/Modal";
import styles from "./SavedRoutesList.module.scss";

interface SavedRoutesListProps {
  routes: SavedRoute[];
  addresses: DeliveryLocation[];
  onOpen: (stops: RouteStopRef[]) => void;
  onAdd: (stops: RouteStopRef[]) => void;
  onDelete: (id: string) => void;
}

export default function SavedRoutesList({
  routes,
  addresses,
  onOpen,
  onAdd,
  onDelete,
}: SavedRoutesListProps) {
  const [previewId, setPreviewId] = useState<string | null>(null);

  function resolveStops(stops: RouteStopRef[]): DeliveryLocation[] {
    return stops
      .map((ref) => resolveRouteStop(ref, addresses))
      .filter((location): location is DeliveryLocation => Boolean(location));
  }

  function describeStops(stops: RouteStopRef[]): string {
    const labels = resolveStops(stops).map((location) => location.label || location.address);
    return labels.length > 0 ? labels.join(" → ") : `${stops.length} Stopp(s)`;
  }

  if (routes.length === 0) {
    return (
      <div className={styles.empty}>
        Noch keine Routen gespeichert. Baue unter &quot;Tour&quot; eine Route
        zusammen und speichere sie dort unter einem Namen.
      </div>
    );
  }

  const sortedRoutes = routes
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name, "de", { sensitivity: "base" }));

  const previewRoute = sortedRoutes.find((route) => route.id === previewId) ?? null;

  return (
    <>
      <ul className={styles.list}>
        {sortedRoutes.map((route) => (
          <li key={route.id} className={styles.item}>
            <div className={styles.details}>
              <span className={styles.name}>{route.name}</span>
              <span className={styles.stops}>{describeStops(route.stops)}</span>
            </div>

            <div className={styles.actions}>
              <button
                type="button"
                className={styles.showButton}
                onClick={() => setPreviewId(route.id)}
              >
                Tour anzeigen
              </button>
              <button
                type="button"
                className={styles.deleteButton}
                title="Route löschen"
                onClick={() => onDelete(route.id)}
              >
                ✕
              </button>
            </div>
          </li>
        ))}
      </ul>

      {previewRoute && (
        <Modal title={previewRoute.name} onClose={() => setPreviewId(null)}>
          <ol className={styles.stopList}>
            {resolveStops(previewRoute.stops).map((location, index) => (
              <li key={`${previewRoute.id}-${index}`} className={styles.stopItem}>
                <span className={styles.stopBadge}>{index + 1}</span>
                <span className={styles.stopDetails}>
                  {location.label && <span className={styles.stopLabel}>{location.label}</span>}
                  <span className={styles.stopAddress}>{location.address}</span>
                </span>
              </li>
            ))}
          </ol>

          <div className={styles.modalActions}>
            <button
              type="button"
              className={styles.addButton}
              title="Zur bestehenden Tour hinzufügen"
              onClick={() => {
                onAdd(previewRoute.stops);
                setPreviewId(null);
              }}
            >
              Zur aktuellen Tour hinzufügen
            </button>
            <button
              type="button"
              className={styles.openButton}
              title="Diese Tour öffnen (ersetzt die aktuelle Tour)"
              onClick={() => {
                onOpen(previewRoute.stops);
                setPreviewId(null);
              }}
            >
              Tour öffnen
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
