"use client";

import React, { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { Plus, Minus, Maximize2, AlertTriangle, X, Check, Radio, Layers, Users, Zap } from "lucide-react";
import { VENUE_SVG, type VenueMapKey } from "@/lib/venue-svg.generated";
import { formatVnd } from "@/lib/events-catalog";
import { SelectedSeatItem } from "./seat-map.types";
import { SeatMinimap } from "./seat-minimap";
import { SectionSeatGrid } from "./section-seat-grid";

export interface SeatMapProps {
  mapKey: VenueMapKey;
  activeZoneId?: string | null;
  hoveredZoneId?: string | null;
  zoneInfoMap?: Record<string, { name: string; minPrice: number; count: number }>;
  onSelectZone: (zoneId: string | null) => void;
  onHoverZone: (zoneId: string | null) => void;
  // UC04 interactive seat selection props
  selectedSeats?: SelectedSeatItem[];
  onSeatsChange?: (seats: SelectedSeatItem[]) => void;
  maxSeats?: number;
  standingQuantity?: number;
  onStandingQuantityChange?: (qty: number) => void;
  onProceedToHold?: () => void;
}

export function SeatMap(props: SeatMapProps) {
  return <SeatMapView key={props.mapKey} {...props} />;
}

function SeatMapView({
  mapKey,
  activeZoneId,
  hoveredZoneId,
  zoneInfoMap = {},
  onSelectZone,
  onHoverZone,
  selectedSeats = [],
  onSeatsChange,
  maxSeats = 6,
  standingQuantity = 1,
  onStandingQuantityChange,
  onProceedToHold,
}: SeatMapProps) {
  const mapData = VENUE_SVG[mapKey] || VENUE_SVG["arena-t-stage"];

  // View mode: "OVERVIEW" (stadium SVG) or "SECTION_SEATS" (detailed seat grid)
  const [viewMode, setViewMode] = useState<"OVERVIEW" | "SECTION_SEATS">("OVERVIEW");

  // Local state for internal selected seats if not controlled from parent
  const [internalSelected, setInternalSelected] = useState<SelectedSeatItem[]>(selectedSeats);
  const activeSeats = onSeatsChange ? selectedSeats : internalSelected;

  const updateSeats = useCallback(
    (newSeats: SelectedSeatItem[]) => {
      if (onSeatsChange) {
        onSeatsChange(newSeats);
      } else {
        setInternalSelected(newSeats);
      }
    },
    [onSeatsChange]
  );

  // Pan, Zoom & Dragging
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const panStartRef = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ w: 800, h: 600 });

  // Real-time conflict state
  const [recentlyHeldSeatId, setRecentlyHeldSeatId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Measure container dimensions for Minimap
  useEffect(() => {
    if (!containerRef.current) return;
    const updateSize = () => {
      if (containerRef.current) {
        setContainerSize({
          w: containerRef.current.clientWidth,
          h: containerRef.current.clientHeight,
        });
      }
    };
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  // When activeZoneId changes, switch to detailed view if a valid zone is selected
  useEffect(() => {
    if (activeZoneId && zoneInfoMap[activeZoneId]) {
      setViewMode("SECTION_SEATS");
    } else {
      setViewMode("OVERVIEW");
    }
  }, [activeZoneId, zoneInfoMap]);

  // Tooltip for overview hover
  const [tooltip, setTooltip] = useState<{
    price: number;
    name: string;
    x: number;
    y: number;
  } | null>(null);

  const handleZoomIn = () => setZoom((z) => Math.min(2.5, Number((z + 0.25).toFixed(2))));
  const handleZoomOut = () => setZoom((z) => Math.max(0.75, Number((z - 0.25).toFixed(2))));
  const handleReset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    onSelectZone(null);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    panStartRef.current = { ...pan };
  };

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (isDragging) {
        const dx = e.clientX - dragStartRef.current.x;
        const dy = e.clientY - dragStartRef.current.y;
        setPan({
          x: panStartRef.current.x + dx,
          y: panStartRef.current.y + dy,
        });
        return;
      }

      const target = (e.target as Element).closest("[data-zone]");
      if (target) {
        const zid = target.getAttribute("data-zone");
        if (zid && zoneInfoMap[zid]) {
          onHoverZone(zid);
          const rect = containerRef.current?.getBoundingClientRect();
          if (rect) {
            setTooltip({
              price: zoneInfoMap[zid].minPrice,
              name: zoneInfoMap[zid].name,
              x: e.clientX - rect.left,
              y: e.clientY - rect.top,
            });
          }
          return;
        }
      }
      onHoverZone(null);
      setTooltip(null);
    },
    [isDragging, onHoverZone, zoneInfoMap]
  );

  const handleMouseUp = () => setIsDragging(false);

  // Click on overview zone
  const handleClick = (e: React.MouseEvent) => {
    const dx = Math.abs(e.clientX - dragStartRef.current.x);
    const dy = Math.abs(e.clientY - dragStartRef.current.y);
    if (dx > 5 || dy > 5) return;

    const target = (e.target as Element).closest("[data-zone]");
    if (target) {
      const zid = target.getAttribute("data-zone");
      if (zid && zoneInfoMap[zid]) {
        onSelectZone(activeZoneId === zid ? null : zid);
        return;
      }
    }
    onSelectZone(null);
  };

  // Toggle seat selection
  const handleToggleSeat = useCallback(
    (seat: SelectedSeatItem) => {
      const exists = activeSeats.some((s) => s.id === seat.id);
      if (exists) {
        updateSeats(activeSeats.filter((s) => s.id !== seat.id));
      } else {
        if (activeSeats.length >= maxSeats) {
          setToastMessage(`Bạn chỉ được chọn tối đa ${maxSeats} ghế trên mỗi đơn hàng.`);
          return;
        }
        updateSeats([...activeSeats, seat]);
      }
    },
    [activeSeats, maxSeats, updateSeats]
  );

  // Remove individual seat chip
  const handleRemoveSeat = (seatId: string) => {
    updateSeats(activeSeats.filter((s) => s.id !== seatId));
  };

  // Calculate total price
  const totalPrice = useMemo(() => {
    return activeSeats.reduce((sum, s) => sum + s.price, 0);
  }, [activeSeats]);

  // Check if active zone is a standing section
  const isStandingActive = useMemo(() => {
    if (!activeZoneId || !zoneInfoMap[activeZoneId]) return false;
    const name = zoneInfoMap[activeZoneId].name.toUpperCase();
    return name.includes("ĐỨNG") || name.includes("FANZONE") || name.includes("GA");
  }, [activeZoneId, zoneInfoMap]);

  // Simulation: Trigger real-time hold conflict (UC04 test case)
  const handleSimulateRealtimeConflict = () => {
    const randomRow = ["A", "B", "C", "D", "E"][Math.floor(Math.random() * 5)];
    const randomNum = Math.floor(Math.random() * 18) + 1;
    const fakeCode = `${randomRow}${String(randomNum).padStart(2, "0")}`;
    const fakeId = `seat-${activeZoneId || "zone"}-${fakeCode}`;

    setRecentlyHeldSeatId(fakeId);
    setToastMessage(`Thông báo thời gian thực: Ghế ${fakeCode} vừa được một người mua khác giữ chỗ!`);

    // If user was currently selecting this seat, remove it
    if (activeSeats.some((s) => s.code === fakeCode)) {
      updateSeats(activeSeats.filter((s) => s.code !== fakeCode));
      setToastMessage(`Ghế ${fakeCode} bạn đang chọn vừa bị người khác giữ trước (SEAT_ALREADY_HELD). Đã cập nhật.`);
    }

    setTimeout(() => {
      setRecentlyHeldSeatId(null);
    }, 4500);
  };

  return (
    <div
      ref={containerRef}
      role="region"
      aria-label="Sơ đồ khán đài tương tác"
      className="relative w-full h-full bg-[#f8fafc] overflow-hidden select-none flex flex-col font-sans"
    >
      {/* Toast Notification (clean standard design token alert) */}
      {toastMessage && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="flex items-center gap-2 bg-[#141d23] text-white text-[12px] font-medium px-4 py-2 rounded-[8px] shadow-lg border border-black/10 max-w-md">
            <AlertTriangle className="size-4 text-amber-400 shrink-0" />
            <span className="flex-1">{toastMessage}</span>
            <button
              type="button"
              onClick={() => setToastMessage(null)}
              className="p-1 hover:text-slate-300 rounded transition-colors"
              aria-label="Đóng thông báo"
            >
              <X className="size-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Floating Mode Switcher (Toàn cảnh / Hàng ghế) */}
      {activeZoneId && (
        <div className="absolute top-4 left-4 z-20 flex items-center gap-1.5 bg-white p-1 rounded-[8px] border border-[#dfe3e5] shadow-xs">
          <button
            type="button"
            onClick={() => setViewMode("OVERVIEW")}
            className={`px-3 py-1 text-[12px] font-semibold rounded-[6px] transition-colors ${
              viewMode === "OVERVIEW"
                ? "bg-primary text-white"
                : "text-[#606970] hover:text-[#141d23] hover:bg-[#f5f7f8]"
            }`}
          >
            Toàn cảnh khán đài
          </button>
          <button
            type="button"
            onClick={() => setViewMode("SECTION_SEATS")}
            className={`px-3 py-1 text-[12px] font-semibold rounded-[6px] transition-colors ${
              viewMode === "SECTION_SEATS"
                ? "bg-primary text-white"
                : "text-[#606970] hover:text-[#141d23] hover:bg-[#f5f7f8]"
            }`}
          >
            Chọn ghế chi tiết
          </button>
        </div>
      )}

      {/* Floating Toolbar: Zoom, Reset, Real-time Simulation */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
        {/* Real-time Conflict Simulator Button (Dành cho kiểm thử UC04) */}
        {activeZoneId && viewMode === "SECTION_SEATS" && (
          <button
            type="button"
            onClick={handleSimulateRealtimeConflict}
            title="Mô phỏng sự kiện thời gian thực khi có người khác giữ cùng một ghế"
            className="hidden sm:inline-flex items-center gap-1.5 h-8 px-2.5 rounded-[8px] bg-white border border-[#dfe3e5] text-[11.5px] font-semibold text-[#141d23] hover:border-amber-500 hover:text-amber-700 shadow-xs transition-colors"
          >
            <Zap className="size-3 text-amber-500" />
            <span>Mô phỏng tranh chấp ghế</span>
          </button>
        )}

        {viewMode === "OVERVIEW" && (
          <div className="flex flex-col rounded-[8px] bg-white border border-[#dfe3e5] shadow-xs overflow-hidden">
            <button
              type="button"
              onClick={handleZoomIn}
              aria-label="Phóng to"
              className="size-8 flex items-center justify-center text-[#141d23] hover:bg-[#f5f7f8] transition-colors border-b border-[#dfe3e5]"
            >
              <Plus className="size-3.5" />
            </button>
            <button
              type="button"
              onClick={handleZoomOut}
              aria-label="Thu nhỏ"
              className="size-8 flex items-center justify-center text-[#141d23] hover:bg-[#f5f7f8] transition-colors border-b border-[#dfe3e5]"
            >
              <Minus className="size-3.5" />
            </button>
            <button
              type="button"
              onClick={handleReset}
              aria-label="Căn giữa toàn cảnh"
              className="size-8 flex items-center justify-center text-[#141d23] hover:bg-[#f5f7f8] transition-colors"
            >
              <Maximize2 className="size-3" />
            </button>
          </div>
        )}
      </div>

      {/* VIEW MODE 1: DETAILED SECTION SEAT GRID */}
      {viewMode === "SECTION_SEATS" && activeZoneId ? (
        <div className="flex-1 w-full h-full relative">
          <SectionSeatGrid
            zoneId={activeZoneId}
            zoneName={zoneInfoMap[activeZoneId]?.name || `Khu vực ${activeZoneId}`}
            basePrice={zoneInfoMap[activeZoneId]?.minPrice || 800000}
            isStanding={isStandingActive}
            standingQuantity={standingQuantity}
            onStandingQuantityChange={onStandingQuantityChange}
            selectedSeats={activeSeats}
            onToggleSeat={handleToggleSeat}
            maxSeats={maxSeats}
            onExceedMax={(max) =>
              setToastMessage(`Bạn chỉ được chọn tối đa ${max} ghế trên mỗi đơn hàng.`)
            }
            recentlyHeldSeatId={recentlyHeldSeatId}
            onBackToOverview={() => setViewMode("OVERVIEW")}
          />
        </div>
      ) : (
        /* VIEW MODE 2: OVERVIEW ARCHITECTURAL SVG VENUE MAP */
        <div
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={() => {
            setIsDragging(false);
            onHoverZone(null);
            setTooltip(null);
          }}
          onClick={handleClick}
          className="flex-1 w-full h-full relative cursor-grab active:cursor-grabbing overflow-hidden"
        >
          {/* Floating Hover Tooltip on Section */}
          {tooltip && (
            <div
              style={{
                left: `${tooltip.x}px`,
                top: `${tooltip.y - 12}px`,
                pointerEvents: "none",
              }}
              className="absolute z-30 transform -translate-x-1/2 -translate-y-full bg-[#141d23] text-white text-[12px] px-3 py-1.5 rounded-[6px] shadow-lg whitespace-nowrap pointer-events-none select-none"
            >
              <div className="font-semibold text-slate-200">{tooltip.name}</div>
              <div className="font-bold text-[#a7f3d0] font-mono">Từ {formatVnd(tooltip.price)}</div>
              <div className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-[#141d23]" />
            </div>
          )}

          {/* SVG Canvas with Pan & Zoom */}
          <div
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: "center center",
              transition: isDragging ? "none" : "transform 0.15s ease-out",
            }}
            className="w-full h-full flex items-center justify-center p-4 gpu-layer"
          >
            <svg
              viewBox={mapData.viewBox}
              className="w-full h-full max-h-[82vh] transition-colors duration-150"
              dangerouslySetInnerHTML={{ __html: mapData.markup }}
            />
          </div>

          {/* Interactive Minimap in bottom-right corner */}
          <div className="absolute bottom-4 right-4 z-20 hidden sm:block">
            <SeatMinimap
              viewBox={mapData.viewBox}
              markup={mapData.markup}
              zoom={zoom}
              pan={pan}
              containerWidth={containerSize.w}
              containerHeight={containerSize.h}
              onNavigate={(newPan) => setPan(newPan)}
            />
          </div>

          {/* Dynamic SVG Injection for Zone Highlight */}
          <style
            dangerouslySetInnerHTML={{
              __html: `
            .sec {
              fill: #eff6ff;
              stroke: #93c5fd;
              stroke-width: 3px;
              transition: all 0.2s ease;
              cursor: pointer;
            }
            g[data-zone="11448"],
            g[data-zone="885"] {
              cursor: not-allowed !important;
            }
            g[data-zone="11448"] .sec,
            g[data-zone="885"] .sec {
              fill: #e2e8f0 !important;
              stroke: #cbd5e1 !important;
              cursor: not-allowed !important;
            }
            g[data-zone="11448"] text,
            g[data-zone="885"] text {
              fill: #94a3b8 !important;
              font-weight: 500 !important;
            }
            g[data-zone] {
              cursor: default;
            }
            g[data-zone] .sec {
              fill: #f8fafc;
              stroke: #cbd5e1;
              stroke-width: 2px;
              cursor: default;
              transition: all 0.15s ease;
            }
            g[data-zone] text {
              fill: #94a3b8;
              font-family: var(--font-sans), system-ui, sans-serif;
              font-weight: 600;
              pointer-events: none;
              user-select: none;
            }
            ${Object.keys(zoneInfoMap)
              .map(
                (zid) => `
            g[data-zone="${zid}"] .sec {
              fill: #ecfdf5;
              stroke: #10b981;
              stroke-width: 3px;
              cursor: pointer;
            }
            g[data-zone="${zid}"] text {
              fill: #064e3b;
              font-weight: 800;
            }
            `
              )
              .join("\n")}
            ${
              hoveredZoneId
                ? `
              g[data-zone="${hoveredZoneId}"] .sec {
                fill: #10b981 !important;
                stroke: #047857 !important;
                stroke-width: 6px !important;
              }
              g[data-zone="${hoveredZoneId}"] text {
                fill: #ffffff !important;
                font-weight: 800 !important;
              }
            `
                : ""
            }
            ${
              activeZoneId
                ? `
              g[data-zone]:not([data-zone="${activeZoneId}"]) {
                opacity: 0.35;
              }
              g[data-zone="${activeZoneId}"] .sec {
                fill: #059669 !important;
                stroke: #064e3b !important;
                stroke-width: 7px !important;
              }
              g[data-zone="${activeZoneId}"] text {
                fill: #ffffff !important;
                font-weight: 800 !important;
              }
            `
                : ""
            }
            .stage {
              fill: #334155 !important;
            }
            .stage-label {
              fill: #ffffff !important;
              font-weight: 800 !important;
              letter-spacing: 0.08em;
            }
            .prop {
              fill: #cbd5e1 !important;
            }
            .prop-box {
              stroke: #94a3b8 !important;
            }
            .pitch-apron {
              fill: #e2e8f0;
              stroke: #cbd5e1;
            }
            .pitch {
              fill: #4ade80 !important;
              stroke: #22c55e !important;
            }
            .pitch-mark {
              stroke: #ffffff !important;
              fill: none !important;
            }
          `,
            }}
          />
        </div>
      )}

      {/* UC04 BOTTOM SELECTION BAR: Real-time Basket & Temporary Calculation */}
      {activeSeats.length > 0 && (
        <div className="absolute bottom-3 inset-x-3 z-30 bg-white/95 backdrop-blur-md p-3 rounded-[12px] border border-[#dfe3e5] shadow-lg flex flex-wrap items-center justify-between gap-3 text-[#141d23]">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-[12px] font-semibold text-[#141d23]">
                  Ghế đang chọn ({activeSeats.length}/{maxSeats}):
                </span>
                <span className="text-[11px] text-primary font-medium bg-emerald-50 px-2 py-0.5 rounded-[4px] border border-emerald-200">
                  Tối đa {maxSeats} ghế/đơn
                </span>
              </div>

              {/* Selected seat chips */}
              <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                {activeSeats.map((s) => (
                  <span
                    key={s.id}
                    className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-[6px] text-[12px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-200"
                  >
                    <span className="font-mono font-bold">{s.code}</span>
                    <span className="text-[11px] text-emerald-600 font-mono">
                      ({formatVnd(s.price)})
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSeat(s.id)}
                      className="p-0.5 hover:text-red-600 rounded transition-colors"
                      title="Bỏ chọn ghế này"
                    >
                      <X className="size-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Total Price & Checkout Action */}
          <div className="flex items-center gap-3.5 shrink-0">
            <div className="text-right">
              <div className="text-[10.5px] text-[#606970] uppercase font-semibold">
                Tổng tạm tính
              </div>
              <div className="text-[17px] font-extrabold text-primary font-mono leading-tight">
                {formatVnd(totalPrice)}
              </div>
            </div>

            <button
              type="button"
              onClick={onProceedToHold}
              className="h-9 px-4 rounded-[8px] bg-primary hover:bg-emerald-700 text-white font-bold text-[13px] transition-colors shadow-xs flex items-center gap-1.5"
            >
              <Check className="size-4" />
              <span>Tiếp tục đặt chỗ</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
