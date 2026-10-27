/**
 * Utility functions for SeatMap and Minimap calculations (UC04)
 */

export interface MinimapViewportParams {
  zoom: number;
  pan: { x: number; y: number };
  mapWidth: number;
  mapHeight: number;
  containerWidth: number;
  containerHeight: number;
}

export interface MinimapViewportResult {
  scaleRatio: number;
  rectWidth: number;
  rectHeight: number;
  rectX: number;
  rectY: number;
}

/**
 * Calculates minimap indicator rectangle position and dimensions
 * based on current zoom level and pan coordinates.
 */
export function calculateMinimapViewport({
  zoom,
  pan,
  mapWidth,
  mapHeight,
  containerWidth,
  containerHeight,
}: MinimapViewportParams): MinimapViewportResult {
  const safeZoom = Math.max(0.1, zoom);
  const scaleRatio = 1 / safeZoom;
  const rectWidth = Math.min(mapWidth, Math.max(16, mapWidth * scaleRatio));
  const rectHeight = Math.min(mapHeight, Math.max(12, mapHeight * scaleRatio));

  const panRatioX =
    containerWidth > 0 ? pan.x / (containerWidth * safeZoom) : 0;
  const panRatioY =
    containerHeight > 0 ? pan.y / (containerHeight * safeZoom) : 0;

  const rectX = Math.max(
    0,
    Math.min(
      mapWidth - rectWidth,
      mapWidth / 2 - rectWidth / 2 - panRatioX * mapWidth,
    ),
  );
  const rectY = Math.max(
    0,
    Math.min(
      mapHeight - rectHeight,
      mapHeight / 2 - rectHeight / 2 - panRatioY * mapHeight,
    ),
  );

  return { scaleRatio, rectWidth, rectHeight, rectX, rectY };
}

/**
 * Translates a click inside the minimap to canvas pan coordinates
 */
export function minimapClickToPan(
  clickX: number,
  clickY: number,
  mapWidth: number,
  mapHeight: number,
  containerWidth: number,
  containerHeight: number,
  zoom: number,
): { x: number; y: number } {
  const normalizedX = clickX / mapWidth - 0.5;
  const normalizedY = clickY / mapHeight - 0.5;

  const x = -normalizedX * containerWidth * zoom;
  const y = -normalizedY * containerHeight * zoom;

  return {
    x: x === 0 ? 0 : x,
    y: y === 0 ? 0 : y,
  };
}

/**
 * Parses SVG viewBox string "minX minY width height" into numeric components
 */
export function parseViewBox(viewBox: string): {
  minX: number;
  minY: number;
  width: number;
  height: number;
} {
  const parts = viewBox.trim().split(/\s+/).map(Number);
  return {
    minX: parts[0] ?? 0,
    minY: parts[1] ?? 0,
    width: parts[2] ?? 0,
    height: parts[3] ?? 0,
  };
}
