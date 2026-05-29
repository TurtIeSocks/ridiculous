import { ColorPicker } from "@/components/ui/color-picker"
import { cn } from "@/lib/utils"
import {
  CYLINDRICAL_SPACES,
  DEFAULT_PCT,
  HUE_METHODS,
  MIX_COLOR_SPACES,
} from "./color-function.helpers"
import type { ColorMixState } from "./color-function.types"

const CYLINDRICAL_SET = new Set<string>(CYLINDRICAL_SPACES)

/** Parse a percentage like "30%" to a 0–100 number (fallback `DEFAULT_PCT`). */
function pctToNumber(pct: string | undefined): number {
  if (!pct) return DEFAULT_PCT
  const n = Number.parseFloat(pct)
  return Number.isFinite(n) ? n : DEFAULT_PCT
}

// ---------------------------------------------------------------------------
// ColorMixEditor (public) — interpolation space, optional hue method, and two
// `<color> <pct>?` rows with a swap control.
// ---------------------------------------------------------------------------

export interface ColorMixEditorProps {
  state: ColorMixState
  onChange: (state: ColorMixState) => void
  className?: string
}

export function ColorMixEditor({
  state,
  onChange,
  className,
}: ColorMixEditorProps) {
  const isCylindrical = CYLINDRICAL_SET.has(state.space)

  const setSpace = (space: string) => {
    const next: ColorMixState = { ...state, space }
    // Drop the hue method when the new space cannot carry one.
    if (!CYLINDRICAL_SET.has(space)) next.hue = undefined
    onChange(next)
  }

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex flex-wrap items-center gap-2">
        <label className="flex items-center gap-1.5 text-xs">
          <span className="text-muted-foreground">in</span>
          <select
            aria-label="Interpolation colorspace"
            value={state.space}
            onChange={(e) => setSpace(e.target.value)}
            className="h-8 rounded border bg-background px-2 font-mono text-xs"
          >
            {MIX_COLOR_SPACES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>

        {isCylindrical && (
          <label className="flex items-center gap-1.5 text-xs">
            <span className="text-muted-foreground">hue</span>
            <select
              aria-label="Hue interpolation method"
              value={state.hue ?? ""}
              onChange={(e) =>
                onChange({ ...state, hue: e.target.value || undefined })
              }
              className="h-8 rounded border bg-background px-2 font-mono text-xs"
            >
              <option value="">(default)</option>
              {HUE_METHODS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      <MixColorRow
        label="First"
        color={state.colorA}
        pct={state.pctA}
        onColor={(colorA) => onChange({ ...state, colorA })}
        onPct={(pctA) => onChange({ ...state, pctA })}
      />
      <MixColorRow
        label="Second"
        color={state.colorB}
        pct={state.pctB}
        onColor={(colorB) => onChange({ ...state, colorB })}
        onPct={(pctB) => onChange({ ...state, pctB })}
      />

      <button
        type="button"
        onClick={() =>
          onChange({
            ...state,
            colorA: state.colorB,
            colorB: state.colorA,
            pctA: state.pctB,
            pctB: state.pctA,
          })
        }
        className="rounded border px-2 py-1 text-[10px] text-muted-foreground hover:text-foreground"
      >
        ⇄ swap colors
      </button>
    </div>
  )
}

interface MixColorRowProps {
  label: string
  color: string
  pct: string | undefined
  onColor: (color: string) => void
  onPct: (pct: string | undefined) => void
}

function MixColorRow({ label, color, pct, onColor, onPct }: MixColorRowProps) {
  const lower = label.toLowerCase()
  return (
    <div className="flex items-center gap-2">
      <span className="w-12 text-[10px] text-muted-foreground uppercase">
        {label}
      </span>
      <ColorPicker
        native
        value={color}
        onChange={(c) => onColor(String(c))}
        aria-label={`${lower} color`}
      />
      <input
        type="range"
        min={0}
        max={100}
        value={pctToNumber(pct)}
        onChange={(e) => onPct(`${e.target.value}%`)}
        aria-label={`${lower} color ratio`}
        className="flex-1 accent-foreground"
      />
      <span className="w-10 text-right font-mono text-[10px] text-muted-foreground">
        {pct ?? "—"}
      </span>
      <button
        type="button"
        aria-label={`Toggle ${lower} ratio`}
        onClick={() => onPct(pct ? undefined : `${DEFAULT_PCT}%`)}
        className="rounded border px-1.5 py-0.5 text-[10px] text-muted-foreground hover:text-foreground"
      >
        {pct ? "×%" : "+%"}
      </button>
    </div>
  )
}
