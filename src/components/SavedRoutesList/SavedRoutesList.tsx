"use client";

import type { DeliveryLocation } from "@/types/location";
import type { SavedRoute } from "@/types/savedRoute";
import { resolveRouteStop, type RouteStopRef } from "@/lib/routeStop";
import styles from "./SavedRoutesList.module.scss";

interface SavedRoutesListProps {
  routes: SavedRoute[];
  addresses: DeliveryLocation[];
  onLoad: (stops: RouteStopRef[]) => void;
  onDelete: (id: string) => void;
}

export default function SavedRoutesList({
  routes,
  addresses,
  onLoad,
  onDelete,
}: SavedRoutesListProps) {
  function describeStops(stops: RouteStopRef[]): string {
    const labels = stops
      .map((ref) => resolveRouteStop(ref, addresses))
      .filter((location): location is DeliveryLocation => Boolean(location))
      .map((location) => location.label || location.address);

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

  return (
    <ul className={styles.list}>
      {routes.map((route) => (
        <li key={route.id} className={styles.item}>
          <div className={styles.details}>
            <span className={styles.name}>{route.name}</span>
            <span className={styles.stops}>{describeStops(route.stops)}</span>
          </div>

          <div className={styles.actions}>
            <button
              type="button"
              className={styles.loadButton}
              onClick={() => onLoad(route.stops)}
            >
              Laden
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
  );
}
