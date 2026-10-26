export type SeatStatus = "AVAILABLE" | "HELD" | "SOLD" | "SELECTED";

export interface EventSeatItem {
  id: string;
  code: string;
  row: string;
  number: number;
  tier: string;
  zoneId: string;
  price: number;
  status: SeatStatus;
  x: number;
  y: number;
}

export interface SelectedSeatItem {
  id: string;
  code: string;
  row: string;
  price: number;
  tierName: string;
  zoneId: string;
}

export interface MinimapViewport {
  x: number;
  y: number;
  width: number;
  height: number;
}
