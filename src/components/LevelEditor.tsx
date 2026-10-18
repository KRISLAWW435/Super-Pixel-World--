/**
 * Pixel Studio Pro - Interactive Level Editor (LevelEditor)
 *
 * Stage 1 & 2 Refactored Architecture:
 * - Studio Header Bar (strictly 48px height): unblocks 100% of the canvas grid (no overlapping banners).
 * - Ground Enemy Snapping & Ground Validation:
 *   - Ground enemies (enemy_chaser, enemy_patrol, enemy_jumper) automatically snap to the solid block below (ground_y - 1).
 *   - Placement over abyss is blocked with warning toast: "Врагов можно ставить только на твердую поверхность!".
 *   - Area / 2D Box tool places ground enemies safely on the surface of each column.
 *   - Ghost Cursor shows translucent preview on the calculated ground surface with landing indicator & guide line.
 *   - Warning indicator (red cross + "Нет опоры") when hovering over void with a ground enemy.
 * - Global Keyboard Shortcuts & Navigation:
 *   - Spacebar + drag for smooth viewport panning.
 *   - Key G for grid toggle.
 *   - Enter / P for instant playtest.
 *   - B (Brush), R (Area), E (Eraser), Ctrl+S (Save), Ctrl+Z / Ctrl+Y (Undo/Redo).
 * - Interactive Floating Toast notification system for clear user feedback.
 * - High-visibility Minimap with Start/Finish and Viewport bounds.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Eraser,
  Grid,
  Home,
  Move,
  PenTool,
  Play,
  Redo2,
  Undo2,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { sound } from '../audio/soundEngine';
import { CELL_SIZE, GRID_ROWS, THEMES, findGroundRowBelow, isGroundEnemy } from '../game/constants';
import { generateTutorialSample } from '../game/tutorialPresets';
import { SpriteRenderer } from '../graphics/spriteRenderer';
import { LevelData, LevelItem, ThemeId, TileId, ToolMode } from '../types/game';
import { EditorTutorialBar } from './EditorTutorialBar';
import { SoundControl } from './SoundControl';
import { useEditorCamera } from './useEditorCamera';

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
  onCameraAction?: () => void;
  isGuidedTourOpen?: boolean;
  guidedTourStep?: number;
  tourBlocksPlaced?: number;
  onAdvanceTourStep?: (step: number) => void;
  sidebar?: React.ReactNode;
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
  onCameraAction,
  isGuidedTourOpen = false,
  guidedTourStep = 0,
  tourBlocksPlaced = 0,
  onAdvanceTourStep,
  sidebar,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const minimapRef = useRef<HTMLCanvasElement | null>(null);

  // Camera & Navigation Hook (Supports 2D camera bounds, vertical scrolling to bottom, and zoom)
  const {
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
  } = useEditorCamera({
    levelWidth: levelData.width,
    levelHeight: levelData.height || GRID_ROWS,
    containerRef,
    canvasRef,
    onCameraAction,
  });

  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [hoverCell, setHoverCell] = useState<{ col: number; row: number } | null>(null);
  const [isSpaceHeld, setIsSpaceHeld] = useState<boolean>(false);

  // In-Editor Tutorial Guide State
  const [tutorialStep, setTutorialStep] = useState<number>(0);
  const [isTutorialBarOpen, setIsTutorialBarOpen] = useState<boolean>(true);
  const [isTutorialMinimized, setIsTutorialMinimized] = useState<boolean>(false);

  // Floating Toast Warning State
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const showToast = useCallback((msg: string) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToastMessage(msg);
    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 2600);
  }, []);

  // Drawing & Interaction State
  const [isMouseDown, setIsMouseDown] = useState<boolean>(false);
  const [mouseButton, setMouseButton] = useState<number>(0); // 0 = left, 1 = middle, 2 = right
  const [dragStartCell, setDragStartCell] = useState<{ col: number; row: number } | null>(null);
  const [dragCurrentCell, setDragCurrentCell] = useState<{ col: number; row: number } | null>(null);

  // Continuous stroke buffer (accumulates all items changed during current mousedown stroke)
  const strokeDidModifyRef = useRef<boolean>(false);

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

  // Key listeners for Space (pan) and G (grid)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return;

      if (e.code === 'Space' && !e.repeat) {
        setIsSpaceHeld(true);
      } else if (e.code === 'KeyG' && !e.ctrlKey && !e.metaKey) {
        setShowGrid((g) => !g);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setIsSpaceHeld(false);
        if (isPanningRef.current) {
          isPanningRef.current = false;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Apply Sample for Current Tutorial Step
  const handleApplySample = (stepIndex: number) => {
    const { width: vpW } = getViewportSize();
    const centerCol = Math.max(
      4,
      Math.min(levelData.width - 12, Math.floor((cameraX + vpW * 0.5) / effectiveCellSize))
    );

    const updated = generateTutorialSample(stepIndex, levelData.items, centerCol, levelData.width);
    onUpdateItems(updated, true);
    sound.playPlaceTile();
  };

  // Auto-helpers for guided tour steps (100% accessible for kids & touchpads)
  const handleTourAutoRoad = () => {
    let items = [...levelData.items];
    const timestamp = Date.now();
    for (let c = 5; c <= 7; c++) {
      items = items.filter((it) => !(it.x === c && it.y === 14));
      items.push({ id: `tour_road_${c}_${timestamp}`, tileId: 'grass_dirt', x: c, y: 14 });
    }
    onUpdateItems(items, true);
    sound.playPlaceTile();
  };

  const handleTourAutoCoin = () => {
    let items = [...levelData.items];
    const timestamp = Date.now();
    items = items.filter((it) => !(it.x === 6 && it.y === 11));
    items.push({ id: `tour_coin_6_${timestamp}`, tileId: 'coin', x: 6, y: 11 });
    onUpdateItems(items, true);
    sound.playCoin();
  };

  const handleTourAutoHazard = () => {
    let items = [...levelData.items];
    const timestamp = Date.now();
    items = items.filter((it) => !(it.x === 7 && it.y === 13));
    items.push({ id: `tour_spikes_7_${timestamp}`, tileId: 'spikes', x: 7, y: 13 });
    onUpdateItems(items, true);
    sound.playBump();
  };

  const handleTourAutoGoal = () => {
    let items = [...levelData.items];
    const timestamp = Date.now();
    items = items.filter((it) => !(it.x === 9 && it.y === 13));
    items.push({ id: `tour_goal_9_${timestamp}`, tileId: 'goal', x: 9, y: 13 });
    onUpdateItems(items, true);
    sound.playVictory();
  };


  // Erase tile at (col, row)
  const eraseAt = useCallback(
    (col: number, row: number) => {
      const filtered = levelData.items.filter((it) => {
        if (it.tileId.startsWith('pipe_')) {
          if (col >= it.x && col <= it.x + 1 && row >= it.y && row <= it.y + 1) {
            return false;
          }
        }
        return !(it.x === col && it.y === row);
      });
      if (filtered.length !== levelData.items.length) {
        onUpdateItems(filtered, false);
        strokeDidModifyRef.current = true;
      }
    },
    [levelData.items, onUpdateItems]
  );

  // Put tile at (col, row) with ground validation for ground enemies
  const paintAt = useCallback(
    (col: number, row: number) => {
      let finalRow = row;

      // Logic check for Ground Enemies: must stand on solid surface
      if (isGroundEnemy(selectedTile)) {
        const groundY = findGroundRowBelow(levelData.items, col, row);
        if (groundY === null || groundY <= 0) {
          showToast('Врагов можно ставить только на твердую поверхность!');
          sound.playBump();
          return;
        }
        finalRow = groundY - 1;
      }

      // Check if same tile already exists at this coordinate
      const existing = levelData.items.find((it) => it.x === col && it.y === finalRow);
      if (existing && existing.tileId === selectedTile) {
        return;
      }

      const isPipe = selectedTile.startsWith('pipe_');
      const filtered = levelData.items.filter((it) => {
        if (isPipe) {
          if (it.x >= col && it.x <= col + 1 && it.y >= finalRow && it.y <= finalRow + 1) {
            return false;
          }
        }
        if (it.tileId.startsWith('pipe_')) {
          if (col >= it.x && col <= it.x + 1 && finalRow >= it.y && finalRow <= it.y + 1) {
            return false;
          }
        }
        return !(it.x === col && it.y === finalRow);
      });

      const newItem: LevelItem = {
        id: `item_${Date.now()}_${col}_${finalRow}_${Math.random().toString(36).substring(2, 6)}`,
        tileId: selectedTile,
        x: col,
        y: finalRow,
      };
      filtered.push(newItem);
      onUpdateItems(filtered, false);
      strokeDidModifyRef.current = true;
    },
    [levelData.items, onUpdateItems, selectedTile, showToast]
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
          const maxCam = Math.max(1, totalWorldWidthPx - width);
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
        const maxLevelRows = levelData.height || GRID_ROWS;
        for (let r = 0; r <= maxLevelRows; r++) {
          const gy = Math.round(r * effectiveCellSize - cameraY);
          if (gy >= 0 && gy <= height) {
            ctx.moveTo(0, gy);
            ctx.lineTo(width, gy);
          }
        }
        ctx.stroke();

        // Guide marker lines for ground (row 14) and jump horizon (row 8)
        ctx.strokeStyle = 'rgba(245, 158, 11, 0.22)';
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        const groundGy = Math.round(14 * effectiveCellSize - cameraY);
        if (groundGy >= 0 && groundGy <= height) {
          ctx.moveTo(0, groundGy);
          ctx.lineTo(width, groundGy);
        }
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // 3. Draw Level Items
      ctx.save();
      ctx.translate(-cameraX, -cameraY);

      const itemMap = new Map<string, LevelItem>();
      levelData.items.forEach((it) => itemMap.set(`${it.x},${it.y}`, it));

      const startCol = Math.max(0, Math.floor(cameraX / effectiveCellSize) - 1);
      const endCol = Math.min(
        levelData.width,
        Math.ceil((cameraX + width) / effectiveCellSize) + 1
      );
      const startRow = Math.max(0, Math.floor(cameraY / effectiveCellSize) - 1);
      const endRow = Math.min(
        levelData.height || GRID_ROWS,
        Math.ceil((cameraY + height) / effectiveCellSize) + 1
      );

      levelData.items.forEach((item) => {
        if (item.x >= startCol && item.x <= endCol && item.y >= startRow && item.y <= endRow) {
          // For 2x2 pipes, skip bottom half of any legacy stacked pipe
          if (item.tileId.startsWith('pipe_')) {
            if (itemMap.has(`${item.x},${item.y - 1}`) && itemMap.get(`${item.x},${item.y - 1}`)?.tileId.startsWith('pipe_')) {
              return;
            }
          }

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

        if (isGroundEnemy(selectedTile)) {
          // For ground enemies: preview enemies falling precisely onto ground in each column
          let validGroundCount = 0;
          for (let c = minC; c <= maxC; c++) {
            const groundY = findGroundRowBelow(levelData.items, c, minR);
            if (groundY !== null && groundY > 0) {
              const targetR = groundY - 1;
              const px = c * effectiveCellSize;
              const py = targetR * effectiveCellSize;

              // Dotted drop guideline from minR down to ground if elevated
              if (targetR > minR) {
                ctx.save();
                ctx.strokeStyle = 'rgba(16, 185, 129, 0.45)';
                ctx.lineWidth = 1.5;
                ctx.setLineDash([3, 3]);
                ctx.beginPath();
                ctx.moveTo(px + effectiveCellSize * 0.5, minR * effectiveCellSize);
                ctx.lineTo(px + effectiveCellSize * 0.5, py);
                ctx.stroke();
                ctx.restore();
              }

              // Draw enemy ghost on ground
              ctx.globalAlpha = 0.75;
              SpriteRenderer.drawTile(ctx, selectedTile, px, py, effectiveCellSize, { animTime });

              // Emerald landing highlight
              ctx.strokeStyle = '#10b981';
              ctx.lineWidth = 2;
              ctx.strokeRect(px + 1, py + 1, effectiveCellSize - 2, effectiveCellSize - 2);
              validGroundCount++;
            } else {
              // No ground in this column: red warning indicator at minR
              const px = c * effectiveCellSize;
              const py = minR * effectiveCellSize;
              ctx.fillStyle = 'rgba(239, 68, 68, 0.25)';
              ctx.fillRect(px, py, effectiveCellSize, effectiveCellSize);
              ctx.strokeStyle = '#ef4444';
              ctx.lineWidth = 1.5;
              ctx.strokeRect(px + 1, py + 1, effectiveCellSize - 2, effectiveCellSize - 2);
              // Red cross
              ctx.beginPath();
              ctx.moveTo(px + 6, py + 6);
              ctx.lineTo(px + effectiveCellSize - 6, py + effectiveCellSize - 6);
              ctx.moveTo(px + effectiveCellSize - 6, py + 6);
              ctx.lineTo(px + 6, py + effectiveCellSize - 6);
              ctx.stroke();
            }
          }

          // Dimension badge for ground enemies
          const badgeX = maxC * effectiveCellSize + effectiveCellSize * 0.5;
          const badgeY = minR * effectiveCellSize - 10;
          ctx.globalAlpha = 1.0;
          ctx.fillStyle = '#0f172a';
          ctx.strokeStyle = validGroundCount > 0 ? '#10b981' : '#ef4444';
          ctx.lineWidth = 1;
          const dimText =
            validGroundCount > 0
              ? `${validGroundCount} на земле (${maxC - minC + 1} колонок)`
              : '⚠️ Нет опоры для врагов!';
          ctx.font = 'bold 11px system-ui, sans-serif';
          const txtW = ctx.measureText(dimText).width;
          ctx.fillRect(badgeX - txtW * 0.5 - 6, badgeY - 14, txtW + 12, 18);
          ctx.strokeRect(badgeX - txtW * 0.5 - 6, badgeY - 14, txtW + 12, 18);
          ctx.fillStyle = validGroundCount > 0 ? '#6ee7b7' : '#fca5a5';
          ctx.fillText(dimText, badgeX - txtW * 0.5, badgeY);
        } else {
          // Standard tile rectangular box preview
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
        }

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
        } else if (isGroundEnemy(selectedTile)) {
          // Ground enemy preview: must be attached to ground!
          const groundY = findGroundRowBelow(levelData.items, hoverCell.col, hoverCell.row);

          if (groundY !== null && groundY > 0) {
            const targetRow = groundY - 1;
            const targetPy = targetRow * effectiveCellSize;

            // Downward beam / dashed drop line if mouse is in the air above ground
            if (targetRow > hoverCell.row) {
              ctx.save();
              ctx.strokeStyle = 'rgba(16, 185, 129, 0.45)';
              ctx.lineWidth = 1.5;
              ctx.setLineDash([4, 4]);
              ctx.beginPath();
              ctx.moveTo(hx + effectiveCellSize * 0.5, hy + effectiveCellSize);
              ctx.lineTo(hx + effectiveCellSize * 0.5, targetPy);
              ctx.stroke();
              ctx.restore();

              // Cursor cell hint
              ctx.fillStyle = 'rgba(245, 158, 11, 0.12)';
              ctx.fillRect(hx, hy, effectiveCellSize, effectiveCellSize);
              ctx.strokeStyle = 'rgba(245, 158, 11, 0.5)';
              ctx.lineWidth = 1;
              ctx.strokeRect(hx + 1, hy + 1, effectiveCellSize - 2, effectiveCellSize - 2);
            }

            // Translucent ghost sprite of enemy standing firmly on ground
            ctx.save();
            ctx.globalAlpha = 0.55;
            SpriteRenderer.drawTile(ctx, selectedTile, hx, targetPy, effectiveCellSize, { animTime });
            ctx.restore();

            // Emerald landing border
            ctx.fillStyle = 'rgba(16, 185, 129, 0.15)';
            ctx.fillRect(hx, targetPy, effectiveCellSize, effectiveCellSize);
            ctx.strokeStyle = '#10b981';
            ctx.lineWidth = 2;
            ctx.strokeRect(hx + 1, targetPy + 1, effectiveCellSize - 2, effectiveCellSize - 2);

            // Landing label badge
            ctx.save();
            ctx.fillStyle = '#0f172a';
            ctx.strokeStyle = '#10b981';
            ctx.lineWidth = 1;
            const landTxt = targetRow > hoverCell.row ? '⬇ На землю' : '🌱 Опора';
            ctx.font = 'bold 10px system-ui, sans-serif';
            const tw = ctx.measureText(landTxt).width;
            ctx.fillRect(hx + effectiveCellSize * 0.5 - tw * 0.5 - 4, targetPy - 12, tw + 8, 14);
            ctx.strokeRect(hx + effectiveCellSize * 0.5 - tw * 0.5 - 4, targetPy - 12, tw + 8, 14);
            ctx.fillStyle = '#6ee7b7';
            ctx.fillText(landTxt, hx + effectiveCellSize * 0.5 - tw * 0.5, targetPy - 2);
            ctx.restore();
          } else {
            // No solid ground below: Warning Red Ghost Cursor
            ctx.fillStyle = 'rgba(239, 68, 68, 0.2)';
            ctx.fillRect(hx, hy, effectiveCellSize, effectiveCellSize);
            ctx.strokeStyle = '#ef4444';
            ctx.lineWidth = 2;
            ctx.strokeRect(hx + 1, hy + 1, effectiveCellSize - 2, effectiveCellSize - 2);

            // Red warning cross
            ctx.beginPath();
            ctx.moveTo(hx + 8, hy + 8);
            ctx.lineTo(hx + effectiveCellSize - 8, hy + effectiveCellSize - 8);
            ctx.moveTo(hx + effectiveCellSize - 8, hy + 8);
            ctx.lineTo(hx + 8, hy + effectiveCellSize - 8);
            ctx.stroke();

            // Warning badge
            ctx.save();
            ctx.fillStyle = '#0f172a';
            ctx.strokeStyle = '#ef4444';
            ctx.lineWidth = 1;
            const warnTxt = '⚠️ Нет опоры';
            ctx.font = 'bold 10px system-ui, sans-serif';
            const tw = ctx.measureText(warnTxt).width;
            ctx.fillRect(hx + effectiveCellSize * 0.5 - tw * 0.5 - 4, hy - 12, tw + 8, 14);
            ctx.strokeRect(hx + effectiveCellSize * 0.5 - tw * 0.5 - 4, hy - 12, tw + 8, 14);
            ctx.fillStyle = '#fca5a5';
            ctx.fillText(warnTxt, hx + effectiveCellSize * 0.5 - tw * 0.5, hy - 2);
            ctx.restore();
          }
        } else {
          // Standard tile ghost preview
          ctx.save();
          ctx.globalAlpha = 0.5;
          SpriteRenderer.drawTile(ctx, selectedTile, hx, hy, effectiveCellSize, {
            animTime,
          });
          ctx.restore();

          // Gold cursor boundary box (2x2 for pipes, 1x1 for standard blocks)
          const isPipeSelected = selectedTile.startsWith('pipe_');
          const cursorW = isPipeSelected ? effectiveCellSize * 2 : effectiveCellSize;
          const cursorH = isPipeSelected ? effectiveCellSize * 2 : effectiveCellSize;
          ctx.fillStyle = 'rgba(245, 158, 11, 0.15)';
          ctx.fillRect(hx, hy, cursorW, cursorH);
          ctx.strokeStyle = '#f59e0b';
          ctx.lineWidth = 2;
          ctx.strokeRect(hx + 1, hy + 1, cursorW - 2, cursorH - 2);
        }
      }

      // Pipe portal connections visualization (Task 4: Editor visualization)
      const isPipe = (t: string) => t.startsWith('pipe_');
      const hoveredItem = hoverCell
        ? levelData.items.find((it) => {
            if (isPipe(it.tileId)) {
              return hoverCell.col >= it.x && hoverCell.col <= it.x + 1 && hoverCell.row >= it.y && hoverCell.row <= it.y + 1;
            }
            return it.x === hoverCell.col && it.y === hoverCell.row;
          })
        : null;
      const isHoveringPipe = hoveredItem && isPipe(hoveredItem.tileId);

      if (isHoveringPipe && hoveredItem) {
        const isRed = hoveredItem.tileId.includes('red');
        const colorName = isRed ? 'Красный' : 'Зелёный';
        const linkColor = isRed ? '#ef4444' : '#22c55e';
        const sameColorPipes = levelData.items
          .filter((it) => (isRed ? it.tileId.includes('red') : it.tileId.includes('green')) && isPipe(it.tileId))
          .sort((a, b) => a.x - b.x || a.y - b.y);

        if (sameColorPipes.length >= 2) {
          const myIdx = sameColorPipes.findIndex((it) => it.id === hoveredItem.id);
          const paired = myIdx % 2 === 0 ? (sameColorPipes[myIdx + 1] ?? sameColorPipes[0]) : sameColorPipes[myIdx - 1];

          if (paired && paired.id !== hoveredItem.id) {
            // 2x2 Pipe center is at x + 1.0 (effectiveCellSize) and y + 1.0 (effectiveCellSize)
            const startX = hoveredItem.x * effectiveCellSize + effectiveCellSize;
            const startY = hoveredItem.y * effectiveCellSize + effectiveCellSize;
            const endX = paired.x * effectiveCellSize + effectiveCellSize;
            const endY = paired.y * effectiveCellSize + effectiveCellSize;

            // Draw glowing curved arc connecting the paired pipes
            ctx.save();
            ctx.strokeStyle = linkColor;
            ctx.lineWidth = 3;
            ctx.setLineDash([6, 4]);
            ctx.lineDashOffset = -animTime * 30;

            const midX = (startX + endX) * 0.5;
            const midY = Math.min(startY, endY) - Math.min(80, Math.abs(endX - startX) * 0.25) - 30;

            ctx.beginPath();
            ctx.moveTo(startX, startY);
            ctx.quadraticCurveTo(midX, midY, endX, endY);
            ctx.stroke();

            // Destination target dot and pulsing ring
            ctx.setLineDash([]);
            ctx.fillStyle = linkColor;
            ctx.beginPath();
            ctx.arc(endX, endY, 6, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = linkColor;
            ctx.lineWidth = 2;
            const pulseR = 8 + Math.sin(animTime * 8) * 3;
            ctx.beginPath();
            ctx.arc(endX, endY, pulseR, 0, Math.PI * 2);
            ctx.stroke();

            // Direction arrow head pointing to destination
            const angle = Math.atan2(endY - midY, endX - midX);
            ctx.beginPath();
            ctx.moveTo(endX, endY);
            ctx.lineTo(endX - 14 * Math.cos(angle - 0.4), endY - 14 * Math.sin(angle - 0.4));
            ctx.lineTo(endX - 14 * Math.cos(angle + 0.4), endY - 14 * Math.sin(angle + 0.4));
            ctx.closePath();
            ctx.fillStyle = linkColor;
            ctx.fill();

            // Badge near midpoint of curve
            const badgeTxt = `🌀 ${colorName} портал ➔ [${paired.x + 1}, ${paired.y + 1}]`;
            ctx.font = 'bold 11px Fredoka, sans-serif';
            const bw = ctx.measureText(badgeTxt).width;
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(midX - bw * 0.5 - 6, midY - 14, bw + 12, 20);
            ctx.strokeStyle = linkColor;
            ctx.strokeRect(midX - bw * 0.5 - 6, midY - 14, bw + 12, 20);
            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(badgeTxt, midX, midY - 4);

            ctx.restore();
          }
        } else {
          // Unpaired pipe warning in editor
          const px = hoveredItem.x * effectiveCellSize + effectiveCellSize * 0.5;
          const py = hoveredItem.y * effectiveCellSize - 12;
          ctx.save();
          const warnTxt = '⚠️ Нет выхода! Поставьте вторую трубу';
          ctx.font = 'bold 10px system-ui, sans-serif';
          const bw = ctx.measureText(warnTxt).width;
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(px - bw * 0.5 - 6, py - 12, bw + 12, 18);
          ctx.strokeStyle = '#ef4444';
          ctx.lineWidth = 1.5;
          ctx.strokeRect(px - bw * 0.5 - 6, py - 12, bw + 12, 18);
          ctx.fillStyle = '#fca5a5';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(warnTxt, px, py - 3);
          ctx.restore();
        }
      }

      // Guided Tour Visual Aids on Canvas (Drawing Step 4 Road, Step 6 Coin, Step 7 Enemy, Step 8 Spikes)
      if (isGuidedTourOpen) {
        if (guidedTourStep === 4) {
          // Guide for road across cols 5..7, row 14
          ctx.save();
          ctx.strokeStyle = '#f59e0b';
          ctx.lineWidth = 2.5;
          ctx.setLineDash([6, 4]);

          for (let c = 5; c <= 7; c++) {
            const px = c * effectiveCellSize;
            const py = 14 * effectiveCellSize;
            ctx.strokeRect(px + 1, py + 1, effectiveCellSize - 2, effectiveCellSize - 2);

            // Translucent ghost block
            ctx.globalAlpha = 0.45;
            SpriteRenderer.drawTile(ctx, 'grass_dirt', px, py, effectiveCellSize, { animTime });
            ctx.globalAlpha = 1.0;
          }
          ctx.restore();
        } else if (guidedTourStep === 6) {
          // Guide for coin at col 6, row 11
          ctx.save();
          const px = 6 * effectiveCellSize;
          const py = (11 + Math.sin(animTime * 3) * 0.15) * effectiveCellSize;
          ctx.strokeStyle = '#eab308';
          ctx.lineWidth = 2;
          ctx.setLineDash([4, 4]);
          ctx.strokeRect(px + 2, py + 2, effectiveCellSize - 4, effectiveCellSize - 4);
          ctx.globalAlpha = 0.6;
          SpriteRenderer.drawTile(ctx, 'coin', px, py, effectiveCellSize, { animTime });
          ctx.restore();
        } else if (guidedTourStep === 7) {
          // Guide for enemy at col 7, row 13
          ctx.save();
          const px = 7 * effectiveCellSize;
          const py = 13 * effectiveCellSize;
          ctx.strokeStyle = '#ef4444';
          ctx.lineWidth = 2;
          ctx.setLineDash([4, 4]);
          ctx.strokeRect(px + 2, py + 2, effectiveCellSize - 4, effectiveCellSize - 4);
          ctx.globalAlpha = 0.6;
          SpriteRenderer.drawTile(ctx, 'enemy_chaser', px, py, effectiveCellSize, { animTime });
          ctx.restore();
        } else if (guidedTourStep === 8) {
          // Guide for spikes at col 8, row 13
          ctx.save();
          const px = 8 * effectiveCellSize;
          const py = 13 * effectiveCellSize;
          ctx.strokeStyle = '#f43f5e';
          ctx.lineWidth = 2;
          ctx.setLineDash([4, 4]);
          ctx.strokeRect(px + 2, py + 2, effectiveCellSize - 4, effectiveCellSize - 4);
          ctx.globalAlpha = 0.6;
          SpriteRenderer.drawTile(ctx, 'spikes', px, py, effectiveCellSize, { animTime });
          ctx.restore();
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
    cameraY,
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
    isGuidedTourOpen,
    guidedTourStep,
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

    const totalRows = levelData.height || GRID_ROWS;
    const cellScaleX = mW / levelData.width;
    const cellScaleY = mH / totalRows;

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

    // Draw Viewport Frame Box in 2D
    const { width: vpW, height: vpH } = getViewportSize();
    const frameX = (cameraX / totalWorldWidthPx) * mW;
    const frameW = Math.max(16, (vpW / totalWorldWidthPx) * mW);
    const frameY = (cameraY / totalWorldHeightPx) * mH;
    const frameH = Math.max(8, (vpH / totalWorldHeightPx) * mH);

    mCtx.fillStyle = 'rgba(245, 158, 11, 0.25)';
    mCtx.fillRect(frameX, frameY, frameW, frameH);
    mCtx.strokeStyle = '#f59e0b';
    mCtx.lineWidth = 1.5;
    mCtx.strokeRect(frameX, frameY, frameW, frameH);
  };

  // ResizeObserver: perfectly syncs canvas pixel resolution with container
  // Completely eliminates canvas stretching/distortion when sidebar collapses or window resizes
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const syncCanvasSize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w > 0 && h > 0) {
        if (canvas.width !== w || canvas.height !== h) {
          canvas.width = w;
          canvas.height = h;
          // Re-clamp camera bounds safely
          setCameraX((cx) => clampCameraX(cx));
          setCameraY((cy) => clampCameraY(cy));
        }
      }
    };

    syncCanvasSize();

    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(() => {
        syncCanvasSize();
      });
      ro.observe(container);
    }

    window.addEventListener('resize', syncCanvasSize);
    return () => {
      if (ro) ro.disconnect();
      window.removeEventListener('resize', syncCanvasSize);
    };
  }, [clampCameraX, clampCameraY, setCameraX, setCameraY]);

  // --- Mouse / Touch Handlers for Editing ---

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const isRightClick = e.button === 2;
    const isMiddleClick = e.button === 1 || e.altKey || isSpaceHeld;

    if (isMiddleClick) {
      startPan(e.clientX, e.clientY);
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
      updatePan(e.clientX, e.clientY);
      return;
    }

    const cell = getCellFromMouse(e.clientX, e.clientY);
    setHoverCell(cell);

    if (!isMouseDown || !cell) return;
    setDragCurrentCell(cell);

    if (mouseButton === 2 || activeTool === 'erase') {
      eraseAt(cell.col, cell.row);
    } else if (activeTool === 'brush' && mouseButton === 0) {
      paintAt(cell.col, cell.row);
    }
  };

  const handleMouseUp = () => {
    endPan();

    if (isMouseDown) {
      if (mouseButton === 0 && activeTool === 'line') {
        if (dragStartCell && dragCurrentCell) {
          const minC = Math.min(dragStartCell.col, dragCurrentCell.col);
          const maxC = Math.max(dragStartCell.col, dragCurrentCell.col);
          const minR = Math.min(dragStartCell.row, dragCurrentCell.row);
          const maxR = Math.max(dragStartCell.row, dragCurrentCell.row);

          let updated = [...levelData.items];
          let placedCount = 0;

          if (isGroundEnemy(selectedTile)) {
            for (let c = minC; c <= maxC; c++) {
              const groundY = findGroundRowBelow(levelData.items, c, minR);
              if (groundY !== null && groundY > 0) {
                const targetR = groundY - 1;
                updated = updated.filter((it) => !(it.x === c && it.y === targetR));
                updated.push({
                  id: `item_${Date.now()}_${c}_${targetR}_${Math.random().toString(36).substring(2, 6)}`,
                  tileId: selectedTile,
                  x: c,
                  y: targetR,
                });
                placedCount++;
              }
            }

            if (placedCount === 0) {
              showToast('Врагов можно ставить только на твердую поверхность!');
              sound.playBump();
              setIsMouseDown(false);
              setDragStartCell(null);
              setDragCurrentCell(null);
              return;
            }
          } else {
            for (let c = minC; c <= maxC; c++) {
              for (let r = minR; r <= maxR; r++) {
                updated = updated.filter((it) => !(it.x === c && it.y === r));
                updated.push({
                  id: `item_${Date.now()}_${c}_${r}_${Math.random().toString(36).substring(2, 6)}`,
                  tileId: selectedTile,
                  x: c,
                  y: r,
                });
                placedCount++;
              }
            }
          }

          onUpdateItems(updated, true);
          sound.playPlaceTile();
        }
      } else if (strokeDidModifyRef.current) {
        onUpdateItems(levelData.items, true);
      }
    }

    setIsMouseDown(false);
    setDragStartCell(null);
    setDragCurrentCell(null);
    strokeDidModifyRef.current = false;
  };

  // Minimap click / drag pan in 2D
  const handleMinimapInteraction = (clientX: number, clientY?: number) => {
    onCameraAction?.();
    const mCanvas = minimapRef.current;
    if (!mCanvas) return;
    const rect = mCanvas.getBoundingClientRect();
    const relX = Math.max(0, Math.min(rect.width, clientX - rect.left));
    const targetRatioX = relX / rect.width;
    const { width: vpW, height: vpH } = getViewportSize();
    const newCamX = targetRatioX * totalWorldWidthPx - vpW * 0.5;
    setCameraX(clampCameraX(newCamX));

    if (typeof clientY === 'number') {
      const relY = Math.max(0, Math.min(rect.height, clientY - rect.top));
      const targetRatioY = relY / rect.height;
      const newCamY = targetRatioY * totalWorldHeightPx - vpH * 0.5;
      setCameraY(clampCameraY(newCamY));
    }
  };

  // Cursor state
  const getCursorClass = () => {
    if (isPanningRef.current) return 'cursor-grabbing';
    if (isSpaceHeld) return 'cursor-grab';
    if (activeTool === 'erase') return 'cursor-cell';
    return 'cursor-crosshair';
  };

  return (
    <div className="flex-1 w-full h-full flex flex-col bg-[#0B0F19] relative overflow-hidden select-none">
      {/* 1. GLOBAL STUDIO HEADER BAR (Strictly 48px height, 100% width across canvas & sidebar) */}
      <header className="h-12 bg-[#0F172A] border-b border-slate-800 px-3 sm:px-4 flex items-center justify-between shrink-0 z-30 gap-2 w-full">
        {/* Left: Studio Back & Quick History */}
        <div className="flex items-center gap-2 shrink-0">
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
          <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-xl bg-[#0B0F19] border border-slate-800 text-xs shrink-0">
            <span className="font-bold text-amber-400 truncate max-w-[140px]">
              {levelData.name || 'Новый уровень'}
            </span>
            <span className="text-[10px] text-slate-500">•</span>
            <span className="text-slate-400">{themeConfig.name}</span>
          </div>

          {/* Undo / Redo */}
          {onUndo && onRedo && (
            <div className="flex items-center gap-1 shrink-0">
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
        <div className="flex items-center justify-center min-w-0 flex-1 overflow-hidden px-2">
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

        {/* Right: Viewport Controls, Sound & Permanently Fixed Green ▶ ТЕСТ Action */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
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
            title={showGrid ? 'Скрыть сетку (G)' : 'Показать сетку (G)'}
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
              title="Отдалить (Ctrl + колесико)"
              className="p-1 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] font-mono text-slate-300 px-1 font-bold">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => setZoom((z) => Math.min(1.4, Number((z + 0.15).toFixed(2))))}
              title="Приблизить (Ctrl + колесико)"
              className="p-1 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Sound Settings Popover */}
          <SoundControl compact align="right" />

          {/* Primary High-Contrast Playtest Button (Permanently fixed on far right) */}
          <button
            id="tour-play-button"
            onClick={() => {
              sound.playCoin();
              onStartPlay();
            }}
            title="Запустить уровень и проверить физику (Enter или P)"
            className="h-9 sm:h-9.5 px-3.5 sm:px-4.5 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-slate-950 font-black text-xs sm:text-sm uppercase tracking-wider flex items-center gap-1.5 shadow-lg shadow-emerald-500/25 active:scale-95 transition-all cursor-pointer border border-emerald-300/40 shrink-0"
          >
            <Play className="w-4 h-4 fill-slate-950 stroke-[2.5]" />
            <span>ТЕСТ</span>
          </button>
        </div>
      </header>

      {/* 2. MAIN WORKSPACE: Canvas on Left, Sidebar on Right */}
      <div className="flex-1 w-full flex flex-row overflow-hidden relative min-h-0">
        {/* Left: Canvas & Minimap Column */}
        <main className="flex-1 h-full min-w-0 flex flex-col bg-[#0B0F19] relative overflow-hidden select-none">

      {/* 2. FLOATING TOAST NOTIFICATION (Warnings, Feedback) */}
      {toastMessage && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 z-40 pointer-events-none animate-bounce">
          <div className="px-4 py-2.5 rounded-xl bg-slate-900/95 border-2 border-rose-500/80 text-rose-200 shadow-2xl shadow-rose-950/80 backdrop-blur-md flex items-center gap-2.5 text-xs sm:text-sm font-bold">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* 3. MAIN CANVAS AREA (Begins immediately below header, 100% visible) */}
      <div
        id="tour-editor-canvas"
        ref={containerRef}
        className={`flex-1 w-full h-full relative ${getCursorClass()}`}
      >
        {/* Dedicated target zone for Step 3 of Guided Tour */}
        <div
          id="tour-canvas-zone"
          className="absolute pointer-events-none select-none"
          style={{
            left: '20%',
            bottom: '20%',
            width: '380px',
            height: '120px',
            pointerEvents: 'none',
          }}
        />
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
          onContextMenu={(e) => e.preventDefault()}
          style={{ pointerEvents: 'auto' }}
          className="absolute inset-0 block w-full h-full"
        />

        {/* Small floating tool tip when hovering */}
        <div className="absolute bottom-2 left-4 pointer-events-none text-[11px] font-mono text-slate-400 bg-slate-900/85 px-3 py-1.5 rounded-lg border border-slate-800 backdrop-blur-xs flex items-center gap-2 shadow-lg">
          <span className="flex items-center gap-1 font-bold">
            {activeTool === 'erase' ? (
              <>
                <Eraser className="w-3 h-3 text-rose-400" />
                <span className="text-rose-400">Ластик (E)</span>
              </>
            ) : activeTool === 'line' ? (
              <>
                <Move className="w-3 h-3 text-amber-400" />
                <span className="text-amber-400">Область (R)</span>
              </>
            ) : (
              <>
                <PenTool className="w-3 h-3 text-emerald-400" />
                <span className="text-emerald-400">Кисть (B)</span>
              </>
            )}
          </span>
          <span className="text-slate-600">|</span>
          <span className="text-slate-300">
            ЛКМ — ставить, ПКМ — удалить | Пробел+тянуть — обзор | G — сетка
          </span>
        </div>
      </div>

      {/* 4. BOTTOM MINIMAP & STATUS BAR (48px height) */}
      <div className="h-12 bg-[#0F172A] border-t border-slate-800 flex items-center px-4 gap-3 shrink-0 z-20">
        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0 flex items-center gap-1.5">
          <Move className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden sm:inline">Карта уровня:</span>
        </div>

        {/* Minimap Canvas Container */}
        <div
          className="flex-1 h-8 sm:h-9 rounded-lg overflow-hidden border border-slate-700 bg-[#0B0F19] relative cursor-move select-none"
          onMouseDown={(e) => handleMinimapInteraction(e.clientX, e.clientY)}
          onMouseMove={(e) => {
            if (e.buttons === 1) handleMinimapInteraction(e.clientX, e.clientY);
          }}
          onTouchStart={(e) => {
            if (e.touches[0]) handleMinimapInteraction(e.touches[0].clientX, e.touches[0].clientY);
          }}
          onTouchMove={(e) => {
            if (e.touches[0]) handleMinimapInteraction(e.touches[0].clientX, e.touches[0].clientY);
          }}
        >
          <canvas
            ref={minimapRef}
            width={600}
            height={36}
            className="w-full h-full block"
          />
        </div>

        <div className="text-[11px] font-mono text-slate-400 shrink-0 font-bold">
          {hoverCell ? `X: ${hoverCell.col} Y: ${hoverCell.row}` : `${levelData.width} блоков`}
        </div>
      </div>
    </main>

    {/* Right: Toolbox Sidebar */}
    {sidebar}
  </div>
</div>
);
};
