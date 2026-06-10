import type { Position } from "./coordinate-input.types"

/** Parse `"lon, lat[, alt]"` → Position; null on NaN or arity ≠ 2–3. */
export function parseCoordinate(src: string): Position | null {
  const parts = src.split(",").map((s) => Number.parseFloat(s.trim()))
  if (parts.some((n) => Number.isNaN(n))) return null
  if (parts.length === 2) return [parts[0], parts[1]]
  if (parts.length === 3) return [parts[0], parts[1], parts[2]]
  return null
}

/** Serialize a Position back to `"lon, lat[, alt]"`. */
export function formatCoordinate(pos: Position): string {
  return pos.join(", ")
}

export const clampLon = (n: number): number => Math.min(180, Math.max(-180, n))
export const clampLat = (n: number): number => Math.min(90, Math.max(-90, n))
