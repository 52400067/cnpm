"use client";

import React, { memo, useRef } from "react";
import { MinimapViewport } from "./seat-map.types";

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

  // Parse viewBox coordinates: "minX minY width height"
  const vbParts = viewBox.split(" ").map(Number);
  const vbX = vbParts[0] || 0;
  const vbY = vbParts[1] || 0;
  const vbW = vbParts[2] || 4000;
  const vbH = vbParts[3] || 3000;

  // Minimap fixed dimensions (clean compact box)
  const mapW = 120;
  const mapH = 90;

  // Calculate viewport rectangle percentage on minimap
  // When zoom = 1, pan = (0,0), viewport covers the default area
  const scaleRatio = 1 / Math.max(0.1, zoom);
  const rectW = Math.min(mapW, Math.max(16, mapW * scaleRatio));
  const rectH = Math.min(mapH, Math.max(12, mapH * scaleRatio));

  // Normalized pan to minimap offsets
  const panRatioX = containerWidth > 0 ? (pan.x / (containerWidth * zoom)) : 0;
  const panRatioY = containerHeight > 0 ? (pan.y / (containerHeight * zoom)) : 0;

  const rectX = Math.max(0, Math.min(mapW - rectW, (mapW / 2) - (rectW / 2) - (panRatioX * mapW)));
  const rectY = Math.max(0, Math.min(mapH - rectH, (mapH / 2) - (rectH / 2) - (panRatioY * mapH)));

  const handleMinimapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!onNavigate || !minimapRef.current) return;
    const rect = minimapRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // Convert click position to canvas pan delta
    const normalizedX = (clickX / mapW) - 0.5;
    const normalizedY = (clickY / mapH) - 0.5;

    onNavigate({
      x: -normalizedX * containerWidth * zoom,
      y: -normalizedY * containerHeight * zoom,
    });
  };

  return (
    <div
      ref={minimapRef}
      onClick={handleMinimapClick}
      title="Bản đồ thu nhỏ (Minimap) — Nhấp để định vị góc nhìn"
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
          width: `${rectW}px`,
          height: `${rectH}px`,
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
