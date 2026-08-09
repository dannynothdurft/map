import type { WithId } from "mongodb";
import type { DeliveryLocation } from "@/types/location";

export interface AddressDocument {
  label?: string;
  address: string;
  openingHours?: string;
  lat: number;
  lng: number;
  createdAt: number;
  createdBy?: { id: string; name: string };
}

export function toAddress(doc: WithId<AddressDocument>): DeliveryLocation {
  return {
    id: doc._id.toString(),
    label: doc.label,
    address: doc.address,
    openingHours: doc.openingHours,
    lat: doc.lat,
    lng: doc.lng,
    createdAt: doc.createdAt,
    createdBy: doc.createdBy,
  };
}
