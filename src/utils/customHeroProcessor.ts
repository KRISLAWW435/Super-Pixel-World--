/**
 * Super Pixel World - Custom Hero Smart Image Processing
 *
 * Designed for kids (ages 8-15) uploading their own 2D pixel-art creations:
 * 1. Validates image file type.
 * 2. Draws onto an off-screen canvas to extract raw pixel data.
 * 3. Smart Crop: Scans for the bounding box of non-transparent pixels (alpha > 10).
 * 4. Scale: Crops empty borders and scales character to exactly 105px height (the game's physical hitbox).
 * 5. Preserves original aspect ratio and applies imageSmoothingEnabled = false for crisp pixel art.
 * 6. Returns a compact Base64 PNG data URL suitable for saving into LevelData and LocalStorage.
 */

export const TARGET_HERO_HEIGHT = 105; // Matches playerHeight in physics.ts

export interface ProcessedHeroResult {
  base64: string;
  width: number;
  height: number;
  cropWidth: number;
  cropHeight: number;
}

/**
 * Process uploaded custom hero file with smart auto-crop and 105px height scaling.
 */
export async function processCustomHeroImage(file: File): Promise<ProcessedHeroResult> {
  // 1. Validate file format
  if (!file) {
    throw new Error('Файл не выбран.');
  }

  const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif'];
  if (!validTypes.includes(file.type.toLowerCase()) && !file.name.match(/\.(png|jpe?g|webp|gif)$/i)) {
    throw new Error('Пожалуйста, выберите файл изображения (PNG, JPG или WEBP).');
  }

  if (file.size > 15 * 1024 * 1024) {
    throw new Error('Файл слишком большой. Максимальный размер: 15 МБ.');
  }

  // 2. Read file to data URL
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const res = e.target?.result;
      if (typeof res === 'string') resolve(res);
      else reject(new Error('Не удалось прочитать файл изображения.'));
    };
    reader.onerror = () => reject(new Error('Ошибка чтения файла с диска.'));
    reader.readAsDataURL(file);
  });

  // 3. Load into HTMLImageElement
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Не удалось обработать изображение. Возможно, файл повреждён.'));
    image.src = dataUrl;
  });

  const naturalW = img.naturalWidth || img.width;
  const naturalH = img.naturalHeight || img.height;

  if (naturalW <= 0 || naturalH <= 0) {
    throw new Error('Изображение имеет нулевые размеры.');
  }

  // 4. Draw to off-screen canvas to extract pixel data
  const rawCanvas = document.createElement('canvas');
  rawCanvas.width = naturalW;
  rawCanvas.height = naturalH;
  const rawCtx = rawCanvas.getContext('2d', { willReadFrequently: true });
  if (!rawCtx) {
    throw new Error('Не удалось создать контекст рисования.');
  }

  rawCtx.drawImage(img, 0, 0);
  const imgData = rawCtx.getImageData(0, 0, naturalW, naturalH);
  const pixels = imgData.data;

  // 5. Smart Crop: Detect bounding box of non-transparent pixels
  // Check if image has transparency or is completely opaque (e.g. JPG)
  let hasAlpha = false;
  for (let i = 3; i < pixels.length; i += 4) {
    if (pixels[i] < 245) {
      hasAlpha = true;
      break;
    }
  }

  let minX = naturalW;
  let minY = naturalH;
  let maxX = -1;
  let maxY = -1;

  if (hasAlpha) {
    // Transparent PNG: scan for alpha > 10 (ignores compression artifacts)
    for (let y = 0; y < naturalH; y++) {
      for (let x = 0; x < naturalW; x++) {
        const alpha = pixels[(y * naturalW + x) * 4 + 3];
        if (alpha > 10) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }
  } else {
    // Opaque image (e.g. JPG without transparency):
    // Check if background is solid (e.g., sample corners for solid background color)
    const topLeftR = pixels[0];
    const topLeftG = pixels[1];
    const topLeftB = pixels[2];

    const isNearBg = (r: number, g: number, b: number) => {
      // If corner is white or black, allow trimming matching borders
      const isWhite = topLeftR > 240 && topLeftG > 240 && topLeftB > 240;
      const isBlack = topLeftR < 15 && topLeftG < 15 && topLeftB < 15;
      if (!isWhite && !isBlack) return false;
      return (
        Math.abs(r - topLeftR) < 20 &&
        Math.abs(g - topLeftG) < 20 &&
        Math.abs(b - topLeftB) < 20
      );
    };

    const hasUniformBg = isNearBg(
      pixels[(naturalW - 1) * 4],
      pixels[(naturalW - 1) * 4 + 1],
      pixels[(naturalW - 1) * 4 + 2]
    );

    for (let y = 0; y < naturalH; y++) {
      for (let x = 0; x < naturalW; x++) {
        const idx = (y * naturalW + x) * 4;
        const r = pixels[idx];
        const g = pixels[idx + 1];
        const b = pixels[idx + 2];

        if (hasUniformBg && isNearBg(r, g, b)) {
          continue;
        }
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }

    // Fallback if full image is uniform or border check didn't find edges
    if (maxX === -1) {
      minX = 0;
      minY = 0;
      maxX = naturalW - 1;
      maxY = naturalH - 1;
    }
  }

  // Safety fallback if no non-transparent pixels were found
  if (maxX === -1 || maxY === -1 || minX > maxX || minY > maxY) {
    throw new Error('Изображение полностью прозрачное. Нарисуйте персонажа и попробуйте снова!');
  }

  const cropW = maxX - minX + 1;
  const cropH = maxY - minY + 1;

  // 6. Scale to exactly 105px in height while preserving aspect ratio
  const aspect = cropW / cropH;
  const scaledHeight = TARGET_HERO_HEIGHT;
  const scaledWidth = Math.max(12, Math.round(scaledHeight * aspect));

  const scaledCanvas = document.createElement('canvas');
  scaledCanvas.width = scaledWidth;
  scaledCanvas.height = scaledHeight;
  const scaledCtx = scaledCanvas.getContext('2d');
  if (!scaledCtx) {
    throw new Error('Не удалось создать холст масштабирования.');
  }

  // Crisp pixel-art scaling
  scaledCtx.imageSmoothingEnabled = false;
  scaledCtx.drawImage(
    rawCanvas,
    minX,
    minY,
    cropW,
    cropH,
    0,
    0,
    scaledWidth,
    scaledHeight
  );

  const base64 = scaledCanvas.toDataURL('image/png');

  return {
    base64,
    width: scaledWidth,
    height: scaledHeight,
    cropWidth: cropW,
    cropHeight: cropH,
  };
}
