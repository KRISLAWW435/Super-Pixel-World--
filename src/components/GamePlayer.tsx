/**
 * Super Pixel World - Fullscreen Game Player
 * 60fps isolated canvas loop, smooth camera follow with deadzone, parallax panoramic backdrop,
 * mobile on-screen touch controls, celebratory victory modal, and instant return to editor.
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  Clock,
  Coins,
  Crown,
  Heart,
  Home,
  Maximize2,
  Minimize2,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  Trophy,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { sound } from '../audio/soundEngine';
import { CELL_SIZE, GRID_ROWS, THEMES } from '../game/constants';
import { PhysicsEngine } from '../game/physics';
import { SpriteRenderer } from '../graphics/spriteRenderer';
import { TutorialManager } from '../services/TutorialManager';
import { HeroId, LevelData, ThemeId } from '../types/game';

interface GamePlayerProps {
  levelData: LevelData;
  heroId: HeroId;
  themeId: ThemeId;
  isFullscreen: boolean;
  isMuted: boolean;
  onExitToEditor: () => void;
  onExitToMenu?: () => void;
  onToggleFullscreen: () => void;
  onToggleMute: () => void;
  isTutorialMode?: boolean;
  isGuidedTour?: boolean;
  onCompleteTutorial?: () => void;
}

export const GamePlayer: React.FC<GamePlayerProps> = ({
  levelData,
  heroId,
  themeId,
  isFullscreen,
  isMuted,
  onExitToEditor,
  onExitToMenu,
  onToggleFullscreen,
  onToggleMute,
  isTutorialMode = false,
  isGuidedTour = false,
  onCompleteTutorial,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const physicsRef = useRef<PhysicsEngine | null>(null);

  // Game UI state
  const [stats, setStats] = useState(physicsRef.current?.stats || {
    coinsCollected: 0,
    totalCoins: 0,
    starsCollected: 0,
    totalStars: 0,
    crystalsCollected: 0,
    enemiesDefeated: 0,
    timeRemaining: 300,
    timeTaken: 0,
    score: 0,
    lives: 3,
  });

  const [isPaused, setIsPaused] = useState(false);
  const [isVictory, setIsVictory] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [showControlsBanner, setShowControlsBanner] = useState(true);
  const [hasMoved, setHasMoved] = useState(false);
  const [hasJumped, setHasJumped] = useState(false);

  // Auto-hide standard controls banner if tutorial mode is active (tutorial has its own persistent bar)
  useEffect(() => {
    if (isTutorialMode) {
      setShowControlsBanner(false);
      return;
    }
    const timer = setTimeout(() => {
      setShowControlsBanner(false);
    }, 7000);
    return () => clearTimeout(timer);
  }, [isTutorialMode]);

  // Background image
  const themeConfig = THEMES[themeId] || THEMES.green_islands;
  const bgImageRef = useRef<HTMLImageElement | null>(null);

  // Input state
  const keysRef = useRef<{
    left: boolean;
    right: boolean;
    jump: boolean;
    jumpJustPressed: boolean;
  }>({
    left: false,
    right: false,
    jump: false,
    jumpJustPressed: false,
  });

  // Camera State (2D follow for expanded height)
  const cameraRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Initialize Game & Sound
  const initGame = () => {
    // Deep clone levelData so that collected items & broken bricks reset on restart
    const clonedData: LevelData = JSON.parse(JSON.stringify(levelData));
    physicsRef.current = new PhysicsEngine(clonedData, heroId);
    cameraRef.current = { x: 0, y: 0 };
    setIsVictory(false);
    setIsGameOver(false);
    setIsPaused(false);
    sound.startBgm(themeId);
  };

  useEffect(() => {
    initGame();

    // Load background image
    const img = new Image();
    img.src = themeConfig.image;
    img.onload = () => {
      bgImageRef.current = img;
    };

    return () => {
      sound.stopBgm();
    };
  }, [levelData, heroId, themeId]);

  // Keyboard Event Listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Escape') {
        setIsPaused((p) => !p);
        return;
      }

      if (e.code === 'KeyA' || e.code === 'ArrowLeft') {
        keysRef.current.left = true;
        setHasMoved(true);
        TutorialManager.emitGameplayAction('move');
      }
      if (e.code === 'KeyD' || e.code === 'ArrowRight') {
        keysRef.current.right = true;
        setHasMoved(true);
        TutorialManager.emitGameplayAction('move');
      }
      if (e.code === 'Space' || e.code === 'KeyW' || e.code === 'ArrowUp') {
        if (!keysRef.current.jump) {
          keysRef.current.jumpJustPressed = true;
        }
        keysRef.current.jump = true;
        setHasJumped(true);
        TutorialManager.emitGameplayAction('jump');
        e.preventDefault();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'KeyA' || e.code === 'ArrowLeft') {
        keysRef.current.left = false;
      }
      if (e.code === 'KeyD' || e.code === 'ArrowRight') {
        keysRef.current.right = false;
      }
      if (e.code === 'Space' || e.code === 'KeyW' || e.code === 'ArrowUp') {
        keysRef.current.jump = false;
        keysRef.current.jumpJustPressed = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Main 60fps Game Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animFrame: number;
    let lastTime = performance.now();

    const loop = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      const engine = physicsRef.current;
      if (engine && !isPaused) {
        // Run physics tick
        engine.update(dt, {
          left: keysRef.current.left,
          right: keysRef.current.right,
          jump: keysRef.current.jump,
          jumpJustPressed: keysRef.current.jumpJustPressed,
        });

        // Reset single-frame jump triggers
        keysRef.current.jumpJustPressed = false;

        // Sync React HUD state
        setStats({ ...engine.stats });
        if (engine.isVictory && !isVictory) {
          setIsVictory(true);
          TutorialManager.emitGameplayAction('victory');
        }
        if (engine.isGameOver && !isGameOver) {
          setIsGameOver(true);
        }

        // Camera Follow Logic (smooth lerp in X & Y with lookahead)
        const canvasW = canvas.width;
        const canvasH = canvas.height;
        const targetCamX = engine.player.x - canvasW * 0.38;
        const maxCamX = Math.max(0, engine.levelData.width * CELL_SIZE - canvasW);
        const clampedTargetX = Math.max(0, Math.min(maxCamX, targetCamX));
        cameraRef.current.x += (clampedTargetX - cameraRef.current.x) * 0.12;

        const totalLevelHeightPx = (engine.levelData.height || GRID_ROWS) * CELL_SIZE;
        const maxCamY = Math.max(0, totalLevelHeightPx - canvasH);
        if (maxCamY > 0) {
          const targetCamY = Math.max(0, Math.min(maxCamY, engine.player.y - canvasH * 0.55));
          cameraRef.current.y += (targetCamY - cameraRef.current.y) * 0.12;
        } else {
          cameraRef.current.y = 0;
        }
      }

      // --- Canvas Render ---
      const width = canvas.width;
      const height = canvas.height;
      const camX = cameraRef.current.x;
      const camY = cameraRef.current.y;

      // 1. Panoramic Parallax Background
      if (bgImageRef.current && bgImageRef.current.complete) {
        const naturalW = bgImageRef.current.naturalWidth || 1376;
        const naturalH = bgImageRef.current.naturalHeight || 768;
        const imgAspect = naturalW / naturalH;

        if (imgAspect > 2.5) {
          // Ultra-wide single panorama: smoothly pan across full level length without seams or repetition
          const totalLevelPx = (levelData.width || 160) * CELL_SIZE;
          const maxCam = Math.max(1, totalLevelPx - width);
          const progress = Math.max(0, Math.min(1, camX / maxCam));
          const bgW = Math.max(width, height * imgAspect);
          const bgX = -progress * Math.max(0, bgW - width);
          ctx.drawImage(bgImageRef.current, bgX, 0, bgW, height);
        } else {
          const parallaxFactor = 0.3;
          const bgW = height * imgAspect;
          const bgOffsetX = -(camX * parallaxFactor) % bgW;

          for (let x = bgOffsetX - bgW; x < width + bgW; x += bgW) {
            ctx.drawImage(bgImageRef.current, x, 0, bgW, height);
          }
        }
      } else {
        const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
        skyGrad.addColorStop(0, themeConfig.skyColor);
        skyGrad.addColorStop(1, '#ffffff');
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, width, height);
      }

      ctx.save();
      ctx.translate(-camX, -camY);

      if (engine) {
        // 2. Render Level Tiles
        const itemMap = new Map();
        engine.levelData.items.forEach((it) => {
          itemMap.set(`${it.x},${it.y}`, it);
        });

        const startCol = Math.max(0, Math.floor(camX / CELL_SIZE) - 1);
        const endCol = Math.min(
          engine.levelData.width,
          Math.ceil((camX + width) / CELL_SIZE) + 1
        );

        engine.levelData.items.forEach((item) => {
          if (item.x >= startCol && item.x <= endCol) {
            // Do not draw dynamic enemies or spawn marker as static blocks in game
            if (item.tileId.startsWith('enemy_') || item.tileId === 'player_spawn') {
              return;
            }

            // Cloud platforms are rendered below as animated moving rigid bodies
            if (item.tileId === 'cloud_platform') {
              return;
            }

            // For 2x2 pipes, skip bottom half of any legacy stacked pipe
            if (item.tileId.startsWith('pipe_')) {
              if (itemMap.has(`${item.x},${item.y - 1}`) && itemMap.get(`${item.x},${item.y - 1}`)?.tileId.startsWith('pipe_')) {
                return;
              }
            }

            // Check if bumping
            const bump = engine.blockBumps.find(
              (b) => b.x === item.x * CELL_SIZE && b.y === item.y * CELL_SIZE
            );
            const py = item.y * CELL_SIZE + (bump ? bump.offsetY : 0);

            const hasLeft =
              itemMap.has(`${item.x - 1},${item.y}`) &&
              itemMap.get(`${item.x - 1},${item.y}`)?.tileId === item.tileId;
            const hasRight =
              itemMap.has(`${item.x + 1},${item.y}`) &&
              itemMap.get(`${item.x + 1},${item.y}`)?.tileId === item.tileId;

            SpriteRenderer.drawTile(ctx, item.tileId, item.x * CELL_SIZE, py, CELL_SIZE, {
              hasLeft,
              hasRight,
              animTime: engine.player.animTime,
              variant: item.variant,
            });
          }
        });

        // 2b. Render Floating Cloud Islands (merged rigid bodies moving together)
        engine.cloudIslands.forEach((island) => {
          const islandTilesMap = new Set(island.tiles.map((t) => `${t.x},${t.y}`));
          island.tiles.forEach((tile) => {
            const tx = tile.x * CELL_SIZE + island.offsetX;
            const ty = tile.y * CELL_SIZE + island.offsetY;

            const hasLeft = islandTilesMap.has(`${tile.x - 1},${tile.y}`);
            const hasRight = islandTilesMap.has(`${tile.x + 1},${tile.y}`);
            const hasTop = islandTilesMap.has(`${tile.x},${tile.y - 1}`);
            const hasBottom = islandTilesMap.has(`${tile.x},${tile.y + 1}`);

            SpriteRenderer.drawTile(ctx, 'cloud_platform', tx, ty, CELL_SIZE, {
              hasLeft,
              hasRight,
              hasTop,
              hasBottom,
              animTime: engine.player.animTime,
            });
          });
        });

        // 3. Render Enemies
        engine.enemies.forEach((enemy) => {
          ctx.save();
          if (enemy.isSquashed) {
            // Squashed flat pose
            ctx.translate(enemy.x + CELL_SIZE * 0.5, enemy.y + CELL_SIZE * 0.7);
            ctx.scale(1.3, 0.25);
            SpriteRenderer.drawTile(ctx, enemy.tileId, -CELL_SIZE * 0.5, -CELL_SIZE * 0.5, CELL_SIZE, {
              animTime: enemy.animTimer,
            });
          } else {
            ctx.translate(enemy.x + CELL_SIZE * 0.5, enemy.y + CELL_SIZE * 0.5);

            // Flip horizontally according to movement direction
            const flip = enemy.direction > 0 ? -1 : 1;
            ctx.scale(flip, 1);

            // Jumper squish while charging leap
            if (enemy.preparingJump) {
              ctx.scale(1.15, 0.85);
            }

            SpriteRenderer.drawTile(ctx, enemy.tileId, -CELL_SIZE * 0.5, -CELL_SIZE * 0.5, CELL_SIZE, {
              animTime: enemy.animTimer,
            });

            // Status indicator icons above enemy (unflipped)
            ctx.scale(flip, 1); // restore orientation for UI indicator
            if (enemy.isChasing) {
              // Red exclamation alert above Chaser
              ctx.fillStyle = '#ef4444';
              ctx.beginPath();
              ctx.arc(0, -CELL_SIZE * 0.55, 6, 0, Math.PI * 2);
              ctx.fill();
              ctx.fillStyle = '#ffffff';
              ctx.font = 'bold 9px Fredoka, sans-serif';
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillText('!', 0, -CELL_SIZE * 0.55);
            } else if (enemy.tileId === 'enemy_patrol' && enemy.pauseTimer && enemy.pauseTimer > 0) {
              // Blue patrol eye/question badge
              ctx.fillStyle = '#3b82f6';
              ctx.beginPath();
              ctx.arc(0, -CELL_SIZE * 0.55, 5, 0, Math.PI * 2);
              ctx.fill();
              ctx.fillStyle = '#ffffff';
              ctx.font = 'bold 8px Fredoka, sans-serif';
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillText('•', 0, -CELL_SIZE * 0.55);
            }
          }
          ctx.restore();
        });

        // 4. Render Particles
        engine.particles.forEach((p) => {
          SpriteRenderer.drawParticle(ctx, p);
        });

        // 5. Render Hero
        SpriteRenderer.drawHero(
          ctx,
          engine.heroId,
          engine.player.x,
          engine.player.y,
          engine.player.width,
          engine.player.height,
          {
            isWalking: engine.player.isWalking,
            isInAir: engine.player.isInAir,
            facingRight: engine.player.facingRight,
            animTime: engine.player.animTime,
            isHurt: engine.player.isHurt,
            isSliding: engine.player.isSliding,
            vx: engine.player.vx,
            vy: engine.player.vy,
            jumpTime: engine.player.jumpTime,
          }
        );

        // 6. Render Floating Game Tooltips (e.g. "+1 Жизнь!", "Максимум жизней!", "Нет выхода!")
        if (engine.floatingTexts && engine.floatingTexts.length > 0) {
          engine.floatingTexts.forEach((t) => {
            ctx.save();
            const alpha = Math.max(0, 1 - t.life / t.maxLife);
            ctx.globalAlpha = alpha;
            ctx.font = 'bold 13px Fredoka, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            // Text outline
            ctx.strokeStyle = '#0f172a';
            ctx.lineWidth = 3.5;
            ctx.strokeText(t.text, t.x, t.y);

            // Text fill
            ctx.fillStyle = t.color;
            ctx.fillText(t.text, t.x, t.y);
            ctx.restore();
          });
        }
      }

      ctx.restore();

      animFrame = requestAnimationFrame(loop);
    };

    animFrame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animFrame);
  }, [isPaused, isVictory, isGameOver, themeConfig]);

  // Window resize listener
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

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full bg-slate-950 overflow-hidden select-none"
    >
      <canvas ref={canvasRef} className="absolute inset-0 block w-full h-full" />

      {/* TOP IN-GAME HUD */}
      <header className="absolute top-3 left-4 right-4 z-30 flex items-center justify-between pointer-events-none">
        {/* Left Stats Cluster */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Return to Editor CTA */}
          <button
            onClick={() => {
              sound.stopBgm();
              onExitToEditor();
            }}
            className="px-3.5 py-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-amber-400 font-bold text-xs flex items-center gap-1.5 shadow-lg backdrop-blur-md transition-all active:scale-95 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">В редактор</span>
          </button>

          {onExitToMenu && (
            <button
              onClick={() => {
                sound.stopBgm();
                sound.playClick();
                onExitToMenu();
              }}
              className="px-3.5 py-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-slate-300 hover:text-white font-bold text-xs flex items-center gap-1.5 shadow-lg backdrop-blur-md transition-all active:scale-95 cursor-pointer"
            >
              <Home className="w-4 h-4 text-sky-400" />
              <span className="hidden sm:inline">В студию</span>
            </button>
          )}

          {/* Hearts / Lives */}
          <div className="px-3 py-2 rounded-xl bg-slate-900/90 border border-slate-700/80 shadow-lg backdrop-blur-md flex items-center gap-1">
            {[...Array(3)].map((_, i) => (
              <Heart
                key={i}
                className={`w-4 h-4 ${
                  i < stats.lives
                    ? 'text-rose-500 fill-rose-500 animate-pulse'
                    : 'text-slate-600 fill-slate-800'
                }`}
              />
            ))}
          </div>

          {/* Coins */}
          <div className="px-3 py-2 rounded-xl bg-slate-900/90 border border-slate-700/80 shadow-lg backdrop-blur-md flex items-center gap-1.5 text-xs font-black text-amber-400">
            <Coins className="w-4 h-4 fill-amber-400 text-amber-500" />
            <span className="tabular-nums">{stats.coinsCollected}</span>
          </div>

          {/* Stars */}
          <div className="px-3 py-2 rounded-xl bg-slate-900/90 border border-slate-700/80 shadow-lg backdrop-blur-md flex items-center gap-1.5 text-xs font-black text-yellow-300">
            <Sparkles className="w-4 h-4 fill-yellow-400 text-yellow-500" />
            <span className="tabular-nums">{stats.starsCollected}</span>
          </div>
        </div>

        {/* Right Stats: Time, Score, Sound, Pause */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <div className="px-3 py-2 rounded-xl bg-slate-900/90 border border-slate-700/80 shadow-lg backdrop-blur-md flex items-center gap-1.5 text-xs font-mono font-bold text-slate-200">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span className="tabular-nums">{Math.ceil(stats.timeRemaining)}s</span>
          </div>

          <div className="px-3 py-2 rounded-xl bg-slate-900/90 border border-slate-700/80 shadow-lg backdrop-blur-md text-xs font-mono font-black text-emerald-400">
            <span className="tabular-nums">ОЧКИ: {stats.score}</span>
          </div>

          <button
            onClick={onToggleMute}
            className="p-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-slate-300 shadow-lg backdrop-blur-md transition-colors cursor-pointer"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>

          <button
            onClick={() => setIsPaused((p) => !p)}
            className="p-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-slate-300 shadow-lg backdrop-blur-md transition-colors cursor-pointer"
          >
            {isPaused ? <Play className="w-4 h-4 text-emerald-400 fill-emerald-400" /> : <Pause className="w-4 h-4" />}
          </button>

          <button
            onClick={onToggleFullscreen}
            className="p-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-slate-300 shadow-lg backdrop-blur-md transition-colors cursor-pointer"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Interactive In-Game Tutorial Mission Guide (Step 8) */}
      {isTutorialMode && !isVictory && !isGameOver && (
        <div className="absolute top-16 left-4 right-4 z-40 flex justify-center pointer-events-none animate-in fade-in slide-in-from-top-3">
          <div className="max-w-2xl bg-gradient-to-r from-slate-900/95 via-slate-950/95 to-slate-900/95 border-2 border-amber-400 rounded-2xl p-3 sm:p-4 shadow-2xl shadow-amber-500/20 pointer-events-auto backdrop-blur-md flex items-center justify-between gap-3 text-white">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-amber-500/20 border border-amber-400 flex items-center justify-center shrink-0 text-2xl animate-bounce">
                {!hasMoved ? '🏃' : !hasJumped ? '🦘' : stats.coinsCollected === 0 ? '🪙' : '🚩'}
              </div>
              <div className="text-xs sm:text-sm">
                <div className="font-black text-amber-300 uppercase tracking-wider flex items-center gap-2">
                  <span>Обучение: Шаг 8 из 8 — Проверь игру в действии!</span>
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/30 text-[10px] font-mono">Плейтест</span>
                </div>
                <div className="text-slate-100 font-bold mt-0.5">
                  {!hasMoved ? (
                    <span>Нажимай стрелочки <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-amber-300 font-mono border border-slate-700">⬅ ➡</kbd> или <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-amber-300 font-mono border border-slate-700">A / D</kbd>, чтобы побежать!</span>
                  ) : !hasJumped ? (
                    <span>Отлично! Теперь нажми <kbd className="px-2 py-0.5 rounded bg-emerald-900 text-emerald-300 font-mono border border-emerald-500">Пробел</kbd> или <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-emerald-300 font-mono border border-slate-700">W</kbd>, чтобы прыгнуть!</span>
                  ) : stats.coinsCollected === 0 ? (
                    <span>Супер! Теперь собери сияющую золотую монетку!</span>
                  ) : (
                    <span>Монета собрана! 🪙 Теперь спеши к Финишным воротам для победы!</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Intro Controls & Battle Guide Banner */}
      {showControlsBanner && !isTutorialMode && !isVictory && !isGameOver && (
        <div className="absolute top-16 left-4 right-4 z-40 flex justify-center pointer-events-none animate-in fade-in slide-in-from-top-3 duration-300">
          <div className="max-w-xl bg-slate-900/95 border-2 border-emerald-500/60 rounded-2xl p-3.5 shadow-2xl shadow-emerald-500/15 pointer-events-auto backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shrink-0 text-xl font-bold">
                🎮
              </div>
              <div className="text-xs">
                <div className="font-bold text-emerald-400 uppercase tracking-wider mb-0.5">
                  Обучение: Управление и битва
                </div>
                <div className="text-slate-200">
                  <span className="font-semibold text-white">Бег:</span> ⬅ / ➡ или A, D ·{' '}
                  <span className="font-semibold text-white">Прыжок:</span> Пробел или W (удерживайте для высоты) ·{' '}
                  <span className="font-bold text-amber-300">Врагов побеждайте прыжком СВЕРХУ!</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowControlsBanner(false)}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black shrink-0 transition-all cursor-pointer active:scale-95"
            >
              В бой!
            </button>
          </div>
        </div>
      )}

      {/* Desktop / Tablet Persistent Controls Bar at Bottom */}
      <div className="hidden md:flex absolute bottom-4 left-1/2 -translate-x-1/2 z-30 pointer-events-auto">
        <div className="px-4 py-2 rounded-2xl bg-slate-950/85 border border-slate-700/80 shadow-xl backdrop-blur-md flex items-center gap-4 text-xs font-medium text-slate-300">
          <div className="flex items-center gap-1.5">
            <span className="px-1.5 py-0.5 rounded bg-slate-800 text-amber-300 font-mono font-bold text-[11px] border border-slate-700">A / D</span>
            <span className="text-slate-400">или</span>
            <span className="px-1.5 py-0.5 rounded bg-slate-800 text-amber-300 font-mono font-bold text-[11px] border border-slate-700">⬅ ➡</span>
            <span className="text-slate-200 ml-1">Бег</span>
          </div>

          <div className="w-[1px] h-3.5 bg-slate-700" />

          <div className="flex items-center gap-1.5">
            <span className="px-2 py-0.5 rounded bg-slate-800 text-emerald-400 font-mono font-bold text-[11px] border border-slate-700">Пробел / W</span>
            <span className="text-slate-200 ml-1">Прыжок (удержание = выше)</span>
          </div>

          <div className="w-[1px] h-3.5 bg-slate-700" />

          <div className="flex items-center gap-1.5">
            <span className="text-rose-400 font-bold">⚔️ Прыжок сверху:</span>
            <span className="text-slate-200">Убить врага</span>
          </div>

          <div className="w-[1px] h-3.5 bg-slate-700" />

          <div className="flex items-center gap-1.5">
            <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono font-bold text-[11px] border border-slate-700">Esc</span>
            <span className="text-slate-300">Пауза / В редактор</span>
          </div>
        </div>
      </div>

      {/* MOBILE ON-SCREEN TOUCH CONTROLS (Always handy on touchscreens) */}
      <div className="absolute bottom-6 left-6 right-6 z-30 flex items-end justify-between pointer-events-none md:hidden">
        {/* D-Pad Left/Right */}
        <div className="flex gap-3 pointer-events-auto">
          <button
            onTouchStart={(e) => {
              e.preventDefault();
              keysRef.current.left = true;
              setHasMoved(true);
            }}
            onTouchEnd={() => {
              keysRef.current.left = false;
            }}
            className={`w-16 h-16 rounded-2xl bg-slate-900/80 active:bg-amber-500/80 border-2 text-white flex items-center justify-center text-xl font-black shadow-xl backdrop-blur-md ${
              isTutorialMode && !hasMoved ? 'border-amber-400 ring-4 ring-amber-400/50 animate-pulse' : 'border-slate-700'
            }`}
          >
            ◀
          </button>
          <button
            onTouchStart={(e) => {
              e.preventDefault();
              keysRef.current.right = true;
              setHasMoved(true);
            }}
            onTouchEnd={() => {
              keysRef.current.right = false;
            }}
            className={`w-16 h-16 rounded-2xl bg-slate-900/80 active:bg-amber-500/80 border-2 text-white flex items-center justify-center text-xl font-black shadow-xl backdrop-blur-md ${
              isTutorialMode && !hasMoved ? 'border-amber-400 ring-4 ring-amber-400/50 animate-pulse' : 'border-slate-700'
            }`}
          >
            ▶
          </button>
        </div>

        {/* Jump Button */}
        <div className="pointer-events-auto">
          <button
            onTouchStart={(e) => {
              e.preventDefault();
              keysRef.current.jumpJustPressed = true;
              keysRef.current.jump = true;
              setHasJumped(true);
            }}
            onTouchEnd={() => {
              keysRef.current.jump = false;
              keysRef.current.jumpJustPressed = false;
            }}
            className={`w-20 h-20 rounded-full bg-emerald-600/90 active:bg-emerald-400 border-4 text-slate-950 font-black text-sm uppercase tracking-wider flex items-center justify-center shadow-2xl backdrop-blur-md ${
              isTutorialMode && hasMoved && !hasJumped ? 'border-amber-300 ring-4 ring-amber-400/60 animate-bounce' : 'border-emerald-400'
            }`}
          >
            ПРЫЖОК
          </button>
        </div>
      </div>

      {/* PAUSE MODAL */}
      {isPaused && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-transparent select-none">
          <div className="w-full max-w-sm retro-modal p-6 shadow-[6px_6px_0px_#000] text-center space-y-4 text-[var(--text-main)]">
            <h3 className="font-pixel font-bold text-lg text-amber-400 uppercase tracking-wider">
              ПАУЗА
            </h3>
            <p className="text-xs text-[var(--text-muted)]">
              Игра приостановлена. Нажмите «Продолжить» или вернитесь в конструктор.
            </p>
            <div className="space-y-2.5 pt-2">
              <button
                onClick={() => setIsPaused(false)}
                className="retro-btn w-full py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950"
              >
                ПРОДОЛЖИТЬ
              </button>
              <button
                onClick={initGame}
                className="retro-btn-sm w-full py-2 bg-[var(--card-subtle)] hover:bg-slate-700 text-[var(--text-main)] flex items-center justify-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>НАЧАТЬ ЗАНОВО</span>
              </button>
              <button
                onClick={() => {
                  sound.stopBgm();
                  onExitToEditor();
                }}
                className="retro-btn-sm w-full py-2 bg-[var(--card-subtle)] hover:bg-slate-700 text-amber-400 flex items-center justify-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>В КОНСТРУКТОР</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* GAME OVER MODAL */}
      {isGameOver && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-transparent select-none animate-in fade-in">
          <div className="w-full max-w-sm retro-modal p-6 shadow-[6px_6px_0px_#000] text-center space-y-4 text-[var(--text-main)]">
            <div className="w-14 h-14 rounded-md border-2 border-black bg-rose-500/20 text-rose-500 mx-auto flex items-center justify-center text-2xl shadow-[2px_2px_0px_#000]">
              💀
            </div>
            <h3 className="font-pixel font-bold text-base text-rose-400 uppercase tracking-wider">
              ИГРА ОКОНЧЕНА
            </h3>
            <p className="text-xs text-[var(--text-muted)]">
              Закончились жизни! В конструкторе вы всегда можете упростить уровень или попробовать снова.
            </p>
            <div className="space-y-2.5 pt-2">
              <button
                onClick={initGame}
                className="retro-btn w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950"
              >
                ПОПРОБОВАТЬ СНОВА
              </button>
              <button
                onClick={() => {
                  sound.stopBgm();
                  onExitToEditor();
                }}
                className="retro-btn-sm w-full py-2 bg-[var(--card-subtle)] hover:bg-slate-700 text-[var(--text-main)]"
              >
                В КОНСТРУКТОР
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CELEBRATORY VICTORY MODAL */}
      {isVictory && !isGuidedTour && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-transparent select-none animate-in zoom-in-95 duration-200">
          <div className="w-full max-w-md retro-modal p-6 shadow-[6px_6px_0px_#000] text-center space-y-4 text-[var(--text-main)]">
            <div className="w-16 h-16 rounded-md bg-amber-400 border-2 border-black mx-auto flex items-center justify-center text-slate-950 shadow-[3px_3px_0px_#000]">
              <Trophy className="w-8 h-8 animate-bounce" />
            </div>

            <div>
              <div className="text-xs font-black uppercase tracking-widest text-amber-400">
                {isTutorialMode ? 'Обучение успешно завершено! 🎓' : 'Уровень пройден!'}
              </div>
              <h2 className="font-black text-2xl sm:text-3xl text-white mt-1">
                {isTutorialMode ? 'ПОЗДРАВЛЯЕМ, ГЕЙМДИЗАЙНЕР!' : 'ГРАНДИОЗНАЯ ПОБЕДА!'}
              </h2>
              {isTutorialMode && (
                <p className="text-xs sm:text-sm text-slate-200 mt-2 leading-relaxed">
                  Ты создал свой первый уровень в <span className="text-amber-300 font-bold">Super Pixel World</span> и победоносно прошёл его! Теперь у тебя есть все необходимые навыки — строй любые миры, делись ими и удивляй друзей!
                </p>
              )}
            </div>

            {/* Victory Statistics */}
            <div className="grid grid-cols-2 gap-2.5 p-3.5 bg-slate-800/80 rounded-2xl border border-slate-700 text-left text-xs">
              <div>
                <span className="text-slate-400">Время прохождения:</span>
                <div className="text-base font-bold text-cyan-400 font-mono">
                  {Math.round(stats.timeTaken)} сек.
                </div>
              </div>
              <div>
                <span className="text-slate-400">Итоговый счёт:</span>
                <div className="text-base font-bold text-emerald-400 font-mono">
                  {stats.score}
                </div>
              </div>
              <div>
                <span className="text-slate-400">Собрано монет:</span>
                <div className="text-base font-bold text-amber-400 font-mono">
                  {stats.coinsCollected}
                </div>
              </div>
              <div>
                <span className="text-slate-400">Найдено звёзд:</span>
                <div className="text-base font-bold text-yellow-300 font-mono">
                  {stats.starsCollected}
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <button
                onClick={() => {
                  sound.stopBgm();
                  if (isTutorialMode) {
                    onCompleteTutorial?.();
                  }
                  onExitToEditor();
                }}
                className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-lg shadow-amber-500/25 transition-all cursor-pointer active:scale-95"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>В конструктор (Создать игру)</span>
              </button>
              {onExitToMenu && (
                <button
                  onClick={() => {
                    sound.stopBgm();
                    if (isTutorialMode) {
                      onCompleteTutorial?.();
                    }
                    onExitToMenu();
                  }}
                  className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <Home className="w-3.5 h-3.5" />
                  <span>В меню</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
