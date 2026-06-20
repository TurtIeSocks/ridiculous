"use client"

import { cn } from "@/lib/utils"
import type { BgLayer } from "./background-editor.types"
import { LayerCard } from "./layer-card"

// ---------------------------------------------------------------------------
// LayerStack (public) — the reorderable vertical stack of LayerCards. CSS
// paints layers back-to-front (the first layer is on top), so the stack offers
// up/down buttons to reorder (no DnD dependency, per the registry dependency
// policy) plus per-card remove and a single add-layer button. The parent owns
// the layer array (controlled); the stack only emits the reordered / edited /
// resized array — it does NOT decide which layer carries the color (the parent
// re-derives `isFinal` from array position so the color always rides the last
// layer after a reorder).
// ---------------------------------------------------------------------------

export interface LayerStackProps {
  layers: BgLayer[]
  onChange: (next: BgLayer[]) => void
  className?: string
}

export function LayerStack({ layers, onChange, className }: LayerStackProps) {
  const updateAt = (index: number, layer: BgLayer) =>
    onChange(layers.map((l, i) => (i === index ? layer : l)))

  const removeAt = (index: number) =>
    onChange(layers.filter((_, i) => i !== index))

  const move = (index: number, dir: -1 | 1) => {
    const target = index + dir
    if (target < 0 || target >= layers.length) return
    const next = layers.slice()
    const [moved] = next.splice(index, 1)
    next.splice(target, 0, moved)
    onChange(next)
  }

  const add = () =>
    onChange([
      ...layers,
      {
        image: "none",
        position: "center",
        size: "cover",
        repeat: "no-repeat",
        attachment: "",
        origin: "",
        clip: "",
      },
    ])

  return (
    <div className={cn("space-y-2", className)}>
      {layers.map((layer, i) => (
        <LayerCard
          // biome-ignore lint/suspicious/noArrayIndexKey: layers are a positional list reordered only by the up/down buttons; index is the stable identity.
          key={`layer-${i}`}
          index={i}
          isFinal={i === layers.length - 1}
          layer={layer}
          onChange={(next) => updateAt(i, next)}
          onMoveUp={() => move(i, -1)}
          onMoveDown={() => move(i, 1)}
          onRemove={() => removeAt(i)}
          canMoveUp={i > 0}
          canMoveDown={i < layers.length - 1}
          canRemove={layers.length > 1}
        />
      ))}

      <button
        type="button"
        aria-label="Add layer"
        onClick={add}
        className="w-full rounded border border-dashed py-1.5 font-mono text-[10px] text-muted-foreground hover:text-foreground"
      >
        + add layer
      </button>
    </div>
  )
}
