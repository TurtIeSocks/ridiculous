import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { LP_UNITS } from "../clip-path-editor.constants"

export interface LengthPctEditorProps {
  label: string
  value: string
  onChange: (value: string) => void
  className?: string
}

/**
 * A number + unit-select editor for a CSS length-percentage. Values that are
 * not a recognizable `<number><lp-unit>` — `calc()`/`var()` or a bare keyword
 * like `auto`/`fit-content` — fall back to an opaque text input that preserves
 * the value verbatim (no unit coercion, no out-of-range controlled select).
 */
export function LengthPctEditor({
  label,
  value,
  onChange,
  className,
}: LengthPctEditorProps) {
  const m = value.match(/^(-?\d*\.?\d*)([a-z%]*)$/i)
  const numPart = m ? m[1] : value
  const unitPart = m ? m[2] : ""
  // Opaque (raw text) when the value is NOT a recognizable number + LP unit:
  // calc()/var() (no regex match), or a bare keyword like `auto` whose "unit"
  // is non-empty but not in LP_UNITS. An empty unit (e.g. "" or "0") stays a
  // unit select so a typed bare number gets a "%" suffix.
  const opaque =
    m === null ||
    (unitPart !== "" && !(LP_UNITS as readonly string[]).includes(unitPart))

  if (opaque) {
    return (
      <Input
        aria-label={label}
        value={value}
        spellCheck={false}
        autoComplete="off"
        onChange={(e) => onChange(e.target.value)}
        className={cn("h-8 w-[130px] font-mono text-xs", className)}
      />
    )
  }

  return (
    <span className={cn("inline-flex items-center", className)}>
      <Input
        aria-label={label}
        value={numPart}
        spellCheck={false}
        autoComplete="off"
        onChange={(e) => onChange(`${e.target.value}${unitPart || "%"}`)}
        className="h-8 w-[68px] rounded-r-none border-r-0 font-mono text-xs"
      />
      <select
        aria-label={`${label} unit`}
        value={unitPart || "%"}
        onChange={(e) => onChange(`${numPart || "0"}${e.target.value}`)}
        className="h-8 rounded-r-md rounded-l-none border border-input bg-background px-1 font-mono text-xs"
      >
        {LP_UNITS.map((u) => (
          <option key={u} value={u}>
            {u}
          </option>
        ))}
      </select>
    </span>
  )
}
