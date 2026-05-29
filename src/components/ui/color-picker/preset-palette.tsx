import { PRESETS } from "./color-picker.constants"
import type { Oklch } from "./color-picker.types"

export function PresetPalette({ onPick }: { onPick: (next: Oklch) => void }) {
  return (
    <div
      data-slot="color-picker-presets"
      className="flex w-full flex-1 items-center justify-evenly gap-1.5"
    >
      {PRESETS.map((p) => (
        <button
          key={p.name}
          type="button"
          aria-label={`preset ${p.name}`}
          onClick={() => onPick({ l: p.l, c: p.c, h: p.h, a: 1 })}
          className="h-5 w-5 shrink-0 cursor-pointer rounded border transition hover:scale-110"
          style={{ backgroundColor: `oklch(${p.l} ${p.c} ${p.h})` }}
        />
      ))}
    </div>
  )
}
