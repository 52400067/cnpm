"use client";

import React, { useCallback, useEffect, useRef, memo } from "react";
import { Seat, SeatMapProps, SeatTier } from "./seatmap.types";
import { useSeatMap } from "./use-seatmap";
import { Plus, Minus, RotateCcw, CheckCircle2, Clock, Ticket, X, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

// ─── Color mapping (Light Mode Optimized) ──────────────────────────────────
function getSeatColors(seat: Seat, isSelected: boolean) {
  if (isSelected) {
    return { fill: "#f97316", stroke: "#ffffff", strokeWidth: 2, opacity: 1 };
  }
  if (seat.status === "HELD") {
    return { fill: "#fef3c7", stroke: "#d97706", strokeWidth: 1.2, opacity: 0.85 };
  }
  if (seat.status === "SOLD") {
    return { fill: "#e2e8f0", stroke: "#cbd5e1", strokeWidth: 1, opacity: 0.7 };
  }
  const tierFill: Record<SeatTier, string> = {
    VIP: "#f59e0b",
    STANDARD: "#10b981",
    ECONOMY: "#8b5cf6",
  };
  return { fill: tierFill[seat.tier] ?? "#10b981", stroke: "#ffffff", strokeWidth: 1, opacity: 1 };
}

// ─── SeatNode (memoized for high-performance 2,000 seats) ───────────────────
const SeatNode = memo(({
  seat, isSelected, onToggle, onHover,
}: {
  seat: Seat;
  isSelected: boolean;
  onToggle: (seat: Seat) => void;
  onHover: (seat: Seat | null) => void;
}) => {
  const isInteractive = seat.status === "AVAILABLE" || isSelected;
  const { fill, stroke, strokeWidth, opacity } = getSeatColors(seat, isSelected);
  const r = seat.radius ?? 6;

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
        r={r}
        fill={fill}
        stroke={stroke}
        strokeWidth={strokeWidth}
        opacity={opacity}
        vectorEffect="non-scaling-stroke"
        style={{ willChange: "transform" }}
      />
      {isSelected && (
        <circle
          r={r + 3.5}
          fill="none"
          stroke="#f97316"
          strokeWidth={1.5}
          strokeDasharray="2.5 2"
          vectorEffect="non-scaling-stroke"
          className="animate-seat-pulse"
        />
      )}
    </g>
  );
});
SeatNode.displayName = "SeatNode";

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
    handleToggleSeat, totalPrice,
  } = useSeatMap({ data, selectedSeats, maxSelectable, onSeatSelect, onSeatDeselect, onSelectionChange, readOnly });

  const closeToast = useCallback(() => setToastMessage(null), [setToastMessage]);

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-[660px] bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm flex flex-col no-select gpu-layer ${className}`}
      role="region"
      aria-label={`Sơ đồ ghế — ${data.eventName}`}
    >
      {/* Toast */}
      {toastMessage && <SeatMapToast message={toastMessage} onClose={closeToast} />}

      {/* Hover tooltip */}
      {hoveredSeat && <SeatTooltip seat={hoveredSeat} />}

      {/* ── Top Header ── */}
      <div className="absolute top-4 left-4 z-20 bg-white/95 backdrop-blur-md px-4 py-2.5 rounded-xl border border-slate-200/90 flex items-center gap-3 shadow-sm">
        <div className="size-8 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
          <Ticket className="size-4" />
        </div>
        <div>
          <span className="font-bold text-slate-900 text-[13px] block leading-tight">{data.eventName}</span>
          <span className="text-slate-500 text-[11px]">
            {data.totalSeats.toLocaleString("vi-VN")} ghế · {data.zones.length} khu vực
          </span>
        </div>
      </div>

      {/* ── Zoom controls ── */}
      <div className="absolute top-4 right-4 z-20 flex flex-col gap-1.5 bg-white/95 backdrop-blur-md p-1.5 rounded-xl border border-slate-200/90 shadow-sm">
        <Button variant="ghost" size="icon" className="size-8 text-slate-700 hover:text-slate-900 hover:bg-slate-100"
          onClick={() => handleZoom(0.78)} title="Phóng to" aria-label="Phóng to sơ đồ ghế">
          <Plus className="size-4" />
        </Button>
        <Button variant="ghost" size="icon" className="size-8 text-slate-700 hover:text-slate-900 hover:bg-slate-100"
          onClick={() => handleZoom(1.28)} title="Thu nhỏ" aria-label="Thu nhỏ sơ đồ ghế">
          <Minus className="size-4" />
        </Button>
        <div className="h-px bg-slate-200 mx-1" />
        <Button variant="ghost" size="icon" className="size-8 text-slate-700 hover:text-slate-900 hover:bg-slate-100"
          onClick={resetView} title="Khôi phục view" aria-label="Khôi phục view gốc">
          <RotateCcw className="size-3.5" />
        </Button>
        <div className="text-[9px] font-bold text-center text-slate-400 tabular-nums select-none">
          {zoomPercent}%
        </div>
      </div>

      {/* ── Legend (desktop) ── */}
      <div
        className="absolute bottom-20 left-4 z-20 hidden md:flex flex-wrap items-center gap-3 bg-white/95 backdrop-blur-md px-4 py-2 rounded-xl border border-slate-200/90 text-[11px] text-slate-700 shadow-sm max-w-[460px]"
        aria-label="Chú thích màu ghế"
      >
        {data.zones.map((zone) => (
          <div key={zone.id} className="flex items-center gap-1.5">
            <span className="size-3 rounded-full shrink-0 border border-black/10" style={{ backgroundColor: zone.color }} />
            <span className="whitespace-nowrap font-medium">
              {zone.name.split("(")[0].trim()}
              <span className="text-slate-400 ml-1">({(zone.basePrice / 1000).toFixed(0)}k)</span>
            </span>
          </div>
        ))}
        <div className="flex items-center gap-1.5">
          <span className="size-3 rounded-full bg-orange-500 ring-2 ring-orange-300/40 shrink-0" />
          <span className="text-orange-600 font-semibold">Đang chọn</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="size-3 rounded-full bg-amber-100 border border-amber-500 shrink-0" />
          <span className="text-slate-500">Đang giữ</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="size-3 rounded-full bg-slate-200 border border-slate-300 shrink-0" />
          <span className="text-slate-400">Đã bán</span>
        </div>
      </div>

      {/* ── SVG canvas ── */}
      <svg
        ref={svgRef}
        className="w-full h-full cursor-grab active:cursor-grabbing touch-none bg-slate-50/50"
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
            <stop offset="0%"   stopColor="#ecfdf5" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#d1fae5" stopOpacity="0.4" />
          </linearGradient>
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

        {/* Zones */}
        {data.zones.map((zone) => (
          <g key={zone.id} id={`zone-${zone.id}`} role="group" aria-label={zone.name}>
            {zone.seats.map((seat) => (
              <SeatNode
                key={seat.id}
                seat={seat}
                isSelected={selectedSeatIds.has(seat.id)}
                onToggle={handleToggleSeat}
                onHover={handleHoverSeat}
              />
            ))}
          </g>
        ))}
      </svg>

      {/* ── Bottom selection bar ── */}
      <div className="absolute bottom-3 inset-x-3 z-30 bg-white/95 backdrop-blur-md p-3.5 rounded-2xl border border-slate-200 shadow-xl flex flex-wrap items-center justify-between gap-2.5 text-slate-900">
        <div className="flex items-center gap-3 min-w-0">
          <div className="hidden sm:flex size-10 rounded-xl bg-emerald-50 border border-emerald-100 items-center justify-center text-emerald-600 shrink-0">
            <CheckCircle2 className="size-5" />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] text-slate-500 leading-tight">
              Ghế đang chọn:{" "}
              <span className="font-semibold text-slate-900 truncate">
                {internalSelected.length > 0 ? internalSelected.map((s) => s.code).join(", ") : "Chưa chọn ghế nào"}
              </span>
            </div>
            <div className="text-sm font-bold text-emerald-600 leading-tight mt-0.5">
              {totalPrice > 0 ? `Tổng: ${totalPrice.toLocaleString("vi-VN")} ₫` : "Chọn ghế để xem giá"}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          {internalSelected.length > 0 && (
            <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-amber-700 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200">
              <Clock className="size-3.5 animate-pulse shrink-0 text-amber-600" />
              <span>Giữ chỗ 5 phút</span>
            </div>
          )}
          <Button
            size="sm"
            className="rounded-xl px-5 font-semibold text-xs h-9 bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 transition-all active:scale-95 cursor-pointer"
            disabled={internalSelected.length === 0}
            aria-label={`Giữ ${internalSelected.length} vé và thanh toán`}
            onClick={() => {
              if (internalSelected.length === 0) return;
              alert(`✅ Giữ ${internalSelected.length} ghế:\n${internalSelected.map((s) => s.code).join(", ")}\n\nTổng: ${totalPrice.toLocaleString("vi-VN")} ₫\n\n→ Chuyển sang thanh toán VNPay`);
            }}
          >
            Giữ vé & Thanh toán ({internalSelected.length}/{maxSelectable})
          </Button>
        </div>
      </div>
    </div>
  );
}
