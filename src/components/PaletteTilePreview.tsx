/**
 * Super Pixel World - Palette Tile Canvas Thumbnail
 * Renders a crisp real preview of the tile or hero using the SpriteRenderer
 */

import React, { useEffect, useRef } from 'react';
import { SpriteRenderer } from '../graphics/spriteRenderer';
import { HeroId, TileId } from '../types/game';

interface PaletteTilePreviewProps {
  tileId?: TileId;
  heroId?: HeroId;
  size?: number;
}

export const PaletteTilePreview: React.FC<PaletteTilePreviewProps> = ({
  tileId,
  heroId,
  size = 36,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, size, size);

    if (tileId) {
      SpriteRenderer.drawTile(ctx, tileId, 0, 0, size, {
        hasLeft: false,
        hasRight: false,
        animTime: 0.5,
        isThumbnail: true,
      });
    } else if (heroId) {
      SpriteRenderer.drawHero(ctx, heroId, 2, 2, size - 4, size - 4, {
        isWalking: false,
        isInAir: false,
        facingRight: true,
        animTime: 0,
      });
    }
  }, [tileId, heroId, size]);

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      className="pointer-events-none drop-shadow-sm"
    />
  );
};
