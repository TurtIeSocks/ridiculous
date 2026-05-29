import type {
  ColorFunctionMode,
  ColorFunctionState,
} from "./color-function.types"

// ---------------------------------------------------------------------------
// FamilySelect — switches the edited color-function family (shown only when
// the panel has no fixed `mode` prop).
// ---------------------------------------------------------------------------

const MODES: readonly ColorFunctionMode[] = [
  "color-mix",
  "relative",
  "light-dark",
]

interface FamilySelectProps {
  kind: ColorFunctionState["kind"]
  onChange: (next: ColorFunctionMode) => void
}

export function FamilySelect({ kind, onChange }: FamilySelectProps) {
  return (
    <label className="flex items-center gap-2 text-xs">
      <span className="text-muted-foreground">Family</span>
      <select
        aria-label="Color-function family"
        value={kind}
        onChange={(e) => onChange(e.target.value as ColorFunctionMode)}
        className="h-8 rounded border bg-background px-2 font-mono text-xs"
      >
        {MODES.map((m) => (
          <option key={m} value={m}>
            {m}
          </option>
        ))}
      </select>
    </label>
  )
}
