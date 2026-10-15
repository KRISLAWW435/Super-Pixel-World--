/**
 * Super Pixel World - 60fps Platformer Physics & Interaction Engine
 * Robust sub-pixel continuous collision, coyote time, jump buffering, and hazard mechanics.
 */

import { CELL_SIZE, GRID_ROWS, HEROES, PALETTE_ITEMS } from './constants';
import { sound } from '../audio/soundEngine';
import {
  ActiveBlockBump,
  ActiveEnemy,
  EnemyTileId,
  GameStats,
  HeroId,
  LevelData,
  LevelItem,
  Particle,
  TileId,
} from '../types/game';

export interface PlayerState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  isGrounded: boolean;
  facingRight: boolean;
  isWalking: boolean;
  isInAir: boolean;
  isHurt: boolean;
  hurtTimer: number;
  coyoteTimer: number;
  jumpBufferTimer: number;
  springLaunchTimer: number;
  animTime: number;
  spawnX: number;
  spawnY: number;
  checkpointX: number;
  checkpointY: number;
}

export class PhysicsEngine {
  public player: PlayerState;
  public enemies: ActiveEnemy[] = [];
  public particles: Particle[] = [];
  public blockBumps: ActiveBlockBump[] = [];
  public stats: GameStats;
  public isVictory: boolean = false;
  public isGameOver: boolean = false;
  public heroId: HeroId;
  public levelData: LevelData;

  // Spatial lookup grid for O(1) tile collisions
  private solidGrid: Map<string, LevelItem> = new Map();
  private itemMap: Map<string, LevelItem> = new Map();

  constructor(levelData: LevelData, heroId?: HeroId) {
    this.levelData = levelData;
    this.heroId = heroId || levelData.heroId || 'leo';

    // Find player spawn or default to (3, 12)
    const spawnItem = levelData.items.find((it) => it.tileId === 'player_spawn');
    const startCellX = spawnItem ? spawnItem.x : 3;
    const startCellY = spawnItem ? spawnItem.y : 12;

    const startPx = startCellX * CELL_SIZE + 4;
    const startPy = (startCellY - 1) * CELL_SIZE;

    this.player = {
      x: startPx,
      y: startPy,
      vx: 0,
      vy: 0,
      width: 30,
      height: 38,
      isGrounded: false,
      facingRight: true,
      isWalking: false,
      isInAir: false,
      isHurt: false,
      hurtTimer: 0,
      coyoteTimer: 0,
      jumpBufferTimer: 0,
      springLaunchTimer: 0,
      animTime: 0,
      spawnX: startPx,
      spawnY: startPy,
      checkpointX: startPx,
      checkpointY: startPy,
    };

    // Calculate total collectibles
    let totalCoins = 0;
    let totalStars = 0;
    this.levelData.items.forEach((it) => {
      if (it.tileId === 'coin' || it.tileId === 'question_block') totalCoins++;
      if (it.tileId === 'star') totalStars++;
    });

    this.stats = {
      coinsCollected: 0,
      totalCoins,
      starsCollected: 0,
      totalStars,
      crystalsCollected: 0,
      enemiesDefeated: 0,
      timeRemaining: levelData.timeLimit || 300,
      timeTaken: 0,
      score: 0,
      lives: 3,
    };

    this.rebuildCollisionGrids();
    this.spawnEnemies();
  }

  public rebuildCollisionGrids() {
    this.solidGrid.clear();
    this.itemMap.clear();

    const solidSet = new Set(
      PALETTE_ITEMS.filter((p) => p.solid).map((p) => p.id)
    );

    this.levelData.items.forEach((item) => {
      const key = `${item.x},${item.y}`;
      this.itemMap.set(key, item);
      if (solidSet.has(item.tileId)) {
        this.solidGrid.set(key, item);
      }
    });
  }

  private spawnEnemies() {
    this.enemies = [];
    const enemyTypes = new Set<EnemyTileId>([
      'enemy_chaser',
      'enemy_patrol',
      'enemy_jumper',
      'enemy_slime',
    ]);

    this.levelData.items.forEach((item) => {
      if (enemyTypes.has(item.tileId as EnemyTileId)) {
        const tId = item.tileId as EnemyTileId;
        const speed =
          tId === 'enemy_chaser' ? 1.4 : tId === 'enemy_patrol' ? 1.25 : tId === 'enemy_jumper' ? 0 : 1.3;

        // Grounded enemies rest on top of ground block (CELL_SIZE - 32 = 8px offset); flying slime hovers at 4px
        const spawnY = tId === 'enemy_slime' ? item.y * CELL_SIZE + 4 : item.y * CELL_SIZE + (CELL_SIZE - 32);

        this.enemies.push({
          id: item.id,
          tileId: tId,
          x: item.x * CELL_SIZE + 4,
          y: spawnY,
          vx: tId === 'enemy_jumper' ? 0 : -speed,
          vy: 0,
          width: 32,
          height: 32,
          direction: -1,
          isSquashed: false,
          squashTimer: 0,
          animTimer: 0,
          initialX: item.x * CELL_SIZE + 4,
          initialY: spawnY,
          patrolRadius: 4 * CELL_SIZE, // 4 cells = 160 px patrol boundary
          isChasing: false,
          jumpCooldown: 1.5 + Math.random() * 0.8,
          isGrounded: true,
          pauseTimer: 0,
          preparingJump: false,
        });
      }
    });
  }

  /**
   * Main Physics Tick (dt in seconds, max 0.05)
   */
  public update(
    dt: number,
    input: {
      left: boolean;
      right: boolean;
      jump: boolean;
      jumpJustPressed: boolean;
    }
  ) {
    if (this.isVictory || this.isGameOver) {
      this.updateParticles(dt);
      return;
    }

    const heroConfig = HEROES[this.heroId] || HEROES.leo;
    const clampedDt = Math.min(dt, 0.05);

    // Timers
    this.stats.timeTaken += clampedDt;
    this.stats.timeRemaining = Math.max(0, this.stats.timeRemaining - clampedDt);
    if (this.stats.timeRemaining <= 0 && this.stats.lives > 0) {
      this.loseLife('Время вышло!');
    }

    this.player.animTime += clampedDt;
    if (this.player.hurtTimer > 0) {
      this.player.hurtTimer -= clampedDt;
      if (this.player.hurtTimer <= 0) {
        this.player.isHurt = false;
      }
    }

    // Input buffering & Coyote time
    if (input.jumpJustPressed) {
      this.player.jumpBufferTimer = 0.12; // 120ms buffer
    } else if (this.player.jumpBufferTimer > 0) {
      this.player.jumpBufferTimer -= clampedDt;
    }

    if (this.player.isGrounded) {
      this.player.coyoteTimer = 0.1; // 100ms coyote time
    } else if (this.player.coyoteTimer > 0) {
      this.player.coyoteTimer -= clampedDt;
    }

    // --- Horizontal Movement ---
    const accel = 32.0;
    const maxSpeed = heroConfig.speed;
    let friction = 0.82;

    // Check if standing on Ice
    const standingCellX = Math.floor((this.player.x + this.player.width * 0.5) / CELL_SIZE);
    const standingCellY = Math.floor((this.player.y + this.player.height + 2) / CELL_SIZE);
    const standingTile = this.solidGrid.get(`${standingCellX},${standingCellY}`);
    if (standingTile && standingTile.tileId === 'ice') {
      friction = 0.96; // ice slick
    }

    if (input.left) {
      this.player.vx -= accel * clampedDt;
      this.player.facingRight = false;
    } else if (input.right) {
      this.player.vx += accel * clampedDt;
      this.player.facingRight = true;
    } else {
      this.player.vx *= friction;
      if (Math.abs(this.player.vx) < 0.1) this.player.vx = 0;
    }

    this.player.vx = Math.max(-maxSpeed, Math.min(maxSpeed, this.player.vx));
    this.player.isWalking = Math.abs(this.player.vx) > 0.4;

    // --- Vertical Jump & Gravity ---
    const gravity = 28.0;
    this.player.vy += gravity * clampedDt;

    // Variable jump height & bot glide
    if (this.player.jumpBufferTimer > 0 && this.player.coyoteTimer > 0) {
      this.player.vy = -heroConfig.jumpPower;
      this.player.isGrounded = false;
      this.player.coyoteTimer = 0;
      this.player.jumpBufferTimer = 0;
      sound.playJump();
      this.emitDust(this.player.x + this.player.width * 0.5, this.player.y + this.player.height);
    }

    // Bolt's hover perk
    if (this.heroId === 'bolt' && input.jump && this.player.vy > 1.5 && this.player.vy < 6) {
      this.player.vy *= 0.88; // micro hover
    }

    // Truncate jump height on key release ONLY if not in a spring launch
    if (this.player.springLaunchTimer > 0) {
      this.player.springLaunchTimer -= clampedDt;
    } else if (!input.jump && this.player.vy < -3.0) {
      this.player.vy *= 0.65;
    }

    this.player.isInAir = !this.player.isGrounded;

    // --- Sub-pixel Collision Resolution (X first, then Y) ---
    // Horizontal Movement Pass
    this.player.x += this.player.vx;
    this.resolveHorizontalCollision();

    // Capture vertical falling velocity and position before vertical landing resolution
    const fallingVy = this.player.vy;
    const playerPreY = this.player.y;

    // Vertical Movement Pass
    this.player.y += this.player.vy;
    this.player.isGrounded = false;
    this.resolveVerticalCollision();

    // Clamp inside world borders
    const worldPixelWidth = this.levelData.width * CELL_SIZE;
    if (this.player.x < 0) {
      this.player.x = 0;
      this.player.vx = 0;
    }
    if (this.player.x + this.player.width > worldPixelWidth) {
      this.player.x = worldPixelWidth - this.player.width;
      this.player.vx = 0;
    }

    // Fall into bottom chasm
    if (this.player.y > (GRID_ROWS + 1) * CELL_SIZE) {
      this.loseLife('Упал в пропасть!');
    }

    // --- Interactive Objects overlap (Coins, Stars, Spring, Flag, Spikes) ---
    this.checkInteractiveOverlaps();

    // --- Enemies Update & Collisions ---
    this.updateEnemies(clampedDt, fallingVy, playerPreY);

    // --- Block Bumps & Particles ---
    this.updateBlockBumps(clampedDt);
    this.updateParticles(clampedDt);
  }

  private resolveHorizontalCollision() {
    const minCol = Math.floor(this.player.x / CELL_SIZE);
    const maxCol = Math.floor((this.player.x + this.player.width) / CELL_SIZE);
    const minRow = Math.floor(this.player.y / CELL_SIZE);
    const maxRow = Math.floor((this.player.y + this.player.height - 1) / CELL_SIZE);

    for (let row = minRow; row <= maxRow; row++) {
      for (let col = minCol; col <= maxCol; col++) {
        const item = this.solidGrid.get(`${col},${row}`);
        if (!item) continue;

        const tileLeft = col * CELL_SIZE;
        const tileRight = tileLeft + CELL_SIZE;

        if (this.player.vx > 0) {
          // Moving right
          this.player.x = tileLeft - this.player.width;
          this.player.vx = 0;
        } else if (this.player.vx < 0) {
          // Moving left
          this.player.x = tileRight;
          this.player.vx = 0;
        }
      }
    }
  }

  private resolveVerticalCollision() {
    const minCol = Math.floor(this.player.x / CELL_SIZE);
    const maxCol = Math.floor((this.player.x + this.player.width) / CELL_SIZE);
    const minRow = Math.floor(this.player.y / CELL_SIZE);
    const maxRow = Math.floor((this.player.y + this.player.height) / CELL_SIZE);

    for (let row = minRow; row <= maxRow; row++) {
      for (let col = minCol; col <= maxCol; col++) {
        const item = this.solidGrid.get(`${col},${row}`);
        if (!item) continue;

        const tileTop = row * CELL_SIZE;
        const tileBottom = tileTop + CELL_SIZE;

        if (this.player.vy > 0) {
          // Falling down onto solid platform
          if (this.player.y + this.player.height - this.player.vy <= tileTop + 6) {
            this.player.y = tileTop - this.player.height;
            this.player.vy = 0;
            this.player.isGrounded = true;
          }
        } else if (this.player.vy < 0) {
          // Jumping up into solid block from underneath!
          if (this.player.y - this.player.vy >= tileBottom - 8) {
            this.player.y = tileBottom;
            this.player.vy = 0;
            this.onHeadBumpBlock(col, row, item);
          }
        }
      }
    }
  }

  private onHeadBumpBlock(col: number, row: number, item: LevelItem) {
    if (item.tileId === 'question_block' && item.variant !== 'spent') {
      // Mark as spent
      item.variant = 'spent';
      sound.playBump();
      sound.playCoin();
      this.stats.coinsCollected++;
      this.stats.score += 200;

      // Add bumping block animation
      this.blockBumps.push({
        x: col * CELL_SIZE,
        y: row * CELL_SIZE,
        offsetY: 0,
        vy: -5,
        tileId: 'question_block',
      });

      // Coin pop up animation
      this.emitCoinPop(col * CELL_SIZE + CELL_SIZE * 0.5, row * CELL_SIZE);
    } else if (item.tileId === 'brick') {
      sound.playBreak();
      this.stats.score += 50;

      // Shatter brick into 4 particles
      this.emitBrickShatter(col * CELL_SIZE + CELL_SIZE * 0.5, row * CELL_SIZE + CELL_SIZE * 0.5);

      // Remove brick from level
      const idx = this.levelData.items.findIndex((it) => it.id === item.id);
      if (idx !== -1) {
        this.levelData.items.splice(idx, 1);
      }
      this.rebuildCollisionGrids();
    } else {
      sound.playBump();
      this.blockBumps.push({
        x: col * CELL_SIZE,
        y: row * CELL_SIZE,
        offsetY: 0,
        vy: -3,
        tileId: item.tileId,
      });
    }
  }

  private checkInteractiveOverlaps() {
    const minCol = Math.floor(this.player.x / CELL_SIZE);
    const maxCol = Math.floor((this.player.x + this.player.width) / CELL_SIZE);
    const minRow = Math.floor(this.player.y / CELL_SIZE);
    const maxRow = Math.floor((this.player.y + this.player.height) / CELL_SIZE);

    for (let row = minRow; row <= maxRow; row++) {
      for (let col = minCol; col <= maxCol; col++) {
        const item = this.itemMap.get(`${col},${row}`);
        if (!item) continue;

        const tileBox = {
          x: col * CELL_SIZE,
          y: row * CELL_SIZE,
          w: CELL_SIZE,
          h: CELL_SIZE,
        };

        if (this.isAABBIntersect(this.player, tileBox)) {
          this.handleItemTouch(item, col, row);
        }
      }
    }
  }

  private handleItemTouch(item: LevelItem, col: number, row: number) {
    if (item.tileId === 'coin') {
      sound.playCoin();
      this.stats.coinsCollected++;
      this.stats.score += 100;
      this.emitCoinPop(col * CELL_SIZE + CELL_SIZE * 0.5, row * CELL_SIZE + CELL_SIZE * 0.5);
      this.removeItem(item);
    } else if (item.tileId === 'star') {
      sound.playGem();
      this.stats.starsCollected++;
      this.stats.score += 500;
      this.emitStars(col * CELL_SIZE + CELL_SIZE * 0.5, row * CELL_SIZE + CELL_SIZE * 0.5);
      this.removeItem(item);
    } else if (item.tileId === 'crystal') {
      sound.playGem();
      this.stats.crystalsCollected++;
      this.stats.score += 1000;
      this.emitSparkles(col * CELL_SIZE + CELL_SIZE * 0.5, row * CELL_SIZE + CELL_SIZE * 0.5, '#c084fc');
      this.removeItem(item);
    } else if (item.tileId === 'spring') {
      // Spring bounce - SUPER LAUNCH!
      sound.playSpring();
      this.player.springLaunchTimer = 0.55; // prevents any premature jump dampening
      this.player.vy = -23.0; // powerful mega launch up 8-10 blocks!
      this.player.y = Math.min(this.player.y, row * CELL_SIZE - this.player.height + 4);
      this.player.isGrounded = false;
      this.emitSparkles(col * CELL_SIZE + CELL_SIZE * 0.5, row * CELL_SIZE + CELL_SIZE * 0.5, '#ef4444');
      this.emitStars(col * CELL_SIZE + CELL_SIZE * 0.5, row * CELL_SIZE + CELL_SIZE * 0.5);
    } else if (item.tileId === 'spikes') {
      if (!this.player.isHurt) {
        this.loseLife('Напоролся на шипы!');
      }
    } else if (item.tileId === 'checkpoint') {
      if (item.variant !== 'active') {
        item.variant = 'active';
        sound.playCheckpoint();
        this.player.checkpointX = col * CELL_SIZE;
        this.player.checkpointY = (row - 1) * CELL_SIZE;
        this.stats.score += 300;
        this.emitStars(col * CELL_SIZE + CELL_SIZE * 0.5, row * CELL_SIZE);
      }
    } else if (item.tileId === 'goal') {
      // VICTORY!
      if (!this.isVictory) {
        this.triggerVictory();
      }
    }
  }

  private removeItem(item: LevelItem) {
    const idx = this.levelData.items.findIndex((it) => it.id === item.id);
    if (idx !== -1) {
      this.levelData.items.splice(idx, 1);
    }
    this.rebuildCollisionGrids();
  }

  private updateEnemies(dt: number, fallingVy: number = 0, playerPreY: number = this.player.y) {
    const playerCenterX = this.player.x + this.player.width * 0.5;
    const playerCenterY = this.player.y + this.player.height * 0.5;

    const deadEnemyIds = new Set<string>();

    for (const enemy of this.enemies) {
      if (enemy.isSquashed || deadEnemyIds.has(enemy.id)) {
        deadEnemyIds.add(enemy.id);
        continue;
      }

      enemy.animTimer += dt;
      const dx = playerCenterX - (enemy.x + enemy.width * 0.5);
      const dy = playerCenterY - (enemy.y + enemy.height * 0.5);
      const dist = Math.sqrt(dx * dx + dy * dy);

      // --- 1. ENEMY AI & ATTACK LOGIC (4 distinct attack styles) ---
      if (enemy.tileId === 'enemy_slime') {
        // --- 4. ЛЕТУЧИЙ ПИКИРОВЩИК (Воздушная атака волной) ---
        // Парит в воздухе и пикирует волной на героя при приближении
        const isNear = Math.abs(dx) < 280;
        enemy.x += enemy.vx;
        enemy.direction = enemy.vx > 0 ? 1 : -1;

        if (isNear) {
          // Динамичное пике вниз на высоту героя с возвратом вверх
          enemy.y = enemy.initialY + Math.sin(enemy.animTimer * 4.5) * 32 + 20;
        } else {
          // Спокойное парение
          enemy.y = enemy.initialY + Math.sin(enemy.animTimer * 3) * 12;
        }

        // Разворот на границе зоны патруля
        if (enemy.x > enemy.initialX + enemy.patrolRadius && enemy.vx > 0) {
          enemy.vx = -1.3;
        } else if (enemy.x < enemy.initialX - enemy.patrolRadius && enemy.vx < 0) {
          enemy.vx = 1.3;
        }
      } else if (enemy.tileId === 'enemy_jumper') {
        // --- 3. ПРЫГУН-ЗАСАДНИК (Атака прыжками) ---
        // Сидит на платформе, приседает и совершает высокие дуговые прыжки в сторону героя
        if (enemy.isGrounded) {
          enemy.vx *= 0.8; // трение на земле
          enemy.jumpCooldown -= dt;

          if (enemy.jumpCooldown <= 0.45 && enemy.jumpCooldown > 0) {
            enemy.preparingJump = true;
            if (Math.abs(dx) < 380) {
              enemy.direction = dx > 0 ? 1 : -1;
            }
          } else if (enemy.jumpCooldown <= 0) {
            enemy.preparingJump = false;
            enemy.isGrounded = false;
            enemy.vy = -11.2;
            const jDir = Math.abs(dx) < 380 ? (dx > 0 ? 1 : -1) : enemy.direction;
            enemy.direction = jDir;
            enemy.vx = jDir * 2.8;
            enemy.jumpCooldown = 2.0 + Math.random() * 0.7;
            this.emitDust(enemy.x + enemy.width * 0.5, enemy.y + enemy.height);
          }
        } else {
          // В полете
          enemy.vy += 22 * dt;
        }

        enemy.x += enemy.vx;
        enemy.y += enemy.vy;

        // Приземление на платформы
        const enemyBottomY = enemy.y + enemy.height;
        const footCol = Math.floor((enemy.x + enemy.width * 0.5) / CELL_SIZE);
        const footRow = Math.floor(enemyBottomY / CELL_SIZE);
        const landingItem = this.solidGrid.get(`${footCol},${footRow}`);

        if (landingItem && enemy.vy > 0 && enemyBottomY - enemy.vy <= footRow * CELL_SIZE + 12) {
          enemy.y = footRow * CELL_SIZE - enemy.height;
          enemy.vy = 0;
          enemy.isGrounded = true;
        }
      } else if (enemy.tileId === 'enemy_patrol') {
        // --- 2. ЧАСОВОЙ (Патруль строго по своим 3–5 клеткам) ---
        const minX = enemy.initialX - enemy.patrolRadius;
        const maxX = enemy.initialX + enemy.patrolRadius;

        if (enemy.pauseTimer && enemy.pauseTimer > 0) {
          enemy.pauseTimer -= dt;
          enemy.vx = 0;
        } else {
          enemy.vx = enemy.direction * 1.25;
          enemy.x += enemy.vx;

          const frontFootX = enemy.vx > 0 ? enemy.x + enemy.width + 4 : enemy.x - 4;
          const frontCol = Math.floor(frontFootX / CELL_SIZE);
          const enemyRow = Math.floor((enemy.y + 16) / CELL_SIZE);
          const belowRow = Math.floor((enemy.y + enemy.height + 4) / CELL_SIZE);

          const hitBoundary = (enemy.direction > 0 && enemy.x >= maxX) || (enemy.direction < 0 && enemy.x <= minX);
          const hitWall = !!this.solidGrid.get(`${frontCol},${enemyRow}`);
          const gapAhead = !this.solidGrid.get(`${frontCol},${belowRow}`);

          if (hitBoundary || hitWall || gapAhead) {
            enemy.pauseTimer = 0.4; // секундная пауза дозора перед разворотом
            enemy.direction = enemy.direction > 0 ? -1 : 1;
            enemy.vx = 0;
          }
        }
      } else {
        // --- 1. ЗВЕРЬ-ОХОТНИК (enemy_chaser) ---
        // Охотник замечает героя и бежит за ним на удвоенной скорости!
        if (dist < 340 && Math.abs(dy) < 140) {
          enemy.isChasing = true;
          enemy.direction = dx > 0 ? 1 : -1;
          enemy.vx = enemy.direction * 2.8; // стремительная погоня!

          // Небольшой подскок если перед охотником ступенька в 1 блок
          const frontFootX = enemy.vx > 0 ? enemy.x + enemy.width + 4 : enemy.x - 4;
          const frontCol = Math.floor(frontFootX / CELL_SIZE);
          const enemyRow = Math.floor((enemy.y + 16) / CELL_SIZE);
          if (this.solidGrid.get(`${frontCol},${enemyRow}`) && enemy.isGrounded) {
            enemy.vy = -7.0;
            enemy.isGrounded = false;
          }
        } else {
          enemy.isChasing = false;
          enemy.vx = enemy.direction * 1.3;
        }

        enemy.x += enemy.vx;

        // Проверка стен и края платформы
        const frontFootX = enemy.vx > 0 ? enemy.x + enemy.width + 4 : enemy.x - 4;
        const frontCol = Math.floor(frontFootX / CELL_SIZE);
        const enemyRow = Math.floor((enemy.y + 16) / CELL_SIZE);
        const belowRow = Math.floor((enemy.y + enemy.height + 4) / CELL_SIZE);

        const wallItem = this.solidGrid.get(`${frontCol},${enemyRow}`);
        const groundItem = this.solidGrid.get(`${frontCol},${belowRow}`);

        // Разворот у стены или у обрыва (если не в яростной погоне)
        if (wallItem || (!groundItem && !enemy.isChasing)) {
          enemy.direction = enemy.direction > 0 ? -1 : 1;
          enemy.vx = enemy.direction * Math.abs(enemy.vx);
        }
      }

      // --- 2. СТОЛКНОВЕНИЕ С ИГРОКОМ ---
      if (this.isAABBIntersect(this.player, { x: enemy.x, y: enemy.y, w: enemy.width, h: enemy.height })) {
        const playerBottom = this.player.y + this.player.height;
        const playerPreBottom = playerPreY + this.player.height;
        const enemyTop = enemy.y;
        const enemyMidY = enemy.y + enemy.height * 0.5;

        // Надежное определение прыжка сверху ("убить их можно если на них прыгнуть"):
        // - Игрок опускался вниз (fallingVy > 0 или в воздухе или vy >= 0)
        // - И находился выше центра врага / падал сверху
        const isDescending = fallingVy > 0 || this.player.isInAir || this.player.vy >= 0;
        const cameFromAbove =
          playerPreBottom <= enemyTop + 20 ||
          this.player.y + this.player.height * 0.7 <= enemy.y + enemy.height ||
          playerBottom <= enemyMidY + 20;

        const isStomp = isDescending && cameFromAbove;

        if (isStomp) {
          // ВРАГ МГНОВЕННО УНИЧТОЖАЕТСЯ И ИСЧЕЗАЕТ!
          deadEnemyIds.add(enemy.id);

          // Высокий упругий отскок героя вверх
          this.player.vy = -12.5;
          this.player.isGrounded = false;
          this.player.isInAir = true;

          sound.playStomp();
          this.stats.enemiesDefeated++;
          this.stats.score += 250;

          // Яркие эффекты победы
          this.emitDust(enemy.x + enemy.width * 0.5, enemy.y + enemy.height * 0.5);
          this.emitSparkles(enemy.x + enemy.width * 0.5, enemy.y + enemy.height * 0.5, '#f59e0b');
          this.emitCoinPop(enemy.x + enemy.width * 0.5, enemy.y);
          continue;
        } else if (!this.player.isHurt && this.player.hurtTimer <= 0) {
          // Враг задел игрока сбоку или снизу: минус жизнь, но игрок двигается далее!
          this.takeDamageFromEnemy(enemy);
        }
      }
    }

    // Удаление уничтоженных врагов мгновенно из всех списков
    if (deadEnemyIds.size > 0) {
      this.enemies = this.enemies.filter((e) => !deadEnemyIds.has(e.id));
      this.levelData.items = this.levelData.items.filter((it) => !deadEnemyIds.has(it.id));
      this.rebuildCollisionGrids();
    }
  }

  /**
   * Получение урона от врага: минус жизнь, кратковременная неуязвимость и отскок,
   * но игрок продолжает движение вперед (без респауна на чекпоинт!)
   */
  public takeDamageFromEnemy(enemy: ActiveEnemy) {
    if (this.player.isHurt || this.player.hurtTimer > 0) return;

    sound.playHurt();
    this.stats.lives--;

    if (this.stats.lives <= 0) {
      this.isGameOver = true;
      sound.playGameOver();
      return;
    }

    // Игрок НЕ возвращается на чекпоинт, а двигается далее
    this.player.isHurt = true;
    this.player.hurtTimer = 1.8;

    // Легкий отскок от врага в сторону движения
    const knockDir = this.player.x < enemy.x ? -1 : 1;
    this.player.vx = knockDir * 4.0;
    this.player.vy = -4.5;
    this.player.isGrounded = false;
    this.player.isInAir = true;

    this.emitStars(this.player.x + this.player.width * 0.5, this.player.y + this.player.height * 0.5);
  }

  public loseLife(_reason: string) {
    sound.playHurt();
    this.stats.lives--;

    if (this.stats.lives <= 0) {
      this.isGameOver = true;
      return;
    }

    // Respawn at checkpoint (только при падении в пропасть или тайм-ауте)
    this.player.x = this.player.checkpointX;
    this.player.y = this.player.checkpointY;
    this.player.vx = 0;
    this.player.vy = 0;
    this.player.isHurt = true;
    this.player.hurtTimer = 2.0; // 2s invulnerability flashing

    this.emitStars(this.player.x + this.player.width * 0.5, this.player.y + this.player.height * 0.5);
  }

  public triggerVictory() {
    this.isVictory = true;
    sound.playVictory();

    // Celebration fireworks
    for (let i = 0; i < 40; i++) {
      this.emitConfetti(
        this.player.x + (Math.random() * 200 - 100),
        this.player.y - 40 + (Math.random() * 100 - 50)
      );
    }
  }

  // --- Particles & Animations ---

  private updateBlockBumps(dt: number) {
    this.blockBumps.forEach((bump) => {
      bump.offsetY += bump.vy;
      bump.vy += 24 * dt;
      if (bump.offsetY > 0) {
        bump.offsetY = 0;
      }
    });
    this.blockBumps = this.blockBumps.filter((b) => b.offsetY < 0);
  }

  private updateParticles(dt: number) {
    this.particles.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 12 * dt; // gravity
      p.life += dt;
      p.alpha = Math.max(0, 1 - p.life / p.maxLife);
      if (p.rotation !== undefined && p.vRot) {
        p.rotation += p.vRot;
      }
    });
    this.particles = this.particles.filter((p) => p.life < p.maxLife);
  }

  public emitDust(x: number, y: number) {
    for (let i = 0; i < 5; i++) {
      this.particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 4,
        vy: -Math.random() * 2 - 1,
        color: 'rgba(255, 255, 255, 0.7)',
        size: Math.random() * 3 + 2,
        alpha: 0.8,
        life: 0,
        maxLife: 0.35,
      });
    }
  }

  public emitCoinPop(x: number, y: number) {
    for (let i = 0; i < 8; i++) {
      this.particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 6,
        vy: -Math.random() * 5 - 3,
        color: '#facc15',
        size: Math.random() * 3 + 3,
        alpha: 1,
        life: 0,
        maxLife: 0.5,
        shape: 'sparkle',
      });
    }
  }

  public emitBrickShatter(x: number, y: number) {
    const velocities = [
      { vx: -3, vy: -5 },
      { vx: 3, vy: -5 },
      { vx: -2, vy: -3 },
      { vx: 2, vy: -3 },
    ];
    velocities.forEach(({ vx, vy }) => {
      this.particles.push({
        x,
        y,
        vx,
        vy,
        color: '#ea580c',
        size: 8,
        alpha: 1,
        life: 0,
        maxLife: 0.6,
        shape: 'square',
        rotation: 0,
        vRot: (Math.random() - 0.5) * 0.3,
      });
    });
  }

  public emitStars(x: number, y: number) {
    for (let i = 0; i < 10; i++) {
      this.particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 7,
        vy: (Math.random() - 0.5) * 7,
        color: '#fde047',
        size: Math.random() * 4 + 3,
        alpha: 1,
        life: 0,
        maxLife: 0.6,
        shape: 'star',
      });
    }
  }

  public emitSparkles(x: number, y: number, color: string) {
    for (let i = 0; i < 6; i++) {
      this.particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 5,
        vy: (Math.random() - 0.5) * 5,
        color,
        size: 3.5,
        alpha: 1,
        life: 0,
        maxLife: 0.45,
        shape: 'sparkle',
      });
    }
  }

  public emitConfetti(x: number, y: number) {
    const colors = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];
    for (let i = 0; i < 12; i++) {
      this.particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 12,
        vy: -Math.random() * 8 - 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 5 + 4,
        alpha: 1,
        life: 0,
        maxLife: 1.2,
        shape: 'square',
        rotation: Math.random() * Math.PI,
        vRot: (Math.random() - 0.5) * 0.2,
      });
    }
  }

  private isAABBIntersect(
    a: { x: number; y: number; width?: number; w?: number; height?: number; h?: number },
    b: { x: number; y: number; width?: number; w?: number; height?: number; h?: number }
  ): boolean {
    const aw = a.width ?? a.w ?? 0;
    const ah = a.height ?? a.h ?? 0;
    const bw = b.width ?? b.w ?? 0;
    const bh = b.height ?? b.h ?? 0;
    return a.x < b.x + bw && a.x + aw > b.x && a.y < b.y + bh && a.y + ah > b.y;
  }
}
