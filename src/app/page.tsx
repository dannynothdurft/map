"use client";

import { useState, type FormEvent } from "react";
import dynamic from "next/dynamic";
import { useAddressBook } from "@/hooks/useAddressBook";
import { useRoutePlan } from "@/hooks/useRoutePlan";
import { useSavedRoutes } from "@/hooks/useSavedRoutes";
import AppSidebar, { type PanelKey } from "@/components/AppSidebar/AppSidebar";
import AddressForm from "@/components/AddressForm/AddressForm";
import AddressBook from "@/components/AddressBook/AddressBook";
import RouteList from "@/components/RouteList/RouteList";
import SavedRoutesList from "@/components/SavedRoutesList/SavedRoutesList";
import { createDepotStop, DEPOT_END_ID, DEPOT_START_ID } from "@/lib/depot";
import { resolveRouteStop, type RouteStopRef } from "@/lib/routeStop";
import type { DeliveryLocation } from "@/types/location";
import styles from "./page.module.scss";

const MapView = dynamic(() => import("@/components/MapView/MapView"), {
  ssr: false,
});

export default function Home() {
  const {
    addresses,
    isLoaded: addressesLoaded,
    addAddress,
    removeAddress,
    updateAddress,
  } = useAddressBook();
  const {
    stops,
    isLoaded: routeLoaded,
    addStop,
    addAdHocStop,
    removeStop,
    moveStop,
    clearStops,
    setStops,
  } = useRoutePlan();
  const { routes, saveRoute, deleteRoute } = useSavedRoutes();

  const [activePanel, setActivePanel] = useState<PanelKey>("tour");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [focusedLocation, setFocusedLocation] = useState<DeliveryLocation | null>(null);

  const [routeName, setRouteName] = useState("");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  const selectedStops = stops
    .map((ref) => resolveRouteStop(ref, addresses))
    .filter((location): location is DeliveryLocation => Boolean(location));

  // Only plain address-book references count for the "in route" toggle in
  // the address book - ad-hoc stops aren't address-book entries at all.
  const routeAddressIds = stops.filter((ref): ref is string => typeof ref === "string");

  // Every route starts and ends at the fixed pharmacy depot.
  const mapLocations =
    selectedStops.length > 0
      ? [createDepotStop(DEPOT_START_ID), ...selectedStops, createDepotStop(DEPOT_END_ID)]
      : [];

  const isLoaded = addressesLoaded && routeLoaded;

  function handlePanelChange(panel: PanelKey) {
    setActivePanel(panel);
    setIsSidebarOpen(true);
    // "Routen" has no per-stop focus action, so there's nothing to keep highlighted there.
    if (panel === "routen") setFocusedLocation(null);
  }

  function handleDeleteAddress(id: string) {
    removeAddress(id);
    removeStop(id);
    setFocusedLocation((current) => (current?.id === id ? null : current));
  }

  function handleAddAdHocStop(location: DeliveryLocation) {
    addAdHocStop({
      label: location.label,
      address: location.address,
      lat: location.lat,
      lng: location.lng,
    });
  }

  function handleLoadRoute(loadedStops: RouteStopRef[]) {
    setStops(loadedStops);
    setActivePanel("tour");
  }

  async function handleSaveRoute(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedName = routeName.trim();
    if (!trimmedName || stops.length === 0) return;

    setSaveError(null);
    try {
      await saveRoute(trimmedName, stops);
      setSavedMessage(`Route "${trimmedName}" gespeichert.`);
      setRouteName("");
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Speichern fehlgeschlagen.");
    }
  }

  return (
    <div className={styles.page}>
      <AppSidebar
        activePanel={activePanel}
        onPanelChange={handlePanelChange}
        isOpen={isSidebarOpen}
        onToggleOpen={() => setIsSidebarOpen((open) => !open)}
      >
        {activePanel === "tour" && (
          <>
            <RouteList
              locations={selectedStops}
              selectedId={focusedLocation?.id}
              onRemove={removeStop}
              onMove={moveStop}
              onClear={clearStops}
              onSelect={setFocusedLocation}
            />

            <AddressForm onSave={handleAddAdHocStop} submitLabel="Extra-Stopp hinzufügen" />

            {selectedStops.length > 0 && (
              <form className={styles.saveForm} onSubmit={handleSaveRoute}>
                <input
                  type="text"
                  value={routeName}
                  onChange={(event) => {
                    setRouteName(event.target.value);
                    setSavedMessage(null);
                  }}
                  placeholder="Name für diese Route"
                  required
                />
                <button type="submit">Route speichern</button>
              </form>
            )}

            {saveError && <p className={styles.error}>{saveError}</p>}
            {savedMessage && <p className={styles.savedMessage}>{savedMessage}</p>}
          </>
        )}

        {activePanel === "adressbuch" && (
          <>
            <AddressForm onSave={addAddress} />
            <AddressBook
              addresses={addresses}
              routeStopIds={routeAddressIds}
              selectedId={focusedLocation?.id}
              onAddToRoute={addStop}
              onRemoveFromRoute={removeStop}
              onDelete={handleDeleteAddress}
              onSelect={setFocusedLocation}
              onUpdate={updateAddress}
            />
          </>
        )}

        {activePanel === "routen" && (
          <SavedRoutesList
            routes={routes}
            addresses={addresses}
            onLoad={handleLoadRoute}
            onDelete={deleteRoute}
          />
        )}
      </AppSidebar>

      <div className={styles.mapArea}>
        {isLoaded && <MapView locations={mapLocations} focusLocation={focusedLocation} />}
      </div>
    </div>
  );
}
