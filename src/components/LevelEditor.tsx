/**
 * Pixel Studio Pro - Interactive Level Editor (LevelEditor)
 *
 * Stage 1 Refactored Architecture:
 * - Studio Header Bar (strictly 48px height): unblocks 100% of the canvas grid (no overlapping banners).
 * - Inline Educational Missions Bar embedded in the header.
 * - High-contrast, prominent Playtest button (44x44px equivalent) in top-right corner.
 * - Continuous Freehand Brush drawing in both X and Y dimensions (no horizontal drag lock).
 * - 2D Box / Rectangle dragging mode with live preview and dimension count.
 * - Ghost Cursor (50% opacity translucent preview of selected tile at hoverCell).
 * - High-visibility Minimap with Start/Finish and Viewport bounds.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Grid,
  Home,
  Move,
  Play,
  Redo2,
  Undo2,
  ZoomIn,
  ZoomOut,
  Eraser,
  PenTool,
} from 'lucide-react';
import { sound } from '../audio/soundEngine';
import { CELL_SIZE, GRID_ROWS, THEMES } from '../game/constants';
import { generateTutorialSample } from '../game/tutorialPresets';
import { SpriteRenderer } from '../graphics/spriteRenderer';
import { LevelData, LevelItem, ThemeId, TileId, ToolMode } from '../types/game';
import { EditorTutorialBar } from './EditorTutorialBar';

interface LevelEditorProps {
  levelData: LevelData;
  activeTool: ToolMode;
  selectedTile: TileId;
  selectedTheme: ThemeId;
  onUpdateItems: (newItems: LevelItem[], recordHistory?: boolean) => void;
  onOpenTutorial: (stepIndex?: number) => void;
  onSelectTile: (tile: TileId) => void;
  onStartPlay: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
  onExitToMenu?: () => void;
}

export const LevelEditor: React.FC<LevelEditorProps> = ({
  levelData,
  activeTool,
  selectedTile,
  selectedTheme,
  onUpdateItems,
  onOpenTutorial,
  onSelectTile,
  onStartPlay,
  canUndo = false,
  canRedo = false,
  onUndo,
  onRedo,
  onExitToMenu,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const minimapRef = useRef<HTMLCanvasElement | null>(null);

  // Viewport & Navigation
  const [cameraX, setCameraX] = useState<number>(0);
  const [zoom, setZoom] = useState<number>(1.0);
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [hoverCell, setHoverCell] = useState<{ col: number; row: number } | null>(null);

  // In-Editor Tutorial Guide State
  const [tutorialStep, setTutorialStep] = useState<number>(0);
  const [isTutorialBarOpen, setIsTutorialBarOpen] = useState<boolean>(true);
  const [isTutorialMinimized, setIsTutorialMinimized] = useState<boolean>(false);

  // Drawing & Interaction State
  const [isMouseDown, setIsMouseDown] = useState<boolean>(false);
  const [mouseButton, setMouseButton] = useState<number>(0); // 0 = left, 1 = middle, 2 = right
  const [dragStartCell, setDragStartCell] = useState<{ col: number; row: number } | null>(null);
  const [dragCurrentCell, setDragCurrentCell] = useState<{ col: number; row: number } | null>(null);

  // Continuous stroke buffer (accumulates all items changed during current mousedown stroke)
  const currentStrokeItemsRef = useRef<Map<string, LevelItem>>(new Map());
  const strokeDidModifyRef = useRef<boolean>(false);

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

  // Apply Sample for Current Tutorial Step
  const handleApplySample = (stepIndex: number) => {
    const vpW = getViewportWidth();
    const centerCol = Math.max(
      4,
      Math.min(levelData.width - 12, Math.floor((cameraX + vpW * 0.5) / effectiveCellSize))
    );

    const updated = generateTutorialSample(stepIndex, levelData.items, centerCol, levelData.width);
    onUpdateItems(updated, true);
    sound.playPlaceTile();
  };

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

  // Erase tile at (col, row)
  const eraseAt = useCallback(
    (col: number, row: number) => {
      const filtered = levelData.items.filter((it) => !(it.x === col && it.y === row));
      if (filtered.length !== levelData.items.length) {
        onUpdateItems(filtered, false);
        strokeDidModifyRef.current = true;
      }
    },
    [levelData.items, onUpdateItems]
  );

  // Put tile at (col, row)
  const paintAt = useCallback(
    (col: number, row: number) => {
      // Check if same tile already exists at this coordinate
      const existing = levelData.items.find((it) => it.x === col && it.y === row);
      if (existing && existing.tileId === selectedTile) {
        return;
      }

      const filtered = levelData.items.filter((it) => !(it.x === col && it.y === row));
      const newItem: LevelItem = {
        id: `item_${Date.now()}_${col}_${row}_${Math.random().toString(36).substring(2, 6)}`,
        tileId: selectedTile,
        x: col,
        y: row,
      };
      filtered.push(newItem);
      onUpdateItems(filtered, false);
      strokeDidModifyRef.current = true;
    },
    [levelData.items, onUpdateItems, selectedTile]
  );

  // --- Main 60fps Canvas Render Loop ---
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

      // 1. Draw Parallax Background
      if (bgImageRef.current && bgImageRef.current.complete) {
        const naturalW = bgImageRef.current.naturalWidth || 1376;
        const naturalH = bgImageRef.current.naturalHeight || 768;
        const imgAspect = naturalW / naturalH;

        if (imgAspect > 2.5) {
          // Ultra-wide single panorama
          const maxCam = Math.max(1, totalWorldPx - width);
          const progress = Math.max(0, Math.min(1, cameraX / maxCam));
          const bgW = Math.max(width, height * imgAspect);
          const bgX = -progress * Math.max(0, bgW - width);
          ctx.drawImage(bgImageRef.current, bgX, 0, bgW, height);
        } else {
          // Standard tileable background
          const parallaxFactor = 0.25;
          const bgWidth = height * imgAspect;
          const bgOffsetX = -(cameraX * parallaxFactor) % bgWidth;

          for (let x = bgOffsetX - bgWidth; x < width + bgWidth; x += bgWidth) {
            ctx.drawImage(bgImageRef.current, x, 0, bgWidth, height);
          }
        }
      } else {
        // Fallback Sky gradient
        const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
        skyGrad.addColorStop(0, '#0f172a');
        skyGrad.addColorStop(1, '#1e293b');
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, width, height);
      }

      // 2. Draw Editor Grid Lines
      if (showGrid) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.09)';
        ctx.lineWidth = 1;

        // Vertical columns
        const startC = Math.max(0, Math.floor(cameraX / effectiveCellSize));
        const endC = Math.min(
          levelData.width,
          Math.ceil((cameraX + width) / effectiveCellSize) + 1
        );

        ctx.beginPath();
        for (let c = startC; c <= endC; c++) {
          const gx = Math.round(c * effectiveCellSize - cameraX);
          ctx.moveTo(gx, 0);
          ctx.lineTo(gx, height);
        }

        // Horizontal rows
        for (let r = 0; r <= GRID_ROWS; r++) {
          const gy = Math.round(r * effectiveCellSize);
          ctx.moveTo(0, gy);
          ctx.lineTo(width, gy);
        }
        ctx.stroke();

        // Guide marker lines for ground (row 14) and jump horizon (row 8)
        ctx.strokeStyle = 'rgba(245, 158, 11, 0.22)';
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(0, Math.round(14 * effectiveCellSize));
        ctx.lineTo(width, Math.round(14 * effectiveCellSize));
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // 3. Draw Level Items
      ctx.save();
      ctx.translate(-cameraX, 0);

      const itemMap = new Map<string, LevelItem>();
      levelData.items.forEach((it) => itemMap.set(`${it.x},${it.y}`, it));

      const startCol = Math.max(0, Math.floor(cameraX / effectiveCellSize) - 1);
      const endCol = Math.min(
        levelData.width,
        Math.ceil((cameraX + width) / effectiveCellSize) + 1
      );

      levelData.items.forEach((item) => {
        if (item.x >= startCol && item.x <= endCol) {
          const px = item.x * effectiveCellSize;
          const py = item.y * effectiveCellSize;

          const hasLeft =
            itemMap.has(`${item.x - 1},${item.y}`) &&
            itemMap.get(`${item.x - 1},${item.y}`)?.tileId === item.tileId;
          const hasRight =
            itemMap.has(`${item.x + 1},${item.y}`) &&
            itemMap.get(`${item.x + 1},${item.y}`)?.tileId === item.tileId;

          SpriteRenderer.drawTile(ctx, item.tileId, px, py, effectiveCellSize, {
            hasLeft,
            hasRight,
            animTime,
            variant: item.variant,
          });
        }
      });

      // 4. Draw 2D Box / Rectangle Drag Preview
      if (
        isMouseDown &&
        mouseButton === 0 &&
        activeTool === 'line' &&
        dragStartCell &&
        dragCurrentCell
      ) {
        const minC = Math.min(dragStartCell.col, dragCurrentCell.col);
        const maxC = Math.max(dragStartCell.col, dragCurrentCell.col);
        const minR = Math.min(dragStartCell.row, dragCurrentCell.row);
        const maxR = Math.max(dragStartCell.row, dragCurrentCell.row);

        ctx.save();
        ctx.globalAlpha = 0.7;
        for (let c = minC; c <= maxC; c++) {
          for (let r = minR; r <= maxR; r++) {
            const px = c * effectiveCellSize;
            const py = r * effectiveCellSize;
            SpriteRenderer.drawTile(ctx, selectedTile, px, py, effectiveCellSize, {
              animTime,
            });
            ctx.strokeStyle = '#f59e0b';
            ctx.lineWidth = 1.5;
            ctx.strokeRect(px + 1, py + 1, effectiveCellSize - 2, effectiveCellSize - 2);
          }
        }

        // Draw dimension badge (e.g. 4 × 2)
        const badgeX = maxC * effectiveCellSize + effectiveCellSize * 0.5;
        const badgeY = minR * effectiveCellSize - 10;
        ctx.globalAlpha = 1.0;
        ctx.fillStyle = '#0f172a';
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 1;
        const dimText = `${maxC - minC + 1} × ${maxR - minR + 1}`;
        ctx.font = 'bold 11px system-ui, sans-serif';
        const txtW = ctx.measureText(dimText).width;
        ctx.fillRect(badgeX - txtW * 0.5 - 6, badgeY - 14, txtW + 12, 18);
        ctx.strokeRect(badgeX - txtW * 0.5 - 6, badgeY - 14, txtW + 12, 18);
        ctx.fillStyle = '#fef08a';
        ctx.fillText(dimText, badgeX - txtW * 0.5, badgeY);
        ctx.restore();
      }

      // 5. Ghost Cursor Hover Preview (50% opacity block under mouse)
      if (hoverCell && (!isMouseDown || activeTool === 'erase')) {
        const hx = hoverCell.col * effectiveCellSize;
        const hy = hoverCell.row * effectiveCellSize;

        if (activeTool === 'erase' || mouseButton === 2) {
          // Red eraser indicator box
          ctx.fillStyle = 'rgba(239, 68, 68, 0.35)';
          ctx.fillRect(hx, hy, effectiveCellSize, effectiveCellSize);
          ctx.strokeStyle = '#ef4444';
          ctx.lineWidth = 2;
          ctx.strokeRect(hx + 1, hy + 1, effectiveCellSize - 2, effectiveCellSize - 2);

          // Diagonal delete indicator
          ctx.beginPath();
          ctx.moveTo(hx + 8, hy + 8);
          ctx.lineTo(hx + effectiveCellSize - 8, hy + effectiveCellSize - 8);
          ctx.moveTo(hx + effectiveCellSize - 8, hy + 8);
          ctx.lineTo(hx + 8, hy + effectiveCellSize - 8);
          ctx.stroke();
        } else {
          // Translucent ghost preview of selected item
          ctx.save();
          ctx.globalAlpha = 0.5;
          SpriteRenderer.drawTile(ctx, selectedTile, hx, hy, effectiveCellSize, {
            animTime,
          });
          ctx.restore();

          // Gold cursor boundary box
          ctx.fillStyle = 'rgba(245, 158, 11, 0.15)';
          ctx.fillRect(hx, hy, effectiveCellSize, effectiveCellSize);
          ctx.strokeStyle = '#f59e0b';
          ctx.lineWidth = 2;
          ctx.strokeRect(hx + 1, hy + 1, effectiveCellSize - 2, effectiveCellSize - 2);
        }
      }

      ctx.restore();

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
    mCtx.fillStyle = '#0B0F19';
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

    // Draw Start flag & Goal beacon
    mCtx.fillStyle = '#22c55e';
    mCtx.fillRect(0, 0, 4, mH);
    mCtx.fillStyle = '#3b82f6';
    mCtx.fillRect(mW - 4, 0, 4, mH);

    // Draw Viewport Frame Box
    const vpW = getViewportWidth();
    const frameX = (cameraX / totalWorldPx) * mW;
    const frameW = Math.max(18, (vpW / totalWorldPx) * mW);

    mCtx.fillStyle = 'rgba(245, 158, 11, 0.25)';
    mCtx.fillRect(frameX, 0, frameW, mH);
    mCtx.strokeStyle = '#f59e0b';
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
    const isMiddleClick = e.button === 1 || e.altKey;

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
    strokeDidModifyRef.current = false;

    if (isRightClick || activeTool === 'erase') {
      eraseAt(cell.col, cell.row);
      sound.playErase();
    } else if (activeTool === 'brush') {
      // Freehand brush: place immediately at current cell
      paintAt(cell.col, cell.row);
      sound.playPlaceTile();
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
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
      // Continuous erase along mouse movement
      eraseAt(cell.col, cell.row);
    } else if (activeTool === 'brush' && mouseButton === 0) {
      // Continuous freehand brush along mouse movement in both X & Y!
      paintAt(cell.col, cell.row);
    }
  };

  const handleMouseUp = () => {
    if (isPanningRef.current) {
      isPanningRef.current = false;
    }

    if (isMouseDown) {
      if (mouseButton === 0 && activeTool === 'line') {
        // Place 2D rectangular box of tiles
        if (dragStartCell && dragCurrentCell) {
          const minC = Math.min(dragStartCell.col, dragCurrentCell.col);
          const maxC = Math.max(dragStartCell.col, dragCurrentCell.col);
          const minR = Math.min(dragStartCell.row, dragCurrentCell.row);
          const maxR = Math.max(dragStartCell.row, dragCurrentCell.row);

          let updated = [...levelData.items];
          for (let c = minC; c <= maxC; c++) {
            for (let r = minR; r <= maxR; r++) {
              updated = updated.filter((it) => !(it.x === c && it.y === r));
              updated.push({
                id: `item_${Date.now()}_${c}_${r}_${Math.random().toString(36).substring(2, 6)}`,
                tileId: selectedTile,
                x: c,
                y: r,
              });
            }
          }
          onUpdateItems(updated, true);
          sound.playPlaceTile();
        }
      } else if (strokeDidModifyRef.current) {
        // Record undo history for the completed brush/erase stroke
        onUpdateItems(levelData.items, true);
      }
    }

    setIsMouseDown(false);
    setDragStartCell(null);
    setDragCurrentCell(null);
    strokeDidModifyRef.current = false;
  };

  // Wheel horizontal scrolling & zoom
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
    <main className="flex-1 h-full flex flex-col bg-[#0B0F19] relative overflow-hidden select-none">
      {/* 1. STUDIO HEADER BAR (Strictly 48px height, unblocks canvas completely) */}
      <header className="h-12 bg-[#0F172A] border-b border-slate-800 px-3 sm:px-4 flex items-center justify-between shrink-0 z-30 gap-2">
        {/* Left: Studio Back & Quick History */}
        <div className="flex items-center gap-2">
          {onExitToMenu && (
            <button
              onClick={() => {
                sound.playClick();
                onExitToMenu();
              }}
              title="Вернуться в Студию Pixel Word"
              className="h-8.5 px-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-sky-400 font-bold text-xs flex items-center gap-1.5 border border-slate-700 transition-colors cursor-pointer shrink-0"
            >
              <Home className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Студия</span>
            </button>
          )}

          {/* Level Info Pill */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-xl bg-[#0B0F19] border border-slate-800 text-xs">
            <span className="font-bold text-amber-400 truncate max-w-[140px]">
              {levelData.name || 'Новый уровень'}
            </span>
            <span className="text-[10px] text-slate-500">•</span>
            <span className="text-slate-400">{themeConfig.name}</span>
          </div>

          {/* Undo / Redo */}
          {onUndo && onRedo && (
            <div className="flex items-center gap-1">
              <button
                onClick={onUndo}
                disabled={!canUndo}
                title="Отменить действие (Ctrl+Z)"
                className="h-8.5 w-8 rounded-xl bg-slate-800/70 hover:bg-slate-700 text-slate-300 hover:text-white disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center border border-slate-700/80 transition-colors cursor-pointer"
              >
                <Undo2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={onRedo}
                disabled={!canRedo}
                title="Повторить действие (Ctrl+Y)"
                className="h-8.5 w-8 rounded-xl bg-slate-800/70 hover:bg-slate-700 text-slate-300 hover:text-white disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center border border-slate-700/80 transition-colors cursor-pointer"
              >
                <Redo2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Center: Inline Educational Mission Widget */}
        <div className="flex items-center justify-center">
          {isTutorialBarOpen && (
            <EditorTutorialBar
              currentStep={tutorialStep}
              onStepChange={setTutorialStep}
              onSelectTile={onSelectTile}
              onApplySample={handleApplySample}
              onStartPlay={onStartPlay}
              onOpenFullModal={(step) => onOpenTutorial(step)}
              onClose={() => setIsTutorialBarOpen(false)}
              isMinimized={isTutorialMinimized}
              onToggleMinimize={() => setIsTutorialMinimized((m) => !m)}
            />
          )}
        </div>

        {/* Right: Viewport Controls & High-Contrast Playtest Action */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Jump to Start / Finish */}
          <div className="hidden md:flex items-center bg-slate-800/70 border border-slate-700/80 rounded-xl p-0.5">
            <button
              onClick={() => setCameraX(0)}
              title="Перейти к старту уровня"
              className="px-2 py-1 rounded-lg text-slate-300 hover:text-white text-xs font-bold transition-colors cursor-pointer flex items-center gap-0.5"
            >
              <ChevronLeft className="w-3.5 h-3.5 text-amber-400" />
              <span>Старт</span>
            </button>
            <button
              onClick={() => setCameraX(getMaxCameraX())}
              title="Перейти к финишу уровня"
              className="px-2 py-1 rounded-lg text-slate-300 hover:text-white text-xs font-bold transition-colors cursor-pointer flex items-center gap-0.5"
            >
              <span>Финиш</span>
              <ChevronRight className="w-3.5 h-3.5 text-amber-400" />
            </button>
          </div>

          {/* Grid Toggle */}
          <button
            onClick={() => setShowGrid((g) => !g)}
            title={showGrid ? 'Скрыть сетку' : 'Показать сетку'}
            className={`h-8.5 w-8.5 rounded-xl border flex items-center justify-center transition-colors cursor-pointer ${
              showGrid
                ? 'text-amber-400 bg-amber-500/20 border-amber-400/40'
                : 'text-slate-400 bg-slate-800/70 border-slate-700 hover:bg-slate-700'
            }`}
          >
            <Grid className="w-4 h-4" />
          </button>

          {/* Zoom In / Out */}
          <div className="hidden sm:flex items-center bg-slate-800/70 border border-slate-700/80 rounded-xl p-0.5">
            <button
              onClick={() => setZoom((z) => Math.max(0.7, Number((z - 0.15).toFixed(2))))}
              title="Отдалить"
              className="p-1 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] font-mono text-slate-300 px-1 font-bold">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => setZoom((z) => Math.min(1.4, Number((z + 0.15).toFixed(2))))}
              title="Приблизить"
              className="p-1 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Primary High-Contrast Playtest Button (44px target) */}
          <button
            onClick={() => {
              sound.playCoin();
              onStartPlay();
            }}
            title="Запустить уровень и проверить физику (Enter)"
            className="h-9 sm:h-10 px-3.5 sm:px-5 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-slate-950 font-black text-xs sm:text-sm uppercase tracking-wider flex items-center gap-1.5 shadow-lg shadow-emerald-500/25 active:scale-95 transition-all cursor-pointer border border-emerald-300/40 shrink-0 animate-pulse hover:animate-none"
          >
            <Play className="w-4 h-4 fill-slate-950 stroke-[2.5]" />
            <span>ТЕСТ</span>
          </button>
        </div>
      </header>

      {/* 2. MAIN CANVAS AREA (Begins immediately below header, 100% visible) */}
      <div
        ref={containerRef}
        className={`flex-1 w-full h-full relative ${
          activeTool === 'erase' ? 'cursor-cell' : 'cursor-crosshair'
        }`}
      >
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

        {/* Small floating tool tip when hovering */}
        <div className="absolute bottom-2 left-4 pointer-events-none text-[11px] font-mono text-slate-400 bg-slate-900/80 px-2.5 py-1 rounded-lg border border-slate-800 backdrop-blur-xs flex items-center gap-2">
          <span className="flex items-center gap-1 text-amber-400 font-bold">
            {activeTool === 'erase' ? (
              <>
                <Eraser className="w-3 h-3 text-rose-400" />
                <span className="text-rose-400">Ластик</span>
              </>
            ) : activeTool === 'line' ? (
              <>
                <Move className="w-3 h-3 text-amber-400" />
                <span>Прямоугольная область</span>
              </>
            ) : (
              <>
                <PenTool className="w-3 h-3 text-emerald-400" />
                <span>Свободная кисть</span>
              </>
            )}
          </span>
          <span className="text-slate-600">|</span>
          <span>ЛКМ — ставить, ПКМ — удалить</span>
        </div>
      </div>

      {/* 3. BOTTOM MINIMAP & STATUS BAR (44px height) */}
      <div className="h-11 bg-[#0F172A] border-t border-slate-800 flex items-center px-4 gap-3 shrink-0 z-20">
        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0 flex items-center gap-1.5">
          <Move className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden sm:inline">Карта уровня:</span>
        </div>

        {/* Minimap Canvas Container */}
        <div
          className="flex-1 h-7 rounded-lg overflow-hidden border border-slate-700 bg-[#0B0F19] relative cursor-ew-resize"
          onMouseDown={(e) => handleMinimapInteraction(e.clientX)}
          onMouseMove={(e) => {
            if (e.buttons === 1) handleMinimapInteraction(e.clientX);
          }}
        >
          <canvas
            ref={minimapRef}
            width={600}
            height={28}
            className="w-full h-full block"
          />
        </div>

        <div className="text-[11px] font-mono text-slate-400 shrink-0 font-bold">
          {hoverCell ? `X: ${hoverCell.col} Y: ${hoverCell.row}` : `${levelData.width} блоков`}
        </div>
      </div>
    </main>
  );
};
