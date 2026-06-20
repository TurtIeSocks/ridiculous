"use client"

import { ColorPicker } from "@/components/ui/color-picker"
import {
  GradientEditor,
  isGradientString,
} from "@/components/ui/gradient-editor"
import { Input } from "@/components/ui/input"
import { UnitInput } from "@/components/ui/unit-input"
import { cn } from "@/lib/utils"
import {
  attachmentOptions,
  boxOptions,
  repeatOptions,
  sizeKeywords,
} from "./background-editor.helpers"
import type { BgLayer } from "./background-editor.types"
import { MiniSelect } from "./mini-select"
import { PositionPad } from "./position-pad"

// ---------------------------------------------------------------------------
// LayerCard (public) — one background layer's editors. The image is an embedded
// GradientEditor (when the layer's image is a gradient) or a plain `url()` /
// image input otherwise; a thumbnail mirrors the produced image. A PositionPad
// 2D crosshair plus x/y UnitInputs drive the position; a size control toggles
// cover/contain/auto vs a length; repeat / attachment / origin / clip are
// MiniSelects. The FINAL card additionally renders a ColorPicker for the
// layer's `<color>` (the index-aware invariant — only the last layer may carry
// a color). The parent owns the layer value (controlled).
// ---------------------------------------------------------------------------

// Keyword positions map to their conventional percent anchors so the pad and
// the keyword forms round-trip.
const POSITION_PERCENT: Record<string, number> = {
  left: 0,
  top: 0,
  center: 50,
  right: 100,
  bottom: 100,
}

function lengthToPercent(token: string): number | null {
  const m = /^(-?[\d.]+)%$/.exec(token)
  if (m) return Number.parseFloat(m[1])
  return null
}

/** Derive an { x, y } percent pair from a position string for the pad. */
function positionToXY(position: string): { x: number; y: number } {
  const toks = position.trim().split(/\s+/).filter(Boolean)
  if (toks.length === 0) return { x: 50, y: 50 }
  // Resolve the x token (first horizontal-ish) and y token (second).
  const resolve = (tok: string | undefined, fallback: number): number => {
    if (tok === undefined) return fallback
    if (tok in POSITION_PERCENT) return POSITION_PERCENT[tok]
    const pct = lengthToPercent(tok)
    return pct === null ? fallback : pct
  }
  return { x: resolve(toks[0], 50), y: resolve(toks[1], 50) }
}

const SIZE_KEYWORD_SET = new Set<string>(sizeKeywords())

export interface LayerCardProps {
  index: number
  isFinal: boolean
  layer: BgLayer
  onChange: (next: BgLayer) => void
  /** Move this layer up one slot (toward the front / top of the paint order). */
  onMoveUp?: () => void
  /** Move this layer down one slot (toward the back of the paint order). */
  onMoveDown?: () => void
  /** Remove this layer from the stack. */
  onRemove?: () => void
  /** Whether the up button is disabled (the layer is already first). */
  canMoveUp?: boolean
  /** Whether the down button is disabled (the layer is already last). */
  canMoveDown?: boolean
  /** Whether the remove button is disabled (only one layer remains). */
  canRemove?: boolean
  className?: string
}

export function LayerCard({
  index,
  isFinal,
  layer,
  onChange,
  onMoveUp,
  onMoveDown,
  onRemove,
  canMoveUp = true,
  canMoveDown = true,
  canRemove = true,
  className,
}: LayerCardProps) {
  const { x, y } = positionToXY(layer.position)
  const sizeIsKeyword = layer.size === "" || SIZE_KEYWORD_SET.has(layer.size)
  const sizeSelectValue = SIZE_KEYWORD_SET.has(layer.size) ? layer.size : "auto"

  const setPosition = (next: { x: number; y: number }) =>
    onChange({ ...layer, position: `${next.x}% ${next.y}%` })

  const imageIsGradient = isGradientString(layer.image)

  return (
    <div
      data-testid="background-layer-card"
      data-slot="background-layer-card"
      className={cn("space-y-3 rounded-lg border p-3", className)}
    >
      {/* header — label + reorder / remove controls */}
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] text-muted-foreground uppercase">
          layer {index + 1}
          {isFinal ? " (final)" : ""}
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="Move layer up"
            onClick={onMoveUp}
            disabled={!onMoveUp || !canMoveUp}
            className="flex size-6 items-center justify-center rounded border text-muted-foreground hover:text-foreground disabled:opacity-30"
          >
            ↑
          </button>
          <button
            type="button"
            aria-label="Move layer down"
            onClick={onMoveDown}
            disabled={!onMoveDown || !canMoveDown}
            className="flex size-6 items-center justify-center rounded border text-muted-foreground hover:text-foreground disabled:opacity-30"
          >
            ↓
          </button>
          <button
            type="button"
            aria-label="Remove layer"
            onClick={onRemove}
            disabled={!onRemove || !canRemove}
            className="flex size-6 items-center justify-center rounded border text-muted-foreground hover:text-foreground disabled:opacity-30"
          >
            ×
          </button>
        </div>
      </div>

      {/* image — gradient editor or url() input */}
      <div className="flex items-center gap-2">
        <span className="w-14 shrink-0 font-mono text-[10px] text-muted-foreground uppercase">
          image
        </span>
        {imageIsGradient ? (
          <GradientEditor
            value={layer.image}
            onChange={(next) => onChange({ ...layer, image: next })}
          />
        ) : (
          <Input
            aria-label={`Layer ${index + 1} image`}
            value={layer.image}
            placeholder="url(image.png) | none"
            onChange={(e) => onChange({ ...layer, image: e.target.value })}
            className="h-8 font-mono text-xs"
          />
        )}
      </div>

      {/* position — 2D pad + x/y unit inputs */}
      <div className="flex items-center gap-3">
        <PositionPad x={x} y={y} onChange={setPosition} />
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1 font-mono text-[10px] text-muted-foreground">
            <span aria-hidden="true">x:</span>
            <UnitInput
              unit="%"
              value={`${Math.round(x)}%`}
              onChange={(v) => setPosition({ x: lengthToPercent(v) ?? x, y })}
              min={0}
              max={100}
              aria-label="Position x"
              className="h-6 w-14"
            />
          </div>
          <div className="flex items-center gap-1 font-mono text-[10px] text-muted-foreground">
            <span aria-hidden="true">y:</span>
            <UnitInput
              unit="%"
              value={`${Math.round(y)}%`}
              onChange={(v) => setPosition({ x, y: lengthToPercent(v) ?? y })}
              min={0}
              max={100}
              aria-label="Position y"
              className="h-6 w-14"
            />
          </div>
        </div>
      </div>

      {/* size — keyword vs length */}
      <div className="flex items-center gap-2">
        <span className="w-14 shrink-0 font-mono text-[10px] text-muted-foreground uppercase">
          size
        </span>
        <MiniSelect
          aria-label={`Layer ${index + 1} size`}
          value={sizeSelectValue}
          onValueChange={(v) => onChange({ ...layer, size: v })}
        >
          {sizeKeywords().map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
          <option value="__length">length…</option>
        </MiniSelect>
        {!sizeIsKeyword && (
          <UnitInput
            unit="%"
            value={layer.size}
            onChange={(v) => onChange({ ...layer, size: v })}
            aria-label={`Layer ${index + 1} size length`}
            className="h-7 w-20"
          />
        )}
      </div>

      {/* repeat / attachment / origin / clip selects */}
      <div className="flex flex-wrap items-center gap-2">
        <MiniSelect
          aria-label={`Layer ${index + 1} repeat`}
          value={layer.repeat || "repeat"}
          onValueChange={(v) => onChange({ ...layer, repeat: v })}
        >
          {repeatOptions().map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </MiniSelect>
        <MiniSelect
          aria-label={`Layer ${index + 1} attachment`}
          value={layer.attachment || "scroll"}
          onValueChange={(v) => onChange({ ...layer, attachment: v })}
        >
          {attachmentOptions().map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </MiniSelect>
        <MiniSelect
          aria-label={`Layer ${index + 1} origin`}
          value={layer.origin || "padding-box"}
          onValueChange={(v) => onChange({ ...layer, origin: v })}
        >
          {boxOptions().map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </MiniSelect>
        <MiniSelect
          aria-label={`Layer ${index + 1} clip`}
          value={layer.clip || "border-box"}
          onValueChange={(v) => onChange({ ...layer, clip: v })}
        >
          {boxOptions().map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </MiniSelect>
      </div>

      {/* the FINAL layer additionally carries a <color> */}
      {isFinal && (
        <div className="flex items-center gap-2">
          <span className="w-14 shrink-0 font-mono text-[10px] text-muted-foreground uppercase">
            color
          </span>
          <ColorPicker
            aria-label="Layer color"
            value={layer.color ?? "#ffffff"}
            onChange={(next) => onChange({ ...layer, color: next })}
          />
        </div>
      )}
    </div>
  )
}
