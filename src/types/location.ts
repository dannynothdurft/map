export interface DeliveryLocation {
  id: string;
  address: string;
  label?: string;
  lat: number;
  lng: number;
  createdAt: number;
}
