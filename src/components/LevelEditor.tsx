/**
 * Super Pixel World - Interactive Level Editor (Left Area 78-82% width)
 * High-performance 60fps canvas, continuous platform line dragging, ghost cursor preview,
 * interactive minimap navigation, and multi-zoom viewports.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  Grid,
  Move,
  Sparkles,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { sound } from '../audio/soundEngine';
import { CELL_SIZE, GRID_ROWS, THEMES } from '../game/constants';
import { SpriteRenderer } from '../graphics/spriteRenderer';
import { LevelData, LevelItem, ThemeId, TileId, ToolMode } from '../types/game';

interface LevelEditorProps {
  levelData: LevelData;
  activeTool: ToolMode;
  selectedTile: TileId;
  selectedTheme: ThemeId;
  onUpdateItems: (newItems: LevelItem[], recordHistory?: boolean) => void;
  onOpenTutorial: () => void;
}

export const LevelEditor: React.FC<LevelEditorProps> = ({
  levelData,
  activeTool,
  selectedTile,
  selectedTheme,
  onUpdateItems,
  onOpenTutorial,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const minimapRef = useRef<HTMLCanvasElement | null>(null);

  // Viewport & Navigation
  const [cameraX, setCameraX] = useState<number>(0);
  const [zoom, setZoom] = useState<number>(1.0);
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [hoverCell, setHoverCell] = useState<{ col: number; row: number } | null>(null);

  // Drag Placement State
  const [isMouseDown, setIsMouseDown] = useState<boolean>(false);
  const [mouseButton, setMouseButton] = useState<number>(0); // 0 = left, 2 = right
  const [dragStartCell, setDragStartCell] = useState<{ col: number; row: number } | null>(null);
  const [dragCurrentCell, setDragCurrentCell] = useState<{ col: number; row: number } | null>(null);
  const isPanningRef = useRef<boolean>(false);
  const panStartRef = useRef<{ mouseX: number; camX: number }>({ mouseX: 0, camX: 0 });

  const themeConfig = THEMES[selectedTheme] || THEMES.green_islands;
  const bgImageRef = useRef<HTMLImageElement | null>(null);

  // Preload background image
  useEffect(() => {
    const img = new Image();
    img.src = themeConfig.image;
    img.onload = () => {
      bgImageRef.current = img;
    };
  }, [themeConfig.image]);

  // Max camera scroll
  const effectiveCellSize = CELL_SIZE * zoom;
  const totalWorldPx = levelData.width * effectiveCellSize;

  const getViewportWidth = useCallback(() => {
    return containerRef.current ? containerRef.current.clientWidth : 1000;
  }, []);

  const getViewportHeight = useCallback(() => {
    return containerRef.current ? containerRef.current.clientHeight : 640;
  }, []);

  const getMaxCameraX = useCallback(() => {
    const vpW = getViewportWidth();
    return Math.max(0, totalWorldPx - vpW);
  }, [getViewportWidth, totalWorldPx]);

  // Clamp camera
  const clampCameraX = useCallback(
    (camX: number) => {
      const maxCam = getMaxCameraX();
      return Math.max(0, Math.min(maxCam, camX));
    },
    [getMaxCameraX]
  );

  // Convert mouse event to grid col/row
  const getCellFromMouse = useCallback(
    (clientX: number, clientY: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return null;
      const rect = canvas.getBoundingClientRect();
      const canvasX = clientX - rect.left;
      const canvasY = clientY - rect.top;

      const worldX = canvasX + cameraX;
      const worldY = canvasY;

      const col = Math.floor(worldX / effectiveCellSize);
      const row = Math.floor(worldY / effectiveCellSize);

      if (col < 0 || col >= levelData.width || row < 0 || row >= GRID_ROWS) {
        return null;
      }
      return { col, row };
    },
    [cameraX, effectiveCellSize, levelData.width]
  );

  // Main Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animFrame: number;
    let animTime = 0;

    const render = () => {
      animTime += 0.016;
      const width = canvas.width;
      const height = canvas.height;

      // 1. Draw Parallax Panoramic Background
      if (bgImageRef.current && bgImageRef.current.complete) {
        const naturalW = bgImageRef.current.naturalWidth || 1376;
        const naturalH = bgImageRef.current.naturalHeight || 768;
        const imgAspect = naturalW / naturalH;

        if (imgAspect > 2.5) {
          // Ultra-wide single panorama: span across the full level progression without repeating
          const maxCam = Math.max(1, totalWorldPx - width);
          const progress = Math.max(0, Math.min(1, cameraX / maxCam));
          const bgW = Math.max(width, height * imgAspect);
          const bgX = -progress * Math.max(0, bgW - width);
          ctx.drawImage(bgImageRef.current, bgX, 0, bgW, height);
        } else {
          // Standard tileable background with subtle parallax repeat
          const parallaxFactor = 0.25;
          const bgWidth = height * imgAspect;
          const bgOffsetX = -(cameraX * parallaxFactor) % bgWidth;

          for (let x = bgOffsetX - bgWidth; x < width + bgWidth; x += bgWidth) {
            ctx.drawImage(bgImageRef.current, x, 0, bgWidth, height);
          }
        }
      } else {
        // Fallback sky gradient
        const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
        skyGrad.addColorStop(0, themeConfig.skyColor);
        skyGrad.addColorStop(1, '#ffffff');
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, width, height);
      }

      // Dim backdrop slightly for editor clarity
      ctx.fillStyle = 'rgba(15, 23, 42, 0.15)';
      ctx.fillRect(0, 0, width, height);

      ctx.save();
      ctx.translate(-cameraX, 0);

      // 2. Subtle Grid Lines
      if (showGrid) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
        ctx.lineWidth = 1;

        const startCol = Math.max(0, Math.floor(cameraX / effectiveCellSize));
        const endCol = Math.min(
          levelData.width,
          Math.ceil((cameraX + width) / effectiveCellSize)
        );

        // Vertical lines
        for (let c = startCol; c <= endCol; c++) {
          ctx.beginPath();
          ctx.moveTo(c * effectiveCellSize, 0);
          ctx.lineTo(c * effectiveCellSize, GRID_ROWS * effectiveCellSize);
          ctx.stroke();
        }

        // Horizontal lines
        for (let r = 0; r <= GRID_ROWS; r++) {
          ctx.beginPath();
          ctx.moveTo(startCol * effectiveCellSize, r * effectiveCellSize);
          ctx.lineTo(endCol * effectiveCellSize, r * effectiveCellSize);
          ctx.stroke();
        }
      }

      // 3. Render Placed Tiles & Items
      // Spatial map for connected platform styling
      const itemMap = new Map<string, LevelItem>();
      levelData.items.forEach((it) => {
        itemMap.set(`${it.x},${it.y}`, it);
      });

      const startCol = Math.max(0, Math.floor(cameraX / effectiveCellSize) - 1);
      const endCol = Math.min(
        levelData.width,
        Math.ceil((cameraX + width) / effectiveCellSize) + 1
      );

      levelData.items.forEach((item) => {
        if (item.x >= startCol && item.x <= endCol) {
          const px = item.x * effectiveCellSize;
          const py = item.y * effectiveCellSize;

          const hasLeft = itemMap.has(`${item.x - 1},${item.y}`) && itemMap.get(`${item.x - 1},${item.y}`)?.tileId === item.tileId;
          const hasRight = itemMap.has(`${item.x + 1},${item.y}`) && itemMap.get(`${item.x + 1},${item.y}`)?.tileId === item.tileId;

          SpriteRenderer.drawTile(ctx, item.tileId, px, py, effectiveCellSize, {
            hasLeft,
            hasRight,
            animTime,
            variant: item.variant,
          });
        }
      });

      // 4. Draw Drag Preview Line (Continuous Platform stretch)
      if (
        isMouseDown &&
        mouseButton === 0 &&
        activeTool !== 'erase' &&
        dragStartCell &&
        dragCurrentCell
      ) {
        const minC = Math.min(dragStartCell.col, dragCurrentCell.col);
        const maxC = Math.max(dragStartCell.col, dragCurrentCell.col);
        const row = dragStartCell.row;

        ctx.save();
        ctx.globalAlpha = 0.75;
        for (let c = minC; c <= maxC; c++) {
          const px = c * effectiveCellSize;
          const py = row * effectiveCellSize;
          const isL = c === minC;
          const isR = c === maxC;

          SpriteRenderer.drawTile(ctx, selectedTile, px, py, effectiveCellSize, {
            hasLeft: !isL,
            hasRight: !isR,
            animTime,
          });

          // Highlight rectangle border
          ctx.strokeStyle = '#facc15';
          ctx.lineWidth = 2;
          ctx.strokeRect(px + 1, py + 1, effectiveCellSize - 2, effectiveCellSize - 2);
        }
        ctx.restore();
      }

      // 5. Ghost Cursor Hover Preview
      if (hoverCell && (!isMouseDown || activeTool === 'erase')) {
        const hx = hoverCell.col * effectiveCellSize;
        const hy = hoverCell.row * effectiveCellSize;

        if (activeTool === 'erase') {
          // Red eraser highlight box
          ctx.fillStyle = 'rgba(239, 68, 68, 0.35)';
          ctx.fillRect(hx, hy, effectiveCellSize, effectiveCellSize);
          ctx.strokeStyle = '#ef4444';
          ctx.lineWidth = 2;
          ctx.strokeRect(hx + 1, hy + 1, effectiveCellSize - 2, effectiveCellSize - 2);
        } else {
          // Yellow cursor box
          ctx.fillStyle = 'rgba(250, 204, 21, 0.2)';
          ctx.fillRect(hx, hy, effectiveCellSize, effectiveCellSize);
          ctx.strokeStyle = '#facc15';
          ctx.lineWidth = 2;
          ctx.strokeRect(hx + 1, hy + 1, effectiveCellSize - 2, effectiveCellSize - 2);

          // Translucent ghost preview of selected item
          ctx.save();
          ctx.globalAlpha = 0.55;
          SpriteRenderer.drawTile(ctx, selectedTile, hx, hy, effectiveCellSize, {
            animTime,
          });
          ctx.restore();
        }
      }

      ctx.restore();

      // Render Minimap
      renderMinimap();

      animFrame = requestAnimationFrame(render);
    };

    animFrame = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animFrame);
  }, [
    cameraX,
    effectiveCellSize,
    hoverCell,
    isMouseDown,
    mouseButton,
    dragStartCell,
    dragCurrentCell,
    activeTool,
    selectedTile,
    levelData,
    showGrid,
    themeConfig,
  ]);

  // Render bottom interactive minimap
  const renderMinimap = () => {
    const mCanvas = minimapRef.current;
    if (!mCanvas) return;
    const mCtx = mCanvas.getContext('2d');
    if (!mCtx) return;

    const mW = mCanvas.width;
    const mH = mCanvas.height;

    // Background
    mCtx.fillStyle = '#0f172a';
    mCtx.fillRect(0, 0, mW, mH);

    const cellScaleX = mW / levelData.width;
    const cellScaleY = mH / GRID_ROWS;

    // Draw miniature tiles
    levelData.items.forEach((it) => {
      const mx = it.x * cellScaleX;
      const my = it.y * cellScaleY;

      if (it.tileId === 'grass_dirt') {
        mCtx.fillStyle = '#22c55e';
      } else if (it.tileId === 'stone') {
        mCtx.fillStyle = '#94a3b8';
      } else if (it.tileId === 'coin' || it.tileId === 'question_block') {
        mCtx.fillStyle = '#facc15';
      } else if (it.tileId === 'star') {
        mCtx.fillStyle = '#fbbf24';
      } else if (it.tileId === 'spikes' || it.tileId.startsWith('enemy_')) {
        mCtx.fillStyle = '#ef4444';
      } else if (it.tileId === 'goal') {
        mCtx.fillStyle = '#3b82f6';
      } else {
        mCtx.fillStyle = '#cbd5e1';
      }

      mCtx.fillRect(mx, my, Math.max(2, cellScaleX), Math.max(2, cellScaleY));
    });

    // Draw Viewport Frame Box
    const vpW = getViewportWidth();
    const frameX = (cameraX / totalWorldPx) * mW;
    const frameW = Math.max(16, (vpW / totalWorldPx) * mW);

    mCtx.fillStyle = 'rgba(234, 179, 8, 0.25)';
    mCtx.fillRect(frameX, 0, frameW, mH);
    mCtx.strokeStyle = '#eab308';
    mCtx.lineWidth = 2;
    mCtx.strokeRect(frameX, 1, frameW, mH - 2);
  };

  // Resize listener
  useEffect(() => {
    const handleResize = () => {
      const container = containerRef.current;
      const canvas = canvasRef.current;
      if (!container || !canvas) return;

      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // --- Mouse / Touch Handlers for Editing ---

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const isRightClick = e.button === 2;
    const isMiddleClick = e.button === 1 || e.altKey || e.shiftKey;

    if (isMiddleClick) {
      isPanningRef.current = true;
      panStartRef.current = { mouseX: e.clientX, camX: cameraX };
      return;
    }

    const cell = getCellFromMouse(e.clientX, e.clientY);
    if (!cell) return;

    setIsMouseDown(true);
    setMouseButton(e.button);
    setDragStartCell(cell);
    setDragCurrentCell(cell);

    if (isRightClick || activeTool === 'erase') {
      // Erase at clicked cell
      eraseAt(cell.col, cell.row);
      sound.playErase();
    } else {
      // Brush or line start
      sound.playPlaceTile();
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    // If middle click pan
    if (isPanningRef.current) {
      const dx = e.clientX - panStartRef.current.mouseX;
      setCameraX(clampCameraX(panStartRef.current.camX - dx));
      return;
    }

    const cell = getCellFromMouse(e.clientX, e.clientY);
    setHoverCell(cell);

    if (!isMouseDown || !cell) return;
    setDragCurrentCell(cell);

    if (mouseButton === 2 || activeTool === 'erase') {
      // Continuous erase while dragging
      eraseAt(cell.col, cell.row);
    }
  };

  const handleMouseUp = () => {
    if (isPanningRef.current) {
      isPanningRef.current = false;
    }

    if (isMouseDown && mouseButton === 0 && activeTool !== 'erase') {
      if (dragStartCell && dragCurrentCell) {
        // Place line of tiles or single tile
        const minC = Math.min(dragStartCell.col, dragCurrentCell.col);
        const maxC = Math.max(dragStartCell.col, dragCurrentCell.col);
        const row = dragStartCell.row;

        const newItems = [...levelData.items];
        // Remove existing items in those slots first
        for (let c = minC; c <= maxC; c++) {
          const idx = newItems.findIndex((it) => it.x === c && it.y === row);
          if (idx !== -1) {
            newItems.splice(idx, 1);
          }
          newItems.push({
            id: `item_${Date.now()}_${c}_${row}_${Math.random()}`,
            tileId: selectedTile,
            x: c,
            y: row,
          });
        }
        onUpdateItems(newItems, true);
      }
    }

    setIsMouseDown(false);
    setDragStartCell(null);
    setDragCurrentCell(null);
  };

  const eraseAt = (col: number, row: number) => {
    const newItems = levelData.items.filter((it) => !(it.x === col && it.y === row));
    if (newItems.length !== levelData.items.length) {
      onUpdateItems(newItems, true);
    }
  };

  // Wheel horizontal scrolling
  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    if (e.ctrlKey) {
      e.preventDefault();
      const delta = e.deltaY < 0 ? 0.1 : -0.1;
      setZoom((z) => Math.max(0.6, Math.min(1.5, Number((z + delta).toFixed(2)))));
      return;
    }
    const deltaX = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
    setCameraX((cam) => clampCameraX(cam + deltaX * 1.2));
  };

  // Minimap click / drag pan
  const handleMinimapInteraction = (clientX: number) => {
    const mCanvas = minimapRef.current;
    if (!mCanvas) return;
    const rect = mCanvas.getBoundingClientRect();
    const relX = Math.max(0, Math.min(rect.width, clientX - rect.left));
    const targetRatio = relX / rect.width;
    const newCamX = targetRatio * totalWorldPx - getViewportWidth() * 0.5;
    setCameraX(clampCameraX(newCamX));
  };

  return (
    <main className="flex-1 h-full flex flex-col bg-slate-950 relative overflow-hidden select-none">
      {/* Top Floating Quick Bar */}
      <div className="absolute top-3 left-4 right-4 z-20 flex items-center justify-between pointer-events-none">
        {/* Left Status & Onboarding Hint */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <div className="px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-700/80 shadow-md backdrop-blur-md flex items-center gap-2 text-xs">
            <span className="font-bold text-amber-400">💡 Подсказка:</span>
            <span className="text-slate-200 hidden sm:inline">
              Зажмите ЛКМ и тяните вправо, чтобы построить длинный мост. ПКМ — удаление.
            </span>
            <span className="text-slate-200 sm:hidden">Тяните ЛКМ для платформ</span>
            <button
              onClick={onOpenTutorial}
              className="text-amber-400 hover:text-amber-300 font-bold underline ml-1 cursor-pointer"
            >
              Инструкция
            </button>
          </div>
        </div>

        {/* Right Floating Viewport Controls (Zoom, Grid, Camera Jump) */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-900/90 border border-slate-700/80 shadow-md backdrop-blur-md pointer-events-auto">
          <button
            onClick={() => setCameraX(0)}
            title="Перейти в начало уровня"
            className="px-2 py-1 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 text-xs font-bold transition-colors cursor-pointer flex items-center gap-0.5"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Старт</span>
          </button>
          <button
            onClick={() => setCameraX(getMaxCameraX())}
            title="Перейти к финишу"
            className="px-2 py-1 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 text-xs font-bold transition-colors cursor-pointer flex items-center gap-0.5"
          >
            <span className="hidden md:inline">Финиш</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>

          <div className="w-[1px] h-4 bg-slate-700 mx-0.5" />

          <button
            onClick={() => setShowGrid((g) => !g)}
            title={showGrid ? 'Скрыть сетку' : 'Показать сетку'}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              showGrid ? 'text-amber-400 bg-amber-500/20' : 'text-slate-400 hover:bg-slate-800'
            }`}
          >
            <Grid className="w-4 h-4" />
          </button>

          <button
            onClick={() => setZoom((z) => Math.max(0.7, Number((z - 0.15).toFixed(2))))}
            title="Отдалить камеру"
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <ZoomOut className="w-4 h-4" />
          </button>

          <span className="text-[11px] font-mono text-slate-400 px-1">
            {Math.round(zoom * 100)}%
          </span>

          <button
            onClick={() => setZoom((z) => Math.min(1.4, Number((z + 0.15).toFixed(2))))}
            title="Приблизить камеру"
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Canvas Area */}
      <div ref={containerRef} className="flex-1 w-full h-full relative cursor-crosshair">
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
          onContextMenu={(e) => e.preventDefault()}
          className="absolute inset-0 block w-full h-full"
        />
      </div>

      {/* Bottom Minimap & Scroller */}
      <div className="h-12 bg-slate-900 border-t border-slate-800 flex items-center px-4 gap-3 shrink-0 z-20">
        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0 flex items-center gap-1.5">
          <Move className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden sm:inline">Мини-карта мира:</span>
        </div>

        {/* Minimap Canvas Container */}
        <div
          className="flex-1 h-8 rounded-lg overflow-hidden border border-slate-700 bg-slate-950 relative cursor-ew-resize"
          onMouseDown={(e) => handleMinimapInteraction(e.clientX)}
          onMouseMove={(e) => {
            if (e.buttons === 1) handleMinimapInteraction(e.clientX);
          }}
        >
          <canvas
            ref={minimapRef}
            width={600}
            height={32}
            className="w-full h-full block"
          />
        </div>

        <div className="text-[11px] font-mono text-slate-400 shrink-0">
          {hoverCell ? `X: ${hoverCell.col} Y: ${hoverCell.row}` : `${levelData.width} клеток`}
        </div>
      </div>
    </main>
  );
};
