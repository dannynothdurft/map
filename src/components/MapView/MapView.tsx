"use client";

import { useEffect } from "react";
import {
  MapContainer,
  Marker,
  Polyline,
  Popup,
  TileLayer,
  useMap,
  ZoomControl,
} from "react-leaflet";
import L from "leaflet";
import type { DeliveryLocation } from "@/types/location";
import { useRoute } from "@/hooks/useRoute";
import { DEPOT_END_ID, DEPOT_START_ID } from "@/lib/depot";
import { buildNavigationUrl } from "@/lib/navigation";
import styles from "./MapView.module.scss";

// Leaflet's default marker icons reference image paths that don't resolve
// correctly through the Next.js bundler, so serve them from /public instead
// (avoids depending on an external CDN that ad-blockers may block).
const baseIconOptions = {
  iconUrl: "/leaflet/marker-icon.png",
  iconRetinaUrl: "/leaflet/marker-icon-2x.png",
  shadowUrl: "/leaflet/marker-shadow.png",
  iconSize: [25, 41] as [number, number],
  iconAnchor: [12, 41] as [number, number],
  popupAnchor: [1, -34] as [number, number],
  shadowSize: [41, 41] as [number, number],
};

const markerIcon = L.icon(baseIconOptions);
// Recolor the same marker image via a CSS filter so the fixed depot and the
// ad-hoc "focused" address are visually distinct from regular stops, without
// needing separate icon assets.
const depotIcon = L.icon({ ...baseIconOptions, className: styles.depotIcon });
const focusIcon = L.icon({ ...baseIconOptions, className: styles.focusIcon });

const DEFAULT_CENTER: [number, number] = [51.1657, 10.4515]; // Germany
const DEFAULT_ZOOM = 6;

// Distinct color per leg (stop-to-stop segment), cycling if there are more
// legs than colors.
const LEG_COLORS = [
  "#2563eb",
  "#dc2626",
  "#16a34a",
  "#d97706",
  "#7c3aed",
  "#0891b2",
  "#db2777",
  "#65a30d",
];

function InvalidateSizeOnResize() {
  const map = useMap();

  useEffect(() => {
    // Covers the very first paint (container can still be mid-layout) as
    // well as later size changes - e.g. the sidebar drawer expanding or
    // collapsing - which resize this container without ever firing a
    // window "resize" event.
    const container = map.getContainer();
    const observer = new ResizeObserver(() => map.invalidateSize());
    observer.observe(container);

    return () => observer.disconnect();
  }, [map]);

  return null;
}

interface FitToLocationsProps {
  positions: [number, number][];
}

function FitToLocations({ positions }: FitToLocationsProps) {
  const map = useMap();

  useEffect(() => {
    if (positions.length === 0) return;

    if (positions.length === 1) {
      map.setView(positions[0], 13);
      return;
    }

    map.fitBounds(L.latLngBounds(positions), { padding: [40, 40] });
  }, [map, positions]);

  return null;
}

function FlyToFocus({ position }: { position: [number, number] }) {
  const map = useMap();

  useEffect(() => {
    map.flyTo(position, Math.max(map.getZoom(), 15), { duration: 0.6 });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-fly when the target coordinates change
  }, [map, position[0], position[1]]);

  return null;
}

function NavigationLink({ lat, lng }: { lat: number; lng: number }) {
  return (
    <a
      href={buildNavigationUrl(lat, lng)}
      target="_blank"
      rel="noopener noreferrer"
      className={styles.navigationLink}
    >
      🧭 Navigation starten
    </a>
  );
}

interface MapViewProps {
  locations: DeliveryLocation[];
  focusLocation?: DeliveryLocation | null;
}

export default function MapView({ locations, focusLocation }: MapViewProps) {
  const positions: [number, number][] = locations.map((location) => [
    location.lat,
    location.lng,
  ]);

  const { legs, distanceKm, durationMin, isLoading, error } = useRoute(locations);

  const hasRealRoute = Boolean(legs && legs.length > 0);

  // Prefer the real road route, one segment per leg; fall back to a
  // straight line between each consecutive stop while it's loading or if
  // the routing service couldn't be reached.
  const segments: [number, number][][] = hasRealRoute
    ? legs!.map((leg) => leg.coordinates)
    : positions.slice(0, -1).map((position, index) => [position, positions[index + 1]]);

  const fitPositions = hasRealRoute ? segments.flat() : positions;

  // Number only the real stops (1, 2, 3…), skipping the depot start/end.
  const numberedLocations = locations.reduce<
    { location: DeliveryLocation; stopNumber: number | null }[]
  >((acc, location) => {
    const isDepot = location.id === DEPOT_START_ID || location.id === DEPOT_END_ID;
    const previousNumber = acc.length > 0 ? acc[acc.length - 1].stopNumber ?? 0 : 0;
    acc.push({ location, stopNumber: isDepot ? null : previousNumber + 1 });
    return acc;
  }, []);

  return (
    <div className={styles.wrapper}>
      <MapContainer
        center={DEFAULT_CENTER}
        zoom={DEFAULT_ZOOM}
        zoomControl={false}
        className={styles.map}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>-Mitwirkende'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <ZoomControl position="bottomright" />

        <InvalidateSizeOnResize />

        {fitPositions.length > 0 && <FitToLocations positions={fitPositions} />}

        {segments.map((segment, index) => (
          <Polyline
            key={index}
            positions={segment}
            pathOptions={
              hasRealRoute
                ? { color: LEG_COLORS[index % LEG_COLORS.length], weight: 5 }
                : { color: LEG_COLORS[index % LEG_COLORS.length], weight: 4, dashArray: "6 8" }
            }
          />
        ))}

        {numberedLocations
          // The depot end point is identical to the start point, so it would
          // just render an invisible duplicate marker stacked on top - skip it.
          .filter(({ location }) => location.id !== DEPOT_END_ID)
          .map(({ location, stopNumber }) => {
            const isDepot = location.id === DEPOT_START_ID;
            const icon = isDepot ? depotIcon : markerIcon;
            const title = isDepot
              ? `Start & Ziel: ${location.label}`
              : `${stopNumber}. ${location.label || "Stopp"}`;

            return (
              <Marker key={location.id} position={[location.lat, location.lng]} icon={icon}>
                <Popup>
                  <strong>{title}</strong>
                  <br />
                  {location.address}
                  <NavigationLink lat={location.lat} lng={location.lng} />
                </Popup>
              </Marker>
            );
          })}

        {focusLocation && (
          <>
            <FlyToFocus position={[focusLocation.lat, focusLocation.lng]} />
            <Marker
              key={`focus-${focusLocation.id}`}
              position={[focusLocation.lat, focusLocation.lng]}
              icon={focusIcon}
            >
              <Popup>
                <strong>{focusLocation.label || "Adresse"}</strong>
                <br />
                {focusLocation.address}
                <NavigationLink lat={focusLocation.lat} lng={focusLocation.lng} />
              </Popup>
            </Marker>
          </>
        )}
      </MapContainer>

      {locations.length > 1 && (
        <div className={styles.routeInfo}>
          {isLoading && <span>Route wird berechnet…</span>}
          {!isLoading && distanceKm !== null && durationMin !== null && (
            <span>
              {distanceKm.toFixed(1)} km · {Math.round(durationMin)} Min
            </span>
          )}
          {!isLoading && error && (
            <span className={styles.routeError}>{error} (Luftlinie angezeigt)</span>
          )}
        </div>
      )}
    </div>
  );
}
