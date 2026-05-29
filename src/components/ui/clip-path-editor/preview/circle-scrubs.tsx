import { UnitInput } from "@/components/ui/unit-input"
import { formatClipPath } from "../clip-path-editor.helpers"
import type { ClipPathState } from "../clip-path-editor.types"

/** Radius scrub for circle/ellipse using UnitInput (percent radii only). */
export function CircleScrubs({
  state,
  onChange,
  id,
}: {
  state: ClipPathState | null
  onChange?: (value: string) => void
  id: string
}) {
  if (
    state === null ||
    state.shape === null ||
    !onChange ||
    (state.shape.shape !== "circle" && state.shape.shape !== "ellipse")
  ) {
    return null
  }
  const shape = state.shape

  if (shape.shape === "circle") {
    const radius = shape.radius ?? "50%"
    // Only scrub a percentage radius (the common case); keyword/length stays as-is.
    if (!radius.endsWith("%")) return null
    return (
      <label
        htmlFor={`${id}-r`}
        className="flex items-center gap-2 text-muted-foreground text-xs"
      >
        <span className="w-16 font-mono">radius</span>
        <UnitInput
          aria-label="circle radius scrub"
          unit="%"
          min={0}
          max={100}
          value={radius as `${number}%`}
          onChange={(r) =>
            onChange(
              formatClipPath({ ...state, shape: { ...shape, radius: r } }),
            )
          }
        />
      </label>
    )
  }

  // ellipse: scrub rx + ry when both are percentages
  const rx = shape.rx ?? "50%"
  const ry = shape.ry ?? "35%"
  if (!rx.endsWith("%") || !ry.endsWith("%")) return null
  return (
    <div className="space-y-1.5">
      <label
        htmlFor={`${id}-rx`}
        className="flex items-center gap-2 text-muted-foreground text-xs"
      >
        <span className="w-16 font-mono">radius x</span>
        <UnitInput
          aria-label="ellipse radius x scrub"
          unit="%"
          min={0}
          max={100}
          value={rx as `${number}%`}
          onChange={(v) =>
            onChange(formatClipPath({ ...state, shape: { ...shape, rx: v } }))
          }
        />
      </label>
      <label
        htmlFor={`${id}-ry`}
        className="flex items-center gap-2 text-muted-foreground text-xs"
      >
        <span className="w-16 font-mono">radius y</span>
        <UnitInput
          aria-label="ellipse radius y scrub"
          unit="%"
          min={0}
          max={100}
          value={ry as `${number}%`}
          onChange={(v) =>
            onChange(formatClipPath({ ...state, shape: { ...shape, ry: v } }))
          }
        />
      </label>
    </div>
  )
}
