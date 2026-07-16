"use client";

import type { DeliveryLocation } from "@/types/location";
import type { SavedRoute } from "@/types/savedRoute";
import styles from "./SavedRoutesList.module.scss";

interface SavedRoutesListProps {
  routes: SavedRoute[];
  addresses: DeliveryLocation[];
  onLoad: (stopIds: string[]) => void;
  onDelete: (id: string) => void;
}

export default function SavedRoutesList({
  routes,
  addresses,
  onLoad,
  onDelete,
}: SavedRoutesListProps) {
  function describeStops(stopIds: string[]): string {
    const labels = stopIds
      .map((id) => addresses.find((address) => address.id === id))
      .filter((address): address is DeliveryLocation => Boolean(address))
      .map((address) => address.label || address.address);

    return labels.length > 0 ? labels.join(" → ") : `${stopIds.length} Stopp(s)`;
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
            <span className={styles.stops}>{describeStops(route.stopIds)}</span>
          </div>

          <div className={styles.actions}>
            <button
              type="button"
              className={styles.loadButton}
              onClick={() => onLoad(route.stopIds)}
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
