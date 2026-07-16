import type { DeliveryLocation } from "@/types/location";

export const DEPOT_LABEL = "Apotheke AlphaPoint";
export const DEPOT_ADDRESS = "Öjendorfer Damm 50, 22043 Hamburg, Deutschland";
export const DEPOT_LAT = 53.5712221;
export const DEPOT_LNG = 10.1366129;

export const DEPOT_START_ID = "depot-start";
export const DEPOT_END_ID = "depot-end";

// Every route starts and ends at the pharmacy depot, regardless of which
// stops are selected - it's a fixed constant, not an address-book entry.
export function createDepotStop(id: typeof DEPOT_START_ID | typeof DEPOT_END_ID): DeliveryLocation {
  return {
    id,
    label: DEPOT_LABEL,
    address: DEPOT_ADDRESS,
    lat: DEPOT_LAT,
    lng: DEPOT_LNG,
    createdAt: 0,
  };
}

export function isDepotStop(id: string): boolean {
  return id === DEPOT_START_ID || id === DEPOT_END_ID;
}
