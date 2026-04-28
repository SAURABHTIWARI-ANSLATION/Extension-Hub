const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

const OUTPUT_DIR = path.join(__dirname, "..", "icons");
const SIZES = [16, 48, 128];
const SUPERSAMPLE = 4;

const COLORS = {
  navy: [15, 23, 42, 255],
  blueTop: [96, 165, 250, 255],
  blueBottom: [37, 99, 235, 255],
  highlight: [96, 165, 250, 56],
  bodyTop: [248, 251, 255, 255],
  bodyBottom: [219, 234, 254, 255],
  tab: [191, 219, 254, 255],
  lensOuter: [29, 78, 216, 48],
  white: [255, 255, 255, 255],
  lensCore: [37, 99, 235, 255],
  lensSpark: [219, 234, 254, 255]
};

for (const size of SIZES) {
  const pixels = rasterize(size);
  const png = encodePng(size, size, pixels);
  fs.writeFileSync(path.join(OUTPUT_DIR, `icon${size}.png`), png);
}

function rasterize(size) {
  const pixels = Buffer.alloc(size * size * 4);
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const color = samplePixel(size, x, y);
      const offset = (y * size + x) * 4;
      pixels[offset + 0] = color[0];
      pixels[offset + 1] = color[1];
      pixels[offset + 2] = color[2];
      pixels[offset + 3] = color[3];
    }
  }
  return pixels;
}

function samplePixel(size, pixelX, pixelY) {
  let accum = [0, 0, 0, 0];

  for (let sy = 0; sy < SUPERSAMPLE; sy += 1) {
    for (let sx = 0; sx < SUPERSAMPLE; sx += 1) {
      const x = (pixelX + (sx + 0.5) / SUPERSAMPLE) / size;
      const y = (pixelY + (sy + 0.5) / SUPERSAMPLE) / size;
      const sample = sceneColor(x, y);
      accum[0] += sample[0];
      accum[1] += sample[1];
      accum[2] += sample[2];
      accum[3] += sample[3];
    }
  }

  const scale = 1 / (SUPERSAMPLE * SUPERSAMPLE);
  return accum.map((value) => Math.round(value * scale));
}

function sceneColor(x, y) {
  let color = [0, 0, 0, 0];

  color = blend(color, fillRoundedRect(x, y, 0, 0, 1, 1, 0.25, COLORS.navy));
  color = blend(color, fillCircle(x, y, 0.273, 0.242, 0.219, COLORS.highlight));
  color = blend(color, fillRoundedRectGradient(
    x,
    y,
    0.141,
    0.141,
    0.719,
    0.719,
    0.211,
    COLORS.blueTop,
    COLORS.blueBottom
  ));
  color = blend(color, fillRoundedRectGradient(
    x,
    y,
    0.227,
    0.344,
    0.547,
    0.367,
    0.102,
    COLORS.bodyTop,
    COLORS.bodyBottom
  ));
  color = blend(color, fillRoundedRect(x, y, 0.336, 0.258, 0.18, 0.086, 0.043, COLORS.tab));
  color = blend(color, fillCircle(x, y, 0.5, 0.527, 0.148, COLORS.lensOuter));
  color = blend(color, fillCircle(x, y, 0.5, 0.527, 0.109, COLORS.white));
  color = blend(color, fillCircle(x, y, 0.5, 0.527, 0.066, COLORS.lensCore));
  color = blend(color, fillCircle(x, y, 0.5, 0.527, 0.031, COLORS.lensSpark));

  return color;
}

function fillRoundedRect(x, y, rx, ry, width, height, radius, color) {
  return isInsideRoundedRect(x, y, rx, ry, width, height, radius) ? color : [0, 0, 0, 0];
}

function fillRoundedRectGradient(x, y, rx, ry, width, height, radius, start, end) {
  if (!isInsideRoundedRect(x, y, rx, ry, width, height, radius)) {
    return [0, 0, 0, 0];
  }
  const t = clamp(((x - rx) / width + (y - ry) / height) * 0.5, 0, 1);
  return lerpColor(start, end, t);
}

function fillCircle(x, y, cx, cy, radius, color) {
  const dx = x - cx;
  const dy = y - cy;
  return dx * dx + dy * dy <= radius * radius ? color : [0, 0, 0, 0];
}

function isInsideRoundedRect(x, y, rx, ry, width, height, radius) {
  const nearestX = clamp(x, rx + radius, rx + width - radius);
  const nearestY = clamp(y, ry + radius, ry + height - radius);
  const dx = x - nearestX;
  const dy = y - nearestY;
  return dx * dx + dy * dy <= radius * radius;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function lerpColor(start, end, amount) {
  return [
    Math.round(start[0] + (end[0] - start[0]) * amount),
    Math.round(start[1] + (end[1] - start[1]) * amount),
    Math.round(start[2] + (end[2] - start[2]) * amount),
    Math.round(start[3] + (end[3] - start[3]) * amount)
  ];
}

function blend(base, top) {
  const topAlpha = top[3] / 255;
  const baseAlpha = base[3] / 255;
  const outAlpha = topAlpha + baseAlpha * (1 - topAlpha);

  if (outAlpha === 0) {
    return [0, 0, 0, 0];
  }

  return [
    Math.round((top[0] * topAlpha + base[0] * baseAlpha * (1 - topAlpha)) / outAlpha),
    Math.round((top[1] * topAlpha + base[1] * baseAlpha * (1 - topAlpha)) / outAlpha),
    Math.round((top[2] * topAlpha + base[2] * baseAlpha * (1 - topAlpha)) / outAlpha),
    Math.round(outAlpha * 255)
  ];
}

function encodePng(width, height, rgba) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const scanlines = Buffer.alloc((width * 4 + 1) * height);

  for (let y = 0; y < height; y += 1) {
    const rowStart = y * (width * 4 + 1);
    scanlines[rowStart] = 0;
    rgba.copy(scanlines, rowStart + 1, y * width * 4, (y + 1) * width * 4);
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  return Buffer.concat([
    signature,
    pngChunk("IHDR", ihdr),
    pngChunk("IDAT", zlib.deflateSync(scanlines)),
    pngChunk("IEND", Buffer.alloc(0))
  ]);
}

function pngChunk(type, data) {
  const typeBuffer = Buffer.from(type);
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);

  const checksum = Buffer.alloc(4);
  checksum.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])), 0);

  return Buffer.concat([length, typeBuffer, data, checksum]);
}

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const value of buffer) {
    crc ^= value;
    for (let bit = 0; bit < 8; bit += 1) {
      const mask = -(crc & 1);
      crc = (crc >>> 1) ^ (0xedb88320 & mask);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}
