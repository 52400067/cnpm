"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { Plus, Minus, Maximize2 } from "lucide-react";
import { VENUE_SVG, type VenueMapKey } from "@/lib/venue-svg.generated";
import { formatVnd } from "@/lib/events-catalog";
import { SeatMinimap } from "@/components/events/seat-minimap";
import { clampPanToMap } from "@/components/events/seat-map.utils";

export interface SeatMapProps {
  mapKey: VenueMapKey;
  activeZoneId?: string | null;
  hoveredZoneId?: string | null;
  zoneInfoMap?: Record<
    string,
    { name: string; minPrice: number; count: number }
  >;
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
  const canvasRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [viewportSize, setViewportSize] = useState({
    canvasWidth: 0,
    canvasHeight: 0,
    svgWidth: 0,
    svgHeight: 0,
  });

  // Track the actual canvas/SVG dimensions so minimap geometry matches letterboxed maps.
  useEffect(() => {
    const canvas = canvasRef.current;
    const svg = svgRef.current;
    if (!canvas || !svg) return;

    const observer = new ResizeObserver(() => {
      const nextSize = {
        canvasWidth: canvas.clientWidth,
        canvasHeight: canvas.clientHeight,
        svgWidth: svg.clientWidth,
        svgHeight: svg.clientHeight,
      };
      setViewportSize((current) =>
        current.canvasWidth === nextSize.canvasWidth &&
        current.canvasHeight === nextSize.canvasHeight &&
        current.svgWidth === nextSize.svgWidth &&
        current.svgHeight === nextSize.svgHeight
          ? current
          : nextSize,
      );
    });

    observer.observe(canvas);
    observer.observe(svg);
    return () => observer.disconnect();
  }, []);

  const visiblePan = clampPanToMap({
    pan,
    zoom,
    containerWidth: viewportSize.canvasWidth,
    containerHeight: viewportSize.canvasHeight,
    svgWidth: viewportSize.svgWidth,
    svgHeight: viewportSize.svgHeight,
    viewBox: mapData.viewBox,
  });

  // Tooltip for overview hover
  const [tooltip, setTooltip] = useState<{
    price: number;
    name: string;
    count: number;
    x: number;
    y: number;
  } | null>(null);

  const updateZoom = (nextZoom: number) => {
    setZoom(nextZoom);
    setPan((currentPan) =>
      clampPanToMap({
        pan: currentPan,
        zoom: nextZoom,
        containerWidth: viewportSize.canvasWidth,
        containerHeight: viewportSize.canvasHeight,
        svgWidth: viewportSize.svgWidth,
        svgHeight: viewportSize.svgHeight,
        viewBox: mapData.viewBox,
      }),
    );
  };
  const handleZoomIn = () =>
    updateZoom(Math.min(2.5, Number((zoom + 0.25).toFixed(2))));
  const handleZoomOut = () =>
    updateZoom(Math.max(0.75, Number((zoom - 0.25).toFixed(2))));
  const handleReset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    onSelectZone(null);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    panStartRef.current = { ...visiblePan };
  };

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (isDragging) {
        const dx = e.clientX - dragStartRef.current.x;
        const dy = e.clientY - dragStartRef.current.y;
        setPan(
          clampPanToMap({
            pan: {
              x: panStartRef.current.x + dx,
              y: panStartRef.current.y + dy,
            },
            zoom,
            containerWidth: viewportSize.canvasWidth,
            containerHeight: viewportSize.canvasHeight,
            svgWidth: viewportSize.svgWidth,
            svgHeight: viewportSize.svgHeight,
            viewBox: mapData.viewBox,
          }),
        );
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
              count: zoneInfoMap[zid].count,
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
    [isDragging, onHoverZone, zoneInfoMap, zoom, viewportSize, mapData.viewBox],
  );

  // Mouseup must bubble from the minimap so canvas drags always finish.
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
      className="relative w-full h-full bg-muted overflow-hidden select-none flex flex-col font-sans"
    >
      {/* Floating Toolbar: Zoom & Reset */}
      <div className="absolute top-4 right-4 z-20 flex flex-col rounded-md bg-background border border-border shadow-xs overflow-hidden">
        <button
          type="button"
          onClick={handleZoomIn}
          aria-label="Phóng to"
          className="size-8 flex items-center justify-center text-foreground hover:bg-muted transition-colors border-b border-border"
        >
          <Plus className="size-3.5" />
        </button>
        <button
          type="button"
          onClick={handleZoomOut}
          aria-label="Thu nhỏ"
          className="size-8 flex items-center justify-center text-foreground hover:bg-muted transition-colors border-b border-border"
        >
          <Minus className="size-3.5" />
        </button>
        <button
          type="button"
          onClick={handleReset}
          aria-label="Căn giữa toàn cảnh"
          className="size-8 flex items-center justify-center text-foreground hover:bg-muted transition-colors"
        >
          <Maximize2 className="size-3" />
        </button>
      </div>

      {/* SVG Canvas Workspace */}
      <div
        ref={canvasRef}
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
            className="absolute z-30 transform -translate-x-1/2 -translate-y-full bg-foreground text-background text-[12px] px-3 py-1.5 rounded-sm shadow-lg whitespace-nowrap pointer-events-none select-none"
          >
            <div className="font-semibold text-background">{tooltip.name}</div>
            <div className="font-bold text-accent-foreground font-mono">
              Từ {formatVnd(tooltip.price)}
            </div>
            <div className="text-background/80">Còn {tooltip.count} vé</div>
            <div className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-foreground" />
          </div>
        )}

        {/* SVG Canvas with Pan & Zoom */}
        <div
          style={{
            transform: `translate(${visiblePan.x}px, ${visiblePan.y}px) scale(${zoom})`,
            transformOrigin: "center center",
            transition: isDragging ? "none" : "transform 0.15s ease-out",
          }}
          className="w-full h-full flex items-center justify-center p-4 gpu-layer"
        >
          <svg
            ref={svgRef}
            viewBox={mapData.viewBox}
            className="w-full h-full max-h-[82vh] transition-colors duration-150"
            preserveAspectRatio="xMidYMid meet"
            dangerouslySetInnerHTML={{ __html: mapData.markup }}
          />
        </div>

        {/* Interactive Minimap in bottom-right corner */}
        <div
          className="absolute bottom-4 right-4 z-20 hidden sm:block"
          onMouseDown={(e) => e.stopPropagation()}
          onMouseMove={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          <SeatMinimap
            viewBox={mapData.viewBox}
            markup={mapData.markup}
            zoom={zoom}
            pan={visiblePan}
            containerWidth={viewportSize.canvasWidth}
            containerHeight={viewportSize.canvasHeight}
            svgWidth={viewportSize.svgWidth}
            svgHeight={viewportSize.svgHeight}
            onNavigate={(newPan) => setPan(newPan)}
          />
        </div>

        {/* Dynamic SVG Styles for Zone Highlights */}
        <style
          dangerouslySetInnerHTML={{
            __html: `
          .sec {
            fill: var(--accent);
            stroke: var(--ring);
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
            fill: var(--secondary) !important;
            stroke: var(--border) !important;
            cursor: not-allowed !important;
          }
          g[data-zone="11448"] text,
          g[data-zone="885"] text {
            fill: var(--muted-foreground) !important;
            font-weight: 500 !important;
          }
          g[data-zone] {
            cursor: default;
          }
          g[data-zone] .sec {
            fill: var(--background);
            stroke: var(--border);
            stroke-width: 2px;
            cursor: default;
            transition: all 0.15s ease;
          }
          g[data-zone] text {
            fill: var(--muted-foreground);
            font-family: var(--font-sans), system-ui, sans-serif;
            font-weight: 600;
            pointer-events: none;
            user-select: none;
          }
          ${Object.keys(zoneInfoMap)
            .map(
              (zid) => `
          g[data-zone="${zid}"] .sec {
            fill: var(--accent);
            stroke: var(--ring);
            stroke-width: 3px;
            cursor: pointer;
          }
          g[data-zone="${zid}"] text {
            fill: var(--accent-foreground);
            font-weight: 800;
          }
          `,
            )
            .join("\n")}
          ${
            hoveredZoneId
              ? `
            g[data-zone="${hoveredZoneId}"] .sec {
              fill: var(--ring) !important;
              stroke: var(--accent-foreground) !important;
              stroke-width: 6px !important;
            }
            g[data-zone="${hoveredZoneId}"] text {
              fill: var(--primary-foreground) !important;
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
              fill: var(--primary) !important;
              stroke: var(--accent-foreground) !important;
              stroke-width: 7px !important;
            }
            g[data-zone="${activeZoneId}"] text {
              fill: var(--primary-foreground) !important;
              font-weight: 800 !important;
            }
          `
              : ""
          }
          .stage {
            fill: var(--venue-stage) !important;
          }
          .stage-label {
            fill: var(--primary-foreground) !important;
            font-weight: 800 !important;
            letter-spacing: 0.08em;
          }
          .prop {
            fill: var(--secondary) !important;
          }
          .prop-box {
            stroke: var(--border) !important;
          }
          /* Football pitch styling */
          .pitch-apron {
            fill: var(--secondary);
            stroke: var(--border);
          }
          .pitch {
            fill: var(--venue-pitch) !important;
            stroke: var(--venue-pitch-stroke) !important;
          }
          .pitch-mark {
            stroke: var(--primary-foreground) !important;
            fill: none !important;
          }
          `,
          }}
        />
      </div>
    </div>
  );
}
