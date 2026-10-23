"use client";

import { useState } from "react";
import { ZoomIn, ZoomOut, RotateCcw, Users, Info } from "lucide-react";
import {
  type EventZone,
  type SeatItem,
  type CategoryCode,
  formatVnd,
} from "@/lib/events-catalog";

export interface StandingSelection {
  zoneId: string;
  zoneName: string;
  ticketTypeId: string;
  price: number;
  quantity: number;
}

interface SeatMapProps {
  zones: EventZone[];
  category: Exclude<CategoryCode, "ALL">;
  selectedSeats: SeatItem[];
  standingSelections: Record<string, number>;
  maxTicketsPerOrder?: number;
  onToggleSeat: (seat: SeatItem) => void;
  onChangeStandingQty: (zone: EventZone, delta: number) => void;
}

export function SeatMap({
  zones,
  category,
  selectedSeats,
  standingSelections,
  maxTicketsPerOrder = 6,
  onToggleSeat,
  onChangeStandingQty,
}: SeatMapProps) {
  const [activeZoneFilter, setActiveZoneFilter] = useState<string>("ALL");
  const [zoom, setZoom] = useState<number>(1);
  const [hoveredSeat, setHoveredSeat] = useState<SeatItem | null>(null);

  const selectedSeatIds = new Set(selectedSeats.map((s) => s.id));

  const totalSelectedCount =
    selectedSeats.length +
    Object.values(standingSelections).reduce((sum, q) => sum + q, 0);

  const stageLabel =
    category === "SPORT"
      ? "SÂN THI ĐẤU CHÍNH"
      : category === "THEATER"
        ? "SÂN KHẤU NHÀ HÁT"
        : "SÂN KHẤU CHÍNH (MAIN STAGE)";

  const frontLeftZone = zones.find((z) => z.layoutPosition === "FRONT_LEFT");
  const frontRightZone = zones.find((z) => z.layoutPosition === "FRONT_RIGHT");
  const standingZone = zones.find(
    (z) => z.layoutPosition === "CENTER_STANDING"
  );
  const lowerTierZone = zones.find((z) => z.layoutPosition === "LOWER_TIER");
  const upperTierZone = zones.find((z) => z.layoutPosition === "UPPER_TIER");

  const handleSeatKeyDown = (
    e: React.KeyboardEvent<SVGGElement>,
    seat: SeatItem
  ) => {
    if (seat.status !== "AVAILABLE") return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onToggleSeat(seat);
    }
  };

  /**
   * Renders a seated zone block inside the SVG coordinate system
   */
  const renderSeatedZoneSvg = (
    zone: EventZone,
    originX: number,
    originY: number,
    blockWidth: number,
    blockHeight: number
  ) => {
    const isDimmed =
      activeZoneFilter !== "ALL" && activeZoneFilter !== zone.zoneId;

    const seatSize = 20;
    const seatGapX = 5;
    const seatGapY = 7;

    const firstRowCount = zone.rows[0]?.seats.length ?? 10;
    const gridWidth = firstRowCount * seatSize + (firstRowCount - 1) * seatGapX;
    const startX = originX + (blockWidth - gridWidth) / 2;
    const startY = originY + 52;

    return (
      <g
        key={zone.zoneId}
        className="transition-opacity duration-200"
        style={{ opacity: isDimmed ? 0.28 : 1 }}
      >
        {/* Zone container background */}
        <rect
          x={originX}
          y={originY}
          width={blockWidth}
          height={blockHeight}
          rx={14}
          fill="#ffffff"
          stroke={activeZoneFilter === zone.zoneId ? "#059669" : "#dfe3e5"}
          strokeWidth={activeZoneFilter === zone.zoneId ? 2 : 1.25}
        />

        {/* Zone Header Pill */}
        <rect
          x={originX + 12}
          y={originY + 10}
          width={blockWidth - 24}
          height={28}
          rx={8}
          fill="#f5f7f8"
        />
        <text
          x={originX + 22}
          y={originY + 28}
          fill="#141d23"
          fontSize="11.5"
          fontWeight="700"
        >
          {zone.zoneName}
        </text>
        <text
          x={originX + blockWidth - 22}
          y={originY + 28}
          textAnchor="end"
          fill="#059669"
          fontSize="11"
          fontWeight="700"
        >
          {formatVnd(zone.price)}
        </text>

        {/* Rows and Seats */}
        {zone.rows.map((row, rowIdx) => {
          const rowY = startY + rowIdx * (seatSize + seatGapY);
          return (
            <g key={`${zone.zoneId}-row-${row.rowLabel}`}>
              {/* Left Row Label */}
              <text
                x={startX - 12}
                y={rowY + 14}
                textAnchor="middle"
                fill="#606970"
                fontSize="10"
                fontWeight="700"
                fontFamily="ui-monospace, monospace"
              >
                {row.rowLabel}
              </text>

              {/* Right Row Label */}
              <text
                x={startX + gridWidth + 12}
                y={rowY + 14}
                textAnchor="middle"
                fill="#606970"
                fontSize="10"
                fontWeight="700"
                fontFamily="ui-monospace, monospace"
              >
                {row.rowLabel}
              </text>

              {row.seats.map((seat, seatIdx) => {
                const seatX = startX + seatIdx * (seatSize + seatGapX);
                const isSelected = selectedSeatIds.has(seat.id);
                const isHovered = hoveredSeat?.id === seat.id;
                const isAvailable = seat.status === "AVAILABLE";
                const isHeld = seat.status === "HELD";

                let fill = "#ffffff";
                let stroke = "#dfe3e5";
                let textFill = "#141d23";

                if (isSelected) {
                  fill = "#059669";
                  stroke = "#059669";
                  textFill = "#ffffff";
                } else if (isAvailable && isHovered) {
                  fill = "#ecfdf5";
                  stroke = "#059669";
                  textFill = "#065f46";
                } else if (isHeld) {
                  fill = "#eff1f2";
                  stroke = "#dfe3e5";
                  textFill = "#606970";
                } else if (!isAvailable) {
                  // SOLD
                  fill = "#f5f7f8";
                  stroke = "#eff1f2";
                  textFill = "#b5bdc2";
                }

                const statusText = isSelected
                  ? "Đang chọn"
                  : isAvailable
                    ? "Còn trống"
                    : isHeld
                      ? "Đang được giữ"
                      : "Đã bán";

                return (
                  <g
                    key={seat.id}
                    role="button"
                    tabIndex={isAvailable ? 0 : -1}
                    aria-pressed={isSelected}
                    aria-disabled={!isAvailable}
                    aria-label={`${zone.zoneName}, Hàng ${row.rowLabel}, Ghế ${seat.seatNumber}, Giá ${formatVnd(seat.price)}, ${statusText}`}
                    onClick={() => {
                      if (isAvailable) onToggleSeat(seat);
                    }}
                    onKeyDown={(e) => handleSeatKeyDown(e, seat)}
                    onMouseEnter={() => setHoveredSeat(seat)}
                    onMouseLeave={() =>
                      setHoveredSeat((prev) =>
                        prev?.id === seat.id ? null : prev
                      )
                    }
                    onFocus={() => setHoveredSeat(seat)}
                    onBlur={() =>
                      setHoveredSeat((prev) =>
                        prev?.id === seat.id ? null : prev
                      )
                    }
                    className={
                      isAvailable
                        ? "cursor-pointer focus:outline-none"
                        : "cursor-not-allowed"
                    }
                  >
                    {/* Seat cushion */}
                    <rect
                      x={seatX}
                      y={rowY}
                      width={seatSize}
                      height={seatSize}
                      rx={5}
                      fill={fill}
                      stroke={stroke}
                      strokeWidth={isSelected || isHovered ? 1.75 : 1.1}
                    />
                    {/* Top backrest indicator */}
                    <line
                      x1={seatX + 4}
                      y1={rowY + 3}
                      x2={seatX + seatSize - 4}
                      y2={rowY + 3}
                      stroke={
                        isSelected
                          ? "rgba(255,255,255,0.55)"
                          : isAvailable
                            ? "#dfe3e5"
                            : "transparent"
                      }
                      strokeWidth={1.5}
                      strokeLinecap="round"
                    />
                    {/* Seat number */}
                    <text
                      x={seatX + seatSize / 2}
                      y={rowY + 14.5}
                      textAnchor="middle"
                      fill={textFill}
                      fontSize="8.5"
                      fontWeight={isSelected ? "700" : "600"}
                      fontFamily="ui-monospace, monospace"
                    >
                      {seat.seatNumber}
                    </text>
                  </g>
                );
              })}
            </g>
          );
        })}
      </g>
    );
  };

  return (
    <div className="rounded-[16px] border border-border bg-background overflow-hidden">
      {/* 1. Top Filter & Zoom Control Bar */}
      <div className="px-4 sm:px-5 py-3.5 border-b border-border flex flex-wrap items-center justify-between gap-3 bg-background">
        {/* Zone Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setActiveZoneFilter("ALL")}
            className={`h-8 px-3 rounded-[8px] text-[12px] transition-colors ${
              activeZoneFilter === "ALL"
                ? "border-[1.5px] border-primary bg-accent text-primary font-semibold"
                : "border border-border bg-background text-foreground font-medium hover:border-muted-foreground"
            }`}
          >
            Tất cả khu vực
          </button>
          {zones.map((zone) => {
            const isActive = activeZoneFilter === zone.zoneId;
            return (
              <button
                key={zone.zoneId}
                type="button"
                onClick={() =>
                  setActiveZoneFilter(isActive ? "ALL" : zone.zoneId)
                }
                className={`h-8 px-3 rounded-[8px] text-[12px] transition-colors inline-flex items-center gap-1.5 ${
                  isActive
                    ? "border-[1.5px] border-primary bg-accent text-primary font-semibold"
                    : "border border-border bg-background text-foreground font-medium hover:border-muted-foreground"
                }`}
              >
                <span>{zone.zoneName}</span>
                <span className="text-[11px] text-muted-foreground font-mono">
                  {Math.round(zone.price / 1000)}k
                </span>
              </button>
            );
          })}
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-1 bg-muted p-1 rounded-[8px] border border-border">
          <button
            type="button"
            onClick={() =>
              setZoom((z) => Math.max(0.85, Number((z - 0.15).toFixed(2))))
            }
            aria-label="Thu nhỏ sơ đồ"
            className="size-7 rounded-[6px] bg-background border border-border flex items-center justify-center text-foreground hover:border-primary transition-colors"
          >
            <ZoomOut className="size-3.5" />
          </button>
          <span className="px-2 text-[11px] font-mono font-semibold text-foreground">
            {Math.round(zoom * 100)}%
          </span>
          <button
            type="button"
            onClick={() =>
              setZoom((z) => Math.min(1.45, Number((z + 0.15).toFixed(2))))
            }
            aria-label="Phóng to sơ đồ"
            className="size-7 rounded-[6px] bg-background border border-border flex items-center justify-center text-foreground hover:border-primary transition-colors"
          >
            <ZoomIn className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={() => {
              setZoom(1);
              setActiveZoneFilter("ALL");
            }}
            aria-label="Đặt lại góc nhìn"
            className="size-7 rounded-[6px] bg-background border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          >
            <RotateCcw className="size-3.5" />
          </button>
        </div>
      </div>

      {/* 2. Legend Bar (Matches DESIGN_TOKENS.md Section 6) */}
      <div className="px-4 sm:px-5 py-2.5 bg-muted/60 border-b border-border flex flex-wrap items-center justify-between gap-3 text-[12px]">
        <div className="flex flex-wrap items-center gap-4">
          <span className="inline-flex items-center gap-1.5 text-foreground font-medium">
            <span className="size-4 rounded-[4px] bg-background border border-border inline-block" />
            Còn trống
          </span>
          <span className="inline-flex items-center gap-1.5 text-foreground font-medium">
            <span className="size-4 rounded-[4px] bg-primary border border-primary inline-block" />
            Đang chọn
          </span>
          <span className="inline-flex items-center gap-1.5 text-muted-foreground">
            <span className="size-4 rounded-[4px] bg-secondary border border-border inline-block" />
            Đang được giữ (5 phút)
          </span>
          <span className="inline-flex items-center gap-1.5 text-muted-foreground">
            <span className="size-4 rounded-[4px] bg-muted border border-border opacity-60 inline-block" />
            Đã bán
          </span>
        </div>

        <div className="text-[12px] text-muted-foreground font-medium">
          Đã chọn:{" "}
          <strong className="text-foreground font-mono">
            {totalSelectedCount}/{maxTicketsPerOrder}
          </strong>{" "}
          vé tối đa mỗi đơn
        </div>
      </div>

      {/* 3. Interactive SVG Canvas */}
      <div className="relative bg-muted/35 overflow-x-auto">
        <div className="min-w-[680px] p-4 sm:p-6 flex justify-center">
          <svg
            viewBox="0 0 820 650"
            className="w-full max-w-[820px] h-auto select-none transition-transform duration-200 origin-top"
            style={{ transform: `scale(${zoom})` }}
            role="region"
            aria-label="Sơ đồ chọn chỗ ngồi sự kiện"
          >
            {/* Subtle Arena Outer Bowl */}
            <rect
              x="12"
              y="10"
              width="796"
              height="628"
              rx="24"
              fill="#f5f7f8"
              stroke="#dfe3e5"
              strokeWidth="1"
            />

            {/* Top Main Stage / Pitch */}
            <g>
              <path
                d="M 190 26 L 630 26 L 600 76 Q 410 92 220 76 Z"
                fill="#141d23"
              />
              {/* Catwalk / Center Stage Extension for Concerts */}
              {standingZone && (
                <rect
                  x="382"
                  y="72"
                  width="56"
                  height="34"
                  rx="8"
                  fill="#141d23"
                />
              )}
              <text
                x="410"
                y="55"
                textAnchor="middle"
                fill="#ffffff"
                fontSize="12"
                fontWeight="800"
                letterSpacing="1.6"
              >
                {stageLabel}
              </text>
            </g>

            {/* Front Left VIP Zone */}
            {frontLeftZone &&
              renderSeatedZoneSvg(
                frontLeftZone,
                28,
                104,
                standingZone ? 310 : 370,
                172
              )}

            {/* Center Standing Zone (Fanzone GA / Cheering Zone) */}
            {standingZone && (
              <g
                className="transition-opacity duration-200"
                style={{
                  opacity:
                    activeZoneFilter !== "ALL" &&
                    activeZoneFilter !== standingZone.zoneId
                      ? 0.28
                      : 1,
                }}
              >
                {(() => {
                  const qty = standingSelections[standingZone.zoneId] ?? 0;
                  const isSelected = qty > 0;
                  return (
                    <g
                      role="button"
                      tabIndex={0}
                      aria-label={`${standingZone.zoneName}, Vé đứng không đánh số ghế, Giá ${formatVnd(standingZone.price)}, Còn ${standingZone.availableCount} vé`}
                      onClick={() => onChangeStandingQty(standingZone, 1)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          onChangeStandingQty(standingZone, 1);
                        }
                      }}
                      className="cursor-pointer focus:outline-none"
                    >
                      <rect
                        x={348}
                        y={114}
                        width={124}
                        height={162}
                        rx={14}
                        fill={isSelected ? "#ecfdf5" : "#ffffff"}
                        stroke={isSelected ? "#059669" : "#dfe3e5"}
                        strokeWidth={isSelected ? 2 : 1.5}
                        strokeDasharray={isSelected ? undefined : "5 3"}
                      />
                      <text
                        x={410}
                        y={146}
                        textAnchor="middle"
                        fill="#141d23"
                        fontSize="10.5"
                        fontWeight="800"
                      >
                        {category === "SPORT"
                          ? "KHU CỔ ĐỘNG VIÊN"
                          : "FANZONE ĐỨNG"}
                      </text>
                      <text
                        x={410}
                        y={163}
                        textAnchor="middle"
                        fill="#059669"
                        fontSize="11"
                        fontWeight="700"
                      >
                        {formatVnd(standingZone.price)}
                      </text>
                      <rect
                        x={364}
                        y={176}
                        width={92}
                        height={24}
                        rx={12}
                        fill={isSelected ? "#059669" : "#f5f7f8"}
                      />
                      <text
                        x={410}
                        y={192}
                        textAnchor="middle"
                        fill={isSelected ? "#ffffff" : "#606970"}
                        fontSize="10"
                        fontWeight="700"
                      >
                        {isSelected
                          ? `Đang chọn: ${qty} vé`
                          : `Còn ${standingZone.availableCount} chỗ`}
                      </text>
                      <text
                        x={410}
                        y={224}
                        textAnchor="middle"
                        fill="#606970"
                        fontSize="9.5"
                        fontWeight="600"
                      >
                        Nhấn để +1 vé đứng
                      </text>
                      <text
                        x={410}
                        y={240}
                        textAnchor="middle"
                        fill="#606970"
                        fontSize="9"
                      >
                        (Khu vực tự do)
                      </text>
                    </g>
                  );
                })()}
              </g>
            )}

            {/* Front Right VIP Zone */}
            {frontRightZone &&
              renderSeatedZoneSvg(
                frontRightZone,
                standingZone ? 482 : 422,
                104,
                standingZone ? 310 : 370,
                172
              )}

            {/* Lower Tier Centered Seated Zone (Rows E, F, G, H) */}
            {lowerTierZone &&
              renderSeatedZoneSvg(lowerTierZone, 145, 292, 530, 172)}

            {/* Upper Tier Centered Seated Zone (Rows J, K, L) */}
            {upperTierZone &&
              renderSeatedZoneSvg(upperTierZone, 145, 478, 530, 144)}
          </svg>
        </div>
      </div>

      {/* 4. Hovered Seat Live Inspector Bar + Standing Zone Stepper */}
      <div className="px-4 sm:px-5 py-3 border-t border-border bg-background flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-h-[28px]">
          <Info className="size-4 text-primary shrink-0" />
          {hoveredSeat ? (
            <div className="text-[13px] text-foreground flex flex-wrap items-center gap-2">
              <span className="font-bold">{hoveredSeat.zoneName}</span>
              <span className="text-muted-foreground">•</span>
              <span className="font-mono font-semibold">
                Hàng {hoveredSeat.rowLabel} - Ghế {hoveredSeat.seatNumber}
              </span>
              <span className="text-muted-foreground">•</span>
              <span className="font-bold text-primary">
                {formatVnd(hoveredSeat.price)}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-muted text-muted-foreground">
                {selectedSeatIds.has(hoveredSeat.id)
                  ? "Đang chọn"
                  : hoveredSeat.status === "AVAILABLE"
                    ? "Còn trống"
                    : hoveredSeat.status === "HELD"
                      ? "Đang được giữ"
                      : "Đã bán"}
              </span>
            </div>
          ) : (
            <span className="text-[12px] text-muted-foreground">
              Di chuột hoặc nhấn vào từng ghế trên sơ đồ để xem số ghế, hàng và
              giá vé chi tiết.
            </span>
          )}
        </div>

        {/* Standing Zone Quick Stepper if event has a standing zone */}
        {standingZone && (
          <div className="flex items-center gap-3 self-start sm:self-auto bg-muted/70 px-3 py-1.5 rounded-[10px] border border-border shrink-0">
            <div className="flex items-center gap-1.5 text-[12px] whitespace-nowrap">
              <Users className="size-3.5 text-primary shrink-0" />
              <span className="font-bold text-foreground">
                {standingZone.zoneName}:
              </span>
              <span className="font-semibold text-primary">
                {formatVnd(standingZone.price)}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => onChangeStandingQty(standingZone, -1)}
                disabled={(standingSelections[standingZone.zoneId] ?? 0) <= 0}
                aria-label="Giảm số lượng vé đứng"
                className="size-6 rounded-[6px] bg-background border border-border font-bold text-[13px] flex items-center justify-center text-foreground disabled:opacity-40 hover:border-primary"
              >
                -
              </button>
              <span className="w-5 text-center font-mono text-[12px] font-bold text-foreground">
                {standingSelections[standingZone.zoneId] ?? 0}
              </span>
              <button
                type="button"
                onClick={() => onChangeStandingQty(standingZone, 1)}
                disabled={totalSelectedCount >= maxTicketsPerOrder}
                aria-label="Tăng số lượng vé đứng"
                className="size-6 rounded-[6px] bg-background border border-border font-bold text-[13px] flex items-center justify-center text-foreground disabled:opacity-40 hover:border-primary"
              >
                +
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
