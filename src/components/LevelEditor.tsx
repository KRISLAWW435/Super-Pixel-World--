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

  // Apply Sample for Current Tutorial Step
  const handleApplySample = (stepIndex: number) => {
    const vpW = getViewportWidth();
    const centerCol = Math.max(
      4,
      Math.min(levelData.width - 12, Math.floor((cameraX + vpW * 0.5) / effectiveCellSize))
    );

    let newItems = [...levelData.items];
    const timestamp = Date.now();

    if (stepIndex === 0) {
      // Step 1: Road & Platforms (10 blocks at rows 14-15)
      for (let c = centerCol - 4; c <= centerCol + 5; c++) {
        newItems = newItems.filter((it) => !(it.x === c && (it.y === 14 || it.y === 15)));
        newItems.push({ id: `road_${c}_14_${timestamp}`, tileId: 'grass_dirt', x: c, y: 14 });
        newItems.push({ id: `road_${c}_15_${timestamp}`, tileId: 'grass_dirt', x: c, y: 15 });
      }
    } else if (stepIndex === 1) {
      // Step 2: Gap with Spikes
      for (let c = centerCol - 3; c <= centerCol - 1; c++) {
        newItems = newItems.filter((it) => !(it.x === c && it.y === 14));
        newItems.push({ id: `plat_${c}_14_${timestamp}`, tileId: 'grass_dirt', x: c, y: 14 });
      }
      for (let c = centerCol + 1; c <= centerCol + 3; c++) {
        newItems = newItems.filter((it) => !(it.x === c && it.y === 14));
        newItems.push({ id: `plat_${c}_14_${timestamp}`, tileId: 'grass_dirt', x: c, y: 14 });
      }
      newItems = newItems.filter((it) => !(it.x === centerCol && it.y === 14));
      newItems.push({ id: `spike_${centerCol}_14_${timestamp}`, tileId: 'spikes', x: centerCol, y: 14 });
    } else if (stepIndex === 2) {
      // Step 3: Question block & Coins
      for (let c = centerCol - 2; c <= centerCol + 2; c++) {
        newItems = newItems.filter((it) => !(it.x === c && it.y === 14));
        newItems.push({ id: `ground_${c}_14_${timestamp}`, tileId: 'grass_dirt', x: c, y: 14 });
      }
      newItems = newItems.filter((it) => !(it.x === centerCol && it.y === 10));
      newItems.push({ id: `qblock_${centerCol}_10_${timestamp}`, tileId: 'question_block', x: centerCol, y: 10 });
      newItems = newItems.filter((it) => !(it.x === centerCol - 1 && it.y === 9));
      newItems.push({ id: `coin_${centerCol - 1}_9_${timestamp}`, tileId: 'coin', x: centerCol - 1, y: 9 });
      newItems = newItems.filter((it) => !(it.x === centerCol + 1 && it.y === 9));
      newItems.push({ id: `coin_${centerCol + 1}_9_${timestamp}`, tileId: 'coin', x: centerCol + 1, y: 9 });
    } else if (stepIndex === 3) {
      // Step 4: Spring & High Wall
      for (let c = centerCol - 2; c <= centerCol + 4; c++) {
        newItems = newItems.filter((it) => !(it.x === c && it.y === 14));
        newItems.push({ id: `ground_${c}_14_${timestamp}`, tileId: 'grass_dirt', x: c, y: 14 });
      }
      for (let r = 10; r <= 13; r++) {
        newItems = newItems.filter((it) => !(it.x === centerCol + 3 && it.y === r));
        newItems.push({ id: `wall_${centerCol + 3}_${r}_${timestamp}`, tileId: 'stone', x: centerCol + 3, y: r });
      }
      newItems = newItems.filter((it) => !(it.x === centerCol && it.y === 13));
      newItems.push({ id: `spring_${centerCol}_13_${timestamp}`, tileId: 'spring', x: centerCol, y: 13 });
    } else if (stepIndex === 4) {
      // Step 5: Battle Enemies (Chaser on left, Patrol on right)
      for (let c = centerCol - 4; c <= centerCol + 4; c++) {
        newItems = newItems.filter((it) => !(it.x === c && it.y === 14));
        newItems.push({ id: `ground_${c}_14_${timestamp}`, tileId: 'grass_dirt', x: c, y: 14 });
      }
      newItems = newItems.filter((it) => !(it.x === centerCol - 2 && it.y === 13));
      newItems.push({ id: `enemy_chaser_${centerCol - 2}_13_${timestamp}`, tileId: 'enemy_chaser', x: centerCol - 2, y: 13 });
      newItems = newItems.filter((it) => !(it.x === centerCol + 2 && it.y === 13));
      newItems.push({ id: `enemy_patrol_${centerCol + 2}_13_${timestamp}`, tileId: 'enemy_patrol', x: centerCol + 2, y: 13 });
    } else if (stepIndex === 5) {
      // Step 6: Goal gate on ground
      for (let c = centerCol - 1; c <= centerCol + 3; c++) {
        newItems = newItems.filter((it) => !(it.x === c && it.y === 14));
        newItems.push({ id: `ground_${c}_14_${timestamp}`, tileId: 'grass_dirt', x: c, y: 14 });
      }
      newItems = newItems.filter((it) => !(it.x === centerCol + 1 && it.y === 13));
      newItems.push({ id: `goal_${centerCol + 1}_13_${timestamp}`, tileId: 'goal', x: centerCol + 1, y: 13 });
    } else if (stepIndex === 6) {
      onStartPlay();
      return;
    }

    onUpdateItems(newItems, true);
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

      // 6. In-Editor Tutorial Blueprint Guidelines
      if (isTutorialBarOpen && !isTutorialMinimized) {
        ctx.save();
        const startX = cameraX;
        const viewW = canvas.width;
        const animPulse = 0.5 + 0.5 * Math.sin(animTime * 3);

        ctx.font = 'bold 11px system-ui, -apple-system, sans-serif';

        if (tutorialStep === 0) {
          // Step 1: Road & Ground rows 13 & 14
          ctx.fillStyle = `rgba(34, 197, 94, ${0.06 + 0.04 * animPulse})`;
          ctx.fillRect(startX, 13 * effectiveCellSize, viewW, 2 * effectiveCellSize);
          ctx.strokeStyle = `rgba(34, 197, 94, ${0.4 + 0.3 * animPulse})`;
          ctx.lineWidth = 1.5;
          ctx.setLineDash([6, 6]);
          ctx.strokeRect(startX, 13 * effectiveCellSize, viewW, 2 * effectiveCellSize);
          ctx.setLineDash([]);
          // Blueprint label
          ctx.fillStyle = '#22c55e';
          ctx.fillText('🌱 ЗОНА ЗЕМЛИ (Ряды 13–14): Зажмите ЛКМ и проведите дорожку', startX + 20, 13 * effectiveCellSize - 8);
        } else if (tutorialStep === 1) {
          // Step 2: Hazard Spikes row 14
          ctx.fillStyle = `rgba(239, 68, 68, ${0.08 + 0.04 * animPulse})`;
          ctx.fillRect(startX, 14 * effectiveCellSize, viewW, effectiveCellSize);
          ctx.strokeStyle = `rgba(239, 68, 68, ${0.5 + 0.3 * animPulse})`;
          ctx.lineWidth = 1.5;
          ctx.setLineDash([4, 4]);
          ctx.strokeRect(startX, 14 * effectiveCellSize, viewW, effectiveCellSize);
          ctx.setLineDash([]);
          // Blueprint label
          ctx.fillStyle = '#ef4444';
          ctx.fillText('⚠️ ЗОНА ЛОВУШЕК: Ставьте шипы на дно ям или перед уступами', startX + 20, 14 * effectiveCellSize - 8);
        } else if (tutorialStep === 2) {
          // Step 3: Question block & Coins row 9-10
          ctx.fillStyle = `rgba(250, 204, 21, ${0.06 + 0.04 * animPulse})`;
          ctx.fillRect(startX, 9 * effectiveCellSize, viewW, 2 * effectiveCellSize);
          ctx.strokeStyle = `rgba(250, 204, 21, ${0.5 + 0.3 * animPulse})`;
          ctx.lineWidth = 1.5;
          ctx.setLineDash([4, 4]);
          ctx.strokeRect(startX, 9 * effectiveCellSize, viewW, 2 * effectiveCellSize);
          ctx.setLineDash([]);
          // Blueprint label
          ctx.fillStyle = '#facc15';
          ctx.fillText('⭐ ЗОНА СЕКРЕТОВ (Ряды 9–10): Блок (?) бейте снизу головой, чтобы выбить монетку!', startX + 20, 9 * effectiveCellSize - 8);
        } else if (tutorialStep === 3) {
          // Step 4: Spring & High Wall
          ctx.fillStyle = `rgba(168, 85, 247, ${0.06 + 0.04 * animPulse})`;
          ctx.fillRect(startX, 13 * effectiveCellSize, viewW, effectiveCellSize);
          ctx.strokeStyle = `rgba(168, 85, 247, ${0.5 + 0.3 * animPulse})`;
          ctx.lineWidth = 1.5;
          ctx.setLineDash([5, 5]);
          ctx.strokeRect(startX, 13 * effectiveCellSize, viewW, effectiveCellSize);
          ctx.setLineDash([]);
          // Blueprint label
          ctx.fillStyle = '#c084fc';
          ctx.fillText('⚡ БАТУТ: Ставьте на землю перед высокой стеной — взлёт на 8–10 клеток!', startX + 20, 13 * effectiveCellSize - 8);
        } else if (tutorialStep === 4) {
          // Step 5: Enemy battle row 13
          ctx.fillStyle = `rgba(244, 63, 94, ${0.06 + 0.04 * animPulse})`;
          ctx.fillRect(startX, 13 * effectiveCellSize, viewW, effectiveCellSize);
          ctx.strokeStyle = `rgba(244, 63, 94, ${0.5 + 0.3 * animPulse})`;
          ctx.lineWidth = 1.5;
          ctx.setLineDash([5, 5]);
          ctx.strokeRect(startX, 13 * effectiveCellSize, viewW, effectiveCellSize);
          ctx.setLineDash([]);
          // Blueprint label
          ctx.fillStyle = '#fb7185';
          ctx.fillText('👾 ВРАГИ (Ряд 13): Расставьте 4 типа врагов · ПОБЕЖДАЙТЕ ПРЫЖКОМ СВЕРХУ!', startX + 20, 13 * effectiveCellSize - 8);
        } else if (tutorialStep === 5) {
          // Step 6: Goal gate zone
          const goalCol = levelData.width - 4;
          const gx = goalCol * effectiveCellSize;
          ctx.fillStyle = `rgba(59, 130, 246, ${0.1 + 0.05 * animPulse})`;
          ctx.fillRect(gx - effectiveCellSize, 11 * effectiveCellSize, 3 * effectiveCellSize, 3 * effectiveCellSize);
          ctx.strokeStyle = `rgba(59, 130, 246, ${0.7 + 0.3 * animPulse})`;
          ctx.lineWidth = 2;
          ctx.setLineDash([4, 4]);
          ctx.strokeRect(gx - effectiveCellSize, 11 * effectiveCellSize, 3 * effectiveCellSize, 3 * effectiveCellSize);
          ctx.setLineDash([]);
          // Blueprint label
          ctx.fillStyle = '#60a5fa';
          ctx.fillText('🏁 ФИНИШ: Поставьте ворота в самом конце карты (справа)!', startX + 20, 11 * effectiveCellSize - 8);
        } else if (tutorialStep === 6) {
          // Step 7: How to start & controls hint
          ctx.fillStyle = `rgba(16, 185, 129, ${0.08 + 0.04 * animPulse})`;
          ctx.fillRect(startX, 4 * effectiveCellSize, viewW, 3 * effectiveCellSize);
          ctx.strokeStyle = `rgba(16, 185, 129, ${0.6 + 0.4 * animPulse})`;
          ctx.lineWidth = 2;
          ctx.setLineDash([6, 6]);
          ctx.strokeRect(startX, 4 * effectiveCellSize, viewW, 3 * effectiveCellSize);
          ctx.setLineDash([]);
          ctx.fillStyle = '#34d399';
          ctx.font = 'bold 13px system-ui, -apple-system, sans-serif';
          ctx.fillText('🎮 НАЧАЛО ИГРЫ: Нажмите зелёную кнопку «ИГРАТЬ ▶» в правом верхнем углу!', startX + 24, 5 * effectiveCellSize + 4);
          ctx.font = '11px system-ui, -apple-system, sans-serif';
          ctx.fillStyle = '#e2e8f0';
          ctx.fillText('Управление: A / D или ⬅ ➡ (бег) · Пробел / W (прыжок, держите дольше = выше) · Прыгайте на врагов СВЕРХУ!', startX + 24, 6 * effectiveCellSize);
        }
        ctx.restore();
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
    isTutorialBarOpen,
    isTutorialMinimized,
    tutorialStep,
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
      {/* Interactive Step-by-Step Game Tutorial Bar */}
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

      {/* Top Floating Quick Bar */}
      <div
        className={`absolute left-4 right-4 z-20 flex items-center justify-between pointer-events-none transition-all ${
          isTutorialBarOpen && !isTutorialMinimized ? 'top-32 md:top-28' : 'top-3'
        }`}
      >
        {/* Left Status & Onboarding Hint */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {!isTutorialBarOpen && (
            <button
              onClick={() => {
                setIsTutorialBarOpen(true);
                setIsTutorialMinimized(false);
              }}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/20 border border-amber-300 backdrop-blur-md flex items-center gap-1.5 text-xs transition-all cursor-pointer active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Обучение как в играх ({tutorialStep + 1}/7)</span>
            </button>
          )}

          <div className="px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-700/80 shadow-md backdrop-blur-md flex items-center gap-2 text-xs">
            <span className="font-bold text-amber-400">💡 Быстрые клавиши:</span>
            <span className="text-slate-200 hidden sm:inline">
              ЛКМ — ставить, ПКМ — удалить, колесико/скролл — обзор мира.
            </span>
            <span className="text-slate-200 sm:hidden">ЛКМ ставить, ПКМ удалить</span>
            <button
              onClick={() => onOpenTutorial(tutorialStep)}
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
