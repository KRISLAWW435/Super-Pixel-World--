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

  // Auto-hide controls banner after 7 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowControlsBanner(false);
    }, 7000);
    return () => clearTimeout(timer);
  }, []);

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

  // Camera State
  const cameraRef = useRef<{ x: number }>({ x: 0 });

  // Initialize Game & Sound
  const initGame = () => {
    // Deep clone levelData so that collected items & broken bricks reset on restart
    const clonedData: LevelData = JSON.parse(JSON.stringify(levelData));
    physicsRef.current = new PhysicsEngine(clonedData, heroId);
    cameraRef.current = { x: 0 };
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
      }
      if (e.code === 'KeyD' || e.code === 'ArrowRight') {
        keysRef.current.right = true;
      }
      if (e.code === 'Space' || e.code === 'KeyW' || e.code === 'ArrowUp') {
        if (!keysRef.current.jump) {
          keysRef.current.jumpJustPressed = true;
        }
        keysRef.current.jump = true;
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
        }
        if (engine.isGameOver && !isGameOver) {
          setIsGameOver(true);
        }

        // Camera Follow Logic (smooth lerp with lookahead)
        const canvasW = canvas.width;
        const targetCamX = engine.player.x - canvasW * 0.38;
        const maxCamX = Math.max(0, engine.levelData.width * CELL_SIZE - canvasW);
        const clampedTarget = Math.max(0, Math.min(maxCamX, targetCamX));
        cameraRef.current.x += (clampedTarget - cameraRef.current.x) * 0.12;
      }

      // --- Canvas Render ---
      const width = canvas.width;
      const height = canvas.height;
      const camX = cameraRef.current.x;

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
      ctx.translate(-camX, 0);

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
          }
        );
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

      {/* Intro Controls & Battle Guide Banner */}
      {showControlsBanner && !isVictory && !isGameOver && (
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
            }}
            onTouchEnd={() => {
              keysRef.current.left = false;
            }}
            className="w-16 h-16 rounded-2xl bg-slate-900/80 active:bg-amber-500/80 border-2 border-slate-700 text-white flex items-center justify-center text-xl font-black shadow-xl backdrop-blur-md"
          >
            ◀
          </button>
          <button
            onTouchStart={(e) => {
              e.preventDefault();
              keysRef.current.right = true;
            }}
            onTouchEnd={() => {
              keysRef.current.right = false;
            }}
            className="w-16 h-16 rounded-2xl bg-slate-900/80 active:bg-amber-500/80 border-2 border-slate-700 text-white flex items-center justify-center text-xl font-black shadow-xl backdrop-blur-md"
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
            }}
            onTouchEnd={() => {
              keysRef.current.jump = false;
              keysRef.current.jumpJustPressed = false;
            }}
            className="w-20 h-20 rounded-full bg-emerald-600/90 active:bg-emerald-400 border-4 border-emerald-400 text-slate-950 font-black text-sm uppercase tracking-wider flex items-center justify-center shadow-2xl backdrop-blur-md"
          >
            ПРЫЖОК
          </button>
        </div>
      </div>

      {/* PAUSE MODAL */}
      {isPaused && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
          <div className="w-full max-w-sm bg-slate-900 border-2 border-amber-500/40 rounded-3xl p-6 shadow-2xl text-center space-y-4">
            <h3 className="font-black text-2xl text-amber-400 uppercase tracking-widest">
              Пауза
            </h3>
            <p className="text-xs text-slate-300">
              Игра приостановлена. Нажмите «Продолжить» или вернитесь в редактор для изменения карты.
            </p>
            <div className="space-y-2 pt-2">
              <button
                onClick={() => setIsPaused(false)}
                className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm uppercase tracking-wider transition-all cursor-pointer"
              >
                Продолжить
              </button>
              <button
                onClick={initGame}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Начать уровень сначала
              </button>
              <button
                onClick={() => {
                  sound.stopBgm();
                  onExitToEditor();
                }}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Вернуться в конструктор
              </button>
            </div>
          </div>
        </div>
      )}

      {/* GAME OVER MODAL */}
      {isGameOver && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-sm bg-slate-900 border-2 border-rose-500 rounded-3xl p-6 shadow-2xl text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-rose-500/20 text-rose-500 mx-auto flex items-center justify-center text-3xl">
              💀
            </div>
            <h3 className="font-black text-2xl text-rose-400 uppercase tracking-widest">
              Игра окончена
            </h3>
            <p className="text-xs text-slate-300">
              Закончились жизни! Но в редакторе вы всегда можете сделать уровень проще или попробовать снова.
            </p>
            <div className="space-y-2 pt-2">
              <button
                onClick={initGame}
                className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm uppercase tracking-wider transition-all cursor-pointer"
              >
                Попробовать снова
              </button>
              <button
                onClick={() => {
                  sound.stopBgm();
                  onExitToEditor();
                }}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition-all cursor-pointer"
              >
                Вернуться в конструктор
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CELEBRATORY VICTORY MODAL */}
      {isVictory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-in zoom-in-95 duration-300">
          <div className="w-full max-w-md bg-gradient-to-b from-slate-900 to-slate-950 border-2 border-amber-400 rounded-3xl p-6 shadow-2xl text-center space-y-4">
            <div className="w-20 h-20 rounded-full bg-amber-400/20 border-2 border-amber-400 mx-auto flex items-center justify-center text-amber-400">
              <Trophy className="w-10 h-10 animate-bounce" />
            </div>

            <div>
              <div className="text-xs font-black uppercase tracking-widest text-amber-400">
                Уровень пройден!
              </div>
              <h2 className="font-black text-3xl text-white mt-1">
                ГРАНДИОЗНАЯ ПОБЕДА!
              </h2>
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

            <div className="flex gap-2 pt-2">
              <button
                onClick={initGame}
                className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                Играть ещё раз
              </button>
              <button
                onClick={() => {
                  sound.stopBgm();
                  onExitToEditor();
                }}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                В конструктор
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
