"use client";

import React, { useCallback, useEffect, useRef, memo, useState, useMemo } from "react";
import { Seat, SeatMapProps, SeatTier } from "./seatmap.types";
import { useSeatMap } from "./use-seatmap";
import {
  Plus, Minus, RotateCcw, CheckCircle2, Clock, Ticket, X,
  AlertTriangle, Filter, Check, Eye, Navigation
} from "lucide-react";
import { Button } from "@/components/ui/button";

// ─── Color mapping (Light Mode Optimized) ──────────────────────────────────
function getSeatColors(seat: Seat, isSelected: boolean) {
  if (isSelected) {
    return { fill: "#ea580c", stroke: "#ffffff", strokeWidth: 2, opacity: 1 };
  }
  if (seat.status === "HELD") {
    return { fill: "#fef3c7", stroke: "#d97706", strokeWidth: 1.2, opacity: 0.85 };
  }
  if (seat.status === "SOLD") {
    return { fill: "#e2e8f0", stroke: "#cbd5e1", strokeWidth: 1, opacity: 0.65 };
  }
  const tierFill: Record<SeatTier, string> = {
    VIP: "#f59e0b",
    STANDARD: "#10b981",
    ECONOMY: "#8b5cf6",
  };
  return { fill: tierFill[seat.tier] ?? "#10b981", stroke: "#ffffff", strokeWidth: 1, opacity: 1 };
}

// ─── SeatNode (memoized for high-performance 2,000 seats) ───────────────────
interface SeatNodeProps {
  seat: Seat;
  isSelected: boolean;
  isDimmed: boolean;
  onToggle: (seat: Seat) => void;
  onHover: (seat: Seat | null) => void;
}

const SeatNode = memo(({
  seat, isSelected, isDimmed, onToggle, onHover,
}: SeatNodeProps) => {
  const isInteractive = seat.status === "AVAILABLE" || isSelected;
  const { fill, stroke, strokeWidth, opacity: baseOpacity } = getSeatColors(seat, isSelected);
  const r = seat.radius ?? 6;

  // Dim unselected seats when other seats are selected or zone is filtered
  const finalOpacity = isSelected ? 1 : isDimmed ? baseOpacity * 0.32 : baseOpacity;

  return (
    <g
      transform={`translate(${seat.x}, ${seat.y})`}
      className={isInteractive ? "cursor-pointer" : "cursor-not-allowed"}
      role={isInteractive ? "button" : undefined}
      aria-label={
        isInteractive
          ? `Ghế ${seat.code} — ${seat.tier} — ${seat.price.toLocaleString("vi-VN")}₫`
          : undefined
      }
      onClick={(e) => { e.stopPropagation(); if (isInteractive) onToggle(seat); }}
      onMouseEnter={() => onHover(seat)}
      onMouseLeave={() => onHover(null)}
    >
      <circle
        r={isSelected ? r + 1.5 : r}
        fill={fill}
        stroke={stroke}
        strokeWidth={isSelected ? 2 : strokeWidth}
        opacity={finalOpacity}
        vectorEffect="non-scaling-stroke"
        style={{ willChange: "transform", transition: "opacity 0.2s ease" }}
      />
    </g>
  );
});
SeatNode.displayName = "SeatNode";

// ─── Top Layer: Prominent Highlight & Pin Markers for Selected Seats ────────
const SelectedSeatsOverlay = memo(({
  seats,
  onToggle,
  onHover,
}: {
  seats: Seat[];
  onToggle: (seat: Seat) => void;
  onHover: (seat: Seat | null) => void;
}) => {
  if (seats.length === 0) return null;

  return (
    <g id="selected-seats-overlay">
      {seats.map((seat) => (
        <g
          key={`selected-overlay-${seat.id}`}
          transform={`translate(${seat.x}, ${seat.y})`}
          className="cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            onToggle(seat);
          }}
          onMouseEnter={() => onHover(seat)}
          onMouseLeave={() => onHover(null)}
        >
          {/* 1. Radar wave pulse */}
          <circle
            r={18}
            fill="#f97316"
            opacity={0.35}
            className="animate-ping"
            style={{ animationDuration: "2s" }}
          />

          {/* 2. Outer glowing ring */}
          <circle
            r={12.5}
            fill="#fff7ed"
            stroke="#f97316"
            strokeWidth={1.8}
            opacity={0.95}
          />

          {/* 3. Solid center circle with drop shadow */}
          <circle
            r={8.5}
            fill="#ea580c"
            stroke="#ffffff"
            strokeWidth={2.4}
            filter="url(#selectedShadow)"
          />

          {/* 4. White checkmark inside seat */}
          <path
            d="M -3 0 L -0.5 2.5 L 3.5 -1.8"
            stroke="#ffffff"
            strokeWidth={1.8}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />

          {/* 5. Floating Pin Marker Badge above seat */}
          <g transform="translate(0, -29)" filter="url(#badgeShadow)">
            {/* Pill background */}
            <rect
              x={-28}
              y={-13}
              width={56}
              height={20}
              rx={5}
              fill="#0f172a"
              stroke="#f97316"
              strokeWidth={1.4}
            />
            {/* Downward triangle pointer */}
            <polygon points="0,10 -4,7 4,7" fill="#0f172a" />
            {/* Seat code label */}
            <text
              x={0}
              y={1}
              fill="#ffffff"
              fontSize="9.5"
              fontWeight="700"
              textAnchor="middle"
              fontFamily="monospace"
              dominantBaseline="middle"
            >
              {seat.code}
            </text>
          </g>
        </g>
      ))}
    </g>
  );
});
SelectedSeatsOverlay.displayName = "SelectedSeatsOverlay";

// ─── Seat tooltip ──────────────────────────────────────────────────────────
const TIER_LABELS: Record<SeatTier, string> = {
  VIP:      "VIP — Hạng đặc biệt",
  STANDARD: "Khán đài tiêu chuẩn",
  ECONOMY:  "Khán đài phổ thông",
};
const STATUS_META: Record<string, { label: string; colorClass: string }> = {
  AVAILABLE: { label: "Còn trống",    colorClass: "text-emerald-600" },
  HELD:      { label: "Đang giữ chỗ", colorClass: "text-amber-600"  },
  SOLD:      { label: "Đã bán",       colorClass: "text-slate-400"  },
};

function SeatTooltip({ seat }: { seat: Seat }) {
  const meta = STATUS_META[seat.status] ?? STATUS_META.AVAILABLE;
  return (
    <div className="pointer-events-none absolute top-4 left-1/2 -translate-x-1/2 z-50 animate-fade-in-up">
      <div className="bg-white/95 backdrop-blur-md border border-slate-200 rounded-xl shadow-xl px-4 py-3 text-xs text-slate-900 min-w-[180px] space-y-1.5">
        <div className="font-bold text-sm tracking-tight text-slate-900">{seat.code}</div>
        <div className="text-slate-500">{TIER_LABELS[seat.tier]}</div>
        <div className={`font-semibold ${meta.colorClass}`}>{meta.label}</div>
        <div className="pt-1 border-t border-slate-100 font-bold text-emerald-600">
          {seat.price.toLocaleString("vi-VN")} ₫
        </div>
      </div>
    </div>
  );
}

// ─── Toast notification ────────────────────────────────────────────────────
function SeatMapToast({ message, onClose }: { message: string; onClose: () => void }) {
  const t = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    t.current = setTimeout(onClose, 3200);
    return () => clearTimeout(t.current!);
  }, [onClose]);
  return (
    <div className="absolute top-16 left-1/2 -translate-x-1/2 z-[60] animate-fade-in-up">
      <div className="flex items-center gap-2 bg-amber-500 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-xl border border-amber-400">
        <AlertTriangle className="size-3.5 shrink-0" />
        <span>{message}</span>
        <button onClick={onClose} className="ml-1 hover:opacity-75 transition-opacity" aria-label="Đóng thông báo">
          <X className="size-3.5" />
        </button>
      </div>
    </div>
  );
}

// ─── Main SeatMap component ────────────────────────────────────────────────
export function SeatMap({
  data,
  selectedSeats = [],
  maxSelectable = 6,
  onSeatSelect,
  onSeatDeselect,
  onSelectionChange,
  className = "",
  readOnly = false,
}: SeatMapProps) {
  const {
    svgRef, containerRef,
    viewBox, zoomPercent, resetView,
    handleZoom, handleWheel,
    handlePointerDown, handlePointerMove, handlePointerUp,
    internalSelected, selectedSeatIds,
    hoveredSeat, handleHoverSeat,
    toastMessage, setToastMessage,
    handleToggleSeat, focusOnSeat, totalPrice,
  } = useSeatMap({ data, selectedSeats, maxSelectable, onSeatSelect, onSeatDeselect, onSelectionChange, readOnly });

  const [activeZoneFilter, setActiveZoneFilter] = useState<string>("ALL");

  const closeToast = useCallback(() => setToastMessage(null), [setToastMessage]);

  const hasSelections = internalSelected.length > 0;

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-[680px] bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm flex flex-col no-select gpu-layer ${className}`}
      role="region"
      aria-label={`Sơ đồ ghế — ${data.eventName}`}
    >
      {/* Toast */}
      {toastMessage && <SeatMapToast message={toastMessage} onClose={closeToast} />}

      {/* Hover tooltip */}
      {hoveredSeat && <SeatTooltip seat={hoveredSeat} />}

      {/* ── Top Header & Zone Filter ── */}
      <div className="absolute top-4 inset-x-4 z-20 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
        {/* Left: Event Info */}
        <div className="bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-xl border border-slate-200/90 flex items-center gap-2.5 shadow-xs pointer-events-auto">
          <div className="size-7 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
            <Ticket className="size-3.5" />
          </div>
          <div>
            <span className="font-bold text-slate-900 text-xs block leading-tight">{data.eventName}</span>
            <span className="text-slate-500 text-[10px]">
              {data.totalSeats.toLocaleString("vi-VN")} ghế · {data.zones.length} khu vực
            </span>
          </div>
        </div>

        {/* Center: Zone Filter Buttons (Giúp người dùng không bị rối mắt) */}
        <div className="bg-white/95 backdrop-blur-md p-1 rounded-xl border border-slate-200/90 shadow-xs flex items-center gap-1 pointer-events-auto">
          <button
            type="button"
            onClick={() => setActiveZoneFilter("ALL")}
            className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-colors cursor-pointer ${
              activeZoneFilter === "ALL"
                ? "bg-slate-900 text-white shadow-2xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            Tất cả khu vực
          </button>
          {data.zones.map((z) => (
            <button
              key={z.id}
              type="button"
              onClick={() => setActiveZoneFilter(z.id)}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-colors cursor-pointer ${
                activeZoneFilter === z.id
                  ? "bg-emerald-600 text-white shadow-2xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              <span
                className="size-2 rounded-full border border-black/10 shrink-0"
                style={{ backgroundColor: z.color }}
              />
              <span>{z.name.split("(")[0].trim()}</span>
            </button>
          ))}
        </div>

        {/* Right: Zoom controls */}
        <div className="flex flex-col gap-1 bg-white/95 backdrop-blur-md p-1 rounded-xl border border-slate-200/90 shadow-xs pointer-events-auto">
          <Button variant="ghost" size="icon" className="size-7 text-slate-700 hover:text-slate-900 hover:bg-slate-100 cursor-pointer"
            onClick={() => handleZoom(0.78)} title="Phóng to" aria-label="Phóng to sơ đồ ghế">
            <Plus className="size-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="size-7 text-slate-700 hover:text-slate-900 hover:bg-slate-100 cursor-pointer"
            onClick={() => handleZoom(1.28)} title="Thu nhỏ" aria-label="Thu nhỏ sơ đồ ghế">
            <Minus className="size-3.5" />
          </Button>
          <div className="h-px bg-slate-200 mx-0.5" />
          <Button variant="ghost" size="icon" className="size-7 text-slate-700 hover:text-slate-900 hover:bg-slate-100 cursor-pointer"
            onClick={resetView} title="Khôi phục view" aria-label="Khôi phục view gốc">
            <RotateCcw className="size-3" />
          </Button>
          <div className="text-[9px] font-bold text-center text-slate-400 tabular-nums select-none">
            {zoomPercent}%
          </div>
        </div>
      </div>

      {/* ── Legend (desktop) ── */}
      <div
        className="absolute bottom-24 left-4 z-20 hidden md:flex flex-wrap items-center gap-3 bg-white/95 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-slate-200/90 text-[11px] text-slate-700 shadow-xs max-w-[480px]"
        aria-label="Chú thích màu ghế"
      >
        {data.zones.map((zone) => (
          <div key={zone.id} className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full shrink-0 border border-black/10" style={{ backgroundColor: zone.color }} />
            <span className="whitespace-nowrap font-medium text-[10.5px]">
              {zone.name.split("(")[0].trim()}
              <span className="text-slate-400 ml-1">({(zone.basePrice / 1000).toFixed(0)}k)</span>
            </span>
          </div>
        ))}
        <div className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-orange-600 ring-2 ring-orange-300/40 shrink-0" />
          <span className="text-orange-600 font-bold text-[10.5px]">Đang chọn</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-amber-100 border border-amber-500 shrink-0" />
          <span className="text-slate-500 text-[10.5px]">Đang giữ</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-slate-200 border border-slate-300 shrink-0" />
          <span className="text-slate-400 text-[10.5px]">Đã bán</span>
        </div>
      </div>

      {/* ── SVG canvas ── */}
      <svg
        ref={svgRef}
        className="w-full h-full cursor-grab active:cursor-grabbing touch-none bg-slate-50/40"
        viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}`}
        preserveAspectRatio="xMidYMid meet"
        onWheel={handleWheel}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="stageGlowLight" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%"   stopColor="#ecfdf5" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#d1fae5" stopOpacity="0.45" />
          </linearGradient>

          {/* High-visibility drop shadows for selected seats and pins */}
          <filter id="selectedShadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#ea580c" floodOpacity="0.5" />
          </filter>
          <filter id="badgeShadow" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="2" stdDeviation="2.5" floodColor="#000000" floodOpacity="0.3" />
          </filter>
        </defs>

        {/* Stage */}
        <g id="stage-group">
          {/* Main Stage Rectangle with smooth rounded corners */}
          <rect
            x={data.stage.x}
            y={data.stage.y}
            width={data.stage.width}
            height={data.stage.height}
            rx={16}
            fill="url(#stageGlowLight)"
            stroke="#10b981"
            strokeWidth={1.8}
          />
          {/* Front runway apron curve facing the audience */}
          <path
            d={`M ${data.stage.x + 36} ${data.stage.y + data.stage.height} Q ${data.stage.x + data.stage.width / 2} ${data.stage.y + data.stage.height + 22} ${data.stage.x + data.stage.width - 36} ${data.stage.y + data.stage.height} Z`}
            fill="#d1fae5"
            stroke="#10b981"
            strokeWidth={1.8}
          />
          {/* Stage Primary Title */}
          <text
            x={data.stage.x + data.stage.width / 2}
            y={data.stage.y + 40}
            fill="#065f46"
            fontSize="15"
            fontWeight="700"
            textAnchor="middle"
            letterSpacing="2.5"
            fontFamily="Inter, sans-serif"
          >
            SÂN KHẤU CHÍNH
          </text>
          {/* Stage Secondary Subtitle */}
          <text
            x={data.stage.x + data.stage.width / 2}
            y={data.stage.y + 62}
            fill="#059669"
            fontSize="11"
            fontWeight="600"
            textAnchor="middle"
            letterSpacing="3"
            opacity={0.85}
            fontFamily="Inter, sans-serif"
          >
            MAIN STAGE
          </text>
        </g>

        {/* Zones (Base seats) */}
        {data.zones.map((zone) => {
          const isZoneActive = activeZoneFilter === "ALL" || activeZoneFilter === zone.id;
          return (
            <g
              key={zone.id}
              id={`zone-${zone.id}`}
              role="group"
              aria-label={zone.name}
              style={{
                opacity: isZoneActive ? 1 : 0.12,
                transition: "opacity 0.25s ease",
              }}
            >
              {zone.seats.map((seat) => {
                const isSelected = selectedSeatIds.has(seat.id);
                // When seats are selected, dim the unselected seats to make selected ones pop
                const isDimmed = hasSelections && !isSelected;
                return (
                  <SeatNode
                    key={seat.id}
                    seat={seat}
                    isSelected={isSelected}
                    isDimmed={isDimmed}
                    onToggle={handleToggleSeat}
                    onHover={handleHoverSeat}
                  />
                );
              })}
            </g>
          );
        })}

        {/* TOP LAYER: Highlight overlay and Pin Badges for Selected Seats */}
        <SelectedSeatsOverlay
          seats={internalSelected}
          onToggle={handleToggleSeat}
          onHover={handleHoverSeat}
        />
      </svg>

      {/* ── Bottom selection bar ── */}
      <div className="absolute bottom-3 inset-x-3 z-30 bg-white/95 backdrop-blur-md p-3 rounded-2xl border border-slate-200/90 shadow-xl flex flex-wrap items-center justify-between gap-3 text-slate-900">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="hidden sm:flex size-9 rounded-xl bg-emerald-50 border border-emerald-100 items-center justify-center text-emerald-600 shrink-0">
            <CheckCircle2 className="size-4.5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-medium text-slate-500">Ghế đang chọn ({internalSelected.length}/{maxSelectable}):</span>
              {hasSelections && (
                <span className="text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                  Nhấn vào mã ghế để định vị
                </span>
              )}
            </div>

            {/* Clickable seat chips to jump/focus */}
            {hasSelections ? (
              <div className="flex flex-wrap items-center gap-1.5 mt-1">
                {internalSelected.map((s) => (
                  <span
                    key={s.id}
                    onClick={() => focusOnSeat(s)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-xs font-bold bg-orange-50 text-orange-700 border border-orange-200 shadow-2xs hover:bg-orange-100 cursor-pointer transition-colors"
                    title="Nhấn để phóng to định vị ghế này"
                  >
                    <Navigation className="size-2.5 text-orange-500 shrink-0" />
                    <span>{s.code}</span>
                    <span className="text-[10px] text-orange-500 font-normal">
                      ({(s.price / 1000).toFixed(0)}k)
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleSeat(s);
                      }}
                      className="ml-0.5 p-0.5 hover:text-red-600 rounded transition-colors"
                      title="Bỏ chọn ghế này"
                    >
                      <X className="size-3" />
                    </button>
                  </span>
                ))}
              </div>
            ) : (
              <div className="text-xs text-slate-400 mt-0.5">Click vào các ghế có màu trên sơ đồ để chọn chỗ</div>
            )}
          </div>
        </div>

        {/* Total & Action */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right">
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Tổng thanh toán</div>
            <div className="text-base font-extrabold text-emerald-600 leading-tight">
              {totalPrice > 0 ? `${totalPrice.toLocaleString("vi-VN")} ₫` : "0 ₫"}
            </div>
          </div>

          <Button
            size="sm"
            className="rounded-xl px-5 font-semibold text-xs h-9 bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 transition-all active:scale-95 cursor-pointer"
            disabled={internalSelected.length === 0}
            aria-label={`Giữ ${internalSelected.length} vé và thanh toán`}
            onClick={() => {
              if (internalSelected.length === 0) return;
              alert(`✅ Đã chọn ${internalSelected.length} ghế:\n${internalSelected.map((s) => s.code).join(", ")}\n\nTổng: ${totalPrice.toLocaleString("vi-VN")} ₫\n\n→ Chuyển sang thanh toán`);
            }}
          >
            Tiếp tục thanh toán ({internalSelected.length})
          </Button>
        </div>
      </div>
    </div>
  );
}
