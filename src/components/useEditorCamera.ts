/**
 * Super Pixel World - Editor Viewport & Camera Controller Hook
 * 
 * Manages 2D Camera bounds, vertical & horizontal scrolling, zoom,
 * middle-click/Space panning, and coordinate transformations between
 * screen pixels and world grid coordinates.
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { CELL_SIZE, GRID_ROWS } from '../game/constants';

export interface UseEditorCameraOptions {
  levelWidth: number;
  levelHeight?: number;
  containerRef: React.RefObject<HTMLDivElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  onCameraAction?: () => void;
}

export function useEditorCamera({
  levelWidth,
  levelHeight = GRID_ROWS,
  containerRef,
  canvasRef,
  onCameraAction,
}: UseEditorCameraOptions) {
  const [cameraX, setCameraX] = useState<number>(0);
  const [cameraY, setCameraY] = useState<number>(0);
  const [zoom, setZoom] = useState<number>(1.0);
  const isPanningRef = useRef<boolean>(false);
  const panStartRef = useRef<{ mouseX: number; mouseY: number; camX: number; camY: number }>({
    mouseX: 0,
    mouseY: 0,
    camX: 0,
    camY: 0,
  });

  const effectiveCellSize = CELL_SIZE * zoom;
  const totalWorldWidthPx = levelWidth * effectiveCellSize;
  const totalWorldHeightPx = levelHeight * effectiveCellSize;

  const getViewportSize = useCallback(() => {
    if (containerRef.current) {
      return {
        width: containerRef.current.clientWidth || 1000,
        height: containerRef.current.clientHeight || 600,
      };
    }
    return { width: 1000, height: 600 };
  }, [containerRef]);

  const getMaxCameraX = useCallback(() => {
    const { width } = getViewportSize();
    return Math.max(0, totalWorldWidthPx - width);
  }, [getViewportSize, totalWorldWidthPx]);

  const getMaxCameraY = useCallback(() => {
    const { height } = getViewportSize();
    // Allow scrolling all the way to bottom plus 3 extra rows of margin for comfortable drawing
    return Math.max(0, totalWorldHeightPx - height + effectiveCellSize * 3);
  }, [getViewportSize, totalWorldHeightPx, effectiveCellSize]);

  const clampCameraX = useCallback(
    (camX: number) => {
      const maxX = getMaxCameraX();
      return Math.max(0, Math.min(maxX, camX));
    },
    [getMaxCameraX]
  );

  const clampCameraY = useCallback(
    (camY: number) => {
      const maxY = getMaxCameraY();
      return Math.max(0, Math.min(maxY, camY));
    },
    [getMaxCameraY]
  );

  // Convert mouse screen position to level grid (col, row)
  const getCellFromMouse = useCallback(
    (clientX: number, clientY: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return null;
      const rect = canvas.getBoundingClientRect();
      const canvasX = clientX - rect.left;
      const canvasY = clientY - rect.top;

      const worldX = canvasX + cameraX;
      const worldY = canvasY + cameraY;

      const col = Math.floor(worldX / effectiveCellSize);
      const row = Math.floor(worldY / effectiveCellSize);

      if (col < 0 || col >= levelWidth || row < 0 || row >= levelHeight) {
        return null;
      }
      return { col, row };
    },
    [cameraX, cameraY, effectiveCellSize, levelWidth, levelHeight, canvasRef]
  );

  // Wheel handling: zoom (Ctrl) and 2D pan (horizontal/vertical)
  const handleWheel = useCallback(
    (e: React.WheelEvent<HTMLElement>) => {
      onCameraAction?.();

      if (e.ctrlKey) {
        e.preventDefault();
        const delta = e.deltaY < 0 ? 0.1 : -0.1;
        setZoom((z) => Math.max(0.6, Math.min(1.5, Number((z + delta).toFixed(2)))));
        return;
      }

      // If user holds Shift, scroll horizontally; otherwise scroll vertically (or both if deltaX exists)
      if (e.shiftKey || Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
        const dx = e.shiftKey ? e.deltaY : e.deltaX;
        setCameraX((cx) => clampCameraX(cx + dx * 1.2));
      } else {
        // Standard wheel: scroll vertically if vertical overflow exists, otherwise scroll horizontally
        const maxY = getMaxCameraY();
        if (maxY > 0) {
          setCameraY((cy) => clampCameraY(cy + e.deltaY * 1.2));
          if (Math.abs(e.deltaX) > 0) {
            setCameraX((cx) => clampCameraX(cx + e.deltaX * 1.2));
          }
        } else {
          setCameraX((cx) => clampCameraX(cx + e.deltaY * 1.2));
        }
      }
    },
    [clampCameraX, clampCameraY, getMaxCameraY, onCameraAction]
  );

  const startPan = useCallback(
    (clientX: number, clientY: number) => {
      isPanningRef.current = true;
      panStartRef.current = {
        mouseX: clientX,
        mouseY: clientY,
        camX: cameraX,
        camY: cameraY,
      };
      onCameraAction?.();
    },
    [cameraX, cameraY, onCameraAction]
  );

  const updatePan = useCallback(
    (clientX: number, clientY: number) => {
      if (!isPanningRef.current) return;
      const dx = clientX - panStartRef.current.mouseX;
      const dy = clientY - panStartRef.current.mouseY;
      setCameraX(clampCameraX(panStartRef.current.camX - dx));
      setCameraY(clampCameraY(panStartRef.current.camY - dy));
      onCameraAction?.();
    },
    [clampCameraX, clampCameraY, onCameraAction]
  );

  const endPan = useCallback(() => {
    isPanningRef.current = false;
  }, []);

  return {
    cameraX,
    cameraY,
    setCameraX,
    setCameraY,
    zoom,
    setZoom,
    effectiveCellSize,
    totalWorldWidthPx,
    totalWorldHeightPx,
    getViewportSize,
    getMaxCameraX,
    getMaxCameraY,
    clampCameraX,
    clampCameraY,
    getCellFromMouse,
    handleWheel,
    isPanningRef,
    startPan,
    updatePan,
    endPan,
  };
}
