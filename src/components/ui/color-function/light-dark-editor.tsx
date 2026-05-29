import { ColorPicker } from "@/components/ui/color-picker"
import { cn } from "@/lib/utils"
import type { LightDarkState } from "./color-function.types"

// ---------------------------------------------------------------------------
// LightDarkEditor (public) — two color pickers, one per color-scheme slot.
// ---------------------------------------------------------------------------

export interface LightDarkEditorProps {
  state: LightDarkState
  onChange: (state: LightDarkState) => void
  className?: string
}

export function LightDarkEditor({
  state,
  onChange,
  className,
}: LightDarkEditorProps) {
  return (
    <div className={cn("flex items-center gap-4", className)}>
      <div className="flex items-center gap-2 text-xs">
        <span className="text-muted-foreground">Light color</span>
        <ColorPicker
          native
          value={state.light}
          onChange={(c) => onChange({ ...state, light: String(c) })}
          aria-label="Light color"
        />
      </div>
      <div className="flex items-center gap-2 text-xs">
        <span className="text-muted-foreground">Dark color</span>
        <ColorPicker
          native
          value={state.dark}
          onChange={(c) => onChange({ ...state, dark: String(c) })}
          aria-label="Dark color"
        />
      </div>
    </div>
  )
}
