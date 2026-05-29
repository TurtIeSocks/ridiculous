import { ColorPicker } from "@/components/ui/color-picker"
import { cn } from "@/lib/utils"
import { CHANNEL_KEYWORDS, RELATIVE_FNS } from "./color-function.helpers"
import type { RelativeColorState } from "./color-function.types"

// ---------------------------------------------------------------------------
// RelativeColorEditor (public) — picks the relative fn, source color, an
// optional color() space ident, three channel tokens, and an optional alpha.
// ---------------------------------------------------------------------------

export interface RelativeColorEditorProps {
  state: RelativeColorState
  onChange: (state: RelativeColorState) => void
  className?: string
}

export function RelativeColorEditor({
  state,
  onChange,
  className,
}: RelativeColorEditorProps) {
  const keywords = CHANNEL_KEYWORDS[state.fn] ?? ["c1", "c2", "c3"]

  const setFn = (fn: string) => {
    // Reset channels to the new function's keyword defaults.
    const kw = CHANNEL_KEYWORDS[fn] ?? ["c1", "c2", "c3"]
    const next: RelativeColorState = {
      ...state,
      fn,
      c1: kw[0],
      c2: kw[1],
      c3: kw[2],
    }
    if (fn !== "color") next.space = undefined
    else if (next.space === undefined) next.space = "srgb"
    onChange(next)
  }

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center gap-2">
        <label className="flex items-center gap-1.5 text-xs">
          <span className="text-muted-foreground">fn</span>
          <select
            aria-label="Relative function"
            value={state.fn}
            onChange={(e) => setFn(e.target.value)}
            className="h-8 rounded border bg-background px-2 font-mono text-xs"
          >
            {RELATIVE_FNS.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </label>

        <span className="text-muted-foreground text-xs">from</span>
        <ColorPicker
          native
          value={state.from}
          onChange={(c) => onChange({ ...state, from: String(c) })}
          aria-label="Source color"
        />

        {state.fn === "color" && (
          <input
            type="text"
            value={state.space ?? "srgb"}
            onChange={(e) => onChange({ ...state, space: e.target.value })}
            aria-label="Color space"
            className="h-8 w-24 rounded border bg-background px-2 font-mono text-xs"
          />
        )}
      </div>

      <div className="grid grid-cols-3 gap-2">
        <ChannelInput
          index={1}
          placeholder={keywords[0]}
          value={state.c1}
          onChange={(c1) => onChange({ ...state, c1 })}
        />
        <ChannelInput
          index={2}
          placeholder={keywords[1]}
          value={state.c2}
          onChange={(c2) => onChange({ ...state, c2 })}
        />
        <ChannelInput
          index={3}
          placeholder={keywords[2]}
          value={state.c3}
          onChange={(c3) => onChange({ ...state, c3 })}
        />
      </div>

      <label className="flex items-center gap-2 text-xs">
        <span className="w-12 text-[10px] text-muted-foreground uppercase">
          Alpha
        </span>
        <input
          type="text"
          value={state.alpha ?? ""}
          placeholder="(none)"
          onChange={(e) =>
            onChange({ ...state, alpha: e.target.value || undefined })
          }
          aria-label="Alpha channel"
          className="h-8 flex-1 rounded border bg-background px-2 font-mono text-xs"
        />
      </label>
    </div>
  )
}

interface ChannelInputProps {
  index: number
  placeholder: string
  value: string
  onChange: (value: string) => void
}

function ChannelInput({
  index,
  placeholder,
  value,
  onChange,
}: ChannelInputProps) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[10px] text-muted-foreground">channel {index}</span>
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        aria-label={`Channel ${index} (${placeholder})`}
        className="h-8 rounded border bg-background px-2 font-mono text-xs"
      />
    </label>
  )
}
