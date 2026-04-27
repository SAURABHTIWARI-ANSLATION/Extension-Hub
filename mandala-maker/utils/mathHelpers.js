'use strict';

const MathHelpers = {
  degreesToRadians(deg) { return (deg * Math.PI) / 180; },
  radiansToDegrees(rad) { return (rad * 180) / Math.PI; },

  rotatePoint(px, py, cx, cy, rad) {
    const dx = px - cx, dy = py - cy;
    return {
      x: cx + dx * Math.cos(rad) - dy * Math.sin(rad),
      y: cy + dx * Math.sin(rad) + dy * Math.cos(rad)
    };
  },

  clamp(val, min, max) { return Math.min(max, Math.max(min, val)); },

  lerp(a, b, t) { return a + (b - a) * t; },

  randomItem(arr) { return arr[Math.floor(Math.random() * arr.length)]; },

  hexToRgba(hex, alpha = 1) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  },

  generatePalette() {
    const hue = Math.floor(Math.random() * 360);
    return [0, 30, 60, 180, 210, 270].map(offset => {
      const h = (hue + offset) % 360;
      return `hsl(${h},70%,55%)`;
    });
  }
};
