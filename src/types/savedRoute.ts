import type { RouteStopRef } from "@/lib/routeStop";

export interface SavedRoute {
  id: string;
  name: string;
  stops: RouteStopRef[];
  createdAt: number;
}
