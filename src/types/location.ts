export interface DeliveryLocation {
  id: string;
  address: string;
  label?: string;
  openingHours?: string;
  lat: number;
  lng: number;
  createdAt: number;
  createdBy?: { id: string; name: string };
}
