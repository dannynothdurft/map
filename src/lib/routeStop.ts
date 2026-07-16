import type { DeliveryLocation } from "@/types/location";

// A stop in a tour is either a reference to an address-book entry (plain id
// string - resolved live, so edits to the address book propagate), or an
// ad-hoc stop that only exists for this one route and is never saved to the
// address book.
export interface AdHocStop {
  id: string;
  isAdHoc: true;
  label?: string;
  address: string;
  lat: number;
  lng: number;
}

export type RouteStopRef = string | AdHocStop;

export function routeStopId(ref: RouteStopRef): string {
  return typeof ref === "string" ? ref : ref.id;
}

export function resolveRouteStop(
  ref: RouteStopRef,
  addresses: DeliveryLocation[],
): DeliveryLocation | null {
  if (typeof ref === "string") {
    return addresses.find((address) => address.id === ref) ?? null;
  }

  return {
    id: ref.id,
    label: ref.label,
    address: ref.address,
    lat: ref.lat,
    lng: ref.lng,
    createdAt: 0,
  };
}
