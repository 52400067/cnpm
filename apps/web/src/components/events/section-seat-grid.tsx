"use client";

import React, { useState, useMemo, useCallback, useRef, memo, useEffect } from "react";
import { Plus, Minus, RotateCcw, AlertCircle, Users, Check, Flame } from "lucide-react";
import { EventSeatItem, SelectedSeatItem, SeatStatus } from "./seat-map.types";
import { formatVnd } from "@/lib/events-catalog";

interface SectionSeatGridProps {
  zoneId: string;
  zoneName: string;
  basePrice: number;
  isStanding?: boolean;
  standingCapacity?: number;
  standingQuantity?: number;
  onStandingQuantityChange?: (qty: number) => void;
  selectedSeats: SelectedSeatItem[];
  onToggleSeat: (seat: SelectedSeatItem) => void;
  maxSeats?: number;
  onExceedMax?: (max: number) => void;
  recentlyHeldSeatId?: string | null;
  onBackToOverview?: () => void;
}

// ─── Individual Seat Dot (High performance SVG Node) ───────────────────────
interface SeatDotProps {
  seat: EventSeatItem;
  isSelected: boolean;
  isJustHeld: boolean;
  onSelect: (seat: EventSeatItem) => void;
  onHover: (seat: EventSeatItem | null) => void;
}

const SeatDot = memo(function SeatDot({
  seat,
  isSelected,
  isJustHeld,
  onSelect,
  onHover,
}: SeatDotProps) {
  const isAvailable = seat.status === "AVAILABLE";
  const isHeld = seat.status === "HELD" || isJustHeld;
  const isSold = seat.status === "SOLD";

  // Colors aligned with docs/DESIGN_TOKENS.md
  let fill = "#ffffff";
  let stroke = "#10b981";
  let strokeWidth = 1.2;
  let cursorClass = "cursor-pointer";

  if (isSelected) {
    fill = "#059669";
    stroke = "#047857";
    strokeWidth = 1.5;
  } else if (isHeld) {
    fill = "#fef3c7";
    stroke = "#d97706";
    strokeWidth = 1;
    cursorClass = "cursor-not-allowed";
  } else if (isSold) {
    fill = "#f1f5f9";
    stroke = "#cbd5e1";
    strokeWidth = 1;
    cursorClass = "cursor-not-allowed";
  }

  return (
    <g
      transform={`translate(${seat.x}, ${seat.y})`}
      className={cursorClass}
      onClick={(e) => {
        e.stopPropagation();
        if (isAvailable || isSelected) {
          onSelect(seat);
        }
      }}
      onMouseEnter={() => onHover(seat)}
      onMouseLeave={() => onHover(null)}
    >
      {/* Halo for selected or just-held seats */}
      {isSelected && (
        <circle r={9} fill="#059669" opacity={0.18} />
      )}
      {isJustHeld && (
        <circle r={10} fill="#d97706" opacity={0.25} className="animate-ping" style={{ animationDuration: "1.5s" }} />
      )}

      {/* Main seat circle */}
      <circle
        r={6}
        fill={fill}
        stroke={stroke}
        strokeWidth={strokeWidth}
        vectorEffect="non-scaling-stroke"
      />

      {/* Checkmark inside selected seat */}
      {isSelected && (
        <path
          d="M -2.5 -0.5 L -0.5 1.5 L 2.5 -1.5"
          stroke="#ffffff"
          strokeWidth={1.2}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      )}
    </g>
  );
});

// ─── Seat Generator for realistic section loading ───────────────────────────
function generateSectionSeats(zoneId: string, zoneName: string, price: number): EventSeatItem[] {
  const rows = ["A", "B", "C", "D", "E", "F", "G", "H", "J", "K", "L", "M"];
  const seatsPerRow = 18;
  const list: EventSeatItem[] = [];

  const startX = 60;
  const startY = 60;
  const gapX = 22;
  const gapY = 24;

  rows.forEach((row, rIdx) => {
    for (let num = 1; num <= seatsPerRow; num++) {
      const code = `${row}${String(num).padStart(2, "0")}`;
      const id = `seat-${zoneId}-${code}`;

      // Realistic pseudo-random initial status based on position
      const pseudoHash = (rIdx * 37 + num * 13) % 100;
      let status: SeatStatus = "AVAILABLE";
      if (pseudoHash > 82) {
        status = "SOLD";
      } else if (pseudoHash > 75) {
        status = "HELD";
      }

      list.push({
        id,
        code,
        row,
        number: num,
        tier: zoneName,
        zoneId,
        price,
        status,
        x: startX + (num - 1) * gapX,
        y: startY + rIdx * gapY,
      });
    }
  });

  return list;
}

export function SectionSeatGrid({
  zoneId,
  zoneName,
  basePrice,
  isStanding = false,
  standingCapacity = 200,
  standingQuantity = 1,
  onStandingQuantityChange,
  selectedSeats,
  onToggleSeat,
  maxSeats = 6,
  onExceedMax,
  recentlyHeldSeatId,
  onBackToOverview,
}: SectionSeatGridProps) {
  // Seats dataset
  const [seatsData, setSeatsData] = useState<EventSeatItem[]>(() =>
    generateSectionSeats(zoneId, zoneName, basePrice)
  );

  // Update when zone changes
  useEffect(() => {
    setSeatsData(generateSectionSeats(zoneId, zoneName, basePrice));
  }, [zoneId, zoneName, basePrice]);

  // If a seat was recently held in real-time, update its state immediately
  useEffect(() => {
    if (!recentlyHeldSeatId) return;
    setSeatsData((prev) =>
      prev.map((s) => (s.id === recentlyHeldSeatId ? { ...s, status: "HELD" } : s))
    );
  }, [recentlyHeldSeatId]);

  // Selected seat IDs set for O(1) lookup
  const selectedSeatIds = useMemo(() => {
    return new Set(selectedSeats.map((s) => s.id));
  }, [selectedSeats]);

  // Pan & Zoom state
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const panStartRef = useRef({ x: 0, y: 0 });
  const [hoveredSeat, setHoveredSeat] = useState<EventSeatItem | null>(null);

  const handleZoomIn = () => setZoom((z) => Math.min(2.5, Number((z + 0.25).toFixed(2))));
  const handleZoomOut = () => setZoom((z) => Math.max(0.65, Number((z - 0.25).toFixed(2))));
  const handleReset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Touch / Mouse navigation
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    panStartRef.current = { ...pan };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    setPan({
      x: panStartRef.current.x + dx,
      y: panStartRef.current.y + dy,
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  // Seat toggle handler
  const handleSeatClick = useCallback(
    (seat: EventSeatItem) => {
      const isAlreadySelected = selectedSeatIds.has(seat.id);
      if (!isAlreadySelected && selectedSeats.length >= maxSeats) {
        if (onExceedMax) onExceedMax(maxSeats);
        return;
      }

      onToggleSeat({
        id: seat.id,
        code: seat.code,
        row: seat.row,
        price: seat.price,
        tierName: zoneName,
        zoneId: seat.zoneId,
      });
    },
    [selectedSeatIds, selectedSeats.length, maxSeats, onExceedMax, onToggleSeat, zoneName]
  );

  // Standing Zone ticket counter handlers
  const handleIncrementStanding = () => {
    if (standingQuantity >= maxSeats) {
      if (onExceedMax) onExceedMax(maxSeats);
      return;
    }
    if (onStandingQuantityChange) {
      onStandingQuantityChange(standingQuantity + 1);
    }
  };

  const handleDecrementStanding = () => {
    if (standingQuantity <= 1) return;
    if (onStandingQuantityChange) {
      onStandingQuantityChange(standingQuantity - 1);
    }
  };

  // Standing Zone UI
  if (isStanding) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-6 bg-white select-none">
        <div className="w-full max-w-md bg-[#f8fafc] border border-[#dfe3e5] rounded-[12px] p-6 space-y-5 text-center shadow-xs">
          <div className="size-12 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-primary mx-auto">
            <Users className="size-6" />
          </div>

          <div className="space-y-1">
            <span className="text-[11px] font-bold text-primary uppercase tracking-wider">
              Khu vực vé đứng tự do
            </span>
            <h3 className="text-[18px] font-bold text-[#141d23]">{zoneName}</h3>
            <p className="text-[13px] text-[#606970]">
              Khách hàng tự do chọn vị trí đứng trong khu vực Fanzone. Không phân chia số ghế.
            </p>
          </div>

          {/* Ticket Counter */}
          <div className="bg-white border border-[#dfe3e5] rounded-[10px] p-4 flex items-center justify-between">
            <div className="text-left">
              <span className="text-[12px] text-[#606970] block">Số lượng vé</span>
              <span className="text-[11px] text-emerald-700 font-medium">
                (Tối đa {maxSeats} vé / đơn)
              </span>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleDecrementStanding}
                disabled={standingQuantity <= 1}
                aria-label="Giảm số lượng vé đứng"
                className="size-9 rounded-[8px] border border-[#dfe3e5] hover:bg-[#f5f7f8] disabled:opacity-40 flex items-center justify-center text-[#141d23] transition-colors"
              >
                <Minus className="size-4" />
              </button>

              <span className="w-8 text-center font-mono text-[18px] font-bold text-[#141d23]">
                {standingQuantity}
              </span>

              <button
                type="button"
                onClick={handleIncrementStanding}
                disabled={standingQuantity >= maxSeats}
                aria-label="Tăng số lượng vé đứng"
                className="size-9 rounded-[8px] border border-[#dfe3e5] hover:bg-[#f5f7f8] disabled:opacity-40 flex items-center justify-center text-[#141d23] transition-colors"
              >
                <Plus className="size-4" />
              </button>
            </div>
          </div>

          {/* Price summary */}
          <div className="flex items-center justify-between px-1 text-[13px]">
            <span className="text-[#606970]">Tổng tiền tạm tính:</span>
            <span className="text-[17px] font-bold text-primary font-mono">
              {formatVnd(basePrice * standingQuantity)}
            </span>
          </div>

          {onBackToOverview && (
            <button
              type="button"
              onClick={onBackToOverview}
              className="text-[12.5px] text-[#606970] hover:text-[#141d23] underline transition-colors pt-2 block mx-auto"
            >
              ← Quay lại toàn cảnh khán đài
            </button>
          )}
        </div>
      </div>
    );
  }

  // Seated Section Grid UI
  return (
    <div
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      className="relative w-full h-full bg-[#f8fafc] overflow-hidden select-none cursor-grab active:cursor-grabbing flex flex-col"
      role="region"
      aria-label={`Sơ đồ chi tiết hàng ghế ${zoneName}`}
    >
      {/* Top Header bar inside section view */}
      <div className="absolute top-4 left-4 right-16 z-20 flex items-center justify-between pointer-events-none">
        <div className="bg-white/95 backdrop-blur-xs px-3.5 py-1.5 rounded-[8px] border border-[#dfe3e5] shadow-xs flex items-center gap-2 pointer-events-auto text-[12px]">
          {onBackToOverview && (
            <button
              type="button"
              onClick={onBackToOverview}
              className="font-bold text-primary hover:underline flex items-center gap-1 mr-1"
            >
              ← Sơ đồ tổng
            </button>
          )}
          <span className="text-[#606970]">| Đang chọn ghế:</span>
          <span className="font-bold text-[#141d23]">{zoneName}</span>
          <span className="text-[#606970] font-mono">({formatVnd(basePrice)}/ghế)</span>
        </div>
      </div>

      {/* Zoom Toolbar */}
      <div className="absolute top-4 right-4 z-20 flex flex-col rounded-[8px] bg-white border border-[#dfe3e5] shadow-xs overflow-hidden">
        <button
          type="button"
          onClick={handleZoomIn}
          aria-label="Phóng to hàng ghế"
          className="size-8 flex items-center justify-center text-[#141d23] hover:bg-[#f5f7f8] border-b border-[#dfe3e5]"
        >
          <Plus className="size-3.5" />
        </button>
        <button
          type="button"
          onClick={handleZoomOut}
          aria-label="Thu nhỏ hàng ghế"
          className="size-8 flex items-center justify-center text-[#141d23] hover:bg-[#f5f7f8] border-b border-[#dfe3e5]"
        >
          <Minus className="size-3.5" />
        </button>
        <button
          type="button"
          onClick={handleReset}
          aria-label="Khôi phục góc nhìn"
          className="size-8 flex items-center justify-center text-[#141d23] hover:bg-[#f5f7f8]"
        >
          <RotateCcw className="size-3" />
        </button>
      </div>

      {/* Hover tooltip for hovered seat */}
      {hoveredSeat && (
        <div className="absolute top-14 left-4 z-30 pointer-events-none bg-[#141d23] text-white px-3 py-1.5 rounded-[6px] shadow-md text-[11.5px] flex items-center gap-2">
          <span className="font-mono font-bold">Ghế {hoveredSeat.code}</span>
          <span className="text-[#a7f3d0] font-mono">{formatVnd(hoveredSeat.price)}</span>
          <span className="text-[10px] text-slate-300">
            {hoveredSeat.status === "AVAILABLE"
              ? "Còn trống"
              : hoveredSeat.status === "HELD"
              ? "Đang giữ"
              : "Đã bán"}
          </span>
        </div>
      )}

      {/* SVG Canvas for seats */}
      <div
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: "center center",
          transition: isDragging ? "none" : "transform 0.1s ease-out",
        }}
        className="w-full h-full flex items-center justify-center p-8 gpu-layer"
      >
        <svg
          viewBox="0 0 520 380"
          className="w-full h-full max-w-[700px] max-h-[500px]"
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Stage direction label */}
          <g transform="translate(260, 20)">
            <rect x={-80} y={-10} width={160} height={20} rx={4} fill="#e2e8f0" stroke="#cbd5e1" />
            <text
              x={0}
              y={4}
              fontSize="9"
              fontWeight="700"
              fill="#606970"
              textAnchor="middle"
              letterSpacing="1"
            >
              HƯỚNG SÂN KHẤU ↑
            </text>
          </g>

          {/* Row Labels (Left & Right) */}
          {["A", "B", "C", "D", "E", "F", "G", "H", "J", "K", "L", "M"].map((row, rIdx) => {
            const y = 60 + rIdx * 24;
            return (
              <React.Fragment key={`row-label-${row}`}>
                <text
                  x={36}
                  y={y + 3.5}
                  fontSize="10"
                  fontWeight="700"
                  fill="#606970"
                  fontFamily="var(--font-mono), monospace"
                  textAnchor="middle"
                >
                  {row}
                </text>
                <text
                  x={474}
                  y={y + 3.5}
                  fontSize="10"
                  fontWeight="700"
                  fill="#606970"
                  fontFamily="var(--font-mono), monospace"
                  textAnchor="middle"
                >
                  {row}
                </text>
              </React.Fragment>
            );
          })}

          {/* Render all individual seat dots */}
          {seatsData.map((seat) => (
            <SeatDot
              key={seat.id}
              seat={seat}
              isSelected={selectedSeatIds.has(seat.id)}
              isJustHeld={seat.id === recentlyHeldSeatId}
              onSelect={handleSeatClick}
              onHover={setHoveredSeat}
            />
          ))}
        </svg>
      </div>

      {/* Legend inside section view */}
      <div className="absolute bottom-3 left-4 z-20 flex items-center gap-4 bg-white/90 backdrop-blur-xs px-3 py-1.5 rounded-[8px] border border-[#dfe3e5] text-[11px] text-[#606970]">
        <div className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-white border border-[#10b981]" />
          <span>Còn trống</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-[#059669] border border-[#047857]" />
          <span className="font-bold text-primary">Đang chọn</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-[#fef3c7] border border-[#d97706]" />
          <span>Đang giữ</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-[#f1f5f9] border border-[#cbd5e1]" />
          <span>Đã bán</span>
        </div>
      </div>
    </div>
  );
}
