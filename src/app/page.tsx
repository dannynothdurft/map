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
import type { DeliveryLocation } from "@/types/location";
import styles from "./page.module.scss";

const MapView = dynamic(() => import("@/components/MapView/MapView"), {
  ssr: false,
});

const PANEL_TITLES: Record<PanelKey, string> = {
  tour: "Tour",
  adressbuch: "Adressbuch",
  routen: "Gespeicherte Routen",
};

export default function Home() {
  const {
    addresses,
    isLoaded: addressesLoaded,
    addAddress,
    removeAddress,
    updateAddress,
  } = useAddressBook();
  const {
    stopIds,
    isLoaded: routeLoaded,
    addStop,
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

  const selectedStops = stopIds
    .map((id) => addresses.find((address) => address.id === id))
    .filter((address): address is DeliveryLocation => Boolean(address));

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

  function handleLoadRoute(ids: string[]) {
    setStops(ids);
    setActivePanel("tour");
  }

  async function handleSaveRoute(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedName = routeName.trim();
    if (!trimmedName || stopIds.length === 0) return;

    setSaveError(null);
    try {
      await saveRoute(trimmedName, stopIds);
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
        panelTitle={PANEL_TITLES[activePanel]}
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
              routeStopIds={stopIds}
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
