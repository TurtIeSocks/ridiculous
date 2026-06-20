"use client"

import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { matchesSyntax } from "./property-syntax-editor.helpers"

// ---------------------------------------------------------------------------
// InitialValueField (public) — the live demo of the dependent type. A demo
// `<input>` for a candidate `initial-value`, a green/red status badge driven by
// the runtime `matchesSyntax(syntax, value)` (the runtime mirror of the
// `InitialValueLiteral<Syntax, V>` type), and the `inherits` descriptor toggle.
// The badge carries `role="status"` so assistive tech announces match changes.
// `<color>` defers to color-picker's `isColorString` — so `#ff0000` is valid
// but the named color `red` is (correctly) rejected.
// ---------------------------------------------------------------------------

export interface InitialValueFieldProps {
  syntax: string
  value: string
  inherits: boolean
  onValueChange: (value: string) => void
  onInheritsChange: (inherits: boolean) => void
  className?: string
}

export function InitialValueField({
  syntax,
  value,
  inherits,
  onValueChange,
  onInheritsChange,
  className,
}: InitialValueFieldProps) {
  const valid = matchesSyntax(syntax, value)

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex flex-wrap items-center gap-2">
        <Input
          aria-label="initial value (demo)"
          value={value}
          spellCheck={false}
          autoComplete="off"
          placeholder="initial-value"
          onChange={(e) => onValueChange(e.target.value)}
          className="h-8 w-[200px] font-mono text-xs"
        />
        <span
          role="status"
          aria-label="initial value status"
          className={cn(
            "rounded-md px-2 py-1 font-mono text-xs",
            valid
              ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
              : "bg-red-500/15 text-red-600 dark:text-red-400",
          )}
        >
          {valid ? "valid" : "invalid"}
        </span>
      </div>

      <label className="flex h-8 w-fit items-center gap-1.5 rounded-md border border-input px-2 font-mono text-muted-foreground text-xs">
        <input
          type="checkbox"
          aria-label="inherits"
          checked={inherits}
          onChange={(e) => onInheritsChange(e.target.checked)}
          className="size-3.5"
        />
        inherits
      </label>
    </div>
  )
}
