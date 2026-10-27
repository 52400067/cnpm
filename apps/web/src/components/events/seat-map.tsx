"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { Plus, Minus, Maximize2 } from "lucide-react";
import { VENUE_SVG, type VenueMapKey } from "@/lib/venue-svg.generated";
import { formatVnd } from "@/lib/events-catalog";
import { SeatMinimap } from "@/components/events/seat-minimap";

export interface SeatMapProps {
  mapKey: VenueMapKey;
  activeZoneId?: string | null;
  hoveredZoneId?: string | null;
  zoneInfoMap?: Record<string, { name: string; minPrice: number; count: number }>;
  onSelectZone: (zoneId: string | null) => void;
  onHoverZone: (zoneId: string | null) => void;
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
}: SeatMapProps) {
  const mapData = VENUE_SVG[mapKey] || VENUE_SVG["arena-t-stage"];

  // Pan, Zoom & Dragging
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const panStartRef = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ w: 800, h: 600 });

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

  return (
    <div
      ref={containerRef}
      role="region"
      aria-label="Sơ đồ khán đài tương tác"
      className="relative w-full h-full bg-[#f8fafc] overflow-hidden select-none flex flex-col font-sans"
    >
      {/* Floating Toolbar: Zoom & Reset */}
      <div className="absolute top-4 right-4 z-20 flex flex-col rounded-[8px] bg-white border border-[#dfe3e5] shadow-xs overflow-hidden">
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

      {/* SVG Canvas Workspace */}
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
        <div
          className="absolute bottom-4 right-4 z-20 hidden sm:block"
          onMouseDown={(e) => e.stopPropagation()}
          onMouseMove={(e) => e.stopPropagation()}
          onMouseUp={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
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

        {/* Dynamic SVG Styles for Zone Highlights */}
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
          /* Football pitch styling */
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
    </div>
  );
}
