/**
 * Super Pixel World - Fullscreen Game Player
 * 60fps isolated canvas loop, smooth camera follow with deadzone, parallax panoramic backdrop,
 * mobile on-screen touch controls, celebratory victory modal, and instant return to editor.
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  Check,
  Clock,
  Coins,
  Crown,
  Gamepad2,
  Gem,
  Heart,
  Home,
  Maximize2,
  Minimize2,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  Target,
  Trophy,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { sound } from '../audio/soundEngine';
import { CELL_SIZE, FIXED_DELTA_TIME, GRID_ROWS, MAX_ACCUMULATOR, THEMES } from '../game/constants';
import { PhysicsEngine } from '../game/physics';
import { SpriteRenderer } from '../graphics/spriteRenderer';
import { setHapticsSuspended } from '../services/HapticsManager';
import { SettingsManager } from '../services/storageManager';
import { TutorialManager } from '../services/TutorialManager';
import { HeroId, LevelData, ThemeId } from '../types/game';
import GameJuicePopup, { getRandomJuiceText, JuiceActionType, JuiceEvent } from './GameJuicePopup';

const bgImageCache = new Map<string, HTMLImageElement>();


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
  const [hasMoved, setHasMoved] = useState(false);
  const [hasJumped, setHasJumped] = useState(false);

  // Game Juice Popup state
  const [activeJuice, setActiveJuice] = useState<JuiceEvent | null>(null);
  const juiceTimerRef = useRef<number | null>(null);

  // Goal & Challenge tracking state
  const [challengeCompleted, setChallengeCompleted] = useState<boolean>(false);
  const [showChallengeBanner, setShowChallengeBanner] = useState<boolean>(false);
  const challengeCompletedRef = useRef<boolean>(false);
  const prevStatsRef = useRef({
    coinsCollected: -1,
    score: -1,
    lives: -1,
    crystalsCollected: -1,
    starsCollected: -1,
    enemiesDefeated: -1,
    sec: -1,
  });

  // Calculate totals from levelData
  const totalCoins = React.useMemo(() => {
    return levelData.items.filter((it) => it.tileId === 'coin').length;
  }, [levelData.items]);

  const totalEnemies = React.useMemo(() => {
    return levelData.items.filter((it) => it.tileId.startsWith('enemy_')).length;
  }, [levelData.items]);

  const totalCrystals = React.useMemo(() => {
    return levelData.items.filter((it) => it.tileId === 'crystal').length;
  }, [levelData.items]);

  const totalStars = React.useMemo(() => {
    return levelData.items.filter((it) => it.tileId === 'star').length;
  }, [levelData.items]);



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

  // Gamepad state & notification toasts
  const [gamepadToast, setGamepadToast] = useState<{ message: string; sub?: string } | null>(null);
  const [gamepadConnectedName, setGamepadConnectedName] = useState<string | null>(null);
  const toastTimerRef = useRef<NodeJS.Timeout | null>(null);
  const prevGamepadRef = useRef<{ jump: boolean; start: boolean }>({
    jump: false,
    start: false,
  });
  const padJumpJustPressedRef = useRef<boolean>(false);

  const triggerGamepadToast = (message: string, sub?: string) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setGamepadToast({ message, sub });
    toastTimerRef.current = setTimeout(() => {
      setGamepadToast(null);
    }, 3500);
  };

  // Listen for Gamepad connection & disconnection events
  useEffect(() => {
    if (typeof navigator !== 'undefined' && typeof navigator.getGamepads === 'function') {
      const pads = navigator.getGamepads();
      for (let i = 0; i < pads.length; i++) {
        const p = pads[i];
        if (p && p.connected) {
          const cleanName = p.id ? p.id.replace(/\([^)]*\)/g, '').trim() || 'Геймпад' : 'Геймпад';
          setGamepadConnectedName(cleanName);
          break;
        }
      }
    }

    const handleGamepadConnected = (e: GamepadEvent) => {
      const pad = e.gamepad;
      const cleanName = pad.id ? pad.id.replace(/\([^)]*\)/g, '').trim() || 'Геймпад' : 'Геймпад';
      setGamepadConnectedName(cleanName);
      sound.playSelect();
      triggerGamepadToast('🎮 Геймпад подключен!', cleanName);
    };

    const handleGamepadDisconnected = (e: GamepadEvent) => {
      sound.playBump();
      setGamepadConnectedName(null);
      triggerGamepadToast('🎮 Геймпад отключен', 'Управление через клавиатуру');
    };

    window.addEventListener('gamepadconnected', handleGamepadConnected);
    window.addEventListener('gamepaddisconnected', handleGamepadDisconnected);

    return () => {
      window.removeEventListener('gamepadconnected', handleGamepadConnected);
      window.removeEventListener('gamepaddisconnected', handleGamepadDisconnected);
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  // Suspend haptic vibration if game is paused, victory, or game over
  useEffect(() => {
    setHapticsSuspended(isPaused || isGameOver || isVictory);
  }, [isPaused, isGameOver, isVictory]);

  // Reset haptics state on component unmount
  useEffect(() => {
    return () => {
      setHapticsSuspended(false);
    };
  }, []);

  // Initialize Game & Sound
  const initGame = () => {
    // Deep clone levelData so that collected items & broken bricks reset on restart
    const clonedData: LevelData = JSON.parse(JSON.stringify(levelData));
    const engine = new PhysicsEngine(clonedData, heroId);
    engine.onJuiceTrigger = (type: JuiceActionType) => {
      const text = getRandomJuiceText(type);
      const newEvent: JuiceEvent = {
        id: Date.now() + Math.random(),
        type,
        text,
      };
      setActiveJuice(newEvent);
      if (juiceTimerRef.current) {
        clearTimeout(juiceTimerRef.current);
      }
      juiceTimerRef.current = window.setTimeout(() => {
        setActiveJuice((current) => (current?.id === newEvent.id ? null : current));
      }, 2500);
    };
    physicsRef.current = engine;
    cameraRef.current = { x: 0, y: 0 };
    setIsVictory(false);
    setIsGameOver(false);
    setIsPaused(false);
    challengeCompletedRef.current = false;
    setChallengeCompleted(false);
    setShowChallengeBanner(false);
    sound.playBgm('gameplay');
  };

  // Preload and cache background image stably without flickering
  useEffect(() => {
    let img = bgImageCache.get(themeConfig.image);
    if (!img) {
      img = new Image();
      img.src = themeConfig.image;
      bgImageCache.set(themeConfig.image, img);
    }
    bgImageRef.current = img;
    if (img.complete && img.naturalWidth > 0) {
      bgImageRef.current = img;
    } else {
      img.onload = () => {
        bgImageRef.current = img;
      };
    }
  }, [themeConfig.image]);

  useEffect(() => {
    initGame();

    return () => {
      if (juiceTimerRef.current) clearTimeout(juiceTimerRef.current);
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
    let accumulator = 0;

    const loop = (now: number) => {
      // Calculate real delta time in seconds, clamped to 100ms to avoid spiral of death
      const rawDt = (now - lastTime) / 1000;
      lastTime = now;
      const frameTime = Math.min(Math.max(0, rawDt), 0.1);

      if (!isPaused) {
        accumulator = Math.min(accumulator + frameTime, MAX_ACCUMULATOR);
      } else {
        accumulator = 0;
      }

      // -------------------------------------------------------------
      // GAMEPAD POLLING (HTML5 Gamepad API)
      // -------------------------------------------------------------
      let padLeft = false;
      let padRight = false;
      let padJump = false;
      let padJumpJustPressed = false;
      let padStartJustPressed = false;
      let anyGamepadFound = false;

      if (typeof navigator !== 'undefined' && typeof navigator.getGamepads === 'function') {
        const gamepads = navigator.getGamepads();
        for (let i = 0; i < gamepads.length; i++) {
          const gp = gamepads[i];
          if (!gp || !gp.connected) continue;
          anyGamepadFound = true;

          // Deadzone calculation (> 0.2) to prevent analog stick drift
          // Left Stick: Axes 0 (horizontal), Axes 1 (vertical)
          const axisX = gp.axes[0] ?? 0;
          if (axisX < -0.2) padLeft = true;
          if (axisX > 0.2) padRight = true;

          // D-Pad: Button 14 = Left, Button 15 = Right
          if (gp.buttons[14]?.pressed) padLeft = true;
          if (gp.buttons[15]?.pressed) padRight = true;

          // Button 0 (A / Cross): Jump
          const btnA = gp.buttons[0]?.pressed;
          if (btnA) {
            padJump = true;
            if (!prevGamepadRef.current.jump) {
              padJumpJustPressed = true;
            }
          }

          // Button 9 (Start): Pause
          const btnStart = gp.buttons[9]?.pressed;
          if (btnStart && !prevGamepadRef.current.start) {
            padStartJustPressed = true;
          }

          // Store previous states for edge detection
          prevGamepadRef.current.jump = !!btnA;
          prevGamepadRef.current.start = !!btnStart;

          // Process the primary connected gamepad
          break;
        }
      }

      if (!anyGamepadFound) {
        prevGamepadRef.current.jump = false;
        prevGamepadRef.current.start = false;
      }

      // Handle Gamepad Start button pause toggle
      if (padStartJustPressed) {
        sound.playClick();
        setIsPaused((p) => !p);
      }

      const engine = physicsRef.current;
      let renderPlayerX = engine ? engine.player.x : 0;
      let renderPlayerY = engine ? engine.player.y : 0;
      let alpha = 1;

      if (engine && !isPaused) {
        // Track actions for tutorial if controlled via gamepad
        if (padLeft || padRight) {
          setHasMoved(true);
          TutorialManager.emitGameplayAction('move');
        }
        if (padJumpJustPressed) {
          setHasJumped(true);
          TutorialManager.emitGameplayAction('jump');
        }

        // Combine keyboard, on-screen touch and gamepad inputs
        const isMovingLeft = keysRef.current.left || padLeft;
        const isMovingRight = keysRef.current.right || padRight;
        const isJumping = keysRef.current.jump || padJump;
        if (padJumpJustPressed) {
          padJumpJustPressedRef.current = true;
        }

        // FIXED TIMESTEP (60Hz physics accumulator loop)
        // Guarantees identical gravity, jump impulse, and jump-cut curve across 60Hz, 144Hz, 240Hz monitors
        let maxSubSteps = 5;
        while (accumulator >= FIXED_DELTA_TIME && maxSubSteps > 0) {
          const isJumpJustPressed = keysRef.current.jumpJustPressed || padJumpJustPressedRef.current;

          engine.update(FIXED_DELTA_TIME, {
            left: isMovingLeft,
            right: isMovingRight,
            jump: isJumping,
            jumpJustPressed: isJumpJustPressed,
          });

          // Single-frame jump triggers are consumed by the fixed physics step
          keysRef.current.jumpJustPressed = false;
          padJumpJustPressedRef.current = false;

          accumulator -= FIXED_DELTA_TIME;
          maxSubSteps--;
        }

        if (maxSubSteps === 0) {
          accumulator = 0; // discard residual time on severe hitch
        }

        // Sync React HUD state only when visible values change
        const currentSec = Math.ceil(engine.stats.timeRemaining);
        const p = prevStatsRef.current;
        if (
          p.coinsCollected !== engine.stats.coinsCollected ||
          p.score !== engine.stats.score ||
          p.lives !== engine.stats.lives ||
          p.crystalsCollected !== engine.stats.crystalsCollected ||
          p.starsCollected !== engine.stats.starsCollected ||
          p.enemiesDefeated !== engine.stats.enemiesDefeated ||
          p.sec !== currentSec
        ) {
          prevStatsRef.current = {
            coinsCollected: engine.stats.coinsCollected,
            score: engine.stats.score,
            lives: engine.stats.lives,
            crystalsCollected: engine.stats.crystalsCollected,
            starsCollected: engine.stats.starsCollected,
            enemiesDefeated: engine.stats.enemiesDefeated,
            sec: currentSec,
          };
          setStats({ ...engine.stats });
        }

        // Goal & Challenge Completion Check (in real time)
        const activeGoal = levelData.goalType;
        if (activeGoal && activeGoal !== 'none' && !challengeCompletedRef.current) {
          let achieved = false;
          if (activeGoal === 'coins' && totalCoins > 0 && engine.stats.coinsCollected >= totalCoins) {
            achieved = true;
          } else if (activeGoal === 'enemies' && totalEnemies > 0 && engine.stats.enemiesDefeated >= totalEnemies) {
            achieved = true;
          } else if (activeGoal === 'crystals' && totalCrystals > 0 && engine.stats.crystalsCollected >= totalCrystals) {
            achieved = true;
          } else if (activeGoal === 'stars' && totalStars > 0 && engine.stats.starsCollected >= totalStars) {
            achieved = true;
          }

          if (achieved) {
            challengeCompletedRef.current = true;
            setChallengeCompleted(true);
            setShowChallengeBanner(true);
            sound.playVictory();
            setTimeout(() => {
              setShowChallengeBanner(false);
            }, 4500);
          }
        }

        if (engine.isVictory && !isVictory) {
          setIsVictory(true);
          TutorialManager.emitGameplayAction('victory');

          // End-of-level challenge checks
          if (activeGoal === 'time' && !challengeCompletedRef.current) {
            const limit = levelData.targetTime || levelData.timeLimit || 60;
            if (engine.stats.timeTaken <= limit) {
              challengeCompletedRef.current = true;
              setChallengeCompleted(true);
              setShowChallengeBanner(true);
              sound.playVictory();
            }
          } else if (activeGoal === 'no_damage' && !challengeCompletedRef.current) {
            if (engine.stats.lives >= 3) {
              challengeCompletedRef.current = true;
              setChallengeCompleted(true);
              setShowChallengeBanner(true);
              sound.playVictory();
            }
          }
        }
        if (engine.isGameOver && !isGameOver) {
          setIsGameOver(true);
        }

        // Visual interpolation alpha: fraction between previous and current physics state (0..1)
        alpha = Math.max(0, Math.min(1, accumulator / FIXED_DELTA_TIME));
        renderPlayerX = engine.player.prevX !== undefined
          ? engine.player.prevX + (engine.player.x - engine.player.prevX) * alpha
          : engine.player.x;
        renderPlayerY = engine.player.prevY !== undefined
          ? engine.player.prevY + (engine.player.y - engine.player.prevY) * alpha
          : engine.player.y;

        // Camera Follow Logic (smooth lerp targeting interpolated player coordinates)
        const canvasW = canvas.width;
        const canvasH = canvas.height;
        const targetCamX = renderPlayerX - canvasW * 0.38;
        const maxCamX = Math.max(0, engine.levelData.width * CELL_SIZE - canvasW);
        const clampedTargetX = Math.max(0, Math.min(maxCamX, targetCamX));
        cameraRef.current.x += (clampedTargetX - cameraRef.current.x) * 0.12;

        const totalLevelHeightPx = (engine.levelData.height || GRID_ROWS) * CELL_SIZE;
        const maxCamY = Math.max(0, totalLevelHeightPx - canvasH);
        if (maxCamY > 0) {
          const targetCamY = Math.max(0, Math.min(maxCamY, renderPlayerY - canvasH * 0.55));
          cameraRef.current.y += (targetCamY - cameraRef.current.y) * 0.12;
        } else {
          cameraRef.current.y = 0;
        }
      }

      // Ensure canvas pixel dimensions match display resolution
      if (
        containerRef.current &&
        containerRef.current.clientWidth > 0 &&
        containerRef.current.clientHeight > 0 &&
        (canvas.width !== containerRef.current.clientWidth || canvas.height !== containerRef.current.clientHeight)
      ) {
        canvas.width = containerRef.current.clientWidth;
        canvas.height = containerRef.current.clientHeight;
      }

      // --- Canvas Render ---
      const width = canvas.width;
      const height = canvas.height;
      const camX = cameraRef.current.x;
      const camY = cameraRef.current.y;

      // Clean frame clear to prevent flickering, ghosting, or artifacts
      ctx.clearRect(0, 0, width, height);

      // 1. Panoramic Parallax Background
      if (bgImageRef.current && bgImageRef.current.complete && bgImageRef.current.naturalWidth > 0) {
        const naturalW = bgImageRef.current.naturalWidth;
        const naturalH = bgImageRef.current.naturalHeight;
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
          const bgW = Math.max(1, height * imgAspect);
          const rawOffset = -(camX * parallaxFactor);
          const bgOffsetX = ((rawOffset % bgW) + bgW) % bgW - bgW;

          for (let x = bgOffsetX; x < width + bgW; x += bgW) {
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

        // 2b-2. Render Spawned Physical Loot Items (Coins, Hearts, Crystals from Question Blocks)
        if (engine.spawnedLoot && engine.spawnedLoot.length > 0) {
          engine.spawnedLoot.forEach((loot) => {
            SpriteRenderer.drawTile(ctx, loot.tileId, loot.x, loot.y, CELL_SIZE, {
              animTime: engine.player.animTime,
            });
          });
        }

        // 2b. Render Floating Cloud Islands (merged rigid bodies moving together, interpolated)
        engine.cloudIslands.forEach((island) => {
          const islandTilesMap = new Set(island.tiles.map((t) => `${t.x},${t.y}`));
          const renderOffsetX = island.prevOffsetX + (island.offsetX - island.prevOffsetX) * alpha;
          const renderOffsetY = island.prevOffsetY + (island.offsetY - island.prevOffsetY) * alpha;
          island.tiles.forEach((tile) => {
            const tx = tile.x * CELL_SIZE + renderOffsetX;
            const ty = tile.y * CELL_SIZE + renderOffsetY;

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

        // 3. Render Enemies (with visual interpolation for 144Hz+)
        engine.enemies.forEach((enemy) => {
          ctx.save();
          const enemyRenderX = enemy.prevX !== undefined
            ? enemy.prevX + (enemy.x - enemy.prevX) * alpha
            : enemy.x;
          const enemyRenderY = enemy.prevY !== undefined
            ? enemy.prevY + (enemy.y - enemy.prevY) * alpha
            : enemy.y;

          if (enemy.isSquashed) {
            // Squashed flat pose
            ctx.translate(enemyRenderX + CELL_SIZE * 0.5, enemyRenderY + CELL_SIZE * 0.7);
            ctx.scale(1.3, 0.25);
            SpriteRenderer.drawTile(ctx, enemy.tileId, -CELL_SIZE * 0.5, -CELL_SIZE * 0.5, CELL_SIZE, {
              animTime: enemy.animTimer,
            });
          } else {
            ctx.translate(enemyRenderX + CELL_SIZE * 0.5, enemyRenderY + CELL_SIZE * 0.5);

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

        // 5. Render Hero (interpolated for smooth 144Hz/240Hz visual motion)
        SpriteRenderer.drawHero(
          ctx,
          engine.heroId,
          renderPlayerX,
          renderPlayerY,
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
            customHeroData: levelData.customHeroData,
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
      <header className="absolute top-3 left-4 right-4 z-30 flex items-center justify-between pointer-events-none select-none gap-2 flex-wrap sm:flex-nowrap">
        {/* Left Stats Cluster: Navigation, Lives, Coins, Crystals, Stars */}
        <div className="flex items-center gap-2 pointer-events-auto flex-wrap sm:flex-nowrap">
          {/* Return to Editor CTA */}
          <button
            onClick={() => {
              sound.stopBgm();
              onExitToEditor();
            }}
            className="retro-btn-sm px-3 py-1.5 rounded-md bg-[#1E293B] hover:bg-amber-400 hover:text-black border-4 border-black text-amber-300 font-pixel text-[10px] flex items-center gap-1.5 shadow-[3px_3px_0px_#000000] transition-all cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5 stroke-[2.5]" />
            <span className="hidden sm:inline">В РЕДАКТОР</span>
          </button>

          {onExitToMenu && (
            <button
              onClick={() => {
                sound.stopBgm();
                sound.playClick();
                onExitToMenu();
              }}
              className="retro-btn-sm px-3 py-1.5 rounded-md bg-[#1E293B] hover:bg-sky-400 hover:text-black border-4 border-black text-sky-300 font-pixel text-[10px] flex items-center gap-1.5 shadow-[3px_3px_0px_#000000] transition-all cursor-pointer"
            >
              <Home className="w-3.5 h-3.5 text-sky-400" />
              <span className="hidden sm:inline">В СТУДИЮ</span>
            </button>
          )}

          {/* Hearts / Lives */}
          <div className="px-2.5 py-1.5 rounded-md bg-[#0F172A] border-4 border-black shadow-[3px_3px_0px_#000000] flex items-center gap-1.5">
            <div className="flex items-center gap-1">
              {[...Array(3)].map((_, i) => (
                <Heart
                  key={i}
                  className={`w-4 h-4 ${
                    i < stats.lives
                      ? 'text-rose-500 fill-rose-500 animate-pulse'
                      : 'text-slate-700 fill-slate-900'
                  }`}
                />
              ))}
            </div>
            <span className="font-pixel text-[11px] text-rose-400 font-bold ml-0.5">
              {stats.lives}
            </span>
          </div>

          {/* Coins */}
          <div className="px-2.5 py-1.5 rounded-md bg-[#0F172A] border-4 border-black shadow-[3px_3px_0px_#000000] flex items-center gap-1.5 text-amber-300">
            <Coins className="w-4 h-4 fill-amber-400 text-amber-600 shrink-0" />
            <span className="font-pixel text-[11px] tracking-wider font-bold text-amber-300">
              {stats.coinsCollected}
            </span>
          </div>

          {/* Crystals */}
          <div className="px-2.5 py-1.5 rounded-md bg-[#0F172A] border-4 border-black shadow-[3px_3px_0px_#000000] flex items-center gap-1.5 text-purple-300">
            <Gem className="w-4 h-4 fill-purple-400 text-purple-600 shrink-0" />
            <span className="font-pixel text-[11px] tracking-wider font-bold text-purple-300">
              {stats.crystalsCollected}
            </span>
          </div>

          {/* Stars */}
          <div className="px-2.5 py-1.5 rounded-md bg-[#0F172A] border-4 border-black shadow-[3px_3px_0px_#000000] flex items-center gap-1.5 text-yellow-300">
            <Sparkles className="w-4 h-4 fill-yellow-400 text-yellow-600 shrink-0" />
            <span className="font-pixel text-[11px] tracking-wider font-bold text-yellow-300">
              {stats.starsCollected}
            </span>
          </div>
        </div>

        {/* Center: Active Goal / Target Badge */}
        {levelData.goalType && levelData.goalType !== 'none' && (
          <div
            className={`px-3 py-1.5 rounded-md border-4 border-black shadow-[3px_3px_0px_#000000] flex items-center gap-2 pointer-events-auto transition-all ${
              challengeCompleted
                ? 'bg-amber-400 text-slate-950 font-bold animate-pulse'
                : 'bg-[#0F172A] text-amber-300'
            }`}
          >
            <Target className={`w-4 h-4 shrink-0 ${challengeCompleted ? 'text-slate-950' : 'text-amber-400'}`} />
            <div className="flex items-center gap-1.5 font-pixel text-[10px]">
              <span className="font-bold uppercase tracking-wider">ЦЕЛЬ:</span>
              <span className={challengeCompleted ? 'text-slate-950 font-bold' : 'text-white font-bold'}>
                {levelData.goalType === 'coins' && `МОНЕТЫ (${stats.coinsCollected}/${totalCoins})`}
                {levelData.goalType === 'enemies' && `ВРАГИ (${stats.enemiesDefeated}/${totalEnemies})`}
                {levelData.goalType === 'crystals' && `КРИСТАЛЛЫ (${stats.crystalsCollected}/${totalCrystals})`}
                {levelData.goalType === 'stars' && `ЗВЁЗДЫ (${stats.starsCollected}/${totalStars})`}
                {levelData.goalType === 'time' && `НА ВРЕМЯ (≤${levelData.targetTime || levelData.timeLimit || 60}с)`}
                {levelData.goalType === 'no_damage' && `БЕЗ УРОНА (${stats.lives}/3)`}
              </span>
              {challengeCompleted && (
                <span className="px-1.5 py-0.2 rounded bg-slate-950 text-amber-300 text-[9px] font-bold">
                  ВЫПОЛНЕНО!
                </span>
              )}
            </div>
          </div>
        )}

        {/* Right Stats Cluster: Time, Score, Audio & Controls */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Timer in HUD: Conditionally rendered based on level-specific hasTimer */}
          {(levelData.hasTimer ?? (levelData.goalType === 'time')) && (
            <div className="px-2.5 py-1.5 rounded-md bg-[#0F172A] border-4 border-black shadow-[3px_3px_0px_#000000] flex items-center gap-1.5 text-sky-300">
              <Clock className="w-4 h-4 text-sky-400 shrink-0" />
              <span className="font-pixel text-[11px] tracking-wider font-bold">
                {Math.ceil(stats.timeRemaining)}s
              </span>
            </div>
          )}

          {/* Score */}
          <div className="px-2.5 py-1.5 rounded-md bg-[#0F172A] border-4 border-black shadow-[3px_3px_0px_#000000] text-emerald-400 flex items-center gap-1.5">
            <span className="font-pixel text-[10px] text-emerald-400">СЧЁТ:</span>
            <span className="font-pixel text-[11px] text-white tracking-widest font-bold">
              {stats.score.toString().padStart(5, '0')}
            </span>
          </div>

          <button
            onClick={onToggleMute}
            title={isMuted ? 'Включить звук' : 'Заглушить звук'}
            className="retro-btn-sm p-1.5 rounded-md bg-[#1E293B] hover:bg-slate-700 border-4 border-black text-[var(--text-main)] shadow-[3px_3px_0px_#000000] cursor-pointer"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>

          <button
            onClick={() => setIsPaused((p) => !p)}
            title={isPaused ? 'Продолжить' : 'Пауза'}
            className="retro-btn-sm p-1.5 rounded-md bg-[#1E293B] hover:bg-slate-700 border-4 border-black text-[var(--text-main)] shadow-[3px_3px_0px_#000000] cursor-pointer"
          >
            {isPaused ? <Play className="w-4 h-4 text-emerald-400 fill-emerald-400" /> : <Pause className="w-4 h-4" />}
          </button>

          <button
            onClick={onToggleFullscreen}
            title={isFullscreen ? 'В окне' : 'Во весь экран'}
            className="retro-btn-sm p-1.5 rounded-md bg-[#1E293B] hover:bg-slate-700 border-4 border-black text-[var(--text-main)] shadow-[3px_3px_0px_#000000] cursor-pointer"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* GAMEPAD CONNECTION TOAST NOTIFICATION */}
      {gamepadToast && (
        <div className="absolute top-18 right-4 z-50 pointer-events-none animate-in fade-in slide-in-from-top-3 duration-300">
          <div className="px-4 py-2.5 rounded-xl bg-slate-900 border-2 border-emerald-400 text-white shadow-[4px_4px_0px_#000000] flex items-center gap-3 select-none">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-400 text-emerald-400 flex items-center justify-center text-lg font-bold">
              🎮
            </div>
            <div>
              <div className="font-pixel text-[11px] text-emerald-300 font-bold tracking-wide">
                {gamepadToast.message}
              </div>
              {gamepadToast.sub && (
                <div className="text-[10px] text-slate-300 font-mono font-medium truncate max-w-[240px]">
                  {gamepadToast.sub}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CHALLENGE COMPLETED CELEBRATORY BANNER */}
      {showChallengeBanner && (
        <div className="absolute top-18 left-1/2 -translate-x-1/2 z-50 pointer-events-none animate-in zoom-in-90 slide-in-from-top-4 duration-300">
          <div className="px-5 py-3 rounded-2xl bg-amber-400 border-4 border-black text-slate-950 shadow-[6px_6px_0px_#000000] flex items-center gap-3 select-none">
            <div className="w-10 h-10 rounded-xl bg-slate-950 text-amber-400 flex items-center justify-center text-xl font-bold border-2 border-black animate-bounce shrink-0">
              🎯
            </div>
            <div>
              <div className="font-pixel text-xs sm:text-sm font-bold text-slate-950 tracking-wider">
                ИСПЫТАНИЕ ВЫПОЛНЕНО!
              </div>
              <div className="text-xs font-bold text-slate-900 mt-0.5">
                {levelData.goalType === 'coins' && 'Все монеты успешно собраны!'}
                {levelData.goalType === 'enemies' && 'Все враги на уровне повержены!'}
                {levelData.goalType === 'crystals' && 'Все кристаллы найдены и собраны!'}
                {levelData.goalType === 'stars' && 'Все скрытые звёзды собраны!'}
                {levelData.goalType === 'time' && 'Уровень пройден в рекордное время!'}
                {levelData.goalType === 'no_damage' && 'Безупречно: без единого полученного урона!'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Interactive In-Game Tutorial Mission Guide (Step 8) */}
      {isTutorialMode && !isVictory && !isGameOver && (
        <div className="absolute top-16 left-4 right-4 z-40 flex justify-center pointer-events-none animate-in fade-in slide-in-from-top-3">
          <div data-dark-panel="true" className="dark-panel max-w-2xl bg-slate-950 border-2 border-amber-400 rounded-2xl p-3 sm:p-4 shadow-2xl shadow-amber-500/20 pointer-events-auto flex items-center justify-between gap-3 text-white">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-amber-500/20 border border-amber-400 flex items-center justify-center shrink-0 text-2xl animate-bounce">
                {!hasMoved ? '🏃' : !hasJumped ? '🦘' : stats.coinsCollected === 0 ? '🪙' : '🚩'}
              </div>
              <div className="text-xs sm:text-sm">
                <div className="font-black text-yellow-300 uppercase tracking-wider flex items-center gap-2">
                  <span>Обучение: Шаг 8 из 8 — Проверь игру в действии!</span>
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/30 text-yellow-200 text-[10px] font-mono">Плейтест</span>
                </div>
                <div className="text-white font-bold mt-0.5">
                  {!hasMoved ? (
                    <span>Нажимай стрелочки <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-yellow-300 font-mono border border-slate-700">⬅ ➡</kbd> или <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-yellow-300 font-mono border border-slate-700">A / D</kbd> (или Стик геймпада), чтобы побежать!</span>
                  ) : !hasJumped ? (
                    <span>Отлично! Теперь нажми <kbd className="px-2 py-0.5 rounded bg-emerald-900 text-yellow-300 font-mono border border-emerald-500">Пробел</kbd>, <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-yellow-300 font-mono border border-slate-700">W</kbd> или <kbd className="px-1.5 py-0.5 rounded bg-emerald-900 text-yellow-300 font-mono border border-emerald-500">Ⓐ</kbd>, чтобы прыгнуть!</span>
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

      {/* GAME JUICE POP-UP SYSTEM */}
      <GameJuicePopup currentEvent={activeJuice} />



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
          <div className="w-full max-w-md retro-modal tutorial-modal p-6 shadow-[6px_6px_0px_#000] text-center space-y-4 text-[var(--text-main)]">
            <div className="w-16 h-16 rounded-md bg-amber-400 border-2 border-black mx-auto flex items-center justify-center text-slate-950 shadow-[3px_3px_0px_#000]">
              <Trophy className="w-8 h-8 animate-bounce" />
            </div>

            <div>
              <div className="text-xs font-black uppercase tracking-widest text-amber-500 dark:text-amber-400">
                {isTutorialMode ? 'Обучение успешно завершено! 🎓' : 'Уровень пройден!'}
              </div>
              <h2 className="font-black text-2xl sm:text-3xl text-[#1E293B] dark:text-white mt-1">
                {isTutorialMode ? 'ПОЗДРАВЛЯЕМ, ГЕЙМДИЗАЙНЕР!' : 'ГРАНДИОЗНАЯ ПОБЕДА!'}
              </h2>
              {isTutorialMode && (
                <p className="text-xs sm:text-sm text-[#1E293B] dark:text-slate-200 mt-2 leading-relaxed font-medium">
                  Ты создал свой первый уровень в <span className="text-amber-500 dark:text-amber-300 font-bold">Super Pixel World</span> и победоносно прошёл его! Теперь у тебя есть все необходимые навыки — строй любые миры, делись ими и удивляй друзей!
                </p>
              )}
            </div>

            {/* Goal / Challenge Outcome */}
            {levelData.goalType && levelData.goalType !== 'none' && (
              <div
                className={`p-3 rounded-xl border-2 flex items-center justify-center gap-2 font-pixel text-xs ${
                  challengeCompleted
                    ? 'bg-amber-400 text-slate-950 border-black shadow-[3px_3px_0px_#000]'
                    : 'bg-slate-800/80 text-slate-300 border-slate-700'
                }`}
              >
                <span>{challengeCompleted ? '🏆' : '🎯'}</span>
                <span>
                  {challengeCompleted
                    ? 'ИСПЫТАНИЕ УРОВНЯ ВЫПОЛНЕНО!'
                    : 'ЦЕЛЬ УРОВНЯ НЕ БЫЛА ВЫПОЛНЕНА'}
                </span>
              </div>
            )}

            {/* Victory Statistics */}
            <div className="grid grid-cols-2 gap-2.5 p-3.5 bg-[var(--card-subtle)] rounded-2xl border border-[var(--border-color)] text-left text-xs">
              <div>
                <span className="text-[var(--text-muted)] font-medium">Время прохождения:</span>
                <div className="text-base font-bold text-sky-500 dark:text-cyan-400 font-mono">
                  {Math.round(stats.timeTaken)} сек.
                </div>
              </div>
              <div>
                <span className="text-[var(--text-muted)] font-medium">Итоговый счёт:</span>
                <div className="text-base font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                  {stats.score}
                </div>
              </div>
              <div>
                <span className="text-[var(--text-muted)] font-medium">Собрано монет:</span>
                <div className="text-base font-bold text-amber-500 dark:text-amber-400 font-mono">
                  {stats.coinsCollected}
                </div>
              </div>
              <div>
                <span className="text-[var(--text-muted)] font-medium">Найдено звёзд:</span>
                <div className="text-base font-bold text-yellow-500 dark:text-yellow-300 font-mono">
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
