/**
 * Super Pixel World - Sprite & Tile Vector/Pixel Rendering Engine
 * Beautiful, scalable, high-performance rendering for 60fps canvas gameplay and editor preview.
 */

import { CELL_SIZE } from '../game/constants';
import { HeroId, Particle, TileId } from '../types/game';
import heroIdleImgSrc from '../assets/animate/hero_idle.png';
import heroRunImgSrc from '../assets/animate/hero_run.png';
import heroJumpImgSrc from '../assets/animate/hero_jump.png';
import heroFallImgSrc from '../assets/animate/hero_fall.png';

// Pre-load hero animation sprite sheets
const heroIdleImg: HTMLImageElement | null = typeof window !== 'undefined' ? new Image() : null;
if (heroIdleImg) {
  heroIdleImg.src = heroIdleImgSrc;
}

const heroRunImg: HTMLImageElement | null = typeof window !== 'undefined' ? new Image() : null;
if (heroRunImg) {
  heroRunImg.src = heroRunImgSrc;
}

const heroJumpImg: HTMLImageElement | null = typeof window !== 'undefined' ? new Image() : null;
if (heroJumpImg) {
  heroJumpImg.src = heroJumpImgSrc;
}

const heroFallImg: HTMLImageElement | null = typeof window !== 'undefined' ? new Image() : null;
if (heroFallImg) {
  heroFallImg.src = heroFallImgSrc;
}

// Helper colors and gradients
export class SpriteRenderer {
  /**
   * Draw a single tile or object at given grid position or pixel position
   */
  public static drawTile(
    ctx: CanvasRenderingContext2D,
    tileId: TileId,
    px: number,
    py: number,
    size: number = CELL_SIZE,
    options: {
      hasLeft?: boolean;
      hasRight?: boolean;
      hasTop?: boolean;
      hasBottom?: boolean;
      animTime?: number;
      isSpent?: boolean;
      variant?: string;
      isThumbnail?: boolean;
    } = {}
  ) {
    const { hasLeft = false, hasRight = false, animTime = 0, isSpent = false, isThumbnail = false } = options;

    ctx.save();
    ctx.translate(px, py);

    switch (tileId) {
      case 'grass_dirt':
        this.drawGrassDirt(ctx, size, hasLeft, hasRight);
        break;
      case 'stone':
        this.drawStone(ctx, size, hasLeft, hasRight);
        break;
      case 'wood':
        this.drawWood(ctx, size, hasLeft, hasRight);
        break;
      case 'brick':
        this.drawBrick(ctx, size);
        break;
      case 'ice':
      case 'ice_block':
        this.drawIce(ctx, size, hasLeft, hasRight, animTime);
        break;
      case 'cloud':
        this.drawCloud(ctx, size, animTime);
        break;
      case 'cloud_platform':
        this.drawCloudPlatform(ctx, size, animTime, hasLeft, hasRight, options.hasTop, options.hasBottom);
        break;
      case 'mushroom':
        this.drawMushroomPlatform(ctx, size, hasLeft, hasRight);
        break;
      case 'candy':
        this.drawCandy(ctx, size, hasLeft, hasRight);
        break;
      case 'crystal_block':
        this.drawCrystalBlock(ctx, size, animTime);
        break;
      case 'pipe_green':
      case 'pipe_green_entrance':
      case 'pipe_green_exit':
        this.drawPipe(ctx, isThumbnail ? size : size * 2, 'green', isThumbnail);
        break;
      case 'pipe_red':
      case 'pipe_red_entrance':
      case 'pipe_red_exit':
        this.drawPipe(ctx, isThumbnail ? size : size * 2, 'red', isThumbnail);
        break;
      case 'bonus_heart':
        this.drawHeart(ctx, size, animTime);
        break;
      case 'coin':
        this.drawCoin(ctx, size, animTime);
        break;
      case 'star':
        this.drawStar(ctx, size, animTime);
        break;
      case 'crystal':
        this.drawCrystal(ctx, size, animTime);
        break;
      case 'question_block':
        this.drawQuestionBlock(ctx, size, animTime, isSpent);
        break;
      case 'spring':
        this.drawSpring(ctx, size, animTime);
        break;
      case 'spikes':
        this.drawSpikes(ctx, size);
        break;
      case 'checkpoint':
        this.drawCheckpoint(ctx, size, options.variant === 'active');
        break;
      case 'goal':
        this.drawGoalGate(ctx, size, animTime);
        break;
      case 'enemy_chaser':
        this.drawEnemyChaser(ctx, size, animTime);
        break;
      case 'enemy_patrol':
        this.drawEnemyPatrol(ctx, size, animTime);
        break;
      case 'enemy_jumper':
        this.drawEnemyJumper(ctx, size, animTime);
        break;
      case 'enemy_slime':
        this.drawEnemySlime(ctx, size, animTime);
        break;
      case 'enemy_jumper':
        this.drawEnemyJumper(ctx, size, animTime);
        break;
      case 'player_spawn':
        this.drawSpawnMarker(ctx, size, animTime);
        break;
      default:
        // Fallback block
        ctx.fillStyle = '#cbd5e1';
        ctx.fillRect(0, 0, size, size);
    }

    ctx.restore();
  }

  // --- Platforms & Blocks ---

  private static drawGrassDirt(ctx: CanvasRenderingContext2D, s: number, hasL: boolean, hasR: boolean) {
    // Dirt base
    const dirtGrad = ctx.createLinearGradient(0, 0, 0, s);
    dirtGrad.addColorStop(0, '#8B5A2B');
    dirtGrad.addColorStop(1, '#5C3818');
    ctx.fillStyle = dirtGrad;

    const r = 6;
    ctx.beginPath();
    // Rounded corners on open edges
    ctx.roundRect(0, 0, s, s, [!hasL ? r : 0, !hasR ? r : 0, !hasR ? r : 0, !hasL ? r : 0]);
    ctx.fill();

    // Dirt pebble details
    ctx.fillStyle = '#4a2c11';
    ctx.beginPath();
    ctx.arc(s * 0.3, s * 0.65, 3, 0, Math.PI * 2);
    ctx.arc(s * 0.75, s * 0.8, 2.5, 0, Math.PI * 2);
    ctx.arc(s * 0.6, s * 0.45, 2, 0, Math.PI * 2);
    ctx.fill();

    // Lush grass top layer
    const grassGrad = ctx.createLinearGradient(0, 0, 0, s * 0.4);
    grassGrad.addColorStop(0, '#58cc02');
    grassGrad.addColorStop(1, '#3b8b02');
    ctx.fillStyle = grassGrad;

    ctx.beginPath();
    ctx.roundRect(0, 0, s, s * 0.32, [!hasL ? r : 0, !hasR ? r : 0, 0, 0]);
    ctx.fill();

    // Grass fringe drops
    ctx.fillStyle = '#3b8b02';
    const drops = [0.15, 0.4, 0.65, 0.85];
    drops.forEach((dx) => {
      ctx.beginPath();
      ctx.arc(s * dx, s * 0.32, 3.5, 0, Math.PI);
      ctx.fill();
    });

    // Top highlight rim
    ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.fillRect(hasL ? 0 : 2, 0, s - (hasL ? 0 : 2) - (hasR ? 0 : 2), 3);
  }

  private static drawStone(ctx: CanvasRenderingContext2D, s: number, hasL: boolean, hasR: boolean) {
    const stoneGrad = ctx.createLinearGradient(0, 0, 0, s);
    stoneGrad.addColorStop(0, '#94a3b8');
    stoneGrad.addColorStop(1, '#475569');
    ctx.fillStyle = stoneGrad;

    const r = 4;
    ctx.beginPath();
    ctx.roundRect(0, 0, s, s, [!hasL ? r : 0, !hasR ? r : 0, !hasR ? r : 0, !hasL ? r : 0]);
    ctx.fill();

    // Mortar lines
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, s * 0.5);
    ctx.lineTo(s, s * 0.5);
    ctx.moveTo(s * 0.5, 0);
    ctx.lineTo(s * 0.5, s * 0.5);
    ctx.moveTo(s * 0.25, s * 0.5);
    ctx.lineTo(s * 0.25, s);
    ctx.moveTo(s * 0.75, s * 0.5);
    ctx.lineTo(s * 0.75, s);
    ctx.stroke();

    // Highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.fillRect(1, 1, s - 2, 2);
    // Shadow bottom
    ctx.fillStyle = 'rgba(15, 23, 42, 0.4)';
    ctx.fillRect(0, s - 3, s, 3);
  }

  private static drawWood(ctx: CanvasRenderingContext2D, s: number, hasL: boolean, hasR: boolean) {
    // Wooden plank - fills from top (y=0) to bottom (y=s) flush with 40x40 collision grid
    const woodGrad = ctx.createLinearGradient(0, 0, 0, s);
    woodGrad.addColorStop(0, '#d97706');
    woodGrad.addColorStop(1, '#92400e');
    ctx.fillStyle = woodGrad;

    const r = 4;
    ctx.beginPath();
    ctx.roundRect(0, 0, s, s, [!hasL ? r : 0, !hasR ? r : 0, !hasR ? r : 0, !hasL ? r : 0]);
    ctx.fill();

    // Wood grain horizontal planks / lines
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, s * 0.33);
    ctx.lineTo(s, s * 0.33);
    ctx.moveTo(0, s * 0.67);
    ctx.lineTo(s, s * 0.67);
    ctx.stroke();

    // Plank studs / nails
    ctx.fillStyle = '#451a03';
    ctx.beginPath();
    ctx.arc(s * 0.2, s * 0.18, 2.2, 0, Math.PI * 2);
    ctx.arc(s * 0.8, s * 0.18, 2.2, 0, Math.PI * 2);
    ctx.arc(s * 0.2, s * 0.82, 2.2, 0, Math.PI * 2);
    ctx.arc(s * 0.8, s * 0.82, 2.2, 0, Math.PI * 2);
    ctx.fill();

    // Top highlight rim flush with top edge
    ctx.fillStyle = 'rgba(254, 243, 199, 0.45)';
    ctx.fillRect(hasL ? 0 : 2, 0, s - (hasL ? 0 : 2) - (hasR ? 0 : 2), 2.5);

    // Bottom shadow
    ctx.fillStyle = 'rgba(69, 26, 3, 0.4)';
    ctx.fillRect(0, s - 3, s, 3);
  }

  private static drawBrick(ctx: CanvasRenderingContext2D, s: number) {
    const brickGrad = ctx.createLinearGradient(0, 0, s, s);
    brickGrad.addColorStop(0, '#ea580c');
    brickGrad.addColorStop(1, '#9a3412');
    ctx.fillStyle = brickGrad;
    ctx.beginPath();
    ctx.roundRect(1, 1, s - 2, s - 2, 3);
    ctx.fill();

    // Brick grooves
    ctx.strokeStyle = '#431407';
    ctx.lineWidth = 2;
    ctx.strokeRect(2, 2, s - 4, s - 4);

    ctx.beginPath();
    ctx.moveTo(2, s * 0.5);
    ctx.lineTo(s - 2, s * 0.5);
    ctx.moveTo(s * 0.5, 2);
    ctx.lineTo(s * 0.5, s * 0.5);
    ctx.moveTo(s * 0.25, s * 0.5);
    ctx.lineTo(s * 0.25, s - 2);
    ctx.moveTo(s * 0.75, s * 0.5);
    ctx.lineTo(s * 0.75, s - 2);
    ctx.stroke();

    // Brick highlights
    ctx.fillStyle = 'rgba(255, 237, 213, 0.4)';
    ctx.fillRect(4, 4, s * 0.4, 2);
    ctx.fillRect(s * 0.55, 4, s * 0.4, 2);
  }

  private static drawIce(
    ctx: CanvasRenderingContext2D,
    s: number,
    hasL: boolean,
    hasR: boolean,
    animTime: number = 0
  ) {
    const iceGrad = ctx.createLinearGradient(0, 0, s, s);
    iceGrad.addColorStop(0, '#f0f9ff');
    iceGrad.addColorStop(0.3, '#bae6fd');
    iceGrad.addColorStop(0.7, '#38bdf8');
    iceGrad.addColorStop(1, '#0284c7');
    ctx.fillStyle = iceGrad;

    const r = 5;
    ctx.beginPath();
    ctx.roundRect(0, 0, s, s, [!hasL ? r : 0, !hasR ? r : 0, !hasR ? r : 0, !hasL ? r : 0]);
    ctx.fill();

    // Ice crystal facets / fractures
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(s * 0.15, s * 0.12);
    ctx.lineTo(s * 0.48, s * 0.55);
    ctx.lineTo(s * 0.82, s * 0.18);
    ctx.moveTo(s * 0.48, s * 0.55);
    ctx.lineTo(s * 0.52, s * 0.88);
    ctx.stroke();

    // Shimmer gleam (shimmers gently)
    const glint = 0.7 + Math.sin(animTime * 4) * 0.3;
    ctx.fillStyle = `rgba(255, 255, 255, ${glint})`;
    ctx.beginPath();
    ctx.arc(s * 0.25, s * 0.25, 2.5, 0, Math.PI * 2);
    ctx.arc(s * 0.75, s * 0.65, 2, 0, Math.PI * 2);
    ctx.fill();

    // Deep blue icy border
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 1.2;
    ctx.strokeRect(0.5, 0.5, s - 1, s - 1);

    // Gloss top
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.fillRect(hasL ? 0 : 2, 0, s - (hasL ? 0 : 2) - (hasR ? 0 : 2), 3);
  }

  private static drawCloud(ctx: CanvasRenderingContext2D, s: number, animTime: number) {
    const floatY = Math.sin(animTime * 2) * 1.5;
    ctx.translate(0, floatY);

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(s * 0.25, s * 0.55, s * 0.24, 0, Math.PI * 2);
    ctx.arc(s * 0.5, s * 0.4, s * 0.32, 0, Math.PI * 2);
    ctx.arc(s * 0.75, s * 0.55, s * 0.24, 0, Math.PI * 2);
    ctx.roundRect(s * 0.1, s * 0.5, s * 0.8, s * 0.35, 8);
    ctx.fill();

    // Cloud soft shading
    ctx.fillStyle = '#e2e8f0';
    ctx.beginPath();
    ctx.roundRect(s * 0.12, s * 0.65, s * 0.76, s * 0.18, 6);
    ctx.fill();
  }

  private static drawCloudPlatform(
    ctx: CanvasRenderingContext2D,
    s: number,
    animTime: number,
    hasL: boolean = false,
    hasR: boolean = false,
    _hasT: boolean = false,
    _hasB: boolean = false
  ) {
    // Cloud Platform: Soft, glowing, fluffy celestial cloud with seamless horizontal merging
    const floatBob = Math.sin(animTime * 3) * 1.5;
    ctx.translate(0, floatBob);

    // Soft celestial ambient glow under the cloud
    const glowGrad = ctx.createRadialGradient(s * 0.5, s * 0.6, s * 0.2, s * 0.5, s * 0.6, s * 0.65);
    glowGrad.addColorStop(0, 'rgba(56, 189, 248, 0.25)');
    glowGrad.addColorStop(1, 'rgba(56, 189, 248, 0)');
    ctx.fillStyle = glowGrad;
    ctx.fillRect(hasL ? -4 : 0, s * 0.2, s + (hasL ? 4 : 0) + (hasR ? 4 : 0), s * 0.8);

    // Base cloud body gradient
    const cloudGrad = ctx.createLinearGradient(0, 0, 0, s);
    cloudGrad.addColorStop(0, '#ffffff');
    cloudGrad.addColorStop(0.5, '#f0f9ff');
    cloudGrad.addColorStop(1, '#bae6fd');
    ctx.fillStyle = cloudGrad;

    const rL = !hasL ? 12 : 0;
    const rR = !hasR ? 12 : 0;
    ctx.beginPath();
    ctx.roundRect(0, s * 0.24, s, s * 0.66, [rL, rR, rR, rL]);
    ctx.fill();

    // Top cloud puffs / domes
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    if (!hasL) {
      // Left puff dome
      ctx.arc(s * 0.22, s * 0.32, s * 0.26, 0, Math.PI * 2);
    }
    // Center puff dome
    ctx.arc(s * 0.5, s * 0.22, s * 0.28, 0, Math.PI * 2);
    if (!hasR) {
      // Right puff dome
      ctx.arc(s * 0.78, s * 0.32, s * 0.26, 0, Math.PI * 2);
    }
    ctx.fill();

    // Bottom shadow layer for 3D depth
    ctx.fillStyle = 'rgba(125, 211, 252, 0.5)';
    ctx.beginPath();
    ctx.roundRect(hasL ? 0 : 4, s * 0.72, s - (hasL ? 0 : 4) - (hasR ? 0 : 4), s * 0.16, 6);
    ctx.fill();

    // Subtle sparkle star on unmerged or edge cloud
    if (!hasL || !hasR) {
      const sparkleAlpha = 0.5 + Math.sin(animTime * 5 + (!hasL ? 0 : 2)) * 0.4;
      ctx.fillStyle = `rgba(255, 255, 255, ${sparkleAlpha})`;
      const sx = !hasL ? s * 0.28 : s * 0.72;
      ctx.beginPath();
      ctx.arc(sx, s * 0.24, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private static drawMushroomPlatform(ctx: CanvasRenderingContext2D, s: number, hasL: boolean, hasR: boolean) {
    // Red mushroom cap with white dots
    const capGrad = ctx.createLinearGradient(0, 0, 0, s * 0.6);
    capGrad.addColorStop(0, '#ef4444');
    capGrad.addColorStop(1, '#b91c1c');
    ctx.fillStyle = capGrad;

    ctx.beginPath();
    ctx.roundRect(0, 0, s, s * 0.65, [!hasL ? 12 : 0, !hasR ? 12 : 0, 4, 4]);
    ctx.fill();

    // White mushroom dots
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    if (!hasL) ctx.arc(s * 0.25, s * 0.3, 4, 0, Math.PI * 2);
    ctx.arc(s * 0.5, s * 0.25, 4.5, 0, Math.PI * 2);
    if (!hasR) ctx.arc(s * 0.75, s * 0.3, 4, 0, Math.PI * 2);
    ctx.fill();

    // Stem underneath
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(s * 0.35, s * 0.65, s * 0.3, s * 0.35);
  }

  private static drawCandy(ctx: CanvasRenderingContext2D, s: number, hasL: boolean, hasR: boolean) {
    // Striped candy cake platform
    const candyGrad = ctx.createLinearGradient(0, 0, 0, s);
    candyGrad.addColorStop(0, '#f472b6');
    candyGrad.addColorStop(1, '#ec4899');
    ctx.fillStyle = candyGrad;

    ctx.beginPath();
    ctx.roundRect(0, 0, s, s, [!hasL ? 8 : 0, !hasR ? 8 : 0, 4, 4]);
    ctx.fill();

    // White whipped cream top
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.roundRect(0, 0, s, s * 0.35, [!hasL ? 8 : 0, !hasR ? 8 : 0, 6, 6]);
    ctx.fill();

    // Colorful candy sprinkles
    const sprinkles = [
      { x: 0.25, y: 0.15, c: '#38bdf8' },
      { x: 0.5, y: 0.22, c: '#fbbf24' },
      { x: 0.75, y: 0.15, c: '#a855f7' },
      { x: 0.4, y: 0.65, c: '#ffffff' },
      { x: 0.7, y: 0.75, c: '#fde047' },
    ];
    sprinkles.forEach((sp) => {
      ctx.fillStyle = sp.c;
      ctx.fillRect(s * sp.x - 2, s * sp.y - 1.5, 5, 3);
    });
  }

  private static drawCrystalBlock(ctx: CanvasRenderingContext2D, s: number, animTime: number) {
    const baseGrad = ctx.createLinearGradient(0, 0, s, s);
    baseGrad.addColorStop(0, '#3b0764');
    baseGrad.addColorStop(1, '#1e1b4b');
    ctx.fillStyle = baseGrad;
    ctx.fillRect(0, 0, s, s);

    // Glowing crystal veins
    const pulse = 0.6 + Math.sin(animTime * 3) * 0.4;
    ctx.strokeStyle = `rgba(168, 85, 247, ${pulse})`;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(s * 0.1, s * 0.9);
    ctx.lineTo(s * 0.4, s * 0.5);
    ctx.lineTo(s * 0.6, s * 0.8);
    ctx.lineTo(s * 0.9, s * 0.2);
    ctx.stroke();

    ctx.strokeStyle = `rgba(56, 189, 248, ${pulse})`;
    ctx.beginPath();
    ctx.moveTo(s * 0.2, s * 0.2);
    ctx.lineTo(s * 0.5, s * 0.4);
    ctx.lineTo(s * 0.8, s * 0.6);
    ctx.stroke();
  }

  private static drawPipe(
    ctx: CanvasRenderingContext2D,
    s: number,
    color: 'green' | 'red' = 'green',
    isThumbnail: boolean = false
  ) {
    const isRed = color === 'red';

    if (isThumbnail) {
      // Compact thumbnail representation for sidebar palette
      const pipeGrad = ctx.createLinearGradient(0, 0, s, 0);
      if (isRed) {
        pipeGrad.addColorStop(0, '#ef4444');
        pipeGrad.addColorStop(0.35, '#fca5a5');
        pipeGrad.addColorStop(0.7, '#dc2626');
        pipeGrad.addColorStop(1, '#7f1d1d');
      } else {
        pipeGrad.addColorStop(0, '#22c55e');
        pipeGrad.addColorStop(0.35, '#86efac');
        pipeGrad.addColorStop(0.7, '#16a34a');
        pipeGrad.addColorStop(1, '#14532d');
      }
      ctx.fillStyle = pipeGrad;

      // Rim top
      ctx.beginPath();
      ctx.roundRect(1, 1, s - 2, s * 0.38, 3);
      ctx.fill();
      ctx.strokeStyle = isRed ? '#450a0a' : '#052e16';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Body below
      ctx.beginPath();
      ctx.rect(s * 0.12, s * 0.38, s * 0.76, s * 0.62);
      ctx.fill();
      ctx.stroke();

      // Opening dark hole
      ctx.fillStyle = isRed ? '#450a0a' : '#052e16';
      ctx.beginPath();
      ctx.ellipse(s * 0.5, 4, s * 0.36, 2.5, 0, 0, Math.PI * 2);
      ctx.fill();
      return;
    }

    // Full 2x2 Mario Pipe (80x80px)
    const rimH = Math.round(s * 0.35); // ~28px
    const bodyW = Math.round(s * 0.88); // ~70px
    const bodyX = Math.round((s - bodyW) * 0.5); // ~5px
    const bodyH = s - rimH; // ~52px

    // Main Pipe Colors & Shading
    const darkEdge = isRed ? '#450a0a' : '#052e16';
    const darkShadow = isRed ? '#7f1d1d' : '#14532d';
    const baseColor = isRed ? '#dc2626' : '#16a34a';
    const highlightColor = isRed ? '#fca5a5' : '#86efac';
    const brightSpecular = '#ffffff';

    // 1. Pipe Body (Bottom stem)
    const bodyGrad = ctx.createLinearGradient(bodyX, 0, bodyX + bodyW, 0);
    bodyGrad.addColorStop(0, darkShadow);
    bodyGrad.addColorStop(0.08, baseColor);
    bodyGrad.addColorStop(0.24, highlightColor);
    bodyGrad.addColorStop(0.36, brightSpecular);
    bodyGrad.addColorStop(0.48, highlightColor);
    bodyGrad.addColorStop(0.72, baseColor);
    bodyGrad.addColorStop(1, darkShadow);

    ctx.fillStyle = bodyGrad;
    ctx.fillRect(bodyX, rimH, bodyW, bodyH);

    // Body outline
    ctx.strokeStyle = darkEdge;
    ctx.lineWidth = 3;
    ctx.strokeRect(bodyX, rimH, bodyW, bodyH);

    // Subtle vertical panel lines for high-quality arcade feel
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(bodyX + bodyW * 0.16, rimH);
    ctx.lineTo(bodyX + bodyW * 0.16, s);
    ctx.moveTo(bodyX + bodyW * 0.84, rimH);
    ctx.lineTo(bodyX + bodyW * 0.84, s);
    ctx.stroke();

    // 2. Pipe Rim / Collar (Top portion - 80px wide)
    const rimGrad = ctx.createLinearGradient(0, 0, s, 0);
    rimGrad.addColorStop(0, darkShadow);
    rimGrad.addColorStop(0.08, baseColor);
    rimGrad.addColorStop(0.24, highlightColor);
    rimGrad.addColorStop(0.36, brightSpecular);
    rimGrad.addColorStop(0.48, highlightColor);
    rimGrad.addColorStop(0.72, baseColor);
    rimGrad.addColorStop(1, darkShadow);

    ctx.fillStyle = rimGrad;
    ctx.beginPath();
    ctx.roundRect(1, 1, s - 2, rimH, 4);
    ctx.fill();

    ctx.strokeStyle = darkEdge;
    ctx.lineWidth = 3;
    ctx.stroke();

    // Rim bottom lip drop shadow onto body
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.fillRect(bodyX, rimH, bodyW, 4);

    // 3. Pipe Top Opening (Dark deep portal entrance with swirl)
    ctx.fillStyle = darkEdge;
    ctx.beginPath();
    ctx.ellipse(s * 0.5, 6, s * 0.42, 4.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Inner glowing portal indicator
    const portalGlow = isRed ? 'rgba(254, 202, 202, 0.85)' : 'rgba(187, 247, 208, 0.85)';
    ctx.fillStyle = portalGlow;
    ctx.beginPath();
    ctx.ellipse(s * 0.5, 6, s * 0.22, 2.2, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  private static drawHeart(ctx: CanvasRenderingContext2D, s: number, animTime: number) {
    const floatY = Math.sin(animTime * 4) * 2.5;
    const pulse = 1 + Math.sin(animTime * 6) * 0.08;

    ctx.translate(s * 0.5, s * 0.5 + floatY);
    ctx.scale(pulse, pulse);

    // Soft heart aura glow
    ctx.fillStyle = 'rgba(244, 63, 94, 0.28)';
    ctx.beginPath();
    ctx.arc(0, 0, s * 0.46, 0, Math.PI * 2);
    ctx.fill();

    // Heart shape using bezier curves
    const heartGrad = ctx.createLinearGradient(0, -s * 0.35, 0, s * 0.35);
    heartGrad.addColorStop(0, '#fb7185');
    heartGrad.addColorStop(0.5, '#f43f5e');
    heartGrad.addColorStop(1, '#be123c');
    ctx.fillStyle = heartGrad;

    const w = s * 0.72;
    const h = s * 0.72;

    ctx.beginPath();
    ctx.moveTo(0, h * 0.32);
    // Left lobe
    ctx.bezierCurveTo(-w * 0.55, h * 0.1, -w * 0.55, -h * 0.35, -w * 0.25, -h * 0.42);
    ctx.bezierCurveTo(-w * 0.08, -h * 0.44, 0, -h * 0.28, 0, -h * 0.18);
    // Right lobe
    ctx.bezierCurveTo(0, -h * 0.28, w * 0.08, -h * 0.44, w * 0.25, -h * 0.42);
    ctx.bezierCurveTo(w * 0.55, -h * 0.35, w * 0.55, h * 0.1, 0, h * 0.32);
    ctx.closePath();
    ctx.fill();

    // Gloss / Shine highlight on top-left lobe
    ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
    ctx.beginPath();
    ctx.ellipse(-w * 0.2, -h * 0.25, 4.5, 2.8, -0.6, 0, Math.PI * 2);
    ctx.fill();

    // Sparkle star near top right
    const sparkleA = 0.5 + Math.sin(animTime * 8) * 0.5;
    ctx.fillStyle = `rgba(255, 255, 255, ${sparkleA})`;
    ctx.beginPath();
    ctx.arc(w * 0.22, -h * 0.25, 1.8, 0, Math.PI * 2);
    ctx.fill();
  }

  // --- Interactive Items ---

  private static drawCoin(ctx: CanvasRenderingContext2D, s: number, animTime: number) {
    const floatY = Math.sin(animTime * 4) * 2;
    const spinScale = Math.cos(animTime * 5); // spinning on vertical axis

    ctx.translate(s * 0.5, s * 0.5 + floatY);
    ctx.scale(Math.abs(spinScale) < 0.1 ? 0.1 : spinScale, 1);

    // Outer coin rim
    ctx.fillStyle = '#eab308';
    ctx.beginPath();
    ctx.ellipse(0, 0, s * 0.35, s * 0.35, 0, 0, Math.PI * 2);
    ctx.fill();

    // Inner gold face
    ctx.fillStyle = '#fde047';
    ctx.beginPath();
    ctx.ellipse(0, 0, s * 0.26, s * 0.26, 0, 0, Math.PI * 2);
    ctx.fill();

    // Center star / diamond
    ctx.fillStyle = '#ca8a04';
    ctx.fillRect(-2, -5, 4, 10);
    ctx.fillRect(-5, -2, 10, 4);

    // Sparkle dot
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(-s * 0.15, -s * 0.15, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }

  private static drawStar(ctx: CanvasRenderingContext2D, s: number, animTime: number) {
    const rot = animTime * 2;
    const floatY = Math.sin(animTime * 3) * 2.5;

    ctx.translate(s * 0.5, s * 0.5 + floatY);
    ctx.rotate(rot);

    // Glow aura
    ctx.fillStyle = 'rgba(250, 204, 21, 0.3)';
    ctx.beginPath();
    ctx.arc(0, 0, s * 0.45, 0, Math.PI * 2);
    ctx.fill();

    // 5-point star
    ctx.fillStyle = '#facc15';
    ctx.strokeStyle = '#ca8a04';
    ctx.lineWidth = 1.5;

    ctx.beginPath();
    const spikes = 5;
    const outer = s * 0.38;
    const inner = s * 0.18;
    let angle = -Math.PI / 2;
    const step = Math.PI / spikes;

    for (let i = 0; i < spikes; i++) {
      ctx.lineTo(Math.cos(angle) * outer, Math.sin(angle) * outer);
      angle += step;
      ctx.lineTo(Math.cos(angle) * inner, Math.sin(angle) * inner);
      angle += step;
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Cute face on star
    ctx.fillStyle = '#451a03';
    ctx.fillRect(-4, -2, 2, 4);
    ctx.fillRect(2, -2, 2, 4);
  }

  private static drawCrystal(ctx: CanvasRenderingContext2D, s: number, animTime: number) {
    const floatY = Math.sin(animTime * 3.5) * 2;
    ctx.translate(s * 0.5, s * 0.5 + floatY);

    // Diamond gem polygon
    const gemGrad = ctx.createLinearGradient(0, -s * 0.4, 0, s * 0.4);
    gemGrad.addColorStop(0, '#c084fc');
    gemGrad.addColorStop(0.5, '#a855f7');
    gemGrad.addColorStop(1, '#6b21a8');
    ctx.fillStyle = gemGrad;

    ctx.beginPath();
    ctx.moveTo(0, -s * 0.38);
    ctx.lineTo(s * 0.32, -s * 0.05);
    ctx.lineTo(0, s * 0.38);
    ctx.lineTo(-s * 0.32, -s * 0.05);
    ctx.closePath();
    ctx.fill();

    // Facet lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Facet highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.beginPath();
    ctx.moveTo(0, -s * 0.38);
    ctx.lineTo(s * 0.32, -s * 0.05);
    ctx.lineTo(0, 0);
    ctx.closePath();
    ctx.fill();
  }

  private static drawQuestionBlock(
    ctx: CanvasRenderingContext2D,
    s: number,
    animTime: number,
    isSpent: boolean = false
  ) {
    // Slightly increase visual scale (~10% larger) centered
    ctx.save();
    ctx.translate(s * 0.5, s * 0.5);
    ctx.scale(1.1, 1.1);
    ctx.translate(-s * 0.5, -s * 0.5);

    if (isSpent) {
      // Empty/spent metal block
      ctx.fillStyle = '#64748b';
      ctx.beginPath();
      ctx.roundRect(1, 1, s - 2, s - 2, 4);
      ctx.fill();

      ctx.fillStyle = '#475569';
      ctx.fillRect(s * 0.18, s * 0.18, s * 0.64, s * 0.64);

      // Rivets
      ctx.fillStyle = '#334155';
      ctx.beginPath();
      ctx.arc(5, 5, 2, 0, Math.PI * 2);
      ctx.arc(s - 5, 5, 2, 0, Math.PI * 2);
      ctx.arc(5, s - 5, 2, 0, Math.PI * 2);
      ctx.arc(s - 5, s - 5, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      return;
    }

    // Active Golden Question Block - vibrant, prominent, and arcade-authentic
    const pulse = Math.sin(animTime * 4) * 0.05;
    const blockGrad = ctx.createLinearGradient(0, 0, s, s);
    blockGrad.addColorStop(0, '#fde047');
    blockGrad.addColorStop(0.3, '#facc15');
    blockGrad.addColorStop(1, '#b45309');
    ctx.fillStyle = blockGrad;

    ctx.beginPath();
    ctx.roundRect(1, 1, s - 2, s - 2, 5);
    ctx.fill();

    // 3D Inner Bevel & Rivets
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 2.2;
    ctx.strokeRect(2.5, 2.5, s - 5, s - 5);

    // Top highlight rim
    ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.fillRect(2.5, 2.5, s - 5, 2.5);

    // Rivets
    ctx.fillStyle = '#78350f';
    ctx.beginPath();
    ctx.arc(5.5, 5.5, 2, 0, Math.PI * 2);
    ctx.arc(s - 5.5, 5.5, 2, 0, Math.PI * 2);
    ctx.arc(5.5, s - 5.5, 2, 0, Math.PI * 2);
    ctx.arc(s - 5.5, s - 5.5, 2, 0, Math.PI * 2);
    ctx.fill();

    // Bouncing ? mark (bold, enlarged, crisp)
    ctx.save();
    ctx.translate(s * 0.5, s * 0.5 + pulse * 18);
    ctx.font = 'bold 24px Fredoka, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Shadow
    ctx.fillStyle = '#78350f';
    ctx.fillText('?', 1.5, 2);
    // White text
    ctx.fillStyle = '#ffffff';
    ctx.fillText('?', 0, 0);
    ctx.restore();

    ctx.restore();
  }

  private static drawSpring(ctx: CanvasRenderingContext2D, s: number, animTime: number) {
    // Base plate
    ctx.fillStyle = '#475569';
    ctx.fillRect(s * 0.2, s * 0.8, s * 0.6, s * 0.15);

    // Coiled red spring
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 3.5;
    ctx.lineCap = 'round';

    const compress = Math.sin(animTime * 6) * 2;
    ctx.beginPath();
    ctx.moveTo(s * 0.35, s * 0.8);
    ctx.lineTo(s * 0.65, s * 0.65 + compress * 0.5);
    ctx.lineTo(s * 0.35, s * 0.5 + compress);
    ctx.lineTo(s * 0.65, s * 0.35 + compress * 1.5);
    ctx.lineTo(s * 0.5, s * 0.25 + compress * 2);
    ctx.stroke();

    // Top bouncy pad
    ctx.fillStyle = '#f87171';
    ctx.beginPath();
    ctx.roundRect(s * 0.15, s * 0.18 + compress * 2, s * 0.7, s * 0.12, 3);
    ctx.fill();
  }

  private static drawSpikes(ctx: CanvasRenderingContext2D, s: number) {
    // Row of 3 sharp metal spikes
    ctx.fillStyle = '#94a3b8';
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1.5;

    const count = 3;
    const w = s / count;

    for (let i = 0; i < count; i++) {
      ctx.beginPath();
      ctx.moveTo(i * w, s);
      ctx.lineTo(i * w + w * 0.5, s * 0.25);
      ctx.lineTo((i + 1) * w, s);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Sharp tip glint
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(i * w + w * 0.5, s * 0.3, 1.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#94a3b8';
    }
  }

  private static drawCheckpoint(ctx: CanvasRenderingContext2D, s: number, isActive: boolean) {
    // Pole
    ctx.fillStyle = '#64748b';
    ctx.fillRect(s * 0.3, s * 0.1, 4, s * 0.9);

    // Top gold sphere
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.arc(s * 0.3 + 2, s * 0.1, 4, 0, Math.PI * 2);
    ctx.fill();

    // Flag banner
    ctx.fillStyle = isActive ? '#22c55e' : '#cbd5e1';
    ctx.beginPath();
    ctx.moveTo(s * 0.3 + 4, s * 0.15);
    ctx.lineTo(s * 0.85, s * 0.3);
    ctx.lineTo(s * 0.3 + 4, s * 0.45);
    ctx.closePath();
    ctx.fill();

    // Check symbol on flag if active
    if (isActive) {
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(s * 0.42, s * 0.3);
      ctx.lineTo(s * 0.5, s * 0.36);
      ctx.lineTo(s * 0.65, s * 0.22);
      ctx.stroke();
    }
  }

  private static drawGoalGate(ctx: CanvasRenderingContext2D, s: number, animTime: number) {
    // Castle Gate / Grand Flagpole
    // Tall golden pole
    const goldGrad = ctx.createLinearGradient(0, 0, 4, 0);
    goldGrad.addColorStop(0, '#fef08a');
    goldGrad.addColorStop(1, '#ca8a04');
    ctx.fillStyle = goldGrad;
    ctx.fillRect(s * 0.35, 0, 5, s);

    // Big golden star / crown on top
    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.arc(s * 0.35 + 2.5, 4, 6, 0, Math.PI * 2);
    ctx.fill();

    // Waving Royal Red Flag
    const wave = Math.sin(animTime * 6) * 3;
    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.moveTo(s * 0.35 + 5, 6);
    ctx.quadraticCurveTo(s * 0.65, 12 + wave, s * 0.95, 18);
    ctx.lineTo(s * 0.95, 34);
    ctx.quadraticCurveTo(s * 0.65, 28 + wave, s * 0.35 + 5, 34);
    ctx.closePath();
    ctx.fill();

    // Star icon inside flag
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(s * 0.6, 20 + wave * 0.5, 3.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // --- Enemies (4 distinct types) ---

  private static drawEnemySlime(ctx: CanvasRenderingContext2D, s: number, animTime: number) {
    const floatY = Math.sin(animTime * 5) * 4;
    const squish = Math.cos(animTime * 5) * 0.1;

    ctx.translate(s * 0.5, s * 0.5 + floatY);
    ctx.scale(1 + squish, 1 - squish);

    // Purple slime bubble
    const slimeGrad = ctx.createRadialGradient(0, -4, 2, 0, 0, s * 0.4);
    slimeGrad.addColorStop(0, '#c084fc');
    slimeGrad.addColorStop(0.7, '#9333ea');
    slimeGrad.addColorStop(1, '#581c87');
    ctx.fillStyle = slimeGrad;

    ctx.beginPath();
    ctx.arc(0, 0, s * 0.34, 0, Math.PI * 2);
    ctx.fill();

    // Bat wings on sides
    ctx.fillStyle = '#7e22ce';
    ctx.beginPath();
    // Left wing
    ctx.moveTo(-s * 0.25, 0);
    ctx.quadraticCurveTo(-s * 0.55, -s * 0.3, -s * 0.45, s * 0.1);
    ctx.fill();
    // Right wing
    ctx.moveTo(s * 0.25, 0);
    ctx.quadraticCurveTo(s * 0.55, -s * 0.3, s * 0.45, s * 0.1);
    ctx.fill();

    // Cute big eyes
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(-6, -2, 3.5, 0, Math.PI * 2);
    ctx.arc(6, -2, 3.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(-5, -2, 2, 0, Math.PI * 2);
    ctx.arc(7, -2, 2, 0, Math.PI * 2);
    ctx.fill();
  }

  // --- Chaser Wolf/Beast: Red/Black predator that runs after the player ---
  private static drawEnemyChaser(ctx: CanvasRenderingContext2D, s: number, animTime: number) {
    const runBob = Math.sin(animTime * 16) * 2;
    const legSwing = Math.cos(animTime * 16) * 5;

    ctx.translate(s * 0.5, s * 0.5 + runBob);

    // Legs
    ctx.fillStyle = '#7f1d1d';
    ctx.fillRect(-s * 0.22 + legSwing, s * 0.2, 5, s * 0.22);
    ctx.fillRect(s * 0.12 - legSwing, s * 0.2, 5, s * 0.22);

    // Dark crimson fur body
    const bodyGrad = ctx.createLinearGradient(0, -s * 0.35, 0, s * 0.3);
    bodyGrad.addColorStop(0, '#dc2626');
    bodyGrad.addColorStop(1, '#991b1b');
    ctx.fillStyle = bodyGrad;

    ctx.beginPath();
    ctx.roundRect(-s * 0.36, -s * 0.32, s * 0.72, s * 0.55, [10, 10, 4, 4]);
    ctx.fill();

    // Sharp predator ears
    ctx.fillStyle = '#991b1b';
    ctx.beginPath();
    ctx.moveTo(-s * 0.3, -s * 0.3);
    ctx.lineTo(-s * 0.36, -s * 0.55);
    ctx.lineTo(-s * 0.15, -s * 0.3);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(s * 0.15, -s * 0.3);
    ctx.lineTo(s * 0.36, -s * 0.55);
    ctx.lineTo(s * 0.3, -s * 0.3);
    ctx.closePath();
    ctx.fill();

    // Snout
    ctx.fillStyle = '#450a0a';
    ctx.beginPath();
    ctx.arc(s * 0.2, s * 0.05, 5, 0, Math.PI * 2);
    ctx.fill();

    // Glowing alert yellow/orange eyes
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.ellipse(-s * 0.12, -s * 0.08, 4, 3, -0.2, 0, Math.PI * 2);
    ctx.ellipse(s * 0.1, -s * 0.08, 4, 3, -0.2, 0, Math.PI * 2);
    ctx.fill();

    // Red slit pupils
    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.arc(-s * 0.1, -s * 0.08, 1.8, 0, Math.PI * 2);
    ctx.arc(s * 0.12, -s * 0.08, 1.8, 0, Math.PI * 2);
    ctx.fill();
  }

  // --- Territory Patrol Guard: Helmet & shield defender ---
  private static drawEnemyPatrol(ctx: CanvasRenderingContext2D, s: number, animTime: number) {
    const walkBob = Math.sin(animTime * 8) * 1.5;
    ctx.translate(s * 0.5, s * 0.5 + walkBob);

    // Boots
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(-s * 0.22, s * 0.24, 6, s * 0.18);
    ctx.fillRect(s * 0.1, s * 0.24, 6, s * 0.18);

    // Blue armor plate
    const armorGrad = ctx.createLinearGradient(0, -s * 0.2, 0, s * 0.25);
    armorGrad.addColorStop(0, '#2563eb');
    armorGrad.addColorStop(1, '#1e40af');
    ctx.fillStyle = armorGrad;

    ctx.beginPath();
    ctx.roundRect(-s * 0.3, -s * 0.15, s * 0.6, s * 0.45, 6);
    ctx.fill();

    // Golden emblem crest
    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.arc(0, s * 0.08, 4, 0, Math.PI * 2);
    ctx.fill();

    // Knight/Guard Helmet
    const helmGrad = ctx.createLinearGradient(0, -s * 0.5, 0, -s * 0.15);
    helmGrad.addColorStop(0, '#94a3b8');
    helmGrad.addColorStop(1, '#475569');
    ctx.fillStyle = helmGrad;

    ctx.beginPath();
    ctx.arc(0, -s * 0.25, s * 0.26, Math.PI, 0, false);
    ctx.lineTo(s * 0.26, -s * 0.12);
    ctx.lineTo(-s * 0.26, -s * 0.12);
    ctx.closePath();
    ctx.fill();

    // Helmet visor slit
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-s * 0.18, -s * 0.26, s * 0.36, 4);

    // Red eye glow through visor
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(-s * 0.08, -s * 0.26, 4, 3);
    ctx.fillRect(s * 0.02, -s * 0.26, 4, 3);
  }

  // --- Jumper Frog / Toad: Green hopper ---
  private static drawEnemyJumper(ctx: CanvasRenderingContext2D, s: number, animTime: number) {
    const breathe = Math.sin(animTime * 6) * 1.5;
    ctx.translate(s * 0.5, s * 0.5);

    // Coiled hind legs
    ctx.fillStyle = '#15803d';
    ctx.beginPath();
    ctx.ellipse(-s * 0.3, s * 0.25, 7, 5, -0.4, 0, Math.PI * 2);
    ctx.ellipse(s * 0.3, s * 0.25, 7, 5, 0.4, 0, Math.PI * 2);
    ctx.fill();

    // Vibrant green frog body
    const frogGrad = ctx.createLinearGradient(0, -s * 0.3, 0, s * 0.3);
    frogGrad.addColorStop(0, '#22c55e');
    frogGrad.addColorStop(1, '#16a34a');
    ctx.fillStyle = frogGrad;

    ctx.beginPath();
    ctx.roundRect(-s * 0.32, -s * 0.25 + breathe * 0.5, s * 0.64, s * 0.55 - breathe * 0.5, [12, 12, 8, 8]);
    ctx.fill();

    // Yellow belly
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.ellipse(0, s * 0.1, s * 0.18, s * 0.14, 0, 0, Math.PI * 2);
    ctx.fill();

    // Big bulging frog eyes
    ctx.fillStyle = '#15803d';
    ctx.beginPath();
    ctx.arc(-s * 0.18, -s * 0.3, 6, 0, Math.PI * 2);
    ctx.arc(s * 0.18, -s * 0.3, 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.arc(-s * 0.18, -s * 0.3, 4.5, 0, Math.PI * 2);
    ctx.arc(s * 0.18, -s * 0.3, 4.5, 0, Math.PI * 2);
    ctx.fill();

    // Black pupils
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-s * 0.22, -s * 0.32, 6, 3);
    ctx.fillRect(s * 0.14, -s * 0.32, 6, 3);
  }

  private static drawSpawnMarker(ctx: CanvasRenderingContext2D, s: number, animTime: number) {
    const pulse = Math.sin(animTime * 5) * 0.2 + 0.8;
    ctx.strokeStyle = `rgba(59, 130, 246, ${pulse})`;
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.strokeRect(2, 2, s - 4, s - 4);
    ctx.setLineDash([]);

    ctx.fillStyle = 'rgba(59, 130, 246, 0.25)';
    ctx.fillRect(2, 2, s - 4, s - 4);

    // "START" banner
    ctx.fillStyle = '#2563eb';
    ctx.font = 'bold 10px Fredoka, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('СТАРТ', s * 0.5, s * 0.5);
  }

  // --- Hero Character Rendering ---

  public static drawHero(
    ctx: CanvasRenderingContext2D,
    heroId: HeroId,
    x: number,
    y: number,
    width: number,
    height: number,
    state: {
      isWalking: boolean;
      isInAir: boolean;
      facingRight: boolean;
      animTime: number;
      isHurt?: boolean;
      isSliding?: boolean;
      vx?: number;
      vy?: number;
      jumpTime?: number;
    }
  ) {
    const isThumbnail = width <= 48 && height <= 48;

    // Animation State Machine:
    // - If vy < 0 (moving up) -> Play hero_jump.png (frames 0-1 at 6 FPS, do not loop, hold last frame)
    // - If vy > 0 (moving down) -> Draw hero_fall.png (frame 0, static)
    // - If on ground & moving -> Play hero_run.png (frames 0 to 5)
    // - If on ground & standing still -> Play hero_idle.png (frames 0 to 2 at 3 FPS)
    const vx = state.vx !== undefined ? state.vx : (state.isWalking ? 1 : 0);
    const vy = state.vy !== undefined ? state.vy : (state.isInAir ? 1 : 0);
    const inAir = state.isInAir || Math.abs(vy) > 0.05;
    const isMoving = Math.abs(vx) > 0.05 || state.isWalking;

    let spriteImg: HTMLImageElement | null = null;
    let frameIndex = 0;
    let frameWidth = 64;
    let sourceHeight = 96;

    if (inAir) {
      if (vy < 0) {
        // Jumping up (vy < 0) -> Play hero_jump.png (frames 0-1 at 6 FPS, do not loop, hold last frame)
        spriteImg = heroJumpImg;
        sourceHeight = 96;
        frameWidth = heroJumpImg && heroJumpImg.naturalWidth > 0 ? (heroJumpImg.naturalWidth / 2) : 64;
        const jumpTime = state.jumpTime !== undefined ? state.jumpTime : state.animTime;
        frameIndex = Math.min(1, Math.max(0, Math.floor(jumpTime * 6)));
      } else {
        // Moving down (vy > 0 or apex descent) -> Draw hero_fall.png (frame 0, static)
        spriteImg = heroFallImg;
        sourceHeight = 96;
        frameWidth = 64;
        frameIndex = 0;
      }
    } else if (isMoving) {
      // Moving state: hero_run.png (6 frames)
      spriteImg = heroRunImg;
      sourceHeight = 96;
      frameWidth = 64;
      frameIndex = Math.floor(state.animTime * 10) % 6;
    } else {
      // Standing still (vx === 0 and vy === 0): hero_idle.png (3 frames at 3 FPS)
      spriteImg = heroIdleImg;
      sourceHeight = 96;
      frameWidth = 64;
      frameIndex = Math.floor(state.animTime * 3) % 3;
    }

    ctx.save();

    // Alignment: Keep the bottom-center alignment exactly as before
    // (bottom of the 64x96 frame matches the bottom of the 24x80 hitbox, sitting flush with the top of the collision grid)
    if (isThumbnail) {
      const scale = Math.min(width / 64, height / 96);
      ctx.translate(x + width * 0.5, y + height);
      ctx.scale(scale, scale);
    } else {
      ctx.translate(x + width * 0.5, y + height);
    }

    if (!state.facingRight) {
      ctx.scale(-1, 1);
    }

    if (state.isHurt) {
      ctx.globalAlpha = Math.sin(state.animTime * 25) > 0 ? 0.3 : 0.8;
    }

    // Visual effect: Translucent ice trail and frost sparks under feet when sliding
    if (state.isSliding) {
      ctx.save();
      const trailGrad = ctx.createLinearGradient(-32, 0, 0, 0);
      trailGrad.addColorStop(0, 'rgba(186, 230, 253, 0)');
      trailGrad.addColorStop(0.7, 'rgba(125, 211, 252, 0.45)');
      trailGrad.addColorStop(1, 'rgba(255, 255, 255, 0.7)');
      ctx.fillStyle = trailGrad;
      ctx.beginPath();
      ctx.ellipse(-16, -2, 22, 4, 0, 0, Math.PI * 2);
      ctx.fill();

      // Shiny frost sparks
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.fillRect(-22, -4, 2.5, 2.5);
      ctx.fillRect(-30, -1, 2, 2);
      ctx.fillRect(-12, 1, 2, 2);
      ctx.restore();
    }

    const dw = 64;
    const dh = 96;

    if (spriteImg && spriteImg.complete && spriteImg.naturalWidth > 0) {
      const sx = frameIndex * frameWidth;
      const sy = 0;
      ctx.drawImage(spriteImg, sx, sy, frameWidth, sourceHeight, -dw * 0.5, -dh, dw, dh);
    } else {
      // Fallback vector rendering while image is loading or if legacy hero requested
      const s = Math.round(height * 0.94);
      const footOffset = s * 0.495;
      ctx.translate(0, -footOffset);
      const slimScaleX = 0.58;
      ctx.scale(slimScaleX, 1);
      const legSwing = state.isWalking && !inAir ? Math.cos(state.animTime * 14) * 6 : 0;

      switch (heroId) {
        case 'leo':
        default:
          this.renderLeo(ctx, s, legSwing, inAir);
          break;
        case 'bolt':
          this.renderBolt(ctx, s, legSwing, inAir, state.animTime);
          break;
        case 'pippin':
          this.renderPippin(ctx, s, legSwing, inAir, state.animTime);
          break;
        case 'astro':
          this.renderAstro(ctx, s, legSwing, inAir, state.animTime);
          break;
      }
    }

    ctx.restore();
  }

  // Leo - Explorer
  private static renderLeo(ctx: CanvasRenderingContext2D, s: number, legSwing: number, inAir: boolean) {
    // Legs
    ctx.fillStyle = '#1e3a8a'; // blue trousers
    ctx.fillRect(-s * 0.22 + (inAir ? -2 : legSwing), s * 0.15, s * 0.18, s * 0.3);
    ctx.fillRect(s * 0.05 - (inAir ? -2 : legSwing), s * 0.15, s * 0.18, s * 0.3);

    // Boots
    ctx.fillStyle = '#78350f';
    ctx.beginPath();
    ctx.roundRect(-s * 0.26 + (inAir ? -2 : legSwing), s * 0.35, s * 0.22, s * 0.15, 3);
    ctx.roundRect(s * 0.03 - (inAir ? -2 : legSwing), s * 0.35, s * 0.22, s * 0.15, 3);
    ctx.fill();

    // Body / Red Jacket
    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.roundRect(-s * 0.28, -s * 0.2, s * 0.56, s * 0.38, 4);
    ctx.fill();

    // Satchel strap
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-s * 0.2, -s * 0.18);
    ctx.lineTo(s * 0.22, s * 0.15);
    ctx.stroke();

    // Red Scarf
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.roundRect(-s * 0.26, -s * 0.22, s * 0.52, s * 0.12, 3);
    ctx.fill();

    // Head
    ctx.fillStyle = '#fcd34d'; // skin tone
    ctx.beginPath();
    ctx.arc(0, -s * 0.3, s * 0.22, 0, Math.PI * 2);
    ctx.fill();

    // Explorer hat
    ctx.fillStyle = '#d97706';
    ctx.beginPath();
    // Hat brim
    ctx.roundRect(-s * 0.38, -s * 0.42, s * 0.76, s * 0.09, 3);
    // Hat crown
    ctx.roundRect(-s * 0.24, -s * 0.56, s * 0.48, s * 0.16, [6, 6, 0, 0]);
    ctx.fill();

    // Hat band
    ctx.fillStyle = '#78350f';
    ctx.fillRect(-s * 0.24, -s * 0.42, s * 0.48, Math.max(3, s * 0.05));

    // Cheerful eyes & smile
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.arc(s * 0.06, -s * 0.3, Math.max(2.2, s * 0.045), 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#b45309';
    ctx.lineWidth = Math.max(1.5, s * 0.035);
    ctx.beginPath();
    ctx.arc(s * 0.06, -s * 0.25, Math.max(3, s * 0.065), 0, Math.PI);
    ctx.stroke();
  }

  // Bolt - Friendly Robot
  private static renderBolt(
    ctx: CanvasRenderingContext2D,
    s: number,
    legSwing: number,
    inAir: boolean,
    animTime: number
  ) {
    // Metal legs & foot pads
    ctx.fillStyle = '#475569';
    ctx.fillRect(-s * 0.2 + (inAir ? 0 : legSwing), s * 0.18, s * 0.14, s * 0.26);
    ctx.fillRect(s * 0.06 - (inAir ? 0 : legSwing), s * 0.18, s * 0.14, s * 0.26);

    ctx.fillStyle = '#334155';
    ctx.beginPath();
    ctx.roundRect(-s * 0.24 + (inAir ? 0 : legSwing), s * 0.38, s * 0.20, s * 0.11, 2);
    ctx.roundRect(s * 0.04 - (inAir ? 0 : legSwing), s * 0.38, s * 0.20, s * 0.11, 2);
    ctx.fill();

    // Jet thruster flames if in air!
    if (inAir) {
      const flame = Math.sin(animTime * 30) * 4 + s * 0.12;
      ctx.fillStyle = '#f97316';
      ctx.beginPath();
      ctx.moveTo(-s * 0.22, s * 0.44);
      ctx.lineTo(-s * 0.13, s * 0.44 + flame);
      ctx.lineTo(-s * 0.04, s * 0.44);
      ctx.moveTo(s * 0.04, s * 0.44);
      ctx.lineTo(s * 0.13, s * 0.44 + flame);
      ctx.lineTo(s * 0.22, s * 0.44);
      ctx.fill();
    }

    // Blue Robot Torso
    const roboGrad = ctx.createLinearGradient(0, -s * 0.2, 0, s * 0.2);
    roboGrad.addColorStop(0, '#38bdf8');
    roboGrad.addColorStop(1, '#0284c7');
    ctx.fillStyle = roboGrad;

    ctx.beginPath();
    ctx.roundRect(-s * 0.28, -s * 0.2, s * 0.56, s * 0.38, 5);
    ctx.fill();

    // Chest gauge / heart
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.arc(0, -s * 0.02, Math.max(5, s * 0.09), 0, Math.PI * 2);
    ctx.fill();

    // Robot Head
    ctx.fillStyle = '#0284c7';
    ctx.beginPath();
    ctx.roundRect(-s * 0.26, -s * 0.46, s * 0.52, s * 0.25, 4);
    ctx.fill();

    // Antenna on top
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = Math.max(2, s * 0.04);
    ctx.beginPath();
    ctx.moveTo(0, -s * 0.46);
    ctx.lineTo(0, -s * 0.56);
    ctx.stroke();

    // Glowing antenna bulb
    ctx.fillStyle = '#22c55e';
    ctx.beginPath();
    ctx.arc(0, -s * 0.58, Math.max(3.5, s * 0.065), 0, Math.PI * 2);
    ctx.fill();

    // Glowing Visor / Eyes
    ctx.fillStyle = '#22d3ee';
    ctx.fillRect(-s * 0.16, -s * 0.4, s * 0.35, s * 0.1);
  }

  // Pippin - Whimsical Fox/Bunny
  private static renderPippin(
    ctx: CanvasRenderingContext2D,
    s: number,
    legSwing: number,
    inAir: boolean,
    animTime: number
  ) {
    // Fluffy tail
    const tailWag = Math.sin(animTime * 12) * (s * 0.08);
    ctx.fillStyle = '#ea580c';
    ctx.beginPath();
    ctx.ellipse(-s * 0.35, 0 + tailWag, s * 0.2, s * 0.12, -0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(-s * 0.45, -2 + tailWag, Math.max(5, s * 0.09), 0, Math.PI * 2);
    ctx.fill();

    // Paws & pads
    ctx.fillStyle = '#c2410c';
    ctx.fillRect(-s * 0.2 + (inAir ? -2 : legSwing), s * 0.18, s * 0.14, s * 0.26);
    ctx.fillRect(s * 0.06 - (inAir ? -2 : legSwing), s * 0.18, s * 0.14, s * 0.26);

    ctx.fillStyle = '#9a3412';
    ctx.beginPath();
    ctx.roundRect(-s * 0.23 + (inAir ? -2 : legSwing), s * 0.38, s * 0.19, s * 0.11, 3);
    ctx.roundRect(s * 0.04 - (inAir ? -2 : legSwing), s * 0.38, s * 0.19, s * 0.11, 3);
    ctx.fill();

    // Orange Body
    ctx.fillStyle = '#f97316';
    ctx.beginPath();
    ctx.roundRect(-s * 0.26, -s * 0.2, s * 0.52, s * 0.38, 8);
    ctx.fill();

    // White chest belly
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(0, 0, s * 0.14, s * 0.16, 0, 0, Math.PI * 2);
    ctx.fill();

    // Head
    ctx.fillStyle = '#f97316';
    ctx.beginPath();
    ctx.arc(0, -s * 0.28, s * 0.22, 0, Math.PI * 2);
    ctx.fill();

    // Big Fox Ears
    ctx.fillStyle = '#ea580c';
    ctx.beginPath();
    ctx.moveTo(-s * 0.2, -s * 0.38);
    ctx.lineTo(-s * 0.25, -s * 0.6);
    ctx.lineTo(-s * 0.05, -s * 0.45);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(s * 0.05, -s * 0.45);
    ctx.lineTo(s * 0.22, -s * 0.6);
    ctx.lineTo(s * 0.2, -s * 0.38);
    ctx.closePath();
    ctx.fill();

    // Cute nose & eyes
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.arc(s * 0.08, -s * 0.28, Math.max(2.5, s * 0.045), 0, Math.PI * 2);
    ctx.arc(s * 0.18, -s * 0.22, Math.max(2, s * 0.035), 0, Math.PI * 2);
    ctx.fill();
  }

  // Astro - Cosmic Traveler
  private static renderAstro(
    ctx: CanvasRenderingContext2D,
    s: number,
    legSwing: number,
    inAir: boolean,
    animTime: number
  ) {
    // Jetpack on back
    ctx.fillStyle = '#64748b';
    ctx.fillRect(-s * 0.34, -s * 0.25, s * 0.16, s * 0.36);

    if (inAir) {
      // Cosmic stardust particles
      const spark = Math.sin(animTime * 20) * 3;
      ctx.fillStyle = '#a855f7';
      ctx.beginPath();
      ctx.arc(-s * 0.26, s * 0.2 + spark, Math.max(4, s * 0.07), 0, Math.PI * 2);
      ctx.fill();
    }

    // White Space Suit Legs
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(-s * 0.22 + (inAir ? -2 : legSwing), s * 0.15, s * 0.16, s * 0.28);
    ctx.fillRect(s * 0.06 - (inAir ? -2 : legSwing), s * 0.15, s * 0.16, s * 0.28);

    // Purple Boots
    ctx.fillStyle = '#7c3aed';
    ctx.fillRect(-s * 0.24 + (inAir ? -2 : legSwing), s * 0.35, s * 0.2, s * 0.15);
    ctx.fillRect(s * 0.04 - (inAir ? -2 : legSwing), s * 0.35, s * 0.2, s * 0.15);

    // Space Suit Body
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.roundRect(-s * 0.28, -s * 0.2, s * 0.56, s * 0.38, 6);
    ctx.fill();

    // Purple harness lines
    ctx.strokeStyle = '#7c3aed';
    ctx.lineWidth = Math.max(2.5, s * 0.045);
    ctx.strokeRect(-s * 0.2, -s * 0.15, s * 0.4, s * 0.25);

    // Round Astronaut Helmet
    ctx.fillStyle = '#f1f5f9';
    ctx.beginPath();
    ctx.arc(0, -s * 0.3, s * 0.24, 0, Math.PI * 2);
    ctx.fill();

    // Dark Gold Visor
    const visorGrad = ctx.createLinearGradient(0, -s * 0.4, 0, -s * 0.2);
    visorGrad.addColorStop(0, '#0f172a');
    visorGrad.addColorStop(1, '#1e1b4b');
    ctx.fillStyle = visorGrad;
    ctx.beginPath();
    ctx.ellipse(s * 0.04, -s * 0.3, s * 0.16, s * 0.16, 0, 0, Math.PI * 2);
    ctx.fill();

    // Star reflection in visor
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(s * 0.08, -s * 0.34, Math.max(2, s * 0.035), 0, Math.PI * 2);
    ctx.fill();
  }

  // --- Particles ---

  public static drawParticle(ctx: CanvasRenderingContext2D, p: Particle) {
    ctx.save();
    ctx.translate(p.x, p.y);
    if (p.rotation) {
      ctx.rotate(p.rotation);
    }
    ctx.globalAlpha = Math.max(0, p.alpha);
    ctx.fillStyle = p.color;

    if (p.shape === 'star') {
      ctx.beginPath();
      const spikes = 4;
      const step = Math.PI / spikes;
      let angle = 0;
      for (let i = 0; i < spikes; i++) {
        ctx.lineTo(Math.cos(angle) * p.size, Math.sin(angle) * p.size);
        angle += step;
        ctx.lineTo(Math.cos(angle) * (p.size * 0.4), Math.sin(angle) * (p.size * 0.4));
        angle += step;
      }
      ctx.closePath();
      ctx.fill();
    } else if (p.shape === 'square') {
      ctx.fillRect(-p.size * 0.5, -p.size * 0.5, p.size, p.size);
    } else {
      ctx.beginPath();
      ctx.arc(0, 0, p.size, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}
