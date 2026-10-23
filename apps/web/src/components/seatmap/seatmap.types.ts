export type SeatTier = "VIP" | "STANDARD" | "ECONOMY";

export type SeatStatus = "AVAILABLE" | "SELECTED" | "HELD" | "SOLD";

export interface Seat {
  id: string;
  code: string;       // e.g. "VIP-A-12"
  rowLabel: string;   // e.g. "A"
  seatNumber: number; // e.g. 12
  x: number;
  y: number;
  radius?: number;
  tier: SeatTier;
  price: number;      // VND
  status: SeatStatus;
  zoneId: string;
  heldExpiresAt?: string | null;
}

export interface SeatZone {
  id: string;
  name: string;       // e.g. "Khán đài A (VIP)"
  tier: SeatTier;
  basePrice: number;
  color: string;      // hex — used for legend dots
  seats: Seat[];
}

export interface StageConfig {
  label?: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface SeatMapData {
  eventId: string;
  eventName: string;
  viewBoxWidth: number;
  viewBoxHeight: number;
  stage: StageConfig;
  zones: SeatZone[];
  totalSeats: number;
}

export interface SeatMapProps {
  data: SeatMapData;
  selectedSeats?: Seat[];
  maxSelectable?: number;
  onSeatSelect?: (seat: Seat) => void;
  onSeatDeselect?: (seat: Seat) => void;
  onSelectionChange?: (selectedSeats: Seat[]) => void;
  className?: string;
  readOnly?: boolean;
}
