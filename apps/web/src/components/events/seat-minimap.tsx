"use client";

import React, { memo, useRef } from "react";
import {
  calculateMinimapViewport,
  minimapClickToPan,
} from "@/components/events/seat-map.utils";

interface SeatMinimapProps {
  viewBox: string;
  markup: string;
  zoom: number;
  pan: { x: number; y: number };
  containerWidth: number;
  containerHeight: number;
  onNavigate?: (pan: { x: number; y: number }) => void;
  className?: string;
}

export const SeatMinimap = memo(function SeatMinimap({
  viewBox,
  markup,
  zoom,
  pan,
  containerWidth,
  containerHeight,
  onNavigate,
  className = "",
}: SeatMinimapProps) {
  const minimapRef = useRef<HTMLDivElement>(null);

  // Minimap fixed dimensions (clean compact box)
  const mapW = 120;
  const mapH = 90;

  // Calculate viewport rectangle percentage on minimap using shared utility
  const { rectWidth, rectHeight, rectX, rectY } = calculateMinimapViewport({
    zoom,
    pan,
    mapWidth: mapW,
    mapHeight: mapH,
    containerWidth,
    containerHeight,
  });

  const handleMinimapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (!onNavigate || !minimapRef.current) return;
    const rect = minimapRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    onNavigate(
      minimapClickToPan(
        clickX,
        clickY,
        mapW,
        mapH,
        containerWidth,
        containerHeight,
        zoom,
      ),
    );
  };

  return (
    <div
      ref={minimapRef}
      onClick={handleMinimapClick}
      onMouseDown={(e) => e.stopPropagation()}
      onMouseMove={(e) => e.stopPropagation()}
      onMouseUp={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
      title="Bản đồ thu nhỏ (Minimap) - Nhấp để định vị góc nhìn"
      className={`relative w-[120px] h-[90px] rounded-[8px] bg-white border border-[#dfe3e5] shadow-xs overflow-hidden cursor-crosshair select-none ${className}`}
      style={{ width: `${mapW}px`, height: `${mapH}px` }}
      aria-label="Minimap toàn cảnh khán đài"
    >
      {/* Scaled SVG background */}
      <div className="absolute inset-0 pointer-events-none opacity-40">
        <svg
          viewBox={viewBox}
          className="w-full h-full"
          preserveAspectRatio="xMidYMid meet"
          dangerouslySetInnerHTML={{ __html: markup }}
        />
      </div>

      {/* Viewport Indicator Rectangle */}
      <div
        style={{
          width: `${rectWidth}px`,
          height: `${rectHeight}px`,
          left: `${rectX}px`,
          top: `${rectY}px`,
          transition: "all 0.1s ease-out",
        }}
        className="absolute border-[1.5px] border-primary bg-primary/10 rounded-[2px] pointer-events-none"
      />

      {/* Label */}
      <div className="absolute bottom-1 right-1 px-1 py-0.5 rounded-[3px] bg-white/90 border border-[#dfe3e5] text-[8.5px] font-bold text-[#606970] pointer-events-none leading-none">
        Minimap
      </div>
    </div>
  );
});
