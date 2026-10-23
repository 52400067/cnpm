import { SeatMapData, SeatZone, Seat, SeatTier, SeatStatus } from "./seatmap.types";

interface ZoneConfig {
  id: string;
  name: string;
  tier: SeatTier;
  basePrice: number;
  color: string;
  startRadius: number;
  rowsCount: number;
  seatsPerRow: number;
  angleStart: number;
  angleEnd: number;
}

export function generateConcertSeatMap(seatCountTarget: number = 2000): SeatMapData {
  const viewBoxWidth  = 1400;
  const viewBoxHeight = 1100;
  const stageWidth    = 560;
  const stageHeight   = 90;
  const stageX        = (viewBoxWidth - stageWidth) / 2;
  const stageY        = 50;

  const stage = {
    label: "SÂN KHẤU CHÍNH (MAIN STAGE)",
    x: stageX,
    y: stageY,
    width: stageWidth,
    height: stageHeight,
  };

  const zonesConfig: ZoneConfig[] = [
    {
      id: "zone-vip",
      name: "Khu vực VIP (Gần sân khấu)",
      tier: "VIP",
      basePrice: 1_800_000,
      color: "#f59e0b",   // Amber gold
      startRadius: 210,
      rowsCount: 8,
      seatsPerRow: 42,
      angleStart: Math.PI * 0.18,
      angleEnd:   Math.PI * 0.82,
    },
    {
      id: "zone-std-a",
      name: "Khán đài A (Trung tâm)",
      tier: "STANDARD",
      basePrice: 950_000,
      color: "#10b981",   // Emerald
      startRadius: 410,
      rowsCount: 14,
      seatsPerRow: 56,
      angleStart: Math.PI * 0.15,
      angleEnd:   Math.PI * 0.85,
    },
    {
      id: "zone-std-b",
      name: "Khán đài B (Cánh trái & phải)",
      tier: "STANDARD",
      basePrice: 650_000,
      color: "#3b82f6",   // Royal blue
      startRadius: 720,
      rowsCount: 10,
      seatsPerRow: 64,
      angleStart: Math.PI * 0.12,
      angleEnd:   Math.PI * 0.88,
    },
    {
      id: "zone-eco",
      name: "Khán đài C (Tầng trên)",
      tier: "ECONOMY",
      basePrice: 350_000,
      color: "#8b5cf6",   // Violet
      startRadius: 940,
      rowsCount: 6,
      seatsPerRow: 50,
      angleStart: Math.PI * 0.15,
      angleEnd:   Math.PI * 0.85,
    },
  ];

  const centerX = viewBoxWidth / 2;
  const centerY = 110; // Focal point above stage
  let totalGenerated = 0;

  const zones: SeatZone[] = zonesConfig.map((zConf) => {
    const seats: Seat[] = [];
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

    for (let r = 0; r < zConf.rowsCount; r++) {
      const rowLabel =
        alphabet[r % alphabet.length] +
        (r >= alphabet.length ? Math.floor(r / alphabet.length) : "");
      const currentRadius = zConf.startRadius + r * 22;
      const angleStep =
        (zConf.angleEnd - zConf.angleStart) / (zConf.seatsPerRow - 1);

      for (let s = 1; s <= zConf.seatsPerRow; s++) {
        if (totalGenerated >= seatCountTarget) break;

        const angle = zConf.angleStart + (s - 1) * angleStep;
        const x = Math.round(centerX + currentRadius * Math.cos(angle));
        const y = Math.round(centerY + currentRadius * Math.sin(angle));

        // Deterministic status — no Math.random() so renders are consistent
        const det = (s * 37 + r * 19) % 100;
        let status: SeatStatus = "AVAILABLE";
        if (det < 22)              status = "SOLD";
        else if (det >= 22 && det < 28) status = "HELD";

        const seatId = `${zConf.id}-${rowLabel}-${s}`;
        const code =
          zConf.tier === "VIP"
            ? `VIP-${rowLabel}${s}`
            : `${zConf.id.replace("zone-", "").toUpperCase()}-${rowLabel}${s}`;

        seats.push({
          id: seatId,
          code,
          rowLabel,
          seatNumber: s,
          x,
          y,
          radius: 6,
          tier: zConf.tier,
          price: zConf.basePrice,
          status,
          zoneId: zConf.id,
        });

        totalGenerated++;
      }
      if (totalGenerated >= seatCountTarget) break;
    }

    return {
      id: zConf.id,
      name: zConf.name,
      tier: zConf.tier,
      basePrice: zConf.basePrice,
      color: zConf.color,
      seats,
    };
  });

  return {
    eventId: "ev-demo-2026",
    eventName: "TicketHub Mega Concert 2026",
    viewBoxWidth,
    viewBoxHeight,
    stage,
    zones,
    totalSeats: totalGenerated,
  };
}
