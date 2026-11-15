export const clampPosition = (value) => Math.max(-100, Math.min(100, value));

export function cropGeometry(width, height, zoom, x, y) {
  const size = Math.min(width, height) / Math.max(1, Math.min(3, zoom));
  return {
    x: ((width - size) / 2) * (1 + clampPosition(x) / 100),
    y: ((height - size) / 2) * (1 + clampPosition(y) / 100),
    size,
  };
}
