"use client";

import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { Seat, SeatMapData, SeatMapProps } from "./seatmap.types";

export interface ViewBoxState {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface DragState {
  isDragging: boolean;
  startX: number;
  startY: number;
  initialVbX: number;
  initialVbY: number;
  touches: Map<number, { x: number; y: number }>;
  pinchStartDist: number;
  pinchStartViewBox: ViewBoxState | null;
}

type UseSeatMapOptions = Pick<
  SeatMapProps,
  | "selectedSeats"
  | "maxSelectable"
  | "onSeatSelect"
  | "onSeatDeselect"
  | "onSelectionChange"
  | "readOnly"
> & { data: SeatMapData };

export function useSeatMap({
  data,
  selectedSeats = [],
  maxSelectable = 6,
  onSeatSelect,
  onSeatDeselect,
  onSelectionChange,
  readOnly = false,
}: UseSeatMapOptions) {
  const svgRef       = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // ── ViewBox ─────────────────────────────────────────────────
  const initialViewBox = useMemo<ViewBoxState>(
    () => ({ x: 0, y: 0, w: data.viewBoxWidth, h: data.viewBoxHeight }),
    [data.viewBoxWidth, data.viewBoxHeight]
  );
  const [viewBox, setViewBox] = useState<ViewBoxState>(initialViewBox);

  // Reset when data dimensions change (different event)
  useEffect(() => {
    setViewBox({ x: 0, y: 0, w: data.viewBoxWidth, h: data.viewBoxHeight });
  }, [data.viewBoxWidth, data.viewBoxHeight]);

  // ── Seat selection ───────────────────────────────────────────
  const [internalSelected, setInternalSelected] = useState<Seat[]>(selectedSeats);
  const [hoveredSeat, setHoveredSeat]           = useState<Seat | null>(null);
  const [toastMessage, setToastMessage]         = useState<string | null>(null);

  useEffect(() => { setInternalSelected(selectedSeats); }, [selectedSeats]);

  const selectedSeatIds = useMemo(
    () => new Set(internalSelected.map((s) => s.id)),
    [internalSelected]
  );

  // ── Drag/pinch ref ───────────────────────────────────────────
  const dragRef = useRef<DragState>({
    isDragging: false,
    startX: 0, startY: 0,
    initialVbX: 0, initialVbY: 0,
    touches: new Map(),
    pinchStartDist: 0,
    pinchStartViewBox: null,
  });

  // ── Seat toggle ──────────────────────────────────────────────
  const handleToggleSeat = useCallback(
    (seat: Seat) => {
      if (readOnly) return;
      if (selectedSeatIds.has(seat.id)) {
        const next = internalSelected.filter((s) => s.id !== seat.id);
        setInternalSelected(next);
        onSeatDeselect?.(seat);
        onSelectionChange?.(next);
      } else {
        if (internalSelected.length >= maxSelectable) {
          setToastMessage(`Bạn chỉ được chọn tối đa ${maxSelectable} vé.`);
          return;
        }
        const next = [...internalSelected, seat];
        setInternalSelected(next);
        onSeatSelect?.(seat);
        onSelectionChange?.(next);
      }
    },
    [internalSelected, selectedSeatIds, maxSelectable, onSeatSelect, onSeatDeselect, onSelectionChange, readOnly]
  );

  const handleHoverSeat = useCallback((seat: Seat | null) => setHoveredSeat(seat), []);

  // ── Zoom ─────────────────────────────────────────────────────
  const handleZoom = useCallback(
    (factor: number, cx = 0.5, cy = 0.5) => {
      setViewBox((prev) => {
        const nextW = Math.max(data.viewBoxWidth * 0.25, Math.min(data.viewBoxWidth * 2.2, prev.w * factor));
        const nextH = Math.max(data.viewBoxHeight * 0.25, Math.min(data.viewBoxHeight * 2.2, prev.h * factor));
        return {
          x: prev.x - (nextW - prev.w) * cx,
          y: prev.y - (nextH - prev.h) * cy,
          w: nextW,
          h: nextH,
        };
      });
    },
    [data.viewBoxWidth, data.viewBoxHeight]
  );

  const resetView = useCallback(() => setViewBox(initialViewBox), [initialViewBox]);

  // ── Wheel zoom ───────────────────────────────────────────────
  const handleWheel = useCallback(
    (e: React.WheelEvent<SVGSVGElement>) => {
      e.preventDefault();
      const rect = svgRef.current?.getBoundingClientRect();
      if (!rect) return;
      handleZoom(
        e.deltaY < 0 ? 0.88 : 1.14,
        (e.clientX - rect.left) / rect.width,
        (e.clientY - rect.top)  / rect.height
      );
    },
    [handleZoom]
  );

  // ── Pointer (touch + mouse) ──────────────────────────────────
  const handlePointerDown = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
    const d = dragRef.current;
    d.touches.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (d.touches.size === 1) {
      d.isDragging = true;
      d.startX = e.clientX;
      d.startY = e.clientY;
      setViewBox((curr) => { d.initialVbX = curr.x; d.initialVbY = curr.y; return curr; });
    } else if (d.touches.size === 2) {
      const pts = Array.from(d.touches.values());
      d.pinchStartDist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      setViewBox((curr) => { d.pinchStartViewBox = { ...curr }; return curr; });
    }
    (e.target as SVGElement).setPointerCapture?.(e.pointerId);
  }, []);

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      const d = dragRef.current;
      if (!d.touches.has(e.pointerId)) return;
      d.touches.set(e.pointerId, { x: e.clientX, y: e.clientY });
      const rect = svgRef.current?.getBoundingClientRect();
      if (!rect) return;

      if (d.touches.size === 2 && d.pinchStartViewBox && d.pinchStartDist > 0) {
        const pts  = Array.from(d.touches.values());
        const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
        const scale = d.pinchStartDist / Math.max(10, dist);
        const pv = d.pinchStartViewBox;
        const nw = Math.max(data.viewBoxWidth * 0.25, Math.min(data.viewBoxWidth * 2.2, pv.w * scale));
        const nh = Math.max(data.viewBoxHeight * 0.25, Math.min(data.viewBoxHeight * 2.2, pv.h * scale));
        setViewBox({ x: pv.x - (nw - pv.w) / 2, y: pv.y - (nh - pv.h) / 2, w: nw, h: nh });
        return;
      }

      if (d.isDragging && d.touches.size === 1) {
        setViewBox((prev) => ({
          ...prev,
          x: d.initialVbX - (e.clientX - d.startX) * (prev.w / rect.width),
          y: d.initialVbY - (e.clientY - d.startY) * (prev.h / rect.height),
        }));
      }
    },
    [data.viewBoxWidth, data.viewBoxHeight]
  );

  const handlePointerUp = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
    const d = dragRef.current;
    d.touches.delete(e.pointerId);
    if (d.touches.size < 2) { d.pinchStartDist = 0; d.pinchStartViewBox = null; }
    if (d.touches.size === 0) d.isDragging = false;
    (e.target as SVGElement).releasePointerCapture?.(e.pointerId);
  }, []);

  // ── Derived ──────────────────────────────────────────────────
  const totalPrice   = useMemo(() => internalSelected.reduce((s, seat) => s + seat.price, 0), [internalSelected]);
  const zoomPercent  = useMemo(() => Math.round(Math.min(400, Math.max(25, (data.viewBoxWidth / viewBox.w) * 100))), [viewBox.w, data.viewBoxWidth]);

  const focusOnSeat = useCallback(
    (seat: Seat) => {
      const zoomW = data.viewBoxWidth * 0.42;
      const zoomH = data.viewBoxHeight * 0.42;
      setViewBox({
        x: seat.x - zoomW / 2,
        y: seat.y - zoomH / 2,
        w: zoomW,
        h: zoomH,
      });
    },
    [data.viewBoxWidth, data.viewBoxHeight]
  );

  return {
    svgRef, containerRef,
    viewBox, zoomPercent, resetView,
    handleZoom, handleWheel,
    handlePointerDown, handlePointerMove, handlePointerUp,
    internalSelected, selectedSeatIds,
    hoveredSeat, handleHoverSeat,
    toastMessage, setToastMessage,
    handleToggleSeat, focusOnSeat,
    totalPrice,
  };
}
